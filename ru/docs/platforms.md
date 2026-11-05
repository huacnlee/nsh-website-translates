---
title: "Обзор платформ"
description: "Где работает NSH: iOS, Android, macOS, Windows, Linux, GPUI и веб, у каждой платформы свой бэкенд; как запускать, упаковывать и встраивать приложение на Rust или TSX на каждой из них и что для этого требуется."
order: 10
group: platforms
source_hash: 122188df65c9a97c
---

# Обзор платформ

NSH работает на телефонах, настольных компьютерах и в вебе: iOS, Android, macOS, Windows, Linux, GPUI и веб-страницы. У каждой платформы есть собственный бэкенд, который рисует средствами её родного UI, поэтому приложение состоит из представлений UIKit на iPhone, представлений AppKit на Mac, виджетов GTK 4 в Linux, элементов GPUI в приложении GPUI и HTML в браузере, с текстом, вводом, доступностью и тёмной темой самой платформы. Всё, что выше бэкенда, общее: реактивный граф, рендерер, раскладка Taffy, компоненты и нативные модули — это один и тот же код на Rust везде, поэтому одно приложение работает на всех платформах. Приложение на Rust — это этот код и ваш крейт, без виртуальной машины JavaScript; приложение на TSX запускает свои модули на QuickJS поверх него ([Building with Rust](./rust.md)).

На любой платформе приложение используется двумя одинаковыми способами: упаковывается как устанавливаемое приложение этой платформы (`nsh package`) или встраивается в ваше собственное нативное приложение, независимо от того, подключает ли хост корень на Rust или загружает TSX во время выполнения. Разрабатывать его можно с помощью `nsh run` (правки на Rust пересобирают и перезапускают приложение, правки на TSX применяются как горячие обновления).

<a id="at-a-glance"></a>

## Коротко

| Платформа | Бэкенд; текст | Работает на | Разработка | Упаковка |
|---|---|---|---|---|
| [iOS](./ios.md) | UIKit; CoreText | iOS 15.0+, устройства и симулятор | `nsh run --target ios` | `.app` (симулятор), подписанный `.ipa` |
| [Android](./android.md) | Android views; `StaticLayout` | Android 9 (API 28)+, `arm64-v8a`, `armeabi-v7a` и `x86_64` | `nsh run --target android` | подписанный `.apk` |
| [macOS](./macos.md) | AppKit и Core Animation; CoreText | macOS 14+ | `nsh run --target macos` | `.app` с ad hoc-подписью |
| [Windows](./windows.md) | окна Win32, отрисованные через Direct2D; DirectWrite | Windows 10 1809+, Windows 11 | `nsh run` (по умолчанию в Windows) | каталог и `.zip` |
| [Linux](./linux.md) | виджеты GTK 4; Pango | GTK 4.14+ | `nsh run` (по умолчанию в Linux) | каталог и `.tar.gz` |
| [GPUI](./gpui.md) | GPUI; текстовая система GPUI | macOS, Windows, Linux (Vulkan) | в вашем приложении GPUI; TSX также с `nsh run --target gpui` | внутри приложения GPUI, которое его встраивает |
| [Web](./web.md) | HTML и CSS; шрифты браузера | современные браузеры, на компьютерах и телефонах | `nsh run --target web` | статический сайт |

