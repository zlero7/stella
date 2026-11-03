# 밝은 하늘색 4키 게임, 정보 위계로 설계하라

12개 리듬게임의 UI를 비교한 결과, 화면마다 반복되는 문법이 확인된다. **곡 선택은 "폴더 → 곡 → 난이도" 계층과 곡 옆 클리어 램프**, **플레이 HUD는 노트 경로를 비우고 판정·콤보·FAST/SLOW를 켜고 끌 수 있는 보조 요소로 분리**, **결과 화면은 "등급·클리어 상태 → 점수 → 판정 분포 → 타이밍 진단" 순서**, **설정은 속도·오프셋·배경 밝기를 분리해 미리보기로 조정**하는 구조다. 가독성 원칙은 크게 네 가지로 모인다. 색을 단독 수단으로 쓰지 않고(이름·약어·모양과 병행), 노트 뒤에 대비를 보장하는 레인 패널을 깔고, 배경 영상은 사용자가 어둡게 하거나 끌 수 있게 하며, 섬광은 초당 3회 이하로 제한한다. STELLA에 가장 중요한 시사점은 밝은 하늘색 테마와 관련된다. 조사한 게임 대부분은 어두운 배경을 기본으로 하고, 밝은 배경에서 노트가 안 보인다는 Arcaea 사용자 불만이 확인된다. 직접 계산하면 흰색·연한 하늘색 노트는 연한 하늘색 배경 위에서 대비가 약 1.2~1.3:1에 그친다(WCAG 비텍스트 기준 3:1에 크게 못 미친다). 따라서 **UI 바깥은 밝은 하늘색으로 두되, 레인 안쪽은 짙은 남색 반투명 패널로 분리**하는 설계를 권한다. 다만 이 보고서의 근거는 대부분 위키·패치노트·소스코드 기본값 같은 텍스트 자료다. 화면의 정확한 배치·색·치수는 거의 확인하지 못했고, 해당 항목은 뒤쪽 표에 따로 정리했다.

## 이 보고서의 근거 수준과 읽는 법

조사 노트는 5개(DJMAX, 아케이드 계열, 모바일/터치 계열, PC/커뮤니티 계열, 가독성 원칙)이며, 근거의 성격이 균일하지 않다. 가장 단단한 근거는 소스코드·공식 위키가 직접 밝힌 기본값이다. osu!lazer의 HUD 앵커와 판정 색, Quaver의 설정 기본값, osu! 공식 위키의 skin.ini 값이 여기에 속한다. 그다음은 RemyWiki·나무위키 같은 2차 위키와 패치노트다. 가장 약한 근거는 검색 요약만 확인한 항목과 커뮤니티 개인 의견이다. 이 보고서에서 출처 링크가 붙은 서술은 노트에서 확인된 사실이고, **"[의견]"으로 시작하는 문장은 필자의 추론이거나 조사 노트의 추론을 채택한 것**이다. 의견에는 증거 가치가 없다. 사실 중에서도 2차 출처나 검색 요약에 의존한 것은 본문에서 그렇다고 밝혔다. 조사하지 못한 부분(화면 스크린샷 기반의 배치, 색, 치수)은 "확인하지 못한 것" 절에서 한꺼번에 다룬다.

## 곡 선택 화면은 계층·램프·난이도 약어의 3단 구조로 수렴한다

