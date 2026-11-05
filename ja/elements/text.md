---
title: "Text"
description: "テキストを描画する要素です。ネストされたスパン、リンク、行数制限、フォントスケーリング、インラインビュー、テキストレイアウトイベントを扱います。"
order: 20
group: primitives
demo: el-text
source_hash: 85fcf31a847a72cd
---

# Text

`Text` は段落を描画します。文字列を表示する要素であり、`View` の子に置いた文字列は何も描画されません。段落はネイティブでタイプセットされ（iOS と Mac Catalyst では CoreText、Android では `StaticLayout`）、エンジンスレッドで計測されるため、メインスレッドは描画だけを行います。Rust では `text(content)`、TSX では `nsh` から `<Text>` を使って作成します。

```rust tabs
use nsh_core::prelude::*;

text("Read the ")
    .text_base()
    .line_height(px(24.0))
    .text_color(rgb(0x1f2328))
    .child(text("terms").font_weight(FontWeight::BOLD))
    .child(" before you continue.")
```

```tsx tabs
<Text style={{ fontSize: 16, lineHeight: 24, color: "#1f2328" }}>
  Read the <Text style={{ fontWeight: "700" }}>terms</Text> before you continue.
</Text>
```

`text(..)` は文字列、`SharedString`、シグナル、またはクロージャ（`text(move || format!("{} items", count.get()))`）を受け取ります。クロージャやシグナルを渡すと、それが読み取る値が変わったときにテキストがその場で更新されます。

## Spans

text の中に置いた text は、別のビューではなく同じ段落のスパンになります。スパンは段落のテキストスタイル（`color`、`fontSize`、`fontWeight` など）を継承し、自身で設定したものだけを上書きします。ブロック全体が 1 つのネイティブビューです。Rust では、`text(..)` は自身の内容を表示し、その後に子要素を表示します。`.child(text(..))` はスパンを追加し、`.child("…")` は通常のランを追加します。

```rust tabs
text("")
    .text_size(px(17.0))
    .child(text("Light ").font_weight(FontWeight::LIGHT))
    .child(text("Bold ").font_weight(FontWeight::BOLD))
    .child(text("Italic").italic().text_color(rgb(0x8250df)))
```

```tsx tabs
<Text style={{ fontSize: 17 }}>
  <Text style={{ fontWeight: "300" }}>Light </Text>
  <Text style={{ fontWeight: "bold" }}>Bold </Text>
  <Text style={{ fontStyle: "italic", color: "#8250df" }}>Italic</Text>
</Text>
```

<a id="span-backgrounds"></a>

### スパンの背景

背景を持つスパンは、その文字のボックスを文字の背後に塗りつぶします。ボックスの高さはフォントの高さ（行の高さに関係なく、ベースラインより上のアセントと下のディセント）で、折り返した各行に対して、行ごとの部分がそれぞれスパンの角丸を持つ独立したボックスになります。内側のスパンは、独自の背景を設定しない限りこの背景を共有します。これは描画のみに作用します。テキストの配置は背景がない場合と同じで、選択可能なテキストでは、スパンの文字も他の文字と一緒にコピーされます。インラインコードはスパンです。

```rust tabs
text("Run ")
    .text_size(px(15.0))
    .line_height(px(22.0))
    .select_text()
    .child(
        text(" cargo test ")
            .font_family("ui-monospace")
            .text_size(px(13.0))
            .bg(rgb(0xeff1f3))
            .rounded(px(4.0)),
    )
    .child(" before you commit.")
```

```tsx tabs
<Text style={{ userSelect: "text", fontSize: 15, lineHeight: 22 }}>
  {"Run "}
  <Text style={{ fontFamily: "ui-monospace", fontSize: 13, backgroundColor: "#eff1f3", borderRadius: 4 }}>
    {" cargo test "}
  </Text>
  {" before you commit."}
</Text>
```

Tailwind クラスも同様に動作します: `<Text class="bg-gray-100 rounded">`。パディングとボーダーはボックススタイルであり、スパンには影響しません。スパンの両側に余白が必要な場合は、スパン内にスペースを入れてください。

<a id="links"></a>

### リンク

押下ハンドラを持つスパンはリンクになります。その文字の上での押下はスパンに、それ以外の場所での押下は段落に渡されます。

```rust tabs
text("By continuing you agree to the ")
    .text_size(px(15.0))
    .on_press(move || log("the sentence"))
    .child(
        text("Terms of service")
            .text_color(rgb(0x0969da))
            .underline()
            .on_press(move || open("terms")),
    )
    .child(".")
```

