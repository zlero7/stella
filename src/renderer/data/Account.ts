import { account, saveAccount, saveSettings, settings } from './Storage'
import { serverUrl } from './Songs'

// 계정 (서버의 /auth). 비밀번호는 서버로 보낼 때만 쓰고 저장하지 않는다
export const ID_RE = /^[a-z0-9_]{4,16}$/, NICK_RE = /^[\p{L}\p{N}_ -]{2,12}$/u

// 비밀번호가 오가는 길이라 https(또는 내 컴퓨터)가 아니면 보내지 않는다
const base = () => {
  const u = serverUrl()
  if (!/^https:\/\//.test(u) && !/^http:\/\/(localhost|127\.0\.0\.1|\[::1\])(:|\/|$)/.test(u)) throw new Error('보안 연결(https)이 아닌 서버에는 로그인할 수 없습니다')
  return u
}
async function call(path: string, body?: object, token?: string) {
  const r = await fetch(`${base()}/auth/${path}`, {
    method: body ? 'POST' : 'GET', signal: AbortSignal.timeout(10000),
    headers: { ...(body && { 'Content-Type': 'application/json' }), ...(token && { Authorization: `Bearer ${token}` }) },
    body: body && JSON.stringify(body)
  }).catch(() => { throw new Error('서버에 연결할 수 없습니다') })
  const j = await r.json().catch(() => ({}))
  if (!r.ok) throw Object.assign(new Error(j.error ?? `오류 (${r.status})`), { status: r.status })
  return j as { token: string; id: string; nick: string }
}
const keep = (j: { token?: string; id: string; nick: string }) => {
  if (j.token) account.token = j.token
  account.id = j.id; account.nick = settings.nick = j.nick
  saveAccount(); saveSettings()
}

export const loggedIn = () => !!account.token
export const forget = () => { account.token = account.id = account.nick = ''; saveAccount() } // 로컬 정보만 지운다 (토큰이 서버에서 만료됐을 때도 쓴다)
export const register = (id: string, pw: string, nick: string) => call('register', { id, pw, nick }).then(keep)
export const login = (id: string, pw: string) => call('login', { id, pw }).then(keep)
export const logout = async () => { const t = account.token; forget(); if (t) await call('logout', {}, t).catch(() => {}) }
// 시작할 때: 저장된 토큰이 아직 유효한지 확인한다. 서버가 거절(401)할 때만 로그아웃시키고, 못 닿으면 그대로 둔다
export const verify = () => account.token
  ? call('me', undefined, account.token).then(keep, (e: { status?: number }) => { if (e.status === 401) forget() })
  : Promise.resolve()
