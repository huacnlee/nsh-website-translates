---
title: "Table"
description: "Die Table-Komponente und ihre Teile: eine Tabelle aus den eigenen Zeilen und Zellen der App, die Screenreader als Tabelle erkennen, mit dem Erscheinungsbild, das die App jedem Teil gibt."
group: base
demo: el-table
source_hash: b35a56c82dadd942
---


# Table

Ein `Table` legt einige Zeilen aus, die die App als Kindelemente schreibt (Rechnungen, eine Zusammenfassung, einen Vergleich), und stellt Screenreadern eine Tabelle bereit: die Tabelle selbst, Zeilengruppen, Zeilen, Spaltenköpfe und Zellen, jeweils mit ihrer Rolle. Seine Teile sind `TableHeader`, `TableBody` und `TableFooter` (Zeilengruppen), `TableRow` (seine Zellen nebeneinander), `TableHead` (die Kopfzelle einer Spalte), `TableCell` und `TableCaption`. Das Aussehen bestimmt die App: Kein Teil hat eigene Farben, Rahmen, Innenabstände oder Breiten, und jedes übernimmt die `class` und `style` der App. Für viele Zeilen, Sortierung, Auswahl und in der Größe veränderbare Spalten ist [`DataTable`](./data-table.md) die passende Tabelle.

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

`Table` und seine Teile stammen aus [`nsh/base`](../modules/nsh-base.md), dem `nsh-base`-Crate in Rust, in dem `table()`, `table_header()`, `table_body()`, `table_footer()`, `table_row()`, `table_head()`, `table_cell()` und `table_caption()` sie erzeugen, mit den typisierten Style-Methoden und `.child(..)`. Eine Zeile legt ihre Zellen nebeneinander aus; die App gibt den Zellen ihre Breiten, sodass die Spalten ausgerichtet sind.

## Props

| Prop | Rust | Typ | Standard | Beschreibung |
|---|---|---|---|---|
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | keiner | Nur `Table`: wie Screenreader die Tabelle nennen. |
| `children` | `.child(..)` | `JSX.Element` | keiner | Was das Teil enthält: Gruppen und eine Beschriftung in einem `Table`, Zeilen in einer Gruppe, Zellen in einer Zeile, Inhalt in einer Zelle. |
| `class`, `style` | Style-Methoden | `string`, `StyleProp<ViewStyle>` | keiner | Aussehen und Layout des Teils. |

<a id="parts"></a>

## Teile

| Teil | Enthalten in | Rolle für Screenreader |
|---|---|---|
| `Table` | | Tabelle |
| `TableHeader` | `Table` | Zeilengruppe: die Zeilen mit den Spaltenköpfen |
| `TableBody` | `Table` | Zeilengruppe: die Datenzeilen |
| `TableFooter` | `Table` | Zeilengruppe: Summen, eine Zusammenfassungszeile |
| `TableRow` | eine Gruppe oder `Table` | Zeile; ihre Zellen nebeneinander |
| `TableHead` | ein `TableRow` des Kopfbereichs | Spaltenkopf |
| `TableCell` | `TableRow` | Zelle |
| `TableCaption` | `Table` | Inhalt, den die App zur Tabelle anzeigt |

Jede Plattform gibt die Rollen an ihren Screenreader weiter: Rollen für Tabelle, Zeile, Zelle und Spaltenkopf unter Linux (AT-SPI), im Web (ARIA), unter Android und im GPUI-Backend; Grids und Gruppen unter macOS und Windows; Köpfe als Header unter iOS.

<a id="see-also"></a>

## Siehe auch

- [DataTable](./data-table.md): eine Tabelle mit beliebig vielen Zeilen und Spalten, mit Auswahl, Sortierung und in der Größe veränderbaren, verschiebbaren Spalten.
- [Accessibility](../docs/accessibility.md): die `accessibilityRole`-Werte, darunter `table`, `row`, `cell`, `columnheader` und `rowgroup`.
