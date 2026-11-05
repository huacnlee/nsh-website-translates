---
title: "Table"
description: "Table कॉम्पोनेंट और उसके हिस्से: ऐप की अपनी पंक्तियों और सेल्स की एक तालिका, जिसे स्क्रीन रीडर तालिका के रूप में पहचानते हैं, और जिसके हर हिस्से का रूप ऐप तय करता है।"
group: base
demo: el-table
source_hash: b35a56c82dadd942
---

# तालिका

`Table` कुछ पंक्तियों को व्यवस्थित करता है जिन्हें ऐप चिल्ड्रन के रूप में लिखता है (इनवॉइस, सारांश, तुलना), और स्क्रीन रीडर को एक तालिका देता है: तालिका स्वयं, पंक्तियों के समूह, पंक्तियाँ, कॉलम हेडर और सेल, प्रत्येक अपनी भूमिका (role) के साथ। इसके भाग हैं `TableHeader`, `TableBody` और `TableFooter` (पंक्तियों के समूह), `TableRow` (इसके सेल साथ-साथ), `TableHead` (किसी कॉलम का हेडर सेल), `TableCell` और `TableCaption`। रूप-रंग ऐप का होता है: किसी भी भाग के अपने रंग, बॉर्डर, पैडिंग या चौड़ाई नहीं होते, और प्रत्येक भाग ऐप के `class` और `style` लेता है। बहुत सारी पंक्तियों, सॉर्टिंग, चयन और आकार बदले जा सकने वाले कॉलम के लिए, [`DataTable`](./data-table.md) ही तालिका है।

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

`Table` और इसके भाग [`nsh/base`](../modules/nsh-base.md) से आते हैं, जो Rust में `nsh-base` क्रेट है, जहाँ `table()`, `table_header()`, `table_body()`, `table_footer()`, `table_row()`, `table_head()`, `table_cell()` और `table_caption()` इन्हें टाइप्ड स्टाइल मेथड और `.child(..)` के साथ बनाते हैं। एक पंक्ति अपने सेल साथ-साथ रखती है; ऐप सेल को उनकी चौड़ाई देता है, ताकि कॉलम एक सीध में रहें।

<a id="props"></a>

## प्रॉप्स

| प्रॉप | Rust | प्रकार | डिफ़ॉल्ट | विवरण |
|---|---|---|---|---|
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | कोई नहीं | केवल `Table` के लिए: स्क्रीन रीडर तालिका को क्या नाम देते हैं। |
| `children` | `.child(..)` | `JSX.Element` | कोई नहीं | भाग में क्या होता है: `Table` में समूह और एक कैप्शन, समूह में पंक्तियाँ, पंक्ति में सेल, सेल में सामग्री। |
| `class`, `style` | स्टाइल मेथड | `string`, `StyleProp<ViewStyle>` | कोई नहीं | भाग का रूप और लेआउट। |

<a id="parts"></a>

## भाग

| भाग | भीतर | स्क्रीन रीडर के लिए भूमिका |
|---|---|---|
| `Table` | | तालिका |
| `TableHeader` | `Table` | पंक्ति समूह: कॉलम हेडर की पंक्तियाँ |
| `TableBody` | `Table` | पंक्ति समूह: डेटा की पंक्तियाँ |
| `TableFooter` | `Table` | पंक्ति समूह: कुल योग, एक सारांश पंक्ति |
| `TableRow` | एक समूह, या `Table` | पंक्ति; इसके सेल साथ-साथ |
| `TableHead` | हेडर का एक `TableRow` | कॉलम हेडर |
| `TableCell` | `TableRow` | सेल |
| `TableCaption` | `Table` | वह सामग्री जो ऐप तालिका के बारे में दिखाता है |

प्रत्येक प्लेटफ़ॉर्म अपने स्क्रीन रीडर को भूमिकाएँ देता है: Linux (AT-SPI), वेब (ARIA), Android और GPUI बैकएंड पर तालिका, पंक्ति, सेल और कॉलम हेडर की भूमिकाएँ; macOS और Windows पर ग्रिड और समूह; iOS पर हेडर के रूप में हेडर।

<a id="see-also"></a>

## यह भी देखें

- [DataTable](./data-table.md): किसी भी संख्या में पंक्तियों और कॉलम की तालिका, चयन, सॉर्टिंग और आकार बदले जा सकने वाले, हटाए जा सकने वाले कॉलम के साथ।
- [Accessibility](../docs/accessibility.md): `accessibilityRole` मान, `table`, `row`, `cell`, `columnheader` और `rowgroup` इन्हीं में शामिल हैं।
