---
title: "Editor"
description: "El componente Editor: un editor de código con resaltado de sintaxis, números de línea, varios cursores, plegado de código, ajuste de línea automático, búsqueda y reemplazo, diagnósticos y decoraciones, y los atajos de teclado propios de los editores de código."
group: base
demo: el-editor
source_hash: 27f9d0cbb9ff5dd4
---


# Editor

`Editor` es un editor de código: resaltado de sintaxis para más de cincuenta lenguajes, números de línea, varios cursores, plegado, ajuste de línea, buscar y reemplazar, diagnósticos y decoraciones, con las teclas de los editores de código (mover y duplicar líneas, comentarios, sangría, paréntesis y comillas que se cierran al escribirlos). Maneja archivos de cualquier longitud: solo se crean las filas a la vista, y el resaltado sigue cada edición línea por línea, de modo que un archivo largo se desplaza y se escribe igual que uno corto. La escritura pasa por la entrada de la plataforma, así que los métodos de entrada (pinyin, kana, teclas muertas) y los teclados en pantalla funcionan como en cualquier campo de texto.

El editor se encarga del comportamiento y trae un aspecto propio construido con los tokens del tema: el `font-mono` del tema a 13pt en filas de 20pt, números de línea en `muted-foreground`, una banda tenue de `muted` tras las líneas con cursor, selecciones con un tinte de `primary`, guías de sangría en `border`, y los colores de sintaxis integrados que usan los bloques de código de [`TextView`](./text-view.md), en claro y oscuro. Cada parte toma los estilos de la app sobre estos valores por defecto (`classes` y `styles`). Rust crea uno con `nsh_base::editor()`, TSX con `<Editor>` desde `nsh/base`.

```rust tabs
use nsh_base::editor;
use nsh_core::prelude::*;

const MAIN: &str = "fn main() {\n    println!(\"Hello, world!\");\n}\n";

fn code() -> impl IntoElement {
    let source = signal(SharedString::from(MAIN));
    editor()
        .value(move || Some(source.get()))
        .language("rust")
        .on_change(move |value: &SharedString| source.set(value.clone()))
        .flex_1()
}
```

```tsx tabs
import { mount, signal } from "nsh";
import { Editor } from "nsh/base";

const MAIN = `fn main() {
    println!("Hello, world!");
}
`;

function App() {
  const source = signal(MAIN);
  return <Editor value={source()} onChange={({ value }) => source.set(value)} language="rust" class="flex-1" />;
}

mount(App);
```

El editor llena la caja que le da la app (`flex-1`, una altura) y desplaza su texto dentro de ella: siempre en vertical, en horizontal cuando las líneas son más largas que la caja, o nunca con `softWrap`, donde las líneas largas se ajustan al ancho del editor.

<a id="the-text"></a>

## El texto

- **Controlado**: pasa `value` y vuelve a establecerlo en `onChange`, que informa de todo el texto nuevo. Un `value` que cambia la app (un archivo cargado, la salida de un formateador) reemplaza el texto como una sola edición que deshacer revierte, y los cursores y pliegues alejados de lo que cambió se quedan donde están.
- **No controlado**: pasa `defaultValue` y lee el texto desde `onChange` o desde el `value()` del ref.

Los saltos de línea son `\n`: `\r\n` y `\r` en un texto que llega se convierten en `\n`.

<a id="languages"></a>

## Lenguajes

