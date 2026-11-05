---
title: "Table"
description: "مكوّن Table وأجزاؤه: جدول مكوّن من صفوف وخلايا التطبيق نفسه، تتعرّف عليه قارئات الشاشة على أنه جدول، مع المظهر الذي يحدده التطبيق لكل جزء."
group: base
demo: el-table
source_hash: b35a56c82dadd942
---

# الجدول (Table)

يعرض `Table` بضعة صفوف يكتبها التطبيق على هيئة عناصر فرعية (فواتير، ملخص، مقارنة)، ويمنح قارئات الشاشة جدولاً كاملاً: الجدول نفسه، ومجموعات الصفوف، والصفوف، ورؤوس الأعمدة، والخلايا، لكل منها دوره. أجزاؤه هي
`TableHeader` و`TableBody` و`TableFooter` (مجموعات الصفوف)، و`TableRow` (خلاياه جنباً إلى جنب)، و`TableHead` (خلية رأس
العمود)، و`TableCell` و`TableCaption`. المظهر يحدده التطبيق: لا يملك أي جزء ألواناً أو حدوداً أو هوامش داخلية أو
عروضاً خاصة به، ويقبل كل جزء `class` و`style` الخاصين بالتطبيق. أما للصفوف الكثيرة والفرز والتحديد والأعمدة القابلة لتغيير الحجم،
فإن [`DataTable`](./data-table.md) هو الجدول المناسب.

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

يأتي `Table` وأجزاؤه من [`nsh/base`](../modules/nsh-base.md)، وهي حزمة `nsh-base` في Rust، حيث تنشئها `table()` و
`table_header()` و`table_body()` و`table_footer()` و`table_row()` و`table_head()` و`table_cell()` و
`table_caption()`، مع دوال الأنماط المصنّفة بالأنواع و`.child(..)`. يعرض الصف خلاياه جنباً إلى جنب؛ ويحدد
التطبيق عروض الخلايا، فتصطف الأعمدة.

<a id="props"></a>

## الخصائص

| الخاصية | Rust | النوع | الافتراضي | الوصف |
|---|---|---|---|---|
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | لا شيء | في `Table` فقط: الاسم الذي تنطق به قارئات الشاشة للجدول. |
| `children` | `.child(..)` | `JSX.Element` | لا شيء | ما يحتويه الجزء: مجموعات وتعليق توضيحي في `Table`، وصفوف في المجموعة، وخلايا في الصف، ومحتوى في الخلية. |
| `class`، `style` | دوال الأنماط | `string`، `StyleProp<ViewStyle>` | لا شيء | مظهر الجزء وتخطيطه. |

<a id="parts"></a>

## الأجزاء

| الجزء | داخل | الدور لدى قارئات الشاشة |
|---|---|---|
| `Table` | | جدول |
| `TableHeader` | `Table` | مجموعة صفوف: صفوف رؤوس الأعمدة |
| `TableBody` | `Table` | مجموعة صفوف: صفوف البيانات |
| `TableFooter` | `Table` | مجموعة صفوف: الإجماليات، صف ملخص |
| `TableRow` | مجموعة، أو `Table` | صف؛ خلاياه جنباً إلى جنب |
| `TableHead` | `TableRow` في الرأس | رأس عمود |
| `TableCell` | `TableRow` | خلية |
| `TableCaption` | `Table` | محتوى يعرضه التطبيق حول الجدول |

تمنح كل منصة الأدوار لقارئ الشاشة الخاص بها: أدوار الجدول والصف والخلية ورأس العمود على Linux (AT-SPI)
والويب (ARIA) وAndroid وواجهة GPUI الخلفية؛ والشبكات والمجموعات على macOS وWindows؛ والرؤوس بوصفها رؤوساً على iOS.

<a id="see-also"></a>

## انظر أيضاً

- [DataTable](./data-table.md): جدول بأي عدد من الصفوف والأعمدة، مع التحديد والفرز وأعمدة قابلة لتغيير الحجم
  والنقل.
- [إمكانية الوصول](../docs/accessibility.md): قيم `accessibilityRole` و`table` و`row` و`cell` و`columnheader` و`rowgroup`
  من بينها.
