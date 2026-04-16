import { useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image  from '@tiptap/extension-image'
import Link   from '@tiptap/extension-link'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableHeader } from '@tiptap/extension-table-header'
import { TableCell } from '@tiptap/extension-table-cell'
import Youtube     from '@tiptap/extension-youtube'

import styles from './TiptapEditor.module.css'

/**
 * Tiptap 에디터 (작성/수정 전용)
 *
 * Props
 * ─────
 * value       : 초기 내용 — Tiptap JSON(object) 또는 그 문자열(JSON.stringify된 형태)
 *               null/빈값이면 빈 문서로 시작
 * onChange    : (jsonObject) => void
 *               에디터 변경 시 editor.getJSON() 결과(Object)를 그대로 전달
 *               → 부모는 저장 시 JSON.stringify(value)로 직렬화
 * placeholder : 빈 에디터에 보일 안내 문구 (CSS data-placeholder로 처리)
 */
export default function TiptapEditor({ value, onChange, placeholder }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // StarterKit 기본 셋: paragraph, heading, bold, italic, strike,
        //                    bulletList, orderedList, blockquote, codeBlock,
        //                    horizontalRule, hardBreak, history, ...
        heading: { levels: [1, 2, 3] },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      }),
      Image,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Youtube.configure({ controls: true, nocookie: true }),
    ],
    content: parseInitial(value),
    editorProps: {
      attributes: {
        class: styles.editor,
        'data-placeholder': placeholder || '내용을 입력하세요...',
      },
    },
    onUpdate: ({ editor }) => {
      // 노션처럼 작성된 내용을 Tiptap JSON 객체로 부모에 전달
      onChange?.(editor.getJSON())
    },
  })

  /* 외부에서 value 가 비동기로 들어오는 경우(수정 모드 로딩 완료 시점)
     에디터 내부 문서를 동기화 — 동일한 내용이면 setContent 안 함 (커서 보호) */
  useEffect(() => {
    if (!editor) return
    const incoming = parseInitial(value)
    const current  = editor.getJSON()
    if (incoming && JSON.stringify(incoming) !== JSON.stringify(current)) {
      editor.commands.setContent(incoming, { emitUpdate: false })
    }
  }, [value, editor])

  if (!editor) return null

  return (
    <div className={styles.wrap}>
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  )
}

/* ────────────────────────────────────────────────────────────
 * value 정규화
 *  - object       → 그대로 사용
 *  - JSON 문자열  → JSON.parse
 *  - 잘못된 값    → 빈 문서
 * ──────────────────────────────────────────────────────────── */
function parseInitial(value) {
  if (!value) return { type: 'doc', content: [] }
  if (typeof value === 'object') return value
  try {
    const parsed = JSON.parse(value)
    if (parsed && typeof parsed === 'object') return parsed
  } catch {
    /* HTML/Markdown 등 비-JSON 데이터(레거시 글)도 깨지지 않게 빈 문서로 fallback */
  }
  return { type: 'doc', content: [] }
}

/* ────────────────────────────────────────────────────────────
 * Toolbar — 노션 스타일 기본 액션
 *  버튼 클릭이 포커스를 빼앗지 않도록 onMouseDown e.preventDefault()
 * ──────────────────────────────────────────────────────────── */
function Toolbar({ editor }) {
  const btn = (action, isActive, label, title) => (
    <button
      type="button"
      title={title}
      className={`${styles.toolBtn} ${isActive ? styles.toolBtnActive : ''}`}
      onMouseDown={(e) => { e.preventDefault(); action() }}
    >
      {label}
    </button>
  )

  const setLink = () => {
    const prev = editor.getAttributes('link').href || ''
    const url  = window.prompt('링크 URL을 입력하세요:', prev || 'https://')
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  const insertImage = () => {
    const url = window.prompt('이미지 URL을 입력하세요:', 'https://')
    if (url) editor.chain().focus().setImage({ src: url }).run()
  }

  const insertYoutube = () => {
    const url = window.prompt('YouTube URL을 입력하세요:', 'https://www.youtube.com/watch?v=')
    if (url) editor.chain().focus().setYoutubeVideo({ src: url }).run()
  }

  const insertTable = () =>
    editor.chain().focus()
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run()

  return (
    <div className={styles.toolbar}>
      <span className={styles.group}>
        {btn(() => editor.chain().focus().toggleBold().run(),       editor.isActive('bold'),       'B',  '굵게 (Ctrl+B)')}
        {btn(() => editor.chain().focus().toggleItalic().run(),     editor.isActive('italic'),     'I',  '기울임 (Ctrl+I)')}
        {btn(() => editor.chain().focus().toggleStrike().run(),     editor.isActive('strike'),     'S',  '취소선')}
        {btn(() => editor.chain().focus().toggleCode().run(),       editor.isActive('code'),       '<>', '인라인 코드')}
      </span>

      <span className={styles.group}>
        {btn(() => editor.chain().focus().toggleHeading({ level: 1 }).run(), editor.isActive('heading', { level: 1 }), 'H1', '제목 1')}
        {btn(() => editor.chain().focus().toggleHeading({ level: 2 }).run(), editor.isActive('heading', { level: 2 }), 'H2', '제목 2')}
        {btn(() => editor.chain().focus().toggleHeading({ level: 3 }).run(), editor.isActive('heading', { level: 3 }), 'H3', '제목 3')}
        {btn(() => editor.chain().focus().setParagraph().run(),              editor.isActive('paragraph'),             'P',  '본문')}
      </span>

      <span className={styles.group}>
        {btn(() => editor.chain().focus().toggleBulletList().run(),  editor.isActive('bulletList'),  '•',  '글머리 목록')}
        {btn(() => editor.chain().focus().toggleOrderedList().run(), editor.isActive('orderedList'), '1.', '번호 목록')}
        {btn(() => editor.chain().focus().toggleTaskList?.().run?.(), false, '☐', '체크리스트(옵션)')}
      </span>

      <span className={styles.group}>
        {btn(() => editor.chain().focus().toggleBlockquote().run(),  editor.isActive('blockquote'), '❝',  '인용')}
        {btn(() => editor.chain().focus().toggleCodeBlock().run(),   editor.isActive('codeBlock'),  '{ }', '코드 블록')}
        {btn(() => editor.chain().focus().setHorizontalRule().run(), false,                          '—',  '구분선')}
      </span>

      <span className={styles.group}>
        {btn(setLink,        editor.isActive('link'), '🔗', '링크')}
        {btn(insertImage,    false,                   '🖼', '이미지')}
        {btn(insertYoutube,  false,                   '▶',  'YouTube')}
        {btn(insertTable,    false,                   '⊞',  '표 삽입')}
      </span>

      <span className={styles.group}>
        {btn(() => editor.chain().focus().undo().run(), false, '↶', '실행 취소')}
        {btn(() => editor.chain().focus().redo().run(), false, '↷', '다시 실행')}
      </span>
    </div>
  )
}
