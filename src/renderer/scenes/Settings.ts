import type { Scene, SceneManager } from '../core/SceneManager'
import { FONT, AMBER, CYAN, ICE, NAVY, NOTE_COLORS, accentFill, card, chip, drawBg, fit, glow, hit, menuRow, meter, pill, press, slant, ease, overRect } from '../render/theme'
import { settings, saveSettings, keyLabel } from '../data/Storage'

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi)
const ALIGNS = ['왼쪽', '가운데', '오른쪽']
const FX = ['끔', '약', '보통']
const SCREENS = ['창모드', '전체화면 창모드', '전체화면']
const applyScreen = () => window.api?.setScreen?.(settings.screen) // 화면 모드를 바로 적용한다 (Rust가 창을 바꾼다)
const visibleMs = () => Math.round((590 / (settings.scroll * 100)) * 1000) // 노트가 나타나서 판정선에 닿기까지(ms). Play의 판정선 위치와 같은 590px 기준

// 분류마다 항목을 묶는다 (왼쪽에서 분류, 오른쪽에서 항목). d = 방향키로 바꾼 방향(±1), 키 항목은 Enter로 다시 지정
interface Item { label: string; value(): string; change?(d: number): void; bind?: number; frac?(): number; go?: string } // frac: 0~1 값이면 값 칸에 막대로 보여 준다 · bind: 키 설정 화면에서 열 키 수
const CATS: { name: string; items: Item[] }[] = [
  { name: 'DISPLAY', items: [
    { label: '화면 모드', value: () => SCREENS[settings.screen] ?? SCREENS[2], change: d => { settings.screen = (settings.screen + d + 3) % 3; applyScreen() } },
    { label: '플레이 배경', value: () => (settings.bg ? '켜짐' : '꺼짐'), change: () => { settings.bg = settings.bg ? 0 : 1 } },
    { label: '배경 밝기', value: () => `${settings.bgBright}%`, frac: () => (settings.bgBright - 30) / 70, change: d => { settings.bgBright = clamp(settings.bgBright + d * 10, 30, 100) } },
    { label: '레인 불투명도', value: () => `${settings.panelA}%`, frac: () => (settings.panelA - 50) / 45, change: d => { settings.panelA = clamp(settings.panelA + d * 5, 50, 95) } },
    { label: '이펙트', value: () => FX[settings.fx] ?? FX[2], change: d => { settings.fx = clamp(settings.fx + d, 0, 2) } },
    { label: '노트 색상', value: () => NOTE_COLORS[settings.noteColor]?.[0] ?? NOTE_COLORS[0][0], change: d => { settings.noteColor = (settings.noteColor + d + NOTE_COLORS.length) % NOTE_COLORS.length } }
  ] },
  { name: 'GAME', items: [
    { label: '스크롤 속도', value: () => `${settings.scroll.toFixed(1)}  ·  ${visibleMs()}ms`, frac: () => (settings.scroll - 1) / 19, change: d => { settings.scroll = clamp(Math.round((settings.scroll + d * 0.5) * 10) / 10, 1, 20) } },
    { label: '필드 위치', value: () => ALIGNS[settings.align], change: d => { settings.align = clamp(settings.align + d, 0, 2) } },
    { label: 'FAST/SLOW 표시', value: () => (settings.fastSlow ? '켜짐' : '꺼짐'), change: () => { settings.fastSlow = settings.fastSlow ? 0 : 1 } },
    { label: '싱크 보정', go: 'calib', value: () => '메트로놈으로 측정' },
    { label: '싱크 오프셋', value: () => `${settings.offset > 0 ? '+' : ''}${settings.offset} ms`, change: d => { settings.offset = clamp(settings.offset + d * 5, -300, 300) } },
    { label: '판정 오프셋', value: () => `${settings.judgeOffset > 0 ? '+' : ''}${settings.judgeOffset} ms`, change: d => { settings.judgeOffset = clamp(settings.judgeOffset + d * 5, -100, 100) } }
  ] },
  { name: 'SOUND', items: [
    { label: '볼륨', value: () => `${Math.round(settings.volume * 100)}%`, frac: () => settings.volume, change: d => { settings.volume = clamp(Math.round((settings.volume + d * 0.1) * 10) / 10, 0, 1) } },
    { label: '효과음', value: () => (settings.sfx ? '켜짐' : '꺼짐'), change: () => { settings.sfx = settings.sfx ? 0 : 1 } }
  ] },
  { name: 'CONTROL', items: [ // Enter를 누르면 키 설정 화면으로
    { label: '4키 배치', go: 'keys', bind: 4, value: () => settings.keys.map(keyLabel).join('  ') },
    { label: '6키 배치', go: 'keys', bind: 6, value: () => settings.keys6.map(keyLabel).join('  ') }
  ] }
]

