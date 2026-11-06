---
title: "Toolbar"
description: "Toolbar, ToolbarGroup и ToolbarSeparator: панель из кнопок, переключателей и ссылок, которая занимает одну позицию в порядке фокуса клавиатуры, а фокус внутри неё перемещается стрелками; поддерживает именованные группы и разделители. Внешний вид и состояние каждого элемента определяет приложение."
group: base
demo: el-toolbar
source_hash: 4c5547977ec8d003
---

# Toolbar

Toolbar — это панель элементов управления: форматирование текстового редактора, управление воспроизведением медиаплеера, вертикальная палитра инструментов.
`Toolbar` отвечает за клавиатуру и семантику такой панели: скринридеры объявляют toolbar (с именем из
`accessibilityLabel`), клавиатура достигает его за одну остановку и перемещается между его элементами стрелками, соответствующими
`axis`. Его элементы — это `Button`, `Toggle` и `Link` внутри него, на любой глубине. `ToolbarGroup` — это именованный набор
связанных элементов (отмена и повтор, выравнивание), а `ToolbarSeparator` — линия, которую приложение рисует между наборами. Внешний вид
определяет приложение: у toolbar нет собственных цветов, отступов и промежутков, а каждый элемент управления хранит собственное состояние.

```rust tabs
use nsh_base::{button, theme, toggle, toolbar, toolbar_group, toolbar_separator};
use nsh_core::prelude::*;

fn formatting() -> impl IntoElement {
    let bold = signal(false);
    toolbar()
        .accessibility_label("Formatting")
        .items_center()
        .gap_1()
        .child(
            toolbar_group()
                .accessibility_label("History")
                .child(button().accessibility_label("Undo").size_8().child(text("↶")))
                .child(button().accessibility_label("Redo").size_8().child(text("↷"))),
        )
        .child(toolbar_separator().w(px(1.0)).h_5().bg(move || theme().border))
        .child(
            toggle()
                .pressed(bold)
                .accessibility_label("Bold")
                .on_change(move |pressed: &bool| bold.set(*pressed))
                .size_8()
                .items_center()
                .justify_center()
                .pressed_style(|s| s.bg(move || theme().accent))
                .child(text("B")),
        )
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { Button, Toggle, Toolbar, ToolbarGroup, ToolbarSeparator } from "nsh/base";

function App() {
  const bold = signal(false);
  return (
    <Toolbar accessibilityLabel="Formatting" class="items-center gap-1 self-start rounded-lg bg-muted p-1">
      <ToolbarGroup accessibilityLabel="History">
        <Button accessibilityLabel="Undo" class="size-8 items-center justify-center rounded-md hover:bg-accent">
          <Text>↶</Text>
        </Button>
        <Button accessibilityLabel="Redo" class="size-8 items-center justify-center rounded-md hover:bg-accent">
          <Text>↷</Text>
        </Button>
      </ToolbarGroup>
      <ToolbarSeparator class="h-5 w-px bg-border" />
      <Toggle
        pressed={bold()}
        accessibilityLabel="Bold"
        onChange={({ pressed }) => bold.set(pressed)}
        class="size-8 items-center justify-center rounded-md aria-pressed:bg-accent"
      >
        <Text>B</Text>
      </Toggle>
    </Toolbar>
  );
}

mount(App);
```

`Toolbar`, `ToolbarGroup` и `ToolbarSeparator` входят в [`nsh/base`](../modules/nsh-base.md) — crate `nsh-base`
на Rust. Toolbar не хранит значения: переключатель внутри него получает информацию о том, нажат ли он, и сообщает `onChange`,
кнопка сообщает `onPress`, а состояние хранит приложение. В Rust их создают `toolbar()`, `toolbar_group()` и
`toolbar_separator()` с сеттером для каждого свойства (`.axis(..)`, `.disabled(..)`), типизированными методами стиля и
`.child(..)` для их содержимого.

## Props

<a id="toolbar-1"></a>

### Toolbar

| Свойство | Rust | Тип | По умолчанию | Описание |
|---|---|---|---|---|
| `axis` | `.axis(..)` | `"horizontal" \| "vertical"` | `"horizontal"` | Направление, в котором расположены элементы: стрелки, перемещающие по нему (Left и Right либо Up и Down), и направление раскладки дочерних элементов (строка или столбец). Считывается при создании toolbar. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Все элементы toolbar отключены независимо от собственного `disabled`: нет нажатий, нет остановки фокуса клавиатуры, для скринридеров элементы объявляются как неактивные. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | нет | Как скринридеры называют toolbar («Formatting»); нужно, когда на странице их несколько. |
| `children` | `.child(..)` | `JSX.Element` | нет | Элементы, их группы и разделители, а также всё остальное, что приложение размещает среди них (заголовок, распорка, поле ввода). |
| `class`, `style` | методы стиля | `string`, `StyleProp<ViewStyle>` | нет | Раскладка и внешний вид панели: выравнивание, промежутки, отступы, поверхность. |

### ToolbarGroup

| Свойство | Rust | Тип | По умолчанию | Описание |
|---|---|---|---|---|
| `disabled` | `.disabled(..)` | `boolean` | `false` | Все элементы группы отключены независимо от собственного `disabled`. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | нет | Как скринридеры называют группу («History», «Alignment»). |
| `children` | `.child(..)` | `JSX.Element` | нет | Элементы группы и всё остальное, что приложение размещает среди них. |
| `class`, `style` | методы стиля | `string`, `StyleProp<ViewStyle>` | нет | Раскладка и внешний вид группы. Она идёт вдоль оси toolbar. |

### ToolbarSeparator

