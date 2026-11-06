---
title: "DataTable"
description: "El componente DataTable: una tabla de filas y columnas que se desplaza en ambas direcciones sobre cualquier cantidad de ellas, con columnas fijas, redimensionables, movibles y ordenables, selección de filas, columnas y celdas, filas que la aplicación sirve por páginas, etiquetas de grupo, navegación con teclado y celdas que dibuja la aplicación."
group: base
demo: el-data-table
source_hash: 22c8d4a412976e77
---


# DataTable

`DataTable` muestra filas y columnas como una hoja de cálculo y se desplaza en ambas direcciones sobre cualquier número de ellas. Solo se crean las celdas visibles, así que una tabla de un millón de filas y diez mil columnas se desplaza igual que una pequeña. Se pueden seleccionar filas, columnas o celdas, con el puntero y con el teclado. Las columnas tienen anchos fijos, se redimensionan arrastrando su borde, se mueven arrastrando su título, permanecen a la izquierda mientras las demás se desplazan y se ordenan. Los títulos pueden ir bajo etiquetas de grupo, y la app puede dibujar una celda o un título.

`DataTable` aporta el diseño, la alineación, la virtualización y la interacción. La app da a sus partes el relleno, los colores, los bordes y la respuesta visual de la selección mediante `classes` y `styles`. Rust crea una con `nsh_base::data_table()`, y TSX con `<DataTable>` desde `nsh/base`.

```rust tabs
use nsh_base::{DataTableColumn, data_table};
use nsh_core::prelude::*;

fn column(key: &str, title: &str) -> DataTableColumn {
    let mut column = DataTableColumn::default();
    column.key = key.into();
    column.title = Some(title.into());
    column
}

fn table() -> impl IntoElement {
    data_table()
        .columns(vec![column("name", "Name"), column("city", "City")])
        .flex_1()
}
```

```tsx tabs
import { mount } from "nsh";
import { DataTable, type DataTableColumn } from "nsh/base";

const columns: DataTableColumn[] = [
  { key: "name", title: "Name", width: 160, sortable: true },
  { key: "city", title: "City", width: 120 },
  { key: "score", title: "Score", width: 90, align: "end" },
];

const rows = [
  { name: "Ada", city: "Oslo", score: 91 },
  { name: "Grace", city: "Lima", score: 87 },
  { name: "Linus", city: "Kyoto", score: 78 },
];

function App() {
  return <DataTable columns={columns} data={rows} class="flex-1" />;
}

mount(App);
```

La tabla ocupa el espacio que la app le da (`flex-1`, una altura) y se desplaza dentro de él: en vertical por las filas y en horizontal por las columnas, con barras de desplazamiento (`scrollbar={false}` las oculta, `bounces={false}` elimina el rebote en los extremos en las plataformas que lo tienen).

<a id="rows-and-columns"></a>

## Filas y columnas

`data` son las filas: objetos cuyos campos nombran los `key` de las columnas, o arrays que las columnas indexan por posición. Los números, los booleanos y las cadenas se muestran como texto. Rust entrega las filas campo a campo, cada uno de un solo tipo: `DataTableRows::new(2).texts("symbol", ["AAPL", "MSFT"]).numbers("change", [1.2, -0.4])`. Una columna es un `DataTableColumn`:

