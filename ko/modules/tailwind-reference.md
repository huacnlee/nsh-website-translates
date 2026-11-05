---
title: "Tailwind 레퍼런스"
description: "NSH가 네이티브로 처리하는 모든 Tailwind 유틸리티와 변형(variant), 임의 값(arbitrary value) 구문, 그리고 nsh.json에서 테마를 확장하는 방법을 설명합니다."
order: 17
source_hash: 11bee6a70fb79c0f
---

# Tailwind 레퍼런스

모든 요소는 `class` prop으로 Tailwind CSS 클래스를 받습니다(조건부 클래스는 `classList`). NSH는 Tailwind 4의 기본 테마를 기준으로 Rust에서 클래스를 해석합니다. JS는 문자열만 전달하고, 서로 다른 문자열은 각각 한 번만 파싱되어 캐시됩니다. `dark:`나 `active:` 같은 variant는 외형, 창 크기 또는 눌림 상태가 바뀔 때 JS를 실행하지 않고 네이티브에서 다시 평가됩니다.

각 유틸리티는 Tailwind CSS 4가 생성하는 값을 그대로 설정하며, 의미도 브라우저와 같습니다. 이 페이지는 지원되는 항목을 나열합니다. 소개는 [Tailwind](../docs/tailwind.md)를, 유틸리티가 설정하는 스타일 키는 [스타일 레퍼런스](./style-reference.md)를 참고하십시오.

Rust 컴포넌트는 클래스 문자열을 받지 않습니다. 대신 `Styled`(`nsh_core::prelude`)의 타입이 지정된 메서드로 요소의 스타일을 지정합니다. 메서드 이름은 이 유틸리티들을 따르고 같은 값으로 해석되며, Tailwind의 기본 스케일도 포함됩니다(`px-4` 대응: `.px_4()`, `rounded-2xl` 대응: `.rounded_2xl()`, `shadow-md` 대응: `.shadow_md()`, `bg-linear-to-br` 대응: `.bg_linear_to_br()`). 색상은 값입니다. 테마 색상이거나 `nsh_core::element::palette` 형태의 Tailwind 팔레트입니다(`ZINC.shade(800)` 대응: `zinc-800`). variant는 스타일 클로저를 받는 메서드입니다: `.active(|s| …)`, `.hover(…)`, `.focus(…)`, `.disabled_style(…)`, `.dark(…)`, `.group_active(…)`, 그 밖의 경우는 `.style_when(condition, …)`. 각 스타일 키에 해당하는 메서드는 [스타일 레퍼런스](./style-reference.md)에 나와 있습니다.

```rust tabs
use nsh_core::{element::palette::{RED, ZINC}, prelude::*};

view()
    .flex_row()
    .items_center()
    .gap_3()
    .rounded_2xl()
    .bg(white())
    .p_4()
    .shadow_md()
    .active(|s| s.scale(0.98))
    .transition()
    .dark(|s| s.bg(ZINC.shade(800)))
    .child(
        text("Inbox")
            .text_base()
            .font_weight(FontWeight::SEMIBOLD)
            .text_color(ZINC.shade(900))
            .dark(|s| s.text_color(white())),
    )
    .child(
        text(move || unread.get().to_string())
            .text_color(move || if unread.get() > 0 { RED.shade(500) } else { ZINC.shade(400) }),
    )
```

```tsx tabs
<View class="flex-row items-center gap-3 rounded-2xl bg-white p-4 shadow-md active:scale-[0.98] transition dark:bg-zinc-800">
  <Text class="text-base font-semibold text-zinc-900 dark:text-white">Inbox</Text>
  <Text classList={{ "text-red-500": unread() > 0, "text-zinc-400": unread() === 0 }}>{unread()}</Text>
</View>
```

<a id="how-classes-combine"></a>

## 클래스가 결합되는 방식

- **나중에 온 것이 우선합니다.** 같은 variant 수준의 유틸리티 중에서는 문자열에서 더 뒤에 있는 것이 우선합니다. `"p-4 p-2"`의 결과는 `p-2`입니다. 컴포넌트는 `class` prop을 받아 `tailwind-merge` 없이 자신의 클래스 뒤에 덧붙일 수 있습니다.
- **variant는 일반 유틸리티 뒤에 적용되며**, Tailwind의 variant 순서를 따릅니다: `group-*:`(상태별, 그다음 그룹 이름별), `selection:`, `placeholder:`, 위치(`first:` ...), `checked:`, `indeterminate:`, `selected:`, `focus-within:`, `hover:`, `focus:`, `focus-visible:`, `active:`, `enabled:`, `disabled:`, `aria-busy:`, `aria-checked:`, `aria-expanded:`, `aria-pressed:`, `aria-selected:`, `data-*:`(이름별), 모션, `max-*:` 브레이크포인트는 넓은 것부터, 그다음 브레이크포인트는 오름차순, 화면 방향, 텍스트 방향, `dark:`, 마지막으로 플랫폼. 클래스의 가장 높은 variant가 먼저 순서를 결정하고, 그다음 높은 variant가 결정하며, variant가 하나 더 붙은 쪽이 나중에 옵니다(`dark:hover:` 쪽이 `dark:` 뒤에 옵니다). Tailwind의 정렬 방식과 같습니다. 따라서 눌려 있는 동안 빨간색이 되는 클래스는 `"active:bg-red-500 bg-blue-500"`입니다.
- **`style` 쪽이 클래스보다 우선합니다.** 해석된 클래스 위에 덧입혀지는 것이 인라인 `style`입니다. 스타일 키는 이름이 같은 CSS 속성, 즉 유틸리티가 설정하는 바로 그 속성이므로 해당 속성만 대체하고 다른 것은 건드리지 않습니다. `style={{ paddingLeft: 8 }}` 쪽이 `pl-4` 쪽보다 우선하며 `pr-4` 쪽은 그대로 유지됩니다. important 유틸리티(`!p-4` 또는 `p-4!`)도 인라인 스타일보다 우선합니다.
- **텍스트 스타일은 상속됩니다.** view에 지정한 텍스트 유틸리티(`text-white`, `font-bold`, `text-center`, ...)는 CSS와 같이 그 안의 `<Text>` 및 `<Input>` 요소로 전달됩니다.
- **display는 CSS를 따릅니다.** `flex`, `inline-flex` 클래스는 방향 유틸리티가 달리 지정하지 않는 한(문자열에서 어디에 있든) 행(row)을 만듭니다(`flex-col flex`의 경우 열입니다). 스타일의 `display: "flex"`도 같은 방식으로 행이 되며, display를 지정하지 않은 view는 NSH의 기본값인 열을 유지합니다.

<a id="units-and-the-theme"></a>

## 단위와 테마

길이는 포인트 단위입니다(`1` = iOS에서는 1포인트, Android에서는 1dp). Tailwind의 `1rem` 값은 16포인트이므로 테마는 같은 밀도의 웹과 일치합니다. 간격 한 단계는 4포인트(`p-4` = 16포인트)이고, `text-base` 값은 16포인트입니다.

<a id="spacing-values"></a>

### 간격 값

간격 값을 받는 유틸리티(패딩, 마진, 갭, 인셋, 너비, 높이, `basis`, `translate`, `leading`)는 다음 값을 받을 수 있습니다.

