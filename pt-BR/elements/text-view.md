---
title: "TextView"
description: "O componente TextView: Markdown, HTML ou um documento de blocos exibido com texto e views nativos, estilizado parte por parte, para respostas de chat de IA, artigos e páginas de ajuda."
group: base
demo: text-view
source_hash: d73c7be1682f9cf4
---


# TextView

`TextView` exibe um documento escrito em Markdown, em HTML ou como blocos que o app monta: títulos, parágrafos, ênfase, links, listas e listas de tarefas, citações e alertas do GitHub, código, tabelas, imagens, fórmulas, notas de rodapé e disclosures. Ele foi feito para as respostas de modelos de IA em um chat: a resposta chega em streaming como Markdown, e cada trecho mostra o texto com a formatação já aplicada. O parsing acontece em Rust, e o documento é desenhado com elementos [`Text`](./text.md) e views.

Ele tem comportamento próprio e traz uma tipografia de leitura própria: texto de 15pt em linhas generosas de 25,5pt, títulos em semibold com espaço acima, links sublinhados na cor `primary` do tema, código em `font-mono` do tema numa caixa com borda e cantos arredondados, tabelas com linhas em todos os lados e uma linha de cabeçalho tingida, citações com uma linha ao lado e alertas como caixas tingidas com um ícone nas cores de alerta do GitHub. Suas cores são os tokens do tema (`foreground`, `muted-foreground`, `border`, `muted`, `primary` e `destructive` para um alerta de cautela), então um tema e a aparência escura chegam até ele. Cada parte recebe os estilos do app sobre esses padrões: `classes` e `styles` em TSX, estilos tipados por parte (`TextViewParts`) em Rust. Em Rust, cria-se um com `nsh_base::text_view()`; em TSX, com `<TextView>` de `nsh/base`.

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

Em Rust, `text_view()` cria um assim como `view()` cria uma view: um setter por prop (`.markdown(..)`, `.options(..)`, `.selectable(..)`), um closure por função de renderização (`.render_image(|image| ..)`), um listener por evento (`.on_link_press(..)`) e os métodos de estilo tipados para a raiz (`.p_5()`, `.text_color(..)`), cujos estilos de texto passam para todas as partes.

<a id="built-on-text"></a>

## Construído sobre Text

