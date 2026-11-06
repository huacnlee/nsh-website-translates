---
title: "Table"
description: "Table 元件及其組成部分：用於呈現應用程式自身資料列與儲存格的表格，螢幕閱讀器可將其識別為表格，而每個部分的外觀則由應用程式自行決定。"
group: base
demo: el-table
source_hash: b35a56c82dadd942
---


# Table

`Table` 會排列應用程式以子元素寫入的數列內容(發票、摘要、比較),並為螢幕閱讀器提供一個表格:表格本身、列群組、列、欄標題和儲存格,各有其角色。它的部件包括 `TableHeader`、`TableBody` 和 `TableFooter`(列群組)、`TableRow`(並排顯示其儲存格)、`TableHead`(欄的標題儲存格)、`TableCell` 和 `TableCaption`。外觀由應用程式決定:各部件本身沒有顏色、邊框、內距或寬度,並各自接受應用程式的 `class` 和 `style`。如果需要處理大量列、排序、選取及可調整大小的欄,請使用 [`DataTable`](./data-table.md)。

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

`Table` 及其部件來自 [`nsh/base`](../modules/nsh-base.md),即 Rust 中的 `nsh-base` crate,並由 `table()`、`table_header()`、`table_body()`、`table_footer()`、`table_row()`、`table_head()`、`table_cell()` 和 `table_caption()` 建立,同時配合具型別的樣式方法和 `.child(..)`。每一列會將其儲存格並排顯示;儲存格的寬度由應用程式指定,因此各欄會對齊。

## Props

| 屬性 | Rust | 類型 | 預設值 | 說明 |
|---|---|---|---|---|
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 無 | 只適用於 `Table`:螢幕閱讀器如何稱呼該表格。 |
| `children` | `.child(..)` | `JSX.Element` | 無 | 該部件所包含的內容:`Table` 中的群組和標題、群組中的列、列中的儲存格、儲存格中的內容。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | 無 | 部件的外觀和版面配置。 |

<a id="parts"></a>

## 部件

| 部件 | 位於 | 螢幕閱讀器的角色 |
|---|---|---|
| `Table` | | 表格 |
| `TableHeader` | `Table` | 列群組:欄標題所在的列 |
| `TableBody` | `Table` | 列群組:資料所在的列 |
| `TableFooter` | `Table` | 列群組:總計、摘要列 |
| `TableRow` | 某個群組,或 `Table` | 列;其儲存格並排顯示 |
| `TableHead` | 標題的 `TableRow` | 欄標題 |
| `TableCell` | `TableRow` | 儲存格 |
| `TableCaption` | `Table` | 應用程式顯示的、關於該表格的內容 |

各平台會將這些角色提供給其螢幕閱讀器:Linux (AT-SPI)、網頁 (ARIA)、Android 和 GPUI 後端提供表格、列、儲存格和欄標題角色;macOS 和 Windows 提供網格和群組;iOS 則將標題視為標題。

<a id="see-also"></a>

## 另請參閱

- [DataTable](./data-table.md):可容納任意數量的列和欄的表格,支援選取、排序,以及可調整大小和可移動的欄。
- [無障礙功能](../docs/accessibility.md):當中包括 `accessibilityRole` 的值、`table`、`row`、`cell`、`columnheader` 和 `rowgroup`。
