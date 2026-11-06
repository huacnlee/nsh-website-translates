---
title: "樣式參考"
description: "NSH 支援的所有樣式鍵,依 LayoutStyle、ViewStyle、TextStyle、InputStyle 與 ImageStyle 分組,並列出其型別與說明。"
order: 16
source_hash: 012ce37fb9fe065c
---

# 樣式參考

本頁列出 `style` prop 的每一個鍵，以及 `Styled` 中在 Rust 裡設定該鍵的方法。Rust 元件使用以 Tailwind 工具類別命名的具型別方法（`.p_4()`、`.rounded(px(12.0))`、`.bg(color)`，來自 `nsh_core::prelude`）來設定元素樣式，這些方法最終會轉換為相同的鍵；TSX 則傳入 `style` 物件（以及 class）。Rust 欄位列出對應的方法；大多數方法可接受值、signal 或閉包，而 `.style_when(…)` / `.style_with(…)` 可讓其中任何一個變成有條件的。鍵與其型別來自 `.nsh/types/nsh/types.d.ts` 中產生的宣告，因此編輯器會在你輸入時進行檢查。樣式鍵代表與其同名的 CSS 屬性，與設定該屬性的 class 相同：`paddingLeft` 即 CSS 的 `padding-left` 與 `pl-4`，`boxShadow` 即 `box-shadow` 與 `shadow-md`；少數鍵採用應用程式中較常寫的簡單名稱（`paddingHorizontal` 對應 `padding-inline`、`marginStart` 對應 `margin-inline-start`、`numberOfLines` 對應 `line-clamp`）。數值的單位為 point，同時也支援各種 CSS 功能：grid、漸層、盒子陰影、濾鏡、混合模式、外框、變形、轉場與關鍵影格動畫。

關於如何套用樣式、如何與 class 結合以及如何繼承文字樣式，請參閱[樣式設定](../docs/styling.md)。關於 class 語法，請參閱 [Tailwind 參考](./tailwind-reference.md)。

<a id="the-five-interfaces"></a>

## 五個介面

每個介面都擴充自前一個介面：

| 介面 | 擴充自 | 使用於 |
|---|---|---|
| `LayoutStyle` | | 所有元素的版面配置（flexbox、grid、尺寸、間距、定位） |
| `ViewStyle` | `LayoutStyle` | `<View>`、`<Scroll>`、`<List>`、控制項以及其他所有元素 |
| `TextStyle` | `ViewStyle` | `<Text>` 與 `<Input>`（以及檢視，其文字樣式會傳遞給內部的文字） |
| `InputStyle` | `TextStyle` | `<Input>`：新增 `placeholderColor` 與 `caretColor` |
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

`style` 也接受陣列；項目會由左至右合併，並略過為 falsy 的項目，因此條件式樣式不需要展開。在 Rust 中，`.style_when(condition, …)` 會在條件成立時加入樣式：

```rust tabs
card().style_when(selected, |s| s.border_color(rgb(0x2563eb)).border(px(2.0)))
```

```tsx tabs
<View style={[card, selected() && { borderColor: "#2563eb", borderWidth: 2 }]} />
```

> [!NOTE]
> 行內的 `style` 一律優先於 `class`。將鍵設為 `null` 或 `undefined` 會將其重設為預設值。

<a id="how-style-keys-read"></a>

## 樣式鍵的語意

樣式鍵遵循 CSS，因此指定同一屬性的樣式與 class 效果相同：

- **版面方向。** 未設定 `display` 的檢視會將子元素以直欄排列。`display: "flex"` 為橫列，除非設定了 `flexDirection`，這與 CSS 及 `flex` class 相同。`flexShrink` 在未設定時為 `0`。
- **實體邊與邏輯邊。** `left`、`right`、`marginLeft`、`paddingRight`、`borderLeftWidth`、`borderTopLeftRadius` 與 `textAlign: "left"` 在由右至左的版面中仍保持其所指的邊。起點與終點鍵（`marginStart`、`paddingEnd`、`start`、`end`、`borderStartWidth` 等）、`borderTopStartRadius` 系列與 `textAlign: "start" | "end"` 則會依方向而變：行內起點在由左至右的版面中是左側，在由右至左的版面中是右側。
- **邊框顏色。** 已設定寬度但未設定顏色的邊框或外框，會以文字顏色繪製（即 CSS 的 `currentColor`）。
- **變形。** `translate`、`rotate` 與 `scale` 各自是獨立的屬性，而 `transform` 接受 CSS 的函式字串，或由多個步驟組成的清單，其數量可以是動畫值。它們依此順序組合：`translate`、`rotate`、`scale`，最後是 `transform`。

<a id="value-types"></a>

## 值型別

