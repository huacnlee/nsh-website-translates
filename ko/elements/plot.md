---
title: "Plot"
description: "nsh/base/plot의 Plot 컴포넌트, 그리고 마크인 Line, Area, Bar, Rule, Dot, Cell, Grid, Pie, Arc, RadialLine, RadialGrid, Sankey, Treemap과 PlotAxis, PlotLabel: 앱의 행(row)으로부터 네이티브로 그려지는 차트로, 축의 스케일과 레이블, 데이터 포인트의 텍스트, 포인터 아래에 있는 행, 셀 또는 슬라이스, 모션을 지원하며 자체적인 외형은 없습니다."
group: base
demo: el-plot
source_hash: 2aca4d23862b455b
---


# Plot

플롯은 차트의 틀입니다. 플롯은 표시할 데이터 행, x축과 y축의 스케일, 그 위의 포인터와 포인터의 움직임을 담당합니다. 마크는 플롯이 가진 데이터를 그립니다. 계열을 지나는 `Line`, 계열과 기준선 사이의 `Area`, 밴드 스케일의 밴드마다 행당 하나씩 그리는 `Bar`, 시작에서 끝까지 행당 하나씩 그리는 `Rule`(캔들의 심지), 행의 두 값이 만나는 지점에 행당 하나씩 그리는 `Dot`(산점도의 점, 버블 차트의 버블), 두 범주의 밴드에서 행당 하나씩 그리고 값에 따라 색을 칠하는 `Cell`(히트맵), 가로지르는 선들의 `Grid`, 행의 비율을 나타내는 `Pie`(가운데가 빈 도넛), 두 각도 사이의 `Arc`, 중심 주위에 그리며 뒤에 `RadialGrid`의 링과 스포크가 놓이는 `RadialLine`(레이더), 행 사이 흐름을 나타내는 `Sankey`, 중첩된 사각형으로 이루어지고 각 리프의 면적이 값이 되는 `Treemap`(마켓 맵)이 있습니다. `PlotAxis`는 스케일의 눈금으로 가장자리에 레이블을 달고, `PlotLabel`는 스케일 위의 지점에 텍스트를 씁니다. 각 마크는 플롯을 가득 채우는 하나의 캔버스이며 행에서 네이티브로 그려집니다. 앱의 행은 설정할 때 한 번 읽힌 뒤 Rust에서 스케일링, 기록, 그리기가 이루어지므로, 점이 천 개인 차트도 점마다 JS를 실행하지 않습니다. 포인터 추적도 Rust에서 이루어집니다. 호버의 십자선, 점, 툴팁은 플랫폼의 애니메이터로 움직이고 페이드되며, 앱은 새 행에 대한 알림만 받습니다. 겉모습은 앱이 정합니다. 마크는 SVG 도형의 CSS 페인트 프로퍼티(`stroke-*`, `fill-*`)로 칠해지고, 아무것도 설정되지 않은 곳에는 `currentColor`이 쓰이며, 영역이나 막대는 도형 안쪽에 배경(그라디언트, `bg-linear-*`)을 표시합니다. 호버의 구성 요소(각 마크의 점 포함)와 축의 레이블, 눈금, 선은 앱이 직접 스타일을 지정하고 채웁니다.

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

`Plot`, `Line`, `Area`, `Bar`, `Rule`, `Dot`, `Cell`, `Grid`, `Pie`, `Arc`, `RadialLine`, `RadialGrid`, `Sankey`, `Treemap`, `PlotAxis`, `PlotLabel`는 `nsh/base/plot`에서 가져옵니다. 이는 [`nsh/base`](../modules/nsh-base.md)의 독립된 모듈입니다(Rust에서는 `nsh_base::plot`). TypeScript에서 플롯의 prop은 행의 타입에 대해 제네릭이므로, 필드 이름은 그 타입에 맞춰 검사되고 행을 받는 함수는 행의 타입을 받습니다. Rust에서는 `plot()`가 prop마다 setter를 갖춘 플롯을 만들며, 행은 `Rows`(키별 숫자 열), 값은 `RowAccessor`(키 또는 행 인덱스의 함수)이고, 마크는 타입이 지정된 페인트 메서드(`.stroke_color(..)`, `.fill_color(..)`, `.stroke_width(..)`)를 사용합니다.

## Plot

