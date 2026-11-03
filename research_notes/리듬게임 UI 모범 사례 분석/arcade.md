# 아케이드 계보 리듬게임 UI/UX (IIDX / SDVX / pop'n music) — 4키 세로 스크롤 1280x720 적용용 노트

조사 범위: beatmania IIDX 30 RESIDENT / 31 EPOLIS (2023-10-18) / 32 Pinky Crush (2024-10-09), SOUND VOLTEX EXCEED GEAR (VIVID WAVE 전용 자료는 거의 못 찾음), pop'n music UniLab (2022-09-13). DANCERUSH/GITADORA는 이번 조사에서 다루지 않음.
주의: 공식 스크린샷의 픽셀 레이아웃(요소 좌표)은 텍스트 소스로 확인 불가. 위치/비율 관련 서술은 "Inferences"에 두었고, 소스로 확인된 것은 "Cited Findings"에만 둠. 소스 수집은 약 16회 호출로 제한됨.

## 1. Song select (곡 선택): 휠/리스트 구성, 난이도·레벨·BPM·장르·클리어 램프·랭크 표시, 정렬/필터, 프리뷰·자켓

### Takeaway
최근 아케이드 작품은 "폴더/카테고리 → 곡 리스트 → 난이도 선택"의 계층 구조에, 곡 옆 클리어 램프(색+점멸 패턴)와 난이도별 고정 색상을 결합해 한눈에 읽히게 한다. 신규 버전은 사용자 정의 필터(레벨/램프/DJ LEVEL/BPM 등)와 무비 썸네일, 추천 폴더로 "탐색 비용"을 줄이는 방향으로 진화했다. 휠 한 화면에 보이는 곡 수/정확한 레이아웃은 확인하지 못했다.

