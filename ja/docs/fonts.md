---
title: "フォント"
description: "システムフォントとジェネリックファミリー、フォールバックリスト、Rust クレートのアセットや TSX のインポートから .ttf、.otf、.woff、.woff2 ファイルを同梱する方法、複数のウェイトとイタリックを持つファミリー、型付きスタイルや Tailwind クラスでのフォントの扱いについて説明します。"
order: 37
group: ui
source_hash: 9fd911f01604c8c3
---

# フォント

テキストは、フォントファミリーを指定しない限り、システムフォント(iOS では San Francisco、Android では Roboto)で表示されます(Rust では `.font_family(..)`、TSX では `fontFamily`)。ファミリーには、ジェネリックファミリー、デバイスにインストールされているフォント、アプリに同梱するフォントファイルのいずれかを指定できます。

<a id="system-and-generic-families"></a>

## システムフォントとジェネリックファミリー

| `fontFamily` | フォント |
|---|---|
| (なし)、`"system-ui"`、`"sans-serif"`、`"ui-sans-serif"`、`"-apple-system"` | システムフォント |
| `"serif"`、`"ui-serif"` | システムセリフ(iOS では New York、Android では Noto Serif) |
| `"monospace"`、`"ui-monospace"` | システム等幅フォント(iOS では SF Mono) |
| `"ui-rounded"` | 丸ゴシックのシステムフォント(SF Pro Rounded)、iOS のみ |

