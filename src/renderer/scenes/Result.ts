import type { Scene, SceneManager } from '../core/SceneManager'
import type { Song } from '../../shared/types'
import { JUDGES, ScoreKeeper } from '../game/ScoreKeeper'
import { diffName } from '../data/Songs'
import { account, saveSettings, settings } from '../data/Storage'
import { getBest, setBest } from '../data/Storage'
import { sfx } from '../core/Sfx'
import { fetchRank, submitRank, rankMsg, type RankRow } from '../data/Rank'
import { prof, refreshProfile } from '../data/Profile'
import { FONT, ICE, AMBER, artOf, chip, drawBg, drawCover, ease as easeId, fit, footer, glow, slant, starPath } from '../render/theme'

const ease = (x: number) => 1 - (1 - x) ** 3
const back = (x: number) => 1 + 2.2 * (x - 1) ** 3 + 1.2 * (x - 1) ** 2 // 살짝 튕기며 멈춘다
const O = 1.5 // 처음 STAGE CLEAR 배너가 지나가는 시간(초) — 디맥처럼 흐린 배경 위에 배너가 먼저 나온다
const INTRO = O + 4 // 연출이 끝나는 시각(초). 이 안에 Enter를 누르면 연출만 건너뛴다

const COLORS = [ICE, '#7dff9a', '#ffe27a', '#ffb066', '#ff8a8a', '#ff4d6d']

