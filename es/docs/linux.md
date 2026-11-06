---
title: "Linux"
description: "Ejecuta apps de NSH en Rust y TSX en Linux dentro de ventanas GTK 4, empaquétalas, intégralas en una app GTK con AppView y consulta qué diferencias hay en Linux."
order: 15
group: platforms
source_hash: c423cb25ff360498
---


# Linux

Las apps de NSH también se ejecutan en Linux. El backend de Linux las renderiza con widgets de GTK 4 y maqueta el texto con Pango; el núcleo, el grafo reactivo, el renderizador, el layout de Taffy y los módulos nativos son los mismos que en iOS y Android, así que una misma app se ejecuta en todas partes. En Linux, `os()` es `Os::Linux` (`platform.os` es `"linux"` en TSX) y se aplican las props `desktop={{…}}` de TSX. El título de la ventana, una barra de título propia de la app, la barra de menús y los menús contextuales provienen de `nsh_core::element::desktop` en Rust ([Barras de título de escritorio](./rust.md#desktop-title-bars)) y de [`nsh/desktop`](../modules/nsh-desktop.md) en TSX.

<a id="requirements"></a>

## Requisitos

- **GTK 4.14** o posterior. Para compilar el runner de una app Rust o el runtime de Linux de NSH (desde un checkout, o `cargo xtask
  dist` on Linux) you need their development packages and clang: `libgtk-4-dev clang` en Debian y Ubuntu (24.04 o posterior), `gtk4 clang` en Arch, `gtk4-devel clang` en Fedora.
- **WebKitGTK 6.0** (2.40 o posterior) para las web views: `libwebkitgtk-6.0-dev` en Debian y Ubuntu, `webkitgtk-6.0` en
  Arch, `webkitgtk6.0-devel` en Fedora para compilar el runtime. El host de desarrollo y el runner de release lo usan por
  defecto, así que las apps empaquetadas necesitan WebKitGTK 6.0 donde se ejecuten (`libwebkitgtk-6.0-4` en Debian y Ubuntu; los escritorios
  GNOME lo incluyen). `cargo xtask dist` en una máquina sin sus archivos de desarrollo compila un runtime cuyas web views
  son marcadores de posición, y cuyas apps solo necesitan GTK.
- Plugins de **GStreamer** para los formatos de vídeo que reproduce tu app (GTK reproduce vídeo mediante GStreamer).

<a id="running-an-app"></a>

## Ejecutar una app

En Linux, `nsh run` abre la app en una ventana GTK. Una app Rust se ejecuta desde su directorio:

```sh
nsh run                        # --target linux is the default on Linux
```

`nsh` compila un runner de depuración con tu crate y abre la app, con sus logs (`log::info!` y el resto) en la
terminal; un cambio en el código Rust del crate vuelve a compilar el runner y reinicia la app. `cargo run` inicia el mismo
root desde el `src/main.rs` del crate, que `nsh init --template rust` escribe: [`run_app`](#embedding-in-a-gtk-app)
con `AppSource::Rust`.

Una app TSX indica su entrada y se abre por defecto en una ventana de 390×844, con hot reload, logs en la terminal y el
overlay de errores, como en los demás destinos:

```sh
nsh run App.tsx
```

En un checkout, `nsh run` compila primero el host de desarrollo (`nsh-linux-host`); la distribución generada en Linux lo incluye
en `runtime/linux/`. Ctrl-C cierra la ventana, y cerrar la ventana termina `nsh run`. El host también ejecuta por sí solo un bundle ya
compilado:

```sh
nsh build my-app --release -o build
dist/nsh/runtime/linux/nsh-linux-host --bundle build/bundle.nshc --window-size 1024x768   # in a checkout: target/debug/nsh-linux-host
```

`--window-size` es el tamaño predeterminado de la ventana (apps TSX); los gestores de ventanas de mosaico pueden asignarle otro.

<a id="packaging"></a>

## Empaquetado

```sh
nsh package --target linux [--run]           # a Rust app, from its directory
nsh package App.tsx --target linux [--run]   # a TSX app
```

Genera un directorio y el mismo contenido como archivo comprimido:

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

El ejecutable encuentra `nsh/` junto a sí mismo (un enlace simbólico a él, en `~/.local/bin` por ejemplo, también funciona). GTK 4, Pango y
WebKitGTK 6.0 deben estar instalados donde se ejecute la app. Para mostrar la app en el lanzador de un escritorio, coloca el ejecutable (o un enlace) en el
`PATH`, el archivo `.desktop` en `~/.local/share/applications` y el icono en un directorio de temas de iconos. `--run` lanza
la app después de empaquetarla.

<a id="embedding-in-a-gtk-app"></a>

## Incrustar en una app GTK

El crate `nsh-platform-linux` (del repositorio de NSH) ofrece a una app GTK en Rust `AppView`: un motor de NSH como widget de GTK.
Cada `AppView` es independiente; pueden ejecutarse varios a la vez. Ejecuta un root de Rust, el componente raíz de tu crate:

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

`Root::tokens` da al root su [tema](./rust.md#theme) y `Root::app_id` el id bajo el que se guardan sus datos. Un bundle
TSX que `nsh build` haya escrito se carga en la misma vista, con `asset_base` apuntando a su directorio `assets`:

```rust
use nsh_platform_linux::{AppOptions, AppView, AssetBase, Bundle};

let view = AppView::new(AppOptions {
    asset_base: Some(AssetBase::Directory("app/assets".into())),
    ..AppOptions::default()
});
let code = std::fs::read_to_string("app/bundle.js").expect("bundle");
view.load(Bundle::source(code).into());
```

`AppView::load` reemplaza lo que se estuviera ejecutando; `stop` termina la app. `asset_base` le indica dónde se resuelven los URI de `asset:/`
(`AssetBase::Directory` o `AssetBase::Http`). Los bundles de bytecode (`bundle.nshc`) se cargan con `unsafe { Bundle::bytecode(bytes) }`:
el bytecode de QuickJS es una entrada de confianza, así que cárgalo solo desde los archivos de tu propia app. Una ventana independiente es
`nsh_platform_linux::run_app(source, options)`, con `AppSource::Rust(root)` o `AppSource::Bundle(bundle)`.

`AppOptions::cache` (o `AppView::set_cache`, para las apps que se carguen a continuación) establece dónde guardan las apps sus cachés, las
[imágenes que descargan](./images-and-assets.md#kept-on-disk) y cuánto conserva cada una (`CacheOptions`: por defecto, el
directorio de caché del sistema y 256 MiB de imágenes).

`AppView::set_locale(Some(locale))` y `AppView::set_font_scale(Some(scale))` dan a la app el idioma y el
tamaño de texto de tu app en lugar de los del sistema (`None` vuelve a seguir los del sistema): `locale()`, `Intl`, `fontScale()` y el texto
los siguen de inmediato ([Dispositivo y entorno](./device-and-environment.md#in-an-embedding-app)).

`AppView::set_theme_overrides(Some(json))` superpone la marca de tu app al [tema](./tailwind.md#theme-tokens) de la app: un archivo de tema
en el formato de `nsh.json` de `"theme"`, cuyos tokens prevalecen sobre los de la app con los mismos nombres en modo claro y oscuro,
mientras que los demás de la app se conservan; las clases como `bg-primary` se reestilizan de inmediato, y las apps cargadas después empiezan con él
(`None` devuelve a la app su propio tema; un archivo que no se pueda analizar es un error y no cambia nada).

Los componentes nativos se registran con `AppView::register_component`; consulta [Componentes nativos](./native-components.md#registering-on-linux-rust).
`set_ui_sets(sets)` establece los conjuntos de UI que sirve cada motor: los de NSH (`nsh_base::registry()`) y los de tus crates
(`my_app::registry()`, que genera `#[native_module]`), de modo que el TSX que carga una vista importa también tus componentes y
módulos de Rust.

<a id="what-differs-on-linux"></a>

## Qué cambia en Linux

El entorno es el de un escritorio: el área segura y la altura del teclado son 0, `idiom()` es el escritorio
(`platform.idiom` es `"desktop"`), `os_version()` (`platform.version`) es la versión mayor y menor del kernel, y el modo oscuro sigue en directo el ajuste del escritorio
(a través del portal de ajustes de XDG). Consulta [Dispositivo y entorno](./device-and-environment.md).

<a id="keyboard"></a>

### Teclado

| Teclas | Acción |
|---|---|
| Intro | En un `Input`, lo que indica `submitBehavior`: enviar (`onSubmit`), enviar y salir del campo, o una nueva línea (inputs multilínea) |
| Shift+Intro, Alt+Intro | Una nueva línea en un input multilínea cuyo Intro envía (Ctrl+Intro envía) |
| Tab, Shift+Tab | El campo siguiente / anterior en el orden de pantalla, dentro del diálogo más reciente |
| Escape | Sale del campo enfocado; si no, borra una selección de texto, y después cierra el diálogo más reciente o retrocede |
| Alt+Izquierda, tecla Atrás, botón Atrás del ratón | Retroceden (también desde un campo) |
| Ctrl+flechas, Inicio / Fin, con Shift; Ctrl+Retroceso / Supr | Mover, seleccionar y borrar por palabra y por línea en un campo, como en cualquier app GTK |
| Ctrl+Z, Ctrl+Shift+Z, Ctrl+X / C / V / A | Deshacer, rehacer, cortar, copiar, pegar, seleccionar todo (un campo `masked` rechaza cortar y copiar); Ctrl+A / Ctrl+C seleccionan y copian texto seleccionable |
| Flechas; Re Pág / Av Pág, Espacio, Shift+Espacio; Inicio / Fin | Desplazan el scroll view que rodea a la vista enfocada o que está bajo el ratón una línea, una página, al principio / al final (no mientras un campo tiene el foco) |
| Ctrl+W, F11, Ctrl+Q | Cerrar la ventana, pantalla completa, salir (apps `nsh package` y `nsh run`) |
| Ctrl+R | Recarga la última compilación (`nsh run`) |

Los atajos propios de la app ([`keymap`](../modules/nsh.md#keymap)) son un controlador de atajos de toda la ventana; Ctrl+Q y
F11 no se pueden asignar.

Los atajos funcionan con cualquier distribución de teclado (en una cirílica o griega, Ctrl+C es la tecla que escribe C en una distribución de EE. UU.).
Un Intro que confirma la composición de un método de entrada (chino, japonés, ...) nunca envía. `onKeyPress` informa de
lo mismo que React Native: el texto escrito, `"Enter"`, `"Backspace"` y `"Escape"`; el texto pegado no se informa.

Las web views son páginas de WebKitGTK, dibujadas dentro de las vistas de NSH: las sheets, los diálogos, los toasts y las vistas posteriores se dibujan sobre una página,
y los padres la recortan y la atenúan. Sus datos de sitio web (cookies, almacenamiento, caché) se guardan por app, en
`~/.local/share/<app id>/webkit` y `~/.cache/<app id>/webkit`. La capacidad `webview` también se aplica a las páginas de
los frames: un `iframe` de un host al que no se concedió acceso a tu app permanece vacío. Escape dentro de una página sale de ella, como en un campo de texto
(salvo que la página lo use); Alt+Izquierda y el botón Atrás del ratón retroceden en la página mientras tenga historial.

No compatible:

- **Vídeo `rate`**: GTK solo reproduce a velocidad normal. `onEnd` solo llega para vídeos que no se repiten en bucle.
- **Scroll views con zoom** (`zoomTo`, las props de zoom).
- **`mixBlendMode` y `backdropFilter`** (el color de fondo sí se dibuja); `borderCurve: "continuous"` dibuja
  esquinas circulares.
- **Input accessory views** y la **barra de estado** (sin equivalente en escritorio).
- **Accesibilidad**: agrupación de `accessible`, `accessibilityActions` personalizado; en su lugar se anuncian las live regions.

<a id="see-also"></a>

## Véase también

- [CLI](./cli.md): `nsh run --target linux`, `nsh package --target linux`
- [Empaquetado](./packaging.md)
- [Código específico de plataforma](./platform-specific.md)
