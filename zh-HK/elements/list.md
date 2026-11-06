---
title: "List"
description: "虛擬化、可回收的列表:支援列、欄、固定標題、反向聊天列表、可見度偵測,以及捲動至指定項目。"
order: 50
group: primitives
demo: el-list
source_hash: 6e5480c9dd9e1df4
---


# List

`List` 顯示冗長或無上限的資料。只有視口附近的列才會存在：用戶捲動時，離開的列會被回收，供進入的列使用。哪些列存在、它們的位置、欄、置頂標題和可見性，全部由原生層計算，因此捲動數千個項目的列表，成本與捲動二十個項目的列表相同。Rust 用 `virtual_list(count, |at| row)` 建立列表，TSX 則使用來自 `nsh` 的 `<List>`。

```rust tabs
use nsh_core::prelude::*;

#[derive(Clone, PartialEq)]
struct Contact {
    id: usize,
    name: String,
}

fn app() -> impl IntoElement {
    let contacts = signal(
        (0..1000).map(|i| Contact { id: i, name: format!("Contact {}", i + 1) }).collect::<Vec<_>>(),
    );
    virtual_list(move || contacts.with(|c| c.len()), move |at| {
        view().h(px(56.0)).px_4().justify_center().child(
            text(move || contacts.with(|c| format!("{}. {}", at.index() + 1, c[at.index()].name)))
                .text_base(),
        )
    })
    .estimated_item_size(px(56.0))
    .flex_1()
}
```

```tsx tabs
import { List, mount, Text, View } from "nsh";

const contacts = Array.from({ length: 1000 }, (_, i) => ({ id: i, name: `Contact ${i + 1}` }));

function App() {
  return (
    <List each={contacts} estimatedItemSize={56} style={{ flex: 1 }}>
      {(contact, index) => (
        <View style={{ height: 56, paddingHorizontal: 16, justifyContent: "center" }}>
          <Text style={{ fontSize: 16 }}>
            {index() + 1}. {contact().name}
          </Text>
        </View>
      )}
    </List>
  );
}

mount(App);
```

在 TSX 中，`List` 是泛型：`List<T>` 會檢查 `each` 與列函數所用的項目類型是否一致，而 TypeScript 會從 `each` 推斷該類型（見 [List API](../modules/nsh-list.md)）。在 Rust 中，`virtual_list` 接受列數（可以是值、signal 或閉包：列表會原地增減），以及在 `Position` 建立該列的函數；各列透過 `at.index()` 讀取組件的資料。

