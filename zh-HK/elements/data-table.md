---
title: "DataTable"
description: "DataTable 元件:由行與列組成的表格,可在水平及垂直方向捲動,支援任意數量的行與列,並提供固定、可調整大小、可移動及可排序的欄,以及列、欄和儲存格選取、由應用程式按頁提供的列、群組標籤、鍵盤導覽,以及由應用程式繪製的儲存格。"
group: base
demo: el-data-table
source_hash: 22c8d4a412976e77
---


# DataTable

`DataTable` 像試算表一樣顯示列與欄，可朝兩個方向捲動，列數與欄數不限。只有在視野內的儲存格才會建立，因此擁有一百萬列、一萬欄的表格，捲動起來與小型表格無異。可以用指標和鍵盤選取列、欄或儲存格；欄有固定寬度，可拖曳邊緣調整寬度，可拖曳標題移動位置，可固定在左側（其餘欄捲動），也可排序。標題可置於群組標籤之下，儲存格或標題亦可由應用程式自行繪製。

`DataTable` 提供版面配置、對齊、虛擬化和互動。應用程式透過 `classes` 和 `styles` 為各部件設定內距、顏色、邊框和選取回饋。Rust 以 `nsh_base::data_table()` 建立，TSX 則以 `<DataTable>` 從 `nsh/base` 建立。

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

表格會填滿應用程式給予的方框（`flex-1`、高度），並在內部捲動：垂直捲動列，橫向捲動欄，附有捲動條（`scrollbar={false}` 會隱藏捲動條，`bounces={false}` 在有回彈效果的平台上，讓捲動到盡頭時不再回彈）。

<a id="rows-and-columns"></a>

## 列與欄

`data` 是列資料：物件（其欄位由各欄的 `key` 指名），或由欄按位置索引的陣列。數字、布林值和字串以文字顯示。Rust 一次提供列的一個欄位，每個欄位屬同一類型：`DataTableRows::new(2).texts("symbol", ["AAPL", "MSFT"]).numbers("change", [1.2, -0.4])`。欄是一個 `DataTableColumn`：

