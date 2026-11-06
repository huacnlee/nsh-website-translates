---
title: "Toggle"
description: "Toggle и ToggleGroup: кнопка, которая может быть включена или выключена, и панель инструментов из таких кнопок. Каждый Toggle отвечает за нажатия, активацию с клавиатуры, отключённое состояние, а также за свою роль и состояние нажатия для программ чтения с экрана; группа представляет собой панель инструментов с одной точкой остановки фокуса клавиатуры; внешний вид и то, какие переключатели нажаты, определяет приложение."
group: base
demo: el-toggle
source_hash: d8d3727dd9d04426
---

# Toggle

Toggle — это кнопка, которая остаётся включённой или выключенной: полужирный шрифт на панели текста, звёздочка избранного, параметр вида. `Toggle` отвечает за её поведение: нажатия, активацию с клавиатуры, отключённое состояние и роль кнопки с состоянием нажатия для скринридеров, которые объявляют её как кнопку-переключатель. `ToggleGroup` вокруг нескольких переключателей образует панель инструментов: скринридеры объявляют её как одну панель, клавиатура попадает в неё за одну остановку и перемещается между её переключателями стрелками. Внешний вид определяет приложение: у переключателя нет собственных цветов, размеров, значка или подписи. Его дочерние элементы — значок или подпись приложения, а классы `aria-pressed:` на переключателе или классы `group-aria-pressed:` на его содержимом следуют его состоянию.

```rust tabs
use nsh_base::{theme, toggle, toggle_group};
use nsh_core::prelude::*;

fn formatting() -> impl IntoElement {
    let bold = signal(true);
    let italic = signal(false);
    let item = move |label: &'static str, on: Signal<bool>| {
        toggle()
            .pressed(on)
            .accessibility_label(label)
            .on_change(move |pressed: &bool| on.set(*pressed))
            .size_8()
            .items_center()
            .justify_center()
            .rounded(move || theme().radius)
            .pressed_style(|s| s.bg(move || theme().accent))
            .child(text(&label[..1]).text_sm().text_color(move || {
                if on.get() { theme().accent_foreground } else { theme().muted_foreground }
            }))
    };
    toggle_group()
        .flex_row()
        .self_start()
        .gap_1()
        .child(item("Bold", bold))
        .child(item("Italic", italic))
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { Toggle, ToggleGroup } from "nsh/base";

function App() {
  const marks = signal<string[]>(["bold"]);
  const item = (value: string, label: string) => (
    <Toggle
      pressed={marks().includes(value)}
      accessibilityLabel={label}
      onChange={({ pressed }) =>
        marks.set(pressed ? [...marks(), value] : marks().filter((m) => m !== value))
      }
      class="group size-8 items-center justify-center rounded-(--radius) aria-pressed:bg-accent"
    >
      <Text class="text-sm text-muted-foreground group-aria-pressed:text-accent-foreground">{label[0]}</Text>
    </Toggle>
  );
  return (
    <ToggleGroup class="flex-row self-start gap-1">
      {item("bold", "Bold")}
      {item("italic", "Italic")}
    </ToggleGroup>
  );
}

mount(App);
```

`Toggle` и `ToggleGroup` берутся из [`nsh/base`](../modules/nsh-base.md), крейта `nsh-base` в Rust. Значение принадлежит приложению: каждому переключателю сообщают, нажат ли он, нажатие сообщает запрашиваемое значение через `onChange`, а переключатель показывает `pressed`, которое вернуло приложение. Группа тоже не хранит значения, поэтому и то, сколько переключателей может быть нажато одновременно, решает приложение: любое число (полужирный, курсив и подчёркивание) или ровно один (выравнивание, переключатель видов). Во втором случае приложение нажимает запрошенный переключатель, отпускает остальные и оставляет нажатый нажатым. В Rust их создают `toggle()` и `toggle_group()`: у них есть сеттер для каждого свойства (`.pressed(..)`), слушатель для каждого события (`.on_change(..)`), типизированные методы стилей и `.child(..)` для содержимого.

<a id="props"></a>

## Свойства

<a id="toggle-1"></a>

### Toggle

