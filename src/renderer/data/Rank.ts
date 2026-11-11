import type { ScoreKeeper } from '../game/ScoreKeeper'
import { forget } from './Account'
import { serverUrl } from './Songs'
import { account, settings } from './Storage'

// 온라인 랭킹: 곡·키 수·난이도마다 계정당 최고 점수. 올리려면 로그인해야 한다. 서버에 못 닿으면 조용히 비워 둔다 (게임은 그대로)
export interface RankRow { nick: string; score: number; acc: number; mc: number; badge: string; lv?: number }

const url = (dir: string, diff: string, keys: number) => `${serverUrl()}/rank/${encodeURIComponent(dir)}/${keys}k-${diff}`
const ok = (r: Response) => (r.ok ? (r.json() as Promise<RankRow[]>) : Promise.reject(Object.assign(new Error(String(r.status)), { status: r.status })))

// 곡을 시작했다고 서버에 알린다: 서버는 이 기록이 있고 곡 길이만큼 지난 뒤에만 점수를 받는다
// 실패하면 3초 뒤 한 번 더 보낸다 (서버는 시작한 뒤 곡 길이의 80%가 지났는지만 보므로 조금 늦어도 된다)
export const startPlay = (dir: string, diff: string, keys: number, retry = true) => {
  rankMsg = ''
  if (!account.token) return
  fetch(`${serverUrl()}/play/start`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${account.token}` }, body: JSON.stringify({ board: `${dir}/${keys}k-${diff}` }), signal: AbortSignal.timeout(6000) })
    .then(r => { if (!r.ok) throw new Error(String(r.status)) })
    .catch(() => { if (retry) setTimeout(() => startPlay(dir, diff, keys, false), 3000) })
}
// 점수를 서버에 올리지 못했을 때 결과 화면에 보여 줄 이유 (성공하면 비어 있다)
export let rankMsg = ''

export const fetchRank = (dir: string, diff: string, keys = settings.keyMode) =>
  fetch(url(dir, diff, keys), { signal: AbortSignal.timeout(6000) }).then(ok).catch(() => undefined)

export const submitRank = (dir: string, diff: string, sk: ScoreKeeper, keys = settings.keyMode) =>
  !account.token ? fetchRank(dir, diff, keys) : fetch(url(dir, diff, keys), {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${account.token}` }, signal: AbortSignal.timeout(6000),
    body: JSON.stringify({ score: sk.score, acc: sk.accuracy, mc: sk.maxCombo, badge: sk.badge, n: sk.counts }) // n: 판정 개수 (서버가 점수와 앞뒤가 맞는지 본다)
  }).then(ok).then(b => { rankMsg = ''; return b }).catch((e: { status?: number }) => {
    if (e.status === 401) forget() // 토큰이 만료됐으면 로그아웃 상태로
    rankMsg = e.status === 401 ? '로그인이 만료되어 점수를 올리지 못했습니다' : e.status === 409 ? '서버가 곡 시작을 기록하지 못해 이번 점수는 올라가지 않았습니다' : e.status === 400 ? '서버가 이번 점수의 판정 개수를 확인하지 못해 올라가지 않았습니다' : '서버에 닿지 못해 이번 점수는 올라가지 않았습니다'
    return undefined
  })