```tsx tabs
<Text style={{ fontSize: 15 }} onPress={() => log("the sentence")}>
  {"By continuing you agree to the "}
  <Text style={{ color: "#0969da", textDecorationLine: "underline" }} onPress={() => open("terms")}>
    Terms of service
  </Text>
  .
</Text>
```

<a id="inline-views-and-images"></a>

### インラインビューと画像

text の中に置かれたその他の要素（ビューや画像。スパンの内側でも同様）は、インラインアタッチメントになります。アタッチメントは自身のサイズでレイアウトされ、ベースライン上（または `verticalAlign` スタイルで指定した位置。CSS と同様に `"text-top"`、`"text-bottom"`、`"middle"`。行はそれを収めるために広がります）に配置され、単語とともに折り返されます。アタッチメントは自身への押下を受け取ります。

```rust tabs
text("Made with ")
    .text_base()
    .line_height(px(26.0))
    .child(image(LOGO).size(px(18.0)).rounded(px(4.0)))
    .child(" NSH. Status ")
    .child(
        view()
            .bg(rgb(0x1a7f37))
            .rounded(px(9.0))
            .px(px(7.0))
            .h(px(18.0))
            .justify_center()
            .child(text("LIVE").text_color(white()).text_size(px(11.0)).font_weight(FontWeight::BOLD)),
    )
```

```tsx tabs
<Text style={{ fontSize: 16, lineHeight: 26 }}>
  {"Made with "}
  <Image src={logo} style={{ width: 18, height: 18, borderRadius: 4 }} />
  {" NSH. Status "}
  <View style={{ backgroundColor: "#1a7f37", borderRadius: 9, paddingHorizontal: 7, height: 18, justifyContent: "center" }}>
    <Text style={{ color: "#ffffff", fontSize: 11, fontWeight: "700" }}>LIVE</Text>
  </View>
</Text>
```

`numberOfLines` や省略記号によって切り取られたアタッチメントは非表示になります。選択可能なテキストをコピーする際、アタッチメントは含まれません。

<a id="whitespace"></a>

### 空白

JSX のテキストは React のルールに従います。テキストの両端を除いて各行はトリムされ、空白だけの行は削除され、残った行は 1 つのスペースで連結されます。1 行内のスペースは保持されます（`{a} {b}` のスペースは保持されます）。スパンの先頭または末尾にスペースが必要な場合は、`{" "}` または文字列式を使ってください。Rust の文字列は書かれたとおりに描画されます。

<a id="props"></a>

## プロパティ

