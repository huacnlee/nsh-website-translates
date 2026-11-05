---
title: "디자인 가이드"
description: "Native Shell로 만든 앱을 위한 제품 및 인터랙션 디자인 가이드: 계층 구조, 색상과 토큰, 간격, 밀도, 컴포넌트, 인터랙션 상태, 오버레이, 모션, 데이터 중심 뷰, 인터페이스 문구, 플랫폼 적합성을 다룹니다."
order: 29
group: ui
source_hash: 4296bdbce6ed3911
---

# 디자인 가이드

Native Shell로 만드는 앱의 컴포넌트를 고르거나 레이아웃 코드를 작성하기 전에 이 가이드를 참고하세요. 이 가이드는 GPUI Kit이 수년간 데스크톱 작업을 하며 쌓은 제품 판단을 NSH에 맞게 옮긴 것입니다. 인터페이스는 네이티브답고, 절제되어 있고, 정밀하며, 추측하지 않아도 이해할 수 있어야 합니다.

이 문서는 규범 가이드입니다. **Must(반드시)**는 정확성 또는 생태계 제약을 뜻하고, **should(권장)**는 재정의하려면 구체적인 이유가 필요한 기본값이며, **may(선택)**는 선택적인 기법입니다. 개별 props와 메서드에 대해서는 [Elements](../elements/index.md)와 [API](../modules/index.md) 페이지가 기준이 됩니다.

이 규칙은 `nsh/base`(Rust에서는 `nsh_base`)의 동작, 테마와 토큰, 그리고 각 플랫폼 사용자가 이미 알고 있는 상호작용을 기반으로 합니다. NSH는 각 플랫폼 고유의 UI로 렌더링하며 외형은 앱에 맡깁니다. `nsh/base`의 컴포넌트는 동작, 상태, 포커스, 접근성을 제공하고, 모든 색상, 크기, 반경, 간격은 앱 자체 컴포넌트에서 나옵니다. 따라서 이 규칙은 앱의 디자인 시스템을 안내합니다. <a href="https://ui.shadcn.com/docs" target="_blank" rel="noopener noreferrer">shadcn/ui</a>는 유용한 방법론(오픈 코드, 컴포지션, 믿을 수 있는 기본값)을 제공하지만 NSH 앱의 외형을 결정하지는 않습니다. 영향 요소들이 충돌하면 플랫폼의 동작과 사람들이 이미 이해하고 있는 상호작용을 우선하세요.

<a id="design-thesis"></a>

## 디자인 원칙

네이티브답고, 조용하고, 정밀한 인터페이스를 만드세요. 경험은 콘텐츠, 위계, 상호작용이 이끌게 하고, 장식은 이를 돕되 경쟁하지 않게 하세요.

