---
title: "スタイルリファレンス"
description: "NSH が受け付けるすべてのスタイルキーを、LayoutStyle、ViewStyle、TextStyle、InputStyle、ImageStyle ごとにグループ化し、その型と意味とともに掲載します。"
order: 16
source_hash: 012ce37fb9fe065c
---

# スタイルリファレンス

このページでは、`style` prop のすべてのキーと、Rust でそのキーを設定する `Styled` のメソッドを一覧にしています。Rust コンポーネントは、Tailwind のユーティリティ名にちなんだ型付きメソッド（`.p_4()`、`.rounded(px(12.0))`、`.bg(color)`、`nsh_core::prelude` のもの）で要素をスタイリングし、これらは同じキーに変換されます。TSX では `style` オブジェクト（およびクラス）を渡します。Rust 列にはメソッド名を示しています。ほとんどのメソッドには値、シグナル、クロージャを渡せ、`.style_when(…)` / `.style_with(…)` を使えばどのメソッドも条件付きにできます。キーとその型は `.nsh/types/nsh/types.d.ts` の生成された宣言に由来するため、エディタが入力中にチェックしてくれます。スタイルキーは同名の CSS プロパティを意味し、それを設定するクラスと同じ動作をします。`paddingLeft` は CSS の `padding-left` と `pl-4`、`boxShadow` は `box-shadow` と `shadow-md` に対応します。一部のキーには、アプリで書きやすい平易な名前が使われています（`padding-inline` に対する `paddingHorizontal`、`margin-inline-start` に対する `marginStart`、`line-clamp` に対する `numberOfLines`）。数値の単位はポイントです。grid、グラデーション、ボックスシャドウ、フィルター、ブレンドモード、アウトライン、トランスフォーム、トランジション、キーフレームアニメーションといった CSS の機能も利用できます。

スタイルの適用方法、クラスとの組み合わせ、テキストスタイルの継承については [スタイリング](../docs/styling.md) を参照してください。クラスの構文については [Tailwind リファレンス](./tailwind-reference.md) を参照してください。

<a id="the-five-interfaces"></a>

## 5 つのインターフェース

各インターフェースは、前のインターフェースを継承します。

| インターフェース | 継承元 | 用途 |
|---|---|---|
| `LayoutStyle` | | すべての要素のレイアウト（flexbox、grid、サイズ、間隔、位置） |
| `ViewStyle` | `LayoutStyle` | `<View>`、`<Scroll>`、`<List>`、コントロール、その他すべての要素 |
| `TextStyle` | `ViewStyle` | `<Text>` と `<Input>`（およびビュー。ビューのテキストスタイルは内部のテキストに引き継がれます） |
| `InputStyle` | `TextStyle` | `<Input>`: `placeholderColor` と `caretColor` を追加 |
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

`style` は配列も受け付けます。要素は左から右へマージックされ、falsy な要素はスキップされるため、条件付きスタイルにスプレッドは不要です。Rust では、`.style_when(condition, …)` は条件が成り立つ間スタイルを追加します。

```rust tabs
card().style_when(selected, |s| s.border_color(rgb(0x2563eb)).border(px(2.0)))
```

```tsx tabs
<View style={[card, selected() && { borderColor: "#2563eb", borderWidth: 2 }]} />
```

> [!NOTE]
> インラインの `style` は常に `class` より優先されます。キーに `null` または `undefined` を設定すると、そのキーはデフォルト値にリセットされます。

<a id="how-style-keys-read"></a>

## スタイルキーの読み方

スタイルキーは CSS に従うため、同じプロパティを指すスタイルとクラスは同じ動作をします。

- **レイアウト方向。** `display` を設定しないビューは、子要素を縦方向（column）に配置します。`display: "flex"` は、CSS や `flex` クラスと同様に、`flexDirection` が設定されていない限り横方向（row）になります。`flexShrink` は、設定しない限り `0` です。
- **物理的な辺と論理的な辺。** `left`、`right`、`marginLeft`、`paddingRight`、`borderLeftWidth`、`borderTopLeftRadius`、`textAlign: "left"` は、右から左へのレイアウトでも同じ辺を保ちます。start / end のキー（`marginStart`、`paddingEnd`、`start`、`end`、`borderStartWidth` など）、`borderTopStartRadius` ファミリー、`textAlign: "start" | "end"` は方向に従います。inline start は、左から右のレイアウトでは左、右から左のレイアウトでは右です。
- **ボーダーの色。** 幅が設定されていて色が設定されていないボーダーまたはアウトラインは、テキストの色（CSS の `currentColor`）で描画されます。
- **トランスフォーム。** `translate`、`rotate`、`scale` はそれぞれ独立したプロパティであり、`transform` は CSS の関数の文字列、または量がアニメーション値でもよいステップのリストを受け付けます。これらは `translate`、`rotate`、`scale`、`transform` の順に合成されます。

<a id="value-types"></a>

## 値の型

