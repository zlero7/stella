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
// 서버의 음원·영상은 로그인한 계정만 받을 수 있다. <video>는 헤더를 못 붙이므로 주소에 10분짜리 미디어 토큰을 붙인다 (로그인 토큰 자체는 주소에 남기지 않는다). 표지·채보는 공개
const MEDIA = /.(mp4|mp3|wav|ogg|flac|m4a|aac)$/i
let mediaToken = ''
export async function refreshMedia() {
  if (!account.token) { mediaToken = ''; return }
  try {
    const r = await fetch(`${serverUrl()}/auth/media`, { method: 'POST', headers: { Authorization: `Bearer ${account.token}` }, signal: AbortSignal.timeout(6000) })
    mediaToken = r.ok ? ((await r.json()) as { token: string }).token : ''
  } catch { /* 서버에 못 닿으면 다음 주기에 다시 */ }
}
setInterval(() => void refreshMedia(), 4 * 60 * 1000) // 토큰은 10분 뒤 만료된다
export const songUrl = (dir: string, file: string) => {
  const remote = remoteDirs.has(dir)
  return `${remote ? `${serverUrl()}/songs/` : SONG_BASE}${encodeURIComponent(dir)}/${encodeURIComponent(file)}${remote && mediaToken && MEDIA.test(file) ? `?t=${mediaToken}` : ''}`
}

// 미리듣기 시작 지점: meta에 없으면 곡의 30% 지점(보통 앞의 인트로를 지난 부분)
export const previewStartOf = (start: number | undefined, duration: number) => Math.min(start || duration * 0.3, Math.max(duration - 5, 0))
export const diffName = (d: string) => d.toUpperCase()

// ---- 서버 곡 목록: 곡은 서버 목록(/songs/index.json)에 있는 것만 보인다. 이 PC에 없는 곡은 고를 때 받아 온다 ----
interface Entry { dir: string; meta: Song['meta']; v?: string; files: { name: string; size: number }[] }
// 받아 둔 곡의 서버 지문(v): 서버의 v가 바뀌면(채보를 고치는 등) 그 곡을 다시 받는다. 기록이 없는 예전 곡은 지금 서버 것으로 보고 시작한다
const VER_KEY = 'stella.songVer'
const readVers = (): Record<string, string> => { try { return JSON.parse(localStorage.getItem(VER_KEY) ?? '{}') } catch { return {} } }
const writeVers = (v: Record<string, string>) => { try { localStorage.setItem(VER_KEY, JSON.stringify(v)) } catch { /* 저장 못 해도 이번 실행은 계속 */ } }
let entries: Entry[] = []
const remoteDirs = new Set<string>()
const CACHE_KEY = 'stella.songIndex' // 서버에 못 닿을 때 마지막으로 받은 목록
export const serverUrl = () => { const r = settings.relay?.trim(); return relayUrl(!r || r === '-' ? DEFAULT_RELAY : r).replace(/^ws/, 'http') }

export async function loadSongs(): Promise<Song[]> {
  await refreshMedia()
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
  const vers = readVers()
  let changed = false
  const list = entries.map(e => {
    const local = have.get(e.dir)
    if (local && e.v) {
      if (!vers[e.dir]) { vers[e.dir] = e.v; changed = true }
      if (vers[e.dir] === e.v) return local
    } else if (local) return local
    remoteDirs.add(e.dir) // 이 PC에 없거나, 서버에서 바뀐 곡
    return { dir: e.dir, meta: e.meta, remote: true }
  })
  if (changed) writeVers(vers)
  const known = new Set(entries.map(e => e.dir))
  for (const s of have.values()) if (!known.has(s.dir)) list.push(s) // 서버 목록에 없는 곡도 이 PC 곡 폴더에 있으면 보인다 (서버가 꺼져 있을 때, 또는 방금 직접 넣은 곡)
  return list
}

// 서버에서 곡 파일을 받아 곡 폴더에 둔다 (이미 있으면 바로 끝). progress는 0~1
// 같은 곡을 동시에 받지 않는다 (래더에서 미리 받는 중에 곡이 정해지는 경우): 이미 받는 중이면 그 받기에 붙는다.
// 진행률은 붙은 모두에게 알리고, 받기는 붙은 모두가 취소했을 때만 멈춘다 (먼저 붙은 쪽의 취소·진행률을 뒤의 쪽이 물려받지 않게)
interface Job { p: Promise<void>; subs: Set<(p: number) => void>; live: number; ctl: AbortController; last: number }
const inflight = new Map<string, Job>()
export async function ensureSong(s: Song, progress: (p: number) => void, signal?: AbortSignal) {
  if (!s.remote) return
  let j = inflight.get(s.dir)
  if (!j) {
    const job: Job = { p: undefined as unknown as Promise<void>, subs: new Set(), live: 0, ctl: new AbortController(), last: 0 }
    job.p = download(s, p => { job.last = p; job.subs.forEach(f => f(p)) }, job.ctl.signal).finally(() => inflight.delete(s.dir))
    inflight.set(s.dir, job); j = job
  }
  const job = j
  job.subs.add(progress); job.live++; progress(job.last)
  let off = false
  const leave = () => { if (off) return; off = true; job.subs.delete(progress); if (--job.live <= 0) job.ctl.abort() }
  signal?.addEventListener('abort', leave, { once: true })
  try { if (signal?.aborted) leave(); await job.p } finally { off || (job.subs.delete(progress), job.live--) }
  s.remote = false
}

