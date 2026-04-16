import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { usePost, useCreatePost, useUpdatePost, useDeletePost } from '../api/posts'
import { useCategories } from '../api/categories'
import TiptapEditor from '../components/common/TiptapEditor'
import styles from './PostFormPage.module.css'

const EMPTY_DOC = { type: 'doc', content: [] }

/* 문서가 사실상 비어있는지 확인 (빈 paragraph만 있는 경우 포함) */
function isEmptyDoc(doc) {
  if (!doc || !Array.isArray(doc.content) || doc.content.length === 0) return true
  return doc.content.every(node => {
    if (node.type !== 'paragraph') return false
    if (!node.content || node.content.length === 0) return true
    return node.content.every(c => c.type === 'text' && !c.text?.trim())
  })
}

/* DB로부터 받은 content(JSON object 또는 string)를 doc으로 정규화 */
function toDoc(raw) {
  if (!raw) return EMPTY_DOC
  if (typeof raw === 'object') return raw
  try {
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object') return parsed
  } catch {
    /* 레거시 HTML/MD 등 → 빈 문서에서 새로 작성 */
  }
  return EMPTY_DOC
}

export default function PostFormPage() {
  const { id }   = useParams()
  const isEdit   = Boolean(id)
  const navigate = useNavigate()
  const isAdmin  = useSelector(state => state.auth.isAdmin)

  // 권한 없으면 튕겨내기
  useEffect(() => {
    if (!isAdmin) navigate('/blog', { replace: true })
  }, [isAdmin, navigate])

  const { data: postData, isLoading: postLoading } = usePost(isEdit ? id : null)
  const { data: catData }  = useCategories()
  const createPost = useCreatePost()
  const updatePost = useUpdatePost()
  const deletePost = useDeletePost()

  const categories = catData?.data || []

  const [form, setForm] = useState({
    title:     '',
    content:   EMPTY_DOC,   // ◄── Tiptap JSON object (문자열 아님)
    category:  '',
    thumbnail: '',
    author:    '',
    read_time: '',
  })
  const [error, setError] = useState('')

  // 수정 모드: 기존 데이터 채우기
  useEffect(() => {
    if (isEdit && postData?.data) {
      const p = postData.data
      setForm({
        title:     p.title     || '',
        content:   toDoc(p.content),
        category:  p.category  || '',
        thumbnail: p.thumbnail || '',
        author:    p.author    || '',
        read_time: p.read_time != null ? String(p.read_time) : '',
      })
    }
  }, [isEdit, postData])

  const set = (field) => (e) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }))

  // Tiptap → JSON 객체로 받아 그대로 보관
  const handleContentChange = (json) =>
    setForm(prev => ({ ...prev, content: json }))

  const handleSubmit = async (e) => {
    e?.preventDefault()
    setError('')
    if (!form.title.trim())  return setError('제목을 입력해주세요.')
    if (isEmptyDoc(form.content)) return setError('내용을 입력해주세요.')

    const payload = {
      title:     form.title,
      // ✱ 백엔드(JSONB 컬럼)로 보낼 때는 직렬화된 JSON 문자열로 전송
      //   서버는 받은 문자열을 JSON.parse해 jsonb로 저장
      content:   JSON.stringify(form.content),
      read_time: form.read_time ? Number(form.read_time) : null,
      thumbnail: form.thumbnail || null,
      author:    form.author    || null,
      category:  form.category  || null,
    }

    try {
      if (isEdit) {
        await updatePost.mutateAsync({ id, ...payload })
        navigate(`/blog/${id}`)
      } else {
        const res = await createPost.mutateAsync(payload)
        navigate(`/blog/${res.data.id}`)
      }
    } catch {
      setError('저장에 실패했습니다. 다시 시도해주세요.')
    }
  }

  const handleDelete = async () => {
    if (!window.confirm(`"${form.title}" 게시글을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) return
    try {
      await deletePost.mutateAsync(id)
      navigate('/blog')
    } catch {
      setError('삭제에 실패했습니다.')
    }
  }

  const isPending = createPost.isPending || updatePost.isPending

  if (isEdit && postLoading) {
    return <div className={styles.loading}>로딩 중...</div>
  }

  return (
    <div className={styles.page}>
      {/* ── Header ── */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          ← 뒤로
        </button>
        <h1 className={styles.title}>{isEdit ? '글 수정' : '새 글 작성'}</h1>
        <div className={styles.headerActions}>
          {isEdit && (
            <button
              type="button"
              className={styles.deleteHeaderBtn}
              onClick={handleDelete}
              disabled={deletePost.isPending}
            >
              🗑️ 삭제
            </button>
          )}
          <button
            type="button"
            className={styles.submitBtn}
            onClick={handleSubmit}
            disabled={isPending}
          >
            {isPending ? '저장 중...' : isEdit ? '수정 완료' : '게시하기'}
          </button>
        </div>
      </div>

      {error && <div className={styles.errorBanner}>{error}</div>}

      {/* ── Form ── */}
      <div className={styles.body}>
        {/* 제목 */}
        <input
          className={styles.titleInput}
          type="text"
          placeholder="제목을 입력하세요..."
          value={form.title}
          onChange={set('title')}
        />

        {/* 메타 필드 */}
        <div className={styles.metaRow}>
          <select className={styles.select} value={form.category} onChange={set('category')}>
            <option value="">카테고리 선택</option>
            {categories.map(c => (
              <option key={c.id} value={c.slug}>{c.name}</option>
            ))}
          </select>

          <input
            className={styles.metaInput}
            type="text"
            placeholder="작성자"
            value={form.author}
            onChange={set('author')}
          />

          <input
            className={styles.metaInput}
            type="number"
            placeholder="읽기 시간(분)"
            value={form.read_time}
            onChange={set('read_time')}
            min="1"
          />

          <input
            className={`${styles.metaInput} ${styles.metaInputWide}`}
            type="text"
            placeholder="썸네일 URL (선택)"
            value={form.thumbnail}
            onChange={set('thumbnail')}
          />
        </div>

        {/* Tiptap 에디터 (JSON 입출력) */}
        <TiptapEditor
          value={form.content}
          onChange={handleContentChange}
          placeholder="노션처럼 글을 작성해 보세요..."
        />
      </div>
    </div>
  )
}
