---
title: "Radio"
description: "Radio и RadioGroup: набор вариантов, из которых пользователь выбирает ровно один. Каждый Radio отвечает за нажатия, активацию с клавиатуры, отключённое состояние, а также за свою роль и состояние checked для скринридеров; RadioGroup — это набор; внешний вид и значение определяются приложением."
group: base
demo: el-radio
source_hash: 051314109ae3d0b2
---

# Radio

Radio-кнопки предлагают набор вариантов, из которых пользователь выбирает ровно один: тариф, порядок сортировки, тему. Каждый `Radio` отвечает за поведение одного варианта: нажатия, активацию с клавиатуры, отключённое состояние, а также роль radio и её состояние checked для программ чтения с экрана. `RadioGroup` вокруг них задаёт набор, который программы чтения с экрана объявляют как одну группу. Внешний вид определяет приложение: у radio нет собственного круга, точки, цветов, размеров или подписи. Его дочерние элементы — это индикатор и подпись приложения, а классы `checked:` на radio или классы `group-checked:` на том, что находится внутри него, следуют за его состоянием.

```rust tabs
use nsh_base::{radio, radio_group, theme};
use nsh_core::prelude::*;

fn plans() -> impl IntoElement {
    let plan = signal("basic");
    let option = move |value: &'static str, label: &'static str| {
        let checked = move || plan.get() == value;
        radio()
            .checked(checked)
            .on_change(move |_: &bool| plan.set(value))
            .flex_row()
            .items_center()
            .gap_2()
            .child(
                view()
                    .size(px(20.0))
                    .items_center()
                    .justify_center()
                    .rounded_full()
                    .border_2()
                    .border_color(move || theme().border)
                    .child(
                        view()
                            .size(px(10.0))
                            .rounded_full()
                            .bg(move || theme().primary)
                            .opacity(move || if checked() { 1.0_f32 } else { 0.0 }),
                    ),
            )
            .child(text(label))
    };
    radio_group()
        .gap_3()
        .child(option("basic", "Basic"))
        .child(option("pro", "Pro"))
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { Radio, RadioGroup } from "nsh/base";

function App() {
  const plan = signal("basic");
  const option = (value: string, label: string) => (
    <Radio
      checked={plan() === value}
      onChange={() => plan.set(value)}
      class="group flex-row items-center gap-2"
    >
      <View class="size-5 items-center justify-center rounded-full border-2 border-border group-checked:border-primary">
        <View class="size-2.5 rounded-full group-checked:bg-primary" />
      </View>
      <Text>{label}</Text>
    </Radio>
  );
  return (
    <RadioGroup class="gap-3">
      {option("basic", "Basic")}
      {option("pro", "Pro")}
    </RadioGroup>
  );
}

mount(App);
```

`Radio` и `RadioGroup` приходят из [`nsh/base`](../modules/nsh-base.md), крейта `nsh-base` в Rust. Значение принадлежит приложению: группа его не хранит. Каждому radio сообщается, выбран ли он; нажатие на невыбранный radio сообщает `onChange({ checked: true })`, приложение устанавливает своё значение, и каждый radio показывает `checked`, которое передаёт обратно приложение. В Rust их создают `radio()` и `radio_group()`: с сеттером для каждого свойства (`.checked(..)`), слушателем для каждого события (`.on_change(..)`), типизированными методами стиля и `.child(..)` для их содержимого.

## Props

<a id="radio-1"></a>

### Radio

| Prop | Rust | Тип | По умолчанию | Описание |
|---|---|---|---|---|
| `checked` | `.checked(..)` | `boolean` | `false` | Выбран или нет. Нажатие на невыбранный radio сообщает `true` со значением `onChange`; radio показывает значение, которое передаёт обратно приложение. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Нет ни нажатий, ни отклика на нажатие; применяются стили `disabled:`, а программы чтения с экрана сообщают, что элемент приглушён. |
| `checkedStyle` | `.checked_style(\|s\| ..)` | `StyleProp<ViewStyle>` | нет | Стиль radio, пока он выбран и не отключён, в виде классов `checked:`. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | нет | Что произносят программы чтения с экрана: вариант, если в дочерних элементах нет текста, который его называет. |
| `hitSlop` | `.hit_slop(..)` | `number \| Partial<Edges>` | нет | На каком расстоянии за пределами границ нажатия всё ещё засчитываются, в пунктах: одно число для всех сторон или отдельно для названных сторон. Как `hitSlop` у view. |
| `children` | `.child(..)` | `JSX.Element` | нет | Индикатор и подпись приложения, которые произносят программы чтения с экрана. |
| `class`, `style` | методы стиля | `string`, `StyleProp<ViewStyle>` | нет | Сам radio: строка вокруг индикатора и подписи. |
| `activeStyle`, `hoverStyle`, `focusStyle`, `disabledStyle` | `.active(\|s\| ..)`, `.hover(..)`, `.focus(..)`, `.disabled_style(..)` | `StyleProp<ViewStyle>` | нет | Стиль radio, пока он нажат, находится под курсором, в фокусе или отключён, в виде классов `<state>:`. |

### RadioGroup

| Prop | Rust | Тип | По умолчанию | Описание |
|---|---|---|---|---|
| `children` | `.child(..)` | `JSX.Element` | нет | Radio набора и всё, что приложение размещает между ними. |
| `class`, `style` | методы стиля | `string`, `StyleProp<ViewStyle>` | нет | Раскладка и внешний вид группы: по умолчанию колонка, `flex-row` для строки. |

<a id="events"></a>

## События

