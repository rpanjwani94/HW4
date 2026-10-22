import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const BACKEND = process.env.BACKEND_URL ?? 'http://127.0.0.1:8000'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': BACKEND,
      '/media': BACKEND,
    },
  },
})