const STALL_MS = 20000, TRIES = 3
const msgOf = (err: unknown) => err instanceof Error && /Failed to fetch|NetworkError|Load failed/i.test(err.message) ? '서버에 연결하지 못했습니다' : err instanceof Error ? err.message : '곡을 받지 못했습니다'
// 파일을 4개씩 동시에 받는다 (터널을 거치면 요청마다 0.3~1초 걸려서, 작은 파일 열 개를 차례로 받으면 그것만으로 몇 초가 간다). meta.json은 맨 끝: 끊겨도 다음에 처음부터 다시 받는다
// 한 파일은 20초 동안 한 바이트도 안 오면 끊고 다시 받는다(최대 3번). 다 받고 나서 크기가 서버 목록과 다르면 실패로 본다
async function download(s: Song, progress: (p: number) => void, signal: AbortSignal) {
  const e = entries.find(x => x.dir === s.dir)
  if (!e) throw new Error('서버 목록에 없는 곡')
  const total = e.files.reduce((n, f) => n + f.size, 0) || 1
  let done = 0
  const stop = new AbortController() // 하나가 실패하면 나머지도 멈춘다
  signal.addEventListener('abort', () => stop.abort())
  const once = async (f: { name: string; size: number }) => {
    const ctl = new AbortController(), cut = () => ctl.abort()
    stop.signal.addEventListener('abort', cut, { once: true })
    let timer = setTimeout(cut, STALL_MS), got = 0
    try {
      const r = await fetch(`${serverUrl()}/songs/${encodeURIComponent(s.dir)}/${encodeURIComponent(f.name)}`, { signal: ctl.signal, headers: account.token ? { Authorization: `Bearer ${account.token}` } : {} })
      if (r.status === 401 || r.status === 429) throw Object.assign(new Error(((await r.json().catch(() => ({}))) as { error?: string }).error ?? '곡을 받을 수 없습니다'), { fatal: true })
      if (r.status === 404) throw Object.assign(new Error(`서버에 ${f.name} 파일이 없습니다`), { fatal: true })
      if (!r.ok || !r.body) throw new Error(`${f.name}: ${r.status}`)
      const chunks: Uint8Array[] = [], rd = r.body.getReader()
      for (let c = await rd.read(); !c.done; c = await rd.read()) { clearTimeout(timer); timer = setTimeout(cut, STALL_MS); chunks.push(c.value); got += c.value.length; done += c.value.length; progress(Math.min(done / total, 1)) }
      if (f.size && got !== f.size) throw new Error(`${f.name}: 크기가 다릅니다 (${got}/${f.size})`)
      const data = new Uint8Array(got)
      chunks.reduce((off, c) => (data.set(c, off), off + c.length), 0)
      await window.api.putFile(s.dir, f.name, data)
    } catch (err) {
      done -= got // 다시 받으면 이 파일의 진행분은 처음부터
      if (stop.signal.aborted) throw err
      if (ctl.signal.aborted) throw new Error(`${f.name}: ${STALL_MS / 1000}초 동안 응답이 없습니다`)
      throw err
    } finally { clearTimeout(timer); stop.signal.removeEventListener('abort', cut) }
  }
  const get = async (f: { name: string; size: number }) => {
    for (let n = 1; ; n++) {
      try { return await once(f) } catch (err) {
        if (stop.signal.aborted || n >= TRIES || (err as { fatal?: boolean }).fatal) throw err
        await new Promise(r => setTimeout(r, 800 * n)) // 잠깐 쉬고 다시
      }
    }
  }
  const rest = e.files.filter(f => f.name !== 'meta.json'), meta = e.files.find(f => f.name === 'meta.json')
  let next = 0
  try {
    await Promise.all(Array.from({ length: Math.min(4, rest.length) }, async () => { while (next < rest.length) await get(rest[next++]) }))
    if (meta) await get(meta)
  } catch (err) { stop.abort(); throw new Error(msgOf(err)) }
  remoteDirs.delete(s.dir)
  if (e.v) writeVers({ ...readVers(), [s.dir]: e.v })
}