// 항목 설명 (고른 항목의 설명이 아래 INFO 카드에 나온다)
const DESC: Record<string, string> = {
  '4키 배치': '4키 모드에서 쓰는 키입니다. Enter를 누르면 키 설정 화면이 열려 레인마다 키를 따로 바꿀 수 있습니다.',
  '6키 배치': '6키 모드에서 쓰는 키입니다. Enter를 누르면 키 설정 화면이 열려 레인마다 키를 따로 바꿀 수 있습니다.',
  '스크롤 속도': '노트가 내려오는 속도입니다. 오른쪽 미리보기의 노트 가시 시간이 짧을수록 빠릅니다. 플레이 중에도 위아래 키로 바꿀 수 있습니다.',
  '필드 위치': '플레이 화면에서 노트 필드를 왼쪽, 가운데, 오른쪽 중 어디에 둘지 정합니다.',
  'FAST/SLOW 표시': '판정할 때마다 빠르게(FAST) 또는 느리게(SLOW) 쳤는지 글자로 보여 줍니다.',
  '싱크 보정': 'Enter를 누르면 메트로놈 소리에 맞춰 키를 눌러 판정 오프셋을 자동으로 맞춥니다. 유선 이어폰을 권장합니다.',
  '싱크 오프셋': '소리가 화면보다 늦게 들리면 +, 빠르게 들리면 − 로 맞춥니다. (5ms 단위)',
  '판정 오프셋': '쳤는데 SLOW가 많이 나오면 +, FAST가 많으면 − 로 맞춥니다. 결과 화면의 O 키로 자동 적용할 수도 있습니다.',
  '효과음': '메뉴를 움직이거나 고를 때 나는 소리와, 플레이 중 건반을 눌러 노트를 맞출 때 나는 타격음입니다.',
  '화면 모드': '창모드는 일반 창, 전체화면 창모드는 테두리 없는 창으로 화면을 채우고, 전체화면은 화면 전체를 씁니다. 기본값은 전체화면입니다.',
  '플레이 배경': '플레이 화면에 곡 영상·표지 배경을 보일지 정합니다. 끄면 하늘 배경만 나옵니다.',
  '배경 밝기': '플레이 배경의 밝기입니다. 노트가 잘 안 보이면 낮추세요.',
  '레인 불투명도': '노트 레인 패널의 불투명도입니다. 높을수록 배경이 덜 비칩니다.',
  '이펙트': '판정 이펙트의 세기입니다. 끔 / 약 / 보통 중에서 고릅니다.',
  '노트 색상': '바깥 레인 노트의 색을 스텔라이브 멤버의 대표 색 중에서 고릅니다.',
  '볼륨': '곡 소리 크기입니다. 값이 작을수록 급격히 작아지니 귀가 아프면 낮추세요.'
}
function wrapText(g: CanvasRenderingContext2D, text: string, maxW: number) {
  const lines: string[] = []
  let cur = ''
  for (const ch of text) { if (g.measureText(cur + ch).width > maxW) { lines.push(cur); cur = ch.trim() ? ch : '' } else cur += ch }
  if (cur) lines.push(cur)
  return lines
}

