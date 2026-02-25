import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const LOCK_STORAGE_KEY = 'webclaw_locked'

type LockState = {
  locked: boolean
  setLocked: (locked: boolean) => void
  lock: () => Promise<void>
  unlock: () => void
}

async function postLock(): Promise<void> {
  const base = typeof window !== 'undefined' ? window.location.origin : ''
  await fetch(`${base}/api/auth/lock`, { method: 'POST', credentials: 'include' })
}

export const useLockStore = create<LockState>()(
  persist(
    (set) => ({
      locked: false,
      setLocked: (locked) => set({ locked }),
      lock: async () => {
        await postLock().catch(() => {})
        set({ locked: true })
      },
      unlock: () => set({ locked: false }),
    }),
    { name: LOCK_STORAGE_KEY },
  ),
)
