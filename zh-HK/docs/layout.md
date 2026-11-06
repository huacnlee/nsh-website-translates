---
title: "版面配置"
description: "以 Flexbox 為基礎（預設為縱向排列）、CSS grid、尺寸與百分比、長寬比、絕對定位、使用 onLayout 進行量度、響應式版面配置及從右至左（RTL）排版，附 Rust 及 TSX 範例。"
order: 34
group: ui
demo: guide-layout
source_hash: f4073f703fc9be46
---


# 版面配置

NSH 以 [Taffy](https://github.com/DioxusLabs/taffy)（CSS flexbox、grid 及 block 佈局的 Rust 實作）排列每個元素，並預設設定為子元素垂直堆疊且不會收縮。佈局在核心中執行，於你的程式碼每一輪執行之後進行，而且只有有變動的 frame 才會傳送到原生視圖。文字由平台的文字引擎在同一執行緒上量度，因此佈局從不需要等待主執行緒。

以下的佈局屬性均為樣式屬性。在 Rust 中，它們是有型別的樣式方法（`.flex_row()`、`.gap_4()`、`.grid_cols(3)`、`.absolute().inset_0()`）；在 TSX 中，它們是 `style` prop 的鍵，而且每個屬性都有對應的 [Tailwind](./tailwind.md) class（`flex-row`、`gap-4`、`grid-cols-3`、`absolute inset-0` ……）。兩者都會轉換為相同的原生樣式。

## Flexbox

視圖以 flexbox 排列其子元素。未設定 `display` 的視圖會將子元素堆疊成一欄；樣式中的 `display: "flex"` 會形成一列，除非另有設定 `flexDirection`，這與 CSS 及 Tailwind 的 `flex` class 完全一致。若沒有任何設定，則套用以下預設值：

| 屬性 | NSH 預設值 | Web 預設值 |
|---|---|---|
| `flexDirection` | `"column"`（未設定 `display` 的視圖）；一旦設定 `display: "flex"` 即為 `"row"` | `row` |
| `flexShrink` | `0` | `1` |
| `alignContent` | `"flex-start"`（grid：`"normal"`） | `normal` |
| `alignItems` | `"stretch"` | `stretch` |
| `minWidth` / `minHeight` | `0` | `auto` |
| `position` | `"relative"` | `static` |

```rust tabs
view()
    .flex_row()
    .items_center()
    .gap_3()
    .p_4()
    .child(image(avatar).size(px(40.0)).rounded(px(20.0)))
    .child(
        view()
            .flex_1()
            .gap_0p5()
            .child(text(name).font_weight(FontWeight::SEMIBOLD))
            .child(text(message).text_color(rgb(0x6e7781)).number_of_lines(1)),
    )
    .child(text(time).text_color(rgb(0x6e7781)))
```

```tsx tabs
<View style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 16 }}>
  <Image src={avatar} style={{ width: 40, height: 40, borderRadius: 20 }} />
  <View style={{ flex: 1, gap: 2 }}>
    <Text style={{ fontWeight: "600" }}>{props.name}</Text>
    <Text style={{ numberOfLines: 1, color: "#6e7781" }}>{props.message}</Text>
  </View>
  <Text style={{ color: "#6e7781" }}>{props.time}</Text>
</View>
```

| 屬性 | 值 | Rust |
|---|---|---|
| `flexDirection` | `"column"`、`"row"`、`"column-reverse"`、`"row-reverse"` | `.flex_col()`、`.flex_row()`、`.flex_col_reverse()`、`.flex_row_reverse()` |
| `justifyContent` | 主軸：`"flex-start"`、`"flex-end"`、`"start"`、`"end"`、`"center"`、`"space-between"`、`"space-around"`、`"space-evenly"`、`"stretch"` | `.justify_start()`、`.justify_center()`、`.justify_end()`、`.justify_between()`、`.justify_around()`、`.justify_evenly()` |
| `alignItems` | 交叉軸：`"stretch"`、`"flex-start"`、`"flex-end"`、`"start"`、`"end"`、`"self-start"`、`"self-end"`、`"center"`、`"baseline"` | `.items_stretch()`、`.items_start()`、`.items_center()`、`.items_end()`、`.items_baseline()` |
| `alignSelf` | 單一子元素的交叉軸對齊；`"auto"` 跟隨父元素的 `alignItems` | `.self_start()`、`.self_center()`、`.self_end()`、`.self_stretch()` |
| `alignContent` | 換行容器中各行的對齊 | |
| `flexWrap` | `"nowrap"`、`"wrap"`、`"wrap-reverse"` | `.flex_wrap()` |
| `flex` | 單一數字的簡寫（見下文） | `.flex_1()`、`.flex_auto()`、`.flex_none()` |
| `flexGrow`、`flexShrink`、`flexBasis` | 與 CSS 相同 | `.flex_grow(n)`、`.flex_shrink(n)`、`.flex_shrink_0()`、`.basis(length)` |
| `gap`、`rowGap`、`columnGap` | 子元素之間的間距 | `.gap(length)`、`.gap_y(length)`、`.gap_x(length)`，以及級距 `.gap_2()`、`.gap_x_4()` …… |

`flex-start` 與 `flex-end` 跟隨 flex 方向；`start` 與 `end` 跟隨書寫方向，與 CSS 相同（由右至左時，`start` 是右側），`self-start` / `self-end` 則跟隨子元素自身的方向。

`flex` 是 CSS 的簡寫，Tailwind 的 `flex-*` class 亦然：數字 `n` 表示按 `n` 擴展、按 1 收縮，並以 0 作為基準值起算，因此 `flex: 1` 的同層元素（Rust 中為 `.flex_1()`，`flex-1`）無論內容如何，都會平均分配空間；`"none"` 即 `0 0 auto`（視圖保持其尺寸），`"auto"` 即 `1 1 auto`，`"initial"` 即 `0 1 auto`，而擴展、收縮及基準值亦可逐項寫出（`"2 0 50%"`、`"1 1 120px"`）。由於最小尺寸預設為 0，`flex: 0`（`0 1 0`）會將視圖收縮至無，除非以 `minWidth: "auto"` 保持其內容的尺寸。

```rust tabs
view()
    .flex_row()
    .gap_2()
    // One share.
    .child(view().flex_1().h(px(36.0)).bg(rgb(0xc8e1ff)))
    // Two shares.
    .child(view().flex_grow(2.0).flex_shrink(1.0).basis(px(0.0)).h(px(36.0)).bg(rgb(0x79b8ff)))
    // Fixed.
    .child(view().size(px(36.0)).bg(rgb(0x0366d6)))
```

```tsx tabs
<View style={{ flexDirection: "row", gap: 8 }}>
  <View style={{ flex: 1, height: 36, backgroundColor: "#c8e1ff" }} />   {/* one share */}
  <View style={{ flex: 2, height: 36, backgroundColor: "#79b8ff" }} />   {/* two shares */}
  <View style={{ width: 36, height: 36, backgroundColor: "#0366d6" }} /> {/* fixed */}
</View>
```

由於最小尺寸預設為 0，列中的 `flex: 1` 文字會收縮並換行，而不是將同層元素擠出去。`minWidth: "auto"` / `minHeight: "auto"`（`min-w-auto` / `min-h-auto`，Rust 中為 `.min_w(auto())`）是 CSS 的自動最小值：收縮中的元素會停在其內容的最小尺寸，即文字中最長的單字，與 Web 相同。

> [!NOTE]
> `display: "flex"` 在樣式、class（`flex`）及 Rust（`.flex()`）中同樣代表一列，除非已設定方向：`{ display: "flex", flexDirection: "column" }`、`flex flex-col`、`.flex().flex_col()`。未設定 `display` 的視圖無需任何設定即為一欄。

<a id="sizes"></a>

## 尺寸

| 屬性 | 值 | Rust |
|---|---|---|
| `width`、`height` | 點數、父元素的百分比（`"50%"`），或 `"auto"` | `.w(px(120.0))`、`.h(relative(0.5))`、`.w_full()`、`.size(px(44.0))`，級距 `.w_10()` …… |
| `minWidth`、`maxWidth`、`minHeight`、`maxHeight` | 點數或百分比；`minWidth` / `minHeight` 亦可使用 `"auto"`，即內容的最小尺寸 | `.min_w(..)`、`.max_w(..)`、`.min_h(..)`、`.max_h(..)` |
| `aspectRatio` | 寬度除以高度：`1`、`16 / 9` | `.aspect_ratio(16.0 / 9.0)`、`.aspect_square()` |
| `padding`、`paddingHorizontal`、`paddingVertical`、`paddingTop` …… | 點數或百分比 | `.p(..)`、`.px(..)`、`.py(..)`、`.pt(..)` ……，以及級距 `.p_4()`、`.px_2()` …… |
| `margin`、`marginHorizontal`、`marginVertical`、`marginTop` …… | 點數、百分比，或 `"auto"` | `.m(..)`、`.mx(..)`、`.my(..)`、`.mt(..)` ……、`.mx(auto())` |

在 Rust 中，長度是有型別的：`px(16.0)` 為 16 點，`relative(0.5)` 為父元素的 50%，`auto()` 為 `auto`。級距方法依循 Tailwind 的間距刻度，每級 4 點（`.p_4()` 為 16 點，`.gap_0p5()` 為 2 點）。

未指定尺寸時，視圖的大小等同其內容（加上 padding），並藉由預設的 `alignItems: "stretch"` 沿父元素的交叉軸拉伸。百分比是相對於父元素的尺寸（padding 與 margin 的百分比則與 CSS 相同，相對於其寬度）。

`aspectRatio` 會根據已知的一個維度來決定另一個維度的大小：

```rust tabs
view().w_full().aspect_ratio(16.0 / 9.0).bg(black())
```

```tsx tabs
<View style={{ width: "100%", aspectRatio: 16 / 9, backgroundColor: "#000000" }} />
```

來自 app 資源的圖片具有固有尺寸，未指定尺寸時會按該尺寸佈局（見[圖片與資源](./images-and-assets.md)）。遠端圖片在載入完成前沒有尺寸：請為它們指定尺寸。

## Grid

`display: "grid"`（Rust 中為 `.grid()`）以 CSS grid 軌道排列子元素：

```rust tabs
view()
    .grid()
    .grid_template_columns("repeat(3, 1fr)")
    .gap_2()
    .child(view().col_span(2).h(px(60.0)).bg(rgb(0xd8b9ff)))
    .child(view().h(px(60.0)).bg(rgb(0xb083f0)))
    .child(view().row_span(2).bg(rgb(0x8250df)))
    .child(view().col_start(2).col_end(4).h(px(60.0)).bg(rgb(0x6639ba)))
```

```tsx tabs
<View style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
  <View style={{ gridColumn: "span 2", height: 60, backgroundColor: "#d8b9ff" }} />
  <View style={{ height: 60, backgroundColor: "#b083f0" }} />
  <View style={{ gridRow: "span 2", backgroundColor: "#8250df" }} />
  <View style={{ gridColumn: "2 / 4", height: 60, backgroundColor: "#6639ba" }} />
</View>
```

| 屬性 | 值 | Rust |
|---|---|---|
| `gridTemplateColumns`、`gridTemplateRows` | CSS 軌道清單：`"repeat(3, 1fr)"`、`"200px 1fr"`、`minmax()`、`auto-fill` / `auto-fit`、線名稱 | `.grid_cols(3)`、`.grid_rows(2)`、`.grid_template_columns("200px 1fr")`、`.grid_template_rows(..)` |
| `gridAutoColumns`、`gridAutoRows` | 隱式建立的欄與列的軌道 | |
| `gridAutoFlow` | `"row"`、`"column"`、`"dense"`、`"row dense"`、`"column dense"` | `.grid_flow_col()`、`.grid_flow_dense()` |
| `gridColumn`、`gridRow` | `"1 / 3"`、`"span 2"`、線編號或線名稱：`"content-start / content-end"`、`"2 col"`（名為 `col` 的第二條線）、`"span col"`（直至下一條名為 `col` 的線） | `.col_span(2)`、`.row_span(2)`、`.col_span_full()` |
| `gridColumnStart`、`gridColumnEnd`、`gridRowStart`、`gridRowEnd` | 線編號或線名稱 | `.col_start(1)`、`.col_end(3)`、`.row_start(..)`、`.row_end(..)`（線編號） |
| `justifyItems`、`justifySelf` | 項目沿列方向在其區域內的位置：`"start"`、`"end"`、`"center"`、`"stretch"` …… | |
| `alignItems`、`alignSelf` | 項目沿欄方向在其區域內的位置 | `.items_*()`、`.self_*()` |
| `justifyContent`、`alignContent` | 軌道沿列方向及欄方向在 grid 內的位置 | `.justify_*()` |

範本以方括號為線命名，每條線可有一個或多個名稱，項目則按這些名稱放置，與 CSS 相同（在 Rust 中則按線的編號）：

```rust tabs
view()
    .grid()
    .grid_template_columns("[full-start] 16px [content-start] 1fr [content-end] 16px [full-end]")
    // content-start / content-end: lines 2 to 3.
    .child(view().col_start(2).col_end(3).h(px(60.0)).bg(rgb(0xb083f0)))
    // full-start / full-end: lines 1 to 4.
    .child(view().col_start(1).col_end(4).h(px(60.0)).bg(rgb(0x8250df)))
```

```tsx tabs
<View style={{ display: "grid", gridTemplateColumns: "[full-start] 16px [content-start] 1fr [content-end] 16px [full-end]" }}>
  <View style={{ gridColumn: "content-start / content-end", height: 60, backgroundColor: "#b083f0" }} />
  <View style={{ gridColumn: "full-start / full-end", height: 60, backgroundColor: "#8250df" }} />
</View>
```

在 grid 中，`justifyContent` 與 `alignContent` 預設為 CSS 的 `"normal"`：尺寸為 `auto` 的軌道會拉伸以填滿容器，因此有高度但沒有列範本的 grid，會將該高度平均分配給各列。明確設定的值（`"start"`、`"center"`、`"space-between"` ……）會如 CSS 一樣放置軌道。對齊 class 所設定的，與 Tailwind CSS 完全一致：`content-start`（`align-content: flex-start`）及 `place-content-start` 將軌道靠起始端排列，`content-normal` 及 `justify-normal` 則會拉伸軌道，與瀏覽器相同。

`display: "block"` 使用 CSS block 佈局（子元素堆疊，各自與容器同寬），`display: "none"`（`.hidden()`）則會將視圖從佈局中移除。

<a id="absolute-positioning"></a>

## 絕對定位

`position: "absolute"`（`.absolute()`）會將視圖移出文檔流，並以 `top`、`right`、`bottom` 及 `left` 相對於其父元素定位：

```rust tabs
view()
    .h(px(200.0))
    .child(image(cover).absolute().inset_0())
    .child(
        view()
            .absolute()
            .left_3()
            .right_3()
            .bottom_3()
            .child(text("Caption").text_color(white()).font_weight(FontWeight::BOLD)),
    )
```

```tsx tabs
<View style={{ height: 200 }}>
  <Image src={cover} style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }} />
  <View style={{ position: "absolute", left: 12, right: 12, bottom: 12 }}>
    <Text style={{ color: "#ffffff", fontWeight: "700" }}>Caption</Text>
  </View>
</View>
```

偏移值接受點數及百分比（Rust 中為 `.top(..)`、`.right(..)`、`.bottom(..)`、`.left(..)`、`.inset(..)`）。同時設定 `left` 與 `right`（或 `top` 與 `bottom`）而沒有尺寸的視圖，會在兩者之間拉伸。較後的同層元素繪製在較前者之上；`zIndex`（`.z_index(n)`）可改變次序。

<a id="measuring"></a>

## 量度

`onLayout`（`.on_layout(..)`）會在視圖的 frame 有變動的每次佈局之後，回報其相對於父元素的 frame：

```rust tabs
let width = signal(0.0_f32);

view()
    .on_layout(move |frame: &Bounds<Points>| width.set(frame.size.width.0))
    .child(text(move || format!("{} points wide", width.get())))
```

```tsx tabs
const width = signal(0);

<View onLayout={({ bounds }) => width.set(bounds.size.width)}>
  <Text>{width()} points wide</Text>
</View>
```

frame 以點數為單位：Rust 中為 `Bounds<Points>`，TSX 中為 `{ bounds }`，即 `Bounds`（`{ origin: { x, y }, size: { width, height } }`）。如要取得整個視窗的資料，在 Rust 中讀取 `window()`，在 TSX 中則從 [`nsh`](../modules/nsh.md#device) 讀取 `windowSize()`；兩者都會隨旋轉及視窗大小變化而更新，而讀取它們的樣式亦會隨視窗改變：

```rust tabs
view().style_when(|| window().width > px(600.0), |s| s.flex_row())
```

```tsx tabs
import { View } from "nsh";
import { windowSize } from "nsh";

<View style={{ flexDirection: windowSize().width > 600 ? "row" : "column" }} />
```

Tailwind 的斷點（`sm:`、`md:` ……）以及 `portrait:` / `landscape:` 無需編寫程式碼即可得到相同的結果。

<a id="safe-areas"></a>

## 安全區域

根視圖會覆蓋整個螢幕，包括狀態列及主畫面指示條之下。可使用 CSS 的 `env()`（`paddingTop: "env(safe-area-inset-top)"`、Tailwind 的 `pt-[env(safe-area-inset-top)]`、Rust 中的 `.p_safe_area()`；見[安全區域](../elements/safe-area.md)）按安全區域邊距為畫面加上 padding，或者在 Rust 中以 `safe_area()`、在 TSX 中以 `safeArea()` / `safeAreaInsets()` 讀取邊距，再自行套用。[導覽堆疊](./navigation.md)中的頁面本身已位於其標題列之下。

<a id="right-to-left"></a>

## 由右至左

app 的佈局方向跟隨系統語言，而視圖的 `direction` 樣式（`"ltr"`、`"rtl"` 或 `"inherit"`；Rust 中為 `.direction(LayoutDirection::Rtl)`）可設定其子樹的方向。當 app 以由右至左佈局時：

- 列由右方開始排列；
- `left` 與 `right` 保持原來的一側，與瀏覽器相同，樣式鍵與 class 皆然：`paddingLeft`、`marginLeft`、`left`、`borderLeftWidth`、`borderTopLeftRadius`、`textAlign: "left"` 與 `pl-4`、`ml-2`、`left-0`、`border-l`、`rounded-tl-lg`、`text-left` 仍留在左側；
- 邏輯屬性跟隨方向，行內起始端即右側：`marginStart`、`marginEnd`、`paddingStart`、`paddingEnd`、`start`、`end`、`borderStartWidth`、`borderEndColor`、`borderTopStartRadius` ……、`textAlign: "start"` / `"end"`（class 為 `ps-4`、`ms-2`、`start-0`、`border-s`、`rounded-ss-lg`、`text-start`；Rust 中為 `.ms(..)`、`.me(..)`、`.ps(..)`、`.pe(..)`、`.border_s(..)`、`.rounded_ss(..)` ……）；`marginHorizontal` 與 `paddingHorizontal` 會同時設定兩側；
- 設有 `textAlign: "auto"` 的文字靠右對齊，原生控制項會鏡像顯示。

```rust tabs
view()
    .flex_row()
    .gap_2()
    .child(view().ms_4().rounded_ss(px(12.0)).size(px(44.0)).bg(rgb(0x54aeff)))

let rtl = signal(false);
view()
    .direction(move || if rtl.get() { LayoutDirection::Rtl } else { LayoutDirection::Ltr })
    .on_press(move |_: &()| rtl.set(!rtl.get()))
    .child(text(move || if rtl.get() { "Right to left" } else { "Left to right" }))
```

```tsx tabs
import { signal, Text, View } from "nsh";

const rtl = signal(false);

<View style={{ direction: rtl() ? "rtl" : "ltr" }}>
  <View style={{ flexDirection: "row", gap: 8 }}>
    <View style={{ marginStart: 16, borderTopStartRadius: 12, width: 44, height: 44, backgroundColor: "#54aeff" }} />
  </View>
  <View onPress={() => rtl.set(!rtl())}>
    <Text>{rtl() ? "Right to left" : "Left to right"}</Text>
  </View>
</View>
```

方向的變更，無論是語言還是視圖的方向，都會即時生效，無需重新啟動。`direction` 樣式亦可讓某個視圖及其子元素保持自己的方向，例如由左至右顯示的電話號碼。在 Android 上，嵌入 NSH 的 app 需要在 manifest 中加入 `android:supportsRtl="true"`，原生控制項才會鏡像顯示。

<a id="related"></a>

## 相關內容

- [樣式](./styling.md)：樣式如何組合。
- [捲動](./scrolling.md)與[列表](./lists.md)：大於螢幕的內容。
- [樣式參考](../modules/style-reference.md)：每個佈局屬性及其型別。