| 欄位 | 說明 |
|---|---|
| `key` | 欄的身分，在各欄之中唯一：其儲存格所顯示的列欄位，亦是事件與 ref 所用的名稱。 |
| `title` | 標題的文字。預設為其 `key`。 |
| `width` | 寬度，以點為單位。預設為 `120`。 |
| `minWidth`、`maxWidth` | 拖曳或自動貼合時，欄可達到的最窄與最寬寬度。預設分別為 `20` 和 `1200`。 |
| `fitPadding` | 為應用程式的內距、圖示或徽章預留的額外空間，在貼合欄寬時加到最寬的標題或儲存格文字上。 |
| `align` | `"start"`（預設）、`"center"` 或 `"end"`，供數字使用。儲存格與標題皆適用。 |
| `sortable` | 其標題有排序按鈕，可要求排序（見[排序](#sorting)）。 |
| `fixed` | 固定在左側，其他欄在其下捲動。固定欄排在其他欄之前，並維持其原有次序。 |
| `resizable`、`movable` | 拖曳其邊緣是否可調整寬度，拖曳其標題是否可移動。預設為表格的 `resizableColumns` 和 `movableColumns`。 |
| `selectable` | 是否參與選取。按鈕或核取方塊欄會將其設為 `false`。預設為 `true`。 |
| `cellClass` | 該欄儲存格的 class，接在 `cell` 部件的 class 之後：用於單一欄的內距或對齊。 |
| `headerClass` | 該欄標題的 class，接在 `headerCell` 部件的 class 之後。 |
| `positiveClass` | 該欄中數值上升的儲存格的 class：數字大於零，或文字以 `+` 開頭。 |
| `negativeClass` | 該欄中數值下跌的儲存格的 class：數字小於零，或文字以 `-` 開頭。 |

`rowHeight` 是內容列的高度（預設 `32`），`headerHeight` 是標題列的高度（預設與列高相同）。`rowHeader` 會在左側加入列號欄，可用來選取列。`stripe` 讓奇數列套用 `rowOdd` 部件。

<a id="group-labels"></a>

### 群組標籤

`groups` 在欄的上方加入標籤，由最低層開始。每一層是 `{ label, span }` 的清單，其跨度總和等於欄數，或等於下一層的數目。

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

## 列數不限

表格按位置向應用程式要求列，由應用程式供應。`rowCount` 是列的總數，`data` 是應用程式持有的列，`dataStart` 是其中第一列的位置。`data` 以外的列在應用程式提供之前都是空的。`onVisibleRowsChange` 在每個捲動步驟報告視野內的列 `{ range: { start, end } }`，適合在此取得其周圍一頁的資料。

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

對於在尾端不斷增加的清單，請設定 `hasMore`：當視野內的列與最後一列相距在 `loadMoreThreshold`（預設 `20`）以內時，每個列數只會觸發一次 `onLoadMore`。當 `loading` 為 true 時會等待，而 `loadingView` slot 會顯示在列之上。沒有列時會顯示 `empty` slot。

內容超過數百萬點後，捲動條會涵蓋縮放後的範圍，因此一百萬列仍可捲動到每一列。

<a id="selection"></a>

## 選取

與 gpui-component 一樣，由三個開關決定按下時選取甚麼：

| 屬性 | 按下時選取 | `selection` |
|---|---|---|
| `rowSelectable`（預設 `true`） | 一列：其任何儲存格或列標頭 | `{ row }` |
| `columnSelectable`（預設 `true`） | 一欄：其標題 | `{ column }` |
| `cellSelectable`（預設 `false`） | 一個儲存格；列標頭（與此同時預設顯示）則選取列 | `{ row, column }` |

設定 `cellSelectable` 而列標頭隱藏（`rowHeader={false}`）時，再按一次已選取的儲存格，會選取其所在的列。按住 Shift 或平台的 command 鍵按下時，只有在 `selectOnModifierPress`（預設 `true`）時才會選取列，因此自行保存多列選取的應用程式要自行處理這些按下動作：`onRowPress` 會報告主體每一次按下的資料，包括其所在列、指標下的欄、列內的點擊次數和按住的修飾鍵。`selectable` 為 `false` 的欄，本身及其儲存格都不會被選取。

資料中的列由 0 起算，欄則以其在 `columns` 中的索引表示，無論使用者將它們移到甚麼次序。`onSelectionChange` 報告使用者選取了甚麼（沒有選取時為 `null`）。`selection` 屬性由應用程式設定選取；不設定的話，表格會自行保存。`onDoublePress` 報告被連按兩下的列、儲存格或標題，`onContextMenu` 則報告次要按下或長按，並附上應開啟應用程式的[`Menu`](./menu.md)的位置。兩者都會指出指標下的儲存格（其 `row` 與 `column`）、列號（只有 `row`）或標題（只有 `column`）。在下一次按下之前，被要求顯示選單的儲存格會套用 `cellActive` 部件；在儲存格不可選取的情況下，則由其所在列套用 `rowActive` 部件。

螢幕閱讀器會讀出一個網格（由 `accessibilityLabel` 命名），包含欄標頭與儲存格，已選取的會讀作已選取。

<a id="keyboard"></a>

## 鍵盤

按下表格，或以 Tab 移至表格（macOS、網頁），表格便取得鍵盤，直到再按其他地方、焦點移到別處或 `blur()` 為止；`focus()` 則由應用程式把鍵盤交給表格。表格是 Tab 的一個停駐點：在表格內 Tab 會移動選取，按 Escape 則交還鍵盤。

| 按鍵 | 作用 |
|---|---|
| 方向鍵 | 以一列、一欄或一個儲存格為單位移動選取，並捲動至可見位置。 |
| Tab、Shift+Tab | 移至下一欄或上一欄。 |
| Page Up、Page Down | 以一頁列為單位移動。 |
| Home、End | 移至第一個或最後一個。 |
| Escape | 清除選取，然後交還鍵盤。 |
| 複製快捷鍵 | 將選取內容的文字放到剪貼簿（`copy()`）。 |

`loopSelection`（預設 `true`）讓方向鍵在兩端循環移動。

<a id="sorting"></a>

## 排序

可 `sortable` 的欄在標題末端有排序按鈕，是一個小型 ghost 按鈕，欄未排序時會變暗。按下後會報告下一個排序（`{ key, direction }`），循環順序為未排序、升序、降序，再回到未排序，並附上 `onSortChange({ sort })`（`null` 表示清除）。表格不會重新排列列：由應用程式為其資料排序，或向伺服器要求新次序的列，並設定 `sort` 讓標題顯示出排序狀態。由於次序由應用程式掌握，即使有一百萬列從未由應用程式持有，排序的運作方式也完全相同。

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

## 調整與移動欄

拖曳欄的尾端邊緣，可在其 `minWidth` 與 `maxWidth` 之間調整寬度，`onColumnResize({ key, width })` 會報告每一步。連按兩下邊緣，會將欄貼合至其最寬的文字與標題。拖曳標題可移動欄，並以一條線顯示放下的位置；`onColumnMove` 報告 `{ key, from, to, order }`，`order` 是所有欄按顯示次序排列的 `key`。固定欄仍留在固定欄之中。`resizableColumns` 和 `movableColumns` 會為整個表格同時關閉這兩項功能，而欄本身的 `resizable` 和 `movable` 優先於它們。

<a id="live-data"></a>

## 即時資料

報價表每秒會變動多次。應用程式格式化視野內的列及其周圍一段範圍的列（可從 `onVisibleRowsChange` 得知），並以 `data` 從 `dataStart` 交出，因此更新的成本只取決於畫面上的內容，與列數無關。上升與下跌的顏色取自欄的 `positiveClass` 和 `negativeClass`，並以原生方式套用到數值大於或小於零（或文字以 `+` 或 `-` 開頭）的儲存格。

```tsx
const tone = { positiveClass: "text-green-600", negativeClass: "text-red-600" };
const columns: DataTableColumn[] = [
  { key: "symbol", title: "Symbol", fixed: true },
  { key: "price", title: "Price", align: "end", sortable: true },
  { key: "change", title: "Chg%", align: "end", ...tone },
];
```

列與欄是表格建立一次後便保留的槽位：捲動只是讓它們改為顯示其他列和欄，因此無論捲動多遠，變動的只有文字和位置。

<a id="drawing-cells-and-titles"></a>

## 繪製儲存格與標題

當欄不只是文字時（例如徽章、按鈕），`renderCell` 會繪製應用程式自己的儲存格。它只會為視野內的儲存格呼叫，並帶有一個 `DataTableCell`：`row`、`column`、`key`、`text`（表格原本會顯示的內容）和 `selected`。應用程式以 `row` 查找自己的資料。`renderHeaderCell` 會在標題的儲存格內繪製標題，並獲傳入一個 `DataTableHeaderCell`：`column`、`key`、`title`、`sort`（排序方向，或無）和 `selected`。

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

`fontFamily` 和 `fontSize`（預設 `14`）設定儲存格的字型，表格亦以此字型量度文字，用來貼合欄寬。

<a id="the-ref"></a>

## ref

`ref` 提供 `DataTableRef`。如果方法收到表格沒有的列、欄或欄 key，則不會改變任何東西，並記錄一則警告，指出該方法和該值；`fitColumn` 遇到未知的 key 會以 `TypeError` reject。

| 方法 | 說明 |
|---|---|
| `scrollToRow(row, animated?)` | 將某一列捲動至可見位置。 |
| `scrollToColumn(key, animated?)` | 將某一欄捲動至可見位置。 |
| `selection()` | 目前選取的內容，沒有選取時為 `null`。 |
| `select(selection)` | 選取（`null`：不選取）並將其帶入視野，不會觸發 `onSelectionChange`。 |
| `visibleRows()`、`visibleColumns()` | 視野內的列和會捲動的欄，以 `{ start, end }` 表示（不包括 `end`）。 |
| `columnWidths()` | 目前的寬度，按 `columns` 的次序。 |
| `setColumnWidth(key, width)` | 在限制範圍內設定某一欄的寬度。 |
| `fitColumn(key)` | 按視野內的列，以及其周圍最多一千列，將欄設為其最寬文字與標題所需的寬度，並傳回該寬度。 |
| `dump(start?, end?)` | 所指定列（預設為所有已持有的列）及標題的文字，與顯示所見一致：`{ headers, rows }`，用於匯出。 |
| `copy()` | 將選取內容的文字放到剪貼簿：一列的儲存格以 tab 分隔，一欄的儲存格以換行分隔，單一儲存格則為其文字。 |
| `focus()`、`blur()` | 將鍵盤交給表格或取回。 |
| `menuTarget()`、`clearMenuTarget()` | 上一次要求情境選單的位置（`{ row?, column? }`，由 `cellActive` / `rowActive` 標記），以及在應用程式的選單關閉時移除該標記。 |

<a id="styling-the-parts"></a>

## 為部件設定樣式

`class` 和 `style` 為表格的方框設定樣式。`classes` 按部件接受 Tailwind class，`styles` 按部件接受內嵌樣式；部件提供表格的結構與對齊，其 class 提供外觀，而 `styles` 優先於 class。

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

| 部件 | 說明 |
|---|---|
| `root` | 表格的方框：其邊框、圓角和背景 |
| `header` | 橫跨表格的標頭，包含群組標籤與標題的列 |
| `groupCell` | 位於其所跨欄之上的群組標籤 |
| `headerCell` | 每一欄的標題儲存格 |
| `headerContent` | 標籤與排序按鈕的版面列；在此設定兩者的間距 |
| `headerCellDragging` | 被拖曳的標題，接在 `headerCell` 之後 |
| `headerCellSorted` | 表格所依據排序的欄的標題，接在 `headerCell` 之後 |
| `headerCellSelected` | 已選取欄的標題，接在 `headerCell` 之後 |
| `sortIndicator` | 可排序欄的排序按鈕 |
| `sortAscending`、`sortDescending` | 其兩個箭頭；`selected:` 套用於已排序的方向 |
| `resizeHandle` | 位於欄尾端邊緣、可拖曳調整寬度的線 |
| `moveIndicator` | 顯示被拖曳的欄將放下位置的線 |
| `row` | 每一個內容列 |
| `rowOdd` | 奇數列，接在 `row`（`stripe`）之後 |
| `rowHover` | 指標所在的列，接在 `row` 之後 |
| `rowSelected` | 已選取的列，接在 `row` 之後 |
| `rowActive` | 在儲存格不可選取時，被要求顯示情境選單的列，直至下一次按下為止，接在 `row` 之後 |
| `cell` | 每一個內容儲存格 |
| `cellSelected` | 已選取的儲存格，接在 `cell` 之後 |
| `cellActive` | 被要求顯示情境選單的儲存格，直至下一次按下為止，接在 `cell` 之後 |
| `cellColumnSelected` | 已選取欄的儲存格，接在 `cell` 之後 |
| `rowHeader` | 列標頭儲存格，即列號 |
| `rowHeaderCorner` | 列標頭上方的角落 |
| `fixedEdge` | 位於固定欄尾端邊緣的線，覆蓋在其下捲動的欄之上 |
| `empty` | `empty` slot 的方框 |
<a id="props"></a>

## 屬性

| 屬性 | Rust | 類型 | 預設值 | 說明 |
|---|---|---|---|---|
| `columns` | `.columns(..)` | `DataTableColumn[]` | `[]` | 由左至右的欄。固定欄排在最前。 |
| `data` | `.data(..)` | `Row[]` | `[]` | 列資料：以欄的 `key` 為鍵的物件，或按位置排列的陣列。 |
| `rowCount` | `.row_count(..)` | `number` | 已載入的列數 | 列的總數。 |
| `dataStart` | `.data_start(..)` | `number` | `0` | `data` 中第一列所對應的列號。 |
| `rowClasses` | `.row_classes(..)` | `string[]` | `[]` | 按列在 `data` 中的位置指定各列的 class：每列自有的外觀，無需逐列呼叫 JS。 |
| `rowHeight` | `.row_height(..)` | `number` | `32` | 內容列的高度，以點為單位。 |
| `headerHeight` | `.header_height(..)` | `number` | 與列高相同 | 標題列的高度。 |
| `groups` | `.groups(..)` | `DataTableColumnGroup[][]` | `[]` | 欄上方的標籤，由最低層級開始。 |
| `sort` | `.sort(..)` | `DataTableSort` | | 資料的排序依據，顯示於標題上。 |
| `rowSelectable` | `.row_selectable(..)` | `boolean` | `true` | 按壓與按鍵會選取列。 |
| `columnSelectable` | `.column_selectable(..)` | `boolean` | `true` | 按壓標題會選取該欄，水平方向鍵可在欄之間移動。 |
| `cellSelectable` | `.cell_selectable(..)` | `boolean` | `false` | 按壓與按鍵會選取儲存格。 |
| `selectOnModifierPress` | `.select_on_modifier_press(..)` | `boolean` | `true` | 按住 Shift 或 command 鍵按壓會選取一列。 |
| `selection` | `.selection(..)` | `DataTableSelection` | | 已選取的內容（由應用程式設定時）。 |
| `loopSelection` | `.loop_selection(..)` | `boolean` | `true` | 方向鍵到達盡頭時會繞回另一端。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 無 | 螢幕閱讀器對此表格的稱呼。 |
| `rowHeader` | `.row_header(..)` | `boolean` | 隨 `cellSelectable` 顯示 | 左側的列號欄。 |
| `stripe` | `.stripe(..)` | `boolean` | `false` | 單數列會套用 `rowOdd` 部分。 |
| `resizableColumns` | `.resizable_columns(..)` | `boolean` | `true` | 拖曳欄的邊緣可調整其寬度。 |
| `movableColumns` | `.movable_columns(..)` | `boolean` | `true` | 拖曳標題可移動該欄。 |
| `loading` | `.loading(..)` | `boolean` | `false` | 表格正在載入：`onLoadMore` 等待，`loadingView` 顯示。 |
| `hasMore` | `.has_more(..)` | `boolean` | `false` | 還有更多列可載入。 |
| `loadMoreThreshold` | `.load_more_threshold(..)` | `number` | `20` | 距離最後一列多少列時會觸發 `onLoadMore`。 |
| `fontFamily` | `.font_family(..)` | `string` | 繼承 | 儲存格的字型。 |
| `fontSize` | `.font_size(..)` | `number` | `14` | 儲存格的字型大小，以點為單位。 |
| `scrollbar` | `.scrollbar(..)` | `boolean` | `true` | 捲軸。 |
| `verticalScrollbar`、`horizontalScrollbar` | `.vertical_scrollbar(..)`、`.horizontal_scrollbar(..)` | `boolean` | `scrollbar` | 單一軸向的捲軸（水平捲軸是桌面平台上位於表格下方的捲軸）。 |
| `bounces` | `.bounces(..)` | `boolean` | `true` | 捲動到盡頭時是否出現回彈效果（限平台支援的情況）。 |
| `renderCell` | `.render_cell(..)` | `(cell: DataTableCell) => JSX.Element` | | 繪製可見範圍內的儲存格。 |
| `renderHeaderCell` | `.render_header_cell(..)` | `(cell: DataTableHeaderCell) => JSX.Element` | | 繪製標題。 |
| `empty` | `.empty(..)` | `JSX.Element` | | 沒有列時顯示的內容。 |
| `loadingView` | `.loading_view(..)` | `JSX.Element` | | `loading` 時顯示於列上方的內容。 |
| `classes` | `.classes(..)` | `DataTableClasses` | `{}` | 按部分指定的 Tailwind class。 |
| `styles` | `.styles(..)` | `DataTableStyles` | `{}` | 按部分指定的內嵌樣式，優先於 class。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | | 表格的外框。 |

<a id="events"></a>

## 事件

| 事件 | Rust | 說明 |
|---|---|---|
| `onSelectionChange` | `.on_selection_change(\|selection: &Option<DataTableSelection>\| ..)` | 使用者更改了選取內容：`{ selection }`，為 `{ row?, column? }` 或 `null`。 |
| `onRowPress` | `.on_row_press(\|event: &DataTablePress\| ..)` | 按壓了列或儲存格：`{ row, column?, clicks, shift, control, alt, platform }`。 |
| `onDoublePress` | `.on_double_press(\|target: &DataTableTarget\| ..)` | 連按兩下列、儲存格或標題：`{ target }`，為 `{ row?, column? }`。 |
| `onContextMenu` | `.on_context_menu(\|event: &DataTableContextMenu\| ..)` | 要求開啟情境選單：`{ row?, column?, x, y }`，即根視圖中的點。 |
| `onSortChange` | `.on_sort_change(\|sort: &Option<DataTableSort>\| ..)` | 按下排序按鈕：`{ sort }`，下一個排序為 `{ key, direction }` 或 `null`。 |
| `onColumnResize` | `.on_column_resize(\|key: &SharedString, width: &Points\| ..)` | 欄已調整寬度（`{ key, width }`）：拖曳的每一步都會觸發，自動適配設定寬度時亦會再觸發一次。 |
| `onColumnMove` | `.on_column_move(\|event: &DataTableColumnMove\| ..)` | 欄已移動：`{ key, from, to, order }`。 |
| `onVisibleRowsChange` | `.on_visible_rows_change(\|range: &DataTableRange\| ..)` | 可見的列已改變：`{ range }`，為 `{ start, end }`。請由此處擷取列資料。 |
| `onVisibleColumnsChange` | `.on_visible_columns_change(\|range: &DataTableRange\| ..)` | 可見的捲動欄已改變：`{ range }`。 |
| `onLoadMore` | `.on_load_more(\|\| ..)` | 當 `hasMore` 而非 `loading` 時，可見的列已進入距最後一列 `loadMoreThreshold` 的範圍內。 |

<a id="related"></a>

## 相關內容

- [Editor](./editor.md) 與 [DiffView](./diff-view.md)：其他以大量資料為主的基礎元件。
- [Menu](./menu.md)：從 `onContextMenu` 開啟的選單。
- [`nsh/base`](../modules/nsh-base.md)：其他基礎元件。
