---
title: "TextView"
description: "Il componente TextView: Markdown, HTML o un documento di blocchi mostrato con testo e viste native, stilizzato parte per parte, per risposte di chat AI, articoli e pagine di aiuto."
group: base
demo: text-view
source_hash: d73c7be1682f9cf4
---

# TextView

`TextView` mostra un documento scritto in Markdown, in HTML o come blocchi costruiti dall'app: titoli, paragrafi, enfasi,
link, elenchi e liste di attività, citazioni e alert di GitHub, codice, tabelle, immagini, formule, note a piè di pagina e disclosure. È
pensato per le risposte dei modelli di IA in una chat: la risposta arriva in streaming come Markdown e ogni chunk mostra il testo con la
sua formattazione già applicata. Il parsing avviene in Rust e il documento viene disegnato con elementi e view [`Text`](./text.md).

Gestisce il proprio comportamento e include una tipografia di lettura propria: testo a 15pt con righe generose da 25.5pt, titoli
semibold con spazio sopra, link sottolineati nel colore `primary` del tema, codice nel `font-mono` del tema in un riquadro con bordo e angoli arrotondati, tabelle con righe su ogni lato e una riga d'intestazione colorata, citazioni con una linea a lato e
alert come riquadri colorati con un'icona nei colori degli alert di GitHub. I suoi colori sono i token del tema (`foreground`, `muted-foreground`, `border`,
`muted`, `primary` e `destructive` per un'avvertenza), quindi un tema e l'aspetto scuro li raggiungono. Ogni parte accetta gli stili dell'app al posto di questi valori predefiniti: `classes` e `styles` in TSX, stili tipizzati per parte
(`TextViewParts`) in Rust. In Rust se ne crea uno con `nsh_base::text_view()`, in TSX con `<TextView>` da `nsh/base`.

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

In Rust, `text_view()` lo crea come `view()` crea una view: un setter per ogni prop (`.markdown(..)`, `.options(..)`,
`.selectable(..)`), una closure per ogni render function (`.render_image(|image| ..)`), un listener per ogni evento
(`.on_link_press(..)`) e i metodi di stile tipizzati per la sua radice (`.p_5()`, `.text_color(..)`), i cui stili di testo
passano a ogni parte.

<a id="built-on-text"></a>

## Costruito su Text

