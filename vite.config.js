import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  publicDir: 'static', // only copy truly static assets
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        predictor: resolve(__dirname, 'predictor.html'),
        visualization: resolve(__dirname, 'visualization.html'),
        competitor: resolve(__dirname, 'competitor-analysis.html'),
        about: resolve(__dirname, 'about.html'),
      },
    },
    outDir: 'dist',
  },
  server: {
    open: '/index.html',
  },
});
