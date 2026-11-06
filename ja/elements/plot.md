---
title: "Plot"
description: "nsh/base/plot の Plot コンポーネント、およびそのマーク Line、Area、Bar、Rule、Dot、Cell、Grid、Pie、Arc、RadialLine、RadialGrid、Sankey、Treemap、さらに PlotAxis と PlotLabel について説明します。アプリの行データからネイティブに描画されるチャートで、軸のスケールとラベル、データポイント上のテキスト、ポインター下の行・セル・スライス、モーションに対応しており、独自の外観は持ちません。"
group: base
demo: el-plot
source_hash: 2aca4d23862b455b
---


# Plot

Plot はチャートの枠組みです。表示する行データ、x 軸と y 軸のスケール、その上のポインター、そしてその動きを受け持ちます。マークは Plot が保持するものを描画します。系列を通る`Line`、系列とベースラインの間の`Area`、バンドスケールのバンドごとに行ごとの`Bar`、開始から終了までの行ごとの`Rule`(ローソク足のヒゲ)、2つの値が交わる位置の行ごとの`Dot`(散布図の点、バブルチャートのバブル)、2つのカテゴリのバンドにおける行ごとの`Cell`を値で色付けしたもの(ヒートマップ)、横切る線の`Grid`、行のシェアの`Pie`(中央に穴のあるドーナツ)、2つの角度の間の`Arc`、中心の周りの`RadialLine`とその背後にある`RadialGrid`のリングとスポーク(レーダー)、行間のフローの`Sankey`、入れ子の長方形の`Treemap`(各葉の面積がその値、マーケットマップ)です。`PlotAxis`はスケールの目盛りで端にラベルを付け、`PlotLabel`はスケール上の点にテキストを書きます。各マークは Plot を埋める1枚のキャンバスで、行からネイティブに描画されます。アプリの行は設定時に一度だけ読み取られ、その後 Rust でスケーリング、記録、描画されるため、1000点のチャートでも点ごとの JS は実行されません。ポインターの追従も Rust で行われます。ホバーの十字線、ドット、ツールチップはプラットフォームのアニメーター上で動いてフェードし、アプリには新しい行だけが通知されます。見た目はアプリ次第です。マークは SVG シェイプ向けの CSS のペイントプロパティ(`stroke-*`、`fill-*`)で塗られ、何も設定されていない場合は`currentColor`が使われます。面や棒は図形の内側に背景(グラデーション、`bg-linear-*`)を表示でき、ホバーの部品(各マークのドットを含む)と軸のラベル、目盛り、線はアプリがスタイルを指定し、内容を埋めます。

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

`Plot`、`Line`、`Area`、`Bar`、`Rule`、`Dot`、`Cell`、`Grid`、`Pie`、`Arc`、`RadialLine`、`RadialGrid`、`Sankey`、`Treemap`、`PlotAxis`、`PlotLabel`は、独自の[`nsh/base`](../modules/nsh-base.md)のモジュールである`nsh/base/plot`から提供されます(Rust では`nsh_base::plot`)。TypeScript では、Plot の props は行の型に対してジェネリックです。フィールド名はその型に対して検査され、行の関数は行の型を受け取ります。Rust では、`plot()`が props ごとのセッターを持つ Plot を作り、行は`Rows`(キーごとの数値の列)、値は`RowAccessor`(キー、または行のインデックスの関数)で、マークは型付きのペイントメソッド(`.stroke_color(..)`、`.fill_color(..)`、`.stroke_width(..)`)を受け取ります。

## Plot

