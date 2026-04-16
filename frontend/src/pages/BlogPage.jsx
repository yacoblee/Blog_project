import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { usePosts } from '../api/posts'
import { useCategories } from '../api/categories'
import { PostCard } from '../components/common'
import styles from './BlogPage.module.css'

const LIMIT = 8

export default function BlogPage() {
  const navigate = useNavigate()
  const isAdmin = useSelector(state => state.auth.isAdmin)

  const [searchParams, setSearchParams] = useSearchParams()
  const category  = searchParams.get('category') || null
  const pageParam = Number(searchParams.get('page') || '1')
  const searchParam = searchParams.get('search') || ''

  // 검색 input 로컬 상태 (엔터/버튼 누를 때만 URL 반영)
  const [searchInput, setSearchInput] = useState(searchParam)

  // URL search 파라미터가 바뀌면 input도 동기화
  useEffect(() => { setSearchInput(searchParam) }, [searchParam])

  const queryParams = {}
  if (category)    queryParams.category = category
  if (searchParam) queryParams.search   = searchParam
  queryParams.page  = pageParam
  queryParams.limit = LIMIT

  const { data, isLoading, error } = usePosts(queryParams)
  const { data: catData } = useCategories()

  const posts      = data?.data || []
  const pagination = data?.pagination || {}
  const totalPages = pagination.totalPages || 1

  const categories = [
    { label: '전체', value: null },
    ...(catData?.data || []).map(c => ({ label: c.name, value: c.slug })),
  ]

  // ── 파라미터 변경 헬퍼 ──────────────────────────────────
  const updateParams = (updates) => {
    const next = {}
    if (category)    next.category = category
    if (searchParam) next.search   = searchParam
    next.page = '1'
    setSearchParams({ ...next, ...updates })
  }

  const handleCategory = (value) => {
    const next = { page: '1' }
    if (value)       next.category = value
    if (searchParam) next.search   = searchParam
    setSearchParams(next)
  }

  const handleSearch = (e) => {
    e.preventDefault()
    const next = { page: '1' }
    if (category)          next.category = category
    if (searchInput.trim()) next.search   = searchInput.trim()
    setSearchParams(next)
  }

  const handleSearchClear = () => {
    setSearchInput('')
    const next = { page: '1' }
    if (category) next.category = category
    setSearchParams(next)
  }

  const handlePage = (p) => {
    updateParams({ page: String(p) })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ── Pagination 범위 계산 ─────────────────────────────────
  const getPaginationRange = () => {
    const delta = 2
    const range = []
    const left  = Math.max(1, pageParam - delta)
    const right = Math.min(totalPages, pageParam + delta)
    if (left > 1)          { range.push(1); if (left > 2) range.push('...') }
    for (let i = left; i <= right; i++) range.push(i)
    if (right < totalPages) { if (right < totalPages - 1) range.push('...'); range.push(totalPages) }
    return range
  }

  return (
    <div className={styles.page}>
      <section className={styles.header}>
        <h1 className={styles.title}>Blog</h1>
        <p className={styles.subtitle}>개발 경험과 학습을 기록합니다</p>
      </section>

      {/* 카테고리 + 검색 */}
      <section className={styles.filters}>
        <div className={styles.filterTop}>
          <div className={styles.categoryTabs}>
            {categories.map(cat => (
              <button
                key={cat.label}
                className={`${styles.tab} ${category === cat.value ? styles.active : ''}`}
                onClick={() => handleCategory(cat.value)}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* 검색 바 */}
        <form className={styles.searchBar} onSubmit={handleSearch}>
          <div className={styles.searchInputWrap}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="제목 또는 내용으로 검색..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
            />
            {searchInput && (
              <button type="button" className={styles.searchClear} onClick={handleSearchClear}>
                ✕
              </button>
            )}
          </div>
          <button type="submit" className={styles.searchBtn}>검색</button>
        </form>

        {searchParam && (
          <p className={styles.searchResult}>
            <strong>"{searchParam}"</strong> 검색 결과 — {pagination.total ?? 0}개
          </p>
        )}
      </section>

      {/* 포스트 목록 */}
      <section className={styles.postsSection}>
        {isLoading && <div className={styles.loading}>로딩 중...</div>}

        {error && (
          <div className={styles.error}>
            포스트를 불러올 수 없습니다. 다시 시도해주세요.
          </div>
        )}

        {!isLoading && posts.length === 0 && (
          <div className={styles.empty}>
            <p>{searchParam ? '검색 결과가 없습니다.' : '아직 포스트가 없습니다.'}</p>
          </div>
        )}

        {!isLoading && posts.length > 0 && (
          <>
            {/* 1페이지 첫 번째 글 Featured */}
            {pageParam === 1 && posts[0] && (
              <div className={styles.featured}>
                <PostCard post={posts[0]} variant="featured" />
              </div>
            )}

            {/* 그리드 */}
            <div className={styles.grid}>
              {(pageParam === 1 ? posts.slice(1) : posts).map(post => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          </>
        )}

        {/* 페이지네이션 */}
        {!isLoading && totalPages > 1 && (
          <div className={styles.pagination}>
            <button
              className={styles.pageBtn}
              disabled={pageParam <= 1}
              onClick={() => handlePage(pageParam - 1)}
            >
              ← 이전
            </button>

            <div className={styles.pageNumbers}>
              {getPaginationRange().map((p, i) =>
                p === '...'
                  ? <span key={`dots-${i}`} className={styles.pageDots}>…</span>
                  : <button
                      key={p}
                      className={`${styles.pageNumber} ${p === pageParam ? styles.pageActive : ''}`}
                      onClick={() => handlePage(p)}
                    >
                      {p}
                    </button>
              )}
            </div>

            <button
              className={styles.pageBtn}
              disabled={pageParam >= totalPages}
              onClick={() => handlePage(pageParam + 1)}
            >
              다음 →
            </button>
          </div>
        )}

        {/* 글 등록 버튼 (페이지네이션 하단) */}
        {isAdmin && !isLoading && (
          <div className={styles.newPostWrap}>
            <button
              className={styles.newPostBtn}
              onClick={() => navigate('/blog/new')}
            >
              ✏️ 새 글 등록
            </button>
          </div>
        )}
      </section>
    </div>
  )
}
