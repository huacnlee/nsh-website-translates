---
title: "DiffView"
description: "DiffView 元件:顯示兩段文字之間或補丁(patch)的變更,支援並排或統一檢視,會突顯行內被修改的字詞,將未變更的行收合為可展開的分隔線,並提供語法突顯、自動換行、逐項變更操作、行選取及審閱註解。"
group: base
demo: el-diff-view
source_hash: 2004ab3c0d854626
---


# DiffView

`DiffView` 以程式碼審查工具的方式顯示兩段文字之間的差異：並排顯示時，舊文字在左、新文字在右，各行對齊；統一顯示時，刪除的行在上、新增的行在下。已更改的行內，更改了的字詞會被突顯；位於更改之間的未更改行會摺疊成可展開的分隔列；文字會以 [`Editor`](./editor.md) 的語法顏色突顯。它可顯示兩段文字（`oldValue` 和 `newValue`），或統一 diff 的各個檔案（`patch`：`git diff` 的、pull request 的），每個檔案各有標題。它專為審查更改而設，AI 建議的編輯亦包括在內：應用程式針對每項更改的操作可保留或還原該更改。只會建立檢視範圍內的列，因此長檔案的捲動與短檔案一樣流暢。

`DiffView` 負責行為，並附帶以主題 token 建構的預設外觀：主題的 `font-mono`（13pt，列高 20pt）、以 `muted-foreground` 顯示的行號、新增行淡綠底色、刪除行淡紅底色、更改字詞以較深色調標示、每條更改行在行號欄邊緣有一條色條，分隔列則使用 `muted`。各部分均以應用程式的樣式覆蓋這些預設值（`classes` 和 `styles`）。Rust 以 `nsh_base::diff_view()` 建立，TSX 則使用來自 `nsh/base` 的 `<DiffView>`。

```rust tabs
use nsh_base::diff_view;
use nsh_core::prelude::*;

const OLD: &str = "fn total(prices: &[u32]) -> u32 {\n    prices.iter().sum()\n}\n";
const NEW: &str = "fn total(prices: &[u64]) -> u64 {\n    prices.iter().copied().sum()\n}\n";

fn review() -> impl IntoElement {
    diff_view().old_value(OLD).new_value(NEW).language("rust").flex_1()
}
```

```tsx tabs
import { mount } from "nsh";
import { DiffView } from "nsh/base";

const OLD = `fn total(prices: &[u32]) -> u32 {
    prices.iter().sum()
}
`;
const NEW = `fn total(prices: &[u64]) -> u64 {
    prices.iter().copied().sum()
}
`;

function App() {
  return <DiffView oldValue={OLD} newValue={NEW} language="rust" class="flex-1" />;
}

mount(App);
```

檢視會填滿應用程式給予它的框（`flex-1`、高度），並在其內捲動：垂直捲動各列，橫向捲動至最長的行，並排檢視的兩側一同捲動。使用 `softWrap` 時，長行會按該側的寬度換行，並排的一列高度與較高的一側相同，因此兩側保持對齊。

<a id="two-texts-or-a-patch"></a>

## 兩段文字或修補檔

