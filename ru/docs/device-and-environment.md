---
title: "Устройство и окружение"
description: "Чтение размера окна, цветовой схемы, масштаба шрифта, безопасных областей, платформы, плотности пикселей и направления раскладки, а также реакция на их изменения."
order: 47
group: ui
demo: guide-device
source_hash: f61a9081e4276695
---

# Устройство и окружение

Окружение, в котором работает приложение, меняется во время работы: окно меняет размер (поворот, split view, окно на Mac), пользователь включает тёмную тему или увеличивает размер текста, появляется и скрывается клавиатура. NSH предоставляет каждое из этих изменений как **реактивный accessor**: вызывайте его как сигнал, и всё, что его прочитало (стиль, текст, вычисляемое значение), обновится при изменении. Не нужно добавлять и удалять слушатели.

В Rust accessor'ы являются функциями `nsh_core::prelude`; в TSX они импортируются из перечисленных модулей.

| Rust | TSX | Значение |
|---|---|---|
| `window()` | `windowSize()` (`nsh`) | Ширина и высота поверхности в пунктах. |
| `dark()` | `colorScheme()` (`nsh`) | Тёмная или светлая тема: системная или собственная тема приложения (`set_color_scheme`, `setColorScheme`). |
| `font_scale()` | `fontScale()` (`nsh`) | Предпочтительный пользователем размер текста относительно стандартного (1 — стандартный). |
| `safe_area()` | `safeArea()` (`nsh`) | Отступы поверхности, не закрытые системным UI: сверху, справа, снизу, слева. |
| `cx.insets()` | `safeAreaInsets()` (`nsh`) | Отступы там, где отрисовывается вызывающий компонент (страница, диалог). |
| `keyboard_height()`, `keyboard_duration()` | `keyboardFrame()` (`nsh`) | Высота экранной клавиатуры и длительность её анимации. |
| `locale()` | `locale()` (`nsh`) | Локаль пользователя в виде тега BCP 47 (`"en-US"`, `"zh-Hans-CN"`): для неё по умолчанию форматирует `Intl`. |
| `lifecycle()` | `lifecycle()` (`nsh`) | Используется ли приложение: `active`, `inactive` (видно, но без фокуса) или `background` ([В фоне](#in-the-background)). |
| `reduce_motion()`, `screen_reader()` | `reduceMotion()`, `screenReaderEnabled()` (`nsh`) | См. [Accessibility](./accessibility.md). |

```rust tabs
use nsh_core::prelude::*;

#[component]
pub fn App() -> impl IntoElement {
    view()
        .flex_1()
        .pt(move || safe_area().top + px(16.0))
        .px(px(16.0))
        // A light and a dark value: the color follows the appearance natively.
        .bg(AdaptiveColor::rgb(0xffffff, 0x0d1117))
        .child(
            text(move || {
                let size = window();
                format!(
                    "{} × {} pt, text at {:.2}×",
                    size.width.0.round(),
                    size.height.0.round(),
                    font_scale()
                )
            })
            .text_color(AdaptiveColor::rgb(0x1f2328, 0xe6edf3)),
        )
}
```

```tsx tabs
import { mount, Text, View, safeArea } from "nsh";
import { colorScheme, fontScale, windowSize } from "nsh";

function App() {
  return (
    <View style={{ flex: 1, paddingTop: safeArea().top + 16, paddingHorizontal: 16, backgroundColor: colorScheme() === "dark" ? "#0d1117" : "#ffffff" }}>
      <Text style={{ color: colorScheme() === "dark" ? "#e6edf3" : "#1f2328" }}>
        {Math.round(windowSize().width)} × {Math.round(windowSize().height)} pt, text at {fontScale().toFixed(2)}×
      </Text>
    </View>
  );
}

mount(App);
```

<a id="window-size-and-responsive-layout"></a>

## Размер окна и адаптивная раскладка

`window()` (TSX: `windowSize()`) — размер поверхности, в которую NSH выполняет отрисовку: экран на телефоне, окно на iPad в split view или на Mac, host view при встраивании NSH. Используйте его, чтобы менять раскладку, а не только размеры:

```rust tabs
use nsh_core::prelude::*;

fn gallery() -> impl IntoElement {
    let columns = || {
        let width = window().width.0;
        if width >= 700.0 { 4.0 } else if width >= 500.0 { 3.0 } else { 2.0 }
    };
    let side = move || px((window().width.0 - 32.0 - (columns() - 1.0) * 8.0) / columns());
    view().flex_row().flex_wrap().gap_2().child(each(
        photos,
        |p| p.id,
        move |p, _| image(move || p.with(|p| p.url.clone())).w(side).aspect_ratio(1.0),
    ))
}
```

```tsx tabs
import { Image, View } from "nsh";
import { windowSize } from "nsh";

function Gallery() {
  const columns = () => (windowSize().width >= 700 ? 4 : windowSize().width >= 500 ? 3 : 2);
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      <Each of={photos}>
        {(p) => <Image src={p().url} style={{ width: (windowSize().width - 32 - (columns() - 1) * 8) / columns(), aspectRatio: 1 }} />}
      </Each>
    </View>
  );
}
```

Часто flexbox, проценты и `aspect_ratio` (`aspectRatio`) решают задачу вообще без чтения размера; см. [Layout](./layout.md). Rust-функция `style_when(|| window().width.0 >= 640.0, |s| s.flex_row())` переключает стили в зависимости от ширины; в TSX с Tailwind варианты breakpoint'ов (`sm:`, `md:`, `lg:`, `xl:`, `2xl:`, `max-*:`, `min-[…]:`) и `portrait:` / `landscape:` тоже следуют за окном: `class="grid grid-cols-2 md:grid-cols-4"`.

<a id="dark-mode"></a>

## Тёмная тема

Внешний вид следует за системным, пока приложение не задаст собственный. В Rust проще всего поддержать тёмную тему с помощью цвета со светлым и тёмным значениями, `AdaptiveColor::rgb(light, dark)`: он переключается нативно вместе с внешним видом, и ничего не нужно запускать. В TSX для этого служит вариант Tailwind `dark:`, который применяется, когда `colorScheme()` равно `"dark"`:

```rust tabs
view()
    .flex_1()
    .p_4()
    .bg(AdaptiveColor::rgb(0xffffff, 0x18181b))
    .child(
        text("Follows the system appearance")
            .text_color(AdaptiveColor::rgb(0x18181b, 0xf4f4f5)),
    )
```

```tsx tabs
<View class="flex-1 bg-white dark:bg-zinc-900 p-4">
  <Text class="text-zinc-900 dark:text-zinc-100">Follows the system appearance</Text>
</View>
```

Во всех остальных случаях читайте `dark()` (TSX: `colorScheme()`) в замыкании или вычисляемом значении; в TSX, если цветов больше нескольких, один раз выведите палитру:

```rust tabs
use nsh_core::prelude::*;

// `dark()` is reactive: the closure runs again when the appearance changes.
view()
    .flex_1()
    .bg(move || if dark() { rgb(0x0d1117) } else { rgb(0xf6f8fa) })
    .child(text("Hello"))
```

```tsx tabs
import { computed, Text, View } from "nsh";
import { colorScheme } from "nsh";

const palette = computed(() =>
  colorScheme() === "dark"
    ? { background: "#0d1117", surface: "#161b22", text: "#e6edf3", muted: "#8b949e" }
    : { background: "#f6f8fa", surface: "#ffffff", text: "#1f2328", muted: "#57606a" },
);

<View style={{ flex: 1, backgroundColor: palette().background }}>
  <Text style={{ color: palette().text }}>Hello</Text>
</View>
```

Компоненты Rust также берут цвета из темы со светлым и тёмным значениями (`nsh.json` `"theme"`, см. [Building with Rust](./rust.md)), поэтому они тоже переключаются вместе с системой. Чтобы привести строку состояния в соответствие с фоном, добавьте своим страницам и диалогам [`statusBar`](../modules/nsh-base.md#status-bar) или задайте его для всего приложения в `nsh.json`.

<a id="an-app-with-its-own-appearance"></a>

### Приложение со своим внешним видом

Приложение, которое всегда тёмное (или всегда светлое), указывает это в `nsh.json`, и `dark()` и `colorScheme()`, адаптивные цвета, классы `dark:`, тема, стиль строки состояния по умолчанию и алерты следуют ему с первого кадра (упакованные приложения тоже запускаются в нём):

```json
{ "appearance": "dark" }
```

`set_color_scheme(Appearance::Dark)` (TSX: `setColorScheme` из `nsh`) меняет его во время работы, например для настройки внешнего вида внутри приложения; `Appearance::System` (`"system"`) снова следует за системой:

```rust tabs
use nsh_core::prelude::*;

view()
    .on_press(move || {
        set_color_scheme(if dark() { Appearance::Light } else { Appearance::Dark })
    })
    .role(AccessibilityRole::Button)
    .rounded_lg()
    .px_4()
    .py_2()
    .bg(AdaptiveColor::rgb(0xe5e5e5, 0x262626))
    .child(
        text(|| if dark() { "Light" } else { "Dark" })
            .text_color(AdaptiveColor::rgb(0x171717, 0xfafafa)),
    )
```

```tsx tabs
import { Text, View } from "nsh";
import { colorScheme, setColorScheme } from "nsh";

<View onPress={() => setColorScheme(colorScheme() === "dark" ? "light" : "dark")} role="button" class="rounded-lg px-4 py-2 bg-neutral-200 dark:bg-neutral-800">
  <Text class="text-neutral-900 dark:text-neutral-50">{colorScheme() === "dark" ? "Light" : "Dark"}</Text>
</View>
```

> [!TIP]
> Проверяйте оба внешних вида во время разработки: `xcrun simctl ui booted appearance dark` переключает симулятор iOS, а в Android переключатель тёмной темы находится в быстрых настройках. Изменение доходит до приложения сразу, без перезагрузки.

<a id="text-size"></a>

## Размер текста

`font_scale()` (TSX: `fontScale()`) — настройка размера текста пользователя (Dynamic Type в iOS, размер шрифта в Android) относительно стандартного. Текст и поля ввода следуют ей сами: `fontSize: 16` отображается крупнее, если пользователь запросил более крупный текст. Для отдельного элемента можно отказаться от этого или ограничить масштаб:

| Rust (на `text` и `input`) | TSX (на `<Text>` и `<Input>`) | По умолчанию | Описание |
|---|---|---|---|
| `.allow_font_scaling(..)` | `allowFontScaling` | `true` | Следовать системному размеру текста. |
| `.max_font_size_multiplier(..)` | `maxFontSizeMultiplier` | `0` (нет) | Наибольший масштаб, применяемый к этому тексту. |

```rust tabs
text("Today")
    .text_size(px(34.0))
    .font_weight(FontWeight::BOLD)
    .max_font_size_multiplier(1.4)
```

```tsx tabs
<Text style={{ fontSize: 34, fontWeight: "700" }} maxFontSizeMultiplier={1.4}>Today</Text>
```

Читайте `font_scale()`, чтобы адаптировать раскладку, которая не следует за текстом автоматически, например переключать строку в колонку, когда текст становится крупным: `.style_when(|| font_scale() > 1.3, |s| s.flex_col())` в Rust, `flexDirection: fontScale() > 1.3 ? "column" : "row"` в TSX.

Размер текста масштабирует текст: каждый текст и поле ввода, допускающие масштабирование шрифта, а также платформенные алерты и тосты. Длины сохраняют свой размер: отступы, ширина и высота, радиусы скругления, границы и изображения, заданные в пунктах или классами (`p-4`, `rounded-lg`, `w-[2rem]`). Блоки, размер которых определяется содержимым, растут вместе с текстом.

<a id="language-and-region"></a>

## Язык и регион

`locale()` — локаль пользователя в виде тега BCP 47 (`locale().as_str()` в Rust). В TSX `Intl` по умолчанию форматирует для неё числа и даты, поэтому `new Intl.NumberFormat().format(1234.5)` даёт `1,234.5` в `en-US` и `1.234,5` в `de-DE`. Читайте `locale()`, чтобы выбирать строки собственных переводов: тексты, которые его читают, обновляются при изменении.

```rust tabs
use nsh_core::prelude::*;

fn greeting() -> &'static str {
    match locale().as_str().split('-').next() {
        Some("de") => "Willkommen",
        Some("zh") => "欢迎",
        _ => "Welcome",
    }
}

text(greeting)
```

```tsx tabs
import { Text } from "nsh";
import { locale } from "nsh";

const greetings: Record<string, string> = { en: "Welcome", de: "Willkommen", zh: "欢迎" };

<Text>{greetings[locale().split("-")[0]] ?? greetings.en}</Text>
```

<a id="in-an-embedding-app"></a>

## Во встраивающем приложении

Приложение, показанное внутри нативного приложения, следует его собственным настройкам, если оно их задаёт: локаль и размер текста из API встраивания (`AppView::set_locale` и `set_font_scale` в Rust на [GPUI](./gpui.md), [macOS](./macos.md), [Linux](./linux.md) и [Windows](./windows.md), `locale` и `fontScale` в Swift на [iOS](./ios.md), `setLocale` и `setFontScale` в Java на [Android](./android.md)) заменяют системные язык и размер текста. `locale()`, `Intl`, `fontScale()` и текст следуют им сразу, как и системным изменениям, а системные значения возвращаются, когда встраивающее приложение сбрасывает свои. Используйте их, если нативное приложение позволяет пользователям выбирать собственный язык или размер текста.

<a id="in-the-background"></a>

## В фоне

`lifecycle()` (то же в TSX) сообщает, использует ли пользователь приложение. Оно равно `active` на переднем плане, `inactive`, пока приложение ещё видно, но фокус у другого приложения или окна (или система показывает что-то поверх него: переключатель приложений, входящий звонок), и `background`, пока оно не видно: в фоне на телефоне, свёрнуто на десктопе, скрытая вкладка в вебе. Как и любой accessor, он обновляет то, что его прочитало, поэтому эффект приостанавливает живую ленту, опрос или видео в фоне и возобновляет их, когда пользователь возвращается:

```rust tabs
effect(move || {
    if lifecycle() == Lifecycle::Background {
        feed.pause();
    } else {
        feed.resume();
    }
});
```

```tsx tabs
effect(() => {
  if (lifecycle() === "background") feed.pause();
  else feed.resume();
});
```

Используйте `background`, чтобы приостанавливать работу, и сохраняйте изменения пользователя по мере их внесения: система может приостановить приложение через секунды после перехода в фон, раньше, чем выполнится эффект, читающий это изменение. Приложение, показанное внутри нативного приложения, следует состоянию того приложения, а если у приложения несколько окон (iPad, десктоп), представление следует за окном, в котором находится. В тестах `app.setLifecycle("background")` из `nsh/test` переводит приложение в это состояние ([Testing](./testing-and-trace.md#steps)).

<a id="safe-areas"></a>

## Безопасные области

Вырезы, индикатор «Домой», строка состояния, панель навигации Android и заголовок окна Mac Catalyst закрывают части поверхности. Приложения NSH рисуют от края до края на всех платформах, а закрытые части получают в виде отступов.

- `safe_area()` (TSX: `safeArea()`) возвращает отступы поверхности.
- `cx.insets()` компонента (TSX: `safeAreaInsets()`) возвращает отступы **там, где компонент отрисовывается**: внутри навигационной [страницы](./navigation.md#safe-areas-under-the-header) они измеряются ниже её заголовка, внутри [диалога](../elements/dialog.md) это отступы диалога. Предпочитайте его в компонентах, которые могут показываться в разных местах.
- CSS-функции `env(safe-area-inset-top)`, `-right`, `-bottom` и `-left` задают внутренние или внешние отступы любого представления по отступам там, где оно отрисовывается, в `padding*` и `margin*` (`calc(env(safe-area-inset-bottom) + 8px)` добавляет длину; Tailwind `pt-[env(safe-area-inset-top)]`; Rust `.p_safe_area()`, `.pt_safe_area()`, `.pb_safe_area_plus(px(8.0))`, ...). Padding обновляется нативно при изменении отступов ([Safe area](../elements/safe-area.md)).

```rust tabs
use nsh_core::prelude::*;

fn screen() -> impl IntoElement {
    view()
        .pt_safe_area()
        .px_safe_area()
        .flex_1()
        .bg(white())
        .child(content())
        .child(bottom_bar())
}

// A component, for its `Scope`: the insets where it renders.
#[component]
fn BottomBar(cx: Scope<NoEvent>) -> impl IntoElement {
    // `cx.insets()`: the insets where the component renders.
    view()
        .flex_row()
        .pt(px(8.0))
        .pb(move || cx.insets().bottom + px(8.0))
}
```

```tsx tabs
import { View, safeAreaInsets } from "nsh";

function Screen() {
  return (
    <View class="flex-1 bg-white pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] pl-[env(safe-area-inset-left)]">
      <Content />
      <BottomBar />
    </View>
  );
}

function BottomBar() {
  const insets = safeAreaInsets();
  return <View style={{ paddingBottom: insets().bottom + 8, paddingTop: 8, flexDirection: "row" }}>…</View>;
}
```

В Android представление, встроенное под панелью инструментов, получает только те части системных панелей, которые его перекрывают, как safe area в UIKit: если оно не доходит до строки состояния, верхнего отступа нет.

<a id="the-platform"></a>

## Платформа

`os()`, `os_version()`, `idiom()`, `is_desktop()` и `is_catalyst()` в Rust и константа `platform` из `nsh` в TSX описывают, где работает приложение. Они не меняются, пока приложение работает.

| Rust | TSX | Описание |
|---|---|---|
| `os()` | `platform.os` | `Os::Ios`, `Os::Android`, `Os::MacOs`, `Os::Windows`, `Os::Linux` или `Os::Web` (`os().name()` — строка в TSX). Mac Catalyst — это iOS. |
| `os_version()` | `platform.version` | Старшая и младшая версии; в Android — уровень API и 0. |
| `idiom()` | `platform.idiom` | `Idiom::Phone`, `Pad`, `Mac`, `Tv` или `Desktop`; `Desktop` ровно там, где выполняется `is_desktop()`. |
| `is_desktop()` | `platform.desktop` | macOS, Windows или Linux либо десктопный браузер ([Desktop and mobile](./platform-specific.md#desktop-and-mobile)). |
| `is_catalyst()` | `platform.catalyst` | Mac Catalyst, в любом из двух его идиомов. |

`platform` в TSX полностью:

| Член | Описание |
|---|---|
| `platform.os` | `"ios"`, `"android"`, `"macos"`, `"windows"`, `"linux"` или `"web"`. Mac Catalyst сообщает `"ios"`. |
| `platform.version` | Строка: iOS и десктопы: версия ОС (`"17.5"`); Android: уровень API (`"35"`); веб: `"0.0"`. |
| `platform.idiom` | `"phone"`, `"pad"`, `"mac"`, `"tv"` или `"desktop"`. `"desktop"` ровно там, где `platform.desktop` равно `true`. `"mac"` — это идиом Mac в UIKit под Mac Catalyst, мобильный идиом. |
| `platform.desktop` | Применяется поведение десктопа: macOS, Windows, Linux и десктопные браузеры. Props `desktop={{…}}` и `platform.select({ desktop })` следуют ему. |
| `platform.catalyst` | Приложение работает под Mac Catalyst (`os` `"ios"`), в идиоме Mac или iPad. |
| `platform.select(spec)` | Значение для этой платформы; см. [Platform-specific code](./platform-specific.md#platformselect). |

```rust tabs
use nsh_core::{element::Os, prelude::*};

let haptics_supported = os() == Os::Ios || (os() == Os::Android && os_version().0 >= 30);
```

```tsx tabs
import { platform } from "nsh";

const hapticsSupported = platform.os === "ios" || (platform.os === "android" && Number(platform.version) >= 30);
```

`nsh test` работает в headless-режиме как iOS.

На [Linux](./linux.md) `platform.os` равно `"linux"`, идиом — `"desktop"`, а `platform.version` — старшая и младшая версии ядра (`"6.12"`): дистрибутивы нумеруют свои релизы так, что их нельзя сравнивать. Там safe area и высота клавиатуры равны 0, `colorScheme()` следует настройке рабочего стола (XDG settings portal) в реальном времени, `fontScale()` — масштабированию текста рабочего стола, а `pixelRatio()` — масштабу дисплея, включая дробные значения.

На [macOS](./macos.md) (бэкенд AppKit) `platform.os` равно `"macos"`, идиом — `"desktop"`, а `platform.version` — версия macOS. Safe area и высота клавиатуры равны 0, `colorScheme()` следует системному внешнему виду в реальном времени, `fontScale()` равно 1, а `pixelRatio()` — backing scale дисплея.

На [Windows](./windows.md) `platform.os` равно `"windows"`, идиом — `"desktop"`, а `platform.version` — `"10.0"`, в том числе в Windows 11 (Windows сохранила номер версии). Safe area и высота клавиатуры равны 0, `colorScheme()` следует настройке «Параметры > Персонализация > Цвета» в реальном времени, `fontScale()` — настройке «Размер текста» (от 1 до 2,25), `reduceMotion()` — настройке эффектов анимации, `pixelRatio()` — масштабу монитора, а `Intl` форматирует по региональным настройкам пользователя.

В браузере ([веб-рантайм](./web.md)) `platform.os` равно `"web"`, а `platform.version` — `"0.0"`. Идиом — `"desktop"` при наличии мыши и окна шириной не менее 600 пунктов, `"pad"` на планшете и `"phone"` на телефоне; он определяется при запуске приложения. Локаль, `reduceMotion()`, `fontScale()` (размер текста браузера), `pixelRatio()`, safe area и высота клавиатуры берутся из браузера и следуют за ним в реальном времени.

<a id="pixel-density"></a>

## Плотность пикселей

`pixel_ratio()` и `round_to_nearest_pixel(points)` в Rust и `pixelRatio()` из `nsh` в TSX преобразуют пункты в пиксели устройства и обратно.

| Rust | TSX | Описание |
|---|---|---|
| `pixel_ratio()` | `pixelRatio()` | Пикселей устройства на пункт (2 или 3 на большинстве телефонов), реактивно. |
| `round_to_nearest_pixel(points)` | `Math.round(x * pixelRatio()) / pixelRatio()` | Пункты, округлённые до ближайшего пикселя устройства. |

Тонкая линия высотой в один пиксель устройства:

```rust tabs
view()
    .h(move || px(1.0 / pixel_ratio()))
    .bg(rgb(0xd0d7de))
```

```tsx tabs
import { View } from "nsh";
import { pixelRatio } from "nsh";

<View style={{ height: 1 / pixelRatio(), backgroundColor: "#d0d7de" }} />
```

`pixel_ratio()` и `pixelRatio()` реактивны, поэтому тонкая линия следует за окном, перемещённым на экран с другой плотностью.

<a id="right-to-left"></a>

## Справа налево

Когда язык устройства пишется справа налево (арабский, иврит, персидский, ...), NSH выстраивает приложение справа налево: строки идут от правого края, логические свойства стиля принимают свои правые-левые стороны, текст выравнивается по правому краю, а нативные виджеты зеркально отражаются. Направление раскладки само следует за языком пользователя. Стиль `direction` представления (`"ltr"`, `"rtl"` или `"inherit"`; `.direction(LayoutDirection::..)` в Rust) задаёт направление его поддерева; на корневом представлении он задаёт направление всего приложения.

Изменения применяются сразу, без перезапуска приложения; демо на этой странице переключает стиль `direction`.

Пишите раскладки, которые работают в обоих направлениях, с помощью логических свойств: в Rust `ms` / `me` и `ps` / `pe` (имена из Tailwind), в TSX `marginStart` / `marginEnd`, `paddingStart` / `paddingEnd`, `start` / `end`, `borderTopStartRadius`, `textAlign: "start"` и так далее; они означают левую и правую стороны в раскладках слева направо и наоборот в раскладках справа налево. `left` и `right` (`marginLeft`, `paddingRight`, `left`, `textAlign: "left"`, ...) сохраняют свои стороны в обоих случаях, как в CSS. Стиль `direction` (`"inherit"`, `"ltr"`, `"rtl"`) переопределяет направление для поддерева, например чтобы оставить номер телефона или элементы управления медиаплеера слева направо. Варианты Tailwind `rtl:` и `ltr:` применяются для каждого направления отдельно.

Горизонтальные scroll view и списки в раскладках справа налево начинаются с правого края. В Android приложение-хост должно объявить `android:supportsRtl="true"` в манифесте, чтобы нативные виджеты зеркально отражались.

<a id="related"></a>

## См. также

- [Device API `nsh`](../modules/nsh.md#device): справочник.
- [Platform-specific code](./platform-specific.md): `platform.select`, платформенные props и модули.
- [Accessibility](./accessibility.md): программы чтения с экрана и уменьшение анимации.
- [Safe area](../elements/safe-area.md), [Keyboard](../elements/keyboard.md) и [строка состояния](../modules/nsh-base.md#status-bar).
- [Tailwind](./tailwind.md): `dark:`, варианты breakpoint'ов и ориентации.
