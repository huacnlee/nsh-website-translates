---
title: "DataTable"
description: "Die DataTable-Komponente: eine Tabelle aus Zeilen und Spalten, die in beide Richtungen über beliebig viele Zeilen und Spalten scrollt, mit fixierten, in der Größe veränderbaren, verschiebbaren und sortierbaren Spalten, Auswahl von Zeilen, Spalten und Zellen, Zeilen, die die App seitenweise bereitstellt, Gruppenbeschriftungen, Tastaturnavigation und Zellen, die die App selbst zeichnet."
group: base
demo: el-data-table
source_hash: 22c8d4a412976e77
---


# DataTable

`DataTable` zeigt Zeilen und Spalten wie eine Tabellenkalkulation und scrollt in beide Richtungen über beliebig viele davon. Nur die sichtbaren Zellen werden erzeugt, sodass eine Tabelle mit einer Million Zeilen und zehntausend Spalten genauso scrollt wie eine kleine. Zeilen, Spalten oder Zellen lassen sich per Zeiger und Tastatur auswählen. Spalten haben feste Breiten, ändern ihre Größe durch Ziehen an ihrem Rand, lassen sich durch Ziehen an ihrem Titel verschieben, bleiben links stehen, während die anderen scrollen, und sind sortierbar. Titel können unter Gruppenbeschriftungen stehen, und eine Zelle oder ein Titel kann von der App gezeichnet werden.

`DataTable` liefert Layout, Ausrichtung, Virtualisierung und Interaktion. Die App gibt den einzelnen Parts ihr Padding, ihre Farben, Rahmen und das Auswahl-Feedback über `classes` und `styles`. In Rust wird eine Tabelle mit `nsh_base::data_table()` erzeugt, in TSX mit `<DataTable>` aus `nsh/base`.

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

Die Tabelle füllt die Box, die die App ihr gibt (`flex-1`, eine Höhe), und scrollt darin: vertikal durch die Zeilen und seitwärts durch die Spalten, mit Scrollbalken (`scrollbar={false}` blendet sie aus, `bounces={false}` unterbindet das Nachfedern an den Enden, wo eine Plattform es kennt).

<a id="rows-and-columns"></a>

## Zeilen und Spalten

`data` sind die Zeilen: Objekte, deren Felder die `key`s der Spalten benennen, oder Arrays, die die Spalten über die Position indizieren. Zahlen, Booleans und Strings werden als Text angezeigt. Rust übergibt die Zeilen Feld für Feld, jedes mit einem einzigen Typ: `DataTableRows::new(2).texts("symbol", ["AAPL", "MSFT"]).numbers("change", [1.2, -0.4])`. Eine Spalte ist ein `DataTableColumn`:

