import type { ScoreKeeper } from '../game/ScoreKeeper'
import { serverUrl } from './Songs'
import { settings } from './Storage'

// 온라인 랭킹: 곡·키 수·난이도마다 닉네임당 최고 점수. 서버에 못 닿으면 조용히 비워 둔다 (게임은 그대로)
export interface RankRow { nick: string; score: number; acc: number; mc: number; badge: string }

const url = (dir: string, diff: string, keys: number) => `${serverUrl()}/rank/${encodeURIComponent(dir)}/${keys}k-${diff}`
const ok = (r: Response) => (r.ok ? (r.json() as Promise<RankRow[]>) : Promise.reject(new Error(String(r.status))))

export const fetchRank = (dir: string, diff: string, keys = settings.keyMode) =>
  fetch(url(dir, diff, keys), { signal: AbortSignal.timeout(6000) }).then(ok).catch(() => undefined)

export const submitRank = (dir: string, diff: string, sk: ScoreKeeper, keys = settings.keyMode) =>
  fetch(url(dir, diff, keys), {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(6000),
    body: JSON.stringify({ nick: settings.nick.trim() || 'PLAYER', score: sk.score, acc: sk.accuracy, mc: sk.maxCombo, badge: sk.badge })
  }).then(ok).catch(() => undefined)
