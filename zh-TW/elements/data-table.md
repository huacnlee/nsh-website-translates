---
title: "DataTable"
description: "DataTable 元件：由列與欄組成的表格，可在水平與垂直兩個方向捲動，支援任意數量的列與欄，並提供固定、可調整大小、可移動及可排序的欄，列、欄與儲存格的選取，由應用程式分頁提供的列資料，群組標籤，鍵盤導覽，以及由應用程式自行繪製的儲存格。"
group: base
demo: el-data-table
source_hash: 22c8d4a412976e77
---

# DataTable

`DataTable` 以類似試算表的方式顯示列與欄，可在任意數量的列與欄上雙向捲動。只會建立可見範圍內的儲存格，因此擁有一百萬列、一萬欄的表格，捲動起來與小型表格一樣流暢。列、欄或儲存格都可以透過指標與鍵盤選取；欄位具有固定寬度，可拖曳邊緣調整大小、拖曳標題移動、在其他欄位捲動時固定於左側，也可以排序。標題可以置於群組標籤之下，儲存格或標題也可以由應用程式自行繪製。

`DataTable` 提供版面配置、對齊、虛擬化與互動。應用程式透過 `classes` 與 `styles` 為各部位設定內距、顏色、邊框與選取回饋。Rust 以 `nsh_base::data_table()` 建立，TSX 則以 `nsh/base` 的 `<DataTable>` 建立。

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

表格會填滿應用程式提供的方塊（`flex-1`，一個高度），並在其內捲動：垂直捲動各列、水平捲動各欄，並附有捲軸（`scrollbar={false}` 可隱藏捲軸，`bounces={false}` 可在有回彈效果的平台上，停止捲動到邊界時的回彈）。

<a id="rows-and-columns"></a>

## 列與欄

`data` 是列的資料：可以是物件，其欄位由各欄的 `key` 指名；也可以是陣列，由各欄依位置索引。數字、布林值與字串會以文字顯示。Rust 一次提供列的一個欄位，每個欄位為單一型別：`DataTableRows::new(2).texts("symbol", ["AAPL", "MSFT"]).numbers("change", [1.2, -0.4])`。一個欄位（column）是一個 `DataTableColumn`：

