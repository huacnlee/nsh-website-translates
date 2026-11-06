---
title: "DiffView"
description: "DiffView 元件:顯示兩段文字之間或某個 patch 的變更,支援並排與統一兩種檢視方式,可醒目標示行內變更的字詞,將未變更的行收合為可展開的分隔線,並提供語法醒目提示、自動換行、逐項變更操作、行選取與審閱註解。"
group: base
demo: el-diff-view
source_hash: 2004ab3c0d854626
---

# DiffView

`DiffView` 以程式碼審查工具的方式顯示兩段文字之間的差異:並排模式下舊文字在左、新文字在右,各行對齊;統一模式下則是刪除的行在上、新增的行在下。在變更的行內,有變動的詞會被標示出來,變更之間未變動的行會摺疊成可展開的分隔線,文字則以 [`Editor`](./editor.md) 的語法色彩高亮。它可以顯示兩段文字(`oldValue` 與 `newValue`),或統一 diff 中的各個檔案(`patch`:`git diff` 的輸出、pull request 的 diff),每個檔案各有標頭。它專為審查變更而設計,包括 AI 提出的編輯:應用程式針對每項變更提供的操作可以保留或還原該變更。只會建立可見範圍內的列,因此長檔案的捲動就和短檔案一樣順暢。

`DiffView` 負責行為,並附帶一套以主題 token 建構的預設外觀:主題的 `font-mono` 以 13pt 字級、20pt 列高顯示,行號使用 `muted-foreground`,新增的行以綠色底色標示、刪除的行以紅色標示,變動的詞使用更深的底色,每個變更行在邊欄邊緣有一條色條,分隔線使用 `muted`。各個部分都會在這些預設值之上套用應用程式的樣式(`classes` 與 `styles`)。Rust 以 `nsh_base::diff_view()` 建立,TSX 則使用來自 `nsh/base` 的 `<DiffView>`。

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

檢視會填滿應用程式提供的方塊(`flex-1`、高度),並在其中捲動:垂直捲動各列,水平捲動至最長的行,並排檢視的兩側會一起捲動。使用 `softWrap` 時,長行會改為在該側的寬度處換行,並排的一列與較高的一側等高,因此兩側保持對齊。

<a id="two-texts-or-a-patch"></a>

## 兩段文字或一份 patch

