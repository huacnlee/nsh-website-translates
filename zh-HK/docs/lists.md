---
title: "清單"
description: "在 Rust 與 TSX 中處理長清單與無限清單：項目回收、列識別、欄位、黏性標頭、反向聊天清單、水平清單、頁面中的清單、載入更多、可見性偵測，以及捲動至指定項目。"
order: 40
group: ui
demo: guide-lists
---

# 列表

列表(Rust 中為 `virtual_list(..)`,TSX 中為來自 `nsh` 的 `List`)在原生捲動視圖上呈現大量資料,而且只會建立靠近螢幕的列。哪些列存在、它們放在哪裡、欄位、黏性標頭,以及哪些項目可見,全都由原生端計算;你的程式碼只需要在原生端要求時,把內容填入儲存格。一百萬筆項目的列表,成本與三十筆的列表相差無幾。

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

在 Rust 中,`virtual_list(count, row)` 接收列數(可以是值、signal 或 closure),以及一個根據位置(`at.index()`)建立列的函式;各列透過該索引讀取你的資料。在 TSX 中,`each` 接收項目,而列函式會取得該項目。與[捲動視圖](./scrolling.md)一樣,列表本身就是視埠,需要由父層提供尺寸(`.flex_1()`、`flex: 1` 或高度)。

<a id="how-recycling-works"></a>

## 回收機制如何運作

列函式並不是每個項目呼叫一次,而是**每個儲存格呼叫一次**,而且儲存格會被重複使用:當某一列捲動到遠離螢幕的位置時,它的儲存格會被分配給另一列,其位置(Rust 中為 `at.index()`,TSX 中為 `item()` 與 `index()`)隨之改變。列中所有讀取該位置的內容都會就地更新,就像任何其他 [signal](./reactivity.md) 一樣。

由此產生兩條規則:

**在使用位置的地方才讀取它。** 在列函式開頭複製出來的值,會屬於該儲存格最初顯示的那一列。

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

**將每個項目的狀態放在資料中,而不是列裡。** 在列內建立的 signal 屬於儲存格,並會隨儲存格移到下一個項目。請將「這一列是否展開/選取/按讚」儲存在項目中,或以 id 為鍵的集合中:

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

各列的高度可以不同。在某一列被測量之前,列表會假設其為預估項目大小(預設 50 點);請傳入接近你一般列高的值,讓捲動指示器與跳轉到遠處項目的位置從一開始就準確。

<a id="changing-the-data"></a>

## 變更資料

在 Rust 中,將列數以 signal 或 closure(`move || posts.with(Vec::len)`)提供:列表會就地增減。在尾端新增或移除列不需要其他處理;當列在其他位置出現或消失時,請用 `.keys(move || posts.with(|p| p.iter().map(|p| p.id).collect::<Vec<_>>()))` 提供它們的身分識別,列表會保留相同的開頭與結尾,並將中間部分視為已移除並重新插入。

在 TSX 中,傳入新的陣列即可變更項目:`posts.set([...posts(), ...more])`。列表會**依項目身分**(`===`)比較新舊陣列,保留相同的開頭與結尾,並將中間部分視為已移除並重新插入。

兩種情況下,測量結果都會保留在各自的列上;當在螢幕上的列之上插入新列時,可見的列會留在原處而不會跳動。

- 在 TSX 中,請以不可變方式更新:建立新陣列,並重複使用未變更的項目物件。就地修改陣列(`push`)不會被偵測到。
- 已變更的項目應為新的物件(`{ ...post, title }`),這樣它的列才會顯示變更。
- 在前面插入(新訊息、重新整理的動態消息)會保留使用者目前的位置。

`keyExtractor` 在可視性 token(見下文)中為項目命名;預設的鍵依序為 `item.key`、`item.id`,然後是索引。它不影響 TSX 中變更的比對方式,後者一律依身分比對。

## Props

列表接受捲動視圖中所有適用於列表的捲動 prop(`pagingEnabled`、`snapToInterval`、`snapToOffsets`、`snapToAlignment`、`decelerationRate`、`disableIntervalMomentum`、`bounces`、`scrollable`、`contentInset`、`contentOffset`、`keyboardShouldPersistTaps`、`keyboardDismissMode`、`scrollEventThrottle`、`onScroll`、`onScrollDragStart`、`onScrollDragEnd`、`onMomentumStart`、`onMomentumEnd`、`onScrollEnd`、`scrollValue`、`pullValue`;在 Rust 中是與捲動視圖相同的方法),詳見[捲動](./scrolling.md)。列表的縮放比例固定為 1。其專屬的 prop 如下:

