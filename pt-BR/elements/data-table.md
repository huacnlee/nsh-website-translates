---
title: "DataTable"
description: "O componente DataTable: uma tabela de linhas e colunas que rola nas duas direções sobre qualquer quantidade de ambas, com colunas fixas, redimensionáveis, móveis e ordenáveis, seleção de linhas, colunas e células, linhas que o app serve uma página por vez, rótulos de grupo, navegação por teclado e células que o app desenha."
group: base
demo: el-data-table
source_hash: 22c8d4a412976e77
---


# DataTable

`DataTable` mostra linhas e colunas como uma planilha e rola nas duas direções por qualquer quantidade de ambas. Somente as células visíveis são criadas, de modo que uma tabela de um milhão de linhas e dez mil colunas rola como uma pequena. Linhas, colunas ou células podem ser selecionadas, com o ponteiro e o teclado; as colunas têm larguras fixas, são redimensionadas arrastando a borda, movidas arrastando o título, ficam à esquerda enquanto as outras rolam e podem ser ordenadas. Os títulos podem ficar sob rótulos de grupo, e uma célula ou um título pode ser desenhado pelo app.

`DataTable` fornece layout, alinhamento, virtualização e interação. O app dá às suas partes o padding, as cores, as bordas e o feedback de seleção por meio de `classes` e `styles`. Rust cria uma com `nsh_base::data_table()`, TSX com `<DataTable>` de `nsh/base`.

```rust tabs
use nsh_base::{DataTableColumn, data_table};
use nsh_core::prelude::*;

fn column(key: &str, title: &str) -> DataTableColumn {
    let mut column = DataTableColumn::default();
    column.key = key.into();
    column.title = Some(title.into());
    column
}

fn table() -> impl IntoElement {
    data_table()
        .columns(vec![column("name", "Name"), column("city", "City")])
        .flex_1()
}
```

```tsx tabs
import { mount } from "nsh";
import { DataTable, type DataTableColumn } from "nsh/base";

const columns: DataTableColumn[] = [
  { key: "name", title: "Name", width: 160, sortable: true },
  { key: "city", title: "City", width: 120 },
  { key: "score", title: "Score", width: 90, align: "end" },
];

const rows = [
  { name: "Ada", city: "Oslo", score: 91 },
  { name: "Grace", city: "Lima", score: 87 },
  { name: "Linus", city: "Kyoto", score: 78 },
];

function App() {
  return <DataTable columns={columns} data={rows} class="flex-1" />;
}

mount(App);
```

A tabela preenche a caixa que o app lhe dá (`flex-1`, uma altura) e rola dentro dela: na vertical pelas linhas e na horizontal pelas colunas, com barras de rolagem (`scrollbar={false}` as oculta, `bounces={false}` impede o efeito de elasticidade nas extremidades onde a plataforma o tem).

<a id="rows-and-columns"></a>

## Linhas e colunas

`data` são as linhas: objetos cujos campos são nomeados pelos `key`s das colunas, ou arrays que as colunas indexam por posição. Números, booleanos e strings são exibidos como texto. Rust fornece as linhas um campo por vez, cada um de um tipo:
`DataTableRows::new(2).texts("symbol", ["AAPL", "MSFT"]).numbers("change", [1.2, -0.4])`. Uma coluna é um
`DataTableColumn`:

