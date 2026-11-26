// Dev-only: lets the roadmap pages save src/data/roadmap.json while `pnpm dev` runs.
// Mirrors nothing in production (Vite `apply: 'serve'`) and is never deployed.
//
// GET  /__roadmap -> { ok, items, version }  (version = sha1 of the file's bytes)
// PUT  /__roadmap { items, baseVersion } -> { ok, version }, or 409 "conflict" when the
//      file changed since the page loaded it (other tab, editor, git), so a stale page
//      never overwrites someone else's edit.
import { createHash } from 'node:crypto'
import { readFile, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { validateRoadmap } from '../src/lib/roadmap.js'

const MAX_CHARS = 1_000_000

export function versionOf(bytes) {
  return createHash('sha1').update(bytes).digest('hex')
}

// Pure: checks size, JSON, baseVersion and the roadmap itself against the file's current version.
export function parseRoadmapBody(raw, currentVersion) {
  if (raw.length > MAX_CHARS) return { status: 413, body: { ok: false, error: 'too_large' } }
  let body
  try { body = JSON.parse(raw) } catch { return { status: 400, body: { ok: false, error: 'invalid_json' } } }
  const baseVersion = body?.baseVersion
  if (typeof baseVersion !== 'string' || !baseVersion) {
    return { status: 400, body: { ok: false, error: 'invalid_request' } }
  }
  if (baseVersion !== currentVersion) return { status: 409, body: { ok: false, error: 'conflict' } }
  const data = { items: body.items }
  const details = validateRoadmap(data)
  if (details.length > 0) return { status: 422, body: { ok: false, error: 'invalid_roadmap', details } }
  return { status: 200, body: { ok: true }, data }
}

// Browsers send Origin on cross-origin writes; allow only the dev server's own host.
// No Origin (curl, same-origin GET-like requests) is allowed.
export function isAllowedOrigin(originHeader, hostHeader) {
  if (originHeader === undefined) return true
  try { return new URL(originHeader).host === hostHeader } catch { return false }
}

export function roadmapDevStore() {
  let root = process.cwd()
  return {
    name: 'roadmap-dev-store',
    apply: 'serve',
    configureServer(server) {
      root = server.config.root
      const file = () => path.join(root, 'src/data/roadmap.json')
      // One PUT at a time, so the version check and the write can't interleave.
      let lock = Promise.resolve()
      server.middlewares.use('/__roadmap', (req, res) => {
        const reply = (status, body) => {
          res.statusCode = status
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.setHeader('Cache-Control', 'no-store')
          res.end(JSON.stringify(body))
        }
        if (req.method !== 'GET' && req.method !== 'PUT') {
          return reply(405, { ok: false, error: 'method_not_allowed' })
        }

        if (!isAllowedOrigin(req.headers.origin, req.headers.host)) {
          return reply(403, { ok: false, error: 'forbidden_origin' })
        }

        if (req.method === 'GET') {
          readFile(file())
            .then((bytes) => {
              const { items } = JSON.parse(bytes.toString('utf8'))
              reply(200, { ok: true, items, version: versionOf(bytes) })
            })
            .catch(() => reply(500, { ok: false, error: 'read_failed' }))
          return undefined
        }

        let raw = ''
        const save = async () => {
          let current
          try {
            current = versionOf(await readFile(file()))
          } catch {
            return reply(500, { ok: false, error: 'read_failed' })
          }
          const result = parseRoadmapBody(raw, current)
          if (result.status !== 200) return reply(result.status, result.body)
          try {
            const text = JSON.stringify(result.data, null, 2) + '\n'
            const tmp = file() + '.tmp'
            await writeFile(tmp, text)
            await rename(tmp, file())
            reply(200, { ok: true, version: versionOf(Buffer.from(text, 'utf8')) })
          } catch {
            reply(500, { ok: false, error: 'write_failed' })
          }
        }
        req.setEncoding('utf8')
        req.on('error', () => reply(400, { ok: false, error: 'invalid_request' }))
        req.on('data', (chunk) => { raw += chunk })
        req.on('end', () => { lock = lock.then(save, save) })
        return undefined
      })
    },
  }
}
