import type { Scene, SceneManager } from '../core/SceneManager'
import type { Song } from '../../shared/types'
import { JUDGES, ScoreKeeper } from '../game/ScoreKeeper'
import { diffName } from '../data/Songs'
import { account, saveSettings, settings } from '../data/Storage'
import { setBest } from '../data/Storage'
import { fetchRank, submitRank, type RankRow } from '../data/Rank'
import { prof, refreshProfile } from '../data/Profile'
import { FONT, CYAN, ICE, AMBER, artOf, card, chip, drawBg, drawCover, fit, glow, meter, pill, starPath } from '../render/theme'

const COLORS = [ICE, '#7dff9a', '#ffe27a', '#ffb066', '#ff8a8a', '#ff4d6d']

export const Result = (sm: SceneManager): Scene => {
  let applied: number | undefined // O 키로 맞춘 뒤의 판정 오프셋
  let d: { song: Song; diff: string; sk: ScoreKeeper; failed?: boolean }, isNew = false
  let gain = 0, lvUp = 0 // 이번 판으로 받은 경험치 · 오른 레벨 (로그인했고 서버가 받아 준 경우)
  let board: RankRow[] | undefined, loading = false, showBoard = false // 온라인 순위: 서버 응답 · 받는 중 · 오른쪽 카드를 순위로 볼지(Tab)
  return {
    enter(data) {
      d = data as typeof d
      applied = undefined
      isNew = d.failed ? false : setBest(d.song.dir, d.diff, d.sk) // 체력이 다해 끝난 플레이는 기록하지 않는다
      board = undefined; loading = true; showBoard = false; gain = lvUp = 0
      const mine = d, before = prof.v // 받는 동안 화면을 떠났다 돌아와도 이전 응답이 덮지 않게
      ;(d.failed ? fetchRank(d.song.dir, d.diff) : submitRank(d.song.dir, d.diff, d.sk)).then(b => {
        if (mine === d) { board = b; loading = false }
        if (!d.failed && b) void refreshProfile().then(after => { if (mine === d && before && after && after.exp > before.exp) { gain = after.exp - before.exp; lvUp = after.level - before.level } })
      })
    },
    render(g) {
      const { song, sk } = d, t = performance.now() / 1000
      drawBg(g, song)
      g.textAlign = 'left'
      // 위쪽 카드: 곡 정보 (표지는 둥글게)
      card(g, 40, 22, 1200, 100)
      const im = artOf(song)!.img
      g.save(); g.beginPath(); g.roundRect(58, 36, 72, 72, 14); g.clip(); drawCover(g, im, im.width, im.height, 58, 36, 72, 72); g.restore()
      g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 1.5; g.beginPath(); g.roundRect(58, 36, 72, 72, 14); g.stroke()
      g.font = `700 13px ${FONT}`; g.fillStyle = CYAN; g.fillText(`RESULT  ·  ${settings.keyMode}K ${diffName(d.diff)}`, 152, 52)
      g.font = `800 28px ${FONT}`; g.fillStyle = '#fff'; g.fillText(fit(g, song.meta.title, 820), 152, 86)
      g.font = `16px ${FONT}`; g.fillStyle = ICE; g.fillText(fit(g, song.meta.artist, 820), 152, 110)
      pill(g, 1240 - 20 - 112, 54, 112, 36, d.failed ? '#c0392b' : '#ff9f1a')
      g.font = `800 16px ${FONT}`; g.fillStyle = '#fff'; g.textAlign = 'center'; g.fillText(d.failed ? '실 패' : '결 과', 1240 - 20 - 56, 78)
      const me = account.token ? board?.findIndex(r => r.nick === account.nick) ?? -1 : -1
      if (me >= 0) { const w = 128; pill(g, 1240 - 20 - 112 - 12 - w, 54, w, 36, 'rgba(8,24,70,.85)'); g.fillStyle = '#ffe27a'; g.fillText(`ONLINE #${me + 1}`, 1240 - 20 - 112 - 12 - w / 2, 78) }
      g.textAlign = 'left'

      // 왼쪽 카드: 판정 상세 (판정 비율을 막대로 깔아 어디가 많은지 한눈에 보인다)
      card(g, 40, 140, 380, 456, 'JUDGEMENT')
      const tot = sk.counts.reduce((x, y) => x + y, 0) || 1
      JUDGES.forEach((j, i) => {
        const y = 172 + i * 44, f = sk.counts[i] / tot
        g.fillStyle = 'rgba(255,255,255,.08)'; g.beginPath(); g.roundRect(60, y, 340, 36, 10); g.fill()
        if (f > 0) { g.fillStyle = COLORS[i]; g.globalAlpha = 0.34; g.beginPath(); g.roundRect(60, y, Math.max(340 * f, 20), 36, 10); g.fill(); g.globalAlpha = 1 }
        g.fillStyle = COLORS[i]; g.beginPath(); g.roundRect(70, y + 10, 4, 16, 2); g.fill()
        g.font = `800 16px ${FONT}`; g.fillText(j.name, 88, y + 24)
        g.font = `800 22px ${FONT}`; g.fillStyle = '#fff'; g.textAlign = 'right'; g.fillText(String(sk.counts[i]), 388, y + 26); g.textAlign = 'left'
      })
      g.fillStyle = 'rgba(255,255,255,.2)'; g.fillRect(60, 460, 340, 1)
      g.font = `600 14px ${FONT}`; g.fillStyle = ICE; g.fillText('MAX COMBO', 60, 498); g.fillText('ACCURACY', 60, 546)
      g.font = `800 26px ${FONT}`; g.fillStyle = '#fff'; g.textAlign = 'right'
      g.fillText(String(sk.maxCombo), 400, 500); g.fillText(`${sk.accuracy.toFixed(2)}%`, 400, 548); g.textAlign = 'left'

      // 가운데: 등급 카드 · 점수 카드
      const cx = 640
      card(g, 460, 140, 360, 262, 'RANK')
      // 등급 엠블럼: 처음 모양 그대로의 원 (카드 안에 들어가게 반지름만 100으로)
      const cy = 262, R = 84, ring = g.createLinearGradient(cx - R, cy - R, cx + R, cy + R)
      ring.addColorStop(0, d.failed ? '#ff8a8a' : '#ffe27a'); ring.addColorStop(0.5, '#fff'); ring.addColorStop(1, d.failed ? '#a33' : '#7ad8ff')
      glow(g, d.failed ? 'rgba(255,90,110,.5)' : 'rgba(255,226,122,.6)', 34, () => { g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.fillStyle = 'rgba(8,28,80,.9)'; g.fill() })
      g.lineWidth = 8; g.strokeStyle = ring; g.beginPath(); g.arc(cx, cy, R - 2, 0, Math.PI * 2); g.stroke()
      g.lineWidth = 2; g.strokeStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.arc(cx, cy, R - 16, 0, Math.PI * 2); g.stroke()
      g.font = `900 84px ${FONT}`; g.textAlign = 'center'
      const rg = g.createLinearGradient(0, cy - 48, 0, cy + 42); rg.addColorStop(0, '#fff'); rg.addColorStop(1, d.failed ? '#ffb0b0' : '#9aeaff')
      glow(g, 'rgba(120,210,255,.6)', 20, () => { g.fillStyle = rg; g.fillText(d.failed ? 'F' : sk.rank, cx, cy + 29) })
      if (!d.failed) for (const [dx, dy, r, ph] of [[70, -68, 15, 0], [-74, -46, 9, 1.4], [76, 30, 8, 2.6]] as const) glow(g, AMBER, 14, () => { starPath(g, cx + dx, cy + dy, r * (0.6 + 0.4 * Math.sin(t * 2.6 + ph))); g.fillStyle = '#fff6d6'; g.fill() })
      const tag = d.failed ? 'FAILED' : sk.badge // 올 퍼펙트·풀 콤보 칩 (색만이 아니라 글자로도)
      if (tag) {
        g.font = `800 16px ${FONT}`; const w = g.measureText(tag).width + 44
        pill(g, cx - w / 2, 358, w, 30, d.failed ? '#c0392b' : tag === 'ALL PERFECT' ? '#f2b705' : '#2f8cff')
        g.fillStyle = tag === 'ALL PERFECT' ? '#3a2a00' : '#fff'; g.fillText(tag, cx, 378)
      }
      card(g, 460, 418, 360, 178, 'SCORE')
      if (gain) { // 경험치 칩 (레벨이 오르면 함께)
        g.font = `800 13px ${FONT}`; const t1 = lvUp > 0 ? `EXP +${gain}  ·  LEVEL UP  Lv ${prof.v?.level}` : `EXP +${gain}`, w = g.measureText(t1).width + 28
        pill(g, 480, 430, w, 26, lvUp > 0 ? '#9b6bff' : 'rgba(155,107,255,.75)'); g.fillStyle = '#fff'; g.textAlign = 'center'; g.fillText(t1, 480 + w / 2, 448)
      }
      if (isNew) { // 신기록 칩: 디맥처럼 주황
        g.font = `800 13px ${FONT}`; const w = g.measureText('NEW RECORD').width + 28
        pill(g, 460 + 360 - 20 - w, 430, w, 26, '#ff9f1a'); g.fillStyle = '#fff'; g.textAlign = 'center'; g.fillText('NEW RECORD', 460 + 360 - 20 - w / 2, 448)
      }
      g.textAlign = 'center'; g.font = `900 70px ${FONT}`; g.fillStyle = '#fff'; g.fillText(String(sk.score).padStart(7, '0'), cx, 512)
      meter(g, 480, 534, 320, sk.accuracy / 100)
      g.font = `600 13px ${FONT}`; g.fillStyle = ICE; g.textAlign = 'left'; g.fillText('ACCURACY', 480, 566); g.textAlign = 'right'; g.fillText(`${sk.accuracy.toFixed(2)}%`, 800, 566); g.textAlign = 'left'

      // 오른쪽 카드: 타이밍 오차 분포 (가운데가 정확히 맞춘 곳)
      if (showBoard) {
        card(g, 860, 140, 380, 456, 'ONLINE RANKING')
        if (!board?.length) { g.font = `16px ${FONT}`; g.fillStyle = ICE; g.textAlign = 'center'; g.fillText(loading ? '순위를 불러오는 중…' : '순위를 불러오지 못했습니다', 1050, 370); g.textAlign = 'left' }
        if (!account.token) { g.font = `700 14px ${FONT}`; g.fillStyle = AMBER; g.textAlign = 'center'; g.fillText('로그인하면 내 기록이 순위에 올라갑니다 (메인 화면 ACCOUNT)', 1050, 574); g.textAlign = 'left' }
        board?.forEach((r, i) => {
          const y = 176 + i * 40, mine = !!account.token && r.nick === account.nick
          g.fillStyle = mine ? 'rgba(255,159,26,.35)' : 'rgba(255,255,255,.08)'; g.beginPath(); g.roundRect(876, y, 348, 34, 8); g.fill()
          g.font = `800 16px ${FONT}`; g.fillStyle = i < 3 ? '#ffe27a' : '#fff'; g.textAlign = 'center'; g.fillText(String(i + 1), 898, y + 23)
          g.textAlign = 'left'; g.font = `700 15px ${FONT}`; g.fillStyle = '#fff'; g.fillText(fit(g, r.nick, 130), 922, y + 22)
          if (r.lv) { g.font = `700 11px ${FONT}`; g.fillStyle = ICE; g.fillText(`Lv ${r.lv}`, 1086, y + 21) }
          if (r.badge) { g.font = `800 10px ${FONT}`; g.fillStyle = r.badge === 'ALL PERFECT' ? '#f2b705' : '#7ad8ff'; g.fillText(r.badge === 'ALL PERFECT' ? 'AP' : 'FC', 1060, y + 21) }
          g.font = `800 17px ${FONT}`; g.fillStyle = '#fff'; g.textAlign = 'right'; g.fillText(String(r.score).padStart(7, '0'), 1214, y + 23); g.textAlign = 'left'
        })
      } else {
      card(g, 860, 140, 380, 456, 'TIMING')
      const h = sk.histogram(20, 200), top = Math.max(...h, 1), hx0 = 880, bw = 340 / h.length, base = 376
      g.fillStyle = 'rgba(255,255,255,.08)'; g.beginPath(); g.roundRect(hx0, 170, 340, 214, 12); g.fill()
      h.forEach((c, i) => {
        const ms = Math.abs(i - h.length / 2 + 0.5) * 20 // 이 칸의 중심 오차
        g.fillStyle = ms <= JUDGES[0].win * 1000 ? ICE : ms <= JUDGES[2].win * 1000 ? '#7dff9a' : '#ffb066'
        const bh = Math.round((190 * c) / top)
        if (bh > 0) { g.beginPath(); g.roundRect(hx0 + i * bw + 1.5, base - bh, bw - 3, bh, 3); g.fill() }
      })
      g.fillStyle = 'rgba(255,255,255,.85)'; g.fillRect(hx0 + 169, 176, 2, 202)
      g.font = `600 13px ${FONT}`; g.fillStyle = ICE; g.fillText('← 빠름', hx0, 410); g.textAlign = 'center'; g.fillText('0', hx0 + 170, 410); g.textAlign = 'right'; g.fillText('느림 →', hx0 + 340, 410); g.textAlign = 'left'
      const avg = sk.avgMs, rec = Math.round(avg / 5) * 5 // 판정 오프셋은 5ms 단위. 늦게 쳤으면(avg<0) +, 빨리 쳤으면 -
      g.font = `800 18px ${FONT}`; g.fillStyle = '#fff'
      g.fillText(avg ? `평균 ${Math.abs(avg)}ms ${avg > 0 ? 'FAST' : 'SLOW'}` : '평균 오차 0ms', 880, 454)
      g.font = `14px ${FONT}`; g.fillStyle = ICE
      g.fillText(applied !== undefined ? `판정 오프셋을 ${applied > 0 ? '+' : ''}${applied}ms로 맞췄습니다` : rec ? `판정 오프셋 ${-rec > 0 ? '+' : ''}${-rec} 더 조정하면 맞습니다` : '판정 오프셋은 그대로 좋습니다', 880, 482)
      }

      // 아래: 키 안내 (알약 모양 키캡)
      const keys: [string, string][] = [['Enter', '재도전'], ['Esc', '곡 선택'], ['O', '보정'], ['Tab', showBoard ? '타이밍' : '순위']]
      let kx = 880
      for (const [k, label] of keys) kx = chip(g, kx, 610, k, label, ICE, k === 'O' ? 'o' : undefined, 30, 14)
    },
    keydown(e) {
      if (e.key.toLowerCase() === 'o' && d.sk.avgMs) { // 평균 오차만큼 판정 오프셋을 바로 맞춘다 (5ms 단위)
        const rec = Math.round(d.sk.avgMs / 5) * 5
        settings.judgeOffset = Math.min(Math.max(settings.judgeOffset - rec, -100), 100); saveSettings(); applied = settings.judgeOffset
      }
      else if (e.key === 'Tab') { e.preventDefault(); showBoard = !showBoard }
      else if (e.key === 'Enter') sm.go('play', { song: d.song, diff: d.diff })
      else if (e.key === 'Escape') sm.go('select')
    }
  }
}
