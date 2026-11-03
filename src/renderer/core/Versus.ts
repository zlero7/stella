import type { SceneManager } from './SceneManager'
import type { Chart, Song } from '../../shared/types'
import { settings } from '../data/Storage'
import { ensureSong, loadSongs } from '../data/Songs'

// 대결(친선전): 방장이 곡을 고르면 두 PC가 같은 곡·같은 채보로 동시에 치고, 서로의 점수·체력을 실시간으로 본다
// 연결 방법 두 가지: 중계 서버(웹소켓, 기본·인터넷용)와 IP 직접 접속(Tauri의 TCP, 같은 망용)
// 메시지는 JSON (hello 인사 · pick 곡 선택 · ack 응답 · chart 채보 · ready 준비 · score 진행 · done 끝, 서버가 보내는 r_* 는 방 코드·짝 지어짐·오류)
export const PORT = 9777
export const DEFAULT_RELAY = 'relay.example.com' // 중계 서버 주소: 화면에는 보이지 않는다 (설정 파일의 relay로 바꿀 수 있다)
export interface Score { s: number; c: number; hp: number; a: number } // 점수 · 콤보 · 체력 · 정확도
export interface Done { s: number; a: number; mc: number; failed: boolean; rank: string }
export type Msg = { t: string } & Record<string, unknown>

const fresh = (): Score => ({ s: 0, c: 0, hp: 100, a: 100 })
export const vs = {
  role: 'host' as 'host' | 'guest',
  open: false, closed: false, // closed: 연결이 끊김 (한 번 알린 뒤 로비가 지운다)
  peerNick: '',
  peer: fresh(), peerDone: undefined as Done | undefined, peerReady: false,
  chart: undefined as Chart | undefined, // 방장이 보낸 채보 (손님은 이걸로 친다)
  ack: undefined as boolean | undefined,
  code: '', relayErr: '' // 중계 서버가 준 방 코드 · 서버가 알린 오류
}

let sm: SceneManager
let ws: WebSocket | undefined // 중계 서버 연결 (없으면 직접 접속)
const num = (v: unknown, d = 0) => (typeof v === 'number' && Number.isFinite(v) ? v : d)
export const send = (m: Msg) => {
  const s = JSON.stringify(m)
  if (ws) { if (ws.readyState === WebSocket.OPEN) ws.send(s) } else window.api?.net?.send(s)
}
export const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))
// cond가 참이 될 때까지 기다린다 (연결이 끊기면 포기). 제한 시간 안에 참이 되면 true
export async function waitFor(cond: () => unknown, ms: number) {
  const t0 = performance.now()
  while (!cond()) { if (vs.closed || performance.now() - t0 > ms) return false; await sleep(50) }
  return true
}
export function resetRound() { vs.peer = fresh(); vs.peerDone = undefined; vs.peerReady = false; vs.chart = undefined; vs.ack = undefined }
export function closeVersus() {
  if (ws) { const s = ws; ws = undefined; s.close() }
  window.api?.net?.close(); vs.open = false; vs.closed = false; vs.peerNick = ''; vs.code = ''; vs.relayErr = ''; resetRound()
}

// 서버 주소를 웹소켓 주소로: 도메인은 wss(터널의 HTTPS), localhost·IP는 ws(시험용, 포트 없으면 9777)
export function relayUrl(a: string) {
  if (/^wss?:\/\//.test(a)) return a
  const local = /^(localhost|\d+\.\d+\.\d+\.\d+)(:\d+)?$/.test(a)
  return local ? `ws://${a.includes(':') ? a : `${a}:${PORT}`}` : `wss://${a}`
}
// 중계 서버에 접속해 첫 요청(방 만들기 {t:'host'} 또는 입장 {t:'join', code})을 보낸다. 서버가 짝을 지어 주면(r_paired) vs.open
export function openRelay(addr: string, first: Msg) {
  return new Promise<void>((ok, fail) => {
    let opened = false
    const s = new WebSocket(relayUrl(addr))
    ws = s
    s.onopen = () => { opened = true; s.send(JSON.stringify(first)); ok() }
    s.onmessage = e => { if (ws === s) try { void onMsg(JSON.parse(String(e.data)) as Msg) } catch { /* 깨진 메시지는 무시 */ } }
    s.onclose = () => { if (ws !== s) return; ws = undefined; if (opened) { vs.open = false; vs.closed = true } else fail(new Error('서버에 연결하지 못했습니다 (서버 주소를 확인하세요)')) }
  })
}

// 방장이 곡을 고른다: 손님에게 보내고, 손님에게 그 곡이 있으면 true
export async function pickSong(song: Song, diff: string) {
  resetRound()
  send({ t: 'pick', dir: song.dir, diff, keys: settings.keyMode })
  await waitFor(() => vs.ack !== undefined, 10 * 60 * 1000) // 손님이 서버에서 곡을 받는 시간을 기다린다
  return vs.ack === true
}

export function initVersus(m: SceneManager) {
  sm = m
  window.api?.net?.on(ev => { // 직접 접속(TCP)
    if (ev.kind === 'open') { vs.open = true; vs.closed = false; send({ t: 'hello', nick: settings.nick }) }
    else if (ev.kind === 'close') { vs.open = false; vs.closed = true }
    else if (ev.kind === 'msg' && ev.data) { try { void onMsg(JSON.parse(ev.data) as Msg) } catch { /* 깨진 줄은 무시 */ } }
  })
}

async function onMsg(m: Msg) {
  switch (m.t) {
    case 'r_room': vs.code = String(m.code ?? ''); break
    case 'r_paired': vs.open = true; vs.closed = false; send({ t: 'hello', nick: settings.nick }); break
    case 'r_err': vs.relayErr = String(m.msg ?? '연결하지 못했습니다'); break
    case 'hello': vs.peerNick = String(m.nick ?? '').slice(0, 16) || 'PLAYER'; break
    case 'pick': { // 손님: 방장이 곡을 골랐다. 이 PC에 있으면 바로 플레이로 들어간다 (채보는 곧 방장이 보내 준다)
      const song = (await loadSongs()).find(s => s.dir === m.dir), keys = num(m.keys)
      let ok = !!song && (keys === 4 || keys === 6) && !!song.meta.audio
      if (ok) try { await ensureSong(song!, () => {}) } catch { ok = false } // 서버 목록의 곡이면 받아 둔다
      resetRound()
      send({ t: 'ack', ok })
      if (ok) sm.go('play', { song, diff: String(m.diff), vs: true, keys })
      break
    }
    case 'ack': vs.ack = m.ok === true; break
    case 'chart': vs.chart = m.chart as Chart; break
    case 'ready': vs.peerReady = true; break
    case 'score': vs.peer = { s: num(m.s), c: num(m.c), hp: num(m.hp, 100), a: num(m.a, 100) }; break
    case 'done': vs.peerDone = { s: num(m.s), a: num(m.a), mc: num(m.mc), failed: m.failed === true, rank: String(m.rank ?? '') }; break
  }
}
