---
title: "DataTable"
description: "DataTable コンポーネント: 任意の数の行と列を縦横にスクロールできるテーブルです。固定列、サイズ変更可能な列、移動可能な列、ソート可能な列、行・列・セルの選択、アプリがページ単位で提供する行、グループラベル、キーボードナビゲーション、アプリが描画するセルに対応しています。"
group: base
demo: el-data-table
source_hash: 22c8d4a412976e77
---

# DataTable

`DataTable` は、スプレッドシートのように行と列を表示し、行数・列数がいくつであっても縦横にスクロールします。表示範囲内のセルだけが作られるため、100万行・1万列のテーブルでも小さなテーブルと同じようにスクロールします。行、列、セルは、ポインターとキーボードで選択できます。列は固定幅で、端をドラッグしてリサイズし、タイトルをドラッグして移動し、他の列がスクロールしても左側に固定でき、ソートもできます。タイトルはグループラベルの下に配置でき、セルやタイトルはアプリ側で描画することもできます。

`DataTable` はレイアウト、配置、仮想化、インタラクションを提供します。アプリは `classes` と `styles` を通じて、各パーツにパディング、色、枠線、選択時の表示を与えます。Rust では `nsh_base::data_table()` で、TSX では `nsh/base` の `<DataTable>` で作成します。

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

テーブルはアプリから与えられたボックス(`flex-1`、高さ)を埋め、その内部でスクロールします。行方向は縦に、列方向は横にスクロールし、スクロールバーが表示されます(`scrollbar={false}` で非表示になり、`bounces={false}` はバウンスのあるプラットフォームで端でのバウンスを止めます)。

<a id="rows-and-columns"></a>

## 行と列

`data` は行です。列の `key` が名前で参照するフィールドを持つオブジェクト、または列が位置で参照する配列を指定します。数値、真偽値、文字列はテキストとして表示されます。Rust では行を一度に1フィールドずつ、それぞれ1つの型で渡します: `DataTableRows::new(2).texts("symbol", ["AAPL", "MSFT"]).numbers("change", [1.2, -0.4])`。列は `DataTableColumn` です:

