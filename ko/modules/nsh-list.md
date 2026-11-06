---
title: "List"
description: "네이티브 스크롤 뷰 기반의 가상화 및 재활용 리스트인 List의 모든 props, 이벤트, ref 메서드를 설명합니다."
order: 2.1
source_hash: 6aa08fac2fd24e8c
---

# List

`List`는 네이티브 스크롤 뷰 위에서 동작하는 가상화된 리스트입니다(`nsh`에서 export). 뷰포트 근처의 행만 존재하며, 셀은 스크롤할 때 재사용됩니다. 어떤 행이 존재하는지, 행의 위치, 열, 스티키 헤더, 가시성(viewability)은 모두 네이티브에서 계산되므로, 항목이 1만 개인 리스트를 스크롤해도 셀이 재사용될 때 바뀌는 행 바인딩 외에는 JS가 실행되지 않습니다.

```ts
import { List, type ListProps, type ViewToken, type ViewabilityConfig } from "nsh";
```

가이드는 [Lists](../docs/lists.md)를, 엘리먼트의 props는 [`<List>`](../elements/list.md)를 참고하세요.

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

### 행은 재활용됩니다

`children`는 **셀 하나**를 렌더링하는 함수입니다. 이 함수는 항목마다 한 번이 아니라 셀마다 한 번 실행됩니다. 셀이 화면 밖으로 스크롤되면 다른 항목에 재사용되고, `item()`와 `index()`(둘 다 accessor)이 변경됩니다. 셀이 재사용될 때 갱신되도록 JSX 표현식(`{item().name}`) 안에서 읽으세요.

> [!WARNING]
> 행 함수 안에서 생성한 signal에 항목별 상태를 보관하지 마세요. 셀은 다른 항목에 재사용되므로 signal은 항목이 아니라 셀을 따라갑니다. 상태는 id를 키로 하여 데이터에 보관하세요(예: 선택된 id의 `Set`을 담은 signal).

## Props

`ListProps<T>`는 리스트 자체의 props, `<Scroll>`와 공유하는 스크롤 props, 그리고 모든 엘리먼트가 받는 props를 합친 것입니다. 이 props는 리스트의 스크롤 뷰에 전달됩니다.

<a id="data-and-rendering"></a>

### 데이터와 렌더링

