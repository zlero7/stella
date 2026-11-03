# 리듬게임 UI 가독성·지각·UX 원칙 (세로 스크롤 4키, 1280x720 적용)

> 조사 한계 요약: 공개적으로 확인 가능한 1차 출처가 있는 수치는 (a) beatoraja/IIDX 그린넘버, (b) osu! 배경 dim 기본값, (c) WCAG 2.2 대비/플래시 기준, (d) Game Accessibility Guidelines(GAG)뿐이었다. 레인 폭·노트 높이 비율, 판정 표시 크기/지속시간, 콤보 위치, 게이지 방향, 곡선택/결과 화면 위계, 오프셋 보정 UX는 이번 검색에서 인용 가능한 1차 출처를 찾지 못했다(Gaps 참조). 아래 "Inferences"는 근거 있는 추론 또는 **의견**이며 증거가 아니다.

## 1. 시선·가독성: 시선 위치, HUD 안전영역, 레인/노트 비율, 노트 가시 시간(그린넘버)

### Takeaway
노트 가시 시간은 커뮤니티 표준으로 ms 단위(beatoraja)로 관리되며 대다수 플레이어가 약 450–517ms(IIDX 그린넘버 270–310)에 수렴한다. 시선 위치·레인 비율·모션블러에 대한 학술/1차 출처는 찾지 못했다.

