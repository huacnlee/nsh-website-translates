---
title: "DataTable"
description: "DataTable 컴포넌트: 행과 열로 이루어진 테이블로, 행과 열의 개수에 제한 없이 가로와 세로 양방향으로 스크롤할 수 있습니다. 고정, 크기 조절, 이동, 정렬이 가능한 열, 행·열·셀 선택, 앱이 한 번에 한 페이지씩 제공하는 행, 그룹 레이블, 키보드 탐색, 앱이 직접 그리는 셀을 지원합니다."
group: base
demo: el-data-table
source_hash: 22c8d4a412976e77
---

# DataTable

`DataTable`는 스프레드시트처럼 행과 열을 보여 주며, 행과 열이 아무리 많아도 가로와 세로로 스크롤됩니다. 보이는 셀만 만들어지므로 100만 행과 1만 열의 테이블도 작은 테이블처럼 스크롤됩니다. 행, 열, 셀은 포인터와 키보드로 선택할 수 있습니다. 열은 고정 너비를 가지며, 가장자리를 드래그해 크기를 조정하고, 제목을 드래그해 이동하며, 다른 열이 스크롤되는 동안 왼쪽에 고정할 수 있고, 정렬할 수 있습니다. 제목은 그룹 레이블 아래에 둘 수 있으며, 셀과 제목은 앱이 직접 그릴 수 있습니다.

`DataTable`는 레이아웃, 정렬, 가상화, 상호작용을 제공합니다. 앱은 `classes`와 `styles`을 통해 각 파트에 패딩, 색상, 테두리, 선택 피드백을 지정합니다. Rust에서는 `nsh_base::data_table()`로, TSX에서는 `nsh/base`의 `<DataTable>`로 만듭니다.

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

테이블은 앱이 지정한 박스(`flex-1`, 높이)를 채우고 그 안에서 스크롤됩니다. 행은 세로로, 열은 가로로 스크롤되며 스크롤 막대가 표시됩니다(`scrollbar={false}`은 막대를 숨기고, `bounces={false}`은 끝에서 바운스가 있는 플랫폼에서 그 바운스를 막습니다).

<a id="rows-and-columns"></a>

## 행과 열

`data`은 행입니다. 열의 `key`가 필드 이름으로 가리키는 객체이거나, 열이 위치로 인덱싱하는 배열입니다. 숫자, 불리언, 문자열은 텍스트로 표시됩니다. Rust는 행을 필드 단위로, 필드마다 하나의 타입으로 받습니다: `DataTableRows::new(2).texts("symbol", ["AAPL", "MSFT"]).numbers("change", [1.2, -0.4])`. 열은 `DataTableColumn`입니다:

| 필드 | 설명 |
|---|---|
| `key` | 열의 식별자로, 열 사이에서 고유합니다. 셀이 표시하는 행의 필드이며, 이벤트와 ref에서 쓰는 이름입니다. |
| `title` | 제목의 텍스트. 기본값은 `key`. |
| `width` | 너비(포인트 단위). 기본값 `120`. |
| `minWidth`, `maxWidth` | 드래그나 맞춤으로 만들 수 있는 가장 좁은 너비와 가장 넓은 너비. 기본값은 각각 `20`와 `1200`. |
| `fitPadding` | 열을 맞출 때 가장 넓은 제목 또는 셀 텍스트에 더해지는, 앱의 패딩, 아이콘, 배지를 위한 추가 공간. |
| `align` | `"start"`(기본값), `"center"`, `"end"`. 숫자용이며 셀과 제목 모두에 적용됩니다. |
| `sortable` | 제목에 정렬을 요청하는 정렬 버튼이 있습니다([정렬](#sorting) 참고). |
| `fixed` | 다른 열이 아래로 스크롤되는 동안 왼쪽에 고정됩니다. 고정 열은 다른 열보다 앞에 오며, 고정 열끼리는 원래 순서를 유지합니다. |
| `resizable`, `movable` | 가장자리 드래그로 크기를 조정할 수 있는지, 제목 드래그로 이동할 수 있는지 여부. 기본값은 테이블의 `resizableColumns`과 `movableColumns`. |
| `selectable` | 선택에 참여하는지 여부. 버튼이나 체크박스로 된 열은 `false`로 설정합니다. 기본값 `true`. |
| `cellClass` | 열 셀의 클래스로, `cell` 파트의 클래스 뒤에 적용됩니다. 한 열의 패딩이나 정렬에 씁니다. |
| `headerClass` | 열 제목의 클래스로, `headerCell` 파트의 클래스 뒤에 적용됩니다. |
| `positiveClass` | 상승 값을 가진 열 셀의 클래스: 0보다 큰 숫자, 또는 `+`로 시작하는 텍스트. |
| `negativeClass` | 하락 값을 가진 열 셀의 클래스: 0보다 작은 숫자, 또는 `-`로 시작하는 텍스트. |

`rowHeight`은 본문 행의 높이(기본값 `32`)이고, `headerHeight`는 제목 행의 높이(기본값은 행 높이)입니다. `rowHeader`은 왼쪽에 행 번호 열을 추가하며, 이 열로 행을 선택할 수 있습니다. `stripe`은 홀수 행에 `rowOdd` 파트를 적용합니다.

<a id="group-labels"></a>

### 그룹 레이블

`groups`은 열 위에 레이블을 둡니다. 가장 낮은 레벨이 먼저 옵니다. 각 레벨은 `{ label, span }`의 목록이며, span의 합은 열의 수 또는 아래 레벨의 항목 수와 같아야 합니다.

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

## 임의 개수의 행

테이블은 행을 위치로 요청하고, 앱이 이를 제공합니다. `rowCount`은 전체 행 수, `data`는 앱이 가지고 있는 행, `dataStart`은 그 첫 행의 위치입니다. `data` 밖의 행은 앱이 제공할 때까지 비어 있습니다. `onVisibleRowsChange`는 보이는 행 `{ range: { start, end } }`을 스크롤 단계마다 보고하므로, 그 주변 페이지를 가져오기에 적합한 지점입니다.

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

끝에서 늘어나는 목록에는 `hasMore`을 설정합니다. 보이는 행이 마지막 행에서 `loadMoreThreshold`(기본값 `20`) 이내로 들어오면 `onLoadMore`이 행 수마다 한 번씩 발생합니다. `loading`이 true인 동안에는 대기하며, `loadingView` 슬롯이 행 위에 표시됩니다. 행이 없으면 `empty` 슬롯이 표시됩니다.

콘텐츠가 수백만 포인트를 넘으면 스크롤 막대가 비율 조정된 범위를 사용하므로, 100만 행도 모든 행까지 스크롤할 수 있습니다.

<a id="selection"></a>

## 선택

gpui-component와 같이, 세 가지 스위치가 누를 때 무엇이 선택되는지 결정합니다:

| 속성 | 누르면 선택되는 것 | `selection` |
|---|---|---|
| `rowSelectable` (기본값 `true`) | 행: 그 셀 어디든, 또는 행 헤더 | `{ row }` |
| `columnSelectable` (기본값 `true`) | 열: 그 제목 | `{ column }` |
| `cellSelectable` (기본값 `false`) | 셀. 행 헤더(이 경우 기본으로 표시됨)는 행을 선택 | `{ row, column }` |

`cellSelectable`를 쓰고 행 헤더를 숨긴 경우(`rowHeader={false}`), 선택된 셀을 다시 누르면 그 행이 선택됩니다. Shift 또는 플랫폼의 command 키를 누른 채 누르는 동작은 `selectOnModifierPress`(기본값 `true`)인 동안에만 행을 선택하므로, 자체 다중 행 선택을 관리하는 앱은 그런 누름을 직접 처리합니다. `onRowPress`은 본문의 모든 누름을 해당 행, 포인터 아래의 열, 행에서의 클릭 횟수, 눌린 수정자 키와 함께 보고합니다. `selectable`가 `false`인 열은 자신도 셀도 선택하지 않습니다.

행은 데이터에서 0부터 세고, 열은 사용자가 어떤 순서로 옮겼든 `columns`에서의 인덱스로 나타냅니다. `onSelectionChange`은 사용자가 선택한 것을 보고합니다(아무것도 없으면 `null`). `selection` 속성은 앱에서 선택을 지정하며, 설정하지 않으면 테이블이 선택을 직접 유지합니다. `onDoublePress`는 행, 셀, 제목을 두 번 누른 것을 보고하고, `onContextMenu`은 앱의 [`Menu`](./menu.md)을 열 지점과 함께 보조 누름 또는 길게 누름을 보고합니다. 둘 다 포인터 아래의 셀(`row`과 `column`), 행 번호(`row`만), 또는 제목(`column`만)을 가리킵니다. 다음 누름이 있기 전까지, 메뉴가 요청된 셀에는 `cellActive` 파트가, 셀이 선택되지 않는 경우에는 그 행에 `rowActive` 파트가 적용됩니다.

스크린 리더에는 열 헤더와 셀로 이루어진 그리드(이름은 `accessibilityLabel`)가 제공되며, 선택된 항목은 선택됨으로 읽힙니다.

<a id="keyboard"></a>

## 키보드

테이블을 누르거나 Tab으로 이동하면(macOS, 웹) 테이블이 키보드를 받으며, 다른 곳을 누르거나, 포커스가 다른 곳으로 이동하거나, `blur()` 전까지 유지됩니다. 앱에서 키보드를 주려면 `focus()`을 사용합니다. 테이블은 Tab 이동에서 한 정지점이며, 테이블 안에서 Tab은 선택을 옮기고 Escape는 키보드를 돌려줍니다.

| 키 | 동작 |
|---|---|
| 화살표 키 | 선택을 한 행, 한 열, 또는 한 셀 옮기고 화면에 보이도록 스크롤합니다. |
| Tab, Shift+Tab | 다음 열 또는 이전 열로 이동합니다. |
| Page Up, Page Down | 한 페이지 분량의 행만큼 이동합니다. |
| Home, End | 첫 번째 또는 마지막으로 이동합니다. |
| Escape | 선택을 지운 다음 키보드를 돌려줍니다. |
| 복사 단축키 | 선택 항목의 텍스트를 클립보드에 넣습니다(`copy()`). |

`loopSelection`(기본값 `true`)은 화살표 키가 끝에서 반대편으로 이어지게 합니다.

<a id="sorting"></a>

## 정렬

`sortable` 열은 제목 끝에 정렬 버튼을 가지며, 이 버튼은 열이 정렬되지 않은 동안 흐리게 표시되는 작은 ghost 버튼입니다. 버튼을 누르면 정렬 없음, 오름차순, 내림차순, 다시 정렬 없음의 순환에서 다음 정렬(`{ key, direction }`)을 `onSortChange({ sort })`(해제하려면 `null`)와 함께 보고합니다. 테이블은 행을 다시 정렬하지 않습니다. 앱이 데이터를 정렬하거나 서버에 새 순서의 행을 요청하고, 제목에 정렬이 표시되도록 `sort`를 설정합니다. 순서를 앱이 소유하므로, 앱이 전부 가지고 있지 않은 100만 행에서도 정렬은 똑같이 동작합니다.

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

## 열 크기 조정과 이동

열의 뒤쪽 가장자리를 드래그하면 `minWidth`과 `maxWidth` 범위 안에서 크기가 조정되며, `onColumnResize({ key, width })`은 매 단계를 보고합니다. 가장자리를 연속으로 두 번 누르면 가장 넓은 텍스트와 제목에 맞게 열 너비가 맞춰집니다. 제목을 드래그하면 열이 이동하며, 놓일 위치를 선으로 보여 줍니다. `onColumnMove`은 `{ key, from, to, order }`를 보고하고, `order`은 표시된 순서대로 모든 열의 `key`입니다. 고정 열은 고정 열 사이에 머뭅니다. `resizableColumns`과 `movableColumns`은 테이블 전체에서 둘 다 끄며, 열의 `resizable`과 `movable`이 이들보다 우선합니다.

<a id="live-data"></a>

## 실시간 데이터

시세 테이블은 초당 여러 번 바뀝니다. 앱은 보이는 행과 그 주변 일부(`onVisibleRowsChange`에서 알 수 있습니다)를 포맷하여 `dataStart`의 `data`로 전달하므로, 행이 몇 개든 업데이트 비용은 화면에 보이는 만큼입니다. 상승과 하락은 열의 `positiveClass`과 `negativeClass`에서 색상을 가져오며, 값이 0보다 크거나 작은 셀(또는 텍스트가 `+` 또는 `-`로 시작하는 셀)에 네이티브로 적용됩니다.

```tsx
const tone = { positiveClass: "text-green-600", negativeClass: "text-red-600" };
const columns: DataTableColumn[] = [
  { key: "symbol", title: "Symbol", fixed: true },
  { key: "price", title: "Price", align: "end", sortable: true },
  { key: "change", title: "Chg%", align: "end", ...tone },
];
```

행과 열은 테이블이 한 번 만들고 유지하는 슬롯입니다. 스크롤하면 슬롯에 다른 행과 열이 주어질 뿐이므로, 아무리 길게 스크롤해도 텍스트와 위치만 바뀝니다.

<a id="drawing-cells-and-titles"></a>

## 셀과 제목 그리기

`renderCell`은 열이 단순한 텍스트가 아닌 경우(배지, 버튼 등) 앱이 직접 셀을 그리게 합니다. 보이는 셀에 대해서만 호출되며 `DataTableCell`를 받습니다: `row`, `column`, `key`, `text`(테이블이 표시했을 내용), `selected`. 앱은 `row`로 자신의 데이터를 조회합니다. `renderHeaderCell`은 셀 전체에 걸쳐 제목을 그리며 `DataTableHeaderCell`를 받습니다: `column`, `key`, `title`, `sort`(방향, 또는 없음), `selected`.

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

`fontFamily`과 `fontSize`(기본값 `14`)는 셀의 글꼴을 지정하며, 테이블은 열을 맞출 때 이 글꼴로 텍스트를 측정합니다.

<a id="the-ref"></a>

## ref

`ref`은 `DataTableRef`를 제공합니다. 테이블에 없는 행, 열, 열 키를 받은 메서드는 아무것도 바꾸지 않고, 메서드 이름과 값을 밝힌 경고를 기록합니다. `fitColumn`은 알 수 없는 키에 대해 `TypeError`로 reject합니다.

| 메서드 | 설명 |
|---|---|
| `scrollToRow(row, animated?)` | 행이 보이도록 스크롤합니다. |
| `scrollToColumn(key, animated?)` | 열이 보이도록 스크롤합니다. |
| `selection()` | 선택된 항목. 없으면 `null`. |
| `select(selection)` | 선택하고(`null`: 선택 없음) 화면에 보이게 하며, `onSelectionChange`은 발생시키지 않습니다. |
| `visibleRows()`, `visibleColumns()` | 보이는 행과 스크롤되는 열을 `{ start, end }`로 반환합니다(`end` 제외). |
| `columnWidths()` | 현재 너비로, `columns`의 순서를 따릅니다. |
| `setColumnWidth(key, width)` | 열의 너비를 제한 범위 안에서 설정합니다. |
| `fitColumn(key)` | 보이는 행과 그 주변 최대 천 개 행 중에서 가장 넓은 텍스트와 제목에 필요한 만큼 열 너비를 설정하고, 그 너비를 반환합니다. |
| `dump(start?, end?)` | 지정한 행(기본값은 보유한 모든 행)과 제목의 텍스트를 표시된 대로 반환합니다: `{ headers, rows }`, 내보내기용. |
| `copy()` | 선택 항목의 텍스트를 클립보드에 넣습니다. 행은 셀 사이에 탭을, 열은 줄바꿈을 넣고, 셀은 그 텍스트를 넣습니다. |
| `focus()`, `blur()` | 키보드를 테이블에 주거나 가져갑니다. |
| `menuTarget()`, `clearMenuTarget()` | 마지막 컨텍스트 메뉴가 요청된 위치(`{ row?, column? }`, `cellActive` / `rowActive`로 표시됨)와, 앱의 메뉴가 닫힐 때 그 표시를 제거하는 동작. |

<a id="styling-the-parts"></a>

## 파트 스타일링

`class`과 `style`은 테이블의 박스를 스타일링합니다. `classes`는 파트별 Tailwind 클래스를, `styles`는 파트별 인라인 스타일을 받습니다. 파트는 테이블의 구조와 정렬을 제공하고, 외형은 파트의 클래스가 제공하며, `styles`는 클래스보다 우선합니다.

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

| 파트 | 설명 |
|---|---|
| `root` | 테이블의 박스: 테두리, 모서리 반경, 배경 |
| `header` | 테이블 전체에 걸친 헤더로, 그룹 레이블과 제목의 행들 |
| `groupCell` | 자신이 걸친 열 위의 그룹 레이블 |
| `headerCell` | 모든 열의 제목 셀 |
| `headerContent` | 레이블과 정렬 버튼의 레이아웃 행. 둘 사이의 간격은 여기서 설정 |
| `headerCellDragging` | 드래그 중인 제목, `headerCell` 뒤에 적용 |
| `headerCellSorted` | 테이블이 정렬 기준으로 삼은 열의 제목, `headerCell` 뒤에 적용 |
| `headerCellSelected` | 선택된 열의 제목, `headerCell` 뒤에 적용 |
| `sortIndicator` | 정렬 가능한 열의 정렬 버튼 |
| `sortAscending`, `sortDescending` | 정렬 버튼의 두 쉐브론. `selected:`는 정렬된 방향에 적용 |
| `resizeHandle` | 열의 뒤쪽 가장자리에 있는, 드래그로 크기를 조정하는 선 |
| `moveIndicator` | 드래그한 열이 놓일 위치를 나타내는 선 |
| `row` | 모든 본문 행 |
| `rowOdd` | 홀수 행, `row`(`stripe`) 뒤에 적용 |
| `rowHover` | 포인터가 올라간 행, `row` 뒤에 적용 |
| `rowSelected` | 선택된 행, `row` 뒤에 적용 |
| `rowActive` | 셀이 선택되지 않는 경우 컨텍스트 메뉴가 요청된 행. 다음 누름 전까지 유지, `row` 뒤에 적용 |
| `cell` | 모든 본문 셀 |
| `cellSelected` | 선택된 셀, `cell` 뒤에 적용 |
| `cellActive` | 컨텍스트 메뉴가 요청된 셀. 다음 누름 전까지 유지, `cell` 뒤에 적용 |
| `cellColumnSelected` | 선택된 열의 셀, `cell` 뒤에 적용 |
| `rowHeader` | 행 헤더 셀, 즉 행 번호 |
| `rowHeaderCorner` | 행 헤더 위의 모서리 |
| `fixedEdge` | 고정 열의 뒤쪽 가장자리에 있는 선으로, 그 아래로 스크롤되는 열 위에 표시 |
| `empty` | `empty` 슬롯의 박스 |
## Props

| Prop | Rust | 타입 | 기본값 | 설명 |
|---|---|---|---|---|
| `columns` | `.columns(..)` | `DataTableColumn[]` | `[]` | 왼쪽에서 오른쪽 순서의 열입니다. 고정 열이 맨 앞에 옵니다. |
| `data` | `.data(..)` | `Row[]` | `[]` | 행입니다. 열 `key` 기준의 객체이거나 위치 기준의 배열입니다. |
| `rowCount` | `.row_count(..)` | `number` | 보유한 행 수 | 전체 행 수입니다. |
| `dataStart` | `.data_start(..)` | `number` | `0` | `data`의 첫 번째 행에 해당하는 행 번호입니다. |
| `rowClasses` | `.row_classes(..)` | `string[]` | `[]` | `data` 내 위치를 기준으로 지정한 행의 클래스입니다. 행마다 JS를 호출하지 않고 행 고유의 모양을 지정합니다. |
| `rowHeight` | `.row_height(..)` | `number` | `32` | 본문 행의 높이(포인트 단위)입니다. |
| `headerHeight` | `.header_height(..)` | `number` | 행 높이 | 제목 행의 높이입니다. |
| `groups` | `.groups(..)` | `DataTableColumnGroup[][]` | `[]` | 열 위에 표시되는 레이블이며, 가장 낮은 수준부터 나열합니다. |
| `sort` | `.sort(..)` | `DataTableSort` | | 데이터의 정렬 기준이며 제목에 표시됩니다. |
| `rowSelectable` | `.row_selectable(..)` | `boolean` | `true` | 누르기와 키 입력으로 행을 선택합니다. |
| `columnSelectable` | `.column_selectable(..)` | `boolean` | `true` | 제목을 누르면 해당 열이 선택되고, 가로 방향 키로 열 사이를 이동합니다. |
| `cellSelectable` | `.cell_selectable(..)` | `boolean` | `false` | 누르기와 키 입력으로 셀을 선택합니다. |
| `selectOnModifierPress` | `.select_on_modifier_press(..)` | `boolean` | `true` | Shift 키 또는 command 키를 누른 채 누르면 행이 선택됩니다. |
| `selection` | `.selection(..)` | `DataTableSelection` | | 앱이 설정한 경우의 선택 항목입니다. |
| `loopSelection` | `.loop_selection(..)` | `boolean` | `true` | 방향 키가 양 끝에서 반대쪽으로 순환합니다. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 없음 | 스크린 리더가 테이블을 부르는 이름입니다. |
| `rowHeader` | `.row_header(..)` | `boolean` | `cellSelectable` 사용 시 표시 | 왼쪽에 표시되는 행 번호 열입니다. |
| `stripe` | `.stripe(..)` | `boolean` | `false` | 홀수 행에 `rowOdd` 부분이 적용됩니다. |
| `resizableColumns` | `.resizable_columns(..)` | `boolean` | `true` | 열의 가장자리를 드래그하면 크기가 조정됩니다. |
| `movableColumns` | `.movable_columns(..)` | `boolean` | `true` | 제목을 드래그하면 해당 열이 이동합니다. |
| `loading` | `.loading(..)` | `boolean` | `false` | 테이블이 로딩 중입니다. `onLoadMore` 대기, `loadingView` 표시. |
| `hasMore` | `.has_more(..)` | `boolean` | `false` | 불러올 행이 더 있습니다. |
| `loadMoreThreshold` | `.load_more_threshold(..)` | `number` | `20` | 마지막 행까지 남은 행이 몇 개일 때 `onLoadMore` 이벤트가 발생하는지를 정합니다. |
| `fontFamily` | `.font_family(..)` | `string` | 상속 | 셀의 글꼴입니다. |
| `fontSize` | `.font_size(..)` | `number` | `14` | 셀의 글꼴 크기(포인트 단위)입니다. |
| `scrollbar` | `.scrollbar(..)` | `boolean` | `true` | 스크롤 막대입니다. |
| `verticalScrollbar`, `horizontalScrollbar` | `.vertical_scrollbar(..)`, `.horizontal_scrollbar(..)` | `boolean` | `scrollbar` | 한 축의 스크롤 막대입니다(가로 막대는 데스크톱에서 테이블 아래에 표시되는 막대입니다). |
| `bounces` | `.bounces(..)` | `boolean` | `true` | 플랫폼이 지원하는 경우, 스크롤이 끝에서 튕기는지 여부입니다. |
| `renderCell` | `.render_cell(..)` | `(cell: DataTableCell) => JSX.Element` | | 화면에 보이는 셀을 그립니다. |
| `renderHeaderCell` | `.render_header_cell(..)` | `(cell: DataTableHeaderCell) => JSX.Element` | | 제목을 그립니다. |
| `empty` | `.empty(..)` | `JSX.Element` | | 행이 없을 때 표시되는 내용입니다. |
| `loadingView` | `.loading_view(..)` | `JSX.Element` | | `loading` 동안 행 위에 표시되는 내용입니다. |
| `classes` | `.classes(..)` | `DataTableClasses` | `{}` | 부분별 Tailwind 클래스입니다. |
| `styles` | `.styles(..)` | `DataTableStyles` | `{}` | 부분별 인라인 스타일이며, 클래스보다 우선합니다. |
| `class`, `style` | 스타일 메서드 | `string`, `StyleProp<ViewStyle>` | | 테이블의 박스입니다. |

<a id="events"></a>

## 이벤트

| 이벤트 | Rust | 설명 |
|---|---|---|
| `onSelectionChange` | `.on_selection_change(\|selection: &Option<DataTableSelection>\| ..)` | 사용자가 선택을 변경했습니다: `{ selection }`, `{ row?, column? }` 또는 `null`. |
| `onRowPress` | `.on_row_press(\|event: &DataTablePress\| ..)` | 행 또는 셀을 눌렀습니다: `{ row, column?, clicks, shift, control, alt, platform }`. |
| `onDoublePress` | `.on_double_press(\|target: &DataTableTarget\| ..)` | 행, 셀 또는 제목을 두 번 눌렀습니다: `{ target }`, `{ row?, column? }`. |
| `onContextMenu` | `.on_context_menu(\|event: &DataTableContextMenu\| ..)` | 컨텍스트 메뉴가 요청되었습니다: `{ row?, column?, x, y }`, 루트 뷰에서의 지점. |
| `onSortChange` | `.on_sort_change(\|sort: &Option<DataTableSort>\| ..)` | 정렬 버튼을 눌렀습니다: `{ sort }`, 다음 정렬 `{ key, direction }` 또는 `null`. |
| `onColumnResize` | `.on_column_resize(\|key: &SharedString, width: &Points\| ..)` | 열 크기가 조정되었습니다(`{ key, width }`). 드래그하는 동안 매 단계마다 발생하며, 맞춤 설정이 적용될 때 한 번 더 발생합니다. |
| `onColumnMove` | `.on_column_move(\|event: &DataTableColumnMove\| ..)` | 열이 이동되었습니다: `{ key, from, to, order }`. |
| `onVisibleRowsChange` | `.on_visible_rows_change(\|range: &DataTableRange\| ..)` | 화면에 보이는 행이 변경되었습니다: `{ range }`, `{ start, end }`. 여기서 행을 가져오세요. |
| `onVisibleColumnsChange` | `.on_visible_columns_change(\|range: &DataTableRange\| ..)` | 화면에 보이는 스크롤 열이 변경되었습니다: `{ range }`. |
| `onLoadMore` | `.on_load_more(\|\| ..)` | 화면에 보이는 행이 마지막 행의 `loadMoreThreshold` 이내에 들어왔으며, `hasMore` 상태이고 `loading` 상태가 아닙니다. |

<a id="related"></a>

## 관련 문서

- [Editor](./editor.md) 및 [DiffView](./diff-view.md): 데이터 중심의 다른 기본 컴포넌트입니다.
- [Menu](./menu.md): `onContextMenu`에서 여는 메뉴입니다.
- [`nsh/base`](../modules/nsh-base.md): 다른 기본 컴포넌트입니다.
