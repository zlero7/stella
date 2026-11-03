import type { Song } from '../../shared/types'
import { settings } from './Storage'
import { DEFAULT_RELAY, relayUrl } from '../core/Versus'

// 난이도 목록: easy/normal/hard/stella는 항상 있고(없으면 음원에서 자동 생성), 폴더에 있는 같은 키 수의 다른 채보도 추가
export function diffsOf(song: Song): string[] {
  const re = new RegExp(`^${settings.keyMode}k-([\\w-]+)\\.json$`)
  const extra = song.meta.charts.map(c => re.exec(c)?.[1]).filter((d): d is string => !!d)
  return [...new Set(['easy', 'normal', 'hard', 'stella', ...extra])]
}
// 지금 키 모드(4키/6키)의 채보 파일 이름
export const chartFile = (diff: string, keys = settings.keyMode) => `${keys}k-${diff}.json`

// song 프로토콜(Rust가 처리): <video>가 곡 폴더의 영상을 직접 스트리밍한다. Windows에서는 http://song.localhost 모양이다
const SONG_BASE = typeof navigator !== 'undefined' && navigator.userAgent.includes('Windows') ? 'http://song.localhost/' : 'song://localhost/'
// 아직 받지 않은 곡(remoteDirs)은 서버에서 바로 읽는다: 목록의 로고·미리듣기용
export const songUrl = (dir: string, file: string) => `${remoteDirs.has(dir) ? `${serverUrl()}/songs/` : SONG_BASE}${encodeURIComponent(dir)}/${encodeURIComponent(file)}`

// 미리듣기 시작 지점: meta에 없으면 곡의 30% 지점(보통 앞의 인트로를 지난 부분)
export const previewStartOf = (start: number | undefined, duration: number) => Math.min(start || duration * 0.3, Math.max(duration - 5, 0))
export const diffName = (d: string) => d.toUpperCase()

// ---- 서버 곡 목록: 곡은 서버 목록(/songs/index.json)에 있는 것만 보인다. 이 PC에 없는 곡은 고를 때 받아 온다 ----
interface Entry { dir: string; meta: Song['meta']; files: { name: string; size: number }[] }
let entries: Entry[] = []
const remoteDirs = new Set<string>()
const CACHE_KEY = 'stella.songIndex' // 서버에 못 닿을 때 마지막으로 받은 목록
export const serverUrl = () => { const r = settings.relay?.trim(); return relayUrl(!r || r === '-' ? DEFAULT_RELAY : r).replace(/^ws/, 'http') }

export async function loadSongs(): Promise<Song[]> {
  try {
    const r = await fetch(`${serverUrl()}/songs/index.json`, { signal: AbortSignal.timeout(8000) })
    if (!r.ok) throw new Error(String(r.status))
    const text = await r.text()
    entries = JSON.parse(text) as Entry[]
    try { localStorage.setItem(CACHE_KEY, text) } catch { /* 저장 못 해도 이번 실행은 계속 */ }
  } catch {
    try { entries = JSON.parse(localStorage.getItem(CACHE_KEY) ?? '[]') as Entry[] } catch { entries = [] }
  }
  const have = new Map(((await window.api?.scanSongs()) ?? []).map(s => [s.dir, s]))
  remoteDirs.clear()
  return entries.map(e => {
    const local = have.get(e.dir)
    if (local) return local
    remoteDirs.add(e.dir)
    return { dir: e.dir, meta: e.meta, remote: true }
  })
}

// 서버에서 곡 파일을 받아 곡 폴더에 둔다 (이미 있으면 바로 끝). progress는 0~1
export async function ensureSong(s: Song, progress: (p: number) => void, signal?: AbortSignal) {
  if (!s.remote) return
  const e = entries.find(x => x.dir === s.dir)
  if (!e) throw new Error('서버 목록에 없는 곡')
  const total = e.files.reduce((n, f) => n + f.size, 0) || 1
  let done = 0
  for (const f of e.files) { // meta.json이 맨 끝: 끊겨도 다음에 처음부터 다시 받는다
    const r = await fetch(`${serverUrl()}/songs/${encodeURIComponent(s.dir)}/${encodeURIComponent(f.name)}`, { signal })
    if (!r.ok || !r.body) throw new Error(`${f.name}: ${r.status}`)
    const chunks: Uint8Array[] = [], rd = r.body.getReader()
    for (let c = await rd.read(); !c.done; c = await rd.read()) { chunks.push(c.value); done += c.value.length; progress(Math.min(done / total, 1)) }
    const data = new Uint8Array(chunks.reduce((n, c) => n + c.length, 0))
    chunks.reduce((off, c) => (data.set(c, off), off + c.length), 0)
    await window.api.putFile(s.dir, f.name, data)
  }
  s.remote = false
  remoteDirs.delete(s.dir)
}
