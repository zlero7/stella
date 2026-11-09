import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'

// 렌더러 빌드 (Tauri가 불러온다). __APP_VERSION__: 새 버전 알림이 비교할 이 앱의 버전
const version = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')).version as string
export default defineConfig({
  root: 'src/renderer',
  define: { __APP_VERSION__: JSON.stringify(version) },
  clearScreen: false,
  server: { port: 9261, strictPort: true },
  build: { outDir: '../../out/tauri', emptyOutDir: true, target: 'es2022' }
})
