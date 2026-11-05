---
title: "Overlay"
description: "Элемент Overlay: содержимое, отображаемое поверх экрана независимо от обрезки родительского элемента; располагается как блок с фиксированными размерами или привязывается к якорю и следует за ним; сообщает о нажатиях снаружи и о нажатии клавиши Escape."
order: 100
group: primitives
demo: el-overlay
source_hash: 7e13ccf223d62c09
---

# Overlay

Overlay показывает своих потомков поверх всего в корневом представлении, в котором он находится: окна или диалога вокруг него.
Размер родителя, `overflow: hidden` и прокручиваемые представления его не обрезают. Во всём остальном он остаётся там, где вы его написали:
он читает окружающий контекст, его обработчики принадлежат его компоненту, и он исчезает вместе с родителем. На нём построены поповеры,
меню, подсказки и листы; [`nsh/base`](../modules/nsh-base.md) содержит их в готовом виде
([Popover](./popover.md), [Menu](./menu.md), [Tooltip](./tooltip.md), [Sheet](./sheet.md)), а Overlay нужен, чтобы
построить собственные.

```rust tabs
use nsh_core::prelude::*;

fn more_button() -> impl IntoElement {
    let open = signal(false);
    let anchor = element_ref();
    view()
        .child(
            view()
                .element_ref(&anchor)
                .on_press(move || open.update(|o| *o = !*o))
                .px_3()
                .py_2()
                .child(text("More")),
        )
        .child(when(move || open.get(), move || {
            overlay()
                .anchor(&anchor)
                .placement(Placement::Bottom)
                .align(Align::Start)
                .offset(px(6.0))
                .margin(px(8.0))
                .on_press_outside(move |_: &Point<Points>| open.set(false))
                .on_cancel(move || open.set(false))
                .rounded_lg()
                .bg(white())
                .p_3()
                .shadow_lg()
                .child(text("Shown above everything"))
        }))
}
```

```tsx tabs
import { Overlay, signal, Text, View, type ViewRef } from "nsh";

function MoreButton() {
  const open = signal(false);
  let anchor: ViewRef | undefined;
  return (
    <View>
      <View ref={anchor} onPress={() => open.set(!open())} class="px-3 py-2">
        <Text>More</Text>
      </View>
      <If when={open()}>
        <Overlay
          anchor={anchor}
          placement="bottom"
          align="start"
          offset={6}
          margin={8}
          onPressOutside={() => open.set(false)}
          onCancel={() => open.set(false)}
          class="rounded-lg bg-white p-3 shadow-lg"
        >
          <Text>Shown above everything</Text>
        </Overlay>
      </If>
    </View>
  );
}
```

`Overlay` приходит из `nsh` в TSX, а `overlay()` из `nsh_core::prelude` в Rust. Он показывается, пока находится в
представлении: поместите его в `If` (Rust: `when(..)`), чтобы открывать и закрывать. Оверлеи, показанные позже, лежат поверх более ранних, а
оверлей внутри другого лежит поверх него.

<a id="placement"></a>

## Размещение

Без `anchor` оверлей размещается как блок `position: fixed` своего корневого представления: его `top`, `left`, `inset`,
размер и отступы отсчитываются от всего окна (или диалога). `class="inset-0"` покрывает его целиком, это подложка или слой на
всё окно; `class="bottom-0 left-0 right-0"` это полоса вдоль нижнего края.

С `anchor` NSH размещает его рядом с якорем:

- `anchor` это представление (`ref`), `Point` (`{ x, y }`) в координатах корневого представления, `pageX` / `pageY` касания
  (меню там, где находится указатель) или `Bounds` (`{ origin, size }`) там же: каретка поля ввода (`pageBounds` у `onCaretMove`), у которой открываются подсказки
  к набираемому тексту.
- `placement` это сторона, с которой он располагается: `"top"`, `"bottom"` (по умолчанию), `"left"` или `"right"`. Если он не помещается
  с этой стороны, но помещается с противоположной, он располагается там; если не помещается ни с одной, он выбирает сторону, где больше места.
