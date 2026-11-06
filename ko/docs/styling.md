---
title: "스타일링"
description: "Rust의 타입 지정 스타일 메서드와 TSX의 style prop - flexbox, grid 및 CSS 효과 - 색상, 테두리, 모서리, 그림자, 그라디언트, 필터, 변환, 트랜지션, 그리고 플랫폼별 차이점."
order: 32
group: ui
demo: guide-styling
source_hash: c3b673df4846a333
---

# 스타일링

모든 요소는 두 가지 방식으로 작성할 수 있는 동일한 네이티브 스타일로 스타일링됩니다. Rust에서는 요소에 체이닝하는 타입이 지정된 메서드(`.p_4()`, `.rounded(px(12.0))`, `.bg(color)`)를 사용하고, TSX에서는 camelCase 속성으로 이루어진 `style` prop 또는 [Tailwind 클래스](./tailwind.md)를 사용합니다. 두 방식 모두 박스 섀도, 그라디언트, 필터, 아웃라인, 트랜지션, 그리드 같은 CSS 기능을 포함하며, 변경된 속성만 네이티브 뷰로 전송됩니다.

세 가지 방식은 하나의 속성 집합을 작성하며 의미도 같습니다. 이름은 CSS의 이름을 따르고(일부는 앱에서 흔히 쓰는 더 쉬운 이름을 사용합니다. 예: `paddingHorizontal`, `marginStart`, `numberOfLines`), CSS 값(색상, 그라디언트, 필터, 섀도, 트랜스폼, 정렬 키워드)과 Tailwind 유틸리티는 웹에서와 같은 의미를 가집니다. 각 Rust 메서드와 유틸리티는 Tailwind CSS 4가 생성하는 것과 같은 속성을 설정하므로 웹에서 알던 지식이 그대로 적용됩니다. `paddingLeft`는 `padding-left`와 `pl-4`이고, `boxShadow`는 `box-shadow`이며, `display: "flex"`는 `flex` 클래스처럼 행(row)입니다. 나머지는 네이티브 앱을 위해 만들어졌습니다. 길이는 포인트 단위이고(`16`, `"50%"`, `"auto"`, 클래스는 `rem`와 CSS의 다른 단위를 받습니다), 기본값은 네이티브 레이아웃의 기본값이며(아래에 나열), 변하는 값은 문자열 대신 숫자를 받고(`translate: [x, 0]`, 섀도의 레이어), 플랫폼이 CSS 이상으로 제공하는 기능에는 별도의 [확장](#extensions)이 있습니다.

```rust tabs
view()
    .p_4()
    .rounded(px(12.0))
    .bg(white())
    .border_1()
    .border_color(rgb(0xd0d7de))
    .shadow([BoxShadow {
        offset_y: px(4.0),
        blur: px(12.0),
        color: rgba(0x0000001f).into(),
        ..BoxShadow::default()
    }])
    .child(
        text("Card")
            .text_size(px(17.0))
            .font_weight(FontWeight::SEMIBOLD)
            .text_color(rgb(0x1f2328)),
    )
```

```tsx tabs
<View
  style={{
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d0d7de",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.12)",
  }}
>
  <Text style={{ fontSize: 17, fontWeight: "600", color: "#1f2328" }}>Card</Text>
</View>
```

이 페이지에서는 스타일을 조합하는 방법과 시각적 속성을 다룹니다. 레이아웃 속성(flexbox, 그리드, 크기, 위치)은 [레이아웃](./layout.md), 텍스트 속성은 [텍스트](./text.md)에 있으며, 모든 속성과 타입은 [스타일 레퍼런스](../modules/style-reference.md)에 나열되어 있습니다.

<a id="combining-styles"></a>

## 스타일 조합

Rust에서 공유 스타일은 요소를 받아 스타일이 적용된 요소를 반환하는 함수이고, 조건은 일반 Rust 코드입니다. 요소를 만들 때 알 수 있는 조건에는 `.when(condition, |v| ..)`를, 앱이 실행되는 동안 전환되는 스타일에는 `.style_when(signal, |s| ..)`를 씁니다. TSX에서 `style`는 객체 또는 왼쪽에서 오른쪽으로 병합되는 객체 배열을 받으며, falsy 항목(`false`, `null`, `undefined`)은 건너뛰므로 조건부 스타일을 짧게 쓸 수 있습니다:

```rust tabs
fn button(danger: bool, busy: Signal<bool>) -> View {
    view()
        .px_4()
        .py(px(10.0))
        .rounded(px(10.0))
        .bg(rgb(0x0969da))
        .when(danger, |v| v.bg(rgb(0xcf222e)))
        .style_when(busy, |s| s.opacity(0.4))
}
```

```tsx tabs
const styles = {
  button: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: "#0969da" },
  disabled: { opacity: 0.4 },
  danger: { backgroundColor: "#cf222e" },
} as const;

<View style={[styles.button, props.danger && styles.danger, busy() && styles.disabled]} />
```

TSX에서는 공유 스타일을 컴포넌트 밖의 상수로 정의하세요(`as const`와 함께 사용하면 TypeScript가 `"row"` 같은 리터럴 타입을 유지합니다). 일반 객체면 충분합니다. 스타일은 설정될 때마다 Rust에서 파싱되며, 따로 등록할 필요가 없는 객체로부터 만들어집니다.

시그널을 읽는 스타일은 그 시그널을 따라갑니다. Rust에서는 메서드에 클로저(`.bg(move || ..)`)를 전달하면 시그널이 바뀔 때 해당 속성만 다시 설정되고, TSX에서는 시그널을 읽는 스타일 표현식이 다시 만들어지며 NSH는 값이 달라진 속성만 전송합니다:

```rust tabs
view()
    .p_3()
    .bg(move || if selected.get() { rgb(0xddf4ff) } else { rgb(0xffffff) })
```

```tsx tabs
<View style={{ backgroundColor: selected() ? "#ddf4ff" : "#ffffff", padding: 12 }} />
```

TSX 요소에 둘 다 있으면 `style`가 `class`보다 우선합니다. 클래스가 먼저 적용되고 그 위에 인라인 스타일이 적용됩니다. `undefined`로 설정된 키는 아무것도 설정하지 않으므로(`backgroundColor: active ? accent : undefined`는 비활성 상태일 때 클래스의 색상을 유지합니다), `null`는 기본값을 설정합니다. Rust에서는 같은 속성에 대해 나중에 호출한 메서드가 앞선 메서드보다 우선합니다.

하나의 스타일(객체 또는 하나로 병합된 배열) 안에서는 키의 순서가 영향을 주지 않습니다. 더 구체적인 속성이 축약 속성보다 우선합니다. `borderTopWidth`는 `borderWidth`보다, `borderLeftColor`는 `borderColor`보다, `marginTop`는 `marginVertical`보다, 그리고 그것은 `margin`보다(패딩도 마찬가지), `rowGap`는 `gap`보다, `flexGrow`는 `flex`보다, `gridColumnStart`는 `gridColumn`보다 우선합니다. 여기서 `null`로 설정된 구체적 속성은 축약 속성의 값을 보여줍니다.

<a id="units-and-values"></a>

## 단위와 값

- **길이는 포인트**(밀도 독립 픽셀)입니다: Rust의 `px(100.0)`와 TSX의 `width: 100`는 100pt이며, 2× 또는 3× 화면에서는 물리 픽셀로 200 또는 300입니다.
- **퍼센트**(Rust의 `relative(0.5)`, TSX의 `"50%"`)는 크기, 위치, 마진, 패딩에서 부모를 기준으로 합니다([레이아웃](./layout.md)).
- **각도**는 Rust에서 `deg(45.0)`, `radians(0.5)`, `turn(0.25)`이고, TSX에서는 숫자(도 단위) 또는 단위가 붙은 문자열입니다: `45`, `"45deg"`, `"0.5rad"`. CSS의 `rotate`와 `transform`는 `"0.25turn"`도 받으며, `transform` 문자열 안에서는 모든 각도에 단위가 있어야 합니다.
- **지속 시간**은 밀리초입니다: Rust에서는 `.duration(150.0)`, TSX에서는 숫자 또는 문자열(`"150ms"`, `"0.2s"`)입니다.

<a id="defaults"></a>

## 기본값

속성이 설정되지 않은 곳에는 NSH의 기본값이 적용됩니다:

| | 기본값 |
|---|---|
| 뷰의 자식 레이아웃 | 열(`flexDirection: "column"`가 설정된 flex 컨테이너). CSS와 마찬가지로 `flexDirection`가 설정되지 않으면 `display: "flex"`가 행을 만듭니다 |
| `flexShrink` | `0` (요청하지 않으면 자식은 줄어들지 않음) |
| `alignContent` | `"flex-start"` (그리드에서는 CSS의 `"normal"`) |
| `position` | `"relative"` |
| `minWidth` / `minHeight` | `0` |
| `backgroundColor` | 투명 |
| 텍스트 | 검정, 14pt, 굵기 400 |
| 테두리와 아웃라인 색상 | 텍스트 색상 (CSS의 `currentColor`) |

새 뷰는 스타일을 지정하기 전까지 스타일을 전혀 갖지 않으므로, 스타일이 없는 래퍼는 네이티브 측에서 비용이 들지 않습니다.

<a id="colors"></a>

## 색상

Rust에서 색상은 타입이 지정된 값입니다: `rgb(0x0099ff)`, `rgba(0x0099ffcc)`, `hsla(..)`, `white()`, `black()`, 그리고 Tailwind 팔레트인 `nsh_core::element::palette`(`BLUE.shade(500)`). 색상 메서드는 `AdaptiveColor`, 즉 라이트 값과 다크 값을 받습니다. `AdaptiveColor::rgb(0xffffff, 0x0d1117)`는 렌더링 없이 시스템 외관에 따라 네이티브에서 전환됩니다. 앱 테마의 색상(`nsh_base`의 `theme().primary`)도 적응형입니다([Rust](./rust.md#theme)).

TSX에서 색상 속성은 CSS 색상 문자열을 받습니다:

| 형식 | 예시 |
|---|---|
| 16진수 | `"#09f"`, `"#09fc"`, `"#0099ff"`, `"#0099ffcc"` |
| `rgb()` / `rgba()` | `"rgb(0, 153, 255)"`, `"rgba(0, 0, 0, 0.5)"`, `"rgb(0 0 0 / 10%)"` |
| `hsl()` / `hsla()` | `"hsl(210 100% 50%)"` |
| `oklch()` / `oklab()` | `"oklch(62.3% 0.214 259.8)"` |
| 이름 지정 | `"white"`, `"black"`, `"transparent"`, `"rebeccapurple"`, ... |
| `currentColor` | `"currentColor"`: 텍스트 색상으로, 그라디언트, 섀도, `drop-shadow()` 또는 `color-mix()`(`"color-mix(in srgb, currentColor 50%, transparent)"`) 안에서도 사용할 수 있으며, 클래스에서는 `bg-current`, `border-current/50`, `bg-[color-mix(in_srgb,currentColor_50%,transparent)]`로 씁니다 |

TSX에서 다크 모드를 지원하려면 `nsh`에서 [`colorScheme()`](../modules/nsh.md#device)를 읽거나(시스템 외관을 따르는 accessor입니다) Tailwind의 `dark:` 배리언트를 사용하세요:

```rust tabs
view()
    .flex_1()
    .bg(AdaptiveColor::rgb(0xffffff, 0x0d1117))
    .child(text("Follows the system appearance").text_color(AdaptiveColor::rgb(0x1f2328, 0xe6edf3)))
```

```tsx tabs
import { Text, View } from "nsh";
import { colorScheme } from "nsh";

const palette = () =>
  colorScheme() === "dark"
    ? { background: "#0d1117", text: "#e6edf3" }
    : { background: "#ffffff", text: "#1f2328" };

<View style={{ flex: 1, backgroundColor: palette().background }}>
  <Text style={{ color: palette().text }}>Follows the system appearance</Text>
</View>
```

색상이 아닌 스타일의 경우, Rust에서 `.dark(|s| ..)`는 다크 외관에서 스타일을 적용하고 `dark()`는 외관을 읽습니다. 기본 텍스트 색상은 두 외관 모두에서 검정이므로, 다크 모드를 지원하는 앱에서는 색상을 명시적으로 설정하세요.

<a id="borders-and-corners"></a>

## 테두리와 모서리

```rust tabs
view()
    .border_1()
    .border_color(rgb(0xd0d7de))
    .border_dashed()               // .border_solid() | .border_dashed() | .border_dotted()
    .rounded(px(12.0))
    .rounded_tl(px(24.0))          // per corner, overrides .rounded(..)
    .border_b(px(3.0))             // per side
    .border_b_color(rgb(0x0969da))
```

```tsx tabs
<View
  style={{
    borderWidth: 1,
    borderColor: "#d0d7de",
    borderStyle: "dashed",          // "solid" | "dashed" | "dotted"
    borderRadius: 12,
    borderTopLeftRadius: 24,        // per corner, overrides borderRadius
    borderBottomWidth: 3,           // per side
    borderBottomColor: "#0969da",
  }}
/>
```

- **너비와 색상**은 변별로 지정합니다: `borderTopWidth`, `borderRightWidth`, ..., `borderTopColor`, ...는 어느 방향에서든 자기 변을 유지하며, `borderStartWidth`, `borderEndWidth`, `borderStartColor`, `borderEndColor`는 [레이아웃 방향](./layout.md#right-to-left)을 따릅니다(Rust에서는 `.border_t(..)`, `.border_t_color(..)`, `.border_s(..)`, `.border_e_color(..)`, ...).
- 너비는 설정되었지만 색상은 설정되지 않은 변의 **색상**은 CSS의 `currentColor`처럼 텍스트 색상입니다: `{ borderWidth: 1, color: "#0969da" }`는 파란색 테두리를 그립니다.
- **반경**은 모서리별로 지정합니다: `borderTopLeftRadius`, `borderTopRightRadius`, `borderBottomRightRadius`, `borderBottomLeftRadius`, 그리고 `borderTopStartRadius` / `borderTopEndRadius` / `borderBottomStartRadius` / `borderBottomEndRadius`(위쪽 시작, 위쪽 끝, 아래쪽 시작, 아래쪽 끝)는 [레이아웃 방향](./layout.md#right-to-left)을 따릅니다(Rust에서는 `.rounded_tl(..)`, ..., `.rounded_ss(..)`, `.rounded_se(..)`, `.rounded_es(..)`, `.rounded_ee(..)`, 그리고 프리셋 `.rounded_lg()`, `.rounded_full()`, ...).
- **`borderCurve: "continuous"`**(`.border_curve(BorderCurve::Continuous)`)는 곡률이 가장자리로 부드럽게 이어지는 모서리를 그립니다. iOS 앱 아이콘처럼 두 플랫폼 모두에서 동작합니다. 알약 모양(높이의 절반인 `borderRadius`)은 알약 모양으로 유지됩니다.
- **`overflow: "hidden"`**(`.overflow_hidden()`)는 자식을 둥근 모양으로 잘라냅니다. 잘려 나간 부분은 레이아웃에서도 잘립니다. 즉 이를 둘러싼 스크롤 뷰의 콘텐츠 크기에 영향을 주지 않으므로, 자신보다 넓게 자식을 배치하고 `transform`로 축소하는 박스(트랜스폼은 레이아웃에 영향을 주지 않음)는 스크롤 뷰에 영향을 주지 않습니다.

반경이 변의 절반보다 크면 그 값으로 제한되므로, `borderRadius: 9999`(`.rounded_full()`)는 원이나 알약 모양을 만듭니다.

<a id="shadows"></a>

## 섀도

뷰는 CSS의 `boxShadow`를 그리며, Android는 머티리얼 엘리베이션을 추가합니다:

```rust tabs
// CSS box-shadow: several layers, with spread and inset.
view().shadow([
    BoxShadow { offset_y: px(1.0), blur: px(2.0), color: rgba(0x00000014).into(), ..BoxShadow::default() },
    BoxShadow { offset_y: px(8.0), blur: px(24.0), color: rgba(0x0000001f).into(), ..BoxShadow::default() },
])
view().shadow([BoxShadow { offset_y: px(2.0), blur: px(4.0), color: rgba(0x00000026).into(), inset: true, ..BoxShadow::default() }])

// A preset in a color of its own.
view().shadow_lg().shadow_color(rgba(0x0969da66))

// Android's material elevation.
view().elevation(px(6.0)).bg(white()).rounded(px(12.0))
```

```tsx tabs
// CSS box-shadow: several, comma separated, with spread and inset
<View style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.12)" }} />
<View style={{ boxShadow: "inset 0 2px 4px rgba(0,0,0,0.15)" }} />

// Android's material elevation (a prop, not a style)
<View android={{ elevation: 6 }} style={{ backgroundColor: "#ffffff", borderRadius: 12 }} />
```

`boxShadow`는 CSS를 따릅니다: `offsetX offsetY blur spread color`, 내부 섀도는 `inset`. 또한 레이어를 숫자로 받을 수 있으며, 이는 값이 변하는 경우에 쓰는 형태로 문자열을 만들지 않습니다: `boxShadow: [{ x: 0, y: 6, blur: 18, spread: 0, color: "#0000004d", inset: false }]`(`x`와 `y`만 필수이며, 색상이 없는 레이어는 텍스트 색상입니다). Rust는 레이어를 받습니다, `.shadow([BoxShadow { .. }])`. 섀도는 뷰의 둥근 모양을 따르고, 트랜지션은 섀도를 애니메이션합니다(`transitionProperty: "boxShadow"`, `.transition_shadow()`). Tailwind의 프리셋은 Rust에서 `.shadow_sm()`, `.shadow_md()`, `.shadow_lg()`, ...이며, `.shadow_color(..)`는 레이어의 색상을 바꿉니다. 투명한 뷰의 콘텐츠(예: 아이콘의 글리프)를 따르는 섀도는 `filter: "drop-shadow(...)"`([필터](#filters-and-blending))이고, 텍스트에는 `textShadow`([텍스트](./text.md))가 있습니다.

> [!NOTE]
> Android에서 섀도는 배경이 필요합니다. 배경이 투명한 뷰(예: 배경이 없는 텍스트)는 섀도를 드리우지 않습니다.

<a id="gradients"></a>

## 그라디언트

`backgroundImage`는 배경색 위에 그려지는 CSS 그라디언트를 받습니다. Rust에서는 `.bg_linear(angle)`, `.bg_radial()`, `.bg_conic(angle)`와 스톱 `.gradient_from(..)`, `.gradient_via(..)`, `.gradient_to(..)`를 사용하며, Tailwind의 `bg-linear-*`와 `from-*`, `via-*`, `to-*`에 해당합니다. TSX에서는 여러 그라디언트를 쉼표로 구분합니다.

```rust tabs
view().h(px(120.0)).rounded(px(16.0)).bg_linear(deg(135.0)).gradient_from(rgb(0x54aeff)).gradient_to(rgb(0x8250df))
view().bg_radial().gradient_from(rgb(0xfff8c5)).gradient_to(rgb(0xfd8c73))
view().bg_conic(deg(0.0)).gradient_from(rgb(0xff0000)).gradient_via(rgb(0x00ff00)).gradient_to(rgb(0x0000ff))
view()
    .bg_linear_to_r()
    .gradient_from(rgb(0x8250df))
    .gradient_from_position(percentage(0.3))
    .gradient_to(rgb(0x54aeff))
    .gradient_to_position(percentage(0.3))
```

```tsx tabs
<View style={{ height: 120, borderRadius: 16, backgroundImage: "linear-gradient(135deg, #54aeff, #8250df)" }} />
<View style={{ backgroundImage: "radial-gradient(circle at top left, #fff8c5, #fd8c73)" }} />
<View style={{ backgroundImage: "conic-gradient(red, yellow, lime, aqua, blue, magenta, red)" }} />
<View style={{ backgroundImage: "linear-gradient(90deg, #8250df 0 12px, #54aeff 12px)" }} />
```

컬러 스톱은 선형 또는 방사형 그라디언트에서는 퍼센트나 길이(`px`, `pt`, `rem`, 숫자만 쓰면 포인트)로, 원뿔형 그라디언트에서는 퍼센트나 각도(`deg`, `turn`, `rad`, `grad`)로 위치를 지정합니다. 위치가 두 개인 스톱(`#8250df 0 12px`)은 같은 위치의 두 스톱처럼 단색 띠가 됩니다. 길이는 뷰의 현재 크기에서 그라디언트 선을 따라 측정되므로, 12px 띠는 뷰의 크기가 바뀌어도 12px 너비를 유지합니다.

색상은 CSS처럼 스톱 사이에서 혼합됩니다. 그라디언트가 지정한 색 공간(`linear-gradient(in oklab, …)`, 또한 `srgb`, `srgb-linear`, `xyz`, `oklch`와 `longer hue` 같은 hue 방식, 그리고 `hsl`)에서 혼합하고, 지정하지 않으면 모든 색이 16진수, `rgb()`, `hsl()` 또는 이름 지정 색상일 때는 sRGB에서, 하나라도 `oklch()`, `oklab()`, `lab()`, `lch()` 또는 `color()`이면 Oklab에서 혼합합니다.

iOS에서 텍스트 요소는 그라디언트를 그리지 않습니다.

<a id="filters-and-blending"></a>

## 필터와 블렌딩

| 속성 | 값 | Rust |
|---|---|---|
| `filter` | 뷰와 그 콘텐츠의 CSS 필터: `brightness()`, `contrast()`, `grayscale()`, `hue-rotate()`, `invert()`, `saturate()`, `sepia()`, `opacity()`, `blur()`, `drop-shadow()`(색상이 없으면 CSS처럼 텍스트 색상). 여러 개는 공백으로 구분 | `.brightness(n)`, `.contrast(n)`, `.grayscale(n)`, `.hue_rotate(angle)`, `.invert(n)`, `.saturate(n)`, `.sepia(n)`, `.blur(px(..))` |
| `backdropFilter` | 뷰 뒤에 있는 것에 대한 필터: `"blur(10px)"`(젖빛 유리) | `.backdrop_blur(px(10.0))`, `.backdrop_saturate(n)`, ... |
| `glassEffect` | `"regular"` 또는 `"clear"`는 iOS 26과 macOS 26 이상에서 Apple의 Liquid Glass를 사용하고, `"none"`(기본값)는 `backdropFilter`를 사용합니다 | `.glass_effect(GlassEffect::Regular)` |
| `mixBlendMode` | 뷰가 뒤에 있는 것과 블렌딩되는 방식: `"multiply"`, `"screen"`, `"overlay"`, ... | `.mix_blend_mode(BlendMode::Multiply)` |

```rust tabs
image(photo).size(px(120.0)).grayscale(1.0).contrast(1.2)
view()
    .absolute()
    .bottom_0()
    .left_0()
    .right_0()
    .p_3()
    .bg(rgba(0xffffff66))
    .backdrop_blur(px(12.0))
```

```tsx tabs
<Image src={photo} style={{ width: 120, height: 120, filter: "grayscale(1) contrast(1.2)" }} />
<View style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: 12, backgroundColor: "rgba(255,255,255,0.4)", backdropFilter: "blur(12px)" }} />
```

플랫폼별 지원은 다릅니다:

| | iOS | Android |
|---|---|---|
| 뷰의 `filter` | `opacity`, 최대 1까지의 `brightness`, `drop-shadow`만 | 모두, Android 12(API 31)부터. 그 미만에서는 색상 필터만 |
| 이미지의 `filter` | 모든 색상 필터와 `blur` | 뷰와 동일 |
| `backdropFilter` | 반경에 근사하는 시스템 블러 머티리얼 | Android 12(API 31)부터 |
| `mixBlendMode` | 지원 | Android 10(API 29)부터 |

웹, Windows, Linux는 모든 필터를 뷰에 적용하고, macOS는 iOS와 같습니다. GPUI는 색상 필터와 `drop-shadow()`를 그립니다. 백드롭 필터는 iOS, macOS, Android에서는 블러이고, 웹과 Windows에서는 모든 필터입니다. Linux와 GPUI는 그리지 않으며, GPUI는 뷰를 일반 블렌드 모드로 그립니다. 여러 `drop-shadow()`가 있는 `filter`의 경우, iOS, macOS, Android는 마지막 것을 그립니다. `mixBlendMode`는 뷰를 그 뒤에 그려진 모든 것과 블렌딩합니다.

iOS에서 `ios={{ backdropMaterial: "regular" }}`는 `backdropFilter` 블러가 사용하는 시스템 머티리얼을 선택합니다. 값은 `"ultraThin"`(기본값), `"thin"`, `"regular"`, `"thick"`, `"chrome"`입니다. 머티리얼이 보이게 하려면 이 prop을 양수 블러 반경과 함께 사용하세요. Rust는 `.backdrop_material(BackdropMaterial::Regular)`를 `.backdrop_blur(px(30.0))`와 함께 사용합니다. 반경은 머티리얼의 강도에 근사합니다. NSH는 선택한 머티리얼의 일부를 적용하며 30포인트에서 최대 강도에 도달합니다. 라이트 또는 다크 변형은 뷰의 배경색을 따릅니다. 이 선택지는 Apple의 [시스템 블러 머티리얼](https://developer.apple.com/documentation/uikit/uiblureffect/style/systemmaterial)에 대응합니다.

```rust tabs
view().backdrop_blur(px(30.0)).backdrop_material(BackdropMaterial::Regular)
```

```tsx tabs
<View ios={{ backdropMaterial: "regular" }} style={{ height: 64, backdropFilter: "blur(30px)" }} />
```

`glassEffect`는 iOS 26과 macOS 26 이상에서 뷰의 콘텐츠 뒤에 Liquid Glass를 그립니다. `"regular"`는 표준 머티리얼을 사용하고, `"clear"`는 배경에서 색을 덜 가져옵니다. 이전 iOS 버전과 다른 플랫폼에서 표시되는 블러를 위해 `backdropFilter`와 함께 사용하세요. 글라스는 뷰의 크기와 둥근 모서리를 따릅니다.

```tsx
<View style={{ height: 80, borderRadius: 16, backdropFilter: "blur(12px)", glassEffect: "regular" }} />
```

<a id="outlines-opacity-and-visibility"></a>

## 아웃라인, 불투명도, 가시성

- `outlineWidth`, `outlineColor`, `outlineStyle`, `outlineOffset`(`.outline(..)`, `.outline_color(..)`, `.outline_dashed()`, `.outline_offset(..)`): 테두리 바깥에 공간을 차지하지 않고 그려지는 선입니다(음수 오프셋은 안쪽에 그립니다). `outlineStyle: "none"`(또는 `"hidden"`, `.outline_none()`)는 CSS처럼 너비와 관계없이 아웃라인을 숨깁니다.
- `opacity`(`.opacity(n)`): 0에서 1까지이며, 뷰와 그 자식에 적용됩니다.
- `visibility: "hidden"`(Rust에서는 `.invisible()`): 뷰는 그려지지 않지만 공간은 유지하며, 브라우저에서처럼 스크린 리더는 이 뷰와 하위 트리를 건너뜁니다. `display: "none"`(`.hidden()`)는 레이아웃에서 제거합니다.
- `zIndex`(`.z_index(n)`): 형제 요소 간의 순서이자 네이티브 쌓임 순서이기도 합니다(같은 값이면 순서가 안정적).
- `cursor`(`.cursor(..)`, `.cursor_pointer()`): 뷰 위의 포인터 모양으로, 포인터와 데스크톱용입니다.
<a id="transforms"></a>

## 트랜스폼

트랜스폼은 CSS의 방식을 따릅니다. TSX에서 `translate`, `rotate`, `scale`는 각각 별도의 프로퍼티이며, `transform`는 CSS의 함수 문자열 또는 단계 목록을 받습니다. 이들은 키의 순서와 관계없이 CSS의 순서인 `translate`, `rotate`, `scale`, `transform` 순으로 합성됩니다. Rust에서 트랜스폼은 메서드(`.translate_x(..)`, `.rotate(..)`, `.scale(..)`, ...)이며 같은 순서로 합성됩니다.

```rust tabs
view().translate_x(px(20.0)).rotate(deg(-8.0)).scale(0.9)
view().perspective(px(600.0)).child(view().rotate_y(deg(35.0)).backface_hidden())
view().origin_top_left().rotate(deg(30.0))
```

```tsx tabs
<View style={{ translate: "20px 0", rotate: "-8deg", scale: 0.9 }} />
<View style={{ transform: "perspective(600px) rotateY(35deg)", backfaceVisibility: "hidden" }} />
<View style={{ transformOrigin: "top left", rotate: "30deg" }} />
```

| 프로퍼티 | 값 |
|---|---|
| `translate` | `"10px 20px"`, `"-50% 0"`(뷰 자체 크기에 대한 백분율), 숫자(x축 방향의 포인트), 또는 축마다 숫자, 문자열 또는 애니메이션 값을 받는 `[x, y]` |
| `rotate` | `"45deg"`, `"0.25turn"`, 축을 기준으로 한 `"x 90deg"`, 숫자(도) 또는 애니메이션 값(도) |
| `scale` | `1.5`, `"150%"`, `"1 2"`(x와 y), 애니메이션 값(두 축 모두) 또는 `[x, y]` |
| `transform` | CSS 함수: `translate()`, `translateX()`, `translateY()`, `scale()`, `scaleX()`, `scaleY()`, `rotate()` / `rotateZ()`, `rotateX()`, `rotateY()`, `skew()`, `skewX()`, `skewY()`, `perspective()`. 길이는 `px`(이동은 `%`도 가능), 각도는 `deg`, `rad` 또는 `turn` 단위. `"none"`. 또는 양이 애니메이션 값일 수 있는 단계 목록(`[{ perspective: 800 }, { rotateY: angle }]`) |

클래스와 마찬가지로 각각은 별도의 프로퍼티입니다. 스타일의 `scale`는 `scale-95` 클래스를 대체하면서 `rotate-3`는 그대로 유지합니다. 애니메이션 값은 `translate`, `rotate`, `scale`를 네이티브로 움직입니다. 3D 회전처럼 CSS 문자열이 애니메이션 양을 담을 수 없는 경우에는 `transform`에 단계 목록을 지정하세요: `translateX`, `translateY`, `scale`, `scaleX`, `scaleY`, `rotate`(`rotateZ`), `rotateX`, `rotateY`, `skewX`, `skewY`, `perspective`([애니메이션](./animation.md)). 스타일의 `transform`는 두 형태 중 하나여야 하므로, 애니메이션 단계 앞에 오는 perspective는 목록의 한 단계로 지정합니다.

Rust의 `.perspective(..)`는 Tailwind의 `perspective-*`처럼 CSS의 `perspective` 프로퍼티에 해당합니다. 이는 뷰의 자식들에게 깊이를 부여하는 반면, `transform`의 `perspective()` 함수는 뷰 자체의 트랜스폼에 적용됩니다. `transformOrigin`는 키워드, 백분율, 길이를 받으며(`"top left"`, `"50% 0"`, `[10, 20]`, Rust에서는 `.origin_top_left()`, `.transform_origin(..)`), 기본값은 중앙입니다. 트랜스폼은 레이아웃에 영향을 주지 않습니다. 형제 뷰는 해당 뷰가 변환되지 않은 것처럼 배치됩니다.

Android는 skew 트랜스폼을 지원하지 않습니다.

<a id="transitions"></a>

## 트랜지션

뷰는 애니메이션할 대상을 지정하면 자신의 스타일 변경을 애니메이션합니다. 애니메이션은 네이티브로 실행되며, 프레임마다 실행되는 코드는 없습니다.

```rust tabs
let open = signal(false);

view()
    .on_press(move || open.update(|o| *o = !*o))
    .w(px(150.0))
    .h(px(72.0))
    .rounded(move || px(if open.get() { 36.0 } else { 12.0 }))
    .bg(move || if open.get() { rgb(0x8250df) } else { rgb(0x54aeff) })
    .translate_x(move || px(if open.get() { 120.0 } else { 0.0 }))
    .transition_all()
    .duration(300.0)
    .ease_in_out()
```

```tsx tabs
<View
  onPress={() => open.set(!open())}
  style={{
    width: 150,
    height: 72,
    borderRadius: open() ? 36 : 12,
    backgroundColor: open() ? "#8250df" : "#54aeff",
    translate: open() ? 120 : 0,
    transitionProperty: "all",
    transitionDuration: 300,
    transitionTimingFunction: "ease-in-out",
  }}
/>
```

| 프로퍼티 | 값 | Rust |
|---|---|---|
| `transitionProperty` | 애니메이션 대상: `"all"` 또는 쉼표로 구분한 이름. 색상(`"colors"`, `"backgroundColor"`, `"borderColor"`, ...), `"opacity"`, `"transform"`(모든 트랜스폼 프로퍼티), `"boxShadow"`, `"borderRadius"` / `"borderWidth"` | `.transition()`, `.transition_all()`, `.transition_colors()`, `.transition_opacity()`, `.transition_transform()`, `.transition_shadow()` |
| `transitionDuration` | `300`, `"300ms"`, `"0.3s"` | `.duration(300.0)` |
| `transitionDelay` | duration과 동일 | `.delay(100.0)` |
| `transitionTimingFunction` | `"linear"`, `"ease"`, `"ease-in"`, `"ease-out"`, `"ease-in-out"`, `"cubic-bezier(x1, y1, x2, y2)"` | `.ease_linear()`, `.ease_in()`, `.ease_out()`, `.ease_in_out()`, `.ease_bezier(x1, y1, x2, y2)` |

크기와 위치는 스타일이 아니라 레이아웃이므로 트랜지션되지 않습니다. 레이아웃 변경은 `LayoutAnimation`로 애니메이션하거나 네이티브 애니메이션으로 값을 구동하세요([애니메이션](./animation.md)).

<a id="keyframe-animations"></a>

### 키프레임 애니메이션

`animationName`는 Tailwind의 내장 키프레임 애니메이션 중 하나를 네이티브로 실행합니다: `"spin"`, `"ping"`, `"pulse"` 또는 `"bounce"`. `animationDuration`, `animationDelay`, `animationTimingFunction`, `animationIterationCount`(숫자 또는 `"infinite"`)를 순서에 관계없이 함께 지정할 수 있습니다. Rust에서는 `.animate_spin()`, `.animate_ping()`, `.animate_pulse()`, `.animate_bounce()`가 Tailwind의 타이밍으로 이를 실행하고, `.animation(KeyframeAnimation::new(..))`는 직접 지정한 타이밍으로 실행합니다.

```rust tabs
view()
    .size(px(24.0))
    .rounded(px(4.0))
    .bg(rgb(0x0969da))
    .animation(KeyframeAnimation::new(Keyframes::Spin).duration(1000.0).easing([0.0, 0.0, 1.0, 1.0]))
```

```tsx tabs
<View style={{ width: 24, height: 24, borderRadius: 4, backgroundColor: "#0969da", animationName: "spin", animationDuration: 1000, animationIterationCount: "infinite", animationTimingFunction: "linear" }} />
```

<a id="press-feedback"></a>

## 눌림 피드백

눌림 피드백은 눌린 상태에 대해 앱이 지정한 스타일로, 코드로 왕복하지 않고 네이티브로 적용됩니다. hover, focus, disabled 상태도 같은 방식으로 스타일을 받습니다(Rust에서는 `.hover(..)`, `.focus(..)`, `.disabled_style(..)`, TSX에서는 `hoverStyle`, `focusStyle`, `disabledStyle` 또는 `hover:`, `focus:`, `disabled:`).

| Rust | TSX | 눌린 동안의 효과 |
|---|---|---|
| `.active(\|s\| s.opacity(0.6))` | `activeStyle={{ opacity: 0.6 }}` | 뷰가 이 불투명도로 페이드됩니다 |
| `.active(\|s\| s.bg(rgb(0xeaeef2)))` | `activeStyle={{ backgroundColor: "#eaeef2" }}` | 배경이 이 색상으로 바뀝니다 |
| `.ripple(Ripple { color: Some(rgba(0x00000022).into()), ..Ripple::default() })` | `android={{ ripple: { color: "#0002" } }}` | Android의 머티리얼 리플 |
| `.active(\|s\| s.bg(ZINC.shade(100)).scale(0.95))` | `class="active:bg-zinc-100 active:scale-95"` | 임의의 스타일 |

[터치와 제스처](./touch-and-gestures.md)를 참고하세요.

<a id="extensions"></a>

## 확장

이 키와 클래스는 네이티브 플랫폼이 CSS 이상으로 제공하는 기능을 담고 있습니다.

| 키 | 클래스 | 기능 |
|---|---|---|
| `placeholderColor` | `placeholder:text-*` | `<Input>`의 플레이스홀더 색상 |
| `selectionColor` | `selection:bg-*` | `<Input>` 또는 선택 가능한 `<Text>`의 선택 하이라이트 |
| `tintColor` | `tint-*` | `<Image>`의 불투명 픽셀을 다시 칠함(템플릿 이미지, 아이콘) |
| `borderCurve` | | `"continuous"`: 시스템 자체와 같이 모서리가 가장자리로 부드럽게 이어지는 코너(Apple의 연속 코너) |
| `glassEffect` | | iOS 26과 macOS 26에서는 뷰 뒤에 Apple의 Liquid Glass를, 그 외에는 `backdropFilter`를 적용 |
| `writingDirection` | | 텍스트의 기본 방향. `"auto"`(기본값: 플랫폼의 텍스트 뷰처럼 콘텐츠에서 결정), `"ltr"` 또는 `"rtl"`. `direction`는 레이아웃의 방향을 설정 |
| `textAlignVertical` | | `<Text>` 박스보다 짧은 텍스트가 놓이는 위치: `"top"`(기본값), `"center"` 또는 `"bottom"` |
| `textAlign: "auto"` | | 텍스트 방향에 따른 텍스트의 자연스러운 쪽(기본값) |
| `selectedStyle` | `selected:` | `accessibilityState.selected`가 `true`인 동안의 스타일(선택된 `Button`, 탭) |
| | `ios:`, `android:`, `web:` | 특정 플랫폼 전용 클래스(`ios:pt-2`) |

달라지는 값은 CSS가 문자열을 받는 곳에서 숫자도 받습니다: `transform`는 단계 목록으로, `translate`와 `scale`는 `[x, y]`로, `boxShadow`와 `textShadow`는 레이어로 지정합니다.

<a id="related"></a>

## 관련 문서

- [Tailwind](./tailwind.md): 다크 모드, 눌림 상태, 브레이크포인트용 variant를 갖춘 클래스 형태의 동일한 스타일과 그에 대응하는 타입 지정 방식.
- [레이아웃](./layout.md) 및 [텍스트](./text.md).
- [스타일 레퍼런스](../modules/style-reference.md): 모든 스타일 프로퍼티와 그 타입.