| Свойство | Rust | Тип | По умолчанию | Описание |
|---|---|---|---|---|
| `pressed` | `.pressed(..)` | `boolean` | `false` | Включён или выключен: скринридеры сообщают, что переключатель нажат, и применяются стили `aria-pressed:`. Нажатие сообщает противоположное значение через `onChange`; переключатель показывает значение, которое вернуло приложение. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Нет нажатий и нет отклика на нажатие; применяются стили `disabled:`, а скринридеры сообщают, что переключатель неактивен. Переключатель в отключённом `ToggleGroup` тоже отключён. |
| `pressedStyle` | `.pressed_style(\|s\| ..)` | `StyleProp<ViewStyle>` | нет | Стиль переключателя, пока он нажат и не отключён, в виде классов `aria-pressed:`. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | нет | Что говорят скринридеры: что включает переключатель, если в его дочерних элементах нет текста, который это говорит (значок). |
| `hitSlop` | `.hit_slop(..)` | `number \| Partial<Edges>` | нет | Насколько за пределами переключателя нажатия всё ещё засчитываются, в пунктах: одно число для всех сторон или отдельно по сторонам. Как у `hitSlop` представления. |
| `children` | `.child(..)` | `JSX.Element` | нет | Значок или подпись приложения, которые озвучивают скринридеры. |
| `class`, `style` | методы стилей | `string`, `StyleProp<ViewStyle>` | нет | Сам переключатель: поверхность вокруг его содержимого. |
| `activeStyle`, `hoverStyle`, `focusStyle`, `disabledStyle` | `.active(\|s\| ..)`, `.hover(..)`, `.focus(..)`, `.disabled_style(..)` | `StyleProp<ViewStyle>` | нет | Стиль переключателя, пока идёт нажатие, при наведении, в фокусе или в отключённом состоянии, в виде классов `<state>:`. |

### ToggleGroup

| Свойство | Rust | Тип | По умолчанию | Описание |
|---|---|---|---|---|
| `disabled` | `.disabled(..)` | `boolean` | `false` | Все переключатели группы отключены, независимо от их собственного `disabled`. |
| `children` | `.child(..)` | `JSX.Element` | нет | Переключатели группы и всё, что приложение размещает между ними (разделитель). |
| `class`, `style` | методы стилей | `string`, `StyleProp<ViewStyle>` | нет | Раскладка и внешний вид группы: по умолчанию столбец, `flex-row` для строки. |

<a id="events"></a>

## События

| Событие | Rust | Описание |
|---|---|---|
| `onChange` (`Toggle`) | `.on_change(\|pressed: &bool\| ..)` | Переключатель нажат: касание, щелчок, Space или Return при фокусе клавиатуры на нём либо активация скринридером. `{ pressed }` — значение, которое он запрашивает, противоположное `pressed`. Событие срабатывает до каких-либо изменений: переключатель показывает `pressed`, которое вернуло приложение. |

Стрелка в `ToggleGroup` только перемещает фокус клавиатуры и ничего не нажимает. Отключённый переключатель ничего не сообщает.

<a id="parts"></a>

## Части

| Часть | Находится внутри | Стилизуется с помощью | Состояния |
|---|---|---|---|
| Группа | | `ToggleGroup`: `class`, `style` | |
| Переключатель | группы или где угодно | `Toggle`: `class`, `style` | `aria-pressed:`, `disabled:`, `active:`, `hover:`, `focus:` (или `pressedStyle`, `disabledStyle`, ...) |
| Значок или подпись | переключатель | собственные элементы (`children`) | `group-aria-pressed:`, `group-disabled:` и другие варианты `group-*:` с `group` на `class` переключателя |

