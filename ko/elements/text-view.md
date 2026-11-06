---
title: "TextView"
description: "TextView 컴포넌트: Markdown, HTML 또는 블록 문서를 네이티브 텍스트와 뷰로 표시하며, 부분별로 스타일을 지정할 수 있습니다. AI 채팅 응답, 문서, 도움말 페이지에 적합합니다."
group: base
demo: text-view
source_hash: d73c7be1682f9cf4
---

# TextView

`TextView`는 Markdown, HTML 또는 앱이 만든 블록으로 작성된 문서를 보여 줍니다. 제목, 문단, 강조, 링크, 목록과 작업 목록, 인용문과 GitHub의 알림(alert), 코드, 표, 이미지, 수식, 각주, 접이식 영역(disclosure)을 지원합니다. 채팅에서 AI 모델이 보내는 답변을 위해 만들어졌습니다. 답변이 Markdown으로 스트리밍되며, 각 청크는 서식이 적용된 텍스트를 바로 보여 줍니다. 파싱은 Rust에서 이루어지고, 문서는 [`Text`](./text.md) 요소와 뷰로 그려집니다.

동작을 직접 담당하며, 읽기에 맞춘 고유한 타이포그래피를 기본으로 제공합니다. 15pt 텍스트에 넉넉한 25.5pt 줄 높이, 위쪽 여백이 있는 세미볼드 제목, 테마의 `primary` 색상으로 밑줄 친 링크, 테마의 `font-mono`로 표시되고 테두리가 있는 둥근 상자 안의 코드, 사방에 괘선이 있고 머리글 행에 색조가 들어간 표, 옆에 선이 있는 인용문, GitHub 알림 색상의 아이콘이 있는 색조 상자 형태의 알림이 그것입니다. 색상은 테마의 토큰(`foreground`, `muted-foreground`, `border`, `muted`, `primary`, 주의를 나타내는 `destructive`)이므로 테마와 다크 모드가 그대로 반영됩니다. 각 파트는 이 기본값 위에 앱의 스타일을 적용받습니다. TSX에서는 `classes`와 `styles`를, Rust에서는 파트별 타입 스타일(`TextViewParts`)을 사용합니다. Rust에서는 `nsh_base::text_view()`로, TSX에서는 `nsh/base`의 `<TextView>`로 만듭니다.

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

Rust에서 `text_view()`는 `view()`가 뷰를 만드는 것과 같은 방식으로 만듭니다. prop마다 setter(`.markdown(..)`, `.options(..)`, `.selectable(..)`), 렌더 함수마다 클로저(`.render_image(|image| ..)`), 이벤트마다 리스너(`.on_link_press(..)`), 그리고 루트를 위한 타입 스타일 메서드(`.p_5()`, `.text_color(..)`)가 있으며, 이 중 텍스트 스타일은 모든 파트에 전달됩니다.

<a id="built-on-text"></a>

## Text 기반

