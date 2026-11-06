---
title: "樣式設計"
description: "Rust 中的型別化樣式方法與 TSX 中的 style prop:flexbox、grid 與 CSS 效果,包含顏色、邊框、圓角、陰影、漸層、濾鏡、變形與轉場,以及各平台之間的差異。"
order: 32
group: ui
demo: guide-styling
---

# 樣式

每個元素都使用相同的原生樣式，並有兩種寫法。在 Rust 中，樣式是鏈接在元素上的具型別方法（`.p_4()`、`.rounded(px(12.0))`、`.bg(color)`）；在 TSX 中，則是由 camelCase 屬性組成的 `style` prop，或 [Tailwind class](./tailwind.md)。兩者都包含 CSS 功能，例如 box shadow、漸層、濾鏡、外框、transition 與 grid，而且只有變更過的屬性才會傳送到原生 view。

這三種寫法描述的是同一組屬性，意義也相同。屬性名稱沿用 CSS（少數採用應用程式常用的較簡單名稱，例如 `paddingHorizontal`、`marginStart` 與 `numberOfLines`），而 CSS 的值（顏色、漸層、濾鏡、陰影、transform、對齊關鍵字）與 Tailwind utility 的含義與在網頁上相同，每個 Rust 方法與 utility 所設定的內容都等同於 Tailwind CSS 4 為其產生的結果，因此你在網頁上學到的知識可以直接沿用：`paddingLeft` 就是 `padding-left` 與 `pl-4`，`boxShadow` 就是 `box-shadow`，`display: "flex"` 如同 `flex` class 一樣是橫列。其餘部分則是為原生應用程式而設計：長度單位是 point（`16`、`"50%"`、`"auto"`；class 可使用 `rem` 以及 CSS 的其他單位），預設值採用原生版面配置的預設值（列於下方），會變動的值使用數字而非字串（`translate: [x, 0]`、陰影的各層），而各平台在 CSS 之外提供的功能則有專屬的[擴充功能](#extensions)。

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

本頁說明樣式如何組合，以及視覺相關屬性。版面配置屬性（flexbox、grid、尺寸、位置）請見[版面配置](./layout.md)，文字屬性請見[文字](./text.md)，所有屬性及其型別則列於[樣式參考](../modules/style-reference.md)。

<a id="combining-styles"></a>

## 組合樣式

在 Rust 中，共用樣式是接收元素並回傳已套用樣式之元素的函式，條件則就是一般的 Rust：`.when(condition, |v| ..)` 用於建立元素時已知的條件，`.style_when(signal, |s| ..)` 用於在應用程式執行期間切換的樣式。在 TSX 中，`style` 接受一個物件，或由左至右合併的物件陣列；falsy 的項目（`false`、`null`、`undefined`）會被略過，因此條件式樣式可以寫得很簡短：

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

在 TSX 中，請將共用樣式定義為元件外部的常數（搭配 `as const`，讓 TypeScript 保留 `"row"` 這類字面值型別）。只需要一個一般物件即可：樣式在每次設定時都會於 Rust 中解析，不需要事先註冊任何物件。

讀取 signal 的樣式會跟隨 signal 變化：在 Rust 中，為方法傳入閉包（`.bg(move || ..)`），signal 改變時只會重新設定該屬性；在 TSX 中，讀取 signal 的樣式運算式會被重新建立，而 NSH 只會傳送值不同的屬性：

```rust tabs
view()
    .p_3()
    .bg(move || if selected.get() { rgb(0xddf4ff) } else { rgb(0xffffff) })
```

```tsx tabs
<View style={{ backgroundColor: selected() ? "#ddf4ff" : "#ffffff", padding: 12 }} />
```

當 TSX 元素同時使用兩者時，`style` 優先於 `class`：class 會先套用，再於其上套用 inline style。設為 `undefined` 的鍵不會設定任何內容（`backgroundColor: active ? accent : undefined` 在未啟用時會保留 class 的顏色）；`null` 則會設定為預設值。在 Rust 中，對同一屬性而言，後呼叫的方法會覆蓋先呼叫的方法。

在同一個樣式內（一個物件，或合併成一個的陣列），鍵的順序不會造成差異：較具體的屬性優先於其簡寫，`borderTopWidth` 優先於 `borderWidth`，`borderLeftColor` 優先於 `borderColor`，`marginTop` 優先於 `marginVertical`，再優先於 `margin`（padding 亦同），`rowGap` 優先於 `gap`，`flexGrow` 優先於 `flex`，`gridColumnStart` 優先於 `gridColumn`。此時若具體屬性設為 `null`，則會顯示簡寫的值。

<a id="units-and-values"></a>

## 單位與值

- **長度為 point**（與密度無關的像素）：Rust 中的 `px(100.0)` 與 TSX 中的 `width: 100` 都是 100pt，在 2× 或 3× 螢幕上相當於 200 或 300 個實體像素。
- **百分比**（Rust 中的 `relative(0.5)`、TSX 中的 `"50%"`）相對於父元素，適用於尺寸、位置、margin 與 padding（[版面配置](./layout.md)）。
- **角度**在 Rust 中為 `deg(45.0)`、`radians(0.5)` 或 `turn(0.25)`，在 TSX 中則為以度為單位的數字，或帶單位的字串：`45`、`"45deg"`、`"0.5rad"`；CSS 的 `rotate` 與 `transform` 也接受 `"0.25turn"`，而在 `transform` 字串內，每個角度都必須帶單位。
- **時間長度**以毫秒為單位：Rust 中為 `.duration(150.0)`，TSX 中為數字或字串（`"150ms"`、`"0.2s"`）。

<a id="defaults"></a>

## 預設值

未設定某個屬性時，會套用 NSH 的預設值：

| | 預設值 |
|---|---|
| view 子元素的版面配置 | 直欄（具有 `flexDirection: "column"` 的 flex 容器）；`display: "flex"` 會形成橫列，除非設定了 `flexDirection`，與 CSS 相同 |
| `flexShrink` | `0`（子元素除非要求，否則不會縮小） |
| `alignContent` | `"flex-start"`（在 grid 中為 CSS 的 `"normal"`） |
| `position` | `"relative"` |
| `minWidth` / `minHeight` | `0` |
| `backgroundColor` | 透明 |
| 文字 | 黑色、14pt、字重 400 |
| 邊框與外框顏色 | 文字顏色（CSS 的 `currentColor`） |

新建立的 view 在你為其指定樣式之前完全不帶任何樣式，因此未設定樣式的包裝元素在原生端不會有任何額外成本。

<a id="colors"></a>

## 顏色

在 Rust 中，顏色是具型別的值：`rgb(0x0099ff)`、`rgba(0x0099ffcc)`、`hsla(..)`、`white()`、`black()`，以及 Tailwind 的色盤 `nsh_core::element::palette`（`BLUE.shade(500)`）。顏色方法接受 `AdaptiveColor`，也就是一組淺色值與深色值：`AdaptiveColor::rgb(0xffffff, 0x0d1117)` 會在原生端隨系統外觀切換，無需重新 render。來自應用程式主題的顏色（`theme().primary`，來自 `nsh_base`）同樣具有適應性（[Rust](./rust.md#theme)）。

在 TSX 中，顏色屬性接受 CSS 顏色字串：

| 形式 | 範例 |
|---|---|
| 十六進位 | `"#09f"`、`"#09fc"`、`"#0099ff"`、`"#0099ffcc"` |
| `rgb()` / `rgba()` | `"rgb(0, 153, 255)"`、`"rgba(0, 0, 0, 0.5)"`、`"rgb(0 0 0 / 10%)"` |
| `hsl()` / `hsla()` | `"hsl(210 100% 50%)"` |
| `oklch()` / `oklab()` | `"oklch(62.3% 0.214 259.8)"` |
| 具名顏色 | `"white"`、`"black"`、`"transparent"`、`"rebeccapurple"`、…… |
| `currentColor` | `"currentColor"`：文字顏色，也可用於漸層、陰影、`drop-shadow()` 或 `color-mix()` 之內（`"color-mix(in srgb, currentColor 50%, transparent)"`）；class 則寫成 `bg-current`、`border-current/50`、`bg-[color-mix(in_srgb,currentColor_50%,transparent)]` |

在 TSX 中處理深色模式時，請從 `nsh` 讀取 [`colorScheme()`](../modules/nsh.md#device)，它是會跟隨系統外觀的 accessor，或使用 Tailwind 的 `dark:` variant：

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

對於顏色以外的樣式，Rust 中的 `.dark(|s| ..)` 會在深色外觀下套用樣式，而 `dark()` 則用來讀取目前外觀。預設文字顏色在兩種外觀下都是黑色：在支援深色模式的應用程式中，請明確設定顏色。

<a id="borders-and-corners"></a>

## 邊框與圓角

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

- **各邊的寬度與顏色**：`borderTopWidth`、`borderRightWidth`、……、`borderTopColor`、……，無論版面方向為何，都固定對應其所屬的邊；以及 `borderStartWidth`、`borderEndWidth`、`borderStartColor`、`borderEndColor`，它們會跟隨[版面方向](./layout.md#right-to-left)（在 Rust 中為 `.border_t(..)`、`.border_t_color(..)`、`.border_s(..)`、`.border_e_color(..)`、……）。
- **顏色**：若某一邊設定了寬度但未設定顏色，其顏色為文字顏色，如同 CSS 的 `currentColor`：`{ borderWidth: 1, color: "#0969da" }` 會繪製藍色邊框。
- **各角的圓角半徑**：`borderTopLeftRadius`、`borderTopRightRadius`、`borderBottomRightRadius`、`borderBottomLeftRadius`，以及 `borderTopStartRadius` / `borderTopEndRadius` / `borderBottomStartRadius` / `borderBottomEndRadius`（上起始、上結束、下起始、下結束），它們會跟隨[版面方向](./layout.md#right-to-left)（在 Rust 中為 `.rounded_tl(..)`、……、`.rounded_ss(..)`、`.rounded_se(..)`、`.rounded_es(..)`、`.rounded_ee(..)`，以及預設值 `.rounded_lg()`、`.rounded_full()`、……）。
- **`borderCurve: "continuous"`**（`.border_curve(BorderCurve::Continuous)`）會繪製曲率平順銜接邊緣的圓角，如同 iOS App 圖示，在兩個平台上皆然。膠囊形（`borderRadius` 為高度的一半）仍會維持膠囊形。
- **`overflow: "hidden"`**（`.overflow_hidden()`）會將子元素裁切成圓角形狀。被裁掉的部分在版面配置中同樣被裁切：它不會影響外層 scroll view 的內容尺寸，因此，若某個方塊將子元素排得比自身更寬，再以 `transform` 將其縮小（transform 不影響版面配置），scroll view 不會受到影響。

大於邊長一半的圓角半徑會被限制，因此 `borderRadius: 9999`（`.rounded_full()`）會形成圓形或膠囊形。

<a id="shadows"></a>

## 陰影

view 會投射 CSS 的 `boxShadow`，Android 另外加上其 material elevation：

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

`boxShadow` 遵循 CSS：`offsetX offsetY blur spread color`，內陰影則使用 `inset`。它也可以用數字傳入各層，這是用於會變動之值的形式，不會建立字串：`boxShadow: [{ x: 0, y: 6, blur: 18, spread: 0, color: "#0000004d", inset: false }]`（只有 `x` 與 `y` 為必要；未指定顏色的層使用文字顏色）。Rust 則接受各層，`.shadow([BoxShadow { .. }])`。陰影會跟隨 view 的圓角形狀，且 transition 可以為其製作動畫（`transitionProperty: "boxShadow"`、`.transition_shadow()`）。Tailwind 的預設值在 Rust 中為 `.shadow_sm()`、`.shadow_md()`、`.shadow_lg()`、……，而 `.shadow_color(..)` 會替其各層重新上色。跟隨透明 view 內容（例如圖示的字形）的陰影是 `filter: "drop-shadow(...)"`（[濾鏡](#filters-and-blending)）；文字則有 `textShadow`（[文字](./text.md)）。

> [!NOTE]
> 在 Android 上，陰影需要背景：背景透明的 view（例如沒有背景的文字）不會投射陰影。

<a id="gradients"></a>

## 漸層

`backgroundImage` 接受 CSS 漸層，繪製在背景顏色之上；在 Rust 中為 `.bg_linear(angle)`、`.bg_radial()` 與 `.bg_conic(angle)`，搭配色標 `.gradient_from(..)`、`.gradient_via(..)` 與 `.gradient_to(..)`，如同 Tailwind 的 `bg-linear-*` 搭配 `from-*`、`via-*` 與 `to-*`。在 TSX 中，多個漸層以逗號分隔。

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

色標在線性或放射狀漸層中以百分比或長度擺放（`px`、`pt`、`rem`；純數字為 point），在圓錐漸層中則以百分比或角度環繞擺放（`deg`、`turn`、`rad`、`grad`）。具有兩個位置的色標（`#8250df 0 12px`）會形成單一顏色的色帶，位於相同位置的兩個色標亦同。長度是依 view 目前的尺寸沿著漸層線測量，因此 12px 的色帶在 view 調整大小時仍保持 12px 寬。

色標之間的顏色混合方式與 CSS 相同：在漸層所指定的色彩空間中混合（`linear-gradient(in oklab, …)`；另有 `srgb`、`srgb-linear`、`xyz`、`oklch` 搭配如 `longer hue` 的色相方法，以及 `hsl`）；未指定時，若每個顏色都是十六進位、`rgb()`、`hsl()` 或具名顏色，則在 sRGB 中混合，若其中有 `oklch()`、`oklab()`、`lab()`、`lch()` 或 `color()`，則在 Oklab 中混合。

在 iOS 上，文字元素不會繪製漸層。

<a id="filters-and-blending"></a>

## 濾鏡與混合

| 屬性 | 值 | Rust |
|---|---|---|
| `filter` | view 及其內容的 CSS 濾鏡：`brightness()`、`contrast()`、`grayscale()`、`hue-rotate()`、`invert()`、`saturate()`、`sepia()`、`opacity()`、`blur()`、`drop-shadow()`（未指定顏色時使用文字顏色，與 CSS 相同）；多個濾鏡以空格分隔 | `.brightness(n)`、`.contrast(n)`、`.grayscale(n)`、`.hue_rotate(angle)`、`.invert(n)`、`.saturate(n)`、`.sepia(n)`、`.blur(px(..))` |
| `backdropFilter` | view 後方內容的濾鏡：`"blur(10px)"`（毛玻璃） | `.backdrop_blur(px(10.0))`、`.backdrop_saturate(n)`、…… |
| `glassEffect` | `"regular"` 或 `"clear"` 用於 iOS 26 與 macOS 26 以後版本的 Apple Liquid Glass；`"none"`（預設值）則使用 `backdropFilter` | `.glass_effect(GlassEffect::Regular)` |
| `mixBlendMode` | view 與其後方內容的混合方式：`"multiply"`、`"screen"`、`"overlay"`、…… | `.mix_blend_mode(BlendMode::Multiply)` |

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

各平台的支援程度不同：

| | iOS | Android |
|---|---|---|
| view 上的 `filter` | 僅支援 `opacity`、最高到 1 的 `brightness`，以及 `drop-shadow` | 全部支援，自 Android 12（API 31）起；更低版本僅支援顏色濾鏡 |
| image 上的 `filter` | 所有顏色濾鏡與 `blur` | 與 view 相同 |
| `backdropFilter` | 系統模糊材質，近似指定的半徑 | 自 Android 12（API 31）起 |
| `mixBlendMode` | 支援 | 自 Android 10（API 29）起 |

Web、Windows 與 Linux 會對 view 套用所有濾鏡，macOS 則與 iOS 相同；GPUI 會繪製顏色濾鏡與 `drop-shadow()`。backdrop filter 在 iOS、macOS 與 Android 上是模糊效果，在 Web 與 Windows 上則支援所有濾鏡；Linux 與 GPUI 不繪製任何 backdrop filter，且 GPUI 以一般混合模式繪製 view。對於含有多個 `drop-shadow()` 的 `filter`，iOS、macOS 與 Android 只會繪製最後一個。`mixBlendMode` 會將 view 與其後方已繪製的所有內容混合。

在 iOS 上，`ios={{ backdropMaterial: "regular" }}` 會選擇 `backdropFilter` 模糊所使用的系統材質。可用的值為 `"ultraThin"`（預設值）、`"thin"`、`"regular"`、`"thick"` 與 `"chrome"`。請將此 prop 搭配正的模糊半徑，才會顯示該材質。Rust 則將 `.backdrop_material(BackdropMaterial::Regular)` 與 `.backdrop_blur(px(30.0))` 搭配使用。半徑用來近似材質的強度：NSH 只套用所選材質的一部分，在 30 point 時達到完整強度。淺色或深色變體會跟隨 view 的背景顏色。這些選項對應 Apple 的[系統模糊材質](https://developer.apple.com/documentation/uikit/uiblureffect/style/systemmaterial)。

```rust tabs
view().backdrop_blur(px(30.0)).backdrop_material(BackdropMaterial::Regular)
```

```tsx tabs
<View ios={{ backdropMaterial: "regular" }} style={{ height: 64, backdropFilter: "blur(30px)" }} />
```

`glassEffect` 會在 iOS 26 與 macOS 26 以後版本中，於 view 內容後方繪製 Liquid Glass。`"regular"` 使用標準材質；`"clear"` 從背景取得的顏色較少。請搭配 `backdropFilter`，以在較早的 iOS 版本與其他平台上顯示模糊效果。玻璃效果會跟隨 view 的尺寸與圓角。

```tsx
<View style={{ height: 80, borderRadius: 16, backdropFilter: "blur(12px)", glassEffect: "regular" }} />
```

<a id="outlines-opacity-and-visibility"></a>

## 外框、不透明度與可見性

- `outlineWidth`、`outlineColor`、`outlineStyle`、`outlineOffset`（`.outline(..)`、`.outline_color(..)`、`.outline_dashed()`、`.outline_offset(..)`）：位於邊框外側且不佔用空間的線條（負的偏移量則繪製在內側）。`outlineStyle: "none"`（或 `"hidden"`、`.outline_none()`）無論寬度為何都會隱藏外框，與 CSS 相同。
- `opacity`（`.opacity(n)`）：0 到 1，套用於 view 及其子元素。
- `visibility: "hidden"`（Rust 中為 `.invisible()`）：view 不會被繪製但仍保留其空間，螢幕閱讀器會略過它及其子樹，與瀏覽器相同。`display: "none"`（`.hidden()`）則會將其從版面配置中移除。
- `zIndex`（`.z_index(n)`）：同層元素之間的順序，同時也是原生的堆疊順序（值相同時順序穩定）。
- `cursor`（`.cursor(..)`、`.cursor_pointer()`）：指標移到 view 上方時的形狀，適用於指標裝置與桌面平台。
<a id="transforms"></a>

## 變形（Transforms）

變形沿用 CSS 的規則。在 TSX 中，`translate`、`rotate` 與 `scale` 各自是獨立的屬性，`transform` 則接受 CSS 的函式字串或步驟清單；它們依 CSS 的順序組合，先 `translate`，再 `rotate`，再 `scale`，最後 `transform`，與鍵的順序無關。在 Rust 中，變形是方法（`.translate_x(..)`、`.rotate(..)`、`.scale(..)` 等），依相同順序組合：

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
| `translate` | `"10px 20px"`、`"-50% 0"`（檢視自身大小的百分比）、數字（沿 x 軸的點數），或 `[x, y]`，其每個軸可為數字、字串或動畫值 |
| `rotate` | `"45deg"`、`"0.25turn"`、繞軸 `"x 90deg"` 旋轉、數字（度）或動畫值（度） |
| `scale` | `1.5`、`"150%"`、`"1 2"`（x 與 y）、動畫值（兩個軸）或 `[x, y]` |
| `transform` | CSS 的函式：`translate()`、`translateX()`、`translateY()`、`scale()`、`scaleX()`、`scaleY()`、`rotate()` / `rotateZ()`、`rotateX()`、`rotateY()`、`skew()`、`skewX()`、`skewY()`、`perspective()`；長度使用 `px`（位移也可用 `%`），角度使用 `deg`、`rad` 或 `turn`；`"none"`；或步驟清單（`[{ perspective: 800 }, { rotateY: angle }]`），其數量可為動畫值 |

與 class 一樣，每個屬性都各自獨立：樣式中的 `scale` 會取代 `scale-95` class，並保留其 `rotate-3`。動畫值可原生驅動 `translate`、`rotate` 與 `scale`；若要處理 CSS 字串無法搭配動畫數量表達的內容（例如 3D 旋轉），請為 `transform` 提供步驟清單：`translateX`、`translateY`、`scale`、`scaleX`、`scaleY`、`rotate`（`rotateZ`）、`rotateX`、`rotateY`、`skewX`、`skewY` 與 `perspective`（[動畫](./animation.md)）。樣式的 `transform` 只能採用其中一種形式，因此置於動畫步驟之前的透視（perspective）要作為清單中的一個步驟。

Rust 的 `.perspective(..)` 即 CSS 的 `perspective` 屬性，等同於 Tailwind 的 `perspective-*`：它為檢視的子檢視提供深度，而 `transform` 的 `perspective()` 函式則作用於檢視自身的變形。`transformOrigin` 接受關鍵字、百分比與長度（`"top left"`、`"50% 0"`、`[10, 20]`；Rust 中為 `.origin_top_left()`、`.transform_origin(..)`）；預設為中心。變形不會影響版面：同層的其他檢視仍依照該檢視未變形時的位置排列。

Android 不支援傾斜（skew）變形。

<a id="transitions"></a>

## 轉場（Transitions）

只要指定要產生動畫的內容，檢視就會對自身樣式的變化產生動畫。動畫以原生方式執行，每一影格都不會執行你的程式碼。

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
| `transitionProperty` | 要產生動畫的內容：`"all"`，或以逗號分隔的名稱：顏色（`"colors"`、`"backgroundColor"`、`"borderColor"` 等）、`"opacity"`、`"transform"`（所有變形屬性）、`"boxShadow"`、`"borderRadius"` / `"borderWidth"` | `.transition()`、`.transition_all()`、`.transition_colors()`、`.transition_opacity()`、`.transition_transform()`、`.transition_shadow()` |
| `transitionDuration` | `300`、`"300ms"`、`"0.3s"` | `.duration(300.0)` |
| `transitionDelay` | 與持續時間相同 | `.delay(100.0)` |
| `transitionTimingFunction` | `"linear"`、`"ease"`、`"ease-in"`、`"ease-out"`、`"ease-in-out"`、`"cubic-bezier(x1, y1, x2, y2)"` | `.ease_linear()`、`.ease_in()`、`.ease_out()`、`.ease_in_out()`、`.ease_bezier(x1, y1, x2, y2)` |

尺寸與位置屬於版面而非樣式，因此不會產生轉場；版面的變化請使用 `LayoutAnimation`，或以原生動畫驅動數值（[動畫](./animation.md)）。

<a id="keyframe-animations"></a>

### 關鍵影格動畫

`animationName` 會以原生方式執行 Tailwind 內建的其中一種關鍵影格動畫：`"spin"`、`"ping"`、`"pulse"` 或 `"bounce"`，並可搭配 `animationDuration`、`animationDelay`、`animationTimingFunction` 與 `animationIterationCount`（數字或 `"infinite"`），順序不拘。在 Rust 中，`.animate_spin()`、`.animate_ping()`、`.animate_pulse()` 與 `.animate_bounce()` 會以 Tailwind 的時間設定執行這些動畫，`.animation(KeyframeAnimation::new(..))` 則使用你自訂的設定：

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

按壓回饋是應用程式為按下狀態所定義的樣式，以原生方式套用，不需要回到你的程式碼；懸停、聚焦與停用狀態也以相同方式接受樣式（Rust 中為 `.hover(..)`、`.focus(..)`、`.disabled_style(..)`；TSX 中為 `hoverStyle`、`focusStyle` 與 `disabledStyle`，或 `hover:`、`focus:`、`disabled:`）：

| Rust | TSX | 按下時的效果 |
|---|---|---|
| `.active(\|s\| s.opacity(0.6))` | `activeStyle={{ opacity: 0.6 }}` | 檢視淡化至此不透明度 |
| `.active(\|s\| s.bg(rgb(0xeaeef2)))` | `activeStyle={{ backgroundColor: "#eaeef2" }}` | 背景變為此顏色 |
| `.ripple(Ripple { color: Some(rgba(0x00000022).into()), ..Ripple::default() })` | `android={{ ripple: { color: "#0002" } }}` | Android 的 Material 漣漪效果 |
| `.active(\|s\| s.bg(ZINC.shade(100)).scale(0.95))` | `class="active:bg-zinc-100 active:scale-95"` | 任何樣式 |

請參閱[觸控與手勢](./touch-and-gestures.md)。

<a id="extensions"></a>

## 擴充功能

以下的鍵與 class 提供原生平台在 CSS 之外所具備的功能：

| 鍵 | Class | 作用 |
|---|---|---|
| `placeholderColor` | `placeholder:text-*` | `<Input>` 的預留位置文字顏色 |
| `selectionColor` | `selection:bg-*` | `<Input>` 或可選取的 `<Text>` 的選取醒目提示 |
| `tintColor` | `tint-*` | 為 `<Image>` 的不透明像素重新上色（範本影像、圖示） |
| `borderCurve` | | `"continuous"`：與邊緣平滑銜接的圓角，如同系統原生的圓角（Apple 的連續圓角） |
| `glassEffect` | | 在 iOS 26 與 macOS 26 上，於檢視後方套用 Apple 的 Liquid Glass，其他平台則使用 `backdropFilter` |
| `writingDirection` | | 文字的基準方向，`"auto"`（預設：依內容決定，如同各平台的文字檢視）、`"ltr"` 或 `"rtl"`；`direction` 則設定版面的方向 |
| `textAlignVertical` | | 文字短於其 `<Text>` 方塊時所在的位置：`"top"`（預設）、`"center"` 或 `"bottom"` |
| `textAlign: "auto"` | | 依文字方向決定的自然對齊側（預設） |
| `selectedStyle` | `selected:` | 當 `accessibilityState.selected` 為 `true` 時的樣式（被選取的 `Button`、分頁） |
| | `ios:`、`android:`、`web:` | 僅適用於單一平台的 class（`ios:pt-2`） |

在 CSS 使用字串的地方，會變動的值也可使用數字：`transform` 使用步驟清單，`translate` 與 `scale` 使用 `[x, y]`，`boxShadow` 與 `textShadow` 使用圖層。

<a id="related"></a>

## 相關內容

- [Tailwind](./tailwind.md)：以 class 表示的相同樣式，並提供深色模式、按下狀態與斷點的變體，以及對應的型別版本。
- [版面配置](./layout.md)與[文字](./text.md)。
- [樣式參考](../modules/style-reference.md)：所有樣式屬性及其型別。
