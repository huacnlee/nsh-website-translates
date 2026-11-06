---
title: "TextView"
description: "TextView コンポーネント: Markdown、HTML、またはブロックで構成されたドキュメントを、ネイティブのテキストとビューで表示します。パーツごとにスタイルを設定でき、AI チャットの返信、記事、ヘルプページに適しています。"
group: base
demo: text-view
source_hash: d73c7be1682f9cf4
---

# TextView

`TextView` は、Markdown、HTML、またはアプリが組み立てたブロックで書かれたドキュメントを表示します。見出し、段落、強調、リンク、リストとタスクリスト、引用と GitHub のアラート、コード、表、画像、数式、脚注、ディスクロージャーに対応します。チャットでの AI モデルの返信のために作られており、返信は Markdown としてストリームで届き、チャンクごとに書式が適用されたテキストが表示されます。パースは Rust で行われ、ドキュメントは [`Text`](./text.md) 要素とビューで描画されます。

動作を自ら担い、読むための独自のタイポグラフィを備えています。15pt のテキストをゆったりした 25.5pt の行で組み、見出しはセミボールドで上に余白を取り、リンクはテーマの `primary` 色で下線を付け、コードはテーマの `font-mono` で枠線付きの角丸ボックスに入れ、表は四方に罫線を引いてヘッダー行に色を付け、引用は脇に線を引き、アラートは GitHub のアラート色のアイコン付きの色付きボックスで表示します。色はテーマのトークン(`foreground`、`muted-foreground`、`border`、`muted`、`primary`、注意を表す `destructive`)なので、テーマやダークアピアランスが反映されます。各パーツには、これらのデフォルトの上にアプリのスタイルが適用されます。TSX では `classes` と `styles`、Rust ではパーツごとの型付きスタイル(`TextViewParts`)です。Rust では `nsh_base::text_view()` で、TSX では `nsh/base` の `<TextView>` で作成します。

```rust tabs
use nsh_base::{TextViewLinkPressEvent, text_view, theme};
use nsh_core::prelude::*;

const README: &str = "# Release notes

**Faster lists** and a new `TextView`:

- Markdown and HTML
- [x] Streaming replies
- [ ] Your own syntax

> [!TIP]
> Style every part with `TextViewParts`.";

fn release_notes() -> impl IntoElement {
    scroll().flex_1().child(
        text_view()
            .markdown(README)
            .on_link_press(|TextViewLinkPressEvent { url, .. }: &TextViewLinkPressEvent| log::info!("open {url}"))
            .p_5()
            .text_base()
            .text_color(theme().foreground),
    )
}
```

```tsx tabs
import { mount, Scroll } from "nsh";
import { TextView } from "nsh/base";

const README = `# Release notes

**Faster lists** and a new \`TextView\`:

- Markdown and HTML
- [x] Streaming replies
- [ ] Your own syntax

> [!TIP]
> Style every part with \`classes\`.`;

function App() {
  return (
    <Scroll class="flex-1" contentClass="p-5">
      <TextView
        markdown={README}
        class="text-base text-neutral-900 dark:text-neutral-100"
        classes={{
          heading1: "text-3xl",
          code: "rounded bg-neutral-100 dark:bg-neutral-800",
          link: "text-blue-600",
          alertTip: "border-l-4 border-green-600 pl-3",
        }}
        onLinkPress={({ url }) => console.log("open", url)}
      />
    </Scroll>
  );
}

mount(App);
```

Rust では、`view()` がビューを作るのと同じように `text_view()` で作成します。props ごとのセッター(`.markdown(..)`、`.options(..)`、`.selectable(..)`)、レンダー関数ごとのクロージャ(`.render_image(|image| ..)`)、イベントごとのリスナー(`.on_link_press(..)`)、そしてルート用の型付きスタイルメソッド(`.p_5()`、`.text_color(..)`)があり、そのテキストスタイルは各パーツに渡されます。

<a id="built-on-text"></a>

## Text をもとに

`TextView` は [`Text`](./text.md) 要素でできており、そのテキストは Text のページの説明どおりに動作します。すべての段落、見出し、表のセル、コードブロックは 1 つのネイティブな `Text` です。レイアウト、折り返し、フォントスケールへの追従を行い、`selectable` を指定すれば選択とコピーもできる 1 つのブロックです。強調、斜体、取り消し線などのインラインマークは [スパン](./text.md#spans) です。インラインコードは [スパンの背景](./text.md#span-backgrounds) を持つスパンなので、`code: "rounded bg-neutral-100"` で角丸の背景が付きます。リンクは [押せるスパン](./text.md#links)、画像とインラインのカスタムノードは [インラインアタッチメント](./text.md#inline-views-and-images) です。ルートのテキストスタイルは、`Text` から各スパンへ [テキストスタイル](./text.md#text-styles) が渡るのと同様に、すべてのパーツに渡されます。

`selectable` を指定すると、Web ページのようにドキュメント全体が 1 つとして選択できます。ドラッグ(タッチスクリーンでは長押しとハンドル)で、ある段落、リスト項目、セル、コードブロックから次のものへ範囲が伸び、コピーではそのすべてのテキストが取得されます。`selectable` `TextView` は単独で 1 つとして選択されます。[選択可能なビュー](./text-selection.md) の内側では、その選択は周囲のテキストや他の `TextView` にも続きます。

`TextView` が加えるのはそれ以外の部分です。Markdown、HTML、ドキュメントをブロックへ読み取ること、テキストの周りのビュー(リスト、引用、表、コードブロック、ディスクロージャー、脚注)、ストリーミング、パーツごとのスタイル、レンダー関数、拡張です。

<a id="the-document"></a>

## ドキュメント

コンテンツは次の 3 つの props のいずれかで、この順に読まれます。

- **`markdown`**: GitHub の拡張(表、タスクリスト、取り消し線、オートリンク、脚注、アラート)付きの CommonMark、数式(`$…$` と `$$…$$`)、Markdown 内の HTML。
- **`html`**: リーダーが表示するとおりの HTML。テキスト、構造、インライン書式は反映され、スクリプト、スタイル、フォームコントロール、非表示要素は除外されます。断片でもページ全体でも使えます(ページでは body が表示されます)。
- **`document`**: アプリが組み立てる、または保持するブロック。TSX ではプレーンオブジェクト、Rust では `nsh_base::text_view::Document` です([ドキュメントモデル](#the-document-model))。

```rust tabs
use nsh_base::text_view;
use nsh_base::text_view::{Block, Document, Inline};
use nsh_core::prelude::*;

