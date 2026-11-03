import type { Song } from '../../shared/types'
import { songUrl } from '../data/Songs'
import lane from '../assets/lane.svg'
import noteW from '../assets/note-w.svg'
import noteB from '../assets/note-b.svg'

const load = (src: string) => { const i = new Image(); i.src = src; return i }
export const A = { lane: load(lane), noteW: load(noteW), noteB: load(noteB) } // 에디터가 쓰는 그림

// 스텔라: 맑은 하늘색. 하늘 파랑 바탕에 흰 구름과 햇살, 포인트는 금빛 별. Bahnschrift는 각진 숫자꼴, 한글은 맑은 고딕으로 이어진다
export const FONT = "'Bahnschrift','Segoe UI','Malgun Gothic',sans-serif"
export const CYAN = '#7ad8ff' // 밝은 하늘색 (선택·강조)
export const BLUE = '#5b8cff' // 강조 그라데이션의 끝
export const AMBER = '#ffd36b' // 별빛 금색
export const ICE = '#e6f6ff'
export const NAVY = '#0b2a6b' // 밝은 면 위의 글자색
// 노트 색(바깥 두 레인). 공식 색 표를 못 찾아 나무위키의 상징·오시마크·머리색을 바탕으로 정한 근사값이다
export const NOTE_COLORS: [string, string][] = [
  ['기본', '#4fa8ff'], ['아이리 칸나', '#2f4fc9'], ['아야츠노 유니', '#b9a4ff'], ['시라유키 히나', '#ff8fb3'], ['네네코 마시로', '#aeb6c6'],
  ['아카네 리제', '#d93a4c'], ['아라하시 타비', '#7fd8f7'], ['아오쿠모 린', '#3c7dff'], ['하나코 나나', '#ff6b8b'],
  ['유즈하 리코', '#6bd66f'], ['텐코 시부키', '#d982ff'], ['사키하네 후야', '#7a4dff']
]
// '#rrggbb' → 'r,g,b' (rgba() 안에 넣어 쓴다)
export const rgbOf = (hex: string) => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)).join(',')
// 흰색과 섞어 밝게 (t=0 원색, 1 흰색)
export const lighten = (hex: string, t: number) => '#' + [1, 3, 5].map(i => Math.round(parseInt(hex.slice(i, i + 2), 16) * (1 - t) + 255 * t).toString(16).padStart(2, '0')).join('')

type Img = ImageBitmap | HTMLCanvasElement | HTMLImageElement

// SVG는 createImageBitmap이 못 읽어서 <img>로 디코딩한다
async function decodeCover(data: ArrayBuffer, file: string): Promise<Img> {
  if (!file.endsWith('.svg')) return createImageBitmap(new Blob([data]))
  const img = new Image()
  img.src = URL.createObjectURL(new Blob([data], { type: 'image/svg+xml' }))
  await img.decode()
  return img
}
interface Art { img: Img; bg: HTMLCanvasElement }

// 커버를 블러 처리한 배경 (한 번만 만들어 캐시)
function bgOf(img: Img, blur: number) {
  // 1280x720 원본 화질로 만든다 (곡이 많아도 최근 12곡만 캐시해서 메모리는 고정)
  const bg = document.createElement('canvas'); bg.width = 1280; bg.height = 720
  const c = bg.getContext('2d')!
  const s = Math.max(1280 / img.width, 720 / img.height) * (blur ? 1.1 : 1) // 블러 가장자리 투명 방지
  if (blur) c.filter = `blur(${blur}px)`
  c.drawImage(img, (1280 - img.width * s) / 2, (720 - img.height * s) / 2, img.width * s, img.height * s)
  c.filter = 'none'; c.fillStyle = 'rgba(10,40,110,.5)'; c.fillRect(0, 0, 1280, 720)
  return bg
}
const makeArt = (img: Img): Art => ({ img, bg: bgOf(img, 0) })

