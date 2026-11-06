---
title: "List"
description: "List 是建基於原生捲動視圖（native scroll view）的虛擬化及回收式清單元件，本文涵蓋其所有 props、事件及 ref 方法。"
order: 2.1
source_hash: 6aa08fac2fd24e8c
---


# List

`nsh` 匯出 `List`:一個建基於原生捲動視圖的虛擬化清單。只有靠近可視範圍的列才會存在,而它們的儲存格會在捲動時重用。哪些列存在、位置在哪、欄數、黏性標題和可視狀態,全部由原生層計算,因此捲動一個有一萬個項目的清單時,除了儲存格重用時會變動的列綁定外,不會執行任何 JS。

```ts
import { List, type ListProps, type ViewToken, type ViewabilityConfig } from "nsh";
```

指南請參閱 [Lists](../docs/lists.md),此元素的屬性請參閱 [`<List>`](../elements/list.md)。

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

### 列會被回收

`children` 是一個渲染**單一儲存格**的函式。它是每個儲存格執行一次,而不是每個項目執行一次:當儲存格捲出可視範圍後,會被重用於另一個項目,而 `item()` 和 `index()`(兩者都是 accessor)會隨之改變。請在 JSX 表達式(`{item().name}`)內讀取它們,這樣儲存格在重用時才會更新。

> [!WARNING]
> 不要把每個項目的狀態保存在列函式內建立的 signal 中:儲存格會被重用於其他項目,signal 會跟隨儲存格而不是項目。請將狀態保存在你的資料中,並以 id 作為鍵(例如用一個 signal 保存已選取 id 的 `Set`)。

<a id="props"></a>

## 屬性

`ListProps<T>` 結合了清單本身的屬性、與 `<Scroll>` 共用的捲動屬性,以及所有元素都接受的屬性,這些屬性會傳給清單的捲動視圖。

<a id="data-and-rendering"></a>

### 資料與渲染