fn shipping() -> impl IntoElement {
    text_view().html(r#"<h2>Shipping</h2><p>Orders ship in <b>2 days</b>. <a href="/faq">FAQ</a></p>"#)
}

fn total() -> impl IntoElement {
    text_view().document(Document::new(vec![
        Block::Heading { level: 2, content: vec![Inline::text("Total")], anchor: None },
        Block::paragraph(vec![Inline::Strong { content: vec![Inline::text("$42.00")] }]),
    ]))
}
```

```tsx tabs
<TextView html={`<h2>Shipping</h2><p>Orders ship in <b>2 days</b>. <a href="/faq">FAQ</a></p>`} />

<TextView document={{
  blocks: [
    { type: "heading", level: 2, content: [{ type: "text", text: "Total" }] },
    { type: "paragraph", content: [{ type: "strong", content: [{ type: "text", text: "$42.00" }] }] },
  ],
}} />
```

`TextView` はコンテンツに合わせて伸びます。長いドキュメントは [`Scroll`](./scroll.md) に入れてください([`List`](./list.md) の行でも構いません)。

<a id="styling-the-parts"></a>

## パーツのスタイル

`class` と `style` はルート、つまりブロックの列にスタイルを付けます。ここで設定したテキストスタイル(色、サイズ、フォント)は各パーツに渡されます。ルートはパーツ `root` でもあります。`styles.root` は型付きのテキストスタイルを受け取り(`style` はビューのものとして型付けされます)、`classes.root` はクラスを受け取ります。`classes` はパーツごとに Tailwind クラスを、`styles` はパーツごとにインラインスタイルを受け取ります。パーツのクラスはそのパーツ自身のデフォルトスタイルの後に適用されるので優先され、`styles` はクラスより優先されます。Rust ではパーツは型付きスタイルを受け取ります。`TextViewParts` は、それを提供するビューの下にあるすべての `TextView` について、各 `TextViewPart` にスタイルを調整する関数を与えます([型付きパーツスタイル](#typed-part-styles))。ルートにはスタイルメソッドを使います。デフォルトの行の高さはポイントで設定されているため、パーツのサイズを変えるクラスは行の高さも設定してください(Tailwind の `text-*` クラスはそうなっています)。

```rust tabs
use nsh_base::{TextViewPart, TextViewParts, text_view, theme};
use nsh_core::prelude::*;

fn reply(markdown: Signal<SharedString>) -> impl IntoElement {
    provide_context(
        TextViewParts::new()
            .part(TextViewPart::Heading, |s| s.text_color(rgb(0x0a0a0a)))
            .part(TextViewPart::Heading2, |s| s.text_xl().mt_2())
            .part(TextViewPart::Blockquote, |s| {
                s.border_l(px(2.0)).border_color(rgb(0xd4d4d4)).pl_3().text_color(rgb(0x525252))
            })
            .part(TextViewPart::CodeBlock, |s| s.rounded_lg().bg(rgb(0xf5f5f5)))
            .part(TextViewPart::CodeBlockHeader, |s| s.px_3().pt_2())
            .part(TextViewPart::CodeBlockCode, |s| s.p_3().text_size(px(13.0)))
            .part(TextViewPart::Table, |s| s.rounded_lg().border_1().border_color(rgb(0xe5e5e5)))
            .part(TextViewPart::TableHead, |s| s.bg(rgb(0xfafafa)))
            .part(TextViewPart::TableCell, |s| {
                s.px_3().py_2().border_t_1().border_color(rgb(0xe5e5e5))
            })
            .part(TextViewPart::TaskMarkerChecked, |s| s.text_color(rgb(0x16a34a)))
            .part(TextViewPart::Link, |s| s.text_color(theme().primary)),
    );
    text_view()
        .markdown(move || markdown.get())
        .gap_3()
        .text_size(px(15.0))
        .line_height(px(24.0))
        .text_color(rgb(0x262626))
        .font_family("Inter")
}
```

```tsx tabs
<TextView
  markdown={reply()}
  class="gap-3 text-[15px] leading-6 text-neutral-800"
  classes={{
    heading: "text-neutral-950",
    heading2: "text-xl mt-2",
    blockquote: "border-l-2 border-neutral-300 pl-3 text-neutral-600",
    codeBlock: "rounded-lg bg-neutral-100",
    codeBlockHeader: "px-3 pt-2",
    codeBlockCode: "p-3 text-[13px]",
    table: "rounded-lg border border-neutral-200",
    tableHead: "bg-neutral-50",
    tableCell: "px-3 py-2 border-t border-neutral-200",
    taskMarkerChecked: "text-green-600",
  }}
  styles={{ root: { fontFamily: "Inter" }, link: { color: "#2563eb" } }}
/>
```

ノードによっては複数のパーツになり、順に適用されます。レベル 2 の見出しは `heading` の次に `heading2`、アラートは `blockquote`、`alert`、続いてその種類(`alertNote` など)、タスクマーカーは `listMarker`、`taskMarker`、完了していれば `taskMarkerChecked`、ヘッダー行は `tableRow` の次に `tableHead`、そのセルは `tableCell` の次に `tableHeaderCell` です。

| パーツ | Rust | 内容 |
|---|---|---|
| `root` | `Root` | テキストビュー自体。ブロックの列で、ここのテキストスタイルは各パーツに渡されます。 |
| `paragraph` | `Paragraph` | すべての段落。 |
| `heading` | `Heading` | すべての見出し。そのレベルのパーツの前に適用されます。 |
| `heading1` … `heading6` | `Heading1` … `Heading6` | そのレベルの見出し(27、20、17、その後は 15pt、セミボールド)。 |
| `blockquote` | `Blockquote` | 引用とアラート。ブロックの列で、脇に線があります。 |
| `alert` | `Alert` | すべてのアラート(`> [!NOTE]`)。`blockquote` の後に適用されます。色付きボックスで、アイコンとブロックの行です。 |
| `alertNote`、`alertTip`、`alertImportant`、`alertWarning`、`alertCaution` | `AlertNote`、`AlertTip`、`AlertImportant`、`AlertWarning`、`AlertCaution` | その種類のアラート。 |
| `alertIcon` | `AlertIcon` | アラートのアイコン。アラートの色のグリフが入ったリング。 |
| `list` | `List` | すべてのリスト。項目の列。 |
| `orderedList`、`unorderedList` | `OrderedList`、`UnorderedList` | 番号付きリストと箇条書きリスト。`list` の後に適用されます。 |
| `listItem` | `ListItem` | すべての項目。マーカーとブロックの行。 |
| `listMarker` | `ListMarker` | 項目のマーカー(深さに応じた `•`、`◦`、`▪`、または `1.`)。項目の前のインデント内で右揃えです。 |
| `taskMarker` | `TaskMarker` | タスク項目のマーカー。ビューとして描画されるボックスで、完了すると `✓` で塗りつぶされます。`listMarker` の後に適用されます。 |
| `taskMarkerChecked` | `TaskMarkerChecked` | 完了したタスク項目のマーカー。`taskMarker` の後に適用されます。 |
| `listItemContent` | `ListItemContent` | 項目のブロックの列。 |
| `codeBlock` | `CodeBlock` | コードブロック。コードを入れた枠線付きの角丸ボックスで、上にヘッダーがあります。 |
| `codeBlockHeader` | `CodeBlockHeader` | コードブロックのアクション(`codeBlockActions`)の行。右上隅に浮かんで表示されます。 |
| `codeBlockScroll` | `CodeBlockScroll` | コードブロックのコードを囲む横スクロールビュー。 |
| `codeBlockCode` | `CodeBlockCode` | コードブロックのコード(等幅、書かれたまま)。 |
| `code` | `Code` | テキスト中のコード(等幅、角丸の背景)。 |
| `keyboard` | `Keyboard` | キー(`<kbd>`、コードとして)。 |
| `strong` | `Strong` | 太字(セミボールド)。 |
| `emphasis` | `Emphasis` | 強調テキスト(イタリック)。 |
| `strikethrough` | `Strikethrough` | 取り消し線付きテキスト。 |
| `underline` | `Underline` | 下線付きテキスト(`<u>`、`<ins>`)。 |
| `highlight` | `Highlight` | ハイライトされたテキスト(`<mark>`、角丸の黄色の背景)。 |
| `superscript`、`subscript` | `Superscript`、`Subscript` | 上付き文字と下付き文字(小さめ)。 |
| `link` | `Link` | リンク(テーマの `primary` 色、下線付き)。 |
| `image` | `Image` | 画像。 |
| `math` | `Math` | テキスト中の数式。`renderMath` がない場合は組版されます。 |
| `mathBlock` | `MathBlock` | 数式ブロック。`renderMath` がない場合は組版され、中央揃えになります。 |
| `table` | `Table` | 表。`renderTableActions` の内容、続いてセルのスクロールビュー。 |
| `tableScroll` | `TableScroll` | 表のセルの横スクロールビュー。余裕があれば列は内容に合わせ、ビューが狭ければ下限まで折り返し、それ以上は表がスクロールします。 |
| `tableRow` | `TableRow` | 表のすべての行。セルの背後のビューで、背景と枠線用です(テキストスタイルは `tableCell` に指定します)。 |
| `tableHead` | `TableHead` | ヘッダー行。`tableRow` の後に適用されます。 |
| `tableCell` | `TableCell` | すべてのセル。 |
| `tableHeaderCell` | `TableHeaderCell` | ヘッダー行のセル(小さめ、控えめな色)。`tableCell` の後に適用されます。 |
| `rule` | `Rule` | 水平線。上枠線として描かれる線。 |
| `details` | `Details` | ディスクロージャー(`<details>`)。 |
| `summary` | `Summary` | ディスクロージャーの概要。押すと開閉します。 |
| `summaryMarker` | `SummaryMarker` | 概要のマーカー(`▸`、`▾`)。 |
| `footnotes` | `Footnotes` | ブロックの後に置かれる脚注。列です。 |
| `footnote` | `Footnote` | 脚注。番号とブロックの行。 |
| `footnoteLabel` | `FootnoteLabel` | 脚注の番号。 |
| `footnoteReference` | `FootnoteReference` | テキスト中の脚注への参照(番号、小さめ)。 |
| `custom` | `Custom` | 内容として表示されるカスタムノード(レンダー関数で表示されない場合)。 |

<a id="streaming-ai-replies"></a>

## AI の返信のストリーミング

返信が伸びるのに合わせて、`options={{ streaming: true }}`(Rust では `MarkdownOptions { streaming: true, .. }`)で渡します。まだ届いている途中のテキストの末尾では、構文が閉じていないことがよくあります(`**bold`、`` `code ``, `[a link](htt`, a table whose header just arrived))。ストリーミングでは閉じた後の見た目で表示するため、読み手に余分な `**` や `[` が見えることはありません。ブロックは位置で保持されます。完成したブロックはビューを保ち、書き込み中のブロックだけが作り直されるので、長い返信でも更新は軽く済みます。

