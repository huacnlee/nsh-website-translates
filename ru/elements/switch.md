---
title: "Switch"
description: "Компонент Switch: элемент управления с состояниями «включено» и «выключено», который берёт на себя нажатия, активацию с клавиатуры, отключённое состояние, а также свою роль и значение для программ чтения с экрана. Дорожку и бегунок оформляет приложение."
group: base
demo: el-switch
source_hash: d203427a791f5543
---

# Switch

Переключатель включает или выключает настройку, и изменение вступает в силу сразу. Он отвечает за поведение: нажатия, активацию с клавиатуры, состояние disabled, а также роль переключателя и его значение для скринридеров. Внешний вид определяет приложение: у `Switch` нет собственных цветов, размеров, анимации или подписи. Он состоит из трека с бегунком внутри, затем из дочерних элементов (подписи), и приложение стилизует каждую часть классами `checked:` и `disabled:`, которые следуют за переключателем.

```rust tabs
use nsh_base::{switch, theme};
use nsh_core::prelude::*;

fn wifi() -> impl IntoElement {
    let on = signal(false);
    switch()
        .checked(on)
        .on_change(move |next: &bool| on.set(*next))
        .flex_row()
        .items_center()
        .gap_3()
        .track_style(|s| {
            s.w(px(44.0))
                .p(px(2.0))
                .rounded_full()
                .bg(move || theme().muted)
                .transition_colors()
                .checked(|s| s.bg(move || theme().primary))
        })
        .thumb_style(|s| {
            s.size(px(20.0))
                .rounded_full()
                .bg(move || theme().background)
                .shadow_sm()
                .transition_transform()
                .checked(|s| s.translate_x(px(20.0)))
        })
        .child(text("Wi-Fi"))
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { Switch } from "nsh/base";

function App() {
  const on = signal(false);
  return (
    <Switch
      checked={on()}
      onChange={({ checked }) => on.set(checked)}
      class="flex-row items-center gap-3"
      trackClass="w-11 rounded-full bg-muted p-0.5 transition-colors checked:bg-primary"
      thumbClass="size-5 rounded-full bg-background shadow-sm transition-transform checked:translate-x-5"
    >
      <Text>Wi-Fi</Text>
    </Switch>
  );
}

mount(App);
```

`Switch` происходит из [`nsh/base`](../modules/nsh-base.md), крейта `nsh-base` в Rust. Значение принадлежит приложению: нажатие сообщает следующее значение через `onChange`, а переключатель показывает `checked`, которое приложение передаёт обратно. В Rust `switch()` создаёт переключатель с сеттером для каждого свойства (`.checked(..)`, `.track_style(..)`), слушателем для каждого события (`.on_change(..)`), типизированными методами стилей для самого переключателя и `.child(..)` для его подписи; стиль части принимает методы состояний (`.checked(..)`, `.disabled_style(..)`), которые следуют за переключателем.

## Props

| Свойство | Rust | Тип | По умолчанию | Описание |
|---|---|---|---|---|
| `checked` | `.checked(..)` | `boolean` | `false` | Включён или выключен. Нажатие сообщает следующее значение через `onChange`; переключатель показывает значение, которое приложение передаёт обратно. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Без нажатий и без отклика на нажатие; стили `disabled:` применяются к переключателю и его частям, а скринридеры сообщают, что он неактивен. |
| `checkedStyle` | `.checked_style(\|s\| ..)` | `StyleProp<ViewStyle>` | нет | Стиль переключателя, пока он `checked` и не disabled, в виде классов `checked:`. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | нет | Что говорят скринридеры: что включает переключатель, если в его дочерних элементах нет текста, который это сообщает. |
| `trackClass`, `trackStyle` | `.track_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | нет | Трек, часть, вдоль которой движется бегунок. |
| `thumbClass`, `thumbStyle` | `.thumb_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | нет | Бегунок внутри трека. |
| `hitSlop` | `.hit_slop(..)` | `number \| Partial<Edges>` | нет | На сколько за пределами границ нажатия всё ещё засчитываются, в пунктах: одно число для всех сторон или отдельные стороны по именам. Как `hitSlop` у view. |
| `children` | `.child(..)` | `JSX.Element` | нет | Содержимое после трека: подпись, которую произносят скринридеры. |
| `class`, `style` | методы стилей | `string`, `StyleProp<ViewStyle>` | нет | Сам переключатель: строка вокруг трека и подписи. |
| `activeStyle`, `hoverStyle`, `focusStyle`, `disabledStyle` | `.active(\|s\| ..)`, `.hover(..)`, `.focus(..)`, `.disabled_style(..)` | `StyleProp<ViewStyle>` | нет | Стиль переключателя, пока он нажат, находится под курсором, в фокусе или disabled, в виде классов `<state>:`. |

