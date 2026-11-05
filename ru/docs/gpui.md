---
title: "GPUI"
description: "Встраивайте приложения NSH на Rust и TSX в приложение GPUI или GPUI Kit с помощью AppView, отрисовываемые GPUI на macOS, Windows и Linux, пробуйте приложения на TSX в хосте разработки GPUI и узнайте, чем отличается бэкенд GPUI."
order: 15.5
group: platforms
source_hash: 1f281d4fc1a89362
---

# GPUI

Бэкенд GPUI рисует приложения NSH с помощью [GPUI](https://gpui-kit.com) (GPUI Fast), GPU-ускоренного UI-фреймворка, на котором построен GPUI Kit, одинаково на macOS, Windows и Linux. Это бэкенд для встраивания в приложения на GPUI и GPUI Kit: `AppView` является представлением GPUI, поэтому приложение на GPUI или GPUI Kit показывает приложения NSH (собственный корень на Rust или загружаемый TSX) в любом месте своего дерева элементов. Автономные приложения запускаются и упаковываются с собственным бэкендом каждой настольной ОС: [macOS](./macos.md) (AppKit), [Windows](./windows.md) (Win32) и [Linux](./linux.md) (GTK). Ядро, реактивный граф, рендерер, раскладка Taffy и нативные модули такие же, как на всех остальных платформах, поэтому одно приложение работает везде. `os()` (`platform.os` в TSX) — это ОС, на которой оно запущено (macOS, Windows или Linux), и действуют свойства TSX `desktop={{…}}`.

Здесь есть все элементы и модули бэкендов [macOS](./macos.md) (AppKit), [Windows](./windows.md) (Win32) и [Linux](./linux.md) (GTK); где GPUI рисует что-то по-своему, об этом сказано в разделе [Отличия](#differences).

<a id="how-it-works"></a>

## Как это работает

- **Один элемент на поверхность.** Поверхность — это один элемент GPUI, который заполняет отведённое ему родителем пространство и рисует всё дерево представлений примитивами GPUI: прямоугольниками, тенями, контурами, глифами и изображениями. NSH хранит одно постоянное представление на каждый узел, как на Windows, и перерисовывает только тогда, когда коммит что-то изменил.
- **Текст формируется в потоке движка** текстовой системой GPUI (с собственными шрифтами приложения) и разбивается на строки средствами NSH; главный поток только рисует глифы.
- **Один переход на коммит.** Движок работает в собственном потоке; каждый коммит — это одно замыкание, отправляемое в главный поток GPUI, который уведомляет представление.
- **Ввод** приходит из событий мыши, прокрутки, клавиатуры и метода ввода GPUI; hit testing, нажатия, система респондеров, прокрутка и редактирование текста работают по той же логике, что и в бэкенде Windows.

<a id="requirements"></a>

## Требования

- macOS, Windows или Linux с GPU, на котором может рисовать GPUI (Metal на macOS, DirectX на Windows, Vulkan на Linux).
- На macOS для сборки вашего приложения GPUI или рантайма из репозитория используется Metal Toolchain из Xcode (`xcodebuild -downloadComponent
  MetalToolchain`), which compiles GPUI's shaders ahead of time. On a Mac without it, `nsh run` собирает рантайм с функцией `runtime-shaders` GPUI и сообщает об этом: шейдеры компилируются при запуске приложения (доли секунды в первый раз, затем они кэшируются macOS).
- На Linux: драйвер Vulkan, Wayland или X11 с `libxkbcommon`, GTK 3 и WebKitGTK 4.1 (веб-представления) и GStreamer 1.20 или новее с базовыми и good-плагинами (видео). Веб-представлениям нужен X11: на рабочем столе Wayland запускайте приложение под Xwayland (`WAYLAND_DISPLAY=` пустой), иначе вместо них будет показана заглушка. Для сборки рантайма из репозитория также нужны пакеты для разработки; в Debian и Ubuntu:

  ```sh
  sudo apt-get install clang libclang-dev pkg-config libfontconfig-dev libfreetype-dev libwayland-dev libx11-xcb-dev \
    libxcb1-dev libxkbcommon-dev libxkbcommon-x11-dev libzstd-dev libvulkan1 libgtk-3-dev libwebkit2gtk-4.1-dev \
    libgstreamer1.0-dev libgstreamer-plugins-base1.0-dev gstreamer1.0-plugins-good
  ```

<a id="running-an-app"></a>

## Запуск приложения

Приложение на Rust запускается внутри вашего приложения GPUI: встройте его корень с помощью `AppView` ([Встраивание в приложение GPUI](#embedding-in-a-gpui-app)) и `cargo run` приложение GPUI; ваш крейт и приложение собираются одной сборкой Cargo. Отдельно приложение на Rust запускается на собственном бэкенде этой ОС (`nsh run --target macos`, `windows` или `linux`).

Приложение на TSX запускается в среде разработки GPUI:

```sh
nsh run App.tsx --target gpui
```

Она открывает приложение в окне GPUI (по умолчанию 1200×800), так же как его показывает встроивившее его приложение GPUI, с горячей перезагрузкой, логами в терминале и оверлеем ошибок, как и на других целях. Среда разработки (`nsh-gpui-host`) запускается на месте в любой ОС, без обёртки в виде пакета приложения. В репозитории `nsh run` сначала собирает её; дистрибутив поставляет её в `runtime/gpui/`. Среда также самостоятельно запускает собранный бандл:

```sh
nsh build my-app --release -o build
dist/nsh/runtime/gpui/nsh-gpui-host --bundle build/bundle.nshc --window-size 390x844   # in a checkout: target/debug/nsh-gpui-host
```

`--window-size` — размер окна в пунктах (`<width>x<height>`).

<a id="packaging"></a>

## Упаковка

Приложение GPUI поставляет NSH внутри собственного исполняемого файла: оно встраивает корень приложения на Rust или бандл TSX с помощью `AppView` ([Встраивание в приложение GPUI](#embedding-in-a-gpui-app)) и собирается и распространяется как обычное приложение GPUI. Автономное приложение NSH упаковывается с целью, соответствующей этой ОС: [`--target macos`](./macos.md#packaging), [`--target windows`](./windows.md#packaging) или [`--target linux`](./linux.md#packaging) ([Упаковка](./packaging.md)).

На Linux приложение GPUI с веб-представлениями и видео динамически линкуется с WebKitGTK 4.1 и GStreamer, поэтому на машинах, где оно запускается, они должны быть установлены вместе с GTK 3 и базовыми и good-плагинами GStreamer (Debian / Ubuntu: `libwebkit2gtk-4.1-0`, `libgstreamer1.0-0`, `libgstreamer-plugins-base1.0-0`, `gstreamer1.0-plugins-good`), а также драйвер Vulkan и `libxkbcommon`.

<a id="embedding-in-a-gpui-app"></a>

## Встраивание в приложение GPUI

Крейт `nsh-platform-gpui` (из репозитория NSH) даёт приложению GPUI на Rust `AppView`: один движок NSH в виде представления GPUI (`Entity<AppView>`), которое заполняет пространство, отведённое ему родительским элементом. Каждый `AppView` независим; несколько могут работать одновременно. Он запускает корень на Rust — корневой компонент вашего крейта:

```rust
use gpui::{AppContext, WindowOptions};
use nsh_platform_gpui::{set_ui_sets, App, AppOptions, AppView, Root};

// Once, before the first view: the UI sets the apps import (NSH's and your crate's).
set_ui_sets(vec![nsh_base::registry(), my_app::registry()]);
gpui_platform::application().run(|cx| {
    cx.open_window(WindowOptions::default(), |window, cx| {
        cx.new(|cx| {
            let view = AppView::new(AppOptions::default(), window, cx);
            view.load(App::Rust(Root::of::<my_app::App>()));
            view
        })
    })
    .unwrap();
});
```

`Root::tokens` передаёт корню его [тему](./rust.md#theme) (`nsh_base::Theme::from_json(json)?.into_tokens()`, `Theme` реэкспортируется здесь), а `Root::app_id` — идентификатор, под которым хранятся его данные. Бандл TSX, который собрал `nsh build`, загружается в то же представление:

```rust
use nsh_platform_gpui::{App, Bundle};

let code = std::fs::read_to_string("app/bundle.js").expect("bundle");
view.load(App::Js(Bundle::source(code)));
```

Поместите entity в дерево элементов, как любое другое представление (`Root` из GPUI Kit, панель, док). `AppView::load` заменяет то, что работало; `stop` (или удаление представления) завершает приложение. `AppOptions::asset_base` сообщает, где разрешаются URI `asset:/` (`AssetBase::Directory` или `AssetBase::Http`). Бандлы с байткодом (`bundle.nshc`) загружаются с помощью `unsafe { Bundle::bytecode(bytes) }` (или `Bundle::read_trusted(path)`, тоже unsafe): байткод QuickJS считается доверенным вводом, поэтому загружайте его только из файлов собственного приложения.

- `open_app_window(source, options, cx)` открывает окно с одним `AppView` в работающем приложении GPUI.
- `run_app(source, options)` запускает GPUI и выполняет одно приложение в окне, пока оно не закроется (это делает среда разработки).
- `AppView::register_component(name, factory)` регистрирует ваш нативный компонент перед загрузкой ([Нативные компоненты](./native-components.md)).
- `AppOptions::cache` (или `AppView::set_cache` для приложений, загружаемых следующими) задаёт, где приложения хранят свои кэши, [загружаемые ими изображения](./images-and-assets.md#kept-on-disk) и сколько занимает каждый: `CacheOptions { location,
  images }`, `CacheLocation::System` (the default), `Dir(path)` or `Off`, `CachePolicy::Default` (256 MiB), `MaxSize(ByteSize::mib(n))` или `Off`.
- `AppView::host()` — канал представления с запущенными им приложениями ([`host`](../modules/nsh.md#host)), `HostChannel`, которым может пользоваться любой поток: `set_params(map)` перед загрузкой передаёт приложению параметры запуска (`host.params`), `send(name, data)` — событие (`host.on`), а `handle(name, |call| …)` отвечает на его `host.call(name, data)` и слушает его `host.post` (`call.resolve(json)`, `call.reject(message)`, сразу или позже из любого потока). Обработчики выполняются в потоке движка: передайте вызов своим entity GPUI (через канал, который читает задача `cx.spawn`) и отвечайте оттуда. У `AppView` на macOS, Windows и Linux тот же `host()`. Его `handle_open_url(|request| …)` видит URL, которые открывает приложение ([`openUrl`](../modules/nsh.md#openurl)), раньше системы: `request.handled()`, если ваше приложение само обработало URL, `request.decline()` (или удаление запроса), чтобы система открыла его через `open_url` GPUI.
- `AppOptions::limits` (или `AppView::set_limits` для приложений, загружаемых следующими) задаёт лимиты VM: кучу JS, стек, лимиты времени и квоту узлов ([Песочница и разрешения](./sandbox-and-capabilities.md)). Встроенные приложения получают `Limits::default()` (куча 256 MB); среда разработки запускает приложения сама, с `Limits::standalone()`.
- `AppOptions::transparent` делает представление прозрачным: оно не рисует фон окна, а `open_app_window` / `run_app` открывают прозрачное окно, так что всё, что приложение не закрасило, показывает то, что находится за окном (виджеты рабочего стола, оверлеи). По умолчанию false.
- `AppView::connect_dev_server(url, cx)` (функция `dev`) загружает приложение из `nsh dev` и перезагружает его по мере правок, с оверлеем ошибок поверх представления; `AppView::on_error` продолжает получать ошибки приложения.
- `AppView::on_app_error(|error| …)` получает ошибки приложения: `error.kind` (приложение не загрузилось, необработанное исключение, VM остановилась), `error.is_fatal()`, когда JS приложения больше не выполняется, `error.message`, `error.stack` и `error.package` (идентификатор и сборка подписанного пакета, из которого оно получено). `AppView::on_error` получает те же ошибки в виде текста.
- `AppView::set_locale(locale, cx)` и `AppView::set_font_scale(scale, cx)` задают приложению язык и размер текста вашего приложения вместо системных (`None` снова следует системным): `locale()`, `Intl`, `fontScale()` и текст меняются сразу ([Устройство и окружение](./device-and-environment.md#in-an-embedding-app)).
- `AppView::run_package(&package)` запускает [подписанный пакет](./signed-packages.md#loading-packages-in-a-host-app) из `verify_package` или `load_package`; `accept_package` фиксирует его после того, как ваше приложение сочло его исправным.
- `set_ui_sets(sets)` задаёт наборы UI, которые обслуживает каждый движок: набор NSH (`nsh_base::registry()`) и наборы ваших крейтов (`my_app::registry()`, которые создаёт `#[native_module]`; [Сборка на Rust](./rust.md)), а также даёт собственные наборы вашего приложения: приложение обращается к функциям и классам набора по имени с помощью [`nativeModule`](../modules/nsh.md#nativemodule) и собирается стандартным `nsh build`. `examples/embed-gpui` в репозитории таким образом держит торговый терминал в хосте, который разделяют два встроенных тикета заявок и собственные виджеты хоста.

<a id="differences"></a>

## Отличия

Что рисуется или ведёт себя иначе, чем в нативных настольных бэкендах:

- **Трансформации**: повёрнутые, наклонённые и спроецированные представления трансформируют свои фоны, границы и тени, но текст остаётся вертикальным, а изображения, видео и canvas рисуются по своим границам.
- **Прозрачность** применяется к каждому цвету, а не к группе, поэтому перекрывающиеся дочерние элементы полупрозрачного представления просвечивают друг через друга; прозрачность изображения (плавное появление, полупрозрачное представление) меняется шагами в одну шестнадцатую.
- **Скруглённые обрезки** (`overflow: "hidden"` с радиусом) скругляют фоны и изображения дочерних элементов, но текст, границы, видео и нативные компоненты обрезаются прямоугольником.
- **Не рисуются**: `filter: blur()`, `backdropFilter` и `mixBlendMode`; тени просвечивают сквозь полупрозрачные заливки; `borderCurve: "continuous"` рисует круглые углы.
- **Текст в canvas** приближённый: остаётся вертикальным при поворотах, для `maxWidth` уменьшается, а не сужается, градиенты рисуют его одним цветом, `strokeText` заливки, его тени не размываются, а композитные операции и `clearRect` к нему не применяются.
- **Представления прокрутки** не масштабируются (`zoomTo` и свойства масштабирования игнорируются).
- **Видео** воспроизводится на Linux (GStreamer); на macOS и Windows вместо видео показывается заглушка и сообщается `onError`.
- **Веб-представления** — нативные представления, расположенные поверх всего, что NSH рисует на их месте. На Linux им нужен X11 (см. [Требования](#requirements)); если страницы остаются чёрными под Xwayland («Failed to create GBM buffer» в логе), запускайте приложение с `WEBKIT_DISABLE_DMABUF_RENDERER=1`. На macOS и Windows обрезающие предки их не обрезают, а неудачные загрузки не сообщают `onError`. `baseUrl`, `scrollable` и `allowsBackForwardNavigationGestures` не поддерживаются.
- **Доступность** работает через AccessKit: программы чтения с экрана везде могут активировать элементы, переводить на них фокус, задавать значения и прокручивать элементы в область видимости; пользовательские действия и действие контекстного меню пока не передаются.

Для сравнения, список отличий каждого нативного бэкенда: [macOS](./macos.md#what-differs-on-macos), [Windows](./windows.md#what-differs-on-windows), [Linux](./linux.md#what-differs-on-linux).

<a id="see-also"></a>

## См. также

- [Сборка на Rust](./rust.md): крейт, корень которого встраивает приложение GPUI
- [CLI](./cli.md): `nsh run --target gpui`
- [Упаковка](./packaging.md): автономные приложения с целью, соответствующей каждой ОС
- [Обзор платформ](./platforms.md)
