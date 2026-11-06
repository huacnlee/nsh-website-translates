---
title: "TextView"
description: "TextView 元件:以原生文字與檢視呈現 Markdown、HTML 或區塊文件,並可逐段設定樣式,適用於 AI 聊天回覆、文章與說明頁面。"
group: base
demo: text-view
source_hash: d73c7be1682f9cf4
---

# TextView

`TextView` 可顯示以 Markdown、HTML 撰寫的文件，或由應用程式建構的區塊：標題、段落、強調、連結、清單與任務清單、引用與 GitHub 的 alerts、程式碼、表格、圖片、公式、註腳與摺疊區塊。它是為聊天中 AI 模型的回覆而設計：回覆以 Markdown 串流傳入，每個片段都會連同格式一併顯示文字。解析在 Rust 中進行，文件則以 [`Text`](./text.md) 元素與 view 繪製。

它自帶行為，並附有專屬的閱讀排版：15pt 文字搭配寬鬆的 25.5pt 行高、上方留有空間的半粗體標題、以佈景主題的 `primary` 顏色加底線的連結、以佈景主題的 `font-mono` 顯示於有邊框圓角方框中的程式碼、四周皆有框線且表頭列帶有底色的表格、側邊帶有一條線的引用，以及帶有圖示、採用 GitHub alert 顏色的底色方框 alerts。其顏色為佈景主題的 token（`foreground`、`muted-foreground`、`border`、`muted`、`primary`，以及用於注意事項的 `destructive`），因此佈景主題與深色外觀都會套用到它。每個部分都會在這些預設值之上採用應用程式的樣式：TSX 中為 `classes` 與 `styles`，Rust 中為依部分區分的型別樣式（`TextViewParts`）。Rust 以 `nsh_base::text_view()` 建立，TSX 則以來自 `nsh/base` 的 `<TextView>` 建立。

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

在 Rust 中，`text_view()` 的建立方式如同 `view()` 建立 view：每個 prop 一個 setter（`.markdown(..)`、`.options(..)`、`.selectable(..)`）、每個渲染函式一個 closure（`.render_image(|image| ..)`）、每個事件一個 listener（`.on_link_press(..)`），以及用於其根節點的型別樣式方法（`.p_5()`、`.text_color(..)`），其文字樣式會傳遞給每個部分。

<a id="built-on-text"></a>

## 建立在 Text 之上

