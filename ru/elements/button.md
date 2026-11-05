---
title: "Button"
description: "Компонент Button: цель нажатия, которая отвечает за обработку нажатий, отключённое и выбранное состояния и свою роль для программ чтения с экрана; внешний вид задаётся приложением."
group: base
demo: el-button
source_hash: ae28f575931a4fe9
---

# Button

Button — это цель для нажатия. Он отвечает за поведение: нажатия, отклик на нажатие через стили состояний приложения, состояния disabled и selected, фокус клавиатуры и свою роль для скринридеров. Внешний вид определяет приложение: у `Button` нет собственных цветов, размеров, отступов или подписи, поэтому один и тот же компонент может стать основной кнопкой, кнопкой-иконкой, вкладкой, переключателем панели инструментов или строкой списка, в зависимости от переданных стилей и дочерних элементов.

```rust tabs
use nsh_base::button;
use nsh_core::prelude::*;

fn counter() -> impl IntoElement {
    let count = signal(0_u32);
    button()
        .on_press(move || count.update(|n| *n += 1))
        .self_center()
        .px_5()
        .py_3()
        .rounded_xl()
        .bg(rgb(0x2563eb))
        .active(|s| s.bg(rgb(0x1d4ed8)))
        .child(
            text(move || format!("Pressed {}", count.get()))
                .text_color(white())
                .font_weight(FontWeight::SEMIBOLD),
        )
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { Button } from "nsh/base";

function App() {
  const count = signal(0);
  return (
    <Button
      onPress={() => count.update((n) => n + 1)}
      class="self-center rounded-xl bg-blue-600 px-5 py-3 active:bg-blue-700"
    >
      <Text class="text-base font-semibold text-white">{`Pressed ${count()}`}</Text>
    </Button>
  );
}

mount(App);
```

`Button` поставляется из [`nsh/base`](../modules/nsh-base.md), крейта `nsh-base` для Rust. В TSX его внешний вид задают `class` и
`style` с вариантами состояний `active:`, `hover:`, `focus:`, `selected:` и `disabled:` (или соответствующими
`activeStyle`, `hoverStyle`, `focusStyle`, `selectedStyle` и `disabledStyle`). В Rust `button()` создаёт кнопку так же, как
`view()` создаёт view: по сеттеру на каждый проп (`.disabled(..)`, `.selected(..)`), по слушателю на каждое событие (`.on_press(..)`),
типизированные методы стиля (`.px_4()`, `.bg(..)`) для внешнего вида, методы состояний (`.active(..)`, `.hover(..)`,
`.focus(..)`, `.selected_style(..)`, `.disabled_style(..)`) для состояний и `.child(..)` для содержимого.

## Props

| Проп | Rust | Тип | По умолчанию | Описание |
|---|---|---|---|---|
| `disabled` | `.disabled(..)` | `boolean` | `false` | Нет нажатий и нет отклика на нажатие; применяются стили `disabled:`, а скринридеры сообщают, что элемент неактивен. |
| `selected` | `.selected(..)` | `boolean` | `false` | Выбрано: включённый переключатель, текущая вкладка. Скринридеры сообщают об этом. Значением владеет приложение, оно же задаёт стиль. |
| `selectedStyle` | `.selected_style(\|s\| ..)` | `StyleProp<ViewStyle>` | нет | Стиль, пока `selected` и элемент не disabled, в виде классов `selected:`. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | нет | Что говорят скринридеры, когда содержимого недостаточно, например для иконки. |
| `role` | `.role(..)` | `AccessibilityRole` | `"button"` | Чем элемент является для скринридеров, когда ни один компонент `nsh/base` не соответствует этому контролу: `"link"` (открывает URL), ... |
| `hitSlop` | `.hit_slop(..)` | `number \| Partial<Edges>` | нет | На каком расстоянии за границами элемента нажатия всё ещё засчитываются, в пунктах: одно число для всех сторон или указанные стороны по отдельности. Как `hitSlop` у view. |
| `children` | `.child(..)` | `JSX.Element` | нет | Содержимое: текст, иконка, любой layout. |
| `class`, `style` | методы стиля | `string`, `StyleProp<ViewStyle>` | нет | Внешний вид целиком. |
| `activeStyle`, `hoverStyle`, `focusStyle`, `disabledStyle` | `.active(\|s\| ..)`, `.hover(..)`, `.focus(..)`, `.disabled_style(..)` | `StyleProp<ViewStyle>` | нет | Стиль в состояниях pressed, hovered, focused или disabled, в виде классов `<state>:`. Более поздние состояния имеют приоритет; `disabled` перекрывает все остальные. |

