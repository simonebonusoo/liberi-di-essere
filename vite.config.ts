import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    // La porta viene assegnata dall'ambiente (variabile PORT) quando presente,
    // così il dev server non va in conflitto con altri processi.
    port: process.env.PORT ? Number(process.env.PORT) : 5173,
  },
});
