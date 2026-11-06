---
title: "List"
description: "支援虛擬化與項目回收的清單元件：資料列、資料欄、黏性標頭、反向聊天清單、可見性偵測，以及捲動至指定項目。"
order: 50
group: primitives
demo: el-list
---

# List

`List` 用來顯示很長或沒有上限的資料。只有靠近可視區域（viewport）的列才會存在：使用者捲動時，離開的列會被回收，用來顯示進入的列。哪些列存在、它們的位置、欄數、黏性標頭（sticky header）以及可見性（viewability）全都在原生端計算，因此捲動數千個項目的清單，成本與捲動二十個項目相同。Rust 使用 `virtual_list(count, |at| row)` 建立，TSX 則使用來自 `nsh` 的 `<List>`。

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

在 TSX 中，`List` 是泛型：`List<T>` 會檢查 `each` 與列函式的項目型別是否一致，而該型別由 TypeScript 從 `each` 推斷（參見 [List API](../modules/nsh-list.md)）。在 Rust 中，`virtual_list` 接受列數（可以是值、signal 或閉包：清單會就地增減）以及在某個 `Position` 建立該列的函式；各列透過 `at.index()` 讀取元件的資料。

若是所有列都應該存在的短清單（設定頁面、表單），在[捲動檢視](./scroll.md)中使用 [`Each`](./control-flow.md) 會更簡單。若要使用分組表格樣式的清單，請參見[設定樣式的清單](../docs/lists.md#a-settings-style-list)。[清單指南](../docs/lists.md)涵蓋各種模式：無限載入、聊天、分段。

<a id="rows-are-recycled"></a>

## 列會被回收

列函式是每個儲存格執行一次，而不是每個項目執行一次。當儲存格被重複用於另一個項目時，它的位置會改變（TSX：`item()` 與 `index()` 存取器；Rust：`at.index()`），所有讀取該位置的內容也會隨之更新：

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

因此，請把每個項目的狀態保存在你的資料中（以 id 為鍵），而不要放在列函式內建立的 signal 裡：這類 signal 會留在儲存格上，並出現在另一個項目上。

等待下一個項目的儲存格，在其列消失或已由另一個儲存格顯示時會被隱藏，因此螢幕閱讀器、觸控與 UI 測試對每一列只會遇到一次。

## Props

| 屬性 | Rust | 型別 | 預設值 | 說明 |
|---|---|---|---|---|
| `each` | `virtual_list(count, ..)` | `readonly T[]` | | 項目。 |
| `children` | `virtual_list(.., \|at\| row)` | `(item: () => T, index: () => number) => JSX.Element` | | 渲染單一列。 |
| `estimatedItemSize` | `.estimated_item_size(px(..))` | `number` | `50` | 尚未測量的項目大小，單位為 point。接近的估計值可讓捲軸保持穩定。 |
| `horizontal` | `.horizontal()` | `boolean` | `false` | 橫向捲動。 |
| `viewport` | `.viewport(ListViewport::..)` | `"own" \| "parent"` | `"own"` | `"own"`：清單在自己的捲動檢視中捲動。`"parent"`：清單以完整長度置於父層的版面中，並渲染其外層捲動檢視可視區域附近的列，由該捲動檢視連同頁面其餘內容一起捲動（參見[頁面中的清單](../docs/lists.md#lists-in-a-page-viewportparent)）。於建立清單時選定。 |
| `numColumns` | `.columns(n)` | `number` | `1` | 每列的項目數（垂直清單）。 |
| `inverted` | `.inverted()` | `boolean` | `false` | 從末端開始排版，項目 0 在最後（聊天樣式）：一開始會捲動到末端，且在內容變動時保持與末端的距離。 |
| `maintainVisibleContentPosition` | `.follow_end(px(threshold))` | `{ autoscrollToBottomThreshold?: number }` | | 適用於未反向的清單：位於內容末端，或距末端在該點數以內時，內容增長或可視區域縮小，清單都會停留在末端；若已往上捲動更遠，則保持目前可見的內容不動。 |
| `stickyHeaderIndices` | `.sticky_header_indices([..])` | `number[]` | | 捲過之後會黏在起點的項目（單欄、未反向）。 |
| `contentStyle` | `.content_padding(..)`、`.content_padding_x(..)`、`.row_gap(..)`、`.column_gap(..)`、… | `ListContentStyle` | | 內容的內距與間距，單位為 point：`padding`、`paddingHorizontal`、`paddingVertical`、`paddingTop`、`paddingRight`、`paddingBottom`、`paddingLeft`、`gap`、`rowGap`、`columnGap`。 |
| `contentClass` | | `string` | | 以 class 表示的內容內距與間距（`p-*`、`gap-*`）；`contentStyle` 的優先順序高於它們。 |
| `header` | `.header(el)` | `ListSlot` | | 位於項目之前：元件（`Header`）或元素（`<Header />`）。 |
| `footer` | `.footer(el)` | `ListSlot` | | 位於項目之後。 |
| `empty` | `.empty(el)` | `ListSlot` | | 當 `each` 為空時，顯示此內容以取代項目。 |
| `separator` | `.separator(\|\| el)` | `ListSlot` | | 項目之間（單欄）。 |
| `initialScrollIndex` | `.initial_scroll_index(i)` | `number` | | 在第一個影格之前捲動到此項目。 |
| `keyExtractor` | `.keys(\|\| ids)` | `(item: T, index: number) => string` | `item.key`、`item.id`或索引 | 項目在可見性 token 中的鍵值。在 Rust 中則是各列的身分識別，因此在其前方的列增減時，各列仍保有其儲存格與大小。 |
| `onLoadMore` | `.on_load_more(..)` | `() => void` | | 接近末端：載入更多。 |
| `loadMoreThreshold` | `.load_more_threshold(viewports)` | `number` | `1` | 距離末端多近（以可視區域為單位）時觸發 `onLoadMore`。 |
| `onLoadMoreAtStart` | `.on_load_more_at_start(..)` | `() => void` | | 接近起點，且在使用者或捲動指令移動清單之後：載入第一個項目之前的內容。 |
| `loadMoreAtStartThreshold` | `.load_more_at_start_threshold(viewports)` | `number` | `1` | 距離起點多近（以可視區域為單位）時觸發 `onLoadMoreAtStart`。 |
| `onViewableItemsChange` | `.on_viewable_items_change(..)` | `(info: { viewableItems: ViewToken<T>[]; changed: ViewToken<T>[] }) => void` | | 項目變為可見或不再可見。 |
| `viewabilityConfig` | `.viewability(..)`、`.minimum_view_time(..)` | `ViewabilityConfig` | | 項目何時算作可見（見下方）。 |
| `refreshing` | `.refreshing(..)` | `boolean` | | 顯示下拉重新整理的轉圈圖示。 |
| `onRefresh` | `.on_refresh(..)` | `() => void` | | 使用者下拉以重新整理。 |
| `refreshIndicator` | `.refresh_indicator(Some(height))` | `{ height: number }` | | 應用程式自行繪製指示器，高度為 `height` point：平台的轉圈圖示會隱藏，下拉達到 `height` 時即觸發重新整理，重新整理期間會在內容上方保留 `height`。高度為 0 或更小則表示不使用。 |
| `pullValue` | `.pull_value(&value)` | `AnimatedValue` | | 動畫值，傳入清單被下拉超過頂端的距離（靜止時為 0，隨下拉增加；重新整理期間保留在內容上方的空間：`height` 搭配 `refreshIndicator`），供應用程式的指示器使用。 |
| `scrollbar` | `.scrollbar(..)` | `boolean \| ScrollbarTheme` | `true` | 顯示捲動指示器：使用平台的指示器，或在應用程式設定了主題後使用[內建捲軸](./scrollbar.md#built-in-bars)；傳入物件則是該檢視專屬的主題。在桌面與桌面瀏覽器上，橫向檢視會保留它：它就是滑鼠使用的捲軸。 |
| `scrollValue` | `.scroll_value(&value)` | `AnimatedValue` | | 動畫值，傳入捲動偏移量，用於與捲動連動的動畫。 |
| `keyboardDismissMode` | `.keyboard_dismiss_mode(..)` | `"none" \| "on-drag" \| "interactive"` | `"none"` | 拖曳時是否收起鍵盤。 |
| `style` | `Styled` 方法 | `StyleProp<ViewStyle>` | | 清單本身的樣式（需要有限的大小：`flex: 1` 或高度）。 |
| `testID` | `.test_id(id)` | `string` | | UI 測試用來找到清單捲動檢視的 id（`nsh test` 的 `id:`、XCUITest、UI Automator）。 |
| `ref` | `.element_ref(&handle)` | `ListRef \| (node: ListRef) => void` | | 清單的 ref（參見 [ref 方法](#ref-methods)）。 |

清單也接受 [`Scroll`](./scroll.md#scrolling) 的捲動 props（Rust 中為 `Scrollable` 方法）：`pagingEnabled`、`snapToInterval`、`snapToOffsets`、`snapToAlignment`、`disableIntervalMomentum`、`decelerationRate`、`bounces`、`contentInset`、`contentOffset`、`keyboardShouldPersistTaps`、`scrollEventThrottle` 與 `scrollable`。清單會保留其縮放比例。

每個元素都接受的 props（[通用 props](./index.md#common-props)）會原樣傳給清單的捲動檢視：`testID`、`accessibilityLabel` 與其他無障礙 props、樣式、`onLayout`、觸控與 responder props。UI 測試會像尋找其他檢視一樣，透過 `testID` 找到清單。

`ViewabilityConfig`（Rust：`Viewability { item_visible_threshold, view_area_coverage_threshold }` 與 `.minimum_view_time(..)`）：

| 欄位 | 型別 | 說明 |
|---|---|---|
| `itemVisibleThreshold` | `number` | 項目必須有多少部分可見，從 0 到 1。 |
| `viewAreaCoverageThreshold` | `number` | 項目必須覆蓋多少可視區域，從 0 到 1。兩個門檻都未設定時，只要有任何可見像素就算數。 |
| `minimumViewTime` | `number` | 項目必須持續可見多少毫秒才會被回報。 |

`ViewToken<T>` 是 `{ item, key, index, isViewable }`。Rust 的監聽器會收到 `ViewableItems`：`indices()` 是可見列的範圍，`changed()` 是進入或離開的列。

<a id="events"></a>

## 事件

| 事件 | Rust | 負載 | 時機 |
|---|---|---|---|
| `onScroll` | `.on_scroll` | `ScrollEvent` | 偏移量改變。 |
| `onScrollDragStart` / `onScrollDragEnd` | `.on_scroll_drag_start` / `.on_scroll_drag_end` | `{ offset }` | 開始／停止拖曳。 |
| `onMomentumStart` / `onMomentumEnd` | `.on_momentum_start` / `.on_momentum_end` | `{ offset }` | 開始／停止滑行。 |
| `onScrollEnd` | `.on_scroll_end` | `{ offset }` | 捲動靜止。 |
| `onLoadMore` | `.on_load_more` | 無 | 距離末端 `loadMoreThreshold` 個可視區域以內。 |
| `onLoadMoreAtStart` | `.on_load_more_at_start` | 無 | 距離起點 `loadMoreAtStartThreshold` 個可視區域以內，捲動後每次接近只觸發一次。 |
| `onViewableItemsChange` | `.on_viewable_items_change` | `{ viewableItems, changed }`（`ViewableItems`） | 可見性改變。 |
| `onRefresh` | `.on_refresh` | 無 | 下拉重新整理。 |

<a id="ref-methods"></a>

## Ref 方法

| 方法 | Rust | 說明 |
|---|---|---|
| `scrollToIndex({ index, animated?, viewPosition?, viewOffset? })` | `scroll_to_index(index, percentage(0.5), px(0.0), animated)` | 將項目 `index` 捲動到可見範圍內。`viewPosition` 決定其位置：0 為可視區域起點（預設）、0.5 為中間、1 為末端；`viewOffset` 可進一步位移。以目前（已測量或估計）的項目大小在原生端解算。 |
| `scrollToOffset({ offset, animated? })` | `scroll_to_offset(px(..), animated)` | 捲動到沿清單軸向的某個偏移量。 |
| `scrollToEnd({ animated? })` | `scroll_to_end(animated)` | 捲動到內容末端（反向清單則為起點）。 |
| `scrollTo({ x?, y?, animated? })` | `scroll_to(point(..), animated)` | 捲動到某個偏移量。 |

<a id="examples"></a>

## 範例

具有標頭與可見性的格狀清單：

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

項目 0 是最新的訊息，繪製在底部；新訊息加到項目前端時會出現，且不會移動使用者正在閱讀的內容。

<a id="platform-notes"></a>

## 平台備註

- 在可見列上方插入項目時，兩個平台上的可見列都會保持原位。
- 由右至左版面中的橫向清單會在原生端鏡像。
- 黏性標頭在每個捲動影格都由原生端固定。