`streamingCaret` はドキュメントの末尾に追従します。最後のブロックがどこで終わっても(段落、リスト項目、コードブロック、表の最後のセル)、最後のテキストの末尾にインラインで表示され、それ以外の場合(水平線、レンダー関数の内容)は最後のブロックの後の独立した行に表示されます。返信が終わったら削除してください。

```rust tabs
use nsh_base::{MarkdownOptions, text_view};
use nsh_core::prelude::*;

/// A reply the app appends to as chunks arrive, with `done` set at the end.
fn reply(text: Signal<SharedString>, done: Signal<bool>) -> impl IntoElement {
    text_view()
        .markdown(move || text.get())
        .options(move || MarkdownOptions { streaming: !done.get(), ..Default::default() })
        .streaming_caret(when(
            move || !done.get(),
            || view().ml_0p5().h_4().w_2().rounded_sm().bg(rgb(0xa3a3a3)),
        ))
}
```

```tsx tabs
import { signal, View } from "nsh";
import { TextView } from "nsh/base";

function Reply(props: { stream: AsyncIterable<string> }) {
  const text = signal("");
  const done = signal(false);
  (async () => {
    for await (const chunk of props.stream) text.update((t) => t + chunk);
    done.set(true);
  })();
  return (
    <TextView
      markdown={text()}
      options={{ streaming: !done() }}
      streamingCaret={done() ? undefined : <View class="ml-0.5 h-4 w-2 rounded-sm bg-neutral-400" />}
    />
  );
}
```

