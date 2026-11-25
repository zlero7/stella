// 계정 성장: 레벨·경험치, 래더 티어(LP), DJ CLASS, 꾸미기 해금. 값은 전부 서버가 정하고 앱은 받아서 그리기만 한다.
// 순수 함수라서 progress.test.mjs로 확인한다. user는 {exp, plays, fcs, aps, lp, wins, losses, draws, bests, plate, title} 모양 (없는 칸은 0으로 본다)

// 닉네임 비교용 키: 대소문자·전각/반각·공백·_·-를 무시한다 ("Nova", "nova", "N o v a", "ｎｏｖａ", "nova_"는 같은 이름으로 본다)
export const nickKey = n => n.normalize('NFKC').toLowerCase().replace(/[\s_-]/g, '')

// ── 레벨 ──
export const MAX_LEVEL = 999
export const expToNext = lv => 100 + 10 * lv // 레벨 lv → lv+1 에 필요한 경험치
export function levelOf(exp) {
  let lv = 1, left = Math.max(0, exp | 0)
  while (lv < MAX_LEVEL && left >= expToNext(lv)) { left -= expToNext(lv); lv++ }
  return lv >= MAX_LEVEL ? { level: MAX_LEVEL, cur: 0, need: 0 } : { level: lv, cur: left, need: expToNext(lv) }
}
// 한 판을 치고 받는 경험치: 기본 20 + 점수(최대 +40) + 풀콤보 +10 / 올퍼펙트 +20
export const playExp = (score, badge) => 20 + Math.floor(Math.min(score, 1_000_000) / 25000) + (badge === 'ALL PERFECT' ? 20 : badge === 'FULL COMBO' ? 10 : 0)
export const ladderExp = res => (res === 1 ? 60 : res === 0.5 ? 35 : 25)

// ── 래더 티어: 400 LP마다 티어, 티어 안은 100 LP마다 디비전 IV→I. 2400 LP부터 MASTER (디비전 없음) ──
export const TIERS = ['IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND']
export const MASTER_LP = 2400
export function tierOf(lp) {
  lp = Math.max(0, lp | 0)
  if (lp >= MASTER_LP) return { tier: 'MASTER', div: 0, pt: lp - MASTER_LP, label: 'MASTER' }
  const div = 4 - Math.floor((lp % 400) / 100), tier = TIERS[Math.floor(lp / 400)]
  return { tier, div, pt: lp % 100, label: `${tier} ${['', 'I', 'II', 'III', 'IV'][div]}` }
}
// 이긴 쪽 1 · 비김 0.5 · 진 쪽 0 (res는 내 결과). 상대가 강할수록 이기면 많이 오른다. 이기면 최소 +8, 지면 최소 -8
export function ladderDelta(myLp, oppLp, res) {
  const exp = 1 / (1 + 10 ** ((oppLp - myLp) / 400)), d = Math.round(30 * (res - exp))
  return res === 1 ? Math.max(d, 8) : res === 0 ? Math.min(d, -8) : d
}
// 두 사람의 점수로 승패: 실패한 쪽이 지고, 둘 다 같은 상태면 점수가 높은 쪽 (a 기준 1/0.5/0)
export function duelResult(a, b) {
  if (a.failed !== b.failed) return a.failed ? 0 : 1
  return a.score === b.score ? 0.5 : a.score > b.score ? 1 : 0
}