| Свойство | Rust | Тип | По умолчанию | Описание |
|---|---|---|---|---|
| `class`, `style` | методы стиля | `string`, `StyleProp<ViewStyle>` | нет | Линия: тонкая черта поперёк строки (`h-5 w-px bg-border`) или столбца (`h-px self-stretch bg-border`). |

## Items

Элементы toolbar — это `Button`, `Toggle` и `Link` внутри него, в его группах, а также внутри
[`ToggleGroup`](./toggle.md), расположенного в нём. Триггер [`Menu`](./menu.md) или [`Popover`](./popover.md) тоже
является элементом: это представление в его слоте `trigger`, которому popup передаёт нажатия, фокус и состояние `expanded`. Инструмент,
который приложение рисует само, — это `Button` с классами приложения: у `Button` нет собственного внешнего вида, поэтому он выглядит так, как его
стилизует приложение, и является элементом (`View` с `onPress` остаётся отдельной остановкой, вне стрелок). `ToggleGroup`
внутри toolbar — одна из его групп: его переключатели являются элементами toolbar, скринридеры объявляют группу,
а его `disabled` по-прежнему отключает только его собственные переключатели. Остальные элементы управления (`Input`, `Select`, `Slider`) остаются
отдельными остановками и сохраняют свои стрелки; размещайте их в конце панели. То, что показывает открытый элементом popup (поля
и кнопки popover, пункты меню, ссылки hover card), не входит в toolbar. Стрелки проходят по элементам в том порядке, в котором
панель их раскладывает, на какой бы глубине они ни находились, а элемент, который приложение показывает позже, занимает своё место среди них.

## Parts

| Часть | Внутри | Стилизуется через | Состояния |
|---|---|---|---|
| Панель | | `class`, `style` у `Toolbar` | |
| Группа | панель | `class`, `style` у `ToolbarGroup` | |
| Разделитель | панель, группа | `class`, `style` у `ToolbarSeparator` | |
| Элемент | панель, группа | собственные `class`, `style` элемента | собственные: `aria-pressed:`, `disabled:`, `hover:`, `focus:`, `active:` |

Элемент, на котором находится клавиатура, показывайте стилями `focus:`, а нажатый переключатель — через его собственную поверхность (см.
[Design guides](../docs/design-guides.md#interaction-states)).

## Vertical

Палитра инструментов — это столбец: `axis="vertical"` раскладывает элементы сверху вниз, а Up и Down перемещают по ним.

```tsx
<Toolbar axis="vertical" accessibilityLabel="Tools" class="gap-1 self-start rounded-lg bg-muted p-1">
  <Each of={["select", "pen", "shape", "text"]}>
    {(t) => (
      <Toggle
        pressed={tool() === t()}
        accessibilityLabel={t()}
        onChange={({ pressed }) => pressed && tool.set(t())}
        class="size-8 items-center justify-center rounded-md aria-pressed:bg-accent"
      >
        <Text>{t()[0].toUpperCase()}</Text>
      </Toggle>
    )}
  </Each>
</Toolbar>
```

## Disabled

`disabled` на toolbar отключает все его элементы — панель, заблокированную приложением; на группе — элементы группы. Отключённый элемент
не принимает нажатий, стрелки его пропускают, а скринридеры объявляют его как неактивный:

```tsx
<Toolbar disabled={readonly()} accessibilityLabel="Review" class="flex-row gap-1">
  <Button onPress={approve} class="h-8 px-3 disabled:opacity-50">
    <Text>Approve</Text>
  </Button>
</Toolbar>
```

## Accessibility

- `Toolbar` имеет роль `"toolbar"` и получает имя из `accessibilityLabel`; его элементы остаются самостоятельными элементами. На iOS
  toolbar — это семантическая группа, в которую заходит VoiceOver.
- `ToolbarGroup` имеет роль `"group"` и получает имя из `accessibilityLabel`, поэтому набор элементов читается как единое целое. 
  `ToggleGroup` внутри toolbar — тоже группа.
- `ToolbarSeparator` не является элементом для скринридеров.
- `disabled` объявляется так, как его объявляет платформа (VoiceOver, TalkBack, UI Automation, дерево доступности
  браузера).

Общие сведения о метках, ролях и объявлениях см. в разделе [Accessibility](../docs/accessibility.md).

## Keyboard

На macOS и в вебе, где Tab достигает представлений, принимающих нажатия, `Toolbar` следует
[паттерну toolbar WAI-ARIA](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/):

| Клавиша | Действие |
|---|---|
| Tab, Shift+Tab | Входит в toolbar на элементе, где фокус был в последний раз (сначала — на первом неотключённом элементе), и покидает его за один шаг. |
| Right, Left (`axis="horizontal"`) | Перемещает фокус на следующий или предыдущий элемент, от последнего к первому и обратно. |
| Down, Up (`axis="vertical"`) | Перемещает фокус на следующий или предыдущий элемент, от последнего к первому и обратно. |
| Home, End | Перемещает фокус на первый или последний элемент. |
| Space, Return | Нажимает элемент в фокусе. |

Стрелки пропускают отключённые элементы и ничего не нажимают: переключатель меняется, только когда его нажимают. Вторая пара
стрелок остаётся за элементами (триггер меню открывает его по Down). При раскладке справа налево горизонтальный
toolbar идёт справа, поэтому Left переходит к следующему элементу, а Right — к предыдущему; вертикальный сохраняет Down и
Up.

## Platform notes

- iOS, Android и Mac Catalyst: каждый элемент нажимается касанием; toolbar — это группа, которую объявляют скринридеры.
- Настольные платформы (macOS, Windows, Linux, GPUI) и веб: нажатие — это клик. На macOS и в вебе toolbar — одна остановка
  Tab, а стрелки, Home и End перемещают между его элементами ([Keyboard](#keyboard)).
- Каждая платформа рисует то, что стилизует приложение: панель, её группы, разделители и элементы.
