import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  build: { target: 'es2020', chunkSizeWarningLimit: 900 },
  server: { port: 4173, host: true },
});
