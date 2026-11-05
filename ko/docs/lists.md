---
title: "리스트"
description: "Rust와 TSX에서 길고 끝없는 리스트 다루기 - 재활용, 행 식별, 열, 고정 헤더, 역방향 채팅 리스트, 가로 리스트, 페이지 안의 리스트, 추가 로딩, 뷰어빌리티 및 항목으로 스크롤하기."
order: 40
group: ui
demo: guide-lists
source_hash: fb4ffb925cc99200
---

# 리스트

리스트(Rust에서는 `virtual_list(..)`, TSX에서는 `nsh`의 `List`)는 긴 데이터를 네이티브 스크롤 뷰에 렌더링하면서 화면 근처의 행만 생성합니다. 어떤 행이 존재하는지, 어디에 배치되는지, 열 구성, 고정 헤더, 어떤 항목이 보이는지는 모두 네이티브에서 계산됩니다. 여러분의 코드는 네이티브 쪽에서 셀을 요청할 때 그 셀을 내용으로 채우기만 하면 됩니다. 항목이 100만 개인 리스트도 30개인 리스트와 비슷한 비용이 듭니다.

```rust tabs
use std::rc::Rc;

use nsh_core::prelude::*;

#[component]
pub fn App() -> impl IntoElement {
    let titles: Rc<Vec<String>> = Rc::new((1..=10_000).map(|i| format!("Item {i}")).collect());
    virtual_list(titles.len(), move |at| {
        let titles = titles.clone();
        view()
            .p_4()
            .border_b_1()
            .border_b_color(rgb(0xeaeef2))
            .child(text(move || titles[at.index()].clone()).text_size(px(16.0)))
    })
    .estimated_item_size(px(52.0))
    .flex_1()
    .bg(white())
}
```

```tsx tabs
import { List, mount, Text, View } from "nsh";

const items = Array.from({ length: 10_000 }, (_, i) => ({ id: i, title: `Item ${i + 1}` }));

function App() {
  return (
    <List each={items} estimatedItemSize={52} style={{ flex: 1, backgroundColor: "#ffffff" }}>
      {(item) => (
        <View style={{ paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: "#eaeef2" }}>
          <Text style={{ fontSize: 16 }}>{item().title}</Text>
        </View>
      )}
    </List>
  );
}

mount(App);
```

Rust에서 `virtual_list(count, row)`는 행의 수(값, 시그널 또는 클로저)와 위치(`at.index()`)로부터 행을 만드는 함수를 받으며, 행은 그 인덱스로 데이터를 읽습니다. TSX에서 `each`는 항목들을 받고, 행 함수는 해당 항목을 전달받습니다. [스크롤 뷰](./scrolling.md)와 마찬가지로 리스트는 뷰포트이므로 부모로부터 크기(`.flex_1()`, `flex: 1` 또는 높이)를 받아야 합니다.

<a id="how-recycling-works"></a>

## 재활용 동작 방식

행 함수는 항목마다 한 번씩 호출되지 않습니다. **셀마다 한 번** 호출되며, 셀은 재사용됩니다. 행이 화면에서 멀리 스크롤되어 벗어나면 그 셀은 다른 행에 할당되고, 셀의 위치(Rust에서는 `at.index()`, TSX에서는 `item()`와 `index()`)가 바뀝니다. 이를 읽는 행의 모든 부분은 다른 [시그널](./reactivity.md)과 마찬가지로 그 자리에서 업데이트됩니다.

이로부터 두 가지 규칙이 도출됩니다.

**위치는 사용하는 곳에서 읽으세요.** 행 함수의 맨 위에서 복사해 둔 값은 그 셀이 처음 보여 준 행의 값으로 남습니다.

```rust tabs
// Wrong: `title` stays the first row's title when the cell is reused.
virtual_list(count, move |at| {
    let title = titles[at.index()].clone();
    text(title)
})

// Right: the text follows the cell's current row.
virtual_list(count, move |at| {
    let titles = titles.clone();
    text(move || titles[at.index()].clone())
})
```

```tsx tabs
// Wrong: `title` stays the first item's title when the cell is reused.
{(item) => {
  const title = item().title;
  return <Text>{title}</Text>;
}}

// Right: the text follows the cell's current item.
{(item) => <Text>{item().title}</Text>}
```

**항목별 상태는 행이 아니라 데이터에 보관하세요.** 행 안에서 생성한 시그널은 셀에 속하므로 셀과 함께 다음 항목으로 넘어갑니다. "이 행이 펼쳐져 있는지 / 선택되었는지 / 좋아요가 눌렸는지"는 항목 안에, 또는 id를 키로 하는 집합에 저장하세요.

```rust tabs
let liked = signal(HashSet::<u32>::new());
let toggle = move |id: u32| {
    liked.update(|s| {
        if !s.remove(&id) {
            s.insert(id);
        }
    })
};

virtual_list(move || posts.with(Vec::len), move |at| {
    let post = computed(move || posts.with(|p| p[at.index()].clone()));
    view()
        .flex_row()
        .p_4()
        .child(text(move || post.with(|p| p.title.clone())).flex_1())
        .child(
            text(move || if liked.with(|s| s.contains(&post.with(|p| p.id))) { "♥" } else { "♡" })
                .on_press(move || toggle(post.with(|p| p.id))),
        )
})
.estimated_item_size(px(64.0))
.flex_1()
```

```tsx tabs
const liked = signal<Set<number>>(new Set());
const toggle = (id: number) =>
  liked.update((s) => {
    const next = new Set(s);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

<List each={posts()} estimatedItemSize={64} style={{ flex: 1 }}>
  {(post) => (
    <View style={{ flexDirection: "row", padding: 16 }}>
      <Text style={{ flex: 1 }}>{post().title}</Text>
      <Text onPress={() => toggle(post().id)}>{liked().has(post().id) ? "♥" : "♡"}</Text>
    </View>
  )}
</List>
```

