// Dev-only: lets the roadmap pages save src/data/roadmap.json while `pnpm dev` runs.
// Mirrors nothing in production (Vite `apply: 'serve'`) and is never deployed.
import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { validateRoadmap } from '../src/lib/roadmap.js'

const MAX_CHARS = 1_000_000

export function parseRoadmapBody(raw) {
  if (raw.length > MAX_CHARS) return { status: 413, body: { ok: false, error: 'too_large' } }
  let data
  try { data = JSON.parse(raw) } catch { return { status: 400, body: { ok: false, error: 'invalid_json' } } }
  const details = validateRoadmap(data)
  if (details.length > 0) return { status: 422, body: { ok: false, error: 'invalid_roadmap', details } }
  return { status: 200, body: { ok: true }, data }
}

export function roadmapDevStore() {
  let root = process.cwd()
  return {
    name: 'roadmap-dev-store',
    apply: 'serve',
    configureServer(server) {
      root = server.config.root
      server.middlewares.use('/__roadmap', (req, res) => {
        const reply = (status, body) => {
          res.statusCode = status
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify(body))
        }
        if (req.method !== 'PUT') return reply(405, { ok: false, error: 'method_not_allowed' })

        let raw = ''
        req.on('data', (chunk) => { raw += chunk })
        req.on('end', async () => {
          const result = parseRoadmapBody(raw)
          if (result.status !== 200) return reply(result.status, result.body)
          try {
            const file = path.join(root, 'src/data/roadmap.json')
            await writeFile(file, JSON.stringify(result.data, null, 2) + '\n')
            reply(200, { ok: true })
          } catch {
            reply(500, { ok: false, error: 'write_failed' })
          }
        })
      })
    },
  }
}
