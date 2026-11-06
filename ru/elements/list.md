---
title: "List"
description: "Виртуализированный список с переиспользованием элементов: строки, столбцы, закреплённые заголовки, инвертированные списки для чатов, отслеживание видимости элементов и прокрутка к нужному элементу."
order: 50
group: primitives
demo: el-list
source_hash: 6e5480c9dd9e1df4
---

# List

`List` показывает длинные или неограниченные данные. Существуют только строки рядом с областью просмотра: по мере прокрутки строки, которые уходят за её пределы, переиспользуются для строк, которые появляются. Какие строки существуют, их позиции, колонки, закреплённые заголовки и видимость — всё это вычисляется нативно, поэтому прокрутка списка из тысяч элементов обходится так же дёшево, как списка из двадцати. В Rust список создаётся с помощью `virtual_list(count, |at| row)`, в TSX — с помощью `<List>` из `nsh`.

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

В TSX `List` является обобщённым: `List<T>` проверяет, что `each` и функция строки согласованы по типу элемента, который TypeScript выводит из `each` (см. [List API](../modules/nsh-list.md)). В Rust `virtual_list` принимает количество строк (значение, сигнал или замыкание: список растёт и сокращается на месте) и функцию, которая строит строку по `Position`; строки читают данные компонента через `at.index()`.

