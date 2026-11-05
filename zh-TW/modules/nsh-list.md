---
title: "List"
description: "List 是建立在原生捲動檢視之上、支援虛擬化與項目回收的清單元件，涵蓋其所有屬性、事件與 ref 方法。"
order: 2.1
source_hash: 6aa08fac2fd24e8c
---

# List

`nsh` 匯出 `List`：建立在原生捲動視圖上的虛擬化列表。只有靠近可視區域的列會存在，其儲存格會在捲動時重複使用。哪些列存在、位於何處、欄數、黏性標題和可見性，全都在原生端計算，因此捲動一萬個項目的列表時，除了儲存格被重複使用時會變動的列綁定之外，不會執行任何 JS。

```ts
import { List, type ListProps, type ViewToken, type ViewabilityConfig } from "nsh";
```

指南請參閱[列表](../docs/lists.md)，元素的屬性請參閱 [`<List>`](../elements/list.md)。

<a id="list-1"></a>

## List

```ts
function List<T>(props: ListProps<T>): JSX.Element;
```

```tsx
import { List, mount, Text, View } from "nsh";

const contacts = Array.from({ length: 1000 }, (_, i) => ({ id: String(i), name: `Contact ${i}` }));

function App() {
  return (
    <List each={contacts} estimatedItemSize={48} style={{ flex: 1 }}>
      {(item, index) => (
        <View style={{ height: 48, paddingHorizontal: 16, justifyContent: "center", backgroundColor: index() % 2 ? "#f8fafc" : "#fff" }}>
          <Text>{item().name}</Text>
        </View>
      )}
    </List>
  );
}

mount(App);
```

<a id="rows-are-recycled"></a>

### 列會被回收再利用

`children` 是渲染**單一儲存格**的函式。它是每個儲存格執行一次，而不是每個項目執行一次：當儲存格捲出可視範圍時，會被重複使用來顯示另一個項目，此時 `item()` 與 `index()`（兩者皆為存取器）會改變。請在 JSX 運算式（`{item().name}`）內讀取它們，讓儲存格在被重複使用時能夠更新。

> [!WARNING]
> 請勿將每個項目的狀態保存在列函式內建立的 signal 中：儲存格會被重複使用於其他項目，signal 會跟著儲存格走，而不是跟著項目走。請將狀態放在資料中，並以 id 作為索引鍵（例如，用一個 signal 存放已選取 id 的 `Set`）。

<a id="props"></a>

## 屬性

`ListProps<T>` 結合了列表本身的屬性、與 `<Scroll>` 共用的捲動屬性，以及所有元素都適用的屬性，這些屬性會傳給列表的捲動視圖。

<a id="data-and-rendering"></a>

### 資料與渲染

