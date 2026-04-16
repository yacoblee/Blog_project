/**
 * Notion HTML Export → Tiptap JSON 변환 + posts 테이블 INSERT
 *
 * 사용법:
 *   node scripts/importNotion.js               # 모든 .html 파일 import
 *   node scripts/importNotion.js --truncate    # posts 테이블 비우고 import
 *
 * 입력 위치:
 *   backend/scripts/notion_data/*.html         (Notion 'HTML 내보내기' 결과)
 *
 * 동작 요약:
 *   1) 각 HTML 파일에서 title / description / tags 추출
 *   2) .page-body 안의 노션 전용 마크업을 Tiptap이 이해 가능한 표준 HTML로 정리
 *   3) @tiptap/html generateJSON 으로 Tiptap JSON 문서 생성
 *   4) posts.content (JSONB) 에 저장
 */
require('dotenv').config()

const fs   = require('fs')
const path = require('path')
const { JSDOM } = require('jsdom')

// jsdom을 글로벌에 주입 — Tiptap(generateJSON 내부 ProseMirror)이 DOM API를 요구
const dom = new JSDOM('<!doctype html><html><body></body></html>')
global.window           = dom.window
global.document         = dom.window.document
global.DocumentFragment = dom.window.DocumentFragment
global.Node             = dom.window.Node
global.Element          = dom.window.Element
global.HTMLElement      = dom.window.HTMLElement
global.DOMParser        = dom.window.DOMParser
global.XMLSerializer    = dom.window.XMLSerializer
global.navigator        = dom.window.navigator

const { generateJSON } = require('@tiptap/html')
const StarterKit  = require('@tiptap/starter-kit').default
const Image       = require('@tiptap/extension-image').default
const Link        = require('@tiptap/extension-link').Link
const { Table }       = require('@tiptap/extension-table')
const { TableRow }    = require('@tiptap/extension-table-row')
const { TableHeader } = require('@tiptap/extension-table-header')
const { TableCell }   = require('@tiptap/extension-table-cell')
const Youtube     = require('@tiptap/extension-youtube').default

const pool = require('../src/config/db')

// ── 스크립트 옵션 ────────────────────────────────────────────
const SHOULD_TRUNCATE = process.argv.includes('--truncate')
const HTML_DIR        = path.join(__dirname, 'notion_data')
const DEFAULT_AUTHOR  = '안성훈'

// ── Tiptap 확장 — TiptapEditor.jsx와 동일하게 맞춤 ───────────
//   StarterKit이 link를 이미 포함하므로(중복 경고 방지) link: false 로 끄고
//   별도의 Link 확장을 그 자리에 추가
const extensions = [
  StarterKit.configure({
    heading: { levels: [1, 2, 3] },
    link: false,
  }),
  Link.configure({ openOnClick: false }),
  Image,
  Table.configure({ resizable: false }),
  TableRow,
  TableHeader,
  TableCell,
  Youtube,
]

// ── 카테고리 매핑 — 노션 태그 → DB categories.slug ──────────
//   매핑되지 않는 태그는 null (카테고리 미지정)
const CATEGORY_KEYWORDS = {
  frontend: [
    'react', 'frontend', '프론트', 'javascript', '자바스크립트',
    'css', 'html', 'next', 'vue', '슬라이드', '아코디안', '스크롤',
    '메뉴 탭', '백그라운드 이미지', '목차',
  ],
  backend: [
    'backend', '백엔드', 'spring', 'java', 'jpa', 'node', 'express',
    'token', 'sql', 'sqld', 'mysql', 'db ', ' db', 'jdbc',
    'collectionframework', '자료', '기본자료형', '기본 자료', 'function', 'view', 'index', 'join',
  ],
  devops: [
    'aws', 'docker', '배포', '인프라', 'devops', 'linux', '리눅스',
    'cicd', 'ci/cd', 'iam', '관리', '운영',
  ],
  daily: ['일상', '메모', 'daily', '회의', '업무', '문제 목록'],
}