| 값 | 예시 | 결과 |
|---|---|---|
| 단계(1/4 단계 허용) | `p-4`, `gap-1.5`, `m-0.25` | 단계 × 4포인트 |
| `px` | `p-px`, `-mt-px` | 1포인트 |
| `0` | `m-0` | 0 |
| 분수(인셋, 너비, 높이, `basis`, `translate`) | `w-1/2`, `left-1/3` | 부모 대비 백분율 |
| `full` (동일) | `w-full`, `inset-full` | 100% |
| `auto` (마진, 인셋, 너비, 높이, basis) | `mx-auto`, `w-auto` | `"auto"` |
| 임의 값 | `p-[13px]`, `w-[42%]`, `mt-[1.5rem]` | 지정한 길이 |

마진, 인셋, `translate`, `rotate`, `skew`, `scale`, `z`, `hue-rotate`, `tracking`, `underline-offset`, `outline-offset`, 그리드 라인, 그라디언트 각도는 앞에 `-` 접두사를 붙여 음수 값을 나타냅니다: `-mt-2`, `-translate-x-1/2`, `-rotate-6`. Tailwind에는 나머지(`-p-4`, `-gap-2`, `-w-4`)의 음수 형태가 없으며, NSH에도 없습니다.

<a id="colors"></a>

### 색상

