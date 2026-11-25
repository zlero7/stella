import { FONT, AMBER, CYAN, ICE, fit, meter } from '../render/theme'
import { songTitle } from '../data/Songs'
import { JUDGES } from '../game/ScoreKeeper'
import type { Profile } from '../data/Profile'

// 컬렉션의 DJ CLASS 아래 목록, STATS 탭, ACHIEVE 탭 그림. 값은 전부 서버가 계산해서 준다 (Profile)
const DIFF_NAME: Record<string, string> = { easy: 'EASY', normal: 'NORMAL', hard: 'HARD', stella: 'STELLA' }

// DJ CLASS 탭 아래: 점수에 들어가는 상위 20개 기록 (이걸 올리면 클래스가 오른다)
export function drawTop(g: CanvasRenderingContext2D, p: Profile) {
  g.textAlign = 'left'; g.font = `600 12px ${FONT}`; g.fillStyle = ICE
  g.fillText('점수 = 최고 점수÷10,000 × 난이도(EASY×0.5 · NORMAL×0.75 · HARD×1 · STELLA×1.25), 아래 상위 20개의 합', 520, 392)
  const top = p.top ?? []
  if (!top.length) { g.textAlign = 'center'; g.font = `14px ${FONT}`; g.fillStyle = ICE; g.fillText('아직 온라인 기록이 없습니다. 곡을 치면 여기에 쌓입니다', 865, 480); return }
  top.forEach((t, i) => {
    const col = i < 10 ? 0 : 1, row = i % 10, x = 520 + col * 350, y = 416 + row * 17
    const slash = t.k.lastIndexOf('/'), dir = t.k.slice(0, slash), m = /^(\d)k-(\w+)$/.exec(t.k.slice(slash + 1))
    g.textAlign = 'left'; g.font = `700 12px ${FONT}`; g.fillStyle = AMBER; g.fillText(String(i + 1).padStart(2, ' '), x, y)
    g.font = `600 12px ${FONT}`; g.fillStyle = '#fff'; g.fillText(fit(g, songTitle(dir), 200), x + 24, y)
    g.fillStyle = ICE; g.fillText(m ? `${m[1]}K ${DIFF_NAME[m[2]] ?? m[2].toUpperCase()}` : '', x + 232, y)
    g.textAlign = 'right'; g.fillStyle = '#ffd84a'; g.fillText(t.pts.toFixed(1), x + 330, y)
  })
}

const hm = (s: number) => (s >= 3600 ? `${Math.floor(s / 3600)}시간 ${Math.floor((s % 3600) / 60)}분` : `${Math.floor(s / 60)}분`)

