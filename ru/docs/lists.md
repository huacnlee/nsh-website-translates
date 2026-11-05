---
title: "Списки"
description: "Длинные и бесконечные списки в Rust и TSX: переиспользование элементов (recycling), идентификация строк, колонки, закреплённые заголовки, инвертированные списки для чатов, горизонтальные списки, списки внутри страницы, подгрузка данных, отслеживание видимости и прокрутка к элементу."
order: 40
group: ui
demo: guide-lists
source_hash: fb4ffb925cc99200
---

# Списки

Список (`virtual_list(..)` в Rust, `List` из `nsh` в TSX) отображает большие объёмы данных на нативном scroll view, создавая только строки рядом с экраном. Какие строки существуют, где они располагаются, колонки, закреплённые заголовки и какие элементы видимы — всё это вычисляется нативно; ваш код лишь наполняет ячейки содержимым, когда нативная сторона запрашивает ячейку. Список из миллиона элементов обходится примерно так же, как список из тридцати.

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

В Rust `virtual_list(count, row)` принимает количество строк (значение, сигнал или замыкание) и функцию, которая строит строку по её позиции (`at.index()`); строки читают ваши данные по этому индексу. В TSX `each` принимает элементы, а функция строки получает элемент. Как и [scroll view](./scrolling.md), список является viewport и должен получить размер от родителя (`.flex_1()`, `flex: 1` или высоту).

<a id="how-recycling-works"></a>

## Как работает переиспользование ячеек

Функция строки вызывается не один раз на элемент. Она вызывается **один раз на ячейку**, а ячейки переиспользуются: когда строка уходит далеко за пределы экрана, её ячейка получает другую строку, и её позиция (`at.index()` в Rust, `item()` и `index()` в TSX) меняется. Всё в строке, что её читает, обновляется на месте, как и любой другой [сигнал](./reactivity.md).

Отсюда два правила:

**Читайте позицию там, где используете её.** Значение, скопированное в начале функции строки, принадлежит той строке, которую ячейка показала первой.

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

**Храните состояние элемента в данных, а не в строке.** Сигнал, созданный внутри строки, принадлежит ячейке и переходит вместе с ней к следующему элементу. Храните признак «строка развёрнута / выбрана / понравилась» в самих элементах или в множестве с ключом по id:

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

Строки могут иметь разную высоту. Пока строка не измерена, список использует предполагаемый размер элемента (по умолчанию 50 пунктов); передайте значение, близкое к типичной строке, чтобы индикатор прокрутки и переходы к далёким элементам были точными с самого начала.

<a id="changing-the-data"></a>

## Изменение данных

В Rust передавайте количество как сигнал или замыкание (`move || posts.with(Vec::len)`): список увеличивается и уменьшается на месте. Для строк, добавленных или удалённых в конце, больше ничего не нужно; когда строки появляются и исчезают в других местах, задайте их идентичности через `.keys(move || posts.with(|p| p.iter().map(|p| p.id).collect::<Vec<_>>()))`, и список сохранит общее начало и конец, а всё, что между ними, посчитает удалённым и вставленным.

В TSX для изменения элементов передайте новый массив: `posts.set([...posts(), ...more])`. Список сравнивает старый и новый массивы **по идентичности элементов** (`===`), сохраняет общее начало и конец, а всё, что между ними, считает удалённым и вставленным.

В обоих случаях измерения остаются за своими строками, а при вставке строк выше видимых видимые строки остаются на месте, а не прыгают.

- В TSX обновляйте неизменяемо: новый массив, в котором неизменённые объекты элементов используются повторно. Изменение массива на месте (`push`) не замечается.
- Изменённый элемент должен быть новым объектом (`{ ...post, title }`), чтобы его строка показала изменение.
- Добавление в начало (новые сообщения, обновлённая лента) сохраняет положение пользователя.

`keyExtractor` называет элементы в токенах видимости (ниже); по умолчанию ключом служит `item.key`, затем `item.id`, затем индекс. Он не влияет на то, как в TSX сопоставляются изменения: это всегда происходит по идентичности.

## Props