`TextView` 由 [`Text`](./text.md) 元素組成，其文字的行為完全如 Text 頁面所述。每個段落、標題、表格儲存格與程式碼區塊都是一個原生的 `Text`：一個負責排版、換行、跟隨字級縮放的區塊，並且在搭配 `selectable` 時可選取與複製。粗體、斜體、刪除線與其他行內標記是它的 [span](./text.md#spans)；行內程式碼是帶有 [span 背景](./text.md#span-backgrounds) 的 span，因此 `code: "rounded bg-neutral-100"` 會為它加上圓角背景；連結是 [可按壓的 span](./text.md#links)；圖片與行內自訂節點是 [行內附件](./text.md#inline-views-and-images)。根節點上的文字樣式會傳遞給每個部分，就如同 [文字樣式](./text.md#text-styles) 從 `Text` 傳遞給其 span。

搭配 `selectable` 時，整份文件如同網頁一樣可作為一個整體選取：拖曳（在觸控螢幕上則是長按並使用控點）可從一個段落、清單項目、儲存格或程式碼區塊延伸到下一個，「複製」會取得它們全部的文字。`selectable` `TextView` 會自成一個選取範圍；在 [可選取的 view](./text-selection.md) 內，其選取範圍也會延伸到周圍的文字與其他 `TextView`。

`TextView` 所增添的是其餘部分：將 Markdown、HTML 或文件讀入為區塊、文字周圍的 view（清單、引用、表格、程式碼區塊、摺疊區塊、註腳）、串流、依部分區分的樣式、渲染函式與擴充功能。

<a id="the-document"></a>

## 文件

內容為三個 prop 之一，依此順序讀取：

- **`markdown`**：CommonMark 加上 GitHub 的擴充（表格、任務清單、刪除線、自動連結、註腳、alerts）、公式（`$…$` 與 `$$…$$`），以及 Markdown 中的 HTML。
- **`html`**：如閱讀器所顯示的 HTML。文字、結構與行內格式會保留；指令碼、樣式、表單控制項與隱藏元素則不會出現。片段或整個頁面皆可（頁面會顯示其 body）。
- **`document`**：由應用程式建構或保存的區塊：TSX 中為一般物件，Rust 中為 `nsh_base::text_view::Document`（[文件模型](#the-document-model)）。

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

`TextView` 會隨內容成長。長文件請將它放入 [`Scroll`](./scroll.md)（或 [`List`](./list.md) 的一列）。

<a id="styling-the-parts"></a>

## 為各部分設定樣式

`class` 與 `style` 為根節點設定樣式，根節點是由各區塊組成的一欄；在此設定的文字樣式（顏色、大小、字型）會傳遞給每個部分。根節點同時也是 `root` 這個部分：`styles.root` 接受帶有型別的文字樣式（`style` 的型別與 view 相同），`classes.root` 接受 class。`classes` 依部分接受 Tailwind class，`styles` 依部分接受行內樣式。部分的 class 排在其預設樣式之後，因此會優先；其 `styles` 又優先於其 class。在 Rust 中，各部分接受型別樣式：`TextViewParts` 為每個 `TextViewPart` 提供一個調整其樣式的函式，作用於提供它的 view 之下的每個 `TextView`（[型別部分樣式](#typed-part-styles)），根節點則接受樣式方法。預設值中的行高以 point 為單位設定：更改部分大小的 class 也會一併設定其行高（Tailwind 的 `text-*` class 即是如此）。

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

有些節點由數個部分組成，並依序套用：2 級標題為 `heading` 接著 `heading2`；alert 為 `blockquote`、`alert`，然後是其種類（`alertNote`，...）；任務標記為 `listMarker`、`taskMarker`，完成時再加上 `taskMarkerChecked`；表頭列為 `tableRow` 接著 `tableHead`，其儲存格為 `tableCell` 接著 `tableHeaderCell`。

| 部分 | Rust | 說明 |
|---|---|---|
| `root` | `Root` | 文字 view 本身，由其區塊組成的一欄；此處的文字樣式會傳遞給每個部分。 |
| `paragraph` | `Paragraph` | 每個段落。 |
| `heading` | `Heading` | 每個標題，排在其級別的部分之前。 |
| `heading1` … `heading6` | `Heading1` … `Heading6` | 該級別的標題（27、20、17，其後為 15pt，半粗體）。 |
| `blockquote` | `Blockquote` | 引用與 alerts：由其區塊組成的一欄，側邊帶有一條線。 |
| `alert` | `Alert` | 每個 alert（`> [!NOTE]`），排在 `blockquote` 之後：帶底色的方框，由其圖示與區塊組成的一列。 |
| `alertNote`、`alertTip`、`alertImportant`、`alertWarning`、`alertCaution` | `AlertNote`、`AlertTip`、`AlertImportant`、`AlertWarning`、`AlertCaution` | 該種類的 alerts。 |
| `alertIcon` | `AlertIcon` | alert 的圖示：一個圓環，內有採用 alert 顏色的圖形符號。 |
| `list` | `List` | 每個清單：由其項目組成的一欄。 |
| `orderedList`、`unorderedList` | `OrderedList`、`UnorderedList` | 編號清單與項目符號清單，排在 `list` 之後。 |
| `listItem` | `ListItem` | 每個項目：由其標記與區塊組成的一列。 |
| `listMarker` | `ListMarker` | 項目的標記（依深度為 `•`、`◦`、`▪`，或 `1.`），在項目前的縮排中靠右對齊。 |
| `taskMarker` | `TaskMarker` | 任務項目的標記：以 view 繪製的方框，完成時填入 `✓`；排在 `listMarker` 之後。 |
| `taskMarkerChecked` | `TaskMarkerChecked` | 已完成任務項目的標記，排在 `taskMarker` 之後。 |
| `listItemContent` | `ListItemContent` | 項目的區塊所在的一欄。 |
| `codeBlock` | `CodeBlock` | 程式碼區塊：有邊框的圓角方框，內含程式碼，上方為標頭。 |
| `codeBlockHeader` | `CodeBlockHeader` | 程式碼區塊的動作列（`codeBlockActions`），浮在其右上角之上。 |
| `codeBlockScroll` | `CodeBlockScroll` | 包住程式碼區塊之程式碼的水平捲動 view。 |
| `codeBlockCode` | `CodeBlockCode` | 程式碼區塊的程式碼（等寬字型，照原樣顯示）。 |
| `code` | `Code` | 文字中的程式碼（等寬字型，圓角背景）。 |
| `keyboard` | `Keyboard` | 按鍵（`<kbd>`，視為程式碼）。 |
| `strong` | `Strong` | 粗體文字（半粗體）。 |
| `emphasis` | `Emphasis` | 強調文字（斜體）。 |
| `strikethrough` | `Strikethrough` | 刪除線文字。 |
| `underline` | `Underline` | 加底線文字（`<u>`、`<ins>`）。 |
| `highlight` | `Highlight` | 標示文字（`<mark>`，黃色圓角底）。 |
| `superscript`、`subscript` | `Superscript`、`Subscript` | 上標與下標（較小）。 |
| `link` | `Link` | 連結（佈景主題的 `primary` 顏色，加底線）。 |
| `image` | `Image` | 圖片。 |
| `math` | `Math` | 文字中的公式，在沒有 `renderMath` 時由內建排版呈現。 |
| `mathBlock` | `MathBlock` | 公式區塊，在沒有 `renderMath` 時排版並置中。 |
| `table` | `Table` | 表格：`renderTableActions` 的內容，然後是儲存格的捲動 view。 |
| `tableScroll` | `TableScroll` | 表格儲存格的水平捲動 view：空間足夠時各欄貼合其內容，view 較窄時換行縮減至下限，超過後表格才會捲動。 |
| `tableRow` | `TableRow` | 表格的每一列：位於其儲存格後方的 view，用於背景與邊框（文字樣式請設於 `tableCell`）。 |
| `tableHead` | `TableHead` | 表頭列，排在 `tableRow` 之後。 |
| `tableCell` | `TableCell` | 每個儲存格。 |
| `tableHeaderCell` | `TableHeaderCell` | 表頭列的儲存格（較小、淡化），排在 `tableCell` 之後。 |
| `rule` | `Rule` | 分隔線：以上邊框繪製的一條線。 |
| `details` | `Details` | 摺疊區塊（`<details>`）。 |
| `summary` | `Summary` | 摺疊區塊的摘要；按壓可開啟與關閉。 |
| `summaryMarker` | `SummaryMarker` | 摘要的標記（`▸`、`▾`）。 |
| `footnotes` | `Footnotes` | 位於各區塊之後的註腳：一欄。 |
| `footnote` | `Footnote` | 一則註腳：由其編號與區塊組成的一列。 |
| `footnoteLabel` | `FootnoteLabel` | 註腳的編號。 |
| `footnoteReference` | `FootnoteReference` | 文字中對註腳的參照（其編號，較小）。 |
| `custom` | `Custom` | 以其內容顯示的自訂節點（在沒有渲染函式顯示它們時）。 |

<a id="streaming-ai-replies"></a>

## 串流 AI 回覆

隨著回覆增長，以 `options={{ streaming: true }}`（Rust 中為 `MarkdownOptions { streaming: true, .. }`）傳入。仍在傳入的文字結尾常留有未閉合的語法（`**bold`、`` `code ``, `[a link](htt`, a table whose header just arrived)；串流會將其顯示為閉合後的樣子，因此讀者不會看到多餘的 `**` 或 `[`。區塊依位置保留：已完成的區塊保留其 view，只有正在撰寫的區塊會重新建立，因此長回覆的更新成本依然很低。

`streamingCaret` 會跟隨文件的結尾：若最後一個區塊的結尾可容納（段落、清單項目、程式碼區塊、表格的最後一個儲存格），就以行內方式置於最後一段文字的結尾，否則另起一行置於最後一個區塊之後（分隔線、渲染函式的內容）。回覆完成後請移除它。

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

插入符是應用程式自己的 view，因此可以透過 [`nsh` 的動畫 API](../modules/nsh.md#animation) 閃爍或脈動，新區塊也可以用應用程式的動畫淡入。

<a id="links"></a>

## 連結

連結是 [可按壓的 span](./text.md#links)。按壓連結時會以 `{ url }` 呼叫 `onLinkPress`；要開啟什麼由應用程式決定（自己的頁面、[`WebView`](./web-view.md)、捲動到某個標題）。標題具有錨點（GitHub 風格：`## Getting started` 為 `#getting-started`），因此指向 `#getting-started` 的連結會以該字串傳入，註腳參照則以 `#footnote-<label>` 傳入。

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

`scroll_to_anchor` 與 `open_web`（TSX 中為 `scrollToAnchor` 與 `nav`）代表應用程式自己的函式。

設為 `links="open"` 時，按壓指向其他網站或應用程式的連結（帶有 scheme 的 URL：`https:`、`mailto:`，...），在 `onLinkPress` 回報之後，也會依應用程式的 `openUrl` 權限，以 [`openUrl`](../modules/nsh.md#openurl) 在應用程式外開啟；文件中的錨點（`#…`）則只回報。預設值 `"report"` 不會開啟任何東西。

```rust tabs
use nsh_base::{TextViewLinks, text_view};

text_view().markdown(doc).links(TextViewLinks::Open)
```

```tsx tabs
<TextView markdown={doc} links="open" />
```

<a id="render-functions"></a>

## 渲染函式

渲染函式將應用程式自己的內容放入文件。每個渲染函式接收一個部分的值並回傳其內容（TSX 中為 JSX，Rust 中為 element）；只要值不變，部分就會保留為它渲染的結果，因此串流期間只有正在撰寫的部分會重新渲染。

| Prop | Rust | 值 | 取代或新增 |
|---|---|---|---|
| `renderCodeBlock` | `.render_code_block(\|code\| ..)` | `TextViewCodeBlock`（`CodeBlock`） | 取代程式碼區塊（自行提供的語法醒目提示）。 |
| `renderCodeBlockAction` | `.render_code_block_action(\|action\| ..)` | `TextViewCodeAction` | 應用程式自訂之程式碼區塊動作（`codeBlockActions`）的圖示；其外的按鈕屬於 `TextView`。 |
| `renderTableActions` | `.render_table_actions(\|table\| ..)` | `TextViewTable`（`Table`） | 在表格上方新增內容（複製、匯出）。 |
| `renderMath` | `.render_math(\|math\| ..)` | `TextViewMath` | 取代公式：`{ tex, display }`，若為 `$$…$$` 區塊則為 `display`。 |
| `renderImage` | `.render_image(\|image\| ..)` | `TextViewImage`（`Image`） | 取代圖片（`{ src, alt, title }`）：自行處理載入、尺寸，以及按壓時的檢視器。 |
| `renderCustom` | `.render_custom(\|node\| ..)` | `TextViewCustomNode`（`CustomNode`） | 依自訂節點的 `name` 顯示該節點（[Markdown 擴充功能](#markdown-extensions)）。 |

程式碼區塊的右上角帶有動作，繪製方式一致：ghost 按鈕，背景僅在懸停或按下時顯示；在桌面上指標位於區塊上方時才顯示，在觸控螢幕上則一律顯示。`copy` 為內建：它會複製程式碼，並短暫顯示打勾圖示。其他動作由應用程式提供：`renderCodeBlockAction` 繪製其圖示，`onCodeBlockAction` 回報其按壓（內建的 `copy` 也是，在複製之後）。`copy` 如同 `Clipboard` 一樣寫入剪貼簿，因此需要應用程式的 `clipboard` 權限（`nsh.json`）。

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

程式碼區塊開箱即有語法醒目提示：對於圍欄上指定的語言（`ts`、`tsx`、`rust`、`python`、`bash`、`json`、`toml`、`yaml`、`diff` 以及另外約兩百種），程式碼會以 Allsum 的程式碼調色盤顯示，並隨外觀呈淺色或深色；沒有指定語言的區塊則以純文字顯示。擁有自己醒目提示的應用程式，可用 `renderCodeBlock` 顯示其程式碼，來源可以是自己的元件，或其 Rust crate 之一；Rust view 則以 [`CodeHighlighter`](#syntax-highlighting) 為 `TextView` 提供其醒目提示器。以下是使用應用程式自有醒目提示的程式碼，以及填滿寬度的圖片：

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

`Highlighted` 與 `MathView`（Rust 中為 `highlighted` 與 `math_view`）代表應用程式自己的元件（醒目提示器、公式渲染器，或其 Rust crate 的元件）。沒有 `renderMath` 時，`TextView` 會自行排版公式（`math` 與 `mathBlock` 部分），使用 KaTeX 的 TeX 支援與字型，以文字的顏色呈現，各平台一致；無法讀取的 TeX 則以等寬字型顯示其原始碼。
<a id="markdown-extensions"></a>

## Markdown 擴充功能

`extensions` 會將應用程式自己的語法轉換為自訂節點，並由 `renderCustom` 顯示。每個擴充功能都有一個 `name`（它所建立節點的 `name`），以及以下四種語法之一：

| 種類 | Rust | 比對對象 | 節點 |
|---|---|---|---|
| `pattern` | `MarkdownExtension::pattern(name, regex)` | 文字中的規則運算式（Rust 的 `regex` 語法），不含程式碼與連結 | 行內節點；`text` 是比對結果，`attributes` 是其群組：`"1"`、`"2"`、…，具名群組則以名稱表示 |
| `language` | `MarkdownExtension::language(name, language)` | 該語言的圍欄程式碼區塊（```` ```chart ````) | A block; `text` is the code, `attributes.meta` 為資訊字串的其餘部分 |
| `tag` | `MarkdownExtension::tag(name, tag)` | 該標籤的 HTML 或 MDX 元素，不分大小寫（`<Callout kind="tip">`） | 其屬性，以及解析後的內容：獨立成行的元素使用 `children`（區塊），位於文字中則使用 `content`（行內） |
| `container` | `MarkdownExtension::container(name, container)` | 容器 `:::name` … `:::` | 內含 Markdown 的區塊（`children`）；`:::note[Heads up]` 提供 `attributes.label`，`{key=value}` 為其他屬性 |

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

`BarChart`（Rust 中為 `bar_chart`）代表應用程式自己的圖表。mention 模式的群組位於 `node.attributes?.["1"]`（Rust 中為 `node.attributes["1"]`：`ada`），完整的比對結果位於 `node.text`（`@ada`）。沒有 render 函式的自訂節點會直接顯示其內容。行內節點（例如 chip）所回傳的視圖，會依其自身的 `verticalAlign` 放在所在行中：`align-middle`（`verticalAlign: "middle"`）會使其對齊文字中線，除非視圖較高，否則該行會維持段落的 `lineHeight`。

<a id="options"></a>

### 選項

`options` 用來選擇除了 CommonMark 與 GitHub 之外還要讀取的 Markdown 語法；在 Rust 中它是具有相同欄位的 `MarkdownOptions`（`MarkdownOptions { streaming: true, ..Default::default() }`）：

| 鍵 | 類型 | 預設值 | 說明 |
|---|---|---|---|
| `math` | `boolean` | `true` | 公式：文字中使用 `$…$`，區塊使用 `$$…$$`。 |
| `html` | `boolean` | `true` | Markdown 中的 HTML 會依 `html` prop 的方式讀取；`false` 則將其顯示為文字。 |
| `alerts` | `boolean` | `true` | GitHub 的警示：`> [!NOTE]`、`[!TIP]`、`[!IMPORTANT]`、`[!WARNING]`、`[!CAUTION]`。 |
| `frontmatter` | `boolean` | `false` | YAML front matter（開頭為 `---` … `---`）會成為自訂節點 `frontmatter`，其 `text` 為該 YAML。 |
| `mdx` | `boolean` | `false` | MDX：JSX 元素會成為以其標籤命名的自訂節點，`{expressions}` 自訂節點 `expression`；此時原始 HTML 會被當作文字讀取。 |
| `streaming` | `boolean` | `false` | 文字仍在持續傳入：結尾處尚未閉合的語法會被當作已閉合來顯示。 |

<a id="the-document-model"></a>

## 文件模型

`document` prop 與 render 函式的值都是純物件，每個節點以其 `type` 標記。型別來自 `nsh/base`：`TextViewDocument`、`TextViewBlock`、`TextViewInline`、`TextViewCodeBlock`、`TextViewTable`、`TextViewListItem`、`TextViewImage`、`TextViewFootnote`、`TextViewAlert` 與 `TextViewCustomNode`。在 Rust 中，它們是 `nsh_base::text_view` 的型別（`Document`、`Block`、`Inline`、`CodeBlock`、`Table`、`ListItem`、`Image`、`Footnote`、`Alert`、`CustomNode`）：`Block` 與 `Inline` 是列舉，其變體為下列型別的 PascalCase 形式（`Block::Heading { level, content, anchor }`、`Inline::Strong { content }`），欄位相同，但使用 snake case。

| 區塊 `type` | 欄位 |
|---|---|
| `paragraph` | `content` |
| `heading` | `level`（1–6）、`content`、`anchor?` |
| `blockquote` | `children`、`alert?`（`"note"`、`"tip"`、`"important"`、`"warning"`、`"caution"`） |
| `list` | `ordered?`、`start?`、`loose?`、`items`（`{ checked?, children }`） |
| `codeBlock` | `language?`、`meta?`、`code` |
| `math` | `tex` |
| `table` | `align?`（每欄的 `"none"`、`"left"`、`"center"`、`"right"`）、`head`（儲存格）、`rows?`（儲存格的列）；儲存格為 `{ content }` |
| `rule` | |
| `details` | `open?`、`summary`（行內）、`children` |
| `custom` | `name`、`attributes?`、`text?`、`data?`、`children?`、`content?` |

| 行內 `type` | 欄位 |
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
| `custom` | 同區塊 |

文件還有 `footnotes?`：`{ label, index, children }`，會依首次被引用的順序顯示在區塊之後。應用程式可以將回覆儲存為文件、以自己的資料建構文件，或混入由 `renderCustom` 顯示的自訂節點。

<a id="parsing-and-plain-text"></a>

### 解析與純文字

`TextView` 也能以同步方式讀取文件而不顯示它們：

| 函式 | Rust | 回傳值 |
|---|---|---|
| `TextView.parse(markdown, options?, extensions?)` | `TextView::parse(markdown, options, extensions)` | `markdown` prop 會顯示的 `TextViewDocument`。 |
| `TextView.parseHtml(html, extensions?)` | `TextView::parse_html(html, extensions)` | `html` prop 會顯示的 `TextViewDocument`。 |
| `TextView.plainText(document)` | `TextView::plain_text(document)`、`Document::plain_text()` | 不含標記的文件文字：區塊之間以空行分隔，清單項目與表格列以換行分隔，儲存格以 Tab 分隔。 |

整則回覆的複製按鈕：

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

應用程式也可以只解析一次並保存文件（`document={doc}`），或在顯示之前修改它。

<a id="in-rust"></a>

## 在 Rust 中

Rust 視圖使用來自 `nsh-base` crate 的相同元件，上述範例也都有對應的 Rust 分頁。有三項功能是 Rust 獨有的：應用程式的語法醒目提示器、依部件設定的具型別樣式，以及 Markdown 外掛，它們都透過 `provide_context` 提供給視圖下方的每個 `TextView`。文件型別位於 `nsh_base::text_view` 之下，`Parser` 也能搭配外掛讀取文件（`Parser::new().plugin(..).markdown(source)`）。

<a id="syntax-highlighting"></a>

### 語法醒目提示

`TextView` 使用 syntect，以 Allsum 的程式碼調色盤醒目提示程式碼（`nsh-base` 的功能 `highlight`，預設開啟）；大型區塊會先以純文字立即顯示，待背景執行緒完成醒目提示後再套用顏色。`CodeHighlighter` 是應用程式自己的醒目提示器，用來取代預設者，並透過 `provide_context` 提供給視圖下方的每個 `TextView`。它會接收每個程式碼區塊，並回傳其程式碼中各位元組範圍的樣式（依順序、互不重疊；未涵蓋的部分為純文字）；`TextView` 會將程式碼以套用這些樣式的 span 顯示，並放在原有的程式碼區塊內（標頭、動作、捲動視圖、部件）。醒目提示器可以是任何能將程式碼轉為帶樣式範圍的東西：`tree-sitter`、搭配應用程式自訂主題的 syntect，等等。

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

`my_syntect::ranges` 代表應用程式與其醒目提示器之間的銜接程式碼，`messages` 代表應用程式的聊天視圖。若有提供 `renderCodeBlock`，則會以它取代上述所有內容來顯示程式碼區塊。

<a id="typed-part-styles"></a>

### 具型別的部件樣式

`TextViewParts` 以具型別的樣式取代 class 字串來設定部件樣式，適用於 Rust 視圖：每個 `TextViewPart`（對應[上方表格](#styling-the-parts)中的每個部件）都會取得一個用來調整其 `StyleRefinement` 的函式。透過 `provide_context` 提供後，它們會套用於下方的每個 `TextView`，並先於其 `classes` 與 `styles`；其中讀取的主題顏色會隨淺色與深色外觀變化。

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

<a id="markdown-plugins"></a>

### Markdown 外掛

`MarkdownPlugin` 在 Rust 中讀取 Markdown 語法：它會在解析器讀取之前取得語法樹的每個節點（markdown-rs 的 `mdast`），並回傳自己的區塊或行內內容，通常是 `CustomNode`；它也可以顯示自己建立的自訂節點。視圖會將外掛提供給其下方的每個 `TextView`：

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

外掛的 `render` 最先，其次是 `renderCustom`，然後是節點的內容。`configure` 會啟用更多 markdown-rs 的語法，`ParseContext` 則以解析器的方式讀取節點的子節點。

## Props

| Prop | Rust | 類型 | 預設值 | 說明 |
|---|---|---|---|---|
| `markdown` | `.markdown(..)` | `string` | | 以 Markdown 表示的文件。 |
| `html` | `.html(..)` | `string` | | 以 HTML 表示的文件，在未提供 `markdown` 時使用。 |
| `document` | `.document(..)` | `TextViewDocument` | | 以區塊表示的文件，在 `markdown` 與 `html` 皆未提供時使用。 |
| `options` | `.options(..)` | `MarkdownOptions` | 全部預設值 | 要讀取的 Markdown 語法（[選項](#options)）。 |
| `extensions` | `.extensions(..)` | `MarkdownExtension[]` | `[]` | 應用程式自己的語法，以自訂節點表示（[Markdown 擴充功能](#markdown-extensions)）。 |
| `classes` | `.classes(..)` | `TextViewClasses` | `{}` | 依部件設定的 Tailwind class。 |
| `styles` | `.styles(..)` | `TextViewStyles` | `{}` | 依部件設定的行內樣式（每個為 `StyleProp<TextStyle>`），優先於 class。 |
| `selectable` | `.selectable(..)` | `boolean` | `false` | 文件可作為一個整體選取：選取範圍可跨越其段落、標題、儲存格與程式碼區塊（[文字選取](./text-selection.md)）。 |
| `links` | `.links(..)` | `"report" \| "open"` | `"report"` | 按下連結時的行為：回報該事件（`onLinkPress`），搭配 `"open"` 時還會在應用程式之外開啟指向其他網站或應用程式的連結（[連結](#links)）。 |
| `codeBlockScrollbar` | `.code_block_scrollbar(..)` | `boolean` | `true` | 程式碼區塊顯示其水平捲動指示器。 |
| `tableScrollbar` | `.table_scrollbar(..)` | `boolean` | `true` | 表格顯示其水平捲動指示器。 |
| `streamingCaret` | `.streaming_caret(..)` | `JSX.Element` | | 顯示於文件末端：優先以行內方式接在最後一段文字之後，否則獨立成行。 |
| `renderCustom` | `.render_custom(\|node\| ..)` | `(node: TextViewCustomNode) => JSX.Element` | | 顯示自訂節點。 |
| `renderCodeBlock` | `.render_code_block(\|code\| ..)` | `(code: TextViewCodeBlock) => JSX.Element` | | 顯示程式碼區塊。 |
| `codeBlockActions` | `.code_block_actions(..)` | `TextViewCodeAction[]` | `[]` | 位於每個程式碼區塊右上角的動作：`{ id: "copy" }` 為內建，其他由應用程式提供。 |
| `renderCodeBlockAction` | `.render_code_block_action(\|action\| ..)` | `(action: TextViewCodeAction) => JSX.Element` | | 應用程式自訂動作的圖示。 |
| `renderTableActions` | `.render_table_actions(\|table\| ..)` | `(table: TextViewTable) => JSX.Element` | | 每個表格上方的內容。 |
| `renderMath` | `.render_math(\|math\| ..)` | `(math: TextViewMath) => JSX.Element` | | 顯示公式。 |
| `renderImage` | `.render_image(\|image\| ..)` | `(image: TextViewImage) => JSX.Element` | | 顯示圖片。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | | 根節點，以及區塊的一欄；其文字樣式會傳遞給每個部件（具型別的文字樣式：`styles.root`）。 |

在 Rust 中，依部件設定的 class 與樣式為 `TextViewClasses` 與 `TextViewStyles`；Rust 視圖通常以 [`TextViewParts`](#typed-part-styles) 來設定部件樣式。

<a id="events"></a>

## 事件

| 事件 | Rust | 說明 |
|---|---|---|
| `onLinkPress` | `.on_link_press(\|event: &TextViewLinkPressEvent\| ..)` | 連結被按下：`{ url }`：其 URL，標題為 `#anchor`，註腳為 `#footnote-<label>`。 |
| `onCodeBlockAction` | `.on_code_block_action(\|event: &TextViewCodeActionEvent\| ..)` | 程式碼區塊的動作被按下（在 `copy` 複製之後）。 |
| `onImagePress` | `.on_image_press(\|image: &Image\| ..)` | 不在連結中的圖片被按下：`{ image }`，供應用程式以較大尺寸顯示（應用程式自己的可縮放檢視器）。 |

<a id="accessibility"></a>

## 無障礙

螢幕閱讀器會依序逐段朗讀文件。`TextView` 為文件結構賦予角色：標題是 header，連結是 link（其 title 作為提示），任務標記是帶有勾選狀態的 checkbox，disclosure 的摘要是會說明是否已展開的按鈕，圖片則以其替代文字朗讀。

<a id="related"></a>

## 相關內容

- [Text](./text.md)：`TextView` 中每段文字所採用的元素，包含其 span、連結、行內附件與選取。
- [文字選取](./text-selection.md)：跨多個 `TextView` 與文字的單一選取。
- [`nsh/base`](../modules/nsh-base.md)：其他基礎元件。
- [Styling](../docs/styling.md) 與 [Tailwind](../docs/tailwind.md)。