| 屬性 | 類型 | 預設值 | 說明 |
|---|---|---|---|
| `each` | `readonly T[]` | (必填) | 項目。傳入 signal 的值(`each={items()}`)以跟隨變化;在可視列上方插入項目時,那些列會保持原位。 |
| `children` | `(item: () => T, index: () => number) => JSX.Element` | (必填) | 渲染一列(見上文)。 |
| `estimatedItemSize` | `number` | `50` | 尚未量度的列沿清單軸向的大小(以 point 為單位)。估算越接近,捲動指示器和 `scrollToIndex` 就越準確。 |
| `numColumns` | `number` | `1` | 每列的項目數(垂直清單):即網格。 |
| `horizontal` | `boolean` | `false` | 橫向捲動。 |
| `inverted` | `boolean` | `false` | 從末端開始排版,項目 0 在最後(聊天風格);一開始會捲動到末端,並在內容變化時保持與末端的距離。 |
| `stickyHeaderIndices` | `number[]` | | 捲過之後會黏附在起點的項目(單欄、非反向)。 |
| `header` | `ListSlot` | | 在項目之前渲染。 |
| `footer` | `ListSlot` | | 在項目之後渲染。 |
| `empty` | `ListSlot` | | 當 `each` 為空時,顯示此內容以取代項目。 |
| `separator` | `ListSlot` | | 在項目之間渲染(單欄)。 |
| `keyExtractor` | `(item: T, index: number) => string` | `item.key`、`item.id`或索引 | 項目在可視狀態 token 中的鍵。 |
| `initialScrollIndex` | `number` | | 在第一個影格之前捲動到此項目。 |
| `contentStyle` | `ListContentStyle` | | 內容的內距和間距:`padding`、`paddingHorizontal`、`paddingVertical`、`paddingTop`、`paddingRight`、`paddingBottom`、`paddingLeft`、`gap`、`rowGap`、`columnGap`(數字)。 |
| `contentClass` | `string` | | 以 class 指定的內容內距和間距(`p-*`、`gap-*`);`contentStyle` 的優先級高於它們。 |
| `style` | `StyleProp<ViewStyle>` | | 清單本身的樣式(請為它指定大小:`flex: 1` 或高度)。 |
| `testID` | `string` | | UI 測試用來找到清單捲動視圖的 id(`nsh test` 的 `id:`、XCUITest、UI Automator)。 |
| `ref` | `ListRef \| ((node: ListRef) => void)` | | 請參閱 [ref 方法](#ref-methods)。 |

`ListSlot` 是一個元件(`Header`)或一個元素(`<Header />`)。

<a id="loading-refreshing-and-viewability"></a>

### 載入、重新整理與可視狀態

| 屬性 | 類型 | 預設值 | 說明 |
|---|---|---|---|
| `onLoadMore` | `() => void` | | 當末端進入 `loadMoreThreshold` 個可視範圍長度之內時呼叫:載入更多。 |
| `loadMoreThreshold` | `number` | `1` | 距離末端多近(以可視範圍長度計)時觸發 `onLoadMore`。 |
| `onLoadMoreAtStart` | `() => void` | | 在使用者或捲動指令移動清單後,當起點進入 `loadMoreAtStartThreshold` 個可視範圍長度之內時呼叫:載入第一個項目之前的內容。 |
| `loadMoreAtStartThreshold` | `number` | `1` | 距離起點多近(以可視範圍長度計)時觸發 `onLoadMoreAtStart`。 |
| `refreshing` | `boolean` | | 顯示下拉重新整理的轉圈圖示。 |
| `onRefresh` | `() => void` | | 啟用下拉重新整理;載入期間請設定 `refreshing`。 |
| `refreshIndicator` | `{ height: number }` | | 應用程式自行繪製下拉重新整理指示器,高度為 `height`,以取代轉圈圖示。 |
| `pullValue` | `AnimatedValue` | | 接收清單被下拉超過頂部的距離,供該指示器使用。 |
| `onViewableItemsChange` | `(info: { viewableItems: ViewToken<T>[]; changed: ViewToken<T>[] }) => void` | | 變為可視或不再可視的項目。 |
| `viewabilityConfig` | `ViewabilityConfig` | | 項目何時算作可視。 |

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

| 屬性 | 類型 | 預設值 | 說明 |
|---|---|---|---|
| `scrollbar` | `boolean \| ScrollbarTheme` | `true` | 顯示捲動指示器:使用平台的指示器,或應用程式的[內建捲動條](../elements/scrollbar.md#built-in-bars);物件則是視圖自身的主題。 |
| `scrollable` | `boolean` | `true` | 使用者可以捲動。 |
| `bounces` | `boolean` | `true` | 超出邊緣的過度捲動。 |
| `pagingEnabled` | `boolean` | `false` | 停在可視範圍的倍數位置。 |
| `snapToInterval` | `number` | `0` | 停在此長度的倍數位置(0:關閉)。 |
| `snapToOffsets` | `number[]` | | 停在這些偏移位置。 |
| `snapToAlignment` | `"start" \| "center" \| "end"` | `"start"` | 配合 `snapToInterval` 時,項目的哪個點與可視範圍對齊。 |
| `disableIntervalMomentum` | `boolean` | `false` | 一次快速滑動最多只移動一個吸附點。 |
| `decelerationRate` | `"normal" \| "fast" \| number` | 平台預設 | 快速滑動減速的快慢(`0.998` / `0.99`,或每毫秒保留的速度)。 |
| `contentInset` | `Partial<Edges>` | | 內容四周的空間。 |
| `contentOffset` | `{ x?, y? }` | | 起始位置。 |
| `keyboardShouldPersistTaps` | `"never" \| "always" \| "handled" \| boolean` | `"never"` | 點按是否會收起鍵盤(`"never"`:點按只會收起鍵盤)。 |
| `keyboardDismissMode` | `"none" \| "on-drag" \| "interactive"` | `"none"` | 拖曳是否會收起鍵盤。 |
| `scrollEventThrottle` | `number` | | `onScroll` 事件之間的最短間隔(毫秒)(無論如何每個影格最多一次)。 |
| `scrollValue` | `AnimatedValue` | | 一個[動畫值](./nsh.md#animation),在 UI 執行緒上接收捲動偏移(主軸),用於與捲動連動的效果。 |

<a id="scroll-events"></a>

### 捲動事件

| 事件 | 載荷 | 時機 |
|---|---|---|
| `onScroll` | `ScrollEvent`:`{ offset, contentSize, size, zoomScale }` | 捲動期間。 |
| `onScrollDragStart` | `{ offset }` | 開始拖曳。 |
| `onScrollDragEnd` | `{ offset }` | 手指離開。 |
| `onMomentumStart` | `{ offset }` | 拖曳之後開始滑行。 |
| `onMomentumEnd` | `{ offset }` | 滑行結束(新的拖曳接住它時也會觸發)。 |
| `onScrollEnd` | `{ offset }` | 捲動停止。 |

清單也接受所有元素都接受的屬性([通用屬性](../elements/index.md))。

<a id="ref-methods"></a>

## Ref 方法

清單的 `ref` 會接收一個 `ListRef`,除了 `ViewRef` 的方法外,還有以下方法:

| 方法 | 說明 |
|---|---|
| `scrollToIndex({ index, animated?, viewPosition?, viewOffset? })` | 將項目 `index` 捲動到可視範圍內。`viewPosition` 決定放置位置:`0` 在可視範圍起點(預設)、`0.5` 在中間、`1` 在末端;`viewOffset` 可進一步偏移。以已量度(或估算)的列大小在原生層解析。 |
| `scrollToOffset({ offset, animated? })` | 沿清單軸向捲動到某個內容偏移位置。 |
| `scrollToEnd({ animated? })` | 捲動到內容末端(反向清單則是起點)。 |
| `scrollTo({ x?, y?, animated? })` | 捲動到某個偏移位置。 |

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

聊天:最新訊息在底部,向上捲動時載入較舊的訊息。

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

下拉重新整理:

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

`ListProps` 中負責資料與列的一半:當你有自己的元件,並由它自行排版清單時(例如一個以自訂內距和分隔線包裝 `List` 的設定清單),就是傳入這些屬性。