キャレットはアプリ自身のビューなので、[`nsh` のアニメーション API](../modules/nsh.md#animation) で点滅やパルスをさせたり、新しいブロックをアプリのアニメーションでフェードインさせたりできます。

<a id="links"></a>

## リンク

リンクは [押せるスパン](./text.md#links) です。押すと `onLinkPress` が `{ url }` とともに呼ばれ、何を開くか(アプリ独自のページ、[`WebView`](./web-view.md)、見出しへのスクロール)はアプリが決めます。見出しにはアンカーがあり(GitHub 方式で、`## Getting started` は `#getting-started` になります)、`#getting-started` へのリンクはその文字列として届き、脚注参照は `#footnote-<label>` として届きます。

```rust tabs
use nsh_base::{TextViewLinkPressEvent, text_view};
use nsh_core::prelude::*;

fn doc(markdown: &'static str) -> impl IntoElement {
    text_view().markdown(markdown).on_link_press(|TextViewLinkPressEvent { url, .. }: &TextViewLinkPressEvent| {
        match url.strip_prefix('#') {
            Some(anchor) => scroll_to_anchor(anchor),
            None => open_web(url),
        }
    })
}
```

```tsx tabs
<TextView
  markdown={doc}
  onLinkPress={({ url }) => {
    if (url.startsWith("#")) scrollToAnchor(url.slice(1));
    else nav.push({ name: "web", url });
  }}
/>
```

`scroll_to_anchor` と `open_web`(TSX では `scrollToAnchor` と `nav`)はアプリ独自の関数を表します。

`links="open"` を指定すると、他のサイトやアプリへのリンク(スキーム付きの URL: `https:`、`mailto:` など)を押したとき、`onLinkPress` が報告した後に、アプリの `openUrl` 権限のもとで [`openUrl`](../modules/nsh.md#openurl) によりアプリの外でも開きます。ドキュメント内のアンカー(`#…`)は報告されるだけです。デフォルトの `"report"` は何も開きません。

```rust tabs
use nsh_base::{TextViewLinks, text_view};

text_view().markdown(doc).links(TextViewLinks::Open)
```

```tsx tabs
<TextView markdown={doc} links="open" />
```

<a id="render-functions"></a>

## レンダー関数

レンダー関数はアプリ独自のコンテンツをドキュメントに差し込みます。それぞれがパーツの値を受け取り、そのコンテンツ(TSX では JSX、Rust では要素)を返します。パーツは値が変わらない間、レンダーされた内容を保持するため、ストリーミング中は書き込み中のパーツだけが再レンダーされます。

| Prop | Rust | 値 | 置き換え・追加する内容 |
|---|---|---|---|
| `renderCodeBlock` | `.render_code_block(\|code\| ..)` | `TextViewCodeBlock`(`CodeBlock`) | コードブロックを置き換えます(独自のシンタックスハイライト)。 |
| `renderCodeBlockAction` | `.render_code_block_action(\|action\| ..)` | `TextViewCodeAction` | アプリ独自のコードブロックアクション(`codeBlockActions`)のアイコン。周りのボタンは `TextView` のものです。 |
| `renderTableActions` | `.render_table_actions(\|table\| ..)` | `TextViewTable`(`Table`) | 表の上にコンテンツ(コピー、エクスポート)を追加します。 |
| `renderMath` | `.render_math(\|math\| ..)` | `TextViewMath` | 数式を置き換えます。`{ tex, display }`、`$$…$$` ブロックの場合は `display`。 |
| `renderImage` | `.render_image(\|image\| ..)` | `TextViewImage`(`Image`) | 画像(`{ src, alt, title }`)を置き換えます。独自の読み込み、サイズ指定、押したときのビューア。 |
| `renderCustom` | `.render_custom(\|node\| ..)` | `TextViewCustomNode`(`CustomNode`) | カスタムノードを `name` で表示します([Markdown 拡張](#markdown-extensions))。 |

コードブロックは右上隅にアクションを持ち、すべて同じ見た目で描かれます。ホバー中や押下中に背景が現れるゴーストボタンで、デスクトップではポインターがブロック上にある間、タッチスクリーンでは常に表示されます。`copy` は組み込みで、コードをコピーし、しばらくチェックマークを表示します。その他のアクションはアプリのものです。`renderCodeBlockAction` がアイコンを描き、`onCodeBlockAction` が押下を報告します(組み込みの `copy` も、コピーの後に報告されます)。`copy` は `Clipboard` と同様にクリップボードへ書き込むため、アプリの `clipboard` 権限(`nsh.json`)が必要です。

```rust tabs
use nsh_base::{TextViewCodeAction, TextViewCodeActionEvent, text_view};
use nsh_core::prelude::*;

fn reply(markdown: Signal<SharedString>) -> impl IntoElement {
    text_view()
        .markdown(move || markdown.get())
        .code_block_actions(vec![
            TextViewCodeAction::new("copy").with_label("Copy code"),
            TextViewCodeAction::new("run").with_label("Run"),
        ])
        .render_code_block_action(|_action: &TextViewCodeAction| text("▶").text_xs())
        .on_code_block_action(|event: &TextViewCodeActionEvent| {
            if event.id == "run" {
                run(&event.code.code);
            }
        })
}
```

```tsx tabs
import { Text } from "nsh";
import { TextView } from "nsh/base";

<TextView
  markdown={reply()}
  codeBlockActions={[
    { id: "copy", label: "Copy code" },
    { id: "run", label: "Run" },
  ]}
  renderCodeBlockAction={(action) => <Text class="text-xs">▶</Text>}
  onCodeBlockAction={({ id, code }) => id === "run" && run(code.code)}
/>
```

コードブロックは最初からハイライトされます。フェンスに言語名がある場合(`ts`、`tsx`、`rust`、`python`、`bash`、`json`、`toml`、`yaml`、`diff` ほか約 200 種)、コードは Allsum のコードパレットで表示され、アピアランスに応じてライトまたはダークになります。言語のないブロックはそのまま表示されます。独自のハイライトを持つアプリは、自前のコンポーネントや Rust クレートのコンポーネントから `renderCodeBlock` でコードを表示します。Rust のビューでは [`CodeHighlighter`](#syntax-highlighting) で `TextView` にハイライターを渡します。次はアプリ独自のハイライトによるコードと、幅いっぱいに広がる画像の例です。

```rust tabs
use nsh_base::text_view;
use nsh_base::text_view::{CodeBlock, Image};
use nsh_base::TextViewMath;
use nsh_core::prelude::*;

fn reply(markdown: Signal<SharedString>) -> impl IntoElement {
    text_view()
        .markdown(move || markdown.get())
        .render_code_block(|code: &CodeBlock| highlighted(code.language.clone(), code.code.clone()))
        .render_image(|img: &Image| {
            image(img.src.clone())
                .label(img.alt.clone())
                .aspect_ratio(16.0 / 9.0)
                .w_full()
                .rounded_lg()
        })
        .render_math(|math: &TextViewMath| math_view(math.tex.to_string(), math.display))
}
```

```tsx tabs
import { Image, View } from "nsh";

<TextView
  markdown={reply()}
  renderCodeBlock={(code) => <Highlighted language={code.language} code={code.code} />}
  renderImage={(image) => (
    <Image src={image.src} accessibilityLabel={image.alt} class="aspect-video w-full rounded-lg" />
  )}
  renderMath={(math) => <MathView tex={math.tex} display={math.display} />}
/>
```

`Highlighted` と `MathView`(Rust では `highlighted` と `math_view`)はアプリ独自のコンポーネント(ハイライター、数式レンダラー、または Rust クレートのコンポーネント)を表します。`renderMath` がない場合、`TextView` は KaTeX の TeX サポートとフォントを使い、テキストの色で、どのプラットフォームでも同じように数式を自分で組版します(`math` と `mathBlock` パーツ)。読み取れない TeX は等幅のソースとして表示されます。
## Markdown extensions

`extensions` はアプリ独自の構文をカスタムノードに変換し、`renderCustom` がそれを表示します。各拡張には `name`(生成されるノードの `name`)と、次の 4 種類の構文のいずれかがあります。

| 種類 | Rust | マッチ対象 | ノード |
|---|---|---|---|
| `pattern` | `MarkdownExtension::pattern(name, regex)` | テキスト内の正規表現(Rust の `regex` 構文)。コードとリンクの外が対象 | インライン。`text` はマッチ全体、`attributes` はそのグループ(`"1"`、`"2"`、…と、名前付きグループは名前で参照) |
| `language` | `MarkdownExtension::language(name, language)` | その言語のフェンス付きコードブロック(```` ```chart ````) | A block; `text` is the code, `attributes.meta` は info 文字列の残り) |
| `tag` | `MarkdownExtension::tag(name, tag)` | そのタグの HTML 要素または MDX 要素(大文字小文字は区別しません)(`<Callout kind="tip">`) | 属性と、解析された内容。単独の行にある要素は `children`(ブロック)、テキスト内の要素は `content`(インライン) |
| `container` | `MarkdownExtension::container(name, container)` | コンテナ `:::name` … `:::` | 内側の Markdown のブロック(`children`)。`:::note[Heads up]` は `attributes.label` を返し、`{key=value}` はその他の属性 |

````rust tabs
use nsh_base::text_view::{CustomNode, Document};
use nsh_base::{MarkdownExtension, text_view};
use nsh_core::prelude::*;

const MESSAGE: &str = r#"Thanks @ada! Here are the numbers:

```chart
12, 19, 7, 25
```

<Callout kind="tip">Charts update live.</Callout>

:::note[Heads up]
Numbers are in thousands.
:::"#;

fn custom(node: &CustomNode) -> AnyElement {
    match node.name.as_str() {
        "mention" => text(node.text.clone())
            .font_weight(FontWeight::SEMIBOLD)
            .text_color(rgb(0x2563eb))
            .into_element(),
        "chart" => bar_chart(node.text.split(',').filter_map(|v| v.trim().parse().ok()).collect())
            .into_element(),
        "callout" => view()
            .rounded_lg()
            .bg(rgb(0xfffbeb))
            .p_3()
            .child(text_view().document(Document::new(node.children.clone())))
            .into_element(),
        _ => view()
            .gap_1()
            .border_l(px(4.0))
            .border_color(rgb(0x3b82f6))
            .pl_3()
            .child(
                text(node.attributes.get("label").cloned().unwrap_or_else(|| "Note".into()))
                    .font_weight(FontWeight::SEMIBOLD),
            )
            .child(text_view().document(Document::new(node.children.clone())))
            .into_element(),
    }
}

fn message() -> impl IntoElement {
    text_view()
        .markdown(MESSAGE)
        .extensions(vec![
            MarkdownExtension::pattern("mention", r"@(\w+)"),
            MarkdownExtension::language("chart", "chart"),
            MarkdownExtension::tag("callout", "callout"),
            MarkdownExtension::container("note", "note"),
        ])
        .render_custom(custom)
}
````

````tsx tabs
import { Text, View } from "nsh";
import { TextView } from "nsh/base";
import type { MarkdownExtension, TextViewCustomNode } from "nsh/base";

const extensions: MarkdownExtension[] = [
  { name: "mention", pattern: "@(\\w+)" },
  { name: "chart", language: "chart" },
  { name: "callout", tag: "callout" },
  { name: "note", container: "note" },
];

const message = `Thanks @ada! Here are the numbers:

\`\`\`chart
12, 19, 7, 25
\`\`\`

<Callout kind="tip">Charts update live.</Callout>

:::note[Heads up]
Numbers are in thousands.
:::`;

function Custom(props: { node: TextViewCustomNode }) {
  const node = props.node;
  switch (node.name) {
    case "mention":
      return <Text class="font-semibold text-blue-600">{node.text}</Text>;
    case "chart":
      return <BarChart values={node.text!.split(",").map(Number)} />;
    case "callout":
      return (
        <View class="rounded-lg bg-amber-50 p-3">
          <TextView document={{ blocks: node.children ?? [] }} />
        </View>
      );
    default:
      return (
        <View class="gap-1 border-l-4 border-blue-500 pl-3">
          <Text class="font-semibold">{node.attributes?.label ?? "Note"}</Text>
          <TextView document={{ blocks: node.children ?? [] }} />
        </View>
      );
  }
}

<TextView markdown={message} extensions={extensions} renderCustom={(node) => <Custom node={node} />} />;
````

`BarChart`(Rust では `bar_chart`)はアプリ独自のチャートを表します。メンションパターンのグループは `node.attributes?.["1"]`(Rust では `node.attributes["1"]`: `ada`)に、マッチ全体は `node.text`(`@ada`)に入ります。render 関数のないカスタムノードは、その内容を表示します。
インラインノードに対して返されたビュー(チップ)は、自身の `verticalAlign` に従って行内に配置されます。`align-middle`(`verticalAlign: "middle"`)はテキストに対して中央揃えにし、ビューの方が高くない限り、その行は段落の `lineHeight` を保ちます。

### Options

`options` は、CommonMark と GitHub の構文に加えて読み取る Markdown 構文を選びます。Rust では同じフィールドを持つ `MarkdownOptions` です(`MarkdownOptions { streaming: true, ..Default::default() }`)。

| キー | 型 | デフォルト | 説明 |
|---|---|---|---|
| `math` | `boolean` | `true` | 数式: テキスト内は `$…$`、ブロックは `$$…$$`。 |
| `html` | `boolean` | `true` | Markdown 内の HTML は、`html` プロップが読み取るのと同じ方法で読み取られます。`false` はテキストとして表示します。 |
| `alerts` | `boolean` | `true` | GitHub のアラート: `> [!NOTE]`、`[!TIP]`、`[!IMPORTANT]`、`[!WARNING]`、`[!CAUTION]`。 |
| `frontmatter` | `boolean` | `false` | YAML フロントマター(先頭の `---` … `---`)は、`text` が YAML であるカスタムノード `frontmatter` になります。 |
| `mdx` | `boolean` | `false` | MDX: JSX 要素はタグ名を名前とするカスタムノードになり、`{expressions}` はカスタムノード `expression` になります。この場合、生の HTML はテキストとして読み取られます。 |
| `streaming` | `boolean` | `false` | テキストがまだ到着中: 末尾で閉じられていない構文は、閉じられているものとして表示されます。 |

## The document model

`document` プロップと render 関数の値は、各ノードが `type` でタグ付けされたプレーンオブジェクトです。型は `nsh/base` から提供されます: `TextViewDocument`、`TextViewBlock`、`TextViewInline`、`TextViewCodeBlock`、`TextViewTable`、`TextViewListItem`、`TextViewImage`、`TextViewFootnote`、`TextViewAlert`、`TextViewCustomNode`。Rust では `nsh_base::text_view` の型です(`Document`、`Block`、`Inline`、`CodeBlock`、`Table`、`ListItem`、`Image`、`Footnote`、`Alert`、`CustomNode`)。`Block` と `Inline` は、下記の型を PascalCase にしたものをバリアントとする enum で(`Block::Heading { level, content, anchor }`、`Inline::Strong { content }`)、フィールドは同じものをスネークケースにしています。

| ブロック `type` | フィールド |
|---|---|
| `paragraph` | `content` |
| `heading` | `level`(1〜6)、`content`、`anchor?` |
| `blockquote` | `children`、`alert?`(`"note"`、`"tip"`、`"important"`、`"warning"`、`"caution"`) |
| `list` | `ordered?`、`start?`、`loose?`、`items`(`{ checked?, children }`) |
| `codeBlock` | `language?`、`meta?`、`code` |
| `math` | `tex` |
| `table` | `align?`(列ごとの `"none"`、`"left"`、`"center"`、`"right"`)、`head`(セル)、`rows?`(セルの行)。セルは `{ content }` |
| `rule` | |
| `details` | `open?`、`summary`(インライン)、`children` |
| `custom` | `name`、`attributes?`、`text?`、`data?`、`children?`、`content?` |

| インライン `type` | フィールド |
|---|---|
| `text` | `text` |
| `strong`、`emphasis`、`strikethrough`、`underline`、`highlight`、`superscript`、`subscript` | `content` |
| `code` | `code` |
| `keyboard` | `text` |
| `link` | `url`、`title?`、`content` |
| `image` | `src`、`alt?`、`title?` |
| `math` | `tex` |
| `break` | |
| `footnoteReference` | `label`、`index` |
| `custom` | ブロックと同じ |

ドキュメントには `footnotes?` もあります: `{ label, index, children }`。ブロックの後に、最初に参照された順で表示されます。アプリは返信をドキュメントとして保存したり、自身のデータから構築したり、`renderCustom` が表示するカスタムノードを混在させたりできます。

### Parsing and plain text

`TextView` は、ドキュメントを表示せずに同期的に読み取ることもできます。

| 関数 | Rust | 戻り値 |
|---|---|---|
| `TextView.parse(markdown, options?, extensions?)` | `TextView::parse(markdown, options, extensions)` | `markdown` プロップが表示する `TextViewDocument`。 |
| `TextView.parseHtml(html, extensions?)` | `TextView::parse_html(html, extensions)` | `html` プロップが表示する `TextViewDocument`。 |
| `TextView.plainText(document)` | `TextView::plain_text(document)`、`Document::plain_text()` | マークアップを除いたドキュメントのテキスト: ブロックは空行で、リスト項目とテーブルの行は改行で、セルはタブで区切られます。 |

返信全体をコピーするボタン:

```rust tabs
use nsh_base::{TextView, button};
use nsh_core::prelude::*;

fn copy_reply(reply: Signal<SharedString>) -> impl IntoElement {
    button()
        .on_press(move || {
            let document = TextView::parse(reply.get().to_string(), None, None);
            set_clipboard(TextView::plain_text(document));
        })
        .child(text("Copy"))
}
```

```tsx tabs
<Button onPress={() => Clipboard.writeText(TextView.plainText(TextView.parse(reply())))}>
  <Text>Copy</Text>
</Button>
```

アプリは、一度だけ解析してドキュメントを保持したり(`document={doc}`)、表示する前に変更したりすることもできます。

## In Rust

Rust のビューは `nsh-base` クレートの同じコンポーネントを使用し、上記の例には Rust タブがあります。次の 3 つは Rust 固有です: アプリのハイライタ、パーツごとの型付きスタイル、Markdown プラグイン。これらはいずれも、`provide_context` によってビュー以下のすべての `TextView` に渡されます。ドキュメントの型は `nsh_base::text_view` にあり、`Parser` はプラグイン付きでドキュメントを読み取ることもできます(`Parser::new().plugin(..).markdown(source)`)。

### Syntax highlighting

`TextView` は、Allsum のコードパレットで syntect を使ってコードをハイライトします(`nsh-base` のフィーチャー `highlight`。デフォルトで有効)。大きなブロックはまずプレーンに表示され、バックグラウンドスレッドがハイライトを終えると色が付きます。
`CodeHighlighter` はこれに代わるアプリ独自のハイライタで、`provide_context` によってビュー以下のすべての `TextView` に渡されます。各コードブロックを受け取り、そのコードのバイト範囲に対するスタイルを返します(順序どおりで、重複しないこと。含まれない部分はプレーンになります)。`TextView` は、通常のコードブロック(ヘッダー、アクション、スクロールビュー、パーツ)の内側に、それらのスタイルを持つスパンとしてコードを表示します。ハイライタは、コードをスタイル付きの範囲に変換するものであれば何でも構いません: `tree-sitter`、アプリ独自のテーマを使った syntect など。

```rust
use std::ops::Range;

use nsh_base::{CodeHighlighter, text_view::CodeBlock};
use nsh_core::{element::StyleRefinement, prelude::*};

/// The app's highlighter (here with syntect, set up once by the app).
fn highlight(code: &CodeBlock) -> Vec<(Range<usize>, StyleRefinement)> {
    my_syntect::ranges(code.language.as_deref(), &code.code)
        .map(|(range, color, bold)| {
            let style = StyleRefinement::default().text_color(color);
            (range, if bold { style.font_weight(FontWeight::BOLD) } else { style })
        })
        .collect()
}

fn chat() -> impl IntoElement {
    provide_context(CodeHighlighter::new(highlight));
    view().child(messages())
}
```

`my_syntect::ranges` はアプリのハイライタとの接続部分を、`messages` はアプリのチャートビューを表します。
`renderCodeBlock` が指定されている場合は、これらすべての代わりにコードブロックを表示します。

### Typed part styles

`TextViewParts` は、Rust のビュー向けに、クラス文字列の代わりに型付きスタイルでパーツをスタイリングします。各 `TextViewPart`([上の表](#styling-the-parts)のパーツごとに 1 つ)は、その `StyleRefinement` を調整する関数を受け取ります。`provide_context` で指定すると、下にあるすべての `TextView` に、その `classes` と `styles` より前に適用されます。ここで読み取られるテーマカラーは、ライトとダークの外観に追従します。

```rust
use nsh_base::{TextViewPart, TextViewParts, theme};
use nsh_core::prelude::*;

fn chat_parts() {
    provide_context(
        TextViewParts::new()
            .part(TextViewPart::Heading1, |s| s.text_2xl().font_weight(FontWeight::BOLD))
            .part(TextViewPart::Code, |s| s.bg(theme().muted).rounded(px(4.0)))
            .part(TextViewPart::Link, |s| s.text_color(theme().primary)),
    );
}
```

### Markdown plugins

`MarkdownPlugin` は Rust で Markdown 構文を読み取ります。パーサーが読み取る前に、構文木の各ノード(markdown-rs の `mdast`)を受け取り、独自のブロックまたはインラインコンテンツ(通常は `CustomNode`)を返します。生成したカスタムノードを表示することもできます。ビューは、その下のすべての `TextView` にプラグインを提供します。

```rust
use nsh_base::text_view::{mdast, CustomNode, Inline, MarkdownPlugin, MarkdownPlugins, ParseContext};
use nsh_core::prelude::*;

struct Tickers;

impl MarkdownPlugin for Tickers {
    fn name(&self) -> &str {
        "tickers"
    }

    /// `$AAPL` in inline code becomes a ticker node.
    fn inline(&self, node: &mdast::Node, _cx: &mut ParseContext<'_>) -> Option<Inline> {
        let mdast::Node::InlineCode(code) = node else { return None };
        let symbol = code.value.strip_prefix('$')?;
        Some(Inline::Custom(CustomNode::new("ticker").with_text(symbol)))
    }

    fn render(&self, node: &CustomNode) -> Option<AnyElement> {
        (node.name == "ticker").then(|| text(node.text.clone()).font_weight(FontWeight::BOLD).into_element())
    }
}

fn chat() -> impl IntoElement {
    provide_context(MarkdownPlugins::new().with(Tickers));
    view().child(messages())
}
```

プラグインの `render` が最初に、次に `renderCustom`、その後にノードの内容が来ます。`configure` は markdown-rs の構文をさらに有効にし、`ParseContext` はパーサーと同じ方法でノードの子を読み取ります。

## Props

| プロップ | Rust | 型 | デフォルト | 説明 |
|---|---|---|---|---|
| `markdown` | `.markdown(..)` | `string` | | Markdown としてのドキュメント。 |
| `html` | `.html(..)` | `string` | | `markdown` が指定されていない場合の、HTML としてのドキュメント。 |
| `document` | `.document(..)` | `TextViewDocument` | | `markdown` も `html` も指定されていない場合の、ブロックとしてのドキュメント。 |
| `options` | `.options(..)` | `MarkdownOptions` | すべてデフォルト | 読み取る Markdown 構文([Options](#options))。 |
| `extensions` | `.extensions(..)` | `MarkdownExtension[]` | `[]` | アプリ独自の構文(カスタムノードとして)([Markdown extensions](#markdown-extensions))。 |
| `classes` | `.classes(..)` | `TextViewClasses` | `{}` | パーツごとの Tailwind クラス。 |
| `styles` | `.styles(..)` | `TextViewStyles` | `{}` | パーツごとのインラインスタイル(それぞれ `StyleProp<TextStyle>`)。クラスより優先されます。 |
| `selectable` | `.selectable(..)` | `boolean` | `false` | ドキュメント全体を 1 つとして選択できます。選択範囲は段落、見出し、セル、コードブロックをまたぎます([Text selection](./text-selection.md))。 |
| `links` | `.links(..)` | `"report" \| "open"` | `"report"` | リンクを押したときの動作: それを通知し(`onLinkPress`)、`"open"` の場合は、他のサイトやアプリへのリンクをアプリの外で開きます([Links](#links))。 |
| `codeBlockScrollbar` | `.code_block_scrollbar(..)` | `boolean` | `true` | コードブロックに横スクロールインジケーターを表示します。 |
| `tableScrollbar` | `.table_scrollbar(..)` | `boolean` | `true` | テーブルに横スクロールインジケーターを表示します。 |
| `streamingCaret` | `.streaming_caret(..)` | `JSX.Element` | | ドキュメントの末尾に表示されます。最後のテキストの後にインラインで、そうでなければ独立した行に表示されます。 |
| `renderCustom` | `.render_custom(\|node\| ..)` | `(node: TextViewCustomNode) => JSX.Element` | | カスタムノードを表示します。 |
| `renderCodeBlock` | `.render_code_block(\|code\| ..)` | `(code: TextViewCodeBlock) => JSX.Element` | | コードブロックを表示します。 |
| `codeBlockActions` | `.code_block_actions(..)` | `TextViewCodeAction[]` | `[]` | 各コードブロックの右上に表示されるアクション: `{ id: "copy" }` は組み込み、それ以外はアプリ独自のものです。 |
| `renderCodeBlockAction` | `.render_code_block_action(\|action\| ..)` | `(action: TextViewCodeAction) => JSX.Element` | | アプリ独自のアクションのアイコン。 |
| `renderTableActions` | `.render_table_actions(\|table\| ..)` | `(table: TextViewTable) => JSX.Element` | | 各テーブルの上に表示するコンテンツ。 |
| `renderMath` | `.render_math(\|math\| ..)` | `(math: TextViewMath) => JSX.Element` | | 数式を表示します。 |
| `renderImage` | `.render_image(\|image\| ..)` | `(image: TextViewImage) => JSX.Element` | | 画像を表示します。 |
| `class`、`style` | スタイルメソッド | `string`、`StyleProp<ViewStyle>` | | ルート、およびブロックの列。そのテキストスタイルはすべてのパーツに渡されます(型付きテキストスタイル: `styles.root`)。 |

Rust では、パーツごとのクラスとスタイルは `TextViewClasses` と `TextViewStyles` です。Rust のビューでは通常、[`TextViewParts`](#typed-part-styles)でパーツをスタイリングします。

## Events

| イベント | Rust | 説明 |
|---|---|---|
| `onLinkPress` | `.on_link_press(\|event: &TextViewLinkPressEvent\| ..)` | リンクが押されました: `{ url }`: その URL、見出しの場合は `#anchor`、脚注の場合は `#footnote-<label>`。 |
| `onCodeBlockAction` | `.on_code_block_action(\|event: &TextViewCodeActionEvent\| ..)` | コードブロックのアクションが押されました(`copy` がコピーした後)。 |
| `onImagePress` | `.on_image_press(\|image: &Image\| ..)` | リンクに含まれない画像が押されました: `{ image }`。アプリが画像を拡大表示するためのものです(アプリ独自のズーム可能なビューア)。 |

## Accessibility

スクリーンリーダーは、ドキュメントを順番に、テキストごとに読み上げます。`TextView` は構造にロールを与えます。見出しはヘッダー、リンクはリンク(そのタイトルがヒント)、タスクマーカーはチェック状態を持つチェックボックス、ディスクロージャーのサマリーは展開されているかどうかを伝えるボタン、画像は alt テキストで読み上げられます。

## Related

- [Text](./text.md): `TextView` のすべてのテキストを構成する要素で、スパン、リンク、インラインアタッチメント、選択を備えます。
- [Text selection](./text-selection.md): 複数の `TextView` とテキストにまたがる 1 つの選択。
- [`nsh/base`](../modules/nsh-base.md): その他の基本コンポーネント。
- [Styling](../docs/styling.md) と [Tailwind](../docs/tailwind.md)。
