---
title: "macOS"
description: "Запуск приложений NSH на Rust и TSX на macOS в окнах AppKit, упаковка их в бандлы .app, встраивание в приложение для Mac с помощью AppView и особенности macOS."
order: 13
group: platforms
source_hash: 1b63a5bad9780b73
---

# macOS

Приложения NSH также работают как нативные приложения для Mac. Бэкенд macOS отрисовывает их с помощью представлений AppKit и Core Animation и раскладывает текст с помощью CoreText; ядро, реактивный граф, рендерер, раскладка Taffy и нативные модули такие же, как на iOS и Android, поэтому одно приложение работает везде. На macOS `os()` — это `Os::MacOs` (`platform.os` — это `"macos"` в TSX), и применяются props `desktop={{…}}` из TSX. Заголовок окна, собственная строка заголовка приложения, строка меню и контекстные меню задаются через `nsh_core::element::desktop` в Rust ([Desktop title bars](./rust.md#desktop-title-bars)) и [`nsh/desktop`](../modules/nsh-desktop.md) в TSX.

Бэкенд macOS ведёт себя как настольное приложение: ввод мышью, трекпадом и клавиатурой, окна с изменяемым размером, диалоги поверх окна и строка меню.

<a id="requirements"></a>

## Требования

- **macOS 14** или новее, на которой запускается приложение.
- Command line tools для Xcode (`xcode-select --install`) — для сборки раннеров Rust-приложений и среды выполнения NSH для macOS из исходников, а также для упаковки приложений (`codesign`, `sips`). Дистрибутив, созданный с помощью `cargo xtask dist` на Mac, поставляет среду выполнения TSX-приложений в `runtime/macos/`.

<a id="running-an-app"></a>

## Запуск приложения

Rust-приложение запускается из своей директории:

```sh
nsh run --target macos         # the default on a Mac
```

`nsh` собирает отладочный раннер с вашим крейтом и открывает приложение в окне, а его логи (`log::info!` и остальные) выводит в терминал; при изменении Rust-кода крейта раннер собирается заново, и приложение перезапускается. `cargo run` запускает тот же корневой компонент из `src/main.rs` крейта, который создаёт `nsh init --template rust`: [`run_app`](#embedding-in-a-mac-app) с `AppSource::Rust`.

TSX-приложение указывает свою точку входа:

```sh
nsh run App.tsx --target macos
```

Приложение открывается в окне AppKit (по умолчанию 1200×800) с горячей перезагрузкой, логами в терминале и оверлеем ошибок, как и на других платформах; Cmd+R перезагружает последнюю сборку. Строка меню и окно показывают имя приложения (`"name"` из nsh.json, иначе имя его директории). В исходниках `nsh run` сначала собирает хост для разработки (`nsh-macos-host`). Остановка `nsh run` закрывает окно, а закрытие окна завершает `nsh run`. Хост также может сам запустить готовый бандл:

```sh
nsh build my-app --release -o build
dist/nsh/runtime/macos/nsh-macos-host --bundle build/bundle.nshc --window-size 1200x800   # in a checkout: target/debug/nsh-macos-host
```

`--window-size` — начальный размер окна (для TSX-приложений); размер окна можно менять. `--display <n>` (`nsh run` / `nsh test
--target macos --display <n>`) centers it on display `n`: `1` — основной дисплей, тот, на котором находится строка меню.

`nsh test --target macos` запускает тесты TSX-приложения в окнах macOS, по возможности на втором дисплее (основной экран остаётся в вашем распоряжении; другой дисплей можно выбрать через `--display <n>`): каждое приложение, которое открывает тест, получает собственное окно размера, запрошенного тестом, даже если дисплей меньше; шаги выполняют клики, ввод и прокрутку системным вводом на представлениях, названных их селекторами ([Testing](./testing-and-trace.md#on-a-real-platform)).

<a id="performance-monitor"></a>

### Монитор производительности

`--fps` (`AppOptions { fps: true, .. }` в `run_app` Rust-приложения, `AppView::set_fps_monitor(true)` при встраивании, `nsh run App.tsx --target macos --fps`, `--fps` хоста или `open -a MyApp --args --fps` упакованного TSX-приложения) показывает в правом верхнем углу приложения панель, которая обновляется два раза в секунду:

| Строка | Что измеряет |
|---|---|
| `FPS` | Кадры, показанные за последнюю секунду: обновления дисплея, в которых приложение изменилось (простаивающее приложение показывает низкое значение; это не медленная работа). `max` — то, с чем справлялся главный поток, затем частота дисплея (120 Гц на экранах ProMotion). |
| `TICK` | Интервалы между обновлениями дисплея в том виде, в каком они приходили (среднее, p95), и `gap` — интервал p95 между показанными кадрами: одно обновление (8,3 мс при 120 Гц), если ничто не опаздывает. |
| `MAIN` | Время главного потока на кадр (применение изменений движка, отрисовка текста и canvas, анимации, ввод), его 95-й процентиль и `drop` — доля кадров, которые заняли больше одного обновления. |
| `JS` / `CORE` | На каждый коммит: ваш код (обработчики, таймеры, строки списков) и ядро NSH (раскладка, текст, сравнение); коммиты в секунду, изменения нативных представлений на коммит. |
| `HOP` | Сколько изменения ждут между потоком движка и главным потоком; насколько загружен поток движка. |
| `CPU` / `GPU` / `MEM` | Процесс: CPU (100% — одно ядро), его доля GPU, объём занимаемой памяти (значение из Activity Monitor). |

Полосы ниже показывают время главного потока за последние 120 кадров относительно одного обновления (линия): зелёный — в пределах половины, жёлтый — в пределах одного обновления, красный — больше. Пока панель показана, показания также раз в секунду записываются в лог (цель `nsh::perf`, в формате бэкенда Linux с фазами кадра macOS `tick`, `drain` и `canvas`; миллисекунды в виде mean/p50/p95/max), который показывает `nsh test --fps -v` и читает `examples/gallery/tools/perf.py`. Измеряйте release-сборки; пока монитор выключен, он ничего не стоит.

<a id="packaging"></a>

## Упаковка

```sh
nsh package --target macos [--run]           # a Rust app, from its directory
nsh package App.tsx --target macos [--run]   # a TSX app
```

Создаёт бандл приложения:

```text
.nsh/out/<Name>.app/Contents/
  Info.plist
  MacOS/<Name>               the executable: a Rust app's own runner, built with its crate; nsh's release runner for TSX
  Resources/nsh/bundle.nshc  a TSX app, compiled
  Resources/nsh/assets/…     the assets it imports (a Rust crate's `assets!()` too)
  Resources/nsh/app.json     the window title and the app's appearance
  Resources/AppIcon.icns     the icon, when nsh.json names one (converted with sips)
```

`.app` подписан ad hoc, поэтому запускается на том Mac, на котором собран. Чтобы распространять его, подпишите его сертификатом Developer ID и пройдите нотаризацию. `--run` открывает приложение после упаковки.

<a id="embedding-in-a-mac-app"></a>

## Встраивание в приложение для Mac

Крейт `nsh-platform-macos` (из репозитория NSH) даёт Rust-приложению для Mac `AppView`: один движок NSH в виде `NSView`. Каждый `AppView` независим; одновременно могут работать несколько. Он запускает корневой компонент на Rust — корневой компонент вашего крейта:

```rust
use std::rc::Rc;
use nsh_platform_macos::{
    objc2::MainThreadMarker, objc2_app_kit::NSWindow, set_ui_sets, AppOptions, AppView, Root,
};

fn show(window: &NSWindow) -> Rc<AppView> {
    // Once, before the first view: the UI sets the apps import (NSH's and your crate's).
    set_ui_sets(vec![nsh_base::registry(), my_app::registry()]);
    let mtm = MainThreadMarker::new().expect("main thread");
    let view = AppView::new(mtm, AppOptions::default());
    // register native components here, before loading
    view.load(Root::of::<my_app::App>().into());
    window.setContentView(Some(&view.view()));
    // Keep the view while the window shows it; `stop` it when the window closes.
    view
}
```

`Root::tokens` задаёт корню его [тему](./rust.md#theme) (`nsh_base::Theme::from_json(json)?.into_tokens()`), а `Root::app_id` — идентификатор, под которым хранятся его данные. В то же представление загружается TSX-бандл, созданный `nsh build`:

```rust
use nsh_platform_macos::{AppOptions, AppView, AssetBase, Bundle};

let view = AppView::new(mtm, AppOptions {
    asset_base: Some(AssetBase::Directory("app/assets".into())),
    ..AppOptions::default()
});
let code = std::fs::read_to_string("app/bundle.js").expect("bundle");
view.load(Bundle::source(code).into());
```

`AppView::load` заменяет всё, что работало; `stop` завершает приложение. `asset_base` сообщает, где разрешаются URI `asset:/` (`AssetBase::Directory` или `AssetBase::Http`). Бандлы с байткодом (`bundle.nshc`) загружаются с помощью `unsafe { Bundle::bytecode(bytes) }`: байткод — доверенные входные данные, поэтому загружайте его только из файлов вашего собственного приложения. Для приложения, которое является только приложением NSH, `run_app(source, options)` (`AppSource::Rust(root)` или `AppSource::Bundle(bundle)`) открывает один `AppView` в окне со стандартным меню (About, Hide, Quit, Edit, Minimize, Zoom, Enter Full Screen, Close), которое приложение может заменить через `Menu.setApplicationMenu` ([`nsh/desktop`](../modules/nsh-desktop.md)), и работает, пока окно не закроется. По умолчанию закрытие окна или выбор Quit останавливает движок и возвращает управление из `run_app`; после этого вызывающий код может завершить очистку или заново запустить свой исполняемый файл.

Установите `AppOptions { keep_alive_on_close: true, ..Default::default() }`, чтобы сохранять автономную сессию живой при закрытии её окна. Закрытие скрывает окно; повторное открытие из Dock показывает то же окно и тот же движок. Для явного выхода или перезапуска при обновлении вызовите `nsh_platform_macos::quit_app()` из любого потока. Он закрывает сохранённое окно, останавливает движок и возвращает управление из `run_app`. `nsh_core::element::desktop::close_window()` следует выбранной политике закрытия окна.

`AppOptions::cache` (или `AppView::set_cache` — для приложений, загружаемых следом) задаёт, где приложения хранят свои кэши, [загружаемые ими изображения](./images-and-assets.md#kept-on-disk) и сколько каждое из них хранит (`CacheOptions`: по умолчанию системная директория кэша и 256 МиБ изображений).

`AppView::set_locale(Some(locale))` и `AppView::set_font_scale(Some(scale))` задают приложению язык и размер текста вашего приложения вместо системных (`None` снова возвращает следование системным): `locale()`, `Intl`, `fontScale()` и текст сразу следуют за ними ([Device and environment](./device-and-environment.md#in-an-embedding-app)).

`AppView::set_theme_overrides(Some(json))` накладывает фирменный стиль вашего приложения поверх [темы](./tailwind.md#theme-tokens) приложения: файл темы в формате `"theme"` из `nsh.json`, токены которого имеют приоритет над одноимёнными токенами приложения в светлом и тёмном режимах, а остальные токены приложения сохраняются; классы вроде `bg-primary` немедленно меняют стиль, а приложения, загруженные позже, стартуют уже с ним (`None` возвращает приложению его собственную тему; файл, который не разбирается, — это ошибка, и ничего не меняется).

Нативные компоненты регистрируются через `AppView::register_component`; см. [Native components](./native-components.md#registering-on-macos-rust). `set_ui_sets(sets)` задаёт наборы UI, которые обслуживает каждый движок: набор NSH (`nsh_base::registry()`) и наборы ваших крейтов (`my_app::registry()`, которые создаёт `#[native_module]`), поэтому TSX, загружаемый представлением, импортирует и ваши компоненты и модули на Rust.

<a id="what-differs-on-macos"></a>

## Что отличается на macOS

Окружение — настольное: безопасная область и высота клавиатуры равны 0, `idiom()` — это desktop (`platform.idiom` равно `"desktop"`), `os_version()` (`platform.version`) — версия macOS, а тёмный режим сразу следует за системной темой оформления. См. [Device and environment](./device-and-environment.md).

Ввод — настольный: мышь, трекпад (прокрутка с инерцией, щипок и поворот) и клавиатура. Выделяемый текст выделяется перетаскиванием, двойным и тройным щелчком и копируется с помощью Cmd+C. Escape, Option+Left, Cmd+[ и кнопка «назад» на мыши закрывают самый новый диалог или возвращают назад в стеке (Escape в поле с фокусом или на веб-странице лишь снимает с него фокус; страница получает эти клавиши первой и сохраняет те, которые использует); `Dialog` — это слой поверх всего окна, который показывает всплывающее окно приложения и подложку. Страницы показывают свой `header` сверху. Щелчок в любом месте `Input`, включая его отступы, ставит каретку в ближайшую точку. `AlertDialog` показывает лист `NSAlert` на окне: до двух действий alert в ряд (действие отмены крайнее слева, последнее обычное — действие по умолчанию для Return), а большее число действий и действия action sheet располагаются столбцом в своём порядке, с действием отмены последним и без действия по умолчанию; Escape выбирает действие отмены.

<a id="keyboard"></a>

### Клавиатура

| Клавиши | Действие |
|---|---|
| Return | В `Input` — то, что задано в `submitBehavior`: отправить (`onSubmit`), отправить и покинуть поле или новая строка (многострочные поля ввода) |
| Return, Enter на цифровой клавиатуре, Space | Активируют представление в фокусе через `onPress` один раз при нажатии; автоповтор игнорируется |
| Shift+Return, Option+Return, Ctrl+Return | Новая строка в многострочном поле ввода, где return отправляет |
| Tab, Shift+Tab (также с Ctrl) | Следующее / предыдущее поле или нажимаемое представление в порядке на экране, в пределах самого нового диалога; Option+Tab вводит табуляцию в многострочном поле ввода |
| Escape | Покидает поле в фокусе; иначе снимает выделение текста, затем закрывает самый новый диалог или возвращает назад |
| Option+Left, Cmd+[, кнопка «назад» на мыши | Назад (не пока у поля есть фокус: там Option+Left перемещает каретку) |
| Option / Cmd + стрелки, с Shift; Option+Delete, Cmd+Delete; Ctrl+A / E / K | Перемещение, выделение и удаление по словам и строкам в поле, как в любом приложении для Mac |
| Cmd+Z, Shift+Cmd+Z, Cmd+X / C / V / A | Отмена, повтор, вырезать, копировать, вставить, выделить всё (поле `masked` не позволяет вырезать и копировать); Cmd+A / Cmd+C выделяют и копируют выделяемый текст |
| Стрелки; Page Up / Down, Space, Shift+Space, Option+Up / Down; Home / End, Cmd+Up / Down | Прокручивают scroll view вокруг представления в фокусе или под мышью на строку, страницу, в начало / конец (не пока у поля есть фокус) |
| Cmd+W, Cmd+M, Ctrl+Cmd+F, Cmd+H, Option+Cmd+H, Cmd+Q | Закрыть, свернуть, полный экран, скрыть, скрыть остальные, выйти (меню приложений `nsh package` и `nsh run`) |
| Cmd+R | Перезагружает последнюю сборку (`nsh run`) |

Собственные сочетания клавиш приложения ([`keymap`](../modules/nsh.md#keymap)) имеют приоритет над этими, кроме клавиш активации, адресованных нажимаемому представлению в фокусе, а также Quit, Hide, Minimize и Full Screen, которые назначить нельзя.

Сочетания клавиш работают с любой раскладкой клавиатуры (на кириллической или греческой Cmd+C — это клавиша, которая вводит C на раскладке US). Return, который подтверждает композицию метода ввода (китайский, японский и др.), никогда не отправляет. `onKeyPress` сообщает то же, что и React Native: набранный текст, `"Enter"`, `"Backspace"` и `"Escape"`.

Не поддерживается или отличается:

- **Масштабируемые scroll view** (`zoomTo`, props масштабирования).
- **`mixBlendMode`** и `brightness()` больше 1.
- **Поля ввода**: типы содержимого и автозаполнение, типы клавиатуры, автоматические заглавные буквы, межбуквенный интервал; вспомогательные представления ввода никогда не показываются (программной клавиатуры нет), а `keyboardShouldPersistTaps` игнорируется.
- **`scrollable={false}` у `WebView`** не даёт колесу мыши и трекпаду прокручивать страницу: они прокручивают scroll view приложения вокруг неё, как на iOS. Страница по-прежнему прокручивается с клавиатуры (Space, стрелки) и собственными скриптами, а смахивания трекпадом между её страницами (`allowsBackForwardNavigationGestures`) тоже прекращаются.
- **Доступность**: пользовательские `accessibilityActions`.
- **Строка состояния** и **гаптика** (у настольных систем нет аналога).

<a id="see-also"></a>

## См. также

- [CLI](./cli.md): `nsh run --target macos`, `nsh package --target macos`
- [Packaging](./packaging.md)
- [Platform-specific code](./platform-specific.md)
