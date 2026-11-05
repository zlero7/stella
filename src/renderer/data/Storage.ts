import type { ScoreKeeper } from '../game/ScoreKeeper'

// 앱에서는 사용자 데이터 폴더(state.json)에, 브라우저로 열었을 때는 localStorage에 저장한다. 처음 한 번은 예전 localStorage 값을 이어받는다
const read = <T extends object>(k: string, d: T): T => {
  try { return { ...d, ...JSON.parse(window.api?.state?.[k] ?? localStorage.getItem(k) ?? '{}') } } catch { return d }
}
const write = (k: string, v: unknown) => {
  try { if (window.api?.saveState) window.api.saveState(k, JSON.stringify(v)); else localStorage.setItem(k, JSON.stringify(v)) } catch { /* 저장 불가면 이번 실행만 유지 */ }
}

// 키는 e.code('KeyD')로 저장한다: 한글 IME가 켜져 있어도 e.key는 'ㅇ'/'Process'가 되어 입력이 안 먹기 때문
export interface Settings { screen: number; nick: string; lastIp: string; relay: string; ui: number; keyMode: number; keys6: string[]; keys: string[]; scroll: number; volume: number; offset: number; align: number; judgeOffset: number; bg: number; noteColor: number; bgBright: number; panelA: number; fx: number; fastSlow: number; sfx: number } // align: 0 왼쪽, 1 가운데, 2 오른쪽
export const settings: Settings = read('rg.settings', { screen: 2, nick: 'PLAYER', lastIp: '', relay: '', ui: 0, keyMode: 4, keys6: ['KeyS', 'KeyD', 'KeyF', 'KeyJ', 'KeyK', 'KeyL'], keys: ['KeyD', 'KeyF', 'KeyJ', 'KeyK'], scroll: 6.5, volume: 0.8, offset: 0, align: 0, judgeOffset: 0, bg: 1, noteColor: 0, bgBright: 70, panelA: 80, fx: 2, fastSlow: 1, sfx: 1 }) // bgBright: 배경 밝기 30~100(%), panelA: 레인 패널 불투명도 50~95(%), fx: 이펙트 0 끔·1 약·2 보통, fastSlow: FAST/SLOW 표시 1/0 // bg: 플레이 배경 1 켜짐/0 꺼짐, noteColor: NOTE_COLORS 번호
// UI 개편(2): 디맥처럼 기어를 화면 가운데에 두는 것을 기본으로 한다. 예전에 저장된 설정에도 한 번만 적용한다 (이후 설정에서 바꾸면 그대로 둔다)
if (settings.ui < 2) { settings.align = 1; settings.ui = 2 }
// 예전 저장값('d', ' ')을 code 형식으로 변환
settings.keys = settings.keys.map(k => (k.length > 1 ? k : k === ' ' ? 'Space' : `Key${k.toUpperCase()}`))
export const saveSettings = () => write('rg.settings', settings)
// 로그인한 계정: token은 서버가 준 세션 토큰이다 (비밀번호는 저장하지 않는다). 비어 있으면 로그아웃 상태
export interface Account { token: string; id: string; nick: string }
export const account: Account = read('rg.account', { token: '', id: '', nick: '' })
export const saveAccount = () => write('rg.account', account)
export const keyLabel = (k: string) => k.replace(/^(Key|Digit)/, '').replace('Space', 'SPACE').replace('Semicolon', ';').replace('Quote', "'").replace('Comma', ',').replace('Period', '.').replace('Slash', '/').toUpperCase()

// 곡·난이도마다 점수 상위 10개를 남긴다 (랭킹)
export interface Best { score: number; accuracy: number; maxCombo: number; badge?: string; at?: number } // badge: 'ALL PERFECT' | 'FULL COMBO' | ''
const records = read<Record<string, Best[]>>('rg.records', {})
const old = read<Record<string, Best>>('rg.best', {}) // 예전 버전의 곡당 1개짜리 기록
// 기록 이름: 4키는 예전 그대로(곡/난이도), 6키는 곡/6k-난이도
const recKey = (dir: string, diff: string) => (settings.keyMode === 6 ? `${dir}/6k-${diff}` : `${dir}/${diff}`)
export const getRecords = (dir: string, diff: string): Best[] => { const k = recKey(dir, diff); return records[k] ?? (old[k] ? [old[k]] : []) }
export const getBest = (dir: string, diff: string): Best | undefined => getRecords(dir, diff)[0]

// 기록을 랭킹에 넣고, 1위(최고 기록 경신)면 true
export function setBest(dir: string, diff: string, sk: ScoreKeeper): boolean {
  const list = [...getRecords(dir, diff)]
  const isNew = !list.length || sk.score > list[0].score
  list.push({ score: sk.score, accuracy: sk.accuracy, maxCombo: sk.maxCombo, badge: sk.badge, at: Date.now() })
  records[recKey(dir, diff)] = list.sort((a, b) => b.score - a.score).slice(0, 10)
  write('rg.records', records)
  return isNew
}

// 볼륨 슬라이더(0~1)를 실제 소리 크기로: 귀는 로그로 듣기 때문에 선형(0.1 = -20dB)이면 낮은 값에서도 크다. 1.5제곱에 최대 0.7배
export const gainOf = (v: number) => v ** 1.5 * 0.7