[共通プロパティ](./index.md#common-props)（`style` は `TextStyle` 型）に加えて、次のものがあります。

| プロパティ | Rust | 型 | デフォルト | 説明 |
|---|---|---|---|---|
| `numberOfLines` (style) | `.number_of_lines(n)`, `.truncate()` | `number` | `0` | 表示する最大行数。`0` はすべての行を表示します。 |
| `textOverflow` (style) | `.text_overflow(EllipsizeMode::Middle)` | `"ellipsis" \| "clip" \| "ellipsis-start" \| "ellipsis-middle"` | `"ellipsis"` | `numberOfLines` に収まらないテキストの切り取り方。末尾、先頭、または中間に省略記号を付けるか、クリップします。 |
| `allowFontScaling` | `.allow_font_scaling(..)` | `boolean` | `true` | システムのテキストサイズ設定に従います。 |
| `maxFontSizeMultiplier` | `.max_font_size_multiplier(..)` | `number` | `0` | システムスケールの上限。`0` は上限なしです。 |
| `adjustsFontSizeToFit` | `.shrink_to_fit(min_scale)` | `boolean` | `false` | テキストが行数（`numberOfLines`）とボックスに収まるまでフォントを縮小します。 |
| `minimumFontScale` | `.shrink_to_fit(min_scale)` | `number` | | `adjustsFontSizeToFit` が縮小する最大の度合い（0..1。最小は 0.1）。 |
| `userSelect` (style) | `.select_text()`, `.select_none()` | `"auto" \| "none" \| "text"` | `"auto"` | `"text"`: ユーザーがテキストの範囲を選択できます。長押しで単語が選択され、ハンドルで範囲を広げ、編集メニューでコピーできます。`"auto"` は周囲のビューの設定を引き継ぎます。何も設定されていない場合、テキストは選択できません。ただしデスクトップブラウザでは、インタラクティブな要素の内側でない限り選択できます。`"none"` を指定すると、そこでも選択できなくなります。 |
| `selectionColor` (style) | `.selection_color(..)` | `ColorValue` | プラットフォームのアクセントカラー | 選択範囲のハイライトとハンドル。 |
| `onTextLayout` | | `(e: { lines: TextLayoutLine[] }) => void` | | レイアウトのたびに得られる、レイアウト済みの行。 |

Tailwind クラスの `select-text`、`select-none`、`select-auto` は `userSelect` を、`line-clamp-*` は `numberOfLines` を、`text-ellipsis` と `text-clip` は `textOverflow` を設定し、`truncate` は省略記号で切り取る 1 行になります。選択範囲のハイライトとハンドルにはスタイルキー `selectionColor`（`selection:text-*`）が使われ、デフォルトはプラットフォームのアクセントカラーです。

<a id="text-styles"></a>

## テキストスタイル

`TextStyle` はビューのスタイルに次のものを追加します: `color`、`fontSize`、`fontWeight`（`"normal"`、`"bold"`、または 100–900）、`fontStyle`、`fontFamily`、`lineHeight`、`letterSpacing`、`textAlign`、`textAlignVertical`、`textTransform`、`textDecorationLine`、`textDecorationColor`、`textDecorationStyle`、`textDecorationThickness`、`textUnderlineOffset`、`textShadow`（CSS の `text-shadow`）、`fontVariant`、`writingDirection`、`numberOfLines`、`textOverflow`。Rust では `Styled` のメソッドとして提供されます: `.text_color(..)`、`.text_size(..)`（または `.text_sm()`、`.text_lg()` など）、`.font_weight(FontWeight::SEMIBOLD)`、`.italic()`、`.font_family(..)`、`.line_height(..)`、`.letter_spacing(..)`、`.text_center()`、`.uppercase()`、`.underline()`、`.line_through()`、`.tabular_nums()`、`.number_of_lines(..)` など。[スタイルリファレンス](../modules/style-reference.md#textstyle)と[テキスト](../docs/text.md)を参照してください。

フォントファミリーには、システムのファミリーか、アプリのフォントファイルを指定できます。

```rust tabs
// assets/fonts/Inter-Regular.ttf, shipped by the registry (`registry.assets(assets!())`).
const INTER: FontAsset = asset!("fonts/Inter-Regular.ttf");

text("Inter").font_family(INTER.family).text_size(px(17.0))
```

```tsx tabs
import { Text } from "nsh";
import Inter from "./fonts/Inter-Regular.ttf";

<Text style={{ fontFamily: Inter, fontSize: 17 }}>Inter</Text>;
```

フォントは最初のフレームより前に登録されます。[フォント](../docs/fonts.md)を参照してください。

<a id="events"></a>

## イベント

| イベント | Rust | ペイロード | タイミング |
|---|---|---|---|
| `onTextLayout` | | `{ lines: TextLayoutLine[] }` | 段落のレイアウトのたび。 |
| `onPress`, `onLongPress`, … | `.on_press`, `.on_long_press`, … | `PressEvent`（Rust ではなし） | [view](./view.md#events) と同じです。スパンでは、その文字への押下です。 |
| `onLayout` | `.on_layout` | `{ bounds }` | ブロックのフレームが変更されたとき。 |

`TextLayoutLine` は `{ text, x, y, width, height, ascender, descender, capHeight, xHeight }` で、テキストのコンテンツボックス内の値です。

```tsx
const lines = signal(0);
<Text onTextLayout={(e) => lines.set(e.lines.length)}>{article}</Text>;
```

Rust では、レイアウトの前に `measure_text(..)` で文字列を計測します。

<a id="ref-methods"></a>

## Ref メソッド

固有のものはありません。

<a id="platform-notes"></a>

## プラットフォームに関する注意

- 選択は 1 つのテキストブロック（1 つの text とそのスパン）の内側にとどまります。iOS では編集メニュー（コピー、すべてを選択、調べる、翻訳、共有）が、Android ではフローティングツールバー（コピー、すべて選択、共有）が表示されます。
- 実線の一重線以外のテキスト装飾（`double`、`dotted`、`dashed`、`wavy`）は、iOS では NSH が描画します。
- iOS のテキストは、単色の背景と外側のシャドウを描画します。
- [`nsh`](../modules/nsh.md#device) の `fontScale()`（Rust では `font_scale()`）は、現在のシステムのテキストスケールを返します。
