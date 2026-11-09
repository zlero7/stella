import { account, saveAccount, saveSettings, settings } from './Storage'
import { refreshMedia, serverUrl } from './Songs'

// 계정 (서버의 /auth). 비밀번호는 서버로 보낼 때만 쓰고 저장하지 않는다
export const ID_RE = /^[a-z0-9_]{4,16}$/, NICK_RE = /^(?=.*[\p{L}\p{N}])[\p{L}\p{N}_ -]{2,12}$/u

// 비밀번호가 오가는 길이라 https(또는 내 컴퓨터)가 아니면 보내지 않는다
const base = () => {
  const u = serverUrl()
  if (!/^https:\/\//.test(u) && !/^http:\/\/(localhost|127\.0\.0\.1|\[::1\])(:|\/|$)/.test(u)) throw new Error('보안 연결(https)이 아닌 서버에는 로그인할 수 없습니다')
  return u
}
async function call<T = { token: string; id: string; nick: string }>(path: string, body?: object | Blob, token?: string, method = body ? 'POST' : 'GET') {
  const raw = body instanceof Blob // 프로필 이미지(JPEG)는 그대로, 나머지는 JSON
  const r = await fetch(`${base()}/${path}`, {
    method, signal: AbortSignal.timeout(10000),
    headers: { ...(body && { 'Content-Type': raw ? 'image/jpeg' : 'application/json' }), ...(token && { Authorization: `Bearer ${token}` }) },
    body: raw ? body : body && JSON.stringify(body)
  }).catch(() => { throw new Error(navigator.onLine ? '서버에 연결할 수 없습니다. 서버가 꺼져 있거나 점검 중일 수 있으니 잠시 후 다시 해 주세요' : '인터넷에 연결되어 있지 않습니다') })
  const j = await r.json().catch(() => ({}))
  if (!r.ok) throw Object.assign(new Error(j.error ?? `오류 (${r.status})`), { status: r.status })
  return j as T
}
// 로그인한 계정으로 서버 API를 부른다 (프로필·래더). 토큰이 없거나 만료(401)면 로컬 로그인 정보를 지운다
export async function api<T>(path: string, body?: object | Blob, method?: string) {
  if (!account.token) throw Object.assign(new Error('로그인이 필요합니다'), { status: 401 })
  try { return await call<T>(path, body, account.token, method) } catch (e) { if ((e as { status?: number }).status === 401) forget(); throw e }
}
const keep = (j: { token?: string; id: string; nick: string }) => {
  if (j.token) account.token = j.token
  account.id = j.id; account.nick = settings.nick = j.nick
  saveAccount(); saveSettings(); void refreshMedia() // 곡 주소용 미디어 토큰
}

export const forget = () => { account.token = account.id = account.nick = ''; saveAccount() } // 로컬 정보만 지운다 (토큰이 서버에서 만료됐을 때도 쓴다)
export const register = (id: string, pw: string, nick: string) => call('auth/register', { id, pw, nick }).then(keep)
export const login = (id: string, pw: string) => call('auth/login', { id, pw }).then(keep)
// 닉네임·비밀번호 변경 (규칙·중복·횟수 제한은 서버가 확인한다). 비밀번호를 바꾸면 다른 기기는 로그아웃된다
export const changeNick = (nick: string) => api<{ id: string; nick: string }>('profile/nick', { nick }).then(keep)
export const changePassword = (old: string, pw: string) => api('profile/password', { old, pw })
export const logout = async () => { const t = account.token; forget(); if (t) await call('auth/logout', {}, t).catch(() => {}) }
// 시작할 때: 저장된 토큰이 아직 유효한지 확인한다. 서버가 거절(401)할 때만 로그아웃시키고, 못 닿으면 그대로 둔다
export const verify = () => account.token
  ? call('auth/me', undefined, account.token).then(keep, (e: { status?: number }) => { if (e.status === 401) forget() })
  : Promise.resolve()
