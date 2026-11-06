---
title: "Tailwind"
description: "TSX에서 네이티브로 해석되는 Tailwind CSS 클래스와 Rust에서의 타입이 지정된 대응 기능 - class와 classList, 눌림 상태를 위한 variant, 다크 모드와 브레이크포인트, nsh.json의 테마, 그리고 빌드 타임 클래스 검사를 다룹니다."
order: 33
group: ui
demo: guide-tailwind
source_hash: 1112d3bac3b2b097
---

# Tailwind

NSH의 스타일은 Tailwind CSS 4를 따릅니다. Rust에서 Tailwind의 유틸리티는 이름과 값이 같은 타입 지정 스타일 메서드입니다(`.p_4()` = `p-4`, `.rounded_2xl()` = `rounded-2xl`, `ZINC.shade(900)` = `zinc-900`). TSX에서는 모든 엘리먼트가 `class`에 클래스를 그대로 받으며, 이 클래스는 Tailwind 4의 기본 테마를 기준으로 네이티브에서 해석됩니다. 아래 각 예제는 타입 메서드를 먼저, 클래스를 그다음에 보여 줍니다:

```rust tabs
use nsh_core::element::palette::ZINC;

view()
    .flex_row()
    .items_center()
    .gap_3()
    .rounded_2xl()
    .bg(AdaptiveColor::new(white(), ZINC.shade(800)))
    .p_4()
    .shadow_lg()
    .active(|s| s.scale(0.98))
    .child(
        text("Tailwind on native views")
            .text_base()
            .font_weight(FontWeight::SEMIBOLD)
            .text_color(AdaptiveColor::new(ZINC.shade(900), white())),
    )
```

```tsx tabs
<View class="flex-row items-center gap-3 rounded-2xl bg-white p-4 shadow-lg active:scale-[0.98] dark:bg-zinc-800">
  <Text class="text-base font-semibold text-zinc-900 dark:text-white">Tailwind on native views</Text>
</View>
```

타입 메서드는 클래스가 컴파일되는 것과 같은 스타일 규칙으로 변환되며, 파싱할 문자열이 없습니다. 클래스의 경우 CSS가 생성되지 않고 JavaScript에서 아무것도 실행되지 않습니다. 문자열은 코어로 전달되고, 코어는 서로 다른 클래스 문자열마다 한 번씩 파싱하여(결과는 캐시됨) 스타일 규칙으로 바꾼 뒤 적용합니다. 상태(눌림, 다크 모드, 창 너비)에 따라 달라지는 변형은 해당 상태가 바뀔 때 코어가 다시 적용하며, 눌림 및 포커스 상태는 네이티브에서 추적되므로 `active:` 피드백(Rust에서는 `.active(..)`)은 코드로 왕복하지 않습니다.

클래스와 [`style` prop](./styling.md)은 동일한 네이티브 스타일을 만들며 함께 사용할 수 있습니다. 이 페이지는 클래스와 그에 대응하는 타입 메서드에만 해당하는 내용을 다룹니다. [Tailwind 레퍼런스](../modules/tailwind-reference.md)에는 지원되는 모든 유틸리티가 나열되어 있습니다.

## class and classList

```rust tabs
view()
    .rounded_lg()
    .px_4()
    .py_2()
    .transition_colors()
    .bg(move || if selected.get() { INDIGO.shade(600) } else { ZINC.shade(200) })
    .style_when(busy, |s| s.opacity(0.5))
```

```tsx tabs
<View
  class="rounded-lg px-4 py-2 transition-colors"
  classList={{ "bg-indigo-600": selected(), "bg-zinc-200": !selected(), "opacity-50": busy() }}
/>
```

- **`class`** 은 클래스 문자열입니다. 동적일 수 있습니다. ``class={`h-6 rounded bg-${color()}-500`}``도 동작하는데, 클래스가 런타임에 해석되기 때문입니다.
- **`classList`** 은 클래스를 조건에 매핑합니다. 값이 truthy인 동안 해당 클래스가 적용됩니다. `class` 뒤에 적용됩니다.
- **Rust에서는** 클로저나 signal을 받은 메서드가 그 값을 따라갑니다(`.bg(move || ..)`). 조건이 성립하는 동안 스타일을 적용하려면 `.style_when(condition, |s| ..)`을(를), 엘리먼트가 만들어질 때 한 번만 결정하려면 `.when(condition, |v| ..)`을(를) 사용합니다.

