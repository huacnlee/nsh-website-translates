---
title: "iOS"
description: "Запускайте приложения NSH на Rust и TSX на iOS с представлениями UIKit, в симуляторе или на устройствах, упаковывайте их в .app и .ipa и встраивайте в существующее приложение iOS с помощью AppView или NshAppView из NativeShell.xcframework."
order: 11
group: platforms
source_hash: d33e715d25f83ce4
---

# iOS

Приложения NSH работают на iOS с представлениями UIKit и текстом CoreText, на устройствах и в симуляторе, начиная с iOS 15.0. Приложения целиком запускаются и упаковываются так же, как на других платформах, а существующее приложение может показывать приложения NSH в своих представлениях: корневой компонент на Rust, который оно линкует, или TSX, который оно загружает, включая загружаемые им подписанные пакеты, в рамках лимитов и возможностей, которые оно задаёт. На iOS `os()` — это `Os::Ios` (`platform.os` — это `"ios"` в TSX), и действуют свойства `ios={{…}}` из TSX.

<a id="requirements"></a>

## Требования

- **Xcode** на Mac с средой выполнения симулятора iOS (`xcodebuild -downloadPlatform iOS` устанавливает её). См.
  [Установка](./installation.md#ios-and-mac-catalyst).
- Для приложений нужна **iOS 15.0** или новее, на iPhone и iPad.

<a id="running-an-app"></a>

## Запуск приложения

Приложение на Rust запускается из своего каталога, а приложение на TSX указывает свою точку входа:

```sh
nsh run --target ios                                  # a Rust app
nsh run --target ios --device "iPhone 16 Pro"
nsh run App.tsx --target ios                          # a TSX app
```

`nsh` использует уже запущенный симулятор или запускает новейший iPhone. Для приложения на Rust он собирает собственный раннер приложения вместе с вашим крейтом, устанавливает его и показывает его логи в терминале; при изменении Rust-кода крейта сборка выполняется снова, а приложение перезапускается. Для приложения на TSX он устанавливает хост для разработки и поддерживает приложение актуальным по мере сохранения файлов, а логи выводит в терминал. `--device` выбирает симулятор по имени или UDID. Для более быстрого цикла без симулятора `nsh run --target catalyst` на Mac открывает тот же бэкенд UIKit в окне размером с iPhone на основе [Mac Catalyst](./getting-started.md#mac-catalyst).

<a id="packaging"></a>

## Упаковка

```sh
nsh package --target ios-simulator --run      # .nsh/out/<Name>.app, installed and launched in the simulator
nsh package --target ios --sign "Apple Distribution: Example Inc (ABCDE12345)" --profile AppStore.mobileprovision
```

Из каталога приложения на Rust приложением становится раннер iOS, собранный с вашим крейтом; приложение на TSX указывает свою точку входа (`nsh package App.tsx --target ios-simulator --run`).

`--target ios` создаёт подписанный `.ipa` для устройств, TestFlight или App Store. Подписывающие идентификаторы, профили provisioning и иконки: [Упаковка](./packaging.md#ios-devices).

<a id="embedding-in-an-ios-app"></a>

## Встраивание в приложение iOS

Существующее приложение iOS может показывать приложения NSH внутри собственного интерфейса. Приложение iOS с кодом на Rust линкует ваш крейт и крейт `nsh-platform-ios` и показывает ваш корневой компонент в `AppView` ([Встраивание приложения на Rust](#embedding-a-rust-app)). Приложение на Swift линкует `NativeShell.xcframework`, фреймворк с модулем Swift: вы создаёте `NshAppView` (`UIView`), добавляете его в любое место иерархии представлений и загружаете в него приложение на TSX или подписанный пакет. Ваши нативные экраны, навигация и приложение NSH сосуществуют в одной иерархии UIKit.

Каждое представление — это один независимый движок; глобальных синглтонов нет, поэтому приложение может показывать сразу несколько приложений NSH, например по одному на вкладку.

<div class="diagram-scroll">
<img class="diagram diagram-light" src="/diagrams/host-app-light.svg" alt="One host app with two NshAppView regions: each is its own engine with its own thread, VM, limits and capabilities; the host grants capabilities, sets limits and registers native components such as a map.">
<img class="diagram diagram-dark" src="/diagrams/host-app-dark.svg" alt="One host app with two NshAppView regions: each is its own engine with its own thread, VM, limits and capabilities; the host grants capabilities, sets limits and registers native components such as a map.">
</div>

<a id="embedding-a-rust-app"></a>

## Встраивание приложения на Rust

`nsh_platform_ios::AppView` — это один движок в виде `UIView` для приложения iOS, написанного на Rust: он монтирует корневой компонент вашего крейта без участия виртуальной машины JavaScript.

```rust
use nsh_platform_ios::{set_ui_sets, AppView, Root, SurfaceOptions};
use objc2::MainThreadMarker;
use objc2_ui_kit::UIView;

fn show(container: &UIView) -> AppView {
    // Once, before the first view: the UI sets the apps import (NSH's and your crate's).
    set_ui_sets(vec![nsh_base::registry(), my_app::registry()]);
    let mtm = MainThreadMarker::new().expect("main thread");
    let app = AppView::new(mtm, container.bounds(), SurfaceOptions::default());
    container.addSubview(app.view());
    app.run(Root::of::<my_app::App>());
    // Keep the AppView: dropping it stops the app.
    app
}
```

Представление изменяет размер вместе со своим superview. `AppView::run` заменяет всё, что работало до этого; `AppView::load` вместо этого запускает бандл TSX (`Bundle::source` или `unsafe { Bundle::bytecode(bytes) }` для `bundle.nshc` в бандле приложения). `SurfaceOptions` хранит лимиты, предоставленные возможности, каталог данных и нативные компоненты, как и перечисленные ниже члены `NshAppView`; `AppView::set_locale`, `set_font_scale` и `set_error_handler` соответствуют `locale`, `fontScale` и `onError`. `nsh package --target ios` собирает такое приложение за вас, с уже смонтированным корневым компонентом.

<a id="get-the-framework"></a>

## Получение фреймворка

Дистрибутив содержит оба варианта:

```text
dist/nsh/embed/ios/NativeShell.xcframework      release: bundles and signed packages
dist/nsh/embed/ios/NativeShellDev.xcframework   also connects to a `nsh dev` server
```

Из репозитория NSH можно собрать только фреймворки:

```sh
cargo xtask ios-embed    # writes dist/nsh/embed/ios/{NativeShell,NativeShellDev}.xcframework
```

Сборка по умолчанию создаёт статические фреймворки. Чтобы собрать динамические фреймворки, используйте:

```sh
cargo xtask ios-embed --dynamic
```

Динамические фреймворки дают среде выполнения собственный образ библиотеки и собственную таблицу раскрутки стека, что поддерживает хост-приложения, уже линкующие другие среды выполнения Rust. Выберите приведённую ниже настройку встраивания в Xcode в соответствии с собираемым фреймворком.

По умолчанию каждый XCFramework содержит три слайса arm64: устройства iOS, симулятор iOS (Apple silicon) и Mac Catalyst. Минимальная целевая версия развёртывания — iOS 15.0. Модуль Swift компилируется с library evolution, поэтому приложения, собранные другими версиями компилятора Swift, могут его импортировать, а фреймворк линкует всё необходимое: ничего дополнительно добавлять не нужно.

<a id="add-it-to-an-xcode-project"></a>

## Добавление в проект Xcode

1. Перетащите `NativeShell.xcframework` (или `NativeShellDev.xcframework` для сборок разработки) в раздел **Frameworks, Libraries, and Embedded Content** целевого приложения. Выберите **Do Not Embed** для статических фреймворков по умолчанию или **Embed & Sign** для динамических фреймворков, собранных с `--dynamic`.
2. В Swift: `import NativeShell`.
3. В `Info.plist` приложения установите `CADisableMinimumFrameDurationOnPhone` в `YES`: на iPhone с ProMotion анимации приложения тогда работают на 120 Гц, как и прокрутка (у приложений, собранных `nsh package`, это включено).

> [!TIP]
> Линкуйте `NativeShellDev.xcframework` в конфигурации Debug, а `NativeShell.xcframework` в Release, чтобы к dev-серверу могли подключаться только сборки разработки.

<a id="ship-a-bundle-with-the-app"></a>

## Поставка бандла вместе с приложением

Приложение на Swift поставляет приложения на TSX в виде бандлов. Соберите приложение NSH в папку и добавьте её в ресурсы приложения как folder reference с именем `nsh`:

```sh
nsh build App.tsx --release --out MyApp/nsh
```

`nsh build` создаёт:

| Файл | Содержимое |
|---|---|
| `bundle.nshc` | Приложение, скомпилированное в байт-код: загружается быстрее всего. |
| `bundle.js` | То же приложение в виде исходного кода JS. |
| `bundle.js.map` | Его source map (трассировки стека указывают на ваши файлы `.tsx`). |
| `capabilities.json` | [Возможности](./sandbox-and-capabilities.md), которые объявляет приложение, если они есть в `nsh.json`. |
| `assets/` | Изображения и шрифты, которые импортирует приложение, по путям относительно точки входа. |

<a id="show-the-app"></a>

## Показ приложения

```swift
import NativeShell
import UIKit

final class EmbedController: UIViewController {
    private let app = NshAppView()

    override func viewDidLoad() {
        super.viewDidLoad()
        app.translatesAutoresizingMaskIntoConstraints = false
        app.onError = { message in print("nsh error: \(message)") }
        view.addSubview(app)
        NSLayoutConstraint.activate([
            app.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            app.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            app.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            app.bottomAnchor.constraint(equalTo: view.bottomAnchor),
        ])

        guard let url = Bundle.main.url(forResource: "bundle", withExtension: "nshc", subdirectory: "nsh") else { return }
        do {
            try app.loadBundle(at: url)
        } catch {
            print("cannot load: \(error)")
        }
    }

    // Let the embedded app's pages and dialogs decide the status bar.
    override var preferredStatusBarStyle: UIStatusBarStyle { NshAppView.preferredStatusBarStyle }
    override var prefersStatusBarHidden: Bool { NshAppView.prefersStatusBarHidden }
    override var preferredStatusBarUpdateAnimation: UIStatusBarAnimation {
        NshAppView.preferredStatusBarUpdateAnimation
    }
}
```

Размер представления — это окно приложения: NSH раскладывает приложение по границам представления и делает это снова при каждом их изменении. Повторная загрузка заменяет запущенное приложение; приложение останавливается при освобождении представления.

Полный пример, приложение UIKit, которое показывает приложение NSH под собственной нативной шапкой, — `examples/embed-ios/main.swift`.

## `NshAppView`

`NshAppView` — это подкласс `UIView`, изолированный на главном акторе.

| Член | Описание |
|---|---|
| `init(frame: CGRect = .zero, trace: Bool = false)` | Создаёт представление. `trace` логирует время каждого коммита. `init?(coder:)` поддерживает storyboard и nib. |
| `onError: ((String) -> Void)?` | Получает фатальные ошибки приложения (бандл, который не удалось загрузить, необработанные исключения JS, ВМ, остановленная лимитом) в главном потоке. Ошибки всегда логируются; сборки разработки дополнительно показывают их поверх приложения. |
| `limits: NshLimits` | Лимиты ВМ для приложений, загружаемых начиная с этого момента. |
| `grantCapabilities(_ json: String?) throws` | Максимум, что смогут делать приложения, загружаемые начиная с этого момента, в виде JSON в формате `nsh.json` из `capabilities`; `nil` предоставляет то, что объявляет каждое приложение. Выбрасывает `NshError` при некорректном JSON. |
| `locale: Locale?` | Язык и регион приложения вместо пользовательских: `Intl`, `locale()` и компоненты сразу следуют им, а приложения, загруженные позже, запускаются с ними. `nil` следует системным. |
| `fontScale: CGFloat?` | Размер текста вместо размера из Dynamic Type (1 — по умолчанию): тексты и поля ввода заново раскладываются с этим размером, и `fontScale()` читает его, сразу и для приложений, загруженных позже; длины сохраняют свой размер. `nil` следует системному. |
| `setThemeOverrides(_ json: String?) throws` | Бренд хоста поверх [темы](./tailwind.md#theme-tokens) приложения: файл темы в формате `nsh.json` из `"theme"`. Его токены имеют приоритет над токенами приложения с теми же именами, в светлом и тёмном режиме, а остальные токены приложения сохраняются. Применяется сразу и к приложениям, загруженным позже; `nil` возвращает приложению его собственную тему. Выбрасывает `NshError` для файла, который не разбирается. |
| `storageDirectory: URL?` | Где приложения, загружаемые начиная с этого момента, хранят своё [хранилище](../modules/nsh.md#storage); `nil`: `Library/Application Support/nsh/<app id>` по собственному id приложения. |
| `cacheOptions: NshCacheOptions` | Где приложения, загружаемые начиная с этого момента, хранят свои кэши, [загружаемые ими изображения](./images-and-assets.md#kept-on-disk), и сколько хранит каждое: `location` `.system` (`Library/Caches/nsh`, каждое приложение в `<app id>`), `.directory(URL)` или `.off`; `images` `.default` (256 МБ), `.maxSize(megabytes:)` или `.off`. |
| `loadBundle(at url: URL) throws` | Запускает бандл, созданный `nsh build`. Ассеты берутся из `assets/` рядом с ним; `bundle.js.map` и `capabilities.json` рядом с ним тоже читаются. |
| `run(_ package: NshPackage)` | Запускает проверенный подписанный пакет (см. ниже). Пакет запускается один раз. |
| `loadPackage(at:trust:) async throws -> NshPackage.Info` | Проверяет пакет по URL вне главного потока, затем запускает его. Выбрасывает ошибку с причиной отказа; запущенное приложение остаётся. |
| `connectDevServer(_ url: URL) throws` | Разработка: загружает с сервера `nsh dev` и перезагружает при каждом изменении. Выбрасывает ошибку с `NativeShell.xcframework`, в котором нет поддержки разработки. |
| `register(component:_:)` | Регистрирует [нативный компонент](./native-components.md). |
| `params: [String: Any]` | Параметры запуска приложений, загружаемых начиная с этого момента: приложение читает их при старте как `host.params` ([`host`](../modules/nsh.md#host)). |
| `send(_ name: String, _ data: Any? = nil)` | Отправляет событие приложению (`host.on(name, …)`); хранится, пока приложение не начнёт его слушать, или для следующего приложения, пока ни одно не запущено. |
| `handle(_ name: String, _ handler:)` | Обрабатывает вызовы (`host.call`) и сообщения (`host.post`) приложения с именем `name` в главном потоке: `{ data, reply in … }` или функция `async throws` `{ data in … }`, результат которой отвечает на вызов. |
| `removeHandler(_ name: String)` | Удаляет обработчик `name`: вызовы этого имени из приложения сразу завершаются ошибкой. |
| `static preferredStatusBarStyle`, `prefersStatusBarHidden`, `preferredStatusBarUpdateAnimation` | То, что запросили запущенные приложения (`statusBar` их страниц и диалогов, значение по умолчанию `nsh.json`): возвращайте их из переопределений в hosting view controller. |

> [!IMPORTANT]
> `bundle.nshc` (байт-код) загружается только изнутри бандла приложения. QuickJS не проверяет байт-код, поэтому байт-код из любого другого места мог бы повредить память: для файла вне бандла приложения загружайте `bundle.js` (исходный код JS) или, лучше, [подписанный пакет](./signed-packages.md).

`limits`, `grantCapabilities`, `storageDirectory` и `cacheOptions` применяются начиная со следующей загрузки: задавайте их до `loadBundle` / `run`.

Каждое приложение хранит своё хранилище под собственным id без какой-либо настройки: подписанный пакет — под id, за который ручается сертификат его ключа релиза, бандл — под `id` из его `nsh.json` (`app.json` рядом с ним, создаётся `nsh build`). Задайте `storageDirectory`, чтобы хранить данные приложения в месте по выбору хоста:

```swift
app.storageDirectory = FileManager.default
    .urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
    .appendingPathComponent("nsh/com.example.orders")
try app.loadBundle(at: url)
```

<a id="talking-to-the-app"></a>

## Общение с приложением

Представление и запущенное в нём приложение общаются через собственный канал ([`host`](../modules/nsh.md#host)): параметры запуска, которые приложение читает при старте, события от хост-приложения, а также вызовы и сообщения от приложения, с данными в формате JSON (на этой стороне — объекты Foundation). Для этого не нужны ни представление в приложении, ни нативный компонент.

```swift
// Before loading: what the app opens first (`host.params` in TSX).
app.params = ["conversation": notification.conversationID]
try app.loadBundle(at: url)

// The app's `await host.call("user.profile", { id })`: return the answer, or throw to reject it.
app.handle("user.profile") { data in
    let id = (data as? [String: Any])?["id"] as? Int ?? 0
    let profile = try await api.profile(id: id)
    return ["id": id, "name": profile.name]
}

// A handler that answers later, from any thread, with its reply.
app.handle("photo.pick") { _, reply in
    picker.present { url in
        if let url { reply.resolve(url.absoluteString) } else { reply.reject("cancelled") }
    }
}

// The app's `host.post("analytics", …)`: no answer.
app.handle("analytics") { data, _ in analytics.log(data) }

// Later: the app hears `host.on("conversation.open", …)`.
app.send("conversation.open", ["id": tapped.conversationID])
```

Обработчики выполняются в главном потоке; вызов ждёт ответа в приложении, не блокируя ни одну из сторон. Ответ, освобождённый без ответа, завершает вызов ошибкой, а вызов имени без обработчика сразу завершается ошибкой. События с именами, которые приложение пока не слушает, сохраняются, пока оно не начнёт их слушать, а события, отправленные, когда приложение не запущено (до `loadBundle`, во время перезагрузки), попадают к следующему, так что нажатое уведомление, пришедшее во время запуска приложения, всё равно до него дойдёт.

<a id="theme-overrides"></a>

## Переопределение темы

Одно приложение, встроенное в несколько брендированных хост-приложений, принимает бренд каждого хоста: хост передаёт токены, которые меняет его бренд, в виде файла темы в формате `nsh.json` из `"theme"` (`cssVars` из shadcn/ui, значения записываются так, как их пишет CSS). Они имеют приоритет над токенами приложения с теми же именами; остальные токены приложения сохраняются. Значение токена для тёмного режима задаётся в `dark` (токен, заданный только в `light` или `theme`, имеет этот цвет в обоих режимах):

```swift
try app.setThemeOverrides("""
{ "cssVars": {
    "theme": { "radius": "0.75rem" },
    "light": { "primary": "#e11d48", "primary-foreground": "#ffffff" },
    "dark": { "primary": "#fb7185", "primary-foreground": "#1c1917" }
} }
""")
try app.loadBundle(at: url)
```

Вызывайте до или после загрузки: классы вроде `bg-primary` и `rounded-(--radius)` сразу меняют стиль, а каждое приложение, загруженное позже, стартует с переопределениями уже в первом кадре. `setThemeOverrides(nil)` возвращает приложению его собственную тему.

<a id="links-the-app-opens"></a>

## Ссылки, которые открывает приложение

URL, которые открывает приложение ([`openUrl`](../modules/nsh.md#openurl), ссылки `TextView` с `links="open"`), сначала попадают в `onOpenURL` в главном потоке: верните `true`, если хост-приложение обработало URL, например направив его через собственный роутер, и `false`, чтобы система открыла его через `UIApplication.open`. Без `onOpenURL` система открывает каждый URL. URL попадают в него после того, как их разрешила возможность `openUrl` приложения.

```swift
app.onOpenURL = { url in
    // The host app's own links open in the host app.
    if url.scheme == "lb" || url.host == "longbridge.com" {
        router.open(url)
        return true
    }
    return false
}
```

<a id="limits"></a>

## Лимиты

```swift
app.limits = NshLimits(memoryMB: 128, callBudget: 1, maxNodes: 50_000)
```

| Поле `NshLimits` | По умолчанию | Значение |
|---|---|---|
| `memoryMB: UInt32?` | 256 | Куча JS в МБ. При исчерпании приложение останавливается. |
| `stackKB: UInt32?` | 4096 (это и максимум) | Стек интерпретатора в КБ. Более глубокая рекурсия выбрасывает `RangeError`. |
| `loadBudget: TimeInterval?` | 10 с | Время на вычисление бандла. |
| `callBudget: TimeInterval?` | 2 с | Время любого другого вызова в JS (одно событие, один таймер, один кадр). Вызов, превысивший лимит, прерывается. |
| `maxNodes: UInt32?` | 200 000 | Узлы, которые приложение может хранить. |

`nil` оставляет значение по умолчанию. Что делает каждый лимит при достижении: [Песочница и возможности](./sandbox-and-capabilities.md).

<a id="capabilities"></a>

## Возможности

Приложение объявляет, к чему оно может обращаться, в своём `nsh.json`; встраивающее приложение может предоставить меньше. Запрос должен быть разрешён обеими сторонами:

```swift
try app.grantCapabilities("""
{
  "network": { "hosts": ["api.example.com", "*.cdn.example.com"] },
  "webview": { "hosts": ["help.example.com"] }
}
""")
try app.loadBundle(at: url)
```

Здесь приложение не может управлять строкой состояния (нет `statusBar`), даже если его `nsh.json` этого требует. Подробности: [Песочница и возможности](./sandbox-and-capabilities.md).

<a id="signed-packages"></a>

## Подписанные пакеты

Чтобы запускать код, который приложение загружает (обновления, сторонние мини-приложения), используйте [подписанные пакеты](./signed-packages.md): `nsh publish` создаёт `.nshpkg`, подписанный ключом релиза, который сертифицировал ваш корневой ключ, а приложение проверяет его перед запуском.

```swift
let support = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
let trust = try NshTrust(stateDirectory: support.appendingPathComponent("nsh"))
try trust.addRoot(rootPublicKey)   // the contents of root.pub from `nsh keygen`

Task {
    do {
        let info = try await app.loadPackage(at: downloadedFile, trust: trust)
        print("running \(info.id) \(info.version) (build \(info.build))")
    } catch {
        print("refused: \(error)")   // the running app stays
    }
}
```

Чтобы сначала проверить, а запустить позже, разделите два шага:

```swift
let package = try await trust.openPackage(at: downloadedFile)   // verifies off the main thread
// ... decide, ask the user, ...
app.run(package)
```

| API | Описание |
|---|---|
| `NshTrust(stateDirectory: URL) throws` | Открывает или создаёт хранилище доверия. В нём сохраняется его состояние (новейший список отзыва, наибольшая принятая сборка для каждого приложения), и под ним распаковываются ассеты пакетов. Не доверяет ни одному ключу до `addRoot`. Потокобезопасно. |
| `addRoot(_ publicKey: String) throws` | Доверяет корневому открытому ключу (base64, содержимое файла `.pub`). Можно доверять нескольким корневым ключам. |
| `updateRevocations(_ json: String) throws` | Применяет список отзыва, созданный `nsh revoke`, подписанный доверенным корневым ключом и более новый, чем тот, что есть в хранилище. |
| `openPackage(at: URL) async throws -> NshPackage` | Проверяет, распаковывает ассеты и принимает пакет (более старые сборки этого приложения с этого момента отклоняются). |
| `NshPackage.info` | `id`, `name`, `version`, `build` приложения внутри. |
| `NshError` | Ошибка, которую выбрасывает каждый вызов, способный выбросить ошибку; `message` объясняет причину. |
<a id="development"></a>

## Разработка

С `NativeShellDev.xcframework` направьте представление на dev-сервер вместо бандла:

```swift
#if DEBUG
try app.connectDevServer(URL(string: "ws://127.0.0.1:8790/ws")!)
#else
try app.loadBundle(at: bundledURL)
#endif
```

Запустите `nsh dev App.tsx` на вашем Mac. Симулятор использует сеть Mac, поэтому `127.0.0.1` достигает сервера; устройство использует адрес в локальной сети, который выводит `nsh dev` (`devices on this network: ws://192.168.1.20:8790/ws`). Каждое сохранение обновляет приложение на месте, логи появляются в терминале `nsh dev`, а ошибки отображаются поверх приложения. См. [Dev-сервер и отладка](./dev-server-and-debugging.md).

> [!NOTE]
> На устройстве соединение с вашим Mac представляет собой обычный трафик локальной сети по открытому `ws://` и `http://` (ресурсы).
> iOS может запросить у пользователя доступ к локальной сети, а настройки App Transport Security приложения должны это разрешать.

<a id="notes"></a>

## Примечания

- **Потоки.** `NshAppView` изолирован на main actor. `NshTrust`, `NshPackage` и `NshComponentContext` потокобезопасны.
  JS-движок работает в собственном потоке; главный поток никогда не ждёт его.
- **Строка состояния.** Страницы и диалоги встроенного приложения (`statusBar`) меняют значения, которые возвращают `NshAppView.preferredStatusBarStyle` и связанные методы;
  хостящий view controller должен пробрасывать их, как в примере выше.
- **Безопасная область.** Приложения используют `safe_area()` в Rust, а в TSX, как обычно, — `env(safe-area-inset-*)` в отступах или
  `safeAreaInsets()` из [`nsh`](../modules/nsh.md#safe-area-and-keyboard). `NshAppView`, размещённый под вашим собственным заголовком, получает применимые к нему отступы, а не отступы окна.
- **Mac Catalyst.** Тот же фреймворк работает в приложениях Catalyst.

<a id="see-also"></a>

## См. также

- [Сборка с помощью Rust](./rust.md)
- [Встраивание в приложения Android](./android.md)
- [Нативные компоненты](./native-components.md)
- [Подписанные пакеты](./signed-packages.md)
- [Песочница и разрешения](./sandbox-and-capabilities.md)
