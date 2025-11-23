export default defineConfig({
  plugins: [react()],
  server: {
    host: true
  },
  build: {
    outDir: "dist"
  }
})