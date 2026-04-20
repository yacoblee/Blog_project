import { useParams, Link, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { usePost, useDeletePost } from '../api/posts'
import { Button, TiptapViewer } from '../components/common'
import styles from './PostDetailPage.module.css'

export default function PostDetailPage() {
  const { id }    = useParams()
  const navigate  = useNavigate()
  const isAdmin   = useSelector(state => state.auth.isAdmin)
  const { data, isLoading, error } = usePost(id)
  const deletePost = useDeletePost()
  const post = data?.data

  const handleDelete = async () => {
    if (!window.confirm(`"${post.title}" 게시글을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) return
    await deletePost.mutateAsync(id)
    navigate('/blog')
  }

  if (isLoading) {
    return <div className={styles.loading}>로딩 중...</div>
  }

  if (error || !post) {
    return (
      <div className={styles.error}>
        <h2>포스트를 찾을 수 없습니다</h2>
        <p>요청하신 포스트가 존재하지 않습니다.</p>
        <Button variant="primary" onClick={() => navigate('/blog')}>
          블로그로 돌아가기
        </Button>
      </div>
    )
  }
  console.log('포스트 데이터:', post.created_at)
  const formattedDate = new Date(post.created_at).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
  })

  return (
    <article className={styles.page}>
      {/* 헤더 */}
      <header className={styles.header}>
        {post.thumbnail && (
          <div className={styles.thumbnail}>
            <img src={post.thumbnail} alt={post.title} />
          </div>
        )}

        <div className={styles.headerContent}>
          <div className={styles.meta}>
            {post.category && (
              <span className={styles.category}>{post.category}</span>
            )}
            <time className={styles.date}>{formattedDate}</time>
          </div>

          <h1 className={styles.title}>{post.title}</h1>

          <div className={styles.stats}>
            {post.author    && <span>✍️ {post.author}</span>}
            {post.read_time && <span>⏱️ {post.read_time}분</span>}
          </div>
        </div>
      </header>

      {/* 본문 — DB의 Tiptap JSON 을 그대로 뷰어에 주입 */}
      <div className={styles.container}>
        <div className={styles.content}>
          <TiptapViewer content={post.content} className={styles.body} />
        </div>

        {/* 사이드바 */}
        <aside className={styles.sidebar}>
          <div className={styles.toc}>
            <h3>목차</h3>
            <p style={{ fontSize: '13px', opacity: 0.6 }}>자동 생성 예정</p>
          </div>
        </aside>
      </div>

      {/* Navigation */}
      <nav className={styles.nav}>
        <Link to="/blog" className={styles.backLink}>
          ← 목록으로
        </Link>

        {isAdmin && (
          <div className={styles.adminNav}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/blog/${id}/edit`)}
            >
              ✏️ 수정하기
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={styles.deleteNavBtn}
              onClick={handleDelete}
              disabled={deletePost.isPending}
            >
              🗑️ 삭제
            </Button>
          </div>
        )}
      </nav>
    </article>
  )
}
