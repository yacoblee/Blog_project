import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useDeletePost } from '../../api/posts'
import styles from './PostCard.module.css'

/**
 * Tiptap JSON / 문자열 / null 어떤 형태든 받아 plain text로 변환.
 *  - 문자열   → 그대로
 *  - JSON     → 모든 text 노드를 평탄화해 공백으로 연결
 *  - 그 외    → ''
 */
function extractText(content) {
  if (!content) return ''
  if (typeof content === 'string') {
    // 과거 HTML/Markdown 형태가 들어올 가능성 대비 — 태그 제거
    return content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  }
  // Tiptap JSON 노드
  let buf = ''
  const walk = (node) => {
    if (!node) return
    if (typeof node.text === 'string') buf += node.text + ' '
    if (Array.isArray(node.content)) node.content.forEach(walk)
  }
  walk(content)
  return buf.replace(/\s+/g, ' ').trim()
}

function makeExcerpt(content, max = 120) {
  const text = extractText(content)
  if (!text) return ''
  return text.length > max ? text.slice(0, max) + '...' : text
}

export default function PostCard({ post, variant = 'default' }) {
  const navigate  = useNavigate()
  const isAdmin   = useSelector(state => state.auth.isAdmin)
  const deletePost = useDeletePost()

  const { id, title, excerpt, content, category, created_at, author, thumbnail } = post

  const isFeatured  = variant === 'featured'
  const displayText = excerpt || makeExcerpt(content)
  const formattedDate = new Date(created_at).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
  
  console.log('포스트 데이터:', post.created_at)

  const handleEdit = (e) => {
    e.preventDefault()
    e.stopPropagation()
    navigate(`/blog/${id}/edit`)
  }

  const handleDelete = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!window.confirm(`"${title}" 게시글을 삭제하시겠습니까?`)) return
    deletePost.mutate(id)
  }

  return (
    <article className={`${styles.card} ${styles[`card--${variant}`]}`}>
      {thumbnail && (
        <div className={styles.thumbnail}>
          <img src={thumbnail} alt={title} />
          {isFeatured && <div className={styles.featuredBadge}>FEATURED</div>}
        </div>
      )}

      <div className={styles.content}>
        <div className={styles.meta}>
          {category && <span className={styles.category}>{category}</span>}
          <time className={styles.date}>{formattedDate}</time>
        </div>

        <h2 className={styles.title}>{title}</h2>
        <p className={styles.excerpt}>{displayText}</p>

        <div className={styles.footer}>
          {author && <span className={styles.author}>by {author}</span>}
          <button
            className={styles.link}
            onClick={() => navigate(`/blog/${id}`)}
          >
            자세히 보기 →
          </button>
        </div>

        {/* 관리자 액션 버튼 */}
        {isAdmin && (
          <div className={styles.adminActions}>
            <button className={styles.editBtn} onClick={handleEdit}>
              ✏️ 수정
            </button>
            <button
              className={styles.deleteBtn}
              onClick={handleDelete}
              disabled={deletePost.isPending}
            >
              🗑️ 삭제
            </button>
          </div>
        )}
      </div>
    </article>
  )
}