| 型 | 受け付ける値 | Rust |
|---|---|---|
| `number` | ポイント（密度非依存）。`1` は iOS では 1 ポイント、Android では 1 dp です。 | `Points`: `px(16.0)` |
| `DimensionValue` | `number`（ポイント）、`` `${number}%` ``（親に対する割合）、または `"auto"`。 | `Length`: `px(…)`、`relative(0.5)`、`auto()` |
| `LengthValue` | `number`（ポイント）または `` `${number}%` ``。`"auto"` は使えません。 | `DefiniteLength`: `px(…)`、`relative(0.5)` |
| `ColorValue` | CSS のカラー文字列: `#rgb`、`#rgba`、`#rrggbb`、`#rrggbbaa`、`rgb()`、`rgba()`、`hsl()`、`hsla()`、`oklch()`、`oklab()`、または名前付きの CSS カラー（`black`、`white`、`transparent`、`rebeccapurple` など）。 | `Hsla` / `AdaptiveColor`: `rgb(0x2563eb)`、`hsla(…)`、テーマカラー（`theme().primary`） |
| `EnvValue` | padding または margin 内の環境変数: `env(name)`、`env(name, <length>)`（未知の名前の代わりに長さが使われます）、`calc(env(name) + <length>)` または `calc(<length> + env(name))`。名前は `safe-area-inset-top`、`-right`、`-bottom`、`-left`（[セーフエリア](../elements/safe-area.md)）と `keyboard-inset-height`（[キーボード](../elements/keyboard.md)）です。物理的な padding と margin のキーおよびそのショートハンドで使えます。 | `.p_safe_area()`、`.pt_safe_area_plus(px(8.0))`、`.pb_keyboard()`、`.mb_keyboard_plus(…)` など |
| `AnimatedNode` | ネイティブのアニメーション値、またはそこから派生したノード（[`nsh` のアニメーション API](./nsh.md#animation) を参照）。`opacity`、`backgroundColor`、`borderColor`、`color`、`translate`、`rotate`、`scale`、`transform` リストのステップ、sticky ビューの `top` / `left` で使えます。この場合、値は JS を介さず UI スレッド上でアニメーションします。 | `AnimatedValue` / `AnimatedNode`。`.bind_opacity(&v)`、`.bind_background(&v)`、`.bind_border_color(&v)`、`.bind_color(&v)`、`.bind_translate_x(&v)` などでバインドします |

CSS 構文の文字列（`boxShadow`、`textShadow`、`backgroundImage`、`filter`、`gridTemplateColumns` など）では、長さを `px` と数値のみ（どちらもポイント）、`pt`（CSS と同様に 1 ポイントの 4/3）、または `rem`（16 ポイント）で指定できます。

## LayoutStyle

レイアウトは Rust で計算されます（flexbox と CSS grid）。`display` を設定しないビューは、子要素を縦方向に積む flex コンテナになります。`display: "flex"` を指定すると、CSS と同様に `flexDirection` が設定されていない限り横方向（row）になります。要素のデフォルトは `flexShrink: 0`、`alignContent: "flex-start"`（grid では CSS の `"normal"`）、`alignItems: "stretch"` で、自動的な最小サイズはありません。[レイアウト](../docs/layout.md) を参照してください。

<a id="display-and-position"></a>

### 表示と位置

| キー | 型 | Rust | 説明 |
|---|---|---|---|
| `display` | `"flex" \| "grid" \| "block" \| "flow-root" \| "none"` | `.flex()`、`.grid()`、`.hidden()` | 子要素のレイアウト。`"flex"` は、CSS と同様に `flexDirection` で方向を指定しない限り、子要素を横方向に配置します。display を設定しないビューは、子要素を縦方向に配置します。`"none"` は要素をレイアウトから除外して非表示にします。`"block"` は CSS のブロックレイアウトと同様に子要素を積み重ねます。 |
| `boxSizing` | `"border-box" \| "content-box"` | | 寸法にボーダーとパディングを含めるか、コンテンツのみとするか。デフォルトは `"border-box"`。 |
| `position` | `"relative" \| "absolute" \| "static" \| "fixed" \| "sticky"` | `.relative()`、`.absolute()` | `"absolute"` は要素をフローから外し、最も近い位置指定された祖先（それが `"static"` でない限り親）を基準に `top` / `right` / `bottom` / `left` で配置します。`"static"` はフロー内に留まり、インセットを無視します。`"fixed"` は要素の型を保ったまま、サーフェスまたはモーダルのルート内でレイアウトとマウントを行い、周囲のコンテンツがスクロールしても所定の位置に留まります。`"sticky"` はフロー内に留まり、親が表示されている間、周囲のスクロールビューのビューポートの開始位置から `top`（横スクロールビューでは `left`）の位置に貼り付き、その終端が親のコンテンツボックスの終端に達するまで続きます。同じ `zIndex` を持つ兄弟要素より上に描画されます。デフォルトは `"relative"`。 |
| `top` | `DimensionValue \| AnimatedNode` | `.top(…)`、`.inset(…)`、`.bind_sticky_top(&node)` | 親の上端（absolute）または要素自身の位置（relative）からのオフセット。sticky ビューでは貼り付く位置を表し、アニメーション値を使うと毎フレーム移動します。 |
| `right` | `DimensionValue` | `.right(…)` | 右端からのオフセット。どちらの方向でも同じです。 |
| `bottom` | `DimensionValue` | `.bottom(…)` | 下端からのオフセット。 |
| `left` | `DimensionValue \| AnimatedNode` | `.left(…)`、`.bind_sticky_left(&node)` | 左端からのオフセット。どちらの方向でも同じです。横スクロールビュー内の sticky ビューでは貼り付く位置を表し、アニメーション値を使うと毎フレーム移動します。 |
| `start` | `DimensionValue` | | inline start 端からのオフセット。左から右のレイアウトでは左、右から左のレイアウトでは右。 |
| `end` | `DimensionValue` | | inline end 端からのオフセット。左から右のレイアウトでは右、右から左のレイアウトでは左。 |
| `zIndex` | `number` | `.z_index(z)` | 兄弟要素間の順序（同じ値なら安定）。ネイティブの重なり順にもなります。 |
| `direction` | `"inherit" \| "ltr" \| "rtl"` | | レイアウト方向。デフォルトでは継承されます。CSS と同様に、`left` と `right` のプロパティは右から左でも辺を保ち、inline start / end のプロパティ（`marginStart`、`end` など）は方向に応じた辺になります。 |

### Flexbox

| キー | 型 | Rust | 説明 |
|---|---|---|---|
| `flexDirection` | `"row" \| "column" \| "row-reverse" \| "column-reverse"` | `.flex_row()`、`.flex_col()`、`.flex_row_reverse()`、`.flex_col_reverse()` | 主軸。デフォルトは、`display` を設定しないビューでは `"column"`、`display: "flex"` が設定されている場合は `"row"`。 |
| `flexWrap` | `"wrap" \| "nowrap" \| "wrap-reverse"` | `.flex_wrap()` | 子要素を複数行に折り返すかどうか。デフォルトは `"nowrap"`。 |
| `flex` | `number` | `.flex_1()`、`.flex_auto()`、`.flex_none()` | CSS のショートハンドではなく、単一の数値です。正の数は `flexGrow` をその値に、`flexShrink: 1` と `flexBasis: 0` を設定します。`0` は要素を伸縮不可にし、負の数は最小サイズまで縮小できるようにします。 |
| `flexGrow` | `number` | `.flex_grow(f)` | 要素が取る空きスペースの割合。デフォルトは `0`。 |
| `flexShrink` | `number` | `.flex_shrink(f)`、`.flex_shrink_0()` | スペースが足りなくなったときに要素が縮む割合。デフォルトは `0` で、CSS のような `1` ではありません。 |
| `flexBasis` | `DimensionValue` | `.basis(…)` | 空きスペースが分配される前の主軸方向のサイズ。 |
| `justifyContent` | `"flex-start" \| "flex-end" \| "start" \| "end" \| "center" \| "space-between" \| "space-around" \| "space-evenly" \| "stretch" \| "normal"` | `.justify_start()`、`.justify_center()`、`.justify_end()`、`.justify_between()`、`.justify_around()`、`.justify_evenly()` | 主軸に沿った子要素の配分。デフォルトは `"normal"`: flex コンテナでは `"flex-start"`、grid では `auto` サイズのトラックが引き伸ばされます。 |
| `alignItems` | `"flex-start" \| "flex-end" \| "start" \| "end" \| "self-start" \| "self-end" \| "center" \| "stretch" \| "baseline" \| "normal"` | `.items_start()`、`.items_center()`、`.items_end()`、`.items_stretch()`、`.items_baseline()` | 交差軸上での子要素の配置。デフォルトは `"stretch"`。 |
| `alignSelf` | `"auto" \| "flex-start" \| "flex-end" \| "start" \| "end" \| "self-start" \| "self-end" \| "center" \| "stretch" \| "baseline" \| "normal"` | `.self_start()`、`.self_center()`、`.self_end()`、`.self_stretch()` | この要素について、親の `alignItems` を上書きします。 |
| `alignContent` | `"flex-start" \| "flex-end" \| "start" \| "end" \| "center" \| "stretch" \| "space-between" \| "space-around" \| "space-evenly" \| "normal"` | `.content_start()`、`.content_center()`、`.content_between()`、… | 交差軸上での折り返された行（および grid のトラック）の配分。デフォルトは flex コンテナでは `"flex-start"`、grid では `"normal"` で、grid では `auto` サイズのトラックが引き伸ばされます。`"start"` / `"end"` は書字方向に従います。 |
| `gap` | `LengthValue` | `.gap(…)`、`.gap_4()` | 子要素の行と列の間隔。 |
| `rowGap` | `LengthValue` | `.gap_y(…)` | 行の間隔。 |
| `columnGap` | `LengthValue` | `.gap_x(…)` | 列の間隔。 |

### Grid

子要素を CSS grid でレイアウトするには、`display: "grid"` を設定します。トラックのリストには CSS 構文を使います。

| キー | 型 | Rust | 説明 |
|---|---|---|---|
| `gridTemplateColumns` | `string` | `.grid_template_columns(…)`、`.grid_cols(n)` | 列トラック: `"repeat(3, 1fr)"`、`"200px 1fr"`、`minmax()`、`auto-fill` / `auto-fit`、ライン名（`"[a] 40px [b c] 1fr [d]"`）。 |
| `gridTemplateRows` | `string` | `.grid_template_rows(…)`、`.grid_rows(n)` | 行トラック。構文は同じです。 |
| `gridAutoColumns` | `string` | | 暗黙的に作成される列のサイズ。 |
| `gridAutoRows` | `string` | | 暗黙的に作成される行のサイズ。 |
| `gridAutoFlow` | `"row" \| "column" \| "dense" \| "row dense" \| "column dense"` | `.grid_flow_col()`、`.grid_flow_dense()` | 配置指定のないアイテムが grid を埋める方法。 |
| `gridColumn` | `number \| string` | `.col_span(n)`、`.col_span_full()` | 列の配置: `"1 / 3"`、`"span 2"`、ライン番号またはライン名（`"content-start / content-end"`、`"2 col"`、`"span col"`）。 |
| `gridColumnStart` | `number \| string` | `.col_start(…)` | 列の開始ライン。 |
| `gridColumnEnd` | `number \| string` | `.col_end(…)` | 列の終了ライン。 |
| `gridRow` | `number \| string` | `.row_span(n)`、`.row_span_full()` | 行の配置。構文は `gridColumn` と同じです。 |
| `gridRowStart` | `number \| string` | `.row_start(…)` | 行の開始ライン。 |
| `gridRowEnd` | `number \| string` | `.row_end(…)` | 行の終了ライン。 |
| `justifyItems` | `"flex-start" \| "flex-end" \| "start" \| "end" \| "self-start" \| "self-end" \| "center" \| "stretch" \| "baseline" \| "normal"` | | grid アイテムが行方向にエリア内でどう配置されるか。 |
| `justifySelf` | `"auto" \| "flex-start" \| "flex-end" \| "start" \| "end" \| "self-start" \| "self-end" \| "center" \| "stretch" \| "baseline" \| "normal"` | | このアイテムについて `justifyItems` を上書きします。 |

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

### サイズ

| キー | 型 | Rust | 説明 |
|---|---|---|---|
| `width` | `DimensionValue` | `.w(…)`、`.w_full()`、`.size(…)` | 幅。 |
| `height` | `DimensionValue` | `.h(…)`、`.h_full()` | 高さ。 |
| `minWidth` | `LengthValue` | `.min_w(…)` | 最小幅。 |
| `minHeight` | `LengthValue` | `.min_h(…)` | 最小高さ。 |
| `maxWidth` | `LengthValue` | `.max_w(…)` | 最大幅。 |
| `maxHeight` | `LengthValue` | `.max_h(…)` | 最大高さ。 |
| `aspectRatio` | `number \| "auto" \| "16 / 9"` | `.aspect_ratio(r)`、`.aspect_square()` | 幅を高さで割った値。数値（`1.5`）または CSS の比率（`"16 / 9"`）で指定し、もう一方の寸法は他方から計算されます。`"auto"` は何も設定しません。 |

<a id="margin"></a>

### マージン

マージンは `"auto"`（flexbox と同様に空きスペースを吸収）と負の値を受け付けます。物理キー（`marginStart` / `marginEnd` を除くすべて）は `EnvValue` も受け付けます: `marginBottom: "env(keyboard-inset-height)"`（Rust では `.mb_keyboard()`、`.mt_safe_area()` など）。

| キー | 型 | Rust | 説明 |
|---|---|---|---|
| `margin` | `DimensionValue \| EnvValue` | `.m(…)`、`.m_4()` | 四辺すべて。 |
| `marginHorizontal` | `DimensionValue \| EnvValue` | `.mx(…)` | 左右。 |
| `marginVertical` | `DimensionValue \| EnvValue` | `.my(…)` | 上下。 |
| `marginTop` | `DimensionValue \| EnvValue` | `.mt(…)` | 上。 |
| `marginRight` | `DimensionValue \| EnvValue` | `.mr(…)` | 右。 |
| `marginBottom` | `DimensionValue \| EnvValue` | `.mb(…)` | 下。 |
| `marginLeft` | `DimensionValue \| EnvValue` | `.ml(…)` | 左。 |
| `marginStart` | `DimensionValue` | `.ms(…)` | inline start: 左から右のレイアウトでは左、右から左のレイアウトでは右。 |
| `marginEnd` | `DimensionValue` | `.me(…)` | inline end: `marginStart` の反対側。 |

<a id="padding"></a>

### パディング

物理キー（`paddingStart` / `paddingEnd` を除くすべて）は `EnvValue` も受け付けます: `paddingTop: "env(safe-area-inset-top)"`、`paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)"`（Rust では `.pt_safe_area()`、`.pb_safe_area_plus(px(16.0))`、`.pb_keyboard()` など）。パディングは 0 以上です。

| キー | 型 | Rust | 説明 |
|---|---|---|---|
| `padding` | `LengthValue \| EnvValue` | `.p(…)`、`.p_4()` | 四辺すべて。 |
| `paddingHorizontal` | `LengthValue \| EnvValue` | `.px(…)` | 左右。 |
| `paddingVertical` | `LengthValue \| EnvValue` | `.py(…)` | 上下。 |
| `paddingTop` | `LengthValue \| EnvValue` | `.pt(…)` | 上。 |
| `paddingRight` | `LengthValue \| EnvValue` | `.pr(…)` | 右。 |
| `paddingBottom` | `LengthValue \| EnvValue` | `.pb(…)` | 下。 |
| `paddingLeft` | `LengthValue \| EnvValue` | `.pl(…)` | 左。 |
| `paddingStart` | `LengthValue` | `.ps(…)` | inline start: 左から右のレイアウトでは左、右から左のレイアウトでは右。 |
| `paddingEnd` | `LengthValue` | `.pe(…)` | inline end: `paddingStart` の反対側。 |

## ViewStyle

ビューによって描画されるすべての要素です。`LayoutStyle` のすべてのキーも適用されます。

<a id="background"></a>

### 背景

| キー | 型 | Rust | 説明 |
|---|---|---|---|
| `backgroundColor` | `ColorValue \| AnimatedNode` | `.bg(color)`、`.bind_background(&node)` | 塗りつぶしの色。ネイティブのアニメーションカラーを受け付けます。 |
| `backgroundImage` | `string` | `.bg_linear(angle)`、`.bg_radial()`、`.bg_conic()`（`.gradient_from` / `_via` / `_to` と併用） | 背景色の上に描画される CSS グラデーション: `linear-gradient(...)`、`radial-gradient(...)`、`conic-gradient(...)`。カンマ区切りで複数指定できます。 |

```rust tabs
view().h(px(120.0)).rounded(px(16.0)).bg_linear(deg(135.0)).gradient_from(rgb(0x6366f1)).gradient_to(rgb(0xec4899))
```

```tsx tabs
<View style={{ height: 120, borderRadius: 16, backgroundImage: "linear-gradient(135deg, #6366f1, #ec4899)" }} />
```
<a id="borders"></a>

### 枠線

| キー | 型 | Rust | 説明 |
|---|---|---|---|
| `borderWidth` | `number` | `.border(w)`, `.border_1()`, `.border_2()` | 四辺すべての幅。 |
| `borderTopWidth` | `number` | `.border_t(w)` | 上辺。 |
| `borderRightWidth` | `number` | `.border_r(w)` | 右辺。 |
| `borderBottomWidth` | `number` | `.border_b(w)` | 下辺。 |
| `borderLeftWidth` | `number` | `.border_l(w)` | 左辺。 |
| `borderStartWidth` | `number` | `.border_s(w)` | インライン開始側の辺(左から右へのレイアウトでは左、右から左へのレイアウトでは右)。 |
| `borderEndWidth` | `number` | `.border_e(w)` | インライン終了側の辺。 |
| `borderColor` | `ColorValue \| AnimatedNode` | `.border_color(c)`, `.bind_border_color(&node)` | 四辺すべての色。ネイティブのアニメーションカラーを受け取ります。 |
| `borderTopColor` | `ColorValue` | `.border_t_color(c)` | 上辺。 |
| `borderRightColor` | `ColorValue` | `.border_r_color(c)` | 右辺。 |
| `borderBottomColor` | `ColorValue` | `.border_b_color(c)` | 下辺。 |
| `borderLeftColor` | `ColorValue` | `.border_l_color(c)` | 左辺。 |
| `borderStartColor` | `ColorValue` | `.border_s_color(c)` | インライン開始側の辺。 |
| `borderEndColor` | `ColorValue` | `.border_e_color(c)` | インライン終了側の辺。 |
| `borderStyle` | `"solid" \| "dashed" \| "dotted" \| "none" \| "hidden"` | `.border_solid()`, `.border_dashed()`, `.border_dotted()`, `.border_none()` | 線のスタイル。デフォルトは`"solid"`。`"none"`と`"hidden"`は、幅を前に設定しても後に設定しても、CSSと同様に枠線を描画せず、レイアウトにも含めません。 |

幅が設定されていて色がどこにも設定されていない辺は、CSSの`currentColor`と同様にテキストの色で描画されます。`{ borderWidth: 1, color: "#2563eb" }`は青い枠線を描画します。アウトラインも同じようにテキストの色を使います。

<a id="corners"></a>

### 角

| キー | 型 | Rust | 説明 |
|---|---|---|---|
| `borderRadius` | `number` | `.rounded(r)`, `.rounded_lg()` | 四隅すべての半径。 |
| `borderTopLeftRadius` | `number` | `.rounded_tl(r)` | 左上の角。 |
| `borderTopRightRadius` | `number` | `.rounded_tr(r)` | 右上の角。 |
| `borderBottomRightRadius` | `number` | `.rounded_br(r)` | 右下の角。 |
| `borderBottomLeftRadius` | `number` | `.rounded_bl(r)` | 左下の角。 |
| `borderTopStartRadius` | `number` | `.rounded_ss(r)` | インライン開始側の上の角。 |
| `borderTopEndRadius` | `number` | `.rounded_se(r)` | インライン終了側の上の角。 |
| `borderBottomStartRadius` | `number` | `.rounded_es(r)` | インライン開始側の下の角。 |
| `borderBottomEndRadius` | `number` | `.rounded_ee(r)` | インライン終了側の下の角。 |
| `borderCurve` | `"circular" \| "continuous"` | `.border_curve(curve)` | `"continuous"`: 曲率が辺へなめらかに移り変わる角。iOSのアプリアイコンのような形です。ボックスが小さすぎる場合は曲線が円形に戻るため、ピル形はピル形のままです。両プラットフォームで動作します。 |

<a id="outline"></a>

### アウトライン

アウトラインは枠線の外側に描画され、レイアウト上のスペースを取りません。

| キー | 型 | Rust | 説明 |
|---|---|---|---|
| `outlineWidth` | `number` | `.outline(w)` | 線の幅。 |
| `outlineColor` | `ColorValue` | `.outline_color(c)` | 線の色。デフォルトはテキストの色。 |
| `outlineStyle` | `"solid" \| "dashed" \| "dotted" \| "none" \| "hidden"` | `.outline_dashed()`, `.outline_dotted()`, `.outline_none()` | 線のスタイル。 |
| `outlineOffset` | `number` | `.outline_offset(o)` | 枠線の端からの距離。負の値を指定すると内側に移動します。 |

<a id="shadows"></a>

### 影

ビューはCSSの`boxShadow`で影を落とします。複数のレイヤー、スプレッド、インセットシャドウに対応しています。トランジションでアニメーションさせることもできます(`transitionProperty: "boxShadow"`)。

| キー | 型 | Rust | 説明 |
|---|---|---|---|
| `boxShadow` | `string \| BoxShadowLayer[]` | `.shadow([BoxShadow { … }])`, `.shadow_md()`, `.shadow_color(c)` | CSSの`box-shadow`: オフセット、ぼかし、スプレッド、色。複数のレイヤーはカンマで区切り、内側の影には`inset`を使います。または、各レイヤーを数値で指定する`[{ x, y, blur, spread, color, inset }]`(必須は`x`と`y`のみ)。色のないレイヤーは、CSSの`currentColor`と同様にテキストの色で描画されます。`.shadow_color(c)`は、プリセットまたは`.shadow(…)`のレイヤーの色を変更します。 |

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
> Androidでは、影には背景が必要です。背景が透明なビュー(たとえば何もない場所に置いたテキスト)は影を落としません。Androidのマテリアルシャドウには、スタイルの代わりに`android={{ elevation }}`プロパティを使用してください。

<a id="opacity-visibility-and-overflow"></a>

### 不透明度、可視性、オーバーフロー

| キー | 型 | Rust | 説明 |
|---|---|---|---|
| `opacity` | `number \| AnimatedNode` | `.opacity(o)`, `.bind_opacity(&value)` | 0(不可視)から1。ネイティブのアニメーション値を受け取ります。 |
| `visibility` | `"visible" \| "hidden" \| "collapse"` | | 非表示のビューもレイアウト上のスペースを保持します(`display: "none"`とは異なります)。 |
| `overflow` | `"visible" \| "hidden"` | `.overflow_hidden()` | `"hidden"`は子要素をビューの境界(と角)でクリップします。 |
| `backfaceVisibility` | `"visible" \| "hidden"` | `.backface_hidden()`, `.backface_visible()` | `"hidden"`: 3D回転で裏返っている間は不可視になります。 |
| `verticalAlign` | `"baseline" \| "text-top" \| "text-bottom" \| "middle"` | `.align_baseline()`, `.align_text_top()`, `.align_text_bottom()`, `.align_middle()` | `<Text>`内のビューや画像が行のどこに配置されるか。CSSの`vertical-align`と同様です: 下端をベースラインに合わせる(デフォルト)、上端または下端をテキストフォントの上端または下端に合わせる、または中央をベースラインからxハイトの半分上に合わせます。行はそれを収めるために広がります。 |

<a id="transforms"></a>

### トランスフォーム

トランスフォームはCSSのものです。`translate`、`rotate`、`scale`プロパティと`transform`が、この順に合成されます。それぞれが独立したプロパティなので、スタイルの`scale`はクラスの`scale-*`を置き換えて`rotate-*`を保持し、スタイルの`transform`はクラスのtransform関数(`rotate-x-*`、`skew-*`)を置き換えます。

| キー | 型 | Rust | 説明 |
|---|---|---|---|
| `translate` | `string \| number \| AnimatedNode \| [x, y]` | `.translate_x(…)`, `.translate_y(…)`; `.bind_translate_x(&v)`, `.bind_translate_y(&v)` | CSSの`translate`: xの次にy(`"10px 20px"`。ビュー自身のサイズに対する割合、`"-50% 0"`)。数値はxに沿ったポイント数です。`[x, y]`は軸ごとに数値、文字列(`"50%"`、`"10px"`)、またはアニメーション値を受け取ります。アニメーション値のみを指定した場合はxに沿って移動します。 |
| `rotate` | `string \| number \| AnimatedNode` | `.rotate(deg(…))`; `.bind_rotate(&v)` | CSSの`rotate`: `"45deg"`、`"0.5turn"`、または軸まわりの`"x 90deg"`。数値とアニメーション値は、z軸まわりの角度(度、時計回り)です。 |
| `scale` | `string \| number \| AnimatedNode \| [x, y]` | `.scale(f)`, `.scale_x(f)`, `.scale_y(f)`; `.bind_scale(&v)` | CSSの`scale`: `1.5`、`"150%"`、xとy(`"1 2"`)。アニメーション値は両軸を拡大縮小します。`[x, y]`は軸ごとに数値またはアニメーション値を受け取ります。 |
| `transform` | `string \| TransformStep[]` | `.rotate_x(…)`, `.rotate_y(…)`, `.skew_x(…)`, `.skew_y(…)`, `.transform_none()`; アニメーションステップ: `.bind_transform(kind, &v)`, `.bind_motion(&m)`(すべてのスタイルtransformの後) | CSSの`transform`: `"translateX(10px) rotate(45deg) scale(1.5)"`、または`"none"`。関数: `translate()`, `translateX()`, `translateY()`, `scale()`, `scaleX()`, `scaleY()`, `rotate()` / `rotateZ()`, `rotateX()`, `rotateY()`, `skew()`, `skewX()`, `skewY()`, `perspective()`。長さは`px`を受け取ります(平行移動は、ビュー自身のサイズに対する割合の`%`も可)。角度は`deg`、`rad`、または`turn`です。または、量にアニメーション値を使えるステップのリスト。文字列では表現できないもの、たとえばアニメーションする3D回転(`[{ perspective: 800 }, { rotateY: angle }]`)や、モーションのチャネル(`m.transform`)に使います。スタイルの`transform`はどちらか一方の形式なので、アニメーションステップの前にあるperspectiveはリストのステップとして指定します。`translate`、`rotate`、`scale`の後に適用されます。 |
| `transformOrigin` | `string \| (number \| string)[]` | `.transform_origin(…)`, `.origin_top_left()`, ... | トランスフォームの基準点: キーワード、パーセンテージ、長さ(`"top left"`、`"50% 0"`、`[10, 20]`)。デフォルトは中心。 |

`TransformStep`は1つのキーを持つオブジェクトで、リストの順に適用されます。

| ステップ | 値 | ネイティブアニメーション |
|---|---|---|
| `translateX`, `translateY` | `number`(ポイント) | はい |
| `scale`, `scaleX`, `scaleY` | `number`(倍率) | はい |
| `rotate`, `rotateZ`, `rotateX`, `rotateY` | `number`(度)または`string`(`"45deg"`, `"0.5rad"`) | はい |
| `skewX`, `skewY` | `number`(度)または`string` | いいえ |
| `perspective` | `number`(ポイント) | いいえ |

```rust tabs
view().perspective(px(600.0)).child(view().rotate_y(deg(20.0)).scale(0.95))
```

```tsx tabs
<View style={{ transform: "perspective(600px) rotateY(20deg) scale(0.95)" }} />
```

アニメーション値は、`translate`、`rotate`、`scale`、および`transform`リストのステップを直接駆動します。

```tsx
const x = createAnimatedValue(0);
const angle = createAnimatedValue(0);

<View style={{ translate: [x, 0], rotate: angle }} />
<View style={{ transform: [{ perspective: 800 }, { rotateY: angle }] }} />
```

> [!NOTE]
> Androidはスキューを描画しません。`skew()`、`skewX()`、`skewY()`を指定しても、Androidではビューはスキューされません。

<a id="filters-and-blending"></a>

### フィルターとブレンド

| キー | 型 | Rust | 説明 |
|---|---|---|---|
| `filter` | `string` | `.blur(r)`, `.brightness(…)`, `.contrast(…)`, `.grayscale(…)`, `.hue_rotate(…)`, `.invert(…)`, `.saturate(…)`, `.sepia(…)` | ビューとその内容に対するCSSフィルター: `brightness()`, `contrast()`, `grayscale()`, `hue-rotate()`, `invert()`, `saturate()`, `sepia()`, `opacity()`, `blur()`, `drop-shadow()`。 |
| `backdropFilter` | `string` | `.backdrop_blur(r)`, `.backdrop_brightness(…)`, ... | ビューの背後にあるものに対するCSSフィルター。すりガラス効果の`"blur(10px)"`など。 |
| `maskImage` | `string` | | アルファによってビューのどれだけを描画するかを決めるCSSグラデーション。不透明な部分は完全に描画され、透明な部分はまったく描画されません: `linear-gradient(...)`, `radial-gradient(...)`, `conic-gradient(...)`。バックドロップフィルターを含め、ビューが描画するすべてをマスクします。 |
| `glassEffect` | `"none" \| "regular" \| "clear"` | `.glass_effect(GlassEffect::Regular)` | iOS 26およびmacOS 26以降で、ビューの内容の背後にLiquid Glassを表示します。`"regular"`は標準のマテリアルを使い、`"clear"`は背景から取り込む色が少なくなります。`"none"`がデフォルトです。以前のiOSバージョンや他のプラットフォームで表示されるぼかしには、`backdropFilter`を併用してください。 |
| `mixBlendMode` | `"normal" \| "multiply" \| "screen" \| "overlay" \| "darken" \| "lighten" \| "color-dodge" \| "color-burn" \| "hard-light" \| "soft-light" \| "difference" \| "exclusion" \| "hue" \| "saturation" \| "color" \| "luminosity" \| "plus-darker" \| "plus-lighter"` | `.mix_blend_mode(mode)` | ビューが背後のものとどのようにブレンドされるか。 |

> [!WARNING]
> プラットフォームごとの制限:
> - iOSが適用するのは、`opacity()`、1までの`brightness()`、ビューに対する`drop-shadow()`のみです。`<Image>`はすべてのカラーフィルターと`blur()`を受け付け、画像のデコード時に適用されます。
> - iOSの`backdropFilter`ブラーはシステムマテリアルを一部の強さで使うため、正確な半径の近似になります。
> - Androidでは、`blur()`、`drop-shadow()`、`backdropFilter`にAPI 31が必要です。それ未満ではカラーフィルターのみが適用されます。ブレンドモードにはAPI 29が必要です。

<a id="transitions"></a>

### トランジション

トランジション対象のプロパティが変化すると(新しいスタイル、クラス、または`active:`のようなバリアントによって)、プラットフォームがそれをネイティブにアニメーションさせます。アニメーション中はJSが実行されません。

| キー | 型 | Rust | 説明 |
|---|---|---|---|
| `transitionProperty` | `string` | `.transition()`, `.transition_all()`, `.transition_colors()`, `.transition_opacity()`, `.transition_shadow()`, `.transition_transform()`, `.transition_none()` | アニメーションさせるプロパティのカンマ区切りリスト: `"all"`, `"colors"`(`color`, `backgroundColor`, `borderColor`, ...), `"opacity"`, `"transform"`(すべてのtransformプロパティ), `"boxShadow"`, `"borderRadius"`, `"borderWidth"`, または`"none"`。 |
| `transitionDuration` | `number \| "${number}ms" \| "${number}s"` | `.duration(ms)` | ミリ秒単位の数値、または`"150ms"` / `"0.2s"`。 |
| `transitionDelay` | `number \| "${number}ms" \| "${number}s"` | `.delay(ms)` | トランジションが始まるまでの遅延。 |
| `transitionTimingFunction` | `"linear" \| "ease" \| "ease-in" \| "ease-out" \| "ease-in-out" \| "cubic-bezier(...)"` | `.ease_linear()`, `.ease_in()`, `.ease_out()`, `.ease_in_out()`, `.ease_bezier(…)` | イージングカーブ。 |

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

### キーフレームアニメーション

組み込みのキーフレームアニメーションで、ネイティブに実行されます(Tailwindの`animate-*`)。

| キー | 型 | Rust | 説明 |
|---|---|---|---|
| `animationName` | `"none" \| "spin" \| "ping" \| "pulse" \| "bounce"` | `.animate_spin()`, `.animate_ping()`, `.animate_pulse()`, `.animate_bounce()`, `.animate_none()` | アニメーション。 |
| `animationDuration` | `number \| "${number}ms" \| "${number}s"` | `.animation(KeyframeAnimation { … })` | 1回の繰り返しの長さ。 |
| `animationDelay` | `number \| "${number}ms" \| "${number}s"` | `.animation(KeyframeAnimation { … })` | 最初の繰り返しが始まるまでの遅延。 |
| `animationTimingFunction` | `"linear" \| "ease" \| "ease-in" \| "ease-out" \| "ease-in-out" \| "cubic-bezier(...)"` | `.animation(KeyframeAnimation { … })` | イージングカーブ。 |
| `animationIterationCount` | `number \| "infinite"` | `.animation(KeyframeAnimation { … })` | 実行回数。 |

値、ジェスチャー、スプリングで駆動するアニメーションには、代わりに[`nsh`のアニメーションAPI](./nsh.md#animation)を使用してください。

<a id="pointer-and-selection"></a>

### ポインターと選択

| キー | 型 | Rust | 説明 |
|---|---|---|---|
| `cursor` | `"auto" \| "default" \| "pointer" \| "text" \| "grab" \| "grabbing" \| "not-allowed" \| ...`(すべてのCSSカーソルキーワードと`"none"`) | `.cursor(Cursor)`, `.cursor_pointer()` | ビュー上のポインターの形状。ポインター(iPadのトラックパッド、Mac Catalyst、デスクトップ)向けです。斜めのリサイズキーワードは軸を保ちます: `nwse-resize` / `nw-resize` / `se-resize`(`Cursor::NwseResize`)と`nesw-resize` / `ne-resize` / `sw-resize`(`Cursor::NeswResize`)。Windows、Linux、Android、Web、GPUIは斜めのカーソルを表示します。AppKitではmacOS 15以降でそれを使い、macOS 14では開いた手を使います。UIKitではiPadとMac Catalystでポインターエフェクトを使います。 |
| `pointerEvents` | `"auto" \| "none" \| "box-none" \| "box-only"` | `.pointer_events(PointerEvents::BoxNone)` | ビューとその中のビューが受け取るタッチ(`pointer-events-none`、`pointer-events-auto`)。`"none"`: 受け取らない。中のビューも、`"auto"`を設定しない限り受け取らず、CSSと同様に継承されます。`"box-none"`: ビュー自体は受け取らず、中のビューはそれぞれの設定に従います。`"box-only"`: ビュー自体は受け取り、中のビューは受け取りません(どちらもReact Nativeの仕様で、ビュー自体のみに適用)。デフォルトは`"auto"`。[タッチとジェスチャー](../docs/touch-and-gestures.md#pointerevents)を参照してください。 |
| `userSelect` | `"auto" \| "none" \| "text"` | `.select_text()`, `.select_none()` | `<Text>`を選択してコピーできるか(`"text"`、`select-text`)、できないか(`"none"`、`select-none`)。ビューの設定は、何も設定していない中のテキストに及びます。デフォルトの`"auto"`(`select-auto`)は、周囲のビューに任せ、それがなければプラットフォームに任せます。[テキスト](../elements/text.md)を参照してください。 |

<a id="svg-paint"></a>

### SVGペイント

SVG図形のCSSペイントプロパティです。任意の要素に指定でき、ブラウザーと同様に内側の要素に継承されます。
Rustコンポーネントがキャンバスに描画するものにも適用されます。

| キー | 型 | Rust | 説明 |
|---|---|---|---|
| `fill` | `"none" \| "currentColor" \| ColorValue` | `.fill_color(c)`, `.fill_none()`, `.fill_current()` | 図形の塗りつぶしに使うもの。`currentColor`は要素のテキストの色です。 |
| `stroke` | `"none" \| "currentColor" \| ColorValue` | `.stroke_color(c)`, `.stroke_none()`, `.stroke_current()` | 図形の輪郭の描画に使うもの。 |
| `strokeWidth` | `number \| string` | `.stroke_width(w)` | それらの輪郭の幅。長さで指定します(デフォルトは1)。 |
| `strokeDasharray` | `number \| string` | — | それらの輪郭に沿った破線と間隔: スペースまたはカンマで区切った長さ(`"4 2"`)。奇数個のリストは繰り返されます。または`"none"`。 |

## TextStyle

テキストスタイルは`<Text>`と`<Input>`に適用されます。CSSと同様に継承もされます。ビューに設定したテキストプロパティは、その中のテキストと入力に渡され、ネストした`<Text>`スパンは親のテキストから継承します。`ViewStyle`のすべてのキーも適用されます。[テキスト](../docs/text.md)を参照してください。

<a id="font"></a>

### フォント

| キー | 型 | Rust | 説明 |
|---|---|---|---|
| `color` | `ColorValue \| AnimatedNode` | `.text_color(c)`, `.bind_color(&node)` | テキストの色。ネイティブのアニメーションカラーを受け取ります。色を設定していない枠線とアウトラインの色にもなります。 |
| `fontSize` | `number` | `.text_size(s)`, `.text_sm()`, `.text_lg()`, ... | ポイント単位のサイズ。 |
| `fontWeight` | `"normal" \| "bold" \| number \| "${number}"` | `.font_weight(FontWeight::SEMIBOLD)` | `"normal"`(400)、`"bold"`(700)、または100〜900。 |
| `fontFamily` | `string` | `.font_family(name)` | システムのフォントファミリー、またはインポートしたフォントが評価される名前(`import Inter from "./Inter.ttf"`)、またはそれらのリスト(優先度の高い順、`"Brand, 'Noto Sans SC', sans-serif"`)。[フォント](../docs/fonts.md#fallback-lists)を参照してください。 |
| `fontStyle` | `"normal" \| "italic"` | `.italic()` | イタリック。 |
| `fontVariant` | `FontVariantName[] \| string` | `.small_caps()`, `.oldstyle_nums()`, `.lining_nums()`, `.tabular_nums()`, `.proportional_nums()` | OpenTypeの数字と文字の字形。リスト(`["tabular-nums"]`)、またはスペース区切りのCSSの名前(`"tabular-nums small-caps"`)で指定します。`tabular-nums`は数字の幅を揃えるため、カウンターやタイマーに便利です。 |
<a id="spacing-and-alignment"></a>

### 間隔と配置

| Key | Type | Rust | Description |
|---|---|---|---|
| `lineHeight` | `number` | `.line_height(h)` | 行の高さ(ポイント単位)。 |
| `letterSpacing` | `number` | `.letter_spacing(s)` | 文字間の追加スペース(ポイント単位)。 |
| `textAlign` | `"auto" \| "left" \| "center" \| "right" \| "justify" \| "start" \| "end"` | `.text_left()`, `.text_center()`, `.text_right()`, `.text_justify()` | 水平方向の配置。`"left"` と `"right"` は右から左へのレイアウトでも左右の側を維持します。`"start"` と `"end"` は方向に従います。 |
| `writingDirection` | `"auto" \| "ltr" \| "rtl"` | `.writing_direction(d)` | テキストの基本方向。`"auto"` はコンテンツから方向を決定します。 |
| `textTransform` | `"none" \| "uppercase" \| "lowercase" \| "capitalize"` | `.uppercase()`, `.lowercase()`, `.capitalize()`, `.normal_case()` | 大文字・小文字の変換。 |

> [!TIP]
> Tailwind の `leading-*` クラスと `tracking-*` クラスは、行の高さをフォントサイズの倍数で、文字間隔を `em` で設定するため、`text-*` のサイズに合わせてスケールします。

<a id="lines-and-overflow"></a>

### 行数とオーバーフロー

| Key | Type | Rust | Description |
|---|---|---|---|
| `numberOfLines` | `number` | `.number_of_lines(n)`, `.truncate()` | `<Text>` が表示する最大行数(CSS の `line-clamp`、`line-clamp-*`)。デフォルトの `0`(`line-clamp-none`)はすべての行を表示します。`truncate` は 1 行で、末尾が省略記号で切り詰められます。 |
| `textOverflow` | `"ellipsis" \| "clip" \| "ellipsis-start" \| "ellipsis-middle"` | `.text_overflow(EllipsizeMode::Middle)` | 行数が制限された `<Text>` の切り詰め方。末尾に省略記号(`"ellipsis"`、`text-ellipsis`、デフォルト)、クリップ(`"clip"`、`text-clip`)、または先頭や中央に省略記号(ファイルパス向け)。 |

<a id="decoration"></a>

### 装飾

| Key | Type | Rust | Description |
|---|---|---|---|
| `textDecorationLine` | `"none" \| "underline" \| "line-through" \| "underline line-through"` | `.underline()`, `.line_through()`, `.no_underline()` | テキストと一緒に描画される線。 |
| `textDecorationColor` | `ColorValue` | `.text_decoration_color(c)` | 線の色(デフォルトはテキストの色)。 |
| `textDecorationStyle` | `"solid" \| "double" \| "dotted" \| "dashed" \| "wavy"` | `.text_decoration_solid()`, `_double()`, `_dotted()`, `_dashed()`, `_wavy()` | 線のスタイル。 |
| `textDecorationThickness` | `number \| "auto" \| "from-font"` | `.text_decoration_thickness(t)` | 線の太さ。 |
| `textUnderlineOffset` | `number \| "auto"` | `.underline_offset(o)` | ベースラインから下線までの距離。 |

<a id="placeholder-caret-and-selection"></a>

### プレースホルダー、キャレット、選択

`placeholderColor` と `caretColor` は `InputStyle`(`<Input>` のスタイル)に属します。`selectionColor` は `TextStyle` に属し、選択可能なテキストもこれを受け付けます。

| Key | Type | Rust | Description |
|---|---|---|---|
| `placeholderColor` | `ColorValue` | input の `.placeholder_color(c)` | `<Input>` のプレースホルダーの色(`placeholder:text-*`)。 |
| `textAlignVertical` | `"auto" \| "top" \| "center" \| "bottom"` | | ボックスより短いテキストが配置される位置(高さを持つ `<Text>`)。 |
| `selectionColor` | `ColorValue` | input または text の `.selection_color(c)` | `<Input>` または選択可能な `<Text>` の選択ハイライトとハンドル(`selection:bg-*`)。デフォルトはプラットフォームのアクセントカラーです。iOS では、`caretColor` が設定されていない場合、input のキャレットにも適用されます(UIKit は両方を 1 つの色で着色します)。 |
| `caretColor` | `ColorValue` | input の `.caret_color(c)` | `<Input>` のキャレット(`caret-*`)。未設定の場合はプラットフォームのデフォルトになります。 |

<a id="text-shadow"></a>

### テキストシャドウ

| Key | Type | Rust | Description |
|---|---|---|---|
| `textShadow` | `string \| TextShadowLayer[]` | `.text_shadow([TextShadow { … }])`, `.text_shadow_sm()`, `.text_shadow_color(c)` | CSS の `text-shadow`。オフセット、ぼかし、色(`"0 1px 2px rgb(0 0 0 / 0.3)"`)、またはそのレイヤーを数値で指定します(`[{ x, y, blur, color }]`)。複数のレイヤーは最も幅の広いもの 1 つとして描画されます。色のないレイヤーはテキストの色で描画されます。`"none"`。 |

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
> iOS では、`<Text>` にグラデーション(`backgroundImage`)も内側のボックスシャドウも描画されません。

## ImageStyle

`ViewStyle` のすべてのキーに加えて、次のキーがあります。

| Key | Type | Rust | Description |
|---|---|---|---|
| `tintColor` | `ColorValue` | image の `.tint_color(c)` | テンプレート画像を着色します(不透明なピクセルはすべてこの色になります)。モノクロのアイコン向けです。 |
| `objectFit` | `"fill" \| "contain" \| "cover" \| "none" \| "scale-down"` | `.object_fit(ResizeMode::Contain)` | CSS の `object-fit`。画像や動画がボックスにどのようにフィットするかを指定します。`"cover"` はボックスを埋めて切り抜き、`"contain"` はボックス内に収め、`"fill"` は引き伸ばし、`"none"` は元のサイズを保ち、`"scale-down"` は `"none"` と `"contain"` のうち小さい方になります。画像はデフォルトでボックスを覆い、動画はボックス内に収められます。 |
| `objectPosition` | `string` | image の `.object_position(p)`, `.object_top()`, ... | `objectFit` がサイズを決めた後、ボックス内で画像が配置される位置。CSS の `object-position` と同様に、キーワード、パーセンテージ、長さを指定できます(`"top"`、`"left bottom"`、`"25% 75%"`、`"right 10px bottom 20%"`)。ボックスを覆う画像はこの位置を中心に切り抜かれます。デフォルトは中央です。 |

`objectFit` は `<Video>` にも適用されます。[image](../elements/image.md) と [video](../elements/video.md) を参照してください。

<a id="props-that-look-like-styles"></a>

## スタイルのように見える props

Android のマテリアルシャドウはプラットフォーム固有の prop であり、スタイルの隣に設定します。

| Setting | Prop | Rust | Class |
|---|---|---|---|
| マテリアルシャドウ(Android) | `android={{ elevation }}` | `.elevation(e)` | |

<a id="related"></a>

## 関連項目

- [Styling](../docs/styling.md): `style`、`class`、継承と優先順位。
- [Tailwind reference](./tailwind-reference.md): サポートされているすべてのユーティリティとバリアント。
- [Layout](../docs/layout.md): flexbox と grid の実践。
- [view](../elements/view.md)、[text](../elements/text.md)、[image](../elements/image.md): これらのスタイルが適用される要素。

`width`、`height`、`flexBasis` は、Taffy によって計算される `"min-content"`、`"max-content"`、`"fit-content"` も受け付けます。
