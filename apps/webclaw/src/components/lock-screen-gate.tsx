'use client'

import { useEffect } from 'react'
import { Outlet } from '@tanstack/react-router'
import { LockScreen } from './lock-screen'
import { useLockStore } from '@/stores/lock-store'

export function LockScreenGate() {
  const locked = useLockStore((s) => s.locked)
  const lock = useLockStore((s) => s.lock)
  const unlock = useLockStore((s) => s.unlock)

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'l') {
        e.preventDefault()
        lock()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [lock])

  if (locked) {
    return <LockScreen onUnlock={unlock} />
  }

  return <Outlet />
}
