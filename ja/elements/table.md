---
title: "Table"
description: "Table コンポーネントとその各パーツ:アプリ独自の行とセルで構成され、スクリーンリーダーがテーブルとして認識する表で、各パーツの見た目はアプリ側で指定できます。"
group: base
demo: el-table
source_hash: b35a56c82dadd942
---

# Table

`Table` は、アプリが子要素として書く数行（請求書、サマリー、比較表など）をレイアウトし、スクリーンリーダーにテーブルとして伝えます。テーブル本体、行のグループ、行、列ヘッダー、セルが、それぞれのロールとともに公開されます。構成要素は `TableHeader`、`TableBody`、`TableFooter`（行のグループ）、`TableRow`（セルを横に並べたもの）、`TableHead`（列のヘッダーセル）、`TableCell`、`TableCaption` です。見た目はアプリ側のものです。どの部品にも独自の色、枠線、パディング、幅はなく、それぞれアプリの `class` と `style` を受け取ります。多数の行、ソート、選択、サイズ変更可能な列が必要な場合は、[`DataTable`](./data-table.md) がテーブルです。

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

`Table` とその部品は、Rust の `nsh-base` クレートである [`nsh/base`](../modules/nsh-base.md) から提供されます。`table()`、`table_header()`、`table_body()`、`table_footer()`、`table_row()`、`table_head()`、`table_cell()`、`table_caption()` がそれらを作り、型付きのスタイルメソッドと `.child(..)` を使えます。行はセルを横に並べてレイアウトします。セルの幅はアプリが指定するので、列がそろいます。

## Props

| Prop | Rust | 型 | デフォルト | 説明 |
|---|---|---|---|---|
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | なし | `Table` のみ：スクリーンリーダーがテーブルをどう呼ぶか。 |
| `children` | `.child(..)` | `JSX.Element` | なし | 部品が保持する内容：`Table` ではグループとキャプション、グループでは行、行ではセル、セルではコンテンツ。 |
| `class`、`style` | スタイルメソッド | `string`、`StyleProp<ViewStyle>` | なし | 部品の見た目とレイアウト。 |

<a id="parts"></a>

## 部品

| 部品 | 配置先 | スクリーンリーダー向けのロール |
|---|---|---|
| `Table` | | table |
| `TableHeader` | `Table` | 行グループ：列ヘッダーの行 |
| `TableBody` | `Table` | 行グループ：データの行 |
| `TableFooter` | `Table` | 行グループ：合計、サマリー行 |
| `TableRow` | グループ、または `Table` | 行。セルを横に並べる |
| `TableHead` | ヘッダーの `TableRow` | 列ヘッダー |
| `TableCell` | `TableRow` | セル |
| `TableCaption` | `Table` | アプリがテーブルについて表示するコンテンツ |

各プラットフォームは、そのスクリーンリーダー向けにロールを割り当てます。Linux（AT-SPI）、Web（ARIA）、Android、GPUI バックエンドでは table、row、cell、column header の各ロール、macOS と Windows ではグリッドとグループ、iOS ではヘッダーとしてのヘッダーです。

<a id="see-also"></a>

## 関連項目

- [DataTable](./data-table.md)：行数・列数に制限のないテーブル。選択、ソート、サイズ変更や移動が可能な列に対応します。
- [Accessibility](../docs/accessibility.md)：`accessibilityRole` の値、`table`、`row`、`cell`、`columnheader`、`rowgroup` などを扱います。
