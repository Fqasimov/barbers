import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// BASE=./ builds a copy that works from any folder (e.g. a preview); the domain build serves from /.
export default defineConfig({
  base: process.env.BASE ?? '/',
  plugins: [react()],
  build: { target: 'es2020', chunkSizeWarningLimit: 900 },
  server: { port: 4180, host: true },
});
