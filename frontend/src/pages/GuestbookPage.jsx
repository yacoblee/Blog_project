import React, { useState, useEffect, useRef} from 'react';
import { useSelector } from 'react-redux'
import {
  useGuestbook,
  useCreateEntry,
  useUpdateEntry,
  useDeleteEntry,
  useAdminDeleteEntry,
  useCreateReply,
} from '../api/guestbook'
import styles from './GuestbookPage.module.css'

// ── 비밀번호 모달 ─────────────────────────────────────────
function PasswordModal({ mode, entry, onClose }) {
  const [password, setPassword] = useState('')
  const [content,  setContent]  = useState(entry?.content || '')
  const [error,    setError]    = useState('')

  const updateEntry = useUpdateEntry()
  const deleteEntry = useDeleteEntry()
  const isPending   = updateEntry.isPending || deleteEntry.isPending

  const handleConfirm = async () => {
    setError('')
    try {
      if (mode === 'edit') {
        await updateEntry.mutateAsync({ id: entry.id, content, password })
      } else {
        await deleteEntry.mutateAsync({ id: entry.id, password })
      }
      onClose()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && mode === 'delete') {
      e.preventDefault()
      handleConfirm()
    }
  }

  return (
    <div className={styles.pwOverlay} onClick={onClose}>
      <div className={styles.pwModal} onClick={e => e.stopPropagation()}>
        <h3 className={styles.pwTitle}>
          {mode === 'edit' ? '댓글 수정' : '댓글 삭제'}
        </h3>

        {mode === 'edit' && (
          <textarea
            className={styles.pwEditTextarea}
            value={content}
            onChange={e => setContent(e.target.value)}
            maxLength={500}
            placeholder="수정할 내용..."
          />
        )}

        <input
          className={styles.pwInput}
          type="password"
          placeholder="비밀번호를 입력하세요"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
        />

        {error && <p className={styles.pwError}>{error}</p>}

        <div className={styles.pwBtns}>
          <button className={styles.pwCancel} onClick={onClose}>취소</button>
          <button
            className={styles.pwConfirm}
            onClick={handleConfirm}
            disabled={isPending || !password}
          >
            {isPending ? '처리 중...' : mode === 'edit' ? '수정' : '삭제'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── 답글 컴포넌트 (관리자 대댓글 — 우측 정렬, 주황색) ────
function ReplyItem({ reply, isAdmin }) {
  const adminDelete = useAdminDeleteEntry()

  const date = new Date(reply.created_at).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'short', day: 'numeric',
  })

  const handleDelete = () => {
    if (!window.confirm('이 답글을 삭제하시겠습니까?')) return
    adminDelete.mutate(reply.id)
  }

  return (
    <div className={styles.reply}>
      <div className={styles.replyBubble}>
        <div className={styles.replyHeader}>
          <span className={styles.replyBadge}>관리자</span>
          <span className={styles.replyName}>{reply.name}</span>
          <span className={styles.replyDate}>{date}</span>
        </div>
        <div className={styles.replyBody}>{reply.content}</div>
      </div>
      {isAdmin && (
        <div className={styles.replyActions}>
          <button
            className={`${styles.actionBtn} ${styles.deleteBtn}`}
            onClick={handleDelete}
          >
            삭제
          </button>
        </div>
      )}
    </div>
  )
}

// ── 댓글 카드 (최상위 — 좌측 정렬) ─────────────────────────
function CommentCard({ entry, isAdmin }) {
  const [modal,     setModal]     = useState(null)    // 'edit' | 'delete' | null
  const [replyText, setReplyText] = useState('')
  const [showReply, setShowReply] = useState(false)

  const adminDelete = useAdminDeleteEntry()
  const createReply = useCreateReply()

  const date = new Date(entry.created_at).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'short', day: 'numeric',
  })

  const isEdited = entry.updated_at && entry.updated_at !== entry.created_at

  const handleAdminDelete = () => {
    if (!window.confirm(`"${entry.name}" 님의 댓글을 삭제하시겠습니까?`)) return
    adminDelete.mutate(entry.id)
  }

  const handleReplySubmit = async () => {
    if (!replyText.trim()) return
    await createReply.mutateAsync({ parentId: entry.id, content: replyText })
    setReplyText('')
    setShowReply(false)
  }

  const initials = entry.name.charAt(0).toUpperCase()

  return (
    <div className={styles.comment}>
      {/* 댓글 헤더 */}
      <div className={styles.commentHeader}>
        <div className={styles.avatar}>{initials}</div>
        <div className={styles.commentMeta}>
          <span className={styles.commentName}>{entry.name}</span>
          <span className={styles.commentDate}>
            {' · '}{date}
            {isEdited && <span className={styles.editedBadge}>(수정됨)</span>}
          </span>
        </div>
      </div>

      {/* 댓글 본문 */}
      <div className={styles.commentBody}>{entry.content}</div>

      {/* 액션 버튼 */}
      <div className={styles.commentActions}>
        {/* 일반 사용자: 수정/삭제 (비밀번호) */}
        <button className={styles.actionBtn} onClick={() => setModal('edit')}>
          수정
        </button>
        <button
          className={`${styles.actionBtn} ${styles.deleteBtn}`}
          onClick={isAdmin ? handleAdminDelete : () => setModal('delete')}
        >
          삭제
        </button>
        {/* 관리자: 답글 */}
        {isAdmin && (
          <button className={styles.actionBtn} onClick={() => setShowReply(prev => !prev)}>
            답글
          </button>
        )}
      </div>

      {/* 관리자 답글 작성 폼 */}
      {showReply && isAdmin && (
        <div className={styles.replyForm}>
          <input
            className={styles.replyInput}
            type="text"
            placeholder="답글을 입력하세요..."
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleReplySubmit() }}
          />
          <button
            className={styles.replySubmitBtn}
            onClick={handleReplySubmit}
            disabled={createReply.isPending || !replyText.trim()}
          >
            {createReply.isPending ? '...' : '등록'}
          </button>
        </div>
      )}

      {/* 답글 목록 (관리자 대댓글 — 우측 정렬) */}
      {entry.replies?.length > 0 && (
        <div className={styles.replies}>
          {entry.replies.map(r => (
            <ReplyItem key={r.id} reply={r} isAdmin={isAdmin} />
          ))}
        </div>
      )}

      {/* 비밀번호 모달 */}
      {modal && (
        <PasswordModal
          mode={modal}
          entry={entry}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}

 

// ── 메인 페이지 ──────────────────────────────────────────
export default function GuestbookPage() {
  const isAdmin = useSelector(state => state.auth.isAdmin)

  const [page, setPage] = useState(1)
  const { data, isLoading, error: fetchError } = useGuestbook(page)

  const createEntry = useCreateEntry()

  const [form, setForm] = useState({ name: '', content: '', password: '' })
  const [formError, setFormError] = useState('')

  const entries    = data?.data       || []
  const pagination = data?.pagination || {}

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')

    if (!form.name.trim())    return setFormError('이름을 입력해주세요.')
    if (!form.content.trim()) return setFormError('내용을 입력해주세요.')
    if (!form.password || form.password.length < 4)
      return setFormError('비밀번호는 4자 이상 입력해주세요.')

    try {
      await createEntry.mutateAsync({
        name:     form.name.trim(),
        content:  form.content.trim(),
        password: form.password,
      })
      setForm({ name: '', content: '', password: '' })
    } catch (err) {
      setFormError(err.message)
    }
  }

  const totalPages = pagination.totalPages || 1
  const pageNumbers = []
  for (let i = 1; i <= totalPages; i++) pageNumbers.push(i)

    function TypewriterHeader({ text = '', speed = 35, loop = false, pause = 1500, className = '' }) {
    const [displayed, setDisplayed] = useState('')
    const [done, setDone] = useState(false)
    const timerRef = useRef(null)

    useEffect(() => {
      let i = 0
      setDisplayed('')
      setDone(false)

      const tick = () => {
        setDisplayed(text.slice(0, i))
        if (i === text.length) {
          setDone(true)
          if (loop) timerRef.current = setTimeout(() => { i = 0; setDone(false); tick() }, pause)
          return
        }
        i++
        timerRef.current = setTimeout(tick, speed + Math.random() * (speed * 0.5))
      }

      tick()
      return () => clearTimeout(timerRef.current)
    }, [text, speed, loop, pause])

    return (
      <span className={`${className} ${done ? styles.twDone : ''}`}>
        {displayed}
      </span>
    )
  }
 
    
  return (
    <div className={styles.page}>

    <section className={styles.hero}>
    <span className={styles.heroLabel}>01 · GUESTBOOK</span>

      <div className={styles.heroPromptWrap}>
        <div className={styles.heroPrompt}>
          <TypewriterHeader
            text="방명록에 글을 남겨주세요."
            speed={40}
            loop={false}
            pause={2500}
            className={styles.heroPromptText}
          />
        </div>
      </div>

      <div className={styles.heroResponse}>
        <span className={styles.heroResponseLabel}>RESPONSE</span>
        <TypewriterHeader
          text="여러분의 소중한 방문을 기억합니다 — 자유롭게 의견을 남겨주세요."
          speed={60}
          loop={true}
          pause={2500}
          className={styles.heroResponseText}
        />
      </div>
    </section>

      {/* 헤더 */}
      <div className={styles['special-water']}>
        <div className={styles['text-bg']}>Comment Page</div>
        <div className={`${styles['water-layer']} ${styles['layer-1']}`}>Comment Page</div>
        <div className={`${styles['water-layer']} ${styles['layer-2']}`}>Comment Page</div>
        <div className={`${styles['water-layer']} ${styles['layer-3']}`}>Comment Page</div>
      </div>
      <div className={styles.header}>
        {pagination.total != null && (
          <p className={styles.count}>총 {pagination.total}개의 글</p>
        )}
      </div>

      {/* 작성 폼 */}
      <form className={styles.formCard} onSubmit={handleSubmit}>
        <div className={styles.formRow}>
          <input
            type="text"
            placeholder="이름"
            value={form.name}
            onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
            maxLength={50}
          />
          <input
            type="password"
            placeholder="비밀번호 (4자 이상)"
            value={form.password}
            onChange={e => setForm(prev => ({ ...prev, password: e.target.value }))}
            maxLength={30}
          />
        </div>

        <textarea
          className={styles.textarea}
          placeholder="방명록에 글을 남겨주세요... (최대 500자)"
          value={form.content}
          onChange={e => setForm(prev => ({ ...prev, content: e.target.value }))}
          maxLength={500}
        />

        {formError && <p className={styles.error}>{formError}</p>}

        <div className={styles.formFooter}>
          <span className={styles.charCount}>{form.content.length} / 500</span>
          <button
            type="submit"
            className={styles.submitBtn}
            disabled={createEntry.isPending}
          >
            {createEntry.isPending ? '등록 중...' : '등록'}
          </button>
        </div>
      </form>

      {/* 댓글 목록 */}
      {isLoading && <div className={styles.loading}>로딩 중...</div>}
      {fetchError && <div className={styles.error}>방명록을 불러오지 못했습니다.</div>}

      {!isLoading && entries.length === 0 && (
        <div className={styles.empty}>아직 작성된 글이 없습니다. 첫 번째 글을 남겨보세요!</div>
      )}

      <div className={styles.list}>
        {entries.map(entry => (
          <CommentCard key={entry.id} entry={entry} isAdmin={isAdmin} />
        ))}
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            className={styles.pageBtn}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            &lt;
          </button>

          {pageNumbers.map(n => (
            <button
              key={n}
              className={`${styles.pageBtn} ${n === page ? styles.active : ''}`}
              onClick={() => setPage(n)}
            >
              {n}
            </button>
          ))}

          <button
            className={styles.pageBtn}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            &gt;
          </button>
        </div>
      )}
    </div>
  )
}
