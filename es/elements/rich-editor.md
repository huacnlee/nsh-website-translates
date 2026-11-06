---
title: "RichEditor"
description: "El editor de texto enriquecido de nsh/base: documentos definidos por el esquema de la aplicación, comandos, plugins, historial, mapas de teclas, reglas de entrada y Markdown, siguiendo la arquitectura de ProseMirror, con su estado en Rust."
group: base
demo: el-rich-editor
source_hash: 7ce7527a59594417
---


# RichEditor

`RichEditor` es un editor de texto enriquecido construido según la arquitectura de ProseMirror. La app define de qué se compone un documento mediante un esquema (párrafos, encabezados, listas, menciones, los tipos de nodo y de marca que necesite), y el editor mantiene cada documento válido respecto a él. Los cambios son pasos agrupados en transacciones, de modo que se pueden deshacer, mapean posiciones y viajan como JSON; el comportamiento procede de plugins (historial, keymaps, reglas de entrada, atajos de Markdown, los propios de la app); los comandos son valores que una barra de herramientas ejecuta y consulta. El estado del editor, sus comandos y sus plugins se ejecutan en Rust: la escritura, los atajos de teclado y las reglas de entrada nunca esperan a JS, y la app lee el estado como JSON cuando lo pide.

Un editor tiene dos partes: la sesión (`createRichEditor`), que posee el estado y que el código de la app maneja, y la vista (`<RichEditor editor={…} />`), que renderiza la sesión de forma nativa y convierte la entrada de la plataforma en transacciones. Varias vistas pueden mostrar una misma sesión.