행마다 높이가 다를 수 있습니다. 행이 측정되기 전까지 리스트는 예상 항목 크기(기본값 50포인트)를 가정합니다. 일반적인 행에 가까운 값을 전달하면 스크롤 인디케이터와 먼 항목으로의 이동이 처음부터 정확해집니다.

<a id="changing-the-data"></a>

## 데이터 변경

Rust에서는 행 수를 시그널이나 클로저(`move || posts.with(Vec::len)`)로 지정하면 리스트가 그 자리에서 늘어나고 줄어듭니다. 끝에서 행이 추가되거나 제거되는 경우에는 별도의 작업이 필요 없습니다. 다른 위치에서 행이 추가되거나 제거되는 경우에는 `.keys(move || posts.with(|p| p.iter().map(|p| p.id).collect::<Vec<_>>()))`로 행의 식별자를 지정하면 리스트가 공통된 시작과 끝을 유지하고, 그 사이는 제거 후 삽입된 것으로 처리합니다.

TSX에서는 새 배열을 전달해 항목을 변경합니다. `posts.set([...posts(), ...more])`. 리스트는 이전 배열과 새 배열을 **항목 식별(identity)** 기준(`===`)으로 비교하고, 공통된 시작과 끝을 유지하며, 그 사이는 제거 후 삽입된 것으로 처리합니다.

두 경우 모두 측정값은 해당 행과 함께 유지되며, 화면에 보이는 행 위쪽에 행이 삽입되어도 보이는 행은 튀지 않고 제자리에 머뭅니다.

- TSX에서는 불변 방식으로 업데이트하세요. 변경되지 않은 항목 객체는 재사용하고 새 배열을 만듭니다. 배열을 그 자리에서 변경(`push`)하면 감지되지 않습니다.
- 변경된 항목은 새 객체(`{ ...post, title }`)여야 해당 행에 변경 사항이 표시됩니다.
- 앞쪽에 추가(새 메시지, 새로 고친 피드)해도 사용자의 위치가 유지됩니다.

`keyExtractor`는 뷰어빌리티 토큰(아래 참조)에서 항목의 이름을 정합니다. 기본적으로 키는 `item.key`, 그다음 `item.id`, 그다음 인덱스입니다. 이는 TSX에서 변경 사항이 일치되는 방식에는 영향을 주지 않으며, 변경 사항은 항상 식별 기준으로 일치됩니다.

## Props

리스트는 스크롤 뷰의 스크롤 관련 prop 중 리스트에 의미가 있는 것을 모두 받습니다(`pagingEnabled`, `snapToInterval`, `snapToOffsets`, `snapToAlignment`, `decelerationRate`, `disableIntervalMomentum`, `bounces`, `scrollable`, `contentInset`, `contentOffset`, `keyboardShouldPersistTaps`, `keyboardDismissMode`, `scrollEventThrottle`, `onScroll`, `onScrollDragStart`, `onScrollDragEnd`, `onMomentumStart`, `onMomentumEnd`, `onScrollEnd`, `scrollValue`, `pullValue`. Rust에서는 스크롤 뷰와 같은 메서드). 이들은 [스크롤](./scrolling.md)에서 설명합니다. 리스트의 스케일은 항상 1입니다. 리스트 고유의 prop은 다음과 같습니다.