### Cited Findings
- IIDX 31 EPOLIS에 "오리지널 필터 기능" 신설: 키로 조건을 고르고 턴테이블로 값을 설정, 필터 3개(Platinum 회원 카드 시 5개, 필터 폴더 2개 추가). 조건 항목: 레벨, 클리어 램프, DJ LEVEL, 미스 카운트, 클리어 레이트, 총 노트 수, BPM. — [namu.moe IIDX 31](https://namu.moe/w/IIDX%2031)
- IIDX 31: "처음 오신 분들에게 추천" 폴더(타 BEMANI 곡 + 인기 랭킹곡, 기본 선택은 비기너 채보), OTHERS 폴더를 0-9로 분리하고 정렬을 일본어 읽기 기준으로 변경. — [namu.moe IIDX 31](https://namu.moe/w/IIDX%2031)
- IIDX 31: 모드 선택별 BGM 분리, 하단 Paseli/크레딧 텍스트 크기 축소(주 콘텐츠 방해 최소화). — [namu.moe IIDX 31](https://namu.moe/w/IIDX%2031)
- IIDX 32 Pinky Crush(2024-10-09 가동): 모드 선택 화면 대폭 쇄신, 선택 화면 전체 리뉴얼. 무비 썸네일로 곡을 탐색, 라이벌 스코어 창에 빈자리가 있으면 서브 라이벌 스코어도 표시, "카테고리 기능"(여러 폴더를 그룹화; 인기곡/버전/레벨/노트 레이더/디폴트 등), "내비게이트 기능"(모드 선택·곡 선택 화면에서 화면 보는 법·조작 설명 표시). — [Dengeki/Den Faminico 기사](https://news.denfaminicogamer.jp/news/241009t); 카테고리 항목 목록은 검색 요약 기반이라 약한 근거 — [Konami IIDX 32 공식](https://www.konami.com/arcadegames/products/am_bmiidx32/)
- IIDX 곡 목록 옆에 클리어 램프 표시. 램프 종류: NO PLAY(무점등), FAILED(깜빡임, 버전별 색: HEROIC VERSE 빨강 등), ASSIST CLEAR(밝은 보라), EASY CLEAR(밝은 초록), CLEARED(현행 밝은 파랑), HARD CLEAR(흰색), EX-HARD CLEAR(빨강/노랑 점멸), FULL COMBO(흰/파랑/주황 스트로브). — [RemyWiki What is beatmania IIDX](https://remywiki.com/What_is_beatmania_IIDX)
- IIDX 난이도: BEGINNER 1-3, NORMAL/HYPER/ANOTHER(1-12, ANOTHER는 3-12 범위). 과거 색 코딩: BEGINNER 초록, NORMAL 파랑, HYPER 노랑, ANOTHER 빨강. — [RemyWiki What is beatmania IIDX](https://remywiki.com/What_is_beatmania_IIDX)
- SDVX 난이도 색: NOVICE(청보라) / ADVANCED(노랑) / EXHAUST(빨강) / MAXIMUM(흑백) / EXCEED(XCD, 시안) / INFINITE(보라) / GRAVITY(갈주황) / HEAVENLY(파랑) / VIVID(핑크) / ULTIMATE(금+흑). 표기 약어 NOV/ADV/EXH/XCD/INF/GRV/HVN/VVD/MXM/ULT. — [RemyWiki SDVX Glossary](https://remywiki.com/SOUND_VOLTEX_Glossary), [RemyWiki EXCEED GEAR](https://remywiki.com/AC_SDVX_EG)
- SDVX EXCEED GEAR: 곡 선택 UI를 쇄신하여 SDVX BOOTH의 "세로 리스트" 스타일로 복귀. Valkyrie 기체는 하단 터치스크린으로 제목/아티스트 검색(가나 키보드). 기본 폴더는 e-amusement 패스 없는 플레이어에게 "비기너 추천". — [RemyWiki EXCEED GEAR](https://remywiki.com/AC_SDVX_EG), [voltexes 로케이션 테스트 요약](https://voltexes.com/sound-voltex-exceed-gear-location-test-summary/)
- SDVX 곡 선택에서 자켓 옆 클리어 메달 표시(e-amusement/Konasute 연동 시). — 검색 요약(약한 근거), [pixiv 백과 SOUND VOLTEX 등 검색결과](https://dic.pixiv.net/history/SOUND_VOLTEX/5364056/source) (미확인)
- pop'n music 난이도: EASY(3-9버튼, Sunny Park 도입) / NORMAL(9버튼, 초록 하이라이트, Lv 9-37) / HYPER(노랑, 약 10-30후반) / EX(빨강, 29-50). 클리어 마크: FULL COMBO는 은색 메달, PERFECT는 금색 별. — [RemyWiki PNM Glossary](https://remywiki.com/PNM_Glossary)
- SDVX 곡 선택 검색은 아티스트/작곡가도 검색되지만 공식 곡명 읽기가 특이해 검색이 어렵다는 보고. — [voltexes 로케이션 테스트](https://voltexes.com/sound-voltex-exceed-gear-location-test-summary/)

### Inferences
- 램프 설계 원칙: "색상 하나가 아니라 색+점멸/애니메이션"으로 클리어 단계를 구분(HARD=흰, EX-HARD=적황 점멸, FC=3색 스트로브)하여 어두운 배경·소형 아이콘에서도 구분되게 한다. 4키 게임은 6~7단계(NO PLAY / FAILED / CLEAR / HARD / FULL COMBO / PERFECT) 정도의 램프를 곡 행 좌측 6~12px 컬러바 또는 아이콘으로 두면 충분.
- 난이도 색은 "열 색상 순서(초록/파랑→노랑→빨강→흑/보라)"로 고정하고, 약어 3자 + 레벨 숫자를 같이 표기. 색 단독 의존을 피함(SDVX: 약어와 색 병행).
- 필터 UI는 "조건 슬롯 N개 + 값 조절" 구조. 1280x720에서는 좌측 폴더 트리/상단 필터 칩(레벨, 램프, 랭크, BPM 범위)으로 축약 가능.
- 신규 유저를 위한 "추천 폴더 기본값 + 내비게이트(조작 설명 오버레이)" 조합은 첫 화면 이탈 방지용 패턴.

### Gaps
- 휠에 동시에 몇 곡이 보이는지, 선택 항목 확대 방식, BPM/장르 위치, 프리뷰 오디오 지연/루프 처리, 자켓 크기 비율: 텍스트 소스에서 확인 불가(스크린샷 분석 필요).
- IIDX 30 RESIDENT 전용 UI 변경점은 이번에 확인하지 못함. SDVX VIVID WAVE 전용 선곡 UI는 확인 못함(검색에서 EXCEED GEAR만 나옴).
- pop'n music UniLab/jam&fizz의 선곡 화면 상세(캐릭터 팝업, 9버튼 레이아웃에서의 난이도 표시)는 확인 못함. Jam&Fizz Fandom 페이지는 402로 접근 실패.
- 일반 지식으로 알려진 사항(미검증, 이번 소스에서 확인 못함): IIDX는 곡 휠이 세로이며 선택 곡이 중앙/좌측에 고정되고 난이도(5종 SP)가 별도 열로 표시됨; BPM은 곡 정보 바에 숫자 표기(가변 BPM은 범위 표기). 사용 전 스크린샷으로 확인 권장.

## 2. Play HUD: 점수/콤보/판정/게이지/FAST·SLOW/그린넘버/SUDDEN+·LIFT/BPM/진행바/라이벌·타깃 그래프

### Takeaway
IIDX는 레인 위에 판정·콤보·FAST/SLOW를 겹쳐 띄우고, 게이지·스코어 그래프(라이벌/페이스메이커)는 레인 옆 별도 영역에 둔다. 속도 조절은 "그린 넘버(노트가 SUDDEN+ 커버 아래에서 나타나 판정선까지 보이는 시간)" 개념을 중심으로 하고, 레인 커버(SUDDEN+/HIDDEN+/LIFT)로 가시 영역을 사용자가 직접 정한다. SDVX는 하이스피드를 BPM과 무관하게 표시하고 BPM 변화 시 속도 값을 빨강/파랑으로 알린다.

### Cited Findings
- IIDX 판정: PERFECT GREAT(JUST GREAT) / GREAT / GOOD / BAD / POOR. 판정은 노트 위 실시간 표시, FAST/SLOW 표시 위치는 조절 가능(Judgment Timing Indicator Display). Judge Mode는 현재 스테이지의 판정 개수표(PGREAT~POOR, COMBO BREAK, FAST/SLOW 포함)를 작게 상시 표시. — [RemyWiki What is beatmania IIDX](https://remywiki.com/What_is_beatmania_IIDX)
- IIDX 그루브 게이지: 22% 시작, 클리어는 종료 시 80% 이상, 최저 2%. GREAT는 빠르게 상승, GOOD은 느리게, BAD는 약간 하락, POOR는 크게 하락. 표시는 숨김/바/퍼센트 선택 가능. HARD=빨강선, EX-HARD=노랑선, HAZARD=노란 게이지로 색 구분. — [RemyWiki What is beatmania IIDX](https://remywiki.com/What_is_beatmania_IIDX)
- IIDX 레인: 8컬럼(건반 7+스크래치), 판정선은 빨강. 레인 커버: SUDDEN+(상단 커버), HIDDEN+(하단), SUD+&HID+, LIFT(판정선을 위로 이동), LIFT&SUD+. START 누른 채 턴테이블로 커버 높이 조절. — [RemyWiki What is beatmania IIDX](https://remywiki.com/What_is_beatmania_IIDX)
- IIDX 하이스피드: 전통적으로 "HS2" 식 표기, 변천: tricoro x0.50-x4.00 (0.25 단위), Floating Hi-Speed 0.01 단위, Rootage는 BPM 무관 일정 스크롤 10단계, HEROIC VERSE에서 클래식 HI-SPEED 복귀 및 Rootage 설정 20단계로 확장. Window Hold 옵션: 하이스피드 팝업을 플레이 중 유지, 키/스크래치 입력으로 HI-SPEED·SUDDEN+ 조절. — [RemyWiki What is beatmania IIDX](https://remywiki.com/What_is_beatmania_IIDX), 후자 [RemyWiki IIDX General Info](https://remywiki.com/AC_General_Info)
- 그린 넘버/화이트 넘버: 화이트 넘버 = SUDDEN+ 커버 높이. 그린 넘버 = 노트가 커버 아래에서 나타난 뒤 사라질 때까지 보이는 시간(IIDX는 600fps 기준 프레임 수; beatoraja ms = IIDX 값 x 5/3, IIDX 300 = 500ms). 그린 넘버는 커버 높이, HI-SPEED, BPM에 의존하며, 화이트 넘버를 바꾸면 하이스피드가 자동 보정되어 그린 넘버가 일정하게 유지되는 방식(floating hi-speed에 해당). 대부분 플레이어는 IIDX 값 약 270-310(beatoraja 환산 약 450-517ms)으로 정착. IIDX 쪽 서술은 beatoraja 가이드를 통한 2차 출처. — [beatoraja English Guide: Scroll Speed and Green Number](https://github-wiki-see.page/m/wcko87/beatoraja-english-guide/wiki/Scroll-Speed-and-Green-Number)
- IIDX 스코어 그래프/페이스메이커: 옵션으로 No Display, 개인 베스트(초록 바), 전국/도도부현/단위 베스트·평균, 매장 베스트·평균, 라이벌(최대 5명; Name/Next/Best/Average/Rotate), 페이스메이커(AAA/AA/A/퍼센트/Next/Next+/Rotate), 이전 점수 Ghost. Ghost Score Display는 이전 최고 점수와의 차이를 표시하며 위치·색 변경 가능. — [RemyWiki What is beatmania IIDX](https://remywiki.com/What_is_beatmania_IIDX)
- IIDX 31: LIFT 커버를 SUDDEN+와 분리하여 별도로 설정 가능(HIDDEN+는 SUDDEN+와 커버 공유). 키빔 길이·노트 두께를 별도 설정으로 분리, 애니메이션되는 "프리미엄 레인 커버" 추가. 플레이 중 프리미엄 에리어(터치 패널)에서 플레이 커스터마이즈 변경 가능(LIGHTNING). 싱글 1P에서 그래프 영역을 끈 경우 프리미엄 프리 잔여시간 카운터를 BGA 위에 표시. — [namu.moe IIDX 31](https://namu.moe/w/IIDX%2031), [namu.moe EPOLIS](https://namu.moe/w/EPOLIS)
- SDVX EXCEED GEAR: Hi-SPEED는 100분의 1 단위(예 1.03)로 표시, BPM에 연동되지 않음. BPM 변화 곡에서는 새 Hi-SPEED 값이 빨강(빠름)/파랑(느림)으로 표시. 배경 불투명도 옵션 존재. EARLY/LATE 글씨 색 반전 가능. 타이밍 단위를 프레임에서 ms 기반으로 변경. VALKYRIE EFFECT(노트 빔·폭발·아날로그 체인 연출 강화, 플레이에 영향 없음, 끌 수 있음). — [RemyWiki EXCEED GEAR](https://remywiki.com/AC_SDVX_EG)
- SDVX 판정 연출 색: S-CRITICAL=흰, CRITICAL=노랑, NEAR=보라(Valkyrie 로케테스트 보고). S-CRITICAL 윈도 ±20.83ms, CRITICAL ±41.67ms. S-CRITICAL 사용 시 EX Score 표시, 점수 표시를 1000만점제 ↔ EX Score로 전환 가능, "EX Score-MAX Ratio"로 최대치와의 차를 수치/퍼센트 표시. — [voltexes 로케이션 테스트](https://voltexes.com/sound-voltex-exceed-gear-location-test-summary/), [RemyWiki EXCEED GEAR](https://remywiki.com/AC_SDVX_EG)
- SDVX 옵션: EARLY/LATE 표시 범위(CRITICAL 이하 / NEAR 이하 / OFF), ms 표시(ALL/CRITICAL 이하/NEAR 이하/OFF), 판정 표시 높이 위치, EARLY/LATE 색 반전(기본 EARLY 빨강, LATE 파랑; 반전 시 IIDX식 EARLY 파랑, LATE 빨강), Background Brightness(플레이 중 배경 밝기), 레이저 색(좌/우 별도). — [voltexes 플레이 옵션 가이드](https://voltexes.com/exceed-gear-play-options-guide/)
- SDVX 게이지: EFFECTIVE(0% 시작, 70% 클리어), EXCESSIVE(100% 시작, 0%에서 크래시; 30% 이하에서 게이지가 파랑으로 변하고 배경도 변화), ARS(EXCESSIVE로 시작해 0%에서 EFFECTIVE로 전환), PERMISSIVE(Skill Analyzer, CRITICAL만 회복), MAXXIVE(2025-04-22 추가, EXCESSIVE보다 감소 빠름, S-CRITICAL ON 전용). — [RemyWiki SDVX Glossary](https://remywiki.com/SOUND_VOLTEX_Glossary), [RemyWiki EXCEED GEAR](https://remywiki.com/AC_SDVX_EG)
- pop'n music: 판정 COOL/GREAT/GOOD/BAD (GREAT=COOL의 70%, GOOD=40%, BAD=0점). HI-SPEED는 pop'n 2부터 존재, 0.1 단위, 최대 10(ラピストリア 이후). GUIDE SE: FAST 히트(판정선 위)는 날카로운 소리, SLOW(아래)는 부드러운 소리, COOL은 제외 — 소리로 타이밍을 전달. — [RemyWiki PNM Glossary](https://remywiki.com/PNM_Glossary)
- pop'n music UniLab(2022-09-13): LIFT(판정선 위치 조절)와 GUIDE SE(탬버린 단일음에서 clap/rim 선택지 추가) 관련 보도가 있으나 검색 요약 수준 — [Game Watch](https://game.watch.impress.co.jp/docs/news/1439590.html) (본문 미열람, 미확인). 옵션 진입: 옵션 선택 중 숫자 키 "0"으로 Full Settings 화면 — 검색 요약(미확인).

### Inferences
- "그린 넘버" 개념을 4키 세로 게임에 이식: 사용자가 (a) 노트 가시 시간(ms) 또는 (b) 레인 커버 높이 중 하나만 바꿔도 다른 값이 자동 보정되도록 하고, 화면 한 곳에 "가시 시간 ms"와 "커버 %" 두 숫자를 항상 같이 표기. 720px 높이에서는 판정선까지 약 560-600px가 보통이므로 커버 0~50% 범위 정도가 현실적(제안값, 소스 아님).
- FAST/SLOW는 "판정선 근처 레인 중앙 위"에 작게(색 2종, 설정에서 반전 가능) 표시하고, 표시 범위(PERFECT 제외 / 전부)를 선택 가능하게 하는 SDVX 옵션 구조를 차용.
- 판정 색 팔레트를 단계별 고정(SDVX: 흰/노랑/보라, IIDX: 판정 개수표)하여 이펙트가 노트를 가리지 않도록 광량이 아니라 색·크기로 구분.
- 콤보·판정 텍스트가 노트를 가릴 수 있으므로 레인 상단/중앙 반투명 + 위치·투명도 옵션을 제공(Judgement Display Position 옵션 패턴).
- 스코어 그래프(라이벌/타깃)는 레인 밖 보조 열에 세로 바로 표시하는 IIDX 방식이 4키 1280x720(레인 폭 약 400-450px, 좌우 여백 확보)에 잘 맞음.

### Gaps
- 각 HUD 요소의 정확한 위치/크기/폰트, 진행 바(곡 진행도) 위치, BPM 표시 위치와 갱신 방식: 텍스트 소스에서 확인하지 못함.
- 이펙트가 노트를 가리지 않게 하는 구체 규칙(알파, 지속시간 등), 배경 영상 디밍 수치(IIDX는 BGA 밝기 옵션 이름/수치 확인 못함. SDVX는 Background Brightness 옵션 존재만 확인).
- 일반 지식(미검증): IIDX 레인 양쪽에 BGA, 게이지 화면 하단(1P 쪽), 콤보는 레인 중앙 상단, 스코어 숫자는 우하단/좌하단 영역. 스크린샷 확인 필요.
- SDVX VIVID WAVE의 HUD 변경점은 확인 못함.

## 3. Result screen: 클리어 램프, 등급(AAA~F, DJ LEVEL), EX score, 판정 내역·FAST/SLOW, 그래프, 정보 우선순위

### Takeaway
IIDX 등급은 최대 EX SCORE 대비 비율의 1/9 단위 구간(AAA=8/9 이상)으로 정해지고, 결과 화면은 EX SCORE/등급/클리어 램프와 판정별 개수(FAST/SLOW 분리)를 핵심으로 다룬다. 최근 작품은 결과 일러스트를 등급과 연동하고 공유 이미지에 누적 FAST/SLOW 막대 그래프를 추가했다. SDVX 결과는 상대적으로 미니멀하다는 보고가 있다.

### Cited Findings
- IIDX DJ LEVEL: 최대 EX SCORE 대비 비율에서 1/9 구간. F(<2/9), E(2/9), D(3/9), C(4/9), B(5/9), A(6/9), AA(7/9), AAA(8/9 이상). 100% 전용 등급은 없음. — [RemyWiki What is beatmania IIDX](https://remywiki.com/What_is_beatmania_IIDX), [RemyWiki EX Score](https://remywiki.com/EX_Score)
- IIDX EX SCORE: PGREAT 2점, GREAT 1점(completeMIX 기원: Just Great 2, Great 1). — [RemyWiki What is beatmania IIDX](https://remywiki.com/What_is_beatmania_IIDX), [RemyWiki EX Score](https://remywiki.com/EX_Score)
- IIDX 31 EPOLIS: 단위인정 결과 화면에 곡명 표시 및 MAX COMBO 제거. 결과 일러스트가 등급별로 달라지고(AAA/AA는 지정 캐릭터, A-C는 SD 캐릭터). 공유 이미지(e-amusement 앱)에 레벨·노트 수 및 누적 FAST/SLOW 막대 그래프(BISTROVER 도입)가 추가. — [namu.moe EPOLIS](https://namu.moe/w/EPOLIS), [namu.moe IIDX 31](https://namu.moe/w/IIDX%2031)
- IIDX 32: 筐体 서브모니터에서 "마이 액티비티"(당일 활동, 마이 뉴스, 오늘의 베스트 결과)를 확인. — [Den Faminico 기사](https://news.denfaminicogamer.jp/news/241009t)
- SDVX: 클리어 램프 PUC(전 CRITICAL, 1000만점) / UC(ERROR 0) / S-PUC(전 S-CRITICAL, 메달은 PUC). 스코어 상한 10,000,000. EX Score는 S-CRITICAL 사용 시에만 표시(S-CRITICAL 5, CRITICAL 4, NEAR 2, 아날로그/롱 체인 CRITICAL 2). — [RemyWiki SDVX Glossary](https://remywiki.com/SOUND_VOLTEX_Glossary), [RemyWiki EX Score](https://remywiki.com/EX_Score)
- SDVX EXCEED GEAR 로케이션 테스트: 결과 화면은 비교적 미니멀하며 S-CRITICAL과 EX score가 들어가는 위치가 보임(출시 전 인상). — [voltexes](https://voltexes.com/sound-voltex-exceed-gear-location-test-summary/)
- SDVX EXCEED GEAR: EFFECT RADAR(2022 추가, 6축: NOTES / PEAK / TSUMAMI / TRICKY / HAND-TRIP / ONE-HAND), PLAYER RADAR(2023), S-PUC 전용 스플래시(2023-02-09, Valkyrie 한정), 게임 종료 화면에서 네비게이터 캐릭터 제거. — [RemyWiki EXCEED GEAR](https://remywiki.com/AC_SDVX_EG)
- pop'n music: 결과 표시에 FULL COMBO(은 메달), PERFECT(금 별). 결과 문구 "NO BAD!"가 20 fantasia에서 "FULL COMBO"로 변경. "PERFECT!!"가 13부터 결과에 표시. — [RemyWiki PNM Glossary](https://remywiki.com/PNM_Glossary)
- SDVX 한국 위키 검색 요약: 간소화된 결과 화면에서 BT-D를 누르면 UI가 투명해져 일러스트를 크게 볼 수 있음, AAA 미달이어도 결과 일러스트 항상 표시(버전 미특정, 미확인). — [thewiki.kr 검색 요약](https://thewiki.kr/w/5볼)

### Inferences
- 우선순위: (1) 등급 문자 + 클리어 램프(가장 큰 크기), (2) 점수/EX 점수 및 개인 최고와의 차이, (3) 판정 개수표(색상은 HUD 판정색과 동일, FAST/SLOW 컬럼 분리), (4) 콤보/게이지 그래프·타이밍 분포. MAX COMBO를 단위 인정 결과에서 제거한 사례처럼, 맥락에 따라 지표를 줄일 수 있음.
- 타이밍 히스토그램(FAST/SLOW 누적 막대)은 IIDX 공유 이미지에서 이미 사용: 4키 게임에서는 결과 화면 하단에 ms 구간 히스토그램 + 평균 오프셋 숫자를 두면 오프셋 보정 UX와 연결됨.
- 등급 연출용 일러스트/애니메이션은 "정보 영역을 가리지 않는 투명화 토글"(SDVX 사례, 미확인) 패턴을 도입 가능.

### Gaps
- IIDX 결과 화면의 정확한 레이아웃(스코어 그래프, 판정 표, 타이밍 히스토그램 유무), DJ LEVEL 중간 구간 표시 방식(예: AAA+n 표기)과 클리어 램프 결과 표시 연출: 이번 소스에서 확인 못함.
- SDVX 클리어 메달(COMPLETE/EXCESSIVE COMPLETE/PLAYED)과 등급 임계값(AAA+/AAA/S 등)은 Glossary에 없어 미확인. VOLFORCE 계산식 미확인.
- IIDX 32 Pinky Crush 결과 화면 변경은 소스에 기재 없음.

## 4. Option menus: 하이스피드(그린 넘버), 오프셋 보정, 판정 타이밍 표시, 게이지 종류, 시각 옵션

### Takeaway
아케이드 계열은 "플레이 중에도 바꿀 수 있는 소수 옵션(속도/커버/오프셋)"과 "곡 시작 전 상세 옵션"을 분리하며, 최근엔 터치 서브 모니터와 조작 설명 UI 쇄신으로 접근성을 높였다. 오디오 오프셋과 비주얼 오프셋을 분리하고 ms 단위, 부호 규칙을 명시하는 것이 SDVX의 방식이다.

### Cited Findings
- SDVX EXCEED GEAR 옵션 진입: 곡 선택 중 하단 FX 버튼 2개 동시 입력, Valkyrie는 터치스크린. Lane Speed 권장: 초보 3.00-4.00, 숙련 7.00-8.20, START 누른 채 노브로 인게임 조절. Lane Preview: 스크롤 속도 팝업 + 버튼을 눌러 타이밍·판정 설정 테스트. — [voltexes 플레이 옵션 가이드](https://voltexes.com/exceed-gear-play-options-guide/)
- SDVX 오프셋: Judgement Timing (Sound)=오디오, (Graphics)=비주얼 오프셋을 분리. 이르게 판정되면 +, 늦으면 -. 인게임에서 START+9/3(사운드), START+8/2(그래픽) 단축키. 헤드폰 볼륨, 시스템 음성(RASIS) 토글, 랜덤/미러 옵션, Challenge Option(PREMIUM TIME, AAA/AAA+/S/UC/PUC 목표 도달 불가 시 즉시 실패). — [voltexes 플레이 옵션 가이드](https://voltexes.com/exceed-gear-play-options-guide/)
- SDVX 터치 서브 모니터: 옵션 설정과 곡 검색을 하나의 화면에서 처리, 판정·랜덤 등 대부분 옵션을 프런트 패널에서 변경 가능(로케테스트 보고). — [voltexes 로케이션 테스트](https://voltexes.com/sound-voltex-exceed-gear-location-test-summary/)
- IIDX 31 EPOLIS: 조작 설명 UI 리뉴얼(조작은 그대로, 설명을 명확히), "상세 옵션 화면"에서 클래식 하이스피드 설정 가능, H-RANDOM과 EXPAND-JUDGE 삭제, 영문 입력 ABC/QWERTY 선택. 프리미엄 에리어 어시스턴트(상단 바로가기 1탭으로 Play Analyze). — [namu.moe IIDX 31](https://namu.moe/w/IIDX%2031)
- IIDX 옵션: HI-SPEED 팝업은 START로 열고 tricoro부터 START 단독 입력으로 창 유지. Judge Mode(판정 개수 상시 표시), REGUL-SPEED(BPM 150 고정, 점수 무효), H-RANDOM/ALL-SCRATCH(점수 무효). — [RemyWiki IIDX General Info](https://remywiki.com/AC_General_Info)
- IIDX 게이지 종류: 일반 그루브(22%시작/80%클리어), ASSIST/EASY(램프에서 확인), HARD, EX-HARD, HAZARD; 램프 색으로 구분. — [RemyWiki What is beatmania IIDX](https://remywiki.com/What_is_beatmania_IIDX)
- 아날로그 오프셋/시각 설정 중 SDVX: Background Brightness, Laser Colour, VALKYRIE EFFECT on/off, 판정 표시 위치. — [voltexes 플레이 옵션 가이드](https://voltexes.com/exceed-gear-play-options-guide/)
- pop'n music: GUIDE SE는 FAST/SLOW를 소리로 알리는 옵션(COOL 제외). — [RemyWiki PNM Glossary](https://remywiki.com/PNM_Glossary)

### Inferences
- 최소 옵션 세트(권장): 속도(ms 가시시간 기준), 레인 커버(SUDDEN/LIFT 분리), 오디오 오프셋, 비주얼 오프셋(둘 다 ms 정수), 판정 타이밍 표시(범위/위치/색 반전), 게이지 종류(Normal/Hard/EX-Hard 후보), 배경 밝기, 이펙트 on/off, 스코어 그래프 대상.
- 오프셋 보정 화면은 SDVX Lane Preview처럼 "실제 노트가 흐르는 프리뷰 + 입력 시 즉시 FAST/SLOW ms 표시"로 구성하면 오프셋 맞추기와 속도 확인을 동시에 해결.
- 인게임 단축 조절(키 조합)과 곡 시작 전 상세 화면 이원화. 키보드 4키 게임이면 F-키/방향키 조합 매핑으로 대체.

### Gaps
- 오프셋 보정 전용 화면(별도 캘리브레이션 곡)의 구체 UI는 확인 못함. 아케이드는 SDVX/IIDX 모두 매장 설정(디스플레이 지연) 의존이 큼.
- IIDX 30/31/32의 BGA 밝기(Background brightness 대응) 옵션과 정확한 이름 확인 못함. pop'n music의 FAST/SLOW 텍스트 표시 옵션 여부 미확인.

## 5. 비주얼 언어와 가독성 원칙: 색 팔레트, 영상 배경 대비, 타이포그래피, 모션

### Takeaway
확인된 근거는 대부분 "색에 의미를 부여하고 옵션으로 사용자가 조정하게 한다"는 원칙이다: 판정/난이도/램프에 고정 색을 쓰고, EARLY/LATE 색 반전과 배경 밝기, 이펙트 on/off를 제공한다. 폰트·모션에 대한 구체 수치는 소스에서 확인하지 못했다.

### Cited Findings
- 색 의미 체계: IIDX 램프(파랑=CLEAR, 초록=EASY, 보라=ASSIST, 흰=HARD, 적황 점멸=EX-HARD, 3색 스트로브=FC), SDVX 판정 연출(흰/노랑/보라)과 EARLY(빨강)/LATE(파랑) 기본값 및 반전 옵션. — 위 1~4절 소스들 ([RemyWiki IIDX](https://remywiki.com/What_is_beatmania_IIDX), [voltexes 옵션](https://voltexes.com/exceed-gear-play-options-guide/), [voltexes 로케테스트](https://voltexes.com/sound-voltex-exceed-gear-location-test-summary/))
- SDVX는 배경 불투명도/밝기와 이펙트(VALKYRIE EFFECT)를 사용자 옵션으로 제어, 게이지 30% 이하에서 색과 배경이 변하는 상태 피드백. — [RemyWiki EXCEED GEAR](https://remywiki.com/AC_SDVX_EG), [RemyWiki SDVX Glossary](https://remywiki.com/SOUND_VOLTEX_Glossary)
- IIDX 31: 하단 크레딧 텍스트 축소, 키빔 길이·노트 두께를 옵션으로 분리(레인 가독성을 사용자 선호로 조정). — [namu.moe IIDX 31](https://namu.moe/w/IIDX%2031)
- 모션: SDVX 120Hz 모니터에서 노트가 약간 느리게 보였다는 테스터 보고(주관). — [voltexes 로케테스트](https://voltexes.com/sound-voltex-exceed-gear-location-test-summary/)

### Inferences
- 1280x720: 레인 영역 배경은 BGA 위에 어두운 반투명 패널(옵션으로 불투명도 0-100%), 판정선은 대비 높은 단색, 노트는 레인별 2색(흰/파랑 등)으로 구분(IIDX 건반 흰/파랑 패턴에서 차용).
- 정보 텍스트는 숫자 위주(고정폭 숫자 폰트)로, 판정/난이도는 색+3자 약어 병행(색각 이상 대응).
- 이펙트는 레인 외곽·판정선 아래에 한정하고 노트 영역에 가산 블렌드를 쓰지 않는 방향이 안전(제안, 소스 직접 근거 없음).

### Gaps
- 공식 UI 디자이너/개발자 인터뷰(GDC/CEDEC/Famitsu)는 이번 조사에서 찾지 못함. 폰트, 대비비, 모션 타이밍(ms), 영상 디밍 수치에 대한 1차 자료 없음.
- DANCERUSH, GITADORA는 시간상 조사하지 않음.
- 일부 소스(namu.moe, 검색 요약, 위키)는 2차 출처이며, 공식 스크린샷 검증은 하지 않음. IIDX 31/32 항목 중 Konami 공식 페이지에서 직접 확인한 것은 모드 선택·카테고리·썸네일·마이액티비티 정도.
