---
title: "Table"
description: "O componente Table e suas partes: uma tabela com as linhas e células do próprio app, que os leitores de tela reconhecem como tabela, com a aparência que o app dá a cada parte."
group: base
demo: el-table
source_hash: b35a56c82dadd942
---


# Table

`Table` organiza algumas linhas que o app escreve como filhos (faturas, um resumo, uma comparação) e dá aos leitores de tela uma tabela: a tabela em si, grupos de linhas, linhas, cabeçalhos de coluna e células, cada um com seu papel. Suas partes são
`TableHeader`, `TableBody` e `TableFooter` (grupos de linhas), `TableRow` (suas células lado a lado), `TableHead` (a
célula de cabeçalho de uma coluna), `TableCell` e `TableCaption`. A aparência é do app: nenhuma parte tem cores, bordas, preenchimentos ou
larguras próprias, e cada uma aceita `class` e `style` do app. Para muitas linhas, ordenação, seleção e colunas redimensionáveis, a tabela é [`DataTable`](./data-table.md).

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

`Table` e suas partes vêm de [`nsh/base`](../modules/nsh-base.md), o crate `nsh-base` em Rust, em que `table()`,
`table_header()`, `table_body()`, `table_footer()`, `table_row()`, `table_head()`, `table_cell()` e
`table_caption()` as criam, com os métodos de estilo tipados e `.child(..)`. Uma linha dispõe suas células lado a lado; o
app define as larguras das células, para que as colunas fiquem alinhadas.

## Props

| Prop | Rust | Tipo | Padrão | Descrição |
|---|---|---|---|---|
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | nenhum | Somente em `Table`: como os leitores de tela chamam a tabela. |
| `children` | `.child(..)` | `JSX.Element` | nenhum | O que a parte contém: grupos e uma legenda em um `Table`, linhas em um grupo, células em uma linha, conteúdo em uma célula. |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | nenhum | A aparência e o layout da parte. |

<a id="parts"></a>

## Partes

| Parte | Dentro de | Papel para leitores de tela |
|---|---|---|
| `Table` | | tabela |
| `TableHeader` | `Table` | grupo de linhas: as linhas de cabeçalhos de coluna |
| `TableBody` | `Table` | grupo de linhas: as linhas de dados |
| `TableFooter` | `Table` | grupo de linhas: totais, uma linha de resumo |
| `TableRow` | um grupo, ou `Table` | linha; suas células lado a lado |
| `TableHead` | um `TableRow` do cabeçalho | cabeçalho de coluna |
| `TableCell` | `TableRow` | célula |
| `TableCaption` | `Table` | conteúdo que o app exibe sobre a tabela |

Cada plataforma repassa os papéis ao seu leitor de tela: papéis de tabela, linha, célula e cabeçalho de coluna no Linux (AT-SPI), na web (ARIA), no Android e no backend GPUI; grades e grupos no macOS e no Windows; cabeçalhos como cabeçalhos no iOS.

<a id="see-also"></a>

## Veja também

- [DataTable](./data-table.md): uma tabela com qualquer número de linhas e colunas, com seleção, ordenação e colunas
  redimensionáveis e móveis.
- [Acessibilidade](../docs/accessibility.md): os valores de `accessibilityRole`, `table`, `row`, `cell`, `columnheader` e `rowgroup`,
  entre outros.
