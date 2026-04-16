import { useRef, useEffect, useCallback } from 'react'
import styles from './HtmlEditor.module.css'

const TOOLBAR = [
  { group: 'format', items: [
    { label: 'B',  title: '굵게 (Ctrl+B)',    cmd: 'bold' },
    { label: 'I',  title: '기울임 (Ctrl+I)',   cmd: 'italic' },
    { label: 'U',  title: '밑줄 (Ctrl+U)',     cmd: 'underline' },
    { label: 'S',  title: '취소선',             cmd: 'strikethrough' },
  ]},
  { group: 'heading', items: [
    { label: 'H2', title: '제목 2',  cmd: 'formatBlock', val: 'h2' },
    { label: 'H3', title: '제목 3',  cmd: 'formatBlock', val: 'h3' },
    { label: 'P',  title: '본문',    cmd: 'formatBlock', val: 'p'  },
  ]},
  { group: 'list', items: [
    { label: '≡', title: '글머리 목록', cmd: 'insertUnorderedList' },
    { label: '№', title: '번호 목록',   cmd: 'insertOrderedList'   },
  ]},
  { group: 'block', items: [
    { label: '❝', title: '인용구',  cmd: 'formatBlock', val: 'blockquote' },
    { label: '—', title: '구분선',  cmd: 'insertHorizontalRule' },
  ]},
  { group: 'align', items: [
    { label: '⬛L', title: '왼쪽 정렬',   cmd: 'justifyLeft'   },
    { label: '⬛C', title: '가운데 정렬', cmd: 'justifyCenter' },
    { label: '⬛R', title: '오른쪽 정렬', cmd: 'justifyRight'  },
  ]},
]

export default function HtmlEditor({ value, onChange, placeholder }) {
  const editorRef = useRef(null)
  const isComposing = useRef(false)

  // 외부 value가 바뀔 때만 innerHTML 동기화 (커서 안 날리게)
  useEffect(() => {
    const el = editorRef.current
    if (!el) return
    if (el.innerHTML !== value) {
      el.innerHTML = value || ''
    }
  }, [value])

  const exec = useCallback((cmd, val) => {
    editorRef.current?.focus()
    document.execCommand(cmd, false, val ?? null)
    // 변경 내용 부모에 전달
    if (onChange) onChange(editorRef.current.innerHTML)
  }, [onChange])

  const handleInput = () => {
    if (isComposing.current) return
    if (onChange) onChange(editorRef.current.innerHTML)
  }

  const handleLink = () => {
    const url = window.prompt('링크 URL을 입력하세요:', 'https://')
    if (url) exec('createLink', url)
  }

  const handleKeyDown = (e) => {
    // Tab → 들여쓰기
    if (e.key === 'Tab') {
      e.preventDefault()
      exec('insertHTML', '&nbsp;&nbsp;&nbsp;&nbsp;')
    }
  }

  return (
    <div className={styles.wrap}>
      {/* ── Toolbar ── */}
      <div className={styles.toolbar}>
        {TOOLBAR.map((group, gi) => (
          <span key={gi} className={styles.group}>
            {group.items.map(({ label, title, cmd, val }) => (
              <button
                key={label}
                type="button"
                title={title}
                className={styles.toolBtn}
                onMouseDown={e => {
                  e.preventDefault() // 포커스 유지
                  exec(cmd, val)
                }}
              >
                {label}
              </button>
            ))}
          </span>
        ))}

        {/* 링크 버튼 (별도 처리) */}
        <span className={styles.group}>
          <button
            type="button"
            title="링크 삽입"
            className={styles.toolBtn}
            onMouseDown={e => { e.preventDefault(); handleLink() }}
          >
            🔗
          </button>
        </span>

        {/* 폰트 색상 */}
        <span className={styles.group}>
          <label className={styles.colorLabel} title="글자 색상">
            <span className={styles.toolBtn}>A</span>
            <input
              type="color"
              className={styles.colorInput}
              onInput={e => exec('foreColor', e.target.value)}
            />
          </label>
        </span>
      </div>

      {/* ── Content Editable ── */}
      <div
        ref={editorRef}
        className={styles.editor}
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder || '내용을 입력하세요...'}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onCompositionStart={() => { isComposing.current = true }}
        onCompositionEnd={() => {
          isComposing.current = false
          if (onChange) onChange(editorRef.current.innerHTML)
        }}
      />
    </div>
  )
}
