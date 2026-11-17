import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// Dev-only stand-in for public/api/feedback.php (Vite doesn't run PHP). It applies the same
// validation and answers with the same JSON, but only logs the message instead of emailing it.
// The real endpoint is only exercised on production.
function feedbackDevMock() {
  return {
    name: 'feedback-dev-mock',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api/feedback.php', (req, res) => {
        const reply = (status, body) => {
          res.statusCode = status
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify(body))
        }
        if (req.method !== 'POST') return reply(405, { ok: false, error: 'method_not_allowed' })

        let raw = ''
        req.on('data', (chunk) => { raw += chunk })
        req.on('end', () => {
          let data
          try { data = JSON.parse(raw) } catch { return reply(400, { ok: false, error: 'invalid_request' }) }
          if (typeof data?.website === 'string' && data.website.trim() !== '') return reply(200, { ok: true })

          const message = String(data?.message ?? '').trim()
          if (message.length < 5) return reply(422, { ok: false, error: 'message_too_short' })
          if (message.length > 4000) return reply(422, { ok: false, error: 'message_too_long' })
          const email = String(data?.email ?? '').trim()
          if (email !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return reply(422, { ok: false, error: 'invalid_email' })
          }

          console.log(`\n[feedback dev mock] (not emailed) ${data?.category ?? 'other'} | reply-to: ${email || 'none'}\n${message}\n`)
          reply(200, { ok: true })
        })
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), feedbackDevMock()],
})