| 型別 | 接受 | Rust |
|---|---|---|
| `number` | Point（與像素密度無關）。`1` 在 iOS 上為一個 point，在 Android 上為一個 dp。 | `Points`：`px(16.0)` |
| `DimensionValue` | `number`（point）、`` `${number}%` ``（相對於父元素），或 `"auto"`。 | `Length`：`px(…)`、`relative(0.5)`、`auto()` |
| `LengthValue` | `number`（point）或 `` `${number}%` ``。不接受 `"auto"`。 | `DefiniteLength`：`px(…)`、`relative(0.5)` |
| `ColorValue` | CSS 顏色字串：`#rgb`、`#rgba`、`#rrggbb`、`#rrggbbaa`、`rgb()`、`rgba()`、`hsl()`、`hsla()`、`oklch()`、`oklab()`，或具名的 CSS 顏色（`black`、`white`、`transparent`、`rebeccapurple` 等）。 | `Hsla` / `AdaptiveColor`：`rgb(0x2563eb)`、`hsla(…)`、主題顏色（`theme().primary`） |
| `EnvValue` | 用於內距或外距的環境變數：`env(name)`、`env(name, <length>)`（長度會取代未知的名稱）、`calc(env(name) + <length>)` 或 `calc(<length> + env(name))`。名稱有 `safe-area-inset-top`、`-right`、`-bottom`、`-left`（[安全區域](../elements/safe-area.md)）以及 `keyboard-inset-height`（[鍵盤](../elements/keyboard.md)）。實體的內距與外距鍵及其簡寫都可接受。 | `.p_safe_area()`、`.pt_safe_area_plus(px(8.0))`、`.pb_keyboard()`、`.mb_keyboard_plus(…)` 等 |
| `AnimatedNode` | 原生動畫值，或由其衍生的節點（請參閱 [`nsh` 的動畫 API](./nsh.md#animation)）。可用於 `opacity`、`backgroundColor`、`borderColor`、`color`、`translate`、`rotate`、`scale`、`transform` 清單的各個步驟，以及 sticky 檢視的 `top` / `left`；該值接著會在 UI 執行緒上以動畫呈現，無需 JS。 | `AnimatedValue` / `AnimatedNode`，以 `.bind_opacity(&v)`、`.bind_background(&v)`、`.bind_border_color(&v)`、`.bind_color(&v)`、`.bind_translate_x(&v)` 等綁定 |

使用 CSS 語法的字串（`boxShadow`、`textShadow`、`backgroundImage`、`filter`、`gridTemplateColumns` 等）接受以 `px` 與純數字（皆為 point）、`pt`（4/3 point，與 CSS 相同）或 `rem`（16 point）表示的長度。

## LayoutStyle

版面配置在 Rust 中計算（flexbox 與 CSS grid）。未設定 `display` 的檢視是一個 flex 容器，其子元素以直欄堆疊；`display: "flex"` 會使其成為橫列，除非設定了 `flexDirection`，這與 CSS 相同。元素的預設值為 `flexShrink: 0`、`alignContent: "flex-start"`（grid：CSS 的 `"normal"`）、`alignItems: "stretch"`，且沒有自動最小尺寸。請參閱[版面配置](../docs/layout.md)。

<a id="display-and-position"></a>

### 顯示與定位

| 鍵 | 型別 | Rust | 說明 |
|---|---|---|---|
| `display` | `"flex" \| "grid" \| "block" \| "flow-root" \| "none"` | `.flex()`、`.grid()`、`.hidden()` | 子元素的版面配置。`"flex"` 會將子元素排成橫列，除非 `flexDirection` 指定了方向，這與 CSS 相同；未設定 display 的檢視會將子元素排成直欄。`"none"` 會將元素從版面配置中移除並隱藏。`"block"` 會如 CSS 區塊版面配置般堆疊子元素。 |
| `boxSizing` | `"border-box" \| "content-box"` | | 尺寸包含邊框與內距，或僅含內容。預設為 `"border-box"`。 |
| `position` | `"relative" \| "absolute" \| "static" \| "fixed" \| "sticky"` | `.relative()`、`.absolute()` | `"absolute"` 會使元素脫離文件流，並依 `top` / `right` / `bottom` / `left` 相對於其最近的已定位祖先定位（除非父元素為 `"static"`，否則即為其父元素）。`"static"` 維持在文件流中並忽略位移量。`"fixed"` 會保留元素型別，並在其 surface 或 modal root 中進行版面配置與掛載，使其在周圍內容捲動時保持原位。`"sticky"` 維持在文件流中，且當其父元素位於可視範圍內時，會從周圍捲動檢視的視口起點開始黏附 `top`（在橫向捲動檢視中為 `left`），直到其終點與父元素內容盒的終點相接為止；它會繪製在相同 `zIndex` 的同層元素之上。預設為 `"relative"`。 |
| `top` | `DimensionValue \| AnimatedNode` | `.top(…)`、`.inset(…)`、`.bind_sticky_top(&node)` | 距父元素上緣的位移（absolute），或距元素自身位置的位移（relative）。在 sticky 檢視上，則指其黏附的位置，動畫值可在每個影格移動它。 |
| `right` | `DimensionValue` | `.right(…)` | 距右緣的位移，在任一方向下皆然。 |
| `bottom` | `DimensionValue` | `.bottom(…)` | 距下緣的位移。 |
| `left` | `DimensionValue \| AnimatedNode` | `.left(…)`、`.bind_sticky_left(&node)` | 距左緣的位移，在任一方向下皆然。在橫向捲動檢視中的 sticky 檢視上，則指其黏附的位置，動畫值可在每個影格移動它。 |
| `start` | `DimensionValue` | | 距行內起點邊緣的位移：在由左至右的版面中為左側，在由右至左的版面中為右側。 |
| `end` | `DimensionValue` | | 距行內終點邊緣的位移：在由左至右的版面中為右側，在由右至左的版面中為左側。 |
| `zIndex` | `number` | `.z_index(z)` | 同層元素之間的順序（值相同時順序穩定）；同時也是原生的堆疊順序。 |
| `direction` | `"inherit" \| "ltr" \| "rtl"` | | 版面方向，預設為繼承。與 CSS 相同，`left` 與 `right` 屬性在由右至左時仍保持其所指的邊，而行內起點 / 終點屬性（`marginStart`、`end` 等）則採用方向所決定的邊。 |

### Flexbox

| 鍵 | 型別 | Rust | 說明 |
|---|---|---|---|
| `flexDirection` | `"row" \| "column" \| "row-reverse" \| "column-reverse"` | `.flex_row()`、`.flex_col()`、`.flex_row_reverse()`、`.flex_col_reverse()` | 主軸。未設定 `display` 的檢視預設為 `"column"`，一旦設定了 `display: "flex"` 則為 `"row"`。 |
| `flexWrap` | `"wrap" \| "nowrap" \| "wrap-reverse"` | `.flex_wrap()` | 子元素是否換行成多行。預設為 `"nowrap"`。 |
| `flex` | `number` | `.flex_1()`、`.flex_auto()`、`.flex_none()` | 單一數字，並非 CSS 的簡寫：正數會將 `flexGrow` 設為該值，`flexShrink: 1` 與 `flexBasis: 0`；`0` 會使元素不具彈性；負數會使元素縮小至其最小尺寸。 |
| `flexGrow` | `number` | `.flex_grow(f)` | 元素佔用多少剩餘空間。預設為 `0`。 |
| `flexShrink` | `number` | `.flex_shrink(f)`、`.flex_shrink_0()` | 空間不足時元素縮小多少。預設為 `0`，而非 CSS 中的 `1`。 |
| `flexBasis` | `DimensionValue` | `.basis(…)` | 分配剩餘空間之前的主軸尺寸。 |
| `justifyContent` | `"flex-start" \| "flex-end" \| "start" \| "end" \| "center" \| "space-between" \| "space-around" \| "space-evenly" \| "stretch" \| "normal"` | `.justify_start()`、`.justify_center()`、`.justify_end()`、`.justify_between()`、`.justify_around()`、`.justify_evenly()` | 子元素沿主軸的分佈。預設為 `"normal"`：在 flex 容器中為 `"flex-start"`；在 grid 中，尺寸為 `auto` 的軌道會被拉伸。 |
| `alignItems` | `"flex-start" \| "flex-end" \| "start" \| "end" \| "self-start" \| "self-end" \| "center" \| "stretch" \| "baseline" \| "normal"` | `.items_start()`、`.items_center()`、`.items_end()`、`.items_stretch()`、`.items_baseline()` | 子元素在交叉軸上的對齊。預設為 `"stretch"`。 |
| `alignSelf` | `"auto" \| "flex-start" \| "flex-end" \| "start" \| "end" \| "self-start" \| "self-end" \| "center" \| "stretch" \| "baseline" \| "normal"` | `.self_start()`、`.self_center()`、`.self_end()`、`.self_stretch()` | 為此元素覆寫父元素的 `alignItems`。 |
| `alignContent` | `"flex-start" \| "flex-end" \| "start" \| "end" \| "center" \| "stretch" \| "space-between" \| "space-around" \| "space-evenly" \| "normal"` | `.content_start()`、`.content_center()`、`.content_between()`、… | 換行後的各行（以及 grid 軌道）在交叉軸上的分佈。在 flex 容器中預設為 `"flex-start"`，在 grid 中為 `"normal"`，其中尺寸為 `auto` 的軌道會被拉伸。`"start"` / `"end"` 依書寫方向而定。 |
| `gap` | `LengthValue` | `.gap(…)`、`.gap_4()` | 子元素的列與欄之間的間距。 |
| `rowGap` | `LengthValue` | `.gap_y(…)` | 列與列之間的間距。 |
| `columnGap` | `LengthValue` | `.gap_x(…)` | 欄與欄之間的間距。 |

### Grid

設定 `display: "grid"` 即可以 CSS grid 排列子元素。軌道清單使用 CSS 語法。

| 鍵 | 型別 | Rust | 說明 |
|---|---|---|---|
| `gridTemplateColumns` | `string` | `.grid_template_columns(…)`、`.grid_cols(n)` | 欄軌道：`"repeat(3, 1fr)"`、`"200px 1fr"`、`minmax()`、`auto-fill` / `auto-fit`、線名稱（`"[a] 40px [b c] 1fr [d]"`）。 |
| `gridTemplateRows` | `string` | `.grid_template_rows(…)`、`.grid_rows(n)` | 列軌道，語法相同。 |
| `gridAutoColumns` | `string` | | 隱式建立之欄的尺寸。 |
| `gridAutoRows` | `string` | | 隱式建立之列的尺寸。 |
| `gridAutoFlow` | `"row" \| "column" \| "dense" \| "row dense" \| "column dense"` | `.grid_flow_col()`、`.grid_flow_dense()` | 未指定位置的項目如何填入 grid。 |
| `gridColumn` | `number \| string` | `.col_span(n)`、`.col_span_full()` | 欄的位置：`"1 / 3"`、`"span 2"`、線編號或線名稱（`"content-start / content-end"`、`"2 col"`、`"span col"`）。 |
| `gridColumnStart` | `number \| string` | `.col_start(…)` | 欄的起始線。 |
| `gridColumnEnd` | `number \| string` | `.col_end(…)` | 欄的結束線。 |
| `gridRow` | `number \| string` | `.row_span(n)`、`.row_span_full()` | 列的位置，語法與 `gridColumn` 相同。 |
| `gridRowStart` | `number \| string` | `.row_start(…)` | 列的起始線。 |
| `gridRowEnd` | `number \| string` | `.row_end(…)` | 列的結束線。 |
| `justifyItems` | `"flex-start" \| "flex-end" \| "start" \| "end" \| "self-start" \| "self-end" \| "center" \| "stretch" \| "baseline" \| "normal"` | | grid 項目在其區域內沿列方向的位置。 |
| `justifySelf` | `"auto" \| "flex-start" \| "flex-end" \| "start" \| "end" \| "self-start" \| "self-end" \| "center" \| "stretch" \| "baseline" \| "normal"` | | 為此項目覆寫 `justifyItems`。 |

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

<a id="size"></a>

### 尺寸

| 鍵 | 型別 | Rust | 說明 |
|---|---|---|---|
| `width` | `DimensionValue` | `.w(…)`、`.w_full()`、`.size(…)` | 寬度。 |
| `height` | `DimensionValue` | `.h(…)`、`.h_full()` | 高度。 |
| `minWidth` | `LengthValue` | `.min_w(…)` | 最小寬度。 |
| `minHeight` | `LengthValue` | `.min_h(…)` | 最小高度。 |
| `maxWidth` | `LengthValue` | `.max_w(…)` | 最大寬度。 |
| `maxHeight` | `LengthValue` | `.max_h(…)` | 最大高度。 |
| `aspectRatio` | `number \| "auto" \| "16 / 9"` | `.aspect_ratio(r)`、`.aspect_square()` | 寬度除以高度，可為數字（`1.5`）或 CSS 的比例（`"16 / 9"`）；缺少的尺寸會由另一個尺寸計算得出。`"auto"` 表示不設定。 |

<a id="margin"></a>

### 外距

外距接受 `"auto"`（吸收剩餘空間，與 flexbox 相同）與負值。實體鍵（除了 `marginStart` / `marginEnd` 之外的所有鍵）也接受 `EnvValue`：`marginBottom: "env(keyboard-inset-height)"`（Rust 為 `.mb_keyboard()`、`.mt_safe_area()` 等）。

| 鍵 | 型別 | Rust | 說明 |
|---|---|---|---|
| `margin` | `DimensionValue \| EnvValue` | `.m(…)`、`.m_4()` | 四邊。 |
| `marginHorizontal` | `DimensionValue \| EnvValue` | `.mx(…)` | 左與右。 |
| `marginVertical` | `DimensionValue \| EnvValue` | `.my(…)` | 上與下。 |
| `marginTop` | `DimensionValue \| EnvValue` | `.mt(…)` | 上。 |
| `marginRight` | `DimensionValue \| EnvValue` | `.mr(…)` | 右。 |
| `marginBottom` | `DimensionValue \| EnvValue` | `.mb(…)` | 下。 |
| `marginLeft` | `DimensionValue \| EnvValue` | `.ml(…)` | 左。 |
| `marginStart` | `DimensionValue` | `.ms(…)` | 行內起點：在由左至右的版面中為左側，在由右至左的版面中為右側。 |
| `marginEnd` | `DimensionValue` | `.me(…)` | 行內終點：與 `marginStart` 相反的一側。 |

<a id="padding"></a>

### 內距

實體鍵（除了 `paddingStart` / `paddingEnd` 之外的所有鍵）也接受 `EnvValue`：`paddingTop: "env(safe-area-inset-top)"`、`paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)"`（Rust 為 `.pt_safe_area()`、`.pb_safe_area_plus(px(16.0))`、`.pb_keyboard()` 等）。內距至少為 0。

| 鍵 | 型別 | Rust | 說明 |
|---|---|---|---|
| `padding` | `LengthValue \| EnvValue` | `.p(…)`、`.p_4()` | 四邊。 |
| `paddingHorizontal` | `LengthValue \| EnvValue` | `.px(…)` | 左與右。 |
| `paddingVertical` | `LengthValue \| EnvValue` | `.py(…)` | 上與下。 |
| `paddingTop` | `LengthValue \| EnvValue` | `.pt(…)` | 上。 |
| `paddingRight` | `LengthValue \| EnvValue` | `.pr(…)` | 右。 |
| `paddingBottom` | `LengthValue \| EnvValue` | `.pb(…)` | 下。 |
| `paddingLeft` | `LengthValue \| EnvValue` | `.pl(…)` | 左。 |
| `paddingStart` | `LengthValue` | `.ps(…)` | 行內起點：在由左至右的版面中為左側，在由右至左的版面中為右側。 |
| `paddingEnd` | `LengthValue` | `.pe(…)` | 行內終點：與 `paddingStart` 相反的一側。 |

## ViewStyle

由檢視繪製的所有內容。`LayoutStyle` 的所有鍵也同樣適用。

<a id="background"></a>

### 背景

| 鍵 | 型別 | Rust | 說明 |
|---|---|---|---|
| `backgroundColor` | `ColorValue \| AnimatedNode` | `.bg(color)`、`.bind_background(&node)` | 填色。接受原生動畫顏色。 |
| `backgroundImage` | `string` | `.bg_linear(angle)`、`.bg_radial()`、`.bg_conic()` 搭配 `.gradient_from` / `_via` / `_to` | 繪製於背景色之上的 CSS 漸層：`linear-gradient(...)`、`radial-gradient(...)`、`conic-gradient(...)`，可用逗號分隔多個。 |

```rust tabs
view().h(px(120.0)).rounded(px(16.0)).bg_linear(deg(135.0)).gradient_from(rgb(0x6366f1)).gradient_to(rgb(0xec4899))
```

```tsx tabs
<View style={{ height: 120, borderRadius: 16, backgroundImage: "linear-gradient(135deg, #6366f1, #ec4899)" }} />
```
<a id="borders"></a>

### 邊框

| 鍵 | 型別 | Rust | 說明 |
|---|---|---|---|
| `borderWidth` | `number` | `.border(w)`, `.border_1()`, `.border_2()` | 四邊的寬度。 |
| `borderTopWidth` | `number` | `.border_t(w)` | 上邊。 |
| `borderRightWidth` | `number` | `.border_r(w)` | 右邊。 |
| `borderBottomWidth` | `number` | `.border_b(w)` | 下邊。 |
| `borderLeftWidth` | `number` | `.border_l(w)` | 左邊。 |
| `borderStartWidth` | `number` | `.border_s(w)` | 行內起始邊（由左至右的版面為左側，由右至左的版面為右側）。 |
| `borderEndWidth` | `number` | `.border_e(w)` | 行內結束邊。 |
| `borderColor` | `ColorValue \| AnimatedNode` | `.border_color(c)`, `.bind_border_color(&node)` | 四邊的顏色。可接受原生動畫顏色。 |
| `borderTopColor` | `ColorValue` | `.border_t_color(c)` | 上邊。 |
| `borderRightColor` | `ColorValue` | `.border_r_color(c)` | 右邊。 |
| `borderBottomColor` | `ColorValue` | `.border_b_color(c)` | 下邊。 |
| `borderLeftColor` | `ColorValue` | `.border_l_color(c)` | 左邊。 |
| `borderStartColor` | `ColorValue` | `.border_s_color(c)` | 行內起始邊。 |
| `borderEndColor` | `ColorValue` | `.border_e_color(c)` | 行內結束邊。 |
| `borderStyle` | `"solid" \| "dashed" \| "dotted" \| "none" \| "hidden"` | `.border_solid()`, `.border_dashed()`, `.border_dotted()`, `.border_none()` | 線條樣式。預設為 `"solid"`。無論寬度為何、設定在此之前或之後，`"none"` 與 `"hidden"` 都不會繪製邊框，也不佔用版面，與 CSS 相同。 |

若某一邊設定了寬度，但沒有任何地方設定顏色，則以文字顏色繪製，即 CSS 的 `currentColor`：`{ borderWidth: 1, color: "#2563eb" }` 會繪製藍色邊框。外框線也以同樣方式採用文字顏色。

<a id="corners"></a>

### 圓角

| 鍵 | 型別 | Rust | 說明 |
|---|---|---|---|
| `borderRadius` | `number` | `.rounded(r)`, `.rounded_lg()` | 四個圓角的半徑。 |
| `borderTopLeftRadius` | `number` | `.rounded_tl(r)` | 左上角。 |
| `borderTopRightRadius` | `number` | `.rounded_tr(r)` | 右上角。 |
| `borderBottomRightRadius` | `number` | `.rounded_br(r)` | 右下角。 |
| `borderBottomLeftRadius` | `number` | `.rounded_bl(r)` | 左下角。 |
| `borderTopStartRadius` | `number` | `.rounded_ss(r)` | 行內起始側的上方圓角。 |
| `borderTopEndRadius` | `number` | `.rounded_se(r)` | 行內結束側的上方圓角。 |
| `borderBottomStartRadius` | `number` | `.rounded_es(r)` | 行內起始側的下方圓角。 |
| `borderBottomEndRadius` | `number` | `.rounded_ee(r)` | 行內結束側的下方圓角。 |
| `borderCurve` | `"circular" \| "continuous"` | `.border_curve(curve)` | `"continuous"`：曲率平滑過渡到邊緣的圓角，就像 iOS 應用程式圖示。當方框太小時，曲線會退回為圓弧，因此膠囊形仍維持膠囊形。兩個平台皆適用。 |

<a id="outline"></a>

### 外框線

外框線繪製於邊框之外，不佔用版面空間。

| 鍵 | 型別 | Rust | 說明 |
|---|---|---|---|
| `outlineWidth` | `number` | `.outline(w)` | 線條寬度。 |
| `outlineColor` | `ColorValue` | `.outline_color(c)` | 線條顏色。預設為文字顏色。 |
| `outlineStyle` | `"solid" \| "dashed" \| "dotted" \| "none" \| "hidden"` | `.outline_dashed()`, `.outline_dotted()`, `.outline_none()` | 線條樣式。 |
| `outlineOffset` | `number` | `.outline_offset(o)` | 與邊框邊緣的距離；負值會將其移到內側。 |

<a id="shadows"></a>

### 陰影

檢視使用 CSS 的 `boxShadow` 投射陰影：支援多層、擴散與內陰影。轉場可為其加上動畫（`transitionProperty: "boxShadow"`）。

| 鍵 | 型別 | Rust | 說明 |
|---|---|---|---|
| `boxShadow` | `string \| BoxShadowLayer[]` | `.shadow([BoxShadow { … }])`, `.shadow_md()`, `.shadow_color(c)` | CSS 的 `box-shadow`：偏移、模糊、擴散與顏色，多個圖層以逗號分隔，內陰影使用 `inset`；或以數字表示其圖層，`[{ x, y, blur, spread, color, inset }]`（只有 `x` 與 `y` 為必填）；沒有顏色的圖層以文字顏色繪製，如同 CSS 的 `currentColor`。`.shadow_color(c)` 會為預設值或 `.shadow(…)` 的圖層重新上色。 |

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
> 在 Android 上，陰影需要背景：背景透明的檢視（例如沒有底的文字）不會投射陰影。若要使用 Android 的 material 陰影，請改用 `android={{ elevation }}` 屬性，而非樣式。

<a id="opacity-visibility-and-overflow"></a>

### 不透明度、可見性與溢出

| 鍵 | 型別 | Rust | 說明 |
|---|---|---|---|
| `opacity` | `number \| AnimatedNode` | `.opacity(o)`, `.bind_opacity(&value)` | 0（不可見）到 1。可接受原生動畫值。 |
| `visibility` | `"visible" \| "hidden" \| "collapse"` | | 隱藏的檢視會在版面中保留其空間（與 `display: "none"` 不同）。 |
| `overflow` | `"visible" \| "hidden"` | `.overflow_hidden()` | `"hidden"` 會將子檢視裁切至該檢視的邊界（及圓角）。 |
| `backfaceVisibility` | `"visible" \| "hidden"` | `.backface_hidden()`, `.backface_visible()` | `"hidden"`：當 3D 旋轉使其背對時不可見。 |
| `verticalAlign` | `"baseline" \| "text-top" \| "text-bottom" \| "middle"` | `.align_baseline()`, `.align_text_top()`, `.align_text_bottom()`, `.align_middle()` | 位於 `<Text>` 內的檢視或圖片在行中的位置，如同 CSS 的 `vertical-align`：底部對齊基線（預設）、頂部或底部對齊文字字型的頂部或底部，或其中線位於基線上方 x 高度一半處。行高會隨之增加以容納它。 |

<a id="transforms"></a>

### 轉換

轉換沿用 CSS 的做法：`translate`、`rotate` 與 `scale` 屬性以及 `transform`，依此順序組合。每個都是獨立的屬性，因此樣式的 `scale` 會取代 class 的 `scale-*` 並保留其 `rotate-*`，而樣式的 `transform` 會取代 class 的轉換函式（`rotate-x-*`、`skew-*`）。

| 鍵 | 型別 | Rust | 說明 |
|---|---|---|---|
| `translate` | `string \| number \| AnimatedNode \| [x, y]` | `.translate_x(…)`, `.translate_y(…)`; `.bind_translate_x(&v)`, `.bind_translate_y(&v)` | CSS 的 `translate`：先 x，再 y（`"10px 20px"`；為檢視自身尺寸的百分比，`"-50% 0"`）。單一數字表示沿 x 軸的點數。`[x, y]` 每個軸可接受數字、字串（`"50%"`、`"10px"`）或動畫值；單獨一個動畫值只會沿 x 軸移動。 |
| `rotate` | `string \| number \| AnimatedNode` | `.rotate(deg(…))`; `.bind_rotate(&v)` | CSS 的 `rotate`：`"45deg"`、`"0.5turn"`，或繞某個軸旋轉，`"x 90deg"`。數字與動畫值皆表示繞 z 軸順時針旋轉的角度。 |
| `scale` | `string \| number \| AnimatedNode \| [x, y]` | `.scale(f)`, `.scale_x(f)`, `.scale_y(f)`; `.bind_scale(&v)` | CSS 的 `scale`：`1.5`、`"150%"`、x 與 y（`"1 2"`）。動畫值會同時縮放兩個軸；`[x, y]` 每個軸可接受數字或動畫值。 |
| `transform` | `string \| TransformStep[]` | `.rotate_x(…)`, `.rotate_y(…)`, `.skew_x(…)`, `.skew_y(…)`, `.transform_none()`; 動畫步驟：`.bind_transform(kind, &v)`, `.bind_motion(&m)`（位於所有樣式轉換之後） | CSS 的 `transform`：`"translateX(10px) rotate(45deg) scale(1.5)"`，或 `"none"`。函式：`translate()`、`translateX()`、`translateY()`、`scale()`、`scaleX()`、`scaleY()`、`rotate()` / `rotateZ()`、`rotateX()`、`rotateY()`、`skew()`、`skewX()`、`skewY()`、`perspective()`。長度接受 `px`（位移也接受 `%`，為檢視自身尺寸的比例），角度接受 `deg`、`rad` 或 `turn`。也可以是步驟清單，其數值可為動畫值：用於字串無法表達的內容，例如動畫化的 3D 旋轉（`[{ perspective: 800 }, { rotateY: angle }]`），以及動態的通道（`m.transform`）。樣式的 `transform` 只能擇一種形式，因此位於動畫步驟之前的透視是清單中的一個步驟。在 `translate`、`rotate` 與 `scale` 之後套用。 |
| `transformOrigin` | `string \| (number \| string)[]` | `.transform_origin(…)`, `.origin_top_left()`, ... | 轉換所圍繞的基準點：關鍵字、百分比與長度（`"top left"`、`"50% 0"`、`[10, 20]`）。預設為中心。 |

`TransformStep` 是只有一個鍵的物件，依清單順序套用：

| 步驟 | 值 | 原生動畫 |
|---|---|---|
| `translateX`, `translateY` | `number`（點數） | 是 |
| `scale`, `scaleX`, `scaleY` | `number`（倍率） | 是 |
| `rotate`, `rotateZ`, `rotateX`, `rotateY` | `number`（度數）或 `string`（`"45deg"`、`"0.5rad"`） | 是 |
| `skewX`, `skewY` | `number`（度數）或 `string` | 否 |
| `perspective` | `number`（點數） | 否 |

```rust tabs
view().perspective(px(600.0)).child(view().rotate_y(deg(20.0)).scale(0.95))
```

```tsx tabs
<View style={{ transform: "perspective(600px) rotateY(20deg) scale(0.95)" }} />
```

動畫值可直接驅動 `translate`、`rotate` 與 `scale`，以及 `transform` 清單的各個步驟：

```tsx
const x = createAnimatedValue(0);
const angle = createAnimatedValue(0);

<View style={{ translate: [x, 0], rotate: angle }} />
<View style={{ transform: [{ perspective: 800 }, { rotateY: angle }] }} />
```

> [!NOTE]
> Android 不繪製傾斜：`skew()`、`skewX()` 與 `skewY()` 在該平台上不會使檢視傾斜。

<a id="filters-and-blending"></a>

### 濾鏡與混合

| 鍵 | 型別 | Rust | 說明 |
|---|---|---|---|
| `filter` | `string` | `.blur(r)`, `.brightness(…)`, `.contrast(…)`, `.grayscale(…)`, `.hue_rotate(…)`, `.invert(…)`, `.saturate(…)`, `.sepia(…)` | 檢視及其內容的 CSS 濾鏡：`brightness()`、`contrast()`、`grayscale()`、`hue-rotate()`、`invert()`、`saturate()`、`sepia()`、`opacity()`、`blur()`、`drop-shadow()`。 |
| `backdropFilter` | `string` | `.backdrop_blur(r)`, `.backdrop_brightness(…)`, ... | 檢視後方內容的 CSS 濾鏡，例如以 `"blur(10px)"` 製作毛玻璃效果。 |
| `maskImage` | `string` | | CSS 漸層，其 alpha 決定檢視被繪製的程度：不透明處完全繪製，透明處完全不繪製：`linear-gradient(...)`、`radial-gradient(...)`、`conic-gradient(...)`。會遮罩檢視繪製的所有內容，包括其背景濾鏡。 |
| `glassEffect` | `"none" \| "regular" \| "clear"` | `.glass_effect(GlassEffect::Regular)` | 在 iOS 26 與 macOS 26 及更新版本上，於檢視內容後方呈現 Liquid Glass。`"regular"` 使用標準材質；`"clear"` 從背景取得的顏色較少。預設為 `"none"`。搭配 `backdropFilter` 可在較早的 iOS 版本與其他平台上顯示模糊效果。 |
| `mixBlendMode` | `"normal" \| "multiply" \| "screen" \| "overlay" \| "darken" \| "lighten" \| "color-dodge" \| "color-burn" \| "hard-light" \| "soft-light" \| "difference" \| "exclusion" \| "hue" \| "saturation" \| "color" \| "luminosity" \| "plus-darker" \| "plus-lighter"` | `.mix_blend_mode(mode)` | 檢視與其後方內容的混合方式。 |

> [!WARNING]
> 平台限制：
> - iOS 對檢視只套用 `opacity()`、最高為 1 的 `brightness()`，以及 `drop-shadow()`。`<Image>` 接受所有色彩濾鏡與 `blur()`，並在圖片解碼時套用。
> - iOS 的 `backdropFilter` 模糊使用部分強度的系統材質，是對精確半徑的近似。
> - Android 需要 API 31 才支援 `blur()`、`drop-shadow()` 與 `backdropFilter`；低於此版本只會套用色彩濾鏡。混合模式需要 API 29。

<a id="transitions"></a>

### 轉場

當設定了轉場的屬性發生變化時（來自新的樣式、class 或如 `active:` 的變體），平台會以原生方式為其加上動畫。動畫期間不會執行任何 JS。

| 鍵 | 型別 | Rust | 說明 |
|---|---|---|---|
| `transitionProperty` | `string` | `.transition()`, `.transition_all()`, `.transition_colors()`, `.transition_opacity()`, `.transition_shadow()`, `.transition_transform()`, `.transition_none()` | 以逗號分隔、要套用動畫的屬性：`"all"`、`"colors"`（`color`、`backgroundColor`、`borderColor` 等）、`"opacity"`、`"transform"`（所有轉換屬性）、`"boxShadow"`、`"borderRadius"`、`"borderWidth"`，或 `"none"`。 |
| `transitionDuration` | `number \| "${number}ms" \| "${number}s"` | `.duration(ms)` | 以數字表示毫秒，或 `"150ms"` / `"0.2s"`。 |
| `transitionDelay` | `number \| "${number}ms" \| "${number}s"` | `.delay(ms)` | 轉場開始前的延遲。 |
| `transitionTimingFunction` | `"linear" \| "ease" \| "ease-in" \| "ease-out" \| "ease-in-out" \| "cubic-bezier(...)"` | `.ease_linear()`, `.ease_in()`, `.ease_out()`, `.ease_in_out()`, `.ease_bezier(…)` | 緩動曲線。 |

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

### 關鍵影格動畫

內建的關鍵影格動畫，以原生方式執行（Tailwind 的 `animate-*`）。

| 鍵 | 型別 | Rust | 說明 |
|---|---|---|---|
| `animationName` | `"none" \| "spin" \| "ping" \| "pulse" \| "bounce"` | `.animate_spin()`, `.animate_ping()`, `.animate_pulse()`, `.animate_bounce()`, `.animate_none()` | 動畫。 |
| `animationDuration` | `number \| "${number}ms" \| "${number}s"` | `.animation(KeyframeAnimation { … })` | 單次迭代的時長。 |
| `animationDelay` | `number \| "${number}ms" \| "${number}s"` | `.animation(KeyframeAnimation { … })` | 第一次迭代前的延遲。 |
| `animationTimingFunction` | `"linear" \| "ease" \| "ease-in" \| "ease-out" \| "ease-in-out" \| "cubic-bezier(...)"` | `.animation(KeyframeAnimation { … })` | 緩動曲線。 |
| `animationIterationCount` | `number \| "infinite"` | `.animation(KeyframeAnimation { … })` | 執行次數。 |

若動畫由數值、手勢或彈簧驅動，請改用 [`nsh` 的動畫 API](./nsh.md#animation)。

<a id="pointer-and-selection"></a>

### 指標與選取

| 鍵 | 型別 | Rust | 說明 |
|---|---|---|---|
| `cursor` | `"auto" \| "default" \| "pointer" \| "text" \| "grab" \| "grabbing" \| "not-allowed" \| ...`（所有 CSS cursor 關鍵字，以及 `"none"`） | `.cursor(Cursor)`, `.cursor_pointer()` | 指標在檢視上方的形狀，適用於指標裝置（iPad 觸控板、Mac Catalyst、桌面）。對角線調整大小的關鍵字會保留其軸向：`nwse-resize` / `nw-resize` / `se-resize`（`Cursor::NwseResize`）與 `nesw-resize` / `ne-resize` / `sw-resize`（`Cursor::NeswResize`）。Windows、Linux、Android、網頁與 GPUI 會顯示對角線游標；AppKit 在 macOS 15+ 上使用對角線游標，在 macOS 14 上則使用張開的手。UIKit 在 iPad 與 Mac Catalyst 上使用指標效果。 |
| `pointerEvents` | `"auto" \| "none" \| "box-none" \| "box-only"` | `.pointer_events(PointerEvents::BoxNone)` | 檢視及其內部檢視接受哪些觸控（`pointer-events-none`、`pointer-events-auto`）。`"none"`：全部不接受，其內部檢視也一樣，除非其中某個設定了 `"auto"`，其繼承方式與 CSS 相同。`"box-none"`：檢視本身不接受，其內部檢視各自接受；`"box-only"`：檢視本身接受，其內部檢視不接受（兩者皆為 React Native 的行為，僅針對該檢視本身）。預設為 `"auto"`。請參閱[觸控與手勢](../docs/touch-and-gestures.md#pointerevents)。 |
| `userSelect` | `"auto" \| "none" \| "text"` | `.select_text()`, `.select_none()` | `<Text>` 是否可以被選取與複製（`"text"`、`select-text`）或不可（`"none"`、`select-none`）；檢視上的設定會作用於其內部未設定此項的文字。預設的 `"auto"`（`select-auto`）交由外層檢視決定，否則由平台決定。請參閱[文字](../elements/text.md)。 |

<a id="svg-paint"></a>

### SVG 繪製

SVG 圖形的 CSS 繪製屬性，任何元素都可以使用，其內部的元素會繼承，與瀏覽器相同。
它們用來繪製 Rust 元件在畫布上繪製的內容。

| 鍵 | 型別 | Rust | 說明 |
|---|---|---|---|
| `fill` | `"none" \| "currentColor" \| ColorValue` | `.fill_color(c)`, `.fill_none()`, `.fill_current()` | 圖形的填色內容；`currentColor` 為元素的文字顏色。 |
| `stroke` | `"none" \| "currentColor" \| ColorValue` | `.stroke_color(c)`, `.stroke_none()`, `.stroke_current()` | 圖形輪廓的繪製內容。 |
| `strokeWidth` | `number \| string` | `.stroke_width(w)` | 這些輪廓的寬度，為長度值（預設為 1）。 |
| `strokeDasharray` | `number \| string` | — | 這些輪廓上的虛線與間隔：以空格或逗號分隔的長度（`"4 2"`），奇數個項目的清單會重複，或 `"none"`。 |

## TextStyle

文字樣式適用於 `<Text>` 與 `<Input>`。它們同樣會被繼承，與 CSS 相同：設定在檢視上的文字屬性會傳遞給其內部的文字與輸入框，而巢狀的 `<Text>` span 會繼承其父文字。`ViewStyle` 的所有鍵也都適用。請參閱[文字](../docs/text.md)。

<a id="font"></a>

### 字型

| 鍵 | 型別 | Rust | 說明 |
|---|---|---|---|
| `color` | `ColorValue \| AnimatedNode` | `.text_color(c)`, `.bind_color(&node)` | 文字顏色。可接受原生動畫顏色。也是未設定顏色的邊框與外框線所用的顏色。 |
| `fontSize` | `number` | `.text_size(s)`, `.text_sm()`, `.text_lg()`, ... | 以點為單位的大小。 |
| `fontWeight` | `"normal" \| "bold" \| number \| "${number}"` | `.font_weight(FontWeight::SEMIBOLD)` | `"normal"`（400）、`"bold"`（700）或 100–900。 |
| `fontFamily` | `string` | `.font_family(name)` | 系統字型家族，或匯入字型所解析出的名稱（`import Inter from "./Inter.ttf"`），或由多者組成的清單，最優先者在前（`"Brand, 'Noto Sans SC', sans-serif"`）。請參閱[字型](../docs/fonts.md#fallback-lists)。 |
| `fontStyle` | `"normal" \| "italic"` | `.italic()` | 斜體。 |
| `fontVariant` | `FontVariantName[] \| string` | `.small_caps()`, `.oldstyle_nums()`, `.lining_nums()`, `.tabular_nums()`, `.proportional_nums()` | OpenType 的數字與字母字形，可為清單（`["tabular-nums"]`）或以空格分隔的 CSS 名稱（`"tabular-nums small-caps"`）。`tabular-nums` 讓數字保持等寬，適用於計數器與計時器。 |
<a id="spacing-and-alignment"></a>

### 間距與對齊

| Key | Type | Rust | Description |
|---|---|---|---|
| `lineHeight` | `number` | `.line_height(h)` | 行高，單位為 point。 |
| `letterSpacing` | `number` | `.letter_spacing(s)` | 字元之間的額外間距，單位為 point。 |
| `textAlign` | `"auto" \| "left" \| "center" \| "right" \| "justify" \| "start" \| "end"` | `.text_left()`、`.text_center()`、`.text_right()`、`.text_justify()` | 水平對齊方式。`"left"` 與 `"right"` 在由右至左的版面配置中維持原來的方向；`"start"` 與 `"end"` 則跟隨文字方向。 |
| `writingDirection` | `"auto" \| "ltr" \| "rtl"` | `.writing_direction(d)` | 文字的基準方向；`"auto"` 會依內容決定方向。 |
| `textTransform` | `"none" \| "uppercase" \| "lowercase" \| "capitalize"` | `.uppercase()`、`.lowercase()`、`.capitalize()`、`.normal_case()` | 大小寫轉換。 |

> [!TIP]
> Tailwind 的 `leading-*` 與 `tracking-*` class 會以字型大小的倍數設定行高，並以 `em` 設定字元間距，因此它們會隨 `text-*` 大小縮放。

<a id="lines-and-overflow"></a>

### 行數與溢出

| Key | Type | Rust | Description |
|---|---|---|---|
| `numberOfLines` | `number` | `.number_of_lines(n)`、`.truncate()` | `<Text>` 最多顯示的行數（即 CSS 的 `line-clamp`、`line-clamp-*`）；預設值 `0`（`line-clamp-none`）會顯示所有行。`truncate` 表示單行，超出部分以省略號截斷。 |
| `textOverflow` | `"ellipsis" \| "clip" \| "ellipsis-start" \| "ellipsis-middle"` | `.text_overflow(EllipsizeMode::Middle)` | 受限制的 `<Text>` 如何被截斷：在結尾顯示省略號（`"ellipsis"`、`text-ellipsis`，預設值）、直接裁切（`"clip"`、`text-clip`），或將省略號放在開頭或中間（適用於檔案路徑）。 |

<a id="decoration"></a>

### 裝飾

| Key | Type | Rust | Description |
|---|---|---|---|
| `textDecorationLine` | `"none" \| "underline" \| "line-through" \| "underline line-through"` | `.underline()`、`.line_through()`、`.no_underline()` | 與文字一併繪製的線條。 |
| `textDecorationColor` | `ColorValue` | `.text_decoration_color(c)` | 線條的顏色（預設為文字顏色）。 |
| `textDecorationStyle` | `"solid" \| "double" \| "dotted" \| "dashed" \| "wavy"` | `.text_decoration_solid()`、`_double()`、`_dotted()`、`_dashed()`、`_wavy()` | 線條樣式。 |
| `textDecorationThickness` | `number \| "auto" \| "from-font"` | `.text_decoration_thickness(t)` | 線條粗細。 |
| `textUnderlineOffset` | `number \| "auto"` | `.underline_offset(o)` | 底線與基線之間的距離。 |

<a id="placeholder-caret-and-selection"></a>

### 預留位置、游標與選取

`placeholderColor` 與 `caretColor` 屬於 `InputStyle`，也就是 `<Input>` 的樣式；`selectionColor` 屬於 `TextStyle`，因為可選取的文字同樣適用。

| Key | Type | Rust | Description |
|---|---|---|---|
| `placeholderColor` | `ColorValue` | input 的 `.placeholder_color(c)` | `<Input>` 預留位置的顏色（`placeholder:text-*`）。 |
| `textAlignVertical` | `"auto" \| "top" \| "center" \| "bottom"` | | 比其容器更短的文字所在的位置（具有高度的 `<Text>`）。 |
| `selectionColor` | `ColorValue` | input 或 text 的 `.selection_color(c)` | `<Input>` 或可選取的 `<Text>` 的選取醒目提示與控點（`selection:bg-*`）；預設為平台的強調色。在 iOS 上，除非設定了 `caretColor`，否則也會是 input 的游標顏色（UIKit 以同一種顏色著色兩者）。 |
| `caretColor` | `ColorValue` | input 的 `.caret_color(c)` | `<Input>` 的游標（`caret-*`）；未設定時使用平台預設值。 |

<a id="text-shadow"></a>

### 文字陰影

| Key | Type | Rust | Description |
|---|---|---|---|
| `textShadow` | `string \| TextShadowLayer[]` | `.text_shadow([TextShadow { … }])`、`.text_shadow_sm()`、`.text_shadow_color(c)` | CSS 的 `text-shadow`：偏移量、模糊與顏色（`"0 1px 2px rgb(0 0 0 / 0.3)"`），或以數字表示的各個圖層，`[{ x, y, blur, color }]`；多個圖層時以最寬的圖層繪製；沒有顏色的圖層以文字顏色繪製；`"none"`。 |

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
> iOS 不會在 `<Text>` 上繪製漸層（`backgroundImage`）或內嵌（inset）方塊陰影。

## ImageStyle

`ViewStyle` 的所有 key，另外還有：

| Key | Type | Rust | Description |
|---|---|---|---|
| `tintColor` | `ColorValue` | image 的 `.tint_color(c)` | 為範本圖片重新著色（每個不透明像素都會採用此顏色），適用於單色圖示。 |
| `objectFit` | `"fill" \| "contain" \| "cover" \| "none" \| "scale-down"` | `.object_fit(ResizeMode::Contain)` | CSS 的 `object-fit`：圖片或影片如何填入其容器。`"cover"` 會填滿並裁切，`"contain"` 會完整容納於其中，`"fill"` 會拉伸，`"none"` 保持原始大小，`"scale-down"` 則取 `"none"` 與 `"contain"` 中較小者。圖片預設會覆蓋其容器，影片則預設完整容納於容器中。 |
| `objectPosition` | `string` | image 的 `.object_position(p)`、`.object_top()` 等 | 在 `objectFit` 決定大小後，圖片在其容器中的位置，與 CSS 的 `object-position` 相同：可使用關鍵字、百分比與長度（`"top"`、`"left bottom"`、`"25% 75%"`、`"right 10px bottom 20%"`）。覆蓋模式的圖片會以此位置為中心進行裁切。預設為置中。 |

`objectFit` 也適用於 `<Video>`；請參閱 [image](../elements/image.md) 與 [video](../elements/video.md)。

<a id="props-that-look-like-styles"></a>

## 看起來像樣式的 prop

Android 的 material 陰影是平台 prop，與 style 分開設定：

| Setting | Prop | Rust | Class |
|---|---|---|---|
| Material 陰影（Android） | `android={{ elevation }}` | `.elevation(e)` | |

<a id="related"></a>

## 相關內容

- [Styling](../docs/styling.md)：`style`、`class`、繼承與優先順序。
- [Tailwind reference](./tailwind-reference.md)：所有支援的 utility 與 variant。
- [Layout](../docs/layout.md)：flexbox 與 grid 的實際應用。
- [view](../elements/view.md)、[text](../elements/text.md)、[image](../elements/image.md)：這些樣式所適用的元素。

`width`、`height` 與 `flexBasis` 也接受 `"min-content"`、`"max-content"` 與 `"fit-content"`，由 Taffy 計算。