// 오른쪽 미리보기: 실제 플레이와 같은 속도·노트 색·레인 불투명도·배경 밝기로 노트가 흐른다 (0.6배 축소)
const PV = { x: 900, y: 118, w: 340, h: 392, s: 0.6, loop: 3.36 }
const PATTERN = [0, 1, 3, 2, 1, 2, 0, 3, 1, 3, 0, 2] // 0.28초 간격, 열두 개가 한 바퀴 (6키는 5·4번 레인으로 옮겨 쓴다)
function drawPreview(g: CanvasRenderingContext2D) {
  const { x, y, w, h, s } = PV, L = settings.keyMode, laneW = (L === 6 ? 64 : 80) * s, fieldX = x + (w - L * laneW) / 2, judgeY = y + 590 * s - 80
  g.save(); g.beginPath(); g.roundRect(x, y, w, h, 14); g.clip()
  const bg = g.createLinearGradient(0, y, 0, y + h); bg.addColorStop(0, '#fbe3f0'); bg.addColorStop(1, '#bfe3ff') // 밝은 영상 장면을 흉내 낸다
  g.fillStyle = bg; g.fillRect(x, y, w, h)
  g.fillStyle = `rgba(8,30,90,${1 - settings.bgBright / 100})`; g.fillRect(x, y, w, h)
  g.fillStyle = `rgba(8,28,80,${settings.panelA / 100})`; g.fillRect(fieldX - 2, y, L * laneW + 4, h)
  g.fillStyle = 'rgba(255,255,255,.7)'; g.fillRect(fieldX - 2, y, 1.5, h); g.fillRect(fieldX + L * laneW + 0.5, y, 1.5, h)
  const col = (NOTE_COLORS[settings.noteColor] ?? NOTE_COLORS[0])[1], speed = settings.scroll * 100 * s, phase = (performance.now() / 1000) % PV.loop
  PATTERN.forEach((lane0, k) => {
    let lane = lane0
    if (L === 6) lane = lane === 3 ? 5 : lane === 2 ? 3 : lane === 1 ? 2 : lane === 0 ? (k % 2 ? 1 : 0) : lane
    const dt = (((k * 0.28 - phase) % PV.loop) + PV.loop) % PV.loop, ny = judgeY - dt * speed
    if (ny < y - 12 || ny > judgeY + 2) return
    const outer = lane === 0 || lane === L - 1, nx = fieldX + lane * laneW + 3
    slant(g, nx, ny - 7, laneW - 6, 14, 5); g.fillStyle = outer ? col : '#fff'; g.fill(); g.strokeStyle = outer ? '#fff' : 'rgba(80,140,230,.95)'; g.lineWidth = 1.5; g.stroke()
  })
  g.fillStyle = '#fff'; g.fillRect(fieldX - 4, judgeY - 1.5, L * laneW + 8, 3)
  g.restore()
  g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 1.5; g.beginPath(); g.roundRect(x, y, w, h, 14); g.stroke()
}

// 디맥의 옵션 화면처럼: 분류 제목 아래에 항목이 한 줄씩, 고른 줄만 금색 테두리, 값은 ◀ ▶ 사이에
const FLAT = CATS.flatMap((c, ci) => c.items.map(item => ({ ci, item })))
const firstOf = (ci: number) => FLAT.findIndex(f => f.ci === ci)

