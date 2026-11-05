---
title: "Table"
description: "Il componente Table e le sue parti: una tabella con righe e celle proprie dell'app che gli screen reader riconoscono come tabella, con l'aspetto che l'app assegna a ciascuna parte."
group: base
demo: el-table
source_hash: b35a56c82dadd942
---

# Table

Un `Table` dispone alcune righe che l'app scrive come figli (fatture, un riepilogo, un confronto) e offre ai lettori di schermo
una tabella: la tabella stessa, i gruppi di righe, le righe, le intestazioni di colonna e le celle, ciascuno con il proprio ruolo. Le sue parti sono
`TableHeader`, `TableBody` e `TableFooter` (gruppi di righe), `TableRow` (le sue celle affiancate), `TableHead` (la cella di
intestazione di una colonna), `TableCell` e `TableCaption`. L'aspetto è quello dell'app: nessuna parte ha colori, bordi, padding o
larghezze propri, e ciascuna riceve i `class` e i `style` dell'app. Per molte righe, ordinamento, selezione e colonne
ridimensionabili, la tabella da usare è [`DataTable`](./data-table.md).

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

`Table` e le sue parti provengono da [`nsh/base`](../modules/nsh-base.md), il crate `nsh-base` in Rust, dove `table()`,
`table_header()`, `table_body()`, `table_footer()`, `table_row()`, `table_head()`, `table_cell()` e
`table_caption()` le creano, con i metodi di stile tipizzati e `.child(..)`. Una riga dispone le sue celle affiancate; l'app
assegna le larghezze alle celle, così le colonne risultano allineate.

## Props

| Prop | Rust | Tipo | Predefinito | Descrizione |
|---|---|---|---|---|
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | nessuno | Solo `Table`: come i lettori di schermo chiamano la tabella. |
| `children` | `.child(..)` | `JSX.Element` | nessuno | Ciò che la parte contiene: gruppi e una didascalia in un `Table`, righe in un gruppo, celle in una riga, contenuto in una cella. |
| `class`, `style` | metodi di stile | `string`, `StyleProp<ViewStyle>` | nessuno | L'aspetto e il layout della parte. |

<a id="parts"></a>

## Parti

| Parte | Contenuta in | Ruolo per i lettori di schermo |
|---|---|---|
| `Table` | | tabella |
| `TableHeader` | `Table` | gruppo di righe: le righe delle intestazioni di colonna |
| `TableBody` | `Table` | gruppo di righe: le righe dei dati |
| `TableFooter` | `Table` | gruppo di righe: totali, una riga di riepilogo |
| `TableRow` | un gruppo, oppure `Table` | riga; le sue celle affiancate |
| `TableHead` | un `TableRow` dell'intestazione | intestazione di colonna |
| `TableCell` | `TableRow` | cella |
| `TableCaption` | `Table` | contenuto che l'app mostra a proposito della tabella |

Ogni piattaforma assegna i ruoli al proprio lettore di schermo: ruoli di tabella, riga, cella e intestazione di colonna su Linux (AT-SPI), sul
web (ARIA), su Android e nel backend GPUI; griglie e gruppi su macOS e Windows; intestazioni come intestazioni su iOS.

<a id="see-also"></a>

## Vedi anche

- [DataTable](./data-table.md): una tabella con qualsiasi numero di righe e colonne, con selezione, ordinamento e colonne
  ridimensionabili e spostabili.
- [Accessibility](../docs/accessibility.md): i valori di `accessibilityRole`, `table`, `row`, `cell`, `columnheader` e `rowgroup`
  tra gli altri.
