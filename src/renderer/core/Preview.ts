import type { Song } from '../../shared/types'
import { gainOf, settings } from '../data/Storage'
import { previewStartOf, songUrl } from '../data/Songs'

let cur: HTMLMediaElement | undefined
let start = 0

export function stopPreview() {
  if (!cur) return
  const m = cur; cur = undefined // 먼저 비운다: load()가 error 이벤트를 내는데, 그걸 '미리보기 클립 없음'으로 오해해 원본 영상을 통째로 받던 버그
  m.pause(); m.removeAttribute('src'); m.load()
}

// 곡 선택 시 미리듣기: <video>/<audio>가 파일을 직접 스트리밍한다 (통째로 읽고 디코딩하지 않아 큰 mp4도 끊김이 없다)
// 영상 곡이면 돌려받은 <video>를 그대로 화면 배경으로 그리면 소리와 영상이 항상 맞는다
export function preview(song?: Song): HTMLMediaElement | undefined {
  stopPreview()
  if (!song) return
  const m = document.createElement(song.meta.video ? 'video' : 'audio')
  m.preload = 'auto'; m.volume = 0
  // 아직 받지 않은 곡은 서버의 작은 미리보기 클립(20초, 480p)을 쓴다. 없으면 원본으로
  const clip = !!song.remote && !!song.meta.video
  m.src = songUrl(song.dir, clip ? 'preview.mp4' : song.meta.audio)
  if (clip) m.addEventListener('error', () => { if (cur === m) { clip0 = false; m.src = songUrl(song.dir, song.meta.audio) } }, { once: true })
  let clip0 = clip
  m.addEventListener('loadedmetadata', () => {
    start = clip0 ? 0 : previewStartOf(song.meta.previewStart, m.duration)
    m.currentTime = start
    void m.play().catch(() => { /* 재생 못 하는 파일은 조용히 넘어감 */ })
  }, { once: true })
  cur = m
  return m
}

// 매 프레임 호출: 20초 구간 반복 + 0.5초 페이드인
export function tickPreview() {
  const m = cur
  if (!m || m.paused || !m.duration) return
  if (m.currentTime >= start + 20 || m.ended) m.currentTime = start
  m.volume = Math.min(Math.max((m.currentTime - start) / 0.5, 0), 1) * gainOf(settings.volume) * 0.8
}
