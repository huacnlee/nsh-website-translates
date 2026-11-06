---
title: "macOS"
description: "Ejecuta apps NSH en Rust y TSX en macOS dentro de ventanas AppKit, empaquétalas como bundles .app, intégralas en una app de Mac con AppView y consulta qué cambia en macOS."
order: 13
group: platforms
source_hash: 1b63a5bad9780b73
---


# macOS

NSH también ejecuta las apps como apps nativas de Mac. El backend de macOS las renderiza con vistas de AppKit y Core Animation y maqueta el texto con CoreText; el núcleo, el grafo reactivo, el renderizador, el layout de Taffy y los módulos nativos son los mismos que en iOS y Android, así que una misma app se ejecuta en todas partes. En macOS, `os()` es `Os::MacOs` (`platform.os` es `"macos"` en TSX) y se aplican las props `desktop={{…}}` de TSX. El título de la ventana, una barra de título propia de la app, la barra de menús y los menús contextuales provienen de `nsh_core::element::desktop` en Rust ([Barras de título de escritorio](./rust.md#desktop-title-bars)) y de [`nsh/desktop`](../modules/nsh-desktop.md) en TSX.

El backend de macOS se comporta como una app de escritorio: entrada de ratón, trackpad y teclado, ventanas redimensionables, diálogos sobre la ventana y una barra de menús.

<a id="requirements"></a>

## Requisitos

- **macOS 14** o posterior, donde se ejecuta la app.
- Las herramientas de línea de comandos de Xcode (`xcode-select --install`), para compilar los runners de las apps en Rust y el runtime de macOS de NSH desde un checkout, y para empaquetar apps (`codesign`, `sips`). La distribución creada con `cargo xtask dist` en un Mac incluye el runtime de las apps TSX en `runtime/macos/`.

<a id="running-an-app"></a>

## Ejecutar una app

Una app en Rust se ejecuta desde su directorio:

```sh
nsh run --target macos         # the default on a Mac
```

`nsh` compila un runner de depuración con tu crate y abre la app en una ventana, con sus logs (`log::info!` y el resto) en la terminal; un cambio en el código Rust del crate vuelve a compilar el runner y reinicia la app. `cargo run` inicia la misma raíz desde el `src/main.rs` del crate, que escribe `nsh init --template rust`: [`run_app`](#embedding-in-a-mac-app) con `AppSource::Rust`.

Una app TSX indica su punto de entrada:

```sh
nsh run App.tsx --target macos
```

La app se abre en una ventana de AppKit (1200×800 por defecto), con hot reload, logs en la terminal y la superposición de errores, como en los demás destinos; Cmd+R recarga la última compilación. La barra de menús y la ventana muestran el nombre de la app (el `"name"` de nsh.json; si no existe, el de su directorio). En un checkout, `nsh run` compila primero el host de desarrollo (`nsh-macos-host`). Detener `nsh run` cierra la ventana, y cerrar la ventana termina `nsh run`. El host también ejecuta por sí solo un bundle ya compilado:

```sh
nsh build my-app --release -o build
dist/nsh/runtime/macos/nsh-macos-host --bundle build/bundle.nshc --window-size 1200x800   # in a checkout: target/debug/nsh-macos-host
```

`--window-size` es el tamaño inicial de la ventana (apps TSX); la ventana se puede redimensionar. `--display <n>` (`nsh run` / `nsh test
--target macos --display <n>`) centers it on display `n`: `1` es la pantalla principal, la que tiene la barra de menús.

`nsh test --target macos` ejecuta las pruebas de una app TSX en ventanas de macOS, en una pantalla secundaria cuando hay una (la pantalla principal sigue siendo tuya; `--display <n>` elige otra): cada app que abre una prueba obtiene su propia ventana, con el tamaño que la prueba pide incluso en una pantalla más baja, y los pasos hacen clic, escriben y desplazan con la entrada del sistema sobre las vistas que nombran sus selectores ([Testing](./testing-and-trace.md#on-a-real-platform)).

<a id="performance-monitor"></a>

### Monitor de rendimiento

`--fps` (`AppOptions { fps: true, .. }` en el `run_app` de una app Rust, `AppView::set_fps_monitor(true)` al embeber, `nsh run App.tsx --target macos --fps`, el `--fps` del host, o el `open -a MyApp --args --fps` de una app TSX empaquetada) muestra un panel en la esquina superior derecha de la app que se actualiza dos veces por segundo:

| Fila | Qué mide |
|---|---|
| `FPS` | Fotogramas mostrados durante el último segundo: refrescos de pantalla en los que la app cambió (una app inactiva marca un valor bajo; eso no es lentitud). `max` es lo que el hilo principal pudo sostener, seguido de la frecuencia de la pantalla (120 Hz en pantallas ProMotion). |
| `TICK` | Los intervalos entre refrescos de pantalla tal como llegaron (media, p95) y `gap`, el intervalo p95 entre fotogramas mostrados: un refresco (8,3 ms a 120 Hz) cuando nada se retrasa. |
| `MAIN` | Tiempo del hilo principal por fotograma (aplicar los cambios del motor, dibujar texto y canvases, animaciones, entrada), su percentil 95 y `drop`: la proporción de fotogramas que tardaron más de un refresco. |
| `JS` / `CORE` | Por commit: tu código (handlers, temporizadores, filas de listas) y el núcleo de NSH (layout, texto, diffing); commits por segundo, cambios de vistas nativas por commit. |
| `HOP` | Cuánto esperan los cambios entre el hilo del motor y el hilo principal; cuán ocupado está el hilo del motor. |
| `CPU` / `GPU` / `MEM` | El proceso: CPU (100 % es un núcleo), su porcentaje de GPU, su huella de memoria (la cifra del Monitor de Actividad). |

Las barras de abajo muestran el tiempo del hilo principal de los últimos 120 fotogramas frente a un refresco (la línea): verde si está dentro de la mitad, ámbar si está dentro de uno, rojo si lo supera. Mientras el panel está visible, las lecturas también se registran una vez por segundo (target `nsh::perf`, con el formato del backend de Linux y las fases de fotograma de macOS `tick`, `drain` y `canvas`; milisegundos como media/p50/p95/máx), que `nsh test --fps -v` muestra y `examples/gallery/tools/perf.py` lee. Mide con compilaciones release; el monitor no tiene coste mientras está desactivado.

<a id="packaging"></a>

## Empaquetado

```sh
nsh package --target macos [--run]           # a Rust app, from its directory
nsh package App.tsx --target macos [--run]   # a TSX app
```

Escribe un bundle de app:

```text
.nsh/out/<Name>.app/Contents/
  Info.plist
  MacOS/<Name>               the executable: a Rust app's own runner, built with its crate; nsh's release runner for TSX
  Resources/nsh/bundle.nshc  a TSX app, compiled
  Resources/nsh/assets/…     the assets it imports (a Rust crate's `assets!()` too)
  Resources/nsh/app.json     the window title and the app's appearance
  Resources/AppIcon.icns     the icon, when nsh.json names one (converted with sips)
```

El `.app` se firma ad hoc, por lo que se ejecuta en el Mac que lo compiló. Para distribuirlo, fírmalo con un Developer ID y notarízalo. `--run` abre la app después de empaquetarla.

<a id="embedding-in-a-mac-app"></a>

## Embeber en una app de Mac

El crate `nsh-platform-macos` (del repositorio de NSH) ofrece a una app de Mac en Rust `AppView`: un motor NSH como una `NSView`. Cada `AppView` es independiente; pueden ejecutarse varias a la vez. Ejecuta una raíz Rust, el componente raíz de tu crate:

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

`Root::tokens` da a la raíz su [tema](./rust.md#theme) (`nsh_base::Theme::from_json(json)?.into_tokens()`) y `Root::app_id` el id bajo el que se guardan sus datos. Un bundle TSX que escribió `nsh build` se carga en la misma vista:

```rust
use nsh_platform_macos::{AppOptions, AppView, AssetBase, Bundle};

let view = AppView::new(mtm, AppOptions {
    asset_base: Some(AssetBase::Directory("app/assets".into())),
    ..AppOptions::default()
});
let code = std::fs::read_to_string("app/bundle.js").expect("bundle");
view.load(Bundle::source(code).into());
```

`AppView::load` reemplaza lo que se estuviera ejecutando; `stop` termina la app. `asset_base` le indica dónde se resuelven los URI de `asset:/` (`AssetBase::Directory` o `AssetBase::Http`). Los bundles de bytecode (`bundle.nshc`) se cargan con `unsafe { Bundle::bytecode(bytes) }`: el bytecode es una entrada de confianza, así que cárgalo solo desde los archivos de tu propia app.
Para una app que es únicamente una app NSH, `run_app(source, options)` (`AppSource::Rust(root)` o `AppSource::Bundle(bundle)`) abre una `AppView` en una ventana con un menú estándar (About, Hide, Quit, Edit, Minimize, Zoom, Enter Full Screen, Close), que la app puede reemplazar con `Menu.setApplicationMenu` ([`nsh/desktop`](../modules/nsh-desktop.md)), y se ejecuta hasta que la ventana se cierra.
Por defecto, cerrar la ventana o elegir Quit detiene el motor y retorna de `run_app`; el llamador puede entonces terminar la limpieza o relanzar su ejecutable.

Establece `AppOptions { keep_alive_on_close: true, ..Default::default() }` para mantener viva la sesión independiente cuando se cierra su ventana. Al cerrar, la ventana se oculta; al reabrir desde el Dock se muestra esa misma ventana y el mismo motor. Para una salida explícita o un relanzamiento por actualización, llama a `nsh_platform_macos::quit_app()` desde cualquier hilo. Cierra la ventana retenida, detiene el motor y retorna de `run_app`. `nsh_core::element::desktop::close_window()` sigue la política de cierre de ventana elegida.

`AppOptions::cache` (o `AppView::set_cache`, para las apps que se carguen a continuación) establece dónde guardan las apps sus cachés, las [imágenes que descargan](./images-and-assets.md#kept-on-disk) y cuánto conserva cada una (`CacheOptions`: por defecto, el directorio de caché del sistema y 256 MiB de imágenes).

`AppView::set_locale(Some(locale))` y `AppView::set_font_scale(Some(scale))` dan a la app el idioma y el tamaño de texto de tu app en lugar de los del sistema (`None` vuelve a seguir los del sistema): `locale()`, `Intl`, `fontScale()` y el texto los siguen de inmediato ([Device and environment](./device-and-environment.md#in-an-embedding-app)).

`AppView::set_theme_overrides(Some(json))` superpone la marca de tu app al [tema](./tailwind.md#theme-tokens) de la app: un archivo de tema con el formato del `"theme"` de `nsh.json`, cuyos tokens prevalecen sobre los de la app con los mismos nombres, tanto en modo claro como oscuro, mientras que los demás tokens de la app se conservan; clases como `bg-primary` cambian de estilo al instante, y las apps cargadas después arrancan con él (`None` devuelve a la app su propio tema; un archivo que no se puede analizar es un error y no cambia nada).

Los componentes nativos se registran con `AppView::register_component`; consulta [Native components](./native-components.md#registering-on-macos-rust). `set_ui_sets(sets)` establece los conjuntos de UI que sirve cada motor: los de NSH (`nsh_base::registry()`) y los de tus crates (`my_app::registry()`, que `#[native_module]` genera), de modo que el TSX que carga una vista también importa tus componentes y módulos Rust.

<a id="what-differs-on-macos"></a>

## Qué cambia en macOS

El entorno es el de un escritorio: el área segura y la altura del teclado son 0, `idiom()` es el escritorio (`platform.idiom` es `"desktop"`), `os_version()` (`platform.version`) es la versión de macOS, y el modo oscuro sigue en vivo la apariencia del sistema. Consulta [Device and environment](./device-and-environment.md).

La entrada es la de un escritorio: el ratón, el trackpad (desplazamiento con inercia, pellizco y rotación) y el teclado. El texto seleccionable se selecciona arrastrando, con doble y triple clic, y se copia con Cmd+C. Escape, Option+Left, Cmd+[ y el botón de retroceso del ratón cierran el diálogo más reciente o retroceden en una pila (Escape en un campo o una página web con foco solo sale de ellos; una página recibe estas teclas primero y conserva las que usa); un `Dialog` es una capa sobre toda la ventana que muestra el popup y el fondo de la app. Las páginas muestran su `header` en la parte superior. Un clic en cualquier punto de un `Input`, incluido su padding, coloca el cursor en el punto más cercano. `AlertDialog` muestra una hoja `NSAlert` sobre la ventana: hasta dos acciones de alerta en una fila (la acción de cancelar a la izquierda del todo, la última acción normal como predeterminada para Return), y más acciones, así como las acciones de una hoja de acciones, apiladas en su orden con la acción de cancelar al final y sin ninguna predeterminada; Escape elige la acción de cancelar.

<a id="keyboard"></a>

### Teclado

| Teclas | Acción |
|---|---|
| Return | En un `Input`, lo que indica `submitBehavior`: enviar (`onSubmit`), enviar y salir del campo, o una nueva línea (entradas multilínea) |
| Return, Enter del teclado numérico, Espacio | Activa una vista con foco mediante `onPress` una vez al pulsar la tecla; la repetición automática se consume |
| Shift+Return, Option+Return, Ctrl+Return | Una nueva línea en una entrada multilínea cuyo return envía |
| Tab, Shift+Tab (también Ctrl) | El campo o la vista pulsable siguiente / anterior en orden de pantalla, dentro del diálogo más reciente; Option+Tab escribe un tabulador en una entrada multilínea |
| Escape | Sale del campo con foco; si no, borra una selección de texto y luego cierra el diálogo más reciente o retrocede |
| Option+Left, Cmd+[, botón de retroceso del ratón | Retroceder (no mientras un campo tiene el foco: ahí Option+Left mueve el cursor) |
| Option / Cmd + flechas, con Shift; Option+Delete, Cmd+Delete; Ctrl+A / E / K | Mover, seleccionar y borrar por palabra y por línea en un campo, como en cualquier app de Mac |
| Cmd+Z, Shift+Cmd+Z, Cmd+X / C / V / A | Deshacer, rehacer, cortar, copiar, pegar, seleccionar todo (un campo `masked` rechaza cortar y copiar); Cmd+A / Cmd+C seleccionan y copian texto seleccionable |
| Flechas; Page Up / Down, Espacio, Shift+Espacio, Option+Up / Down; Home / End, Cmd+Up / Down | Desplazan la scroll view que rodea la vista con foco o que está bajo el ratón una línea, una página, o al inicio / final (no mientras un campo tiene el foco) |
| Cmd+W, Cmd+M, Ctrl+Cmd+F, Cmd+H, Option+Cmd+H, Cmd+Q | Cerrar, minimizar, pantalla completa, ocultar, ocultar otras, salir (menús de las apps `nsh package` y `nsh run`) |
| Cmd+R | Recarga la última compilación (`nsh run`) |

Los atajos propios de la app ([`keymap`](../modules/nsh.md#keymap)) tienen prioridad sobre estos, excepto las teclas de activación dirigidas a una vista pulsable con foco, y Quit, Hide, Minimize y Full Screen, que no se pueden reasignar.

Los atajos funcionan con cualquier distribución de teclado (en una cirílica o griega, Cmd+C es la tecla que escribe C en una distribución de EE. UU.). Un return que confirma la composición de un método de entrada (chino, japonés, ...) nunca envía. `onKeyPress` informa de lo mismo que React Native: el texto escrito, `"Enter"`, `"Backspace"` y `"Escape"`.

No se admite, o es diferente:

- **Scroll views con zoom** (`zoomTo`, las props de zoom).
- **`mixBlendMode`**, y `brightness()` por encima de 1.
- **Inputs**: tipos de contenido y autocompletado, tipos de teclado, autocapitalización, espaciado entre letras; las vistas accesorias de entrada nunca se muestran (no hay teclado por software) y `keyboardShouldPersistTaps` se ignora.
- **`scrollable={false}` de `WebView`** evita que la rueda del ratón y el trackpad desplacen la página: desplazan las scroll views de la app que la rodean, como en iOS. La página sigue desplazándose con su teclado (Espacio, las flechas) y con sus propios scripts, y los deslizamientos del trackpad entre sus páginas (`allowsBackForwardNavigationGestures`) también se detienen.
- **Accesibilidad**: `accessibilityActions` personalizadas.
- **La barra de estado** y **la háptica** (sin equivalente de escritorio).

<a id="see-also"></a>

## Véase también

- [CLI](./cli.md): `nsh run --target macos`, `nsh package --target macos`
- [Packaging](./packaging.md)
- [Platform-specific code](./platform-specific.md)