`TextView` è composto da elementi [`Text`](./text.md) e il suo testo si comporta esattamente come descritto nella pagina di Text. Ogni
paragrafo, titolo, cella di tabella e blocco di codice è un `Text` nativo: un unico blocco che si impagina, va a capo, segue la scala dei font e,
con `selectable`, si seleziona e si copia. Grassetto, enfasi, testo barrato e gli altri segni inline
sono i suoi [span](./text.md#spans); il codice inline è uno span con uno [sfondo dello span](./text.md#span-backgrounds), quindi
`code: "rounded bg-neutral-100"` gli dà uno sfondo arrotondato; i link sono
[span premibili](./text.md#links); le immagini e i nodi personalizzati inline sono
[allegati inline](./text.md#inline-views-and-images). Gli stili di testo sulla radice passano a ogni parte, come
gli [stili di testo](./text.md#text-styles) passano da un `Text` ai suoi span.

Con `selectable`, l'intero documento si seleziona come uno solo, come in una pagina web: un trascinamento (o, sui touch screen, una pressione lunga
e le maniglie) va da un paragrafo, voce di elenco, cella o blocco di codice al successivo, e Copia prende il testo di tutti
loro. Un `selectable` `TextView` si seleziona come un elemento a sé; all'interno di una
[view selezionabile](./text-selection.md), la sua selezione prosegue anche nei testi e negli altri `TextView` intorno.

Ciò che `TextView` aggiunge è il resto: la lettura di Markdown, HTML o di un documento in blocchi, le view attorno ai testi (elenchi,
citazioni, tabelle, blocchi di codice, disclosure, note a piè di pagina), lo streaming, gli stili per parte, le render function e le estensioni.

<a id="the-document"></a>

## Il documento

Il contenuto è una di tre prop, lette in quest'ordine:

- **`markdown`**: CommonMark con le aggiunte di GitHub (tabelle, liste di attività, testo barrato, autolink, note a piè di pagina, alert),
  formule (`$…$` e `$$…$$`) e HTML dentro il Markdown.
- **`html`**: HTML come lo mostra un lettore. Testo, struttura e formattazione inline passano; script, stili, controlli di form
  ed elementi nascosti restano fuori. Funzionano sia un frammento sia una pagina intera (di una pagina viene mostrato il body).
- **`document`**: blocchi che l'app costruisce o conserva: oggetti semplici in TSX, `nsh_base::text_view::Document` in Rust
  ([Il modello del documento](#the-document-model)).

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

`TextView` cresce con il suo contenuto. Mettilo in uno [`Scroll`](./scroll.md) (o in una riga di una [`List`](./list.md)) per i documenti
lunghi.

<a id="styling-the-parts"></a>

## Stile delle parti

`class` e `style` definiscono lo stile della radice, una colonna di blocchi; gli stili di testo impostati lì (colore, dimensione, font) passano a ogni
parte. La radice è anche la parte `root`: `styles.root` accetta stili di testo con i loro tipi (`style` è tipizzato come quello di una
view) e `classes.root` classi. `classes` accetta classi Tailwind per parte e `styles` stili inline per parte. Le classi di una parte vengono dopo i suoi stili
predefiniti, quindi prevalgono; i suoi `styles` prevalgono sulle sue classi. In Rust, le parti accettano stili tipizzati: `TextViewParts`
dà a ogni `TextViewPart` una funzione che ne rifinisce lo stile, per ogni `TextView` sotto la view che lo fornisce
([Stili tipizzati per parte](#typed-part-styles)), e la radice accetta i metodi di stile. Le altezze di riga nei valori predefiniti sono espresse in punti: una
classe che cambia la dimensione di una parte ne imposta anche l'altezza di riga (lo fanno le classi `text-*` di Tailwind).

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

Alcuni nodi sono composti da più parti, che si applicano in ordine: un titolo di livello 2 è `heading` poi `heading2`; un alert è
`blockquote`, `alert`, poi il suo tipo (`alertNote`, ...); un marcatore di attività è `listMarker`, `taskMarker`, poi
`taskMarkerChecked` quando è completata; la riga d'intestazione è `tableRow` poi `tableHead`, e le sue celle `tableCell` poi
`tableHeaderCell`.

| Parte | Rust | Cos'è |
|---|---|---|
| `root` | `Root` | La text view stessa, una colonna dei suoi blocchi; gli stili di testo qui passano a ogni parte. |
| `paragraph` | `Paragraph` | Ogni paragrafo. |
| `heading` | `Heading` | Ogni titolo, prima della parte del suo livello. |
| `heading1` … `heading6` | `Heading1` … `Heading6` | Titoli di quel livello (27, 20, 17, poi 15pt, semibold). |
| `blockquote` | `Blockquote` | Citazioni e alert: una colonna dei loro blocchi con una linea a lato. |
| `alert` | `Alert` | Ogni alert (`> [!NOTE]`), dopo `blockquote`: un riquadro colorato, una riga con la sua icona e i suoi blocchi. |
| `alertNote`, `alertTip`, `alertImportant`, `alertWarning`, `alertCaution` | `AlertNote`, `AlertTip`, `AlertImportant`, `AlertWarning`, `AlertCaution` | Alert di quel tipo. |
| `alertIcon` | `AlertIcon` | L'icona di un alert: un anello con un glifo nel colore dell'alert. |
| `list` | `List` | Ogni elenco: una colonna delle sue voci. |
| `orderedList`, `unorderedList` | `OrderedList`, `UnorderedList` | Elenchi numerati e puntati, dopo `list`. |
| `listItem` | `ListItem` | Ogni voce: una riga con il suo marcatore e i suoi blocchi. |
| `listMarker` | `ListMarker` | Il marcatore di una voce (`•`, `◦`, `▪` in base alla profondità, oppure `1.`), allineato a destra nel rientro prima della voce. |
| `taskMarker` | `TaskMarker` | Il marcatore di una voce di attività: una casella disegnata come view, riempita con un `✓` quando è completata; dopo `listMarker`. |
| `taskMarkerChecked` | `TaskMarkerChecked` | Il marcatore di una voce di attività completata, dopo `taskMarker`. |
| `listItemContent` | `ListItemContent` | La colonna dei blocchi di una voce. |
| `codeBlock` | `CodeBlock` | Blocchi di codice: un riquadro con bordo e angoli arrotondati contenente il codice, con l'intestazione sopra. |
| `codeBlockHeader` | `CodeBlockHeader` | La riga delle azioni di un blocco di codice (`codeBlockActions`), sovrapposta all'angolo in alto a destra. |
| `codeBlockScroll` | `CodeBlockScroll` | La scroll view orizzontale attorno al codice di un blocco di codice. |
| `codeBlockCode` | `CodeBlockCode` | Il codice di un blocco di codice (monospace, così com'è scritto). |
| `code` | `Code` | Codice nel testo (monospace, su sfondo arrotondato). |
| `keyboard` | `Keyboard` | Tasti (`<kbd>`, come codice). |
| `strong` | `Strong` | Testo in grassetto (semibold). |
| `emphasis` | `Emphasis` | Testo enfatizzato (corsivo). |
| `strikethrough` | `Strikethrough` | Testo barrato. |
| `underline` | `Underline` | Testo sottolineato (`<u>`, `<ins>`). |
| `highlight` | `Highlight` | Testo evidenziato (`<mark>`, su giallo arrotondato). |
| `superscript`, `subscript` | `Superscript`, `Subscript` | Apice e pedice (più piccoli). |
| `link` | `Link` | Link (nel colore `primary` del tema, sottolineati). |
| `image` | `Image` | Immagini. |
| `math` | `Math` | Formule nel testo, composte quando non c'è `renderMath`. |
| `mathBlock` | `MathBlock` | Blocchi di formula, composti e centrati quando non c'è `renderMath`. |
| `table` | `Table` | Tabelle: il contenuto di `renderTableActions`, poi la scroll view delle celle. |
| `tableScroll` | `TableScroll` | La scroll view orizzontale delle celle di una tabella: le colonne si adattano al contenuto quando c'è spazio, vanno a capo fino a un minimo quando la view è più stretta e, oltre quel limite, la tabella scorre. |
| `tableRow` | `TableRow` | Ogni riga di una tabella: una view dietro le sue celle, per sfondi e bordi (gli stili di testo vanno su `tableCell`). |
| `tableHead` | `TableHead` | La riga d'intestazione, dopo `tableRow`. |
| `tableCell` | `TableCell` | Ogni cella. |
| `tableHeaderCell` | `TableHeaderCell` | Le celle della riga d'intestazione (più piccole, attenuate), dopo `tableCell`. |
| `rule` | `Rule` | Interruzioni tematiche: una linea disegnata come bordo superiore. |
| `details` | `Details` | Disclosure (`<details>`). |
| `summary` | `Summary` | Il sommario di una disclosure; una pressione la apre e la chiude. |
| `summaryMarker` | `SummaryMarker` | Il marcatore di un sommario (`▸`, `▾`). |
| `footnotes` | `Footnotes` | Le note a piè di pagina dopo i blocchi: una colonna. |
| `footnote` | `Footnote` | Una nota a piè di pagina: una riga con il suo numero e i suoi blocchi. |
| `footnoteLabel` | `FootnoteLabel` | Il numero di una nota a piè di pagina. |
| `footnoteReference` | `FootnoteReference` | Un riferimento a una nota a piè di pagina nel testo (il suo numero, più piccolo). |
| `custom` | `Custom` | Nodi personalizzati mostrati come il loro contenuto (quando nessuna render function li mostra). |

<a id="streaming-ai-replies"></a>

## Risposte AI in streaming

Passa la risposta mentre cresce, con `options={{ streaming: true }}` (`MarkdownOptions { streaming: true, .. }` in Rust). La fine di un testo che sta ancora arrivando lascia spesso
la sintassi aperta (`**bold`, `` `code ``, `[un link](htt`, a table whose header just arrived); lo streaming la mostra come
apparirà una volta chiusa, così il lettore non vede mai `**` o `[` spaiati. I blocchi sono mantenuti per posizione: i blocchi completi
conservano le proprie view e solo il blocco in scrittura viene ricreato, quindi una risposta lunga resta economica da aggiornare.

`streamingCaret` segue la fine del documento: inline alla fine dell'ultimo testo, ovunque termini l'ultimo blocco (un
paragrafo, una voce di elenco, un blocco di codice, l'ultima cella di una tabella), altrimenti su una riga a sé dopo l'ultimo blocco (una linea,
il contenuto di una render function). Rimuovilo quando la risposta è completa.

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

Il cursore è una view dell'app stessa, quindi può lampeggiare o pulsare con l'[API di animazione di `nsh`](../modules/nsh.md#animation), e i nuovi
blocchi possono comparire in dissolvenza con le animazioni dell'app.

<a id="links"></a>

## Link

I link sono [span premibili](./text.md#links). Una pressione su uno di essi chiama `onLinkPress` con `{ url }`; è l'app a decidere cosa aprire (una pagina propria, un
[`WebView`](./web-view.md), uno scorrimento fino a un titolo). I titoli hanno ancore (quelle di GitHub: `## Getting started` diventa
`#getting-started`), quindi un link a `#getting-started` arriva come quella stringa, e un riferimento a una nota a piè di pagina arriva come
`#footnote-<label>`.

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

`scroll_to_anchor` e `open_web` (`scrollToAnchor` e `nav` in TSX) rappresentano le funzioni proprie dell'app.

Con `links="open"`, una pressione su un link verso un altro sito o un'altra app (un URL con uno schema: `https:`, `mailto:`, ...) lo
apre anche fuori dall'app con [`openUrl`](../modules/nsh.md#openurl), con la capability `openUrl` dell'app,
dopo che `onLinkPress` lo ha segnalato; le ancore nel documento (`#…`) vengono solo segnalate. Il valore predefinito, `"report"`, non apre
nulla.

```rust tabs
use nsh_base::{TextViewLinks, text_view};

text_view().markdown(doc).links(TextViewLinks::Open)
```

```tsx tabs
<TextView markdown={doc} links="open" />
```

<a id="render-functions"></a>

## Render function

Le render function inseriscono il contenuto dell'app nel documento. Ognuna riceve il valore di una parte e restituisce il suo contenuto (JSX in TSX, un elemento in Rust); una
parte conserva ciò che è stato renderizzato per lei finché il suo valore resta lo stesso, quindi durante lo streaming solo la parte in scrittura viene
renderizzata di nuovo.

| Prop | Rust | Valore | Sostituisce o aggiunge |
|---|---|---|---|
| `renderCodeBlock` | `.render_code_block(\|code\| ..)` | `TextViewCodeBlock` (`CodeBlock`) | Sostituisce un blocco di codice (syntax highlighting personalizzato). |
| `renderCodeBlockAction` | `.render_code_block_action(\|action\| ..)` | `TextViewCodeAction` | L'icona di un'azione dell'app su un blocco di codice (`codeBlockActions`); il pulsante attorno è di `TextView`. |
| `renderTableActions` | `.render_table_actions(\|table\| ..)` | `TextViewTable` (`Table`) | Aggiunge contenuto sopra una tabella (copia, esporta). |
| `renderMath` | `.render_math(\|math\| ..)` | `TextViewMath` | Sostituisce una formula: `{ tex, display }`, `display` per un blocco `$$…$$`. |
| `renderImage` | `.render_image(\|image\| ..)` | `TextViewImage` (`Image`) | Sostituisce un'immagine (`{ src, alt, title }`): caricamento, dimensionamento propri, un viewer alla pressione. |
| `renderCustom` | `.render_custom(\|node\| ..)` | `TextViewCustomNode` (`CustomNode`) | Mostra un nodo personalizzato, in base al suo `name` ([Estensioni Markdown](#markdown-extensions)). |

I blocchi di codice portano azioni sul loro angolo in alto a destra, tutte disegnate allo stesso modo: pulsanti ghost il cui sfondo compare al passaggio del mouse o alla pressione, visibili mentre un puntatore è sopra il blocco su desktop e sempre sui touch screen. `copy` è integrata: copia il codice e mostra per un istante un segno di spunta. Le altre azioni sono dell'app: `renderCodeBlockAction` ne disegna
l'icona e `onCodeBlockAction` ne segnala le pressioni (anche per la `copy` integrata, dopo che ha copiato). `copy` scrive negli
appunti come fa `Clipboard`, quindi richiede la capability `clipboard` dell'app (`nsh.json`).

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

I blocchi di codice sono evidenziati di default: per un linguaggio indicato sulla fence (`ts`, `tsx`, `rust`, `python`, `bash`,
`json`, `toml`, `yaml`, `diff` e circa duecento altri), il codice appare con la palette di codice di Allsum, chiara o scura in base
all'aspetto; un blocco senza linguaggio appare in testo semplice. Un'app con un'evidenziazione propria mostra il proprio codice con
`renderCodeBlock`, da un proprio componente o da uno dei suoi crate Rust; una view Rust dà a `TextView` il suo highlighter con
[`CodeHighlighter`](#syntax-highlighting). Ecco codice con l'evidenziazione propria dell'app e un'immagine che riempie la
larghezza:

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

`Highlighted` e `MathView` (`highlighted` e `math_view` in Rust) rappresentano i componenti propri dell'app (un
highlighter, un renderer di formule o un componente del suo crate Rust). Senza `renderMath`, `TextView` compone da sé una formula (parti `math` e `mathBlock`) con il supporto TeX e i font di KaTeX, nel colore del testo, in modo identico su ogni piattaforma; il TeX che non riesce a leggere appare come sorgente in monospace.
<a id="markdown-extensions"></a>

## Estensioni Markdown

`extensions` trasforma la sintassi propria dell'app in nodi personalizzati, che `renderCustom` mostra. Ogni estensione ha un `name`
(il `name` dei nodi che crea) e uno di quattro tipi di sintassi:

| Tipo | Rust | Corrisponde a | Il nodo |
|---|---|---|---|
| `pattern` | `MarkdownExtension::pattern(name, regex)` | Un'espressione regolare nel testo (sintassi `regex` di Rust), fuori da codice e link | Inline; `text` è la corrispondenza, `attributes` i suoi gruppi: `"1"`, `"2"`, … e i gruppi con nome per nome |
| `language` | `MarkdownExtension::language(name, language)` | Blocchi di codice recintati di quel linguaggio (```` ```chart ````) | A block; `text` is the code, `attributes.meta` il resto della info string | |
| `tag` | `MarkdownExtension::tag(name, tag)` | Elementi HTML o MDX con quel tag, in qualsiasi combinazione di maiuscole e minuscole (`<Callout kind="tip">`) | I suoi attributi, il suo contenuto analizzato: `children` (blocchi) per un elemento su righe proprie, `content` (inline) dentro il testo |
| `container` | `MarkdownExtension::container(name, container)` | Contenitori `:::name` … `:::` | Un blocco del Markdown al suo interno (`children`); `:::note[Heads up]` dà `attributes.label`, `{key=value}` gli altri attributi |

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

`BarChart` (`bar_chart` in Rust) rappresenta il grafico proprio dell'app. Il gruppo del pattern di menzione si trova in
`node.attributes?.["1"]` (`node.attributes["1"]` in Rust: `ada`) e l'intera corrispondenza in `node.text` (`@ada`). Un nodo personalizzato senza funzione di rendering mostra il suo contenuto.
Una view restituita per un nodo inline (un chip) si posiziona nella sua riga secondo il proprio `verticalAlign`: `align-middle`
(`verticalAlign: "middle"`) la centra sul testo, e la sua riga mantiene il `lineHeight` del paragrafo, a meno che la view non sia più alta.

<a id="options"></a>

### Opzioni

`options` sceglie la sintassi Markdown letta oltre a CommonMark e a quella di GitHub; in Rust è una `MarkdownOptions` con gli
stessi campi (`MarkdownOptions { streaming: true, ..Default::default() }`):

| Chiave | Tipo | Predefinito | Descrizione |
|---|---|---|---|
| `math` | `boolean` | `true` | Formule: `$…$` nel testo, blocchi `$$…$$`. |
| `html` | `boolean` | `true` | L'HTML dentro il Markdown viene letto come lo legge la prop `html`; `false` lo mostra come testo. |
| `alerts` | `boolean` | `true` | Gli alert di GitHub: `> [!NOTE]`, `[!TIP]`, `[!IMPORTANT]`, `[!WARNING]`, `[!CAUTION]`. |
| `frontmatter` | `boolean` | `false` | Il front matter YAML (`---` … `---` all'inizio) diventa un nodo personalizzato `frontmatter` il cui `text` è lo YAML. |
| `mdx` | `boolean` | `false` | MDX: gli elementi JSX sono nodi personalizzati col nome del loro tag, i nodi personalizzati `{expressions}` `expression`; l'HTML grezzo viene allora letto come testo. |
| `streaming` | `boolean` | `false` | Il testo sta ancora arrivando: la sintassi che la sua fine lascia aperta viene mostrata come se fosse chiusa. |

<a id="the-document-model"></a>

## Il modello del documento

La prop `document` e i valori delle funzioni di rendering sono oggetti semplici, ciascun nodo contrassegnato dal suo `type`. I tipi
provengono da `nsh/base`: `TextViewDocument`, `TextViewBlock`, `TextViewInline`, `TextViewCodeBlock`, `TextViewTable`,
`TextViewListItem`, `TextViewImage`, `TextViewFootnote`, `TextViewAlert` e `TextViewCustomNode`. In Rust sono
i tipi di `nsh_base::text_view` (`Document`, `Block`, `Inline`, `CodeBlock`, `Table`, `ListItem`, `Image`,
`Footnote`, `Alert`, `CustomNode`): `Block` e `Inline` sono enum le cui varianti sono i tipi qui sotto in PascalCase
(`Block::Heading { level, content, anchor }`, `Inline::Strong { content }`), con gli stessi campi in snake case.

| Blocco `type` | Campi |
|---|---|
| `paragraph` | `content` |
| `heading` | `level` (1–6), `content`, `anchor?` |
| `blockquote` | `children`, `alert?` (`"note"`, `"tip"`, `"important"`, `"warning"`, `"caution"`) |
| `list` | `ordered?`, `start?`, `loose?`, `items` (`{ checked?, children }`) |
| `codeBlock` | `language?`, `meta?`, `code` |
| `math` | `tex` |
| `table` | `align?` (`"none"`, `"left"`, `"center"`, `"right"` per colonna), `head` (celle), `rows?` (righe di celle); una cella è `{ content }` |
| `rule` | |
| `details` | `open?`, `summary` (inline), `children` |
| `custom` | `name`, `attributes?`, `text?`, `data?`, `children?`, `content?` |

| Inline `type` | Campi |
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
| `custom` | come per il blocco |

Un documento ha anche `footnotes?`: `{ label, index, children }`, mostrate dopo i blocchi nell'ordine del loro primo
riferimento. Un'app può memorizzare le risposte come documenti, costruirli a partire dai propri dati, oppure mescolare nodi personalizzati che
`renderCustom` mostra.

<a id="parsing-and-plain-text"></a>

### Parsing e testo semplice

`TextView` legge anche i documenti senza mostrarli, in modo sincrono:

| Funzione | Rust | Restituisce |
|---|---|---|
| `TextView.parse(markdown, options?, extensions?)` | `TextView::parse(markdown, options, extensions)` | Il `TextViewDocument` che la prop `markdown` mostrerebbe. |
| `TextView.parseHtml(html, extensions?)` | `TextView::parse_html(html, extensions)` | Il `TextViewDocument` che la prop `html` mostrerebbe. |
| `TextView.plainText(document)` | `TextView::plain_text(document)`, `Document::plain_text()` | Il testo del documento senza markup: blocchi separati da righe vuote, elementi di elenco e righe di tabella da interruzioni di riga, celle da tabulazioni. |

Un pulsante di copia per un'intera risposta:

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

Un'app può anche eseguire il parsing una sola volta e conservare il documento (`document={doc}`), oppure modificarlo prima di mostrarlo.

## In Rust

Le view Rust usano lo stesso componente del crate `nsh-base`, con gli esempi sopra nelle loro schede Rust. Tre cose
sono proprie di Rust: l'highlighter dell'app, gli stili tipizzati per parte e i plugin Markdown, ciascuno fornito a ogni `TextView` sottostante
a una view con `provide_context`. I tipi del documento si trovano sotto `nsh_base::text_view`, dove `Parser` legge anche
documenti con plugin (`Parser::new().plugin(..).markdown(source)`).

<a id="syntax-highlighting"></a>

### Evidenziazione della sintassi

`TextView` evidenzia il codice con syntect nella palette di codice di Allsum (feature `highlight` di `nsh-base`, attiva per impostazione predefinita);
un blocco grande viene mostrato subito in testo semplice e prende i suoi colori quando un thread in background lo ha evidenziato.
`CodeHighlighter` è l'highlighter dell'app al suo posto, fornito a ogni `TextView` sottostante a una view con `provide_context`.
Riceve ogni blocco di codice e restituisce gli stili degli intervalli di byte del suo codice (in ordine, senza sovrapposizioni; ciò che
lasciano fuori resta semplice); `TextView` mostra il codice come span con quegli stili, dentro il suo consueto blocco di codice (intestazione, azioni,
scroll view, parti). L'highlighter può essere qualsiasi cosa che trasformi il codice in intervalli stilizzati: `tree-sitter`, syntect con
un tema proprio dell'app, ...

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

`my_syntect::ranges` rappresenta il collegamento dell'app al proprio highlighter e `messages` la view della chat dell'app.
`renderCodeBlock`, quando fornito, mostra il blocco di codice al posto di tutto questo.

<a id="typed-part-styles"></a>

### Stili tipizzati per parte

`TextViewParts` applica lo stile alle parti con stili tipizzati invece di stringhe di classi, per le view Rust: ciascun `TextViewPart` (uno per
parte della [tabella sopra](#styling-the-parts)) riceve una funzione che raffina il suo `StyleRefinement`. Forniti con
`provide_context`, si applicano a ogni `TextView` sottostante, prima del suo `classes` e del suo `styles`; i colori del tema letti al loro interno
seguono l'aspetto chiaro e scuro.

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

### Plugin Markdown

Un `MarkdownPlugin` legge la sintassi Markdown in Rust: riceve ogni nodo dell'albero sintattico (`mdast` di markdown-rs) prima che
il parser lo legga, e restituisce un contenuto a blocchi o inline proprio, di solito un `CustomNode`; può anche mostrare i
nodi personalizzati che crea. Una view fornisce i plugin a ogni `TextView` sottostante:

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

Viene prima il `render` di un plugin, poi `renderCustom`, poi il contenuto del nodo. `configure` attiva altra
sintassi di markdown-rs, e `ParseContext` legge i figli di un nodo come fa il parser.

## Props

| Prop | Rust | Tipo | Predefinito | Descrizione |
|---|---|---|---|---|
| `markdown` | `.markdown(..)` | `string` | | Il documento come Markdown. |
| `html` | `.html(..)` | `string` | | Il documento come HTML, quando `markdown` non è fornito. |
| `document` | `.document(..)` | `TextViewDocument` | | Il documento come blocchi, quando non sono forniti né `markdown` né `html`. |
| `options` | `.options(..)` | `MarkdownOptions` | tutti i valori predefiniti | La sintassi Markdown letta ([Opzioni](#options)). |
| `extensions` | `.extensions(..)` | `MarkdownExtension[]` | `[]` | La sintassi dell'app, come nodi personalizzati ([Estensioni Markdown](#markdown-extensions)). |
| `classes` | `.classes(..)` | `TextViewClasses` | `{}` | Classi Tailwind per parte. |
| `styles` | `.styles(..)` | `TextViewStyles` | `{}` | Stili inline per parte (ciascuno un `StyleProp<TextStyle>`), sopra le classi. |
| `selectable` | `.selectable(..)` | `boolean` | `false` | Il documento è selezionabile come un tutto unico: una selezione attraversa paragrafi, intestazioni, celle e blocchi di codice ([Selezione del testo](./text-selection.md)). |
| `links` | `.links(..)` | `"report" \| "open"` | `"report"` | Cosa fa la pressione su un link: lo segnala (`onLinkPress`) e, con `"open"`, apre anche un link a un altro sito o app fuori dall'app ([Link](#links)). |
| `codeBlockScrollbar` | `.code_block_scrollbar(..)` | `boolean` | `true` | I blocchi di codice mostrano il loro indicatore di scorrimento orizzontale. |
| `tableScrollbar` | `.table_scrollbar(..)` | `boolean` | `true` | Le tabelle mostrano il loro indicatore di scorrimento orizzontale. |
| `streamingCaret` | `.streaming_caret(..)` | `JSX.Element` | | Mostrato alla fine del documento: inline dopo l'ultimo testo, altrimenti su una riga propria. |
| `renderCustom` | `.render_custom(\|node\| ..)` | `(node: TextViewCustomNode) => JSX.Element` | | Mostra i nodi personalizzati. |
| `renderCodeBlock` | `.render_code_block(\|code\| ..)` | `(code: TextViewCodeBlock) => JSX.Element` | | Mostra i blocchi di codice. |
| `codeBlockActions` | `.code_block_actions(..)` | `TextViewCodeAction[]` | `[]` | Le azioni sull'angolo in alto a destra di ogni blocco di codice: `{ id: "copy" }` integrate, le altre dell'app. |
| `renderCodeBlockAction` | `.render_code_block_action(\|action\| ..)` | `(action: TextViewCodeAction) => JSX.Element` | | L'icona di un'azione dell'app. |
| `renderTableActions` | `.render_table_actions(\|table\| ..)` | `(table: TextViewTable) => JSX.Element` | | Contenuto sopra ogni tabella. |
| `renderMath` | `.render_math(\|math\| ..)` | `(math: TextViewMath) => JSX.Element` | | Mostra le formule. |
| `renderImage` | `.render_image(\|image\| ..)` | `(image: TextViewImage) => JSX.Element` | | Mostra le immagini. |
| `class`, `style` | metodi di stile | `string`, `StyleProp<ViewStyle>` | | La radice, una colonna dei blocchi; i suoi stili di testo passano a ogni parte (stili di testo tipizzati: `styles.root`). |

In Rust le classi e gli stili per parte sono `TextViewClasses` e `TextViewStyles`; una view Rust di solito applica lo stile alle
parti con [`TextViewParts`](#typed-part-styles).

<a id="events"></a>

## Eventi

| Evento | Rust | Descrizione |
|---|---|---|
| `onLinkPress` | `.on_link_press(\|event: &TextViewLinkPressEvent\| ..)` | Un link è stato premuto: `{ url }`: il suo URL, `#anchor` per un'intestazione, `#footnote-<label>` per una nota a piè di pagina. |
| `onCodeBlockAction` | `.on_code_block_action(\|event: &TextViewCodeActionEvent\| ..)` | È stata premuta un'azione di un blocco di codice (dopo che `copy` ha copiato). |
| `onImagePress` | `.on_image_press(\|image: &Image\| ..)` | È stata premuta un'immagine non contenuta in un link: `{ image }`, affinché l'app la mostri più grande (un proprio visualizzatore con zoom). |

<a id="accessibility"></a>

## Accessibilità

Gli screen reader leggono il documento in ordine, testo per testo. `TextView` assegna alla struttura i suoi ruoli: le intestazioni sono
header, i link sono link (il loro titolo è il suggerimento), i marcatori delle attività sono checkbox con il loro stato di selezione, il
summary di un disclosure è un pulsante che indica se è espanso, e le immagini sono lette tramite il loro testo alternativo.

<a id="related"></a>

## Correlati

- [Text](./text.md): l'elemento che è ogni testo di `TextView`, con i suoi span, link, allegati inline e selezione.
- [Selezione del testo](./text-selection.md): una sola selezione attraverso più `TextView` e testi.
- [`nsh/base`](../modules/nsh-base.md): gli altri componenti di base.
- [Styling](../docs/styling.md) e [Tailwind](../docs/tailwind.md).
