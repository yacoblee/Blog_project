/**
 * Notion → PostgreSQL import 스크립트
 * 사용: node scripts/notion-import.js
 */
require('dotenv').config()
const { Pool } = require('pg')

const NOTION_TOKEN = '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'
const AUTHOR = '승현'

const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME     || 'postgres',
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD || '',
})

// ── Notion 데이터 소스 정의 ──────────────────────────────────
const SOURCES = [
  // Frontend
  { type: 'database', id: '33b39b93-692f-8065-a9cf-e46ecabce073', category: 'frontend' }, // 자바스크립트
  { type: 'database', id: '33b39b93-692f-8031-975f-ed34de37b5db', category: 'frontend' }, // 리액트

  // Backend (List DB 중 backend 항목들)
  { type: 'database_filtered', id: '05b0ed87-e5f0-48cf-848b-1c26a7a73738', category: 'backend',
    include: ['JAVA basic', 'JPA basic', 'DB', 'SQLD 틀린 개념 정리', 'SKT IAM 업무 정리'] },

  // Frontend (List DB 중 frontend 항목)
  { type: 'database_filtered', id: '05b0ed87-e5f0-48cf-848b-1c26a7a73738', category: 'frontend',
    include: ['JavaScript 구현한 기능', 'React / JS 개념'] },

  // DevOps
  { type: 'database_filtered', id: '05b0ed87-e5f0-48cf-848b-1c26a7a73738', category: 'devops',
    include: ['AWS 배포'] },
  { type: 'database', id: '4a95f6f2-e4ea-47c8-8786-708fef13e06f', category: 'devops' }, // 리눅스 마스터

  // Daily (SKT IAM 업무 List)
  { type: 'database_filtered', id: '14239b93-692f-8111-8faa-cf005707b7dc', category: 'daily',
    include: ['업무 기초', '회의'] },
  { type: 'database_filtered', id: '14239b93-692f-8111-8faa-cf005707b7dc', category: 'backend',
    include: ['IAM_MOBILE 서버', 'IAM 실시간 알람 프로세스', 'lagacy 코드분석', '배포/관리'] },
]

// ── Notion API 헬퍼 ──────────────────────────────────────────
async function notionFetch(path, method = 'GET', body = null) {
  const res = await fetch('https://api.notion.com/v1' + path, {
    method,
    headers: {
      'Authorization': 'Bearer ' + NOTION_TOKEN,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  return res.json()
}

// ── 블록 → 텍스트 변환 ──────────────────────────────────────
function richTextToStr(rich) {
  return (rich || []).map(t => t.plain_text).join('')
}

async function blocksToMarkdown(blockId, depth = 0) {
  const data = await notionFetch(`/blocks/${blockId}/children?page_size=100`)
  if (!data.results) return ''

  const lines = []
  for (const block of data.results) {
    const indent = '  '.repeat(depth)
    const type = block.type

    switch (type) {
      case 'heading_1':
        lines.push(`# ${richTextToStr(block.heading_1.rich_text)}`)
        break
      case 'heading_2':
        lines.push(`## ${richTextToStr(block.heading_2.rich_text)}`)
        break
      case 'heading_3':
        lines.push(`### ${richTextToStr(block.heading_3.rich_text)}`)
        break
      case 'paragraph':
        lines.push(`${indent}${richTextToStr(block.paragraph.rich_text)}`)
        break
      case 'bulleted_list_item':
        lines.push(`${indent}- ${richTextToStr(block.bulleted_list_item.rich_text)}`)
        break
      case 'numbered_list_item':
        lines.push(`${indent}1. ${richTextToStr(block.numbered_list_item.rich_text)}`)
        break
      case 'code':
        const lang = block.code.language || ''
        lines.push(`\`\`\`${lang}\n${richTextToStr(block.code.rich_text)}\n\`\`\``)
        break
      case 'quote':
        lines.push(`> ${richTextToStr(block.quote.rich_text)}`)
        break
      case 'callout':
        lines.push(`> ${richTextToStr(block.callout.rich_text)}`)
        break
      case 'divider':
        lines.push('---')
        break
      case 'toggle':
        lines.push(`**${richTextToStr(block.toggle.rich_text)}**`)
        break
      case 'child_page':
        lines.push(`[${block.child_page.title}]`)
        break
      default:
        // 기타 블록은 스킵
        break
    }

    // 하위 블록이 있으면 재귀 탐색
    if (block.has_children && ['toggle', 'bulleted_list_item', 'numbered_list_item', 'quote'].includes(type)) {
      const childContent = await blocksToMarkdown(block.id, depth + 1)
      if (childContent) lines.push(childContent)
    }
  }

  return lines.filter(l => l.trim() !== '').join('\n')
}

// ── 읽기 시간 계산 (분) ──────────────────────────────────────
function calcReadTime(text) {
  const wordCount = text.split(/\s+/).length
  return Math.max(1, Math.ceil(wordCount / 200))
}

// ── DB 쿼리 ──────────────────────────────────────────────────
async function queryDatabase(dbId) {
  const results = []
  let cursor = undefined

  do {
    const body = { page_size: 100 }
    if (cursor) body.start_cursor = cursor

    const data = await notionFetch(`/databases/${dbId}/query`, 'POST', body)
    if (!data.results) break

    results.push(...data.results)
    cursor = data.has_more ? data.next_cursor : undefined
  } while (cursor)

  return results
}

// ── 페이지 제목 추출 ─────────────────────────────────────────
function getPageTitle(page) {
  const titleProp = Object.values(page.properties).find(p => p.type === 'title')
  return titleProp?.title?.[0]?.plain_text || '(제목없음)'
}

// ── DB에 INSERT ───────────────────────────────────────────────
async function insertPost({ title, content, category, readTime }) {
  const query = `
    INSERT INTO posts (title, content, category, author, read_time, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
    ON CONFLICT DO NOTHING
    RETURNING id
  `
  const res = await pool.query(query, [title, content, category, AUTHOR, readTime])
  return res.rows[0]?.id
}

// ── 메인 ─────────────────────────────────────────────────────
async function main() {
  console.log('🚀 Notion import 시작...\n')
  let total = 0
  let skipped = 0

  for (const source of SOURCES) {
    const pages = await queryDatabase(source.id)

    for (const page of pages) {
      const title = getPageTitle(page)

      // filtered 타입이면 include 목록에 있는 것만 처리
      if (source.type === 'database_filtered') {
        if (!source.include.includes(title)) continue
      }

      // 제목없음 스킵
      if (title === '(제목없음)') {
        skipped++
        continue
      }

      process.stdout.write(`  처리중: [${source.category}] ${title} ... `)

      try {
        const content = await blocksToMarkdown(page.id)

        if (!content.trim()) {
          console.log('내용 없음, 스킵')
          skipped++
          continue
        }

        const readTime = calcReadTime(content)
        const id = await insertPost({ title, content, category: source.category, readTime })

        if (id) {
          console.log(`완료 (id=${id}, ${readTime}분)`)
          total++
        } else {
          console.log('중복, 스킵')
          skipped++
        }
      } catch (err) {
        console.log(`오류: ${err.message}`)
      }
    }
  }

  console.log(`\n✅ 완료! 총 ${total}개 추가, ${skipped}개 스킵`)
  await pool.end()
}

main().catch(err => {
  console.error('Fatal:', err)
  pool.end()
  process.exit(1)
})