El núcleo del editor es un port a Rust de [ProseMirror](https://prosemirror.net) de Marijn Haverbeke, y su capa de extensiones sigue a [Tiptap](https://tiptap.dev): sus estructuras de datos, comandos y nombres se mantienen, y también lo que ya sabes de ellos. Ambos tienen licencia MIT, y sus licencias se aplican a lo que se ha portado de ellos.

```tsx
import { mount } from "nsh";
import { RichEditor, createRichEditor, history, inputRules, keymap, markdown, markdownRules, starterKeymap, baseKeymap, toggleMark } from "nsh/base";

const editor = createRichEditor({
  content: "# Notes\n\nStart typing…",
  format: "markdown",
  plugins: [
    history(),
    keymap({ "Mod-b": toggleMark("bold"), "Mod-i": toggleMark("italic") }),
    starterKeymap(),
    baseKeymap(),
    inputRules(markdownRules()),
    markdown(),
  ],
});

function App() {
  return <RichEditor editor={editor} class="flex-1" />;
}

mount(App);
```

Sin `schema` un editor usa el esquema inicial (`starterSchema()`); sin `plugins` obtiene el kit inicial (`starterKit()`: las reglas de entrada y los atajos de teclado del esquema inicial, los atajos de teclado base y el historial). Un array `plugins` vacío crea un editor sin ningún plugin.

<a id="styling"></a>

## Estilos

El editor dibuja el documento con el aspecto de la app: `classes` y `styles` dan estilo a sus partes (`root`, `content`, `caret`, `selection`, `placeholder`, `composition`, `selectedNode`, `listMarker` y, para las tablas, `selectedCell`, `tableGrip`, `tableResizeHandle`, `tableDropIndicator`), a sus nodos por tipo (`nodes: { heading:
"text-2xl font-bold", "heading[level=2]": "text-xl" }`) and its marks (`marks: { bold: "font-bold" }`). Los elementos de las listas cuya especificación de nodo establece `extra.listMarker` en `"bullet"` o `"ordered"` (las listas del esquema inicial) muestran un marcador en la parte `listMarker`: `•`, `◦`, `▪` según la profundidad, o números a partir del `start` de la lista, colocado antes del elemento, en la sangría de la lista (`pl-6` en la lista, como un navegador sangra `ul`).

```tsx
<RichEditor
  editor={editor}
  classes={{
    nodes: { heading: "text-2xl font-bold", bulletList: "pl-6", codeBlock: "font-mono bg-muted p-3 rounded-md" },
    marks: { bold: "font-bold", italic: "italic", code: "font-mono bg-muted" },
    listMarker: "text-muted-foreground",
  }}
/>
```

La parte `content` es la caja del documento dentro de la vista con scroll del editor: su padding (`content: "px-6 py-5"`) es el espacio alrededor del texto, y la barra de desplazamiento recorre el borde del propio editor. Un arrastre que selecciona más allá del borde superior o inferior del editor desplaza el documento, más rápido cuanto más se aleja el puntero.

### Bubble menu

`bubbleMenu` es el bubble menu de Tiptap: el contenido de la app se muestra junto a la selección, por encima de ella por defecto (`bubbleMenuPlacement`, pasando al otro lado cuando no hay espacio) a `bubbleMenuOffset` puntos (8), en un overlay que sigue al texto mientras se desplaza. La app lo pasa mientras quiere que se muestre, a partir del estado de la sesión:

```tsx
const revision = signal(editor.revision);
editor.on("revision", ({ revision: r }) => revision.set(r));
const inLink = () => (revision(), editor.isActive("link"));

<RichEditor
  editor={editor}
  bubbleMenu={inLink() ? <LinkMenu href={editor.getAttributes("link").href} /> : undefined}
  bubbleMenuPlacement="bottom"
/>
```

Un menú de enlace edita el enlace bajo el cursor con `chain([extendMarkRange("link"), command("setLink", { href })])` y lo elimina con `command("unsetLink")` tras el mismo `extendMarkRange`.

<a id="schemas"></a>

## Esquemas

`defineSchema(spec)` lee un esquema con la forma de ProseMirror y lanza un error indicando qué es lo incorrecto. Los tipos de nodo indican su `content` (una expresión de contenido: `"inline*"`, `"paragraph+"`, `"(heading | paragraph) block*"`), su `group`, si son `inline` o un `atom`, las `marks` que permiten y sus `attrs` con valores por defecto y validación (`"string"`, `"number"`, `"boolean"`). El primer tipo de bloque es el predeterminado: lo que crea Enter y lo que rellena el contenido requerido. Las claves que una especificación no conoce se conservan como datos adicionales del tipo, para los frameworks construidos sobre el editor.

```tsx
import { createRichEditor, defineSchema } from "nsh/base";

const schema = defineSchema({
  nodes: {
    doc: { content: "block+" },
    paragraph: { content: "inline*", group: "block" },
    mention: { group: "inline", inline: true, atom: true, attrs: { id: {}, label: { default: "" } } },
    text: { group: "inline" },
  },
  marks: { bold: {}, link: { attrs: { href: {} }, inclusive: false } },
});

const editor = createRichEditor({ schema, doc: schema.parse("Hello") });
```

Un `RichSchema` lee y escribe documentos: `parse(content, format?)` (texto plano por defecto, `"markdown"` o JSON), `parseMarkdown(markdown)`, `serialize(doc, format?)` (Markdown por defecto, `"text"`, `"json"`) y `check(doc)`, que devuelve el documento con los valores por defecto de sus atributos rellenados. `nodes`, `marks` y `topNode` nombran sus tipos. Markdown se corresponde con los nombres del esquema inicial (`paragraph`, `heading`, `blockquote`, `codeBlock`, `bulletList`, `orderedList`, `listItem`, `bold`, `italic`, `code`, `link`, `strike`).

<a id="commands"></a>

## Comandos

Un comando es un valor: `toggleMark("bold")` crea un objeto que la app conserva, asocia a teclas y pasa al editor. `editor.run(command)` lo ejecuta y devuelve si se aplicó; `editor.can(command)` consulta sin cambiar nada, que es como una barra de herramientas habilita sus botones. `editor.isActive(name, attrs?)` indica si una marca o un nodo está activo en la selección (`isActive("heading", { level: 2 })`).

| Comando | Qué hace |
| --- | --- |
| `toggleMark(name, attrs?)` | Añade la marca a la selección, o la quita donde ya está; en un cursor, para el texto que se escriba a continuación |
| `setMark(name, attrs?)` / `unsetMark(name)` | Añade o quita una marca |
| `setBlockType(name, attrs?)` | Convierte los bloques de texto seleccionados en uno de un tipo (`setBlockType("heading", { level: 2 })`) |
| `wrapIn(name, attrs?)` / `lift()` | Envuelve los bloques seleccionados en un nodo (una cita) / los saca de su padre |
| `wrapInList(name, attrs?)` | Envuelve los bloques seleccionados en una lista |
| `splitListItem(name)` / `sinkListItem(name)` / `liftListItem(name)` | Divide, sangra o reduce la sangría de elementos de lista |
| `undo()` / `redo()` | Deshace o rehace un cambio (con `history()`) |
| `selectAll()`, `setTextSelection(anchor, head?)`, `setNodeSelection(pos)` | Selecciona |
| `insertText(text)`, `insertContent(content, format?)` | Inserta texto o contenido sobre la selección |
| `setNodeAttribute(pos, attr, value)` | Establece un atributo del nodo en una posición, como un único cambio que se puede deshacer |
| `command(name)` | Un comando sin parámetros, por nombre: `"splitBlock"`, `"joinBackward"`, `"exitCode"`, `"newlineInCode"`, `"selectParentNode"`, … |
| `chain(commands)` | Ejecuta comandos uno tras otro como una sola transacción (un paso de deshacer); se aplica solo cuando todos se aplican |
| `first(commands)` | Ejecuta el primer comando que se aplique |

```tsx
editor.run(chain([setBlockType("heading", { level: 1 }), toggleMark("bold")]));
const canIndent = editor.can(sinkListItem("listItem"));
```

<a id="the-session"></a>

## La sesión

| Miembro | Qué es |
| --- | --- |
| `state`, `doc`, `selection` | El estado, el documento y la selección como JSON, generados al leerlos |
| `revision` | Cuántas transacciones ha aplicado el estado |
| `isEmpty`, `undoDepth`, `redoDepth`, `composing` | Lo que una UI muestra sobre el editor |
| `setContent(content, format?)` | Reemplaza el documento, como un único cambio que se puede deshacer |
| `insertContent(content, format?)` | Inserta contenido sobre la selección |
| `getJSON()`, `getMarkdown()`, `getText()`, `textBetween(from?, to?, separator?)` | El documento en un formato |
| `dispatch(tr)` | Aplica una transacción dada como JSON (sus pasos contra el documento actual) |
| `on(event, listener)` | Llama a `listener` con la carga de cada `event`, en el siguiente turno de JS: `revision` (`{ revision }`, tras cada cambio, de cualquier origen), `update`, `selectionUpdate`, `transaction`, `focus`, `blur`, `delete`. Devuelve una función que lo detiene; un listener añadido mientras un componente se renderiza se detiene junto con el componente |
| `focus()`, `blur()` | Mueve el foco del teclado hacia las vistas que muestran el editor, o fuera de ellas |

Las posiciones se cuentan como en ProseMirror: un texto cuenta sus unidades de código UTF-16, un nodo hoja uno, un nodo con contenido sus dos límites. Cualquier cosa que deba sobrevivir a las ediciones conserva un id en los atributos de un nodo o en una marca. Una consulta de posición (`resolve(pos)`, `nodeAt(pos)`, `coordsAtPos(pos)`, `findParentNode(name, pos)`, ...) lanza un `RangeError` para una posición fuera del documento (`0` a `doc.content.size`), como hace `resolve` de ProseMirror, y responde `null` donde no hay nada (`nodeAt` al final de un nodo, `coordsAtPos` si ninguna vista muestra el editor). `run` y `can` lanzan un `TypeError` para un comando, tipo de nodo o tipo de marca que el editor no conoce.

<a id="taking-over-transactions"></a>

### Tomar el control de las transacciones

`editor.dispatchTransaction = (tr) => { … }` hace que la app confirme cada transacción por sí misma: el handler recibe cada una como JSON y la confirma con `editor.applyTransaction(tr)`, o la descarta. La colaboración, el registro y las transacciones que deben pasar las comprobaciones de la app lo usan; `null` devuelve la confirmación al editor. El handler oye la escritura en el siguiente turno de JS, y el documento cambia cuando confirma.

<a id="extensions"></a>

## Extensiones

Las extensiones son las de Tiptap: cada una aporta, junto, su tipo de nodo o de marca, sus atajos de teclado, reglas de entrada y de pegado, plugins y comandos con nombre, y un editor creado a partir de extensiones obtiene de ellas su esquema, su keymap, sus reglas y su tabla de comandos. Las integradas son clases con los nombres de Tiptap, que se usan tal cual o configuradas:

```tsx
import { RichEditor, StarterKit, Underline, command, createRichEditor } from "nsh/base";

const editor = createRichEditor({
  extensions: [StarterKit.configure({ heading: { levels: [1, 2, 3] }, codeBlock: false })],
  content: "Hello",
  editable: true,
});

editor.run(command("toggleHeading", { level: 2 }));
editor.run(command("toggleBold"));
```

`StarterKit` aporta `Document`, `Paragraph`, el nodo de texto, `Heading`, `Blockquote`, `BulletList`, `OrderedList`, `ListItem`, `TaskList`, `TaskItem`, `CodeBlock`, `HardBreak`, `HorizontalRule`, `RichImage` (`Image` de Tiptap), `Bold`, `Italic`, `Strike`, `Code`, `Underline`, `RichLink` (`Link` de Tiptap), `Highlight`, `Subscript`, `Superscript`, `RichTextStyle` (`TextStyle` de Tiptap), `TextAlign`, `History`, `TrailingNode`, `Typography` y `ListKeymap`. Una opción con el nombre de una de ellas establecida en `false` la deja fuera, y un objeto la configura (`heading: { levels }`, `history: { depth }`, `textAlign: { types }`, `codeBlock: { enableTabIndentation }`). Los `configure(options)` y `extend({...})` de cada clase crean un `RichExtension`, que tiene `name`, `type`, `priority` y `options`. Todo editor obtiene además el keymap del núcleo (Enter, Backspace, Delete, seleccionar todo).

Cada extensión añade los comandos de Tiptap, que `command(name, args)` ejecuta: `toggleBold`, `setItalic`, `unsetStrike`, `toggleHeading({ level })`, `setParagraph`, `toggleBlockquote`, `toggleBulletList`, `toggleOrderedList`, `toggleTaskList`, `toggleCodeBlock({ language })`, `setHardBreak`, `setHorizontalRule`, `setImage({ src })`, `toggleHighlight({ color })`, `setTextAlign("center")`, `unsetTextAlign`, y los comandos de enlace, de recuento de caracteres y de sugerencias que se describen más abajo.

Las alternancias de lista actúan sobre listas completas, como los botones de lista de un procesador de texto: `toggleOrderedList` en una lista con viñetas la numera en todos los niveles, incluidas las listas anidadas, y la alternancia propia de una lista saca los bloques seleccionados de todas las listas que los rodean.

El orden de `extensions` es su prioridad entre iguales: una extensión listada más tarde asocia sus teclas antes que las anteriores; `priority` (100 por defecto) las ordena de otro modo. Con `extensions`, los `plugins` de un editor van después de los plugins de las extensiones.

<a id="the-apps-extensions"></a>

### Las extensiones de la app

`defineExtension` crea una. Sus funciones se ejecutan una vez, cuando se crea un editor con ella, con las opciones de la extensión, y devuelven datos: comandos, reglas y plugins tal como los crean las factorías anteriores.

```tsx
import { StarterKit, command, createRichEditor, defineExtension, insertText, textRule } from "nsh/base";

const Signature = defineExtension({
  name: "signature",
  priority: 200,
  addOptions: () => ({ text: "— Sent from NSH" }),
  addCommands: (options) => ({ insertSignature: insertText(options.text) }),
  addKeyboardShortcuts: () => ({ "Mod-Alt-s": command("insertSignature") }),
  addInputRules: () => [textRule("\\(sig\\)$", "✍")],
});

const editor = createRichEditor({ extensions: [StarterKit, Signature.configure({ text: "Best, Ana" })] });
```

`node` o `mark` (en la forma de `defineSchema`) la convierte en una extensión de nodo o de marca; `addGlobalAttributes` añade atributos a otros tipos; `addProseMirrorPlugins` devuelve plugins, incluidos los `RichEditorPlugin`; `addPasteRules` devuelve reglas `textRule` y `markRule` para el texto pegado. El `extend({...})` de una clase integrada reemplaza las partes que aporta: `Underline.extend({ addKeyboardShortcuts: () => ({ "Mod-Alt-u": toggleMark("underline") }) })`.

El crate de una app registra las extensiones escritas en Rust mediante su conjunto de UI, y JS las toma por nombre:

```rust
use nsh_base::rich_editor::extensions::{Extension, RichExtensionRegistry};

#[native_module("app/native")]
fn native(registry: &mut Registry) {
    registry.rich_extension("mention", || Extension::new("mention") /* .add_plugins(...) */);
}
```

```tsx
const editor = createRichEditor({ extensions: [StarterKit, richExtension("mention", { char: "@" })] });
```

`richExtension(name, options)` también encuentra cada extensión integrada por su nombre (`"text"`, `"bold"`, ...).

## Plugins

| Factoría | Qué añade |
| --- | --- |
| `history({ depth?, newGroupDelay? })` | Historial de deshacer; los cambios dentro de `newGroupDelay` milisegundos (500) se deshacen juntos |
| `keymap(bindings)` | Comandos por nombre de tecla: `"Mod-b"` (Cmd en las plataformas de Apple, Ctrl en las demás), `"Shift-Enter"`, `"Alt-ArrowUp"` |
| `baseKeymap()` | Enter, Backspace, Delete, seleccionar todo y las teclas de edición de texto de la plataforma |
| `starterKeymap()` | Los atajos del esquema inicial: marcas, encabezados, listas, bloques de código, saltos de línea |
| `inputRules(rules)` | El texto escrito antes del cursor que coincide con una regla se convierte en lo que la regla produce; Backspace justo después lo deshace |
| `markdown(options?)` | Markdown mientras se escribe, pegado de Markdown y copia de Markdown (`blockRules`, `inlineRules`, `paste`, `copyAsMarkdown`) |
| `starterKit()` | Las reglas de entrada y los atajos del esquema inicial, los atajos base y el historial |

El lugar de un plugin en la lista es su prioridad: los keymaps y las reglas de entrada que están antes en la lista gestionan primero una tecla o un texto. Las reglas de entrada provienen de `markdownRules()` (encabezados, citas, listas, bloques de código delimitados, reglas, las marcas comunes), `typographyRules()` (comillas tipográficas, puntos suspensivos, raya), `textRule(match, replacement)`, `markRule(match, mark)`, `wrappingRule(match, node)` y `textblockRule(match, node)`. El `match` de una regla es una expresión regular que termina en `$`, y se compara con el texto anterior al cursor.

<a id="the-apps-plugins"></a>

### Los plugins de la app

`new RichEditorPlugin(key)` crea un plugin cuyo comportamiento es el de la app, establecido con llamadas encadenadas:

```tsx
import { RichEditorPlugin, createRichEditor, starterKit } from "nsh/base";

const suggestions = new RichEditorPlugin("suggestions")
  .captureKeys(["ArrowUp", "ArrowDown", "Enter", "Escape"], (key) => moveSuggestion(key))
  .filterTransaction((tr) => tr.meta?.locked !== true)
  .appendTransaction((trs, state) => null);

const editor = createRichEditor({ plugins: [starterKit(), suggestions] });

// While the suggestion list is open, its keys are the list's.
suggestions.capturing = true;
editor.setDecorations("suggestions", [{ from: 5, to: 9, kind: "inline", attrs: { class: "bg-accent" } }]);
```

- `captureKeys(keys, handler)`: mientras `capturing` es verdadero, el editor consume estas teclas e informa a `handler` de cuál se pulsó, justo después; el teclado sigue siendo tan rápido como sin plugin.
- `editor.setDecorations(key, decorations)`: atributos en línea, atributos de nodo y widgets que la vista dibuja sobre el documento sin cambiarlo. Siguen a cada cambio hasta que se establecen de nuevo.
- `filterTransaction(hook)` y `appendTransaction(hook)` ven las transacciones que generan las propias llamadas de la app (`run`, `dispatch`, `setContent`, …) en esa llamada: `filterTransaction` puede descartar una, `appendTransaction` puede devolver una más para aplicarla junto con ella. `on("revision", …)` oye cada cambio, incluida la escritura.
<a id="links-character-counts-and-suggestions"></a>

## Enlaces, recuento de caracteres y sugerencias

Tres plugins incorporan el comportamiento de Link, CharacterCount y Suggestion de Tiptap, todo de forma nativa:

```tsx
import { RichEditor, characterCount, createRichEditor, insertMention, link, starterKit, starterSchema, suggestion, withMention } from "nsh/base";

const editor = createRichEditor({
  schema: withMention(starterSchema()),
  plugins: [
    starterKit(),
    link({ defaultProtocol: "https" }),
    characterCount({ limit: 280 }),
    suggestion({ key: "mention", char: "@", decorationClass: "text-primary", captureKeys: ["ArrowUp", "ArrowDown", "Enter"] }),
  ],
});

editor.on("transaction", () => {
  const s = editor.suggestion("mention");
  if (s?.active) showPeople(s.query, editor.coordsAtPos(s.range.from), s.lastKey);
  setCount(`${editor.characters()} / ${editor.characterLimit}`);
});

// The list picked someone:
editor.run(insertMention(editor.suggestion("mention")!.range, "u1", "Joan"));
```

- `link(options?)`: una URL escrita antes de un espacio o de Enter se convierte en enlace, igual que las URLs del texto pegado (`autolink`);
  una URL pegada sobre una selección enlaza la selección (`linkOnPaste`); una pulsación sobre un enlace con Mod mantenida, o mientras el
  editor es de solo lectura, lo abre mediante el manejo de URLs de la aplicación (`openOnClick`); `enableClickSelection` selecciona el
  enlace completo al pulsar. Las URLs se detectan con o sin protocolo (`nsh.dev`, `https://nsh.dev/docs`, direcciones de correo
  electrónico), y el protocolo que recibe un host sin protocolo es `defaultProtocol` (`http`). Los enlaces admiten los protocolos `http`,
  `https`, `ftp`, `ftps`, `mailto`, `tel`, `callto`, `sms`, `cid`, `xmpp` y los de `protocols`, de modo que
  `setLink({ href })`, `toggleLink(attrs?)` y el autoenlazado excluyen los scripts (`javascript:`) y las URLs de datos.
  `unsetLink()` elimina el enlace alrededor de la selección.
- `characterCount(options?)`: `editor.characters(mode?)` cuenta los caracteres del texto (`"textSize"`, unidades UTF-16 como el `length` de
  JS) o las posiciones del documento (`"nodeSize"`); `editor.words()` cuenta sus palabras (límites de palabra Unicode). Con `limit`, los cambios que lo superarían se rechazan y el contenido pegado se recorta a lo que cabe;
  un primer documento que supere el límite se recorta (`autoTrim`). `setCharacterLimit(limit)` cambia el límite y
  `editor.characterLimit` lo lee.
- `suggestion(options?)`: sigue un disparador (`char`, `@` por defecto) escrito antes del cursor. `allowSpaces` permite que la
  consulta contenga espacios, `allowedPrefixes` enumera lo que puede preceder al disparador (un espacio por defecto; `anyPrefix` admite
  cualquier cosa), `startOfLine` lo exige al inicio de la línea (un menú de comandos `/`). `editor.suggestion(key)` proporciona
  `{ active, range, query, text, lastKey, keyCount }`; el rango activo lleva el `decorationClass` de la aplicación (y
  `decorationEmptyClass` mientras la consulta está vacía). Mientras una sugerencia está activa, las teclas de `captureKeys` pertenecen
  a la lista de la aplicación: el editor las captura y registra la última en el estado, y Escape descarta la
  sugerencia (`exitSuggestion(key)` también). `replaceSuggestion(content, key?)` reemplaza el disparador y la consulta
  con texto o contenido JSON.
- `withMention(schema, { name?, char? })` añade el nodo de mención de Tiptap: un átomo en línea con `id`, `label` y su
  disparador, escrito como `@label` en texto y como `<span data-type="mention">` en HTML. `insertMention(range, id, label?)`
  reemplaza el rango de una sugerencia por una mención y un espacio.

El popup es de la aplicación: lee el estado de la sugerencia, se coloca en `coordsAtPos(range.from)` y dibuja los
elementos a su manera.

<a id="tables"></a>

## Tablas

`TableKit` incorpora las tablas de Tiptap: `RichTable` (el `Table` de Tiptap), `RichTableRow`, `RichTableHeader` y
`RichTableCell`. Se añade junto a `StarterKit`:

```tsx
import { RichEditor, StarterKit, TableKit, addRowAfter, createRichEditor, insertTable, mergeCells } from "nsh/base";

const editor = createRichEditor({
  extensions: [StarterKit, TableKit.configure({ table: { cellMinWidth: 40 } })],
});

editor.run(insertTable({ rows: 3, cols: 3, withHeaderRow: true }));
editor.run(addRowAfter());
```

La tabla acepta las opciones `resizable` (true), `cellMinWidth` (25), `lastColumnResizable` (true),
`allowTableNodeSelection` (false) y `HTMLAttributes`; `TableKit.configure({ tableHeader: false })` deja fuera una
extensión. Las celdas contienen bloques y tienen `colspan`, `rowspan` y `colwidth` (un ancho en puntos por cada columna que
abarcan); las filas tienen un `height`.

Tab y Shift-Tab se mueven entre celdas, y Tab en la última celda añade una fila. Las teclas de flecha en el borde de una celda pasan a la
siguiente celda; Shift con una flecha, o arrastrar a través de celdas, selecciona un rectángulo de celdas (una selección del tipo
`"cell"`, cuyos `anchor` y `head` son las posiciones anteriores a su primera y última celda). Retroceso y Supr vacían
las celdas seleccionadas, y eliminan la tabla cuando todas sus celdas están seleccionadas.

En el editor, una tabla es una cuadrícula de sus celdas: cada columna tiene el ancho del `colwidth` de sus celdas, y las columnas sin él
se reparten el espacio (con un ancho mínimo de `cellMinWidth`), y cada fila mide al menos su `height`. Su aspecto parte del tema: una
cuadrícula de `border` de 1 punto, celdas de encabezado sobre `muted`, celdas con relleno, y cada celda seleccionada bajo la parte `selectedCell` con
el color de selección. `classes.nodes` (`table`, `tableCell`, `tableHeader`) y las partes modifican
todo el estilo. Arriba y Abajo en la primera o la última línea de una celda llevan a la celda superior o inferior.

Mientras el documento se pueda editar:

- En escritorio, el borde derecho de cada columna y el borde inferior de cada fila permiten redimensionarlos: el puntero muestra el
  cursor de redimensionado y la línea `tableResizeHandle`, la tabla sigue el arrastre, y al soltar se establece `colwidth` o
  `height` en un solo paso que deshacer revierte. `resizable: false` desactiva esto, `lastColumnResizable: false` conserva el
  ancho de la última columna.
- La tabla en la que está la selección muestra tiradores (`tableGrip`) en su borde superior sobre cada columna y en su borde izquierdo
  junto a cada fila. Al pulsar uno se selecciona esa columna o fila; al arrastrarlo en escritorio se muestra dónde se soltará
  (`tableDropIndicator`) y la mueve allí al soltar.

```tsx
<RichEditor
  editor={editor}
  classes={{
    nodes: { tableHeader: "font-semibold", tableCell: "px-3 py-2" },
    selectedCell: "bg-primary/10",
    tableGrip: "bg-muted-foreground/60 rounded-full",
  }}
/>
```

Los comandos, cada uno un helper de `nsh/base`:

- `insertTable({ rows, cols, withHeaderRow })` (3 × 3 con una fila de encabezado por defecto) y `deleteTable()`.
- `addColumnBefore()`, `addColumnAfter()`, `deleteColumn()`, `addRowBefore()`, `addRowAfter()`, `deleteRow()`.
- `mergeCells()`, `splitCell()` y `mergeOrSplit()`.
- `toggleHeaderRow()`, `toggleHeaderColumn()` y `toggleHeaderCell()`.
- `setCellAttribute(name, value)`, `setCellSelection({ anchorCell, headCell })`, `goToNextCell()`,
  `goToPreviousCell()` y `fixTables()`, que repara las tablas con celdas faltantes o superpuestas.
- `moveTableRow({ from, to, select })` y `moveTableColumn({ from, to, select })` mueven una fila o columna, junto
  con las filas o columnas que abarcan sus celdas combinadas; `setColumnWidth({ col, width })` y
  `setRowHeight({ row, height })` les dan tamaño (`null` las ajusta a su contenido). Estos aceptan `table`, la posición
  anterior a una tabla, para actuar sobre una tabla distinta de la de la selección.

Las tablas se leen y se escriben en HTML (`<table>` con `<th>` / `<td>`, `colspan`, `rowspan` y `data-colwidth`) y
en Markdown: una tabla con una fila de encabezado cuyas celdas son cada una un párrafo es una tabla de barras GFM, y cualquier otra tabla se
escribe como su HTML, que se vuelve a leer igual. En texto plano, una fila es una línea con sus celdas separadas por tabuladores.