| Feld | Beschreibung |
|---|---|
| `key` | Ihre Identität, eindeutig unter den Spalten: das Feld der Zeilen, das ihre Zellen anzeigen, und der Name, den Events und das Ref verwenden. |
| `title` | Der Text ihres Titels. Standard ist ihr `key`. |
| `width` | Ihre Breite in Punkten. Standard ist `120`. |
| `minWidth`, `maxWidth` | Die kleinste und die größte Breite, die ein Ziehen oder ein Anpassen ergibt. Standard sind `20` und `1200`. |
| `fitPadding` | Zusätzlicher Platz für Padding, Icons oder Badges der App, der beim Anpassen der Spalte zum breitesten Titel- oder Zellentext addiert wird. |
| `align` | `"start"` (Standard), `"center"` oder `"end"`, für Zahlen. Gilt für Zellen und Titel gleichermaßen. |
| `sortable` | Ihr Titel hat einen Sortierbutton, der eine Sortierung anfordert (siehe [Sortierung](#sorting)). |
| `fixed` | Sie bleibt links stehen, während die anderen Spalten darunter scrollen. Fixierte Spalten stehen vor den anderen, in ihrer Reihenfolge. |
| `resizable`, `movable` | Ob ein Ziehen an ihrem Rand ihre Größe ändert und ein Ziehen an ihrem Titel sie verschiebt. Standard sind `resizableColumns` und `movableColumns` der Tabelle. |
| `selectable` | Ob sie an der Auswahl teilnimmt. Eine Spalte mit Buttons oder Checkboxen setzt `false`. Standard ist `true`. |
| `cellClass` | Klassen der Zellen der Spalte, nach denen des Parts `cell`: Paddings oder Ausrichtung einer einzelnen Spalte. |
| `headerClass` | Klassen des Titels der Spalte, nach denen des Parts `headerCell`. |
| `positiveClass` | Klassen der Zellen der Spalte, die einen Anstieg enthalten: eine Zahl über null oder ein Text, der mit `+` beginnt. |
| `negativeClass` | Klassen der Zellen der Spalte, die einen Rückgang enthalten: eine Zahl unter null oder ein Text, der mit `-` beginnt. |

`rowHeight` ist die Höhe einer Körperzeile (Standard `32`) und `headerHeight` die Höhe einer Titelzeile (Standard ist die Zeilenhöhe). `rowHeader` fügt links eine Spalte mit Zeilennummern hinzu, die Zeilen auswählt. `stripe` gibt den ungeraden Zeilen den Part `rowOdd`.

<a id="group-labels"></a>

### Gruppenbeschriftungen

`groups` setzt Beschriftungen über die Spalten, die unterste Ebene zuerst. Jede Ebene ist eine Liste von `{ label, span }`, deren Spans sich zur Anzahl der Spalten oder zu der der darunterliegenden Ebene addieren.

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

## Beliebig viele Zeilen

Die Tabelle fragt Zeilen nach Position an, und die App liefert sie. `rowCount` ist die Gesamtzahl der Zeilen, `data` die Zeilen, die die App vorhält, und `dataStart` die Position der ersten davon. Zeilen außerhalb von `data` bleiben leer, bis die App sie liefert. `onVisibleRowsChange` meldet die sichtbaren Zeilen, `{ range: { start, end } }`, bei jedem Scrollschritt und ist der richtige Ort, um die Seite um sie herum abzurufen.

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

Für eine Liste, die an ihrem Ende wächst, setzen Sie `hasMore`: `onLoadMore` wird für jede Zeilenanzahl einmal ausgelöst, wenn die sichtbaren Zeilen bis auf `loadMoreThreshold` (Standard `20`) an die letzte herankommen. Solange `loading` true ist, wartet es, und der Slot `loadingView` wird über den Zeilen angezeigt. Der Slot `empty` wird angezeigt, wenn es keine Zeilen gibt.

Ab einigen Millionen Punkten Inhalt umfassen die Scrollbalken einen skalierten Bereich, sodass eine Million Zeilen weiterhin bis zu jeder Zeile scrollt.

<a id="selection"></a>

## Auswahl

Drei Schalter bestimmen, was ein Druck auswählt, wie in gpui-component:

| Prop | Ein Druck wählt aus | `selection` |
|---|---|---|
| `rowSelectable` (Standard `true`) | Eine Zeile: eine ihrer Zellen oder ihren Zeilenkopf | `{ row }` |
| `columnSelectable` (Standard `true`) | Eine Spalte: ihren Titel | `{ column }` |
| `cellSelectable` (Standard `false`) | Eine Zelle; der Zeilenkopf (dabei standardmäßig angezeigt) wählt Zeilen aus | `{ row, column }` |

Mit `cellSelectable` und ausgeblendetem Zeilenkopf (`rowHeader={false}`) wählt ein erneuter Druck auf die ausgewählte Zelle ihre Zeile aus. Ein Druck mit gehaltener Umschalttaste oder der Befehlstaste der Plattform wählt nur dann eine Zeile aus, solange `selectOnModifierPress` (Standard `true`) gilt. Eine App, die ihre eigene Mehrfachauswahl von Zeilen verwaltet, behandelt diese Drücke daher selbst: `onRowPress` meldet jeden Druck auf den Körper mit seiner Zeile, der Spalte unter dem Zeiger, den Klicks in einer Zeile und den gehaltenen Modifikatortasten. Eine Spalte, deren `selectable` `false` ist, wählt weder sich selbst noch ihre Zellen aus.

Zeilen werden in den Daten ab 0 gezählt, und eine Spalte ist ihr Index in `columns`, unabhängig davon, in welche Reihenfolge der Benutzer sie verschoben hat. `onSelectionChange` meldet, was der Benutzer ausgewählt hat (`null` für nichts). Die Prop `selection` setzt die Auswahl von der App aus; lassen Sie sie ungesetzt, verwaltet die Tabelle die Auswahl selbst. `onDoublePress` meldet eine Zeile, eine Zelle oder einen Titel, die zweimal gedrückt wurden, und `onContextMenu` einen sekundären oder langen Druck mit dem Punkt, an dem das [`Menu`](./menu.md) der App geöffnet werden soll. Beide benennen die Zelle unter dem Zeiger (ihre `row` und `column`), die Nummer einer Zeile (nur `row`) oder einen Titel (nur `column`). Bis zum nächsten Druck hat die Zelle, für die ein Menü angefordert wurde, den Part `cellActive`, oder ihre Zeile den Part `rowActive`, wo Zellen nicht ausgewählt werden.

Screenreader erhalten ein Grid (benannt durch `accessibilityLabel`) aus Spaltenköpfen und Zellen, wobei die ausgewählten als ausgewählt angesagt werden.

<a id="keyboard"></a>

## Tastatur

Wer die Tabelle drückt oder sie mit Tab erreicht (macOS, Web), gibt ihr die Tastatur, bis ein anderer Druck erfolgt, der Fokus woandershin wechselt oder `blur()`; `focus()` gibt sie ihr von der App aus. Die Tabelle ist ein einziger Tab-Stopp: In ihr bewegt Tab die Auswahl, und Escape gibt die Tastatur zurück.

| Tasten | Wirkung |
|---|---|
| Pfeiltasten | Bewegen die Auswahl um eine Zeile, eine Spalte oder eine Zelle und scrollen sie in den sichtbaren Bereich. |
| Tab, Shift+Tab | Wechseln zur nächsten bzw. zur vorherigen Spalte. |
| Page Up, Page Down | Bewegen um eine Seite von Zeilen. |
| Home, End | Wechseln zum ersten bzw. zum letzten Element. |
| Escape | Hebt die Auswahl auf und gibt dann die Tastatur zurück. |
| Tastenkürzel zum Kopieren | Legt den Text der Auswahl in die Zwischenablage (`copy()`). |

`loopSelection` (Standard `true`) lässt die Pfeiltasten über die Enden hinweg umlaufen.

<a id="sorting"></a>

## Sortierung

Eine `sortable`-Spalte hat am Ende ihres Titels einen Sortierbutton, einen kleinen Ghost-Button, der abgedunkelt ist, solange die Spalte unsortiert ist. Ein Druck darauf meldet die nächste Sortierung (`{ key, direction }`) im Zyklus unsortiert, aufsteigend, absteigend und wieder unsortiert, mit `onSortChange({ sort })` (`null` zum Löschen). Die Tabelle ordnet die Zeilen nicht um: Die App sortiert ihre Daten oder fordert von ihrem Server Zeilen in der neuen Reihenfolge an und setzt `sort`, damit der Titel sie anzeigt. Weil die App die Reihenfolge besitzt, funktioniert Sortieren bei einer Million Zeilen, die die App nie vorhält, genauso.

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

## Spalten in der Größe ändern und verschieben

Ein Ziehen am hinteren Rand einer Spalte ändert ihre Größe innerhalb von `minWidth` und `maxWidth`, und `onColumnResize({ key, width })` meldet jeden Schritt. Zweimaliges Drücken des Rands in Folge passt die Spalte an ihren breitesten Text und Titel an. Ein Ziehen an einem Titel verschiebt die Spalte, und eine Linie zeigt, wo sie abgelegt wird; `onColumnMove` meldet `{ key, from, to, order }`, wobei `order` die `key`s aller Spalten in der angezeigten Reihenfolge sind. Fixierte Spalten bleiben unter den fixierten. `resizableColumns` und `movableColumns` schalten beides für die Tabelle ab, und `resizable` und `movable` einer Spalte haben Vorrang davor.

<a id="live-data"></a>

## Live-Daten

Eine Kurstabelle ändert sich viele Male pro Sekunde. Die App formatiert die sichtbaren Zeilen und einen Puffer darum herum (sie kennt sie aus `onVisibleRowsChange`) und übergibt diese als `data` aus `dataStart`, sodass ein Update nur kostet, was auf dem Bildschirm ist, unabhängig von der Anzahl der Zeilen. Anstiege und Rückgänge beziehen ihre Farben aus `positiveClass` und `negativeClass` der Spalte, nativ angewendet auf die Zellen, deren Wert über oder unter null liegt (oder deren Text mit `+` oder `-` beginnt).

```tsx
const tone = { positiveClass: "text-green-600", negativeClass: "text-red-600" };
const columns: DataTableColumn[] = [
  { key: "symbol", title: "Symbol", fixed: true },
  { key: "price", title: "Price", align: "end", sortable: true },
  { key: "change", title: "Chg%", align: "end", ...tone },
];
```

Zeilen und Spalten sind Slots, die die Tabelle einmal erzeugt und behält: Beim Scrollen bekommen sie andere Zeilen und Spalten zur Anzeige, sodass ein Scrollvorgang, wie lang er auch sei, nur Texte und Positionen ändert.

<a id="drawing-cells-and-titles"></a>

## Zellen und Titel zeichnen

`renderCell` zeichnet die eigenen Zellen der App, wo eine Spalte nicht nur Text enthält (ein Badge, ein Button). Es wird nur für die sichtbaren Zellen aufgerufen, mit einem `DataTableCell`: `row`, `column`, `key`, `text` (was die Tabelle anzeigen würde) und `selected`. Die App schlägt ihre eigenen Daten über `row` nach. `renderHeaderCell` zeichnet einen Titel über seine ganze Zelle und erhält ein `DataTableHeaderCell`: `column`, `key`, `title`, `sort` (die Richtung oder keine) und `selected`.

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

`fontFamily` und `fontSize` (Standard `14`) legen die Schrift der Zellen fest, in der die Tabelle auch Texte ausmisst, um Spalten anzupassen.

<a id="the-ref"></a>

## Das Ref

`ref` liefert ein `DataTableRef`. Eine Methode, der eine Zeile, eine Spalte oder ein Spaltenschlüssel übergeben wird, den die Tabelle nicht hat, ändert nichts und protokolliert eine Warnung mit dem Namen der Methode und dem Wert; `fitColumn` wird bei einem unbekannten Schlüssel mit einem `TypeError` abgelehnt.

| Methode | Beschreibung |
|---|---|
| `scrollToRow(row, animated?)` | Scrollt eine Zeile in den sichtbaren Bereich. |
| `scrollToColumn(key, animated?)` | Scrollt eine Spalte in den sichtbaren Bereich. |
| `selection()` | Was ausgewählt ist, `null` für nichts. |
| `select(selection)` | Wählt aus (`null`: nichts) und bringt die Auswahl in den sichtbaren Bereich, ohne `onSelectionChange`. |
| `visibleRows()`, `visibleColumns()` | Die sichtbaren Zeilen und die sichtbaren scrollenden Spalten als `{ start, end }` (`end` ausgenommen). |
| `columnWidths()` | Die aktuellen Breiten, in der Reihenfolge von `columns`. |
| `setColumnWidth(key, width)` | Setzt die Breite einer Spalte innerhalb ihrer Grenzen. |
| `fitColumn(key)` | Setzt eine Spalte so breit, wie ihr breitester Text und ihr Titel es erfordern, unter den sichtbaren Zeilen und bis zu tausend weiteren darum herum. Gibt die Breite zurück. |
| `dump(start?, end?)` | Die Texte der übergebenen Zeilen (Standard: alle vorgehaltenen) und der Titel, wie angezeigt: `{ headers, rows }`, für den Export. |
| `copy()` | Legt den Text der Auswahl in die Zwischenablage: die Zellen einer Zeile mit Tabs dazwischen, die einer Spalte mit Zeilenumbrüchen, den Text einer Zelle. |
| `focus()`, `blur()` | Gibt die Tastatur an die Tabelle oder nimmt sie ihr. |
| `menuTarget()`, `clearMenuTarget()` | Wofür zuletzt ein Kontextmenü angefordert wurde (`{ row?, column? }`, markiert durch `cellActive` / `rowActive`), und das Entfernen dieser Markierung, wenn das Menü der App schließt. |

<a id="styling-the-parts"></a>

## Die Parts gestalten

`class` und `style` gestalten die Box der Tabelle. `classes` nimmt Tailwind-Klassen pro Part und `styles` Inline-Styles pro Part; Parts liefern die Struktur und Ausrichtung der Tabelle, ihre Klassen liefern das Erscheinungsbild, und `styles` haben Vorrang vor Klassen.

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

| Part | Was es ist |
|---|---|
| `root` | Die Box der Tabelle: ihr Rahmen, ihr Radius und ihr Hintergrund |
| `header` | Der Header über die ganze Tabelle, mit seinen Zeilen aus Gruppenbeschriftungen und Titeln |
| `groupCell` | Eine Gruppenbeschriftung über den Spalten, die sie umfasst |
| `headerCell` | Die Titelzelle jeder Spalte |
| `headerContent` | Die Layout-Zeile aus Beschriftung und Sortierbutton; legen Sie hier ihren Abstand fest |
| `headerCellDragging` | Der gezogene Titel, nach `headerCell` |
| `headerCellSorted` | Der Titel der Spalte, nach der die Tabelle sortiert ist, nach `headerCell` |
| `headerCellSelected` | Der Titel der ausgewählten Spalte, nach `headerCell` |
| `sortIndicator` | Der Sortierbutton einer sortierbaren Spalte |
| `sortAscending`, `sortDescending` | Seine beiden Chevrons; `selected:` gilt für die sortierte Richtung |
| `resizeHandle` | Die Linie am hinteren Rand einer Spalte, die per Ziehen die Größe ändert |
| `moveIndicator` | Die Linie, an der eine gezogene Spalte abgelegt wird |
| `row` | Jede Körperzeile |
| `rowOdd` | Die ungeraden Zeilen, nach `row` (`stripe`) |
| `rowHover` | Die Zeile, über der sich der Zeiger befindet, nach `row` |
| `rowSelected` | Die ausgewählte Zeile, nach `row` |
| `rowActive` | Die Zeile, für die ein Kontextmenü angefordert wurde, wo Zellen nicht ausgewählt werden, bis zum nächsten Druck, nach `row` |
| `cell` | Jede Körperzelle |
| `cellSelected` | Die ausgewählte Zelle, nach `cell` |
| `cellActive` | Die Zelle, für die ein Kontextmenü angefordert wurde, bis zum nächsten Druck, nach `cell` |
| `cellColumnSelected` | Die Zellen der ausgewählten Spalte, nach `cell` |
| `rowHeader` | Die Zeilenkopfzellen, die Zeilennummern |
| `rowHeaderCorner` | Die Ecke über den Zeilenköpfen |
| `fixedEdge` | Die Linie am hinteren Rand der fixierten Spalten, über den Spalten, die darunter scrollen |
| `empty` | Die Box des Slots `empty` |
## Props

| Prop | Rust | Typ | Standard | Beschreibung |
|---|---|---|---|---|
| `columns` | `.columns(..)` | `DataTableColumn[]` | `[]` | Die Spalten von links nach rechts. Fixierte Spalten stehen am Anfang. |
| `data` | `.data(..)` | `Row[]` | `[]` | Die Zeilen: Objekte nach Spalte `key` oder Arrays nach Position. |
| `rowCount` | `.row_count(..)` | `number` | die vorgehaltenen Zeilen | Wie viele Zeilen es insgesamt gibt. |
| `dataStart` | `.data_start(..)` | `number` | `0` | Der Zeilenindex der ersten Zeile von `data`. |
| `rowClasses` | `.row_classes(..)` | `string[]` | `[]` | Klassen für die angegebenen Zeilen, nach ihrer Position in `data`: das eigene Aussehen einer Zeile, ohne einen JS-Aufruf pro Zeile. |
| `rowHeight` | `.row_height(..)` | `number` | `32` | Die Höhe einer Körperzeile in Punkten. |
| `headerHeight` | `.header_height(..)` | `number` | die Zeilenhöhe | Die Höhe einer Titelzeile. |
| `groups` | `.groups(..)` | `DataTableColumnGroup[][]` | `[]` | Beschriftungen über den Spalten, beginnend mit der untersten Ebene. |
| `sort` | `.sort(..)` | `DataTableSort` | | Wonach die Daten sortiert sind, angezeigt im Titel. |
| `rowSelectable` | `.row_selectable(..)` | `boolean` | `true` | Klicks und Tasten wählen Zeilen aus. |
| `columnSelectable` | `.column_selectable(..)` | `boolean` | `true` | Ein Klick auf einen Titel wählt dessen Spalte aus, und die horizontalen Tasten wechseln zwischen den Spalten. |
| `cellSelectable` | `.cell_selectable(..)` | `boolean` | `false` | Klicks und Tasten wählen Zellen aus. |
| `selectOnModifierPress` | `.select_on_modifier_press(..)` | `boolean` | `true` | Ein Klick mit gedrückter Umschalt- oder Befehlstaste wählt eine Zeile aus. |
| `selection` | `.selection(..)` | `DataTableSelection` | | Was ausgewählt ist, wenn die App es setzt. |
| `loopSelection` | `.loop_selection(..)` | `boolean` | `true` | Die Pfeiltasten laufen über die Enden hinaus und springen zum anderen Ende. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | keiner | Wie Screenreader die Tabelle nennen. |
| `rowHeader` | `.row_header(..)` | `boolean` | angezeigt mit `cellSelectable` | Eine Spalte mit Zeilennummern am linken Rand. |
| `stripe` | `.stripe(..)` | `boolean` | `false` | Ungerade Zeilen erhalten den Teil `rowOdd`. |
| `resizableColumns` | `.resizable_columns(..)` | `boolean` | `true` | Ziehen am Rand einer Spalte ändert ihre Größe. |
| `movableColumns` | `.movable_columns(..)` | `boolean` | `true` | Ziehen eines Titels verschiebt seine Spalte. |
| `loading` | `.loading(..)` | `boolean` | `false` | Die Tabelle lädt: `onLoadMore` wartet und `loadingView` wird angezeigt. |
| `hasMore` | `.has_more(..)` | `boolean` | `false` | Es sind weitere Zeilen zu laden. |
| `loadMoreThreshold` | `.load_more_threshold(..)` | `number` | `20` | Wie viele Zeilen vor der letzten `onLoadMore` auslösen. |
| `fontFamily` | `.font_family(..)` | `string` | geerbt | Die Schriftart der Zellen. |
| `fontSize` | `.font_size(..)` | `number` | `14` | Die Schriftgröße der Zellen in Punkten. |
| `scrollbar` | `.scrollbar(..)` | `boolean` | `true` | Die Scrollleisten. |
| `verticalScrollbar`, `horizontalScrollbar` | `.vertical_scrollbar(..)`, `.horizontal_scrollbar(..)` | `boolean` | `scrollbar` | Die Scrollleiste einer Achse (die horizontale ist auf Desktop-Plattformen die Leiste unter der Tabelle). |
| `bounces` | `.bounces(..)` | `boolean` | `true` | Ob das Scrollen an den Enden federt, sofern die Plattform dies tut. |
| `renderCell` | `.render_cell(..)` | `(cell: DataTableCell) => JSX.Element` | | Zeichnet die sichtbaren Zellen. |
| `renderHeaderCell` | `.render_header_cell(..)` | `(cell: DataTableHeaderCell) => JSX.Element` | | Zeichnet die Titel. |
| `empty` | `.empty(..)` | `JSX.Element` | | Was angezeigt wird, wenn es keine Zeilen gibt. |
| `loadingView` | `.loading_view(..)` | `JSX.Element` | | Was über den Zeilen angezeigt wird, solange `loading`. |
| `classes` | `.classes(..)` | `DataTableClasses` | `{}` | Tailwind-Klassen nach Teil. |
| `styles` | `.styles(..)` | `DataTableStyles` | `{}` | Inline-Stile nach Teil, die den Klassen vorgehen. |
| `class`, `style` | Style-Methoden | `string`, `StyleProp<ViewStyle>` | | Die Box der Tabelle. |

## Events

| Event | Rust | Beschreibung |
|---|---|---|
| `onSelectionChange` | `.on_selection_change(\|selection: &Option<DataTableSelection>\| ..)` | Der Benutzer hat die Auswahl geändert: `{ selection }`, ein `{ row?, column? }` oder `null`. |
| `onRowPress` | `.on_row_press(\|event: &DataTablePress\| ..)` | Auf eine Zeile oder Zelle wurde geklickt: `{ row, column?, clicks, shift, control, alt, platform }`. |
| `onDoublePress` | `.on_double_press(\|target: &DataTableTarget\| ..)` | Auf eine Zeile, Zelle oder einen Titel wurde doppelt geklickt: `{ target }`, ein `{ row?, column? }`. |
| `onContextMenu` | `.on_context_menu(\|event: &DataTableContextMenu\| ..)` | Ein Kontextmenü wurde angefordert: `{ row?, column?, x, y }`, der Punkt in der Root-View. |
| `onSortChange` | `.on_sort_change(\|sort: &Option<DataTableSort>\| ..)` | Auf eine Sortierschaltfläche wurde geklickt: `{ sort }`, die nächste Sortierung `{ key, direction }` oder `null`. |
| `onColumnResize` | `.on_column_resize(\|key: &SharedString, width: &Points\| ..)` | Die Größe einer Spalte wurde geändert (`{ key, width }`), bei jedem Schritt eines Ziehens und noch einmal, wenn eine Anpassung sie setzt. |
| `onColumnMove` | `.on_column_move(\|event: &DataTableColumnMove\| ..)` | Eine Spalte wurde verschoben: `{ key, from, to, order }`. |
| `onVisibleRowsChange` | `.on_visible_rows_change(\|range: &DataTableRange\| ..)` | Die sichtbaren Zeilen haben sich geändert: `{ range }`, ein `{ start, end }`. Hier sollten Zeilen abgerufen werden. |
| `onVisibleColumnsChange` | `.on_visible_columns_change(\|range: &DataTableRange\| ..)` | Die sichtbaren scrollenden Spalten haben sich geändert: `{ range }`. |
| `onLoadMore` | `.on_load_more(\|\| ..)` | Die sichtbaren Zeilen sind bis auf `loadMoreThreshold` an die letzte herangekommen, während `hasMore` und nicht `loading` gilt. |

<a id="related"></a>

## Verwandte Themen

- [Editor](./editor.md) und [DiffView](./diff-view.md): die anderen datenintensiven Basiskomponenten.
- [Menu](./menu.md): das Menü, das von `onContextMenu` aus geöffnet wird.
- [`nsh/base`](../modules/nsh-base.md): die anderen Basiskomponenten.
