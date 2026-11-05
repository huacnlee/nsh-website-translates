---
title: "Menu"
description: "Menu и ContextMenu с MenuItem, MenuSeparator и Submenu: всплывающее меню с каскадными подменю на десктопах, шторка с подменю на месте на телефонах, стилизуемая приложением."
group: base
demo: el-menu
source_hash: 31bd57113d599fac
---

# Menu

Меню — это список действий, который открывает его триггер. Одна структура служит для всех устройств и показывается так, как ожидает каждое из них:

- На десктопах и в десктопных браузерах это всплывающее окно у триггера; `Submenu` раскрывается рядом со своим пунктом, когда указатель наводится на него или нажимает на него.
- На телефонах и планшетах это панель (sheet) внизу экрана поверх подложки; `Submenu` показывает свои пункты в панели вместо пунктов меню, а ваша строка в начале ведёт назад.

Меню закрывают выбор пункта, нажатие снаружи, Escape, кнопка «Назад» в Android и жест выхода в VoiceOver. `ContextMenu` — это то же меню, которое открывается вторичной кнопкой (правым щелчком) в месте указателя или удержанием пальца на его триггере на сенсорных экранах.

```rust tabs
use nsh_base::{menu, menu_item, menu_separator, submenu};
use nsh_core::prelude::*;

fn item(label: &'static str, on_select: impl Fn() + 'static) -> impl IntoElement {
    menu_item()
        .on_select(on_select)
        .px_3()
        .py_2()
        .rounded_md()
        .child(text(label))
}

fn file_menu() -> impl IntoElement {
    menu()
        .offset(px(4.0))
        .trigger(view().px_3().py_2().child(text("File")))
        .child(item("New", || log::info!("new")))
        .child(item("Open…", || log::info!("open")))
        .child(menu_separator().h(px(1.0)).my_1().bg(rgb(0xe5e7eb)))
        .child(
            submenu()
                .trigger(view().px_3().py_2().child(text("Share ›")))
                .back(view().px_3().py_2().child(text("‹ Back")))
                .child(item("Mail", || log::info!("mail")))
                .child(item("Copy link", || log::info!("link"))),
        )
}
```

```tsx tabs
import { Text, View } from "nsh";
import { Menu, MenuItem, MenuSeparator, Submenu } from "nsh/base";

function Item(props: { label: string; onSelect: () => void }) {
  return (
    <MenuItem onSelect={props.onSelect} class="rounded-md px-3 py-2 hover:bg-gray-100 active:bg-gray-200">
      <Text>{props.label}</Text>
    </MenuItem>
  );
}

function FileMenu() {
  return (
    <Menu
      offset={4}
      popupClass="min-w-48 rounded-lg bg-white p-1 shadow-lg"
      backdropClass="bg-black/40"
      trigger={<View class="px-3 py-2"><Text>File</Text></View>}
    >
      <Item label="New" onSelect={newFile} />
      <Item label="Open…" onSelect={openFile} />
      <MenuSeparator class="my-1 h-px bg-gray-200" />
      <Submenu
        trigger={<View class="px-3 py-2"><Text>Share ›</Text></View>}
        back={<View class="px-3 py-2"><Text>‹ Back</Text></View>}
      >
        <Item label="Mail" onSelect={mail} />
        <Item label="Copy link" onSelect={copyLink} />
      </Submenu>
    </Menu>
  );
}
```

Все пять компонентов приходят из [`nsh/base`](../modules/nsh-base.md). Пункты сами попадают в своё меню, поэтому вы располагаете их свободно: группы во view, подписи, пункты, которые появляются и исчезают с помощью `If`. `popupClass` задаёт стиль всплывающего окна на десктопах и панели на телефонах; стиль, различающийся между ними, может сравнивать `platform.idiom` (`nsh`) с `"desktop"`.

<a id="menu-bars"></a>

## Панели меню

Меню, триггеры которых являются пунктами одного `Toolbar`, образуют панель меню: пока одно из её меню открыто, наведение указателя на триггер другого меню открывает его вместо первого, а стрелки клавиатуры переключаются между триггерами.

```tsx
<Toolbar accessibilityLabel="Menu bar">
  <Menu trigger={<View><Text>File</Text></View>}>{/* … */}</Menu>
  <Menu trigger={<View><Text>Edit</Text></View>}>{/* … */}</Menu>
</Toolbar>
```

