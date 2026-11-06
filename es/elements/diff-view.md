---
title: "DiffView"
description: "El componente DiffView: los cambios entre dos textos o de un parche, en paralelo o unificados, con las palabras modificadas dentro de las líneas resaltadas, las líneas sin cambios contraídas en separadores que se expanden, resaltado de sintaxis, ajuste de línea, acciones por cambio, selección de líneas y anotaciones de revisión."
group: base
demo: el-diff-view
source_hash: 2004ab3c0d854626
---


# DiffView

`DiffView` muestra los cambios entre dos textos como las herramientas de revisión de código: en paralelo, con el texto antiguo a la izquierda y el nuevo a la derecha y sus líneas alineadas, o unificado, con las líneas eliminadas encima de las añadidas. Dentro de una línea modificada se resaltan las palabras que cambiaron, las líneas sin cambios entre dos cambios se pliegan en separadores que se pueden expandir, y el texto se resalta con los colores de sintaxis del [`Editor`](./editor.md). Muestra dos textos (`oldValue` y `newValue`) o los archivos de un diff unificado (`patch`: el de `git diff`, el de un pull request), cada uno bajo su encabezado, y está pensado para revisar cambios, entre ellos las ediciones propuestas por una IA: las acciones de la app sobre cada cambio lo conservan o lo revierten. Solo se crean las filas visibles, de modo que un archivo largo se desplaza igual que uno corto.

`DiffView` se encarga del comportamiento y viene con un aspecto propio construido a partir de los tokens del tema: el `font-mono` del tema a 13pt en filas de 20pt, números de línea en `muted-foreground`, líneas añadidas con tinte verde y líneas eliminadas con tinte rojo, las palabras modificadas con un tinte más intenso, una barra en el borde del margen de cada línea modificada y separadores en `muted`. Cada parte aplica los estilos de la app sobre estos valores por defecto (`classes` y `styles`). Rust crea una con `nsh_base::diff_view()`, TSX con `<DiffView>` de `nsh/base`.

```rust tabs
use nsh_base::diff_view;
use nsh_core::prelude::*;

const OLD: &str = "fn total(prices: &[u32]) -> u32 {\n    prices.iter().sum()\n}\n";
const NEW: &str = "fn total(prices: &[u64]) -> u64 {\n    prices.iter().copied().sum()\n}\n";

fn review() -> impl IntoElement {
    diff_view().old_value(OLD).new_value(NEW).language("rust").flex_1()
}
```

```tsx tabs
import { mount } from "nsh";
import { DiffView } from "nsh/base";

const OLD = `fn total(prices: &[u32]) -> u32 {
    prices.iter().sum()
}
`;
const NEW = `fn total(prices: &[u64]) -> u64 {
    prices.iter().copied().sum()
}
`;

function App() {
  return <DiffView oldValue={OLD} newValue={NEW} language="rust" class="flex-1" />;
}

mount(App);
```

La vista ocupa la caja que le da la app (`flex-1`, una altura) y se desplaza dentro de ella: en vertical por las filas, y en horizontal hasta la línea más larga, con los dos lados de una vista dividida a la vez. Con `softWrap` las líneas largas se ajustan al ancho del lado en lugar de desplazarse, y una fila dividida es tan alta como su lado más alto, de modo que los lados siguen alineados.

<a id="two-texts-or-a-patch"></a>

## Dos textos o un parche

