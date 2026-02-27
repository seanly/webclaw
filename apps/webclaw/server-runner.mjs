/**
 * Node.js server runner for TanStack Start production build.
 * Serves static assets from dist/client and delegates everything else to the SSR handler.
 * Run from apps/webclaw: node server-runner.mjs
 */
import { createServer } from 'node:http'
import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { join } from 'node:path'
import { Readable } from 'node:stream'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const PORT = Number(process.env.PORT) || 3000
const CLIENT_DIR = join(__dirname, 'dist', 'client')

const MIME = {
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.txt': 'text/plain; charset=utf-8',
}

async function serveStatic(pathname) {
  if (pathname.includes('..')) return null
  if (!pathname.startsWith('/assets/') && pathname !== '/favicon.svg' && pathname !== '/manifest.json' && pathname !== '/robots.txt' && pathname !== '/cover.jpg') return null
  const file = join(CLIENT_DIR, pathname)
  try {
    const st = await stat(file)
    if (!st.isFile()) return null
    const ext = pathname.slice(pathname.lastIndexOf('.'))
    return { file, contentType: MIME[ext] || 'application/octet-stream' }
  } catch {
    return null
  }
}

async function run() {
  const { default: server } = await import('./dist/server/server.js')

  const httpServer = createServer(async (req, res) => {
    const url = req.url || '/'
    const pathname = url.replace(/\?.*/, '')
    const method = req.method || 'GET'

    try {
      if (method === 'GET' || method === 'HEAD') {
        const staticResult = await serveStatic(pathname)
        if (staticResult) {
          res.writeHead(200, { 'Content-Type': staticResult.contentType })
          if (method === 'GET') createReadStream(staticResult.file).pipe(res)
          else res.end()
          return
        }
      }

      const protocol = req.headers['x-forwarded-proto'] || 'http'
      const host = req.headers.host || `localhost:${PORT}`
      const requestUrl = `${protocol}://${host}${url}`
      const headers = new Headers()
      for (const [k, v] of Object.entries(req.headers)) {
        if (v !== undefined) headers.set(k, Array.isArray(v) ? v.join(', ') : String(v))
      }
      const hasBody = method !== 'GET' && method !== 'HEAD'
      const request = new Request(requestUrl, {
        method,
        headers,
        duplex: hasBody ? 'half' : undefined,
        body: hasBody ? Readable.toWeb(req) : undefined,
      })
      const response = await server.fetch(request)

      res.writeHead(response.status, Object.fromEntries(response.headers.entries()))
      if (response.body) {
        const reader = response.body.getReader()
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            res.write(value)
          }
        } finally {
          reader.releaseLock()
        }
      }
      res.end()
    } catch (err) {
      console.error('Request error:', err)
      res.writeHead(500, { 'Content-Type': 'text/plain' })
      res.end('Internal Server Error')
    }
  })

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`WebClaw server listening on http://0.0.0.0:${PORT}`)
  })
}

run().catch((err) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})