`language` nombra el lenguaje por su nombre, un alias, una extensión o un nombre de archivo, sin distinguir mayúsculas: `"rust"`, `"rs"`, `"typescript"`, `"tsx"`, `"main.go"`, `"Dockerfile"`, `"Makefile"`. Decide el resaltado, el comentario que alterna `mod+/`, los paréntesis que se emparejan y sangran, los pares que cierra la escritura, los caracteres de los que se componen las palabras y la sangría por defecto: cuatro espacios, dos para los lenguajes web (JavaScript, TypeScript, JSON, HTML, CSS, YAML, ...), tabuladores para Go y Makefiles. `tabSize` y `hardTabs` establecen la sangría para todos los lenguajes. Cualquier otro nombre es texto sin formato, a menos que la app lo haya registrado ([sus propios lenguajes](#your-own-languages)).

Los lenguajes: Rust, JavaScript, JSX, TypeScript, TSX, JSON, Python, Go, C, C++, C#, Java, Kotlin, Swift, Objective-C, Objective-C++, Ruby, PHP, Lua, Shell, Fish, PowerShell, SQL, HTML, XML, Vue, Svelte, CSS, SCSS, Sass, Less, Markdown, YAML, TOML, INI, Dockerfile, Makefile, CMake, Dart, Scala, Elixir, Erlang, Haskell, OCaml, F#, Clojure, Zig, Perl, R, Julia, Nix, Terraform, Protocol Buffers, GraphQL y Diff.

```tsx
<Editor value={source()} onChange={({ value }) => source.set(value)} language={file().name} tabSize={2} softWrap class="flex-1" />
```

<a id="your-own-languages"></a>

### Tus propios lenguajes

El código Rust enseña más lenguajes a los editores de una app, y resalta cualquier lenguaje con un resaltador propio (una gramática de tree-sitter, un parser de la app). `register_language` registra un `EditorLanguage`: su nombre, alias, extensiones y nombres de archivo, y sus reglas de edición (comentarios, paréntesis, los pares que cierra la escritura, caracteres de palabra, sangría), con `syntax` indicando una gramática integrada con la que resaltarlo. `register_highlighter` le da a un lenguaje, integrado o registrado, el resaltador de la app: un tipo que implementa `EditorHighlighter`, que recibe cada edición (líneas, bytes y posiciones, tal como las toman las ediciones de tree-sitter) y devuelve los tokens de cada línea (`EditorToken`, o una captura de tree-sitter o un scope de TextMate mediante `EditorToken::from_scope`) dentro de un presupuesto de tiempo, fuera del hilo de la UI. El editor conserva los tokens, los mueve con el texto a medida que se edita y vuelve a pedir las líneas a la vista, igual que con el resaltador integrado. `language` encuentra primero los lenguajes registrados, por nombre, alias, extensión o ruta, tanto en los editores como en las vistas de diff.

Cada motor conserva sus propios lenguajes. Una app Rust los registra en su raíz antes de montar sus editores; el crate de una app los registra para la app TSX en el setup de su conjunto de UI, que todo motor que ejecuta la app llama primero.

```rust
use nsh_base::editor::{EditorLanguage, register_highlighter, register_language};
use nsh_core::prelude::*;

static NIMBLE: EditorLanguage = EditorLanguage::new("Nimble")
    .extensions(&["nb"])
    .line_comment("#")
    .tab_size(2);

#[native_module("my-app/native")]
fn native(registry: &mut Registry) {
    registry.setup(|| {
        register_language(&NIMBLE);
        register_highlighter("nimble", || Box::new(NimbleHighlighter::default()));
    });
}
```

```tsx
<Editor value={source()} onChange={({ value }) => source.set(value)} language="build.nb" class="flex-1" />
```

<a id="editing"></a>

## Edición

El editor funciona como los editores de código:

- **Varios cursores.** Alt-clic (Option-clic) añade un cursor, `mod+d` selecciona la siguiente aparición de la selección, `mod+shift+l` todas ellas, y las teclas de añadir cursor añaden uno en la fila de arriba o de abajo. Escribir, borrar, mover y cada comando actúan en cada uno; Escape vuelve a uno solo. `undoSelection` (`cmd+u`, `ctrl+u`) vuelve a las selecciones anteriores al último movimiento.
- **Las selecciones crecen** por unidades con `expandSelection` (`ctrl+shift+cmd+right`, `shift+alt+right`): la palabra, el contenido de una cadena y la cadena, el contenido de un par de paréntesis y el par, la línea, el texto; `shrinkSelection` vuelve atrás del mismo modo. `splitSelectionIntoLines` (`shift+alt+i`) convierte una selección de varias líneas en una selección por línea.
- **Sangría.** Una línea nueva mantiene la sangría de la línea y añade un nivel tras un paréntesis de apertura (el `:` de Python, el `do` de Ruby, ...); Enter entre un par de paréntesis pone el de cierre en su propia línea. Tab y Shift+Tab sangran y quitan sangría a las líneas seleccionadas; Retroceso en espacios iniciales vuelve a la tabulación de sangría anterior. `autoIndent` desactiva esto.
- **Paréntesis y comillas** se cierran al escribirlos, envuelven una selección y saltan sobre el de cierre cuando se vuelve a escribir (`autoClose`). El paréntesis junto al cursor y su pareja aparecen resaltados con un contorno.
- **Deshacer** revierte tandas completas de escritura: una palabra, un borrado, un comando. Un movimiento o una pulsación inicia un paso nuevo.
- **Plegado.** Una línea seguida de líneas con mayor sangría las pliega con el marcador en el margen: `⌄` para plegar, `›` y el `⋯` tras la línea para desplegar. Un cursor que entra en un pliegue lo abre ([Folding](#folding)).
- **Pulsaciones.** Con un puntero, un clic coloca el cursor, un doble clic selecciona una palabra, un triple clic una línea, Shift-clic amplía la selección y un arrastre selecciona según lo que seleccionó el clic. Un arrastre con Alt+Shift (Option+Shift; también Control+Alt en Linux) selecciona un bloque: una selección por fila, entre las mismas columnas, que siguen más allá del final de las líneas cortas. En pantallas táctiles un toque coloca el cursor, un doble toque o una pulsación larga selecciona la palabra bajo el dedo, y los controladores en los extremos de esa selección mueven cada extremo mientras un dedo los arrastra (el texto que los rodea sigue desplazándose).
- **Portapapeles.** Copiar y cortar sin selección toman las líneas completas de los cursores, y esas se pegan de vuelta como líneas completas sobre la línea del cursor.

`readOnly` mantiene el texto tal cual mientras sigue seleccionado, buscado y copiado.

<a id="keys"></a>

## Teclas

Las teclas del editor funcionan mientras tiene el foco; los demás inputs conservan las suyas. `mod` es Command en macOS e iOS y Control en el resto (las pulsaciones de `keymap`).

| Teclas (macOS) | Teclas (Windows, Linux) | Comando |
|---|---|---|
| Flechas, con Shift para seleccionar | Flechas, con Shift para seleccionar | Mover por carácter y fila |
| `alt+left` / `alt+right` | `ctrl+left` / `ctrl+right` | Mover por palabra |
| `cmd+left` / `cmd+right`, `home` / `end`, `ctrl+a` / `ctrl+e` | `home` / `end` | El primer carácter no en blanco de la línea (luego su inicio) / el final de la línea |
| `cmd+up` / `cmd+down` | `ctrl+home` / `ctrl+end` | El inicio / el final del texto |
| `pageup` / `pagedown` | `pageup` / `pagedown` | Una página arriba / abajo |
| `alt+backspace` / `alt+delete` | `ctrl+backspace` / `ctrl+delete` | Borrar una palabra a la izquierda / derecha |
| `cmd+backspace` / `cmd+delete`, `ctrl+k` | `ctrl+shift+backspace` / `ctrl+shift+delete` | Borrar hasta el inicio / final de la línea |
| `cmd+z` / `cmd+shift+z` | `ctrl+z` / `ctrl+shift+z`, `ctrl+y` | Deshacer / rehacer |
| `cmd+a` | `ctrl+a` | Seleccionar todo |
| `cmd+l` | `ctrl+l` | Seleccionar la línea (otra vez: también la siguiente) |
| `cmd+d` | `ctrl+d` | Seleccionar la siguiente aparición |
| `cmd+shift+l` | `ctrl+shift+l` | Seleccionar todas las apariciones |
| `cmd+alt+up` / `cmd+alt+down` | `ctrl+alt+up` / `ctrl+alt+down` | Añadir un cursor arriba / abajo |
| `escape` | `escape` | Volver a una sola selección |
| `alt+up` / `alt+down` | `alt+up` / `alt+down` | Mover las líneas arriba / abajo |
| `alt+shift+up` / `alt+shift+down` | `alt+shift+up` / `alt+shift+down` | Duplicar las líneas arriba / abajo |
| `cmd+shift+k` | `ctrl+shift+k` | Borrar las líneas |
| `cmd+enter` / `cmd+shift+enter` | `ctrl+enter` / `ctrl+shift+enter` | Una línea nueva debajo / encima |
| `tab` / `shift+tab`, `cmd+]` / `cmd+[` | `tab` / `shift+tab`, `ctrl+]` / `ctrl+[` | Sangrar / quitar sangría |
| `cmd+/` | `ctrl+/` | Alternar el comentario de línea |
| `cmd+shift+\` | `ctrl+shift+\` | Ir al paréntesis correspondiente |
| `ctrl+j` | `ctrl+j` | Unir las líneas |
| `ctrl+t` | | Intercambiar los caracteres alrededor del cursor |
| `ctrl+alt+left` / `ctrl+alt+right`, con Shift para seleccionar | | Mover por parte de una palabra (camelCase, snake_case) |
| `shift+alt+a` | `shift+alt+a` | Alternar el comentario de bloque |
| `shift+alt+i` | `shift+alt+i` | Dividir la selección en líneas |
| `ctrl+shift+cmd+right` / `ctrl+shift+cmd+left` | `shift+alt+right` / `shift+alt+left` | Ampliar / reducir la selección |
| `cmd+u` | `ctrl+u` | Volver a las selecciones anteriores |
| `cmd+g` / `cmd+shift+g`, `f3` / `shift+f3` | `f3` / `shift+f3` | Buscar la coincidencia siguiente / anterior |
| `cmd+e` | | Buscar la selección (`onFindWithSelection`) |
| `cmd+alt+[` / `cmd+alt+]` | `ctrl+shift+[` / `ctrl+shift+]` | Plegar / desplegar la línea del cursor |
| `f12` | `f12` | Ir a la definición en el cursor (`onDefinitionRequest`) |
| `cmd+.` | `ctrl+.` | Acciones de código en la selección (`onCodeActionRequest`) |
| `cmd+c` / `cmd+x` / `cmd+v` | `ctrl+c` / `ctrl+x` / `ctrl+v` | Copiar / cortar / pegar |

macOS e iOS también tienen las teclas de texto de Cocoa: `ctrl+b` / `ctrl+f` / `ctrl+p` / `ctrl+n` mueven, `ctrl+h` / `ctrl+d` borran.

Los comandos sin teclas por defecto, y los propios de la app, toman las teclas que la app vincula con [`keymap`](../modules/nsh.md#keymap), ejecutándolos mediante el `run` del ref:

```tsx
import { keymap } from "nsh";

let editor!: EditorRef;

keymap.bind({
  "f9": () => editor.run("sortLinesAscending"),
  "mod+shift+u": () => editor.run("transformToUppercase"),
  "mod+alt+0": () => editor.run("foldAll"),
  "mod+alt+j": () => editor.run("unfoldAll"),
});
```

<a id="find-and-replace"></a>

## Buscar y reemplazar

`search` es lo que se busca: `{ query, caseSensitive?, wholeWord?, regex?, inSelection? }`. Sus coincidencias aparecen resaltadas, la de la selección con más intensidad, y `onSearchChange` informa de `{ result }`, un `{ count, current, error }`: cuántas coincidencias hay, en cuál está la selección (desde 0) y por qué una expresión regular no es válida. `findNext` y `findPrevious` seleccionan la coincidencia siguiente y la anterior, dando la vuelta al llegar al final; `replace(text)` reemplaza la coincidencia actual y selecciona la siguiente, y `replaceAll(text)` reemplaza todas las coincidencias como una sola edición y devuelve `{ count }`, cuántas fueron. El reemplazo de una expresión regular se refiere a sus grupos como `$1` y `${name}`.

`inSelection` busca solo dentro de lo que estaba seleccionado cuando se activó (las líneas de los cursores cuando no había nada): el ámbito permanece mientras siga activado, a través de las ediciones, mientras la selección pasa de coincidencia en coincidencia. `findWithSelection` (`cmd+e` en macOS) informa del texto seleccionado, o de la palabra junto al cursor, con `onFindWithSelection`, para que la barra de búsqueda lo tome como su consulta.

La barra de búsqueda es propia de la app:

```tsx
import { signal, Text, View } from "nsh";
import { Button, Editor, type EditorRef, type EditorSearchResult, Input } from "nsh/base";

function Find(props: { source: string; onChange: (value: string) => void }) {
  let editor!: EditorRef;
  const query = signal("");
  const replacement = signal("");
  const result = signal<EditorSearchResult>({ count: 0 });
  const status = () =>
    result().error ?? (result().current != null ? `${result().current! + 1} of ${result().count}` : `${result().count} found`);
  return (
    <View class="flex-1">
      <View class="flex-row items-center gap-2 border-b border-border p-2">
        <Input value={query()} onChange={({ value }) => query.set(value)} onSubmit={() => editor.run("findNext")} placeholder="Find" class="flex-1" />
        <Text class="text-sm text-muted-foreground">{status()}</Text>
        <Button onPress={() => editor.run("findPrevious")} class="px-2"><Text>↑</Text></Button>
        <Button onPress={() => editor.run("findNext")} class="px-2"><Text>↓</Text></Button>
        <Input value={replacement()} onChange={({ value }) => replacement.set(value)} placeholder="Replace" class="flex-1" />
        <Button onPress={() => editor.replace(replacement())} class="px-2"><Text>Replace</Text></Button>
        <Button onPress={async () => console.log("replaced", (await editor.replaceAll(replacement())).count)} class="px-2"><Text>All</Text></Button>
      </View>
      <Editor
        ref={editor}
        value={props.source}
        onChange={(e) => props.onChange(e.value)}
        language="ts"
        search={query() ? { query: query() } : undefined}
        onSearchChange={(e) => result.set(e.result)}
        class="flex-1"
      />
    </View>
  );
}
```

<a id="diagnostics"></a>

## Diagnósticos

`diagnostics` marca los problemas que informa un language server o un linter: un subrayado ondulado fino bajo cada rango, en el color de su severidad (`error`, `warning`, `info`, `hint`). Las posiciones son líneas y columnas UTF-16 desde 0, como las de un language server, de modo que sus diagnósticos pasan tal como llegan. Las marcas se mantienen sobre su texto mientras el usuario escribe, hasta que la app pasa otras nuevas; mostrar los mensajes (una lista, una tarjeta emergente en la línea) corresponde a la app.

Un diagnóstico lleva también el resto del `Diagnostic` de un language server. Sus `tags` dibujan su texto como lo hacen los clientes de lenguaje: el código `unnecessary` (una variable sin usar, código inalcanzable) se atenúa y el código `deprecated` se tacha, en las partes `unnecessaryText` y `deprecatedText`; una sugerencia con una etiqueta se muestra solo en su texto. `codeDescription.href` es la página que describe su código (el de una regla de lint), y `relatedInformation` enumera los demás lugares que informan sobre él (`{ location: { uri?, range }, message }`): el hover entrega ambos a la app, que los muestra en su tarjeta emergente y abre la página. Un language server envía las etiquetas como números (`1`, `2`); el editor toma sus nombres.

```tsx
const problems = signal<EditorDiagnostic[]>([]);

async function lint(text: string) {
  // [{ range, severity, message, source?, code?, codeDescription?, tags?, relatedInformation? }]
  problems.set(await check(text));
}

<Editor
  value={source()}
  onChange={({ value }) => {
    source.set(value);
    lint(value);
  }}
  language="ts"
  diagnostics={problems()}
  classes={{ diagnosticWarning: "bg-orange-500", unnecessaryText: "text-zinc-400" }}
  class="flex-1"
/>
```

<a id="decorations"></a>

## Decoraciones

`decorations` aplican estilo a los rangos que elige la app: resaltado semántico de un language server, la sentencia que se está ejecutando, las líneas que cambió una revisión. El `class` y el `style` de una decoración dan estilo a su texto; `lineClass` y `lineStyle` dan estilo a las filas de sus líneas, detrás del texto. Como los diagnósticos, se mantienen sobre su texto a través de las ediciones hasta que la app establece otras nuevas.

```tsx
const range = (line: number, start: number, end: number) => ({ start: { line, column: start }, end: { line, column: end } });

<Editor
  value={source()}
  language="sql"
  readOnly
  decorations={[
    { range: range(4, 0, 0), lineClass: "bg-green-500/10" },
    { range: range(7, 6, 18), class: "underline text-blue-600" },
  ]}
  class="flex-1"
/>
```
<a id="gutter-and-overview-ruler-marks"></a>

### Marcas del margen y de la regla de vista general

El `gutter` de una decoración pone una marca en una franja anterior a los números de línea, junto a cada línea que cubre su rango: las líneas que un diff del control de versiones añadió o modificó, o un punto de interrupción (un rango vacío cubre su línea, como con `lineClass`). Con `placement: "before"` es una línea a lo ancho de la franja, en el límite anterior al inicio del rango, donde se eliminaron líneas. La franja mide `gutterDecorationsWidth` puntos de ancho (3 por defecto) y permanece mientras una decoración tenga una marca de margen, de modo que el texto conserve su lugar cuando las marcas aparecen y desaparecen. Un rango dentro de un pliegue marca la fila del pliegue.

El `overviewRuler` de una decoración pone una marca en la regla de vista general, la franja a lo largo del borde derecho del editor, de 14 puntos de ancho (el de una barra de desplazamiento; la parte `overviewRuler` establece otro ancho), que proyecta todo el texto sobre su altura, como la de Monaco. Una marca tiene al menos 6 puntos de alto y ocupa un `lane` de la regla: `left`, `center` (el valor por defecto), `right` o `full`. La regla se muestra mientras una decoración tenga una marca en ella.

Cada marca toma los `class` y `style` de la app, y se dibuja en el color de primer plano si no los tiene. Ambas siguen las ediciones igual que el rango de la decoración; una edición que elimina un rango marcado deja un rango vacío donde estaba.

```tsx
<Editor
  value={source()}
  onChange={({ value }) => source.set(value)}
  language="ts"
  decorations={[
    { range: range(2, 0, 0), gutter: { class: "bg-yellow-500" }, overviewRuler: { lane: "left", class: "bg-yellow-500" } },
    { range: { start: { line: 3, column: 0 }, end: { line: 5, column: 0 } }, gutter: { class: "bg-green-500" } },
    { range: range(6, 0, 0), gutter: { class: "bg-red-500", placement: "before" }, overviewRuler: { lane: "left", class: "bg-red-500" } },
  ]}
  class="flex-1"
/>
```

<a id="your-own-highlighting"></a>

### Tu propio resaltado

El `token` de una decoración colorea su texto como el resaltado integrado colorea ese tipo de token (`comment`, `keyword`, `string`, `number`, `title`, `attr`, `built`, `deletion`), en lugar de lo que el resaltador integrado encontró allí: el resaltador propio de la app (los tokens semánticos de un servidor de lenguaje, un analizador propio) asigna sus tokens a estos y obtiene los colores del editor en claro y oscuro. Gana el token de la decoración más interna; `class` y `style` se aplican por encima. `highlighting={false}` desactiva el resaltador integrado, de modo que los tokens de la app colorean el texto por sí solos, mientras que `language` sigue decidiendo los comentarios, los corchetes y la sangría.

```tsx
const kinds: Record<string, EditorToken> = { keyword: "keyword", function: "title", string: "string", type: "built" };

<Editor
  value={source()}
  onChange={({ value }) => source.set(value)}
  language="ts"
  highlighting={false}
  decorations={semanticTokens().map((t) => ({ range: range(t.line, t.start, t.end), token: kinds[t.type] }))}
  class="flex-1"
/>
```

<a id="folding"></a>

## Plegado

Los pliegues empiezan donde las líneas tienen más sangría que la línea anterior. `foldRanges` le da al editor los rangos propios de la app en su lugar (`{ startLine, endLine }`, la forma de los rangos de plegado de un servidor de lenguaje, que pasan tal como llegan): la línea `startLine` muestra el pliegue y las líneas siguientes hasta `endLine` se pliegan. Permanecen en sus líneas a través de las ediciones hasta que la app pasa otros nuevos.

Los pliegues se anidan: plegar un bloque mantiene plegados los pliegues que contiene, de modo que al desplegar el bloque se muestran como estaban. `foldRecursive` pliega un bloque y todos los bloques que contiene, `unfoldRecursive` los despliega todos, `foldLevel(n)` pliega todos los bloques del nivel de anidamiento `n`, y `foldSelection` (o `foldRange(range)`) pliega cualquier línea, dondequiera que empiecen los pliegues. `onFoldChange` informa de los rangos plegados después de cada cambio, y `folds()` / `setFolds(ranges)` los leen y los restauran, para conservarlos junto con el archivo.

```tsx
const ranges = signal<EditorFoldRange[]>([]);
const folded = new Map<string, EditorFoldRange[]>();

<Editor
  ref={editor}
  value={file().text}
  language={file().name}
  foldRanges={ranges()} // from the language server's textDocument/foldingRange
  onFoldChange={({ folds }) => folded.set(file().name, folds)}
  class="flex-1"
/>
<Button onPress={() => editor.foldLevel(2)}><Text>Fold the methods</Text></Button>
```

<a id="breakpoints-and-context-menus"></a>

## Puntos de interrupción y menús contextuales

Una pulsación sobre un número de línea informa de `onLineNumberPress({ line })`, el lugar para un punto de interrupción que la app dibuja como una decoración. El botón secundario (clic derecho, Control+clic en Mac) informa de `onContextMenu({ position, x, y })`: la posición en el texto bajo el puntero y el punto en la vista raíz, donde la app abre su propio menú. En pantallas táctiles, una pulsación larga, un doble toque, un tirador soltado y un toque sobre la selección también lo informan, con `selection`: el recuadro de la selección en la vista raíz (`{ x, y, width, height }`), y `x` / `y` en su punto medio superior, para el menú de edición.

```tsx
<Editor
  value={source()}
  onContextMenu={({ x, y, selection }) =>
    Menu.popup(selection ? editItems : contextItems, { x, y })
  }
/>
```

```tsx
const breakpoints = signal<number[]>([]);

<Editor
  value={source()}
  language="py"
  onLineNumberPress={({ line }) =>
    breakpoints.set(breakpoints().includes(line) ? breakpoints().filter((l) => l !== line) : [...breakpoints(), line])
  }
  decorations={breakpoints().map((line) => ({ range: range(line, 0, 0), lineClass: "bg-red-500/15" }))}
  class="flex-1"
/>
```

<a id="language-features"></a>

## Funciones del lenguaje

Las sugerencias, la información al pasar el ratón, ir a la definición y las acciones de código provienen del servidor de lenguaje de la app. El editor dibuja por sí mismo la lista de autocompletado, el autocompletado en línea y el enlace de definición, con sus teclas; para el resto, da a la app los momentos y los lugares, y la app dibuja sus ventanas emergentes (un [`Overlay`](./overlay.md) anclado a un `pageBounds`).

<a id="completion"></a>

### Autocompletado

Con `completion`, el editor pide sugerencias a la app y las muestra como una lista bajo la palabra que se está escribiendo (encima de ella cerca de la parte inferior de la ventana):

- Escribir una letra, un dígito o `_` al final de una palabra pide con `onCompletionRequest(event)`, disparador `"typing"`: `event` tiene su `id`, el `offset` y el `position` del cursor, la `query` (la palabra escrita hasta ahora) y el desplazamiento `queryStart` donde empieza. Cada uno de `completionTriggerCharacters` (`["."]`, `["::", "<"]`) pide con una consulta vacía después de él, disparador `"character"` (y el `character`), y `showCompletions()` o `run("showCompletions")` pide en el cursor, disparador `"invoked"`.
- La app responde con `presentCompletions(event.id, items)`. Cada elemento tiene la forma `CompletionItem` de un servidor de lenguaje: `label`, y opcionalmente `kind` (`"function"`, `"variable"`, `"class"`, ...), `detail`, `documentation`, `insertText`, `filterText`, `sortText` y `range`. Se muestra la respuesta a la última solicitud; una anterior, o una correspondiente a una palabra que el cursor ya dejó, se descarta.
- Seguir escribiendo filtra la lista en el sitio: la consulta coincide con el `filterText` de cada elemento (o, si no lo tiene, con su label) como letras en orden, sin distinguir mayúsculas, primero las palabras que empiezan con la consulta, luego las coincidencias más cercanas, y después por `sortText`. Las letras coincidentes resaltan. Pasa `incomplete: true` (`presentCompletions(id, items, true)`) para que el editor vuelva a pedir mientras se sigue escribiendo.
- Arriba y Abajo (y Control+P / Control+N) recorren la lista, Re Pág y Av Pág lo hacen por páginas, Intro y Tab aceptan, Escape la cierra. El puntero marca un elemento y un clic (un toque en pantallas táctiles) lo acepta. El `documentation` del elemento seleccionado se muestra junto a la lista.
- Aceptar reemplaza el `range` del elemento (o, si no lo tiene, la consulta) por su `insertText` (o, si no lo tiene, su label), como un solo paso que deshacer revierte, en el cursor y en cada uno de los demás cursores con el mismo texto anterior, e informa de `onCompletionAccept({ item })`.
- La lista se cierra cuando el cursor sale de la palabra, con un espacio u otro signo de puntuación, cuando el editor pierde el foco y cuando el cursor sale de la vista al desplazarse.

Una pausa al escribir (`inlineCompletionDelay`, 300 ms por defecto) sin lista visible pide un autocompletado en línea: `onInlineCompletionRequest({ id, offset, position })`. `presentInlineCompletion(id, text)` muestra `text` en el cursor con un color atenuado, Tab lo inserta, y Escape, una edición o un movimiento lo borran.

```tsx
let editor!: EditorRef;

<Editor
  ref={(r) => (editor = r)}
  value={source()}
  onChange={({ value }) => source.set(value)}
  language="ts"
  completion
  completionTriggerCharacters={["."]}
  onCompletionRequest={async (e) => {
    const items = await server.completion(e.position);
    editor.presentCompletions(e.id, items);
  }}
  onInlineCompletionRequest={async (e) => {
    editor.presentInlineCompletion(e.id, await assistant.suggest(e.offset));
  }}
  class="flex-1"
/>
```

<a id="hovers-and-presses"></a>

### Pasar el ratón y pulsaciones

- `onHover(event)`: el ratón reposa sobre un carácter sin ningún botón pulsado (escritorio y web; arrastrar selecciona texto). `event` tiene su `position`, su `offset` UTF-16, el `range` de su palabra, la `pagePosition` del puntero, la `pageBounds` de la palabra, los `modifiers` pulsados y los `diagnostics` de ese lugar, cuyos mensajes muestra la app. Pasar a otra palabra informa del siguiente hover de inmediato.
- `onHoverEnd()`: el ratón salió de la palabra o del editor, o el texto cambió o se desplazó bajo él.
- `onTextPress(event)`: se pulsó un carácter, después de que el editor colocara su cursor: `{ position, offset, range,
  pagePosition, modifiers, clicks }`.
- `caretBounds()` y `rangeBounds(range)`: dónde están el cursor y un rango, `{ bounds, pageBounds }` (en el editor y en la vista raíz): allí se abre una ventana emergente de la app.

```tsx
const hover = signal<EditorHoverEvent | null>(null);

<Editor
  ref={editor}
  value={source()}
  language="ts"
  onHover={(event) => hover.set(event)}
  onHoverEnd={() => hover.set(null)}
  class="flex-1"
/>
<If when={hover()}>
  {(event) => (
    <Overlay anchor={event().pageBounds} placement="top" class="rounded-md border border-border bg-popover p-2">
      <Text>{event().diagnostics.map((d) => d.message).join("\n") || describe(event().range)}</Text>
    </Overlay>
  )}
</If>
```

<a id="go-to-definition-and-code-actions"></a>

### Ir a la definición y acciones de código

Mantener pulsado Mod (Command en macOS e iOS, Control en el resto) convierte las palabras bajo el ratón en enlaces, como en los editores de código:

- Con Mod pulsado sobre una palabra (pulsado mientras el ratón reposa allí, o con el ratón movido hasta allí con la tecla ya pulsada), el editor pide con `onDefinitionRequest(event)`, disparador `"hover"`: `event` tiene su `id`, el `position` y el `offset` del carácter, y el `range` de la palabra. Responde con `presentDefinitionLink(event.id, range)` cuando el servidor de lenguaje encuentre una definición: el rango se subraya (la parte `definitionLink`) y el puntero se convierte en una mano sobre él. El enlace desaparece cuando se suelta Mod, el ratón lo abandona o el texto cambia o se desplaza, o con `hideDefinitionLink()`. Se muestra la respuesta a la última solicitud; una anterior se descarta.
- Un Mod+clic sobre una palabra pide con el disparador `"press"`; sobre el enlace el cursor se queda donde está. F12 (`goToDefinition`, `run("goToDefinition")`) pide la palabra bajo el cursor, disparador `"key"`. La app va a la definición: `revealPosition` y `setSelections` si está en el mismo texto, su propia navegación si está en otro archivo.
- Mod+. (`showCodeActions`, `run("showCodeActions")`) informa de `onCodeActionRequest({ range, position, bounds })`: la selección principal (inicio primero), el cursor y su recuadro. La app pide acciones a su servidor de lenguaje, muestra su menú en `bounds.pageBounds` (un [`Menu`](./menu.md) o un `Overlay`), y aplica las ediciones de la acción elegida con `edit(edits)`.

```tsx
let editor!: EditorRef;

<Editor
  ref={(r) => (editor = r)}
  value={source()}
  onChange={({ value }) => source.set(value)}
  language="ts"
  onDefinitionRequest={async (e) => {
    const target = await server.definition(e.position);
    if (!target) return;
    if (e.trigger === "hover") editor.presentDefinitionLink(e.id, target.originRange ?? e.range);
    else editor.revealPosition(target.range.start, true);
  }}
  onCodeActionRequest={async (e) => {
    const actions = await server.codeActions(e.range);
    const picked = await choose(actions, e.bounds?.pageBounds);
    if (picked) editor.edit(picked.edits);
  }}
  class="flex-1"
/>
```

<a id="size-and-scrolling"></a>

## Tamaño y desplazamiento

Con `minRows` y / o `maxRows` el editor crece con su texto: mide lo que miden sus filas, al menos `minRows` de ellas, y a partir de `maxRows` su texto se desplaza, como lo hace un cuadro de mensaje o una celda de un cuaderno. En caso contrario, la app le da el tamaño, y `scrollBeyondLastLine` permite que el texto se desplace más allá de su última línea: hasta una pantalla (`true`, el valor por defecto), nada en absoluto (`false`) o un número de filas. Al mover el cursor, `cursorSurroundingLines` filas permanecen visibles a su alrededor. Arrastrar una selección más allá de los bordes del editor sigue desplazando, más rápido cuanto más lejos va el puntero.

`showWhitespaces` muestra un `·` por cada espacio y un `→` por cada tabulación (la parte `whitespace`), y `rulers` dibuja una línea en cada una de sus columnas (la parte `ruler`), como guías de la longitud de una línea.

```tsx
<Editor
  defaultValue={message()}
  language="markdown"
  minRows={2}
  maxRows={8}
  rulers={[72]}
  showWhitespaces
/>
```

<a id="methods"></a>

## Métodos

`ref={editor}` da los métodos del editor (`EditorRef`), para los botones, menús y teclas de la app. Los métodos que devuelven un valor (`value()`, `selections()`, `replaceAll()`, `canUndo()`, `caretBounds()`, `folds()`, ...) devuelven en JS un `Promise` de él, así que usa `await` con ellos: `const text = await editor.value()`. Un método al que se le da una línea más allá del texto (`fold`, `scrollToLine`, `goToLine`, ...) no cambia nada y registra una advertencia con el nombre del método y la línea.

| Método | Descripción |
|---|---|
| `focus()`, `blur()` | Toma el foco, o lo cede. |
| `value()` | `Promise<string>`: el texto. |
| `setValue(value)` | Reemplaza el texto, como una edición que deshacer revierte. |
| `insert(text)` | Escribe `text` en cada selección, tal cual (los corchetes no se cierran). |
| `edit(edits)` | Aplica `{ range, text }` reemplazos (rangos del texto actual; uno que se solape con uno anterior se omite) como un solo paso que deshacer revierte; las selecciones se mueven con el texto que las rodea. Aquí van las acciones de código y las ediciones de formato. |
| `selections()` | `Promise<EditorSelection[]>`: todas las selecciones, `{ anchor, head }`, con la principal (la más reciente) al final. |
| `setSelections(selections)` | Establece las selecciones (la última es la principal) y desplaza la principal hasta dejarla a la vista. |
| `run(command)` | Ejecuta un comando, como lo harían sus teclas ([Comandos](#commands)). |
| `replace(text)` | Reemplaza la coincidencia actual y selecciona la siguiente. |
| `replaceAll(text)` | `Promise<EditorReplaceAll>`: reemplaza todas las coincidencias como una sola edición; `{ count }`, cuántas. |
| `fold(line)`, `unfold(line)` | Pliega las líneas bajo la línea `line` (desde 0), o la despliega. |
| `foldRecursive(line)`, `unfoldRecursive(line)` | Pliega el pliegue de la línea `line` y todos los pliegues que contiene, o los despliega todos. |
| `foldLevel(level)` | Pliega todos los pliegues del nivel de anidamiento `level` (1: el más externo). |
| `foldRange(range)` | Pliega las líneas de `range` (`{ startLine, endLine }`), dondequiera que empiecen los pliegues. |
| `folds()` | `Promise<EditorFoldRange[]>`: los rangos plegados, incluidos los anidados. |
| `setFolds(folds)` | Pliega exactamente `folds`. |
| `scrollToLine(line)` | Desplaza la línea `line` hasta dejarla a la vista, desplegando lo que la oculta. |
| `canUndo()`, `canRedo()` | `Promise<boolean>`: si hay una edición que deshacer, o que rehacer. |
| `caretBounds()` | `Promise<EditorBounds \| null>`: el recuadro del cursor principal, `{ bounds, pageBounds }`, en el editor (con su desplazamiento aplicado) y en la vista raíz; `null` antes de que el editor se disponga en pantalla. |
| `rangeBounds(range)` | `Promise<EditorBounds[]>`: los recuadros de `range`, uno por cada fila que cubre. |
| `scrollOffset()`, `setScrollOffset(offset)` | `Promise<Point>`: cuánto está desplazado el texto; lo desplaza hasta `{ x, y }`. |
| `visibleRange()` | `Promise<EditorRange>`: el texto que muestra el viewport, desde el inicio de su primera fila hasta el final de su última fila. |
| `selectedText()` | `Promise<string>`: el texto de la selección principal. |
| `offsetToPosition(offset)`, `positionToOffset(position)` | `Promise<EditorPosition>`, `Promise<number>`: entre desplazamientos UTF-16 de `value()` y posiciones. |
| `revealPosition(position, center)` | Desplaza `position` hasta dejarlo a la vista, desplegando lo que lo oculta; al centro con `center`. |
| `goToLine(line)` | Pone el cursor al inicio de la línea `line` (desde 0) y la desplaza al centro. |
| `showCompletions()` | Pide sugerencias en el cursor, con la palabra anterior como consulta ([Autocompletado](#completion)). |
| `presentCompletions(id, items, incomplete?)` | Responde a la solicitud de autocompletado `id`: la lista muestra `items`, filtrada por lo escrito desde entonces; con `incomplete`, seguir escribiendo vuelve a pedir. Si no hay elementos, la lista se cierra. |
| `hideCompletions()` | Cierra la lista de autocompletado. |
| `presentInlineCompletion(id, text)`, `hideInlineCompletion()` | Responde a la solicitud de autocompletado en línea `id` con `text`, mostrado en el cursor; lo borra. |
| `presentDefinitionLink(id, range)`, `hideDefinitionLink()` | Responde a la solicitud de definición `id` (disparador `"hover"`): `range` se subraya como un enlace ([Ir a la definición](#go-to-definition-and-code-actions)); lo oculta. |

```tsx
let editor!: EditorRef;

<Button onPress={() => editor.run("toggleComment")}><Text>Comment</Text></Button>
<Button onPress={async () => save(await editor.value())}><Text>Save</Text></Button>
<Button onPress={async () => (await editor.canUndo()) && editor.run("undo")}><Text>Undo</Text></Button>
<Button onPress={() => editor.setSelections([{ anchor: { line: 0, column: 0 }, head: { line: 0, column: 0 } }])}>
  <Text>Go to the top</Text>
</Button>
<Editor ref={editor} value={source()} onChange={({ value }) => source.set(value)} language="rs" class="flex-1" />
```
<a id="commands"></a>

### Comandos

`run` recibe los comandos del editor por nombre (`EditorCommand`):

| Comandos | Qué hacen |
|---|---|
| `moveLeft`, `moveRight`, `moveUp`, `moveDown`, `moveWordLeft`, `moveWordRight`, `moveLineStart`, `moveLineEnd`, `movePageUp`, `movePageDown`, `moveDocumentStart`, `moveDocumentEnd` | Mueven los cursores. |
| `selectLeft`, `selectRight`, `selectUp`, `selectDown`, `selectWordLeft`, `selectWordRight`, `selectLineStart`, `selectLineEnd`, `selectPageUp`, `selectPageDown`, `selectDocumentStart`, `selectDocumentEnd` | Amplían las selecciones. |
| `moveToMatchingBracket` | Va al corchete que corresponde al que está en el cursor. |
| `selectAll`, `selectLine`, `selectWord`, `selectNextOccurrence`, `selectPreviousOccurrence`, `selectAllOccurrences` | Seleccionan. |
| `moveSubwordLeft`, `moveSubwordRight`, `selectSubwordLeft`, `selectSubwordRight` | Mueven o amplían por partes de una palabra (segmentos de camelCase, partes de snake_case). |
| `moveParagraphUp`, `moveParagraphDown`, `selectParagraphUp`, `selectParagraphDown` | Mueven o amplían hasta la línea en blanco anterior o posterior al párrafo. |
| `expandSelection`, `shrinkSelection` | Amplían las selecciones en una unidad, o las reducen. |
| `undoSelection`, `redoSelection` | Vuelven a las selecciones previas al último movimiento, o avanzan de nuevo. |
| `splitSelectionIntoLines` | Una selección por cada línea de cada selección. |
| `addCaretAbove`, `addCaretBelow`, `singleSelection` | Añaden un cursor; vuelven a una sola selección. |
| `deleteBackward`, `deleteForward`, `deleteWordLeft`, `deleteWordRight`, `deleteToLineStart`, `deleteToLineEnd`, `deleteLine` | Eliminan. |
| `newline`, `newlineBelow`, `newlineAbove`, `indent`, `outdent`, `toggleComment`, `toggleBlockComment` | Líneas, sangría y comentarios. |
| `sortLinesAscending`, `sortLinesDescending` | Ordenan las líneas seleccionadas (todas las líneas si solo hay un cursor). |
| `transformToUppercase`, `transformToLowercase`, `transformToTitleCase` | Cambian entre mayúsculas y minúsculas las selecciones (con un cursor: su palabra). |
| `trimTrailingWhitespace` | Elimina los espacios en blanco al final de cada línea. |
| `moveLinesUp`, `moveLinesDown`, `duplicateLinesUp`, `duplicateLinesDown`, `joinLines`, `transposeCharacters` | Reorganizan. |
| `undo`, `redo` | Deshacer y rehacer. |
| `fold`, `unfold`, `foldAll`, `unfoldAll` | Pliegan en la línea del cursor, o todo. |
| `foldRecursive`, `unfoldRecursive` | Pliegan el bloque del cursor y todos los que contiene, o los despliegan. |
| `foldSelection` | Pliega las líneas de cada selección que abarca varias. |
| `findNext`, `findPrevious` | Seleccionan la coincidencia siguiente o anterior de `search`. |
| `findWithSelection` | Informa del texto seleccionado a la barra de búsqueda (`onFindWithSelection`). |
| `copy`, `cut`, `paste` | El portapapeles. |
| `showCompletions` | Solicita sugerencias de autocompletado en el cursor ([Autocompletado](#completion)). |
| `goToDefinition` | Solicita la definición de la palabra en el cursor (`onDefinitionRequest`, disparador `"key"`). |
| `showCodeActions` | Solicita las acciones de código en la selección (`onCodeActionRequest`). |

<a id="styling-the-parts"></a>

## Estilo de las partes

`class` y `style` dan estilo al contenedor del editor. `classes` recibe clases de Tailwind por parte y `styles` estilos en línea por parte; las clases de una parte van después de sus propios estilos por defecto, así que prevalecen, y sus `styles` prevalecen sobre sus clases. La fuente se define con `fontFamily`, `fontSize` y `lineHeight`, con los que el editor mide su texto.

```tsx
<Editor
  value={source()}
  onChange={({ value }) => source.set(value)}
  language="tsx"
  fontFamily="JetBrains Mono"
  fontSize={14}
  lineHeight={22}
  class="flex-1 rounded-lg border border-border"
  classes={{
    gutter: "bg-muted",
    lineNumber: "text-xs",
    activeLine: "bg-yellow-500/10",
    selection: "bg-blue-500/30",
  }}
  styles={{ caret: { backgroundColor: "#f59e0b", width: 3 } }}
/>
```

| Parte | Qué es | Valor por defecto |
|---|---|---|
| `gutter` | La columna de números de línea y marcadores de plegado | 12pt antes de los números, 4pt después de los marcadores |
| `lineNumber` | Cada número de línea | Alineado a la derecha, `muted-foreground` |
| `activeLineNumber` | Los números de las líneas con un cursor, después de `lineNumber` | `foreground` |
| `foldMarker` | El marcador de una línea donde empieza un pliegue | `⌄`, `›` plegado, `muted-foreground` |
| `overviewRuler` | La regla de vista general en el borde derecho, mientras una decoración tiene una marca ahí | ninguno |
| `content` | El área de texto junto al margen | 4pt antes del texto |
| `line` | Cada fila de texto | |
| `activeLine` | Detrás de las filas de las líneas con un cursor, debajo de los indicadores de desplazamiento | `muted`, tenue |
| `selection` | Detrás del texto seleccionado | Un tono de `primary` |
| `caret` | Los cursores | 2pt de ancho, `foreground`, parpadeante |
| `composition` | El texto que compone un método de entrada | Subrayado |
| `searchMatch` | Las coincidencias de `search` | Ámbar translúcido |
| `currentSearchMatch` | La coincidencia en la que está la selección, después de `searchMatch` | Ámbar más intenso |
| `matchingBracket` | El corchete en el cursor y su pareja | Un borde de 1pt |
| `indentGuide` | Una guía por nivel de sangría | Una línea de 1pt de `border` |
| `foldPlaceholder` | Lo que muestra una línea plegada después de su texto | ` ⋯ `, `muted-foreground` |
| `placeholder` | Se muestra mientras el texto está vacío | `muted-foreground` |
| `diagnosticError` | La línea bajo un error | `destructive` |
| `diagnosticWarning` | La línea bajo una advertencia | Ámbar |
| `diagnosticInfo` | La línea bajo un mensaje informativo | Azul |
| `diagnosticHint` | La línea bajo una sugerencia | `muted-foreground` |
| `unnecessaryText` | El texto de un diagnóstico `unnecessary` | `muted-foreground` |
| `deprecatedText` | El texto de un diagnóstico `deprecated` | Tachado |
| `whitespace` | Las marcas de espacios y tabulaciones (`showWhitespaces`) | `·` y `→`, `muted-foreground` al 60 % |
| `ruler` | Las líneas de `rulers` | Una línea de 1 punto de `border` |
| `selectionHandle` | Los tiradores de los controles en los extremos de una selección táctil | Un punto de 10pt de `primary` |
| `selectionHandleStart`, `selectionHandleEnd` | El tirador del inicio (sobre su línea) y el del final (debajo), después de `selectionHandle` | |
| `completionMenu` | El cuadro de la lista de autocompletado | `popover`, un `border` de 1pt, redondeado, con sombra |
| `completionItem` | Cada elemento de la lista | La altura de una fila, 8pt de relleno |
| `selectedCompletionItem` | El elemento seleccionado, después de `completionItem` | `accent` |
| `completionMatch` | Las letras de una etiqueta que coinciden con la consulta | Seminegrita, `primary` |
| `completionDetail` | El detalle de un elemento, después de su etiqueta | Alineado a la derecha, `muted-foreground` |
| `completionKind` | El tipo de un elemento, antes de su etiqueta | Un nombre corto (`fn`, `var`, `cls`), `muted-foreground` |
| `completionDocumentation` | La documentación del elemento seleccionado, junto a la lista | Como `completionMenu`, con un ancho máximo de 320pt |
| `inlineCompletion` | El autocompletado en línea en el cursor | `muted-foreground` |
| `definitionLink` | El subrayado del enlace de definición | Una línea de 1pt de `primary` bajo el texto |

## Props

| Prop | Rust | Tipo | Valor por defecto | Descripción |
|---|---|---|---|---|
| `value` | `.value(..)` | `string` | | El texto, controlado por la aplicación (vuelve a asignarlo desde `onChange`). |
| `defaultValue` | `.default_value(..)` | `string` | | El texto inicial, cuando el editor mantiene el suyo. |
| `language` | `.language(..)` | `string` | texto sin formato | El nombre, alias, extensión o nombre de archivo de un lenguaje ([Lenguajes](#languages)). |
| `placeholder` | `.placeholder(..)` | `string` | | Se muestra mientras el texto está vacío. |
| `readOnly` | `.read_only(..)` | `boolean` | `false` | El texto se selecciona y se copia, pero no se modifica. |
| `autoFocus` | `.auto_focus(..)` | `boolean` | `false` | Recibe el foco al aparecer. |
| `lineNumbers` | `.line_numbers(..)` | `boolean` | `true` | Los números de línea del margen. |
| `softWrap` | `.soft_wrap(..)` | `boolean` | `false` | Las líneas largas se ajustan al ancho del editor. |
| `tabSize` | `.tab_size(..)` | `number` | el del lenguaje | Las columnas de una tabulación y de un nivel de sangría. |
| `hardTabs` | `.hard_tabs(..)` | `boolean` | el del lenguaje | Sangra con tabulaciones. |
| `folding` | `.folding(..)` | `boolean` | `true` | Las líneas con sangría se pliegan con los marcadores del margen. |
| `foldRanges` | `.fold_ranges(..)` | `EditorFoldRange[]` | por sangría | Dónde empiezan los pliegues, los de la aplicación ([Plegado](#folding)). |
| `highlighting` | `.highlighting(..)` | `boolean` | `true` | El resaltado de sintaxis integrado ([Resaltado propio](#your-own-highlighting)). |
| `autoClose` | `.auto_close(..)` | `boolean` | `true` | Los corchetes y las comillas se cierran al escribirlos. |
| `autoIndent` | `.auto_indent(..)` | `boolean` | `true` | Una nueva línea conserva la sangría y sangra tras un corchete de apertura. |
| `activeLine` | `.active_line(..)` | `boolean` | `true` | Se resaltan las filas de las líneas con un cursor. |
| `indentGuides` | `.indent_guides(..)` | `boolean` | `true` | Las guías de sangría. |
| `scrollBeyondLastLine` | `.scroll_beyond_last_line(..)` | `boolean \| number` | `true` | El texto se desplaza más allá de su última línea: hasta una pantalla (`true`), nada (`false`) o ese número de filas. |
| `fontFamily` | `.font_family(..)` | `string` | el `font-mono` del tema | La fuente con la que se dibuja y se mide el texto. |
| `fontSize` | `.font_size(..)` | `number` | `13` | El tamaño de la fuente, en puntos. |
| `lineHeight` | `.line_height(..)` | `number` | `20` | La altura de una fila, en puntos. |
| `search` | `.search(..)` | `EditorSearch` | | Qué buscar ([Buscar y reemplazar](#find-and-replace)). |
| `diagnostics` | `.diagnostics(..)` | `EditorDiagnostic[]` | `[]` | Problemas que se marcarán ([Diagnósticos](#diagnostics)). |
| `decorations` | `.decorations(..)` | `EditorDecoration[]` | `[]` | Rangos a los que la aplicación da estilo ([Decoraciones](#decorations)). |
| `gutterDecorationsWidth` | `.gutter_decorations_width(..)` | `number` | `3` | El ancho de la franja del margen con las marcas de las decoraciones, en puntos. |
| `classes` | `.classes(..)` | `EditorClasses` | `{}` | Clases de Tailwind por parte. |
| `styles` | `.styles(..)` | `EditorStyles` | `{}` | Estilos en línea por parte, por encima de las clases. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | | Cómo llaman los lectores de pantalla al editor. |
| `showWhitespaces` | `.show_whitespaces(..)` | `boolean` | `false` | Los espacios y las tabulaciones se muestran como `·` y `→`. |
| `rulers` | `.rulers(..)` | `number[]` | `[]` | Columnas en las que dibujar una línea vertical. |
| `minRows` | `.min_rows(..)` | `number` | | El editor crece con su texto a partir de este número de filas ([Tamaño y desplazamiento](#size-and-scrolling)). |
| `maxRows` | `.max_rows(..)` | `number` | | El editor crece con su texto hasta este número de filas y luego se desplaza. |
| `cursorSurroundingLines` | `.cursor_surrounding_lines(..)` | `number` | `1` | Las filas que se mantienen a la vista sobre y bajo el cursor. |
| `completion` | `.completion(..)` | `boolean` | `false` | El editor solicita sugerencias y las muestra en una lista ([Autocompletado](#completion)). |
| `completionTriggerCharacters` | `.completion_trigger_characters(..)` | `string[]` | `[]` | Qué más solicita sugerencias de autocompletado mientras se escribe. |
| `inlineCompletionDelay` | `.inline_completion_delay(..)` | `number` | `300` | Milisegundos de pausa al escribir antes de solicitar un autocompletado en línea. |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | | El contenedor del editor. |

<a id="events"></a>

## Eventos

| Evento | Rust | Descripción |
|---|---|---|
| `onChange` | `.on_change(\|value: &SharedString\| ..)` | El texto cambió: `{ value }`, el nuevo texto completo. |
| `onSelectionChange` | `.on_selection_change(\|selections: &Vec<EditorSelection>\| ..)` | Las selecciones cambiaron: `{ selections }`, todas, con la principal al final. |
| `onFocus`, `onBlur` | `.on_focus(\|\| ..)`, `.on_blur(\|\| ..)` | El editor recibió o perdió el foco. |
| `onSearchChange` | `.on_search_change(\|result: &EditorSearchResult\| ..)` | Las coincidencias de la búsqueda cambiaron: `{ result }`, un `{ count, current, error }`. |
| `onLineNumberPress` | `.on_line_number_press(\|line: &u32\| ..)` | Se pulsó un número de línea: `{ line }`, la línea, empezando en 0. |
| `onContextMenu` | `.on_context_menu(\|event: &EditorContextMenuEvent\| ..)` | Se pulsó el botón secundario sobre el texto, o un toque seleccionó texto: `{ position, x, y, selection? }`. |
| `onHover` | `.on_hover(\|event: &EditorHoverEvent\| ..)` | El ratón se detiene sobre un carácter ([Funciones del lenguaje](#language-features)). |
| `onHoverEnd` | `.on_hover_end(\|\| ..)` | El hover terminó. |
| `onTextPress` | `.on_text_press(\|event: &EditorTextPressEvent\| ..)` | Se pulsó un carácter: con su palabra, los modificadores y los clics. |
| `onFindWithSelection` | `.on_find_with_selection(\|query: &String\| ..)` | Se ejecutó `findWithSelection`: `{ query }`, el texto para la consulta de la barra de búsqueda. |
| `onFoldChange` | `.on_fold_change(\|folds: &Vec<EditorFoldRange>\| ..)` | Los rangos plegados cambiaron: `{ folds }`, todos, incluidos los anidados. |
| `onCompletionRequest` | `.on_completion_request(\|event: &EditorCompletionRequest\| ..)` | El editor solicita sugerencias de autocompletado: `{ id, offset, position, query, queryStart, trigger, character? }` ([Autocompletado](#completion)). |
| `onCompletionAccept` | `.on_completion_accept(\|event: &EditorCompletionAcceptEvent\| ..)` | Se aceptó e insertó un elemento: `{ item }`. |
| `onInlineCompletionRequest` | `.on_inline_completion_request(\|event: &EditorInlineCompletionRequest\| ..)` | Se hizo una pausa al escribir: `{ id, offset, position }`, para un autocompletado en línea. |
| `onDefinitionRequest` | `.on_definition_request(\|event: &EditorDefinitionRequest\| ..)` | El editor solicita una definición: `{ id, position, offset, range, trigger }` ([Ir a la definición](#go-to-definition-and-code-actions)). |
| `onCodeActionRequest` | `.on_code_action_request(\|event: &EditorCodeActionRequest\| ..)` | El usuario solicitó acciones de código: `{ range, position, bounds? }`. |

<a id="accessibility"></a>

## Accesibilidad

Los lectores de pantalla llaman al editor por su `accessibilityLabel`; su foco es el de un campo de texto, de modo que los servicios de texto de la plataforma (métodos de entrada, dictado, teclados en pantalla) funcionan en él.

<a id="related"></a>

## Relacionado

- [TextView](./text-view.md): documentos de Markdown y HTML, cuyos bloques de código comparten los colores de sintaxis del editor.
- [DiffView](./diff-view.md): los cambios entre dos textos, con los colores de sintaxis del editor.
- [Input](./input.md): campos de texto de una y varias líneas con la edición propia de la plataforma.
- [`keymap`](../modules/nsh.md#keymap): las teclas de la aplicación para los comandos del editor.
- [`nsh/base`](../modules/nsh-base.md): los demás componentes base.