충돌은 다음과 같이 해소됩니다.

1. **나중 클래스가 우선합니다.** 같은 문자열에서 뒤에 오는 클래스가 앞의 클래스를 이깁니다. `"p-2 p-4"`의 결과는 `p-4`입니다. `tailwind-merge`은(는) 필요 없습니다. 컴포넌트는 호출자가 전달한 `class`을(를) 뒤에 덧붙이면 됩니다. Rust에서도 나중 메서드가 우선합니다.
2. **변형 클래스는 일반 클래스 뒤에 적용되며**, 문자열 내 위치와 관계없이 Tailwind의 변형 순서(`hover:`이(가) `active:`보다 먼저, `max-*:`은(는) 가장 넓은 것부터, 브레이크포인트는 오름차순, `dark:`이(가) 마지막)를 따릅니다. Tailwind와 마찬가지로 클래스의 가장 높은 변형이 먼저 결정하고, 그다음 높은 변형이 결정하며, 변형이 하나 더 많은 클래스가 나중에 옵니다. `dark:hover:bg-a dark:bg-b`: 다크 모드에서 호버 중일 때 `bg-a`. `max-md:p-2 max-lg:p-4`: `md` 미만에서 `p-2`. CSS와 마찬가지로 `odd:bg-a last:bg-b`은(는) 홀수 번째인 마지막 행에 `bg-a`을(를) 적용하는데, Tailwind가 `odd`을(를) `last` 뒤에 정렬하기 때문입니다.
3. **`style`이(가) 클래스보다 우선합니다.** 스타일 키는 이름이 같은 CSS 속성이며 클래스가 설정하는 것과 같은 속성이므로 해당 속성만 대체합니다. `style={{ paddingLeft: 8 }}`은(는) `pl-4`을(를) 대체하고 `pr-4`은(는) 그대로 둡니다.
4. `!`을(를) 사용하면 클래스가 important가 됩니다: `!p-0`.

Rust 컴포넌트(`nsh/base`의 컴포넌트와 앱 자체 crate의 컴포넌트)도 TSX에서 `class`, `classList`을(를) 받을 수 있습니다. 전달한 클래스는 컴포넌트 자체 스타일 뒤에 병합되며, 우선순위가 같으면 전달한 클래스가 우선합니다.

<a id="variants"></a>

## 변형

