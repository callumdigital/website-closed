import { defineConfig } from 'vite';

// Relative base so the build works on a GitHub Pages project URL (user.github.io/<repo>/).
// The bundled 50m country outlines (~240 KB gzipped) are lazy-loaded, so the size warning is expected.
export default defineConfig({ base: './', build: { chunkSizeWarningLimit: 800 } });
