# 모바일/터치 리듬게임 UI/UX 모범 사례 (BanG Dream! GBP, Project SEKAI, Cytus II, Arcaea, Phigros, Deemo II, Lanota, Love Live! SIF)

조사 방법/한계 메모: Fandom(arcaea/phigros)은 WebFetch가 HTTP 402로 막혀 직접 열람 못 함. 나무위키(en.namu.wiki), SEGA/Bushiroad 공식 FAQ 인용 기사, 일본 공략 위키(masa-game 등), Wikipedia, CG WORLD를 주로 사용. "색상 코드/픽셀 위치" 같은 시각 레이아웃 디테일은 텍스트 소스로는 거의 확인되지 않음 -> Gaps에 명시. 검색 요약(WebSearch)에서만 나온 항목은 "[검색요약]"으로 표시, 원문 미확인.

---

## 1. Song select (레이아웃, 자켓, 난이도 칩/색, 레벨 숫자, 클리어/FC/AP 배지, 프리뷰, 즐겨찾기/필터)

### Takeaway
확인된 것은 구조/정렬/난이도 체계 수준이다. Phigros는 "상하 스와이프로 곡 전환 + 자켓 탭으로 시작 + 좌하단 난이도 인디케이터 탭으로 난이도 전환" 구조, Cytus II는 곡이 아닌 "캐릭터 중심" 선곡 구조가 가장 특징적이다. 난이도 색/배지의 정확한 시각 사양은 텍스트 소스에서 확인하지 못했다.

