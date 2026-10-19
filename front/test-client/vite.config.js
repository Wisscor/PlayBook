import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Everything the browser talks to is proxied through this dev server, so the
// page and the API share one origin. That matters for two reasons:
//
//   1. back/app/main.py installs no CORSMiddleware. A direct cross-origin
//      fetch from :5173 to :8000 with credentials would be blocked by the
//      browser. Through the proxy there is no cross-origin request at all.
//   2. The session cookie is set without a Domain attribute, so the browser
//      files it under whichever host you typed in the address bar. Two hosts
//      that both reach this server -> two independent sessions. See README.
//
// Configure the backend with BACKEND_URL in front/test-client/.env
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const target = env.BACKEND_URL || 'http://127.0.0.1:8000'

  const http = { target, changeOrigin: false }
  const websocket = { target, changeOrigin: false, ws: true }

  return {
    plugins: [react()],
    server: {
      // host:true listens on every interface, so both http://localhost:5173
      // and http://127.0.0.1:5173 reach this server. The two-user trick needs it.
      host: true,
      port: 5173,
      strictPort: true,
      proxy: {
        '/auth': http,       // routers/auth.py      (prefix="/auth")
        '/users': http,      // routers/users.py     (prefix="/users")
        '/realtime': http,   // realtime/rest.py     (prefix="/realtime")
        '/health': http,     // main.py:53
        '/ws': websocket,    // realtime/ws.py       (no prefix)
      },
    },
  }
})
