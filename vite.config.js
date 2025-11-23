import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
    target: "esnext" // منع Rollup من استخدام النسخ النيتيفية
  }
});