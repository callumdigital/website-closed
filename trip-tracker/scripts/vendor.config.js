import { defineConfig } from 'vite';

// Builds vendor/geo.js (d3 + topojson as one ES module) so the site runs with no build step on classic GitHub Pages.
export default defineConfig({
  build: {
    outDir: 'vendor', emptyOutDir: false, copyPublicDir: false,
    lib: { entry: 'scripts/vendor-entry.js', formats: ['es'], fileName: () => 'geo.js' },
  },
});
