import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/', // Deploy to root domain (thewall.callum.digital)
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    target: 'esnext', // Support top-level await
    modulePreload: {
      polyfill: false
    }
  },
  server: {
    port: process.env.PORT || 5713
  }
})