- `align` выравнивает его вдоль этой стороны: `"start"`, `"center"` (по умолчанию) или `"end"`. Сверху и снизу от якоря
  начало и конец следуют направлению раскладки: начало это левый край, а при раскладке справа налево правый.
- `offset` это зазор между якорем и оверлеем; `margin` это расстояние, которое он выдерживает до краёв
  безопасной области, не выходя за неё: он сдвигается вдоль своей стороны, чтобы поместиться.

Оверлей с якорем следует за ним: когда якорь прокручивается, перемещается или меняет размер, оверлей движется вместе с ним в
том же кадре, в котором NSH выполняет раскладку. `onPosition` сообщает, где он оказался, чтобы стрелка могла указывать на якорь, а длинное меню могло
ограничить свою высоту:

```tsx
<Overlay
  anchor={anchor}
  onPosition={(e) => {
    side.set(e.placement); // "top" when it flipped
    maxHeight.set(e.available.height);
  }}
/>
```

<a id="dismissing"></a>

## Закрытие

Оверлей сообщает о том, что обычно закрывает всплывающий элемент, а решение оставляет вам:

- `onPressOutside` срабатывает, когда палец или кнопка мыши нажимается вне оверлея, его якоря и вложенных в него
  оверлеев. Нажатие продолжает идти к тому, что под ним.
- `onCancel` срабатывает по Escape, кнопке «Назад» в Android и жесту выхода VoiceOver в iOS, только для верхнего оверлея, который его слушает. Он перехватывает их
  раньше страниц и `BackHandler`.

Чтобы заблокировать экран за всплывающим элементом, поместите под него второй оверлей с `class="inset-0"` и `onPress`, который закрывает
оба: именно так работают [Sheet](./sheet.md) и телефонное представление [Popover](./popover.md).

<a id="props"></a>

## Свойства

| Свойство | Rust | Тип | По умолчанию | Описание |
|---|---|---|---|---|
| `anchor` | `.anchor(&element_ref)`, `.anchor_point(point)`, `.anchor_bounds(bounds)` | `ViewRef \| Point \| Bounds \| null` | нет | Представление, точка или блок, относительно которых он размещается. Без него это фиксированный блок своего корневого представления. |
| `placement` | `.placement(..)` | `"top" \| "bottom" \| "left" \| "right"` | `"bottom"` | Сторона якоря, с которой он располагается. |
| `align` | `.align(..)` | `"start" \| "center" \| "end"` | `"center"` | Как он выравнивается по якорю вдоль этой стороны. |
| `offset` | `.offset(px(..))` | `number` | `0` | Зазор между якорем и оверлеем. |
| `margin` | `.margin(px(..))` | `number` | `0` | Расстояние, которое он выдерживает до краёв безопасной области. |
| `children` | `.child(..)` | `JSX.Element` | нет | Что он показывает. |
| `class`, `style` | методы стиля | `string`, `StyleProp<ViewStyle>` | нет | Его внешний вид и, без якоря, его положение. |

Он также принимает [общие свойства](./index.md#common-props) представления.

<a id="events"></a>

## События

| Событие | Rust | Описание |
|---|---|---|
| `onPressOutside` | `.on_press_outside(\|point\| ..)` | Нажатие произошло вне него, его якоря и вложенных в него оверлеев (`pagePosition`, `Point`). |
| `onCancel` | `.on_cancel(\|\| ..)` | Escape, кнопка «Назад» в Android или жест выхода VoiceOver, пока он является верхним слушающим оверлеем. |
| `onPosition` | `.on_position(\|position\| ..)` | NSH разместил его: `placement` (сторона, с которой он оказался), `bounds` в корневом представлении и `available` (`Size`: место с этой стороны). |

<a id="platform-notes"></a>

## Примечания по платформам

- Каждая платформа показывает оверлей как нативное представление корневого представления окна (или диалога), которое отрисовывается и
  обрабатывает попадания так же, как окружающие его представления: UIKit, Android views, AppKit, GTK, Win32, GPUI и DOM.
- Оверлей внутри [Dialog](./dialog.md) показывается в этом диалоге, над его содержимым.
- Оверлеи остаются в своём окне: меню, которое вышло бы за край окна, сдвигается обратно внутрь него.
