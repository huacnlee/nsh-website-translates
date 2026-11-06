---
title: "nsh/desktop"
description: "API только для настольных платформ: окно (заголовок, строка заголовка, разворачивание, полноэкранный режим), собственная строка заголовка приложения с перетаскиваемыми областями, меню приложения, контекстные меню и сочетания клавиш."
order: 12.5
source_hash: 460c34aa14353d38
---

# nsh/desktop

`nsh/desktop` содержит то, что есть только на десктопах: окно и его заголовок, меню приложения и контекстные меню. Работает на macOS, Windows и Linux. Код на Rust находит то же самое в `nsh_core::element::desktop`: функции окна (`set_title`, `set_title_bar`, `title_bar`, `minimize`, … `close_window`), меню приложения и контекстные меню (`set_application_menu`, `popup_menu`, составляются из `MenuItem`) и помечает перетаскиваемые представления через `.window_drag(true)`; TSX импортирует `nsh/desktop`. Модуль можно импортировать на любой платформе, поэтому один бандл работает везде: на iOS и Android его функции ничего не делают, а `isAvailable` сообщает, есть ли в нём окно и меню.

```rust tabs
use nsh_core::{
    desktop::{MenuRole, TitleBarStyle},
    element::desktop::{
        MenuItem, close_window, popup_menu, set_application_menu, set_title, set_title_bar, title_bar,
    },
    prelude::*,
};
```

```tsx tabs
import { isAvailable, Menu, titleBar, Window } from "nsh/desktop";
```

## isAvailable

```ts
const isAvailable: boolean;
```

`true` там, где работают API окна и меню этого модуля: macOS, Windows и Linux; `false` в остальных случаях. Rust: `os().is_desktop()`.

