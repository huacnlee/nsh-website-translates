---
title: "DataTable"
description: "Il componente DataTable: una tabella di righe e colonne che scorre in entrambe le direzioni su un numero qualsiasi di entrambe, con colonne fisse, ridimensionabili, spostabili e ordinabili, selezione di righe, colonne e celle, righe che l'app fornisce una pagina alla volta, etichette di gruppo, navigazione da tastiera e celle disegnate dall'app."
group: base
demo: el-data-table
source_hash: 22c8d4a412976e77
---

# DataTable

`DataTable` mostra righe e colonne come un foglio di calcolo e scorre in entrambe le direzioni su un numero qualsiasi di esse. Solo le celle in vista vengono create, perciò una tabella di un milione di righe e diecimila colonne scorre come una piccola. Righe, colonne o celle si selezionano con il puntatore e con la tastiera; le colonne hanno larghezze fisse, si ridimensionano trascinandone il bordo, si spostano trascinandone il titolo, restano a sinistra mentre le altre scorrono e si ordinano. I titoli possono stare sotto etichette di gruppo, e una cella o un titolo può essere disegnato dall'app.

`DataTable` fornisce layout, allineamento, virtualizzazione e interazione. L'app dà alle sue parti padding, colori, bordi e feedback di selezione tramite `classes` e `styles`. Rust ne crea una con `nsh_base::data_table()`, TSX con `<DataTable>` da `nsh/base`.

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

La tabella riempie il riquadro che l'app le assegna (`flex-1`, un'altezza) e scorre al suo interno: in verticale tra le righe e in orizzontale tra le colonne, con barre di scorrimento (`scrollbar={false}` le nasconde, `bounces={false}` elimina il rimbalzo alle estremità dove una piattaforma lo prevede).

<a id="rows-and-columns"></a>

## Righe e colonne

`data` sono le righe: oggetti i cui campi sono indicati dai `key` delle colonne, oppure array che le colonne indicizzano per posizione. Numeri, booleani e stringhe vengono mostrati come testo. Rust fornisce le righe un campo alla volta, ciascuno di un solo tipo: `DataTableRows::new(2).texts("symbol", ["AAPL", "MSFT"]).numbers("change", [1.2, -0.4])`. Una colonna è un `DataTableColumn`:

| Campo | Descrizione |
|---|---|
| `key` | Chi è, univoco tra le colonne: il campo delle righe che le sue celle mostrano, e il nome usato dagli eventi e dal ref. |
| `title` | Il testo del suo titolo. Per default il suo `key`. |
| `width` | La sua larghezza, in punti. Per default `120`. |
| `minWidth`, `maxWidth` | La larghezza minima e massima che un trascinamento o un adattamento le dà. Per default `20` e `1200`. |
| `fitPadding` | Spazio extra per padding, icone o badge dell'app, aggiunto al testo più largo del titolo o delle celle quando si adatta la colonna. |
| `align` | `"start"` (il default), `"center"` o `"end"`, per i numeri. Vale sia per le celle sia per il titolo. |
| `sortable` | Il suo titolo ha un pulsante di ordinamento che richiede un ordinamento (vedi [Ordinamento](#sorting)). |
| `fixed` | Resta a sinistra mentre le altre colonne scorrono sotto di essa. Le colonne fisse precedono le altre, nel loro ordine. |
| `resizable`, `movable` | Indicano se trascinarne il bordo la ridimensiona e se trascinarne il titolo la sposta. Per default i valori `resizableColumns` e `movableColumns` della tabella. |
| `selectable` | Indica se partecipa alla selezione. Una colonna di pulsanti o checkbox imposta `false`. Per default `true`. |
| `cellClass` | Classi delle celle della colonna, dopo quelle della parte `cell`: padding o allineamento di una sola colonna. |
| `headerClass` | Classi del titolo della colonna, dopo quelle della parte `headerCell`. |
| `positiveClass` | Classi delle celle della colonna che contengono un rialzo: un numero maggiore di zero, o un testo che inizia con `+`. |
| `negativeClass` | Classi delle celle della colonna che contengono un ribasso: un numero minore di zero, o un testo che inizia con `-`. |

`rowHeight` è l'altezza di una riga del corpo (default `32`) e `headerHeight` l'altezza di una riga di titoli (default l'altezza della riga). `rowHeader` aggiunge a sinistra una colonna di numeri di riga, che seleziona le righe. `stripe` assegna alle righe dispari la parte `rowOdd`.

<a id="group-labels"></a>

### Etichette di gruppo

`groups` colloca etichette sopra le colonne, partendo dal livello più basso. Ogni livello è un elenco di `{ label, span }` le cui estensioni sommano al numero di colonne, o al numero di elementi del livello inferiore.

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

## Un numero qualsiasi di righe

La tabella richiede le righe per posizione e l'app le fornisce. `rowCount` è il numero totale di righe, `data` le righe che l'app possiede e `dataStart` la posizione della prima di esse. Le righe al di fuori di `data` restano vuote finché l'app non le fornisce. `onVisibleRowsChange` segnala le righe in vista, `{ range: { start, end } }`, a ogni passo di scorrimento, ed è il punto in cui recuperare la pagina che le circonda.

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

Per un elenco che cresce in coda, imposta `hasMore`: `onLoadMore` scatta una volta per ogni numero di righe quando le righe in vista arrivano entro `loadMoreThreshold` (default `20`) dall'ultima. Mentre `loading` è true attende, e lo slot `loadingView` viene mostrato sopra le righe. Lo slot `empty` viene mostrato quando non ci sono righe.

Oltre qualche milione di punti di contenuto le barre di scorrimento coprono un intervallo scalato, così un milione di righe scorre comunque fino a ciascuna riga.

<a id="selection"></a>

## Selezione

Tre interruttori decidono che cosa seleziona una pressione, come in gpui-component:

| Prop | Una pressione seleziona | `selection` |
|---|---|---|
| `rowSelectable` (default `true`) | Una riga: una qualsiasi delle sue celle, o la sua intestazione di riga | `{ row }` |
| `columnSelectable` (default `true`) | Una colonna: il suo titolo | `{ column }` |
| `cellSelectable` (default `false`) | Una cella; l'intestazione di riga (mostrata per default insieme a essa) seleziona le righe | `{ row, column }` |

Con `cellSelectable` e l'intestazione di riga nascosta (`rowHeader={false}`), premere di nuovo la cella selezionata ne seleziona la riga. Una pressione con Maiusc o con il tasto comando della piattaforma premuto seleziona una riga solo finché `selectOnModifierPress` (default `true`), perciò un'app che mantiene una propria selezione multipla di righe gestisce da sé quelle pressioni: `onRowPress` segnala ogni pressione sul corpo con la sua riga, la colonna sotto il puntatore, i clic in una riga e i tasti modificatori premuti. Una colonna il cui `selectable` è `false` non seleziona né se stessa né le proprie celle.

Le righe si contano da 0 nei dati, e una colonna è il suo indice tra `columns`, indipendentemente dall'ordine in cui l'utente le ha spostate. `onSelectionChange` segnala ciò che l'utente ha selezionato (`null` per nulla). La prop `selection` imposta la selezione dall'app; se non la imposti, la tabella la mantiene da sé. `onDoublePress` segnala una riga, una cella o un titolo premuti due volte, e `onContextMenu` una pressione secondaria o prolungata con il punto in cui aprire il [`Menu`](./menu.md) dell'app. Entrambi indicano la cella sotto il puntatore (il suo `row` e il suo `column`), il numero di una riga (solo `row`) o un titolo (solo `column`). Fino alla pressione successiva, la cella per cui è stato richiesto un menu ha la parte `cellActive`, oppure la sua riga ha la parte `rowActive` dove le celle non si selezionano.

Gli screen reader ricevono una griglia (nominata da `accessibilityLabel`) di intestazioni di colonna e celle, con quelle selezionate annunciate come tali.

<a id="keyboard"></a>

## Tastiera

Premere la tabella, o raggiungerla con Tab (macOS, web), le dà la tastiera fino a un'altra pressione, a un cambio di focus altrove o a `blur()`; `focus()` la assegna dall'app. La tabella è una sola tappa di Tab: al suo interno Tab sposta la selezione, ed Escape restituisce la tastiera.

| Tasti | Cosa fanno |
|---|---|
| Tasti freccia | Spostano la selezione di una riga, una colonna o una cella, facendola scorrere in vista. |
| Tab, Maiusc+Tab | Passano alla colonna successiva o precedente. |
| Pag su, Pag giù | Si spostano di una pagina di righe. |
| Home, Fine | Passano alla prima o all'ultima. |
| Escape | Cancella la selezione, poi restituisce la tastiera. |
| Scorciatoia di copia | Mette negli appunti il testo della selezione (`copy()`). |

`loopSelection` (default `true`) fa sì che i tasti freccia proseguano oltre le estremità.

<a id="sorting"></a>

## Ordinamento

Una colonna `sortable` ha un pulsante di ordinamento in fondo al titolo, un piccolo pulsante ghost attenuato finché la colonna non è ordinata. Premerlo segnala l'ordinamento successivo (`{ key, direction }`) nel ciclo non ordinato, crescente, decrescente e di nuovo non ordinato, con `onSortChange({ sort })` (`null` per annullare). La tabella non riordina le righe: l'app ordina i propri dati, o chiede al server le righe nel nuovo ordine, e imposta `sort` perché il titolo lo mostri. Poiché l'ordine appartiene all'app, l'ordinamento funziona allo stesso modo su un milione di righe che l'app non possiede mai per intero.

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

## Ridimensionare e spostare le colonne

Trascinare il bordo finale di una colonna la ridimensiona entro `minWidth` e `maxWidth`, e `onColumnResize({ key, width })` segnala ogni passo. Premere due volte di seguito il bordo adatta la colonna al suo testo e al suo titolo più larghi. Trascinare un titolo sposta la colonna, e una linea indica dove verrà rilasciata; `onColumnMove` segnala `{ key, from, to, order }`, dove `order` sono i `key` di tutte le colonne nell'ordine mostrato. Le colonne fisse restano tra quelle fisse. `resizableColumns` e `movableColumns` disattivano entrambi i comportamenti per la tabella, e `resizable` e `movable` di una colonna prevalgono su di essi.

<a id="live-data"></a>

## Dati in tempo reale

Una tabella di quotazioni cambia molte volte al secondo. L'app formatta le righe in vista e un margine attorno ad esse (le conosce da `onVisibleRowsChange`) e le passa come `data` da `dataStart`, così un aggiornamento costa quanto ciò che è sullo schermo, qualunque sia il numero di righe. Rialzi e ribassi prendono i colori da `positiveClass` e `negativeClass` della colonna, applicati in modo nativo alle celle il cui valore è sopra o sotto zero (o il cui testo inizia con `+` o `-`).

```tsx
const tone = { positiveClass: "text-green-600", negativeClass: "text-red-600" };
const columns: DataTableColumn[] = [
  { key: "symbol", title: "Symbol", fixed: true },
  { key: "price", title: "Price", align: "end", sortable: true },
  { key: "change", title: "Chg%", align: "end", ...tone },
];
```

Righe e colonne sono slot che la tabella crea una volta sola e conserva: lo scorrimento assegna loro altre righe e colonne da mostrare, perciò uno scorrimento, per quanto lungo, cambia solo testi e posizioni.

<a id="drawing-cells-and-titles"></a>

## Disegnare celle e titoli

`renderCell` disegna le celle proprie dell'app dove una colonna non è solo testo (un badge, un pulsante). Viene chiamato solo per le celle in vista, con un `DataTableCell`: `row`, `column`, `key`, `text` (ciò che la tabella mostrerebbe) e `selected`. L'app cerca i propri dati tramite `row`. `renderHeaderCell` disegna un titolo su tutta la sua cella, ricevendo un `DataTableHeaderCell`: `column`, `key`, `title`, `sort` (la direzione, oppure nessuna) e `selected`.

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

`fontFamily` e `fontSize` (default `14`) impostano il font delle celle, nel quale la tabella misura anche i testi per adattare le colonne.

<a id="the-ref"></a>

## Il ref

`ref` restituisce un `DataTableRef`. Un metodo che riceve una riga, una colonna o una chiave di colonna che la tabella non ha non cambia nulla e registra un avviso con il nome del metodo e il valore; `fitColumn` viene rifiutato con un `TypeError` per una chiave sconosciuta.

| Metodo | Descrizione |
|---|---|
| `scrollToRow(row, animated?)` | Fa scorrere una riga in vista. |
| `scrollToColumn(key, animated?)` | Fa scorrere una colonna in vista. |
| `selection()` | Ciò che è selezionato, `null` per nulla. |
| `select(selection)` | Seleziona (`null`: nulla) e porta in vista, senza `onSelectionChange`. |
| `visibleRows()`, `visibleColumns()` | Le righe e le colonne scorrevoli in vista, come `{ start, end }` (`end` escluse). |
| `columnWidths()` | Le larghezze attuali, nell'ordine di `columns`. |
| `setColumnWidth(key, width)` | Imposta la larghezza di una colonna, entro i suoi limiti. |
| `fitColumn(key)` | Imposta una colonna larga quanto richiedono il suo testo e il suo titolo più larghi, tra le righe in vista e fino a mille in più attorno ad esse. Restituisce la larghezza. |
| `dump(start?, end?)` | I testi delle righe indicate (default tutte quelle possedute) e dei titoli, come mostrati: `{ headers, rows }`, per l'esportazione. |
| `copy()` | Mette negli appunti il testo della selezione: le celle di una riga separate da tabulazioni, quelle di una colonna da interruzioni di riga, il testo di una cella. |
| `focus()`, `blur()` | Dà la tastiera alla tabella o la toglie. |
| `menuTarget()`, `clearMenuTarget()` | Ciò per cui è stato richiesto l'ultimo menu contestuale (`{ row?, column? }`, segnato da `cellActive` / `rowActive`), e la rimozione di quel segno quando il menu dell'app si chiude. |

<a id="styling-the-parts"></a>

## Stilizzare le parti

`class` e `style` stilizzano il riquadro della tabella. `classes` accetta classi Tailwind per parte e `styles` stili inline per parte; le parti forniscono la struttura e l'allineamento della tabella; le loro classi forniscono l'aspetto, e `styles` prevalgono sulle classi.

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

| Parte | Che cos'è |
|---|---|
| `root` | Il riquadro della tabella: bordo, raggio e sfondo |
| `header` | L'intestazione lungo la tabella, con le sue righe di etichette di gruppo e titoli |
| `groupCell` | Un'etichetta di gruppo sopra le colonne che comprende |
| `headerCell` | La cella del titolo di ogni colonna |
| `headerContent` | La riga di layout dell'etichetta e del pulsante di ordinamento; imposta qui la loro spaziatura |
| `headerCellDragging` | Il titolo trascinato, dopo `headerCell` |
| `headerCellSorted` | Il titolo della colonna per cui la tabella è ordinata, dopo `headerCell` |
| `headerCellSelected` | Il titolo della colonna selezionata, dopo `headerCell` |
| `sortIndicator` | Il pulsante di ordinamento di una colonna ordinabile |
| `sortAscending`, `sortDescending` | I suoi due chevron; `selected:` si applica alla direzione di ordinamento |
| `resizeHandle` | La linea sul bordo finale di una colonna che un trascinamento ridimensiona |
| `moveIndicator` | La linea dove verrà rilasciata una colonna trascinata |
| `row` | Ogni riga del corpo |
| `rowOdd` | Le righe dispari, dopo `row` (`stripe`) |
| `rowHover` | La riga sopra cui si trova il puntatore, dopo `row` |
| `rowSelected` | La riga selezionata, dopo `row` |
| `rowActive` | La riga per cui è stato richiesto un menu contestuale dove le celle non si selezionano, fino alla pressione successiva, dopo `row` |
| `cell` | Ogni cella del corpo |
| `cellSelected` | La cella selezionata, dopo `cell` |
| `cellActive` | La cella per cui è stato richiesto un menu contestuale, fino alla pressione successiva, dopo `cell` |
| `cellColumnSelected` | Le celle della colonna selezionata, dopo `cell` |
| `rowHeader` | Le celle di intestazione di riga, i numeri di riga |
| `rowHeaderCorner` | L'angolo sopra le intestazioni di riga |
| `fixedEdge` | La linea sul bordo finale delle colonne fisse, sopra le colonne che scorrono sotto di esse |
| `empty` | Il riquadro dello slot `empty` |
<a id="props"></a>

## Proprietà

| Prop | Rust | Tipo | Predefinito | Descrizione |
|---|---|---|---|---|
| `columns` | `.columns(..)` | `DataTableColumn[]` | `[]` | Le colonne, da sinistra a destra. Quelle fisse vengono per prime. |
| `data` | `.data(..)` | `Row[]` | `[]` | Le righe: oggetti indicizzati per colonna `key`, oppure array indicizzati per posizione. |
| `rowCount` | `.row_count(..)` | `number` | le righe contenute | Quante righe ci sono in totale. |
| `dataStart` | `.data_start(..)` | `number` | `0` | L'indice della riga corrispondente alla prima riga di `data`. |
| `rowClasses` | `.row_classes(..)` | `string[]` | `[]` | Classi delle righe indicate, in base alla loro posizione in `data`: l'aspetto proprio di una riga, senza chiamate a JS per ogni riga. |
| `rowHeight` | `.row_height(..)` | `number` | `32` | L'altezza di una riga del corpo, in punti. |
| `headerHeight` | `.header_height(..)` | `number` | l'altezza della riga | L'altezza di una riga del titolo. |
| `groups` | `.groups(..)` | `DataTableColumnGroup[][]` | `[]` | Etichette sopra le colonne, a partire dal livello più basso. |
| `sort` | `.sort(..)` | `DataTableSort` | | Il criterio di ordinamento dei dati, mostrato nel titolo. |
| `rowSelectable` | `.row_selectable(..)` | `boolean` | `true` | Pressioni e tasti selezionano le righe. |
| `columnSelectable` | `.column_selectable(..)` | `boolean` | `true` | La pressione su un titolo ne seleziona la colonna, e i tasti orizzontali spostano tra le colonne. |
| `cellSelectable` | `.cell_selectable(..)` | `boolean` | `false` | Pressioni e tasti selezionano le celle. |
| `selectOnModifierPress` | `.select_on_modifier_press(..)` | `boolean` | `true` | Una pressione con Maiusc o il tasto Comando premuto seleziona una riga. |
| `selection` | `.selection(..)` | `DataTableSelection` | | Ciò che è selezionato, quando è l'app a impostarlo. |
| `loopSelection` | `.loop_selection(..)` | `boolean` | `true` | I tasti freccia proseguono oltre le estremità. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | nessuno | Il nome con cui gli screen reader identificano la tabella. |
| `rowHeader` | `.row_header(..)` | `boolean` | mostrato con `cellSelectable` | Una colonna di numeri di riga a sinistra. |
| `stripe` | `.stripe(..)` | `boolean` | `false` | Le righe dispari ricevono la parte `rowOdd`. |
| `resizableColumns` | `.resizable_columns(..)` | `boolean` | `true` | Il trascinamento del bordo di una colonna la ridimensiona. |
| `movableColumns` | `.movable_columns(..)` | `boolean` | `true` | Il trascinamento di un titolo sposta la sua colonna. |
| `loading` | `.loading(..)` | `boolean` | `false` | La tabella è in caricamento: `onLoadMore` attende e `loadingView` viene mostrato. |
| `hasMore` | `.has_more(..)` | `boolean` | `false` | Ci sono altre righe da caricare. |
| `loadMoreThreshold` | `.load_more_threshold(..)` | `number` | `20` | A quante righe dall'ultima scatta `onLoadMore`. |
| `fontFamily` | `.font_family(..)` | `string` | ereditato | Il font delle celle. |
| `fontSize` | `.font_size(..)` | `number` | `14` | La dimensione del font delle celle, in punti. |
| `scrollbar` | `.scrollbar(..)` | `boolean` | `true` | Le barre di scorrimento. |
| `verticalScrollbar`, `horizontalScrollbar` | `.vertical_scrollbar(..)`, `.horizontal_scrollbar(..)` | `boolean` | `scrollbar` | La barra di scorrimento di un asse (quella orizzontale è la barra dei desktop sotto la tabella). |
| `bounces` | `.bounces(..)` | `boolean` | `true` | Se lo scorrimento rimbalza alle estremità, dove la piattaforma lo prevede. |
| `renderCell` | `.render_cell(..)` | `(cell: DataTableCell) => JSX.Element` | | Disegna le celle visibili. |
| `renderHeaderCell` | `.render_header_cell(..)` | `(cell: DataTableHeaderCell) => JSX.Element` | | Disegna i titoli. |
| `empty` | `.empty(..)` | `JSX.Element` | | Ciò che viene mostrato quando non ci sono righe. |
| `loadingView` | `.loading_view(..)` | `JSX.Element` | | Ciò che viene mostrato sopra le righe mentre `loading`. |
| `classes` | `.classes(..)` | `DataTableClasses` | `{}` | Classi Tailwind per parte. |
| `styles` | `.styles(..)` | `DataTableStyles` | `{}` | Stili inline per parte, sopra le classi. |
| `class`, `style` | metodi di stile | `string`, `StyleProp<ViewStyle>` | | Il box della tabella. |

<a id="events"></a>

## Eventi

| Evento | Rust | Descrizione |
|---|---|---|
| `onSelectionChange` | `.on_selection_change(\|selection: &Option<DataTableSelection>\| ..)` | L'utente ha cambiato la selezione: `{ selection }`, un `{ row?, column? }` o `null`. |
| `onRowPress` | `.on_row_press(\|event: &DataTablePress\| ..)` | Una riga o una cella è stata premuta: `{ row, column?, clicks, shift, control, alt, platform }`. |
| `onDoublePress` | `.on_double_press(\|target: &DataTableTarget\| ..)` | Una riga, una cella o un titolo è stato premuto due volte: `{ target }`, un `{ row?, column? }`. |
| `onContextMenu` | `.on_context_menu(\|event: &DataTableContextMenu\| ..)` | È stato richiesto un menu contestuale: `{ row?, column?, x, y }`, il punto nella vista radice. |
| `onSortChange` | `.on_sort_change(\|sort: &Option<DataTableSort>\| ..)` | È stato premuto un pulsante di ordinamento: `{ sort }`, il successivo ordinamento `{ key, direction }` o `null`. |
| `onColumnResize` | `.on_column_resize(\|key: &SharedString, width: &Points\| ..)` | Una colonna è stata ridimensionata (`{ key, width }`), a ogni passo di un trascinamento e ancora una volta quando un adattamento la imposta. |
| `onColumnMove` | `.on_column_move(\|event: &DataTableColumnMove\| ..)` | Una colonna è stata spostata: `{ key, from, to, order }`. |
| `onVisibleRowsChange` | `.on_visible_rows_change(\|range: &DataTableRange\| ..)` | Le righe visibili sono cambiate: `{ range }`, un `{ start, end }`. Recupera le righe da qui. |
| `onVisibleColumnsChange` | `.on_visible_columns_change(\|range: &DataTableRange\| ..)` | Le colonne scorrevoli visibili sono cambiate: `{ range }`. |
| `onLoadMore` | `.on_load_more(\|\| ..)` | Le righe visibili sono arrivate entro `loadMoreThreshold` dall'ultima mentre `hasMore` e non `loading`. |

<a id="related"></a>

## Correlati

- [Editor](./editor.md) e [DiffView](./diff-view.md): gli altri componenti di base ad alta intensità di dati.
- [Menu](./menu.md): il menu da aprire a partire da `onContextMenu`.
- [`nsh/base`](../modules/nsh-base.md): gli altri componenti di base.