// ── DJ CLASS: 곡마다 최고 점수를 난이도 가중치로 곱해 상위 20곡을 더한 값 (최대 2500점) ──
const DIFF_W = { easy: 0.5, normal: 0.75, hard: 1, stella: 1.25 }
export function classPoints(bests = {}) {
  // 키는 "곡폴더/4k-hard": 곡 폴더 이름에도 -가 있으므로 난이도는 마지막 - 뒤
  const pts = Object.entries(bests).map(([k, s]) => (s / 10000) * (DIFF_W[k.slice(k.lastIndexOf('-') + 1)] ?? 1)).sort((a, b) => b - a).slice(0, 20)
  return Math.round(pts.reduce((a, b) => a + b, 0))
}
export const CLASSES = [['BEGINNER', 0], ['ROOKIE', 150], ['CHALLENGER', 400], ['EXPERT', 700], ['MASTER', 1000], ['STELLAR', 1400], ['THE STELLA', 1900]]
export function classOf(points) {
  let i = CLASSES.length - 1
  while (i > 0 && points < CLASSES[i][1]) i--
  const lo = CLASSES[i][1], hi = CLASSES[i + 1]?.[1]
  const sub = hi === undefined ? 0 : 4 - Math.min(3, Math.floor(((points - lo) / (hi - lo)) * 4)) // IV(4) → I(1), 마지막 등급은 없음
  return { idx: i, name: CLASSES[i][0], sub, points, lo, hi: hi ?? 0, label: sub ? `${CLASSES[i][0]} ${['', 'I', 'II', 'III', 'IV'][sub]}` : CLASSES[i][0] } // lo~hi: 이 등급의 점수 범위 (hi가 0이면 마지막 등급)
}

// DJ CLASS에 들어가는 상위 20개 기록: [{k: '곡폴더/4k-hard', pts}] (컬렉션이 "무엇을 치면 오르는지" 보여 주는 용도)
export function classTop(bests = {}) {
  return Object.entries(bests).map(([k, s]) => ({ k, pts: Math.round((s / 10000) * (DIFF_W[k.slice(k.lastIndexOf('-') + 1)] ?? 1) * 10) / 10 })).sort((a, b) => b.pts - a.pts).slice(0, 20)
}
const dirOf = k => k.slice(0, k.lastIndexOf('/'))
export const gradeOf = a => (a >= 99 ? 'S+' : a >= 95 ? 'S' : a >= 90 ? 'A' : a >= 80 ? 'B' : a >= 70 ? 'C' : 'D') // 앱의 rankOf와 같다 (정확도 % 기준)

// ── 일일 목표: 오늘 서로 다른 곡 3곡을 치면 보너스 경험치 (하루 한 번). 같은 곡 반복은 경험치가 줄어드는 것과 짝이다 ──
export const DAILY_GOAL = 3, DAILY_BONUS = 50
const dayOf = now => new Date(now + 9 * 3600e3).toISOString().slice(0, 10) // 한국 시간 기준 하루