システムフォントは 100 から 900 までのすべてのウェイトに対応しています。Tailwind の `font-sans`、`font-serif`、`font-mono` は最初の 3 行に対応し、`font-sans` と `font-mono` はテーマにフォントが設定されている場合、そのフォントに対応します([アプリのデフォルトフォント](#a-default-font-for-the-app))。

デバイスにインストールされているファミリーは、名前で直接指定できます(`"Georgia"`、iOS では `"Avenir Next"`)。インストールされているフォントはプラットフォームやバージョンによって異なるため、デザインが依存するフォントは同梱してください。iOS では、存在しないファミリーを指定するとシステムフォントにフォールバックし、ログに警告が出力されます(`font family 'X' is not available`)。代わりに使うフォントを選ぶには、リストで名前を指定します([フォールバックリスト](#fallback-lists))。

<a id="shipping-a-font"></a>

## フォントの同梱

Rust のクレートは、`assets/` ディレクトリ内のファイルを同梱します。`#[native_module]` 関数内で `registry.assets(assets!())` を使うとすべてのファイルが同梱され、`asset!("fonts/Pacifico-Regular.ttf")` は `FontAsset` で、その `family` はクレートのコンパイル時にファイルから読み取られたフォントのファミリー名です。TSX では、`.ttf`、`.otf`、`.woff`、`.woff2` のいずれかのファイルをインポートします。インポートの値はフォントのファミリー名として評価されます。どちらの方法でも、フォントは最初のフレームの前に登録されるため、テキストが最初に描画される時点で使用可能です。WOFF および WOFF2 ファイルは圧縮された TrueType または OpenType フォントです(WOFF2 ファイルは TrueType の半分程度のサイズになることが多く、アプリのパッケージや Web のダウンロードサイズを節約できます)。NSH は、これらをすべてのプラットフォームで、含まれているフォントとして読み込みます。

```rust tabs
use nsh_core::{element::FontAsset, prelude::*};

const PACIFICO: FontAsset = asset!("fonts/Pacifico-Regular.ttf");

#[native_module("app/native")]
fn native(registry: &mut Registry) {
    registry.assets(assets!());
}

text("Custom fonts").font_family(PACIFICO.family).text_size(px(30.0))
```

```tsx tabs
import { Text } from "nsh";
import Pacifico from "./fonts/Pacifico-Regular.ttf";

<Text style={{ fontFamily: Pacifico, fontSize: 30 }}>Custom fonts</Text>
```

`PACIFICO.family` と TSX のインポート `Pacifico` は文字列 `"Pacifico"` です。これはフォントファイルに格納されているファミリー名(タイポグラフィックファミリー名、なければファミリー名)であり、ファイル名ではありません。名前を手で書く代わりにアセットの値を使うと、両者の一致が保たれます。ファイルが存在しない場合や壊れている場合は Rust のビルドが失敗し、インポートされたファイルは確実にバンドルされます。

ファイルは、他の[アセット](./images-and-assets.md)と同様にアプリと一緒に配布されます。フォントはアプリのプロセス内でのみ登録され、デバイスにはインストールされません。

> [!WARNING]
> TSX では、値が一度も使われないインポートは TypeScript のインポート省略(import elision)によって削除され、フォントも一緒に削除されます。ファミリーを名前だけで参照する場合(たとえば Tailwind のテーマ内)は、副作用のためだけにファイルをインポートしてください:`import "./fonts/Inter-Bold.ttf";`。Rust のクレートは、`assets!()` を通じて `assets/` のすべてのファイルを同梱します。

<a id="fallback-lists"></a>

## フォールバックリスト

`fontFamily` は CSS と同様にリストを受け取ります。ファミリーはカンマで区切り、優先度の高いものから順に並べます。スペースを含む名前は引用符で囲んでも囲まなくても構いません(`"Brand, 'Noto Sans SC', sans-serif"`)。引用符で囲んだ名前はカンマを含められます(`'ACME, Inc'`)。テキストは、プラットフォームが持つリスト内の最初のファミリーで組まれ、そのファミリーにない文字(別の文字体系や記号)は、リスト内でその文字を持つ次のファミリー、次いでシステムのフォールバックフォントから取得されます。リストを使うと、ラテン文字のみに対応するブランドフォントでも中国語を合うフォントで表示したり、アプリがダウンロードするフォントが届くまでシステムフォントを表示したりできます。

```rust tabs
text("Brand 品牌").font_family("Brand, 'Noto Sans SC', sans-serif")
```

```tsx tabs
<Text style={{ fontFamily: "Brand, 'Noto Sans SC', sans-serif" }}>Brand 品牌</Text>
```

各プラットフォームは、リストの順序をそれぞれのフォント機構で維持します。iOS と macOS ではカスケードリスト、Windows ではフォントフォールバック(段落ごとに 1 つ、つまり最初のスタイルのリスト)、Linux では Pango のファミリーリスト、Web ではブラウザーのもの、GPUI ではそのフォールバックを使用します。Android では、テキストはそのプラットフォームが持つ最初のファミリーで組まれます。それがアプリの登録したフォントである場合、リスト内でそれより後ろに登録されたフォントがそのフォールバックになります(Android 10 以降)。

<a id="weights-and-italics"></a>

## ウェイトとイタリック

ファミリーは通常、ウェイトとスタイルごとに 1 つずつ、複数のファイルで提供されます。使用するものをすべて同梱し(Rust では `assets/` に置き、TSX ではそれぞれをインポートします)、同じファミリー名で登録されます。ウェイトとスタイルによって書体が選ばれます。

```rust tabs
// assets/fonts: Inter-Regular.ttf, Inter-Medium.ttf, Inter-Bold.ttf, Inter-Italic.ttf
const INTER: FontAsset = asset!("fonts/Inter-Regular.ttf");

text("Regular, ")
    .font_family(INTER.family)
    .text_size(px(16.0))
    .child(text("medium").font_weight(FontWeight::MEDIUM))
    .child(", ")
    .child(text("bold").font_weight(FontWeight::BOLD))
    .child(" and ")
    .child(text("italic").italic())
    .child(".")
```

```tsx tabs
import { Text } from "nsh";
import Inter from "./fonts/Inter-Regular.ttf";
import "./fonts/Inter-Medium.ttf";
import "./fonts/Inter-Bold.ttf";
import "./fonts/Inter-Italic.ttf";

const body = { fontFamily: Inter, fontSize: 16 } as const;

<Text style={body}>
  Regular, <Text style={{ fontWeight: "500" }}>medium</Text>, <Text style={{ fontWeight: "bold" }}>bold</Text> and{" "}
  <Text style={{ fontStyle: "italic" }}>italic</Text>.
</Text>
```

要求されたウェイトと完全に一致する登録済みの書体がない場合は、最も近いものが使われます。書体がない場合の動作はプラットフォームによって異なります。

| | iOS | Android |
|---|---|---|
| 書体のないウェイト | 登録済みの最も近い書体 | 最も近い書体。該当する場合は Android の擬似ボールドが適用される |
| イタリック書体のないイタリック | アップライトの書体(傾斜なし) | アップライトの書体を傾斜させたもの |

両方で同じ結果を得るには、使用する書体を同梱してください。

<a id="fonts-in-typed-styles-and-tailwind-classes"></a>

## 型付きスタイルと Tailwind クラスでのフォント

Rust では、`.font_family(..)` はスタイルを指定できるあらゆる場所でアセットのファミリーを受け取り、ウェイトのメソッド(`.font_weight(FontWeight::SEMIBOLD)`)が書体を選択します。クラスを使う場合は、`nsh.json` の Tailwind テーマでファミリーに名前を付けると、`font-*` クラスとして使用できます。

```json
{
  "tailwind": {
    "fontFamily": { "display": "Pacifico", "body": "Inter" }
  }
}
```

```rust tabs
use nsh_core::element::palette::VIOLET;

text("Custom fonts").font_family(PACIFICO.family).text_3xl().text_color(VIOLET.shade(600))
text("Bold Inter").font_family(INTER.family).font_weight(FontWeight::BOLD)
```

```tsx tabs
import { Text } from "nsh";
import "./fonts/Pacifico-Regular.ttf";
import "./fonts/Inter-Regular.ttf";
import "./fonts/Inter-Bold.ttf";

<Text class="font-display text-3xl text-violet-600">Custom fonts</Text>
<Text class="font-body font-bold">Bold Inter</Text>
```

任意のファミリーは、テーマにエントリがなくても使えます:`font-[Pacifico]`。ウェイトクラス(`font-light`、`font-semibold`、`font-bold` など)は `fontWeight` と同様に書体を選択します。ビューのテキストスタイルはその内側のテキストに引き継がれるため、ビューに `.font_family(INTER.family)` または `<View class="font-body">` を指定すると、画面全体のファミリーが設定されます。

<a id="a-default-font-for-the-app"></a>

## アプリのデフォルトフォント

テーマの `font-sans` がアプリのフォントです。独自のファミリーを設定していないすべてのテキストは、Rust コンポーネントでも TSX でも、Web ページが Tailwind の `--font-sans` で描画されるのと同様に、このフォントで描画されます。`font-mono` は等幅フォントで、`font-mono` クラスと `TextView` 内のコードに使われます。これらはアプリのテーマ(`nsh.json` 内の `"theme"`、[Rust](./rust.md#theme))で設定し、上記のとおりフォントファイルを同梱してください。

```json
{
  "cssVars": {
    "theme": {
      "font-sans": "Inter, sans-serif",
      "font-mono": "JetBrains Mono, monospace"
    }
  }
}
```

リスト内でジェネリックでない最初のファミリーがフォントになります。最初のファミリーがジェネリック(`system-ui`、`sans-serif`)の場合は、システムフォントになります。フォントはコンテナーにも設定でき、その内側のテキストが継承します。

```rust tabs
#[component]
pub fn Root() -> impl IntoElement {
    view().flex_1().font_family(INTER.family).child(app())
}
```

```tsx tabs
mount(() => (
  <View class="flex-1 font-body">
    <App />
  </View>
));
```

<a id="font-features"></a>

## フォント機能

`fontVariant` は、フォントの OpenType 機能を有効にします。対象は `"tabular-nums"`、`"proportional-nums"`、`"lining-nums"`、`"oldstyle-nums"`、`"small-caps"` です(Rust では `.tabular_nums()`、`.small_caps()` など。[テキスト](./text.md#text-styles))。フォントがそれらの機能を含んでいる必要があります。システムフォントは含んでいます。

<a id="related"></a>

## 関連項目

- [テキスト](./text.md):テキストスタイル、サイズ、システムのテキストサイズ設定。
- [Tailwind](./tailwind.md#theme):テーマのキー。
- [画像とアセット](./images-and-assets.md):アプリのファイルの同梱方法。