`aria-pressed:` означает, что переключатель включён; `active:` — идёт нажатие, как на включённом, так и на выключенном. Показывайте нажатый переключатель через его собственную поверхность: заливку, приподнятую «таблетку», более насыщенный значок (см. [Design guides](../docs/design-guides.md#interaction-states)).

## Segmented

Группа, переключатели которой объединены и нажат только один из них, — это сегментированный элемент управления (переключатель видов): приложение хранит одно значение и нажимает переключатель, который его называет. Объединённый вид задают классы приложения:

```tsx
<ToggleGroup class="flex-row self-start">
  <Each of={["grid", "list"]}>
    {(value) => (
      <Toggle
        pressed={view() === value()}
        accessibilityLabel={`${value()} view`}
        onChange={({ pressed }) => pressed && view.set(value())}
        class="-ml-px h-8 px-3 border border-border first:ml-0 first:rounded-l-(--radius) last:rounded-r-(--radius) aria-pressed:bg-accent"
      >
        <Text class="text-sm">{value()}</Text>
      </Toggle>
    )}
  </Each>
</ToggleGroup>
```

## Disabled

Отключённый переключатель не принимает нажатий, а скринридеры объявляют его как неактивный. Его классы `disabled:` применяются поверх классов `aria-pressed:`, а классы `group-disabled:` внутри него следуют за ними. `disabled` на `ToggleGroup` отключает все переключатели в ней — панель, которую приложение блокирует:

```tsx
<ToggleGroup disabled={readonly()} class="flex-row gap-1">
  <Toggle pressed={bold()} onChange={({ pressed }) => bold.set(pressed)} class="size-8 disabled:opacity-50">
    <Text>B</Text>
  </Toggle>
</ToggleGroup>
```

<a id="a-small-target-with-hitslop"></a>

## Маленькая цель с hitSlop

Переключатель-значок может быть меньше пальца. `hitSlop` делает так, что нажатия рядом с ним засчитываются, в пунктах за каждой стороной, не меняя его раскладку и внешний вид: одно число для всех сторон или отдельно по сторонам (`{ top: 8, bottom: 8 }`), как их принимает [`hitSlop` представления](./index.md#presses-and-feedback).

```tsx
<Toggle
  pressed={favorite()}
  hitSlop={12}
  accessibilityLabel="Favorite"
  onChange={({ pressed }) => favorite.set(pressed)}
  class="size-5 items-center justify-center"
>
  <Text>★</Text>
</Toggle>
```

<a id="accessibility"></a>

## Доступность

- Для скринридеров переключатель — один элемент с ролью `"button"` и состоянием нажатия: кнопка-переключатель. Его подпись — текст его дочерних элементов или `accessibilityLabel`.
- `ToggleGroup` имеет роль `"toolbar"`: скринридеры воспринимают переключатели внутри неё как одну панель инструментов, при этом каждый остаётся отдельным элементом.
- `disabled` объявляется так, как это делает платформа (VoiceOver, TalkBack, UI Automation, дерево доступности браузера).
- На macOS и в вебе группа — одна остановка фокуса клавиатуры, а стрелки перемещают фокус между её переключателями (см. ниже).

Общие сведения о подписях, ролях и объявлениях см. в разделе [Accessibility](../docs/accessibility.md).

<a id="keyboard"></a>

## Клавиатура

На macOS и в вебе, где Tab переходит к представлениям, принимающим нажатия, `ToggleGroup` следует [шаблону панели инструментов WAI-ARIA](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/):

| Клавиша | Что делает |
|---|---|
| Tab, Shift+Tab | Входит в группу на первом нажатом переключателе (если нажатых нет — на первом не отключённом) и выходит из неё за один шаг. |
| Right, Down | Перемещает фокус на следующий переключатель, с последнего на первый. |
| Left, Up | Перемещает фокус на предыдущий переключатель, с первого на последний. |
| Home, End | Перемещает фокус на первый или последний переключатель. |
| Space, Return | Нажимает переключатель, на котором находится фокус. |

Стрелки пропускают отключённые переключатели и ничего не нажимают: переключатель меняется только при нажатии. Обе пары стрелок перемещают фокус независимо от раскладки группы, которую задают классы приложения. В раскладке справа налево Left и Right меняются местами: Left переходит к следующему переключателю, а Right — к предыдущему; Up, Down, Home и End работают как обычно. Стили `focus:` показывают, где находится фокус. `Toggle` вне `ToggleGroup` — отдельная остановка.

<a id="platform-notes"></a>

## Особенности платформ

- iOS, Android и Mac Catalyst: нажатие — это касание, завершающееся на переключателе, включая его содержимое.
- Настольные платформы (macOS, Windows, Linux, GPUI) и веб: нажатие — это щелчок. На macOS и в вебе Space и Return также нажимают переключатель, находящийся в фокусе клавиатуры, а стрелки, Home и End перемещают фокус ([Клавиатура](#keyboard)).
- Каждая платформа отрисовывает то, что стилизует приложение: переключатели, поверхность нажатых и дорожку группы.