Для короткого списка, строки которого должны существовать все сразу (страница настроек, форма), проще использовать [`Each`](./control-flow.md) внутри [scroll view](./scroll.md). Список, оформленный как сгруппированная таблица, описан в разделе [список в стиле настроек](../docs/lists.md#a-settings-style-list). В [руководстве по спискам](../docs/lists.md) разобраны типовые шаблоны: бесконечная загрузка, чат, секции.

<a id="rows-are-recycled"></a>

## Строки переиспользуются

Функция строки выполняется один раз для каждой ячейки, а не для каждого элемента. Когда ячейка переиспользуется для другого элемента, её позиция меняется (TSX: аксессоры `item()` и `index()`; Rust: `at.index()`), и обновляется всё, что её читает:

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

Поэтому храните состояние отдельных элементов в своих данных (по ключу id), а не в сигналах, созданных внутри функции строки: такой сигнал остаётся за ячейкой и окажется на другом элементе.

Ячейки, ожидающие следующего элемента, скрываются, как только их строка исчезла или показана другой ячейкой, поэтому программы чтения с экрана, касания и UI-тесты встречают каждую строку один раз.

<a id="props"></a>

## Свойства

| Свойство | Rust | Тип | По умолчанию | Описание |
|---|---|---|---|---|
| `each` | `virtual_list(count, ..)` | `readonly T[]` | | Элементы. |
| `children` | `virtual_list(.., \|at\| row)` | `(item: () => T, index: () => number) => JSX.Element` | | Отрисовывает одну строку. |
| `estimatedItemSize` | `.estimated_item_size(px(..))` | `number` | `50` | Размер ещё не измеренных элементов, в пунктах. Близкие оценки делают полосу прокрутки стабильной. |
| `horizontal` | `.horizontal()` | `boolean` | `false` | Прокрутка по горизонтали. |
| `viewport` | `.viewport(ListViewport::..)` | `"own" \| "parent"` | `"own"` | `"own"`: список прокручивается в собственном scroll view. `"parent"`: он занимает в раскладке родителя всю свою длину и отрисовывает строки рядом с областью просмотра окружающего scroll view, который прокручивает его вместе с остальной страницей (см. [списки на странице](../docs/lists.md#lists-in-a-page-viewportparent)). Выбирается при создании списка. |
| `numColumns` | `.columns(n)` | `number` | `1` | Количество элементов в строке (вертикальные списки). |
| `inverted` | `.inverted()` | `boolean` | `false` | Раскладка с конца, элемент 0 последний (как в чате): список изначально прокручен в конец и сохраняет расстояние до конца при изменении содержимого. |
| `maintainVisibleContentPosition` | `.follow_end(px(threshold))` | `{ autoscrollToBottomThreshold?: number }` | | Для неинвертированных списков: в конце содержимого или в пределах указанного числа пунктов от него список остаётся в конце, когда содержимое растёт или область просмотра уменьшается; если прокручено выше, видимое содержимое остаётся на месте. |
| `stickyHeaderIndices` | `.sticky_header_indices([..])` | `number[]` | | Элементы, которые прилипают к началу после прокрутки мимо них (одна колонка, не инвертированный список). |
| `contentStyle` | `.content_padding(..)`, `.content_padding_x(..)`, `.row_gap(..)`, `.column_gap(..)`, … | `ListContentStyle` | | Отступы и промежутки содержимого, в пунктах: `padding`, `paddingHorizontal`, `paddingVertical`, `paddingTop`, `paddingRight`, `paddingBottom`, `paddingLeft`, `gap`, `rowGap`, `columnGap`. |
| `contentClass` | | `string` | | Отступы и промежутки содержимого в виде классов (`p-*`, `gap-*`); `contentStyle` имеет над ними приоритет. |
| `header` | `.header(el)` | `ListSlot` | | Перед элементами: компонент (`Header`) или элемент (`<Header />`). |
| `footer` | `.footer(el)` | `ListSlot` | | После элементов. |
| `empty` | `.empty(el)` | `ListSlot` | | Показывается вместо элементов, пока `each` пуст. |
| `separator` | `.separator(\|\| el)` | `ListSlot` | | Между элементами (одна колонка). |
| `initialScrollIndex` | `.initial_scroll_index(i)` | `number` | | Прокручивает к этому элементу до первого кадра. |
| `keyExtractor` | `.keys(\|\| ids)` | `(item: T, index: number) => string` | `item.key`, `item.id` или индекс | Ключ элемента в токенах видимости. В Rust — идентичность строк, благодаря которой строки сохраняют свои ячейки и размеры, когда перед ними строки появляются или исчезают. |
| `onLoadMore` | `.on_load_more(..)` | `() => void` | | Конец близко: загрузить ещё. |
| `loadMoreThreshold` | `.load_more_threshold(viewports)` | `number` | `1` | Насколько близко к концу (в областях просмотра) срабатывает `onLoadMore`. |
| `onLoadMoreAtStart` | `.on_load_more_at_start(..)` | `() => void` | | Начало близко, после того как пользователь или команда прокрутки сдвинули список: загрузить то, что идёт перед первым элементом. |
| `loadMoreAtStartThreshold` | `.load_more_at_start_threshold(viewports)` | `number` | `1` | Насколько близко к началу (в областях просмотра) срабатывает `onLoadMoreAtStart`. |
| `onViewableItemsChange` | `.on_viewable_items_change(..)` | `(info: { viewableItems: ViewToken<T>[]; changed: ViewToken<T>[] }) => void` | | Элементы стали видимыми или перестали быть видимыми. |
| `viewabilityConfig` | `.viewability(..)`, `.minimum_view_time(..)` | `ViewabilityConfig` | | Когда элементы считаются видимыми (см. ниже). |
| `refreshing` | `.refreshing(..)` | `boolean` | | Показан индикатор pull-to-refresh. |
| `onRefresh` | `.on_refresh(..)` | `() => void` | | Пользователь потянул список для обновления. |
| `refreshIndicator` | `.refresh_indicator(Some(height))` | `{ height: number }` | | Приложение рисует собственный индикатор высотой `height` пунктов: системный индикатор скрыт, обновление запускается, когда натяжение достигает `height`, а во время обновления над содержимым сохраняется `height`. Высота 0 или меньше означает отсутствие индикатора. |
| `pullValue` | `.pull_value(&value)` | `AnimatedValue` | | Анимированное значение, в которое подаётся, насколько список оттянут за верхний край (0 в покое, растёт с натяжением; место, сохраняемое над содержимым во время обновления: `height` при `refreshIndicator`), для индикатора приложения. |
| `scrollbar` | `.scrollbar(..)` | `boolean \| ScrollbarTheme` | `true` | Показывается индикатор прокрутки: системный или [встроенная полоса](./scrollbar.md#built-in-bars) приложения, если оно задало тему; объект задаёт тему для самого представления. На десктопе и в десктопных браузерах горизонтальное представление сохраняет индикатор: это полоса прокрутки для мыши. |
| `scrollValue` | `.scroll_value(&value)` | `AnimatedValue` | | Анимированное значение, в которое подаётся смещение прокрутки, для анимаций, связанных с прокруткой. |
| `keyboardDismissMode` | `.keyboard_dismiss_mode(..)` | `"none" \| "on-drag" \| "interactive"` | `"none"` | Скрывает ли перетаскивание клавиатуру. |
| `style` | методы `Styled` | `StyleProp<ViewStyle>` | | Собственный стиль списка (нужен ограниченный размер: `flex: 1` или высота). |
| `testID` | `.test_id(id)` | `string` | | Идентификатор, по которому UI-тесты находят scroll view списка (`nsh test` — `id:`, XCUITest, UI Automator). |
| `ref` | `.element_ref(&handle)` | `ListRef \| (node: ListRef) => void` | | Ссылка (ref) на список (см. [методы ref](#ref-methods)). |

Списки также принимают свойства прокрутки [`Scroll`](./scroll.md#scrolling) (в Rust — методы `Scrollable`):
`pagingEnabled`, `snapToInterval`, `snapToOffsets`, `snapToAlignment`, `disableIntervalMomentum`, `decelerationRate`,
`bounces`, `contentInset`, `contentOffset`, `keyboardShouldPersistTaps`, `scrollEventThrottle` и `scrollable`.
Списки сохраняют свой масштаб.

Свойства, которые принимает любой элемент ([общие свойства](./index.md#common-props)), передаются в scroll view списка без изменений: `testID`, `accessibilityLabel` и остальные свойства доступности, стили, `onLayout`, свойства касаний и responder.
UI-тесты находят список по его `testID` так же, как любое другое представление.

`ViewabilityConfig` (Rust: `Viewability { item_visible_threshold, view_area_coverage_threshold }` и `.minimum_view_time(..)`):

| Поле | Тип | Описание |
|---|---|---|
| `itemVisibleThreshold` | `number` | Какая часть элемента должна быть видна, от 0 до 1. |
| `viewAreaCoverageThreshold` | `number` | Какую часть области просмотра должен занимать элемент, от 0 до 1. Если ни один порог не задан, учитывается любой видимый пиксель. |
| `minimumViewTime` | `number` | Сколько миллисекунд элементы должны оставаться видимыми, прежде чем о них будет сообщено. |

`ViewToken<T>` — это `{ item, key, index, isViewable }`. Обработчик в Rust получает `ViewableItems`: `indices()` — диапазон видимых строк, `changed()` — строки, которые появились или исчезли.

<a id="events"></a>

## События

| Событие | Rust | Данные | Когда |
|---|---|---|---|
| `onScroll` | `.on_scroll` | `ScrollEvent` | Смещение изменилось. |
| `onScrollDragStart` / `onScrollDragEnd` | `.on_scroll_drag_start` / `.on_scroll_drag_end` | `{ offset }` | Перетаскивание началось / закончилось. |
| `onMomentumStart` / `onMomentumEnd` | `.on_momentum_start` / `.on_momentum_end` | `{ offset }` | Инерционная прокрутка началась / закончилась. |
| `onScrollEnd` | `.on_scroll_end` | `{ offset }` | Прокрутка остановилась. |
| `onLoadMore` | `.on_load_more` | нет | В пределах `loadMoreThreshold` областей просмотра от конца. |
| `onLoadMoreAtStart` | `.on_load_more_at_start` | нет | В пределах `loadMoreAtStartThreshold` областей просмотра от начала, один раз за приближение после прокрутки. |
| `onViewableItemsChange` | `.on_viewable_items_change` | `{ viewableItems, changed }` (`ViewableItems`) | Видимость изменилась. |
| `onRefresh` | `.on_refresh` | нет | Список потянули для обновления. |

<a id="ref-methods"></a>

## Методы ref

| Метод | Rust | Описание |
|---|---|---|
| `scrollToIndex({ index, animated?, viewPosition?, viewOffset? })` | `scroll_to_index(index, percentage(0.5), px(0.0), animated)` | Прокручивает так, чтобы элемент `index` оказался в области просмотра. `viewPosition` задаёт его положение: 0 — в начале области просмотра (по умолчанию), 0.5 — посередине, 1 — в конце; `viewOffset` сдвигает его дальше. Вычисляется нативно с учётом текущих (измеренных или оценённых) размеров элементов. |
| `scrollToOffset({ offset, animated? })` | `scroll_to_offset(px(..), animated)` | Прокручивает до смещения вдоль оси списка. |
| `scrollToEnd({ animated? })` | `scroll_to_end(animated)` | Прокручивает до конца содержимого (до начала для инвертированного списка). |
| `scrollTo({ x?, y?, animated? })` | `scroll_to(point(..), animated)` | Прокручивает до смещения. |

<a id="examples"></a>

## Примеры

Сетка с заголовком и отслеживанием видимости:

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

Чат:

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

Элемент 0 — самое новое сообщение, отображаемое внизу; новые сообщения, добавленные в начало списка элементов, появляются, не сдвигая то, что читает пользователь.

<a id="platform-notes"></a>

## Особенности платформ

- Вставка элементов выше видимых строк сохраняет видимые строки на месте на обеих платформах.
- Горизонтальные списки в раскладках справа налево зеркально отражаются нативно.
- Закреплённые заголовки фиксируются нативно на каждом кадре прокрутки.
