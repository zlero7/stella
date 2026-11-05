import type { ScoreKeeper } from '../game/ScoreKeeper'
import { forget } from './Account'
import { serverUrl } from './Songs'
import { account, settings } from './Storage'

// 온라인 랭킹: 곡·키 수·난이도마다 계정당 최고 점수. 올리려면 로그인해야 한다. 서버에 못 닿으면 조용히 비워 둔다 (게임은 그대로)
export interface RankRow { nick: string; score: number; acc: number; mc: number; badge: string; lv?: number }

const url = (dir: string, diff: string, keys: number) => `${serverUrl()}/rank/${encodeURIComponent(dir)}/${keys}k-${diff}`
const ok = (r: Response) => (r.ok ? (r.json() as Promise<RankRow[]>) : Promise.reject(Object.assign(new Error(String(r.status)), { status: r.status })))

export const fetchRank = (dir: string, diff: string, keys = settings.keyMode) =>
  fetch(url(dir, diff, keys), { signal: AbortSignal.timeout(6000) }).then(ok).catch(() => undefined)

export const submitRank = (dir: string, diff: string, sk: ScoreKeeper, keys = settings.keyMode) =>
  !account.token ? fetchRank(dir, diff, keys) : fetch(url(dir, diff, keys), {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${account.token}` }, signal: AbortSignal.timeout(6000),
    body: JSON.stringify({ score: sk.score, acc: sk.accuracy, mc: sk.maxCombo, badge: sk.badge })
  }).then(ok).catch((e: { status?: number }) => { if (e.status === 401) forget(); return undefined }) // 토큰이 만료됐으면 로그아웃 상태로
