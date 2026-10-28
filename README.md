# LOVE DIVE · 러브 다이브

롤플레이 페어 관계를 12축으로 판정한 코드(`ABYSS-XXXX-XXXX-XXXX-XX`)를 입력하면,
그 무게만큼 측심추가 바다에 가라앉고 최종 수심(m)·구간·칭호를 보여 주는 정적 사이트.

```bash
npm install
npm run dev      # 개발 서버
npm test         # Vitest (기준 테스트 벡터 포함)
npm run check    # svelte-check 타입 검사
npm run build    # dist/ 를 그대로 정적 호스팅 (base: './' 라 하위 경로 OK)
```

`main` 에 푸시하면 `.github/workflows/pages.yml` 이 테스트 후 GitHub Pages 로 배포한다
(처음 한 번 Settings → Pages → Source 를 "GitHub Actions" 로 지정).

## 구조 (FSD 라이트)

| 레이어 | 내용 |
|---|---|
| `app/` | 엔트리, 해시 라우터(없음 = 입력, `#dive-<token>` = 결과), 글로벌 스타일·토큰 |
| `pages/` | `input`(하늘·수면 히어로 + 코드 받기[AI 프롬프트 / 셀프 테스트] + 측정 폼), `dive`(연출 + 결과) |
| `widgets/dive-scene` | 타임라인(순수 함수), 캔버스 입자, 생물 SVG, 수심 게이지, 측심추 |
| `widgets/result-card` | 결과 카드(타로·우표 감성, 깊이별 테마)와 결과 해설 |
| `features/` | `decode-code`, `share-result`(토큰·링크·이미지 저장), `ooc-prompt`(프롬프트 복사), `self-test`(24문항 셀프 테스트), `pair-image` |
| `entities/abyss` | `codec` · `depth` · `zones` · `archetype` · `temperature` · `pair` · `measure` |
| `shared/` | FNV-1a, 이징, 시드 RNG, WebAudio 효과음, 인코딩 테이블 복원, 문구 풀(`config/copy.ts`) |

치환표·가중치·계수 원본은 `tools/abyss-tables.source.ts`에만 있고, Vite 플러그인이 빌드 시
XOR + 역순 base64로 인코딩해 `virtual:abyss-tables`로 넘긴다. 번들에는 평문 테이블이 없다.

## 설계 메모

- **예시 코드 감지**: 노이즈까지 포함해 `ABYSS-9TAT-YJUZ-52DW-QK`와 완전히 같을 때만 안내.
  슬롯이 같고 노이즈가 다르면 정상 측정한다.
- **형식 vs 신호 오류**: 영숫자가 아닌 문자(`?` 등)는 `ERR_FORMAT`, 영숫자지만 해당 슬롯 표에
  없는 문자는 `ERR_SIGNAL`. 유저에겐 같은 문구로 보인다. 구분자 없는 19자 연속 입력·코드블록·
  앞뒤 잡문도 허용한다. AI 답변(해설 + 코드블록)을 통째로 붙여넣으면 코드 모양 덩어리 중 마지막 것을 읽는다.
- **표 오독 허용**: AI 가 다른 축 줄의 문자를 넣는 일이 잦아, 표에 없는 문자가 1~2칸이면 그 축만 4(근거 부족)로 읽고 측정한다. 3칸 이상이면 `ERR_SIGNAL`.
- **칭호 동점 처리**: 금기·신뢰는 가중치가 없어 우선순위를 `obs > dep > clo > ruin > irr > tab >
  den > lack > sac > tru`로 정했다. 2위 자리에 동점이 여럿이면 가능한 조합을 모두 후보로 두고
  표의 우선순위가 높은 칭호를 고른다. 상위 2개 축이 모두 5 이상일 때만 칭호가 붙는다
  (4는 '근거 부족' 기본값). 부유는 항상 `부표`, 측정 불가는 `해저 아래`.
- **페어 이름**: `× x / & + ♡ ,` 등을 구분자로 통일한다. 알파벳 `x`는 양옆이 라틴 문자가 아닐
  때만 구분자로 본다(`Alex x Max`는 분리, `Rex`는 그대로).
- **카운트다운**: 측정하면 3·2·1·LOVE DIVE! 후 추가 다이빙대에서 뛰듯 살짝 솟았다가 떨어진다 (easeInBack).
- **연출 길이**: `3 + 9·√(depth/10935)`초 (최소 3s, 최대 12s). 천천히 가라앉는 맛이 나도록 길게 잡았다. 카운터 이징은
  `1 − (1−t)⁴(1+4t)` — 정지에서 출발해 t=0.25에 최고 속도, 이후 길게 감속.
- **효과음**: 에셋 없이 WebAudio로 합성 (카운트다운·입수·수중 드론·구간 핑·고래·착저·글리치). 처음 연출 전에 소리를 켤지 묻는다.
- **셀프 테스트**: 12축 × 2문항(일부 역문항), 5점 척도. 축마다 두 답의 합(0~8)을 0~9로 환산하고,
  정중앙은 OOC의 '근거 부족 = 4'에 맞춰 4로 내린다. 노이즈 2자리는 무작위.
