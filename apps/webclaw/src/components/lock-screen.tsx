import { useCallback, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type LockScreenProps = {
  onUnlock: () => void
}

export function LockScreen({ onUnlock }: LockScreenProps) {
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      const trimmed = value.trim()
      if (!trimmed) {
        setError('Enter token or password')
        return
      }
      setError(null)
      setLoading(true)
      try {
        const res = await fetch('/api/auth/unlock', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: trimmed, password: trimmed }),
        })
        const data = (await res.json().catch(() => ({}))) as {
          ok?: boolean
          error?: string
        }
        if (res.ok && data.ok) {
          onUnlock()
          setValue('')
          return
        }
        setError(data.error ?? 'Invalid token or password')
      } catch {
        setError('Request failed')
      } finally {
        setLoading(false)
      }
    },
    [value, onUnlock],
  )

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center',
        'bg-primary-50/95 dark:bg-primary-950/95 backdrop-blur-sm',
      )}
      aria-modal="true"
      role="dialog"
      aria-labelledby="lock-screen-title"
    >
      <div className="w-full max-w-sm px-4">
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-primary-200 bg-surface p-6 shadow-lg dark:border-primary-800"
        >
          <h1
            id="lock-screen-title"
            className="text-balance text-center text-lg font-medium tracking-tight text-primary-900"
          >
            Screen locked
          </h1>
          <p className="mt-2 text-center text-pretty text-sm text-primary-700">
            Enter your gateway token or password to unlock.
          </p>
          <div className="mt-4">
            <Input
              type="password"
              placeholder="Token or password"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              disabled={loading}
              autoComplete="current-password"
              autoFocus
              aria-invalid={!!error}
              aria-describedby={error ? 'lock-error' : undefined}
              className="w-full"
            />
            {error ? (
              <p
                id="lock-error"
                className="mt-2 text-sm text-primary-700"
                role="alert"
              >
                {error}
              </p>
            ) : null}
          </div>
          <Button
            type="submit"
            className="mt-4 w-full"
            disabled={loading || !value.trim()}
          >
            {loading ? 'Unlocking…' : 'Unlock'}
          </Button>
        </form>
        <p className="mt-4 text-center text-pretty text-xs text-primary-600">
          Use <kbd className="rounded border border-primary-300 px-1.5 py-0.5 font-mono text-[10px] dark:border-primary-700">Mod+L</kbd> to lock again.
        </p>
      </div>
    </div>
  )
}
