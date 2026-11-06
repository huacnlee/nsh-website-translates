---
title: "Table"
description: "Table 元件及其各個部分：用於呈現應用程式自有資料列與儲存格的表格，螢幕閱讀器能將其識別為表格，且每個部分的外觀皆由應用程式決定。"
group: base
demo: el-table
---

# Table

`Table` 會將應用程式以子元素寫入的少量列(發票、摘要、比較)排版，並為螢幕閱讀器提供表格：表格本身、列群組、列、欄標題與儲存格，各自帶有其角色。其組成部分為 `TableHeader`、`TableBody` 與 `TableFooter`(列群組)、`TableRow`(並排的儲存格)、`TableHead`(欄的標題儲存格)、`TableCell` 與 `TableCaption`。外觀由應用程式決定：各部分本身都沒有顏色、邊框、內距或寬度，且每個部分都接受應用程式的 `class` 與 `style`。若需處理大量列、排序、選取與可調整大小的欄，[`DataTable`](./data-table.md) 就是對應的表格。

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

`Table` 及其組成部分來自 [`nsh/base`](../modules/nsh-base.md)，也就是 Rust 中的 `nsh-base` crate，其中 `table()`、`table_header()`、`table_body()`、`table_footer()`、`table_row()`、`table_head()`、`table_cell()` 與 `table_caption()` 負責建立這些部分，並提供具型別的樣式方法與 `.child(..)`。一列會將其儲存格並排排版；儲存格的寬度由應用程式指定，因此各欄得以對齊。

## Props

| Prop | Rust | 型別 | 預設值 | 說明 |
|---|---|---|---|---|
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 無 | 僅限 `Table`：螢幕閱讀器對該表格的稱呼。 |
| `children` | `.child(..)` | `JSX.Element` | 無 | 該部分所包含的內容：`Table` 中的群組與標題、群組中的列、列中的儲存格、儲存格中的內容。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | 無 | 該部分的外觀與版面配置。 |

<a id="parts"></a>

## 組成部分

| 部分 | 位於 | 螢幕閱讀器的角色 |
|---|---|---|
| `Table` | | 表格 |
| `TableHeader` | `Table` | 列群組：欄標題所在的列 |
| `TableBody` | `Table` | 列群組：資料列 |
| `TableFooter` | `Table` | 列群組：合計、摘要列 |
| `TableRow` | 群組，或 `Table` | 列；其儲存格並排排列 |
| `TableHead` | 標題的 `TableRow` | 欄標題 |
| `TableCell` | `TableRow` | 儲存格 |
| `TableCaption` | `Table` | 應用程式顯示的有關該表格的內容 |

各平台會將這些角色提供給其螢幕閱讀器：Linux (AT-SPI)、Web (ARIA)、Android 與 GPUI 後端使用表格、列、儲存格與欄標題角色；macOS 與 Windows 使用網格與群組；iOS 則將標題視為標題。

<a id="see-also"></a>

## 另請參閱

- [DataTable](./data-table.md)：可容納任意數量的列與欄的表格，支援選取、排序，以及可調整大小、可移動的欄。
- [Accessibility](../docs/accessibility.md)：其中包含 `accessibilityRole` 的值，以及 `table`、`row`、`cell`、`columnheader` 與 `rowgroup`。
