---
title: "Tailwind リファレンス"
description: "NSH がネイティブに解決するすべての Tailwind ユーティリティとバリアント、任意値の構文、および nsh.json でテーマを拡張する方法。"
order: 17
source_hash: 11bee6a70fb79c0f
---

# Tailwind リファレンス

すべての要素は、`class` prop(条件付きのクラスは `classList`)で Tailwind CSS のクラスを受け取ります。NSH は Tailwind 4 のデフォルトテーマに対して、これらを Rust 内で解決します。JS が渡すのは文字列だけで、異なる文字列は一度だけ解析されてキャッシュされます。`dark:` や `active:` などのバリアントは、外観、ウィンドウサイズ、押下状態が変化したときに、JS を実行せずネイティブに再評価されます。

各ユーティリティは、Tailwind CSS 4 が生成するものとまったく同じ内容を、ブラウザーと同じ意味で設定します。このページではサポートされているものを一覧にしています。概要については [Tailwind](../docs/tailwind.md) を、ユーティリティが設定するスタイルキーについては [Style リファレンス](./style-reference.md) を参照してください。

Rust コンポーネントはクラス文字列を受け取らず、`Styled`(`nsh_core::prelude`)の型付きメソッドで要素をスタイルします。メソッド名はこれらのユーティリティに由来し、同じ値に解決されます。Tailwind のデフォルトスケールも含まれます(`px-4` は `.px_4()`、`rounded-2xl` は `.rounded_2xl()`、`shadow-md` は `.shadow_md()`、`bg-linear-to-br` は `.bg_linear_to_br()`)。色は値として扱われ、テーマカラー、または `nsh_core::element::palette` としての Tailwind のパレットを使います(`ZINC.shade(800)` は `zinc-800`)。バリアントはスタイルのクロージャを受け取るメソッドです: `.active(|s| …)`、`.hover(…)`、`.focus(…)`、`.disabled_style(…)`、`.dark(…)`、`.group_active(…)`、そしてそれ以外には `.style_when(condition, …)`。[Style リファレンス](./style-reference.md) に、各スタイルキーに対応するメソッド名が記載されています。

```rust tabs
use nsh_core::{element::palette::{RED, ZINC}, prelude::*};

view()
    .flex_row()
    .items_center()
    .gap_3()
    .rounded_2xl()
    .bg(white())
    .p_4()
    .shadow_md()
    .active(|s| s.scale(0.98))
    .transition()
    .dark(|s| s.bg(ZINC.shade(800)))
    .child(
        text("Inbox")
            .text_base()
            .font_weight(FontWeight::SEMIBOLD)
            .text_color(ZINC.shade(900))
            .dark(|s| s.text_color(white())),
    )
    .child(
        text(move || unread.get().to_string())
            .text_color(move || if unread.get() > 0 { RED.shade(500) } else { ZINC.shade(400) }),
    )
```

```tsx tabs
<View class="flex-row items-center gap-3 rounded-2xl bg-white p-4 shadow-md active:scale-[0.98] transition dark:bg-zinc-800">
  <Text class="text-base font-semibold text-zinc-900 dark:text-white">Inbox</Text>
  <Text classList={{ "text-red-500": unread() > 0, "text-zinc-400": unread() === 0 }}>{unread()}</Text>
</View>
```

<a id="how-classes-combine"></a>

## クラスの組み合わせ方

- **後のものが優先されます。** 同じバリアントレベルのユーティリティ同士では、文字列内で後ろにあるものが優先されます: `"p-4 p-2"` は `p-2` になります。コンポーネントは `class` prop を受け取り、`tailwind-merge` なしで自身のクラスの後ろに追加できます。
- **バリアントは通常のユーティリティの後に適用されます。** 適用順は Tailwind のバリアント順に従います: `group-*:`(状態順、次にグループ名順)、`selection:`、`placeholder:`、位置(`first:` ...)、`checked:`、`indeterminate:`、`selected:`、`focus-within:`、`hover:`、`focus:`、`focus-visible:`、`active:`、`enabled:`、`disabled:`、`aria-busy:`、`aria-checked:`、`aria-expanded:`、`aria-pressed:`、`aria-selected:`、`data-*:`(名前順)、モーション、`max-*:` ブレークポイント(広い順、次に昇順)、向き、方向、`dark:`、そしてプラットフォーム。クラスの最上位のバリアントで順序が決まり、次にその次の上位のバリアントで決まります。さらにバリアントが 1 つ増えるものは後になります(`dark:hover:` は `dark:` の後)。これは Tailwind の並べ方と同じです。したがって `"active:bg-red-500 bg-blue-500"` は、押されている間は赤になります。
- **`style` はクラスより優先されます。** インラインの `style` は、解決されたクラスの上に適用されます。スタイルキーは、同名の CSS プロパティ(ユーティリティが設定するもの)であり、そのプロパティだけを置き換えます: `style={{ paddingLeft: 8 }}` は `pl-4` に勝ち、`pr-4` は維持されます。important のユーティリティ(`!p-4` または `p-4!`)は、インラインスタイルにも勝ちます。
- **テキストスタイルは継承されます。** ビューに指定したテキストユーティリティ(`text-white`、`font-bold`、`text-center` ...)は、CSS と同様に、その内部の `<Text>` 要素と `<Input>` 要素に引き継がれます。
- **display は CSS に従います。** `flex` と `inline-flex` は、方向ユーティリティが文字列のどこかで指定されていない限り row になります(`flex-col flex` は column)。スタイルの `display: "flex"` も同様に row です。display を設定しないビューは、NSH のデフォルトである column のままです。

<a id="units-and-the-theme"></a>

## 単位とテーマ

長さはポイントです(`1` = iOS では 1 ポイント、Android では 1 dp)。Tailwind の `1rem` は 16 ポイントなので、テーマは同じ密度の Web と一致します。スペーシングの 1 ステップは 4 ポイントです(`p-4` = 16 ポイント)。`text-base` は 16 ポイントです。

<a id="spacing-values"></a>

### スペーシング値

スペーシング値を取るユーティリティ(パディング、マージン、gap、inset、幅、高さ、`basis`、`translate`、`leading`)は、次の値を受け取ります:

| 値 | 例 | 結果 |
|---|---|---|
| ステップ(4分の1ステップも可) | `p-4`、`gap-1.5`、`m-0.25` | ステップ × 4 ポイント |
| `px` | `p-px`、`-mt-px` | 1 ポイント |
| `0` | `m-0` | 0 |
| 分数(inset、幅、高さ、`basis`、`translate`) | `w-1/2`、`left-1/3` | 親要素に対する割合 |
| `full`(同じ) | `w-full`、`inset-full` | 100% |
| `auto`(マージン、inset、幅、高さ、basis) | `mx-auto`、`w-auto` | `"auto"` |
| 任意値 | `p-[13px]`、`w-[42%]`、`mt-[1.5rem]` | 指定した長さ |

