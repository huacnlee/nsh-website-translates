---
title: "テキスト"
description: "Rust と TSX の text 要素によるテキスト表示 - ネストされた span とリンク、インラインビュー、フォントと装飾、切り詰め、システムのテキストサイズ、選択、onTextLayout。"
order: 35
group: ui
source_hash: 9d528fcdc65c1a8c
---

# Text

すべてのテキストは text 要素によって表示されます。Rust では `text(..)`、TSX では `<Text>` を使います。text 要素は 1 つの段落であり、レイアウト時にエンジンスレッド上でプラットフォームのテキストエンジン(Apple プラットフォームでは CoreText、Android では `StaticLayout`)によって組版され、描画だけがメインスレッドで行われます。入れ子になった text 要素は別々のビューではなく、同じ段落のスパンです。

```rust tabs
text("By continuing you agree to the ")
    .text_size(px(16.0))
    .line_height(px(24.0))
    .text_color(rgb(0x1f2328))
    .child(
        text("Terms of service")
            .text_color(rgb(0x0969da))
            .underline()
            .on_press(open_terms),
    )
    .child(".")
```

```tsx tabs
<Text style={{ fontSize: 16, lineHeight: 24, color: "#1f2328" }}>
  By continuing you agree to the{" "}
  <Text style={{ color: "#0969da", textDecorationLine: "underline" }} onPress={openTerms}>
    Terms of service
  </Text>
  .
</Text>
```

> [!IMPORTANT]
> 文字列は text 要素によって表示されます。TSX では、`<View>` の中に直接置いた文字列は表示されません。`<Text>` で囲んでください。

要素自体については [text](../elements/text.md) で説明しています。このページでは、その使い方を扱います。

<a id="strings-and-whitespace"></a>

## 文字列と空白

Rust では、テキストの内容は文字列で、書かれたとおりに表示されます。`\n` は改行になります。シグナルを読む内容はクロージャで渡し、シグナルが変化するとテキストが更新されます。TSX では、JSX のテキストは React と同じルールに従います。各行は前後の空白が取り除かれ、空白のみの行は破棄され、残った行は 1 つのスペースで連結されます。1 行の中の空白はそのまま保持されるため、`{first} {last}` のスペースは残ります。行頭や行末にスペースが必要な場合は `{" "}` を、改行には `{"\n"}` を使います。

```rust tabs
text(move || format!("Hello, {}!\nWelcome back.", name.get()))
```

```tsx tabs
<Text>
  Hello,
  {name()}!{"\n"}
  Welcome back.
</Text>
```

テキスト内の式は、読み取っている値に追従します。`text(move || format!("{} items", count.get()))` と `<Text>{count()} items</Text>` は、`count` が変化すると更新されます。

<a id="spans-and-inheritance"></a>

## スパンと継承

text の中の text はスパンです。スパンは親のテキストスタイルを継承し、自身で設定したものだけを上書きします。

```rust tabs
text("")
    .text_size(px(17.0))
    .text_color(rgb(0x1f2328))
    .child(text("Light ").font_weight(FontWeight::LIGHT))
    .child(text("Bold ").font_weight(FontWeight::BOLD))
    .child(text("Italic ").italic())
    .child(text("Spaced").letter_spacing(px(4.0)))
```

```tsx tabs
<Text style={{ fontSize: 17, color: "#1f2328" }}>
  <Text style={{ fontWeight: "300" }}>Light </Text>
  <Text style={{ fontWeight: "700" }}>Bold </Text>
  <Text style={{ fontStyle: "italic" }}>Italic </Text>
  <Text style={{ letterSpacing: 4 }}>Spaced</Text>
</Text>
```

テキストスタイルは、CSS と同様にビューからも引き継がれます。Rust の `view().text_color(white()).text_sm()` と TSX の `<View class="text-white text-sm">` は、その内側にある text 要素と input 要素のスタイルを決めます。

<a id="links"></a>

### リンク

押下ハンドラ(`.on_press(..)` または `.on_long_press(..)`、`onPress` または `onLongPress`)を持つスパンはリンクになります。その文字上での押下はスパンに、それ以外の場所での押下は段落に渡されます。入れ子のスパンでもリンクは機能します。

```rust tabs
text("Read the ")
    .on_press(move || tapped.set("the sentence"))
    .child(text("terms").text_color(rgb(0x0969da)).on_press(move || tapped.set("terms")))
    .child(" first.")
```

```tsx tabs
<Text onPress={() => log("the sentence")}>
  Read the <Text style={{ color: "#0969da" }} onPress={() => open(termsUrl)}>terms</Text> first.
</Text>
```