### Cited Findings
- beatoraja 그린넘버는 "노트가 화면에 보이는 시간(ms)"이다. IIDX 그린넘버는 600fps 기준 프레임 수이며 변환식은 beatoraja = IIDX × 5/3 (예: 500ms = IIDX 300). — [beatoraja English guide: Scroll Speed and Green Number](https://github-wiki-see.page/m/wcko87/beatoraja-english-guide/wiki/Scroll-Speed-and-Green-Number)
- 대부분의 플레이어는 IIDX 그린넘버 약 270–310(= beatoraja 약 450–517ms)로 수렴한다. — [같은 문서](https://github-wiki-see.page/m/wcko87/beatoraja-english-guide/wiki/Scroll-Speed-and-Green-Number)
- 그린넘버는 SUDDEN+(레인 커버) 높이, HI-SPEED, 곡 BPM으로 결정되며, 레인 커버 높이를 바꾸면 beatoraja는 그린넘버가 일정하도록 HI-SPEED를 자동 조정한다. 커버 높이는 "화이트 넘버"로 표시된다. — [같은 문서](https://github-wiki-see.page/m/wcko87/beatoraja-english-guide/wiki/Scroll-Speed-and-Green-Number); [RemyWiki IIDX glossary(검색결과)](https://remywiki.com/IIDX_General_Info)
- IIDX 신버전은 하이스피드가 배율(x0.50–x4.00, 0.25 단위)이다. — 위 검색결과(RemyWiki 계열)
- osu!mania 스킨은 판정 위치를 skin.ini `HitPosition`으로, 노트 높이를 `WidthForNoteHeightScale`(레인 폭에 비례, 미지정 시 가장 좁은 컬럼 폭의 높이 비율 사용)로 정의한다 → 노트 높이를 레인 폭에 연동하는 것이 기존 관행. — [skinship.xyz skin.ini wiki](https://skinship.xyz/wiki/ini); [osu! forum 판정위치 정렬 팁](https://osu.ppy.sh/community/forums/posts/8726685)
- 콤보/스코어 위치는 skin.ini의 `ComboPosition`, `ScorePosition`으로 스킨에서 조정 가능 → 이 요소들이 "고정 정답이 없는, 조정 가능한 요소"로 취급됨. — [skinship.xyz](https://skinship.xyz/wiki/ini)
- 시각 지연 연구: 리듬 시청각 자극에서 주관적 동시성(PSS)은 자극 주파수와 어느 감각이 먼저 도착하는지에 의존하며, 이 영역은 연구가 거의 없다고 저자들이 언급. 또한 VR에서 리듬 상호작용은 동시성 창을 최대 59ms 넓힘(2025 프리프린트, 32명). — [Weimar Perceived Asynchrony](https://www.uni-weimar.de/fileadmin/user/fak/medien/professuren/Usability/publications/Perceived-Asynchrony-of-Rhythmic-Stimuli-Affects-Pupil-Diameter-and-Smooth-Pursuit-Eye-Movements.pdf); [Weimar VR preprint 2025](https://www.uni-weimar.de/fileadmin/user/fak/medien/professuren/Virtual_Reality/documents/publications/2025-Influence_of_Interaction_on_Synchrony_Perception_in_VR_preprint.pdf)
- 주변시야 훈련 게임(SuperVision, CHI 2019, 24명)은 플레이어가 화면 특정 지점에 고정하는 전략을 발달시킴을 보고(리듬게임 아님; 간접 참고). — [Lancaster 보도](https://www.lancaster.ac.uk/news/could-playing-computer-games-improve-your-peripheral-vision)

### Inferences
- (산술, 확정) 500ms 가시 시간 + 판정선까지 가시 레인 높이 H px이면 스크롤 속도 = H/0.5 px/s. 720p에서 판정선이 y≈620, 상단 y≈20이면 H≈600px → 1200px/s ≈ 1.67 screen-height/s. 450ms → 1333px/s, 517ms → 1160px/s. 기본값은 약 480ms(≈1250px/s) 근처, 옵션 범위는 약 250–900ms 정도 제안(**의견**: 범위 자체의 출처 없음).
- (의견) 가시 시간을 ms로 노출하고 BPM이 바뀌어도 일정하게 유지하는 "그린넘버 방식" 옵션을 기본 스크롤 설정으로 삼는 것이 커뮤니티 관행과 일치. 레인 커버 변경 시 속도 자동 보정 기능을 포함.
- (의견, 출처 없음) 플레이어 시선은 판정선 근처 하단 1/3에 고정되고 레인 상단은 주변시로 읽는다는 것이 업계 통설이지만, 이번 조사에서 실증 출처를 찾지 못함. 따라서 HUD를 레인 위에 겹치지 않고 좌우 측면에 두는 설계는 "판정선 주변 중심시야를 가리지 않는다"는 합리적 추론일 뿐 증거가 아님.
- (의견) 판정 텍스트·콤보처럼 매 노트마다 갱신되는 요소는 레인 중앙 상단부(판정선 위 약 15–25% 지점)에 두면 주변시로 읽을 수 있되 노트 경로와 충돌을 줄임.

### Gaps
- 리듬게임에서 플레이어 시선 위치(판정선 vs 레인 중앙)를 측정한 아이트래킹 논문: 찾지 못함.
- 권장 레인 폭 대 노트 높이 비율, 레인 폭 대 화면 폭 비율의 1차 출처: 찾지 못함(osu! 스킨 문서는 비율 연동만 확인).
- 모션블러/화려한 이펙트가 가독성에 미치는 영향의 실증 연구: 찾지 못함.
- IIDX 하이스피드×BPM→그린넘버 정확한 공식(1차 출처): 이번 페이지에서 공식 미확인.

## 2. 배경 처리: 영상 dim/blur, 노트 대비, 레인 백킹 패널

### Takeaway
osu!의 배경 dim 기본값은 80%(보관본 위키 기준)이며 커뮤니티는 100%를 권하는 경우가 많다. Arcaea는 배경 밝기 조절이 없어 밝은 배경에서 가독성 불만이 있다. 레인 패널 불투명도 수치의 1차 출처는 없다.

### Cited Findings
- osu! 옵션 위키(보관본)는 배경 dim 기본값을 80%로 기재하며, dim은 플레이 중 배경과 스토리보드에 적용되고 비트맵별 설정 가능. — [archived osu-wiki Options](https://git.srizan.dev/srizan/archived-osu-wiki/src/commit/0900a01fdebae531809652a42d43b0dfd8f71b3f/wiki/Client/Options/en.md) (보관 미러이므로 현재 기본값은 다를 수 있음)
- osu! 포럼 가이드는 dim 100%를 권하고, r/osugame 입문글도 많은 플레이어가 100%를 쓴다고 서술(= 배경을 숨겨 플레이 요소만 남김). — [osu! forum](https://osu.ppy.sh/forum/p/3960231); [r/osugame](https://lr.eu.psf.lt/r/osugame/comments/xr3shg)
- osu! 체코어 위키: 휴식 구간에서는 dim이 30% 줄어드는 동작이 있고 옵션으로 끌 수 있음. — [osu! wiki cs Visual settings](https://osu.ppy.sh/wiki/cs/Client/Interface/Visual_settings)
- Arcaea: 밝은 배경 차트에서 하늘 노트와의 대비가 낮아 읽기 어렵다는 레딧 스레드; 배경/레인 강도 조절 수단이 없고 wacca·maimai·osu!는 배경 불투명도를 조절 가능하다는 댓글. 우회로로 기기 색 반전 사용. — [r/arcaea thread](https://lr.us.psf.lt/r/arcaea/comments/1fkoc39/dark_background)
- Phigros의 dim 설정: 확인 가능한 출처 없음(검색 결과 없음).
- WCAG 2.2 비텍스트 대비: UI 컴포넌트/그래픽 오브젝트는 인접색 대비 최소 3:1. — [W3C Understanding 1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)
- GAG: "텍스트/UI와 배경 사이에 높은 대비 제공"(Basic), "대비 조절 옵션"(Intermediate), "배경 움직임 끄기/숨기기 옵션"(Intermediate). — [GAG full list](https://gameaccessibilityguidelines.com/full-list/); [배경 움직임 끄기](https://gameaccessibilityguidelines.com/provide-an-option-to-turn-off-hide-background-movement/)

### Inferences
- (근거 있는 추론) 노트를 "그래픽 오브젝트"로 보면 노트 본체-레인 패널 사이 최소 3:1이 하한이고, 배경 영상이 가장 밝을 때에도 이를 유지해야 함. 레인 백킹 패널(어두운 반투명)을 노트 뒤에 깔면 영상 밝기에 대한 대비를 보장할 수 있다.
- (의견) 레인 패널 알파 0.6–0.85 + 영상 dim 기본 60–80% + 사용자 슬라이더(0–100%), 영상 완전 끄기(GAG 배경 움직임 옵션 대응). 이 수치는 osu! 80% 기본값과 Arcaea 불만 사례에서 유추한 제안이며 직접 근거 없음.
- (의견) 노트에 밝은 외곽선(1–2px, 대비 높은 색) + 어두운 외측 그림자를 두어 어느 배경에서도 분리. 노트 채우기 색만으로 구분하지 않기.

### Gaps
- Phigros/Arcaea/IIDX의 정확한 dim 수치·레인 패널 불투명도: 1차 출처 없음.
- osu! 현행(2026) 공식 기본값 재검증: 현재 위키 영문 페이지 fetch 실패로 보관본만 확인.
- 영상 위에서 노트 가독성을 측정한 연구: 없음.

## 3. 색: 색약 안전 팔레트, 판정 색, FAST/SLOW, 글로우/외곽선, HUD 텍스트 대비

### Takeaway
색만으로 정보를 전달하지 말라는 것이 GAG/Xbox/WCAG 공통 원칙이다. HUD 텍스트는 WCAG 4.5:1(큰 텍스트 3:1)을 기준으로 삼을 수 있다. 판정 단계 수·색 조합의 게임 특화 출처는 찾지 못했다.

### Cited Findings
- GAG Basic: "필수 정보를 고정된 색 하나만으로 전달하지 말 것." — [GAG](https://gameaccessibilityguidelines.com/ensure-no-essential-information-is-conveyed-by-a-fixed-colour-alone/)
- Xbox Accessibility Guidelines: 색에만 의존하는 단서가 없도록 목표; 불가피하면 요소별 색 선택 허용. — [Xbox XAG 103](https://devdocs.xbox.com/gaming/accessibility/xbox-accessibility-guidelines/103)
- 색 + 소리/도형/애니메이션/텍스트/패턴을 병행하는 것이 일관된 권고. QA 가이드는 색 단독 정보를 버그로 취급하고 시뮬레이터로 팔레트 검증을 권함. — [Can I Play That](https://caniplaythat.com/?p=8897); [Bugnet QA](https://bugnet.io/blog/qa-testing-for-colorblind-modes)
- WCAG 2.2 1.4.3: 일반 텍스트 4.5:1, 큰 텍스트(18pt≈24px 이상, 또는 14pt 굵게≈18.5px 이상) 3:1. — [W3C Understanding 1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
- WCAG 2.2 1.4.11: UI/그래픽 3:1. — [W3C 1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)
- GAG 텍스트 크기: Amazon TV 10-foot-UI는 1080p에서 최소 28px; "목표가 아닌 최소치"로 취급하며 크기 조절 옵션을 이상으로 제시. — [GAG 기본 폰트](https://gameaccessibilityguidelines.com/use-an-easily-readable-default-font-size/); [폰트 크기 조절](https://gameaccessibilityguidelines.com/allow-the-font-size-to-be-adjusted/)
- IIDX는 FAST/SLOW를 노트별 표시로 제공(DJMAX RESPECT V 토론이 이를 서술). — [Steam 토론](https://steamcommunity.com/app/960170/discussions/0/1737761716221059811/?l=koreana) (비공식)

### Inferences
- (산술) 28px@1080p는 720p에서 약 18.7px에 해당 → 1280x720 HUD 본문 텍스트 최소 약 19px, 정보 텍스트는 20–24px 권장(WCAG 큰 텍스트 기준 24px과도 근접). 단, 근거 기준은 TV 10-foot UI이므로 PC 모니터 근거리에서는 더 작아도 되지만 안전하게 하한으로 사용.
- (의견) 판정 단계는 이름+색+모양/글자 3중 인코딩. 색은 최대 5–6색으로 제한하고 명도 차이를 크게 둠(색상만이 아니라). FAST/SLOW는 색 쌍(예: 청/주황 계열 — 적-녹 회피) + "FAST/SLOW" 텍스트 또는 ◀▶ 기호를 함께 표기. 이 팔레트 선택은 일반 색약 원칙에서 유추한 의견이며 게임 특화 출처 없음.
- (의견) 노트 색 구분: 4키에서는 레인 위치로 이미 구분되므로 키별 색을 쓰더라도 외곽선/형태 차이(중앙 두 키 vs 외곽 두 키)를 병행.

### Gaps
- 색약 안전 판정 팔레트(구체 hex)와 판정 단계 수의 게임 업계 근거: 찾지 못함. Okabe-Ito 등 표준 팔레트는 이번에 검증하지 않음.
- FAST/SLOW 색 관습의 1차 출처: 없음(IIDX 비공식 언급만).

## 4. 피드백: 판정 표시, 콤보, FAST/SLOW·히트에러바, 게이지, 섬광/흔들림 주의

### Takeaway
광과민성 안전 기준은 1초당 3회 초과 플래시 금지(일반/적색 임계 미만이면 예외), 면적은 약 25% 시야 기준이 가장 명확한 정량 근거다. 판정 크기·지속시간·게이지 방향에 대한 근거는 찾지 못했다.

### Cited Findings
- WCAG 2.2 2.3.1: 임의의 1초 안에 일반 플래시 3회 이하, 적색 플래시 3회 이하(만족 시 자동 통과). 일반 플래시 = 상대휘도 10% 이상 상승-하강 쌍이며 어두운 쪽 상태가 0.80 미만. 적색 플래시 = 포화 적색(R/(R+G+B) ≥ 0.8)을 포함하는 반대 방향 전환 쌍. — [W3C Understanding 2.3.1](https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html)
- 면적 기준: 10도 시야 내 0.006 sr(= 해당 시야의 25%); 1024x768 기준 341x256 px 블록(약 87,296 CSS px). 15–17인치 화면, 22–26인치 거리 가정. 더 가까이 앉거나 확대하면 통과한 면적도 위험할 수 있고, 전체 화면 재생 시 전체 화면 크기로 평가해야 함. SDR에서 어두운 상태가 160 cd/m² 미만일 때 일반 플래시 = 20 cd/m² 이상 변화. — [W3C 2.3.1](https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html)
- GAG 기준: 3회/초 초과로 화면 25% 이상 덮는 플래시 금지, 5초 초과 지속 플래시 시퀀스 금지; 움직이는 반복 패턴 25% 이상, 정적 반복 패턴 40% 이상 회피; 반복 패턴 = 정적 8개/이동 5개 이상 고대비 줄무늬. 피할 수 없으면 경고 + 끄는 옵션, "epilepsy safe"라는 표현 금지(옵션은 "screen flash effects"처럼 기능명으로 명명). Harding 테스트는 유료 서비스로 게임 영상 검사 가능하나 안전 보장은 아님. — [GAG flickering](https://gameaccessibilityguidelines.com/avoid-flickering-images-and-repetitive-patterns/)
- GAG: "갑작스러운 예기치 못한 움직임/이벤트 회피"(Advanced). — [GAG](https://gameaccessibilityguidelines.com/avoid-any-sudden-unexpected-movement-or-events/)
- GAG: 정밀 타이밍을 필수로 하지 말고 대안 제공(Advanced), 게임 속도 조절 옵션(Basic). — [GAG full list](https://gameaccessibilityguidelines.com/full-list/)
- Harding FPA는 PEAT 후속이며 일부 출처는 PEAT가 중단되었다고 하고 다른 출처는 여전히 권장 — 출처 간 상충. — [UAMS 가이드](https://communications.uams.edu/web/kb/utesting-videos-and-animations-for-photosensitive-seizure-risks/) 대 [Daisy KB](https://kb.daisy.org/publishing/docs/wcag/three-flashes-or-below-threshold.html)

### Inferences
- (산술/추론) 풀콤보 이펙트, 판정 플래시, 배경 영상 컷은 모두 "플래시" 후보. 4키가 고BPM에서 연타될 때 판정 플래시를 레인별 동시 점멸시키면 3Hz를 초과하기 쉬움 → 레인 히트 이펙트는 면적을 작게(레인 폭 이하), 휘도 변화 폭을 줄이고(상대휘도 10% 미만 변화 또는 0.8 이상 밝은 상태 회피), 이펙트 강도 옵션에서 플래시를 끌 수 있어야 함. 1280x720 기준 341x256 px 블록의 비율(약 88,000px²)은 1280x720 약 92만 px²의 약 9.5%이므로, 1024x768 환산을 그대로 쓰기보다 GAG의 25% 기준과 WCAG 환산 중 더 보수적인 값을 사용(**의견**).
- (의견) 화면 흔들림은 기본 비활성 또는 약하게, "이펙트 강도/흔들림" 옵션 제공. 레인 자체를 흔들면 노트 가독성이 떨어지므로 HUD 요소·배경에만 적용.
- (의견, 출처 없음) 판정 텍스트는 판정선에서 약간 위, 레인 중앙 정렬, 0.3–0.5초 표시, 연속 판정 시 이전 표시를 즉시 대체(누적 금지); 콤보는 판정 텍스트 위/아래 레인 중앙 또는 측면. 게이지는 세로 막대를 레인 옆에 두면 위치 고정이 쉽고 위험 구간(예: 30% 이하) 색+깜박임 대신 색/윤곽 변화로 경고(깜박임은 3Hz 규칙 준수). 모두 출처 없는 설계 의견.

### Gaps
- 판정 표시 크기/지속시간(ms), 콤보 크기/위치, 히트에러바 표준 크기/표시 방식, 게이지 방향 효과에 대한 인용 가능한 출처: 찾지 못함(Etterna·osu!·Wife3 관련 검색 결과도 무관 문서만 반환).
- 게임 UI의 Harding 테스트 공개 가격/현재 가용성: 확인하지 않음.

## 5. 화면: 곡 선택, 결과, 설정(라이브 프리뷰), 오프셋 보정

### Takeaway
이 영역은 이번 조사에서 인용 가능한 1차 출처를 거의 찾지 못했다. 보정 흐름에 대해서는 개발자 블로그가 "플레이어별 오디오·비주얼 오프셋 보정이 중요하다"는 점만 확인된다.

### Cited Findings
- 리듬게임에서 몇 ms 지연이 퍼펙트와 미스를 가를 수 있으므로 플레이어별 오디오/비주얼 오프셋 보정이 필요하다는 개발자 글(비검증, 비동료심사). — [Bugnet 리듬게임 타이밍 이슈](https://bugnet.io/blog/bug-reporting-for-rhythm-games-with-timing-issues)
- Rhythm Quest 개발기에는 지연 보정 구현 사례가 있음(세부 내용 미확인). — [Rhythm Quest devlog 10](https://ddrkirbyisq.medium.com/rhythm-quest-devlog-10-latency-calibration-fb6f1a56395c)
- GAG: "인터페이스 크기 조절 허용"(Intermediate), "폰트 크기 조절"(Advanced). — [GAG full list](https://gameaccessibilityguidelines.com/full-list/)
- GAG: 난이도 폭넓은 선택, 플레이 중 난이도 변경 가능(Basic/Intermediate). — [GAG full list](https://gameaccessibilityguidelines.com/full-list/)

### Inferences
- (의견) 곡 선택: 좌측 목록 + 우측 상세(앨범아트, BPM, 노트 수, 난이도 4–5단 색+이름+숫자 병기, 내 최고 기록). 난이도는 색만 쓰지 말고 라벨/숫자 병기(GAG 색 단독 금지 원칙 적용). 정렬/필터는 제목·BPM·레벨·클리어 상태 정도를 최소 구성으로 추천.
- (의견) 설정은 스크롤 속도 변경 시 프리뷰 레인에서 즉시 노트 흐름을 보이고 현재 가시시간(ms)을 같이 표기. 오프셋 보정은 메트로놈 비프 + 박자에 맞춰 누르기(평균 오차 자동 산출) + 수동 ± 미세조정 + 시각 오프셋과 오디오 오프셋 분리.
- (의견) 결과 화면 위계: 1) 등급/점수, 2) 판정 분포, 3) 최대 콤보, 4) FAST/SLOW 합계·히트에러 분포, 5) 곡 정보/재도전.

### Gaps
- 곡 선택/결과 화면 위계, 난이도 색 관습, 필터 패턴: 게임 UI 모범사례 1차 출처(GDC 등) 못 찾음.
- 보정 UX의 비교 연구: 없음.

## 6. 접근성·기본 옵션

### Takeaway
GAG가 리듬게임 옵션 대부분을 직접 뒷받침한다: 키 리매핑, 속도 조절, 폰트/UI 크기, 대비, 배경 움직임 끄기, 플래시 경고.

### Cited Findings
- 키 리매핑 허용(Basic, Motor). — [GAG](https://gameaccessibilityguidelines.com/allow-controls-to-be-remapped-reconfigured/)
- 게임 속도 조절 옵션(Basic). — [GAG](https://gameaccessibilityguidelines.com/include-an-option-to-adjust-the-game-speed/)
- 폰트 크기 조절(Advanced), 인터페이스 크기 조절(Intermediate), 대비 조절(Intermediate), 텍스트 색 선택(Intermediate). — [GAG full list](https://gameaccessibilityguidelines.com/full-list/)
- 배경 움직임 끄기/숨기기 옵션(Intermediate). — [GAG](https://gameaccessibilityguidelines.com/provide-an-option-to-turn-off-hide-background-movement/)
- 소리 단독으로 필수 정보를 전달하지 말 것(Basic, Hearing) → 리듬게임에서 타이밍 정보는 시각 병행 필요. — [GAG](https://gameaccessibilityguidelines.com/ensure-no-essential-information-is-conveyed-by-sounds-alone/)
- 플래시 효과는 "screen flash effects" 같은 기능명으로 옵션화; "epilepsy safe" 표기 금지. — [GAG flickering](https://gameaccessibilityguidelines.com/avoid-flickering-images-and-repetitive-patterns/)
- GAG는 "reduce motion"이라는 이름의 항목은 없고 가장 가까운 것이 배경 움직임 끄기임(확인함). — [GAG full list](https://gameaccessibilityguidelines.com/full-list/)

### Inferences
- (의견) 기본 옵션 세트: 스크롤 속도(ms 표기) / 레인 커버(Sudden+/Hidden+) / 전역 오디오·비주얼 오프셋 / 4키 리바인딩(중복 방지, 보조키) / 이펙트 강도(0–100%, 플래시 끄기) / 배경 영상 dim·끄기 / 흔들림 끄기 / 텍스트·HUD 크기 / 판정 표시 on-off / FAST/SLOW 표시 / 고대비 모드.

### Gaps
- 레인 커버·오프셋의 접근성 가이드 출처: 없음(일반 리듬게임 관행).

## 7. 1280x720 캔버스 적용안 (추론/의견 종합)

### Takeaway
아래 수치는 앞 섹션의 출처 있는 값(480ms 가시시간, 28px@1080p→~19px@720p, 3:1/4.5:1 대비, 3Hz 플래시)에서 산술로 유도한 것이며, 레인/HUD 배치 비율은 **의견**이다.

### Cited Findings
- 위 섹션 1–4의 인용 수치(그린넘버 450–517ms, WCAG 대비 3:1/4.5:1, 플래시 3회/초 및 25% 면적, 텍스트 28px@1080p)를 기반으로 함. 개별 출처는 해당 섹션 참조.

### Inferences
- (산술+의견) 레이아웃 제안: 레인 영역 4×80px = 320px 폭(중앙 x=480–800), 좌우 각 480px는 HUD·영상 영역. 노트 높이 약 24–28px(레인 폭의 약 0.3–0.35; osu! 스킨의 폭 연동 방식을 따름), 판정선 y≈620(하단 100px은 키빔/히트이펙트 여유), 레인 상단 y≈20. 가시 높이 600px.
- (산술) 가시시간 480ms 기본 → 1250px/s. 옵션 슬라이더: 250ms(2400px/s) ~ 900ms(667px/s).
- (의견) 좌측 패널: 곡 제목/난이도/게이지(세로 막대), 우측 패널: 점수/최대 콤보/FAST·SLOW 카운트; 판정·콤보는 레인 중앙(판정선 위 80–160px). 모두 레인 위에 겹치지 않거나 겹쳐도 투명 반투명으로 노트를 가리지 않음.
- (의견) 텍스트 최소 크기: 보조 정보 18–19px, 주요 정보 24px 이상, 판정 텍스트 28–36px. 폰트 크기 옵션 90–150%.
- (의견) 영상: 레인 백킹 패널 불투명도 기본 0.75, 영상 dim 기본 70% (슬라이더, 끄기 가능), 영상 컷/섬광은 3Hz 이하 보장 + 효과 강도 옵션.

### Gaps
- 위 비율(레인 80px, 노트 24–28px, 판정선 y=620, 패널 알파)은 사용자 테스트나 출처 없는 초기값. 실제 플레이테스트로 조정 필요.
