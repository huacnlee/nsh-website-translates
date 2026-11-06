---
title: "列表"
description: "在 Rust 和 TSX 中處理長列表及無限列表：元件回收、列識別、多欄、固定標題列、反向聊天列表、水平列表、頁面內的列表、載入更多、可視性偵測，以及捲動至指定項目。"
order: 40
group: ui
demo: guide-lists
source_hash: fb4ffb925cc99200
---


# 列表

列表（Rust 中是 `virtual_list(..)`，TSX 中是 `nsh` 提供的 `List`）在原生捲動視圖上呈現大量資料，同時只建立螢幕附近的列。哪些列存在、列放在哪裡、欄數、黏性標題，以及哪些項目可見，全部由原生端計算；你的程式碼只會在原生端要求時，才為儲存格填入內容。一個有一百萬個項目的列表，成本與一個有三十個項目的列表相若。

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

在 Rust 中，`virtual_list(count, row)` 接受列數（可以是數值、signal 或閉包），以及一個根據位置（`at.index()`）建立列的函數；各列透過該索引讀取你的資料。在 TSX 中，`each` 接受項目，而列函數會取得該項目。與[捲動視圖](./scrolling.md)一樣，列表本身就是可視區域，需要由其父層提供尺寸（`.flex_1()`、`flex: 1` 或高度）。

<a id="how-recycling-works"></a>

## 回收的運作方式

列函數並不是每個項目呼叫一次，而是**每個儲存格呼叫一次**，而且儲存格會被重用：當某一列捲動到遠離螢幕的位置，它的儲存格就會被分配給另一列，其位置（Rust 中的 `at.index()`，TSX 中的 `item()` 和 `index()`）也隨之改變。列中所有讀取該位置的內容都會原地更新，與任何其他 [signal](./reactivity.md) 一樣。

由此衍生出兩條規則：

**在使用位置的地方才讀取它。** 在列函數開頭複製出來的值，只屬於該儲存格最初顯示的那一列。

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

**把每個項目的狀態放在你的資料中，而不是列裡面。** 在列內建立的 signal 屬於儲存格，並會跟著儲存格轉到下一個項目。請把「此列是否展開／選取／已按讚」儲存在項目本身，或以 id 作為鍵的集合中：

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

各列的高度可以不同。在某一列被量度之前，列表會假設使用預估項目大小（預設為 50 點）；請傳入一個接近你一般列高的值，這樣捲動指示器和跳轉到遠處項目時，一開始就會準確。

<a id="changing-the-data"></a>

## 更改資料

在 Rust 中，把列數以 signal 或閉包（`move || posts.with(Vec::len)`）傳入：列表會原地增長和縮減。在末尾新增或移除列時，不需要其他處理；當列在其他位置出現或消失時，請以 `.keys(move || posts.with(|p| p.iter().map(|p| p.id).collect::<Vec<_>>()))` 提供它們的身分，列表會保留相同的開頭和結尾，並把中間部分視為已移除和已插入。

在 TSX 中，傳入新陣列即可更改項目：`posts.set([...posts(), ...more])`。列表會**按項目身分**（`===`）比較新舊陣列，保留相同的開頭和結尾，並把中間部分視為已移除和已插入。

在兩種情況下，量度結果都會跟著各自的列，而且當列插入到螢幕上所見列的上方時，可見的列會留在原處，不會跳動。

- 在 TSX 中，請以不可變方式更新：使用新陣列，並重用未改變的項目物件。就地修改陣列（`push`）是不會被偵測到的。
- 已改變的項目應該是新物件（`{ ...post, title }`），這樣它的列才會顯示變更。
- 在前面插入（新訊息、重新整理的動態）會保持使用者目前的位置。

`keyExtractor` 在可見性 token（見下文）中為項目命名；預設的鍵是 `item.key`，然後是 `item.id`，最後是索引。它不會影響 TSX 中變更的比對方式，TSX 中永遠是按身分比對。

<a id="props"></a>

## 屬性

