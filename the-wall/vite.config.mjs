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
    port: process.env.PORT || 3001
  },
  define: {
    // Map non-VITE_ prefixed env vars to VITE_ prefixed ones for Vercel compatibility
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(
      process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://placeholder.supabase.co'
    ),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(
      process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'placeholder-key'
    ),
  }
})
