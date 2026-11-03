# PC / 커뮤니티 기반 수직 스크롤 리듬게임 UI/UX (osu!mania, osu!lazer, Quaver, Etterna/StepMania, Malody, DJMAX 팬 스킨)

조사 방법 메모: osu!ppy.sh 위키 일부는 접속 실패(Socket closed)로, ppy/osu-wiki 및 ppy/osu, Quaver/Quaver, skinship.xyz의 원문(raw GitHub)을 요약 도구로 읽었다. 소스코드 기본값은 "master/develop 브랜치 조회 시점(2026-10)"의 값이며, 버전별로 바뀔 수 있다. "(미검증)" 표시는 출처를 확인하지 못한 항목이다.

## 1. osu!mania HUD: 콤보/점수/정확도/hit error bar/판정 이미지/체력/stage light/key overlay/hit position, 필드 폭 vs 스크롤 속도, 레인 구분, 판정 티어·색

### Takeaway
stable(레거시) 스킨은 480px 높이 기준 좌표계의 skin.ini 값(HitPosition 402, ScorePosition 325, ComboPosition 111, LightPosition 413, ColumnWidth 30, ColumnLineWidth 2)으로 HUD를 배치하고, lazer(Argon)는 HUD 컴포넌트를 앵커 기반 레이아웃 에디터로 자유 배치한다(mania 기본: 콤보 상단 중앙 Y=200, hit error meter 좌우 중앙 양쪽). 판정은 PERFECT(320, 300g) / GREAT(300) / GOOD(200) / OK(100) / MEH(50) / MISS 6단계다.

### Cited Findings

