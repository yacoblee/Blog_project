import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchWithAuth } from './fetchWithAuth'

const BASE = '/api/guestbook'

// ── 목록 조회 (페이징) ──────────────────────────────────────
async function fetchEntries(page = 1, limit = 20) {
  const res = await fetch(`${BASE}?page=${page}&limit=${limit}`)
  if (!res.ok) throw new Error('Failed to fetch guestbook')
  return res.json()
}

// ── 일반 사용자: 댓글 작성 ──────────────────────────────────
async function createEntry({ name, content, password }) {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, content, password }),
  })
  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.error || '등록에 실패했습니다.')
  }
  return res.json()
}

// ── 일반 사용자: 댓글 수정 (비밀번호 검증) ──────────────────
async function updateEntry({ id, content, password }) {
  const res = await fetch(`${BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, password }),
  })
  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.error || '수정에 실패했습니다.')
  }
  return res.json()
}

// ── 일반 사용자: 댓글 삭제 (비밀번호 검증) ──────────────────
async function deleteEntryByPassword({ id, password }) {
  const res = await fetch(`${BASE}/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  })
  if (!res.ok && res.status !== 204) {
    const data = await res.json()
    throw new Error(data.error || '삭제에 실패했습니다.')
  }
}

// ── 관리자: 댓글 삭제 (토큰 인증) ───────────────────────────
async function deleteEntryByAdmin(id) {
  const res = await fetchWithAuth(`${BASE}/${id}`, { method: 'DELETE' })
  if (!res.ok && res.status !== 204) {
    throw new Error('삭제에 실패했습니다.')
  }
}

// ── 관리자: 답글(대댓글) 작성 ───────────────────────────────
async function createReply({ parentId, content }) {
  const res = await fetchWithAuth(`${BASE}/${parentId}/reply`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  })
  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.error || '답글 작성에 실패했습니다.')
  }
  return res.json()
}

// ── React Query 훅 ─────────────────────────────────────────
export function useGuestbook(page = 1) {
  return useQuery({
    queryKey: ['guestbook', page],
    queryFn: () => fetchEntries(page),
  })
}

export function useCreateEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createEntry,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['guestbook'] }),
  })
}

export function useUpdateEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: updateEntry,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['guestbook'] }),
  })
}

export function useDeleteEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteEntryByPassword,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['guestbook'] }),
  })
}

export function useAdminDeleteEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteEntryByAdmin,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['guestbook'] }),
  })
}

export function useCreateReply() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createReply,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['guestbook'] }),
  })
}
