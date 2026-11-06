---
title: "GPUI"
description: "Integra aplicaciones NSH en Rust y TSX dentro de una aplicación GPUI o GPUI Kit con AppView, dibujadas por GPUI en macOS, Windows y Linux, prueba aplicaciones TSX en el host de desarrollo de GPUI y descubre qué hace de forma diferente el backend de GPUI."
order: 15.5
group: platforms
source_hash: 1f281d4fc1a89362
---


# GPUI

El backend de GPUI dibuja las apps de NSH con [GPUI](https://gpui-kit.com) (GPUI Fast), el framework de UI acelerado por GPU sobre el que se construye
GPUI Kit, en macOS, Windows y Linux por igual. Es el backend para incrustar en apps de GPUI y GPUI Kit: un
`AppView` es una vista de GPUI, de modo que una app de GPUI o GPUI Kit muestra apps de NSH, ya sean una raíz en Rust propia o TSX que carga, en cualquier punto
de su propio árbol de elementos. Las apps independientes
se ejecutan y se empaquetan con el backend propio de cada escritorio: [macOS](./macos.md) (AppKit), [Windows](./windows.md) (Win32)
y [Linux](./linux.md) (GTK). El núcleo, el grafo reactivo, el renderizador,
el layout de Taffy y los módulos nativos son los mismos que en cualquier otra plataforma, así que una app se ejecuta
en todas partes. `os()` (`platform.os` en TSX) es el sistema operativo en el que se ejecuta (macOS, Windows o Linux) y se aplican las props `desktop={{…}}`
de TSX.

Todos los elementos y módulos de los backends de [macOS](./macos.md) (AppKit), [Windows](./windows.md) (Win32) y
[Linux](./linux.md) (GTK) están disponibles; donde GPUI dibuja algo a su manera, [Diferencias](#differences)
explica cómo.

<a id="how-it-works"></a>

## Cómo funciona

- **Un elemento por superficie.** Una superficie es un elemento de GPUI que ocupa el espacio que le da su padre y pinta
  todo el árbol de vistas con las primitivas de GPUI: quads, sombras, trazados, glifos e imágenes. NSH mantiene una vista retenida por
  nodo, como en Windows, y vuelve a dibujar solo cuando un commit ha cambiado algo.
- **El texto se da forma en el hilo del motor** con el sistema de texto de GPUI (las fuentes propias de la app), y NSH lo divide en líneas;
  el hilo principal solo pinta los glifos.
- **Un salto por commit.** El motor se ejecuta en su propio hilo; cada commit es un closure enviado al hilo principal de GPUI,
  que notifica a la vista.
- **La entrada** proviene de los eventos de ratón, scroll, teclado y método de entrada de GPUI; el hit testing, las pulsaciones, el sistema de responders,
  el scroll y la edición de texto usan la misma lógica que el backend de Windows.

<a id="requirements"></a>

## Requisitos

- macOS, Windows o Linux, con una GPU con la que GPUI pueda dibujar (Metal en macOS, DirectX en Windows, Vulkan en Linux).
- En macOS, compilar tu app de GPUI o el runtime desde un checkout usa el Metal Toolchain de Xcode (`xcodebuild -downloadComponent
  MetalToolchain`), which compiles GPUI's shaders ahead of time. On a Mac without it, `nsh run` compila
  el runtime con la característica `runtime-shaders` de GPUI y lo indica: los shaders se compilan al iniciar la app (una fracción
  de segundo la primera vez, y macOS los almacena en caché después).
- En Linux: un driver de Vulkan, Wayland o X11 con `libxkbcommon`, GTK 3 y WebKitGTK 4.1 (vistas web) y GStreamer
  1.20 o posterior con sus plug-ins base y good (vídeos). Las vistas web necesitan X11: en un escritorio Wayland ejecuta la app bajo
  Xwayland (`WAYLAND_DISPLAY=` vacío); de lo contrario muestran un marcador de posición. Compilar el runtime desde un checkout también requiere
  los paquetes de desarrollo; en Debian y Ubuntu:

  ```sh
  sudo apt-get install clang libclang-dev pkg-config libfontconfig-dev libfreetype-dev libwayland-dev libx11-xcb-dev \
    libxcb1-dev libxkbcommon-dev libxkbcommon-x11-dev libzstd-dev libvulkan1 libgtk-3-dev libwebkit2gtk-4.1-dev \
    libgstreamer1.0-dev libgstreamer-plugins-base1.0-dev gstreamer1.0-plugins-good
  ```

<a id="running-an-app"></a>

## Ejecutar una app

Una app de Rust se ejecuta dentro de tu app de GPUI: incrusta su raíz con `AppView` ([Incrustar en una app de GPUI](#embedding-in-a-gpui-app))
y `cargo run` la app de GPUI; tu crate y la app son una sola compilación de Cargo. Por sí sola, una app de Rust se ejecuta con el backend
propio de este sistema operativo (`nsh run --target macos`, `windows` o `linux`).

Una app de TSX se ejecuta en el host de desarrollo de GPUI:

```sh
nsh run App.tsx --target gpui
```

Abre la app en una ventana de GPUI (1200×800 por defecto), tal como la muestra una app de GPUI que la incrusta, con hot reload, logs en
el terminal y la superposición de errores como en los demás destinos. El host de desarrollo (`nsh-gpui-host`) se ejecuta in situ en
cada sistema operativo, sin un app bundle a su alrededor. En un checkout, `nsh run` lo compila primero; la distribución lo incluye en `runtime/gpui/`. El host también ejecuta un bundle
ya compilado por sí solo:

```sh
nsh build my-app --release -o build
dist/nsh/runtime/gpui/nsh-gpui-host --bundle build/bundle.nshc --window-size 390x844   # in a checkout: target/debug/nsh-gpui-host
```

`--window-size` es el tamaño de la ventana en puntos (`<width>x<height>`).

<a id="packaging"></a>

## Empaquetado

Una app de GPUI distribuye NSH dentro de su propio ejecutable: incrusta la raíz en Rust o el bundle TSX de la app con `AppView` ([Incrustar en una app de GPUI](#embedding-in-a-gpui-app)) y se compila y distribuye como la app de GPUI que es. Una app independiente de NSH se empaqueta
con el destino propio de este sistema operativo: [`--target macos`](./macos.md#packaging), [`--target windows`](./windows.md#packaging) o
[`--target linux`](./linux.md#packaging) ([Empaquetado](./packaging.md)).

En Linux, una app de GPUI con vistas web y vídeos enlaza WebKitGTK 4.1 y GStreamer dinámicamente, por lo que las máquinas en las que se ejecuta
necesitan tenerlos instalados, junto con GTK 3 y los plug-ins base y good de GStreamer (Debian / Ubuntu: `libwebkit2gtk-4.1-0`,
`libgstreamer1.0-0`, `libgstreamer-plugins-base1.0-0`, `gstreamer1.0-plugins-good`), además de un driver de Vulkan y
`libxkbcommon`.

<a id="embedding-in-a-gpui-app"></a>

## Incrustar en una app de GPUI

El crate `nsh-platform-gpui` (del repositorio de NSH) ofrece a una app de GPUI en Rust `AppView`: un motor de NSH como vista de GPUI
(`Entity<AppView>`), que ocupa el espacio que le da su elemento padre. Cada `AppView` es independiente; varios
pueden ejecutarse a la vez. Ejecuta una raíz en Rust, el componente raíz de tu crate:

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

`Root::tokens` da a la raíz su [tema](./rust.md#theme) (`nsh_base::Theme::from_json(json)?.into_tokens()`,
`Theme` se reexporta aquí) y `Root::app_id` el id bajo el que se guardan sus datos. Un bundle TSX que `nsh build` escribió
se carga en la misma vista:

```rust
use nsh_platform_gpui::{App, Bundle};

let code = std::fs::read_to_string("app/bundle.js").expect("bundle");
view.load(App::Js(Bundle::source(code)));
```

Coloca la entidad en tu árbol de elementos como cualquier otra vista (un `Root` de GPUI Kit, un panel, un dock). `AppView::load`
reemplaza lo que se estaba ejecutando; `stop` (o soltar la vista) termina la app. `AppOptions::asset_base` le indica dónde se resuelven los URIs
`asset:/` (`AssetBase::Directory` o `AssetBase::Http`). Los bundles de bytecode (`bundle.nshc`) se cargan con
`unsafe { Bundle::bytecode(bytes) }` (o `Bundle::read_trusted(path)`, también unsafe): el bytecode de QuickJS es una entrada de confianza,
así que cárgalo solo desde los archivos de tu propia app.

- `open_app_window(source, options, cx)` abre una ventana con un `AppView` en una app de GPUI en ejecución.
- `run_app(source, options)` inicia GPUI y ejecuta una app en una ventana hasta que se cierra (lo que hace el host de desarrollo).
- `AppView::register_component(name, factory)` registra un componente nativo tuyo antes de cargar
  ([Componentes nativos](./native-components.md)).
- `AppOptions::cache` (o `AppView::set_cache`, para las apps que se carguen después) establece dónde guardan las apps sus cachés, las
  [imágenes que descargan](./images-and-assets.md#kept-on-disk) y cuánto guarda cada una: `CacheOptions { location,
  images }`, `CacheLocation::System` (the default), `Dir(path)` or `Off`, `CachePolicy::Default` (256 MiB),
  `MaxSize(ByteSize::mib(n))` o `Off`.
- `AppView::host()` es el canal de la vista con las apps que ejecuta ([`host`](../modules/nsh.md#host)), un
  `HostChannel` que puede usar cualquier hilo: `set_params(map)` antes de cargar da a la app sus parámetros de lanzamiento
  (`host.params`), `send(name, data)` un evento (`host.on`), y `handle(name, |call| …)` responde a sus
  `host.call(name, data)` y escucha sus `host.post` (`call.resolve(json)`, `call.reject(message)`, en el momento o más tarde
  desde cualquier hilo). Los handlers se ejecutan en el hilo del motor: pasa la llamada a tus entidades de GPUI (un canal que lee una
  tarea de `cx.spawn`) y responde desde allí. Los `AppView`s de macOS, Windows y Linux tienen el mismo `host()`.
  Su `handle_open_url(|request| …)` ve los URLs que abre la app ([`openUrl`](../modules/nsh.md#openurl))
  antes que el sistema: `request.handled()` cuando tu app enrutó el URL por sí misma, `request.decline()` (o soltar
  la solicitud) para que el sistema lo abra con el `open_url` de GPUI.
- `AppOptions::limits` (o `AppView::set_limits`, para las apps que se carguen después) establece los límites de la VM: el heap de JS, la
  pila, los presupuestos de tiempo y la cuota de nodos ([Sandbox y capacidades](./sandbox-and-capabilities.md)). Las apps incrustadas reciben `Limits::default()` (un
  heap de 256 MB); el host de desarrollo ejecuta las apps por su cuenta, con `Limits::standalone()`.
- `AppOptions::transparent` hace la vista transparente: no dibuja fondo de ventana, y `open_app_window` /
  `run_app` abren una ventana transparente, de modo que lo que la app deja sin pintar muestra lo que hay detrás de la ventana (widgets
  de escritorio, superposiciones). Es false por defecto.
- `AppView::connect_dev_server(url, cx)` (característica `dev`) carga la app desde `nsh dev` y la recarga a medida que editas,
  con la superposición de errores sobre la vista; `AppView::on_error` sigue escuchando los errores de la app.
- `AppView::on_app_error(|error| …)` escucha los errores de la app: `error.kind` (la app no se pudo cargar, una
  excepción no capturada, la VM se detuvo), `error.is_fatal()` cuando ya no se ejecuta más JS de la app, `error.message`, `error.stack`
  y `error.package` (el id y la build del paquete firmado del que procede). `AppView::on_error` recibe los mismos
  errores como texto.
- `AppView::set_locale(locale, cx)` y `AppView::set_font_scale(scale, cx)` dan a la app el idioma y el
  tamaño de texto de tu app en lugar de los del sistema (`None` vuelve a seguir los del sistema): `locale()`, `Intl`, `fontScale()` y el texto
  los siguen al instante ([Dispositivo y entorno](./device-and-environment.md#in-an-embedding-app)).
- `AppView::run_package(&package)` ejecuta un [paquete firmado](./signed-packages.md#loading-packages-in-a-host-app)
  desde `verify_package` o `load_package`; `accept_package` lo registra una vez que tu app decidió que está sano.
- `set_ui_sets(sets)` establece los conjuntos de UI que sirve cada motor: los de NSH (`nsh_base::registry()`) y los de tus crates
  (`my_app::registry()`, que `#[native_module]` genera; [Desarrollo con Rust](./rust.md)), y proporciona los conjuntos propios de tu app: una app accede por nombre a las funciones y clases de uno con
  [`nativeModule`](../modules/nsh.md#nativemodule) y se compila con el `nsh build` estándar. El `examples/embed-gpui`
  del repositorio mantiene una mesa de trading en el host de esta manera, que comparten dos tickets de órdenes incrustados y los widgets propios
  del host.

<a id="differences"></a>

## Diferencias

Lo que se dibuja o se comporta de forma distinta respecto a los backends de escritorio nativos:

- **Transformaciones**: las vistas rotadas, sesgadas y proyectadas transforman sus fondos, bordes y sombras, pero el texto permanece
  vertical, y las imágenes, los vídeos y los canvas se dibujan en sus límites.
- **La opacidad** se aplica a cada color en lugar de a un grupo, así que los hijos superpuestos de una vista translúcida se
  ven a través unos de otros; la opacidad de una imagen (un fade-in, una vista translúcida) cambia en dieciseisavos.
- **Los recortes redondeados** (`overflow: "hidden"` con un radio) redondean los fondos y las imágenes de los hijos, pero el texto,
  los bordes, los vídeos y los componentes nativos se cortan con el rectángulo.
- **No se dibujan**: `filter: blur()`, `backdropFilter` y `mixBlendMode`; las sombras se ven a través de los rellenos translúcidos;
  `borderCurve: "continuous"` dibuja esquinas circulares.
- **El texto de canvas** es aproximado: permanece vertical bajo rotaciones, se hace más pequeño en lugar de más estrecho para `maxWidth`,
  los degradados lo pintan de un solo color, `strokeText` rellena, sus sombras no se desenfocan, y las operaciones de composición y
  `clearRect` no se le aplican.
- **Las scroll views** no hacen zoom (`zoomTo` y las props de zoom se ignoran).
- **El vídeo** se reproduce en Linux (GStreamer); en macOS y Windows un vídeo muestra un marcador de posición e informa `onError`.
- **Las vistas web** son vistas nativas situadas sobre todo lo que NSH dibuja en su posición. En Linux necesitan X11 (consulta
  [Requisitos](#requirements)); cuando las páginas se quedan en negro bajo Xwayland ("Failed to create GBM buffer" en el log),
  ejecuta la app con `WEBKIT_DISABLE_DMABUF_RENDERER=1`. En macOS y Windows los ancestros con recorte no las cortan y
  las cargas fallidas no informan `onError`. `baseUrl`, `scrollable` y `allowsBackForwardNavigationGestures` no
  son compatibles.
- **La accesibilidad** pasa por AccessKit: los lectores de pantalla pueden activar, enfocar, establecer valores y desplazar elementos hasta
  hacerlos visibles en todas partes; las acciones personalizadas y la acción de menú contextual aún no se transmiten.

A modo de comparación, la lista de cada backend nativo: [macOS](./macos.md#what-differs-on-macos),
[Windows](./windows.md#what-differs-on-windows), [Linux](./linux.md#what-differs-on-linux).

<a id="see-also"></a>

## Véase también

- [Desarrollo con Rust](./rust.md): el crate cuya raíz incrusta una app de GPUI
- [CLI](./cli.md): `nsh run --target gpui`
- [Empaquetado](./packaging.md): apps independientes, con el destino propio de cada sistema operativo
- [Resumen de plataformas](./platforms.md)
