---
title: "nsh/mobile"
description: "Возможности iOS и Android: TabBar, системная панель вкладок, InputAccessoryView на iOS, BackHandler на Android и isAvailable."
order: 12.2
source_hash: 53d6d77de0d6e9ca
---

# nsh/mobile

`nsh/mobile` содержит возможности, специфичные для iOS и Android: системную панель вкладок, `TabBar`, на обеих платформах; [`InputAccessoryView`](#inputaccessoryview), панель над клавиатурой, на iOS; и [`BackHandler`](#backhandler), кнопку «назад», на Android. Rust-код использует `nsh_core::mobile` и `nsh_core::prelude`; TSX импортирует `nsh/mobile`. Модуль можно импортировать на любой платформе, поэтому один бандл работает везде: на других платформах его компоненты не занимают места, а вызовы сразу возвращаются, и `isAvailable` сообщает, iOS это или Android (`platform.os` из `nsh` показывает, какая именно). То, что есть на десктопах, описано в [nsh/desktop](./nsh-desktop.md).

```rust tabs
use nsh_core::mobile::{TabBarItem, tab_bar};
```

```tsx tabs
import { BackHandler, InputAccessoryView, isAvailable, TabBar } from "nsh/mobile";
import type { TabBarItem, TabBarProps } from "nsh/mobile";
```

<a id="scope"></a>

## Область применения

Этот модуль предоставляет возможности, специфичные для мобильных платформ, например системную панель вкладок для навигации верхнего уровня в приложении. Общие элементы управления относятся к [`nsh/base`](./nsh-base.md): его [Switch](../elements/switch.md), например, имеет одинаковое поведение и API на телефонах, десктопах и в вебе, а дорожку, ползунок и стили состояний задаёт приложение. `TabBar` служит для навигации в мобильных приложениях; `Tabs` — для вкладок с контентом на всех платформах. Здесь находятся только возможности со специфичной для мобильных платформ семантикой взаимодействия. Системный внешний вид, размер или анимация сами по себе не меняют общую роль общего элемента управления. Это различие определяет, какие возможности относятся сюда ([Цели и принципы проектирования](../docs/goals.md)).

## isAvailable

```ts
const isAvailable: boolean;
```

`true` на iOS, в симуляторе iOS, Mac Catalyst и Android; `false` в остальных случаях. Rust: `matches!(os(), Os::Ios | Os::Android)`.

## TabBar

Панель вкладок переключает между разделами верхнего уровня приложения: записи и статистика, входящие и настройки. `TabBar` — это собственная панель системы, поэтому она выглядит и ведёт себя как в системных приложениях: `UITabBar` на iOS и iPadOS (Liquid Glass и его выделение на iOS 26), navigation bar из Material 3 на Android, в системных цветах, светлых и тёмных. Приложение задаёт вкладки (`items`), указывает, какая выбрана (`selectedIndex`), получает выбор пользователя (`onChange`), размещает панель с помощью `class` и `style` и само показывает содержимое выбранного раздела. Для вкладок внутри страницы и на любой платформе используйте [Tabs](../elements/tabs.md) из `nsh/base`.

```rust tabs
use nsh_core::{
    mobile::{TabBarItem, tab_bar},
    prelude::*,
};

fn sections() -> impl IntoElement {
    let section = signal(0u32);
    view()
        .flex_1()
        .child(text(move || match section.get() {
            0 => "Records",
            _ => "Stats",
        }))
        .child(
            tab_bar()
                .items(vec![
                    TabBarItem::new("Records").icon("list.bullet"),
                    TabBarItem::new("Stats").icon("chart.bar"),
                ])
                .selected_index(section)
                .on_change(move |index: &u32| section.set(*index))
                .absolute()
                .left_0()
                .right_0()
                .bottom_0(),
        )
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { TabBar } from "nsh/mobile";
import { platform } from "nsh";

function App() {
  const section = signal(0);
  return (
    <View class="flex-1">
      <Text>{section() === 0 ? "Records" : "Stats"}</Text>
      <TabBar
        items={[
          { title: "Records", icon: platform.select({ ios: "list.bullet", android: "ic_records" }) },
          { title: "Stats", icon: platform.select({ ios: "chart.bar", android: "ic_stats" }) },
        ]}
        selectedIndex={section()}
        onChange={({ index }) => section.set(index)}
        class="absolute inset-x-0 bottom-0"
      />
    </View>
  );
}

mount(App);
```

`TabBar` берётся из `nsh/mobile`, в Rust — `nsh_core::mobile`. Выбор принадлежит приложению: нажатие сообщает `onChange` с индексом вкладки (`{ index }`), панель сразу показывает выбор, как и системная, а приложение показывает соответствующий раздел и передаёт индекс обратно как `selectedIndex`. Высота — системная, если стиль её не задаёт. В Rust `tab_bar()` создаёт панель с сеттером для каждого свойства (`.items(..)`, `.selected_index(..)`), слушателем для каждого события (`.on_change(..)`) и типизированными методами стиля; `TabBarItem::new(title).icon(name)` создаёт вкладку.

<a id="props"></a>

### Свойства

| Свойство | Rust | Тип | По умолчанию | Описание |
|---|---|---|---|---|
| `items` | `.items(..)` | `TabBarItem[]` | `[]` | Вкладки по порядку. |
| `selectedIndex` | `.selected_index(..)` | `number` | `0` | Выбранная вкладка по индексу; индекс за пределами списка вкладок не выбирает ни одну. |
| `hidden` | `.hidden(..)` | `boolean` | `false` | iOS: скрывает панель без перехода. Приложение владеет этим значением при push и pop. Панель показывается, когда и это свойство, и запрос `hidesBottomBarWhenPushed` видимого стека равны false. |
| `class`, `style` | методы стиля | `string`, `StyleProp<ViewStyle>` | нет | Где находится панель: её положение и размер. Внешний вид системный, выбранная вкладка окрашена в `primary` темы. |
| `testID` | `.test_id(..)` | `string` | нет | Находит панель в тестах и `nsh test --trace`. |

#### TabBarItem

| Поле | Rust | Тип | Описание |
|---|---|---|---|
| `title` | `TabBarItem::new(title)` | `string` | Заголовок вкладки, который озвучивают скринридеры. |
| `icon` | `.icon(name)` | `string` | Значок вкладки по имени, принятому на платформе: [SF Symbol](https://developer.apple.com/sf-symbols/) на iOS (`"house"`), drawable приложения на Android (`res/drawable/home.xml` — это `"home"`, а `"android:ic_menu_search"` — системный). `platform.select` выбирает значение для каждой платформы. |

<a id="events"></a>

### События

| Событие | Rust | Описание |
|---|---|---|
| `onChange` | `.on_change(\|index: &u32\| ..)` | Пользователь выбрал вкладку: `{ index }` — её индекс. Панель сразу показывает выбор; приложение показывает содержимое вкладки и задаёт `selectedIndex`. |

<a id="platform-notes"></a>

### Особенности платформ

- **iOS и Mac Catalyst**: `UITabBar` с системным видом для данной версии iOS: плавающая панель Liquid Glass и её выделение на iOS 26. Значки — SF Symbols. `primary` темы становится `tintColor` панели, то есть цветом выбранной вкладки; остальные вкладки сохраняют системный цвет.
- **Android**: navigation bar из Material 3, собранная из системных view платформы: значок в индикаторе активности над каждой подписью, ripple при нажатии, динамические цвета системы на Android 12 и новее и базовые цвета Material на более ранних версиях, светлая или тёмная в соответствии с внешним видом приложения. У нижнего края окна она заходит под панель навигации и становится выше на её inset, как у Material. Значки — drawable приложения (панель их окрашивает). Значок и подпись выбранной вкладки получают `primary` темы поверх индикатора активности того же цвета с непрозрачностью 12%; остальные вкладки сохраняют системный цвет.
- **Десктопы (macOS, Windows, Linux, GPUI) и веб**: разделы показываются через [Tabs](../elements/tabs.md) во внешнем виде приложения. `TabBar` там не занимает места, поэтому одна раскладка подходит для обоих случаев, а выбор делается через `platform.os` ([API устройства `nsh`](./nsh.md#device)).

## InputAccessoryView

На iOS и Mac Catalyst; на Android это пустой скрытый view.

```ts
function InputAccessoryView(props: InputAccessoryViewProps): JSX.Element;

interface InputAccessoryViewProps {
  nativeID: string;
  style?: StyleProp<ViewStyle>;
  class?: string;
  children?: JSX.Element;
}
```

Панель над клавиатурой (`inputAccessoryView` из UIKit), которая показывается, пока в фокусе поле ввода, у которого `ios={{ inputAccessoryViewID }}` совпадает с её `nativeID`. Rust: `input_accessory_view(native_id)`, показывается для полей, у которых совпадает `.input_accessory(native_id)`. Она шириной с окно и высотой с содержимое и перемещается вместе с клавиатурой на нативном уровне.

| Свойство | Тип | Rust | Описание |
|---|---|---|---|
| `nativeID` | `string` | `input_accessory_view(native_id)` | Поля ввода с этим `inputAccessoryViewID` показывают панель. |
| `style` | `StyleProp<ViewStyle>` | методы `Styled` (`.bg(…)`) | Стиль панели (например, фон). |
| `class` | `string` | | Классы Tailwind. |
| `children` | `JSX.Element` | `.child(…)` | Содержимое панели. |

Она ничего не отображает в том месте дерева, где размещена, а на Android не отображает вообще ничего, поэтому её можно разместить рядом с полем ввода, к которому она относится.

```rust tabs
use nsh_core::prelude::*;

#[component]
fn Note() -> impl IntoElement {
    let note = signal(String::new());
    let field = element_ref();
    view()
        .child(
            input()
                .element_ref(&field)
                .value(note)
                .on_change(move |value: &str| note.set(value.to_string()))
                .placeholder("Write a note")
                .input_accessory("note-bar"),
        )
        .child(
            input_accessory_view("note-bar").bg(rgb(0xf1f5f9)).child(
                view()
                    .flex_row()
                    .items_center()
                    .p(px(10.0))
                    .child(
                        text(move || format!("{} characters", note.with(|n| n.chars().count())))
                            .flex_1()
                            .text_color(rgb(0x64748b)),
                    )
                    .child(text("Done").font_weight(FontWeight::SEMIBOLD).on_press(move || field.blur())),
            ),
        )
}
```

```tsx tabs
import { type InputRef, signal, Text, View } from "nsh";
import { Input } from "nsh/base";
import { InputAccessoryView } from "nsh/mobile";

function Note() {
  const text = signal("");
  let input: InputRef | undefined;
  return (
    <View>
      <Input
        ref={(n) => (input = n)}
        value={text()}
        onChange={({ value }) => text.set(value)}
        placeholder="Write a note"
        ios={{ inputAccessoryViewID: "note-bar" }}
      />
      <InputAccessoryView nativeID="note-bar" style={{ backgroundColor: "#f1f5f9" }}>
        <View style={{ flexDirection: "row", alignItems: "center", padding: 10 }}>
          <Text style={{ flex: 1, color: "#64748b" }}>{text().length} characters</Text>
          <Text onPress={() => input?.blur()} style={{ fontWeight: "600" }}>Done</Text>
        </View>
      </InputAccessoryView>
    </View>
  );
}
```

См. также [Формы и клавиатура](../docs/forms-and-keyboard.md).

## BackHandler

На Android; на iOS его слушатели сохраняются, но никогда не вызываются, а `exitApp()` сразу возвращается.

```ts
const BackHandler: {
  on(event: "press", listener: () => boolean | void): () => void;
  exitApp(): void;
};
```

Системная кнопка «назад» и жест возврата. Сначала нажатие обрабатывают диалоги (диалог закрывается); затем выполняются слушатели `BackHandler`, начиная с добавленного последним; если ни один из них не обработал нажатие, верхний стек навигации делает pop, а если возвращаться некуда, приложение закрывается.

| Элемент | Rust | Описание |
|---|---|---|
| `on("press", listener)` | `on_back_press(listener)` | `listener` возвращает `true`, если обработал нажатие. Возвращает функцию, которая прекращает прослушивание; слушатель, добавленный во время рендера компонента (или выполнения эффекта), прекращает работу вместе с ним, как в Rust, так и в TSX. |
| `exitApp()` | слушатель возвращает `false` | Закрывает приложение. Rust-слушатель, возвращающий `false`, пропускает нажатие дальше, так что стек возвращается назад или приложение закрывается. |

```rust tabs
use nsh_base::alert_dialog;
use nsh_core::prelude::*;

#[component]
fn Editor() -> impl IntoElement {
    let dirty = signal(false);
    on_back_press(move || {
        if !dirty.get_untracked() {
            return false; // let the app go back or exit
        }
        spawn(async move {
            let answer = alert_dialog().title("Discard changes?").cancel("keep", "Keep").destructive("discard", "Discard").show().await;
            if answer.is_ok_and(|r| r.action.as_deref() == Some("discard")) {
                dirty.set(false); // the next back press leaves
            }
        });
        true
    });
    // ...
}
```

```tsx tabs
import { signal } from "nsh";
import { BackHandler } from "nsh/mobile";
import { AlertDialog } from "nsh/base";

function Editor() {
  const dirty = signal(false);
  // Stops listening when Editor goes.
  BackHandler.on("press", () => {
    if (!dirty()) return false; // let the app go back or exit
    AlertDialog.show({
      title: "Discard changes?",
      actions: [{ label: "Keep", role: "cancel", id: "keep" }, { label: "Discard", role: "destructive", id: "discard" }],
    }).then(({ action }) => action === "discard" && BackHandler.exitApp());
    return true;
  });
  // ...
}
```

> [!NOTE]
> Слушатель выполняется после того, как система доставила нажатие: главный поток никогда не ждёт код приложения. Пока зарегистрирован хотя бы один слушатель, NSH забирает нажатия, которые оставляют диалоги, и сам возвращается назад в верхнем стеке или закрывает приложение, когда ни один слушатель не возвращает `true`.

Строкой состояния управляет `statusBar` у [страниц и диалогов](./nsh-base.md#status-bar) из `nsh/base`, одинаково на iOS и Android.
