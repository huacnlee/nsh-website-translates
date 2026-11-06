---
title: "Web"
description: "Crea aplicaciones web en Rust o TSX con componentes de Native Shell renderizados como HTML y CSS, desarrolla en el navegador y publica en cualquier host estático o CDN."
order: 16
group: platforms
demo: counter
source_hash: 3d223070a2f7ac3d
---


# Web

Crea apps web con Native Shell usando los mismos componentes, estilos y lógica de aplicación que en las plataformas nativas. NSH renderiza la interfaz como elementos HTML y CSS: el texto, las imágenes, los campos de entrada, el desplazamiento, los estilos visuales y las interacciones usan el DOM del navegador y las APIs web.

`nsh package --target web` publica la app como un sitio estático para cualquier servidor web o CDN ([Publicar una app](#publish-an-app)), y `nsh run --target web` la ejecuta en el navegador mientras la editas ([Desarrollar en el navegador](#develop-in-the-browser)). Todas las demos en vivo de este sitio usan este backend web.

Las apps TSX publicadas usan el motor JavaScript del navegador. El empaquetado enlaza a cada app su propio runtime, que contiene solo los componentes de `nsh/base` y los módulos estándar que la app importa: una app construida con los componentes principales descarga unos 1,1 MB. Los datos de resaltado de sintaxis se cargan la primera vez que se resalta código.

<a id="what-runs-where"></a>

## Qué se ejecuta dónde

La página se construye con elementos HTML estilizados con CSS. NSH convierte las actualizaciones de componentes en lotes de cambios del DOM, mientras que el navegador muestra la interfaz y gestiona el desplazamiento, la selección de texto y la entrada. WebAssembly aloja el motor compartido en Rust para el estado de los componentes, el layout y las actualizaciones: con el crate de una app Rust compilado dentro, o junto al motor JavaScript del navegador, que ejecuta el código de una app TSX como módulos ES: apps publicadas, la página del servidor de desarrollo, las demos de este sitio y el playground por igual.

En todas las plataformas nativas el motor tiene su propio hilo y entrega un `MountBatch` por commit al hilo principal. Una página del navegador tiene un solo hilo, así que el build web hace avanzar el mismo motor paso a paso desde el bucle de eventos de la página (`nsh_engine::LocalEngine`):

```text
pointer / keyboard / scroll events ─┐
setTimeout (the engine's deadline) ─┼─▶ nsh.wasm: engine turn (Rust or JS, core, layout) ─▶ one JSON batch ─▶ nsh.js: DOM
requestAnimationFrame ──────────────┘                                                 ▲
                                                          native animation outputs ───┘
```

- **El layout es del núcleo.** Cada vista es un elemento posicionado de forma absoluta en el frame que calculó Taffy, de modo que flexbox, grid, `aspectRatio` y los porcentajes se comportan exactamente igual que en los dispositivos. El layout propio del navegador no interviene.
- **Los estilos se convierten en CSS en Rust.** El fondo, los bordes, los radios, las sombras (`boxShadow`, `textShadow`), los degradados, los filtros, `backdropFilter`, las transformaciones, `transformOrigin`, `outline`, `mixBlendMode`, las transiciones y las animaciones keyframe integradas pasan a ser propiedades CSS. Las clases de Tailwind, los estados `active:`, `hover:` y `focus:` y `dark:` se resuelven de forma nativa, igual que en los dispositivos.
- **El texto se maqueta en Rust** con medidas de fuentes del navegador (`CanvasRenderingContext2D.measureText`) y se dibuja tramo a tramo en las posiciones que eligió el layout, de modo que lo que se midió es lo que se dibuja. Las líneas se rompen después de los espacios, alrededor de los caracteres CJK y en `\n`; `numberOfLines` trunca con puntos suspensivos.
- **Las animaciones nativas se ejecutan en Rust** en `requestAnimationFrame`: temporización `Animated`, spring y decay, `interpolate`, valores animados enlazados a `opacity`, `translate`, `rotate`, `scale`, los pasos de `transform` y `backgroundColor`, arrastres enlazados con `pan`, valores vinculados al scroll y argumentos de canvas. JS no interviene en cada frame, como en los dispositivos. `LayoutAnimation`, las transiciones de estilo, los keyframes de `animate-*` y las transiciones de pantalla se mueven como en los backends de escritorio, y `prefers-reduced-motion` las desactiva (las pantallas se desvanecen).
- **Entrada:** pulsaciones con feedback de `activeStyle` / `active:` y pulsaciones largas, el sistema de responders (`onTouch*`, `PanResponder`), arrastres nativos y pellizco y rotación con dos dedos, vistas de scroll (el desplazamiento del navegador), pull to refresh, vistas de scroll con zoom (pellizco, ctrl+rueda y pellizcos del touchpad, `zoomTo`), `<Input>` con valores controlados, foco y envío, `Canvas`, `NavStack` y `NavPage` con `header` de la página, `Dialog`.
- **La interfaz del sistema se dibuja en la página:** `AlertDialog` tiene el aspecto de los diálogos de los backends de escritorio en los navegadores de escritorio y el de iOS en los teléfonos (con el idioma `desktop`, véase más abajo). Las fuentes personalizadas se miden de nuevo cuando el navegador las ha cargado, y una app espera a las fuentes que importa antes de mostrar su primer frame.
- **Los diálogos** son una capa sobre toda la app que muestra el popup y el fondo de la app, como en los backends de escritorio. Escape, el botón de retroceso del navegador y una pulsación sobre el fondo los cierran (`closeOnEscape`, `closeOnBackdropPress`), y `animation`, `onOpen`, `onClose`, `onCancel` y `onOpenChange` funcionan como en los dispositivos. Una página que [incrusta la app](#embed-it-in-a-page) en una parte de su layout puede mostrar diálogos y alertas sobre toda la ventana del navegador (`dialogs: "viewport"`), como iOS y Android los muestran sobre toda la pantalla.

<a id="keyboard-mouse-and-touch"></a>

## Teclado, ratón y táctil

Las apps publicadas se comportan como apps de escritorio en los navegadores de escritorio y como apps de teléfono en los navegadores de teléfono:

- **Ruedas y touchpads** desplazan la vista de scroll más interna que pueda moverse en su eje (una rueda vertical desplaza una lista horizontal cuando no hay nada que se pueda mover en vertical) y se quedan en ella hasta que termina el desplazamiento; los pasos de la rueda se deslizan, y las vistas con paginación y snapping avanzan una página por desplazamiento. Ctrl + rueda y los pellizcos del touchpad hacen pellizcar las vistas con valores de pellizco nativos en lugar de hacer zoom en la página. Arrastrar con el ratón no desplaza, como en las plataformas de escritorio: los arrastres con el ratón van a los pans, al sistema de responders y a la selección de texto. Las vistas de scroll notifican `onScrollDragStart` / `onScrollDragEnd`, `onMomentumStart` / `End` y `onScrollEnd` como en las plataformas de escritorio.
- **Teclado**: Tab y Shift+Tab se mueven entre elementos pulsables y campos de entrada (los estilos `focus:` de la app muestran el foco del teclado); Return pulsa el elemento pulsable enfocado, Space lo pulsa al soltarse; las flechas, Page Up / Page Down, Space, Home y End desplazan la vista de scroll que rodea al foco o que está bajo el ratón; Escape abandona un campo, cierra el diálogo y luego retrocede. Los atajos de `keymap` funcionan en el navegador, comparados al instante (`mod` es Command en Safari y Chrome en un Mac, Control en el resto).
- **Retroceso**: Escape, Alt+Izquierda (Cmd+[ en un Mac) y el botón de retroceso del ratón cierran el diálogo más reciente o sacan el stack más interno, como hace el botón de retroceso de Android; `popOnBack` y `onBackPress` funcionan como allí. Cuando la app ocupa toda la página, cada página apilada y cada diálogo abierto es una entrada del historial del navegador, de modo que el botón de retroceso del navegador retrocede dentro de la app.
- **Táctil**: solo las vistas de scroll hacen pan; la página nunca se desplaza, hace zoom ni hace pull to refresh por debajo de la app, y los toques no tienen retraso. En un iframe, los deslizamientos que la app no captura desplazan la página que la incrusta. Los arrastres sobre vistas con pans nativos, pellizcos y el sistema de responders pertenecen a la app.
- **Accesibilidad**: `role`, `accessibilityLabel`, `accessibilityHint`, `accessibilityState`, `accessibilityValue`, `accessibilityLiveRegion` y `accessibilityElementsHidden` se convierten en ARIA; `announce` habla a través de una región live y `setAccessibilityFocus` mueve el foco. Las vistas situadas bajo un diálogo o una alerta son inertes.
- **Selección y menús**: en los navegadores de escritorio el texto es seleccionable por defecto, como en una página web, excepto dentro de elementos interactivos (vistas con manejadores de pulsación o de toque: botones, filas pulsables, pestañas) y el texto con `userSelect: "none"` o `select-none`; arrastrar el ratón sobre él lo selecciona, Ctrl/Cmd+C lo copia línea a línea y Ctrl/Cmd+A selecciona todo el texto en el que se encuentra la selección. En los navegadores de teléfono y tableta solo es seleccionable el texto con `userSelect: "text"`, como en las apps nativas. El menú contextual del navegador aparece solo en el texto seleccionable y en los campos de entrada.


<a id="apps-with-rust-components"></a>

## Apps con componentes Rust

Una app escrita en Rust ([Construir con Rust](./rust.md)) se publica y se ejecuta en el navegador desde su directorio:

```sh
nsh package --target web           # .nsh/out/<Name>/: the app's own nsh.wasm, with its crate
nsh run --target web               # the dev server's page; editing the Rust code builds it again
```

Cuando `nsh.json` nombra el componente raíz de la app (`"root"`), la página consiste en el Rust de la app y el script de página de NSH, y nada más: `nsh.wasm` contiene el motor, los componentes y el crate de la app, el sitio no tiene `app.js`, y la página monta la raíz en cuanto el runtime y las fuentes están cargados. Toda la galería de Rust pesa 3,3 MB (1,06 MB con gzip, 0,75 MB con brotli), menos que el runtime de las apps TSX. Bajo su entrada TSX (`nsh package App.tsx --target web`), la misma app se ejecuta como las apps TSX, en el motor JavaScript del navegador, e importa los componentes y módulos del crate.

En cualquier caso, los assets del crate (`assets!()`) se publican junto con los de la app, y sus fuentes se cargan antes del primer frame. Durante `nsh run --target web`, un cambio en el código Rust del crate vuelve a construir el runtime y la página abierta lo carga por sí sola; las ediciones TSX siguen siendo hot updates. El runtime de desarrollo se construye de forma incremental, así que un cambio en el crate está listo en aproximadamente un segundo; `nsh package` construye el runtime publicado optimizado en tamaño.

El código Rust que se ejecuta en todas las plataformas, la web incluida, usa los servicios del motor: `fetch(url).await` hace peticiones HTTP a través de la misma pila de red que `fetch` de JS (la del navegador aquí, con sus reglas CORS); `timer`, `set_timeout` y `set_interval` esperan; y `nsh_core::time::Instant` y `nsh_core::time::unix_ms()` leen el reloj. `background` y `blocking` ejecutan trabajo en los hilos de los destinos nativos.

El build necesita el target de Rust y un clang que compile a WebAssembly, como el propio build del runtime: `rustup target add wasm32-unknown-unknown`, además de `clang` y `llvm-ar` (en macOS, una toolchain LLVM como la de Homebrew, `llvm`, mediante `CC_wasm32_unknown_unknown` y `AR_wasm32_unknown_unknown`).

<a id="browser-apis-from-rust"></a>

### APIs del navegador desde Rust

Un crate puede llamar a las propias APIs del navegador a través de [wasm-bindgen](https://wasm-bindgen.github.io/wasm-bindgen/) y sus crates `web-sys` y `js-sys`, detrás de `#[cfg(target_arch = "wasm32")]`: un WebSocket, `IndexedDB`, el portapapeles, cualquier API Web y JS propio del crate (`#[wasm_bindgen(inline_js = …)]`, `module = "/js/…"`). Cuando el runtime web de la app llama a JS de esta forma (incluidas las conversiones de `JsValue`), `nsh` ejecuta sobre él la CLI de `wasm-bindgen` y entrega su glue y el JS del crate junto al runtime, tanto en desarrollo como en los sitios publicados. La versión de la CLI es la del crate `wasm-bindgen` que enlaza el runtime, que `nsh` nombra: `cargo install wasm-bindgen-cli --version <version> --locked` la instala (`NSH_WASM_BINDGEN` indica una CLI en un lugar distinto de `PATH`). Un runtime que enlaza wasm-bindgen y no llama a ningún JS a través de él (por las características por defecto de una dependencia) se construye como cualquier otro runtime.

El crate nombra las APIs que usa como características de `web-sys`, y fijar `wasm-bindgen` mantiene su versión, y por tanto la de la CLI, igual de un build a otro:

```toml
[target.'cfg(target_arch = "wasm32")'.dependencies]
wasm-bindgen = "=0.2.129"
web-sys = { version = "0.3", features = ["WebSocket", "MessageEvent"] }
futures-channel = "0.3"
```

Los callbacks del navegador (llega un mensaje, vence un temporizador de la página) despiertan las tareas de la app, que se ejecutan de inmediato:

```rust
#[cfg(target_arch = "wasm32")]
async fn echo(url: &str, text: String) -> Result<String, String> {
    use wasm_bindgen::{JsCast, prelude::*};
    let ws = web_sys::WebSocket::new(url).map_err(|e| format!("{e:?}"))?;
    let (tx, rx) = futures_channel::oneshot::channel();
    let tx = std::cell::RefCell::new(Some(tx));
    let on_message = Closure::<dyn FnMut(web_sys::MessageEvent)>::new(move |e: web_sys::MessageEvent| {
        if let (Some(tx), Some(data)) = (tx.borrow_mut().take(), e.data().as_string()) {
            let _ = tx.send(data);
        }
    });
    ws.set_onmessage(Some(on_message.as_ref().unchecked_ref()));
    on_message.forget();
    let open = ws.clone();
    let on_open = Closure::<dyn FnMut()>::new(move || {
        let _ = open.send_with_str(&text);
    });
    ws.set_onopen(Some(on_open.as_ref().unchecked_ref()));
    on_open.forget();
    rx.await.map_err(|_| "closed".to_owned())
}
```

Las llamadas de un crate a las APIs del navegador se ejecutan con los permisos propios de la página, igual que el código nativo de un crate se ejecuta con los de la app en las demás plataformas: las capacidades de `nsh.json` gobiernan lo que pasa por el motor (`fetch`, el JS de la app), y las reglas del navegador (CORS, la Content-Security-Policy de la página) gobiernan cada petición que hace la página.

<a id="publish-an-app"></a>

## Publicar una app

```sh
# A Rust app, from its directory
nsh package --target web                   # .nsh/out/<Name>/: a static site
nsh package --target web --run             # and serve it on this machine (open the address it prints)

# A TSX app
nsh package App.tsx --target web
nsh package App.tsx --target web --run
```

`nsh package --target web` escribe `.nsh/out/<Name>/` (`--out` para otro directorio), organizado como un build de frontend: una página y archivos con nombre derivado de su contenido.

| Archivo | Qué es |
|---|---|
| `index.html` | La página de la app: su nombre como título, los iconos, los colores de su `appearance`, un indicador de carga y un mensaje cuando la app no puede cargarse o iniciarse |
| `manifest.webmanifest` | El nombre, el id, los iconos y los colores con los que los navegadores instalan la app |
| `nsh.<digest>.js` | El runtime del DOM, minificado (79 KB, 22,5 KB con brotli) |
| `nsh.<digest>.wasm` | El motor Rust, el layout y los componentes, más el propio crate de una app Rust. TSX se ejecuta en el JavaScript del navegador; el empaquetado lo enlaza solo con los componentes y módulos estándar que importa la primera pantalla de la app. |
| `nsh-<name>.<digest>.wasm` | Componentes, módulos estándar y shaders que la app usa más allá de su primera pantalla: se descargan en segundo plano después de que se muestre |
| `<file>.br`, `<file>.gz` | Cada archivo comprimido de antemano, para los hosts que envían archivos precomprimidos |
| `nsh-syntaxes.<digest>.bin` | Las sintaxis con las que se resalta el código (el conjunto de bat: 0,92 MB, 0,8 MB con brotli), que se descargan la primera vez que un bloque de código, un `Editor` o un `DiffView` muestra código en un lenguaje |
| `nsh-bindgen.<digest>.js` | El glue de wasm-bindgen de una app cuyos crates llaman a [APIs del navegador desde Rust](#browser-apis-from-rust), minificado |
| `snippets.<digest>/<crate>-<hash>/…` | El JS de esos crates que importa el glue (`inline_js`, `module = "/js/…"`), bajo las rutas que le da wasm-bindgen |
| `app.<digest>.js` | La entrada TSX compilada como módulo ES, cargada por el navegador. |
| `host.<digest>.js` | El host de la página, `nsh.json` `web.host` ([las funciones del host](#the-hosts-functions)) |
| `<name>.<digest>.js` | Módulos ES cargados bajo demanda por `import()`. |
| `assets/<path>.<digest>.<ext>` | Cada asset que importa la app, cargado desde su URL cuando se usa (las fuentes antes de que se ejecute el código que las registra, ya que el texto se mide con ellas: antes de que arranque la app, o junto con el chunk que las importa) |
| `icons/<size>.<digest>.png` | El icono de `nsh.json` en 32 (favicon), 180 (`apple-touch-icon`), 192 y 512 píxeles |

`<digest>` es el comienzo del SHA-256 del contenido del archivo: el nombre de un archivo cambia exactamente cuando cambia su contenido, de modo que una nueva versión cambia solo `index.html` y los archivos que realmente cambiaron. Todo usa URLs relativas, así que el sitio funciona desde cualquier directorio de cualquier host (`https://example.com/apps/counter/`).

<a id="runtime-size"></a>

### Tamaño del runtime

El empaquetado enlaza a cada app su propio `nsh.<digest>.wasm`, que contiene el motor y los componentes de `nsh/base`, los módulos estándar y los shaders que importa la primera pantalla de la app. Lo que importan las demás pantallas de la app se descarga en segundo plano una vez que se muestra la primera pantalla. Una app cuyos crates llaman a [APIs del navegador desde Rust](#browser-apis-from-rust) obtiene el runtime completo, con sus crates incluidos, en su `nsh.<digest>.wasm`. Medido con `nsh package --target web` (MB = 10^6 bytes):

| App | Usa | `nsh.<digest>.wasm` | gzip | Brotli |
|---|---|---|---|---|
| `examples/counter` | Los componentes principales | 3,96 MB | 1,32 MB | 0,97 MB |
| `examples/gallery` | Todos los componentes, `zlib` y shaders | 4,13 MB | 1,36 MB | 1,01 MB |
<a id="deploy-it"></a>

### Despliégalo

Sube el directorio a cualquier host estático: un almacén de objetos detrás de un CDN, Cloudflare Pages, Netlify, GitHub Pages, nginx. Dos reglas hacen que cargue rápido y se actualice de forma fiable:

| Archivos | `Cache-Control` |
|---|---|
| `index.html`, `manifest.webmanifest` | `no-cache` (se revalidan en cada carga, de modo que una versión nueva se ve al instante) |
| todo lo demás | `public, max-age=31536000, immutable` |

Sirve `.wasm` como `application/wasm` (así los navegadores lo compilan mientras se descarga) y envía las copias precomprimidas a los navegadores que las aceptan: `brotli_static on; gzip_static on;` de nginx, `file_server {
precompressed br gzip }` de Caddy, o un CDN que comprima con Brotli. Con Brotli el runtime es aproximadamente una cuarta parte más pequeño que con gzip. `nsh package --target web --run` sirve el sitio de esta manera en `http://127.0.0.1:4173/`.

Una app publicada para la web se ejecuta como una app nativa empaquetada: como una release, con las capacidades que declara su `nsh.json` ([Sandbox y capacidades](./sandbox-and-capabilities.md)), una app TSX sobre el motor de JavaScript del navegador. Cuando restringen `network`, la página también incluye una Content-Security-Policy `connect-src` con los hosts declarados (y el origen de la propia página), de modo que el propio navegador rechaza las solicitudes y los saltos de redirección a cualquier otro host. Un error que impide el arranque se muestra en la página; los errores posteriores van a la consola del navegador.

<a id="embed-it-with-an-iframe"></a>

### Insértala con un iframe

No hay una API de incrustación en la web: inserta la app publicada con un `<iframe>`. Su tamaño es la ventana de la app:

```html
<iframe src="https://apps.example.com/counter/" title="Counter"
        style="width: 390px; height: 844px; border: 0"></iframe>
```

<a id="develop-in-the-browser"></a>

## Desarrollar en el navegador

```sh
nsh run --target web               # a Rust app, from its directory
nsh run App.tsx --target web       # a TSX app
```

inicia el servidor de desarrollo e imprime la dirección de su página, `http://127.0.0.1:8790/`: ábrela en cualquier navegador. La página es un host de desarrollo como los demás: ejecuta cada build de la app, muestra los errores de compilación y de ejecución sobre la app, y envía los logs de la app a la terminal. Un cambio en el crate de una app Rust vuelve a compilar su runtime y la página abierta lo carga por sí sola; las ediciones de TSX se aplican en el sitio (hot updates). Los teléfonos de la misma red abren la dirección que `nsh run` imprime debajo (`on this network: http://192.168.…:8790/`). `nsh dev` sirve la misma página una vez que el runtime web está disponible (en la distribución, siempre).

<a id="build-the-websites-player"></a>

## Compilar el reproductor del sitio web

```sh
cargo xtask web                       # nsh.wasm, nsh.js, the player and website/demos/*.tsx
cargo xtask web --out target/play     # somewhere else
```

El directorio de salida contiene:

| Archivo | Qué es |
|---|---|
| `gallery/nsh.<digest>.wasm` | El runtime de la galería, enlazado para ella por `nsh package` (usa todos los componentes y `zlib`: unos 11,8 MB, 3,6 MB con gzip) |
| `gallery/nsh-syntaxes.<digest>.bin` | Las sintaxis con las que el runtime resalta el código, que se descargan la primera vez que una demo muestra código en un lenguaje |
| `nsh-playground.wasm` | Lo mismo más el compilador TSX de NSH, para el [playground](#the-playground) (unos 8 MB, 2,4 MB con gzip) |
| `gallery/nsh.<digest>.js` | El runtime DOM (minificado): carga el wasm, aplica lotes, convierte la entrada en eventos |
| `index.html` | Una página de reproductor: ejecuta `demos/<name>.js` para `#<name>` |
| `nsh.wasm`, `nsh.js`, `browser/` | El runtime que carga el reproductor: el motor, el runtime DOM y los módulos del host del navegador |
| `demos/<name>.js` | Cada demo compilada por `nsh build --release`: un módulo ES |
| `gallery/` | La app de la galería publicada con `nsh package --target web`, mostrada en la página [Gallery](/gallery) |

Sirve el directorio con cualquier servidor estático (necesita el tipo MIME `application/wasm` para la compilación en streaming) y abre `index.html#counter`.

<a id="the-playground"></a>

## El playground

El [Playground](/playground) edita y ejecuta una app en el navegador: la página compila el TSX con el propio compilador JSX de NSH (integrado en `nsh-playground.wasm`, sin rolldown) y lo ejecuta en el motor de JavaScript del navegador en cada pausa al escribir. Cada demo de este sitio tiene un enlace **Edit in Playground**, y **Share** coloca el código en el propio enlace, de modo que no se almacena nada en un servidor.

Una app del playground es un único módulo: importa los módulos de NSH (`nsh` y `nsh/*`) pero ningún otro archivo ni paquete. La salida y los errores de `console.log` aparecen debajo del teléfono.

El compilador también es una función de Rust, `nsh_bundler::compile_module(name, source, ui_sets)`, disponible sin la feature `bundle` del crate.

<a id="embed-it-in-a-page"></a>

## Insertarla en una página

Una app Rust se inserta como su sitio publicado, en un [iframe](#embed-it-with-an-iframe). Para TSX, `nsh.js` es un módulo ES. `createPlayer` carga el runtime en un contenedor; `runModule(url)` inicia un bundle que `nsh build` escribe (`bundle.js`, un módulo ES) en el motor de JavaScript del navegador, en un realm propio de la app, reemplazando lo que se estaba ejecutando. Devuelve una promesa que se resuelve cuando el módulo se ha cargado y se rechaza con el error que lo detuvo, el cual el reproductor también notifica (`onError`):

```js
import { createPlayer } from "./nsh.js";

const player = await createPlayer(document.querySelector("#phone"), {
  wasm: "./nsh.wasm",
  assetBase: "./assets/",   // where `asset:/…` URIs (image imports) are served from
  // dark: true,            // force an appearance; otherwise it follows the system
  // idiom: "phone",        // force "phone", "pad" or "desktop"; otherwise the pointer and the size decide
  // history: false,        // pages and dialogs as browser history entries; by default only when the app is the page, not in an iframe
  // dialogs: "viewport",   // Dialog, Sheet and AlertDialog over the whole browser window; by default over the container
});
await player.runModule(new URL("./bundle.js", location.href).href);
```

`assets` (un mapa de rutas de `asset:/` a URLs) reemplaza a `assetBase`, `readAsset(uri)` devuelve los bytes de un asset que el motor necesita de inmediato (una fuente) o `null`, `data` asigna a sus URLs los archivos que el runtime descarga cuando los necesita por primera vez (`syntaxes`: `nsh-syntaxes.<digest>.bin`; por defecto `nsh-<name>.bin` junto a `nsh.js`), y `glue` es la URL del glue de wasm-bindgen de un runtime cuyos crates llaman a [APIs del navegador desde Rust](#browser-apis-from-rust) (`nsh-bindgen.<digest>.js`), que el reproductor carga con el runtime; `player.runModule(url, { capabilities, appId })` ejecuta la app con las capacidades que declara (su `capabilities.json`) y guarda su almacenamiento bajo su id de `nsh.json` (sin uno, bajo la ruta de la página). La página que escribe `nsh package --target web` los usa todos.

`runModule(url, { chunks })` también acepta la ubicación de los chunks de un [bundle dividido](#split-bundles).

`player.runSource(code, { name, sourceMap, capabilities, appId })` ejecuta un módulo ES dado como texto fuente, con las mismas opciones. Con `nsh-playground.wasm`, `player.compileAndRun(tsx, name, options)` compila primero el TSX, lo ejecuta con las opciones de `runSource` y se resuelve con el error de compilación, o `null`; `player.compile(tsx)` devuelve `{ code }` o `{ error }`.

El tamaño del contenedor es la ventana de la app (`windowSize()`); al redimensionar el contenedor se redimensiona la app. `player.setDark(true)` cambia la apariencia en tiempo de ejecución, que las apps observan mediante las clases `colorScheme()` y `dark:`.

Los diálogos y las alertas cubren el contenedor. Con `dialogs: "viewport"` cubren toda la ventana del navegador, como lo hacen los diálogos modales propios de una página, mientras la app conserva el contenedor como su ventana: un `Dialog` se maquetea con el tamaño y el área segura de la ventana y entra deslizándose desde su borde inferior, su fondo cubre toda la página y la rueda del ratón sobre él deja la página en su sitio. El diálogo se muestra en la capa superior (top layer) del navegador (Chrome 114, Safari 17, Firefox 125 y posteriores), por lo que queda por encima del resto de la página dondequiera que esté el contenedor; en navegadores anteriores cubre el contenedor.


`Sheet` sigue el mismo ajuste de presentación que `Dialog` y `AlertDialog`. En un iframe del mismo origen, la presentación en el viewport cubre automáticamente la página exterior, mientras la app conserva su tamaño de maquetación original.
El iframe vuelve a su posición y tamaño originales cuando se cierra el último popup; su motor y su estado siguen activos.
Las demos de la documentación activan esta presentación.

Para un iframe de origen cruzado o con sandbox, la página que lo incrusta registra el host antes de cargar el reproductor:

```js
import { hostPlayerFrame } from "./nsh.js";
const frame = document.querySelector("iframe");
const disconnect = hostPlayerFrame(frame);
frame.src = "https://apps.example.com/player.html"; // player uses dialogs: "viewport"
// When removing the embedding: disconnect();
```

El host acepta solicitudes de la ventana de este iframe, mantiene inerte la página circundante y bloquea su desplazamiento mientras un popup es visible, y restaura ambos al cerrarse. Cada frontera de incrustación de origen cruzado requiere la cooperación de su host; sin ella, la presentación permanece dentro de ese documento y el reproductor notifica una advertencia.

<a id="the-hosts-functions"></a>

## Las funciones del host

En la web la página es el host de la app: responde a `host.call(name, args)` de [`host`](../modules/nsh.md#host) y envía los eventos que `host.on` escucha. `host` de `createPlayer` es un objeto cuyo `call(name, args)` devuelve el resultado, o una promesa de él; un throw o un rechazo rechaza la llamada de la app con el mensaje del error. `player.hostEvent(event, payload)` envía un evento con una carga útil JSON (una carga que no sea JSON lanza una excepción). Con un `host`, `host.available()` es `true`.

```js
const player = await createPlayer(container, {
  wasm: "./nsh.wasm",
  host: {
    async call(name, args) {
      if (name === "user.info") return { name: "Ada" };
      throw new Error(`no host function ${name}`);
    },
  },
});
player.hostEvent("theme", { dark: true });
```

Una app publicada obtiene su host de `nsh.json`: `web.host` nombra un módulo JS en el directorio de la app, relativo a `nsh.json`, que exporta `createHost(player)`. `nsh package --target web` lo copia en el sitio como `host.<digest>.js`, y la página ejecuta `createHost` con el reproductor antes de que la app arranque; lo que devuelve (o con lo que se resuelve) debe tener una función `call`, o la página muestra que no se pudo cargar la app. El reproductor `createHost` recibe envía eventos a partir de ese momento:

```json
{
  "capabilities": {
    "host": ["user.*"]
  },
  "web": { "host": "./host.js", "connect": ["api.example.com"] }
}
```

```js
// host.js
const post = (url) => (args) =>
  fetch(url, { method: "POST", body: JSON.stringify(args) }).then((r) => r.json());

// The functions the app may call, by their exact names.
const functions = new Map([
  ["user.info", post("https://api.example.com/user/info")],
  ["user.settings", post("https://api.example.com/user/settings")],
]);

export async function createHost(player) {
  addEventListener("online", () => player.hostEvent("online", {}));
  return {
    call(name, args) {
      const f = functions.get(name);
      if (!f) throw new Error(`no host function ${name}`);
      return f(args);
    },
  };
}
```

El host busca cada nombre tal cual en una tabla de sus funciones, como arriba, y mantiene sus URLs y rutas como propias: `capabilities.host` concede nombres por su comienzo (`user.*`), de modo que un nombre que el host convirtiera en una ruta podría alcanzar lo que la concesión deja fuera. El runtime deja pasar nombres de 1 a 128 caracteres de `A`–`Z`, `a`–`z`, `0`–`9`, `_`, `.`, `:` y `-`, sin `..`, y rechaza la llamada de cualquier otro nombre. Una concesión por prefijo termina con un separador (`bridge.*`): `bridge*` también coincide con `bridgeAdmin`.

Los eventos enviados antes de que la app se ejecute, como los de `createHost` mismo, se entregan en orden en cuanto arranca, de modo que los listeners de `host.on` de nivel superior de la app los reciben. Un evento enviado antes de que se registre un listener no se reproduce para él: una app lee el estado con el que empieza mediante una llamada (`host.call("user.info")`) y sigue sus cambios mediante eventos.

El módulo del host se ejecuta en la página de la app y comparte su Content-Security-Policy: cuando las capacidades de la app restringen `network`, el `connect-src` de la página contiene el origen de la página, los hosts que lista `capabilities.network` y los hosts que lista `web.connect`. `web.connect` nombra los hosts a los que llegan las solicitudes propias del módulo del host (`fetch`, `XMLHttpRequest`, `WebSocket`), como patrones iguales a los de `capabilities.network.hosts` (`api.example.com`, `*.example.com`, `"*"`), como `api.example.com` más arriba; las solicitudes propias de la app siguen comprobándose contra su `capabilities`.

El módulo se copia tal cual, por lo que importa otro código mediante una URL absoluta. La app sigue necesitando su [capacidad](./sandbox-and-capabilities.md) `host` para cada función que llama. `nsh run --target web` lo ejecuta en la página de desarrollo, y `nsh test` ejecuta el mismo módulo para cada app que abren sus tests, sin interfaz o en un navegador (`--target web`), de modo que la app y su host se prueban juntos ([Testing](./testing-and-trace.md#the-pages-host)).

<a id="the-browser-as-a-platform"></a>

## El navegador como plataforma

`platform.os` es `"web"`. El tipo de dispositivo en el que está el navegador decide cómo se comporta la app, según `platform.idiom`:

- `"desktop"`: un ratón (un puntero fino que admite hover) y un contenedor de al menos 600 puntos de ancho. `platform.desktop` es `true`, `platform.select` elige `desktop` y se aplican las props `desktop={{…}}`.
- `"pad"`: una pantalla táctil cuyo lado corto mide al menos 600 puntos; `"phone"` en caso contrario. Estos son móviles: `platform.select` elige `mobile`.

El idiom se decide cuando la app arranca y permanece igual mientras se ejecuta, como en todas las plataformas; una ventana de escritorio estrecha sigue siendo un escritorio, maquetado para su `windowSize()`. Las props `web={{…}}`, y las clases `platform.select({ web })` y `web:` se aplican solo en navegadores; `ios={{…}}`, `native` y `ios:` no se aplican allí.

La página informa del resto del entorno y lo mantiene actualizado:

| Valor | Del navegador |
|---|---|
| Locale (valor por defecto de `Intl`) | `navigator.languages[0]` |
| Zona horaria (hora local de `Date`, `timeZone` por defecto de `Intl`) | la del navegador (`Intl.DateTimeFormat().resolvedOptions().timeZone`), incluido el horario de verano |
| La dirección del layout (`rtl:` / `ltr:`) | `<html dir>` cuando está definido; si no, la escritura del locale |
| `reduceMotion()` | `prefers-reduced-motion` |
| `fontScale()` | el tamaño de fuente del elemento raíz / 16 px (el ajuste de tamaño de texto del navegador) |
| `pixelRatio()` | `devicePixelRatio` (cambia con el zoom y las pantallas) |
| `colorScheme()` | `prefers-color-scheme` |
| `safeArea()` | `env(safe-area-inset-*)` donde se superpone con el contenedor (páginas `viewport-fit=cover` en teléfonos) |
| `keyboardFrame()` | cuánto del contenedor cubre el teclado en pantalla (`visualViewport`) |

`platform.version` es `"0.0"`, y `screenReaderEnabled()` permanece `false` (los navegadores no lo informan). Las barras del navegador alrededor de la página son del navegador; el [`statusBar`](../modules/nsh-base.md#status-bar) de una página es para los teléfonos.

<a id="networking"></a>

## Redes

Las URLs de `fetch` (con streams, `AbortController` y `FormData`) y de `<Image>` pasan por la propia pila de red del navegador, después de que NSH haya comprobado las [capacidades](./sandbox-and-capabilities.md) de la app. Como las solicitudes son del navegador, se aplican las reglas del navegador:

- **Las URLs relativas** se resuelven contra la URL de la página, como en el navegador: una app publicada llega a su propia API con `fetch("/api/items")`, y `<Image src="/photos/a.jpg" />` se carga desde su propio servidor. (Las plataformas nativas no tienen página, por lo que necesitan URLs absolutas.)
- **CORS.** Una solicitud a un origen distinto del de la página solo tiene éxito si ese servidor permite el origen de la página (`Access-Control-Allow-Origin`); de lo contrario, `fetch` se rechaza con un error de red. Solo son visibles las cabeceras de respuesta que el servidor expone.
- **Las cookies** (y la autenticación HTTP) se envían solo al propio origen de la página (`credentials: "same-origin"`), y las cabeceras que los navegadores prohíben (`Cookie`, `User-Agent`, `Host`, ...) se descartan.
- **Las redirecciones** las sigue el navegador. Una solicitud redirigida que no debe seguirla falla: `redirect: "manual"` y `"error"`, y las solicitudes de una app cuyas capacidades restringen `network` (NSH comprueba cada salto, y los navegadores no revelan una redirección antes de seguirla).
- **Los cuerpos de solicitud** que son un `ReadableStream` se recopilan primero y se envían de una sola vez; los cuerpos de respuesta se transmiten en streaming a medida que llegan.
<a id="split-bundles"></a>

## Bundles divididos

Una aplicación web TSX no necesita descargar todo su código antes de que aparezca la primera pantalla (una aplicación Rust es un único `nsh.wasm`, que el navegador compila mientras lo descarga). `nsh package --target web` publica las aplicaciones TSX divididas, con cada fragmento como `<name>.<digest>.js` y la página que asigna los fragmentos a esos archivos. Para dividir un bundle por tu cuenta, `nsh build --split` coloca los módulos que carga `import()` en fragmentos propios, junto a `bundle.js`:

```sh
nsh build --release --split -o site/app
# bundle.js        the app up to its first screen
# Screen.js        import("./Screen") and what only it uses
# detail.js        what two chunks share, when they do (made by the bundler)
```

El primer `import("./Screen")` descarga `Screen.js` y los fragmentos que este importa, todos a la vez, y luego los evalúa; las importaciones posteriores se resuelven al instante. La página indica dónde están los fragmentos: por defecto junto al bundle, o una URL por fragmento, para archivos renombrados con un hash de contenido de modo que una CDN pueda almacenarlos en caché para siempre:

```js
await player.runModule(entry, {
  chunks: { "Screen.js": "/app.3f2a9c.js", "detail.js": "/app.81bb07.js" },
});
```

Un fragmento que no se puede descargar rechaza la `import()` con un `TypeError` que lo nombra; el siguiente `import()` lo intenta de nuevo. Los nombres de los fragmentos son nombres de archivo fijos del bundle: la aplicación no puede hacer que la página descargue ninguna otra cosa.

La [galería](/gallery) carga cada demo de esta manera: `lazy` (en `examples/gallery/ui.tsx`) crea un componente que inicia la importación la primera vez que se renderiza, muestra un marcador de posición hasta que se resuelve y luego renderiza lo que cargó. Su primera carga es el índice y la demo que se muestra primero; una fuente que importa una demo viene con el fragmento de esa demo. Las compilaciones nativas contienen todos los módulos, por lo que allí la importación se resuelve al instante:

```tsx
const Stocks = lazy(() => import("./demos/Stocks").then((m) => m.Stocks));
```

<a id="limits"></a>

## Límites

El navegador decide estos límites, y el backend web los sigue:

- **Vistas web de otros sitios**: `WebView` es un `<iframe>`. El HTML en línea (`html`) lo obtiene todo: `onMessage`, `postMessage`, `injectJavaScript`, los scripts inyectados y los eventos de carga (se ejecuta con un origen propio, independiente de la página). Una página de otro sitio solo obtiene `postMessage` y los eventos de carga con la URL que se le dio: los navegadores ocultan a la página que la rodea sus navegaciones, título, historial y errores, y `userAgent` no se puede establecer.
- **Vídeos con sonido que se inician solos**: `Video` es un `<video>` con todas las props y eventos, pero los navegadores solo inician un vídeo con sonido tras un gesto del usuario (los vídeos sin sonido se reproducen).
- **Componentes nativos**: los componentes nativos registrados pertenecen a las aplicaciones nativas que incorporan NSH; en la web su vista permanece vacía, con una advertencia en la consola.
- **Servicios de la plataforma**: leer el portapapeles (`Clipboard.readText`, también `hasText`) requiere un contexto seguro (HTTPS) y puede preguntar al usuario. Las imágenes no informan de `onProgress`.
- **Detalles del modelado de texto**: el salto de línea es un subconjunto de UAX #14 (espacios, CJK, guiones y las reglas de inicio y fin de línea de la puntuación CJK: los signos de cierre como `。`, `，` y `」` no quedan al comienzo de una línea, y los signos de apertura como `（` y `「` no quedan al final), sin separación silábica y sin reordenación bidireccional más allá de la dirección del párrafo.

El player y el servidor de desarrollo ejecutan las aplicaciones con la configuración de desarrollo; las aplicaciones publicadas se ejecutan como versiones de producción. Ambos ejecutan el código de una aplicación TSX en el motor JavaScript del navegador, en un realm propio de la aplicación.

<a id="see-also"></a>

## Véase también

- [Empaquetado](./packaging.md): los otros destinos de `nsh package`.
- [Arquitectura](./architecture.md): el motor, el núcleo y los lotes de montaje que reutiliza la compilación web.
- [Pruebas](./testing-and-trace.md): `nsh test` ejecuta el mismo motor sin interfaz gráfica, con un motor de texto aproximado.