對於所有列都應該存在的短列表（設定頁、表單），在 [scroll view](./scroll.md) 內放一個 [`Each`](./control-flow.md) 會更簡單。若要將列表設計成分組表格樣式，請參閱[設定風格列表](../docs/lists.md#a-settings-style-list)。[列表指南](../docs/lists.md)涵蓋各種模式：無限載入、聊天、分組。

<a id="rows-are-recycled"></a>

## 列會被回收

列函數是每個儲存格執行一次，而不是每個項目執行一次。當儲存格被重用於另一個項目時，其位置會改變（TSX：`item()` 和 `index()` accessor；Rust：`at.index()`），所有讀取它的內容也會隨之更新：

```rust tabs
virtual_list(move || messages.with(|m| m.len()), move |at| {
    text(move || messages.with(|m| m[at.index()].body.clone()))
})
```

```tsx tabs
<List each={messages()}>
  {(message) => <Text>{message().body}</Text>}
</List>
```

因此，請把每個項目的狀態放在你的資料中（以 id 為鍵），而不是放在列函數內建立的 signal：這類 signal 會留在儲存格上，並出現在另一個項目上。

等待下一個項目的儲存格，在其列消失或改由另一個儲存格顯示後會被隱藏，因此螢幕閱讀器、觸控和 UI 測試對每一列只會遇到一次。

<a id="props"></a>

## 屬性

| 屬性 | Rust | 類型 | 預設值 | 說明 |
|---|---|---|---|---|
| `each` | `virtual_list(count, ..)` | `readonly T[]` | | 項目。 |
| `children` | `virtual_list(.., \|at\| row)` | `(item: () => T, index: () => number) => JSX.Element` | | 渲染一列。 |
| `estimatedItemSize` | `.estimated_item_size(px(..))` | `number` | `50` | 尚未測量的項目的尺寸，單位為點。估算越接近，捲動條越穩定。 |
| `horizontal` | `.horizontal()` | `boolean` | `false` | 橫向捲動。 |
| `viewport` | `.viewport(ListViewport::..)` | `"own" \| "parent"` | `"own"` | `"own"`：列表在自己的捲動視圖中捲動。`"parent"`：列表以完整長度排在父層的版面中，並渲染外圍捲動視圖視口附近的列，由該捲動視圖連同頁面其餘部分一起捲動（見[頁面中的列表](../docs/lists.md#lists-in-a-page-viewportparent)）。於建立列表時選定。 |
| `numColumns` | `.columns(n)` | `number` | `1` | 每列的項目數（垂直列表）。 |
| `inverted` | `.inverted()` | `boolean` | `false` | 從末端開始排版，項目 0 排在最後（聊天風格）：起始時捲動至末端，並在內容變化時保持與末端的距離。 |
| `maintainVisibleContentPosition` | `.follow_end(px(threshold))` | `{ autoscrollToBottomThreshold?: number }` | | 適用於未反轉的列表：當位於內容末端或距離末端在該點數之內時，列表會在內容增長或視口縮小時停留在末端；若已向上捲動較遠，則保持目前可見的內容不變。 |
| `stickyHeaderIndices` | `.sticky_header_indices([..])` | `number[]` | | 捲過起點後會固定在起點的項目（單欄、未反轉）。 |
| `contentStyle` | `.content_padding(..)`、`.content_padding_x(..)`、`.row_gap(..)`、`.column_gap(..)`、… | `ListContentStyle` | | 內容的內距和間距，單位為點：`padding`、`paddingHorizontal`、`paddingVertical`、`paddingTop`、`paddingRight`、`paddingBottom`、`paddingLeft`、`gap`、`rowGap`、`columnGap`。 |
| `contentClass` | | `string` | | 以 class 形式設定內容的內距和間距（`p-*`、`gap-*`）；`contentStyle` 的優先權高於它們。 |
| `header` | `.header(el)` | `ListSlot` | | 位於項目之前：可以是組件（`Header`）或元素（`<Header />`）。 |
| `footer` | `.footer(el)` | `ListSlot` | | 位於項目之後。 |
| `empty` | `.empty(el)` | `ListSlot` | | 當 `each` 為空時，顯示此內容以取代項目。 |
| `separator` | `.separator(\|\| el)` | `ListSlot` | | 項目之間（單欄）。 |
| `initialScrollIndex` | `.initial_scroll_index(i)` | `number` | | 在第一個影格之前捲動至此項目。 |
| `keyExtractor` | `.keys(\|\| ids)` | `(item: T, index: number) => string` | `item.key`、`item.id` 或索引 | 項目在可見性 token 中的鍵。在 Rust 中，則是各列的識別，讓列在其前方的列增減時仍保留其儲存格和尺寸。 |
| `onLoadMore` | `.on_load_more(..)` | `() => void` | | 接近末端：載入更多。 |
| `loadMoreThreshold` | `.load_more_threshold(viewports)` | `number` | `1` | 距離末端多近（以視口計）時觸發 `onLoadMore`。 |
| `onLoadMoreAtStart` | `.on_load_more_at_start(..)` | `() => void` | | 在用戶或捲動指令移動列表後，接近起點：載入第一個項目之前的內容。 |
| `loadMoreAtStartThreshold` | `.load_more_at_start_threshold(viewports)` | `number` | `1` | 距離起點多近（以視口計）時觸發 `onLoadMoreAtStart`。 |
| `onViewableItemsChange` | `.on_viewable_items_change(..)` | `(info: { viewableItems: ViewToken<T>[]; changed: ViewToken<T>[] }) => void` | | 項目變為可見或不再可見。 |
| `viewabilityConfig` | `.viewability(..)`、`.minimum_view_time(..)` | `ViewabilityConfig` | | 項目何時算作可見（見下文）。 |
| `refreshing` | `.refreshing(..)` | `boolean` | | 顯示下拉刷新的轉圈指示器。 |
| `onRefresh` | `.on_refresh(..)` | `() => void` | | 用戶下拉刷新。 |
| `refreshIndicator` | `.refresh_indicator(Some(height))` | `{ height: number }` | | 應用程式自行繪製指示器，高度為 `height` 點：平台的轉圈指示器會被隱藏，下拉達到 `height` 時會刷新一次，刷新期間在內容上方保留 `height`。高度為 0 或以下表示不使用。 |
| `pullValue` | `.pull_value(&value)` | `AnimatedValue` | | 一個動畫值，其數值為列表被拉過頂部的距離（靜止時為 0，隨下拉增大；刷新期間保留在內容上方的空間：`height` 配合 `refreshIndicator`），供應用程式的指示器使用。 |
| `scrollbar` | `.scrollbar(..)` | `boolean \| ScrollbarTheme` | `true` | 顯示捲動指示器：使用平台的指示器，或在應用程式設定主題後使用[內建捲動條](./scrollbar.md#built-in-bars)；傳入物件則是該視圖專屬的主題。在桌面平台和桌面瀏覽器上，橫向視圖會保留它：它就是滑鼠的捲動條。 |
| `scrollValue` | `.scroll_value(&value)` | `AnimatedValue` | | 一個動畫值，其數值為捲動偏移量，供與捲動連動的動畫使用。 |
| `keyboardDismissMode` | `.keyboard_dismiss_mode(..)` | `"none" \| "on-drag" \| "interactive"` | `"none"` | 拖曳時是否收起鍵盤。 |
| `style` | `Styled` 方法 | `StyleProp<ViewStyle>` | | 列表自身的樣式（需要有限的尺寸：`flex: 1` 或高度）。 |
| `testID` | `.test_id(id)` | `string` | | UI 測試用來找到列表捲動視圖的 id（`nsh test` 的 `id:`、XCUITest、UI Automator）。 |
| `ref` | `.element_ref(&handle)` | `ListRef \| (node: ListRef) => void` | | 列表的 ref（見 [ref 方法](#ref-methods)）。 |

列表也接受 [`Scroll`](./scroll.md#scrolling) 的捲動屬性（Rust 中為 `Scrollable` 方法）：
`pagingEnabled`、`snapToInterval`、`snapToOffsets`、`snapToAlignment`、`disableIntervalMomentum`、`decelerationRate`、
`bounces`、`contentInset`、`contentOffset`、`keyboardShouldPersistTaps`、`scrollEventThrottle` 和 `scrollable`。
列表會保持其縮放比例。

每個元素都接受的屬性（[通用屬性](./index.md#common-props)）會原樣傳給列表的捲動視圖：
`testID`、`accessibilityLabel` 和其他無障礙屬性、樣式、`onLayout`，以及觸控和 responder 屬性。
UI 測試可以像尋找任何視圖一樣，透過 `testID` 找到列表。

`ViewabilityConfig`（Rust：`Viewability { item_visible_threshold, view_area_coverage_threshold }` 和 `.minimum_view_time(..)`）：

| 欄位 | 類型 | 說明 |
|---|---|---|
| `itemVisibleThreshold` | `number` | 項目必須有多少部分可見，範圍為 0 至 1。 |
| `viewAreaCoverageThreshold` | `number` | 項目必須覆蓋視口的多少部分，範圍為 0 至 1。若兩個門檻都沒有設定，則只要有任何一個像素可見即算可見。 |
| `minimumViewTime` | `number` | 項目必須保持可見多少毫秒後才會被回報。 |

`ViewToken<T>` 為 `{ item, key, index, isViewable }`。Rust 的監聽器會收到 `ViewableItems`：`indices()` 是可見列的範圍，`changed()` 是進入或離開的列。

<a id="events"></a>

## 事件

| 事件 | Rust | 負載 | 時機 |
|---|---|---|---|
| `onScroll` | `.on_scroll` | `ScrollEvent` | 偏移量改變。 |
| `onScrollDragStart` / `onScrollDragEnd` | `.on_scroll_drag_start` / `.on_scroll_drag_end` | `{ offset }` | 開始拖曳 / 停止拖曳。 |
| `onMomentumStart` / `onMomentumEnd` | `.on_momentum_start` / `.on_momentum_end` | `{ offset }` | 開始滑行 / 停止滑行。 |
| `onScrollEnd` | `.on_scroll_end` | `{ offset }` | 捲動靜止。 |
| `onLoadMore` | `.on_load_more` | 無 | 距離末端在 `loadMoreThreshold` 個視口之內。 |
| `onLoadMoreAtStart` | `.on_load_more_at_start` | 無 | 距離起點在 `loadMoreAtStartThreshold` 個視口之內，每次捲動後每次接近只觸發一次。 |
| `onViewableItemsChange` | `.on_viewable_items_change` | `{ viewableItems, changed }`（`ViewableItems`） | 可見性改變。 |
| `onRefresh` | `.on_refresh` | 無 | 已下拉刷新。 |

<a id="ref-methods"></a>

## Ref 方法

| 方法 | Rust | 說明 |
|---|---|---|
| `scrollToIndex({ index, animated?, viewPosition?, viewOffset? })` | `scroll_to_index(index, percentage(0.5), px(0.0), animated)` | 將項目 `index` 捲動至可見範圍。`viewPosition` 決定其位置：0 為視口起點（預設），0.5 為中間，1 為末端；`viewOffset` 可進一步位移。以目前（已測量或估算）的項目尺寸在原生層解析。 |
| `scrollToOffset({ offset, animated? })` | `scroll_to_offset(px(..), animated)` | 沿列表的軸向捲動至某個偏移量。 |
| `scrollToEnd({ animated? })` | `scroll_to_end(animated)` | 捲動至內容末端（反轉列表則為起點）。 |
| `scrollTo({ x?, y?, animated? })` | `scroll_to(point(..), animated)` | 捲動至某個偏移量。 |

<a id="examples"></a>

## 範例

帶有標題和可見性的網格：

```rust tabs
let visible = signal(SharedString::default());
let list = element_ref();

virtual_list(move || photos.with(|p| p.len()), move |at| {
    image(move || photos.with(|p| p[at.index()].url.clone())).h(px(120.0)).rounded(px(8.0))
})
.element_ref(&list)
.columns(3)
.estimated_item_size(px(120.0))
.content_padding(px(12.0))
.row_gap(px(8.0))
.column_gap(px(8.0))
.viewability(Viewability { item_visible_threshold: Some(Percentage(0.5)), ..Viewability::default() })
.on_viewable_items_change(move |items: &ViewableItems| {
    visible.set(format!("{} visible", items.indices().count()).into())
})
.header(
    text("Jump to 60")
        .on_press(move || list.scroll_to_index(60, percentage(0.5), px(0.0), true)),
)
.flex_1()
```

```tsx tabs
const visible = signal("");
let list!: ListRef;

<List
  ref={list}
  each={photos}
  numColumns={3}
  estimatedItemSize={120}
  contentStyle={{ padding: 12, gap: 8 }}
  viewabilityConfig={{ itemVisibleThreshold: 0.5 }}
  onViewableItemsChange={({ viewableItems }) => visible.set(`${viewableItems.length} visible`)}
  header={<Text onPress={() => list.scrollToIndex({ index: 60, viewPosition: 0.5 })}>Jump to 60</Text>}
  style={{ flex: 1 }}
>
  {(photo) => <Image src={photo().url} style={{ height: 120, borderRadius: 8 }} />}
</List>;
```

聊天：

```rust tabs
virtual_list(move || messages.with(|m| m.len()), move |at| bubble(messages, at))
    .keys(move || messages.with(|m| m.iter().map(|m| m.id).collect::<Vec<_>>()))
    .inverted()
    .estimated_item_size(px(64.0))
    .keyboard_dismiss_mode(KeyboardDismissMode::Interactive)
    .flex_1()
```

```tsx tabs
<List each={messages()} inverted estimatedItemSize={64} keyboardDismissMode="interactive" style={{ flex: 1 }}>
  {(m) => <Bubble message={m()} />}
</List>
```

項目 0 是最新的訊息，繪製在底部；加入到項目前端的新訊息會出現，而不會移動用戶正在閱讀的內容。

<a id="platform-notes"></a>

## 平台說明

- 在可見列上方插入項目時，兩個平台上的可見列都會保持原位。
- 在由右至左的版面中，橫向列表會由原生層鏡像處理。
- 置頂標題在每個捲動影格都由原生層固定。
