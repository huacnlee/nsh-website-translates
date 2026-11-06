---
title: "List"
description: "가상화 및 재활용 방식의 리스트: 행, 열, 고정 헤더, 반전된 채팅 리스트, 가시성 감지, 항목으로 스크롤하기."
order: 50
group: primitives
demo: el-list
source_hash: 6e5480c9dd9e1df4
---

# List

`List`는 길거나 크기가 정해지지 않은 데이터를 보여 줍니다. 뷰포트 근처의 행만 존재하며, 사용자가 스크롤하면 벗어난 행은 새로 들어오는 행을 위해 재활용됩니다. 어떤 행이 존재하는지, 행의 위치, 열, 스티키 헤더, 가시성(viewability)은 모두 네이티브에서 계산되므로, 수천 개 항목의 목록을 스크롤하는 비용은 스무 개짜리 목록과 같습니다. Rust에서는 `virtual_list(count, |at| row)`로, TSX에서는 `nsh`의 `<List>`로 목록을 만듭니다.

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

TSX에서 `List`는 제네릭입니다. `List<T>`은 `each`와 행 함수가 항목 타입에 대해 일치하는지 검사하며, 이 타입은 TypeScript가 `each`에서 추론합니다([List API](../modules/nsh-list.md) 참고). Rust에서 `virtual_list`는 행의 개수(값, 시그널 또는 클로저이며, 목록은 그 자리에서 늘어나고 줄어듭니다)와 `Position` 위치의 행을 만드는 함수를 받습니다. 행은 컴포넌트의 데이터를 `at.index()`로 읽습니다.