列表接受捲動視圖中所有適用於列表的捲動屬性（`pagingEnabled`、`snapToInterval`、`snapToOffsets`、`snapToAlignment`、`decelerationRate`、`disableIntervalMomentum`、`bounces`、`scrollable`、`contentInset`、`contentOffset`、`keyboardShouldPersistTaps`、`keyboardDismissMode`、`scrollEventThrottle`、`onScroll`、`onScrollDragStart`、`onScrollDragEnd`、`onMomentumStart`、`onMomentumEnd`、`onScrollEnd`、`scrollValue`、`pullValue`；在 Rust 中是與捲動視圖相同的方法），詳見[捲動](./scrolling.md)。列表的縮放比例固定為 1。它自己的屬性如下：

| 屬性 | Rust | 類型 | 預設值 | 說明 |
|---|---|---|---|---|
| `each` | `virtual_list(count, ..)` | `readonly T[]` | | 項目；在 Rust 中是列數。 |
| `children` | `virtual_list(.., row)` | `(item: () => T, index: () => number) => JSX.Element` | | 呈現一個儲存格；每個儲存格呼叫一次，見[回收](#how-recycling-works)。 |
| `estimatedItemSize` | `.estimated_item_size(px(..))` | `number` | `50` | 尚未量度的列的大小，單位為點。 |
| `horizontal` | `.horizontal()` | `boolean` | `false` | 橫向捲動。 |
| `viewport` | `.viewport(ListViewport::..)` | `"own" \| "parent"` | `"own"` | `"own"`：列表在自己的捲動視圖中捲動。`"parent"`：列表以完整長度置於周圍的捲動視圖內，並與頁面其餘內容一起被捲動（見[頁面中的列表](#lists-in-a-page-viewportparent)）。在建立列表時選定。 |
| `numColumns` | `.columns(n)` | `number` | `1` | 每列的項目數（垂直列表）。 |
| `inverted` | `.inverted()` | `boolean` | `false` | 項目 0 在底部（聊天）；由末端開始，並保持與末端的距離。 |
| `maintainVisibleContentPosition` | `.follow_end(px(..))` | `{ autoscrollToBottomThreshold?: number }` | | 未反轉的列表在內容增長時，只要與末端的距離在這個點數以內，就會停留在末端（見下文）。 |
| `stickyHeaderIndices` | `.sticky_header_indices(..)` | `number[]` | | 捲過時黏附在頂部的項目（單欄，未反轉）。 |
| `stickyHeaderOffset` | `.sticky_header_offset(px(..))`、`.bind_sticky_header_offset(&node)` | `number \| AnimatedNode` | `0` | 黏性項目黏附在頂部以下多遠的位置，類似 CSS `position: sticky` 的 `top`；內容會繼續在它們上方的空間下捲動。動畫值會每一幀移動它們。 |
| `contentStyle` | `.content_padding(..)`、`.content_padding_x(..)`、...、`.row_gap(..)`、`.column_gap(..)` | `{ padding*, gap, rowGap, columnGap }` | | 內容的內距和間距，只接受數字。 |
| `contentClass` | | `string` | | 與 class（`p-*`、`gap-*`）相同；`contentStyle` 的優先級高於它們。 |
| `header` | `.header(..)` | 元件或元素 | | 位於項目之前。 |
| `footer` | `.footer(..)` | 元件或元素 | | 位於項目之後。 |
| `empty` | `.empty(..)` | 元件或元素 | | 在沒有項目時取代項目顯示。 |
| `separator` | `.separator(\|\| ..)` | 元件或元素 | | 位於項目之間（單欄）。 |
| `initialScrollIndex` | `.initial_scroll_index(i)` | `number` | | 在第一幀之前捲動到此項目。 |
| `onLoadMore` | `.on_load_more(..)` | `() => void` | | 接近末端（見下文）。 |
| `loadMoreThreshold` | `.load_more_threshold(..)` | `number` | `1` | 距離末端多近（以可視區域數計）時觸發 `onLoadMore`。 |
| `onLoadMoreAtStart` | `.on_load_more_at_start(..)` | `() => void` | | 在捲動後接近開頭（見下文）。 |
| `loadMoreAtStartThreshold` | `.load_more_at_start_threshold(..)` | `number` | `1` | 距離開頭多近（以可視區域數計）時觸發 `onLoadMoreAtStart`。 |
| `onViewableItemsChange` | `.on_viewable_items_change(..)` | `(info) => void` | | 項目變為可見或不再可見。 |
| `viewabilityConfig` | `.viewability(..)`、`.minimum_view_time(..)` | `ViewabilityConfig` | | 項目何時算作可見。 |
| `keyExtractor` | `.keys(..)` | `(item, index) => string` | | 可見性 token 中的鍵；在 Rust 中是各列的身分。 |
| `refreshing` / `onRefresh` | `.refreshing(..)` / `.on_refresh(..)` | `boolean` / `() => void` | | 下拉重新整理。 |
| `refreshIndicator` | `.refresh_indicator(..)` | `{ height: number }` | | 應用程式自己的下拉重新整理指示器，取代平台的載入圖示（見[捲動](./scrolling.md#an-indicator-of-your-own)）。 |
| `scrollbar` | `.scrollbar(..)` | `boolean \| ScrollbarTheme` | `true` | 是否顯示捲動指示器：使用平台的指示器，或在應用程式設定主題後使用其[內建捲動條](../elements/scrollbar.md#built-in-bars)；物件則是該視圖自己的主題。在桌面平台和桌面瀏覽器上，橫向視圖會保留它：它就是滑鼠的捲動條。 |
| `ref` | `.element_ref(&list)` | `ListRef` | | `scrollToIndex`、`scrollToOffset`、`scrollToEnd`、`scrollTo`。 |

標題、頁尾和空白插槽接受元素（在 TSX 中也可以是元件：`header={Header}`）。它們是各自獨立的儲存格，永遠不會被回收，而且與任何其他元素一樣具有響應性。

<a id="columns-and-grids"></a>

## 欄與網格

`numColumns`（`.columns(n)`）會把項目按指定的欄數排成列；內容內距包圍整個內容，列與欄之間有間距。網格中的各列高度可以不同：每一列的高度等於其中最高的項目。

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

## 黏性標題

`stickyHeaderIndices` 列出在內容捲過時黏附在可視區域頂部的項目，直到下一個黏性項目把它們推走為止。各區段是由標題項目和列項目組成的同一個列表；標題的索引會被黏附。黏附由原生端在每一個捲動幀完成。

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

由於同一個儲存格可能現在顯示標題、稍後顯示名稱，列需要使用 [`when` / `<If>`](../elements/control-flow.md) 來決定呈現什麼，它會在列改變時切換。黏性標題需要單欄且未反轉的列表。

`stickyHeaderOffset`（Rust 中是 `.sticky_header_offset(..)`）可讓標題改為黏附在頂部以下指定的點數處，就像 CSS `position: sticky` 的 `top` 一樣：在一個 56 點高的半透明列下方，`stickyHeaderOffset={56}`（`.sticky_header_offset(px(56.0))`）會讓每個標題保持在該列之下，而各列繼續在它下方捲動，下一個標題則由該處把它推走。負偏移會令標題的一部分落在可視範圍之外。

偏移量可以是[動畫值](./animation.md#animated-values)（Rust 中是 `.bind_sticky_header_offset(&node)`）：標題會在 UI 執行緒上每一幀跟隨它，因此能停留在會移動的列下方。當列在內容向下捲動時隱藏、向上捲動時重新出現（[`diffClamp`](./animation.md#arithmetic-and-diffclamp)），標題無論它在哪裡，都會黏附在它的底部邊緣：

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

## 聊天：反轉列表

`inverted` 會從末端開始排列列表：項目 0 在底部，列表一開始就捲動到末端，並在項目改變時保持與末端的距離。請把最新的訊息放在最前面；在前面插入以新增訊息，在後面附加並以 `onLoadMore` 載入較舊的訊息（反轉列表的「末端」是頂部）。如果聊天是在一則舊訊息處打開的，可以使用 [`onLoadMoreAtStart`](#loading-at-the-start-onloadmoreatstart) 載入較新的訊息；使用後，列表在底部時會保持與底部的距離，向上捲動時則會讓螢幕上的訊息留在原處。

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

在反轉列表上，`scroll_to_end(..)` / `scrollToEnd()` 會捲動到它的開頭：即最新的訊息。

<a id="following-the-end-of-a-list-that-is-not-inverted"></a>

### 跟隨未反轉列表的末端

按閱讀順序排列（最舊的在前）的列表同樣可以跟隨它的末端：在 Rust 中使用 `.follow_end(px(40.0))`，在 TSX 中使用 `maintainVisibleContentPosition={{ autoscrollToBottomThreshold: 40 }}`，當使用者位於末端（或距離末端 40 點以內）時，列表會在內容增長時停留在末端，例如回覆內容串流寫入最後一個項目、附加了新訊息，或鍵盤令列表縮小。如果已向上捲動較遠，可見內容會留在原處，新內容則在其下方增長。無論有沒有此選項，插入到可見項目上方的項目都不會移動它們。

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

## 橫向列表

`horizontal` 會把列表轉為橫向；儲存格按列表的高度排列。結合對齊捲動（snapping），就能製作任意長度的輪播：

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

在由右至左的語言環境中，橫向列表由右側開始，向左延伸。

<a id="lists-in-a-page-viewportparent"></a>

## 頁面中的列表：viewport="parent"

頁面經常是整頁一起捲動的：一個標題、幾張卡片，然後是一個很長的列表，下面可能還有另一個列表。為列表設定 `viewport="parent"`（Rust 中是 `.viewport(ListViewport::Parent)`），並把它與頁面其餘內容一起放在 `Scroll` 中：列表會以完整長度置於頁面內，由頁面的捲動視圖與其他內容一起捲動。它仍然只會建立頁面可視區域附近的列並回收其儲存格，因此一個頁面可以容納多個長列表。

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

- 列表的長度由它的列決定：它的高度（橫向時是寬度）來自其內容，與一般視圖相同，而它的內距、邊框和外距的運作方式也與視圖一樣。
- 它的列會沿著軸向跟隨周圍最近的捲動視圖，或所在的螢幕。
- 頁面會像瀏覽器一樣保持你正在閱讀的內容不動：完全位於可視區域頂部以上的列若改變大小，頁面會移動相同的幅度；當列表的開頭在可視範圍內時，增高的列會把其下方的內容往下推。
- `scrollToIndex`、`scrollToEnd` 和 `initialScrollIndex` 會在頁面內容範圍內把頁面捲動到列表的列；`onLoadMore` 會在列表的末端接近可視區域時觸發，而 `onViewableItemsChange` 會回報位於頁面可視區域內的列。
- `stickyHeaderIndices` 和 `stickyHeaderOffset` 會讓列黏附在頁面頂部：區段標題會停留在頂部，而它的列在其下捲動，直到下一個標題把它推走，最後一個標題則會隨著其列表的末端離開。
- 頁面如何捲動由它的捲動視圖決定：請在 `Scroll` 上設定 `onScroll` 和其他捲動事件、`scrollValue`、`refreshing` / `onRefresh`、分頁與對齊捲動、`contentInset`、`scrollbar`、`scrollable` 和 `keyboardDismissMode`。反轉列表和 `maintainVisibleContentPosition` 是擁有自己可視區域的列表（`viewport="own"`，即預設值）的功能。
- 可視區域在建立列表時選定：如要切換，請呈現一個新的列表。

<a id="loading-more-onloadmore"></a>

## 載入更多：onLoadMore

當可視區域與末端的距離在 `loadMoreThreshold` 個可視區域以內（預設為 1：即前方一個螢幕）時，`onLoadMore`（`.on_load_more(..)`）就會觸發。請附加下一頁；當新的末端接近時，列表會再次觸發。

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

如上所示，請防止載入重疊：在某一頁仍在載入途中時，末端可能會被再次回報。
<a id="loading-at-the-start-onloadmoreatstart"></a>

## 在開頭載入：onLoadMoreAtStart

列表也可以從資料的中間開啟：例如聊天室開啟時定位到一則舊訊息（搜尋結果、回覆的引用），畫面顯示該訊息前後的一頁，較新的訊息仍待載入。當視口進入距離開頭 `loadMoreAtStartThreshold` 個視口以內（預設為 1）時，`onLoadMoreAtStart`（`.on_load_more_at_start(..)`）就會觸發；開頭指的是第 0 項所在的一側：一般列表的頂部，反向列表的底部。請把該頁資料加到前面：新資料在螢幕上方載入時，目前顯示的列會保持原位（反向列表在已離開底部後也一樣），之後列表會在下一次接近開頭時再次觸發，若該頁載入後仍然靠近開頭，則會立即再次觸發。

當使用者捲動到該處，或捲動指令將列表帶到該處時（包括 `initialScrollIndex`）便會觸發，因此從最新項目開啟的列表不會發出任何請求，而使用 `initialScrollIndex` 在靠近開頭處開啟的列表則會立即請求前一頁。

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

最新訊息載入完成後，就停止載入：之後新訊息會像一般聊天室一樣出現在開頭。

<a id="viewability"></a>

## 可見性

`onViewableItemsChange`（`.on_viewable_items_change(..)`）會回報哪些項目正顯示在螢幕上，可用於數據分析、自動播放可見的影片，或將訊息標記為已讀。在 TSX 中，它會收到 `{ viewableItems, changed }`，即由 `{ item, key, index, isViewable }` 組成的陣列；在 Rust 中，則是 `ViewableItems`，包含第一個和最後一個可見的列（`viewable`）以及狀態有變化的列（`changed()`）。可見性由原生端計算，你的程式碼只會收到變化的通知。

| `viewabilityConfig` | Rust | 說明 |
|---|---|---|
| `itemVisibleThreshold` | `Viewability { item_visible_threshold, .. }` | 項目必須有多少部分可見，範圍為 0 至 1。 |
| `viewAreaCoverageThreshold` | `Viewability { view_area_coverage_threshold, .. }` | 項目必須覆蓋視口的多少部分，範圍為 0 至 1。 |
| `minimumViewTime` | `.minimum_view_time(Duration)` | 項目必須持續保持可見多少毫秒才會被回報。 |

若未設定門檻，則只要有任何一個像素可見就算作可見。

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

## 以程式碼捲動

為列表指定 ref（Rust 中為 `element_ref()` 和 `.element_ref(&list)`，TSX 中為 `ref`）：

| Rust | TSX | 說明 |
|---|---|---|
| `scroll_to_index(index, view_position, view_offset, animated)` | `scrollToIndex({ index, animated?, viewPosition?, viewOffset? })` | 將第 `index` 項捲動到可見範圍。由 view position 決定其位置：0 為視口開頭（預設），0.5 為中間，1 為末端；view offset 可再進一步偏移。 |
| `scroll_to_offset(offset, animated)` | `scrollToOffset({ offset, animated? })` | 沿列表的軸向捲動到指定的內容偏移量。 |
| `scroll_to_end(animated)` | `scrollToEnd({ animated? })` | 捲動到內容的末端（反向列表則為開頭）。 |
| `scroll_to(point, animated)` | `scrollTo({ x?, y?, animated? })` | 捲動到指定的偏移量，與捲動視圖相同。 |

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

捲動到某個索引（以及捲動到末端）由原生端根據當時已知的尺寸解析：已測量的列使用測量值，其餘則使用預估尺寸。之後，列表會在周圍的列被測量時持續追蹤目標，因此能精確定位，直到使用者捲動或項目有所變更為止。若要讓列表在某個項目處開啟，請使用 `initialScrollIndex`（`.initial_scroll_index(..)`），而不要在第一個畫面之後才捲動。

<a id="a-settings-style-list"></a>

## 設定風格的列表

列表的外觀由應用程式自行決定：列表負責排列和回收列，而列、分隔線和表面都是你自己的視圖。分組的設定風格列表，就是一個帶有內距、分隔線，且首尾列為圓角的列表。把它做成你自己的元件，在應用程式列出設定的地方都可以使用：

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

## 效能注意事項

- 每個儲存格都是獨立進行版面配置，因此捲動時只會重新配置有變化的儲存格。請保持列的層級淺，並避免在每個畫面都會變化的列中讀取 signal。
- 原生端會分批請求儲存格，每個畫面最多進行數輪，並合併為一次更新；快速甩動時可在一個畫面內綁定大量儲存格，而不需要為每個儲存格呼叫一次你的程式碼。Rust 的列則在核心內部、需要它們的那次提交中完成綁定。
- 使用 [`nsh test --trace` 搭配 `scroll` 步驟](./testing-and-trace.md#scrolling)來測量各列在每個畫面的開銷。

<a id="related"></a>

## 相關內容

- [`List` 元素](../elements/list.md)：參考文件。
- [捲動](./scrolling.md)：列表與捲動視圖共用的捲動屬性。
- [響應式](./reactivity.md)：為何列要在綁定中讀取其位置。
- [效能](./performance.md)：測量列表。
