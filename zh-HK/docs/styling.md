---
title: "樣式"
description: "Rust 中的類型化樣式方法與 TSX 中的 style prop:flexbox、grid 及 CSS 效果,包括顏色、邊框、圓角、陰影、漸變、濾鏡、變換和過渡,以及各平台之間的差異。"
order: 32
group: ui
demo: guide-styling
source_hash: c3b673df4846a333
---


# 樣式

每個元素都使用相同的原生樣式，並有兩種寫法。在 Rust 中，樣式是以鏈式呼叫套用在元素上的型別方法（`.p_4()`、`.rounded(px(12.0))`、`.bg(color)`）；在 TSX 中，則使用由 camelCase 屬性組成的 `style` prop，或 [Tailwind class](./tailwind.md)。兩者都包含 CSS 功能，例如 box shadow、gradient、filter、outline、transition 和 grid，而且只有改變了的屬性才會傳送到原生 view。

這三種寫法寫的是同一組屬性，意思也相同。屬性名稱沿用 CSS（少數採用應用程式慣用的較簡單名稱，例如 `paddingHorizontal`、`marginStart` 和 `numberOfLines`），而 CSS 值（顏色、gradient、filter、shadow、transform、對齊關鍵字）和 Tailwind utility 的意思與在網頁上相同，每個 Rust 方法和 utility 所設定的，就是 Tailwind CSS 4 為它生成的內容，因此你在網頁上學到的知識可以沿用：`paddingLeft` 就是 `padding-left` 和 `pl-4`，`boxShadow` 就是 `box-shadow`，`display: "flex"` 跟 `flex` class 一樣是橫向排列。其餘部分是為原生應用程式而設：長度單位是 point（`16`、`"50%"`、`"auto"`；class 接受 `rem` 及 CSS 的其他單位），預設值是原生 layout 的預設值（見下文），會變動的值使用數字而非字串（`translate: [x, 0]`、shadow 的各層），而各平台在 CSS 以外提供的功能則有自己的[擴充功能](#extensions)。

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

本頁介紹樣式如何組合，以及視覺屬性。Layout 屬性（flexbox、grid、尺寸、位置）見[版面配置](./layout.md)，文字屬性見[文字](./text.md)，所有屬性及其型別則列於[樣式參考](../modules/style-reference.md)。

<a id="combining-styles"></a>

## 組合樣式

在 Rust 中，共用樣式是接收元素並回傳已套用樣式的元素的函式，條件則是普通的 Rust 程式碼：`.when(condition, |v| ..)` 用於建立元素時已知的條件，`.style_when(signal, |s| ..)` 用於應用程式執行期間切換的樣式。在 TSX 中，`style` 接受一個物件，或由左至右合併的物件陣列；falsy 項目（`false`、`null`、`undefined`）會被略過，令條件樣式寫得更簡短：

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

在 TSX 中，把共用樣式定義為元件以外的常數（使用 `as const`，讓 TypeScript 保留 `"row"` 之類的字面型別）。只需一個普通物件即可：樣式每次設定時都會在 Rust 中解析，無需登記這些物件。

讀取 signal 的樣式會跟隨這些 signal：在 Rust 中，給方法傳入 closure（`.bg(move || ..)`），signal 改變時只會重新設定該屬性；在 TSX 中，讀取 signal 的樣式表達式會被重新建立，NSH 只會傳送值有差異的屬性：

```rust tabs
view()
    .p_3()
    .bg(move || if selected.get() { rgb(0xddf4ff) } else { rgb(0xffffff) })
```

```tsx tabs
<View style={{ backgroundColor: selected() ? "#ddf4ff" : "#ffffff", padding: 12 }} />
```

當 TSX 元素同時有兩者時，`style` 優先於 `class`：先套用 class，再在其上套用 inline style。設為 `undefined` 的 key 不會設定任何內容（`backgroundColor: active ? accent : undefined` 在未啟用時保留 class 的顏色）；`null` 則設定預設值。在 Rust 中，同一屬性以較後的方法為準。

在同一個樣式內（一個物件，或合併成一個的陣列），key 的順序沒有影響：較具體的屬性優先於其簡寫，`borderTopWidth` 優先於 `borderWidth`，`borderLeftColor` 優先於 `borderColor`，`marginTop` 優先於 `marginVertical` 再優先於 `margin`（padding 同理），`rowGap` 優先於 `gap`，`flexGrow` 優先於 `flex`，`gridColumnStart` 優先於 `gridColumn`。在此處設為 `null` 的具體屬性會顯示簡寫的值。

<a id="units-and-values"></a>

## 單位和值

- **長度單位是 point**（與密度無關的像素）：Rust 中的 `px(100.0)` 和 TSX 中的 `width: 100` 都是 100pt，在 2× 或 3× 螢幕上即 200 或 300 實體像素。
- **百分比**（Rust 中的 `relative(0.5)`，TSX 中的 `"50%"`）相對於父元素，適用於尺寸、位置、margin 和 padding（[版面配置](./layout.md)）。
- **角度**在 Rust 中是 `deg(45.0)`、`radians(0.5)` 或 `turn(0.25)`，在 TSX 中則是以度為單位的數字，或帶單位的字串：`45`、`"45deg"`、`"0.5rad"`；CSS 的 `rotate` 和 `transform` 也接受 `"0.25turn"`，而在 `transform` 字串內，每個角度都要帶單位。
- **時間長度**以毫秒計：Rust 中是 `.duration(150.0)`，TSX 中是數字或字串（`"150ms"`、`"0.2s"`）。

<a id="defaults"></a>

## 預設值

當沒有任何設定指定某個屬性時，會套用 NSH 的預設值：

| | 預設值 |
|---|---|
| view 子元素的 layout | 縱向排列（具有 `flexDirection: "column"` 的 flex container）；除非設定了 `flexDirection`，否則 `display: "flex"` 會變成橫向排列，與 CSS 相同 |
| `flexShrink` | `0`（子元素除非指定，否則不會收縮） |
| `alignContent` | `"flex-start"`（在 grid 中為 CSS 的 `"normal"`） |
| `position` | `"relative"` |
| `minWidth` / `minHeight` | `0` |
| `backgroundColor` | 透明 |
| 文字 | 黑色、14pt、字重 400 |
| 邊框和 outline 顏色 | 文字顏色（CSS 的 `currentColor`） |

新建立的 view 在你為其設定樣式之前不帶任何樣式，因此沒有樣式的包裝元素在原生端不會產生任何開銷。

<a id="colors"></a>

## 顏色

在 Rust 中，顏色是型別值：`rgb(0x0099ff)`、`rgba(0x0099ffcc)`、`hsla(..)`、`white()`、`black()`，以及 Tailwind 的色板 `nsh_core::element::palette`（`BLUE.shade(500)`）。顏色方法接受 `AdaptiveColor`，即一個淺色值和一個深色值：`AdaptiveColor::rgb(0xffffff, 0x0d1117)` 會在原生層隨系統外觀切換，無需重新 render。來自應用程式主題的顏色（`theme().primary`，來自 `nsh_base`）同樣會自動適應外觀（[Rust](./rust.md#theme)）。

在 TSX 中，顏色屬性接受 CSS 顏色字串：

| 格式 | 範例 |
|---|---|
| 十六進制 | `"#09f"`、`"#09fc"`、`"#0099ff"`、`"#0099ffcc"` |
| `rgb()` / `rgba()` | `"rgb(0, 153, 255)"`、`"rgba(0, 0, 0, 0.5)"`、`"rgb(0 0 0 / 10%)"` |
| `hsl()` / `hsla()` | `"hsl(210 100% 50%)"` |
| `oklch()` / `oklab()` | `"oklch(62.3% 0.214 259.8)"` |
| 具名顏色 | `"white"`、`"black"`、`"transparent"`、`"rebeccapurple"`、... |
| `currentColor` | `"currentColor"`：文字顏色，也可用於 gradient、shadow、`drop-shadow()` 或 `color-mix()`（`"color-mix(in srgb, currentColor 50%, transparent)"`）之內；class 寫作 `bg-current`、`border-current/50`、`bg-[color-mix(in_srgb,currentColor_50%,transparent)]` |

在 TSX 中實現深色模式，可從 `nsh` 讀取 [`colorScheme()`](../modules/nsh.md#device)（一個跟隨系統外觀的 accessor），或使用 Tailwind 的 `dark:` variant：

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

至於顏色以外的樣式，Rust 中的 `.dark(|s| ..)` 會在深色外觀下套用樣式，`dark()` 則讀取目前外觀。兩種外觀下的預設文字顏色都是黑色：在支援深色模式的應用程式中，請明確設定顏色。

<a id="borders-and-corners"></a>

## 邊框和圓角

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

- **寬度和顏色**按邊設定：`borderTopWidth`、`borderRightWidth`、...、`borderTopColor`、...，無論方向為何都固定在原本的一邊；以及 `borderStartWidth`、`borderEndWidth`、`borderStartColor`、`borderEndColor`，它們跟隨 [layout 方向](./layout.md#right-to-left)（Rust 中為 `.border_t(..)`、`.border_t_color(..)`、`.border_s(..)`、`.border_e_color(..)`、...）。
- **顏色**：已設定寬度但未設定顏色的邊，其顏色為文字顏色，與 CSS 的 `currentColor` 相同：`{ borderWidth: 1, color: "#0969da" }` 會畫出藍色邊框。
- **圓角半徑**按角設定：`borderTopLeftRadius`、`borderTopRightRadius`、`borderBottomRightRadius`、`borderBottomLeftRadius`，以及 `borderTopStartRadius` / `borderTopEndRadius` / `borderBottomStartRadius` / `borderBottomEndRadius`（頂部起始、頂部結束、底部起始、底部結束），它們跟隨 [layout 方向](./layout.md#right-to-left)（Rust 中為 `.rounded_tl(..)`、...、`.rounded_ss(..)`、`.rounded_se(..)`、`.rounded_es(..)`、`.rounded_ee(..)`，以及預設值 `.rounded_lg()`、`.rounded_full()`、...）。
- **`borderCurve: "continuous"`**（`.border_curve(BorderCurve::Continuous)`）會繪製曲率平滑過渡到邊緣的圓角，就像 iOS 應用程式圖示，兩個平台皆適用。藥丸形（`borderRadius` 為高度的一半）仍然是藥丸形。
- **`overflow: "hidden"`**（`.overflow_hidden()`）會把子元素裁剪成圓角形狀。被裁掉的部分在 layout 中也會被裁剪：它不會計入外層 scroll view 的內容尺寸，所以如果一個 box 把子元素 layout 得比自己寬，再用 `transform` 縮小（transform 不影響 layout），並不會影響 scroll view。

大於邊長一半的半徑會被限制，因此 `borderRadius: 9999`（`.rounded_full()`）會形成圓形或藥丸形。

<a id="shadows"></a>

## Shadow

View 會投射 CSS 的 `boxShadow`，而 Android 另外加上其 material elevation：

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

`boxShadow` 遵循 CSS：`offsetX offsetY blur spread color`，內陰影則用 `inset`。它也可以用數字指定各層，這是用於會變動的值的形式，不會建立字串：`boxShadow: [{ x: 0, y: 6, blur: 18, spread: 0, color: "#0000004d", inset: false }]`（只有 `x` 和 `y` 為必填；沒有顏色的層使用文字顏色）。Rust 接受各層，`.shadow([BoxShadow { .. }])`。Shadow 會跟隨 view 的圓角形狀，transition 也可為它們加上動畫（`transitionProperty: "boxShadow"`、`.transition_shadow()`）。Tailwind 的預設值在 Rust 中是 `.shadow_sm()`、`.shadow_md()`、`.shadow_lg()`、...，而 `.shadow_color(..)` 會為它們的各層重新上色。跟隨透明 view 內容（例如圖示的字形）的 shadow 是 `filter: "drop-shadow(...)"`（[Filters](#filters-and-blending)）；文字則有 `textShadow`（[文字](./text.md)）。

> [!NOTE]
> 在 Android 上，shadow 需要背景：背景透明的 view（例如沒有背景的文字）不會投射 shadow。

<a id="gradients"></a>

## Gradient

`backgroundImage` 接受 CSS gradient，繪製於背景顏色之上；在 Rust 中是 `.bg_linear(angle)`、`.bg_radial()` 和 `.bg_conic(angle)`，色標用 `.gradient_from(..)`、`.gradient_via(..)` 和 `.gradient_to(..)`，如同 Tailwind 的 `bg-linear-*` 配合 `from-*`、`via-*` 和 `to-*`。在 TSX 中，多個 gradient 以逗號分隔。

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

色標以百分比或長度（`px`、`pt`、`rem`；純數字為 point）沿 linear 或 radial gradient 定位，而在 conic gradient 中則以百分比或角度（`deg`、`turn`、`rad`、`grad`）環繞定位。有兩個位置的色標（`#8250df 0 12px`）是單一顏色的色帶，位置相同的兩個色標亦然。長度按 view 目前的尺寸沿 gradient 線量度，因此 12px 的色帶在 view 調整大小時仍保持 12px 寬。

色標之間的顏色混合與 CSS 相同：在 gradient 指定的色彩空間內混合（`linear-gradient(in oklab, …)`；另有 `srgb`、`srgb-linear`、`xyz`、`oklch` 配合 `longer hue` 等色相方法，以及 `hsl`），否則當每個顏色都是十六進制、`rgb()`、`hsl()` 或具名顏色時，在 sRGB 內混合，當其中一個是 `oklch()`、`oklab()`、`lab()`、`lch()` 或 `color()` 時，則在 Oklab 內混合。

在 iOS 上，文字元素不會繪製 gradient。

<a id="filters-and-blending"></a>

## Filter 和混合

| 屬性 | 值 | Rust |
|---|---|---|
| `filter` | view 及其內容的 CSS filter：`brightness()`、`contrast()`、`grayscale()`、`hue-rotate()`、`invert()`、`saturate()`、`sepia()`、`opacity()`、`blur()`、`drop-shadow()`（沒有顏色時使用文字顏色，與 CSS 相同）；多個 filter 以空格分隔 | `.brightness(n)`、`.contrast(n)`、`.grayscale(n)`、`.hue_rotate(angle)`、`.invert(n)`、`.saturate(n)`、`.sepia(n)`、`.blur(px(..))` |
| `backdropFilter` | view 後方內容的 filter：`"blur(10px)"`（毛玻璃） | `.backdrop_blur(px(10.0))`、`.backdrop_saturate(n)`、... |
| `glassEffect` | `"regular"` 或 `"clear"` 用於 iOS 26 和 macOS 26 及更新版本上 Apple 的 Liquid Glass；`"none"`（預設值）使用 `backdropFilter` | `.glass_effect(GlassEffect::Regular)` |
| `mixBlendMode` | view 如何與其後方的內容混合：`"multiply"`、`"screen"`、`"overlay"`、... | `.mix_blend_mode(BlendMode::Multiply)` |

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

各平台的支援情況不同：

| | iOS | Android |
|---|---|---|
| view 上的 `filter` | 只有 `opacity`、不超過 1 的 `brightness` 和 `drop-shadow` | 全部，自 Android 12（API 31）起；較低版本只支援 color filter |
| image 上的 `filter` | 所有 color filter 和 `blur` | 與 view 相同 |
| `backdropFilter` | 系統模糊 material，近似指定的半徑 | 自 Android 12（API 31）起 |
| `mixBlendMode` | 支援 | 自 Android 10（API 29）起 |

Web、Windows 和 Linux 會對 view 套用所有 filter，macOS 與 iOS 相同；GPUI 會繪製 color filter 和 `drop-shadow()`。Backdrop filter 在 iOS、macOS 和 Android 上是模糊效果，在 Web 和 Windows 上支援所有 filter；Linux 和 GPUI 不會繪製任何 backdrop filter，而 GPUI 以 normal 混合模式繪製 view。當 `filter` 帶有多個 `drop-shadow()` 時，iOS、macOS 和 Android 只繪製最後一個。`mixBlendMode` 會把 view 與其後方繪製的所有內容混合。

在 iOS 上，`ios={{ backdropMaterial: "regular" }}` 用於選擇 `backdropFilter` 模糊所使用的系統 material。可用的值有 `"ultraThin"`（預設值）、`"thin"`、`"regular"`、`"thick"` 和 `"chrome"`。請把此 prop 與正數的模糊半徑搭配使用，才會顯示該 material。Rust 中是將 `.backdrop_material(BackdropMaterial::Regular)` 與 `.backdrop_blur(px(30.0))` 一併使用。半徑近似 material 的強度：NSH 會套用所選 material 的一部分，並在 30 point 時達到完整強度。淺色或深色的變體會跟隨 view 的背景顏色。這些選項對應 Apple 的[系統模糊 material](https://developer.apple.com/documentation/uikit/uiblureffect/style/systemmaterial)。

```rust tabs
view().backdrop_blur(px(30.0)).backdrop_material(BackdropMaterial::Regular)
```

```tsx tabs
<View ios={{ backdropMaterial: "regular" }} style={{ height: 64, backdropFilter: "blur(30px)" }} />
```

`glassEffect` 在 iOS 26 和 macOS 26 及更新版本上，於 view 內容後方繪製 Liquid Glass。`"regular"` 使用標準 material；`"clear"` 從背景取色較少。搭配 `backdropFilter` 可在較早的 iOS 版本和其他平台上顯示模糊效果。玻璃效果會跟隨 view 的尺寸和圓角。

```tsx
<View style={{ height: 80, borderRadius: 16, backdropFilter: "blur(12px)", glassEffect: "regular" }} />
```

<a id="outlines-opacity-and-visibility"></a>

## Outline、不透明度和可見性

- `outlineWidth`、`outlineColor`、`outlineStyle`、`outlineOffset`（`.outline(..)`、`.outline_color(..)`、`.outline_dashed()`、`.outline_offset(..)`）：位於邊框外側、不佔用空間的線條（負數 offset 則繪製在內側）。`outlineStyle: "none"`（或 `"hidden"`、`.outline_none()`）會隱藏 outline，不論其寬度為何，與 CSS 相同。
- `opacity`（`.opacity(n)`）：0 至 1，套用於 view 及其子元素。
- `visibility: "hidden"`（Rust 中為 `.invisible()`）：view 不會被繪製但仍保留空間，螢幕閱讀器會略過它及其子樹，與瀏覽器相同。`display: "none"`（`.hidden()`）會把它從 layout 中移除。
- `zIndex`（`.z_index(n)`）：同層元素之間的順序，也是原生的堆疊順序（值相同時順序穩定）。
- `cursor`（`.cursor(..)`、`.cursor_pointer()`）：指標在 view 上方的形狀，適用於指標裝置和桌面平台。
<a id="transforms"></a>

## 變形

Transforms 沿用 CSS 的設計。在 TSX 中,`translate`、`rotate` 和 `scale` 各自是獨立的屬性,而 `transform` 接受 CSS 的函數字串或步驟清單;無論鍵的書寫次序如何,它們都按 CSS 的順序組合,即 `translate`、`rotate`、`scale`,然後 `transform`。在 Rust 中,transform 以方法呈現(`.translate_x(..)`、`.rotate(..)`、`.scale(..)` 等),並以相同順序組合:

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

| 屬性 | 值 |
|---|---|
| `translate` | `"10px 20px"`、`"-50% 0"`(視圖自身尺寸的百分比)、數字(沿 x 軸的點數),或 `[x, y]`,每個軸可使用數字、字串或動畫值 |
| `rotate` | `"45deg"`、`"0.25turn"`、繞軸 `"x 90deg"` 旋轉、數字(度數)或動畫值(度數) |
| `scale` | `1.5`、`"150%"`、`"1 2"`(x 與 y)、動畫值(兩個軸)或 `[x, y]` |
| `transform` | CSS 的函數:`translate()`、`translateX()`、`translateY()`、`scale()`、`scaleX()`、`scaleY()`、`rotate()` / `rotateZ()`、`rotateX()`、`rotateY()`、`skew()`、`skewX()`、`skewY()`、`perspective()`;長度使用 `px`(位移亦可使用 `%`),角度使用 `deg`、`rad` 或 `turn`;`"none"`;或步驟清單(`[{ perspective: 800 }, { rotateY: angle }]`),其數量可以是動畫值 |

與 class 一樣,每一項都是獨立的屬性:樣式的 `scale` 會取代 `scale-95` class,並保留其 `rotate-3`。動畫值可以原生驅動 `translate`、`rotate` 和 `scale`;對於 CSS 字串無法配合動畫數量表達的內容(例如 3D 旋轉),請為 `transform` 提供步驟清單:`translateX`、`translateY`、`scale`、`scaleX`、`scaleY`、`rotate`(`rotateZ`)、`rotateX`、`rotateY`、`skewX`、`skewY` 和 `perspective`([動畫](./animation.md))。樣式的 `transform` 只能採用其中一種形式,因此放在動畫步驟之前的透視效果,須作為清單中的一個步驟。

Rust 的 `.perspective(..)` 即 CSS 的 `perspective` 屬性,與 Tailwind 的 `perspective-*` 相同:它為視圖的子視圖提供深度,而 `transform` 的 `perspective()` 函數則作用於視圖自身的 transform。`transformOrigin` 接受關鍵字、百分比和長度(`"top left"`、`"50% 0"`、`[10, 20]`;Rust 中為 `.origin_top_left()`、`.transform_origin(..)`);預設為中心。Transform 不會影響版面配置:同級視圖的位置仍按該視圖未經變形時計算。

Android 不支援傾斜(skew)變形。

<a id="transitions"></a>

## 過渡

只要指明要為哪些項目加上動畫,視圖便會對自身樣式的變化產生動畫。動畫以原生方式執行,每一幀都不會執行你的程式碼。

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

| 屬性 | 值 | Rust |
|---|---|---|
| `transitionProperty` | 要加上動畫的項目:`"all"`,或以逗號分隔的名稱:顏色(`"colors"`、`"backgroundColor"`、`"borderColor"` 等)、`"opacity"`、`"transform"`(所有 transform 屬性)、`"boxShadow"`、`"borderRadius"` / `"borderWidth"` | `.transition()`、`.transition_all()`、`.transition_colors()`、`.transition_opacity()`、`.transition_transform()`、`.transition_shadow()` |
| `transitionDuration` | `300`、`"300ms"`、`"0.3s"` | `.duration(300.0)` |
| `transitionDelay` | 與 duration 相同 | `.delay(100.0)` |
| `transitionTimingFunction` | `"linear"`、`"ease"`、`"ease-in"`、`"ease-out"`、`"ease-in-out"`、`"cubic-bezier(x1, y1, x2, y2)"` | `.ease_linear()`、`.ease_in()`、`.ease_out()`、`.ease_in_out()`、`.ease_bezier(x1, y1, x2, y2)` |

尺寸和位置屬於版面配置而非樣式,因此不會產生過渡;版面配置的變化請使用 `LayoutAnimation` 加上動畫,或以原生動畫驅動數值([動畫](./animation.md))。

<a id="keyframe-animations"></a>

### Keyframe 動畫

`animationName` 會以原生方式執行 Tailwind 內建的其中一個 keyframe 動畫:`"spin"`、`"ping"`、`"pulse"` 或 `"bounce"`,並可按任意次序搭配 `animationDuration`、`animationDelay`、`animationTimingFunction` 和 `animationIterationCount`(數字或 `"infinite"`)。在 Rust 中,`.animate_spin()`、`.animate_ping()`、`.animate_pulse()` 和 `.animate_bounce()` 會以 Tailwind 的時序執行這些動畫,而 `.animation(KeyframeAnimation::new(..))` 則使用你自訂的時序:

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

## 按壓回饋

按壓回饋是應用程式為按下狀態所設的樣式,以原生方式套用,無需回到你的程式碼;懸停、取得焦點和停用狀態也以相同方式接受樣式(Rust 中為 `.hover(..)`、`.focus(..)`、`.disabled_style(..)`;TSX 中為 `hoverStyle`、`focusStyle` 和 `disabledStyle`,或 `hover:`、`focus:`、`disabled:`):

| Rust | TSX | 按下時的效果 |
|---|---|---|
| `.active(\|s\| s.opacity(0.6))` | `activeStyle={{ opacity: 0.6 }}` | 視圖淡化至此不透明度 |
| `.active(\|s\| s.bg(rgb(0xeaeef2)))` | `activeStyle={{ backgroundColor: "#eaeef2" }}` | 背景變為此顏色 |
| `.ripple(Ripple { color: Some(rgba(0x00000022).into()), ..Ripple::default() })` | `android={{ ripple: { color: "#0002" } }}` | Android 的 material ripple |
| `.active(\|s\| s.bg(ZINC.shade(100)).scale(0.95))` | `class="active:bg-zinc-100 active:scale-95"` | 任何樣式 |

請參閱[觸控與手勢](./touch-and-gestures.md)。

<a id="extensions"></a>

## 擴充功能

以下的鍵和 class 提供原生平台在 CSS 以外的能力:

| 鍵 | Class | 作用 |
|---|---|---|
| `placeholderColor` | `placeholder:text-*` | `<Input>` 的預留位置顏色 |
| `selectionColor` | `selection:bg-*` | `<Input>` 或可選取的 `<Text>` 的選取醒目標示 |
| `tintColor` | `tint-*` | 為 `<Image>` 的不透明像素重新著色(template 圖像、圖示) |
| `borderCurve` | | `"continuous"`:圓角平滑地過渡到邊緣,與系統本身一致(Apple 的 continuous corners) |
| `glassEffect` | | 在 iOS 26 和 macOS 26 上,於視圖後方顯示 Apple 的 Liquid Glass,其他平台則使用 `backdropFilter` |
| `writingDirection` | | 文字的基本方向,`"auto"`(預設:依內容決定,與各平台的文字視圖一致)、`"ltr"` 或 `"rtl"`;`direction` 設定的是版面配置的方向 |
| `textAlignVertical` | | 比其 `<Text>` 框短的文字所處的位置:`"top"`(預設)、`"center"` 或 `"bottom"` |
| `textAlign: "auto"` | | 文字依其方向而定的自然一側(預設) |
| `selectedStyle` | `selected:` | `accessibilityState.selected` 為 `true` 時的樣式(已選取的 `Button`、分頁標籤) |
| | `ios:`、`android:`、`web:` | 針對單一平台的 class(`ios:pt-2`) |

在 CSS 使用字串的地方,會變化的值也接受數字:`transform` 使用步驟清單,`translate` 和 `scale` 使用 `[x, y]`,`boxShadow` 和 `textShadow` 使用圖層。

<a id="related"></a>

## 相關內容

- [Tailwind](./tailwind.md):以 class 形式表達相同的樣式,並提供深色模式、按下狀態和斷點的 variant,以及它們的型別化對應項目。
- [版面配置](./layout.md)與[文字](./text.md)。
- [樣式參考](../modules/style-reference.md):所有樣式屬性及其型別。
