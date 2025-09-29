import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/the-wall/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  },
  server: {
    port: process.env.PORT || 3001
  }
})
