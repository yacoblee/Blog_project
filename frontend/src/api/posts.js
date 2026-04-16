import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchWithAuth } from './fetchWithAuth'

const BASE = '/api/posts'

// ── 공개 API (인증 불필요) ────────────────────────────────────
async function fetchPosts(params = {}) {
  const filtered = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v != null && v !== '')
  )
  const query = new URLSearchParams(filtered).toString()
  const res = await fetch(query ? `${BASE}?${query}` : BASE, {
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Failed to fetch posts')
  return res.json()
}

async function fetchPost(id) {
  const res = await fetch(`${BASE}/${id}`, { credentials: 'include' })
  if (!res.ok) throw new Error('Failed to fetch post')
  return res.json()
}

// ── 관리자 전용 API (fetchWithAuth → 자동 토큰 갱신) ─────────
async function createPost(data) {
  const res = await fetchWithAuth(BASE, {
    method: 'POST',
    body:   JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to create post')
  return res.json()
}

async function updatePost({ id, ...data }) {
  const res = await fetchWithAuth(`${BASE}/${id}`, {
    method: 'PUT',
    body:   JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to update post')
  return res.json()
}

async function deletePost(id) {
  const res = await fetchWithAuth(`${BASE}/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete post')
}

// ── React Query 훅 ─────────────────────────────────────────
export function usePosts(params) {
  return useQuery({
    queryKey: ['posts', params],
    queryFn:  () => fetchPosts(params),
  })
}

export function usePost(id) {
  return useQuery({
    queryKey: ['posts', id],
    queryFn:  () => fetchPost(id),
    enabled:  !!id,
  })
}

export function useCreatePost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createPost,
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['posts'] }),
  })
}

export function useUpdatePost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: updatePost,
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['posts'] }),
  })
}

export function useDeletePost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deletePost,
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['posts'] }),
  })
}
