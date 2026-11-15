import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    proxy: {
      '/api/read': 'http://localhost:8788',
      '/api/voice': 'http://127.0.0.1:8790',
      '/api': 'http://localhost:8787',
    },
  },
})
