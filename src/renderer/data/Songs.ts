import type { Song } from '../../shared/types'
import { account, settings } from './Storage'
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
// 서버의 음원·영상은 로그인한 계정만 받을 수 있다. <video>는 헤더를 못 붙이므로 주소에 토큰을 붙인다 (표지·채보는 공개)
const MEDIA = /.(mp4|mp3|wav|ogg|flac|m4a|aac)$/i
export const songUrl = (dir: string, file: string) => {
  const remote = remoteDirs.has(dir)
  return `${remote ? `${serverUrl()}/songs/` : SONG_BASE}${encodeURIComponent(dir)}/${encodeURIComponent(file)}${remote && account.token && MEDIA.test(file) ? `?t=${account.token}` : ''}`
}

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
// 같은 곡을 동시에 받지 않는다 (래더에서 미리 받는 중에 곡이 정해지는 경우): 이미 받는 중이면 그 받기를 기다린다
const inflight = new Map<string, Promise<void>>()
export async function ensureSong(s: Song, progress: (p: number) => void, signal?: AbortSignal) {
  if (!s.remote) return
  let p = inflight.get(s.dir)
  if (!p) { p = download(s, progress, signal).finally(() => inflight.delete(s.dir)); inflight.set(s.dir, p) }
  await p
  s.remote = false
}
// 파일을 4개씩 동시에 받는다 (터널을 거치면 요청마다 0.3~1초 걸려서, 작은 파일 열 개를 차례로 받으면 그것만으로 몇 초가 간다). meta.json은 맨 끝: 끊겨도 다음에 처음부터 다시 받는다
async function download(s: Song, progress: (p: number) => void, signal?: AbortSignal) {
  const e = entries.find(x => x.dir === s.dir)
  if (!e) throw new Error('서버 목록에 없는 곡')
  const total = e.files.reduce((n, f) => n + f.size, 0) || 1
  let done = 0
  const stop = new AbortController() // 하나가 실패하면 나머지도 멈춘다
  signal?.addEventListener('abort', () => stop.abort())
  const get = async (f: { name: string }) => {
    const r = await fetch(`${serverUrl()}/songs/${encodeURIComponent(s.dir)}/${encodeURIComponent(f.name)}`, { signal: stop.signal, headers: account.token ? { Authorization: `Bearer ${account.token}` } : {} })
    if (r.status === 401) throw new Error('곡을 받으려면 로그인이 필요합니다')
    if (!r.ok || !r.body) throw new Error(`${f.name}: ${r.status}`)
    const chunks: Uint8Array[] = [], rd = r.body.getReader()
    for (let c = await rd.read(); !c.done; c = await rd.read()) { chunks.push(c.value); done += c.value.length; progress(Math.min(done / total, 1)) }
    const data = new Uint8Array(chunks.reduce((n, c) => n + c.length, 0))
    chunks.reduce((off, c) => (data.set(c, off), off + c.length), 0)
    await window.api.putFile(s.dir, f.name, data)
  }
  const rest = e.files.filter(f => f.name !== 'meta.json'), meta = e.files.find(f => f.name === 'meta.json')
  let next = 0
  try {
    await Promise.all(Array.from({ length: Math.min(4, rest.length) }, async () => { while (next < rest.length) await get(rest[next++]) }))
    if (meta) await get(meta)
  } catch (err) { stop.abort(); throw err }
  remoteDirs.delete(s.dir)
}
