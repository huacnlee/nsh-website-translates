---
title: "Начало работы"
description: "Создайте приложение на Rust или TSX с помощью nsh init, запустите его на iOS, Android, macOS, Windows, Linux или в вебе, подключите модули TSX в своё приложение и распространяйте их в виде подписанных пакетов либо упакуйте приложение отдельно."
order: 4
group: start
demo: guide-getting-started
source_hash: 57c002bb7e893547
---

# Начало работы

Это руководство создаёт приложение NSH, запускает его на нужных вам платформах и выпускает. Приложения NSH пишутся на Rust или TSX на одном и том же движке: Rust компилирует приложение в нативный код без виртуальной машины JavaScript, а TSX работает на QuickJS с горячими обновлениями, как модули, которые нативное приложение может загружать во время выполнения. Сначала руководство разбирает приложение на Rust, затем то же приложение на TSX. Предполагается, что `nsh` установлен и находится в вашем `PATH` ([Установка](./installation.md)); в checkout используйте вместо него `./target/debug/nsh`.

> [!TIP]
> Нет под рукой проекта приложения? Первые два раздела он не требуют: `nsh run` показывает приложение в окне на вашем компьютере, в симуляторе iOS, на устройстве Android или в браузере. Можно остановиться на этом или [упаковать его как отдельное приложение](#or-ship-it-as-a-standalone-app).

<a id="create-an-app"></a>

## Создание приложения

В терминале `nsh init` спрашивает, на чём написано приложение: `rust`, `ts` или `mixed` (TSX с собственным крейтом Rust). `--template` выбирает без вопроса.

<a id="in-rust"></a>

### На Rust

```sh
nsh init my-app --template rust
```

`nsh init` создаёт каталог и записывает проект Cargo:

| Файл | Что это |
|---|---|
| `src/lib.rs` | Приложение: его корневой компонент, состояние и обработчики |
| `src/main.rs` | Монтирует тот же корневой компонент на macOS, Windows или Linux для `cargo run` |
| `Cargo.toml` | Крейт, зависящий от `nsh-core` и `nsh-base` версии CLI |
| `nsh.json` | Имя, id, версия и номер сборки приложения, его крейт (`"rust": "."`) и корневой компонент (`"root": "App"`) ([Структура проекта](./project-structure.md#nshjson)) |
| `App.test.tsx` | Тест корневого компонента на TypeScript (`nsh test`) с `tsconfig.json` и `.nsh/types` для вашего редактора |
| `README.md` | Как запускать, тестировать и упаковывать приложение и как позже добавить точку входа TSX |
| `.gitignore` | Игнорирует `.nsh/` и `target/` |

Для разработки на Rust нужен набор инструментов Rust ([rustup](https://rustup.rs)); команды `nsh` собирают раннеры приложения из крейтов NSH на crates.io версии CLI.

<a id="in-tsx"></a>

### На TSX

```sh
nsh init my-app --template ts
```

Приложение TSX состоит из одного или нескольких файлов `.tsx` с точкой входа: её запускает `nsh run`, и её же загружает как модуль приложение-хост.

| Файл | Что это |
|---|---|
| `App.tsx` | Модуль точки входа: отображает приложение с помощью `mount` |
| `App.test.tsx` | Его тест (`nsh test`) |
| `nsh.json` | Имя, id, версия и номер сборки приложения ([Структура проекта](./project-structure.md#nshjson)) |
| `tsconfig.json` | Расширяет `.nsh/tsconfig.json`, настройки TypeScript для NSH, которые разрешают `nsh` в объявления из `.nsh/types` |
| `.gitignore` | Игнорирует `.nsh/` и `target/` |
| `.nsh/types/` | Сгенерированные объявления всех модулей NSH для вашего редактора |

Уже существующие файлы сохраняются, поэтому команду можно запускать в каталоге, где часть из них уже есть; приложение на Rust создаётся в новом каталоге.

В обоих случаях отображаемое имя по умолчанию совпадает с именем каталога; чтобы выбрать другое, передайте `--name "My App"`. Id становится `com.example.<name>`: измените его в `nsh.json` до выпуска. `nsh init my-app --template mixed` создаёт приложение TSX, которое одновременно является крейтом Rust (`Cargo.toml` и `src/lib.rs` рядом с `App.tsx`), чьи компонент, модуль и класс импортирует `App.tsx` ([Сборка с Rust](./rust.md)).

<a id="the-root-component"></a>

### Корневой компонент

Оба шаблона создают одно и то же приложение, счётчик:

```rust tabs
// src/lib.rs
use nsh_base::theme;
use nsh_core::prelude::*;

/// The crate's UI set: what a TSX entry may import from `my-app/native`.
#[native_module("my-app/native")]
fn native(registry: &mut Registry) {
    registry.register::<App>();
}

/// The application's root component.
#[component]
pub fn App() -> impl IntoElement {
    let count = signal(0_u32);
    view()
        .flex_1()
        .bg(move || theme().background)
        .text_color(move || theme().foreground)
        .child(
            view()
                .flex_1()
                .p_safe_area()
                .child(
                    view()
                        .flex_1()
                        .items_center()
                        .justify_center()
                        .gap_4()
                        .child(text(move || format!("Count: {}", count.get())).text_size(px(28.0)))
                        .child(
                            view()
                                .px_5()
                                .py_3()
                                .rounded(px(10.0))
                                .bg(move || theme().primary)
                                .active(|s| s.opacity(0.6))
                                .on_press(move || count.update(|value| *value += 1))
                                .child(
                                    text("Tap")
                                        .text_size(px(17.0))
                                        .text_color(move || theme().primary_foreground),
                                ),
                        ),
                ),
        )
}
```

```tsx tabs
// App.tsx
import { mount, signal, Text, View } from "nsh";

function App() {
  const count = signal(0);
  return (
    <View class="flex-1 items-center justify-center gap-4 bg-background pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <Text class="text-3xl font-semibold text-foreground">{count()}</Text>
      <View
        onPress={() => count.update((c) => c + 1)}
        role="button"
        class="rounded-(--radius) bg-primary px-5 py-3 active:bg-primary/90"
      >
        <Text class="text-lg text-primary-foreground">Tap</Text>
      </View>
    </View>
  );
}

mount(App);
```

На Rust:

- **`use nsh_core::prelude::*`** приносит примитивы (`view()`, `text()`, `scroll()`, `input()`, `image()`, ...), [сигналы](./reactivity.md) и типизированные методы стилей (`.p_safe_area()` добавляет к представлению отступы по [безопасной области](../elements/safe-area.md)); **`nsh_base`** содержит базовые компоненты без стилей (`button()`, клавиатура, диалоги) и `theme()`, цвета и радиусы, которыми рисуются компоненты приложения ([Тема](./rust.md#theme)).
- **`#[component] pub fn App()`** — компонент: функция, которая выполняется **один раз** и возвращает свои элементы. `"root": "App"` из `nsh.json` называет его, а `nsh run` монтирует. `signal(0_u32)` создаёт значение, меняющееся со временем.
- **`text(move || format!(…, count.get()))`** привязывает текст к сигналу: когда `count` меняется, NSH снова выполняет это замыкание и обновляет только этот текст, ничего больше. Стили принимают замыкания так же: `.bg(move || theme().primary)` следует за темой в тёмный режим.
- **`.on_press(..)`** заставляет представление отвечать на нажатия; `.active(|s| s.opacity(0.6))` — его стиль во время нажатия, применяемый нативно. Кнопка принадлежит самому приложению: NSH предоставляет примитивы и возможности, а приложение рисует из них свой интерфейс.
- **`.px_5()`, `.rounded(px(10.0))`, `.gap_4()`** — типизированные методы стилей, названные так же, как утилиты Tailwind, в пунктах (`px`). Раскладка основана на flexbox, и дочерние элементы по умолчанию располагаются в колонку ([Раскладка](./layout.md)).
- **`#[native_module("my-app/native")]`** называет то, что точка входа TSX может импортировать из крейта, когда вы добавляете сверху экраны на TSX ([Сборка с Rust](./rust.md#extending-a-rust-app-with-tsx)).

На TSX:

- **`import { mount, signal, Text, View } from "nsh"`**: `nsh` — основной модуль: сигналы, `mount`, другие реактивные примитивы и хост-элементы. Его предоставляет нативная среда выполнения, он не входит в сборку. **`nsh/base`** содержит базовые компоненты, как `nsh_base` в Rust.
- **`function App()`** — компонент, который выполняется **один раз**. **`{count()}`** читает сигнал внутри JSX: компилятор видит вызов и заставляет этот текст следовать за сигналом.
- **`<View onPress>`** — нативное представление, реагирующее на нажатия; классы `active:` — его стиль во время нажатия. `View`, `Text`, `Image`, `Scroll` и другие [хост-элементы](../elements/index.md) импортируются из `nsh` (`Input` из `nsh/base`); только `If` и `Each` не требуют импорта.
- **`class`** принимает классы [Tailwind](./tailwind.md); `style={{ … }}` принимает объект со стилевыми свойствами в camelCase, числа — в пунктах. `bg-background`, `bg-primary`, `text-primary-foreground` и `rounded-(--radius)` называют токены темы приложения ([Токены темы](./tailwind.md#theme-tokens)): они сами следуют за тёмным режимом, а `"theme"` в `nsh.json` меняет их стиль.
- **`mount(App)`** отображает компонент на поверхность приложения.

> [!IMPORTANT]
> Текст показывается в текстовом элементе: `text(..)` в Rust, `<Text>` в TSX. В TSX текст, написанный прямо в `<View>` (`<View>Hello</View>`), — ошибка сборки, которая указывает на него, а строка, которую туда помещает выражение (`<View>{name}</View>`), попадает в журнал.

<a id="develop-it"></a>

## Разработка

<a id="run-it"></a>

### Запуск

`nsh run` собирает приложение, запускает его и пересобирает при редактировании; журналы приложения выводятся в терминал. Передайте ему каталог приложения: он запускает корневой компонент приложения на Rust или `App.tsx` приложения на TSX (`nsh run my-app/App.tsx` указывает другую точку входа).

Для приложения на Rust `nsh run` собирает собственный раннер приложения для целевой платформы с вашим крейтом и смонтированным корневым компонентом, без QuickJS, и запускает его; изменение кода Rust приводит к новой сборке и перезапуску приложения. `cargo run` в каталоге приложения запускает тот же корневой компонент сразу на десктопном бэкенде. Для приложения на TSX `nsh run` запускает сервер разработки и хост для разработки, который загружает приложение с него, и обновляет запущенное приложение при каждом сохранении.

Без `--target` команда `nsh run` использует машину, на которой вы работаете: окно AppKit на macOS, окно Win32 на Windows и окно GTK на Linux. Другую платформу выбирают с помощью `--target`:

| Цель | Команда | Где запускается |
|---|---|---|
| Симулятор iOS | `nsh run my-app --target ios` | macOS с Xcode |
| Android | `nsh run my-app --target android` | macOS, Windows, Linux |
| macOS (AppKit) | `nsh run my-app` | macOS (по умолчанию) |
| Windows | `nsh run my-app` | Windows (по умолчанию) |
| Linux (GTK 4) | `nsh run my-app` | Linux (по умолчанию) |
| Web | `nsh run my-app --target web` | macOS, Windows, Linux |
| Mac Catalyst | `nsh run my-app --target catalyst` | macOS |

<a id="ios-simulator"></a>

#### Симулятор iOS

```sh
nsh run my-app --target ios
nsh run my-app --target ios --device "iPhone 16 Pro"
```

`nsh` использует запущенный симулятор или запускает новейший iPhone, если ни один не работает, и устанавливает в него приложение (раннер приложения на Rust или хост для разработки). `--device` выбирает симулятор по имени или UDID.

#### Android

```sh
nsh run my-app --target android
```

Сначала запустите эмулятор или подключите устройство (`adb devices` выводит их список; NSH использует первое). `nsh` устанавливает на него приложение: собственный `libnsh.so` приложения на Rust или APK хоста для разработки (пересобирается только при изменении среды выполнения), порт сервера разработки которого пробрасывается на устройство с помощью `adb reverse`, поэтому всё работает по USB без общей сети.

#### macOS (AppKit)

```sh
nsh run my-app --target macos
```

Приложение открывается как десктопное приложение Mac (AppKit, в окне с изменяемым размером) с вводом мышью, трекпадом и клавиатурой вместо касаний. Нужна macOS 14 или новее; см. [macOS](./macos.md).

<a id="windows-default-on-windows"></a>

#### Windows (по умолчанию в Windows)

```sh
nsh run my-app
```

Приложение открывается в окне рабочего стола (1200×800 пунктов) с вводом мышью, тачпадом, касанием и клавиатурой. Нужна Windows 10 1809 или новее; см. [Windows](./windows.md).

<a id="linux-default-on-linux"></a>

#### Linux (по умолчанию в Linux)

```sh
nsh run my-app
```

Приложение открывается в окне GTK (390×844 пункта). Нужен GTK 4.14 или новее; см. [Linux](./linux.md).

#### Web

```sh
nsh run my-app --target web
```

`nsh` выводит адрес страницы; откройте его в браузере. Приложение на Rust работает как WebAssembly с вашим крейтом, а открытая страница сама загружает новую сборку после изменения; см. [Web](./web.md).

#### Mac Catalyst

```sh
nsh run my-app --target catalyst
```

Приложение открывается на вашем Mac в окне размером с iPhone (390×844 пункта). Это самый быстрый способ увидеть приложение так, как его показывает телефон: не нужно запускать симулятор. Используется UIKit, как в iOS, поэтому вы видите то же, что показывает iPhone, за исключением поведения, свойственного Mac, например прокрутки колесом мыши. Для самого приложения Mac используйте `--target macos`.

<a id="edit-it"></a>

### Редактирование

Оставьте `nsh run` запущенным и измените подпись кнопки:

```rust tabs
text("Add one")
    .text_size(px(17.0))
    .text_color(move || theme().primary_foreground)
```

```tsx tabs
<Text style={{ color: "white", fontSize: 17 }}>Add one</Text>
```

Сохраните. Приложение на Rust собирается заново и перезапускается с новой подписью; счётчик начинается сначала. Приложение на TSX получает горячее обновление: CLI пересобирает и отправляет патч, а хост заново выполняет изменённый модуль и заново отображает только те компоненты, код которых изменился. Здесь это `App`, которому принадлежит сигнал `count`, поэтому счётчик тоже начинается сначала.

Части интерфейса выносятся в собственные компоненты или в обычные функции, возвращающие элементы:

```rust tabs
/// The app's button: a view that answers presses.
fn tap_button(on_press: impl Fn() + 'static) -> impl IntoElement {
    view()
        .p_3()
        .rounded(px(10.0))
        .bg(move || theme().primary)
        .active(|s| s.opacity(0.6))
        .on_press(on_press)
        .child(text("Tap").text_size(px(17.0)).text_color(move || theme().primary_foreground))
}

// In App: .child(tap_button(move || count.update(|value| *value += 1)))
```

```tsx tabs
function TapButton(props: { onPress: () => void }) {
  return (
    <View onPress={props.onPress} activeStyle={{ opacity: 0.6 }} style={{ padding: 12, borderRadius: 10, backgroundColor: "#0969da" }}>
      <Text style={{ color: "white", fontSize: 17 }}>Tap</Text>
    </View>
  );
}

// In App: <TapButton onPress={() => count.update((c) => c + 1)} />
```

В TSX состояние сохраняется, когда вы редактируете компонент, которому оно не принадлежит: нажмите несколько раз, затем измените цвет `TapButton`, и кнопка обновится, а счётчик останется. Горячая замена работает для каждого компонента верхнего уровня: функции с именем с заглавной буквы, тело которой содержит JSX. Компонент отображается заново, когда меняется его собственный код или код модуля вне компонентов (используемая им константа, вспомогательная функция). Если правку нельзя применить на месте (например, она импортирует модуль NSH, который запущенное приложение ещё не импортировало, или меняет возможности `nsh.json`), хост перезагружает всё приложение.

<a id="errors"></a>

#### Ошибки

Ошибка компиляции Rust выводится в терминал вместе с выводом cargo, а `nsh run` собирает заново при следующем сохранении. Ошибка сборки TSX выводится в терминал и показывается на устройстве красным оверлеем с файлом, строкой и столбцом; приложение продолжает работать на последней успешной сборке. Оверлей исчезает после следующей успешной сборки (нажмите на него, чтобы закрыть раньше). Исключение, возникшее во время выполнения, показывается так же, а его стек сопоставляется с вашим исходным кодом `.tsx`.

<a id="host-it-in-your-app"></a>

## Встраивание в ваше приложение

Нативное приложение показывает NSH в собственном представлении: `NshAppView` (`UIView`) на iOS, `NshView` (`View` Android) на Android, `AppView` на macOS, Windows, Linux и в приложениях GPUI. Размещайте его, как любое другое представление, на любом экране и столько раз, сколько нужно.

Корневой компонент на Rust входит в сборку приложения: приложение линкует ваш крейт и монтирует корневой компонент с помощью `AppSource::Rust` на `AppView` для macOS, Windows, Linux, GPUI и iOS ([Сборка с Rust](./rust.md#an-app-written-in-rust)). Приложение на TSX — это модуль, который загружает представление: при разработке с сервера разработки, в релизе из собранного бандла или загруженного подписанного пакета. Разделы ниже загружают модули TSX.

### iOS

Подключите `NativeShellDev.xcframework` в Debug и `NativeShell.xcframework` в Release ([Встраивание в приложения iOS](./ios.md)), затем:

```swift
import NativeShell

let app = NshAppView()
app.onError = { message in print("nsh error: \(message)") }
view.addSubview(app)   // and constrain it like any view

#if DEBUG
try app.connectDevServer(URL(string: "ws://127.0.0.1:8790/ws")!)   // `nsh dev my-app` on your Mac
#else
try app.loadBundle(at: Bundle.main.url(forResource: "bundle", withExtension: "nshc", subdirectory: "nsh")!)
#endif
```

`nsh dev my-app` передаёт модуль приложению и отправляет каждое сохранение, как `nsh run` делает это со своим хостом. Для релизной сборки `nsh build my-app --release --out MyApp/nsh` записывает бандл в папку, которую вы добавляете в ресурсы приложения.

### Android

Добавьте `nsh-dev.aar` для отладочных сборок и `nsh.aar` для релизных ([Встраивание в приложения Android](./android.md)), затем:

```kotlin
val nsh = NshView(this)
nsh.setErrorListener { message -> Log.e("nsh", message) }
setContentView(nsh)   // or add it to any layout

if (BuildConfig.DEBUG) {
    nsh.connectDevServer("ws://127.0.0.1:8790/ws")   // with `adb reverse tcp:8790 tcp:8790`
} else {
    nsh.loadAssetBundle("nsh")   // assets/nsh, from `nsh build my-app --release --out app/src/main/assets/nsh`
}
```

<a id="macos-windows-and-linux"></a>

### macOS, Windows и Linux

Десктопные приложения на Rust встраивают NSH с помощью `AppView` из крейтов `nsh-platform-macos`, `nsh-platform-windows`, `nsh-platform-linux` и `nsh-platform-gpui`: `NSView`, дочернего окна, виджета GTK или представления GPUI, которое монтирует корневой компонент на Rust или загружает собранный бандл. См. [macOS](./macos.md#embedding-in-a-mac-app), [Windows](./windows.md#embedding-in-a-win32-app), [Linux](./linux.md#embedding-in-a-gtk-app) и [GPUI](./gpui.md), а также [Платформы](./platforms.md#embed-in-a-native-app), где все хосты показаны рядом.

<a id="what-the-module-may-do"></a>

### Что модулю разрешено

На iOS и Android хост до загрузки решает, что модулю разрешено: `grantCapabilities` задаёт сетевые хосты и другие возможности, к которым он может обращаться, а лимиты ограничивают его память, время вызова и число узлов ([Песочница и возможности](./sandbox-and-capabilities.md)). Чтобы дать модулям собственные нативные представления (карту, диаграмму, компонент дизайн-системы), зарегистрируйте их как [нативные компоненты](./native-components.md).

<a id="ship-updates-as-signed-packages"></a>

## Доставка обновлений в виде подписанных пакетов

Модуль TSX, который приложение загружает после релиза, поставляется как подписанный пакет. Создайте корневой ключ один раз и храните его офлайн, заверьте им релизный ключ и опубликуйте:

```sh
nsh keygen keys/root && nsh keygen keys/release
nsh certify --root keys/root.secret --key keys/release.pub --apps 'com.example.*' -o keys/release.cert
nsh publish my-app --key keys/release.secret --cert keys/release.cert --build 2
```

Приложение доверяет открытому ключу корня и загружает то, что скачивает; NSH проверяет подпись, сертификат и список отзыва перед тем, как что-либо выполнить:

```swift
let support = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
let trust = try NshTrust(stateDirectory: support.appendingPathComponent("nsh"))
try trust.addRoot(rootPublicKey)   // the contents of keys/root.pub
let info = try await app.loadPackage(at: downloadedFile, trust: trust)
```

В Android тот же процесс работает с `NshTrust` и `NshPackage`. Хостинг, доставка и отзыв подробно: [Подписанные пакеты](./signed-packages.md).
<a id="or-ship-it-as-a-standalone-app"></a>

## Или поставьте как отдельное приложение

`nsh package` собирает устанавливаемое приложение, на Rust или TSX, без собственного проекта Xcode или сборки Gradle:

```sh
nsh package my-app --target ios-simulator --run
nsh package my-app --target android
nsh package my-app --target macos
nsh package my-app --target linux
nsh package my-app --target windows
nsh package my-app --target web
```

Приложение на Rust упаковывается с собственным раннером, собранным из вашего крейта и крейтов NSH, с примонтированным корнем; приложение на TSX упаковывается с готовым рантаймом. Параметры, подпись и иконки: [Упаковка](./packaging.md).

<a id="try-it-in-the-terminal"></a>

## Попробуйте в терминале

`nsh test` запускает приложение в headless-режиме, без устройства и окна. Получив `nsh.json` приложения на Rust или точку входа приложения на TSX, он открывает приложение, даёт ему поработать и печатает то, что оно монтирует; с `--trace` также печатает нативные операции над представлениями и время каждого коммита ([Тестирование](./testing-and-trace.md)):

```sh
nsh test my-app/nsh.json --trace     # a Rust app's root
nsh test my-app/App.tsx --trace      # a TSX app's entry
```

Если передать каталог, запускаются тесты приложения: `App.test.tsx` каждого шаблона открывает приложение, нажимает его кнопку и проверяет, что оно показывает (`nsh test my-app`). Тест приложения на Rust открывает его корень (`open(".")`); его также можно тестировать в `cargo test` с помощью `nsh_testing::Headless` ([Разработка на Rust](./rust.md#testing)).

<a id="next-steps"></a>

## Дальнейшие шаги

- [Разработка на Rust](./rust.md): приложения на Rust, их тема и TSX поверх крейта на Rust.
- [JSX и компоненты](./jsx-and-components.md) и [Реактивность](./reactivity.md): компоненты и сигналы, на Rust и
  TSX.
- [Платформы](./platforms.md): что поддерживает каждая платформа и её отдельная страница ([iOS](./ios.md),
  [Android](./android.md), [macOS](./macos.md), [Windows](./windows.md), [Linux](./linux.md)).
- [Подписанные пакеты](./signed-packages.md) и [Песочница и возможности](./sandbox-and-capabilities.md): доставка и то,
  что разрешено модулям.
- [Структура проекта](./project-structure.md): что находится в `nsh.json`, ресурсы, файлы.