Список принимает все props прокрутки scroll view, имеющие смысл для списка (`pagingEnabled`, `snapToInterval`, `snapToOffsets`, `snapToAlignment`, `decelerationRate`, `disableIntervalMomentum`, `bounces`, `scrollable`, `contentInset`, `contentOffset`, `keyboardShouldPersistTaps`, `keyboardDismissMode`, `scrollEventThrottle`, `onScroll`, `onScrollDragStart`, `onScrollDragEnd`, `onMomentumStart`, `onMomentumEnd`, `onScrollEnd`, `scrollValue`, `pullValue`; в Rust — те же методы, что у scroll view), описанные в разделе [Прокрутка](./scrolling.md). Масштаб списков остаётся равным 1. Собственные props:

| Prop | Rust | Тип | По умолчанию | Описание |
|---|---|---|---|---|
| `each` | `virtual_list(count, ..)` | `readonly T[]` | | Элементы; в Rust — количество строк. |
| `children` | `virtual_list(.., row)` | `(item: () => T, index: () => number) => JSX.Element` | | Отображает ячейку; вызывается один раз на ячейку, см. [переиспользование ячеек](#how-recycling-works). |
| `estimatedItemSize` | `.estimated_item_size(px(..))` | `number` | `50` | Размер ещё не измеренных строк, в пунктах. |
| `horizontal` | `.horizontal()` | `boolean` | `false` | Прокрутка по горизонтали. |
| `viewport` | `.viewport(ListViewport::..)` | `"own" \| "parent"` | `"own"` | `"own"`: список прокручивается в собственном scroll view. `"parent"`: он лежит во всю свою длину в окружающем scroll view, который прокручивает его вместе с остальной страницей (см. [списки на странице](#lists-in-a-page-viewportparent)). Выбирается при создании списка. |
| `numColumns` | `.columns(n)` | `number` | `1` | Элементов в строке (вертикальные списки). |
| `inverted` | `.inverted()` | `boolean` | `false` | Элемент 0 внизу (чат); список начинается с конца и сохраняет расстояние до конца. |
| `maintainVisibleContentPosition` | `.follow_end(px(..))` | `{ autoscrollToBottomThreshold?: number }` | | Неинвертированный список остаётся в конце, пока находится в пределах этого числа пунктов от него, по мере роста содержимого (см. ниже). |
| `stickyHeaderIndices` | `.sticky_header_indices(..)` | `number[]` | | Элементы, которые прилипают к верху при прокрутке мимо них (одна колонка, не инвертированный). |
| `stickyHeaderOffset` | `.sticky_header_offset(px(..))`, `.bind_sticky_header_offset(&node)` | `number \| AnimatedNode` | `0` | Насколько ниже верха прилипают закреплённые элементы, как `top` у CSS `position: sticky`; содержимое продолжает прокручиваться под пространством над ними. Анимированное значение двигает их каждый кадр. |
| `contentStyle` | `.content_padding(..)`, `.content_padding_x(..)`, ..., `.row_gap(..)`, `.column_gap(..)` | `{ padding*, gap, rowGap, columnGap }` | | Отступы и промежутки содержимого, только числа. |
| `contentClass` | | `string` | | То же самое в виде классов (`p-*`, `gap-*`); `contentStyle` имеет над ними приоритет. |
| `header` | `.header(..)` | компонент или элемент | | Перед элементами. |
| `footer` | `.footer(..)` | компонент или элемент | | После элементов. |
| `empty` | `.empty(..)` | компонент или элемент | | Показывается вместо элементов, пока их нет. |
| `separator` | `.separator(\|\| ..)` | компонент или элемент | | Между элементами (одна колонка). |
| `initialScrollIndex` | `.initial_scroll_index(i)` | `number` | | Прокручивает к этому элементу до первого кадра. |
| `onLoadMore` | `.on_load_more(..)` | `() => void` | | Конец близко (см. ниже). |
| `loadMoreThreshold` | `.load_more_threshold(..)` | `number` | `1` | Насколько близко к концу, в viewport, срабатывает `onLoadMore`. |
| `onLoadMoreAtStart` | `.on_load_more_at_start(..)` | `() => void` | | Начало близко, после прокрутки (см. ниже). |
| `loadMoreAtStartThreshold` | `.load_more_at_start_threshold(..)` | `number` | `1` | Насколько близко к началу, в viewport, срабатывает `onLoadMoreAtStart`. |
| `onViewableItemsChange` | `.on_viewable_items_change(..)` | `(info) => void` | | Элементы стали или перестали быть видимыми. |
| `viewabilityConfig` | `.viewability(..)`, `.minimum_view_time(..)` | `ViewabilityConfig` | | Когда элементы считаются видимыми. |
| `keyExtractor` | `.keys(..)` | `(item, index) => string` | | Ключ в токенах видимости; в Rust — идентичности строк. |
| `refreshing` / `onRefresh` | `.refreshing(..)` / `.on_refresh(..)` | `boolean` / `() => void` | | Pull to refresh. |
| `refreshIndicator` | `.refresh_indicator(..)` | `{ height: number }` | | Собственный индикатор pull-to-refresh приложения вместо спиннера платформы (см. [Прокрутка](./scrolling.md#an-indicator-of-your-own)). |
| `scrollbar` | `.scrollbar(..)` | `boolean \| ScrollbarTheme` | `true` | Индикатор прокрутки показывается: платформенный или [встроенная полоса](../elements/scrollbar.md#built-in-bars) приложения, после того как оно задало тему; объект — это тема самого view. На десктопе и в десктопных браузерах горизонтальный view сохраняет его: это полоса прокрутки мыши. |
| `ref` | `.element_ref(&list)` | `ListRef` | | `scrollToIndex`, `scrollToOffset`, `scrollToEnd`, `scrollTo`. |

Слоты header, footer и empty принимают элемент (в TSX также компонент: `header={Header}`). Это отдельные ячейки, которые никогда не переиспользуются, и они реактивны, как любой другой элемент.

<a id="columns-and-grids"></a>

## Колонки и сетки

`numColumns` (`.columns(n)`) раскладывает элементы по строкам с таким числом колонок; отступы содержимого идут вокруг содержимого, а промежутки — между строками и колонками. Строки сетки могут иметь разную высоту: каждая строка такой высоты, как её самый высокий элемент.

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

## Закреплённые заголовки

`stickyHeaderIndices` перечисляет элементы, которые прилипают к верху viewport, пока содержимое прокручивается мимо них, пока следующий закреплённый элемент не вытолкнет их. Секции — это один список из элементов-заголовков и элементов-строк; закрепляются индексы заголовков. Закрепление выполняется нативно на каждом кадре прокрутки.

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

Поскольку ячейка может показывать то заголовок, то имя, строка решает, что отображать, с помощью [`when` / `<If>`](../elements/control-flow.md), который переключается при смене строки. Закреплённым заголовкам нужны одна колонка и неинвертированный список.

`stickyHeaderOffset` (`.sticky_header_offset(..)` в Rust) заставляет заголовки прилипать на столько пунктов ниже верха, как это делает `top` у CSS `position: sticky`: под полупрозрачной панелью высотой 56 пунктов `stickyHeaderOffset={56}` (`.sticky_header_offset(px(56.0))`) удерживает каждый заголовок под панелью, пока строки продолжают прокручиваться под ней, а следующий заголовок вытесняет его оттуда. Отрицательное смещение оставляет часть заголовка вне поля зрения.

Смещение может быть [анимированным значением](./animation.md#animated-values) (`.bind_sticky_header_offset(&node)` в Rust): заголовки следуют за ним каждый кадр в UI-потоке, поэтому остаются под панелью, которая движется. Если панель скрывается при прокрутке содержимого вниз и возвращается при прокрутке вверх ([`diffClamp`](./animation.md#arithmetic-and-diffclamp)), заголовки прилипают к её нижнему краю, где бы она ни находилась:

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

## Чат: инвертированные списки

`inverted` раскладывает список от конца: элемент 0 находится внизу, список начинается прокрученным до конца и сохраняет расстояние до конца при изменении элементов. Держите самое новое сообщение первым; добавляйте в начало, чтобы добавить новое, и в конец, чтобы загрузить более старые через `onLoadMore` («конец» инвертированного списка — это его верх). Чат, открытый на старом сообщении, подгружает более новые с помощью [`onLoadMoreAtStart`](#loading-at-the-start-onloadmoreatstart); при этом список сохраняет расстояние до низа, пока находится там, и оставляет сообщения на экране на месте при прокрутке вверх.

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

`scroll_to_end(..)` / `scrollToEnd()` на инвертированном списке прокручивает к его началу: к самому новому сообщению.

<a id="following-the-end-of-a-list-that-is-not-inverted"></a>

### Следование за концом неинвертированного списка

Список в порядке чтения (сначала самые старые) тоже может следовать за своим концом: с `.follow_end(px(40.0))` в Rust или `maintainVisibleContentPosition={{ autoscrollToBottomThreshold: 40 }}` в TSX, пока пользователь находится в конце (или в пределах 40 пунктов от него), список остаётся в конце по мере роста содержимого: ответ, стримящийся в последний элемент, новое добавленное сообщение, клавиатура, уменьшающая список. Если прокрутить выше, видимое содержимое остаётся на месте, а новое содержимое растёт под ним. Элементы, вставленные выше видимых, никогда не сдвигают их, независимо от этой опции.

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

## Горизонтальные списки

`horizontal` поворачивает список набок; ячейки раскладываются по высоте списка. В сочетании со snapping получается карусель любой длины:

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

При письме справа налево горизонтальные списки начинаются справа и идут влево.

<a id="lists-in-a-page-viewportparent"></a>

## Списки на странице: viewport="parent"

Страница часто прокручивается как единое целое: заголовок, несколько карточек, затем длинный список и, возможно, ещё один список ниже. Задайте списку `viewport="parent"` (`.viewport(ListViewport::Parent)` в Rust) и поместите его в `Scroll` вместе с остальной страницей: список лежит на странице во всю свою длину, а scroll view страницы прокручивает его вместе со всем остальным. Он по-прежнему создаёт только строки рядом с viewport страницы и переиспользует их ячейки, поэтому на одной странице может быть несколько длинных списков.

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

- Список настолько длинный, насколько длинны его строки: его высота (ширина — при горизонтальной прокрутке) определяется содержимым, как у view, а его отступы, рамка и поля работают как у view.
- Его строки следуют за ближайшим окружающим scroll view вдоль его оси или за экраном, на котором он находится.
- Страница сохраняет то, что вы читаете, на месте, как это делает браузер: строки, меняющие размер целиком выше верха viewport, сдвигают страницу на столько же; пока начало списка в поле зрения, растущие строки сдвигают то, что под ними, вниз.
- `scrollToIndex`, `scrollToEnd` и `initialScrollIndex` прокручивают страницу к строкам списка в пределах содержимого страницы; `onLoadMore` срабатывает, когда конец списка приближается к viewport, а `onViewableItemsChange` сообщает о строках в viewport страницы.
- `stickyHeaderIndices` и `stickyHeaderOffset` закрепляют строки у верха страницы: заголовок секции остаётся наверху, пока его строки прокручиваются под ним, пока следующий не вытолкнет его, а последний уходит вместе с концом своего списка.
- То, как прокручивается страница, определяется её scroll view: задавайте `onScroll` и другие события прокрутки, `scrollValue`, `refreshing` / `onRefresh`, постраничную прокрутку и snapping, `contentInset`, `scrollbar`, `scrollable` и `keyboardDismissMode` у `Scroll`. Инвертированные списки и `maintainVisibleContentPosition` — возможности списка с собственным viewport (`viewport="own"`, значение по умолчанию).
- Viewport выбирается при создании списка: чтобы переключить, отрисуйте новый список.

<a id="loading-more-onloadmore"></a>

## Подгрузка данных: onLoadMore

`onLoadMore` (`.on_load_more(..)`) срабатывает, когда viewport подходит к концу ближе чем на `loadMoreThreshold` viewport (по умолчанию 1: на один экран вперёд). Добавьте следующую страницу; список сработает снова, когда новый конец окажется близко.

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

Защищайтесь от перекрывающихся загрузок, как показано выше: конец может быть сообщен повторно, пока страница ещё в пути.
<a id="loading-at-the-start-onloadmoreatstart"></a>

## Загрузка в начале: onLoadMoreAtStart

Список может открываться и в середине своих данных: чат, открытый на старом сообщении (результат поиска, цитата ответа), показывает страницу вокруг него, а более новые сообщения ещё предстоит загрузить. `onLoadMoreAtStart` (`.on_load_more_at_start(..)`) срабатывает, когда область просмотра приближается к началу на расстояние `loadMoreAtStartThreshold` областей просмотра (по умолчанию 1). Началом считается сторона элемента 0: верх обычного списка или низ инвертированного. Добавляйте страницу в начало: строки на экране сохраняют своё место, пока она подгружается перед ними (в инвертированном списке тоже, если он прокручен от своего низа). Список сработает снова при следующем приближении или сразу же, если после добавления страницы он всё ещё находится рядом с началом.

Он срабатывает, когда пользователь прокручивает к началу или когда к нему список приводит команда прокрутки (включая `initialScrollIndex`). Поэтому список, открывающийся на самом новом элементе, ничего не запрашивает, а список, открытый через `initialScrollIndex` рядом с началом, сразу запрашивает предшествующую страницу.

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

Когда самое новое сообщение загружено, прекратите загрузку: новые сообщения затем приходят в начало, как в любом чате.

<a id="viewability"></a>

## Видимость элементов

`onViewableItemsChange` (`.on_viewable_items_change(..)`) сообщает, какие элементы находятся на экране: для аналитики, автовоспроизведения видимого видео или пометки сообщений прочитанными. В TSX он получает `{ viewableItems, changed }` — массивы токенов `{ item, key, index, isViewable }`; в Rust — `ViewableItems` с первой и последней видимой строкой (`viewable`) и строками, у которых изменилось состояние (`changed()`). Видимость вычисляется нативно; ваш код узнаёт только об изменениях.

| `viewabilityConfig` | Rust | Описание |
|---|---|---|
| `itemVisibleThreshold` | `Viewability { item_visible_threshold, .. }` | Какая часть элемента должна быть видна, от 0 до 1. |
| `viewAreaCoverageThreshold` | `Viewability { view_area_coverage_threshold, .. }` | Какую часть области просмотра должен занимать элемент, от 0 до 1. |
| `minimumViewTime` | `.minimum_view_time(Duration)` | Сколько миллисекунд элемент должен оставаться видимым, прежде чем о нём сообщат. |

Без порога учитывается любой видимый пиксель.

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

## Прокрутка из кода

Передайте списку ref (`element_ref()` и `.element_ref(&list)` в Rust, `ref` в TSX):

| Rust | TSX | Описание |
|---|---|---|
| `scroll_to_index(index, view_position, view_offset, animated)` | `scrollToIndex({ index, animated?, viewPosition?, viewOffset? })` | Прокручивает список так, чтобы элемент `index` оказался в области видимости. Позицию элемента задаёт view position: 0 — в начале области просмотра (по умолчанию), 0.5 — посередине, 1 — в конце; view offset сдвигает его дальше. |
| `scroll_to_offset(offset, animated)` | `scrollToOffset({ offset, animated? })` | Прокручивает до смещения в содержимом вдоль оси списка. |
| `scroll_to_end(animated)` | `scrollToEnd({ animated? })` | Прокручивает до конца содержимого (до начала для инвертированного списка). |
| `scroll_to(point, animated)` | `scrollTo({ x?, y?, animated? })` | Прокручивает до смещения, как в scroll view. |

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

Прокрутка к индексу (и к концу) разрешается нативно с учётом размеров, известных в этот момент: для измеренных строк берутся измеренные размеры, для остальных — оценочный. Затем список следует за своей целью, пока измеряются окружающие строки, и поэтому приземляется точно, пока пользователь не прокрутит список или элементы не изменятся. Чтобы открыть список на нужном элементе, используйте `initialScrollIndex` (`.initial_scroll_index(..)`), а не прокрутку после первого кадра.

<a id="a-settings-style-list"></a>

## Список в стиле настроек

Внешний вид списка определяет само приложение: список размещает и переиспользует строки, а строки, разделители и поверхности — это ваши представления. Сгруппированный список в стиле настроек — это список с отступами, разделителем и скруглёнными первой и последней строками. Оформите его как собственный компонент и используйте везде, где приложение показывает настройки:

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

## Заметки о производительности

- Каждая ячейка раскладывается отдельно, поэтому при прокрутке раскладываются только изменившиеся ячейки. Делайте строки неглубокими и не читайте сигналы в строках, которые меняются в каждом кадре.
- Нативная сторона запрашивает ячейки пакетами, до нескольких раундов за кадр, и объединяет их в одно обновление; при быстром броске в одном кадре привязывается много ячеек, без вызова вашего кода на каждую ячейку. Строки на Rust привязываются в самом ядре, в рамках коммита, которому они нужны.
- Используйте [`nsh test --trace` с шагом `scroll`](./testing-and-trace.md#scrolling), чтобы измерить покадровую стоимость ваших строк.

<a id="related"></a>

## См. также

- [Элемент `List`](../elements/list.md): справочник.
- [Прокрутка](./scrolling.md): свойства прокрутки, общие для списков и scroll view.
- [Реактивность](./reactivity.md): почему строки читают свою позицию в привязках.
- [Производительность](./performance.md): измерение списков.