- **페어 이미지**: 배경 없는 PNG만 받는다. 연출과 결과 카드에서 하트 측심추 대신 측심줄에 매달려 가라앉는다. 긴 변 720px로 줄여 메모리에만 두고, 함께 측정한 결과에만 붙인다. 서버·URL로 보내지 않으므로 공유 링크로 열면 이미지는 없다.
- **결과 링크**: `#dive-<16진수>` 해시에 코드와 페어 이름이 담겨, 받은 사람도 같은 연출과 결과를 본다.
- **결과 카드 분위기**: 구간별 테마(표층·부유 → 박광층 → 점심해 → 심해저·초심해)로 종이색·선색·물빛이 바뀐다. 얕을수록 밝은 크림 종이에 굵은 숫자, 깊을수록 남색·검정 종이에 가는 숫자.
- **서체**: 로고(LOVE DIVE)만 Fredoka, UI는 전부 Pretendard Variable. 결과 카드의 수심 숫자·카드 번호는 Cormorant Garamond, 칭호·한 줄 문구는 고운바탕.
- **결과 카드 디자인**: 타로 카드·우표 감성. 구멍 난 우표 가장자리(mask), 두 겹 테두리, 아치 창(물속 장면·페어 이미지), 이름패, 반짝이 장식. 카드 번호는 구간 순서(부유 0 ~ 초심해 V, 측정 불가 ∞).
- **결과 해설(두 사람의 사랑의 무게)**: 4절 계산을 항목별로 쪼개 끌어내린 힘의 몫(축·시너지·금기 증폭)과 신뢰 부력을 보여 주고, 상위 축·시너지·일방성·금기·신뢰로 이유 문장을 만든다. 칭호·온도 근거도 함께. 상세 항목은 탭으로 '항목별 점수'(축 이름·짧은 뜻·점수 막대·현재 수준 문장)와 '무게 비율'을 오간다. 저장 이미지에는 넣지 않는다.
- **이미지 저장**: 카드 앞면(번호·아치 창·이름패·페어 이름)만 찍고, 절취선 아래 풀이는 뺀다. 깊이별 색 바탕 위에 그림자와 함께 4:5 비율로 올려 저장. html-to-image. 카드에 쓰인 글자가 포함된 웹폰트 조각만 골라 인라인하고,
  라이브 화면과 줄바꿈이 어긋나지 않도록 높이 계열 속성은 복제하지 않는다.

## 분포 보정 (수심 매핑)

원래 지수식 `MAX·(e^(2.2x)−1)/(e^2.2−1)` 그대로면 현실적인 페어(축마다 평균 5.2·표준편차 2.0)의
96%가 점심해에 몰리고, 전부 4점(근거 부족)도 1,477m가 된다. 그래서 무게 순위 `x`는 원래 공식
그대로 두고, `x → 수심`만 기준점 보간으로 바꿨다 (`tools/abyss-tables.source.ts`의 `CALIBRATION`).

| 구간 | 목표 비율 |
|---|---|
| 부유 | 3% |
| 표층 | 17% |
| 박광층 | 30% |
| 점심해 | 30% |
| 심해저 | 14% |
| 초심해 | 6% |

- 더 무거운 페어가 항상 더 깊다(단조 증가, 테스트로 보장).
- 전부 4점은 약 80m(표층), 기준 벡터 #1(x=0.6855)은 약 7,000m(초심해).
- 분포를 바꾸고 싶으면 `CALIBRATION` 기준점만 고치면 된다.

## 폰트·라이선스

모든 웹폰트는 SIL Open Font License 1.1(OFL) 폰트를 npm 패키지로 받아 번들에 함께 넣는다.
OFL은 웹 임베딩·재배포·상업적 이용을 허용하며, 폰트 파일 자체를 단독으로 판매하는 것만 금지한다.
폰트 파일을 수정하지 않았고, 원래 폰트 이름 그대로 쓴다.

| 폰트 | 쓰는 곳 | 저작권 | 라이선스 | 패키지 |
|---|---|---|---|---|
| [Pretendard](https://github.com/orioncactus/pretendard) | 본문·UI 전체 | © 2021 Kil Hyung-jin | OFL 1.1 | `pretendard` |
| [Fredoka](https://github.com/hafontia/Fredoka-One) | LOVE DIVE 로고 | © 2016 The Fredoka Project Authors | OFL 1.1 | `@fontsource/fredoka` |
| [Cormorant Garamond](https://github.com/CatharsisFonts/Cormorant) | 결과 카드 수심 숫자·카드 번호 | © 2015 The Cormorant Project Authors | OFL 1.1 | `@fontsource/cormorant-garamond` |
| [Gowun Batang](https://github.com/yangheeryu/Gowun-Batang) | 결과 카드 칭호·문구, 해설 제목 | © 2021 The Gowun Batang Project Authors | OFL 1.1 | `@fontsource/gowun-batang` |
| [IBM Plex Mono](https://github.com/IBM/plex) | 측정 코드·수심 HUD | © 2017 IBM Corp. | OFL 1.1 | `@fontsource/ibm-plex-mono` |

각 폰트의 라이선스 전문은 `node_modules/<패키지>/LICENSE`에 있다.
라이선스 원문: https://openfontlicense.org

그 밖의 주요 라이브러리: [Svelte](https://github.com/sveltejs/svelte)(MIT),
[html-to-image](https://github.com/bubkoo/html-to-image)(MIT). 그림(바다 생물·장식)은 전부 코드로 직접 그린 SVG·캔버스이며
외부 이미지 에셋은 쓰지 않는다.
