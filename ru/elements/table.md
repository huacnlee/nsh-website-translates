---
title: "Table"
description: "Компонент Table и его части: таблица из собственных строк и ячеек приложения, которую программы чтения с экрана распознают как таблицу, с внешним видом, который приложение задаёт для каждой части."
group: base
demo: el-table
source_hash: b35a56c82dadd942
---

# Table

`Table` раскладывает несколько строк, которые приложение записывает как дочерние элементы (счета, итог, сравнение), и передаёт скринридерам таблицу: саму таблицу, группы строк, строки, заголовки столбцов и ячейки, каждую со своей ролью. Её части: `TableHeader`, `TableBody` и `TableFooter` (группы строк), `TableRow` (ячейки строки, расположенные рядом), `TableHead` (заголовочная ячейка столбца), `TableCell` и `TableCaption`. Внешний вид определяет приложение: ни у одной части нет собственных цветов, границ, отступов или ширины, и каждая принимает `class` и `style` приложения. Для большого числа строк, сортировки, выделения и столбцов с изменяемой шириной предназначен [`DataTable`](./data-table.md).

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

`Table` и её части поставляются в [`nsh/base`](../modules/nsh-base.md), crate `nsh-base` для Rust, где их создают `table()`, `table_header()`, `table_body()`, `table_footer()`, `table_row()`, `table_head()`, `table_cell()` и `table_caption()`, с типизированными методами стиля и `.child(..)`. Строка раскладывает свои ячейки рядом; ширину ячейкам задаёт приложение, поэтому столбцы выравниваются.

<a id="props"></a>

## Свойства

| Свойство | Rust | Тип | По умолчанию | Описание |
|---|---|---|---|---|
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | нет | Только для `Table`: как скринридеры называют таблицу. |
| `children` | `.child(..)` | `JSX.Element` | нет | Содержимое части: группы и подпись в `Table`, строки в группе, ячейки в строке, содержимое в ячейке. |
| `class`, `style` | методы стиля | `string`, `StyleProp<ViewStyle>` | нет | Внешний вид и раскладка части. |

<a id="parts"></a>

## Части

| Часть | Внутри | Роль для скринридеров |
|---|---|---|
| `Table` | | таблица |
| `TableHeader` | `Table` | группа строк: строки заголовков столбцов |
| `TableBody` | `Table` | группа строк: строки данных |
| `TableFooter` | `Table` | группа строк: итоги, итоговая строка |
| `TableRow` | группа или `Table` | строка; её ячейки расположены рядом |
| `TableHead` | `TableRow` в заголовке | заголовок столбца |
| `TableCell` | `TableRow` | ячейка |
| `TableCaption` | `Table` | содержимое, которое приложение показывает о таблице |

Каждая платформа передаёт роли своему скринридеру: роли таблицы, строки, ячейки и заголовка столбца в Linux (AT-SPI), вебе (ARIA), Android и бэкенде GPUI; сетки и группы в macOS и Windows; заголовки как заголовки в iOS.

<a id="see-also"></a>

## См. также

- [DataTable](./data-table.md): таблица с любым числом строк и столбцов, с выделением, сортировкой и столбцами, которые можно изменять по ширине и перемещать.
- [Accessibility](../docs/accessibility.md): значения `accessibilityRole`, `table`, `row`, `cell`, `columnheader` и `rowgroup` в их числе.
