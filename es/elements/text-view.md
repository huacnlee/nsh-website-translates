---
title: "TextView"
description: "El componente TextView: Markdown, HTML o un documento de bloques que se muestra con texto y vistas nativos, con estilos aplicados parte por parte, para respuestas de chat con IA, artículos y páginas de ayuda."
group: base
demo: text-view
source_hash: d73c7be1682f9cf4
---


# TextView

`TextView` muestra un documento escrito en Markdown, en HTML o como bloques que construye la app: encabezados, párrafos, énfasis,
enlaces, listas y listas de tareas, citas y alertas de GitHub, código, tablas, imágenes, fórmulas, notas al pie y elementos desplegables. Está
pensado para las respuestas de los modelos de IA en un chat: la respuesta llega en streaming como Markdown y cada fragmento muestra el texto con su
formato ya aplicado. El análisis se hace en Rust y el documento se dibuja con elementos y vistas de [`Text`](./text.md).

Tiene su propio comportamiento y trae una tipografía de lectura propia: texto de 15pt con líneas generosas de 25.5pt, encabezados en semibold
con espacio por encima, enlaces subrayados con el color `primary` del tema, código con el `font-mono` del tema en una caja redondeada con borde, tablas con reglas en todos sus lados y una fila de encabezado teñida, citas con una línea lateral y
alertas como cajas teñidas con un icono en los colores de las alertas de GitHub. Sus colores son los tokens del tema (`foreground`, `muted-foreground`, `border`,
`muted`, `primary` y `destructive` para una advertencia), de modo que un tema y la apariencia oscura llegan hasta
él. Cada parte recibe los estilos de la app sobre estos valores por defecto: `classes` y `styles` en TSX, estilos tipados por parte
(`TextViewParts`) en Rust. Rust crea uno con `nsh_base::text_view()`, TSX con `<TextView>` de `nsh/base`.

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

En Rust, `text_view()` lo crea igual que `view()` crea una vista: un setter por prop (`.markdown(..)`, `.options(..)`,
`.selectable(..)`), un closure por función de renderizado (`.render_image(|image| ..)`), un listener por evento
(`.on_link_press(..)`) y los métodos de estilo tipados para su raíz (`.p_5()`, `.text_color(..)`), cuyos estilos de texto se
transmiten a todas las partes.

<a id="built-on-text"></a>

## Construido sobre Text