| Событие | Rust | Описание |
|---|---|---|
| `onChange` (`Radio`) | `.on_change(\|checked: &bool\| ..)` | Невыбранный radio был нажат: касание, щелчок, Space или Return, пока у него фокус клавиатуры, либо активация программой чтения с экрана; или стрелка группы переместила на него фокус клавиатуры. Он просит выбрать его, поэтому `checked` равно `true`. Событие срабатывает до каких-либо изменений: radio показывает `checked`, которое передаёт обратно приложение. |

Выбранный radio остаётся выбранным и ничего не сообщает, так как radio не может снять выбор сам; отключённый radio тоже ничего не сообщает.

<a id="parts"></a>

## Части

| Часть | Находится внутри | Стилизуется с помощью | Состояния |
|---|---|---|---|
| Группа | | `RadioGroup`: `class`, `style` | |
| Radio | группа | `Radio`: `class`, `style` | `checked:`, `disabled:`, `active:`, `hover:`, `focus:` (или `checkedStyle`, `disabledStyle`, ...) |
| Индикатор и подпись | radio | собственные элементы (`children`) | `group-checked:`, `group-disabled:` и другие варианты `group-*:` с `group` на `class` у radio |

Индикатор — это содержимое приложения: кольцо с точкой, галочка, выделенная карточка. Если на `class` у radio задан `group`, его классы `group-checked:` показывают точку, пока radio выбран.

<a id="disabled"></a>

## Отключённое состояние

Отключённый radio не принимает нажатий, а программы чтения с экрана объявляют его приглушённым. Его классы `disabled:` применяются поверх классов `checked:`, а классы `group-disabled:` внутри него следуют за ним:

```tsx
<Radio
  checked={plan() === "team"}
  disabled={!eligible()}
  onChange={() => plan.set("team")}
  class="group flex-row items-center gap-2 disabled:opacity-50"
>
  <View class="size-5 items-center justify-center rounded-full border-2 border-border group-checked:border-primary">
    <View class="size-2.5 rounded-full group-checked:bg-primary" />
  </View>
  <Text>Team</Text>
</Radio>
```

<a id="a-small-target-with-hitslop"></a>

## Маленькая область нажатия с hitSlop

Radio без подписи рядом (точка в строке таблицы) может быть меньше пальца. `hitSlop` делает так, что нажатия рядом с ним засчитываются, в пунктах за каждой стороной, не меняя ни раскладку, ни внешний вид: одно число для всех сторон или отдельно для названных сторон (`{ top: 8, bottom: 8 }`), так же как их принимает [`hitSlop` у view](./index.md#presses-and-feedback).

```tsx
<Radio
  checked={plan() === "team"}
  hitSlop={12}
  accessibilityLabel="Team"
  onChange={() => plan.set("team")}
  class="group size-5 items-center justify-center rounded-full border-2 border-border group-checked:border-primary"
>
  <View class="size-2.5 rounded-full group-checked:bg-primary" />
</Radio>
```

<a id="accessibility"></a>

## Доступность

- Radio для программ чтения с экрана — один элемент с ролью `"radio"` и своим состоянием: выбран или нет, и selected, пока он выбран, поскольку одни программы чтения с экрана читают первое, а другие второе (radio в UI Automation — это элементы выбора). Его индикатор и подпись являются его частями; подпись — это текст его дочерних элементов или `accessibilityLabel`.
- У `RadioGroup` роль `"radiogroup"`: программы чтения с экрана воспринимают radio внутри него как один набор, при этом каждый остаётся отдельным элементом.
- `disabled` объявляется так, как его объявляет платформа (VoiceOver, TalkBack, UI Automation, дерево доступности браузера).
- В macOS и в вебе `RadioGroup` — это одна остановка фокуса клавиатуры, а клавиши со стрелками перемещаются между его radio и выбирают их (см. ниже).

Подробнее о подписях, ролях и объявлениях в целом см. [Accessibility](../docs/accessibility.md).

<a id="keyboard"></a>

## Клавиатура

В macOS и в вебе, где Tab переходит к views, принимающим нажатия, `RadioGroup` следует [паттерну radio group из WAI-ARIA](https://www.w3.org/WAI/ARIA/apg/patterns/radio/):

| Клавиша | Что делает |
|---|---|
| Tab, Shift+Tab | Входит в группу на выбранном radio (если выбранного нет — на первом radio, который не отключён) и покидает её за один шаг. |
| Down, Right | Перемещает фокус на следующий radio, с последнего на первый, и выбирает его. |
| Up, Left | Перемещает фокус на предыдущий radio, с первого на последний, и выбирает его. |
| Space | Выбирает radio, находящийся в фокусе. |

Клавиши со стрелками пропускают отключённые radio; radio, на который они переходят, просит выбрать его с помощью `onChange`, и приложение его выбирает. В раскладке справа налево Left и Right меняются местами: Left переходит к следующему radio, а Right — к предыдущему; Up и Down остаются прежними. Стили `focus:` показывают, где находится фокус. `Radio` вне `RadioGroup` — это отдельная остановка, до которой доходит Tab и которую выбирают Space и Return.

<a id="platform-notes"></a>

## Особенности платформ

- iOS, Android и Mac Catalyst: нажатие — это касание, которое заканчивается на radio, включая его подпись.
- Настольные платформы (macOS, Windows, Linux, GPUI) и веб: нажатие — это щелчок. В macOS и в вебе Space и Return также выбирают radio, у которого фокус клавиатуры, а клавиши со стрелками перемещают его ([Клавиатура](#keyboard)).
- Каждая платформа отрисовывает то, что стилизует приложение: индикатор, подпись и их переходы.
