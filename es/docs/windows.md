---
title: "Windows"
description: "Ejecuta apps NSH en Rust y TSX en Windows dentro de ventanas Win32 dibujadas con Direct2D, empaquétalas, intégralas en una app Win32 con AppView y consulta qué diferencias hay en Windows."
order: 14
group: platforms
source_hash: d39f39f9d32017d0
---


# Windows

NSH también se ejecuta en Windows. El backend de Windows dibuja las apps en ventanas Win32 con Direct2D y maqueta el texto con DirectWrite; el núcleo, el grafo reactivo, el renderizador, el layout de Taffy y los módulos nativos son los mismos que en iOS y Android, así que una misma app se ejecuta en todas partes. En Windows, `os()` es `Os::Windows` (`platform.os` es `"windows"` en TSX) y se aplican las props `desktop={{…}}` de TSX. El título de la ventana, una barra de título propia de la app, la barra de menús y los menús contextuales provienen de `nsh_core::element::desktop` en Rust ([Barras de título de escritorio](./rust.md#desktop-title-bars)) y de [`nsh/desktop`](../modules/nsh-desktop.md) en TSX.

<a id="requirements"></a>

## Requisitos

- **Windows 10 1809** o posterior, o Windows 11.
- El **WebView2 Runtime** para las web views. Viene incluido con Windows 11 y con Microsoft Edge en Windows 10; sin él, un `WebView` muestra un marcador de posición.
- **Códecs de Media Foundation** para los formatos de vídeo que reproduce tu app (los vídeos se reproducen a través de la pila multimedia propia de Windows).
- Para compilar el runner de una app Rust: Visual Studio Build Tools con la carga de trabajo de C++ y el Windows SDK. Para compilar el runtime de NSH para Windows (desde un checkout, o `cargo xtask dist` en Windows), también LLVM (para los bindings de QuickJS).

<a id="running-an-app"></a>

## Ejecutar una app

En Windows, `nsh run` abre la app en una ventana. Una app Rust se ejecuta desde su directorio:

```sh
nsh run                        # --target windows is the default on Windows
```

`nsh` compila un runner de depuración con tu crate y abre la app, con sus logs (`log::info!` y el resto) en el terminal; un cambio en el código Rust del crate vuelve a compilar el runner y reinicia la app. `cargo run` inicia la misma raíz desde el `src/main.rs` del crate, que `nsh init --template rust` escribe: [`run_app`](#embedding-in-a-win32-app) con `AppSource::Rust`.

Una app TSX indica su entrada y se abre por defecto en una ventana de 1200×800, con hot reload, logs en el terminal y la superposición de errores, como en los demás destinos:

```sh
nsh run App.tsx
```

En un checkout, `nsh run` compila primero el host de desarrollo (`nsh-windows-host.exe`); la distribución creada en Windows lo incluye en `runtime\windows\`. Ctrl-C cierra la ventana, y cerrar la ventana termina `nsh run`; el host nunca sobrevive a `nsh`, termine este como termine. El host también ejecuta por sí solo un bundle ya compilado:

```sh
nsh build my-app --release -o build
dist\nsh\runtime\windows\nsh-windows-host --bundle build\bundle.nshc --window-size 390x844   # in a checkout: target\debug\nsh-windows-host
```

`--window-size` es el tamaño de la ventana en puntos (`<width>x<height>`; apps TSX).

<a id="performance-monitor"></a>

### Monitor de rendimiento

`--fps` (`nsh run App.tsx --target windows --fps`, `nsh test --target windows --fps`, el `--fps` del host, o `AppOptions { fps: true, .. }` en el `run_app` de una app Rust) registra las lecturas del monitor de rendimiento una vez por segundo (target `nsh::perf`): fotogramas mostrados respecto a la tasa de la pantalla, el tiempo del hilo principal por fotograma y sus fases (`tick`, `drain`, `paint`, `present`, `canvas`), los commits del motor, CPU y memoria, con el mismo formato que registran los demás escritorios (milisegundos como media/p50/p95/máx). `nsh test --fps -v` las muestra y `examples/gallery/tools/perf.py` las lee ([Informe de rendimiento](./performance-report.md#windows-win32-direct2d)). Mide con builds de release; el monitor no cuesta nada mientras está desactivado.

<a id="packaging"></a>

## Empaquetado

```sh
nsh package --target windows [--run]           # a Rust app, from its directory
nsh package App.tsx --target windows [--run]   # a TSX app
```

Escribe un directorio y lo mismo como archivo comprimido:

```text
.nsh\out\<Name>\
  <Name>.exe             the executable, with the app's icon: a Rust app's own runner, built with its crate; nsh's release runner for TSX
  nsh\bundle.nshc         a TSX app, compiled
  nsh\assets\…           the assets it imports (a Rust crate's `assets!()` too)
  nsh\app.json           the window title, the app id, the version and the appearance
.nsh\out\<Name>.zip
```

El ejecutable encuentra `nsh\` junto a sí mismo; copia el directorio completo (o descomprime el `.zip`) donde deba vivir la app: no se instala nada. El icono de `nsh.json` se incrusta en el ejecutable (el Explorador y la barra de tareas lo muestran) sin necesidad de herramientas adicionales; al empaquetar en otro sistema se conserva el icono predeterminado. El id de la app agrupa las ventanas de la app en la barra de tareas. `--run` inicia la app después de empaquetarla. El ejecutable no está firmado: fírmalo con tu propio certificado (`signtool`) para distribuirlo.

<a id="embedding-in-a-win32-app"></a>

## Incrustar en una app Win32

El crate `nsh-platform-windows` (del repositorio de NSH) ofrece a una app Rust Win32 `AppView`: un motor NSH en una ventana hija de una ventana tuya. Cada `AppView` es independiente; pueden ejecutarse varias a la vez. Ejecuta una raíz Rust, el componente raíz de tu crate:

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

Un bundle TSX que escribió `nsh build` se carga en la misma vista, con `asset_base` apuntando a su directorio `assets`:

```rust
let code = std::fs::read_to_string("app/bundle.js").expect("bundle");
view.load(Bundle::source(code).into());
```

La vista es una ventana hija: tu bucle de mensajes la ejecuta, y la colocas con `MoveWindow` en su `hwnd()` cuando la ventana padre cambia de tamaño. Créala en el hilo de la ventana en la que está: su ciclo de vida sigue a la ventana de nivel superior de esa ventana, aquella bajo la que se creó. `AppView::load` reemplaza lo que se estuviera ejecutando; `stop` (o destruir la ventana) termina la app. `asset_base` le indica dónde se resuelven los URI `asset:/` (`AssetBase::Directory` o `AssetBase::Http`). Los bundles de bytecode (`bundle.nshc`) se cargan con `unsafe { Bundle::bytecode(bytes) }` (o `Bundle::read_trusted(path)`, también unsafe): el bytecode de QuickJS es una entrada de confianza, así que cárgalo solo desde los archivos de tu propia app. Una ventana independiente es `nsh_platform_windows::run_app(source, options)`, con `AppSource::Rust(root)` o `AppSource::Bundle(bundle)`. `Root::tokens` da a una raíz su [tema](./rust.md#theme) y `Root::app_id` el id bajo el que se conservan sus datos.

`AppOptions::cache` (o `AppView::set_cache`, para las apps que se carguen a continuación) establece dónde guardan las apps sus cachés, las [imágenes que descargan](./images-and-assets.md#kept-on-disk), y cuánto conserva cada una (`CacheOptions`: por defecto, el directorio de caché del sistema y 256 MiB de imágenes).

`AppView::set_locale(Some(locale))` y `AppView::set_font_scale(Some(scale))` dan a la app el idioma y el tamaño de texto de tu app en lugar de los del sistema (`None` vuelve a seguir los del sistema): `locale()`, `Intl`, `fontScale()` y el texto los siguen de inmediato ([Dispositivo y entorno](./device-and-environment.md#in-an-embedding-app)).

`AppView::set_theme_overrides(Some(json))` coloca la marca de tu app sobre el [tema](./tailwind.md#theme-tokens) de la app: un archivo de tema en el formato de `nsh.json` de `"theme"`, cuyos tokens prevalecen sobre los de la app con el mismo nombre tanto en modo claro como oscuro, mientras que los demás tokens de la app se mantienen; las clases como `bg-primary` se reestilizan de inmediato, y las apps que se carguen después empiezan con él (`None` devuelve a la app su propio tema; un archivo que no se puede analizar es un error y no cambia nada).

Los componentes nativos se registran con `AppView::register_component`; consulta [Componentes nativos](./native-components.md#registering-on-windows-rust). `set_ui_sets(sets)` establece los conjuntos de UI que sirve cada motor: los de NSH (`nsh_base::registry()`) y los de tus crates (`my_app::registry()`, que `#[native_module]` genera), de modo que el TSX que carga una vista también importa tus componentes y módulos Rust.

<a id="what-differs-on-windows"></a>

## Qué es diferente en Windows

El entorno es el de un escritorio: el área segura y la altura del teclado son 0, `idiom()` es el escritorio (`platform.idiom` es `"desktop"`) y `os_version()` (`platform.version`) es `"10.0"` (también en Windows 11: Windows mantuvo el número de versión). El modo oscuro sigue en directo Configuración > Personalización > Colores, `fontScale()` el ajuste de tamaño del texto, la reducción de movimiento el ajuste de efectos de animación y la configuración regional el formato regional del usuario. Consulta [Dispositivo y entorno](./device-and-environment.md).

El estilo `cursor` se actualiza mientras el ratón permanece sobre una vista. Cuando un lote cambia el cursor, Windows aplica la nueva forma o `"none"` después de todo el lote, usando la vista que está bajo el puntero. La barra de título y los bordes de redimensionado conservan sus cursores del sistema.

<a id="keyboard"></a>

### Teclado

| Teclas | Acción |
|---|---|
| Return | En un `Input`, lo que indica `submitBehavior`: enviar (`onSubmit`), enviar y salir del campo, o una nueva línea (inputs multilínea) |
| Shift+Return, Alt+Return | Una nueva línea en un input multilínea cuyo return envía (Ctrl+Return envía) |
| Tab, Shift+Tab | El campo de texto siguiente / anterior, dentro del diálogo más reciente; el texto del campo queda seleccionado, como en los diálogos de Windows |
| Escape | Sale del campo enfocado; si no, borra una selección de texto, y luego cierra el diálogo más reciente o retrocede |
| Alt+Left, tecla Atrás del navegador, botón Atrás del ratón | Retroceder (también desde un campo) |
| Ctrl+flechas, Home / End, Ctrl+Home / End, con Shift; Ctrl+Backspace / Delete | Mover, seleccionar y borrar por palabra y por línea en un campo, como en cualquier app de Windows |
| Ctrl+Z, Ctrl+Y, Ctrl+X / C / V / A; Shift+Delete, Ctrl+Insert, Shift+Insert | Deshacer, rehacer, cortar, copiar, pegar, seleccionar todo (un campo `masked` rechaza cortar y copiar); Ctrl+A / Ctrl+C seleccionan y copian texto seleccionable |
| Flechas; Page Up / Down, Space, Shift+Space; Home / End, Ctrl+Home / End | Desplazan la scroll view que rodea a la vista enfocada o que está bajo el ratón una línea, una página, al inicio / al final (no mientras un campo tiene el foco) |
| F11, Alt+F4 | Pantalla completa, cerrar la ventana (apps `nsh package` y `nsh run`) |
| Ctrl+R, F5 | Recargar la última build (`nsh run`) |

Los atajos funcionan con cualquier distribución de teclado (en una cirílica o griega, Ctrl+C es la tecla que escribe C en una distribución de EE. UU.). Un return que confirma la composición de un método de entrada (chino, japonés, ...) nunca envía. `onKeyPress` informa de lo mismo que React Native: el texto escrito, `"Enter"`, `"Backspace"` y `"Escape"`; el texto pegado no se informa.

Los atajos propios de la app ([`keymap`](../modules/nsh.md#keymap)) tienen prioridad sobre las teclas de un campo enfocado, la navegación y el desplazamiento; Alt+F4, F11 y Ctrl+Q no se pueden asignar.

Diferente, o no compatible:

- **`WebView`**: una página dentro de una vista con una transformación 3D (perspectiva) no se muestra, y un `backdropFilter` sobre una página no la desenfoca. `baseUrl` acepta URL `http(s)`. Un componente nativo que aporta su propia ventana permanece por encima de todo lo que dibuja NSH.
- **Vídeo**: los formatos que decodifican los códecs instalados; sin póster; la barra de controles siempre se muestra con `controls`.
- **Scroll views con zoom** (`zoomTo`, las props de zoom); el indicador de desplazamiento no se puede arrastrar.
- **`mixBlendMode` y `backdropFilter`** se dibujan, pero no dentro de una vista que tenga un `filter` o una transformación 3D; `borderCurve: "continuous"` dibuja esquinas circulares.
- **Texto**: puntos suspensivos al inicio y en el medio solo en una única línea (con más líneas se usan al final); emoji de color solo de fuentes COLR; versalitas solo donde la fuente las tiene.
- **Inputs de texto**: los tipos de teclado y el autocompletado no se aplican (no hay teclado en pantalla); Tab se mueve entre campos de texto. Un clic derecho abre el menú de edición (Deshacer, Cortar, Copiar, Pegar, Eliminar, Seleccionar todo), como en el texto seleccionable (Copiar, Seleccionar todo).
- **Accesibilidad** (UI Automation): los diálogos de alerta y los toasts no se exponen; los encabezados informan de nivel 1.
- **Input accessory views** y la **barra de estado** (sin equivalente de escritorio).

<a id="see-also"></a>

## Véase también

- [CLI](./cli.md): `nsh run --target windows`, `nsh package --target windows`
- [Empaquetado](./packaging.md)
- [Código específico de plataforma](./platform-specific.md)
