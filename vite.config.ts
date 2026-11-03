import { defineConfig } from 'vite'

// 렌더러 빌드 (Tauri가 불러온다)
export default defineConfig({
  root: 'src/renderer',
  clearScreen: false,
  server: { port: 9261, strictPort: true },
  build: { outDir: '../../out/tauri', emptyOutDir: true, target: 'es2022' }
})
