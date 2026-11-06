---
title: "Popover"
description: "Компонент Popover: контент, привязанный к триггеру и отображаемый поверх всего; закрывается триггером, нажатием за его пределами, клавишей Escape и кнопкой «Назад»; стилизуется приложением."
group: base
demo: el-popover
source_hash: 49f2e25232287792
---

# Popover

Popover показывает содержимое рядом со своим триггером, поверх всего остального: подробности, небольшую форму, выбор цвета.
Нажатие на триггер открывает и закрывает его; нажатие снаружи, Escape, кнопка «Назад» на Android и жест выхода VoiceOver закрывают его. Он размещается
с одной из сторон триггера, переходит на другую сторону, если места не хватает, остаётся внутри безопасной области и следует за
триггером при прокрутке. Собственного оформления у него нет: всплывающее окно и его содержимое принадлежат приложению.

```rust tabs
use nsh_base::{OpenChangeReason, PopoverEvent, popover};
use nsh_core::prelude::*;

fn details() -> impl IntoElement {
    popover()
        .offset(px(6.0))
        .margin(px(8.0))
        .trigger(view().px_3().py_2().rounded_md().bg(rgb(0xe5e7eb)).child(text("Details")))
        .on_open_change(|e: &PopoverEvent| {
            if let PopoverEvent::OpenChange(open, OpenChangeReason::PressOutside) = e {
                log::info!("closed by a press outside: {open}");
            }
        })
        .child(
            view()
                .w(px(240.0))
                .gap_1()
                .p_3()
                .rounded_lg()
                .bg(white())
                .shadow_lg()
                .child(text("Order #1024").font_weight(FontWeight::SEMIBOLD))
                .child(text("Shipped yesterday, arriving Friday.")),
        )
}
```

```tsx tabs
import { Text, View } from "nsh";
import { Popover } from "nsh/base";

function Details() {
  return (
    <Popover
      offset={6}
      margin={8}
      popupClass="w-60 gap-1 rounded-lg bg-white p-3 shadow-lg"
      trigger={
        <View class="rounded-md bg-gray-200 px-3 py-2">
          <Text>Details</Text>
        </View>
      }
    >
      <Text class="font-semibold">Order #1024</Text>
      <Text>Shipped yesterday, arriving Friday.</Text>
    </Popover>
  );
}
```

`Popover` берётся из [`nsh/base`](../modules/nsh-base.md). Его содержимое создаётся заново при каждом открытии, поэтому состояние внутри него
начинается с нуля.

<a id="open-state"></a>

## Состояние открытия

Без `open` popover хранит собственное состояние, начиная с `defaultOpen`. С `open` состоянием владеет приложение: меняйте его
в `onOpenChange({ open, reason })`, который сообщает о каждом запросе на открытие или закрытие вместе с его причиной (`"triggerPress"`,
`"pressOutside"`, `"cancel"`).

```tsx
const open = signal(false);

<Popover open={open()} onOpenChange={(e) => open.set(e.open)} trigger={<Text>Filters</Text>}>
  <FilterForm onApply={() => open.set(false)} />
</Popover>
```

`closeOnEscape={false}` оставляет popover открытым при Escape и «Назад» (`onCancel` всё равно их получает, чтобы сначала спросить);
`closeOnPressOutside={false}` оставляет его открытым при нажатиях снаружи.

<a id="phones-and-desktops"></a>

## Телефоны и десктопы

Popover привязан к своему триггеру на любом устройстве: то, что он показывает, относится к тому, что его открыло.

- На десктопах и в браузерах для десктопа нажатие снаружи закрывает его и передаётся дальше тому, что находится под указателем, поэтому
  один щелчок и закрывает popover, и нажимает кнопку, на которую пришёлся.
- На телефонах и планшетах нажатие снаружи только закрывает его: нажатие принимает прозрачная подложка, как у системных
  popover.

Для списка действий используйте [Menu](./menu.md), который на телефонах превращается в sheet; для панели используйте [Sheet](./sheet.md).

<a id="entrance-and-exit"></a>

## Появление и исчезновение

Popover появляется и исчезает вместе с вашими переходами. `popupStartingClass` задаёт вид всплывающего окна в первом кадре, а
классы `transition-*` из `popupClass` приводят его к собственному виду: так выглядит его появление. `popupEndingClass` задаёт его вид после
закрытия: popover остаётся и не принимает нажатий, пока выполняются эти переходы, затем исчезает, после чего вызывается `onClose`. Если его открыть
снова во время исчезновения, он возвращается к своему виду из текущего состояния. `popupStartingStyle` и `popupEndingStyle` делают то же самое
с помощью инлайновых стилей. Если пользователь просит уменьшить анимацию, popover появляется и исчезает мгновенно.