| Campo | Descripción |
|---|---|
| `key` | Quién es, único entre las columnas: el campo de las filas que muestran sus celdas y el nombre que usan los eventos y la ref. |
| `title` | El texto de su título. Por defecto, su `key`. |
| `width` | Su ancho, en puntos. Por defecto, `120`. |
| `minWidth`, `maxWidth` | Lo más estrecha y lo más ancha que la dejan un arrastre o un ajuste. Por defecto, `20` y `1200`. |
| `fitPadding` | Espacio extra para el relleno, los iconos o las insignias de la app, que se suma al texto más ancho del título o de las celdas al ajustar la columna. |
| `align` | `"start"` (el valor por defecto), `"center"` o `"end"`, para números. Tanto en las celdas como en el título. |
| `sortable` | Su título tiene un botón de ordenación que solicita una ordenación (véase [Ordenación](#sorting)). |
| `fixed` | Permanece a la izquierda mientras las demás columnas se desplazan bajo ella. Las columnas fijas van antes que las demás, en su orden. |
| `resizable`, `movable` | Si arrastrar su borde la redimensiona y si arrastrar su título la mueve. Por defecto, `resizableColumns` y `movableColumns` de la tabla. |
| `selectable` | Si participa en la selección. Una columna de botones o casillas de verificación establece `false`. Por defecto, `true`. |
| `cellClass` | Clases de las celdas de la columna, después de las de la parte `cell`: rellenos o alineación de una sola columna. |
| `headerClass` | Clases del título de la columna, después de las de la parte `headerCell`. |
| `positiveClass` | Clases de las celdas de la columna que contienen una subida: un número mayor que cero o un texto que empieza por `+`. |
| `negativeClass` | Clases de las celdas de la columna que contienen una bajada: un número menor que cero o un texto que empieza por `-`. |

`rowHeight` es la altura de una fila del cuerpo (por defecto, `32`) y `headerHeight` la altura de una fila de títulos (por defecto, la altura de fila). `rowHeader` añade a la izquierda una columna de números de fila, que selecciona filas. `stripe` aplica a las filas impares la parte `rowOdd`.

<a id="group-labels"></a>

### Etiquetas de grupo

`groups` coloca etiquetas encima de las columnas, empezando por el nivel más bajo. Cada nivel es una lista de `{ label, span }` cuyos tramos suman el número de columnas, o el del nivel inferior.

```tsx
<DataTable
  columns={columns}
  data={rows}
  groups={[
    [{ label: "Person", span: 2 }, { label: "Result", span: 1 }],
  ]}
  class="flex-1"
/>
```

<a id="any-number-of-rows"></a>

## Cualquier número de filas

La tabla pide las filas por posición y la app las sirve. `rowCount` es el número total de filas, `data` las filas que la app tiene y `dataStart` la posición de la primera de ellas. Las filas fuera de `data` están vacías hasta que la app las proporciona. `onVisibleRowsChange` informa de las filas visibles, `{ range: { start, end } }`, en cada paso de desplazamiento, y es el lugar donde obtener la página que las rodea.

```tsx
const ROWS = 1_000_000;
const page = signal({ start: 0, rows: load(0) });

<DataTable
  columns={columns}
  data={page().rows}
  dataStart={page().start}
  rowCount={ROWS}
  onVisibleRowsChange={({ range: { start, end } }) => {
    // Keep the rows in view inside the page held.
    const held = page();
    if (start < held.start || end > held.start + held.rows.length) {
      const first = Math.max(0, start - 200);
      page.set({ start: first, rows: load(first) });
    }
  }}
  class="flex-1"
/>
```

Para una lista que crece por el final, establezca `hasMore`: `onLoadMore` se dispara una vez por cada número de filas cuando las filas visibles llegan a estar a `loadMoreThreshold` (por defecto, `20`) de la última. Mientras `loading` sea true, espera, y el slot `loadingView` se muestra sobre las filas. El slot `empty` se muestra cuando no hay filas.

A partir de unos pocos millones de puntos de contenido, las barras de desplazamiento abarcan un rango escalado, de modo que un millón de filas sigue permitiendo desplazarse hasta cada fila.

<a id="selection"></a>

## Selección

Tres interruptores deciden qué selecciona una pulsación, como en gpui-component:

| Prop | Una pulsación selecciona | `selection` |
|---|---|---|
| `rowSelectable` (por defecto, `true`) | Una fila: cualquiera de sus celdas o su cabecera de fila | `{ row }` |
| `columnSelectable` (por defecto, `true`) | Una columna: su título | `{ column }` |
| `cellSelectable` (por defecto, `false`) | Una celda; la cabecera de fila (visible por defecto con ella) selecciona filas | `{ row, column }` |

Con `cellSelectable` y la cabecera de fila oculta (`rowHeader={false}`), volver a pulsar la celda seleccionada selecciona su fila. Una pulsación con Shift o con la tecla de comando de la plataforma pulsada solo selecciona una fila mientras `selectOnModifierPress` (por defecto, `true`), de modo que una app que mantiene su propia selección de varias filas gestiona esas pulsaciones por sí misma: `onRowPress` informa de cada pulsación en el cuerpo con su fila, la columna bajo el puntero, los clics en una fila y las teclas modificadoras pulsadas. Una columna cuyo `selectable` es `false` no se selecciona ni selecciona sus celdas.

Las filas se cuentan desde 0 en los datos, y una columna es su índice dentro de `columns`, sea cual sea el orden al que el usuario la haya movido. `onSelectionChange` informa de lo que el usuario seleccionó (`null` si no hay nada). La prop `selection` establece la selección desde la app; si no se define, la tabla la mantiene. `onDoublePress` informa de una fila, una celda o un título pulsados dos veces, y `onContextMenu` de una pulsación secundaria o larga con el punto en el que abrir el [`Menu`](./menu.md) de la app. Ambos nombran la celda bajo el puntero (su `row` y su `column`), el número de una fila (solo `row`) o un título (solo `column`). Hasta la siguiente pulsación, la celda para la que se pidió un menú tiene la parte `cellActive`, o su fila la parte `rowActive` cuando las celdas no se seleccionan.

Los lectores de pantalla reciben una cuadrícula (con el nombre de `accessibilityLabel`) de cabeceras de columna y celdas, y se anuncian como seleccionadas las que lo estén.

<a id="keyboard"></a>

## Teclado

Pulsar la tabla, o llegar a ella con Tab (macOS, la web), le da el teclado hasta otra pulsación, hasta que el foco pase a otro sitio o hasta `blur()`; `focus()` se lo da desde la app. La tabla es una sola parada de Tab: dentro de ella, Tab mueve la selección y Escape devuelve el teclado.

| Teclas | Qué hacen |
|---|---|
| Teclas de flecha | Mueven la selección una fila, una columna o una celda, desplazándola hasta que quede visible. |
| Tab, Shift+Tab | Pasan a la columna siguiente o a la anterior. |
| Page Up, Page Down | Mueven una página de filas. |
| Home, End | Pasan a la primera o a la última. |
| Escape | Borra la selección y después devuelve el teclado. |
| Atajo de copiar | Pone el texto de la selección en el portapapeles (`copy()`). |

`loopSelection` (por defecto, `true`) hace que las teclas de flecha den la vuelta en los extremos.

<a id="sorting"></a>

## Ordenación

Una columna `sortable` tiene un botón de ordenación al final de su título, un pequeño botón ghost atenuado mientras la columna no está ordenada. Al pulsarlo informa de la siguiente ordenación (`{ key, direction }`) en el ciclo de sin ordenar, ascendente, descendente y de nuevo sin ordenar, con `onSortChange({ sort })` (`null` para quitarla). La tabla no reordena las filas: la app ordena sus datos, o pide a su servidor las filas en el nuevo orden, y establece `sort` para que el título lo muestre. Como el orden es de la app, la ordenación funciona igual sobre un millón de filas que la app nunca tiene.

```tsx
<DataTable
  columns={columns}
  data={rows()}
  sort={sort()}
  onSortChange={({ sort: next }) => {
    sort.set(next ?? undefined);
    rows.set(sorted(people, next));
  }}
  class="flex-1"
/>
```

<a id="resizing-and-moving-columns"></a>

## Redimensionar y mover columnas

Arrastrar el borde final de una columna la redimensiona dentro de sus `minWidth` y `maxWidth`, y `onColumnResize({ key, width })` informa de cada paso. Pulsar el borde dos veces seguidas ajusta la columna a su texto y título más anchos. Arrastrar un título mueve la columna, y una línea indica dónde se soltará; `onColumnMove` informa de `{ key, from, to, order }`, siendo `order` los `key` de todas las columnas en el orden mostrado. Las columnas fijas permanecen entre las fijas. `resizableColumns` y `movableColumns` desactivan ambas cosas para toda la tabla, y los `resizable` y `movable` de una columna prevalecen sobre ellos.

<a id="live-data"></a>

## Datos en vivo

Una tabla de cotizaciones cambia muchas veces por segundo. La app da formato a las filas visibles y a un margen a su alrededor (las conoce por `onVisibleRowsChange`) y las entrega como `data` desde `dataStart`, de modo que una actualización cuesta lo que hay en pantalla, sea cual sea el número de filas. Las subidas y las bajadas toman sus colores de los `positiveClass` y `negativeClass` de la columna, aplicados de forma nativa a las celdas cuyo valor está por encima o por debajo de cero (o cuyo texto empieza por `+` o `-`).

```tsx
const tone = { positiveClass: "text-green-600", negativeClass: "text-red-600" };
const columns: DataTableColumn[] = [
  { key: "symbol", title: "Symbol", fixed: true },
  { key: "price", title: "Price", align: "end", sortable: true },
  { key: "change", title: "Chg%", align: "end", ...tone },
];
```

Las filas y las columnas son slots que la tabla crea una vez y conserva: al desplazarse se les asignan otras filas y columnas que mostrar, de modo que un desplazamiento, por largo que sea, solo cambia textos y posiciones.

<a id="drawing-cells-and-titles"></a>

## Dibujar celdas y títulos

`renderCell` dibuja las celdas propias de la app cuando una columna no es solo texto (una insignia, un botón). Se llama solo para las celdas visibles, con un `DataTableCell`: `row`, `column`, `key`, `text` (lo que mostraría la tabla) y `selected`. La app busca sus propios datos por `row`. `renderHeaderCell` dibuja un título en toda su celda, recibiendo un `DataTableHeaderCell`: `column`, `key`, `title`, `sort` (la dirección, o ninguna) y `selected`.

```tsx
<DataTable
  columns={columns}
  data={rows()}
  renderCell={(cell) =>
    cell.key === "status" ? (
      <View class={cell.text === "open" ? "rounded bg-green-500/20 px-2" : "rounded bg-muted px-2"}>
        <Text class="text-xs">{cell.text}</Text>
      </View>
    ) : (
      <Text class="px-2 text-sm">{cell.text}</Text>
    )
  }
  class="flex-1"
/>
```

`fontFamily` y `fontSize` (por defecto, `14`) establecen la fuente de las celdas, en la que la tabla también mide los textos para ajustar las columnas.

<a id="the-ref"></a>

## La ref

`ref` da un `DataTableRef`. Un método al que se le pasa una fila, una columna o una clave de columna que la tabla no tiene no cambia nada y registra una advertencia con el nombre del método y el valor; `fitColumn` se rechaza con un `TypeError` ante una clave desconocida.

| Método | Descripción |
|---|---|
| `scrollToRow(row, animated?)` | Desplaza una fila hasta que quede visible. |
| `scrollToColumn(key, animated?)` | Desplaza una columna hasta que quede visible. |
| `selection()` | Lo que está seleccionado, `null` si no hay nada. |
| `select(selection)` | Selecciona (`null`: nada) y lo muestra en pantalla, sin `onSelectionChange`. |
| `visibleRows()`, `visibleColumns()` | Las filas y las columnas desplazables visibles, como `{ start, end }` (excluidas las `end`). |
| `columnWidths()` | Los anchos actuales, en el orden de `columns`. |
| `setColumnWidth(key, width)` | Establece el ancho de una columna, dentro de sus límites. |
| `fitColumn(key)` | Ajusta una columna al ancho que necesitan su texto y su título más anchos, entre las filas visibles y hasta mil más a su alrededor. Devuelve el ancho. |
| `dump(start?, end?)` | Los textos de las filas indicadas (por defecto, todas las que se tienen) y de los títulos, tal como se muestran: `{ headers, rows }`, para exportar. |
| `copy()` | Pone el texto de la selección en el portapapeles: las celdas de una fila separadas por tabuladores, las de una columna por saltos de línea, el texto de una celda. |
| `focus()`, `blur()` | Da el teclado a la tabla o se lo quita. |
| `menuTarget()`, `clearMenuTarget()` | Para qué se pidió el último menú contextual (`{ row?, column? }`, marcado por `cellActive` / `rowActive`), y quitar esa marca cuando se cierra el menú de la app. |

<a id="styling-the-parts"></a>

## Estilo de las partes

`class` y `style` dan estilo al contenedor de la tabla. `classes` admite clases de Tailwind por parte y `styles` estilos en línea por parte; las partes aportan la estructura y la alineación de la tabla, sus clases aportan la apariencia, y `styles` prevalecen sobre las clases.

```tsx
<DataTable
  columns={columns}
  data={rows()}
  stripe
  class="flex-1 rounded-lg border border-border"
  classes={{
    header: "bg-secondary",
    headerCell: "pl-2 pr-1",
    headerContent: "gap-1",
    cell: "px-2",
    resizeHandle: "bg-border group-hover:bg-primary",
    sortAscending: "text-muted-foreground opacity-60 selected:text-foreground selected:opacity-100",
    sortDescending: "text-muted-foreground opacity-60 selected:text-foreground selected:opacity-100",
    rowSelected: "bg-primary/10",
    rowHover: "bg-muted/50",
    fixedEdge: "bg-border",
  }}
/>
```

| Parte | Qué es |
|---|---|
| `root` | El contenedor de la tabla: su borde, su radio y su fondo |
| `header` | La cabecera a lo ancho de la tabla, con sus filas de etiquetas de grupo y de títulos |
| `groupCell` | Una etiqueta de grupo sobre las columnas que abarca |
| `headerCell` | La celda de título de cada columna |
| `headerContent` | La fila de diseño de la etiqueta y del botón de ordenación; defina aquí su separación |
| `headerCellDragging` | El título arrastrado, después de `headerCell` |
| `headerCellSorted` | El título de la columna por la que está ordenada la tabla, después de `headerCell` |
| `headerCellSelected` | El título de la columna seleccionada, después de `headerCell` |
| `sortIndicator` | El botón de ordenación de una columna ordenable |
| `sortAscending`, `sortDescending` | Sus dos chevrons; `selected:` se aplica a la dirección de ordenación activa |
| `resizeHandle` | La línea en el borde final de una columna que un arrastre redimensiona |
| `moveIndicator` | La línea donde se soltará una columna arrastrada |
| `row` | Cada fila del cuerpo |
| `rowOdd` | Las filas impares, después de `row` (`stripe`) |
| `rowHover` | La fila sobre la que está el puntero, después de `row` |
| `rowSelected` | La fila seleccionada, después de `row` |
| `rowActive` | La fila para la que se pidió un menú contextual donde las celdas no se seleccionan, hasta la siguiente pulsación, después de `row` |
| `cell` | Cada celda del cuerpo |
| `cellSelected` | La celda seleccionada, después de `cell` |
| `cellActive` | La celda para la que se pidió un menú contextual, hasta la siguiente pulsación, después de `cell` |
| `cellColumnSelected` | Las celdas de la columna seleccionada, después de `cell` |
| `rowHeader` | Las celdas de cabecera de fila, los números de fila |
| `rowHeaderCorner` | La esquina sobre las cabeceras de fila |
| `fixedEdge` | La línea en el borde final de las columnas fijas, sobre las columnas que se desplazan bajo ellas |
| `empty` | El contenedor del slot `empty` |
## Props

| Prop | Rust | Tipo | Predeterminado | Descripción |
|---|---|---|---|---|
| `columns` | `.columns(..)` | `DataTableColumn[]` | `[]` | Las columnas, de izquierda a derecha. Las fijas van primero. |
| `data` | `.data(..)` | `Row[]` | `[]` | Las filas: objetos por columna `key`, o arrays por posición. |
| `rowCount` | `.row_count(..)` | `number` | las filas contenidas | Cuántas filas hay en total. |
| `dataStart` | `.data_start(..)` | `number` | `0` | El número de fila de la primera fila de `data`. |
| `rowClasses` | `.row_classes(..)` | `string[]` | `[]` | Clases de las filas indicadas, según su posición en `data`: el aspecto propio de una fila, sin llamar a JS por cada fila. |
| `rowHeight` | `.row_height(..)` | `number` | `32` | La altura de una fila del cuerpo, en puntos. |
| `headerHeight` | `.header_height(..)` | `number` | la altura de fila | La altura de una fila de título. |
| `groups` | `.groups(..)` | `DataTableColumnGroup[][]` | `[]` | Etiquetas sobre las columnas, empezando por el nivel más bajo. |
| `sort` | `.sort(..)` | `DataTableSort` | | Por qué criterio se ordenan los datos, que se muestra en el título. |
| `rowSelectable` | `.row_selectable(..)` | `boolean` | `true` | Las pulsaciones y las teclas seleccionan filas. |
| `columnSelectable` | `.column_selectable(..)` | `boolean` | `true` | La pulsación de un título selecciona su columna, y las teclas horizontales se mueven entre columnas. |
| `cellSelectable` | `.cell_selectable(..)` | `boolean` | `false` | Las pulsaciones y las teclas seleccionan celdas. |
| `selectOnModifierPress` | `.select_on_modifier_press(..)` | `boolean` | `true` | Una pulsación con Shift o con la tecla Command presionada selecciona una fila. |
| `selection` | `.selection(..)` | `DataTableSelection` | | Lo que está seleccionado, cuando la app lo establece. |
| `loopSelection` | `.loop_selection(..)` | `boolean` | `true` | Las teclas de flecha dan la vuelta en los extremos. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | ninguno | Cómo llaman a la tabla los lectores de pantalla. |
| `rowHeader` | `.row_header(..)` | `boolean` | se muestra con `cellSelectable` | Una columna de números de fila a la izquierda. |
| `stripe` | `.stripe(..)` | `boolean` | `false` | Las filas impares reciben la parte `rowOdd`. |
| `resizableColumns` | `.resizable_columns(..)` | `boolean` | `true` | Arrastrar el borde de una columna la redimensiona. |
| `movableColumns` | `.movable_columns(..)` | `boolean` | `true` | Arrastrar un título mueve su columna. |
| `loading` | `.loading(..)` | `boolean` | `false` | La tabla está cargando: `onLoadMore` espera y `loadingView` se muestra. |
| `hasMore` | `.has_more(..)` | `boolean` | `false` | Hay más filas por cargar. |
| `loadMoreThreshold` | `.load_more_threshold(..)` | `number` | `20` | Cuántas filas antes de la última hacen que se dispare `onLoadMore`. |
| `fontFamily` | `.font_family(..)` | `string` | heredada | La fuente de las celdas. |
| `fontSize` | `.font_size(..)` | `number` | `14` | El tamaño de fuente de las celdas, en puntos. |
| `scrollbar` | `.scrollbar(..)` | `boolean` | `true` | Las barras de desplazamiento. |
| `verticalScrollbar`, `horizontalScrollbar` | `.vertical_scrollbar(..)`, `.horizontal_scrollbar(..)` | `boolean` | `scrollbar` | La barra de desplazamiento de un eje (la horizontal es la barra de las plataformas de escritorio, bajo la tabla). |
| `bounces` | `.bounces(..)` | `boolean` | `true` | Si el desplazamiento rebota en los extremos, donde la plataforma lo hace. |
| `renderCell` | `.render_cell(..)` | `(cell: DataTableCell) => JSX.Element` | | Dibuja las celdas visibles. |
| `renderHeaderCell` | `.render_header_cell(..)` | `(cell: DataTableHeaderCell) => JSX.Element` | | Dibuja los títulos. |
| `empty` | `.empty(..)` | `JSX.Element` | | Lo que se muestra cuando no hay filas. |
| `loadingView` | `.loading_view(..)` | `JSX.Element` | | Lo que se muestra sobre las filas mientras `loading`. |
| `classes` | `.classes(..)` | `DataTableClasses` | `{}` | Clases de Tailwind por parte. |
| `styles` | `.styles(..)` | `DataTableStyles` | `{}` | Estilos en línea por parte, sobre las clases. |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | | La caja de la tabla. |

<a id="events"></a>

## Eventos

| Evento | Rust | Descripción |
|---|---|---|
| `onSelectionChange` | `.on_selection_change(\|selection: &Option<DataTableSelection>\| ..)` | El usuario cambió la selección: `{ selection }`, un `{ row?, column? }` o `null`. |
| `onRowPress` | `.on_row_press(\|event: &DataTablePress\| ..)` | Se pulsó una fila o celda: `{ row, column?, clicks, shift, control, alt, platform }`. |
| `onDoublePress` | `.on_double_press(\|target: &DataTableTarget\| ..)` | Se pulsó dos veces una fila, celda o título: `{ target }`, un `{ row?, column? }`. |
| `onContextMenu` | `.on_context_menu(\|event: &DataTableContextMenu\| ..)` | Se pidió un menú contextual: `{ row?, column?, x, y }`, el punto en la vista raíz. |
| `onSortChange` | `.on_sort_change(\|sort: &Option<DataTableSort>\| ..)` | Se pulsó un botón de ordenación: `{ sort }`, la siguiente ordenación `{ key, direction }` o `null`. |
| `onColumnResize` | `.on_column_resize(\|key: &SharedString, width: &Points\| ..)` | Se redimensionó una columna (`{ key, width }`), en cada paso de un arrastre y una vez más cuando un ajuste la establece. |
| `onColumnMove` | `.on_column_move(\|event: &DataTableColumnMove\| ..)` | Se movió una columna: `{ key, from, to, order }`. |
| `onVisibleRowsChange` | `.on_visible_rows_change(\|range: &DataTableRange\| ..)` | Cambiaron las filas visibles: `{ range }`, un `{ start, end }`. Obtén las filas desde aquí. |
| `onVisibleColumnsChange` | `.on_visible_columns_change(\|range: &DataTableRange\| ..)` | Cambiaron las columnas desplazables visibles: `{ range }`. |
| `onLoadMore` | `.on_load_more(\|\| ..)` | Las filas visibles llegaron a `loadMoreThreshold` de la última mientras `hasMore` y no `loading`. |

<a id="related"></a>

## Relacionado

- [Editor](./editor.md) y [DiffView](./diff-view.md): los otros componentes base con muchos datos.
- [Menu](./menu.md): el menú que se abre desde `onContextMenu`.
- [`nsh/base`](../modules/nsh-base.md): los demás componentes base.
