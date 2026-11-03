export interface Scene {
  enter?(data?: unknown): void
  update?(dt: number): void
  render(g: CanvasRenderingContext2D): void
  keydown?(e: KeyboardEvent): void
  keyup?(e: KeyboardEvent): void
  mousedown?(x: number, y: number, button: number): void
  mouseup?(x: number, y: number, button: number): void
  mousemove?(x: number, y: number): void
  wheel?(dy: number): void
}

// 꾹 누르면 계속 입력되는 키: 방향키·PageUp/Down만 (Enter·Space·문자 키는 한 번만)
const REPEAT_KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown'])

const REPEAT_MS = 110 // 꾹 누른 입력은 이 간격(약 초당 9번)으로만 받는다. Windows 기본 반복(초당 30번)은 곡 목록이 너무 빨리 지나간다

export class SceneManager {
  private scenes = new Map<string, Scene>()
  private cur?: Scene
  private curName = ''
  onKey?: (key: string) => void // 메뉴 키 소리 (main이 연결). 플레이 중에는 건반 소리와 겹치지 않게 부르지 않는다
  private lastRepeat = 0

  add(name: string, s: Scene) { this.scenes.set(name, s) }
  go(name: string, data?: unknown) {
    this.cur = this.scenes.get(name); this.curName = name
    this.cur?.enter?.(data)
  }
  update(dt: number) { this.cur?.update?.(dt) }
  render(g: CanvasRenderingContext2D) { this.cur?.render(g) }
  keydown(e: KeyboardEvent) {
    if (e.repeat) { // 꾹 누름: 방향키만, 일정 간격으로. 그 밖의 키는 무시
      if (!REPEAT_KEYS.has(e.key) || e.timeStamp - this.lastRepeat < REPEAT_MS) return
      this.lastRepeat = e.timeStamp
    }
    if (this.curName !== 'play') this.onKey?.(e.key)
    this.cur?.keydown?.(e)
  }
  keyup(e: KeyboardEvent) { this.cur?.keyup?.(e) }
  mousedown(x: number, y: number, b: number) { this.cur?.mousedown?.(x, y, b) }
  mouseup(x: number, y: number, b: number) { this.cur?.mouseup?.(x, y, b) }
  mousemove(x: number, y: number) { this.cur?.mousemove?.(x, y) }
  wheel(dy: number) { this.cur?.wheel?.(dy) }
}
