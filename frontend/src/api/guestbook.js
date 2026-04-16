import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

const BASE = '/api/guestbook'

async function fetchEntries() {
  const res = await fetch(BASE)
  if (!res.ok) throw new Error('Failed to fetch guestbook')
  return res.json()
}

async function createEntry(data) {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to create entry')
  return res.json()
}

export function useGuestbook() {
  return useQuery({ queryKey: ['guestbook'], queryFn: fetchEntries })
}

export function useCreateEntry() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: createEntry, onSuccess: () => qc.invalidateQueries({ queryKey: ['guestbook'] }) })
}