// ── 꾸미기: 플레이트(프로필 카드 배경)와 칭호. 조건은 서버가 확인한다 ──
const stat = u => {
  const ks = Object.keys(u.bests ?? {})
  return { level: levelOf(u.exp ?? 0).level, plays: u.plays ?? 0, fcs: u.fcs ?? 0, aps: u.aps ?? 0, lp: u.lp ?? 0, wins: u.wins ?? 0, cls: classOf(classPoints(u.bests)).idx,
    songs: new Set(ks.map(dirOf)).size, six: ks.some(k => k.includes('/6k-')), stella: ks.some(k => k.endsWith('-stella')) } // 서로 다른 곡 수·6키 기록·STELLA 난이도 기록 (기록이 있으면 쳐 본 것)
}
// 업적: 달성 조건과 진행도 (cur/goal). 칭호와 달리 꾸미기를 열지 않고 기록으로만 남는다. 조건은 지금 계정 통계에서 계산하므로 따로 저장하지 않는다
export const ACHIEVEMENTS = [
  { id: 'first', name: '첫 걸음', desc: '처음으로 한 곡을 끝까지 친다', goal: 1, cur: s => s.plays },
  { id: 'plays100', name: '단골 손님', desc: '100판을 친다', goal: 100, cur: s => s.plays },
  { id: 'plays500', name: '리듬 중독', desc: '500판을 친다', goal: 500, cur: s => s.plays },
  { id: 'songs30', name: '다양한 취향', desc: '서로 다른 곡 30곡의 기록을 남긴다', goal: 30, cur: s => s.songs },
  { id: 'songs100', name: '곡 수집가', desc: '서로 다른 곡 100곡의 기록을 남긴다', goal: 100, cur: s => s.songs },
  { id: 'fc10', name: '콤보 장인', desc: '풀콤보 10회', goal: 10, cur: s => s.fcs },
  { id: 'fc50', name: '콤보의 달인', desc: '풀콤보 50회', goal: 50, cur: s => s.fcs },
  { id: 'ap1', name: '완벽한 한 판', desc: '올퍼펙트 1회', goal: 1, cur: s => s.aps },
  { id: 'ap10', name: '별빛 완벽주의', desc: '올퍼펙트 10회', goal: 10, cur: s => s.aps },
  { id: 'six', name: '6키 입문', desc: '6키 모드로 한 곡을 친다', goal: 1, cur: s => (s.six ? 1 : 0) },
  { id: 'stella', name: '스텔라의 문턱', desc: 'STELLA 난이도로 한 곡을 끝까지 친다', goal: 1, cur: s => (s.stella ? 1 : 0) },
  { id: 'win1', name: '첫 승리', desc: '래더에서 처음 이긴다', goal: 1, cur: s => s.wins },
  { id: 'win10', name: '승부사', desc: '래더 10승', goal: 10, cur: s => s.wins },
  { id: 'expert', name: '전문가', desc: 'DJ CLASS EXPERT에 오른다', goal: 3, cur: s => s.cls },
  { id: 'lv50', name: '베테랑 DJ', desc: '레벨 50에 오른다', goal: 50, cur: s => s.level }
]
const achievementsOf = u => { const s = stat(u); return ACHIEVEMENTS.map(({ id, name, desc, goal, cur }) => ({ id, name, desc, goal, cur: Math.min(cur(s), goal), done: cur(s) >= goal })) }
export const PLATES = [
  { id: 'default', name: 'STELLA', need: '기본', ok: () => true },
  { id: 'aurora', name: 'AURORA', need: '레벨 5', ok: s => s.level >= 5 },
  { id: 'nova', name: 'NOVA', need: '레벨 15', ok: s => s.level >= 15 },
  { id: 'eclipse', name: 'ECLIPSE', need: '레벨 30', ok: s => s.level >= 30 },
  { id: 'galaxy', name: 'GALAXY', need: 'DJ CLASS EXPERT', ok: s => s.cls >= 3 },
  { id: 'crown', name: 'CROWN', need: '래더 GOLD', ok: s => s.lp >= 1200 },
  { id: 'supernova', name: 'SUPERNOVA', need: '래더 MASTER', ok: s => s.lp >= MASTER_LP },
  // 레벨 31~100 보상 (표 끝에 덧붙인다: 기존 id·순서는 그대로)
  { id: 'nebula', name: 'NEBULA', need: '레벨 40', ok: s => s.level >= 40 },
  { id: 'pulsar', name: 'PULSAR', need: '레벨 55', ok: s => s.level >= 55 },
  { id: 'quasar', name: 'QUASAR', need: '레벨 70', ok: s => s.level >= 70 },
  { id: 'zenith', name: 'ZENITH', need: '레벨 85', ok: s => s.level >= 85 },
  { id: 'cosmos', name: 'COSMOS', need: '레벨 100', ok: s => s.level >= 100 }
]
export const TITLES = [
  { id: '', name: '(칭호 없음)', need: '', ok: () => true },
  { id: 'rookie', name: '신입 스텔라', need: '기본', ok: () => true },
  { id: 'rising', name: '떠오르는 별', need: '레벨 10', ok: s => s.level >= 10 },
  { id: 'regular', name: '단골 리듬러', need: '플레이 30회', ok: s => s.plays >= 30 },
  { id: 'fc', name: '풀콤보 수집가', need: '풀콤보 10회', ok: s => s.fcs >= 10 },
  { id: 'ap', name: '별빛 퍼펙트', need: '올퍼펙트 1회', ok: s => s.aps >= 1 },
  { id: 'duelist', name: '듀얼리스트', need: '래더 10승', ok: s => s.wins >= 10 },
  { id: 'veteran', name: '베테랑', need: '레벨 50', ok: s => s.level >= 50 },
  { id: 'lord', name: '래더 마스터', need: '래더 MASTER', ok: s => s.lp >= MASTER_LP },
  { id: 'stargazer', name: '별 헤는 밤', need: '레벨 35', ok: s => s.level >= 35 },
  { id: 'comet', name: '혜성 사냥꾼', need: '레벨 45', ok: s => s.level >= 45 },
  { id: 'traveler', name: '은하 여행자', need: '레벨 60', ok: s => s.level >= 60 },
  { id: 'cluster', name: '성단의 주인', need: '레벨 75', ok: s => s.level >= 75 },
  { id: 'nightsky', name: '밤하늘의 지배자', need: '레벨 90', ok: s => s.level >= 90 },
  { id: 'eternal', name: '영원한 스텔라', need: '레벨 100', ok: s => s.level >= 100 }
]
const OWNER = 'zlero' // 제작자 계정은 꾸미기를 전부 쓴다 (클라이언트 render/gear.ts와 같은 아이디)
const open = (list, u) => { const s = stat(u); return list.map(({ id, name, need, ok }) => ({ id, name, need, on: u.id === OWNER || ok(s) })) }
export const canEquip = (u, kind, id) => open(kind === 'plate' ? PLATES : TITLES, u).some(x => x.id === id && x.on)