### Cited Findings
- Phigros 선곡: 위/아래 스와이프로 곡 전환, 자켓(곡 일러스트)을 탭하면 플레이 시작, 좌하단의 난이도 표시기를 탭해 난이도 전환, "Random" 버튼 존재. 난이도명 EZ/HD/IN/AT(+SP, Legacy), 레벨 1~17(정수 레벨 + 소수점 정의 "정수 레벨/定数"). — [Phigros Wiki(萌娘百科 미러, killkpa.miraheze)](https://killkpa.miraheze.org/wiki/Phigros)
- Phigros: 곡 정렬(제목/난이도/스코어)과 랜덤 선곡 지원, Collection(팩) 단위로 곡 묶음. — [NamuWiki Phigros](https://en.namu.wiki/w/Phigros)
- Phigros 결과 점수 등급이 V(FC 포함 표기 "파란 V")·S·A·B·C·F·φ 체계. 나무/미러 소스에 따라 FC V 색 표기가 다름(파랑 vs 흰색). — [Phigros Wiki 미러](https://killkpa.miraheze.org/wiki/Phigros) 및 [검색요약: ZOL/PConline 등 보도](https://game.zol.com.cn/1016/10165643.html) (인코딩 깨져 ZOL 본문은 직접 확인 불가)
- Cytus II 선곡은 "앨범/팩"이 아니라 "캐릭터" 중심. 캐릭터 레벨이 오르면 곡 해금, 레벨 락 존재. 난이도: EASY(1~6) / HARD(4~10) / CHAOS(8~16) / GLITCH(12~16), 10부터 "+" 세분화. 별도 CRASH 곡은 그리스 문자(α, β, γ)로 레벨 표기. CHAOS/GLITCH 난이도 버튼을 길게 누르면 MASTER 모드 진입 프롬프트. — [NamuWiki Cytus II](https://en.namu.wiki/w/Cytus%20II)
- Cytus II: 최대 난이도가 2.0 이후 9->10, 5.2에서 15->16으로 상향(레벨 인플레이션을 UI 숫자 체계로 흡수). — [NamuWiki Cytus II (2부)](https://en.namu.wiki/w/Cytus%20II)
- Arcaea 선곡: v4.4.6에서 음악 검색 추가(한국어 제목 및 일본곡 한국어 번역명 지원). 곡 자켓을 탭하면 리더보드 뷰 전환(나무위키는 "unfriendly UI"로 서술). 난이도: Past/Present/Future/Eternal/Beyond, 1~12 + "+" 변형. 성적 배지: AA/EX/EX+, FR(Full Recall)/PM(Pure Memory). 설정에서 "FR/PM indication" 위치(Top/Combo/Disabled) 선택. 색약 보정 옵션이 우측 arc 색(빨강 <-> 노랑)과 일부 곡의 RED/YELLOW 난이도 명칭까지 바꿈. — [NamuWiki Arcaea](https://en.namu.wiki/w/Arcaea), [NamuWiki Arcaea/설정](https://en.namu.wiki/w/Arcaea/%EC%84%A4%EC%A0%95), [Wikipedia Arcaea](https://en.wikipedia.org/wiki/Arcaea)
- Arcaea 설정 진입점: 메인/선곡 화면 상단 중앙의 파트너 아이콘 우측 버튼. — [NamuWiki Arcaea/설정](https://en.namu.wiki/w/Arcaea/%EC%84%A4%EC%A0%95)
- Lanota 난이도: Whisper/Acoustic/Ultra/Master(Ultra A랭크 이상 등으로 해금). 난이도 선택창에서 일러스트를 슬라이드하면 원본 -> 스케치/세피아 버전이 보이고, 곡 6개 챌린지 중 3개 초과 클리어 시 일러스트 변화. Notalium(곡 해금 재화) 컴파트먼트를 터치하면 맑은 효과음. — [NamuWiki Lanota](https://en.namu.wiki/w/Lanota)
- DEEMO II 난이도: Easy/Normal/Hard/Expert(일부)/Special(일부, 4.0 추가). 곡 팩은 Sound Stones로 구매. 선곡 레이아웃 자체는 소스에 서술 없음. — [NamuWiki DEEMO II](https://en.namu.wiki/w/DEEMO%20II)
- Project SEKAI 난이도: Easy/Normal/Hard/Expert/Master + 일부 곡 APPEND(3손가락 이상 요구). 곡마다 3DMV/2DMV/Original MV/Lite(정지 2D 배경) 구분. — [Wikipedia Project SEKAI](https://en.wikipedia.org/wiki/Hatsune_Miku:_Colorful_Stage!)

### Inferences
- 선곡에서 "자켓 = 터치 타깃 1순위, 난이도 = 별도의 작은 칩/인디케이터"(Phigros)가 기본 문법. 스텔라이브 VTuber 커버곡은 자켓 대신 "멤버 얼굴/모델 컷"을 같은 자리에 쓰면 캐릭터 정체성을 선곡 단계부터 줄 수 있다.
- Cytus II의 "캐릭터 = 곡 컨테이너"는 멤버별 곡 컬렉션(멤버 선택 -> 그 멤버 커버곡) 구조에 직접 대응 가능.
- 난이도 최대값 인플레이션은 숫자 체계(+ 표기, 소수 정의 등)로 흡수하는 패턴이 반복됨 -> 초기부터 "+" 세분화 여지를 두는 것이 안전.
- 색약 대응(Arcaea의 arc 색 전환)은 비싼 구현이 아니면서 접근성 사례로 인용 가치 큼.

### Gaps
- 모든 게임의 난이도 칩 색상 코드, 클리어/FC/AP 배지 아이콘 형태, 프리뷰 자동재생 규칙, 즐겨찾기/필터 UI 위치: 텍스트 소스로 확인 불가(Fandom 접근 차단). 이미지 소스(공식 스토어 스크린샷/유튜브)로 별도 확인 필요.
- Project SEKAI/BanG Dream!의 선곡 화면(캐러셀 vs 리스트) 구조: 확인 못함(나무위키 BanG Dream 본문이 System 하위 문서로 분리되어 있음).
- Love Live! SIF/SIF2 선곡 UI: 검색에서 관련 정보 거의 없음.

---

## 2. In-game HUD (생명/게이지, 점수, 콤보, 판정, 일시정지, 진행도, 배경 처리, FAST/LATE, 판정색)

### Takeaway
확인된 핵심: (1) 콤보 숫자 색 자체를 "FC/MM 가능성 상태 표시기"로 쓰는 Cytus II, 판정선 색을 상태 표시기로 쓰는 Phigros(AP 금/FC 파랑/miss 후 흰색) 같은 "HUD 요소 재활용" 패턴, (2) 실수 터치 방지용 일시정지(Phigros 더블탭, Arcaea 1탭/더블탭/길게/비활성 선택), (3) FAST/LATE는 모든 게임에서 PERFECT 이하 판정에만, 설정 on/off 가능. 점수/콤보의 정확한 화면 좌표나 배경 dim 수치는 확인하지 못했다.

### Cited Findings
**콤보/판정선을 상태 표시기로 사용**
- Cytus II: 콤보 색이 노랑 = Million Master 가능, 파랑 = FC 가능(MM 불가), 흰색 = FC 불가. 판정선 속도가 바뀌면 "SPEED UP"(빨강)/"SPEED DOWN"(파랑) 표시. 노트 색은 판정선 진행 방향(하행/상행)에 따라 구분(Click: 하행 하늘색/상행 청록, Drag: 보라/남색, Hold: 진홍/보라, Swipe: 파랑/연두, Overpage: 금색). 배경은 검정, 판정선은 흰색(전작은 반대)이며 "가시성 향상"으로 서술. — [NamuWiki Cytus II](https://en.namu.wiki/w/Cytus%20II)
- Cytus II 판정 텍스트: C.Perfect = 선명한 노랑 + 네온 효과, Perfect = 레몬색 텍스트(덜 화려), Master 모드 한정 최상위 "Master" 판정, Master 모드는 Good/Bad 등 하위 판정에 FAST/SLOW 라벨(Miss 제외). TP는 소수 셋째 자리까지 절삭, Master 모드는 진행 중 %를 소수 둘째 자리로 표시. — [NamuWiki Cytus II](https://en.namu.wiki/w/Cytus%20II)
- Phigros: "FC/AP 인디케이터" 켜면 판정선 색이 현재 성적을 반영 — 금색 = AP(φ) 유지, 파랑 = FC 유지(Good 시), Bad/Miss 후 흰색. 판정 이펙트 색은 Perfect 금색, Good 파랑, Bad 노트는 어두운 붉은색으로 변하며 사라짐. 판정선 자체가 이동/회전/분할 가능한 "laneless" 구조. 일시정지는 오터치 방지로 **두 번 탭**해야 함. — [Phigros Wiki 미러](https://killkpa.miraheze.org/wiki/Phigros), [NamuWiki Phigros](https://en.namu.wiki/w/Phigros), [검색요약 ZOL 등](https://game.zol.com.cn/1016/10165643.html)

**일시정지 / 수명 / 게이지**
- Arcaea "Pause button type": One tap(기본) / Double tap / Press and hold(약 0.5초) / Disabled(버튼 자체가 사라짐). — [NamuWiki Arcaea/설정](https://en.namu.wiki/w/Arcaea/%EC%84%A4%EC%A0%95)
- Arcaea: 플레이 화면 하단 중앙에 멀티플레이 아이콘, 노트는 3D 키보드형 레이아웃(지상 4레인 + 공중 arc/sky). 게이지 존재(Hard gauge는 파트너 스킬). 결과 점수 배경이 이론치 달성 시 파랑, 아니면 회색. — [NamuWiki Arcaea](https://en.namu.wiki/w/Arcaea)
- Arcaea 점수는 타이밍 정확도만 반영(만점 10,000,000 + 노트 수), Recollection Rate는 점수와 별개. [검색요약, Arcaea Fandom 스니펫이라 원문 미확인] — [Arcaea 검색결과](https://arcaea.fandom.com/wiki/Interface_and_Features_(Mobile))
- Project SEKAI: 시작 체력 1,000(캐릭터 스킬로 최대 2,000까지 회복). 판정 가중치 PERFECT 100% / GREAT 70% / GOOD 50% / BAD·MISS 0%, 옐로 노트는 2배, 콤보 100마다 +1%(최대 10%), FEVER 중 1.5배. 컷인/스킬 표시/배경 밝기 등이 HUD 가독성 옵션으로 분리. — [Wikipedia Project SEKAI](https://en.wikipedia.org/wiki/Hatsune_Miku:_Colorful_Stage!), [NEK0 note](https://note.com/nek0games/n/nf048bd9094ba)
- Lanota: 중앙 디스크가 이동/회전/크기 변경. TUNE은 파란 디스크, PURIFY는 빨강. PURIFY에서는 화면 하단에 이퀄라이저형 게이지(미스 시 파랑 -> 빨강), 디스크 파괴 = 게임 종료. 노트: 흰 Click, 빨강(안쪽)/초록(바깥쪽) Flick, 파랑 Catch/Rail, 동시 노트는 흰 테두리. 판정 Harmony+/Harmony/Tune/Fail. — [NamuWiki Lanota](https://en.namu.wiki/w/Lanota)
- DEEMO II: 판정 3단계(Charming Hit/Normal Hit/Miss), 낙하 속도를 일시 변화시키는 "Shift signals", Sudden(노트 커버) 양을 설정에서 직접 지정 가능(2.0). — [NamuWiki DEEMO II](https://en.namu.wiki/w/DEEMO%20II)

**FAST/LATE (SLOW)**
- BanG Dream! GBP: 2021년 FAST/SLOW 표시 추가. 옵션 > "ライブ演出・音量設定" > ライブ演出 > "FAST/SLOW 表示"에서 ON/OFF. GREAT/GOOD/BAD일 때 PERFECT 대비 빠르면 FAST, 늦으면 SLOW로 라이브 중과 결과 화면에 표시. — [Bushiroad FAQ](https://bang-dream.bushimo.jp/faq/), [4Gamer 2021-08-11](https://www.4gamer.net/games/356/G035692/20210811022/), [Gamebiz](https://gamebiz.jp/news/331002) (FAQ 문장은 검색요약 경유, 4Gamer/Gamebiz는 열람 실패로 헤드라인만 확인)
- Project SEKAI: 판정선보다 위에서 치면 FAST, 아래에서 치면 LATE, 차이가 클수록 판정 하락(GREAT/GOOD/BAD). 설정 항목 "LATE/FAST/FLICK 表示" 존재. — [AppMedia/Gamerch 검색요약](https://gamerch.com/pjsekai/183586), [masa-game 옵션표](https://www.masa-game.com/option/)
- Arcaea: "Pure Late/Early" 옵션 = Pure 판정 중 ±25ms 이상 벗어난 경우에만 Late/Early 표시, 위치는 Top/Middle(기본)/Bottom 중 선택. Far는 Early/Late 분리, 결과창에서 판정 수 탭 시 FAST/SLOW 수치. — [NamuWiki Arcaea/설정](https://en.namu.wiki/w/Arcaea/%EC%84%A4%EC%A0%95), [NamuWiki Arcaea](https://en.namu.wiki/w/Arcaea)

**배경 처리/이펙트 vs 가독성**
- Project SEKAI 배경 모드: 3DMV(3D 애니 뮤비)/2DMV/Original MV/Lite(정지 2D). 클로즈드 베타 리뷰는 2DMV 곡에서 화면 중앙에 MV가 재생된다고 서술. 플레이 중 "배경 밝기"와 "레인 불투명도"는 개인차가 크므로 직접 조정 권장. — [Wikipedia Project SEKAI](https://en.wikipedia.org/wiki/Hatsune_Miku:_Colorful_Stage!), [검색요약 AppMedia/Gamerch](https://gamerch.com/pjsekai/183586)
- Phigros: 배경 밝기 슬라이더를 최좌측으로 내리면 배경 완전 off(검색요약).  — [ZOL/PConline 검색요약](https://game.zol.com.cn/1016/10165643.html)
- Project SEKAI 커뮤니티 권장값(작성자 개인 의견): 배경 밝기 50%, 레인 불투명도 100%, 탭 이펙트 "절제", 컷인 OFF, FEVER 연출 "경량", 스킬/활약 표시 OFF, 동시 누름 라인 ON. — [masa-game 옵션표](https://www.masa-game.com/option/)
- Lanota: 배경이 스케치 상태로 시작해 곡이 진행될수록 컬러로 채워짐(연출을 시간에 따른 점진적 공개로 처리). — [NamuWiki Lanota](https://en.namu.wiki/w/Lanota)

### Inferences
- "상태를 HUD 요소 색으로 흡수"(콤보 숫자 색/판정선 색)는 별도 위젯 없이 FC/AP 압박을 전달하는 효율적 패턴. 스텔라이브 게임에도 판정선 또는 콤보 색을 FC/AP 상태 표시기로 쓰면 화면을 덜 어지럽힌다.
- 모든 게임이 FAST/LATE를 "Perfect 이하 또는 일정 ms 초과"에만 표시하고 on/off 옵션을 둠 -> 기본 Off 또는 PERFECT 미표시가 시각 소음을 줄이는 관행.
- 일시정지 오터치 방지(더블탭/길게 누르기/비활성)는 터치 리듬게임의 필수 옵션 수준.
- 배경 일러스트/영상이 핵심 IP 가치인 게임(Project SEKAI, 스텔라이브)은 "배경 밝기" + "레인 불투명도"를 사용자 옵션으로 노출하고, 커뮤니티가 실제로 밝기를 낮추는 쪽으로 튜닝한다는 점(기본값을 어둡게 잡거나 레인 뒤 반투명 패널을 두는 설계 근거). (추론: 소스는 사용자 권장값이며 공식 기본값 아님)

### Gaps
- 점수/콤보/게이지/일시정지 버튼의 정확한 화면 위치와 크기, 노트 영역 확보 비율: 텍스트 소스에서 확인 불가. 스크린샷 분석 필요.
- BanG Dream! GBP의 HUD(스코어 바, 라이프, 콤보 위치)와 3D 라이브 배경 dim 처리: 확인 못함.
- 판정 텍스트 색(Project SEKAI/GBP)의 공식 사양: 확인 못함.
- Deemo II/Arcaea의 배경 dim/blur 사양: 확인 못함.
- Love Live! SIF/SIF2 HUD: 신뢰할 소스 없음.

---

## 3. Result screens (표시 항목/공개 순서, 랭크, 신기록, 보상, 판정 분류, 정확도 그래프)

### Takeaway
공통적으로 "라벨(ALL PERFECT/FULL COMBO/LIVE CLEAR, FC 등) -> 스코어/랭크 -> 판정 카운트" 흐름이며, 캐릭터가 코멘트로 결과를 평가하는 연출(Cytus II)이 IP형 게임에 적합한 선례다. 정확도 그래프 같은 시각화는 확인되지 않았다.

### Cited Findings
- Project SEKAI: 곡이 끝나면 암전 직전에 ALL PERFECT / FULL COMBO / LIVE CLEAR 중 하나가 화면에 표시된 뒤 최종 결과 화면에서 획득 스코어 확인. — [NEK0 note](https://note.com/nek0games/n/nf048bd9094ba), [검색요약 AppMedia 외](https://appmedia.jp/pjsekai/5483044)
- Cytus II: 랭크 Million Master/S/A/B/C/Failed(스코어 기준), Master 모드는 Clear/Failed(M.TP 기준). FC는 Max Combo 위치에 무지개색 다이아몬드로 표시. Million Master 달성 시 마지막 판정 직후 이펙트. 공유(Share) 시 캐릭터의 평가 메시지가 첨부(1.7 업데이트): 고랭크는 칭찬, B는 격려, C/Fail은 꾸짖음/슬퍼함. — [NamuWiki Cytus II](https://en.namu.wiki/w/Cytus%20II)
- Phigros: 결과에 점수, 랭크, 최대 콤보, 정확도(Accuracy), 판정별 개수 표시. 랭크는 φ(1,000,000) > V > S(920,000~959,999) > A(880,000~919,999) ... (소스간 V 구간/색 표기 차이 있음). RKS(랭킹 스코어)가 난곡 정확 플레이로 상승. — [Phigros Wiki 미러](https://killkpa.miraheze.org/wiki/Phigros), [검색요약 ZOL/PConline](https://game.zol.com.cn/1016/10165643.html), [NamuWiki Phigros](https://en.namu.wiki/w/Phigros)
- Arcaea: 결과 화면에서 판정 카운트 탭 시 FAST/SLOW 수치. 점수 배경이 이론치 달성 시 파랑/미달 시 회색. — [NamuWiki Arcaea](https://en.namu.wiki/w/Arcaea)
- BanG Dream! GBP: 결과 화면에도 FAST/SLOW 표시(옵션 ON 시). — [Bushiroad FAQ(검색요약)](https://bang-dream.bushimo.jp/faq/)
- DEEMO II: 점수 = 판정 80% + 콤보 20%. FC/AC(All Charming) 라벨 표시. 결과가 맵 탐험 "수리 진행도"에 직결되고 스킬 값은 상위 30곡 기준. — [NamuWiki DEEMO II](https://en.namu.wiki/w/DEEMO%20II)
- Lanota: 결과 라벨 "Tuned/Purified/All Combo/Perfect Purified", 점수별 랭크 아이콘(L/S/A/B/C/D, 파일명 기반 추정). 챌린지 전부 클리어 시 우상단에 "CHALLENGE ALL COMPLETED" 문구, 아니면 "MORE TO CHALLENGE" 상형문자. — [NamuWiki Lanota](https://en.namu.wiki/w/Lanota)

### Inferences
- 결과 공개 순서의 공통 문법: (1) 곡 종료 직후 상태 라벨(AP/FC/CLEAR) 짧게 -> (2) 점수/랭크 -> (3) 세부 판정. 스텔라이브 게임은 (1)에서 멤버 일러스트/음성 리액션을 얹는 구성이 자연스럽다.
- Cytus II의 "랭크별 캐릭터 대사"는 낮은 랭크에서도 감정 톤을 다르게 설계한 사례. VTuber 멤버 음성/표정 차분 구성에 적용 가능(추론).

### Gaps
- 결과 화면 요소의 정확한 애니메이션 순서·시간, 신기록(New Record) 연출, 보상 표시 방식, 정확도 그래프 존재 여부: 확인 못함.
- Project SEKAI/GBP의 결과 화면 구성(경험치/드롭/랭킹 등): 소스 없음.

---

## 4. Settings (노트 속도/크기, 판정·오디오 오프셋 캘리브레이션 흐름, 배경 밝기/dim, 이펙트 on/off)

### Takeaway
설정은 이 조사에서 가장 근거가 잘 확인된 영역. 공통 패턴: 노트 속도 소수 1자리 조정, 오프셋은 "탭해서 자동 계산(탭으로 조정)" + "미리보기 보며 수동 미세조정" 병행, 시각 이펙트 강도는 개별 토글, 오디오 장치별(스피커/블루투스) 프리셋 오프셋(Arcaea).

### Cited Findings
**Arcaea** — [NamuWiki Arcaea/설정](https://en.namu.wiki/w/Arcaea/%EC%84%A4%EC%A0%95)
- Note speed 1.0~6.5, 0.1 단위. Offset -2000~2000ms, 1ms 단위, 120 BPM 비트를 이용한 자동 캘리브레이션 도구 제공(iOS 표기 "Recommended: 0"은 신뢰하지 말라는 주석). Audio preset: Speaker/earphone(기본) vs Bluetooth 각각 별도 오프셋 저장. Note sound volume 0~200%. Graphics quality Low/Med/High, Show touch effect(Disabled/In menu only/Enabled), Pure Late/Early 옵션(위 참조). 오프셋 범위가 -100~100을 벗어나면 note sound가 강제 0%.
- Switch판 위키: 설정 팝업이 3개 탭(Audio 포함), Setup 버튼 아래 캘리브레이션 마법사, 오디오 프리셋이 노트 볼륨과 오프셋을 보관. Note Speed/Offset은 로컬 저장(클라우드 비동기). [검색요약] — [Arcaea Fandom Interface (Switch)](https://arcaea.fandom.com/wiki/Interface_and_Features_(Switch)), [Device Offsets](https://arcaea.fandom.com/wiki/Device_Offsets)
- 배경 관련 설정은 나무위키 설정 문서에 기재 없음.

**Project SEKAI** — [masa-game 옵션표](https://www.masa-game.com/option/), [AppMedia/Game8/Gamerch 검색요약](https://appmedia.jp/pjsekai/5763314)
- 옵션 > 라이브 탭 > "タイミング調整". "タップで調整"(음에 맞춰 탭하면 자동 수치 산출)과 "プレビューを見ながら調整"(노트를 실제로 치며 수동 조정) 두 방식. 수동은 0.1 단위, +방향이면 노트가 빠르게/-이면 늦게 내려옴. 결과 화면의 FAST/LATE 경향(FAST 많음 -> +, LATE 많음 -> -)으로 보정하는 방법이 일반적으로 소개됨. 권장 범위 대략 -3~+3(커뮤니티 의견).
- 항목: ノーツの速さ(노트 속도, 숙련자 10.0~11.0/초보 8.0 시작 권장), ノーツスキン(사각/원), ロングノーツの不透明度(10~100%), ガイドの不透明度, ノーツSE, 背景の明るさ, レーンの不透明度, タップエフェクト, カットイン演出, FEVER演出(경량), スキル・活躍表示, 滑らかさ(FPS, 120FPS 지원), 同時押しライン, AP継続演出, LATE/FAST/FLICK 표시, ミラー譜面, タップ時の振動.
- 노트 속도를 올려도 곡이 빨라지는 것이 아니라 아이콘 간격이 넓어져 보기 쉬워짐. EXPERT 이상에서는 너무 느리면 오히려 빽빽해짐.
- 2023년 9월 UI 전면 개편: 약 200개 화면, 300개 이상 다이얼로그, 신규 UI 애니메이션 시스템, Unity Text -> TextMeshPro 전환. 목적은 "출시 3년차에도 낡아 보이지 않는 UI". — [CG WORLD](https://cgworld.jp/article/202405-cagc-proseka.html)

**BanG Dream! GBP** — [Bushiroad FAQ(검색요약)](https://bang-dream.bushimo.jp/faq/), [AppMedia 속도 글 검색요약](https://appmedia.jp/bang_dream/719605)
- 옵션 > ライブ演出・音量設定 > ライブ演出 > FAST/SLOW 표시. 노트 속도 0.1 단위 조정, 초보 8.0 전후/숙련 10.0 전후 시작 권장(커뮤니티). 레인 위쪽일수록 노트가 작아져 판정선보다 약간 위를 보면 고속 대응이 쉽다는 공략 설명. 판정 조정은 ±1.5 이상은 거의 쓰지 않는다는 블로그 의견(개인 의견).

**Phigros** — [NamuWiki Phigros](https://en.namu.wiki/w/Phigros), [Phigros Wiki 미러](https://killkpa.miraheze.org/wiki/Phigros), [ZOL/PConline 검색요약](https://game.zol.com.cn/1016/10165643.html)
- 설정: 노트 크기·너비 조정, 오프셋(谱面偏移)은 "오른쪽 영역에서 떨어지는 노트를 쳐서 판정선과의 정렬을 보며" 조정, 배경 밝기(0 = 배경 off), 저해상도 모드(저사양용), 기타 > 오디오 문제 해결, 프로필 아바타/배경 변경. 안드로이드는 타격음 지연을 수동 조정 못 해 타격음을 끄는 경우가 많음(검색요약).

**Cytus II / DEEMO II / 기타**
- Cytus II: 노트 크기 조정 옵션 존재(나무위키). 데이터 리셋 버그로 "judgment settings" 재조정이 필요했던 사례가 있어 판정 설정이 로컬/계정에 저장되는 별도 항목임을 시사. 오프셋/배경 dim 상세는 소스 없음. — [NamuWiki Cytus II](https://en.namu.wiki/w/Cytus%20II)
- DEEMO II: Sudden(노트 커버) 양 직접 설정(2.0), 고주사율 지원(4.1). 오프셋/배경 옵션 상세는 소스 없음. — [NamuWiki DEEMO II](https://en.namu.wiki/w/DEEMO%20II)
- Project SEKAI(커스텀 차트): 일본 서버 2026 예정, 제작자가 FC 또는 AP를 달성해야 업로드/공유 가능(품질 게이트). — [Wikipedia Project SEKAI](https://en.wikipedia.org/wiki/Hatsune_Miku:_Colorful_Stage!)

### Inferences
- 오프셋 UX의 업계 표준 = (a) 숫자 직접 입력/슬라이더 + (b) 탭 기반 자동 측정 + (c) 실제 노트 프리뷰. 여기에 FAST/LATE 결과를 보고 보정하는 사용자 학습 경로까지 이어지는 것이 PJSK에서 확인됨. 스텔라이브 게임도 "첫 실행 시 캘리브레이션 -> 이후 결과 화면 FAST/LATE 분포로 재조정 유도" 구성이 합리적.
- 장치별 오프셋 프리셋(Arcaea의 블루투스/스피커 분리)은 모바일 필수 기능 후보.
- 배경이 핵심 가치인 게임이므로 "배경 밝기 + 레인 불투명도 + 이펙트 강도(탭 이펙트/컷인/FEVER)" 3축 분리가 PJSK 선례. 한 슬라이더로 통합하지 않고 분리하는 쪽이 사용자 튜닝 폭이 큼(추론).

### Gaps
- Arcaea/Cytus II/Deemo II의 배경 dim 슬라이더 존재 여부와 수치: 확인 못함(Arcaea는 나무위키 기준 없음).
- Cytus II 오프셋 캘리브레이션 흐름(UI 순서): 확인 못함.
- GBP 설정 화면의 전체 항목/범위: 공식 FAQ 일부만 확보(배경 밝기 등 미확인).
- SIF/SIF2 설정: 소스 없음.

---

## 5. Visual language (팔레트, 타이포, 캐릭터 아트 통합, 글로우/파티클, 가독성을 해치지 않는 축하 연출)

### Takeaway
확인된 근거는 소수. 캐릭터 IP 통합 방식으로 (a) 캐릭터 레벨이 곡 해금과 결합(Cytus II), (b) 결과 공유 시 캐릭터 평가문(Cytus II), (c) 3D/2D MV·라이브 영상을 곡 배경으로 직접 사용(Project SEKAI), (d) 시간에 따라 채색되는 일러스트(Lanota)가 확인됐다. 팔레트/폰트 사양은 확인 못함.

### Cited Findings
- Project SEKAI: 3DMV, 2DMV, Original MV, Lite 등 곡별 배경 레벨. Virtual Shows/Connect Live는 3D 라이브 연출이며 콜&리스폰스 버튼이 곡 중 정해진 지점에 등장. 스토리 파트는 Live2D 2.5D 이동. 핵심 UI 개편에서 목표는 "몰입감". — [Wikipedia Project SEKAI](https://en.wikipedia.org/wiki/Hatsune_Miku:_Colorful_Stage!), [CG WORLD](https://cgworld.jp/article/202405-cagc-proseka.html)
- Cytus II: 흑색 배경 + 흰 판정선으로 전작(반대 배색) 대비 "현대적/가시성 향상"으로 평가. C.Perfect 네온 효과 텍스트, 랭크별 캐릭터 평가, FC는 무지개 다이아몬드. — [NamuWiki Cytus II](https://en.namu.wiki/w/Cytus%20II)
- Lanota: Taiwan 일러스트레이터 atsushi의 그림책풍 일러스트, 배경이 스케치 -> 컬러로 진행. — [NamuWiki Lanota](https://en.namu.wiki/w/Lanota)
- DEEMO II: 3D 모델을 카툰 렌더링(2D 애니메이션풍), 물 테마의 이펙트/배경, 지브리 비교 평가, 스토리 컷신 풀보이스. — [NamuWiki DEEMO II](https://en.namu.wiki/w/DEEMO%20II)
- Arcaea: 일러스트레이터 Cierra의 키비주얼/세계관, lowiro가 일본 일러스트레이터를 위촉해 스타일 통일, 곡 보컬/템포/커버 아트를 스토리 테마(Hikari/Tairitsu)에 맞춰 조정. 평탄한 탑다운 대신 공중 arc로 몰입감을 노림. 2026 기준 500곡 이상. — [Wikipedia Arcaea](https://en.wikipedia.org/wiki/Arcaea)
- Cytus 시리즈 핵심은 상하로 움직이는 Active Scan Line이며 Cytus II는 곡 중 스캔 속도 변화(속도 변화는 판정선의 SPEED UP/DOWN 컬러로 안내). — [Wikipedia Cytus](https://en.wikipedia.org/wiki/Cytus), [NamuWiki Cytus II](https://en.namu.wiki/w/Cytus%20II)
- Project SEKAI 요소 설정(컷인/FEVER 연출/스킬 표시/탭 이펙트)이 개별 토글로 존재 = 연출이 가독성을 해칠 수 있음을 제작사도 전제. — [masa-game 옵션표](https://www.masa-game.com/option/)

### Inferences
- "축하 연출을 판정 가능한 영역 밖/종료 후로 이동"하거나(PJSK 암전 직전 라벨, Cytus II 마지막 판정 직후 MM 이펙트) 사용자 토글로 줄일 수 있게 하는 것이 공통 해법. 스텔라이브 게임: 곡 중 이펙트는 최소화, 곡 종료 직후·결과 화면에 멤버 일러스트/음성 연출 집중이 안전.
- 캐릭터-기능 결합(레벨/해금/평가 대사)이 IP 게임의 리텐션 장치. 멤버 6~9인 구조에 선곡 컨테이너를 대응시키는 설계 근거.
- 팔레트: 소스 부족으로 일반화 불가. 판정 색은 금(Perfect/AP) > 파랑(FC/Good) > 흰/회(약한 판정)의 서열이 Phigros/Cytus II 모두에서 관찰됨(두 게임 간 유사한 경향이라는 추론).

### Gaps
- 각 게임의 팔레트(헥스), 타이포(폰트), 글로우/파티클 파라미터: 텍스트 소스에서 확인 불가.
- Project SEKAI UI 팀 직접 인터뷰("おしごとパレット" UIチーム 기사): 제목만 발견, 본문 미열람. BanG Dream! 개발진 인터뷰도 미확보.
- Love Live! SIF/SIF2의 시각 언어(아이돌 아트 통합): 검색에서 신뢰할 소스 없음 -> 미조사로 남김.
- Reddit(r/bangdream, r/ProjectSekai, r/Cytus, r/arcaea) 실사용자 불만/선호 스레드: 이번 조사에서 접근/수집 못함.