- **兩段文字**：`oldValue` 和 `newValue`。各行按原樣比較，因此新增或移除最後的換行符號即屬更改，與 git 的顯示一致。
- **修補檔**：`patch`，一個或多個檔案的 unified diff（`git diff`、`git format-patch`、`diff -u`；重新命名、模式、新增、刪除及二進位檔案，以及其前的提交訊息，均按 git 的寫法讀取）。檢視會顯示其 hunk 的行，行號與檔案中相同，每個 hunk 之上有以其標頭（所在函式）組成的分隔列，多個檔案時每個檔案各有自己的標題（[修補檔的檔案](#files-of-a-patch)）。未設定 `language` 時，各檔案的路徑決定其語言。

```tsx
const PATCH = `diff --git a/src/total.rs b/src/total.rs
--- a/src/total.rs
+++ b/src/total.rs
@@ -10,3 +10,3 @@ impl Cart {
-    fn total(&self) -> u32 {
+    fn total(&self) -> u64 {
         self.prices.iter().sum()
     }
`;

<DiffView patch={PATCH} layout="unified" class="flex-1" />
```

`language` 以 `Editor` 的方式指定語言：名稱、別名、副檔名或檔案名稱（`"rust"`、`"tsx"`、`"main.go"`、`"Dockerfile"`）。

<a id="files-of-a-patch"></a>

## 修補檔的檔案

多檔案修補檔會在每個檔案上方顯示標題列：預設顯示其路徑（重新命名時為 `old → new`）、新增及刪除的行數，以及 `▾`，按一下即可將該檔案摺疊為只剩標題（`▸`）或展開。`renderFileHeader` 以應用程式的方式繪製標題（單一檔案的修補檔上方亦會顯示一個），並會獲告知該檔案（`DiffFile`）：`index`、`path`、`oldPath`（重新命名或複製自）、`status`（`"modified"`、`"added"`、`"deleted"`、`"renamed"`、`"copied"`）、`binary`（修補檔未顯示其任何行）、`added`、`deleted`、`hunks`、`firstHunk` 和 `collapsed`。應用程式的標題會呼叫 ref 的 `toggleFile(path)`；`collapseFile` 和 `expandFile` 設定狀態，每項更改均會以 `onFileToggle({ file })` 回報。只要新的 `patch` 仍包含該檔案，已摺疊的檔案便保持摺疊。

更改會跨檔案按順序計算：檔案的更改為 `firstHunk` 至 `firstHunk + hunks - 1`，供 `goToHunk`、`renderHunkActions` 和 `hunks()` 使用（`DiffHunk` 的 `file` 是其檔案的索引，其行號在該檔案內計算），`stats()` 則加總每個檔案的更改。`goToHunk` 會先展開已摺疊的檔案。

```tsx
let diff!: DiffViewRef;
const files = signal<DiffFile[]>([]);

<View class="flex-1 flex-row">
  <View class="w-48">
    <Each of={files()}>
      {(file) => (
        <Button onPress={() => diff.scrollToFile(file().path)} class="px-2 py-1">
          <Text class="text-sm">{file().path} +{file().added} −{file().deleted}</Text>
        </Button>
      )}
    </Each>
  </View>
  <DiffView
    ref={(r) => {
      diff = r;
      r.files().then((list) => files.set(list));
    }}
    patch={PULL_REQUEST}
    renderFileHeader={(file) => (
      <Button onPress={() => diff.toggleFile(file.path)} class="flex-1 flex-row items-center gap-2 bg-muted px-2">
        <Text>{file.collapsed ? "▸" : "▾"}</Text>
        <Text class="flex-1 text-sm font-medium">{file.oldPath ? `${file.oldPath} → ${file.path}` : file.path}</Text>
        <Text class="text-xs text-muted-foreground">{file.binary ? "Binary" : file.status}</Text>
      </Button>
    )}
    class="flex-1"
  />
</View>
```

<a id="layout-and-inline-changes"></a>

## 版面配置與行內更改

`layout` 為 `"split"`（預設：並排，每條刪除行旁邊是與它最相似的新增行）或 `"unified"`（單欄，更改的刪除行在其新增行之上，並顯示兩個行號）。`inline` 決定已更改行內突顯的內容：

| `inline` | 突顯內容 |
|---|---|
| `"wordAlt"`（預設） | 已更改的字詞；相隔一個字元時會合併，使更改的短語視為一個 |
| `"word"` | 每個已更改的字詞 |
| `"char"` | 每個已更改的字元 |
| `"none"` | 無：僅顯示行的底色 |

字詞是由字母、數字和 `_` 組成的連續字元；每個 CJK 字元、假名和諺文音節各自成為一個字詞，因此句子中更改了一個字元，只會標示該字元本身。幾乎整行都已更改的行只顯示其底色。

`indicators` 在行號旁標記已更改的行：`"bars"`（預設，行號欄邊緣的色條）、`"classic"`（文字前的 `+` 和 `−`）或 `"none"`。`background={false}` 令已更改的行不上底色，`lineNumbers={false}` 則隱藏行號。

```tsx
<DiffView oldValue={before()} newValue={after()} language="md" layout="unified" inline="word" indicators="classic" class="flex-1" />
```

<a id="collapsed-lines"></a>

## 摺疊的行

每項更改周圍會顯示 `contextLines` 行未更改的行（預設 3 行）；更改之間以及第一項更改之前、最後一項之後的未更改行，會摺疊成一個分隔列，並註明所隱藏的行數。按一下即可全部顯示。`expandAll` 顯示所有行；ref 的 `expand`、`expandAll()` 和 `collapseAll()` 可由應用程式展開和摺疊它們。

`renderSeparator` 以應用程式的方式繪製分隔列。它會獲得分隔列（`DiffSeparator`）：`gap`、摺疊區段的索引（第一項更改之前為 0，更改 `i - 1` 與 `i` 之間為 `i`）、`lines`（所隱藏的行數）、`first` 和 `last`，修補檔還有 hunk 的 `header`。`expand(gap, direction, lines)` 可顯示 `"all"` 其全部的行（預設），或顯示 `lines`（預設 20）`"up"`，位置緊接在分隔列下方更改的上方，或 `"down"`，緊接在上方更改的下方。第一個分隔列向上展開，最後一個向下展開。

```tsx
let diff!: DiffViewRef;

<DiffView
  ref={diff}
  oldValue={before()}
  newValue={after()}
  language="ts"
  renderSeparator={(sep) => (
    <View class="flex-1 flex-row items-center gap-1 bg-muted px-2">
      <If when={!sep.first}>
        <Button onPress={() => diff.expand(sep.gap, "down")} class="px-1"><Text>↓</Text></Button>
      </If>
      <If when={!sep.last}>
        <Button onPress={() => diff.expand(sep.gap, "up")} class="px-1"><Text>↑</Text></Button>
      </If>
      <Button onPress={() => diff.expand(sep.gap)} class="flex-1">
        <Text class="text-xs text-muted-foreground">{sep.header ?? `${sep.lines} unchanged lines`}</Text>
      </Button>
    </View>
  )}
  class="flex-1"
/>
```

<a id="keeping-and-reverting-changes"></a>

## 保留與還原更改

`renderHunkActions` 會在檢視範圍內每項更改的右上方放置應用程式的操作，並獲告知該更改（`DiffHunk`：`index`、`oldStart`、`oldLines`、`newStart`、`newLines`（行從 0 起算），以及 `file`（修補檔中其檔案的索引））。它們會呼叫 ref：`revertHunk(index)` 將更改的舊行放回新文字，`acceptHunk(index)` 令其新行成為舊文字的內容。檢視會即時顯示結果，並以 `onChange({ change })`（`{ oldValue, newValue }`）回報兩段文字，應用程式再將它們設為 props。逐項保留或還原 AI 的編輯如下：

```tsx
import { signal, Text, View } from "nsh";
import { Button, DiffView, type DiffViewRef } from "nsh/base";

function Proposal(props: { file: string; current: string; proposed: string; onApply: (text: string) => void }) {
  let diff!: DiffViewRef;
  const current = signal(props.current);
  const proposed = signal(props.proposed);
  return (
    <View class="flex-1">
      <DiffView
        ref={diff}
        oldValue={current()}
        newValue={proposed()}
        language={props.file}
        onChange={({ change: { oldValue, newValue } }) => {
          current.set(oldValue);
          proposed.set(newValue);
          props.onApply(oldValue);
        }}
        renderHunkActions={(hunk) => (
          <View class="flex-row gap-1">
            <Button onPress={() => diff.revertHunk(hunk.index)} class="rounded bg-background px-2 py-0.5 border border-border">
              <Text class="text-xs">Revert</Text>
            </Button>
            <Button onPress={() => diff.acceptHunk(hunk.index)} class="rounded bg-primary px-2 py-0.5">
              <Text class="text-xs text-primary-foreground">Keep</Text>
            </Button>
          </View>
        )}
        class="flex-1"
      />
    </View>
  );
}
```

這裡舊文字就是檔案現時的內容：保留更改即將其套用到檔案（`onApply`），還原則將其從建議中移除。顯示 `patch` 的檢視只顯示檔案的節錄，其更改保持不變。

<a id="methods"></a>

## 方法

`ref={diff}` 提供檢視的方法（`DiffViewRef`）。回傳值的方法（`hunks()`、`stats()`）在 JS 中回傳其 `Promise`，因此須 `await`：`const changes = await diff.hunks()`。如需顯示於畫面的計數，`onStatsChange` 會在其變化時回報。若方法所收到的更改、分隔列或檔案在 diff 中不存在，則不會作出任何更改，並記錄一則警告，指出方法名稱和該值。

| 方法 | 說明 |
|---|---|
| `hunks()` | `Promise<DiffHunk[]>`：按順序列出各項更改。 |
| `stats()` | `Promise<DiffStats>`：`{ added, deleted, hunks }`、新增及刪除的行數，以及更改的數目。 |
| `goToHunk(index)` | 將更改 `index` 捲動至檢視範圍內，其第一列置於頂部。 |
| `revertHunk(index)` | 將更改 `index` 的舊行放回新文字，並回報兩段文字（`onChange`）。 |
| `acceptHunk(index)` | 令更改 `index` 的新行成為舊文字的內容，並回報兩段文字（`onChange`）。 |
| `expand(gap, direction?, lines?)` | 顯示分隔列 `gap` 所隱藏的行：`"all"`（預設），或 `lines`（預設 20）`"up"` 或 `"down"`。 |
| `expandAll()` | 顯示所有未更改的行。 |
| `collapseAll()` | 再次摺疊未更改的行。 |
| `nextHunk()` | `Promise<number \| null>`：將下一項更改捲動至頂部並給出其索引（最後一項之後為第一項）。 |
| `previousHunk()` | `Promise<number \| null>`：將上一項更改捲動至頂部並給出其索引（第一項之前為最後一項）。 |
| `currentHunk()` | `Promise<number \| null>`：最後前往的更改（只要檢視停留在該處），否則為位於檢視頂部的更改，或檢視範圍內的第一項。 |
| `selectedLines()` | `Promise<DiffLineRange \| null>`：在行號上選取的行。 |
| `setSelectedLines(range)` | 選取某一側的行（`null`：無），不觸發 `onLineSelectionChange`。 |
| `selectedText()` | `Promise<string>`：所選行的文字。 |
| `files()` | `Promise<DiffFile[]>`：修補檔的檔案，按順序附帶其計數（兩段文字則無）。 |
| `scrollToFile(path)` | 將位於 `path` 的檔案標題捲動至頂部。 |
| `collapseFile(path)` | 只顯示位於 `path` 的檔案標題。 |
| `expandFile(path)` | 再次顯示位於 `path` 的檔案的行。 |
| `toggleFile(path)` | 摺疊位於 `path` 的檔案，已摺疊則展開。 |
| `hunkBounds()` | `Promise<DiffHunkBounds[]>`：各項更改在各列中的位置，按順序（[總覽尺標](#an-overview-ruler)）。 |
| `scrollOffset()` | `Promise<Point>`：各列已捲動的距離（`x` 為 0）。 |
| `setScrollOffset(offset)` | 即時將各列捲動至 `offset.y`，直至其極限，如同滑塊跟隨拖曳它的指標。 |

`nextHunk()` 和 `previousHunk()` 會從其前往的更改繼續（只要檢視停留在該處），否則從檢視頂部起計，因此接近末尾而無法捲動至頂部的更改仍會被計入。上一項和下一項更改按鈕，附有來自 `onStatsChange` 的計數：

```tsx
let diff!: DiffViewRef;
const stats = signal<DiffStats>({ added: 0, deleted: 0, hunks: 0 });

<View class="flex-row items-center gap-2 p-2">
  <Text class="text-sm text-green-600">+{stats().added}</Text>
  <Text class="text-sm text-red-600">−{stats().deleted}</Text>
  <Text class="text-sm text-muted-foreground">{stats().hunks} changes</Text>
  <Button onPress={() => diff.previousHunk()}><Text>Previous</Text></Button>
  <Button onPress={() => diff.nextHunk()}><Text>Next</Text></Button>
</View>
<DiffView ref={diff} oldValue={before()} newValue={after()} onStatsChange={(e) => stats.set(e.stats)} class="flex-1" />
```

<a id="an-overview-ruler"></a>

## 總覽尺標

`onScroll({ offset, contentSize, size })` 回報各列的位置，其鍵與 [`Scroll`](./scroll.md) 的相同：`offset.y`，各列已捲動多遠（各列垂直捲動，寬度與檢視相同，兩側各自橫向捲動：`offset.x` 為 0）、`contentSize`，所有列合計的大小，以及 `size`，即視口的大小。檢視完成版面配置後會觸發一次，其後只要其中之一改變便再觸發：各列捲動時、檢視調整大小時，以及各列高度改變時（其他文字、`layout`、`softWrap`、檔案或分隔列展開或摺疊、註解完成版面配置）。`hunkBounds()` 給出各項更改在各列中的位置（`DiffHunkBounds`：`{ index, bounds }`、`bounds`，由其第一列頂部至最後一列底部，其下為註解，橫跨整個檢視），只包括會顯示的更改：已摺疊檔案的更改沒有列。`onHunkBoundsChange({ hunkBounds })` 在檢視完成版面配置後給出同一列表，其後只要有更改移動或改變大小便再給出，即使各列高度不變（一行已更改的行變成另一行）：尺標據此繪製標記，而不是在 `onScroll` 上讀取。`scrollOffset()` 讀取各列已捲動的距離，`setScrollOffset({ x, y })` 即時將各列捲動至 `y`，使被拖曳的滑塊在同一幀內跟隨指標。

它們合起來便構成檢視旁的總覽尺標，如程式碼編輯器一樣：每項更改一個標記、檢視範圍內各列上的滑塊，以及按一下或拖曳即捲動至該處。這裡尺標與檢視等高：

```rust tabs
use nsh_base::{DiffHunkBounds, DiffView, DiffViewApi, DiffViewEvent, diff_view, theme};
use nsh_core::prelude::*;

fn review(old: SharedString, new: SharedString) -> impl IntoElement {
    let diff = component_ref::<DiffView>();
    let ruler = element_ref();
    let ruler_top = stored(px(0.0));
    // How far the rows are scrolled, their height and the viewport's.
    let rows = signal((px(0.0), px(0.0), px(0.0)));
    let marks = signal(Vec::<DiffHunkBounds>::new());
    // Points of the rows per point of the ruler.
    let scale = move || {
        let (_, height, view) = rows.get();
        height.max(px(1.0)) / view.max(px(1.0))
    };
    // The thumb's middle at the pointer.
    let follow = move |page_y: Points| {
        let view = rows.get_untracked().2;
        let y = (page_y - ruler_top.get()) * scale() - view / 2.0;
        if let Some(api) = diff.api::<DiffViewApi>() {
            api.set_scroll_offset(point(px(0.0), y));
        }
    };
    view()
        .flex_1()
        .flex_row()
        .child(
            diff_view()
                .old_value(old)
                .new_value(new)
                .on_scroll(move |e: &DiffViewEvent| {
                    if let DiffViewEvent::Scroll(offset, content, size) = e {
                        rows.set((offset.y, content.height, size.height));
                    }
                })
                .on_hunk_bounds_change(move |list: &Vec<DiffHunkBounds>| marks.set(list.clone()))
                .component_ref(&diff)
                .flex_1(),
        )
        .child(
            view()
                .element_ref(&ruler)
                .w(px(12.0))
                .bg(move || theme().muted)
                .claim_touches(TouchClaim::on_start())
                .on_responder_grant(move |e: &ResponderEvent| {
                    let y = e.page.y;
                    spawn(async move {
                        ruler_top.replace(ruler.measure().await.map_or(px(0.0), |m| m.page.y));
                        follow(y);
                    });
                })
                .on_responder_move(move |e: &ResponderEvent| follow(e.page.y))
                .child(each(
                    marks,
                    |mark: &DiffHunkBounds| mark.index,
                    move |mark, _| {
                        view()
                            .absolute()
                            .left(px(0.0))
                            .right(px(0.0))
                            .bg(rgb(0xf59e0b))
                            .top(move || mark.get().bounds.origin.y / scale())
                            .h(move || (mark.get().bounds.size.height / scale()).max(px(2.0)))
                    },
                ))
                .child(
                    view()
                        .absolute()
                        .left(px(0.0))
                        .right(px(0.0))
                        .bg(move || theme().foreground.opacity(0.2))
                        .top(move || rows.get().0 / scale())
                        .h(move || rows.get().2 / scale()),
                ),
        )
}
```

```tsx tabs
import { Each, signal, View, type ViewRef } from "nsh";
import { DiffView, type DiffHunkBounds, type DiffViewRef } from "nsh/base";

let diff!: DiffViewRef;
let ruler!: ViewRef;
let rulerTop = 0;
const rows = signal({ y: 0, height: 0, view: 0 });
const marks = signal<DiffHunkBounds[]>([]);
// Points of the rows per point of the ruler.
const scale = () => Math.max(rows().height, 1) / Math.max(rows().view, 1);
// The thumb's middle at the pointer.
const follow = (pageY: number) => diff.setScrollOffset({ x: 0, y: (pageY - rulerTop) * scale() - rows().view / 2 });

<View class="flex-1 flex-row">
  <DiffView
    ref={diff}
    oldValue={before()}
    newValue={after()}
    onScroll={({ offset, contentSize, size }) => rows.set({ y: offset.y, height: contentSize.height, view: size.height })}
    onHunkBoundsChange={({ hunkBounds }) => marks.set(hunkBounds)}
    class="flex-1"
  />
  <View
    ref={ruler}
    class="w-3 bg-muted"
    onStartShouldSetResponder={() => true}
    onResponderGrant={async (e) => {
      const y = e.pageY;
      rulerTop = (await ruler.measure())?.pagePosition.y ?? 0;
      follow(y);
    }}
    onResponderMove={(e) => follow(e.pageY)}
  >
    <Each of={marks()}>
      {(mark) => (
        <View
          class="absolute inset-x-0 bg-amber-500"
          style={{ top: mark().bounds.origin.y / scale(), height: Math.max(mark().bounds.size.height / scale(), 2) }}
        />
      )}
    </Each>
    <View class="absolute inset-x-0 bg-foreground/20" style={{ top: rows().y / scale(), height: rows().view / scale() }} />
  </View>
</View>
```

標記的 `index` 是 `hunks()` 中該更改的，其 `oldLines` 和 `newLines` 可分辨新增更改（無舊行）與刪除更改（無新行），藉以為標記著色。

<a id="review-comments"></a>

## 審查評論

行號可選取某一側的行：按一下選取一行，Shift 加按一下將選取範圍延伸至該行，在行號上拖曳滑鼠則選取經過的行。`onLineSelectionChange` 將所選行回報為 `range`（`DiffLineRange`：`{ side, start, end }`，行從 0 起算，`null` 表示無），按一下行號時亦會回報 `onLineNumberPress({ line })`（`{ side, line }`）。ref 可讀取選取範圍（`selectedLines()`、`selectedText()`）並設定它。

`annotations` 將應用程式的內容放在行之下：每個 `{ id, side, line }` 由 `renderAnnotation` 橫跨其行所在的一側繪製（統一檢視時為整個檢視），高度按其版面配置而定，並於其所屬行顯示時顯示。`renderAddAnnotation` 是應用程式用來新增評論的控制項，位於指標所在行及最後選取行的行號欄右側；當其行屬於所選行之一時，它會獲得所選的行，否則獲得該行。

```tsx
type Comment = { id: string; side: "old" | "new"; line: number; text: string };
const comments = signal<Comment[]>([]);
const drafting = signal<DiffLineRange | null>(null);

<DiffView
  oldValue={before()}
  newValue={after()}
  annotations={comments().map(({ id, side, line }) => ({ id, side, line }))}
  renderAnnotation={(a) => (
    <View class="m-2 rounded-md border border-border bg-card p-2">
      <Text class="text-sm">{comments().find((c) => c.id === a.id)?.text}</Text>
    </View>
  )}
  renderAddAnnotation={(range) => (
    <Button onPress={() => drafting.set(range)} class="size-4 items-center justify-center rounded bg-primary">
      <Text class="text-xs text-primary-foreground">+</Text>
    </Button>
  )}
  class="flex-1"
/>
```
<a id="styling-the-parts"></a>

## 為各部分設定樣式

`class` 和 `style` 設定視圖外框的樣式。`classes` 按部分接受 Tailwind classes，`styles` 則按部分接受內聯樣式；某個部分的 classes 排在其自身預設樣式之後，因此會優先生效，而其 `styles` 又會優先於其 classes。字型由 `fontFamily`、`fontSize` 和 `lineHeight` 設定。

```tsx
<DiffView
  oldValue={before()}
  newValue={after()}
  language="py"
  fontSize={12}
  lineHeight={18}
  class="flex-1 rounded-lg border border-border"
  classes={{
    gutter: "bg-muted",
    lineAdded: "bg-blue-500/10",
    wordAdded: "bg-blue-500/30",
    indicatorAdded: "bg-blue-500",
    separator: "bg-transparent",
  }}
/>
```

| 部分 | 說明 | 預設值 |
|---|---|---|
| `side` | 每一側（split）或單一欄（unified） | 兩側之間有一條 `border` 線 |
| `gutter` | 一側的行號和標記 | |
| `lineNumber` | 每個行號 | 靠右對齊，`muted-foreground` |
| `lineNumberAdded` | 新增行的行號，套用於 `lineNumber` 之後 | |
| `lineNumberDeleted` | 刪除行的行號，套用於 `lineNumber` 之後 | |
| `content` | 一側的文字，位於其行號欄旁 | 文字前後各 8pt |
| `line` | 一側的每一列 | |
| `lineAdded` | 新增行所在的列，套用於 `line` 之後 | 淡綠色底色 |
| `lineDeleted` | 刪除行所在的列，套用於 `line` 之後 | 淡紅色底色 |
| `filler` | split 列中的空白半邊，位於另一側所沒有的行旁 | 淡淡的 `muted` 填色 |
| `wordAdded` | 新增行內被更改的字詞 | 較深的綠色 |
| `wordDeleted` | 刪除行內被更改的字詞 | 較深的紅色 |
| `indicatorAdded` | 新增行的色條（`"bars"`）或 `+`（`"classic"`） | 綠色，3pt 寬 |
| `indicatorDeleted` | 刪除行的色條或 `−` | 紅色，3pt 寬 |
| `separator` | 已收合行的分隔線，或 patch 的 hunk 標題 | `⋯`，以及位於 `muted` 上的數量 |
| `hunkActions` | 應用程式對某項變更所提供操作的方框 | 位於變更的右上角 |
| `lineSelected` | 覆蓋於所選行在其所屬一側的列上 | 主題的選取顏色（與 `Editor` 的選取範圍相同） |
| `annotation` | 註解的方框，位於其所屬行之下 | 橫跨其所屬行所在的一側 |
| `addAnnotation` | 新增控制項的方框，寬度與行號欄相同，高度為一行 | 控制項位於其右側 |
| `fileHeader` | patch 中某個檔案的標題列 | 路徑和數量顯示於 `secondary`，下方有一條 `border` 線 |

## Props

| Prop | Rust | 類型 | 預設值 | 說明 |
|---|---|---|---|---|
| `oldValue` | `.old_value(..)` | `string` | | 舊文字。 |
| `newValue` | `.new_value(..)` | `string` | | 新文字。 |
| `patch` | `.patch(..)` | `string` | | 一個或多個檔案的 unified diff；在 `oldValue` 和 `newValue` 未設定時顯示。 |
| `language` | `.language(..)` | `string` | 純文字（patch：各檔案自身的語言） | 語言的名稱、別名、副檔名或檔案名稱。 |
| `layout` | `.layout(..)` | `"split" \| "unified"` | `"split"` | 並排顯示或單欄顯示。 |
| `inline` | `.inline(..)` | `"wordAlt" \| "word" \| "char" \| "none"` | `"wordAlt"` | 在已更改的行內要突出顯示的內容。 |
| `indicators` | `.indicators(..)` | `"bars" \| "classic" \| "none"` | `"bars"` | 已更改的行在行號旁如何標記。 |
| `contextLines` | `.context_lines(..)` | `number` | `3` | 每項變更周圍顯示的未更改行。 |
| `expandAll` | `.expand_all(..)` | `boolean` | `false` | 顯示所有未更改的行。 |
| `lineNumbers` | `.line_numbers(..)` | `boolean` | `true` | 行號。 |
| `background` | `.background(..)` | `boolean` | `true` | 為已更改的行加上底色。 |
| `fontFamily` | `.font_family(..)` | `string` | 主題的 `font-mono` | 文字的字型。 |
| `fontSize` | `.font_size(..)` | `number` | `13` | 字型大小，單位為 point。 |
| `lineHeight` | `.line_height(..)` | `number` | `20` | 每一列的高度，單位為 point。 |
| `renderSeparator` | `.render_separator(..)` | `(separator: DiffSeparator) => JSX.Element` | | 繪製已收合行的分隔線。 |
| `renderHunkActions` | `.render_hunk_actions(..)` | `(hunk: DiffHunk) => JSX.Element` | | 應用程式對每項變更所提供的操作。 |
| `softWrap` | `.soft_wrap(..)` | `boolean` | `false` | 長行會按該側的寬度換行。 |
| `annotations` | `.annotations(..)` | `DiffAnnotation[]` | `[]` | 應用程式在行下方的內容：`{ id, side, line }`。 |
| `renderAnnotation` | `.render_annotation(..)` | `(annotation: DiffAnnotation) => JSX.Element` | | 在行下方繪製註解。 |
| `renderAddAnnotation` | `.render_add_annotation(..)` | `(range: DiffLineRange) => JSX.Element` | | 應用程式用來新增註解的控制項，顯示在滑鼠懸停的行和最後選取的行旁。 |
| `renderFileHeader` | `.render_file_header(..)` | `(file: DiffFile) => JSX.Element` | | 繪製 patch 中每個檔案的標題列，高度為一列。 |
| `classes` | `.classes(..)` | `DiffViewClasses` | `{}` | 按部分設定的 Tailwind classes。 |
| `styles` | `.styles(..)` | `DiffViewStyles` | `{}` | 按部分設定的內聯樣式，優先於 classes。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | | 視圖的外框。 |

<a id="events"></a>

## 事件

| 事件 | Rust | 說明 |
|---|---|---|
| `onChange` | `.on_change(\|change: &DiffChange\| ..)` | 某項變更已被保留或還原：`{ change }`，目前的文字（`{ oldValue, newValue }`）。 |
| `onLineNumberPress` | `.on_line_number_press(\|line: &DiffLine\| ..)` | 按下了某個行號：`{ line }`，一個 `{ side, line }`。 |
| `onLineSelectionChange` | `.on_line_selection_change(\|range: &Option<DiffLineRange>\| ..)` | 所選的行已改變：`{ range }`，一個 `{ side, start, end }` 或 `null`。 |
| `onStatsChange` | `.on_stats_change(\|stats: &DiffStats\| ..)` | 數量已改變：`{ stats }`，一個 `{ added, deleted, hunks }`。視圖建立時會觸發一次，之後每當文字被重新比對而得出不同數量時再次觸發，可用於顯示「+8 −8 · 5 changes」這類文字行。 |
| `onFileToggle` | `.on_file_toggle(\|file: &DiffFile\| ..)` | patch 中的某個檔案已被收合或展開（透過其標題列或 ref）：`{ file }`，目前的 `DiffFile`。 |
| `onScroll` | `.on_scroll(\|e: &DiffViewEvent\| ..)` | 列已捲動，或列或視口的大小已改變：`{ offset, contentSize, size }`，格式與 `Scroll` 相同（Rust 中為 `DiffViewEvent::Scroll(offset, content_size, size)`）。視圖完成佈局後會觸發一次，之後每當其中之一改變時再次觸發。 |
| `onHunkBoundsChange` | `.on_hunk_bounds_change(\|bounds: &Vec<DiffHunkBounds>\| ..)` | 各項變更在列中的位置已改變：`{ hunkBounds }`，即清單 `hunkBounds()` 所提供的內容。視圖完成佈局後會觸發一次，之後每當某項變更移動或改變大小時再次觸發（無論列的高度是否維持不變），可用於繪製概覽標尺的標記。 |

<a id="related"></a>

## 相關內容

- [Editor](./editor.md)：`DiffView` 所使用語法顏色和語言的來源程式碼編輯器。
- [TextView](./text-view.md)：Markdown 和 HTML 文件，適用於審閱內容周圍的文字。
- [`nsh/base`](../modules/nsh-base.md)：其他基礎元件。
