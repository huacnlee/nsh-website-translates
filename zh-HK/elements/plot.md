---
title: "Plot"
description: "nsh/base/plot 的 Plot 元件,以及其標記 Line、Area、Bar、Rule、Dot、Cell、Grid、Pie、Arc、RadialLine、RadialGrid、Sankey 和 Treemap,還有 PlotAxis 與 PlotLabel:根據應用程式的資料列以原生方式繪製圖表,支援座標軸的比例尺及其標籤、資料點上的文字、指標所指的資料列、儲存格或扇形、動態效果,且本身不帶任何預設外觀。"
group: base
demo: el-plot
source_hash: 2aca4d23862b455b
---


# Plot

Plot 是圖表的框架：它顯示的資料列、x 軸與 y 軸的比例尺、其上的指標及指標的動態。它的標記負責繪製其所含的內容：穿過數列的 `Line`、介乎數列與基線之間的 `Area`、在 band 比例尺的各個 band 中每列一個的 `Bar`、每列由起點至終點的 `Rule`（蠟燭圖的影線）、每列在其兩個值交會處的 `Dot`（散佈圖的點、氣泡圖的氣泡）、在兩個類別的 band 中每列一個並按其值著色的 `Cell`（熱圖）、橫跨的一組 `Grid`、由各列佔比組成的 `Pie`（中間有孔的環形圖）、介乎兩個角度之間的 `Arc`、環繞中心並以後方的 `RadialGrid` 之環與輻條襯底的 `RadialLine`（雷達圖）、各列之間流向的 `Sankey`，以及由巢狀矩形組成、每片葉的面積即其值的 `Treemap`（市場地圖）；`PlotAxis` 以比例尺的刻度標示邊緣，`PlotLabel` 則在比例尺上的各點寫出文字。每個標記都是一塊填滿 Plot 的畫布，由資料列以原生方式繪製：應用程式的資料列在設定時只讀取一次，之後在 Rust 中縮放、記錄並繪製，因此一千個點的圖表不會為每個點執行任何 JS。指標同樣在 Rust 中追蹤：懸停時的十字線、圓點與工具提示由平台的動畫器移動及淡入淡出，應用程式只會得知新的資料列，僅此而已。外觀由應用程式決定：標記以 CSS 中 SVG 形狀的繪製屬性（`stroke-*`、`fill-*`）上色，未設定時使用 `currentColor`；區域或長條會在其形狀內顯示背景（漸層、`bg-linear-*`）；而懸停時的各部分（包括每個標記的圓點）以及軸的標籤、刻度線和線條，均由應用程式自行設定樣式及填充。

```rust tabs
use nsh_base::{
    plot::{area, grid, line, plot},
    theme,
};
use nsh_core::{element::{RowAccessor, Rows}, prelude::*};

fn week(visitors: Vec<f64>, hovered: Signal<Option<u32>>) -> impl IntoElement {
    let rows = Rows::from_columns(visitors.len(), [("visitors".into(), visitors)]);
    plot()
        .data(rows)
        .y(RowAccessor::key("visitors"))
        .accessibility_label("Visitors per day")
        .h(px(160.0))
        .on_hover_change(move |index: &Option<u32>| hovered.set(*index))
        .child(grid().y(vec![0.0, 1500.0, 3000.0]).stroke_color(move || theme().border))
        .child(area().fill_color(move || theme().chart_1.opacity(0.2)))
        .child(line().stroke_color(move || theme().chart_1).stroke_width(px(2.0)))
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { Area, Grid, Line, Plot } from "nsh/base/plot";

const rows = [
  { day: "Mon", visitors: 1820 },
  { day: "Tue", visitors: 2140 },
  { day: "Wed", visitors: 1960 },
  { day: "Thu", visitors: 2480 },
  { day: "Fri", visitors: 2310 },
];

function App() {
  const hovered = signal<number | null>(null);
  return (
    <View class="gap-2 p-4">
      <Text class="text-sm text-muted-foreground tabular-nums">
        {hovered() == null ? "Visitors" : `${rows[hovered()!].day}: ${rows[hovered()!].visitors}`}
      </Text>
      <Plot
        data={rows}
        y="visitors"
        yScale={{ type: "linear", domain: [0, 3000] }}
        accessibilityLabel="Visitors per day, highest on Thursday"
        onHoverChange={({ index }) => hovered.set(index)}
        crossLineClass="w-px h-full bg-border"
        dotClass="size-2.5 rounded-full border-2 border-background bg-chart-1"
        class="h-40"
      >
        <Grid y={[0, 1500, 3000]} class="stroke-border" />
        <Area class="fill-chart-1/20" />
        <Line class="stroke-chart-1 stroke-2" />
      </Plot>
    </View>
  );
}

mount(App);
```

`Plot`、`Line`、`Area`、`Bar`、`Rule`、`Dot`、`Cell`、`Grid`、`Pie`、`Arc`、`RadialLine`、`RadialGrid`、`Sankey`、`Treemap`、`PlotAxis` 及 `PlotLabel` 來自 `nsh/base/plot`，這是 [`nsh/base`](../modules/nsh-base.md) 中專屬於它們的模組（在 Rust 中為 `nsh_base::plot`）。在 TypeScript 中，Plot 的 props 以其資料列的類型為泛型：欄位名稱會對照該類型檢查，而作用於資料列的函式會取得該資料列的類型。在 Rust 中，`plot()` 建立 Plot 時，每個 prop 各有一個 setter，資料列為 `Rows`（按鍵名劃分的數字欄），值為 `RowAccessor`（鍵名，或以資料列索引為參數的函式），而標記則使用具類型的繪製方法（`.stroke_color(..)`、`.fill_color(..)`、`.stroke_width(..)`）。

## Plot

