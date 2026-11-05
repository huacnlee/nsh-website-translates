---
title: "Checkbox"
description: "Компонент Checkbox: элемент управления с состояниями «отмечен», «не отмечен» или «неопределённое состояние», который обрабатывает нажатия, активацию с клавиатуры, отключённое состояние, а также свою роль и значение для программ чтения с экрана; индикатор оформляется и размечается приложением."
group: base
demo: el-checkbox
source_hash: c31b1f22eacafd92
---

# Checkbox

Чекбокс выбирает вариант, элемент списка или все сразу. Он может быть отмечен, не отмечен или неопределён (ни то ни другое: «выбрать все» при частичном выборе). Он отвечает за поведение: нажатия, активацию с клавиатуры, отключённое состояние, а также роль checkbox и её значение для экранных считывателей. Внешний вид задаёт приложение: у `Checkbox` нет собственных рамки, отметки, цветов, размеров или подписи. Он состоит из индикатора (рамки) с отметкой приложения внутри, затем из дочерних элементов (подписи), и приложение стилизует каждую часть классами `checked:`, `indeterminate:` и `disabled:`, которые следуют за состоянием чекбокса.

```rust tabs
use nsh_base::{checkbox, theme};
use nsh_core::prelude::*;

fn notify() -> impl IntoElement {
    let on = signal(false);
    checkbox()
        .checked(on)
        .on_change(move |next: &bool| on.set(*next))
        .flex_row()
        .items_center()
        .gap_2()
        .indicator_style(|s| {
            s.size(px(20.0))
                .items_center()
                .justify_center()
                .rounded_md()
                .border_2()
                .border_color(move || theme().border)
                .transition_colors()
                .checked(|s| s.bg(move || theme().primary).border_color(move || theme().primary))
        })
        .indicator(text(move || if on.get() { "✓" } else { "" }).text_color(move || theme().primary_foreground))
        .child(text("Notify me"))
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { Checkbox } from "nsh/base";

function App() {
  const on = signal(false);
  return (
    <Checkbox
      checked={on()}
      onChange={({ checked }) => on.set(checked)}
      class="flex-row items-center gap-2"
      indicatorClass="size-5 items-center justify-center rounded-md border-2 border-border transition-colors checked:border-primary checked:bg-primary"
      indicator={<Text class="text-primary-foreground">{on() ? "✓" : ""}</Text>}
    >
      <Text>Notify me</Text>
    </Checkbox>
  );
}

mount(App);
```

`Checkbox` входит в [`nsh/base`](../modules/nsh-base.md), крейт `nsh-base` для Rust. Значение принадлежит приложению: нажатие сообщает следующее значение через `onChange`, а чекбокс показывает `checked` и `indeterminate`, которые приложение передаёт обратно. В Rust `checkbox()` создаёт чекбокс с сеттером для каждого свойства (`.checked(..)`, `.indicator_style(..)`), слушателем для каждого события (`.on_change(..)`), типизированными методами стиля для самого чекбокса и `.child(..)` для его подписи; стиль индикатора принимает методы состояний (`.checked(..)`, `.indeterminate(..)`, `.disabled_style(..)`), которые следуют за чекбоксом.

<a id="props"></a>

## Свойства

| Свойство | Rust | Тип | По умолчанию | Описание |
|---|---|---|---|---|
| `checked` | `.checked(..)` | `boolean` | `false` | Отмечен или нет. Нажатие сообщает следующее значение через `onChange`; чекбокс показывает значение, которое приложение передаёт обратно. |
| `indeterminate` | `.indeterminate(..)` | `boolean` | `false` | Ни отмечен, ни не отмечен; приоритетнее `checked`, пока действует. Экранные считыватели сообщают, что значение смешанное, а нажатие запрашивает отмеченное состояние. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Нет нажатий и нет отклика на нажатие; стили `disabled:` применяются к чекбоксу и его индикатору, а экранные считыватели сообщают, что элемент недоступен. |
| `checkedStyle` | `.checked_style(\|s\| ..)` | `StyleProp<ViewStyle>` | нет | Стиль чекбокса в отмеченном и не отключённом состоянии, в виде классов `checked:`. |
| `indeterminateStyle` | `.indeterminate_style(\|s\| ..)` | `StyleProp<ViewStyle>` | нет | Стиль чекбокса в неопределённом и не отключённом состоянии, в виде классов `indeterminate:`. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | нет | Что произносят экранные считыватели: что выбирает чекбокс, если в его дочерних элементах нет текста, который это говорит. |
| `role` | `.role(..)` | `AccessibilityRole` | `"checkbox"` | Чем элемент является для экранных считывателей, если это что-то более конкретное (отмеченный пункт меню: `"menuitem"`). |
| `indicatorClass`, `indicatorStyle` | `.indicator_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | нет | Индикатор, рамка, показывающая значение. |
| `indicator` | `.indicator(..)` | `JSX.Element` | нет | Содержимое индикатора: отметка (галочка, тире), которую приложение показывает в зависимости от значения. |
| `hitSlop` | `.hit_slop(..)` | `number \| Partial<Edges>` | нет | Насколько далеко за границами элемента нажатия всё ещё засчитываются, в пунктах: одно число для всех сторон или стороны по именам. Как `hitSlop` у view. |
| `children` | `.child(..)` | `JSX.Element` | нет | Содержимое после индикатора: подпись, которую произносят экранные считыватели. |
| `class`, `style` | методы стиля | `string`, `StyleProp<ViewStyle>` | нет | Сам чекбокс: строка вокруг индикатора и подписи. |
| `activeStyle`, `hoverStyle`, `focusStyle`, `disabledStyle` | `.active(\|s\| ..)`, `.hover(..)`, `.focus(..)`, `.disabled_style(..)` | `StyleProp<ViewStyle>` | нет | Стиль чекбокса в нажатом, наведённом, сфокусированном или отключённом состоянии, в виде классов `<state>:`. |

<a id="events"></a>

## События

| Событие | Rust | Описание |
|---|---|---|
| `onChange` | `.on_change(\|checked: &bool\| ..)` | Чекбокс нажат: касание, клик, Space или Return при фокусе клавиатуры на нём либо активация экранным считывателем. Событие сообщает значение, которое запрашивает чекбокс, как `checked`: `true` из не отмеченного и из неопределённого состояния, `false` из отмеченного. |

Отключённый чекбокс ничего не сообщает.

<a id="parts"></a>

## Части

| Часть | Внутри | Стилизуется через | Состояния |
|---|---|---|---|
| Чекбокс | | `class`, `style` | `checked:`, `indeterminate:`, `disabled:`, `active:`, `hover:`, `focus:` (или `checkedStyle`, `indeterminateStyle`, `disabledStyle`, ...) |
| Индикатор | чекбокс, первым | `indicatorClass`, `indicatorStyle` | `checked:`, `indeterminate:`, `disabled:` следуют за чекбоксом |
| Отметка | индикатор | собственные элементы (`indicator`) | `group-checked:`, `group-indeterminate:` и другие варианты `group-*:` с `group` на `indicatorClass` |
| Подпись | чекбокс, после индикатора | собственные элементы (`children`) | варианты `group-*:` с `group` на `class` чекбокса |

Отметка является содержимым приложения, поэтому показывает то, что решит приложение: галочку в отмеченном состоянии и тире в неопределённом, выбранные по значению, которое хранит приложение, либо обе отметки, где показанную выбирают классы `group-checked:` / `group-indeterminate:`.

<a id="indeterminate"></a>

## Неопределённое состояние

Чекбокс «выбрать все» неопределён, пока выбраны некоторые элементы. Нажатие запрашивает отмеченное состояние, и приложение выбирает все элементы:

```tsx
const selected = signal<string[]>([]);
const all = () => selected().length === items.length;
const some = () => selected().length > 0 && !all();

