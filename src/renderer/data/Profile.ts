import { api } from './Account'
import { account } from './Storage'

// 내 프로필(레벨·티어·DJ CLASS·꾸미기). 값은 전부 서버가 계산해서 주고, 앱은 받아서 그리기만 한다. 로그인 안 했거나 서버에 못 닿으면 undefined
export interface Item { id: string; name: string; need: string; on: boolean }
export interface Profile {
  id: string; nick: string; level: number; cur: number; need: number; exp: number; plays: number; fcs: number; aps: number
  lp: number; tier: string; div: number; pt: number; tierLabel: string; wins: number; losses: number; draws: number
  cls: { idx: number; name: string; sub: number; points: number; lo: number; hi: number; label: string }
  avatar: string; plate: string; title: string; titleName: string; plates: Item[]; titles: Item[]
}
// 다른 계정으로 바꾸거나 로그아웃하면 이전 사람의 프로필이 잠깐이라도 보이지 않게, 지금 로그인한 계정의 것일 때만 돌려준다
// 마지막으로 받은 프로필은 이 PC에도 저장해 둔다: 서버가 꺼져 있어도 로그인한 채로 닉네임·레벨이 보인다 (로그인 정보 자체는 따로 저장돼 있다)
const KEY = 'stella.profile'
let cache: Profile | undefined
try { cache = JSON.parse(localStorage.getItem(KEY) ?? 'null') ?? undefined } catch { /* 없거나 깨졌으면 서버에서 다시 받는다 */ }
export const prof = { get v() { return account.token && cache?.id === account.id ? cache : undefined }, set v(p: Profile | undefined) { cache = p; try { if (p) localStorage.setItem(KEY, JSON.stringify(p)); else localStorage.removeItem(KEY) } catch { /* 저장 못 해도 이번 실행은 계속 */ } } }

export const refreshProfile = () => account.token
  ? api<Profile>('profile/me').then(p => { prof.v = p; return p }, () => prof.v)
  : Promise.resolve(((prof.v = undefined), undefined))
// 프로필 이미지 올리기(160px JPEG)·지우기: 바뀐 프로필을 돌려받아 바로 쓴다
export const setAvatar = (jpeg: Blob) => api<Profile>('profile/avatar', jpeg).then(p => { prof.v = p; return p })
export const clearAvatar = () => api<Profile>('profile/avatar', undefined, 'DELETE').then(p => { prof.v = p; return p })
export const equip = (kind: 'plate' | 'title', id: string) => api<Profile>('profile/equip', { [kind]: id }).then(p => { prof.v = p; return p })

// 래더 결과: 판이 끝나면 내 결과를 올리고, 상대 결과가 올 때까지 조금씩 물어본다
export interface LadderResult { state: 'wait' | 'none' | 'done'; result?: 'WIN' | 'LOSE' | 'DRAW'; delta?: number; lp?: number; tierLabel?: string }
export const reportLadder = (mid: string, score: number, failed: boolean) => api('ladder/report', { mid, score, failed })
export const ladderResult = (mid: string) => api<LadderResult>(`ladder/result?mid=${encodeURIComponent(mid)}`)

// 티어·클래스·플레이트 색 (그림용)
export const TIER_COLOR: Record<string, string> = { UNRANKED: '#aab4c8', IRON: '#9aa3b5', BRONZE: '#d08a4a', SILVER: '#d4deef', GOLD: '#ffcf4a', PLATINUM: '#6fe0d0', DIAMOND: '#7ab8ff', MASTER: '#d98cff' }
export const PLATE_COLOR: Record<string, [string, string]> = {
  default: ['#2b6ee0', '#7ad8ff'], aurora: ['#1fb88a', '#3a7bff'], nova: ['#ff7a59', '#ff5c8a'], eclipse: ['#3b2a78', '#c06bff'],
  galaxy: ['#1b2b6b', '#7a5bff'], crown: ['#d9a300', '#ffe27a'], supernova: ['#ff3d6e', '#ffb13b']
}
