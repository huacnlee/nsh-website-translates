---
title: "List"
description: "List — виртуализированный список с переиспользованием элементов на нативном scroll view, со всеми его свойствами, событиями и методами ref."
order: 2.1
source_hash: 6aa08fac2fd24e8c
---

# List

`nsh` экспортирует `List`: виртуализированный список на нативном scroll view. Существуют только строки рядом с областью просмотра, а их ячейки переиспользуются при прокрутке. Какие строки существуют, где они находятся, колонки, закреплённые заголовки и видимость вычисляются нативно, поэтому прокрутка списка из десяти тысяч элементов не запускает JS, кроме привязок строк, которые меняются при переиспользовании ячейки.

```ts
import { List, type ListProps, type ViewToken, type ViewabilityConfig } from "nsh";
```

Руководство см. в разделе [Списки](../docs/lists.md), а свойства элемента — в [`<List>`](../elements/list.md).

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

### Строки переиспользуются

`children` — это функция, которая отрисовывает **одну ячейку**. Она выполняется один раз на ячейку, а не на элемент: когда ячейка уходит из области просмотра, она переиспользуется для другого элемента, и `item()` и `index()` (оба — аксессоры) меняются. Читайте их внутри JSX-выражений (`{item().name}`), чтобы ячейка обновлялась при переиспользовании.

> [!WARNING]
> Не храните состояние отдельных элементов в сигналах, созданных внутри функции строки: ячейка переиспользуется для других элементов, и сигнал будет следовать за ячейкой, а не за элементом. Храните состояние в своих данных по id (например, в сигнале с `Set` выбранных id).

## Props

`ListProps<T>` объединяет собственные свойства списка, свойства прокрутки, общие с `<Scroll>`, и свойства, которые принимает любой
элемент; последние передаются в scroll view списка.

<a id="data-and-rendering"></a>

### Данные и отрисовка

