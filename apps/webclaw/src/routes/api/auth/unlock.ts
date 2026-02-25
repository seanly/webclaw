import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import {
  buildUnlockCookie,
  getGatewayCredentials,
  verifyUnlockCredentials,
} from '../../../server/auth'

export const Route = createFileRoute('/api/auth/unlock')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { hasAuth } = getGatewayCredentials()
        if (!hasAuth) {
          return json(
            { ok: false, error: 'Gateway auth not configured' },
            { status: 501 },
          )
        }

        let body: Record<string, unknown> = {}
        try {
          body = (await request.json().catch(() => ({}))) as Record<string, unknown>
        } catch {
          return json(
            { ok: false, error: 'Invalid JSON' },
            { status: 400 },
          )
        }

        const token = typeof body.token === 'string' ? body.token : ''
        const password = typeof body.password === 'string' ? body.password : ''
        if (!token.trim() && !password.trim()) {
          return json(
            { ok: false, error: 'token or password required' },
            { status: 400 },
          )
        }

        const valid = verifyUnlockCredentials(token, password)
        if (!valid) {
          return json(
            { ok: false, error: 'Invalid token or password' },
            { status: 401 },
          )
        }

        const cookie = buildUnlockCookie()
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
