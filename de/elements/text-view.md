---
title: "TextView"
description: "Die TextView-Komponente: Markdown, HTML oder ein Dokument aus Blöcken, dargestellt mit nativem Text und nativen Views, Teil für Teil gestaltbar, für KI-Chat-Antworten, Artikel und Hilfeseiten."
group: base
demo: text-view
source_hash: d73c7be1682f9cf4
---


# TextView

`TextView` zeigt ein Dokument, das in Markdown, in HTML oder als von der App aufgebaute Blöcke vorliegt: Überschriften, Absätze, Hervorhebungen, Links, Listen und Aufgabenlisten, Zitate und GitHubs Alerts, Code, Tabellen, Bilder, Formeln, Fußnoten und Disclosures. Es ist für die Antworten von KI-Modellen in einem Chat gemacht: Die Antwort trifft als Markdown nach und nach ein, und jeder Chunk zeigt den Text mit seiner Formatierung. Das Parsen geschieht in Rust, und das Dokument wird mit [`Text`](./text.md)-Elementen und Views gezeichnet.

Es bringt eigenes Verhalten und eine eigene Lesetypografie mit: Text in 15pt mit großzügigen Zeilen von 25,5pt, halbfette Überschriften mit Abstand darüber, Links unterstrichen in der `primary`-Farbe des Themes, Code in der Schrift `font-mono` des Themes in einer umrandeten, abgerundeten Box, Tabellen mit Linien ringsum und getönter Kopfzeile, Zitate mit einer Linie an der Seite und Alerts als getönte Boxen mit einem Icon in den Alert-Farben von GitHub. Seine Farben sind die Tokens des Themes (`foreground`, `muted-foreground`, `border`, `muted`, `primary` und `destructive` für eine Warnung), sodass ein Theme und das dunkle Erscheinungsbild darauf wirken. Jeder Teil übernimmt die Styles der App über diese Defaults: `classes` und `styles` in TSX, typisierte Styles pro Teil (`TextViewParts`) in Rust. In Rust erzeugt man es mit `nsh_base::text_view()`, in TSX mit `<TextView>` aus `nsh/base`.

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

In Rust erzeugt `text_view()` eines so, wie `view()` eine View erzeugt: ein Setter pro Prop (`.markdown(..)`, `.options(..)`, `.selectable(..)`), ein Closure pro Render-Funktion (`.render_image(|image| ..)`), ein Listener pro Event (`.on_link_press(..)`) und die typisierten Style-Methoden für sein Root (`.p_5()`, `.text_color(..)`), dessen Text-Styles an jeden Teil weitergegeben werden.

<a id="built-on-text"></a>

## Auf Text aufgebaut

