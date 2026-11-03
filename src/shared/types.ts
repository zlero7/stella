export interface Note { time: number; lane: number; duration?: number }
export interface Chart {
  version: 1; keys: number; difficulty: string; level: number
  offset: number; timing: { time: number; bpm: number }[]; notes: Note[]
  gen?: number // 자동 채보를 만든 알고리즘 번호(AutoChart의 CHART_GEN). 낮으면 선택 화면에서 새로 만든다
  hand?: boolean // 에디터로 직접 고친 채보: 자동 재생성이 절대 덮어쓰지 않는다
  speeds?: { time: number; mult: number }[] // 변속: 이 시각부터 노트가 mult배 속도로 내려온다 (판정 시각은 그대로)
}
export interface SongMeta {
  title: string; artist: string; audio: string
  singers?: string[] // 부른 사람(커버면 artist가 원곡자라 따로 둔다). 가수별 분류에 쓴다
  cover?: string // 곡 로고(카드에 표시)
  bg?: string // 플레이·선택 화면 배경 (없으면 cover를 흐리게 사용)
  video?: string // 플레이 화면 배경 영상 (mp4)
  bpm: number; previewStart: number; charts: string[]
  highlights?: [number, number][] // 하이라이트(후렴) 구간 [시작, 끝] 초. 채보는 이 구간에서 보컬을 따른다
}
export interface Song { dir: string; meta: SongMeta; remote?: boolean } // remote: 서버 목록에만 있고 이 PC에는 아직 받지 않은 곡

// 대결용 네트워크 (IP 직접 접속): 한 번에 한 명과 줄 단위 JSON을 주고받는다
export interface NetApi {
  host(port: number): Promise<void> // 방 열기: 상대가 들어오면 'open' 이벤트
  join(addr: string): Promise<void> // 상대 방에 접속 (host:port)
  send(line: string): void
  close(): void
  ips(): Promise<string[]> // 이 PC의 IPv4 주소들
  on(cb: (e: { kind: 'open' | 'msg' | 'close'; data?: string }) => void): void
}

export interface Api {
  net: NetApi
  scanSongs(): Promise<Song[]>
  readFile(dir: string, file: string): Promise<ArrayBuffer>
  writeFile(dir: string, file: string, text: string): Promise<void>
  putFile(dir: string, file: string, data: Uint8Array): Promise<void> // 서버에서 받은 곡 파일을 곡 폴더에 둔다 (곡이 생기는 유일한 길)
  state: Record<string, string> // 설정·점수 기록 (사용자 데이터 폴더의 state.json). 시작할 때 한 번 동기로 읽는다
  saveState(key: string, value: string): void
  setScreen(mode: number): void // 화면 모드: 0 창모드, 1 전체화면 창모드, 2 전체화면
  quit(): void // 앱 종료 (window.close()로는 닫히지 않는다)
}
