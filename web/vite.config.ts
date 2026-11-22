import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// BASE=./ builds a copy that works from any folder (e.g. a preview); the domain build serves from /.
// Read without Node's types, which this package doesn't install.
const env = (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env ?? {};

export default defineConfig({
  base: env.BASE ?? '/',
  plugins: [react()],
  build: { target: 'es2020', chunkSizeWarningLimit: 900 },
  server: { port: 4173, host: true },
});