`TextView` está hecho de elementos [`Text`](./text.md) y su texto se comporta exactamente como describe la página de Text. Cada
párrafo, encabezado, celda de tabla y bloque de código es un `Text` nativo: un único bloque que se maqueta, ajusta líneas, sigue la escala
de fuente y, con `selectable`, se selecciona y se copia. Negrita, cursiva, tachado y las demás marcas en línea
son sus [spans](./text.md#spans); el código en línea es un span con un [fondo de span](./text.md#span-backgrounds), de modo que
`code: "rounded bg-neutral-100"` le da un fondo redondeado; los enlaces son
[spans presionables](./text.md#links); las imágenes y los nodos personalizados en línea son
[adjuntos en línea](./text.md#inline-views-and-images). Los estilos de texto de la raíz se transmiten a todas las partes, igual que los
[estilos de texto](./text.md#text-styles) pasan de un `Text` a sus spans.

Con `selectable`, todo el documento se selecciona como uno solo, como una página web: un arrastre (o, en pantallas táctiles, una pulsación larga
y los tiradores) va de un párrafo, elemento de lista, celda o bloque de código al siguiente, y Copiar toma el texto de todos
ellos. Un `selectable` `TextView` se selecciona por separado; dentro de una
[vista seleccionable](./text-selection.md), su selección también continúa hacia los textos y otros `TextView`s que lo rodean.

Lo que `TextView` añade es el resto: leer Markdown, HTML o un documento como bloques, las vistas alrededor de los textos (listas,
citas, tablas, bloques de código, elementos desplegables, notas al pie), el streaming, los estilos por parte, las funciones de renderizado y las extensiones.

<a id="the-document"></a>

## El documento

El contenido es una de tres props, leídas en este orden:

- **`markdown`**: CommonMark con las adiciones de GitHub (tablas, listas de tareas, tachado, autoenlaces, notas al pie, alertas),
  fórmulas (`$…$` y `$$…$$`) y HTML dentro del Markdown.
- **`html`**: HTML tal como lo muestra un lector. Llegan el texto, la estructura y el formato en línea; los scripts, estilos, controles
  de formulario y elementos ocultos se quedan fuera. Funcionan tanto un fragmento como una página completa (de una página se muestra su body).
- **`document`**: bloques que la app construye o conserva: objetos simples en TSX, `nsh_base::text_view::Document` en Rust
  ([El modelo del documento](#the-document-model)).

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

`TextView` crece con su contenido. Colócalo en un [`Scroll`](./scroll.md) (o en una fila de un [`List`](./list.md)) para documentos
largos.

<a id="styling-the-parts"></a>

## Estilos de las partes

`class` y `style` dan estilo a la raíz, una columna de bloques; los estilos de texto que se fijan ahí (color, tamaño, fuente) se transmiten a todas las
partes. La raíz es también la parte `root`: `styles.root` admite estilos de texto con sus tipos (`style` está tipado como el de una
vista) y `classes.root` clases. `classes` admite clases de Tailwind por parte y `styles` estilos en línea por parte. Las clases de una parte van después de sus propios
estilos por defecto, así que prevalecen; sus `styles` prevalecen sobre sus clases. En Rust, las partes admiten estilos tipados: `TextViewParts`
da a cada `TextViewPart` una función que refina su estilo, para cada `TextView` por debajo de la vista que lo proporciona
([Estilos tipados por parte](#typed-part-styles)), y la raíz admite los métodos de estilo. Las alturas de línea de los valores por defecto se fijan en puntos: una
clase que cambia el tamaño de una parte también fija su altura de línea (las clases `text-*` de Tailwind lo hacen).

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

Algunos nodos son varias partes, que se aplican en orden: un encabezado de nivel 2 es `heading` y luego `heading2`; una alerta es
`blockquote`, `alert` y luego su tipo (`alertNote`, ...); un marcador de tarea es `listMarker`, `taskMarker` y luego
`taskMarkerChecked` cuando está hecha; la fila de encabezado es `tableRow` y luego `tableHead`, y sus celdas `tableCell` y luego
`tableHeaderCell`.

| Parte | Rust | Qué es |
|---|---|---|
| `root` | `Root` | La propia vista de texto, una columna de sus bloques; los estilos de texto aquí se transmiten a todas las partes. |
| `paragraph` | `Paragraph` | Cada párrafo. |
| `heading` | `Heading` | Cada encabezado, antes de la parte de su nivel. |
| `heading1` … `heading6` | `Heading1` … `Heading6` | Encabezados de ese nivel (27, 20, 17 y luego 15pt, semibold). |
| `blockquote` | `Blockquote` | Citas y alertas: una columna de sus bloques con una línea lateral. |
| `alert` | `Alert` | Cada alerta (`> [!NOTE]`), después de `blockquote`: una caja teñida, una fila con su icono y sus bloques. |
| `alertNote`, `alertTip`, `alertImportant`, `alertWarning`, `alertCaution` | `AlertNote`, `AlertTip`, `AlertImportant`, `AlertWarning`, `AlertCaution` | Alertas de ese tipo. |
| `alertIcon` | `AlertIcon` | El icono de una alerta: un anillo con un glifo del color de la alerta. |
| `list` | `List` | Cada lista: una columna de sus elementos. |
| `orderedList`, `unorderedList` | `OrderedList`, `UnorderedList` | Listas numeradas y con viñetas, después de `list`. |
| `listItem` | `ListItem` | Cada elemento: una fila con su marcador y sus bloques. |
| `listMarker` | `ListMarker` | El marcador de un elemento (`•`, `◦`, `▪` según la profundidad, o `1.`), alineado a la derecha en la sangría previa al elemento. |
| `taskMarker` | `TaskMarker` | El marcador de un elemento de tarea: una casilla dibujada como vista, rellena con un `✓` cuando está hecha; después de `listMarker`. |
| `taskMarkerChecked` | `TaskMarkerChecked` | El marcador de un elemento de tarea hecha, después de `taskMarker`. |
| `listItemContent` | `ListItemContent` | La columna de los bloques de un elemento. |
| `codeBlock` | `CodeBlock` | Bloques de código: una caja redondeada con borde para el código, con la cabecera encima. |
| `codeBlockHeader` | `CodeBlockHeader` | La fila de acciones de un bloque de código (`codeBlockActions`), flotando sobre su esquina superior derecha. |
| `codeBlockScroll` | `CodeBlockScroll` | La vista de desplazamiento horizontal alrededor del código de un bloque de código. |
| `codeBlockCode` | `CodeBlockCode` | El código de un bloque de código (monoespaciado, tal como se escribió). |
| `code` | `Code` | Código en el texto (monoespaciado, sobre un fondo redondeado). |
| `keyboard` | `Keyboard` | Teclas (`<kbd>`, como código). |
| `strong` | `Strong` | Texto en negrita (semibold). |
| `emphasis` | `Emphasis` | Texto enfatizado (cursiva). |
| `strikethrough` | `Strikethrough` | Texto tachado. |
| `underline` | `Underline` | Texto subrayado (`<u>`, `<ins>`). |
| `highlight` | `Highlight` | Texto resaltado (`<mark>`, sobre un amarillo redondeado). |
| `superscript`, `subscript` | `Superscript`, `Subscript` | Superíndice y subíndice (más pequeños). |
| `link` | `Link` | Enlaces (con el color `primary` del tema, subrayados). |
| `image` | `Image` | Imágenes. |
| `math` | `Math` | Fórmulas en el texto, tipografiadas cuando no hay `renderMath`. |
| `mathBlock` | `MathBlock` | Bloques de fórmula, tipografiados y centrados cuando no hay `renderMath`. |
| `table` | `Table` | Tablas: el contenido de `renderTableActions` y luego la vista de desplazamiento de las celdas. |
| `tableScroll` | `TableScroll` | La vista de desplazamiento horizontal de las celdas de una tabla: las columnas se ajustan a su contenido cuando hay espacio, ajustan líneas hasta un mínimo cuando la vista es más estrecha y, más allá, la tabla se desplaza. |
| `tableRow` | `TableRow` | Cada fila de una tabla: una vista detrás de sus celdas, para fondos y bordes (los estilos de texto van en `tableCell`). |
| `tableHead` | `TableHead` | La fila de encabezado, después de `tableRow`. |
| `tableCell` | `TableCell` | Cada celda. |
| `tableHeaderCell` | `TableHeaderCell` | Las celdas de la fila de encabezado (más pequeñas, atenuadas), después de `tableCell`. |
| `rule` | `Rule` | Separadores temáticos: una línea dibujada como borde superior. |
| `details` | `Details` | Elementos desplegables (`<details>`). |
| `summary` | `Summary` | El resumen de un elemento desplegable; al presionarlo se abre y se cierra. |
| `summaryMarker` | `SummaryMarker` | El marcador de un resumen (`▸`, `▾`). |
| `footnotes` | `Footnotes` | Las notas al pie después de los bloques: una columna. |
| `footnote` | `Footnote` | Una nota al pie: una fila con su número y sus bloques. |
| `footnoteLabel` | `FootnoteLabel` | El número de una nota al pie. |
| `footnoteReference` | `FootnoteReference` | Una referencia a una nota al pie en el texto (su número, más pequeño). |
| `custom` | `Custom` | Nodos personalizados mostrados como su contenido (cuando ninguna función de renderizado los muestra). |

<a id="streaming-ai-replies"></a>

## Respuestas de IA en streaming

Pasa la respuesta a medida que crece, con `options={{ streaming: true }}` (`MarkdownOptions { streaming: true, .. }` en Rust). El final de un texto que todavía está llegando suele dejar
sintaxis abierta (`**bold`, `` `code ``, `[a link](htt`, a table whose header just arrived); el streaming la muestra tal como
quedará una vez cerrada, de modo que el lector nunca ve `**` o `[` sueltos. Los bloques se conservan por posición: los bloques que están completos
mantienen sus vistas y solo se rehace el bloque que se está escribiendo, así que actualizar una respuesta larga sigue siendo barato.

`streamingCaret` sigue el final del documento: en línea al final del último texto, dondequiera que termine el último bloque (un
párrafo, un elemento de lista, un bloque de código, la última celda de una tabla) o, si no, en una línea propia después del último bloque (una regla,
el contenido de una función de renderizado). Quítalo cuando la respuesta haya terminado.

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

El cursor es una vista propia de la app, así que puede parpadear o pulsar con la [API de animación de `nsh`](../modules/nsh.md#animation), y los nuevos
bloques pueden aparecer con un fundido mediante las animaciones de la app.

<a id="links"></a>

## Enlaces

Los enlaces son [spans presionables](./text.md#links). Al presionar uno se llama a `onLinkPress` con `{ url }`; la app decide qué abre (una página propia, un
[`WebView`](./web-view.md), un desplazamiento hasta un encabezado). Los encabezados tienen anclas (las de GitHub: `## Getting started` es
`#getting-started`), de modo que un enlace a `#getting-started` llega como esa cadena, y una referencia a una nota al pie llega como
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

`scroll_to_anchor` y `open_web` (`scrollToAnchor` y `nav` en TSX) representan las funciones propias de la app.

Con `links="open"`, al presionar un enlace a otro sitio o app (una URL con esquema: `https:`, `mailto:`, ...) también
se abre fuera de la app con [`openUrl`](../modules/nsh.md#openurl), bajo la capacidad `openUrl` de la app,
después de que `onLinkPress` lo haya notificado; las anclas del documento (`#…`) solo se notifican. El valor por defecto, `"report"`, no abre
nada.

```rust tabs
use nsh_base::{TextViewLinks, text_view};

text_view().markdown(doc).links(TextViewLinks::Open)
```

```tsx tabs
<TextView markdown={doc} links="open" />
```

<a id="render-functions"></a>

## Funciones de renderizado

Las funciones de renderizado incorporan contenido propio de la app al documento. Cada una recibe el valor de una parte y devuelve su contenido (JSX en TSX, un elemento en Rust); una
parte conserva lo que se renderizó para ella mientras su valor no cambie, así que durante el streaming solo se vuelve a renderizar la parte que se está escribiendo.

| Prop | Rust | Valor | Reemplaza o añade |
|---|---|---|---|
| `renderCodeBlock` | `.render_code_block(\|code\| ..)` | `TextViewCodeBlock` (`CodeBlock`) | Reemplaza un bloque de código (resaltado de sintaxis propio). |
| `renderCodeBlockAction` | `.render_code_block_action(\|action\| ..)` | `TextViewCodeAction` | El icono de una acción de bloque de código de la app (`codeBlockActions`); el botón que lo rodea es de `TextView`. |
| `renderTableActions` | `.render_table_actions(\|table\| ..)` | `TextViewTable` (`Table`) | Añade contenido encima de una tabla (copiar, exportar). |
| `renderMath` | `.render_math(\|math\| ..)` | `TextViewMath` | Reemplaza una fórmula: `{ tex, display }`, `display` para un bloque `$$…$$`. |
| `renderImage` | `.render_image(\|image\| ..)` | `TextViewImage` (`Image`) | Reemplaza una imagen (`{ src, alt, title }`): carga propia, dimensionado propio, un visor al presionar. |
| `renderCustom` | `.render_custom(\|node\| ..)` | `TextViewCustomNode` (`CustomNode`) | Muestra un nodo personalizado, según su `name` ([Extensiones de Markdown](#markdown-extensions)). |

Los bloques de código llevan acciones sobre su esquina superior derecha, todas dibujadas igual: botones ghost cuyo fondo se muestra al pasar el puntero o al presionarlos, visibles mientras un puntero está sobre el bloque en escritorio y siempre en pantallas táctiles. `copy` viene
incorporada: copia el código y muestra una marca de verificación durante un momento. Las demás acciones son de la app: `renderCodeBlockAction` dibuja
su icono y `onCodeBlockAction` informa de sus pulsaciones (también la de `copy` incorporada, después de copiar). `copy` escribe en el
portapapeles igual que `Clipboard`, por lo que necesita la capacidad `clipboard` de la app (`nsh.json`).

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

Los bloques de código vienen resaltados de fábrica: para un lenguaje indicado en la valla (`ts`, `tsx`, `rust`, `python`, `bash`,
`json`, `toml`, `yaml`, `diff` y unos doscientos más), el código se muestra con la paleta de código de Allsum, clara u oscura según la
apariencia; un bloque sin lenguaje se muestra sin resaltar. Una app con resaltado propio muestra su código con
`renderCodeBlock`, desde su propio componente o uno de su crate de Rust; una vista de Rust da a `TextView` su resaltador con
[`CodeHighlighter`](#syntax-highlighting). Aquí, código con resaltado propio de la app y una imagen que ocupa todo el
ancho:

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

`Highlighted` y `MathView` (`highlighted` y `math_view` en Rust) representan los componentes propios de la app (un
resaltador, un renderizador de fórmulas o un componente de su crate de Rust). Sin `renderMath`, `TextView` tipografía una fórmula por sí mismo (partes `math` y `mathBlock`) con el soporte de TeX y las fuentes de KaTeX, en el color del texto, igual en todas las plataformas; el TeX que no puede leer se muestra como su código fuente en monoespaciado.
<a id="markdown-extensions"></a>

## Extensiones de Markdown

`extensions` convierte la sintaxis propia de la app en nodos personalizados, que `renderCustom` muestra. Cada extensión tiene un `name`
(el `name` de los nodos que crea) y uno de cuatro tipos de sintaxis:

| Tipo | Rust | Coincide con | El nodo |
|---|---|---|---|
| `pattern` | `MarkdownExtension::pattern(name, regex)` | Una expresión regular en el texto (sintaxis de `regex` de Rust), fuera de código y enlaces | En línea; `text` es la coincidencia, `attributes` sus grupos: `"1"`, `"2"`, … y los grupos con nombre por su nombre |
| `language` | `MarkdownExtension::language(name, language)` | Bloques de código delimitados de ese lenguaje (```` ```chart ````) | A block; `text` is the code, `attributes.meta` el resto de la cadena de información |
| `tag` | `MarkdownExtension::tag(name, tag)` | Elementos HTML o MDX de esa etiqueta, en mayúsculas o minúsculas (`<Callout kind="tip">`) | Sus atributos, con su contenido analizado: `children` (bloques) para un elemento en sus propias líneas, `content` (en línea) dentro del texto |
| `container` | `MarkdownExtension::container(name, container)` | Contenedores `:::name` … `:::` | Un bloque con el Markdown de su interior (`children`); `:::note[Heads up]` da `attributes.label`, `{key=value}` los demás atributos |

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

`BarChart` (`bar_chart` en Rust) representa el gráfico propio de la app. El grupo del patrón de mención está en
`node.attributes?.["1"]` (`node.attributes["1"]` en Rust: `ada`) y la coincidencia completa en `node.text` (`@ada`). Un nodo personalizado sin función de renderizado muestra su contenido.
Una vista devuelta para un nodo en línea (un chip) se coloca en su línea según su propio `verticalAlign`: `align-middle`
(`verticalAlign: "middle"`) la centra respecto al texto, y su línea conserva el `lineHeight` del párrafo salvo que la vista sea más alta.

<a id="options"></a>

### Opciones

`options` elige la sintaxis de Markdown que se lee además de CommonMark y la de GitHub; en Rust es un `MarkdownOptions` con los
mismos campos (`MarkdownOptions { streaming: true, ..Default::default() }`):

| Clave | Tipo | Valor por defecto | Descripción |
|---|---|---|---|
| `math` | `boolean` | `true` | Fórmulas: `$…$` en el texto, bloques `$$…$$`. |
| `html` | `boolean` | `true` | El HTML dentro del Markdown se lee como lo lee la prop `html`; `false` lo muestra como texto. |
| `alerts` | `boolean` | `true` | Las alertas de GitHub: `> [!NOTE]`, `[!TIP]`, `[!IMPORTANT]`, `[!WARNING]`, `[!CAUTION]`. |
| `frontmatter` | `boolean` | `false` | El front matter YAML (`---` … `---` al principio) se convierte en un nodo personalizado `frontmatter` cuyo `text` es el YAML. |
| `mdx` | `boolean` | `false` | MDX: los elementos JSX son nodos personalizados con el nombre de su etiqueta, `{expressions}` nodos personalizados `expression`; el HTML sin procesar se lee entonces como texto. |
| `streaming` | `boolean` | `false` | El texto sigue llegando: la sintaxis que su final deja abierta se muestra como si estuviera cerrada. |

<a id="the-document-model"></a>

## El modelo de documento

La prop `document` y los valores de las funciones de renderizado son objetos planos, cada nodo etiquetado por su `type`. Los tipos
provienen de `nsh/base`: `TextViewDocument`, `TextViewBlock`, `TextViewInline`, `TextViewCodeBlock`, `TextViewTable`,
`TextViewListItem`, `TextViewImage`, `TextViewFootnote`, `TextViewAlert` y `TextViewCustomNode`. En Rust son
los tipos de `nsh_base::text_view` (`Document`, `Block`, `Inline`, `CodeBlock`, `Table`, `ListItem`, `Image`,
`Footnote`, `Alert`, `CustomNode`): `Block` y `Inline` son enums cuyas variantes son los tipos siguientes en PascalCase
(`Block::Heading { level, content, anchor }`, `Inline::Strong { content }`), con los mismos campos en snake case.

| Bloque `type` | Campos |
|---|---|
| `paragraph` | `content` |
| `heading` | `level` (1–6), `content`, `anchor?` |
| `blockquote` | `children`, `alert?` (`"note"`, `"tip"`, `"important"`, `"warning"`, `"caution"`) |
| `list` | `ordered?`, `start?`, `loose?`, `items` (`{ checked?, children }`) |
| `codeBlock` | `language?`, `meta?`, `code` |
| `math` | `tex` |
| `table` | `align?` (`"none"`, `"left"`, `"center"`, `"right"` por columna), `head` (celdas), `rows?` (filas de celdas); una celda es `{ content }` |
| `rule` | |
| `details` | `open?`, `summary` (en línea), `children` |
| `custom` | `name`, `attributes?`, `text?`, `data?`, `children?`, `content?` |

| En línea `type` | Campos |
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
| `custom` | igual que el bloque |

Un documento también tiene `footnotes?`: `{ label, index, children }`, que se muestran después de los bloques en el orden de su primera
referencia. Una app puede guardar las respuestas como documentos, construirlos a partir de sus propios datos o mezclar nodos personalizados que
`renderCustom` muestra.

<a id="parsing-and-plain-text"></a>

### Análisis y texto sin formato

`TextView` también lee documentos sin mostrarlos, de forma síncrona:

| Función | Rust | Devuelve |
|---|---|---|
| `TextView.parse(markdown, options?, extensions?)` | `TextView::parse(markdown, options, extensions)` | El `TextViewDocument` que mostraría la prop `markdown`. |
| `TextView.parseHtml(html, extensions?)` | `TextView::parse_html(html, extensions)` | El `TextViewDocument` que mostraría la prop `html`. |
| `TextView.plainText(document)` | `TextView::plain_text(document)`, `Document::plain_text()` | El texto del documento sin marcado: bloques separados por líneas en blanco, elementos de lista y filas de tabla por saltos de línea, celdas por tabuladores. |

Un botón de copiar para una respuesta completa:

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

Una app también puede analizar una vez y conservar el documento (`document={doc}`), o modificarlo antes de mostrarlo.

<a id="in-rust"></a>

## En Rust

Las vistas de Rust usan el mismo componente del crate `nsh-base`, con los ejemplos anteriores en sus pestañas de Rust. Tres cosas
son propias de Rust: el resaltador de la app, los estilos tipados por parte y los plugins de Markdown, cada uno entregado a todo `TextView` por debajo
de una vista con `provide_context`. Los tipos de documento están en `nsh_base::text_view`, donde `Parser` también lee
documentos con plugins (`Parser::new().plugin(..).markdown(source)`).

<a id="syntax-highlighting"></a>

### Resaltado de sintaxis

`TextView` resalta el código con syntect en la paleta de código de Allsum (la feature `highlight` de `nsh-base`, activada por defecto);
un bloque grande se muestra primero sin resaltar y toma sus colores cuando un hilo en segundo plano lo ha resaltado.
`CodeHighlighter` es el resaltador de la app en su lugar, entregado a todo `TextView` por debajo de una vista con `provide_context`.
Recibe cada bloque de código y devuelve los estilos de rangos de bytes de su código (en orden, sin solaparse; lo que dejan
fuera se muestra sin estilo); `TextView` muestra el código como spans con esos estilos, dentro de su bloque de código habitual (encabezado, acciones,
vista de desplazamiento, partes). El resaltador puede ser cualquier cosa que convierta código en rangos con estilo: `tree-sitter`, syntect con
un tema propio de la app, ...

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

`my_syntect::ranges` representa el código de enlace de la app con su resaltador y `messages` la vista del chat de la app.
`renderCodeBlock`, cuando se da, muestra el bloque de código en lugar de todo esto.

<a id="typed-part-styles"></a>

### Estilos tipados por parte

`TextViewParts` da estilo a las partes con estilos tipados en lugar de cadenas de clases, para las vistas de Rust: cada `TextViewPart` (uno por
parte de la [tabla anterior](#styling-the-parts)) recibe una función que refina su `StyleRefinement`. Entregados con
`provide_context`, se aplican a todo `TextView` por debajo, antes de su `classes` y `styles`; los colores del tema leídos en ellos
siguen la apariencia clara y oscura.

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

Un `MarkdownPlugin` lee sintaxis de Markdown en Rust: recibe cada nodo del árbol de sintaxis (el `mdast` de markdown-rs) antes de
que el analizador lo lea, y devuelve contenido de bloque o en línea propio, normalmente un `CustomNode`; también puede mostrar los
nodos personalizados que crea. Una vista proporciona plugins a todo `TextView` por debajo de ella:

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

Primero va el `render` de un plugin, luego `renderCustom` y después el contenido del nodo. `configure` activa más de
la sintaxis de markdown-rs, y `ParseContext` lee los hijos de un nodo como lo hace el analizador.

## Props

| Prop | Rust | Tipo | Valor por defecto | Descripción |
|---|---|---|---|---|
| `markdown` | `.markdown(..)` | `string` | | El documento como Markdown. |
| `html` | `.html(..)` | `string` | | El documento como HTML, cuando no se da `markdown`. |
| `document` | `.document(..)` | `TextViewDocument` | | El documento como bloques, cuando no se da ni `markdown` ni `html`. |
| `options` | `.options(..)` | `MarkdownOptions` | todos los valores por defecto | La sintaxis de Markdown que se lee ([Opciones](#options)). |
| `extensions` | `.extensions(..)` | `MarkdownExtension[]` | `[]` | La sintaxis de la app, como nodos personalizados ([Extensiones de Markdown](#markdown-extensions)). |
| `classes` | `.classes(..)` | `TextViewClasses` | `{}` | Clases de Tailwind por parte. |
| `styles` | `.styles(..)` | `TextViewStyles` | `{}` | Estilos en línea por parte (cada uno un `StyleProp<TextStyle>`), por encima de las clases. |
| `selectable` | `.selectable(..)` | `boolean` | `false` | El documento se puede seleccionar como uno solo: una selección atraviesa sus párrafos, encabezados, celdas y bloques de código ([Selección de texto](./text-selection.md)). |
| `links` | `.links(..)` | `"report" \| "open"` | `"report"` | Qué hace una pulsación sobre un enlace: lo notifica (`onLinkPress`), y con `"open"` también abre fuera de la app un enlace a otro sitio o app ([Enlaces](#links)). |
| `codeBlockScrollbar` | `.code_block_scrollbar(..)` | `boolean` | `true` | Los bloques de código muestran su indicador de desplazamiento horizontal. |
| `tableScrollbar` | `.table_scrollbar(..)` | `boolean` | `true` | Las tablas muestran su indicador de desplazamiento horizontal. |
| `streamingCaret` | `.streaming_caret(..)` | `JSX.Element` | | Se muestra al final del documento: en línea tras el último texto o, si no, en su propia línea. |
| `renderCustom` | `.render_custom(\|node\| ..)` | `(node: TextViewCustomNode) => JSX.Element` | | Muestra nodos personalizados. |
| `renderCodeBlock` | `.render_code_block(\|code\| ..)` | `(code: TextViewCodeBlock) => JSX.Element` | | Muestra bloques de código. |
| `codeBlockActions` | `.code_block_actions(..)` | `TextViewCodeAction[]` | `[]` | Las acciones sobre la esquina superior derecha de cada bloque de código: `{ id: "copy" }` integrada, las demás de la app. |
| `renderCodeBlockAction` | `.render_code_block_action(\|action\| ..)` | `(action: TextViewCodeAction) => JSX.Element` | | El icono de una acción de la app. |
| `renderTableActions` | `.render_table_actions(\|table\| ..)` | `(table: TextViewTable) => JSX.Element` | | Contenido sobre cada tabla. |
| `renderMath` | `.render_math(\|math\| ..)` | `(math: TextViewMath) => JSX.Element` | | Muestra fórmulas. |
| `renderImage` | `.render_image(\|image\| ..)` | `(image: TextViewImage) => JSX.Element` | | Muestra imágenes. |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | | La raíz, una columna de los bloques; sus estilos de texto pasan a todas las partes (estilos de texto tipados: `styles.root`). |

En Rust las clases y los estilos por parte son `TextViewClasses` y `TextViewStyles`; una vista de Rust suele dar estilo a las
partes con [`TextViewParts`](#typed-part-styles).

<a id="events"></a>

## Eventos

| Evento | Rust | Descripción |
|---|---|---|
| `onLinkPress` | `.on_link_press(\|event: &TextViewLinkPressEvent\| ..)` | Se pulsó un enlace: `{ url }`: su URL, `#anchor` para un encabezado, `#footnote-<label>` para una nota al pie. |
| `onCodeBlockAction` | `.on_code_block_action(\|event: &TextViewCodeActionEvent\| ..)` | Se pulsó una acción de un bloque de código (después de que `copy` copiara). |
| `onImagePress` | `.on_image_press(\|image: &Image\| ..)` | Se pulsó una imagen que no está en un enlace: `{ image }`, para que la app la muestre más grande (un visor con zoom propio). |

<a id="accessibility"></a>

## Accesibilidad

Los lectores de pantalla leen el documento en orden, texto por texto. `TextView` da a la estructura sus roles: los encabezados son
headers, los enlaces son links (su título es la pista), los marcadores de tareas son checkboxes con su estado marcado, el
resumen de un desplegable es un botón que indica si está expandido, y las imágenes se leen por su texto alternativo.

<a id="related"></a>

## Relacionado

- [Text](./text.md): el elemento que es cada texto de `TextView`, con sus spans, enlaces, adjuntos en línea y selección.
- [Selección de texto](./text-selection.md): una selección a través de varios `TextView` y textos.
- [`nsh/base`](../modules/nsh-base.md): los demás componentes base.
- [Estilos](../docs/styling.md) y [Tailwind](../docs/tailwind.md).