export const Settings = (sm: SceneManager): Scene => {
  let sel = 0, back = 'title', backData: unknown, since = 0
  const open = (item: Item) => sm.go(item.go!, { back, backData, keys: item.bind })
  const jump = (d: number) => { sel = firstOf((FLAT[sel].ci + d + CATS.length) % CATS.length); since = performance.now() }

  return {
    enter(d) { const o = d as { back?: string; backData?: unknown; at?: string } | undefined; back = o?.back ?? 'title'; backData = o?.backData; sel = Math.max(FLAT.findIndex(f => f.item.label === o?.at), 0); since = performance.now() },
    render(g) {
      drawBg(g)
      const ci = FLAT[sel].ci, mine = FLAT.map((f, i) => (f.ci === ci ? i : -1)).filter(i => i >= 0)
      const X = 60, W = 760, LW = 296, GAP = 4, RH = 46

      // 위쪽: 가로로 긴 탭 줄 (양끝 Shift 키로도 넘긴다). 고른 탭은 아래에 주황 밑줄
      const TW = (W - 3 * 6) / CATS.length
      g.font = `700 13px ${FONT}`
      for (const [x, d, label] of [[X - 52, -1, 'Shift'], [X + W + 10, 1, 'Shift']] as const) { hit(x, 66, 44, 22, () => jump(d)); pill(g, x, 66, 44, 22, 'rgba(8,24,70,.7)'); g.fillStyle = 'rgba(255,255,255,.85)'; g.textAlign = 'center'; g.fillText(label, x + 22, 82); g.textAlign = 'left' }
      CATS.forEach((c, i) => {
        const x = X + i * (TW + 6), on = i === ci, hv = ease('tab' + i, on || overRect(x, 58, TW, 44))
        hit(x, 58, TW, 44, () => { sel = firstOf(i); since = performance.now() })
        g.fillStyle = `rgba(${8 + 30 * hv},${24 + 50 * hv},${70 + 90 * hv},${0.62 + 0.2 * hv})`; g.fillRect(x, 58, TW, 44)
        if (on) { g.fillStyle = AMBER; g.fillRect(x, 99, TW, 3) }
        g.font = `${on ? 800 : 700} 19px ${FONT}`; g.fillStyle = on ? '#fff' : 'rgba(255,255,255,.7)'; g.textAlign = 'center'; g.fillText(c.name, x + TW / 2, 88); g.textAlign = 'left'
      })

      // 제목: 연한 큰 글씨 (탭을 바꾸면 위에서 내려온다)
      const e = Math.min(1, (performance.now() - since) / 220)
      g.save(); g.globalAlpha = e; g.font = `300 44px ${FONT}`; g.fillStyle = 'rgba(255,255,255,.82)'; g.fillText(`${CATS[ci].name} SETTING`, X - 2, 154 - 8 * (1 - e)); g.restore()

      // 항목: 왼쪽 이름 칸 + 오른쪽 값 칸이 붙은 납작한 띠. 고른 띠는 주황 테두리와 노란 글씨
      mine.forEach((fi, r) => {
        const it = FLAT[fi].item, on = fi === sel, y = 176 + r * (RH + GAP), vx = X + LW + GAP, vw = W - LW - GAP
        hit(X, y, W, RH, () => { sel = fi; if (on && it.go) press('Enter') }, () => { sel = fi })
        const k = ease('opt' + fi, on)
        for (const [px, pw] of [[X, LW], [vx, vw]]) {
          g.fillStyle = `rgba(${8 + 24 * k},${24 + 40 * k},${70 + 70 * k},${0.74 + 0.1 * k})`; g.fillRect(px, y, pw, RH)
          if (k > 0.02) { g.strokeStyle = `rgba(255,177,59,${k})`; g.lineWidth = 2.5; g.strokeRect(px + 1.25, y + 1.25, pw - 2.5, RH - 2.5) }
        }
        g.font = `${on ? 800 : 600} 19px ${FONT}`; g.fillStyle = on ? '#ffe27a' : '#fff'; g.textAlign = 'left'; g.fillText(it.label, X + 20, y + 30)
        const mid = vx + vw / 2
        if (it.frac) { // 막대형: 값은 이름 칸 오른쪽 끝, 값 칸에는 막대와 손잡이
          g.textAlign = 'right'; g.font = `700 17px ${FONT}`; g.fillStyle = on ? '#ffe27a' : '#fff'; g.fillText(it.value(), X + LW - 16, y + 30); g.textAlign = 'left'
          const tx = vx + 40, tw = vw - 80, fr = clamp(it.frac(), 0, 1)
          g.fillStyle = 'rgba(255,255,255,.28)'; g.fillRect(tx, y + RH / 2 - 2, tw, 4)
          g.fillStyle = on ? AMBER : '#fff'; g.fillRect(tx, y + RH / 2 - 2, tw * fr, 4)
          g.beginPath(); g.arc(tx + tw * fr, y + RH / 2, 7, 0, Math.PI * 2); g.fillStyle = '#fff'; g.fill()
        } else if (it.bind !== undefined) { // 키 배치: 키캡 알약
          const keys = it.bind === 6 ? settings.keys6 : settings.keys
          g.font = `800 14px ${FONT}`
          const ws = keys.map(k2 => Math.max(g.measureText(keyLabel(k2)).width + 18, 30)), total = ws.reduce((a, b) => a + b + 6, -6)
          let kx = mid - total / 2
          keys.forEach((k2, i) => { pill(g, kx, y + 9, ws[i], 28, '#fff'); g.fillStyle = '#0b2a6b'; g.textAlign = 'center'; g.fillText(keyLabel(k2), kx + ws[i] / 2, y + 29); g.textAlign = 'left'; kx += ws[i] + 6 })
        } else if (it.go) {
          g.font = `800 16px ${FONT}`; g.fillStyle = on ? '#ffe27a' : '#fff'; g.textAlign = 'center'; g.fillText(`${it.value()}  ▶`, mid, y + 30); g.textAlign = 'left'
        } else {
          g.font = `800 18px ${FONT}`; g.fillStyle = on ? '#ffe27a' : '#fff'; g.textAlign = 'center'; g.fillText(fit(g, it.value(), vw - 120), mid, y + 30)
          if (on && it.change) { g.fillText('◀', vx + 24, y + 30); g.fillText('▶', vx + vw - 24, y + 30) }
          g.textAlign = 'left'
        }
        if (it.change) {
          hit(vx, y, 60, RH, () => { sel = fi; it.change!(-1); saveSettings() })
          hit(vx + vw - 60, y, 60, RH, () => { sel = fi; it.change!(1); saveSettings() })
          if (!it.frac) hit(vx + 60, y, vw - 120, RH, () => { sel = fi; it.change!(1); saveSettings() }) // 켜짐/꺼짐처럼 단순한 값은 값을 눌러도 바뀐다
        }
      })

      // 아래: 고른 항목 설명
      const iy = 176 + mine.length * (RH + GAP) + 14
      if (iy < 640) {
        card(g, X, iy, W, Math.min(656 - iy, 120), 'INFO')
        g.font = `15px ${FONT}`; g.fillStyle = '#fff'; g.textAlign = 'left'
        wrapText(g, DESC[FLAT[sel].item.label] ?? '', W - 48).forEach((ln, i) => g.fillText(ln, X + 24, iy + 58 + i * 23))
      }

      // 오른쪽: 실시간 미리보기 (노트 속도·색·불투명도를 바꾸는 분류에서만)
      if (CATS[ci].name === 'DISPLAY' || CATS[ci].name === 'GAME') {
        card(g, 880, 58, 380, 600, 'PREVIEW')
        drawPreview(g)
        g.font = `700 16px ${FONT}`; g.fillStyle = '#fff'; g.fillText(`노트 가시 시간 ${visibleMs()}ms`, PV.x, PV.y + PV.h + 34); g.font = `13px ${FONT}`; g.fillStyle = ICE; g.fillText('IIDX 플레이어는 보통 450~520ms로 맞춥니다', PV.x, PV.y + PV.h + 58)
      }

      // 아래 안내 (알약 키캡, 눌러도 된다)
      let hx = 48
      for (const [k, label, real] of [['↑↓', '선택', null], ['←→', '변경', null], ['Tab', '분류', undefined], ['Enter', '선택', undefined], ['Esc', '닫기', undefined]] as [string, string, string | null | undefined][]) hx = chip(g, hx, 690, k, label, NAVY, real)
    },
    keydown(e) {
      if (e.key === 'Escape') { sm.go(back, backData); return }
      if (e.key === 'Tab') { e.preventDefault(); jump(e.shiftKey ? -1 : 1); return }
      const mine = FLAT.map((f, i) => (f.ci === FLAT[sel].ci ? i : -1)).filter(i => i >= 0), at = mine.indexOf(sel)
      if (e.key === 'ArrowDown') sel = mine[(at + 1) % mine.length]
      else if (e.key === 'ArrowUp') sel = mine[(at + mine.length - 1) % mine.length]
      else if (e.key === 'Enter' && FLAT[sel].item.go) open(FLAT[sel].item)
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { FLAT[sel].item.change?.(e.key === 'ArrowRight' ? 1 : -1); saveSettings() }
    }
  }
}
