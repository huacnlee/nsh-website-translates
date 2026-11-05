---
title: "Plot"
description: "nsh/base/plot 的 Plot 元件、其標記 Line、Area、Bar、Rule、Dot、Cell、Grid、Pie、Arc、RadialLine、RadialGrid、Sankey 與 Treemap,以及 PlotAxis 與 PlotLabel:以原生方式根據應用程式的資料列繪製圖表,提供座標軸的比例尺及其標籤、資料點上的文字、指標所在的資料列、儲存格或扇形區塊、動態效果,且本身沒有預設外觀。"
group: base
demo: el-plot
source_hash: 2aca4d23862b455b
---

# Plot

Plot 是圖表的框架：它顯示的資料列、x 軸與 y 軸的刻度、位於其上的指標，以及它的動態。它的標記負責繪製其中的內容：穿過一個數列的 `Line`、數列與基線之間的 `Area`、在 band 刻度的各個 band 中每列一個的 `Bar`、每列從起點到終點的 `Rule`（蠟燭圖的影線）、每列在其兩個值交會處的 `Dot`（散佈圖的點、泡泡圖的泡泡）、在兩個類別的 band 中每列一格並依其值著色的 `Cell`（熱圖）、橫跨整張圖的一組線 `Grid`、各列佔比的 `Pie`（中間有洞的甜甜圈圖）、兩個角度之間的 `Arc`、繞著中心並在後方襯有 `RadialGrid` 的環與輻條的 `RadialLine`（雷達圖）、列與列之間流向的 `Sankey`，以及由巢狀矩形組成、每個葉節點的面積即其值的 `Treemap`（市場地圖）；`PlotAxis` 以其刻度的刻度線標示一條邊，`PlotLabel` 則在刻度的各點上寫出文字。每個標記都是一張填滿整個 plot 的 canvas，直接由資料列以原生方式繪製：app 設定資料列時只會讀取一次，之後的縮放、記錄與繪製都在 Rust 中完成，因此有一千個點的圖表不會為每個點執行任何 JS。指標同樣在 Rust 中追蹤：hover 的十字線、圓點與 tooltip 都在平台的 animator 上移動與淡入淡出，而 app 只會得知新的資料列，僅此而已。外觀由 app 決定：標記以 SVG 圖形的 CSS 繪製屬性（`stroke-*`、`fill-*`）上色，未設定時使用 `currentColor`；area 或 bar 會在其形狀內顯示背景（漸層、`bg-linear-*`）；hover 的各部分（包含每個標記的圓點）以及座標軸的標籤、刻度記號與線條，都由 app 自行設定樣式並填入內容。

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

`Plot`、`Line`、`Area`、`Bar`、`Rule`、`Dot`、`Cell`、`Grid`、`Pie`、`Arc`、`RadialLine`、`RadialGrid`、`Sankey`、`Treemap`、`PlotAxis` 與 `PlotLabel` 來自 `nsh/base/plot`，這是 [`nsh/base`](../modules/nsh-base.md) 中專屬於它們的模組（在 Rust 中為 `nsh_base::plot`）。在 TypeScript 中，plot 的 props 以資料列的型別為泛型：欄位名稱會依其檢查，接收資料列的函式也會得到該列的型別。在 Rust 中，`plot()` 會建立一個 plot 並為每個 prop 提供一個 setter；資料列是 `Rows`（以 key 為索引的數值欄），數值是 `RowAccessor`（一個 key，或一個以資料列索引為參數的函式），而標記則使用具型別的繪製方法（`.stroke_color(..)`、`.fill_color(..)`、`.stroke_width(..)`）。

<a id="plot-1"></a>

## Plot

