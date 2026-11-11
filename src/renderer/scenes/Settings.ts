import type { Scene, SceneManager } from '../core/SceneManager'
import { FONT, CYAN, ICE, NAVY, NOTE_COLORS, accentFill, card, chevron, chip, drawBg, fit, glow, header, hit, icon, optRow, pill, press, segBar, slant, ease, overRect } from '../render/theme'
import { settings, saveSettings, keyLabel } from '../data/Storage'
import { prof } from '../data/Profile'
import { skinSprite } from '../game/noteSkins'
import { GEAR_SKINS, gearOf } from '../render/gear'

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi)
const ALIGNS = ['왼쪽', '가운데', '오른쪽']
const FX = ['끔', '약', '보통']
const HITS = FX
const SCREENS = ['창모드', '전체화면 창모드', '전체화면']
const applyScreen = () => window.api?.setScreen?.(settings.screen) // 화면 모드를 바로 적용한다 (Rust가 창을 바꾼다)
const visibleMs = () => Math.round((590 / (settings.scroll * 100)) * 1000) // 노트가 나타나서 판정선에 닿기까지(ms). Play의 판정선 위치와 같은 590px 기준

// 분류마다 항목을 묶는다 (왼쪽에서 분류, 오른쪽에서 항목). d = 방향키로 바꾼 방향(±1), 키 항목은 Enter로 다시 지정
interface Item { label: string; off?(): boolean; value(): string; change?(d: number): void; bind?: number; frac?(): number; go?: string } // frac: 0~1 값이면 값 칸에 막대로 보여 준다 · bind: 키 설정 화면에서 열 키 수
// 노트 색상은 플레이에서 실제로 쓰이는 스킨이 스틸일 때만 반영된다 (다른 스킨은 스킨 고유 색을 쓴다. 잠긴 스킨은 스틸로 대신 그려진다)
const steelSkin = () => gearOf(settings.gearSkin, prof.v).id === 'steel'
const CATS: { name: string; items: Item[] }[] = [
  { name: 'DISPLAY', items: [
    { label: '화면 모드', value: () => SCREENS[settings.screen] ?? SCREENS[2], change: d => { settings.screen = (settings.screen + d + 3) % 3; applyScreen() } },
    { label: '플레이 배경', value: () => (settings.bg ? '켜짐' : '꺼짐'), change: () => { settings.bg = settings.bg ? 0 : 1 } },
    { label: '배경 밝기', value: () => `${settings.bgBright}%`, frac: () => (settings.bgBright - 30) / 70, change: d => { settings.bgBright = clamp(settings.bgBright + d * 10, 30, 100) } },
    { label: '레인 불투명도', value: () => `${settings.panelA}%`, frac: () => (settings.panelA - 50) / 45, change: d => { settings.panelA = clamp(settings.panelA + d * 5, 50, 95) } },
    { label: '키빔 길이', value: () => ['끔', '짧게', '보통', '길게'][settings.beam] ?? '보통', change: d => { settings.beam = clamp(settings.beam + d, 0, 3) } },
    { label: '이펙트', value: () => FX[settings.fx] ?? FX[2], change: d => { settings.fx = clamp(settings.fx + d, 0, 2) } },
    { label: '캐릭터 그림', value: () => (settings.char ? '켜짐' : '꺼짐'), change: () => { settings.char = settings.char ? 0 : 1 } },
    { label: '노트 스킨', value: () => { const s = GEAR_SKINS[settings.gearSkin] ?? GEAR_SKINS[0]; return gearOf(settings.gearSkin, prof.v) === s ? s.name : `${s.name} · 잠김 (${s.need})` }, change: d => { settings.gearSkin = (settings.gearSkin + d + GEAR_SKINS.length) % GEAR_SKINS.length } },
    { label: '노트 색상', off: () => !steelSkin(), value: () => steelSkin() ? NOTE_COLORS[settings.noteColor]?.[0] ?? NOTE_COLORS[0][0] : '스틸 스킨에서만', change: d => { if (!steelSkin()) return; settings.noteColor = (settings.noteColor + d + NOTE_COLORS.length) % NOTE_COLORS.length } }
  ] },
  { name: 'GAME', items: [
    { label: '스크롤 속도', value: () => `${settings.scroll.toFixed(1)}  ·  ${visibleMs()}ms`, frac: () => (settings.scroll - 1) / 19, change: d => { settings.scroll = clamp(Math.round((settings.scroll + d * 0.1) * 10) / 10, 1, 20) } },
    { label: '필드 위치', value: () => ALIGNS[settings.align], change: d => { settings.align = clamp(settings.align + d, 0, 2) } },
    { label: 'FAST/SLOW 표시', value: () => (settings.fastSlow ? '켜짐' : '꺼짐'), change: () => { settings.fastSlow = settings.fastSlow ? 0 : 1 } },
    { label: '싱크 보정', go: 'calib', value: () => '메트로놈으로 측정' },
    { label: '싱크 오프셋', value: () => `${settings.offset > 0 ? '+' : ''}${settings.offset} ms`, change: d => { settings.offset = clamp(settings.offset + d * 5, -300, 300) } },
    { label: '판정 오프셋', value: () => `${settings.judgeOffset > 0 ? '+' : ''}${settings.judgeOffset} ms`, change: d => { settings.judgeOffset = clamp(settings.judgeOffset + d * 5, -100, 100) } }
  ] },
  { name: 'OPTION', items: [ // 디맥의 이펙터처럼 노트 배치·보이는 방식·판정 폭을 바꾼다
    { label: '미러', value: () => (settings.mirror ? '켜짐' : '꺼짐'), change: () => { settings.mirror = settings.mirror ? 0 : 1 } },
    { label: '랜덤', value: () => (settings.random ? '켜짐' : '꺼짐'), change: () => { settings.random = settings.random ? 0 : 1 } },
    { label: '페이드', value: () => ['꺼짐', 'FADE IN', 'FADE OUT'][settings.fade] ?? '꺼짐', change: d => { settings.fade = clamp(settings.fade + d, 0, 2) } },
    { label: '판정 강도', value: () => ['보통', '하드', '맥스'][settings.judgeMode] ?? '보통', change: d => { settings.judgeMode = clamp(settings.judgeMode + d, 0, 2) } }
  ] },
  { name: 'HUD', items: [ // 플레이 중 화면에 뜨는 글자를 고르고 높이를 옮긴다
    { label: '콤보 표시', value: () => (settings.hudCombo ? '켜짐' : '꺼짐'), change: () => { settings.hudCombo = settings.hudCombo ? 0 : 1 } },
    { label: '판정 글자', value: () => (settings.hudJudge ? '켜짐' : '꺼짐'), change: () => { settings.hudJudge = settings.hudJudge ? 0 : 1 } },
    { label: '정확도율 표시', value: () => (settings.hudRate ? '켜짐' : '꺼짐'), change: () => { settings.hudRate = settings.hudRate ? 0 : 1 } },
    { label: '점수 차이 표시', value: () => (settings.hudGap ? '켜짐' : '꺼짐'), change: () => { settings.hudGap = settings.hudGap ? 0 : 1 } },
    { label: 'HUD 높이', value: () => `${settings.hudY > 0 ? '+' : ''}${settings.hudY}`, frac: () => (settings.hudY + 100) / 200, change: d => { settings.hudY = clamp(settings.hudY + d * 10, -100, 100) } }
  ] },
  { name: 'SOUND', items: [
    { label: '볼륨', value: () => `${Math.round(settings.volume * 100)}%`, frac: () => settings.volume, change: d => { settings.volume = clamp(Math.round((settings.volume + d * 0.1) * 10) / 10, 0, 1) } },
    { label: '곡 음량', value: () => `${Math.round(settings.musicVol * 100)}%`, frac: () => settings.musicVol, change: d => { settings.musicVol = clamp(Math.round((settings.musicVol + d * 0.1) * 10) / 10, 0, 1) } },
    { label: '타격음', value: () => HITS[settings.hit] ?? HITS[1], change: d => { settings.hit = clamp(settings.hit + d, 0, 2) } },
    { label: '효과음', value: () => (settings.sfx ? '켜짐' : '꺼짐'), change: () => { settings.sfx = settings.sfx ? 0 : 1 } },
    { label: '효과음 음량', value: () => `${Math.round(settings.uiVol * 100)}%`, frac: () => settings.uiVol, change: d => { settings.uiVol = clamp(Math.round((settings.uiVol + d * 0.1) * 10) / 10, 0, 1) } }
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
  '랜덤': '곡을 시작할 때마다 레인 순서를 무작위로 섞습니다. 같은 곡도 매번 다른 손 순서가 됩니다. 랭킹 점수는 그대로 올라갑니다.',
  '페이드': 'FADE IN은 화면 위쪽 노트를, FADE OUT은 판정선에 가까운 노트를 가립니다. 노트를 외워서 치는 연습에 좋습니다.',
  '판정 강도': '하드는 판정 폭이 절반, 맥스는 4분의 1입니다. 더 어렵지만 같은 랭킹에 올라갑니다. 대결과 래더에서는 항상 보통입니다.',
  '콤보 표시': '플레이 중 콤보 숫자를 보여 줍니다.',
  '판정 글자': 'MAX·PERFECT 같은 판정 글자를 판정선 위에 보여 줍니다.',
  '정확도율 표시': '판정선 위에 지금까지의 평균 정확도를 보여 줍니다.',
  '점수 차이 표시': '내 최고 기록과의 점수 차이를 점수 카드 아래에 보여 줍니다.',
  'HUD 높이': '콤보와 판정 글자의 높이를 옮깁니다. 위로 올리면 노트와 덜 겹칩니다.',
  '미러': '노트의 좌우를 뒤집습니다. 같은 채보도 다른 손 순서로 칠 수 있어 연습에 좋습니다. 랭킹 점수는 그대로 올라갑니다.',
  '싱크 보정': 'Enter를 누르면 메트로놈 소리에 맞춰 키를 눌러 판정 오프셋을 자동으로 맞춥니다. 유선 이어폰을 권장합니다.',
  '싱크 오프셋': '소리가 화면보다 늦게 들리면 +, 빠르게 들리면 − 로 맞춥니다. (5ms 단위)',
  '판정 오프셋': '쳤는데 SLOW가 많이 나오면 +, FAST가 많으면 − 로 맞춥니다. 결과 화면의 O 키로 자동 적용할 수도 있습니다.',
  '타격음': '플레이 중 노트를 칠 때 나는 "톡" 소리의 크기입니다. 곡이 안 들리거나 거슬리면 약으로 줄이거나 끄세요.',
  '효과음': '메뉴를 움직이거나 고를 때, 결과 화면에서 나는 소리입니다. 플레이 중 타격음은 위의 "타격음" 항목이 따로 정합니다.',
  '화면 모드': '창모드는 일반 창, 전체화면 창모드는 테두리 없는 창으로 화면을 채우고, 전체화면은 화면 전체를 씁니다. 기본값은 전체화면입니다.',
  '플레이 배경': '플레이 화면에 곡 영상·표지 배경을 보일지 정합니다. 끄면 하늘 배경만 나옵니다.',
  '배경 밝기': '플레이 배경의 밝기입니다. 노트가 잘 안 보이면 낮추세요.',
  '레인 불투명도': '노트 레인 패널의 불투명도입니다. 높을수록 배경이 덜 비칩니다.',
  '키빔 길이': '건반을 누를 때 레인에 올라오는 빛줄기의 길이입니다. 끄면 노트가 더 잘 보입니다.',
  '이펙트': '판정 이펙트의 세기입니다. 끔 / 약 / 보통 중에서 고릅니다.',
  '캐릭터 그림': '플레이 화면 아래 콘솔 양옆에 치비 캐릭터를 보일지 정합니다. 필드를 가운데에 둘 때 둘 다 보입니다.',
  '노트 스킨': '플레이 화면 전체의 꾸밈입니다: 기어 틀·기둥 무늬·필드 무늬·날개·램프·아래 콘솔, 노트 모양, 타격 이펙트까지 스킨마다 다릅니다. (디맥의 노트 스킨) 잠긴 스킨은 미리 볼 수 있지만 조건을 채우기 전에는 스틸로 나옵니다. 조건은 내 프로필 기록(레벨·플레이 수·풀 콤보·올 퍼펙트·대결 승수)으로 정해집니다.',
  '노트 색상': '바깥 레인 노트의 색을 스텔라이브 멤버의 대표 색 중에서 고릅니다. 노트 스킨이 스틸일 때만 바꿀 수 있고, 다른 스킨은 스킨마다 정해진 색을 씁니다.',
  '볼륨': '모든 소리(곡·타격음·메뉴 효과음)에 걸리는 전체 크기입니다. 값이 작을수록 급격히 작아지니 귀가 아프면 낮추세요.',
  '곡 음량': '곡과 미리듣기 소리만 따로 키우거나 줄입니다. 타격음이 묻히면 곡 음량을 낮추세요.',
  '효과음 음량': '메뉴를 움직이거나 고를 때, 결과 화면에서 나는 소리만 따로 조절합니다. 타격음은 "타격음" 항목이 정합니다.'
}
function wrapText(g: CanvasRenderingContext2D, text: string, maxW: number) {
  const lines: string[] = []
  let cur = ''
  for (const ch of text) { if (g.measureText(cur + ch).width > maxW) { lines.push(cur); cur = ch.trim() ? ch : '' } else cur += ch }
  if (cur) lines.push(cur)
  return lines
}

// 오른쪽 미리보기: 실제 플레이와 같은 속도·노트 색·레인 불투명도·배경 밝기로 노트가 흐른다 (0.6배 축소)
const PV = { x: 884, y: 140, w: 340, h: 392, s: 0.6, loop: 3.36 }
const PATTERN = [0, 1, 3, 2, 1, 2, 0, 3, 1, 3, 0, 2] // 0.28초 간격, 열두 개가 한 바퀴 (6키는 5·4번 레인으로 옮겨 쓴다)
function drawPreview(g: CanvasRenderingContext2D) {
  const { x, y, w, h, s } = PV, L = settings.keyMode, laneW = (L === 6 ? 64 : 80) * s, fieldX = x + (w - L * laneW) / 2, judgeY = y + 590 * s - 80
  g.save(); g.beginPath(); g.roundRect(x, y, w, h, 14); g.clip()
  const bg = g.createLinearGradient(0, y, 0, y + h); bg.addColorStop(0, '#fbe3f0'); bg.addColorStop(1, '#bfe3ff') // 밝은 영상 장면을 흉내 낸다
  g.fillStyle = bg; g.fillRect(x, y, w, h)
  g.fillStyle = `rgba(5,12,34,${1 - settings.bgBright / 100})`; g.fillRect(x, y, w, h)
  g.fillStyle = `rgba(6,12,30,${settings.panelA / 100})`; g.fillRect(fieldX - 2, y, L * laneW + 4, h)
  g.fillStyle = 'rgba(255,255,255,.7)'; g.fillRect(fieldX - 2, y, 1.5, h); g.fillRect(fieldX + L * laneW + 0.5, y, 1.5, h)
  const col = (NOTE_COLORS[settings.noteColor] ?? NOTE_COLORS[0])[1], speed = settings.scroll * 100 * s, phase = (performance.now() / 1000) % PV.loop
  PATTERN.forEach((lane0, k) => {
    let lane = lane0
    if (L === 6) lane = lane === 3 ? 5 : lane === 2 ? 3 : lane === 1 ? 2 : lane === 0 ? (k % 2 ? 1 : 0) : lane
    const dt = (((k * 0.28 - phase) % PV.loop) + PV.loop) % PV.loop, ny = judgeY - dt * speed
    if (ny < y - 12 || ny > judgeY + 2) return
    const outer = lane === 0 || lane === L - 1, nx = fieldX + lane * laneW + 3
    const kk = L === 6 ? 0.8 : 1; g.drawImage(skinSprite((GEAR_SKINS[settings.gearSkin] ?? GEAR_SKINS[0]).id, outer, col, 1), fieldX + lane * laneW + (4 - 10 * kk) * s, ny - 22 * s, 92 * kk * s, 44 * s) // 고른 스킨(잠겨 있어도 미리 본다)
  })
  g.fillStyle = '#fff'; g.fillRect(fieldX - 4, judgeY - 1.5, L * laneW + 8, 3)
  g.restore()
  g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 1.5; g.beginPath(); g.roundRect(x, y, w, h, 14); g.stroke()
}

// 디맥의 옵션 화면처럼: 위쪽 머리띠에 분류 탭, 항목은 비스듬한 띠 한 줄씩 (고른 줄은 주황), 값은 ◀ ▶ 사이나 칸이 나뉜 막대
const FLAT = CATS.flatMap((c, ci) => c.items.map(item => ({ ci, item })))
const firstOf = (ci: number) => FLAT.findIndex(f => f.ci === ci)
const CAT_SUB = ['화면 · 플레이 배경', '스크롤 · 판정 · 싱크', '미러 · 랜덤 · 페이드 · 판정 강도', '플레이 중 글자 · 높이', '소리', '키 배치']
const ICONS = ['display', 'game', 'game', 'display', 'sound', 'control'] as const

export const Settings = (sm: SceneManager): Scene => {
  let sel = 0, back = 'title', backData: unknown, since = 0
  const open = (item: Item) => sm.go(item.go!, { back, backData, keys: item.bind })
  const jump = (d: number) => { sel = firstOf((FLAT[sel].ci + d + CATS.length) % CATS.length); since = performance.now() }

  return {
    enter(d) { const o = d as { back?: string; backData?: unknown; at?: string } | undefined; back = o?.back ?? 'title'; backData = o?.backData; sel = Math.max(FLAT.findIndex(f => f.item.label === o?.at), 0); since = performance.now() },
    render(g) {
      drawBg(g)
      const ci = FLAT[sel].ci, mine = FLAT.map((f, i) => (f.ci === ci ? i : -1)).filter(i => i >= 0)
      const X = 48, W = 800, LW = 290, RH = 50, GAP = 8
      header(g, 'SETTINGS', '환경 설정')

      // 머리띠 오른쪽: 분류 탭 (알약). 고른 탭은 하늘색으로 빛난다
      g.font = `800 15px ${FONT}`
      let tx = 330
      CATS.forEach((c, i) => {
        const on = i === ci, w = 138, hv = ease('tab' + i, on || overRect(tx, 14, w, 38))
        hit(tx, 14, w, 38, () => { sel = firstOf(i); since = performance.now() })
        pill(g, tx, 14, w, 38, on ? accentFill(g, tx, w) : `rgba(255,255,255,${0.08 + 0.12 * hv})`)
        if (on) glow(g, CYAN, 14, () => pill(g, tx, 14, w, 38, accentFill(g, tx, w)))
        icon(g, ICONS[i], tx + 26, 33, 0.9, on ? '#fff' : 'rgba(255,255,255,.75)')
        g.font = `${on ? 800 : 700} 15px ${FONT}`; g.fillStyle = on ? '#fff' : 'rgba(255,255,255,.8)'; g.textAlign = 'left'; g.fillText(c.name, tx + 46, 39)
        tx += w + 10
      })

      // 분류 이름 (탭을 바꾸면 위에서 내려온다)
      const e = Math.min(1, (performance.now() - since) / 220)
      g.save(); g.globalAlpha = e; g.textAlign = 'left'
      g.font = `800 30px ${FONT}`; g.fillStyle = '#fff'; g.fillText(CATS[ci].name, X, 112 - 8 * (1 - e))
      const nw = g.measureText(CATS[ci].name).width
      g.font = `600 14px ${FONT}`; g.fillStyle = ICE; g.fillText(CAT_SUB[ci], X + nw + 16, 110 - 8 * (1 - e)); g.restore()

      // 항목: 비스듬한 띠. 고른 띠는 주황, 값은 ◀ ▶ 사이 또는 칸이 나뉜 막대
      mine.forEach((fi, r) => {
        const it = FLAT[fi].item, on = fi === sel, y = 134 + r * (RH + GAP), vx = X + LW + 14, vw = W - LW - 14
        hit(X, y, W, RH, () => { sel = fi; if (on && it.go) press('Enter') }, () => { sel = fi })
        const k = ease('opt' + fi, on)
        optRow(g, X + 10 * k, y, W - 10 * k, RH, k)
        g.fillStyle = `rgba(255,255,255,${0.2 * (1 - k)})`; g.fillRect(X + LW + 4, y + 8, 1, RH - 16) // 이름 | 값 구분선
        g.font = `${on ? 800 : 600} 18px ${FONT}`; g.fillStyle = '#fff'; g.textAlign = 'left'; g.fillText(it.label, X + 30 + 10 * k, y + 31)
        const mid = vx + vw / 2, hot = on ? '#fff' : ICE
        if (it.frac) { // 막대형: 값 글자는 오른쪽 위, 막대는 칸이 나뉜 모양
          g.font = `800 16px ${FONT}`; const tw = Math.max(g.measureText(it.value()).width, 44) // 값 글자 폭에 맞춰 막대를 줄인다 ("7.5 · 787ms"처럼 긴 값이 막대를 덮지 않게)
          segBar(g, vx + 14, y + RH / 2 - 7, vw - tw - 62, 14, clamp(it.frac(), 0, 1), on)
          g.textAlign = 'right'; g.fillStyle = hot; g.fillText(it.value(), vx + vw - 18, y + 31); g.textAlign = 'left'
        } else if (it.bind !== undefined) { // 키 배치: 키캡 알약
          const keys = it.bind === 6 ? settings.keys6 : settings.keys
          g.font = `800 14px ${FONT}`
          const ws = keys.map(k2 => Math.max(g.measureText(keyLabel(k2)).width + 18, 30)), total = ws.reduce((a, b) => a + b + 6, -6)
          let kx = mid - total / 2
          keys.forEach((k2, i) => { pill(g, kx, y + 11, ws[i], 28, '#fff'); g.fillStyle = '#0b2a6b'; g.textAlign = 'center'; g.fillText(keyLabel(k2), kx + ws[i] / 2, y + 31); g.textAlign = 'left'; kx += ws[i] + 6 })
        } else if (it.go) {
          g.font = `800 16px ${FONT}`; g.fillStyle = hot; g.textAlign = 'center'; g.fillText(`${it.value()}  ▶`, mid, y + 31); g.textAlign = 'left'
        } else {
          g.font = `800 18px ${FONT}`; g.fillStyle = it.off?.() ? 'rgba(255,255,255,.4)' : hot; g.textAlign = 'center'; g.fillText(fit(g, it.value(), vw - 120), mid, y + 31)
          if (it.change && !it.off?.()) { g.globalAlpha = on ? 1 : 0.35; chevron(g, vx + 28, y + RH / 2, -1, hot); chevron(g, vx + vw - 28, y + RH / 2, 1, hot); g.globalAlpha = 1 }
          g.textAlign = 'left'
        }
        if (it.change) {
          hit(vx, y, 60, RH, () => { sel = fi; it.change!(-1); saveSettings() })
          hit(vx + vw - 60, y, 60, RH, () => { sel = fi; it.change!(1); saveSettings() })
          if (!it.frac) hit(vx + 60, y, vw - 120, RH, () => { sel = fi; it.change!(1); saveSettings() }) // 켜짐/꺼짐처럼 단순한 값은 값을 눌러도 바뀐다
        }
      })

      // 아래: 고른 항목 설명
      const iy = 134 + mine.length * (RH + GAP) + 10
      if (iy < 600) {
        card(g, X, iy, W, Math.min(660 - iy, 124), 'INFO')
        g.font = `15px ${FONT}`; g.fillStyle = '#fff'; g.textAlign = 'left'
        wrapText(g, DESC[FLAT[sel].item.label] ?? '', W - 48).forEach((ln, i) => g.fillText(ln, X + 24, iy + 58 + i * 23))
      }

      // 오른쪽: 실시간 미리보기 (노트 속도·색·불투명도를 바꾸는 분류에서만)
      if (CATS[ci].name === 'DISPLAY' || CATS[ci].name === 'GAME') {
        card(g, 868, 90, 372, 572, 'PREVIEW')
        drawPreview(g)
        g.font = `700 16px ${FONT}`; g.fillStyle = '#fff'; g.fillText(`노트 가시 시간 ${visibleMs()}ms`, PV.x, PV.y + PV.h + 30); g.font = `13px ${FONT}`; g.fillStyle = ICE; g.fillText('IIDX 플레이어는 보통 450~520ms로 맞춥니다', PV.x, PV.y + PV.h + 52)
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
