import type { Scene, SceneManager } from '../core/SceneManager'
import type { Chart, Song } from '../../shared/types'
import { prof } from '../data/Profile'
import { profileCard } from '../render/profileCard'
import { FONT, CYAN, AMBER, NOTE_COLORS, accentFill, artOf, drawBg, drawCover, ease, fit, glow, hit, marquee, overRect, pill, press, starPath, chip } from '../render/theme'
import { chartFile, diffName, diffsOf, ensureSong, loadSongs, songUrl } from '../data/Songs'
import { needsRegen } from '../game/AutoChart'
import { getRecords, saveSettings, settings } from '../data/Storage'
import { pickSong } from '../core/Versus'
import { rankOf } from '../game/ScoreKeeper'
import { preview, stopPreview, tickPreview } from '../core/Preview'

const SHOW = 4 // 선택 곡 위아래로 보이는 줄 수
const DIFF_COLOR: Record<string, string> = { easy: '#2ecc71', normal: '#f1c40f', hard: '#e74c3c', stella: '#a855f7' } // 난이도 이름 대신 칸 색으로 구분
// 램프: 올 퍼펙트 = 금색 별, 풀 콤보 = 하늘색 마름모, 그냥 클리어 = 흰 점 (색만이 아니라 모양으로도 구분한다)
function drawLamp(g: CanvasRenderingContext2D, badge: string | undefined, x: number, y: number, k = 1) {
  if (badge === 'ALL PERFECT') glow(g, AMBER, 8, () => { starPath(g, x, y, 10 * k); g.fillStyle = '#ffe27a'; g.fill() })
  else if (badge === 'FULL COMBO') { g.fillStyle = '#9aeaff'; g.beginPath(); g.moveTo(x, y - 8 * k); g.lineTo(x + 8 * k, y); g.lineTo(x, y + 8 * k); g.lineTo(x - 8 * k, y); g.fill() }
  else { g.fillStyle = 'rgba(255,255,255,.85)'; g.beginPath(); g.arc(x, y, 4 * k, 0, Math.PI * 2); g.fill() }
}
const wrap = (i: number, n: number) => ((i % n) + n) % n

