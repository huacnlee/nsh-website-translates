---
title: "스타일 레퍼런스"
description: "NSH에서 사용할 수 있는 모든 스타일 키를 LayoutStyle, ViewStyle, TextStyle, InputStyle, ImageStyle별로 분류하여 각 키의 타입과 의미를 설명합니다."
order: 16
source_hash: 012ce37fb9fe065c
---

# 스타일 레퍼런스

이 페이지는 `style` prop의 모든 키와, Rust에서 해당 키를 설정하는 `Styled`의 메서드를 나열합니다. Rust 컴포넌트는 Tailwind 유틸리티 이름을 딴 타입 메서드(`nsh_core::prelude`의 `.p_4()`, `.rounded(px(12.0))`, `.bg(color)`)로 요소를 스타일링하며, 이 메서드는 동일한 키로 변환됩니다. TSX는 `style` 객체(및 클래스)를 전달합니다. Rust 열에는 메서드 이름이 적혀 있으며, 대부분의 메서드는 값, 시그널 또는 클로저를 받을 수 있고, `.style_when(…)` / `.style_with(…)`로 어떤 메서드든 조건부로 적용할 수 있습니다. 키와 타입은 `.nsh/types/nsh/types.d.ts`의 생성된 선언에서 가져오므로, 에디터가 입력하는 동안 검사해 줍니다. 스타일 키는 이름이 같은 CSS 속성을 의미하며, 그 속성을 설정하는 클래스와 동일합니다. `paddingLeft`는 CSS의 `padding-left` 및 `pl-4`이고, `boxShadow`는 `box-shadow` 및 `shadow-md`입니다. 일부 키는 앱에서 흔히 쓰는 더 쉬운 이름을 받습니다(`padding-inline` 대신 `paddingHorizontal`, `margin-inline-start` 대신 `marginStart`, `line-clamp` 대신 `numberOfLines`). 숫자는 포인트 단위이며, grid, 그라디언트, box shadow, 필터, 블렌드 모드, 아웃라인, 트랜스폼, 트랜지션, 키프레임 애니메이션 같은 CSS 기능도 지원합니다.

스타일을 적용하고, 클래스와 함께 사용하고, 텍스트 스타일을 상속하는 방법은 [스타일링](../docs/styling.md)을 참고하세요. 클래스 문법은 [Tailwind 레퍼런스](./tailwind-reference.md)를 참고하세요.

<a id="the-five-interfaces"></a>

## 다섯 가지 인터페이스

각 인터페이스는 바로 앞의 인터페이스를 확장합니다.

| 인터페이스 | 확장 대상 | 사용처 |
|---|---|---|
| `LayoutStyle` | | 모든 요소의 레이아웃(flexbox, grid, 크기, 간격, 위치) |
| `ViewStyle` | `LayoutStyle` | `<View>`, `<Scroll>`, `<List>`, 컨트롤 및 기타 모든 요소 |
| `TextStyle` | `ViewStyle` | `<Text>` 및 `<Input>` (그리고 뷰: 뷰의 텍스트 스타일은 그 안의 텍스트로 전달됩니다) |
| `InputStyle` | `TextStyle` | `<Input>`: `placeholderColor` 및 `caretColor` 추가 |
| `ImageStyle` | `ViewStyle` | `<Image>` |

```rust tabs
use nsh_core::prelude::*;

fn card() -> View {
    view().p_4().rounded(px(12.0)).bg(white()).shadow([BoxShadow {
        offset_y: px(4.0),
        blur: px(12.0),
        color: rgba(0x00000014).into(),
        ..BoxShadow::default()
    }])
}

fn title(label: &str) -> Text {
    text(label.to_string()).text_size(px(17.0)).font_weight(FontWeight::SEMIBOLD).text_color(rgb(0x111111))
}

card().child(title("Hello"))
```

```tsx tabs
import type { ViewStyle, TextStyle } from "nsh";
import { Text, View } from "nsh";

const card: ViewStyle = {
  padding: 16,
  borderRadius: 12,
  backgroundColor: "#fff",
  boxShadow: "0 4px 12px rgb(0 0 0 / 0.08)",
};

const title: TextStyle = { fontSize: 17, fontWeight: "600", color: "#111" };

<View style={card}>
  <Text style={title}>Hello</Text>
</View>;
```

`style`는 배열도 받습니다. 항목은 왼쪽에서 오른쪽으로 병합되고 falsy 항목은 건너뛰므로, 조건부 스타일에 스프레드가 필요 없습니다. Rust에서는 `.style_when(condition, …)`가 조건이 참인 동안 스타일을 추가합니다.

```rust tabs
card().style_when(selected, |s| s.border_color(rgb(0x2563eb)).border(px(2.0)))
```

```tsx tabs
<View style={[card, selected() && { borderColor: "#2563eb", borderWidth: 2 }]} />
```

> [!NOTE]
> 인라인 `style`는 항상 `class`보다 우선합니다. 키를 `null` 또는 `undefined`로 설정하면 기본값으로 재설정됩니다.

<a id="how-style-keys-read"></a>

## 스타일 키를 읽는 방법

스타일 키는 CSS를 따르므로, 같은 속성을 가리키는 스타일과 클래스는 동일하게 동작합니다.

- **레이아웃 방향.** `display`을 설정하지 않은 뷰는 자식을 열(column)로 배치합니다. `display: "flex"`는 CSS 및 `flex` 클래스와 마찬가지로 `flexDirection`을 설정하지 않으면 행(row)입니다. `flexShrink`는 설정하지 않으면 `0`입니다.
- **물리적 방향과 논리적 방향.** `left`, `right`, `marginLeft`, `paddingRight`, `borderLeftWidth`, `borderTopLeftRadius`, `textAlign: "left"`는 오른쪽에서 왼쪽으로 쓰는 레이아웃에서도 자신의 방향을 유지합니다. start와 end 키(`marginStart`, `paddingEnd`, `start`, `end`, `borderStartWidth`, ...), `borderTopStartRadius` 계열, `textAlign: "start" | "end"`는 방향을 따릅니다. inline start는 왼쪽에서 오른쪽 레이아웃에서는 왼쪽, 오른쪽에서 왼쪽 레이아웃에서는 오른쪽입니다.
- **테두리 색상.** 너비는 설정했지만 색상은 설정하지 않은 border 또는 outline은 텍스트 색상(CSS의 `currentColor`)으로 그려집니다.
- **트랜스폼.** `translate`, `rotate`, `scale`는 각각 독립된 속성이며, `transform`는 CSS 함수 문자열 또는 변화량이 애니메이션 값일 수 있는 단계 목록을 받습니다. 이들은 `translate`, `rotate`, `scale`, `transform` 순서로 합성됩니다.

<a id="value-types"></a>

## 값 타입

