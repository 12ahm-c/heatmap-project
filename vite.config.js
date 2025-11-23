import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true
  },
  build: {
    outDir: "dist"
  },
  base: "./"   // ← هذا مهم لتجنب 404 عند رفع المشروع
});