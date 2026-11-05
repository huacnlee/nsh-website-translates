---
title: "Windows"
description: "Запуск приложений NSH на Rust и TSX в окнах Win32, отрисовываемых с помощью Direct2D, их упаковка, встраивание в приложение Win32 через AppView и отличия на Windows."
order: 14
group: platforms
source_hash: d39f39f9d32017d0
---

# Windows

Приложения NSH работают и на Windows. Бэкенд Windows отрисовывает их в окнах Win32 с помощью Direct2D и размечает текст с помощью DirectWrite; ядро, реактивный граф, рендерер, layout на Taffy и нативные модули те же, что на iOS и Android, поэтому одно приложение работает везде. В Windows `os()` — это `Os::Windows` (`platform.os` — это `"windows"` в TSX), и применяются пропсы `desktop={{…}}` из TSX. Заголовок окна, собственная строка заголовка приложения, строка меню и контекстные меню задаются через `nsh_core::element::desktop` в Rust ([Desktop title bars](./rust.md#desktop-title-bars)) и [`nsh/desktop`](../modules/nsh-desktop.md) в TSX.

<a id="requirements"></a>

## Требования

- **Windows 10 1809** или новее, либо Windows 11.
- **WebView2 Runtime** для веб-представлений. Он входит в состав Windows 11 и Microsoft Edge в Windows 10; без него `WebView` показывает заглушку.
- **Кодеки Media Foundation** для видеоформатов, которые воспроизводит ваше приложение (видео воспроизводится штатным медиастеком Windows).
- Чтобы собрать раннер Rust-приложения: Visual Studio Build Tools с рабочей нагрузкой C++ и Windows SDK. Чтобы собрать рантайм NSH для Windows (из репозитория или `cargo xtask dist` в Windows), также нужен LLVM (для биндингов QuickJS).

<a id="running-an-app"></a>

## Запуск приложения

В Windows `nsh run` открывает приложение в окне. Rust-приложение запускается из своего каталога:

```sh
nsh run                        # --target windows is the default on Windows
```

`nsh` собирает отладочный раннер вместе с вашим крейтом и открывает приложение; его логи (`log::info!` и остальные) выводятся в терминал. При изменении Rust-кода крейта раннер пересобирается, а приложение перезапускается. `cargo run` запускает тот же корень из `src/main.rs` крейта, который создаёт `nsh init --template rust`: [`run_app`](#embedding-in-a-win32-app) с `AppSource::Rust`.

TSX-приложение указывает свою точку входа и по умолчанию открывается в окне 1200×800 с hot reload, логами в терминале и оверлеем ошибок, как и на других платформах:

```sh
nsh run App.tsx
```

В репозитории `nsh run` сначала собирает хост для разработки (`nsh-windows-host.exe`); дистрибутив, собранный на Windows, поставляет его в `runtime\windows\`. Ctrl-C закрывает окно, а закрытие окна завершает `nsh run`; хост никогда не переживает `nsh`, как бы тот ни завершился. Хост также может самостоятельно запускать собранный бандл:

```sh
nsh build my-app --release -o build
dist\nsh\runtime\windows\nsh-windows-host --bundle build\bundle.nshc --window-size 390x844   # in a checkout: target\debug\nsh-windows-host
```

`--window-size` — размер окна в пунктах (`<width>x<height>`; для TSX-приложений).

<a id="performance-monitor"></a>

### Монитор производительности

`--fps` (`nsh run App.tsx --target windows --fps`, `nsh test --target windows --fps`, `--fps` хоста или `AppOptions { fps: true, .. }` в `run_app` Rust-приложения) раз в секунду выводит в лог показания монитора производительности (target `nsh::perf`): показанные кадры относительно частоты дисплея, время главного потока на кадр и его фазы (`tick`, `drain`, `paint`, `present`, `canvas`), коммиты движка, CPU и память — в том же виде, что и на других desktop-платформах (миллисекунды в формате mean/p50/p95/max). `nsh test --fps -v` показывает их, а `examples/gallery/tools/perf.py` считывает ([Performance report](./performance-report.md#windows-win32-direct2d)). Измеряйте release-сборки; пока монитор выключен, он ничего не стоит.

<a id="packaging"></a>

## Упаковка

```sh
nsh package --target windows [--run]           # a Rust app, from its directory
nsh package App.tsx --target windows [--run]   # a TSX app
```

Создаёт каталог и тот же каталог в виде архива:

```text
.nsh\out\<Name>\
  <Name>.exe             the executable, with the app's icon: a Rust app's own runner, built with its crate; nsh's release runner for TSX
  nsh\bundle.nshc         a TSX app, compiled
  nsh\assets\…           the assets it imports (a Rust crate's `assets!()` too)
  nsh\app.json           the window title, the app id, the version and the appearance
.nsh\out\<Name>.zip
```

Исполняемый файл ищет `nsh\` рядом с собой; скопируйте весь каталог (или распакуйте `.zip`) туда, где должно жить приложение: ничего не устанавливается. Значок из `nsh.json` встраивается в исполняемый файл (его показывают Проводник и панель задач) без каких-либо дополнительных инструментов; при упаковке в другой системе остаётся значок по умолчанию. Идентификатор приложения группирует окна приложения на панели задач. `--run` запускает приложение после упаковки. Исполняемый файл не подписан: чтобы распространять его, подпишите его своим сертификатом (`signtool`).

<a id="embedding-in-a-win32-app"></a>

## Встраивание в приложение Win32

Крейт `nsh-platform-windows` (из репозитория NSH) даёт Rust-приложению на Win32 `AppView`: один движок NSH в дочернем окне вашего окна. Каждый `AppView` независим; одновременно могут работать несколько. Он запускает Rust-корень — корневой компонент вашего крейта:

```rust
use std::rc::Rc;
use nsh_platform_windows::{
    windows::{self, Win32::{Foundation::HWND, System::Ole::OleInitialize, UI::WindowsAndMessaging::MoveWindow}},
    set_ui_sets, AppOptions, AppView, Root,
};

/// Called on the thread that runs your message loop, with your window.
fn embed(parent: HWND) -> windows::core::Result<Rc<AppView>> {
    // Once per thread: COM and OLE (the clipboard, image decoding).
    unsafe { OleInitialize(None)? };
    // Once, before the first view: the UI sets the apps import (NSH's and your crate's).
    set_ui_sets(vec![nsh_base::registry(), my_app::registry()]);
    let view = AppView::new(
        Some(parent),
        AppOptions {
            app_id: "com.example.host".into(),
            ..AppOptions::default()
        },
    )?;
    // register native components here, before loading
    view.load(Root::of::<my_app::App>().into());
    Ok(view)
}

// On WM_SIZE of `parent`:
// unsafe { MoveWindow(view.hwnd(), 0, 0, width, height, true) };
```

TSX-бандл, собранный `nsh build`, загружается в то же представление, если указать в `asset_base` его каталог `assets`:

```rust
let code = std::fs::read_to_string("app/bundle.js").expect("bundle");
view.load(Bundle::source(code).into());
```

Представление — это дочернее окно: его обслуживает ваш цикл сообщений, а при изменении размера родителя вы размещаете его с помощью `MoveWindow` у его `hwnd()`. Создавайте его в потоке того окна, в котором оно находится: его жизненный цикл следует за окном верхнего уровня, под которым оно было создано. `AppView::load` заменяет то, что работало; `stop` (или уничтожение окна) завершает приложение. `asset_base` сообщает, где разрешаются URI `asset:/` (`AssetBase::Directory` или `AssetBase::Http`). Бандлы с байткодом (`bundle.nshc`) загружаются с помощью `unsafe { Bundle::bytecode(bytes) }` (или `Bundle::read_trusted(path)`, также unsafe): байткод QuickJS — доверенный ввод, поэтому загружайте его только из файлов вашего собственного приложения. Отдельное окно создаётся через `nsh_platform_windows::run_app(source, options)` с помощью `AppSource::Rust(root)` или `AppSource::Bundle(bundle)`. `Root::tokens` задаёт корню [тему](./rust.md#theme), а `Root::app_id` — идентификатор, под которым хранятся его данные.

`AppOptions::cache` (или `AppView::set_cache` для приложений, загружаемых следом) задаёт, где приложения хранят свои кэши и [загружаемые изображения](./images-and-assets.md#kept-on-disk) и какой объём каждое из них занимает (`CacheOptions`: по умолчанию системный каталог кэша и 256 МиБ для изображений).

`AppView::set_locale(Some(locale))` и `AppView::set_font_scale(Some(scale))` задают приложению язык и размер текста вашего приложения вместо системных (`None` снова возвращает системные): `locale()`, `Intl`, `fontScale()` и текст изменяются сразу ([Device and environment](./device-and-environment.md#in-an-embedding-app)).

`AppView::set_theme_overrides(Some(json))` накладывает фирменный стиль вашего приложения поверх [темы](./tailwind.md#theme-tokens) приложения: это файл темы в формате `"theme"` из `nsh.json`, токены которого перекрывают одноимённые токены приложения в светлом и тёмном режимах, а остальные токены приложения сохраняются; классы вроде `bg-primary` обновляют стиль сразу, а приложения, загруженные позже, стартуют уже с ним (`None` возвращает приложению его собственную тему; файл, который не разбирается, — это ошибка, и ничего не меняется).

Нативные компоненты регистрируются с помощью `AppView::register_component`; см. [Native components](./native-components.md#registering-on-windows-rust). `set_ui_sets(sets)` задаёт наборы UI, которые обслуживает каждый движок: NSH (`nsh_base::registry()`) и ваши крейты (`my_app::registry()`, который создаёт `#[native_module]`), поэтому TSX, который загружает представление, может импортировать и ваши Rust-компоненты и модули.

<a id="what-differs-on-windows"></a>

## Что отличается в Windows

Окружение — десктопное: безопасная область и высота клавиатуры равны 0, `idiom()` — это десктоп (`platform.idiom` — это `"desktop"`), а `os_version()` (`platform.version`) — это `"10.0"` (в Windows 11 тоже: Windows сохранила номер версии). Тёмный режим в реальном времени следует настройке «Параметры» > «Персонализация» > «Цвета», `fontScale()` — настройке «Размер текста», reduce motion — настройке эффектов анимации, а локаль — региональному формату пользователя. См. [Device and environment](./device-and-environment.md).

Стиль `cursor` обновляется, пока указатель мыши находится над представлением. Когда пакет изменений меняет курсор, Windows применяет новую форму или `"none"` после всего пакета, используя представление под указателем. Строка заголовка и границы изменения размера сохраняют свои системные курсоры.

<a id="keyboard"></a>

### Клавиатура

| Клавиши | Действие |
|---|---|
| Return | В `Input` делает то, что указано в `submitBehavior`: отправка (`onSubmit`), отправка с выходом из поля или новая строка (многострочные поля ввода) |
| Shift+Return, Alt+Return | Новая строка в многострочном поле ввода, где Return отправляет (Ctrl+Return отправляет) |
| Tab, Shift+Tab | Следующее / предыдущее текстовое поле в пределах самого нового диалога; текст поля выделяется, как в диалогах Windows |
| Escape | Выходит из поля в фокусе; иначе снимает выделение текста, затем закрывает самый новый диалог или возвращает назад |
| Alt+Left, клавиша «Назад» браузера, кнопка «Назад» мыши | Назад (в том числе из поля) |
| Ctrl+стрелки, Home / End, Ctrl+Home / End, с Shift; Ctrl+Backspace / Delete | Перемещение, выделение и удаление по словам и строкам в поле, как в любом приложении Windows |
| Ctrl+Z, Ctrl+Y, Ctrl+X / C / V / A; Shift+Delete, Ctrl+Insert, Shift+Insert | Отмена, повтор, вырезать, копировать, вставить, выделить всё (поле `masked` не позволяет вырезать и копировать); Ctrl+A / Ctrl+C выделяют и копируют выделяемый текст |
| Стрелки; Page Up / Down, Space, Shift+Space; Home / End, Ctrl+Home / End | Прокрутка прокручиваемого представления вокруг представления в фокусе или под мышью на строку, страницу, в начало / конец (не когда фокус в поле) |
| F11, Alt+F4 | Полноэкранный режим, закрытие окна (приложения `nsh package` и `nsh run`) |
| Ctrl+R, F5 | Перезагрузка последней сборки (`nsh run`) |

Сочетания клавиш работают в любой раскладке (в кириллической или греческой Ctrl+C — это клавиша, которая в американской раскладке вводит C). Return, который подтверждает композицию метода ввода (китайский, японский, ...), никогда не отправляет. `onKeyPress` сообщает то же, что и React Native: набранный текст, `"Enter"`, `"Backspace"` и `"Escape"`; вставленный текст не сообщается.

Собственные сочетания клавиш приложения ([`keymap`](../modules/nsh.md#keymap)) обрабатываются раньше клавиш поля в фокусе, навигации и прокрутки; Alt+F4, F11 и Ctrl+Q привязать нельзя.

Отличается или не поддерживается:

- **`WebView`**: страница внутри представления с 3D-трансформацией (perspective) не показывается, а `backdropFilter` поверх страницы не размывает её. `baseUrl` принимает URL `http(s)`. Нативный компонент, который создаёт собственное окно, остаётся поверх всего, что рисует NSH.
- **Видео**: форматы, которые декодируют установленные кодеки; без постера; панель управления всегда показывается при `controls`.
- **Масштабируемые прокручиваемые представления** (`zoomTo`, пропсы zoom); индикатор прокрутки нельзя перетаскивать.
- **`mixBlendMode` и `backdropFilter`** отрисовываются, но не внутри представления с `filter` или 3D-трансформацией; `borderCurve: "continuous"` рисует круглые углы.
- **Текст**: многоточие в начале и в середине — только в однострочном тексте (для нескольких строк используется многоточие в конце); цветной эмодзи — только из шрифтов COLR; капитель — только если она есть в шрифте.
- **Текстовые поля ввода**: типы клавиатуры и автозаполнение не применяются (программной клавиатуры нет); Tab переключает между текстовыми полями. Правый щелчок открывает меню правки (Undo, Cut, Copy, Paste, Delete, Select All), как и на выделяемом тексте (Copy, Select All).
- **Доступность** (UI Automation): диалоги-предупреждения и тосты не предоставляются; заголовки сообщают уровень 1.
- **Input accessory views** и **status bar** (у них нет аналога на десктопе).

<a id="see-also"></a>

## См. также

- [CLI](./cli.md): `nsh run --target windows`, `nsh package --target windows`
- [Packaging](./packaging.md)
- [Platform-specific code](./platform-specific.md)
