---
title: "Table"
description: "Le composant Table et ses parties : un tableau composé des propres lignes et cellules de l'application, reconnu comme tel par les lecteurs d'écran, avec l'apparence que l'application donne à chaque partie."
group: base
demo: el-table
source_hash: b35a56c82dadd942
---

# Table

Un `Table` dispose quelques lignes que l'application écrit comme enfants (factures, récapitulatif, comparaison) et expose aux lecteurs d'écran un tableau : le tableau lui-même, des groupes de lignes, des lignes, des en-têtes de colonne et des cellules, chacun avec son rôle. Ses parties sont `TableHeader`, `TableBody` et `TableFooter` (groupes de lignes), `TableRow` (ses cellules côte à côte), `TableHead` (la cellule d'en-tête d'une colonne), `TableCell` et `TableCaption`. L'apparence appartient à l'application : aucune partie n'a de couleurs, de bordures, de marges intérieures ni de largeurs propres, et chacune reçoit les `class` et `style` de l'application. Pour de nombreuses lignes, le tri, la sélection et des colonnes redimensionnables, [`DataTable`](./data-table.md) est le tableau qu'il vous faut.

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

`Table` et ses parties proviennent de [`nsh/base`](../modules/nsh-base.md), le crate `nsh-base` en Rust, où `table()`, `table_header()`, `table_body()`, `table_footer()`, `table_row()`, `table_head()`, `table_cell()` et `table_caption()` les créent, avec les méthodes de style typées et `.child(..)`. Une ligne dispose ses cellules côte à côte ; l'application donne leurs largeurs aux cellules, de sorte que les colonnes sont alignées.

## Props

| Prop | Rust | Type | Défaut | Description |
|---|---|---|---|---|
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | aucun | `Table` uniquement : le nom que les lecteurs d'écran donnent au tableau. |
| `children` | `.child(..)` | `JSX.Element` | aucun | Ce que contient la partie : des groupes et une légende dans un `Table`, des lignes dans un groupe, des cellules dans une ligne, du contenu dans une cellule. |
| `class`, `style` | méthodes de style | `string`, `StyleProp<ViewStyle>` | aucun | L'apparence et la mise en page de la partie. |

<a id="parts"></a>

## Parties

| Partie | Dans | Rôle pour les lecteurs d'écran |
|---|---|---|
| `Table` | | table |
| `TableHeader` | `Table` | groupe de lignes : les lignes d'en-têtes de colonne |
| `TableBody` | `Table` | groupe de lignes : les lignes de données |
| `TableFooter` | `Table` | groupe de lignes : totaux, ligne de récapitulatif |
| `TableRow` | un groupe, ou `Table` | ligne ; ses cellules côte à côte |
| `TableHead` | un `TableRow` de l'en-tête | en-tête de colonne |
| `TableCell` | `TableRow` | cellule |
| `TableCaption` | `Table` | contenu que l'application affiche à propos du tableau |

Chaque plateforme transmet les rôles à son lecteur d'écran : rôles de table, de ligne, de cellule et d'en-tête de colonne sur Linux (AT-SPI), le web (ARIA), Android et le backend GPUI ; grilles et groupes sur macOS et Windows ; en-têtes en tant qu'en-têtes sur iOS.

<a id="see-also"></a>

## Voir aussi

- [DataTable](./data-table.md) : un tableau d'un nombre quelconque de lignes et de colonnes, avec sélection, tri et colonnes redimensionnables et déplaçables.
- [Accessibilité](../docs/accessibility.md) : les valeurs de `accessibilityRole`, `table`, `row`, `cell`, `columnheader` et `rowgroup`, entre autres.
