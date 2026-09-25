import { defineConfig } from 'vite';

// Builds vendor/supabase.js (one ES module) for upload.html, so the site stays buildless on GitHub Pages.
export default defineConfig({
  build: {
    outDir: 'vendor', emptyOutDir: false, copyPublicDir: false,
    lib: { entry: 'scripts/supabase-entry.js', formats: ['es'], fileName: () => 'supabase.js' },
  },
});
