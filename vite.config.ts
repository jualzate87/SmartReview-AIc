import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'child_process'

export default defineConfig({
  base: process.env.VITE_BASE_PATH ?? (process.env.GITHUB_ACTIONS ? '/SmartReview-ProtoC/' : '/'),
  plugins: [
    react(),
    {
      name: 'scaffold-api',
      configureServer(server) {
        server.middlewares.use('/__api/scaffold', (req, res) => {
          if (req.method !== 'POST') {
            res.statusCode = 405
            res.end(JSON.stringify({ success: false, error: 'Method not allowed' }))
            return
          }

          let body = ''
          req.on('data', (chunk: Buffer) => {
            body += chunk.toString()
          })
          req.on('end', () => {
            try {
              const { libraries } = JSON.parse(body) as { libraries: string[] }

              const scriptMap: Record<string, string> = {
                appshell: 'node scripts/scaffold-appshell.mjs',
                genux: 'node scripts/scaffold-genux.mjs',
              }

              for (const lib of libraries) {
                const script = scriptMap[lib]
                if (script) {
                  execSync(script, { cwd: process.cwd(), stdio: 'pipe' })
                }
              }

              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ success: true }))
            } catch (err) {
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(
                JSON.stringify({
                  success: false,
                  error: err instanceof Error ? err.message : 'Unknown error',
                }),
              )
            }
          })
        })
      },
    },
  ],
  server: {
    port: 5175,
    strictPort: true,
  },
  css: {
    modules: {
      localsConvention: 'camelCase',
    },
  },
})