모든 행이 존재해야 하는 짧은 목록(설정 페이지, 폼)에는 [스크롤 뷰](./scroll.md) 안의 [`Each`](./control-flow.md)가 더 간단합니다. 그룹화된 테이블 스타일의 목록은 [설정 스타일 목록](../docs/lists.md#a-settings-style-list)을 참고하세요. [목록 가이드](../docs/lists.md)에서는 무한 로딩, 채팅, 섹션 같은 패턴을 다룹니다.

<a id="rows-are-recycled"></a>

## 행은 재활용됩니다

행 함수는 항목마다가 아니라 셀마다 한 번 실행됩니다. 셀이 다른 항목에 재사용되면 셀의 위치가 바뀌고(TSX: `item()`와 `index()` 접근자, Rust: `at.index()`), 이를 읽는 모든 것이 갱신됩니다.

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

따라서 항목별 상태는 행 함수 안에서 만든 시그널이 아니라 데이터(id를 키로 하여)에 보관하세요. 그런 시그널은 셀에 남아 있다가 다른 항목에 나타납니다.

다음 항목을 기다리는 셀은 해당 행이 사라졌거나 다른 셀이 그 행을 보여 주고 있으면 숨겨지므로, 스크린 리더, 터치, UI 테스트는 각 행을 한 번만 만나게 됩니다.

## Props

| 속성 | Rust | 타입 | 기본값 | 설명 |
|---|---|---|---|---|
| `each` | `virtual_list(count, ..)` | `readonly T[]` | | 항목들입니다. |
| `children` | `virtual_list(.., \|at\| row)` | `(item: () => T, index: () => number) => JSX.Element` | | 행 하나를 렌더링합니다. |
| `estimatedItemSize` | `.estimated_item_size(px(..))` | `number` | `50` | 아직 측정되지 않은 항목의 크기이며 단위는 포인트입니다. 추정값이 가까울수록 스크롤 바가 안정적으로 유지됩니다. |
| `horizontal` | `.horizontal()` | `boolean` | `false` | 가로로 스크롤합니다. |
| `viewport` | `.viewport(ListViewport::..)` | `"own" \| "parent"` | `"own"` | `"own"`: 목록이 자체 스크롤 뷰 안에서 스크롤됩니다. `"parent"`: 목록이 부모 레이아웃에서 전체 길이로 놓이고, 둘러싼 스크롤 뷰의 뷰포트 근처 행만 렌더링하며, 페이지의 나머지와 함께 그 스크롤 뷰에서 스크롤됩니다([페이지 안의 목록](../docs/lists.md#lists-in-a-page-viewportparent) 참고). 목록을 만들 때 선택합니다. |
| `numColumns` | `.columns(n)` | `number` | `1` | 행당 항목 수입니다(세로 목록). |
| `inverted` | `.inverted()` | `boolean` | `false` | 끝에서부터 배치되며 0번 항목이 맨 마지막에 옵니다(채팅 스타일). 끝까지 스크롤된 상태로 시작하고, 콘텐츠가 바뀌어도 끝에서의 거리를 유지합니다. |
| `maintainVisibleContentPosition` | `.follow_end(px(threshold))` | `{ autoscrollToBottomThreshold?: number }` | | 반전되지 않은 목록용입니다. 콘텐츠의 끝에 있거나 그로부터 이 포인트 값 이내에 있으면, 콘텐츠가 늘어나거나 뷰포트가 줄어들 때 목록이 끝에 머뭅니다. 그보다 위로 스크롤되어 있으면 보이는 콘텐츠가 유지됩니다. |
| `stickyHeaderIndices` | `.sticky_header_indices([..])` | `number[]` | | 지나쳐 스크롤되면 시작 위치에 고정되는 항목입니다(한 열, 반전되지 않은 경우). |
| `contentStyle` | `.content_padding(..)`, `.content_padding_x(..)`, `.row_gap(..)`, `.column_gap(..)`, … | `ListContentStyle` | | 콘텐츠의 패딩과 간격이며 단위는 포인트입니다: `padding`, `paddingHorizontal`, `paddingVertical`, `paddingTop`, `paddingRight`, `paddingBottom`, `paddingLeft`, `gap`, `rowGap`, `columnGap`. |
| `contentClass` | | `string` | | 콘텐츠의 패딩과 간격을 클래스로 지정합니다(`p-*`, `gap-*`). `contentStyle`가 이들보다 우선합니다. |
| `header` | `.header(el)` | `ListSlot` | | 항목 앞에 놓입니다. 컴포넌트(`Header`) 또는 엘리먼트(`<Header />`)입니다. |
| `footer` | `.footer(el)` | `ListSlot` | | 항목 뒤에 놓입니다. |
| `empty` | `.empty(el)` | `ListSlot` | | `each`가 비어 있는 동안 항목 대신 표시됩니다. |
| `separator` | `.separator(\|\| el)` | `ListSlot` | | 항목 사이에 놓입니다(한 열). |
| `initialScrollIndex` | `.initial_scroll_index(i)` | `number` | | 첫 프레임 전에 이 항목으로 스크롤합니다. |
| `keyExtractor` | `.keys(\|\| ids)` | `(item: T, index: number) => string` | `item.key`, `item.id` 또는 인덱스 | 가시성 토큰에서 항목의 키입니다. Rust에서는 행의 식별자이며, 앞쪽에서 행이 추가되거나 제거되어도 행이 셀과 크기를 유지하게 합니다. |
| `onLoadMore` | `.on_load_more(..)` | `() => void` | | 끝이 가깝습니다. 더 불러오세요. |
| `loadMoreThreshold` | `.load_more_threshold(viewports)` | `number` | `1` | `onLoadMore`가 발생하는 끝과의 거리입니다(뷰포트 단위). |
| `onLoadMoreAtStart` | `.on_load_more_at_start(..)` | `() => void` | | 사용자나 스크롤 명령이 목록을 움직인 뒤 시작이 가깝습니다. 첫 번째 항목 앞에 오는 항목을 불러오세요. |
| `loadMoreAtStartThreshold` | `.load_more_at_start_threshold(viewports)` | `number` | `1` | `onLoadMoreAtStart`가 발생하는 시작과의 거리입니다(뷰포트 단위). |
| `onViewableItemsChange` | `.on_viewable_items_change(..)` | `(info: { viewableItems: ViewToken<T>[]; changed: ViewToken<T>[] }) => void` | | 항목이 보이게 되었거나 더 이상 보이지 않게 되었습니다. |
| `viewabilityConfig` | `.viewability(..)`, `.minimum_view_time(..)` | `ViewabilityConfig` | | 항목이 보이는 것으로 간주되는 조건입니다(아래 참고). |
| `refreshing` | `.refreshing(..)` | `boolean` | | 당겨서 새로 고침 스피너가 표시됩니다. |
| `onRefresh` | `.on_refresh(..)` | `() => void` | | 사용자가 당겨서 새로 고침을 했습니다. |
| `refreshIndicator` | `.refresh_indicator(Some(height))` | `{ height: number }` | | 앱이 자체 인디케이터를 그리며 높이는 `height` 포인트입니다. 플랫폼의 스피너는 숨겨지고, 당김이 `height`에 도달하면 한 번 새로 고침되며, 새로 고침 중에는 콘텐츠 위에 `height`가 유지됩니다. 높이가 0 이하이면 없는 것으로 봅니다. |
| `pullValue` | `.pull_value(&value)` | `AnimatedValue` | | 목록이 상단을 넘어 얼마나 당겨졌는지를 전달받는 애니메이션 값입니다(정지 상태에서 0이며 당길수록 커지고, 새로 고침 중에는 콘텐츠 위에 확보된 공간: `height`과 `refreshIndicator`). 앱의 인디케이터용입니다. |
| `scrollbar` | `.scrollbar(..)` | `boolean \| ScrollbarTheme` | `true` | 스크롤 인디케이터가 표시됩니다. 플랫폼의 인디케이터이거나, 앱이 테마를 설정한 경우 앱의 [내장 바](./scrollbar.md#built-in-bars)입니다. 객체를 지정하면 해당 뷰 자체의 테마가 됩니다. 데스크톱과 데스크톱 브라우저에서는 가로 뷰가 이를 유지하며, 마우스의 스크롤 바 역할을 합니다. |
| `scrollValue` | `.scroll_value(&value)` | `AnimatedValue` | | 스크롤 오프셋을 전달받는 애니메이션 값이며, 스크롤 연동 애니메이션에 사용합니다. |
| `keyboardDismissMode` | `.keyboard_dismiss_mode(..)` | `"none" \| "on-drag" \| "interactive"` | `"none"` | 드래그하면 키보드가 닫히는지 여부입니다. |
| `style` | `Styled` 메서드 | `StyleProp<ViewStyle>` | | 목록 자체의 스타일입니다(크기가 제한되어 있어야 하며, `flex: 1` 또는 높이가 필요합니다). |
| `testID` | `.test_id(id)` | `string` | | UI 테스트가 목록의 스크롤 뷰를 찾는 데 사용하는 id입니다(`nsh test`의 `id:`, XCUITest, UI Automator). |
| `ref` | `.element_ref(&handle)` | `ListRef \| (node: ListRef) => void` | | 목록의 ref입니다([ref 메서드](#ref-methods) 참고). |

목록은 [`Scroll`](./scroll.md#scrolling)의 스크롤 관련 props(Rust에서는 `Scrollable` 메서드)도 받습니다:
`pagingEnabled`, `snapToInterval`, `snapToOffsets`, `snapToAlignment`, `disableIntervalMomentum`, `decelerationRate`,
`bounces`, `contentInset`, `contentOffset`, `keyboardShouldPersistTaps`, `scrollEventThrottle` 그리고 `scrollable`.
목록은 스케일을 그대로 유지합니다.

모든 엘리먼트가 받는 props([공통 props](./index.md#common-props))는 목록의 스크롤 뷰에 그대로 전달됩니다:
`testID`, `accessibilityLabel` 및 기타 접근성 props, 스타일, `onLayout`, 터치 및 리스폰더 props.
UI 테스트는 다른 뷰와 마찬가지로 `testID`로 목록을 찾습니다.

`ViewabilityConfig` (Rust: `Viewability { item_visible_threshold, view_area_coverage_threshold }` 및 `.minimum_view_time(..)`):

| 필드 | 타입 | 설명 |
|---|---|---|
| `itemVisibleThreshold` | `number` | 항목이 얼마나 보여야 하는지를 0에서 1 사이로 지정합니다. |
| `viewAreaCoverageThreshold` | `number` | 항목이 뷰포트를 얼마나 덮어야 하는지를 0에서 1 사이로 지정합니다. 두 임계값이 모두 없으면 보이는 픽셀이 하나라도 있으면 보이는 것으로 칩니다. |
| `minimumViewTime` | `number` | 항목이 보고되기 전에 보이는 상태로 머물러야 하는 시간(밀리초)입니다. |

`ViewToken<T>`은 `{ item, key, index, isViewable }`입니다. Rust의 리스너는 `ViewableItems`을 받습니다. `indices()`는 보이는 행의 범위이고, `changed()`는 들어오거나 나간 행입니다.

## Events

| 이벤트 | Rust | 페이로드 | 발생 시점 |
|---|---|---|---|
| `onScroll` | `.on_scroll` | `ScrollEvent` | 오프셋이 바뀌었을 때입니다. |
| `onScrollDragStart` / `onScrollDragEnd` | `.on_scroll_drag_start` / `.on_scroll_drag_end` | `{ offset }` | 드래그가 시작되었을 때 / 끝났을 때입니다. |
| `onMomentumStart` / `onMomentumEnd` | `.on_momentum_start` / `.on_momentum_end` | `{ offset }` | 관성 스크롤이 시작되었을 때 / 끝났을 때입니다. |
| `onScrollEnd` | `.on_scroll_end` | `{ offset }` | 스크롤이 멈췄을 때입니다. |
| `onLoadMore` | `.on_load_more` | 없음 | 끝에서 `loadMoreThreshold` 뷰포트 이내일 때입니다. |
| `onLoadMoreAtStart` | `.on_load_more_at_start` | 없음 | 시작에서 `loadMoreAtStartThreshold` 뷰포트 이내일 때이며, 스크롤 이후 접근할 때마다 한 번 발생합니다. |
| `onViewableItemsChange` | `.on_viewable_items_change` | `{ viewableItems, changed }` (`ViewableItems`) | 가시성이 바뀌었을 때입니다. |
| `onRefresh` | `.on_refresh` | 없음 | 당겨서 새로 고침을 했을 때입니다. |

<a id="ref-methods"></a>

## Ref 메서드

| 메서드 | Rust | 설명 |
|---|---|---|
| `scrollToIndex({ index, animated?, viewPosition?, viewOffset? })` | `scroll_to_index(index, percentage(0.5), px(0.0), animated)` | `index`번 항목이 보이도록 스크롤합니다. `viewPosition`는 위치를 지정하며, 0은 뷰포트의 시작(기본값), 0.5는 가운데, 1은 끝입니다. `viewOffset`는 위치를 추가로 이동시킵니다. 현재(측정되었거나 추정된) 항목 크기를 사용해 네이티브에서 처리합니다. |
| `scrollToOffset({ offset, animated? })` | `scroll_to_offset(px(..), animated)` | 목록의 축을 따라 지정한 오프셋으로 스크롤합니다. |
| `scrollToEnd({ animated? })` | `scroll_to_end(animated)` | 콘텐츠의 끝(반전된 목록에서는 시작)으로 스크롤합니다. |
| `scrollTo({ x?, y?, animated? })` | `scroll_to(point(..), animated)` | 지정한 오프셋으로 스크롤합니다. |

<a id="examples"></a>

## 예제

헤더와 가시성을 가진 그리드입니다.

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

채팅입니다.

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

0번 항목은 가장 최근 메시지이며 맨 아래에 그려집니다. 항목 앞에 추가된 새 메시지는 사용자가 읽고 있는 내용을 움직이지 않고 나타납니다.

<a id="platform-notes"></a>

## 플랫폼 참고 사항

- 보이는 행 위쪽에 항목을 삽입해도 두 플랫폼 모두에서 보이는 행이 제자리에 유지됩니다.
- 오른쪽에서 왼쪽으로 쓰는 레이아웃의 가로 목록은 네이티브에서 미러링됩니다.
- 스티키 헤더는 매 스크롤 프레임마다 네이티브에서 고정됩니다.