- **Dos textos**: `oldValue` y `newValue`. Las líneas se comparan tal cual, así que añadir o eliminar un salto de línea final cuenta como un cambio, como lo muestra git.
- **Un parche**: `patch`, un diff unificado de uno o varios archivos (`git diff`, `git format-patch`, `diff -u`; renombrados, modos, archivos nuevos, eliminados y binarios, y un mensaje de commit antes, leídos como los escribe git). La vista muestra las líneas de sus hunks, numeradas como en el archivo, cada hunk bajo un separador con su encabezado (la función en la que está), y cada archivo de un conjunto bajo un encabezado propio ([Archivos de un parche](#files-of-a-patch)). La ruta de cada archivo indica su lenguaje cuando `language` no está definido.

```tsx
const PATCH = `diff --git a/src/total.rs b/src/total.rs
--- a/src/total.rs
+++ b/src/total.rs
@@ -10,3 +10,3 @@ impl Cart {
-    fn total(&self) -> u32 {
+    fn total(&self) -> u64 {
         self.prices.iter().sum()
     }
`;

<DiffView patch={PATCH} layout="unified" class="flex-1" />
```

`language` indica el lenguaje igual que el de `Editor`: un nombre, un alias, una extensión o un nombre de archivo (`"rust"`, `"tsx"`, `"main.go"`, `"Dockerfile"`).

<a id="files-of-a-patch"></a>

## Archivos de un parche

Un parche de varios archivos muestra cada archivo bajo una fila de encabezado: por defecto, su ruta (`old → new` si fue renombrado), sus recuentos de líneas añadidas y eliminadas, y `▾`, y al pulsarla se pliega el archivo hasta su encabezado (`▸`) o se expande. `renderFileHeader` dibuja los encabezados a la manera de la app (y también muestra uno encima de un parche de un solo archivo), recibiendo el archivo (`DiffFile`): `index`, `path`, `oldPath` (renombrado o copiado desde), `status` (`"modified"`, `"added"`, `"deleted"`, `"renamed"`, `"copied"`), `binary` (el parche no muestra líneas de él), `added`, `deleted`, `hunks`, `firstHunk` y `collapsed`. El encabezado de la app llama al `toggleFile(path)` del ref; `collapseFile` y `expandFile` establecen el estado, y cada cambio se notifica con `onFileToggle({ file })`. Un archivo plegado sigue plegado mientras un nuevo `patch` aún lo contenga.

Los cambios se cuentan entre archivos, en orden: los cambios de un archivo van de `firstHunk` a `firstHunk + hunks - 1`, que `goToHunk`, `renderHunkActions` y `hunks()` utilizan (el `file` de un `DiffHunk` es el índice de su archivo y sus líneas se cuentan dentro de ese archivo), y `stats()` suma los de todos los archivos. `goToHunk` expande primero un archivo plegado.

```tsx
let diff!: DiffViewRef;
const files = signal<DiffFile[]>([]);

<View class="flex-1 flex-row">
  <View class="w-48">
    <Each of={files()}>
      {(file) => (
        <Button onPress={() => diff.scrollToFile(file().path)} class="px-2 py-1">
          <Text class="text-sm">{file().path} +{file().added} −{file().deleted}</Text>
        </Button>
      )}
    </Each>
  </View>
  <DiffView
    ref={(r) => {
      diff = r;
      r.files().then((list) => files.set(list));
    }}
    patch={PULL_REQUEST}
    renderFileHeader={(file) => (
      <Button onPress={() => diff.toggleFile(file.path)} class="flex-1 flex-row items-center gap-2 bg-muted px-2">
        <Text>{file.collapsed ? "▸" : "▾"}</Text>
        <Text class="flex-1 text-sm font-medium">{file.oldPath ? `${file.oldPath} → ${file.path}` : file.path}</Text>
        <Text class="text-xs text-muted-foreground">{file.binary ? "Binary" : file.status}</Text>
      </Button>
    )}
    class="flex-1"
  />
</View>
```

<a id="layout-and-inline-changes"></a>

## Disposición y cambios en línea

`layout` es `"split"` (el valor por defecto: en paralelo, cada línea eliminada junto a la línea añadida más parecida) o `"unified"` (una columna, las líneas eliminadas de un cambio encima de las añadidas, con ambos números de línea). `inline` decide qué se resalta dentro de una línea modificada:

| `inline` | Qué se resalta |
|---|---|
| `"wordAlt"` (por defecto) | Las palabras que cambiaron, unidas cuando las separa un solo carácter, de modo que una frase modificada se lea como una |
| `"word"` | Cada palabra que cambió |
| `"char"` | Cada carácter que cambió |
| `"none"` | Nada: solo el tinte de las líneas |

Las palabras son secuencias de letras, dígitos y `_`; cada carácter CJK, kana y sílaba hangul es una palabra en sí misma, de modo que un carácter modificado en una frase solo se marca a sí mismo. Una línea que cambió casi por completo muestra solo su tinte.

`indicators` marca las líneas modificadas junto a sus números: `"bars"` (por defecto, una barra en el borde del margen), `"classic"` (`+` y `−` antes del texto) o `"none"`. `background={false}` deja sin tinte las líneas modificadas, y `lineNumbers={false}` oculta los números.

```tsx
<DiffView oldValue={before()} newValue={after()} language="md" layout="unified" inline="word" indicators="classic" class="flex-1" />
```

<a id="collapsed-lines"></a>

## Líneas plegadas

Alrededor de cada cambio se muestran `contextLines` líneas sin cambios (3 por defecto); las líneas sin cambios entre cambios, y las anteriores al primero y posteriores al último, se pliegan en un separador que indica cuántas líneas oculta. Al pulsarlo se muestran todas. `expandAll` muestra todas las líneas; `expand`, `expandAll()` y `collapseAll()` del ref las revelan y las pliegan desde la app.

`renderSeparator` dibuja los separadores a la manera de la app. Recibe el separador (`DiffSeparator`): `gap`, el índice de la serie plegada (0 antes del primer cambio, `i` entre los cambios `i - 1` y `i`), `lines`, cuántas líneas oculta, `first` y `last`, y, en un parche, el `header` del hunk. `expand(gap, direction, lines)` muestra `"all"` sus líneas (por defecto), o `lines` (20 por defecto) `"up"`, justo encima del cambio situado bajo el separador, o `"down"`, justo debajo del cambio situado encima. El primer separador se expande hacia arriba y el último hacia abajo.

```tsx
let diff!: DiffViewRef;

<DiffView
  ref={diff}
  oldValue={before()}
  newValue={after()}
  language="ts"
  renderSeparator={(sep) => (
    <View class="flex-1 flex-row items-center gap-1 bg-muted px-2">
      <If when={!sep.first}>
        <Button onPress={() => diff.expand(sep.gap, "down")} class="px-1"><Text>↓</Text></Button>
      </If>
      <If when={!sep.last}>
        <Button onPress={() => diff.expand(sep.gap, "up")} class="px-1"><Text>↑</Text></Button>
      </If>
      <Button onPress={() => diff.expand(sep.gap)} class="flex-1">
        <Text class="text-xs text-muted-foreground">{sep.header ?? `${sep.lines} unchanged lines`}</Text>
      </Button>
    </View>
  )}
  class="flex-1"
/>
```

<a id="keeping-and-reverting-changes"></a>

## Conservar y revertir cambios

`renderHunkActions` coloca las acciones de la app arriba a la derecha de cada cambio visible, recibiendo el cambio (`DiffHunk`: `index`, `oldStart`, `oldLines`, `newStart`, `newLines`, líneas desde 0, y `file`, el índice de su archivo en un parche). Llaman al ref: `revertHunk(index)` devuelve las líneas antiguas del cambio al texto nuevo, `acceptHunk(index)` convierte sus líneas nuevas en las del texto antiguo. La vista muestra el resultado al instante e informa de ambos textos con `onChange({ change })` (`{ oldValue, newValue }`), que la app establece como las props. Conservar o revertir la edición de una IA cambio a cambio es esto:

```tsx
import { signal, Text, View } from "nsh";
import { Button, DiffView, type DiffViewRef } from "nsh/base";

function Proposal(props: { file: string; current: string; proposed: string; onApply: (text: string) => void }) {
  let diff!: DiffViewRef;
  const current = signal(props.current);
  const proposed = signal(props.proposed);
  return (
    <View class="flex-1">
      <DiffView
        ref={diff}
        oldValue={current()}
        newValue={proposed()}
        language={props.file}
        onChange={({ change: { oldValue, newValue } }) => {
          current.set(oldValue);
          proposed.set(newValue);
          props.onApply(oldValue);
        }}
        renderHunkActions={(hunk) => (
          <View class="flex-row gap-1">
            <Button onPress={() => diff.revertHunk(hunk.index)} class="rounded bg-background px-2 py-0.5 border border-border">
              <Text class="text-xs">Revert</Text>
            </Button>
            <Button onPress={() => diff.acceptHunk(hunk.index)} class="rounded bg-primary px-2 py-0.5">
              <Text class="text-xs text-primary-foreground">Keep</Text>
            </Button>
          </View>
        )}
        class="flex-1"
      />
    </View>
  );
}
```

Aquí el texto antiguo es el archivo tal como está: conservar un cambio lo aplica al archivo (`onApply`), revertirlo lo quita de la propuesta. Una vista que muestra un `patch` muestra extractos de los archivos, y sus cambios se quedan como están.

<a id="methods"></a>

## Métodos

`ref={diff}` da acceso a los métodos de la vista (`DiffViewRef`). Los métodos que devuelven un valor (`hunks()`, `stats()`) devuelven en JS una `Promise` de él, así que hay que usar `await` con ellos: `const changes = await diff.hunks()`. Para los recuentos que se muestran en pantalla, `onStatsChange` los notifica a medida que cambian. Un método al que se le pasa un cambio, un separador o un archivo que el diff no tiene no modifica nada y registra una advertencia con el nombre del método y el valor.

| Método | Descripción |
|---|---|
| `hunks()` | `Promise<DiffHunk[]>`: los cambios, en orden. |
| `stats()` | `Promise<DiffStats>`: `{ added, deleted, hunks }`, las líneas añadidas y eliminadas y el número de cambios. |
| `goToHunk(index)` | Desplaza el cambio `index` a la vista, con su primera fila arriba. |
| `revertHunk(index)` | Devuelve las líneas antiguas del cambio `index` al texto nuevo e informa de los textos (`onChange`). |
| `acceptHunk(index)` | Convierte las líneas nuevas del cambio `index` en las del texto antiguo e informa de los textos (`onChange`). |
| `expand(gap, direction?, lines?)` | Muestra las líneas que oculta el separador `gap`: `"all"` (por defecto), o `lines` (20 por defecto) `"up"` o `"down"`. |
| `expandAll()` | Muestra todas las líneas sin cambios. |
| `collapseAll()` | Vuelve a plegar las líneas sin cambios. |
| `nextHunk()` | `Promise<number \| null>`: desplaza el siguiente cambio arriba y devuelve su índice (después del último, el primero). |
| `previousHunk()` | `Promise<number \| null>`: desplaza el cambio anterior arriba y devuelve su índice (antes del primero, el último). |
| `currentHunk()` | `Promise<number \| null>`: el último cambio al que se fue mientras la vista sigue ahí; si no, el que está arriba de la vista o el primero visible. |
| `selectedLines()` | `Promise<DiffLineRange \| null>`: las líneas seleccionadas en los números de línea. |
| `setSelectedLines(range)` | Selecciona líneas de un lado (`null`: ninguna), sin `onLineSelectionChange`. |
| `selectedText()` | `Promise<string>`: el texto de las líneas seleccionadas. |
| `files()` | `Promise<DiffFile[]>`: los archivos del parche, en orden, con sus recuentos (ninguno para dos textos). |
| `scrollToFile(path)` | Desplaza el encabezado del archivo en `path` hasta arriba. |
| `collapseFile(path)` | Muestra solo el encabezado del archivo en `path`. |
| `expandFile(path)` | Vuelve a mostrar las líneas del archivo en `path`. |
| `toggleFile(path)` | Pliega el archivo en `path`, o lo expande si está plegado. |
| `hunkBounds()` | `Promise<DiffHunkBounds[]>`: dónde está cada cambio en las filas, en orden ([Una regla de vista general](#an-overview-ruler)). |
| `scrollOffset()` | `Promise<Point>`: cuánto se han desplazado las filas (`x` es 0). |
| `setScrollOffset(offset)` | Desplaza las filas a `offset.y` al instante, hasta donde lleguen, como un thumb que sigue al puntero que lo arrastra. |

`nextHunk()` y `previousHunk()` continúan desde el cambio al que fueron mientras la vista sigue ahí, y si no, desde la parte superior de la vista, de modo que un cambio cercano al final que no puede desplazarse hasta arriba también cuenta. Botones de cambio siguiente y anterior, con los recuentos de `onStatsChange`:

```tsx
let diff!: DiffViewRef;
const stats = signal<DiffStats>({ added: 0, deleted: 0, hunks: 0 });

<View class="flex-row items-center gap-2 p-2">
  <Text class="text-sm text-green-600">+{stats().added}</Text>
  <Text class="text-sm text-red-600">−{stats().deleted}</Text>
  <Text class="text-sm text-muted-foreground">{stats().hunks} changes</Text>
  <Button onPress={() => diff.previousHunk()}><Text>Previous</Text></Button>
  <Button onPress={() => diff.nextHunk()}><Text>Next</Text></Button>
</View>
<DiffView ref={diff} oldValue={before()} newValue={after()} onStatsChange={(e) => stats.set(e.stats)} class="flex-1" />
```

<a id="an-overview-ruler"></a>

## Una regla de vista general

`onScroll({ offset, contentSize, size })` informa de dónde están las filas, con las claves de las de un [`Scroll`](./scroll.md): `offset.y`, cuánto se han desplazado (las filas se desplazan en vertical, con el ancho de la vista, y los lados en horizontal por su cuenta: `offset.x` es 0), `contentSize`, el tamaño de todas las filas juntas, y `size`, el del viewport. Se dispara una vez que la vista está maquetada y de nuevo cada vez que cambia alguno de ellos: al desplazar las filas, al cambiar el tamaño de la vista y cuando las filas cambian de altura (otros textos, `layout`, `softWrap`, un archivo o un separador expandido o plegado, una anotación maquetada). `hunkBounds()` indica dónde está cada cambio en las filas (`DiffHunkBounds`: `{ index, bounds }`, `bounds` desde la parte superior de su primera fila hasta la inferior de la última, con las anotaciones debajo, a lo ancho de la vista), los cambios que se muestran: los de un archivo plegado no tienen filas. `onHunkBoundsChange({ hunkBounds })` da la misma lista una vez que la vista está maquetada y de nuevo cada vez que un cambio se mueve o cambia de tamaño, incluso cuando las filas mantienen su altura (una línea modificada que pasa a ser otra): una regla dibuja sus marcas a partir de ella en lugar de leerlas en `onScroll`. `scrollOffset()` lee cuánto se han desplazado las filas, y `setScrollOffset({ x, y })` desplaza las filas a `y` al instante, de modo que un thumb arrastrado sigue al puntero en el mismo fotograma.

Juntos forman una regla de vista general junto a la vista, como las de los editores de código: una marca por cada cambio, un thumb sobre las filas visibles y una pulsación o un arrastre que desplaza hasta ese punto. Aquí la regla tiene la misma altura que la vista:

```rust tabs
use nsh_base::{DiffHunkBounds, DiffView, DiffViewApi, DiffViewEvent, diff_view, theme};
use nsh_core::prelude::*;

fn review(old: SharedString, new: SharedString) -> impl IntoElement {
    let diff = component_ref::<DiffView>();
    let ruler = element_ref();
    let ruler_top = stored(px(0.0));
    // How far the rows are scrolled, their height and the viewport's.
    let rows = signal((px(0.0), px(0.0), px(0.0)));
    let marks = signal(Vec::<DiffHunkBounds>::new());
    // Points of the rows per point of the ruler.
    let scale = move || {
        let (_, height, view) = rows.get();
        height.max(px(1.0)) / view.max(px(1.0))
    };
    // The thumb's middle at the pointer.
    let follow = move |page_y: Points| {
        let view = rows.get_untracked().2;
        let y = (page_y - ruler_top.get()) * scale() - view / 2.0;
        if let Some(api) = diff.api::<DiffViewApi>() {
            api.set_scroll_offset(point(px(0.0), y));
        }
    };
    view()
        .flex_1()
        .flex_row()
        .child(
            diff_view()
                .old_value(old)
                .new_value(new)
                .on_scroll(move |e: &DiffViewEvent| {
                    if let DiffViewEvent::Scroll(offset, content, size) = e {
                        rows.set((offset.y, content.height, size.height));
                    }
                })
                .on_hunk_bounds_change(move |list: &Vec<DiffHunkBounds>| marks.set(list.clone()))
                .component_ref(&diff)
                .flex_1(),
        )
        .child(
            view()
                .element_ref(&ruler)
                .w(px(12.0))
                .bg(move || theme().muted)
                .claim_touches(TouchClaim::on_start())
                .on_responder_grant(move |e: &ResponderEvent| {
                    let y = e.page.y;
                    spawn(async move {
                        ruler_top.replace(ruler.measure().await.map_or(px(0.0), |m| m.page.y));
                        follow(y);
                    });
                })
                .on_responder_move(move |e: &ResponderEvent| follow(e.page.y))
                .child(each(
                    marks,
                    |mark: &DiffHunkBounds| mark.index,
                    move |mark, _| {
                        view()
                            .absolute()
                            .left(px(0.0))
                            .right(px(0.0))
                            .bg(rgb(0xf59e0b))
                            .top(move || mark.get().bounds.origin.y / scale())
                            .h(move || (mark.get().bounds.size.height / scale()).max(px(2.0)))
                    },
                ))
                .child(
                    view()
                        .absolute()
                        .left(px(0.0))
                        .right(px(0.0))
                        .bg(move || theme().foreground.opacity(0.2))
                        .top(move || rows.get().0 / scale())
                        .h(move || rows.get().2 / scale()),
                ),
        )
}
```

```tsx tabs
import { Each, signal, View, type ViewRef } from "nsh";
import { DiffView, type DiffHunkBounds, type DiffViewRef } from "nsh/base";

let diff!: DiffViewRef;
let ruler!: ViewRef;
let rulerTop = 0;
const rows = signal({ y: 0, height: 0, view: 0 });
const marks = signal<DiffHunkBounds[]>([]);
// Points of the rows per point of the ruler.
const scale = () => Math.max(rows().height, 1) / Math.max(rows().view, 1);
// The thumb's middle at the pointer.
const follow = (pageY: number) => diff.setScrollOffset({ x: 0, y: (pageY - rulerTop) * scale() - rows().view / 2 });

<View class="flex-1 flex-row">
  <DiffView
    ref={diff}
    oldValue={before()}
    newValue={after()}
    onScroll={({ offset, contentSize, size }) => rows.set({ y: offset.y, height: contentSize.height, view: size.height })}
    onHunkBoundsChange={({ hunkBounds }) => marks.set(hunkBounds)}
    class="flex-1"
  />
  <View
    ref={ruler}
    class="w-3 bg-muted"
    onStartShouldSetResponder={() => true}
    onResponderGrant={async (e) => {
      const y = e.pageY;
      rulerTop = (await ruler.measure())?.pagePosition.y ?? 0;
      follow(y);
    }}
    onResponderMove={(e) => follow(e.pageY)}
  >
    <Each of={marks()}>
      {(mark) => (
        <View
          class="absolute inset-x-0 bg-amber-500"
          style={{ top: mark().bounds.origin.y / scale(), height: Math.max(mark().bounds.size.height / scale(), 2) }}
        />
      )}
    </Each>
    <View class="absolute inset-x-0 bg-foreground/20" style={{ top: rows().y / scale(), height: rows().view / scale() }} />
  </View>
</View>
```

El `index` de una marca es el del cambio en `hunks()`, cuyos `oldLines` y `newLines` distinguen un cambio añadido (sin líneas antiguas) de uno eliminado (sin líneas nuevas), para colorear su marca.

<a id="review-comments"></a>

## Comentarios de revisión

Los números de línea seleccionan líneas de un lado: una pulsación selecciona una, una pulsación con Shift extiende la selección hasta ella, y arrastrar el ratón sobre los números selecciona las que recorre. `onLineSelectionChange` informa de las líneas como `range` (`DiffLineRange`: `{ side, start, end }`, líneas desde 0, `null` para ninguna), y la pulsación de un número también informa de `onLineNumberPress({ line })` (`{ side, line }`). El ref lee la selección (`selectedLines()`, `selectedText()`) y la establece.

`annotations` coloca contenido de la app bajo las líneas: cada `{ id, side, line }` lo dibuja `renderAnnotation` a lo ancho del lado de su línea (toda la vista cuando es unificada), tan alto como resulte de su maquetación, y se muestra mientras se muestre su línea. `renderAddAnnotation` es el control de la app para añadir uno, a la derecha del margen de la línea sobre la que está el puntero y de la última línea seleccionada; recibe las líneas seleccionadas cuando su línea es una de ellas, y si no, esa línea.

```tsx
type Comment = { id: string; side: "old" | "new"; line: number; text: string };
const comments = signal<Comment[]>([]);
const drafting = signal<DiffLineRange | null>(null);

<DiffView
  oldValue={before()}
  newValue={after()}
  annotations={comments().map(({ id, side, line }) => ({ id, side, line }))}
  renderAnnotation={(a) => (
    <View class="m-2 rounded-md border border-border bg-card p-2">
      <Text class="text-sm">{comments().find((c) => c.id === a.id)?.text}</Text>
    </View>
  )}
  renderAddAnnotation={(range) => (
    <Button onPress={() => drafting.set(range)} class="size-4 items-center justify-center rounded bg-primary">
      <Text class="text-xs text-primary-foreground">+</Text>
    </Button>
  )}
  class="flex-1"
/>
```
<a id="styling-the-parts"></a>

## Aplicar estilos a las partes

`class` y `style` dan estilo a la caja de la vista. `classes` recibe clases de Tailwind por parte y `styles` estilos en línea por parte; las clases de una parte van después de sus propios estilos predeterminados, por lo que prevalecen, y sus `styles` prevalecen sobre sus clases. La fuente se define con `fontFamily`, `fontSize` y `lineHeight`.

```tsx
<DiffView
  oldValue={before()}
  newValue={after()}
  language="py"
  fontSize={12}
  lineHeight={18}
  class="flex-1 rounded-lg border border-border"
  classes={{
    gutter: "bg-muted",
    lineAdded: "bg-blue-500/10",
    wordAdded: "bg-blue-500/30",
    indicatorAdded: "bg-blue-500",
    separator: "bg-transparent",
  }}
/>
```

| Parte | Qué es | Predeterminado |
|---|---|---|
| `side` | Cada lado (split) o la única columna (unified) | Una línea `border` entre los lados |
| `gutter` | Los números de línea y los indicadores de un lado | |
| `lineNumber` | Cada número de línea | Alineado a la derecha, `muted-foreground` |
| `lineNumberAdded` | Los números de las líneas añadidas, después de `lineNumber` | |
| `lineNumberDeleted` | Los números de las líneas eliminadas, después de `lineNumber` | |
| `content` | El texto de un lado, junto a su gutter | 8pt antes y después del texto |
| `line` | Cada fila de un lado | |
| `lineAdded` | Las filas de las líneas añadidas, después de `line` | Un tinte verde |
| `lineDeleted` | Las filas de las líneas eliminadas, después de `line` | Un tinte rojo |
| `filler` | La mitad vacía de una fila split junto a una línea que el otro lado no tiene | Un relleno `muted` tenue |
| `wordAdded` | Las palabras modificadas dentro de una línea añadida | Un verde más intenso |
| `wordDeleted` | Las palabras modificadas dentro de una línea eliminada | Un rojo más intenso |
| `indicatorAdded` | La barra de una línea añadida (`"bars"`) o `+` (`"classic"`) | Verde, 3pt de ancho |
| `indicatorDeleted` | La barra de una línea eliminada o `−` | Rojo, 3pt de ancho |
| `separator` | Un separador de líneas contraídas, o el encabezado de un hunk de un patch | `⋯` y el recuento en `muted` |
| `hunkActions` | La caja de las acciones de la app sobre un cambio | En la esquina superior derecha del cambio |
| `lineSelected` | Sobre las filas de las líneas seleccionadas de su lado | El color de selección del tema (como las selecciones del `Editor`) |
| `annotation` | La caja de una anotación, bajo su línea | A lo ancho del lado de su línea |
| `addAnnotation` | La caja del control de añadir, con el ancho del gutter y la altura de una línea | El control a su derecha |
| `fileHeader` | El encabezado de un archivo de un patch | La ruta y los recuentos en `secondary`, una línea `border` debajo |

## Props

| Prop | Rust | Tipo | Predeterminado | Descripción |
|---|---|---|---|---|
| `oldValue` | `.old_value(..)` | `string` | | El texto antiguo. |
| `newValue` | `.new_value(..)` | `string` | | El texto nuevo. |
| `patch` | `.patch(..)` | `string` | | Un diff unificado de uno o varios archivos, que se muestra cuando `oldValue` y `newValue` no están definidos. |
| `language` | `.language(..)` | `string` | texto plano (un patch: el de cada archivo) | El nombre, alias, extensión o nombre de archivo de un lenguaje. |
| `layout` | `.layout(..)` | `"split" \| "unified"` | `"split"` | Lado a lado o una sola columna. |
| `inline` | `.inline(..)` | `"wordAlt" \| "word" \| "char" \| "none"` | `"wordAlt"` | Lo que se resalta dentro de las líneas modificadas. |
| `indicators` | `.indicators(..)` | `"bars" \| "classic" \| "none"` | `"bars"` | Cómo se marcan las líneas modificadas junto a sus números. |
| `contextLines` | `.context_lines(..)` | `number` | `3` | Líneas sin cambios que se muestran alrededor de cada cambio. |
| `expandAll` | `.expand_all(..)` | `boolean` | `false` | Se muestran todas las líneas sin cambios. |
| `lineNumbers` | `.line_numbers(..)` | `boolean` | `true` | Los números de línea. |
| `background` | `.background(..)` | `boolean` | `true` | Las líneas modificadas se tiñen. |
| `fontFamily` | `.font_family(..)` | `string` | el `font-mono` del tema | La fuente del texto. |
| `fontSize` | `.font_size(..)` | `number` | `13` | El tamaño de la fuente, en puntos. |
| `lineHeight` | `.line_height(..)` | `number` | `20` | La altura de una fila, en puntos. |
| `renderSeparator` | `.render_separator(..)` | `(separator: DiffSeparator) => JSX.Element` | | Dibuja los separadores de líneas contraídas. |
| `renderHunkActions` | `.render_hunk_actions(..)` | `(hunk: DiffHunk) => JSX.Element` | | Las acciones de la app sobre cada cambio. |
| `softWrap` | `.soft_wrap(..)` | `boolean` | `false` | Las líneas largas se ajustan al ancho del lado. |
| `annotations` | `.annotations(..)` | `DiffAnnotation[]` | `[]` | El contenido de la app bajo las líneas: `{ id, side, line }`. |
| `renderAnnotation` | `.render_annotation(..)` | `(annotation: DiffAnnotation) => JSX.Element` | | Dibuja una anotación bajo su línea. |
| `renderAddAnnotation` | `.render_add_annotation(..)` | `(range: DiffLineRange) => JSX.Element` | | El control de la app para añadir una anotación, junto a la línea sobre la que se pasa el cursor y la última seleccionada. |
| `renderFileHeader` | `.render_file_header(..)` | `(file: DiffFile) => JSX.Element` | | Dibuja el encabezado de cada archivo de un patch, de una fila de alto. |
| `classes` | `.classes(..)` | `DiffViewClasses` | `{}` | Clases de Tailwind por parte. |
| `styles` | `.styles(..)` | `DiffViewStyles` | `{}` | Estilos en línea por parte, por encima de las clases. |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | | La caja de la vista. |

<a id="events"></a>

## Eventos

| Evento | Rust | Descripción |
|---|---|---|
| `onChange` | `.on_change(\|change: &DiffChange\| ..)` | Un cambio se conservó o se revirtió: `{ change }`, los textos actuales (`{ oldValue, newValue }`). |
| `onLineNumberPress` | `.on_line_number_press(\|line: &DiffLine\| ..)` | Se pulsó un número de línea: `{ line }`, un `{ side, line }`. |
| `onLineSelectionChange` | `.on_line_selection_change(\|range: &Option<DiffLineRange>\| ..)` | Cambiaron las líneas seleccionadas: `{ range }`, un `{ side, start, end }` o `null`. |
| `onStatsChange` | `.on_stats_change(\|stats: &DiffStats\| ..)` | Cambiaron los recuentos: `{ stats }`, un `{ added, deleted, hunks }`. Se dispara una vez cuando se crea la vista y otra vez cada vez que los textos se comparan y dan otros recuentos, para una línea como "+8 −8 · 5 changes". |
| `onFileToggle` | `.on_file_toggle(\|file: &DiffFile\| ..)` | Un archivo del patch se contrajo o se expandió (su encabezado, o la ref): `{ file }`, el `DiffFile` actual. |
| `onScroll` | `.on_scroll(\|e: &DiffViewEvent\| ..)` | Las filas se desplazaron, o ellas o el viewport cambiaron de tamaño: `{ offset, contentSize, size }`, como el de un `Scroll` (`DiffViewEvent::Scroll(offset, content_size, size)` en Rust). Se dispara una vez que la vista se ha maquetado y otra vez cuando alguno de ellos cambia. |
| `onHunkBoundsChange` | `.on_hunk_bounds_change(\|bounds: &Vec<DiffHunkBounds>\| ..)` | Cambió la ubicación de los cambios en las filas: `{ hunkBounds }`, la lista que da `hunkBounds()`. Se dispara una vez que la vista se ha maquetado y otra vez cuando un cambio se mueve o cambia de tamaño, se conserve o no la altura de las filas, para las marcas de una regla de vista general. |

<a id="related"></a>

## Relacionado

- [Editor](./editor.md): el editor de código cuyos colores de sintaxis y lenguajes usa `DiffView`.
- [TextView](./text-view.md): documentos de Markdown y HTML, para el texto que rodea una revisión.
- [`nsh/base`](../modules/nsh-base.md): los demás componentes base.