Tailwind 4의 전체 팔레트가 내장되어 있습니다: `red`, `orange`, `amber`, `yellow`, `lime`, `green`, `emerald`, `teal`, `cyan`, `sky`, `blue`, `indigo`, `violet`, `purple`, `fuchsia`, `pink`, `rose`, `slate`, `gray`, `zinc`, `neutral`, `stone`, `mauve`, `olive`, `mist`, `taupe`. 각 색상은 `50`, `100`–`900`, `950` 단계를 가지며, `black`, `white`, `transparent`도 제공됩니다. 사용자 정의 색상의 출처는 `nsh.json`입니다([테마 커스터마이징](#theme-customization) 참고).

모든 색상 유틸리티는 다음 형태를 받습니다.

| 형태 | 예시 |
|---|---|
| 테마 색상 | `bg-sky-500`, `text-brand` |
| 불투명도 수정자(퍼센트) | `bg-black/50`, `ring-black/5` |
| 임의 불투명도 | `text-black/[0.35]` |
| 임의 색상 | `bg-[#0ea5e9]`, `border-[rgb(0_0_0_/_0.1)]`, `text-[oklch(70%_0.2_50)]` |
| 수정자가 있는 임의 색상 | `bg-[rgb(0_0_255)]/25` |

`currentColor`, `inherit` 모두 색상 값이 아닙니다. 브라우저와 마찬가지로, 색상 클래스가 없는 border, outline, ring은 요소 자신의 텍스트 색상 또는 상속받은 텍스트 색상으로 그려지며(`<View class="text-white"><View class="border ring-2" /></View>` 사용 시 둘 다 흰색으로 그려집니다), `style` prop으로 너비만 지정하고 색상을 지정하지 않은 border도 마찬가지입니다.

<a id="arbitrary-values"></a>

## 임의 값

대괄호를 사용하면 테마에 없는 값을 전달할 수 있습니다: `w-[37px]`, `grid-cols-[200px_1fr]`, `bg-[linear-gradient(45deg,red,blue)]`.

- `_` 문자는 공백을 나타냅니다(`grid-cols-[1fr_2fr]`). 리터럴 밑줄은 `\_` 형태로 작성합니다.
- 길이: 단위 없는 숫자 또는 `px`(포인트), `pt`(포인트의 4/3, CSS와 동일), `rem`(16포인트), 백분율이 의미 있는 곳에서는 `%`.
- 각도(`rotate-[...]`, `hue-rotate-[...]`, `bg-linear-[...]`): `deg`, `rad`, `grad`, `turn`.
- 시간(`duration-[...]`, `delay-[...]`): `ms` 또는 `s`. 단위 없는 숫자는 밀리초입니다.
- 타입 힌트로 모호한 값을 구분합니다. 크기는 `text-[length:22px]`, 색상은 `text-[color:#333]` 형태를 쓰며, `border-[length:3px]`도 마찬가지입니다.

임의 CSS 속성(`[mask-type:luminance]`)은 지원되지 않습니다.

<a id="layout"></a>

## 레이아웃

| 클래스 | 설정 |
|---|---|
| `flex`, `inline-flex` | `display: "flex"` 설정, 방향 유틸리티가 없으면 행 |
| `grid`, `inline-grid` | `display: "grid"` |
| `block`, `flow-root` | 블록 레이아웃 또는 독립적인 블록 포매팅 컨텍스트 |
| `box-border`, `box-content` | 크기가 border와 padding을 포함하거나 콘텐츠만 포함 |
| `w/h/size-min`, `w/h/size-max`, `w/h/size-fit` | Taffy의 내재적 크기: `min-content`, `max-content`, `fit-content` |
| `inline`, `inline-block` | `display: "block"`: flex 또는 grid 부모 안에서 브라우저가 계산하는 값 |
| `hidden` | `display: "none"` |
| `relative`, `absolute` | `position` |
| `static` | `position: "static"`: 흐름 안에 있으며 inset은 무시됨. absolute 자손은 가장 가까운 positioned 조상을 사용 |
| `sticky` | `position: "sticky"`: 흐름 안에 있으며, 부모가 보이는 동안 주변 scroll view 안에서 `top`에 고정됨(가로 scroll view에서는 `left`) |
| `fixed` | `position: "fixed"`: 루트 view의 박스(창 또는 해당 modal) 안에 배치되어 그 루트 view의 자식 위에 놓이며, 주변이 스크롤되어도 제자리에 있는 요소 |
| `inset-<n>`, `inset-x-<n>`, `inset-y-<n>` | `top` / `right` / `bottom` / `left` |
| `top-<n>`, `right-<n>`, `bottom-<n>`, `left-<n>` | 해당하는 오프셋 |
| `start-<n>`, `end-<n>` | `start` / `end` (방향 인식) |
| `z-<n>`, `z-auto`, `z-[<n>]` | `zIndex` (`z-auto` = 0) |
| `visible` | `visibility: "visible"` |
| `invisible`, `collapse` | `visibility: "hidden"` (공간 유지) |
| `overflow-hidden`, `overflow-clip`, `overflow-x-hidden`, `overflow-y-hidden` | `overflow: "hidden"` |
| `overflow-visible` | `overflow: "visible"` |
| `aspect-square`, `aspect-video`, `aspect-<a>/<b>`, `aspect-[<a>/<b>]`, `aspect-auto` | `aspectRatio` (1, 16/9, a/b, 없음) |

스크롤은 클래스가 아니라 요소입니다. `overflow-auto`, `overflow-scroll` 모두 지원되지 않습니다. [scroll](../elements/scroll.md)을 사용하십시오.

<a id="flexbox-and-grid"></a>

## Flexbox와 grid

| 클래스 | 설정 |
|---|---|
| `flex-row`, `flex-row-reverse`, `flex-col`, `flex-col-reverse` | `flexDirection` |
| `flex-wrap`, `flex-wrap-reverse`, `flex-nowrap` | `flexWrap` |
| `flex-1` | grow 1, shrink 1, basis 0 |
| `flex-<n>` | grow n, shrink 1, basis 0 |
| `flex-auto` | grow 1, shrink 1, basis auto |
| `flex-initial` | grow 0, shrink 1, basis auto |
| `flex-none` | grow 0, shrink 0, basis auto |
| `flex-[<grow>]`, `flex-[<grow>_<shrink>_<basis>]` | CSS 축약형: `flex-[2]`, `flex-[3_0_50%]` |
| `grow`, `grow-<n>`, `grow-[<n>]` | `flexGrow` (단독 사용: 1) |
| `shrink`, `shrink-<n>`, `shrink-[<n>]` | `flexShrink` (단독 사용: 1) |
| `basis-<n>` | `flexBasis` (간격, 분수, `full`, `auto`, 임의 값) |
| `justify-start`, `justify-end`, `justify-center`, `justify-between`, `justify-around`, `justify-evenly`, `justify-stretch`, `justify-normal` | `justifyContent` |
| `items-start`, `items-end`, `items-center`, `items-baseline`, `items-stretch` | `alignItems` |
| `self-auto`, `self-start`, `self-end`, `self-center`, `self-stretch`, `self-baseline` | `alignSelf` |
| `content-start`, `content-end`, `content-center`, `content-between`, `content-around`, `content-evenly`, `content-stretch`, `content-normal` | `alignContent` |
| `justify-items-start`, `-end`, `-center`, `-stretch`, `-normal` | `justifyItems` |
| `justify-self-auto`, `-start`, `-end`, `-center`, `-stretch` | `justifySelf` |
| `place-content-center`, `-start`, `-end`, `-between`, `-stretch` | `alignContent` 및 `justifyContent` |
| `place-items-center`, `-start`, `-end`, `-stretch` | `alignItems` 및 `justifyItems` |
| `place-self-auto`, `-center`, `-start`, `-end`, `-stretch` | `alignSelf` 및 `justifySelf` |
| `gap-<n>`, `gap-x-<n>`, `gap-y-<n>` | `gap`, `columnGap`, `rowGap` |
| `space-x-<n>`, `space-y-<n>` (음수 포함) | 마지막을 제외한 각 자식의 마진: Tailwind CSS와 같이 자식 자신의 마진 아래에 깔리는 end 마진(`space-x`) 또는 아래쪽 마진(`space-y`). `gap`에 더해짐 |
| `space-x-reverse`, `space-y-reverse` | 대신 start / top 쪽 마진(자식을 역순으로 배치할 때) |
| `grid-cols-<n>` | `gridTemplateColumns: "repeat(n, minmax(0, 1fr))"` |
| `grid-cols-[<tracks>]`, `grid-cols-none` | `gridTemplateColumns` (`grid-cols-[200px_1fr]`) |
| `grid-rows-<n>`, `grid-rows-[<tracks>]`, `grid-rows-none` | `gridTemplateRows` |
| `col-span-<n>`, `col-span-full`, `col-auto`, `col-<n>`, `col-[<value>]` | `gridColumn` |
| `col-start-<n>`, `col-end-<n>` (및 `-auto`) | `gridColumnStart`, `gridColumnEnd` |
| `row-span-<n>`, `row-span-full`, `row-auto`, `row-<n>`, `row-[<value>]` | `gridRow` |
| `row-start-<n>`, `row-end-<n>` (및 `-auto`) | `gridRowStart`, `gridRowEnd` |
| `grid-flow-row`, `grid-flow-col`, `grid-flow-dense`, `grid-flow-row-dense`, `grid-flow-col-dense` | `gridAutoFlow` |
| `auto-cols-auto`, `-min`, `-max`, `-fr`, `auto-cols-[<track>]` | `gridAutoColumns` |
| `auto-rows-auto`, `-min`, `-max`, `-fr`, `auto-rows-[<track>]` | `gridAutoRows` |

<a id="spacing"></a>

## 간격

| 클래스 | 설정 |
|---|---|
| `p-<n>`, `px-<n>`, `py-<n>` | `padding`, `paddingHorizontal`, `paddingVertical` |
| `pt-<n>`, `pr-<n>`, `pb-<n>`, `pl-<n>` | `paddingTop` / `Right` / `Bottom` / `Left` |
| `ps-<n>`, `pe-<n>` | `paddingStart`, `paddingEnd` (방향 인식) |
| `m-<n>`, `mx-<n>`, `my-<n>` | `margin`, `marginHorizontal`, `marginVertical` |
| `mt-<n>`, `mr-<n>`, `mb-<n>`, `ml-<n>` | `marginTop` / `Right` / `Bottom` / `Left` |
| `ms-<n>`, `me-<n>` | `marginStart`, `marginEnd` (방향 인식) |

<a id="sizing"></a>

## 크기

| 클래스 | 설정 |
|---|---|
| `w-<n>`, `h-<n>` | `width`, `height` (간격, 분수, `full`, `auto`, 임의 값) |
| `size-<n>` | `width` 및 `height` |
| `min-w-<n>`, `max-w-<n>`, `min-h-<n>`, `max-h-<n>` | 해당하는 제한값 |
| `w-screen`, `w-dvw`, `w-svw`, `w-lvw` | 창 너비(`min-w-` / `max-w-`에서도 사용 가능) |
| `h-screen`, `h-dvh`, `h-svh`, `h-lvh` | 창 높이(`min-h-` / `max-h-`에서도 사용 가능) |
| `w-auto`, `h-auto` | `auto` (콘텐츠에 따라 크기 결정) |
| `max-w-none`, `max-h-none` | 제한 없음 |
| `w-<container>`, `min-w-<container>`, `max-w-<container>` | 컨테이너 너비(아래 참고) |

컨테이너 너비(포인트): `3xs` 256, `2xs` 288, `xs` 320, `sm` 384, `md` 448, `lg` 512, `xl` 576, `2xl` 672, `3xl` 768, `4xl` 896, `5xl` 1024, `6xl` 1152, `7xl` 1280. `prose`의 너비는 요소 글꼴의 `0` 너비의 65배이며(CSS의 `65ch`), Tailwind CSS와 같습니다.

<a id="typography"></a>

## 타이포그래피

<a id="font"></a>

### 글꼴

| 클래스 | 설정 |
|---|---|
| `font-sans` | 시스템 글꼴 |
| `font-serif`, `font-mono` | `fontFamily: "serif"` / `"monospace"` |
| `font-thin` (100), `font-extralight` (200), `font-light` (300), `font-normal` (400), `font-medium` (500), `font-semibold` (600), `font-bold` (700), `font-extrabold` (800), `font-black` (900) | `fontWeight` |
| `font-[<weight>]`, `font-[<family>]` | 숫자는 굵기(weight), 그 외는 패밀리(family): `font-[650]`, `font-[Inter]` |
| `italic`, `not-italic` | `fontStyle` |
| `normal-nums`, `small-caps`, `oldstyle-nums`, `lining-nums`, `tabular-nums`, `proportional-nums` | `fontVariant` (조합 가능, 숫자 형태 초기화: `normal-nums`) |

<a id="size-color-and-line-height"></a>

### 크기, 색상, 줄 높이

`text-<size>` 클래스는 글꼴 크기와 Tailwind의 대응하는 줄 높이를 설정하며, 이 줄 높이는 문자열 내 위치나 variant와 관계없이 `leading-*` 클래스로 대체됩니다(`leading-tight md:text-lg` 사용 시 좁은 줄 간격이 유지됩니다).

| 클래스 | 크기 | 줄 높이 |
|---|---|---|
| `text-xs` | 12 | 16 |
| `text-sm` | 14 | 20 |
| `text-base` | 16 | 24 |
| `text-lg` | 18 | 28 |
| `text-xl` | 20 | 28 |
| `text-2xl` | 24 | 32 |
| `text-3xl` | 30 | 36 |
| `text-4xl` | 36 | 40 |
| `text-5xl` | 48 | 1× |
| `text-6xl` | 60 | 1× |
| `text-7xl` | 72 | 1× |
| `text-8xl` | 96 | 1× |
| `text-9xl` | 128 | 1× |

| 클래스 | 설정 |
|---|---|
| `text-<size>/<leading>` | 크기와 줄 높이: `text-sm/6`(24포인트), `text-lg/tight` |
| `text-[<length>]` | `fontSize`: `text-[22px]`, `text-[length:22px]` |
| `text-<color>` | `color` |
| `leading-none` (1), `leading-tight` (1.25), `leading-snug` (1.375), `leading-normal` (1.5), `leading-relaxed` (1.625), `leading-loose` (2) | 글꼴 크기의 배수로 지정한 `lineHeight` |
| `leading-<n>`, `leading-[<length>]` | 포인트 단위의 `lineHeight` (`leading-6` = 24) |
| `leading-[<number>]` | 글꼴 크기의 배수로 지정한 `lineHeight`(`leading-[1.5]`)이며, 그 배수 그대로 상속됨. `em`, `%` 사용 시 상속 전에 요소의 글꼴 크기를 기준으로 길이를 계산 |
| `tracking-tighter` (-0.05em), `tracking-tight` (-0.025em), `tracking-normal` (0), `tracking-wide` (0.025em), `tracking-wider` (0.05em), `tracking-widest` (0.1em) | 글꼴 크기에 상대적인 `letterSpacing` |
| `tracking-[<value>]` | `letterSpacing`: `tracking-[0.2em]`, `tracking-[1px]` |

<a id="alignment-case-and-wrapping"></a>

### 정렬, 대소문자, 줄바꿈

| 클래스 | 설정 |
|---|---|
| `text-left`, `text-center`, `text-right`, `text-justify` | `textAlign` |
| `text-start`, `text-end` | `textAlign: "start"` / `"end"`: 레이아웃 방향에서 줄의 시작 또는 끝 |
| `align-baseline`, `align-text-top`, `align-text-bottom`, `align-middle` | `verticalAlign` (text 안의 view와 image) |
| `uppercase`, `lowercase`, `capitalize`, `normal-case` | `textTransform` |
| `truncate` | 한 줄, 끝 말줄임, 줄바꿈 없음, `overflow: hidden` (view에서는 그 안의 text가 줄바꿈하지 않음) |
| `line-clamp-<n>`, `line-clamp-none` | `numberOfLines` (`none` = 모든 줄 표시) |
| `text-ellipsis`, `text-clip` | `textOverflow: "ellipsis"` / `"clip"` |
| `whitespace-nowrap`, `text-nowrap` | 줄이 바뀌지 않음. view에서는 그 안의 text의 줄에 적용(CSS의 `white-space`처럼 상속) |
| `whitespace-normal`, `text-wrap`, `text-balance`, `text-pretty` | 줄바꿈됨(균형 맞춤은 수행하지 않음) |
| `select-text`, `select-none` | `userSelect: "text"` / `"none"`. view에서는 아무것도 지정하지 않은 그 안의 text에 적용 |
| `select-auto` | `userSelect: "auto"`: CSS의 `user-select: auto`처럼 주변 view가 결정(`select-none md:select-auto`) |
<a id="decoration-and-shadow"></a>

### 장식 및 그림자

| 클래스 | 설정 |
|---|---|
| `underline`, `line-through`, `no-underline` | `textDecorationLine` |
| `decoration-solid`, `decoration-double`, `decoration-dotted`, `decoration-dashed`, `decoration-wavy` | `textDecorationStyle` |
| `decoration-<n>`, `decoration-[<length>]` | `textDecorationThickness` |
| `decoration-auto`, `decoration-from-font` | `textDecorationThickness: "auto"` |
| `decoration-<color>` | `textDecorationColor` |
| `underline-offset-<n>`, `underline-offset-[<length>]`, `underline-offset-auto` | `textUnderlineOffset` |
| `text-shadow-2xs`, `-xs`, `-sm`, `-md`, `-lg`; `/<alpha>` | 테마의 텍스트 그림자 (레이어 하나: 테마의 레이어 중 가장 넓은 것). modifier는 레이어의 알파 값입니다: `text-shadow-md/20` |
| `text-shadow-<color>`, `text-shadow-current` | 그림자 색상, 크기에 해당하는 알파 값 적용 |
| `text-shadow-none` | 그림자를 제거합니다 |

Tailwind의 텍스트 그림자는 여러 레이어로 이루어져 있지만, 네이티브에서는 가장 넓은 레이어 하나만 그려집니다.

<a id="inputs"></a>

### 입력

| 클래스 | 설정 |
|---|---|
| `placeholder:text-<color>` | `placeholderColor` |
| `selection:bg-<color>` | `selectionColor` (입력 또는 선택 가능한 텍스트의 선택 영역 하이라이트이며, 요소 내부의 해당 항목에도 적용됩니다) |
| `caret-<color>` | 커서 색상 |

<a id="backgrounds"></a>

## 배경

| 클래스 | 설정 |
|---|---|
| `bg-<color>` | `backgroundColor` |
| `bg-[<gradient>]` | `backgroundImage`: `bg-[linear-gradient(45deg,red,blue)]`, `bg-[radial-gradient(...)]` |
| `bg-linear-to-t`, `-tr`, `-r`, `-br`, `-b`, `-bl`, `-l`, `-tl` | 변 또는 모서리 방향의 선형 그라디언트 (`bg-gradient-to-*`는 v3 이름입니다) |
| `bg-linear-<angle>`, `bg-linear-[<angle>]` | 각도가 지정된 선형 그라디언트: `bg-linear-45`, `-bg-linear-12`, `bg-linear-[0.25turn]` |
| `bg-radial` | 중심에서 퍼지는 방사형 그라디언트 |
| `bg-conic`, `bg-conic-<angle>` | 원뿔형 그라디언트, 필요하면 시작 각도를 지정할 수 있습니다 |
| `from-<color>`, `via-<color>`, `to-<color>` | 그라디언트의 색상 정지점 (양 끝의 기본값은 투명) |
| `from-<p>%`, `via-<p>%`, `to-<p>%` | 정지점 위치: `via-40%`, `from-[15%]` |
| `bg-none` | 그라디언트를 제거합니다 |

그라디언트 유틸리티는 Tailwind CSS가 작성하는 방식대로 색상을 Oklab에서 혼합합니다 (`in oklab`). 임의의 위치 (`bg-linear-[25deg]`, `bg-conic-[0.25turn]`)에서는 CSS의 기본 동작을 따르므로, 팔레트 색상에는 Oklab을 사용하고 모든 정지점이 hex, `rgb()`, `hsl()` 또는 이름이 있는 색상일 때는 sRGB를 사용합니다.

```rust tabs
view()
    .h_32()
    .rounded_2xl()
    .bg_linear_to_br()
    .gradient_from(INDIGO.shade(500))
    .gradient_via(PURPLE.shade(500))
    .gradient_via_position(percentage(0.4))
    .gradient_to(PINK.shade(500))
```

```tsx tabs
<View class="h-32 rounded-2xl bg-linear-to-br from-indigo-500 via-purple-500 via-40% to-pink-500" />
```

<a id="borders"></a>

## 테두리

| 클래스 | 설정 |
|---|---|
| `border`, `border-<n>`, `border-[<length>]` | `borderWidth` (값 없이 쓰면: 1) |
| `border-x`, `border-y`, `border-t`, `border-r`, `border-b`, `border-l`, `border-s`, `border-e` (`-<n>` 또는 값 없이 사용) | 해당 변의 너비 |
| `border-<color>`, `border-t-<color>`, ... | `borderColor` 및 변별 색상 |
| `border-solid`, `border-dashed`, `border-dotted` | `borderStyle` |
| `border-none`, `border-hidden` | `borderStyle: "none"` / `"hidden"`: 너비 클래스의 종류나 순서와 관계없이 테두리가 없습니다 (`md:border-solid`를 쓰면 다시 표시됩니다) |
| `rounded`, `rounded-<size>`, `rounded-none`, `rounded-full`, `rounded-[<length>]` | `borderRadius` (값 없이 쓰면: `sm`) |
| `rounded-t-`, `-r-`, `-b-`, `-l-`, `-tl-`, `-tr-`, `-br-`, `-bl-` | 해당 모서리 |
| `rounded-s-`, `-e-`, `-ss-`, `-se-`, `-es-`, `-ee-` | 시작 / 끝 모서리 (방향 인식): `borderTopStartRadius`, `borderTopEndRadius`, `borderBottomStartRadius`, `borderBottomEndRadius` |
| `outline`, `outline-<n>`, `outline-[<length>]` | `outlineWidth` (값 없이 쓰면: 1). 문자열 어디에든 스타일 클래스가 없으면 실선입니다 (`outline-dashed outline-2`는 파선이고 `outline-none outline-2`는 아무것도 그리지 않습니다) |
| `outline-<color>` | `outlineColor` |
| `outline-solid`, `outline-dashed`, `outline-dotted`, `outline-none`, `outline-hidden` | `outlineStyle`. 스타일만 지정하면 CSS의 medium 너비인 3포인트가 됩니다 |
| `outline-offset-<n>`, `outline-offset-[<length>]` | `outlineOffset` |

반경 크기 (포인트): `xs` 2, `sm` 4, `md` 6, `lg` 8, `xl` 12, `2xl` 16, `3xl` 24, `4xl` 32, `full` 9999.

<a id="rings"></a>

### 링

링은 spread가 있는 박스 그림자로, 공간을 차지하지 않고 테두리 바깥쪽에 그려집니다.

| 클래스 | 설정 |
|---|---|
| `ring`, `ring-<n>`, `ring-[<length>]` | 해당 너비의 링 (값 없이 쓰면: 1) |
| `ring-<color>` | 링의 색상 (기본값은 요소의 텍스트 색상) |
| `ring-inset` | 링을 안쪽에 그립니다 |
| `ring-offset-<n>`, `ring-offset-<color>` | 요소와 링 사이의 간격 (기본값은 흰색) |
| `inset-ring`, `inset-ring-<n>`, `inset-ring-<color>` | 안쪽 링 |

<a id="effects"></a>

## 효과

| 클래스 | 설정 |
|---|---|
| `shadow-2xs`, `shadow-xs`, `shadow-sm`, `shadow`, `shadow-md`, `shadow-lg`, `shadow-xl`, `shadow-2xl`; `/<alpha>` | 테마의 `boxShadow`. modifier는 레이어의 알파 값입니다: `shadow-xl/20` |
| `shadow-[<box-shadow>]` | 임의의 그림자: `shadow-[0_8px_24px_rgb(0_0_0_/_0.12)]` |
| `shadow-<color>`, `shadow-current` | 그림자 레이어의 색상을 크기에 해당하는 알파 값으로 다시 지정합니다: `shadow-indigo-500/40` |
| `shadow-none` | 그림자 없음 |
| `inset-shadow-2xs`, `-xs`, `-sm`, `inset-shadow`, `inset-shadow-[...]`, `inset-shadow-<color>`, `inset-shadow-none` | 안쪽 그림자 |
| `opacity-<n>`, `opacity-[<value>]` | `opacity`: `opacity-50` = 0.5 |
| `mix-blend-<mode>` | `mixBlendMode`: `normal`, `multiply`, `screen`, `overlay`, `darken`, `lighten`, `color-dodge`, `color-burn`, `hard-light`, `soft-light`, `difference`, `exclusion`, `hue`, `saturation`, `color`, `luminosity`, `plus-darker`, `plus-lighter` |

그림자, 링, 안쪽 그림자는 CSS와 마찬가지로 하나의 `boxShadow` 목록으로 결합됩니다. 그림자 색상은 Tailwind의 `--tw-shadow-color`처럼 각 레이어의 색상을 알파 값까지 대체합니다: `shadow-md shadow-red-500`는 불투명한 빨간색 그림자이고, `shadow-md/20 shadow-red-500`는 20% 알파의 빨간색 그림자입니다.

<a id="filters"></a>

## 필터

| 클래스 | 설정 |
|---|---|
| `blur`, `blur-xs` (4), `-sm` (8), `-md` (12), `-lg` (16), `-xl` (24), `-2xl` (40), `-3xl` (64), `blur-none`, `blur-[<length>]` | `blur()` |
| `brightness-<n>`, `contrast-<n>`, `saturate-<n>` | 백분율 배율: `brightness-125` = 1.25 |
| `grayscale`, `grayscale-<n>`, `invert`, `invert-<n>`, `sepia`, `sepia-<n>` | 값 없이 쓰면: 100% |
| `hue-rotate-<deg>`, `-hue-rotate-<deg>` | `hue-rotate()` |
| `drop-shadow`, `drop-shadow-xs`, `-sm`, `-md`, `-lg`, `-xl`, `-2xl`, `drop-shadow-[...]`, `drop-shadow-none`; `drop-shadow-<color>`, `drop-shadow-current`; 둘 중 어느 쪽에든 `/<alpha>` | 레이어마다 하나씩의 `drop-shadow()`이며, 다른 필터 뒤에 적용됩니다. 색상을 지정하면 레이어의 색상을 크기에 해당하는 알파 값으로 대체합니다. 웹, Linux, Windows, GPUI는 모든 레이어를 그리고, iOS, macOS, Android는 가장 넓은 레이어만 그립니다 |
| `drop-shadow-none` | 해당 필터를 제거합니다 |
| `filter-none` | 모든 필터를 제거합니다 |
| `backdrop-blur`, `backdrop-blur-<size>`, `backdrop-blur-[<length>]` | 뷰 뒤에 있는 내용을 흐리게 합니다 |
| `backdrop-brightness-<n>`, `backdrop-contrast-<n>`, `backdrop-grayscale`, `backdrop-hue-rotate-<deg>`, `backdrop-invert`, `backdrop-opacity-<n>`, `backdrop-saturate-<n>`, `backdrop-sepia` | 백드롭 필터 |
| `backdrop-filter-none` | 백드롭 필터를 제거합니다 |

> [!WARNING]
> iOS는 뷰에 `opacity`, 최대 1까지의 `brightness`, `drop-shadow`만 적용합니다. `<Image>`는 모든 색상 필터와 `blur`를 받습니다. Android에서 `blur`, `drop-shadow`, 백드롭 블러를 사용하려면 API 31이 필요합니다. [스타일 레퍼런스](./style-reference.md#filters-and-blending)를 참고하세요.

<a id="transforms"></a>

## 변환

| 클래스 | 설정 |
|---|---|
| `translate-x-<n>`, `translate-y-<n>`, `translate-<n>` | `translate` (간격, `full`, 요소 자체 크기에 대한 비율: `-translate-x-1/2`, 임의 값) |
| `rotate-<deg>`, `rotate-[<angle>]` | `rotate` |
| `rotate-x-<deg>`, `rotate-y-<deg>`, `rotate-z-<deg>` | 3D 회전 (`transform` 단위이며, 이동, 회전, 크기 조절 뒤에 적용) |
| `scale-<pct>`, `scale-x-<pct>`, `scale-y-<pct>`, `scale-[<factor>]` | `scale`: `scale-95` = 0.95, `-scale-x-100`는 좌우 반전 |
| `skew-<deg>`, `skew-x-<deg>`, `skew-y-<deg>` | 기울이기(skew), `transform` 단위 (Android에서는 지원되지 않음) |
| `perspective-dramatic` (100), `-near` (300), `-normal` (500), `-midrange` (800), `-distant` (1200), `perspective-[<length>]`, `perspective-none` | 요소의 중심에서 본, 자식 요소의 3D 회전에 적용되는 깊이 (CSS의 `perspective`: `<View class="perspective-near"><View class="rotate-y-45" /></View>`) |
| `origin-center`, `-top`, `-top-right`, `-right`, `-bottom-right`, `-bottom`, `-bottom-left`, `-left`, `-top-left`, `origin-[<value>]` | `transformOrigin` |
| `backface-hidden`, `backface-visible` | `backfaceVisibility` |
| `transform-none` | 3D 회전과 기울이기를 초기화합니다 (CSS의 `transform: none`) |
| `translate-none`, `rotate-none`, `scale-none` | 각각 이동, 회전, 크기 조절을 초기화합니다 |

변환 유틸리티는 CSS처럼 조합됩니다. `translate-*`, `rotate-*`, `scale-*`는 각각 `translate`, `rotate`, `scale` 속성을 설정하며 순서와 관계없이 결합되고, 그다음 `transform`가 적용됩니다 (`rotate-x-*`, `skew-*`). `style` prop에서 이름이 같은 키는 해당 속성만 대체합니다: `style={{ scale: 1.1 }}`는 `scale-95`를 대체하고 `rotate-3`는 유지합니다. `transform`, `transform-gpu`, `transform-cpu`, `transform-flat`는 허용되지만 아무 동작도 하지 않습니다. NSH는 모든 변환을 동일하게, 즉 평면으로 조합합니다. 크기의 비율로 지정한 이동은 요소의 프레임을 기준으로 계산되며, 요소의 크기가 바뀌면 그에 따라 함께 바뀝니다.

<a id="transitions-and-animation"></a>

## 전환과 애니메이션

| 클래스 | 설정 |
|---|---|
| `transition` | 색상, 불투명도, 그림자, 변환. 150 ms, `cubic-bezier(0.4, 0, 0.2, 1)` |
| `transition-all`, `transition-colors`, `transition-opacity`, `transition-shadow`, `transition-transform` | 애니메이션 대상 속성 |
| `transition-none` | 전환 없음 |
| `duration-<ms>`, `duration-[<time>]` | `transitionDuration`: `duration-300`, `duration-[0.4s]` |
| `delay-<ms>`, `delay-[<time>]` | `transitionDelay` |
| `ease-linear`, `ease-in`, `ease-out`, `ease-in-out`, `ease-initial`, `ease-[cubic-bezier(...)]` | `transitionTimingFunction` |
| `animate-spin`, `animate-ping`, `animate-pulse`, `animate-bounce` | 네이티브 키프레임 애니메이션, 무한 반복 |
| `animate-none` | 애니메이션을 중지합니다 |

전환은 값이 바뀔 때, 즉 variant가 일치하기 시작하거나 일치하지 않게 될 때도 UI 스레드에서 실행되므로, `transition active:scale-95`를 사용하면 JS 없이 누름 동작에 애니메이션을 적용할 수 있습니다. 모션 감소 설정을 따르려면 애니메이션을 `motion-safe:`로 감싸세요.

<a id="interactivity"></a>

## 인터랙티브

| 클래스 | 설정 |
|---|---|
| `pointer-events-none`, `pointer-events-auto` | `pointerEvents: "none"` / `"auto"`: 뷰가 터치와 포인터의 대상이 되는지 여부이며, CSS처럼 상속됩니다. `pointer-events-none` 뷰 안에서도 `pointer-events-auto` 뷰는 다시 대상이 됩니다 |
| `cursor-<name>`, `cursor-[<name>]` | `cursor`: `cursor-pointer`, `cursor-grab`, `cursor-not-allowed`, ... (모든 CSS 커서 키워드) |
| `select-none`, `select-text`, `select-auto` | 텍스트 선택 (타이포그래피 참고) |

## SVG

| 클래스 | 설정 |
|---|---|
| `fill-<color>`, `fill-none`, `fill-current`, `fill-inherit` | `fill` (`fill-current`는 `currentColor`입니다) |
| `stroke-<color>`, `stroke-none`, `stroke-current`, `stroke-inherit` | `stroke` |
| `stroke-<number>`, `stroke-[<length>]` | `strokeWidth` |

<a id="images"></a>

## 이미지

| 클래스 | 설정 |
|---|---|
| `object-cover`, `object-contain`, `object-fill`, `object-none`, `object-scale-down` | `objectFit` (`fill`은 늘리고, `none`은 원래 크기를 유지하며 `objectPosition`에 배치하고, `scale-down`은 이와 같되 더 큰 경우 맞게 축소합니다). 이미지와 비디오에 적용됩니다 |
| `object-top`, `object-bottom`, `object-left`, `object-right`, `object-center`, `object-top-left`, `object-top-right`, `object-bottom-left`, `object-bottom-right`, `object-[<position>]` | `objectPosition` (`object-left-top`, ...는 `object-top-left`, ...와 같습니다) |
| `tint-<color>` | `tintColor` (템플릿 이미지의 색상을 다시 지정합니다) |

<a id="accepted-without-effect"></a>

## 효과 없이 허용되는 클래스

이 유틸리티들은 렌더링 힌트이거나 모든 네이티브 뷰가 이미 갖추고 있는 동작입니다. 경고 없이 파싱되지만 아무것도 바꾸지 않습니다: `antialiased`, `subpixel-antialiased`, `isolation-auto`, `box-border`, `appearance-none`, `appearance-auto`, `will-change-auto`, `will-change-scroll`, `will-change-contents`, `will-change-transform`, `will-change-[<value>]`, `transform`, `transform-gpu`, `transform-cpu`, `transform-flat`. 스크롤, 스냅, 오버스크롤은 [scroll](../elements/scroll.md)의 prop입니다.

<a id="not-supported"></a>

## 지원되지 않음

`peer-*` variant, 의사 요소 (`before:`, `after:`), 임의 속성 (`[prop:value]`), `overflow-auto` / `overflow-scroll`, `divide-*`, `columns-*`, `float-*`, `container`, 컨테이너 쿼리, `order-*`, `transform-3d`, `select-all`, `border-double` / `outline-double`, 고유 크기 기반 min/max 제약 (예: `max-w-max`), `snap-*`, `scroll-*`, `overscroll-*`, `touch-*`, `isolate`는 알 수 없는 클래스입니다. `nsh build`와 `nsh dev`는 소스에서 발견한 알 수 없는 클래스에 대해 경고하며 (`file:line:col: unknown class '...'`), 런타임은 알 수 없는 클래스를 각각 한 번씩 로그로 남깁니다.

<a id="variants"></a>

## Variant

variant를 사용하면 유틸리티를 조건부로 적용할 수 있습니다: `dark:bg-zinc-900`, `md:flex-row`, `active:opacity-70`. variant는 중첩할 수 있으며 (`dark:active:bg-zinc-700`), 의존하는 값이 바뀔 때마다 네이티브에서 평가됩니다.

<a id="appearance-and-environment"></a>

### 외관 및 환경

| Variant | 적용 조건 | Rust |
|---|---|---|
| `dark:` | 외관이 다크 모드일 때 | `.dark(\|s\| …)` |
| `ios:` | iOS 또는 Mac Catalyst에서 실행 중일 때 | `.when(os() == Os::Ios, …)` |
| `android:` | Android에서 실행 중일 때 | `.when(os() == Os::Android, …)` |
| `portrait:`, `landscape:` | 창의 높이가 너비보다 클 때 / 너비가 높이보다 클 때 | `.style_when(move \|\| window().height > window().width, …)` |
| `ltr:`, `rtl:` | 레이아웃 방향 | `.style_when(rtl, …)` |
| `motion-safe:`, `motion-reduce:` | 사용자가 모션 감소를 요청하지 않았을 때 / 요청했을 때 | `.style_when(reduce_motion, …)` |

<a id="breakpoints"></a>

### 브레이크포인트

브레이크포인트는 창 너비를 포인트 단위로 비교합니다.

| Variant | 최소 너비 |
|---|---|
| `sm:` | 640 |
| `md:` | 768 |
| `lg:` | 1024 |
| `xl:` | 1280 |
| `2xl:` | 1536 |

| 형식 | 예시 | 적용 조건 |
|---|---|---|
| `<bp>:` | `md:p-8` | 너비 ≥ 브레이크포인트 |
| `max-<bp>:` | `max-md:p-1` | 너비 < 브레이크포인트 |
| `min-[<length>]:` | `min-[600px]:grid-cols-3` | 너비 ≥ 지정한 길이 |
| `max-[<length>]:` | `max-[400px]:text-sm` | 너비 < 지정한 길이 |

세로 모드의 휴대폰 (너비 390포인트)은 기본 브레이크포인트 중 어느 것에도 해당하지 않으며, 태블릿이나 가로 모드의 휴대폰은 여러 개에 해당합니다. Rust에서 브레이크포인트는 창에 대한 조건입니다: `.style_when(move || window().width >= px(768.0), |s| s.p_8())`는 `md:p-8`입니다.

<a id="interaction-states"></a>

### 상호작용 상태

상태는 클래스에서 해당 상태를 사용하는 요소에 대해서만 플랫폼이 추적하며, 변경 사항은 JS 왕복 없이 네이티브에서 적용됩니다.

| Variant | 적용 조건 | Rust |
|---|---|---|
| `active:` | 요소가 눌려 있을 때 | `.active(\|s\| …)` |
| `hover:` | 포인터가 요소 위에 있을 때 (iPad 포인터, Mac Catalyst, Android 마우스) | `.hover(\|s\| …)` |
| `focus:`, `focus-visible:` | 입력에 포커스가 있을 때 | `.focus(\|s\| …)` |
| `focus-within:` | 요소 또는 그 하위 요소에 포커스가 있을 때 (`Overlay`의 콘텐츠는 해당 요소가 속한 요소의 하위 요소입니다) | `.focus_within(…)` |
| `disabled:` | 요소에 `disabled` prop이 있을 때 | `.disabled_style(\|s\| …)` |
| `enabled:` | 요소에 `disabled` prop이 없을 때 |  |
| `selected:` | 요소가 선택되었을 때: `Button`의 `selected` 또는 `accessibilityState.selected` |  |
| `checked:` | 요소가 체크되었을 때: `accessibilityState.checked`가 `true`일 때 (`"mixed"`는 체크되지 않은 상태) |  |
| `indeterminate:` | 요소가 불확정 상태일 때: `accessibilityState.checked`가 `"mixed"`일 때 |  |
| `aria-expanded:` | 요소가 확장되었을 때: `accessibilityState.expanded`가 `true`일 때 (팝업이 열려 있는 동안의 `Popover` 또는 `Menu`의 트리거) |  |
| `aria-pressed:` | 요소가 켜져 있는 토글 버튼일 때: `accessibilityState.pressed`가 `true`일 때 (`"mixed"`는 눌리지 않은 상태이며, 누르는 중인 `active:`와는 다릅니다) | `.aria_pressed(\|s\| …)` |
| `aria-busy:` | 요소가 작업 중일 때: `accessibilityState.busy`가 `true`일 때 |  |
| `aria-checked:` | 요소가 체크되었을 때: `accessibilityState.checked`가 `true`일 때, `checked:`와 동일 |  |
| `aria-selected:` | 요소가 선택되었을 때: `accessibilityState.selected`가 `true`일 때, `selected:`와 동일 |  |
| `data-<name>:` | 요소에 불리언 `data-*` 속성 `name`이 있을 때 (Tailwind의 `&[data-<name>]`. 이름은 소문자, 숫자, `-`로 구성): 컴포넌트의 파트가 상태 외에 추가로 보여 주는 것, 예를 들어 범위의 시작에 있는 캘린더의 날짜 `data-range-start` | `Interactive::project_data(name, …)`로 설정할 수 있습니다 |

스타일 객체로 표현한 동일한 상태는 모든 요소 (및 `Button`의 `selectedStyle`)의 `activeStyle`, `hoverStyle`, `focusStyle`, `disabledStyle`, `checkedStyle`, `indeterminateStyle`, `expandedStyle`, `pressedStyle` prop이며, 요소의 스타일과 클래스보다 우선 적용됩니다.

`disabled`는 모든 요소에서 동작합니다. `disabled:`를 적용하고 요소의 누름 핸들러를 제거하므로 누름 피드백도 표시되지 않습니다.

```rust tabs
view()
    .on_press(save)
    .disabled(saving)
    .rounded_lg()
    .bg(BLUE.shade(600))
    .px_4()
    .py_2()
    .transition()
    .active(|s| s.scale(0.95).bg(BLUE.shade(700)))
    .disabled_style(|s| s.opacity(0.4))
    .child(text("Save").font_weight(FontWeight::MEDIUM).text_color(white()))
```

```tsx tabs
<View
  onPress={save}
  disabled={saving()}
  class="rounded-lg bg-blue-600 px-4 py-2 transition active:scale-95 active:bg-blue-700 disabled:opacity-40"
>
  <Text class="font-medium text-white">Save</Text>
</View>
```
<a id="groups"></a>

### 그룹

상위 요소에 `group` 클래스를 지정하고, `group-<state>:` 변형으로 그 상태에 따라 하위 요소의 스타일을 지정합니다. 그룹에 이름을 지정하면 중첩할 수 있습니다: `group/card` 및 `group-hover/card:`.

| 변형 | 그룹이 다음 상태일 때 적용 | Rust |
|---|---|---|
| `group-active:` | 눌림 | `.group_active(…)`, `.group_active_named(name, …)` |
| `group-hover:` | 호버됨 | `.group_hover(…)`, `.group_hover_named(name, …)` |
| `group-focus:`, `group-focus-visible:` | 포커스됨 |  |
| `group-focus-within:` | 포커스되었거나 포커스를 포함함 | `.group_focus_within(…)`, `.group_focus_within_named(name, …)` |
| `group-disabled:` | 비활성화됨 |  |
| `group-selected:` | 선택됨 |  |
| `group-checked:` | 체크됨 |  |
| `group-indeterminate:` | 불확정 |  |
| `group-aria-expanded:` | 확장됨 |  |
| `group-aria-pressed:` | 켜져 있는 토글 버튼 |  |
| `group-aria-busy:`, `group-aria-checked:`, `group-aria-selected:` | 작업 중, 체크됨, 선택됨 |  |
| `group-data-<name>:` | `data-*` 속성 `name`을 표시 중일 때 |  |

```rust tabs
view()
    .on_press(open)
    .group_named("row")
    .flex_row()
    .items_center()
    .gap_3()
    .p_3()
    .active(|s| s.bg(ZINC.shade(100)))
    .child(
        text("Settings")
            .flex_1()
            .text_color(ZINC.shade(900))
            .group_active_named("row", |s| s.text_color(BLUE.shade(600))),
    )
    .child(
        text("›")
            .text_color(ZINC.shade(400))
            .group_active_named("row", |s| s.translate_x(px(4.0)))
            .transition_transform(),
    )
```

```tsx tabs
<View onPress={open} class="group/row flex-row items-center gap-3 p-3 active:bg-zinc-100">
  <Text class="flex-1 text-zinc-900 group-active/row:text-blue-600">Settings</Text>
  <Text class="text-zinc-400 group-active/row:translate-x-1 transition-transform">›</Text>
</View>
```

<a id="position-among-siblings"></a>

### 형제 요소 간 위치

| 변형 | 적용 대상 |
|---|---|
| `first:` | 첫 번째 자식 |
| `last:` | 마지막 자식 |
| `only:` | 유일한 자식 |
| `odd:` | 1번째, 3번째, ... 자식 |
| `even:` | 2번째, 4번째, ... 자식 |

```rust tabs
each(items, |item: &Item| item.id, move |item, index| {
    text(move || item.with(|i| i.name.clone()))
        .border_b(px(1.0))
        .border_color(ZINC.shade(200))
        .py_3()
        .style_when(move || index.get() + 1 == items.with(Vec::len), |s| s.border_b(px(0.0)))
})
```

```tsx tabs
<Each of={items()}>{(item) => <Text class="border-b border-zinc-200 py-3 last:border-b-0">{item().name}</Text>}</Each>
```

<a id="placeholder-and-selection"></a>

### 플레이스홀더와 선택

`placeholder:`은(는) `<Input>`의 플레이스홀더에 적용되며 텍스트 색상만 받습니다: `placeholder:text-zinc-400` (스타일 키 `placeholderColor`). `selection:`은(는) `<Input>` 또는 선택 가능한 `<Text>`의 선택 영역에 적용되고, 어떤 요소에 지정하든 그 내부 요소에 적용되며(Tailwind의 `& *::selection`; 가장 가까운 요소의 값이 우선합니다) 배경, 즉 하이라이트를 받습니다: `selection:bg-violet-200` (스타일 키 `selectionColor`. 플랫폼이 캐럿을 단일 색상으로 그리는 경우 입력 필드의 캐럿에도 이 색이 적용됩니다).

<a id="important"></a>

### 중요

유틸리티(`!p-4`, `p-4!`)의 앞이나 뒤에 `!`를 붙이면 다른 모든 클래스와 인라인 `style`보다 우선 적용됩니다.

<a id="theme-customization"></a>

## 테마 커스터마이징

앱의 `nsh.json`에 있는 `"tailwind"` 객체에서 테마를 확장합니다. 새로운 이름의 항목은 추가되고, 기존 이름의 항목은 기본값을 대체합니다. 길이 단위는 포인트입니다. 테마는 앱을 번들할 때 검사되며, 알 수 없는 키나 유효하지 않은 값은 빌드 오류가 됩니다.

```json
{
  "name": "My App",
  "id": "com.example.myapp",
  "tailwind": {
    "colors": {
      "brand": { "50": "#f5f3ff", "500": "#7c3aed", "600": "#6d28d9", "DEFAULT": "#7c3aed" },
      "accent": "#f59e0b"
    },
    "spacing": 4,
    "breakpoints": { "tablet": 600 },
    "fontFamily": { "display": "Inter" },
    "fontSize": { "huge": [48, 1.1] },
    "fontWeight": { "heavy": 850 },
    "radius": { "card": 14 },
    "shadow": { "card": "0 2px 8px rgb(0 0 0 / 0.12)" },
    "insetShadow": { "well": "inset 0 2px 6px rgb(0 0 0 / 0.1)" },
    "dropShadow": { "icon": "0 2px 4px rgb(0 0 0 / 0.2)" },
    "tracking": { "label": 0.08 },
    "leading": { "dense": 1.15 },
    "blur": { "glass": 20 },
    "perspective": { "card": 700 },
    "aspect": { "photo": 1.5 },
    "ease": { "snappy": [0.2, 0, 0, 1] },
    "container": { "content": 680 }
  }
}
```

이 테마에서는 `bg-brand-500`, `bg-brand`(`DEFAULT` 셰이드), `text-accent`, `tablet:flex-row`, `font-display`, `text-huge`, `font-heavy`, `rounded-card`, `shadow-card`, `inset-shadow-well`, `drop-shadow-icon`, `tracking-label`, `leading-dense`, `blur-glass`, `perspective-card`, `aspect-photo`, `ease-snappy`, `max-w-content` 모두 사용할 수 있습니다.

| 키 | 값 | 사용처 |
|---|---|---|
| `colors` | `{ name: color }` 또는 `{ name: { shade: color } }`; `DEFAULT`은(는) 기본 색상 자체의 이름입니다. 모든 CSS 색상 문법을 사용할 수 있습니다. | 모든 색상 유틸리티 |
| `spacing` | 단계당 포인트 (기본값 4) | `p-*`, `m-*`, `gap-*`, `w-*`, ... |
| `rem` | `rem`당 포인트 (기본값 16) | |
| `breakpoints` | `{ name: width }` | 브레이크포인트 변형 (너비순 정렬) |
| `container` | `{ name: width }` | `w-*`, `min-w-*`, `max-w-*` |
| `fontFamily` | `{ name: family }` (시스템 폰트 패밀리 또는 번들된 폰트 이름) | `font-*` |
| `fontSize` | `{ name: size }` 또는 `{ name: [size, lineHeightMultiple] }` | `text-*` |
| `fontWeight` | `{ name: 1–1000 }` | `font-*` |
| `tracking` | `{ name: em }` | `tracking-*` |
| `leading` | `{ name: multiple }` | `leading-*` |
| `radius` | `{ name: points }` | `rounded-*` |
| `shadow`, `insetShadow`, `dropShadow` | `{ name: "CSS box-shadow" }` | `shadow-*`, `inset-shadow-*`, `drop-shadow-*` |
| `blur` | `{ name: points }` | `blur-*`, `backdrop-blur-*` |
| `perspective` | `{ name: points }` | `perspective-*` |
| `aspect` | `{ name: ratio }` | `aspect-*` |
| `ease` | `{ name: [x1, y1, x2, y2] }` | `ease-*` |

> [!NOTE]
> Tailwind 테마는 앱의 클래스에만 영향을 줍니다. 앱의 디자인 토큰(shadcn/ui의 색상, `radius`, 폰트, 앱 고유의 토큰)은 앱의 테마이며 `nsh.json`의 `"theme"` 키에 있고, Rust 컴포넌트가 이를 사용해 그립니다. [Rust](../docs/rust.md#theme)를 참고하세요. 클래스는 이러한 토큰을 Tailwind가 `@theme` 변수라고 부르는 이름(`bg-primary`, `bg-up/30`, `rounded-(--radius)`)으로 참조합니다. [테마 토큰](../docs/tailwind.md#theme-tokens)을 참고하세요.

<a id="related"></a>

## 관련 문서

- [Tailwind](../docs/tailwind.md): 가이드.
- [스타일링](../docs/styling.md): `class`, `classList`, `style` 및 이들의 조합 방식.
- [스타일 레퍼런스](./style-reference.md): 유틸리티가 설정하는 스타일 키.
