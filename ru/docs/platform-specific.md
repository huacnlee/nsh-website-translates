---
title: "Платформо-специфичный код"
description: "Как написать одно приложение для телефонов, настольных компьютеров и браузеров: свойства только для отдельных платформ в ios={{}} / android={{}} / desktop={{}} / web={{}}, модули nsh/mobile и nsh/desktop, platform.os и platform.select, а также платформенные варианты Tailwind."
order: 17
group: platforms
source_hash: 3943d421295a93f3
---

# Платформенный код

Один бандл NSH работает на iOS, Android, macOS, Windows и Linux (и в Mac Catalyst), а в браузерах — через [веб-рантайм](./web.md). Большей части приложения проверки платформы вообще не нужны: элементы, стили, раскладка и модули ведут себя везде одинаково, и компоненты, которые вы из них собираете, выглядят везде одинаково. Когда что-то действительно специфично для одной платформы, NSH отводит этому чёткое место, чтобы платформенный код оставался заметным и изолированным:

| Rust | TSX | Для чего |
|---|---|---|
| [Builder-методы (`.ripple(..)`, `.input_accessory(..)`)](#platform-only-props) | [`ios={{…}}`, `android={{…}}`, `desktop={{…}}`, `web={{…}}`](#platform-only-props) | Props, которые есть только на одной платформе. |
| [`on_back_press`, `nsh_core::element::desktop`](#platform-modules) | [`nsh/mobile`, `nsh/desktop`](#platform-modules) | API, которые есть только на мобильных платформах или только на десктопах. |
| [`os()`, `idiom()`, `is_desktop()`](#platformos-and-platformselect) | [`platform.os`, `platform.desktop`, `platform.select`](#platformos-and-platformselect) | Выбор значений или кода для каждой платформы. |
| [`.when(os() == Os::Ios, ..)`](#platform-variants-in-tailwind) | [Классы `ios:` / `android:` / `web:`](#platform-variants-in-tailwind) | Стили для каждой платформы. |

<a id="desktop-and-mobile"></a>

## Десктоп и мобильные платформы

Каждая платформа относится либо к десктопным, либо к мобильным, по единому правилу. К десктопным относятся macOS, Windows, Linux и браузеры в десктопной идиоме (мышь и широкое окно, [веб](./web.md)). К мобильным относятся iOS, Android и браузеры в идиоме телефона или планшета; Mac Catalyst использует бэкенд iOS, поэтому тоже считается мобильным, с props `ios={{…}}`. Props `desktop={{…}}`, `platform.select({ desktop, mobile })`, `platform.desktop` и `platform.idiom === "desktop"` подчиняются этому правилу, как и компоненты `nsh/base` (меню — это попап на десктопах и sheet на мобильных платформах) и, в Rust, `is_desktop()`.

`isAvailable` из `nsh/desktop` отвечает на более узкий вопрос: работают ли API окна и меню этого модуля — они работают на macOS, Windows и Linux. Раскладку, плотность и ввод привязывайте к `platform.desktop`, а вызовы `Window` и `Menu` — к `isAvailable`.

<a id="platform-only-props"></a>

## Props, существующие только на одной платформе

В Rust prop, который есть на одной платформе, — это обычный builder-метод (`.ripple(..)`, `.elevation(..)` для Android, `.input_accessory(..)` для iOS, `.window_drag(..)` для десктопов); остальные платформы его пропускают. В TSX props, существующие только на одной платформе, сгруппированы в объект, названный по ней. Каждый элемент принимает `ios`, `android`, `desktop` (macOS, Windows, Linux и браузеры в десктопной идиоме) и `web` (браузеры); на других платформах объект игнорируется, а на своей платформе применяются только его ключи. Десктопный браузер применяет и `desktop`, и `web`.

```rust tabs
use nsh_base::dialog;
use nsh_core::{
    Ripple,
    element::{AutoFill, Orientation}, prelude::*,
};

view()
    .on_press(open)
    .active(|s| s.opacity(0.6))
    .ripple(Ripple {
        color: Some(rgba(0x0000001f).into()),
        ..Ripple::default()
    })
    .elevation(px(4.0))
    .p_4()
    .rounded(px(12.0))
    .bg(white())
    .child(text("Open"))

input().placeholder("Code").auto_fill(AutoFill::OneTimeCode)

when(shown, || {
    dialog()
        .supported_orientations([Orientation::Portrait])
        .status_bar_translucent(true)
        .child(…)
})
```

```tsx tabs
<View
  onPress={open}
  activeStyle={{ opacity: 0.6 }}
  android={{ ripple: { color: "rgba(0,0,0,0.12)" }, elevation: 4 }}
  style={{ padding: 16, borderRadius: 12, backgroundColor: "#ffffff" }}
>
  <Text>Open</Text>
</View>

<Input
  placeholder="Code"
  ios={{ textContentType: "oneTimeCode" }}
/>

<Dialog open={open()} ios={{ supportedOrientations: ["portrait"] }} android={{ statusBarTranslucent: true }}>
  …
</Dialog>
```

Объекты TSX реактивны, как и любой prop; ключ, удалённый из объекта, сбрасывается.

Что есть сегодня:

| Rust | TSX | Где | Описание |
|---|---|---|---|
| `.ripple(Ripple { .. })` | `android={{ ripple }}` | каждый элемент | Material-ripple при нажатии: color, borderless, radius, foreground. |
| `.elevation(..)` | `android={{ elevation }}` | каждый элемент | Material-тень в пунктах, по форме view. |
| | `android={{ accessibilityLiveRegion }}` | каждый элемент | `"none"`, `"polite"` или `"assertive"`: TalkBack озвучивает изменения view. |
| `.status_bar_translucent(..)` | `android={{ statusBarTranslucent }}` | `Dialog` | Содержимое диалога заходит под строку состояния. |
| `.input_accessory(..)` | `ios={{ inputAccessoryViewID }}` | `Input` | `InputAccessoryView`, показываемый над клавиатурой. |
| `.auto_fill(..)` | `ios={{ textContentType }}` | `Input` | Названия типов автозаполнения в iOS (`AutoFill` в Rust охватывает обе платформы). |
| `.supported_orientations(..)` | `ios={{ supportedOrientations }}` | `Dialog` | Допустимые ориентации. |
| `.back_forward_gestures(..)` | `ios={{ allowsBackForwardNavigationGestures }}` | `WebView` | Свайп назад и вперёд по истории страниц. |
| `.header_right_system_item(..)` | `ios={{ headerRightSystemItem }}` | `NavPage` | Собственная bar-кнопка UIKit в конце заголовка; по нажатию вызывается `headerRight`. |
| `.header_left_system_item(..)` | `ios={{ headerLeftSystemItem }}` | `NavPage` | Собственная bar-кнопка UIKit в начале заголовка; по нажатию вызывается `headerLeft`. |
| `.header_right_symbol(..)` | `ios={{ headerRightSymbol }}` | `NavPage` | Собственная bar-кнопка UIKit с SF Symbol в конце заголовка; по нажатию вызывается `headerRight`. |
| `.header_left_symbol(..)` | `ios={{ headerLeftSymbol }}` | `NavPage` | Собственная bar-кнопка UIKit с SF Symbol в начале заголовка; по нажатию вызывается `headerLeft`. |
| `.back_forward_gestures(..)` | `desktop={{ allowsBackForwardNavigationGestures }}` | `WebView` | macOS: свайпы двумя пальцами по трекпаду переходят назад и вперёд по истории страниц; Windows: свайпы по сенсорному экрану; Linux: свайпы по тачпаду. |
| `.window_drag(..)` | `desktop={{ windowDrag }}` | каждый элемент | Нажатие на него перетаскивает окно, как это делала бы системная строка заголовка (см. [nsh/desktop](../modules/nsh-desktop.md#a-title-bar-of-your-own)). |

В TSX `desktop={{…}}` и `web={{…}}` принимаются везде. Типы (`IOSProps`, `AndroidProps`, `DesktopProps` и их формы для отдельных элементов) подсказывают редактору, что принимает каждый элемент.

То, что элемент означает на каждой платформе, — это prop верхнего уровня (в Rust — метод с тем же именем), применяемый там, где он имеет смысл: `title`, `headerStyle`, `headerLargeTitle` и `headerBackTitle` у `NavPage` настраивают системный заголовок iOS и Android, его слот `header` — это заголовок десктопов и веба, а `presentation` у `Dialog` выбирает sheet'ы iOS. `closeOnBackdropPress`, `pagingEnabled`, `refreshing`, `hitSlop` и остальные у `AlertDialog.show` работают на каждой платформе. Собственная системная возможность платформы помещается в её объект, а если она есть на нескольких платформах — в каждый из них под одним и тем же именем: `allowsBackForwardNavigationGestures` у `WebView`, системные свайпы по истории страниц, есть и в `ios={{…}}`, и в `desktop={{…}}`.

<a id="platform-modules"></a>

## Платформенные модули

В Rust API, которые есть только на одной платформе, — это функции `nsh_core::prelude` (`on_back_press`, `input_accessory_view`) и `nsh_core::element::desktop` (окно: `set_title`, `set_title_bar`, `title_bar`, `minimize`, `toggle_maximize`, `toggle_full_screen`, `set_frame`, `set_level`, `order_front`, `close_window`; меню: `set_application_menu`, `popup_menu`); на других платформах они ничего не делают. В TSX `nsh/mobile` содержит API iOS и Android (некоторые из них — только одной из платформ), а `nsh/desktop` — API десктопов. Оба модуля можно импортировать на любой платформе, поэтому один бандл работает везде: на других платформах их функции сразу возвращают управление, а компоненты не занимают места. Каждый экспортирует `isAvailable`, равный `true` на своих платформах; `platform.os` позволяет их различить.

### nsh/mobile

`isAvailable` равен `true` на iOS (включая Mac Catalyst) и Android. На обеих платформах есть [`TabBar`](../modules/nsh-mobile.md#tabbar) — системная панель вкладок.

#### BackHandler (Android)

| Rust | TSX | Описание |
|---|---|---|
| `on_back_press(listener)` | `BackHandler.on("press", listener)` | Слушает кнопку «назад» после диалогов и до стеков; верните `true`, если событие обработано. Слушатель удаляется вместе с компонентом (или эффектом), который его добавил; в TSX вызов также возвращает функцию, останавливающую его раньше. |
| | `BackHandler.exitApp()` | Выходит из приложения. |

```rust tabs
use nsh_core::prelude::*;

fn player() -> impl IntoElement {
    let full_screen = signal(false);
    // Back leaves full screen before it leaves the page. The listener goes
    // with the view.
    on_back_press(move || {
        if !full_screen.get_untracked() {
            return false;
        }
        full_screen.set(false);
        true
    });
    // …
}
```

```tsx tabs
import { BackHandler } from "nsh/mobile";

function Player() {
  // Back leaves full screen before it leaves the page. The listener goes
  // with the component.
  BackHandler.on("press", () => {
    if (!fullScreen()) return false;
    fullScreen.set(false);
    return true;
  });
  // …
}
```

Кнопку «назад» сначала обрабатывает верхний диалог, затем слушатели «назад» (последний добавленный — первым), затем верхний стек навигации, а если никто её не обработал, приложение завершается. См. [Навигация](./navigation.md#the-android-back-button).

#### InputAccessoryView (iOS)

| Rust | TSX | Описание |
|---|---|---|
| `input_accessory_view(native_id)` | `InputAccessoryView` | Панель над клавиатурой для полей ввода, которые указывают её нативный id (`.input_accessory(..)`, `ios={{ inputAccessoryViewID }}`). |

См. [Формы и клавиатура](./forms-and-keyboard.md#a-bar-over-the-keyboard-ios-inputaccessoryview).

### nsh/desktop

Приложения на Rust рисуют собственные строки заголовка с помощью `nsh_core::element::desktop` ([Сборка на Rust](./rust.md#desktop-title-bars)). Модуль для TSX:

| Экспорт | Описание |
|---|---|
| `Window` | Окно: `setTitle`, `setTitleBar({ style: "hidden" })` для собственной строки заголовка приложения, `minimize`, `toggleMaximize`, `toggleFullScreen`, `close`. |
| `titleBar` | Высота скрытой строки заголовка и место, занимаемое системными элементами управления окном (реактивно). |
| `Menu` | `setApplicationMenu(items)` (строка меню с горячими клавишами) и `popup(items, at?)` (контекстные меню). |
| `isAvailable` | `true` там, где работают API окна и меню: macOS, Windows и Linux. У десктопных браузеров `platform.desktop`, и они сохраняют окно и меню браузера. |

См. [nsh/desktop](../modules/nsh-desktop.md).

<a id="the-status-bar"></a>

### Строка состояния

На обеих платформах строка состояния принадлежит верхней странице или диалогу, как в UIKit, где её определяет самый верхний view controller: [`NavPage` и `Dialog` принимают `statusBar`](../modules/nsh-base.md#status-bar) (в Rust — `.status_bar(StatusBarStyle::Light)` или `StatusBarSetting` для остальных полей) с `foreground` (`"auto"`, `"light"` для тёмных фонов, `"dark"` для светлых), `hidden` и `animated`. Побеждает последняя показанная страница или диалог, по полям, а когда она исчезает, снова применяется нижележащая. `"statusBar"` у `nsh.json` — значение приложения по умолчанию под ними.

```rust tabs
use nsh_base::nav_page;
use nsh_core::prelude::*;

fn photo_viewer() -> impl IntoElement {
    nav_page()
        .header_visible(false)
        .status_bar(StatusBarStyle::Light)
        .child(view().flex_1().bg(black()))
}
```

```tsx tabs
import { View } from "nsh";
import { NavPage } from "nsh/base";

function PhotoViewer() {
  return (
    <NavPage headerVisible={false} statusBar={{ foreground: "light" }}>
      <View style={{ flex: 1, backgroundColor: "#000000" }}>…</View>
    </NavPage>
  );
}
```

В приложении, встроенном в нативное, строку состояния на iOS определяет view controller хост-приложения. Приложению, которое объявляет `"capabilities"` в `nsh.json`, нужен `"statusBar": true`, чтобы её изменить.

<a id="platformos-and-platformselect"></a>

## platform.os и platform.select

`os()` в Rust и константа `platform` из `nsh` в TSX сообщают, где запущено приложение: `Os::Ios`, `Os::Android`, `Os::MacOs`, `Os::Windows`, `Os::Linux` или `Os::Web`, а `platform.os` `"ios"`, `"android"`, `"macos"`, `"windows"`, `"linux"` или `"web"` (Mac Catalyst — это `"ios"`, с `platform.catalyst` в любой из его идиом; [бэкенд macOS](./macos.md) — это `"macos"`, [бэкенд Linux](./linux.md) — `"linux"`, а [бэкенд Windows](./windows.md) — `"windows"`, и их элементы применяют props `desktop`; [браузеры](./web.md) — это `"web"` и тоже применяют props `desktop`, когда `platform.desktop` равно `true`). О версии, идиоме и остальном см. [Устройство и окружение](./device-and-environment.md#the-platform).

```rust tabs
use nsh_core::{element::Os, prelude::*};

if os() == Os::Android {
    // …
}
```

```tsx tabs
import { platform } from "nsh";

if (platform.os === "android") {
  // …
}
```

### platform.select

В Rust значение выбирает `match os()`, с `is_desktop()` для десктопов. В TSX `platform.select(spec)` возвращает значение для текущей платформы. Он ищет ключ самой ОС, затем `desktop` или `mobile` по [правилу выше](#desktop-and-mobile) (`platform.desktop`), затем `native` (каждая платформа, кроме веба), затем `default`:

```rust tabs
use nsh_core::{element::Os, prelude::*};

fn card() -> View {
    let card = view().rounded(px(12.0)).bg(white());
    match os() {
        Os::Ios => card.shadow_md(),
        Os::Android => card.border_1().border_color(rgb(0xe5e7eb)),
        _ => card,
    }
}

let hint = match os() {
    Os::Ios => "Swipe down to close",
    Os::Android => "Press back to close",
    _ => "Close",
};
```

```tsx tabs
const styles = {
  card: {
    borderRadius: 12,
    backgroundColor: "#ffffff",
    ...platform.select({
      ios: { boxShadow: "0px 2px 8px rgb(0 0 0 / 0.12)" },
      android: { borderWidth: 1, borderColor: "#e5e7eb" },
    }),
  },
};

const hint = platform.select({ ios: "Swipe down to close", android: "Press back to close", default: "Close" });
```

Он возвращает `undefined`, если ничего не подошло и нет `default`.

<a id="rendering-different-components"></a>

### Отрисовка разных компонентов

Выбирайте компоненты так же, на уровне модуля (TSX), если выбор никогда не меняется:

```rust tabs
fn spinner() -> AnyElement {
    if os() == Os::Ios {
        ios_spinner().into_element()
    } else {
        material_spinner().into_element()
    }
}
```

```tsx tabs
const Spinner = platform.select({ ios: IosSpinner, default: MaterialSpinner })!;
```

или прямо в разметке с помощью [`when` / `<If>`](../elements/control-flow.md):

```rust tabs
when(os() == Os::Ios, || input_accessory_view("bar").child(…))
    .otherwise(|| text("Android has no input accessories."))
```

```tsx tabs
<If when={platform.os === "ios"} else={<Text>Android has no input accessories.</Text>}>
  <InputAccessoryView nativeID="bar">…</InputAccessoryView>
</If>
```

<a id="platform-variants-in-tailwind"></a>

## Платформенные варианты в Tailwind

В Rust стили для платформ задаются через `.when(os() == Os::Ios, |v| ..)`; в TSX варианты `ios:`, `android:` и `web:` применяют классы на одной платформе:

```rust tabs
view()
    .rounded_xl()
    .bg(white())
    .p_4()
    .when(os() == Os::Ios, |v| v.shadow_md())
    .when(os() == Os::Android, |v| v.border_1().border_color(rgb(0xe4e4e7)))
```

```tsx tabs
<View class="rounded-xl bg-white p-4 ios:shadow-md android:border android:border-zinc-200">…</View>
<Text class="text-base android:font-medium">Title</Text>
```

<a id="prefer-shared-behavior"></a>

## Отдавайте предпочтение общему поведению

Прежде чем прибегать к проверке платформы, подумайте, важна ли эта разница вашим пользователям. Элементы и стили уже соответствуют нативному поведению каждой платформы там, где оно должно различаться (физика прокрутки, отрисовка текста, клавиатуры, доступность), и остаются одинаковыми там, где пользователи ждут единообразия (собственный облик вашего приложения). Проверки платформы лучше оставлять для платформенных соглашений, на которые полагаются пользователи: кнопка «назад» и toast'ы в Android, sheet'ы и большие заголовки в iOS, названия типов автозаполнения, ripple в Android.

<a id="related"></a>

## См. также

- [`InputAccessoryView`](../modules/nsh-mobile.md#inputaccessoryview) и [`BackHandler`](../modules/nsh-mobile.md#backhandler): справочники.
- [API устройства `nsh`](../modules/nsh.md#device): `platform`.
- [Нативные компоненты](./native-components.md): использование view, которые предоставляет ваше хост-приложение на каждой платформе.
- [Tailwind](./tailwind.md): все варианты.
