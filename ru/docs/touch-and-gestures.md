---
title: "Касания и жесты"
description: "Нажатия и обратная связь при нажатии, области касания, события указателя, необработанные касания, система респондеров, PanResponder, а также нативные жесты панорамирования, масштабирования щипком и поворота."
order: 38
group: ui
demo: guide-gestures
source_hash: 00e684506892cb71
---

# Касания и жесты

В NSH есть три уровня обработки касаний. **Нажатия** (`.on_press` в Rust, `onPress` в TSX и родственные обработчики) покрывают кнопки, строки и ссылки, а отклик на нажатие рисуется нативно. **Нативные жесты** (панорамирование, щипок и поворот) двигают [анимированные значения](./animation.md#animated-values) в UI-потоке, поэтому перетаскиваемая карточка следует за пальцем, даже когда ваш код занят. **Необработанные касания и система респондеров** (`.on_touch` и `.claim_touches` с обработчиками `.on_responder_*` в Rust; `onTouchStart`, `onResponderMove` и `PanResponder` в TSX) передают вашему коду позицию каждого пальца для всего, что не могут выразить два других уровня, например для рисования.

Выбирайте самый высокий уровень, который решает задачу: чем выше уровень, тем меньше работы переходит из UI-потока в ваш код.

<a id="presses"></a>

## Нажатия

Каждый элемент принимает обработчики нажатий; отдельного «touchable»-компонента нет. Добавьте `.on_press` / `onPress` к view, тексту, изображению или чему угодно ещё.

```rust tabs
use nsh_core::prelude::*;

#[component]
fn App() -> impl IntoElement {
    let count = signal(0_u32);
    view().flex_1().items_center().justify_center().child(
        view()
            .on_press(move || count.update(|n| *n += 1))
            .on_long_press(move || count.set(0))
            .active(|s| s.opacity(0.6))
            .role(AccessibilityRole::Button)
            .px(px(20.0))
            .py(px(12.0))
            .rounded(px(10.0))
            .bg(rgb(0x0969da))
            .child(
                text(move || format!("Pressed {} times", count.get()))
                    .text_color(white())
                    .font_weight(FontWeight::SEMIBOLD),
            ),
    )
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";

function App() {
  const count = signal(0);
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <View
        onPress={() => count.update((n) => n + 1)}
        onLongPress={() => count.set(0)}
        activeStyle={{ opacity: 0.6 }}
        role="button"
        style={{ paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, backgroundColor: "#0969da" }}
      >
        <Text style={{ color: "#ffffff", fontWeight: "600" }}>Pressed {count()} times</Text>
      </View>
    </View>
  );
}

mount(App);
```

| Rust | TSX | По умолчанию | Описание |
|---|---|---|---|
| `.on_press(..)` | `onPress` | | Палец поднялся внутри view (после нажатия, не долгого). |
| `.on_long_press(..)` | `onLongPress` | | Палец оставался прижатым в течение задержки долгого нажатия. Обработчик нажатия после этого не вызывается. |
| `.on_press_down(..)` | `onPressDown` | | Нажатие началось. |
| `.on_press_up(..)` | `onPressUp` | | Нажатие закончилось: палец поднят, соскользнул или касание перехватил scroll view. |
| `.long_press_delay(ms)` | `delayLongPress` | `500` | Миллисекунды до того, как нажатие становится долгим. |
| `.disabled(..)` | `disabled` | `false` | Не принимает нажатия и не показывает отклик; применяет стиль отключённого состояния; скринридеры сообщают, что элемент отключён. |

Как ведут себя нажатия:

- **Реагирует только самое внутреннее нажимаемое view.** Нажимаемая строка с нажимаемой кнопкой внутри не получает нажатие, когда нажата кнопка.
- **Внутри scroll view нажатие ждёт около 130 мс** перед началом (и показом отклика), поэтому перетаскивание, начатое на кнопке, прокручивает содержимое, а не нажимает кнопку.
- **Соскальзывание отменяет нажатие.** Если палец выходит за пределы view, нажатие завершается обработчиком отпускания без события нажатия.
- **Отключение убирает слушатели нажатий** у смонтированного элемента, поэтому view вообще не показывает отклик и применяется стиль отключённого состояния (`.disabled_style(..)`, `class="disabled:opacity-40"`).
- **Вложенные текстовые фрагменты с обработчиком нажатия — это ссылки.** Абзац — одно нативное view; нажатие уходит фрагменту под пальцем. См. [Text](./text.md).

<a id="press-feedback"></a>

## Отклик на нажатие

Отклик на нажатие задаётся приложением: это стили, которые view принимает, пока оно нажато, находится под курсором, в фокусе или отключено. Они применяются нативно в момент смены состояния, без обращения к вашему коду. У каждого состояния есть метод в Rust, style-проп в TSX и [вариант Tailwind](./tailwind.md):

| Rust | Проп TSX | Класс | Описание |
|---|---|---|---|
| `.active(\|s\| ..)` | `activeStyle` | `active:` | Пока view нажато. |
| `.hover(\|s\| ..)` | `hoverStyle` | `hover:` | Пока над ним находится указатель (десктопы, указатели iPad, браузеры). |
| `.focus(\|s\| ..)` | `focusStyle` | `focus:` | Пока оно в фокусе. |
| `.focus_within(\|s\| ..)` | `focusWithinStyle` | `focus-within:` | Пока в фокусе оно или view внутри него: рамка поля вокруг редактируемого input. |
| `.disabled_style(\|s\| ..)` | `disabledStyle` | `disabled:` | Пока оно отключено. |
| `.ripple(Ripple { .. })` | `android={{ ripple }}` | | Material ripple на Android (`color`, `borderless`, `radius`, `foreground`) в дополнение к стилям. |

Стили состояний накладываются поверх собственных стилей view. Более поздние состояния имеют приоритет (hover, focus, active), стиль отключённого состояния имеет приоритет над всеми, а остальные не применяются, пока view отключено.

```rust tabs
use nsh_core::{Ripple, prelude::*};

view().on_press(open).active(|s| s.opacity(0.5))

view().on_press(open).active(|s| s.bg(rgb(0xddf4ff))).p(px(16.0))

view()
    .on_press(open)
    .active(|s| s.opacity(0.6))
    .ripple(Ripple {
        color: Some(rgba(0x0969da4d).into()),
        ..Ripple::default()
    })
```

```tsx tabs
<View onPress={open} activeStyle={{ opacity: 0.5 }}>…</View>

<View onPress={open} activeStyle={{ backgroundColor: "#ddf4ff" }} style={{ padding: 16 }}>…</View>

<View
  onPress={open}
  activeStyle={{ opacity: 0.6 }}
  android={{ ripple: { color: "rgba(9,105,218,0.3)" } }}
>
  …
</View>
```

Ripple без границ расходится за пределы view, что подходит для кнопок-иконок: `Ripple { borderless: true, radius: Some(px(24.0)), .. }`, `android={{ ripple: { borderless: true, radius: 24 } }}`. См. [Platform-specific code](./platform-specific.md).

С переходом (`.transition()`, класс `transition`) смена состояния анимируется. `.group()` (класс `group`) превращает view в группу, а `.group_active(..)` (`group-active:`) стилизует её дочерние элементы, пока группа нажата:

```rust tabs
view()
    .on_press(save)
    .group()
    .rounded_xl()
    .bg(rgb(0x059669))
    .p_4()
    .transition()
    .active(|s| s.scale(0.95).bg(rgb(0x065f46)))
    .child(
        text("Save")
            .font_weight(FontWeight::SEMIBOLD)
            .text_color(white())
            .group_active(|s| s.opacity(0.85)),
    )
```

```tsx tabs
<View
  onPress={save}
  class="group rounded-xl bg-emerald-600 p-4 transition active:scale-95 active:bg-emerald-800"
>
  <Text class="font-semibold text-white group-active:opacity-85">Save</Text>
</View>
```

<a id="hit-areas-hitslop"></a>

## Области нажатия: hitSlop

Hit slop (`.hit_slop(..)`, `hitSlop`) расширяет область, принимающую касания, за границы view, не меняя его layout. Используйте его для мелких целей, таких как кнопки закрытия и переключатели.

```rust tabs
view().hit_slop(EdgeInsets::all(px(12.0))).on_press(close).size(px(20.0))

view()
    .hit_slop(EdgeInsets { top: px(10.0), bottom: px(10.0), left: px(4.0), right: px(4.0) })
    .on_press(next)
```

```tsx tabs
<View hitSlop={12} onPress={close} style={{ width: 20, height: 20 }}>…</View>
<View hitSlop={{ top: 10, bottom: 10, left: 4, right: 4 }} onPress={next}>…</View>
```

| Rust | TSX | Описание |
|---|---|---|
| `.hit_slop(EdgeInsets)` | `hitSlop: number \| { top?, right?, bottom?, left? }` | Пункты, добавляемые вокруг границ. `EdgeInsets::all(..)` и число в TSX применяются ко всем четырём сторонам. |

Держите расширенную область внутри границ родителя (оставьте вокруг маленького view отступ или padding): проверка попадания достигает дочернего элемента через его родителя, поэтому касание за пределами родителя никогда не дойдёт до slop дочернего элемента.

<a id="children-outside-their-parent"></a>

## Дочерние элементы за пределами родителя

Дочерний элемент, расположенный за границами родителя (абсолютно позиционированный с видимым `overflow`, например выпадающий список под полем), принимает касания там, где нарисован, как любое другое view: NSH нативно проверяет попадание в потомков, выходящих за пределы view. Родитель, обрезающий переполнение, обрезает и их, и тогда они там ни не отображаются, ни не принимают касания. Область вычисляется из layout, поэтому дочерний элемент, вынесенный из родителя transform-ом, принимает касания только внутри границ родителя.

Учитывайте порядок отрисовки: выпадающий список рисуется поверх соседних элементов своего поля, только если поле идёт после них или имеет больший `z-index`, а касания достаются тому, что нарисовано сверху.

## pointerEvents

Ключ стиля `pointerEvents` (`.pointer_events(..)` в Rust) определяет, какие view поддерева могут быть целью касания. Он вычисляется нативно во время проверки попадания, поэтому не стоит ничего на каждое касание.

| Rust | TSX | View | Его дочерние элементы |
|---|---|---|---|
| `PointerEvents::Auto` (по умолчанию) | `"auto"` | Принимает касания | Принимают касания |
| `PointerEvents::None` | `"none"` | Никогда не цель | Никогда не цель, если только один из них не задаёт `"auto"`: касания проходят к тому, что находится позади |
| `PointerEvents::BoxNone` | `"box-none"` | Никогда не цель | Принимают касания |
| `PointerEvents::BoxOnly` | `"box-only"` | Принимает касания | Никогда не цель |

Типичные применения: оверлей, который не должен блокировать то, что под ним (none); полноэкранный контейнер, пустое место которого должно пропускать касания к содержимому позади, пока его кнопки по-прежнему работают (box-none); и строка, которая должна принимать нажатие, даже когда палец попал на дочерний элемент (box-only).

```rust tabs
view().flex_1().child(map()).child(
    // A floating toolbar: the empty area passes touches to the map.
    view()
        .pointer_events(PointerEvents::BoxNone)
        .absolute()
        .inset_0()
        .justify_end()
        .p(px(16.0))
        .child(
            view()
                .on_press(locate)
                .self_end()
                .p(px(12.0))
                .rounded(px(24.0))
                .bg(white())
                .child(text("Locate")),
        ),
)
```

```tsx tabs
<View style={{ flex: 1 }}>
  <Map />
  {/* A floating toolbar: the empty area passes touches to the map. */}
  <View style={{ pointerEvents: "box-none", position: "absolute", top: 0, left: 0, right: 0, bottom: 0, justifyContent: "flex-end", padding: 16 }}>
    <View onPress={locate} style={{ alignSelf: "flex-end", padding: 12, borderRadius: 24, backgroundColor: "#ffffff" }}>
      <Text>Locate</Text>
    </View>
  </View>
</View>
```

`"none"` наследуется как `pointer-events` в CSS: view внутри него, задающее `"auto"`, снова принимает касания. `"box-none"` и `"box-only"` действуют на view, которое их задаёт. Классы Tailwind `pointer-events-none` и `pointer-events-auto` задают `"none"` и `"auto"`, а как ключ стиля `pointerEvents` также принимает стили состояний (`activeStyle`, ...) и варианты.

<a id="native-gestures-pan-pinch-and-rotation"></a>

## Нативные жесты: панорамирование, щипок и поворот

Для перетаскиваний, щипков и поворотов, которые что-то двигают на экране, привяжите к жесту [анимированные значения](./animation.md#animated-values). Распознаватель жестов платформы записывает значения в UI-потоке, а привязанные к ним view двигаются в том же кадре; ваш код получает уведомления о начале и конце жеста.

```rust tabs
use nsh_core::prelude::*;

#[component]
fn App() -> impl IntoElement {
    let x = animated_value(0.0);
    let y = animated_value(0.0);
    view().flex_1().items_center().justify_center().child(
        view()
            .pan_values(Some(&x), Some(&y))
            .on_pan_end(move |e: &PanEvent| {
                // Spring back, starting at the speed the finger let go with.
                let spring = |velocity| Spring { velocity: Some(velocity), ..Spring::default() };
                x.spring(0.0, spring(e.velocity_x));
                y.spring(0.0, spring(e.velocity_y));
            })
            .size(px(120.0))
            .rounded(px(24.0))
            .bg(rgb(0x8250df))
            .bind_translate_x(&x)
            .bind_translate_y(&y),
    )
}
```

```tsx tabs
import { mount, View } from "nsh";
import { createAnimatedValue } from "nsh";

function App() {
  const x = createAnimatedValue(0);
  const y = createAnimatedValue(0);
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <View
        pan={{ x, y }}
        onPanEnd={(e) => {
          // Spring back, starting at the speed the finger let go with.
          x.spring(0, { velocity: e.velocity.x });
          y.spring(0, { velocity: e.velocity.y });
        }}
        style={{ width: 120, height: 120, borderRadius: 24, backgroundColor: "#8250df", translate: [x, y] }}
      />
    </View>
  );
}

mount(App);
```

| Rust | TSX | Описание |
|---|---|---|
| `.pan_values(Some(&x), Some(&y))` | `pan={{ x?, y? }}` | Перетаскивание одним пальцем двигает эти значения, в пунктах. |
| `.pinch_value(&scale)` | `pinch={{ scale? }}` | Щипок двумя пальцами управляет `scale` (коэффициент). |
| `.rotation_value(&angle)` | `rotation={{ angle? }}` | Поворот двумя пальцами управляет `angle`, в градусах. |
| `.on_pan_start` / `.on_pan_end` | `onPanStart` / `onPanEnd` | Перетаскивание началось / закончилось, с `PanEvent`. |
| `.on_pinch_start` / `.on_pinch_end` | `onPinchStart` / `onPinchEnd` | Щипок начался / закончился: его масштаб и скорость (`GestureEvent`). |
| `.on_rotation_start` / `.on_rotation_end` | `onRotationStart` / `onRotationEnd` | Поворот начался / закончился: его угол (Rust: `GestureEvent<Radians>`) и скорость. |

Событие панорамирования содержит смещение (`translation`, `Point`: пункты с начала жеста), скорость (`velocity_x` / `velocity_y`; TSX: `velocity`, `Point`: пункты в **секунду**) и привязанные значения в этот момент (`value_x` / `value_y`; TSX: `value`, `{ x?, y? }` с осями, которые привязывает `pan`).

Что нативная сторона делает за вас:

- **Перетаскивание продолжается оттуда, где находится значение.** В начале значения считываются, и к ним прибавляется смещение; если схватить значение, которое всё ещё анимируется (пружина, возвращающаяся на место), анимация останавливается там, где оно есть.
- **Одна ось позволяет прокручивать другую.** Если привязано только горизонтальное значение, перетаскивание начинается, только когда палец движется больше по горизонтали, чем по вертикали, так что горизонтальная строка со свайпом внутри вертикального scroll view по-прежнему прокручивается вертикально. Это решение принимается нативно, когда система спрашивает, может ли жест начаться.
- **Панорамирование, щипок и поворот работают вместе** на одном view: одну карточку можно одновременно перетаскивать, масштабировать и вращать.
- **Скорость отпускания для физики.** Скорость в конце панорамирования напрямую подаётся в скорость пружины или затухания; значения позволяют выбрать точку привязки.

```rust tabs
// A card that snaps to the left or right edge.
view()
    .pan_values(Some(&x), None)
    .on_pan_end(move |e: &PanEvent| {
        let projected = e.value_x.unwrap_or(0.0) + e.velocity_x * 0.2;
        let to = if projected > 0.0 { 140.0 } else { -140.0 };
        x.spring(to, Spring { velocity: Some(e.velocity_x), ..Spring::default() });
    })
    .bind_translate_x(&x)
```

```tsx tabs
// A card that snaps to the left or right edge.
<View
  pan={{ x }}
  onPanEnd={(e) => {
    const projected = (e.value?.x ?? 0) + e.velocity.x * 0.2;
    x.spring(projected > 0 ? 140 : -140, { velocity: e.velocity.x });
  }}
  style={{ translate: [x, 0] }}
/>
```

> [!TIP]
> Привязывайте анимированные значения к жесту, а не следуйте за ним через респондер, когда перетаскивание только двигает объекты. С привязанными значениями занятый код приложения не может вызвать подтормаживание перетаскивания; с респондером каждое движение — это событие для вашего кода и обновление того, что показывает view.

<a id="raw-touches"></a>

## Необработанные касания

Обработчики касаний сообщают о каждом пальце, когда он опускается, двигается и поднимается. Они полезны для логирования, собственной проверки попадания и реакции на мультитач; они не захватывают касание (нажатия и scroll view продолжают работать).

В Rust `.on_touch(..)` получает каждую фазу как `TouchEvent`: его `phase` (`TouchPhase::Start`, `Move`, `End`, `Cancel`), его `timestamp` и его `points` — каждый опущенный палец, у каждого свой `id`, его `location` во view, на которое он опустился, его `page` позиция на поверхности и `changed` для пальцев, о которых это событие. В TSX у каждой фазы свой обработчик:

| TSX | Описание |
|---|---|
| `onTouchStart` | Палец опустился на view или внутри него. |
| `onTouchMove` | Палец сдвинулся. Движения объединяются за один оборот движка. |
| `onTouchEnd` | Палец поднялся. |
| `onTouchCancel` | Система забрала касание (scroll view начал прокрутку, пришёл звонок). |
| `onTouchStartCapture`, `onTouchMoveCapture`, `onTouchEndCapture`, `onTouchCancelCapture` | То же самое, но вызываются снаружи внутрь, до обработчиков всплытия. |

Каждый обработчик в TSX получает `GestureResponderEvent`:

| Поле | Описание |
|---|---|
| `identifier` | Идентифицирует палец, пока он опущен. |
| `locationX`, `locationY` | Позиция во view, на которое опустился палец (`target`). |
| `pageX`, `pageY` | Позиция на поверхности. |
| `target` | Идентификатор view, на которое опустился палец. |
| `timestamp` | Миллисекунды. |
| `touches` | Все опущенные пальцы. |
| `changedTouches` | Пальцы, о которых это событие. |
| `nativeEvent` | Само событие, так что `e.nativeEvent.locationX` тоже работает. |
| `stopPropagation()` | Более внешние view не видят это событие касания. |

```rust tabs
use nsh_core::{TouchPhase, element::{TouchEvent}, prelude::*};

view().on_touch(|e: &TouchEvent| {
    let Some(p) = e.points.iter().find(|p| p.changed) else { return };
    match e.phase {
        TouchPhase::Start => log::info!("down {:?} {}", p.location, e.points.len()),
        TouchPhase::Move => log::info!("move {:?}", p.page),
        TouchPhase::End | TouchPhase::Cancel => log::info!("up"),
    }
})
```

```tsx tabs
<View
  onTouchStart={(e) => console.log("down", e.locationX, e.locationY, e.touches.length)}
  onTouchMove={(e) => console.log("move", e.pageX, e.pageY)}
  onTouchEnd={() => console.log("up")}
/>
```

<a id="where-a-view-is-measure"></a>

### Где находится view: measure

Положение касания отсчитывается от view, на которое опустился палец, а оно может быть дочерним элементом нужного вам view (ползунок слайдера). Измерение view сообщает, где оно находится, так что вы можете использовать позицию на странице. В Rust добавьте `element_ref()` к view и дождитесь его `measure()`; в TSX вызовите `measure()` у его ref:

```rust tabs
let track = element_ref();
let origin = stored(px(0.0));
view()
    .element_ref(&track)
    .claim_touches(TouchClaim::on_start())
    .on_responder_grant(move |e: &ResponderEvent| {
        let x = e.page.x;
        spawn(async move {
            let page = track.measure().await.map_or(px(0.0), |m| m.page.x);
            origin.replace(page);
            seek(x - page);
        });
    })
    .on_responder_move(move |e: &ResponderEvent| seek(e.page.x - origin.get()))
```

```tsx tabs
let track!: ViewRef;
let origin = 0;
<View
  ref={track}
  onStartShouldSetResponder={() => true}
  onResponderGrant={async (e) => {
    const x = e.pageX;
    origin = (await track.measure())?.pagePosition.x ?? 0;
    seek(x - origin);
  }}
  onResponderMove={(e) => seek(e.pageX - origin)}
/>;
```

Результат приходит, когда сделанные к этому моменту изменения размещены в layout: в Rust это `Measurement` (`frame`, рамка в родителе, как её сообщает обработчик layout, и `page`, левый верхний угол), в TSX — `{ bounds, pagePosition }`. Угол задан на поверхности или в диалоге, в котором находится view, в тех же координатах, что и позиции касаний на странице. Смещения окружающих scroll view и списков учитываются; transform-ы (включая анимации) не учитываются. Для view, которого нет на экране, результат — `None` / `null`.
<a id="the-responder-system"></a>

## Система responder

Когда ваш код должен владеть последовательностью касаний (рисование пальцем, собственный слайдер, жест, которого нет среди нативных распознавателей), используйте систему gesture responder. В каждый момент времени только один view является **responder** и получает движения; views договариваются между собой, кто им станет.

Как стать responder:

| Rust | TSX | Описание |
|---|---|---|
| `.claim_touches(TouchClaim::on_start())` | `onStartShouldSetResponder`, возвращающий `true` | Запрашивается, когда палец касается экрана, от целевого view наружу. |
| `.claim_touches(TouchClaim::on_move())` | `onMoveShouldSetResponder`, возвращающий `true` | Запрашивается при каждом движении, пока responder нет (или чтобы перехватить его). |
| `TouchClaim::on_start().capture()` | `onStartShouldSetResponderCapture` | То же, что выше, но запрашивается снаружи внутрь, раньше всплывающих (bubbling) версий. Родитель использует его, чтобы забрать касание у дочерних view. |
| `TouchClaim::on_move().capture()` | `onMoveShouldSetResponderCapture` | Версия для движения. |

Заявка (claim) решается только по самому view, без запуска вашего кода, если только она сама не спрашивает: `TouchClaim::on_move().ask(|r: &ClaimRequest| ..)` заявляет права, когда слушатель вызывает `r.claim()`, принимая решение по жесту, выполненному к этому моменту (`r.event.gesture`). Обработчики TSX получают жест вторым аргументом, `gestureState`, с теми же полями, что и у [PanResponder](#panresponder) (`dx`, `dy`, `vx`, `vy`, `moveX`, `moveY`, `x0`, `y0`, `numberActiveTouches`). Свайп, который заявляет права только на горизонтальные движения: `onMoveShouldSetResponder={(e, g) => Math.abs(g.dx) > 10 && Math.abs(g.dx) > Math.abs(g.dy)}`. Такое решение всё равно приходит с опозданием на одно движение, поэтому окружающий scroll view может начать прокрутку раньше; для перетаскиваний внутри scroll views используйте [pan activation](#pans-inside-scroll-views-panactivation).

Пока view является responder:

| Rust | TSX | Описание |
|---|---|---|
| `.on_responder_grant(..)` | `onResponderGrant` | Этот view теперь responder. В Rust по умолчанию нативные scroll views не получают касания (`TouchClaim::block_native(false)` разрешает им это); в TSX для этого верните `true`. |
| `.on_responder_reject(..)` | `onResponderReject` | Другой view является responder и не захотел уступать. |
| `.on_responder_start(..)` | `onResponderStart` | Коснулся ещё один палец. |
| `.on_responder_move(..)` | `onResponderMove` | Палец сдвинулся. |
| `.on_responder_end(..)` | `onResponderEnd` | Палец поднялся. |
| `.on_responder_release(..)` | `onResponderRelease` | Поднялся последний палец: жест завершён. |
| `.keep_touches(true)` | `onResponderTerminationRequest`, возвращающий `false` | Другой view хочет получить касания: сохраните их (по умолчанию они передаются). |
| `.on_responder_terminate(..)` | `onResponderTerminate` | Другой view или нативный жест забрал касания. |

Responder компонента на Rust остаётся нажатым от момента получения (grant) до окончания его касаний, куда бы ни ушёл палец или указатель, так же как `:active` в CSS удерживается, пока кнопка не будет отпущена: его стили `.active(..)` и классы `group-active:` внутри него сохраняют свой вид на протяжении всего перетаскивания (например, ручка изменения размера, которую утащили за пределы её полосы).

Обработчики Rust получают `ResponderEvent`: `location` пальца в том view, на котором он коснулся экрана, его позицию `page`, а также `timestamp` и `gesture` с момента grant.

```rust tabs
use nsh_core::prelude::*;

fn sketch() -> impl IntoElement {
    let strokes = signal(Vec::<Vec<Point<Points>>>::new());
    canvas(move || {
        strokes.with(|all| {
            all.iter().fold(Painter::new().line_width(3.0), |p, s| {
                let mut p = p.begin_path();
                for (i, pt) in s.iter().enumerate() {
                    p = if i == 0 { p.move_to(pt.x, pt.y) } else { p.line_to(pt.x, pt.y) };
                }
                p.stroke()
            })
        })
    })
    .flex_1()
    // The responder: the scroll view around does not take the touches.
    .claim_touches(TouchClaim::on_start())
    .keep_touches(true)
    .on_responder_grant(move |e: &ResponderEvent| strokes.update(|all| all.push(vec![e.location])))
    .on_responder_move(move |e: &ResponderEvent| {
        strokes.update(|all| {
            if let Some(last) = all.last_mut() {
                last.push(e.location);
            }
        })
    })
}
```

```tsx tabs
import { Canvas, type GestureResponderEvent, mount, signal } from "nsh";

function Sketch() {
  const strokes = signal<[number, number][][]>([]);
  const point = (e: GestureResponderEvent): [number, number] => [e.locationX, e.locationY];
  return (
    <Canvas
      style={{ flex: 1 }}
      onStartShouldSetResponder={() => true}
      onResponderGrant={(e) => {
        strokes.set([...strokes(), [point(e)]]);
        return true; // the scroll view around must not take the touches
      }}
      onResponderTerminationRequest={() => false}
      onResponderMove={(e) => {
        const all = strokes();
        strokes.set([...all.slice(0, -1), [...all[all.length - 1], point(e)]]);
      }}
      draw={(cx) => {
        cx.lineWidth = 3;
        for (const s of strokes()) {
          cx.beginPath();
          s.forEach(([x, y], i) => (i === 0 ? cx.moveTo(x, y) : cx.lineTo(x, y)));
          cx.stroke();
        }
      }}
    />
  );
}

mount(Sketch);
```

Как это работает: view с любым обработчиком касаний или responder слушает касания нативно; платформа сообщает о касаниях на нём (и внутри него) вместе с путём слушающих views, а согласование выполняется в Rust-ядре NSH, которое опрашивает заявки и вызывает ваши обработчики по порядку: сначала capture-обработчики от внешнего view внутрь, затем остальные от целевого view наружу. Отсюда два следствия:

- **Нативные scroll views и responders конкурируют.** Пока responder блокирует их, окружающие scroll views не получают касания до его завершения. Если нативный scroll view начнёт перетаскивание первым, он побеждает: responder получает обработчик terminate, а обработчики касаний получают отмену.
- **Каждое движение является событием для вашего кода.** Перетаскивания под управлением responder работают плавно настолько, насколько быстр ваш код; для перетаскиваний, которые только перемещают views, предпочитайте [привязанные значения](#native-gestures-pan-pinch-and-rotation).

## PanResponder

В Rust события responder уже несут информацию о жесте: `ResponderEvent::gesture` — это `PanGesture` с расстоянием от начала, скоростью и числом пальцев. В TSX `PanResponder` из `nsh` оборачивает систему responder и добавляет то же состояние жеста; передайте его `panHandlers` во view через spread.

```rust tabs
use nsh_core::prelude::*;

fn ball() -> impl IntoElement {
    let pos = signal((0.0_f32, 0.0_f32));
    let start = stored((0.0_f32, 0.0_f32));
    view()
        .size(px(60.0))
        .rounded(px(30.0))
        .bg(rgb(0x0969da))
        .style_with(move |s| {
            let (x, y) = pos.get();
            s.translate_x(px(x)).translate_y(px(y))
        })
        .claim_touches(TouchClaim::on_start())
        .on_responder_grant(move |_: &ResponderEvent| {
            start.replace(pos.get_untracked());
        })
        .on_responder_move(move |e: &ResponderEvent| {
            let (x, y) = start.get();
            let d = e.gesture.delta;
            pos.set((x + d.x.0, y + d.y.0));
        })
        .on_responder_release(move |e: &ResponderEvent| {
            log::info!("released at {} {} pt/s", e.gesture.vx, e.gesture.vy)
        })
}
```

```tsx tabs
import { mount, signal, View } from "nsh";
import { PanResponder } from "nsh";

function Ball() {
  const pos = signal({ x: 0, y: 0 });
  let start = { x: 0, y: 0 };
  const responder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      start = pos();
    },
    onPanResponderMove: (_, g) => pos.set({ x: start.x + g.dx, y: start.y + g.dy }),
    onPanResponderRelease: (_, g) => console.log("released at", g.vx, g.vy, "pt/s"),
  });
  return (
    <View
      {...responder.panHandlers}
      style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: "#0969da", translate: [pos().x, pos().y] }}
    />
  );
}

mount(Ball);
```

Состояние жеста:

| Rust (`PanGesture`) | TSX (`gestureState`) | Описание |
|---|---|---|
| | `stateID` | Идентифицирует жест. |
| `position` | `moveX`, `moveY` | Последняя позиция центроида касаний, в точках поверхности. |
| `origin` | `x0`, `y0` | Где находился центроид, когда был выдан responder. |
| `delta` | `dx`, `dy` | Расстояние, пройденное с момента grant. |
| `vx`, `vy` | `vx`, `vy` | Скорость, в точках в секунду. |
| `active_touches` | `numberActiveTouches` | Количество пальцев на экране. |

`PanGesture::begin` и `PanGesture::update` отслеживают жест по необработанным касаниям (`.on_touch`) в Rust. Колбэки TSX получают `(event, gestureState)`: `onStartShouldSetPanResponder(Capture)`, `onMoveShouldSetPanResponder(Capture)`, `onPanResponderGrant`, `onPanResponderReject`, `onPanResponderStart`, `onPanResponderMove`, `onPanResponderEnd`, `onPanResponderRelease`, `onPanResponderTerminate`, `onPanResponderTerminationRequest` и `onShouldBlockNativeResponder`. Последний по умолчанию равен `true`: PanResponder, получивший grant, не позволяет нативным scroll views забирать его касания.

<a id="pans-inside-scroll-views-panactivation"></a>

## Pan внутри scroll views: panActivation

График, который прокручивают пальцем вбок внутри вертикального scroll view, должен принимать горизонтальные перетаскивания и оставлять вертикальные scroll view. Если заявлять права на касание сразу при его начале, прокрутка блокируется с первого пикселя, а если решать по движениям в вашем коде, будет слишком поздно: к моменту ответа scroll view может уже забрать касание. Pan activation (`TouchClaim::on_pan(..)`, `panActivation`) позволяет платформе принимать решение в главном потоке по мере движения пальца:

```rust tabs
view()
    .claim_touches(TouchClaim::on_pan(PanActivation::horizontal(px(10.0), px(10.0))))
    .on_responder_grant(|e: &ResponderEvent| scrub(Some(e.location.x)))
    .on_responder_move(|e: &ResponderEvent| scrub(Some(e.location.x)))
    .on_responder_release(|_: &ResponderEvent| scrub(None))
    .child(chart())
```

```tsx tabs
<View
  panActivation={{ activeOffsetX: 10, failOffsetY: 10 }}
  onResponderGrant={(e) => scrub(e.locationX)}
  onResponderMove={(e) => scrub(e.locationX)}
  onResponderRelease={() => scrub(null)}
>
  <Chart />
</View>
```

| Rust (`PanActivation`) | TSX | Описание |
|---|---|---|
| `active_offset_x`, `active_offset_y` | `activeOffsetX`, `activeOffsetY` | Pan активируется, как только палец сместился дальше этого значения от точки касания вдоль данной оси (в любую сторону, в точках). |
| `fail_offset_x`, `fail_offset_y` | `failOffsetX`, `failOffsetY` | Pan отменяется, как только палец сместился дальше этого значения раньше: scroll views сохраняют касания. |

`PanActivation::horizontal(active, fail)` и `PanActivation::vertical(active, fail)` задают обычные пары значений. Без active offsets pan активируется после 10 точек в любом направлении. Пока он не активирован, окружающие scroll views ждут его (iOS), а другие заявки этого view не запрашиваются. При активации scroll views больше не могут забрать эти касания, а view становится responder (сначала grant, затем движения); при отмене scroll view прокручивается как обычно. В TSX `panHandlers` у `PanResponder` тоже работают вместе с ним: передайте их рядом с prop, а `onPanResponderGrant` вызывается при активации.

> [!NOTE]
> Все скорости измеряются в точках в секунду: `vx` / `vy` жеста responder, скорость pan, а также скорость spring или decay, поэтому `vx` передаётся в spring или decay как есть.

<a id="why-some-answers-are-props"></a>

## Почему некоторые ответы задаются через props

Главный поток никогда не ждёт ваш код. Когда системе нужен ответ немедленно (может ли начаться этот pan-жест, попадает ли точка во view, должно ли это касание скрыть клавиатуру), NSH отвечает нативно, опираясь на то, что было смонтировано заранее: привязанные pan-значения (их оси), значение pinch, hit slop, pointer events, настройку keyboard taps у scroll views, pan activation. Ваши обработчики узнают о случившемся уже потом. Поэтому это декларативные настройки, а не колбэки, и поэтому согласование responder, которое всё же выполняет ваш код, лишь выбирает между responders и никогда не блокирует нативный жест.

<a id="related"></a>

## См. также

- [`View`](../elements/view.md): все touch-props базового элемента.
- [Animation](./animation.md): анимированные значения, spring и decay для движения, управляемого жестами.
- [Scrolling](./scrolling.md): настройка keyboard taps, scroll views и вложенные жесты.
- [`PanResponder`](../modules/nsh.md#panresponder): справочник по `PanResponder`.
- [Accessibility](./accessibility.md): pressable views являются элементами accessibility; задайте им роль и подпись.