| 屬性 | Rust | 型別 | 預設值 | 說明 |
|---|---|---|---|---|
| `data` | `.data(..)` | `T[]` | （必填） | 資料列，每個點一個物件。標記在 app 設定資料列時只讀取一次其值；沒有值的資料列（欄位不是數字，`null`）會被略過。 |
| `x` | `.x(..)` | `keyof T \| (d: T, index: number) => number` | 資料列的索引 | 在 `linear` x 刻度上決定資料列沿 x 軸位置的依據。`point` 刻度則依序安排各列。 |
| `y` | `.y(..)` | `keyof T \| (d: T, index: number) => number` | 無 | 標記在未指定自己的值時所繪製的內容。 |
| `xScale` | `.x_scale(..)` | `Scale` | `{ type: "point" }` | x 軸如何安排資料列：`point`（依序，從左邊緣到右邊緣均勻分布；只有一列時置中）、帶有選用 `domain` 的 `linear`，或 `band`（每列一個 band，用於長條，見 [Bar](#bar)；或每個類別一個 band，用於儲存格，見 [Cell](#cell)）。當 y 刻度為 `band` 時，預設為 `linear`，用於橫向長條。`reverse: true` 讓它從右邊緣開始（[反向刻度](#reversed-scales)）。 |
| `yScale` | `.y_scale(..)` | `Scale` | `{ type: "linear" }` | y 軸如何安排數值：domain 的最小值在下邊緣，最大值在上邊緣。若沒有 `domain`，則為標記所繪製內容的範圍。`band` 會從上邊緣往下為每列鋪一個 band，用於橫向長條。`reverse: true` 則反方向：最小值在上邊緣，資料列從下邊緣往上排（[反向刻度](#reversed-scales)）。 |
| `y2Scale` | `.y2_scale(..)` | `LinearScale` | 無 | 第二個 y 刻度 `{ type: "linear", domain?, reverse? }`，供指定它的標記使用（`scale="y2"`）：雙軸圖表的右側刻度（[雙軸](#dual-axes)）。若沒有 `domain`，則為其上各值的範圍。 |
| `alignTicks` | `.align_ticks(..)` | `boolean` | `true` | 當兩個 y 刻度都未指定 domain 且兩邊都有標記時，兩者會被擴展到相同的整數級距，使其刻度落在同樣的線上（[雙軸](#dual-axes)）。`false` 則讓各自維持其數值的範圍。 |
| `interactive` | `.interactive(..)` | `boolean` | `true` | plot 會追蹤指標與鍵盤：回報指標下的資料列並顯示 hover 的各部分，同時它是 Tab 的停駐點，方向鍵可移動 hover（[鍵盤操作](#keyboard)）。`false` 只繪製標記（例如清單中的 sparkline），對它的按壓會交給周圍的 view。plot 是否提供鍵盤操作，在建立時就已決定。 |
| `motion` | `.motion(..)` | `PlotMotion` | 無 | 出場動畫的時間、hover 的淡入淡出，以及鍵盤移動 hover 時所用的彈簧動畫（見下文）。 |
| `appearGeneration` | `.appear_generation(..)` | `number \| string` | 無 | 啟用出場動畫：標記會在 plot 首次顯示時繪入，且每當此值改變（換了股票代號、換了期間）就再次繪入。在 [`PlotAppearScope`](#plotappearscope) 內，已在其中完成的那一代會一次完整顯示。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 無 | 螢幕閱讀器對圖表的描述：它顯示什麼，以及什麼特別突出。 |
| `accessibilityValue` | `.accessibility_value(..)` | `{ min?, max?, now?, text? }` | 無 | 螢幕閱讀器讀出的值：app 針對指標下資料列所寫的文字。 |
| `crossLineClass`、`crossLineStyle` | `.cross_line_class(..)`、`.cross_line_style(..)` | `string`、`StyleProp<ViewStyle>` | 無 | 十字線：與 plot 等高的 view，以指標下的資料列為中心。在 band 刻度上，它位於該列的 band 內，寬度與 band 相同（在 band y 刻度上則橫跨整個 plot）。 |
| `dotClass`、`dotStyle` | `.dot_class(..)`、`.dot_style(..)` | `string`、`StyleProp<ViewStyle>` | 無 | hover 的圓點：為每個 `Line`、`Area` 與 `RadialLine` 各提供一個 view，以指標下資料列的該點為中心；`Dot` 的圓點大小則與指標下的圓點相同。標記的 `hoverDotClass` / `hoverDotStyle` 會取代它們，用於該標記自己的圓點。 |
| `tooltipContent` | `.tooltip_content(..)` | `JSX.Element` | 無 | app 的 tooltip，由 `tooltipPlacement` 決定位置，並隨十字線移動與淡入淡出。 |
| `tooltipPlacement` | `.tooltip_placement(..)` | `"top" \| "pointer"` | `"top"` | tooltip 的位置：在 plot 頂部並以十字線為中心；或在指標旁，位於十字線朝向 plot 中央的那一側，指標在上半部時置於其下方，在下半部時置於其上方。在頂部時，它會停留在 plot 的左右邊緣之間（它與上邊緣的偏移由 app 決定：放在 plot 下方的標籤會取用 plot 的高度再加上更多）；在指標旁時，它會停留在 plot 內。使用鍵盤時，它位於該列中第一條線或第一個 area 的點旁（長條 band 的中央、圓餅圖切片的中央）。 |
| `tooltipOffset` | `.tooltip_offset(..)` | `number` | `0` | tooltip 與其定位依據之間的距離：對 `"top"` 是上邊緣，對 `"pointer"` 是十字線與指標。 |
| `colorScale` | `.color_scale(..)` | `ColorScale` | 無 | 標記的顏色：依其 `color` 所讀取的類別，如同 d3 的 `scaleOrdinal`（`{ type: "ordinal", domain?, range, unknown? }`，見[依類別著色](#colors-by-category)）；或依 `Cell` 的 `value` 所讀取的數值沿著漸層取色，如同 d3 的 `scaleSequential` 與 `scaleDiverging`（`{ type: "sequential" \| "diverging", … }`，見[沿漸層著色](#colors-along-a-ramp)）。 |
| `children` | `.child(..)` | `JSX.Element` | 無 | 標記，依序彼此疊繪，以及 app 疊在其上的任何內容。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | 無 | plot 的尺寸與外觀；標記會繼承它的繪製屬性，如同 CSS 的繼承。`focus:` / `focus-visible:` class 與 `focusStyle` 用來繪製它的焦點外框。 |

| 事件 | Rust | 負載 | 時機 |
|---|---|---|---|
| `onHoverChange` | `.on_hover_change(..)` | `{ index: number \| null }` | 指標移到另一個資料列上：沿 x 軸最接近指標的資料列索引（只有 y 軸有 band 時則沿 y 軸）、指標下的 [pie](#pie-and-arc) 切片、中心最接近指標的 [dot](#dot)、指標下的 [cell](#cell)（在兩個儲存格之間的間隙上，取較近者），或依角度最接近指標的 [radial line](#radialline-and-radialgrid) 的資料列；指標離開 plot 後為 `null`（在 pie 上方時是其各個切片；在 radial line 上方時是其外半徑）。 |

`Scale` 為 `{ type: "point"; reverse? } | { type: "linear"; domain?: [number, number]; reverse? } | { type: "band";
domain?: string[]; paddingInner?; paddingOuter?; maxBandWidth?; bandCount?; groupPadding?; reverse? }`. A `linear`
刻度的 `domain` 是其兩個值的範圍，順序不拘；只有一個值的 domain 會將它置於中間。`band` 刻度的 `domain` 是其 band 的類別，依序排列（[Cell](#cell)）；其他選項見 [Bar](#bar)。

對資料列的函式（`y={(d) => d.high - d.low}`）會在資料列或函式改變時，於下一個 turn 對每一列呼叫一次，絕不會在 plot 繪製或追蹤指標時呼叫：請保持其純粹（相同的資料列，得到相同的數字）。欄位名稱的讀取則完全不需要 JS。

<a id="reversed-scales"></a>

### 反向刻度

`reverse: true` 讓刻度從另一個邊緣開始，如同 visx 的刻度接受 `reverse`，以及 d3 的刻度接受反向書寫的 range。在 x 軸上，第一列或 domain 的最小值位於右邊緣；在 y 軸上，domain 的最小值位於上邊緣，資料列從下邊緣往上排。所有放置在刻度上的東西都會隨之改變：標記、長條的基底與生長方向、area 的基線、格線、`PlotAxis` 的刻度、hover 所找到的資料列、方向鍵（[鍵盤操作](#keyboard)），以及移到新 domain 的動作。在反向的 `linear` y 刻度上，長條從上邊緣垂下；在反向的 `linear` x 刻度上，橫向長條從右邊緣向左生長：

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

使用 plot 的出場動畫時，線與 area 會從 x 刻度起始的邊緣繪入，反向時即為右邊緣。

<a id="dual-axes"></a>

### 雙軸

<!-- demo: el-plot-dual -->

plot 有第二個 y 刻度，用於單位不同的數值：價格旁的成交量、利潤率旁的營收。每個沿 y 放置數值的部分都接受 `scale`：`"y"`（預設，即 plot 的 `yScale`）或 `"y2"`（即它的 `y2Scale`）。右側帶有 `scale="y2"` 的 `PlotAxis` 會為它加上標籤：

```tsx
<Plot data={days} xScale={{ type: "band", paddingInner: 0.3 }} class="mx-10 mb-6 h-44">
  <Grid class="stroke-border" />
  <Bar value="volume" class="fill-chart-2/50" />
  <Line y="close" scale="y2" class="stroke-chart-1 stroke-2" />
  <PlotAxis placement="left" format={(v) => `${v}M`} labelClass="pr-2 text-xs text-muted-foreground" />
  <PlotAxis placement="right" scale="y2" labelClass="pl-2 text-xs text-muted-foreground" />
</Plot>
```

每個刻度的 domain 各自獨立：可以是 app 的 `domain`，或其上各值的範圍，且各自以 `motion.update` 移到新的 domain。當兩個刻度都未指定 domain 時，plot 會將兩者排成相同數量的整數級距（1、2 或 5 乘以十的冪，約每 32 點高度一個級距）：當兩者都包含零時，零會落在兩邊的同一條線上；否則，從零開始的刻度（成交量）會向上增加額外的級距，另一個（價格）則向兩側增加。座標軸的刻度即這些級距，而既無 `x` 也無 `y` 的 `Grid` 會在這些位置繪製線條，因此一套格線即可服務兩個座標軸。`alignTicks={false}` 會關閉此行為；app 指定了 `domain` 時，兩個刻度都維持原樣。

hover 只會找到一列；每個標記的圓點位於它自己的刻度上，而讀數由 app 決定，app 會讀取 `onHoverChange` 所回報之資料列的兩個值。兩個刻度上的長條會在每個 band 中並排站立，而 `stack` 只會堆疊其刻度上的長條。`y2Scale` 是線性的：y 軸有 band 的 plot 沒有第二個 y 刻度。
<a id="line-area-and-grid"></a>

## Line、Area 與 Grid

| Mark | 屬性 | 型別 | 預設值 | 說明 |
|---|---|---|---|---|
| `Line` | `y` | `string \| (d, index) => number` | plot 的 `y` | 繪製的內容:每個有值的資料列對應一個點,沒有值的資料列會被略過。 |
| `Line`、`Area` | `data`、`x` | `T[]`、`string \| (d, index) => number` | plot 的資料列 | 自有系列的資料列(其他 x 值),由其自身的 `x` 放置在 plot 的 scale 上(沒有時則使用資料列的索引)。 |
| `Line`、`Area` | `curve` | `"natural" \| "linear" \| "stepAfter"` | `"natural"` | 點與點的連接方式:平滑曲線、直線段,或是在下一個資料列出現前維持每個值的階梯。area 的底邊沿用同一條曲線。 |
| `Line` | `dot`、`dotClass`、`dotStyle` | `boolean`、`string`、`StyleProp<ViewStyle>` | `false` | 每個點上的圓點:以該點為中心的 view,其大小、背景與邊框由 app 決定。 |
| `Line`、`Area` | `hoverDotClass`、`hoverDotStyle` | `string`、`StyleProp<ViewStyle>` | plot 的 `dotClass`、`dotStyle` | 它的 hover 圓點,位於指標所在資料列對應的點上:每個系列的圓點使用各自的顏色。各自取代 plot 的設定(mark 的顏色優先於 plot 的大小與外圈);`hidden` 則不顯示任何圓點。 |
| `Area` | `backgroundClass`、`backgroundStyle` | `string`、`StyleProp<ViewStyle>` | 無 | 它的背景:圍繞其形狀的方框(從第一個點到最後一個點,從最高點到基線,在 band 上則到底邊的最低點),其背景(`bg-*`、`bg-linear-to-b from-… to-…`、`backgroundImage`)只顯示在形狀內部,位於其 `fill` 之下。設定背景後,若未另外設定,`fill` 為 `none`。 |
| `Area` | `y1` | `string \| (d, index) => number` | plot 的 `y` | 構成頂邊的內容。 |
| `Area` | `y0` | `number \| string \| (d, index) => number` | y scale 的低端邊界 | 它的底邊:數字代表 y scale 上的基線;欄位或函式則為每個資料列提供各自的底部值,使 area 成為一個 band(某日的最低到最高、預測的範圍)。未設定時,area 會收合到 y scale 最小值所在的邊:通常是底邊,在反向 scale 上則是頂邊(從頂部垂下的 area)。任一邊緣沒有值的資料列會被略過。 |
| `Line`、`Area`、`Grid` | `scale` | `"y" \| "y2"` | `"y"` | 其值所依循的 y scale:plot 的 `yScale` 或其第二個 scale `y2Scale`([Dual axes](#dual-axes))。 |
| `Grid` | `x` | `number[]` | 無 | 垂直線的位置,以 x scale 的值表示(在 `point` scale 上則為資料列索引)。 |
| `Grid` | `y` | `number[]` | 無 | 水平線的位置,以 y scale 的值表示。若 `x` 與 `y` 皆未設定,線條會沿用其 scale 的刻度,即沒有 `ticks` 的 `PlotAxis` 所放置的位置(橫向 bar 時沿 x 軸)。 |
| `Grid` | `ticks` | `number` | 座標軸的預設值 | 在 `x` 與 `y` 皆未設定時,大約繪製多少條線,如同 `PlotAxis` 的 `ticks`。 |
| `Line`、`Area` | `color` | `string \| (d, index) => string` | 無 | 其資料列的類別,顏色取自 plot 的 `colorScale`:在未另外設定時,第一個資料列的類別決定線條的 `stroke`(area 的 `fill`)([Colors by category](#colors-by-category))。 |

每個 mark 都填滿 plot,並以其 [SVG paint properties](../modules/style-reference.md#svg-paint) 繪製,自身的設定優先於 plot 的設定,如同 CSS 的繼承方式:

| Mark | 繪製所用屬性 | 未設定時 |
|---|---|---|
| `Line` | `stroke`、`strokeWidth`、`strokeDasharray` | `currentColor`、寬度 1、實線 |
| `Area` | `fill`(作用於其 `background` 部分);其頂邊使用 `stroke`、`strokeWidth`、`strokeDasharray` | `fill` `currentColor`(有背景時為 `none`);無描邊 |
| `Grid` | `stroke`、`strokeWidth`、`strokeDasharray` | `currentColor`、寬度 1、實線;每條線都對齊整個裝置像素,因此細線也能保持清晰 |

`Line` 或 `Area` 所繪製的值,以及 area 的 `y0`(其基線,或每個資料列的底部值),在 plot 沒有設定時會構成 y scale 的 domain;grid 的值則不會。只有在 mark 所繪製的內容改變時(其資料列、值、曲線、plot 的大小或 scale、其繪製設定),它才會重新繪製;指標只會移動 hover 的各個部分,不會讓 mark 重新繪製。

band 是 `Area` 的一種,其 `y0` 會讀取資料列:頂邊穿過 `y1`,底邊則經由 `y0` 返回,兩者都使用 area 的 `curve`,而 appear 動畫會從起始邊把兩者一併畫入。它的 hover 圓點位於頂邊上;疊在其上的 `Line` 標出中間值:

```tsx
<Plot data={days} y="close">
  <Area y1="high" y0="low" class="fill-chart-1/15" hoverDotClass="hidden" />
  <Line class="stroke-chart-1 stroke-2" />
</Plot>
```

`fill` 與 CSS 相同,如同在瀏覽器中:是一種顏色。線條下方的漸層是 area 的背景,就如同頁面在形狀中顯示漸層的方式(方框的 `background-image` 搭配 `clip-path`):`backgroundClass="bg-linear-to-b from-chart-1/20
to-transparent"` 會從 area 的最高點到基線逐漸淡出,使用主題的 token 與外觀的顏色,如同任何 view 的背景。

## Bar

`Bar` 會在 `band` scale 中,於每個資料列的 band 內為該列繪製一根 bar:在 band x scale 上為直立,在 band y scale 上為橫向(此時 x scale 為 `linear`)。每根 bar 從 `base` 延伸到該資料列在另一個 scale 上的值,因此負值會朝反方向增長,沒有值的資料列則沒有 bar。在反向的值 scale 上,bar 會從頂邊向下或從右邊向左增長,而反向的 band scale 會把第一個資料列的 band 放在右側或底部([Reversed scales](#reversed-scales))。

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

不在 stack 中的 bar 會依 mark 的順序在每個 band 內並排;具有相同 `stack` 的 bar 會堆疊,每個資料列的 bar 從 stack 中前一根結束的位置開始:

```tsx
<Bar value="online" stack="sales" class="fill-chart-1" />
<Bar value="store" stack="sales" class="fill-chart-2" cornerRadii={{ topLeft: 4, topRight: 4 }} label={(d) => `${d.online + d.store}`} />
```

| 屬性 | 型別 | 預設值 | 說明 |
|---|---|---|---|
| `value` | `string \| (d, index) => number` | plot 的 `y` | 每根 bar 所顯示的內容。 |
| `base` | `number \| string \| (d, index) => number` | `0` | bar 在值 scale 上開始增長的值:可為所有資料列共用的一個值,或是為每個資料列提供各自值的欄位或函式,使每根 bar 涵蓋該列的基準值到其值(沒有基準值的資料列則沒有 bar)。它會計入 domain。stack 會逐列從其第一根 bar 的基準值開始增長。 |
| `stack` | `string` | 無 | 所加入的 stack:具有相同 `stack` 的 bar 會依序堆疊(沒有值的資料列不增加任何內容)。 |
| `scale` | `"y" \| "y2"` | `"y"` | 其直立 bar 的值所依循的 y scale([Dual axes](#dual-axes));位於兩者上的 bar 會並排,而 stack 只堆疊位於其 scale 上的 bar。 |
| `cornerRadii` | `number \| { topLeft?, topRight?, bottomRight?, bottomLeft? }` | `0` | bar 每個圓角的半徑;`{ topLeft: 4, topRight: 4 }` 會讓直立 bar 的頂端變圓。大於 bar 一半的半徑會被調整到符合 bar 大小。 |
| `stagger` | `number` | `0` | 搭配 plot 的 appear,bar 會逐列依序開始,分布在此比例的時間內(0 到 0.95),每根 bar 在剩餘時間內增長;0 則讓它們同時增長。 |
| `inactiveOpacity` | `number` | 無 | 當指標位於 plot 上時,指標所在資料列以外的 bar 的不透明度,使該列更突出:它會隨 hover 淡入淡出,並隨之從一根 bar 移到另一根。 |
| `label` | `string \| (d, index) => string` | 無 | 每根 bar 值端的文字:可為欄位(其文字或數字),或由 app 格式化並回傳文字的函式。 |
| `labelClass`、`labelStyle` | `string`、`StyleProp<TextStyle>` | 無 | `label` 部分:置中於 bar 的文字,位於直立 bar 末端的上方(向下增長的 bar 則在下方),橫向 bar 則在其後(向回增長的 bar 則在其前)。其 padding 即為與 bar 的距離。 |
| `backgroundClass`、`backgroundStyle` | `string`、`StyleProp<ViewStyle>` | 無 | 它的背景:每根 bar 的方框,其背景(`bg-linear-to-t from-… to-…`,從 bar 底部到頂部)只顯示在 bar 內部,位於其 `fill` 之下。設定背景後,若未另外設定,`fill` 為 `none`。 |
| `color` | `string \| (d, index) => string` | 無 | 每根 bar 的類別,顏色取自 plot 的 `colorScale`:在未另外設定時為 bar 的 `fill`([Colors by category](#colors-by-category))。 |

band scale 會為 plot 的每個資料列依序配置一個 band,或為其 `domain` 的每個類別配置一個 band,如同 d3 的 `scaleBand`:

| 選項 | 預設值 | 說明 |
|---|---|---|
| `domain` | 無 | 各 band 的類別,依序排列(d3 的 `scaleBand().domain()`):[`Cell`](#cell) 會放入其資料列類別所屬的 band,而 `PlotAxis` 會寫出每個 band 的類別;重複寫入的類別保留其第一次的位置。未設定時,band 即為資料列,或在 cell 上則為各 cell 沿座標軸所指名的類別,依資料列帶來的順序排列。 |
| `paddingInner` | `0` | 相鄰 band 之間的間隙,為每個 band 步長的比例(0 到 1)。 |
| `paddingOuter` | `0` | 第一個 band 之前與最後一個 band 之後的間隙,為步長的比例。取 `paddingInner` 的一半,可讓各 band 的中心在整個 plot 上等距。 |
| `maxBandWidth` | 無 | band 的最大寬度,以 point 為單位:寬 plot 上的少數 band 會保持窄寬,各自位於其位置的中央。 |
| `bandCount` | 資料列 | 當多於資料列時,座標軸所配置的 band 數:資料列取用前面的 band,並保持其隨資料列到來時的寬度與位置。 |
| `groupPadding` | `0` | 同一 band 內並排的 bar 之間的間隙,為每根 bar 所佔位置的比例。 |
| `reverse` | `false` | band 從另一端開始排列:第一個資料列的 band 在 x 軸的右側、y 軸的底部;同一 band 內並排的 bar 維持其順序。 |

bar 以其 `fill`(`fill-*`;如同 CSS 的繼承方式,從 plot 繼承)繪製,未設定時使用 `currentColor`(其類別的顏色搭配 `color`),且不顯示 hover 圓點。在 band scale 上,hover 會找出指標下方的 band,plot 的十字線則位於該 band 中,與其同寬:`crossLineClass="w-full h-full bg-foreground/5"` 為該 band 著色,`w-px` 則在其中央保留一條線。在 plot 沒有設定時,bar 的值與基準值會構成值 scale 的 domain。搭配 plot 的 appear,每根 bar 會從其 stack 的基準值長出;動作、淡入淡出與滑動都在平台的 animator 上執行,指標不會讓任何 bar 重新繪製。

<a id="ranges"></a>

### 範圍

<!-- demo: el-plot-ranges -->

當 `base` 為欄位或函式時,每根 bar 涵蓋其資料列的兩個值:waterfall 的一個步驟,從之前的累計值到之後的累計值;蠟燭圖的實體,從開盤到收盤;任務則從開始到結束。bar 出現時從其自身的基準值開始增長,其標籤位於值端,上升的 bar 在上方,下降的 bar 在下方。

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

funnel 是置中的橫向 bar:在 band y scale 上使用 `base={(d) => -d.users / 2}` 與 `value={(d) => d.users / 2}`。

## Rule

`Rule` 會為每個資料列沿值軸繪製一條直線,從 `base` 到該列的值:在 band scale 上位於該列 band 的中央(在 band y scale 上則橫跨 plot),在 point 或 linear scale 上則位於該列沿 x 軸的位置。蠟燭圖的燭芯、箱型圖的鬚線、誤差線與棒棒糖圖的莖都是 rule;蠟燭圖則是 `Bar` 疊在 `Rule` 上:

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

| 屬性 | 型別 | 預設值 | 說明 |
|---|---|---|---|
| `value` | `string \| (d, index) => number` | plot 的 `y` | 每條線的終點。沒有值的資料列則沒有線。 |
| `base` | `number \| string \| (d, index) => number` | `0` | 每條線的起點:可為所有資料列共用的一個值(棒棒糖圖從零線出發的莖),或是為每個資料列提供各自值的欄位或函式(蠟燭圖的最低價)。它會計入 domain。 |
| `scale` | `"y" \| "y2"` | `"y"` | 其值所依循的 y scale([Dual axes](#dual-axes))。 |
| `stagger` | `number` | `0` | 搭配 plot 的 appear,線條會逐列依序開始,分布在此比例的時間內(0 到 0.95),每條線在剩餘時間內從其起點增長。 |
| `inactiveOpacity` | `number` | 無 | 當指標位於 plot 上時,指標所在資料列以外的線條的不透明度,與 `Bar` 的相同。 |
| `color` | `string \| (d, index) => string` | 無 | 每條線的類別,顏色取自 plot 的 `colorScale`:在未另外設定時為線條的 `stroke`。 |

rule 以其 `stroke`(`stroke-*`、`strokeWidth`、`strokeDasharray`;如同 CSS 的繼承方式,從 plot 繼承)描邊,未設定時使用 `currentColor`,且不顯示 hover 圓點。在 plot 沒有設定時,其值與基準值會構成值 scale 的 domain;它會隨 plot 的 appear 從起點增長,並隨 scale 的 domain 移動,皆在平台的 animator 上執行。
## Dot

<!-- demo: el-plot-dots -->

`Dot` 會為每一列在其兩個值交會之處繪製一個點：其 `x` 沿著 `linear` x 刻度，其 `value` 沿著 y 軸向上，構成散佈圖；在 band x 刻度上，每個點位於其所屬列的 band 中央；在 band y 刻度上（此時 x 刻度為 `linear`），其值沿 x 延伸，其所屬列的 band 則沿圖表向下排列，構成點圖（dot plot）。其半徑 `r` 可以是適用於所有點的單一數字，也可以是每一列的某個值，由 `rScale` 轉換為半徑，構成氣泡圖。沒有值的列不會有點。

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

當 `r` 為欄位或函式時，每一列的值決定其點的大小。`rScale={{ type: "sqrt", range: [min, max] }}` 會如同 d3 的 `scaleSqrt` 一樣，將這些值的平方根對應到以點（point）為單位的半徑，因此當範圍從 0 開始時，氣泡的面積與其值成正比；範圍從大於 0 的值開始，則能讓最小的氣泡保持可見。除非刻度指定了定義域，否則定義域為 0 到最大值。較大的點會先繪製，使較小的點能顯示在它們上方而保持可見：

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

當圖表沒有定義域時，點的值會形成值刻度的定義域，且不會刻意包含 0，因此散佈圖的座標軸會貼合其資料點。當點很大時，請為圖表的 `domain` 在值的周圍留出一些空間：位於定義域邊緣的氣泡會被繪製到圖表邊緣之外。

同一組 band 中的兩個 mark 可以組成比較一列中兩個值的圖表：棒棒糖圖（lollipop）是從 0 出發的 `Rule`，其下方在該值處有一個 `Dot`；啞鈴圖（dumbbell）則是在 band y 刻度上，從一個值到另一個值的 `Rule`，兩端各有一個 `Dot`：

```tsx
<Plot data={stocks} yScale={{ type: "band", paddingInner: 0.3 }} xScale={{ type: "linear", domain: [-50, 80] }} class="h-48">
  <Rule value="high" base="low" class="stroke-border stroke-2" />
  <Dot value="before" r={3.5} class="fill-card stroke-muted-foreground" hoverDotClass="hidden" />
  <Dot value="now" r={5} class="fill-chart-1 stroke-card stroke-2" hitRadius={24} />
</Plot>
```

| Prop | Type | Default | Description |
|---|---|---|---|
| `value` | `string \| (d, index) => number` | 圖表的 `y` | 每個點在值軸上的位置：沿 y 軸向上，或在 band y 刻度上沿 x 軸。沒有值的列不會有點。 |
| `r` | `number \| string \| (d, index) => number` | `3` | 點的半徑（以點為單位），或是一個欄位或函式，為每一列提供一個值，由 `rScale` 轉換為半徑（未指定時，該值即為半徑）。值缺失的列不會有點。 |
| `rScale` | `{ type: "sqrt"; domain?: [number, number]; range: [number, number] }` | none | `r` 的值如何成為半徑：取其平方根，在 `domain`（未指定時為 0 到最大值）上對應到半徑的 `range`，因此從 0 開始的範圍會使每個點的面積與其值成正比。超出定義域的值會取範圍的端點值。 |
| `stagger` | `number` | `0` | 配合圖表的 appear，點會在整個動畫的這個比例（0 到 0.95）內逐列依序開始成長；0 則讓它們同時成長。 |
| `inactiveOpacity` | `number` | none | 當指標或按鍵停留在某個點上時，其他點的不透明度：它們會隨著懸停而淡入淡出。 |
| `color` | `string \| (d, index) => string` | none | 每個點的類別，其顏色取自圖表的 `colorScale`：在沒有其他設定時即為點的 `fill`（[依類別著色](#colors-by-category)）。 |
| `hitRadius` | `number` | `8` | 指標在超出點的邊緣多遠的範圍內仍能找到該點：在此距離內的點之中，指標會找到中心離它最近的那一個（Voronoi 單元），因此疊在大氣泡上的小氣泡能以其自身中心附近被找到。點圖的列在半徑與一列同樣大時，可從沿該列的任何位置被找到。 |
| `scale` | `"y" \| "y2"` | `"y"` | 其值所沿用的 y 刻度（[雙軸](#dual-axes)）；位於 band y 刻度上的點則將其值沿 x 排列。 |
| `hoverDotClass`, `hoverDotStyle` | `string`, `StyleProp<ViewStyle>` | 圖表的 `dotClass`, `dotStyle` | `hoverDot` 部件：一個與指標下的點同樣寬高的視圖，以該點為中心。`rounded-full outline-2 outline-offset-1` 會為其加上環形框；`hidden` 則使此 mark 不顯示任何框。 |

點會以其 `fill`（`fill-*`；如同 CSS 的繼承方式從圖表繼承）填色，未設定時使用 `currentColor`（其類別的顏色搭配 `color`），並在有設定時以其 `stroke`（`stroke-*`、`strokeWidth`）描邊：使用卡片顏色的環可讓重疊的點彼此分開。在有點的圖表上，圖表會回報中心離指標最近的點所屬的列（距離所有點都太遠時為 `null`），按鍵會依列的順序逐一移動（將列依 x 排序，按鍵便會由左至右走過各點），而 `hoverDot` 部件會標示該點。配合圖表的 appear，點會從無到有成長；配合 `motion.update`，點會移動到其新的值與大小，新增列的點會成長出現，已移除列的點則會縮小消失；這一切都由平台的 animator 執行，不會重新繪製任何 mark。

## Cell

<!-- demo: el-plot-cells -->

`Cell` 會為每一列同時在兩個 band 中繪製一個矩形：其 `x` 類別沿 `band` x 刻度的 band，以及其 `y` 類別沿 `band` y 刻度的 band，因此這些列構成一個格狀圖，即熱度圖（heatmap）。相關係數矩陣、每月報酬的日曆，以及每小時一週的交易量，都是 cell 的例子。每個 cell 會填滿它的兩個 band，因此刻度的 `paddingInner` 與 `paddingOuter` 就是 cell 之間與周圍的間隙。其顏色是其 `value` 沿圖表的 `colorScale`（一條色階，[沿色階著色](#colors-along-a-ramp)）所對應的顏色，或是透過序數色階由其 `color` 類別決定。Cell 位於圖表的 x 與 y 刻度上。

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

band 刻度的 `domain` 會依序列出其 band 的類別，如同 d3 的 `scaleBand().domain()`：日曆的月份從一月到十二月，無論其列是否已經出現，每個月都有自己的 band，因此上方的 2026 年 3 月是格中的一處空白。沒有定義域時，band 就是 cell 沿該軸所指名的類別，依列帶來它們的順序排列（上方的 2025 在 2026 之上）。沿著類別 band 刻度的 `PlotAxis` 會寫出每個 band 的類別，不需要 `format`。

相關係數矩陣在兩個軸上列出相同的持股，其 `domain` 為係數的完整範圍，因此無論持股為何，係數 0 都會取色階的中間色：

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

| Prop | Type | Default | Description |
|---|---|---|---|
| `x` | `string \| (d, index) => string` | none | 每一列所在的欄：一個欄位（其文字或數字）或回傳類別的函式。該列的 cell 會放在 x 刻度中該類別的 band；沒有類別的列不會有 cell。 |
| `y` | `string \| (d, index) => string` | none | 每一列所在的行，為沿 y 刻度的 `x`。 |
| `value` | `string \| (d, index) => number` | none | 每個 cell 的數值，由 `sequential` 或 `diverging` `colorScale` 轉換為其顏色。沒有數值的列會取刻度的 `unknown` 顏色，若也沒有該顏色則不會有 cell。 |
| `color` | `string \| (d, index) => string` | none | 每個 cell 的類別，其顏色取自 `ordinal` `colorScale`（[依類別著色](#colors-by-category)）。 |
| `cornerRadii` | `number \| { topLeft?, topRight?, bottomRight?, bottomLeft? }` | `0` | 其 cell 每個圓角的半徑。 |
| `stagger` | `number` | `0` | 配合圖表的 appear，cell 會在整個動畫的這個比例（0 到 0.95）內逐列依序開始成長，其餘時間各自從中心成長；0 則讓它們同時成長。 |
| `inactiveOpacity` | `number` | none | 當指標或按鍵停留在某個 cell 上時，其他 cell 及其標籤的不透明度：它們會隨著懸停而淡入淡出。 |
| `label` | `string \| (d, index) => string` | none | `label` 部件：每個 cell 中央的文字，可為欄位（其文字或數字）或回傳文字的函式，由應用程式負責格式化。每個標籤只在其排版後的大小能放進 cell 時才會顯示，因此窄的圖表只會顯示顏色。 |
| `labelClass`, `labelStyle` | `string`, `StyleProp<TextStyle>` | none | 標籤的字型、大小與顏色。當 cell 的 `colorScale` 顏色較深時，其標籤會具有屬性 `data-dark`（此時淺色文字更易閱讀），因此 `data-dark:text-white` 會在那裡將其寫成淺色。 |
| `hoverCellClass`, `hoverCellStyle` | `string`, `StyleProp<ViewStyle>` | none | `hoverCell` 部件：一個與指標或按鍵所在 cell 同樣大小的視圖，覆蓋在其上；`rounded-sm outline-2 outline-foreground` 會為其加上環形框。它會在同一個影格中隨指標移動，並在按鍵移動它時以 `pointer` 彈簧滑動。 |

Cell 在應用程式未設定 `fill` 時，會以圖表 `colorScale` 中的顏色填色（`fill-*` 的 class 與樣式優先，如同 CSS 的繼承方式從圖表繼承），沒有任何設定時使用 `currentColor`，並在有設定時以其 `stroke` 描邊。在有 cell 的圖表上，圖表會回報指標所在 cell 的列，在兩個 cell 之間的間隙則回報較近的那一個；方向鍵會依畫面上的格狀排列逐格移動（[鍵盤](#keyboard)），螢幕閱讀器則依列的順序逐一讀取。配合圖表的 appear，cell 會從中心成長；配合 `motion.update`，cell 的顏色會平滑轉為新的顏色，新增列的 cell 會成長出現，已移除列的 cell 會縮小消失，cell 也會移動到其新的 band；這一切都由平台的 animator 執行，不會重新繪製任何 mark。
<a id="pie-and-arc"></a>

## Pie 與 Arc

`Pie` 會把一圈依每列分成一個扇形，每個扇形佔各列數值的比例，從 12 點鐘方向起依順時針、按列的順序，繞著繪圖區的中心排列。`innerRadius` 則讓它成為環圈圖。每個扇形都是各自獨立的畫布，即 `slice` 部件，因此各自以自己的 class 繪製：`sliceClass` 可以是套用於每個扇形的同一組 class，或是以該扇形所屬的列為參數、為各扇形提供各自 class 的函式。在 Pie 上，繪圖區會回報指標下方扇形所屬的列（在中空處或圓環之外則為無），其 tooltip 會跟隨指標，該扇形會放大 `hoverLift`，其餘扇形則淡出 `hoverDim`，並以平台的 animator 搭配繪圖區的 `motion` 執行。`Arc` 在兩個角度之間繪製一個扇區：可用作儀表的軌道及其數值，或作為 Pie 後方的圓環。

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

| 標記 | 屬性 | Rust | 型別 | 預設值 | 說明 |
|---|---|---|---|---|---|
| `Pie` | `value` | `.value(..)` | `keyof T \| (d: T, index: number) => number` | 繪圖區的 `y` | 每一列的數值。數值為零、為負或不是數字的列沒有扇形。 |
| `Pie`、`Arc` | `startAngle`、`endAngle` | `.start_angle(..)`、`.end_angle(..)` | `number`（弧度） | `0`、`2 * Math.PI` | 第一個扇形的起點與最後一個扇形的終點（即 Arc 的兩端）：從 12 點鐘方向起、依順時針計算的弧度。`endAngle` 小於 `startAngle` 時，Pie 的扇形會以相反方向排列。 |
| `Pie` | `padAngle` | `.pad_angle(..)` | `number`（弧度） | `0` | 相鄰扇形在外緣的夾角。每道間隙在任何半徑上都維持該寬度（約 `padAngle * outerRadius` 點），兩側邊緣平行，因此在中心或中空處與在外緣一樣寬；窄到無法抵達中心的扇形，會在其邊緣相交處結束。只有一個扇形的 Pie 沒有間隙。 |
| `Pie`、`Arc` | `innerRadius`、`outerRadius` | `.inner_radius(..)`、`.outer_radius(..)` | ``number \| `${number}%` `` | `0`、`"100%"` | 中空處與外緣的半徑：以點為單位，或為繪圖區所能容納的最大圓（其較短邊的一半）的百分比。 |
| `Pie`、`Arc` | `cornerRadius` | `.corner_radius(..)` | `number` | `0` | 每個扇形（或 Arc）的圓角半徑，以點為單位，如同 d3 的 `arc.cornerRadius`：每個圓角都是與邊緣及外緣或中空處相切的圓，包含間隙的平行邊緣。其上限為圓環厚度的一半，此時 Arc 會有圓形端點；若扇形太窄、容不下兩個完整的圓角，兩個圓角會在其中線相接。完整的圓環只保留其圓形邊緣。 |
| `Pie` | `sliceClass` | `.slice_class(..)` | `string \| (d: T, index: number) => string` | 無 | 每個扇形的 class（`fill-*`、`stroke-*`）：可以對每個扇形都相同，或是以該扇形所屬的列及其索引為參數的函式，在列或函式變更時，對每一列各呼叫一次。 |
| `Pie` | `sliceStyle` | `.slice_style(..)` | `StyleProp<ViewStyle>` | 無 | 每個扇形的樣式，疊加在其 class 之上（`fill`、`stroke`、`strokeWidth`）。 |
| `Pie` | `hoverLift` | `.hover_lift(..)` | `number` | `0` | 指標下方的扇形比其他扇形多放大多少，以點為單位：依繪圖區的 `pointer` spring 運動，隨懸停而淡入淡出。 |
| `Pie` | `hoverDim` | `.hover_dim(..)` | `number`（0 到 1） | `0` | 指標位於某個扇形上時，其他扇形淡出的程度，以其不透明度的比例表示，並隨懸停的淡化而變化。 |
| `Pie` | `color` | `.color(..)` | `keyof T \| (d: T, index: number) => string` | 無 | 每個扇形的類別，其顏色取自繪圖區的 `colorScale`：在沒有其他設定時，採用該扇形的 `fill`（[依類別著色](#colors-by-category)）。 |
| `Pie` | `label` | `.label(..)` | `string \| (d: T, index: number) => string` | 無 | 每個扇形旁的文字：可以是欄位（取其數值），或是回傳由應用程式格式化之文字的函式。文字為空的列，或窄於半度的扇形，不會有文字。 |
| `Pie` | `labelClass`、`labelStyle` | `.label_class(..)`、`.label_style(..)` | `string`、`StyleProp<TextStyle>` | 無 | `label` 部件：位於圓環外、引導線末端的文字，以該末端為中心；在 Pie 的右半邊置於末端之後，在左半邊則置於其前。其 padding 即與引導線末端的距離。 |
| `Pie` | `labelGap` | `.label_gap(..)` | `number` | `15` | 標籤位於外緣之外多遠，以點為單位。 |
| `Pie` | `labelLineClass`、`labelLineStyle` | `.label_line_class(..)`、`.label_line_style(..)` | `string \| (d: T, index: number) => string`、`StyleProp<ViewStyle>` | 無 | `labelLine` 部件：每個標籤的引導線，從扇形中線上的外緣延伸到標籤所在的半徑，再橫向連到文字。其 `stroke`（未設定時為 `currentColor`）、`strokeWidth` 與 `strokeDasharray`，可以對每條線都相同，或是以該扇形所屬的列為參數的函式；套用樣式後才會顯示。 |

扇形與 Arc 以 `fill` 填色（未設定時為 `currentColor`，扇形則在有 `color` 時採用其類別的顏色），並以 `stroke` 描繪邊緣（未設定時為無），其自身的設定優先於 Pie 及繪圖區的設定，依 CSS 的繼承方式而定：以表面顏色（`stroke-card stroke-2`）描邊，也會在扇形之間切出間隙。它們的數值不參與繪圖區的 scale。Pie 的扇形只有在列、其數值、角度、半徑或繪圖區大小變更時才會重新繪製；指標移動時，由 animator 驅動放大與淡化。

含有 Pie 的繪圖區通常會依指標放置 tooltip（`tooltipPlacement="pointer"`），因為 Pie 的列在軸上沒有位置：十字線與 tooltip 會在其上跟隨指標，且不會顯示懸停圓點。環圈圖的中心是覆蓋在繪圖區上、屬於應用程式自己的元素（顯示懸停扇形的數值或總計），其圖例也是如此，每個圖例項目都採用其扇形的顏色。

Pie 的標籤在圓環外標示其扇形：每段文字位於外緣之外 `labelGap` 處、朝向其扇形的中線（即該半徑上扇形的形心），再橫向延伸到 Pie 中該扇形所在一側的該半徑處，並以套用樣式的引導線連到外緣。標籤會隨繪圖區的出場動畫與其扇形一起掃入，並在動畫結束時淡入，在 `motion.update` 時隨扇形移動，並隨懸停的扇形上浮；這一切都在平台的 animator 上執行。請為標籤預留空間：將 `outerRadius` 設為小於 `"100%"`，或在繪圖區周圍留出空間。應用程式自己要放在扇形處的內容，是覆蓋在繪圖區上的元素，如同環圈圖的中心。

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

## 依類別著色

繪圖區的 `colorScale` 為各類別指定顏色，如同 d3 的 `scaleOrdinal`，而標記的 `color` 則指定每一列所屬的類別：可以是欄位（取其文字或數值），或是以該列為參數的函式。`domain` 的類別依序取用 `range` 的顏色，當 domain 比 range 長時，range 會從第一個顏色重新開始。位於 domain 之外的類別採用 `unknown`；若沒有設定，則在標記第一次遇到它時加入 domain（依標記順序，各標記再依其列的順序），並取用下一個顏色，因此完全沒有 `domain` 時，類別會依各列帶來的順序取得顏色。這些顏色由應用程式決定：可以是 CSS 顏色，包括主題的 token。

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

扇形、長條與圓點採用其所屬列的顏色；`Line` 與 `Area` 各自是一個數列，採用其第一列的顏色，因此由自己的列組成的線（`data`）會呈現其列的顏色，而同一個 scale 能讓同一類別在 Pie、長條與折線中保持相同的顏色。在沒有其他設定時，該顏色即為標記的 `fill`（線則為 `stroke`），取代 `currentColor`：應用程式的 class 與樣式優先，接著依序是部件的（`sliceClass`、`sliceStyle`）、標記的，以及繼承自繪圖區的，因此 `sliceClass={(d) => (d.name === "Other" ? "fill-muted" : "")}` 可以單獨為某一個扇形指定顏色，而 scale 則為其他扇形著色。在 `background` 部件旁，長條與區域圖的 `fill` 維持為 `none`。

| `OrdinalScale` | 型別 | 預設值 | 說明 |
|---|---|---|---|
| `type` | `"ordinal"` | （必填） | scale 的種類。 |
| `domain` | `string[]` | 無 | 依序列出的類別。重複寫出的類別保留其第一次出現的位置。 |
| `range` | `string[]` | （必填） | 依序列出的顏色（CSS 顏色）；第 `i` 個類別取用第 `i % range.length` 個顏色。 |
| `unknown` | `string` | 無 | domain 之外所有類別的顏色；若沒有設定，則各自取用下一個顏色。 |

<a id="colors-along-a-ramp"></a>

### 沿色階著色

`colorScale` 為 `type: "sequential"` 或 `"diverging"` 時，會沿著色階為數值指定顏色，如同 d3 的 `scaleSequential` 與 `scaleDiverging`，用於 [`Cell`](#cell) 的 `value`。其 `range` 為兩個或更多個顏色，從色階的低端到高端均勻分布，並在相鄰顏色之間以 OKLab 混色：階層在視覺上看起來均勻，兩種色相也會透過它們自己的混合色相接。超出 `domain` 的值會取用色階的端點顏色，沒有數值的列則取用 `unknown`。

`sequential` 會將其 `domain` 攤開到整個色階上，除非應用程式另外指定，否則 domain 即為各儲存格數值的範圍：適用於計數、數量與活躍度。`diverging` 則把其 `pivot`（預設為 0）放在色階的中間色，低於它的值沿前半段上色，高於它的值沿後半段上色：以一種色相表示虧損、另一種色相表示獲利，持平的月份則落在中性的中間色。除非應用程式指定 domain，否則 domain 為數值的範圍，並在 pivot 兩側調整為對稱（Observable Plot 的 `symmetric`），因此相同大小的虧損與獲利呈現的強度一致；相關係數矩陣則會指定 `domain: [-1, 1]`。

```tsx
colorScale={{ type: "sequential", range: [token("muted"), token("chart-1")] }}
colorScale={{ type: "diverging", pivot: 0, range: [token("destructive"), token("muted"), token("chart-1")] }}
```

| `SequentialScale`、`DivergingScale` | 型別 | 預設值 | 說明 |
|---|---|---|---|
| `type` | `"sequential" \| "diverging"` | （必填） | 色階的種類。 |
| `domain` | `[number, number]` | 數值的範圍（`diverging` 則在 pivot 兩側調整為對稱） | 色階兩端的值。 |
| `pivot` | `number` | `0` | 僅限 `diverging`：色階中間色對應的值。 |
| `range` | `string[]` | （必填） | 沿色階從低端到高端的顏色（CSS 顏色），相鄰顏色之間以 OKLab 混色。 |
| `unknown` | `string` | 無 | 沒有數值的列的顏色；若沒有設定，該列沒有儲存格。 |
<a id="radialline-and-radialgrid"></a>

## RadialLine 與 RadialGrid

`RadialLine` 會繞著繪圖區的中心畫出一個數列:可以是雷達圖的多邊形,或是錶盤上的一圈線。每個有值的資料列都是位於該列角度上的一個點,離中心的距離由繪圖區的 y 比例尺依其值決定,範圍從 `innerRadius`(定義域的最小值)到 `outerRadius`(最大值)。沒有 `angle` 時,各列會從 12 點鐘方向起,依序順時針均分一整圈,因此六列就是一個六邊形;`closed` 會把最後一點連回第一點。線條會描出各點的輪廓,並把面積填滿至 `innerRadius`(預設為中心),因此一個標記就能同時畫出雷達圖的外框與底色。`RadialGrid` 會在其後方繪製雷達圖的格線:`rings` 位於 y 比例尺的各個值上,為通過各列角度的多邊形或 `circular`,以及延伸至每一列的 `spokes`。在 radial line 上方時,繪圖區會回報角度最接近指標角度、且位於該線外半徑之內的那一列,每條線的 hover 圓點則位於其在該列的點上。

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

| 標記 | 屬性 | Rust | 型別 | 預設值 | 說明 |
|---|---|---|---|---|---|
| `RadialLine` | `radius` | `.radius(..)` | `keyof T \| (d: T, index: number) => number` | 繪圖區的 `y` | 決定每一列離中心多遠:取 y 比例尺的值,定義域最小值位於 `innerRadius`,最大值位於 `outerRadius`。沒有值的列會被略過。 |
| `RadialLine` | `angle` | `.angle(..)` | `keyof T \| (d: T, index: number) => number` | 各列在一圈上均分 | 每一列繞中心的位置:自 12 點鐘方向起、順時針的弧度。 |
| `RadialLine`、`RadialGrid` | `startAngle`、`endAngle` | `.start_angle(..)`、`.end_angle(..)` | `number`(弧度) | `0`、`2 * Math.PI` | 沒有 `angle` 時各列的位置:從 `startAngle` 起均分。繞滿一整圈時,相鄰兩列相隔一圈的 `1 / rows`,最後一列與第一列也相隔一步;若只涵蓋部分圈,則第一列位於 `startAngle`,最後一列位於 `endAngle`。 |
| `RadialLine`、`RadialGrid` | `innerRadius`、`outerRadius` | `.inner_radius(..)`、`.outer_radius(..)` | ``number \| `${number}%` `` | `0`、`"100%"` | y 定義域的最小值與最大值所在位置:以點為單位,或是繪圖區所能容納最大圓(其較短邊的一半)的百分比,如同圓餅圖的半徑。線條的面積填滿至 `innerRadius`;格線的輻條則延伸於兩者之間。 |
| `RadialLine` | `curve` | `.curve(..)` | `"linear" \| "natural" \| "stepAfter"` | `"linear"` | 連接各點的方式:直線段、平滑曲線(封閉時為平滑的環)或階梯狀。 |
| `RadialLine` | `closed` | `.closed(..)` | `boolean` | `false` | 從最後一點接回第一點:即雷達圖的多邊形。不封閉時,其面積會閉合至中心(或沿其內緣)。 |
| `RadialLine` | `dot`、`dotClass`、`dotStyle` | `.dot(..)`、`.dot_class(..)`、`.dot_style(..)` | `boolean`、`string`、`StyleProp<ViewStyle>` | `false` | 每個點上的圓點:以該點為中心的 view,其大小、背景與邊框由應用程式決定。圓點會隨線條向外生長並移動。 |
| `RadialLine` | `backgroundClass`、`backgroundStyle` | `.background_class(..)`、`.background_style(..)` | `string`、`StyleProp<ViewStyle>` | 無 | 其背景:圍繞其外圓的方塊,其背景(`bg-*`,漸層)只顯示在其面積內部、位於其 `fill` 之下,與 area 相同。 |
| `RadialLine` | `hoverDotClass`、`hoverDotStyle` | `.hover_dot_class(..)`、`.hover_dot_style(..)` | `string`、`StyleProp<ViewStyle>` | 繪圖區的 `dotClass`、`dotStyle` | 其 hover 圓點,位於指標所在列的點上,指標也在同一個框架內;按方向鍵切換時,會依繪圖區的 `pointer` spring 滑向下一列;`hidden` 則不顯示。 |
| `RadialGrid` | `rings` | `.rings(..)` | `number[]` | 無 | 其環的位置,以 y 比例尺的值表示:每個環與 radial line 放置該值之處同樣遠。 |
| `RadialGrid` | `spokes` | `.spokes(..)` | `boolean` | `false` | 在每一列的角度上,從 `innerRadius` 到 `outerRadius` 的一條線。 |
| `RadialGrid` | `circular` | `.circular(..)` | `boolean` | `false` | 其環為圓(涵蓋部分圈時為弧)。預設為通過各列角度的多邊形,而繪圖區少於三列時則為圓。 |

radial line 以 `stroke`、`strokeWidth` 與 `strokeDasharray` 描邊(`currentColor`,未設定時為 1 寬的實線),並以 `fill` 填滿其面積(未設定時為無);radial grid 的描邊方式與 grid 相同。它們的繪製樣式繼承自繪圖區。當繪圖區沒有定義域時,線條的值連同 0 會構成 y 比例尺的定義域,因此正值的雷達圖會從中心向外生長;格線的環則不會。請為繪圖區提供 y `domain`,以便在數值變動時保持環與雷達圖的比例尺固定。

雷達圖周圍的標籤是應用程式疊放在繪圖區上的元素,如同環圈圖的中心。沒有 `angle` 時,第 `i` 列(共 `n` 列)位於從 12 點鐘方向起 `a = 2π·i / n` 處,因此在方形繪圖區中,位於 `left: 50% + r·sin(a)`、`top: 50% − r·cos(a)` 的無尺寸方塊(`r` 為繪圖區邊長的百分比,比外半徑所占比例的一半略多)標出了邊緣外的位置,名稱由此處向遠離中心的方向長出:在右半邊位於其右側,在左半邊位於其左側,在頂端位於其上方,在底端位於其下方,如上所示。

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

`Sankey` 會畫出繪圖區各列之間的流量:每一列是一個節點,`links` 指定節點之間的流量,格式為 `{ source, target, value }` with the indices of two rows in the plot's `data`。它依 d3-sankey 的方式,在繪圖區的大小內進行排版:節點分成多欄(`nodeAlign`),每個節點的高度取決於流入或流出它的最大流量,同一欄的節點彼此相隔 `nodePadding`,並經過 `iterations` 次迭代朝其流量鬆弛;每條連結都有一條從來源節點右緣到目標節點左緣的緞帶,其兩端的寬度各為其占該節點該側的比例,因此即使節點流入與流出的量不同,其兩側也都會被完全覆蓋。每一欄都在繪圖區中置中,而連續多個相同的單節點欄會稍微錯開,讓它們之間的緞帶呈現弧度。`valueScale="sqrt"` 依數值的平方根決定大小,避免單一占比極高的流量讓較小的流量相形見絀。

每個節點與每條緞帶都是各自獨立的 canvas,即 `node` 與 `link` 部件,因此各自以自己的 class 繪製:`nodeClass` 可以是套用在每個節點上的相同 class,也可以是節點資料列的函式;`linkClass` 可以是套用在每條緞帶上的相同 class,也可以是連結的函式。`linkBackground` 部件會在每條緞帶內顯示背景,為從來源到目標的方塊:傳入連結的函式,就能讓每條緞帶呈現從來源顏色到目標顏色的漸層。緞帶繪製在節點之下,兩者都會隨繪圖區的 appear 從前緣開始繪入。

在 sankey 上方時,繪圖區會回報指標下的節點(`onHoverChange`,即該節點的資料列;位於緞帶上時則無),其 tooltip 會跟隨指標,而與該節點無關的連結會淡出 `hoverDim`,以平台的 animator 並依繪圖區的 `motion` 進行。方向鍵會依各列的順序逐一切換節點,tooltip 位於各節點中央的旁邊。`nodeLabel` 為每個節點命名,`valueLabel` 提供其值;兩者都設定時,值顯示在名稱之上:位於第一欄節點的左側、最後一欄節點的右側、其間各欄節點的上方並置中,如同 `gpui-component` 的圖表所放置;節點旁的標籤會維持在繪圖區的頂端與底端之間,而超出繪圖區邊緣的標籤則位於應用程式在其周圍預留的空間(其邊距)內。`nodeLabel` 部件的 padding 是與其節點之間的間距,其 class 決定其文字(`max-w-20 truncate` 會截短過長的名稱);標籤會隨 appear 淡入。當應用程式變更流量時,每個節點與每條緞帶都會依繪圖區的 `motion.update` 從舊位置移動到新位置,其標籤也隨之移動:新加入流量的節點從其中央長出,新加入的連結從其最小寬度長出,而消失的則會立即離開;若在移動途中發生變更,則會從目前繪製的位置繼續。連結以其來源與目標來區分,因此重新排列 `links` 不會造成任何移動。

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

| 屬性 | Rust | 型別 | 預設值 | 說明 |
|---|---|---|---|---|
| `links` | `.links(..)` | `SankeyLink[]`(`{ source: number; target: number; value: number }`) | 必填 | 流量:從資料列 `source` 到資料列 `target`(為其在繪圖區 `data` 中的索引),`value` 為其大小。不是數字或小於零的值不帶有任何流量,也不會畫出緞帶。 |
| `nodeWidth` | `.node_width(..)` | `number` | `24` | 每個節點的寬度,以點為單位。 |
| `nodePadding` | `.node_padding(..)` | `number` | `8` | 同一欄節點之間的間距,以點為單位;在過於擁擠的欄中會較小。 |
| `nodeAlign` | `.node_align(..)` | `"justify" \| "left" \| "right" \| "center"` | `"justify"` | 每個節點所在的欄,與 d3-sankey 相同:從第一欄起算的深度(`"left"`)、在其流量允許下盡量靠右(`"right"`)、其深度,但只發出流量的節點則緊鄰其目標(`"center"`),或其深度,但只接收流量的節點置於最後一欄(`"justify"`)。 |
| `iterations` | `.iterations(..)` | `number` | `6` | 讓節點朝其流量鬆弛的迭代次數。 |
| `valueScale` | `.value_scale(..)` | `"linear" \| "sqrt"` | `"linear"` | 高度與寬度與數值成正比,或與其平方根成正比。 |
| `minLinkWidth` | `.min_link_width(..)` | `number` | `1` | 緞帶繪製的最小寬度,以點為單位,讓小流量仍然可見。 |
| `nodeCornerRadius` | `.node_corner_radius(..)` | `number` | `0` | 每個節點圓角的半徑,以點為單位。 |
| `nodeClass` | `.node_class(..)` | `string \| (d: T, index: number) => string` | 無 | 每個節點的 class(`fill-*`、`stroke-*`):可以是套用在每個節點上的相同 class,也可以是節點資料列及其索引的函式,在資料列或該函式變更時,每一列呼叫一次。 |
| `nodeStyle` | `.node_style(..)` | `StyleProp<ViewStyle>` | 無 | 每個節點的樣式,疊加於其 class 之上。 |
| `linkClass` | `.link_class(..)` | `string \| (link: SankeyLink, index: number) => string` | 無 | 每條緞帶的 class:可以是套用在每條緞帶上的相同 class,也可以是連結及其在 `links` 中索引的函式。 |
| `linkStyle` | `.link_style(..)` | `StyleProp<ViewStyle>` | 無 | 每條緞帶的樣式,疊加於其 class 之上。 |
| `linkBackgroundClass` | `.link_background_class(..)` | `string \| (link: SankeyLink, index: number) => string` | 無 | 每條緞帶背景的 class(`bg-*`,漸層:`bg-linear-to-r from-… to-…`),顯示在緞帶內部、位於從來源到目標的方塊上,並位於其 `fill` 之下。有背景時,緞帶的 `fill` 在未設定時為 `none`。 |
| `linkBackgroundStyle` | `.link_background_style(..)` | `StyleProp<ViewStyle>` | 無 | 每條緞帶背景的樣式,疊加於其 class 之上。 |
| `hoverDim` | `.hover_dim(..)` | `number`(0 到 1) | `0` | 與指標下節點無關的連結淡出的程度,以其不透明度的比例表示,依繪圖區的 `pointer` spring 進行,並與 hover 的淡出同步。 |
| `nodeLabel` | `.node_label(..)` | `keyof T \| (d: T, index: number) => string` | 無 | 每個節點旁的名稱:可以是欄位,也可以是節點資料列及其索引的函式。 |
| `valueLabel` | `.value_label(..)` | `(d: T, value: number, index: number) => string` | 無 | 每個節點旁、位於其名稱之上的值:為其資料列與流入或流出它的最大流量的函式(以連結的值計,不受 `valueScale` 影響)。 |
| `nodeLabelClass` | `.node_label_class(..)` | `string` | 無 | 每個標籤的 class,即 `nodeLabel` 部件:其 padding 為與節點之間的間距,其文字樣式適用於兩行文字。 |
| `nodeLabelStyle` | `.node_label_style(..)` | `StyleProp<TextStyle>` | 無 | 每個標籤的樣式,疊加於其 class 之上。 |
| `valueLabelClass` | `.value_label_class(..)` | `string` | 無 | 值這一行的 class,即 `valueLabel` 部件,疊加於標籤的 class 之上。 |
| `valueLabelStyle` | `.value_label_style(..)` | `StyleProp<TextStyle>` | 無 | 值這一行的樣式,疊加於其 class 之上。 |

節點與緞帶以 `fill` 填滿(未設定時為 `currentColor`),並以 `stroke` 描邊(未設定時為無),其自身的設定優先於 sankey 與繪圖區的設定,依 CSS 的繼承方式處理。沒有任何流量通過的節點高度為一個點。排版只會在連結、選項或繪圖區的大小變更時重新執行,不會因指標或 appear 而重新執行;繪圖區大小變更時不會造成任何移動。構成循環的連結,或指向繪圖區沒有的資料列的連結,不會繪製任何內容,並會記錄一則警告。其值不參與繪圖區的比例尺。
## Treemap

`Treemap` 將圖表的各列繪製為巢狀矩形組成的階層：每一列是一個節點，其 `id` 與它所指名的 `parent` 構成樹（d3 的 `stratify`），每個葉節點的面積與其 `value` 成正比，每個群組則是其下所有節點的外框，其值為底下各葉節點的值的總和（不論它自己那一列存放什麼）。沒有 `parent`、或其父節點所指名的列不存在的列，就是頂層節點；沒有 `id` 時，列的 id 即為其索引，因此 `parent` 也可以用索引指名一列。gpt-vis 所寫的巢狀形式的樹（`{ name, value, children }`），只需應用程式寫幾行程式碼即可轉成列；層數沒有上限。

圖塊採用 squarified 方式排列，如同 d3 的 `treemapSquarify`：每一層的節點依值排序，由左上角起最大者在前（`sort="value"`），趨近長寬比 `ratio`（黃金比例）；`sort="data"` 則維持各列的順序，使節點在值變動時保持原位。`paddingInner` 是同層節點之間的間隙，不會出現在其父節點的任何外緣；`paddingOuter` 是群組內、子節點周圍的空間；`paddingTop` 是每個群組頂端的一條橫帶，其 `groupLabel` 寫在其中。每一項可接受一個套用於所有層級的數字，或由頂層往下每層各一個數字（`[3, 1]`：頂層節點之間為 3，其下為 1）。某一層的橫帶會套用在同一父節點的所有同層節點上，或完全不套用；若其中有一個太小放不下，就整層省略，因此同一層的群組看起來一致。

值為 0、小於 0 或不是數字的葉節點不佔面積：不會繪製、沒有標籤、指標也找不到它，所有葉節點皆如此的群組亦同。Treemap 的面積代表整體的占比，因此被排除的部分由應用程式以自己的文字說明（例如地圖下方的備註）。負數用於顏色：例如市場地圖的當日漲跌。

節點的顏色取自其列在圖表 `colorScale` 中的值：`colorValue` 是沿著色階的數字（`sequential`、`diverging`：下跌為紅、上漲為綠、持平為中性，範圍為未指定 `domain` 時各值的範圍），`color` 則是類別（`ordinal`：`"parent"` 讓同一群組的葉節點顏色相同）。葉節點是 `leaf` 部件（`leafClass`、`leafStyle`），群組是 `group` 部件（`groupClass`、`groupStyle`），只有在設定 class 或 style 時才會繪製：它是位於子節點之下的矩形，顯示在間隙、其 padding 與橫帶中。每個部件在所有節點上都相同，或是節點所屬列的函式。`cornerRadii` 會讓每個矩形變成圓角。

`label` 寫出每個葉節點的名稱，`valueLabel` 在其下寫出值，兩者皆為列及其值的函式（群組的值為其葉節點的總和）：位於左上角（`labelPlacement="start"`）或正中央（`"center"`）。`label` 部件是與其葉節點同大的方塊：其 padding 是與葉節點邊緣的距離，其文字樣式套用於各行。葉節點較窄時，名稱以刪節號截斷，且僅在放得下時顯示；值則完整顯示或完全不顯示。葉節點顏色較深的標籤具有屬性 `data-dark`，因此 `data-dark:text-white` 可讓它在深紅色上保持可讀。

在 treemap 上方，圖表會回報指標下方的節點（`onHoverChange`，即該節點的列）：葉節點，或位於橫帶或 padding 中的群組；越過同層節點之間的間隙時，則回報其中一個，使 hover 不會閃爍。其餘節點淡化為 `inactiveOpacity`（葉節點保留其所屬群組，群組保留其下的內容），而 `hover` 部件（與該節點同大的 view）為其描邊。方向鍵移至畫面上相鄰的葉節點，Home 與 End 移至第一個與最後一個。隨著圖表出現，頂層節點從其中心依序成長，並以 `stagger` 錯開；列變動時，每個節點以 `motion.update` 移至其新的方框與顏色，並以其 `id` 辨識：列中新增的節點從其中心成長，已消失的節點則縮向其自己的中心。圖表的 x 與 y 比例尺不會使用。

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

| 屬性 | Rust | 型別 | 預設值 | 說明 |
|---|---|---|---|---|
| `id` | `.id(..)` | `keyof T \| (d: T, index: number) => string` | 列的索引 | 每列節點的 id：`parent` 所指名的對象，也是列變動時辨識節點的依據。 |
| `parent` | `.parent(..)` | `keyof T \| (d: T, index: number) => string` | 無：每一列都是頂層節點 | 每列父節點的 id；空值或不是任何列的 id 時，為頂層節點。 |
| `value` | `.value(..)` | `keyof T \| (d: T, index: number) => number` | 必填 | 每個葉節點的大小；群組的大小為其子節點的總和。值為 0、小於 0 或不是數字的葉節點不佔面積。 |
| `sort` | `.sort(..)` | `"value" \| "data"` | `"value"` | 同層節點由左上角起最大者在前，或依列的順序。 |
| `ratio` | `.ratio(..)` | `number` | 黃金比例 | 圖塊趨近的長寬比，至少為 1。 |
| `paddingInner` | `.padding_inner(..)` | `number \| number[]` | `0` | 同層節點之間的間隙，單位為點，由頂層往下每層一個值（最後一個值適用於其下所有層）。 |
| `paddingOuter` | `.padding_outer(..)` | `number \| number[]` | `0` | 每個群組內、子節點周圍的空間，每層一個值。 |
| `paddingTop` | `.padding_top(..)` | `number \| number[]` | `0` | 每個群組頂端的橫帶，用於其 `groupLabel`，每層一個值；套用於同一父節點的所有同層節點，或完全不套用。 |
| `cornerRadii` | `.corner_radii(..)` | `number \| { topLeft?, topRight?, bottomRight?, bottomLeft? }` | 直角 | 矩形每個圓角的半徑。 |
| `color` | `.color(..)` | `keyof T \| (d: T, index: number) => string` | 無 | 每個節點的類別，由 `ordinal` `colorScale` 賦予顏色。 |
| `colorValue` | `.color_value(..)` | `keyof T \| (d: T, index: number) => number` | 無 | 每個節點的數字，由 `sequential` 或 `diverging` `colorScale` 轉為其顏色。 |
| `leafClass` | `.leaf_class(..)` | `string \| (d: T, index: number) => string` | 無 | 每個葉節點的 class（`fill-*`、`stroke-*`），所有葉節點相同，或為其列的函式。 |
| `leafStyle` | `.leaf_style(..)` | `StyleProp<ViewStyle>` | 無 | 每個葉節點的樣式，覆蓋其 class。 |
| `groupClass` | `.group_class(..)` | `string \| (d: T, index: number) => string` | 無 | 每個群組的 class，即位於子節點之下的矩形；只有設定 class 或 style 時才會繪製群組。 |
| `groupStyle` | `.group_style(..)` | `StyleProp<ViewStyle>` | 無 | 每個群組的樣式，覆蓋其 class。 |
| `inactiveOpacity` | `.inactive_opacity(..)` | `number`（0 到 1） | 無 | 遠離被 hover 節點的其他節點及其標籤的不透明度，隨 hover 的淡化而變化。 |
| `label` | `.label(..)` | `keyof T \| (d: T, index: number) => string` | 無 | 每個葉節點中的名稱，單行，以刪節號截斷。 |
| `valueLabel` | `.value_label(..)` | `(d: T, value: number, index: number) => string` | 無 | 每個葉節點中、名稱下方的值，僅在能完整放下時顯示。 |
| `labelPlacement` | `.label_placement(..)` | `"start" \| "center"` | `"start"` | 標籤位於其葉節點的左上角，或正中央。 |
| `labelClass` | `.label_class(..)` | `string` | 無 | 每個葉節點標籤的 class，是與葉節點同大的方塊：其 padding 與文字樣式；深色葉節點上有 `data-dark:`。 |
| `labelStyle` | `.label_style(..)` | `StyleProp<TextStyle>` | 無 | 每個葉節點標籤的樣式，覆蓋其 class。 |
| `valueLabelClass` | `.value_label_class(..)` | `string` | 無 | 值那一行的 class，覆蓋標籤的 class。 |
| `valueLabelStyle` | `.value_label_style(..)` | `StyleProp<TextStyle>` | 無 | 值那一行的樣式，覆蓋其 class。 |
| `groupLabel` | `.group_label(..)` | `keyof T \| (d: T, index: number) => string` | 無 | 每個群組的名稱，位於其橫帶中，以刪節號截斷。 |
| `groupLabelClass` | `.group_label_class(..)` | `string` | 無 | 每個群組標籤的 class，是與橫帶同大的方塊。 |
| `groupLabelStyle` | `.group_label_style(..)` | `StyleProp<TextStyle>` | 無 | 每個群組標籤的樣式，覆蓋其 class。 |
| `stagger` | `.stagger(..)` | `number`（0 到 0.95） | `0` | 頂層節點依序出現的方式：它們開始出現的時間點分散在 appear 的多少比例之內。 |
| `hoverClass` | `.hover_class(..)` | `string` | 無 | `hover` 部件的 class，即覆蓋在被 hover 節點之上、與其同大的 view（`rounded-xs outline-2 outline-foreground`）。 |
| `hoverStyle` | `.hover_style(..)` | `StyleProp<ViewStyle>` | 無 | hover 部件的樣式，覆蓋其 class。 |

矩形以 `fill` 填色（`colorScale` 的顏色，未設定時則為 `currentColor`），並以 `stroke` 描邊（未設定時為無），其自身的設定優先於 treemap 與圖表的設定，如同 CSS 的繼承。版面配置只在列、選項或圖表大小改變時重新執行，指標移動或出現動畫時絕不會重新執行；圖表大小改變不會移動任何東西。重複的 `id`、指名不到任何列的 `parent`，以及自己是自己祖先的列，會記錄一次警告：第一列保留該 id，孤立節點成為頂層節點，循環則不繪製。

## PlotAxis

`PlotAxis` 以該邊所帶比例尺的刻度標示圖表的一條邊：下邊與上邊使用 x 比例尺的刻度，左邊與右邊使用 y 比例尺的刻度，如同 d3 的 `axisBottom`、`axisTop`、`axisLeft` 與 `axisRight`。其刻度來自比例尺：在 `linear` 比例尺上為整齊的值（1、2 或 5 乘以十的冪，位於定義域內），在 `point` 或 `band` 比例尺上則為列。其標籤是由圖表的版面配置安排位置的文字，因此應用程式決定其內容與外觀，版面配置負責擺放：每個標籤沿邊緣置中於其刻度。沿下邊與上邊時，第一個與最後一個標籤只向內移動所需的距離，以保持在圖表兩端之內；在左邊與右邊旁，每個標籤都停留在其刻度上，因此讀起來屬於其格線，而當靠近端點的標籤會越過圖表的上邊或下邊時，圖表的線性 y 比例尺會從該邊向內起算相應的距離（端點處的刻度為標籤高度的一半），使每個標籤都保持在圖表之內、位於其格線上。

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

| 屬性 | Rust | 型別 | 預設值 | 說明 |
|---|---|---|---|---|
| `placement` | `.placement(..)` | `"bottom" \| "top" \| "left" \| "right"` | `"bottom"` | 它所沿著的邊：下邊與上邊帶有 x 比例尺的刻度，左邊與右邊帶有 y 比例尺的刻度。 |
| `scale` | `.scale(..)` | `"y" \| "y2"` | `"y"` | 左軸或右軸所標示的 y 比例尺：圖表的 `yScale` 或其第二個比例尺 `y2Scale`（[雙軸](#dual-axes)）。 |
| `labelPlacement` | `.label_placement(..)` | `"outside" \| "inside"` | `"outside"` | 標籤所在位置：在邊緣之外，位於應用程式留在圖表周圍的空間中，避開標記；或在圖表之上沿著邊緣，使圖表保有完整大小（在左邊或右邊旁，每個標籤位於其格線的上側）。 |
| `ticks` | `.ticks(..)` | `number` | 在 `linear` 比例尺上為 `10`（對齊的比例尺則為每一步），其他比例尺為每一列 | 大約取多少個刻度：在 `linear` 比例尺上，為定義域內約此數量的整齊值；在 `point` 或 `band` 比例尺上，為從第一列到最後一列平均分布的此數量個列。 |
| `tickValues` | `.tick_values(..)` | `number[]` | 無 | 其刻度的值，取代 `ticks`：比例尺的值，在 `point` 或 `band` 比例尺上則為列索引（`[0, 3, 6]` 標示每第三列）。位於定義域內的值各有一個刻度。 |
| `format` | `.format(..)` | `(value: number, index: number) => string` | 類別型 band 比例尺上為該 band 的類別，其他為數值，帶有刻度間距所需的小數位數，並以千分位分組 | 每個刻度的文字：由應用程式提供的函式，依其值（在 `point` 或 `band` 比例尺上為列索引）與其在該軸刻度中的索引而定。 |
| `labelClass`、`labelStyle` | `.label_class(..)`、`.label_style(..)` | `string`、`StyleProp<TextStyle>` | 無 | `label` 部件：每個刻度一段文字，其字型、顏色與 padding 由應用程式決定；朝向圖表的 padding 即其與邊緣的距離（下軸時為 `pt-2`）。 |
| `tickClass`、`tickStyle` | `.tick_class(..)`、`.tick_style(..)` | `string`、`StyleProp<ViewStyle>` | 無 | `tick` 部件：每個刻度一個位於邊緣上的 view，置中於其刻度並朝標籤延伸（下軸時為 `h-1 w-px bg-border`）；設定樣式後才會顯示。 |
| `lineClass`、`lineStyle` | `.line_class(..)`、`.line_style(..)` | `string`、`StyleProp<ViewStyle>` | 無 | `line` 部件：沿整條邊、位於標籤那一側的 view（下軸時為 `h-px bg-border`）；設定樣式後才會顯示。 |

在外側時，標籤位於圖表的邊距中，如同 d3 的軸位於圖表的邊距中：圖表保持應用程式給它的大小，而應用程式在軸那一側給它一個與標籤同深的邊距（其下的 `pt-2 text-xs` 標籤為 `mb-6`），或使用其父層在該側的 padding。同一邊上的兩條軸各自以自己的樣式標示自己的值：範圍的兩端較淡，中段較實。

`format` 在刻度或函式改變時，於下一輪對每個刻度呼叫一次，絕不會在圖表繪製或跟隨指標時呼叫：請保持其純粹（相同的值，相同的文字）。沒有它時，刻度的讀法如同 d3 所寫：`1,500`、`0.25`、`−2`。在 Rust 中，`plot_axis()` 建立一條軸，其 `format` 為 `TickFormat::from_fn(|value, index| ..)`。軸不接受指標，螢幕閱讀器讀的是圖表而非其標籤。
## PlotLabel

`PlotLabel` 會在圖表的各個點上寫出文字：峰值上方的標題、折線最後一點的標籤、格線末端的註記。它的每個 `texts` 都以圖表比例尺的值來指定所在的點，與標記（mark）相同：在 `point` 或 `band` 比例尺上是資料列的索引（取該列頻帶的中間），在 `linear` 比例尺上則是一個數值。文字的上緣位於該點上，其 `align` 決定文字從該點開始、以該點為中心，或在該點結束。文字由圖表的版面配置放置，因此會隨圖表大小而變化；它們會隨比例尺的定義域滑動（`motion.update`），並在出現動畫時淡入。

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

| Prop | Rust | Type | Default | Description |
|---|---|---|---|---|
| `texts` | `.texts(..)` | `PlotText[]` | `[]` | 它所寫出的文字，每段文字各在自己的點上。 |
| `scale` | `.scale(..)` | `"y" \| "y2"` | `"y"` | 其文字的 `y` 所對應的 y 比例尺（[Dual axes](#dual-axes)）。 |

每段文字是一個 `PlotText`：

| Field | Type | Default | Description |
|---|---|---|---|
| `text` | `string` | | 要顯示的內容。 |
| `x` | `number` | | 沿 x 軸的位置：x 比例尺的一個值，或在 `point` 或 `band` 比例尺上的資料列索引（`0.5` 位於前兩列的正中間）。 |
| `y` | `number` | | 其上緣沿 y 軸的位置：y 比例尺的一個值。 |
| `align` | `"left" \| "center" \| "right"` | `"left"` | 文字沿 x 方向相對於該點的位置：從該點開始、以該點為中心，或在該點結束。 |
| `class`, `style` | `string`, `StyleProp<TextStyle>` | none | 文字自己的 class 與樣式，優先於從標籤繼承而來的設定：其方框（標籤的背景與內距）以及與該點的距離。 |

外觀由應用程式決定：標籤的 `class` 為每段文字提供其繼承的文字樣式（字型、大小、顏色），而每段文字自己的 `class` 與 `style` 則只為它單獨設定樣式。文字可用 `-translate-y-full` 放在其點的上方，其內距即是與該點的間距（`pb-1`）；位於折線最後一點旁的標籤，會放在應用程式在該側保留的邊距中（`mr-12`），就像座標軸的標籤一樣。在 Rust 中，`plot_label()` 會建立一個標籤，每段文字是一個帶有 `.align(PlotTextAlign::Center)`、`.class(..)` 與 `.style(..)` 的 `PlotText::new(text, x, y)`。指標會穿過這些文字傳到圖表上，螢幕閱讀器讀出的是圖表本身，其 `accessibilityLabel` 會說明這些文字所指出的內容。

## Motion

動態由應用程式決定，預設為無動態：所有內容會立即顯示。`motion` 接受 [`nsh`](../modules/nsh.md#animation) 的各項計時（`{ duration, easing, delay }` 與 `{ stiffness, damping, mass }`）：

| Key | Type | What moves |
|---|---|---|
| `appear` | timing | 標記以 `appearGeneration` 繪入：折線與面積圖從前緣開始，長條從基底長出（搭配長條的 `stagger` 依序出現）；圓點從無到有長出（搭配圓點的 `stagger` 依序出現）；儲存格從中心長出（搭配儲存格的 `stagger` 依序出現）；圓餅圖與弧形圖的環從起點開始順時針掃入；放射狀折線從其內半徑長出，圓點隨之出現；桑基圖的節點與絲帶從前緣開始，其標籤淡入。 |
| `update` | timing | 當應用程式改變形狀時，標記會移動到新的形狀：圓點移到新的值與大小，新資料列的圓點長出、已移除資料列的圓點縮小消失；儲存格變為新的顏色（以 OKLab 混色）與頻帶，新資料列的儲存格長出、已移除資料列的儲存格縮小消失；圓餅圖與弧形圖的半徑（因此環形圖的中央孔洞會張開與閉合）以及它們的角度（因此儀表或扇形會旋轉到新的值；d3 的 `arcTween`：移動的是角度，而不是輪廓；新的扇形從前一個扇形結束的位置展開；在移動途中發生的變更，會從目前繪製的位置繼續）；放射狀折線的各點移到新的值、角度與半徑（新資料列從內半徑長出），放射狀格線的環隨之移動；以及線性比例尺的定義域（應用程式的 `domain`，或隨資料列到來而取得的標記值範圍）會從舊值滑動到新值，標記、格線、`PlotAxis` 與 `PlotLabel` 隨之移動；還有桑基圖的節點、絲帶與標籤，會從舊的流量版面配置移動到新的，在移動途中發生的變更會從目前繪製的位置繼續。 |
| `enter` | timing | 當指標移到圖表上時，懸停的各部分淡入。 |
| `exit` | timing | 指標離開後，它們淡出。 |
| `pointer` | spring | 當按鍵或螢幕閱讀器逐步移動懸停位置時，它們會從一列滑動到下一列；圓餅圖的扇形會因此升起。 |

懸停的各部分會在同一個影格內跟隨指標：指標移動時，十字線、圓點與工具提示會立即出現在指標下的資料列上，因此能緊跟手的移動，而它們的淡入與淡出（`enter`、`exit`）仍然會播放動畫。

動態在平台的動畫器上執行，每個影格都不需要 JS，並且對要求減少動態的使用者會立即完成。由列表為重新出現的資料列再次建立的圖表會再次繪入，除非列表外圍的 [`PlotAppearScope`](#plotappearscope) 已看到它的出現動畫完成。

定義域的移動方式與 d3 轉場比例尺定義域相同：中間狀態的比例尺會放置每個值，因此標記保持其形狀，格線與懸停的各部分隨之移動，長條保持其圓角，隨新定義域進來的資料列也與其他部分一起移動。即時圖表若不時依資料列調整其 y 比例尺（保留一些空間，讓格線在兩次調整之間保持不動），則會以 `update` 計時滑動到每一次新的調整結果。當圖表大小改變時，標記會立即採用新的大小。

這是圖表自己的動態，也就是圖表中會移動之物的計時：其標記的裁切與懸停的各部分。檢視的進場、退場與引人注意的動畫，則是 [`createMotion`](../modules/nsh.md#createmotion) 的預設集與關鍵影格，應用程式仍可將它們套用在圖表的檢視或其周圍的元素上。

## PlotAppearScope

每當資料列重新進入視野，列表就會再次建立該列的圖表，因此帶有出現動畫的迷你折線圖，在列表捲回它時都會重新繪入。列表外圍的 `PlotAppearScope` 會記住其中已完成的出現動畫：在其中再次建立且 `appearGeneration` 已完成的圖表，會立即完整顯示其標記。圖表是以其世代（generation）來記憶的，因此每一列的圖表都有自己的世代，也就是該列的 key，加上任何應讓它重播的內容（`` `${symbol} ${period}` ``）。

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

| Prop | Rust | Type | Default | Description |
|---|---|---|---|---|
| `id` | `.id(..)` | `number \| string` | none | 範圍所針對記憶的對象：當它改變時，範圍會遺忘，其中的圖表會在原地重新繪入。請依內容命名，例如監看清單或對話；若未提供，範圍會在其顯示期間持續記憶。 |
| `children` | `.child(..)` | `JSX.Element` | none | 它所容納的內容：列表，或隨圖表出現與消失而再次建立圖表的任何內容。 |

新的世代仍會讓圖表繪入，在出現動畫完成前就被移除的圖表也一樣，並且從頭開始。一旦圖表完成了新的世代，其範圍就會遺忘前一個世代，因此切換回較早的期間時，圖表會再次繪入。記憶隨範圍而存在：不再顯示的範圍，或帶有新的 `id` 的範圍，會讓其圖表重新繪入，而圖表會記憶在其外圍最內層的範圍中。其外觀由應用程式決定：`class` 與 `style` 會像任何檢視一樣為它配置版面（`flex-1` 用於填滿畫面的列表外圍）。在 Rust 中，`plot_appear_scope()` 會建立一個範圍。

## Keyboard

互動式圖表是 Tab 鍵的停駐點（macOS、web），當它取得鍵盤焦點時，其按鍵會移動與指標相同的懸停：十字線、圓點與工具提示以 `pointer` spring 滑動，圓餅圖的扇形升起，`onHoverChange` 回報該資料列，螢幕閱讀器則讀出應用程式為它提供的 `accessibilityValue`。其焦點環由應用程式決定：`focus-visible:` class 或 `focusStyle`（`focus-visible:outline-2 focus-visible:outline-ring`）。

| Keys | What they do |
|---|---|
| Right, Left | 移到該側的資料列：下一列或上一列，在反向的 x 比例尺上則相反，其第一列在右側（在圓餅圖上為依資料列順序排列的扇形；在桑基圖上為其節點；在樹狀圖上為螢幕上相鄰的葉節點，Up 與 Down 的行為亦同）；在沒有任何資料列被懸停時，Right 從最左端的資料列開始，Left 從最右端的資料列開始（在圓餅圖上則分別是第一個與最後一個扇形）。 |
| Home, End | 移到第一列或最後一列。 |
| Up, Down | 在儲存格上：移到同一欄中上方或下方的儲存格。在儲存格上，按鍵會依螢幕上的格線移動（WAI-ARIA 的 data grid）：Right 與 Left 移到沿該行的下一個儲存格，Home 與 End 移到該行的第一個與最後一個儲存格；在沒有任何儲存格被懸停時，第一次按鍵從左上角的儲存格開始（Left、Up 與 End 則從右下角的儲存格開始）。到達邊緣時，懸停會停留在原處。 |
| Escape | 清除懸停。 |

圖表在取得焦點時回應其按鍵，並在有資料列被懸停時回應 Escape；其餘時候，按鍵會交給應用程式及其周圍的檢視。將焦點移開會清除由按鍵造成的懸停。圖表不接收按壓，因此位於可按壓卡片內的圖表會把按壓留給卡片。螢幕閱讀器同樣可以逐列瀏覽：VoiceOver 的上下滑動、TalkBack 的向前與向後捲動，以及每個提供元素的 `increment` 與 `decrement` 動作的螢幕閱讀器，都會移到下一列與上一列，在反向比例尺上也是依資料列的順序。

## Building charts

圖表由一個圖表區、其標記、其座標軸，以及圍繞它們的應用程式自有元素組成。為 y 比例尺指定 `domain`，並讓其座標軸使用格線的值（`tickValues`）：每個標籤便會位於其格線上。懸停的十字線、圓點與工具提示是圖表的一部分，由應用程式設定樣式並填入內容；資料列的值則放在應用程式顯示它們的地方。

格線最適合使用實線細線，並搭配較明顯的基線，這樣虛線就可以用來表示參考值（如下方的開盤價）。面積圖以朝基線逐漸淡出的淡色漸層呈現，比平坦的填色更輕盈易讀。每個數列的懸停圓點採用該數列的顏色，並以圖表所在表面的顏色作為其外環，使它從線條中凸顯出來；工具提示位於圖表區的頂端，在第一列與最後一列時則保持在邊緣之內：在最高值上方留有空間的 `domain` 能讓它遠離線條。

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

長條圖最適合讓長條的頂端為圓角、底部為直角（`cornerRadii={{ topLeft: 4,
topRight: 4 }}`; in a stack only on its top bar), a hair of room between the bars of a band (`groupPadding`），懸停某一列時讓其他列的長條變淡（`inactiveOpacity`）並為該列的頻帶著色（`crossLineClass`），並在長條上方以小型等寬數字顯示數值，堆疊圖則在堆疊上方顯示總計。當 `paddingOuter` 為 `paddingInner` 的一半時，各頻帶的中間會落在等距的位置，而 `PlotAxis` 會讓每個月份置中於其頻帶下方；在寬卡片中，`maxBandWidth` 可讓少數長條保持較窄。

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

列表資料列中的迷你折線圖是帶有 `interactive={false}` 的圖表：它只繪製其標記，不追蹤任何指標。

## Accessibility

- 對螢幕閱讀器而言，圖表是單一元素，具有 image 角色與應用程式提供的 `accessibilityLabel`；其標記、座標軸的標籤、`PlotLabel` 以及懸停的各部分都是它的一部分，本身不會發出任何朗讀。請在標籤中說明圖表顯示的內容與突出之處（範圍、最高值），並為 `accessibilityValue` 提供指標下資料列的描述文字，讓螢幕閱讀器在值改變時能朗讀出來。
- 在有指標的平台（桌面、web、搭配觸控板的 iPad）上，指標下的資料列會以 `onHoverChange` 回報。觸控螢幕不會回報懸停：請在應用程式自己的元素中顯示觸控使用者所需的值，或在數字重要的地方以文字或列表的形式提供各資料列。
- 在圓餅圖上，回報的資料列是指標下的扇形：請為 `accessibilityValue` 提供其名稱、值與占比（`"Team, 340 seats, 34.0%"`），並在標籤中說明總計與最大的占比。在雷達圖上，回報的是最接近指標的軸：請提供該軸的名稱以及各數列在該處的值。
- 互動式圖表是鍵盤焦點的停駐點，其方向鍵會移動懸停（[Keyboard](#keyboard)），並向螢幕閱讀器提供 `increment` 與 `decrement` 以逐列瀏覽（VoiceOver 會將它讀作可調整項目）；帶有 `interactive={false}` 的圖表兩者皆非，且無論如何都不接收按壓。

關於標籤與角色的一般說明，請參閱 [Accessibility](../docs/accessibility.md)。
<a id="platform-notes"></a>

## 平台說明

- 每個平台都以相同方式繪製標記：每個標記的繪製內容由 Rust 記錄一次；資料列變更時，讀取這些資料列的標記會在同一批次中重新繪製；而繪製類別（外觀，`dark:`）變更時，會重新送出繪製內容而不重新記錄。
- 出現動畫以平台動畫器移動的數值來裁切折線與區域，並使長條增長；長條從被懸停的資料列逐漸淡出，是動畫器依懸停位置計算出的不透明度；懸停的各個部分是由動畫器移動與淡入淡出的檢視，且動畫器會依繪圖區的大小與工具提示的大小，將工具提示保持在繪圖區內。
- 區域的背景繪製於其專屬的畫布中，並裁切成區域的形狀，使用的漸層與平台為檢視的 `bg-linear-*` 所繪製的漸層相同；其類別（外觀，`dark:`）變更時，會重新送出繪製內容而不重新記錄。
- 圓餅圖將每個扇形繪製於各自的畫布中；指標下方的扇形由 Rust 依各扇形的角度與半徑找出，其凸起是半徑，其他扇形的淡出是不透明度，兩者都由動畫器移動；出現動畫的掃動也以同樣方式移動各扇形的角度，因此兩者都不會重新記錄繪製內容。
- 放射狀折線中，指標下方的資料列由 Rust 依各點的角度找出；其懸停圓點是由動畫器放置在指標下方資料列上的檢視（隨著按鍵步進，以 `pointer` 彈簧動畫滑動）；而在出現或移動到新值時，其各點是動畫器從原位置開始移動的數值，因此每次變更只會記錄一次折線。
- 點標記繪製於單一畫布中；指標下方的圓點由 Rust 依各圓點的中心與半徑找出，其懸停圓點是由動畫器放置在該圓點上、且大小與其相同的檢視；出現時的增長、變更時的移動，以及懸停的淡出，都是由動畫器移動的數值，因此每次變更只會記錄一次圓點。
- 儲存格標記繪製於單一畫布中；指標下方的儲存格由 Rust 依各儲存格的方框找出，其懸停儲存格是由動畫器放置在該儲存格上的檢視；增長、變更時的顏色與移動，以及懸停的淡出，都是由動畫器移動的數值，因此每次變更只會記錄一次儲存格。每個標籤都是平台的文字，僅在其排版後的大小能容納於儲存格內時才會顯示。
- 座標軸的標籤、刻度記號與軸線，是平台自有的文字與檢視，由 Rust 的版面配置依繪圖區的大小與比例尺放置：繪圖區大小變更時，它們會隨標記一起移動，而新的定義域會重新寫入標籤。
