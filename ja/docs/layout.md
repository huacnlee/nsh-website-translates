---
title: "レイアウト"
description: "列方向がデフォルトのFlexbox、CSSグリッド、サイズとパーセンテージ、アスペクト比、絶対位置指定、onLayoutによる計測、レスポンシブレイアウト、右から左への表記(RTL)対応について、RustとTSXで解説します。"
order: 34
group: ui
demo: guide-layout
source_hash: f4073f703fc9be46
---

# レイアウト

NSH はすべての要素を、CSS の flexbox、grid、ブロックレイアウトの Rust 実装である [Taffy](https://github.com/DioxusLabs/taffy) でレイアウトします。デフォルトでは、子要素は縦に積まれ、縮小しないように設定されています。レイアウトはコア内で、コードの各ターンの後に実行され、変更されたフレームだけがネイティブビューに送られます。テキストはプラットフォームのテキストエンジンによって同じスレッド上で計測されるため、レイアウトがメインスレッドを待つことはありません。

以下のレイアウトプロパティはスタイルプロパティです。Rust では型付きのスタイルメソッド（`.flex_row()`、`.gap_4()`、`.grid_cols(3)`、`.absolute().inset_0()`）、TSX では `style` prop のキーであり、それぞれに [Tailwind](./tailwind.md) クラス（`flex-row`、`gap-4`、`grid-cols-3`、`absolute inset-0` など）があります。どちらも同じネイティブスタイルに変換されます。

## Flexbox

ビューは flexbox で子要素をレイアウトします。`display` を設定していないビューは、子要素を列に積みます。スタイルの `display: "flex"` は、`flexDirection` が設定されていない限り行になります。これは CSS や Tailwind の `flex` クラスと同じです。何も設定されていない場合は、次のデフォルトが適用されます。

| プロパティ | NSH のデフォルト | Web のデフォルト |
|---|---|---|
| `flexDirection` | `"column"`（`display` を設定していないビュー）、`display: "flex"` を設定すると `"row"` | `row` |
| `flexShrink` | `0` | `1` |
| `alignContent` | `"flex-start"`（grid では `"normal"`） | `normal` |
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

| プロパティ | 値 | Rust |
|---|---|---|
| `flexDirection` | `"column"`、`"row"`、`"column-reverse"`、`"row-reverse"` | `.flex_col()`、`.flex_row()`、`.flex_col_reverse()`、`.flex_row_reverse()` |
| `justifyContent` | 主軸：`"flex-start"`、`"flex-end"`、`"start"`、`"end"`、`"center"`、`"space-between"`、`"space-around"`、`"space-evenly"`、`"stretch"` | `.justify_start()`、`.justify_center()`、`.justify_end()`、`.justify_between()`、`.justify_around()`、`.justify_evenly()` |
| `alignItems` | 交差軸：`"stretch"`、`"flex-start"`、`"flex-end"`、`"start"`、`"end"`、`"self-start"`、`"self-end"`、`"center"`、`"baseline"` | `.items_stretch()`、`.items_start()`、`.items_center()`、`.items_end()`、`.items_baseline()` |
| `alignSelf` | 個々の子要素の交差軸方向の配置。`"auto"` は親の `alignItems` に従う | `.self_start()`、`.self_center()`、`.self_end()`、`.self_stretch()` |
| `alignContent` | 折り返すコンテナの各行 | |
| `flexWrap` | `"nowrap"`、`"wrap"`、`"wrap-reverse"` | `.flex_wrap()` |
| `flex` | 数値 1 つの省略記法（後述） | `.flex_1()`、`.flex_auto()`、`.flex_none()` |
| `flexGrow`、`flexShrink`、`flexBasis` | CSS と同じ | `.flex_grow(n)`、`.flex_shrink(n)`、`.flex_shrink_0()`、`.basis(length)` |
| `gap`、`rowGap`、`columnGap` | 子要素間のスペース | `.gap(length)`、`.gap_y(length)`、`.gap_x(length)`、およびステップ `.gap_2()`、`.gap_x_4()` など |

`flex-start` と `flex-end` はフレックス方向に従い、`start` と `end` は CSS と同様に書字方向に従います（右から左の場合、`start` は右側です）。`self-start` / `self-end` は子要素自身のものに従います。

`flex` は CSS の省略記法であり、Tailwind の `flex-*` クラスも同様です。数値 `n` は、`n` で拡大し、1 で縮小し、basis 0 から開始することを意味します。そのため、`flex: 1` を指定した兄弟要素（Rust では `.flex_1()`、`flex-1`）は、コンテンツに関係なくスペースを均等に分け合います。`"none"` は `0 0 auto`（ビューは自身のサイズを保つ）、`"auto"` は `1 1 auto`、`"initial"` は `0 1 auto` であり、grow、shrink、basis は個別に書くこともできます（`"2 0 50%"`、`"1 1 120px"`）。最小サイズのデフォルトは 0 なので、`minWidth: "auto"` でコンテンツのサイズを保たない限り、`flex: 0`（`0 1 0`）はビューを 0 まで縮小します。

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

最小サイズのデフォルトが 0 であるため、行の中の `flex: 1` テキストは、兄弟要素を押し出すことなく縮小して折り返されます。`minWidth: "auto"` / `minHeight: "auto"`（Rust では `min-w-auto` / `min-h-auto`、`.min_w(auto())`）は CSS の自動最小値です。縮小する要素は、Web と同様に、コンテンツの最小サイズ（テキストでは最も長い単語）で止まります。

> [!NOTE]
> `display: "flex"` は、スタイル、クラス（`flex`）、Rust（`.flex()`）のいずれでも、方向が設定されていなければ行を意味します：`{ display: "flex", flexDirection: "column" }`、`flex flex-col`、`.flex().flex_col()`。`display` のないビューは、何も指定しなくても列になります。

<a id="sizes"></a>

## サイズ

| プロパティ | 値 | Rust |
|---|---|---|
| `width`、`height` | ポイント、親に対する割合（`"50%"`）、または `"auto"` | `.w(px(120.0))`、`.h(relative(0.5))`、`.w_full()`、`.size(px(44.0))`、ステップ `.w_10()` など |
| `minWidth`、`maxWidth`、`minHeight`、`maxHeight` | ポイントまたは割合。`minWidth` / `minHeight` では、コンテンツの最小サイズを表す `"auto"` も使えます | `.min_w(..)`、`.max_w(..)`、`.min_h(..)`、`.max_h(..)` |
| `aspectRatio` | 幅を高さで割った値：`1`、`16 / 9` | `.aspect_ratio(16.0 / 9.0)`、`.aspect_square()` |
| `padding`、`paddingHorizontal`、`paddingVertical`、`paddingTop` など | ポイントまたは割合 | `.p(..)`、`.px(..)`、`.py(..)`、`.pt(..)` など、およびステップ `.p_4()`、`.px_2()` など |
| `margin`、`marginHorizontal`、`marginVertical`、`marginTop` など | ポイント、割合、または `"auto"` | `.m(..)`、`.mx(..)`、`.my(..)`、`.mt(..)` など、`.mx(auto())` |

Rust では長さに型があります。`px(16.0)` は 16 ポイント、`relative(0.5)` は親の 50%、`auto()` は `auto` です。ステップメソッドは、1 ステップあたり 4 ポイントという Tailwind のスペーシングスケールに従います（`.p_4()` は 16 ポイント、`.gap_0p5()` は 2 ポイント）。

サイズを指定しない場合、ビューはコンテンツ（とパディング）と同じ大きさになり、デフォルトの `alignItems: "stretch"` によって親の交差軸方向に引き伸ばされます。割合は親のサイズが基準です（padding と margin は、CSS と同様に親の幅が基準です）。

`aspectRatio` は、わかっている一方の寸法から、もう一方の寸法を決めます。

```rust tabs
view().w_full().aspect_ratio(16.0 / 9.0).bg(black())
```

```tsx tabs
<View style={{ width: "100%", aspectRatio: 16 / 9, backgroundColor: "#000000" }} />
```

アプリのアセットの画像には固有のサイズがあり、サイズを指定しなければそのサイズでレイアウトされます（[画像とアセット](./images-and-assets.md)）。リモート画像は読み込まれるまでサイズを持たないため、サイズを指定してください。

## Grid

`display: "grid"`（Rust では `.grid()`）は、子要素を CSS grid のトラックにレイアウトします。

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

| プロパティ | 値 | Rust |
|---|---|---|
| `gridTemplateColumns`、`gridTemplateRows` | CSS のトラックリスト：`"repeat(3, 1fr)"`、`"200px 1fr"`、`minmax()`、`auto-fill` / `auto-fit`、ライン名 | `.grid_cols(3)`、`.grid_rows(2)`、`.grid_template_columns("200px 1fr")`、`.grid_template_rows(..)` |
| `gridAutoColumns`、`gridAutoRows` | 暗黙的に作成される列と行のトラック | |
| `gridAutoFlow` | `"row"`、`"column"`、`"dense"`、`"row dense"`、`"column dense"` | `.grid_flow_col()`、`.grid_flow_dense()` |
| `gridColumn`、`gridRow` | `"1 / 3"`、`"span 2"`、ライン番号または名前：`"content-start / content-end"`、`"2 col"`（`col` という名前の 2 番目のライン）、`"span col"`（`col` という名前の次のラインまで） | `.col_span(2)`、`.row_span(2)`、`.col_span_full()` |
| `gridColumnStart`、`gridColumnEnd`、`gridRowStart`、`gridRowEnd` | ライン番号または名前 | `.col_start(1)`、`.col_end(3)`、`.row_start(..)`、`.row_end(..)`（ライン番号） |
| `justifyItems`、`justifySelf` | アイテムが行方向にエリア内でどのように配置されるか：`"start"`、`"end"`、`"center"`、`"stretch"` など | |
| `alignItems`、`alignSelf` | アイテムが列方向にエリア内でどのように配置されるか | `.items_*()`、`.self_*()` |
| `justifyContent`、`alignContent` | トラックが行方向と列方向に grid 内でどのように配置されるか | `.justify_*()` |

テンプレートでは、ラインに角括弧で 1 つまたは複数の名前を付け、CSS と同様にその名前でアイテムを配置します（Rust ではラインの番号で配置します）。

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

grid では、`justifyContent` と `alignContent` のデフォルトは CSS の `"normal"` です。サイズが `auto` のトラックはコンテナを埋めるように伸びるため、高さがあって行テンプレートのない grid では、その高さが各行で分け合われます。明示的に設定した値（`"start"`、`"center"`、`"space-between"` など）は、CSS と同じようにトラックを配置します。アライメントクラスは、Tailwind CSS とまったく同じ値を設定します。`content-start`（`align-content: flex-start`）と `place-content-start` はトラックを先頭に詰め、`content-normal` と `justify-normal` はブラウザと同様にトラックを引き伸ばします。

`display: "block"` は CSS のブロックレイアウトを使用し（子要素は積み重ねられ、それぞれコンテナと同じ幅になります）、`display: "none"`（`.hidden()`）はビューをレイアウトから除外します。

<a id="absolute-positioning"></a>

## 絶対配置

`position: "absolute"`（`.absolute()`）はビューをフローから外し、親を基準に `top`、`right`、`bottom`、`left` で配置します。

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

オフセットにはポイントと割合を指定できます（Rust では `.top(..)`、`.right(..)`、`.bottom(..)`、`.left(..)`、`.inset(..)`）。`left` と `right`（または `top` と `bottom`）を指定し、サイズを指定していないビューは、それらの間に引き伸ばされます。後の兄弟要素は前の要素より上に描画されます。`zIndex`（`.z_index(n)`）で順序を変更できます。

<a id="measuring"></a>

## 計測

`onLayout`（`.on_layout(..)`）は、変更があったレイアウトのたびに、親を基準としたビューのフレームを通知します。

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

フレームの単位はポイントです。Rust では `Bounds<Points>`、TSX では `{ bounds }`、すなわち `Bounds`（`{ origin: { x, y }, size: { width, height } }`）です。ウィンドウ全体については、Rust では `window()`、TSX では [`nsh`](../modules/nsh.md#device) の `windowSize()` を読み取ります。どちらも回転やウィンドウのリサイズに追従し、これらを読み取るスタイルはウィンドウに合わせて変化します。

```rust tabs
view().style_when(|| window().width > px(600.0), |s| s.flex_row())
```

```tsx tabs
import { View } from "nsh";
import { windowSize } from "nsh";

<View style={{ flexDirection: windowSize().width > 600 ? "row" : "column" }} />
```

Tailwind のブレークポイント（`sm:`、`md:` など）と `portrait:` / `landscape:` を使えば、コードを書かずに同じ結果が得られます。

<a id="safe-areas"></a>

## セーフエリア

ルートビューは、ステータスバーとホームインジケーターの下を含め、画面全体を覆います。画面には、CSS の `env()`（`paddingTop: "env(safe-area-inset-top)"`、Tailwind では `pt-[env(safe-area-inset-top)]`、Rust では `.p_safe_area()`。[セーフエリア](../elements/safe-area.md)を参照）でセーフエリアのインセット分のパディングを付けるか、Rust では `safe_area()`、TSX では `safeArea()` / `safeAreaInsets()` でインセットを読み取って自分で適用します。[ナビゲーションスタック](./navigation.md)のページは、すでにヘッダーの下に配置されています。

<a id="right-to-left"></a>

## 右から左

アプリのレイアウト方向はシステムの言語に従います。ビューの `direction` スタイル（`"ltr"`、`"rtl"`、または `"inherit"`。Rust では `.direction(LayoutDirection::Rtl)`）は、そのサブツリーの方向を設定します。アプリが右から左にレイアウトされる場合は、次のようになります。

- 行は右から始まります。
- `left` と `right` は、ブラウザと同様に、スタイルキーでもクラスでも、それぞれの側を保ちます。`paddingLeft`、`marginLeft`、`left`、`borderLeftWidth`、`borderTopLeftRadius`、`textAlign: "left"` と `pl-4`、`ml-2`、`left-0`、`border-l`、`rounded-tl-lg`、`text-left` は左側のままです。
- 論理プロパティは方向に従い、inline start は右側になります：`marginStart`、`marginEnd`、`paddingStart`、`paddingEnd`、`start`、`end`、`borderStartWidth`、`borderEndColor`、`borderTopStartRadius` など、`textAlign: "start"` / `"end"`（クラスでは `ps-4`、`ms-2`、`start-0`、`border-s`、`rounded-ss-lg`、`text-start`。Rust では `.ms(..)`、`.me(..)`、`.ps(..)`、`.pe(..)`、`.border_s(..)`、`.rounded_ss(..)` など）。`marginHorizontal` と `paddingHorizontal` は両側を設定します。
- `textAlign: "auto"` を指定したテキストは右揃えになり、ネイティブコントロールは反転します。

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

言語またはビューの方向を変更すると、再起動することなくただちに反映されます。`direction` スタイルを使うと、1 つのビューとその子要素を独自の方向に保つこともできます。たとえば、電話番号を左から右に表示する場合です。Android では、NSH を組み込むアプリで、ネイティブコントロールを反転させるために、マニフェストに `android:supportsRtl="true"` が必要です。

<a id="related"></a>

## 関連項目

- [スタイリング](./styling.md)：スタイルの組み合わせ方。
- [スクロール](./scrolling.md)と[リスト](./lists.md)：画面に収まらないコンテンツ。
- [スタイルリファレンス](../modules/style-reference.md)：すべてのレイアウトプロパティとその型。