| プロパティ | Rust | 型 | デフォルト | 説明 |
|---|---|---|---|---|
| `data` | `.data(..)` | `T[]` | (必須) | 行データ。1点につき1つのオブジェクト。マークはアプリが行を設定したときに一度だけ値を読み取ります。値のない行(数値でないフィールド、`null`)はスキップされます。 |
| `x` | `.x(..)` | `keyof T \| (d: T, index: number) => number` | 行のインデックス | `linear`の x スケールで、行を x 軸のどこに置くかを決めるもの。`point`スケールは行を順番に配置します。 |
| `y` | `.y(..)` | `keyof T \| (d: T, index: number) => number` | なし | マークが独自に指定しない場合に描画するもの。 |
| `xScale` | `.x_scale(..)` | `Scale` | `{ type: "point" }` | x 軸が行を配置する方法: `point`(順番に、左端から右端まで均等に。1行の場合は中央)、任意の`domain`を伴う`linear`、または`band`(棒グラフ用に行ごとのバンド、[Bar](#bar)。またはセル用にカテゴリごとのバンド、[Cell](#cell))。`band`の y スケールでは、横向きの棒グラフ用に`linear`がデフォルトになります。`reverse: true`を指定すると右端から配置します([反転したスケール](#reversed-scales))。 |
| `yScale` | `.y_scale(..)` | `Scale` | `{ type: "linear" }` | y 軸が値を配置する方法: ドメインの最小値が下端、最大値が上端に来ます。`domain`がない場合は、マークが描画するものの範囲になります。`band`は横向きの棒グラフ用に、上端から下に向かって行ごとのバンドを敷きます。`reverse: true`は逆向きにします。最小値が上端、行は下端から上へ並びます([反転したスケール](#reversed-scales))。 |
| `y2Scale` | `.y2_scale(..)` | `LinearScale` | なし | それを指定するマーク(`scale="y2"`)用の2つ目の y スケール`{ type: "linear", domain?, reverse? }`。二重軸チャートの右側のスケールです([二重軸](#dual-axes))。`domain`がない場合は、そのスケール上の値の範囲になります。 |
| `alignTicks` | `.align_ticks(..)` | `boolean` | `true` | どちらの y スケールもドメインを指定しておらず、両方にマークがある間は、両者が同じキリのよい刻みに広げられ、目盛りが同じ線上に載ります([二重軸](#dual-axes))。`false`を指定すると、それぞれが値の範囲のままになります。 |
| `interactive` | `.interactive(..)` | `boolean` | `true` | Plot はポインターとキーボードに追従します。下にある行を通知してホバーの部品を表示し、Tab のストップとなって矢印キーでホバーを動かせます([キーボード](#keyboard))。`false`はマークだけを描画し(リスト内のスパークラインなど)、そこへのプレスは周囲のビューに渡ります。Plot がキーボードを提供するかどうかは、作成時に決まります。 |
| `motion` | `.motion(..)` | `PlotMotion` | なし | 出現アニメーションのタイミング、ホバーのフェードイン/アウト、キーでホバーを動かすときに乗るスプリング(後述)。 |
| `appearGeneration` | `.appear_generation(..)` | `number \| string` | なし | 出現アニメーションを有効にします。Plot が最初に表示されたとき、およびこの値が変わるたび(別のシンボル、別の期間)にマークが描き込まれます。[`PlotAppearScope`](#plotappearscope)内では、そこで完了済みの世代は一度に全体が表示されます。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | なし | スクリーンリーダーがチャートについて読み上げる内容: 何を表しているか、何が目立つか。 |
| `accessibilityValue` | `.accessibility_value(..)` | `{ min?, max?, now?, text? }` | なし | スクリーンリーダーがその値として読み上げる内容: ポインター下の行に対するアプリ独自の言葉。 |
| `crossLineClass`、`crossLineStyle` | `.cross_line_class(..)`、`.cross_line_style(..)` | `string`、`StyleProp<ViewStyle>` | なし | 十字線: Plot と同じ高さのビューで、ポインター下の行を中心に置かれます。バンドスケールでは行のバンド内に、バンドと同じ幅で配置されます(バンドの y スケールでは Plot を横断します)。 |
| `dotClass`、`dotStyle` | `.dot_class(..)`、`.dot_style(..)` | `string`、`StyleProp<ViewStyle>` | なし | ホバーのドット: `Line`、`Area`、`RadialLine`ごとのビューで、ポインター下の行のその点を中心に置かれ、`Dot`のものはポインター下でそのドットと同じ大きさになります。マークの`hoverDotClass` / `hoverDotStyle`は、そのマーク自身のドットについてこれらを置き換えます。 |
| `tooltipContent` | `.tooltip_content(..)` | `JSX.Element` | なし | アプリのツールチップ。`tooltipPlacement`によって配置され、十字線とともに移動・フェードします。 |
| `tooltipPlacement` | `.tooltip_placement(..)` | `"top" \| "pointer"` | `"top"` | ツールチップの置き場所: Plot の上部で十字線を中心にするか、ポインターの横で十字線の Plot 中央寄りの側に、上半分ではポインターの下、下半分では上に置きます。上部の場合は Plot の左端と右端の間に収まります(上端からのオフセットはアプリ次第で、Plot の下に置くタグは Plot の高さ以上を取ります)。ポインターの横の場合は Plot の内側に収まります。キーボード使用時は、その行における最初の線または面の点の横に置かれます(棒ならバンドの中央、円グラフならスライスの中央)。 |
| `tooltipOffset` | `.tooltip_offset(..)` | `number` | `0` | ツールチップと、それを配置する基準との距離: `"top"`では上端、`"pointer"`では十字線とポインター。 |
| `colorScale` | `.color_scale(..)` | `ColorScale` | なし | マークの色: `color`が読むカテゴリに対しては d3 の`scaleOrdinal`のように(`{ type: "ordinal", domain?, range, unknown? }`、[カテゴリによる色](#colors-by-category))、`Cell`の`value`が読む数値に対しては d3 の`scaleSequential`や`scaleDiverging`のようにランプに沿って決まります(`{ type: "sequential" \| "diverging", … }`、[ランプに沿った色](#colors-along-a-ramp))。 |
| `children` | `.child(..)` | `JSX.Element` | なし | マーク(順に重ねて描画)と、その上にアプリが重ねるもの。 |
| `class`、`style` | スタイルメソッド | `string`、`StyleProp<ViewStyle>` | なし | Plot のサイズと見た目。マークは CSS の継承と同様に、そのペイントプロパティを継承します。`focus:` / `focus-visible:`クラスと`focusStyle`がフォーカスリングを描きます。 |

| イベント | Rust | ペイロード | 発生タイミング |
|---|---|---|---|
| `onHoverChange` | `.on_hover_change(..)` | `{ index: number \| null }` | ポインターが別の行に移ったとき。x 軸方向でポインターに最も近い行(バンドが y 軸にだけある場合は y 軸方向)、その下にある[pie](#pie-and-arc)のスライス、中心が最も近い[dot](#dot)、その下にある[cell](#cell)(2つのセルの隙間ではより近い方)、または角度で最も近い[radial line](#radialline-and-radialgrid)の行のインデックスです。Plot を離れると`null`になります(円グラフ上ではそのスライスの範囲、放射状の線上ではその外半径の範囲)。 |

`Scale`は `{ type: "point"; reverse? } | { type: "linear"; domain?: [number, number]; reverse? } | { type: "band";
domain?: string[]; paddingInner?; paddingOuter?; maxBandWidth?; bandCount?; groupPadding?; reverse? }`. A `linear` スケールの`domain`は2つの値の範囲で、順序は問いません。値が1つのドメインはそれを中央に置きます。`band`スケールの`domain`はバンドのカテゴリを順に並べたものです([Cell](#cell))。その他のオプションは [Bar](#bar) にあります。

行の関数(`y={(d) => d.high - d.low}`)は、行または関数が変わったときに、行ごとに一度、次のターンで呼び出されます。Plot の描画中やポインター追従中には決して呼ばれません。純粋に保ってください(同じ行なら同じ数値)。フィールド名は JS を一切介さずに読み取られます。

<a id="reversed-scales"></a>

### 反転したスケール

`reverse: true`はスケールを反対の端から走らせます。visx のスケールが`reverse`を取り、d3 のスケールが逆向きに書かれた range を取るのと同様です。x 軸では、最初の行、またはドメインの最小値が右端に来ます。y 軸では、ドメインの最小値が上端に来て、行は下端から上へ並びます。スケール上に置かれるものはすべてそれに従います。マーク、棒のベースと伸びる向き、面のベースライン、グリッド線、`PlotAxis`の目盛り、ホバーが見つける行、矢印キー([キーボード](#keyboard))、新しいドメインへの移動です。棒は反転した`linear`の y スケールでは上端から垂れ下がり、横向きの棒は反転した`linear`の x スケールでは右端から左へ伸びます。

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

Plot の出現アニメーションでは、線と面は x スケールが始まる端から描き込まれ、反転している場合は右端からになります。

<a id="dual-axes"></a>

### 二重軸

<!-- demo: el-plot-dual -->

Plot は、価格の隣に出来高を、利益率の隣に売上を置くように、別の単位の値のための2つ目の y スケールを持てます。y に沿って値を配置するすべての部品が`scale`を取ります。`"y"`(デフォルト、Plot の`yScale`)または`"y2"`(その`y2Scale`)です。右側の`PlotAxis`に`scale="y2"`を付けるとラベルが付きます。

```tsx
<Plot data={days} xScale={{ type: "band", paddingInner: 0.3 }} class="mx-10 mb-6 h-44">
  <Grid class="stroke-border" />
  <Bar value="volume" class="fill-chart-2/50" />
  <Line y="close" scale="y2" class="stroke-chart-1 stroke-2" />
  <PlotAxis placement="left" format={(v) => `${v}M`} labelClass="pr-2 text-xs text-muted-foreground" />
  <PlotAxis placement="right" scale="y2" labelClass="pl-2 text-xs text-muted-foreground" />
</Plot>
```

各スケールのドメインは独立しています。アプリの`domain`、またはそのスケール上の値の範囲で、それぞれ`motion.update`で新しいドメインへ移動します。どちらのスケールもドメインを指定していない間、Plot は両方を同じ数のキリのよい刻み(1、2、5に10のべき乗を掛けた値、高さ約32ポイントにつき1刻み)で配置します。両方がゼロを含む場合、ゼロは両方で同じ線上に来ます。そうでない場合、ゼロから始まるスケール(出来高)は余分な刻みを上側に増やし、もう一方(価格)は両側に増やします。軸の目盛りはこれらの刻みで、`x`も`y`もない`Grid`はその位置に線を引くので、1つのグリッドが両方の軸に使えます。`alignTicks={false}`でこれをオフにできます。アプリが指定した`domain`は、両方のスケールをそのままにします。

ホバーが見つける行は1つです。各マークのドットは自身のスケール上に置かれ、読み出しはアプリが行い、`onHoverChange`が報告する行の両方の値を読み取ります。両方のスケールの棒は各バンド内で並んで立ち、`stack`は自身のスケール上の棒だけを積み上げます。`y2Scale`は線形です。y 軸にバンドがある Plot には2つ目の y スケールはありません。
<a id="line-area-and-grid"></a>

## Line、Area、Grid

| マーク | プロパティ | 型 | デフォルト | 説明 |
|---|---|---|---|---|
| `Line` | `y` | `string \| (d, index) => number` | プロットの `y` | 描画する内容。値を持つ行ごとに1点を描き、値のない行はスキップします。 |
| `Line`、`Area` | `data`、`x` | `T[]`、`string \| (d, index) => number` | プロットの行 | マーク自身の系列の行(x の値が異なるもの)。自身の `x` によってプロットのスケール上に配置されます(なければ行のインデックス)。 |
| `Line`、`Area` | `curve` | `"natural" \| "linear" \| "stepAfter"` | `"natural"` | 点を結ぶ方法。滑らかな曲線、直線セグメント、または次の行まで各値を保持する階段状。Area の下端も同じ曲線に従います。 |
| `Line` | `dot`、`dotClass`、`dotStyle` | `boolean`、`string`、`StyleProp<ViewStyle>` | `false` | すべての点に置くドット。点を中心に配置されるビューで、サイズ、背景、枠線はアプリが指定します。 |
| `Line`、`Area` | `hoverDotClass`、`hoverDotStyle` | `string`、`StyleProp<ViewStyle>` | プロットの `dotClass`、`dotStyle` | ポインターの下の行にある点に表示される、マーク独自のホバードット。各系列のドットはそれぞれの色になります。それぞれこのマークについてプロットの設定を置き換えます(プロットのサイズとリングの上にマークの色が適用されます)。`hidden` を指定すると何も表示しません。 |
| `Area` | `backgroundClass`、`backgroundStyle` | `string`、`StyleProp<ViewStyle>` | なし | 背景。図形を囲むボックス(最初の点から最後の点まで、最も高い点からベースラインまで、バンドの場合は下端の最も低い点まで)で、その背景(`bg-*`、`bg-linear-to-b from-… to-…`、`backgroundImage`)は図形の内側にのみ、`fill` の下に表示されます。背景を指定した場合、何も設定されていなければ `fill` は `none` になります。 |
| `Area` | `y1` | `string \| (d, index) => number` | プロットの `y` | 上端を構成するもの。 |
| `Area` | `y0` | `number \| string \| (d, index) => number` | y スケールの下端 | 下端。数値は y スケール上のベースラインを表し、フィールドまたは関数を指定すると行ごとに独自の下端値を持ち、Area がバンドになります(1日の最安値から最高値、予測の範囲など)。指定しない場合、Area は y スケールの最小値がある端に閉じます。通常は下端、反転したスケールでは上端です(上から垂れ下がる Area)。どちらかの端に値がない行はスキップされます。 |
| `Line`、`Area`、`Grid` | `scale` | `"y" \| "y2"` | `"y"` | 値が沿う y スケール。プロットの `yScale` または 2つ目の `y2Scale` です([二軸](#dual-axes))。 |
| `Grid` | `x` | `number[]` | なし | 縦線の位置。x スケールの値で指定します(`point` スケールでは行インデックス)。 |
| `Grid` | `y` | `number[]` | なし | 横線の位置。y スケールの値で指定します。`x` も `y` も指定しない場合、線はそのスケールの目盛りに従います。これは `PlotAxis` が `ticks` なしで線を置く位置です(横向きのバーでは x に沿う)。 |
| `Grid` | `ticks` | `number` | 軸のデフォルト | `x` も `y` も指定しない場合に描く線のおおよその本数。`PlotAxis` の `ticks` と同様です。 |
| `Line`、`Area` | `color` | `string \| (d, index) => string` | なし | 行のカテゴリ。色はプロットの `colorScale` から決まります。何も設定されていない場合、最初の行のカテゴリが line の `stroke`(area の `fill`)を決めます([カテゴリ別の色](#colors-by-category))。 |

各マークはプロットを埋めるように配置され、[SVG のペイントプロパティ](../modules/style-reference.md#svg-paint)で描画されます。CSS の継承と同様に、マーク自身の指定がプロットの指定より優先されます。

| マーク | 描画に使うもの | 未設定の場合 |
|---|---|---|
| `Line` | `stroke`、`strokeWidth`、`strokeDasharray` | `currentColor`、幅 1、実線 |
| `Area` | `fill`(`background` 部分に対して)。上端は `stroke`、`strokeWidth`、`strokeDasharray` | `fill` `currentColor`(背景がある場合は `none`)。ストロークなし |
| `Grid` | `stroke`、`strokeWidth`、`strokeDasharray` | `currentColor`、幅 1、実線。各線はデバイスピクセル単位に揃えられるため、細い線もくっきり表示されます |

`Line` または `Area` が描画する値(area の `y0`、つまりベースラインまたは各行の下端値も含む)は、プロットにドメインがない場合に y スケールのドメインを構成します。grid の値は構成しません。マークが再描画されるのは、描画内容(行、値、曲線、プロットのサイズやスケール、ペイント)が変わったときだけです。ポインターはホバーの各部分を動かしますが、マークを再描画することはありません。

バンドは、`y0` が行を読み取る `Area` です。上端は `y1` を通り、下端は `y0` を逆向きに通ります。どちらも area の `curve` を使い、appear では両方が先頭の端から描画されます。ホバードットは上端に置かれ、その上に重ねた `Line` が中央値を示します:

```tsx
<Plot data={days} y="close">
  <Area y1="high" y0="low" class="fill-chart-1/15" hoverDotClass="hidden" />
  <Line class="stroke-chart-1 stroke-2" />
</Plot>
```

`fill` はブラウザーと同じ CSS のもので、色を指します。line の下のグラデーションは area の背景です。これは、ページが図形の中にグラデーションを表示する方法(ボックスの `background-image` を `clip-path` の下に置く)と同じです。`backgroundClass="bg-linear-to-b from-chart-1/20 to-transparent"` は、area の最も高い点からベースラインに向かってフェードします。どのビューの背景とも同様に、テーマのトークンとアピアランスの色を使います。

## Bar

`Bar` は、`band` スケールの行のバンド内に行ごとに1本のバーを描きます。band の x スケールでは縦向き、band の y スケールでは横向きです(その場合 x スケールは `linear`)。各バーは `base` からもう一方のスケール上の行の値まで伸びるため、負の値は逆方向に伸び、値のない行にはバーがありません。値スケールが反転している場合、バーは上端から下へ、または右端から左へ伸び、バンドスケールが反転している場合は最初の行のバンドが右または下に置かれます([反転スケール](#reversed-scales))。

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

スタックに属さないバーは、各バンド内でマークの順に並んで配置されます。同じ `stack` を持つバーは積み重なり、各行のバーはスタック内で直前のバーが終わる位置から始まります:

```tsx
<Bar value="online" stack="sales" class="fill-chart-1" />
<Bar value="store" stack="sales" class="fill-chart-2" cornerRadii={{ topLeft: 4, topRight: 4 }} label={(d) => `${d.online + d.store}`} />
```

| プロパティ | 型 | デフォルト | 説明 |
|---|---|---|---|
| `value` | `string \| (d, index) => number` | プロットの `y` | 各バーが表示する内容。 |
| `base` | `number \| string \| (d, index) => number` | `0` | 値スケール上でバーが伸び始める値。全行共通の1つの値、またはフィールドか関数で行ごとに指定でき、その場合各バーは行の基準値から値まで伸びます(基準値のない行にはバーがありません)。ドメインに含まれます。スタックは、行ごとに最初のバーの基準値から伸びます。 |
| `stack` | `string` | なし | 参加するスタック。同じ `stack` を持つバーが順に積み重なります(値のない行は何も加えません)。 |
| `scale` | `"y" \| "y2"` | `"y"` | 縦向きバーの値が沿う y スケール([二軸](#dual-axes))。両方のスケールのバーは並んで配置され、スタックはそのスケール上のバーのみを積み重ねます。 |
| `cornerRadii` | `number \| { topLeft?, topRight?, bottomRight?, bottomLeft? }` | `0` | バーの各角の半径。`{ topLeft: 4, topRight: 4 }` は縦向きバーの先端を丸めます。バーの半分より大きい半径はバーに収まるよう調整されます。 |
| `stagger` | `number` | `0` | プロットの appear 時、バーはこの割合(0〜0.95)の時間をかけて行ごとに順次開始し、それぞれ残りの時間で伸びます。0 の場合はすべて同時に伸びます。 |
| `inactiveOpacity` | `number` | なし | ポインターがプロット上にある間、ポインター下の行以外のバーの不透明度。その行が際立ちます。ホバーに合わせてフェードイン・アウトし、バーからバーへ移ります。 |
| `label` | `string \| (d, index) => string` | なし | 各バーの値側の端に表示するテキスト。フィールド(そのテキストまたは数値)、またはアプリが整形したテキストを返す関数。 |
| `labelClass`、`labelStyle` | `string`、`StyleProp<TextStyle>` | なし | `label` パート。バーに中央揃えされたテキストで、縦向きバーの端の上(下向きに伸びるバーでは下)、横向きバーの後ろ(逆向きに伸びるバーでは前)に置かれます。パディングがバーからの距離になります。 |
| `backgroundClass`、`backgroundStyle` | `string`、`StyleProp<ViewStyle>` | なし | 背景。各バーのボックスで、その背景(`bg-linear-to-t from-… to-…`、バーの下端から上端へ)はバーの内側にのみ、`fill` の下に表示されます。背景を指定した場合、何も設定されていなければ `fill` は `none` になります。 |
| `color` | `string \| (d, index) => string` | なし | 各バーのカテゴリ。色はプロットの `colorScale` から決まります。何も設定されていない場合はバーの `fill` になります([カテゴリ別の色](#colors-by-category))。 |

band スケールは、d3 の `scaleBand` と同様に、プロットの行ごとに順番にバンドを配置するか、`domain` のカテゴリごとにバンドを配置します:

| オプション | デフォルト | 説明 |
|---|---|---|
| `domain` | なし | バンドのカテゴリを順に指定します(d3 の `scaleBand().domain()`)。[`Cell`](#cell) は行のカテゴリのバンドに入り、`PlotAxis` は各バンドのカテゴリを書き出します。同じカテゴリが2回書かれた場合は最初の位置が保持されます。指定しない場合、バンドは行になります。セルの場合は、セルが軸に沿って指定するカテゴリが、行が渡す順に並びます。 |
| `paddingInner` | `0` | 隣り合うバンド間の隙間。各バンドのステップに対する割合(0〜1)。 |
| `paddingOuter` | `0` | 最初のバンドの前と最後のバンドの後ろの隙間。ステップに対する割合。`paddingInner` の半分にすると、バンドの中央がプロット全体で等間隔になります。 |
| `maxBandWidth` | なし | バンドの最大幅(ポイント単位)。幅の広いプロットで少数のバンドがあっても細いままで、それぞれの場所の中央に配置されます。 |
| `bandCount` | 行 | 行より多い場合に、軸が配置される対象のバンド数。行は先頭のバンドを使い、行が追加されても幅と位置を保ちます。 |
| `groupPadding` | `0` | バンド内で並ぶバー間の隙間。各バーの場所に対する割合。 |
| `reverse` | `false` | バンドが逆の端から始まります。x 軸では最初の行が右、y 軸では下になります。バンド内で並ぶバーの順序は保たれます。 |

バーは `fill`(`fill-*`。CSS の継承と同様にプロットから継承)で描画され、未設定の場合は `currentColor`(`color` がある場合はそのカテゴリの色)になり、ホバードットは表示しません。band スケールでは、ホバーはポインター下のバンドを検出し、プロットのクロスラインはそのバンド内にバンドと同じ幅で置かれます。`crossLineClass="w-full h-full bg-foreground/5"` はバンドに色を付け、`w-px` は中央に線を保ちます。プロットにドメインがない場合、バーの値と基準値が値スケールのドメインを構成します。プロットの appear では、各バーはスタックの基準から伸びます。動き、フェード、スライドはプラットフォームのアニメーター上で実行され、ポインターがバーを再描画することはありません。

<a id="ranges"></a>

### 範囲

<!-- demo: el-plot-ranges -->

`base` にフィールドまたは関数を指定すると、各バーは行の2つの値にまたがります。たとえばウォーターフォールの1ステップは直前の累計から直後の累計まで、ローソク足の実体は始値から終値まで、タスクは開始から終了までです。バーは表示時に自身の基準から伸び、ラベルは値側の端に置かれます。上昇するバーでは上、下降するバーでは下です。

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

ファネルは中央揃えの横向きバーです。band の y スケールで `base={(d) => -d.users / 2}` と `value={(d) => d.users / 2}` を使います。

## Rule

`Rule` は、値軸に沿って行ごとに `base` から行の値まで直線を1本描きます。band スケールでは行のバンドの中央(band の y スケールではプロットを横切る)、point または linear スケールでは x 軸に沿った行の位置です。ローソク足のヒゲ、箱ひげ図のひげ、エラーバー、ロリポップの軸は rule です。ローソク足チャートは `Rule` の上に `Bar` を重ねたものです:

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

| プロパティ | 型 | デフォルト | 説明 |
|---|---|---|---|
| `value` | `string \| (d, index) => number` | プロットの `y` | 各線の終点。値のない行には線がありません。 |
| `base` | `number \| string \| (d, index) => number` | `0` | 各線の始点。全行共通の1つの値(ロリポップの軸はゼロラインから)、またはフィールドか関数で行ごとに指定します(ローソク足の安値など)。ドメインに含まれます。 |
| `scale` | `"y" \| "y2"` | `"y"` | 値が沿う y スケール([二軸](#dual-axes))。 |
| `stagger` | `number` | `0` | プロットの appear 時、線はこの割合(0〜0.95)の時間をかけて行ごとに順次開始し、それぞれ残りの時間で始点から伸びます。 |
| `inactiveOpacity` | `number` | なし | ポインターがプロット上にある間、ポインター下の行以外の線の不透明度。`Bar` と同様です。 |
| `color` | `string \| (d, index) => string` | なし | 各線のカテゴリ。色はプロットの `colorScale` から決まります。何も設定されていなければ線の `stroke` になります。 |

rule は `stroke`(`stroke-*`、`strokeWidth`、`strokeDasharray`。CSS の継承と同様にプロットから継承)でストロークされ、未設定の場合は `currentColor` になり、ホバードットは表示しません。プロットにドメインがない場合、その値と基準値が値スケールのドメインを構成します。プロットの appear では始点から伸び、スケールのドメインに合わせて動きます。これらはプラットフォームのアニメーター上で実行されます。
## Dot

<!-- demo: el-plot-dots -->

`Dot` は、行の 2 つの値が交わる位置に、行ごとに 1 つのドットを描画します。行の `x` を `linear` の x スケールに沿わせ、`value` を y 軸の上方向に取ると散布図になります。band の x スケールでは、各ドットは行の band の中央に置かれます。band の y スケール(x スケールは `linear`)では、値は x に沿い、行の band はプロットの下方向に並び、ドットプロットになります。半径 `r` は、全ドット共通の 1 つの数値にすることも、行ごとの値を `rScale` が半径に変換するようにすることもでき、後者はバブルチャートになります。値のない行にはドットが描画されません。

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

`r` にフィールドまたは関数を指定すると、各行の値がそのドットの大きさを決めます。`rScale={{ type: "sqrt", range: [min, max] }}` は、d3 の `scaleSqrt` と同様に、値の平方根をポイント単位の半径に対応付けます。そのため、range が 0 から始まる場合、バブルの面積は値に比例します。range が 0 より大きい値から始まる場合は、最小のバブルも見えたままになります。スケールで domain を指定しない限り、domain は 0 から最大値までです。大きいドットを先に描画するため、小さいドットはその上に重なって見えたままになります。

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

プロットに domain がない場合、ドットの値が値スケールの domain になります。このとき 0 を含めようとはしないため、散布図の軸はその点に合わせて収まります。ドットが大きい場合は、値の周囲に余裕を持たせた `domain` をプロットに指定してください。domain の端にあるバブルは、プロットの端をまたいで描画されます。

同じ band に 2 つのマークを重ねると、行の 2 つの値を比較するチャートになります。ロリポップチャートは、0 から値まで伸びる `Rule` の下に、その値の位置の `Dot` を置いたものです。ダンベルチャートは、band の y スケール上で、一方の値からもう一方の値まで伸びる `Rule` の両端に `Dot` を置いたものです。

```tsx
<Plot data={stocks} yScale={{ type: "band", paddingInner: 0.3 }} xScale={{ type: "linear", domain: [-50, 80] }} class="h-48">
  <Rule value="high" base="low" class="stroke-border stroke-2" />
  <Dot value="before" r={3.5} class="fill-card stroke-muted-foreground" hoverDotClass="hidden" />
  <Dot value="now" r={5} class="fill-chart-1 stroke-card stroke-2" hitRadius={24} />
</Plot>
```

| プロパティ | 型 | デフォルト | 説明 |
|---|---|---|---|
| `value` | `string \| (d, index) => number` | プロットの `y` | 値の軸に沿った各ドットの位置。y 軸の上方向、または band の y スケールでは x に沿った位置です。値のない行にはドットが描画されません。 |
| `r` | `number \| string \| (d, index) => number` | `3` | ドットの半径(ポイント単位)、または各行に値を与えるフィールドか関数。その値を `rScale` が半径に変換します(指定がない場合は値がそのまま半径になります)。値が欠けている行にはドットが描画されません。 |
| `rScale` | `{ type: "sqrt"; domain?: [number, number]; range: [number, number] }` | なし | `r` の値を半径に変換する方法。値の平方根を `domain`(指定がない場合は 0 から最大値まで)から半径の `range` に対応付けます。そのため、range が 0 から始まる場合、各ドットの面積は値に比例します。domain の外にある値は、range の端の値になります。 |
| `stagger` | `number` | `0` | プロットの appear に合わせて、ドットは行ごとに順番に成長し始めます。この割合(0 から 0.95)の時間をかけて行われ、0 の場合はすべてが同時に成長します。 |
| `inactiveOpacity` | `number` | なし | ポインターまたはキーが 1 つのドットの上にあるとき、このマークの他のドットの不透明度。ホバーに合わせてフェードインとフェードアウトします。 |
| `color` | `string \| (d, index) => string` | なし | 各ドットのカテゴリ。プロットの `colorScale` から色が決まります。何も設定されていない場合は、ドットの `fill` になります([カテゴリによる色](#colors-by-category))。 |
| `hitRadius` | `number` | `8` | ドットの端からどれだけ離れてもポインターがそのドットを見つけられるか。この距離内にあるドットのうち、中心がポインターに最も近いものが見つかります(Voronoi セル)。そのため、大きなバブルの上にある小さなバブルは、それ自身の中心付近で見つかります。ドットプロットの行は、半径が行の幅と同じ大きさであれば、行に沿ったどこからでも見つかります。 |
| `scale` | `"y" \| "y2"` | `"y"` | 値が沿う y スケール([Dual axes](#dual-axes))。band の y スケール上のドットは、値を x に沿って配置します。 |
| `hoverDotClass`, `hoverDotStyle` | `string`, `StyleProp<ViewStyle>` | プロットの `dotClass`, `dotStyle` | `hoverDot` パーツ。ポインターの下にあるドットと同じ幅と高さのビューで、そのドットを中心に配置されます。`rounded-full outline-2 outline-offset-1` はそれを囲む輪を描き、`hidden` はこのマークでは何も表示しません。 |

ドットは `fill`(`fill-*`。CSS の継承と同様にプロットから継承されます)で塗りつぶされ、指定がない場合は `currentColor`(カテゴリの色に `color` を適用したもの)で塗りつぶされます。また、指定がある場合は `stroke`(`stroke-*`、`strokeWidth`)で縁取られます。カードの色の輪を使うと、重なり合うドットを区別できます。ドットのあるプロットでは、中心がポインターに最も近いドットの行がプロットから通知されます(どのドットからも離れている場合は `null`)。キーは行をその順番どおりに移動します(行を x でソートしておけば、キーはドットを左から右へたどります)。また、`hoverDot` パーツがドットを示します。プロットの appear では、ドットは何もない状態から成長します。`motion.update` を指定すると、ドットは新しい値とサイズへ移動し、新しい行のドットは成長しながら現れ、削除された行のドットは縮んで消えます。これらはすべてプラットフォームのアニメーターで実行され、マークの再描画は行われません。

## Cell

<!-- demo: el-plot-cells -->

`Cell` は、行ごとに 1 つの矩形を 2 つの band で同時に描画します。`x` のカテゴリの band は `band` の x スケール上に、`y` のカテゴリの band は `band` の y スケール上にあり、行がグリッドを構成するヒートマップになります。相関行列、月次リターンのカレンダー、時間ごとの 1 週間の取引は、いずれも Cell で表せます。各セルは 2 つの band を満たすため、スケールの `paddingInner` と `paddingOuter` がセルの間と周囲の隙間になります。セルの色は、プロットの `colorScale`(色のランプ。[ランプに沿った色](#colors-along-a-ramp))に沿った `value` で決まります。あるいは、序数スケールによる `color` のカテゴリの色になります。Cell はプロットの x スケールと y スケールの上に配置されます。

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

band スケールの `domain` は、d3 の `scaleBand().domain()` と同様に、band のカテゴリを順番に指定します。たとえばカレンダーの月は 1 月から 12 月まで、その行があるかどうかにかかわらずそれぞれの band を持つため、上の 2026 年 3 月はグリッド上の空白になります。domain がない場合、band は軸に沿ってセルが指定するカテゴリで、行が渡された順に並びます(上の例では 2025 の上に 2026)。カテゴリの band スケールに沿った `PlotAxis` は、`format` なしで各 band のカテゴリを表示します。

相関行列では、両方の軸に同じ銘柄が並び、`domain` が係数の全範囲になります。そのため、銘柄にかかわらず、係数 0 はランプの中央の色になります。

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

| プロパティ | 型 | デフォルト | 説明 |
|---|---|---|---|
| `x` | `string \| (d, index) => string` | なし | 各行の列。フィールド(そのテキストまたは数値)、またはカテゴリを返す関数です。行のセルは x スケールのそのカテゴリの band に置かれ、値のない行にはセルがありません。 |
| `y` | `string \| (d, index) => string` | なし | 各行の行位置。y スケールに沿った `x` として扱われます。 |
| `value` | `string \| (d, index) => number` | なし | 各セルの数値。`sequential` または `diverging` の `colorScale` がこれを色にします。値のない行にはスケールの `unknown` の色が使われ、それもない場合はセルがありません。 |
| `color` | `string \| (d, index) => string` | なし | 各セルのカテゴリ。`ordinal` の `colorScale` から色が決まります([カテゴリによる色](#colors-by-category))。 |
| `cornerRadii` | `number \| { topLeft?, topRight?, bottomRight?, bottomLeft? }` | `0` | セルの各角の半径。 |
| `stagger` | `number` | `0` | プロットの appear に合わせて、セルは行ごとに順番に成長し始めます。この割合(0 から 0.95)の時間をかけて行われ、各セルは残りの時間をその中央から成長します。0 の場合はすべてが同時に成長します。 |
| `inactiveOpacity` | `number` | なし | ポインターまたはキーが 1 つのセルの上にあるとき、他のセルとそのラベルの不透明度。ホバーに合わせてフェードインとフェードアウトします。 |
| `label` | `string \| (d, index) => string` | なし | `label` パーツ。各セルの中央に表示するテキストで、フィールド(そのテキストまたは数値)、またはアプリが整形したテキストを返す関数です。各ラベルは、レイアウトされたサイズがセル内に収まる場合にのみ表示されるため、幅の狭いプロットでは色だけが表示されます。 |
| `labelClass`, `labelStyle` | `string`, `StyleProp<TextStyle>` | なし | ラベルのフォント、サイズ、色。`colorScale` の色が暗いセルのラベルには、属性 `data-dark`(明るいテキストのほうが読みやすい場合)が付くため、`data-dark:text-white` はそこで明るい色で表示します。 |
| `hoverCellClass`, `hoverCellStyle` | `string`, `StyleProp<ViewStyle>` | なし | `hoverCell` パーツ。ポインターまたはキーの下にあるセルと同じ大きさのビューで、そのセルの上に重なります。`rounded-sm outline-2 outline-foreground` はそれを囲む輪を描きます。ポインターには同じフレームで追従し、キーで移動する場合は `pointer` のスプリングで滑らかに移動します。 |

セルは、アプリが `fill` を設定していない場合はプロットの `colorScale` の色で塗りつぶされます(`fill-*` のクラスとスタイルが優先され、CSS の継承と同様にプロットから継承されます)。何も設定されていない場合は `currentColor` で塗りつぶされ、指定がある場合は `stroke` で縁取られます。セルのあるプロットでは、ポインターの下にあるセルの行がプロットから通知され、2 つのセルの間の隙間では近いほうのセルの行が通知されます。矢印キーは画面上のグリッドに沿って移動し([Keyboard](#keyboard))、スクリーンリーダーは行をその順番どおりにたどります。プロットの appear では、セルはそれぞれの中央から成長します。`motion.update` を指定すると、セルの色は新しい色へ滑らかに変化し、新しい行のセルは成長しながら現れ、削除された行のセルは縮んで消え、セルは新しい band へ移動します。これらはすべてプラットフォームのアニメーターで実行され、マークの再描画は行われません。
<a id="pie-and-arc"></a>

## Pie と Arc

`Pie` は、1周を行ごとのスライスに分割します。各スライスは行の値に占める割合に応じた大きさで、12時の位置から時計回りに、行の順に、プロットの中心の周りに並びます。`innerRadius` を指定するとドーナツになります。各スライスはそれぞれ独立したキャンバス、つまり `slice` パートであり、それぞれ自身のクラスで描画されます。`sliceClass` は全スライスに同じクラスを適用するか、スライスの行の関数として各スライスに個別のクラスを与えます。パイの上では、プロットはポインター下のスライスの行を報告し（穴の中やリングの外では行なし）、ツールチップはポインターに追従し、そのスライスは `hoverLift` だけ拡大し、他のスライスは `hoverDim` だけフェードします。これはプラットフォームのアニメーター上で、プロットの `motion` を使って行われます。`Arc` は2つの角度の間の1つの扇形を描きます。ゲージのトラックと値、またはパイの背後のリングなどに使います。

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

| マーク | プロパティ | Rust | 型 | デフォルト | 説明 |
|---|---|---|---|---|---|
| `Pie` | `value` | `.value(..)` | `keyof T \| (d: T, index: number) => number` | プロットの `y` | 各行の値。値が 0、負、または数値でない行にはスライスがありません。 |
| `Pie`, `Arc` | `startAngle`, `endAngle` | `.start_angle(..)`, `.end_angle(..)` | `number`（ラジアン） | `0`, `2 * Math.PI` | 最初のスライスの開始位置と最後のスライスの終了位置（アークの両端）。12時の位置から時計回りのラジアンで指定します。`endAngle` が `startAngle` より小さいと、パイのスライスは逆向きに配置されます。 |
| `Pie` | `padAngle` | `.pad_angle(..)` | `number`（ラジアン） | `0` | リムでの隣り合うスライス間の角度。各ギャップはどの半径でもその幅（約 `padAngle * outerRadius` ポイント）を保ち、両端は平行なので、中心や穴でもリムと同じ幅になります。中心まで届かないほど狭いスライスは、両端が交わる位置で終わります。スライスが1つのパイにはギャップがありません。 |
| `Pie`, `Arc` | `innerRadius`, `outerRadius` | `.inner_radius(..)`, `.outer_radius(..)` | ``number \| `${number}%` `` | `0`, `"100%"` | 穴とリムの半径。ポイント、またはプロットが収まる最大の円（短辺の半分）に対するパーセンテージで指定します。 |
| `Pie`, `Arc` | `cornerRadius` | `.corner_radius(..)` | `number` | `0` | 各スライス（アークの場合はアーク）の角の半径。ポイントで指定します。d3 の `arc.cornerRadius` と同様に、各角はエッジとリムまたは穴に接する円で、ギャップの平行なエッジも含みます。最大値はリングの厚みの半分で、このときアークには丸いキャップがつきます。2つの完全な角を収められないほど狭いスライスでは、角は中央で合わさります。完全なリングは丸いエッジだけを保ちます。 |
| `Pie` | `sliceClass` | `.slice_class(..)` | `string \| (d: T, index: number) => string` | なし | 各スライスのクラス（`fill-*`, `stroke-*`）。全スライス共通にするか、スライスの行とインデックスの関数にします。関数は、行または関数が変わったときに行ごとに1回呼び出されます。 |
| `Pie` | `sliceStyle` | `.slice_style(..)` | `StyleProp<ViewStyle>` | なし | すべてのスライスのスタイル。クラスの上に適用されます（`fill`, `stroke`, `strokeWidth`）。 |
| `Pie` | `hoverLift` | `.hover_lift(..)` | `number` | `0` | ポインター下のスライスが他のスライスよりどれだけ外側に拡大するか（ポイント）。プロットの `pointer` スプリングを使い、ホバーに合わせてフェードイン・アウトします。 |
| `Pie` | `hoverDim` | `.hover_dim(..)` | `number`（0 から 1） | `0` | 1つのスライスがポインター下にある間、他のスライスがどれだけフェードするか。不透明度に対する割合で、ホバーのフェードに合わせて変化します。 |
| `Pie` | `color` | `.color(..)` | `keyof T \| (d: T, index: number) => string` | なし | 各スライスのカテゴリ。プロットの `colorScale` から得られる色になります。何も設定されていない場合はスライスの `fill` が使われます（[カテゴリによる色](#colors-by-category)）。 |
| `Pie` | `label` | `.label(..)` | `string \| (d: T, index: number) => string` | なし | 各スライスの横に表示するテキスト。フィールド（その数値）、またはアプリが整形したテキストを返す関数で指定します。テキストが空の行、または 0.5 度より狭いスライスにはテキストがありません。 |
| `Pie` | `labelClass`, `labelStyle` | `.label_class(..)`, `.label_style(..)` | `string`, `StyleProp<TextStyle>` | なし | `label` パート。リングの外側、引き出し線の端に置かれるテキストで、その端を中心に配置され、パイの右半分では線の後ろ、左半分では線の前に置かれます。パディングは線の端からの距離です。 |
| `Pie` | `labelGap` | `.label_gap(..)` | `number` | `15` | ラベルがリムからどれだけ外側に置かれるか（ポイント）。 |
| `Pie` | `labelLineClass`, `labelLineStyle` | `.label_line_class(..)`, `.label_line_style(..)` | `string \| (d: T, index: number) => string`, `StyleProp<ViewStyle>` | なし | `labelLine` パート。各ラベルの引き出し線で、スライスの中央のリムからラベルの半径まで外側に伸び、そこからテキストへ横に渡ります。その `stroke`（未設定の場合は `currentColor`）、`strokeWidth`、`strokeDasharray` は、全線共通にするか、スライスの行の関数にします。スタイルが設定されて初めて表示されます。 |

スライスとアークは `fill`（未設定の場合は `currentColor`。スライスの場合はカテゴリの色を `color` で指定）で塗りつぶされ、エッジは `stroke`（未設定の場合はなし）で縁取られます。いずれも、CSS の継承に従って、パイやプロットのものより自身のものが優先されます。サーフェスの色（`stroke-card stroke-2`）で縁取ると、スライスの間にもギャップができます。これらの値はプロットのスケールには関与しません。パイのスライスは、行、その値、角度、半径、プロットのサイズが変わったときにのみ再描画されます。ポインターによるリフトとフェードは、アニメーター上で動きます。

パイを含むプロットでは、通常ツールチップをポインターに合わせて配置します（`tooltipPlacement="pointer"`）。パイの行には軸上の位置がないためです。クロスラインとツールチップはパイの上でポインターに追従し、ホバードットは表示されません。ドーナツの中心は、プロットの上に重ねるアプリ独自の要素（ホバー中のスライスの値や合計）であり、凡例も同様で、各キーはそのスライスの色になります。

パイのラベルは、リングの外側でスライスに名前を付けます。各テキストは、スライスの中央方向（その半径でのスライスの重心）のリムから `labelGap` だけ外側に置かれ、そこからパイのスライス側のその半径まで横に渡り、スタイルを設定した引き出し線がリムとつなぎます。ラベルはプロットの appear でスライスとともに広がり、その終わりにかけてフェードインし、`motion.update` ではスライスとともに動き、ホバー中のスライスとともにリフトします。これらはすべてプラットフォームのアニメーター上で動作します。ラベルのための余白をプロットに確保してください。`outerRadius` を `"100%"` より小さくするか、プロットの周りに空間を設けます。スライスの位置に置くアプリ独自のコンテンツは、ドーナツの中心と同様に、プロットの上に重ねる要素です。

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

## カテゴリによる色

プロットの `colorScale` は、d3 の `scaleOrdinal` と同様にカテゴリへ色を割り当て、マークの `color` は各行のカテゴリを指定します。指定はフィールド（そのテキストまたは数値）か、行の関数で行います。`domain` のカテゴリは `range` の色を順に取り、ドメインのほうが長い場合は、レンジの最初の色から繰り返します。ドメイン外のカテゴリには `unknown` が使われます。それがない場合は、マークが最初にそのカテゴリに出会ったときにドメインに加わり（マークは順に、各マークの行も順に処理）、次の色を取ります。したがって `domain` がまったくない場合、カテゴリは行が持ち込む順に色を取ります。色はアプリのものであり、CSS の色（テーマのトークンを含む）を使えます。

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

スライス、バー、ドットは自身の行の色を取ります。`Line` と `Area` はそれぞれ1つの系列であり、最初の行の色を取ります。そのため、独自の行を持つ線（`data`）はその行の色になり、1つのスケールによってカテゴリの色はパイ、バー、線のあいだで同じに保たれます。何も設定されていない場合、色はマークの `fill`（線の場合は `stroke`）になり、`currentColor` の代わりに使われます。優先順位は、アプリのクラスとスタイルが最初で、次にパート（`sliceClass`, `sliceStyle`）、マーク、そしてプロットから継承されるものの順です。そのため、`sliceClass={(d) => (d.name === "Other" ? "fill-muted" : "")}` はスケールが他のスライスに色を付ける一方で、1つのスライスだけを別に設定できます。`background` パートがある場合、バーとエリアの `fill` は `none` のままです。

| `OrdinalScale` | 型 | デフォルト | 説明 |
|---|---|---|---|
| `type` | `"ordinal"` | （必須） | スケールの種類。 |
| `domain` | `string[]` | なし | カテゴリを順に並べたもの。2回書かれたカテゴリは最初の位置を保ちます。 |
| `range` | `string[]` | （必須） | 色を順に並べたもの（CSS の色）。カテゴリ `i` は色 `i % range.length` を取ります。 |
| `unknown` | `string` | なし | ドメイン外のすべてのカテゴリの色。指定しない場合、各カテゴリは次の色を取ります。 |

<a id="colors-along-a-ramp"></a>

### ランプに沿った色

`colorScale` に `type: "sequential"` または `"diverging"` を指定すると、d3 の `scaleSequential` と `scaleDiverging` と同様に、数値にランプに沿った色が割り当てられます。これは [`Cell`](#cell) の `value` 用です。`range` は、ランプの低い端から高い端まで均等に配置された2色以上の色で、その間は OKLab で混合されます。これにより、段階が目に均等に見え、2つの色相はそれぞれの混合を経て移り変わります。`domain` を超えた値はランプの端の色を取り、値のない行は `unknown` を取ります。

`sequential` は `domain` をランプ全体に広げます。アプリがドメインを指定しない限り、ドメインはセルの値の範囲になります。件数、ボリューム、アクティビティなどに向いています。`diverging` は `pivot`（デフォルトは 0）をランプの中央の色に置き、それより下の値は前半に、上の値は後半に沿って配置されます。損失は一方の色相、利益はもう一方の色相で表し、横ばいの月は中立の中央になります。アプリがドメインを指定しない場合、ドメインはピボットの両側で均等になるよう調整された値の範囲（Observable Plot の `symmetric`）になるため、同じ大きさの損失と利益は同じ強さで表示されます。相関行列では `domain: [-1, 1]` を指定します。

```tsx
colorScale={{ type: "sequential", range: [token("muted"), token("chart-1")] }}
colorScale={{ type: "diverging", pivot: 0, range: [token("destructive"), token("muted"), token("chart-1")] }}
```

| `SequentialScale`, `DivergingScale` | 型 | デフォルト | 説明 |
|---|---|---|---|
| `type` | `"sequential" \| "diverging"` | （必須） | ランプの種類。 |
| `domain` | `[number, number]` | 値の範囲（`diverging` ではピボットを中心に均等化） | ランプの両端の値。 |
| `pivot` | `number` | `0` | `diverging` のみ：ランプの中央の色の値。 |
| `range` | `string[]` | （必須） | ランプに沿った色。低い端から高い端の順（CSS の色）で、その間は OKLab で混合されます。 |
| `unknown` | `string` | なし | 値のない行の色。指定しない場合、その行にはセルがありません。 |
<a id="radialline-and-radialgrid"></a>

## RadialLine と RadialGrid

`RadialLine` は、プロットの中心の周りに系列を描画します。レーダーの多角形や、ダイヤルに沿った線などです。値を持つ各行は、その行の角度にある点となり、プロットの y スケールがその値に対応させる距離、つまり `innerRadius`（ドメインの最小値）から `outerRadius`（最大値）までの位置だけ中心から外側に置かれます。`angle` がない場合、行は12時の位置から時計回りに、順番に一周へ等間隔で並ぶので、6行なら六角形になります。`closed` は最後の点を最初の点につなぎます。線は点をストロークし、その面を `innerRadius`（デフォルトは中心）まで塗りつぶすので、1つのマークでレーダーの輪郭とその塗りの両方になります。`RadialGrid` は、その背後にレーダーのグリッドを描画します。y スケールの値に置かれる `rings`、行の角度を通る多角形または `circular`、そして各行へ伸びる `spokes` です。放射状の線の上では、プロットは、線の外半径の内側でポインターの角度に最も近い角度を持つ行を報告し、各線のホバードットはその行の点の上に置かれます。

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

| マーク | プロパティ | Rust | 型 | デフォルト | 説明 |
|---|---|---|---|---|---|
| `RadialLine` | `radius` | `.radius(..)` | `keyof T \| (d: T, index: number) => number` | プロットの `y` | 各行を中心からどれだけ外側に置くかを決めるものです。y スケールの値で、ドメインの最小値では `innerRadius`、最大値では `outerRadius` の位置になります。値のない行はスキップされます。 |
| `RadialLine` | `angle` | `.angle(..)` | `keyof T \| (d: T, index: number) => number` | 行を一周に等間隔で配置 | 各行を中心の周りのどこに置くかを指定します。12時の位置から時計回りのラジアンです。 |
| `RadialLine`, `RadialGrid` | `startAngle`, `endAngle` | `.start_angle(..)`, `.end_angle(..)` | `number`（ラジアン） | `0`, `2 * Math.PI` | `angle` がない場合に行を置く位置です。`startAngle` から等間隔に並びます。一周全体では、行は一周の `1 / rows` ずつ離れ、最後の行は最初の行の1ステップ手前に置かれます。一周の一部では、最初の行が `startAngle` に、最後の行が `endAngle` に置かれます。 |
| `RadialLine`, `RadialGrid` | `innerRadius`, `outerRadius` | `.inner_radius(..)`, `.outer_radius(..)` | ``number \| `${number}%` `` | `0`, `"100%"` | y ドメインの最小値と最大値を置く位置です。ポイント、またはパイの半径のように、プロットが収められる最大の円（短い方の辺の半分）に対する割合で指定します。線の面は `innerRadius` まで塗りつぶされ、グリッドのスポークは両者の間を通ります。 |
| `RadialLine` | `curve` | `.curve(..)` | `"linear" \| "natural" \| "stepAfter"` | `"linear"` | 点のつなぎ方です。直線セグメント、滑らかな曲線（閉じている場合は滑らかなループ）、またはステップから選びます。 |
| `RadialLine` | `closed` | `.closed(..)` | `boolean` | `false` | 最後の点から最初の点へ戻って続けます。レーダーの多角形がこれです。開いている場合、その面は中心（または内側の縁に沿って）で閉じます。 |
| `RadialLine` | `dot`, `dotClass`, `dotStyle` | `.dot(..)`, `.dot_class(..)`, `.dot_style(..)` | `boolean`, `string`, `StyleProp<ViewStyle>` | `false` | すべての点に置くドットです。点を中心にしたビューで、そのサイズ、背景、枠線はアプリが指定します。ドットは線とともに外側へ伸び、移動します。 |
| `RadialLine` | `backgroundClass`, `backgroundStyle` | `.background_class(..)`, `.background_style(..)` | `string`, `StyleProp<ViewStyle>` | なし | 線の背景です。外側の円を囲むボックスで、その背景（`bg-*`、グラデーション）は、面の場合と同様に、面の内側で `fill` の下にのみ表示されます。 |
| `RadialLine` | `hoverDotClass`, `hoverDotStyle` | `.hover_dot_class(..)`, `.hover_dot_style(..)` | `string`, `StyleProp<ViewStyle>` | プロットの `dotClass`, `dotStyle` | ポインターの下にある行の点に置かれるホバードットです。ポインターも同じフレームに入り、キーで移動したときはプロットの `pointer` スプリングで次の行へ滑らかに移動します。`hidden` を指定するとドットは表示されません。 |
| `RadialGrid` | `rings` | `.rings(..)` | `number[]` | なし | リングを置く位置を y スケールの値で指定します。各リングは、放射状の線がその値を置く位置と同じ距離だけ外側に置かれます。 |
| `RadialGrid` | `spokes` | `.spokes(..)` | `boolean` | `false` | 各行の角度で `innerRadius` から `outerRadius` まで引かれる線です。 |
| `RadialGrid` | `circular` | `.circular(..)` | `boolean` | `false` | リングを円（一周の一部では円弧）にします。デフォルトでは、リングは行の角度を通る多角形になり、プロットの行が3つ未満の間は円になります。 |

放射状の線は `stroke`、`strokeWidth`、`strokeDasharray` でストロークし（未設定の場合は `currentColor`、幅1の実線）、面は `fill` で塗りつぶします（未設定の場合は塗りなし）。放射状のグリッドは、通常のグリッドと同じようにストロークします。これらのペイントはプロットから継承されます。プロットに y ドメインがない場合、線の値と 0 から y スケールのドメインが作られるので、正の値のレーダーは中心から広がります。グリッドのリングはドメインの決定には関与しません。値が変化してもリングとレーダーのスケールを固定したい場合は、プロットに y `domain` を指定してください。

レーダーの周りのラベルは、ドーナツの中心と同様に、プロットの上に重ねるアプリ側の要素です。`angle` がない場合、`n` 行中の行 `i` は12時の位置から `a = 2π·i / n` の角度に置かれます。そのため正方形のプロットでは、`left: 50% + r·sin(a)`、`top: 50% − r·cos(a)`（`r` は、外半径の割合の半分より少し外側を指す、プロットの辺に対する割合）に置いたサイズのないボックスが縁の外側の位置を示し、名前はそこから中心と反対の方向へ伸びます。右半分ではその右、左半分ではその左、上端ではその上、下端ではその下に配置されます。上記の例も同様です。

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

`Sankey` は、プロットの行の間のフローを描画します。各行がノードとなり、`links` が行間のフロー `{ source, target, value }` with the indices of two rows in the plot's `data` を指定します。レイアウトは d3-sankey と同じ方式で、プロットのサイズの中に行います。ノードは列（`nodeAlign`）に並び、各ノードの高さは、そこへ流入または流出する量の大きい方に比例します。列内のノードは `nodePadding` ずつ離れ、`iterations` 回のパスでフローに向けて緩和されます。リンクごとに、ソースの右端からターゲットの左端へのリボンが描かれ、その幅は両端でそれぞれのノードの辺に占める割合に比例します。そのため、流入と流出が異なるノードでも、両側がすべて覆われます。各列はプロットの中央に配置され、等しい単一ノードの列が続く場合は、間のリボンが曲がるように少しずらされます。`valueScale="sqrt"` は値の平方根でサイズを決めるので、1つの支配的なフローが小さなフローを圧倒することがありません。

各ノードと各リボンはそれぞれ独立したキャンバスで、`node` パートと `link` パートにあたり、それぞれ独自のクラスで描画されます。`nodeClass` はすべてのノードに共通のクラス、またはノードの行の関数で、`linkClass` はすべてのリボンに共通のクラス、またはリンクの関数です。`linkBackground` パートは各リボンの内側に背景を表示します。ソースからターゲットまでのボックスで、リンクの関数を指定すると、各リボンにソースの色からターゲットの色へのグラデーションを付けられます。リボンはノードの下に描画され、どちらもプロットの appear に合わせて先頭の端から描き込まれます。

サンキー上では、プロットはポインターの下のノードを報告し（`onHoverChange`、ノードの行。リボンの上では何も報告しません）、ツールチップはポインターに追従し、そのノードにつながっていないリンクは、プラットフォームのアニメーターで、プロットの `motion` とともに `hoverDim` だけフェードします。キーはノードを行の順に移動し、ツールチップは各ノードの中央の横に表示されます。`nodeLabel` は各ノードの名前を、`valueLabel` はその値を示し、両方が設定されている場合は名前の上に値が表示されます。ラベルは、最初の列のノードでは左、最後の列では右、その間の列では上に中央揃えで配置され、これは `gpui-component` のチャートの配置と同じです。ノードの横のラベルはプロットの上端と下端の間に収まり、プロットの端を越えるラベルは、アプリがその周囲に残した余白（マージン）に配置されます。`nodeLabel` パートのパディングはノードまでの間隔、そのクラスはテキストのスタイルです（`max-w-20 truncate` は長い名前を切り詰めます）。ラベルは appear に合わせてフェードインします。アプリがフローを変更すると、すべてのノードとリボンが、プロットの `motion.update` で古い位置から新しい位置へ移動し、ラベルも一緒に動きます。フローに新しく加わったノードは中央から成長し、新しいリンクは最小幅から成長し、なくなったものはすぐに消えます。移動中に変更があった場合は、描画されている現在の位置から続けます。リンクはソースとターゲットで区別されるので、`links` の順序を入れ替えても何も動きません。

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

| プロパティ | Rust | 型 | デフォルト | 説明 |
|---|---|---|---|---|
| `links` | `.links(..)` | `SankeyLink[]`（`{ source: number; target: number; value: number }`） | 必須 | フローです。行 `source` から行 `target`（プロットの `data` でのインデックス）へ、`value` がその大きさです。数値でない値や0未満の値は何も運ばず、リボンも描画されません。 |
| `nodeWidth` | `.node_width(..)` | `number` | `24` | 各ノードの幅（ポイント）。 |
| `nodePadding` | `.node_padding(..)` | `number` | `8` | 列内のノード間の間隔（ポイント）。混み合いすぎた列ではそれより小さくなります。 |
| `nodeAlign` | `.node_align(..)` | `"justify" \| "left" \| "right" \| "center"` | `"justify"` | 各ノードを置く列で、d3-sankey と同じです。最初の列からの深さ（`"left"`）、フローが許す限り右に寄せる（`"right"`）、深さのままでフローを始めるだけのノードをターゲットの隣に置く（`"center"`）、または深さのままでフローを終えるノードを最後の列に置く（`"justify"`）から選びます。 |
| `iterations` | `.iterations(..)` | `number` | `6` | ノードをフローに向けて緩和するパスの回数。 |
| `valueScale` | `.value_scale(..)` | `"linear" \| "sqrt"` | `"linear"` | 高さと幅を値に比例させるか、値の平方根に比例させるか。 |
| `minLinkWidth` | `.min_link_width(..)` | `number` | `1` | リボンが描画される最小の太さ（ポイント）。小さなフローも見えるままになります。 |
| `nodeCornerRadius` | `.node_corner_radius(..)` | `number` | `0` | 各ノードの角の半径（ポイント）。 |
| `nodeClass` | `.node_class(..)` | `string \| (d: T, index: number) => string` | なし | 各ノードのクラス（`fill-*`、`stroke-*`）です。すべてのノードに共通のクラス、またはノードの行とそのインデックスの関数を指定でき、関数は行または関数が変わったときに行ごとに1回呼び出されます。 |
| `nodeStyle` | `.node_style(..)` | `StyleProp<ViewStyle>` | なし | すべてのノードのスタイルで、クラスより優先されます。 |
| `linkClass` | `.link_class(..)` | `string \| (link: SankeyLink, index: number) => string` | なし | 各リボンのクラスです。すべてのリボンに共通のクラス、またはリンクと `links` でのそのインデックスの関数を指定できます。 |
| `linkStyle` | `.link_style(..)` | `StyleProp<ViewStyle>` | なし | すべてのリボンのスタイルで、クラスより優先されます。 |
| `linkBackgroundClass` | `.link_background_class(..)` | `string \| (link: SankeyLink, index: number) => string` | なし | 各リボンの背景（`bg-*`、グラデーション: `bg-linear-to-r from-… to-…`）のクラスです。ソースからターゲットまでのボックス上でリボンの内側に表示され、`fill` の下に置かれます。背景がある場合、リボンの `fill` は、未設定なら `none` になります。 |
| `linkBackgroundStyle` | `.link_background_style(..)` | `StyleProp<ViewStyle>` | なし | すべてのリボンの背景のスタイルで、クラスより優先されます。 |
| `hoverDim` | `.hover_dim(..)` | `number`（0 から 1） | `0` | ポインターの下のノードにつながっていないリンクを、その不透明度に対する割合でどれだけフェードさせるかです。プロットの `pointer` スプリングで、ホバーのフェードとともに動きます。 |
| `nodeLabel` | `.node_label(..)` | `keyof T \| (d: T, index: number) => string` | なし | 各ノードの横に表示する名前です。フィールド、またはノードの行とそのインデックスの関数を指定します。 |
| `valueLabel` | `.value_label(..)` | `(d: T, value: number, index: number) => string` | なし | 各ノードの横に名前の上に表示する値です。その行と、そのノードへ流入または流出する量の大きい方（リンクの値のままで、`valueScale` に関係しません）を受け取る関数です。 |
| `nodeLabelClass` | `.node_label_class(..)` | `string` | なし | 各ラベル（`nodeLabel` パート）のクラスです。パディングはノードまでの間隔となり、テキストスタイルは両方の行に適用されます。 |
| `nodeLabelStyle` | `.node_label_style(..)` | `StyleProp<TextStyle>` | なし | 各ラベルのスタイルで、クラスより優先されます。 |
| `valueLabelClass` | `.value_label_class(..)` | `string` | なし | 値の行（`valueLabel` パート）のクラスで、ラベルのクラスより優先されます。 |
| `valueLabelStyle` | `.value_label_style(..)` | `StyleProp<TextStyle>` | なし | 値の行のスタイルで、クラスより優先されます。 |

ノードとリボンは `fill`（未設定の場合は `currentColor`）で塗りつぶし、`stroke` でストロークします（未設定の場合はなし）。それぞれ、CSS の継承と同様に、サンキーやプロットの設定よりも自身の設定が優先されます。何も流れないノードの高さは1ポイントです。レイアウトが再実行されるのは、リンク、オプション、またはプロットのサイズが変わったときだけで、ポインターや appear では再実行されません。プロットのサイズが変わっても、何も動きません。循環するリンク、またはプロットにない行を指すリンクは、何も描画せず、警告をログに出力します。サンキーの値はプロットのスケールには関与しません。
## Treemap

`Treemap` は、プロットの行を入れ子になった長方形の階層として描画します。各行が1つのノードで、その `id` と、それが指す `parent` が木を作ります(d3の `stratify`)。各リーフの面積は `value` に比例し、各グループは配下のものを収める箱で、その値はリーフの値の合計です(グループ自身の行が持つ値にかかわらず)。`parent` のない行、または親がどの行も指していない行は、トップレベルのノードです。`id` がない場合、行のidはそのインデックスになるため、`parent` でもインデックスで行を指定できます。gpt-vis が書き出す入れ子形式のツリー(`{ name, value, children }`)は、アプリ側の数行で行に変換できます。階層の深さに制限はありません。

タイルは、d3の `treemapSquarify` と同様にスクォーキファイ(squarify)されます。各階層のノードは値の大きい順に左上から並べられ(`sort="value"`)、縦横比 `ratio`(黄金比)に近づけられます。`sort="data"` は行の順序を保つため、値が変わってもノードの位置は変わりません。`paddingInner` は兄弟ノード間の隙間で、親の外縁には設けられません。`paddingOuter` はグループ内で子の周囲に取る余白です。`paddingTop` は各グループの上部にある帯で、そこに `groupLabel` が書かれます。いずれも、全階層に共通の数値、または最上位から順に階層ごとに1つずつ指定します(`[3, 1]`: トップレベルのノード間は3、それより下は1)。階層ごとの帯は、親の兄弟すべてに付くか、まったく付かないかのどちらかで、小さすぎて収まらない場合は省かれます。そのため、同じ階層のグループは同じ見た目になります。

値が0、0未満、または数値でないリーフは面積を持ちません。描画されず、ラベルもなく、ポインターでも検出されません。リーフがすべてそのようなグループも同様です。
ツリーマップの面積は全体に対する割合なので、除外されたものは、アプリが自身の言葉で示します(マップの下の注記など)。負の値は色のためのものです。たとえば、マーケットマップの日次の騰落率です。

ノードの色は、プロットの `colorScale` に対する、その行の値で決まります。`colorValue` はランプ上の数値です(`sequential`、`diverging`: 下落は赤、上昇は緑、変化なしはニュートラル。`domain` がない場合は値の範囲全体が対象)。`color` はカテゴリです(`ordinal`: `"parent"` はグループのリーフを同じ色にします)。リーフは `leaf` パート(`leafClass`、`leafStyle`)、グループは `group` パート(`groupClass`、`groupStyle`)で、クラスまたはスタイルが指定された場合にのみ描画されます。これは子の下にある長方形で、隙間、パディング、帯の部分に表示されます。各パートは、すべてのノードで同じにするか、ノードの行の関数にします。`cornerRadii` はすべての長方形を丸めます。

`label` は各リーフの名前を、`valueLabel` はその下に値を書きます。これらは行とその値の関数です(グループの値は、そのリーフの合計)。位置は左上(`labelPlacement="start"`)または中央(`"center"`)です。`label` パートはリーフと同じ大きさのボックスで、そのパディングはリーフの端からの余白、テキストスタイルは各行のスタイルになります。名前は、リーフの幅が足りない場合は省略記号で切り詰められ、収まる場合にのみ表示されます。値は全体が表示されるか、まったく表示されないかのどちらかです。リーフの色が暗い場合、ラベルには属性 `data-dark` が付くため、`data-dark:text-white` により濃い赤の上でも読みやすさが保たれます。

ツリーマップの上では、プロットがポインター下のノード(`onHoverChange`、ノードの行)を報告します。対象はリーフ、またはグループの帯やパディングです。兄弟ノード間の隙間を横切るときは、いずれかの兄弟が対象となるため、ホバーがちらつきません。それ以外のノードは `inactiveOpacity` までフェードします(リーフは自分のグループを保ち、グループは配下のものを保ちます)。`hover` パート(ノードと同じ大きさのビュー)がそのノードの輪郭を描きます。矢印キーは画面上で隣のリーフへ移動し、Home と End は最初と最後のリーフへ移動します。
プロットの表示(appear)では、トップレベルのノードが中央から広がり、`stagger` で順に現れます。行が変わると、すべてのノードが `motion.update` で新しいボックスと色へ移動します。ノードは `id` で識別され、行に新しく加わったノードは中央から広がり、なくなったノードは自身の中央へ縮みます。プロットのxスケールとyスケールは使用されません。

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

| プロパティ | Rust | 型 | デフォルト | 説明 |
|---|---|---|---|---|
| `id` | `.id(..)` | `keyof T \| (d: T, index: number) => string` | 行のインデックス | 各行のノードのid。`parent` が指す対象であり、行が変わったときにノードを識別するものです。 |
| `parent` | `.parent(..)` | `keyof T \| (d: T, index: number) => string` | なし: すべての行がトップレベルのノード | 各行の親のid。空、またはどの行のidでもない場合は、トップレベルのノードになります。 |
| `value` | `.value(..)` | `keyof T \| (d: T, index: number) => number` | 必須 | 各リーフのサイズ。グループのサイズは子の合計です。0、0未満、または数値でないリーフは面積を持ちません。 |
| `sort` | `.sort(..)` | `"value" \| "data"` | `"value"` | 兄弟ノードを、左上から大きい順に並べるか、行の順序で並べます。 |
| `ratio` | `.ratio(..)` | `number` | 黄金比 | タイルが近づける縦横比。1以上。 |
| `paddingInner` | `.padding_inner(..)` | `number \| number[]` | `0` | 兄弟ノード間の隙間(ポイント単位)。最上位から順に階層ごとに指定します(最後の値がそれより下の階層に使われます)。 |
| `paddingOuter` | `.padding_outer(..)` | `number \| number[]` | `0` | 各グループ内で子の周囲に取る余白。階層ごとに指定します。 |
| `paddingTop` | `.padding_top(..)` | `number \| number[]` | `0` | 各グループの上部の帯で、その `groupLabel` のためのもの。階層ごとに指定し、親の兄弟すべてに付くか、まったく付かないかのどちらかです。 |
| `cornerRadii` | `.corner_radii(..)` | `number \| { topLeft?, topRight?, bottomRight?, bottomLeft? }` | 角丸なし | 長方形の各角の半径。 |
| `color` | `.color(..)` | `keyof T \| (d: T, index: number) => string` | なし | 各ノードのカテゴリ。`ordinal` の `colorScale` が色を与えます。 |
| `colorValue` | `.color_value(..)` | `keyof T \| (d: T, index: number) => number` | なし | 各ノードの数値。`sequential` または `diverging` の `colorScale` がその色にします。 |
| `leafClass` | `.leaf_class(..)` | `string \| (d: T, index: number) => string` | なし | 各リーフのクラス(`fill-*`、`stroke-*`)。すべてのリーフで同じにするか、その行の関数にします。 |
| `leafStyle` | `.leaf_style(..)` | `StyleProp<ViewStyle>` | なし | すべてのリーフのスタイル。クラスより優先されます。 |
| `groupClass` | `.group_class(..)` | `string \| (d: T, index: number) => string` | なし | 各グループのクラス。子の下にある長方形です。グループは、クラスまたはスタイルがある場合にのみ描画されます。 |
| `groupStyle` | `.group_style(..)` | `StyleProp<ViewStyle>` | なし | すべてのグループのスタイル。クラスより優先されます。 |
| `inactiveOpacity` | `.inactive_opacity(..)` | `number`(0〜1) | なし | ホバーされたノード以外のノードとそのラベルの不透明度。ホバーのフェードとともに適用されます。 |
| `label` | `.label(..)` | `keyof T \| (d: T, index: number) => string` | なし | 各リーフ内の名前。1行で、省略記号で切り詰められます。 |
| `valueLabel` | `.value_label(..)` | `(d: T, value: number, index: number) => string` | なし | 各リーフ内の値。名前の下に、全体が収まる場合にのみ表示されます。 |
| `labelPlacement` | `.label_placement(..)` | `"start" \| "center"` | `"start"` | ラベルをリーフの左上に置くか、中央に置くか。 |
| `labelClass` | `.label_class(..)` | `string` | なし | 各リーフのラベルのクラス。リーフと同じ大きさのボックスで、パディングとテキストスタイルを指定します。暗いリーフでは `data-dark:` が付きます。 |
| `labelStyle` | `.label_style(..)` | `StyleProp<TextStyle>` | なし | 各リーフのラベルのスタイル。クラスより優先されます。 |
| `valueLabelClass` | `.value_label_class(..)` | `string` | なし | 値の行のクラス。ラベルのクラスより優先されます。 |
| `valueLabelStyle` | `.value_label_style(..)` | `StyleProp<TextStyle>` | なし | 値の行のスタイル。クラスより優先されます。 |
| `groupLabel` | `.group_label(..)` | `keyof T \| (d: T, index: number) => string` | なし | 各グループの名前。帯の中に表示され、省略記号で切り詰められます。 |
| `groupLabelClass` | `.group_label_class(..)` | `string` | なし | 各グループのラベルのクラス。帯と同じ大きさのボックスです。 |
| `groupLabelStyle` | `.group_label_style(..)` | `StyleProp<TextStyle>` | なし | 各グループのラベルのスタイル。クラスより優先されます。 |
| `stagger` | `.stagger(..)` | `number`(0〜0.95) | `0` | トップレベルのノードが順に現れる方法。表示(appear)のうち、各ノードが開始するまでの割合です。 |
| `hoverClass` | `.hover_class(..)` | `string` | なし | `hover` パートのクラス。ホバーされたノードの上に重なる、同じ大きさのビューです(`rounded-xs outline-2 outline-foreground`)。 |
| `hoverStyle` | `.hover_style(..)` | `StyleProp<ViewStyle>` | なし | ホバーパートのスタイル。クラスより優先されます。 |

長方形は `fill` で塗りつぶされ(`colorScale` の色。未設定の場合は `currentColor`)、`stroke` で線が描かれます(未設定の場合は線なし)。いずれも、CSSの継承と同様に、ツリーマップやプロットの設定より自身の設定が優先されます。レイアウトが再実行されるのは、行、オプション、またはプロットのサイズが変わったときだけで、ポインターや表示(appear)では再実行されません。プロットのサイズが変わっても、何も移動しません。重複した `id`、どの行も指さない `parent`、自身の祖先になっている行は、警告を一度だけログに出力します。最初の行がそのidを保持し、孤立した行はトップレベルのノードとなり、循環は描画されません。

## PlotAxis

`PlotAxis` は、プロットの端に、その端が持つスケールの目盛りでラベルを付けます。下端と上端はxスケールの目盛り、左端と右端はyスケールの目盛りを使います。これは d3の `axisBottom`、`axisTop`、`axisLeft`、`axisRight` に相当します。目盛りはスケールから決まります。`linear` スケールではキリのよい値(10のべき乗の1、2、または5倍で、ドメインの内側)、`point` または `band` スケールでは行です。ラベルはプロットのレイアウトが配置するテキストで、アプリは何を読ませ、どう見せるかを指定し、レイアウトが位置を決めます。各ラベルは、端に沿って目盛りの中央に置かれます。下端と上端では、最初と最後のラベルが、プロットの両端に収まるために必要なだけ内側へ移動します。左端と右端では、すべてのラベルが目盛りの位置に留まり、グリッド線のラベルとして読めます。端の近くのラベルがプロットの上端や下端を越えてしまう場合は、プロットの線形yスケールがその分だけ内側から始まるため(端にある目盛りではラベルの高さの半分)、すべてのラベルがグリッド線上でプロット内に収まります。

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

| プロパティ | Rust | 型 | デフォルト | 説明 |
|---|---|---|---|---|
| `placement` | `.placement(..)` | `"bottom" \| "top" \| "left" \| "right"` | `"bottom"` | 軸が沿う端。下端と上端はxスケールの目盛り、左端と右端はyスケールの目盛りを使います。 |
| `scale` | `.scale(..)` | `"y" \| "y2"` | `"y"` | 左または右の軸がラベルを付けるyスケール。プロットの `yScale` か、2つ目のスケール `y2Scale` です([Dual axes](#dual-axes))。 |
| `labelPlacement` | `.label_placement(..)` | `"outside" \| "inside"` | `"outside"` | ラベルの位置。端の外側で、アプリがプロットの周囲に確保した余白に置いてマークと重ならないようにするか、端に沿ってプロットの上に重ねてプロットのサイズを保つかを選びます(左端または右端では、各ラベルはグリッド線の上側に置かれます)。 |
| `ticks` | `.ticks(..)` | `number` | `10`(`linear` スケールの場合。揃えられたスケールではすべてのステップ)、それ以外のスケールではすべての行 | 目盛りのおおよその数。`linear` スケールでは、ドメイン内のキリのよい値をおよそこの数だけ取ります。`point` または `band` スケールでは、最初から最後まで均等に配置した、この数の行を取ります。 |
| `tickValues` | `.tick_values(..)` | `number[]` | なし | 目盛りの値。`ticks` の代わりに指定します。スケールの値、または `point` や `band` スケールでは行のインデックスです(`[0, 3, 6]` は3行おきにラベルを付けます)。ドメイン内の値にはそれぞれ目盛りが付きます。 |
| `format` | `.format(..)` | `(value: number, index: number) => string` | カテゴリのバンドスケールではバンドのカテゴリ、それ以外では、目盛りの間隔に必要な小数桁数で、桁区切りを付けた値 | 各目盛りのテキスト。目盛りの値(`point` または `band` スケールでは行のインデックス)と、軸の目盛りの中でのインデックスを受け取る、アプリの関数です。 |
| `labelClass`、`labelStyle` | `.label_class(..)`、`.label_style(..)` | `string`、`StyleProp<TextStyle>` | なし | `label` パート。目盛りごとのテキストで、フォント、色、パディングはアプリが指定します。プロット側のパディングが、端からの距離になります(下の軸では `pt-2`)。 |
| `tickClass`、`tickStyle` | `.tick_class(..)`、`.tick_style(..)` | `string`、`StyleProp<ViewStyle>` | なし | `tick` パート。端にある目盛りごとのビューで、目盛りを中心に、ラベルの方向へ伸びます(下の軸では `h-1 w-px bg-border`)。スタイルを指定すると表示されます。 |
| `lineClass`、`lineStyle` | `.line_class(..)`、`.line_style(..)` | `string`、`StyleProp<ViewStyle>` | なし | `line` パート。ラベル側の端全体に沿ったビューです(下の軸では `h-px bg-border`)。スタイルを指定すると表示されます。 |

outside では、d3の軸がチャートのマージンに置かれるのと同様に、ラベルがプロットのマージンに置かれます。プロットはアプリが与えたサイズを保ち、アプリは軸の側に、ラベルと同じ深さのマージン(その下の `pt-2 text-xs` ラベルなら `mb-6`)、または親のパディングを与えます。同じ端にある2つの軸は、それぞれ自分の値に、自分のスタイルでラベルを付けます。たとえば、範囲の両端は薄く、中ほどは濃くできます。

`format` は、目盛りまたは関数が変わったとき、次のターンで目盛りごとに1回呼ばれます。プロットの描画中やポインターの追従中には呼ばれません。純粋な関数にしてください(同じ値には同じテキスト)。これを指定しない場合、目盛りは d3 が書くとおりに読まれます。`1,500`、`0.25`、`−2`。Rust では、`plot_axis()` が軸を作り、その `format` が `TickFormat::from_fn(|value, index| ..)` になります。
軸はポインターを受け付けず、スクリーンリーダーはラベルではなくプロットを読み上げます。
## PlotLabel

`PlotLabel`は、プロットの各点にテキストを書きます。ピークの上のキャプション、線の最後の点のタグ、グリッド線の端のメモなどです。`texts`はそれぞれ、マークと同じくプロットのスケールの値で自分の点を指定します。`point`または`band`スケールでは行のインデックス(行のバンドの中央)、`linear`スケールでは値を使います。テキストの上端はその点に置かれ、`align`によって、点から始まるか、点を中心にするか、点で終わるかが決まります。テキストはプロットのレイアウトによって配置されるため、プロットのサイズに追従します。スケールのドメインに合わせて滑らかに動き(`motion.update`)、appear とともにフェードインします。

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

| プロパティ | Rust | 型 | デフォルト | 説明 |
|---|---|---|---|---|
| `texts` | `.texts(..)` | `PlotText[]` | `[]` | 書き込むテキスト。それぞれが自分の点に置かれます。 |
| `scale` | `.scale(..)` | `"y" \| "y2"` | `"y"` | テキストの `y` が値となる y スケール([デュアル軸](#dual-axes))。 |

各テキストは `PlotText` です。

| フィールド | 型 | デフォルト | 説明 |
|---|---|---|---|
| `text` | `string` | | 表示する内容。 |
| `x` | `number` | | x 軸方向の位置。x スケールの値、または `point` もしくは `band` スケールでの行のインデックス(`0.5` は最初の 2 行の中間)。 |
| `y` | `number` | | 上端の y 軸方向の位置。y スケールの値。 |
| `align` | `"left" \| "center" \| "right"` | `"left"` | 点から見た x 方向の置き方。点から始める、点を中心にする、点で終わる、のいずれか。 |
| `class`, `style` | `string`, `StyleProp<TextStyle>` | なし | テキスト自身のクラスとスタイル。ラベルから継承するものより優先されます。ボックス(タグの背景とパディング)や点からの距離を指定します。 |

見た目はアプリ側で決めます。ラベルの `class` が、すべてのテキストに継承されるテキストスタイル(フォント、サイズ、色)を与え、テキスト自身の `class` と `style` がそのテキストだけにスタイルを与えます。テキストを点の上に置くには `-translate-y-full` を使い、パディングが点からの間隔になります(`pb-1`)。線の最後の点の横に置くタグは、軸のラベルと同様に、アプリがその側に残したマージンに収まります(`mr-12`)。Rust では、`plot_label()` でラベルを作り、各テキストは `.align(PlotTextAlign::Center)`、`.class(..)`、`.style(..)` を持つ `PlotText::new(text, x, y)` です。ポインターはテキストを通過してプロットに届き、スクリーンリーダーはプロットを読み上げます。テキストが何を指しているかは、プロットの `accessibilityLabel` で伝えます。

<a id="motion"></a>

## モーション

モーションはアプリ側のもので、デフォルトではありません。すべてが一度に表示されます。`motion` は [`nsh`](../modules/nsh.md#animation) のタイミング(`{ duration, easing, delay }` と `{ stiffness, damping, mass }`)を受け取ります。

| キー | 型 | 動くもの |
|---|---|---|
| `appear` | timing | マークが `appearGeneration` で描画されます。線とエリアは先頭の端から、棒は基点から伸びるように(棒の `stagger` で 1 本ずつ順に)、ドットは何もない状態から大きくなるように(ドットの `stagger` で 1 つずつ順に)、セルは中央から大きくなるように(セルの `stagger` で 1 つずつ順に)現れます。円グラフと弧のリングは始点から時計回りに広がり、放射状の線は内側の半径から伸びてドットもそれに伴います。サンキーのノードとリボンは先頭の端から現れ、ラベルはフェードインします。 |
| `update` | timing | アプリが形を変えると、マークが新しい形へ移ります。ドットは新しい値とサイズへ移り、新しい行のドットは大きくなりながら現れ、なくなった行のドットは縮んで消えます。セルは新しい色(OKLab で混合)とバンドへ移り、新しい行のセルは大きくなりながら現れ、なくなった行のセルは縮んで消えます。円グラフと弧は半径が動くのでドーナツの穴が開閉し、角度も動くのでゲージやスライスが新しい値へ回り込みます(d3 の `arcTween`: 動くのは角度であり、輪郭ではありません。新しいスライスは直前のスライスが終わる位置から開き、動いている最中の変更は描画されている位置から続きます)。放射状の線の点は新しい値、角度、半径へ移り(新しい行は内側の半径から伸びます)、放射状グリッドのリングもそれに伴います。線形スケールのドメイン(アプリの `domain`、または行が届くにつれて変わるマークの値の範囲)は古いものから新しいものへ滑らかに移り、マーク、グリッド線、`PlotAxis`、`PlotLabel` もそれに伴います。サンキーのノード、リボン、ラベルは、古いフローのレイアウトから新しいレイアウトへ移り、動いている最中の変更は描画されている位置から続きます。 |
| `enter` | timing | ポインターがプロットに乗ると、ホバーの各パーツがフェードインします。 |
| `exit` | timing | ポインターが離れると、それらがフェードアウトします。 |
| `pointer` | spring | キーまたはスクリーンリーダーでホバーを移動すると、ある行から次の行へ滑らかに移ります。円グラフのスライスはこれに合わせて持ち上がります。 |

ホバーの各パーツは同じフレームでポインターに追従します。ポインターが動くと、クロスライン、ドット、ツールチップは即座にその下の行へ移るため、手の動きに追従します。一方、そのフェードイン・フェードアウト(`enter`、`exit`)はアニメーションのままです。

モーションはプラットフォームのアニメーター上で動作し、フレームごとの JS は不要です。視覚効果の軽減を求めているユーザーには、即座に完了します。リストが戻ってきた行のためにプロットを作り直すと、再び描画されます。ただし、リストを囲む [`PlotAppearScope`](#plotappearscope) がその appear の完了を見ていた場合は除きます。

ドメインは、d3 がスケールのドメインをトランジションさせるのと同じように動きます。途中のスケールがすべての値を配置するので、マークは形を保ち、グリッド線とホバーのパーツもそれと一緒に動き、棒は角を保ち、新しいドメインとともに入ってくる行も他と一緒に動きます。行に合わせて y スケールを時々フィットさせるライブチャート(フィットの合間にグリッドが静止するよう、ある程度の余裕を持たせます)は、`update` のタイミングで新しいフィットへ滑らかに移ります。プロットのサイズが変わると、マークは即座に新しいサイズになります。

これはプロット自身のモーションであり、チャートが動かすもの、つまりマークのクリップとホバーのパーツのタイミングです。ビューの登場、退場、注意を引く動きは [`createMotion`](../modules/nsh.md#createmotion) のプリセットとキーフレームが担当し、アプリはプロットのビューやその周囲の要素に対してそれらを再生できます。

## PlotAppearScope

リストは、行が再び表示されるたびにその行のプロットを作り直すため、appear を持つスパークラインは、リストがスクロールで戻るたびに再び描画されます。リストを囲む `PlotAppearScope` は、その中で完了した appear を記憶します。そこで作り直されたプロットは、`appearGeneration` が完了していれば、マークを最初から完全な状態で表示します。
プロットは世代(generation)で記憶されるため、各行のプロットには固有の世代を与えます。行のキーに、再生し直すべき要素を組み合わせたものです(`` `${symbol} ${period}` ``)。

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

| プロパティ | Rust | 型 | デフォルト | 説明 |
|---|---|---|---|---|
| `id` | `.id(..)` | `number \| string` | なし | スコープが何のために記憶するか。変わるとスコープは記憶を忘れ、プロットはその場で描画し直されます。ウォッチリストや会話など、コンテンツにちなんだ名前を付けてください。指定しない場合、スコープは表示されている間ずっと記憶します。 |
| `children` | `.child(..)` | `JSX.Element` | なし | 保持するもの。リスト、またはプロットが出入りするたびに作り直すもの。 |

新しい世代では、プロットは引き続き描画されます。appear が完了する前に取り除かれたプロットも、最初から描画されます。プロットが新しい世代を完了すると、スコープはその前の世代を忘れるため、以前の期間に切り替え直すとプロットが再び描画されます。記憶はスコープとともに失われます。表示されなくなったスコープや、新しい `id` を持つスコープは、プロットを最初から描画し直し、プロットはそれを囲む最も内側のスコープで記憶されます。見た目はアプリ側で決めます。`class` と `style` は他のビューと同じようにレイアウトします(画面全体を占めるリストの周りでは `flex-1`)。Rust では、`plot_appear_scope()` で作成します。

<a id="keyboard"></a>

## キーボード

インタラクティブなプロットは Tab の停止位置(macOS、Web)となり、キーボードフォーカスがある間は、ポインターと同じホバーをキーで動かせます。クロスライン、ドット、ツールチップは `pointer` のスプリングで滑らかに動き、円グラフのスライスは持ち上がり、`onHoverChange` が行を通知し、スクリーンリーダーはアプリがそのために指定した `accessibilityValue` を読み上げます。フォーカスリングはアプリ側のもので、`focus-visible:` クラスまたは `focusStyle`(`focus-visible:outline-2 focus-visible:outline-ring`)で指定します。

| キー | 動作 |
|---|---|
| Right, Left | その側の行へ移動します。次の行または前の行へ移り、反転した x スケール(最初の行が右にあります)では逆向きになります(円グラフでは行の順にスライス、サンキーではノード、ツリーマップでは画面上で隣にあるリーフ。Up と Down も同様です)。行がホバーされていないときは、Right は左端の行から、Left は右端の行から始まります(円グラフでは最初と最後のスライス)。 |
| Home, End | 最初または最後の行へ移動します。 |
| Up, Down | セルの上では、同じ列の上または下のセルへ移動します。セルの上ではキーは画面上のグリッドに従います(WAI-ARIA のデータグリッド)。Right と Left は行に沿って次のセルへ、Home と End は行の最初と最後のセルへ移動します。セルがホバーされていないときは、最初のキーで左上のセルから始まります(Left、Up、End は右下のセルから)。端ではホバーはそのままです。 |
| Escape | ホバーを解除します。 |

プロットはフォーカスがある間キーに応答し、Escape は行がホバーされている間だけ応答します。それ以外のときは、キーはアプリとその周囲のビューに渡されます。フォーカスを外すと、キーで作ったホバーは解除されます。プロットはプレスを受け取らないため、押下可能なカードの中のプロットでは、プレスはカードのものになります。スクリーンリーダーも行を順に移動できます。VoiceOver の上下スワイプ、TalkBack の前後スクロール、そして要素の `increment` と `decrement` アクションを提供するすべてのスクリーンリーダーが、次の行と前の行へ移動します。反転したスケールでも、行の順に従います。

<a id="building-charts"></a>

## チャートの構築

チャートは、プロット、そのマーク、軸、そしてそれらを囲むアプリ独自の要素で構成されます。y スケールに `domain` を与え、その軸にグリッドの値(`tickValues`)を与えると、各ラベルがグリッド線の位置に置かれます。ホバーのクロスライン、ドット、ツールチップはプロットのパーツであり、スタイルと内容はアプリが決めます。行の値は、アプリが表示する場所に置きます。

グリッドは、しっかりしたベースラインを持つ実線のヘアラインが読みやすく、破線は基準値(下の始値)を示すために空けておけます。エリアは、単色の塗りよりも、ベースラインに向かってフェードアウトするウォッシュのほうが軽く読めます。
各シリーズのホバードットはそのシリーズの色を取り、リングにはチャートが置かれている面の色を使うことで、線から切り抜かれて見えます。ツールチップはプロットの上部に置かれ、最初と最後の行ではプロットの端の内側に収まります。最も高い値の上に余裕のある `domain` を使うと、線に重なりません。

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

棒グラフは、棒の先端を丸め、根元を四角にすると読みやすくなります(`cornerRadii={{ topLeft: 4,
topRight: 4 }}`; in a stack only on its top bar), a hair of room between the bars of a band (`groupPadding`)。1 つがホバーされている間は他の行の棒を控えめにし(`inactiveOpacity`)、そのバンドに色を付け(`crossLineClass`)、値は棒の上に小さな等幅数字で表示し、スタックでは合計をその上に表示します。`paddingOuter` を `paddingInner` の半分にすると、バンドの中央が等間隔になり、`PlotAxis` は各月をバンドの下の中央に配置します。`maxBandWidth` を使うと、幅の広いカードの中でも数本の棒を細いままに保てます。

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

リスト行の中のスパークラインは、`interactive={false}` を持つプロットです。マークを描画するだけで、ポインターには追従しません。

<a id="accessibility"></a>

## アクセシビリティ

- プロットはスクリーンリーダーにとって 1 つの要素で、image ロールとアプリの `accessibilityLabel` を持ちます。マーク、軸のラベル、`PlotLabel`、ホバーのパーツはその一部であり、それら自身は何も読み上げません。ラベルには、チャートが何を示しているか、何が際立っているか(範囲、最も高い値)を書き、`accessibilityValue` にはポインターの下の行を表す言葉を与えてください。そうすると、スクリーンリーダーは値が変わるたびにそれを読み上げます。
- ポインターの下の行は、ポインターのあるプラットフォーム(デスクトップ、Web、トラックパッド付きの iPad)では `onHoverChange` で通知されます。タッチスクリーンではホバーは通知されません。タッチ操作のユーザーに必要な値はアプリ独自の要素に表示するか、数値が重要な場面では行をテキストやリストとして提供してください。
- 円グラフでは、通知される行はポインターの下のスライスです。`accessibilityValue` にその名前、値、割合(`"Team, 340 seats, 34.0%"`)を与え、ラベルに合計と最大の割合を書いてください。レーダーでは、ポインターに最も近い軸です。その軸の名前と、そこでの各シリーズの値を与えてください。
- インタラクティブなプロットはキーボードフォーカスの停止位置で、矢印キーでホバーを動かせます([キーボード](#keyboard))。また、スクリーンリーダーに対して、行を順に移動するための `increment` と `decrement` を提供します(VoiceOver では adjustable として読み上げられます)。`interactive={false}` を持つプロットはどちらでもなく、いずれの場合もプレスを受け取りません。

ラベルとロール全般については、[アクセシビリティ](../docs/accessibility.md)を参照してください。
<a id="platform-notes"></a>

## プラットフォームに関する注意

- どのプラットフォームでも、マークは Rust で記録されたマークごとの 1 つの描画から、同じ方法で描画されます。行が変更されると、その行を読み取るマークがまとめて 1 回のバッチで再描画されます。ペイントクラス(外観、`dark:`)が変更された場合は、描画を記録し直さずに、その描画を再送します。
- appear は、プラットフォームのアニメーターが動かす値で、線と面をクリップし、棒を成長させます。ホバーされた行から離れた棒がフェードアウトする際の不透明度は、アニメーターがホバー位置から計算します。ホバーの各パーツはアニメーターが動かしてフェードさせるビューで、アニメーターはプロットのサイズとツールチップのサイズから、ツールチップがプロット内に収まるようにします。
- 面の背景は専用のキャンバスに、面の形状でクリップして描画されます。グラデーションは、プラットフォームがビューの `bg-linear-*` に対して描画するものと同じです。面のクラス(外観、`dark:`)が変更された場合は、記録し直さずに描画を再送します。
- 円グラフは各スライスをそれぞれ専用のキャンバスに描画します。ポインター下のスライスは、スライスの角度と半径から Rust 側で特定されます。スライスの持ち上がりは半径、他のスライスのフェードは不透明度で、どちらもアニメーターが動かします。appear のスイープも同様にスライスの角度をアニメーターが動かすため、いずれも描画を記録し直しません。
- ラジアルラインでは、ポインター下の行は点の角度から Rust 側で特定されます。ホバードットはアニメーターがポインター下の行に配置するビューで(キーが切り替わるときは `pointer` スプリングで滑らかに移動します)、表示時や新しい値への移動時には、点は元の位置からアニメーターが動かす数値になるため、ラインは変更ごとに 1 回だけ記録されます。
- ドットマークは 1 つのキャンバスに描画されます。ポインター下のドットは、ドットの中心と半径から Rust 側で特定されます。ホバードットはアニメーターがそのドット上に、同じ大きさで配置するビューです。appear の成長、変更による移動、ホバーのフェードはアニメーターが動かす値であるため、ドットは変更ごとに 1 回だけ記録されます。
- セルマークは 1 つのキャンバスに描画されます。ポインター下のセルは、セルのボックスから Rust 側で特定されます。ホバーセルはアニメーターがそのセル上に配置するビューです。成長、変更による色や移動、ホバーのフェードはアニメーターが動かす値であるため、セルは変更ごとに 1 回だけ記録されます。各ラベルはプラットフォームのテキストで、レイアウト後のサイズがセル内に収まる場合に表示されます。
- 軸のラベル、目盛り線、軸線は、プラットフォーム固有のテキストとビューです。Rust 側のレイアウトが、プロットのサイズとスケールから配置します。プロットのサイズが変わると、これらはマークとともに移動し、新しいドメインではラベルが書き直されます。