[`platform.desktop`](./nsh.md#platform) — более широкая проверка десктопного поведения (props `desktop={{…}}`, `platform.select({ desktop })`): она также истинна в браузерах в десктопной идиоме, которые работают в собственном окне браузера. Десктопную раскладку, плотность и ввод привязывайте к `platform.desktop`, а вызовы `Window` и `Menu` — к `isAvailable`.

<a id="window"></a>

## Окно

```ts
const Window: {
  setTitle(title: string): void;
  setTitleBar(options: { style: "default" | "hidden"; height?: number }): void;
  setMenuBar(mode: "shown" | "autoHide"): void;
  minimize(): void;
  toggleMaximize(): void;
  toggleFullScreen(): void;
  setFrame(frame: {
    origin?: Partial<Point>;
    size?: Partial<Size>;
    animated?: boolean;
  }): void;
  setLevel(level: "normal" | "floating" | "desktopIcon"): void;
  orderFront(): void;
  close(): void;
};
```

Столбец Rust содержит имена функций `nsh_core::element::desktop`.

| Член | Rust | Описание |
|---|---|---|
| `setTitle(title)` | `set_title(title)` | Заголовок окна: строка заголовка, панель задач или Dock, переключатель окон. |
| `setTitleBar({ style, height? })` | `set_title_bar(TitleBarStyle::Hidden, Some(px(height)))` | `style: "hidden"` убирает системный заголовок: приложение занимает окно до самого верхнего края и рисует собственный заголовок. Системные элементы управления окном остаются (traffic lights в macOS, кнопки свернуть / развернуть / закрыть в Windows, оконные кнопки GTK). `height` — высота вашей панели в пунктах: элементы управления центрируются в ней (кнопки заголовка Windows заполняют её целиком; в macOS `height` выбирает компактное оформление до 44 пунктов и обычное выше; размеры панели задавайте по фактической высоте из `titleBar().height`, а AppKit размещает traffic lights во время изменения размера в реальном времени. Существующая панель инструментов приложения-хоста сохраняет свой стиль и высоту); без него они принимают высоту платформы. `style: "default"` возвращает системный заголовок (Rust: `set_title_bar(TitleBarStyle::Default, None)`). |
| `setMenuBar(mode)` | `set_menu_bar_visibility(mode)` | В Windows и Linux в приложениях GPUI, где окно рисует меню приложения в виде панели над приложением: `"shown"` (по умолчанию) показывает её всегда; `"autoHide"` показывает её после того, как Alt нажат и отпущен отдельно, пока повторное нажатие одного Alt снова не скроет её, как в приложениях Windows и GNOME. F10 и Alt с начальной буквой меню в любом случае открывают меню, а панель видна, пока оно открыто. Строка меню macOS — системная. |
| `minimize()` | `minimize()` | Сворачивает окно. |
| `toggleMaximize()` | `toggle_maximize()` | Разворачивает окно или восстанавливает его, если оно развёрнуто. |
| `toggleFullScreen()` | `toggle_full_screen()` | Включает или выключает полноэкранный режим. |
| `setFrame(frame)` | `set_frame(WindowFrame { .. })` | Перемещает окно и задаёт его размер в пунктах; пропущенные поля сохраняют значения. В macOS и Windows `size` (`width`, `height`) включает оформление окна; в Linux задаёт размер окна GTK по умолчанию. `origin` (`x`, `y`) — верхний левый угол окна, отсчитываемый от верхнего левого угла основного экрана (в macOS — того, где строка меню), при этом `y` растёт вниз, одинаково на всех платформах; `height` без `y` оставляет верхний край на месте, поэтому окно растёт и уменьшается от нижнего края. `animated: true` включает анимацию изменения размера macOS (по умолчанию: false). |
| `setLevel(level)` | `set_level(level)` | В macOS и Windows `"floating"` удерживает окно поверх обычных окон, а `"normal"` возвращает обычный уровень. `"desktopIcon"` выбирает уровень значков рабочего стола macOS (окно также присутствует на каждом пространстве, вне Mission Control и Cmd+`); в Windows перемещает окно в самый низ текущего z-порядка, откуда последующая активация может его поднять. |
| `orderFront()` | `order_front()` | Выводит окно на передний план своего уровня и передаёт ему фокус (приложение активируется; macOS разворачивает окно из Dock, Windows восстанавливает свёрнутые окна и делает их активными, GTK вызывает present). Окно сохраняет свой уровень. В macOS поверхности уровня рабочего стола остаются позади других окон. GPUI активирует своё окно; запросы на передний план в Linux контролирует оконный менеджер. |
| `close()` | `close_window()` | Закрывает окно; приложение завершается вместе с ним. |

Изменение размера окна поддерживается в macOS, Windows и Linux; позиционирование и уровни — в macOS и Windows. Размещением и порядком окон в Linux управляет оконный менеджер. В приложениях GPUI `setFrame` задаёт размер окна, а платформа размещает его; хост GPUI выбирает позицию и уровень при открытии окна.

Если вы задаёте размер окна по содержимому, измеренному с помощью `onLayout`, оставляйте место для оформления окна в macOS и Windows. `width` и `height` принимают положительные конечные числа; `x` и `y` — конечные числа. Недопустимые поля сохраняют прежние значения.

<a id="a-title-bar-of-your-own"></a>

## Собственный заголовок окна

Когда системный заголовок скрыт, приложение рисует собственную панель и указывает, какие её части перемещают окно, с помощью `.window_drag(true)` в Rust и `desktop={{ windowDrag: true }}` в TSX:

```rust tabs
use nsh_core::{
    desktop::TitleBarStyle,
    element::{desktop::{set_title_bar, title_bar}}, prelude::*,
};

#[component]
fn TitleBar() -> impl IntoElement {
    set_title_bar(TitleBarStyle::Hidden, Some(px(40.0))); // a bar 40 points tall
    view()
        .window_drag(true)
        .h(move || match title_bar().top {
            top if top > px(0.0) => top,
            _ => px(40.0),
        })
        .pl(move || title_bar().left + px(8.0)) // macOS's traffic lights
        .pr(move || title_bar().right + px(8.0)) // the caption buttons on Windows, GTK's buttons
        .flex_row()
        .items_center()
        .child(text("My App"))
        .child(view().flex_1())
        .child(input().placeholder("Search").w(px(180.0)))
}
```

```tsx tabs
import { Text, View } from "nsh";
import { Input } from "nsh/base";
import { titleBar, Window } from "nsh/desktop";

Window.setTitleBar({ style: "hidden", height: 40 }); // a bar 40 points tall

function TitleBar() {
  return (
    <View
      desktop={{ windowDrag: true }}
      style={{
        height: titleBar().height || 40,
        paddingLeft: titleBar().left + 8, // macOS's traffic lights
        paddingRight: titleBar().right + 8, // the caption buttons on Windows, GTK's buttons
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <Text>My App</Text>
      <View style={{ flex: 1 }} />
      <Input placeholder="Search" style={{ width: 180 }} />
    </View>
  );
}
```

Нажатие на представление с `windowDrag` перетаскивает окно так же, как это делал бы системный заголовок: двойной щелчок разворачивает его (или делает то, что выбрал пользователь: в macOS — настройка «Двойной щелчок по строке заголовка окна»), а в Windows и Linux щелчок правой кнопкой открывает меню окна.

- Решает ближайшее представление, задающее `windowDrag`: `.window_drag(false)` (`desktop={{ windowDrag: false }}`) оставляет часть перетаскиваемого представления кликабельной.
- Текстовые поля и представления с обработчиками нажатия или касания (`onPress`, `onTouch*`, responders) внутри перетаскиваемого представления остаются кликабельными без него: поле поиска и любые кнопки в примере выше работают как обычно.
- `windowDrag` работает и с системным заголовком: боковая панель или панель инструментов тоже могут перемещать окно.

### titleBar

```ts
const titleBar: Accessor<{ height: number; left: number; right: number }>;
```

Область скрытого заголовка в пунктах (реактивная): его `height` и ширина, которую занимают системные элементы управления окном на его `left` и `right` концах. Располагайте свою панель с учётом этих значений, чтобы ничто не оказывалось под элементами управления. Все три равны 0, пока система показывает свой заголовок (а также в полноэкранном режиме и вне десктопов). Rust: `title_bar() -> Edges<Points>`, где `top` — высота, а `left` и `right` — ширина элементов управления; чтение подписывает на изменения.

| | `height` | `left` | `right` |
|---|---|---|---|
| macOS | `height`, иначе высота заголовка (28 или 32, в зависимости от версии macOS) | Ширина traffic lights | 0 |
| Windows | `height`, иначе 32 | 0 | Три кнопки заголовка (138) |
| Linux | `height`, иначе высота header bar | Оконные кнопки в начале (раскладка кнопок рабочего стола) | Оконные кнопки в конце |

В Windows кнопки заголовка рисует NSH в стиле Windows 11, и они следуют оформлению приложения; при наведении на кнопку развёртывания показываются макеты привязки (snap layouts) Windows 11. Окно сохраняет границы изменения размера, тень и скруглённые углы на всех платформах.

<a id="menu"></a>

## Меню

```ts
const Menu: {
  setApplicationMenu(items: MenuItem[] | null): void;
  popup(items: MenuItem[], at?: Point): Promise<void>;
};
```

| Член | Описание |
|---|---|
| `setApplicationMenu(items)` | Задаёт меню приложения: одно подменю на каждый элемент верхнего уровня (`File`, `Edit`, ...). В macOS это строка меню, первое меню которой — меню приложения (AppKit называет его именем приложения). В Windows и Linux это строка меню окна, которая не показывается, пока заголовок скрыт; её сочетания клавиш продолжают работать, а собственный заголовок приложения может открывать её меню через `Menu.popup`. `null` восстанавливает меню платформы по умолчанию. |
| `popup(items, at?)` | Показывает контекстное меню с верхним левым углом в `at` (координаты окна в пунктах: `e.pagePosition` у `onContextMenu`) или у указателя. Promise разрешается, когда меню закрывается, выбран элемент или нет: нажатая кнопка, открывшая меню, может оставаться нажатой до этого момента. |

В Rust `set_application_menu(items)` принимает `Vec<MenuItem>` (`None` восстанавливает меню платформы по умолчанию), а `popup_menu(items)` (у указателя) и `popup_menu_at(items, at)` возвращают `Answer<()>`, который завершается, когда меню закрывается (ожидать его необязательно). Обработчик элемента выполняется под владельцем, установившим меню, пока этот владелец жив.

Вызовите `setApplicationMenu` снова, чтобы изменить меню. Внутри `effect` меню следует за читаемыми сигналами: галочка или отключённое состояние, зависящие от состояния приложения, остаются актуальными.

<a id="menu-items"></a>

### Элементы меню

```ts
type MenuItem =
  | { type: "separator" }
  | {
      label?: string;
      role?: MenuRole;
      shortcut?: string;
      when?: "always" | "auto" | "notEditing";
      disabled?: boolean;
      checked?: boolean;
      onSelect?: () => void;
      submenu?: MenuItem[];
    };
```

| Поле | Описание |
|---|---|
| `label` | Что показывает элемент. У элемента роли без него есть собственная подпись. |
| `onSelect` | Вызывается при выборе элемента — щелчком или его сочетанием клавиш. |
| `shortcut` | Сочетание клавиш: модификаторы и одна клавиша, соединённые `+`, например `"mod+n"`, `"mod+shift+z"`, `"alt+f4"` или `"f11"`. Модификаторы перечислены в таблице ниже. Клавиши — буквы, цифры и знаки препинания, записываемые символом, который клавиша вводит на американской раскладке без Shift (`,`, `/`; `"shift+/"` для `?`), или именем: `plus` (клавиша `=` / `+`, также `=`), `minus` (также `-`), `space`, `enter` (`return`), `escape` (`esc`), `tab`, `backspace`, `delete` (`del`), `insert`, стрелки `up`, `down`, `left`, `right` (`arrowup`, …), `home`, `end`, `pageup`, `pagedown`, `f1`–`f24`. Регистр не важен (`"Mod+Shift+N"` — это `"mod+shift+n"`; заглавная буква — та же клавиша, а не Shift), рекомендуется нижний регистр. Недопустимое сочетание (`"mod-n"`, `"mod++"`, `"mod+?"`) выбрасывает ошибку с правильным написанием. `keymap` принимает те же нажатия. Меню показывают сочетание в стиле платформы (`⇧⌘N` в macOS, `Ctrl+Shift+N` в Windows). |
| `when` | Что происходит, когда сочетание выбирает элемент, пока фокус клавиатуры находится в текстовом поле, в бэкенде GPUI: `"always"` (по умолчанию), `"auto"` (если поле само не использует эту клавишу: клавиши, которые вводят текст, перемещают каретку или удаляют, и сочетания редактирования, как у привязок [`keymap`](./nsh.md#keymap)) или `"notEditing"`. Клавиша, которую элемент оставляет, уходит в поле. |
| `disabled` | `true` делает элемент серым (по умолчанию `false`). |
| `checked` | Задайте (`true` или `false`) для элемента с галочкой. |
| `submenu` | Превращает элемент в подменю (нужен `label`). |
| `role` | Стандартный элемент, который выполняет платформа (ниже). |

Элементы `null`, `undefined` и `false` опускаются, поэтому `cond && { … }` работает в списке.

В Rust элемент — это `MenuItem::new(label)`, `MenuItem::role(role)`, `MenuItem::separator()` или `MenuItem::submenu(label, items)`, а поля — методы: `.shortcut("mod+n")` (паникует при недопустимом сочетании, с правильным написанием), `.shortcut_when(When::Auto)`, `.disabled(true)`, `.checked(on)`, `.on_select(f)` и `.label(..)` для элемента роли.

Модификаторы:

| Модификатор | macOS | Windows | Linux |
|---|---|---|---|
| `mod` (также `cmdorctrl`) | Command (⌘) | Ctrl | Ctrl |
| `cmd` (также `command`, `meta`, `super`, `win`) | Command (⌘) | Клавиша Windows | Super |
| `ctrl` (также `control`) | Control (⌃) | Ctrl | Ctrl |
| `alt` (также `option`, `opt`) | Option (⌥) | Alt | Alt |
| `shift` | Shift (⇧) | Shift | Shift |

Используйте `mod` для собственных сочетаний приложения: это клавиша, которую приложения каждой платформы используют для них (⌘N в macOS, Ctrl+N в Windows и Linux), поэтому одна запись подходит везде. Клавиша Windows и Super в основном принадлежат системе (Win+E, обзор GNOME), поэтому `cmd` редко уместен вне macOS.

Роли:

| Роль | Действие | Платформы |
|---|---|---|
| `about`, `hide`, `hideOthers`, `showAll` | Стандартные элементы меню приложения | macOS (в остальных опускаются) |
| `quit` | Завершает приложение | Все |
| `undo`, `redo`, `cut`, `copy`, `paste`, `selectAll` | Редактируют текстовое поле в фокусе (его собственные сочетания остаются за ним) | Все |
| `minimize`, `zoom`, `toggleFullScreen`, `close` | Окно | Все |

У элемента роли есть подпись и сочетание клавиш платформы, если он не задаёт собственные (macOS добавляет имя приложения к `about`, `hide` и `quit`).

Сочетания клавиш меню имеют приоритет, как в нативных приложениях: клавиша, занятая элементом, никогда не доходит до текстового поля в фокусе или до собственных клавиш NSH. Раньше них срабатывает только привязка [`keymap`](./nsh.md#keymap) с тем же нажатием. Поэтому сочетания редактирования (`mod+c`, `mod+v`, `mod+x`, `mod+a`, `mod+z`) давайте только ролям редактирования, которые передают их текстовому полю, и избегайте клавиш без модификатора (`escape`, стрелки, буквы), которые отняли бы их у текстовых полей и у навигации назад. В бэкенде GPUI `when: "auto"` позволяет элементу делить клавишу с текстовыми полями: `delete` или `mod+z` выбирают элемент, пока ни одно поле не в фокусе, и редактируют текст, пока одно в фокусе.

В бэкенде GPUI нативный компонент с фокусом клавиатуры видит каждую клавишу первым. Клавиша, которую он обрабатывает сам, никогда не доходит до keymap или меню. Клавиша, которую он пропускает, попадает в keymap так, как если бы в фокусе было текстовое поле, а затем в меню.

```rust tabs
use nsh_core::{
    desktop::MenuRole,
    element::desktop::{MenuItem, set_application_menu},
    platform::Os,
    prelude::*,
};

#[component]
fn AppMenu() -> impl IntoElement {
    let mac = os() == Os::MacOs;
    let wrap = signal(true);
    effect(move || {
        let mut menus = Vec::new();
        if mac {
            menus.push(MenuItem::submenu("My App", [
                MenuItem::role(MenuRole::About),
                MenuItem::separator(),
                MenuItem::role(MenuRole::Hide),
                MenuItem::role(MenuRole::HideOthers),
                MenuItem::separator(),
                MenuItem::role(MenuRole::Quit),
            ]));
        }
        let mut file = vec![
            MenuItem::new("New").shortcut("mod+n").on_select(create_document),
            MenuItem::new("Open…").shortcut("mod+o").on_select(open_document),
        ];
        if !mac {
            file.push(MenuItem::separator());
            file.push(MenuItem::role(MenuRole::Quit).label("Exit"));
        }
        menus.push(MenuItem::submenu("File", file));
        menus.push(MenuItem::submenu("Edit", [
            MenuItem::role(MenuRole::Undo),
            MenuItem::role(MenuRole::Redo),
            MenuItem::separator(),
            MenuItem::role(MenuRole::Cut),
            MenuItem::role(MenuRole::Copy),
            MenuItem::role(MenuRole::Paste),
        ]));
        menus.push(MenuItem::submenu("View", [
            MenuItem::new("Word Wrap")
                .checked(wrap.get())
                .on_select(move || wrap.update(|w| *w = !*w)),
            MenuItem::role(MenuRole::ToggleFullScreen),
        ]));
        set_application_menu(menus);
    });
    view()
}
```

```tsx tabs
import { effect, signal } from "nsh";
import { platform } from "nsh";
import { Menu } from "nsh/desktop";

const mac = platform.os === "macos";
const wrap = signal(true);

effect(() => {
  Menu.setApplicationMenu([
    mac && {
      label: "My App",
      submenu: [{ role: "about" }, { type: "separator" }, { role: "hide" }, { role: "hideOthers" }, { type: "separator" }, { role: "quit" }],
    },
    {
      label: "File",
      submenu: [
        { label: "New", shortcut: "mod+n", onSelect: () => createDocument() },
        { label: "Open…", shortcut: "mod+o", onSelect: () => openDocument() },
        !mac && { type: "separator" },
        !mac && { role: "quit", label: "Exit" },
      ],
    },
    {
      label: "Edit",
      submenu: [{ role: "undo" }, { role: "redo" }, { type: "separator" }, { role: "cut" }, { role: "copy" }, { role: "paste" }],
    },
    {
      label: "View",
      submenu: [
        { label: "Word Wrap", checked: wrap(), onSelect: () => wrap.update((w) => !w) },
        { role: "toggleFullScreen" },
      ],
    },
  ]);
});
```

Контекстное меню по нажатию кнопки:

```rust tabs
text("More").on_press(|| {
    let _ = popup_menu(vec![
        MenuItem::new("Rename").on_select(rename),
        MenuItem::new("Duplicate").on_select(duplicate),
        MenuItem::separator(),
        MenuItem::new("Delete").on_select(remove),
    ]);
})
```

```tsx tabs
<View
  onPress={() =>
    Menu.popup([
      { label: "Rename", onSelect: rename },
      { label: "Duplicate", onSelect: duplicate },
      { type: "separator" },
      { label: "Delete", onSelect: remove },
    ])
  }
>
  <Text>More</Text>
</View>
```

> [!NOTE]
> Меню системные (NSMenu, меню Win32, всплывающие меню GTK): они выглядят и ведут себя как в любых других приложениях, следуют оформлению системы (или приложения) и доступны с клавиатуры. `examples/desktop` — приложение с собственным заголовком, меню приложения и контекстными меню.