export const SongSelect = (sm: SceneManager): Scene => {
  let all: Song[] = [], songs: Song[] = [], idx = 0, target = 0, pos = 0, di = 0, vsMode = false, note = '', noteAt = 0, lastIdx = -1, selSince = 0 // selSince: 지금 고른 곡이 선택된 시각 (긴 곡명이 흐르기 시작하는 기준)
  let cats: string[] = ['ALL'], cat = 'ALL' // 부른 사람별 분류. Tab으로 넘긴다 (Shift+Tab은 거꾸로)
  let levels: Record<string, number> = {} // 선택 곡의 난이도별 레벨 (채보가 만들어진 난이도만)
  let timer: ReturnType<typeof setTimeout> | undefined, genTimer: ReturnType<typeof setTimeout> | undefined
  let worker: Worker | undefined
  let query = '', searching = false, sortMode = 0 // 검색어(제목·가수 포함) · F2로 입력 중인지 · F4 정렬: 0 서버 순서, 1 제목, 2 가수
  let inp: HTMLInputElement | undefined // 한글(IME)도 받으려고 화면 밖 입력칸을 쓴다. 캔버스에는 검색창만 그린다
  const SORTS = ['기본 순서', '제목순', '가수순']
  const pending = new Set<string>() // 워커가 만드는 중인 곡+난이도+키 수
  const pk = (dir: string, d: string, keys = settings.keyMode) => `${keys}|${dir}|${d}`
  let media: HTMLMediaElement | undefined
  let shade: CanvasGradient | undefined // 매 프레임 새로 만들지 않도록 한 번만 만든다

  const singers = (s: Song) => s.meta.singers ?? s.meta.artist.split(' x ')
  // 곡의 최고 기록(모든 난이도 중 점수가 가장 높은 것): 램프와 등급을 목록에 보여 준다
  const bestOf = (s: Song) => {
    let best: { score: number; badge?: string; accuracy: number } | undefined
    for (const d of diffsOf(s)) { const b = getRecords(s.dir, d)[0]; if (b && (!best || b.score > best.score)) best = b }
    return best && { badge: best.badge, rank: rankOf(best.accuracy), score: best.score }
  }
  const diffs = () => (songs[idx] ? diffsOf(songs[idx]) : [])
  // 곡을 빠르게 넘길 때는 멈췄다가 0.3초 뒤에 미리듣기(소리+영상)를 시작
  const schedulePreview = () => {
    clearTimeout(timer); stopPreview(); media = undefined
    timer = setTimeout(() => { media = preview(songs[idx]) }, 300)
    clearTimeout(genTimer)
    const s = songs[idx], mine: Record<string, number> = levels = {}
    if (!s) return
    if (s.remote) { // 아직 받지 않은 곡: 채보 파일(작다)만 서버에서 읽어 레벨을 보여 준다. 음원이 없어 새로 만들지는 못한다
      genTimer = setTimeout(() => diffsOf(s).forEach(d => fetch(songUrl(s.dir, chartFile(d))).then(r => r.ok ? r.json() : Promise.reject()).then((c: Chart) => { if (!needsRegen(c)) mine[d] = c.level }, () => { /* 서버에 채보 없음 */ })), 300) // 곡을 계속 넘기거나 검색어를 치는 중에는 요청하지 않는다
      return
    }
    if (!window.api) return
    const api = window.api, ds = diffsOf(s)
    // 옛 알고리즘 번호의 자동 채보는 레벨을 비워 두고 아래에서 새로 만든다 (에디터로 고친 채보는 그대로)
    Promise.all(ds.map(d => api.readFile(s.dir, chartFile(d)).then(b => { const c = JSON.parse(new TextDecoder().decode(b)); if (!needsRegen(c)) mine[d] = c.level }, () => { /* 채보 없음 */ }))).then(() => {
      const todo = ds.filter(d => !mine[d] && !pending.has(pk(s.dir, d)))
      if (todo.length) genTimer = setTimeout(() => generate(s, todo), 600) // 곡을 계속 넘기는 중이면 만들지 않는다
    })
  }
  // 채보가 없는 난이도는 따로 만들어 저장하고 레벨을 보여 준다 (Play가 같은 파일을 쓴다)
  const generate = async (s: Song, todo: string[]) => {
    try {
      const buf = await new OfflineAudioContext(1, 1, 48000).decodeAudioData(await window.api!.readFile(s.dir, s.meta.audio))
      const x = buf.getChannelData(0).slice() // 워커로 넘기며 원본을 비운다
      const keys = settings.keyMode // 만드는 동안 모드를 바꿔도 이 키 수로 끝까지 만든다
      todo.forEach(d => pending.add(pk(s.dir, d, keys)))
      worker ??= new Worker(new URL('../game/chartWorker.ts', import.meta.url), { type: 'module' })
      worker.onmessage = e => {
        const { dir, diff, keys, chart } = e.data as { dir: string; diff: string; keys: number; chart: Chart }
        pending.delete(pk(dir, diff, keys))
        window.api?.writeFile(dir, chartFile(diff, keys), JSON.stringify(chart)).catch(() => { /* 저장 실패해도 다음에 다시 만든다 */ })
        if (songs[idx]?.dir === dir && keys === settings.keyMode) levels[diff] = chart.level
      }
      worker.postMessage({ dir: s.dir, x, sr: buf.sampleRate, diffs: todo, hl: s.meta.highlights, keys }, [x.buffer])
    } catch { /* 음원 없음 */ }
  }
  // 분류에 맞는 곡만 추리고, 보던 곡이 남아 있으면 그대로 두고 아니면 맨 위로
  const applyCat = (focus = songs[idx]?.dir) => {
    const q = query.trim().toLowerCase()
    songs = cat === 'ALL' && !q ? all : all.filter(s => (cat === 'ALL' || singers(s).includes(cat)) && (!q || [s.meta.title, s.meta.artist, ...singers(s)].join(' ').toLowerCase().includes(q)))
    if (sortMode) songs = [...songs].sort((a, b) => (sortMode === 2 ? a.meta.artist.localeCompare(b.meta.artist, 'ko') : 0) || a.meta.title.localeCompare(b.meta.title, 'ko'))
    idx = Math.max(songs.findIndex(s => s.dir === focus), 0)
    target = pos = idx; di = 0
    schedulePreview()
  }
  const openSearch = (v: boolean) => {
    if (!inp) {
      inp = document.createElement('input'); inp.style.cssText = 'position:fixed;left:-1000px;top:0;opacity:0'; inp.autocomplete = 'off'
      inp.addEventListener('input', () => { query = inp!.value; applyCat() })
      inp.addEventListener('blur', () => { searching = false })
      document.body.appendChild(inp)
    }
    searching = v; inp.value = query
    if (v) inp.focus(); else inp.blur()
  }
  const leave = (name: string, data?: unknown) => { openSearch(false); clearTimeout(timer); clearTimeout(genTimer); stopPreview(); media = undefined; sm.go(name, data) }
  // 영상이 실제로 재생 중일 때만 true
  const videoOn = () => media instanceof HTMLVideoElement && media.readyState >= 2 && media.videoWidth > 0 && !media.paused

  return {
    async enter(d) {
      const { mode, focus } = (d ?? {}) as { mode?: string; focus?: string }
      if (d) { vsMode = mode === 'versus' }
      all = await loadSongs()
      if (!all.length) { note = '서버에서 곡 목록을 받지 못했습니다. 인터넷 연결을 확인하세요'; noteAt = performance.now() + 6000 }
      const counts = new Map<string, number>()
      for (const s of all) for (const a of singers(s)) counts.set(a, (counts.get(a) ?? 0) + 1)
      cats = ['ALL', ...[...counts].sort((a, b) => b[1] - a[1]).map(c => c[0])] // 곡이 많은 가수부터
      if (!cats.includes(cat) || (focus && !all.some(s => s.dir === focus && (cat === 'ALL' || singers(s).includes(cat))))) cat = 'ALL'
      applyCat(focus) // 방금 추가한 곡으로 이동
    },
    update(dt) {
      pos += (target - pos) * Math.min(dt * 14, 1) // 목록이 부드럽게 따라온다
      tickPreview()
    },
    render(g) {
      const song = songs[idx], on = videoOn(), t = performance.now() / 1000
      if (idx !== lastIdx) { lastIdx = idx; selSince = performance.now() }
      drawBg(g, song)
      if (on) { // 영상은 배경으로만: 전체 화면에 깔고, 글씨가 읽히도록 왼쪽을 더 어둡게
        const v = media as HTMLVideoElement
        drawCover(g, v, v.videoWidth, v.videoHeight, 0, 0, 1280, 720)
        if (!shade) {
          shade = g.createLinearGradient(0, 0, 1280, 0)
          shade.addColorStop(0, 'rgba(10,40,110,.88)'); shade.addColorStop(0.5, 'rgba(10,40,110,.4)'); shade.addColorStop(1, 'rgba(10,40,110,.72)')
        }
        g.fillStyle = shade; g.fillRect(0, 0, 1280, 720)
      }
      const lerp = (u: number, v: number, k: number) => u + (v - u) * k
      // 위쪽 띠: 로고 · 가수 분류 알약(Tab으로 넘긴다) · 모드
      g.fillStyle = 'rgba(14,52,140,.62)'; g.fillRect(0, 0, 1280, 68)
      g.fillStyle = accentFill(g, 0, 1280); g.fillRect(0, 67, 1280, 2)
      glow(g, AMBER, 10, () => { starPath(g, 52, 34, 13); g.fillStyle = '#fff6d6'; g.fill() })
      g.font = `900 28px ${FONT}`; g.fillStyle = '#fff'; g.fillText('STELLA', 78, 44)
      if (searching || query) {
        hit(232, 16, 698, 36, () => openSearch(true))
        pill(g, 232, 16, 698, 36, 'rgba(8,24,70,.7)'); g.strokeStyle = searching ? CYAN : 'rgba(255,255,255,.45)'; g.lineWidth = searching ? 2.5 : 1.5; g.stroke()
        g.font = `800 14px ${FONT}`; g.fillStyle = CYAN; g.fillText('SEARCH', 252, 40)
        g.font = `700 18px ${FONT}`; g.fillStyle = '#fff'
        const shown = fit(g, query, 560) + (searching && Math.floor(performance.now() / 500) % 2 === 0 ? '|' : '')
        g.fillText(shown || (searching ? '' : '(검색어 없음)'), 330, 41)
        g.font = `700 13px ${FONT}`; g.fillStyle = 'rgba(255,255,255,.7)'; g.textAlign = 'right'; g.fillText(`${songs.length}곡  ·  ${searching ? 'Enter 확인  Esc 지우기' : 'F2 수정  Esc 지우기'}`, 916, 40); g.textAlign = 'left'
      } else {
        const ci = Math.max(cats.indexOf(cat), 0)
        let px = 270
        g.font = `800 17px ${FONT}`
        for (let k = -1; k <= 4 && k < cats.length; k++) {
          const c = cats[(ci + k + cats.length) % cats.length], label = fit(g, c === 'ALL' ? '전체' : c, 150), w = g.measureText(label).width + 36
          if (px + w > 930) break
          if (k !== 0) hit(px, 16, w, 36, () => { cat = c; applyCat() }) // 탭을 누르면 그 가수로
          if (k === 0) glow(g, CYAN, 12, () => pill(g, px, 16, w, 36, accentFill(g, px, w)))
          else { pill(g, px, 16, w, 36, 'rgba(8,24,70,.55)'); g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 1.5; g.stroke() }
          g.fillStyle = k === 0 ? '#fff' : 'rgba(255,255,255,.75)'; g.fillText(label, px + 18, 40)
          px += w + 8
        }
        g.font = `700 14px ${FONT}`; g.fillStyle = 'rgba(255,255,255,.7)'; g.fillText('TAB', 232, 40)
      }
      hit(940, 2, 300, 64, () => leave('collection')) // 오른쪽 위 프로필 카드 (디맥처럼): 누르면 컬렉션
      profileCard(g, 940, 2, prof.v); g.textAlign = 'left'

      if (!song) {
        g.font = `24px ${FONT}`; g.fillStyle = '#9ab'; g.textAlign = 'center'
        g.fillText('곡이 없습니다', 640, 380); g.textAlign = 'left'
        return
      }
      const cur = song.meta, ds = diffs(), n = songs.length

      // 왼쪽 패널 (디맥의 곡 정보 카드): 모드 머리글 → 곡 그림(제목이 그림 위에) → 별 줄 → 난이도 패드 → 기록 → 옵션
      const PX = 40, PW = 520
      g.fillStyle = 'rgba(6,18,56,.62)'; g.fillRect(PX, 84, PW, 584)
      // 머리글: 기울어진 색 띠에 "4 BUTTON TUNES"
      g.save(); g.beginPath(); g.moveTo(PX, 84); g.lineTo(PX + 330, 84); g.lineTo(PX + 304, 132); g.lineTo(PX, 132); g.closePath()
      g.fillStyle = accentFill(g, PX, 330); g.fill(); g.restore()
      g.font = `900 38px ${FONT}`; g.fillStyle = '#fff'; g.fillText(String(settings.keyMode), PX + 14, 123)
      g.font = `900 17px ${FONT}`; g.fillText('BUTTON', PX + 52, 108); g.font = `800 13px ${FONT}`; g.fillStyle = '#d6ecff'; g.fillText('TUNES', PX + 52, 125)
      g.font = `800 13px ${FONT}`; g.fillStyle = AMBER; g.textAlign = 'right'; g.fillText(vsMode ? 'VERSUS' : 'FREESTYLE', PX + PW - 14, 112); g.textAlign = 'left'
      // 곡 그림
      const AY = 132, AH = 224, im = artOf(song)!.img
      g.save(); g.beginPath(); g.rect(PX, AY, PW, AH); g.clip(); g.fillStyle = '#000'; g.fillRect(PX, AY, PW, AH); drawCover(g, im, im.width, im.height, PX, AY, PW, AH)
      const sh = g.createLinearGradient(0, AY + AH - 110, 0, AY + AH); sh.addColorStop(0, 'rgba(4,12,40,0)'); sh.addColorStop(1, 'rgba(4,12,40,.92)'); g.fillStyle = sh; g.fillRect(PX, AY + AH - 110, PW, 110)
      g.restore()
      glow(g, AMBER, 12, () => { starPath(g, PX + PW - 26, AY + 24, 11 * (0.6 + 0.4 * Math.sin(t * 2.6))); g.fillStyle = '#fff6d6'; g.fill() })
      g.font = `800 32px ${FONT}`; g.fillStyle = '#fff'; marquee(g, cur.title, PX + 16, AY + AH - 40, PW - 32, 32, selSince)
      g.font = `600 17px ${FONT}`; g.fillStyle = '#d6ecff'; marquee(g, cur.artist, PX + 16, AY + AH - 14, PW - 32, 17, selSince)
      g.fillStyle = accentFill(g, PX, PW); g.fillRect(PX, AY + AH, PW, 3)
      // 별 줄: 고른 난이도의 레벨 (열 칸)
      {
        const lv = levels[ds[di]] ?? 0, filled = Math.min(10, Math.round(lv / 1.5)), sy = AY + AH + 26
        g.font = `700 12px ${FONT}`; g.fillStyle = CYAN; g.fillText('LEVEL', PX + 16, sy + 4)
        for (let k = 0; k < 10; k++) { starPath(g, PX + 86 + k * 24, sy, 9); g.fillStyle = k < filled ? '#ffd24a' : 'rgba(255,255,255,.2)'; g.fill() }
        g.font = `900 20px ${FONT}`; g.fillStyle = '#fff'; g.textAlign = 'right'; g.fillText(lv ? String(lv) : '-', PX + PW - 16, sy + 7); g.textAlign = 'left'
      }
      // 난이도 패드: 레벨을 크게, 아래에 그 난이도의 등급과 램프
      const DY = 398, DW = (PW - 3 * 8) / 4
      ds.forEach((d, i) => {
        const sel = i === di, w = DW, x = PX + i * (w + 8), y = sel ? DY - 4 : DY, h = sel ? 78 : 70, col = DIFF_COLOR[d] ?? CYAN
        hit(x, y, w, h, () => { di = i })
        g.save(); g.beginPath(); g.moveTo(x + 10, y); g.lineTo(x + w, y); g.lineTo(x + w - 10, y + h); g.lineTo(x, y + h); g.closePath()
        const pg = g.createLinearGradient(0, y, 0, y + h); pg.addColorStop(0, col); pg.addColorStop(1, 'rgba(10,36,100,.92)')
        g.fillStyle = sel ? pg : 'rgba(8,24,70,.82)'; if (sel) glow(g, col, 14, () => g.fill()); else g.fill()
        g.strokeStyle = sel ? '#fff' : 'rgba(255,255,255,.3)'; g.lineWidth = sel ? 2.5 : 1.2; g.stroke(); g.restore()
        g.font = `800 11px ${FONT}`; g.fillStyle = sel ? '#fff' : col; g.textAlign = 'left'; g.fillText(diffName(d), x + 16, y + 17)
        g.font = `900 ${sel ? 32 : 26}px ${FONT}`; g.fillStyle = '#fff'; g.textAlign = 'center'
        g.fillText(levels[d] ? String(levels[d]) : pending.has(pk(song.dir, d)) ? '…' : '-', x + w / 2, y + (sel ? 52 : 47))
        const r = getRecords(song.dir, d)[0]
        if (r) { drawLamp(g, r.badge, x + w / 2 - 22, y + h - 12, 0.65); g.font = `800 15px ${FONT}`; g.fillText(rankOf(r.accuracy), x + w / 2 + 14, y + h - 7) }
        g.textAlign = 'left'
      })
      // 기록: 점수 · 정확도 · 최대 콤보 (고른 난이도)
      const top = getRecords(song.dir, ds[di])[0]
      g.fillStyle = 'rgba(8,24,70,.7)'; g.fillRect(PX + 8, 486, PW - 16, 90); g.fillStyle = 'rgba(255,255,255,.2)'; g.fillRect(PX + 8, 486, PW - 16, 1)
      ;[['SCORE', top ? String(top.score).padStart(7, '0') : '-'], ['RATE', top ? `${top.accuracy.toFixed(2)}%` : '-'], ['MAX COMBO', top ? String(top.maxCombo) : '-']].forEach(([lab, val], k) => {
        const y = 510 + k * 28
        g.font = `700 12px ${FONT}`; g.fillStyle = CYAN; g.fillText(lab, PX + 26, y); g.font = `800 20px ${FONT}`; g.fillStyle = top ? '#fff' : 'rgba(255,255,255,.4)'; g.textAlign = 'right'; g.fillText(val, PX + PW - 28, y + 3); g.textAlign = 'left'
        g.fillStyle = 'rgba(255,255,255,.1)'; if (k < 2) g.fillRect(PX + 22, y + 11, PW - 44, 1)
      })
      // 옵션: 스크롤 속도 칸(눌러서 설정으로) · 노트 색 · 필드 위치
      g.font = `700 12px ${FONT}`; g.fillStyle = 'rgba(255,255,255,.75)'; g.fillText('OPTIONS', PX + 10, 598)
      ;([['SPEED', settings.scroll.toFixed(1), 'EFFECTOR', true], ['NOTE', NOTE_COLORS[settings.noteColor]?.[0] ?? NOTE_COLORS[0][0], '', false], ['FIELD', ['왼쪽', '가운데', '오른쪽'][settings.align] ?? '가운데', '', false]] as [string, string, string, boolean][]).forEach(([lab, val, sub, hot], k) => {
        const x = PX + 8 + k * 112, y = 604, w = 104, h = 58, hv = ease('opt' + k, overRect(x, y, w, h))
        hit(x, y, w, h, () => leave('settings', { back: 'select', backData: vsMode ? { mode: 'versus' } : undefined, at: lab === 'SPEED' ? '스크롤 속도' : lab === 'NOTE' ? '노트 색상' : '필드 위치' }))
        if (hot) { const og = g.createLinearGradient(x, y, x, y + h); og.addColorStop(0, '#ff6a4d'); og.addColorStop(1, '#c0392b'); g.fillStyle = og } else g.fillStyle = `rgba(${14 + 30 * hv},${34 + 50 * hv},${90 + 90 * hv},.85)`
        g.fillRect(x, y, w, h); g.strokeStyle = `rgba(255,255,255,${0.35 + 0.5 * hv})`; g.lineWidth = 1.5; g.strokeRect(x + 0.75, y + 0.75, w - 1.5, h - 1.5)
        g.font = `800 11px ${FONT}`; g.fillStyle = hot ? '#ffe9e0' : CYAN; g.fillText(lab, x + 10, y + 17)
        g.font = `900 ${hot ? 26 : 16}px ${FONT}`; g.fillStyle = '#fff'; g.fillText(fit(g, val, w - 16), x + 10, y + (hot ? 44 : 42))
        if (sub) { g.font = `700 9px ${FONT}`; g.fillStyle = '#ffe9e0'; g.fillText(sub, x + 10, y + 54) }
      })

      // 오른쪽: 디맥처럼 세로로 긴 곡 목록. 줄은 얇게(11줄쯤 보인다), 선택한 줄만 주황 띠로 크게 (끝에서 처음으로 이어진다)
      const span = Math.min(6, Math.floor((n - 1) / 2) + 1)
      g.save(); g.beginPath(); g.rect(590, 78, 690, 600); g.clip()
      for (let i = Math.round(pos) - span; i <= Math.round(pos) + span; i++) {
        const d = i - pos, ad = Math.abs(d), near = Math.min(ad, 1)
        const s = songs[wrap(i, n)], sel = ad < 0.5
        const h = lerp(66, 46, near), yc = 378 + Math.sign(d) * (ad <= 1 ? 72 * ad - 10 * ad * ad : 62 + 52 * (ad - 1)), y = yc - h / 2 // 줄 높이를 적분해 중심을 정한다: 넘길 때도 줄끼리 겹치지 않는다
        const x = 620 + Math.min(ad, 3) * 8, w = 630 - Math.min(ad, 3) * 8
        { const hy = Math.max(y, 78), hb = Math.min(y + h, 678) // 목록 칸 밖으로 잘린 부분은 누를 수 없다
          if (hb > hy) hit(x, hy, w, hb - hy, () => { if (sel) press('Enter'); else { target = i; idx = wrap(i, n); di = Math.min(di, diffs().length - 1); schedulePreview() } }) }
        g.globalAlpha = Math.max(0, 1 - ad * 0.13)
        if (sel) {
          const og = g.createLinearGradient(x, 0, x + w, 0); og.addColorStop(0, '#ffb13b'); og.addColorStop(0.7, '#ff7a59'); og.addColorStop(1, '#ff5c8a')
          const cut = () => { g.beginPath(); g.moveTo(x + 18, y); g.lineTo(x + w, y); g.lineTo(x + w, y + h); g.lineTo(x, y + h); g.closePath() } // 디맥처럼 왼쪽 위가 비스듬하다
          g.fillStyle = og; glow(g, '#ff9f1a', 18, () => { cut(); g.fill() })
          g.save(); cut(); g.clip(); g.fillStyle = '#fff'; g.fillRect(x, y, 6, h) // 왼쪽 흰 띠는 둥근 모서리 안에서만
          // 지나가는 빛줄기
          const sx = x - 100 + ((t * 300) % 900)
          g.fillStyle = 'rgba(255,255,255,.25)'; g.beginPath(); g.moveTo(sx, y); g.lineTo(sx + 40, y); g.lineTo(sx + 6, y + h); g.lineTo(sx - 34, y + h); g.fill()
          g.restore()
        } else { g.fillStyle = 'rgba(8,24,70,.74)'; g.beginPath(); g.roundRect(x, y, w, h, 14); g.fill(); g.strokeStyle = 'rgba(255,255,255,.22)'; g.lineWidth = 1; g.stroke() }
        const rec = bestOf(s), th = h - 12, tx = x + 12, thumb = artOf(s)?.img // 왼쪽 썸네일
        if (thumb) { g.save(); g.beginPath(); g.roundRect(tx, y + 6, th, th, 8); g.clip(); drawCover(g, thumb, thumb.width, thumb.height, tx, y + 6, th, th); g.restore(); g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 1.5; g.beginPath(); g.roundRect(tx, y + 6, th, th, 8); g.stroke() }
        const lx0 = tx + th + 16, tw = (rec ? w - 250 : w - 80) - (lx0 - x - 28)
        g.font = `800 ${sel ? 22 : 19}px ${FONT}`; g.fillStyle = '#fff'
        if (sel) marquee(g, s.meta.title, lx0, y + 28, tw, 22, selSince); else g.fillText(fit(g, s.meta.title, tw), lx0, y + 21) // 고른 곡만 긴 이름이 흐른다
        g.font = `${sel ? 15 : 13}px ${FONT}`; g.fillStyle = sel ? 'rgba(255,255,255,.95)' : '#cfe6ff'
        if (sel) marquee(g, s.meta.artist, lx0, y + 50, tw, 15, selSince); else g.fillText(fit(g, s.meta.artist, tw), lx0, y + 38)
        if (rec) { // 램프와 등급 (곡 전체 난이도 중 최고 기록)
          const lx = x + w - 190, ly = y + h / 2
          drawLamp(g, rec.badge, lx, ly, sel ? 1.1 : 0.9)
          g.font = `800 ${sel ? 22 : 18}px ${FONT}`; g.fillStyle = '#fff'; g.textAlign = 'right'; g.fillText(rec.rank, lx + 46, ly + 7)
          g.font = `700 10px ${FONT}`; g.fillStyle = sel ? 'rgba(255,255,255,.85)' : CYAN; g.fillText('SCORE', x + w - 22, ly - 6) // 디맥 목록처럼 오른쪽 끝에 최고 점수
          g.font = `800 ${sel ? 18 : 16}px ${FONT}`; g.fillStyle = '#fff'; g.fillText(String(rec.score).padStart(7, '0'), x + w - 22, ly + 14); g.textAlign = 'left'
        }
        if (sel && !rec) { g.fillStyle = '#fff'; for (let k = 0; k < 4; k++) { const bh = 6 + 18 * Math.abs(Math.sin(t * 5 + k * 1.7)); g.fillRect(x + w - 40 + k * 8, y + h - 12 - bh, 5, bh) } } // 소리 막대
      }
      g.restore()
      g.globalAlpha = 1
      // 스크롤 위치 바
      g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(1256, 90, 4, 560)
      g.fillStyle = '#fff'; g.fillRect(1256, 90 + (n > 1 ? idx / (n - 1) : 0) * 520, 4, 40)

      // 아래 안내
      g.fillStyle = 'rgba(6,18,56,.55)'; g.fillRect(0, 676, 1280, 44); g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(0, 676, 1280, 1)
      {
        const hints: [string, string][] = [['↑↓', '곡'], ['←→', '난이도'], ['Tab', '가수'], ['F2', '검색'], ['F4', '정렬'], ['F3', '4/6키'], ['Enter', '시작'], ['F1', '설정'], ['Esc', '뒤로']]
        let hx = 440
        for (const [k, label] of hints) hx = chip(g, hx, 692, k, label, '#fff', k === '↑↓' || k === '←→' ? null : undefined)
      }
      g.font = `700 13px ${FONT}`; g.fillStyle = 'rgba(255,255,255,.75)'; g.textAlign = 'right' // 곡 번호는 위쪽 띠 오른쪽 (아래 키 안내와 겹치지 않게)
      g.fillText(`${idx + 1} / ${n}`, 1240, 60); g.textAlign = 'left'
      if (note && performance.now() < noteAt) { g.font = `800 18px ${FONT}`; const w = g.measureText(note).width + 48; pill(g, 640 - w / 2, 84, w, 40, 'rgba(8,24,70,.92)'); g.fillStyle = AMBER; g.textAlign = 'center'; g.fillText(note, 640, 110); g.textAlign = 'left' }
    },
    wheel(dy) { // 휠로 곡 넘기기
      if (!songs.length) return
      target += dy > 0 ? 1 : -1; idx = wrap(target, songs.length); di = Math.min(di, diffs().length - 1); schedulePreview()
    },
    keydown(e) {
      const move = (d: number) => {
        if (!songs.length) return
        target += d; idx = wrap(target, songs.length); di = Math.min(di, diffs().length - 1); schedulePreview()
      }
      if (searching) { // 검색 중: 글자는 입력칸이 받고, 여기서는 방향키(곡 이동)·Enter(확인)·Esc(지우고 닫기)만 처리
        if (e.key === 'Enter') openSearch(false)
        else if (e.key === 'Escape') { query = ''; openSearch(false); applyCat() }
        else if (e.key === 'ArrowDown') move(1)
        else if (e.key === 'ArrowUp') move(-1)
        else if (e.key === 'Tab') e.preventDefault()
        return
      }
      if (e.key === 'F2') { e.preventDefault(); openSearch(true); return }
      if (e.key === 'F4') { sortMode = (sortMode + 1) % SORTS.length; applyCat(); note = `정렬: ${SORTS[sortMode]}`; noteAt = performance.now() + 1500; return }
      if (e.key === 'Escape' && query) { query = ''; applyCat(); return } // 검색어가 있으면 Esc는 먼저 검색을 지운다
      if (e.key === 'ArrowDown') move(1)
      else if (e.key === 'ArrowUp') move(-1)
      else if (e.key === 'ArrowRight') di = Math.min(di + 1, diffs().length - 1)
      else if (e.key === 'ArrowLeft') di = Math.max(di - 1, 0)
      else if (e.key === 'Tab') { e.preventDefault(); if (!e.repeat) { cat = cats[(cats.indexOf(cat) + (e.shiftKey ? cats.length - 1 : 1)) % cats.length]; applyCat() } }
      else if (e.key === 'Enter' && songs[idx]) { // 서버에서 받아야 하는 곡·대결은 로딩 화면을 거친다 (대결은 손님에게 곡을 알리고, 손님이 받아 두면 시작)
        const s = songs[idx], d = diffs()[di], keys = settings.keyMode
        if (!s.remote && !vsMode) { leave('play', { song: s, diff: d }); return }
        leave('loading', {
          song: s, sub: `${keys}K · ${diffName(d)}`, next: 'play', nextData: vsMode ? { song: s, diff: d, vs: true, keys } : { song: s, diff: d },
          back: 'select', backData: { mode: vsMode ? 'versus' : 'play', focus: s.dir },
          run: async (progress: (p: number) => void, signal: AbortSignal) => {
            await ensureSong(s, progress, signal)
            if (vsMode && !(await pickSong(s, d))) throw new Error('상대가 이 곡을 받지 못했습니다')
          }
        })
      }
      else if (e.key === 'F3') { settings.keyMode = settings.keyMode === 6 ? 4 : 6; saveSettings(); di = Math.min(di, diffs().length - 1); schedulePreview() } // 4키 ↔ 6키
      else if (e.key === 'F1') leave('settings', { back: 'select', backData: vsMode ? { mode: 'versus' } : undefined })
      else if (e.key === 'Escape') leave(vsMode ? 'vs' : 'title')
      else if (/^[a-z0-9]$/i.test(e.key) && !e.ctrlKey && !e.altKey && !e.metaKey && songs.length > 1) { // 글자·숫자 키: 그 글자로 시작하는 다음 곡으로 건너뛴다
        const j = songs.findIndex((s, k) => k > idx && s.meta.title.toLowerCase().startsWith(e.key.toLowerCase())), w = j >= 0 ? j : songs.findIndex(s => s.meta.title.toLowerCase().startsWith(e.key.toLowerCase()))
        if (w >= 0 && w !== idx) move(w - idx)
      }
    }
  }
}
