---
title: "Linux"
description: "Запуск приложений NSH на Rust и TSX в окнах GTK 4 в Linux, их упаковка, встраивание в приложение GTK с помощью AppView и отличия Linux от других платформ."
order: 15
group: platforms
source_hash: c423cb25ff360498
---

# Linux

Приложения NSH работают и на Linux. Бэкенд Linux отрисовывает их виджетами GTK 4 и раскладывает текст с помощью Pango; ядро, реактивный граф, рендерер, раскладка Taffy и нативные модули те же, что на iOS и Android, поэтому одно приложение работает везде. На Linux `os()` — это `Os::Linux` (`platform.os` — это `"linux"` в TSX), и применяются свойства `desktop={{…}}` из TSX. Заголовок окна, собственная панель заголовка приложения, строка меню и контекстные меню задаются через `nsh_core::element::desktop` в Rust ([Заголовки окон на десктопе](./rust.md#desktop-title-bars)) и [`nsh/desktop`](../modules/nsh-desktop.md) в TSX.

<a id="requirements"></a>

## Требования

- **GTK 4.14** или новее. Чтобы собрать раннер Rust-приложения или рантайм NSH для Linux (из чекаута или через `cargo xtask
  dist` on Linux) you need their development packages and clang: `libgtk-4-dev clang` в Debian и Ubuntu (24.04 или новее), `gtk4 clang` в Arch, `gtk4-devel clang` в Fedora.
- **WebKitGTK 6.0** (2.40 или новее) для веб-представлений: `libwebkitgtk-6.0-dev` в Debian и Ubuntu, `webkitgtk-6.0` в Arch, `webkitgtk6.0-devel` в Fedora для сборки рантайма. Хост разработки и релизный раннер используют его по умолчанию, поэтому упакованным приложениям нужен WebKitGTK 6.0 там, где они запускаются (`libwebkitgtk-6.0-4` в Debian и Ubuntu; в окружениях GNOME он есть). `cargo xtask dist` на машине без файлов разработки WebKitGTK собирает рантайм, в котором веб-представления — заглушки, а приложениям нужен только GTK.
- Плагины **GStreamer** для видеоформатов, которые воспроизводит ваше приложение (GTK воспроизводит видео через GStreamer).

<a id="running-an-app"></a>

## Запуск приложения

На Linux `nsh run` открывает приложение в окне GTK. Rust-приложение запускается из своего каталога:

```sh
nsh run                        # --target linux is the default on Linux
```

`nsh` собирает отладочный раннер с вашим крейтом и открывает приложение, выводя его логи (`log::info!` и остальные) в терминал; изменение Rust-кода крейта пересобирает раннер и перезапускает приложение. `cargo run` запускает тот же корень из `src/main.rs` крейта, который создаёт `nsh init --template rust`: [`run_app`](#embedding-in-a-gtk-app) с `AppSource::Rust`.

TSX-приложение указывает свою точку входа и по умолчанию открывается в окне 390×844, с горячей перезагрузкой, логами в терминале и оверлеем ошибок, как и на других платформах:

```sh
nsh run App.tsx
```

В чекауте `nsh run` сначала собирает хост разработки (`nsh-linux-host`); дистрибутив, собранный на Linux, поставляет его в `runtime/linux/`. Ctrl-C закрывает окно, а закрытие окна завершает `nsh run`. Хост также умеет сам запускать собранный бандл:

```sh
nsh build my-app --release -o build
dist/nsh/runtime/linux/nsh-linux-host --bundle build/bundle.nshc --window-size 1024x768   # in a checkout: target/debug/nsh-linux-host
```

`--window-size` — размер окна по умолчанию (для TSX-приложений); тайловые оконные менеджеры могут задать другой.

<a id="packaging"></a>

## Упаковка

```sh
nsh package --target linux [--run]           # a Rust app, from its directory
nsh package App.tsx --target linux [--run]   # a TSX app
```

Создаёт каталог и то же самое в виде архива:

```text
.nsh/out/<Name>/
  <Name>                 the executable: a Rust app's own runner, built with its crate; nsh's release runner for TSX
  nsh/bundle.nshc        a TSX app, compiled
  nsh/assets/…           the assets it imports (a Rust crate's `assets!()` too)
  nsh/app.json           the window title and the application id
  <id>.desktop           a desktop entry (StartupWMClass is the id)
  <id>.png               the icon, when nsh.json names one
.nsh/out/<Name>.tar.gz
```

Исполняемый файл находит `nsh/` рядом с собой (символическая ссылка на него, например в `~/.local/bin`, тоже подойдёт). GTK 4, Pango и WebKitGTK 6.0 должны быть установлены там, где запускается приложение. Чтобы показать приложение в лаунчере рабочего стола, поместите исполняемый файл (или ссылку на него) в `PATH`, файл `.desktop` — в `~/.local/share/applications`, а значок — в каталог темы значков. `--run` запускает приложение после упаковки.

<a id="embedding-in-a-gtk-app"></a>

## Встраивание в приложение GTK

Крейт `nsh-platform-linux` (из репозитория NSH) даёт Rust-приложению на GTK `AppView`: один движок NSH в виде виджета GTK. Каждый `AppView` независим; одновременно может работать несколько. Он запускает корень на Rust — корневой компонент вашего крейта:

```rust
use std::rc::Rc;
use nsh_platform_linux::{gtk4 as gtk, set_ui_sets, AppOptions, AppView, Root};
use gtk::prelude::*;

fn main() -> gtk::glib::ExitCode {
    // Once, before the first view: the UI sets the apps import (NSH's and your crate's).
    set_ui_sets(vec![nsh_base::registry(), my_app::registry()]);
    let app = gtk::Application::builder().application_id("com.example.host").build();
    app.connect_activate(|app| {
        let window = gtk::ApplicationWindow::builder().application(app).default_width(390).default_height(844).build();
        let view = AppView::new(AppOptions::default());
        // register native components here, before loading
        view.load(Root::of::<my_app::App>().into());
        window.set_child(Some(&view.widget()));
        // The window keeps the view; closing it stops the app.
        let keep = std::cell::RefCell::new(Some(Rc::clone(&view)));
        window.connect_destroy(move |_| if let Some(view) = keep.take() { view.stop() });
        window.present();
    });
    app.run()
}
```

`Root::tokens` передаёт корню его [тему](./rust.md#theme), а `Root::app_id` — идентификатор, под которым хранятся его данные. TSX-бандл, который создал `nsh build`, загружается в то же представление, если `asset_base` указывает на его каталог `assets`:

```rust
use nsh_platform_linux::{AppOptions, AppView, AssetBase, Bundle};

let view = AppView::new(AppOptions {
    asset_base: Some(AssetBase::Directory("app/assets".into())),
    ..AppOptions::default()
});
let code = std::fs::read_to_string("app/bundle.js").expect("bundle");
view.load(Bundle::source(code).into());
```

`AppView::load` заменяет то, что работало; `stop` завершает приложение. `asset_base` сообщает, где разрешаются URI `asset:/` (`AssetBase::Directory` или `AssetBase::Http`). Бандлы с байткодом (`bundle.nshc`) загружаются через `unsafe { Bundle::bytecode(bytes) }`: байткод QuickJS — доверенные входные данные, поэтому загружайте его только из файлов собственного приложения. Отдельное окно создаётся через `nsh_platform_linux::run_app(source, options)` с `AppSource::Rust(root)` или `AppSource::Bundle(bundle)`.

`AppOptions::cache` (или `AppView::set_cache` — для приложений, загружаемых следом) задаёт, где приложения хранят кэши и [загружаемые изображения](./images-and-assets.md#kept-on-disk), а также сколько хранит каждое из них (`CacheOptions`: по умолчанию системный каталог кэша и 256 МиБ изображений).

`AppView::set_locale(Some(locale))` и `AppView::set_font_scale(Some(scale))` задают приложению язык и размер текста вашего приложения вместо системных (`None` снова возвращает системные): `locale()`, `Intl`, `fontScale()` и текст сразу следуют за ними ([Устройство и окружение](./device-and-environment.md#in-an-embedding-app)).

`AppView::set_theme_overrides(Some(json))` накладывает фирменный стиль вашего приложения поверх [темы](./tailwind.md#theme-tokens) приложения: файл темы в формате `"theme"` из `nsh.json`, токены которого имеют приоритет над токенами приложения с теми же именами в светлом и тёмном режимах, а остальные токены приложения сохраняются; классы вроде `bg-primary` перестилизуются сразу, а приложения, загруженные позже, стартуют уже с этим стилем (`None` возвращает приложению его собственную тему; файл, который не удаётся разобрать, вызывает ошибку и ничего не меняет).

Нативные компоненты регистрируются через `AppView::register_component`; см. [Нативные компоненты](./native-components.md#registering-on-linux-rust). `set_ui_sets(sets)` задаёт наборы UI, которые обслуживает каждый движок: NSH (`nsh_base::registry()`) и ваших крейтов (`my_app::registry()`, который создаёт `#[native_module]`), поэтому TSX, загружаемый представлением, может импортировать и ваши Rust-компоненты и модули.

<a id="what-differs-on-linux"></a>

## Что отличается на Linux

Окружение — как у десктопа: безопасная область и высота клавиатуры равны 0, `idiom()` — это десктоп (`platform.idiom` равно `"desktop"`), `os_version()` (`platform.version`) — старшая и младшая версии ядра, а тёмный режим следует настройке рабочего стола (через XDG settings portal) в реальном времени. См. [Устройство и окружение](./device-and-environment.md).

<a id="keyboard"></a>

### Клавиатура

| Клавиши | Действие |
|---|---|
| Return | В `Input` делает то, что указано в `submitBehavior`: отправляет (`onSubmit`), отправляет и выходит из поля или переводит строку (многострочные поля) |
| Shift+Return, Alt+Return | Новая строка в многострочном поле, в котором Return отправляет (Ctrl+Return отправляет) |
| Tab, Shift+Tab | Следующее / предыдущее поле в порядке на экране, в пределах самого нового диалога |
| Escape | Выходит из поля в фокусе; иначе снимает выделение текста, затем закрывает самый новый диалог или возвращает назад |
| Alt+Left, клавиша «Назад», кнопка «назад» мыши | Возврат назад (в том числе из поля) |
| Ctrl+стрелки, Home / End, с Shift; Ctrl+Backspace / Delete | Перемещение, выделение и удаление по словам и строкам в поле, как в любом приложении GTK |
| Ctrl+Z, Ctrl+Shift+Z, Ctrl+X / C / V / A | Отмена, повтор, вырезание, копирование, вставка, выделить всё (поле `masked` не позволяет вырезать и копировать); Ctrl+A / Ctrl+C выделяют и копируют выделяемый текст |
| Стрелки; Page Up / Down, Space, Shift+Space; Home / End | Прокручивают scroll view вокруг представления в фокусе или под мышью на строку, на страницу, в начало / в конец (не пока фокус в поле) |
| Ctrl+W, F11, Ctrl+Q | Закрыть окно, полноэкранный режим, выход (приложения `nsh package` и `nsh run`) |
| Ctrl+R | Перезагружает последнюю сборку (`nsh run`) |

Собственные сочетания клавиш приложения ([`keymap`](../modules/nsh.md#keymap)) — это оконный контроллер сочетаний; Ctrl+Q и F11 назначить нельзя.

Сочетания работают с любой раскладкой клавиатуры (в кириллической или греческой Ctrl+C — это клавиша, которая вводит C в американской раскладке). Return, подтверждающий композицию метода ввода (китайский, японский и т. д.), никогда не отправляет. `onKeyPress` сообщает то же, что и React Native: набранный текст, `"Enter"`, `"Backspace"` и `"Escape"`; вставленный текст не сообщается.

Веб-представления — это страницы WebKitGTK, нарисованные внутри представлений NSH: листы, диалоги, тосты и следующие за ними представления рисуются поверх страницы, а родительские представления обрезают её и применяют к ней затухание. Данные сайтов (cookies, хранилище, кэш) хранятся отдельно для каждого приложения, в `~/.local/share/<app id>/webkit` и `~/.cache/<app id>/webkit`. Возможность `webview` распространяется и на страницы во фреймах: `iframe` с хоста, доступ к которому приложению не предоставлен, остаётся пустым. Escape на странице выходит из неё, как из текстового поля (если страница сама не использует эту клавишу); Alt+Left и кнопка «назад» мыши возвращают назад по истории страницы, пока она есть.

Не поддерживается:

- **Video `rate`**: GTK воспроизводит только с обычной скоростью. `onEnd` приходит только для видео без зацикливания.
- **Масштабирование в scroll view** (`zoomTo`, свойства zoom).
- **`mixBlendMode` и `backdropFilter`** (цвет фона по-прежнему рисуется); `borderCurve: "continuous"` рисует круглые углы.
- **Input accessory views** и **строка состояния** (на десктопе нет аналога).
- **Специальные возможности**: группировка `accessible`, пользовательские `accessibilityActions`; вместо них объявляются live regions.

<a id="see-also"></a>

## См. также

- [CLI](./cli.md): `nsh run --target linux`, `nsh package --target linux`
- [Упаковка](./packaging.md)
- [Платформенно-зависимый код](./platform-specific.md)