| Variant | 적용 시점 | Rust |
|---|---|---|
| `active:` | 뷰가 눌려 있음 | `.active(\|s\| ..)` |
| `hover:` | 포인터가 뷰 위에 있음(iPad 및 Mac 포인터) | `.hover(\|s\| ..)` |
| `focus:`, `focus-visible:` | 입력이 포커스를 가짐 | `.focus(\|s\| ..)` |
| `focus-within:` | 뷰 또는 그 자손이 포커스를 가짐(`Overlay`의 콘텐츠는 그것이 들어 있는 뷰의 자손임) | `.focus_within(..)` |
| `disabled:`, `enabled:` | 엘리먼트의 `disabled` prop이 true / false임 | `.disabled_style(\|s\| ..)` |
| `selected:` | 엘리먼트가 선택됨(`Button`의 `selected`, `accessibilityState.selected`) | `.selected_style(..)` |
| `checked:` | 엘리먼트가 체크됨(`accessibilityState.checked`이(가) `true`인 경우. `"mixed"`은(는) 체크되지 않음) | `.checked_style(..)` |
| `indeterminate:` | 엘리먼트가 불확정 상태임(`accessibilityState.checked`이(가) `"mixed"`인 경우) | `.indeterminate_style(..)` |
| `aria-expanded:` | 엘리먼트가 확장됨(`accessibilityState.expanded`이(가) `true`인 경우): 팝업이 열려 있는 동안의 `Popover` 또는 `Menu`의 트리거 | `.expanded_style(..)` |
| `aria-pressed:` | 엘리먼트가 켜져 있는 토글 버튼임(`accessibilityState.pressed`이(가) `true`인 경우. `"mixed"`은(는) 눌린 것이 아님). 진행 중인 누름(`active:`)과는 다름 | `.aria_pressed(..)`, `.pressed_style(..)` |
| `aria-busy:`, `aria-checked:`, `aria-selected:` | `accessibilityState.busy`, `checked`(`true`, `"mixed"` 아님) 또는 `selected`이(가) `true`인 경우로, Tailwind의 `aria-*` 변형과 같음: 의사 클래스 뒤에, 이름 순서대로 적용됨 | |
| `data-<name>:` | 엘리먼트에 `data-*` 속성 `name`이(가) 있음. Tailwind의 boolean `data-*` 변형(`&[data-range-start]`)과 같음: 컴포넌트의 파트가 상태 외에 표시하는 것으로, 예를 들어 범위의 시작에 있는 캘린더의 날(`data-range-start:`). `aria-*` 변형 뒤에, 이름 순서대로 적용됨 | `Interactive::project_data(name, ..)`이(가) 컴포넌트의 파트에 해당 속성을 설정함 |
| `group-active:`, `group-hover:`, `group-focus:`, `group-focus-within:`, `group-disabled:`, `group-selected:`, `group-checked:`, `group-indeterminate:`, `group-aria-expanded:`, `group-aria-pressed:`, `group-aria-busy:`, `group-aria-checked:`, `group-aria-selected:`, `group-data-<name>:` | `group` 클래스를 가진 가장 가까운 조상이 해당 상태이거나 해당 `data-*` 속성을 가짐 | 조상에 `.group()`, 내부에 `.group_active(..)`, `.group_hover(..)`, `.group_focus_within(..)` |
| `group-active/name:` ... | 동일하며, `group/name` 표시가 있는 조상을 대상으로 함 | `.group_named("name")`, `.group_active_named("name", ..)`, ... |
| `first:`, `last:`, `odd:`, `even:`, `only:` | 형제 엘리먼트 사이에서 해당 엘리먼트 자신의 위치. 행의 위치에 따라 행의 레이블 색을 바꾸려면 행에 `last:text-*`을(를) 지정하세요. 레이블이 이를 상속함 | 행의 인덱스에서 도출하는 일반 Rust 코드(`at.is_first()`, `at.is_last()`, `at.index() % 2`) |
| `placeholder:` | 입력의 placeholder를 스타일링함(`placeholder:text-zinc-400`) | `.placeholder_color(..)` |
| `selection:` | 입력 또는 선택 가능한 텍스트와 해당 엘리먼트 안에 있는 것들의 선택 강조 색상을 지정함(`selection:bg-violet-200`) | `.selection_color(..)` |
| `dark:` | 시스템 외관이 다크 모드임 | `AdaptiveColor` 또는 `.dark(\|s\| ..)` |
| `sm:`, `md:`, `lg:`, `xl:`, `2xl:` | 창 너비가 최소 640, 768, 1024, 1280, 1536 포인트임 | `.style_when(\|\| window().width >= px(768.0), \|s\| ..)` |
| `max-sm:`, `max-md:`, ... | 창이 브레이크포인트보다 좁음 | 동일하며 `<` 사용 |
| `min-[600px]:`, `max-[600px]:` | 임의의 브레이크포인트 | 동일 |
| `portrait:`, `landscape:` | 창의 방향 | `window().width > window().height` |
| `ios:`, `android:`, `web:` | 플랫폼 | `.when(os() == Os::Ios, \|v\| ..)` |
| `rtl:`, `ltr:` | [레이아웃 방향](./layout.md#right-to-left) | 뷰의 `.direction(LayoutDirection::..)` |
| `motion-safe:`, `motion-reduce:` | 사용자의 동작 줄이기 설정 | `reduce_motion()` |

변형은 조합할 수 있습니다: `dark:active:bg-zinc-700`, `md:landscape:flex-row`. Rust에서 `.active(..)` 스타일 안의 `AdaptiveColor`은(는) `dark:active:`입니다.

```rust tabs
view()
    .group()
    .flex_row()
    .items_center()
    .gap_3()
    .rounded_xl()
    .bg(white())
    .p_3()
    .active(|s| s.bg(ZINC.shade(50)))
    .child(text("Settings").flex_1().text_color(ZINC.shade(900)))
    .child(
        text("›")
            .text_color(ZINC.shade(300))
            .transition_transform()
            .group_active(|s| s.translate_x(px(4.0))),
    )
```

```tsx tabs
<View class="group flex-row items-center gap-3 rounded-xl bg-white p-3 active:bg-zinc-50">
  <Text class="flex-1 text-zinc-900">Settings</Text>
  <Text class="text-zinc-300 transition-transform group-active:translate-x-1">›</Text>
</View>
```

모든 엘리먼트의 `disabled`(Rust에서는 `.disabled(..)`)은 `disabled:` 클래스(`.disabled_style(..)`)를 적용하고 마운트된 항목에서 눌림 핸들러를 제거하므로 눌림 피드백도 표시하지 않습니다:

```rust tabs
view()
    .disabled(saving)
    .on_press(save)
    .rounded_lg()
    .bg(EMERALD.shade(500))
    .px_4()
    .py_2()
    .active(|s| s.bg(EMERALD.shade(600)))
    .disabled_style(|s| s.opacity(0.4))
    .child(text("Save").font_weight(FontWeight::MEDIUM).text_color(white()))
```

```tsx tabs
<View disabled={saving()} onPress={save} class="rounded-lg bg-emerald-500 px-4 py-2 active:bg-emerald-600 disabled:opacity-40">
  <Text class="font-medium text-white">Save</Text>
</View>
```

브레이크포인트는 기기가 아니라 창(NSH가 렌더링하는 표면)을 기준으로 비교합니다. iPad 분할 보기나 크기 조절이 가능한 창에서는 `window()`처럼 창의 너비를 따릅니다.

<a id="what-differs-from-tailwind-on-the-web"></a>

## 웹의 Tailwind와 다른 점

- **단위는 포인트입니다.** `p-4`(`.p_4()`)는 16포인트입니다(간격 1단계 = 4pt, 1rem = 16pt). `px`의 임의 값도 포인트입니다. `p-[13px]`(`.p(px(13.0))`)는 13pt입니다.
- **`flex`은(는) 행입니다.** CSS와 같습니다. `class="flex"`: 방향 클래스가 달리 지정하지 않는 한 자식을 행으로 배치합니다(문자열의 어느 위치든 상관없음. `flex-col flex`은(는) 열). 스타일의 `display: "flex"`과(와) Rust의 `.flex()`도 같은 방식으로 행이며, display를 설정하지 않은 뷰는 NSH의 기본값인 열을 유지합니다. `block`, `flow-root`은(는) 블록 레이아웃을 사용하며, `inline`, `inline-block`도 브라우저가 flex 또는 grid 부모 안에서 배치하는 방식대로 블록 레이아웃을 사용합니다. Rust에서는 `.flex_row()`, `.flex_col()`이(가) 방향을 설정합니다.
- **뷰의 텍스트 클래스는 상속됩니다.** 뷰의 `text-*`, `font-*`, `leading-*`, `tracking-*` 및 기타 텍스트 유틸리티(Rust에서는 `.text_color(..)`, `.font_weight(..)` 등)는 CSS 상속처럼 그 안의 텍스트 및 입력 엘리먼트에 전달됩니다. `<View class="text-white">`은(는) 레이블을 흰색으로 만듭니다.
- **모든 뷰는 자신만의 박스입니다.** `overflow-x-hidden`, `overflow-y-hidden`은(는) 두 축 모두를 클리핑하며, `overflow-hidden`과 같습니다(스크롤은 [scroll](../elements/scroll.md) 엘리먼트의 몫입니다). `invisible`은(는) 뷰와 그 안의 모든 것을 숨깁니다. `mix-blend-*`은(는) 뷰를 그 뒤에 그려진 모든 것과 블렌딩합니다. `block` 박스는 자신의 마진과 자식의 마진을 분리해 유지합니다. `absolute` 뷰는 CSS처럼 가장 가까운 positioned 조상 안에 배치됩니다. `fixed`은(는) 뷰를 루트 뷰 안에 배치합니다(다른 엘리먼트는 `absolute`처럼 배치됩니다).
- **텍스트는 공백을 유지합니다.** 문자열의 공백과 줄바꿈은 작성된 그대로 그려지며, 줄바꿈 방식은 `whitespace-*`이(가) 설정합니다. JSX 컴파일러는 JSX와 마찬가지로 리터럴 JSX 텍스트의 공백을 축약합니다.
- **트랜지션은 속성 그룹을 애니메이션합니다**: `transition`은(는) 색상, 불투명도, 그림자, 트랜스폼을 애니메이션하고, `transition-all`은(는) 모서리 반경과 테두리 두께도 애니메이션합니다. 필터, 백드롭 필터, 그라디언트, 레이아웃은 새 값이 즉시 적용됩니다.
- **`focus-visible:`은(는) `focus:`입니다**: 엘리먼트가 포커스를 가질 때마다 적용됩니다.
- **상태 배경이 그라디언트 위에 표시됩니다.** CSS에서는 그라디언트가 `background-color`을(를) 덮으므로 `bg-linear-*` 표면에 지정한 `active:bg-*`은(는) 절대 보이지 않습니다. NSH에서는 `active:`, `hover:`, `focus:` 또는 `group-*:`의 배경색이 해당 상태가 유지되는 동안 그라디언트를 대체합니다(해당 상태가 `active:from-*`처럼 자체 그라디언트를 설정하는 경우는 제외). `activeStyle`과(와) 다른 상태 스타일, 애니메이션되는 배경색도 마찬가지입니다.
- **텍스트 및 터치 설정은 스타일 키입니다**: `line-clamp-*`은(는) `numberOfLines`을(를) 설정하고, `text-ellipsis`, `text-clip`은(는) `textOverflow`을(를) 설정하며, `truncate`은(는) 둘 다 설정하고, `select-*`은(는) `userSelect`을(를), `pointer-events-*`은(는) `pointerEvents`을(를) 설정합니다. 따라서 상태 변형에서도 동작하며, 모든 클래스와 마찬가지로 인라인 `style`에 밀립니다. `caret-*`, `placeholder:text-*`, `selection:bg-*`은(는) 같은 방식으로 `caretColor`, `placeholderColor`, `selectionColor` 스타일을 설정합니다. Rust에서는 `Styled` 메서드입니다(`.number_of_lines(..)`, `.truncate()`, `.text_overflow(..)`, `.select_text()`, `.pointer_events(..)`, ...). `whitespace-nowrap`은(는) 클래스로서 텍스트를 한 줄로 유지합니다. `object-*`은(는) 이미지와 비디오의 `objectFit` 및 `objectPosition` 스타일을 설정하며, 이는 다른 스타일과 마찬가지로 스타일의 키가 대체합니다.
- **지원 범위**: 네이티브 의미가 있는 Tailwind 4의 유틸리티와 변형입니다. `peer-*` 변형, 의사 요소(`before:`, `after:`), 임의 속성(`[mask-type:luminance]`)은 알 수 없는 클래스로 보고되며, NSH에 네이티브 의미가 없는 모든 유틸리티도 마찬가지입니다. 따라서 클래스가 브라우저에서와 다른 의미를 갖는 일은 없습니다. 렌더링 힌트(`antialiased`, `will-change-transform`, `appearance-none`, `box-border`, ...)는 허용되지만 아무 효과도 없습니다.

그 외 모든 것은 Tailwind 4 문서대로 동작합니다. 색상 팔레트, 불투명도 modifier(`bg-black/40`), 임의 값(`bg-[#34c759]`, `w-[72px]`, `grid-cols-[1fr_2fr]`. `p`, `px`, `py`, `pt`, `pr`, `pb`, `pl` 및 `m` 유틸리티에서는 환경 변수 `pt-[env(safe-area-inset-top)]`, `pb-[calc(env(keyboard-inset-height)+49px)]`도 사용할 수 있습니다. [Safe area](../elements/safe-area.md)와 [Keyboard](../elements/keyboard.md) 참고), 분수(`w-1/2`, `translate-x-1/2`), 그림자와 링, 그라디언트(`bg-linear-to-r`, `bg-radial`, `bg-conic`과 `from-` / `via-` / `to-`), 필터, `backdrop-blur-*`, `mix-blend-*`, 트랜스폼, `transition-*`과 `duration-*`, `animate-spin` / `ping` / `pulse` / `bounce`, 그리드가 있으며, 각각 Rust에 대응하는 타입 메서드가 있습니다. [필터와 블렌딩](./styling.md#filters-and-blending)의 플랫폼 제약은 클래스에도 적용됩니다.

<a id="theme"></a>

## 테마

클래스는 Tailwind 4의 기본 테마를 기준으로 해석됩니다. `nsh.json`의 `"tailwind"` 아래에서 확장하세요. 지정한 항목은 기본값에 추가되거나 같은 이름의 기본값을 대체합니다:

```json
{
  "tailwind": {
    "colors": {
      "brand": { "50": "#f5f3ff", "500": "#7c3aed", "600": "#6d28d9", "DEFAULT": "#7c3aed" },
      "ink": "#1f2328"
    },
    "radius": { "card": 14 },
    "fontFamily": { "display": "Pacifico" },
    "breakpoints": { "tablet": 600 }
  }
}
```

이 테마에서는 `bg-brand-500`, `text-brand`(`DEFAULT` 셰이드), `border-ink`, `rounded-card`, `font-display`, `tablet:flex-row`이(가) 유효한 클래스입니다.

| Key | 값 | 생성되는 것 |
|---|---|---|
| `colors` | CSS 색상 또는 셰이드 객체(이름만 쓰는 경우는 `"DEFAULT"`) | `bg-*`, `text-*`, `border-*`, `from-*`, `ring-*`, ... |
| `spacing` | 간격 단계당 포인트(기본값 4) | `p-*`, `m-*`, `gap-*`, `w-*`, ... |
| `rem` | 임의 값에서 `rem`당 포인트(기본값 16) | |
| `breakpoints` | 포인트 | `name:` 변형 |
| `container` | 포인트 | `max-w-*` 크기 |
| `fontSize` | 포인트 또는, 줄 높이를 크기의 배수로 지정하는 `[size, lineHeight]` | `text-*` |
| `fontWeight` | 1–1000 | `font-*` |
| `fontFamily` | 패밀리 이름(시스템 패밀리 또는 [가져온 폰트](./fonts.md)의 이름) | `font-*` |
| `tracking` | em 단위 | `tracking-*` |
| `leading` | 폰트 크기의 배수 | `leading-*` |
| `radius` | 포인트 | `rounded-*` |
| `shadow`, `insetShadow`, `dropShadow` | CSS `box-shadow` | `shadow-*`, `inset-shadow-*`, `drop-shadow-*` |
| `blur` | 포인트 | `blur-*`, `backdrop-blur-*` |
| `perspective` | 포인트 | `perspective-*` |
| `aspect` | 비율(`1.5`) | `aspect-*` |
| `ease` | `[x1, y1, x2, y2]` | `ease-*` |

알 수 없는 키와 잘못된 값은 빌드 오류입니다(`nsh.json: tailwind: unknown theme key 'colours'`). 테마는 번들에 컴파일되어 첫 프레임 전에 적용됩니다.

Tailwind 테마는 클래스의 모양을 결정합니다. 타입 메서드는 Tailwind의 기본 스케일을 유지하므로 Rust 컴포넌트는 어떤 앱에서도 동일하게 보이며, 앱의 외형은 테마의 디자인 토큰, 즉 `nsh.json`의 `"theme"`([Rust](./rust.md#theme))에서 가져옵니다.
<a id="theme-tokens"></a>

## 테마 토큰

앱의 테마(`nsh.json`의 `"theme"`)에는 디자인 토큰이 들어 있습니다. shadcn/ui의 색상(`background`, `foreground`, `primary`, `muted-foreground`, `border`, `ring`, `chart-1`, `sidebar`, ...), `radius`, 글꼴 `font-sans`와 `font-mono`, 그리고 앱이 추가하는 모든 토큰이 여기에 해당합니다. 클래스는 CSS `@theme`의 변수를 Tailwind 이름으로 지정하듯 토큰을 가리키고, Rust 컴포넌트는 `nsh_base`의 `theme()`로, TSX는 `nsh`의 `token()`로 토큰을 읽습니다. 따라서 TSX 화면과 Rust 컴포넌트는 같은 테마를 따릅니다.

```rust tabs
use nsh_base::theme;

view()
    .rounded(move || theme().radius)
    .border_1()
    .border_color(move || theme().border)
    .bg(move || theme().card)
    .p_4()
    .child(text("Balance").text_color(move || theme().card_foreground))
    .child(text("Updated just now").text_color(move || theme().muted_foreground))
    .child(
        view()
            .rounded(move || theme().radius)
            .bg(move || theme().primary)
            .px_4()
            .py_2()
            .active(|s| s.bg(move || theme().primary.opacity(0.9)))
            .child(text("Continue").text_color(move || theme().primary_foreground)),
    )
```

```tsx tabs
<View class="rounded-(--radius) border border-border bg-card p-4">
  <Text class="text-card-foreground">Balance</Text>
  <Text class="text-muted-foreground">Updated just now</Text>
  <View class="rounded-(--radius) bg-primary px-4 py-2 active:bg-primary/90">
    <Text class="text-primary-foreground">Continue</Text>
  </View>
</View>
```

토큰의 이름은 테마 파일에 적힌 대로 CSS 변수 이름에서 `--`를 뺀 것입니다: `muted-foreground`, `radius`, `chart-1`. Rust에서 shadcn의 토큰은 `theme()`의 메서드이며(`primary()`, `muted_foreground()`, `radius()`, `font_mono()`), 모든 토큰은 `theme().color("up")`, `theme().number("radius-card")` 또는 `theme().font("font-display")`입니다.

| 형태 | 받는 값 | 예시 |
|---|---|---|
| 모든 색상 유틸리티의 색상 이름 | 테마 색상(불투명도도 지정 가능) | `bg-primary`, `text-muted-foreground/70`, `bg-up/30`, `border-t-border`, `ring-ring`, `from-accent`, `placeholder:text-muted-foreground` |
| `(--name)`, Tailwind 4의 변수 단축 표기 | 테마 색상 또는 숫자 | `bg-(--primary)`, `rounded-(--radius)`, `p-(--gap-card)` |
| `(color:--name)`, `(length:--name)`, `(number:--name)`, `(family-name:--name)` | 위와 같으며, 유틸리티가 여러 종류의 값을 받을 때 타입을 지정 | `text-(color:--up)`, `text-(length:--text-title)`, `font-(family-name:--font-mono)` |
| `font-sans`, `font-mono` | 테마가 설정한 경우 테마의 글꼴 | `font-mono` |

- **직접 만든 토큰.** CSS `@theme`의 모든 변수가 토큰이 되듯, 테마 파일에 있는 모든 이름이 토큰입니다. `"up": "#16a34a"`은 `bg-up`, `text-up`, `bg-up/30`를 만들고, `"radius-card": "14px"`은 `rounded-(--radius-card)`을, `"font-display": "Pacifico"`는 `font-(family-name:--font-display)`을 만듭니다. 길이의 단위는 포인트이며, `(number:--name)`는 숫자 그대로 전달합니다.
- **글꼴.** `font-sans`는 앱의 글꼴입니다. 자체 글꼴 패밀리를 지정하지 않은 모든 텍스트는, 웹 페이지가 Tailwind의 `--font-sans`를 쓰듯 이 글꼴로 그려집니다. `font-mono`는 `font-mono`과 `TextView` 안의 코드에 쓰이는 글꼴입니다. 설정하지 않으면 둘 다 시스템 글꼴을 사용합니다.
- **두 가지 모드 모두 지원.** 토큰은 테마의 라이트 값과 다크 값을 모두 가집니다. `bg-primary`, `theme().primary`, `token("primary")`는 `dark:` 클래스 없이도 모드에 따라 자동으로 전환됩니다. 테마가 한쪽 모드에만 설정한 색상은 양쪽 모드에서 그대로 사용됩니다.
- **Tailwind 색상이 우선합니다.** `"tailwind"` `colors` 또는 Tailwind 팔레트에 있는 이름은 그 색상을 가리키므로, Tailwind 테마에 `primary` 색상이 없을 때만 `bg-primary`가 테마 토큰이 됩니다.
- **앱이 실행되는 동안 테마가 바뀔 수 있습니다.** 네이티브 앱에 임베드된 앱이 그 앱의 테마를 받을 때, 그리고 테마가 바뀔 때마다 토큰을 지정한 클래스, `theme()`를 읽는 Rust 바인딩, `token()`를 읽는 TSX 코드가 갱신됩니다. 클래스와 바인딩은 네이티브에서 갱신됩니다. 임베드하는 앱의 테마에 없는 토큰은 앱 자체 `"theme"`의 값(그다음은 기본 테마의 값)을 유지합니다. 브랜드만 추가하는 호스트는 테마 오버라이드, 즉 브랜드가 바꾸는 토큰만 같은 파일 형식으로 제공합니다([iOS](./ios.md#theme-overrides), [Android](./android.md#theme-overrides), 데스크톱에서는 `AppView::set_theme_overrides`).
- **다른 클래스처럼 검사됩니다.** 기본 테마나 앱의 `"theme"`에 없는 토큰 이름은 빌드할 때 알 수 없는 클래스로 처리됩니다(`unknown class 'bg-chart-up'`). 임베드하는 앱만 제공하는 토큰을 사용하려면, 앱의 `"theme"`에도 값을 지정하세요. 그 값은 앱이 단독으로 실행될 때 표시됩니다.

토큰을 지정하는 클래스는 다른 클래스처럼 테마마다 한 번 해석되므로, 이를 그리는 비용은 팔레트 색상과 같습니다.

<a id="445-in-tsx"></a>

### TSX의 `token()`

`nsh`의 `token(name)`는 현재 표시 중인 모드에서의 토큰 값입니다. 색상은 `#rrggbbaa`, 길이는 포인트 단위 숫자, 글꼴은 패밀리 이름으로 반환됩니다. 이 값은 반응형이므로, 컴포넌트, memo, effect에서 읽는 코드는 테마나 모드가 바뀔 때 다시 실행됩니다. 캔버스나 차트처럼 클래스를 쓸 수 없는 곳에 들어가는 값에 적합합니다.

```tsx
import { Canvas, token } from "nsh";

<Canvas
  style={{ height: 160 }}
  draw={(cx, { width, height }) => {
    cx.beginPath();
    cx.moveTo(0, height);
    cx.lineTo(width, 0);
    cx.strokeStyle = token("chart-1");
    cx.lineWidth = 2;
    cx.stroke();
  }}
/>
```

이름에는 타입이 지정됩니다. NSH가 테마에서 앱의 토큰을 `.nsh/types/nsh/tokens.d.ts`에 기록하므로, 테마에 `"up"`가 있으면 `token("up")`는 `string`이고, 테마에 없는 이름은 타입 오류입니다.

<a id="the-class-check"></a>

## 클래스 검사

`nsh build`, `nsh dev`, `nsh run`, `nsh test`는 JSX의 정적 클래스 이름(`class`의 문자열 리터럴과 `classList`의 키)을 런타임과 같은 파서 및 테마로 검사하여, 존재하지 않는 클래스를 경고합니다.

```text
 warn nsh::build App.tsx:12:36: unknown class `bg-brand-550`
```

경고가 있어도 빌드는 실패하지 않습니다. 런타임에 만들어지는 클래스(``bg-${color()}-500``)는 런타임이 처음 볼 때 검사되며, 알 수 없는 클래스마다 한 번씩 로그를 남깁니다(`unknown classes: ...`). 타입이 지정된 메서드는 Rust 컴파일러가 검사합니다.

<a id="classes-or-styles"></a>

## 클래스와 스타일 중 무엇을 쓸까요?

둘 다 네이티브에서 해석되며 비용도 거의 같습니다. 클래스는 더 짧고, 코드 없이 변형(눌림 상태, 다크 모드, 브레이크포인트)을 지원합니다. 인라인 스타일은 JavaScript에서 계산한 값을 받을 수 있고 [네이티브 애니메이션 값](./animation.md)(`opacity: fade`, `translate: [x, 0]`)도 받습니다. 대부분의 TSX 앱은 정적인 모양에는 클래스를, 계산되거나 애니메이션되는 값에는 `style`을 사용합니다. Rust 컴포넌트는 둘 다 타입이 지정된 메서드로 처리하고, 애니메이션 값은 `.bind_opacity(..)`, `.bind_translate_x(..)` 및 기타 바인딩으로 연결합니다.

<a id="related"></a>

## 관련 문서

- [스타일링](./styling.md): style prop, 타입이 지정된 메서드, 효과의 플랫폼별 제약.
- [Tailwind 레퍼런스](../modules/tailwind-reference.md): 모든 유틸리티와 변형.
- [레이아웃](./layout.md): 플렉스박스와 그리드이며, 클래스로도 사용할 수 있습니다.