**stable skin.ini 기본값 (좌표는 480p 가상 해상도 기준)**
- `[Mania]` 기본값: ColumnStart 136, ColumnRight 19, ColumnWidth 30, ColumnLineWidth 2, ColumnSpacing 0, HitPosition 402, LightPosition 413, BarlineHeight 1.2, StageSeparation 40, KeysUnderNotes 0, UpsideDown 0, SpecialStyle 0, ComboBurstStyle 1(Right), NoteBodyStyle 1 — [osu-wiki skin.ini (raw)](https://raw.githubusercontent.com/ppy/osu-wiki/master/wiki/Skinning/skin.ini/en.md)
- 색상 기본값: ColourColumnLine 255,255,255,255 / ColourBarline 255,255,255,255 / ColourJudgementLine 255,255,255 / ColourHold 255,191,51,255 / ColourBreak 255,0,0 / ColourLight# 55,255,255 / Colour#(컬럼 배경) 0,0,0,255 — [osu-wiki skin.ini (raw)](https://raw.githubusercontent.com/ppy/osu-wiki/master/wiki/Skinning/skin.ini/en.md)
- osu! 위키 skin.ini 문서는 ScorePosition/ComboPosition/JudgementLine에 기본값을 적지 않았고, skinship.xyz는 ScorePosition 325, ComboPosition 111, JudgementLine 1로 정리함 (위키와 skinship의 출처 차이 → ScorePosition/ComboPosition 수치는 skinship 기준) — [skinship.xyz ini](https://skinship.xyz/wiki/ini)
- HitPosition은 판정선이 그려지는 높이이며 StageHint, LightingN, LightingL이 이 높이에 그려짐. LightPosition은 StageLight에만 영향 — [osu-wiki skin.ini (raw)](https://raw.githubusercontent.com/ppy/osu-wiki/master/wiki/Skinning/skin.ini/en.md)
- ScorePosition(판정 hitburst 높이)과 ComboPosition(콤보 높이)은 스테이지 가로 중앙 기준으로 세로 중앙정렬 — [skinship.xyz ini](https://skinship.xyz/wiki/ini)
- 컬럼 폭은 쉼표로 컬럼별 지정 가능(ColumnWidth, ColumnLineWidth). ColumnSpacing은 컬럼 사이 투명 간격. 레인 라인 색은 ColourColumnLine — [skinship.xyz ini](https://skinship.xyz/wiki/ini), [osu-wiki skin.ini (raw)](https://raw.githubusercontent.com/ppy/osu-wiki/master/wiki/Skinning/skin.ini/en.md)
- 스크롤 방향(다운/업)은 별도 옵션 없이 skin.ini의 `UpsideDown`(기본 0)로 결정. 뒤집힐 때 키/노트 flip은 skin version 2.5 이상 필요 — [osu-wiki skin.ini (raw)](https://raw.githubusercontent.com/ppy/osu-wiki/master/wiki/Skinning/skin.ini/en.md)

**stable 스킨 요소 파일 (mania 스킨 위키)**
- 판정 이미지: `mania-hit0/50/100/200/300/300g` (애니메이션은 `mania-hitX-{n}`, 고정 60FPS, 중앙 origin, Normal 블렌드). 커스텀 경로를 쓰면 랭킹 화면은 루트 디렉터리의 파일을 사용 — [osu-wiki Skinning/osu!mania (raw)](https://raw.githubusercontent.com/ppy/osu-wiki/master/wiki/Skinning/osu!mania/en.md)
- 콤보 버스트: `comboburst-mania(.png | -{n}.png)`, BottomLeft origin, 옵션에서 끌 수 있음 — 동일 출처
- 키(하단 키 이미지): 평상시 `mania-key1/key2/keyS`, 눌림 `mania-key1D/key2D/keySD`, Bottom origin, 권장 50x107 (컬럼 폭에 맞춰 늘림) — 동일 출처
- 노트: `mania-note1/2/S`(단노트), `…H`(헤드), `…L`(롱노트 몸통, 누르는 동안 애니메이션), `…T`(테일; 없으면 헤드 사용). 테일은 skin 2.5+에서 기본 뒤집힘 — 동일 출처
- 스테이지: `mania-stage-left/right`(768px 상한, 스테이지 높이에 맞춰 늘림), `mania-stage-bottom`(480px 플레이필드 기준, 노트 위에 겹침), `mania-stage-light`(Multiplicative 블렌드, 노트 아래에 그려짐, 기본 흰색 틴트), `mania-stage-hint`(판정선은 이 이미지의 중앙), `mania-warningarrow` — 동일 출처
- 라이팅: `lightingL`(롱노트), `lightingN`(단노트/테일), Additive 블렌드, 판정선과 레인 중앙이 만나는 위치 — 동일 출처
- 기본 노트 색 배치(1=note1, 2=note2, S=noteS): 4K = 1 2 2 1, 5K = 1 2 S 2 1, 7K = 1 2 1 S 1 2 1, 9K = 1 2 1 2 S 2 1 2 1 (레인 위치에 따라 두 가지 노트 이미지 + 스페이스/중앙키용 특수 이미지) — 동일 출처

**판정 티어·명칭 (stable/현재 위키)**
- PERFECT 320 / 정확도 가중 100% / ±16ms 고정, GREAT 300 / 100% / 64−3×OD, GOOD 200 / 66.67% / 97−3×OD, OK 100 / 33.33% / 127−3×OD, MEH 50 / 16.67% / 151−3×OD, MISS 0 / 0% / 188−3×OD (표의 값은 윈도우 절반 폭, 전체는 2배). 아이콘 파일명은 `mania-hit300g`; 위키는 "MAX" 표기를 쓰지 않음 — [osu-wiki Judgement/osu!mania (raw)](https://raw.githubusercontent.com/ppy/osu-wiki/master/wiki/Gameplay/Judgement/osu!mania/en.md)
- 컨버트 맵은 별도 윈도우: PERFECT 16, GREAT 34(OD>4)/47, GOOD 67/77, OK 97, MEH 121, MISS 158 — 동일 출처
- lazer: PERFECT 윈도우가 OD에 따라 스케일(stable은 고정 ±16ms, Classic mod로 복원). 홀드노트 틱 제거(콤보는 시작/끝만) — [osu-wiki 업그레이드 문서 (raw)](https://raw.githubusercontent.com/ppy/osu-wiki/master/wiki/Help_centre/Upgrading_to_lazer/en.md)
- lazer `OsuColour.ForHitResult` 색: Miss=Red `#ed1121`, Meh=Yellow `#ffcc22`, Ok=Green `#88b300`, Good=GreenLight `#b3d944`, Great=Blue `#66ccff`, 그 외(Perfect 포함)=BlueLight `#99eeff` — [ppy/osu OsuColour.cs](https://raw.githubusercontent.com/ppy/osu/master/osu.Game/Graphics/OsuColour.cs)
- 같은 파일의 등급색: SS(X/XH) `#de31ae`, S `#02b5c3`, A `#88da20`, B `#e3b130`, C `#ff8e5d`, D `#ff5a5a`, F `#3f3f3f` — 동일 출처
- mania 등급 임계: SS 100%, S >95%, A >90%, B >80%, C >70%, D 그 외 (stable 위키 기준) — [osu-wiki Grade (raw)](https://raw.githubusercontent.com/ppy/osu-wiki/master/wiki/Gameplay/Grade/en.md). lazer는 SS가 "전 판정이 GREAT 이상"이어야 하며 S는 95% 이상으로 다른 등급과 차이 — [osu-wiki 업그레이드 문서 (raw)](https://raw.githubusercontent.com/ppy/osu-wiki/master/wiki/Help_centre/Upgrading_to_lazer/en.md)

**lazer(Argon) 기본 HUD 배치**
- 공용 메인 HUD: ArgonScoreCounter (origin TopRight, 위치 (250,50), 라벨 숨김), ArgonHealthDisplay (TopLeft, (50,20), 폭 300, 높이 30), ArgonAccuracyCounter (TopRight, (-20,20)), ArgonPerformancePointsCounter (정확도 아래, scale 0.8), ArgonSongProgress ((0,-10), scale (0.9,1)), ArgonKeyCounterDisplay (BottomRight, (-36,-66)) — [ppy/osu ArgonSkin.cs](https://raw.githubusercontent.com/ppy/osu/master/osu.Game/Skinning/ArgonSkin.cs)
- 모든 HUD 요소는 `UsesFixedAnchor = true`로 고정 앵커 사용, 인게임 레이아웃 에디터에서 이동 가능 — 동일 출처
- mania 전용(`ManiaArgonSkinTransformer`): 콤보 카운터 Anchor TopCentre / Origin Centre / Y=200 / 라벨 숨김, 리더보드 (36,115), 관전자 목록 BottomLeft (36,-66), hit error meter 2개(좌: CentreLeft, 우: scale -1,1로 미러) — [ppy/osu ManiaArgonSkinTransformer.cs](https://raw.githubusercontent.com/ppy/osu/master/osu.Game.Rulesets.Mania/Skinning/Argon/ManiaArgonSkinTransformer.cs)
- Argon mania: 컬럼 폭 60(특수 컬럼 ×2), 컬럼 간격 1, StagePadding 위/아래 30, 키 수별 컬럼 색 세트(예: 4K = yellow/orange/pink/purple), `ArgonProSkin`에서는 Great 이상 판정은 표시하지 않음(Drawable.Empty) — 동일 출처
- Argon 판정 조각: 28pt 텍스트, hit이면 `ForHitResult` 색의 링 폭발(Meh 3개 소링, Ok/Good 4개, Great/Perfect 소링 4+대링 4), 1.4배로 1800ms 확대 후 800ms 페이드, Miss는 1.6배 → 1배, 100px 아래로 떨어지며 40° 회전 — [ppy/osu ArgonJudgementPiece.cs](https://raw.githubusercontent.com/ppy/osu/master/osu.Game.Rulesets.Mania/Skinning/Argon/ArgonJudgementPiece.cs)
- lazer 일반 HUD: 레이아웃을 스킨 에디터에서 컴포넌트 단위로 편집 가능(stable은 불가). 구스킨은 gameplay만 부분 지원, 곡 선택/결과 화면에서 구스킨은 미지원 — [osu-wiki 업그레이드 문서 (raw)](https://raw.githubusercontent.com/ppy/osu-wiki/master/wiki/Help_centre/Upgrading_to_lazer/en.md)
- 커뮤니티 포럼 설명: lazer HUD는 기본적으로 화면 모서리/중앙에 앵커되고 플레이필드 기준이 아니라서 mania 플레이필드 바로 옆에 배치하기 어렵다는 의견 — [osu! forum 스킨 글 (검색 요약, 직접 열람 못함)](https://osu.ppy.sh/community/forums/posts/3345468)

**hit error bar (timing meter) — lazer BarHitErrorMeter**
- 설정: JudgementLineThickness 기본 4 (1~8), ColourBarVisibility 기본 true, ShowMovingAverage(화살표) 기본 true, CentreMarkerStyle 기본 Circle(None/Circle/Line), LabelStyle 기본 Icons(None/Icons/Text) — [ppy/osu BarHitErrorMeter.cs](https://raw.githubusercontent.com/ppy/osu/master/osu.Game/Screens/Play/HUD/HitErrorMeters/BarHitErrorMeter.cs)
- 판정 윈도우별 색 막대(가장 좁은 윈도우 기준 높이 정규화), bar_height 200 / bar_width 2 고정, 판정선 100ms 페이드인·5000ms 페이드아웃, 동시 최대 50개 — 동일 출처
- 이른(early) 쪽은 위, 늦은(late) 쪽은 아래; 라벨 아이콘은 토끼(early)/거북이(late), 텍스트 모드는 "Early"/"Late" — 동일 출처
- 화살표는 이동평균(`avg*0.9 + offset*0.1`)을 800ms OutQuint로 추적 — 동일 출처
- 인게임 옵션: stable은 "Score meter type"(Hit error / Colour / None, 기본 Hit error)과 "Score meter size"(기본 1x) — [osu-wiki Client/Options (raw)](https://raw.githubusercontent.com/ppy/osu-wiki/master/wiki/Client/Options/en.md)

**필드 폭 vs 스크롤 속도, 레인 구분 (커뮤니티 관례)**
- 스킨의 stage 전체 폭은 ColumnWidth × 키 수 + 라인 폭 + 간격으로 결정됨(숫자 제약 자체는 skin.ini 키에서 직접 확인). 스테이지 중앙정렬 오프셋이 키 수·화면비에 따라 달라 해상도별 동일 외형 구현이 어렵다는 포럼 토론이 있음(예: 6K 285, 7K 271, 8K 259 수치 제시, 화면비 의존) — [osu! forum (검색 요약)](https://osu.ppy.sh/community/forums/topics/218626)
- 레인 구분은 (a) ColumnLineWidth 선(기본 2px, 흰색), (b) 컬럼별 Colour# 배경, (c) ColumnSpacing 투명 간격, (d) 스테이지 좌우 이미지로 이루어짐 — [osu-wiki skin.ini (raw)](https://raw.githubusercontent.com/ppy/osu-wiki/master/wiki/Skinning/skin.ini/en.md), [skinship.xyz ini](https://skinship.xyz/wiki/ini)
- Zuma / Hydra 스킨의 구체적 레이아웃(컬럼 폭, hit position)은 출처를 확보하지 못함 — 아래 Gaps 참고.

### Inferences
- 기본 HitPosition 402는 480 기준 하단 약 84% 지점이므로, 노트가 판정선 아래로 약 78px(480p 기준)만 더 남는 "화면 하단 가까이 판정선" 구조임 (계산: 402/480).
- stable에서 ScorePosition 325(판정선 402보다 위)와 ComboPosition 111(화면 상단 쪽)은 "콤보는 화면 위쪽 노트 도착 전 영역, 판정은 판정선 위쪽 중간"에 두어 노트와 겹침을 줄이는 배치로 해석됨.
- lazer의 mania 콤보를 상단 중앙(Y=200)에 둔 것은 노트가 하단으로 떨어지는 구조에서 시야 위쪽을 쓰는 stable 관례(ComboPosition 111)의 계승으로 보임(추정).
- lazer는 hit error meter를 양옆(좌/우 중앙)에 미러로 배치해 레인 시야 이동 없이 주변시로 확인할 수 있게 했을 가능성이 있음(추정; 설계 의도 문서는 확보하지 못함).

### Gaps
- Zuma / Hydra 스킨의 실제 레이아웃 수치(컬럼 폭, hit position, 투명도)와 평가: 검색 결과에 해당 스킨 문서가 없었음.
- "표준 스킨 요소 배치"의 공식 이미지 예시(위키 스크린샷)는 텍스트로만 확인, 시각 자료 미확인.
- stable 레거시 판정 이미지의 색(300g/300/200/100/50/miss)은 위키에 색 명세가 없고 기본 스킨 이미지로만 제공됨 — 색 정의는 확인하지 못함 (사용자 기억상 300g는 무지개/흰색 계열, 300은 노랑, 200은 초록, 100은 파랑, 50은 회색, miss는 빨강이라는 통념이 있으나 이번 조사에서 근거 미확인 → "미검증").
- 필드 폭과 스크롤 속도의 정량적 관계(권장 폭/배율)에 대한 커뮤니티 컨센서스 수치는 찾지 못함.

---

## 2. 곡 선택 화면: 리스트 레이아웃, 난이도 캐러셀, 별점 표시, 필터/정렬/검색, 컬렉션, osu!lazer 디자인 원칙

### Takeaway
lazer는 곡 선택 화면을 "Song Select v2"(SelectV2)로 전면 재설계했고(2025.710.0에서 기본값), 정보 wedge · carousel · 공용 footer · 기울어진(sheared) 검색창을 하나의 시각 언어로 통일했다. Etterna Rebirth는 Lua로 다시 쓴 music wheel과 키보드 우선 UX를, Quaver는 맵셋 그룹/정렬 옵션과 배너를, Malody는 그리드 표시 모드를 제공한다.

### Cited Findings

**osu!lazer Song Select V2**
- 재설계는 Figma 디자인 기준이며 목표는 간격/가독성 개선("claustrophobic" 완화), beatmap 정보·carousel·footer·leaderboard를 공통 "sheared" 형태 스타일로 정리하는 것. 이슈 #22204(2023-01 개설)는 2025-05-09 "Song Select (v2)" #32736 중복으로 닫힘 — [ppy/osu #22204](https://github.com/ppy/osu/issues/22204)
- 구성: Wedge/Info(beatmap 정보·통계), Carousel v2, 공용 `ScreenFooter`(back/mod display/unranked indicator/options 버튼), 리더보드 점수 카드, sheared 검색 박스(일치 개수 표시) — 동일 출처
- 모드 설정은 footer에서 오버레이 패널로 이동, 시작 버튼 "Let's GO!"은 Figma 기반 — 동일 출처
- 커뮤니티 피드백: 회색/각진 도형 과다, 우측각·기존 UI 선호, stable식 썸네일·업로더 이름 요청, 선택되지 않은 카드에도 랭크 표시 요청, 우측 상단 맵 배경 박스가 풀스크린 배경과 중복이라는 지적 — 동일 출처
- 2025.710.0-lazer: SSv2 기본값화(#33970), 캐러셀 스크롤 GPU 오버헤드 수정, 그룹 확장/접힘 토글, 배경 blur 지원 복원(#33997), 초광폭 디스플레이용 캐러셀 크기 조정(#34013), 난이도 통계 문자열 분리, beatmap source 기준 그룹 추가, 그룹이 있을 때 위/아래 방향키로 난이도 전환, 우클릭 스크롤 팁 — [ppy/osu 2025.710.0-lazer 릴리스](https://github.com/ppy/osu/releases/tag/2025.710.0-lazer)
- lazer 기본 별점 표시 필터 범위: DisplayStarsMinimum 0.0, DisplayStarsMaximum 10.1; 변환(convert) 맵 표시 기본 true — [ppy/osu OsuConfigManager.cs](https://raw.githubusercontent.com/ppy/osu/master/osu.Game/Configuration/OsuConfigManager.cs)
- 별점(난이도) 색 스펙트럼: 0.1 `#aaaaaa`→1.25 `#4fc0ff`→2.0 `#4fffd5`→2.5 `#7cff4f`→3.3 `#f6f05c`→4.2 `#ff8068`→4.9 `#ff4e6f`→5.8 `#c645b8`→6.7 `#6563de`→7.7 `#18158e`→9.0 이상 검정(보간) — [ppy/osu OsuColour.cs](https://raw.githubusercontent.com/ppy/osu/master/osu.Game/Graphics/OsuColour.cs)
- mania 곡 선택 난이도 속성: Key Count(KC), Accuracy(OD; 판정별 ±ms 표시), HP Drain; 랭크드 플레이 카드에는 Hold Notes 비율(EndTimeObjectCount/TotalObjectCount) 추가 — [ppy/osu ManiaRuleset.cs](https://raw.githubusercontent.com/ppy/osu/master/osu.Game.Rulesets.Mania/ManiaRuleset.cs)
- lazer 곡 선택/결과에서는 구스킨 미지원("나중에 지원"), 난이도 숨김(Hiding difficulties) 기능과 soft deletion이 있음 — [osu-wiki 업그레이드 문서 (raw)](https://raw.githubusercontent.com/ppy/osu-wiki/master/wiki/Help_centre/Upgrading_to_lazer/en.md)
- 스킨 쪽(stable): `[Colours]` 기본 SongSelectActiveText 0,0,0 / SongSelectInactiveText 255,255,255 — [osu-wiki skin.ini (raw)](https://raw.githubusercontent.com/ppy/osu-wiki/master/wiki/Skinning/skin.ini/en.md)

**Etterna / StepMania**
- Etterna 0.71.0부터 Rebirth가 기본 테마. 거의 처음부터 재작성, 키보드 플레이어 중심(마우스로도 거의 모두 접근), 16:9 중심 설계로 타 화면비는 가벼운 테스트만 — [Etterna 0.71.0 Released](https://forums.etternaonline.com/t/etterna-0-71-0-released/3098)
- Rebirth Select Music: 탭 재배치(General에 구 Til Death MSD 탭 통합, Scores 2번째), Tags 필터(require/hide/any-all), music wheel Lua 재작성 + 새 정렬 모드와 팩 램프 규칙, 휠·배너 위치는 Theme Options에서 조정, 상단 헤더에 검색/필터/랜덤/팩 다운로드/도움말/설정 — 동일 출처
- Rebirth는 Settings를 하나의 통합 메뉴로 모으고(번호 카테고리, 마우스·키보드 지원), 색 설정 프리셋 저장/공유 가능; 멀티플레이어, 커스텀 judge window, 플로팅 차트 리더보드 등 일부 Til Death 기능은 의도적 누락 — 동일 출처
- Til Death 메트릭(480 높이 설계): 뮤직 휠 X = SCREEN_WIDTH − 350(4:3은 get43size), Y = 화면 중앙, 15개 항목, 항목 간격 38px, 전환 0.10초; 난이도 리스트는 6줄/20px 간격; 곡 제목 zoom 0.55, 부제 0.35 — [etternagame/etterna Til Death metrics.ini](https://raw.githubusercontent.com/etternagame/etterna/develop/Themes/Til%20Death/metrics.ini)
- 난이도 색(StepMania _fallback): Beginner `#ff32f8`, Easy `#2cff00`, Medium `#fee600`, Hard `#ff2f39`, Challenge `#1cd8ff`, Edit 회색 — [etterna _fallback 02 Colors.lua](https://raw.githubusercontent.com/etternagame/etterna/develop/Themes/_fallback/Scripts/02%20Colors.lua)

**Quaver**
- 곡 선택 설정 기본값: 정렬 SelectOrderMapsetsBy = Artist, 그룹 SelectGroupMapsetsBy = None, 게임모드 필터 기본 0(첫 모드), DisplaySongSelectBanners = true — [Quaver ConfigManager.cs](https://raw.githubusercontent.com/Quaver/Quaver/develop/Quaver.Shared/Config/ConfigManager.cs)
- 스킨 팁: Quaver는 직사각형 이미지를 잘 처리하지 못해 정사각형으로 패딩 권장(스팀 댓글 요약, 개별 사용자 의견) — [Steam Workshop 댓글](https://steamcommunity.com/sharedfiles/filedetails/comments/2538996817)

**Malody**
- Malody 4.0.5 릴리스 노트: 곡 선택 그리드 표시 모드, 리스트에 예상 난이도 표시, 키모드 UI 크기 개선 (검색 요약; 원문 직접 열람 못함) — [Malody 앱 정보 (apptopia)](https://apptopia.com/ios/app/989630809/about)
- Malody V는 모드별 차트 에디터·스킨 에디터·온라인 랭킹을 제공하고 인게임 스킨 에디터 내장 (스토어 설명) — [App Store Malody V](https://apps.apple.com/lb/app/malody-v/id1566873256)

### Inferences
- osu!lazer SSv2의 변화(공용 footer, 오버레이형 mod 패널, sheared 형태 통일)는 "정보 영역 / 목록 / 액션 영역"의 3분할과 시각 언어 통일이 핵심 방향임을 시사.
- 커뮤니티가 요구한 "미선택 카드에도 랭크 표시", "맵퍼·썸네일 표시"는 곡 목록에서 "플레이 이력 한눈에 파악 + 유사 맵셋 구별"이 중요한 요구임을 보여줌.
- Etterna Rebirth의 "Theme Options로 휠·배너 위치 조정" + 프리셋 공유는 PC 커뮤니티 게임에서 UI 배치 커스터마이징이 기본 기대임을 시사.

### Gaps
- SSv2의 정확한 시각 레이아웃(카드 높이, 난이도 칩 형태, 별점 표시 UI)은 텍스트로 확보하지 못함(스크린샷 설명 없음). `SelectV2/FilterControl.cs` 경로는 404여서 필터/정렬 항목 목록을 확인하지 못함.
- osu! 컬렉션(collections) UI와 검색 문법(`stars>5`, `keys=7` 등)의 공식 문서 확인 실패.
- Quaver 곡 선택 UI의 공식 레이아웃 문서와 Malody의 곡 선택 상세(필터/정렬) 미확보.
- DJMAX 팬 클론의 곡 선택 UI는 조사 불가(아래 5번 참고).

---

## 3. 결과 화면: 통계(hit error 분포 그래프, Unstable Rate), 등급, pp/랭킹, 정보 구성

### Takeaway
lazer 결과 화면은 좌측 점수 패널과 우측 "Statistics" 플로우 컨테이너로 구성되며, mania는 Performance Breakdown 차트와 Timing Distribution(150px 높이 히스토그램) + 평균 hit error / Unstable Rate 표를 보여준다. 일부 통계는 리플레이가 있어야만 표시된다.

### Cited Findings
- mania `CreateStatisticsForScore`: "Performance Breakdown"(전체 폭 차트), "Timing Distribution"(HitEventTimingDistributionGraph 150px + SimpleStatisticTable로 AverageHitError, UnstableRate) — [ppy/osu ManiaRuleset.cs](https://raw.githubusercontent.com/ppy/osu/master/osu.Game.Rulesets.Mania/ManiaRuleset.cs)
- StatisticsPanel: 좌측은 ScorePanel.EXPANDED_WIDTH + 패딩 여백, FillFlowContainer(FillDirection.Full)로 항목이 폭에 맞게 줄바꿈. 항목 순서: 룰셋 제공 통계 → "Overall Ranking"(로컬 사용자의 달성 점수일 때만) → "Beatmap tags"(온라인 ID가 있고 로그인 시) — [ppy/osu StatisticsPanel.cs](https://raw.githubusercontent.com/ppy/osu/master/osu.Game/Screens/Ranking/Statistics/StatisticsPanel.cs)
- hit event가 필요한 통계는 hit event가 없는 점수에서는 숨기고 "More statistics available after watching a replay!" 안내와 다운로드 버튼을 보여줌; 전부 해당하면 중앙 메시지만 표시 — 동일 출처
- 패널은 350ms 페이드인, 250ms 페이드아웃, 로딩 스피너 사용 — 동일 출처
- Unstable Rate = hit error의 표준편차(0.1ms 단위 표시). 일관성 지표이며 정확도와 다름(낮은 UR이어도 50 위주일 수 있음). 결과 화면 성능 그래프 hover로 평균 hit error·UR 표시, 방금 플레이/관전/리플레이 때만 표시. Double Time에서 classic 표시는 UR/1.5 변환이 필요하나 lazer 2023.1130.0부터 UR이 실시간 기준 — [osu! wiki Unstable rate (검색 요약)](https://osu.ppy.sh/wiki/no/Gameplay/Unstable_rate)
- 2025.710.0-lazer 결과 화면 관련: 타인 점수가 로컬 점수를 가리던 문제 수정, 일부 비랭크 상태 로컬 점수 표시, 실패(failed) 플레이는 pp 없음을 화면에 명시 — [ppy/osu 2025.710.0-lazer 릴리스](https://github.com/ppy/osu/releases/tag/2025.710.0-lazer)
- lazer 점수 표시 모드: Standardised(기본) / Classic 선택 — [OsuConfigManager.cs](https://raw.githubusercontent.com/ppy/osu/master/osu.Game/Configuration/OsuConfigManager.cs), [osu-wiki 업그레이드 문서 (raw)](https://raw.githubusercontent.com/ppy/osu-wiki/master/wiki/Help_centre/Upgrading_to_lazer/en.md)
- 결과/랭킹 판정 이미지는 커스텀 경로 사용 시 루트 디렉터리 파일 사용(stable 스킨) — [osu-wiki Skinning/osu!mania (raw)](https://raw.githubusercontent.com/ppy/osu-wiki/master/wiki/Skinning/osu!mania/en.md)

**Quaver**
- 결과 그래프 기본값 `ResultGraph = Deviance` (판정 편차 그래프). 판정 가중치(스팀 토론 인용 위키): Marv 100%, Perf 98.25%, Great 60%, Good 25%, Okay −100%, Miss −50% — [Quaver ConfigManager.cs](https://raw.githubusercontent.com/Quaver/Quaver/develop/Quaver.Shared/Config/ConfigManager.cs), [Steam 토론 (검색 요약)](https://steamcommunity.com/app/980610/discussions/0/4633595582102503580)

**Etterna**
- Rebirth Evaluation은 재작성: 오프셋 플롯에 하이라이트와 hover 정보(표준편차, 타임스탬프, 평균), 컬럼별 콤보 브레이크 상세, 점수에서 리플레이 로드. Til Death 평가 화면은 그래프 2종(점수 그래프 + 콤보 그래프, body 높이 80)을 왼쪽 상단에 배치 — [Etterna 0.71.0 Released](https://forums.etternaonline.com/t/etterna-0-71-0-released/3098), [Til Death metrics.ini](https://raw.githubusercontent.com/etternagame/etterna/develop/Themes/Til%20Death/metrics.ini)
- 오프라인 평가 스코어보드에 페이지네이션 추가(0.68.1) — [Etterna 0.68.1 Released](https://forums.etternaonline.com/t/etterna-0-68-1-released/1041)

### Inferences
- "리플레이가 있어야 상세 통계 표시"는 hit event(시간 오프셋)를 서버/저장 점수에 보존하지 않는 구조 때문으로 보이며, 결과 화면 UI가 "저장 데이터 범위"에 맞춰 단계적으로 표시되도록 설계된 것으로 해석됨.
- 결과 화면은 (요약 점수 패널) + (진단 그래프: 분포/오프셋 플롯) + (순위/태그 등 소셜 정보)의 3층 정보 구성이 osu!lazer, Etterna Rebirth 양쪽에서 공통됨.

### Gaps
- pp/랭킹 표시 UI(글로벌/국가 랭크, pp 증감)의 상세 배치는 문서로 확보하지 못함.
- Quaver 결과 화면의 전체 레이아웃과 Etterna Rebirth 결과 화면의 정밀 구성(스크린샷 없음)은 미확인.
- osu! 위키 Unstable rate 문서 원문은 직접 열람하지 못하고 검색 요약만 사용.

---

## 4. 설정: 스크롤 속도 프리셋 / BPM 기반 스크롤, 오프셋 보정, UI 스케일, 배경 dim/blur, 스토리보드·비디오 토글, hit error meter 표시 옵션

### Takeaway
기본값은 게임/버전별로 다르다: stable osu!은 background dim 80%, lazer 소스 기본은 dim 0.7, blur 0, 스토리보드·비디오 켜짐. mania 스크롤 속도는 lazer에서 기본 8.0(1~40), Quaver는 기본 150(50~1000)이며 Etterna 등은 speed mod 방식이다.

### Cited Findings

**osu! stable (공식 위키 옵션 문서)**
- Background dim 기본 80% (Gameplay > General), 비트맵별 설정 가능; "Don't change dim level during breaks" 기본 꺼짐 — [osu-wiki Client/Options (raw)](https://raw.githubusercontent.com/ppy/osu-wiki/master/wiki/Client/Options/en.md)
- Score meter type 기본 Hit error(옵션: None, Colour), size 기본 1x; "Scale osu!mania scroll speed with BPM" 기본 꺼짐; "Remember osu!mania scroll speed per-beatmap" 기본 꺼짐; "Always show key overlay" 기본 꺼짐; "Show leaderboard during gameplay" 기본 켜짐; Progress display 기본 Top-Right(Pie) — 동일 출처
- Background video 기본 켜짐(비트맵별 끄기 가능), Storyboards 기본 켜짐(비트맵별 끄기 가능), Universal offset 기본 0ms(오프셋 마법사 별도 버튼) — 동일 출처
- 위키 옵션 문서에는 blur, UI scale 항목이 없음 — 동일 출처

**osu!lazer (소스 기본값)**
- DimLevel 0.7(0~1), BlurLevel 0(0~1), LightenDuringBreaks true, ShowStoryboard true, PreferNoVideo false, HitLighting true, ScoreDisplayMode Standardised, UIScale 1.0(데스크톱 0.8~1.6, 모바일 0.8~1.1), HUDVisibilityMode Always, ShowHealthDisplayWhenCantFail true, KeyOverlay false, ComboColourNormalisationAmount 0.2, BeatmapSkins/BeatmapColours/BeatmapHitsounds true, 기본 스킨 Argon — [ppy/osu OsuConfigManager.cs](https://raw.githubusercontent.com/ppy/osu/master/osu.Game/Configuration/OsuConfigManager.cs)
- 주의: stable 80% vs lazer 0.7은 서로 다른 소스이며, BlurLevel 기본 0은 "조회 시점 master"의 값(과거 값과 다를 수 있음, 이력 미확인).
- mania 설정 기본값: Scroll speed 8.0 (1.0~40.0, 0.1 간격), Scroll direction Down, Timing-based note colouring false, Mobile layout Portrait, Touch overlay false. 사용자에게 보이는 scroll time은 `DrawableManiaRuleset.ComputeScrollTime`으로 계산(공식은 미열람) — [ppy/osu ManiaRulesetConfigManager.cs](https://raw.githubusercontent.com/ppy/osu/master/osu.Game.Rulesets.Mania/Configuration/ManiaRulesetConfigManager.cs)
- lazer는 극단적 스크롤 속도를 제한(SV gimmick 맵 영향), 설정 변경을 게임 플레이 중 즉시 반영, 최초 실행 마법사(Behaviour 화면에서 old 동작 적용 버튼), stable 설정 가져오기 미지원 — [osu-wiki 업그레이드 문서 (raw)](https://raw.githubusercontent.com/ppy/osu-wiki/master/wiki/Help_centre/Upgrading_to_lazer/en.md)
- mania mod "Constant Speed"가 존재(모드 목록) — [ppy/osu ManiaRuleset.cs](https://raw.githubusercontent.com/ppy/osu/master/osu.Game.Rulesets.Mania/ManiaRuleset.cs)
- lazer 곡 선택 v2에서 배경 blur 지원을 복원(2025.710.0) — [릴리스 노트](https://github.com/ppy/osu/releases/tag/2025.710.0-lazer)

**Quaver (ConfigManager 기본값)**
- ScrollSpeed4K/7K 기본 150(50~1000), ScrollDirection Down, PlayfieldScale 100(25~100), GameplayNoteScale 100(25~100), BackgroundBrightness 50(0~100), LaneCoverTop/Bottom 기본 false·높이 25(0~75), UIElementsOverLaneCover true, ReceptorsOverLaneCover false, GlobalAudioOffset 0(−500~500), VisualOffset 0(−500~500), NormaliseScrollVelocityByRatePercentage 0(0~100) — [Quaver ConfigManager.cs](https://raw.githubusercontent.com/Quaver/Quaver/develop/Quaver.Shared/Config/ConfigManager.cs)
- HUD 토글: DisplayGameplayOverlay true, DisplayJudgementCounter true, ScoreboardVisible true, DisplayTimingLines true, DisplayHitBubbles true, DisplaySongTimeProgress(+Numbers) true, DisplayComboAlerts true, DisplayFailWarning/PauseWarning/EpilepsyWarning true, DisplayNotificationsInGameplay false, TintHitLightingBasedOnJudgementColor false — 동일 출처
- Quaver 판정 색 기본(skin): Marv (255,255,200), Perf (255,255,0), Great (0,255,0), Good (0,168,255), Okay (255,0,255), Miss (255,0,0) — [Quaver SkinKeys.cs](https://raw.githubusercontent.com/Quaver/Quaver/develop/Quaver.Shared/Skinning/SkinKeys.cs)
- Quaver hit error bar 기본(skin): HitErrorAlpha 0.5, HitErrorWidthScale 1, Early 색 MainBlue, Late 색 Negative(빨강 계열), Neutral 흰색; config: ColorHitErrorByTiming true, HitErrorFadeTime 1000(100~5000), HitErrorEarlyLateWindow 10(0~100) — [SkinKeys.cs](https://raw.githubusercontent.com/Quaver/Quaver/develop/Quaver.Shared/Skinning/SkinKeys.cs), [ConfigManager.cs](https://raw.githubusercontent.com/Quaver/Quaver/develop/Quaver.Shared/Config/ConfigManager.cs)
- 기타 skin 키 기본: HitBubblesPosX −10, HitBubblesPosY 170, HitBubblesType FallDown, HitBubblesAlignment LeftStage, ComboDisplayBumpY −5 / BumpTime 370, JudgementHitBurstBumpY −5 / BumpTime 183, CoopPlayfieldPadding 92 — [SkinKeys.cs](https://raw.githubusercontent.com/Quaver/Quaver/develop/Quaver.Shared/Skinning/SkinKeys.cs)

**Etterna**
- Rebirth "Customize Gameplay": 요소를 드래그·리사이즈·undo, 기존 Til Death 레이아웃 import 가능; 설정은 통합 메뉴 — [Etterna 0.71.0 Released](https://forums.etternaonline.com/t/etterna-0-71-0-released/3098)
- Til Death 게임플레이 메트릭(480 높이): life meter X=178,Y=10, receptor Y=−164(일반)/164(reverse, 즉 스크롤 방향 반전), 마디선 alpha 0.2, 4th/8th/16th 박자선 alpha 0 — [Til Death metrics.ini](https://raw.githubusercontent.com/etternagame/etterna/develop/Themes/Til%20Death/metrics.ini)
- Etterna 판정 색 기본(StepMania _fallback 스크립트 기준; Til Death/Rebirth 자체 설정은 별도일 수 있음): W1 Marvelous `#bfeaff`, W2 Perfect `#fff568`, W3 Great `#a4ff00`, W4 Good `#34bfff`, W5 Bad `#e44dff`, Miss `#ff3c3c`, MaxCombo `#ffc600` (소스는 JudgmentLine_Wn 키; Marvelous~Bad 매핑은 도구의 추정) — [etterna _fallback 02 Colors.lua](https://raw.githubusercontent.com/etternagame/etterna/develop/Themes/_fallback/Scripts/02%20Colors.lua)

### Inferences
- osu! 계열에서 background dim 기본값을 높게(70~80%) 둔 것은 "배경 이미지가 노트 가독성을 해치지 않도록 하는 기본 방어선"으로 해석됨. 다만 "왜 플레이어가 dim/blur를 조정하는가"에 대한 직접 발언 근거(공식 문서/가이드)는 확보하지 못함.
- Quaver의 BackgroundBrightness 기본 50은 (밝기 기준) osu! dim 50%와 같은 방향의 값이나, 같은 의미로 직접 비교하는 것은 부정확함(단위 정의가 다를 수 있음, 추정).
- 스크롤 속도 단위가 게임마다 달라(lazer 1~40 배율, Quaver 50~1000, Etterna speed mod/xmod/cmod) 비교용 "표준 단위"는 존재하지 않음 — BPM 기반 스케일(osu! stable "Scale osu!mania scroll speed with BPM"; Quaver `NormaliseScrollVelocityByRatePercentage`는 "레이트 모드 보정" 용도로 보이나 정확한 의미는 소스 주석 미확인).

### Gaps
- BPM 기반 스크롤(osu! stable 옵션)의 구체적 수식, lazer의 `ComputeScrollTime` 공식, Etterna의 xmod/cmod/mmod 설명서는 확보하지 못함.
- 오프셋 보정 UI(오디오 오프셋 마법사/비주얼 오프셋)의 상세 흐름 및 Quaver/Etterna 보정 절차 문서는 확보하지 못함.
- UI scale: lazer 값만 확인. Quaver는 UI 스케일 설정이 소스에 없어 `PlayfieldScale`·`GameplayNoteScale`로 대체됨.
- osu! stable 기본 blur 값: 위키 옵션 문서에 항목 없음.
- Malody 설정(판정선 위치 등)은 공식 위키(m.mugzone.net/wiki/1778 스킨 문서로 보임)를 열람하지 못해 미확인.

---

## 5. 가독성 연구/커뮤니티 컨센서스: 대비, 박자 스냅 노트 색, 레인/컬럼 투명도, 타이밍 피드백, FPS/지연

### Takeaway
엄밀한 연구/표준은 찾지 못했고, 커뮤니티 관례는 (1) 박자(snap) 색 코딩(빨강=4분, 파랑=8분, 노랑=16분 등)의 선호, (2) 어두운 배경 + 낮은 스킨 대비 문제 인식, (3) hit error meter/UR 기반의 타이밍 자가진단이다. 대부분 일화적(anecdotal) 근거이므로 설계 단서로만 취급해야 한다.

### Cited Findings
- 박자 색 코딩: Tone Sphere 위키 예시는 4분=빨강, 8분=파랑, 16분=노랑, 32분=주황; fluXis 스킨 문서의 기본 snap 색은 1/3 = 코랄 레드, 1/4 = 중간 파랑, 더 가는 비표준 snap = 회색 (검색 요약, 직접 원문 열람 못함) — [Tone Sphere wiki 파일 페이지](https://tonesphere.fandom.com/wiki/File:Instruction_00.png), [fluXis skin.json docs](https://mintlify.wiki/InventiveRhythm/fluXis/skinning/skin-json)
- osu! 포럼에서 snap 색이 없으면 노트 간격 판별이 어렵다는 의견, snap 색에 의존하는 플레이어는 패턴 처리가 크게 어려워진다는 의견이 있음 (개별 사용자 의견; 검색 요약) — [osu! forum 1386853 외](https://osu.ppy.sh/community/forums/posts/1386853)
- 색각 이상 관련: 빨강/초록/노랑/주황 구분이 어렵다는 사용자 코멘트(itch.io, 다른 게임 사례), 레인 식별을 색에 의존하며 구분 쉬운 색을 선호한다는 osu! 사용자 코멘트 — [itch.io 코멘트](https://itch.io/post/550835), [osu! forum topic 592058](https://osu.ppy.sh/community/forums/topics/592058)
- StepMania 노트스킨: "flat"(전부 한 색)과 "quantized"(4분/8분/16분 등 음가별 색) 방식이 있으며 quantized는 한 이미지에 모든 색 프레임을 담음. 기본 스킨 128x128 프레임. 어떤 행이 어떤 음가인지는 문서에 없음 — [StepMania Noteskins wiki](https://github.com/stepmania/stepmania/wiki/Noteskins)
- Til Death 기본 마디선 alpha 0.2, 4/8/16분 박자선 alpha 0(숨김) — [Til Death metrics.ini](https://raw.githubusercontent.com/etternagame/etterna/develop/Themes/Til%20Death/metrics.ini)
- osu!lazer mania에는 "Timing-based note colouring" 옵션(기본 꺼짐)이 있음 — [ManiaRulesetConfigManager.cs](https://raw.githubusercontent.com/ppy/osu/master/osu.Game.Rulesets.Mania/Configuration/ManiaRulesetConfigManager.cs)
- osu! 위키의 skin readability 문서는 높은 배경 dim에서 어두운 색이 접근 서클 가독성을 해친다고 조언(osu!standard 대상 일반 스킨 가독성; 직접 원문 열람 못함, 검색 결과 요약) — [osu! wiki SRC](https://osu.ppy.sh/wiki/SRC)
- Quaver는 레인 커버(상/하 25% 기본 높이, 0~75), UI가 레인 커버 위에 표시되는 옵션, 플레이필드 스케일 25~100% 제공 — [Quaver ConfigManager.cs](https://raw.githubusercontent.com/Quaver/Quaver/develop/Quaver.Shared/Config/ConfigManager.cs)
- 타이밍 피드백: lazer BarHitErrorMeter는 윈도우별 색 막대, early/late 아이콘(토끼/거북이), 이동평균 화살표로 "일관된 편향" 시각화; Quaver는 early/late 색(파랑/빨강 계열) 및 알파 0.5 기본 — [BarHitErrorMeter.cs](https://raw.githubusercontent.com/ppy/osu/master/osu.Game/Screens/Play/HUD/HitErrorMeters/BarHitErrorMeter.cs), [SkinKeys.cs](https://raw.githubusercontent.com/Quaver/Quaver/develop/Quaver.Shared/Skinning/SkinKeys.cs)
- lazer 기본 mania hit error meter는 양쪽에 미러 배치된 두 개 — [ManiaArgonSkinTransformer.cs](https://raw.githubusercontent.com/ppy/osu/master/osu.Game.Rulesets.Mania/Skinning/Argon/ManiaArgonSkinTransformer.cs)

### Inferences
- osu!mania 계열 스킨은 레인 구분을 라인(2px 흰색), 컬럼 배경, 노트 색(note1/note2/noteS의 위치별 색)으로 이중·삼중 중복 인코딩하며, 이는 색각 이상에도 모양/위치 단서가 남도록 하는 방향으로 해석 가능(근거는 설계 관행, 명시적 접근성 가이드는 미확인).
- 박자 색은 "스냅 색 제공 + 끌 수 있음" 구조(lazer 옵션 기본 꺼짐, Etterna는 noteskin 선택)가 일반적이며, 색각 보조 모드의 필요성은 여러 커뮤니티 코멘트가 공통으로 시사.

### Gaps
- 동적 대비/레인 투명도의 "정답" 수치에 대한 커뮤니티 컨센서스 문서, 가독성 연구 논문은 찾지 못함.
- FPS/입력 지연(렌더 프레임레이트, 모니터 주사율, 오디오 레이턴시)에 대한 리듬게임 UI 관점의 공식/커뮤니티 가이드는 이번 조사에서 확보하지 못함.
- osu! 플레이어가 background dim을 100%에 가깝게 쓰는 이유를 직접 설명하는 1차 출처는 확보하지 못함(검색 결과에 해당 논의 없음).
- Clone Hero는 요청 범위상 선택 항목이라 조사하지 않음.

---

## 6. DJMAX 계열 팬 스킨/클론 및 기타 (Quaver·Etterna·Malody 커뮤니티 요소 보강)

### Takeaway
DJMAX풍 PC 팬 콘텐츠는 별도 클론보다 osu!mania 스킨 형태로 유통되는 것으로 보이며, 구체적 레이아웃 분석 출처는 확보하지 못했다.

### Cited Findings
- osu! 포럼에 "[Mania Skin] DJMAX Genesis (Beta 1) 4K~8K" 스레드가 존재 (제목·답글 통계만 검색 결과로 확인, 내용·스크린샷 미열람) — [osu! forum t/571663](https://osu.ppy.sh/forum/t/571663)
- Malody V는 인게임 스킨 에디터를 내장하고 모드별 에디터/랭킹 제공(스토어 설명) — [App Store Malody V](https://apps.apple.com/lb/app/malody-v/id1566873256)
- Quaver 스킨은 공식 스킨을 위키에서 받아 수정해 Skins 폴더에 넣는 방식, Steam Workshop 공유 지원 — [Steam 토론](https://steamcommunity.com/app/980610/discussions/0/4633595582102503580), [Steam Workshop 스킨 변경 로그](https://steamcommunity.com/sharedfiles/filedetails/changelog/2177910104)
- Quaver 기본 스킨 리소스 구조: `Quaver.Resources/Quaver.Resources/Textures/Skins/Arrow/Keys4/{HitObjects, Lighting, Receptors, Stage, LaneCover, Editor}` 하위에 note-hitobject-sheet, holdbody/holdend, mine, stage-bgmask, stage-hitposition-overlay, stage-left-border, lane cover(cover-top/bottom) 등 — [Quaver GitHub 트리 (API)](https://api.github.com/repos/Quaver/Quaver/git/trees/develop?recursive=1)
- Etterna 커뮤니티 테마 편집(Til Death 기반 에디트)이 활발하며 일부는 0.75.0 업데이트에 맞춰 갱신됨 — [검색 결과 요약(ifwas/unreadable-rain, reimuboobs theme 등)](https://github.com/ifwas/unreadable-rain)
- Etterna 0.68.1: Til Death의 일부 죽은 Eval 그래픽(P2 등) 제거 — [Etterna 0.68.1 Released](https://forums.etternaonline.com/t/etterna-0-68-1-released/1041)

### Inferences
- osu!mania 스킨 시스템은 키 수별(4K~) 개별 `[Mania]` 섹션, 컬럼 단위 폭/색 지정 덕분에 다른 게임(DJMAX 등)의 시각 양식을 재현하기 쉬운 구조임.

### Gaps
- DJMAX 팬 클론/스킨(DJMAX Genesis 등)의 실제 UI 분석, 스크린샷, 사용자 평가.
- Zuma, Hydra 스킨의 구체적 설계 문서/수치.
- Malody 스킨/UI 상세(공식 위키 미열람), Malody 곡 선택·결과 화면 구조.
- Clone Hero(선택 항목)는 미조사.
