import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

const UNLOCK_COOKIE_NAME = 'webclaw_unlock'
const UNLOCK_COOKIE_MAX_AGE_DAYS = 7
const HMAC_SECRET =
  process.env.CLAWDBOT_GATEWAY_UNLOCK_SECRET?.trim() || 'webclaw-unlock-secret'

export function getGatewayCredentials(): {
  token: string
  password: string
  hasAuth: boolean
} {
  const token = process.env.CLAWDBOT_GATEWAY_TOKEN?.trim() ?? ''
  const password = process.env.CLAWDBOT_GATEWAY_PASSWORD?.trim() ?? ''
  const hasAuth = token.length > 0 || password.length > 0
  return { token, password, hasAuth }
}

/** Constant-time comparison: hash both values and compare hashes. */
function secureCompare(a: string, b: string): boolean {
  const hashA = createHash('sha256').update(a, 'utf8').digest()
  const hashB = createHash('sha256').update(b, 'utf8').digest()
  if (hashA.length !== hashB.length) return false
  return timingSafeEqual(hashA, hashB)
}

export function verifyUnlockCredentials(
  inputToken: string,
  inputPassword: string,
): boolean {
  const { token, password, hasAuth } = getGatewayCredentials()
  if (!hasAuth) return false
  const tokenMatch = token.length > 0 && secureCompare(inputToken.trim(), token)
  const passwordMatch =
    password.length > 0 && secureCompare(inputPassword.trim(), password)
  return tokenMatch || passwordMatch
}

export function buildUnlockCookie(): string {
  const payload = `${randomBytes(16).toString('hex')}|${Date.now() + UNLOCK_COOKIE_MAX_AGE_DAYS * 24 * 60 * 60 * 1000}`
  const signature = createHmac('sha256', HMAC_SECRET).update(payload).digest('hex')
  const value = `${payload}|${signature}`
  const isProd = process.env.NODE_ENV === 'production'
  const maxAge = UNLOCK_COOKIE_MAX_AGE_DAYS * 24 * 60 * 60
  const parts = [
    `${UNLOCK_COOKIE_NAME}=${value}`,
    'Path=/',
    `Max-Age=${maxAge}`,
    'HttpOnly',
    'SameSite=Strict',
  ]
  if (isProd) parts.push('Secure')
  return parts.join('; ')
}

export function clearUnlockCookie(): string {
  return `${UNLOCK_COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; SameSite=Strict`
}

export function verifyUnlockCookie(cookieHeader: string | null): boolean {
  if (!cookieHeader) return false
  const cookies = cookieHeader.split(';').map((c) => c.trim())
  const raw = cookies.find((c) => c.startsWith(`${UNLOCK_COOKIE_NAME}=`))
  if (!raw) return false
  const value = raw.slice(UNLOCK_COOKIE_NAME.length + 1).trim()
  const lastPipe = value.lastIndexOf('|')
  if (lastPipe <= 0) return false
  const payload = value.slice(0, lastPipe)
  const signature = value.slice(lastPipe + 1)
  const expected = createHmac('sha256', HMAC_SECRET).update(payload).digest('hex')
  if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'))) return false
  const parts = payload.split('|')
  if (parts.length !== 2) return false
  const expiry = parseInt(parts[1], 10)
  if (Number.isNaN(expiry) || Date.now() > expiry) return false
  return true
}

export { UNLOCK_COOKIE_NAME }
