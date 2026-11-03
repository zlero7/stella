import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import type { Api } from '../shared/types'

// Tauri로 실행될 때만 window.api를 Rust 명령으로 채운다 (브라우저로 열면 window.api가 없어서 설정은 localStorage에 둔다)
// invoke는 문자열로 거부하므로 Error로 바꿔 화면의 오류 표시(err.message)가 그대로 동작하게 한다
const call = <T>(cmd: string, args?: Record<string, unknown> | Uint8Array, opt?: { headers: Record<string, string> }): Promise<T> =>
  invoke<T>(cmd, args, opt).catch(e => { throw e instanceof Error ? e : new Error(String(e)) })

if ('__TAURI_INTERNALS__' in window) {
  const api: Api = {
    scanSongs: () => call('songs_scan'),
    readFile: (dir, file) => call('songs_read', { dir, file }),
    writeFile: (dir, file, text) => call('songs_write', { dir, file, text }),
    putFile: (dir, file, data) => call('songs_put', data, { headers: { dir: encodeURIComponent(dir), file: encodeURIComponent(file) } }),
    state: window.__STATE__ ?? {},
    saveState: (key, value) => { call('state_save', { key, value }).catch(() => {}) },
    quit: () => { call('quit').catch(() => {}) },
    setScreen: mode => { call('set_screen_mode', { mode }).catch(() => {}) },
    net: {
      host: port => call('net_host', { port }),
      join: addr => call('net_join', { addr }),
      send: line => { call('net_send', { line }).catch(() => {}) },
      close: () => { call('net_close').catch(() => {}) },
      ips: () => call('net_ips'),
      on: cb => { void listen<{ kind: 'open' | 'msg' | 'close'; data?: string }>('net', e => cb(e.payload)) }
    }
  }
  window.api = api
}
