import { serverUrl } from './Songs'

// 새 버전 알림: 서버(/version)가 아는 최신 버전이 이 앱보다 높으면 시작 화면에 안내를 띄운다. 앱에는 자동 업데이트가 없다
declare const __APP_VERSION__: string // vite.config.ts가 package.json의 버전을 넣는다
export const APP_VERSION = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : '0.0.0'

const num = (v: string) => v.split('.').map(n => parseInt(n, 10) || 0)
export const isNewer = (latest: string, cur: string) => {
  const a = num(latest), b = num(cur)
  for (let i = 0; i < 3; i++) if ((a[i] ?? 0) !== (b[i] ?? 0)) return (a[i] ?? 0) > (b[i] ?? 0)
  return false
}

export async function checkUpdate() {
  try {
    const r = await fetch(`${serverUrl()}/version`, { signal: AbortSignal.timeout(6000) })
    const j = (await r.json()) as { latest?: string; url?: string }
    if (r.ok && j.latest && isNewer(j.latest, APP_VERSION)) updateInfo.value = { latest: j.latest, url: j.url ?? '' }
  } catch { /* 서버에 못 닿으면 알림 없이 */ }
}
export const updateInfo: { value: { latest: string; url: string } | undefined } = { value: undefined }