| Prop | Rust | 型別 | 預設值 | 說明 |
|---|---|---|---|---|
| `each` | `virtual_list(count, ..)` | `readonly T[]` | | 項目;在 Rust 中為列數。 |
| `children` | `virtual_list(.., row)` | `(item: () => T, index: () => number) => JSX.Element` | | 繪製儲存格;每個儲存格呼叫一次,請見[回收機制](#how-recycling-works)。 |
| `estimatedItemSize` | `.estimated_item_size(px(..))` | `number` | `50` | 尚未測量的列的大小,單位為點。 |
| `horizontal` | `.horizontal()` | `boolean` | `false` | 橫向捲動。 |
| `viewport` | `.viewport(ListViewport::..)` | `"own" \| "parent"` | `"own"` | `"own"`:列表在自己的捲動視圖中捲動。`"parent"`:列表以完整長度置於周圍的捲動視圖中,由該視圖與頁面其餘內容一起捲動(請見[頁面中的列表](#lists-in-a-page-viewportparent))。於建立列表時選定。 |
| `numColumns` | `.columns(n)` | `number` | `1` | 每列的項目數(垂直列表)。 |
| `inverted` | `.inverted()` | `boolean` | `false` | 第 0 個項目位於底部(聊天);從結尾開始,並保持與結尾的距離。 |
| `maintainVisibleContentPosition` | `.follow_end(px(..))` | `{ autoscrollToBottomThreshold?: number }` | | 未反轉的列表在內容增長時,只要距離結尾在這麼多點之內,就會停留在結尾(見下文)。 |
| `stickyHeaderIndices` | `.sticky_header_indices(..)` | `number[]` | | 捲過後會黏在頂端的項目(單欄、未反轉)。 |
| `stickyHeaderOffset` | `.sticky_header_offset(px(..))`、`.bind_sticky_header_offset(&node)` | `number \| AnimatedNode` | `0` | 黏性項目黏在頂端下方多遠處,如同 CSS `position: sticky` 的 `top`;內容會繼續捲動到它們上方的空間之下。動畫值會在每一幀移動它們。 |
| `contentStyle` | `.content_padding(..)`、`.content_padding_x(..)`、...、`.row_gap(..)`、`.column_gap(..)` | `{ padding*, gap, rowGap, columnGap }` | | 內容的內距與間距,僅限數字。 |
| `contentClass` | | `string` | | 與 class 相同(`p-*`、`gap-*`);`contentStyle` 的優先順序較高。 |
| `header` | `.header(..)` | 元件或元素 | | 位於項目之前。 |
| `footer` | `.footer(..)` | 元件或元素 | | 位於項目之後。 |
| `empty` | `.empty(..)` | 元件或元素 | | 沒有項目時,顯示於項目的位置。 |
| `separator` | `.separator(\|\| ..)` | 元件或元素 | | 位於項目之間(單欄)。 |
| `initialScrollIndex` | `.initial_scroll_index(i)` | `number` | | 在第一幀之前捲動到此項目。 |
| `onLoadMore` | `.on_load_more(..)` | `() => void` | | 接近結尾(見下文)。 |
| `loadMoreThreshold` | `.load_more_threshold(..)` | `number` | `1` | 距離結尾多近(以視埠為單位)時觸發 `onLoadMore`。 |
| `onLoadMoreAtStart` | `.on_load_more_at_start(..)` | `() => void` | | 捲動之後接近開頭(見下文)。 |
| `loadMoreAtStartThreshold` | `.load_more_at_start_threshold(..)` | `number` | `1` | 距離開頭多近(以視埠為單位)時觸發 `onLoadMoreAtStart`。 |
| `onViewableItemsChange` | `.on_viewable_items_change(..)` | `(info) => void` | | 項目變為可視或不再可視。 |
| `viewabilityConfig` | `.viewability(..)`、`.minimum_view_time(..)` | `ViewabilityConfig` | | 項目在何時算作可視。 |
| `keyExtractor` | `.keys(..)` | `(item, index) => string` | | 可視性 token 中的鍵;在 Rust 中為各列的身分識別。 |
| `refreshing` / `onRefresh` | `.refreshing(..)` / `.on_refresh(..)` | `boolean` / `() => void` | | 下拉重新整理。 |
| `refreshIndicator` | `.refresh_indicator(..)` | `{ height: number }` | | 應用程式自己的下拉重新整理指示器,取代平台的旋轉指示器(請見[捲動](./scrolling.md#an-indicator-of-your-own))。 |
| `scrollbar` | `.scrollbar(..)` | `boolean \| ScrollbarTheme` | `true` | 是否顯示捲動指示器:使用平台的,或在應用程式設定主題後使用應用程式的[內建捲軸](../elements/scrollbar.md#built-in-bars);物件則是該視圖自己的主題。在桌面與桌面瀏覽器上,橫向視圖會保留它:它就是滑鼠的捲軸。 |
| `ref` | `.element_ref(&list)` | `ListRef` | | `scrollToIndex`、`scrollToOffset`、`scrollToEnd`、`scrollTo`。 |

標頭、頁尾與空白狀態的插槽接受元素(在 TSX 中也可以是元件:`header={Header}`)。它們是獨立的儲存格,永不回收,並且與其他元素一樣具有響應性。

<a id="columns-and-grids"></a>

## 欄位與網格

`numColumns`(`.columns(n)`)會將項目依該欄數排成一列;內容內距位於內容四周,列與欄之間有間距。網格中各列的高度可以不同:每一列的高度等於其中最高的項目。

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

## 黏性標頭

`stickyHeaderIndices` 列出會黏在視埠頂端的項目,內容會從它們下方捲過,直到下一個黏性項目將它們推出。分區是由標頭與列項目組成的同一個列表;標頭的索引會被黏住。固定動作由原生端在每個捲動幀上完成。

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

由於同一個儲存格可能現在顯示標頭、稍後顯示名稱,列會用 [`when` / `<If>`](../elements/control-flow.md) 來決定要繪製什麼,並在列變更時切換。黏性標頭需要單欄且未反轉的列表。

`stickyHeaderOffset`(Rust 中為 `.sticky_header_offset(..)`)會讓標頭改為黏在頂端下方那麼多點的位置,如同 CSS `position: sticky` 的 `top`:在一個 56 點高的半透明列之下,`stickyHeaderOffset={56}`(`.sticky_header_offset(px(56.0))`)會讓每個標頭保持在該列下方,而各列繼續在其下捲動,下一個標頭再從那裡將它推出。負的偏移量會讓標頭有一部分在視野之外。

偏移量可以是[動畫值](./animation.md#animated-values)(Rust 中為 `.bind_sticky_header_offset(&node)`):標頭會在 UI 執行緒上每一幀跟隨它,因此能始終停留在會移動的列之下。當列會在內容向下捲動時隱藏、向上捲動時回來([`diffClamp`](./animation.md#arithmetic-and-diffclamp)),標頭會黏在它的底部邊緣,無論它在哪裡:

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

## 聊天:反轉列表

`inverted` 會從結尾開始排列列表:第 0 個項目在底部,列表一開始就捲動到結尾,並在項目變更時保持與結尾的距離。請讓最新的訊息排在最前面;在前面插入即可新增訊息,在後面附加則以 `onLoadMore` 載入較舊的訊息(反轉列表的「結尾」是頂端)。若聊天從一則舊訊息開啟,可用 [`onLoadMoreAtStart`](#loading-at-the-start-onloadmoreatstart) 載入較新的訊息;使用它時,列表位於底部時會保持與底部的距離,向上捲動時則會讓螢幕上的訊息保持原位。

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

在反轉列表上,`scroll_to_end(..)` / `scrollToEnd()` 會捲動到它的開頭:也就是最新的訊息。

<a id="following-the-end-of-a-list-that-is-not-inverted"></a>

### 跟隨未反轉列表的結尾

依閱讀順序排列(最舊的在前)的列表也可以跟隨它的結尾:在 Rust 中使用 `.follow_end(px(40.0))`、在 TSX 中使用 `maintainVisibleContentPosition={{ autoscrollToBottomThreshold: 40 }}`,當使用者位於結尾(或距離結尾 40 點以內)時,列表會在內容增長時停留在結尾:例如回覆串流進入最後一個項目、附加了新訊息、鍵盤縮小了列表。若已向上捲動較遠,可見的內容會留在原處,新內容則在其下方增長。在可見項目之上插入的項目永遠不會移動它們,無論是否使用此選項。

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

`horizontal` 會讓列表轉為橫向;儲存格會以列表的高度排列。搭配吸附(snapping)使用,就能做出任意長度的輪播:

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

在由右至左的排版中,橫向列表從右側開始並向左延伸。

<a id="lists-in-a-page-viewportparent"></a>

## 頁面中的列表:viewport="parent"

頁面經常是整體捲動的:一個標頭、幾張卡片,然後是一個很長的列表,下方可能還有另一個列表。為列表設定 `viewport="parent"`(Rust 中為 `.viewport(ListViewport::Parent)`),並將它與頁面其餘內容一起放在 `Scroll` 中:列表會以完整長度置於頁面內,由頁面的捲動視圖與其他內容一起捲動。它仍然只會建立靠近頁面視埠的列並回收其儲存格,因此一個頁面可以容納多個很長的列表。

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

- 列表的長度取決於它的列:其高度(橫向時為寬度)來自其內容,與一般視圖相同,且它的內距、邊框與外距的運作方式也與視圖相同。
- 它的列會沿著自身的軸向跟隨周圍最近的捲動視圖,或其所在的螢幕。
- 頁面會像瀏覽器一樣保持你正在閱讀的內容位置:完全位於視埠頂端之上的列若改變大小,頁面會移動相同的距離;當列表的開頭在視野內時,變高的列會將其下方的內容往下推。
- `scrollToIndex`、`scrollToEnd` 與 `initialScrollIndex` 會在頁面內容範圍內,將頁面捲動到列表的各列;當列表的結尾接近視埠時會觸發 `onLoadMore`,而 `onViewableItemsChange` 則回報位於頁面視埠中的列。
- `stickyHeaderIndices` 與 `stickyHeaderOffset` 會讓列黏在頁面頂端:分區標頭在其列從下方捲過時停留在頂端,直到下一個將它推出,而最後一個會隨著其列表的結尾一起離開。
- 頁面如何捲動由它的捲動視圖決定:請在 `Scroll` 上設定 `onScroll` 與其他捲動事件、`scrollValue`、`refreshing` / `onRefresh`、分頁與吸附、`contentInset`、`scrollbar`、`scrollable` 以及 `keyboardDismissMode`。反轉列表與 `maintainVisibleContentPosition` 是擁有自己視埠的列表(`viewport="own"`,即預設值)的功能。
- 視埠是在建立列表時選定的:若要切換,請繪製一個新的列表。

<a id="loading-more-onloadmore"></a>

## 載入更多:onLoadMore

當視埠與結尾的距離進入 `loadMoreThreshold` 個視埠之內(預設為 1:提前一個螢幕)時,會觸發 `onLoadMore`(`.on_load_more(..)`)。請附加下一頁;當新的結尾接近時,列表會再次觸發。

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

如上所示,請防範重疊的載入:在某一頁還在載入途中時,結尾可能會被再次回報。
<a id="loading-at-the-start-onloadmoreatstart"></a>

## 從起點載入：onLoadMoreAtStart

列表也可以從資料的中間開啟：聊天室從一則舊訊息開啟（例如搜尋結果或回覆的引用）時，會顯示該訊息前後的一頁內容，而較新的訊息仍待載入。當可視區域與起點（第 0 項所在的一側：一般列表的頂端，反向列表的底端）的距離進入 `loadMoreAtStartThreshold` 個可視區域高度之內（預設為 1）時，會觸發 `onLoadMoreAtStart`（`.on_load_more_at_start(..)`）。請將該頁資料前置（prepend）：新資料在畫面上列的前方載入時，目前顯示的列會維持原位（反向列表在捲離底端之後同樣如此），之後列表會在下一次接近起點時再次觸發；如果該頁載入後列表仍靠近起點，則會立即再次觸發。

當使用者捲動到該處，或捲動指令將列表帶到該處（包含 `initialScrollIndex`）時才會觸發，因此從最新項目開啟的列表不會請求任何資料，而使用 `initialScrollIndex` 在靠近起點處開啟的列表，則會立即請求其之前的那一頁。

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

最新訊息載入完成後，請停止載入：之後新訊息會像在一般聊天室中一樣，從起點處進入。

## Viewability

`onViewableItemsChange`（`.on_viewable_items_change(..)`）會回報哪些項目顯示在畫面上，可用於數據分析、自動播放可見的影片，或將訊息標示為已讀。在 TSX 中，它會收到 `{ viewableItems, changed }`，即由 `{ item, key, index, isViewable }` 組成的陣列；在 Rust 中，則是 `ViewableItems`，其中包含第一個與最後一個可見的列（`viewable`），以及狀態有變化的列（`changed()`）。可見性（viewability）由原生端計算；你的程式碼只會收到變化的通知。

| `viewabilityConfig` | Rust | 說明 |
|---|---|---|
| `itemVisibleThreshold` | `Viewability { item_visible_threshold, .. }` | 項目必須有多少比例可見，範圍從 0 到 1。 |
| `viewAreaCoverageThreshold` | `Viewability { view_area_coverage_threshold, .. }` | 項目必須涵蓋可視區域的多少比例，範圍從 0 到 1。 |
| `minimumViewTime` | `.minimum_view_time(Duration)` | 項目必須持續保持可見多少毫秒後才會被回報。 |

若未設定門檻，只要有任何一個像素可見就算數。

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

為列表提供一個 ref（Rust 中為 `element_ref()` 與 `.element_ref(&list)`，TSX 中為 `ref`）：

| Rust | TSX | 說明 |
|---|---|---|
| `scroll_to_index(index, view_position, view_offset, animated)` | `scrollToIndex({ index, animated?, viewPosition?, viewOffset? })` | 將項目 `index` 捲動到可見範圍。由 view position 決定其位置：0 表示位於可視區域的起點（預設），0.5 表示置中，1 表示位於終點；view offset 則可進一步位移。 |
| `scroll_to_offset(offset, animated)` | `scrollToOffset({ offset, animated? })` | 沿列表的軸向捲動到指定的內容偏移量。 |
| `scroll_to_end(animated)` | `scrollToEnd({ animated? })` | 捲動到內容的終點（反向列表則為起點）。 |
| `scroll_to(point, animated)` | `scrollTo({ x?, y?, animated? })` | 捲動到指定的偏移量，與在 scroll view 上的做法相同。 |

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

捲動到指定索引（以及捲動到終點）會由原生端依當下已知的尺寸來解析：已測量的列使用測量值，其餘使用預估尺寸。接著列表會在周圍列被測量的過程中持續追蹤目標，因此能精確落在目標位置，直到使用者捲動或項目變更為止。若要讓列表在某個項目處開啟，請使用 `initialScrollIndex`（`.initial_scroll_index(..)`），而不要在第一個影格之後再進行捲動。

<a id="a-settings-style-list"></a>

## 設定風格的列表

列表的外觀由應用程式自行決定：列表負責擺放並回收各列，而列、分隔線與表面（surface）都是你自己的 view。分組式的設定風格列表，就是具有內距、分隔線，且第一列與最後一列為圓角的列表。請將它做成你自己的元件，並在應用程式中任何需要列出設定的地方使用：

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

- 每個儲存格都會獨立進行版面配置，因此捲動時只會重新配置有變動的儲存格。請保持列的層級淺，並避免在每個影格都會變動的列中讀取 signal。
- 原生端會分批請求儲存格，每個影格最多可進行數輪，並合併為一次更新；快速甩動捲動時，可在一個影格內綁定大量儲存格，而不需要為每個儲存格呼叫一次你的程式碼。Rust 的列則是在核心內部、需要它們的 commit 中完成綁定。
- 使用 [`nsh test --trace` 搭配 `scroll` 步驟](./testing-and-trace.md#scrolling)來衡量各列每個影格的成本。

<a id="related"></a>

## 相關內容

- [`List` 元素](../elements/list.md)：參考文件。
- [捲動](./scrolling.md)：列表與 scroll view 共用的捲動屬性。
- [響應式](./reactivity.md)：為什麼列要在綁定中讀取自己的位置。
- [效能](./performance.md)：衡量列表效能。