// 켜진 꾸미기 id 목록: 한 판 전후로 비교해 새로 해금된 것을 구한다 (D2: 결과 화면의 NEW 알림)
const onIds = u => new Set([...open(PLATES, u).filter(x => x.on).map(x => 'p:' + x.id), ...open(TITLES, u).filter(x => x.on).map(x => 't:' + x.id)])
const noteUnlocked = (u, before, now) => { // u.unlocked = {at, plates, titles}: 가장 최근 판에서 새로 열린 것 (판마다 덮어쓴다, 없으면 빈 목록)
  const fresh = (list, k) => list.filter(x => !before.has(k + x.id) && onIds(u).has(k + x.id)).map(({ id, name }) => ({ id, name }))
  u.unlocked = { at: now, plates: fresh(PLATES, 'p:'), titles: fresh(TITLES, 't:') }
}
// 래더를 한 판도 안 했으면 티어 대신 UNRANKED (LP는 0에서 시작해 첫 판부터 오른다)
const tierView = u => {
  const t = tierOf(u.lp ?? 0), placed = (u.wins ?? 0) + (u.losses ?? 0) + (u.draws ?? 0) > 0
  return placed ? { tier: t.tier, div: t.div, pt: t.pt, tierLabel: t.label } : { tier: 'UNRANKED', div: 0, pt: t.pt, tierLabel: 'UNRANKED' }
}
// 프로필 이미지 키: "공개번호.올린시각" (없으면 ''). 번호는 로그인 아이디와 따로 만든 무작위 값이라 이미지 주소로 아이디가 새지 않는다
export const avatarKey = u => (u.pid && u.avatarAt ? `${u.pid}.${u.avatarAt}` : '')
// 가장 많이 친 곡 5개 (곡 폴더별 판 수 합계)
const favoriteOf = u => { const m = {}; for (const [k, c] of Object.entries(u.boardPlays ?? {})) m[dirOf(k)] = (m[dirOf(k)] ?? 0) + c; return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([dir, plays]) => ({ dir, plays })) }
// 앱이 그리는 프로필: 레벨·경험치·티어·클래스·꾸미기와 해금 목록
export function profileView(u, now = Date.now()) {
  const lv = levelOf(u.exp ?? 0), pts = classPoints(u.bests), plate = canEquip(u, 'plate', u.plate ?? 'default') ? u.plate ?? 'default' : 'default', title = canEquip(u, 'title', u.title ?? 'rookie') ? u.title ?? 'rookie' : ''
  return {
    id: u.id, nick: u.nick, ...lv, exp: u.exp ?? 0, plays: u.plays ?? 0, fcs: u.fcs ?? 0, aps: u.aps ?? 0,
    lp: u.lp ?? 0, ...tierView(u),
    wins: u.wins ?? 0, losses: u.losses ?? 0, draws: u.draws ?? 0,
    avatar: avatarKey(u), cls: classOf(pts), plate, title, titleName: TITLES.find(t => t.id === title)?.name ?? '',
    plates: open(PLATES, u), titles: open(TITLES, u),
    top: classTop(u.bests), achievements: achievementsOf(u),
    stats: { playSec: u.playSec ?? 0, judged: u.judged ?? [0, 0, 0, 0, 0, 0], grades: u.grades ?? {}, songs: stat(u).songs, favorite: favoriteOf(u) },
    daily: { goal: DAILY_GOAL, bonus: DAILY_BONUS, have: u.expDay === dayOf(now) ? new Set(Object.keys(u.expBoards ?? {}).map(dirOf)).size : 0, claimed: u.dailyDay === dayOf(now) }, // 오늘 친 서로 다른 곡 수와 보너스를 받았는지
    unlocked: u.unlocked ?? { at: 0, plates: [], titles: [] } // 가장 최근 판(래더 포함)으로 새로 열린 꾸미기: at(ms)이 방금이면 결과 화면에 NEW로 보인다
  }
}
// 남에게 보이는 줄임 프로필 (랭킹·래더 상대)
export const publicView = u => { const v = profileView(u); return { nick: v.nick, level: v.level, tier: v.tier, div: v.div, tierLabel: v.tierLabel, lp: v.lp, titleName: v.titleName, avatar: v.avatar } }

