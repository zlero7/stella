import type { Scene, SceneManager } from '../core/SceneManager'
import type { Song } from '../../shared/types'
import { drawLoading } from '../render/loading'

// 곡을 서버에서 받는 동안 보여 주는 로딩 화면. run이 끝나면 next 화면으로, 실패하면 오류를 보여 주고 Esc로 돌아간다
interface Data { song: Song; sub?: string; run: (progress: (p: number) => void, signal: AbortSignal) => Promise<void>; next: string; nextData: unknown; back: string; backData?: unknown }

export const Loading = (sm: SceneManager): Scene => {
  let d: Data, pct = 0, err = '', ctl = new AbortController(), alive = false, waiting = ''
  const back = () => { alive = false; ctl.abort(); sm.go(d.back, d.backData) }
  return {
    enter(data) {
      d = data as Data; pct = 0; err = ''; waiting = ''; ctl = new AbortController(); alive = true
      const mine = ctl
      d.run(p => { pct = p; if (p >= 1) waiting = '준비 중…' }, mine.signal).then(
        () => { if (alive && ctl === mine) { alive = false; sm.go(d.next, d.nextData) } },
        e => { if (alive && ctl === mine) err = e instanceof Error && e.message ? e.message : '곡을 받지 못했습니다' }
      )
    },
    render(g) { drawLoading(g, d?.song, err ? undefined : pct, err ? `${err}  (Esc: 돌아가기)` : waiting || undefined, d?.sub) },
    keydown(e) { if (e.key === 'Escape') back() },
    mousedown(_x, _y, b) { if (err && b === 0) back() }
  }
}