function pickCategory(tags, title) {
  const haystack = [...tags, title || ''].map(s => s.toLowerCase())
  for (const [slug, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (haystack.some(s => keywords.some(k => s === k || s.includes(k)))) return slug
  }
  return null
}

// ── HTML 정리 (노션 전용 → 표준 HTML) ────────────────────────
//
// 노션 export의 page-body는 다음 같은 잡 마크업이 잔뜩 들어있다:
//   <div style="display:contents" dir="auto">…</div>
//   <ul class="bulleted-list"><li>…</li></ul>
//   <pre class="code code-wrap"><code class="language-bash">…</code></pre>
//   <script>, <link> (Prism 로더)
// 이를 Tiptap이 이해 가능한 형태로 평탄화한다.
function sanitizeBody(bodyEl) {
  // 1) 불필요한 노드 제거
  bodyEl.querySelectorAll('script, link, style').forEach(n => n.remove())
  bodyEl.querySelectorAll('img.icon, .property-icon').forEach(n => n.remove())
  // 노션 컬렉션(데이터베이스 임베드) 테이블은 제거 — 별도 페이지로 관리됨
  bodyEl.querySelectorAll('table.collection-content, .collection-content-wrapper').forEach(n => n.remove())

  // 2) display:contents 래퍼 unwrap
  bodyEl.querySelectorAll('div[style*="display:contents"]').forEach(div => {
    const parent = div.parentNode
    while (div.firstChild) parent.insertBefore(div.firstChild, div)
    parent.removeChild(div)
  })

  // 3) 코드 블록 정리
  bodyEl.querySelectorAll('pre.code').forEach(pre => {
    pre.removeAttribute('class')
    pre.removeAttribute('id')
    const code = pre.querySelector('code')
    if (code) {
      const lang = (code.className.match(/language-(\S+)/) || [, ''])[1]
      code.removeAttribute('style')
      code.className = lang ? `language-${lang}` : ''
    }
  })

  // 4) 리스트 클래스 제거
  bodyEl.querySelectorAll('ul.bulleted-list, ul.to-do-list').forEach(ul => ul.removeAttribute('class'))
  bodyEl.querySelectorAll('ol.numbered-list').forEach(ol => ol.removeAttribute('class'))
  bodyEl.querySelectorAll('li').forEach(li => {
    li.removeAttribute('style')
    li.removeAttribute('id')
  })

  // 5) 모든 노드의 노션 전용 id / inline style 제거
  bodyEl.querySelectorAll('*').forEach(el => {
    el.removeAttribute('id')
    if (el.tagName !== 'IMG') el.removeAttribute('style')
    el.removeAttribute('dir')
  })

  // 6) 로컬 파일 이미지(상대경로)는 깨지므로 src 비우거나 제거
  //    — 외부 URL(http/https)만 남기고 나머지는 지움
  bodyEl.querySelectorAll('img').forEach(img => {
    const src = img.getAttribute('src') || ''
    if (!/^https?:\/\//i.test(src)) img.remove()
  })

  // 7) figure → 그 안의 단일 img/iframe만 남기고 단순화
  bodyEl.querySelectorAll('figure').forEach(fig => {
    const inner = fig.querySelector('img, iframe')
    if (inner) fig.parentNode.replaceChild(inner, fig)
    else fig.remove()
  })

  // 8) 빈 paragraph 정리는 Tiptap이 자동으로 처리
  return bodyEl.innerHTML
}

// ── 파일 1개 → { title, description, tags, contentJson } ────
function parseNotionFile(filePath) {
  const html  = fs.readFileSync(filePath, 'utf8')
  const local = new JSDOM(html)
  const doc   = local.window.document

  // 메타데이터
  const title = doc.querySelector('h1.page-title')?.textContent?.trim() || path.basename(filePath, '.html')

  let description = ''
  doc.querySelectorAll('tr.property-row-text td').forEach(td => {
    if (!description) description = td.textContent.trim()
  })

  const tags = []
  doc.querySelectorAll('tr.property-row-multi_select .selected-value').forEach(el => {
    const t = el.textContent.trim()
    if (t) tags.push(t)
  })

  // 본문
  const body = doc.querySelector('.page-body')
  if (!body) return null

  const cleanedHtml = sanitizeBody(body)
  const json        = generateJSON(cleanedHtml, extensions)

  return { title, description, tags, contentJson: json }
}

// ── 메인 ──────────────────────────────────────────────────
async function main() {
  if (!fs.existsSync(HTML_DIR)) {
    console.error(`❌ 디렉터리 없음: ${HTML_DIR}`)
    process.exit(1)
  }

  const files = fs.readdirSync(HTML_DIR).filter(f => f.endsWith('.html'))
  if (files.length === 0) {
    console.error('❌ .html 파일이 없습니다.')
    process.exit(1)
  }
  console.log(`📂 ${files.length}개의 HTML 파일 발견`)

  const client = await pool.connect()
  try {
    if (SHOULD_TRUNCATE) {
      await client.query('TRUNCATE TABLE posts RESTART IDENTITY')
      console.log('🧹 posts 테이블 비움')
    }

    let success = 0
    let skipped = 0

    for (const file of files) {
      const fullPath = path.join(HTML_DIR, file)
      try {
        const parsed = parseNotionFile(fullPath)
        if (!parsed) {
          console.warn(`  ⚠ skip (no body): ${file}`)
          skipped++
          continue
        }

        const { title, description, tags, contentJson } = parsed
        const category  = pickCategory(tags, title)
        const readTime  = Math.max(1, Math.ceil(JSON.stringify(contentJson).length / 2000))

        await client.query(
          `INSERT INTO posts (title, content, category, thumbnail, author, read_time)
           VALUES ($1, $2::jsonb, $3, $4, $5, $6)`,
          [
            title,
            JSON.stringify(contentJson),
            category,
            null,                 // 썸네일은 노션 cover URL 사용 안 함
            DEFAULT_AUTHOR,
            readTime,
          ]
        )

        console.log(`  ✅ ${title}  [${category || '미분류'}]  태그: ${tags.join(', ') || '없음'}`)
        success++
      } catch (err) {
        console.error(`  ❌ ${file}: ${err.message}`)
        skipped++
      }
    }

    console.log(`\n🎉 완료 — 성공 ${success}건 / 스킵 ${skipped}건`)
  } finally {
    client.release()
    await pool.end()
  }
}

main().catch(err => {
  console.error('❌ 임포트 실패:', err)
  process.exit(1)
})