<a id="backgrounds-of-spans"></a>

### スパンの背景

スパンの背景色と角丸は、そのスパンが及ぶ各行で、フォントの高さと同じ高さのボックスとして文字の背後に描画されます。テキストのレイアウトは変わらず、コピーも全体として行われるため、インラインコードはスパンで表現します([text 要素](../elements/text.md#span-backgrounds))。

```rust tabs
text("Run ")
    .child(text(" npm test ").font_family("ui-monospace").bg(rgb(0xeff1f3)).rounded(px(4.0)))
    .child(" first.")
```

```tsx tabs
<Text>
  Run <Text style={{ fontFamily: "ui-monospace", backgroundColor: "#eff1f3", borderRadius: 4 }}> npm test </Text> first.
</Text>
```

<a id="views-and-images-inside-text"></a>

### テキスト内のビューと画像

text の中にある text 以外の要素は、ベースライン上にインラインでレイアウトされ、単語と一緒に折り返されます。そのような要素は独自に押下を受け取れます。

```rust tabs
text("Made with ")
    .text_size(px(16.0))
    .line_height(px(26.0))
    .child(image(LOGO).size(px(18.0)))
    .child(" nsh. Status ")
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
  Made with <Image src={logo} style={{ width: 18, height: 18 }} /> nsh. Status{" "}
  <View style={{ backgroundColor: "#1a7f37", borderRadius: 9, paddingHorizontal: 7, height: 18, justifyContent: "center" }}>
    <Text style={{ color: "#ffffff", fontSize: 11, fontWeight: "700" }}>LIVE</Text>
  </View>
</Text>
```

`numberOfLines` や省略記号によって切り取られたインライン要素は非表示になり、テキストをコピーしても含まれません。インライン要素内のテキストは、CSS の `color` がインラインブロックに及ぶのと同じように、周囲のテキストの色を引き継ぎます。ただし、独自に色を設定している場合は除きます(上の `LIVE` バッジがその例です)。フォントと行の高さは、その要素自身のものが使われます。

スタイルキー `verticalAlign` は、CSS の `vertical-align` が画像を配置するのと同じように、インライン要素を行内に配置します。`"baseline"`(デフォルト)は要素の下端をベースラインに合わせ、`"text-top"` と `"text-bottom"` は要素の上端または下端をテキストのフォントの上端または下端に合わせ、`"middle"` は要素をベースラインからフォントの x 高さの半分だけ上に中央揃えで配置します。要素がフォントの範囲を超える場合は、固定の `lineHeight` を指定していても、行がその要素を収めるように広がります。段落の先頭にあるアイコンをテキストの下端に揃えたい場合(Android の `ImageSpan` が描画する位置)は、`"text-bottom"` を指定します。クラスは `align-baseline`、`align-text-top`、`align-text-bottom`、`align-middle` です。Rust では `.align_text_bottom()` と、同じ名前の他のものを使います。

```tsx
<Text style={{ fontSize: 16 }}>
  <Image src={badge} style={{ width: 16, height: 16, verticalAlign: "text-bottom" }} /> Verified seller
</Text>
```

<a id="text-styles"></a>

## テキストスタイル

| プロパティ | 値 | Rust |
|---|---|---|
| `color` | [color](./styling.md#colors)。デフォルトは黒 | `.text_color(..)` |
| `fontSize` | ポイント。デフォルトは 14 | `.text_size(px(..))`、`.text_sm()`、`.text_lg()`、... |
| `fontWeight` | `"normal"`(400)、`"bold"`(700)、または `100`–`900`(数値または文字列) | `.font_weight(FontWeight::BOLD)` |
| `fontStyle` | `"normal"`、`"italic"`:カラー絵文字は傾きません | `.italic()` |
| `fontFamily` | システムフォントファミリー、ジェネリックファミリー、または[インポートしたフォント](./fonts.md) | `.font_family(..)` |
| `lineHeight` | ポイント | `.line_height(px(..))` |
| `letterSpacing` | ポイント | `.letter_spacing(px(..))` |
| `textAlign` | `"auto"`、`"left"`、`"center"`、`"right"`、`"justify"`、`"start"`、`"end"`:`left` と `right` は左右の向きを固定し、`start` と `end` は文字方向に従います | `.text_left()`、`.text_center()`、`.text_right()`、`.text_justify()` |
| `textAlignVertical` | `"auto"`、`"top"`、`"center"`、`"bottom"`:ボックスより短いテキストが配置される位置 | |
| `textTransform` | `"none"`、`"uppercase"`、`"lowercase"`、`"capitalize"` | `.normal_case()`、`.uppercase()`、`.lowercase()`、`.capitalize()` |
| `textDecorationLine` | `"none"`、`"underline"`、`"line-through"`、`"underline line-through"` | `.no_underline()`、`.underline()`、`.line_through()` |
| `textDecorationColor`、`textDecorationStyle` | 色。`"solid"`、`"double"`、`"dotted"`、`"dashed"`、`"wavy"` | `.text_decoration_color(..)`、`.text_decoration_wavy()`、... |
| `textDecorationThickness`、`textUnderlineOffset` | ポイント、または `"auto"`(太さは `"from-font"` も指定可能) | `.text_decoration_thickness(px(..))`、`.underline_offset(px(..))` |
| `textShadow` | CSS の `text-shadow`。グリフの背後に落ちる影:`"2px 2px 4px rgb(0 0 0 / 0.6)"`(オフセット、ぼかし、色)、またはそのレイヤーを数値で指定する `[{ x: 2, y: 2, blur: 4, color: "#00000099" }]`。複数のレイヤーは最も広いものとして描画されます | `.text_shadow([TextShadow { .. }])`、`.text_shadow_sm()`、...、`.text_shadow_color(..)` |
| `fontVariant` | OpenType フィーチャー:`["tabular-nums"]`、`"small-caps"`、`"oldstyle-nums"`、`"lining-nums"`、`"proportional-nums"` | `.tabular_nums()`、`.small_caps()`、`.oldstyle_nums()`、`.lining_nums()`、`.proportional_nums()` |
| `writingDirection` | `"auto"`、`"ltr"`、`"rtl"`:段落の基本方向 | `.writing_direction(WritingDirection::Rtl)` |

text 要素はビューでもあるため、背景、ボーダー、角丸、パディングなどの[ビュースタイル](./styling.md)を指定できます。

```rust tabs
text(move || format!("{:.2}", price.get())).text_size(px(18.0)).tabular_nums()
text("Typo").underline().text_decoration_wavy().text_decoration_color(rgb(0xcf222e))
text("Shadow")
    .text_size(px(26.0))
    .font_weight(FontWeight::EXTRA_BOLD)
    .text_color(white())
    .text_shadow([TextShadow {
        offset_x: px(2.0),
        offset_y: px(2.0),
        radius: px(4.0),
        color: rgba(0x00000099).into(),
    }])
```

```tsx tabs
<Text style={{ fontSize: 18, fontVariant: ["tabular-nums"] }}>{price().toFixed(2)}</Text>
<Text style={{ textDecorationLine: "underline", textDecorationStyle: "wavy", textDecorationColor: "#cf222e" }}>Typo</Text>
<Text style={{ fontSize: 26, fontWeight: "800", color: "#ffffff", textShadow: "2px 2px 4px rgba(0,0,0,0.6)" }}>
  Shadow
</Text>
```

`tabular-nums` はすべての数字を同じ幅にするため、カウンターや価格が変化しても表示が揺れません。

<a id="truncation"></a>

## 切り詰め

```rust tabs
text(long_description).number_of_lines(2)
text(file_path).number_of_lines(1).text_overflow(EllipsizeMode::Middle)
```

```tsx tabs
<Text style={{ numberOfLines: 2 }}>{longDescription}</Text>
<Text style={{ numberOfLines: 1, textOverflow: "ellipsis-middle" }}>{filePath}</Text>
```

| スタイルキー / prop | Rust | 説明 |
|---|---|---|
| `numberOfLines`(スタイル) | `.number_of_lines(n)` | 表示する最大行数。`0`(デフォルト)はすべての行を表示します |
| `textOverflow`(スタイル) | `.text_overflow(EllipsizeMode::Middle)` | 収まらないテキストの切り方。末尾に省略記号(`"ellipsis"`、デフォルト)、先頭に省略記号(`"ellipsis-start"`)、中央に省略記号(`"ellipsis-middle"`)、または `"clip"` |
| `adjustsFontSizeToFit` | `.shrink_to_fit(min_scale)` | テキストが行数とボックスに収まるまでフォントを縮小します |
| `minimumFontScale` | | `adjustsFontSizeToFit` がどこまで縮小できるか(0〜1) |

```rust tabs
text(move || total.get())
    .number_of_lines(1)
    .shrink_to_fit(0.5)
    .text_size(px(48.0))
    .w(px(200.0))
```

```tsx tabs
<Text adjustsFontSizeToFit minimumFontScale={0.5} style={{ numberOfLines: 1, fontSize: 48, width: 200 }}>
  {total()}
</Text>
```

Tailwind のクラス `line-clamp-*`、`text-ellipsis`、`text-clip` は同じキーを設定します。また、`truncate`(`.truncate()`)は省略記号で切り詰めた 1 行表示です。これらはスタイルキーとして、ステートスタイルやバリアントも受け付けます。

<a id="system-text-size"></a>

## システムのテキストサイズ

テキストはデフォルトで、ユーザーのテキストサイズ設定(iOS では Dynamic Type、Android ではフォントサイズ)に従います。

| Prop | Rust | 説明 |
|---|---|---|
| `allowFontScaling` | `.allow_font_scaling(false)` | `false` はサイズを固定します。デフォルトは `true` |
| `maxFontSizeMultiplier` | `.max_font_size_multiplier(1.5)` | 適用される最大スケール。例:`1.5`。`0` は上限なしです |

Rust の `font_scale()` と、TSX の [`nsh`](../modules/nsh.md#device) から取得する `fontScale()` は現在のスケールを表し、ユーザーが設定を変更すると更新されます。input も `allowFontScaling` と `maxFontSizeMultiplier` を受け付けます。

```rust tabs
text("Tab label").max_font_size_multiplier(1.3).text_size(px(13.0))
```

```tsx tabs
<Text maxFontSizeMultiplier={1.3} style={{ fontSize: 13 }}>Tab label</Text>
```

スケーリングをオフにするよりも、上限を設けることをお勧めします。大きなテキストは、多くの人が頼りにしているアクセシビリティ設定です。

<a id="selection"></a>

## 選択

スタイルキー `userSelect: "text"`(`.select_text()`、クラス `select-text`)を指定すると、システム標準のテキストビューと同様に、ユーザーがテキストを選択してコピーできるようになります。長押しで指の下の単語が選択され、ハンドルで選択範囲の端を動かせ、編集メニューにはコピーとすべてを選択が表示されます(iOS では調べる、翻訳、共有が、Android では共有が加わります)。選択は 1 つのテキストブロック内に収まります。スタイルキー `selectionColor`(`.selection_color(..)`、`selection:text-*`)は、ハイライトとハンドルの色を指定します。ビューに設定した `userSelect` は、その内側にある、自身では設定していないテキストに適用されます。

デスクトップブラウザでは、Web ページと同様にテキストはデフォルトで選択可能です。ただし、インタラクティブな要素(ボタンや押下可能な行など、押下ハンドラやタッチハンドラを持つビュー)の内側は除きます。そこでテキストを選択不可のままにするには、`userSelect: "none"`(`.select_none()`、クラス `select-none`)を指定します。スマートフォンとタブレットのブラウザは、ネイティブのルールに従います。

```rust tabs
text(order_number).select_text().selection_color(rgb(0x7c3aed))
```

```tsx tabs
<Text style={{ userSelect: "text", selectionColor: "#7c3aed" }}>{orderNumber}</Text>
```

コードからコピーする場合(コピーボタンなど)は、Rust では `set_clipboard(..)`、TSX では [`Clipboard`](../modules/nsh.md#clipboard) を使います。

## onTextLayout

`onTextLayout`(Rust では `TextLayout` イベント)は、レイアウトのたびに、テキストのコンテンツボックス内でレイアウトされた行を通知します。

```rust tabs
text(move || body.get()).on(EventKind::TextLayout, move |e: &EventPayload| {
    if let EventPayload::TextLayout(laid_out) = e {
        lines.set(laid_out.len());
    }
})
```

```tsx tabs
<Text
  onTextLayout={(e) => {
    lines.set(e.lines.length);
    console.log(e.lines.map((l) => `${l.text} (${l.bounds.size.width.toFixed(0)}pt)`));
  }}
>
  {body()}
</Text>
```

各行は `text`、`x`、`y`、`width`、`height`、`ascender`、`descender`、`capHeight`、`xHeight` を持ちます(Rust では `cap_height` と `x_height`)。テキストが切り詰められたときだけ「続きを読む」ボタンを表示したり、他のコンテンツをベースラインに揃えたりする場合に使います。

<a id="accessibility"></a>

## アクセシビリティ

text 要素は、スクリーンリーダーによってその内容が読み上げられます。見出しとして機能するテキスト(`.role(AccessibilityRole::Header)`、`role="header"`)とリンク(`AccessibilityRole::Link`、`role="link"`)にはロールを指定してください。[Accessibility](./accessibility.md) を参照してください。

<a id="related"></a>

## 関連項目

- [Fonts](./fonts.md):カスタムフォントとウェイト。
- [text element](../elements/text.md):すべての prop。
- [Forms and keyboard](./forms-and-keyboard.md):テキスト入力。
