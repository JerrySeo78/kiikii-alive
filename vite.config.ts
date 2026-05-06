import { defineConfig } from 'vite';

const isCI = process.env.CI === 'true';

export default defineConfig({
  root: '.',
  publicDir: 'assets',
  base: isCI ? '/kiikii-alive/' : '/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    open: true,
  },
});
