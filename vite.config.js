import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendUrl =  'https://nit-backend-f3if.onrender.com'

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api':       { target: backendUrl, changeOrigin: true },
        '/socket.io': { target: backendUrl, changeOrigin: true, ws: true },
      },
    },
  }
})