// STATS 탭: 오늘의 목표 · 플레이 시간 · 판정 누계 · 등급 분포 · 가장 많이 친 곡
export function drawStats(g: CanvasRenderingContext2D, p: Profile) {
  const s = p.stats, d = p.daily, X = 530, RX = 900, head = (t: string, x: number, y: number) => { g.textAlign = 'left'; g.font = `800 14px ${FONT}`; g.fillStyle = CYAN; g.fillText(t, x, y) }
  head('TODAY', X, 150)
  g.textAlign = 'left'
  if (d) {
    g.font = `800 20px ${FONT}`; g.fillStyle = '#fff'; g.fillText(`오늘의 목표  ${Math.min(d.have, d.goal)} / ${d.goal}곡`, X, 182)
    meter(g, X, 194, 300, Math.min(d.have / d.goal, 1))
    g.font = `600 12px ${FONT}`; g.fillStyle = d.claimed ? '#7dff9a' : ICE; g.fillText(d.claimed ? `보너스 +${d.bonus} EXP를 받았습니다` : `오늘 서로 다른 곡 ${d.goal}곡을 치면 보너스 +${d.bonus} EXP`, X, 226)
  } else { g.font = `14px ${FONT}`; g.fillStyle = ICE; g.fillText('서버가 업데이트되면 보입니다', X, 182) }
  head('TOTAL', X, 272)
  g.font = `700 15px ${FONT}`; g.fillStyle = '#fff'; g.fillText(`플레이 시간  ${hm(s?.playSec ?? 0)}`, X, 300); g.fillText(`친 곡  ${s?.songs ?? 0}곡`, X, 326)
  head('JUDGEMENTS', X, 372)
  const j = s?.judged ?? [], max = Math.max(...j, 1)
  JUDGES.forEach((jd, i) => {
    const y = 396 + i * 26
    g.font = `700 13px ${FONT}`; g.fillStyle = '#fff'; g.textAlign = 'left'; g.fillText(jd.name, X, y)
    g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(X + 80, y - 11, 150, 10); g.fillStyle = i === 0 ? '#ffd84a' : i === JUDGES.length - 1 ? '#ff6b6b' : '#7ad8ff'; g.fillRect(X + 80, y - 11, (150 * (j[i] ?? 0)) / max, 10)
    g.textAlign = 'right'; g.fillStyle = '#fff'; g.fillText((j[i] ?? 0).toLocaleString(), X + 330, y)
  })
  head('GRADES', RX, 150)
  ;['S+', 'S', 'A', 'B', 'C', 'D'].forEach((gr, i) => { const y = 178 + i * 26; g.font = `800 15px ${FONT}`; g.fillStyle = '#fff'; g.textAlign = 'left'; g.fillText(gr, RX, y); g.textAlign = 'right'; g.fillText(String(s?.grades?.[gr] ?? 0), RX + 280, y) })
  head('MOST PLAYED', RX, 372)
  const fav = s?.favorite ?? []
  if (!fav.length) { g.font = `13px ${FONT}`; g.fillStyle = ICE; g.fillText('아직 기록이 없습니다', RX, 400) }
  fav.forEach((f, i) => { const y = 400 + i * 26; g.textAlign = 'left'; g.font = `700 13px ${FONT}`; g.fillStyle = '#fff'; g.fillText(fit(g, songTitle(f.dir), 210), RX, y); g.textAlign = 'right'; g.fillStyle = '#ffd84a'; g.fillText(`${f.plays}회`, RX + 280, y) })
}

// ACHIEVE 탭: 업적 목록과 진행도
export function drawAchieve(g: CanvasRenderingContext2D, p: Profile) {
  const a = p.achievements ?? []
  if (!a.length) { g.textAlign = 'center'; g.font = `14px ${FONT}`; g.fillStyle = ICE; g.fillText('서버가 업데이트되면 보입니다', 865, 360); return }
  g.textAlign = 'left'; g.font = `800 14px ${FONT}`; g.fillStyle = CYAN; g.fillText(`ACHIEVEMENTS  ${a.filter(x => x.done).length} / ${a.length}`, 530, 162)
  a.forEach((x, i) => {
    const y = 192 + i * 26
    g.textAlign = 'left'; g.font = `800 15px ${FONT}`; g.fillStyle = x.done ? '#ffd84a' : 'rgba(255,255,255,.45)'; g.fillText(x.done ? '★' : '☆', 530, y)
    g.font = `${x.done ? 800 : 600} 14px ${FONT}`; g.fillStyle = x.done ? '#fff' : 'rgba(255,255,255,.7)'; g.fillText(x.name, 556, y)
    g.font = `12px ${FONT}`; g.fillStyle = ICE; g.fillText(fit(g, x.desc, 330), 690, y)
    g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(1040, y - 10, 110, 8); g.fillStyle = x.done ? '#ffd84a' : '#7ad8ff'; g.fillRect(1040, y - 10, (110 * x.cur) / x.goal, 8)
    g.textAlign = 'right'; g.fillStyle = x.done ? '#ffd84a' : '#fff'; g.fillText(`${x.cur}/${x.goal}`, 1210, y)
  })
}