| 屬性 | 型別 | 預設值 | 說明 |
|---|---|---|---|
| `each` | `readonly T[]` | （必填） | 項目。傳入 signal 的值（`each={items()}`）即可追蹤變更；在可視列上方插入項目時，這些列會保持在原位。 |
| `children` | `(item: () => T, index: () => number) => JSX.Element` | （必填） | 渲染一列（見上文）。 |
| `estimatedItemSize` | `number` | `50` | 尚未測量之列沿列表軸向的尺寸，單位為 point。估計值越接近，捲動指示器與 `scrollToIndex` 就越準確。 |
| `numColumns` | `number` | `1` | 每列的項目數（垂直列表）：即網格。 |
| `horizontal` | `boolean` | `false` | 橫向捲動。 |
| `inverted` | `boolean` | `false` | 從末端開始排版，項目 0 排在最後（聊天樣式）；一開始會捲動到末端，並在內容變動時保持與末端的距離。 |
| `stickyHeaderIndices` | `number[]` | | 捲動經過後會黏在起始位置的項目（單欄、非反向）。 |
| `header` | `ListSlot` | | 渲染於項目之前。 |
| `footer` | `ListSlot` | | 渲染於項目之後。 |
| `empty` | `ListSlot` | | 當 `each` 為空時，顯示此內容以取代項目。 |
| `separator` | `ListSlot` | | 渲染於項目之間（單欄）。 |
| `keyExtractor` | `(item: T, index: number) => string` | `item.key`、`item.id`，或索引 | 項目在可見性權杖中的索引鍵。 |
| `initialScrollIndex` | `number` | | 在第一個畫面之前捲動到此項目。 |
| `contentStyle` | `ListContentStyle` | | 內容的內距與間距：`padding`、`paddingHorizontal`、`paddingVertical`、`paddingTop`、`paddingRight`、`paddingBottom`、`paddingLeft`、`gap`、`rowGap`、`columnGap`（數字）。 |
| `contentClass` | `string` | | 以 class 指定內容的內距與間距（`p-*`、`gap-*`）；`contentStyle` 的優先順序高於它們。 |
| `style` | `StyleProp<ViewStyle>` | | 列表本身的樣式（請給它一個尺寸：`flex: 1` 或高度）。 |
| `testID` | `string` | | UI 測試用來尋找列表捲動視圖的 id（`nsh test` 的 `id:`、XCUITest、UI Automator）。 |
| `ref` | `ListRef \| ((node: ListRef) => void)` | | 請參閱 [ref 方法](#ref-methods)。 |

`ListSlot` 是元件（`Header`）或元素（`<Header />`）。

<a id="loading-refreshing-and-viewability"></a>

### 載入、重新整理與可見性

| 屬性 | 型別 | 預設值 | 說明 |
|---|---|---|---|
| `onLoadMore` | `() => void` | | 當末端進入 `loadMoreThreshold` 個可視區域範圍內時呼叫：載入更多。 |
| `loadMoreThreshold` | `number` | `1` | `onLoadMore` 在距離末端多近時觸發（以可視區域長度為單位）。 |
| `onLoadMoreAtStart` | `() => void` | | 在使用者或捲動指令移動列表後，當起始處進入 `loadMoreAtStartThreshold` 個可視區域範圍內時呼叫：載入第一個項目之前的內容。 |
| `loadMoreAtStartThreshold` | `number` | `1` | `onLoadMoreAtStart` 在距離起始處多近時觸發（以可視區域長度為單位）。 |
| `refreshing` | `boolean` | | 顯示下拉重新整理的轉圈指示器。 |
| `onRefresh` | `() => void` | | 啟用下拉重新整理；載入期間請設定 `refreshing`。 |
| `refreshIndicator` | `{ height: number }` | | 應用程式自行繪製下拉重新整理指示器，高度為 `height`，用來取代轉圈指示器。 |
| `pullValue` | `AnimatedValue` | | 接收列表被下拉超過頂端的距離，供該指示器使用。 |
| `onViewableItemsChange` | `(info: { viewableItems: ViewToken<T>[]; changed: ViewToken<T>[] }) => void` | | 變為可見或不再可見的項目。 |
| `viewabilityConfig` | `ViewabilityConfig` | | 項目何時被視為可見。 |

```ts
interface ViewToken<T> {
  item: T;
  key: string;
  index: number;
  isViewable: boolean;
}

interface ViewabilityConfig {
  /** How much of the viewport an item must cover to count as viewable, from 0 to 1. */
  viewAreaCoverageThreshold?: number;
  /** How much of an item must be visible, from 0 to 1. Without either threshold, any visible pixel counts. */
  itemVisibleThreshold?: number;
  /** Milliseconds items must stay viewable before they are reported. */
  minimumViewTime?: number;
}
```

<a id="scrolling"></a>

### 捲動

| 屬性 | 型別 | 預設值 | 說明 |
|---|---|---|---|
| `scrollbar` | `boolean \| ScrollbarTheme` | `true` | 顯示捲動指示器：使用平台的指示器，或應用程式的[內建捲軸](../elements/scrollbar.md#built-in-bars)；傳入物件則為視圖自身的主題。 |
| `scrollable` | `boolean` | `true` | 使用者可以捲動。 |
| `bounces` | `boolean` | `true` | 允許捲動超出邊緣（過度捲動）。 |
| `pagingEnabled` | `boolean` | `false` | 停在可視區域的整數倍位置。 |
| `snapToInterval` | `number` | `0` | 停在此長度的整數倍位置（0：關閉）。 |
| `snapToOffsets` | `number[]` | | 停在這些位移量上。 |
| `snapToAlignment` | `"start" \| "center" \| "end"` | `"start"` | 使用 `snapToInterval` 時，項目的哪一個點會與可視區域對齊。 |
| `disableIntervalMomentum` | `boolean` | `false` | 一次快速滑動最多只移動一個停駐點。 |
| `decelerationRate` | `"normal" \| "fast" \| number` | 平台預設 | 快速滑動減速的快慢（`0.998` / `0.99`，或每毫秒保留的速度）。 |
| `contentInset` | `Partial<Edges>` | | 內容周圍的空間。 |
| `contentOffset` | `{ x?, y? }` | | 起始位置。 |
| `keyboardShouldPersistTaps` | `"never" \| "always" \| "handled" \| boolean` | `"never"` | 點一下是否會收起鍵盤（`"never"`：點一下只會收起鍵盤）。 |
| `keyboardDismissMode` | `"none" \| "on-drag" \| "interactive"` | `"none"` | 拖曳是否會收起鍵盤。 |
| `scrollEventThrottle` | `number` | | `onScroll` 事件之間的最小毫秒數（無論如何每個畫面最多一次）。 |
| `scrollValue` | `AnimatedValue` | | 在 UI 執行緒上以捲動位移量（主軸）驅動的[動畫值](./nsh.md#animation)，用於與捲動連動的效果。 |

<a id="scroll-events"></a>

### 捲動事件

| 事件 | 負載 | 時機 |
|---|---|---|
| `onScroll` | `ScrollEvent`: `{ offset, contentSize, size, zoomScale }` | 捲動期間。 |
| `onScrollDragStart` | `{ offset }` | 開始拖曳。 |
| `onScrollDragEnd` | `{ offset }` | 手指抬起。 |
| `onMomentumStart` | `{ offset }` | 拖曳之後開始滑行。 |
| `onMomentumEnd` | `{ offset }` | 滑行結束（新的拖曳攔下滑行時也會觸發）。 |
| `onScrollEnd` | `{ offset }` | 捲動靜止。 |

列表也接受所有元素都適用的屬性（[通用屬性](../elements/index.md)）。

<a id="ref-methods"></a>

## Ref 方法

列表的 `ref` 會收到一個 `ListRef`，除了 `ViewRef` 的方法之外，還有以下方法：

| 方法 | 說明 |
|---|---|
| `scrollToIndex({ index, animated?, viewPosition?, viewOffset? })` | 將項目 `index` 捲動到可視範圍內。`viewPosition` 決定其位置：`0` 位於可視區域起始處（預設）、`0.5` 位於中間、`1` 位於末端；`viewOffset` 可進一步位移。以已測量（或估計）的列尺寸在原生端解算。 |
| `scrollToOffset({ offset, animated? })` | 沿列表軸向捲動到內容位移量。 |
| `scrollToEnd({ animated? })` | 捲動到內容末端（反向列表則為起始處）。 |
| `scrollTo({ x?, y?, animated? })` | 捲動到某個位移量。 |

```tsx
import { List, type ListRef, Text, View } from "nsh";

let list!: ListRef;

<View style={{ flex: 1 }}>
  <Text onPress={() => list.scrollToIndex({ index: 60, viewPosition: 0.5 })}>Jump to 60</Text>
  <List ref={list} each={items} numColumns={3} estimatedItemSize={90} style={{ flex: 1 }}
        contentStyle={{ padding: 12, gap: 8 }}>
    {(item) => <View style={{ height: 90, backgroundColor: "#e0e7ff" }}><Text>{item().title}</Text></View>}
  </List>
</View>
```

<a id="examples"></a>

## 範例

聊天：最新訊息在底部，向上捲動時載入較舊的訊息。

```tsx
<List
  each={messages()}
  inverted
  estimatedItemSize={44}
  style={{ flex: 1 }}
  contentStyle={{ padding: 12, gap: 6 }}
  keyboardDismissMode="interactive"
  onLoadMore={loadOlder}
  loadMoreThreshold={0.5}
>
  {(m) => (
    <View style={{ alignSelf: m().mine ? "flex-end" : "flex-start", maxWidth: "75%", padding: 10, borderRadius: 14, backgroundColor: m().mine ? "#6366f1" : "#e2e8f0" }}>
      <Text style={{ color: m().mine ? "#fff" : "#0f172a" }}>{m().text}</Text>
    </View>
  )}
</List>
```

下拉重新整理：

```tsx
const refreshing = signal(false);
const refresh = async () => {
  refreshing.set(true);
  items.set(await load());
  refreshing.set(false);
};

<List each={items()} refreshing={refreshing()} onRefresh={refresh} style={{ flex: 1 }}>
  {(item) => <Text style={{ padding: 16 }}>{item().title}</Text>}
</List>
```

## ListItemsProps

```ts
type ListItemsProps<T> = Pick<ListProps<T>,
  "each" | "children" | "keyExtractor" | "stickyHeaderIndices" | "initialScrollIndex"
  | "onViewableItemsChange" | "viewabilityConfig" | "refreshing" | "onRefresh"
  | "onLoadMore" | "loadMoreThreshold"
  | "header" | "footer" | "empty">;
```

這是 `ListProps` 中負責資料與列的部分：當你自己的元件要自行排版列表時，就傳入這些屬性，例如以自訂內距與分隔線包裝 `List` 的設定列表。