// 한 판의 결과를 계정에 쌓는다: 경험치·플레이 수·풀콤보/올퍼펙트·곡별 최고 점수. 받은 경험치를 돌려준다
// 같은 곡·난이도를 같은 날 다시 치면 경험치는 4분의 1(최소 5)만 준다: 한 곡 반복으로 레벨을 올리지 못하게. 플레이 수·풀콤보·올 퍼펙트·최고 점수는 그대로 쌓인다
export const REPEAT_EXP = 0.25
// extra = {n: 판정 개수 6칸, acc: 정확도 %, sec: 곡을 시작하고 끝낸 때까지 초}: 통계 탭에 쓰는 누계. 없으면 건너뛴다 (옛 앱은 n을 안 보낸다)
export function applyPlay(u, boardKey, score, badge, now = Date.now(), extra = {}) {
  const before = onIds(u)
  const day = new Date(now + 9 * 3600e3).toISOString().slice(0, 10) // 한국 시간 기준 하루
  if (u.expDay !== day) { u.expDay = day; u.expBoards = {} }
  const seen = u.expBoards[boardKey] = (u.expBoards[boardKey] ?? 0) + 1
  const full = playExp(score, badge)
  let gain = seen === 1 ? full : Math.max(5, Math.floor(full * REPEAT_EXP))
  if (u.dailyDay !== day && new Set(Object.keys(u.expBoards).map(dirOf)).size >= DAILY_GOAL) { u.dailyDay = day; gain += DAILY_BONUS } // 일일 목표: 오늘 서로 다른 곡 3곡
  u.exp = (u.exp ?? 0) + gain; u.plays = (u.plays ?? 0) + 1
  if (badge === 'ALL PERFECT') u.aps = (u.aps ?? 0) + 1
  if (badge === 'FULL COMBO') u.fcs = (u.fcs ?? 0) + 1
  u.bests ??= {}
  if (!(u.bests[boardKey] >= score)) u.bests[boardKey] = score
  u.boardPlays ??= {}; u.boardPlays[boardKey] = (u.boardPlays[boardKey] ?? 0) + 1
  if (Array.isArray(extra.n) && extra.n.length === 6) u.judged = extra.n.map((c, i) => (u.judged?.[i] ?? 0) + (Number.isInteger(c) && c >= 0 ? c : 0))
  if (extra.acc >= 0 && extra.acc <= 100) { u.grades ??= {}; const g = gradeOf(extra.acc); u.grades[g] = (u.grades[g] ?? 0) + 1 }
  if (extra.sec > 0) u.playSec = (u.playSec ?? 0) + Math.min(Math.round(extra.sec), 1200)
  noteUnlocked(u, before, now)
  return gain
}
// 래더 한 판의 결과 (res: 1 이김, 0.5 비김, 0 짐). LP와 전적, 경험치를 바꾸고 LP 변화를 돌려준다
export function applyLadder(u, oppLp, res, now = Date.now()) {
  const before = onIds(u)
  const d = ladderDelta(u.lp ?? 0, oppLp, res)
  u.lp = Math.max(0, (u.lp ?? 0) + d)
  if (res === 1) u.wins = (u.wins ?? 0) + 1; else if (res === 0) u.losses = (u.losses ?? 0) + 1; else u.draws = (u.draws ?? 0) + 1
  u.exp = (u.exp ?? 0) + ladderExp(res)
  noteUnlocked(u, before, now)
  return d
}
