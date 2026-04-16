import { useEffect, useMemo } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit  from '@tiptap/starter-kit'
import Image       from '@tiptap/extension-image'
import Link        from '@tiptap/extension-link'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableHeader } from '@tiptap/extension-table-header'
import { TableCell } from '@tiptap/extension-table-cell'
import Youtube     from '@tiptap/extension-youtube'

import styles from './TiptapEditor.module.css'

/**
 * Tiptap 읽기 전용 뷰어
 *  - DB에서 받아온 JSON(Object 또는 JSON 문자열)을 그대로 주입
 *  - editable: false → 사용자는 수정 불가, 그러나 같은 스키마/스타일로 렌더
 *  - 결과적으로 마크다운 코드가 아닌 "완성된 디자인의 게시글"이 나타남
 */
export default function TiptapViewer({ content, className }) {
  const docJson = useMemo(() => normalize(content), [content])

  const editor = useEditor({
    editable: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Link.configure({
        openOnClick: true,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      }),
      Image,
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      Youtube.configure({ controls: true, nocookie: true }),
    ],
    content: docJson,
    editorProps: {
      attributes: {
        class: `${styles.viewer} ${className || ''}`,
      },
    },
  })

  /* content가 바뀌면 뷰어 내부 문서 갱신 */
  useEffect(() => {
    if (!editor) return
    editor.commands.setContent(docJson, { emitUpdate: false })
  }, [docJson, editor])

  if (!editor) return null
  return <EditorContent editor={editor} />
}

/* DB 데이터 정규화
 *  - object       : 그대로
 *  - JSON string  : parse
 *  - 잘못된 값    : 빈 문서
 *  - (레거시 HTML/MD): 빈 문서로 fallback — 필요 시 별도 LegacyRenderer 분기 가능
 */
function normalize(content) {
  if (!content) return { type: 'doc', content: [] }
  if (typeof content === 'object') return content
  try {
    const parsed = JSON.parse(content)
    if (parsed && typeof parsed === 'object') return parsed
  } catch {
    /* fallthrough */
  }
  return { type: 'doc', content: [] }
}