export const Result = (sm: SceneManager): Scene => {
  let applied: number | undefined // O 키로 맞춘 뒤의 판정 오프셋
  let d: { song: Song; diff: string; sk: ScoreKeeper; failed?: boolean; practice?: boolean; fromPct?: number }, isNew = false
  let at = 0, slammed = false, chimed = false, prev: number | undefined // 연출 시작 시각 · 소리 낸 적 있는지 · 이전 최고 점수
  let gain = 0, lvUp = 0 // 이번 판으로 받은 경험치 · 오른 레벨 (로그인했고 서버가 받아 준 경우)
  let detail = false // Space: 왼쪽 상세정보 패널
  let board: RankRow[] | undefined, loading = false, showBoard = false // 온라인 순위: 서버 응답 · 받는 중 · 오른쪽 카드를 순위로 볼지(Tab)
  return {
    enter(data) {
      d = data as typeof d
      applied = undefined
      at = performance.now(); slammed = chimed = false
      prev = d.failed || d.practice ? undefined : getBest(d.song.dir, d.diff)?.score
      isNew = d.failed || d.practice ? false : setBest(d.song.dir, d.diff, d.sk) // 체력이 다해 끝난 플레이는 기록하지 않는다
      board = undefined; loading = true; showBoard = false; detail = false; gain = lvUp = 0
      const mine = d, before = prof.v // 받는 동안 화면을 떠났다 돌아와도 이전 응답이 덮지 않게
      ;(d.failed || d.practice ? fetchRank(d.song.dir, d.diff) : submitRank(d.song.dir, d.diff, d.sk)).then(b => {
        if (mine === d) { board = b; loading = false }
        if (!d.failed && !d.practice && b) void refreshProfile().then(after => { if (mine === d && before && after && after.exp > before.exp) { gain = after.exp - before.exp; lvUp = after.level - before.level } })
      })
    },
    render(g) {
      const { song, sk } = d, t = performance.now() / 1000, el = (performance.now() - at) / 1000
      const prog = (a: number, b: number) => Math.min(Math.max((el - O - a) / (b - a), 0), 1) // 배너가 끝난 뒤 a~b초 사이의 진행도 0~1
      const cnt = ease(prog(0.2, 2.0)) // 정확도 링·판정 숫자가 차오르는 속도 (처음엔 빠르게 끝으로 갈수록 느리게)
      const sc = ease(prog(1.7, 3.0)) // 점수는 링이 거의 찬 뒤에 올라간다
      const bl = 16 * (1 - ease(prog(-0.3, 2.4))) // 뒷그림이 흐렸다가 점점 또렷해진다
      if (bl > 0.3) g.filter = `blur(${bl.toFixed(1)}px)`
      drawBg(g, song)
      g.filter = 'none'
      if (el < O - 0.1) { // STAGE CLEAR 배너: 왼쪽에서 들어와 가는 글씨로 바뀌고 반짝이 하나가 지나간다
        const bp = (a: number, b: number) => Math.min(Math.max((el - a) / (b - a), 0), 1), fail = !!d.failed
        const slide = ease(bp(0.1, 0.45)), solid = (1 - bp(0.75, 1.05)) * slide, thin = bp(0.8, 1.1) * (1 - bp(1.2, 1.45))
        g.fillStyle = 'rgba(0,0,0,.28)'; g.fillRect(0, 0, 1280, 720)
        g.textAlign = 'center'; g.font = `300 66px ${FONT}`
        if (solid > 0) {
          g.save(); g.globalAlpha = solid; const bx = 340 - 520 * (1 - slide), gr = g.createLinearGradient(bx, 0, bx + 600, 0)
          gr.addColorStop(0, fail ? '#9aa3b8' : '#ff9ec0'); gr.addColorStop(1, fail ? '#ff8a8a' : '#ffb25a')
          g.fillStyle = gr; g.beginPath(); g.moveTo(bx + 34, 322); g.lineTo(bx + 600, 322); g.lineTo(bx + 566, 404); g.lineTo(bx, 404); g.closePath(); g.fill()
          g.fillStyle = 'rgba(255,255,255,.92)'; g.fillText(fail ? 'STAGE FAILED' : 'STAGE CLEAR', bx + 300, 380); g.restore()
        }
        if (thin > 0) { g.globalAlpha = thin; g.fillStyle = fail ? '#ffb0b0' : '#ffc28a'; g.fillText(fail ? 'STAGE FAILED' : 'STAGE CLEAR', 640, 380); g.globalAlpha = 1 }
        const gp = bp(0.35, 1.05)
        if (gp > 0 && gp < 1) {
          const k = Math.sin(Math.PI * gp), fx = 420 + 440 * gp, fy = 362
          g.save(); g.strokeStyle = '#fff'; g.lineCap = 'round'; g.globalAlpha = k
          for (const [a, l] of [[-0.4, 190], [1.15, 90]]) { g.lineWidth = 3.5 * k + 0.5; g.beginPath(); g.moveTo(fx - Math.cos(a) * l * k, fy - Math.sin(a) * l * k); g.lineTo(fx + Math.cos(a) * l * k, fy + Math.sin(a) * l * k); g.stroke() }
          g.restore()
        }
        return
      }
      g.textAlign = 'left'
      g.fillStyle = `rgba(3,6,18,${0.2 + 0.4 * cnt})`; g.fillRect(0, 0, 1280, 720) // 링이 찰수록 뒷그림이 어두워진다
      const fail = !!d.failed, land = el - O >= 3.5, ep = prog(3.0, 3.5)
      if (el - O >= 3.4 && !slammed) { slammed = true; sfx.slam() }
      const gold = fail ? '#ff8a8a' : '#ffd84a'

      // 위 머리띠: 곡 정보 (가운데 모아서, 디맥처럼)
      const hy = -80 * (1 - ease(prog(-0.2, 0.3)))
      g.save(); g.translate(0, hy)
      g.fillStyle = 'rgba(10,16,34,.8)'; g.fillRect(0, 0, 1280, 80)
      const im = artOf(song)!.img
      g.save(); g.beginPath(); g.roundRect(468, 16, 48, 48, 4); g.clip(); drawCover(g, im, im.width, im.height, 468, 16, 48, 48); g.restore()
      g.textAlign = 'left'; g.font = `600 11px ${FONT}`; g.fillStyle = 'rgba(230,240,255,.6)'; g.fillText(`${settings.keyMode}K TUNES`, 528, 24)
      if (d.practice) { g.textAlign = 'right'; g.font = `800 14px ${FONT}`; g.fillStyle = '#9dd8ff'; g.fillText('PRACTICE · 기록과 순위에 올라가지 않습니다', 1240, 46); g.textAlign = 'left' }
      g.font = `800 18px ${FONT}`; g.fillStyle = '#fff'; g.fillText(fit(g, song.meta.title, 420), 528, 45)
      g.font = `600 12px ${FONT}`; g.fillStyle = 'rgba(230,240,255,.55)'; g.fillText(fit(g, song.meta.artist, 300), 528, 61)
      g.font = `800 13px ${FONT}`; g.fillStyle = '#ff9f1a'; g.fillText(diffName(d.diff).toUpperCase(), 528, 76)
      const me = account.token ? board?.findIndex(r => r.nick === account.nick) ?? -1 : -1
      if (me >= 0) { g.textAlign = 'right'; g.font = `800 14px ${FONT}`; g.fillStyle = '#ffe27a'; g.fillText(`ONLINE #${me + 1}`, 1240, 46); g.textAlign = 'left' }
      g.restore()

      // 가운데: 링 · 등급 · 양옆 깃발
      const cx = 640, cy = 290, R = 118
      glow(g, land ? (fail ? 'rgba(255,90,110,.45)' : 'rgba(255,200,80,.45)') : 'rgba(0,0,0,0)', 40, () => { g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.fillStyle = 'rgba(10,12,26,.5)'; g.fill() })
      const aa = sk.accuracy * cnt / 100 // 링은 시계 방향으로 정확도만큼 차오른다
      if (aa > 0.001) {
        const ring = g.createLinearGradient(cx, cy - R, cx, cy + R); ring.addColorStop(0, fail ? '#ff8a8a' : '#ffbd2e'); ring.addColorStop(1, fail ? '#a33' : '#ff7a8a')
        g.lineWidth = 15; g.lineCap = 'round'; g.strokeStyle = ring; g.beginPath(); g.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(aa, 0.9999)); g.stroke(); g.lineCap = 'butt'
      }
      g.textAlign = 'center'; g.font = `700 16px ${FONT}`; g.fillStyle = '#ff9a9a'; g.fillText(`${(sk.accuracy * cnt).toFixed(2)}%`, cx, cy + R + 28)
      if (ep < 1) { g.globalAlpha = 1 - ep; g.font = `300 56px ${FONT}`; g.fillStyle = '#fff'; g.fillText(`${(sk.accuracy * cnt).toFixed(0)}`, cx, cy + 20); g.globalAlpha = 1 }
      if (ep > 0) { // 등급 글자: 커졌다가 쾅 내려앉는다
        g.save(); const es = 1 + 1.6 * (1 - back(ep)); g.globalAlpha = Math.min(ep * 3, 1); g.translate(cx, cy); g.scale(es, es); g.translate(-cx, -cy)
        const gr = fail ? 'F' : sk.rank, rg = g.createLinearGradient(0, cy - 70, 0, cy + 70); rg.addColorStop(0, fail ? '#ffd0d0' : '#fff35a'); rg.addColorStop(1, fail ? '#ff6a6a' : '#ffa21f')
        g.font = `900 ${gr.length > 1 ? 130 : 160}px ${FONT}`; g.lineJoin = 'round'; g.lineWidth = 8; g.strokeStyle = 'rgba(40,20,0,.55)'; g.strokeText(gr, cx, cy + 52)
        glow(g, 'rgba(255,190,60,.55)', 24, () => { g.fillStyle = rg; g.fillText(gr, cx, cy + 52) })
        g.restore()
      }
      if (land) { // 충격파 · 반짝이
        const sp = prog(3.5, 4.2)
        if (sp < 1) { g.save(); g.globalAlpha = (1 - sp) * 0.8; g.strokeStyle = fail ? '#ff8a8a' : '#fff6d6'; g.lineWidth = 6 * (1 - sp) + 1; g.beginPath(); g.arc(cx, cy, R + 150 * ease(sp), 0, Math.PI * 2); g.stroke(); g.restore() }
        const fp = prog(3.5, 4.2)
        if (fp < 1) { const k = Math.sin(Math.PI * fp), fx = cx + 60, fy = cy - 50; g.save(); g.globalAlpha = k; g.strokeStyle = '#fff'; g.lineCap = 'round'; for (const [an, l] of [[-0.45, 180], [1.1, 100]]) { g.lineWidth = 3 * k + 0.5; g.beginPath(); g.moveTo(fx - Math.cos(an) * l * k, fy - Math.sin(an) * l * k); g.lineTo(fx + Math.cos(an) * l * k, fy + Math.sin(an) * l * k); g.stroke() } g.restore() }
        if (!fail) for (const [dx, dy, r, ph] of [[-150, -60, 12, 0], [-142, 56, 9, 1.4], [150, -92, 14, 2.6], [128, 70, 8, 3.9]] as const) glow(g, AMBER, 14, () => { starPath(g, cx + dx, cy + dy, r * (0.6 + 0.4 * Math.sin(t * 2.6 + ph))); g.fillStyle = '#ffe6a8'; g.fill() })
      }
      // 깃발: 숫자 위에 이름표. left=true면 숫자가 왼쪽 끝에 붙는다
      const flag = (x: number, y: number, num: number, label: string, col: string, tag: string, left: boolean, a: number) => {
        if (a <= 0) return
        g.save(); g.globalAlpha = a; g.translate((left ? -30 : 30) * (1 - a), 0)
        g.textAlign = left ? 'left' : 'right'; g.font = `800 24px ${FONT}`; g.fillStyle = col; g.fillText(String(Math.round(num * cnt)), x, y)
        const w = 96, tx = left ? x : x - w; slant(g, tx, y + 6, w, 20, 8); g.fillStyle = tag; g.fill()
        g.textAlign = 'center'; g.font = `800 12px ${FONT}`; g.fillStyle = '#fff'; g.fillText(label, tx + w / 2, y + 21)
        g.restore()
      }
      const fa = ease(prog(0.6, 1.1)), c = sk.counts
      flag(396, 268, c[0], sk.maxCount ? `PERFECT · MAX ${sk.maxCount}` : 'PERFECT', '#ffd84a', 'rgba(150,120,20,.9)', true, fa)
      flag(884, 268, c[1] + c[2], 'GREAT · GOOD', '#ff8fc0', 'rgba(150,60,110,.9)', false, fa)
      flag(776, 150, c[3] + c[4] + c[5], 'NICE · BAD · MISS', '#ff5a4a', 'rgba(110,30,26,.9)', false, fa)
      flag(742, 394, sk.maxCombo, 'MAX COMBO', '#ffd84a', 'rgba(150,120,20,.9)', true, fa)
      const tag = fail ? 'FAILED' : sk.badge // 올 퍼펙트·풀 콤보: 별 모양 배지
      if (tag && el - O >= 3.55) {
        g.save(); const tp = back(prog(3.55, 3.9)), bx = 690, by = 402; g.globalAlpha = Math.min(tp * 2, 1); g.translate(bx, by); g.rotate(-0.22); g.scale(tp, tp)
        g.beginPath(); for (let i = 0; i < 20; i++) { const r = i % 2 ? 31 : 44, an = (i * Math.PI) / 10; g.lineTo(Math.cos(an) * r, Math.sin(an) * r) } g.closePath()
        const sg = g.createLinearGradient(-44, -44, 44, 44); sg.addColorStop(0, fail ? '#c0392b' : tag === 'ALL PERFECT' ? '#7a3dff' : '#2f8cff'); sg.addColorStop(1, fail ? '#7a1c14' : tag === 'ALL PERFECT' ? '#ff3dbb' : '#3dd0ff')
        g.fillStyle = sg; g.fill(); g.lineWidth = 3; g.strokeStyle = '#fff'; g.stroke()
        g.fillStyle = '#fff'; g.textAlign = 'center'; g.font = `900 14px ${FONT}`
        const ws = tag.split(' '); ws.forEach((w, i) => g.fillText(w, 0, (ws.length === 1 ? 5 : -2 + i * 15)))
        if (tag === 'ALL PERFECT') { g.beginPath(); g.moveTo(-14, -40); g.lineTo(-10, -56); g.lineTo(-3, -46); g.lineTo(2, -60); g.lineTo(7, -46); g.lineTo(14, -56); g.lineTo(16, -40); g.closePath(); g.fillStyle = '#ffd84a'; g.fill() }
        g.restore()
      }

      // 점수 · 플레이어 막대
      const sa = ease(prog(1.6, 2.1))
      g.globalAlpha = sa; g.textAlign = 'left'
      slant(g, 524, 476, 68, 18, 6); g.fillStyle = 'rgba(130,136,155,.75)'; g.fill(); g.font = `700 11px ${FONT}`; g.fillStyle = '#fff'; g.fillText('SCORE', 536, 489)
      g.textAlign = 'center'; g.font = `300 78px ${FONT}`; g.fillStyle = '#fff'; g.fillText(String(Math.round(sk.score * sc)), cx, 556)
      const chipA = ease(prog(3.6, 4.0)) // 칩은 점수가 다 올라간 뒤에 뜬다
      g.globalAlpha = sa
      const pv = prof.v, lv = pv?.level
      g.fillStyle = 'rgba(30,34,52,.9)'; g.fillRect(514, 568, 252, 46)
      g.fillStyle = 'rgba(255,255,255,.1)'; g.fillRect(514, 568, 46, 46)
      g.textAlign = 'center'; g.font = `800 22px ${FONT}`; g.fillStyle = '#fff'; g.fillText([...(account.token ? account.nick : 'G')][0]?.toUpperCase() ?? 'G', 537, 598)
      g.textAlign = 'left'; g.font = `700 13px ${FONT}`; g.fillStyle = '#fff'; g.fillText(fit(g, account.token ? account.nick : 'GUEST', 190), 570, 585)
      if (lv) { g.font = `700 9px ${FONT}`; g.fillStyle = 'rgba(255,255,255,.6)'; g.fillText('LV', 570, 603); g.font = `300 20px ${FONT}`; g.fillStyle = 'rgba(255,255,255,.9)'; g.fillText(`${lv}`, 586, 605) } // 닉네임 · 레벨 · 경험치 막대가 서로 겹치지 않게 세 줄로 나눈다
      if (pv && pv.need) { g.fillStyle = 'rgba(255,255,255,.2)'; g.fillRect(570, 609, 188, 3); g.fillStyle = '#ffc233'; g.fillRect(570, 609, 188 * Math.min(pv.cur / pv.need, 1), 3) }
      g.globalAlpha = 1
      // 아래 왼쪽: 이전 최고 기록과의 차이 · 오른쪽: 경험치
      g.globalAlpha = chipA; g.textAlign = 'left'
      if (prev !== undefined) { g.font = `700 13px ${FONT}`; g.fillStyle = 'rgba(255,255,255,.7)'; g.fillText(`BEST ${prev.toLocaleString()}`, 400, 640); if (isNew) { g.font = `800 16px ${FONT}`; g.fillStyle = '#ffc233'; g.fillText(`+${(sk.score - prev).toLocaleString()}`, 400, 662) } }
      if (isNew) { const w = 120; slant(g, 598 + 130, 480, w, 24, 8); g.fillStyle = '#ff9f1a'; g.fill(); g.font = `800 13px ${FONT}`; g.fillStyle = '#fff'; g.textAlign = 'center'; g.fillText('NEW RECORD', 728 + w / 2, 497) }
      if (isNew && el - O >= 3.6 && !chimed) { chimed = true; sfx.chime() }
      if (gain) { g.textAlign = 'left'; g.font = `800 14px ${FONT}`; g.fillStyle = '#c9a8ff'; g.fillText(lvUp > 0 ? `EXP +${gain}  ·  LEVEL UP  Lv ${prof.v?.level}` : `EXP +${gain}`, 800, 640) }
      g.globalAlpha = 1

      // 왼쪽 DETAILS (Space): 판정 · 정확도 · 타이밍
      const dk = easeId('res-detail', detail), rk = easeId('res-board', showBoard)
      if (dk > 0.01) {
        g.save(); g.translate(-262 * (1 - dk), 0)
        g.fillStyle = 'rgba(0,0,0,.84)'; g.fillRect(0, 140, 254, 454); g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = 1; g.strokeRect(0.5, 140.5, 253, 453)
        slant(g, 40, 160, 168, 34, 10); g.fillStyle = 'rgba(120,128,142,.6)'; g.fill(); g.textAlign = 'center'; g.font = `300 26px ${FONT}`; g.fillStyle = '#fff'; g.fillText('DETAILS', 124, 186)
        g.textAlign = 'left'
        JUDGES.forEach((j, i) => { const y = 226 + i * 24; g.font = `800 13px ${FONT}`; g.fillStyle = COLORS[i]; g.fillText(j.name, 24, y); g.textAlign = 'right'; g.font = `800 15px ${FONT}`; g.fillStyle = '#ffd84a'; g.fillText(String(c[i]) + (i === 0 && sk.maxCount ? `  (MAX ${sk.maxCount})` : ''), 232, y); g.textAlign = 'left' })
        g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(24, 376, 208, 1)
        g.font = `800 13px ${FONT}`; g.fillStyle = '#ff9a7a'; g.fillText('RATE', 24, 400); g.fillStyle = '#ffd84a'; g.font = `800 15px ${FONT}`; g.textAlign = 'right'; g.fillText(`${sk.accuracy.toFixed(2)}%`, 232, 400); g.textAlign = 'left'
        const h = sk.histogram(20, 200), top = Math.max(...h, 1), hx0 = 24, bw = 208 / h.length, base = 480 // 타이밍 오차 분포 (가운데가 정확히 맞춘 곳)
        h.forEach((n, i) => { const ms = Math.abs(i - h.length / 2 + 0.5) * 20; g.fillStyle = ms <= JUDGES[0].win * 1000 ? ICE : ms <= JUDGES[2].win * 1000 ? '#7dff9a' : '#ffb066'; const bh = Math.round((56 * n) / top); if (bh > 0) { g.beginPath(); g.roundRect(hx0 + i * bw + 1, base - bh, bw - 2, bh, 2); g.fill() } })
        g.fillStyle = 'rgba(255,255,255,.7)'; g.fillRect(hx0 + 103, 420, 2, 64)
        g.font = `600 10px ${FONT}`; g.fillStyle = 'rgba(230,240,255,.7)'; g.fillText('빠름', 24, 498); g.textAlign = 'center'; g.fillText('0', 128, 498); g.textAlign = 'right'; g.fillText('느림', 232, 498); g.textAlign = 'left'
        const avg = sk.avgMs, rec = Math.round(avg / 5) * 5 // 판정 오프셋은 5ms 단위. 늦게 쳤으면(avg<0) +, 빨리 쳤으면 -
        g.font = `800 14px ${FONT}`; g.fillStyle = '#fff'; g.fillText(avg ? `평균 ${Math.abs(avg)}ms ${avg > 0 ? 'FAST' : 'SLOW'}` : '평균 오차 0ms', 24, 526)
        g.font = `12px ${FONT}`; g.fillStyle = ICE
        g.fillText(applied !== undefined ? `오프셋 ${applied > 0 ? '+' : ''}${applied}ms로 맞춤` : rec ? `O 키: 오프셋 ${-rec > 0 ? '+' : ''}${-rec} 조정` : '판정 오프셋은 그대로 좋습니다', 24, 550)
        g.restore()
      }
      // 오른쪽 ONLINE RANKING (Tab)
      if (rk > 0.01) {
        g.save(); g.translate(262 * (1 - rk), 0)
        g.fillStyle = 'rgba(0,0,0,.84)'; g.fillRect(1026, 140, 254, 454); g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = 1; g.strokeRect(1026.5, 140.5, 253, 453)
        slant(g, 1052, 160, 202, 34, 10); g.fillStyle = 'rgba(120,128,142,.6)'; g.fill(); g.textAlign = 'center'; g.font = `300 20px ${FONT}`; g.fillStyle = '#fff'; g.fillText('ONLINE RANKING', 1153, 183)
        if (!board?.length) { g.font = `14px ${FONT}`; g.fillStyle = ICE; g.fillText(loading ? '순위를 불러오는 중…' : '순위를 불러오지 못했습니다', 1153, 360) }
        if (!account.token) { g.font = `700 12px ${FONT}`; g.fillStyle = AMBER; g.fillText('로그인하면 순위에 올라갑니다', 1153, 574) }
        board?.slice(0, 10).forEach((r, i) => { // 줄마다: 순위 · 닉네임 · 점수 / 정확도 · 최대 콤보 · 레벨 · 올 퍼펙트(AP)·풀 콤보(FC)
          const y = 206 + i * 38, mine = !!account.token && r.nick === account.nick
          g.fillStyle = mine ? 'rgba(255,159,26,.35)' : 'rgba(255,255,255,.07)'; g.fillRect(1036, y, 234, 34)
          g.font = `800 14px ${FONT}`; g.fillStyle = i < 3 ? '#ffe27a' : '#fff'; g.textAlign = 'center'; g.fillText(String(i + 1), 1054, y + 22)
          g.textAlign = 'left'; g.font = `700 13px ${FONT}`; g.fillStyle = '#fff'; g.fillText(fit(g, r.nick, r.badge ? 78 : 100), 1072, y + 15)
          if (r.badge) { g.font = `800 10px ${FONT}`; g.fillStyle = r.badge === 'ALL PERFECT' ? '#f2b705' : '#7ad8ff'; g.fillText(r.badge === 'ALL PERFECT' ? 'AP' : 'FC', 1154, y + 14) }
          g.font = `600 10px ${FONT}`; g.fillStyle = 'rgba(230,240,255,.7)'; g.fillText(`${r.acc.toFixed(2)}%  ·  ${r.mc}콤보${r.lv ? `  ·  Lv ${r.lv}` : ''}`, 1072, y + 28)
          g.font = `800 14px ${FONT}`; g.textAlign = 'right'; g.fillStyle = '#ffd84a'; g.fillText(String(r.score), 1262, y + 15)
        })
        g.restore()
      }

      // 아래 띠: 키 안내
      footer(g)
      if (rankMsg && !loading && !d.failed) { g.font = `700 12px ${FONT}`; g.fillStyle = AMBER; g.textAlign = 'left'; g.fillText(rankMsg, 24, 700) } // 점수를 서버에 못 올렸을 때 이유
      let kx = 640
      for (const [k, label, real] of [['Space', '상세정보', ' '], ['Tab', showBoard ? '순위 닫기' : '순위', undefined], ['O', '보정', undefined], ['Esc', '곡 선택', undefined], ['Enter', '재도전', undefined]] as [string, string, string | undefined][])
        kx = chip(g, kx, 684, k, label, ICE, real, 24, 13)
    },
    keydown(e) {
      if (e.key.toLowerCase() === 'o' && d.sk.avgMs) { // 평균 오차만큼 판정 오프셋을 바로 맞춘다 (5ms 단위)
        const rec = Math.round(d.sk.avgMs / 5) * 5
        settings.judgeOffset = Math.min(Math.max(settings.judgeOffset - rec, -100), 100); saveSettings(); applied = settings.judgeOffset
      }
      else if ((e.key === 'Enter' || e.key === ' ') && performance.now() - at < INTRO * 1000) { at = performance.now() - INTRO * 1000; slammed = chimed = true } // 연출 중 Enter·Space: 바로 최종 화면으로
      else if (e.key === ' ') detail = !detail
      else if (e.key === 'Tab') { e.preventDefault(); showBoard = !showBoard }
      else if (e.key === 'Enter') sm.go('play', { song: d.song, diff: d.diff, fromPct: d.fromPct }) // 연습으로 쳤으면 같은 시작 위치로 다시
      else if (e.key === 'Escape') sm.go('select')
    }
  }
}