В Rust каждый проп — это сеттер, принимающий значение, сигнал или замыкание; пропы, которые вы не указали, сохраняют значения по умолчанию:

```rust
button()
    .disabled(move || saving.get())
    .accessibility_label("Save")
```

<a id="events"></a>

## События

| Событие | Rust | Описание |
|---|---|---|
| `onPress` | `.on_press(\|\| ..)` | Кнопку нажали: касание, клик, Return или Space при фокусе клавиатуры на кнопке, либо активация скринридером. |
| `onPressDown` | `.on_press_down(\|\| ..)` | Нажатие началось на кнопке. |
| `onPressUp` | `.on_press_up(\|\| ..)` | Нажатие закончилось: отпущено, уведено в сторону или отменено. |

`onPressDown` и `onPressUp` нужны для собственного отклика на нажатие, например пружинной анимации или подсветки, которые стили состояний выразить не могут. Кнопка в состоянии disabled не сообщает ни об одном из этих событий.

<a id="styling"></a>

## Стилизация

Внешний вид кнопки определяет ваше приложение: именно оно решает, что такое основная или второстепенная кнопка. Пара небольших компонентов позволяет хранить это решение в одном месте:

```rust tabs
use nsh_base::button;
use nsh_core::prelude::*;

/// A filled button, darker while pressed.
fn primary(label: &'static str, on_press: impl Fn() + 'static) -> impl IntoElement {
    button()
        .on_press(on_press)
        .items_center()
        .rounded_lg()
        .px_4()
        .py_3()
        .bg(rgb(0x2563eb))
        .active(|s| s.bg(rgb(0x1d4ed8)))
        .disabled_style(|s| s.opacity(0.4))
        .child(text(label).text_color(white()).font_weight(FontWeight::SEMIBOLD))
}

/// An outlined button.
fn secondary(label: &'static str, on_press: impl Fn() + 'static) -> impl IntoElement {
    button()
        .on_press(on_press)
        .items_center()
        .rounded_lg()
        .px_4()
        .py_3()
        .border_1()
        .border_color(rgb(0xd4d4d4))
        .hover(|s| s.bg(rgb(0xfafafa)))
        .active(|s| s.bg(rgb(0xf5f5f5)))
        .child(text(label).text_color(rgb(0x171717)))
}
```

```tsx tabs
import { Text } from "nsh";
import { Button } from "nsh/base";

function Primary(props: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Button
      onPress={props.onPress}
      disabled={props.disabled}
      class="items-center rounded-lg bg-blue-600 px-4 py-3 active:bg-blue-700 disabled:opacity-40"
    >
      <Text class="font-semibold text-white">{props.label}</Text>
    </Button>
  );
}

function Secondary(props: { label: string; onPress: () => void }) {
  return (
    <Button
      onPress={props.onPress}
      class="items-center rounded-lg border border-neutral-300 px-4 py-3 active:bg-neutral-100 hover:bg-neutral-50"
    >
      <Text class="text-neutral-900">{props.label}</Text>
    </Button>
  );
}
```