| 타입 | 허용 값 | Rust |
|---|---|---|
| `number` | 포인트(밀도 독립적). `1`은 iOS에서 1포인트, Android에서 1dp입니다. | `Points`: `px(16.0)` |
| `DimensionValue` | `number`(포인트), `` `${number}%` ``(부모 기준) 또는 `"auto"`. | `Length`: `px(…)`, `relative(0.5)`, `auto()` |
| `LengthValue` | `number`(포인트) 또는 `` `${number}%` ``. `"auto"`는 사용할 수 없습니다. | `DefiniteLength`: `px(…)`, `relative(0.5)` |
| `ColorValue` | CSS 색상 문자열: `#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa`, `rgb()`, `rgba()`, `hsl()`, `hsla()`, `oklch()`, `oklab()` 또는 이름이 있는 CSS 색상(`black`, `white`, `transparent`, `rebeccapurple`, ...). | `Hsla` / `AdaptiveColor`: `rgb(0x2563eb)`, `hsla(…)`, 테마 색상(`theme().primary`) |
| `EnvValue` | padding 또는 margin의 환경 변수: `env(name)`, `env(name, <length>)`(알 수 없는 이름 대신 이 길이가 사용됨), `calc(env(name) + <length>)` 또는 `calc(<length> + env(name))`. 이름은 `safe-area-inset-top`, `-right`, `-bottom`, `-left`([안전 영역](../elements/safe-area.md))과 `keyboard-inset-height`([키보드](../elements/keyboard.md))입니다. 물리적 padding 및 margin 키와 그 축약형에서 사용할 수 있습니다. | `.p_safe_area()`, `.pt_safe_area_plus(px(8.0))`, `.pb_keyboard()`, `.mb_keyboard_plus(…)`, ... |
| `AnimatedNode` | 네이티브 애니메이션 값 또는 그로부터 파생된 노드([`nsh`의 애니메이션 API](./nsh.md#animation) 참고). `opacity`, `backgroundColor`, `borderColor`, `color`, `translate`, `rotate`, `scale`, `transform` 목록의 단계, 그리고 sticky 뷰의 `top` / `left`에서 사용할 수 있으며, 이 값은 JS 없이 UI 스레드에서 애니메이션됩니다. | `AnimatedValue` / `AnimatedNode`, `.bind_opacity(&v)`, `.bind_background(&v)`, `.bind_border_color(&v)`, `.bind_color(&v)`, `.bind_translate_x(&v)`, ...로 바인딩 |

CSS 문법을 사용하는 문자열(`boxShadow`, `textShadow`, `backgroundImage`, `filter`, `gridTemplateColumns`, ...)에서는 `px`와 숫자만 쓴 값(둘 다 포인트), `pt`(CSS와 같이 1포인트의 4/3), 또는 `rem`(16포인트) 단위의 길이를 사용할 수 있습니다.

## LayoutStyle

레이아웃은 Rust에서 계산됩니다(flexbox와 CSS grid). `display`를 설정하지 않은 뷰는 자식이 열로 쌓이는 flex 컨테이너이며, `display: "flex"`는 CSS와 마찬가지로 `flexDirection`을 설정하지 않으면 이를 행으로 만듭니다. 요소의 기본값은 `flexShrink: 0`, `alignContent: "flex-start"`(grid의 경우 CSS의 `"normal"`), `alignItems: "stretch"`이며, 자동 최소 크기는 없습니다. [레이아웃](../docs/layout.md)을 참고하세요.

<a id="display-and-position"></a>

### Display와 position

| 키 | 타입 | Rust | 설명 |
|---|---|---|---|
| `display` | `"flex" \| "grid" \| "block" \| "flow-root" \| "none"` | `.flex()`, `.grid()`, `.hidden()` | 자식의 레이아웃. `"flex"`은 CSS와 마찬가지로 `flexDirection`이 방향을 지정하지 않으면 자식을 행으로 배치하며, display를 설정하지 않은 뷰는 자식을 열로 배치합니다. `"none"`은 요소를 레이아웃에서 제거하고 숨깁니다. `"block"`은 CSS 블록 레이아웃처럼 자식을 쌓습니다. |
| `boxSizing` | `"border-box" \| "content-box"` | | 크기에 border와 padding을 포함할지, 콘텐츠만 포함할지 결정합니다. 기본값 `"border-box"`. |
| `position` | `"relative" \| "absolute" \| "static" \| "fixed" \| "sticky"` | `.relative()`, `.absolute()` | `"absolute"`은 요소를 흐름에서 제거하고, 가장 가까운 positioned 조상(그것이 `"static"`가 아니라면 부모)을 기준으로 `top` / `right` / `bottom` / `left`에 따라 배치합니다. `"static"`은 흐름 안에 남고 inset을 무시합니다. `"fixed"`은 요소 타입을 보존하고 surface 또는 modal 루트에서 레이아웃과 마운트를 수행하며, 주변 콘텐츠가 스크롤되어도 제자리를 유지합니다. `"sticky"`은 흐름 안에 남고, 부모가 보이는 동안 주변 스크롤 뷰의 뷰포트 시작점에서 `top`(가로 스크롤 뷰에서는 `left`)만큼 떨어진 위치에 고정되며, 끝이 부모의 콘텐츠 박스 끝에 닿을 때까지 유지됩니다. 같은 `zIndex`을 가진 형제 요소보다 위에 그려집니다. 기본값 `"relative"`. |
| `top` | `DimensionValue \| AnimatedNode` | `.top(…)`, `.inset(…)`, `.bind_sticky_top(&node)` | 부모의 위쪽 가장자리로부터의 오프셋(absolute) 또는 요소 자신의 위치로부터의 오프셋(relative). sticky 뷰에서는 고정되는 위치이며, 애니메이션 값을 사용하면 매 프레임 이동합니다. |
| `right` | `DimensionValue` | `.right(…)` | 오른쪽 가장자리로부터의 오프셋이며, 어느 방향이든 적용됩니다. |
| `bottom` | `DimensionValue` | `.bottom(…)` | 아래쪽 가장자리로부터의 오프셋. |
| `left` | `DimensionValue \| AnimatedNode` | `.left(…)`, `.bind_sticky_left(&node)` | 왼쪽 가장자리로부터의 오프셋이며, 어느 방향이든 적용됩니다. 가로 스크롤 뷰 안의 sticky 뷰에서는 고정되는 위치이며, 애니메이션 값을 사용하면 매 프레임 이동합니다. |
| `start` | `DimensionValue` | | inline start 가장자리로부터의 오프셋: 왼쪽에서 오른쪽 레이아웃에서는 왼쪽, 오른쪽에서 왼쪽 레이아웃에서는 오른쪽. |
| `end` | `DimensionValue` | | inline end 가장자리로부터의 오프셋: 왼쪽에서 오른쪽 레이아웃에서는 오른쪽, 오른쪽에서 왼쪽 레이아웃에서는 왼쪽. |
| `zIndex` | `number` | `.z_index(z)` | 형제 요소 간의 순서(값이 같으면 안정적 순서). 네이티브 쌓임 순서이기도 합니다. |
| `direction` | `"inherit" \| "ltr" \| "rtl"` | | 레이아웃 방향이며, 기본적으로 상속됩니다. CSS와 마찬가지로 `left` 및 `right` 속성은 오른쪽에서 왼쪽 레이아웃에서도 자신의 방향을 유지하고, inline start / end 속성(`marginStart`, `end`, ...)은 방향에 따라 정해지는 쪽을 사용합니다. |

### Flexbox

| 키 | 타입 | Rust | 설명 |
|---|---|---|---|
| `flexDirection` | `"row" \| "column" \| "row-reverse" \| "column-reverse"` | `.flex_row()`, `.flex_col()`, `.flex_row_reverse()`, `.flex_col_reverse()` | 주축. `display`을 설정하지 않은 뷰의 기본값은 `"column"`이고, `display: "flex"`을 설정하면 `"row"`입니다. |
| `flexWrap` | `"wrap" \| "nowrap" \| "wrap-reverse"` | `.flex_wrap()` | 자식을 여러 줄로 줄바꿈할지 여부. 기본값 `"nowrap"`. |
| `flex` | `number` | `.flex_1()`, `.flex_auto()`, `.flex_none()` | CSS 축약형이 아닌 하나의 숫자: 양수는 `flexGrow`을 그 값으로, `flexShrink: 1`와 `flexBasis: 0`를 설정하고, `0`은 요소를 유연하지 않게 만들며, 음수는 요소를 최소 크기까지 줄입니다. |
| `flexGrow` | `number` | `.flex_grow(f)` | 요소가 차지하는 남는 공간의 비율. 기본값 `0`. |
| `flexShrink` | `number` | `.flex_shrink(f)`, `.flex_shrink_0()` | 공간이 부족할 때 요소가 줄어드는 정도. 기본값은 CSS의 `1`이 아니라 `0`입니다. |
| `flexBasis` | `DimensionValue` | `.basis(…)` | 남는 공간이 분배되기 전의 주축 크기. |
| `justifyContent` | `"flex-start" \| "flex-end" \| "start" \| "end" \| "center" \| "space-between" \| "space-around" \| "space-evenly" \| "stretch" \| "normal"` | `.justify_start()`, `.justify_center()`, `.justify_end()`, `.justify_between()`, `.justify_around()`, `.justify_evenly()` | 주축을 따른 자식의 분배. 기본값 `"normal"`: flex 컨테이너에서는 `"flex-start"`이고, grid에서는 `auto` 크기의 트랙이 늘어납니다. |
| `alignItems` | `"flex-start" \| "flex-end" \| "start" \| "end" \| "self-start" \| "self-end" \| "center" \| "stretch" \| "baseline" \| "normal"` | `.items_start()`, `.items_center()`, `.items_end()`, `.items_stretch()`, `.items_baseline()` | 교차축에서의 자식 정렬. 기본값 `"stretch"`. |
| `alignSelf` | `"auto" \| "flex-start" \| "flex-end" \| "start" \| "end" \| "self-start" \| "self-end" \| "center" \| "stretch" \| "baseline" \| "normal"` | `.self_start()`, `.self_center()`, `.self_end()`, `.self_stretch()` | 이 요소에 한해 부모의 `alignItems`를 재정의합니다. |
| `alignContent` | `"flex-start" \| "flex-end" \| "start" \| "end" \| "center" \| "stretch" \| "space-between" \| "space-around" \| "space-evenly" \| "normal"` | `.content_start()`, `.content_center()`, `.content_between()`, … | 교차축에서의 줄바꿈된 줄(및 grid 트랙)의 분배. 기본값은 flex 컨테이너에서 `"flex-start"`, grid에서 `"normal"`이며, grid에서는 `auto` 크기의 트랙이 늘어납니다. `"start"` / `"end"`은 쓰기 방향을 따릅니다. |
| `gap` | `LengthValue` | `.gap(…)`, `.gap_4()` | 자식의 행과 열 사이의 간격. |
| `rowGap` | `LengthValue` | `.gap_y(…)` | 행 사이의 간격. |
| `columnGap` | `LengthValue` | `.gap_x(…)` | 열 사이의 간격. |

### Grid

자식을 CSS grid로 배치하려면 `display: "grid"`를 설정하세요. 트랙 목록은 CSS 문법을 사용합니다.

| 키 | 타입 | Rust | 설명 |
|---|---|---|---|
| `gridTemplateColumns` | `string` | `.grid_template_columns(…)`, `.grid_cols(n)` | 열 트랙: `"repeat(3, 1fr)"`, `"200px 1fr"`, `minmax()`, `auto-fill` / `auto-fit`, 라인 이름(`"[a] 40px [b c] 1fr [d]"`). |
| `gridTemplateRows` | `string` | `.grid_template_rows(…)`, `.grid_rows(n)` | 행 트랙, 같은 문법. |
| `gridAutoColumns` | `string` | | 암시적으로 생성되는 열의 크기. |
| `gridAutoRows` | `string` | | 암시적으로 생성되는 행의 크기. |
| `gridAutoFlow` | `"row" \| "column" \| "dense" \| "row dense" \| "column dense"` | `.grid_flow_col()`, `.grid_flow_dense()` | 배치가 지정되지 않은 아이템이 grid를 채우는 방식. |
| `gridColumn` | `number \| string` | `.col_span(n)`, `.col_span_full()` | 열 배치: `"1 / 3"`, `"span 2"`, 라인 번호 또는 라인 이름(`"content-start / content-end"`, `"2 col"`, `"span col"`). |
| `gridColumnStart` | `number \| string` | `.col_start(…)` | 시작 열 라인. |
| `gridColumnEnd` | `number \| string` | `.col_end(…)` | 끝 열 라인. |
| `gridRow` | `number \| string` | `.row_span(n)`, `.row_span_full()` | 행 배치, `gridColumn`와 같은 문법. |
| `gridRowStart` | `number \| string` | `.row_start(…)` | 시작 행 라인. |
| `gridRowEnd` | `number \| string` | `.row_end(…)` | 끝 행 라인. |
| `justifyItems` | `"flex-start" \| "flex-end" \| "start" \| "end" \| "self-start" \| "self-end" \| "center" \| "stretch" \| "baseline" \| "normal"` | | grid 아이템이 행 방향으로 자신의 영역 안에 놓이는 방식. |
| `justifySelf` | `"auto" \| "flex-start" \| "flex-end" \| "start" \| "end" \| "self-start" \| "self-end" \| "center" \| "stretch" \| "baseline" \| "normal"` | | 이 아이템에 한해 `justifyItems`를 재정의합니다. |

```rust tabs
view()
    .grid()
    .grid_template_columns("repeat(3, 1fr)")
    .gap_2()
    .child(view().col_span(2).h(px(60.0)).bg(rgb(0xc7d2fe)))
    .child(view().h(px(60.0)).bg(rgb(0xa5b4fc)))
```

```tsx tabs
<View style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
  <View style={{ gridColumn: "span 2", height: 60, backgroundColor: "#c7d2fe" }} />
  <View style={{ height: 60, backgroundColor: "#a5b4fc" }} />
</View>
```

### Size

| 키 | 타입 | Rust | 설명 |
|---|---|---|---|
| `width` | `DimensionValue` | `.w(…)`, `.w_full()`, `.size(…)` | 너비. |
| `height` | `DimensionValue` | `.h(…)`, `.h_full()` | 높이. |
| `minWidth` | `LengthValue` | `.min_w(…)` | 최소 너비. |
| `minHeight` | `LengthValue` | `.min_h(…)` | 최소 높이. |
| `maxWidth` | `LengthValue` | `.max_w(…)` | 최대 너비. |
| `maxHeight` | `LengthValue` | `.max_h(…)` | 최대 높이. |
| `aspectRatio` | `number \| "auto" \| "16 / 9"` | `.aspect_ratio(r)`, `.aspect_square()` | 너비를 높이로 나눈 값으로, 숫자(`1.5`) 또는 CSS의 비율(`"16 / 9"`)입니다. 지정되지 않은 치수는 다른 치수로부터 계산됩니다. `"auto"`은 비율을 지정하지 않습니다. |

### Margin

Margin은 `"auto"`(flexbox에서처럼 남는 공간을 흡수)와 음수 값을 받습니다. 물리적 키(`marginStart` / `marginEnd` 제외)는 `EnvValue`도 받습니다: `marginBottom: "env(keyboard-inset-height)"`(Rust `.mb_keyboard()`, `.mt_safe_area()`, ...).

| 키 | 타입 | Rust | 설명 |
|---|---|---|---|
| `margin` | `DimensionValue \| EnvValue` | `.m(…)`, `.m_4()` | 네 면 모두. |
| `marginHorizontal` | `DimensionValue \| EnvValue` | `.mx(…)` | 왼쪽과 오른쪽. |
| `marginVertical` | `DimensionValue \| EnvValue` | `.my(…)` | 위쪽과 아래쪽. |
| `marginTop` | `DimensionValue \| EnvValue` | `.mt(…)` | 위쪽. |
| `marginRight` | `DimensionValue \| EnvValue` | `.mr(…)` | 오른쪽. |
| `marginBottom` | `DimensionValue \| EnvValue` | `.mb(…)` | 아래쪽. |
| `marginLeft` | `DimensionValue \| EnvValue` | `.ml(…)` | 왼쪽. |
| `marginStart` | `DimensionValue` | `.ms(…)` | Inline start: 왼쪽에서 오른쪽 레이아웃에서는 왼쪽, 오른쪽에서 왼쪽 레이아웃에서는 오른쪽. |
| `marginEnd` | `DimensionValue` | `.me(…)` | Inline end: `marginStart`의 반대쪽. |

### Padding

물리적 키(`paddingStart` / `paddingEnd` 제외)는 `EnvValue`도 받습니다: `paddingTop: "env(safe-area-inset-top)"`, `paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)"`(Rust `.pt_safe_area()`, `.pb_safe_area_plus(px(16.0))`, `.pb_keyboard()`, ...). Padding은 최소 0입니다.

| 키 | 타입 | Rust | 설명 |
|---|---|---|---|
| `padding` | `LengthValue \| EnvValue` | `.p(…)`, `.p_4()` | 네 면 모두. |
| `paddingHorizontal` | `LengthValue \| EnvValue` | `.px(…)` | 왼쪽과 오른쪽. |
| `paddingVertical` | `LengthValue \| EnvValue` | `.py(…)` | 위쪽과 아래쪽. |
| `paddingTop` | `LengthValue \| EnvValue` | `.pt(…)` | 위쪽. |
| `paddingRight` | `LengthValue \| EnvValue` | `.pr(…)` | 오른쪽. |
| `paddingBottom` | `LengthValue \| EnvValue` | `.pb(…)` | 아래쪽. |
| `paddingLeft` | `LengthValue \| EnvValue` | `.pl(…)` | 왼쪽. |
| `paddingStart` | `LengthValue` | `.ps(…)` | Inline start: 왼쪽에서 오른쪽 레이아웃에서는 왼쪽, 오른쪽에서 왼쪽 레이아웃에서는 오른쪽. |
| `paddingEnd` | `LengthValue` | `.pe(…)` | Inline end: `paddingStart`의 반대쪽. |

## ViewStyle

뷰가 그리는 모든 것. `LayoutStyle`의 모든 키도 함께 적용됩니다.

### Background

| 키 | 타입 | Rust | 설명 |
|---|---|---|---|
| `backgroundColor` | `ColorValue \| AnimatedNode` | `.bg(color)`, `.bind_background(&node)` | 채우기 색상. 네이티브 애니메이션 색상을 받습니다. |
| `backgroundImage` | `string` | `.bg_linear(angle)`, `.bg_radial()`, `.bg_conic()`와 `.gradient_from` / `_via` / `_to` | 배경색 위에 그려지는 CSS 그라디언트: `linear-gradient(...)`, `radial-gradient(...)`, `conic-gradient(...)`, 쉼표로 구분한 여러 개. |

```rust tabs
view().h(px(120.0)).rounded(px(16.0)).bg_linear(deg(135.0)).gradient_from(rgb(0x6366f1)).gradient_to(rgb(0xec4899))
```

```tsx tabs
<View style={{ height: 120, borderRadius: 16, backgroundImage: "linear-gradient(135deg, #6366f1, #ec4899)" }} />
```
<a id="borders"></a>

### 테두리

| 키 | 타입 | Rust | 설명 |
|---|---|---|---|
| `borderWidth` | `number` | `.border(w)`, `.border_1()`, `.border_2()` | 네 변 모두의 너비. |
| `borderTopWidth` | `number` | `.border_t(w)` | 위쪽 변. |
| `borderRightWidth` | `number` | `.border_r(w)` | 오른쪽 변. |
| `borderBottomWidth` | `number` | `.border_b(w)` | 아래쪽 변. |
| `borderLeftWidth` | `number` | `.border_l(w)` | 왼쪽 변. |
| `borderStartWidth` | `number` | `.border_s(w)` | 인라인 시작 쪽 변 (왼쪽에서 오른쪽으로 배치하는 레이아웃에서는 왼쪽, 오른쪽에서 왼쪽으로 배치하는 레이아웃에서는 오른쪽). |
| `borderEndWidth` | `number` | `.border_e(w)` | 인라인 끝 쪽 변. |
| `borderColor` | `ColorValue \| AnimatedNode` | `.border_color(c)`, `.bind_border_color(&node)` | 네 변 모두의 색상. 네이티브 애니메이션 색상을 받습니다. |
| `borderTopColor` | `ColorValue` | `.border_t_color(c)` | 위쪽 변. |
| `borderRightColor` | `ColorValue` | `.border_r_color(c)` | 오른쪽 변. |
| `borderBottomColor` | `ColorValue` | `.border_b_color(c)` | 아래쪽 변. |
| `borderLeftColor` | `ColorValue` | `.border_l_color(c)` | 왼쪽 변. |
| `borderStartColor` | `ColorValue` | `.border_s_color(c)` | 인라인 시작 쪽 변. |
| `borderEndColor` | `ColorValue` | `.border_e_color(c)` | 인라인 끝 쪽 변. |
| `borderStyle` | `"solid" \| "dashed" \| "dotted" \| "none" \| "hidden"` | `.border_solid()`, `.border_dashed()`, `.border_dotted()`, `.border_none()` | 선 스타일. 기본값은 `"solid"`. `"none"`, `"hidden"` 모두 너비를 먼저 지정했든 나중에 지정했든 관계없이, CSS와 마찬가지로 테두리를 그리지도 레이아웃에 반영하지도 않습니다. |

너비가 지정되었지만 색상을 지정하는 곳이 없는 변은 CSS의 `currentColor`처럼 텍스트 색상으로 그려집니다. 파란색 테두리가 그려지는 예: `{ borderWidth: 1, color: "#2563eb" }`. 아웃라인도 같은 방식으로 텍스트 색상을 사용합니다.

<a id="corners"></a>

### 모서리

| 키 | 타입 | Rust | 설명 |
|---|---|---|---|
| `borderRadius` | `number` | `.rounded(r)`, `.rounded_lg()` | 네 모서리 모두의 반지름. |
| `borderTopLeftRadius` | `number` | `.rounded_tl(r)` | 왼쪽 위 모서리. |
| `borderTopRightRadius` | `number` | `.rounded_tr(r)` | 오른쪽 위 모서리. |
| `borderBottomRightRadius` | `number` | `.rounded_br(r)` | 오른쪽 아래 모서리. |
| `borderBottomLeftRadius` | `number` | `.rounded_bl(r)` | 왼쪽 아래 모서리. |
| `borderTopStartRadius` | `number` | `.rounded_ss(r)` | 인라인 시작 쪽의 위쪽 모서리. |
| `borderTopEndRadius` | `number` | `.rounded_se(r)` | 인라인 끝 쪽의 위쪽 모서리. |
| `borderBottomStartRadius` | `number` | `.rounded_es(r)` | 인라인 시작 쪽의 아래쪽 모서리. |
| `borderBottomEndRadius` | `number` | `.rounded_ee(r)` | 인라인 끝 쪽의 아래쪽 모서리. |
| `borderCurve` | `"circular" \| "continuous"` | `.border_curve(curve)` | `"continuous"`: iOS 앱 아이콘처럼 곡률이 가장자리로 부드럽게 이어지는 모서리. 박스가 너무 작은 곳에서는 곡선이 원형으로 대체되므로 알약 모양은 알약 모양 그대로 유지됩니다. 두 플랫폼 모두에서 동작합니다. |

<a id="outline"></a>

### 아웃라인

아웃라인은 테두리 바깥쪽에 그려지며 레이아웃에서 공간을 차지하지 않습니다.

| 키 | 타입 | Rust | 설명 |
|---|---|---|---|
| `outlineWidth` | `number` | `.outline(w)` | 선 너비. |
| `outlineColor` | `ColorValue` | `.outline_color(c)` | 선 색상. 기본값은 텍스트 색상. |
| `outlineStyle` | `"solid" \| "dashed" \| "dotted" \| "none" \| "hidden"` | `.outline_dashed()`, `.outline_dotted()`, `.outline_none()` | 선 스타일. |
| `outlineOffset` | `number` | `.outline_offset(o)` | 테두리 가장자리로부터의 거리. 음수 값은 안쪽으로 이동합니다. |

<a id="shadows"></a>

### 그림자

뷰는 CSS의 `boxShadow`로 그림자를 드리웁니다. 여러 레이어, 스프레드 그림자, 인셋 그림자를 지원합니다. 트랜지션으로 애니메이션할 수 있습니다 (`transitionProperty: "boxShadow"`).

| 키 | 타입 | Rust | 설명 |
|---|---|---|---|
| `boxShadow` | `string \| BoxShadowLayer[]` | `.shadow([BoxShadow { … }])`, `.shadow_md()`, `.shadow_color(c)` | CSS `box-shadow`: 오프셋, 블러, 스프레드, 색상을 지정하며, 여러 레이어는 쉼표로 구분하고 안쪽 그림자에는 `inset`을 사용합니다. 또는 레이어를 숫자로 지정합니다: `[{ x, y, blur, spread, color, inset }]` (`x`와 `y`만 필수). 색상이 없는 레이어는 CSS의 `currentColor`처럼 텍스트 색상으로 그려집니다. `.shadow_color(c)`은 프리셋 또는 `.shadow(…)`의 레이어 색을 바꿉니다. |

```rust tabs
view().p_4().rounded(px(12.0)).bg(white()).shadow([
    BoxShadow { offset_y: px(1.0), blur: px(2.0), color: rgba(0x0000000f).into(), ..BoxShadow::default() },
    BoxShadow { offset_y: px(8.0), blur: px(24.0), spread: px(-4.0), color: rgba(0x0000001f).into(), ..BoxShadow::default() },
])
```

```tsx tabs
<View style={{ padding: 16, borderRadius: 12, backgroundColor: "#fff",
  boxShadow: "0 1px 2px rgb(0 0 0 / 0.06), 0 8px 24px -4px rgb(0 0 0 / 0.12)" }} />
```

> [!NOTE]
> Android에서 그림자에는 배경이 필요합니다. 배경이 투명한 뷰(예: 아무것도 없는 위의 텍스트)는 그림자를 드리우지 않습니다. Android의 머티리얼 그림자를 사용하려면 스타일 대신 `android={{ elevation }}` prop을 사용하세요.

<a id="opacity-visibility-and-overflow"></a>

### 불투명도, 가시성, 오버플로

| 키 | 타입 | Rust | 설명 |
|---|---|---|---|
| `opacity` | `number \| AnimatedNode` | `.opacity(o)`, `.bind_opacity(&value)` | 0(보이지 않음)부터 1까지. 네이티브 애니메이션 값을 받습니다. |
| `visibility` | `"visible" \| "hidden" \| "collapse"` | | 숨겨진 뷰는 레이아웃에서 자리를 유지합니다 (`display: "none"`와 다름). |
| `overflow` | `"visible" \| "hidden"` | `.overflow_hidden()` | `"hidden"`은 자식을 뷰의 경계(및 모서리)에 맞춰 잘라냅니다. |
| `backfaceVisibility` | `"visible" \| "hidden"` | `.backface_hidden()`, `.backface_visible()` | `"hidden"`: 3D 회전으로 뒤집혀 있는 동안 보이지 않습니다. |
| `verticalAlign` | `"baseline" \| "text-top" \| "text-bottom" \| "middle"` | `.align_baseline()`, `.align_text_top()`, `.align_text_bottom()`, `.align_middle()` | `<Text>` 안의 뷰나 이미지가 줄에서 놓이는 위치로, CSS의 `vertical-align`와 같습니다. 아래쪽을 베이스라인에 맞추거나(기본값), 위쪽이나 아래쪽을 텍스트 폰트의 위쪽이나 아래쪽에 맞추거나, 가운데를 베이스라인 위 x-height의 절반 높이에 맞춥니다. 줄은 이를 담을 수 있도록 늘어납니다. |

<a id="transforms"></a>

### 트랜스폼

트랜스폼은 CSS의 방식을 따릅니다. `translate`, `rotate`, `scale` 속성과 `transform`이 이 순서대로 합성됩니다. 각각이 독립된 속성이므로, 스타일의 `scale`은 클래스의 `scale-*`을 대체하면서 `rotate-*`은 유지하고, 스타일의 `transform`은 클래스의 트랜스폼 함수(`rotate-x-*`, `skew-*`)를 대체합니다.

| 키 | 타입 | Rust | 설명 |
|---|---|---|---|
| `translate` | `string \| number \| AnimatedNode \| [x, y]` | `.translate_x(…)`, `.translate_y(…)`; `.bind_translate_x(&v)`, `.bind_translate_y(&v)` | CSS의 `translate`: x, 그다음 y (`"10px 20px"`; 퍼센트는 뷰 자신의 크기 기준, `"-50% 0"`). 숫자는 x 방향의 포인트입니다. `[x, y]`은 축마다 숫자, 문자열(`"50%"`, `"10px"`) 또는 애니메이션 값을 받으며, 애니메이션 값 하나만 지정하면 x 방향으로 이동합니다. |
| `rotate` | `string \| number \| AnimatedNode` | `.rotate(deg(…))`; `.bind_rotate(&v)` | CSS의 `rotate`: `"45deg"`, `"0.5turn"`, 또는 축을 기준으로 한 `"x 90deg"`. 숫자와 애니메이션 값은 z축을 기준으로 시계 방향의 각도(도)입니다. |
| `scale` | `string \| number \| AnimatedNode \| [x, y]` | `.scale(f)`, `.scale_x(f)`, `.scale_y(f)`; `.bind_scale(&v)` | CSS의 `scale`: `1.5`, `"150%"`, x와 y (`"1 2"`). 애니메이션 값은 두 축 모두를 확대/축소하며, `[x, y]`은 축마다 숫자 또는 애니메이션 값을 받습니다. |
| `transform` | `string \| TransformStep[]` | `.rotate_x(…)`, `.rotate_y(…)`, `.skew_x(…)`, `.skew_y(…)`, `.transform_none()`; 애니메이션 단계: `.bind_transform(kind, &v)`, `.bind_motion(&m)` (모든 스타일 트랜스폼 뒤에 적용) | CSS의 `transform`: `"translateX(10px) rotate(45deg) scale(1.5)"` 또는 `"none"`. 함수: `translate()`, `translateX()`, `translateY()`, `scale()`, `scaleX()`, `scaleY()`, `rotate()` / `rotateZ()`, `rotateX()`, `rotateY()`, `skew()`, `skewX()`, `skewY()`, `perspective()`. 길이는 `px`을 받고(이동은 뷰 자신의 크기 기준인 `%`도 가능), 각도는 `deg`, `rad` 또는 `turn`를 받습니다. 또는 양이 애니메이션 값일 수 있는 단계의 목록으로 지정할 수도 있으며, 애니메이션되는 3D 회전(`[{ perspective: 800 }, { rotateY: angle }]`)이나 모션의 채널(`m.transform`)처럼 문자열로 표현할 수 없는 것을 담습니다. 스타일의 `transform`은 두 형태 중 하나이므로, 애니메이션 단계 앞의 perspective는 목록의 한 단계가 됩니다. `translate`, `rotate`, `scale` 뒤에 적용됩니다. |
| `transformOrigin` | `string \| (number \| string)[]` | `.transform_origin(…)`, `.origin_top_left()`, ... | 트랜스폼이 작용하는 기준점: 키워드, 퍼센트, 길이 (`"top left"`, `"50% 0"`, `[10, 20]`). 기본값은 중심. |

`TransformStep`은 키가 하나인 객체이며, 목록의 순서대로 적용됩니다.

| 단계 | 값 | 네이티브 애니메이션 |
|---|---|---|
| `translateX`, `translateY` | `number` (포인트) | 예 |
| `scale`, `scaleX`, `scaleY` | `number` (배율) | 예 |
| `rotate`, `rotateZ`, `rotateX`, `rotateY` | `number` (도) 또는 `string` (`"45deg"`, `"0.5rad"`) | 예 |
| `skewX`, `skewY` | `number` (도) 또는 `string` | 아니요 |
| `perspective` | `number` (포인트) | 아니요 |

```rust tabs
view().perspective(px(600.0)).child(view().rotate_y(deg(20.0)).scale(0.95))
```

```tsx tabs
<View style={{ transform: "perspective(600px) rotateY(20deg) scale(0.95)" }} />
```

애니메이션 값은 `translate`, `rotate`, `scale`를 직접 구동하며, `transform` 목록의 단계도 구동합니다.

```tsx
const x = createAnimatedValue(0);
const angle = createAnimatedValue(0);

<View style={{ translate: [x, 0], rotate: angle }} />
<View style={{ transform: [{ perspective: 800 }, { rotateY: angle }] }} />
```

> [!NOTE]
> Android는 skew를 그리지 않습니다. `skew()`, `skewX()`, `skewY()`을 지정해도 Android에서는 뷰가 기울어지지 않습니다.

<a id="filters-and-blending"></a>

### 필터와 블렌딩

| 키 | 타입 | Rust | 설명 |
|---|---|---|---|
| `filter` | `string` | `.blur(r)`, `.brightness(…)`, `.contrast(…)`, `.grayscale(…)`, `.hue_rotate(…)`, `.invert(…)`, `.saturate(…)`, `.sepia(…)` | 뷰와 그 내용에 적용하는 CSS 필터: `brightness()`, `contrast()`, `grayscale()`, `hue-rotate()`, `invert()`, `saturate()`, `sepia()`, `opacity()`, `blur()`, `drop-shadow()`. |
| `backdropFilter` | `string` | `.backdrop_blur(r)`, `.backdrop_brightness(…)`, ... | 뷰 뒤에 있는 것에 적용하는 CSS 필터. 예를 들어 `"blur(10px)"`는 젖빛 유리 효과를 냅니다. |
| `maskImage` | `string` | | 알파 값으로 뷰가 얼마나 그려질지 결정하는 CSS 그레이디언트로, 불투명한 곳은 완전히 그려지고 투명한 곳은 전혀 그려지지 않습니다: `linear-gradient(...)`, `radial-gradient(...)`, `conic-gradient(...)`. 백드롭 필터를 포함해 뷰가 그리는 모든 것을 마스킹합니다. |
| `glassEffect` | `"none" \| "regular" \| "clear"` | `.glass_effect(GlassEffect::Regular)` | iOS 26과 macOS 26 이상에서 뷰 내용 뒤에 표시되는 Liquid Glass. `"regular"`는 표준 머티리얼을 사용하고, `"clear"`는 배경에서 가져오는 색이 더 적습니다. `"none"`가 기본값입니다. 이전 iOS 버전과 다른 플랫폼에서 표시되는 블러가 필요하면 `backdropFilter`와 함께 사용하세요. |
| `mixBlendMode` | `"normal" \| "multiply" \| "screen" \| "overlay" \| "darken" \| "lighten" \| "color-dodge" \| "color-burn" \| "hard-light" \| "soft-light" \| "difference" \| "exclusion" \| "hue" \| "saturation" \| "color" \| "luminosity" \| "plus-darker" \| "plus-lighter"` | `.mix_blend_mode(mode)` | 뷰가 뒤에 있는 것과 블렌딩되는 방식. |

> [!WARNING]
> 플랫폼별 제한 사항:
> - iOS는 뷰에 `opacity()`, 1 이하의 `brightness()`, `drop-shadow()`만 적용합니다. `<Image>`는 모든 색상 필터와 `blur()`을 받으며, 이미지가 디코딩될 때 적용됩니다.
> - iOS의 `backdropFilter` 블러는 시스템 머티리얼을 일부 비율로 사용하므로 정확한 반지름에 대한 근사치입니다.
> - Android에서 `blur()`, `drop-shadow()`, `backdropFilter`에는 API 31이 필요하며, 그보다 낮으면 색상 필터만 적용됩니다. 블렌드 모드에는 API 29가 필요합니다.

<a id="transitions"></a>

### 트랜지션

트랜지션이 지정된 속성이 변경되면(새 스타일, 클래스, 또는 `active:` 같은 변형으로 인해) 플랫폼이 이를 네이티브로 애니메이션합니다. 애니메이션 중에는 JS가 실행되지 않습니다.

| 키 | 타입 | Rust | 설명 |
|---|---|---|---|
| `transitionProperty` | `string` | `.transition()`, `.transition_all()`, `.transition_colors()`, `.transition_opacity()`, `.transition_shadow()`, `.transition_transform()`, `.transition_none()` | 애니메이션할 속성을 쉼표로 구분한 목록: `"all"`, `"colors"` (`color`, `backgroundColor`, `borderColor`, ...), `"opacity"`, `"transform"` (모든 트랜스폼 속성), `"boxShadow"`, `"borderRadius"`, `"borderWidth"` 또는 `"none"`. |
| `transitionDuration` | `number \| "${number}ms" \| "${number}s"` | `.duration(ms)` | 밀리초 단위의 숫자, 또는 `"150ms"` / `"0.2s"`. |
| `transitionDelay` | `number \| "${number}ms" \| "${number}s"` | `.delay(ms)` | 트랜지션이 시작되기 전의 지연 시간. |
| `transitionTimingFunction` | `"linear" \| "ease" \| "ease-in" \| "ease-out" \| "ease-in-out" \| "cubic-bezier(...)"` | `.ease_linear()`, `.ease_in()`, `.ease_out()`, `.ease_in_out()`, `.ease_bezier(…)` | 이징 곡선. |

```rust tabs
view()
    .on_press(move || open.update(|o| *o = !*o))
    .h(move || px(if open.get() { 160.0 } else { 56.0 }))
    .opacity(move || if open.get() { 1.0 } else { 0.8 })
    .transition()
    .duration(200.0)
```

```tsx tabs
<View
  onPress={() => open.set(!open())}
  style={{ height: open() ? 160 : 56, opacity: open() ? 1 : 0.8,
    transitionProperty: "opacity, transform", transitionDuration: 200 }}
/>
```

<a id="keyframe-animations"></a>

### 키프레임 애니메이션

네이티브로 실행되는 내장 키프레임 애니메이션입니다 (Tailwind의 `animate-*`).

| 키 | 타입 | Rust | 설명 |
|---|---|---|---|
| `animationName` | `"none" \| "spin" \| "ping" \| "pulse" \| "bounce"` | `.animate_spin()`, `.animate_ping()`, `.animate_pulse()`, `.animate_bounce()`, `.animate_none()` | 애니메이션. |
| `animationDuration` | `number \| "${number}ms" \| "${number}s"` | `.animation(KeyframeAnimation { … })` | 한 번 반복하는 길이. |
| `animationDelay` | `number \| "${number}ms" \| "${number}s"` | `.animation(KeyframeAnimation { … })` | 첫 번째 반복 전의 지연 시간. |
| `animationTimingFunction` | `"linear" \| "ease" \| "ease-in" \| "ease-out" \| "ease-in-out" \| "cubic-bezier(...)"` | `.animation(KeyframeAnimation { … })` | 이징 곡선. |
| `animationIterationCount` | `number \| "infinite"` | `.animation(KeyframeAnimation { … })` | 실행 횟수. |

값, 제스처, 스프링으로 구동되는 애니메이션에는 대신 [`nsh`의 애니메이션 API](./nsh.md#animation)를 사용하세요.

<a id="pointer-and-selection"></a>

### 포인터와 선택

| 키 | 타입 | Rust | 설명 |
|---|---|---|---|
| `cursor` | `"auto" \| "default" \| "pointer" \| "text" \| "grab" \| "grabbing" \| "not-allowed" \| ...` (모든 CSS 커서 키워드와 `"none"`) | `.cursor(Cursor)`, `.cursor_pointer()` | 포인터(iPad 트랙패드, Mac Catalyst, 데스크톱)에서 뷰 위에 표시되는 포인터 모양. 대각선 리사이즈 키워드는 각자의 축을 유지합니다: `nwse-resize` / `nw-resize` / `se-resize` (`Cursor::NwseResize`)와 `nesw-resize` / `ne-resize` / `sw-resize` (`Cursor::NeswResize`). Windows, Linux, Android, 웹, GPUI는 대각선 커서를 표시하고, AppKit은 macOS 15 이상에서 대각선 커서를 사용하며 macOS 14에서는 펼친 손 모양을 사용합니다. UIKit은 iPad와 Mac Catalyst에서 포인터 효과를 사용합니다. |
| `pointerEvents` | `"auto" \| "none" \| "box-none" \| "box-only"` | `.pointer_events(PointerEvents::BoxNone)` | 뷰와 그 안의 뷰가 받는 터치(`pointer-events-none`, `pointer-events-auto`). `"none"`: 없음. 안의 뷰도 `"auto"`를 따로 지정하지 않는 한 받지 않으며, CSS처럼 상속됩니다. `"box-none"`: 뷰 자체는 받지 않고 안의 뷰가 각자 받습니다. `"box-only"`: 뷰 자체는 받고 안의 뷰는 받지 않습니다 (둘 다 React Native의 방식이며, 뷰에만 해당). 기본값은 `"auto"`. [터치와 제스처](../docs/touch-and-gestures.md#pointerevents)를 참고하세요. |
| `userSelect` | `"auto" \| "none" \| "text"` | `.select_text()`, `.select_none()` | `<Text>`를 선택하고 복사할 수 있는지(`"text"`, `select-text`) 여부(`"none"`, `select-none`). 뷰의 값은 그 안에서 값을 지정하지 않은 텍스트에 적용됩니다. 기본값인 `"auto"` (`select-auto`)는 주변 뷰에 맡기고, 그렇지 않으면 플랫폼에 맡깁니다. [텍스트](../elements/text.md)를 참고하세요. |

<a id="svg-paint"></a>

### SVG 페인트

SVG 도형의 CSS 페인트 속성으로, 브라우저에서와 마찬가지로 모든 요소가 받을 수 있고 그 안의 요소가 상속합니다.
Rust 컴포넌트가 캔버스에 그리는 것을 칠합니다.

| 키 | 타입 | Rust | 설명 |
|---|---|---|---|
| `fill` | `"none" \| "currentColor" \| ColorValue` | `.fill_color(c)`, `.fill_none()`, `.fill_current()` | 도형을 채우는 것. `currentColor`는 요소의 텍스트 색상입니다. |
| `stroke` | `"none" \| "currentColor" \| ColorValue` | `.stroke_color(c)`, `.stroke_none()`, `.stroke_current()` | 도형의 윤곽선을 칠하는 것. |
| `strokeWidth` | `number \| string` | `.stroke_width(w)` | 해당 윤곽선의 너비로, 길이 값입니다 (기본값 1). |
| `strokeDasharray` | `number \| string` | — | 해당 윤곽선을 따라 나타나는 대시와 간격: 공백이나 쉼표로 구분한 길이 (`"4 2"`). 홀수 개의 목록은 반복되며, 또는 `"none"`. |

## TextStyle

텍스트 스타일은 `<Text>`와 `<Input>`에 적용됩니다. CSS처럼 상속도 됩니다. 뷰에 지정한 텍스트 속성은 그 안의 텍스트와 입력에 전달되고, 중첩된 `<Text>` span은 부모 텍스트에서 상속합니다. `ViewStyle`의 모든 키도 함께 적용됩니다. [텍스트](../docs/text.md)를 참고하세요.

<a id="font"></a>

### 폰트

| 키 | 타입 | Rust | 설명 |
|---|---|---|---|
| `color` | `ColorValue \| AnimatedNode` | `.text_color(c)`, `.bind_color(&node)` | 텍스트 색상. 네이티브 애니메이션 색상을 받습니다. 색상을 지정하지 않은 테두리와 아웃라인의 색상이기도 합니다. |
| `fontSize` | `number` | `.text_size(s)`, `.text_sm()`, `.text_lg()`, ... | 포인트 단위의 크기. |
| `fontWeight` | `"normal" \| "bold" \| number \| "${number}"` | `.font_weight(FontWeight::SEMIBOLD)` | `"normal"` (400), `"bold"` (700) 또는 100–900. |
| `fontFamily` | `string` | `.font_family(name)` | 시스템 폰트 패밀리, 가져온 폰트가 평가되는 이름(`import Inter from "./Inter.ttf"`), 또는 선호하는 순서대로 나열한 목록 (`"Brand, 'Noto Sans SC', sans-serif"`). [폰트](../docs/fonts.md#fallback-lists)를 참고하세요. |
| `fontStyle` | `"normal" \| "italic"` | `.italic()` | 이탤릭. |
| `fontVariant` | `FontVariantName[] \| string` | `.small_caps()`, `.oldstyle_nums()`, `.lining_nums()`, `.tabular_nums()`, `.proportional_nums()` | OpenType 숫자 및 문자 형태로, 목록(`["tabular-nums"]`) 또는 공백으로 구분한 CSS 이름(`"tabular-nums small-caps"`)으로 지정합니다. `tabular-nums`은 숫자의 너비를 동일하게 유지하므로 카운터와 타이머에 유용합니다. |
<a id="spacing-and-alignment"></a>

### 간격과 정렬

| Key | Type | Rust | Description |
|---|---|---|---|
| `lineHeight` | `number` | `.line_height(h)` | 줄 높이(포인트 단위). |
| `letterSpacing` | `number` | `.letter_spacing(s)` | 문자 사이의 추가 간격(포인트 단위). |
| `textAlign` | `"auto" \| "left" \| "center" \| "right" \| "justify" \| "start" \| "end"` | `.text_left()`, `.text_center()`, `.text_right()`, `.text_justify()` | 가로 정렬. `"left"`와 `"right"`는 오른쪽에서 왼쪽으로 쓰는 레이아웃에서도 각자의 쪽을 유지하고, `"start"`와 `"end"`는 방향을 따릅니다. |
| `writingDirection` | `"auto" \| "ltr" \| "rtl"` | `.writing_direction(d)` | 텍스트의 기본 방향. `"auto"`는 콘텐츠에서 방향을 가져옵니다. |
| `textTransform` | `"none" \| "uppercase" \| "lowercase" \| "capitalize"` | `.uppercase()`, `.lowercase()`, `.capitalize()`, `.normal_case()` | 대소문자 변환. |

> [!TIP]
> Tailwind의 `leading-*` 및 `tracking-*` 클래스는 줄 높이를 글꼴 크기의 배수로, 글자 간격을 `em` 단위로 설정하므로 `text-*` 크기에 맞춰 함께 조정됩니다.

<a id="lines-and-overflow"></a>

### 줄 수와 오버플로

| Key | Type | Rust | Description |
|---|---|---|---|
| `numberOfLines` | `number` | `.number_of_lines(n)`, `.truncate()` | `<Text>`가 표시하는 최대 줄 수(CSS의 `line-clamp`, `line-clamp-*`). 기본값인 `0`(`line-clamp-none`)은 모든 줄을 표시합니다. `truncate`은 말줄임표로 잘린 한 줄입니다. |
| `textOverflow` | `"ellipsis" \| "clip" \| "ellipsis-start" \| "ellipsis-middle"` | `.text_overflow(EllipsizeMode::Middle)` | 줄 수가 제한된 `<Text>`를 자르는 방식: 끝에 말줄임표 표시(`"ellipsis"`, `text-ellipsis`, 기본값), 잘라냄(`"clip"`, `text-clip`), 또는 시작이나 가운데에 말줄임표 표시(파일 경로용). |

<a id="decoration"></a>

### 장식

| Key | Type | Rust | Description |
|---|---|---|---|
| `textDecorationLine` | `"none" \| "underline" \| "line-through" \| "underline line-through"` | `.underline()`, `.line_through()`, `.no_underline()` | 텍스트와 함께 그려지는 선. |
| `textDecorationColor` | `ColorValue` | `.text_decoration_color(c)` | 선의 색상(기본값은 텍스트 색상). |
| `textDecorationStyle` | `"solid" \| "double" \| "dotted" \| "dashed" \| "wavy"` | `.text_decoration_solid()`, `_double()`, `_dotted()`, `_dashed()`, `_wavy()` | 선 스타일. |
| `textDecorationThickness` | `number \| "auto" \| "from-font"` | `.text_decoration_thickness(t)` | 선 두께. |
| `textUnderlineOffset` | `number \| "auto"` | `.underline_offset(o)` | 기준선에서 밑줄까지의 거리. |

<a id="placeholder-caret-and-selection"></a>

### 플레이스홀더, 캐럿, 선택 영역

`placeholderColor`와 `caretColor`은 `<Input>`의 스타일인 `InputStyle`에 속하고, `selectionColor`는 선택 가능한 텍스트도 사용하므로 `TextStyle`에 속합니다.

| Key | Type | Rust | Description |
|---|---|---|---|
| `placeholderColor` | `ColorValue` | input의 `.placeholder_color(c)` | `<Input>` 플레이스홀더의 색상(`placeholder:text-*`). |
| `textAlignVertical` | `"auto" \| "top" \| "center" \| "bottom"` | | 상자보다 짧은 텍스트가 놓이는 위치(높이가 지정된 `<Text>`). |
| `selectionColor` | `ColorValue` | input 또는 text의 `.selection_color(c)` | `<Input>` 또는 선택 가능한 `<Text>`의 선택 영역 강조 표시와 핸들(`selection:bg-*`). 기본값은 플랫폼의 강조 색상입니다. iOS에서는 `caretColor`이 설정되지 않은 경우 input의 캐럿에도 적용됩니다(UIKit은 둘을 하나의 색상으로 틴트합니다). |
| `caretColor` | `ColorValue` | input의 `.caret_color(c)` | `<Input>`의 캐럿(`caret-*`). 설정하지 않으면 플랫폼 기본값을 사용합니다. |

<a id="text-shadow"></a>

### 텍스트 그림자

| Key | Type | Rust | Description |
|---|---|---|---|
| `textShadow` | `string \| TextShadowLayer[]` | `.text_shadow([TextShadow { … }])`, `.text_shadow_sm()`, `.text_shadow_color(c)` | CSS의 `text-shadow`: 오프셋, 블러, 색상(`"0 1px 2px rgb(0 0 0 / 0.3)"`) 또는 숫자로 표현한 레이어(`[{ x, y, blur, color }]`). 여러 레이어는 가장 넓은 레이어로 그려지고, 색상이 없는 레이어는 텍스트 색상으로 그려집니다. `"none"`. |

```rust tabs
text("Title").text_shadow([TextShadow {
    offset_y: px(1.0),
    radius: px(2.0),
    color: rgba(0x0000004d).into(),
    ..TextShadow::default()
}])
```

```tsx tabs
<Text style={{ textShadow: "0 1px 2px rgb(0 0 0 / 0.3)" }}>Title</Text>
```

> [!NOTE]
> iOS는 `<Text>`에서 그라데이션(`backgroundImage`)이나 안쪽 박스 그림자를 그리지 않습니다.

## ImageStyle

`ViewStyle`의 모든 키와 다음 키를 포함합니다.

| Key | Type | Rust | Description |
|---|---|---|---|
| `tintColor` | `ColorValue` | image의 `.tint_color(c)` | 템플릿 이미지의 색을 바꿉니다(불투명한 모든 픽셀이 이 색상을 가짐). 단색 아이콘에 사용합니다. |
| `objectFit` | `"fill" \| "contain" \| "cover" \| "none" \| "scale-down"` | `.object_fit(ResizeMode::Contain)` | CSS의 `object-fit`: 이미지나 비디오가 상자에 맞춰지는 방식. `"cover"`는 상자를 채우고 넘치는 부분을 자르며, `"contain"`는 상자 안에 맞추고, `"fill"`는 늘려서 채우며, `"none"`는 원래 크기를 유지하고, `"scale-down"`는 `"none"` 또는 `"contain"` 중 더 작은 쪽입니다. 이미지는 기본적으로 상자를 덮고, 비디오는 상자 안에 포함됩니다. |
| `objectPosition` | `string` | image의 `.object_position(p)`, `.object_top()`, ... | `objectFit`가 크기를 정한 뒤 이미지가 상자 안에서 놓이는 위치로, CSS의 `object-position`처럼 키워드, 백분율, 길이를 사용합니다(`"top"`, `"left bottom"`, `"25% 75%"`, `"right 10px bottom 20%"`). 상자를 덮는 이미지는 이 위치를 기준으로 잘립니다. 기본값은 가운데입니다. |

`objectFit`은 `<Video>`에도 적용됩니다. [image](../elements/image.md)와 [video](../elements/video.md)를 참고하세요.

<a id="props-that-look-like-styles"></a>

## 스타일처럼 보이는 prop

Android의 머티리얼 그림자는 스타일 옆에 설정하는 플랫폼 prop입니다.

| Setting | Prop | Rust | Class |
|---|---|---|---|
| 머티리얼 그림자(Android) | `android={{ elevation }}` | `.elevation(e)` | |

<a id="related"></a>

## 관련 문서

- [Styling](../docs/styling.md): `style`, `class`, 상속 및 우선순위.
- [Tailwind reference](./tailwind-reference.md): 지원되는 모든 유틸리티와 variant.
- [Layout](../docs/layout.md): flexbox와 grid 실전 활용.
- [view](../elements/view.md), [text](../elements/text.md), [image](../elements/image.md): 이러한 스타일이 적용되는 요소.

`width`, `height`, `flexBasis`은 Taffy가 계산하는 `"min-content"`, `"max-content"`, `"fit-content"`도 허용합니다.