`TextView` é feito de elementos [`Text`](./text.md), e seu texto se comporta exatamente como a página de Text descreve. Cada parágrafo, título, célula de tabela e bloco de código é um `Text` nativo: um bloco que faz layout, quebra linhas, acompanha a escala da fonte e, com `selectable`, seleciona e copia. Strong, emphasis, tachado e as demais marcas inline são seus [spans](./text.md#spans); o código inline é um span com [fundo de span](./text.md#span-backgrounds), de modo que `code: "rounded bg-neutral-100"` lhe dá um fundo arredondado; os links são [spans pressionáveis](./text.md#links); imagens e nós personalizados inline são [anexos inline](./text.md#inline-views-and-images). Os estilos de texto na raiz passam para todas as partes, assim como os [estilos de texto](./text.md#text-styles) passam de um `Text` para seus spans.

Com `selectable`, o documento inteiro é selecionado como um só, como uma página web: um arrasto (ou, em telas de toque, um toque longo e as alças) vai de um parágrafo, item de lista, célula ou bloco de código ao seguinte, e Copiar leva o texto de todos eles. Um `selectable` `TextView` seleciona como um só por conta própria; dentro de uma [view selecionável](./text-selection.md), sua seleção também continua pelos textos e outras `TextView`s ao redor.

O que `TextView` acrescenta é o resto: ler Markdown, HTML ou um documento em blocos, as views ao redor dos textos (listas, citações, tabelas, blocos de código, disclosures, notas de rodapé), streaming, estilos por parte, funções de renderização e extensões.

<a id="the-document"></a>

## O documento

O conteúdo vem de uma entre três props, lidas nesta ordem:

- **`markdown`**: CommonMark com as adições do GitHub (tabelas, listas de tarefas, tachado, autolinks, notas de rodapé, alertas), fórmulas (`$…$` e `$$…$$`) e HTML dentro do Markdown.
- **`html`**: HTML como um leitor o mostra. Texto, estrutura e formatação inline passam; scripts, estilos, controles de formulário e elementos ocultos ficam de fora. Um fragmento ou uma página inteira funcionam (uma página mostra seu body).
- **`document`**: blocos que o app monta ou mantém: objetos simples em TSX, `nsh_base::text_view::Document` em Rust ([O modelo de documento](#the-document-model)).

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

`TextView` cresce com o seu conteúdo. Coloque-o em um [`Scroll`](./scroll.md) (ou em uma linha de um [`List`](./list.md)) para documentos longos.

<a id="styling-the-parts"></a>

## Estilizando as partes

`class` e `style` estilizam a raiz, uma coluna dos blocos; os estilos de texto definidos ali (cor, tamanho, fonte) passam para todas as partes. A raiz também é a parte `root`: `styles.root` recebe estilos de texto com seus tipos (`style` é tipado como o de uma view) e `classes.root` classes. `classes` recebe classes do Tailwind por parte e `styles` recebe estilos inline por parte. As classes de uma parte vêm depois dos estilos padrão dela, então prevalecem sobre eles; seus `styles` prevalecem sobre as classes. Em Rust, as partes recebem estilos tipados: `TextViewParts` dá a cada `TextViewPart` uma função que refina seu estilo, para todo `TextView` abaixo da view que o fornece ([Estilos tipados por parte](#typed-part-styles)), e a raiz recebe os métodos de estilo. As alturas de linha nos padrões são definidas em pontos: uma classe que muda o tamanho de uma parte também define sua altura de linha (as classes `text-*` do Tailwind fazem isso).

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

Alguns nós são várias partes, aplicadas em ordem: um título de nível 2 é `heading` e depois `heading2`; um alerta é `blockquote`, `alert` e depois o seu tipo (`alertNote`, ...); um marcador de tarefa é `listMarker`, `taskMarker` e depois `taskMarkerChecked` quando concluída; a linha de cabeçalho é `tableRow` e depois `tableHead`, e suas células `tableCell` e depois `tableHeaderCell`.

| Parte | Rust | O que é |
|---|---|---|
| `root` | `Root` | A própria view de texto, uma coluna de seus blocos; os estilos de texto aqui passam para todas as partes. |
| `paragraph` | `Paragraph` | Todo parágrafo. |
| `heading` | `Heading` | Todo título, antes da parte do seu nível. |
| `heading1` … `heading6` | `Heading1` … `Heading6` | Títulos desse nível (27, 20, 17 e depois 15pt, semibold). |
| `blockquote` | `Blockquote` | Citações e alertas: uma coluna de seus blocos com uma linha ao lado. |
| `alert` | `Alert` | Todo alerta (`> [!NOTE]`), depois de `blockquote`: uma caixa tingida, uma linha com seu ícone e seus blocos. |
| `alertNote`, `alertTip`, `alertImportant`, `alertWarning`, `alertCaution` | `AlertNote`, `AlertTip`, `AlertImportant`, `AlertWarning`, `AlertCaution` | Alertas desse tipo. |
| `alertIcon` | `AlertIcon` | O ícone de um alerta: um anel com um glifo na cor do alerta. |
| `list` | `List` | Toda lista: uma coluna de seus itens. |
| `orderedList`, `unorderedList` | `OrderedList`, `UnorderedList` | Listas numeradas e com marcadores, depois de `list`. |
| `listItem` | `ListItem` | Todo item: uma linha com seu marcador e seus blocos. |
| `listMarker` | `ListMarker` | O marcador de um item (`•`, `◦`, `▪` conforme a profundidade, ou `1.`), alinhado à direita no recuo antes do item. |
| `taskMarker` | `TaskMarker` | O marcador de um item de tarefa: uma caixa desenhada como uma view, preenchida com um `✓` quando concluída; depois de `listMarker`. |
| `taskMarkerChecked` | `TaskMarkerChecked` | O marcador de um item de tarefa concluído, depois de `taskMarker`. |
| `listItemContent` | `ListItemContent` | A coluna dos blocos de um item. |
| `codeBlock` | `CodeBlock` | Blocos de código: uma caixa com borda e cantos arredondados para o código, com o cabeçalho sobre ela. |
| `codeBlockHeader` | `CodeBlockHeader` | A linha das ações de um bloco de código (`codeBlockActions`), flutuando sobre o canto superior direito. |
| `codeBlockScroll` | `CodeBlockScroll` | A scroll view horizontal ao redor do código de um bloco de código. |
| `codeBlockCode` | `CodeBlockCode` | O código de um bloco de código (monoespaçado, como foi escrito). |
| `code` | `Code` | Código em texto (monoespaçado, sobre um fundo arredondado). |
| `keyboard` | `Keyboard` | Teclas (`<kbd>`, como código). |
| `strong` | `Strong` | Texto em destaque forte (semibold). |
| `emphasis` | `Emphasis` | Texto enfatizado (itálico). |
| `strikethrough` | `Strikethrough` | Texto tachado. |
| `underline` | `Underline` | Texto sublinhado (`<u>`, `<ins>`). |
| `highlight` | `Highlight` | Texto realçado (`<mark>`, sobre um amarelo arredondado). |
| `superscript`, `subscript` | `Superscript`, `Subscript` | Sobrescrito e subscrito (menores). |
| `link` | `Link` | Links (na cor `primary` do tema, sublinhados). |
| `image` | `Image` | Imagens. |
| `math` | `Math` | Fórmulas em texto, tipografadas quando não há `renderMath`. |
| `mathBlock` | `MathBlock` | Blocos de fórmula, tipografados e centralizados quando não há `renderMath`. |
| `table` | `Table` | Tabelas: o conteúdo de `renderTableActions` e depois a scroll view das células. |
| `tableScroll` | `TableScroll` | A scroll view horizontal das células de uma tabela: as colunas se ajustam ao conteúdo quando há espaço, quebram linha até um mínimo quando a view é mais estreita e, além disso, a tabela rola. |
| `tableRow` | `TableRow` | Toda linha de uma tabela: uma view atrás de suas células, para fundos e bordas (os estilos de texto vão em `tableCell`). |
| `tableHead` | `TableHead` | A linha de cabeçalho, depois de `tableRow`. |
| `tableCell` | `TableCell` | Toda célula. |
| `tableHeaderCell` | `TableHeaderCell` | As células da linha de cabeçalho (menores, esmaecidas), depois de `tableCell`. |
| `rule` | `Rule` | Quebras temáticas: uma linha desenhada como uma borda superior. |
| `details` | `Details` | Disclosures (`<details>`). |
| `summary` | `Summary` | O resumo de um disclosure; um toque o abre e o fecha. |
| `summaryMarker` | `SummaryMarker` | O marcador de um resumo (`▸`, `▾`). |
| `footnotes` | `Footnotes` | As notas de rodapé depois dos blocos: uma coluna. |
| `footnote` | `Footnote` | Uma nota de rodapé: uma linha com seu número e seus blocos. |
| `footnoteLabel` | `FootnoteLabel` | O número de uma nota de rodapé. |
| `footnoteReference` | `FootnoteReference` | Uma referência a uma nota de rodapé no texto (seu número, menor). |
| `custom` | `Custom` | Nós personalizados mostrados como seu conteúdo (quando nenhuma função de renderização os mostra). |

<a id="streaming-ai-replies"></a>

## Respostas de IA em streaming

Passe a resposta conforme ela cresce, com `options={{ streaming: true }}` (`MarkdownOptions { streaming: true, .. }` em Rust). O fim de um texto que ainda está chegando muitas vezes deixa a sintaxe aberta (`**bold`, `` `code ``, `[um link](htt`, a table whose header just arrived); o streaming a mostra como ficará depois de fechada, de modo que o leitor nunca vê `**` ou `[` soltos. Os blocos são mantidos por posição: os blocos completos mantêm suas views, e só o bloco que está sendo escrito é refeito, então uma resposta longa continua barata de atualizar.

`streamingCaret` acompanha o fim do documento: inline no fim do último texto, onde quer que o último bloco termine (um parágrafo, um item de lista, um bloco de código, a última célula de uma tabela), ou então em uma linha própria depois do último bloco (uma linha horizontal, o conteúdo de uma função de renderização). Remova-o quando a resposta terminar.

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

O cursor é uma view do próprio app, então pode piscar ou pulsar com a [API de animação de `nsh`](../modules/nsh.md#animation), e novos blocos podem surgir com fade usando as animações do app.

## Links

Os links são [spans pressionáveis](./text.md#links). Um toque em um deles chama `onLinkPress` com `{ url }`; o app decide o que abrir (uma página própria, um [`WebView`](./web-view.md), uma rolagem até um título). Os títulos têm âncoras (as do GitHub: `## Getting started` vira `#getting-started`), então um link para `#getting-started` chega como essa string, e uma referência a nota de rodapé chega como `#footnote-<label>`.

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

`scroll_to_anchor` e `open_web` (`scrollToAnchor` e `nav` em TSX) representam as funções do próprio app.

Com `links="open"`, um toque em um link para outro site ou app (uma URL com esquema: `https:`, `mailto:`, ...) também o abre fora do app com [`openUrl`](../modules/nsh.md#openurl), sob a capability `openUrl` do app, depois de `onLinkPress` tê-lo reportado; as âncoras no documento (`#…`) são apenas reportadas. O padrão, `"report"`, não abre nada.

```rust tabs
use nsh_base::{TextViewLinks, text_view};

text_view().markdown(doc).links(TextViewLinks::Open)
```

```tsx tabs
<TextView markdown={doc} links="open" />
```

<a id="render-functions"></a>

## Funções de renderização

As funções de renderização colocam o conteúdo do próprio app no documento. Cada uma recebe o valor de uma parte e devolve seu conteúdo (JSX em TSX, um elemento em Rust); uma parte mantém o que foi renderizado para ela enquanto seu valor permanece o mesmo, então, durante o streaming, apenas a parte que está sendo escrita é renderizada de novo.

| Prop | Rust | Valor | Substitui ou adiciona |
|---|---|---|---|
| `renderCodeBlock` | `.render_code_block(\|code\| ..)` | `TextViewCodeBlock` (`CodeBlock`) | Substitui um bloco de código (realce de sintaxe próprio). |
| `renderCodeBlockAction` | `.render_code_block_action(\|action\| ..)` | `TextViewCodeAction` | O ícone de uma ação de bloco de código do app (`codeBlockActions`); o botão ao redor é de `TextView`. |
| `renderTableActions` | `.render_table_actions(\|table\| ..)` | `TextViewTable` (`Table`) | Adiciona conteúdo acima de uma tabela (copiar, exportar). |
| `renderMath` | `.render_math(\|math\| ..)` | `TextViewMath` | Substitui uma fórmula: `{ tex, display }`, `display` para um bloco `$$…$$`. |
| `renderImage` | `.render_image(\|image\| ..)` | `TextViewImage` (`Image`) | Substitui uma imagem (`{ src, alt, title }`): carregamento e dimensionamento próprios, um visualizador ao tocar. |
| `renderCustom` | `.render_custom(\|node\| ..)` | `TextViewCustomNode` (`CustomNode`) | Mostra um nó personalizado, pelo seu `name` ([Extensões de Markdown](#markdown-extensions)). |

Os blocos de código trazem ações sobre o canto superior direito, todas desenhadas do mesmo modo: botões ghost cujo fundo aparece ao passar o ponteiro ou ao pressionar, exibidos enquanto um ponteiro está sobre o bloco em desktops e sempre em telas de toque. `copy` já vem embutida: ela copia o código e mostra um check por um instante. As outras ações são do app: `renderCodeBlockAction` desenha o ícone delas e `onCodeBlockAction` reporta seus toques (inclusive o de `copy`, que é embutida, depois de copiar). `copy` escreve na área de transferência como `Clipboard` faz, então precisa da capability `clipboard` do app (`nsh.json`).

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

Os blocos de código já vêm com realce: para uma linguagem nomeada na cerca (`ts`, `tsx`, `rust`, `python`, `bash`, `json`, `toml`, `yaml`, `diff` e cerca de duzentas outras), o código aparece na paleta de código do Allsum, clara ou escura conforme a aparência; um bloco sem linguagem aparece sem realce. Um app com realce próprio mostra seu código com `renderCodeBlock`, a partir de um componente próprio ou de um do seu crate Rust; uma view Rust dá a `TextView` seu realçador com [`CodeHighlighter`](#syntax-highlighting). Aqui, código com realce próprio do app e uma imagem que preenche a largura:

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

`Highlighted` e `MathView` (`highlighted` e `math_view` em Rust) representam os componentes do próprio app (um realçador, um renderizador de fórmulas ou um componente do seu crate Rust). Sem `renderMath`, `TextView` tipografa uma fórmula por conta própria (as partes `math` e `mathBlock`) com o suporte a TeX e as fontes do KaTeX, na cor do texto, igual em todas as plataformas; o TeX que ele não consegue ler aparece como seu código-fonte em monoespaçado.
<a id="markdown-extensions"></a>

## Extensões de Markdown

`extensions` transforma a sintaxe do app em nós personalizados, que `renderCustom` exibe. Cada extensão tem um `name`
(o `name` dos nós que ela cria) e um de quatro tipos de sintaxe:

| Tipo | Rust | Corresponde a | O nó |
|---|---|---|---|
| `pattern` | `MarkdownExtension::pattern(name, regex)` | Uma expressão regular no texto (sintaxe `regex` do Rust), fora de código e links | Inline; `text` é a correspondência, `attributes` seus grupos: `"1"`, `"2"`, … e os grupos nomeados pelo nome |
| `language` | `MarkdownExtension::language(name, language)` | Blocos de código delimitados dessa linguagem (```` ```chart ````) | A block; `text` is the code, `attributes.meta` o restante da string de informações | |
| `tag` | `MarkdownExtension::tag(name, tag)` | Elementos HTML ou MDX dessa tag, em qualquer caixa (`<Callout kind="tip">`) | Seus atributos e seu conteúdo interpretado: `children` (blocos) para um elemento em linhas próprias, `content` (inline) dentro do texto |
| `container` | `MarkdownExtension::container(name, container)` | Contêineres `:::name` … `:::` | Um bloco com o Markdown interno (`children`); `:::note[Heads up]` fornece `attributes.label` e `{key=value}` os demais atributos |

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

`BarChart` (`bar_chart` em Rust) representa o gráfico próprio do app. O grupo do padrão de menção está em
`node.attributes?.["1"]` (`node.attributes["1"]` em Rust: `ada`) e a correspondência inteira em `node.text` (`@ada`). Um nó personalizado sem função de renderização exibe seu conteúdo.
Uma view retornada para um nó inline (um chip) se posiciona na linha por meio do próprio `verticalAlign`: `align-middle`
(`verticalAlign: "middle"`) a centraliza em relação ao texto, e a linha mantém o `lineHeight` do parágrafo, a menos que a view seja mais alta.

<a id="options"></a>

### Opções

`options` escolhe a sintaxe de Markdown lida além do CommonMark e do GitHub; em Rust é um `MarkdownOptions` com os
mesmos campos (`MarkdownOptions { streaming: true, ..Default::default() }`):

| Chave | Tipo | Padrão | Descrição |
|---|---|---|---|
| `math` | `boolean` | `true` | Fórmulas: `$…$` no texto, blocos `$$…$$`. |
| `html` | `boolean` | `true` | O HTML dentro do Markdown é lido como a prop `html` o lê; `false` o exibe como texto. |
| `alerts` | `boolean` | `true` | Alertas do GitHub: `> [!NOTE]`, `[!TIP]`, `[!IMPORTANT]`, `[!WARNING]`, `[!CAUTION]`. |
| `frontmatter` | `boolean` | `false` | O front matter em YAML (`---` … `---` no início) vira um nó personalizado `frontmatter` cujo `text` é o YAML. |
| `mdx` | `boolean` | `false` | MDX: elementos JSX são nós personalizados nomeados pela tag, nós personalizados `{expressions}` `expression`; o HTML bruto passa então a ser lido como texto. |
| `streaming` | `boolean` | `false` | O texto ainda está chegando: a sintaxe que o final deixa em aberto é exibida como se estivesse fechada. |

<a id="the-document-model"></a>

## O modelo de documento

A prop `document` e os valores das funções de renderização são objetos simples, cada nó identificado por seu `type`. Os tipos
vêm de `nsh/base`: `TextViewDocument`, `TextViewBlock`, `TextViewInline`, `TextViewCodeBlock`, `TextViewTable`,
`TextViewListItem`, `TextViewImage`, `TextViewFootnote`, `TextViewAlert` e `TextViewCustomNode`. Em Rust são
os tipos de `nsh_base::text_view` (`Document`, `Block`, `Inline`, `CodeBlock`, `Table`, `ListItem`, `Image`,
`Footnote`, `Alert`, `CustomNode`): `Block` e `Inline` são enums cujas variantes são os tipos abaixo em PascalCase
(`Block::Heading { level, content, anchor }`, `Inline::Strong { content }`), com os mesmos campos em snake case.

| Bloco `type` | Campos |
|---|---|
| `paragraph` | `content` |
| `heading` | `level` (1–6), `content`, `anchor?` |
| `blockquote` | `children`, `alert?` (`"note"`, `"tip"`, `"important"`, `"warning"`, `"caution"`) |
| `list` | `ordered?`, `start?`, `loose?`, `items` (`{ checked?, children }`) |
| `codeBlock` | `language?`, `meta?`, `code` |
| `math` | `tex` |
| `table` | `align?` (`"none"`, `"left"`, `"center"`, `"right"` por coluna), `head` (células), `rows?` (linhas de células); uma célula é `{ content }` |
| `rule` | |
| `details` | `open?`, `summary` (inline), `children` |
| `custom` | `name`, `attributes?`, `text?`, `data?`, `children?`, `content?` |

| Inline `type` | Campos |
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
| `custom` | como o bloco |

Um documento também tem `footnotes?`: `{ label, index, children }`, exibidas após os blocos na ordem da primeira
referência. Um app pode armazenar respostas como documentos, construí-las a partir de seus próprios dados ou misturar nós personalizados que
`renderCustom` exibe.

<a id="parsing-and-plain-text"></a>

### Interpretação e texto simples

`TextView` também lê documentos sem exibi-los, de forma síncrona:

| Função | Rust | Retorna |
|---|---|---|
| `TextView.parse(markdown, options?, extensions?)` | `TextView::parse(markdown, options, extensions)` | O `TextViewDocument` que a prop `markdown` exibiria. |
| `TextView.parseHtml(html, extensions?)` | `TextView::parse_html(html, extensions)` | O `TextViewDocument` que a prop `html` exibiria. |
| `TextView.plainText(document)` | `TextView::plain_text(document)`, `Document::plain_text()` | O texto do documento sem marcação: blocos separados por linhas em branco, itens de lista e linhas de tabela por quebras de linha, células por tabulações. |

Um botão de copiar para uma resposta inteira:

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

Um app também pode interpretar uma vez e guardar o documento (`document={doc}`), ou alterá-lo antes de exibi-lo.

<a id="in-rust"></a>

## Em Rust

As views em Rust usam o mesmo componente do crate `nsh-base`, com os exemplos acima nas abas de Rust. Três coisas
são específicas do Rust: o realçador do app, os estilos tipados por parte e os plugins de Markdown, cada um fornecido a todo `TextView` abaixo
de uma view com `provide_context`. Os tipos de documento ficam em `nsh_base::text_view`, onde `Parser` também lê
documentos com plugins (`Parser::new().plugin(..).markdown(source)`).

<a id="syntax-highlighting"></a>

### Realce de sintaxe

`TextView` realça o código com syntect na paleta de código do Allsum (feature `highlight` de `nsh-base`, ativada por padrão);
um bloco grande é exibido sem formatação de imediato e recebe suas cores quando uma thread em segundo plano o realça.
`CodeHighlighter` é o realçador do app em seu lugar, fornecido a todo `TextView` abaixo de uma view com `provide_context`.
Ele recebe cada bloco de código e retorna os estilos de intervalos de bytes do código (em ordem, sem sobreposição; o que ele deixa
de fora fica sem formatação); `TextView` exibe o código como spans com esses estilos, dentro do bloco de código habitual (cabeçalho, ações,
scroll view, partes). O realçador pode ser qualquer coisa que transforme código em intervalos estilizados: `tree-sitter`, syntect com
um tema do app, ...

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

`my_syntect::ranges` representa a ligação do app com o realçador e `messages` a view do chat no app.
`renderCodeBlock`, quando fornecido, exibe o bloco de código no lugar de tudo isso.

<a id="typed-part-styles"></a>

### Estilos tipados por parte

`TextViewParts` estiliza as partes com estilos tipados em vez de strings de classes, para views em Rust: cada `TextViewPart` (um por
parte da [tabela acima](#styling-the-parts)) recebe uma função que refina seu `StyleRefinement`. Fornecidos com
`provide_context`, eles se aplicam a todo `TextView` abaixo, antes de seu `classes` e `styles`; as cores do tema lidas neles
acompanham a aparência clara e escura.

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

### Plugins de Markdown

Um `MarkdownPlugin` lê a sintaxe de Markdown em Rust: ele recebe cada nó da árvore de sintaxe (`mdast` do markdown-rs) antes
de o parser lê-lo e retorna um bloco ou conteúdo inline próprio, geralmente um `CustomNode`; ele também pode exibir os
nós personalizados que cria. Uma view fornece plugins a todo `TextView` abaixo dela:

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

O `render` de um plugin vem primeiro, depois `renderCustom`, depois o conteúdo do nó. `configure` ativa mais da
sintaxe do markdown-rs, e `ParseContext` lê os filhos de um nó como o parser faz.

## Props

| Prop | Rust | Tipo | Padrão | Descrição |
|---|---|---|---|---|
| `markdown` | `.markdown(..)` | `string` | | O documento como Markdown. |
| `html` | `.html(..)` | `string` | | O documento como HTML, quando `markdown` não é fornecido. |
| `document` | `.document(..)` | `TextViewDocument` | | O documento como blocos, quando nem `markdown` nem `html` são fornecidos. |
| `options` | `.options(..)` | `MarkdownOptions` | todos os padrões | A sintaxe de Markdown lida ([Opções](#options)). |
| `extensions` | `.extensions(..)` | `MarkdownExtension[]` | `[]` | A sintaxe do app, como nós personalizados ([Extensões de Markdown](#markdown-extensions)). |
| `classes` | `.classes(..)` | `TextViewClasses` | `{}` | Classes do Tailwind por parte. |
| `styles` | `.styles(..)` | `TextViewStyles` | `{}` | Estilos inline por parte (cada um um `StyleProp<TextStyle>`), sobre as classes. |
| `selectable` | `.selectable(..)` | `boolean` | `false` | O documento é selecionável como um só: uma seleção percorre seus parágrafos, títulos, células e blocos de código ([Seleção de texto](./text-selection.md)). |
| `links` | `.links(..)` | `"report" \| "open"` | `"report"` | O que um toque em um link faz: o reporta (`onLinkPress`) e, com `"open"`, também abre fora do app um link para outro site ou app ([Links](#links)). |
| `codeBlockScrollbar` | `.code_block_scrollbar(..)` | `boolean` | `true` | Os blocos de código exibem o indicador de rolagem horizontal. |
| `tableScrollbar` | `.table_scrollbar(..)` | `boolean` | `true` | As tabelas exibem o indicador de rolagem horizontal. |
| `streamingCaret` | `.streaming_caret(..)` | `JSX.Element` | | Exibido no fim do documento: inline após o último texto; caso contrário, em linha própria. |
| `renderCustom` | `.render_custom(\|node\| ..)` | `(node: TextViewCustomNode) => JSX.Element` | | Exibe nós personalizados. |
| `renderCodeBlock` | `.render_code_block(\|code\| ..)` | `(code: TextViewCodeBlock) => JSX.Element` | | Exibe blocos de código. |
| `codeBlockActions` | `.code_block_actions(..)` | `TextViewCodeAction[]` | `[]` | As ações no canto superior direito de cada bloco de código: `{ id: "copy" }` embutidas, as demais do app. |
| `renderCodeBlockAction` | `.render_code_block_action(\|action\| ..)` | `(action: TextViewCodeAction) => JSX.Element` | | O ícone de uma ação do app. |
| `renderTableActions` | `.render_table_actions(\|table\| ..)` | `(table: TextViewTable) => JSX.Element` | | Conteúdo acima de cada tabela. |
| `renderMath` | `.render_math(\|math\| ..)` | `(math: TextViewMath) => JSX.Element` | | Exibe fórmulas. |
| `renderImage` | `.render_image(\|image\| ..)` | `(image: TextViewImage) => JSX.Element` | | Exibe imagens. |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | | A raiz, uma coluna dos blocos; seus estilos de texto passam para todas as partes (estilos de texto tipados: `styles.root`). |

Em Rust, as classes e os estilos por parte são `TextViewClasses` e `TextViewStyles`; uma view em Rust geralmente estiliza as
partes com [`TextViewParts`](#typed-part-styles).

<a id="events"></a>

## Eventos

| Evento | Rust | Descrição |
|---|---|---|
| `onLinkPress` | `.on_link_press(\|event: &TextViewLinkPressEvent\| ..)` | Um link foi pressionado: `{ url }`: sua URL, `#anchor` para um título, `#footnote-<label>` para uma nota de rodapé. |
| `onCodeBlockAction` | `.on_code_block_action(\|event: &TextViewCodeActionEvent\| ..)` | Uma ação de um bloco de código foi pressionada (depois de `copy` copiar). |
| `onImagePress` | `.on_image_press(\|image: &Image\| ..)` | Uma imagem fora de um link foi pressionada: `{ image }`, para o app exibi-la maior (um visualizador com zoom próprio). |

<a id="accessibility"></a>

## Acessibilidade

Os leitores de tela leem o documento em ordem, texto por texto. `TextView` atribui à estrutura seus papéis: títulos são
cabeçalhos, links são links (o título deles é a dica), marcadores de tarefa são caixas de seleção com seu estado marcado, o
resumo de um disclosure é um botão que informa se está expandido, e imagens são lidas pelo texto alternativo.

<a id="related"></a>

## Relacionados

- [Text](./text.md): o elemento que cada texto de `TextView` é, com seus spans, links, anexos inline e seleção.
- [Seleção de texto](./text-selection.md): uma seleção abrangendo vários `TextView`s e textos.
- [`nsh/base`](../modules/nsh-base.md): os outros componentes base.
- [Estilização](../docs/styling.md) e [Tailwind](../docs/tailwind.md).
