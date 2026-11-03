# DJMAX 시리즈 UI/UX 분석 (DJMAX RESPECT V 중심; Technika / Online / Portable 참고)

조사 한계(먼저 읽을 것): 이번 조사에서 WebFetch/WebSearch는 요약본만 돌려주었고, 일부 페이지(HardcoreGamer, Dengeki, Steam 스레드, 리뷰 사이트)는 연결 오류였다. 나무위키는 문서 텍스트로 읽을 수 있었으나 **선곡 화면의 시각 레이아웃, 난이도 색상 코드, 레인 폭/판정선 위치(px), 결과 화면 레이아웃은 어느 출처에서도 확인하지 못했다.** 아래 Gaps에 모아 두었고, 그 부분은 모두 "미확인"이다. 영상 시청 불가.

주요 출처(나무위키, 2026년까지 갱신됨):
- [DJMAX RESPECT/시스템](https://namu.wiki/w/DJMAX%20RESPECT/시스템) 이하 "시스템 문서"
- [DJMAX RESPECT V/패치노트](https://namu.wiki/w/DJMAX%20RESPECT%20V/패치노트) 이하 "패치노트"
- [DJMAX RESPECT V](https://namu.wiki/w/DJMAX%20RESPECT%20V) / [2.0 업데이트](https://namu.wiki/w/DJMAX%20RESPECT%20V/2.0%20업데이트) / [DJMAX RESPECT/게임 관련 정보](https://namu.wiki/w/DJMAX%20RESPECT/게임%20관련%20정보) / [DJMAX RESPECT/모드](https://namu.wiki/w/DJMAX%20RESPECT/모드) / [DJ CLASS](https://namu.wiki/w/DJ%20CLASS)

---

## 1. 선곡(Song Select) 화면

### Takeaway
선곡 화면의 조작 체계(방향키+Enter, 알파벳 점프, TAB으로 키 모드 전환, SPACE로 세부 설정, F4 정렬, F9 즐겨찾기)와 정렬/필터 기능은 확인됐지만, 화면 배치(재킷 위치, 보이는 행 수)와 난이도 색상은 확인하지 못했다.

### Cited Findings
- 곡은 방향키로 고르고 Enter로 시작. 알파벳 키를 누르면 해당 글자로 시작하는 첫 곡으로 점프. SPACE는 세부 설정 화면. 잠긴 곡은 자물쇠 아이콘, 해금 가능한 곡은 흰색 표기 — [ASCII.jp](https://weekly.ascii.jp/elem/000/004/003/4003145/)
- 키 모드는 4/5/6/8키, **TAB 키로 전환**. 난이도는 모드별·곡별로 따로 존재 — [ASCII.jp](https://weekly.ascii.jp/elem/000/004/003/4003145/). ASCII.jp는 난이도를 NORMAL/HARD/EXPERT/MAXIMUM/SC로 적었으나, 나무위키 시스템 문서는 NORMAL(NM)/HARD(HD)/MAXIMUM(MX)/SC로 표기(EXPERT 없음)하고 FX·SP·TB·RS·RD는 특수 패턴 — 두 출처가 상충, 나무위키(및 [Gaming Trend](https://gamingtrend.com/feature/previews/cant-beat-these-sick-beats-djmax-respect-v-preview)의 NORMAL/HARD/MAXIMUM/SC)를 채택. [시스템 문서](https://namu.wiki/w/DJMAX%20RESPECT/시스템)
- SC는 별도의 15단계 레벨 체계를 쓰며, 키보드 전용 패턴(1~3동시 입력 외 3키 이상 코드 포함). 레벨 범위가 Season 6, Season 12에 재조정됨 — [나무위키 V](https://namu.wiki/w/DJMAX%20RESPECT%20V)
- 곡 선택 시 카테고리별 아이캐치(eyecatch)가 나뉘며, Portable/Trilogy 곡은 기기 테마 아트, 이후 시리즈는 풀스크린 재킷 + 시리즈 로고. 랜덤 선택 전용 BGM 있음. 잠긴 곡도 프리뷰는 가능 — [게임 관련 정보](https://namu.wiki/w/DJMAX%20RESPECT/게임%20관련%20정보), [모드](https://namu.wiki/w/DJMAX%20RESPECT/모드)
- 정렬: 제목/BPM/난이도(오름·내림차순)를 **F4**로 전환(2020.06.18), 갱신일순 추가(2020.08.06). Page Up/Down은 페이지 단위 점프, 방향키·PageKey 홀드 시 고속 스크롤(Season 2, 6). Freestyle은 Season 7부터 ALL TRACK 대신 **PLAYABLE 카테고리**로 시작. 검색(Search) 변경 이력은 없음 — [패치노트](https://namu.wiki/w/DJMAX%20RESPECT%20V/패치노트)
- 즐겨찾기: PC에서 **F9**(PS4는 R3). 결과 화면에서도 즐겨찾기 추가 가능(Season 6) — [모드](https://namu.wiki/w/DJMAX%20RESPECT/모드), [패치노트](https://namu.wiki/w/DJMAX%20RESPECT%20V/패치노트). 즐겨찾기·BGA 밝기·해상도·키 설정은 계정 동기화되지 않고 로컬 .dat 파일에 저장 — [나무위키 V](https://namu.wiki/w/DJMAX%20RESPECT%20V)
- 2.0 업데이트(Season 12, 2024.05.13): **마우스 입력 지원**, 빠른 이동용 내비게이션 메뉴, 시스템 설정 카테고리 분리, 카드형 프로필(DJ CLASS/LADDER MATCH 정보 표시), 타이틀 화면 재디자인. 랭킹 보드는 TOP PLAYER/TOP SPEEDER 정렬을 SPACE로 전환, 1000위 초과는 "999+"로 표기, 내 순위는 보드 하단 고정 — [2.0 업데이트](https://namu.wiki/w/DJMAX%20RESPECT%20V/2.0%20업데이트). 선곡 화면 재설계/필터/검색 개편은 언급 없음(같은 문서).
- 선곡 화면 탭: DJ CLASS용 NEW(최근 30패턴, 약 6개월 교체)와 BASIC(상위 70기록) 개념이 있음 — [DJ CLASS](https://namu.wiki/w/DJ%20CLASS), [시스템 문서](https://namu.wiki/w/DJMAX%20RESPECT/시스템)
- 키 모드 권장: 신규는 4키, 모바일 리듬게임 경험자는 6키, 5키는 코어하고 초심자 비추천. 8키는 커스텀 배치 사용자 많음 — [게임 관련 정보](https://namu.wiki/w/DJMAX%20RESPECT/게임%20관련%20정보)
- 난이도 표기 불안정(레벨이 일관되지 않다는 비판)이 알려진 문제 — [나무위키 V/문제점](https://namu.wiki/w/DJMAX%20RESPECT%20V/문제점)
- V에는 컨트롤러 조작 안내 UI가 초기에 없었고 EXTENSION 2(2022.01)에서 패드 전용 인터페이스 추가 — [문제점](https://namu.wiki/w/DJMAX%20RESPECT%20V/문제점), [패치노트](https://namu.wiki/w/DJMAX%20RESPECT%20V/패치노트)
- 버튼 모드별 난이도 표시 단위: Steam 커뮤니티 글에서 "곡 선택 화면에 표시된 별(star) 수가 난이도"라는 언급 — [Steam 토론(검색 요약 기반)](https://steamcommunity.com/app/960170/discussions/0/3814032755164749985) (직접 열람 못함, 약한 근거)

### Inferences
- 키 모드와 난이도를 "한 곡에 대해 모드별 4개 난이도 슬롯(NM/HD/MX/SC)"으로 두고, TAB 같은 한 키로 모드를 순환시키는 구조는 복사하기 쉽고 검증된 설계다.
- 정렬(F4)·즐겨찾기(F9)·알파벳 점프·PageUp/Down을 모두 키보드 단축키로 처리 — 곡 수가 수백 곡으로 늘면 필수.
- 2.0이 마우스 지원을 뒤늦게 붙였다는 점은 처음부터 키보드+마우스 양쪽 내비게이션을 넣을 근거가 된다.

### Gaps
- 재킷 배치, 곡 리스트 방향/보이는 행 수, BPM·기록·랭크·정확도 표시 위치, 프리뷰 재생 방식(길이/페이드), 폰트: 확인 못함(미확인).
- 난이도별 색상 코드(NM/HD/MX/SC): 확인 못함. 기억상 NM=노랑 계열, HD=주황, MX=빨강, SC=보라/핑크로 알려져 있으나 **출처 없음, 미확인**. 구현 시 직접 정할 것.

---

## 2. 4B 인게임 HUD

### Takeaway
4B는 4개 메인 트랙 + 좌우 사이드 트랙(총 6~10키 체계의 일부). 판정은 라벨이 아니라 MAX 100%~1% 퍼센트 + BREAK. HUD 요소(콤보/판정/레이트/피버 게이지/FAST·SLOW)는 개별 ON/OFF 및 위치 이동이 가능한 것이 특징.

### Cited Findings
- 모드: 4B/5B/6B/8B TUNES. 4B는 메인 4키 + 사이드 키(L/R), PC 기본 10키 배치(LShift, A, S, D, C, <, L, ;, ', RShift), 전 키 리바인드 가능. 트랙 이름 TRACK 1~6 + 8B용 TRACK L/R, 사이드 키는 SIDE KEY — [시스템 문서](https://namu.wiki/w/DJMAX%20RESPECT/시스템)
- 4B(PS4)는 L3/R3가 사이드 키, ◀ ▲ △ ○ 4개 메인 키 — [시스템 문서](https://namu.wiki/w/DJMAX%20RESPECT/시스템). 아날로그(사이드) 노트는 약 3초 전에 마커가 보이고, V에서는 사이드 노트가 사이드 트랙으로 표시 — 같은 문서
- 노트 색: 일반/아날로그 노트 기본 **하늘색(light cyan)**, 파랑/노랑/빨강으로 변경 가능. 범퍼(L1/R1) 노트 기본 **빨강**(초록/파랑/노랑 변경 가능). XB 트리거 노트는 보라. (※ "바깥 레인 vs 안쪽 레인" 색 구분은 별도로 확인 못함) — [시스템 문서](https://namu.wiki/w/DJMAX%20RESPECT/시스템)
- 기어(gear = 노트 트랙 프레임): 위치(좌/중/우)와 배경 투명도 0~100%(10% 단위) 조절. V에서 기어에 RATE와 FAST/SLOW 가이드 표시 가능. 기어·노트 스킨은 플레이 이득 없음(외형만) — [시스템 문서](https://namu.wiki/w/DJMAX%20RESPECT/시스템)- V HUD 설정: 콤보, 판정, 피버 게이지, 상대와의 점수 차, 평균 레이트, FAST/SLOW 가이드, 키 빔, 노트 이펙트, 키 가이드, 리와인드 알림, 사이드 트랙 알림을 개별 ON/OFF·위치 조정. 사이드 노트와 L&R 노트 색 변경. Season 14에 콤보/판정/레이트/피버 게이지 위치 이동 추가 — [시스템 문서](https://namu.wiki/w/DJMAX%20RESPECT/시스템), [나무위키 V](https://namu.wiki/w/DJMAX%20RESPECT%20V)
- 콤보 수치는 FEVER 게이지 위에 표시, 콤보가 이어지면 점수 상승. FEVER 배율 ×2~×5 (RESPECT 기준) — [ASCII.jp](https://weekly.ascii.jp/elem/000/004/003/4003145/)
- 판정: 라벨형(PERFECT/GREAT/GOOD)이 아닌 **MAX 100%~MAX 1% 세분 판정(11단계 표시) + BREAK**. MAX 100%는 사실상 PERFECT, MAX 90~10%는 타이밍 오차에 따라 단계, MAX 1%는 콤보 유지·게이지 감소 없음, BREAK는 미스/과도한 오차/롱노트 조기 해제로 콤보·피버 종료 및 게이지 감소. 롱노트는 시작·끝만 판정 — [시스템 문서](https://namu.wiki/w/DJMAX%20RESPECT/시스템), [ASCII.jp](https://weekly.ascii.jp/elem/000/004/003/4003145/)
- 판정 폭(V, 추정치): NORMAL 약 ±41.6ms, HARD 약 ±20.8ms, MAX는 더 좁음. 추정치로 표기, 커뮤니티 일부 이견 — [시스템 문서](https://namu.wiki/w/DJMAX%20RESPECT/시스템)
- **FAST/SLOW**: V Season 11에서 처음 "정확도 스케일(눈금) 설정"으로 추가(2023.11.23), 2주 뒤 FAST/SLOW 표시로 변경(2023.12.07). Steam 2020 스레드에서 팬이 IIDX식 FAST/SLOW를 요청했었음 — [패치노트](https://namu.wiki/w/DJMAX%20RESPECT%20V/패치노트)
- 점수: V 2.0 이후 RATE(정확도) × 10,000, 만점 1,000,000. 피버는 점수에 영향 없음, 콤보와 연출만 증가. 랭크 S 97~100%, A 90~96.99%, B 80~89.99%, C 이하(79.99%). 리와인드 -100,000점(약 10%p), 일시정지 후 재개 -10,000점 — [시스템 문서](https://namu.wiki/w/DJMAX%20RESPECT/시스템)
- 피버(V 2.0+): 별도 ON/OFF 설정, 일시정지/BREAK 시 종료, 고정 시간 없음. 피버 게이지는 MAX 60% 이상 판정에서 차등 충전. 구버전(RESPECT)은 자동/수동(X 키), ×2~×5, 단계당 약 13~14.5초 — [시스템 문서](https://namu.wiki/w/DJMAX%20RESPECT/시스템)
- 라이프(HP) 게이지: BREAK 시 게이지 감소, MAX 1%는 감소 없음. 롱노트 시작/끝 판정에서 "점수와 체력"이 오름. V에서 낮은 난이도는 HP 0이어도 게임오버되지 않도록 변경됨(Season 10, 2023.08.10). Steam 도전과제에 "HP 게이지 20% 미만으로 클리어"가 있어 게이지가 눈에 보이는 수치임을 시사. 최대 HP 증가·회복량 증가 기어(Max LP, Anti-Break, Shield 등)는 V에서 삭제 — [시스템 문서](https://namu.wiki/w/DJMAX%20RESPECT/시스템), [패치노트](https://namu.wiki/w/DJMAX%20RESPECT%20V/패치노트), [Wikipedia](https://en.wikipedia.org/wiki/DJMax_Respect), [Exophase 업적 목록(검색 요약 기반)](https://www.exophase.com/game/1753320-steam/achievements/)
- 최대 콤보/퍼펙트 플레이는 결과 화면뿐 아니라 플레이 중에도 특수 연출 — [시스템 문서](https://namu.wiki/w/DJMAX%20RESPECT/시스템)
- 키 빔(key beam): 길이 조정 가능(Season 14). 노트 이펙트·키 빔은 HUD 설정에서 ON/OFF — [나무위키 V](https://namu.wiki/w/DJMAX%20RESPECT%20V)
- 일시정지 후 재개 시 2초 지연 뒤 노트가 위에서 내려옴; 일시정지 시 노트 위치에 따라 MAX 80~90% 또는 70% 이하 판정 — [시스템 문서](https://namu.wiki/w/DJMAX%20RESPECT/시스템), [나무위키 V](https://namu.wiki/w/DJMAX%20RESPECT%20V)
- 배경 영상(BGA): DELETE로 토글, PageUp/PageDown으로 밝기 조절(RESPECT에서는 터치패드). 기본 밝기는 3/4→4/4(2020.01). PAUSE 화면에서도 BGA ON/OFF·밝기 조절(Season 9). BGA 종횡비 조정(Season 9), 일부 구 BGA는 16:9로 변경(2025.04, 2.7.1). 2.0에서 전체 BGA 밝기 단일 설정 — [시스템 문서](https://namu.wiki/w/DJMAX%20RESPECT/시스템), [게임 관련 정보](https://namu.wiki/w/DJMAX%20RESPECT/게임%20관련%20정보), [패치노트](https://namu.wiki/w/DJMAX%20RESPECT%20V/패치노트), [2.0 업데이트](https://namu.wiki/w/DJMAX%20RESPECT%20V/2.0%20업데이트)
- BGA는 풀콤보 달성 시 해당 뮤직비디오(MV)가 해금되는 보상 구조 — [ASCII.jp](https://weekly.ascii.jp/elem/000/004/003/4003145/)
- 색약 보정 설정 추가(Season 5, 2022.03) — [패치노트](https://namu.wiki/w/DJMAX%20RESPECT%20V/패치노트)
- 기어 외형이 평평하고 얇은 테두리 때문에 노트 낙하 거리가 길어 보이는 효과가 있다는 사용자 의견 — [Steam 토론(검색 요약 기반)](https://steamcommunity.com/app/960170/discussions/0/2945873244412761965)
- RESPECT 이후 일부 기어(Max LP, Anti-Break, Shield)와 피버 시 노트 속도 상승/잠금이 제거됨 — [Wikipedia](https://en.wikipedia.org/wiki/DJMax_Respect)
- 피버 팩 유료 DLC 설명: 피버 발동 시 메인 캐릭터 애니메이션이 기어 하단에 표시 — [Deku Deals 상품 설명(검색 요약 기반)](https://www.dekudeals.com/items/djmax-respect-v-exclusive-gear-pack)

### Inferences
- "퍼센트 판정 + BREAK 단 2종 분류(콤보 유지/끊김)" 구조는 MAX 100%~11단계를 UI에서는 숫자 그대로 보이게 하면 되므로 판정 라벨 디자인이 단순해진다. 직접 만든 게임에서는 라벨형(예: MAX/PERFECT/GREAT/GOOD/MISS)으로 축소하되, 콤보 유지/끊김 경계를 DJMAX처럼 두 구간으로 나누는 것을 고려할 수 있다.
- FAST/SLOW가 V에서 2023년에야 들어온 점, 이후 기어에 RATE와 함께 삽입 가능하게 한 점으로 보아 "기어 안쪽 보조 정보"로 두는 것이 정석이다.
- HUD 요소를 전부 개별 위치 이동/ON-OFF로 한 접근은 개발 비용이 크므로 1차 구현은 기본 위치 고정 + ON/OFF만으로 충분.

### Gaps
- 레인 폭/판정선 위치(px 또는 %), 사이드 트랙과 메인 4트랙의 정확한 비율, 바깥/안쪽 레인 노트 색: 확인 못함(미확인).
- 점수 숫자 크기/위치, 게이지 위치(라이프 게이지가 기어의 좌/우/하단 중 어디인지): 확인 못함. 피버 게이지가 콤보 아래라는 정도만 확인.
- 판정 텍스트 정확한 서식(예: "MAX 100%" 형태), 히트 이펙트의 구체적 모양: 확인 못함.
- BGA 딤/블러 처리 방식(자동 딤 vs 사용자 밝기만): 사용자가 밝기를 조절할 수 있다는 것만 확인.

---

## 3. 결과(Result) 화면

### Takeaway
결과 화면의 구체 레이아웃은 확인하지 못함. 표시 요소는 점수·랭크·레이트·최대 콤보·퍼펙트 플레이 여부, 신기록, 즐겨찾기/재시작 버튼 정도가 파편적으로 확인됨.

### Cited Findings
- 결과 화면은 점수, 랭크, 레이트를 보여주고 MAX COMBO/PERFECT PLAY 여부를 알림 — [시스템 문서](https://namu.wiki/w/DJMAX%20RESPECT/시스템)
- 결과 화면에 **재시작 버튼과 즐겨찾기 버튼** 추가(Season 6, 2022.06.23) — [패치노트](https://namu.wiki/w/DJMAX%20RESPECT%20V/패치노트)
- 래더 결과 화면에 애니메이션 연출이 있음(건너뛰는 버그 수정 기록) — [패치노트](https://namu.wiki/w/DJMAX%20RESPECT%20V/패치노트)
- 결과 화면 전용 BGM, 래더 결과 전용 BGM 별도 존재 — [게임 관련 정보](https://namu.wiki/w/DJMAX%20RESPECT/게임%20관련%20정보)
- Open Match 결과에는 TOP RATE / TOP SCORE / TOP COMBO 시상, 최대 점수·콤보·정확도 표시, SPACE로 상세 창 — [모드](https://namu.wiki/w/DJMAX%20RESPECT/모드), [패치노트](https://namu.wiki/w/DJMAX%20RESPECT%20V/패치노트)
- 패널티 반영 점수가 100점 이상이어야 개인 기록 저장; DJ POWER는 RATE 90.00% 이상일 때 적립 — [시스템 문서](https://namu.wiki/w/DJMAX%20RESPECT/시스템)
- DJ CLASS 등급(BEGINNER → TRAINEE → AMATEUR → ROOKIE → STREET DJ → MIDDLEMAN → PRO DJ → HIGH CLASS → PROFESSIONAL → TREND SETTER → HEADLINER → SHOWSTOPPER → BEAT MAESTRO → THE LORD OF DJMAX), 각 등급 IV~I 4단계, 전용 엠블럼 — [DJ CLASS](https://namu.wiki/w/DJ%20CLASS)
- 신기록 달성/미션 클리어 시 오류 팝업·크래시 불만이 많았음 — [문제점](https://namu.wiki/w/DJMAX%20RESPECT%20V/문제점)

### Inferences
- 결과 화면에서 바로 "재시작" + "즐겨찾기" 버튼을 제공한 것은 반복 연습 루프를 줄이는 UX로 복사 가치가 있다.
- 결과 화면은 랭크(S/A/B/C 4종)가 단순하고, 상위 구분은 DJ CLASS 같은 누적 레이팅 체계로 이동시킨 구조다.

### Gaps
- 판정 분포(MAX 100%, 90%… 개수 표), 타이밍 분포 그래프, 결과 화면 요소 배치와 애니메이션: 확인 못함(미확인).

---

## 4. 옵션/설정 화면

### Takeaway
핵심 옵션: 고정 배속(V는 ×1.0~×9.0, 0.1 단위), 페이더/카오스 이펙터, 판정/노트 표시 시간 오프셋, 오디오 버퍼/ASIO, BGA 밝기, 전 키 리바인드, HUD 개별 설정.

### Cited Findings
- 배속: V는 **×1.0~×9.0, 모든 곡 공통 고정 속도(BPM에 관계없이 같은 낙하 속도)**, 1/2 키(컨트롤러 LT/RT)로 0.1 단위 조절. 가변 BPM 곡은 BPM에 따라 속도 변화. RESPECT(PS4)는 ×0.5~×5.0, 0.25 단위. 2020년 8월 패치로 BPM 비례 방식에서 고정속도 방식 도입(GITADORA 방식) — [시스템 문서](https://namu.wiki/w/DJMAX%20RESPECT/시스템), [나무위키 V](https://namu.wiki/w/DJMAX%20RESPECT%20V)
- 시작 속도 권장: PS4 2.5, PC 3.5~4 — [게임 관련 정보](https://namu.wiki/w/DJMAX%20RESPECT/게임%20관련%20정보)
- 페이더(Fader): FADE IN/FADE IN 2, FADE OUT/FADE OUT 2, BLINK/BLINK 2, FOG, PIXEL/PIXEL 2, BLIND. 카오스(Chaos): CHAOS W, SLIDE UP, SLIDE DOWN, REVERSE, CHAOS X. 배치 변경(V 전용): RANDOM, HALF RANDOM, MAX RANDOM, MIRROR, MIRROR HALF RANDOM — [시스템 문서](https://namu.wiki/w/DJMAX%20RESPECT/시스템)
- 판정 타이밍 조정 옵션 추가(Season 3, 2021.08.19), 노트 표시 시간 조정(2020.01.16), 오디오 버퍼 크기(64~2048, Season 6), 마스터 볼륨, ASIO 상태 표시, 폴링 레이트, NVIDIA Reflex, 프레임 제한, 30FPS 옵션 삭제(Season 5) — [패치노트](https://namu.wiki/w/DJMAX%20RESPECT%20V/패치노트)
- 게임 중 **F10 메뉴**에서 프레임·입력 타이밍·오디오 버퍼 조정, 인벤토리(콤보/판정 디자인 변경)는 **F11**, 정렬 F4, 즐겨찾기 F9, 재시작 F5 — [게임 관련 정보](https://namu.wiki/w/DJMAX%20RESPECT/게임%20관련%20정보), [패치노트](https://namu.wiki/w/DJMAX%20RESPECT%20V/패치노트), [2.0 업데이트](https://namu.wiki/w/DJMAX%20RESPECT%20V/2.0%20업데이트)
- 건반음(키음) ON/OFF(Season 9), 배경음 ON/OFF(Season 4), 사이드 트랙 경고 ON/OFF(2.0) — [나무위키 V](https://namu.wiki/w/DJMAX%20RESPECT%20V), [패치노트](https://namu.wiki/w/DJMAX%20RESPECT%20V/패치노트)
- 연습 기능: 2.0에서 REWIND(구간 반복) 추가, 단 점수 페널티(-100,000) — [나무위키 V](https://namu.wiki/w/DJMAX%20RESPECT%20V), [시스템 문서](https://namu.wiki/w/DJMAX%20RESPECT/시스템)
- 장비(기어/노트/판정/콤보 디자인 등) 설정은 2020.08부터 계정 저장 — [패치노트](https://namu.wiki/w/DJMAX%20RESPECT%20V/패치노트)

### Inferences
- 낙하 속도를 BPM과 독립된 고정값으로 두는 설계는 4B 게임에서 "속도 UI = 단일 숫자" 한 개로 끝나 구현이 간단하다. (DJMAX는 가변 BPM 곡만 예외.)
- 페이더를 먼저 최소(FADE IN/OUT 정도)만 구현해도 DJMAX의 핵심 선택지를 커버한다. 카오스/PIXEL 등은 후순위.

### Gaps
- 옵션 화면의 카테고리 구조/레이아웃, 판정 오프셋 단위·범위 정확값, 레인 커버(lane cover) 존재 여부(페이더가 그 역할을 하는 것으로 보임): 미확인.

---

## 5. 시각 언어, DJMAX Technika/Online/Portable 참고

### Takeaway
시각 언어(색상 팔레트, 서체, 기울어진 패널 등)에 대한 신뢰할 만한 출처는 찾지 못했다. Technika 3의 색 방향성과 기타 시리즈의 단편 정보만 확인.

### Cited Findings
- DJMAX TECHNIKA 3의 전체 색조는 Technika 1의 **검정·파랑 기조로 회귀**, 모드 선택 및 인게임 인터페이스는 Technika 2의 무지개+흰색 대신 **검은 배경 위 밝은 단색** 강조. Technika 3 판정은 2보다 엄격(Rainbow MAX 어려움). 랭크 기준 S++ 295,000 … B 220,000 — [나무위키 DMT3](https://namu.moe/w/DJMAX%20TECHNIKA%203)
- Technika 3 선곡: 클럽 디스크 선택 화면/클럽 뮤직 선택 화면, 화면별 시스템 BGM — 같은 문서
- DJMAX Portable: Rookie DJing 4버튼 / Pro DJing 6버튼 / Master DJing 8버튼, 피버 없음 — [나무위키 Portable](https://namu.wiki/w/DJMAX%20Portable)
- RESPECT V의 배경 애니메이션은 1080p/60fps로 리마스터. 업적으로 UI 스킨, 프로필 액세서리 해금 — [Wikipedia](https://en.wikipedia.org/wiki/DJMax_Respect)
- UI 스킨은 대부분의 BGM을 바꾸나 게임오버·랜덤·미션 실패 음악은 그대로 — [게임 관련 정보](https://namu.wiki/w/DJMAX%20RESPECT/게임%20관련%20정보)
- RESPECT 리뷰: 프레젠테이션이 강하고 모던하며 가독성 좋다는 평 — [Wikipedia 및 검색 요약](https://en.wikipedia.org/wiki/DJMax_Respect) (원문 직접 열람 못함, 약한 근거)

### Inferences (개발자용 적용안, 모두 추정)
- 어두운 배경(검정/짙은 네이비) + 밝은 단색 강조 + 노트는 하늘색/흰색 계열로 두면 DJMAX 계열 톤에 가깝고, BGA 위에서도 대비를 확보하기 쉽다.
- BGA 가독성은 DJMAX 자체가 "기어 배경 투명도 0~100% 조절"과 "BGA 밝기 조절/끄기"를 사용자에게 맡기는 방식으로 해결한다 — 기본값은 기어 반투명 + BGA 밝기 4/4(초기 3/4에서 상향 사례).
- 1280x720 기준 4키 레인을 화면 중앙 또는 한쪽으로 옮길 수 있도록 기어 위치(좌/중/우) 옵션을 두는 것은 DJMAX 방식 그대로.

### Gaps
- 정확한 색상 값(HEX), 폰트명, 기울어진(skewed) 패널 사용 여부, 모션 디자인, 효과음 목록: 모두 미확인. DJMAX Online 쪽은 나무위키 페이지가 404로 열리지 않아 조사 못함.

---

## 개발자용 요약 (확인된 것 / 추정 구분)
확인된 구조:
1) 키 모드 TAB 전환 + 모드·곡별 4난이도(NM/HD/MX/SC); 2) F4 정렬/F9 즐겨찾기/알파벳·페이지 점프; 3) 판정은 MAX % + BREAK, 콤보 유지(MAX 1%)와 끊김(BREAK)의 2분류; 4) 고정 속도 + 페이더 이펙터; 5) HUD 요소별 ON/OFF·위치·FAST/SLOW; 6) 기어 위치/투명도, BGA 밝기 키보드 즉시 조절; 7) 결과 화면 재시작/즐겨찾기 버튼.
확인 못한 것(직접 설계 필요): 선곡 화면 시각 배치, 난이도 색, 레인 치수, 결과 화면 레이아웃, 팔레트/폰트.