아케이드 계열은 곡 목록 옆에 클리어 램프를 붙이는 방식이 일관되다. IIDX는 곡 옆에 램프를 표시하고, 램프를 NO PLAY(무점등), FAILED(깜빡임), ASSIST(보라), EASY(초록), CLEARED(파랑), HARD(흰색), EX-HARD(적황 점멸), FULL COMBO(3색 스트로브)로 나눈다. 즉 색과 점멸 패턴을 함께 써서 단계를 구분한다 ([RemyWiki IIDX](https://remywiki.com/What_is_beatmania_IIDX)). 탐색 비용을 줄이는 쪽으로도 진화하고 있다. IIDX 31은 레벨·클리어 램프·DJ LEVEL·미스 카운트·BPM 등을 조건으로 쓰는 사용자 정의 필터를 도입했고, 신규 유저용 "추천 폴더"를 기본으로 두었다 ([namu.moe IIDX 31](https://namu.moe/w/IIDX%2031)). IIDX 32는 무비 썸네일 탐색과 화면 보는 법을 알려주는 "내비게이트 기능"을 추가했다 ([Den Faminico](https://news.denfaminicogamer.jp/news/241009t)). SDVX EXCEED GEAR는 곡 선택을 세로 리스트 스타일로 되돌렸다 ([RemyWiki EXCEED GEAR](https://remywiki.com/AC_SDVX_EG)). 난이도는 SDVX가 NOV/ADV/EXH 같은 3자 약어와 고유 색을 병행해 표기한다 ([RemyWiki SDVX Glossary](https://remywiki.com/SOUND_VOLTEX_Glossary)).

PC 게임에서는 키보드 조작 체계와 정보 영역 분할이 핵심이다. DJMAX RESPECT V는 TAB으로 4/5/6/8키 모드를 전환하고, 알파벳 키로 곡을 점프하며, F4로 정렬(제목·BPM·난이도), F9로 즐겨찾기를 처리한다. 난이도는 모드와 곡마다 NM/HD/MX/SC로 따로 존재한다 ([ASCII.jp](https://weekly.ascii.jp/elem/000/004/003/4003145/), [패치노트](https://namu.wiki/w/DJMAX%20RESPECT%20V/패치노트), [시스템 문서](https://namu.wiki/w/DJMAX%20RESPECT/시스템)). 마우스 입력은 2024년 2.0 업데이트에서야 추가됐다 ([2.0 업데이트](https://namu.wiki/w/DJMAX%20RESPECT%20V/2.0%20업데이트)). osu!lazer는 곡 선택을 "Song Select v2"로 전면 재설계하면서 정보 wedge, 캐러셀, 공용 footer, 기울어진 검색창을 하나의 시각 언어로 통일했고 2025.710.0에서 기본값이 됐다. 커뮤니티는 회색·각진 도형 과다와 미선택 카드의 랭크 미표시를 비판했다 ([ppy/osu #22204](https://github.com/ppy/osu/issues/22204), [2025.710.0 릴리스](https://github.com/ppy/osu/releases/tag/2025.710.0-lazer)). 난이도 색 스펙트럼은 osu!가 별점에 따라 회색→하늘색→초록→노랑→빨강→보라→남색→검정으로 보간하도록 코드에 정의했고 ([OsuColour.cs](https://raw.githubusercontent.com/ppy/osu/master/osu.Game/Graphics/OsuColour.cs)), StepMania 계열은 Beginner 분홍·Easy 초록·Medium 노랑·Hard 빨강·Challenge 하늘색을 쓴다 ([Etterna 색 정의](https://raw.githubusercontent.com/etternagame/etterna/develop/Themes/_fallback/Scripts/02%20Colors.lua)).

모바일 게임은 자켓을 터치 타깃 1순위로 둔다. Phigros는 위아래 스와이프로 곡을 바꾸고, 자켓을 탭하면 시작하며, 좌하단 난이도 표시기를 탭해 EZ/HD/IN/AT를 전환한다 ([Phigros Wiki](https://killkpa.miraheze.org/wiki/Phigros)). Cytus II는 곡이 아니라 캐릭터 중심으로 선곡하며 캐릭터 레벨이 곡 해금과 연결된다. 최대 난이도가 업데이트마다 9→10, 15→16으로 올라간 점도 확인된다 ([나무위키 Cytus II](https://en.namu.wiki/w/Cytus%20II)). Arcaea는 곡 검색을 v4.4.6에서야 추가했고, 색약 보정 옵션이 arc 색(빨강↔노랑)과 일부 난이도 명칭까지 바꾼다 ([나무위키 Arcaea](https://en.namu.wiki/w/Arcaea)).

**[의견] STELLA 적용.** 4키 단일 모드이므로 DJMAX의 모드 전환 계층은 필요 없다. 대신 스텔라이브 커버곡이라는 정체성을 곡 선택에서 살려야 한다. Cytus II의 "캐릭터=컨테이너" 구조를 따라 "멤버(또는 원곡 기준) 폴더 → 곡 → 난이도 칩" 계층을 두고, 자켓 자리에 멤버 커버 이미지를 쓰는 안이 자연스럽다. 난이도는 색 단독이 아니라 3자 약어와 레벨 숫자를 병행한다. 이는 GAG의 "필수 정보를 고정된 색 하나만으로 전달하지 말 것" 원칙과 SDVX의 실제 표기 방식에 모두 부합한다 ([GAG](https://gameaccessibilityguidelines.com/ensure-no-essential-information-is-conveyed-by-a-fixed-colour-alone/)). 곡 행 왼쪽에는 클리어 램프(색+모양)와 최고 등급을 두고, 필터는 첫 버전에서 제목·레벨·클리어 상태·BPM 정도로 최소화한다. 첫 실행 사용자를 위한 "추천 폴더" 기본값은 IIDX 31 사례처럼 이탈 방지에 유용할 것으로 본다. 난이도 최대치 인플레이션을 피하려고 레벨 표기에 "+" 세분화 여지를 남기는 것도 Cytus II·Arcaea 사례에서 얻은 교훈이다.

## 플레이 HUD는 노트 경로를 비우고 상태를 기존 요소의 색에 싣는다

판정·콤보 위치에 정답은 없고, 조정 가능한 요소로 취급된다. osu! stable 스킨은 480px 높이 기준으로 HitPosition 402, ComboPosition 111, ScorePosition(판정 표시 높이) 325를 쓴다. 즉 판정선은 화면 하단 가까이, 콤보는 상단 쪽, 판정 표시는 판정선 위 중간에 있다 ([skin.ini](https://raw.githubusercontent.com/ppy/osu-wiki/master/wiki/Skinning/skin.ini/en.md), [skinship.xyz](https://skinship.xyz/wiki/ini)). lazer의 Argon 기본 HUD는 체력 바를 좌상단(폭 300, 높이 30), 점수를 우상단, 정확도를 그 옆에 두고 mania 콤보는 상단 중앙 Y=200에 둔다. hit error meter는 좌우 양쪽에 미러로 배치되며, 모든 요소를 레이아웃 에디터에서 옮길 수 있다 ([ArgonSkin.cs](https://raw.githubusercontent.com/ppy/osu/master/osu.Game/Skinning/ArgonSkin.cs), [ManiaArgonSkinTransformer.cs](https://raw.githubusercontent.com/ppy/osu/master/osu.Game.Rulesets.Mania/Skinning/Argon/ManiaArgonSkinTransformer.cs)). DJMAX RESPECT V는 콤보·판정·피버 게이지·평균 레이트·FAST/SLOW·키 빔·노트 이펙트를 각각 켜고 끌 수 있고 위치도 이동할 수 있으며, 콤보 수치는 피버 게이지 위에 표시한다 ([시스템 문서](https://namu.wiki/w/DJMAX%20RESPECT/시스템), [ASCII.jp](https://weekly.ascii.jp/elem/000/004/003/4003145/)). IIDX의 판정 표시와 FAST/SLOW는 노트 위에 실시간으로 뜨고, FAST/SLOW 표시 위치와 게이지 표시 방식(숨김/바/퍼센트)도 선택할 수 있다 ([RemyWiki IIDX](https://remywiki.com/What_is_beatmania_IIDX)). 스코어 그래프와 라이벌 표시는 레인 옆 보조 영역에 둔다 (같은 출처).

FAST/SLOW 표시는 거의 모든 게임에서 옵션이다. SDVX는 EARLY/LATE 표시 범위(CRITICAL 이하/NEAR 이하/OFF)와 표시 높이, 색 반전(기본 EARLY 빨강·LATE 파랑)을 선택하게 한다 ([voltexes 옵션 가이드](https://voltexes.com/exceed-gear-play-options-guide/)). DJMAX V는 2023년에야 FAST/SLOW를 추가했고, 기어에 레이트와 함께 표시할 수 있게 했다 ([패치노트](https://namu.wiki/w/DJMAX%20RESPECT%20V/패치노트), [시스템 문서](https://namu.wiki/w/DJMAX%20RESPECT/시스템)). BanG Dream!은 2021년 추가 후 옵션으로 ON/OFF하며 ([Bushiroad FAQ](https://bang-dream.bushimo.jp/faq/)), Arcaea는 Pure 판정에서 ±25ms 이상 벗어날 때만 Late/Early를 띄우고 위치(Top/Middle/Bottom)를 고르게 한다 ([나무위키 Arcaea 설정](https://en.namu.wiki/w/Arcaea/%EC%84%A4%EC%A0%95)). osu!lazer의 hit error meter는 판정 윈도우별 색 막대, early는 위(토끼)·late는 아래(거북이), 이동평균 화살표로 "일관된 편향"을 보여준다 ([BarHitErrorMeter.cs](https://raw.githubusercontent.com/ppy/osu/master/osu.Game/Screens/Play/HUD/HitErrorMeters/BarHitErrorMeter.cs)). Quaver는 이 막대의 알파 기본값을 0.5로 낮췄다 ([SkinKeys.cs](https://raw.githubusercontent.com/Quaver/Quaver/develop/Quaver.Shared/Skinning/SkinKeys.cs)).

가장 응용 가치가 큰 것은 **"새 위젯을 추가하지 않고 기존 요소의 색으로 FC/AP 상태를 알리는" 패턴**이다. Cytus II는 콤보 숫자 색으로 노랑=Million Master 가능, 파랑=FC 가능, 흰색=FC 불가를 표시한다 ([나무위키 Cytus II](https://en.namu.wiki/w/Cytus%20II)). Phigros는 판정선 색이 금색(AP 유지), 파랑(FC 유지), 흰색(Bad/Miss 후)으로 바뀐다 ([Phigros Wiki](https://killkpa.miraheze.org/wiki/Phigros)). 또한 연출 강도를 항목별로 분리하는 것이 PJSK의 설계다. 컷인, FEVER 연출, 스킬 표시, 탭 이펙트, 배경 밝기, 레인 불투명도가 각각 별도 설정이며, 한 커뮤니티 옵션표는 배경 밝기 50%, 레인 불투명도 100%, 컷인 OFF 같은 "가독성 우선" 값을 권한다(개인 의견이며 공식 기본값이 아니다) ([masa-game 옵션표](https://www.masa-game.com/option/)). 일시정지 오터치 방지는 터치 게임에서는 필수 옵션 수준이다. Phigros는 더블탭, Arcaea는 1탭/더블탭/길게/비활성을 고르게 한다 (위 두 출처).

속도 표기도 중요한 설계 결정이다. IIDX 커뮤니티는 노트가 화면에 보이는 시간(그린넘버)을 기준으로 속도를 정하며, beatoraja에서는 ms로 표기한다. 대부분의 플레이어는 IIDX 값 270~310, 즉 약 **450~517ms**로 수렴한다 ([beatoraja 가이드](https://github-wiki-see.page/m/wcko87/beatoraja-english-guide/wiki/Scroll-Speed-and-Green-Number)). 레인 커버(SUDDEN+/LIFT)를 바꾸면 하이스피드가 자동 보정되어 그린넘버가 유지되는 방식도 같은 출처에서 확인된다. DJMAX V는 ×1.0~×9.0의 BPM 무관 고정 배속을 쓰고 ([시스템 문서](https://namu.wiki/w/DJMAX%20RESPECT/시스템)), Quaver는 스크롤 속도 기본 150(50~1000)과 레인 커버 기본 높이 25(0~75)를 쓴다 ([Quaver ConfigManager.cs](https://raw.githubusercontent.com/Quaver/Quaver/develop/Quaver.Shared/Config/ConfigManager.cs)).

**[의견] STELLA 적용.** 1280x720에서 판정선을 y≈620, 레인 상단을 y≈20으로 두면 가시 높이는 약 600px이다. 기본 가시 시간을 480ms로 잡으면 스크롤 속도는 1250px/s(산술), 옵션 범위 250~900ms는 2400~667px/s에 해당한다. 이 범위 자체는 출처가 없는 제안이다. 레인은 4개로 폭 약 350px(88px×4)를 제안한다. 조사 노트는 320px 안(80px×4)과 400~450px 안을 각각 냈고 어느 쪽도 출처가 없으므로, 플레이테스트 전 초기값으로만 쓴다. HUD 배치는 osu!의 선례와 일치하게 **콤보는 레인 상단 중앙(y≈250~300, 반투명), 판정 텍스트는 판정선 위 120~150px(y≈470~500)** 에 두고, 연속 판정은 이전 표시를 즉시 대체한다. 게이지는 레인 왼쪽의 세로 바, 점수·정확도·FAST/SLOW 카운트는 오른쪽 패널로 보낸다. 노트 높이는 레인 폭에 연동(osu!의 `WidthForNoteHeightScale` 관행)하여 24~28px을 제안한다. FC/AP 상태는 콤보 숫자나 판정선 색으로 흡수하되 "색+텍스트(FC/AP 마크)" 병행으로 색 단독 전달을 피한다. FAST/SLOW는 PERFECT 제외 기본, 표시 범위·위치·색 반전 옵션을 제공한다. 일시정지는 오터치 방지를 위해 두 번 입력(또는 길게 누름)을 기본으로 하고 재개 시 카운트다운을 둔다.

## 결과 화면은 "한 번에 읽히는 요약"과 "진단 그래프"의 2층 구조다

IIDX의 DJ LEVEL은 최대 EX SCORE 대비 비율을 1/9씩 나눠 AAA(8/9 이상)에서 F까지로 정하고, EX SCORE는 PGREAT 2점·GREAT 1점이다 ([RemyWiki IIDX](https://remywiki.com/What_is_beatmania_IIDX), [RemyWiki EX Score](https://remywiki.com/EX_Score)). IIDX 31에서는 단위인정 결과에서 MAX COMBO를 빼고 곡명을 넣어 지표를 맥락에 맞게 줄였고, 결과 일러스트는 등급에 따라 달라지며, 공유 이미지에는 누적 FAST/SLOW 막대 그래프가 추가됐다 ([namu.moe EPOLIS](https://namu.moe/w/EPOLIS)). SDVX는 로케이션 테스트 보고에서 결과 화면이 비교적 미니멀하다는 인상이 있었다 ([voltexes](https://voltexes.com/sound-voltex-exceed-gear-location-test-summary/)). pop'n music은 FULL COMBO를 은색 메달, PERFECT를 금색 별로 표시한다 ([RemyWiki PNM](https://remywiki.com/PNM_Glossary)).

PC 게임은 진단 도구가 풍부하다. osu!mania는 "Performance Breakdown"과 "Timing Distribution"(150px 높이 히스토그램), 그리고 Average Hit Error와 Unstable Rate 표를 결과에 싣는다 ([ManiaRuleset.cs](https://raw.githubusercontent.com/ppy/osu/master/osu.Game.Rulesets.Mania/ManiaRuleset.cs)). hit event가 필요한 통계는 리플레이가 있을 때만 표시한다 ([StatisticsPanel.cs](https://raw.githubusercontent.com/ppy/osu/master/osu.Game/Screens/Ranking/Statistics/StatisticsPanel.cs)). Quaver의 결과 그래프 기본값은 Deviance(판정 편차)이고 ([ConfigManager.cs](https://raw.githubusercontent.com/Quaver/Quaver/develop/Quaver.Shared/Config/ConfigManager.cs)), Etterna Rebirth는 오프셋 플롯에 hover 정보와 컬럼별 콤보 브레이크 상세를 제공한다 ([Etterna 0.71.0](https://forums.etternaonline.com/t/etterna-0-71-0-released/3098)). DJMAX V는 점수·랭크·레이트·MAX COMBO/PERFECT PLAY 여부를 보여주고, 2022년에 결과 화면에 재시작과 즐겨찾기 버튼을 추가했다 ([시스템 문서](https://namu.wiki/w/DJMAX%20RESPECT/시스템), [패치노트](https://namu.wiki/w/DJMAX%20RESPECT%20V/패치노트)).

IP 게임의 결과 연출에는 두 가지 선례가 있다. PJSK는 곡 종료 직후 암전 직전에 ALL PERFECT/FULL COMBO/LIVE CLEAR 라벨을 짧게 보여준 뒤 최종 결과로 넘어간다 ([NEK0 note](https://note.com/nek0games/n/nf048bd9094ba)). Cytus II는 랭크에 따라 캐릭터의 평가 메시지가 달라지고(고랭크는 칭찬, C/Fail은 꾸짖음) FC를 Max Combo 자리의 무지개 다이아몬드로 표시한다 ([나무위키 Cytus II](https://en.namu.wiki/w/Cytus%20II)). Arcaea는 결과에서 판정 개수를 탭하면 FAST/SLOW 수치를 보여 준다 ([나무위키 Arcaea](https://en.namu.wiki/w/Arcaea)).

**[의견] STELLA 적용.** 결과 화면의 위계는 (1) 등급과 클리어 상태(가장 큰 크기), (2) 점수와 개인 최고 대비, (3) 판정 개수표(HUD와 같은 색·약어), (4) 최대 콤보, (5) FAST/SLOW 합계와 타이밍 히스토그램 및 평균 오프셋, (6) 재도전·다음 곡 버튼 순으로 둔다. 히스토그램의 평균 오프셋은 설정의 오프셋 보정과 연결하는 버튼("이 값으로 보정")을 달 수 있다. PJSK식 종료 라벨과 멤버 일러스트·음성 반응은 곡 종료 직후와 결과 화면에 집중하고, 플레이 중 연출은 최소화한다. 이 방식은 PJSK와 Cytus II가 이미 쓰는 분리와 같다. 일러스트가 정보를 가리지 않도록 "UI 숨김/투명" 토글을 두는 안은 SDVX 한국 위키의 미확인 서술에서 얻은 아이디어이므로 근거가 약하다. 재시작·즐겨찾기 버튼은 DJMAX 사례처럼 반복 연습 루프를 줄이는 이점이 확인된다. 히스토그램 크기는 osu!의 150px 선례를 출발점으로 삼는다.

## 설정 화면은 속도·오프셋·배경을 분리하고 미리보기로 검증한다

오프셋은 대부분의 게임에서 자동 측정과 수동 보정을 병행한다. Arcaea는 -2000~2000ms(1ms 단위), 120BPM 비트를 이용한 자동 캘리브레이션, 스피커/블루투스별 프리셋 오프셋을 제공한다 ([나무위키 Arcaea 설정](https://en.namu.wiki/w/Arcaea/%EC%84%A4%EC%A0%95)). PJSK는 "タップで調整"(박자에 맞춰 탭, 자동 산출)과 "プレビューを見ながら調整"(노트를 치며 수동 조정) 두 가지를 제공하고 결과 화면의 FAST/LATE 경향으로 보정하는 방법이 일반적으로 소개된다 ([masa-game 옵션표](https://www.masa-game.com/option/)). SDVX는 오디오 오프셋(Sound)과 비주얼 오프셋(Graphics)을 분리하고 인게임 단축키로 조정하며, "Lane Preview"로 속도와 판정 설정을 테스트한다 ([voltexes 옵션 가이드](https://voltexes.com/exceed-gear-play-options-guide/)). Quaver는 GlobalAudioOffset과 VisualOffset을 각각 ±500 범위로 둔다 ([ConfigManager.cs](https://raw.githubusercontent.com/Quaver/Quaver/develop/Quaver.Shared/Config/ConfigManager.cs)).

배경 처리의 기본값은 게임마다 다르다. osu! stable의 배경 dim 기본값은 80%이고 비트맵별 설정이 가능하다 ([osu-wiki Options](https://raw.githubusercontent.com/ppy/osu-wiki/master/wiki/Client/Options/en.md)). lazer 소스의 기본값은 DimLevel 0.7, BlurLevel 0, 스토리보드·비디오 켜짐이다 ([OsuConfigManager.cs](https://raw.githubusercontent.com/ppy/osu/master/osu.Game/Configuration/OsuConfigManager.cs)). Quaver는 BackgroundBrightness 기본 50이며(단위 정의가 다를 수 있어 osu!와 직접 비교는 부정확하다), 스코어보드·판정 카운터·진행 바·콤보 알림 등 HUD 요소를 개별 토글로 둔다 ([ConfigManager.cs](https://raw.githubusercontent.com/Quaver/Quaver/develop/Quaver.Shared/Config/ConfigManager.cs)). DJMAX V는 BGA 밝기를 키보드로 즉시 조절하고 일시정지 화면에서도 BGA ON/OFF를 허용하며, 기어 배경 투명도를 0~100%(10% 단위)로 조절하고 기어 위치(좌/중/우)를 바꿀 수 있다 ([시스템 문서](https://namu.wiki/w/DJMAX%20RESPECT/시스템), [패치노트](https://namu.wiki/w/DJMAX%20RESPECT%20V/패치노트)). 색약 보정은 DJMAX V가 Season 5(2022)에 추가했다 ([패치노트](https://namu.wiki/w/DJMAX%20RESPECT%20V/패치노트)). 설정 메뉴 구조는 Etterna Rebirth가 번호가 붙은 카테고리의 통합 메뉴로 개편했고 색 설정 프리셋을 저장·공유할 수 있게 했다 ([Etterna 0.71.0](https://forums.etternaonline.com/t/etterna-0-71-0-released/3098)). DJMAX 2.0은 시스템 설정 카테고리를 분리했다 ([2.0 업데이트](https://namu.wiki/w/DJMAX%20RESPECT%20V/2.0%20업데이트)). 접근성 가이드(GAG)는 키 리매핑(Basic), 게임 속도 조절(Basic), 인터페이스 크기·대비 조절(Intermediate), 배경 움직임 끄기(Intermediate)를 명시한다 ([GAG](https://gameaccessibilityguidelines.com/full-list/)).

**[의견] STELLA 적용.** 설정 화면은 왼쪽에 카테고리(입력·속도/레인·타이밍·화면/HUD·소리), 오른쪽에 항목 목록과 하단 미리보기 영역으로 나누는 구성을 권한다. 미리보기에는 실제 노트가 흐르게 하고, 속도 슬라이더 옆에 현재 가시 시간(ms)을 같이 보여준다. 설정 변경은 즉시 반영한다(lazer가 이미 쓰는 방식). 배경은 한 슬라이더로 묶지 않고 PJSK처럼 "배경 영상 밝기", "레인 패널 불투명도", "이펙트 강도(플래시 포함)"를 분리한다. 스텔라이브 커버곡의 영상·일러스트가 IP 가치의 핵심이므로, 기본값은 영상이 보이되 레인 패널이 노트 대비를 책임지는 쪽(예: 영상 밝기 60~70%, 패널 알파 0.75~0.85)으로 시작하는 것이 안전하다. 이 수치는 osu! 80%/0.7 기본값과 Arcaea 사례에서 유추한 초기값일 뿐이다. 오프셋은 오디오·비주얼을 분리하고, 첫 실행 시 탭 측정 마법사를 띄우고, 이후 결과 화면의 평균 오프셋으로 재조정을 유도한다. 장치별 프리셋(Arcaea의 블루투스 구분)은 웹/모바일 대응 시에만 필요하다.

## 밝은 하늘색 테마는 대비 설계가 절반이다

조사한 게임의 사실상 공통 가정은 어두운 배경이다. DJMAX TECHNIKA 3은 "검은 배경 위 밝은 단색" 강조로 회귀했고 ([나무위키 DMT3](https://namu.moe/w/DJMAX%20TECHNIKA%203)), Cytus II는 흑색 배경에 흰 판정선으로 가시성을 개선했다고 평가된다 ([나무위키 Cytus II](https://en.namu.wiki/w/Cytus%20II)). 반면 밝은 배경 차트에서 하늘색 노트와의 대비가 낮아 읽기 어렵다는 Arcaea 사용자 불만이 있고, 배경 강도를 조절할 수단이 없어 기기 색 반전으로 우회한다는 보고가 있다 ([r/arcaea 스레드](https://lr.us.psf.lt/r/arcaea/comments/1fkoc39/dark_background)). 이 스레드는 개인 의견 모음이라 일반화는 조심해야 한다. 그래도 밝은 테마가 어려운 이유는 근거가 명확하다. WCAG 2.2는 UI 컴포넌트와 그래픽 오브젝트에 인접색 대비 3:1을, 일반 텍스트에 4.5:1(큰 글자 3:1)을 요구한다 ([1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html), [1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)).

**[의견] 계산으로 확인한 점.** WCAG 상대휘도 공식으로 필자가 계산한 값은 다음과 같다. 흰색(#FFFFFF)과 연한 하늘색 배경(#BFE3FF)의 대비는 **1.34:1**, 밝은 시안(#7FD4FF)과 같은 배경은 **1.23:1**이라 노트를 밝게 칠하면 하늘색 배경 위에서는 사실상 보이지 않는다. 반면 짙은 남색(#14385F) 레인 패널 위에서는 흰색 11.9:1, 시안 7.3:1, 노랑(#FFD45A) 8.4:1, 연한 빨강(#FF6B6B) 4.3:1이다. 하늘색 배경 위 남색 텍스트(#0B2A4A)는 #EAF6FF에서 13.2:1, #BFE3FF에서 10.8:1이다. 이 색들은 설명용 예시이고 STELLA의 실제 팔레트가 아니다. 또한 패널이 반투명이면 뒤 영상의 밝기에 따라 실효 대비가 낮아지므로 영상이 가장 밝은 장면에서 다시 측정해야 한다. 결론적으로 **레인 안쪽만 짙은 색의 "어두운 섬"으로 만들고 바깥 UI는 밝은 하늘색을 유지**하는 구성이 테마와 가독성을 동시에 만족시킨다. 이 대비 계산은 게임 업계 근거가 아니라 접근성 기준의 적용이다.

가독성의 나머지 원칙은 다음과 같다. 색 단독 전달 금지는 GAG·Xbox·WCAG의 공통 권고이며, 색과 소리·도형·텍스트를 병행하라고 한다 ([Xbox XAG 103](https://devdocs.xbox.com/gaming/accessibility/xbox-accessibility-guidelines/103), [Can I Play That](https://caniplaythat.com/?p=8897)). 글자 크기에서는 GAG가 Amazon TV 10-foot UI의 1080p 최소 28px을 "목표가 아닌 최소치"로 소개한다 ([GAG 폰트 크기](https://gameaccessibilityguidelines.com/use-an-easily-readable-default-font-size/)). 비례로 환산하면 720p에서는 약 19px이다(산술). 이것은 TV 거리 기준이라 PC 모니터에서는 하한으로만 쓴다. 섬광에 대해 WCAG 2.3.1은 1초에 3회 초과의 일반 플래시를 금지하고 면적 기준을 정하며 ([W3C 2.3.1](https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html)), GAG는 3회/초 초과로 화면 25% 이상을 덮는 플래시를 금지하고, 피할 수 없을 때는 경고와 끄기 옵션을 두며 옵션 이름은 "epilepsy safe" 대신 "screen flash effects" 같은 기능명으로 하라고 한다 ([GAG](https://gameaccessibilityguidelines.com/avoid-flickering-images-and-repetitive-patterns/)). **[의견]** 고BPM 4키에서 레인별 히트 플래시가 동시에 점멸하면 3Hz를 쉽게 넘길 수 있다. 히트 이펙트는 레인 폭 이하의 작은 면적, 작은 휘도 변화로 제한하고 이펙트 강도 옵션에 플래시 끄기를 포함한다. 풀콤보 연출과 영상 컷도 같은 규칙을 적용한다. 화면 흔들림은 레인이 아니라 HUD·배경에만 적용하거나 기본 비활성으로 둔다. SDVX가 30% 이하 게이지에서 색과 배경이 바뀌는 방식처럼, 위험 경고는 깜박임 대신 색·윤곽 변화로 처리하는 편이 안전하다는 것도 같은 방향의 의견이다 ([RemyWiki SDVX Glossary](https://remywiki.com/SOUND_VOLTEX_Glossary)).

## 확인하지 못한 것

아래 항목은 조사 노트의 Gaps를 합친 것이다. "숨기지 않는다"는 원칙에 따라 모두 미확인으로 남기며, 본문의 STELLA 수치는 이 공백을 메우는 초기 제안이지 사실이 아니다.

| 구분 | 확인하지 못한 내용 | 왜 못 했나 / 어떻게 다룰지 |
|---|---|---|
| 모든 게임 공통 | 화면의 정확한 요소 좌표·크기·폰트·색상 hex (아래 PC 소스코드 값을 제외한 전부) | 텍스트 소스로는 스크린샷 수준의 배치를 알 수 없다. 공식 스토어 이미지·플레이 영상으로 별도 검증 필요 |
| DJMAX RESPECT V | 선곡 재킷 배치·보이는 행 수, 난이도 색(NM/HD/MX/SC), 레인 폭·판정선 위치, 결과 화면 배치, 라이프 게이지 위치 | 나무위키 서술에 없음. 난이도 색 기억은 출처 없어 사용하지 않음 |
| IIDX / SDVX / pop'n | 휠에 동시에 보이는 곡 수, HUD 각 요소 위치, 결과 화면 정밀 레이아웃, BGA 밝기 옵션명, SDVX VIVID WAVE 전용 UI, IIDX 30 변경점 | 위키는 기능 목록 위주. IIDX 레인·게이지·콤보 위치는 "일반 지식"으로만 알려져 있어 인용하지 않음 |
| BanG Dream / PJSK / Cytus II / Arcaea / Phigros | 선곡 화면의 캐러셀/리스트 구조, 난이도 칩 색, 배지 형태, 점수·콤보 위치, 배경 dim 수치, 판정 텍스트 색(PJSK/GBP) | Fandom 접근 차단(HTTP 402), 검색 요약 의존. Phigros 배경 밝기 0=배경 off는 검색 요약이라 약한 근거 |
| osu!mania | 레거시 판정 이미지 색(300g 등), 필드 폭 대 스크롤 속도의 권장 수치, Zuma/Hydra 등 인기 스킨의 수치, 현행 2026 공식 dim 기본값 재검증 | 위키에 색 명세 없음(기본 스킨 이미지로만 제공). dim 80%(stable)과 0.7(lazer 소스)은 서로 다른 출처 |
| Quaver / Etterna | 곡 선택·결과 화면 전체 레이아웃, Etterna Rebirth 판정 색 확정(StepMania 폴백 색을 도구가 추정 매핑) | 공식 레이아웃 문서 없음 |
| 가독성 일반 | 플레이어 시선 위치 아이트래킹, 레인 폭 대 노트 높이의 권장 비율, 판정 표시 크기·지속시간(ms), 콤보 크기, 게이지 방향 효과, 모션블러 영향, 영상 위 노트 가독성 측정, 색약 안전 판정 팔레트(hex), FAST/SLOW 색 관습의 1차 출처 | 인용 가능한 1차 출처를 찾지 못함. 본문의 해당 수치는 모두 [의견] |
| 접근성 기준의 한계 | WCAG 플래시 면적 기준은 1024x768·특정 시청 거리 가정에서 환산된 값이며, Harding 테스트(PEAT 후속)는 출처 간 현행 여부가 상충 | 보수적으로 GAG 25% 기준과 WCAG 환산 중 더 엄격한 값을 쓰는 것을 권장 |
| STELLA 고유 | 실제 난이도 수, 곡 수, 멤버 수, 입력 방식(키보드/터치), 브랜드 팔레트, 영상 배경 사용 여부 | 이 조사의 범위 밖. 아래 권고는 4키·1280x720·밝은 하늘색·영상/일러스트 가능이라는 가정 위에 있음 |
| 밝은 테마 선례 | 밝은 UI를 기본으로 하는 대표 리듬게임의 사례 | 조사 노트에 없음. Arcaea 사용자 불만과 WCAG 계산이 유일한 근거 |

## 결론

12개 게임을 가로로 보면 새로 얻는 통찰은 두 가지다. 첫째, 화면마다 다른 게임들이 같은 결정을 반복한다. "보조 정보는 끄고 켤 수 있어야 하고, 위치는 노트 경로와 겹치지 않아야 하며, 연출은 판정이 이뤄지는 시간 밖(곡 종료 직후·결과)으로 옮긴다"는 것이다. 이는 STELLA에서 멤버 일러스트와 음성이라는 IP 자산을 안전하게 쓰는 방법이기도 하다. 둘째, 밝은 하늘색 테마는 장식이 아니라 대비 설계의 문제다. 조사 노트에는 밝은 테마의 성공 선례가 없고, 계산으로 확인한 사실은 "밝은 노트는 하늘색 배경에서 보이지 않는다"는 것이다. 그러므로 첫 프로토타입에서 가장 먼저 검증할 것은 팔레트가 아니라 **레인 패널 위 노트·판정 색의 대비를 영상이 가장 밝은 장면에서 측정하는 일**이다.

이 보고서가 말하지 못하는 것도 분명하다. 화면 배치의 실제 수치는 대부분 스크린샷 검증이 필요하고, 본문의 STELLA 수치는 출처 없는 초기값이다. 따라서 아래 표의 P0 항목(가독성 구조와 필수 옵션)을 먼저 구현하고, P1·P2의 정확한 수치는 4~5명 이상의 플레이테스트로 확정한다. 확정 수치는 설정 화면의 사용자 조정 폭으로 흡수할 수 있으므로, 초기값을 틀려도 복구 비용은 낮다.

## 화면별 STELLA 적용 권고 (우선순위 표)

우선순위 기준은 P0 = 첫 플레이 가능 빌드에 필수, P1 = 공개 전 권장, P2 = 여유가 있을 때. "근거 수준"에서 **사실 기반**은 위 본문의 출처 있는 사례에서 직접 도출했다는 뜻이고, **의견**은 출처 없는 추론이다. 수치는 모두 플레이테스트로 조정할 초기값이다.

| 화면 | 권고 | 우선순위 | 근거 수준 |
|---|---|---|---|
| 곡 선택 | 난이도는 색과 3자 약어와 레벨 숫자를 병행 표기하고, 난이도 칩은 3~4개로 고정 | P0 | 사실 기반 (SDVX 표기, GAG 색 단독 금지) |
| 곡 선택 | 곡 행 왼쪽에 클리어 램프(색+모양)와 최고 등급 표시 | P0 | 사실 기반 (IIDX 램프, osu! 커뮤니티의 미선택 카드 랭크 요청) |
| 곡 선택 | 자켓 자리에 멤버 커버 이미지, 위계는 "멤버/원곡 폴더 → 곡 → 난이도"로 구성 | P1 | 의견 (Cytus II 캐릭터 컨테이너 선례에서 유추) |
| 곡 선택 | 키보드 조작: 방향키·Enter, 첫 글자 점프, 정렬 키(제목/BPM/레벨), 즐겨찾기, 마우스 병행 | P1 | 사실 기반 (DJMAX V 조작, 2.0 마우스 추가) |
| 곡 선택 | 필터는 레벨·클리어 상태·BPM·제목 검색으로 최소화, 추천 폴더 기본값 | P1 | 사실 기반 (IIDX 31 필터·추천 폴더) + 의견 (최소 구성) |
| 곡 선택 | 선택 곡 프리뷰 오디오 자동 재생과 곡 목록 바깥의 우측 상세 패널(BPM·노트 수·기록) | P2 | 의견 (배치 정보는 확인 못함) |
| 플레이 HUD | 레인 뒤에 짙은 남색 반투명 패널(알파 0.75~0.85), 노트·판정선은 패널 대비 3:1 이상으로 설계, 영상 최밝 장면에서 측정 | P0 | 사실 기반 (WCAG 1.4.11, Arcaea 불만) + 계산 |
| 플레이 HUD | 판정선 y≈620, 가시 높이 약 600px, 기본 가시 시간 약 480ms, 노트 높이 24~28px | P0 | 산술 + 의견 (480ms는 450~517ms 관행에서 도출, 레인 폭 약 350px) |
| 플레이 HUD | 콤보는 레인 상단 중앙(y≈250~300), 판정 텍스트는 판정선 위 120~150px, 연속 판정은 교체 방식 | P0 | 의견 (osu! 배치 선례와 유사, 수치는 출처 없음) |
| 플레이 HUD | 판정 5단계(PERFECT/GREAT/GOOD/BAD/MISS)를 색+이름으로 이중 표기, FAST/SLOW는 PERFECT 제외가 기본이며 색 반전 가능 | P0 | 사실 기반 (SDVX·Arcaea·PJSK 옵션 구조) + 의견 (5단계 선택) |
| 플레이 HUD | FC/AP 상태를 콤보 숫자 또는 판정선 색 + 마크로 표시 | P1 | 사실 기반 (Cytus II, Phigros) |
| 플레이 HUD | 히트 이펙트는 레인 폭 이하·소휘도 변화, 초당 3회 초과 플래시 방지, 이펙트 강도·플래시 끄기 옵션 | P0 | 사실 기반 (WCAG 2.3.1, GAG) |
| 플레이 HUD | 일시정지 오터치 방지(더블 입력/길게 누름)와 재개 카운트다운 | P1 | 사실 기반 (Phigros, Arcaea, DJMAX 재개 지연) |
| 플레이 HUD | 게이지는 좌측 세로 바, 점수·FAST/SLOW 카운트는 우측 패널, 최소 글자 19px(보조)·24px 이상(주요) | P1 | 의견 + 산술 (28px@1080p→19px@720p) |
| 결과 | 위계: 등급+클리어 상태 → 점수·개인 최고 → 판정 개수표 → 최대 콤보 → FAST/SLOW 및 히스토그램 | P0 | 사실 기반 (IIDX, osu!, Etterna 구성) + 의견 (순서) |
| 결과 | 타이밍 히스토그램(높이 약 150px)과 평균 오프셋 표시, "이 값으로 보정" 연결 | P1 | 사실 기반 (osu! Timing Distribution) + 의견 (연결) |
| 결과 | 곡 종료 직후 FC/AP/CLEAR 라벨, 결과에 멤버 일러스트·음성 반응(등급별 차등), UI 투명 토글 | P1 | 사실 기반 (PJSK 라벨, Cytus II 평가 메시지) + 의견 (토글은 근거 약함) |
| 결과 | 재시작·즐겨찾기·다음 곡 버튼 | P0 | 사실 기반 (DJMAX V 결과 화면) |
| 설정 | 속도를 ms 가시 시간과 배율로 함께 표기, 기본 약 480ms, 범위 약 250~900ms, 변경 즉시 미리보기 반영 | P0 | 사실 기반 (beatoraja 그린넘버, SDVX Lane Preview) + 의견 (범위) |
| 설정 | 오디오·비주얼 오프셋 분리(ms), 첫 실행 탭 측정 마법사, 수동 미세조정, 이후 결과 평균 오프셋으로 재조정 유도 | P0 | 사실 기반 (SDVX, Quaver, Arcaea, PJSK) |
| 설정 | 키 리바인딩(중복 방지, 보조 키), 배경 영상 밝기·레인 패널 불투명도·이펙트 강도를 3개로 분리하고 영상 끄기 제공 | P0 | 사실 기반 (GAG, PJSK, DJMAX BGA, Quaver) |
| 설정 | 기본 영상 밝기 약 60~70%, 패널 알파 0.75~0.85 | P1 | 의견 (osu! 80%/0.7, Arcaea 사례에서 유추) |
| 설정 | 레인 커버(SUDDEN/LIFT), 속도 변경 시 가시 시간 자동 보정 | P2 | 사실 기반 (IIDX, Quaver) |
| 설정 | HUD 요소별 ON/OFF(판정·FAST/SLOW·콤보·진행바), 글자·UI 크기 배율(90~150%), 고대비·색약 모드 | P1 | 사실 기반 (DJMAX V HUD 설정·색약 보정, Quaver 토글, GAG) + 의견 (배율 범위) |
| 설정 | 요소 위치 자유 배치 에디터 | P2 | 사실 기반 (lazer, Etterna에 존재) + 개발 비용 판단은 의견 (1차는 고정 위치+ON/OFF 권장) |