| Prop | 타입 | 기본값 | 설명 |
|---|---|---|---|
| `each` | `readonly T[]` | (필수) | 항목입니다. 변경을 따라가려면 signal의 값(`each={items()}`)을 전달하세요. 보이는 행 위쪽에 항목을 삽입해도 해당 행은 제자리에 유지됩니다. |
| `children` | `(item: () => T, index: () => number) => JSX.Element` | (필수) | 행 하나를 렌더링합니다(위 참고). |
| `estimatedItemSize` | `number` | `50` | 아직 측정되지 않은 행의 크기이며, 리스트의 축 방향 기준 포인트 단위입니다. 추정값이 정확할수록 스크롤 인디케이터와 `scrollToIndex`가 더 정확해집니다. |
| `numColumns` | `number` | `1` | 한 행당 항목 수입니다(세로 리스트). 그리드를 만듭니다. |
| `horizontal` | `boolean` | `false` | 가로로 스크롤합니다. |
| `inverted` | `boolean` | `false` | 끝에서부터 배치하며 0번 항목이 마지막에 옵니다(채팅 스타일). 끝까지 스크롤된 상태로 시작하고, 콘텐츠가 바뀌어도 끝에서의 거리를 유지합니다. |
| `stickyHeaderIndices` | `number[]` | | 스크롤되어 지나가면 시작 위치에 고정되는 항목입니다(한 열, inverted 아님). |
| `header` | `ListSlot` | | 항목 앞에 렌더링됩니다. |
| `footer` | `ListSlot` | | 항목 뒤에 렌더링됩니다. |
| `empty` | `ListSlot` | | `each`가 비어 있을 때 항목 대신 표시됩니다. |
| `separator` | `ListSlot` | | 항목 사이에 렌더링됩니다(한 열). |
| `keyExtractor` | `(item: T, index: number) => string` | `item.key`, `item.id` 또는 인덱스 | viewability 토큰에서 사용하는 항목의 키입니다. |
| `initialScrollIndex` | `number` | | 첫 프레임 전에 이 항목으로 스크롤합니다. |
| `contentStyle` | `ListContentStyle` | | 콘텐츠의 패딩과 간격입니다: `padding`, `paddingHorizontal`, `paddingVertical`, `paddingTop`, `paddingRight`, `paddingBottom`, `paddingLeft`, `gap`, `rowGap`, `columnGap`(숫자). |
| `contentClass` | `string` | | 콘텐츠의 패딩과 간격을 클래스(`p-*`, `gap-*`)로 지정합니다. `contentStyle`가 우선합니다. |
| `style` | `StyleProp<ViewStyle>` | | 리스트 자체의 스타일입니다(크기를 지정하세요: `flex: 1` 또는 height). |
| `testID` | `string` | | UI 테스트가 리스트의 스크롤 뷰를 찾는 데 사용하는 id입니다(`nsh test`의 `id:`, XCUITest, UI Automator). |
| `ref` | `ListRef \| ((node: ListRef) => void)` | | [ref 메서드](#ref-methods)를 참고하세요. |

`ListSlot`는 컴포넌트(`Header`) 또는 엘리먼트(`<Header />`)입니다.

<a id="loading-refreshing-and-viewability"></a>

### 로딩, 새로고침, viewability

| Prop | 타입 | 기본값 | 설명 |
|---|---|---|---|
| `onLoadMore` | `() => void` | | 끝이 `loadMoreThreshold` 뷰포트 이내로 가까워지면 호출됩니다. 더 불러오는 용도입니다. |
| `loadMoreThreshold` | `number` | `1` | `onLoadMore`가 호출되는 끝과의 거리입니다(뷰포트 길이 단위). |
| `onLoadMoreAtStart` | `() => void` | | 사용자 또는 스크롤 명령이 리스트를 움직인 후 시작이 `loadMoreAtStartThreshold` 뷰포트 이내로 가까워지면 호출됩니다. 첫 항목 앞의 데이터를 불러오는 용도입니다. |
| `loadMoreAtStartThreshold` | `number` | `1` | `onLoadMoreAtStart`가 호출되는 시작과의 거리입니다(뷰포트 길이 단위). |
| `refreshing` | `boolean` | | pull-to-refresh 스피너가 표시됩니다. |
| `onRefresh` | `() => void` | | pull to refresh를 활성화합니다. 로딩하는 동안 `refreshing`을 설정하세요. |
| `refreshIndicator` | `{ height: number }` | | 앱이 스피너 대신 높이 `height`의 자체 pull-to-refresh 인디케이터를 그립니다. |
| `pullValue` | `AnimatedValue` | | 해당 인디케이터를 위해, 리스트가 상단을 넘어 얼마나 당겨졌는지 값을 전달받습니다. |
| `onViewableItemsChange` | `(info: { viewableItems: ViewToken<T>[]; changed: ViewToken<T>[] }) => void` | | 보이게 되었거나 더 이상 보이지 않게 된 항목입니다. |
| `viewabilityConfig` | `ViewabilityConfig` | | 항목이 언제 보이는 것으로 간주되는지를 정합니다. |

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

### 스크롤

| Prop | 타입 | 기본값 | 설명 |
|---|---|---|---|
| `scrollbar` | `boolean \| ScrollbarTheme` | `true` | 스크롤 인디케이터를 표시합니다. 플랫폼 기본 인디케이터 또는 앱의 [내장 바](../elements/scrollbar.md#built-in-bars)를 사용하며, 객체를 전달하면 뷰 자체의 테마가 됩니다. |
| `scrollable` | `boolean` | `true` | 사용자가 스크롤할 수 있습니다. |
| `bounces` | `boolean` | `true` | 가장자리를 넘어서는 오버스크롤입니다. |
| `pagingEnabled` | `boolean` | `false` | 뷰포트의 배수 위치에서 멈춥니다. |
| `snapToInterval` | `number` | `0` | 이 길이의 배수 위치에서 멈춥니다(0: 꺼짐). |
| `snapToOffsets` | `number[]` | | 이 오프셋에서 멈춥니다. |
| `snapToAlignment` | `"start" \| "center" \| "end"` | `"start"` | `snapToInterval` 사용 시 항목의 어느 지점을 뷰포트에 맞출지 정합니다. |
| `disableIntervalMomentum` | `boolean` | `false` | fling은 최대 한 개의 스냅 지점만큼 이동합니다. |
| `decelerationRate` | `"normal" \| "fast" \| number` | 플랫폼 | fling이 느려지는 속도입니다(`0.998` / `0.99` 또는 밀리초당 유지되는 속도). |
| `contentInset` | `Partial<Edges>` | | 콘텐츠 주변의 여백입니다. |
| `contentOffset` | `{ x?, y? }` | | 시작 위치입니다. |
| `keyboardShouldPersistTaps` | `"never" \| "always" \| "handled" \| boolean` | `"never"` | 탭하면 키보드를 닫을지 여부입니다(`"never"`: 탭은 키보드를 닫기만 합니다). |
| `keyboardDismissMode` | `"none" \| "on-drag" \| "interactive"` | `"none"` | 드래그하면 키보드를 닫을지 여부입니다. |
| `scrollEventThrottle` | `number` | | `onScroll` 이벤트 사이의 최소 간격(밀리초)입니다(어차피 프레임당 최대 한 번입니다). |
| `scrollValue` | `AnimatedValue` | | UI 스레드에서 스크롤 오프셋(주축)을 전달받는 [animated value](./nsh.md#animation)로, 스크롤 연동 효과에 사용합니다. |

<a id="scroll-events"></a>

### 스크롤 이벤트

| 이벤트 | 페이로드 | 시점 |
|---|---|---|
| `onScroll` | `ScrollEvent`: `{ offset, contentSize, size, zoomScale }` | 스크롤하는 동안 발생합니다. |
| `onScrollDragStart` | `{ offset }` | 드래그가 시작될 때 발생합니다. |
| `onScrollDragEnd` | `{ offset }` | 손가락을 뗄 때 발생합니다. |
| `onMomentumStart` | `{ offset }` | 드래그 후 글라이드가 시작될 때 발생합니다. |
| `onMomentumEnd` | `{ offset }` | 글라이드가 끝날 때 발생합니다(새 드래그가 글라이드를 멈추게 한 경우도 포함). |
| `onScrollEnd` | `{ offset }` | 스크롤이 멈췄을 때 발생합니다. |

리스트는 모든 엘리먼트가 받는 props([공통 props](../elements/index.md))도 받습니다.

<a id="ref-methods"></a>

## Ref 메서드

리스트의 `ref`는 `ListRef`를 받으며, `ViewRef`의 메서드 외에 다음 메서드를 제공합니다.

| 메서드 | 설명 |
|---|---|
| `scrollToIndex({ index, animated?, viewPosition?, viewOffset? })` | 항목 `index`이 보이도록 스크롤합니다. `viewPosition`로 위치를 지정합니다. `0`는 뷰포트의 시작(기본값), `0.5`는 가운데, `1`는 끝에 배치하며, `viewOffset`로 추가 이동할 수 있습니다. 측정된(또는 추정된) 행 크기를 사용해 네이티브에서 처리됩니다. |
| `scrollToOffset({ offset, animated? })` | 리스트의 축을 따라 콘텐츠 오프셋으로 스크롤합니다. |
| `scrollToEnd({ animated? })` | 콘텐츠의 끝(inverted 리스트에서는 시작)으로 스크롤합니다. |
| `scrollTo({ x?, y?, animated? })` | 오프셋으로 스크롤합니다. |

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

## 예제

채팅 예제입니다. 최신 메시지가 맨 아래에 있고, 위로 스크롤하면 이전 메시지를 불러옵니다.

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

Pull to refresh:

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

`ListProps`의 데이터와 행 부분입니다. 리스트를 직접 배치하는 자체 컴포넌트에 전달하는 용도이며, 예를 들어 `List`를 자체 패딩 및 구분선과 함께 감싸는 설정 리스트가 이에 해당합니다.