`TextView`는 [`Text`](./text.md) 요소로 구성되며, 텍스트는 Text 페이지에서 설명하는 것과 똑같이 동작합니다. 모든 문단, 제목, 표 셀, 코드 블록은 각각 하나의 네이티브 `Text`입니다. 하나의 블록으로 레이아웃되고, 줄바꿈되며, 글꼴 배율을 따르고, `selectable`를 사용하면 선택하고 복사할 수 있습니다. 굵게, 기울임, 취소선 같은 인라인 표시는 [스팬](./text.md#spans)입니다. 인라인 코드는 [스팬 배경](./text.md#span-backgrounds)이 있는 스팬이므로 `code: "rounded bg-neutral-100"`가 둥근 배경을 줍니다. 링크는 [누를 수 있는 스팬](./text.md#links)이고, 이미지와 인라인 커스텀 노드는 [인라인 첨부](./text.md#inline-views-and-images)입니다. 루트의 텍스트 스타일은 [텍스트 스타일](./text.md#text-styles)이 `Text`에서 그 스팬으로 전달되는 것처럼 모든 파트에 전달됩니다.

`selectable`를 사용하면 웹 페이지처럼 문서 전체가 하나로 선택됩니다. 드래그(터치 화면에서는 길게 누른 뒤 핸들 사용)로 한 문단, 목록 항목, 셀, 코드 블록에서 다음 것으로 이어서 선택할 수 있고, 복사하면 선택된 모든 텍스트를 가져옵니다. `selectable` `TextView`는 자체적으로 하나로 선택됩니다. [선택 가능한 뷰](./text-selection.md) 안에서는 선택이 주변의 텍스트와 다른 `TextView`로도 이어집니다.

`TextView`가 더하는 것은 나머지 전부입니다. Markdown, HTML 또는 문서를 블록으로 읽는 일, 텍스트를 둘러싼 뷰(목록, 인용문, 표, 코드 블록, 접이식 영역, 각주), 스트리밍, 파트별 스타일, 렌더 함수, 확장입니다.

<a id="the-document"></a>

## 문서

콘텐츠는 다음 세 가지 prop 중 하나이며, 이 순서대로 읽습니다.

- **`markdown`**: GitHub 확장(표, 작업 목록, 취소선, 자동 링크, 각주, 알림)이 포함된 CommonMark, 수식(`$…$` 및 `$$…$$`), Markdown 안의 HTML.
- **`html`**: 리더가 표시하는 방식의 HTML. 텍스트, 구조, 인라인 서식은 반영되고, 스크립트, 스타일, 폼 컨트롤, 숨겨진 요소는 제외됩니다. 조각과 전체 페이지 모두 사용할 수 있습니다(페이지는 본문을 표시합니다).
- **`document`**: 앱이 만들거나 보관하는 블록. TSX에서는 일반 객체, Rust에서는 `nsh_base::text_view::Document`입니다([문서 모델](#the-document-model)).

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

`TextView`는 콘텐츠에 따라 커집니다. 긴 문서는 [`Scroll`](./scroll.md)에 넣거나 [`List`](./list.md)의 행으로 넣으세요.

<a id="styling-the-parts"></a>

## 파트 스타일링

`class`와 `style`는 블록의 열인 루트의 스타일을 지정하며, 여기에 설정한 텍스트 스타일(색상, 크기, 글꼴)은 모든 파트에 전달됩니다. 루트는 파트 `root`이기도 합니다. `styles.root`는 타입이 지정된 텍스트 스타일을 받고(`style`는 뷰의 스타일 타입입니다), `classes.root`는 클래스를 받습니다. `classes`는 파트별 Tailwind 클래스를, `styles`는 파트별 인라인 스타일을 받습니다. 파트의 클래스는 해당 파트의 기본 스타일 뒤에 적용되므로 기본 스타일보다 우선하며, 파트의 `styles`는 클래스보다 우선합니다. Rust에서는 파트가 타입 스타일을 받습니다. `TextViewParts`는 이를 제공하는 뷰 아래의 모든 `TextView`에 대해 각 `TextViewPart`에 스타일을 다듬는 함수를 지정합니다([타입 파트 스타일](#typed-part-styles)). 루트는 스타일 메서드를 받습니다. 기본값의 줄 높이는 포인트 단위로 설정되어 있으므로, 파트의 크기를 바꾸는 클래스는 줄 높이도 함께 설정해야 합니다(Tailwind의 `text-*` 클래스는 그렇게 합니다).

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

일부 노드는 여러 파트로 이루어지며, 파트는 순서대로 적용됩니다. 레벨 2 제목은 `heading` 다음에 `heading2`이고, 알림은 `blockquote`, `alert`, 그다음 종류(`alertNote`, ...)입니다. 작업 마커는 `listMarker`, `taskMarker`이며 완료되면 `taskMarkerChecked`가 더해집니다. 머리글 행은 `tableRow` 다음에 `tableHead`이고, 그 셀은 `tableCell` 다음에 `tableHeaderCell`입니다.

| 파트 | Rust | 설명 |
|---|---|---|
| `root` | `Root` | 텍스트 뷰 자체이며, 블록들의 열입니다. 여기의 텍스트 스타일은 모든 파트에 전달됩니다. |
| `paragraph` | `Paragraph` | 모든 문단. |
| `heading` | `Heading` | 모든 제목이며, 각 레벨의 파트보다 먼저 적용됩니다. |
| `heading1` … `heading6` | `Heading1` … `Heading6` | 해당 레벨의 제목(27, 20, 17, 이후 15pt, 세미볼드). |
| `blockquote` | `Blockquote` | 인용문과 알림. 옆에 선이 있는 블록들의 열입니다. |
| `alert` | `Alert` | 모든 알림(`> [!NOTE]`)이며 `blockquote` 뒤에 적용됩니다. 아이콘과 블록들이 한 행으로 배치된 색조 상자입니다. |
| `alertNote`, `alertTip`, `alertImportant`, `alertWarning`, `alertCaution` | `AlertNote`, `AlertTip`, `AlertImportant`, `AlertWarning`, `AlertCaution` | 해당 종류의 알림. |
| `alertIcon` | `AlertIcon` | 알림의 아이콘. 알림 색상의 기호가 들어 있는 링입니다. |
| `list` | `List` | 모든 목록. 항목들의 열입니다. |
| `orderedList`, `unorderedList` | `OrderedList`, `UnorderedList` | 번호 목록과 글머리 기호 목록이며 `list` 뒤에 적용됩니다. |
| `listItem` | `ListItem` | 모든 항목. 마커와 블록들의 행입니다. |
| `listMarker` | `ListMarker` | 항목의 마커(깊이에 따라 `•`, `◦`, `▪`, 또는 `1.`). 항목 앞의 들여쓰기 안에서 오른쪽 정렬됩니다. |
| `taskMarker` | `TaskMarker` | 작업 항목의 마커. 뷰로 그려진 상자이며, 완료되면 `✓`로 채워집니다. `listMarker` 뒤에 적용됩니다. |
| `taskMarkerChecked` | `TaskMarkerChecked` | 완료된 작업 항목의 마커이며 `taskMarker` 뒤에 적용됩니다. |
| `listItemContent` | `ListItemContent` | 항목의 블록들로 이루어진 열. |
| `codeBlock` | `CodeBlock` | 코드 블록. 코드를 담은 테두리 있는 둥근 상자이며, 위에 헤더가 있습니다. |
| `codeBlockHeader` | `CodeBlockHeader` | 코드 블록의 동작(`codeBlockActions`) 행. 오른쪽 위 모서리 위에 떠 있습니다. |
| `codeBlockScroll` | `CodeBlockScroll` | 코드 블록의 코드를 감싸는 가로 스크롤 뷰. |
| `codeBlockCode` | `CodeBlockCode` | 코드 블록의 코드(고정폭, 작성된 그대로). |
| `code` | `Code` | 텍스트 안의 코드(고정폭, 둥근 배경). |
| `keyboard` | `Keyboard` | 키(`<kbd>`, 코드로 표시). |
| `strong` | `Strong` | 굵은 텍스트(세미볼드). |
| `emphasis` | `Emphasis` | 강조된 텍스트(기울임). |
| `strikethrough` | `Strikethrough` | 취소선 텍스트. |
| `underline` | `Underline` | 밑줄 텍스트(`<u>`, `<ins>`). |
| `highlight` | `Highlight` | 강조 표시된 텍스트(`<mark>`, 둥근 노란색 배경). |
| `superscript`, `subscript` | `Superscript`, `Subscript` | 위 첨자와 아래 첨자(더 작게). |
| `link` | `Link` | 링크(테마의 `primary` 색상, 밑줄). |
| `image` | `Image` | 이미지. |
| `math` | `Math` | 텍스트 안의 수식. `renderMath`이 없을 때 조판됩니다. |
| `mathBlock` | `MathBlock` | 수식 블록. `renderMath`이 없을 때 조판되어 가운데 정렬됩니다. |
| `table` | `Table` | 표. `renderTableActions`의 콘텐츠 다음에 셀의 스크롤 뷰가 옵니다. |
| `tableScroll` | `TableScroll` | 표 셀의 가로 스크롤 뷰. 공간이 충분하면 열이 콘텐츠에 맞춰지고, 뷰가 좁으면 최소 너비까지 줄바꿈되며, 그보다 좁아지면 표가 스크롤됩니다. |
| `tableRow` | `TableRow` | 표의 모든 행. 셀 뒤에 있는 뷰로, 배경과 테두리용입니다(텍스트 스타일은 `tableCell`에 지정합니다). |
| `tableHead` | `TableHead` | 머리글 행이며 `tableRow` 뒤에 적용됩니다. |
| `tableCell` | `TableCell` | 모든 셀. |
| `tableHeaderCell` | `TableHeaderCell` | 머리글 행의 셀(더 작고 흐리게)이며 `tableCell` 뒤에 적용됩니다. |
| `rule` | `Rule` | 주제 구분선. 위쪽 테두리로 그려진 선입니다. |
| `details` | `Details` | 접이식 영역(`<details>`). |
| `summary` | `Summary` | 접이식 영역의 요약. 누르면 열리고 닫힙니다. |
| `summaryMarker` | `SummaryMarker` | 요약의 마커(`▸`, `▾`). |
| `footnotes` | `Footnotes` | 블록 뒤에 오는 각주들의 열. |
| `footnote` | `Footnote` | 각주. 번호와 블록들의 행입니다. |
| `footnoteLabel` | `FootnoteLabel` | 각주의 번호. |
| `footnoteReference` | `FootnoteReference` | 텍스트 안의 각주 참조(번호, 더 작게). |
| `custom` | `Custom` | 콘텐츠로 표시되는 커스텀 노드(렌더 함수가 표시하지 않을 때). |

<a id="streaming-ai-replies"></a>

## AI 답변 스트리밍

답변이 늘어나는 대로 `options={{ streaming: true }}`(Rust에서는 `MarkdownOptions { streaming: true, .. }`)에 전달하세요. 아직 도착 중인 텍스트의 끝에는 구문이 열린 채로 남는 경우가 많습니다(`**bold`, `` `code ``, `[a link](htt`, a table whose header just arrived)). 스트리밍은 이를 닫혔을 때의 모습으로 보여 주므로, 사용자에게는 불필요한 `**`나 `[`가 보이지 않습니다. 블록은 위치로 유지됩니다. 완성된 블록은 뷰를 그대로 유지하고 작성 중인 블록만 다시 만들어지므로, 긴 답변도 적은 비용으로 갱신됩니다.

`streamingCaret`는 문서의 끝을 따라갑니다. 마지막 블록이 어디서 끝나든(문단, 목록 항목, 코드 블록, 표의 마지막 셀) 마지막 텍스트 끝에 인라인으로 붙고, 그렇지 않으면(구분선, 렌더 함수의 콘텐츠) 마지막 블록 뒤의 별도 줄에 놓입니다. 답변이 끝나면 제거하세요.

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

캐럿은 앱의 자체 뷰이므로 [`nsh`의 애니메이션 API](../modules/nsh.md#animation)로 깜박이거나 맥동하게 할 수 있고, 새 블록은 앱의 애니메이션으로 서서히 나타나게 할 수 있습니다.

<a id="links"></a>

## 링크

링크는 [누를 수 있는 스팬](./text.md#links)입니다. 링크를 누르면 `{ url }`와 함께 `onLinkPress`가 호출되며, 무엇을 열지는 앱이 결정합니다(앱 자체의 페이지, [`WebView`](./web-view.md), 제목으로의 스크롤). 제목에는 앵커가 있으며(GitHub 방식: `## Getting started`는 `#getting-started`), 따라서 `#getting-started`로 가는 링크는 그 문자열로 전달되고, 각주 참조는 `#footnote-<label>`로 전달됩니다.

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

`scroll_to_anchor`와 `open_web`(TSX에서는 `scrollToAnchor`와 `nav`)는 앱 자체의 함수를 나타냅니다.

`links="open"`를 사용하면, 다른 사이트나 앱으로 가는 링크(스킴이 있는 URL: `https:`, `mailto:`, ...)를 눌렀을 때 `onLinkPress`가 보고한 뒤 앱의 `openUrl` 권한으로 [`openUrl`](../modules/nsh.md#openurl)을 통해 앱 밖에서도 열립니다. 문서 안의 앵커(`#…`)는 보고만 됩니다. 기본값인 `"report"`는 아무것도 열지 않습니다.

```rust tabs
use nsh_base::{TextViewLinks, text_view};

text_view().markdown(doc).links(TextViewLinks::Open)
```

```tsx tabs
<TextView markdown={doc} links="open" />
```

<a id="render-functions"></a>

## 렌더 함수

렌더 함수는 앱 자체의 콘텐츠를 문서에 넣습니다. 각 함수는 파트의 값을 받아 그 콘텐츠(TSX에서는 JSX, Rust에서는 요소)를 반환합니다. 파트는 값이 같은 동안 렌더된 결과를 유지하므로, 스트리밍 중에는 작성 중인 파트만 다시 렌더됩니다.

| Prop | Rust | 값 | 대체 또는 추가 |
|---|---|---|---|
| `renderCodeBlock` | `.render_code_block(\|code\| ..)` | `TextViewCodeBlock` (`CodeBlock`) | 코드 블록을 대체합니다(직접 만든 구문 강조). |
| `renderCodeBlockAction` | `.render_code_block_action(\|action\| ..)` | `TextViewCodeAction` | 앱의 코드 블록 동작(`codeBlockActions`) 아이콘. 그 주변의 버튼은 `TextView`의 것입니다. |
| `renderTableActions` | `.render_table_actions(\|table\| ..)` | `TextViewTable` (`Table`) | 표 위에 콘텐츠를 추가합니다(복사, 내보내기). |
| `renderMath` | `.render_math(\|math\| ..)` | `TextViewMath` | 수식을 대체합니다. `$$…$$` 블록의 경우 `{ tex, display }`, `display`입니다. |
| `renderImage` | `.render_image(\|image\| ..)` | `TextViewImage` (`Image`) | 이미지(`{ src, alt, title }`)를 대체합니다. 직접 만든 로딩, 크기 조정, 누르면 열리는 뷰어 등. |
| `renderCustom` | `.render_custom(\|node\| ..)` | `TextViewCustomNode` (`CustomNode`) | 커스텀 노드를 `name`로 표시합니다([Markdown 확장](#markdown-extensions)). |

코드 블록은 오른쪽 위 모서리 위에 동작을 표시하며, 모두 같은 방식으로 그려집니다. 호버하거나 누르는 동안 배경이 나타나는 고스트 버튼이며, 데스크톱에서는 포인터가 블록 위에 있을 때, 터치 화면에서는 항상 표시됩니다. `copy`는 기본 제공됩니다. 코드를 복사하고 잠시 체크 표시를 보여 줍니다. 그 밖의 동작은 앱이 정의합니다. `renderCodeBlockAction`가 아이콘을 그리고 `onCodeBlockAction`가 누름을 보고합니다(기본 제공 `copy`도 복사한 뒤에 보고합니다). `copy`는 `Clipboard`처럼 클립보드에 쓰므로 앱의 `clipboard` 권한(`nsh.json`)이 필요합니다.

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

코드 블록은 별도 설정 없이 강조됩니다. 펜스에 지정된 언어(`ts`, `tsx`, `rust`, `python`, `bash`, `json`, `toml`, `yaml`, `diff` 및 약 200개 이상)의 코드는 모양에 따라 라이트 또는 다크로 Allsum의 코드 팔레트로 표시되며, 언어가 없는 블록은 일반 텍스트로 표시됩니다. 자체 강조 기능이 있는 앱은 자체 컴포넌트나 Rust 크레이트의 컴포넌트를 통해 `renderCodeBlock`로 코드를 표시합니다. Rust 뷰는 [`CodeHighlighter`](#syntax-highlighting)로 `TextView`에 강조 기능을 제공합니다. 다음은 앱 자체의 강조 기능을 사용한 코드와 너비를 가득 채우는 이미지의 예입니다.

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

`Highlighted`와 `MathView`(Rust에서는 `highlighted`와 `math_view`)는 앱 자체의 컴포넌트(하이라이터, 수식 렌더러 또는 앱의 Rust 크레이트에 있는 컴포넌트)를 나타냅니다. `renderMath`가 없으면 `TextView`는 KaTeX의 TeX 지원과 글꼴로 수식(`math` 및 `mathBlock` 파트)을 직접 조판하며, 텍스트 색상을 따르고 모든 플랫폼에서 동일하게 표시됩니다. 읽을 수 없는 TeX는 고정폭 소스로 표시됩니다.
<a id="markdown-extensions"></a>

## Markdown 확장

`extensions`은(는) 앱 고유의 구문을 커스텀 노드로 바꾸며, 이 노드는 `renderCustom`이(가) 표시합니다. 각 확장에는 `name`(만들어지는 노드의 `name`)과 다음 네 가지 구문 중 하나가 있습니다.

| 종류 | Rust | 일치 대상 | 노드 |
|---|---|---|---|
| `pattern` | `MarkdownExtension::pattern(name, regex)` | 코드와 링크 바깥의 텍스트에서 정규식과 일치하는 부분(Rust의 `regex` 구문) | 인라인. `text`은 일치한 부분이고, `attributes`은 그 그룹입니다: `"1"`, `"2"`, … 그리고 이름이 있는 그룹은 이름으로 접근합니다 |
| `language` | `MarkdownExtension::language(name, language)` | 해당 언어의 펜스 코드 블록(```` ```chart ````) | A block; `text` is the code, `attributes.meta` 는 info 문자열의 나머지 부분 |
| `tag` | `MarkdownExtension::tag(name, tag)` | 해당 태그의 HTML 또는 MDX 요소, 대소문자 구분 없음(`<Callout kind="tip">`) | 요소의 속성과, 파싱된 내용: 요소가 자기 줄에 단독으로 있으면 `children`(블록), 텍스트 안에 있으면 `content`(인라인) |
| `container` | `MarkdownExtension::container(name, container)` | 컨테이너 `:::name` … `:::` | 안쪽 Markdown으로 이루어진 블록(`children`). `:::note[Heads up]`은(는) `attributes.label`을(를) 제공하고, `{key=value}`은(는) 나머지 속성을 제공합니다 |

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

`BarChart`(Rust에서는 `bar_chart`)은(는) 앱 자체의 차트를 나타냅니다. 멘션 패턴의 그룹은 `node.attributes?.["1"]`(Rust에서는 `node.attributes["1"]`: `ada`)에 있고, 전체 일치는 `node.text`(`@ada`)에 있습니다. 렌더 함수가 없는 커스텀 노드는 그 내용을 표시합니다.
인라인 노드(칩)에 대해 반환된 뷰는 자신의 `verticalAlign`에 따라 줄 안에 배치됩니다: `align-middle`(`verticalAlign: "middle"`)은 텍스트를 기준으로 가운데에 맞추며, 뷰가 더 크지 않은 한 해당 줄은 단락의 `lineHeight`을(를) 유지합니다.

<a id="options"></a>

### 옵션

`options`은(는) CommonMark와 GitHub 구문 이외에 읽을 Markdown 구문을 선택합니다. Rust에서는 같은 필드를 가진 `MarkdownOptions`입니다(`MarkdownOptions { streaming: true, ..Default::default() }`).

| 키 | 타입 | 기본값 | 설명 |
|---|---|---|---|
| `math` | `boolean` | `true` | 수식: 텍스트 안의 `$…$`, 블록 형태의 `$$…$$`. |
| `html` | `boolean` | `true` | Markdown 안의 HTML을 `html` prop이 읽는 방식으로 읽습니다. `false`은(는) 이를 텍스트로 표시합니다. |
| `alerts` | `boolean` | `true` | GitHub의 알림(alert): `> [!NOTE]`, `[!TIP]`, `[!IMPORTANT]`, `[!WARNING]`, `[!CAUTION]`. |
| `frontmatter` | `boolean` | `false` | YAML front matter(맨 앞의 `---` … `---`)는 `frontmatter` 커스텀 노드가 되며, 이 노드의 `text`은(는) YAML입니다. |
| `mdx` | `boolean` | `false` | MDX: JSX 요소는 태그 이름을 가진 커스텀 노드가 되고, `{expressions}`은(는) 커스텀 노드 `expression`이(가) 됩니다. 이때 원시 HTML은 텍스트로 읽습니다. |
| `streaming` | `boolean` | `false` | 텍스트가 아직 도착하는 중입니다: 끝부분에서 열린 채 남은 구문을 닫힌 것처럼 표시합니다. |

<a id="the-document-model"></a>

## 문서 모델

`document` prop과 렌더 함수의 값은 일반 객체이며, 각 노드는 `type`(으)로 태그됩니다. 타입은 `nsh/base`에서 가져옵니다: `TextViewDocument`, `TextViewBlock`, `TextViewInline`, `TextViewCodeBlock`, `TextViewTable`,
`TextViewListItem`, `TextViewImage`, `TextViewFootnote`, `TextViewAlert`, `TextViewCustomNode`. Rust에서는 `nsh_base::text_view`의 타입입니다(`Document`, `Block`, `Inline`, `CodeBlock`, `Table`, `ListItem`, `Image`,
`Footnote`, `Alert`, `CustomNode`): `Block`과(와) `Inline`은(는) 아래 타입을 PascalCase로 쓴 이름을 변형(variant)으로 갖는 열거형이며(`Block::Heading { level, content, anchor }`, `Inline::Strong { content }`), 필드는 같고 snake case를 사용합니다.

| 블록 `type` | 필드 |
|---|---|
| `paragraph` | `content` |
| `heading` | `level`(1–6), `content`, `anchor?` |
| `blockquote` | `children`, `alert?`(`"note"`, `"tip"`, `"important"`, `"warning"`, `"caution"`) |
| `list` | `ordered?`, `start?`, `loose?`, `items`(`{ checked?, children }`) |
| `codeBlock` | `language?`, `meta?`, `code` |
| `math` | `tex` |
| `table` | `align?`(열마다 `"none"`, `"left"`, `"center"`, `"right"`), `head`(셀), `rows?`(셀의 행). 셀은 `{ content }` |
| `rule` | |
| `details` | `open?`, `summary`(인라인), `children` |
| `custom` | `name`, `attributes?`, `text?`, `data?`, `children?`, `content?` |

| 인라인 `type` | 필드 |
|---|---|
| `text` | `text` |
| `strong`, `emphasis`, `strikethrough`, `underline`, `highlight`, `superscript`, `subscript` | `content` |
| `code` | `code` |
| `keyboard` | `text` |
| `link` | `url`, `title?`, `content` |
| `image` | `src`, `alt?`, `title?` |
| `math` | `tex` |
| `break` | |
| `footnoteReference` | `label`, `index` |
| `custom` | 블록과 같음 |

문서에는 `footnotes?`도 있습니다: `{ label, index, children }`은(는) 처음 참조된 순서대로 블록 뒤에 표시됩니다. 앱은 응답을 문서로 저장하거나, 자체 데이터로 문서를 만들거나, `renderCustom`이(가) 표시하는 커스텀 노드를 섞어 넣을 수 있습니다.

<a id="parsing-and-plain-text"></a>

### 파싱과 일반 텍스트

`TextView`은(는) 문서를 표시하지 않고 동기적으로 읽을 수도 있습니다.

| 함수 | Rust | 반환값 |
|---|---|---|
| `TextView.parse(markdown, options?, extensions?)` | `TextView::parse(markdown, options, extensions)` | `markdown` prop이 표시할 `TextViewDocument`. |
| `TextView.parseHtml(html, extensions?)` | `TextView::parse_html(html, extensions)` | `html` prop이 표시할 `TextViewDocument`. |
| `TextView.plainText(document)` | `TextView::plain_text(document)`, `Document::plain_text()` | 마크업을 제외한 문서의 텍스트: 블록은 빈 줄로, 목록 항목과 표 행은 줄바꿈으로, 셀은 탭으로 구분됩니다. |

응답 전체를 복사하는 버튼:

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

앱은 한 번만 파싱해 문서를 보관하거나(`document={doc}`), 표시하기 전에 문서를 변경할 수도 있습니다.

<a id="in-rust"></a>

## Rust에서

Rust 뷰는 `nsh-base` crate의 같은 컴포넌트를 사용하며, 위의 예제는 해당 Rust 탭에 있습니다. 세 가지는 Rust 고유의 기능입니다: 앱의 하이라이터, 파트별 타입 스타일, Markdown 플러그인이며, 각각 `provide_context`을(를) 통해 뷰 아래의 모든 `TextView`에 전달됩니다. 문서 타입은 `nsh_base::text_view` 아래에 있으며, `Parser`은(는) 플러그인으로 문서를 읽을 수도 있습니다(`Parser::new().plugin(..).markdown(source)`).

<a id="syntax-highlighting"></a>

### 구문 강조

`TextView`은(는) Allsum의 코드 팔레트로 syntect를 사용해 코드를 강조합니다(`nsh-base`의 기능 `highlight`, 기본적으로 켜져 있음). 큰 블록은 먼저 일반 텍스트로 표시되고, 백그라운드 스레드가 강조를 마치면 색이 적용됩니다.
`CodeHighlighter`은(는) 이를 대신하는 앱 자체의 하이라이터이며, `provide_context`을(를) 통해 뷰 아래의 모든 `TextView`에 전달됩니다.
이 하이라이터는 각 코드 블록을 받아 코드의 바이트 범위별 스타일을 반환합니다(순서대로, 겹치지 않음. 포함되지 않은 부분은 일반 텍스트). `TextView`은(는) 기존 코드 블록(헤더, 액션, 스크롤 뷰, 파트) 안에 그 스타일이 적용된 span으로 코드를 표시합니다. 하이라이터는 코드를 스타일이 지정된 범위로 바꾸는 무엇이든 될 수 있습니다: `tree-sitter`, 앱 자체 테마를 사용하는 syntect, ...

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

`my_syntect::ranges`은(는) 앱에서 하이라이터와 연결하는 코드를, `messages`은(는) 앱의 채팅 뷰를 나타냅니다.
`renderCodeBlock`이(가) 주어지면 이 모든 것 대신 해당 값이 코드 블록을 표시합니다.

<a id="typed-part-styles"></a>

### 타입 파트 스타일

`TextViewParts`은(는) Rust 뷰에서 클래스 문자열 대신 타입 스타일로 파트를 스타일링합니다: 각 `TextViewPart`([위 표](#styling-the-parts)의 파트마다 하나)은(는) 자신의 `StyleRefinement`을(를) 다듬는 함수를 받습니다. `provide_context`(으)로 전달하면 아래의 모든 `TextView`에, `classes` 및 `styles`보다 먼저 적용되며, 여기서 읽는 테마 색상은 라이트/다크 모양을 따릅니다.

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

### Markdown 플러그인

`MarkdownPlugin`은(는) Rust에서 Markdown 구문을 읽습니다: 파서가 읽기 전에 구문 트리의 각 노드(markdown-rs의 `mdast`)를 받아 자체 블록 또는 인라인 콘텐츠(보통 `CustomNode`)를 반환하며, 자신이 만드는 커스텀 노드를 표시할 수도 있습니다. 뷰는 그 아래의 모든 `TextView`에 플러그인을 제공합니다.

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

플러그인의 `render`이(가) 먼저 오고, 그다음에 `renderCustom`, 그다음에 노드의 내용이 옵니다. `configure`은(는) markdown-rs의 구문을 더 활성화하고, `ParseContext`은(는) 파서가 읽는 방식대로 노드의 자식을 읽습니다.

## Props

| Prop | Rust | 타입 | 기본값 | 설명 |
|---|---|---|---|---|
| `markdown` | `.markdown(..)` | `string` | | Markdown으로 된 문서. |
| `html` | `.html(..)` | `string` | | `markdown`이(가) 주어지지 않았을 때, HTML로 된 문서. |
| `document` | `.document(..)` | `TextViewDocument` | | `markdown`과(와) `html` 모두 주어지지 않았을 때, 블록으로 된 문서. |
| `options` | `.options(..)` | `MarkdownOptions` | 모두 기본값 | 읽을 Markdown 구문([옵션](#options)). |
| `extensions` | `.extensions(..)` | `MarkdownExtension[]` | `[]` | 커스텀 노드로 표현되는 앱 고유의 구문([Markdown 확장](#markdown-extensions)). |
| `classes` | `.classes(..)` | `TextViewClasses` | `{}` | 파트별 Tailwind 클래스. |
| `styles` | `.styles(..)` | `TextViewStyles` | `{}` | 파트별 인라인 스타일(각각 `StyleProp<TextStyle>`). 클래스보다 우선합니다. |
| `selectable` | `.selectable(..)` | `boolean` | `false` | 문서 전체를 하나로 선택할 수 있습니다: 선택 영역이 단락, 제목, 셀, 코드 블록에 걸쳐 이어집니다([텍스트 선택](./text-selection.md)). |
| `links` | `.links(..)` | `"report" \| "open"` | `"report"` | 링크를 눌렀을 때의 동작: 이를 보고하며(`onLinkPress`), `"open"`을(를) 사용하면 다른 사이트나 앱으로의 링크를 앱 밖에서 열기도 합니다([링크](#links)). |
| `codeBlockScrollbar` | `.code_block_scrollbar(..)` | `boolean` | `true` | 코드 블록에 가로 스크롤 표시기를 보여줍니다. |
| `tableScrollbar` | `.table_scrollbar(..)` | `boolean` | `true` | 표에 가로 스크롤 표시기를 보여줍니다. |
| `streamingCaret` | `.streaming_caret(..)` | `JSX.Element` | | 문서 끝에 표시됩니다: 마지막 텍스트 뒤에 인라인으로, 그렇지 않으면 자기 줄에 표시됩니다. |
| `renderCustom` | `.render_custom(\|node\| ..)` | `(node: TextViewCustomNode) => JSX.Element` | | 커스텀 노드를 표시합니다. |
| `renderCodeBlock` | `.render_code_block(\|code\| ..)` | `(code: TextViewCodeBlock) => JSX.Element` | | 코드 블록을 표시합니다. |
| `codeBlockActions` | `.code_block_actions(..)` | `TextViewCodeAction[]` | `[]` | 각 코드 블록의 오른쪽 위 모서리에 있는 액션: `{ id: "copy" }`은(는) 기본 제공이고, 나머지는 앱의 것입니다. |
| `renderCodeBlockAction` | `.render_code_block_action(\|action\| ..)` | `(action: TextViewCodeAction) => JSX.Element` | | 앱 고유 액션의 아이콘. |
| `renderTableActions` | `.render_table_actions(\|table\| ..)` | `(table: TextViewTable) => JSX.Element` | | 각 표 위의 콘텐츠. |
| `renderMath` | `.render_math(\|math\| ..)` | `(math: TextViewMath) => JSX.Element` | | 수식을 표시합니다. |
| `renderImage` | `.render_image(\|image\| ..)` | `(image: TextViewImage) => JSX.Element` | | 이미지를 표시합니다. |
| `class`, `style` | 스타일 메서드 | `string`, `StyleProp<ViewStyle>` | | 루트이자 블록들의 열입니다. 텍스트 스타일은 모든 파트에 전달됩니다(타입 텍스트 스타일: `styles.root`). |

Rust에서 파트별 클래스와 스타일은 `TextViewClasses`과(와) `TextViewStyles`입니다. Rust 뷰는 보통 [`TextViewParts`](#typed-part-styles)로 파트를 스타일링합니다.

<a id="events"></a>

## 이벤트

| 이벤트 | Rust | 설명 |
|---|---|---|
| `onLinkPress` | `.on_link_press(\|event: &TextViewLinkPressEvent\| ..)` | 링크를 눌렀습니다: `{ url }`: 해당 URL, 제목이면 `#anchor`, 각주이면 `#footnote-<label>`. |
| `onCodeBlockAction` | `.on_code_block_action(\|event: &TextViewCodeActionEvent\| ..)` | 코드 블록의 액션을 눌렀습니다(`copy`이(가) 복사한 뒤). |
| `onImagePress` | `.on_image_press(\|image: &Image\| ..)` | 링크 안에 있지 않은 이미지를 눌렀습니다: `{ image }`. 앱이 이미지를 더 크게 보여줄 수 있도록 합니다(앱 자체의 확대 가능한 뷰어). |

<a id="accessibility"></a>

## 접근성

스크린 리더는 문서를 순서대로, 텍스트 단위로 읽습니다. `TextView`은(는) 구조에 역할을 부여합니다: 제목은 헤더, 링크는 링크(제목이 힌트), 작업 마커는 체크 상태를 가진 체크박스, 디스클로저의 요약은 펼쳐졌는지 알려주는 버튼, 이미지는 대체 텍스트로 읽힙니다.

<a id="related"></a>

## 관련 문서

- [Text](./text.md): `TextView`의 모든 텍스트를 이루는 요소로, span, 링크, 인라인 첨부, 선택을 지원합니다.
- [텍스트 선택](./text-selection.md): 여러 `TextView`과(와) 텍스트에 걸친 하나의 선택.
- [`nsh/base`](../modules/nsh-base.md): 그 밖의 기본 컴포넌트.
- [스타일링](../docs/styling.md) 및 [Tailwind](../docs/tailwind.md).