| Свойство | Тип | По умолчанию | Описание |
|---|---|---|---|
| `each` | `readonly T[]` | (обязательно) | Элементы. Передайте значение сигнала (`each={items()}`), чтобы отслеживать изменения; вставка элементов выше видимых строк оставляет эти строки на месте. |
| `children` | `(item: () => T, index: () => number) => JSX.Element` | (обязательно) | Отрисовывает одну строку (см. выше). |
| `estimatedItemSize` | `number` | `50` | Размер ещё не измеренных строк в пунктах вдоль оси списка. Близкие оценки делают индикатор прокрутки и `scrollToIndex` точнее. |
| `numColumns` | `number` | `1` | Элементов в строке (вертикальные списки): сетка. |
| `horizontal` | `boolean` | `false` | Прокрутка в горизонтальном направлении. |
| `inverted` | `boolean` | `false` | Раскладывает элементы с конца, элемент 0 последним (как в чате); начинается с прокрутки до конца и сохраняет расстояние до конца при изменении содержимого. |
| `stickyHeaderIndices` | `number[]` | | Элементы, которые закрепляются в начале при прокрутке мимо них (одна колонка, не инвертированный список). |
| `header` | `ListSlot` | | Отрисовывается перед элементами. |
| `footer` | `ListSlot` | | Отрисовывается после элементов. |
| `empty` | `ListSlot` | | Показывается вместо элементов, пока `each` пуст. |
| `separator` | `ListSlot` | | Отрисовывается между элементами (одна колонка). |
| `keyExtractor` | `(item: T, index: number) => string` | `item.key`, `item.id` или индекс | Ключ элемента в токенах видимости. |
| `initialScrollIndex` | `number` | | Прокручивает к этому элементу до первого кадра. |
| `contentStyle` | `ListContentStyle` | | Отступы и промежутки содержимого: `padding`, `paddingHorizontal`, `paddingVertical`, `paddingTop`, `paddingRight`, `paddingBottom`, `paddingLeft`, `gap`, `rowGap`, `columnGap` (числа). |
| `contentClass` | `string` | | Отступы и промежутки содержимого в виде классов (`p-*`, `gap-*`); `contentStyle` имеет приоритет над ними. |
| `style` | `StyleProp<ViewStyle>` | | Собственный стиль списка (задайте ему размер: `flex: 1` или высоту). |
| `testID` | `string` | | Идентификатор, по которому UI-тесты находят scroll view списка (`id:` у `nsh test`, XCUITest, UI Automator). |
| `ref` | `ListRef \| ((node: ListRef) => void)` | | См. [методы ref](#ref-methods). |

`ListSlot` — это компонент (`Header`) или элемент (`<Header />`).

<a id="loading-refreshing-and-viewability"></a>

### Загрузка, обновление и видимость

| Свойство | Тип | По умолчанию | Описание |
|---|---|---|---|
| `onLoadMore` | `() => void` | | Вызывается, когда до конца остаётся не более `loadMoreThreshold` областей просмотра: загрузите ещё. |
| `loadMoreThreshold` | `number` | `1` | Насколько близко к концу (в длинах области просмотра) срабатывает `onLoadMore`. |
| `onLoadMoreAtStart` | `() => void` | | Вызывается, когда до начала остаётся не более `loadMoreAtStartThreshold` областей просмотра после того, как пользователь или команда прокрутки сдвинули список: загрузите то, что идёт перед первым элементом. |
| `loadMoreAtStartThreshold` | `number` | `1` | Насколько близко к началу (в длинах области просмотра) срабатывает `onLoadMoreAtStart`. |
| `refreshing` | `boolean` | | Показывается индикатор pull-to-refresh. |
| `onRefresh` | `() => void` | | Включает pull to refresh; установите `refreshing` на время загрузки. |
| `refreshIndicator` | `{ height: number }` | | Приложение рисует собственный индикатор pull-to-refresh высотой `height` вместо стандартного спиннера. |
| `pullValue` | `AnimatedValue` | | Получает значение того, насколько список оттянут за верхний край, для этого индикатора. |
| `onViewableItemsChange` | `(info: { viewableItems: ViewToken<T>[]; changed: ViewToken<T>[] }) => void` | | Элементы, которые стали видимыми или перестали быть видимыми. |
| `viewabilityConfig` | `ViewabilityConfig` | | Когда элемент считается видимым. |

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

### Прокрутка

| Свойство | Тип | По умолчанию | Описание |
|---|---|---|---|
| `scrollbar` | `boolean \| ScrollbarTheme` | `true` | Индикатор прокрутки показывается: платформенный или [встроенная полоса](../elements/scrollbar.md#built-in-bars) приложения; объект — это тема собственного индикатора view. |
| `scrollable` | `boolean` | `true` | Пользователь может прокручивать. |
| `bounces` | `boolean` | `true` | Прокрутка за края (overscroll). |
| `pagingEnabled` | `boolean` | `false` | Останавливается на кратных значениях размера области просмотра. |
| `snapToInterval` | `number` | `0` | Останавливается на кратных значениях этой длины (0: выключено). |
| `snapToOffsets` | `number[]` | | Останавливается на этих смещениях. |
| `snapToAlignment` | `"start" \| "center" \| "end"` | `"start"` | Какая точка элемента выравнивается с областью просмотра при `snapToInterval`. |
| `disableIntervalMomentum` | `boolean` | `false` | Бросок (fling) перемещает не более чем на одну точку привязки. |
| `decelerationRate` | `"normal" \| "fast" \| number` | платформенное | Как быстро замедляется бросок (`0.998` / `0.99` или скорость, сохраняемая за миллисекунду). |
| `contentInset` | `Partial<Edges>` | | Пространство вокруг содержимого. |
| `contentOffset` | `{ x?, y? }` | | Откуда оно начинается. |
| `keyboardShouldPersistTaps` | `"never" \| "always" \| "handled" \| boolean` | `"never"` | Скрывает ли нажатие клавиатуру (`"never"`: нажатие только скрывает её). |
| `keyboardDismissMode` | `"none" \| "on-drag" \| "interactive"` | `"none"` | Скрывает ли перетаскивание клавиатуру. |
| `scrollEventThrottle` | `number` | | Минимум миллисекунд между событиями `onScroll` (в любом случае не более одного за кадр). |
| `scrollValue` | `AnimatedValue` | | [Анимированное значение](./nsh.md#animation), которое получает смещение прокрутки (по главной оси) в UI-потоке, для эффектов, привязанных к прокрутке. |

<a id="scroll-events"></a>

### События прокрутки

| Событие | Данные | Когда |
|---|---|---|
| `onScroll` | `ScrollEvent`: `{ offset, contentSize, size, zoomScale }` | Во время прокрутки. |
| `onScrollDragStart` | `{ offset }` | Начинается перетаскивание. |
| `onScrollDragEnd` | `{ offset }` | Палец отрывается. |
| `onMomentumStart` | `{ offset }` | После перетаскивания начинается скольжение. |
| `onMomentumEnd` | `{ offset }` | Скольжение заканчивается (в том числе когда его перехватывает новое перетаскивание). |
| `onScrollEnd` | `{ offset }` | Прокрутка остановилась. |

Списки также принимают свойства, которые принимает любой элемент ([общие свойства](../elements/index.md)).

<a id="ref-methods"></a>

## Методы ref

`ref` списка получает `ListRef` со следующими методами в дополнение к методам `ViewRef`:

| Метод | Описание |
|---|---|
| `scrollToIndex({ index, animated?, viewPosition?, viewOffset? })` | Прокручивает так, чтобы элемент `index` оказался в области просмотра. `viewPosition` определяет положение: `0` в начале области просмотра (по умолчанию), `0.5` посередине, `1` в конце; `viewOffset` сдвигает его дополнительно. Вычисляется нативно по измеренным (или оценочным) размерам строк. |
| `scrollToOffset({ offset, animated? })` | Прокручивает к смещению содержимого вдоль оси списка. |
| `scrollToEnd({ animated? })` | Прокручивает к концу содержимого (к началу инвертированного списка). |
| `scrollTo({ x?, y?, animated? })` | Прокручивает к смещению. |

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

## Примеры

Чат: новейшее сообщение внизу, более старые сообщения подгружаются при прокрутке вверх.

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

Половина `ListProps`, отвечающая за данные и строки: то, что вы передаёте в собственный компонент, который сам раскладывает список, например в список настроек, оборачивающий `List` со своими отступами и разделителями.