| Prop | Rust | 타입 | 기본값 | 설명 |
|---|---|---|---|---|
| `each` | `virtual_list(count, ..)` | `readonly T[]` | | 항목들. Rust에서는 행의 수. |
| `children` | `virtual_list(.., row)` | `(item: () => T, index: () => number) => JSX.Element` | | 셀을 렌더링합니다. 셀마다 한 번 호출되며, [재활용](#how-recycling-works)을 참조하세요. |
| `estimatedItemSize` | `.estimated_item_size(px(..))` | `number` | `50` | 아직 측정되지 않은 행의 크기(포인트 단위). |
| `horizontal` | `.horizontal()` | `boolean` | `false` | 가로로 스크롤합니다. |
| `viewport` | `.viewport(ListViewport::..)` | `"own" \| "parent"` | `"own"` | `"own"`: 리스트가 자체 스크롤 뷰에서 스크롤됩니다. `"parent"`: 리스트가 주변 스크롤 뷰 안에 전체 길이로 놓이며, 페이지의 나머지와 함께 스크롤됩니다([페이지 안의 리스트](#lists-in-a-page-viewportparent) 참조). 리스트를 만들 때 선택됩니다. |
| `numColumns` | `.columns(n)` | `number` | `1` | 한 행당 항목 수(세로 리스트). |
| `inverted` | `.inverted()` | `boolean` | `false` | 0번 항목이 맨 아래에 위치합니다(채팅). 끝에서 시작하며 끝으로부터의 거리를 유지합니다. |
| `maintainVisibleContentPosition` | `.follow_end(px(..))` | `{ autoscrollToBottomThreshold?: number }` | | 반전되지 않은 리스트는 콘텐츠가 늘어날 때 끝에서 이 포인트 수 이내에 있으면 끝에 머뭅니다(아래 참조). |
| `stickyHeaderIndices` | `.sticky_header_indices(..)` | `number[]` | | 스크롤되어 지나가는 동안 상단에 고정되는 항목(한 열, 반전되지 않은 리스트). |
| `stickyHeaderOffset` | `.sticky_header_offset(px(..))`, `.bind_sticky_header_offset(&node)` | `number \| AnimatedNode` | `0` | CSS `position: sticky`의 `top`처럼, 고정 항목이 상단에서 얼마나 아래에 붙을지 지정합니다. 콘텐츠는 그 위의 공간 아래로 계속 스크롤됩니다. 애니메이션 값을 쓰면 매 프레임 항목을 움직입니다. |
| `contentStyle` | `.content_padding(..)`, `.content_padding_x(..)`, ..., `.row_gap(..)`, `.column_gap(..)` | `{ padding*, gap, rowGap, columnGap }` | | 콘텐츠의 패딩과 간격. 숫자만 허용됩니다. |
| `contentClass` | | `string` | | 클래스(`p-*`, `gap-*`)와 동일하며, `contentStyle`가 우선합니다. |
| `header` | `.header(..)` | 컴포넌트 또는 엘리먼트 | | 항목들 앞. |
| `footer` | `.footer(..)` | 컴포넌트 또는 엘리먼트 | | 항목들 뒤. |
| `empty` | `.empty(..)` | 컴포넌트 또는 엘리먼트 | | 항목이 없을 때 항목 대신 표시됩니다. |
| `separator` | `.separator(\|\| ..)` | 컴포넌트 또는 엘리먼트 | | 항목 사이(한 열). |
| `initialScrollIndex` | `.initial_scroll_index(i)` | `number` | | 첫 프레임 전에 이 항목으로 스크롤합니다. |
| `onLoadMore` | `.on_load_more(..)` | `() => void` | | 끝이 가까워졌습니다(아래 참조). |
| `loadMoreThreshold` | `.load_more_threshold(..)` | `number` | `1` | `onLoadMore`가 발생하는, 끝까지의 근접 거리(뷰포트 단위). |
| `onLoadMoreAtStart` | `.on_load_more_at_start(..)` | `() => void` | | 스크롤 후 시작이 가까워졌습니다(아래 참조). |
| `loadMoreAtStartThreshold` | `.load_more_at_start_threshold(..)` | `number` | `1` | `onLoadMoreAtStart`가 발생하는, 시작까지의 근접 거리(뷰포트 단위). |
| `onViewableItemsChange` | `.on_viewable_items_change(..)` | `(info) => void` | | 항목이 보이게 되었거나 더 이상 보이지 않게 되었습니다. |
| `viewabilityConfig` | `.viewability(..)`, `.minimum_view_time(..)` | `ViewabilityConfig` | | 항목이 보이는 것으로 간주되는 시점. |
| `keyExtractor` | `.keys(..)` | `(item, index) => string` | | 뷰어빌리티 토큰의 키. Rust에서는 행의 식별자. |
| `refreshing` / `onRefresh` | `.refreshing(..)` / `.on_refresh(..)` | `boolean` / `() => void` | | 당겨서 새로 고침. |
| `refreshIndicator` | `.refresh_indicator(..)` | `{ height: number }` | | 플랫폼의 스피너 대신 사용하는 앱 고유의 당겨서 새로 고침 인디케이터([스크롤](./scrolling.md#an-indicator-of-your-own) 참조). |
| `scrollbar` | `.scrollbar(..)` | `boolean \| ScrollbarTheme` | `true` | 스크롤 인디케이터 표시 여부. 플랫폼의 인디케이터이거나, 앱이 테마를 설정한 경우 앱의 [내장 바](../elements/scrollbar.md#built-in-bars)입니다. 객체를 전달하면 해당 뷰 자체의 테마가 됩니다. 데스크톱과 데스크톱 브라우저에서는 가로 뷰가 이를 유지하며, 마우스용 스크롤 바입니다. |
| `ref` | `.element_ref(&list)` | `ListRef` | | `scrollToIndex`, `scrollToOffset`, `scrollToEnd`, `scrollTo`. |

헤더, 푸터, 빈 상태 슬롯은 엘리먼트(TSX에서는 컴포넌트도 가능: `header={Header}`)를 받습니다. 이들은 재활용되지 않는 별도의 셀이며, 다른 엘리먼트와 마찬가지로 반응형입니다.

<a id="columns-and-grids"></a>

## 열과 그리드

`numColumns`(`.columns(n)`)는 항목을 해당 개수의 열로 이루어진 행에 배치합니다. 콘텐츠 패딩은 콘텐츠 주위에 적용되고, 행과 열 사이에는 간격이 적용됩니다. 그리드의 행은 높이가 서로 다를 수 있으며, 각 행의 높이는 그 행에서 가장 큰 항목에 맞춰집니다.

```rust tabs
let count = photos.len();
virtual_list(count, move |at| {
    let photos = photos.clone();
    image(move || photos[at.index()].thumb.clone()).aspect_square().rounded(px(8.0))
})
.columns(3)
.estimated_item_size(px(120.0))
.content_padding(px(12.0))
.row_gap(px(8.0))
.column_gap(px(8.0))
.flex_1()
```

```tsx tabs
<List
  each={photos}
  numColumns={3}
  estimatedItemSize={120}
  style={{ flex: 1 }}
  contentStyle={{ padding: 12, gap: 8 }}
>
  {(photo) => <Image src={photo().thumb} style={{ aspectRatio: 1, borderRadius: 8 }} />}
</List>
```

<a id="sticky-headers"></a>

## 고정 헤더

`stickyHeaderIndices`는 콘텐츠가 지나가는 동안 뷰포트 상단에 고정되는 항목을 지정하며, 다음 고정 항목이 밀어낼 때까지 유지됩니다. 섹션은 헤더 항목과 행 항목으로 이루어진 하나의 리스트이며, 헤더의 인덱스가 고정됩니다. 고정 처리는 매 스크롤 프레임마다 네이티브에서 수행됩니다.

```rust tabs
#[derive(Clone, PartialEq)]
enum Row {
    Header(String),
    Name(String),
}

let mut rows = Vec::new();
let mut headers = Vec::new();
for (letter, names) in groups {
    headers.push(rows.len());
    rows.push(Row::Header(letter));
    rows.extend(names.into_iter().map(Row::Name));
}
let count = rows.len();
let rows = Rc::new(rows);

virtual_list(count, move |at| {
    let rows = rows.clone();
    let row = computed(move || rows[at.index()].clone());
    let is_header = computed(move || matches!(row.get(), Row::Header(_)));
    let label = move || match row.get() {
        Row::Header(s) | Row::Name(s) => s,
    };
    when(is_header, move || {
        text(label).p(px(6.0)).bg(rgb(0xeaeef2)).font_weight(FontWeight::BOLD)
    })
    .otherwise(move || text(label).p_3())
})
.sticky_header_indices(headers)
.estimated_item_size(px(44.0))
.flex_1()
```

```tsx tabs
type Row = { header: string } | { name: string };

const rows: Row[] = [];
const headers: number[] = [];
for (const [letter, names] of groups) {
  headers.push(rows.length);
  rows.push({ header: letter });
  for (const name of names) rows.push({ name });
}

<List each={rows} stickyHeaderIndices={headers} estimatedItemSize={44} style={{ flex: 1 }}>
  {(row) => (
    <If
      when={"header" in row()}
      else={<Text style={{ padding: 12 }}>{(row() as { name: string }).name}</Text>}
    >
      <Text style={{ padding: 6, backgroundColor: "#eaeef2", fontWeight: "700" }}>{(row() as { header: string }).header}</Text>
    </If>
  )}
</List>
```

셀이 지금은 헤더를, 나중에는 이름을 보여 줄 수 있으므로, 행은 행이 바뀔 때 전환되는 [`when` / `<If>`](../elements/control-flow.md)로 무엇을 렌더링할지 결정합니다. 고정 헤더를 사용하려면 한 열이어야 하고 리스트가 반전되지 않아야 합니다.

`stickyHeaderOffset`(Rust에서는 `.sticky_header_offset(..)`)을 사용하면 CSS `position: sticky`의 `top`처럼 헤더가 상단에서 그만큼의 포인트 아래에 붙습니다. 높이 56포인트의 반투명 바 아래에서 `stickyHeaderOffset={56}`(`.sticky_header_offset(px(56.0))`)은 행이 그 아래로 계속 스크롤되는 동안 각 헤더를 바 아래에 유지하고, 다음 헤더는 그 위치에서 이전 헤더를 밀어냅니다. 음수 오프셋을 지정하면 헤더의 일부가 보이지 않게 됩니다.

오프셋은 [애니메이션 값](./animation.md#animated-values)(Rust에서는 `.bind_sticky_header_offset(&node)`)일 수 있습니다. 헤더가 UI 스레드에서 매 프레임 그 값을 따라가므로, 움직이는 바 아래에 계속 붙어 있습니다. 콘텐츠가 아래로 스크롤되면 숨고 위로 스크롤되면 다시 나타나는 바([`diffClamp`](./animation.md#arithmetic-and-diffclamp))의 경우, 헤더는 바가 어디에 있든 그 아래쪽 가장자리에 붙습니다.

```rust tabs
let offset = animated_value(0.0);
let hidden = offset.diff_clamp(0.0, 56.0);
let shown = hidden.mul(-1.0).add(56.0);

view().flex_1().overflow_hidden().child(
    virtual_list(rows.len(), row)
        .scroll_value(&offset)
        .sticky_header_indices(headers)
        .bind_sticky_header_offset(&shown),
).child(view().absolute().top_0().left_0().right_0().h(px(56.0)).bind_translate_y(&hidden.mul(-1.0)))
```

```tsx tabs
const scroll = createAnimatedValue(0);
const hidden = scroll.diffClamp(0, 56);
const shown = hidden.mul(-1).add(56);

<View style={{ flex: 1, overflow: "hidden" }}>
  <List each={rows} scrollValue={scroll} stickyHeaderIndices={headers} stickyHeaderOffset={shown}>…</List>
  <View style={{ position: "absolute", top: 0, left: 0, right: 0, height: 56, translate: [0, hidden.mul(-1)] }}>…</View>
</View>
```

<a id="chat-inverted-lists"></a>

## 채팅: 반전된 리스트

`inverted`는 리스트를 끝에서부터 배치합니다. 0번 항목이 맨 아래에 있고, 리스트는 끝까지 스크롤된 상태로 시작하며, 항목이 바뀌어도 끝으로부터의 거리를 유지합니다. 가장 최신 메시지를 첫 번째로 두세요. 메시지를 추가할 때는 앞쪽에 추가하고, 이전 메시지를 불러올 때는 `onLoadMore`로 뒤쪽에 추가합니다(반전된 리스트의 "끝"은 맨 위입니다). 오래된 메시지에서 열린 채팅은 [`onLoadMoreAtStart`](#loading-at-the-start-onloadmoreatstart)으로 더 새로운 메시지를 불러옵니다. 이를 사용하면 리스트가 맨 아래에 있는 동안에는 아래로부터의 거리를 유지하고, 위로 스크롤했을 때는 화면에 보이는 메시지를 제자리에 유지합니다.

```rust tabs
#[derive(Clone, PartialEq)]
struct Message {
    id: u32,
    text: String,
    mine: bool,
}

pub fn chat() -> impl IntoElement {
    let next = stored(0_u32);
    let message = move |text: String, mine: bool| Message {
        id: next.with(|n| {
            *n += 1;
            *n
        }),
        text,
        mine,
    };
    // Newest first.
    let messages = signal(
        (0..30)
            .map(|i| message(format!("Message {}", 30 - i), i % 3 == 0))
            .collect::<Vec<_>>(),
    );
    let draft = signal(String::new());
    let send = move || {
        let text = draft.get_untracked();
        if text.trim().is_empty() {
            return;
        }
        let sent = message(text, true);
        messages.update(|m| m.insert(0, sent));
        draft.set(String::new());
    };
    let load_older = move || {
        let older: Vec<_> = (0..20).map(|i| message(format!("Older {i}"), false)).collect();
        messages.update(|m| m.extend(older));
    };
    let list = virtual_list(
        move || messages.with(Vec::len),
        move |at| {
            let mine = computed(move || messages.with(|m| m[at.index()].mine));
            view()
                .style_when(mine, |s| s.self_end().bg(rgb(0x0969da)))
                .style_when(move || !mine.get(), |s| s.self_start().bg(rgb(0xeaeef2)))
                .max_w(relative(0.75))
                .px_3()
                .py_2()
                .rounded(px(14.0))
                .child(
                    text(move || messages.with(|m| m[at.index()].text.clone()))
                        .text_color(move || if mine.get() { rgb(0xffffff) } else { rgb(0x1f2328) }),
                )
        },
    )
    .keys(move || messages.with(|m| m.iter().map(|m| m.id).collect::<Vec<_>>()))
    .inverted()
    .estimated_item_size(px(44.0))
    .content_padding(px(12.0))
    .row_gap(px(6.0))
    .keyboard_dismiss_mode(KeyboardDismissMode::Interactive)
    .on_load_more(load_older)
    .load_more_threshold(0.5)
    .flex_1();
    view()
        .flex_1()
        .pb_keyboard()
        .child(list)
        .child(
            view().flex_row().gap_2().p_2().child(
                input()
                    .value(move || draft.get())
                    .on_change(move |text: &str| draft.set(text.to_owned()))
                    .on_submit(move |_: &str| send())
                    .multiline(true)
                    .submit_behavior(SubmitBehavior::Submit)
                    .return_key_type(ReturnKeyType::Send)
                    .placeholder("Message")
                    .flex_1()
                    .max_h(px(120.0))
                    .border_1()
                    .border_color(rgb(0xd0d7de))
                    .rounded(px(18.0))
                    .px_3()
                    .py_2(),
            ),
        )
}
```

```tsx tabs
import { List, mount, signal, Text, View } from "nsh";
import { Input } from "nsh/base";

type Message = { id: number; text: string; mine: boolean };

function Chat() {
  let next = 0;
  const message = (text: string, mine: boolean): Message => ({ id: next++, text, mine });
  const messages = signal(Array.from({ length: 30 }, (_, i) => message(`Message ${30 - i}`, i % 3 === 0)));
  const draft = signal("");
  const send = () => {
    if (!draft().trim()) return;
    messages.update((m) => [message(draft(), true), ...m]); // newest first
    draft.set("");
  };
  const loadOlder = () => messages.update((m) => [...m, ...Array.from({ length: 20 }, (_, i) => message(`Older ${i}`, false))]);
  return (
    <View style={{ flex: 1, paddingBottom: "env(keyboard-inset-height)" }}>
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
          <View
            style={{
              alignSelf: m().mine ? "flex-end" : "flex-start",
              maxWidth: "75%",
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 14,
              backgroundColor: m().mine ? "#0969da" : "#eaeef2",
            }}
          >
            <Text style={{ color: m().mine ? "#ffffff" : "#1f2328" }}>{m().text}</Text>
          </View>
        )}
      </List>
      <View style={{ flexDirection: "row", gap: 8, padding: 8 }}>
        <Input
          value={draft()}
          onChange={({ value }) => draft.set(value)}
          onSubmit={send}
          multiline
          submitBehavior="submit"
          returnKeyType="send"
          placeholder="Message"
          style={{ flex: 1, maxHeight: 120, borderWidth: 1, borderColor: "#d0d7de", borderRadius: 18, paddingHorizontal: 12, paddingVertical: 8 }}
        />
      </View>
    </View>
  );
}

mount(Chat);
```

반전된 리스트에서 `scroll_to_end(..)` / `scrollToEnd()`는 리스트의 시작, 즉 가장 최신 메시지로 스크롤합니다.

<a id="following-the-end-of-a-list-that-is-not-inverted"></a>

### 반전되지 않은 리스트에서 끝 따라가기

읽는 순서(오래된 것부터)의 리스트도 끝을 따라갈 수 있습니다. Rust에서는 `.follow_end(px(40.0))`, TSX에서는 `maintainVisibleContentPosition={{ autoscrollToBottomThreshold: 40 }}`를 사용하면 사용자가 끝에 있는 동안(또는 끝에서 40포인트 이내) 콘텐츠가 늘어나도 리스트가 끝에 머뭅니다. 예를 들어 마지막 항목에 답변이 스트리밍되거나, 새 메시지가 추가되거나, 키보드 때문에 리스트가 줄어드는 경우입니다. 더 위로 스크롤한 경우에는 보이는 콘텐츠가 제자리에 머물고 새 콘텐츠는 그 아래로 늘어납니다. 보이는 항목 위쪽에 삽입된 항목은 이 옵션의 사용 여부와 관계없이 보이는 항목을 움직이지 않습니다.

```rust tabs
virtual_list(move || messages.with(Vec::len), move |at| bubble(messages, at))
    .keys(move || messages.with(|m| m.iter().map(|m| m.id).collect::<Vec<_>>()))
    .follow_end(px(40.0))
    .flex_1()
```

```tsx tabs
<List each={messages()} keyExtractor={(m) => m.id} maintainVisibleContentPosition={{ autoscrollToBottomThreshold: 40 }} style={{ flex: 1 }}>
  {(m) => <Bubble message={m()} />}
</List>
```

<a id="horizontal-lists"></a>

## 가로 리스트

`horizontal`는 리스트를 가로 방향으로 바꾸며, 셀은 리스트의 높이에 맞춰 배치됩니다. 스냅과 함께 사용하면 길이에 제한이 없는 캐러셀을 만들 수 있습니다.

```rust tabs
let count = cards.len();
virtual_list(count, move |at| {
    let cards = cards.clone();
    view()
        .w(px(220.0))
        .h(px(140.0))
        .rounded(px(14.0))
        .bg(move || cards[at.index()].color)
})
.horizontal()
.estimated_item_size(px(232.0))
.snap_interval(px(232.0))
.deceleration(0.99)
.scrollbar(false)
.content_padding_x(px(16.0))
.column_gap(px(12.0))
.h(px(140.0))
```

```tsx tabs
<List
  each={cards}
  horizontal
  estimatedItemSize={232}
  snapToInterval={232}
  decelerationRate="fast"
  scrollbar={false}
  style={{ height: 140 }}
  contentStyle={{ paddingHorizontal: 16, gap: 12 }}
>
  {(card) => <View style={{ width: 220, height: 140, borderRadius: 14, backgroundColor: card().color }} />}
</List>
```

오른쪽에서 왼쪽 방향(RTL)에서는 가로 리스트가 오른쪽에서 시작해 왼쪽으로 진행됩니다.

<a id="lists-in-a-page-viewportparent"></a>

## 페이지 안의 리스트: viewport="parent"

페이지는 하나로 스크롤되는 경우가 많습니다. 헤더, 몇 개의 카드, 그다음 긴 리스트, 그리고 그 아래에 또 다른 리스트가 올 수도 있습니다. 리스트에 `viewport="parent"`(Rust에서는 `.viewport(ListViewport::Parent)`)를 지정하고 페이지의 나머지와 함께 `Scroll` 안에 넣으세요. 그러면 리스트가 페이지 안에 전체 길이로 놓이고, 페이지의 스크롤 뷰가 다른 모든 것과 함께 이를 스크롤합니다. 리스트는 여전히 페이지 뷰포트 근처의 행만 생성하고 그 셀을 재활용하므로, 한 페이지에 여러 개의 긴 리스트를 둘 수 있습니다.

```rust tabs
scroll()
    .flex_1()
    .child(header())
    .child(
        virtual_list(count, row)
            .viewport(ListViewport::Parent)
            .estimated_item_size(px(56.0))
            .row_gap(px(6.0)),
    )
    .child(footer())
```

```tsx tabs
<Scroll style={{ flex: 1 }}>
  <Header />
  <List viewport="parent" each={items} estimatedItemSize={56} contentStyle={{ gap: 6 }}>
    {(item) => <Row item={item()} />}
  </List>
  <Footer />
</Scroll>
```

- 리스트의 길이는 행에 의해 정해집니다. 리스트의 높이(가로 방향이면 너비)는 뷰와 마찬가지로 콘텐츠에서 결정되며, 패딩, 테두리, 마진도 뷰에서처럼 동작합니다.
- 리스트의 행은 해당 축을 따라 가장 가까운 주변 스크롤 뷰, 또는 그것이 놓인 화면을 따릅니다.
- 페이지는 브라우저처럼 읽고 있는 위치를 유지합니다. 뷰포트 상단보다 완전히 위에 있는 행의 크기가 바뀌면 그만큼 페이지가 이동하고, 리스트의 시작이 보이는 동안에는 커지는 행이 그 아래의 내용을 아래로 밀어냅니다.
- `scrollToIndex`, `scrollToEnd`, `initialScrollIndex`는 페이지의 콘텐츠 범위 안에서 페이지를 리스트의 행으로 스크롤합니다. `onLoadMore`는 리스트의 끝이 뷰포트에 가까워질 때 발생하고, `onViewableItemsChange`는 페이지의 뷰포트 안에 있는 행을 보고합니다.
- `stickyHeaderIndices`와 `stickyHeaderOffset`는 행을 페이지 상단에 고정합니다. 섹션 헤더는 그 행들이 아래로 스크롤되는 동안 상단에 머물다가 다음 헤더가 밀어내면 사라지며, 마지막 헤더는 리스트의 끝과 함께 사라집니다.
- 페이지가 스크롤되는 방식은 해당 스크롤 뷰에 의해 결정됩니다. `Scroll`에서 `onScroll`와 다른 스크롤 이벤트, `scrollValue`, `refreshing` / `onRefresh`, 페이징과 스냅, `contentInset`, `scrollbar`, `scrollable`, `keyboardDismissMode`를 설정하세요. 반전된 리스트와 `maintainVisibleContentPosition`는 자체 뷰포트를 가진 리스트(`viewport="own"`, 기본값)의 기능입니다.
- 뷰포트는 리스트를 만들 때 선택됩니다. 전환하려면 새 리스트를 렌더링하세요.

<a id="loading-more-onloadmore"></a>

## 더 불러오기: onLoadMore

`onLoadMore`(`.on_load_more(..)`)는 뷰포트가 끝에서 `loadMoreThreshold` 뷰포트 이내로 들어오면 발생합니다(기본값은 1, 즉 한 화면 앞). 다음 페이지를 추가하면 새로운 끝이 가까워질 때 리스트가 다시 이벤트를 발생시킵니다.

```rust tabs
let posts = signal(Vec::<Post>::new());
let page = stored(0_u32);
let loading = stored(false);

let load_more = move || {
    if loading.replace(true) {
        return;
    }
    let next = page.with(|p| {
        *p += 1;
        *p
    });
    spawn(async move {
        if let Ok(response) = fetch(format!("https://api.example.com/posts?page={next}")).await {
            let more = parse_posts(&response.text());
            posts.update(|p| p.extend(more));
        }
        loading.replace(false);
    });
};
load_more();

virtual_list(move || posts.with(Vec::len), move |at| post_row(posts, at))
    .estimated_item_size(px(72.0))
    .on_load_more(load_more)
    .load_more_threshold(0.5)
    .footer(text("Loading…").p_4().text_center().text_color(rgb(0x8c959f)))
    .flex_1()
```

```tsx tabs
const posts = signal<Post[]>([]);
let loading = false;
let page = 0;

const loadMore = async () => {
  if (loading) return;
  loading = true;
  try {
    const next: Post[] = await (await fetch(`https://api.example.com/posts?page=${++page}`)).json();
    posts.set([...posts(), ...next]);
  } finally {
    loading = false;
  }
};
loadMore();

<List
  each={posts()}
  estimatedItemSize={72}
  style={{ flex: 1 }}
  onLoadMore={loadMore}
  loadMoreThreshold={0.5}
  footer={<Text style={{ padding: 16, textAlign: "center", color: "#8c959f" }}>Loading…</Text>}
>
  {(post) => <PostRow post={post()} />}
</List>
```

위와 같이 로드가 겹치지 않도록 방지하세요. 페이지를 가져오는 중에도 끝에 도달했다는 알림이 다시 발생할 수 있습니다.
<a id="loading-at-the-start-onloadmoreatstart"></a>

## 시작 부분에서 불러오기: onLoadMoreAtStart

목록은 데이터의 중간에서 시작할 수도 있습니다. 예를 들어 오래된 메시지(검색 결과나 답장의 인용문)에서 열린 채팅은 해당 메시지 주변의 페이지를 보여 주며, 더 최신 메시지는 아직 불러오지 않은 상태입니다. `onLoadMoreAtStart`(`.on_load_more_at_start(..)`)는 뷰포트가 시작 쪽, 즉 0번 항목이 있는 쪽(일반 목록에서는 위쪽, 반전된 목록에서는 아래쪽)에서 `loadMoreAtStartThreshold` 뷰포트 이내로 들어오면 호출됩니다(기본값은 1). 페이지는 앞쪽에 추가(prepend)하세요. 화면에 보이는 행은 새 페이지가 앞에 도착하는 동안에도 제자리를 유지하며(반전된 목록도 맨 아래에서 스크롤해 벗어난 경우에는 마찬가지입니다), 목록은 다음에 다시 시작 쪽에 가까워질 때 다시 호출하거나, 페이지를 추가한 뒤에도 여전히 시작 쪽에 가까우면 즉시 다시 호출합니다.

이 콜백은 사용자가 그 위치로 스크롤하거나 스크롤 명령이 목록을 그 위치로 이동시킬 때(`initialScrollIndex` 포함) 호출됩니다. 따라서 가장 최신 항목에서 열리는 목록은 아무것도 요청하지 않고, 시작 부분 근처에서 `initialScrollIndex`로 열리는 목록은 그 앞의 페이지를 바로 요청합니다.

```rust tabs
let messages = signal(page_around(target)); // newest first, ending at an old message
let loading = stored(false);

let load_newer = move |_: &()| {
    if loading.replace(true) {
        return;
    }
    let newest = messages.with(|m| m[0].id);
    spawn(async move {
        if let Ok(response) = fetch(format!("https://api.example.com/messages?after={newest}")).await {
            let newer = parse_messages(&response.text());
            messages.update(|m| {
                m.splice(0..0, newer);
            });
        }
        loading.replace(false);
    });
};

virtual_list(move || messages.with(Vec::len), move |at| message_row(messages, at))
    .inverted(true)
    .on_load_more(load_older)
    .on_load_more_at_start(load_newer)
    .load_more_at_start_threshold(0.5)
    .flex_1()
```

```tsx tabs
const messages = signal<Message[]>(pageAround(target)); // newest first, ending at an old message
let loading = false;

const loadNewer = async () => {
  if (loading) return;
  loading = true;
  try {
    const newest = messages()[0].id;
    const newer: Message[] = await (await fetch(`https://api.example.com/messages?after=${newest}`)).json();
    messages.set([...newer, ...messages()]);
  } finally {
    loading = false;
  }
};

<List
  each={messages()}
  inverted
  style={{ flex: 1 }}
  onLoadMore={loadOlder}
  onLoadMoreAtStart={loadNewer}
  loadMoreAtStartThreshold={0.5}
>
  {(message) => <Bubble message={message()} />}
</List>
```

가장 최신 메시지까지 불러왔다면 로딩을 중단하세요. 그 이후의 새 메시지는 일반 채팅처럼 시작 쪽에 도착합니다.

## Viewability

`onViewableItemsChange`(`.on_viewable_items_change(..)`)는 화면에 보이는 항목을 알려 주며, 분석, 보이는 비디오의 자동 재생, 메시지 읽음 표시 등에 사용할 수 있습니다. TSX에서는 토큰 `{ item, key, index, isViewable }`의 배열인 `{ viewableItems, changed }`를 받고, Rust에서는 처음과 마지막으로 보이는 행(`viewable`) 및 상태가 바뀐 행(`changed()`)을 담은 `ViewableItems`를 받습니다. Viewability는 네이티브에서 계산되며, 코드는 변경 사항만 전달받습니다.

| `viewabilityConfig` | Rust | 설명 |
|---|---|---|
| `itemVisibleThreshold` | `Viewability { item_visible_threshold, .. }` | 항목이 보여야 하는 비율로, 0에서 1 사이의 값입니다. |
| `viewAreaCoverageThreshold` | `Viewability { view_area_coverage_threshold, .. }` | 항목이 뷰포트를 차지해야 하는 비율로, 0에서 1 사이의 값입니다. |
| `minimumViewTime` | `.minimum_view_time(Duration)` | 항목이 보고되기 전에 viewable 상태를 유지해야 하는 시간(밀리초)입니다. |

임계값이 없으면 보이는 픽셀이 하나라도 있으면 보이는 것으로 간주합니다.

```rust tabs
let playing = signal(None::<usize>);

virtual_list(count, move |at| video_card(videos.clone(), at))
    .estimated_item_size(px(300.0))
    .viewability(Viewability {
        item_visible_threshold: Some(Percentage(0.6)),
        ..Viewability::default()
    })
    .minimum_view_time(Duration::from_millis(250))
    .on_viewable_items_change(move |rows: &ViewableItems| {
        playing.set(rows.viewable.map(|(first, _)| first))
    })
    .flex_1()
```

```tsx tabs
<List
  each={videos}
  estimatedItemSize={300}
  style={{ flex: 1 }}
  keyExtractor={(v) => v.slug}
  viewabilityConfig={{ itemVisibleThreshold: 0.6, minimumViewTime: 250 }}
  onViewableItemsChange={({ viewableItems }) => playing.set(viewableItems[0]?.key ?? null)}
>
  {(v) => <VideoCard video={v()} />}
</List>
```

<a id="scrolling-from-code"></a>

## 코드에서 스크롤하기

목록에 ref를 지정하세요(Rust에서는 `element_ref()`와 `.element_ref(&list)`, TSX에서는 `ref`):

| Rust | TSX | 설명 |
|---|---|---|
| `scroll_to_index(index, view_position, view_offset, animated)` | `scrollToIndex({ index, animated?, viewPosition?, viewOffset? })` | 항목 `index`이(가) 보이도록 스크롤합니다. view position으로 위치를 지정합니다. 0은 뷰포트의 시작(기본값), 0.5는 가운데, 1은 끝이며, view offset으로 추가로 이동할 수 있습니다. |
| `scroll_to_offset(offset, animated)` | `scrollToOffset({ offset, animated? })` | 목록의 축을 따라 콘텐츠 오프셋으로 스크롤합니다. |
| `scroll_to_end(animated)` | `scrollToEnd({ animated? })` | 콘텐츠의 끝(반전된 목록에서는 시작)으로 스크롤합니다. |
| `scroll_to(point, animated)` | `scrollTo({ x?, y?, animated? })` | 스크롤 뷰에서처럼 지정한 오프셋으로 스크롤합니다. |

```rust tabs
let list = element_ref();

virtual_list(count, row).estimated_item_size(px(48.0)).flex_1().element_ref(&list)

list.scroll_to_index(120, percentage(0.5), px(0.0), true);
```

```tsx tabs
import { List, type ListRef } from "nsh";

let list!: ListRef;

<List ref={list} each={items} estimatedItemSize={48} style={{ flex: 1 }}>…</List>

list.scrollToIndex({ index: 120, viewPosition: 0.5 });
```

인덱스로(그리고 끝으로) 스크롤하는 동작은 그 시점에 알려진 크기를 사용해 네이티브에서 처리됩니다. 측정된 행은 측정된 크기를, 그 외에는 추정 크기를 사용합니다. 이후 목록은 주변 행이 측정되는 동안 목표 위치를 계속 따라가므로, 사용자가 스크롤하거나 항목이 바뀌기 전까지는 정확한 위치에 도달합니다. 목록을 특정 항목에서 열려면 첫 프레임 이후에 스크롤하지 말고 `initialScrollIndex`(`.initial_scroll_index(..)`)를 사용하세요.

<a id="a-settings-style-list"></a>

## 설정 스타일 목록

목록의 외형은 앱이 직접 정합니다. 목록은 행을 배치하고 재활용할 뿐이며, 행, 구분선, 표면은 여러분의 뷰입니다. 그룹형 설정 스타일 목록은 패딩, 구분선, 둥근 첫 행과 마지막 행을 가진 목록입니다. 이를 직접 컴포넌트로 만들어 앱에서 설정을 나열하는 모든 곳에 사용하세요.

```rust tabs
use std::rc::Rc;

use nsh_core::{element::palette::NEUTRAL, prelude::*};

pub struct Setting {
    pub id: &'static str,
    pub label: &'static str,
}

pub fn settings_list(settings: Rc<Vec<Setting>>, on_select: impl Fn(&Setting) + 'static) -> impl IntoElement {
    let surface = AdaptiveColor::new(white(), NEUTRAL.shade(900));
    let on_select = Rc::new(on_select);
    let count = settings.len();
    view().flex_1().bg(AdaptiveColor::new(NEUTRAL.shade(100), NEUTRAL.shade(950))).child(
        virtual_list(count, move |at| {
            let (pressed, shown, on_select) = (settings.clone(), settings.clone(), on_select.clone());
            view()
                .on_press(move || on_select(&pressed[at.index()]))
                .role(AccessibilityRole::Button)
                .h_12()
                .justify_center()
                .bg(surface)
                .px_4()
                .active(|s| s.bg(NEUTRAL.shade(200)))
                .rounded_t(move || px(if at.is_first() { 12.0 } else { 0.0 }))
                .rounded_b(move || px(if at.is_last() { 12.0 } else { 0.0 }))
                .child(text(move || shown[at.index()].label))
        })
        .estimated_item_size(px(48.0))
        .content_padding(px(16.0))
        .separator(move || {
            view()
                .bg(surface)
                .child(view().ml_4().h(px(1.0)).bg(AdaptiveColor::new(NEUTRAL.shade(200), NEUTRAL.shade(800))))
        })
        .flex_1(),
    )
}
```

```tsx tabs
import { List, Text, View } from "nsh";

type Setting = { id: string; label: string };

function SettingsList(props: { each: Setting[]; onSelect: (s: Setting) => void }) {
  return (
    <View class="flex-1 bg-neutral-100 dark:bg-neutral-950">
      <List
        each={props.each}
        estimatedItemSize={48}
        style={{ flex: 1 }}
        contentStyle={{ padding: 16 }}
        separator={() => (
          <View class="bg-white dark:bg-neutral-900">
            <View class="ml-4 h-px bg-neutral-200 dark:bg-neutral-800" />
          </View>
        )}
      >
        {(s, i) => (
          <View
            onPress={() => props.onSelect(s())}
            role="button"
            class="h-12 justify-center bg-white px-4 active:bg-neutral-200 dark:bg-neutral-900"
            classList={{ "rounded-t-xl": i() === 0, "rounded-b-xl": i() === props.each.length - 1 }}
          >
            <Text>{s().label}</Text>
          </View>
        )}
      </List>
    </View>
  );
}
```

<a id="performance-notes"></a>

## 성능 참고 사항

- 각 셀은 독립적으로 레이아웃되므로, 스크롤할 때는 변경된 셀만 다시 레이아웃됩니다. 행은 얕게 유지하고, 매 프레임 변하는 행에서는 시그널을 읽지 마세요.
- 네이티브 측은 셀을 배치로 요청하며 프레임당 여러 차례 요청할 수 있고, 그 결과는 하나의 업데이트로 병합됩니다. 따라서 빠른 플링(fling) 시에도 셀마다 코드를 호출하지 않고 한 프레임에서 많은 셀을 바인딩합니다. Rust 행은 필요로 하는 커밋 안에서 코어가 직접 바인딩합니다.
- 행의 프레임당 비용을 측정하려면 [`nsh test --trace`와 `scroll` 스텝](./testing-and-trace.md#scrolling)을 사용하세요.

<a id="related"></a>

## 관련 문서

- [`List` 요소](../elements/list.md): 레퍼런스.
- [Scrolling](./scrolling.md): 목록이 스크롤 뷰와 공유하는 스크롤 props.
- [Reactivity](./reactivity.md): 행이 바인딩에서 자신의 위치를 읽는 이유.
- [Performance](./performance.md): 목록 성능 측정.