<a id="context-menus"></a>

## Контекстные меню

```tsx
import { ContextMenu, MenuItem } from "nsh/base";

<ContextMenu
  popupClass="min-w-40 rounded-lg bg-white p-1 shadow-lg"
  backdropClass="bg-black/40"
  trigger={<PhotoTile photo={photo} />}
>
  <MenuItem onSelect={() => share(photo)}><Text>Share</Text></MenuItem>
  <MenuItem onSelect={() => remove(photo)}><Text>Delete</Text></MenuItem>
</ContextMenu>
```

На десктопах вторичная кнопка открывает его там, где находится указатель. На сенсорных экранах палец, удерживаемый на триггере, открывает его как панель; собственные нажатия триггера и окружающие его scroll view продолжают работать, а движение пальца отменяет удержание.

<a id="checkable-items"></a>

## Отмечаемые пункты

`checked` делает пункт отмечаемым: это либо настройка, которую показывает меню («Show sidebar»), либо, вместе с `role="menuitemradio"`, один выбор из группы («Sort by»). Значение принадлежит вам: выбор пункта вызывает `onSelect`, вы задаёте следующее значение, и пункт его показывает. Пока пункт отмечен, действуют его классы `checked:` и `checkedStyle`, а также классы его индикатора: части перед содержимым (`indicatorClass`, `indicatorStyle`) вокруг отметки, которую вы задаёте (`indicator`). Отметка создаётся один раз и сохраняется; классы `checked:` индикатора показывают и скрывают её, как и собственные классы `group-checked:` отметки вместе с `group` в `indicatorClass`. `closeOnSelect={false}` оставляет меню открытым, поэтому настройка сразу показывает новое значение.

```rust tabs
use nsh_base::{menu, menu_item};
use nsh_core::{element::StyleRefinement, prelude::*};

fn view_menu(sidebar: Signal<bool>, sort: Signal<&'static str>) -> impl IntoElement {
    // The indicator part shows the mark while the item is checked.
    let part = |s: StyleRefinement| s.w(px(16.0)).opacity(0.0).checked(|s| s.opacity(1.0));
    let by = move |label: &'static str| {
        menu_item()
            .role(AccessibilityRole::MenuItemRadio)
            .checked(move || Some(sort.get() == label))
            .indicator_style(part)
            .indicator(text("✓"))
            .on_select(move || sort.set(label))
            .flex_row()
            .gap_2()
            .px_3()
            .py_2()
            .child(text(label))
    };
    menu()
        .trigger(view().px_3().py_2().child(text("View")))
        .child(
            menu_item()
                .checked(move || Some(sidebar.get()))
                .close_on_select(false)
                .indicator_style(part)
                .indicator(text("✓"))
                .on_select(move || sidebar.set(!sidebar.get_untracked()))
                .flex_row()
                .gap_2()
                .px_3()
                .py_2()
                .child(text("Show sidebar")),
        )
        .child(by("Name"))
        .child(by("Date modified"))
}
```

```tsx tabs
import { Text, View, signal } from "nsh";
import { Menu, MenuItem } from "nsh/base";

// The indicator part shows the mark while the item is checked.
const part = "w-4 opacity-0 transition-opacity checked:opacity-100";

function ViewMenu() {
  const sidebar = signal(true);
  const sort = signal("Name");
  return (
    <Menu popupClass="min-w-48 rounded-lg bg-white p-1 shadow-lg" trigger={<View class="px-3 py-2"><Text>View</Text></View>}>
      <MenuItem
        checked={sidebar()}
        closeOnSelect={false}
        indicatorClass={part}
        indicator={<Text>✓</Text>}
        onSelect={() => sidebar.set(!sidebar())}
        class="flex-row gap-2 rounded-md px-3 py-2 hover:bg-gray-100"
      >
        <Text>Show sidebar</Text>
      </MenuItem>
      <Each of={["Name", "Date modified", "Size"]}>
        {(by) => (
          <MenuItem
            role="menuitemradio"
            checked={sort() === by()}
            indicatorClass={part}
            indicator={<Text>✓</Text>}
            onSelect={() => sort.set(by())}
            class="flex-row gap-2 rounded-md px-3 py-2 hover:bg-gray-100 checked:font-semibold"
          >
            <Text>{by()}</Text>
          </MenuItem>
        )}
      </Each>
    </Menu>
  );
}
```