| 屬性 | Rust | 類型 | 預設值 | 說明 |
|---|---|---|---|---|
| `data` | `.data(..)` | `T[]` | （必填） | 資料列，每個點一個物件。標記在應用程式設定資料列時只讀取一次其值；沒有值的資料列（欄位不是數字，`null`）會被略過。 |
| `x` | `.x(..)` | `keyof T \| (d: T, index: number) => number` | 資料列的索引 | 在 `linear` x 比例尺上，決定資料列沿 x 軸的位置。`point` 比例尺則按順序排列資料列。 |
| `y` | `.y(..)` | `keyof T \| (d: T, index: number) => number` | 無 | 標記在沒有指定自己的值時所繪製的內容。 |
| `xScale` | `.x_scale(..)` | `Scale` | `{ type: "point" }` | x 軸如何安排資料列的位置：`point`（按順序，由左邊緣至右邊緣平均分佈；只有一列時置於中間）、附帶可選 `domain` 的 `linear`，或 `band`（每列一個 band，用於長條，見 [Bar](#bar)；或每個類別一個 band，用於儲存格，見 [Cell](#cell)）。y 比例尺為 `band` 時，預設為 `linear`，用於橫向長條。`reverse: true` 使其由右邊緣開始（[反向比例尺](#reversed-scales)）。 |
| `yScale` | `.y_scale(..)` | `Scale` | `{ type: "linear" }` | y 軸如何安排值的位置：定義域的最小值在底邊，最大值在頂邊。沒有 `domain` 時，採用標記所繪製內容的範圍。`band` 由頂邊向下為每列鋪設一個 band，用於橫向長條。`reverse: true` 使其反向運行：最小值在頂邊，資料列由底邊向上排列（[反向比例尺](#reversed-scales)）。 |
| `y2Scale` | `.y2_scale(..)` | `LinearScale` | 無 | 第二個 y 比例尺 `{ type: "linear", domain?, reverse? }`，供指定使用它的標記（`scale="y2"`）：即雙軸圖表的右側比例尺（[雙軸](#dual-axes)）。沒有 `domain` 時，採用其上各值的範圍。 |
| `alignTicks` | `.align_ticks(..)` | `boolean` | `true` | 當兩個 y 比例尺都沒有指定定義域，而兩者上都有標記時，兩者會被擴展至相同的整數步長，使其刻度落在同一條線上（[雙軸](#dual-axes)）。`false` 則令各自保持其值的範圍。 |
| `interactive` | `.interactive(..)` | `boolean` | `true` | Plot 會追蹤指標與鍵盤：它回報指標下的資料列並顯示懸停時的各部分，同時是 Tab 的停駐點，其方向鍵可移動懸停位置（[鍵盤](#keyboard)）。`false` 只繪製標記（例如列表中的迷你圖），在其上的按壓會交給周圍的視圖處理。Plot 是否提供鍵盤操作，於建立時決定。 |
| `motion` | `.motion(..)` | `PlotMotion` | 無 | 出現動畫的時序、懸停時的淡入淡出，以及鍵盤移動懸停位置時所用的彈簧動畫（見下文）。 |
| `appearGeneration` | `.appear_generation(..)` | `number \| string` | 無 | 選擇啟用出現動畫：標記會在 Plot 首次顯示時繪入，而每當此值改變（另一個代號、另一段期間）時會再次繪入。在 [`PlotAppearScope`](#plotappearscope) 內，已在其中完成的一代會一次過完整顯示。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 無 | 螢幕閱讀器對圖表的描述：它顯示甚麼，以及哪些內容突出。 |
| `accessibilityValue` | `.accessibility_value(..)` | `{ min?, max?, now?, text? }` | 無 | 螢幕閱讀器作為其值而讀出的內容：應用程式對指標下資料列的描述。 |
| `crossLineClass`、`crossLineStyle` | `.cross_line_class(..)`、`.cross_line_style(..)` | `string`、`StyleProp<ViewStyle>` | 無 | 十字線：與 Plot 等高的視圖，以指標下的資料列為中心。在 band 比例尺上，它位於該列的 band 內，寬度與 band 相同（在 band y 比例尺上則橫跨整個 Plot）。 |
| `dotClass`、`dotStyle` | `.dot_class(..)`、`.dot_style(..)` | `string`、`StyleProp<ViewStyle>` | 無 | 懸停時的圓點：為每個 `Line`、`Area` 及 `RadialLine` 提供一個視圖，以指標下資料列所在的點為中心；`Dot` 的圓點則與指標下的圓點一樣大。標記自己的 `hoverDotClass` / `hoverDotStyle` 會取代它們，用於該標記自己的圓點。 |
| `tooltipContent` | `.tooltip_content(..)` | `JSX.Element` | 無 | 應用程式的工具提示，由 `tooltipPlacement` 決定位置，並與十字線一同移動及淡入淡出。 |
| `tooltipPlacement` | `.tooltip_placement(..)` | `"top" \| "pointer"` | `"top"` | 工具提示的位置：在 Plot 頂部，以十字線為中心；或在指標旁，位於十字線朝向 Plot 中間的一側，指標位於上半部時在其下方，位於下半部時在其上方。在頂部時，它保持在 Plot 的左右邊緣之間（它與頂邊的偏移由應用程式決定：置於 Plot 下方的標籤會佔用 Plot 的高度再加上更多）；在指標旁時，它保持在 Plot 之內。使用鍵盤時，它位於該列第一條線或第一個區域的點旁（長條則為其 band 的中間，pie 則為其扇形的中間）。 |
| `tooltipOffset` | `.tooltip_offset(..)` | `number` | `0` | 工具提示與其定位依據之間的距離：`"top"` 以頂邊為準，`"pointer"` 以十字線和指標為準。 |
| `colorScale` | `.color_scale(..)` | `ColorScale` | 無 | 標記的顏色：按其 `color` 所讀取的類別，如 d3 的 `scaleOrdinal`（`{ type: "ordinal", domain?, range, unknown? }`，見[按類別著色](#colors-by-category)）；或按 `Cell` 的 `value` 所讀取的數字沿色階取色，如 d3 的 `scaleSequential` 和 `scaleDiverging`（`{ type: "sequential" \| "diverging", … }`，見[沿色階著色](#colors-along-a-ramp)）。 |
| `children` | `.child(..)` | `JSX.Element` | 無 | 標記，按順序互相疊繪，以及應用程式鋪設在其上的任何內容。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | 無 | Plot 的尺寸與外觀；標記會繼承其繪製屬性，一如 CSS 的繼承方式。`focus:` / `focus-visible:` 類別及 `focusStyle` 用於繪製其焦點環。 |

| 事件 | Rust | 負載 | 時機 |
|---|---|---|---|
| `onHoverChange` | `.on_hover_change(..)` | `{ index: number \| null }` | 指標移到另一個資料列上：即沿 x 軸最接近指標的資料列索引（只有 y 軸有 band 時則沿 y 軸）、其下 [pie](#pie-and-arc) 的扇形索引、中心最接近指標的 [dot](#dot) 索引、其下 [cell](#cell) 的索引（橫跨兩個儲存格之間的間隙時，取較近的一個），或按角度最接近指標的 [radial line](#radialline-and-radialgrid) 資料列索引；指標離開 Plot 後則為 `null`（在 pie 上為其各扇形；在 radial line 上為其外半徑）。 |

`Scale` is `{ type: "point"; reverse? } | { type: "linear"; domain?: [number, number]; reverse? } | { type: "band";
domain?: string[]; paddingInner?; paddingOuter?; maxBandWidth?; bandCount?; groupPadding?; reverse? }`. A `linear` 比例尺的 `domain` 是其兩個值所界定的範圍，次序不限；只有一個值的定義域會將它置於中間。`band` 比例尺的 `domain` 是其 band 的類別，按順序排列（[Cell](#cell)）；其他選項見 [Bar](#bar)。

作用於資料列的函式（`y={(d) => d.high - d.low}`）會在資料列或函式改變時，於下一輪為每列呼叫一次，絕不會在 Plot 繪製或追蹤指標期間呼叫：請保持其為純函式（相同的資料列，得出相同的數字）。欄位名稱則完全無需 JS 即可讀取。

<a id="reversed-scales"></a>

### 反向比例尺

`reverse: true` 令比例尺由其另一邊開始運行，一如 visx 的比例尺接受 `reverse`，而 d3 的比例尺接受倒寫的範圍。在 x 軸上，第一列或定義域的最小值位於右邊緣；在 y 軸上，定義域的最小值位於頂邊，資料列由底邊向上排列。所有置於比例尺上的內容都會跟隨它：標記、長條的基底及其生長方向、區域的基線、格線、`PlotAxis` 的刻度、懸停時找到的資料列、方向鍵（[鍵盤](#keyboard)）以及移至新定義域的動作。在反向的 `linear` y 比例尺上，長條自頂邊垂下；在反向的 `linear` x 比例尺上，橫向長條自右邊緣向左生長：

```tsx
<Plot
  data={depths}
  y="depth"
  xScale={{ type: "band", paddingInner: 0.2 }}
  yScale={{ type: "linear", domain: [0, 40], reverse: true }}
  class="h-32"
>
  <Bar class="fill-chart-2" cornerRadii={{ bottomLeft: 3, bottomRight: 3 }} />
</Plot>
```

使用 Plot 的出現動畫時，線條與區域會由 x 比例尺的起始邊繪入；比例尺反向時則由右邊繪入。

<a id="dual-axes"></a>

### 雙軸

<!-- demo: el-plot-dual -->

Plot 設有第二個 y 比例尺，用於單位不同的值：價格旁邊的成交量、利潤率旁邊的收入。每個沿 y 方向安排值位置的部分都接受 `scale`：`"y"`（預設，即 Plot 的 `yScale`）或 `"y2"`（即其 `y2Scale`）。右側帶有 `scale="y2"` 標籤的 `PlotAxis`：

```tsx
<Plot data={days} xScale={{ type: "band", paddingInner: 0.3 }} class="mx-10 mb-6 h-44">
  <Grid class="stroke-border" />
  <Bar value="volume" class="fill-chart-2/50" />
  <Line y="close" scale="y2" class="stroke-chart-1 stroke-2" />
  <PlotAxis placement="left" format={(v) => `${v}M`} labelClass="pr-2 text-xs text-muted-foreground" />
  <PlotAxis placement="right" scale="y2" labelClass="pl-2 text-xs text-muted-foreground" />
</Plot>
```

每個比例尺的定義域各自獨立：由應用程式的 `domain` 決定，或取其上各值的範圍，並且各自以 `motion.update` 移至新的定義域。當兩個比例尺都沒有指定定義域時，Plot 會以相同數目的整數步長排佈兩者（1、2 或 5 乘以 10 的冪，大約每 32 點高度一步）：當兩者都包含零時，零在兩者上落在同一條線上；否則，由零起始的比例尺（成交量）向上增加額外步長，另一個（價格）則向兩側增加。軸的刻度就是這些步長，而沒有 `x` 也沒有 `y` 的 `Grid` 會在這些位置繪製其線條，因此一套格線可同時服務兩條軸。`alignTicks={false}` 會關閉此行為；應用程式指定的 `domain` 則使兩個比例尺保持原狀。

懸停只會找到一個資料列；每個標記的圓點位於其自己的比例尺上，而讀數由應用程式負責，它會讀取 `onHoverChange` 所回報資料列的兩個值。兩個比例尺上的長條在每個 band 內並排而立，而 `stack` 只會堆疊其比例尺上的長條。`y2Scale` 是線性的：y 軸有 band 的 Plot 沒有第二個 y 比例尺。
<a id="line-area-and-grid"></a>

## Line、Area 與 Grid

| 標記 | 屬性 | 類型 | 預設值 | 說明 |
|---|---|---|---|---|
| `Line` | `y` | `string \| (d, index) => number` | 圖表的 `y` | 繪製的內容:每個有值的資料列繪製一個點,沒有值的資料列會略過。 |
| `Line`、`Area` | `data`、`x` | `T[]`、`string \| (d, index) => number` | 圖表的資料列 | 自有數列的資料列(使用其他 x 值),由其自身的 `x` 放置到圖表的比例尺上(沒有時則使用資料列的索引)。 |
| `Line`、`Area` | `curve` | `"natural" \| "linear" \| "stepAfter"` | `"natural"` | 連接各點的方式:平滑曲線、直線段,或階梯(每個值維持至下一列)。面積的底邊跟隨同一條曲線。 |
| `Line` | `dot`、`dotClass`、`dotStyle` | `boolean`、`string`、`StyleProp<ViewStyle>` | `false` | 每個點上的圓點:以該點為中心的檢視,其大小、背景和邊框由應用程式決定。 |
| `Line`、`Area` | `hoverDotClass`、`hoverDotStyle` | `string`、`StyleProp<ViewStyle>` | 圖表的 `dotClass`、`dotStyle` | 其懸停圓點,位於指標下方資料列的對應點上:每個數列的圓點使用各自的顏色。各項設定會取代圖表在此標記上的設定(標記的顏色優先於圖表的大小和外環);`hidden` 表示不顯示。 |
| `Area` | `backgroundClass`、`backgroundStyle` | `string`、`StyleProp<ViewStyle>` | 無 | 其背景:包圍其形狀的方框(由第一個點至最後一個點,由最高點至基線,在帶狀面積上則至底邊的最低點),其背景(`bg-*`、`bg-linear-to-b from-… to-…`、`backgroundImage`)只顯示在形狀內,位於 `fill` 之下。設有背景時,未另行設定的 `fill` 為 `none`。 |
| `Area` | `y1` | `string \| (d, index) => number` | 圖表的 `y` | 構成其頂邊的內容。 |
| `Area` | `y0` | `number \| string \| (d, index) => number` | y 比例尺的低端 | 其底邊:數字是 y 比例尺上的基線;欄位或函數則為每個資料列提供各自的底部值,使面積成為帶狀(某日的最低至最高、預測範圍)。未設定時,面積會閉合至 y 比例尺最小值所在的一邊:底邊;在反向比例尺上則為頂邊(從頂部垂下的面積)。任何一邊缺少值的資料列會略過。 |
| `Line`、`Area`、`Grid` | `scale` | `"y" \| "y2"` | `"y"` | 其值所沿用的 y 比例尺:圖表的 `yScale` 或其第二個比例尺 `y2Scale`([雙軸](#dual-axes))。 |
| `Grid` | `x` | `number[]` | 無 | 其垂直線的位置,以 x 比例尺的值表示(在 `point` 比例尺上則為資料列索引)。 |
| `Grid` | `y` | `number[]` | 無 | 其水平線的位置,以 y 比例尺的值表示。`x` 與 `y` 皆未設定時,線條跟隨其比例尺的刻度,即未設定 `ticks` 的 `PlotAxis` 所放置的位置(橫向長條則沿 x 軸)。 |
| `Grid` | `ticks` | `number` | 座標軸的預設值 | 在 `x` 與 `y` 皆未設定時,大約繪製多少條線,如同 `PlotAxis` 的 `ticks`。 |
| `Line`、`Area` | `color` | `string \| (d, index) => string` | 無 | 其資料列的類別,顏色來自圖表的 `colorScale`:未另行設定時,其第一列的類別決定線條的 `stroke`(面積的 `fill`)([依類別著色](#colors-by-category))。 |

每個標記都填滿圖表,並以其 [SVG 繪製屬性](../modules/style-reference.md#svg-paint)繪製,標記自身的設定優先於圖表的,一如 CSS 的繼承方式:

| 標記 | 繪製所用 | 未設定時 |
|---|---|---|
| `Line` | `stroke`、`strokeWidth`、`strokeDasharray` | `currentColor`、寬 1、實線 |
| `Area` | `fill`(覆蓋其 `background` 部分);其頂邊 `stroke`、`strokeWidth`、`strokeDasharray` | `fill` `currentColor`(旁有背景時為 `none`);無描邊 |
| `Grid` | `stroke`、`strokeWidth`、`strokeDasharray` | `currentColor`、寬 1、實線;每條線對齊整數裝置像素,因此細線依然清晰 |

圖表沒有 y 比例尺的定義域時,`Line` 或 `Area` 所繪製的值(面積的 `y0` 也計算在內,即其基線或每列的底部值)會構成 y 比例尺的定義域;Grid 的值則不會。標記只在其繪製內容改變時才重新繪製(其資料列、值、曲線、圖表大小或比例尺、繪製屬性);指標移動只會移動懸停的各個部分,不會重新繪製標記。

帶狀面積是 `Area`,其 `y0` 讀取資料列:頂邊經過 `y1`,底邊折返經過 `y0`,兩者都使用面積的 `curve`,而 appear 動畫會從前緣將兩條邊繪入。其懸停圓點位於頂邊;其上的 `Line` 標示中間值:

```tsx
<Plot data={days} y="close">
  <Area y1="high" y0="low" class="fill-chart-1/15" hoverDotClass="hidden" />
  <Line class="stroke-chart-1 stroke-2" />
</Plot>
```

`fill` 與瀏覽器中的 CSS 相同:是一種顏色。線條之下的漸層是面積的背景,就像網頁在形狀中顯示漸層(方框的 `background-image` 置於 `clip-path` 之下):`backgroundClass="bg-linear-to-b from-chart-1/20 to-transparent"` 會由面積的最高點淡出至基線,使用主題的 token 與外觀的顏色,與任何檢視的背景相同。

## Bar

`Bar` 在 `band` 比例尺中每個資料列所屬的帶內繪製一根長條:在帶狀 x 比例尺上為直立,在帶狀 y 比例尺上為橫向(此時 x 比例尺 `linear`)。每根長條由 `base` 延伸至該列在另一比例尺上的值,因此負值會向另一方向延伸,沒有值的資料列沒有長條。在反向的值比例尺上,長條從頂邊向下或從右邊向左延伸,而反向的帶比例尺會把第一列的帶放在右邊或底部([反向比例尺](#reversed-scales))。

```tsx
import { Bar, Grid, Plot } from "nsh/base/plot";

const sales = [
  { month: "Jan", online: 42, store: 31 },
  { month: "Feb", online: 51, store: 28 },
  { month: "Mar", online: 48, store: 36 },
];

<Plot
  data={sales}
  xScale={{ type: "band", paddingInner: 0.3, paddingOuter: 0.15, groupPadding: 0.1 }}
  yScale={{ type: "linear", domain: [0, 60] }}
  class="h-40"
>
  <Grid y={[20, 40, 60]} class="stroke-border" />
  <Bar value="online" class="fill-chart-1" cornerRadii={{ topLeft: 4, topRight: 4 }} />
  <Bar value="store" class="fill-chart-2" cornerRadii={{ topLeft: 4, topRight: 4 }} />
</Plot>
```

不在堆疊內的長條會依標記的順序在每個帶內並排;`stack` 相同的長條會堆疊起來,每列的長條由堆疊中前一根結束之處開始:

```tsx
<Bar value="online" stack="sales" class="fill-chart-1" />
<Bar value="store" stack="sales" class="fill-chart-2" cornerRadii={{ topLeft: 4, topRight: 4 }} label={(d) => `${d.online + d.store}`} />
```

| 屬性 | 類型 | 預設值 | 說明 |
|---|---|---|---|
| `value` | `string \| (d, index) => number` | 圖表的 `y` | 每根長條所顯示的內容。 |
| `base` | `number \| string \| (d, index) => number` | `0` | 長條在值比例尺上由哪個值開始向外延伸:所有資料列共用一個值,或以欄位或函數為每列提供各自的值,使每根長條橫跨該列的基值至其值(沒有基值的資料列沒有長條)。它會計入定義域。堆疊由其第一根長條的基值開始,逐列計算。 |
| `stack` | `string` | 無 | 所加入的堆疊:`stack` 相同的長條依序堆疊(沒有值的資料列不會增加任何內容)。 |
| `scale` | `"y" \| "y2"` | `"y"` | 直立長條的值所沿用的 y 比例尺([雙軸](#dual-axes));兩者上的長條並排顯示,而堆疊只會堆疊其比例尺上的長條。 |
| `cornerRadii` | `number \| { topLeft?, topRight?, bottomRight?, bottomLeft? }` | `0` | 長條每個角的半徑;`{ topLeft: 4, topRight: 4 }` 會令直立長條的末端變圓。大於長條一半的半徑會自動調整至適合長條。 |
| `stagger` | `number` | `0` | 配合圖表的 appear 動畫,長條會逐根依序開始,逐列進行,佔 appear 時間(0 至 0.95)的這個比例,每根在餘下的時間內增長;0 則令所有長條一起增長。 |
| `inactiveOpacity` | `number` | 無 | 指標位於圖表上時,指標下方資料列以外的長條的不透明度,令該列突出:它會隨懸停淡入淡出,並隨懸停在長條之間移轉。 |
| `label` | `string \| (d, index) => string` | 無 | 每根長條值端的文字:欄位(其文字或數字),或由應用程式格式化並返回文字的函數。 |
| `labelClass`、`labelStyle` | `string`、`StyleProp<TextStyle>` | 無 | `label` 部分:置中於長條的文字,位於直立長條末端之上(向下延伸的長條則在其下),橫向長條則在其後(向回延伸的長條則在其前)。其內距即與長條的距離。 |
| `backgroundClass`、`backgroundStyle` | `string`、`StyleProp<ViewStyle>` | 無 | 其背景:每根長條的方框,其背景(`bg-linear-to-t from-… to-…`,由長條底部至頂部)只顯示在長條內,位於 `fill` 之下。設有背景時,未另行設定的 `fill` 為 `none`。 |
| `color` | `string \| (d, index) => string` | 無 | 每根長條的類別,顏色來自圖表的 `colorScale`:未另行設定時為長條的 `fill`([依類別著色](#colors-by-category))。 |

帶比例尺會依序為圖表的每個資料列配置一個帶,或為其 `domain` 的每個類別配置一個帶,一如 d3 的 `scaleBand`:

| 選項 | 預設值 | 說明 |
|---|---|---|
| `domain` | 無 | 各帶的類別,依序排列(d3 的 `scaleBand().domain()`):[`Cell`](#cell) 會放入其資料列的類別所屬的帶,`PlotAxis` 則寫出每個帶的類別;重複寫出的類別保留其第一個位置。未設定時,帶即為資料列,而在儲存格上則為儲存格沿座標軸所指明的類別,依資料列帶來的順序排列。 |
| `paddingInner` | `0` | 相鄰帶之間的間距,為每個帶步長的比例(0 至 1)。 |
| `paddingOuter` | `0` | 第一個帶之前與最後一個帶之後的間距,為步長的比例。取 `paddingInner` 的一半,會使各帶的中點在圖表上等距。 |
| `maxBandWidth` | 無 | 帶的最大寬度(以點為單位):在寬圖表上只有少數帶時,帶仍然保持窄,各自位於其位置的中央。 |
| `bandCount` | 資料列 | 在多於資料列數目時,座標軸所配置的帶數:資料列佔用前面的帶,並保持其寬度與位置,隨資料列加入。 |
| `groupPadding` | `0` | 帶內並排的長條之間的間距,為每根長條所佔位置的比例。 |
| `reverse` | `false` | 各帶從另一邊開始排列:第一列的帶在 x 軸的右邊、y 軸的底部;帶內並排的長條保持其順序。 |

長條以其 `fill`(`fill-*`;與 CSS 的繼承方式相同,繼承自圖表)繪製,未設定時為 `currentColor`(設有 `color` 時為其類別的顏色),並且不顯示懸停圓點。在帶比例尺上,懸停會找出指標下方的帶,圖表的十字線位於該帶內,寬度與該帶相同:`crossLineClass="w-full h-full bg-foreground/5"` 會為該帶著色,`w-px` 則在其中間保留一條線。圖表沒有定義域時,長條的值與基值會構成值比例尺的定義域。配合圖表的 appear 動畫,每根長條從其堆疊的基值長出;動態、淡入淡出與滑動都在平台的動畫執行器上運行,指標不會令任何長條重新繪製。

<a id="ranges"></a>

### 範圍

<!-- demo: el-plot-ranges -->

當 `base` 為欄位或函數時,每根長條會橫跨其資料列的兩個值:瀑布圖的一步由其之前的累計值到其之後的累計值,蠟燭的實體由開盤價到收盤價,任務由開始到結束。長條出現時會從其自身的基值長出,其標籤位於值端,上升的長條在其上方,下降的長條在其下方。

```tsx
const bridge = [
  { step: "Revenue", from: 0, to: 120, kind: "total" },
  { step: "Costs", from: 120, to: 72, kind: "down" },
  { step: "Other", from: 72, to: 81, kind: "up" },
  { step: "Profit", from: 0, to: 81, kind: "total" },
];

<Plot
  data={bridge}
  xScale={{ type: "band", paddingInner: 0.3 }}
  colorScale={{ type: "ordinal", domain: ["total", "up", "down"], range: ["#64748b", "#16a34a", "#dc2626"] }}
  class="h-40"
>
  <Bar value="to" base="from" color="kind" label={(d) => `${d.to - d.from}`} labelClass="text-xs pb-1" />
</Plot>
```

漏斗圖是置中的橫向長條:在帶狀 y 比例尺上使用 `base={(d) => -d.users / 2}` 與 `value={(d) => d.users / 2}`。

## Rule

`Rule` 沿值軸為每個資料列繪製一條直線,由 `base` 至該列的值:在帶比例尺上位於該列的帶中央(在帶狀 y 比例尺上則橫跨圖表),在點比例尺或線性比例尺上則位於該列沿 x 軸的位置。蠟燭的影線、箱形圖的鬚、誤差線和棒棒糖圖的桿都是 Rule;燭台圖則是 `Bar` 疊在 `Rule` 之上:

```tsx
import { Bar, Plot, Rule } from "nsh/base/plot";

<Plot
  data={days}
  xScale={{ type: "band", paddingInner: 0.4 }}
  colorScale={{ type: "ordinal", domain: ["up", "down"], range: ["#16a34a", "#dc2626"] }}
  class="h-48"
>
  <Rule value="high" base="low" color={(d) => (d.close >= d.open ? "up" : "down")} />
  <Bar value="close" base="open" color={(d) => (d.close >= d.open ? "up" : "down")} />
</Plot>
```

| 屬性 | 類型 | 預設值 | 說明 |
|---|---|---|---|
| `value` | `string \| (d, index) => number` | 圖表的 `y` | 每條線的終點。沒有值的資料列沒有線。 |
| `base` | `number \| string \| (d, index) => number` | `0` | 每條線的起點:所有資料列共用一個值(棒棒糖圖從零線出發的桿),或以欄位或函數為每列提供各自的值(蠟燭的最低價)。它會計入定義域。 |
| `scale` | `"y" \| "y2"` | `"y"` | 其值所沿用的 y 比例尺([雙軸](#dual-axes))。 |
| `stagger` | `number` | `0` | 配合圖表的 appear 動畫,線條會逐條依序開始,逐列進行,佔 appear 時間(0 至 0.95)的這個比例,每條在餘下的時間內由其起點開始增長。 |
| `inactiveOpacity` | `number` | 無 | 指標位於圖表上時,指標下方資料列以外的線條的不透明度,與 `Bar` 的相同。 |
| `color` | `string \| (d, index) => string` | 無 | 每條線的類別,顏色來自圖表的 `colorScale`:未另行設定時為線條的 `stroke`。 |

Rule 以其 `stroke`(`stroke-*`、`strokeWidth`、`strokeDasharray`;與 CSS 的繼承方式相同,繼承自圖表)描邊,未設定時為 `currentColor`,並且不顯示懸停圓點。圖表沒有定義域時,其值與基值會構成值比例尺的定義域;它會隨圖表的 appear 動畫由其起點增長,並隨比例尺的定義域移動,兩者都在平台的動畫執行器上運行。
## Dot

<!-- demo: el-plot-dots -->

`Dot` 會為每一列在其兩個值交會之處畫一個點:`x` 沿 `linear` x 比例尺、`value` 沿 y 軸向上,構成散佈圖;在 band x 比例尺上,每個點位於該列所屬 band 的中央;在 band y 比例尺上(此時 x 比例尺 `linear`),點的值沿 x 軸延伸,該列的 band 則由上而下排列,構成點狀圖(dot plot)。半徑 `r` 可以是適用於所有點的單一數字,或是每列的一個值,由 `rScale` 轉換為半徑,構成氣泡圖。沒有值的列不會有點。

```tsx
import { Dot, Grid, Plot } from "nsh/base/plot";
import { token } from "nsh";

const sessions = [
  { minutes: 12, trades: 5, platform: "iOS" },
  { minutes: 8, trades: 3, platform: "Android" },
  { minutes: 26, trades: 11, platform: "Web" },
  { minutes: 17, trades: 8, platform: "iOS" },
];

<Plot
  data={sessions}
  x="minutes"
  xScale={{ type: "linear", domain: [0, 40] }}
  yScale={{ type: "linear", domain: [0, 20] }}
  colorScale={{ type: "ordinal", domain: ["iOS", "Android", "Web"], range: [token("chart-1"), token("chart-2"), token("chart-3")] }}
  class="h-48"
>
  <Grid x={[10, 20, 30]} y={[5, 10, 15]} class="stroke-border" />
  <Dot
    value="trades"
    r={4}
    color="platform"
    inactiveOpacity={0.3}
    class="stroke-card stroke-2"
    hoverDotClass="rounded-full outline-2 outline-offset-1 outline-foreground"
  />
</Plot>
```

當 `r` 是欄位或函數時,每列的值決定其點的大小。`rScale={{ type: "sqrt", range: [min, max] }}` 會將數值的平方根對應到以點(points)為單位的半徑,與 d3 的 `scaleSqrt` 相同,因此值域(range)從 0 開始時,氣泡的面積與其值成正比;從大於 0 開始的值域則能讓最小的氣泡仍然可見。除非比例尺指定了定義域,否則定義域為 0 至最大值。較大的點會先繪製,讓較小的點疊在其上而保持可見:

```tsx
<Plot
  data={countries}
  x="gdp"
  xScale={{ type: "linear", domain: [-10, 95] }}
  yScale={{ type: "linear", domain: [48, 90] }}
  colorScale={{ type: "ordinal", range: [token("chart-1"), token("chart-2"), token("chart-3"), token("chart-4")] }}
  class="h-56"
>
  <Dot value="life" r="population" rScale={{ type: "sqrt", range: [3, 24] }} color="region" class="stroke-card" />
</Plot>
```

當圖表沒有定義域時,點的值會組成數值比例尺的定義域,且不會刻意延伸至 0,令散佈圖的座標軸貼合其點。點較大時,請為圖表提供在數值周圍留有餘地的 `domain`:位於定義域邊緣的氣泡會畫出圖表邊界之外。

在相同 band 中放置兩種 mark,就能組成比較同一列兩個值的圖表:棒棒糖圖是一條由 0 起的 `Rule`,其上方於值的位置疊有 `Dot`;啞鈴圖則是在 band y 比例尺上,以 `Rule` 連接一個值到另一個值,兩端各有一個 `Dot`:

```tsx
<Plot data={stocks} yScale={{ type: "band", paddingInner: 0.3 }} xScale={{ type: "linear", domain: [-50, 80] }} class="h-48">
  <Rule value="high" base="low" class="stroke-border stroke-2" />
  <Dot value="before" r={3.5} class="fill-card stroke-muted-foreground" hoverDotClass="hidden" />
  <Dot value="now" r={5} class="fill-chart-1 stroke-card stroke-2" hitRadius={24} />
</Plot>
```

| 屬性 | 類型 | 預設值 | 說明 |
|---|---|---|---|
| `value` | `string \| (d, index) => number` | 圖表的 `y` | 每個點沿數值軸的位置:沿 y 軸向上,或在 band y 比例尺上沿 x 軸。沒有值的列不會有點。 |
| `r` | `number \| string \| (d, index) => number` | `3` | 點的半徑(以點為單位),或是為每列提供一個值的欄位或函數,該值由 `rScale` 轉換為半徑(若沒有的話,該值即為半徑)。值缺失的列不會有點。 |
| `rScale` | `{ type: "sqrt"; domain?: [number, number]; range: [number, number] }` | 無 | `r` 的值如何轉換為半徑:將其平方根在 `domain`(沒有時為 0 至最大值)上對應到半徑的 `range`,因此從 0 開始的值域會令每個點的面積與其值成正比。超出定義域的值取值域的兩端。 |
| `stagger` | `number` | `0` | 配合圖表的 appear,點會逐列依次開始增長,涵蓋 appear 的這個比例(0 至 0.95);0 則讓所有點同時增長。 |
| `inactiveOpacity` | `number` | 無 | 當有一個點位於指標或按鍵焦點之下時,其他點的不透明度:它們會隨懸停淡入淡出。 |
| `color` | `string \| (d, index) => string` | 無 | 每個點的類別,其顏色取自圖表的 `colorScale`:在沒有其他設定時即點的 `fill`([依類別著色](#colors-by-category))。 |
| `hitRadius` | `number` | `8` | 指標距離點的邊緣多遠仍能找到它:在此距離內的點之中,指標會找到中心最接近它的那一個(Voronoi 單元),因此疊在大氣泡上的小氣泡可在其自身中心附近被找到。點狀圖的列,在半徑與一列同樣大時,可從沿該列的任何位置找到。 |
| `scale` | `"y" \| "y2"` | `"y"` | 其值所沿的 y 比例尺([雙軸](#dual-axes));在 band y 比例尺上的點則將值放在 x 軸上。 |
| `hoverDotClass`、`hoverDotStyle` | `string`、`StyleProp<ViewStyle>` | 圖表的 `dotClass`、`dotStyle` | `hoverDot` 部件:一個與指標下的點同寬同高、並以其為中心的 view。`rounded-full outline-2 outline-offset-1` 會為它加上外環;`hidden` 則令此 mark 不顯示任何外環。 |

點以其 `fill` 填色(`fill-*`;如 CSS 般從圖表繼承),未設定時使用 `currentColor`(即其類別的顏色,配合 `color`),並在有設定時以其 `stroke` 描邊(`stroke-*`、`strokeWidth`):以卡片顏色畫出的外環可讓重疊的點彼此分開。在有點的圖表上,圖表會回報中心最接近指標的點所屬的列(離每個點都 `null` 時除外),按鍵會依列的順序逐列移動(把列按 x 排序,按鍵就會由左至右走過各點),`hoverDot` 部件則標示該點。配合圖表的 appear,點會由無到有增長;配合 `motion.update`,點會移到新的值和大小,新列的點會增長出現,已移除列的點則縮小消失;全部由平台的 animator 處理,不會重新繪製任何 mark。

## Cell

<!-- demo: el-plot-cells -->

`Cell` 會為每一列同時在兩個 band 中畫出一個矩形:其 `x` 類別在 `band` x 比例尺上的 band,以及其 `y` 類別在 `band` y 比例尺上的 band,因此各列組成一個網格,即熱圖。相關矩陣、每月回報的日曆,以及每小時一週的交易,都是以 Cell 呈現。每個 Cell 填滿其兩個 band,因此比例尺的 `paddingInner` 與 `paddingOuter` 就是 Cell 之間及周圍的空隙。它的顏色是其 `value` 在圖表的 `colorScale`(一條顏色漸層,[沿漸層著色](#colors-along-a-ramp))上的對應色,或是其 `color` 類別透過序數比例尺取得的顏色。Cell 位於圖表的 x 與 y 比例尺上。

```tsx
import { Cell, Plot, PlotAxis } from "nsh/base/plot";
import { token } from "nsh";

const months = [
  { year: "2025", month: "Jan", ret: 2.7 },
  { year: "2025", month: "Feb", ret: -1.4 },
  { year: "2025", month: "Mar", ret: -5.8 },
  { year: "2026", month: "Jan", ret: 1.9 },
  { year: "2026", month: "Feb", ret: 3.2 },
];

<Plot
  data={months}
  xScale={{ type: "band", domain: ["Jan", "Feb", "Mar"], paddingInner: 0.08 }}
  yScale={{ type: "band", paddingInner: 0.08 }}
  colorScale={{ type: "diverging", range: [token("destructive"), token("muted"), token("chart-1")] }}
  class="ml-10 mt-6 h-24"
>
  <Cell
    x="month"
    y="year"
    value="ret"
    cornerRadii={3}
    inactiveOpacity={0.4}
    label={(d) => d.ret.toFixed(1)}
    labelClass="text-xs tabular-nums text-black/70 data-dark:text-white"
    hoverCellClass="rounded-sm outline-2 outline-offset-1 outline-foreground"
  />
  <PlotAxis placement="top" labelClass="pb-1.5 text-xs text-muted-foreground" />
  <PlotAxis placement="left" labelClass="w-10 pr-2 text-right text-xs text-muted-foreground" />
</Plot>
```

band 比例尺的 `domain` 會按順序列出其 band 的類別,與 d3 的 `scaleBand().domain()` 相同:例如日曆的月份由一月至十二月,不論有沒有對應的列,每個月都有自己的 band,所以上圖的 2026 年 3 月是網格中的空白位置。沒有定義域時,band 就是 Cell 沿該軸所指名的類別,依列帶來的順序排列(2025 在 2026 之上)。沿類別 band 比例尺的 `PlotAxis` 會寫出每個 band 的類別,不需要 `format`。

相關矩陣沿兩個軸列出相同的持倉,其 `domain` 為係數的整個範圍,因此無論是哪些持倉,係數 0 都取漸層的中間色:

```tsx
const tickers = ["NVDA", "AMD", "MSFT", "GLD"];

<Plot
  data={pairs}
  xScale={{ type: "band", domain: tickers, paddingInner: 0.06 }}
  yScale={{ type: "band", domain: tickers, paddingInner: 0.06 }}
  colorScale={{ type: "diverging", domain: [-1, 1], range: [token("chart-2"), token("muted"), token("chart-1")] }}
  class="aspect-square"
>
  <Cell x="b" y="a" value="r" label={(d) => d.r.toFixed(2)} labelClass="text-xs text-black/70 data-dark:text-white" />
</Plot>
```

| 屬性 | 類型 | 預設值 | 說明 |
|---|---|---|---|
| `x` | `string \| (d, index) => string` | 無 | 每列所在的欄:欄位(其文字或數字)或回傳類別的函數。該列的 Cell 放在 x 比例尺中該類別的 band;沒有類別的列不會有 Cell。 |
| `y` | `string \| (d, index) => string` | 無 | 每列所在的行,方式與 `x` 相同,沿 y 比例尺。 |
| `value` | `string \| (d, index) => number` | 無 | 每個 Cell 的數字,由 `sequential` 或 `diverging` `colorScale` 轉為顏色。沒有數字的列取比例尺的 `unknown` 顏色,若也沒有則沒有 Cell。 |
| `color` | `string \| (d, index) => string` | 無 | 每個 Cell 的類別,其顏色取自 ordinal `ordinal` `colorScale`([依類別著色](#colors-by-category))。 |
| `cornerRadii` | `number \| { topLeft?, topRight?, bottomRight?, bottomLeft? }` | `0` | 每個 Cell 各個角的半徑。 |
| `stagger` | `number` | `0` | 配合圖表的 appear,Cell 會逐列依次開始增長,涵蓋 appear 的這個比例(0 至 0.95),其餘時間各自從中央增長;0 則讓所有 Cell 同時增長。 |
| `inactiveOpacity` | `number` | 無 | 當有一個 Cell 位於指標或按鍵焦點之下時,其他 Cell 及其標籤的不透明度:它們會隨懸停淡入淡出。 |
| `label` | `string \| (d, index) => string` | 無 | `label` 部件:每個 Cell 中央的文字,可為欄位(其文字或數字)或回傳由應用程式格式化之文字的函數。每個標籤只在其排版後的大小能容納於 Cell 內時才顯示,因此窄的圖表只顯示顏色。 |
| `labelClass`、`labelStyle` | `string`、`StyleProp<TextStyle>` | 無 | 標籤的字型、大小與顏色。其 `colorScale` 顏色偏深的 Cell 上的標籤帶有屬性 `data-dark`(此時淺色文字較易閱讀),因此 `data-dark:text-white` 在該處會將其寫成淺色。 |
| `hoverCellClass`、`hoverCellStyle` | `string`、`StyleProp<ViewStyle>` | 無 | `hoverCell` 部件:與指標或按鍵所在 Cell 一樣大的 view,覆蓋其上;`rounded-sm outline-2 outline-foreground` 為它加上外環。它在同一幀內跟隨指標移動,按鍵移動它時則以 `pointer` spring 滑動。 |

當應用程式沒有設定 `fill` 時,Cell 以圖表 `colorScale` 中的顏色填色(`fill-*` 的 class 和樣式優先,如 CSS 般從圖表繼承),沒有任何設定時則用 `currentColor`,並在有設定時以其 `stroke` 描邊。在有 Cell 的圖表上,圖表會回報指標之下的 Cell 所屬的列,在兩個 Cell 之間的空隙則回報較近的一個;方向鍵依螢幕上的網格逐格移動([鍵盤操作](#keyboard)),螢幕閱讀器則依列的順序逐列讀取。配合圖表的 appear,Cell 從中央增長;配合 `motion.update`,Cell 的顏色會滑動至新的顏色,新列的 Cell 增長出現,已移除列的 Cell 縮小消失,Cell 也會移到新的 band;全部由平台的 animator 處理,不會重新繪製任何 mark。
<a id="pie-and-arc"></a>

## 圓餅圖與弧形

`Pie` 會把一整圈按每一列分成一塊扇形，每塊佔所有列數值的比例，按列的順序，由 12 點鐘方向起順時針圍繞繪圖區的中心排列。`innerRadius` 則把它變成環形圖。每塊扇形都是獨立的畫布，即 `slice` 部件，因此各自以自己的 class 繪製：`sliceClass` 可以是每塊扇形都相同的 class，也可以是以該扇形所屬的列為參數的函數，讓每塊扇形各有其 class。滑鼠指標移到圓餅圖上時，繪圖區會回報指標下扇形所屬的列（在中空部分或圓環以外則無），其工具提示跟隨指標移動，而該扇形會放大 `hoverLift`，其餘扇形則淡出 `hoverDim`，並透過平台的動畫器以繪圖區的 `motion` 執行。`Arc` 會繪製兩個角度之間的一個扇區：例如儀表的軌道及其數值，或圓餅圖後面的圓環。

<!-- demo: el-plot-pie -->

```tsx
import { signal, Text, View } from "nsh";
import { Pie, Plot } from "nsh/base/plot";

type Plan = { name: string; seats: number };

const FILLS = ["fill-chart-1", "fill-chart-2", "fill-chart-3", "fill-chart-4"];
const KEYS = ["bg-chart-1", "bg-chart-2", "bg-chart-3", "bg-chart-4"];

export function Seats(props: { plans: Plan[] }) {
  const hovered = signal<number | null>(null);
  const total = () => props.plans.reduce((sum, p) => sum + p.seats, 0);
  const shown = () => (hovered() == null ? undefined : props.plans[hovered()!]);
  const share = (n: number) => `${((n / total()) * 100).toFixed(1)}%`;
  return (
    <View class="flex-row items-center gap-6 rounded-xl border border-border bg-card p-4">
      <Plot
        data={props.plans}
        accessibilityLabel={`Seats by plan, ${total()} in all`}
        accessibilityValue={{ text: shown() && `${shown()!.name}, ${shown()!.seats} seats, ${share(shown()!.seats)}` }}
        appearGeneration={1}
        motion={{ appear: { duration: 900, easing: "easeOut" }, enter: { duration: 120 }, exit: { duration: 160 }, pointer: { stiffness: 400, damping: 32 } }}
        onHoverChange={({ index }) => hovered.set(index)}
        class="size-44"
      >
        {/* A donut with 2-point gaps (0.025 of a turn at its 80-point rim). */}
        <Pie
          value="seats"
          innerRadius="62%"
          padAngle={0.025}
          sliceClass={(_, i) => FILLS[i % FILLS.length]}
          hoverLift={6}
          hoverDim={0.64}
        />
        {/* The hovered plan, or the total, in the hole. */}
        <View class="absolute inset-0 items-center justify-center gap-1">
          <Text class="text-xs text-muted-foreground">{shown()?.name ?? "Total"}</Text>
          <Text class="text-2xl font-semibold tabular-nums text-foreground">{shown()?.seats ?? total()}</Text>
        </View>
      </Plot>
      {/* The legend: a key in each slice's color, the value and the share at the end. */}
      <View class="flex-1 gap-1">
        {props.plans.map((plan, i) => (
          <View class="flex-row items-center gap-3 rounded-md px-2 py-1.5" style={{ opacity: hovered() == null || hovered() === i ? 1 : 0.45 }}>
            <View class={`size-2 rounded-sm ${KEYS[i % KEYS.length]}`} />
            <Text class="flex-1 text-sm text-foreground">{plan.name}</Text>
            <Text class="text-right text-sm tabular-nums text-foreground">{plan.seats}</Text>
            <Text class="w-14 text-right text-sm tabular-nums text-muted-foreground">{share(plan.seats)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
```

```rust
use nsh_base::plot::{SliceClass, pie, plot};
use nsh_core::{element::{RowAccessor, Rows}, prelude::*};

fn seats(seats: Vec<f64>) -> impl IntoElement {
    let rows = Rows::from_columns(seats.len(), [("seats".into(), seats)]);
    plot()
        .data(rows)
        .accessibility_label("Seats by plan")
        .w(px(176.0))
        .h(px(176.0))
        .child(
            pie()
                .value(RowAccessor::key("seats"))
                .inner_radius(relative(0.62))
                .slice_class(SliceClass::from_fn(|i| format!("fill-chart-{}", i % 4 + 1).into())),
        )
}
```

| 標記 | 屬性 | Rust | 類型 | 預設值 | 說明 |
|---|---|---|---|---|---|
| `Pie` | `value` | `.value(..)` | `keyof T \| (d: T, index: number) => number` | 繪圖區的 `y` | 每一列的值。值為零、為負數或不是數字的列沒有扇形。 |
| `Pie`、`Arc` | `startAngle`、`endAngle` | `.start_angle(..)`、`.end_angle(..)` | `number`（弧度） | `0`、`2 * Math.PI` | 第一塊扇形的起點與最後一塊的終點（弧形的兩端）：由 12 點鐘方向起順時針計算的弧度。`endAngle` 若小於 `startAngle`，圓餅圖的扇形會以相反方向排列。 |
| `Pie` | `padAngle` | `.pad_angle(..)` | `number`（弧度） | `0` | 相鄰扇形在外緣的夾角。每道間隙在任何半徑都保持該寬度（約 `padAngle * outerRadius` 點），兩邊平行，因此在中心或中空處與在外緣一樣寬；太窄而未能伸達中心的扇形，會在兩邊相交處終止。只有一塊扇形的圓餅圖沒有間隙。 |
| `Pie`、`Arc` | `innerRadius`、`outerRadius` | `.inner_radius(..)`、`.outer_radius(..)` | ``number \| `${number}%` `` | `0`、`"100%"` | 中空部分與外緣的半徑：以點為單位，或以繪圖區所容納的最大圓（其較短一邊的一半）的百分比表示。 |
| `Pie`、`Arc` | `cornerRadius` | `.corner_radius(..)` | `number` | `0` | 每塊扇形（或弧形）轉角的半徑，以點為單位，與 d3 的 `arc.cornerRadius` 相同：每個轉角都是一個與邊緣及外緣（或中空處）相切的圓，包括間隙的平行邊。最大為圓環厚度的一半，此時弧形會有圓形端點；扇形太窄而容不下兩個完整轉角時，兩者會在其中線相遇。完整的圓環只保留圓形邊緣。 |
| `Pie` | `sliceClass` | `.slice_class(..)` | `string \| (d: T, index: number) => string` | 無 | 每塊扇形的 class（`fill-*`、`stroke-*`）：可以每塊都相同，也可以是以該扇形所屬的列及其索引為參數的函數，在列或函數改變時對每列各呼叫一次。 |
| `Pie` | `sliceStyle` | `.slice_style(..)` | `StyleProp<ViewStyle>` | 無 | 每塊扇形的樣式，疊加在其 class 之上（`fill`、`stroke`、`strokeWidth`）。 |
| `Pie` | `hoverLift` | `.hover_lift(..)` | `number` | `0` | 指標下的扇形比其他扇形多放大多少，以點為單位：使用繪圖區的 `pointer` 彈簧動畫，隨懸停淡入淡出。 |
| `Pie` | `hoverDim` | `.hover_dim(..)` | `number`（0 至 1） | `0` | 有扇形位於指標下時，其他扇形淡出的程度，以其不透明度的比例計算，並採用懸停的淡化效果。 |
| `Pie` | `color` | `.color(..)` | `keyof T \| (d: T, index: number) => string` | 無 | 每塊扇形的類別，其顏色來自繪圖區的 `colorScale`：在沒有任何設定時，使用該扇形的 `fill`（[按類別著色](#colors-by-category)）。 |
| `Pie` | `label` | `.label(..)` | `string \| (d: T, index: number) => string` | 無 | 每塊扇形旁的文字：可以是欄位（取其數值），也可以是由應用程式格式化並返回文字的函數。文字為空的列，或窄於半度的扇形，沒有標籤。 |
| `Pie` | `labelClass`、`labelStyle` | `.label_class(..)`、`.label_style(..)` | `string`、`StyleProp<TextStyle>` | 無 | `label` 部件：位於圓環外、引導線末端的文字，以該末端為中心，在圓餅圖右半部排在末端之後，在左半部則排在末端之前。其內距即與引導線末端的距離。 |
| `Pie` | `labelGap` | `.label_gap(..)` | `number` | `15` | 標籤與外緣相距多遠，以點為單位。 |
| `Pie` | `labelLineClass`、`labelLineStyle` | `.label_line_class(..)`、`.label_line_style(..)` | `string \| (d: T, index: number) => string`、`StyleProp<ViewStyle>` | 無 | `labelLine` 部件：每個標籤的引導線，由扇形中線處的外緣伸至標籤所在半徑，再橫向連到文字。其 `stroke`（未設定時為 `currentColor`）、`strokeWidth` 與 `strokeDasharray`，可以每條線都相同，也可以是以該扇形所屬的列為參數的函數；套用樣式後才會顯示。 |

扇形與弧形以 `fill` 填色（未設定時為 `currentColor`，扇形的類別顏色則配合 `color`），並以 `stroke` 描繪邊緣（未設定時為無），各自的設定優先於圓餅圖及繪圖區的設定，按 CSS 的繼承方式處理：以表面顏色（`stroke-card stroke-2`）描邊，也會在扇形之間切出間隙。它們的值不參與繪圖區的比例尺。圓餅圖的扇形只會在列、其數值、角度、半徑或繪圖區大小改變時重繪；指標移動時，放大與淡出效果由動畫器處理。

含圓餅圖的繪圖區通常會把工具提示放在指標旁（`tooltipPlacement="pointer"`），因為圓餅圖的列在軸上沒有位置：十字線與工具提示會在其上跟隨指標，並且不會顯示懸停圓點。環形圖的中心是應用程式自行疊在繪圖區上的元素（顯示懸停扇形的值或總計），圖例亦然，每個圖例標記都使用其扇形的顏色。

圓餅圖的標籤會在圓環外標示各扇形：每段文字位於外緣之外 `labelGap` 處，朝向其扇形的中線（即扇形在該半徑處的形心），然後橫向移到圓餅圖該扇形一側的同一半徑處，並以套用了樣式的引導線連到外緣。標籤會隨繪圖區的入場動畫與扇形一同掃入，並在動畫尾段淡入，在 `motion.update` 時隨扇形移動，並隨懸停的扇形上浮；這一切都透過平台的動畫器執行。請為標籤預留空間：把 `outerRadius` 設為低於 `"100%"` 的值，或在繪圖區四周留白。應用程式自行在扇形位置加入的內容，則與環形圖的中心一樣，是疊在繪圖區上的元素。

```tsx
<Pie
  value="seats"
  outerRadius="64%"
  sliceClass={(_, i) => FILLS[i % FILLS.length]}
  label={(d) => share(d.seats)}
  labelGap={12}
  labelClass="px-1 text-xs tabular-nums text-muted-foreground"
  labelLineClass="stroke-border"
/>
```

<a id="colors-by-category"></a>

## 按類別著色

繪圖區的 `colorScale` 為各類別指定顏色，作用與 d3 的 `scaleOrdinal` 相同，而標記的 `color` 則指出每一列所屬的類別：可以是欄位（取其文字或數字），也可以是以該列為參數的函數。`domain` 的類別按次序取用 `range` 的顏色，當定義域比值域長時，值域會由第一個顏色重新開始。不在定義域內的類別會取 `unknown`；若沒有設定，則在標記首次遇到它時加入定義域（按標記的次序，每個標記再按其列的次序），並取用下一個顏色，因此在完全沒有 `domain` 的情況下，各類別會按列帶來的次序取得顏色。顏色由應用程式決定：可以是 CSS 顏色，包括主題的 token。

```tsx
import { Pie, Plot } from "nsh/base/plot";
import { token } from "nsh";

const regions = [
  { name: "North America", revenue: 482 },
  { name: "EMEA", revenue: 312 },
  { name: "APAC", revenue: 268 },
];

<Plot data={regions} colorScale={{ type: "ordinal", range: [token("chart-1"), token("chart-2"), token("chart-3")] }} class="size-44">
  <Pie value="revenue" color="name" innerRadius="62%" />
</Plot>
```

扇形、長條與圓點取其所屬列的顏色；`Line` 與 `Area` 各自是一個數列，取其第一列的顏色，因此各自帶有列的線條（`data`）會使用其列的顏色，而同一個比例尺可令同一類別的顏色在圓餅圖、長條與折線中保持一致。在沒有任何設定時，顏色就是標記的 `fill`（折線則為 `stroke`），取代 `currentColor`：應用程式的 class 與樣式優先，其次是部件的（`sliceClass`、`sliceStyle`）、標記的，以及從繪圖區繼承而來的，因此 `sliceClass={(d) => (d.name === "Other" ? "fill-muted" : "")}` 可以單獨設定某一塊扇形，而其他扇形仍由比例尺著色。在有 `background` 部件時，長條與區域的 `fill` 仍維持 `none`。

| `OrdinalScale` | 類型 | 預設值 | 說明 |
|---|---|---|---|
| `type` | `"ordinal"` | （必填） | 比例尺的種類。 |
| `domain` | `string[]` | 無 | 依次序排列的類別。重複寫出的類別保留其第一次出現的位置。 |
| `range` | `string[]` | （必填） | 依次序排列的顏色（CSS 顏色）；第 `i` 個類別取第 `i % range.length` 個顏色。 |
| `unknown` | `string` | 無 | 定義域以外所有類別的顏色；沒有設定時，各類別取用下一個顏色。 |

<a id="colors-along-a-ramp"></a>

### 沿漸變色帶著色

`colorScale` 若為 `type: "sequential"` 或 `"diverging"`，會讓數字沿漸變色帶取得顏色，作用與 d3 的 `scaleSequential` 和 `scaleDiverging` 相同，供 [`Cell`](#cell) 的 `value` 使用。其 `range` 是兩個或以上的顏色，由色帶的低端至高端均勻分布，並在其間以 OKLab 混合：色階在視覺上均勻，而兩種色相會經由它們自己的混合色相接。超出 `domain` 的值取色帶的端點顏色，沒有值的列則取 `unknown`。

`sequential` 把其 `domain` 攤布於整條色帶，除非應用程式指定，否則定義域為各格數值的範圍：適用於計數、數量、活躍程度。`diverging` 則把其 `pivot`（預設為 0）放在色帶的中間顏色，低於它的值沿前半段，高於它的值沿後半段：虧損用一種色相，收益用另一種色相，持平的月份則落在中性的中間色。除非應用程式指定定義域，否則定義域為數值範圍，並在支點兩側取成對稱（Observable Plot 的 `symmetric`），因此大小相同的虧損與收益強度相同；相關矩陣則會指定 `domain: [-1, 1]`。

```tsx
colorScale={{ type: "sequential", range: [token("muted"), token("chart-1")] }}
colorScale={{ type: "diverging", pivot: 0, range: [token("destructive"), token("muted"), token("chart-1")] }}
```

| `SequentialScale`、`DivergingScale` | 類型 | 預設值 | 說明 |
|---|---|---|---|
| `type` | `"sequential" \| "diverging"` | （必填） | 色帶的種類。 |
| `domain` | `[number, number]` | 數值的範圍（`diverging` 則以支點為中心取成對稱） | 色帶兩端的值。 |
| `pivot` | `number` | `0` | 僅限 `diverging`：色帶中間顏色的值。 |
| `range` | `string[]` | （必填） | 沿色帶由低端至高端排列的顏色（CSS 顏色），其間以 OKLab 混合。 |
| `unknown` | `string` | 無 | 沒有值的列的顏色；沒有設定時，該列沒有格。 |
<a id="radialline-and-radialgrid"></a>

## RadialLine 與 RadialGrid

`RadialLine` 會圍繞繪圖區中心繪製一個數據系列：雷達圖的多邊形，或是錶盤上的一條線。每個有值的資料列都是位於該列角度上的一個點，距中心的遠近由繪圖區的 y 比例尺按其值決定，由 `innerRadius`（定義域的最小值）至 `outerRadius`（最大值）。沒有 `angle` 時，各列會由 12 點鐘方向起，按順序順時針平均分佈一圈，所以六列便是一個六邊形；`closed` 會將最後一點連回第一點。線條會描畫其各點，並把其面積填滿至 `innerRadius`（預設為中心），所以一個標記就同時是雷達圖的輪廓及其底色。`RadialGrid` 會在其後方繪製雷達圖的網格：`rings` 位於 y 比例尺的各個值，是穿過各列角度的多邊形或 `circular`，以及 `spokes` 伸向每一列。在徑向線上，繪圖區會回報角度最接近指標角度（在線條外半徑之內）的那一列，而每條線的懸停圓點就落在其於該列的點上。

```tsx
import { signal, Text, View } from "nsh";
import { Plot, RadialGrid, RadialLine } from "nsh/base/plot";

type Metric = { name: string; ours: number; theirs: number };

export function Compare(props: { metrics: Metric[] }) {
  const hovered = signal<number | null>(null);
  const shown = () => (hovered() == null ? undefined : props.metrics[hovered()!]);
  return (
    <View class="items-center gap-3 rounded-xl border border-border bg-card p-4">
      <Text class="text-sm tabular-nums text-muted-foreground">
        {shown() ? `${shown()!.name}: ${shown()!.ours} against ${shown()!.theirs}` : "Ours against theirs"}
      </Text>
      <Plot
        data={props.metrics}
        yScale={{ type: "linear", domain: [0, 100] }}
        accessibilityLabel="Ours against theirs on six metrics"
        accessibilityValue={{ text: shown() && `${shown()!.name}: ours ${shown()!.ours}, theirs ${shown()!.theirs}` }}
        appearGeneration={1}
        motion={{ appear: { duration: 700, easing: "easeOut" }, update: { duration: 400, easing: "easeInOut" }, enter: { duration: 120 }, exit: { duration: 160 }, pointer: { stiffness: 380, damping: 34 } }}
        onHoverChange={({ index }) => hovered.set(index)}
        class="size-56"
      >
        <RadialGrid rings={[25, 50, 75, 100]} spokes outerRadius="80%" class="stroke-border" />
        <RadialLine radius="theirs" closed outerRadius="80%" class="fill-chart-2/15 stroke-chart-2" hoverDotClass="size-2 rounded-full border-2 border-card bg-chart-2" />
        <RadialLine radius="ours" closed outerRadius="80%" class="fill-chart-1/25 stroke-chart-1 stroke-2" hoverDotClass="size-2.5 rounded-full border-2 border-card bg-chart-1" />
        {/* Each metric's name past the rim at its row's angle, growing away from the center. */}
        {props.metrics.map((m, i) => {
          const angle = (2 * Math.PI * i) / props.metrics.length;
          const away = (v: number) => (v > 0.01 ? "flex-start" : v < -0.01 ? "flex-end" : "center");
          const align = (v: number) => (v > 0.01 ? "left" : v < -0.01 ? "right" : "center");
          return (
            <View
              class="absolute size-0"
              style={{
                left: `${50 + 44 * Math.sin(angle)}%`,
                top: `${50 - 44 * Math.cos(angle)}%`,
                alignItems: away(Math.sin(angle)),
                justifyContent: away(-Math.cos(angle)),
                pointerEvents: "none",
              }}
            >
              <Text class="w-24 text-xs text-muted-foreground" style={{ textAlign: align(Math.sin(angle)) }}>{m.name}</Text>
            </View>
          );
        })}
      </Plot>
    </View>
  );
}
```

| 標記 | 屬性 | Rust | 類型 | 預設值 | 說明 |
|---|---|---|---|---|---|
| `RadialLine` | `radius` | `.radius(..)` | `keyof T \| (d: T, index: number) => number` | 繪圖區的 `y` | 決定每一列距中心多遠：y 比例尺的一個值，在定義域最小值處為 `innerRadius`，在最大值處為 `outerRadius`。沒有值的列會被略過。 |
| `RadialLine` | `angle` | `.angle(..)` | `keyof T \| (d: T, index: number) => number` | 各列平均分佈一圈 | 每一列圍繞中心的位置：由 12 點鐘方向起順時針計的弧度。 |
| `RadialLine`、`RadialGrid` | `startAngle`、`endAngle` | `.start_angle(..)`、`.end_angle(..)` | `number`（弧度） | `0`、`2 * Math.PI` | 沒有 `angle` 時各列的位置：由 `startAngle` 起平均分佈。若繞滿一圈，相鄰兩列相隔一圈的 `1 / rows`，最後一列在第一列前一步；若只佔一圈的一部分，第一列在 `startAngle`，最後一列在 `endAngle`。 |
| `RadialLine`、`RadialGrid` | `innerRadius`、`outerRadius` | `.inner_radius(..)`、`.outer_radius(..)` | ``number \| `${number}%` `` | `0`、`"100%"` | y 定義域的最小值和最大值的位置：以點數計，或以繪圖區可容納的最大圓（較短邊的一半）的百分比計，與圓餅圖的半徑相同。線條的面積填滿至 `innerRadius`；網格的輻條在兩者之間延伸。 |
| `RadialLine` | `curve` | `.curve(..)` | `"linear" \| "natural" \| "stepAfter"` | `"linear"` | 連接各點的方式：直線段、平滑曲線（封閉時為平滑環）或階梯。 |
| `RadialLine` | `closed` | `.closed(..)` | `boolean` | `false` | 由最後一點接回第一點：雷達圖的多邊形。開放時，其面積會閉合至中心（或沿其內緣）。 |
| `RadialLine` | `dot`、`dotClass`、`dotStyle` | `.dot(..)`、`.dot_class(..)`、`.dot_style(..)` | `boolean`、`string`、`StyleProp<ViewStyle>` | `false` | 每個點上的圓點：以該點為中心的視圖，其大小、背景和邊框由應用程式決定。圓點會向外長出並隨線條移動。 |
| `RadialLine` | `backgroundClass`、`backgroundStyle` | `.background_class(..)`、`.background_style(..)` | `string`、`StyleProp<ViewStyle>` | 無 | 其背景：圍繞其外圓的方框，其背景（`bg-*`、漸變）只顯示在其面積之內、`fill` 之下，與面積圖相同。 |
| `RadialLine` | `hoverDotClass`、`hoverDotStyle` | `.hover_dot_class(..)`、`.hover_dot_style(..)` | `string`、`StyleProp<ViewStyle>` | 繪圖區的 `dotClass`、`dotStyle` | 其懸停圓點，位於指標下那一列的點上，指標處於同一框架內，按鍵切換時會以繪圖區的 `pointer` 彈簧滑向下一列；`hidden` 則不顯示。 |
| `RadialGrid` | `rings` | `.rings(..)` | `number[]` | 無 | 其圓環的位置，以 y 比例尺的值表示：每個環與徑向線放置該值的位置同樣遠。 |
| `RadialGrid` | `spokes` | `.spokes(..)` | `boolean` | `false` | 在每一列的角度上，由 `innerRadius` 至 `outerRadius` 的一條線。 |
| `RadialGrid` | `circular` | `.circular(..)` | `boolean` | `false` | 其環為圓形（只佔部分圓周時為圓弧）。預設為穿過各列角度的多邊形，繪圖區少於三列時則為圓形。 |

徑向線以 `stroke`、`strokeWidth` 和 `strokeDasharray` 描邊（未設定時為 `currentColor`，線寬 1 的實線），並以 `fill` 填滿其面積（未設定時不填色）；徑向網格的描邊方式與一般網格相同。它們的繪製樣式繼承自繪圖區。繪圖區沒有設定 y 定義域時，線條的各個值連同 0 會構成 y 比例尺的定義域，所以正值的雷達圖會由中心向外伸展；網格的環則不參與。若要在數值變化時令環和雷達圖的比例尺保持固定，請為繪圖區設定 y `domain`。

雷達圖四周的標籤是應用程式覆疊在繪圖區上的元素，就如環形圖的中心一樣。沒有 `angle` 時，`n` 列中的第 `i` 列位於距 12 點鐘方向 `a = 2π·i / n` 之處，所以在正方形繪圖區中，位於 `left: 50% + r·sin(a)`、`top: 50% − r·cos(a)`（`r` 為繪圖區邊長的百分比，略大於外半徑所佔比例的一半）而沒有尺寸的方框，會標示出邊緣之外的位置，名稱則由該處向遠離中心的方向伸展：在右半邊時位於其右方，在左半邊時位於其左方，在頂部時位於其上方，在底部時位於其下方，如上所示。

```rust
use nsh_base::plot::{plot, radial_grid, radial_line};
use nsh_core::{element::{RowAccessor, Rows}, prelude::*};

fn compare(ours: Vec<f64>, theirs: Vec<f64>) -> impl IntoElement {
    let rows = Rows::from_columns(ours.len(), [("ours".into(), ours), ("theirs".into(), theirs)]);
    plot()
        .data(rows)
        .accessibility_label("Ours against theirs")
        .w(px(224.0))
        .h(px(224.0))
        .child(radial_grid().rings(vec![25.0, 50.0, 75.0, 100.0]).spokes(true))
        .child(radial_line().radius(RowAccessor::key("theirs")).closed(true))
        .child(radial_line().radius(RowAccessor::key("ours")).closed(true))
}
```

## Sankey

`Sankey` 會繪製繪圖區各列之間的流向：每一列都是一個節點，`links` 指明它們之間的流向，即 `{ source, target, value }` with the indices of two rows in the plot's `data`。它按繪圖區的大小，以 d3-sankey 的方式排版：節點分成多個欄（`nodeAlign`），每個節點的高度等於流入或流出它的最大總量，同一欄的節點相隔 `nodePadding`，並經 `iterations` 輪鬆弛調整，使其靠近各自的流向；每條連結則有一條由來源節點右緣伸至目標節點左緣的絲帶，兩端的闊度各為其佔該節點該側的比例，所以即使節點的流入與流出不相等，其兩側仍會被完全覆蓋。每一欄都在繪圖區內置中，而一連串相同的單節點欄會稍為錯開，令它們之間的絲帶呈現彎曲。`valueScale="sqrt"` 按數值的平方根決定大小，使單一佔優的流向不會令小流向相形見絀。

每個節點和每條絲帶都是各自獨立的畫布，即 `node` 和 `link` 部件，因此各自使用自己的樣式類別：`nodeClass` 可以是對每個節點都相同的類別，也可以是節點所屬列的函數；`linkClass` 可以是對每條絲帶都相同的類別，也可以是連結的函數。`linkBackground` 部件在每條絲帶內顯示背景，即由來源至目標的一個方框：以連結的函數可為每條絲帶提供由來源顏色漸變至目標顏色的效果。絲帶繪製在節點之下，兩者都隨繪圖區的出現動畫由前緣開始繪入。

在桑基圖上，繪圖區會回報指標下的節點（`onHoverChange`，即該節點所屬的列；在絲帶上則為無），其工具提示跟隨指標，而未連接該節點的連結會按 `hoverDim` 淡出，由平台的動畫器配合繪圖區的 `motion` 執行。按鍵會按各列的順序逐個切換節點，工具提示顯示在每個節點中間的旁邊。`nodeLabel` 為每個節點命名，`valueLabel` 提供其數值，兩者都設定時，數值顯示在名稱之上：第一欄的節點，標籤在其左方；最後一欄的節點，標籤在其右方；中間各欄的節點，標籤置中顯示在其上方，與 `gpui-component` 的圖表放置方式相同；節點旁的標籤會保持在繪圖區頂部與底部之間，而超出繪圖區邊緣的標籤，則位於應用程式在其四周預留的空間（即其邊距）之內。`nodeLabel` 部件的內距是與其節點之間的間隙，其類別則決定文字樣式（`max-w-20 truncate` 會截短過長的名稱）；標籤隨出現動畫淡入。當應用程式更改流向時，每個節點和絲帶都會以繪圖區的 `motion.update` 由舊位置移至新位置，其標籤亦一併移動：新加入流向的節點由其中間長出，新加入的連結由其最小闊度長出，而被移除的則會立即消失；動畫進行期間再有更改，會由當時繪製的位置繼續。連結以其來源和目標區分，所以重新排列 `links` 不會令任何東西移動。

```tsx
import { signal } from "nsh";
import { Plot, Sankey } from "nsh/base/plot";

type Step = { name: string };

const steps: Step[] = [{ name: "Visits" }, { name: "Sign-ups" }, { name: "Bounced" }, { name: "Trials" }, { name: "Paid" }, { name: "Churned" }];
const flows = [
  { source: 0, target: 1, value: 4200 },
  { source: 0, target: 2, value: 5800 },
  { source: 1, target: 3, value: 2600 },
  { source: 3, target: 4, value: 1100 },
  { source: 3, target: 5, value: 1500 },
];
// Each step's color: its node's fill, and its ribbons' gradient ends.
const FILLS = ["fill-chart-1", "fill-chart-2", "fill-muted", "fill-chart-3", "fill-chart-4", "fill-muted"];
const FROM = ["from-chart-1/40", "from-chart-2/40", "from-muted/40", "from-chart-3/40", "from-chart-4/40", "from-muted/40"];
const TO = ["to-chart-1/40", "to-chart-2/40", "to-muted/40", "to-chart-3/40", "to-chart-4/40", "to-muted/40"];

export function Funnel() {
  const hovered = signal<number | null>(null);
  return (
    <Plot
      data={steps}
      accessibilityLabel="Visits to paid: 10,000 visits, 1,100 paid"
      accessibilityValue={{ text: hovered() == null ? undefined : steps[hovered()!].name }}
      onHoverChange={({ index }) => hovered.set(index)}
      appearGeneration={1}
      motion={{ appear: { duration: 900, easing: "easeOut" }, update: { duration: 500 }, enter: { duration: 120 }, exit: { duration: 160 } }}
      class="mx-20 h-64"
    >
      <Sankey
        links={flows}
        nodeWidth={8}
        nodePadding={16}
        nodeCornerRadius={2}
        nodeClass={(_, i) => FILLS[i]}
        linkBackgroundClass={(link) => `bg-linear-to-r ${FROM[link.source]} ${TO[link.target]}`}
        hoverDim={0.7}
        nodeLabel={(d: Step) => d.name}
        valueLabel={(_: Step, value: number) => value.toLocaleString("en-US")}
        nodeLabelClass="px-2 py-1 text-xs text-muted-foreground"
        valueLabelClass="font-medium text-foreground"
      />
    </Plot>
  );
}
```

```rust
use nsh_base::plot::{RowClass, SankeyLinkClass, SankeyLinks, plot, sankey};
use nsh_core::{element::Rows, prelude::*};

fn funnel() -> impl IntoElement {
    plot()
        .data(Rows::from_columns(4, []))
        .accessibility_label("Visits to paid")
        .h(px(256.0))
        .child(
            sankey()
                .links(SankeyLinks::new([(0, 1, 4200.0), (1, 2, 2600.0), (2, 3, 1100.0)]))
                .node_width(px(8.0))
                .node_class(RowClass::from_fn(|i| format!("fill-chart-{}", i + 1).into()))
                .link_class(SankeyLinkClass::from("fill-foreground/10")),
        )
}
```

| 屬性 | Rust | 類型 | 預設值 | 說明 |
|---|---|---|---|---|
| `links` | `.links(..)` | `SankeyLink[]`（`{ source: number; target: number; value: number }`） | 必填 | 流向：由列 `source` 流向列 `target`（兩者為其在繪圖區 `data` 中的索引），`value` 為其大小。不是數字或小於零的值不帶任何流量，也不會繪製絲帶。 |
| `nodeWidth` | `.node_width(..)` | `number` | `24` | 每個節點的闊度，以點數計。 |
| `nodePadding` | `.node_padding(..)` | `number` | `8` | 同一欄節點之間的間隙，以點數計；在過於擠迫的欄中會較小。 |
| `nodeAlign` | `.node_align(..)` | `"justify" \| "left" \| "right" \| "center"` | `"justify"` | 每個節點所屬的欄，與 d3-sankey 相同：由第一欄起計的深度（`"left"`）、在流向容許下盡量靠右（`"right"`）、深度相同但只發出流向的節點靠近其目標（`"center"`），或深度相同但終結流向的節點置於最後一欄（`"justify"`）。 |
| `iterations` | `.iterations(..)` | `number` | `6` | 以多少輪鬆弛調整令節點靠近其流向。 |
| `valueScale` | `.value_scale(..)` | `"linear" \| "sqrt"` | `"linear"` | 高度和闊度與數值成比例，或與其平方根成比例。 |
| `minLinkWidth` | `.min_link_width(..)` | `number` | `1` | 絲帶繪製的最小闊度，以點數計，使小流向仍然可見。 |
| `nodeCornerRadius` | `.node_corner_radius(..)` | `number` | `0` | 每個節點圓角的半徑，以點數計。 |
| `nodeClass` | `.node_class(..)` | `string \| (d: T, index: number) => string` | 無 | 每個節點的類別（`fill-*`、`stroke-*`）：對每個節點都相同，或是節點所屬列及其索引的函數，在各列或該函數改變時，每列只呼叫一次。 |
| `nodeStyle` | `.node_style(..)` | `StyleProp<ViewStyle>` | 無 | 每個節點的樣式，優先於其類別。 |
| `linkClass` | `.link_class(..)` | `string \| (link: SankeyLink, index: number) => string` | 無 | 每條絲帶的類別：對每條絲帶都相同，或是連結及其在 `links` 中索引的函數。 |
| `linkStyle` | `.link_style(..)` | `StyleProp<ViewStyle>` | 無 | 每條絲帶的樣式，優先於其類別。 |
| `linkBackgroundClass` | `.link_background_class(..)` | `string \| (link: SankeyLink, index: number) => string` | 無 | 每條絲帶背景的類別（`bg-*`，漸變：`bg-linear-to-r from-… to-…`），顯示在絲帶之內、由來源至目標的方框上，位於其 `fill` 之下。有背景時，絲帶的 `fill` 在未設定時為 `none`。 |
| `linkBackgroundStyle` | `.link_background_style(..)` | `StyleProp<ViewStyle>` | 無 | 每條絲帶背景的樣式，優先於其類別。 |
| `hoverDim` | `.hover_dim(..)` | `number`（0 至 1） | `0` | 未連接指標下節點的連結淡出多少，以其不透明度的比例計，使用繪圖區的 `pointer` 彈簧，並與懸停的淡入淡出同步。 |
| `nodeLabel` | `.node_label(..)` | `keyof T \| (d: T, index: number) => string` | 無 | 每個節點旁的名稱：一個欄位，或是節點所屬列及其索引的函數。 |
| `valueLabel` | `.value_label(..)` | `(d: T, value: number, index: number) => string` | 無 | 每個節點旁的數值，顯示在名稱之上：是其所屬列，以及流入或流出該節點的最大總量（以連結的值計，不論 `valueScale` 為何）的函數。 |
| `nodeLabelClass` | `.node_label_class(..)` | `string` | 無 | 每個標籤的類別，即 `nodeLabel` 部件：其內距為與節點之間的間隙，其文字樣式適用於兩行文字。 |
| `nodeLabelStyle` | `.node_label_style(..)` | `StyleProp<TextStyle>` | 無 | 每個標籤的樣式，優先於其類別。 |
| `valueLabelClass` | `.value_label_class(..)` | `string` | 無 | 數值行的類別，即 `valueLabel` 部件，疊加在標籤的類別之上。 |
| `valueLabelStyle` | `.value_label_style(..)` | `StyleProp<TextStyle>` | 無 | 數值行的樣式，優先於其類別。 |

節點和絲帶以 `fill` 填色（未設定時為 `currentColor`），並以 `stroke` 描邊（未設定時不描邊），各自的設定優先於桑基圖和繪圖區的設定，繼承方式與 CSS 相同。沒有任何流量經過的節點，高度為一點。只有在連結、選項或繪圖區的大小改變時，排版才會重新執行，指標移動或出現動畫則絕不會觸發；繪圖區大小改變時不會令任何東西移動。構成循環的連結，或指向繪圖區不存在的列的連結，不會繪製任何內容，並會記錄一則警告。其數值不參與繪圖區的比例尺。
## Treemap

`Treemap` 會把圖表的各列資料繪製成由巢狀矩形組成的層級結構：每一列是一個節點，其 `id` 與它所指向的 `parent` 組成樹（即 d3 的 `stratify`），每個葉節點的面積與其 `value` 成正比，每個群組則是其下所有節點所佔的方框，其值為各葉節點之值的總和（不論群組自身那一列載有甚麼值）。沒有 `parent`，或其父節點未指向任何一列的資料列，即為頂層節點；沒有 `id` 時，列的 id 就是其索引，因此 `parent` 也可以用索引來指定某一列。gpt-vis 寫出的巢狀形式的樹（`{ name, value, children }`），只需應用程式寫幾行程式碼便可轉成資料列；層級數目沒有上限。

圖塊以 squarify 方式排列，與 d3 的 `treemapSquarify` 所生成的相同：每一層的節點按值排序，由左上角起最大的排最先（`sort="value"`），並趨近長寬比 `ratio`（黃金比例）；`sort="data"` 則保留各列的順序，因此節點的值改變時，其位置不變。`paddingInner` 是同層節點之間的間距，不會出現在其父節點的任何外緣；`paddingOuter` 是群組內圍繞其子節點的空間；`paddingTop` 是每個群組頂部的一條橫帶，用來寫出其 `groupLabel`。每個選項可接受一個適用於所有層級的數字，或由頂層起每層一個的數字（`[3, 1]`：頂層節點之間為 3，其下為 1）。某一層的橫帶會套用於同一父節點的所有同層節點，或全部不套用；若其中有節點太小而容不下，則略去，使同一層的群組看起來一致。

值為 0、小於 0 或並非數字的葉節點不佔面積：不會繪製、沒有標籤、指標也找不到它，而所有葉節點皆如此的群組亦然。
Treemap 的面積代表整體中的份額，因此被排除的部分，應由應用程式以自己的文字說明（例如在圖下加註）。
負數用於顏色：例如市場圖中當日的升跌幅。

節點的顏色來自該列在圖表 `colorScale` 中的設定：`colorValue` 是沿色階變化的數字（`sequential`、`diverging`：跌為紅、升為綠、持平為中性色，在未設定 `domain` 時，以數值的範圍為準），`color` 則是類別（`ordinal`：`"parent"` 令同一群組的葉節點顏色一致）。葉節點是 `leaf` 部分（`leafClass`、`leafStyle`），群組是 `group` 部分（`groupClass`、`groupStyle`），只有設定了 class 或 style 才會繪製：它是位於子節點之下的矩形，會在間隙、內距及橫帶中顯示出來。各部分可以在每個節點上都相同，或是節點所屬列資料的函式。`cornerRadii` 會令每個矩形都變成圓角。

`label` 會寫出每個葉節點的名稱，`valueLabel` 則在其下寫出數值，兩者都是該列資料及其值的函式（群組的值為其葉節點之總和）：位置在左上角（`labelPlacement="start"`）或中間（`"center"`）。`label` 部分是與其葉節點同樣大小的方框：其內距是與葉節點邊緣的距離，其文字樣式則適用於各行文字。葉節點較窄時，名稱會以省略號截短，只有容得下時才會顯示；數值要麼完整顯示，要麼完全不顯示。葉節點顏色較深時，其標籤會帶有屬性 `data-dark`，因此 `data-dark:text-white` 可令標籤在深紅色上仍然清晰易讀。

在 Treemap 上，圖表會回報指標下的節點（`onHoverChange`，即該節點所屬的列）：可以是葉節點，或是位於橫帶或內距中的群組；若指標在同層節點之間的間隙上，則回報其中一個，以免懸停狀態閃爍。其餘節點會淡出至 `inactiveOpacity`（葉節點保留其所屬群組，群組則保留其下的內容），而 `hover` 部分是與該節點同樣大小的 view，會為它勾出輪廓。方向鍵移到畫面上相鄰的葉節點，Home 和 End 則移到第一個和最後一個。圖表出現時，頂層節點會由其中心逐個長大，並以 `stagger` 控制先後；當列資料改變時，每個節點都會以 `motion.update` 移到新的方框和顏色，並以其 `id` 識別：新加入的節點會由中心長大，已移除的節點則縮回自己的中心。圖表的 x 和 y 比例尺不會被使用。

<!-- demo: el-plot-treemap -->

```tsx
import { signal } from "nsh";
import { Plot, Treemap } from "nsh/base/plot";

type Row = { id: string; parent?: string; name: string; cap?: number; chg?: number };

const rows: Row[] = [
  { id: "tech", name: "Technology" },
  { id: "fin", name: "Financials" },
  { id: "NVDA", parent: "tech", name: "NVIDIA", cap: 4300, chg: 2.4 },
  { id: "MSFT", parent: "tech", name: "Microsoft", cap: 3700, chg: -0.6 },
  { id: "AVGO", parent: "tech", name: "Broadcom", cap: 1600, chg: 3.1 },
  { id: "JPM", parent: "fin", name: "JPMorgan", cap: 830, chg: 1.3 },
  { id: "V", parent: "fin", name: "Visa", cap: 670, chg: -0.3 },
];

export function MarketMap() {
  const hovered = signal<number | null>(null);
  return (
    <Plot
      data={rows}
      colorScale={{ type: "diverging", domain: [-3, 3], range: ["#dc2626", "#e5e5e5", "#16a34a"] }}
      accessibilityLabel="Market map of 5 stocks in 2 sectors"
      accessibilityValue={{ text: hovered() == null ? undefined : rows[hovered()!].name }}
      onHoverChange={({ index }) => hovered.set(index)}
      appearGeneration={1}
      motion={{ appear: { duration: 800 }, update: { duration: 500 }, enter: { duration: 120 }, exit: { duration: 160 } }}
      class="h-72"
    >
      <Treemap
        id="id"
        parent="parent"
        value="cap"
        colorValue="chg"
        paddingInner={[3, 1]}
        paddingTop={18}
        cornerRadii={2}
        inactiveOpacity={0.35}
        label="id"
        valueLabel={(d: Row) => `${d.chg! > 0 ? "+" : ""}${d.chg}%`}
        labelPlacement="center"
        labelClass="p-1 text-xs font-semibold text-foreground data-dark:text-white"
        groupLabel="name"
        groupLabelClass="px-1 text-xs text-muted-foreground"
        hoverClass="rounded-xs outline-2 outline-foreground"
      />
    </Plot>
  );
}
```

```rust
use nsh_base::plot::{ColorScale, DivergingScale, TreemapPadding, plot, treemap};
use nsh_core::{element::{RowAccessor, RowText, Rows}, prelude::*};

const IDS: [&str; 5] = ["tech", "fin", "NVDA", "MSFT", "JPM"];
const PARENTS: [&str; 5] = ["", "", "tech", "tech", "fin"];

fn market_map() -> impl IntoElement {
    let rows = Rows::from_columns(
        5,
        [
            ("cap".into(), vec![0.0, 0.0, 4300.0, 3700.0, 830.0]),
            ("chg".into(), vec![0.0, 0.0, 2.4, -0.6, 1.3]),
        ],
    );
    plot()
        .data(rows)
        .color_scale(ColorScale::from(
            DivergingScale::new([rgb(0xdc2626), rgb(0xe5e5e5), rgb(0x16a34a)]).domain([-3.0, 3.0]),
        ))
        .accessibility_label("Market map")
        .h(px(288.0))
        .child(
            treemap()
                .id(RowText::from_fn(|i| IDS[i].into()))
                .parent(RowText::from_fn(|i| PARENTS[i].into()))
                .value(RowAccessor::key("cap"))
                .color_value(RowAccessor::key("chg"))
                .padding_inner(TreemapPadding::from([px(3.0), px(1.0)]))
                .padding_top(TreemapPadding::from(px(18.0)))
                .label(RowText::from_fn(|i| IDS[i].into())),
        )
}
```

| 屬性 | Rust | 類型 | 預設值 | 說明 |
|---|---|---|---|---|
| `id` | `.id(..)` | `keyof T \| (d: T, index: number) => string` | 該列的索引 | 每列節點的 id：`parent` 所指定的對象，亦是列資料改變時用來識別節點的依據。 |
| `parent` | `.parent(..)` | `keyof T \| (d: T, index: number) => string` | 無：每一列都是頂層節點 | 每列的父節點 id；留空，或不是任何一列的 id，即為頂層節點。 |
| `value` | `.value(..)` | `keyof T \| (d: T, index: number) => number` | 必填 | 每個葉節點的大小；群組的大小為其子節點之總和。值為 0、小於 0 或並非數字的葉節點不佔面積。 |
| `sort` | `.sort(..)` | `"value" \| "data"` | `"value"` | 同層節點由左上角起最大的排最先，或按列資料的順序排列。 |
| `ratio` | `.ratio(..)` | `number` | 黃金比例 | 圖塊趨近的長寬比，至少為 1。 |
| `paddingInner` | `.padding_inner(..)` | `number \| number[]` | `0` | 同層節點之間的間距，單位為點，由頂層起每層一個值（最後一個值適用於其下所有層級）。 |
| `paddingOuter` | `.padding_outer(..)` | `number \| number[]` | `0` | 每個群組內圍繞其子節點的空間，每層一個值。 |
| `paddingTop` | `.padding_top(..)` | `number \| number[]` | `0` | 每個群組頂部用來顯示其 `groupLabel` 的橫帶，每層一個值；套用於同一父節點的所有同層節點，或全部不套用。 |
| `cornerRadii` | `.corner_radii(..)` | `number \| { topLeft?, topRight?, bottomRight?, bottomLeft? }` | 直角 | 矩形每個角的半徑。 |
| `color` | `.color(..)` | `keyof T \| (d: T, index: number) => string` | 無 | 每個節點的類別，由 `ordinal` `colorScale` 賦予顏色。 |
| `colorValue` | `.color_value(..)` | `keyof T \| (d: T, index: number) => number` | 無 | 每個節點的數值，由 `sequential` 或 `diverging` `colorScale` 轉為其顏色。 |
| `leafClass` | `.leaf_class(..)` | `string \| (d: T, index: number) => string` | 無 | 每個葉節點的 class（`fill-*`、`stroke-*`），可在每個葉節點上都相同，或是其列資料的函式。 |
| `leafStyle` | `.leaf_style(..)` | `StyleProp<ViewStyle>` | 無 | 每個葉節點的樣式，優先於其 class。 |
| `groupClass` | `.group_class(..)` | `string \| (d: T, index: number) => string` | 無 | 每個群組的 class，即位於子節點之下的矩形；群組只有設定了 class 或 style 才會繪製。 |
| `groupStyle` | `.group_style(..)` | `StyleProp<ViewStyle>` | 無 | 每個群組的樣式，優先於其 class。 |
| `inactiveOpacity` | `.inactive_opacity(..)` | `number`（0 至 1） | 無 | 非懸停節點及其標籤的不透明度，並帶有懸停的淡出效果。 |
| `label` | `.label(..)` | `keyof T \| (d: T, index: number) => string` | 無 | 每個葉節點中的名稱，單行顯示，過長時以省略號截短。 |
| `valueLabel` | `.value_label(..)` | `(d: T, value: number, index: number) => string` | 無 | 每個葉節點中的數值，位於名稱之下，只有能完整容納時才顯示。 |
| `labelPlacement` | `.label_placement(..)` | `"start" \| "center"` | `"start"` | 標籤位於其葉節點的左上角，或中間。 |
| `labelClass` | `.label_class(..)` | `string` | 無 | 每個葉節點標籤的 class，是與葉節點同樣大小的方框：包括其內距和文字樣式；深色葉節點上會有 `data-dark:`。 |
| `labelStyle` | `.label_style(..)` | `StyleProp<TextStyle>` | 無 | 每個葉節點標籤的樣式，優先於其 class。 |
| `valueLabelClass` | `.value_label_class(..)` | `string` | 無 | 數值行的 class，優先於標籤的 class。 |
| `valueLabelStyle` | `.value_label_style(..)` | `StyleProp<TextStyle>` | 無 | 數值行的樣式，優先於其 class。 |
| `groupLabel` | `.group_label(..)` | `keyof T \| (d: T, index: number) => string` | 無 | 每個群組在橫帶中的名稱，過長時以省略號截短。 |
| `groupLabelClass` | `.group_label_class(..)` | `string` | 無 | 每個群組標籤的 class，是與橫帶同樣大小的方框。 |
| `groupLabelStyle` | `.group_label_style(..)` | `StyleProp<TextStyle>` | 無 | 每個群組標籤的樣式，優先於其 class。 |
| `stagger` | `.stagger(..)` | `number`（0 至 0.95） | `0` | 頂層節點逐個出現的方式：即它們開始出現的時間佔整段出現動畫的比例。 |
| `hoverClass` | `.hover_class(..)` | `string` | 無 | `hover` 部分的 class，是疊在懸停節點之上、與其同樣大小的 view（`rounded-xs outline-2 outline-foreground`）。 |
| `hoverStyle` | `.hover_style(..)` | `StyleProp<ViewStyle>` | 無 | 懸停部分的樣式，優先於其 class。 |

矩形以 `fill` 填色（即 `colorScale` 的顏色，未設定時則為 `currentColor`），並以 `stroke` 描邊（未設定時不描邊），其自身的設定優先於 Treemap 和圖表的設定，繼承方式與 CSS 相同。只有當列資料、選項或圖表尺寸改變時，才會重新進行佈局，指標移動或出現動畫則不會；圖表尺寸改變時，不會移動任何東西。重複的 `id`、未指向任何一列的 `parent`，以及自己是自己祖先的列，都會記錄一次警告：第一列保留該 id，孤立節點成為頂層節點，循環的部分則不繪製。

## PlotAxis

`PlotAxis` 會以該邊所採用比例尺的刻度，為圖表的一條邊加上標籤：下邊和上邊使用 x 比例尺，左邊和右邊使用 y 比例尺，與 d3 的 `axisBottom`、`axisTop`、`axisLeft` 和 `axisRight` 相同。其刻度來自比例尺：在 `linear` 比例尺上是定義域內的整數值（1、2 或 5 乘以 10 的冪），在 `point` 或 `band` 比例尺上則是各列資料。其標籤是由圖表佈局放置的文字，因此應用程式決定內容和外觀，佈局負責定位：每個標籤都沿該邊以其刻度為中心。沿下邊和上邊時，第一個和最後一個標籤只會向內移動至剛好不超出圖表兩端；在左邊和右邊旁，每個標籤都固定在其刻度上，讓它清楚對應其網格線，而當靠近端點的標籤會超出圖表的頂邊或底邊時，圖表的線性 y 比例尺會由邊緣向內縮進相應的距離（端點處的刻度則縮進標籤高度的一半），使每個標籤都留在圖表之內，並對齊其網格線。

```tsx
import { Area, Grid, Line, Plot, PlotAxis } from "nsh/base/plot";

const rows = [
  { day: "Mon", visitors: 1820 },
  { day: "Tue", visitors: 2140 },
  { day: "Wed", visitors: 1960 },
  { day: "Thu", visitors: 2480 },
  { day: "Fri", visitors: 2310 },
];

<Plot data={rows} y="visitors" yScale={{ type: "linear", domain: [0, 3000] }} class="mb-6 ml-10 h-40">
  <Grid y={[0, 1000, 2000, 3000]} class="stroke-border" />
  <Area class="fill-chart-1/20" />
  <Line class="stroke-chart-1 stroke-2" />
  {/* 0, 1,000, 2,000 and 3,000 left of the plot; a day under each row. */}
  <PlotAxis placement="left" ticks={3} labelClass="pr-2 text-xs tabular-nums text-muted-foreground" />
  <PlotAxis
    format={(i) => rows[i].day}
    labelClass="pt-2 text-xs text-muted-foreground"
    tickClass="h-1 w-px bg-border"
    lineClass="h-px bg-border"
  />
</Plot>
```

| 屬性 | Rust | 類型 | 預設值 | 說明 |
|---|---|---|---|---|
| `placement` | `.placement(..)` | `"bottom" \| "top" \| "left" \| "right"` | `"bottom"` | 它沿哪一條邊延伸：下邊和上邊使用 x 比例尺的刻度，左邊和右邊使用 y 比例尺的刻度。 |
| `scale` | `.scale(..)` | `"y" \| "y2"` | `"y"` | 左軸或右軸為哪一個 y 比例尺加標籤：圖表的 `yScale` 或其第二個比例尺 `y2Scale`（[雙軸](#dual-axes)）。 |
| `labelPlacement` | `.label_placement(..)` | `"outside" \| "inside"` | `"outside"` | 標籤的位置：在邊緣之外、應用程式於圖表四周預留的空間內，這樣標籤不會與圖形元素重疊；或在圖表之上沿邊緣排列，令圖表保持完整大小（在左邊或右邊旁，每個標籤位於其網格線的上方）。 |
| `ticks` | `.ticks(..)` | `number` | 在 `linear` 比例尺上為 `10`（對齊的比例尺則每一步都有），其他比例尺則每列都有 | 大約取多少個刻度：在 `linear` 比例尺上，是定義域內大約這個數目的整數值；在 `point` 或 `band` 比例尺上，則是由第一列至最後一列平均分布的這個數目的列。 |
| `tickValues` | `.tick_values(..)` | `number[]` | 無 | 其刻度的值，取代 `ticks`：在比例尺上為其值，在 `point` 或 `band` 比例尺上為列索引（`[0, 3, 6]` 即每隔三列加一個標籤）。定義域內的每個值都會有一個刻度。 |
| `format` | `.format(..)` | `(value: number, index: number) => string` | 在類別 band 比例尺上為該 band 的類別，否則為數值，帶有刻度間距所需的小數位，並以千位分組 | 每個刻度的文字：由應用程式根據其值（在 `point` 或 `band` 比例尺上為列索引）及其在該軸刻度中的索引所定義的函式。 |
| `labelClass`、`labelStyle` | `.label_class(..)`、`.label_style(..)` | `string`、`StyleProp<TextStyle>` | 無 | `label` 部分：每個刻度一段文字，其字體、顏色和內距由應用程式決定；朝向圖表一側的內距就是它與邊緣的距離（下軸下方為 `pt-2`）。 |
| `tickClass`、`tickStyle` | `.tick_class(..)`、`.tick_style(..)` | `string`、`StyleProp<ViewStyle>` | 無 | `tick` 部分：在邊緣上每個刻度一個 view，以其刻度為中心，並朝標籤伸出（下軸下方為 `h-1 w-px bg-border`）；設定樣式後才會顯示。 |
| `lineClass`、`lineStyle` | `.line_class(..)`、`.line_style(..)` | `string`、`StyleProp<ViewStyle>` | 無 | `line` 部分：沿整條邊延伸的 view，位於標籤的一側（下軸下方為 `h-px bg-border`）；設定樣式後才會顯示。 |

在外側時，標籤位於圖表的邊距中，就像 d3 的軸位於圖表的邊距中一樣：圖表保持應用程式給它的大小，而應用程式會在軸的一側為它預留與標籤同樣深的邊距（其下的 `pt-2 text-xs` 標籤為 `mb-6`），或使用該處父元素的內距。同一條邊上的兩個軸，各自以自己的樣式為自己的值加標籤：範圍的兩端淡一些，中間則較突出。

`format` 會在刻度或函式改變時，於下一個回合為每個刻度各呼叫一次，絕不會在圖表繪製或跟隨指標時呼叫：請保持它是純函式（相同的值，得出相同的文字）。沒有它時，刻度會依 d3 的寫法顯示：`1,500`、`0.25`、`−2`。在 Rust 中，`plot_axis()` 建立一個軸，其 `format` 為 `TickFormat::from_fn(|value, index| ..)`。
軸不接受指標操作，螢幕閱讀器讀出的是圖表，而非其標籤。
## PlotLabel

`PlotLabel` 在圖表的各個點上寫出文字：山峰上方的標題、折線最後一點的標籤、格線末端的註解。它的每個 `texts` 都以圖表比例尺的值指明自己的點，做法與標記（marks）相同：在 `point` 或 `band` 比例尺上用某一列的索引（即該列色帶的中間），在 `linear` 比例尺上則用數值。文字的頂邊位於該點上，而它的 `align` 決定文字由該點開始、以該點為中心，還是在該點結束。圖表的版面配置負責放置這些文字，因此它們會跟隨圖表的大小；它們會隨比例尺的定義域滑動（`motion.update`），並隨 appear 淡入。

```tsx
import { Area, Line, Plot, PlotLabel } from "nsh/base/plot";

const rows = [
  { day: "Mon", visitors: 1820 },
  { day: "Tue", visitors: 2140 },
  { day: "Wed", visitors: 1960 },
  { day: "Thu", visitors: 2480 },
  { day: "Fri", visitors: 2310 },
];
const [peak, last] = [3, rows.length - 1];

<Plot data={rows} y="visitors" yScale={{ type: "linear", domain: [0, 3000] }} class="mr-12 h-40">
  <Area class="fill-chart-1/20" />
  <Line class="stroke-chart-1 stroke-2" />
  {/* The peak's value over it, and a tag right of the last point, its middle at the point's height. */}
  <PlotLabel
    class="text-xs tabular-nums text-muted-foreground"
    texts={[
      { text: `High ${rows[peak].visitors}`, x: peak, y: rows[peak].visitors, align: "center", class: "-translate-y-full pb-1" },
      { text: `${rows[last].visitors}`, x: last, y: rows[last].visitors, class: "-translate-y-1/2 ml-2 rounded bg-chart-1 px-1.5 text-white" },
    ]}
  />
</Plot>
```

| 屬性 | Rust | 類型 | 預設值 | 說明 |
|---|---|---|---|---|
| `texts` | `.texts(..)` | `PlotText[]` | `[]` | 它寫出的文字，每段文字位於各自的點。 |
| `scale` | `.scale(..)` | `"y" \| "y2"` | `"y"` | 其文字的 `y` 所屬的 y 比例尺（[雙軸](#dual-axes)）。 |

每段文字都是一個 `PlotText`：

| 欄位 | 類型 | 預設值 | 說明 |
|---|---|---|---|
| `text` | `string` | | 文字內容。 |
| `x` | `number` | | 在 x 軸上的位置：x 比例尺的值，或在 `point` 或 `band` 比例尺上某一列的索引（`0.5` 位於前兩列的正中間）。 |
| `y` | `number` | | 頂邊在 y 軸上的位置：y 比例尺的值。 |
| `align` | `"left" \| "center" \| "right"` | `"left"` | 文字在 x 方向相對其點的位置：由該點開始、以該點為中心，或在該點結束。 |
| `class`、`style` | `string`、`StyleProp<TextStyle>` | 無 | 文字自己的 class 和樣式，會覆蓋它從標籤繼承的內容：文字框（標籤的背景和內距）以及與該點的距離。 |

外觀由應用程式決定：標籤的 `class` 為每段文字提供它們繼承的文字樣式（字體、大小、顏色），而文字自己的 `class` 和 `style` 只作用於該段文字。使用 `-translate-y-full` 可讓文字位於其點的上方，而它的內距就是與該點的間距（`pb-1`）；位於折線最後一點旁邊的標籤，會放在應用程式在該側預留的邊距內（`mr-12`），與座標軸的標籤相同。在 Rust 中，`plot_label()` 建立標籤，每段文字則是帶有 `.align(PlotTextAlign::Center)`、`.class(..)` 和 `.style(..)` 的 `PlotText::new(text, x, y)`。指標會穿過這些文字到達圖表，而螢幕閱讀器讀出的是圖表，其 `accessibilityLabel` 會說明這些文字所指出的內容。

<a id="motion"></a>

## 動態效果

動態效果由應用程式決定，預設為無：所有內容即時顯示。`motion` 接受 [`nsh`](../modules/nsh.md#animation) 的時序（`{ duration, easing, delay }` 和 `{ stiffness, damping, mass }`）：

| 鍵 | 類型 | 移動的內容 |
|---|---|---|
| `appear` | timing | 標記以 `appearGeneration` 繪入：折線和面積圖從前緣開始；長條從底部向外生長（配合長條的 `stagger` 逐個出現）；圓點從無到有生長（配合圓點的 `stagger` 逐個出現）；單元格從中心向外生長（配合單元格的 `stagger` 逐個出現）；圓餅圖和弧形圖的環從起點順時針掃入；放射線從內半徑向外生長，其圓點隨之出現；桑基圖的節點和絲帶從前緣開始，其標籤淡入。 |
| `update` | timing | 應用程式改變形狀時，標記移動到新的形狀：圓點移動到新的值和大小，新增列的圓點生長出現，移除列的圓點縮小消失；單元格變為新的顏色（在 OKLab 中混合）和色帶，新增列的單元格生長出現，移除列的單元格縮小消失；圓餅圖和弧形圖的半徑（因此甜甜圈圖的中空部分會張開和閉合）以及它們的角度（因此儀表或扇形會轉到新的值；d3 的 `arcTween`：移動的是角度而非輪廓；新的扇形從前一個扇形的終點展開；在移動期間再次變更時，會從目前繪製的位置繼續）；放射線的各點移動到新的值、角度和半徑（新增的列從內半徑向外生長），放射狀格線的環隨之移動；線性比例尺的定義域（即應用程式的 `domain`，或隨列到來而取得的標記值範圍）從舊定義域滑動到新定義域，標記、格線、`PlotAxis` 和 `PlotLabel` 隨之移動；以及桑基圖的節點、絲帶和標籤，從舊流量的佈局移動到新佈局，在移動期間再次變更時，會從目前繪製的位置繼續。 |
| `enter` | timing | 指標移到圖表上時，懸停的各部分淡入。 |
| `exit` | timing | 指標離開後，它們淡出。 |
| `pointer` | spring | 按鍵或螢幕閱讀器逐步移動懸停時，它們由一列滑動到下一列；圓餅圖的扇形會隨之抬起。 |

懸停的各部分會在同一個影格內跟隨指標：指標移動時，十字線、圓點和提示框會立即位於指標下方的那一列，因此它們緊貼手部動作，而它們的淡入和淡出（`enter`、`exit`）仍然有動畫。

動態效果在平台的動畫器上運行，每個影格都不需要 JS，而對要求減少動態效果的使用者，則會立即完成。若列表為重新出現的列再次建立圖表，圖表會再次繪入，除非列表外圍的 [`PlotAppearScope`](#plotappearscope) 已看到它的 appear 完成。

定義域的移動方式與 d3 轉場比例尺定義域的方式相同：中間狀態的比例尺會放置每個值，因此標記保持形狀，格線和懸停的各部分隨之移動，長條保持其圓角，而隨新定義域進入的列也與其餘部分一起移動。若即時圖表不時依據其列來調整 y 比例尺（留有一些空間，使格線在兩次調整之間保持不動），它會以 `update` 時序滑動到每次新的調整。當圖表大小改變時，標記會立即採用新的大小。

這是圖表本身的動態效果，即圖表移動的各項內容的時序：其標記的裁剪和懸停的各部分。視圖的進場、離場和吸引注意的動畫，是 [`createMotion`](../modules/nsh.md#createmotion) 的預設效果和關鍵影格，應用程式仍然可以將它們用於圖表的視圖或其周圍的元素。

## PlotAppearScope

每當列回到視野中，列表就會再次建立該列的圖表，因此帶有 appear 的迷你折線圖會在列表捲回它時再次繪入。列表外圍的 `PlotAppearScope` 會記住其中已完成的 appear：在那裡再次建立的圖表，若其 `appearGeneration` 已完成，便會立即完整顯示其標記。圖表是按其世代（generation）來記住的，因此每一列的圖表都有自己的世代，即該列的 key 加上任何應使它重播的內容（`` `${symbol} ${period}` ``）。

```tsx
import { List } from "nsh";
import { Line, Plot, PlotAppearScope } from "nsh/base/plot";

<PlotAppearScope id={watchlist().id} class="flex-1">
  <List each={watchlist().rows} keyExtractor={(row) => row.symbol} estimatedItemSize={48} class="flex-1">
    {(row) => (
      <Plot
        data={row().closes}
        y="close"
        interactive={false}
        appearGeneration={`${row().symbol} ${period()}`}
        motion={{ appear: { duration: 400, easing: "easeOut" } }}
        class="h-8 w-24"
      >
        <Line class="stroke-chart-1 stroke-[1.5]" />
      </Plot>
    )}
  </List>
</PlotAppearScope>
```

| 屬性 | Rust | 類型 | 預設值 | 說明 |
|---|---|---|---|---|
| `id` | `.id(..)` | `number \| string` | 無 | 範圍為何而記憶：它改變時，範圍會遺忘，其圖表會在原處重新繪入。請按內容命名，例如監察清單或對話；若沒有設定，範圍會在顯示期間一直記住。 |
| `children` | `.child(..)` | `JSX.Element` | 無 | 它所包含的內容：列表，或在圖表來去時再次建立它們的任何內容。 |

新的世代仍然會讓圖表繪入，在 appear 完成前被移除的圖表也一樣，並從頭開始。圖表一旦完成新的世代，其範圍就會遺忘之前的世代，因此切換回較早的時段會再次讓圖表繪入。記憶隨範圍而存在：不再顯示的範圍，或帶有新 `id` 的範圍，會讓其圖表重新繪入，而圖表會在它外圍最內層的範圍中記憶。它的外觀由應用程式決定：`class` 和 `style` 如同任何視圖般為它排版（在填滿螢幕的列表外圍使用 `flex-1`）。在 Rust 中，`plot_appear_scope()` 建立一個範圍。

<a id="keyboard"></a>

## 鍵盤

互動式圖表是 Tab 鍵的一個停駐點（macOS、網頁），而在它擁有鍵盤焦點時，它的按鍵會移動與指標相同的懸停：十字線、圓點和提示框以 `pointer` spring 滑動，圓餅圖的扇形抬起，`onHoverChange` 回報該列，而螢幕閱讀器會讀出應用程式為它提供的 `accessibilityValue`。它的焦點環由應用程式決定：`focus-visible:` class 或 `focusStyle`（`focus-visible:outline-2 focus-visible:outline-ring`）。

| 按鍵 | 作用 |
|---|---|
| Right、Left | 移到該側的列：下一列或上一列，在反向的 x 比例尺上則相反，其第一列在右側（在圓餅圖上是按列的順序移動扇形；在桑基圖上是移動節點；在樹狀圖上是移到螢幕上相鄰的葉節點，Up 和 Down 也是如此）；在沒有懸停任何列時，Right 從最左端的列開始，Left 從最右端的列開始（在圓餅圖上則分別是第一個和最後一個扇形）。 |
| Home、End | 移到第一列或最後一列。 |
| Up、Down | 在單元格上：移到同一欄中上方或下方的單元格。在單元格上，按鍵跟隨螢幕上的網格（WAI-ARIA 的資料網格）：Right 和 Left 沿行移到下一個單元格，Home 和 End 移到該行的第一個和最後一個單元格；在沒有懸停任何單元格時，第一次按鍵從左上角的單元格開始（Left、Up 和 End 則從右下角的單元格開始）。到達邊緣時，懸停保持不動。 |
| Escape | 清除懸停。 |

圖表在擁有焦點時回應它的按鍵，而在有列被懸停時回應 Escape；其餘時間，這些按鍵會交給應用程式及其周圍的視圖。焦點移開時，會清除由按鍵造成的懸停。圖表不接受按壓，因此位於可按壓卡片內的圖表會把按壓留給卡片。螢幕閱讀器也可以逐列瀏覽：VoiceOver 的向上和向下滑動、TalkBack 的向前和向後捲動，以及所有提供元素 `increment` 和 `decrement` 動作的螢幕閱讀器，都會移到下一列和上一列，在反向比例尺上也是按列的順序。

<a id="building-charts"></a>

## 建立圖表

圖表由圖表區（plot）、它的標記、它的座標軸以及周圍應用程式自己的元素組成。為 y 比例尺指定 `domain`，並讓它的座標軸使用格線的值（`tickValues`）：每個標籤便會位於其格線上。懸停的十字線、圓點和提示框是圖表的組成部分，由應用程式設定樣式和填入內容；列的值則放在應用程式顯示它們的地方。

格線以實線細線搭配較明顯的基線最易閱讀，這樣虛線便可留作表示參考值（見下方的開盤價）。面積圖以向基線漸隱的淡色渲染，比純色填充更易閱讀。每個數列的懸停圓點採用其數列的顏色，並以圖表所在表面的顏色作為外環，使它從折線中突顯出來；而提示框位於圖表的頂部，在第一列和最後一列時則位於其邊緣以內：在最高值上方留有空間的 `domain` 可讓它避開折線。

```tsx
import { signal, Text, View } from "nsh";
import { Area, Grid, Line, Plot, PlotAxis } from "nsh/base/plot";

type Row = { time: string; price: number };

export function PriceChart(props: { rows: Row[]; low: number; high: number }) {
  const hovered = signal<number | null>(null);
  const shown = () => props.rows[hovered() ?? props.rows.length - 1];
  const middle = () => (props.low + props.high) / 2;
  return (
    <View class="gap-3 rounded-xl border border-border bg-card p-4">
      {/* The value of the row under the pointer, or the last one. */}
      <View class="flex-row items-baseline">
        <Text class="flex-1 text-sm text-muted-foreground">{shown().time}</Text>
        <Text class="text-right text-xl font-semibold tabular-nums text-foreground">{shown().price.toFixed(2)}</Text>
      </View>
      <Plot
        data={props.rows}
        y="price"
        yScale={{ type: "linear", domain: [props.low, props.high] }}
        accessibilityLabel={`Price, from ${props.rows[0].price} to ${props.rows[props.rows.length - 1].price}`}
        accessibilityValue={{ text: `${shown().time}, ${shown().price.toFixed(2)}` }}
        appearGeneration={props.rows.length}
        motion={{ appear: { duration: 600, easing: "easeOut" }, enter: { duration: 120 }, exit: { duration: 160 }, pointer: { stiffness: 300, damping: 30 } }}
        crossLineClass="w-px h-full bg-muted-foreground/50"
        tooltipOffset={4}
        tooltipContent={
          <View class="flex-row items-center gap-1.5 rounded-lg border border-border bg-popover px-2 py-1 shadow-md">
            <View class="h-0.5 w-2.5 rounded-full bg-chart-1" />
            <Text class="text-xs tabular-nums text-popover-foreground">{shown().price.toFixed(2)}</Text>
          </View>
        }
        onHoverChange={({ index }) => hovered.set(index)}
        class="mr-10 mb-6 h-48"
      >
        <Grid y={[middle(), props.high]} class="stroke-border" />
        {/* A wash that fades out toward the baseline. */}
        <Area backgroundClass="bg-linear-to-b from-chart-1/20 to-transparent" />
        <Grid y={[props.low]} class="stroke-muted-foreground/40" />
        <Grid y={[props.rows[0].price]} class="stroke-muted-foreground" style={{ strokeDasharray: "3 3" }} />
        <Line class="stroke-chart-1 stroke-2" hoverDotClass="size-2.5 rounded-full border-2 border-card bg-chart-1" />
        {/* The grid's values right of the plot, and the first and last times under it. */}
        <PlotAxis
          placement="right"
          tickValues={[props.low, middle(), props.high]}
          format={(v) => v.toFixed(0)}
          labelClass="pl-2 text-xs tabular-nums text-muted-foreground"
        />
        <PlotAxis
          tickValues={[0, props.rows.length - 1]}
          format={(i) => props.rows[i].time}
          labelClass="pt-2 text-xs text-muted-foreground"
        />
      </Plot>
    </View>
  );
}
```

長條圖在長條頂端為圓角、底部為方角時最易閱讀（`cornerRadii={{ topLeft: 4,
topRight: 4 }}`; in a stack only on its top bar), a hair of room between the bars of a band (`groupPadding`），懸停某一列時，其他列的長條會變淡（`inactiveOpacity`），並為該列的色帶添加底色（`crossLineClass`），而數值則以小號等寬數字顯示在長條上方，堆疊圖則在堆疊上方顯示總數。當 `paddingOuter` 為 `paddingInner` 的一半時，各色帶的中間會落在相等的間距上，而 `PlotAxis` 會把每個月份置於其色帶下方的中央；`maxBandWidth` 可讓少量長條在寬卡片中保持纖細。

```tsx
import { signal, Text, View } from "nsh";
import { Bar, Grid, Plot, PlotAxis } from "nsh/base/plot";

type Sale = { month: string; online: number; store: number };

export function SalesChart(props: { rows: Sale[]; stacked: boolean }) {
  const hovered = signal<number | null>(null);
  const shown = () => props.rows[hovered() ?? props.rows.length - 1];
  const tip = { topLeft: 4, topRight: 4 };
  return (
    <View class="gap-3 rounded-xl border border-border bg-card p-4">
      <View class="flex-row items-baseline">
        <Text class="flex-1 text-sm text-muted-foreground">{shown().month}</Text>
        <Text class="text-right text-sm tabular-nums text-foreground">{`${shown().online + shown().store}k`}</Text>
      </View>
      <Plot
        data={props.rows}
        xScale={{ type: "band", paddingInner: 0.3, paddingOuter: 0.15, maxBandWidth: 56, groupPadding: 0.1 }}
        yScale={{ type: "linear", domain: [0, 130] }}
        accessibilityLabel="Sales per month, online and in store"
        appearGeneration={props.stacked ? 1 : 0}
        motion={{ appear: { duration: 600, easing: "easeOut" }, enter: { duration: 150 }, exit: { duration: 150 }, pointer: { stiffness: 320, damping: 32 } }}
        crossLineClass="w-full h-full bg-foreground/5"
        onHoverChange={({ index }) => hovered.set(index)}
        class="mb-6 h-44"
      >
        <Grid y={[40, 80, 120]} class="stroke-border" />
        <Bar
          value="online"
          stack={props.stacked ? "sales" : undefined}
          cornerRadii={props.stacked ? 0 : tip}
          stagger={0.4}
          inactiveOpacity={0.45}
          label={props.stacked ? undefined : "online"}
          labelClass="pb-1 text-[11px] tabular-nums text-muted-foreground"
          class="fill-chart-1"
        />
        <Bar
          value="store"
          stack={props.stacked ? "sales" : undefined}
          cornerRadii={tip}
          stagger={0.4}
          inactiveOpacity={0.45}
          label={props.stacked ? (d) => String(d.online + d.store) : "store"}
          labelClass="pb-1 text-[11px] tabular-nums text-muted-foreground"
          class="fill-chart-2"
        />
        {/* A month centered under each band. */}
        <PlotAxis format={(i) => props.rows[i].month} labelClass="pt-2 text-xs text-muted-foreground" />
      </Plot>
    </View>
  );
}
```

列表列中的迷你折線圖是帶有 `interactive={false}` 的圖表：它繪製其標記，但不跟隨任何指標。

<a id="accessibility"></a>

## 無障礙功能

- 對螢幕閱讀器而言，圖表是一個元素，具有圖像角色和應用程式的 `accessibilityLabel`；它的標記、座標軸的標籤、它的 `PlotLabel` 以及懸停的各部分都是它的組成部分，自己不會讀出任何內容。請在標籤中說明圖表顯示什麼以及哪些內容突出（範圍、最高值），並為 `accessibilityValue` 提供描述指標下方那一列的文字，使螢幕閱讀器在值改變時讀出該值。
- 在有指標的平台（桌面電腦、網頁、配備觸控板的 iPad）上，指標下方的列會以 `onHoverChange` 回報。觸控螢幕不會回報懸停：請在應用程式自己的元素中顯示觸控使用者所需的值，或在數字重要的地方以文字或列表提供各列。
- 在圓餅圖上，回報的列是指標下方的扇形：請為 `accessibilityValue` 提供它的名稱、值和比例（`"Team, 340 seats, 34.0%"`），並在標籤中說明總數和最大的比例。在雷達圖上，回報的是最接近指標的軸：請提供該軸的名稱以及每個數列在該處的值。
- 互動式圖表是鍵盤焦點的一個停駐點，其方向鍵會移動懸停（[鍵盤](#keyboard)），並向螢幕閱讀器提供 `increment` 和 `decrement` 以逐列瀏覽（VoiceOver 會把它讀作可調整項目）；帶有 `interactive={false}` 的圖表兩者皆非，而且無論哪種情況，它都不接受按壓。

標籤和角色的一般說明，請參閱[無障礙功能](../docs/accessibility.md)。
<a id="platform-notes"></a>

## 平台說明

- 每個平台都以相同方式繪製標記:每個標記的繪圖只在 Rust 中記錄一次;列(rows)變更時,會一次過批次重新繪製讀取這些列的標記;而繪製類別(paint class)變更(外觀,`dark:`)時,則會重新傳送繪圖,無需重新記錄。
- 出現動畫以平台動畫器(animator)移動的數值來裁剪線條和區域,並令長條增長;長條由懸停列逐漸淡出,是動畫器根據懸停位置計算出的不透明度;懸停的各部分是由動畫器移動及淡入淡出的視圖,而動畫器會根據繪圖區和工具提示的大小,將工具提示保持在繪圖區內。
- 區域的背景繪製在其專屬的 canvas 中,並裁剪成區域的形狀,所用的漸層與平台為視圖的 `bg-linear-*` 所繪製的相同;其類別(外觀,`dark:`)變更時,會重新傳送繪圖,無需重新記錄。
- 圓餅圖在各自的 canvas 中繪製每個扇形;指標下的扇形由 Rust 根據各扇形的角度和半徑找出,其凸起是半徑,其他扇形的淡出是不透明度,兩者都由動畫器移動,而出現動畫的掃動也以同樣方式移動扇形的角度,因此兩者都不會重新記錄繪圖。
- 放射線(radial line)中指標下的列由 Rust 根據各點的角度找出;其懸停點是由動畫器放置在指標下那一列的視圖(隨按鍵步進時,在 `pointer` 彈簧上滑動),而在出現或移至新數值時,其各點是動畫器由原來位置開始移動的數字,因此每次變更只會記錄一次線條。
- 圓點標記繪製在同一個 canvas 中;指標下的圓點由 Rust 根據各圓點的中心和半徑找出,其懸停點是由動畫器放置在該圓點上的視圖,大小與該圓點相同;出現動畫的增長、變更時的移動以及懸停的淡出,都是由動畫器移動的數值,因此每次變更只會記錄一次圓點。
- 格子標記繪製在同一個 canvas 中;指標下的格子由 Rust 根據各格子的方框找出,其懸停格是由動畫器放置在該格子上的視圖;增長、變更時的顏色和移動以及懸停的淡出,都是由動畫器移動的數值,因此每次變更只會記錄一次格子。每個標籤都是平台的文字元件,會在其排版後的大小能容納於格子內時顯示。
- 座標軸的標籤、刻度線和軸線是平台自己的文字和視圖,由 Rust 中的版面配置根據繪圖區的大小和比例尺放置:繪圖區大小改變時,它們會隨標記一起移動,而新的定義域則會重新寫入標籤。