Варианты состояний применяются нативно: нажатие затемняет кнопку в основном потоке, без выполнения JS или Rust.
В Rust методы состояний соответствуют тем же вариантам: `.active(..)`, `.hover(..)`, `.focus(..)`, `.selected_style(..)` и
`.disabled_style(..)` следуют собственным состояниям кнопки. Цвета вашей темы работают так же: `bg-primary` в TSX,
`theme().primary` в Rust (см. [Theme tokens](../docs/tailwind.md#theme-tokens)).

## Disabled

Кнопка в состоянии disabled не принимает нажатия и не даёт отклика, а скринридеры объявляют её как неактивную. Её внешний вид в этом состоянии определяете вы, с помощью классов `disabled:` или `disabledStyle`:

```rust tabs
fn save(saving: Signal<bool>) -> impl IntoElement {
    button()
        .disabled(saving)
        .on_press(move || saving.set(true))
        .rounded_lg()
        .px_4()
        .py_3()
        .bg(rgb(0x2563eb))
        .disabled_style(|s| s.opacity(0.4))
        .child(text("Save").text_color(white()))
}
```

```tsx tabs
<Button disabled={saving()} onPress={save} class="rounded-lg bg-blue-600 px-4 py-3 disabled:opacity-40">
  <Text class="text-white">Save</Text>
</Button>
```

<a id="a-toggle-with-selected"></a>

## Переключатель с selected

`selected` превращает кнопку в переключатель: кнопка «жирный» на панели инструментов, фильтр-чип, текущая вкладка. Значение хранит приложение, оно же меняет его в `onPress` и стилизует состояние selected; скринридеры объявляют кнопку как выбранную.

```rust tabs
fn bold(on: Signal<bool>) -> impl IntoElement {
    button()
        .selected(on)
        .accessibility_label("Bold")
        .on_press(move || on.update(|on| *on = !*on))
        .size(px(40.0))
        .items_center()
        .justify_center()
        .rounded_md()
        .selected_style(|s| s.bg(rgb(0xdbeafe)))
        .child(text("B").font_weight(FontWeight::BOLD))
}
```

```tsx tabs
<Button
  selected={bold()}
  onPress={() => bold.set(!bold())}
  accessibilityLabel="Bold"
  class="size-10 items-center justify-center rounded-md selected:bg-blue-100"
>
  <Text class="font-bold">B</Text>
</Button>
```

Ряд вкладок — это [`Tabs`](./tabs.md), а контрол вкл / выкл — это [`Switch`](./switch.md), из `nsh/base`: они отвечают за роль, состояние selected и поведение клавиатуры своего типа, чего `Button` с `role="tab"` или `role="switch"` не делает.

<a id="a-small-target-with-hitslop"></a>

## Маленькая цель с hitSlop

Кнопка-иконка может быть меньше пальца. `hitSlop` заставляет засчитываться нажатия рядом с ней, в пунктах за каждой стороной, не меняя её layout и внешний вид: одно число для всех сторон или указанные стороны по отдельности (`{ top: 8, bottom: 8 }`), как их принимает [`hitSlop` у view](./index.md#presses-and-feedback).

```rust tabs
fn close(open: Signal<bool>) -> impl IntoElement {
    button()
        .hit_slop(EdgeInsets::all(px(12.0)))
        .accessibility_label("Close")
        .on_press(move || open.set(false))
        .size(px(20.0))
        .items_center()
        .justify_center()
        .child(text("×"))
}
```

```tsx tabs
<Button hitSlop={12} accessibilityLabel="Close" onPress={() => open.set(false)} class="size-5 items-center justify-center">
  <Text>×</Text>
</Button>
```

<a id="accessibility"></a>

## Доступность

- Для скринридеров кнопка — один элемент с ролью `"button"`, если `role` не указывает иное. Её подпись — это её текстовое содержимое; задайте `accessibilityLabel`, когда содержимое — иконка или говорит слишком мало.
- `disabled` и `selected` объявляются так, как их объявляет платформа (VoiceOver, TalkBack, UI Automation, дерево доступности браузера).
- На macOS и в вебе кнопка является остановкой фокуса клавиатуры: до неё можно дойти клавишей Tab, Return и Space нажимают её, а стили `focus:` показывают, где находится фокус.

Общие сведения о подписях, ролях и объявлениях см. в разделе [Accessibility](../docs/accessibility.md).

<a id="platform-notes"></a>

## Примечания по платформам

- iOS, Android и Mac Catalyst: нажатие — это касание, заканчивающееся на кнопке; если отвести палец в сторону, нажатие отменяется, как у системных кнопок.
- Десктопы (macOS, Windows, Linux, GPUI) и веб: нажатие — это клик. На macOS и в вебе Return и Space также нажимают кнопку, у которой есть фокус клавиатуры. Стили `hover:` применяются при наведении мыши или указателя трекпада.
- Каждая платформа рисует то, что задаёт стиль приложения: отклик на нажатие — это `active:` / `activeStyle` или ваша собственная анимация.
