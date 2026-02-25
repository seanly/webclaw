import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { clearUnlockCookie } from '../../../server/auth'

export const Route = createFileRoute('/api/auth/lock')({
  server: {
    handlers: {
      POST: () => {
        const cookie = clearUnlockCookie()
        return json(
          { ok: true },
          {
            headers: {
              'Set-Cookie': cookie,
            },
          },
        )
      },
    },
  },
})