- **兩段文字**:`oldValue` 與 `newValue`。各行依原樣比對,因此新增或移除結尾的換行符號也算一項變更,與 git 的顯示一致。
- **patch**:`patch`,為一個或多個檔案的統一 diff(`git diff`、`git format-patch`、`diff -u`;重新命名、模式、新增、刪除與二進位檔案,以及前面的 commit 訊息,皆依 git 的寫法讀取)。檢視會顯示其 hunk 的行,行號與檔案中的一致,每個 hunk 位於以其標頭(所在的函式)構成的分隔線下方,多個檔案時每個檔案各有自己的標頭([patch 的檔案](#files-of-a-patch))。未設定 `language` 時,各檔案的路徑決定其語言。

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

`language` 的語言名稱與 `Editor` 相同:名稱、別名、副檔名或檔案名稱(`"rust"`、`"tsx"`、`"main.go"`、`"Dockerfile"`)。

<a id="files-of-a-patch"></a>

## patch 的檔案

包含多個檔案的 patch 會在每個檔案上方顯示一列標頭:預設為其路徑(重新命名時為 `old → new`)、新增與刪除的行數,以及 `▾`,按一下即可將該檔案摺疊為只剩標頭(`▸`)或展開。`renderFileHeader` 以應用程式自己的方式繪製標頭(單一檔案的 patch 上方也會顯示一個),並會得到該檔案的資訊(`DiffFile`):`index`、`path`、`oldPath`(重新命名或複製自)、`status`(`"modified"`、`"added"`、`"deleted"`、`"renamed"`、`"copied"`)、`binary`(patch 未顯示其任何行)、`added`、`deleted`、`hunks`、`firstHunk` 與 `collapsed`。應用程式的標頭會呼叫 ref 的 `toggleFile(path)`;`collapseFile` 與 `expandFile` 設定狀態,每次變更都會以 `onFileToggle({ file })` 回報。只要新的 `patch` 仍包含該檔案,已摺疊的檔案就會維持摺疊。

變更會跨檔案依序計數:一個檔案的變更為 `firstHunk` 到 `firstHunk + hunks - 1`,供 `goToHunk`、`renderHunkActions` 與 `hunks()` 使用(`DiffHunk` 的 `file` 是其所屬檔案的索引,其行數以該檔案內為準),而 `stats()` 會加總所有檔案的數量。`goToHunk` 會先展開已摺疊的檔案。

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

## 版面配置與行內變更

`layout` 可為 `"split"`(預設:並排,每一條刪除的行置於與它最相似的新增行旁)或 `"unified"`(單欄,一項變更的刪除行在其新增行上方,並顯示兩個行號)。`inline` 決定變更行內要標示的內容:

| `inline` | 標示的內容 |
|---|---|
| `"wordAlt"`(預設) | 有變動的詞,相距一個字元時會合併,因此一段變動的片語會視為一個整體 |
| `"word"` | 每個有變動的詞 |
| `"char"` | 每個有變動的字元 |
| `"none"` | 不標示:僅使用行的底色 |

詞是由字母、數字與 `_` 組成的連續片段;每個 CJK 字元、假名與韓文音節各自為一個詞,因此句子中變動的一個字元只會標示它自己。幾乎整行都變動的行只顯示其底色。

`indicators` 在行號旁標記變更的行:`"bars"`(預設,邊欄邊緣的一條色條)、`"classic"`(文字前顯示 `+` 與 `−`)或 `"none"`。`background={false}` 讓變更的行不加底色,`lineNumbers={false}` 則隱藏行號。

```tsx
<DiffView oldValue={before()} newValue={after()} language="md" layout="unified" inline="word" indicators="classic" class="flex-1" />
```

<a id="collapsed-lines"></a>

## 摺疊的行

每項變更周圍會顯示 `contextLines` 行未變動的行(預設為 3);變更之間的未變動行,以及第一項變更之前與最後一項變更之後的行,會摺疊成一條分隔線,並註明它隱藏了多少行。按下它會顯示全部。`expandAll` 會顯示每一行;ref 的 `expand`、`expandAll()` 與 `collapseAll()` 讓應用程式展開與摺疊這些行。

`renderSeparator` 以應用程式自己的方式繪製分隔線。它會得到分隔線的資訊(`DiffSeparator`):`gap`、摺疊區段的索引(第一項變更之前為 0,介於變更 `i - 1` 與 `i` 之間時為 `i`)、`lines`(它隱藏的行數)、`first` 與 `last`,對 patch 而言還有該 hunk 的 `header`。`expand(gap, direction, lines)` 會顯示 `"all"` 其所有行(預設),或顯示 `lines`(預設 20)`"up"`,位於分隔線下方變更的正上方,或 `"down"`,位於分隔線上方變更的正下方。第一條分隔線向上展開,最後一條向下展開。

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

## 保留與還原變更

`renderHunkActions` 會把應用程式的操作放在可見範圍內每項變更的右上角,並得到該變更的資訊(`DiffHunk`:`index`、`oldStart`、`oldLines`、`newStart`、`newLines`,行從 0 起算,以及 `file`,patch 中其所屬檔案的索引)。它們呼叫 ref:`revertHunk(index)` 把該變更的舊行放回新文字,`acceptHunk(index)` 則讓它的新行成為舊文字的內容。檢視會立即顯示結果,並以 `onChange({ change })`(`{ oldValue, newValue }`)回報兩段文字,應用程式再將其設為 props。逐項保留或還原 AI 的編輯就是這樣做的:

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

此處舊文字是檔案目前的內容:保留一項變更就是把它套用到檔案(`onApply`),還原則是把它從提案中移除。顯示 `patch` 的檢視顯示的是檔案的節錄,其變更維持原樣。

<a id="methods"></a>

## 方法

`ref={diff}` 提供檢視的方法(`DiffViewRef`)。會回傳值的方法(`hunks()`、`stats()`)在 JS 中回傳該值的 `Promise`,因此要 `await` 它們:`const changes = await diff.hunks()`。若要顯示畫面上的計數,`onStatsChange` 會在計數變動時回報。若傳給方法的變更、分隔線或檔案不存在於 diff 中,則不會有任何變更,並記錄一則指出方法名稱與該值的警告。

| 方法 | 說明 |
|---|---|
| `hunks()` | `Promise<DiffHunk[]>`:依序列出各項變更。 |
| `stats()` | `Promise<DiffStats>`:`{ added, deleted, hunks }`、新增與刪除的行數以及變更的數量。 |
| `goToHunk(index)` | 將變更 `index` 捲動到可見範圍,其第一列位於頂端。 |
| `revertHunk(index)` | 將變更 `index` 的舊行放回新文字,並回報兩段文字(`onChange`)。 |
| `acceptHunk(index)` | 讓變更 `index` 的新行成為舊文字的內容,並回報兩段文字(`onChange`)。 |
| `expand(gap, direction?, lines?)` | 顯示分隔線 `gap` 所隱藏的行:`"all"`(預設),或 `lines`(預設 20)`"up"` 或 `"down"`。 |
| `expandAll()` | 顯示所有未變動的行。 |
| `collapseAll()` | 再次摺疊未變動的行。 |
| `nextHunk()` | `Promise<number \| null>`:將下一項變更捲動到頂端並回傳其索引(最後一項之後為第一項)。 |
| `previousHunk()` | `Promise<number \| null>`:將上一項變更捲動到頂端並回傳其索引(第一項之前為最後一項)。 |
| `currentHunk()` | `Promise<number \| null>`:最後跳轉到的變更(檢視停留在該處時),否則為檢視頂端的變更或可見範圍內的第一項變更。 |
| `selectedLines()` | `Promise<DiffLineRange \| null>`:在行號上選取的行。 |
| `setSelectedLines(range)` | 選取某一側的行(`null`:不選取),不觸發 `onLineSelectionChange`。 |
| `selectedText()` | `Promise<string>`:所選行的文字。 |
| `files()` | `Promise<DiffFile[]>`:patch 的各檔案,依序附上其計數(兩段文字時為空)。 |
| `scrollToFile(path)` | 將位於 `path` 的檔案標頭捲動到頂端。 |
| `collapseFile(path)` | 只顯示位於 `path` 的檔案標頭。 |
| `expandFile(path)` | 再次顯示位於 `path` 的檔案的行。 |
| `toggleFile(path)` | 摺疊位於 `path` 的檔案,若已摺疊則展開。 |
| `hunkBounds()` | `Promise<DiffHunkBounds[]>`:每項變更在各列中的位置,依序([總覽尺規](#an-overview-ruler))。 |
| `scrollOffset()` | `Promise<Point>`:各列已捲動的距離(`x` 為 0)。 |
| `setScrollOffset(offset)` | 立即將各列捲動到 `offset.y`,最遠到其極限,如同滑塊跟隨拖曳它的指標。 |

`nextHunk()` 與 `previousHunk()` 在檢視停留於其跳轉到的變更時,會從該變更繼續,否則從檢視頂端開始,因此靠近末尾、無法捲動到頂端的變更仍會被計入。下一項與上一項變更的按鈕,以及來自 `onStatsChange` 的計數:

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

## 總覽尺規

`onScroll({ offset, contentSize, size })` 回報各列的位置,所用的鍵與 [`Scroll`](./scroll.md) 相同:`offset.y`(已捲動的距離;各列垂直捲動,寬度與檢視相同,兩側則各自水平捲動:`offset.x` 為 0)、`contentSize`(所有列合計的大小),以及 `size`(可視區域的大小)。它在檢視完成版面配置後觸發一次,之後只要其中任何一項變動就再次觸發:各列捲動時、檢視調整大小時,以及各列高度改變時(其他文字、`layout`、`softWrap`、展開或摺疊檔案或分隔線、完成版面配置的註解)。`hunkBounds()` 給出每項變更在各列中的位置(`DiffHunkBounds`:`{ index, bounds }`、`bounds`,從其第一列的頂端到最後一列的底端,其下方附上註解,橫跨整個檢視),僅包含有顯示的變更:已摺疊檔案的變更沒有列。`onHunkBoundsChange({ hunkBounds })` 在檢視完成版面配置後給出相同的清單,之後每當變更移動或大小改變時再次給出,即使各列高度不變(一個變更行變成另一行):尺規應據此繪製標記,而不是在 `onScroll` 上讀取。`scrollOffset()` 讀取各列已捲動的距離,`setScrollOffset({ x, y })` 立即將各列捲動到 `y`,讓拖曳的滑塊在同一個影格內跟隨指標。

它們合在一起,就能在檢視旁做出像程式碼編輯器那樣的總覽尺規:每項變更一個標記、覆蓋可見各列的滑塊,以及按下或拖曳即可捲動到該處。這裡的尺規與檢視等高:

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

標記的 `index` 是該變更在 `hunks()` 中的索引,其 `oldLines` 與 `newLines` 可區分新增的變更(沒有舊行)與刪除的變更(沒有新行),用來為標記上色。

<a id="review-comments"></a>

## 審查留言

行號可選取某一側的行:按一下選取一行,Shift 加按則將選取範圍延伸到該行,在行號上拖曳滑鼠則選取經過的行。`onLineSelectionChange` 將所選的行回報為 `range`(`DiffLineRange`:`{ side, start, end }`,行從 0 起算,未選取時為 `null`),按下行號時也會回報 `onLineNumberPress({ line })`(`{ side, line }`)。ref 可讀取選取範圍(`selectedLines()`、`selectedText()`)並加以設定。

`annotations` 把應用程式的內容放在行的下方:每個 `{ id, side, line }` 由 `renderAnnotation` 繪製,橫跨其行所在的一側(統一模式時為整個檢視),高度依版面配置而定,並在其行顯示時才顯示。`renderAddAnnotation` 是應用程式用來新增留言的控制項,位於指標所在行以及最後一個選取行的邊欄右側;當其行屬於所選的行時,它會得到所選的行,否則得到該行。

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

## 為各部位設定樣式

`class` 和 `style` 用來設定 view 外框的樣式。`classes` 依部位接受 Tailwind classes，`styles` 則依部位接受行內樣式；部位的 classes 會排在其自身預設樣式之後，因此優先於預設樣式，而該部位的 `styles` 又優先於其 classes。字型透過 `fontFamily`、`fontSize` 和 `lineHeight` 設定。

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

| 部位 | 說明 | 預設值 |
|---|---|---|
| `side` | 每一側（split）或單一欄（unified） | 兩側之間有一條 `border` 線 |
| `gutter` | 一側的行號與指示符號 | |
| `lineNumber` | 每個行號 | 靠右對齊，`muted-foreground` |
| `lineNumberAdded` | 新增行的行號，套用於 `lineNumber` 之後 | |
| `lineNumberDeleted` | 刪除行的行號，套用於 `lineNumber` 之後 | |
| `content` | 一側的文字，位於其 gutter 旁 | 文字前後各 8pt |
| `line` | 一側的每一列 | |
| `lineAdded` | 新增行的列，套用於 `line` 之後 | 綠色底色 |
| `lineDeleted` | 刪除行的列，套用於 `line` 之後 | 紅色底色 |
| `filler` | 分割列中，另一側沒有對應行時，旁邊的空白半邊 | 淡淡的 `muted` 填色 |
| `wordAdded` | 新增行內被變更的字詞 | 較深的綠色 |
| `wordDeleted` | 刪除行內被變更的字詞 | 較深的紅色 |
| `indicatorAdded` | 新增行的色條（`"bars"`）或 `+`（`"classic"`） | 綠色，3pt 寬 |
| `indicatorDeleted` | 刪除行的色條或 `−` | 紅色，3pt 寬 |
| `separator` | 已收合行的分隔列，或 patch 的 hunk 標頭 | `⋯`，以及位於 `muted` 的行數 |
| `hunkActions` | 針對某個變更的 app 動作所在的框 | 位於該變更的右上角 |
| `lineSelected` | 覆蓋在該側已選取行的列上 | 主題的選取色（與 `Editor` 的選取範圍相同） |
| `annotation` | 註解的框，位於其所屬行的下方 | 橫跨其所屬行的那一側 |
| `addAnnotation` | 新增控制項的框，寬度為 gutter 的寬度、高度為一行 | 控制項位於其右側 |
| `fileHeader` | patch 中某個檔案的標頭 | 路徑與數量位於 `secondary`，其下有一條 `border` 線 |

<a id="props"></a>

## 屬性

| 屬性 | Rust | 型別 | 預設值 | 說明 |
|---|---|---|---|---|
| `oldValue` | `.old_value(..)` | `string` | | 舊文字。 |
| `newValue` | `.new_value(..)` | `string` | | 新文字。 |
| `patch` | `.patch(..)` | `string` | | 一個或多個檔案的 unified diff，在未設定 `oldValue` 和 `newValue` 時顯示。 |
| `language` | `.language(..)` | `string` | 純文字（patch：各檔案自身的語言） | 語言的名稱、別名、副檔名或檔案名稱。 |
| `layout` | `.layout(..)` | `"split" \| "unified"` | `"split"` | 並排顯示或單欄顯示。 |
| `inline` | `.inline(..)` | `"wordAlt" \| "word" \| "char" \| "none"` | `"wordAlt"` | 變更行內要醒目標示的內容。 |
| `indicators` | `.indicators(..)` | `"bars" \| "classic" \| "none"` | `"bars"` | 變更行在行號旁的標記方式。 |
| `contextLines` | `.context_lines(..)` | `number` | `3` | 每個變更周圍顯示的未變更行。 |
| `expandAll` | `.expand_all(..)` | `boolean` | `false` | 顯示所有未變更的行。 |
| `lineNumbers` | `.line_numbers(..)` | `boolean` | `true` | 行號。 |
| `background` | `.background(..)` | `boolean` | `true` | 變更行是否套用底色。 |
| `fontFamily` | `.font_family(..)` | `string` | 主題的 `font-mono` | 文字的字型。 |
| `fontSize` | `.font_size(..)` | `number` | `13` | 字型大小，單位為 point。 |
| `lineHeight` | `.line_height(..)` | `number` | `20` | 每列的高度，單位為 point。 |
| `renderSeparator` | `.render_separator(..)` | `(separator: DiffSeparator) => JSX.Element` | | 繪製已收合行的分隔列。 |
| `renderHunkActions` | `.render_hunk_actions(..)` | `(hunk: DiffHunk) => JSX.Element` | | app 針對每個變更提供的動作。 |
| `softWrap` | `.soft_wrap(..)` | `boolean` | `false` | 過長的行會依該側的寬度換行。 |
| `annotations` | `.annotations(..)` | `DiffAnnotation[]` | `[]` | app 放在各行下方的內容：`{ id, side, line }`。 |
| `renderAnnotation` | `.render_annotation(..)` | `(annotation: DiffAnnotation) => JSX.Element` | | 在所屬行的下方繪製註解。 |
| `renderAddAnnotation` | `.render_add_annotation(..)` | `(range: DiffLineRange) => JSX.Element` | | app 提供的新增註解控制項，顯示在游標懸停的行以及最後一個被選取的行旁。 |
| `renderFileHeader` | `.render_file_header(..)` | `(file: DiffFile) => JSX.Element` | | 繪製 patch 中每個檔案的標頭，高度為一列。 |
| `classes` | `.classes(..)` | `DiffViewClasses` | `{}` | 依部位指定的 Tailwind classes。 |
| `styles` | `.styles(..)` | `DiffViewStyles` | `{}` | 依部位指定的行內樣式，優先於 classes。 |
| `class`、`style` | style methods | `string`、`StyleProp<ViewStyle>` | | view 的外框。 |

<a id="events"></a>

## 事件

| 事件 | Rust | 說明 |
|---|---|---|
| `onChange` | `.on_change(\|change: &DiffChange\| ..)` | 某個變更已被保留或還原：`{ change }`，目前的文字（`{ oldValue, newValue }`）。 |
| `onLineNumberPress` | `.on_line_number_press(\|line: &DiffLine\| ..)` | 按下了某個行號：`{ line }`，為 `{ side, line }`。 |
| `onLineSelectionChange` | `.on_line_selection_change(\|range: &Option<DiffLineRange>\| ..)` | 選取的行已變更：`{ range }`，為 `{ side, start, end }` 或 `null`。 |
| `onStatsChange` | `.on_stats_change(\|stats: &DiffStats\| ..)` | 計數已變更：`{ stats }`，為 `{ added, deleted, hunks }`。view 建立時會觸發一次，之後每當文字經 diff 得到不同的計數時會再次觸發，可用來顯示「+8 −8 · 5 changes」這類的一行文字。 |
| `onFileToggle` | `.on_file_toggle(\|file: &DiffFile\| ..)` | patch 中的某個檔案已被收合或展開（透過其標頭或 ref）：`{ file }`，目前的 `DiffFile`。 |
| `onScroll` | `.on_scroll(\|e: &DiffViewEvent\| ..)` | 列已捲動，或列或 viewport 的大小已變更：`{ offset, contentSize, size }`，與 `Scroll` 的相同（Rust 中為 `DiffViewEvent::Scroll(offset, content_size, size)`）。view 完成版面配置後會觸發一次，之後其中任一項變更時會再次觸發。 |
| `onHunkBoundsChange` | `.on_hunk_bounds_change(\|bounds: &Vec<DiffHunkBounds>\| ..)` | 變更在各列中的位置已改變：`{ hunkBounds }`，即 `hunkBounds()` 所給的清單。view 完成版面配置後會觸發一次，之後每當某個變更移動或改變大小時會再次觸發（無論列高是否維持不變），可用於繪製概覽標尺的標記。 |

<a id="related"></a>

## 相關內容

- [Editor](./editor.md)：程式碼編輯器，`DiffView` 使用它的語法色彩與語言。
- [TextView](./text-view.md)：Markdown 與 HTML 文件，適用於審查內容周圍的文字。
- [`nsh/base`](../modules/nsh-base.md)：其他基礎元件。