| Campo | Descrição |
|---|---|
| `key` | Identifica a coluna, única entre as colunas: o campo das linhas que suas células mostram e o nome que os eventos e a ref usam. |
| `title` | O texto do seu título. Padrão: seu `key`. |
| `width` | Sua largura, em pontos. Padrão `120`. |
| `minWidth`, `maxWidth` | A menor e a maior largura que um arrasto ou um ajuste lhe dá. Padrão `20` e `1200`. |
| `fitPadding` | Espaço extra para o padding, os ícones ou os badges do app, somado ao texto mais largo do título ou das células ao ajustar a coluna. |
| `align` | `"start"` (o padrão), `"center"` ou `"end"`, para números. Vale tanto para as células quanto para o título. |
| `sortable` | Seu título tem um botão de ordenação que solicita uma ordenação (veja [Ordenação](#sorting)). |
| `fixed` | Fica à esquerda enquanto as outras colunas rolam sob ela. As colunas fixas vêm antes das outras, na sua ordem. |
| `resizable`, `movable` | Se um arrasto de sua borda a redimensiona e se um arrasto de seu título a move. Padrão: `resizableColumns` e `movableColumns` da tabela. |
| `selectable` | Se participa da seleção. Uma coluna de botões ou checkboxes define `false`. Padrão `true`. |
| `cellClass` | Classes das células da coluna, depois das da parte `cell`: paddings ou alinhamento de uma única coluna. |
| `headerClass` | Classes do título da coluna, depois das da parte `headerCell`. |
| `positiveClass` | Classes das células da coluna que contêm uma alta: um número acima de zero ou um texto que começa com `+`. |
| `negativeClass` | Classes das células da coluna que contêm uma queda: um número abaixo de zero ou um texto que começa com `-`. |

`rowHeight` é a altura de uma linha do corpo (padrão `32`) e `headerHeight` a altura de uma linha de título (padrão: a altura da linha). `rowHeader` adiciona uma coluna de números de linha à esquerda, que seleciona linhas. `stripe` dá às linhas ímpares a parte `rowOdd`.

<a id="group-labels"></a>

### Rótulos de grupo

`groups` coloca rótulos acima das colunas, começando pelo nível mais baixo. Cada nível é uma lista de `{ label, span }` cujos spans somam o número de colunas, ou o do nível abaixo.

```tsx
<DataTable
  columns={columns}
  data={rows}
  groups={[
    [{ label: "Person", span: 2 }, { label: "Result", span: 1 }],
  ]}
  class="flex-1"
/>
```

<a id="any-number-of-rows"></a>

## Qualquer quantidade de linhas

A tabela pede as linhas por posição, e o app as fornece. `rowCount` é o número total de linhas, `data` as linhas que o app mantém e `dataStart` a posição da primeira delas. Linhas fora de `data` ficam vazias até o app fornecê-las. `onVisibleRowsChange` informa as linhas visíveis, `{ range: { start, end } }`, a cada passo de rolagem, e é o lugar para buscar a página ao redor delas.

```tsx
const ROWS = 1_000_000;
const page = signal({ start: 0, rows: load(0) });

<DataTable
  columns={columns}
  data={page().rows}
  dataStart={page().start}
  rowCount={ROWS}
  onVisibleRowsChange={({ range: { start, end } }) => {
    // Keep the rows in view inside the page held.
    const held = page();
    if (start < held.start || end > held.start + held.rows.length) {
      const first = Math.max(0, start - 200);
      page.set({ start: first, rows: load(first) });
    }
  }}
  class="flex-1"
/>
```

Para uma lista que cresce no final, defina `hasMore`: `onLoadMore` dispara uma vez para cada número de linhas quando as linhas visíveis chegam a `loadMoreThreshold` (padrão `20`) da última. Enquanto `loading` for true, ele espera, e o slot `loadingView` aparece sobre as linhas. O slot `empty` aparece quando não há linhas.

Passando de alguns milhões de pontos de conteúdo, as barras de rolagem abrangem um intervalo escalonado, de modo que um milhão de linhas ainda rola até cada linha.

<a id="selection"></a>

## Seleção

Três chaves decidem o que um pressionamento seleciona, como no gpui-component:

| Prop | Um pressionamento seleciona | `selection` |
|---|---|---|
| `rowSelectable` (padrão `true`) | Uma linha: qualquer uma de suas células ou o cabeçalho de linha | `{ row }` |
| `columnSelectable` (padrão `true`) | Uma coluna: seu título | `{ column }` |
| `cellSelectable` (padrão `false`) | Uma célula; o cabeçalho de linha (exibido por padrão com ela) seleciona linhas | `{ row, column }` |

Com `cellSelectable` e o cabeçalho de linha oculto (`rowHeader={false}`), pressionar a célula selecionada de novo seleciona sua linha. Um pressionamento com Shift ou com a tecla de comando da plataforma seleciona uma linha somente enquanto `selectOnModifierPress` (padrão `true`), de modo que um app que mantém sua própria seleção de várias linhas trata esses pressionamentos por conta própria: `onRowPress` informa cada pressionamento no corpo com sua linha, a coluna sob o ponteiro, os cliques em uma linha e as teclas modificadoras pressionadas. Uma coluna cujo `selectable` é `false` não seleciona nem a si mesma nem suas células.

As linhas contam a partir de 0 nos dados, e uma coluna é seu índice entre `columns`, qualquer que seja a ordem para a qual o usuário as moveu. `onSelectionChange` informa o que o usuário selecionou (`null` para nada). A prop `selection` define a seleção a partir do app; deixe-a sem definir e a tabela a mantém. `onDoublePress` informa uma linha, uma célula ou um título pressionado duas vezes, e `onContextMenu` um pressionamento secundário ou longo, com o ponto onde abrir o [`Menu`](./menu.md) do app. Ambos nomeiam a célula sob o ponteiro (seu `row` e `column`), o número de uma linha (somente `row`) ou um título (somente `column`). Até o próximo pressionamento, a célula para a qual um menu foi pedido tem a parte `cellActive`, ou sua linha tem a parte `rowActive` onde as células não selecionam.

Leitores de tela recebem uma grade (nomeada por `accessibilityLabel`) de cabeçalhos de coluna e células, e as selecionadas são anunciadas como selecionadas.

<a id="keyboard"></a>

## Teclado

Pressionar a tabela, ou chegar a ela com Tab (macOS, web), dá a ela o teclado até outro pressionamento, até o foco ir para outro lugar ou até `blur()`; `focus()` o dá a partir do app. A tabela é uma parada do Tab: dentro dela o Tab move a seleção, e Escape devolve o teclado.

| Teclas | O que fazem |
|---|---|
| Setas | Movem a seleção por uma linha, uma coluna ou uma célula, rolando-a para a área visível. |
| Tab, Shift+Tab | Movem para a próxima ou a anterior coluna. |
| Page Up, Page Down | Movem por uma página de linhas. |
| Home, End | Movem para a primeira ou a última. |
| Escape | Limpa a seleção e depois devolve o teclado. |
| Atalho de cópia | Coloca o texto da seleção na área de transferência (`copy()`). |

`loopSelection` (padrão `true`) faz as setas darem a volta nas extremidades.

<a id="sorting"></a>

## Ordenação

Uma coluna `sortable` tem um botão de ordenação no fim do título, um pequeno botão ghost esmaecido enquanto a coluna não está ordenada. Pressioná-lo informa a próxima ordenação (`{ key, direction }`) no ciclo de sem ordem, crescente, decrescente e sem ordem de novo, com `onSortChange({ sort })` (`null` para limpar). A tabela não reordena as linhas: o app ordena seus dados, ou pede ao servidor as linhas na nova ordem, e define `sort` para que o título a mostre. Como o app é dono da ordem, a ordenação funciona do mesmo modo sobre um milhão de linhas que o app nunca mantém.

```tsx
<DataTable
  columns={columns}
  data={rows()}
  sort={sort()}
  onSortChange={({ sort: next }) => {
    sort.set(next ?? undefined);
    rows.set(sorted(people, next));
  }}
  class="flex-1"
/>
```

<a id="resizing-and-moving-columns"></a>

## Redimensionar e mover colunas

Um arrasto da borda final de uma coluna a redimensiona dentro de `minWidth` e `maxWidth`, e `onColumnResize({ key, width })` informa cada passo. Pressionar a borda duas vezes seguidas ajusta a coluna ao seu texto e título mais largos. Um arrasto de um título move a coluna, e uma linha mostra onde ela será solta; `onColumnMove` informa `{ key, from, to, order }`, sendo `order` os `key`s de todas as colunas na ordem exibida. As colunas fixas permanecem entre as fixas. `resizableColumns` e `movableColumns` desativam ambos para a tabela, e `resizable` e `movable` de uma coluna prevalecem sobre eles.

<a id="live-data"></a>

## Dados ao vivo

Uma tabela de cotações muda muitas vezes por segundo. O app formata as linhas visíveis e uma margem ao redor delas (ele as conhece por `onVisibleRowsChange`) e as entrega como `data` de `dataStart`, de modo que uma atualização custa o que está na tela, qualquer que seja o número de linhas. Altas e quedas tiram suas cores de `positiveClass` e `negativeClass` da coluna, aplicadas nativamente às células cujo valor está acima ou abaixo de zero (ou cujo texto começa com `+` ou `-`).

```tsx
const tone = { positiveClass: "text-green-600", negativeClass: "text-red-600" };
const columns: DataTableColumn[] = [
  { key: "symbol", title: "Symbol", fixed: true },
  { key: "price", title: "Price", align: "end", sortable: true },
  { key: "change", title: "Chg%", align: "end", ...tone },
];
```

Linhas e colunas são slots que a tabela cria uma vez e mantém: a rolagem lhes dá outras linhas e colunas para mostrar, de modo que uma rolagem, por mais longa que seja, só altera textos e posições.

<a id="drawing-cells-and-titles"></a>

## Desenhar células e títulos

`renderCell` desenha as células próprias do app onde uma coluna não é apenas texto (um badge, um botão). É chamado somente para as células visíveis, com um `DataTableCell`: `row`, `column`, `key`, `text` (o que a tabela mostraria) e `selected`. O app busca seus próprios dados por `row`. `renderHeaderCell` desenha um título ao longo de sua célula, recebendo um `DataTableHeaderCell`: `column`, `key`, `title`, `sort` (a direção, ou nenhuma) e `selected`.

```tsx
<DataTable
  columns={columns}
  data={rows()}
  renderCell={(cell) =>
    cell.key === "status" ? (
      <View class={cell.text === "open" ? "rounded bg-green-500/20 px-2" : "rounded bg-muted px-2"}>
        <Text class="text-xs">{cell.text}</Text>
      </View>
    ) : (
      <Text class="px-2 text-sm">{cell.text}</Text>
    )
  }
  class="flex-1"
/>
```

`fontFamily` e `fontSize` (padrão `14`) definem a fonte das células, na qual a tabela também mede os textos para ajustar as colunas.

<a id="the-ref"></a>

## A ref

`ref` fornece um `DataTableRef`. Um método que recebe uma linha, uma coluna ou uma chave de coluna que a tabela não tem não altera nada e registra um aviso com o nome do método e o valor; `fitColumn` é rejeitado com um `TypeError` para uma chave desconhecida.

| Método | Descrição |
|---|---|
| `scrollToRow(row, animated?)` | Rola uma linha para a área visível. |
| `scrollToColumn(key, animated?)` | Rola uma coluna para a área visível. |
| `selection()` | O que está selecionado, `null` para nada. |
| `select(selection)` | Seleciona (`null`: nada) e traz para a área visível, sem `onSelectionChange`. |
| `visibleRows()`, `visibleColumns()` | As linhas e as colunas roláveis visíveis, como `{ start, end }` (`end` excluído). |
| `columnWidths()` | As larguras atuais, na ordem de `columns`. |
| `setColumnWidth(key, width)` | Define a largura de uma coluna, dentro de seus limites. |
| `fitColumn(key)` | Define uma coluna tão larga quanto seu texto mais largo e seu título precisarem, entre as linhas visíveis e até mil a mais ao redor delas. Retorna a largura. |
| `dump(start?, end?)` | Os textos das linhas informadas (padrão: todas as mantidas) e dos títulos, como exibidos: `{ headers, rows }`, para exportação. |
| `copy()` | Coloca o texto da seleção na área de transferência: as células de uma linha separadas por tabulações, as de uma coluna por quebras de linha, o texto de uma célula. |
| `focus()`, `blur()` | Dá o teclado à tabela ou o retira. |
| `menuTarget()`, `clearMenuTarget()` | Para onde o último menu de contexto foi pedido (`{ row?, column? }`, marcado por `cellActive` / `rowActive`) e a remoção dessa marca quando o menu do app fecha. |

<a id="styling-the-parts"></a>

## Estilizar as partes

`class` e `style` estilizam a caixa da tabela. `classes` recebe classes Tailwind por parte e `styles` estilos inline por parte; as partes fornecem a estrutura e o alinhamento da tabela; suas classes fornecem a aparência, e `styles` prevalecem sobre as classes.

```tsx
<DataTable
  columns={columns}
  data={rows()}
  stripe
  class="flex-1 rounded-lg border border-border"
  classes={{
    header: "bg-secondary",
    headerCell: "pl-2 pr-1",
    headerContent: "gap-1",
    cell: "px-2",
    resizeHandle: "bg-border group-hover:bg-primary",
    sortAscending: "text-muted-foreground opacity-60 selected:text-foreground selected:opacity-100",
    sortDescending: "text-muted-foreground opacity-60 selected:text-foreground selected:opacity-100",
    rowSelected: "bg-primary/10",
    rowHover: "bg-muted/50",
    fixedEdge: "bg-border",
  }}
/>
```

| Parte | O que é |
|---|---|
| `root` | A caixa da tabela: sua borda, seu raio e seu fundo |
| `header` | O cabeçalho ao longo da tabela, com suas linhas de rótulos de grupo e títulos |
| `groupCell` | Um rótulo de grupo acima das colunas que abrange |
| `headerCell` | A célula de título de cada coluna |
| `headerContent` | A linha de layout do rótulo e do botão de ordenação; defina o espaçamento entre eles aqui |
| `headerCellDragging` | O título arrastado, depois de `headerCell` |
| `headerCellSorted` | O título da coluna pela qual a tabela está ordenada, depois de `headerCell` |
| `headerCellSelected` | O título da coluna selecionada, depois de `headerCell` |
| `sortIndicator` | O botão de ordenação de uma coluna ordenável |
| `sortAscending`, `sortDescending` | Seus dois chevrons; `selected:` vale para a direção ordenada |
| `resizeHandle` | A linha na borda final de uma coluna que um arrasto redimensiona |
| `moveIndicator` | A linha onde uma coluna arrastada será solta |
| `row` | Cada linha do corpo |
| `rowOdd` | As linhas ímpares, depois de `row` (`stripe`) |
| `rowHover` | A linha sobre a qual o ponteiro está, depois de `row` |
| `rowSelected` | A linha selecionada, depois de `row` |
| `rowActive` | A linha para a qual um menu de contexto foi pedido onde as células não selecionam, até o próximo pressionamento, depois de `row` |
| `cell` | Cada célula do corpo |
| `cellSelected` | A célula selecionada, depois de `cell` |
| `cellActive` | A célula para a qual um menu de contexto foi pedido, até o próximo pressionamento, depois de `cell` |
| `cellColumnSelected` | As células da coluna selecionada, depois de `cell` |
| `rowHeader` | As células do cabeçalho de linha, os números de linha |
| `rowHeaderCorner` | O canto acima dos cabeçalhos de linha |
| `fixedEdge` | A linha na borda final das colunas fixas, sobre as colunas que rolam sob elas |
| `empty` | A caixa do slot `empty` |
<a id="props"></a>

## Propriedades

| Prop | Rust | Tipo | Padrão | Descrição |
|---|---|---|---|---|
| `columns` | `.columns(..)` | `DataTableColumn[]` | `[]` | As colunas, da esquerda para a direita. As fixas vêm primeiro. |
| `data` | `.data(..)` | `Row[]` | `[]` | As linhas: objetos indexados pela coluna `key`, ou arrays indexados por posição. |
| `rowCount` | `.row_count(..)` | `number` | as linhas mantidas | Quantas linhas existem no total. |
| `dataStart` | `.data_start(..)` | `number` | `0` | O índice da primeira linha de `data`. |
| `rowClasses` | `.row_classes(..)` | `string[]` | `[]` | Classes das linhas informadas, pela posição delas em `data`: a aparência própria de uma linha, sem chamar o JS por linha. |
| `rowHeight` | `.row_height(..)` | `number` | `32` | A altura de uma linha do corpo, em pontos. |
| `headerHeight` | `.header_height(..)` | `number` | a altura da linha | A altura de uma linha de título. |
| `groups` | `.groups(..)` | `DataTableColumnGroup[][]` | `[]` | Rótulos acima das colunas, do nível mais baixo para o mais alto. |
| `sort` | `.sort(..)` | `DataTableSort` | | Pelo que os dados estão ordenados, exibido no título. |
| `rowSelectable` | `.row_selectable(..)` | `boolean` | `true` | Toques e teclas selecionam linhas. |
| `columnSelectable` | `.column_selectable(..)` | `boolean` | `true` | O toque em um título seleciona a coluna dele, e as teclas horizontais se movem entre colunas. |
| `cellSelectable` | `.cell_selectable(..)` | `boolean` | `false` | Toques e teclas selecionam células. |
| `selectOnModifierPress` | `.select_on_modifier_press(..)` | `boolean` | `true` | Um toque com Shift ou a tecla Command pressionada seleciona uma linha. |
| `selection` | `.selection(..)` | `DataTableSelection` | | O que está selecionado, quando o app o define. |
| `loopSelection` | `.loop_selection(..)` | `boolean` | `true` | As teclas de seta dão a volta nas extremidades. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | nenhum | Como os leitores de tela chamam a tabela. |
| `rowHeader` | `.row_header(..)` | `boolean` | exibido com `cellSelectable` | Uma coluna de números de linha à esquerda. |
| `stripe` | `.stripe(..)` | `boolean` | `false` | As linhas ímpares recebem a parte `rowOdd`. |
| `resizableColumns` | `.resizable_columns(..)` | `boolean` | `true` | Arrastar a borda de uma coluna a redimensiona. |
| `movableColumns` | `.movable_columns(..)` | `boolean` | `true` | Arrastar um título move a coluna dele. |
| `loading` | `.loading(..)` | `boolean` | `false` | A tabela está carregando: `onLoadMore` espera e `loadingView` é exibido. |
| `hasMore` | `.has_more(..)` | `boolean` | `false` | Há mais linhas a carregar. |
| `loadMoreThreshold` | `.load_more_threshold(..)` | `number` | `20` | A quantas linhas da última o evento `onLoadMore` é disparado. |
| `fontFamily` | `.font_family(..)` | `string` | herdada | A fonte das células. |
| `fontSize` | `.font_size(..)` | `number` | `14` | O tamanho da fonte das células, em pontos. |
| `scrollbar` | `.scrollbar(..)` | `boolean` | `true` | As barras de rolagem. |
| `verticalScrollbar`, `horizontalScrollbar` | `.vertical_scrollbar(..)`, `.horizontal_scrollbar(..)` | `boolean` | `scrollbar` | A barra de rolagem de um eixo (a horizontal é a barra dos desktops sob a tabela). |
| `bounces` | `.bounces(..)` | `boolean` | `true` | Se a rolagem "quica" nas extremidades, nas plataformas que fazem isso. |
| `renderCell` | `.render_cell(..)` | `(cell: DataTableCell) => JSX.Element` | | Desenha as células visíveis. |
| `renderHeaderCell` | `.render_header_cell(..)` | `(cell: DataTableHeaderCell) => JSX.Element` | | Desenha os títulos. |
| `empty` | `.empty(..)` | `JSX.Element` | | O que é exibido quando não há linhas. |
| `loadingView` | `.loading_view(..)` | `JSX.Element` | | O que é exibido sobre as linhas enquanto `loading`. |
| `classes` | `.classes(..)` | `DataTableClasses` | `{}` | Classes do Tailwind por parte. |
| `styles` | `.styles(..)` | `DataTableStyles` | `{}` | Estilos inline por parte, sobrepostos às classes. |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | | A caixa da tabela. |

<a id="events"></a>

## Eventos

| Evento | Rust | Descrição |
|---|---|---|
| `onSelectionChange` | `.on_selection_change(\|selection: &Option<DataTableSelection>\| ..)` | O usuário alterou a seleção: `{ selection }`, um `{ row?, column? }` ou `null`. |
| `onRowPress` | `.on_row_press(\|event: &DataTablePress\| ..)` | Uma linha ou célula foi tocada: `{ row, column?, clicks, shift, control, alt, platform }`. |
| `onDoublePress` | `.on_double_press(\|target: &DataTableTarget\| ..)` | Uma linha, célula ou título foi tocado duas vezes: `{ target }`, um `{ row?, column? }`. |
| `onContextMenu` | `.on_context_menu(\|event: &DataTableContextMenu\| ..)` | Um menu de contexto foi solicitado: `{ row?, column?, x, y }`, o ponto na view raiz. |
| `onSortChange` | `.on_sort_change(\|sort: &Option<DataTableSort>\| ..)` | Um botão de ordenação foi tocado: `{ sort }`, a próxima ordenação `{ key, direction }` ou `null`. |
| `onColumnResize` | `.on_column_resize(\|key: &SharedString, width: &Points\| ..)` | Uma coluna foi redimensionada (`{ key, width }`), a cada passo de um arraste e mais uma vez quando um ajuste a define. |
| `onColumnMove` | `.on_column_move(\|event: &DataTableColumnMove\| ..)` | Uma coluna foi movida: `{ key, from, to, order }`. |
| `onVisibleRowsChange` | `.on_visible_rows_change(\|range: &DataTableRange\| ..)` | As linhas visíveis mudaram: `{ range }`, um `{ start, end }`. Busque as linhas a partir daqui. |
| `onVisibleColumnsChange` | `.on_visible_columns_change(\|range: &DataTableRange\| ..)` | As colunas roláveis visíveis mudaram: `{ range }`. |
| `onLoadMore` | `.on_load_more(\|\| ..)` | As linhas visíveis chegaram a `loadMoreThreshold` da última enquanto `hasMore` e não `loading`. |

<a id="related"></a>

## Relacionados

- [Editor](./editor.md) e [DiffView](./diff-view.md): os outros componentes base com muitos dados.
- [Menu](./menu.md): o menu a abrir a partir de `onContextMenu`.
- [`nsh/base`](../modules/nsh-base.md): os outros componentes base.
