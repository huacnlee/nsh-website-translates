---
title: "Прокрутка"
description: "Прокручиваемые представления (scroll views) в Rust и TSX: постраничная прокрутка и привязка к позициям, масштабирование, обновление жестом потягивания (pull to refresh), события прокрутки, эффекты, связанные с прокруткой, через scrollValue, клавиатура в прокручиваемых представлениях и прокрутка из кода."
order: 39
group: ui
demo: guide-scrolling
source_hash: 9701cda661979af8
---

# Прокрутка

Прокручиваемое представление (`scroll()` в Rust, `<Scroll>` в TSX) — это собственное представление прокрутки платформы (UIScrollView на iOS, ScrollView на Android): fling-жесты, отскоки, индикатор прокрутки и pull to refresh нативны, как и привязка к точкам остановки (snapping). Ваш код узнаёт о прокрутке через события и может привязать смещение к [анимируемому значению](./animation.md#animated-values) для эффектов, которые следуют за пальцем кадр за кадром.

Используйте прокручиваемое представление для содержимого известного и умеренного размера: страницы настроек, формы, статьи, ряда чипов. Для длинных или неограниченных данных используйте [список](./lists.md): он переиспользует строки и принимает те же свойства прокрутки.

<a id="a-scroll-view"></a>

## Прокручиваемое представление

Прокручиваемое представление — это окно просмотра (viewport), а его дочерние элементы — содержимое. Размер окну задаёт родитель (обычно `flex: 1`, `.flex_1()`), а содержимое раскладывается по ширине окна (вертикальная прокрутка) или по высоте (горизонтальная) и имеет ту длину, которая ему нужна.

```rust tabs
#[component]
pub fn App() -> impl IntoElement {
    scroll().flex_1().bg(rgb(0xf6f8fa)).child(
        view().p_4().gap_3().children((1..=50).map(|n| {
            view().p_4().rounded(px(10.0)).bg(white()).child(text(format!("Row {n}")))
        })),
    )
}
```

```tsx tabs
import { mount, Scroll, Text, View } from "nsh";

function App() {
  return (
    <Scroll style={{ flex: 1, backgroundColor: "#f6f8fa" }}>
      <View style={{ padding: 16, gap: 12 }}>
        <Each of={Array.from({ length: 50 }, (_, i) => i + 1)}>
          {(n) => (
            <View style={{ padding: 16, borderRadius: 10, backgroundColor: "#ffffff" }}>
              <Text>Row {n()}</Text>
            </View>
          )}
        </Each>
      </View>
    </Scroll>
  );
}

mount(App);
```

Дочернее представление выше — это контейнер содержимого прокручиваемого представления; в TSX `contentStyle` (или `contentClass`) создаёт его за вас, оборачивая дочерние элементы в представление с этим стилем, которое прокручивается вместе с ними. `flexGrow: 1` (`.flex_grow(1.0)`) делает содержимое не ниже окна просмотра, поэтому короткое содержимое можно центрировать, а длинное по-прежнему прокручивается:

```rust tabs
scroll().flex_1().child(
    view().flex_grow(1.0).justify_center().p_4().child(
        when(move || messages.with(|m| !m.is_empty()), move || {
            each(messages, |m| m.id, |m, _| text(move || m.with(|m| m.text.clone())))
        })
        .otherwise(|| text("No messages yet")),
    ),
)
```

```tsx tabs
<Scroll style={{ flex: 1 }} contentStyle={{ flexGrow: 1, justifyContent: "center", padding: 16 }}>
  <If when={messages().length > 0} else={<Text>No messages yet</Text>}>
    <Each of={messages()}>{(m) => <Text>{m().text}</Text>}</Each>
  </If>
</Scroll>
```

Горизонтальному прокручиваемому представлению нужны `horizontal` (`.horizontal()`) и строка в качестве дочернего элемента:

```rust tabs
scroll().horizontal().scrollbar(false).child(
    view().flex_row().gap_2().px_4().children(["Today", "This week", "This month", "This year"].map(|label| {
        text(label).px(px(14.0)).py_2().rounded(px(16.0)).overflow_hidden().bg(white())
    })),
)
```

```tsx tabs
<Scroll horizontal scrollbar={false}>
  <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: 16 }}>
    <Each of={["Today", "This week", "This month", "This year"]}>
      {(label) => <Text style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, overflow: "hidden", backgroundColor: "#ffffff" }}>{label()}</Text>}
    </Each>
  </View>
</Scroll>
```

При письме справа налево (см. [Устройство и окружение](./device-and-environment.md#right-to-left)) горизонтальное прокручиваемое представление начинается с правого края и сохраняет расстояние до него.

Прокручиваемые представления перетаскиваются пальцами. На десктопе (macOS, Windows, Linux) и в браузере мышь прокручивает так же, как в десктопных приложениях: колесом (Shift + колесо прокручивает по горизонтали), тачпадом, клавиатурой и индикатором прокрутки, который появляется при движении мыши над представлением и перетаскивается как полоса прокрутки; перетаскивание мышью достаётся жестам панорамирования приложения, респондерам и выделению текста. Сенсорные экраны на десктопах перетаскивают прокручиваемые представления так же, как пальцы. Горизонтальные представления сохраняют там индикатор даже при `scrollbar={false}`, так как именно с его помощью их двигает мышь без горизонтального колеса.

<a id="behavior-props"></a>

### Свойства поведения

| Проп | Rust | Тип | По умолчанию | Описание |
|---|---|---|---|---|
| `horizontal` | `.horizontal()` | `boolean` | `false` | Прокрутка в сторону. |
| `scrollable` | `.scrollable(..)` | `boolean` | `true` | Пользователь может прокручивать содержимое. Прокрутка из кода продолжает работать. |
| `bounces` | `.bounces(..)` | `boolean` | `true` | Прокрутка за края (overscroll). |
| `scrollbar` | `.scrollbar(..)` | `boolean` | `true` | Показывается индикатор прокрутки. На десктопе и в десктопных браузерах горизонтальное представление сохраняет его: это полоса прокрутки для мыши. |
| `contentInset` | `.content_inset(EdgeInsets { .. })` | `Partial<Edges>` | | Пространство вокруг содержимого, в которое можно прокрутить. |
| `contentOffset` | `.content_offset(point(..))` | `{ x?, y? }` | | Начальная позиция. |
| `decelerationRate` | `.deceleration(rate)` | `"normal" \| "fast" \| number` | значение платформы | Как быстро замедляется fling: `"normal"`, `"fast"` или сохраняемая за миллисекунду скорость (`0.998` — обычное замедление, `0.99` — быстрое; `0` — значение платформы по умолчанию). |

<a id="paging-and-snapping"></a>

## Постраничная прокрутка и snapping

Точка остановки выбирается нативно в момент, когда палец отрывается от экрана, по смещению в этот момент, прогнозируемому скольжению и скорости; затем представление плавно скользит к выбранной точке без участия вашего кода.

| Проп | Rust | Тип | Описание |
|---|---|---|---|
| `pagingEnabled` | `.paging(true)` | `boolean` | Остановки кратны размеру окна просмотра. |
| `snapToInterval` | `.snap_interval(px(..))` | `number` | Остановки кратны этой длине (0: выключено). |
| `snapToOffsets` | `.snap_offsets(vec![..])` | `number[]` | Остановки на этих смещениях. |
| `snapToAlignment` | `.snap_alignment(SnapAlignment::Center)` | `"start" \| "center" \| "end"` | Вместе с `snapToInterval`: какая точка элемента выравнивается по окну просмотра. |
| `disableIntervalMomentum` | `.disable_interval_momentum(true)` | `boolean` | Fling сдвигает не более чем на одну остановку. |

Пейджер: страницы шириной с прокручиваемое представление и индикатор, обновляемый по окончании скольжения.

```rust tabs
const COLORS: [u32; 4] = [0x0969da, 0x8250df, 0xbf3989, 0x1a7f37];

pub fn pager() -> impl IntoElement {
    let width = signal(0.0_f32);
    let page = signal(0_usize);
    let settle = move |e: &Point<Points>| {
        let width = width.get_untracked();
        if width > 0.0 {
            page.set((e.x.0 / width).round() as usize);
        }
    };
    let pages = COLORS.iter().enumerate().map(|(i, &color)| {
        view()
            .w(move || px(width.get()))
            .h(px(160.0))
            .bg(rgb(color))
            .items_center()
            .justify_center()
            .child(text(format!("Page {}", i + 1)).text_color(white()).text_2xl().font_weight(FontWeight::BOLD))
    });
    let dots = (0..COLORS.len()).map(|i| {
        view()
            .size_2()
            .rounded(px(4.0))
            .bg(move || if page.get() == i { rgb(0x0969da) } else { rgb(0xd0d7de) })
    });
    view()
        .gap_2()
        .p_4()
        .child(
            scroll()
                .horizontal()
                .paging(true)
                .scrollbar(false)
                .h(px(160.0))
                .rounded(px(12.0))
                .on_layout(move |frame: &Bounds<Points>| width.set(frame.size.width.0))
                .on_scroll_end(settle)
                .child(view().flex_row().children(pages)),
        )
        .child(view().flex_row().justify_center().gap(px(6.0)).children(dots))
}
```

```tsx tabs
import { mount, type Point, Scroll, signal, Text, View } from "nsh";

const colors = ["#0969da", "#8250df", "#bf3989", "#1a7f37"];

function Pager() {
  const width = signal(0);
  const page = signal(0);
  const settle = ({ offset }: { offset: Point }) => page.set(Math.round(offset.x / width()));
  return (
    <View style={{ gap: 8, padding: 16 }}>
      <Scroll
        horizontal
        pagingEnabled
        scrollbar={false}
        style={{ height: 160, borderRadius: 12 }}
        onLayout={({ bounds }) => width.set(bounds.size.width)}
        onScrollEnd={settle}
      >
        <View style={{ flexDirection: "row" }}>
          <Each of={colors}>
            {(color, i) => (
              <View style={{ width: width(), height: 160, backgroundColor: color(), alignItems: "center", justifyContent: "center" }}>
                <Text style={{ color: "#ffffff", fontSize: 24, fontWeight: "700" }}>Page {i() + 1}</Text>
              </View>
            )}
          </Each>
        </View>
      </Scroll>
      <View style={{ flexDirection: "row", justifyContent: "center", gap: 6 }}>
        <Each of={colors}>
          {(_, i) => <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: page() === i() ? "#0969da" : "#d0d7de" }} />}
        </Each>
      </View>
    </View>
  );
}

mount(Pager);
```

Карусель карточек, которые привязываются к центру, по одной карточке на fling:

```rust tabs
scroll()
    .horizontal()
    .snap_interval(px(232.0))          // card width (220) + gap (12)
    .snap_alignment(SnapAlignment::Center)
    .deceleration(0.99)
    .disable_interval_momentum(true)
    .scrollbar(false)
    .child(view().flex_row().gap_3().px_4().children(cards))
```

```tsx tabs
<Scroll
  horizontal
  snapToInterval={232}          // card width (220) + gap (12)
  snapToAlignment="center"
  decelerationRate="fast"
  disableIntervalMomentum
  scrollbar={false}
>
  <View style={{ flexDirection: "row", gap: 12, paddingHorizontal: 16 }}>…</View>
</Scroll>
```

Списки принимают те же свойства snapping, поэтому для длинной карусели они подходят лучше.

<a id="scroll-events"></a>

## События прокрутки

| Проп | Rust | Данные | Когда |
|---|---|---|---|
| `onScroll` | `.on_scroll(..)` | `ScrollEvent` | Смещение изменилось. Не чаще одного раза за кадр; `scrollEventThrottle` увеличивает промежутки между событиями. |
| `scrollEventThrottle` | `.event_throttle(ms)` | `number` | Минимальное число миллисекунд между событиями `onScroll`. |
| `onScrollDragStart` | `.on_scroll_drag_start(..)` | `{ offset }` | Пользователь начал перетаскивание. |
| `onScrollDragEnd` | `.on_scroll_drag_end(..)` | `{ offset }` | Пользователь отпустил палец. |
| `onMomentumStart` | `.on_momentum_start(..)` | `{ offset }` | Началось скольжение после fling. |
| `onMomentumEnd` | `.on_momentum_end(..)` | `{ offset }` | Скольжение закончилось (в том числе когда его перехватывает новое перетаскивание). |
| `onScrollEnd` | `.on_scroll_end(..)` | `{ offset }` | Прокрутка пользователем остановилась: после скольжения или в конце перетаскивания без него. |

`ScrollEvent` содержит смещение (`offset`, `Point`; то же в Rust), размер содержимого, с учётом масштаба (`contentSize`, `Size`; `content_size`), окно просмотра (`size`) и `zoomScale` (`zoom_scale`). Остальные события содержат смещение: `{ offset }` с `Point` в TSX, `Point<Points>` в Rust.

```rust tabs
let at_bottom = signal(false);

scroll()
    .flex_1()
    .event_throttle(100.0)
    .on_scroll(move |e: &ScrollEvent| {
        at_bottom.set(e.offset.y + e.size.height >= e.content_size.height - px(20.0))
    })
    .child(content)
```

```tsx tabs
const atBottom = signal(false);

<Scroll
  style={{ flex: 1 }}
  scrollEventThrottle={100}
  onScroll={(e) => atBottom.set(e.offset.y + e.size.height >= e.contentSize.height - 20)}
>
  …
</Scroll>
```

> [!TIP]
> `onScroll` выполняет ваш код на каждом кадре прокрутки (с учётом троттлинга). Если что-то должно лишь *выглядеть* связанным с прокруткой, например заголовок, который плавно исчезает, или параллакс-изображение, используйте вместо этого [`scrollValue`](#scroll-linked-effects-scrollvalue): он работает полностью нативно.

<a id="scroll-linked-effects-scrollvalue"></a>

## Эффекты, связанные с прокруткой: scrollValue

`scrollValue` (`.scroll_value(&value)`) принимает [анимируемое значение](./animation.md#animated-values) и нативно записывает в него смещение прокрутки (по главной оси) в том же кадре, в котором движется содержимое. Привяжите это значение или производные от него узлы, созданные с помощью `interpolate`, `diffClamp` (`diff_clamp`) или арифметики, к стилям.

```rust tabs
#[component]
pub fn App() -> impl IntoElement {
    let offset = animated_value(0.0);
    view()
        .flex_1()
        .child(
            view()
                .h(px(56.0))
                .justify_center()
                .px_4()
                // Transparent at the top, white after 80 points.
                .bind_background(&offset.interpolate_colors(&[0.0, 80.0], &[rgba(0xffffff00), rgba(0xffffffff)]))
                .child(
                    text("Inbox")
                        .text_size(px(22.0))
                        .font_weight(FontWeight::BOLD)
                        .origin_left()
                        .bind_scale(&offset.interpolate(&[0.0, 80.0], &[1.0, 0.8])),
                ),
        )
        .child(scroll().flex_1().scroll_value(&offset).child(view().p_4().gap_2()))
}
```

```tsx tabs
import { mount, Scroll, Text, View } from "nsh";
import { createAnimatedValue } from "nsh";

function App() {
  const offset = createAnimatedValue(0);
  return (
    <View style={{ flex: 1 }}>
      <View
        style={{
          height: 56,
          justifyContent: "center",
          paddingHorizontal: 16,
          // Transparent at the top, white after 80 points.
          backgroundColor: offset.interpolate({ inputRange: [0, 80], outputRange: ["rgba(255,255,255,0)", "#ffffff"] }),
        }}
      >
        <Text
          style={{
            fontSize: 22,
            fontWeight: "700",
            transformOrigin: "left center",
            scale: offset.interpolate({ inputRange: [0, 80], outputRange: [1, 0.8] }),
          }}
        >
          Inbox
        </Text>
      </View>
      <Scroll style={{ flex: 1 }} scrollValue={offset}>
        <View style={{ padding: 16, gap: 8 }}>…</View>
      </Scroll>
    </View>
  );
}

mount(App);
```

Заголовок, который уезжает при прокрутке содержимого вверх и возвращается, как только прокрутка идёт вниз, — это `diffClamp` от смещения:

```rust tabs
let offset = animated_value(0.0);
let header = offset.diff_clamp(0.0, 56.0);

view()
    .flex_1()
    .child(scroll().flex_1().scroll_value(&offset).child(view().pt(px(56.0))))
    .child(view().absolute().top_0().left_0().right_0().h(px(56.0)).bind_translate_y(&header.mul(-1.0)))
```

```tsx tabs
const offset = createAnimatedValue(0);
const header = offset.diffClamp(0, 56);

<View style={{ flex: 1 }}>
  <Scroll style={{ flex: 1 }} scrollValue={offset}>
    <View style={{ paddingTop: 56 }}>…</View>
  </Scroll>
  <View style={{ position: "absolute", top: 0, left: 0, right: 0, height: 56, translate: [0, header.mul(-1)] }}>…</View>
</View>
```

По умолчанию интерполяции ограничиваются (clamp) за пределами входного диапазона, поэтому при оттягивании выше верхнего края (отрицательное смещение) эффект остаётся в конечном состоянии; передайте `extrapolate: "extend"` (`interpolate_with(.., Interpolation::extrapolate(Extrapolate::Extend))` в Rust), чтобы получить растягивающийся заголовок, который увеличивается при оттягивании.

## Pull to refresh

`refreshing` и `onRefresh` (`.refreshing(..)` и `.on_refresh(..)`) добавляют стандартный для платформы элемент pull-to-refresh. Элемент отображается, пока `refreshing` равно true; устанавливайте его в `onRefresh` и сбрасывайте, когда работа завершена.

```rust tabs
let refreshing = signal(false);
let reload = move || {
    refreshing.set(true);
    spawn(async move {
        if let Ok(response) = fetch("https://api.example.com/items").await {
            items.set(parse_items(&response.text()));
        }
        refreshing.set(false);
    });
};

scroll().flex_1().refreshing(refreshing).on_refresh(reload).child(content)
```

```tsx tabs
const refreshing = signal(false);
const reload = async () => {
  refreshing.set(true);
  try {
    items.set(await (await fetch("https://api.example.com/items")).json());
  } finally {
    refreshing.set(false);
  }
};

<Scroll style={{ flex: 1 }} refreshing={refreshing()} onRefresh={reload}>…</Scroll>
```

На iOS этот элемент — UIRefreshControl; в Mac-режиме Mac Catalyst NSH показывает собственный индикатор с тем же поведением. Списки принимают те же свойства. На десктопе и в браузере оттягивание — это жест сенсорного экрана (или трекпада macOS, который оттягивает выше верхнего края), поскольку мышь прокручивает без перетаскивания; предложите там другой способ обновления, например кнопку или сочетание клавиш.

<a id="an-indicator-of-your-own"></a>

### Собственный индикатор

Внешний вид оттягивания выбирает приложение. `refreshIndicator={{ height }}` сообщает, что приложение рисует свой индикатор, `height` — высота в пунктах: стандартный индикатор платформы скрывается, обновление запускается, когда оттягивание достигает `height`, а во время обновления над содержимым сохраняется `height` для индикатора. `pullValue` передаёт в анимируемое значение, насколько содержимое оттянуто выше верхнего края: 0 в покое, растёт по мере оттягивания и равно `height` во время обновления. Рисуйте индикатор поверх верхней части прокручиваемого представления и интерполируйте его стили от этого значения: они следуют за пальцем в UI-потоке без JS на каждом кадре.

```rust tabs
let pull = animated_value(0.0);

view()
    .flex_1()
    .child(
        scroll()
            .flex_1()
            .refreshing(refreshing)
            .on_refresh(reload)
            .pull_value(&pull)
            .refresh_indicator(Some(px(72.0)))
            .child(content),
    )
    .child(
        view()
            .pointer_events(PointerEvents::None)
            .absolute()
            .top_0()
            .left_0()
            .right_0()
            .h(px(72.0))
            .items_center()
            .justify_center()
            .bind_opacity(&pull.interpolate(&[0.0, 36.0], &[0.0, 1.0]))
            .bind_rotate(&pull.interpolate(&[36.0, 72.0], &[0.0, 180.0]))
            .child(arrow()),
    )
```

```tsx tabs
const pull = createAnimatedValue(0);

<View style={{ flex: 1 }}>
  <Scroll
    style={{ flex: 1 }}
    refreshing={refreshing()}
    onRefresh={reload}
    pullValue={pull}
    refreshIndicator={{ height: 72 }}
  >
    …
  </Scroll>
  <View
    style={{
      pointerEvents: "none",
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 72,
      alignItems: "center",
      justifyContent: "center",
      opacity: pull.interpolate({ inputRange: [0, 36], outputRange: [0, 1] }),
      transform: [{ rotate: pull.interpolate({ inputRange: [36, 72], outputRange: ["0deg", "180deg"] }) }],
    }}
  >
    <Arrow />
  </View>
</View>;
```

Держите `height` в пределах половины окна просмотра: за верхним краем содержимое сопротивляется пальцу тем сильнее, чем дальше оно оттянуто, и слишком большая высота никогда не достигается. На iOS собственный индикатор приложения заменяет UIRefreshControl на оттягивание, которое NSH определяет сам, как в Mac-режиме.

<a id="zooming"></a>

## Масштабирование

Прокручиваемое представление (списки сохраняют масштаб 1) масштабируется, когда максимальный масштаб больше минимального: щипок масштабирует содержимое, а при увеличении оно прокручивается в обе стороны.

| Проп | Rust | Тип | По умолчанию | Описание |
|---|---|---|---|---|
| `minimumZoomScale` | `.zoom_range(min, max)` | `number` | `1` | Наименьший масштаб. |
| `maximumZoomScale` | `.zoom_range(min, max)` | `number` | `1` | Наибольший масштаб; если он больше минимального, щипок масштабирует. |
| `zoomScale` | `.zoom(scale)` | `number` | | Масштабирует до этого значения при изменении свойства; в остальных случаях масштаб пользователя сохраняется. |
| `bouncesZoom` | `.bounces_zoom(..)` | `boolean` | `true` | Щипок может выходить за пределы и возвращается пружинным эффектом. |
| `zoomable` | `.zoomable(..)` | `boolean` | `true` | Пользователь может масштабировать щипком. |
| `centerContent` | `.center_content(..)` | `boolean` | `false` | Содержимое меньше окна просмотра (при уменьшении) центрируется. |

Событие прокрутки сообщает масштаб и размер содержимого с учётом масштаба. Из кода `zoom_to(scale, center, animated)` / `zoomTo({ scale, x, y, animated })` масштабирует так, чтобы точка содержимого (в немасштабированных пунктах) оказалась в середине окна просмотра; масштабирование двойным касанием — это обработчик нажатия, который её вызывает:

```rust tabs
pub fn photo() -> impl IntoElement {
    let photo = element_ref();
    let scale = signal(1.0_f32);
    scroll()
        .flex_1()
        .bg(black())
        .zoom_range(1.0, 4.0)
        .center_content(true)
        .on_scroll(move |e: &ScrollEvent| scale.set(e.zoom_scale))
        .element_ref(&photo)
        .child(
            image("https://picsum.photos/id/1015/1200/800")
                .w(px(390.0))
                .h(px(260.0))
                .on_press(move || photo.zoom_to(if scale.get_untracked() > 1.5 { 1.0 } else { 3.0 }, None, true)),
        )
}
```

```tsx tabs
import { Image, mount, Scroll, type ScrollRef, signal } from "nsh";

function Photo() {
  let scroll!: ScrollRef;
  const scale = signal(1);
  return (
    <Scroll
      ref={scroll}
      style={{ flex: 1, backgroundColor: "#000000" }}
      minimumZoomScale={1}
      maximumZoomScale={4}
      centerContent
      onScroll={(e) => scale.set(e.zoomScale)}
    >
      <Image
        src="https://picsum.photos/id/1015/1200/800"
        style={{ width: 390, height: 260 }}
        onPress={() => scroll.zoomTo({ scale: scale() > 1.5 ? 1 : 3 })}
      />
    </Scroll>
  );
}

mount(Photo);
```

Текст и canvas внутри масштабируемого прокручиваемого представления перерисовываются в новом разрешении, когда масштабирование заканчивается, поэтому на iOS они остаются чёткими. На Android NSH масштабирует с помощью собственного представления прокрутки, которое масштабирует вокруг фокальной точки щипка, панорамирует любым числом пальцев, поддерживает fling и резиновое растяжение у краёв и пределов масштаба. Android начинает щипок, когда пальцы находятся примерно в 27 мм друг от друга, как это делает системный детектор жестов.

<a id="scrolling-from-code"></a>

## Прокрутка из кода

Передайте прокручиваемому представлению ref (`element_ref()` и `.element_ref(&scroller)` в Rust, [`ref`](./jsx-and-components.md) в TSX) и вызывайте его методы. Команды выполняются после остальных изменений в том же обновлении, поэтому прокрутка к только что добавленному содержимому работает.

| Rust | TSX | Описание |
|---|---|---|
| `scroll_to(point, animated)` | `scrollTo({ x?, y?, animated? })` | Прокручивает к смещению. В TSX по умолчанию с анимацией. |
| `zoom_to(scale, center, animated)` | `zoomTo({ scale, x?, y?, animated? })` | Масштабируемые прокручиваемые представления: масштабирует до `scale` (с ограничением пределами) вокруг точки содержимого или середины. |

```rust tabs
let scroller = element_ref();

scroll().flex_1().element_ref(&scroller).child(content)
view().on_press(move || scroller.scroll_to(point(px(0.0), px(0.0)), true))
```

```tsx tabs
let scroll!: ScrollRef;

<Scroll ref={scroll} style={{ flex: 1 }}>…</Scroll>
<View onPress={() => scroll.scrollTo({ y: 0 })}>…</View>
```

Списки добавляют `scrollToIndex`, `scrollToOffset` и `scrollToEnd`; см. [Списки](./lists.md#scrolling-from-code).

<a id="scroll-views-and-the-keyboard"></a>

## Прокручиваемые представления и клавиатура

NSH сам держит поле ввода в фокусе видимым: когда появляется клавиатура, прокручиваемое представление вокруг поля получает нижний отступ высотой с клавиатуру и прокручивает поле в область видимости. Это происходит нативно, без кода в вашем приложении. Используйте `env(keyboard-inset-height)` как нижний отступ ([Содержимое вне прокручиваемых представлений](./forms-and-keyboard.md#content-outside-scroll-views)) для содержимого вне прокручиваемых представлений, например панели сообщений, закреплённой внизу.

Два свойства определяют, как прокрутка и касания взаимодействуют с клавиатурой:

| Проп | Rust | Тип | По умолчанию | Описание |
|---|---|---|---|---|
| `keyboardDismissMode` | `.keyboard_dismiss_mode(KeyboardDismissMode::OnDrag)` | `"none" \| "on-drag" \| "interactive"` | `"none"` | Скрывает ли клавиатуру перетаскивание содержимого. `"interactive"` позволяет клавиатуре следовать за пальцем вниз на iOS; на Android ведёт себя как `"on-drag"`. |
| `keyboardShouldPersistTaps` | `.keyboard_taps(KeyboardTaps::Handled)` | `"never" \| "always" \| "handled"` | `"never"` | Что делает касание, пока клавиатура открыта. |

`keyboardShouldPersistTaps`:

- `"never"`: касание вне поля ввода в фокусе только скрывает клавиатуру, а кнопки получают следующее касание. Пользователь касается один раз, чтобы закрыть клавиатуру, и ещё раз, чтобы нажать.
- `"handled"`: касание того, что его обрабатывает (кнопки), проходит, и клавиатура остаётся; касание пустого места скрывает её. Обычно это правильный выбор для форм.
- `"always"`: клавиатура остаётся открытой при любых касаниях.

Оба поведения определяются нативно в момент касания или перетаскивания, не дожидаясь вашего кода. Чтобы скрыть клавиатуру из кода, вызовите `dismiss_keyboard()` в Rust или `Keyboard.dismiss()` из [`nsh`](../modules/nsh.md#keyboard-and-keyboardframe) в TSX.

<a id="nested-scroll-views"></a>

## Вложенные прокручиваемые представления

Горизонтальное прокручиваемое представление внутри вертикального работает как ожидается: каждое обрабатывает перетаскивания вдоль своей оси. Два прокручиваемых представления с одной осью тоже можно вкладывать (внутреннее прокручивается первым). Респондеры, которым нужен палец, например холст для рисования внутри прокручиваемого представления, не отдают его окружающим прокручиваемым представлениям: `.keep_touches(true)` в Rust, `true`, возвращаемое из `onResponderGrant` в TSX; см. [Касания и жесты](./touch-and-gestures.md#the-responder-system).

<a id="related"></a>

## См. также

- [Scroll](../elements/scroll.md): справочник по элементу, все свойства и события.
- [Списки](./lists.md): виртуализированные списки с теми же свойствами прокрутки.
- [Анимация](./animation.md): анимируемые значения, `interpolate` и `diffClamp` для эффектов, связанных с прокруткой.
- [Формы и клавиатура](./forms-and-keyboard.md): поля ввода, фокус и клавиатура.