| Prop | Rust | 타입 | 기본값 | 설명 |
|---|---|---|---|---|
| `data` | `.data(..)` | `T[]` | (필수) | 행이며, 점당 객체 하나입니다. 마크는 앱이 행을 설정할 때 값을 한 번 읽으며, 값이 없는 행(숫자가 아닌 필드, `null`)은 건너뜁니다. |
| `x` | `.x(..)` | `keyof T \| (d: T, index: number) => number` | 행의 인덱스 | `linear` x 스케일에서 행을 x축 위에 배치하는 값입니다. `point` 스케일은 행을 순서대로 배치합니다. |
| `y` | `.y(..)` | `keyof T \| (d: T, index: number) => number` | 없음 | 마크가 자체 값을 지정하지 않을 때 그리는 값입니다. |
| `xScale` | `.x_scale(..)` | `Scale` | `{ type: "point" }` | x축이 행을 배치하는 방식입니다. `point`(순서대로, 왼쪽 가장자리에서 오른쪽 가장자리까지 균등하게, 행이 하나이면 가운데), 선택적 `domain`가 있는 `linear`, 또는 `band`(막대용으로 행당 밴드 하나, [Bar](#bar), 또는 셀용으로 범주당 밴드 하나, [Cell](#cell))입니다. y 스케일이 `band`이면 기본값은 가로 막대를 위한 `linear`입니다. `reverse: true`는 오른쪽 가장자리에서부터 배치합니다([뒤집힌 스케일](#reversed-scales)). |
| `yScale` | `.y_scale(..)` | `Scale` | `{ type: "linear" }` | y축이 값을 배치하는 방식입니다. 도메인의 최솟값이 아래쪽 가장자리, 최댓값이 위쪽에 놓입니다. `domain`가 없으면 마크가 그리는 값의 범위를 사용합니다. `band`는 가로 막대를 위해 행마다 밴드 하나를 위쪽 가장자리에서 아래로 배치합니다. `reverse: true`는 반대로 배치합니다. 최솟값이 위쪽 가장자리에 놓이고 행은 아래쪽 가장자리에서 위로 나열됩니다([뒤집힌 스케일](#reversed-scales)). |
| `y2Scale` | `.y2_scale(..)` | `LinearScale` | 없음 | 이를 지정하는 마크(`scale="y2"`)를 위한 두 번째 y 스케일 `{ type: "linear", domain?, reverse? }`입니다. 이중 축 차트의 오른쪽 스케일입니다([이중 축](#dual-axes)). `domain`가 없으면 그 스케일에 놓인 값의 범위를 사용합니다. |
| `alignTicks` | `.align_ticks(..)` | `boolean` | `true` | 어느 y 스케일도 도메인을 지정하지 않고 양쪽 모두에 마크가 있으면, 두 스케일을 같은 간격의 깔끔한 단계로 넓혀 눈금이 같은 선에 놓이게 합니다([이중 축](#dual-axes)). `false`는 각 스케일을 자기 값의 범위로 유지합니다. |
| `interactive` | `.interactive(..)` | `boolean` | `true` | 플롯은 포인터와 키보드를 따라갑니다. 그 아래의 행을 알리고 호버의 구성 요소를 표시하며, Tab 정지점이 되어 방향키로 호버를 움직입니다([키보드](#keyboard)). `false`는 마크만 그리며(목록 안의 스파크라인), 플롯에 대한 누르기는 주변의 뷰로 전달됩니다. 플롯이 키보드를 지원할지 여부는 플롯을 만들 때 정해집니다. |
| `motion` | `.motion(..)` | `PlotMotion` | 없음 | 등장 애니메이션의 타이밍, 호버의 페이드 인/아웃, 키로 호버를 움직일 때 호버가 미끄러지듯 이동하는 스프링을 설정합니다(아래 참조). |
| `appearGeneration` | `.appear_generation(..)` | `number \| string` | 없음 | 등장 애니메이션을 사용하도록 설정합니다. 플롯이 처음 표시될 때 마크가 그려지며, 이 값이 바뀔 때마다(다른 심볼, 다른 기간) 다시 그려집니다. [`PlotAppearScope`](#plotappearscope) 안에서는 그곳에서 이미 끝난 세대가 한 번에 전부 표시됩니다. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 없음 | 스크린 리더가 차트에 대해 읽어 주는 내용입니다. 차트가 무엇을 보여 주는지, 무엇이 눈에 띄는지를 담습니다. |
| `accessibilityValue` | `.accessibility_value(..)` | `{ min?, max?, now?, text? }` | 없음 | 스크린 리더가 값으로 듣게 되는 내용입니다. 포인터 아래의 행에 대한 앱의 설명입니다. |
| `crossLineClass`, `crossLineStyle` | `.cross_line_class(..)`, `.cross_line_style(..)` | `string`, `StyleProp<ViewStyle>` | 없음 | 십자선입니다. 플롯만큼 높은 뷰이며 포인터 아래의 행을 중심으로 놓입니다. 밴드 스케일에서는 행의 밴드 안에 밴드 너비만큼 넓게 놓입니다(y 스케일이 밴드이면 플롯을 가로질러 놓입니다). |
| `dotClass`, `dotStyle` | `.dot_class(..)`, `.dot_style(..)` | `string`, `StyleProp<ViewStyle>` | 없음 | 호버의 점입니다. `Line`, `Area`, `RadialLine`마다 하나의 뷰가 포인터 아래 행의 해당 지점을 중심으로 놓이며, `Dot`의 뷰는 포인터 아래에서 그 점만큼 큽니다. 마크의 `hoverDotClass` / `hoverDotStyle`는 해당 마크의 점에 대해 이를 대체합니다. |
| `tooltipContent` | `.tooltip_content(..)` | `JSX.Element` | 없음 | 앱의 툴팁입니다. `tooltipPlacement`에 따라 배치되며 십자선과 함께 움직이고 페이드됩니다. |
| `tooltipPlacement` | `.tooltip_placement(..)` | `"top" \| "pointer"` | `"top"` | 툴팁이 놓이는 위치입니다. 플롯의 위쪽에서 십자선을 중심으로 놓이거나, 포인터 옆에서 십자선을 기준으로 플롯의 가운데 쪽에, 위쪽 절반에서는 포인터 아래에, 아래쪽 절반에서는 포인터 위에 놓입니다. 위쪽에 놓일 때는 플롯의 왼쪽과 오른쪽 가장자리 사이에 머뭅니다(위쪽 가장자리로부터의 오프셋은 앱이 정합니다. 플롯 아래의 태그는 플롯의 높이에 그 이상을 더한 만큼 차지합니다). 포인터 옆에 놓일 때는 플롯 안에 머뭅니다. 키보드를 사용하면 해당 행에서 첫 번째 선 또는 영역의 점 옆에 놓입니다(막대는 밴드의 가운데, 파이는 슬라이스의 가운데). |
| `tooltipOffset` | `.tooltip_offset(..)` | `number` | `0` | 툴팁과 그 위치의 기준 사이의 거리입니다. `"top"`에서는 위쪽 가장자리, `"pointer"`에서는 십자선과 포인터가 기준입니다. |
| `colorScale` | `.color_scale(..)` | `ColorScale` | 없음 | 마크의 색상입니다. `color`가 읽는 범주에 대해서는 d3의 `scaleOrdinal`처럼(`{ type: "ordinal", domain?, range, unknown? }`, [범주별 색상](#colors-by-category)), `Cell`의 `value`가 읽는 숫자에 대해서는 램프를 따라 d3의 `scaleSequential`와 `scaleDiverging`처럼 정합니다(`{ type: "sequential" \| "diverging", … }`, [램프를 따르는 색상](#colors-along-a-ramp)). |
| `children` | `.child(..)` | `JSX.Element` | 없음 | 순서대로 서로 겹쳐 그려지는 마크와 앱이 그 위에 올리는 모든 것입니다. |
| `class`, `style` | 스타일 메서드 | `string`, `StyleProp<ViewStyle>` | 없음 | 플롯의 크기와 모양입니다. 마크는 CSS가 상속하듯 플롯의 페인트 프로퍼티를 상속합니다. `focus:` / `focus-visible:` 클래스와 `focusStyle`가 포커스 링을 그립니다. |

| 이벤트 | Rust | 페이로드 | 발생 시점 |
|---|---|---|---|
| `onHoverChange` | `.on_hover_change(..)` | `{ index: number \| null }` | 포인터가 다른 행 위로 올라왔을 때입니다. 페이로드는 x축 방향으로 포인터에 가장 가까운 행의 인덱스(y축에만 밴드가 있으면 y축 방향), 그 아래에 있는 [pie](#pie-and-arc)의 슬라이스, 중심이 포인터에 가장 가까운 [dot](#dot), 그 아래에 있는 [cell](#cell)(두 셀 사이의 틈에서는 더 가까운 셀), 또는 각도 기준으로 포인터에 가장 가까운 [radial line](#radialline-and-radialgrid)의 행입니다. 포인터가 플롯을 벗어나면 `null`입니다(파이 위에서는 슬라이스를, 방사형 선 위에서는 바깥 반지름을 벗어났을 때). |

`Scale`은 `{ type: "point"; reverse? } | { type: "linear"; domain?: [number, number]; reverse? } | { type: "band";
domain?: string[]; paddingInner?; paddingOuter?; maxBandWidth?; bandCount?; groupPadding?; reverse? }`. A `linear` 스케일의 `domain`은 두 값의 범위이며, 순서는 어느 쪽이든 상관없습니다. 값이 하나인 도메인은 그 값을 가운데에 놓습니다. `band` 스케일의 `domain`은 밴드의 범주를 순서대로 나열한 것입니다([Cell](#cell)). 그 밖의 옵션은 [Bar](#bar)에 있습니다.

행의 함수(`y={(d) => d.high - d.low}`)는 행 또는 함수가 바뀔 때 행마다 한 번, 다음 턴에 호출되며, 플롯이 그리는 도중이나 포인터를 따라가는 도중에는 호출되지 않습니다. 순수하게 유지하세요(같은 행이면 같은 숫자). 필드 이름은 JS를 전혀 거치지 않고 읽습니다.

<a id="reversed-scales"></a>

### 뒤집힌 스케일

`reverse: true`는 스케일을 반대쪽 가장자리에서부터 배치하며, visx의 스케일이 `reverse`를 받고 d3의 스케일이 거꾸로 쓴 range를 받는 것과 같습니다. x축에서는 첫 번째 행 또는 도메인의 최솟값이 오른쪽 가장자리에 놓이고, y축에서는 도메인의 최솟값이 위쪽 가장자리에 놓이며 행이 아래쪽 가장자리에서 위로 나열됩니다. 스케일 위에 놓이는 모든 것이 이를 따릅니다. 마크, 막대의 기준과 자라는 방향, 영역의 기준선, 격자선, `PlotAxis` 눈금, 호버가 찾는 행, 방향키([키보드](#keyboard)), 새 도메인으로의 이동이 해당합니다. 뒤집힌 `linear` y 스케일에서는 막대가 위쪽 가장자리에서 매달리고, 뒤집힌 `linear` x 스케일에서는 가로 막대가 오른쪽 가장자리에서 왼쪽으로 자랍니다.

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

플롯의 등장 애니메이션에서 선과 영역은 x 스케일이 시작하는 가장자리에서부터 그려지며, 스케일이 뒤집혀 있으면 오른쪽 가장자리에서 시작합니다.

<a id="dual-axes"></a>

### 이중 축

<!-- demo: el-plot-dual -->

플롯에는 단위가 다른 값을 위한 두 번째 y 스케일이 있습니다. 가격 옆의 거래량, 마진 옆의 매출 같은 경우입니다. y를 따라 값을 배치하는 모든 구성 요소는 `scale`를 받습니다. `"y"`(기본값이며 플롯의 `yScale`) 또는 `"y2"`(플롯의 `y2Scale`)입니다. 오른쪽의 `PlotAxis`에 `scale="y2"`를 지정하면 레이블이 붙습니다.

```tsx
<Plot data={days} xScale={{ type: "band", paddingInner: 0.3 }} class="mx-10 mb-6 h-44">
  <Grid class="stroke-border" />
  <Bar value="volume" class="fill-chart-2/50" />
  <Line y="close" scale="y2" class="stroke-chart-1 stroke-2" />
  <PlotAxis placement="left" format={(v) => `${v}M`} labelClass="pr-2 text-xs text-muted-foreground" />
  <PlotAxis placement="right" scale="y2" labelClass="pl-2 text-xs text-muted-foreground" />
</Plot>
```

각 스케일의 도메인은 독립적입니다. 앱의 `domain` 또는 그 스케일에 놓인 값의 범위이며, 각각 `motion.update`로 새 도메인으로 이동합니다. 어느 스케일도 도메인을 지정하지 않으면 플롯은 두 스케일을 같은 수의 깔끔한 단계(10의 거듭제곱의 1, 2 또는 5배이며, 높이 약 32포인트마다 한 단계)로 배치합니다. 둘 다 0을 포함하면 0이 두 스케일에서 같은 선에 놓입니다. 그렇지 않으면 0에서 시작하는 스케일(거래량)은 추가 단계를 위쪽으로 얻고, 다른 스케일(가격)은 양쪽으로 얻습니다. 축의 눈금은 이 단계들이며, `x`도 `y`도 없는 `Grid`는 이 눈금 위치에 선을 그리므로 하나의 격자가 두 축 모두에 쓰입니다. `alignTicks={false}`는 이 동작을 끕니다. 앱이 지정한 `domain`는 두 스케일을 있는 그대로 둡니다.

호버는 하나의 행을 찾고, 각 마크의 점은 자신의 스케일에 놓이며, 표시 내용은 앱이 정합니다. 앱은 `onHoverChange`가 알리는 행의 두 값을 모두 읽습니다. 두 스케일의 막대는 각 밴드 안에 나란히 서며, `stack`은 자신의 스케일에 있는 막대만 쌓습니다. `y2Scale`는 선형입니다. y축에 밴드가 있는 플롯에는 두 번째 y 스케일이 없습니다.
<a id="line-area-and-grid"></a>

## Line, Area 및 Grid

| Mark | Prop | 타입 | 기본값 | 설명 |
|---|---|---|---|---|
| `Line` | `y` | `string \| (d, index) => number` | plot의 `y` | 그리는 대상: 값이 있는 행마다 점 하나를 그리며, 값이 없는 행은 건너뜁니다. |
| `Line`, `Area` | `data`, `x` | `T[]`, `string \| (d, index) => number` | plot의 행 | 자체 series의 행(다른 x 값)으로, 자체 `x`에 따라 plot의 scale 위에 배치됩니다(없으면 행의 index). |
| `Line`, `Area` | `curve` | `"natural" \| "linear" \| "stepAfter"` | `"natural"` | 점을 잇는 방식: 부드러운 곡선, 직선 구간, 또는 다음 행까지 각 값을 유지하는 계단형. area의 아래쪽 가장자리도 같은 곡선을 따릅니다. |
| `Line` | `dot`, `dotClass`, `dotStyle` | `boolean`, `string`, `StyleProp<ViewStyle>` | `false` | 모든 점 위에 놓이는 dot: 점을 중심으로 배치되는 view이며, 크기·배경·테두리는 앱이 정합니다. |
| `Line`, `Area` | `hoverDotClass`, `hoverDotStyle` | `string`, `StyleProp<ViewStyle>` | plot의 `dotClass`, `dotStyle` | 포인터 아래 행의 점 위에 나타나는 hover dot: 각 series의 dot이 자신의 색으로 표시됩니다. 각각 이 mark에 한해 plot의 것을 대체합니다(plot의 크기와 링 위에 mark의 색이 적용됨). (`hidden` 사용 시 표시 안 함) |
| `Area` | `backgroundClass`, `backgroundStyle` | `string`, `StyleProp<ViewStyle>` | 없음 | 배경: 도형을 둘러싸는 상자(첫 점에서 마지막 점까지, 가장 높은 점에서 baseline까지, band에서는 아래쪽 가장자리의 가장 낮은 점까지)이며, 그 배경(`bg-*`, `bg-linear-to-b from-… to-…`, `backgroundImage`)은 도형 안쪽에만 `fill` 아래에 표시됩니다. 배경이 있으면 따로 설정하지 않은 `fill`의 기본값은 다음과 같습니다: `none`. |
| `Area` | `y1` | `string \| (d, index) => number` | plot의 `y` | 위쪽 가장자리를 이루는 값. |
| `Area` | `y0` | `number \| string \| (d, index) => number` | y scale의 낮은 쪽 가장자리 | 아래쪽 가장자리: 숫자는 y scale의 baseline이고, field나 함수는 각 행에 고유한 아래쪽 값을 주어 area를 band로 만듭니다(하루의 최저값에서 최고값까지, 예보 범위). 지정하지 않으면 area는 y scale의 가장 작은 값이 있는 가장자리로 닫힙니다. 즉 아래쪽 가장자리이며, 반전된 scale에서는 위쪽 가장자리입니다(위에서 늘어진 area). 어느 한쪽 가장자리에 값이 없는 행은 건너뜁니다. |
| `Line`, `Area`, `Grid` | `scale` | `"y" \| "y2"` | `"y"` | 값이 따라가는 y scale: plot의 `yScale` 또는 두 번째 scale인 `y2Scale` ([이중 축](#dual-axes)). |
| `Grid` | `x` | `number[]` | 없음 | 세로선이 놓이는 위치로, x scale의 값입니다(`point` scale에서는 행의 index). |
| `Grid` | `y` | `number[]` | 없음 | 가로선이 놓이는 위치로, y scale의 값입니다. `x`, `y` 둘 다 없으면 선은 해당 scale의 tick을 따릅니다. `ticks` 없는 `PlotAxis`의 선 위치와 같습니다(가로 막대에서는 x를 따라). |
| `Grid` | `ticks` | `number` | axis의 기본값 | `x`, `y` 둘 다 없을 때 그리는 선의 대략적인 개수로, `PlotAxis`의 `ticks`처럼 해석됩니다. |
| `Line`, `Area` | `color` | `string \| (d, index) => string` | 없음 | 행의 카테고리로, 색은 plot의 `colorScale`에서 가져옵니다. 다른 설정이 없으면 첫 번째 행의 카테고리로 line의 `stroke`(area는 `fill`) 값이 결정됩니다([카테고리별 색상](#colors-by-category)). |

각 mark는 plot을 채우며 [SVG paint 속성](../modules/style-reference.md#svg-paint)으로 그립니다. CSS 상속처럼 mark 자체의 속성이
plot의 속성보다 우선합니다:

| Mark | 그리는 속성 | 설정이 없을 때 |
|---|---|---|
| `Line` | `stroke`, `strokeWidth`, `strokeDasharray` | `currentColor`, 너비 1, 실선 |
| `Area` | `fill`(`background` 부분에 적용); 위쪽 가장자리는 `stroke`, `strokeWidth`, `strokeDasharray` | `fill` `currentColor`(배경과 함께 쓰면 `none`); stroke 없음 |
| `Grid` | `stroke`, `strokeWidth`, `strokeDasharray` | `currentColor`, 너비 1, 실선; 각 선은 device 픽셀 단위에 맞춰 그려지므로 가는 선도 선명하게 유지됩니다 |

plot에 domain이 없으면 `Line`, `Area` mark가 그리는 값과 area의 `y0`(baseline 또는 각 행의 아래쪽 값)도 y
scale의 domain을 이룹니다. grid의 값은 포함되지 않습니다. mark는 그리는 내용(행, 값, 곡선, plot의 크기나 scale,
paint)이 바뀔 때에만 다시 그려지며, 포인터는 hover 요소만 움직일 뿐 mark를 다시 그리지 않습니다.

band는 `y0` 값이 행을 읽는 `Area`입니다. 위쪽 가장자리는 `y1` 값을 지나고, 아래쪽 가장자리는 `y0` 값을 거슬러 지나며, 둘 다
area의 `curve` 설정을 따릅니다. appear는 둘 다 시작 가장자리에서부터 그려 나갑니다. hover dot은 위쪽 가장자리에 놓이며, 그 위에
겹쳐 놓은 `Line` 요소가 중간 값을 표시합니다:

```tsx
<Plot data={days} y="close">
  <Area y1="high" y0="low" class="fill-chart-1/15" hoverDotClass="hidden" />
  <Line class="stroke-chart-1 stroke-2" />
</Plot>
```

`fill` 값은 브라우저에서처럼 CSS의 것으로, 색상입니다. line 아래의 gradient는 area의 배경으로 표현하며, 페이지가 도형 안에
gradient를 보여 주는 방식과 같습니다(`clip-path` 아래 box의 `background-image`). `backgroundClass="bg-linear-to-b from-chart-1/20
to-transparent"`는 area의 가장 높은 지점에서 baseline까지 fade 되며, 다른 view의 배경과 마찬가지로 theme의 token과
appearance의 색상을 사용합니다.

## Bar

`Bar` mark는 `band` scale에서 행의 band 안에 행마다 막대 하나를 그립니다: band x scale에서는 세로로, band y scale에서는 가로로
그립니다(이때 x scale: `linear`). 각 막대는 `base`에서 다른 scale 위의 행 값까지 이어지므로 음수 값은 반대 방향으로 자라며, 값이 없는
행에는 막대가 없습니다. 반전된 value scale에서는 막대가 위쪽 가장자리에서 아래로, 또는 오른쪽 가장자리에서 왼쪽으로 자라며, 반전된
band scale은 첫 번째 행의 band를 오른쪽 또는 아래쪽에 놓습니다([반전된 scale](#reversed-scales)).

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

stack 밖의 막대는 mark의 순서대로 각 band 안에 나란히 놓입니다. `stack` 값이 같은 막대는 쌓이며, 각 행의 막대는 stack에서 앞선
막대가 끝나는 지점에서 시작합니다:

```tsx
<Bar value="online" stack="sales" class="fill-chart-1" />
<Bar value="store" stack="sales" class="fill-chart-2" cornerRadii={{ topLeft: 4, topRight: 4 }} label={(d) => `${d.online + d.store}`} />
```

| Prop | 타입 | 기본값 | 설명 |
|---|---|---|---|
| `value` | `string \| (d, index) => number` | plot의 `y` | 각 막대가 나타내는 값. |
| `base` | `number \| string \| (d, index) => number` | `0` | value scale에서 막대가 자라기 시작하는 값: 모든 행에 하나의 값을 쓰거나, 각 행에 고유한 값을 주는 field 또는 함수를 쓸 수 있으며, 이 경우 각 막대는 행의 base에서 값까지 이어집니다(값이 없는 행에는 막대가 없음). domain에 포함됩니다. stack은 첫 번째 막대의 base에서 행별로 자랍니다. |
| `stack` | `string` | 없음 | 속한 stack: `stack` 값이 같은 막대는 순서대로 쌓입니다(값이 없는 행은 아무것도 더하지 않음). |
| `scale` | `"y" \| "y2"` | `"y"` | 세로 막대의 값이 따라가는 y scale([이중 축](#dual-axes)). 두 scale의 막대는 나란히 놓이며, stack은 자기 scale에 있는 막대만 쌓습니다. |
| `cornerRadii` | `number \| { topLeft?, topRight?, bottomRight?, bottomLeft? }` | `0` | 막대 각 모서리의 반지름. `{ topLeft: 4, topRight: 4 }` 사용 시 세로 막대의 끝만 둥글게 합니다. 막대의 절반보다 큰 반지름은 막대에 맞게 조정됩니다. |
| `stagger` | `number` | `0` | plot의 appear와 함께, 막대가 행 단위로 차례로 시작합니다. appear 시간 중 이 비율(0~0.95) 동안 시작 시점이 분산되고 각 막대는 나머지 시간 동안 자랍니다. 0이면 모두 동시에 자랍니다. |
| `inactiveOpacity` | `number` | 없음 | 포인터가 plot 위에 있는 동안 포인터 아래 행에서 떨어진 막대의 불투명도로, 그 행이 돋보이게 합니다. hover에 따라 서서히 나타나고 사라지며, 막대에서 막대로 함께 이동합니다. |
| `label` | `string \| (d, index) => string` | 없음 | 각 막대의 값 쪽 끝에 표시되는 텍스트: field(그 텍스트 또는 숫자)이거나, 앱이 포맷한 텍스트를 반환하는 함수. |
| `labelClass`, `labelStyle` | `string`, `StyleProp<TextStyle>` | 없음 | `label` 부분: 막대 가운데에 맞춘 텍스트로, 세로 막대의 끝 위쪽(아래로 자라는 막대에서는 아래쪽), 가로 막대의 뒤쪽(거꾸로 자라는 막대에서는 앞쪽)에 놓입니다. padding이 막대와의 거리입니다. |
| `backgroundClass`, `backgroundStyle` | `string`, `StyleProp<ViewStyle>` | 없음 | 배경: 각 막대의 상자로, 그 배경(`bg-linear-to-t from-… to-…`, 막대 아래에서 위로)은 막대 안쪽에만 `fill` 아래에 표시됩니다. 배경이 있으면 따로 설정하지 않은 `fill`의 기본값은 다음과 같습니다: `none`. |
| `color` | `string \| (d, index) => string` | 없음 | 각 막대의 카테고리로, 색은 plot의 `colorScale`에서 가져오며 다른 설정이 없으면 막대의 `fill` 값이 됩니다([카테고리별 색상](#colors-by-category)). |

band scale은 d3의 `scaleBand`처럼 plot의 행마다 순서대로 band 하나를 배치하거나, `domain`의 카테고리마다 band 하나를 배치합니다:

| 옵션 | 기본값 | 설명 |
|---|---|---|
| `domain` | 없음 | band의 카테고리를 순서대로 지정합니다(d3의 `scaleBand().domain()`). [`Cell`](#cell) 요소는 자기 행의 카테고리에 해당하는 band에 놓이고, `PlotAxis` 요소는 각 band의 카테고리를 적습니다. 두 번 나오는 카테고리는 처음 위치를 유지합니다. 지정하지 않으면 band는 행이 되며, cell 위에서는 cell이 축을 따라 지정하는 카테고리가 행이 가져오는 순서대로 band가 됩니다. |
| `paddingInner` | `0` | 이웃한 band 사이의 간격으로, 각 band의 step에 대한 비율(0~1). |
| `paddingOuter` | `0` | 첫 번째 band 앞과 마지막 band 뒤의 간격으로, step에 대한 비율. `paddingInner`의 절반으로 지정하면 band의 중앙이 plot 전체에 걸쳐 같은 간격으로 놓입니다. |
| `maxBandWidth` | 없음 | band의 최대 너비(포인트 단위): 넓은 plot에 band가 몇 개뿐이어도 좁게 유지되며, 각각 자기 자리의 가운데에 놓입니다. |
| `bandCount` | 행 | 행보다 많을 때 축이 배치되는 기준이 되는 band 수: 행이 앞쪽 band를 차지하며, 행이 추가되어도 너비와 위치를 유지합니다. |
| `groupPadding` | `0` | 한 band 안에 나란히 놓인 막대 사이의 간격으로, 각 막대 자리에 대한 비율. |
| `reverse` | `false` | band가 반대쪽 가장자리에서 시작합니다. 첫 번째 행의 band는 x축에서는 오른쪽, y축에서는 아래쪽에 놓이며, 한 band 안에 나란히 놓인 막대는 순서를 유지합니다. |

막대는 자체 `fill` 설정(`fill-*`; CSS 상속처럼 plot에서 상속됨)으로 그리며, 설정이 없을 때의 기본값은 `currentColor`입니다(카테고리의 색상과 `color` 사용). hover dot은 표시하지 않습니다. band scale에서 hover는 포인터 아래의 band를 찾고, plot의 cross line은 그 band와 같은 너비로 그 band 안에 놓입니다. `crossLineClass="w-full h-full bg-foreground/5"` 사용 시 band에 색이 입혀지고, `w-px` 사용 시 band 가운데에 선이 유지됩니다. 막대의 값과 base는 plot에 domain이 없으면 value scale의 domain을 이룹니다. plot의 appear와 함께 각 막대는 자신의 stack base에서 자라나며, 움직임, 페이드, 이동은 플랫폼의 animator에서 실행되고 포인터는 막대를 다시 그리지 않습니다.

<a id="ranges"></a>

### 범위

<!-- demo: el-plot-ranges -->

`base`에 field 또는 함수를 지정하면 각 막대는 행의 두 값에 걸칩니다: 워터폴 차트의 단계는 직전 누계에서 그다음 누계까지, 캔들의 몸통은 시가에서 종가까지, 작업은 시작에서 종료까지입니다. 막대는 나타날 때 자신의 base에서 자라며, label은 값 쪽 끝에 놓여 상승하는 막대에서는 위쪽, 하락하는 막대에서는 아래쪽에 표시됩니다.

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

퍼널은 가운데 정렬된 가로 막대입니다: band y scale 위에서 `base={(d) => -d.users / 2}`, `value={(d) => d.users / 2}` 조합으로 만듭니다.

## Rule

`Rule` mark는 value 축을 따라 행마다 직선 하나를 `base`에서 행의 값까지 그립니다. band scale에서는 행의 band 가운데에(band y scale에서는 plot을 가로질러), point 또는 linear scale에서는 x축에서 행의 위치에 놓입니다. 캔들의 심지, box plot의 whisker, error bar, lollipop의 막대는 rule이며, 캔들스틱은 `Rule` 위에 겹친 `Bar`입니다:

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

| Prop | 타입 | 기본값 | 설명 |
|---|---|---|---|
| `value` | `string \| (d, index) => number` | plot의 `y` | 각 선이 끝나는 위치. 값이 없는 행에는 선이 없습니다. |
| `base` | `number \| string \| (d, index) => number` | `0` | 각 선이 시작하는 위치: 모든 행에 하나의 값(zero line에서 시작하는 lollipop의 막대)을 쓰거나, 각 행에 고유한 값을 주는 field 또는 함수(캔들의 저가)를 쓸 수 있습니다. domain에 포함됩니다. |
| `scale` | `"y" \| "y2"` | `"y"` | 값이 따라가는 y scale([이중 축](#dual-axes)). |
| `stagger` | `number` | `0` | plot의 appear와 함께, 선이 행 단위로 차례로 시작합니다. appear 시간 중 이 비율(0~0.95) 동안 시작 시점이 분산되고 각 선은 나머지 시간 동안 시작점에서부터 자랍니다. |
| `inactiveOpacity` | `number` | 없음 | 포인터가 plot 위에 있는 동안 포인터 아래 행에서 떨어진 선의 불투명도로, `Bar`의 것과 같습니다. |
| `color` | `string \| (d, index) => string` | 없음 | 각 선의 카테고리로, 색은 plot의 `colorScale`에서 가져오며 다른 설정이 없으면 선의 `stroke` 값이 됩니다. |

rule은 자체 `stroke` 설정(`stroke-*`, `strokeWidth`, `strokeDasharray`; CSS 상속처럼 plot에서 상속됨)으로 선을 그리며, 설정이 없을 때의 기본값은 `currentColor`입니다. hover dot은 표시하지 않습니다. 값과 base는 plot에 domain이 없으면 value scale의 domain을 이룹니다. plot의 appear와 함께 시작점에서부터 자라며 scale의 domain에 따라 움직이고, 이는 플랫폼의 animator에서 실행됩니다.
## Dot

<!-- demo: el-plot-dots -->

`Dot`는 행의 두 값이 만나는 지점에 행마다 점 하나를 그립니다. `linear` x 스케일을 따르는 `x`와 y축 위쪽으로 향하는 `value`는 산점도를 만들고, band x 스케일에서는 각 점이 행의 band 중앙에 놓입니다. band y 스케일(이때 x 스케일은 `linear`)에서는 값이 x를 따라 뻗고 행의 band가 플롯 아래쪽으로 이어져 dot plot이 됩니다. 반지름 `r`는 모든 점에 같은 숫자 하나이거나, `rScale`가 반지름으로 바꿔 주는 각 행의 값이며, 후자는 버블 차트가 됩니다. 값이 없는 행에는 점이 없습니다.

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

`r`에 필드나 함수를 주면 각 행의 값이 점의 크기를 정합니다. `rScale={{ type: "sqrt", range: [min, max] }}`는 d3의 `scaleSqrt`처럼 값의 제곱근을 포인트 단위 반지름에 대응시킵니다. 따라서 범위가 0에서 시작하면 버블의 면적이 값에 비례하고, 0보다 큰 값에서 시작하면 가장 작은 버블도 눈에 보입니다. 스케일이 domain을 지정하지 않으면 domain은 0부터 가장 큰 값까지입니다. 큰 점이 먼저 그려지므로 작은 점은 그 위에 보입니다.

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

플롯에 domain이 없으면 점의 값이 값 스케일의 domain을 만들며, 이때 0까지 확장하지 않으므로 산점도의 축은 점들에 맞춰집니다. 점이 클 때는 플롯에 값 주위로 여유가 있는 `domain`을 지정하세요. domain 가장자리에 있는 버블은 플롯의 경계를 넘어 그려집니다.

같은 band 안의 두 mark로 한 행의 두 값을 비교하는 차트를 만들 수 있습니다. lollipop은 0에서 시작하는 `Rule` 아래에 값 위치의 `Dot`을 둔 것이고, dumbbell은 band y 스케일에서 한 값부터 다른 값까지 이어지는 `Rule`의 양 끝에 `Dot`을 둔 것입니다.

```tsx
<Plot data={stocks} yScale={{ type: "band", paddingInner: 0.3 }} xScale={{ type: "linear", domain: [-50, 80] }} class="h-48">
  <Rule value="high" base="low" class="stroke-border stroke-2" />
  <Dot value="before" r={3.5} class="fill-card stroke-muted-foreground" hoverDotClass="hidden" />
  <Dot value="now" r={5} class="fill-chart-1 stroke-card stroke-2" hitRadius={24} />
</Plot>
```

| 속성 | 타입 | 기본값 | 설명 |
|---|---|---|---|
| `value` | `string \| (d, index) => number` | 플롯의 `y` | 값 축을 따라 각 점이 놓이는 위치입니다. y축 위쪽 방향이거나, band y 스케일에서는 x 방향입니다. 값이 없는 행에는 점이 없습니다. |
| `r` | `number \| string \| (d, index) => number` | `3` | 점의 반지름(포인트 단위)이거나, `rScale`가 반지름으로 바꿔 줄 값을 각 행에 주는 필드 또는 함수입니다(스케일이 없으면 값이 곧 반지름입니다). 값이 없는 행에는 점이 없습니다. |
| `rScale` | `{ type: "sqrt"; domain?: [number, number]; range: [number, number] }` | 없음 | `r`의 값이 반지름이 되는 방식입니다. 값의 제곱근을 `domain`(없으면 0부터 가장 큰 값까지) 위에서 반지름의 `range`에 대응시키므로, 범위가 0에서 시작하면 각 점의 면적이 값에 비례합니다. domain 밖의 값은 범위의 양 끝 값을 따릅니다. |
| `stagger` | `number` | `0` | 플롯의 appear와 함께 점들이 행 순서대로 차례로 커지기 시작하며, appear 시간 중 이 비율(0~0.95) 동안 진행됩니다. 0이면 모든 점이 함께 커집니다. |
| `inactiveOpacity` | `number` | 없음 | 점 하나가 포인터나 키 아래에 있는 동안 나머지 점들의 불투명도입니다. hover에 맞춰 서서히 나타나고 사라집니다. |
| `color` | `string \| (d, index) => string` | 없음 | 각 점의 범주이며, 색상은 플롯의 `colorScale`에서 가져옵니다. 아무것도 색을 지정하지 않은 곳에서는 점의 `fill`을 사용합니다([범주별 색상](#colors-by-category)). |
| `hitRadius` | `number` | `8` | 점의 가장자리를 넘어 포인터가 여전히 점을 찾는 거리입니다. 이 거리 안에 있는 점들 중 중심이 포인터에 가장 가까운 점을 찾으므로(Voronoi 셀), 큰 버블 위에 놓인 작은 버블도 자신의 중심 주변에서 찾을 수 있습니다. dot plot의 행은 반지름이 행 크기만큼 크면 행을 따라 어디에서든 찾을 수 있습니다. |
| `scale` | `"y" \| "y2"` | `"y"` | 값이 따라가는 y 스케일입니다([Dual axes](#dual-axes)). band y 스케일의 점은 값을 x 방향에 놓습니다. |
| `hoverDotClass`, `hoverDotStyle` | `string`, `StyleProp<ViewStyle>` | 플롯의 `dotClass`, `dotStyle` | `hoverDot` part입니다. 포인터 아래 점과 같은 너비와 높이의 뷰이며 그 점을 중심으로 놓입니다. `rounded-full outline-2 outline-offset-1`는 점에 링을 두르고, `hidden`는 이 mark에 링을 표시하지 않습니다. |

점은 `fill`(`fill-*`, CSS의 상속처럼 플롯에서 상속됨)으로 채워지고, 지정된 것이 없으면 `currentColor`(범주의 색상과 `color`)로 채워집니다. 테두리는 지정된 경우 `stroke`(`stroke-*`, `strokeWidth`)으로 그려집니다. 카드 색상의 링은 겹친 점들을 구분해 줍니다. 점이 있는 플롯에서는 중심이 포인터에 가장 가까운 점의 행을 플롯이 보고하고(모든 점에서 멀리 떨어지면 `null`), 키는 행의 순서대로 행을 이동하며(행을 x 기준으로 정렬하면 키가 점들을 왼쪽에서 오른쪽으로 이동합니다), `hoverDot` part가 그 점을 표시합니다. 플롯의 appear와 함께 점들은 크기 0에서 커집니다. `motion.update`를 사용하면 점들이 새 값과 크기로 이동하고, 새 행의 점은 커지며 나타나고 사라진 행의 점은 줄어들며 사라집니다. 이 모든 동작은 플랫폼 animator에서 이루어지며 mark를 다시 그리지 않습니다.

## Cell

<!-- demo: el-plot-cells -->

`Cell`은 행마다 두 band에 걸친 사각형 하나를 그립니다. `band` x 스케일에서는 `x` 범주의 band를, `band` y 스케일에서는 `y` 범주의 band를 사용하므로 행들이 격자, 즉 heatmap을 이룹니다. 상관관계 행렬, 월별 수익률 달력, 시간별 주간 거래량이 cell의 예입니다. 각 cell은 두 band를 가득 채우므로 스케일의 `paddingInner`와 `paddingOuter`가 cell 사이와 주변의 간격이 됩니다. 색상은 플롯의 `colorScale`, 즉 색상 램프를 따르는 `value`([램프를 따르는 색상](#colors-along-a-ramp))이거나, ordinal 스케일을 통한 `color` 범주의 색상입니다. cell은 플롯의 x, y 스케일 위에 놓입니다.

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

band 스케일의 `domain`은 d3의 `scaleBand().domain()`처럼 band의 범주를 순서대로 지정합니다. 달력의 달은 1월부터 12월까지 행이 있든 없든 각자의 band를 가지므로, 위에서 2026년 3월은 격자의 빈 자리입니다. domain이 없으면 band는 cell이 해당 축에서 지정한 범주이며 행이 들어온 순서를 따릅니다(위에서는 2025가 2026보다 위). 범주 band 스케일을 따르는 `PlotAxis`은 `format` 없이 각 band의 범주를 표시합니다.

상관관계 행렬은 두 축 모두에 같은 종목을 나열하며, `domain`이 계수의 전체 범위이므로 계수 0은 종목에 상관없이 램프의 중간색이 됩니다.

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

| 속성 | 타입 | 기본값 | 설명 |
|---|---|---|---|
| `x` | `string \| (d, index) => string` | 없음 | 각 행의 열입니다. 필드(텍스트 또는 숫자)이거나 범주를 반환하는 함수입니다. 행의 cell은 x 스케일에서 그 범주의 band에 놓이며, 범주가 없는 행에는 cell이 없습니다. |
| `y` | `string \| (d, index) => string` | 없음 | 각 행의 줄이며, y 스케일을 따르는 `x`입니다. |
| `value` | `string \| (d, index) => number` | 없음 | 각 cell의 숫자이며, `sequential` 또는 `diverging` `colorScale`이 이를 색상으로 바꿉니다. 값이 없는 행은 스케일의 `unknown` 색상을 사용하고, 그것도 없으면 cell이 없습니다. |
| `color` | `string \| (d, index) => string` | 없음 | 각 cell의 범주이며, 색상은 `ordinal` `colorScale`에서 가져옵니다([범주별 색상](#colors-by-category)). |
| `cornerRadii` | `number \| { topLeft?, topRight?, bottomRight?, bottomLeft? }` | `0` | cell의 각 모서리 반지름입니다. |
| `stagger` | `number` | `0` | 플롯의 appear와 함께 cell들이 행 순서대로 차례로 커지기 시작하며, appear 시간 중 이 비율(0~0.95) 동안 진행되고 각 cell은 나머지 시간 동안 중앙에서부터 커집니다. 0이면 모든 cell이 함께 커집니다. |
| `inactiveOpacity` | `number` | 없음 | cell 하나가 포인터나 키 아래에 있는 동안 나머지 cell과 해당 레이블의 불투명도입니다. hover에 맞춰 서서히 나타나고 사라집니다. |
| `label` | `string \| (d, index) => string` | 없음 | `label` part입니다. 각 cell 중앙의 텍스트이며, 필드(텍스트 또는 숫자)이거나 앱이 서식을 지정한 텍스트를 반환하는 함수입니다. 각 레이블은 레이아웃된 크기가 cell 안에 들어갈 때만 표시되므로, 좁은 플롯에서는 색상만 보입니다. |
| `labelClass`, `labelStyle` | `string`, `StyleProp<TextStyle>` | 없음 | 레이블의 글꼴, 크기, 색상입니다. `colorScale` 색상이 어두운 cell 위의 레이블에는 속성 `data-dark`이 붙으며(밝은 텍스트가 더 잘 읽히는 경우), `data-dark:text-white`가 그곳에서 밝게 표시합니다. |
| `hoverCellClass`, `hoverCellStyle` | `string`, `StyleProp<ViewStyle>` | 없음 | `hoverCell` part입니다. 포인터나 키 아래에 있는 cell과 같은 크기의 뷰이며 그 위에 놓입니다. `rounded-sm outline-2 outline-foreground`는 cell에 링을 두릅니다. 포인터와 같은 프레임에서 함께 움직이고, 키로 이동할 때는 `pointer` 스프링으로 미끄러지듯 이동합니다. |

cell은 앱이 `fill`을 지정하지 않은 곳에서는 플롯의 `colorScale` 색상으로 채워지고(`fill-*` 클래스와 스타일이 우선하며, CSS의 상속처럼 플롯에서 상속됨), 아무것도 지정하지 않은 곳에서는 `currentColor`로 채워지며, 테두리는 지정된 경우 `stroke`으로 그려집니다. cell이 있는 플롯에서는 포인터 아래 cell의 행을 플롯이 보고하며, 두 cell 사이의 간격에서는 더 가까운 cell의 행을 보고합니다. 화살표 키는 화면에 보이는 대로 격자를 가로질러 이동하고([Keyboard](#keyboard)), 스크린 리더는 행의 순서대로 이동합니다. 플롯의 appear와 함께 cell은 중앙에서부터 커집니다. `motion.update`를 사용하면 cell의 색상이 새 색상으로 부드럽게 전환되고, 새 행의 cell은 커지며 나타나고, 사라진 행의 cell은 줄어들며 사라지고, cell은 새 band로 이동합니다. 이 모든 동작은 플랫폼 animator에서 이루어지며 mark를 다시 그리지 않습니다.
<a id="pie-and-arc"></a>

## Pie와 Arc

`Pie` 마크는 한 바퀴를 행마다 하나의 슬라이스로 나누며, 각 슬라이스는 전체 행 값에서 차지하는 비율만큼의 각도를 가지고, 플롯의 중심을 둘러 12시 방향에서 시계 방향으로 행의 순서대로 배치됩니다. `innerRadius` 값을 지정하면 도넛 형태가 됩니다. 각 슬라이스는 `slice` 파트라는 고유한 캔버스이므로 각자 자신의 클래스로 그려집니다. `sliceClass`에는 모든 슬라이스에 같은 클래스를 지정하거나, 슬라이스의 행을 받아 각 슬라이스에 고유한 클래스를 주는 함수를 지정할 수 있습니다. 파이 위에서 플롯은 포인터 아래에 있는 슬라이스의 행을 보고하고(구멍이나 링 바깥에서는 없음), 툴팁은 포인터를 따라가며, 해당 슬라이스는 `hoverLift`만큼 커지고 나머지는 `hoverDim`만큼 흐려집니다. 이 동작은 플랫폼의 animator에서 플롯의 `motion` 설정으로 실행됩니다. `Arc` 마크는 두 각도 사이에 부채꼴 하나를 그립니다. 게이지의 트랙과 값, 또는 파이 뒤의 링에 쓸 수 있습니다.

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

| 마크 | Prop | Rust | 타입 | 기본값 | 설명 |
|---|---|---|---|---|---|
| `Pie` | `value` | `.value(..)` | `keyof T \| (d: T, index: number) => number` | 플롯의 `y` | 각 행의 값. 값이 0이거나 그보다 작거나 숫자가 아닌 행에는 슬라이스가 없습니다. |
| `Pie`, `Arc` | `startAngle`, `endAngle` | `.start_angle(..)`, `.end_angle(..)` | `number` (라디안) | `0`, `2 * Math.PI` | 첫 슬라이스가 시작하고 마지막 슬라이스가 끝나는 위치(arc의 양 끝): 12시 방향에서 시계 방향으로 잰 라디안. `endAngle` 값이 `startAngle` 값보다 작으면 파이의 슬라이스가 반대 방향으로 배치됩니다. |
| `Pie` | `padAngle` | `.pad_angle(..)` | `number` (라디안) | `0` | 림에서 인접한 슬라이스 사이의 각도. 각 간격은 모든 반지름에서 그 폭(약 `padAngle * outerRadius` 포인트)을 유지하고 양쪽 가장자리가 평행하므로, 중심이나 구멍에서도 림에서와 같은 폭입니다. 중심까지 닿기에는 너무 좁은 슬라이스는 가장자리가 만나는 지점에서 끝납니다. 슬라이스가 하나뿐인 파이에는 간격이 없습니다. |
| `Pie`, `Arc` | `innerRadius`, `outerRadius` | `.inner_radius(..)`, `.outer_radius(..)` | ``number \| `${number}%` `` | `0`, `"100%"` | 구멍과 림의 반지름: 포인트 단위이거나, 플롯이 담을 수 있는 가장 큰 원(짧은 변의 절반)에 대한 백분율. |
| `Pie`, `Arc` | `cornerRadius` | `.corner_radius(..)` | `number` | `0` | 각 슬라이스(arc의 경우 arc)의 모서리 반지름, 포인트 단위이며 d3의 `arc.cornerRadius` 방식과 같습니다. 각 모서리는 가장자리와 림 또는 구멍에 접하는 원이며, 간격의 평행한 가장자리도 포함합니다. 최댓값은 링 두께의 절반이고, 이 값이면 arc의 끝이 둥근 캡이 됩니다. 온전한 모서리 두 개가 들어가기에는 너무 좁은 슬라이스에서는 두 모서리가 슬라이스의 가운데에서 만납니다. 전체 링은 둥근 가장자리만 유지합니다. |
| `Pie` | `sliceClass` | `.slice_class(..)` | `string \| (d: T, index: number) => string` | 없음 | 각 슬라이스의 클래스(`fill-*`, `stroke-*`): 모든 슬라이스에 같은 값이거나, 슬라이스의 행과 인덱스를 받는 함수이며, 행이나 함수가 바뀔 때 행마다 한 번씩 호출됩니다. |
| `Pie` | `sliceStyle` | `.slice_style(..)` | `StyleProp<ViewStyle>` | 없음 | 클래스 위에 적용되는 모든 슬라이스의 스타일(`fill`, `stroke`, `strokeWidth`). |
| `Pie` | `hoverLift` | `.hover_lift(..)` | `number` | `0` | 포인터 아래의 슬라이스가 다른 슬라이스보다 얼마나 더 커지는지, 포인트 단위: 플롯의 `pointer` 스프링으로 동작하며 호버에 따라 페이드 인/아웃됩니다. |
| `Pie` | `hoverDim` | `.hover_dim(..)` | `number` (0~1) | `0` | 슬라이스 하나가 포인터 아래에 있는 동안 나머지 슬라이스가 얼마나 흐려지는지, 불투명도에 대한 비율이며 호버의 페이드와 함께 적용됩니다. |
| `Pie` | `color` | `.color(..)` | `keyof T \| (d: T, index: number) => string` | 없음 | 각 슬라이스의 카테고리로, 색상은 플롯의 `colorScale`에서 가져옵니다. 다른 지정이 없을 때 슬라이스의 `fill` 값이 됩니다([카테고리별 색상](#colors-by-category)). |
| `Pie` | `label` | `.label(..)` | `string \| (d: T, index: number) => string` | 없음 | 각 슬라이스 옆의 텍스트: 필드(그 숫자) 또는 앱이 포맷한 텍스트를 반환하는 함수. 텍스트가 비어 있는 행이나 0.5도보다 좁은 슬라이스에는 레이블이 없습니다. |
| `Pie` | `labelClass`, `labelStyle` | `.label_class(..)`, `.label_style(..)` | `string`, `StyleProp<TextStyle>` | 없음 | `label` 파트: 링 바깥, 지시선 끝에 놓이는 텍스트로, 선 끝에 중앙을 맞추고 파이의 오른쪽 절반에서는 선 뒤에, 왼쪽 절반에서는 선 앞에 놓입니다. 패딩은 선 끝으로부터의 거리입니다. |
| `Pie` | `labelGap` | `.label_gap(..)` | `number` | `15` | 레이블이 림에서 얼마나 바깥쪽에 놓이는지, 포인트 단위. |
| `Pie` | `labelLineClass`, `labelLineStyle` | `.label_line_class(..)`, `.label_line_style(..)` | `string \| (d: T, index: number) => string`, `StyleProp<ViewStyle>` | 없음 | `labelLine` 파트: 각 레이블의 지시선으로, 슬라이스 중앙의 림에서 레이블의 반지름까지 뻗은 뒤 텍스트까지 가로로 이어집니다. `stroke`(지정이 없으면 `currentColor`), `strokeWidth`, `strokeDasharray` 값은 모든 선에 같거나 슬라이스의 행에 대한 함수이며, 스타일이 지정되면 표시됩니다. |

슬라이스와 arc는 `fill`(지정이 없으면 `currentColor`, 슬라이스는 `color` 지정 시 카테고리의 색상)으로 채우고, 가장자리는 `stroke`(지정이 없으면 없음)로 선을 긋습니다. CSS가 상속하는 방식대로 자신의 값이 파이와 플롯의 값보다 우선합니다. 표면 색상(`stroke-card stroke-2`)의 선은 슬라이스 사이에도 간격을 만듭니다. 이 값들은 플롯의 스케일에 관여하지 않습니다. 파이의 슬라이스는 행, 값, 각도, 반지름 또는 플롯 크기가 바뀔 때만 다시 그려지며, 포인터에 따른 들어올림과 페이드는 animator에서 움직입니다.

파이가 있는 플롯은 파이의 행이 축 위에 위치를 갖지 않기 때문에 보통 툴팁을 포인터 옆에 배치합니다(`tooltipPlacement="pointer"`). 십자선과 툴팁은 파이 위에서 포인터를 따라가며, 호버 점은 표시되지 않습니다. 도넛의 중심(호버된 슬라이스의 값 또는 합계)은 플롯 위에 얹는 앱 자체의 요소이며, 범례도 마찬가지로 각 키가 해당 슬라이스의 색상을 가집니다.

파이의 레이블은 링 바깥에서 슬라이스의 이름을 표시합니다. 각 텍스트는 슬라이스 중앙(해당 반지름에서의 슬라이스 중심) 방향으로 림에서 `labelGap`만큼 떨어진 곳에 놓이고, 이어 파이에서 슬라이스가 있는 쪽으로 그 반지름까지 가로로 이동하며, 스타일이 지정된 지시선이 이를 림과 연결합니다. 레이블은 플롯의 appear 애니메이션 때 슬라이스와 함께 펼쳐지고 끝 무렵에 페이드 인되며, `motion.update` 시 슬라이스와 함께 움직이고, 호버된 슬라이스와 함께 들어올려집니다. 이 모든 것은 플랫폼의 animator에서 실행됩니다. 레이블을 위한 여유 공간을 플롯에 확보하세요. `"100%"` 미만의 `outerRadius` 값을 쓰거나 플롯 주변에 여백을 둡니다. 슬라이스 위치에 놓는 앱 자체의 콘텐츠는 도넛의 중심처럼 플롯 위에 얹는 요소입니다.

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

## 카테고리별 색상

플롯의 `colorScale` 설정은 d3의 `scaleOrdinal`처럼 카테고리에 색상을 부여하며, 마크의 `color` 설정은 각 행의 카테고리를 지정합니다. 필드(그 텍스트 또는 숫자)이거나 행에 대한 함수입니다. `domain`의 카테고리는 `range`의 색상을 순서대로 받고, 도메인이 더 길면 범위는 첫 번째 색상부터 다시 시작합니다. 도메인 밖의 카테고리는 `unknown` 값을 받으며, 그 값이 없으면 마크가 처음 만나는 시점에(마크는 순서대로, 각 마크의 행도 순서대로) 도메인에 합류하여 다음 색상을 받습니다. 따라서 `domain` 자체가 없으면 카테고리는 행이 가져오는 순서대로 색상을 받습니다. 색상은 앱이 정하는 것입니다. CSS 색상이며 테마의 토큰도 포함됩니다.

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

슬라이스, 막대, 점은 자신의 행의 색상을 받습니다. `Line`, `Area` 각각은 하나의 시리즈이므로 첫 번째 행의 색상을 받습니다. 따라서 자체 행으로 이루어진 선(`data`)은 그 행의 색상이 되고, 하나의 스케일이 파이, 막대, 선 전반에서 카테고리의 색상을 동일하게 유지합니다. 다른 지정이 없으면 이 색상이 마크의 `fill`(선은 `stroke`) 값이 되어 `currentColor` 자리를 차지합니다. 앱의 클래스와 스타일이 우선하고, 그다음 파트의 것(`sliceClass`, `sliceStyle`), 마크의 것, 플롯에서 상속되는 것의 순서이므로, `sliceClass={(d) => (d.name === "Other" ? "fill-muted" : "")}` 같은 설정은 스케일이 나머지 슬라이스에 색을 입히는 동안 슬라이스 하나만 따로 지정합니다. `background` 파트와 함께 쓰면 막대와 영역의 `fill` 값은 `none` 상태로 그대로 유지됩니다.

| `OrdinalScale` | 타입 | 기본값 | 설명 |
|---|---|---|---|
| `type` | `"ordinal"` | (필수) | 스케일의 종류. |
| `domain` | `string[]` | 없음 | 카테고리를 순서대로 나열. 두 번 쓰인 카테고리는 첫 번째 위치를 유지합니다. |
| `range` | `string[]` | (필수) | 색상을 순서대로 나열(CSS 색상). 카테고리 `i`에는 색상 `i % range.length` 항목이 적용됩니다. |
| `unknown` | `string` | 없음 | 도메인 밖의 모든 카테고리의 색상. 없으면 각각 다음 색상을 받습니다. |

<a id="colors-along-a-ramp"></a>

### 램프를 따르는 색상

`colorScale` 설정이 `type: "sequential"` 또는 `"diverging"`인 경우, d3의 `scaleSequential`, `scaleDiverging`이 하는 것처럼 숫자에 램프를 따라 색상을 부여하며, [`Cell`](#cell)의 `value`에 사용됩니다. `range` 값은 두 개 이상의 색상이며, 램프의 낮은 쪽 끝에서 높은 쪽 끝까지 고르게 배치되고 그 사이는 OKLab에서 혼합됩니다. 단계가 눈에 고르게 보이며, 두 색조는 각자의 혼합을 거쳐 만납니다. `domain` 밖의 값은 램프의 끝 색상을 받고, 값이 없는 행은 `unknown` 값을 받습니다.

`sequential` 종류는 `domain` 값을 램프 전체에 걸쳐 펼칩니다. 앱이 도메인을 지정하지 않으면 도메인은 셀 값의 범위입니다. 개수, 용량, 활동량에 적합합니다. `diverging` 종류는 `pivot`(기본값 0)을 램프의 중간 색상에 놓아, 그보다 작은 값은 앞쪽 절반을, 큰 값은 뒤쪽 절반을 따라 배치합니다. 한 색조는 손실, 다른 색조는 이익, 변화 없는 달은 중립적인 가운데 색으로 표현됩니다. 앱이 도메인을 지정하지 않으면 피벗 양쪽이 같아지도록 맞춘 값의 범위(Observable Plot의 `symmetric`)가 도메인이 되므로, 같은 크기의 손실과 이익은 같은 강도로 보입니다. 상관 행렬은 `domain: [-1, 1]` 값을 직접 지정합니다.

```tsx
colorScale={{ type: "sequential", range: [token("muted"), token("chart-1")] }}
colorScale={{ type: "diverging", pivot: 0, range: [token("destructive"), token("muted"), token("chart-1")] }}
```

| `SequentialScale`, `DivergingScale` | 타입 | 기본값 | 설명 |
|---|---|---|---|
| `type` | `"sequential" \| "diverging"` | (필수) | 램프의 종류. |
| `domain` | `[number, number]` | 값의 범위(`diverging`의 경우 피벗을 기준으로 양쪽이 같아지도록 맞춤) | 램프 양 끝의 값. |
| `pivot` | `number` | `0` | `diverging` 전용: 램프의 중간 색상에 해당하는 값. |
| `range` | `string[]` | (필수) | 램프를 따르는 색상, 낮은 쪽 끝에서 높은 쪽 끝 순(CSS 색상)이며, 사이는 OKLab에서 혼합됩니다. |
| `unknown` | `string` | 없음 | 값이 없는 행의 색상. 없으면 해당 행에는 셀이 없습니다. |
## RadialLine and RadialGrid

`RadialLine` 마크는 플롯의 중심을 둘러싸는 계열을 그립니다. 레이더의 다각형이나 다이얼을 따라 도는 선이 그 예입니다. 값이 있는 각 행은 해당 행의 각도에 놓이는 점이며, 플롯의 y 스케일이 그 값을 배치하는 만큼 바깥쪽에 위치합니다. 범위는 `innerRadius`(도메인의 최솟값)에서 `outerRadius`(최댓값)까지입니다. `angle` 없이는 행이 12시 방향에서 시계 방향으로 순서대로 한 바퀴에 고르게 배치되므로, 행이 여섯 개면 육각형이 됩니다. `closed` 설정은 마지막 점과 첫 점을 잇습니다. 선은 점들을 스트로크하고 `innerRadius`(기본값은 중심)까지 면적을 채우므로, 마크 하나로 레이더의 윤곽선과 채색을 함께 표현할 수 있습니다. `RadialGrid` 마크는 그 뒤에 레이더의 그리드를 그립니다. y 스케일의 값에 놓인 `rings`, 행의 각도를 지나는 다각형 또는 `circular`, 그리고 각 행으로 뻗는 `spokes`입니다. Radial line 위에서 플롯은 선의 바깥 반지름 안에서 포인터의 각도와 가장 가까운 각도에 있는 행을 보고하며, 각 선의 호버 점은 그 행의 해당 점 위에 놓입니다.

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

| 마크 | 속성 | Rust | 타입 | 기본값 | 설명 |
|---|---|---|---|---|---|
| `RadialLine` | `radius` | `.radius(..)` | `keyof T \| (d: T, index: number) => number` | 플롯의 `y` | 각 행을 중심에서 얼마나 바깥에 놓을지 정합니다. y 스케일의 값이며, 도메인의 최솟값에서는 `innerRadius`, 최댓값에서는 `outerRadius`에 놓입니다. 값이 없는 행은 건너뜁니다. |
| `RadialLine` | `angle` | `.angle(..)` | `keyof T \| (d: T, index: number) => number` | 행을 한 바퀴에 고르게 배치 | 각 행이 중심을 둘러싸고 놓이는 위치입니다. 12시 방향에서 시계 방향으로 잰 라디안 값입니다. |
| `RadialLine`, `RadialGrid` | `startAngle`, `endAngle` | `.start_angle(..)`, `.end_angle(..)` | `number` (라디안) | `0`, `2 * Math.PI` | `angle` 없이 행이 놓이는 범위로, `startAngle`부터 고르게 배치됩니다. 한 바퀴 전체에서는 서로 한 바퀴의 `1 / rows`씩 떨어지며 마지막 행은 첫 행보다 한 단계 앞에 놓입니다. 한 바퀴의 일부에서는 첫 행이 `startAngle`에, 마지막 행이 `endAngle`에 놓입니다. |
| `RadialLine`, `RadialGrid` | `innerRadius`, `outerRadius` | `.inner_radius(..)`, `.outer_radius(..)` | ``number \| `${number}%` `` | `0`, `"100%"` | y 도메인의 최솟값과 최댓값이 놓이는 위치입니다. 포인트 단위이거나, 파이의 반지름처럼 플롯이 담을 수 있는 가장 큰 원(짧은 변의 절반)에 대한 백분율입니다. 선의 면적은 `innerRadius`까지 채워지며, 그리드의 스포크는 이 두 위치 사이로 뻗습니다. |
| `RadialLine` | `curve` | `.curve(..)` | `"linear" \| "natural" \| "stepAfter"` | `"linear"` | 점을 잇는 방식입니다. 직선 구간, 부드러운 곡선(닫힌 경우 부드러운 루프), 또는 계단형입니다. |
| `RadialLine` | `closed` | `.closed(..)` | `boolean` | `false` | 마지막 점에서 첫 점으로 이어 줍니다. 레이더의 다각형이 이에 해당합니다. 열려 있으면 면적이 중심(또는 안쪽 가장자리를 따라) 닫힙니다. |
| `RadialLine` | `dot`, `dotClass`, `dotStyle` | `.dot(..)`, `.dot_class(..)`, `.dot_style(..)` | `boolean`, `string`, `StyleProp<ViewStyle>` | `false` | 모든 점 위의 점 표시입니다. 점을 중심으로 하는 뷰이며, 크기, 배경, 테두리는 앱이 정합니다. 점은 선과 함께 바깥으로 자라나며 움직입니다. |
| `RadialLine` | `backgroundClass`, `backgroundStyle` | `.background_class(..)`, `.background_style(..)` | `string`, `StyleProp<ViewStyle>` | 없음 | 선의 배경입니다. 바깥 원을 둘러싼 박스이며, 이 박스의 배경(`bg-*`, 그라디언트)은 면적과 마찬가지로 `fill` 아래의 면적 안쪽에만 보입니다. |
| `RadialLine` | `hoverDotClass`, `hoverDotStyle` | `.hover_dot_class(..)`, `.hover_dot_style(..)` | `string`, `StyleProp<ViewStyle>` | 플롯의 `dotClass`, `dotStyle` | 포인터 아래 행의 점 위에 놓이는 호버 점입니다. 포인터가 같은 프레임에 있으며, 키로 이동할 때는 플롯의 `pointer` 스프링으로 다음 행까지 미끄러지듯 이동합니다. `hidden`은 아무것도 표시하지 않습니다. |
| `RadialGrid` | `rings` | `.rings(..)` | `number[]` | 없음 | 링이 놓이는 위치로, y 스케일의 값입니다. 각 링은 radial line이 해당 값을 놓는 만큼 바깥에 위치합니다. |
| `RadialGrid` | `spokes` | `.spokes(..)` | `boolean` | `false` | 각 행의 각도에서 `innerRadius`부터 `outerRadius`까지 그어지는 선입니다. |
| `RadialGrid` | `circular` | `.circular(..)` | `boolean` | `false` | 링이 원(한 바퀴의 일부에서는 호)이 됩니다. 기본적으로 링은 행의 각도를 지나는 다각형이며, 플롯의 행이 세 개 미만일 때는 원입니다. |

Radial line은 `stroke`, `strokeWidth`, `strokeDasharray`(`currentColor`, 지정하지 않으면 너비 1의 실선)으로 스트로크하고 면적은 `fill`(지정하지 않으면 없음)으로 채웁니다. Radial grid는 일반 그리드와 같은 방식으로 스트로크합니다. 이들의 페인트는 플롯에서 상속됩니다. 플롯에 도메인이 없으면 선의 값과 0이 y 스케일의 도메인을 이루므로, 양수 값의 레이더는 중심에서부터 자라납니다. 그리드의 링은 그렇지 않습니다. 값이 바뀌어도 링과 레이더의 스케일을 고정하려면 플롯에 y `domain`을 지정하세요.

레이더 주위의 레이블은 도넛의 중심과 마찬가지로 플롯 위에 겹쳐 놓는 앱의 엘리먼트입니다. `angle` 없이는 `n`개 중 `i`번째 행이 12시 방향에서 `a = 2π·i / n` 위치에 놓입니다. 따라서 정사각형 플롯에서는 `left: 50% + r·sin(a)`, `top: 50% − r·cos(a)`(`r`는 바깥 반지름 비율의 절반을 조금 넘는 플롯 한 변에 대한 백분율)에 크기 없는 박스를 두면 테두리 바깥의 위치를 표시하고, 이름은 그 위치에서 중심 반대쪽으로 자라납니다. 위 예시와 같이 오른쪽 절반에서는 그 오른쪽에, 왼쪽 절반에서는 왼쪽에, 맨 위에서는 위에, 맨 아래에서는 아래에 놓입니다.

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

`Sankey` 마크는 플롯의 행 사이의 흐름을 그립니다. 각 행은 노드이고 `links`은 노드 사이의 흐름을 나타내며, 형식은 `{ source, target, value }` with the indices of two rows in the plot's `data`입니다. 레이아웃은 d3-sankey와 같은 방식으로 플롯의 크기 안에서 계산됩니다. 노드는 열(`nodeAlign`)에 배치되고, 각 노드의 높이는 들어오거나 나가는 흐름 중 큰 쪽에 비례하며, 한 열의 노드는 서로 `nodePadding` 간격을 두고 `iterations`번의 패스에 걸쳐 흐름에 맞게 조정됩니다. 각 링크에는 소스의 오른쪽 가장자리에서 타깃의 왼쪽 가장자리로 이어지는 리본이 그려지며, 양 끝의 너비는 해당 노드의 변에서 그 흐름이 차지하는 비율과 같으므로, 들어오는 흐름과 나가는 흐름이 다르더라도 모든 노드의 양쪽이 채워집니다. 각 열은 플롯의 가운데에 정렬되며, 노드가 하나뿐인 같은 열이 연달아 있으면 그 사이의 리본이 휘어지도록 약간씩 어긋나게 배치됩니다. `valueScale="sqrt"`은 값의 제곱근으로 크기를 정하므로, 하나의 지배적인 흐름이 작은 흐름을 압도하지 않습니다.

각 노드와 각 리본은 `node` 파트와 `link` 파트로서 각자의 캔버스이므로, 각각 고유한 클래스로 페인트됩니다. `nodeClass`은 모든 노드에 같은 클래스를 주거나 노드의 행에 대한 함수이고, `linkClass`은 모든 리본에 같은 클래스를 주거나 링크에 대한 함수입니다. `linkBackground` 파트는 각 리본 안쪽에 소스에서 타깃까지의 박스로 배경을 표시하며, 링크에 대한 함수를 쓰면 각 리본이 소스의 색에서 타깃의 색으로 이어지는 그라디언트를 갖게 됩니다. 리본은 노드 아래에 그려지고, 둘 다 플롯의 appear에 따라 앞쪽 가장자리에서부터 그려집니다.

Sankey 위에서 플롯은 포인터 아래의 노드(`onHoverChange`, 노드의 행이며 리본 위에서는 없음)를 보고하고, 툴팁은 포인터를 따라가며, 해당 노드에 연결되지 않은 링크는 `hoverDim`만큼 페이드됩니다. 이는 플롯의 `motion`과 함께 플랫폼의 애니메이터에서 실행됩니다. 키는 행의 순서대로 노드를 이동하며, 툴팁은 각 노드의 중간 옆에 표시됩니다. `nodeLabel`은 각 노드의 이름을, `valueLabel`는 그 값을 나타내며, 둘 다 설정하면 이름 위에 값이 놓입니다. 첫 번째 열의 노드는 왼쪽에, 마지막 열의 노드는 오른쪽에, 그 사이의 노드는 위쪽 가운데에 놓이며, 이는 `gpui-component`의 차트가 배치하는 방식과 같습니다. 노드 옆의 레이블은 플롯의 위와 아래 사이에 머물고, 플롯의 가장자리를 넘어가는 레이블은 앱이 그 주위에 남겨 둔 공간(마진)에 놓입니다. `nodeLabel` 파트의 패딩은 노드와의 간격이며 그 클래스는 텍스트를 정합니다(`max-w-20 truncate`은 긴 이름을 잘라 줄입니다). 레이블은 appear와 함께 페이드 인됩니다. 앱이 흐름을 바꾸면 모든 노드와 리본이 플롯의 `motion.update`으로 이전 위치에서 새 위치로 이동하며, 레이블도 함께 움직입니다. 흐름에 새로 생긴 노드는 가운데에서 자라나고, 새 링크는 최소 너비에서 자라나며, 사라지는 것은 즉시 사라집니다. 이동 중에 변경이 일어나면 현재 그려진 위치에서 이어서 진행됩니다. 링크는 소스와 타깃으로 구분되므로 `links`의 순서를 바꿔도 아무것도 움직이지 않습니다.

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

| 속성 | Rust | 타입 | 기본값 | 설명 |
|---|---|---|---|---|
| `links` | `.links(..)` | `SankeyLink[]` (`{ source: number; target: number; value: number }`) | 필수 | 흐름입니다. 행 `source`에서 행 `target`(플롯의 `data`에서의 인덱스)로 향하며, `value`가 그 크기입니다. 숫자가 아니거나 0 미만인 값은 아무것도 전달하지 않으며 리본을 그리지 않습니다. |
| `nodeWidth` | `.node_width(..)` | `number` | `24` | 각 노드의 너비이며 포인트 단위입니다. |
| `nodePadding` | `.node_padding(..)` | `number` | `8` | 한 열에 있는 노드 사이의 간격이며 포인트 단위입니다. 너무 빽빽한 열에서는 더 작아집니다. |
| `nodeAlign` | `.node_align(..)` | `"justify" \| "left" \| "right" \| "center"` | `"justify"` | 각 노드가 들어갈 열을 d3-sankey 방식으로 정합니다. 첫 번째 열에서의 깊이(`"left"`), 흐름이 허용하는 만큼 오른쪽(`"right"`), 흐름을 시작하기만 하는 노드를 타깃 옆에 두는 깊이(`"center"`), 또는 흐름이 끝나는 노드를 마지막 열에 두는 깊이(`"justify"`)입니다. |
| `iterations` | `.iterations(..)` | `number` | `6` | 노드를 흐름에 맞게 조정하는 패스의 횟수입니다. |
| `valueScale` | `.value_scale(..)` | `"linear" \| "sqrt"` | `"linear"` | 높이와 너비를 값에 비례하게 할지, 값의 제곱근에 비례하게 할지 정합니다. |
| `minLinkWidth` | `.min_link_width(..)` | `number` | `1` | 리본이 그려지는 최소 두께이며 포인트 단위입니다. 작은 흐름도 계속 보이게 합니다. |
| `nodeCornerRadius` | `.node_corner_radius(..)` | `number` | `0` | 각 노드의 모서리 반경이며 포인트 단위입니다. |
| `nodeClass` | `.node_class(..)` | `string \| (d: T, index: number) => string` | 없음 | 각 노드의 클래스(`fill-*`, `stroke-*`)입니다. 모든 노드에 같은 값을 주거나, 노드의 행과 인덱스에 대한 함수를 줄 수 있으며, 이 함수는 행이나 함수가 바뀔 때 행마다 한 번씩 호출됩니다. |
| `nodeStyle` | `.node_style(..)` | `StyleProp<ViewStyle>` | 없음 | 모든 노드의 스타일이며, 클래스 위에 적용됩니다. |
| `linkClass` | `.link_class(..)` | `string \| (link: SankeyLink, index: number) => string` | 없음 | 각 리본의 클래스입니다. 모든 리본에 같은 값을 주거나, 링크와 `links`에서의 인덱스에 대한 함수를 줄 수 있습니다. |
| `linkStyle` | `.link_style(..)` | `StyleProp<ViewStyle>` | 없음 | 모든 리본의 스타일이며, 클래스 위에 적용됩니다. |
| `linkBackgroundClass` | `.link_background_class(..)` | `string \| (link: SankeyLink, index: number) => string` | 없음 | 각 리본 배경의 클래스(`bg-*`, 그라디언트: `bg-linear-to-r from-… to-…`)입니다. 소스에서 타깃까지의 박스 위에서 리본 안쪽에 표시되며 `fill` 아래에 놓입니다. 배경이 있으면 리본의 `fill`은 지정하지 않았을 때 `none`입니다. |
| `linkBackgroundStyle` | `.link_background_style(..)` | `StyleProp<ViewStyle>` | 없음 | 모든 리본 배경의 스타일이며, 클래스 위에 적용됩니다. |
| `hoverDim` | `.hover_dim(..)` | `number` (0에서 1) | `0` | 포인터 아래 노드에 연결되지 않은 링크가 얼마나 페이드되는지를 불투명도에 대한 비율로 나타냅니다. 플롯의 `pointer` 스프링으로, 호버의 페이드와 함께 실행됩니다. |
| `nodeLabel` | `.node_label(..)` | `keyof T \| (d: T, index: number) => string` | 없음 | 각 노드 옆의 이름입니다. 필드이거나, 노드의 행과 인덱스에 대한 함수입니다. |
| `valueLabel` | `.value_label(..)` | `(d: T, value: number, index: number) => string` | 없음 | 이름 아래에 표시되는 각 노드 옆의 값입니다. 노드의 행과, 노드로 들어오거나 나가는 흐름 중 큰 쪽(링크 값 기준이며 `valueScale`와 무관)에 대한 함수입니다. |
| `nodeLabelClass` | `.node_label_class(..)` | `string` | 없음 | 각 레이블의 클래스이며 `nodeLabel` 파트입니다. 패딩은 노드와의 간격이고, 텍스트 스타일은 두 줄 모두에 적용됩니다. |
| `nodeLabelStyle` | `.node_label_style(..)` | `StyleProp<TextStyle>` | 없음 | 각 레이블의 스타일이며, 클래스 위에 적용됩니다. |
| `valueLabelClass` | `.value_label_class(..)` | `string` | 없음 | 값 줄의 클래스이며 `valueLabel` 파트입니다. 레이블의 클래스 위에 적용됩니다. |
| `valueLabelStyle` | `.value_label_style(..)` | `StyleProp<TextStyle>` | 없음 | 값 줄의 스타일이며, 클래스 위에 적용됩니다. |

노드와 리본은 `fill`(지정하지 않으면 `currentColor`)로 채우고 `stroke`(지정하지 않으면 없음)로 스트로크하며, CSS가 상속하는 방식대로 sankey와 플롯의 값 위에 각자의 값이 적용됩니다. 흐름이 지나가지 않는 노드는 높이가 한 점입니다. 레이아웃은 링크, 옵션 또는 플롯의 크기가 바뀔 때만 다시 실행되며, 포인터나 appear 때문에 다시 실행되지는 않습니다. 플롯의 크기가 바뀌어도 아무것도 움직이지 않습니다. 순환을 이루는 링크나 플롯에 없는 행을 가리키는 링크는 아무것도 그리지 않고 경고를 기록합니다. 이 값들은 플롯의 스케일에 전혀 관여하지 않습니다.
## Treemap

`Treemap`는 플롯의 행을 중첩된 사각형의 계층 구조로 그립니다. 각 행이 하나의 노드이며, 행의 `id`와 그것이 가리키는 `parent`가 트리를 이룹니다(d3의 `stratify`). 각 리프의 면적은 `value`에 비례하고, 각 그룹은 그 아래에 있는 것들을 감싸는 상자이며 그 값은 리프 값의 합입니다(그룹 자신의 행이 가진 값과는 무관합니다). `parent`가 없거나 부모가 어떤 행도 가리키지 않는 행은 최상위 노드입니다. `id`가 없으면 행의 id는 그 인덱스이므로 `parent`도 인덱스로 행을 가리킬 수 있습니다. gpt-vis가 쓰는 중첩 형태의 트리(`{ name, value, children }`)는 앱에서 몇 줄이면 행으로 만들 수 있으며, 레벨 수에는 제한이 없습니다.

타일은 d3의 `treemapSquarify`처럼 스퀘어화됩니다. 각 레벨의 노드를 값 순서대로, 큰 것부터 왼쪽 위(`sort="value"`)에서 배치하며, 종횡비 `ratio`(황금비)에 가깝게 만듭니다. `sort="data"`는 행의 순서를 유지하므로 값이 바뀌어도 노드가 제자리를 지킵니다. `paddingInner`는 형제 노드 사이의 간격이며 부모의 바깥 가장자리에는 생기지 않습니다. `paddingOuter`는 그룹 안쪽에서 자식 주변의 여백이고, `paddingTop`는 각 그룹 상단에서 `groupLabel`가 쓰이는 띠입니다. 각각 모든 레벨에 적용되는 숫자 하나 또는 최상위 레벨부터 내려가는 레벨별 숫자를 받습니다(`[3, 1]`: 최상위 노드 사이는 3, 그 아래는 1). 한 레벨의 띠는 한 부모의 모든 형제에 적용되거나 아무에게도 적용되지 않으며, 형제 중 하나라도 띠를 넣기에 너무 작으면 생략되므로 한 레벨의 그룹은 서로 같게 보입니다.

값이 0이거나 0보다 작거나 숫자가 아닌 리프는 면적을 차지하지 않습니다. 그려지지 않고, 레이블이 없으며, 포인터로도 찾을 수 없습니다. 리프가 모두 그런 그룹도 마찬가지입니다. 트리맵의 면적은 전체에 대한 몫이므로, 제외된 항목은 앱이 자체 문구(맵 아래의 주석)로 알려 줍니다. 음수는 색상용입니다. 시장 맵의 일간 등락이 그 예입니다.

노드의 색은 플롯의 `colorScale` 중 해당 행의 값에서 나옵니다. `colorValue`는 램프를 따르는 숫자(`sequential`, `diverging`: 하락은 빨강, 상승은 초록, 보합은 중립이며, `domain`가 없으면 값의 범위 전체에 걸칩니다)이고, `color`는 카테고리(`ordinal`: `"parent"`는 한 그룹의 리프에 같은 색을 줍니다)입니다. 리프는 `leaf` 파트(`leafClass`, `leafStyle`)이고 그룹은 `group` 파트(`groupClass`, `groupStyle`)이며, 클래스나 스타일이 있을 때만 그려집니다. 자식 아래의 사각형으로서 간격, 패딩, 띠에 드러납니다. 각 파트는 모든 노드에서 같거나 노드 행의 함수입니다. `cornerRadii`는 모든 사각형의 모서리를 둥글게 합니다.

`label`는 각 리프의 이름을, `valueLabel`는 그 아래에 값을 씁니다. 둘 다 행과 그 값의 함수이며(그룹의 값은 리프의 합), 왼쪽 위(`labelPlacement="start"`) 또는 가운데(`"center"`)에 놓입니다. `label` 파트는 리프만큼 큰 상자로, 패딩은 리프 가장자리로부터의 여백이고 텍스트 스타일은 각 줄에 적용됩니다. 이름은 리프가 좁으면 말줄임표로 잘리고 들어맞을 때만 표시되며, 값은 전체가 표시되거나 아예 표시되지 않습니다. 리프의 색이 어두운 레이블에는 `data-dark` 속성이 붙으므로 `data-dark:text-white`로 짙은 빨강 위에서도 읽을 수 있게 합니다.

트리맵 위에서 플롯은 포인터 아래의 노드(`onHoverChange`, 노드의 행)를 보고합니다. 리프이거나, 띠나 패딩 위의 그룹입니다. 형제 사이의 간격 위에서는 둘 중 하나를 보고하여 호버가 깜박이지 않습니다. 나머지는 `inactiveOpacity`로 흐려지고(리프는 자신의 그룹을 유지하고, 그룹은 그 아래의 것을 유지합니다), `hover` 파트, 즉 노드만큼 큰 뷰가 노드의 윤곽을 그립니다. 화살표 키는 화면상 옆에 있는 리프로 이동하고, Home과 End는 첫 리프와 마지막 리프로 이동합니다. 플롯의 appear에서는 최상위 노드가 중앙에서부터 `stagger`로 차례로 커집니다. 행이 바뀌면 모든 노드가 `motion.update`로 새 상자와 색으로 이동하며, 노드는 `id`로 식별됩니다. 행에 새로 생긴 노드는 중앙에서 커지고, 사라진 노드는 자신의 중앙으로 줄어듭니다. 플롯의 x, y 스케일은 사용되지 않습니다.

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

| 속성 | Rust | 타입 | 기본값 | 설명 |
|---|---|---|---|---|
| `id` | `.id(..)` | `keyof T \| (d: T, index: number) => string` | 행의 인덱스 | 각 행 노드의 id입니다. `parent`가 가리키는 것이며, 행이 바뀔 때 노드를 식별하는 값입니다. |
| `parent` | `.parent(..)` | `keyof T \| (d: T, index: number) => string` | 없음: 모든 행이 최상위 노드 | 각 행의 부모 id입니다. 비어 있거나 어떤 행의 id도 아니면 최상위 노드입니다. |
| `value` | `.value(..)` | `keyof T \| (d: T, index: number) => number` | 필수 | 각 리프의 크기입니다. 그룹의 크기는 자식 크기의 합입니다. 0이거나 0보다 작거나 숫자가 아닌 리프는 면적을 차지하지 않습니다. |
| `sort` | `.sort(..)` | `"value" \| "data"` | `"value"` | 형제를 왼쪽 위부터 큰 순서로 배치하거나 행의 순서대로 배치합니다. |
| `ratio` | `.ratio(..)` | `number` | 황금비 | 타일이 근접하려는 종횡비이며, 최소 1입니다. |
| `paddingInner` | `.padding_inner(..)` | `number \| number[]` | `0` | 형제 사이의 간격(포인트 단위)이며, 최상위 레벨부터 레벨별로 지정합니다(마지막 값이 그 아래 레벨에 적용됩니다). |
| `paddingOuter` | `.padding_outer(..)` | `number \| number[]` | `0` | 각 그룹 안쪽에서 자식 주변의 여백이며, 레벨별로 지정합니다. |
| `paddingTop` | `.padding_top(..)` | `number \| number[]` | `0` | 각 그룹 상단에서 `groupLabel`가 쓰이는 띠이며, 레벨별로 지정합니다. 한 부모의 모든 형제에 적용되거나 전혀 적용되지 않습니다. |
| `cornerRadii` | `.corner_radii(..)` | `number \| { topLeft?, topRight?, bottomRight?, bottomLeft? }` | 각진 모서리 | 사각형 각 모서리의 반경입니다. |
| `color` | `.color(..)` | `keyof T \| (d: T, index: number) => string` | 없음 | 각 노드의 카테고리이며, `ordinal` `colorScale`가 여기에 색을 부여합니다. |
| `colorValue` | `.color_value(..)` | `keyof T \| (d: T, index: number) => number` | 없음 | 각 노드의 숫자이며, `sequential` 또는 `diverging` `colorScale`가 이를 색으로 바꿉니다. |
| `leafClass` | `.leaf_class(..)` | `string \| (d: T, index: number) => string` | 없음 | 각 리프의 클래스(`fill-*`, `stroke-*`)이며, 모든 리프에 같거나 행의 함수입니다. |
| `leafStyle` | `.leaf_style(..)` | `StyleProp<ViewStyle>` | 없음 | 모든 리프의 스타일이며, 클래스보다 우선합니다. |
| `groupClass` | `.group_class(..)` | `string \| (d: T, index: number) => string` | 없음 | 각 그룹의 클래스이며, 자식 아래에 놓이는 사각형입니다. 그룹은 클래스나 스타일이 있을 때만 그려집니다. |
| `groupStyle` | `.group_style(..)` | `StyleProp<ViewStyle>` | 없음 | 모든 그룹의 스타일이며, 클래스보다 우선합니다. |
| `inactiveOpacity` | `.inactive_opacity(..)` | `number` (0~1) | 없음 | 호버된 노드 이외의 노드와 그 레이블의 불투명도이며, 호버의 페이드와 함께 적용됩니다. |
| `label` | `.label(..)` | `keyof T \| (d: T, index: number) => string` | 없음 | 각 리프 안의 이름이며, 한 줄로 표시되고 말줄임표로 잘립니다. |
| `valueLabel` | `.value_label(..)` | `(d: T, value: number, index: number) => string` | 없음 | 각 리프 안에서 이름 아래에 표시되는 값이며, 전체가 들어맞을 때만 표시됩니다. |
| `labelPlacement` | `.label_placement(..)` | `"start" \| "center"` | `"start"` | 레이블을 리프의 왼쪽 위 또는 가운데에 놓습니다. |
| `labelClass` | `.label_class(..)` | `string` | 없음 | 각 리프 레이블의 클래스이며, 리프만큼 큰 상자로서 패딩과 텍스트 스타일을 지정합니다. 어두운 리프에는 `data-dark:`가 붙습니다. |
| `labelStyle` | `.label_style(..)` | `StyleProp<TextStyle>` | 없음 | 각 리프 레이블의 스타일이며, 클래스보다 우선합니다. |
| `valueLabelClass` | `.value_label_class(..)` | `string` | 없음 | 값 줄의 클래스이며, 레이블의 클래스 위에 적용됩니다. |
| `valueLabelStyle` | `.value_label_style(..)` | `StyleProp<TextStyle>` | 없음 | 값 줄의 스타일이며, 클래스보다 우선합니다. |
| `groupLabel` | `.group_label(..)` | `keyof T \| (d: T, index: number) => string` | 없음 | 각 그룹의 띠 안에 표시되는 이름이며, 말줄임표로 잘립니다. |
| `groupLabelClass` | `.group_label_class(..)` | `string` | 없음 | 각 그룹 레이블의 클래스이며, 띠만큼 큰 상자입니다. |
| `groupLabelStyle` | `.group_label_style(..)` | `StyleProp<TextStyle>` | 없음 | 각 그룹 레이블의 스타일이며, 클래스보다 우선합니다. |
| `stagger` | `.stagger(..)` | `number` (0~0.95) | `0` | 최상위 노드가 차례로 나타나는 방식입니다. appear 중 노드들이 시작하는 구간의 비율입니다. |
| `hoverClass` | `.hover_class(..)` | `string` | 없음 | `hover` 파트의 클래스이며, 호버된 노드 위에 놓이는 노드만큼 큰 뷰입니다(`rounded-xs outline-2 outline-foreground`). |
| `hoverStyle` | `.hover_style(..)` | `StyleProp<ViewStyle>` | 없음 | 호버 파트의 스타일이며, 클래스보다 우선합니다. |

사각형은 `fill`(`colorScale`의 색, 설정이 없으면 `currentColor`)으로 채워지고 `stroke`(설정이 없으면 없음)로 선이 그어집니다. 노드 자체의 값이 트리맵과 플롯의 값보다 우선하며, CSS의 상속 방식을 따릅니다. 레이아웃은 행, 옵션, 플롯 크기가 바뀔 때만 다시 실행되며, 포인터나 appear로는 실행되지 않습니다. 플롯의 크기가 바뀌어도 아무것도 이동하지 않습니다. 중복된 `id`, 어떤 행도 가리키지 않는 `parent`, 자기 자신의 조상인 행은 경고를 한 번 기록합니다. 첫 번째 행이 id를 유지하고, 고아 노드는 최상위 노드가 되며, 순환은 그려지지 않습니다.

## PlotAxis

`PlotAxis`는 플롯의 한 가장자리를 그 가장자리가 가진 스케일의 눈금으로 레이블링합니다. 아래쪽과 위쪽 가장자리는 x 스케일의 눈금을, 왼쪽과 오른쪽 가장자리는 y 스케일의 눈금을 사용하며, d3의 `axisBottom`, `axisTop`, `axisLeft`, `axisRight`와 같습니다. 눈금은 스케일에서 나옵니다. `linear` 스케일에서는 둥근 값(도메인 안의 10의 거듭제곱의 1, 2, 5배)이고, `point` 또는 `band` 스케일에서는 행입니다. 레이블은 플롯의 레이아웃이 배치하는 텍스트이므로, 앱은 무엇을 읽을지와 어떻게 보일지를 정하고 레이아웃이 자리를 잡습니다. 각 레이블은 가장자리를 따라 자기 눈금의 중앙에 놓입니다. 아래쪽과 위쪽 가장자리에서는 첫 번째와 마지막 레이블이 플롯의 양 끝 안에 머무르는 데 필요한 만큼만 안쪽으로 이동합니다. 왼쪽과 오른쪽 가장자리 옆에서는 모든 레이블이 자기 눈금에 머물러 격자선의 레이블로 읽힙니다. 끝 근처의 레이블이 플롯의 위쪽이나 아래쪽 가장자리를 넘게 되는 경우, 플롯의 선형 y 스케일이 그 가장자리에서 그만큼 안쪽에서 시작하므로(끝에 있는 눈금은 레이블 높이의 절반) 모든 레이블이 격자선 위에서 플롯 안에 머뭅니다.

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

| 속성 | Rust | 타입 | 기본값 | 설명 |
|---|---|---|---|---|
| `placement` | `.placement(..)` | `"bottom" \| "top" \| "left" \| "right"` | `"bottom"` | 축이 따라 놓이는 가장자리입니다. 아래쪽과 위쪽 가장자리는 x 스케일의 눈금을, 왼쪽과 오른쪽 가장자리는 y 스케일의 눈금을 사용합니다. |
| `scale` | `.scale(..)` | `"y" \| "y2"` | `"y"` | 왼쪽 또는 오른쪽 축이 레이블링하는 y 스케일입니다. 플롯의 `yScale` 또는 두 번째 스케일 `y2Scale`입니다([이중 축](#dual-axes)). |
| `labelPlacement` | `.label_placement(..)` | `"outside" \| "inside"` | `"outside"` | 레이블이 놓이는 위치입니다. 가장자리 바깥, 즉 앱이 플롯 주위에 남긴 공간에 놓여 마크와 겹치지 않게 하거나, 가장자리를 따라 플롯 위에 놓여 플롯이 전체 크기를 유지합니다(왼쪽 또는 오른쪽 가장자리 옆에서는 각 레이블이 격자선의 위쪽에 놓입니다). |
| `ticks` | `.ticks(..)` | `number` | `linear` 스케일에서는 `10`(정렬된 스케일은 모든 단계), 그 외에는 모든 행 | 사용할 눈금의 대략적인 개수입니다. `linear` 스케일에서는 도메인 안의 둥근 값을 대략 이 개수만큼, `point` 또는 `band` 스케일에서는 첫 행부터 마지막 행까지 고르게 분산된 이 개수의 행을 사용합니다. |
| `tickValues` | `.tick_values(..)` | `number[]` | 없음 | 눈금의 값이며, `ticks` 대신 사용됩니다. 스케일의 값이고, `point` 또는 `band` 스케일에서는 행 인덱스입니다(`[0, 3, 6]`은 세 번째 행마다 레이블을 붙입니다). 도메인 안의 값에는 각각 눈금이 생깁니다. |
| `format` | `.format(..)` | `(value: number, index: number) => string` | 카테고리 밴드 스케일에서는 밴드의 카테고리, 그 외에는 눈금 간격에 필요한 소수 자릿수를 가진 값이며 천 단위로 구분 | 각 눈금의 텍스트입니다. 눈금의 값(`point` 또는 `band` 스케일에서는 행의 인덱스)과 축의 눈금 중 그 인덱스를 받는 앱의 함수입니다. |
| `labelClass`, `labelStyle` | `.label_class(..)`, `.label_style(..)` | `string`, `StyleProp<TextStyle>` | 없음 | `label` 파트입니다. 눈금마다 텍스트 하나이며, 글꼴, 색, 패딩은 앱이 정합니다. 플롯 쪽 패딩이 가장자리로부터의 거리입니다(아래쪽 축에서는 `pt-2`). |
| `tickClass`, `tickStyle` | `.tick_class(..)`, `.tick_style(..)` | `string`, `StyleProp<ViewStyle>` | 없음 | `tick` 파트입니다. 가장자리의 눈금마다 뷰 하나이며, 눈금의 중앙에 놓이고 레이블 쪽으로 뻗습니다(아래쪽 축에서는 `h-1 w-px bg-border`). 스타일을 지정하면 표시됩니다. |
| `lineClass`, `lineStyle` | `.line_class(..)`, `.line_style(..)` | `string`, `StyleProp<ViewStyle>` | 없음 | `line` 파트입니다. 레이블 쪽에서 가장자리 전체를 따라가는 뷰입니다(아래쪽 축에서는 `h-px bg-border`). 스타일을 지정하면 표시됩니다. |

바깥쪽 배치에서 레이블은 d3의 축이 차트의 마진에 놓이듯 플롯의 마진에 놓입니다. 플롯은 앱이 준 크기를 유지하고, 앱은 축 쪽에 레이블만큼 깊은 마진(`mb-6`, `pt-2 text-xs` 레이블이 아래에 있을 때)을 주거나 그곳에 부모의 패딩을 사용합니다. 한 가장자리에 있는 두 축은 각각 자기 값을 자기 스타일로 레이블링합니다. 범위의 양 끝은 흐리게, 중간은 더 진하게 표시하는 식입니다.

`format`는 눈금이나 함수가 바뀔 때 눈금마다 한 번씩 다음 턴에 호출되며, 플롯이 그려지거나 포인터를 따라가는 동안에는 호출되지 않습니다. 순수하게 유지하세요(같은 값에는 같은 텍스트). 이 함수가 없으면 눈금은 d3가 쓰는 방식대로 읽힙니다: `1,500`, `0.25`, `−2`. Rust에서는 `plot_axis()`가 축을 만들고, 그 `format`는 `TickFormat::from_fn(|value, index| ..)`입니다. 축은 포인터를 받지 않으며, 스크린 리더는 레이블이 아니라 플롯을 읽어 줍니다.
## PlotLabel

`PlotLabel` 컴포넌트는 플롯의 지점에 텍스트를 씁니다. 봉우리 위의 캡션, 선의 마지막 점에 붙는 태그, 그리드 선 끝의 메모가 그 예입니다. `texts`의 각 항목은 마크와 마찬가지로 플롯 스케일의 값으로 자신의 지점을 지정합니다. `point` 또는 `band` 스케일에서는 행의 인덱스(행 밴드의 중앙)를, `linear` 스케일에서는 값을 사용합니다. 텍스트의 위쪽 가장자리가 그 지점에 놓이며, `align` 값에 따라 텍스트는 그 지점에서 시작하거나, 지점을 중심으로 가운데 정렬되거나, 지점에서 끝납니다. 텍스트는 플롯의 레이아웃이 배치하므로 플롯의 크기를 따라가고, 스케일의 도메인(`motion.update`)에 맞춰 부드럽게 이동하며, appear와 함께 페이드 인됩니다.

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

| 속성 | Rust | 타입 | 기본값 | 설명 |
|---|---|---|---|---|
| `texts` | `.texts(..)` | `PlotText[]` | `[]` | 플롯이 쓰는 텍스트들이며, 각각 자신의 지점에 놓입니다. |
| `scale` | `.scale(..)` | `"y" \| "y2"` | `"y"` | 텍스트의 `y` 값이 속하는 y 스케일입니다([이중 축](#dual-axes)). |

각 텍스트는 `PlotText`입니다.

| 필드 | 타입 | 기본값 | 설명 |
|---|---|---|---|
| `text` | `string` | | 표시되는 내용입니다. |
| `x` | `number` | | x축에서의 위치입니다. x 스케일의 값이거나, `point` 또는 `band` 스케일에서 행의 인덱스입니다(`0.5` 값은 첫 번째 행과 두 번째 행의 중간입니다). |
| `y` | `number` | | y축에서 위쪽 가장자리가 놓일 위치입니다. y 스케일의 값입니다. |
| `align` | `"left" \| "center" \| "right"` | `"left"` | 지점을 기준으로 x 방향에서 놓이는 방식입니다. 지점에서 시작, 지점에 가운데 정렬, 지점에서 끝 중 하나입니다. |
| `class`, `style` | `string`, `StyleProp<TextStyle>` | 없음 | 라벨로부터 상속받은 값 위에 덧씌우는 텍스트 자체의 클래스와 스타일입니다. 텍스트의 박스(태그의 배경과 패딩)와 지점으로부터의 거리가 여기에 해당합니다. |

외형은 앱이 정합니다. 라벨의 `class` 설정으로 모든 텍스트에 상속되는 텍스트 스타일(글꼴, 크기, 색상)을 지정하고, 개별 텍스트의 `class` 및 `style` 설정은 해당 텍스트에만 스타일을 적용합니다. 텍스트는 `-translate-y-full` 사용 시 지점 위쪽에 놓이고, 패딩이 지점과의 간격이 됩니다(`pb-1`). 선의 마지막 점 옆에 놓이는 태그는 축의 라벨과 마찬가지로 앱이 그쪽에 남겨 둔 여백(`mr-12`)에 자리합니다. Rust에서는 `plot_label()` 호출로 라벨을 만들고, 각 텍스트는 `.align(PlotTextAlign::Center)`, `.class(..)`, `.style(..)` 항목을 가진 `PlotText::new(text, x, y)` 값입니다. 포인터는 텍스트를 통과해 플롯에 전달되며, 스크린 리더는 플롯을 읽습니다. 플롯의 `accessibilityLabel`이 텍스트가 가리키는 내용을 설명합니다.

<a id="motion"></a>

## 모션

모션은 앱이 정하며 기본적으로는 없습니다. 모든 것이 한꺼번에 표시됩니다. `motion` 속성은 [`nsh`](../modules/nsh.md#animation)의 타이밍(`{ duration, easing, delay }` 및 `{ stiffness, damping, mass }`)을 받습니다.

| 키 | 타입 | 움직이는 대상 |
|---|---|---|
| `appear` | 타이밍 | 마크가 `appearGeneration` 이징으로 그려집니다. 선과 영역은 앞쪽 가장자리에서부터, 막대는 밑변에서 자라나며(막대의 `stagger` 설정으로 차례로), 점은 없는 상태에서 자라나고(점의 `stagger` 설정으로 차례로), 셀은 중앙에서 자라납니다(셀의 `stagger` 설정으로 차례로). 파이와 호의 링은 시작 지점에서 시계 방향으로 펼쳐지고, 방사형 선은 안쪽 반지름에서 자라나며 점도 함께 자라납니다. 생키의 노드와 리본은 앞쪽 가장자리에서부터 그려지고 라벨은 페이드 인됩니다. |
| `update` | 타이밍 | 앱이 모양을 바꾸면 마크가 새 모양으로 이동합니다. 점은 새 값과 크기로 이동하며, 새 행의 점은 자라나고 사라진 행의 점은 줄어들며 사라집니다. 셀은 새 색상(OKLab에서 혼합)과 밴드로 이동하며, 새 행의 셀은 자라나고 사라진 행의 셀은 줄어들며 사라집니다. 파이와 호는 반지름이 움직여 도넛의 구멍이 열리고 닫히며, 각도가 움직여 게이지나 조각이 새 값으로 회전합니다(d3의 `arcTween`: 윤곽선이 아니라 각도가 움직이며, 새 조각은 앞 조각이 끝나는 지점에서 열리고, 움직이는 도중에 변경되면 그려진 위치에서 이어집니다). 방사형 선의 점은 새 값, 각도, 반지름으로 이동하고(새 행은 안쪽 반지름에서 자라남) 방사형 그리드의 링도 함께 움직입니다. 선형 스케일의 도메인(앱의 `domain` 또는 행이 들어옴에 따라 정해지는 마크 값의 범위)은 이전 값에서 새 값으로 부드럽게 이동하며, 마크, 그리드 선, `PlotAxis`, `PlotLabel`도 함께 움직입니다. 생키의 노드, 리본, 라벨은 이전 흐름의 레이아웃에서 새 레이아웃으로 이동하며, 움직이는 도중에 변경되면 그려진 위치에서 이어집니다. |
| `enter` | 타이밍 | 포인터가 플롯 위로 오면 호버 요소가 페이드 인됩니다. |
| `exit` | 타이밍 | 포인터가 벗어난 뒤 페이드 아웃됩니다. |
| `pointer` | 스프링 | 키보드나 스크린 리더로 호버를 이동할 때 한 행에서 다음 행으로 부드럽게 이동하며, 파이 조각은 이때 들립니다. |

호버 요소는 같은 프레임에서 포인터를 따라갑니다. 포인터가 움직이면 십자선, 점, 툴팁이 즉시 그 아래의 행으로 옮겨져 손의 움직임을 그대로 추적하며, 페이드 인과 페이드 아웃(`enter`, `exit`)만 여전히 애니메이션됩니다.

모션은 플랫폼의 애니메이터에서 실행되어 프레임마다 JS가 개입하지 않으며, 모션 감소를 요청한 사용자에게는 즉시 완료됩니다. 목록이 돌아온 행에 대해 플롯을 다시 만들면 플롯이 다시 그려지지만, 목록을 감싼 [`PlotAppearScope`](#plotappearscope)가 해당 appear의 완료를 본 경우는 예외입니다.

도메인은 d3가 스케일의 도메인을 전환하는 방식으로 움직입니다. 중간 단계의 스케일이 모든 값을 배치하므로 마크는 모양을 유지하고, 그리드 선과 호버 요소도 함께 움직이며, 막대는 모서리를 유지하고, 새 도메인과 함께 들어오는 행도 나머지와 함께 움직입니다. 행에 맞춰 이따금 y 스케일을 조정하는 실시간 차트(그리드가 조정 사이에 고정되도록 약간의 여유를 둠)는 각 새 조정 값으로 `update` 타이밍으로 부드럽게 이동합니다. 플롯의 크기가 바뀌면 마크는 새 크기를 즉시 취합니다.

이것은 플롯 자체의 모션, 즉 차트가 움직이는 대상의 타이밍입니다. 마크의 클립과 호버 요소가 여기에 해당합니다. 뷰의 등장, 퇴장, 주의 끌기 효과는 [`createMotion`](../modules/nsh.md#createmotion)의 프리셋과 키프레임이며, 앱은 이를 플롯의 뷰나 그 주변 요소에서 여전히 재생할 수 있습니다.

## PlotAppearScope

목록은 행이 다시 화면에 들어올 때마다 그 행의 플롯을 다시 만들므로, appear가 있는 스파크라인은 목록이 스크롤되어 돌아올 때마다 다시 그려집니다. 목록을 감싼 `PlotAppearScope`는 그 안에서 완료된 appear를 기억합니다. 그곳에서 다시 만들어진 플롯의 `appearGeneration` 모션이 이미 끝났다면 마크를 한꺼번에 완전한 모습으로 보여줍니다. 플롯은 generation으로 기억되므로 각 행의 플롯은 자신만의 generation을 가집니다. 이는 행의 키에 다시 재생을 일으켜야 할 값을 더한 것입니다(`` `${symbol} ${period}` ``).

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

| 속성 | Rust | 타입 | 기본값 | 설명 |
|---|---|---|---|---|
| `id` | `.id(..)` | `number \| string` | 없음 | 스코프가 기억하는 범위입니다. 이 값이 바뀌면 스코프는 기억을 지우고 플롯들은 그 자리에서 새로 그려집니다. 관심종목 목록이나 대화처럼 콘텐츠를 따라 이름을 지으세요. 지정하지 않으면 스코프는 표시되어 있는 동안 계속 기억합니다. |
| `children` | `.child(..)` | `JSX.Element` | 없음 | 스코프가 담는 내용입니다. 목록이거나, 플롯이 오가는 동안 플롯을 다시 만드는 무엇이든 가능합니다. |

새 generation은 여전히 플롯을 그리며, appear가 끝나기 전에 제거된 플롯도 처음부터 다시 그려집니다. 플롯이 새 generation을 끝내면 스코프는 그 이전 generation을 잊으므로, 이전 기간으로 다시 전환하면 플롯이 다시 그려집니다. 기억은 스코프와 함께 사라집니다. 더 이상 표시되지 않는 스코프나 새 `id`를 가진 스코프는 플롯을 새로 그리며, 플롯은 자신을 감싼 가장 안쪽의 스코프에 기억됩니다. 외형은 앱이 정합니다. `class`와 `style` 설정으로 다른 뷰와 같이 레이아웃합니다(화면을 채우는 목록을 감쌀 때는 `flex-1`). Rust에서는 `plot_appear_scope()` 호출로 만듭니다.

<a id="keyboard"></a>

## 키보드

인터랙티브 플롯은 Tab 이동 대상(macOS, 웹)이며, 키보드 포커스가 있는 동안 키로 포인터와 동일한 호버를 움직일 수 있습니다. 십자선, 점, 툴팁이 `pointer` 스프링으로 이동하고, 파이 조각이 들리며, `onHoverChange` 핸들러가 행을 보고하고, 스크린 리더는 앱이 이를 위해 제공하는 `accessibilityValue` 값을 읽습니다. 포커스 링은 앱이 정합니다. `focus-visible:` 클래스 또는 `focusStyle` 값(`focus-visible:outline-2 focus-visible:outline-ring`)을 사용합니다.

| 키 | 동작 |
|---|---|
| Right, Left | 해당 방향의 행으로 이동합니다. 다음 행 또는 이전 행으로 이동하며, 첫 행이 오른쪽에 있는 반전된 x 스케일에서는 반대 방향입니다(파이 위에서는 행 순서대로의 조각, 생키 위에서는 노드, 트리맵 위에서는 Up과 Down과 마찬가지로 화면상 옆에 있는 리프). 호버된 행이 없으면 Right는 왼쪽 끝의 행에서, Left는 오른쪽 끝의 행에서 시작합니다(파이 위에서는 첫 번째와 마지막 조각). |
| Home, End | 첫 번째 또는 마지막 행으로 이동합니다. |
| Up, Down | 셀 위에서는 같은 열에서 위 또는 아래의 셀로 이동합니다. 셀 위에서는 키가 화면상의 그리드를 따릅니다(WAI-ARIA의 data grid). Right와 Left는 행 방향으로 다음 셀로, Home과 End는 해당 줄의 첫 번째와 마지막 셀로 이동합니다. 호버된 셀이 없으면 첫 키는 왼쪽 위 셀에서 시작합니다(Left, Up, End는 오른쪽 아래 셀에서 시작). 가장자리에서는 호버가 그대로 유지됩니다. |
| Escape | 호버를 해제합니다. |

플롯은 포커스가 있는 동안 키에 반응하고, 행이 호버된 동안에는 Escape에 반응합니다. 그 밖의 경우에는 키가 앱과 주변 뷰로 전달됩니다. 포커스를 다른 곳으로 옮기면 키로 만든 호버가 해제됩니다. 플롯은 눌림을 받지 않으므로, 눌릴 수 있는 카드 안의 플롯은 카드가 눌림을 그대로 받게 둡니다. 스크린 리더도 행을 차례로 이동합니다. VoiceOver의 위/아래 스와이프, TalkBack의 앞/뒤 스크롤, 그리고 요소의 `increment` 및 `decrement` 동작을 제공하는 모든 스크린 리더가 다음 행과 이전 행으로 이동하며, 반전된 스케일에서도 행의 순서를 따릅니다.

<a id="building-charts"></a>

## 차트 만들기

차트는 플롯, 마크, 축, 그리고 그 주변의 앱 고유 요소로 구성됩니다. y 스케일에 `domain` 값을 주고 그 축에 그리드의 값(`tickValues`)을 주면 각 라벨이 해당 그리드 선에 놓입니다. 호버의 십자선, 점, 툴팁은 플롯의 일부이며 앱이 스타일을 지정하고 내용을 채웁니다. 행의 값은 앱이 표시하는 곳에 놓입니다.

그리드는 단단한 기준선을 둔 실선 헤어라인일 때 가장 잘 읽히며, 이렇게 하면 점선은 기준값(아래 예의 시가)을 나타내는 데 쓸 수 있습니다. 영역은 단색 채우기보다 기준선 쪽으로 갈수록 옅어지는 은은한 색조일 때 더 가볍게 읽힙니다. 각 시리즈의 호버 점은 해당 시리즈의 색을 사용하고, 차트가 놓인 표면의 색을 링으로 사용하여 선에서 도려낸 것처럼 보이게 합니다. 툴팁은 플롯의 위쪽에 놓이되 첫 행과 마지막 행에서는 가장자리 안쪽에 놓이며, 가장 높은 값 위에 여유를 둔 `domain` 설정으로 선과 겹치지 않게 합니다.

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

막대 차트는 막대의 끝은 둥글게, 밑면은 각지게 할 때(`cornerRadii={{ topLeft: 4,
topRight: 4 }}`; in a stack only on its top bar), a hair of room between the bars of a band (`groupPadding`) 가장 잘 읽힙니다. 또한 하나가 호버된 동안 다른 행의 막대는 흐리게(`inactiveOpacity`) 하고 그 밴드에는 색조를 입히며(`crossLineClass`), 값은 막대 위에 작은 탭 숫자로, 누적 막대에서는 합계를 위에 표시합니다. `paddingOuter` 값이 `paddingInner` 값의 절반이면 밴드의 중앙이 같은 간격으로 놓이고, `PlotAxis` 설정은 각 월을 밴드 아래 가운데에 맞추며, `maxBandWidth` 설정은 넓은 카드에서 소수의 막대를 좁게 유지합니다.

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

목록 행의 스파크라인은 `interactive={false}` 설정을 가진 플롯입니다. 마크만 그리고 포인터를 따르지 않습니다.

<a id="accessibility"></a>

## 접근성

- 플롯은 스크린 리더에게 하나의 요소이며 image 역할과 앱이 제공하는 `accessibilityLabel`을 가집니다. 마크, 축의 라벨, `PlotLabel`, 호버 요소는 플롯의 일부이며 스스로는 아무것도 말하지 않습니다. 라벨에는 차트가 보여주는 내용과 눈에 띄는 점(범위, 가장 높은 값)을 적고, 포인터 아래 행에 대한 문구를 `accessibilityValue` 값으로 제공하여 스크린 리더가 값이 바뀔 때마다 이를 읽도록 하세요.
- 포인터 아래의 행은 포인터가 있는 플랫폼(데스크톱, 웹, 트랙패드를 쓰는 iPad)에서 `onHoverChange` 이벤트로 보고됩니다. 터치 화면은 호버를 보고하지 않으므로, 터치 사용자에게 필요한 값은 앱의 자체 요소에 표시하거나, 숫자가 중요한 곳에서는 행을 텍스트나 목록으로 제공하세요.
- 파이 위에서 보고되는 행은 포인터 아래에 있는 조각의 행입니다. `accessibilityValue`에 조각의 이름, 값, 비율(`"Team, 340 seats, 34.0%"`)을 제공하고, 라벨에는 합계와 가장 큰 비율을 적으세요. 레이더 위에서는 포인터에 가장 가까운 축이 해당하며, 그 축의 이름과 각 시리즈의 해당 값을 제공하세요.
- 인터랙티브 플롯은 화살표 키로 호버를 움직이는 키보드 포커스 대상이며([키보드](#keyboard)), 스크린 리더가 행을 차례로 이동할 수 있도록 `increment` 및 `decrement` 동작을 제공합니다(VoiceOver는 이를 조절 가능한 요소로 읽습니다). `interactive={false}` 설정을 가진 플롯은 둘 다 해당하지 않으며, 어느 쪽이든 눌림을 받지 않습니다.

라벨과 역할에 대한 일반적인 내용은 [접근성](../docs/accessibility.md)을 참고하세요.
<a id="platform-notes"></a>

## 플랫폼 참고 사항

- 모든 플랫폼은 Rust에서 마크마다 기록한 하나의 드로잉으로 마크를 동일하게 그립니다. 행이 바뀌면 그 행을 읽는 마크들을 한 번에 일괄로 다시 그리고, 페인트 클래스(모양, `dark:`)가 바뀌면 드로잉을 다시 기록하지 않고 다시 보냅니다.
- appear 효과는 플랫폼의 애니메이터가 움직이는 값으로 선과 영역을 클리핑하고 막대를 키웁니다. 호버된 행에서 막대가 흐려지는 효과는 애니메이터가 호버 위치로부터 계산하는 불투명도입니다. 호버를 구성하는 요소들은 애니메이터가 움직이고 페이드하는 뷰이며, 애니메이터는 플롯의 크기와 툴팁의 크기로부터 툴팁이 플롯 안에 머물도록 위치를 정합니다.
- 영역의 배경은 영역 자체의 캔버스에 그려지며 영역의 모양으로 클리핑됩니다. 이때 플랫폼이 뷰의 `bg-linear-*`에 그리는 것과 동일한 그라디언트를 사용합니다. 클래스(모양, `dark:`)가 바뀌면 드로잉을 다시 기록하지 않고 다시 보냅니다.
- 파이는 각 슬라이스를 자체 캔버스에 그립니다. 포인터 아래에 있는 슬라이스는 Rust에서 슬라이스의 각도와 반지름으로 찾습니다. 슬라이스가 올라오는 효과는 반지름이고 나머지 슬라이스가 흐려지는 효과는 불투명도로, 둘 다 애니메이터가 움직입니다. appear의 스윕도 같은 방식으로 슬라이스의 각도를 움직이므로, 어느 쪽도 드로잉을 다시 기록하지 않습니다.
- 방사형 선에서 포인터 아래에 있는 행은 Rust에서 점들의 각도로 찾습니다. 호버 점은 애니메이터가 포인터 아래의 행에 배치하는 뷰이며(키가 바뀔 때 `pointer` 스프링으로 미끄러지듯 이동합니다), 선이 나타나거나 새 값으로 이동하는 동안 선의 점들은 애니메이터가 이전 위치에서 움직이는 숫자이므로, 선은 변경마다 한 번만 기록됩니다.
- 점 마크는 하나의 캔버스에 그려집니다. 포인터 아래에 있는 점은 Rust에서 점들의 중심과 반지름으로 찾으며, 호버 점은 애니메이터가 그 점 위에 같은 크기로 배치하는 뷰입니다. appear의 확대, 변경 시의 이동, 호버의 페이드는 애니메이터가 움직이는 값이므로, 점들은 변경마다 한 번만 기록됩니다.
- 셀 마크는 하나의 캔버스에 그려집니다. 포인터 아래에 있는 셀은 Rust에서 셀의 박스로 찾으며, 호버 셀은 애니메이터가 그 셀 위에 배치하는 뷰입니다. 확대, 변경 시의 색상 변화와 이동, 호버의 페이드는 애니메이터가 움직이는 값이므로, 셀은 변경마다 한 번만 기록됩니다. 각 레이블은 플랫폼의 텍스트이며, 레이아웃된 크기가 셀 안에 들어갈 때만 표시됩니다.
- 축의 레이블, 눈금 표시, 선은 플랫폼 자체의 텍스트와 뷰이며, Rust의 레이아웃이 플롯의 크기와 스케일로부터 배치합니다. 플롯의 크기가 바뀌면 마크와 함께 움직이고, 새 도메인이 지정되면 레이블을 다시 작성합니다.
