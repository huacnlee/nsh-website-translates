---
title: "Table"
description: "El componente Table y sus partes: una tabla con las filas y celdas propias de la app que los lectores de pantalla reconocen como tabla, con el aspecto que la app da a cada parte."
group: base
demo: el-table
source_hash: b35a56c82dadd942
---


# Table

Un `Table` dispone unas pocas filas que la app escribe como hijos (facturas, un resumen, una comparación) y ofrece a los lectores de pantalla una tabla: la tabla en sí, grupos de filas, filas, encabezados de columna y celdas, cada uno con su rol. Sus partes son `TableHeader`, `TableBody` y `TableFooter` (grupos de filas), `TableRow` (sus celdas una junto a otra), `TableHead` (la celda de encabezado de una columna), `TableCell` y `TableCaption`. El aspecto es el de la app: ninguna parte tiene colores, bordes, rellenos ni anchos propios, y cada una toma `class` y `style` de la app. Para muchas filas, ordenación, selección y columnas redimensionables, [`DataTable`](./data-table.md) es la tabla.

```rust tabs
use nsh_base::{table, table_body, table_cell, table_head, table_header, table_row, theme};
use nsh_core::prelude::*;

fn invoices() -> impl IntoElement {
    let cell = |label: &'static str| table_cell().w(px(120.0)).px_3().py_2().child(text(label));
    table()
        .accessibility_label("Recent invoices")
        .child(
            table_header().child(
                table_row()
                    .border_b_1()
                    .border_color(move || theme().border)
                    .child(table_head().w(px(120.0)).px_3().py_2().child(text("Invoice")))
                    .child(table_head().w(px(120.0)).px_3().py_2().child(text("Amount"))),
            ),
        )
        .child(table_body().child(table_row().child(cell("INV001")).child(cell("$250.00"))))
}
```

```tsx tabs
import { mount, Text } from "nsh";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "nsh/base";

function App() {
  return (
    <Table accessibilityLabel="Recent invoices">
      <TableHeader>
        <TableRow class="border-b border-border">
          <TableHead class="w-32 px-3 py-2"><Text>Invoice</Text></TableHead>
          <TableHead class="w-32 px-3 py-2"><Text>Amount</Text></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell class="w-32 px-3 py-2"><Text>INV001</Text></TableCell>
          <TableCell class="w-32 px-3 py-2"><Text>$250.00</Text></TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}

mount(App);
```

`Table` y sus partes provienen de [`nsh/base`](../modules/nsh-base.md), el crate `nsh-base` en Rust, donde `table()`, `table_header()`, `table_body()`, `table_footer()`, `table_row()`, `table_head()`, `table_cell()` y `table_caption()` las crean, con los métodos de estilo tipados y `.child(..)`. Una fila dispone sus celdas una junto a otra; la app da a las celdas sus anchos, de modo que las columnas queden alineadas.

## Props

| Prop | Rust | Tipo | Predeterminado | Descripción |
|---|---|---|---|---|
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | ninguno | Solo `Table`: cómo llaman los lectores de pantalla a la tabla. |
| `children` | `.child(..)` | `JSX.Element` | ninguno | Lo que contiene la parte: grupos y un título en un `Table`, filas en un grupo, celdas en una fila, contenido en una celda. |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | ninguno | El aspecto y la disposición de la parte. |

<a id="parts"></a>

## Partes

| Parte | Dentro de | Rol para lectores de pantalla |
|---|---|---|
| `Table` | | tabla |
| `TableHeader` | `Table` | grupo de filas: las filas de encabezados de columna |
| `TableBody` | `Table` | grupo de filas: las filas de datos |
| `TableFooter` | `Table` | grupo de filas: totales, una fila de resumen |
| `TableRow` | un grupo, o `Table` | fila; sus celdas una junto a otra |
| `TableHead` | una `TableRow` del encabezado | encabezado de columna |
| `TableCell` | `TableRow` | celda |
| `TableCaption` | `Table` | contenido que la app muestra sobre la tabla |

Cada plataforma entrega los roles a su lector de pantalla: roles de tabla, fila, celda y encabezado de columna en Linux (AT-SPI), la web (ARIA), Android y el backend GPUI; cuadrículas y grupos en macOS y Windows; encabezados como encabezados en iOS.

<a id="see-also"></a>

## Véase también

- [DataTable](./data-table.md): una tabla con cualquier cantidad de filas y columnas, con selección, ordenación y columnas redimensionables y movibles.
- [Accessibility](../docs/accessibility.md): los valores de `accessibilityRole`, `table`, `row`, `cell`, `columnheader` y `rowgroup`, entre otros.