## Events

| Событие | Rust | Описание |
|---|---|---|
| `onChange` | `.on_change(\|checked: &bool\| ..)` | Переключатель нажали: касание, щелчок, Space или Return при фокусе клавиатуры на нём, либо активация скринридером. Сообщает значение, которого запрашивает переключатель, как `checked`, противоположное имеющемуся у него `checked`. |

Disabled-переключатель ничего не сообщает.

## Parts

| Часть | Внутри | Стилизуется через | Состояния |
|---|---|---|---|
| Переключатель | | `class`, `style` | `checked:`, `disabled:`, `active:`, `hover:`, `focus:` (или `checkedStyle`, `disabledStyle`, ...) |
| Трек | переключатель, первым | `trackClass`, `trackStyle` | `checked:`, `disabled:` следуют за переключателем |
| Бегунок | трек | `thumbClass`, `thumbStyle` | `checked:`, `disabled:` следуют за переключателем |
| Подпись | переключатель, после трека | собственные элементы (`children`) | `group-checked:` и другие варианты `group-*:` с `group` на `class` переключателя |

Бегунок движется за счёт собственных стилей `checked:`: смещения (`checked:translate-x-5`) либо отступа или выравнивания трека (`checked:justify-end` на треке). Класс `transition-*` анимирует изменение нативно. Чтобы поместить подпись перед треком, разверните строку: `class="flex-row-reverse justify-between"`.

## Disabled

Disabled-переключатель не принимает нажатий, а скринридеры объявляют его как неактивный. Его классы `disabled:` и классы его трека и бегунка применяются поверх их классов `checked:`:

```tsx
<Switch
  checked={on()}
  disabled={!online()}
  onChange={({ checked }) => on.set(checked)}
  class="flex-row items-center gap-3 disabled:opacity-50"
  trackClass="w-11 rounded-full bg-muted p-0.5 checked:bg-primary disabled:bg-muted"
  thumbClass="size-5 rounded-full bg-background checked:translate-x-5"
>
  <Text>Sync over cellular</Text>
</Switch>
```

## A small target with hitSlop

Переключатель без подписи рядом может быть меньше пальца. `hitSlop` делает так, что нажатия рядом с ним засчитываются, на указанное число пунктов за каждой стороной, без изменения его раскладки и внешнего вида: одно число для всех сторон или отдельные стороны по именам (`{ top: 8, bottom: 8 }`), так же как их принимает [`hitSlop` у view](./index.md#presses-and-feedback).

```tsx
<Switch
  checked={on()}
  hitSlop={{ top: 8, bottom: 8 }}
  accessibilityLabel="Notifications"
  onChange={({ checked }) => on.set(checked)}
  trackClass="w-9 rounded-full bg-muted p-0.5 checked:bg-primary"
  thumbClass="size-4 rounded-full bg-background checked:translate-x-4"
/>
```

## Accessibility

- Для скринридеров переключатель является одним элементом с ролью `"switch"` и своим значением (включён или выключен); трек и бегунок являются его частями. Его подпись это текст его дочерних элементов; укажите `accessibilityLabel`, если текста нет.
- `disabled` объявляется так, как его объявляет платформа (VoiceOver, TalkBack, UI Automation, дерево доступности браузера).
- В macOS и вебе переключатель является точкой остановки фокуса клавиатуры: до него доходит Tab, Space и Return переключают его, а стили `focus:` показывают, где находится фокус.

Общие сведения о подписях, ролях и объявлениях см. в разделе [Accessibility](../docs/accessibility.md).

## Platform notes

- iOS, Android и Mac Catalyst: нажатие это касание, которое заканчивается на переключателе, включая его подпись.
- Десктопы (macOS, Windows, Linux, GPUI) и веб: нажатие это щелчок. В macOS и вебе Space и Return также переключают переключатель, который находится в фокусе клавиатуры.
- Каждая платформа рисует то, что стилизует приложение; бегунок движется так, как заданы стили и переходы приложения.