- **[GPUI](./gpui.md)** рисует приложения с помощью [GPUI](https://gpui-kit.com), фреймворка родственного проекта GPUI Kit, одинаково на macOS, Windows и Linux: это бэкенд для встраивания в приложения GPUI и GPUI Kit, которые размещают `AppView` в собственном дереве элементов. Автономные настольные приложения запускаются и упаковываются с собственным бэкендом каждой ОС (AppKit, Win32, GTK 4).
- **[Web](./web.md)** отображает приложения как HTML на веб-странице: `nsh package --target web` публикует статический сайт для любого веб-сервера или CDN, при этом движок и крейт приложения на Rust компилируются в WebAssembly, а ваша собственная страница встраивает приложение через `createPlayer` или iframe. Он же запускает живые демо и [песочницу](/playground) на этом сайте.
- **Mac Catalyst** запускает бэкенд iOS в окне размером с iPhone (390×844) на Mac, для разработки. Выберите его через `--target catalyst`, чтобы увидеть, как приложение выглядит на телефоне.

<a id="develop-and-package"></a>

## Разработка и упаковка

`nsh run` выбирает собственную платформу машины, если вы не указали `--target`: AppKit на macOS, окно GTK в Linux и окно Win32 в Windows. К телефонам обращаются с компьютера: к iOS — с Mac с установленным Xcode, к Android — с macOS, Linux или Windows с Android SDK ([Installation](./installation.md#what-works-where)).

Приложение на Rust (его `nsh.json` называет компонент `"root"`) запускается и упаковывается из своего каталога: `nsh` собирает собственный раннер приложения для целевой платформы, с вашим крейтом и без QuickJS. Приложение на TSX указывает свою точку входа:

```sh
# A Rust app, from its directory
nsh run --target macos             # or ios, android, windows, linux, web, catalyst
nsh package --target macos         # or ios, ios-simulator, android, windows, linux, web

# A TSX app
nsh run App.tsx --target macos     # or ios, android, windows, linux, gpui, web, catalyst
nsh package App.tsx --target macos
```

Каждая настольная ОС упаковывает приложения со своим бэкендом, собранным для той машины, на которой он запускается: приложение для Mac упаковывайте на Mac, приложение для Windows — в Windows, а для Linux — в Linux. В разделе [Packaging](./packaging.md) описаны результат сборки, подпись и значки для каждой цели.

<a id="embed-in-a-native-app"></a>

## Встраивание в нативное приложение

| Платформа | Представление хоста | Запускает | Поставляется как | Язык хоста |
|---|---|---|---|---|
| macOS | `AppView` (`NSView`) | корень на Rust, бандлы TSX | крейт `nsh-platform-macos` | Rust |
| Windows | `AppView` (дочернее окно) | корень на Rust, бандлы TSX | крейт `nsh-platform-windows` | Rust |
| Linux | `AppView` (виджет GTK) | корень на Rust, бандлы TSX | крейт `nsh-platform-linux` | Rust |
| GPUI (macOS, Windows, Linux) | `AppView` (представление GPUI) | корень на Rust, бандлы TSX, подписанные пакеты | крейт `nsh-platform-gpui` | Rust |
| iOS | `AppView` (`UIView`) | корень на Rust, бандлы TSX | крейт `nsh-platform-ios` | Rust |
| iOS | `NshAppView` (`UIView`) | бандлы TSX, подписанные пакеты | `NativeShell.xcframework` | Swift |
| Android | `NshView` (`FrameLayout`) | бандлы TSX, подписанные пакеты | `nsh.aar` | Java или Kotlin |
| Web | `createPlayer` (элемент страницы) или iframe | бандлы TSX; приложение на Rust — как его опубликованный сайт | файлы среды выполнения из `nsh package --target web` | JavaScript или HTML |

Хост на Rust подключает корень на Rust (`Root::of::<App>()`) как `AppSource::Rust` или `App::Rust` и передаёт его движкам наборы UI приложения через `set_ui_sets`, поэтому загружаемый им TSX импортирует собственные компоненты и модули приложения. Каждое представление — это один движок, и приложение может показывать несколько. Хост регистрирует собственные нативные представления, которые приложения используют на каждой платформе ([Native components](./native-components.md)).

> [!NOTE]
> Хосты на Rust встраивают NSH с помощью платформенных крейтов из репозитория NSH; `AppView` для macOS, Windows и Linux загружает бандлы из собственных файлов приложения (или исходного кода) с лимитами по умолчанию. Крейт GPUI, а также SDK для iOS и Android дополнительно загружают [подписанные пакеты](./signed-packages.md) и задают лимиты и возможности для каждого представления ([Sandbox and capabilities](./sandbox-and-capabilities.md)).

<a id="writing-for-every-platform"></a>

## Код для всех платформ

Большая часть приложения не требует проверок платформы: элементы, стили, раскладка и модули ведут себя везде одинаково. Там, где платформы различаются, NSH отводит различию одно место ([Platform-specific code](./platform-specific.md)):

- **Окружение сообщает, где запущено приложение**: в Rust — `os()`, `idiom()` и `is_desktop()` (`nsh_core::prelude`), в TSX — `platform.os`, `platform.idiom`, `platform.desktop` и `platform.select` из `nsh`. ОС — это iOS, Android, macOS, Windows, Linux или веб.
- **Свойства только для определённой платформы** задаются в `ios={{…}}`, `android={{…}}`, `web={{…}}` или `desktop={{…}}` в TSX (`desktop`: macOS, Windows, Linux и браузеры на компьютерах).
- **Ввод зависит от платформы.** На телефонах — касания и экранная клавиатура; на настольных компьютерах — мышь, трекпад и клавиатура.

Компоненты приложения рисуются примитивами NSH, поэтому они работают как на настольных компьютерах, так и на телефонах и выглядят одинаково на обоих. Раскладка для компьютера строится из примитивов (`view`, `text`, `scroll`, `virtual_list`, …; `View`, `Text`, `Scroll`, `List`, … в TSX) и проверки на десктоп, как это сделано в десктопной раскладке галереи:

```rust tabs
use nsh_core::prelude::*;

#[component]
pub fn Shell() -> impl IntoElement {
    // macOS, Windows, Linux and desktop browsers get a sidebar; phones get tabs.
    view()
        .flex_1()
        .child(if is_desktop() { sidebar_layout() } else { tab_layout() })
}

fn sidebar_layout() -> AnyElement {
    view().flex_1().flex_row().into_element()
}

fn tab_layout() -> AnyElement {
    view().flex_1().flex_col().into_element()
}
```

```tsx tabs
import { View } from "nsh";
import { platform } from "nsh";

export function Shell() {
  // macOS, Windows, Linux and desktop browsers get a sidebar; phones get tabs.
  return <View class="flex-1">{platform.desktop ? <SidebarLayout /> : <TabLayout />}</View>;
}

function SidebarLayout() {
  return <View class="flex-1 flex-row" />;
}

function TabLayout() {
  return <View class="flex-1 flex-col" />;
}
```

Каждый бэкенд перечисляет то, что делает по-своему: [macOS](./macos.md#what-differs-on-macos), [Windows](./windows.md#what-differs-on-windows), [Linux](./linux.md#what-differs-on-linux), [GPUI](./gpui.md#differences).

<a id="see-also"></a>

## См. также

- [Getting started](./getting-started.md): первое приложение, запущенное на каждой платформе.
- [Building with Rust](./rust.md): приложения на Rust и Rust с TSX.
- [Installation](./installation.md): инструменты, необходимые каждой платформе.
- [Architecture](./architecture.md): что является общим и что делает каждый бэкенд.