1. **개성보다 명확성.** 브랜드 표현을 더하기 전에 주요 작업과 다음 행동을 분명히 하세요.
2. **발명보다 컴포지션.** 검증된 컴포넌트로 시작해 제품 고유의 워크플로로 조합하세요. 동작이 정말 새로운 경우에만 새 프리미티브를 만드세요.
3. **값보다 토큰.** 색상, 반경, 타이포그래피, 간격은 하나의 시스템을 이뤄야 합니다. 테마에 반응하지 못하는 개별 리터럴은 피하세요. [Styling](./styling.md), [Tailwind](./tailwind.md), [테마](./rust.md#theme)를 참고하세요.
4. **웹 관례보다 플랫폼.** 작업에 도움이 되는 곳에서는 키보드 접근, 윈도우 크롬, 메뉴, 밀도 높은 데이터 뷰, 크기 조절 가능한 영역, 지속적인 내비게이션을 데스크톱에서 유지하고, 휴대폰과 태블릿에서는 시스템의 헤더, 뒤로 가기 제스처, 알림, 터치 타깃을 유지하세요.
5. **상태는 눈에 보여야 합니다.** 호버, 눌림, 포커스, 선택, 비활성, 로딩, 유효성 검사, 파괴적 상태는 서로 구별되고 일관된 표현이 필요합니다.
6. **기하는 포함 관계를 설명합니다.** 표면이 겹치더라도 반경, 인셋, 경계는 하나의 일관된 위계를 나타내야 합니다.
7. **피드백은 현실을 반영합니다.** 로딩, 툴팁, 모션은 실제 상태나 전환을 명확히 하는 데 쓰고, 즉시 끝나는 동작에 의례적인 연출을 더하지 마세요.

<a id="learning-from-shadcn"></a>

## Shadcn에서 배우기

Shadcn의 가장 유용한 기여는 특정 테두리 색상이 아니라 시스템을 구축하는 방식입니다.

- 밀폐된 추상화와 싸우는 대신 인터페이스의 최상위 계층을 직접 소유합니다.
- 작고 예측 가능한 부품을 조합해 제품 고유의 컴포넌트를 만듭니다.
- 이미 하나의 시각 언어를 이루는 기본값을 제공합니다.
- 코드와 컴포지션을 사람과 AI 모두가 읽기 쉽게 유지합니다.
- 동작 프리미티브와 스타일 계층을 분리합니다.

NSH는 `nsh`의 프리미티브, `nsh/base`의 스타일 없는 기본 컴포넌트, 그리고 앱이 소유하는 스타일 계층으로 나누어 이 아이디어를 적용합니다([Three layers](./architecture.md#three-layers)). 애플리케이션은 TSX 또는 앱의 Rust 크레이트에서 `nsh/base` 위에 컴포넌트를 만들며, 재사용 가능한 동작은 `nsh/base`에 두고 시각 정책은 그 위에 둡니다.

다음 웹 가정을 무비판적으로 따라 하지 마세요.

| 웹 관행 | NSH 기본값 |
| --- | --- |
| 모든 버튼에 포인팅 핸드 커서 | 기본 커서 사용, 링크에만 포인팅 핸드(`cursor-pointer`) |
| 페이지 내비게이션을 주된 구조로 사용 | 데스크톱에서는 지속되는 윈도우, 패널, 사이드바, 탭, 메뉴, 휴대폰에서는 시스템 뒤로 가기가 있는 `NavStack` |
| 폴백으로서의 브라우저 포커스와 스크롤 | 명시적인 포커스 소유권과 영역 단위 스크롤(`Scroll`, `List`) |
| 모바일 우선 단일 열 | 휴대폰에서는 단일 열, 데스크톱에서는 최소 윈도우 크기가 정의된 크기 조절 가능한 셸 |
| 호버 시에만 나타나는 핵심 액션 | 호버에 의존하지 않고 키보드, 터치, 포인터로 접근 가능한 액션 |
| 호버 시에만 보이는 아이콘 버튼 행 | 눈에 보이는 주 액션과 보조 명령용 `Menu` 또는 `ContextMenu` |
| 애플리케이션 명령에 링크 스타일 텍스트 사용 | 앱의 default, outline, ghost 스타일의 `Button`, 링크 스타일은 URL, 웹 리소스, 이메일 주소에만 사용 |
| 모든 곳에서 넓은 터치 밀도 | 터치 화면에서는 터치 크기의 타깃, 포인터 환경에서는 중간 밀도, 정보 작업에 도움이 되는 곳에서만 compact |
| 모든 플랫폼에서 직접 그린 헤더와 알림 카드 | iOS와 Android에서는 시스템의 헤더와 `AlertDialog`, 데스크톱과 웹에서는 페이지의 `header` 슬롯 |
| 하위 요소 전반에 걸친 CSS 재정의 | 앱의 컴포넌트, 그 부품, 테마의 토큰 |

<a id="start-from-the-task"></a>

## 작업에서 시작하기

화면을 그리기 전에 다음을 적어 보세요.

- 사용자의 주요 작업
- 보거나 변경하는 대상 객체
- 항상 즉시 사용할 수 있어야 하는 액션
- 결정을 내리는 데 필요한 정보
- 빈 상태, 로딩, 오류, 오프라인, 읽기 전용, 권한 거부 상태
- 워크플로를 따라가는 키보드, 터치, 스크린 리더 경로
- 앱이 표시되는 위치: 독립 실행인지, 호스트 앱 내부인지

이 답을 중심으로 화면을 구성하세요. 대시보드 그리드나 컴포넌트 카탈로그에서 시작하지 마세요. 좋은 인터페이스는 내부 서비스 아키텍처가 아니라 문서, 계정, 프로젝트, 메시지, 설정처럼 안정적인 객체라는 사용자의 멘탈 모델을 드러냅니다.

컨트롤을 배치하기 전에 주요 작업부터 설계하세요. 시각적 비중, 위치, 정보 깊이는 제품에서의 중요도에 맞아야 합니다. 보조 콘텐츠가 페이지를 차지하는 동안 핵심 결과가 작은 숫자, 구석의 아이콘, 약한 푸터 액션으로 축소되어서는 안 됩니다. 결과 집합이 제품의 핵심 가치라면 개수, 대표 결과, 의미 있는 상태, 명확한 다음 행동을 보여 주는 요약 영역이나 카드를 고려하세요.

제안하는 모든 액션에 대해 눈에 보이는 대상, 현재 상태, 범위, 결과를 말할 수 있어야 합니다. 인터페이스가 이를 보여 주거나 분명히 암시하지 않는다면 그 액션은 시기상조입니다. 백엔드에 기능이 있다는 이유만으로 노출하지 마세요. 먼저 그 객체가 사용자의 멘탈 모델에 어떻게 들어오는지 설계하세요.

<a id="visual-language"></a>

## 시각 언어

<a id="hierarchy"></a>

### 위계

소수의 명확한 단계를 선호하세요.

- **윈도우 또는 페이지 제목**은 현재 객체나 워크스페이스를 식별합니다.
- **섹션 제목**은 의미 있는 영역을 구분합니다(`role="header"`, 스크린 리더가 영역 사이를 이동할 수 있도록).
- **본문 텍스트**는 작업 내용을 전달합니다.
- **흐린 텍스트**는 보조 메타데이터와 도움말을 제공합니다.
- **레이블**은 컨트롤과 값을 식별합니다.

색상이나 컨테이너를 더하기 전에 크기, 굵기, 간격, 구분선을 먼저 사용하세요. 카드 안에 카드를 중첩하지 마세요. 대부분의 영역에는 배경, 헤어라인 경계, 의도된 간격이면 충분합니다.

위계는 컴포넌트별이 아니라 기능 전체에서 평가하세요. 검토할 때 강조 색상과 장식을 숨겨 보세요. 그래도 주요 작업, 현재 선택, 결과 요약, 다음 행동이 구조만으로 분명해야 합니다. 개별적으로는 그럴듯한 컨트롤이 모여 있어도 하나의 읽기 순서와 하나의 의사결정 경로를 이루지 못하면 화면은 실패한 것입니다.

강조는 한정된 예산으로 다루세요. 하나의 지역적 표면에는 경쟁하는 하이라이트가 가득한 상태가 아니라 하나의 명확한 초점이 필요합니다. 모든 것이 색칠되고, 배지가 붙고, 굵고, 박스로 둘러싸이고, 알림으로 격상되면 아무것도 중요해 보이지 않습니다. 먼저 구조와 근접성으로 우선순위를 세우고, 사용자가 인지하거나 행동하는 바를 바꾸는 구분이 필요한 곳에만 더 강한 색상과 컴포넌트를 쓰세요.

<a id="color-and-themes"></a>

### 색상과 테마

테마에서 색상을 읽고(Rust에서는 `theme()`, TSX에서는 토큰 클래스) 의미적 역할에 따라 사용하세요.

- `background`과 `foreground`은 주 표면과 텍스트에 사용합니다.
- `card`, `popover`, `sidebar`과 그 foreground 토큰은 각각 이름이 붙은 표면에 사용합니다.
- `muted`과 `muted-foreground`는 보조 정보에 사용합니다.
- `primary`은 주요 액션이나 선택 강조에, `secondary`과 `accent`는 더 조용한 강조와 호버 또는 포커스된 행에 사용합니다.
- `destructive`은 파괴적 액션과 오류에만, 앱이 테마에 추가한 상태 색상(`success`, `warning`)은 그 의미에만 사용합니다.
- `chart-1`부터 `chart-5`까지는 데이터 시리즈에 사용합니다.
- `border`, `input`, `ring`은 구조와 상호작용에 사용합니다.

```rust tabs
use nsh_base::theme;

view()
    .rounded(move || theme().radius)
    .border_1()
    .border_color(move || theme().border)
    .bg(move || theme().background)
    .p_4()
    .gap_1()
    .child(text("Balance").text_color(move || theme().foreground))
    .child(text("Updated just now").text_sm().text_color(move || theme().muted_foreground))
```

```tsx tabs
<View class="gap-1 rounded-(--radius) border border-border bg-background p-4">
  <Text class="text-foreground">Balance</Text>
  <Text class="text-sm text-muted-foreground">Updated just now</Text>
</View>
```

의미적 상태 색상을 장식으로 사용하지 마세요. 색상만으로 의미를 전달하지 마세요. 모든 커스텀 표면은 라이트 테마와 다크 테마, 그리고 커스텀 테마 값에서 확인하세요. 앱을 임베드하는 호스트 앱의 테마도 포함합니다. foreground가 검정이고 background가 흰색이라고 가정하지 마세요.

배지는 빠르게 훑어보는 데 도움이 되는 짧은 상태, 개수, 분류에 사용하고, 모든 레이블, 메타데이터 값, 필터, 섹션 제목에 쓰지 마세요. 대부분의 배지는 중립적으로 유지하고, 의미 있는 성공, 경고, 파괴적, 정보성 의미를 실제로 전달하는 상태에만 의미적 색상을 쓰세요. 여러 색의 배지가 늘어서 있다면 대개 위계나 그룹화 결정이 빠진 것입니다.

애플리케이션 UI에는 원시 hex, `rgb()`/`rgba()`, `hsl()` 색상이나 `bg-zinc-100` 같은 팔레트 클래스를 사용하면 안 됩니다. 색상은 의미적 역할에 따라 테마에서 해석하세요. 필요한 역할이 없다면 호출 지점에 팔레트 값을 직접 넣지 말고 앱의 테마 파일에 정의하세요([Theme tokens](./tailwind.md#theme-tokens): `light` 안의 `"up": "#16a34a"`과 `dark`은 TSX에서 `text-up`, `bg-up/30`, `token("up")`을, Rust에서 `theme().color("up")`을 만듭니다). 원시 색상은 테마 정의 안이나 색상 자체가 데이터인 검증된 데이터/래스터 콘텐츠에만 허용됩니다.

<a id="radius-spacing-and-density"></a>

### 반경, 간격, 밀도

타입 및 컨트롤 크기와 마찬가지로 유한한 반경 스케일을 사용하세요. 요소마다 반경을 새로 만들지 말고 테마의 `radius`(컨트롤과 표면 모두에 해당, `rounded-(--radius)`), 앱이 테마에 추가한 반경, Tailwind의 `rounded-sm` … `rounded-2xl`(그 사이 단계 포함) 중에서 고르세요. 큰 컨테이너는 그 안의 컨트롤보다 더 부드러운 단계를 쓸 수 있고, 작은 컨트롤과 오버레이는 더 촘촘한 단계를 씁니다. 일반적인 직사각형에서 반경은 짧은 변의 절반보다 눈에 띄게 작아야 합니다. `rounded-full`(`.rounded_full()`)는 의도한 원과 알약 모양에만 사용하세요. 툴팁이 실수로 캡슐이 되어서는 안 됩니다.

중첩된 표면은 동심 형태로 읽혀야 합니다. `inner radius ≈ max(0, outer radius − gap)`를 사용해 가장 적합한 반경을 고르고, 모서리를 돌아도 보이는 띠의 두께가 고르게 유지되도록 하세요. 반복되는 컴포지션에 중간 값이 필요하다면 테마에 이름 있는 토큰(`"radius-inset": "0.375rem"`, `rounded-(--radius-inset)`)을 추가하세요. 세그먼트 컨트롤은 하나의 실루엣입니다. 양 끝 세그먼트는 컨테이너의 안쪽 모서리를 따르고, 가운데 세그먼트는 각진 채로 유지하며, 각 경계에는 일정한 두께의 구분선이 하나만 있어야 합니다.

<div class="diagram-scroll">
<img class="diagram diagram-light" src="/diagrams/radius-hierarchy-light.svg" alt="Light theme chat composer: the inset surface, both buttons, and placeholder spacing change together; red guide circles show their shared corner center.">
<img class="diagram diagram-dark" src="/diagrams/radius-hierarchy-dark.svg" alt="Dark theme chat composer: the inset surface, both buttons, and placeholder spacing change together; red guide circles show their shared corner center.">
</div>

반경은 테두리만이 아니라 눈에 보이는 표면 전체를 따라야 합니다. 드러난 모서리는 뒤쪽 표면에 대해 투명하게 유지되어야 하며, 자식 배경, 선택 채우기, 스크롤되는 콘텐츠도 경계를 따라야 합니다. 내부 표면에 자체 반경을 주거나 `overflow-hidden`(`.overflow_hidden()`)로 컨테이너를 클리핑한 다음, 두 테마 모두에서 대비되는 배경 위에서 컴포지션을 점검하세요. 클리핑을 선택할 때 바깥쪽 포커스 링이 보존되도록 하세요.

간결한 간격 스케일을 사용하고 반복하세요. 관련된 레이블/컨트롤 쌍은 서로 다른 그룹보다 가까워야 하고, 서로 다른 그룹은 서로 다른 섹션보다 가까워야 합니다. 임의의 높이 대신 앱 컴포넌트의 크기(small, 기본 medium, large)를 선호하세요. compact 변형은 툴바와 데이터 밀도가 높은 화면에 사용하고, 불명확한 레이아웃을 더 좁은 공간에 욱여넣는 데 사용하지 마세요.

공유되는 의미적 스케일은 의도적으로 작습니다. 간격은 대략 2, 4, 8, 12, 16, 24, 32 포인트로 진행되고, 타이포그래피는 12, 14, 16, 18, 20 포인트 근처에 머뭅니다. 이를 현재 값을 기능 코드 곳곳에 흩뿌려도 된다는 허가가 아니라 관계로 받아들이세요. Tailwind의 간격 스케일이 이를 제공합니다. 한 단계는 4포인트이며(`p-4`는 16pt), 클래스와 타입이 있는 Rust 메서드 모두 마찬가지입니다. `nsh.json`의 `"tailwind"`에 있는 `"spacing"`은 클래스의 단계를 바꾸고, 타입이 있는 메서드는 Tailwind의 기본 스케일을 유지합니다. 다른 스케일이 필요한 애플리케이션은 자체 컴포넌트나 테마 토큰(`p-(--gap-card)`)에서 그 스케일을 소유하고 일관되게 사용하세요.
<a id="spatial-grammar"></a>

### 공간 문법

간격은 관계를 표현합니다. 두 요소가 서로에게 어떤 의미인지 물어보고, 의미 기반 스케일에서 간격을 고르세요.

| 관계 | 대표 클래스 | 현재 스케일 | 예시 |
| --- | --- | --- | --- |
| 시각적 보정 | `gap-0.5` | 2 pt | 아이콘 베이스라인, 컴팩트한 구분선 |
| 하나의 컨트롤을 이루는 부분 | `gap-1` | 4 pt | 메뉴 아이콘/레이블, 제목/설명 |
| 밀접하게 관련된 컨트롤 | `gap-2` | 8 pt | 버튼 아이콘/레이블, 대화상자 액션 |
| 하나의 콘텐츠 그룹 | `gap-3` | 12 pt | 알림 열, 컴팩트한 폼 행 |
| 한 섹션 안의 개별 그룹 | `gap-4` | 16 pt | 패널 패딩, 폼 그룹 |
| 개별 섹션 | `gap-6` | 24 pt | 페이지 또는 인스펙터의 주요 블록 |
| 주요 영역 경계 | `gap-8` | 32 pt | 빈 상태의 여백, 페이지 밴드 |

이 값들은 기본 스케일을 설명하는 것이지, 그대로 반복해 쓰는 리터럴이 아닙니다. 간격 클래스와 타입 메서드(`gap-2`,
`.gap_2()`, `p-4`, `.p_4()`) 또는 테마의 토큰을 사용하세요. 제품 고유의 스케일을 쓴다면 순서와
관계를 유지해야 하며, 각 호출 지점마다 직접 값을 쓰지 말고 애플리케이션 자체의 컴포넌트를 통해 전달해야 합니다.

가로와 세로 공간을 결정할 때는 다음 규칙을 따르세요.

1. **바깥보다 안쪽이 먼저입니다.** 컴포넌트의 패딩은 컴포넌트에 속하고, 컴포넌트 사이의 간격은
   부모에 속합니다.
2. **세로 리듬은 그룹화를 보여 줍니다.** 제목과 설명 사이의 간격은 그 설명과 다음 섹션 사이의 간격보다 작습니다.
   간격이 같으면 관계도 같다는 뜻이 됩니다.
3. **가로 공간은 훑어보기를 돕습니다.** 반복되는 행에서는 아이콘, 레이블, 값, 배지, 후행 액션이
   안정적인 열에 머물러야 합니다.
4. **앞쪽(leading)과 뒤쪽(trailing)은 의미적 개념입니다.** 읽기 순서에 따른 가장자리로 생각하고 start와 end(`ps-*`,
   `me-*`, `.ps_4()`)로 작성해, 레이아웃이 오른쪽에서 왼쪽 방향으로도 반전되게 하세요.
5. **패딩을 이중으로 적용하지 마세요.** 이미 패딩이 있는 패널에 카드를 배치할 때 패널 인셋 전체를 자동으로 다시
   추가해서는 안 됩니다.
6. **시각적 정렬 보정은 드물게 사용하세요.** 아이콘이나 글리프의 형태 때문에 1~2 포인트를 보정하는 것은 타당하지만,
   스케일과 다른 이유를 문서화해야 합니다.

자주 쓰는 구성이 관계를 보여 줍니다.

- 버튼 내용은 작은 크기에서 4 pt, 보통 크기에서 8 pt를 사용합니다.
- 대화상자의 헤더와 푸터는 8 pt의 내부 간격을 사용합니다.
- 컴팩트한 목록 및 메뉴 행은 세로 4 pt, 가로 8–12 pt 패딩을 사용합니다.
- 시트 헤더는 닫기 어포던스를 위한 공간을 남기도록 앞쪽 약 16 pt, 뒤쪽 12 pt를 사용하고, 푸터는 가로 16 pt,
  세로 12 pt를 사용합니다.
- 알림은 아이콘, 메시지, 액션이 서로 다른 그룹이므로 가로 패딩 16 pt와 열 간격 12 pt를 사용합니다.

이 값들을 모든 화면에 복사해 붙여 넣는 레시피로 취급하지 마세요. 이 값들은 시스템의 원리를 보여 줍니다. 컨트롤은 내부가 더 촘촘하고,
행은 훑어보기에 최적화되며, 컨테이너는 내용물 사이보다 경계에 더 많은 공간을 씁니다.

<a id="proportion-and-layer-hierarchy"></a>

### 비율과 레이어 계층

먼저 콘텐츠 요구 사항에서 출발한 뒤 비율을 정하세요. 한 패널의 역할이 분명히 다르다면 임의로 절반씩 나누지 마세요.

- 내비게이션 사이드바는 레이블이 안정적으로 표시될 만큼 넓어야 하지만, 작업 영역에 비해 눈에 띄게 종속적이어야 합니다.
  비율만 쓰지 말고 최소, 선호, 최대 너비(`min-w-*`, `w-*`, `max-w-*`)를 지정하세요.
- 마스터–디테일 레이아웃에서는 컬렉션이 훑어보기 쉬운 상태를 유지하게 하고, 남는 공간은 디테일 패널에 주세요.
  대략 1/3 대 2/3를 시작점으로 삼는 것이 유용한 경우가 많지만, 콘텐츠 제약이 우선합니다. 휴대폰에서는 둘이
  `NavStack`의 두 페이지가 됩니다.
- 인스펙터와 보조 시트는 기본적으로 주요 객체를 가리지 않아야 합니다. 콘텐츠가 늘어나면 크기를 조절하거나
  닫을 수 있어야 합니다. [`Sheet`](../elements/sheet.md)는 백드롭, Escape, 뒤로 가기로 닫힙니다.
- 대화상자의 너비는 결정의 성격에서 나옵니다. 짧은 확인에는 `AlertDialog`, 중간 규모의 폼, 복잡한 작업에는 전용
  창/페이지를 사용하세요. 여백을 만들려는 목적만으로 대화상자를 키우지 마세요.
- 가장 강한 엘리베이션은 최상위 결정 레이어를 위해 남겨 두세요. 한 레이어 안에서는 점점 커지는 그림자가 아니라
  배경과 헤어라인으로 계층을 나타내세요.

모든 주요 영역에 대해 세 가지 크기 제약을 정의하세요. 작업이 여전히 가능한 최소 크기, 편안한 기본 크기,
남는 공간을 소비하는 방식입니다. 사용자가 조절하는 분할이 워크플로 선호를 나타낸다면 값을 저장하고,
복원할 때는 현재 창에 맞게 값을 제한(clamp)하세요.

<a id="alignment-details"></a>

### 정렬 세부 사항

정렬은 마지막에 다듬는 작업이 아니라 구조적인 시스템입니다. 각 화면에 소수의 정렬 기준선(spine)을 세우세요. 공유하는
앞쪽·뒤쪽 가장자리, 텍스트 베이스라인, 중심선, 고정된 기능 레인입니다. 같은 수준의 요소는 서로 다른 컴포넌트
유형이더라도 위에서 아래로, 또는 앞쪽에서 뒤쪽으로 같은 기준선에 붙어야 합니다.

<div class="diagram-scroll">
<img class="diagram diagram-light" src="/diagrams/alignment-spines-light.svg" alt="Alignment spines across a content region">
<img class="diagram diagram-dark" src="/diagrams/alignment-spines-dark.svg" alt="Alignment spines across a content region">
</div>

세로 빨간 선은 콘텐츠, 상태, 시간, 후행 액션의 공유 가장자리나 컨트롤 중심 옆에 놓입니다.
가로선은 텍스트 베이스라인 아래에 있거나 행의 중심을 지나며, 아래쪽 정렬과 세로 중앙 정렬을 보여 줍니다.
컴팩트 비교는 렌더링된 1픽셀의 어긋남을 분리해 보여 주며, 이는 구조상의 소유자에서 바로잡아야 합니다.

- 형제 영역은 공통 콘텐츠 인셋을 공유하게 하세요. 같은 수준을 나타내는 제목, 툴바, 목록 행, 빈 상태, 푸터가
  각자 조금씩 다른 앞쪽 가장자리를 만들어서는 안 됩니다.
- 열 구조를 영역 전체에서 반복하세요. 헤더, 행, 요약, 로딩 상태, 인라인 편집기는 식별 정보, 메타데이터, 상태,
  숫자, 액션에 같은 레인을 확보해야 합니다.
- 행과 섹션에 걸쳐 관련 컨트롤을 정렬하세요. 폼 레이블, 필드, 설명, 유효성 검사 메시지는 페이지를 위에서
  아래로 훑어볼 때 안정적인 세로 그리드를 드러내야 합니다.
- 가로 밴드의 일관성을 유지하세요. 툴바, 헤더, 상태 표시줄, 행을 공유하는 항목은 개별적으로 조정한 오프셋 대신
  하나의 베이스라인이나 중심선을 사용해야 합니다.
- 들여쓰기는 실제 계층, 포함 관계, 펼침(disclosure)에만 도입하세요. 장식적인 들여쓰기는 형제 요소를 종속된 것처럼
  보이게 하고 화면의 읽기선을 깨뜨립니다.
- 중첩된 수준이 끝나면 부모의 기준선으로 정확히 돌아오세요. 중첩된 컨테이너를 거치며 패딩이 누적되어 어긋나게 두지 마세요.
- 선택적 콘텐츠가 있어도 기준선을 유지하세요. 아이콘, 배지, 설명, 후행 액션이 없더라도 나머지 레이블이
  움직여서는 안 됩니다. 행 간 비교가 중요하다면 의도적인 슬롯이나 레인을 사용하세요.
- 계층이 일치하는 주요 영역끼리 서로 정렬하세요. 사이드바 헤더, 콘텐츠 제목, 분할 패널, 툴바, 하단 바가
  모든 좌표를 공유할 필요는 없지만, 같은 수준에 있는 것들은 눈에 보이는 연속된 선을 이루어야 합니다.

모든 가장자리가 정렬되어야 하는 것은 아닙니다. 자식은 들여쓸 수 있고, 주요 값이 보조 메타데이터보다 앞설 수 있으며,
파괴적인 결정은 더 분리될 수 있습니다. 이러한 예외는 계층이나 의미를 전달해야 하며, 조율되지 않은 컴포넌트 패딩의 결과여서는
안 됩니다. 먼저 공유 기준선에서 시작하고, 그다음 예외를 명시적으로 만드세요.

정확한 정렬과 반복되는 간격은 품질 불변 조건으로 취급하세요. 두 가장자리나 간격이 같아야 한다면, 렌더링된 1픽셀의
차이는 허용되는 시각적 근사치가 아니라 결함입니다. 대표적인 창 크기, 텍스트 크기, 디스플레이 배율에서 측정 도구로
확정된 경계(bounds)를 검사하세요. 좌표와 거리를 비교하고, 대충 본 스크린샷만으로 정렬을 승인하지 마세요.

렌더링 픽셀 허용 오차는 검증 규칙이지, 원시 포인트 오프셋으로 코드를 땜질해도 된다는 허가가 아닙니다. 같은 관계는 동일한
간격 클래스나 메서드, 토큰, 그리드 정의, 또는 공유 컴포넌트 인셋에서 결정되어야 합니다. 값이 다르다면
공통 소유자를 수정하세요. 소수 단위 레이아웃과 기기 반올림(2×, 3× 휴대폰, 소수 배율의 데스크톱)을 고려해, 의도한
기준선이 특정 배율에서 어긋나지 않고 같은 물리 픽셀에 놓이게 하세요.

- 크기가 다른 텍스트가 한 행에 있을 때는 바운딩 박스 중앙이 아니라 베이스라인으로 정렬하세요.
- 아이콘은 고정 슬롯의 중앙에 배치해, 아이콘의 고유 너비가 달라도 레이블이 움직이지 않게 하세요.
- 비교 가능한 숫자는 끝쪽에 정렬하고 탭 형식 숫자(`tabular-nums`)를 사용하세요. 로캘이 달리 요구하지 않는 한 산문과
  식별자는 시작쪽에 정렬하세요.
- 후행 행 액션과 펼침 표시기는 고정 너비 레인에 두세요.
- 폼 컨트롤은 아래의 도움말 텍스트가 아니라 상호작용 프레임을 기준으로 정렬하세요.
- `justify-between`(`.justify_between()`)는 양쪽이 정말로 서로 반대편 가장자리를 소유할 때만 사용하세요. 가운데에서 부족한 구조를
  가리는 용도로 쓰면 안 됩니다.
- 헤어라인은 경계의 소유자에 속합니다. 인접한 두 영역이 같은 구분선을 각각 그려서는 안 됩니다.
- 스크롤바는 스크롤되는 영역에 속하며, 해당 패널, 편집기, 창의 뒤쪽 가장자리에 붙습니다. 콘텐츠 패딩은 텍스트와 행을
  안쪽으로 들일 수 있지만, 스크롤바를 화면 중간으로 끌어와서는 안 됩니다. 스크롤 뷰가 아니라 스크롤 뷰의 콘텐츠에
  패딩을 적용하세요.

<a id="density-tiers"></a>

### 밀도 단계

기본값은 보통(medium)입니다. 밀도는 고립된 컨트롤 하나가 아니라 로컬 컨텍스트 전체에 대해 바꾸세요.

- **comfortable / large:** 온보딩, 여유로운 폼, 눈에 띄어야 하는 결정.
- **standard / medium:** 대부분의 애플리케이션 크롬과 워크플로, 그리고 모든 터치 화면.
- **compact / small:** 데스크톱 툴바, 메뉴, 테이블, 반복되는 전문가용 데이터.
- **extra compact / xsmall:** 예외적인 고밀도 유틸리티. 애플리케이션 전체의 자동 선택이 되어서는 안 됩니다.

임의의 크기 대신 한정된 스케일을 사용하세요. 터치 화면에서는 눌러야 하는 모든 대상이 최소 44 × 44 포인트여야 합니다
([터치 대상](./accessibility.md#touch-targets)). 포인터를 사용할 때 버튼은 보통 약 24, 28,
32 pt 프레임을 오가고, 입력은 large 크기에서 약 40 pt까지 커지며, 테이블 행은 약 28, 32, 40 pt를 사용합니다. 앱의
컴포넌트에는 타이포그래피, 아이콘, 패딩, 히트 타깃이 함께 바뀌는 크기를 부여하세요. 바깥 상자만 바꾸는 커스텀 높이는
대개 불완전합니다.

<a id="text-size-base-font-and-points"></a>

### 텍스트 크기, 기본 글꼴, 포인트

잘 설계된 스케일은 텍스트가 커져도 계층을 유지합니다. 더 큰 텍스트가 성공적이라는 것은 모든 객체가 단순히 커졌을 때가 아니라,
제목과 본문, 컨트롤과 아이콘, 안쪽과 바깥쪽 간격, 주요 영역과 보조 영역의 관계가 모든 크기에서 여전히 같게 느껴질 때입니다.

NSH의 길이 단위는 포인트이며, 사용자의 텍스트 크기(iOS의 Dynamic Type, Android의 글꼴 크기, 데스크톱의 텍스트 배율,
호스트 앱 자체의 설정)가 텍스트를 확대합니다. 글꼴 배율을 허용하는 모든 텍스트와 입력은 커지지만, 간격, 모서리 반경,
테두리, 이미지는 크기를 유지합니다([텍스트 크기](./device-and-environment.md#text-size)). 앱의 기본 텍스트
크기(Tailwind의 `text-base`, 16 포인트)는 타입 스케일이 기준으로 삼는 본문 크기입니다.

비율로 설계하세요.

- 타입 단계는 기본 본문 크기를 중심으로 같은 계층을 유지합니다.
- 간격 단계는 타입을 중심으로 같은 그룹화 관계를 유지합니다.
- 컨트롤 프레임과 히트 타깃은 레이블과 함께 커집니다. 고정 높이가 아니라 콘텐츠와 최솟값(`min-h-11`)을 기준으로 크기를 정하세요.
- 패널의 최소 너비와 편안한 너비는 더 큰 텍스트를 고려합니다.
- 모서리 반경과 포커스 처리는 컨트롤 프레임과 시각적으로 일관되게 유지됩니다.

텍스트는 스스로 커지기 때문에 그 주위의 고정 프레임은 깨집니다. 고정 높이 버튼 안의 더 큰 레이블, 고정된 패널 최소 크기 안의
더 큰 문서, 고정 행 높이 안의 더 큰 행은 원래의 리듬을 무너뜨리고 콘텐츠를 잘라 낼 수 있습니다. 텍스트가 커지면 행이 줄바꿈되거나
열로 전환되게 하고(`fontScale()`, `font_scale()`), 34pt 제목처럼 이미 큰 텍스트는 배율에 상한을 두세요(`maxFontSizeMultiplier`).

원칙적으로 애플리케이션 레이아웃에는 리터럴 포인트 값(`p-[13px]`, `px(13.0)`)을 쓰지 않습니다. 간격 스케일
(`p-2`, `gap-3`, `w-64`, `text-sm`와 해당 타입 메서드) 또는 앱의 컴포넌트 크기를 사용하세요. 리터럴 포인트는 값이 물리적 경계나 래스터
경계를 나타낼 때만 사용합니다. 헤어라인, 플랫폼 창 인셋, 비트맵 크기, 최소 히트 테스트 허용 오차, 또는 외부 화면과
일치해야 하는 기하 구조가 여기에 해당합니다. 이는 감사를 거쳐 문서화된 예외입니다. 제품의
간격, 타이포그래피, 아이콘 크기, 일반적인 컨트롤 기하 구조는 스케일에 머물러야 합니다.

기본값만이 아니라 여러 텍스트 크기에서 테스트하세요. 계층, 줄바꿈, 말줄임, 최소 창 크기, 패널 크기 조절, 포커스 링 여유 공간,
팝업 위치, 목록 행 측정을 확인하세요.
<a id="surfaces-and-elevation"></a>

### 표면과 고도

고도(elevation)는 중요도가 아니라 쌓임 순서를 설명하는 데 사용합니다. 기본 표면은 평평하게 두고, 구분선과 배경 대비로 영역을 나눕니다. 팝오버, 메뉴, 시트, 다이얼로그, 알림은 다른 콘텐츠 위에 놓이므로 단계적으로 더 강한 그림자를 사용할 수 있습니다. 모든 카드에 그림자를 넣지 마십시오.

같은 종류의 표면은 모두 하나의 처리 방식을 공유해야 합니다. 팝업 계열에는 하나의 테마 표면(`popover` 토큰, 테두리, `radius`, 그리고 하나의 그림자)을 적용하여 `Popover`, `Menu`, `ContextMenu`, `Tooltip`이 서로 어긋나지 않게 하십시오. 애플리케이션이 앵커된 표면을 새로 만들 때는 관련 없는 테두리와 그림자 리터럴로 비슷하게 흉내 내지 말고 이 처리 방식을 재사용하십시오.

<a id="typography-and-icons"></a>

### 타이포그래피와 아이콘

인터페이스 텍스트에는 플랫폼 UI 글꼴을 사용하고, 고정폭 글꼴은 코드, 식별자, 단축키, 정렬이 필요한 숫자 데이터에만 사용하십시오. 본문은 읽기 쉽게 유지하고, 특히 CJK 텍스트에서는 과도한 대문자 사용이나 자간 확대를 피하십시오.

제품 하나에는 하나의 아이콘 계열만 사용하십시오. 아이콘은 레이블을 보완하는 것이며, 익숙하지 않은 동작을 추측에 맡기도록 대체해서는 안 됩니다. 아이콘만 있는 버튼에는 항상 접근 가능한 이름(`accessibilityLabel`)이 필요합니다. 시각적 설명은 아래의 툴팁 정책을 따릅니다. 채워진 아이콘이나 색상이 있는 아이콘은 상태를 전달할 때 사용하고, 단지 툴바를 화려하게 만들려고 사용하지 마십시오.

<a id="layout-patterns"></a>

## 레이아웃 패턴

<a id="choose-a-stable-shell"></a>

### 안정적인 셸 선택하기

대부분의 애플리케이션은 다음 셸 중 하나를 사용해야 합니다.

- **단일 워크스페이스:** 하나의 주요 뷰 위에 헤더 또는 툴바를 둡니다.
- **내비게이션 스택:** 페이지를 푸시하고 팝합니다(`NavStack`). 휴대폰에서는 시스템의 뒤로 가기 제스처를 사용합니다.
- **사이드바 워크스페이스:** 바뀌는 상세 뷰 옆에 고정된 내비게이션을 둡니다.
- **마스터–디테일:** 크기 조절이 가능한 컬렉션 패널과 상세 패널로 구성하며, 휴대폰에서는 두 개의 페이지로 나눕니다.
- **문서 워크스페이스:** 오래 유지되는 여러 객체를 탭으로 관리합니다.
- **유틸리티 윈도우:** 짧고 고정된 동작 경로로 하나의 집중된 작업을 수행합니다.

콘텐츠가 바뀌어도 전역 내비게이션은 안정적으로 유지하십시오. 주요 작업 영역에는 `flex-1`(`.flex_1()`)로 남은 공간을 모두 할당하고, 넘치는 자식 요소가 줄어들어야 하는 곳에는 `min-w-0` / `min-h-0`를 사용하십시오. 스크롤이나 가상화를 중첩된 뷰로 다시 만들지 말고, `Scroll`와 `List`를 본래 의도된 동작대로 사용하십시오.

데스크톱에서 앱이 직접 만든 타이틀 바([`nsh/desktop`](../modules/nsh-desktop.md))는 무엇보다 먼저 윈도우 크롬입니다. 드래그 영역(`.window_drag(true)`)을 유지하고, 일반적인 타이틀 클릭을 드물게 쓰는 편집 명령에 연결하지 마십시오. 이름 변경은 명시적인 객체 명령 뒤에 두고, 적절한 경우 키보드 경로를 제공하십시오.

<a id="responsive-windows"></a>

### 반응형 윈도우

윈도우는 어떤 크기든 될 수 있습니다. 사용자, 분할 뷰, 또는 호스트 앱이 크기를 결정합니다. 윈도우가 좁아질 때 어떻게 할지 다음 순서로 결정하십시오.

1. 주요 작업을 유지합니다.
2. 크기 조절이 가능한 영역이 문서화된 최소 크기까지 줄어들도록 허용합니다.
3. 보조 레이블이나 인스펙터를 접습니다.
4. 사용 빈도가 낮은 동작을 메뉴로 옮깁니다.
5. 콘텐츠가 실제로 넘치는 영역만 스크롤합니다.

다른 경로를 제공하지 않은 채 동작을 숨기지 마십시오. 목록이나 문서 본문만 스크롤해야 하는 경우에 윈도우 전체가 스크롤되게 만들지 마십시오. 브레이크포인트(`md:`, `lg:`)와 `windowSize()`(Rust에서는 `window()`)은 NSH가 렌더링하는 대상 표면을 따릅니다.

NSH의 플렉스 레이아웃에도 다른 레이아웃 시스템과 같은 고유 크기 압력이 있습니다. `flex-1` 자식 요소가 긴 콘텐츠 때문에 여전히 줄어들기를 거부할 수 있습니다. 디자인과 구현은 어느 패널이 줄어들거나, 잘리거나, 줄바꿈되거나, 스크롤될 수 있는지에 대해 일치해야 합니다. 잘린 영역은 바깥쪽으로 그려지는 포커스 링도 함께 잘라냅니다. 오버플로 처리를 단순화하려고 키보드 가시성을 희생하지 마십시오.

<a id="forms-and-settings"></a>

### 폼과 설정

각 필드에는 눈에 보이는 레이블을 사용하고, 도움말이나 유효성 검사 메시지는 설명 대상 필드 옆에 두십시오. 관련 필드는 정렬하되, 긴 레이블을 좁은 고정 열에 억지로 넣지 마십시오. 적절한 컨트롤을 사용하십시오. 독립적인 선택에는 `Checkbox`, 눈에 보이는 작은 집합에는 `Radio`들로 구성된 [`RadioGroup`](../elements/radio.md), 더 긴 선택 집합에는 선택지의 `Menu`, 즉시 적용되는 설정에는 [`Switch`](../elements/switch.md)를 사용합니다. 이들의 부품(스위치의 트랙과 썸, 체크박스의 인디케이터)은 앱이 스타일을 지정하며, 컨트롤을 따라가는 `checked:`, `indeterminate:`, `disabled:` 클래스를 사용합니다.

```rust tabs
use nsh_base::{switch, theme};

fn setting_switch(label: &'static str, on: Signal<bool>) -> impl IntoElement {
    switch()
        .checked(on)
        .on_change(move |next: &bool| on.set(*next))
        .flex_row()
        .items_center()
        .gap_3()
        .track_style(|s| {
            s.w(px(44.0))
                .p(px(2.0))
                .rounded_full()
                .bg(move || theme().muted)
                .transition_colors()
                .checked(|s| s.bg(move || theme().primary))
        })
        .thumb_style(|s| {
            s.size(px(20.0))
                .rounded_full()
                .bg(move || theme().background)
                .shadow_sm()
                .transition_transform()
                .checked(|s| s.translate_x(px(20.0)))
        })
        .child(text(label).text_color(move || theme().foreground))
}
```

```tsx tabs
import { Text } from "nsh";
import { Switch } from "nsh/base";

function SettingSwitch(props: { label: string; on: boolean; onChange: (e: { checked: boolean }) => void }) {
  return (
    <Switch
      checked={props.on}
      onChange={props.onChange}
      class="flex-row items-center gap-3"
      trackClass="w-11 rounded-full bg-muted p-0.5 transition-colors checked:bg-primary"
      thumbClass="size-5 rounded-full bg-background shadow-sm transition-transform checked:translate-x-5"
    >
      <Text class="text-foreground">{props.label}</Text>
    </Switch>
  );
}
```

"전체 선택" 체크박스는 부분 선택을 indeterminate 상태로 표시합니다.

```rust tabs
use nsh_base::{checkbox, theme};

fn select_all(selected: Signal<usize>, total: usize) -> impl IntoElement {
    checkbox()
        .checked(move || selected.get() == total)
        .indeterminate(move || selected.get() > 0 && selected.get() < total)
        .on_change(move |all: &bool| selected.set(if *all { total } else { 0 }))
        .flex_row()
        .items_center()
        .gap_2()
        .indicator_style(|s| {
            s.size(px(20.0))
                .items_center()
                .justify_center()
                .rounded(move || theme().radius)
                .border_2()
                .border_color(move || theme().border)
                .checked(|s| s.bg(move || theme().primary).border_color(move || theme().primary))
                .indeterminate(|s| s.bg(move || theme().primary).border_color(move || theme().primary))
        })
        .indicator(text(move || mark(selected.get(), total)).text_color(move || theme().primary_foreground))
        .child(text("Select all").text_color(move || theme().foreground))
}

fn mark(selected: usize, total: usize) -> &'static str {
    if selected == total { "✓" } else if selected > 0 { "–" } else { "" }
}
```

```tsx tabs
import { Text } from "nsh";
import { Checkbox } from "nsh/base";

function SelectAll(props: { selected: number; total: number; onChange: (e: { checked: boolean }) => void }) {
  return (
    <Checkbox
      checked={props.selected === props.total}
      indeterminate={props.selected > 0 && props.selected < props.total}
      onChange={props.onChange}
      class="flex-row items-center gap-2"
      indicatorClass="size-5 items-center justify-center rounded-(--radius) border-2 border-border checked:border-primary checked:bg-primary indeterminate:border-primary indeterminate:bg-primary"
      indicator={
        <Text class="text-primary-foreground">
          {props.selected === props.total ? "✓" : props.selected > 0 ? "–" : ""}
        </Text>
      }
    >
      <Text class="text-foreground">Select all</Text>
    </Checkbox>
  );
}
```

작업이 진행되는 동안에는 제출을 비활성화하고, 사용자의 입력을 유지하며, 결과를 동작 근처에 표시하십시오. 입력 필드는 소프트웨어 키보드 위에 유지하십시오(`env(keyboard-inset-height)`). 다이얼로그는 짧고 집중된 결정에만 사용하고, 탐색이 필요하거나 필드가 많은 워크플로에는 전체 페이지나 시트를 사용하십시오.

로딩 표시는 실제 대기를 나타내야 합니다. 이미 사용 가능한 콘텐츠가 있는 설정 패널 사이를 전환할 때는 즉시 보여 주어야 합니다. 스켈레톤은 콘텐츠를 실제로 불러오는 중이고 그 형태를 알고 있을 때만 적절합니다.

<a id="components-and-composition"></a>

## 컴포넌트와 구성

컴포넌트는 밀폐된 디자인 시스템이 아니라 건축 재료라는 Shadcn의 원칙을 따르십시오. `nsh/base`는 동작을 제공하고, 앱은 자체 컴포넌트에 일관된 기본값을 제공하며 구성과 제품 의미론을 소유합니다.

- 컴포넌트 변형은 의미에 따라 사용하십시오. 기본(primary)은 결정 영역에서 명시적인 기본 확정 동작에만 사용하며, 일반적으로 데스크톱에서 Return으로 실행되는 동작입니다. 단독으로 있거나, 자주 쓰이거나, 바람직한 동작이라고 해서 자동으로 primary가 되는 것은 아닙니다. 관리 툴바의 `Add` 명령은 보통 기본 버튼을 사용하며, 폼의 기본 `Create` 확정에는 primary를 사용할 수 있습니다. 파괴적 확정에는 destructive를, 조용한 툴바 동작에는 ghost를 사용하십시오.
- 임의의 하위 요소를 스타일링하기보다 명시적인 부품과 슬롯을 선호하십시오.
- 반복되는 패턴은 제품 전체에서 일관되게 유지하십시오. 도메인 언어나 정책을 담고 있다면 애플리케이션 컴포넌트로 감싸십시오.
- 의미상의 역할에 맞는 표준 컴포넌트를 사용하십시오. `Menu`, `ContextMenu`, `Popover`, `Sheet`, `Dialog`, `AlertDialog`는 서로 바꿔 쓸 수 있는 상자가 아닙니다. 각각 선택, 포커스, 키보드, 닫기, 레이아웃에 대해 서로 다른 계약을 가지며, 기기마다 고유한 형태를 취합니다.
- 컴포넌트 계열의 기하 구조를 유지하십시오. 메뉴 행은 수직·수평 패딩, 높이, 아이콘 및 체크 표시 슬롯, 구분선, 반경, 상태 처리를 공유합니다. 간격만 시스템과 비슷하게 흉내 낸 커스텀 팝업으로 메뉴를 모방하지 마십시오.
- 모든 prop의 이름을 바꾸거나 모든 기능을 고정하려는 목적만으로 컴포넌트를 감싸지 마십시오.
- 제품 스타일이 없는 재사용 가능한 동작은 `nsh/base` 또는 앱의 제품들이 공유하는 crate로 옮기고, 테마가 적용된 고유한 표현은 애플리케이션의 컴포넌트에 두십시오.

```rust tabs
use nsh_base::{button, theme};

/// The footer of a form: a default Cancel and the primary commit.
fn form_actions(cancel: impl Fn() + 'static, create: impl Fn() + 'static) -> impl IntoElement {
    view()
        .flex_row()
        .justify_end()
        .gap_2()
        .child(
            button()
                .on_press(cancel)
                .rounded(move || theme().radius)
                .border_1()
                .border_color(move || theme().border)
                .px_4()
                .py_2()
                .active(|s| s.bg(move || theme().muted))
                .child(text("Cancel").text_color(move || theme().foreground)),
        )
        .child(
            button()
                .on_press(create)
                .rounded(move || theme().radius)
                .bg(move || theme().primary)
                .px_4()
                .py_2()
                .active(|s| s.bg(move || theme().primary.opacity(0.9)))
                .child(text("Create").text_color(move || theme().primary_foreground)),
        )
}
```

```tsx tabs
import { Text, View } from "nsh";
import { Button } from "nsh/base";

// The footer of a form: a default Cancel and the primary commit.
function FormActions(props: { onCancel: () => void; onCreate: () => void }) {
  return (
    <View class="flex-row justify-end gap-2">
      <Button onPress={props.onCancel} class="rounded-(--radius) border border-border px-4 py-2 active:bg-muted">
        <Text class="text-foreground">Cancel</Text>
      </Button>
      <Button onPress={props.onCreate} class="rounded-(--radius) bg-primary px-4 py-2 active:bg-primary/90">
        <Text class="text-primary-foreground">Create</Text>
      </Button>
    </View>
  );
}
```

<a id="interaction-states"></a>

## 상호작용 상태

<a id="make-the-result-understandable-before-the-click"></a>

### 클릭하기 전에 결과를 이해할 수 있게 하기

컨트롤은 결과를 예측할 수 있게 해야 합니다. 사용자가 인터페이스를 먼저 배우지 않고도 동작할 수 있도록 익숙한 플랫폼 컨트롤과 배치를 사용하십시오. 레이블은 동작과 대상을 명시하고, 상태는 사용 가능 여부를 보여 주며, 피드백은 같은 결과를 확인해 줍니다.

구성 흐름을 여는 Button에는 `Save`라는 레이블을 붙이지 말고, 그룹에서 항목을 제거하기만 하는 Button에는 `Delete`라는 레이블을 붙이지 마십시오. 맥락만으로 범위가 분명하지 않을 때는 범위를 명시하십시오. 활성화에는 즉시 반응하고, 긴 작업 중 중복 제출을 방지하며, 변경된 객체 근처에 결과를 표시하십시오. 성공 메시지는 결과 자체가 눈에 보이지 않을 때만 추가하십시오.

모든 상호작용 컨트롤은 다음 상태를 고려하여 설계해야 합니다.

| 상태 | NSH | 디자인 요구 사항 |
| --- | --- | --- |
| 기본 | | 시각적 잡음 없이 명확한 어포던스 |
| 호버 | `hover:` | 은은한 포인터 피드백이며, 유일한 단서가 되어서는 안 됨 |
| 눌림 | `active:` | 즉각적인 눌림 피드백이며, 앱이 스타일 지정 |
| 열림 / 눌림 | 팝업의 `open` | 연결된 팝업이 열려 있는 동안 유지되는 피드백 |
| 포커스 표시 | `focus-visible:` | 대비가 높은 키보드 포커스 링 |
| 선택됨 / 체크됨 | `selected:`, `checked:` | 호버와 구별되는 지속적인 상태 |
| 비활성화 | `disabled:` | 낮은 강조도이며 오해를 부르는 호버/눌림 반응 없음 |
| 로딩 | | 맥락을 유지하고, 중복 동작을 방지하며, 긴 대기를 설명 |
| 오류 | | 무슨 일이 일어났는지와 복구 방법을 안내 |

키보드로 동작해야 하는 명령은 데스크톱과 웹에서 [`keymap`](../modules/nsh.md#keymap)로 바인딩하십시오. 익숙한 플랫폼 단축키(`"mod+k"`는 macOS에서는 Command, 그 외에서는 Control)에 맞추고, 메뉴나 툴팁에 단축키를 표시하며, 오버레이를 열거나 닫은 뒤에는 포커스를 논리적인 위치에 유지하십시오.

선택은 선택적인 다듬기가 아니라 정보 모델의 일부입니다. 탭, 세그먼트 선택, 선택 가능한 행, 필터, 내비게이션 목적지는 지속적인 선택 상태(`selected`, 스크린 리더가 알려 줌)를 보여 주어야 합니다. 메뉴를 소유한 버튼은 팝업이 닫힐 때까지 눌림 또는 열림 상태가 눈에 보이게 유지되어야 합니다. 호버만으로는 트리거와 표면 사이의 관계를 설명할 수 없습니다.

```rust tabs
use nsh_base::{tab, theme};

fn section_tab(label: &'static str, id: Section, current: Signal<Section>) -> impl IntoElement {
    let selected = move || current.get() == id;
    tab()
        .selected(selected)
        .on_press(move || current.set(id))
        .rounded(move || theme().radius)
        .px_3()
        .py_2()
        .selected_style(|s| s.bg(move || theme().muted))
        .child(text(label).text_color(move || {
            if selected() { theme().foreground } else { theme().muted_foreground }
        }))
}
```

```tsx tabs
import { Text } from "nsh";
import { Tab } from "nsh/base";

function SectionTab(props: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Tab
      selected={props.selected}
      onPress={props.onPress}
      class="group rounded-(--radius) px-3 py-2 selected:bg-muted"
    >
      <Text class="text-muted-foreground group-selected:text-foreground">{props.label}</Text>
    </Tab>
  );
}
```

세그먼트 컨트롤에서 선택된 채움과 선택되지 않은 표면은 컨테이너의 실루엣을 공유해야 합니다. 어느 쪽도 끝 모서리를 각지게 만들거나 경계를 다른 경계보다 두꺼워 보이게 해서는 안 됩니다.

선택된 내비게이션 항목, 목록 행, 탭은 항목 자체의 표면으로 표시하십시오. 선택된 채움, 더 강한 전경색, 또는 더 굵은 글꼴 두께를 사용합니다. 선택 표시로 앞쪽 가장자리 막대나 한쪽 면 테두리를 추가하지 마십시오. 이는 네이티브 관례가 아니라 웹 템플릿의 습관입니다. 항목의 둥근 실루엣을 깨뜨리고, 이미 텍스트를 기준으로 정렬된 열에 경쟁하는 두 번째 가장자리를 더합니다.

파괴적인 동작에서는 되돌릴 수 있는 작업과 되돌릴 수 없는 작업을 구분하십시오. 되돌릴 수 있는 변경에는 실행 취소나 일시적인 알림을 선호하십시오. 결과가 심각하고 되돌릴 수 없을 때는 [`AlertDialog`](../elements/alert-dialog.md)를 사용하고, 확인 문구에는 구체적인 객체와 결과를 명시하십시오.

<a id="pointer-conventions"></a>

### 포인터 관례

버튼, 체크박스, 메뉴 항목, 탭 및 기타 컨트롤에는 기본 커서를 사용하십시오. 링크와 링크처럼 동작하는 콘텐츠에는 손가락 포인터(`cursor-pointer`)를 사용하십시오. 텍스트, 크기 조절, 잡기, 금지 커서는 진행 중인 조작을 설명할 때만 사용하십시오. 커서는 어포던스를 강화할 뿐, 컨트롤의 시각적 상태나 접근 가능한 역할을 대체하지 않습니다.

터치, 키보드, 접근성 상호작용에는 호버가 없으므로 호버 효과는 절제하여 유지하십시오. 파괴적이거나 필수적인 동작의 유일한 사본을 호버 시에만 드러내지 마십시오. 같은 명령을 선택, 키보드, 컨텍스트 메뉴로 사용할 수 있다면, 문맥형 행 동작은 기본 상태에서 더 조용하게 둘 수 있습니다.

<a id="prefer-command-surfaces-over-hover-toolbars"></a>

### 호버 툴바보다 명령 표면 선호하기

동작이 위치할 곳은 명령의 빈도와 범위에 따라 선택하십시오.

- 주요 동작이나 자주 쓰는 동작은 레이블이 있는 버튼이나 익숙한 툴바 컨트롤로 계속 보이게 두십시오.
- 현재 영역의 보조 동작은 눈에 보이는 [`Menu`](../elements/menu.md) 트리거 뒤에 두십시오.
- 포인터나 손가락 아래의 객체에 작용하는 명령은 `ContextMenu`에 두십시오. 데스크톱에서는 오른쪽 클릭, 터치 스크린에서는 길게 누르기입니다.
- 자연스러운 키보드 형태가 있는 중요한 명령은 키보드 단축키([`keymap`](../modules/nsh.md#keymap))로도 제공하고, 애플리케이션 메뉴(`nsh/desktop`([`Menu.setApplicationMenu`](../modules/nsh-desktop.md)에서)에도 노출하십시오.
- 호버 시 나타나는 아이콘은 다른 곳에서도 접근할 수 있는 명령의 단축 수단으로만 사용하십시오.

이는 단순한 시각적 취향 이상의 문제입니다. `nsh/base`의 메뉴는 이미 트리거에서의 배치, 데스크톱에서의 계단식 서브메뉴, 휴대폰에서의 제자리 서브메뉴가 있는 시트, 항목 선택·바깥 누르기·Escape·뒤로 가기에 의한 닫기, 스크린 리더를 위한 menu 및 menu item 역할을 소유합니다. 직접 만든 호버 버튼 모음은 이러한 동작을 모두 다시 구현해야 하며, 터치, 키보드 전용, 그리고 많은 보조 기술 워크플로에서는 보이지 않습니다.

```rust tabs
use nsh_base::{menu, menu_item, menu_separator, theme};
use nsh_core::{color::black, element::StyleRefinement};

/// The app's popup surface, shared by its menus, popovers and tooltips.
fn popup(s: StyleRefinement) -> StyleRefinement {
    s.min_w(px(192.0))
        .p_1()
        .rounded(move || theme().radius)
        .border_1()
        .border_color(move || theme().border)
        .bg(move || theme().popover)
        .shadow_lg()
}

fn item(label: &'static str, on_select: impl Fn() + 'static) -> impl IntoElement {
    menu_item()
        .on_select(on_select)
        .px_3()
        .py_2()
        .rounded(move || theme().radius)
        .hover(|s| s.bg(move || theme().muted))
        .active(|s| s.bg(move || theme().muted))
        .child(text(label).text_color(move || theme().foreground))
}

fn more_menu(rename: impl Fn() + 'static, duplicate: impl Fn() + 'static, delete: impl Fn() + 'static) -> impl IntoElement {
    menu()
        .offset(px(4.0))
        .popup_style(popup)
        .backdrop_style(|s| s.bg(black().opacity(0.5)))
        .trigger(
            view()
                .label("More actions")
                .size(px(44.0))
                .items_center()
                .justify_center()
                .rounded_full()
                .active(|s| s.bg(move || theme().muted))
                .child(text("⋯").text_color(move || theme().foreground)),
        )
        .child(item("Rename…", rename))
        .child(item("Duplicate", duplicate))
        .child(menu_separator().h(px(1.0)).my_1().bg(move || theme().border))
        .child(item("Delete…", delete))
}
```

```tsx tabs
import { Text, View } from "nsh";
import { Menu, MenuItem, MenuSeparator } from "nsh/base";

/** The app's popup surface, shared by its menus, popovers and tooltips. */
export const popup = "min-w-48 rounded-(--radius) border border-border bg-popover p-1 shadow-lg";
const item = "rounded-(--radius) px-3 py-2 hover:bg-muted active:bg-muted";

function MoreMenu(props: { onRename: () => void; onDuplicate: () => void; onDelete: () => void }) {
  return (
    <Menu
      offset={4}
      popupClass={popup}
      backdropClass="bg-black/50"
      trigger={
        <View accessibilityLabel="More actions" class="size-11 items-center justify-center rounded-full active:bg-muted">
          <Text class="text-foreground">⋯</Text>
        </View>
      }
    >
      <MenuItem onSelect={props.onRename} class={item}><Text class="text-foreground">Rename…</Text></MenuItem>
      <MenuItem onSelect={props.onDuplicate} class={item}><Text class="text-foreground">Duplicate</Text></MenuItem>
      <MenuSeparator class="my-1 h-px bg-border" />
      <MenuItem onSelect={props.onDelete} class={item}><Text class="text-foreground">Delete…</Text></MenuItem>
    </Menu>
  );
}
```

더 많은 명령이 존재한다는 시각적 표시가 사용자에게 필요할 때는 `Menu`를 선택하십시오. 예를 들어 툴바 오버플로, 문서 동작, 계정 메뉴가 있습니다. 이름 변경, 복제, 표시, 제거처럼 선택 또는 객체 범위의 명령에는 `ContextMenu`를 선택하십시오. 컨텍스트 메뉴가 필수 명령을 수행하는 유일한 방법이어서는 안 됩니다. 적절하게 메뉴 막대, 툴바, 키보드, 상세 뷰 경로를 제공하십시오.

화면을 최소한으로 보이게 하려고 모든 동작을 메뉴에 넣지 마십시오. 발견 가능성과 속도가 중요합니다. 주요 동작은 계속 보이게 하고, 위험한 항목은 명확하게 레이블을 붙여 분리하며, 메뉴 항목은 나타나는 모든 곳에서 같은 동사, 아이콘, 단축키, 활성화 상태, 결과를 사용해야 합니다.
<a id="button-means-application-action-link-means-external-resource"></a>

### Button은 애플리케이션 동작, Link는 외부 리소스

활성화했을 때 애플리케이션 상태가 바뀌거나, 결정을 확정하거나, 도구를 열거나, 데이터를 제출하거나, 명령을 실행한다면 사용할 요소는 `Button`입니다. 표현 방식은 해당 영역의 위계에 따라 고릅니다.

- primary 버튼: 결정 영역에서 강조할 단 하나의 확정 동작
- default 버튼: 눈에 보이는 일반 동작
- outline 버튼: 경계는 분명해야 하지만 강조는 덜한 동작
- ghost 버튼: 익숙하고 강조가 낮은 도구 모음 및 인라인 동작
- 아이콘 버튼: 널리 알려진 기호에만 사용하며, 접근성 이름을 지정하고 의미나 범위가 불분명하면 툴팁을 함께 제공

화면에 동작이 하나뿐이라거나, 오른쪽 위에 놓인다거나, 팀이 클릭 수를 늘리고 싶다는 이유로 primary를 지정하지 마세요. primary는 기본 확정 동작과 키보드 동작을 의미합니다. 항목 추가, 도구 열기, 보기 새로 고침처럼 활성화가 단순한 일반 명령이라면 위계에 따라 default, outline, ghost 버튼 중에서 선택합니다.

밑줄이 있는 링크(`role="link"`)는 외부 리소스(URL, 웹 페이지, 온라인 문서, 이메일 주소)를 대상으로 할 때만 사용합니다. 링크의 계약은 현재 애플리케이션 맥락을 벗어나 해당 리소스로 이동하는 것이므로 포인팅 핸드 커서를 사용합니다. 기능 명령을 조용해 보이게 하려고 링크 스타일을 쓰지 마세요. Delete, Save, Refresh, Add, 메뉴 열기, 앱 내 이동 동작을 링크 모양으로 만들면 컨트롤의 어포던스가 가려지고 잘못된 접근성 역할이 노출됩니다.

“View”라는 단어가 앱 내 목적지를 링크로 만들지는 않습니다. 전체 보고서, 분석, 상세 패널, 로컬 레코드는 여전히 버튼, 행, 카드, 탭, 디스클로저 컨트롤로 엽니다. 포함하는 카드가 이미 무엇이 열리는지 알려 준다면 `Full analysis`처럼 맥락을 반영한 간결한 레이블을 사용하세요. 밑줄은 실제로 브라우저나 메일 클라이언트에서 열리는 리소스에만 씁니다.

사이드바 행, 탭, 브레드크럼, 목록 항목, 로컬 뷰 열기, 워크스페이스 전환 등 모든 내부 내비게이션은 내비게이션 스택, `Button` 또는 해당 컴포넌트를 사용해야 합니다. 시각적 강조는 버튼의 variant나 내비게이션 컴포넌트의 선택 상태로 정하며, 의미를 속여서는 안 됩니다.

<a id="feedback-and-overlays"></a>

## 피드백과 오버레이

결정에 맞는 가장 작은 표면을 선택하세요.

- 툴팁: 짧은 설명이나 단축키([`Tooltip`](../elements/tooltip.md) 또는 임의 요소의 `tooltip`)
- 팝오버: 작업을 방해하지 않는 맥락형 컨트롤([`Popover`](../elements/popover.md))
- 메뉴: 간결한 동작 목록([`Menu`](../elements/menu.md))
- 알림: 결정이 필요 없는 비동기 상태
- 대화상자: 집중이 필요한 결정이나 짧은 폼([`Dialog`](../elements/dialog.md))
- 경고 대화상자: 중대한 결과를 가져오는 동작에 대한 명시적 확인([`AlertDialog`](../elements/alert-dialog.md))
- 시트: 더 오래 유지되는 공간이 필요한 보조 작업([`Sheet`](../elements/sheet.md))

각 요소는 앱이 스타일을 지정하는 하나의 구조에서 출발해, 기기가 기대하는 형태로 나타납니다(`popupClass`, `backdropClass`).

| | 데스크톱 | 휴대폰 및 태블릿 |
| --- | --- | --- |
| `Tooltip` | 포인터가 요소 위에 머문 뒤 | 앱이 열 때만 |
| `Popover` | 앵커에 고정되며, 바깥을 누르면 닫히고 그 입력은 그대로 전달됨 | 앵커에 고정되며, 바깥을 누르면 닫히기만 함 |
| `Menu` | 트리거 위치의 팝업, 계단식 하위 메뉴 | 하단 시트, 하위 메뉴가 기존 항목을 대체 |
| `ContextMenu` | 보조 버튼, 포인터 위치 | 손가락을 길게 누르면 시트가 열림 |
| `Sheet` | 배경막 위의 가장자리 패널 | 동일 |
| `AlertDialog` | 플랫폼의 대화상자 스타일을 따르는 경고 | 시스템 경고 또는 액션 시트 |

툴팁은 부족한 의미를 보완하는 용도이며, 뻔한 동작을 되풀이해 설명하지 않습니다. 낯선 기호, 모호한 범위, 달리 드러나지 않는 유용한 단축키에만 사용하세요. 메시지 푸터의 Copy, Download처럼 반복되고 알아보기 쉬운 명령에는 접근성 이름과 키보드 접근이 필요하지만, 호버 레이블은 명확성을 높이지 못하고 방해만 더합니다. 휴대폰은 앱이 열 때만 툴팁을 표시하므로, 터치 사용자에게 필요한 정보를 툴팁에 담아서는 안 됩니다.

경고는 모달을 열지 않더라도 시각적 위계를 끊습니다. 현재 작업에서 주의가 필요한 중요하고 예외적인 정보에 사용하고, 일반적인 설명, 팁, 빈 공간을 꾸미는 컨테이너로 쓰지 마세요. 즉각적인 인지나 조치가 필요하지 않은 내용은 인라인 도움말, 흐린 텍스트, 일반 섹션을 우선 사용합니다.

오버레이를 겹쳐 쌓지 마세요. Escape와 Android 뒤로 가기 버튼은 가장 위에 있는 닫을 수 있는 레이어를 닫습니다. 앱 상태는 `onOpenChange`에서 동기화하고, 포커스는 트리거나 다음으로 논리적인 대상에 되돌려 주세요.

오버레이의 동작은 그 오버레이가 실제로 보여 주는 객체나 상태를 가리켜야 합니다. 예를 들어 `Clear history`는 별도의 최근 기록 섹션이 보이고 항목이 있을 때만 노출하세요. 검색 결과, 최근 항목, 즐겨찾기는 서로 다른 컬렉션이므로, 하나의 설명 없는 목록으로 합치지 말고 레이블을 붙여 구분합니다. 해당되지 않는 동작은 숨기거나, 타당한 이유를 밝혀 비활성화하세요. 모호한 휴지통 아이콘을 푸터에 덩그러니 두지 마세요.

푸터는 디자인에서 자리를 얻지 못한 기능을 모아 두는 곳이 아닙니다. 푸터에는 표면 전체에 적용되는 단축키, 상태, 동작을 둘 수 있지만, 각 항목은 대상이 무엇인지, 왜 지금 사용할 수 있는지, 어떤 범위에 영향을 주는지, 활성화한 뒤 어떤 상태가 눈에 보이게 바뀌는지에 답해야 합니다.

<a id="motion"></a>

## 모션

모션은 변화를 설명하는 것이며, 분위기용 장식이 아닙니다. 나타남, 사라짐, 확장, 공간적 연속성에는 짧은 전환을 사용하세요. 불투명도나 변형으로 같은 관계를 전달할 수 있다면 큰 레이아웃 변화를 애니메이션으로 처리하지 마세요. 모션 감소 설정(`motion-reduce:`, `reduceMotion()`)을 존중하고, 상태를 이해하는 데 애니메이션을 요구하지 말며, 모든 컴포넌트에 기본 애니메이션을 추가하지 마세요.

```rust tabs
view()
    .on_press(open)
    .transition_transform()
    .duration(150.0)
    .when(!reduce_motion(), |v| v.active(|s| s.scale(0.97)))
```

```tsx tabs
<View onPress={open} class="transition-transform duration-150 active:scale-[0.97] motion-reduce:active:scale-100" />
```

모션 정책은 애플리케이션 계층의 몫입니다. `nsh/base` 자체는 전환에 필요한 수명 주기 메커니즘이나 기하 구조를 담당할 뿐, 모든 제품이 페이드나 슬라이드를 쓰도록 정하지는 않습니다. 독립적으로 애니메이션되는 값에는 안정적인 식별자를 부여하고, 중단되었을 때는 이전 끝점에서 다시 시작하지 말고 현재 샘플링된 값에서 부드럽게 되돌아가게 하세요.

모션은 상호작용의 연속성을 따릅니다. 포인터나 스크롤 위치가 관련된 대상들 사이를 이동하는 동안에는 미리보기 표면을 그대로 유지하고, 내용이나 위치만 제자리에서 갱신하세요. 상호작용이 끝난 뒤에만 닫습니다. 갱신할 때마다 페이드 아웃과 재진입을 반복하면 깜박임으로 보입니다.

<a id="designing-data-heavy-interfaces"></a>

## 데이터 집약적 인터페이스 설계

밀도가 높다고 해서 답답해야 하는 것은 아닙니다. 테이블, 트리, 긴 목록, 에디터에서는 다음을 지킵니다.

- 헤더와 행의 핵심 식별 정보를 시각적으로 안정되게 유지
- 비교 가능한 값은 정렬하고, 적절한 경우 고정폭 숫자(tabular numerals) 사용
- 포커스, 호버, 활성 행, 다중 선택을 구분
- 정렬과 필터링을 눈에 보이게 하고 되돌릴 수 있게 유지
- 필터링과 재정렬 과정에서도 도메인 식별자를 기준으로 선택 유지
- 키보드 동작을 바꾸지 않고 대규모 컬렉션을 가상화(`List`)
- 보조 열과 인스펙터에는 점진적 공개 사용
- 다음에 할 일을 안내하는 유용한 빈 상태 제공

일관된 필드 간 비교에는 테이블, 이질적인 항목을 훑어볼 때는 목록, 실제 계층 구조에는 트리를 선택하세요. 복잡한 데이터 레이아웃을 시각적 스타일로 쓰지 마세요.

<a id="interface-language"></a>

## 인터페이스 언어

단어는 인터페이스 아키텍처의 일부입니다. 기능의 어휘는 구현 기능을 낱낱이 번역한 것이 아니라 목적지, 객체, 명령, 상태, 결과로 이루어진 하나의 체계로 작성하세요. 실제 맥락에서 정확함이 유지되는 가장 짧은 표현을 우선합니다.

<a id="let-context-carry-context"></a>

### 맥락이 맥락을 전달하게 하기

주변 표면이 이미 알려 주는 정보는 반복하지 마세요. 사이드바 대상은 대개 객체나 도메인 그 자체이므로 `Users`처럼 쓰고 `User Management`처럼 쓰지 않습니다. 마찬가지로 `Shortcuts`처럼 쓰고 `Shortcut Configuration Management`처럼 쓰지 않습니다. 각 행에 이미 동작이 들어 있는 열에는 일반적인 `Operation` 헤딩을 생략할 수 있습니다. 제목이 `Delete “Roadmap”?`인 대화상자는 같은 질문을 다시 묻는 본문 텍스트가 필요 없습니다.

이는 맥락 경제성이지, 삭제 자체가 목적이 아닙니다. 텍스트는 결정에 영향을 줄 때 추가하세요. 영향받는 범위, 되돌릴 수 없는 결과, 특이한 선행 조건, 복구 방법을 밝히는 경우가 그렇습니다. 덧붙이는 모든 단어는 현재 레이아웃이 아직 답하지 못한 질문에 답해야 합니다.

목적지와 객체에는 명사(`Users`, `Appearance`, `Orders`), 명령에는 동사(`Save`, `Duplicate`, `Export`), 상태에는 형용사나 짧은 구(`Offline`, `Up to date`, `Pending review`)를 사용합니다. `Management`, `Module`, `Page`, `Function`, `Operation`, `System` 같은 래퍼 단어는 실제 도메인 개념을 구분하는 경우가 아니라면 피하세요.

<a id="write-each-language-do-not-translate-its-shape"></a>

### 언어마다 새로 쓰고, 형식을 그대로 옮기지 않기

공유된 의도, 위계, 용어에서 출발해 각 로케일을 자연스러운 인터페이스 언어로 작성하세요. 원문 언어의 어순, 단어 수, 공손을 위한 군더더기, 문법 범주를 그대로 보존하려 하지 마세요. 영어 단어 `Users` 하나는 중국어에서 직역하면 “user management”로 늘어나는 기능 개념을 표현할 수 있습니다. 충실성이란 토큰이 아니라 목적을 보존하는 것입니다.

둘러싼 정보 구조가 이미 제공하는 단어는 제거하세요. `Settings` 화면 안에서 대상 이름은 대개 `Account` 하나로 충분합니다. `Account Settings` 같은 표현이나 부자연스러운 단수형 `Account Setting` 같은 표현은 쓰지 않습니다. 올바른 영어 레이블은 독립된 원문 문구가 아니라 역할과 주변 요소로 정해집니다.

반복되는 객체, 명령, 상태에는 작은 제품 용어집을 유지하세요. 맥락에 따라 의미가 실제로 달라지지 않는 한, 도구 모음, 메뉴, 컨텍스트 메뉴, 대화상자, 단축키 검색, 문서에서 같은 용어를 사용합니다. 카피는 렌더링된 화면에서 검토하세요. 로케일 파일만으로는 보이지 않는 반복이나 일관성 없는 범위가 인접한 레이블에서 드러나는 경우가 많습니다.

현지화된 기술 문서에서는 번역하면 정확도가 떨어질 때 확립된 프레임워크 용어를 그대로 유지하세요. API 식별자는 원래 형태를 유지하고 코드로 표기합니다. 기술적으로 보이려는 목적만으로 일반 외래어를 남겨 두지 마세요. 유지한 용어는 필요하면 처음 등장할 때 설명하고, 이후 인터페이스, 문서, API 예제 전반에서 같은 형태를 사용합니다.

문서에서는 이름이 있는 API, 컴포넌트, 소스 파일, 가이드를 링크 텍스트에 정확한 영어 이름으로 표기하며, 현지화된 페이지에서도 마찬가지입니다. 이름을 번역하거나 불필요한 `NSH` 접두어를 붙이지 말고 `View`, `Button`, `Menu`, `Text`처럼 씁니다. 주변 설명은 해당 페이지의 언어로 작성하세요. 링크는 이름이 있는 대상에만 걸고, “소스”처럼 인용 이유를 설명하는 단어는 링크 밖에 둡니다.

여러 로케일이 공유하는 기술 비교 표에서는 기능 이름, 프레임워크 이름, API 이름, 모델 이름을 확립된 영어 형태로 유지하세요. 번역 대상은 표 주변의 설명이며, 표의 기술 레이블이 아닙니다. 확립된 현지 명칭이 있는 일반적인 인터페이스 단어는 이러한 비교 맥락 밖에서라면 여전히 현지화할 수 있습니다.
<a id="buttons-and-confirmation-dialogs"></a>

### 버튼과 확인 대화상자

버튼 레이블은 기본적으로 짧게, 보통 한두 단어로 작성하며, 제스처나 컴포넌트가 아니라 결과를 설명합니다.
`Save`, `Move`, `Delete` 같은 레이블을 `Click to save`, `Perform move`, `Confirm deletion` 같은 레이블보다 우선합니다. 확정하지 않고 나가는 동작에는 일관되게 `Cancel` 레이블을 사용합니다. `OK` 레이블은 순수하게 정보를 제공하는 내용을 확인했음을 나타낼 때만 사용합니다.

짧게 쓰는 것은 기본 원칙이지 글자 수 제한이 아닙니다. 레이블의 단어가 결과를 드러내거나 사용자가 혼동하기 쉬운 선택지를 구분해 준다면 의도적으로 더 긴 레이블이 낫습니다. 예를 들어 `Delete from this group`와 `Delete
everywhere`, or `Restart without saving`을 구분하는 경우가 그렇습니다. 길이는 결정에 꼭 필요한 정보를 위해서만 늘려야 하며, 대화상자의 제목이나 본문을 반복해서는 안 됩니다.

가능하면 가장 구체적이면서 간결한 결과를 확인 레이블로 사용합니다.

| 상황 | 지양 | 권장 |
| --- | --- | --- |
| 삭제 대화상자 | `Yes`, `Sure`, `Confirm deletion` | `Delete` |
| 저장하지 않은 변경 사항 | `Confirm`, `Yes` | `Discard changes` |
| 단순 확인 | `Confirm operation` | `OK` 또는 `Done` |
| 결과를 나타내는 명확한 동사가 없는 복합 동의 | `Yes` | `Confirm` |

`Confirm`는 주변 대화상자가 복합적인 확정 사항을 충분히 설명하고 더 짧은 결과 동사가 정확하지 않을 때 쓸 수 있는 대안입니다. 명확한 명령을 대체해서는 안 됩니다. `Sure`는 안정적인 영어 명령이 아니라 구어체 표현이며, 표준 어휘로 쓰기에는 너무 모호합니다.

확인 대화상자는 하나의 간결한 결정을 구성해야 합니다.

- 제목: `Delete “Roadmap”?`처럼 결정 사항이나 상황을 나타냅니다.
- 본문: 새로운 범위, 결과, 복구 정보만 담습니다.
- 동작: `Cancel`와 `Delete`처럼 결과를 나타내는 동작을 둡니다.
- 파괴적 동작 스타일: 정확한 문구를 대체하지 않고, 파괴적인 결과를 수행하는 동작(`destructive` 역할을 가진 `AlertDialog` 동작)에 적용합니다.

실제 상황을 구체적으로 명시할 수 있다면 `Notice`, `Warning`, `Error`, `Confirmation` 같은 일반적인 제목은 피합니다.
구조나 상태가 이미 의미를 전달한다면 “Are you sure you want to…”, “Would you like to…”, “Please note that…”, “successfully” 같은 관용적인 표현은 피합니다. 공손함은 `please`의 반복이 아니라 차분하고 정중한 어조에서 나와야 합니다.

<a id="capitalization-punctuation-and-symbols"></a>

### 대소문자, 문장 부호, 기호

영어 UI에서는 기본적으로 문장형 대소문자(sentence case)를 사용합니다. `Reset layout`처럼 쓰고 `Reset Layout`이나 `RESET LAYOUT`처럼 쓰지 않습니다. 고유명사와 널리 쓰이는 약어는 그대로 유지합니다. 네이티브 메뉴 명령에 제목형 대소문자(title case) 같은 플랫폼 관례를 따르는 것은 플랫폼 통합에 도움이 될 때만 하며, 그 경우 같은 컴포넌트 클래스 안에서 일관되게 적용합니다.

모두 대문자(ALL CAPS)는 아주 짧은 섹션 레이블, 아이브로(eyebrow), 상태, 널리 쓰이는 약어, 코드와 유사한 식별자에 한해 절제된 타이포그래피 강조로 쓸 수 있습니다. 간결한 형태와 적절한 자간 덕분에 굵은 글씨와 비슷한 위계를 만들 수 있지만, 버튼, 긴 제목, 문장, 밀도 높은 목록에는 어울리지 않습니다. 같은 영역에서 대문자, 강한 색상, 굵은 글씨를 함께 쓰지 말고, 모든 문자열을 자동으로 변환하지도 마십시오. 제품 이름, 약어, 현지화된 콘텐츠는 의도한 대소문자를 유지해야 합니다.

레이블, 버튼, 메뉴 항목, 탭, 제목, 플레이스홀더, 짧은 상태 문구에는 마침표를 붙이지 않습니다. 완결된 설명, 경고, 오류 문장에는 마침표를 붙입니다. 일상적인 성공과 실패 메시지에는 느낌표를 피합니다. 중국어에서는 문장에 전각 문장 부호를 사용하고, 같은 의미 규칙에 따라 짧은 컨트롤 레이블에는 끝 문장 부호를 생략합니다.

마침표 세 개가 아니라 줄임표 문자 하나(`…`)를 사용합니다. 대화상자, 시트, 별도 창을 여는 모든 버튼이나 메뉴 항목과, `Settings…`나 `Export…`처럼 완료하기 전에 추가 입력이나 선택이 필요한 명령에 붙입니다. 즉시 실행되는 명령에는 줄임표를 붙이지 않습니다. 진행 중인 작업은 장식용 점이 아니라 불확정 진행률 표시기로 나타냅니다.

오류는 무슨 일이 일어났는지 설명하고, 유용하다면 다음 복구 동작도 안내해야 합니다. 성공 피드백은 결과 상태가 아직 눈에 보이지 않을 때만 그 상태를 알려야 합니다. 기술 코드나 긴 사과보다 `Couldn’t save. Check your connection and try again.`처럼 쓰는 편이 낫습니다. 문서가 눈에 띄게 저장된 상태가 되는 경우에는 `Saved successfully` 토스트를 생략합니다.

<a id="internationalization-and-platform-fit"></a>

## 국제화와 플랫폼 적합성

접근성(A11y) 이름과 레이블은 영어로 유지해도 되며, 이러한 문자열은 현지화하지 않아도 됩니다. 어떤 항목에 작용하는 컨트롤의 이름을 지을 때는 그 항목 자체의 레이블이 현지화되어 있더라도 그대로 유지합니다. 이 예외는 화면에 보이는 UI 문구에는 적용되지 않습니다.

문구는 텍스트 길이 증가, CJK 타이포그래피, 오른쪽에서 왼쪽으로 쓰는 문자, 서로 다른 단축키 표기법에서도 문제없이 동작해야 합니다. 하나의 영어 레이블을 기준으로 컨트롤 크기를 정하지 마십시오. 텍스트를 래스터 에셋에 넣지 말고, 번역된 조각을 이어 붙이지 말며, 툴팁 같은 복구 경로가 제품에 정의된 경우에만 레이블이 줄바꿈되거나 잘리도록 합니다.

의미 있는 플랫폼 차이를 존중하십시오. Command와 Control, 네이티브 창 장식, 시스템 모양, 스크롤바 동작, 메뉴, 알림 기능, 그리고 휴대폰의 시스템 헤더, 뒤로 가기 제스처, 알림창이 여기에 해당합니다. 제품의 정보 구조는 플랫폼 간에 안정적으로 유지하되, 피상적인 픽셀 단위 일치를 위해 익숙한 플랫폼 동작을 없애지 마십시오.

NSH 앱은 휴대폰, 태블릿, 데스크톱, 웹에서 실행되며 호스트 앱 내부에서 실행되는 경우도 많습니다. 각 환경에 맞게 설계하십시오.

- **시스템 UI는 플랫폼의 모양을 유지합니다.** iOS와 Android에서 페이지 헤더는 시스템이 그립니다(`NavPage`의 `title`와 헤더 옵션). 데스크톱과 웹에서는 앱이 그리는 페이지의 `header` 슬롯이 표시됩니다. 모든 페이지에 둘 다 제공하십시오([내비게이션](./navigation.md#navpage-and-the-header)). 확인에는 `AlertDialog`를 사용하며, 상태 표시줄은 맨 위에 있는 페이지나 대화상자를 따릅니다(`statusBar`).
- **호스트의 테마.** 임베디드 앱은 호스트의 테마를 받을 수 있으며, 토큰을 읽는 클래스와 Rust 바인딩은 이를 네이티브로 따릅니다([테마 토큰](./tailwind.md#theme-tokens)).
- **세이프 에어리어와 키보드.** 콘텐츠는 세이프 에어리어 안에 두고(`env(safe-area-inset-*)`, `safeAreaInsets()`), 입력란은 소프트웨어 키보드 위에 유지합니다(`env(keyboard-inset-height)`)([기기 및 환경](./device-and-environment.md)).
- **모양, 텍스트 크기, 모션.** 모든 화면은 라이트 모드와 다크 모드(`dark:`, `colorScheme()`), 사용자의 텍스트 크기, 모션 줄이기(`motion-reduce:`, `reduceMotion()`)에서 동작해야 합니다.
- **오른쪽에서 왼쪽.** 레이아웃 방향은 로케일을 따르며, `direction` 스타일은 뷰와 그 하위 트리의 방향을 설정합니다. 시작 및 끝 속성은 방향에 맞게 반전됩니다([오른쪽에서 왼쪽](./layout.md#right-to-left)).
- **터치와 포인터.** 터치 대상은 최소 44 × 44포인트여야 하며, 호버와 툴팁은 포인터가 있을 때만 존재합니다.

```rust tabs
use nsh_base::nav_page;

nav_page()
    .title("Inbox")
    .header(page_header("Inbox"))
    .child(inbox())
```

```tsx tabs
import { NavPage } from "nsh/base";

<NavPage title="Inbox" header={<PageHeader title="Inbox" />}>
  <Inbox />
</NavPage>
```

<a id="guidance-for-ai-generated-interfaces"></a>

## AI 생성 인터페이스 가이드

NSH 인터페이스를 변경하는 AI는 먼저 가장 가까운 기능, 앱의 컴포넌트와 테마 토큰, 컴포넌트 문서와 선언(`.nsh/types`)을 살펴봐야 합니다. 코드를 생성하기 전에 주요 작업, 상태 소유자, 컴포넌트 구성, 키보드와 터치 경로를 명시해야 합니다. React, React Native, Shadcn 예제에서 API를 추측해서는 안 되며, 이름이 그럴듯하다는 이유로 NSH에 없는 prop이나 메서드를 만들어 내서도 안 됩니다. 존재하지 않는 항목은 빌드의 클래스 검사와 `nsh check` 결과에서 확인할 수 있습니다.

계층 구조, 밀도, 컴포넌트 선택, 예외적인 리터럴 값이 왜 이 제품에 적합한지 사람이 설명할 수 있을 때까지 AI 출력은 완성된 것이 아닙니다. 시각적으로 그럴듯한 스크린샷은 증거가 되지 않습니다. 키보드와 터치 동작, 포커스, 동적 콘텐츠, 테마, 크기 조절, 텍스트 크기, 실패 상태도 디자인의 일부입니다.

<a id="accessibility-checklist"></a>

## 접근성 체크리스트

화면을 완성된 것으로 간주하기 전에 다음을 확인하십시오.

- 모든 동작을 키보드, 터치, 스크린 리더로 접근하고 조작할 수 있습니다.
- 포커스 순서가 시각적 순서와 작업 순서를 따릅니다.
- 포커스가 계속 보이며 오버레이가 닫힌 뒤 복원됩니다.
- 컨트롤에 접근 가능한 이름이 있으며, 아이콘만 있는 컨트롤은 의미, 범위, 단축키에 설명이 필요할 때 툴팁을 사용합니다.
- 텍스트와 의미 있는 경계가 충분한 대비를 갖습니다.
- 상태를 색상만으로 전달하지 않습니다.
- 비활성 상태와 읽기 전용 상태를 구별할 수 있습니다.
- 레이블, 오류, 설명이 해당 컨트롤 가까이에 있습니다.
- 더 긴 번역, 오른쪽에서 왼쪽 방향, 더 큰 텍스트에서도 콘텐츠를 사용할 수 있습니다.
- 터치 대상은 최소 44 × 44포인트이며, 밀도 높은 레이아웃에서도 포인터 대상은 충분히 편안한 크기입니다.

<a id="design-review-checklist"></a>

## 디자인 리뷰 체크리스트

리뷰는 컴포넌트 목록을 작성하는 것이 아니라 인터페이스가 올바른 결정을 내렸는지 판단하는 것입니다. 다음을 순서대로 질문하십시오.

1. **작업이 명확한가?** 새로운 사용자가 배우거나 추측하거나 시험해 보지 않고도 목적, 주요 동작, 다음 단계를 알아볼 수 있습니까?
2. **모든 동작이 약속을 지키는가?** 레이블, 컨트롤, 상태, 범위, 피드백, 결과가 하나의 일관된 결과를 설명합니까?
3. **계층이 분명하면서 절제되어 있는가?** 핵심 기능이 마땅한 공간을 차지하면서도 강한 색상, 굵은 글씨, 배지, 알림, 주요 버튼은 드물게 사용됩니까?
4. **더 적게, 더 잘할 수 있는가?** 전체 작업을 약화하지 않고 진입점, 옵션, 상태를 제거하거나 합치거나 미룰 수 있습니까?
5. **구조가 정확한가?** 같은 위계의 요소들이 정렬 기준선을 공유하고, 같은 간격이 렌더링된 픽셀 단위까지 같으며, 스크롤바가 실제 스크롤 영역의 가장자리에 있습니까?
6. **컴포넌트 시스템을 따르는가?** 표준 컨트롤이 기하 구조, 상태, 키보드 동작, 해제 모델을 유지하고, 모양은 테마와 스케일 토큰으로 제공됩니까?
7. **모든 상태와 제약 조건에서 사용할 수 있는가?** 키보드, 터치, 포커스 동작, 비어 있음/로딩/실패/권한 상태, 더 긴 번역, 더 큰 텍스트, 오른쪽에서 왼쪽 방향, 두 가지 모양, 최소 창 크기, 모션 줄이기를 확인했습니까?
8. **실제 플랫폼에서 테스트했는가?** 이상적인 스크린샷만이 아니라, 출시하는 각 플랫폼(`nsh run --target …`, `nsh test --target …`)에서 실제 컴포넌트, 문구, 대표적인 콘텐츠로 작업을 끝까지 수행했습니까?