`TextView` besteht aus [`Text`](./text.md)-Elementen, und sein Text verhält sich genau so, wie die Text-Seite es beschreibt. Jeder Absatz, jede Überschrift, jede Tabellenzelle und jeder Codeblock ist ein natives `Text`: ein Block, der gesetzt wird, umbricht, der Schriftskalierung folgt und mit `selectable` auswählbar und kopierbar ist. Fett, kursiv, durchgestrichen und die übrigen Inline-Auszeichnungen sind seine [Spans](./text.md#spans); Inline-Code ist ein Span mit einem [Span-Hintergrund](./text.md#span-backgrounds), sodass `code: "rounded bg-neutral-100"` ihm einen abgerundeten Hintergrund gibt; Links sind [antippbare Spans](./text.md#links); Bilder und Inline-Custom-Nodes sind [Inline-Attachments](./text.md#inline-views-and-images). Text-Styles am Root werden an jeden Teil weitergegeben, so wie [Text-Styles](./text.md#text-styles) von einem `Text` an seine Spans weitergegeben werden.

Mit `selectable` lässt sich das ganze Dokument wie eine Webseite als Einheit auswählen: Ein Ziehen (auf Touchscreens ein langes Drücken und die Griffe) reicht von einem Absatz, Listenelement, einer Zelle oder einem Codeblock zum nächsten, und Kopieren übernimmt den Text von allen. Ein `selectable` `TextView` wird für sich als eigene Einheit ausgewählt; innerhalb einer [auswählbaren View](./text-selection.md) setzt sich seine Auswahl auch in die Texte und anderen `TextView`-Elemente ringsum fort.

Was `TextView` hinzufügt, ist alles Übrige: das Einlesen von Markdown, HTML oder einem Dokument in Blöcke, die Views um die Texte (Listen, Zitate, Tabellen, Codeblöcke, Disclosures, Fußnoten), Streaming, Styles pro Teil, Render-Funktionen und Erweiterungen.

<a id="the-document"></a>

## Das Dokument

Der Inhalt ist eine von drei Props, die in dieser Reihenfolge gelesen werden:

- **`markdown`**: CommonMark mit GitHubs Erweiterungen (Tabellen, Aufgabenlisten, Durchstreichen, Autolinks, Fußnoten, Alerts), Formeln (`$…$` und `$$…$$`) und HTML innerhalb des Markdown.
- **`html`**: HTML, wie ein Lesemodus es zeigt. Text, Struktur und Inline-Formatierung kommen durch; Skripte, Styles, Formularelemente und versteckte Elemente bleiben außen vor. Ein Fragment und eine ganze Seite funktionieren beide (eine Seite zeigt ihren Body).
- **`document`**: Blöcke, die die App aufbaut oder aufbewahrt: einfache Objekte in TSX, `nsh_base::text_view::Document` in Rust ([Das Dokumentmodell](#the-document-model)).

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

`TextView` wächst mit seinem Inhalt. Für lange Dokumente gehört es in eine [`Scroll`](./scroll.md) (oder in eine Zeile einer [`List`](./list.md)).

<a id="styling-the-parts"></a>

## Die Teile stylen

`class` und `style` stylen das Root, eine Spalte der Blöcke; dort gesetzte Text-Styles (Farbe, Größe, Schrift) werden an jeden Teil weitergegeben. Das Root ist auch der Teil `root`: `styles.root` nimmt Text-Styles mit ihren Typen entgegen (`style` ist wie bei einer View typisiert) und `classes.root` Klassen. `classes` nimmt Tailwind-Klassen pro Teil und `styles` Inline-Styles pro Teil. Die Klassen eines Teils kommen nach seinen eigenen Default-Styles, setzen sich also durch; seine `styles` setzen sich gegenüber seinen Klassen durch. In Rust nehmen die Teile typisierte Styles: `TextViewParts` gibt jedem `TextViewPart` eine Funktion, die seinen Style verfeinert, für jedes `TextView` unterhalb der View, die sie bereitstellt ([Typisierte Part-Styles](#typed-part-styles)), und das Root nimmt die Style-Methoden. Zeilenhöhen in den Defaults sind in Punkt angegeben: Eine Klasse, die die Größe eines Teils ändert, setzt auch seine Zeilenhöhe (Tailwinds `text-*`-Klassen tun das).

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

Manche Nodes bestehen aus mehreren Teilen, die der Reihe nach angewendet werden: Eine Überschrift der Ebene 2 ist `heading` und dann `heading2`; ein Alert ist `blockquote`, `alert` und dann seine Art (`alertNote`, ...); eine Aufgabenmarkierung ist `listMarker`, `taskMarker` und dann `taskMarkerChecked`, wenn sie erledigt ist; die Kopfzeile ist `tableRow` und dann `tableHead`, und ihre Zellen sind `tableCell` und dann `tableHeaderCell`.

| Teil | Rust | Was es ist |
|---|---|---|
| `root` | `Root` | Die Text-View selbst, eine Spalte ihrer Blöcke; Text-Styles hier werden an jeden Teil weitergegeben. |
| `paragraph` | `Paragraph` | Jeder Absatz. |
| `heading` | `Heading` | Jede Überschrift, vor dem Teil ihrer Ebene. |
| `heading1` … `heading6` | `Heading1` … `Heading6` | Überschriften dieser Ebene (27, 20, 17, dann 15pt, halbfett). |
| `blockquote` | `Blockquote` | Zitate und Alerts: eine Spalte ihrer Blöcke mit einer Linie an der Seite. |
| `alert` | `Alert` | Jeder Alert (`> [!NOTE]`), nach `blockquote`: eine getönte Box, eine Zeile aus ihrem Icon und ihren Blöcken. |
| `alertNote`, `alertTip`, `alertImportant`, `alertWarning`, `alertCaution` | `AlertNote`, `AlertTip`, `AlertImportant`, `AlertWarning`, `AlertCaution` | Alerts dieser Art. |
| `alertIcon` | `AlertIcon` | Das Icon eines Alerts: ein Ring mit einem Glyph in der Farbe des Alerts. |
| `list` | `List` | Jede Liste: eine Spalte ihrer Elemente. |
| `orderedList`, `unorderedList` | `OrderedList`, `UnorderedList` | Nummerierte und Aufzählungslisten, nach `list`. |
| `listItem` | `ListItem` | Jedes Element: eine Zeile aus seiner Markierung und seinen Blöcken. |
| `listMarker` | `ListMarker` | Die Markierung eines Elements (`•`, `◦`, `▪` je nach Tiefe, oder `1.`), rechtsbündig im Einzug vor dem Element. |
| `taskMarker` | `TaskMarker` | Die Markierung eines Aufgabenelements: eine als View gezeichnete Box, bei Erledigung mit einem `✓` gefüllt; nach `listMarker`. |
| `taskMarkerChecked` | `TaskMarkerChecked` | Die Markierung eines erledigten Aufgabenelements, nach `taskMarker`. |
| `listItemContent` | `ListItemContent` | Die Spalte der Blöcke eines Elements. |
| `codeBlock` | `CodeBlock` | Codeblöcke: eine umrandete, abgerundete Box mit dem Code, mit dem Header darüber. |
| `codeBlockHeader` | `CodeBlockHeader` | Die Zeile der Aktionen eines Codeblocks (`codeBlockActions`), die über seiner oberen rechten Ecke schwebt. |
| `codeBlockScroll` | `CodeBlockScroll` | Die horizontale Scroll-View um den Code eines Codeblocks. |
| `codeBlockCode` | `CodeBlockCode` | Der Code eines Codeblocks (Monospace, wie geschrieben). |
| `code` | `Code` | Code im Text (Monospace, auf abgerundetem Hintergrund). |
| `keyboard` | `Keyboard` | Tasten (`<kbd>`, als Code). |
| `strong` | `Strong` | Fetter Text (halbfett). |
| `emphasis` | `Emphasis` | Hervorgehobener Text (kursiv). |
| `strikethrough` | `Strikethrough` | Durchgestrichener Text. |
| `underline` | `Underline` | Unterstrichener Text (`<u>`, `<ins>`). |
| `highlight` | `Highlight` | Markierter Text (`<mark>`, auf abgerundetem Gelb). |
| `superscript`, `subscript` | `Superscript`, `Subscript` | Hoch- und tiefgestellter Text (kleiner). |
| `link` | `Link` | Links (in der `primary`-Farbe des Themes, unterstrichen). |
| `image` | `Image` | Bilder. |
| `math` | `Math` | Formeln im Text, gesetzt, wenn es kein `renderMath` gibt. |
| `mathBlock` | `MathBlock` | Formelblöcke, gesetzt und zentriert, wenn es kein `renderMath` gibt. |
| `table` | `Table` | Tabellen: der Inhalt von `renderTableActions`, dann die Scroll-View der Zellen. |
| `tableScroll` | `TableScroll` | Die horizontale Scroll-View der Zellen einer Tabelle: Spalten passen sich ihrem Inhalt an, wenn Platz ist, umbrechen bis zu einer Untergrenze, wenn die View schmaler ist, und darüber hinaus scrollt die Tabelle. |
| `tableRow` | `TableRow` | Jede Zeile einer Tabelle: eine View hinter ihren Zellen, für Hintergründe und Ränder (Text-Styles gehören auf `tableCell`). |
| `tableHead` | `TableHead` | Die Kopfzeile, nach `tableRow`. |
| `tableCell` | `TableCell` | Jede Zelle. |
| `tableHeaderCell` | `TableHeaderCell` | Die Zellen der Kopfzeile (kleiner, gedämpft), nach `tableCell`. |
| `rule` | `Rule` | Thematische Trennlinien: eine als oberer Rand gezeichnete Linie. |
| `details` | `Details` | Disclosures (`<details>`). |
| `summary` | `Summary` | Die Zusammenfassung einer Disclosure; ein Druck öffnet und schließt sie. |
| `summaryMarker` | `SummaryMarker` | Die Markierung einer Zusammenfassung (`▸`, `▾`). |
| `footnotes` | `Footnotes` | Die Fußnoten nach den Blöcken: eine Spalte. |
| `footnote` | `Footnote` | Eine Fußnote: eine Zeile aus ihrer Nummer und ihren Blöcken. |
| `footnoteLabel` | `FootnoteLabel` | Die Nummer einer Fußnote. |
| `footnoteReference` | `FootnoteReference` | Ein Verweis auf eine Fußnote im Text (ihre Nummer, kleiner). |
| `custom` | `Custom` | Custom Nodes, dargestellt als ihr Inhalt (wenn keine Render-Funktion sie darstellt). |

<a id="streaming-ai-replies"></a>

## Streaming von KI-Antworten

Die Antwort wird übergeben, während sie wächst, mit `options={{ streaming: true }}` (`MarkdownOptions { streaming: true, .. }` in Rust). Das Ende eines noch eintreffenden Textes lässt oft Syntax offen (`**bold`, `` `code ``, `[ein Link](htt`, a table whose header just arrived); Streaming zeigt sie so, wie sie nach dem Schließen aussehen wird, sodass der Leser nie verirrte `**` oder `[` sieht. Blöcke werden nach Position behalten: Die abgeschlossenen Blöcke behalten ihre Views, und nur der gerade geschriebene Block wird neu erzeugt, sodass eine lange Antwort günstig zu aktualisieren bleibt.

`streamingCaret` folgt dem Ende des Dokuments: inline am Ende des letzten Textes, wo auch immer der letzte Block endet (ein Absatz, ein Listenelement, ein Codeblock, die letzte Zelle einer Tabelle), sonst in einer eigenen Zeile nach dem letzten Block (eine Linie, Inhalt einer Render-Funktion). Er wird entfernt, wenn die Antwort fertig ist.

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

Der Cursor ist eine eigene View der App, sodass er mit der [Animations-API von `nsh`](../modules/nsh.md#animation) blinken oder pulsieren kann und neue Blöcke mit den Animationen der App eingeblendet werden können.

## Links

Links sind [antippbare Spans](./text.md#links). Ein Druck darauf ruft `onLinkPress` mit `{ url }` auf; die App entscheidet, was sie öffnet (eine eigene Seite, ein [`WebView`](./web-view.md), ein Scrollen zu einer Überschrift). Überschriften haben Anker (die von GitHub: `## Getting started` wird zu `#getting-started`), sodass ein Link auf `#getting-started` als dieser String ankommt und ein Fußnotenverweis als `#footnote-<label>`.

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

`scroll_to_anchor` und `open_web` (`scrollToAnchor` und `nav` in TSX) stehen für die eigenen Funktionen der App.

Mit `links="open"` öffnet ein Druck auf einen Link zu einer anderen Site oder App (eine URL mit Schema: `https:`, `mailto:`, ...) diese zusätzlich außerhalb der App mit [`openUrl`](../modules/nsh.md#openurl), unter der Capability `openUrl` der App, nachdem `onLinkPress` ihn gemeldet hat; Anker im Dokument (`#…`) werden nur gemeldet. Der Default, `"report"`, öffnet nichts.

```rust tabs
use nsh_base::{TextViewLinks, text_view};

text_view().markdown(doc).links(TextViewLinks::Open)
```

```tsx tabs
<TextView markdown={doc} links="open" />
```

<a id="render-functions"></a>

## Render-Funktionen

Render-Funktionen bringen den eigenen Inhalt der App in das Dokument. Jede nimmt den Wert eines Teils entgegen und gibt dessen Inhalt zurück (JSX in TSX, ein Element in Rust); ein Teil behält, was für ihn gerendert wurde, solange sein Wert gleich bleibt, sodass beim Streaming nur der gerade geschriebene Teil neu gerendert wird.

| Prop | Rust | Wert | Ersetzt oder ergänzt |
|---|---|---|---|
| `renderCodeBlock` | `.render_code_block(\|code\| ..)` | `TextViewCodeBlock` (`CodeBlock`) | Ersetzt einen Codeblock (eigenes Syntax-Highlighting). |
| `renderCodeBlockAction` | `.render_code_block_action(\|action\| ..)` | `TextViewCodeAction` | Das Icon einer Codeblock-Aktion der App (`codeBlockActions`); der Button darum gehört zu `TextView`. |
| `renderTableActions` | `.render_table_actions(\|table\| ..)` | `TextViewTable` (`Table`) | Ergänzt Inhalt über einer Tabelle (Kopieren, Export). |
| `renderMath` | `.render_math(\|math\| ..)` | `TextViewMath` | Ersetzt eine Formel: `{ tex, display }`, `display` für einen `$$…$$`-Block. |
| `renderImage` | `.render_image(\|image\| ..)` | `TextViewImage` (`Image`) | Ersetzt ein Bild (`{ src, alt, title }`): eigenes Laden, eigene Größenanpassung, ein Viewer beim Drücken. |
| `renderCustom` | `.render_custom(\|node\| ..)` | `TextViewCustomNode` (`CustomNode`) | Zeigt einen Custom Node anhand seines `name` ([Markdown-Erweiterungen](#markdown-extensions)). |

Codeblöcke tragen Aktionen über ihrer oberen rechten Ecke, alle gleich gezeichnet: Ghost-Buttons, deren Hintergrund bei Hover oder Druck erscheint, auf Desktops sichtbar, solange ein Zeiger über dem Block ist, auf Touchscreens immer. `copy` ist eingebaut: Es kopiert den Code und zeigt kurz ein Häkchen. Weitere Aktionen sind die der App: `renderCodeBlockAction` zeichnet ihr Icon und `onCodeBlockAction` meldet ihre Drücke (der eingebaute `copy` ebenfalls, nachdem er kopiert hat). `copy` schreibt in die Zwischenablage wie `Clipboard`, braucht also die Capability `clipboard` der App (`nsh.json`).

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

Codeblöcke sind von Haus aus hervorgehoben: Für eine am Fence genannte Sprache (`ts`, `tsx`, `rust`, `python`, `bash`, `json`, `toml`, `yaml`, `diff` und etwa zweihundert weitere) erscheint der Code in der Code-Palette von Allsum, hell oder dunkel je nach Erscheinungsbild; ein Block ohne Sprache wird schlicht dargestellt. Eine App mit eigenem Highlighting zeigt ihren Code mit `renderCodeBlock`, aus einer eigenen Komponente oder einer ihres Rust-Crates; eine Rust-View gibt `TextView` ihren Highlighter mit [`CodeHighlighter`](#syntax-highlighting). Hier Code mit Highlighting der App und ein Bild, das die Breite ausfüllt:

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

`Highlighted` und `MathView` (`highlighted` und `math_view` in Rust) stehen für die eigenen Komponenten der App (ein Highlighter, ein Formel-Renderer oder eine Komponente ihres Rust-Crates). Ohne `renderMath` setzt `TextView` eine Formel selbst (Teile `math` und `mathBlock`) mit der TeX-Unterstützung und den Schriften von KaTeX, in der Textfarbe, auf jeder Plattform gleich; TeX, das es nicht lesen kann, erscheint als sein Quelltext in Monospace.
<a id="markdown-extensions"></a>

## Markdown-Erweiterungen

`extensions` macht aus Syntax der App benutzerdefinierte Knoten, die `renderCustom` anzeigt. Jede Erweiterung hat `name` (`name` der erzeugten Knoten) und eine von vier Syntaxarten:

| Art | Rust | Passt auf | Der Knoten |
|---|---|---|---|
| `pattern` | `MarkdownExtension::pattern(name, regex)` | Ein regulärer Ausdruck im Text (Syntax von Rusts `regex`), außerhalb von Code und Links | Inline; `text` ist der Treffer, `attributes` seine Gruppen: `"1"`, `"2"`, … und benannte Gruppen unter ihrem Namen |
| `language` | `MarkdownExtension::language(name, language)` | Eingezäunte Codeblöcke dieser Sprache (```` ```chart ````) | A block; `text` is the code, `attributes.meta` der Rest des Info-Strings |
| `tag` | `MarkdownExtension::tag(name, tag)` | HTML- oder MDX-Elemente dieses Tags, in beliebiger Groß-/Kleinschreibung (`<Callout kind="tip">`) | Seine Attribute, sein geparster Inhalt: `children` (Blöcke) für ein Element auf eigenen Zeilen, `content` (Inline) innerhalb von Text |
| `container` | `MarkdownExtension::container(name, container)` | Container `:::name` … `:::` | Ein Block aus dem Markdown darin (`children`); `:::note[Heads up]` liefert `attributes.label`, `{key=value}` die übrigen Attribute |

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

`BarChart` (`bar_chart` in Rust) steht für das eigene Diagramm der App. Die Gruppe des Mention-Musters steht in `node.attributes?.["1"]` (in Rust `node.attributes["1"]`: `ada`) und der gesamte Treffer in `node.text` (`@ada`). Ein benutzerdefinierter Knoten ohne Render-Funktion zeigt seinen Inhalt an.
Eine View, die für einen Inline-Knoten zurückgegeben wird (ein Chip), sitzt über ihr eigenes `verticalAlign` in ihrer Zeile: `align-middle`
(`verticalAlign: "middle"`) zentriert sie am Text, und ihre Zeile behält das `lineHeight` des Absatzes, es sei denn, die View ist höher.

<a id="options"></a>

### Optionen

`options` wählt die Markdown-Syntax, die über CommonMark und GitHub hinaus gelesen wird; in Rust ist es ein `MarkdownOptions` mit denselben Feldern (`MarkdownOptions { streaming: true, ..Default::default() }`):

| Schlüssel | Typ | Standard | Beschreibung |
|---|---|---|---|
| `math` | `boolean` | `true` | Formeln: `$…$` im Text, `$$…$$` als Blöcke. |
| `html` | `boolean` | `true` | HTML innerhalb des Markdown wird so gelesen, wie die Prop `html` es liest; `false` zeigt es als Text an. |
| `alerts` | `boolean` | `true` | Alerts von GitHub: `> [!NOTE]`, `[!TIP]`, `[!IMPORTANT]`, `[!WARNING]`, `[!CAUTION]`. |
| `frontmatter` | `boolean` | `false` | YAML-Front-Matter (zuerst `---` … `---`) wird zu einem benutzerdefinierten Knoten `frontmatter`, dessen `text` das YAML ist. |
| `mdx` | `boolean` | `false` | MDX: JSX-Elemente sind benutzerdefinierte Knoten, benannt nach ihrem Tag, `{expressions}` ergeben benutzerdefinierte Knoten `expression`; rohes HTML wird dann als Text gelesen. |
| `streaming` | `boolean` | `false` | Der Text trifft noch ein: Syntax, die an seinem Ende offen bleibt, wird angezeigt, als wäre sie geschlossen. |

<a id="the-document-model"></a>

## Das Dokumentmodell

Die Prop `document` und die Werte der Render-Funktionen sind einfache Objekte, jeder Knoten ist durch sein `type` gekennzeichnet. Die Typen
stammen aus `nsh/base`: `TextViewDocument`, `TextViewBlock`, `TextViewInline`, `TextViewCodeBlock`, `TextViewTable`,
`TextViewListItem`, `TextViewImage`, `TextViewFootnote`, `TextViewAlert` und `TextViewCustomNode`. In Rust sind es
die Typen von `nsh_base::text_view` (`Document`, `Block`, `Inline`, `CodeBlock`, `Table`, `ListItem`, `Image`,
`Footnote`, `Alert`, `CustomNode`): `Block` und `Inline` sind Enums, deren Varianten die unten stehenden Typen in PascalCase sind
(`Block::Heading { level, content, anchor }`, `Inline::Strong { content }`), mit denselben Feldern in snake case.

| Block `type` | Felder |
|---|---|
| `paragraph` | `content` |
| `heading` | `level` (1–6), `content`, `anchor?` |
| `blockquote` | `children`, `alert?` (`"note"`, `"tip"`, `"important"`, `"warning"`, `"caution"`) |
| `list` | `ordered?`, `start?`, `loose?`, `items` (`{ checked?, children }`) |
| `codeBlock` | `language?`, `meta?`, `code` |
| `math` | `tex` |
| `table` | `align?` (`"none"`, `"left"`, `"center"`, `"right"` pro Spalte), `head` (Zellen), `rows?` (Zeilen aus Zellen); eine Zelle ist `{ content }` |
| `rule` | |
| `details` | `open?`, `summary` (Inline), `children` |
| `custom` | `name`, `attributes?`, `text?`, `data?`, `children?`, `content?` |

| Inline `type` | Felder |
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
| `custom` | wie beim Block |

Ein Dokument hat außerdem `footnotes?`: `{ label, index, children }`, die nach den Blöcken in der Reihenfolge ihrer ersten
Referenz angezeigt werden. Eine App kann Antworten als Dokumente speichern, sie aus eigenen Daten aufbauen oder benutzerdefinierte Knoten einmischen, die
`renderCustom` anzeigt.

<a id="parsing-and-plain-text"></a>

### Parsen und Klartext

`TextView` liest Dokumente auch, ohne sie anzuzeigen, synchron:

| Funktion | Rust | Rückgabe |
|---|---|---|
| `TextView.parse(markdown, options?, extensions?)` | `TextView::parse(markdown, options, extensions)` | Was die Prop `markdown` als `TextViewDocument` anzeigen würde. |
| `TextView.parseHtml(html, extensions?)` | `TextView::parse_html(html, extensions)` | Was die Prop `html` als `TextViewDocument` anzeigen würde. |
| `TextView.plainText(document)` | `TextView::plain_text(document)`, `Document::plain_text()` | Der Text des Dokuments ohne Markup: Blöcke durch Leerzeilen getrennt, Listeneinträge und Tabellenzeilen durch Zeilenumbrüche, Zellen durch Tabulatoren. |

Ein Kopier-Button für eine ganze Antwort:

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

Eine App kann auch einmal parsen und das Dokument behalten (`document={doc}`) oder es ändern, bevor sie es anzeigt.

## In Rust

Rust-Views verwenden dieselbe Komponente aus dem Crate `nsh-base`, mit den obigen Beispielen in ihren Rust-Tabs. Drei Dinge gibt es
nur in Rust: den Highlighter einer App, typisierte Styles pro Part und Markdown-Plugins, die jeweils mit `provide_context` an jedes `TextView` unterhalb
einer View übergeben werden. Die Dokumenttypen liegen unter `nsh_base::text_view`, wo `Parser` Dokumente auch
mit Plugins liest (`Parser::new().plugin(..).markdown(source)`).

<a id="syntax-highlighting"></a>

### Syntaxhervorhebung

`TextView` hebt Code mit syntect in der Code-Palette von Allsum hervor (Feature `highlight` von `nsh-base`, standardmäßig aktiviert);
ein großer Block wird zunächst sofort unformatiert angezeigt und erhält seine Farben, sobald ein Hintergrund-Thread ihn hervorgehoben hat.
`CodeHighlighter` ist der Highlighter der App an dessen Stelle und wird mit `provide_context` an jedes `TextView` unterhalb einer View übergeben.
Er erhält jeden Codeblock und gibt die Styles von Byte-Bereichen seines Codes zurück (in Reihenfolge, nicht überlappend; was sie
auslassen, bleibt unformatiert); `TextView` zeigt den Code als Spans mit diesen Styles an, innerhalb seines üblichen Codeblocks (Header, Aktionen,
Scroll-View, Parts). Der Highlighter kann alles sein, was Code in gestylte Bereiche umwandelt: `tree-sitter`, syntect mit
einem Theme der App, ...

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

`my_syntect::ranges` steht für den Glue-Code der App zu ihrem Highlighter und `messages` für die Chat-View der App.
`renderCodeBlock` zeigt, sofern angegeben, den Codeblock anstelle von all dem an.

<a id="typed-part-styles"></a>

### Typisierte Part-Styles

`TextViewParts` stylt Parts für Rust-Views mit typisierten Styles statt mit Klassen-Strings: Jedes `TextViewPart` (eines pro
Part der [Tabelle oben](#styling-the-parts)) erhält eine Funktion, die sein `StyleRefinement` verfeinert. Mit
`provide_context` übergeben, gelten sie für jedes `TextView` darunter, vor dessen `classes` und `styles`; darin gelesene Theme-Farben
folgen dem hellen und dem dunklen Erscheinungsbild.

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

### Markdown-Plugins

Ein `MarkdownPlugin` liest in Rust Markdown-Syntax: Es erhält jeden Knoten des Syntaxbaums (`mdast` von markdown-rs), bevor
der Parser ihn liest, und gibt einen eigenen Block- oder Inline-Inhalt zurück, meist einen `CustomNode`; es kann auch die
benutzerdefinierten Knoten anzeigen, die es erzeugt. Eine View stellt Plugins für jedes `TextView` unterhalb von ihr bereit:

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

Das `render` eines Plugins kommt zuerst, dann `renderCustom`, dann der Inhalt des Knotens. `configure` schaltet mehr Syntax von
markdown-rs ein, und `ParseContext` liest die Kinder eines Knotens so, wie es der Parser tut.

## Props

| Prop | Rust | Typ | Standard | Beschreibung |
|---|---|---|---|---|
| `markdown` | `.markdown(..)` | `string` | | Das Dokument als Markdown. |
| `html` | `.html(..)` | `string` | | Das Dokument als HTML, wenn `markdown` nicht angegeben ist. |
| `document` | `.document(..)` | `TextViewDocument` | | Das Dokument als Blöcke, wenn weder `markdown` noch `html` angegeben ist. |
| `options` | `.options(..)` | `MarkdownOptions` | alle Standardwerte | Die gelesene Markdown-Syntax ([Optionen](#options)). |
| `extensions` | `.extensions(..)` | `MarkdownExtension[]` | `[]` | Die Syntax der App als benutzerdefinierte Knoten ([Markdown-Erweiterungen](#markdown-extensions)). |
| `classes` | `.classes(..)` | `TextViewClasses` | `{}` | Tailwind-Klassen pro Part. |
| `styles` | `.styles(..)` | `TextViewStyles` | `{}` | Inline-Styles pro Part (jeweils ein `StyleProp<TextStyle>`), über den Klassen. |
| `selectable` | `.selectable(..)` | `boolean` | `false` | Das Dokument ist als Ganzes auswählbar: Eine Auswahl reicht über seine Absätze, Überschriften, Zellen und Codeblöcke ([Textauswahl](./text-selection.md)). |
| `links` | `.links(..)` | `"report" \| "open"` | `"report"` | Was ein Druck auf einen Link bewirkt: meldet ihn (`onLinkPress`) und öffnet mit `"open"` zusätzlich einen Link zu einer anderen Website oder App außerhalb der App ([Links](#links)). |
| `codeBlockScrollbar` | `.code_block_scrollbar(..)` | `boolean` | `true` | Codeblöcke zeigen ihren horizontalen Scroll-Indikator an. |
| `tableScrollbar` | `.table_scrollbar(..)` | `boolean` | `true` | Tabellen zeigen ihren horizontalen Scroll-Indikator an. |
| `streamingCaret` | `.streaming_caret(..)` | `JSX.Element` | | Wird am Ende des Dokuments angezeigt: inline nach dem letzten Text, sonst in einer eigenen Zeile. |
| `renderCustom` | `.render_custom(\|node\| ..)` | `(node: TextViewCustomNode) => JSX.Element` | | Zeigt benutzerdefinierte Knoten an. |
| `renderCodeBlock` | `.render_code_block(\|code\| ..)` | `(code: TextViewCodeBlock) => JSX.Element` | | Zeigt Codeblöcke an. |
| `codeBlockActions` | `.code_block_actions(..)` | `TextViewCodeAction[]` | `[]` | Die Aktionen über der oberen rechten Ecke jedes Codeblocks: `{ id: "copy" }` ist eingebaut, weitere stammen von der App. |
| `renderCodeBlockAction` | `.render_code_block_action(\|action\| ..)` | `(action: TextViewCodeAction) => JSX.Element` | | Das Icon einer Aktion der App. |
| `renderTableActions` | `.render_table_actions(\|table\| ..)` | `(table: TextViewTable) => JSX.Element` | | Inhalt über jeder Tabelle. |
| `renderMath` | `.render_math(\|math\| ..)` | `(math: TextViewMath) => JSX.Element` | | Zeigt Formeln an. |
| `renderImage` | `.render_image(\|image\| ..)` | `(image: TextViewImage) => JSX.Element` | | Zeigt Bilder an. |
| `class`, `style` | Style-Methoden | `string`, `StyleProp<ViewStyle>` | | Die Wurzel, eine Spalte der Blöcke; ihre Text-Styles gehen an jeden Part über (typisierte Text-Styles: `styles.root`). |

In Rust heißen die Klassen und Styles pro Part `TextViewClasses` und `TextViewStyles`; eine Rust-View stylt die
Parts meist mit [`TextViewParts`](#typed-part-styles).

## Events

| Event | Rust | Beschreibung |
|---|---|---|
| `onLinkPress` | `.on_link_press(\|event: &TextViewLinkPressEvent\| ..)` | Ein Link wurde gedrückt: `{ url }`: seine URL, `#anchor` für eine Überschrift, `#footnote-<label>` für eine Fußnote. |
| `onCodeBlockAction` | `.on_code_block_action(\|event: &TextViewCodeActionEvent\| ..)` | Eine Aktion eines Codeblocks wurde gedrückt (nachdem `copy` kopiert hat). |
| `onImagePress` | `.on_image_press(\|image: &Image\| ..)` | Ein Bild außerhalb eines Links wurde gedrückt: `{ image }`, damit die App es größer anzeigen kann (ein eigener zoombarer Viewer). |

<a id="accessibility"></a>

## Barrierefreiheit

Screenreader lesen das Dokument der Reihe nach, Text für Text. `TextView` gibt der Struktur ihre Rollen: Überschriften sind
Header, Links sind Links (ihr Titel ist der Hinweis), Aufgabenmarkierungen sind Checkboxen mit ihrem Zustand, die
Zusammenfassung eines Disclosure ist ein Button, der angibt, ob es aufgeklappt ist, und Bilder werden anhand ihres Alt-Texts vorgelesen.

<a id="related"></a>

## Siehe auch

- [Text](./text.md): das Element, das jeder Text von `TextView` ist, mit seinen Spans, Links, Inline-Anhängen und seiner Auswahl.
- [Textauswahl](./text-selection.md): eine Auswahl über mehrere `TextView` und Texte hinweg.
- [`nsh/base`](../modules/nsh-base.md): die anderen Basiskomponenten.
- [Styling](../docs/styling.md) und [Tailwind](../docs/tailwind.md).
