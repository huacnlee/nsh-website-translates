---
title: "Scroll"
description: "Нативное представление прокрутки: вертикальная и горизонтальная прокрутка, постраничная прокрутка и привязка к позициям, обновление свайпом вниз, масштабирование и события прокрутки."
order: 40
group: primitives
demo: el-scroll
source_hash: a0ea652770335f03
---

# Scroll

`Scroll` — это нативный scroll view (UIScrollView на iOS и Mac Catalyst, ScrollView на Android). Он размещает все свои
дочерние элементы как содержимое и прокручивает их нативно: прокрутка, fling, bounce и snapping выполняются на стороне платформы
с частотой дисплея. В Rust его создают с помощью `scroll()`, в TSX — с помощью `<Scroll>` из `nsh`.

```rust tabs
use nsh_core::prelude::*;

scroll().flex_1().child(
    view().p_4().gap_2().child(each(
        rows,
        |row: &Row| row.id,
        |row, _index| text(move || row.get().title),
    )),
)
```

```tsx tabs
<Scroll style={{ flex: 1 }}>
  <View style={{ padding: 16, gap: 8 }}>
    <Each of={rows}>{(row) => <Text>{row().title}</Text>}</Each>
  </View>
</Scroll>
```

Scroll view создаёт всех своих потомков, что подходит для страниц умеренного размера. Для длинных или неограниченных данных используйте
[list](./list.md): он создаёт строки рядом с видимой областью и переиспользует их.

Scroll view нужен ограниченный размер вдоль его оси: задайте ему `flex: 1` (`.flex_1()`) или высоту внутри контейнера, у которого
она есть. Его содержимое размещается по ширине scroll view (по высоте, если он горизонтальный), а по другой оси имеет столько, сколько ему нужно.

## Props