// 커버 파일이 없는 곡용: 제목에서 시드를 뽑아 곡마다 다른 아트를 그린다
function genArt(song: Song): Art {
  let h = 2166136261
  for (const ch of song.meta.title + song.meta.artist) h = Math.imul(h ^ ch.codePointAt(0)!, 16777619)
  const rnd = () => { // mulberry32
    h = (h + 0x6D2B79F5) | 0
    let t = Math.imul(h ^ (h >>> 15), 1 | h)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const c = document.createElement('canvas'); c.width = 400; c.height = 400
  const x = c.getContext('2d')!
  const h1 = rnd() * 360, h2 = h1 + 60 + rnd() * 120
  const grad = x.createLinearGradient(0, 0, 400, 400)
  grad.addColorStop(0, `hsl(${h1} 70% 32%)`); grad.addColorStop(1, `hsl(${h2} 80% 22%)`)
  x.fillStyle = grad; x.fillRect(0, 0, 400, 400)
  for (let i = 0; i < 8; i++) {
    x.fillStyle = `hsla(${h1 + rnd() * 120} 90% 65% / ${0.12 + rnd() * 0.18})`
    x.beginPath(); x.arc(rnd() * 400, rnd() * 400, 30 + rnd() * 110, 0, Math.PI * 2); x.fill()
  }
  x.strokeStyle = 'rgba(255,255,255,.35)'; x.lineWidth = 3
  for (let i = 0; i < 3; i++) {
    const y = rnd() * 400
    x.beginPath(); x.moveTo(-20, y + 120); x.lineTo(420, y - 120); x.stroke()
  }
  x.font = "900 260px 'Segoe UI','Malgun Gothic',sans-serif"; x.textAlign = 'center'; x.textBaseline = 'middle'
  x.fillStyle = 'rgba(255,255,255,.2)'; x.fillText([...song.meta.title][0] ?? '?', 200, 215)
  x.strokeStyle = 'rgba(255,255,255,.5)'; x.lineWidth = 2; x.strokeRect(1, 1, 398, 398)
  return makeArt(c)
}

// 영상 중간쯤 한 프레임을 뽑는다: full은 배경용 전체 프레임, sq는 곡 카드용 정사각형 중앙 크롭
async function frameOf(dir: string, file: string) {
  const v = document.createElement('video')
  v.muted = true
  v.preload = 'auto'; v.src = songUrl(dir, file) // 통째로 읽지 않고 필요한 구간만 스트리밍
  const once = (ev: 'loadedmetadata' | 'seeked') => new Promise<void>((ok, no) => {
    v.addEventListener(ev, () => ok(), { once: true }); v.addEventListener('error', () => no(new Error('video')), { once: true })
    setTimeout(() => no(new Error('timeout')), 15000)
  })
  try {
    await once('loadedmetadata')
    const seek = once('seeked')
    v.currentTime = Math.min(v.duration * 0.15, 20) // 맨 앞은 검은 화면인 경우가 많다
    await seek
    // seeked 직후엔 프레임이 아직 안 그려져 검게 찍힌다: 새 프레임이 나올 때까지 (최대 0.5초) 기다린다
    await new Promise<void>(ok => { v.requestVideoFrameCallback(() => ok()); setTimeout(ok, 500) })
    const draw = (w: number, h: number, sx: number, sy: number, sw: number, sh: number) => {
      const c = document.createElement('canvas'); c.width = w; c.height = h
      c.getContext('2d')!.drawImage(v, sx, sy, sw, sh, 0, 0, w, h); return c
    }
    const { videoWidth: W, videoHeight: H } = v, m = Math.min(W, H)
    const FW = Math.min(W, 1920) // 배경은 원본 화질(최대 1080p)로 뽑는다
    return { full: draw(FW, Math.round(FW * H / W), 0, 0, W, H), sq: draw(720, 720, (W - m) / 2, (H - m) / 2, m, m) }
  } finally { v.removeAttribute('src'); v.load() }
}

const arts = new Map<string, Art>()

// 항상 즉시 Art를 돌려준다: 처음엔 생성 아트, 곡 폴더의 실제 커버가 로드되면 그걸로 교체
export function artOf(song?: Song): Art | undefined {
  if (!song) return undefined
  let a = arts.get(song.dir)
  if (!a) {
    const art = a = genArt(song)
    arts.set(song.dir, art)
    if (arts.size > 24) arts.delete(arts.keys().next().value!) // 오래된 것부터 버린다: 곡이 수백 개여도 메모리 고정
    // 못 읽으면 생성 아트를 그대로 둔다. 같은 Art 객체를 고쳐서 cover/bg 로드 순서가 상관없다
    const load = (f: string, apply: (img: Img) => void) =>
      (song.remote ? fetch(songUrl(song.dir, f)).then(r => r.arrayBuffer()) : window.api.readFile(song.dir, f)).then(d => decodeCover(d, f)).then(apply, () => {}) // 아직 못 받은 곡은 서버에서 바로
    const { cover, bg, video } = song.meta
    // 로고 이미지가 없는 영상 곡은 영상에서 뽑은 프레임을 로고(와 배경)로 쓴다
    if (video && !cover) frameOf(song.dir, video).then(f => { art.img = f.sq; if (!bg) art.bg = bgOf(f.full, 0) }, () => {})
    if (cover) load(cover, img => { art.img = img; if (!bg) art.bg = bgOf(img, 0) })
    if (bg) load(bg, img => { art.bg = bgOf(img, 0) }) 
  }
  return a
}

// 모든 화면 공통 배경 층: 하늘 그라데이션 + 햇살 + 구름 + 반짝이는 별 + 가장자리 어둡힘. 한 번만 그려 두고 매 프레임 drawImage 한 번으로 쓴다
function layer(solid: boolean) {
  const c = document.createElement('canvas'); c.width = 1280; c.height = 720
  const x = c.getContext('2d')!
  if (solid) {
    const g1 = x.createLinearGradient(0, 0, 0, 720); g1.addColorStop(0, '#2467e8'); g1.addColorStop(0.5, '#4aa6ff'); g1.addColorStop(1, '#a9dcff')
    x.fillStyle = g1; x.fillRect(0, 0, 1280, 720)
    const sun = x.createRadialGradient(1010, 130, 0, 1010, 130, 520)
    sun.addColorStop(0, 'rgba(255,255,255,.55)'); sun.addColorStop(0.3, 'rgba(210,240,255,.22)'); sun.addColorStop(1, 'rgba(255,255,255,0)')
    x.fillStyle = sun; x.fillRect(0, 0, 1280, 720)
    // 구름: 아래쪽에 부드럽게 겹친 흰 덩어리
    let r = 20260101; const rnd = () => ((r = (Math.imul(r, 1664525) + 1013904223) | 0) >>> 0) / 4294967296
    for (let i = 0; i < 16; i++) {
      const cx = rnd() * 1400 - 60, cy = 560 + rnd() * 220, cr = 110 + rnd() * 170
      const cg = x.createRadialGradient(cx, cy, 0, cx, cy, cr); cg.addColorStop(0, 'rgba(255,255,255,.5)'); cg.addColorStop(1, 'rgba(255,255,255,0)')
      x.fillStyle = cg; x.fillRect(cx - cr, cy - cr, cr * 2, cr * 2)
    }
    for (let i = 0; i < 70; i++) {
      const sx = rnd() * 1280, sy = rnd() * 520, big = rnd() < 0.12
      x.fillStyle = `rgba(${rnd() < 0.2 ? '255,236,170' : '255,255,255'},${0.35 + rnd() * 0.5})`
      if (big) { starPath(x, sx, sy, 5 + rnd() * 6); x.fill() } else x.fillRect(sx, sy, 2, 2)
    }
  }
  x.save(); x.globalCompositeOperation = 'lighter'
  for (const [x0, w, a] of [[-100, 260, .09], [260, 90, .06], [880, 300, .09], [1120, 70, .06]] as const) {
    const g2 = x.createLinearGradient(x0, 0, x0 + w, 0)
    g2.addColorStop(0, 'rgba(255,255,255,0)'); g2.addColorStop(.5, `rgba(255,255,255,${a})`); g2.addColorStop(1, 'rgba(255,255,255,0)')
    x.fillStyle = g2; x.beginPath(); x.moveTo(x0 + 240, 0); x.lineTo(x0 + 240 + w, 0); x.lineTo(x0 + w, 720); x.lineTo(x0, 720); x.fill()
  }
  x.restore()
  const v = x.createRadialGradient(640, 360, 380, 640, 360, 880)
  v.addColorStop(0, 'rgba(8,30,90,0)'); v.addColorStop(1, 'rgba(8,30,90,.4)')
  x.fillStyle = v; x.fillRect(0, 0, 1280, 720)
  return c
}
let SOLID: HTMLCanvasElement | undefined, OVER: HTMLCanvasElement | undefined

export function drawBg(g: CanvasRenderingContext2D, song?: Song) {
  const art = artOf(song)
  if (art) g.drawImage(art.bg, 0, 0, 1280, 720)
  g.drawImage(art ? (OVER ??= layer(false)) : (SOLID ??= layer(true)), 0, 0)
}

// 원본 비율을 지키며 x,y,w,h를 꽉 채워 그린다 (넘치는 부분은 잘라냄)
export function drawCover(g: CanvasRenderingContext2D, src: CanvasImageSource, sw: number, sh: number, x: number, y: number, w: number, h: number) {
  const s = Math.max(w / sw, h / sh), cw = w / s, ch = h / s
  g.drawImage(src, (sw - cw) / 2, (sh - ch) / 2, cw, ch, x, y, w, h)
}

// 오른쪽으로 기운 평행사변형 경로 (디맥식 사선 패널)
export function slant(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, s = 18) {
  g.beginPath()
  g.moveTo(x + s, y); g.lineTo(x + w, y); g.lineTo(x + w - s, y + h); g.lineTo(x, y + h)
  g.closePath()
}
// 네 갈래 별(반짝임) 경로: 중심 (x,y), 반지름 r
export function starPath(g: CanvasRenderingContext2D, x: number, y: number, r: number) {
  g.beginPath(); g.moveTo(x, y - r)
  g.quadraticCurveTo(x, y, x + r, y); g.quadraticCurveTo(x, y, x, y + r)
  g.quadraticCurveTo(x, y, x - r, y); g.quadraticCurveTo(x, y, x, y - r); g.closePath()
}
// 푸른 유리 느낌의 사선 패널: 위가 살짝 밝은 면 + 윗변 하이라이트 + 흰 테두리. accent는 테두리 색
export function panel(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, accent = 'rgba(255,255,255,.55)', s = 18, alpha = 0.78) {
  slant(g, x, y, w, h, s)
  const f = g.createLinearGradient(0, y, 0, y + h)
  f.addColorStop(0, `rgba(40,100,200,${Math.min(alpha, 0.9)})`); f.addColorStop(1, `rgba(14,48,130,${Math.min(alpha + 0.08, 0.95)})`)
  g.fillStyle = f; g.fill()
  g.strokeStyle = accent; g.lineWidth = 1.5; g.stroke()
  g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(x + s + 1, y + 1, w - s - 2, 1) // 윗변 빛
}
// 시안→파랑 강조 그라데이션 (선택/주요 버튼)
export function accentFill(g: CanvasRenderingContext2D, x: number, w: number) {
  const gr = g.createLinearGradient(x, 0, x + w, 0); gr.addColorStop(0, CYAN); gr.addColorStop(1, BLUE); return gr
}

export function glow(g: CanvasRenderingContext2D, color: string, blur: number, draw: () => void) {
  g.save(); g.shadowColor = color; g.shadowBlur = blur; draw(); g.restore()
}

// 폰트를 먼저 지정한 뒤 호출: 폭을 넘는 글자는 …로 줄인다. 같은 글자·폰트·폭은 캐시 (measureText가 프레임당 수십 번 불리면 느리다)
const fits = new Map<string, string>()
export function fit(g: CanvasRenderingContext2D, s: string, w: number) {
  const k = `${g.font}|${w}|${s}`
  let r = fits.get(k)
  if (r === undefined) {
    r = s
    if (g.measureText(s).width > w) {
      const t = [...s]
      while (t.length > 1 && g.measureText(t.join('') + '…').width > w) t.pop()
      r = t.join('') + '…'
    }
    if (fits.size > 2000) fits.clear()
    fits.set(k, r)
  }
  return r
}

// 디맥식 메뉴 줄: 선택한 줄은 주황 띠에 흰 막대, 나머지는 어두운 얇은 띠 (타이틀·일시정지 메뉴가 같이 쓴다)
export function menuRow(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, on: boolean | number) {
  const k = +on // 0 = 어두운 줄, 1 = 주황 띠. 그 사이는 섞어서 서서히 바뀐다
  g.fillStyle = 'rgba(8,24,70,.74)'; g.beginPath(); g.roundRect(x, y, w, h, 14); g.fill()
  if (k < 1) { g.strokeStyle = `rgba(255,255,255,${0.22 * (1 - k)})`; g.lineWidth = 1; g.stroke() }
  if (k > 0.01) {
    g.save(); g.globalAlpha *= k
    const og = g.createLinearGradient(x, 0, x + w, 0); og.addColorStop(0, '#ffb13b'); og.addColorStop(0.7, '#ff7a59'); og.addColorStop(1, '#ff5c8a')
    g.fillStyle = og; glow(g, '#ff9f1a', 18, () => { g.beginPath(); g.roundRect(x, y, w, h, 14); g.fill() })
    g.beginPath(); g.roundRect(x, y, w, h, 14); g.clip(); g.fillStyle = '#fff'; g.fillRect(x, y, 6 * k, h) // 왼쪽 흰 띠는 둥근 모서리 안에서만
    g.restore()
  }
}


// 긴 글자 맞추기: 폭에 들어갈 때까지 글자 크기를 min까지 줄이고, 그래도 넘으면 …로 줄인다. g.font를 정한 크기로 바꿔 두고 글자를 돌려준다
export function fitFont(g: CanvasRenderingContext2D, text: string, maxW: number, weight: number | string, size: number, min = 18) {
  let sz = size
  g.font = `${weight} ${sz}px ${FONT}`
  while (sz > min && g.measureText(text).width > maxW) { sz -= 1; g.font = `${weight} ${sz}px ${FONT}` }
  return fit(g, text, maxW)
}

// 곡 정보 카드 모양의 둥근 카드: 어두운 남색 면 + 흰 테두리. head가 있으면 왼쪽 위에 작은 하늘색 머리글 (플레이·결과 화면이 같이 쓴다)
export function card(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, head?: string, r = 20) {
  g.fillStyle = 'rgba(8,24,70,.78)'; g.beginPath(); g.roundRect(x, y, w, h, r); g.fill()
  g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 1.5; g.stroke()
  if (head) { g.font = `700 13px ${FONT}`; g.fillStyle = CYAN; g.textAlign = 'left'; g.fillText(head, x + 20, y + 30) }
}
// 알약 모양 칩 (상태 표시·키 안내)
export function pill(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill: string | CanvasGradient) {
  g.beginPath(); g.roundRect(x, y, w, h, h / 2); g.fillStyle = fill; g.fill()
}
// 얇은 진행 막대 (진행도·정확도): f는 0~1
export function meter(g: CanvasRenderingContext2D, x: number, y: number, w: number, f: number) {
  g.fillStyle = 'rgba(255,255,255,.25)'; g.beginPath(); g.roundRect(x, y, w, 4, 2); g.fill()
  g.fillStyle = accentFill(g, x, w); g.beginPath(); g.roundRect(x, y, Math.max(w * Math.min(f, 1), 0), 4, 2); g.fill()
}

// ── 마우스: 클릭할 수 있는 영역 ──
// 화면을 그릴 때 버튼·줄을 그린 자리 그대로 등록한다 (매 프레임 비우고 다시 등록). 나중에 등록한 것이 위에 있다. 위에 올라가면 포인터가 손 모양이 된다
interface Hit { x: number; y: number; w: number; h: number; click(): void; over?(): void }
const hits: Hit[] = []
export const clearHits = () => { hits.length = 0 }
export const hit = (x: number, y: number, w: number, h: number, click: () => void, over?: () => void) => { hits.push({ x, y, w, h, click, over }) }
export function hitAt(px: number, py: number) {
  for (let i = hits.length - 1; i >= 0; i--) { const t = hits[i]; if (px >= t.x && px <= t.x + t.w && py >= t.y && py <= t.y + t.h) return t }
}
// 안내 칩을 눌렀을 때 그 키를 누른 것처럼 장면에 전달한다 (main.ts가 장면 관리자에 연결)
let dispatch: (key: string) => void = () => {}
export const setDispatch = (fn: (key: string) => void) => { dispatch = fn }
export const press = (key: string) => dispatch(key)
// 키 안내 칩 [키] 설명: 누르면 그 키를 누른 것과 같다 (real: 실제 키 이름, null이면 클릭 없음). 다음 칩을 놓을 x를 돌려준다
export function chip(g: CanvasRenderingContext2D, x: number, y: number, key: string, label: string, color = '#0b2a6b', real?: string | null, h = 20, fs = 13) {
  g.textAlign = 'left'; g.font = `800 ${fs}px ${FONT}`
  const kw = g.measureText(key).width + 14, base = y + h / 2 + fs / 2 - 1
  g.font = `${fs}px ${FONT}`
  const total = kw + 5 + g.measureText(label).width, k = ease(`chip${x|0},${y|0}`, !!(real !== null) && overRect(x - 2, y - 2, total + 4, h + 4)), dy = -2 * k // 올리면 살짝 뜨고 금색으로
  g.font = `800 ${fs}px ${FONT}`
  pill(g, x, y + dy, kw, h, 'rgba(255,255,255,.92)')
  if (k > 0.01) { g.save(); g.globalAlpha = k; pill(g, x, y + dy, kw, h, '#ffd36b'); g.restore() }
  g.fillStyle = '#0b2a6b'; g.fillText(key, x + 7, base + dy)
  g.font = `${fs}px ${FONT}`; g.fillStyle = color; g.fillText(label, x + kw + 5, base + dy)
  const kk = real === undefined ? (key === 'Esc' ? 'Escape' : key) : real
  if (kk) hit(x - 2, y - 2, total + 4, h + 4, () => press(kk))
  return x + total + 16
}
export const hitCount = () => hits.length

// ── 부드러운 전환 ──
// id마다 현재 값(0~1)을 기억해 두고 target으로 빠르게 다가간다. 올리거나 고른 순간 확 바뀌지 않고 서서히 번진다
const easeMap = new Map<string, { v: number; t: number }>()
export function ease(id: string, target: boolean | number, speed = 14) {
  const now = performance.now(), e = easeMap.get(id) ?? { v: +target, t: now }, to = +target
  e.v += (to - e.v) * Math.min(1, Math.min((now - e.t) / 1000, 0.05) * speed)
  if (Math.abs(to - e.v) < 0.004) e.v = to
  e.t = now; easeMap.set(id, e)
  return e.v
}
// 마우스 위치(캔버스 좌표): main.ts가 갱신한다
export const mouse = { x: -99, y: -99 }
export const overRect = (x: number, y: number, w: number, h: number) => mouse.x >= x && mouse.x <= x + w && mouse.y >= y && mouse.y <= y + h

// 폭을 넘는 글자는 …로 자르지 않고 옆으로 흘려 보낸다. 폰트·색·정렬(left)은 미리 정해 둔다. since = 이 글자가 보이기 시작한 시각(ms): 처음 0.9초는 멈춰 있다가 흐른다
export function marquee(g: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, fs: number, since: number) {
  const w = g.measureText(text).width
  if (w <= maxW) { g.fillText(text, x, y); return }
  const span = w + 60, off = Math.max(0, (performance.now() - since) / 1000 - 0.9) * 45 % span
  g.save(); g.beginPath(); g.rect(x, y - fs * 1.1, maxW, fs * 1.5); g.clip()
  g.fillText(text, x - off, y); g.fillText(text, x - off + span, y)
  g.restore()
}