| フィールド | 説明 |
|---|---|
| `key` | 列の識別子で、列の中で一意です。セルが表示する行のフィールドであり、イベントや ref で使われる名前です。 |
| `title` | タイトルのテキスト。デフォルトは `key`。 |
| `width` | 幅(ポイント単位)。デフォルトは `120`。 |
| `minWidth`, `maxWidth` | ドラッグまたはフィットで設定できる最小幅と最大幅。デフォルトは `20` と `1200`。 |
| `fitPadding` | アプリのパディング、アイコン、バッジのための余白。列をフィットさせる際、最も幅の広いタイトルまたはセルテキストに加算されます。 |
| `align` | `"start"`(デフォルト)、`"center"`、`"end"`。数値向けで、セルとタイトルの両方に適用されます。 |
| `sortable` | タイトルにソートを要求するソートボタンが付きます([ソート](#sorting)を参照)。 |
| `fixed` | 他の列がその下をスクロールしても左側に固定されます。固定列は他の列の前に、その順序で並びます。 |
| `resizable`, `movable` | 端のドラッグでリサイズできるか、タイトルのドラッグで移動できるか。デフォルトはテーブルの `resizableColumns` と `movableColumns`。 |
| `selectable` | 選択の対象になるか。ボタンやチェックボックスの列では `false` を設定します。デフォルトは `true`。 |
| `cellClass` | 列のセルのクラス。`cell` パーツのクラスの後に適用されます。1つの列のパディングや配置用です。 |
| `headerClass` | 列のタイトルのクラス。`headerCell` パーツのクラスの後に適用されます。 |
| `positiveClass` | 上昇を表すセルのクラス。0 より大きい数値、または `+` で始まるテキストが対象です。 |
| `negativeClass` | 下落を表すセルのクラス。0 より小さい数値、または `-` で始まるテキストが対象です。 |

`rowHeight` は本文行の高さ(デフォルト `32`)、`headerHeight` はタイトル行の高さ(デフォルトは行の高さ)です。`rowHeader` は左端に行番号の列を追加し、これで行を選択できます。`stripe` は奇数行に `rowOdd` パーツを適用します。

<a id="group-labels"></a>

### グループラベル

`groups` は列の上にラベルを配置します。最下位のレベルが最初です。各レベルは `{ label, span }` のリストで、そのスパンの合計は列数、または下位レベルの数になります。

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

## 任意の行数

テーブルは位置で行を要求し、アプリがそれを提供します。`rowCount` は行の総数、`data` はアプリが保持している行、`dataStart` はその先頭の位置です。`data` の外側の行は、アプリが供給するまで空です。`onVisibleRowsChange` は、スクロールのたびに表示中の行 `{ range: { start, end } }` を報告するので、その周辺のページを取得する場所として適しています。

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

末尾に伸びていくリストには `hasMore` を設定します。表示中の行が最後の行から `loadMoreThreshold`(デフォルト `20`)以内に入ると、行数ごとに一度だけ `onLoadMore` が発火します。`loading` が true の間は待機し、`loadingView` スロットが行の上に表示されます。行がないときは `empty` スロットが表示されます。

コンテンツが数百万ポイントを超える場合、スクロールバーは縮尺された範囲を扱うため、100万行でも全行までスクロールできます。

<a id="selection"></a>

## 選択

gpui-component と同様に、3つのスイッチで押下時に何が選択されるかが決まります:

| Prop | 押下で選択されるもの | `selection` |
|---|---|---|
| `rowSelectable`(デフォルト `true`) | 行: そのセルのいずれか、または行ヘッダー | `{ row }` |
| `columnSelectable`(デフォルト `true`) | 列: そのタイトル | `{ column }` |
| `cellSelectable`(デフォルト `false`) | セル。行ヘッダー(これを指定するとデフォルトで表示)は行を選択します | `{ row, column }` |

`cellSelectable` で行ヘッダーが非表示(`rowHeader={false}`)の場合、選択済みのセルをもう一度押すとその行が選択されます。Shift またはプラットフォームのコマンドキーを押しながらの押下は、`selectOnModifierPress`(デフォルト `true`)の間だけ行を選択します。そのため、独自の複数行選択を持つアプリは、それらの押下を自分で処理します。`onRowPress` は本文のすべての押下について、その行、ポインター下の列、行内のクリック数、押されている修飾キーを報告します。`selectable` が `false` の列は、それ自体もそのセルも選択しません。

行はデータ内で 0 から数えます。列は、ユーザーがどの順序に移動していても、`columns` 内でのインデックスで表されます。`onSelectionChange` はユーザーが選択したもの(何もなければ `null`)を報告します。`selection` prop はアプリから選択を設定します。未設定のままにすると、テーブルが選択を保持します。`onDoublePress` は、2回押された行、セル、タイトルを報告し、`onContextMenu` はセカンダリ押下または長押しを、アプリの [`Menu`](./menu.md) を開く位置とともに報告します。どちらも、ポインター下のセル(その `row` と `column`)、行番号(`row` のみ)、またはタイトル(`column` のみ)を示します。次の押下まで、メニューが要求されたセルには `cellActive` パーツが、セルが選択されない場合はその行に `rowActive` パーツが適用されます。

スクリーンリーダーには、列ヘッダーとセルからなるグリッド(`accessibilityLabel` で名前付け)が提供され、選択されたものは選択済みと読み上げられます。

<a id="keyboard"></a>

## キーボード

テーブルを押すか、Tab で到達する(macOS、Web)と、別の押下、フォーカスの移動、または `blur()` まで、テーブルがキーボードを受け取ります。`focus()` でアプリから与えることもできます。テーブルは Tab の停止位置1つとして扱われ、内部では Tab が選択を移動し、Escape でキーボードを返します。

| キー | 動作 |
|---|---|
| 矢印キー | 選択を行、列、セル単位で移動し、表示範囲にスクロールします。 |
| Tab, Shift+Tab | 次の列または前の列に移動します。 |
| Page Up, Page Down | 1ページ分の行だけ移動します。 |
| Home, End | 最初または最後に移動します。 |
| Escape | 選択を解除し、その次にキーボードを返します。 |
| コピーのショートカット | 選択範囲のテキストをクリップボードに入れます(`copy()`)。 |

`loopSelection`(デフォルト `true`)を指定すると、矢印キーが端で反対側へ回り込みます。

<a id="sorting"></a>

## ソート

`sortable` の列には、タイトルの末尾にソートボタンがあります。これは小さなゴーストボタンで、列が未ソートの間は薄く表示されます。押すと、未ソート、昇順、降順、再び未ソートというサイクルの次のソート(`{ key, direction }`)が、`onSortChange({ sort })`(クリアは `null`)とともに報告されます。テーブルは行を並べ替えません。アプリがデータをソートするか、サーバーに新しい順序の行を要求し、`sort` を設定してタイトルに反映させます。順序はアプリが管理するため、アプリが保持しない100万行に対しても、ソートは同じように機能します。

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

## 列のリサイズと移動

列の末尾の端をドラッグすると、`minWidth` と `maxWidth` の範囲内でリサイズされ、`onColumnResize({ key, width })` が各ステップを報告します。端を続けて2回押すと、列が最も幅の広いテキストとタイトルに合わせられます。タイトルをドラッグすると列が移動し、ドロップ位置が線で示されます。`onColumnMove` は `{ key, from, to, order }` を報告し、`order` は表示順のすべての列の `key` の一覧です。固定列は固定列の中にとどまります。`resizableColumns` と `movableColumns` はテーブル全体で両方をオフにし、列ごとの `resizable` と `movable` がそれらより優先されます。

<a id="live-data"></a>

## ライブデータ

相場表は1秒間に何度も変化します。アプリは表示中の行とその周辺(`onVisibleRowsChange` からわかります)をフォーマットし、`dataStart` から `data` として渡します。そのため、行数にかかわらず、更新のコストは画面上にあるものだけで済みます。上昇と下落は、列の `positiveClass` と `negativeClass` から色を取り、値が 0 より上または下のセル(またはテキストが `+` または `-` で始まるセル)にネイティブに適用されます。

```tsx
const tone = { positiveClass: "text-green-600", negativeClass: "text-red-600" };
const columns: DataTableColumn[] = [
  { key: "symbol", title: "Symbol", fixed: true },
  { key: "price", title: "Price", align: "end", sortable: true },
  { key: "change", title: "Chg%", align: "end", ...tone },
];
```

行と列は、テーブルが一度作って保持するスロットです。スクロールすると、それらに別の行や列が割り当てられるので、どれだけ長くスクロールしても、変わるのはテキストと位置だけです。

<a id="drawing-cells-and-titles"></a>

## セルとタイトルの描画

`renderCell` は、列が単なるテキストではない場合(バッジ、ボタンなど)に、アプリ独自のセルを描画します。表示中のセルに対してのみ、`DataTableCell` とともに呼び出されます: `row`, `column`, `key`, `text`(テーブルが表示するもの)、`selected`。アプリは `row` で自身のデータを参照します。`renderHeaderCell` はセル全体にわたってタイトルを描画し、`DataTableHeaderCell` を受け取ります: `column`, `key`, `title`, `sort`(方向、またはなし)、`selected`。

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

`fontFamily` と `fontSize`(デフォルト `14`)はセルのフォントを設定します。テーブルは、列のフィットのためにテキストを計測する際にも、このフォントを使います。

<a id="the-ref"></a>

## ref

`ref` は `DataTableRef` を返します。テーブルにない行、列、列キーを渡されたメソッドは何も変更せず、メソッド名と値を示す警告をログに出力します。`fitColumn` は未知のキーに対して `TypeError` で reject します。

| メソッド | 説明 |
|---|---|
| `scrollToRow(row, animated?)` | 行を表示範囲にスクロールします。 |
| `scrollToColumn(key, animated?)` | 列を表示範囲にスクロールします。 |
| `selection()` | 選択されているもの。何もなければ `null`。 |
| `select(selection)` | 選択(`null`: なし)して表示範囲に入れます。`onSelectionChange` は発生させません。 |
| `visibleRows()`, `visibleColumns()` | 表示中の行とスクロールする列を `{ start, end }` として返します(`end` は除く)。 |
| `columnWidths()` | 現在の幅を、`columns` の順序で返します。 |
| `setColumnWidth(key, width)` | 列の幅を、その制限の範囲内で設定します。 |
| `fitColumn(key)` | 表示中の行と、その周囲の最大1000行を対象に、最も幅の広いテキストとタイトルに必要な幅に列を設定します。幅を返します。 |
| `dump(start?, end?)` | 指定した行(デフォルトは保持しているすべて)とタイトルのテキストを、表示どおりに返します: `{ headers, rows }`。エクスポート用です。 |
| `copy()` | 選択範囲のテキストをクリップボードに入れます。行ならセルをタブ区切り、列ならセルを改行区切り、セルならそのテキストです。 |
| `focus()`, `blur()` | テーブルにキーボードを与える、またはテーブルから取り上げます。 |
| `menuTarget()`, `clearMenuTarget()` | 直近のコンテキストメニューが要求された位置(`{ row?, column? }`、`cellActive` / `rowActive` で印が付く)と、アプリのメニューが閉じたときにその印を外すこと。 |

<a id="styling-the-parts"></a>

## パーツのスタイル

`class` と `style` はテーブルのボックスにスタイルを適用します。`classes` はパーツごとに Tailwind クラスを、`styles` はパーツごとにインラインスタイルを受け取ります。パーツがテーブルの構造と配置を提供し、見た目はそのクラスが与え、`styles` はクラスより優先されます。

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

| パーツ | 内容 |
|---|---|
| `root` | テーブルのボックス: 枠線、角丸、背景 |
| `header` | テーブル全体にわたるヘッダー。グループラベルとタイトルの行 |
| `groupCell` | スパンする列の上のグループラベル |
| `headerCell` | すべての列のタイトルセル |
| `headerContent` | ラベルとソートボタンのレイアウト行。ここで両者の間隔を設定します |
| `headerCellDragging` | ドラッグ中のタイトル。`headerCell` の後に適用されます |
| `headerCellSorted` | テーブルがソートされている列のタイトル。`headerCell` の後に適用されます |
| `headerCellSelected` | 選択された列のタイトル。`headerCell` の後に適用されます |
| `sortIndicator` | ソート可能な列のソートボタン |
| `sortAscending`, `sortDescending` | 2つのシェブロン。`selected:` はソートされている方向に適用されます |
| `resizeHandle` | 列の末尾の端にある、ドラッグでリサイズする線 |
| `moveIndicator` | ドラッグした列のドロップ位置を示す線 |
| `row` | すべての本文行 |
| `rowOdd` | 奇数行。`row`(`stripe`)の後に適用されます |
| `rowHover` | ポインターが乗っている行。`row` の後に適用されます |
| `rowSelected` | 選択された行。`row` の後に適用されます |
| `rowActive` | セルが選択されない場合に、コンテキストメニューが要求された行。次の押下まで、`row` の後に適用されます |
| `cell` | すべての本文セル |
| `cellSelected` | 選択されたセル。`cell` の後に適用されます |
| `cellActive` | コンテキストメニューが要求されたセル。次の押下まで、`cell` の後に適用されます |
| `cellColumnSelected` | 選択された列のセル。`cell` の後に適用されます |
| `rowHeader` | 行ヘッダーのセル(行番号) |
| `rowHeaderCorner` | 行ヘッダーの上の角 |
| `fixedEdge` | 固定列の末尾の端にある線。その下をスクロールする列の上に表示されます |
| `empty` | `empty` スロットのボックス |
<a id="props"></a>

## プロパティ

| プロパティ | Rust | 型 | デフォルト | 説明 |
|---|---|---|---|---|
| `columns` | `.columns(..)` | `DataTableColumn[]` | `[]` | 列を左から右の順に指定します。固定列が先頭に来ます。 |
| `data` | `.data(..)` | `Row[]` | `[]` | 行データ。列 `key` をキーとするオブジェクト、または位置で指定する配列。 |
| `rowCount` | `.row_count(..)` | `number` | 保持している行数 | 行の総数。 |
| `dataStart` | `.data_start(..)` | `number` | `0` | `data` の先頭行の行インデックス。 |
| `rowClasses` | `.row_classes(..)` | `string[]` | `[]` | 指定した行のクラス。`data` 内の位置で指定します。行ごとに JS を呼び出さずに、行自体の見た目を決められます。 |
| `rowHeight` | `.row_height(..)` | `number` | `32` | 本体行の高さ(ポイント)。 |
| `headerHeight` | `.header_height(..)` | `number` | 行の高さ | タイトル行の高さ。 |
| `groups` | `.groups(..)` | `DataTableColumnGroup[][]` | `[]` | 列の上に表示するラベル。最下位レベルから順に指定します。 |
| `sort` | `.sort(..)` | `DataTableSort` | | データのソート基準。タイトルに表示されます。 |
| `rowSelectable` | `.row_selectable(..)` | `boolean` | `true` | 押下とキー操作で行を選択します。 |
| `columnSelectable` | `.column_selectable(..)` | `boolean` | `true` | タイトルを押すとその列が選択され、水平方向のキーで列間を移動します。 |
| `cellSelectable` | `.cell_selectable(..)` | `boolean` | `false` | 押下とキー操作でセルを選択します。 |
| `selectOnModifierPress` | `.select_on_modifier_press(..)` | `boolean` | `true` | Shift キーまたはコマンドキーを押しながら押すと行を選択します。 |
| `selection` | `.selection(..)` | `DataTableSelection` | | アプリが設定した場合の選択内容。 |
| `loopSelection` | `.loop_selection(..)` | `boolean` | `true` | 矢印キーで端を越えて反対側に回り込みます。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | なし | スクリーンリーダーがこのテーブルを呼ぶ名前。 |
| `rowHeader` | `.row_header(..)` | `boolean` | `cellSelectable` とともに表示 | 左端に表示される行番号の列。 |
| `stripe` | `.stripe(..)` | `boolean` | `false` | 奇数行に `rowOdd` の部分が適用されます。 |
| `resizableColumns` | `.resizable_columns(..)` | `boolean` | `true` | 列の端をドラッグするとサイズを変更します。 |
| `movableColumns` | `.movable_columns(..)` | `boolean` | `true` | タイトルをドラッグすると列を移動します。 |
| `loading` | `.loading(..)` | `boolean` | `false` | テーブルは読み込み中です。`onLoadMore` は待機し、`loadingView` が表示されます。 |
| `hasMore` | `.has_more(..)` | `boolean` | `false` | 読み込むべき行がまだあります。 |
| `loadMoreThreshold` | `.load_more_threshold(..)` | `number` | `20` | 最後の行から数えて何行目に入ると `onLoadMore` が発火するか。 |
| `fontFamily` | `.font_family(..)` | `string` | 継承 | セルのフォント。 |
| `fontSize` | `.font_size(..)` | `number` | `14` | セルのフォントサイズ(ポイント)。 |
| `scrollbar` | `.scrollbar(..)` | `boolean` | `true` | スクロールバー。 |
| `verticalScrollbar`, `horizontalScrollbar` | `.vertical_scrollbar(..)`, `.horizontal_scrollbar(..)` | `boolean` | `scrollbar` | 片方の軸のスクロールバー(水平方向のものは、デスクトップでテーブルの下に表示されるバー)。 |
| `bounces` | `.bounces(..)` | `boolean` | `true` | プラットフォームが対応している場合に、端でスクロールがバウンスするかどうか。 |
| `renderCell` | `.render_cell(..)` | `(cell: DataTableCell) => JSX.Element` | | 表示範囲内のセルを描画します。 |
| `renderHeaderCell` | `.render_header_cell(..)` | `(cell: DataTableHeaderCell) => JSX.Element` | | タイトルを描画します。 |
| `empty` | `.empty(..)` | `JSX.Element` | | 行がないときに表示される内容。 |
| `loadingView` | `.loading_view(..)` | `JSX.Element` | | `loading` の間、行の上に表示される内容。 |
| `classes` | `.classes(..)` | `DataTableClasses` | `{}` | パーツごとの Tailwind クラス。 |
| `styles` | `.styles(..)` | `DataTableStyles` | `{}` | パーツごとのインラインスタイル。クラスより優先されます。 |
| `class`, `style` | スタイルメソッド | `string`, `StyleProp<ViewStyle>` | | テーブルのボックス。 |

<a id="events"></a>

## イベント

| イベント | Rust | 説明 |
|---|---|---|
| `onSelectionChange` | `.on_selection_change(\|selection: &Option<DataTableSelection>\| ..)` | ユーザーが選択を変更しました: `{ selection }`、`{ row?, column? }` または `null`。 |
| `onRowPress` | `.on_row_press(\|event: &DataTablePress\| ..)` | 行またはセルが押されました: `{ row, column?, clicks, shift, control, alt, platform }`。 |
| `onDoublePress` | `.on_double_press(\|target: &DataTableTarget\| ..)` | 行、セル、またはタイトルが2回押されました: `{ target }`、`{ row?, column? }`。 |
| `onContextMenu` | `.on_context_menu(\|event: &DataTableContextMenu\| ..)` | コンテキストメニューが要求されました: `{ row?, column?, x, y }`、ルートビュー内の座標。 |
| `onSortChange` | `.on_sort_change(\|sort: &Option<DataTableSort>\| ..)` | ソートボタンが押されました: `{ sort }`、次のソート `{ key, direction }` または `null`。 |
| `onColumnResize` | `.on_column_resize(\|key: &SharedString, width: &Points\| ..)` | 列のサイズが変更されました(`{ key, width }`)。ドラッグの各ステップで発生し、フィットによってサイズが設定されたときにもう一度発生します。 |
| `onColumnMove` | `.on_column_move(\|event: &DataTableColumnMove\| ..)` | 列が移動されました: `{ key, from, to, order }`。 |
| `onVisibleRowsChange` | `.on_visible_rows_change(\|range: &DataTableRange\| ..)` | 表示範囲の行が変わりました: `{ range }`、`{ start, end }`。行の取得はここから行います。 |
| `onVisibleColumnsChange` | `.on_visible_columns_change(\|range: &DataTableRange\| ..)` | 表示範囲のスクロール列が変わりました: `{ range }`。 |
| `onLoadMore` | `.on_load_more(\|\| ..)` | `hasMore` かつ `loading` でない間に、表示範囲の行が最後の行から `loadMoreThreshold` 以内に入りました。 |

<a id="related"></a>

## 関連項目

- [Editor](./editor.md) と [DiffView](./diff-view.md): データ量の多い他の基本コンポーネント。
- [Menu](./menu.md): `onContextMenu` から開くメニュー。
- [`nsh/base`](../modules/nsh-base.md): 他の基本コンポーネント。