<Checkbox
  checked={all()}
  indeterminate={some()}
  onChange={({ checked }) => selected.set(checked ? items.map((i) => i.id) : [])}
  class="flex-row items-center gap-2"
  indicatorClass="group size-5 items-center justify-center rounded-md border-2 border-border checked:border-primary checked:bg-primary indeterminate:border-primary indeterminate:bg-primary"
  indicator={
    <>
      <Text class="hidden text-primary-foreground group-checked:flex">✓</Text>
      <View class="hidden h-0.5 w-2.5 bg-primary-foreground group-indeterminate:flex" />
    </>
  }
>
  <Text>Select all</Text>
</Checkbox>
```

<a id="disabled"></a>

## Отключённое состояние

Отключённый чекбокс не принимает нажатий, а экранные считыватели сообщают, что он недоступен. Его классы `disabled:` и классы его индикатора применяются поверх их классов `checked:` и `indeterminate:`:

```tsx
<Checkbox
  checked={on()}
  disabled={locked()}
  onChange={({ checked }) => on.set(checked)}
  class="flex-row items-center gap-2 disabled:opacity-50"
  indicatorClass="size-5 rounded-md border-2 border-border checked:border-primary checked:bg-primary disabled:border-border disabled:bg-muted"
>
  <Text>Share usage data</Text>
</Checkbox>
```

<a id="a-small-target-with-hitslop"></a>

## Маленькая цель и hitSlop

Чекбокс без подписи рядом (поле выбора в строке) может быть меньше пальца. `hitSlop` заставляет засчитываться нажатия, попавшие рядом с ним, на указанное число пунктов за каждой стороной, не меняя ни его раскладку, ни внешний вид: одно число для всех сторон или стороны по именам (`{ top: 8, bottom: 8 }`), как их принимает [`hitSlop` у view](./index.md#presses-and-feedback).

```tsx
<Checkbox
  checked={selected()}
  hitSlop={12}
  accessibilityLabel="Select row"
  onChange={({ checked }) => selected.set(checked)}
  indicatorClass="size-4 rounded border border-border checked:bg-primary"
/>
```

<a id="accessibility"></a>

## Доступность

- Для экранных считывателей чекбокс является одним элементом с ролью `"checkbox"` (или его `role`) и значением: отмечен, не отмечен или смешанное значение в неопределённом состоянии. Индикатор и отметка входят в его состав. Его подпись это текст его дочерних элементов; задайте `accessibilityLabel`, если текста нет.
- `disabled` озвучивается так, как это делает платформа (VoiceOver, TalkBack, UI Automation, дерево доступности браузера).
- В macOS и вебе чекбокс является остановкой фокуса клавиатуры: Tab переходит к нему, Space и Return переключают его, а стили `focus:` показывают, где находится фокус.

Общие сведения о подписях, ролях и объявлениях см. в разделе [Accessibility](../docs/accessibility.md).

<a id="platform-notes"></a>

## Примечания по платформам

- iOS, Android и Mac Catalyst: нажатие это касание, закончившееся на чекбоксе, включая его подпись.
- Десктопы (macOS, Windows, Linux, GPUI) и веб: нажатие это клик. В macOS и вебе Space и Return также переключают чекбокс, на котором находится фокус клавиатуры.
- Каждая платформа рисует то, что стилизует приложение: индикатор, отметку и их переходы.