Отметка на конце строки помещается в содержимое и стилизуется классами `group-checked:` под `group` на пункте.

<a id="entrance-and-exit"></a>

## Появление и исчезновение

На десктопах всплывающее окно появляется и исчезает с вашими переходами, как у [Popover](./popover.md#entrance-and-exit): `popupStartingClass` — его вид в первом кадре, `popupEndingClass` — его вид после закрытия, который сохраняется, пока выполняются классы `transition-*` из `popupClass`, а затем следует `onClose`. Подменю принимают те же виды и закрываются вместе со своим меню. Панель на телефонах выезжает и уезжает сама.

```tsx
<Menu
  popupClass="min-w-40 rounded-lg bg-white p-1 shadow-lg transition-all duration-100"
  popupStartingClass="opacity-0 -translate-y-1"
  popupEndingClass="opacity-0"
  trigger={<Text>File</Text>}
>
  <MenuItem onSelect={newFile}><Text>New</Text></MenuItem>
</Menu>
```

<a id="open-state"></a>

## Состояние открытия

Без `open` меню хранит собственное состояние (начиная с `defaultOpen` для `Menu`). С `open` состоянием владеет приложение и меняет его в `onOpenChange({ open, reason })`: `"triggerPress"`, `"select"`, `"pressOutside"`, `"backdropPress"`, `"cancel"`, `"contextMenu"` или `"longPress"`.

<a id="props"></a>

## Свойства

<a id="menu-1"></a>

### Menu

| Свойство | Rust | Тип | По умолчанию | Описание |
|---|---|---|---|---|
| `open` | `.open(..)` | `boolean` | нет | Открыто, управляется приложением. |
| `defaultOpen` | `.default_open(..)` | `boolean` | `false` | Открыто изначально, без `open`. |
| `placement` | `.placement(..)` | `"top" \| "bottom" \| "left" \| "right"` | `"bottom"` | Десктопы: сторона триггера, на которой оно располагается. |
| `align` | `.align(..)` | `"start" \| "center" \| "end"` | `"start"` | Десктопы: как оно выравнивается относительно триггера. |
| `offset` | `.offset(..)` | `number` | `0` | Десктопы: зазор между триггером и всплывающим окном. |
| `margin` | `.margin(..)` | `number` | `0` | Десктопы: расстояние, которое оно выдерживает от краёв безопасной области. |
| `popupClass`, `popupStyle` | `.popup_class(..)`, `.popup_style(..)` | `string`, `StyleProp<ViewStyle>` | нет | Всплывающее окно (десктопы) или панель (телефоны), а также всплывающие окна подменю. |
| `popupStartingClass`, `popupStartingStyle` | `.popup_starting_class(..)`, `.popup_starting_style(..)` | `string`, `StyleProp<ViewStyle>` | нет | Десктопы: вид всплывающих окон в первом кадре, поверх их собственного. |
| `popupEndingClass`, `popupEndingStyle` | `.popup_ending_class(..)`, `.popup_ending_style(..)` | `string`, `StyleProp<ViewStyle>` | нет | Десктопы: вид всплывающих окон после закрытия, сохраняемый, пока выполняются их переходы. |
| `backdropClass`, `backdropStyle` | `.backdrop_class(..)`, `.backdrop_style(..)` | `string`, `StyleProp<ViewStyle>` | нет | Телефоны: подложка за панелью. |
| `trigger` | `.trigger(..)` | `JSX.Element` | нет | То, что открывает меню при нажатии. Пока меню открыто, действуют его классы `aria-expanded:` и `expandedStyle`. |
| `children` | `.child(..)` | `JSX.Element` | нет | Пункты, создаваемые при каждом открытии. |

### ContextMenu

`open`, `popupClass` / `popupStyle`, начальный и конечный виды, `backdropClass` / `backdropStyle`, `trigger` и `children` — как у `Menu`, а также:

| Свойство | Rust | Тип | По умолчанию | Описание |
|---|---|---|---|---|
| `disabled` | `.disabled(..)` | `boolean` | `false` | Вторичная кнопка и удерживаемые пальцы ничего не делают. |
| `offset` | `.offset(..)` | `number` | `0` | Десктопы: зазор между указателем и всплывающим окном. |
| `margin` | `.margin(..)` | `number` | `0` | Десктопы: расстояние, которое оно выдерживает от краёв безопасной области. |

### MenuItem

| Свойство | Rust | Тип | По умолчанию | Описание |
|---|---|---|---|---|
| `disabled` | `.disabled(..)` | `boolean` | `false` | Не может быть выбран; применяются стили `disabled:`. |
| `checked` | `.checked(..)` | `boolean` | нет | Отмечен или нет; делает пункт отмечаемым; значением владеет приложение. |
| `checkedStyle` | `.checked_style(..)` | `StyleProp<ViewStyle>` | нет | Его стиль в отмеченном состоянии, в виде классов `checked:`. |
| `role` | `.role(..)` | `AccessibilityRole` | `"menuitemcheckbox"` с `checked`, иначе `"menuitem"` | Чем он является для программ чтения с экрана; `"menuitemradio"` для одного выбора из группы. |
| `indicatorClass`, `indicatorStyle` | `.indicator_class(..)`, `.indicator_style(..)` | `string`, `StyleProp<ViewStyle>` | нет | Индикатор, часть перед содержимым; его классы `checked:` и `disabled:` следуют за пунктом. |
| `indicator` | `.indicator(..)` | `JSX.Element` | нет | Отметка внутри индикатора. |
| `closeOnSelect` | `.close_on_select(..)` | `boolean` | `true` | Выбор пункта закрывает меню. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | нет | Что произносят программы чтения с экрана, если содержимого недостаточно. |
| `children`, `class`, `style` | `.child(..)`, методы стиля | | нет | Его содержимое и вид, с состояниями `hover:`, `active:` и `checked:`. |

### Submenu

| Свойство | Rust | Тип | По умолчанию | Описание |
|---|---|---|---|---|
| `trigger` | `.trigger(..)` | `JSX.Element` | нет | Пункт, который его открывает. |
| `back` | `.back(..)` | `JSX.Element` | нет | Телефоны: строка над его пунктами, возвращающая к окружающим пунктам. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Оно не открывается. |
| `offset` | `.offset(..)` | `number` | `0` | Десктопы: зазор между окружающим меню и его всплывающим окном. |
| `children` | `.child(..)` | `JSX.Element` | нет | Его пункты. |

`MenuSeparator` — это view, которое вы стилизуете (`class`, `style`), он показывается вместе с пунктами своего уровня.

<a id="events"></a>

## События

| Событие | Rust | Описание |
|---|---|---|
| `onOpenChange` (`Menu`, `ContextMenu`) | `.on_open_change(\|e\| ..)` | Меню открылось или закрылось, с указанием причины. |
| `onOpen` (`Menu`, `ContextMenu`) | `.on_open(\|\| ..)` | Меню показано; в виде панели — после того, как она въехала. |
| `onClose` (`Menu`, `ContextMenu`) | `.on_close(\|\| ..)` | Меню исчезло: в виде панели — после того, как она уехала, в виде всплывающего окна — после его выхода. Также когда его закрыло приложение. |
| `onPosition` (`Menu`, `ContextMenu`) | `.on_position(\|e\| ..)` | Десктопы: всплывающее окно размещено: `placement` (сторона, на которой оно расположилось), `bounds`, `available`. |
| `onCancel` (`Menu`, `ContextMenu`) | `.on_cancel(\|\| ..)` | Пользователь попытался закрыть меню, не сделав выбор (Escape или «Назад», нажатие снаружи или на подложке). |
| `onSelect` (`MenuItem`) | `.on_select(\|\| ..)` | Пункт выбран; отмечаемый пункт запрашивает своё другое значение. |

<a id="accessibility"></a>

## Доступность

Для программ чтения с экрана всплывающее окно или панель — это меню, а его пункты — пункты меню; триггер сообщает, развёрнуто ли меню. Отмечаемый пункт — это пункт меню типа checkbox или radio, который читается как отмеченный или не отмеченный; его индикатор является частью пункта. В TSX триггер — это переданный вами элемент, `Button` или ваш собственный view: он сам принимает нажатия и состояние раскрытия, поэтому его собственные классы `active:` и `activeStyle` действуют, пока он нажат, и его собственный `onPress` тоже выполняется. На экране находятся только пункты показанного уровня, поэтому программы чтения с экрана читают то, что там есть.
