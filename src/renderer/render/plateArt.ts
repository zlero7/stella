// 레벨 31~100 플레이트의 무늬 (바탕 그라데이션 위에 얹는다). 호출하는 쪽이 plate 모양으로 clip을 잡아 둔다.
// 무늬는 id만으로 정해진다 (매 프레임 같은 모양: 난수 대신 고정 식)
const A = { v: 1 } // 무늬 전체의 진하기 (글자 뒤에 깔릴 때 낮춘다)
const dot = (g: CanvasRenderingContext2D, x: number, y: number, r: number, c: string, a: number) => { g.globalAlpha = a * A.v; g.fillStyle = c; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill() }

export function plateArt(g: CanvasRenderingContext2D, id: string, x: number, y: number, w: number, h: number, c1: string, c2: string, alpha = 1) {
  A.v = alpha
  g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip()
  const cy = y + h / 2
  if (id === 'nebula') { // 성운: 겹치는 부드러운 구름
    for (let i = 0; i < 9; i++) { const px = x + w * ((i * 0.37) % 1), py = y + h * ((i * 0.61 + 0.1) % 1), r = h * (0.5 + 0.35 * ((i * 0.29) % 1)), gr = g.createRadialGradient(px, py, 0, px, py, r); const c = i % 2 ? c1 : c2; gr.addColorStop(0, c); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.globalAlpha = A.v * 0.5; g.fillStyle = gr; g.fillRect(x, y, w, h) }
    for (let i = 0; i < 14; i++) dot(g, x + w * ((i * 0.173 + 0.05) % 1), y + h * ((i * 0.397) % 1), 1.2, '#fff', 0.7)
  } else if (id === 'pulsar') { // 맥동성: 겹겹의 고리와 두 줄기 빛
    const px = x + w * 0.28
    g.lineWidth = 1.5; for (let i = 1; i <= 5; i++) { g.globalAlpha = A.v * 0.55 - i * 0.08; g.strokeStyle = i % 2 ? c2 : '#fff'; g.beginPath(); g.arc(px, cy, h * 0.22 * i, 0, Math.PI * 2); g.stroke() }
    g.globalAlpha = A.v * 0.75; g.fillStyle = c2; g.fillRect(px - w * 0.5, cy - 1.5, w, 3); g.globalAlpha = A.v * 0.35; g.fillRect(px - 1.5, y, 3, h)
    dot(g, px, cy, h * 0.1, '#fff', 0.95)
  } else if (id === 'quasar') { // 퀘이사: 비스듬한 제트 줄기
    g.lineCap = 'round'
    for (const [o, lw, a] of [[0, 5, 0.55], [h * 0.45, 2.5, 0.45], [-h * 0.45, 2.5, 0.45], [h * 0.9, 1.5, 0.3]] as const) { g.globalAlpha = a * A.v; g.strokeStyle = o ? c2 : '#fff'; g.lineWidth = lw; g.beginPath(); g.moveTo(x - 10, cy + h * 0.9 + o); g.lineTo(x + w + 10, cy - h * 0.9 + o); g.stroke() }
    dot(g, x + w * 0.5, cy, h * 0.14, '#fff', 0.9)
  } else if (id === 'zenith') { // 천정: 한 점에서 퍼지는 금빛 햇살
    const px = x + w * 0.3
    for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2, l = w * (i % 2 ? 0.7 : 1.1); g.globalAlpha = A.v * i % 2 ? 0.28 : 0.5; g.strokeStyle = c2; g.lineWidth = i % 2 ? 2 : 3.5; g.beginPath(); g.moveTo(px, cy); g.lineTo(px + Math.cos(a) * l, cy + Math.sin(a) * l); g.stroke() }
    const gr = g.createRadialGradient(px, cy, 0, px, cy, h * 0.7); gr.addColorStop(0, '#fff'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.globalAlpha = A.v * 0.8; g.fillStyle = gr; g.fillRect(x, y, w, h)
  } else if (id === 'cosmos') { // 우주: 별밭과 큰 고리
    g.strokeStyle = c2; g.lineWidth = 1.5; g.globalAlpha = A.v * 0.5; g.beginPath(); g.ellipse(x + w * 0.4, cy, w * 0.42, h * 0.3, -0.3, 0, Math.PI * 2); g.stroke()
    for (let i = 0; i < 40; i++) dot(g, x + w * ((i * 0.6180339) % 1), y + h * ((i * 0.3819660 * 7) % 1), i % 7 === 0 ? 1.8 : 0.9, i % 3 ? '#fff' : c2, 0.4 + 0.5 * ((i * 0.13) % 1))
    dot(g, x + w * 0.4, cy, h * 0.16, c2, 0.9); dot(g, x + w * 0.4, cy, h * 0.07, '#fff', 1)
  }
  g.restore()
}