| 屬性 | 說明 |
|---|---|
| `key` | 欄的身分，在所有欄中唯一：它是其儲存格所顯示的列欄位，也是事件與 ref 所使用的名稱。 |
| `title` | 標題的文字。預設為其 `key`。 |
| `width` | 寬度，以點為單位。預設 `120`。 |
| `minWidth`、`maxWidth` | 拖曳或自動調整所能達到的最小與最大寬度。預設為 `20` 與 `1200`。 |
| `fitPadding` | 為應用程式的內距、圖示或徽章預留的額外空間，在調整欄寬以符合內容時，會加到最寬的標題或儲存格文字上。 |
| `align` | `"start"`（預設）、`"center"` 或 `"end"`，用於數字。儲存格與標題皆適用。 |
| `sortable` | 其標題帶有排序按鈕，可請求排序（見[排序](#sorting)）。 |
| `fixed` | 其他欄位捲動時，它會固定在左側。固定欄位位於其他欄位之前，並依其順序排列。 |
| `resizable`、`movable` | 是否可拖曳其邊緣調整大小，以及是否可拖曳其標題移動。預設為表格的 `resizableColumns` 與 `movableColumns`。 |
| `selectable` | 是否參與選取。由按鈕或核取方塊組成的欄位應設定 `false`。預設 `true`。 |
| `cellClass` | 該欄儲存格的 class，接在 `cell` 部位的 class 之後：用於單一欄位的內距或對齊。 |
| `headerClass` | 該欄標題的 class，接在 `headerCell` 部位的 class 之後。 |
| `positiveClass` | 數值上升的儲存格之 class：數字大於零，或文字以 `+` 開頭。 |
| `negativeClass` | 數值下降的儲存格之 class：數字小於零，或文字以 `-` 開頭。 |

`rowHeight` 是內容列的高度（預設 `32`），`headerHeight` 是標題列的高度（預設為列高）。`rowHeader` 會在左側加入一欄列號，可用來選取列。`stripe` 會為奇數列套用 `rowOdd` 部位。

<a id="group-labels"></a>

### 群組標籤

`groups` 會在各欄上方放置標籤，由最低層開始。每一層是 `{ label, span }` 的清單，其跨距總和等於欄數，或等於下一層的項目數。

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

## 任意數量的列

表格依位置請求列，並由應用程式提供。`rowCount` 是列的總數，`data` 是應用程式目前持有的列，`dataStart` 是其中第一列的位置。在應用程式提供之前，`data` 以外的列都是空的。`onVisibleRowsChange` 會在每個捲動步驟回報可見的列 `{ range: { start, end } }`，適合在此擷取其周圍的分頁。

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

對於會在尾端持續增長的清單，請設定 `hasMore`：當可見的列與最後一列相距在 `loadMoreThreshold`（預設 `20`）之內時，`onLoadMore` 會針對每個列數觸發一次。當 `loading` 為 true 時，它會等待，並且 `loadingView` slot 會顯示在列之上。沒有任何列時，則顯示 `empty` slot。

當內容超過數百萬點之後，捲軸會涵蓋經過縮放的範圍，因此即使有一百萬列，仍可捲動到每一列。

<a id="selection"></a>

## 選取

如同 gpui-component，由三個開關決定按下時選取的對象：

| Prop | 按下時選取 | `selection` |
|---|---|---|
| `rowSelectable`（預設 `true`） | 一列：其任一儲存格或其列標頭 | `{ row }` |
| `columnSelectable`（預設 `true`） | 一欄：其標題 | `{ column }` |
| `cellSelectable`（預設 `false`） | 一個儲存格；列標頭（啟用此項時預設顯示）用於選取列 | `{ row, column }` |

使用 `cellSelectable` 且列標頭已隱藏（`rowHeader={false}`）時，再次按下已選取的儲存格會選取其所在的列。按住 Shift 或平台的 command 鍵按下時，只有在 `selectOnModifierPress`（預設 `true`）時才會選取列，因此自行維護多列選取的應用程式需要自行處理這些按下動作：`onRowPress` 會回報內容區的每次按下，包含其列、指標所在的欄、列內的點擊次數，以及按住的修飾鍵。若某欄的 `selectable` 為 `false`，則該欄與其儲存格都不會被選取。

資料中的列從 0 開始計數，而欄則以其在 `columns` 中的索引表示，不論使用者將它們移動成什麼順序。`onSelectionChange` 會回報使用者選取的內容（沒有選取時為 `null`）。`selection` prop 可由應用程式設定選取；若不設定，則由表格自行保存。`onDoublePress` 會回報連按兩次的列、儲存格或標題，`onContextMenu` 則回報次要按鍵或長按，並附上應用程式要開啟 [`Menu`](./menu.md) 的位置點。兩者都會指出指標下的儲存格（其 `row` 與 `column`）、列號（僅 `row`）或標題（僅 `column`）。在下一次按下之前，被請求選單的儲存格會套用 `cellActive` 部位；若儲存格不參與選取，則其所在的列會套用 `rowActive` 部位。

螢幕閱讀器會取得一個網格（由 `accessibilityLabel` 命名），包含欄標頭與儲存格，已選取的項目會被報讀為已選取。

<a id="keyboard"></a>

## 鍵盤

按下表格，或以 Tab 移至表格（macOS、網頁），表格即取得鍵盤焦點，直到再次按下其他位置、焦點移往他處，或 `blur()` 為止；`focus()` 則可由應用程式賦予焦點。表格是 Tab 的單一停駐點：在表格內，Tab 會移動選取，Escape 則交還鍵盤。

| 按鍵 | 作用 |
|---|---|
| 方向鍵 | 以列、欄或儲存格為單位移動選取，並捲動至可見處。 |
| Tab、Shift+Tab | 移至下一欄或上一欄。 |
| Page Up、Page Down | 以一頁的列數移動。 |
| Home、End | 移至第一個或最後一個。 |
| Escape | 清除選取，再交還鍵盤。 |
| 複製快捷鍵 | 將選取內容的文字放入剪貼簿（`copy()`）。 |

`loopSelection`（預設 `true`）會讓方向鍵在到達邊界時環繞。

<a id="sorting"></a>

## 排序

`sortable` 欄位的標題末端有一個排序按鈕，是一個小型 ghost 按鈕，欄位未排序時顏色較淡。按下後，會依「未排序、遞增、遞減、再回到未排序」的循環回報下一個排序（`{ key, direction }`），並附帶 `onSortChange({ sort })`（`null` 表示清除）。表格本身不會重新排列列：應用程式需自行排序資料，或向伺服器請求新順序的列，並設定 `sort`，讓標題顯示排序狀態。由於順序由應用程式掌控，即使有一百萬列從未由應用程式持有，排序的運作方式也完全相同。

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

## 調整與移動欄位

拖曳欄位的尾端邊緣，可在其 `minWidth` 與 `maxWidth` 範圍內調整大小，`onColumnResize({ key, width })` 會回報每一步。連按兩次邊緣，會將欄寬調整為符合其最寬的文字與標題。拖曳標題可移動欄位，並以一條線顯示放開後的位置；`onColumnMove` 會回報 `{ key, from, to, order }`，其中 `order` 是依顯示順序排列的所有欄之 `key`。固定欄位仍留在固定欄位之間。`resizableColumns` 與 `movableColumns` 可為整個表格關閉這兩項功能，而欄位自己的 `resizable` 與 `movable` 優先於它們。

<a id="live-data"></a>

## 即時資料

報價表格每秒會變動多次。應用程式會格式化可見的列及其周圍一段範圍的列（可由 `onVisibleRowsChange` 得知這些列），並以來自 `dataStart` 的 `data` 交給表格，因此更新的成本只取決於畫面上的內容，與列數無關。上升與下降的顏色取自欄位的 `positiveClass` 與 `negativeClass`，會以原生方式套用到數值大於或小於零（或文字以 `+` 或 `-` 開頭）的儲存格。

```tsx
const tone = { positiveClass: "text-green-600", negativeClass: "text-red-600" };
const columns: DataTableColumn[] = [
  { key: "symbol", title: "Symbol", fixed: true },
  { key: "price", title: "Price", align: "end", sortable: true },
  { key: "change", title: "Chg%", align: "end", ...tone },
];
```

列與欄是表格建立一次後持續沿用的 slot：捲動只是讓它們改顯示其他的列與欄，因此無論捲動多長，改變的都只有文字與位置。

<a id="drawing-cells-and-titles"></a>

## 繪製儲存格與標題

當某欄不只是文字時（例如徽章、按鈕），可用 `renderCell` 繪製應用程式自己的儲存格。它只會針對可見的儲存格呼叫，並帶有一個 `DataTableCell`：`row`、`column`、`key`、`text`（表格原本會顯示的內容）與 `selected`。應用程式以 `row` 查詢自己的資料。`renderHeaderCell` 會在標題的儲存格內繪製整個標題，並帶有一個 `DataTableHeaderCell`：`column`、`key`、`title`、`sort`（方向，或無）與 `selected`。

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

`fontFamily` 與 `fontSize`（預設 `14`）設定儲存格的字型，表格也會以此字型量測文字，以調整欄寬。

<a id="the-ref"></a>

## ref

`ref` 會提供一個 `DataTableRef`。若傳給方法的列、欄或欄鍵不存在於表格中，方法不會變更任何內容，並會記錄一則警告，指出方法名稱與該值；對於未知的鍵，`fitColumn` 會以 `TypeError` 拒絕。

| 方法 | 說明 |
|---|---|
| `scrollToRow(row, animated?)` | 將某一列捲動至可見處。 |
| `scrollToColumn(key, animated?)` | 將某一欄捲動至可見處。 |
| `selection()` | 目前選取的內容，沒有選取時為 `null`。 |
| `select(selection)` | 進行選取（`null`：無選取）並將其帶入可見範圍，不會觸發 `onSelectionChange`。 |
| `visibleRows()`、`visibleColumns()` | 可見的列與會捲動的欄，以 `{ start, end }` 表示（不含 `end`）。 |
| `columnWidths()` | 目前的寬度，依 `columns` 的順序排列。 |
| `setColumnWidth(key, width)` | 在限制範圍內設定某欄的寬度。 |
| `fitColumn(key)` | 依可見的列，以及其周圍最多一千列，將某欄設為其最寬文字與標題所需的寬度。會回傳該寬度。 |
| `dump(start?, end?)` | 所給列（預設為持有的全部列）與標題的文字，與顯示的一致：`{ headers, rows }`，用於匯出。 |
| `copy()` | 將選取內容的文字放入剪貼簿：一列的儲存格以 Tab 分隔，一欄的儲存格以換行分隔，單一儲存格則為其文字。 |
| `focus()`、`blur()` | 將鍵盤焦點交給表格，或從表格取回。 |
| `menuTarget()`、`clearMenuTarget()` | 上一次請求內容選單的位置（`{ row?, column? }`，由 `cellActive` / `rowActive` 標記），以及在應用程式的選單關閉時移除該標記。 |

<a id="styling-the-parts"></a>

## 設定各部位樣式

`class` 與 `style` 設定表格方塊的樣式。`classes` 依部位接受 Tailwind class，`styles` 依部位接受行內樣式；各部位提供表格的結構與對齊，其 class 提供外觀，而 `styles` 優先於 class。

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

| 部位 | 說明 |
|---|---|
| `root` | 表格的方塊：其邊框、圓角與背景 |
| `header` | 橫跨表格的標頭，包含群組標籤與標題的各列 |
| `groupCell` | 位於其所跨欄位上方的群組標籤 |
| `headerCell` | 每個欄的標題儲存格 |
| `headerContent` | 標籤與排序按鈕的版面配置列；在此設定兩者的間距 |
| `headerCellDragging` | 被拖曳的標題，接在 `headerCell` 之後 |
| `headerCellSorted` | 表格所依排序之欄的標題，接在 `headerCell` 之後 |
| `headerCellSelected` | 已選取欄的標題，接在 `headerCell` 之後 |
| `sortIndicator` | 可排序欄的排序按鈕 |
| `sortAscending`、`sortDescending` | 其兩個箭頭符號；`selected:` 套用於目前排序的方向 |
| `resizeHandle` | 位於欄位尾端邊緣、可拖曳調整大小的線 |
| `moveIndicator` | 被拖曳的欄位放開後將落下位置的線 |
| `row` | 每一個內容列 |
| `rowOdd` | 奇數列，接在 `row`（`stripe`）之後 |
| `rowHover` | 指標所在的列，接在 `row` 之後 |
| `rowSelected` | 已選取的列，接在 `row` 之後 |
| `rowActive` | 在儲存格不參與選取時，被請求內容選單的列，持續到下一次按下為止，接在 `row` 之後 |
| `cell` | 每一個內容儲存格 |
| `cellSelected` | 已選取的儲存格，接在 `cell` 之後 |
| `cellActive` | 被請求內容選單的儲存格，持續到下一次按下為止，接在 `cell` 之後 |
| `cellColumnSelected` | 已選取欄的儲存格，接在 `cell` 之後 |
| `rowHeader` | 列標頭儲存格，即列號 |
| `rowHeaderCorner` | 列標頭上方的角落 |
| `fixedEdge` | 位於固定欄位尾端邊緣的線，覆蓋在捲動至其下方的欄位之上 |
| `empty` | `empty` slot 的方塊 |
## Props

| Prop | Rust | 類型 | 預設值 | 說明 |
|---|---|---|---|---|
| `columns` | `.columns(..)` | `DataTableColumn[]` | `[]` | 欄位,由左至右排列。固定欄位在最前面。 |
| `data` | `.data(..)` | `Row[]` | `[]` | 資料列:以欄位 `key` 為鍵的物件,或依位置對應的陣列。 |
| `rowCount` | `.row_count(..)` | `number` | 已載入的列數 | 總共有多少列。 |
| `dataStart` | `.data_start(..)` | `number` | `0` | `data` 中第一列的列號。 |
| `rowClasses` | `.row_classes(..)` | `string[]` | `[]` | 依列在 `data` 中的位置指定各列的 class:每列自身的外觀,無需逐列呼叫 JS。 |
| `rowHeight` | `.row_height(..)` | `number` | `32` | 內容列的高度,單位為點。 |
| `headerHeight` | `.header_height(..)` | `number` | 列高 | 標題列的高度。 |
| `groups` | `.groups(..)` | `DataTableColumnGroup[][]` | `[]` | 欄位上方的標籤,由最低層級開始。 |
| `sort` | `.sort(..)` | `DataTableSort` | | 資料的排序依據,顯示於標題上。 |
| `rowSelectable` | `.row_selectable(..)` | `boolean` | `true` | 點按與按鍵會選取列。 |
| `columnSelectable` | `.column_selectable(..)` | `boolean` | `true` | 點按標題會選取其欄位,水平方向鍵可在欄位之間移動。 |
| `cellSelectable` | `.cell_selectable(..)` | `boolean` | `false` | 點按與按鍵會選取儲存格。 |
| `selectOnModifierPress` | `.select_on_modifier_press(..)` | `boolean` | `true` | 按住 Shift 或 command 鍵點按時會選取列。 |
| `selection` | `.selection(..)` | `DataTableSelection` | | 由應用程式設定時的選取內容。 |
| `loopSelection` | `.loop_selection(..)` | `boolean` | `true` | 方向鍵可在兩端循環。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 無 | 螢幕閱讀器對此表格的稱呼。 |
| `rowHeader` | `.row_header(..)` | `boolean` | 隨 `cellSelectable` 顯示 | 位於左側的列號欄。 |
| `stripe` | `.stripe(..)` | `boolean` | `false` | 奇數列套用 `rowOdd` 部分。 |
| `resizableColumns` | `.resizable_columns(..)` | `boolean` | `true` | 拖曳欄位邊緣可調整其寬度。 |
| `movableColumns` | `.movable_columns(..)` | `boolean` | `true` | 拖曳標題可移動其欄位。 |
| `loading` | `.loading(..)` | `boolean` | `false` | 表格正在載入:`onLoadMore` 等待,`loadingView` 顯示。 |
| `hasMore` | `.has_more(..)` | `boolean` | `false` | 還有更多列可載入。 |
| `loadMoreThreshold` | `.load_more_threshold(..)` | `number` | `20` | 距離最後一列還有多少列時觸發 `onLoadMore`。 |
| `fontFamily` | `.font_family(..)` | `string` | 繼承 | 儲存格的字型。 |
| `fontSize` | `.font_size(..)` | `number` | `14` | 儲存格的字型大小,單位為點。 |
| `scrollbar` | `.scrollbar(..)` | `boolean` | `true` | 捲軸。 |
| `verticalScrollbar`, `horizontalScrollbar` | `.vertical_scrollbar(..)`, `.horizontal_scrollbar(..)` | `boolean` | `scrollbar` | 單一軸的捲軸(水平捲軸是桌面平台上位於表格下方的捲軸)。 |
| `bounces` | `.bounces(..)` | `boolean` | `true` | 在平台支援的情況下,捲動到盡頭時是否產生回彈效果。 |
| `renderCell` | `.render_cell(..)` | `(cell: DataTableCell) => JSX.Element` | | 繪製可見範圍內的儲存格。 |
| `renderHeaderCell` | `.render_header_cell(..)` | `(cell: DataTableHeaderCell) => JSX.Element` | | 繪製標題。 |
| `empty` | `.empty(..)` | `JSX.Element` | | 沒有列時顯示的內容。 |
| `loadingView` | `.loading_view(..)` | `JSX.Element` | | `loading` 時顯示在列上方的內容。 |
| `classes` | `.classes(..)` | `DataTableClasses` | `{}` | 依部位指定的 Tailwind class。 |
| `styles` | `.styles(..)` | `DataTableStyles` | `{}` | 依部位指定的內嵌樣式,優先於 class。 |
| `class`, `style` | 樣式方法 | `string`, `StyleProp<ViewStyle>` | | 表格的外框。 |

<a id="events"></a>

## 事件

| 事件 | Rust | 說明 |
|---|---|---|
| `onSelectionChange` | `.on_selection_change(\|selection: &Option<DataTableSelection>\| ..)` | 使用者變更了選取內容:`{ selection }`,為 `{ row?, column? }` 或 `null`。 |
| `onRowPress` | `.on_row_press(\|event: &DataTablePress\| ..)` | 點按了列或儲存格:`{ row, column?, clicks, shift, control, alt, platform }`。 |
| `onDoublePress` | `.on_double_press(\|target: &DataTableTarget\| ..)` | 連按兩下了列、儲存格或標題:`{ target }`,為 `{ row?, column? }`。 |
| `onContextMenu` | `.on_context_menu(\|event: &DataTableContextMenu\| ..)` | 要求開啟右鍵選單:`{ row?, column?, x, y }`,為根視圖中的座標點。 |
| `onSortChange` | `.on_sort_change(\|sort: &Option<DataTableSort>\| ..)` | 按下了排序按鈕:`{ sort }`,下一個排序為 `{ key, direction }` 或 `null`。 |
| `onColumnResize` | `.on_column_resize(\|key: &SharedString, width: &Points\| ..)` | 欄位被調整了大小(`{ key, width }`),拖曳的每一步都會觸發,自動調整寬度設定欄寬時會再觸發一次。 |
| `onColumnMove` | `.on_column_move(\|event: &DataTableColumnMove\| ..)` | 欄位被移動:`{ key, from, to, order }`。 |
| `onVisibleRowsChange` | `.on_visible_rows_change(\|range: &DataTableRange\| ..)` | 可見的列變更了:`{ range }`,為 `{ start, end }`。請由此擷取資料列。 |
| `onVisibleColumnsChange` | `.on_visible_columns_change(\|range: &DataTableRange\| ..)` | 可見的捲動欄位變更了:`{ range }`。 |
| `onLoadMore` | `.on_load_more(\|\| ..)` | 在 `hasMore` 且非 `loading` 的情況下,可見的列進入了距離最後一列 `loadMoreThreshold` 的範圍內。 |

<a id="related"></a>

## 相關內容

- [Editor](./editor.md) 與 [DiffView](./diff-view.md):其他資料量大的基礎元件。
- [Menu](./menu.md):可從 `onContextMenu` 開啟的選單。
- [`nsh/base`](../modules/nsh-base.md):其他基礎元件。