Помимо [общих props](./index.md#common-props) (где `style` имеет тип `ViewStyle`). В Rust props прокрутки
являются методами трейта `Scrollable`, общего для списков.

### Scrolling

| Prop | Rust | Type | Default | Description |
|---|---|---|---|---|
| `horizontal` | `.horizontal()` | `boolean` | `false` | Прокручивается по горизонтали. |
| `scrollable` | `.scrollable(..)` | `boolean` | `true` | Пользователь может его прокручивать. |
| `scrollbar` | `.scrollbar(..)` | `boolean \| ScrollbarTheme` | `true` | Показывается индикатор прокрутки: платформенный или [встроенная полоса](./scrollbar.md#built-in-bars) приложения, если оно задало тему; объект — это тема самого представления. На десктопе и в десктопных браузерах горизонтальное представление сохраняет его: это полоса прокрутки мыши. |
| `bounces` | `.bounces(..)` | `boolean` | `true` | Прокрутка за границы (overscroll). |
| `pagingEnabled` | `.paging(..)` | `boolean` | `false` | Остановка на кратных размеру видимой области позициях. |
| `snapToInterval` | `.snap_interval(px(..))` | `number` | `0` | Остановка на позициях, кратных этой длине (0: выключено). |
| `snapToOffsets` | `.snap_offsets(..)` | `number[]` | | Остановка на этих смещениях. |
| `snapToAlignment` | `.snap_alignment(SnapAlignment::Center)` | `"start" \| "center" \| "end"` | `"start"` | Какая точка элемента выравнивается с видимой областью при `snapToInterval`. |
| `disableIntervalMomentum` | `.disable_interval_momentum(..)` | `boolean` | `false` | Fling сдвигает не более чем на одну точку привязки. |
| `decelerationRate` | `.deceleration(rate)` | `"normal" \| "fast" \| number` | платформенное | Как быстро затухает fling: доля скорости, сохраняемая за миллисекунду (`normal` 0.998, `fast` 0.99). |
| `contentInset` | `.content_inset(EdgeInsets { .. })` | `Partial<Edges>` | | Отступ вокруг содержимого. |
| `contentOffset` | `.content_offset(point(..))` | `{ x?, y? }` | | Откуда начинается прокрутка. |
| `contentStyle` | собственные стили content view | `ViewStyle` | | Стиль представления вокруг дочерних элементов, которое прокручивается вместе с ними; `flexGrow: 1` делает его не ниже видимой области (по центру — пустое состояние). |
| `contentClass` | собственные стили content view | `string` | | То же, что classes, например `"grow justify-center p-4"`. |
| `keyboardDismissMode` | `.keyboard_dismiss_mode(KeyboardDismissMode::OnDrag)` | `"none" \| "on-drag" \| "interactive"` | `"none"` | Скрывает ли перетаскивание клавиатуру. |
| `keyboardShouldPersistTaps` | `.keyboard_taps(KeyboardTaps::Handled)` | `"never" \| "always" \| "handled" \| boolean` | `"never"` | Скрывает ли касание клавиатуру: `never` (касание только скрывает её), `always` (она остаётся), `handled` (она остаётся, если касание что-то обрабатывает). |
| `scrollValue` | `.scroll_value(&value)` | `AnimatedValue` | | Анимируемое значение, получающее смещение прокрутки (по главной оси), для анимаций, связанных с прокруткой. |
| `scrollEventThrottle` | `.event_throttle(ms)` | `number` | | Минимальное число миллисекунд между событиями `onScroll` (в любом случае не чаще одного за кадр). |

### Pull to refresh

| Prop | Rust | Type | Description |
|---|---|---|---|
| `refreshing` | `.refreshing(..)` | `boolean` | Показывается индикатор обновления. |
| `onRefresh` | `.on_refresh(..)` | `() => void` | Пользователь потянул для обновления: начните загрузку и держите `refreshing`, пока она не закончится. |
| `refreshIndicator` | `.refresh_indicator(Some(height))` | `{ height: number }` | Приложение рисует собственный индикатор высотой `height` пунктов: платформенный спиннер скрыт, обновление срабатывает, когда натяжение достигает `height`, а во время обновления над содержимым сохраняется `height`. Высота 0 или меньше означает отсутствие индикатора. |
| `pullValue` | `.pull_value(&value)` | `AnimatedValue` | Анимируемое значение, получающее величину натяжения представления за его верхний край (0 в покое, растёт с натяжением; место, сохраняемое над содержимым во время обновления: `height` при `refreshIndicator`), для индикатора приложения. |

```rust tabs
let refreshing = signal(false);

scroll()
    .flex_1()
    .refreshing(refreshing)
    .on_refresh(move || {
        refreshing.set(true);
        spawn(async move {
            load().await;
            refreshing.set(false);
        });
    })
    .child(content())
```

```tsx tabs
const refreshing = signal(false);
async function reload() {
  refreshing.set(true);
  await load();
  refreshing.set(false);
}

<Scroll style={{ flex: 1 }} refreshing={refreshing()} onRefresh={reload}>
  …
</Scroll>;
```

### Zooming

Если задать `maximumZoomScale` больше `minimumZoomScale` (`.zoom_range(min, max)` в Rust), содержимое можно масштабировать
щипком; при увеличении оно прокручивается в обе стороны. Списки сохраняют свой масштаб.

| Prop | Rust | Type | Default | Description |
|---|---|---|---|---|
| `minimumZoomScale` | `.zoom_range(min, max)` | `number` | `1` | Наименьший масштаб. |
| `maximumZoomScale` | `.zoom_range(min, max)` | `number` | `1` | Наибольший масштаб. |
| `zoomScale` | `.zoom(..)` | `number` | | Масштабирует до этого значения при его изменении; в остальных случаях масштаб пользователя сохраняется. |
| `bouncesZoom` | `.bounces_zoom(..)` | `boolean` | `true` | Щипок может выйти за пределы и пружинно вернуться. |
| `zoomable` | `.zoomable(..)` | `boolean` | `true` | Пользователь может масштабировать щипком. |
| `centerContent` | `.center_content(..)` | `boolean` | `false` | Содержимое меньше видимой области (при уменьшении) центрируется. |

```rust tabs
let photo = element_ref();

scroll()
    .element_ref(&photo)
    .zoom_range(1.0, 4.0)
    .center_content(true)
    .flex_1()
    .bg(black())
    .child(
        image(PICTURE)
            .w(px(390.0))
            .h(px(520.0))
            .on_press(move || photo.zoom_to(1.0, None, true)),
    )
```

```tsx tabs
let photo!: ScrollRef;
<Scroll ref={photo} maximumZoomScale={4} centerContent style={{ flex: 1, backgroundColor: "#000" }}>
  <Image src={picture} style={{ width: 390, height: 520 }} onPress={() => photo.zoomTo({ scale: 1, animated: true })} />
</Scroll>;
```

## Events

| Event | Rust | Payload | When |
|---|---|---|---|
| `onScroll` | `.on_scroll` | `ScrollEvent` | Смещение изменилось (не чаще одного раза за кадр и не чаще, чем `scrollEventThrottle`). |
| `onScrollDragStart` / `onScrollDragEnd` | `.on_scroll_drag_start` / `.on_scroll_drag_end` | `{ offset }` (`Point<Points>`) | Пользователь начал / закончил перетаскивание. |
| `onMomentumStart` / `onMomentumEnd` | `.on_momentum_start` / `.on_momentum_end` | `{ offset }` | Скольжение после перетаскивания началось / закончилось. Скольжение, прерванное новым перетаскиванием, всё равно завершается событием `onMomentumEnd`. |
| `onScrollEnd` | `.on_scroll_end` | `{ offset }` | Прокрутка остановилась. |
| `onRefresh` | `.on_refresh` | нет | Потянули для обновления. |

`ScrollEvent` — это `{ offset: Point; contentSize: Size; size: Size; zoomScale }` (в Rust `offset`, `content_size`,
`size`, `zoom_scale`): смещение, размер содержимого (с учётом масштаба), размер видимой области и масштаб (1, если представление
не масштабируется).

> [!TIP]
> Чтобы двигать что-либо вместе с позицией прокрутки (сжимающийся заголовок, параллакс-изображение), привяжите `scrollValue` к нативному
> значению и интерполируйте его в стиле. Это выполняется в UI-потоке с частотой дисплея, тогда как `onScroll` — это событие на каждый
> кадр в коде приложения. См. [animation](../docs/animation.md).

## Ref methods

| Method | Rust | Description |
|---|---|---|
| `scrollTo({ x?, y?, animated? })` | `scroll_to(point(x, y), animated)` | Прокручивает к смещению. |
| `zoomTo({ scale, x?, y?, animated? })` | `zoom_to(scale, Some(point(x, y)), animated)` | Масштабирует до `scale` (в пределах ограничений) так, чтобы точка содержимого (`x`, `y`, в немасштабированных пунктах) оказалась в середине видимой области, либо относительно середины. Например, двойное касание, увеличивающее масштаб в точке касания. |

```rust tabs
let scroller = element_ref();
scroll().element_ref(&scroller).child(content());

scroller.scroll_to(point(px(0.0), px(0.0)), true);
```

```tsx tabs
let scroller!: ScrollRef;
<Scroll ref={scroller}>…</Scroll>;
scroller.scrollTo({ y: 0, animated: true });
```

## Keyboard

Поля ввода внутри scroll view нативно остаются вне зоны клавиатуры: scroll view получает нижний отступ и сам прокручивается к
полю в фокусе. Для содержимого вне scroll view используйте [`env(keyboard-inset-height)`](./keyboard.md)
в нижнем padding или margin. См. [forms and the keyboard](../docs/forms-and-keyboard.md).

## Right to left

Горизонтальные scroll view в раскладках справа налево начинаются с правого края и сохраняют расстояние до него при изменении содержимого;
их дочерние элементы зеркально отражаются.

## Platform notes

- Android: pull to refresh рисуется NSH (overscroll остаётся нативным), `contentInset` применяется как padding, а
  `decelerationRate` задаёт форму скольжений при snapping.
- Android масштабирует с помощью собственного scroll view из NSH, который масштабирует содержимое относительно его левого верхнего угла и прокручивает в обе стороны.
  Щипок начинается после минимального расстояния между пальцами, принятого в Android (около 27 мм).
- На Mac Catalyst (Mac idiom) NSH сам определяет натяжение и показывает свой спиннер.
- iOS перерисовывает тексты и canvas в масштабированном разрешении, когда масштабирование заканчивается.