```tsx
<Popover
  popupClass="rounded-lg bg-white p-3 shadow-lg transition-all duration-150 ease-out"
  popupStartingClass="opacity-0 scale-95"
  popupEndingClass="opacity-0 scale-95"
  onPosition={({ placement }) => side.set(placement)}
  trigger={<Text>Details</Text>}
>
  <OrderSummary />
</Popover>
```

`onPosition({ placement, bounds, available })` сообщает, куда попало всплывающее окно: сторона триггера (другая, если
у `placement` не хватило места), его рамка и свободное место с этой стороны, чтобы стрелка или анимация появления могли указывать на триггер.

<a id="props"></a>

## Свойства

| Prop | Rust | Тип | По умолчанию | Описание |
|---|---|---|---|---|
| `open` | `.open(..)` | `boolean` | нет | Открыт, управляется приложением. |
| `defaultOpen` | `.default_open(..)` | `boolean` | `false` | Изначально открыт, без `open`. |
| `placement` | `.placement(..)` | `"top" \| "bottom" \| "left" \| "right"` | `"bottom"` | Сторона триггера, с которой он размещается. |
| `align` | `.align(..)` | `"start" \| "center" \| "end"` | `"center"` | Как он выравнивается по триггеру вдоль этой стороны. |
| `offset` | `.offset(..)` | `number` | `0` | Зазор между триггером и всплывающим окном. |
| `margin` | `.margin(..)` | `number` | `0` | Расстояние, которое он выдерживает от краёв безопасной области. |
| `closeOnEscape` | `.close_on_escape(..)` | `boolean` | `true` | Escape и кнопка «Назад» на Android закрывают его. |
| `closeOnPressOutside` | `.close_on_press_outside(..)` | `boolean` | `true` | Нажатие снаружи закрывает его. |
| `popupClass`, `popupStyle` | `.popup_class(..)`, `.popup_style(..)` | `string`, `StyleProp<ViewStyle>` | нет | Вид всплывающего окна, контейнера, в котором находится содержимое. |
| `popupStartingClass`, `popupStartingStyle` | `.popup_starting_class(..)`, `.popup_starting_style(..)` | `string`, `StyleProp<ViewStyle>` | нет | Вид всплывающего окна в первом кадре, поверх его собственного: от него запускаются его переходы. |
| `popupEndingClass`, `popupEndingStyle` | `.popup_ending_class(..)`, `.popup_ending_style(..)` | `string`, `StyleProp<ViewStyle>` | нет | Вид всплывающего окна после закрытия, поверх его собственного: оно остаётся, пока выполняются его переходы. |
| `trigger` | `.trigger(..)` | `JSX.Element` | нет | То, что его открывает; он размещается относительно него. Пока popover открыт, применяются классы `aria-expanded:` триггера и `expandedStyle`. |
| `children` | `.child(..)` | `JSX.Element` | нет | Содержимое. |

<a id="events"></a>

## События

| Событие | Rust | Описание |
|---|---|---|
| `onOpenChange` | `.on_open_change(\|e\| ..)` | Он открылся или закрылся, с указанием причины: `"triggerPress"`, `"pressOutside"` или `"cancel"`. |
| `onOpen` | `.on_open(\|\| ..)` | Он показан. |
| `onClose` | `.on_close(\|\| ..)` | Он исчез, после своего выхода; также когда его закрыло приложение. |
| `onCancel` | `.on_cancel(\|\| ..)` | Пользователь попытался его закрыть (Escape или «Назад», нажатие снаружи), независимо от того, закрылся ли он. |
| `onPosition` | `.on_position(\|e\| ..)` | Всплывающее окно размещено: `placement` (сторона, с которой оно размещено), `bounds` (его рамка), `available` (свободное место с этой стороны). |

<a id="accessibility"></a>

## Доступность

Триггер сообщает скринридерам, раскрыт ли popover. Escape и кнопка «Назад» закрывают его, как пользователи и ожидают
от всплывающего окна. В TSX триггером служит переданный вами элемент, `Button` или ваше собственное представление: он сам принимает нажатия и
состояние раскрытия, поэтому его собственные классы `active:` и `activeStyle` действуют, пока он нажат, и его собственный `onPress`
тоже срабатывает.