マージン、inset、`translate`、`rotate`、`skew`、`scale`、`z`、`hue-rotate`、`tracking`、`underline-offset`、`outline-offset`、グリッド線、グラデーションの角度は、先頭に `-` を付けると負の値になります: `-mt-2`、`-translate-x-1/2`、`-rotate-6`。Tailwind にはそれ以外のユーティリティ(`-p-4`、`-gap-2`、`-w-4`)の負の形式がなく、NSH にもありません。

<a id="colors"></a>

### 色

Tailwind 4 のパレット全体が組み込まれています: `red`、`orange`、`amber`、`yellow`、`lime`、`green`、`emerald`、`teal`、`cyan`、`sky`、`blue`、`indigo`、`violet`、`purple`、`fuchsia`、`pink`、`rose`、`slate`、`gray`、`zinc`、`neutral`、`stone`、`mauve`、`olive`、`mist`、`taupe`。それぞれにシェード `50`、`100`–`900`、`950` があります。これに加えて `black`、`white`、`transparent` があります。独自の色は `nsh.json` から追加できます([テーマのカスタマイズ](#theme-customization) を参照)。

すべての色ユーティリティは、次の形式を受け取ります:

| 形式 | 例 |
|---|---|
| テーマカラー | `bg-sky-500`、`text-brand` |
| 不透明度モディファイア(パーセント) | `bg-black/50`、`ring-black/5` |
| 任意の不透明度 | `text-black/[0.35]` |
| 任意の色 | `bg-[#0ea5e9]`、`border-[rgb(0_0_0_/_0.1)]`、`text-[oklch(70%_0.2_50)]` |
| モディファイア付きの任意の色 | `bg-[rgb(0_0_255)]/25` |

`currentColor` と `inherit` は色の値ではありません。ブラウザーと同様に、色クラスのないボーダー、アウトライン、リングは、要素自身のテキスト色、または継承したテキスト色で描画されます(`<View class="text-white"><View class="border ring-2" /></View>` は両方を白で描画します)。色を指定せずに `style` prop で幅だけを設定したボーダーも同様です。

<a id="arbitrary-values"></a>

## 任意値

角括弧を使うと、テーマにない値を渡せます: `w-[37px]`、`grid-cols-[200px_1fr]`、`bg-[linear-gradient(45deg,red,blue)]`。

- `_` はスペースを表します(`grid-cols-[1fr_2fr]`)。リテラルのアンダースコアには `\_` と書きます。
- 長さ: 数値のみ、または `px`(ポイント)、`pt`(CSS と同じく 1 ポイントの 4/3)、`rem`(16 ポイント)、そしてパーセントが意味を持つ場所では `%`。
- 角度(`rotate-[...]`、`hue-rotate-[...]`、`bg-linear-[...]`): `deg`、`rad`、`grad`、`turn`。
- 時間(`duration-[...]`、`delay-[...]`): `ms` または `s`。数値のみの場合はミリ秒です。
- 型ヒントで曖昧な値を解決できます: `text-[length:22px]` はサイズ、`text-[color:#333]` は色です。`border-[length:3px]` も同様です。

任意の CSS プロパティ(`[mask-type:luminance]`)はサポートされていません。

<a id="layout"></a>

## レイアウト

| クラス | 設定内容 |
|---|---|
| `flex`、`inline-flex` | `display: "flex"`。方向ユーティリティがない限り row |
| `grid`、`inline-grid` | `display: "grid"` |
| `block`、`flow-root` | ブロックレイアウト、または独立したブロック整形コンテキスト |
| `box-border`、`box-content` | 寸法にボーダーとパディングを含めるか、コンテンツのみとするか |
| `w/h/size-min`、`w/h/size-max`、`w/h/size-fit` | Taffy の固有サイズ: `min-content`、`max-content`、`fit-content` |
| `inline`、`inline-block` | `display: "block"`: flex または grid の親内でブラウザーが計算する値 |
| `hidden` | `display: "none"` |
| `relative`、`absolute` | `position` |
| `static` | `position: "static"`: フロー内に配置され、inset は無視されます。絶対配置の子孫は、最も近い位置指定された祖先を基準にします |
| `sticky` | `position: "sticky"`: フロー内に配置され、親が表示されている間、周囲のスクロールビュー内で `top`(横スクロールビューでは `left`)に固定されます |
| `fixed` | `position: "fixed"`: ルートビュー(ウィンドウまたはそのモーダル)のボックス内でレイアウトされ、ルートビューの子より上に表示される要素。周囲がスクロールしてもその場に留まります |
| `inset-<n>`、`inset-x-<n>`、`inset-y-<n>` | `top` / `right` / `bottom` / `left` |
| `top-<n>`、`right-<n>`、`bottom-<n>`、`left-<n>` | 対応するオフセット |
| `start-<n>`、`end-<n>` | `start` / `end`(方向対応) |
| `z-<n>`、`z-auto`、`z-[<n>]` | `zIndex`(`z-auto` は 0) |
| `visible` | `visibility: "visible"` |
| `invisible`、`collapse` | `visibility: "hidden"`(スペースは維持されます) |
| `overflow-hidden`、`overflow-clip`、`overflow-x-hidden`、`overflow-y-hidden` | `overflow: "hidden"` |
| `overflow-visible` | `overflow: "visible"` |
| `aspect-square`、`aspect-video`、`aspect-<a>/<b>`、`aspect-[<a>/<b>]`、`aspect-auto` | `aspectRatio`(1、16/9、a/b、なし) |

スクロールはクラスではなく要素で行います: `overflow-auto` と `overflow-scroll` はサポートされていません。[scroll](../elements/scroll.md) を使用してください。

<a id="flexbox-and-grid"></a>

## Flexbox とグリッド

| クラス | 設定内容 |
|---|---|
| `flex-row`、`flex-row-reverse`、`flex-col`、`flex-col-reverse` | `flexDirection` |
| `flex-wrap`、`flex-wrap-reverse`、`flex-nowrap` | `flexWrap` |
| `flex-1` | grow 1、shrink 1、basis 0 |
| `flex-<n>` | grow n、shrink 1、basis 0 |
| `flex-auto` | grow 1、shrink 1、basis auto |
| `flex-initial` | grow 0、shrink 1、basis auto |
| `flex-none` | grow 0、shrink 0、basis auto |
| `flex-[<grow>]`、`flex-[<grow>_<shrink>_<basis>]` | CSS のショートハンド: `flex-[2]`、`flex-[3_0_50%]` |
| `grow`、`grow-<n>`、`grow-[<n>]` | `flexGrow`(単独指定: 1) |
| `shrink`、`shrink-<n>`、`shrink-[<n>]` | `flexShrink`(単独指定: 1) |
| `basis-<n>` | `flexBasis`(スペーシング、分数、`full`、`auto`、任意値) |
| `justify-start`、`justify-end`、`justify-center`、`justify-between`、`justify-around`、`justify-evenly`、`justify-stretch`、`justify-normal` | `justifyContent` |
| `items-start`、`items-end`、`items-center`、`items-baseline`、`items-stretch` | `alignItems` |
| `self-auto`、`self-start`、`self-end`、`self-center`、`self-stretch`、`self-baseline` | `alignSelf` |
| `content-start`、`content-end`、`content-center`、`content-between`、`content-around`、`content-evenly`、`content-stretch`、`content-normal` | `alignContent` |
| `justify-items-start`、`-end`、`-center`、`-stretch`、`-normal` | `justifyItems` |
| `justify-self-auto`、`-start`、`-end`、`-center`、`-stretch` | `justifySelf` |
| `place-content-center`、`-start`、`-end`、`-between`、`-stretch` | `alignContent` と `justifyContent` |
| `place-items-center`、`-start`、`-end`、`-stretch` | `alignItems` と `justifyItems` |
| `place-self-auto`、`-center`、`-start`、`-end`、`-stretch` | `alignSelf` と `justifySelf` |
| `gap-<n>`、`gap-x-<n>`、`gap-y-<n>` | `gap`、`columnGap`、`rowGap` |
| `space-x-<n>`、`space-y-<n>`(および負の値) | 最後を除く各子要素のマージン: 終端側のマージン(`space-x`)または下マージン(`space-y`)。Tailwind CSS と同様に子自身のマージンの下に適用され、`gap` に加算されます |
| `space-x-reverse`、`space-y-reverse` | 代わりに開始側 / 上側のマージン(子が逆順の場合) |
| `grid-cols-<n>` | `gridTemplateColumns: "repeat(n, minmax(0, 1fr))"` |
| `grid-cols-[<tracks>]`、`grid-cols-none` | `gridTemplateColumns`(`grid-cols-[200px_1fr]`) |
| `grid-rows-<n>`、`grid-rows-[<tracks>]`、`grid-rows-none` | `gridTemplateRows` |
| `col-span-<n>`、`col-span-full`、`col-auto`、`col-<n>`、`col-[<value>]` | `gridColumn` |
| `col-start-<n>`、`col-end-<n>`(および `-auto`) | `gridColumnStart`、`gridColumnEnd` |
| `row-span-<n>`、`row-span-full`、`row-auto`、`row-<n>`、`row-[<value>]` | `gridRow` |
| `row-start-<n>`、`row-end-<n>`(および `-auto`) | `gridRowStart`、`gridRowEnd` |
| `grid-flow-row`、`grid-flow-col`、`grid-flow-dense`、`grid-flow-row-dense`、`grid-flow-col-dense` | `gridAutoFlow` |
| `auto-cols-auto`、`-min`、`-max`、`-fr`、`auto-cols-[<track>]` | `gridAutoColumns` |
| `auto-rows-auto`、`-min`、`-max`、`-fr`、`auto-rows-[<track>]` | `gridAutoRows` |

<a id="spacing"></a>

## スペーシング

| クラス | 設定内容 |
|---|---|
| `p-<n>`、`px-<n>`、`py-<n>` | `padding`、`paddingHorizontal`、`paddingVertical` |
| `pt-<n>`、`pr-<n>`、`pb-<n>`、`pl-<n>` | `paddingTop` / `Right` / `Bottom` / `Left` |
| `ps-<n>`、`pe-<n>` | `paddingStart`、`paddingEnd`(方向対応) |
| `m-<n>`、`mx-<n>`、`my-<n>` | `margin`、`marginHorizontal`、`marginVertical` |
| `mt-<n>`、`mr-<n>`、`mb-<n>`、`ml-<n>` | `marginTop` / `Right` / `Bottom` / `Left` |
| `ms-<n>`、`me-<n>` | `marginStart`、`marginEnd`(方向対応) |

<a id="sizing"></a>

## サイズ指定

| クラス | 設定内容 |
|---|---|
| `w-<n>`、`h-<n>` | `width`、`height`(スペーシング、分数、`full`、`auto`、任意値) |
| `size-<n>` | `width` と `height` |
| `min-w-<n>`、`max-w-<n>`、`min-h-<n>`、`max-h-<n>` | 対応する制限 |
| `w-screen`、`w-dvw`、`w-svw`、`w-lvw` | ウィンドウ幅(`min-w-` / `max-w-` でも使用可) |
| `h-screen`、`h-dvh`、`h-svh`、`h-lvh` | ウィンドウ高さ(`min-h-` / `max-h-` でも使用可) |
| `w-auto`、`h-auto` | `auto`(コンテンツに合わせたサイズ) |
| `max-w-none`、`max-h-none` | 制限なし |
| `w-<container>`、`min-w-<container>`、`max-w-<container>` | コンテナ幅(下記) |

コンテナ幅(ポイント): `3xs` 256、`2xs` 288、`xs` 320、`sm` 384、`md` 448、`lg` 512、`xl` 576、`2xl` 672、`3xl` 768、`4xl` 896、`5xl` 1024、`6xl` 1152、`7xl` 1280。`prose` は、Tailwind CSS と同様に、要素のフォントの `0`(CSS の `65ch`)の幅の 65 倍です。

<a id="typography"></a>

## タイポグラフィ

<a id="font"></a>

### フォント

| クラス | 設定内容 |
|---|---|
| `font-sans` | システムフォント |
| `font-serif`、`font-mono` | `fontFamily: "serif"` / `"monospace"` |
| `font-thin`(100)、`font-extralight`(200)、`font-light`(300)、`font-normal`(400)、`font-medium`(500)、`font-semibold`(600)、`font-bold`(700)、`font-extrabold`(800)、`font-black`(900) | `fontWeight` |
| `font-[<weight>]`、`font-[<family>]` | 数値ならウェイト、それ以外ならファミリー: `font-[650]`、`font-[Inter]` |
| `italic`、`not-italic` | `fontStyle` |
| `normal-nums`、`small-caps`、`oldstyle-nums`、`lining-nums`、`tabular-nums`、`proportional-nums` | `fontVariant`(組み合わせ可能。`normal-nums` は数字の形式をリセットします) |

<a id="size-color-and-line-height"></a>

### サイズ、色、行の高さ

`text-<size>` はフォントサイズと、それに対応する Tailwind の行の高さを設定します。この行の高さは、文字列内の位置やバリアントに関係なく `leading-*` クラスで置き換えられます(`leading-tight md:text-lg` はタイトな行間を維持します):

| クラス | サイズ | 行の高さ |
|---|---|---|
| `text-xs` | 12 | 16 |
| `text-sm` | 14 | 20 |
| `text-base` | 16 | 24 |
| `text-lg` | 18 | 28 |
| `text-xl` | 20 | 28 |
| `text-2xl` | 24 | 32 |
| `text-3xl` | 30 | 36 |
| `text-4xl` | 36 | 40 |
| `text-5xl` | 48 | 1× |
| `text-6xl` | 60 | 1× |
| `text-7xl` | 72 | 1× |
| `text-8xl` | 96 | 1× |
| `text-9xl` | 128 | 1× |

| クラス | 設定内容 |
|---|---|
| `text-<size>/<leading>` | サイズと行の高さ: `text-sm/6`(24 ポイント)、`text-lg/tight` |
| `text-[<length>]` | `fontSize`: `text-[22px]`、`text-[length:22px]` |
| `text-<color>` | `color` |
| `leading-none`(1)、`leading-tight`(1.25)、`leading-snug`(1.375)、`leading-normal`(1.5)、`leading-relaxed`(1.625)、`leading-loose`(2) | フォントサイズの倍数としての `lineHeight` |
| `leading-<n>`、`leading-[<length>]` | ポイント単位の `lineHeight`(`leading-6` = 24) |
| `leading-[<number>]` | フォントサイズの倍数(`leading-[1.5]`)としての `lineHeight`。その倍率のまま継承されます。`em` と `%` は、継承の前に要素のフォントサイズで長さを計算します |
| `tracking-tighter`(-0.05em)、`tracking-tight`(-0.025em)、`tracking-normal`(0)、`tracking-wide`(0.025em)、`tracking-wider`(0.05em)、`tracking-widest`(0.1em) | フォントサイズに対する相対値の `letterSpacing` |
| `tracking-[<value>]` | `letterSpacing`: `tracking-[0.2em]`、`tracking-[1px]` |

<a id="alignment-case-and-wrapping"></a>

### 配置、大文字小文字、折り返し

| クラス | 設定内容 |
|---|---|
| `text-left`、`text-center`、`text-right`、`text-justify` | `textAlign` |
| `text-start`、`text-end` | `textAlign: "start"` / `"end"`: レイアウト方向における行の開始または終了 |
| `align-baseline`、`align-text-top`、`align-text-bottom`、`align-middle` | `verticalAlign`(テキスト内のビューと画像) |
| `uppercase`、`lowercase`、`capitalize`、`normal-case` | `textTransform` |
| `truncate` | 1 行、末尾を省略記号、折り返しなし、`overflow: hidden`(ビューの場合: 内部のテキストは折り返されません) |
| `line-clamp-<n>`、`line-clamp-none` | `numberOfLines`(`none` はすべての行を表示します) |
| `text-ellipsis`、`text-clip` | `textOverflow: "ellipsis"` / `"clip"` |
| `whitespace-nowrap`、`text-nowrap` | 行は折り返されません。ビューの場合は内部のテキストの行(CSS の `white-space` と同様に継承されます) |
| `whitespace-normal`、`text-wrap`、`text-balance`、`text-pretty` | 行は折り返されます(バランス調整は行われません) |
| `select-text`、`select-none` | `userSelect: "text"` / `"none"`。ビューの場合は、内部のテキストのうち未設定のもの |
| `select-auto` | `userSelect: "auto"`: CSS の `user-select: auto`(`select-none md:select-auto`)と同様に、周囲のビューが決定します |
<a id="decoration-and-shadow"></a>

### 装飾とシャドウ

| クラス | 設定内容 |
|---|---|
| `underline`, `line-through`, `no-underline` | `textDecorationLine` |
| `decoration-solid`, `decoration-double`, `decoration-dotted`, `decoration-dashed`, `decoration-wavy` | `textDecorationStyle` |
| `decoration-<n>`, `decoration-[<length>]` | `textDecorationThickness` |
| `decoration-auto`, `decoration-from-font` | `textDecorationThickness: "auto"` |
| `decoration-<color>` | `textDecorationColor` |
| `underline-offset-<n>`, `underline-offset-[<length>]`, `underline-offset-auto` | `textUnderlineOffset` |
| `text-shadow-2xs`, `-xs`, `-sm`, `-md`, `-lg`; `/<alpha>` | テーマのテキストシャドウ(1レイヤー:テーマのレイヤーのうち最も幅の広いもの)。修飾子はレイヤーのアルファ値: `text-shadow-md/20` |
| `text-shadow-<color>`, `text-shadow-current` | その色(サイズのアルファ値を適用) |
| `text-shadow-none` | テキストシャドウを削除 |

Tailwind のテキストシャドウは複数のレイヤーを持ちますが、ネイティブでは最も幅の広いレイヤーの1つのシャドウのみが描画されます。

<a id="inputs"></a>

### 入力

| クラス | 設定内容 |
|---|---|
| `placeholder:text-<color>` | `placeholderColor` |
| `selection:bg-<color>` | `selectionColor`(入力欄や選択可能なテキストの選択範囲のハイライト、およびその要素内にあるもののハイライト) |
| `caret-<color>` | カーソルの色 |

<a id="backgrounds"></a>

## 背景

| クラス | 設定内容 |
|---|---|
| `bg-<color>` | `backgroundColor` |
| `bg-[<gradient>]` | `backgroundImage`: `bg-[linear-gradient(45deg,red,blue)]`, `bg-[radial-gradient(...)]` |
| `bg-linear-to-t`, `-tr`, `-r`, `-br`, `-b`, `-bl`, `-l`, `-tl` | 辺または角に向かう線形グラデーション(`bg-gradient-to-*` は v3 での名前) |
| `bg-linear-<angle>`, `bg-linear-[<angle>]` | 角度を指定した線形グラデーション: `bg-linear-45`, `-bg-linear-12`, `bg-linear-[0.25turn]` |
| `bg-radial` | 中心から広がる放射状グラデーション |
| `bg-conic`, `bg-conic-<angle>` | 円錐グラデーション(開始角度は任意) |
| `from-<color>`, `via-<color>`, `to-<color>` | グラデーションのストップ(両端のデフォルトは透明) |
| `from-<p>%`, `via-<p>%`, `to-<p>%` | ストップ位置: `via-40%`, `from-[15%]` |
| `bg-none` | グラデーションを削除 |

グラデーションのユーティリティは、Tailwind CSS の記述(`in oklab`)と同様に Oklab で色を混合します。任意の位置(`bg-linear-[25deg]`, `bg-conic-[0.25turn]`)を指定した場合は CSS のデフォルトに従い、パレットの色では Oklab、すべてのストップが 16 進数、`rgb()`、`hsl()`、または名前付きの色である場合は sRGB で混合します。

```rust tabs
view()
    .h_32()
    .rounded_2xl()
    .bg_linear_to_br()
    .gradient_from(INDIGO.shade(500))
    .gradient_via(PURPLE.shade(500))
    .gradient_via_position(percentage(0.4))
    .gradient_to(PINK.shade(500))
```

```tsx tabs
<View class="h-32 rounded-2xl bg-linear-to-br from-indigo-500 via-purple-500 via-40% to-pink-500" />
```

<a id="borders"></a>

## ボーダー

| クラス | 設定内容 |
|---|---|
| `border`, `border-<n>`, `border-[<length>]` | `borderWidth`(単独の場合: 1) |
| `border-x`, `border-y`, `border-t`, `border-r`, `border-b`, `border-l`, `border-s`, `border-e`(`-<n>` 付き、または単独) | 対応する辺の幅 |
| `border-<color>`, `border-t-<color>`, ... | `borderColor` と辺ごとの色 |
| `border-solid`, `border-dashed`, `border-dotted` | `borderStyle` |
| `border-none`, `border-hidden` | `borderStyle: "none"` / `"hidden"`: 幅クラスの有無や順序にかかわらずボーダーなし(`md:border-solid` で再表示) |
| `rounded`, `rounded-<size>`, `rounded-none`, `rounded-full`, `rounded-[<length>]` | `borderRadius`(単独の場合: `sm`) |
| `rounded-t-`, `-r-`, `-b-`, `-l-`, `-tl-`, `-tr-`, `-br-`, `-bl-` | 対応する角 |
| `rounded-s-`, `-e-`, `-ss-`, `-se-`, `-es-`, `-ee-` | 開始側 / 終了側の角(方向対応): `borderTopStartRadius`, `borderTopEndRadius`, `borderBottomStartRadius`, `borderBottomEndRadius` |
| `outline`, `outline-<n>`, `outline-[<length>]` | `outlineWidth`(単独の場合: 1)。文字列のどこかにスタイルクラスがない限り実線(`outline-dashed outline-2` は破線、`outline-none outline-2` は何も描画しない) |
| `outline-<color>` | `outlineColor` |
| `outline-solid`, `outline-dashed`, `outline-dotted`, `outline-none`, `outline-hidden` | `outlineStyle`。スタイルのみを指定した場合は CSS の medium の幅、3 ポイント |
| `outline-offset-<n>`, `outline-offset-[<length>]` | `outlineOffset` |

角丸のサイズ(ポイント): `xs` 2、`sm` 4、`md` 6、`lg` 8、`xl` 12、`2xl` 16、`3xl` 24、`4xl` 32、`full` 9999。

<a id="rings"></a>

### リング

リングは、スプレッドを持つボックスシャドウで、ボーダーの外側に、スペースを占有せずに描画されます。

| クラス | 設定内容 |
|---|---|
| `ring`, `ring-<n>`, `ring-[<length>]` | その幅のリング(単独の場合: 1) |
| `ring-<color>` | リングの色(デフォルトは要素のテキストの色) |
| `ring-inset` | リングを内側に描画 |
| `ring-offset-<n>`, `ring-offset-<color>` | 要素とリングの間の隙間(デフォルトは白) |
| `inset-ring`, `inset-ring-<n>`, `inset-ring-<color>` | 内側のリング |

<a id="effects"></a>

## エフェクト

| クラス | 設定内容 |
|---|---|
| `shadow-2xs`, `shadow-xs`, `shadow-sm`, `shadow`, `shadow-md`, `shadow-lg`, `shadow-xl`, `shadow-2xl`; `/<alpha>` | テーマの `boxShadow`。修飾子はレイヤーのアルファ値: `shadow-xl/20` |
| `shadow-[<box-shadow>]` | 任意のシャドウ: `shadow-[0_8px_24px_rgb(0_0_0_/_0.12)]` |
| `shadow-<color>`, `shadow-current` | シャドウのレイヤーの色を変更(サイズのアルファ値を適用): `shadow-indigo-500/40` |
| `shadow-none` | シャドウなし |
| `inset-shadow-2xs`, `-xs`, `-sm`, `inset-shadow`, `inset-shadow-[...]`, `inset-shadow-<color>`, `inset-shadow-none` | インナーシャドウ |
| `opacity-<n>`, `opacity-[<value>]` | `opacity`: `opacity-50` = 0.5 |
| `mix-blend-<mode>` | `mixBlendMode`: `normal`, `multiply`, `screen`, `overlay`, `darken`, `lighten`, `color-dodge`, `color-burn`, `hard-light`, `soft-light`, `difference`, `exclusion`, `hue`, `saturation`, `color`, `luminosity`, `plus-darker`, `plus-lighter` |

シャドウ、リング、インセットシャドウは、CSS と同様に 1 つの `boxShadow` リストにまとめられます。シャドウの色は、Tailwind の `--tw-shadow-color` と同様に、各レイヤーの色をアルファ値も含めて置き換えます。`shadow-md shadow-red-500` は不透明な赤のシャドウ、`shadow-md/20 shadow-red-500` は 20% の赤のシャドウです。

<a id="filters"></a>

## フィルター

| クラス | 設定内容 |
|---|---|
| `blur`, `blur-xs` (4), `-sm` (8), `-md` (12), `-lg` (16), `-xl` (24), `-2xl` (40), `-3xl` (64), `blur-none`, `blur-[<length>]` | `blur()` |
| `brightness-<n>`, `contrast-<n>`, `saturate-<n>` | パーセンテージの係数: `brightness-125` = 1.25 |
| `grayscale`, `grayscale-<n>`, `invert`, `invert-<n>`, `sepia`, `sepia-<n>` | 単独の場合: 100% |
| `hue-rotate-<deg>`, `-hue-rotate-<deg>` | `hue-rotate()` |
| `drop-shadow`, `drop-shadow-xs`, `-sm`, `-md`, `-lg`, `-xl`, `-2xl`, `drop-shadow-[...]`, `drop-shadow-none`; `drop-shadow-<color>`, `drop-shadow-current`; どちらにも `/<alpha>` | レイヤーごとの `drop-shadow()`(他のフィルターの後に適用)。色を指定するとレイヤーの色を置き換え(サイズのアルファ値を適用)。web、Linux、Windows、GPUI はすべてのレイヤーを描画し、iOS、macOS、Android は最も幅の広いレイヤーのみを描画 |
| `drop-shadow-none` | ドロップシャドウを削除 |
| `filter-none` | すべてのフィルターを削除 |
| `backdrop-blur`, `backdrop-blur-<size>`, `backdrop-blur-[<length>]` | ビューの背後にあるものをぼかす |
| `backdrop-brightness-<n>`, `backdrop-contrast-<n>`, `backdrop-grayscale`, `backdrop-hue-rotate-<deg>`, `backdrop-invert`, `backdrop-opacity-<n>`, `backdrop-saturate-<n>`, `backdrop-sepia` | バックドロップフィルター |
| `backdrop-filter-none` | バックドロップフィルターを削除 |

> [!WARNING]
> iOS がビューに適用するのは `opacity`、1 までの `brightness`、および `drop-shadow` のみです。`<Image>` はすべてのカラーフィルターと `blur` を受け付けます。Android では、`blur`、`drop-shadow`、およびバックドロップブラーに API 31 が必要です。[Style reference](./style-reference.md#filters-and-blending) を参照してください。

<a id="transforms"></a>

## トランスフォーム

| クラス | 設定内容 |
|---|---|
| `translate-x-<n>`, `translate-y-<n>`, `translate-<n>` | `translate`(スペーシング、`full`、要素自身のサイズに対する割合: `-translate-x-1/2`、任意の値) |
| `rotate-<deg>`, `rotate-[<angle>]` | `rotate` |
| `rotate-x-<deg>`, `rotate-y-<deg>`, `rotate-z-<deg>` | 3D 回転(`transform` で、平行移動、回転、スケールの後に適用) |
| `scale-<pct>`, `scale-x-<pct>`, `scale-y-<pct>`, `scale-[<factor>]` | `scale`: `scale-95` = 0.95、`-scale-x-100` は反転 |
| `skew-<deg>`, `skew-x-<deg>`, `skew-y-<deg>` | スキュー(`transform` 単位、Android では非対応) |
| `perspective-dramatic` (100), `-near` (300), `-normal` (500), `-midrange` (800), `-distant` (1200), `perspective-[<length>]`, `perspective-none` | 要素の子の 3D 回転に対する奥行き(要素の中心から見たもの。CSS の `perspective`: `<View class="perspective-near"><View class="rotate-y-45" /></View>`) |
| `origin-center`, `-top`, `-top-right`, `-right`, `-bottom-right`, `-bottom`, `-bottom-left`, `-left`, `-top-left`, `origin-[<value>]` | `transformOrigin` |
| `backface-hidden`, `backface-visible` | `backfaceVisibility` |
| `transform-none` | 3D 回転とスキューをクリア(CSS の `transform: none`) |
| `translate-none`, `rotate-none`, `scale-none` | 平行移動、回転、スケールをそれぞれクリア |

トランスフォームのユーティリティは CSS と同様に合成されます。`translate-*`、`rotate-*`、`scale-*` はそれぞれ `translate`、`rotate`、`scale` プロパティを設定し、順序に関係なく組み合わされ、その後 `transform` が適用されます(`rotate-x-*`、`skew-*`)。`style` prop の同名のキーは、それ自身のプロパティだけを置き換えます。`style={{ scale: 1.1 }}` は `scale-95` を置き換え、`rotate-3` は維持します。`transform`、`transform-gpu`、`transform-cpu`、`transform-flat` は受け付けられますが何も行いません。NSH はすべてのトランスフォームを同様にフラットに合成します。サイズの割合による平行移動は要素のフレームに対して解決され、要素のリサイズに追従します。

<a id="transitions-and-animation"></a>

## トランジションとアニメーション

| クラス | 設定内容 |
|---|---|
| `transition` | 色、不透明度、シャドウ、トランスフォーム。150 ms、`cubic-bezier(0.4, 0, 0.2, 1)` |
| `transition-all`, `transition-colors`, `transition-opacity`, `transition-shadow`, `transition-transform` | アニメーションさせるプロパティ |
| `transition-none` | トランジションなし |
| `duration-<ms>`, `duration-[<time>]` | `transitionDuration`: `duration-300`, `duration-[0.4s]` |
| `delay-<ms>`, `delay-[<time>]` | `transitionDelay` |
| `ease-linear`, `ease-in`, `ease-out`, `ease-in-out`, `ease-initial`, `ease-[cubic-bezier(...)]` | `transitionTimingFunction` |
| `animate-spin`, `animate-ping`, `animate-pulse`, `animate-bounce` | ネイティブのキーフレームアニメーション(無限に繰り返し) |
| `animate-none` | アニメーションを停止 |

トランジションは、値が変化したとき(バリアントが一致し始めたとき、または一致しなくなったときを含む)に UI スレッドで実行されるため、`transition active:scale-95` により JS なしで押下をアニメーションできます。モーション軽減の設定を尊重するには、アニメーションを `motion-safe:` で囲んでください。

<a id="interactivity"></a>

## インタラクティブ性

| クラス | 設定内容 |
|---|---|
| `pointer-events-none`, `pointer-events-auto` | `pointerEvents: "none"` / `"auto"`: ビューがタッチやポインターの対象になるかどうか。CSS と同様に継承され、`pointer-events-none` のビューの内側でも `pointer-events-auto` のビューは再び対象になります |
| `cursor-<name>`, `cursor-[<name>]` | `cursor`: `cursor-pointer`, `cursor-grab`, `cursor-not-allowed`, ...(CSS のすべてのカーソルキーワード) |
| `select-none`, `select-text`, `select-auto` | テキスト選択(Typography を参照) |

## SVG

| クラス | 設定内容 |
|---|---|
| `fill-<color>`, `fill-none`, `fill-current`, `fill-inherit` | `fill`(`fill-current` は `currentColor`) |
| `stroke-<color>`, `stroke-none`, `stroke-current`, `stroke-inherit` | `stroke` |
| `stroke-<number>`, `stroke-[<length>]` | `strokeWidth` |

<a id="images"></a>

## 画像

| クラス | 設定内容 |
|---|---|
| `object-cover`, `object-contain`, `object-fill`, `object-none`, `object-scale-down` | `objectFit`(`fill` は引き伸ばし、`none` は元のサイズを維持して `objectPosition` に配置、`scale-down` は同じ配置で、大きい場合は収まるよう縮小)。画像と動画に適用 |
| `object-top`, `object-bottom`, `object-left`, `object-right`, `object-center`, `object-top-left`, `object-top-right`, `object-bottom-left`, `object-bottom-right`, `object-[<position>]` | `objectPosition`(`object-left-top`, ... は `object-top-left`, ... と同じ) |
| `tint-<color>` | `tintColor`(テンプレート画像の色を変更) |

<a id="accepted-without-effect"></a>

## 効果なしで受け付けられるもの

これらのユーティリティは、レンダリングのヒントか、すべてのネイティブビューがもともとそうであるものです。警告なしに解析されますが、何も変更しません: `antialiased`, `subpixel-antialiased`, `isolation-auto`, `box-border`, `appearance-none`, `appearance-auto`, `will-change-auto`, `will-change-scroll`, `will-change-contents`, `will-change-transform`, `will-change-[<value>]`, `transform`, `transform-gpu`, `transform-cpu`, `transform-flat`。スクロール、スナップ、オーバースクロールは [scroll](../elements/scroll.md) の prop です。

<a id="not-supported"></a>

## 非対応

`peer-*` バリアント、疑似要素(`before:`, `after:`)、任意のプロパティ(`[prop:value]`)、`overflow-auto` / `overflow-scroll`、`divide-*`、`columns-*`、`float-*`、`container`、コンテナクエリ、`order-*`、`transform-3d`、`select-all`、`border-double` / `outline-double`、固有の最小/最大制約(`max-w-max` など)、`snap-*`、`scroll-*`、`overscroll-*`、`touch-*`、`isolate` は未知のクラスです。`nsh build` と `nsh dev` は、ソース内で見つかった未知のクラスについて警告を出し(`file:line:col: unknown class '...'`)、ランタイムは未知のクラスをそれぞれ 1 回ログに記録します。

<a id="variants"></a>

## バリアント

バリアントはユーティリティを条件付きにします: `dark:bg-zinc-900`、`md:flex-row`、`active:opacity-70`。バリアントは重ねて指定でき(`dark:active:bg-zinc-700`)、依存するものが変化するたびにネイティブで評価されます。

<a id="appearance-and-environment"></a>

### 外観と環境

| バリアント | 適用条件 | Rust |
|---|---|---|
| `dark:` | 外観がダークの場合 | `.dark(\|s\| …)` |
| `ios:` | iOS または Mac Catalyst で実行している場合 | `.when(os() == Os::Ios, …)` |
| `android:` | Android で実行している場合 | `.when(os() == Os::Android, …)` |
| `portrait:`, `landscape:` | ウィンドウが幅より高い場合 / 高さより広い場合 | `.style_when(move \|\| window().height > window().width, …)` |
| `ltr:`, `rtl:` | レイアウト方向 | `.style_when(rtl, …)` |
| `motion-safe:`, `motion-reduce:` | ユーザーがモーション軽減を要求していない場合 / 要求している場合 | `.style_when(reduce_motion, …)` |

<a id="breakpoints"></a>

### ブレークポイント

ブレークポイントはウィンドウの幅(ポイント単位)を比較します。

| バリアント | 最小幅 |
|---|---|
| `sm:` | 640 |
| `md:` | 768 |
| `lg:` | 1024 |
| `xl:` | 1280 |
| `2xl:` | 1536 |

| 形式 | 例 | 適用条件 |
|---|---|---|
| `<bp>:` | `md:p-8` | 幅 ≥ ブレークポイント |
| `max-<bp>:` | `max-md:p-1` | 幅 < ブレークポイント |
| `min-[<length>]:` | `min-[600px]:grid-cols-3` | 幅 ≥ 指定した長さ |
| `max-[<length>]:` | `max-[400px]:text-sm` | 幅 < 指定した長さ |

縦向きの電話(幅 390 ポイント)はデフォルトのブレークポイントのいずれにも一致せず、タブレットや横向きの電話は複数に一致します。Rust では、ブレークポイントはウィンドウに対する条件です: `.style_when(move || window().width >= px(768.0), |s| s.p_8())` は `md:p-8` です。

<a id="interaction-states"></a>

### インタラクション状態

状態は、クラスがそれを使用している要素に対してのみプラットフォームによって追跡され、変更は JS とのやり取りなしにネイティブで適用されます。

| バリアント | 適用条件 | Rust |
|---|---|---|
| `active:` | 要素が押されている場合 | `.active(\|s\| …)` |
| `hover:` | ポインターが要素の上にある場合(iPad のポインター、Mac Catalyst、Android のマウス) | `.hover(\|s\| …)` |
| `focus:`, `focus-visible:` | 入力欄にフォーカスがある場合 | `.focus(\|s\| …)` |
| `focus-within:` | 要素またはその子孫にフォーカスがある場合(`Overlay` のコンテンツは、それが含まれる要素の子孫) | `.focus_within(…)` |
| `disabled:` | 要素が `disabled` prop を持つ場合 | `.disabled_style(\|s\| …)` |
| `enabled:` | 要素が `disabled` prop を持たない場合 |  |
| `selected:` | 要素が選択されている場合: `Button` の `selected`、または `accessibilityState.selected` |  |
| `checked:` | 要素がチェックされている場合: `accessibilityState.checked` が `true`(`"mixed"` はチェックされていない) |  |
| `indeterminate:` | 要素が不確定状態の場合: `accessibilityState.checked` が `"mixed"` |  |
| `aria-expanded:` | 要素が展開されている場合: `accessibilityState.expanded` が `true`(`Popover` または `Menu` のトリガーで、ポップアップが開いている間) |  |
| `aria-pressed:` | 要素がオンのトグルボタンである場合: `accessibilityState.pressed` が `true`(`"mixed"` は押されていない。`active:`、つまり押下中の状態ではない) | `.aria_pressed(\|s\| …)` |
| `aria-busy:` | 要素がビジー状態の場合: `accessibilityState.busy` が `true` |  |
| `aria-checked:` | 要素がチェックされている場合: `accessibilityState.checked` が `true`、`checked:` と同様 |  |
| `aria-selected:` | 要素が選択されている場合: `accessibilityState.selected` が `true`、`selected:` と同様 |  |
| `data-<name>:` | 要素が真偽値の `data-*` 属性 `name` を持つ場合(Tailwind の `&[data-<name>]`。名前は小文字、数字、`-` で構成): コンポーネントのパーツが状態以外で示すもの、たとえば範囲の開始位置にあるカレンダーの日 `data-range-start` | `Interactive::project_data(name, …)` で 1 つ設定 |

スタイルオブジェクトとしての同じ状態は、すべての要素(および `Button` の `selectedStyle`)の `activeStyle`、`hoverStyle`、`focusStyle`、`disabledStyle`、`checkedStyle`、`indeterminateStyle`、`expandedStyle`、`pressedStyle` prop です。これらは要素のスタイルとクラスより優先されます。

`disabled` は任意の要素で動作します。`disabled:` を適用し、要素の押下ハンドラーを削除するため、押下のフィードバックも表示されません。

```rust tabs
view()
    .on_press(save)
    .disabled(saving)
    .rounded_lg()
    .bg(BLUE.shade(600))
    .px_4()
    .py_2()
    .transition()
    .active(|s| s.scale(0.95).bg(BLUE.shade(700)))
    .disabled_style(|s| s.opacity(0.4))
    .child(text("Save").font_weight(FontWeight::MEDIUM).text_color(white()))
```

```tsx tabs
<View
  onPress={save}
  disabled={saving()}
  class="rounded-lg bg-blue-600 px-4 py-2 transition active:scale-95 active:bg-blue-700 disabled:opacity-40"
>
  <Text class="font-medium text-white">Save</Text>
</View>
```
<a id="groups"></a>

### グループ

祖先要素に `group` を付け、その状態に応じて子孫要素を `group-<state>:` でスタイル設定します。グループに名前を付けるとネストできます: `group/card` と `group-hover/card:`。

| バリアント | グループが次の状態のときに適用 | Rust |
|---|---|---|
| `group-active:` | 押下中 | `.group_active(…)`, `.group_active_named(name, …)` |
| `group-hover:` | ホバー中 | `.group_hover(…)`, `.group_hover_named(name, …)` |
| `group-focus:`, `group-focus-visible:` | フォーカス中 |  |
| `group-focus-within:` | フォーカス中、またはフォーカスを含む | `.group_focus_within(…)`, `.group_focus_within_named(name, …)` |
| `group-disabled:` | 無効 |  |
| `group-selected:` | 選択中 |  |
| `group-checked:` | チェック済み |  |
| `group-indeterminate:` | 不確定 |  |
| `group-aria-expanded:` | 展開中 |  |
| `group-aria-pressed:` | オンのトグルボタン |  |
| `group-aria-busy:`, `group-aria-checked:`, `group-aria-selected:` | ビジー、チェック済み、選択中 |  |
| `group-data-<name>:` | `data-*` 属性 `name` を持つ |  |

```rust tabs
view()
    .on_press(open)
    .group_named("row")
    .flex_row()
    .items_center()
    .gap_3()
    .p_3()
    .active(|s| s.bg(ZINC.shade(100)))
    .child(
        text("Settings")
            .flex_1()
            .text_color(ZINC.shade(900))
            .group_active_named("row", |s| s.text_color(BLUE.shade(600))),
    )
    .child(
        text("›")
            .text_color(ZINC.shade(400))
            .group_active_named("row", |s| s.translate_x(px(4.0)))
            .transition_transform(),
    )
```

```tsx tabs
<View onPress={open} class="group/row flex-row items-center gap-3 p-3 active:bg-zinc-100">
  <Text class="flex-1 text-zinc-900 group-active/row:text-blue-600">Settings</Text>
  <Text class="text-zinc-400 group-active/row:translate-x-1 transition-transform">›</Text>
</View>
```

<a id="position-among-siblings"></a>

### 兄弟要素間での位置

| バリアント | 適用対象 |
|---|---|
| `first:` | 最初の子要素 |
| `last:` | 最後の子要素 |
| `only:` | 唯一の子要素 |
| `odd:` | 1番目、3番目、... の子要素 |
| `even:` | 2番目、4番目、... の子要素 |

```rust tabs
each(items, |item: &Item| item.id, move |item, index| {
    text(move || item.with(|i| i.name.clone()))
        .border_b(px(1.0))
        .border_color(ZINC.shade(200))
        .py_3()
        .style_when(move || index.get() + 1 == items.with(Vec::len), |s| s.border_b(px(0.0)))
})
```

```tsx tabs
<Each of={items()}>{(item) => <Text class="border-b border-zinc-200 py-3 last:border-b-0">{item().name}</Text>}</Each>
```

<a id="placeholder-and-selection"></a>

### プレースホルダーと選択範囲

`placeholder:` は `<Input>` のプレースホルダーに適用され、指定できるのはテキストカラーのみです: `placeholder:text-zinc-400` (スタイルキー `placeholderColor`)。`selection:` は `<Input>` または選択可能な `<Text>` の選択範囲に適用されます。任意の要素に指定した場合は、その内部の要素に適用されます (Tailwind の `& *::selection`。最も近い要素の指定が優先されます)。指定できるのは背景、つまりハイライトです: `selection:bg-violet-200` (スタイルキー `selectionColor`。プラットフォームが入力欄のキャレットを単色で描画する場合は、キャレットの色にも反映されます)。

<a id="important"></a>

### 重要

ユーティリティの前または後ろに付けた `!` (`!p-4`, `p-4!`) は、他のすべてのクラスやインラインの `style` よりも優先されます。

<a id="theme-customization"></a>

## テーマのカスタマイズ

アプリの `nsh.json` にある `"tailwind"` オブジェクトでテーマを拡張します。新しい名前のエントリは追加され、既存の名前のエントリはデフォルトを置き換えます。長さの単位はポイントです。テーマはアプリのバンドル時に検証され、未知のキーや無効な値はビルドエラーになります。

```json
{
  "name": "My App",
  "id": "com.example.myapp",
  "tailwind": {
    "colors": {
      "brand": { "50": "#f5f3ff", "500": "#7c3aed", "600": "#6d28d9", "DEFAULT": "#7c3aed" },
      "accent": "#f59e0b"
    },
    "spacing": 4,
    "breakpoints": { "tablet": 600 },
    "fontFamily": { "display": "Inter" },
    "fontSize": { "huge": [48, 1.1] },
    "fontWeight": { "heavy": 850 },
    "radius": { "card": 14 },
    "shadow": { "card": "0 2px 8px rgb(0 0 0 / 0.12)" },
    "insetShadow": { "well": "inset 0 2px 6px rgb(0 0 0 / 0.1)" },
    "dropShadow": { "icon": "0 2px 4px rgb(0 0 0 / 0.2)" },
    "tracking": { "label": 0.08 },
    "leading": { "dense": 1.15 },
    "blur": { "glass": 20 },
    "perspective": { "card": 700 },
    "aspect": { "photo": 1.5 },
    "ease": { "snappy": [0.2, 0, 0, 1] },
    "container": { "content": 680 }
  }
}
```

このテーマでは、`bg-brand-500`、`bg-brand` (`DEFAULT` の濃淡)、`text-accent`、`tablet:flex-row`、`font-display`、`text-huge`、`font-heavy`、`rounded-card`、`shadow-card`、`inset-shadow-well`、`drop-shadow-icon`、`tracking-label`、`leading-dense`、`blur-glass`、`perspective-card`、`aspect-photo`、`ease-snappy`、`max-w-content` がすべて使用できます。

| キー | 値 | 使用先 |
|---|---|---|
| `colors` | `{ name: color }` または `{ name: { shade: color } }`。`DEFAULT` は単色の名前を表します。任意の CSS カラー構文を使用できます。 | すべてのカラーユーティリティ |
| `spacing` | 1ステップあたりのポイント数 (デフォルトは 4) | `p-*`, `m-*`, `gap-*`, `w-*`, ... |
| `rem` | `rem` あたりのポイント数 (デフォルトは 16) | |
| `breakpoints` | `{ name: width }` | ブレークポイントバリアント (幅順にソートされます) |
| `container` | `{ name: width }` | `w-*`, `min-w-*`, `max-w-*` |
| `fontFamily` | `{ name: family }` (システムフォントファミリー、またはバンドルされたフォントの名前) | `font-*` |
| `fontSize` | `{ name: size }` または `{ name: [size, lineHeightMultiple] }` | `text-*` |
| `fontWeight` | `{ name: 1–1000 }` | `font-*` |
| `tracking` | `{ name: em }` | `tracking-*` |
| `leading` | `{ name: multiple }` | `leading-*` |
| `radius` | `{ name: points }` | `rounded-*` |
| `shadow`, `insetShadow`, `dropShadow` | `{ name: "CSS box-shadow" }` | `shadow-*`, `inset-shadow-*`, `drop-shadow-*` |
| `blur` | `{ name: points }` | `blur-*`, `backdrop-blur-*` |
| `perspective` | `{ name: points }` | `perspective-*` |
| `aspect` | `{ name: ratio }` | `aspect-*` |
| `ease` | `{ name: [x1, y1, x2, y2] }` | `ease-*` |

> [!NOTE]
> Tailwind テーマが影響するのは、アプリのクラスのみです。アプリのデザイントークン (shadcn/ui のカラー、`radius`、フォント、およびアプリ独自のもの) は、`nsh.json` の `"theme"` キーにあるアプリのテーマであり、Rust コンポーネントはこれを使って描画します。詳しくは [Rust](../docs/rust.md#theme) を参照してください。クラスは、Tailwind が `@theme` 変数 (`bg-primary`, `bg-up/30`, `rounded-(--radius)`) と呼ぶ名前でこれらのトークンを参照します。詳しくは [テーマトークン](../docs/tailwind.md#theme-tokens) を参照してください。

<a id="related"></a>

## 関連項目

- [Tailwind](../docs/tailwind.md): ガイド。
- [スタイリング](../docs/styling.md): `class`、`classList`、`style` と、それらの組み合わせ方。
- [スタイルリファレンス](./style-reference.md): ユーティリティが設定するスタイルキー。
