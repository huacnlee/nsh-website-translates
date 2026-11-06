---
title: "Primeros pasos"
description: "Crea una app en Rust o TSX con nsh init, ejecútala en iOS, Android, macOS, Windows, Linux o la web, aloja módulos TSX en tu app y distribúyelos como paquetes firmados, o empaqueta la app por separado."
order: 4
group: start
demo: guide-getting-started
source_hash: 57c002bb7e893547
---


# Primeros pasos

Esta guía crea una app NSH, la ejecuta en las plataformas a las que apuntas y la distribuye. Las apps NSH se escriben en Rust o TSX, sobre el mismo motor: Rust compila tu app a código nativo sin una VM de JavaScript, y TSX se ejecuta en QuickJS con actualizaciones en caliente, como módulos que una app nativa puede cargar en tiempo de ejecución. La guía sigue primero una app en Rust y después la misma app en TSX. Supone que `nsh` está instalado y en tu `PATH` ([Instalación](./installation.md)); en un checkout, usa
`./target/debug/nsh` en su lugar.

> [!TIP]
> ¿No tienes un proyecto de app a mano? Las dos primeras secciones no necesitan ninguno: `nsh run` muestra la app en una ventana de tu computadora, en
> el simulador de iOS, en un dispositivo Android o en el navegador. Puedes quedarte ahí, o [empaquetarla como una app
> independiente](#or-ship-it-as-a-standalone-app).

<a id="create-an-app"></a>

## Crear una app

En una terminal, `nsh init` pregunta en qué lenguaje se escribe la app: `rust`, `ts` o `mixed` (TSX con un crate de Rust propio).
`--template` elige sin preguntar.

<a id="in-rust"></a>

### En Rust

```sh
nsh init my-app --template rust
```

`nsh init` crea el directorio y escribe un proyecto de Cargo:

| Archivo | Qué es |
|---|---|
| `src/lib.rs` | La app: su componente raíz, el estado y los manejadores |
| `src/main.rs` | Monta la misma raíz en macOS, Windows o Linux para `cargo run` |
| `Cargo.toml` | El crate, que depende de `nsh-core` y `nsh-base` en la versión del CLI |
| `nsh.json` | El nombre, el id, la versión y el número de compilación de la app, su crate (`"rust": "."`) y su componente raíz (`"root": "App"`) ([Estructura del proyecto](./project-structure.md#nshjson)) |
| `App.test.tsx` | La prueba de la raíz, en TypeScript (`nsh test`), con `tsconfig.json` y `.nsh/types` para tu editor |
| `README.md` | Cómo ejecutar, probar y empaquetar la app, y cómo añadir más adelante una entrada TSX |
| `.gitignore` | Ignora `.nsh/` y `target/` |

El desarrollo en Rust necesita una toolchain de Rust ([rustup](https://rustup.rs)); los comandos de `nsh` compilan los runners de la app
a partir de los crates de NSH en crates.io, en la versión del CLI.

<a id="in-tsx"></a>

### En TSX

```sh
nsh init my-app --template ts
```

Una app TSX es uno o más archivos `.tsx` con una entrada: lo que ejecuta `nsh run` y lo que una app host carga como módulo.

| Archivo | Qué es |
|---|---|
| `App.tsx` | El módulo de entrada: renderiza la app con `mount` |
| `App.test.tsx` | Su prueba (`nsh test`) |
| `nsh.json` | El nombre, el id, la versión y el número de compilación de la app ([Estructura del proyecto](./project-structure.md#nshjson)) |
| `tsconfig.json` | Extiende `.nsh/tsconfig.json`, la configuración de TypeScript de NSH, que resuelve `nsh` a las declaraciones de `.nsh/types` |
| `.gitignore` | Ignora `.nsh/` y `target/` |
| `.nsh/types/` | Declaraciones generadas de todos los módulos de NSH, para tu editor |

Los archivos que ya existen se conservan, así que puedes ejecutarlo en un directorio que ya tenga algunos de ellos; una app en Rust se crea en
un directorio nuevo.

En ambos casos, el nombre visible es por defecto el nombre del directorio; pasa `--name "My App"` para elegir otro. El id se convierte en
`com.example.<name>`: cámbialo en `nsh.json` antes de distribuir. `nsh init my-app --template mixed` crea una app TSX
que además es un crate de Rust (`Cargo.toml` y `src/lib.rs` junto a `App.tsx`), cuyo componente, módulo y clase
importa `App.tsx` ([Compilar con Rust](./rust.md)).

<a id="the-root-component"></a>

### El componente raíz

Las dos plantillas producen la misma app, un contador:

```rust tabs
// src/lib.rs
use nsh_base::theme;
use nsh_core::prelude::*;

/// The crate's UI set: what a TSX entry may import from `my-app/native`.
#[native_module("my-app/native")]
fn native(registry: &mut Registry) {
    registry.register::<App>();
}

/// The application's root component.
#[component]
pub fn App() -> impl IntoElement {
    let count = signal(0_u32);
    view()
        .flex_1()
        .bg(move || theme().background)
        .text_color(move || theme().foreground)
        .child(
            view()
                .flex_1()
                .p_safe_area()
                .child(
                    view()
                        .flex_1()
                        .items_center()
                        .justify_center()
                        .gap_4()
                        .child(text(move || format!("Count: {}", count.get())).text_size(px(28.0)))
                        .child(
                            view()
                                .px_5()
                                .py_3()
                                .rounded(px(10.0))
                                .bg(move || theme().primary)
                                .active(|s| s.opacity(0.6))
                                .on_press(move || count.update(|value| *value += 1))
                                .child(
                                    text("Tap")
                                        .text_size(px(17.0))
                                        .text_color(move || theme().primary_foreground),
                                ),
                        ),
                ),
        )
}
```

```tsx tabs
// App.tsx
import { mount, signal, Text, View } from "nsh";

function App() {
  const count = signal(0);
  return (
    <View class="flex-1 items-center justify-center gap-4 bg-background pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <Text class="text-3xl font-semibold text-foreground">{count()}</Text>
      <View
        onPress={() => count.update((c) => c + 1)}
        role="button"
        class="rounded-(--radius) bg-primary px-5 py-3 active:bg-primary/90"
      >
        <Text class="text-lg text-primary-foreground">Tap</Text>
      </View>
    </View>
  );
}

mount(App);
```

En Rust:

- **`use nsh_core::prelude::*`** trae las primitivas (`view()`, `text()`, `scroll()`, `input()`, `image()`, ...),
  las [señales](./reactivity.md) y los métodos de estilo tipados (`.p_safe_area()` añade a una vista el relleno del [área segura](../elements/safe-area.md)); **`nsh_base`** tiene los componentes base sin estilo
  (`button()`, el teclado, los diálogos) y `theme()`, los colores y
  radios con los que dibujan los componentes de la app ([Tema](./rust.md#theme)).
- **`#[component] pub fn App()`** es un componente: una función que se ejecuta **una vez** y devuelve sus elementos.
  El `"root": "App"` de `nsh.json` lo nombra, y `nsh run` lo monta. `signal(0_u32)` crea un valor que cambia con el tiempo.
- **`text(move || format!(…, count.get()))`** enlaza el texto a la señal: cuando `count` cambia, NSH vuelve a ejecutar este
  closure y actualiza este único texto, nada más. Los estilos reciben closures de la misma manera:
  `.bg(move || theme().primary)` sigue al tema hacia el modo oscuro.
- **`.on_press(..)`** hace que la vista responda a las pulsaciones; `.active(|s| s.opacity(0.6))` es su estilo mientras está pulsada, aplicado
  de forma nativa. El botón es propio de la app: NSH proporciona las primitivas y las capacidades, y la app dibuja su UI
  con ellas.
- **`.px_5()`, `.rounded(px(10.0))`, `.gap_4()`** son métodos de estilo tipados con los mismos nombres que las utilidades de Tailwind, en
  puntos (`px`). El layout es flexbox, y los hijos se apilan en columna por defecto ([Layout](./layout.md)).
- **`#[native_module("my-app/native")]`** nombra lo que una entrada TSX puede importar del crate, para cuando añadas pantallas TSX
  encima ([Compilar con Rust](./rust.md#extending-a-rust-app-with-tsx)).

En TSX:

- **`import { mount, signal, Text, View } from "nsh"`**: `nsh` es el módulo central: señales, `mount`, las demás primitivas
  reactivas y los elementos host. Lo sirve el runtime nativo, no se incluye en el bundle. **`nsh/base`** tiene los
  componentes base, igual que `nsh_base` en Rust.
- **`function App()`** es un componente que se ejecuta **una vez**. **`{count()}`** lee la señal dentro de JSX: el compilador
  ve una llamada y hace que este texto siga a la señal.
- **`<View onPress>`** es una vista nativa que reacciona a las pulsaciones; las clases `active:` son su estilo mientras está pulsada. `View`,
  `Text`, `Image`, `Scroll` y los demás [elementos host](../elements/index.md) se importan de `nsh` (`Input` de `nsh/base`); solo
  `If` y `Each` no necesitan importación.
- **`class`** recibe clases de [Tailwind](./tailwind.md); `style={{ … }}` recibe un objeto de propiedades de estilo en camelCase,
  con números en puntos. `bg-background`, `bg-primary`, `text-primary-foreground` y
  `rounded-(--radius)` nombran los tokens del tema de la app ([Tokens del tema](./tailwind.md#theme-tokens)): siguen
  el modo oscuro por sí solos, y `"theme"` en `nsh.json` los vuelve a estilizar.
- **`mount(App)`** renderiza el componente en la superficie de la app.

> [!IMPORTANT]
> El texto se muestra en un elemento de texto: `text(..)` en Rust, `<Text>` en TSX. En TSX, el texto escrito directamente en un `<View>`
> (`<View>Hello</View>`) es un error de compilación que lo señala, y una cadena que una expresión coloca ahí
> (`<View>{name}</View>`) se informa en el log.

<a id="develop-it"></a>

## Desarrollarla

<a id="run-it"></a>

### Ejecutarla

`nsh run` compila la app, la lanza y la recompila mientras editas; los logs de la app aparecen en la terminal. Pásale el
directorio de la app: ejecuta la raíz de una app Rust, o el `App.tsx` de una app TSX (`nsh run my-app/App.tsx` nombra otra entrada).

Para una app Rust, `nsh run` compila el runner propio de la app para el destino, con tu crate y la raíz montada y sin
QuickJS, y lo inicia; un cambio en el código Rust lo compila de nuevo y reinicia la app. `cargo run` en el
directorio de la app inicia la misma raíz directamente en el backend de escritorio. Para una app TSX, `nsh run` inicia un servidor de desarrollo y un
host de desarrollo que carga la app desde él, y parchea la app en ejecución con cada guardado.

Sin `--target`, `nsh run` usa la máquina en la que estás: una ventana de AppKit en macOS, una ventana de Win32 en Windows y una
ventana de GTK en Linux. Elige otra plataforma con `--target`:

| Destino | Comando | Se ejecuta desde |
|---|---|---|
| Simulador de iOS | `nsh run my-app --target ios` | macOS con Xcode |
| Android | `nsh run my-app --target android` | macOS, Windows, Linux |
| macOS (AppKit) | `nsh run my-app` | macOS (el predeterminado) |
| Windows | `nsh run my-app` | Windows (el predeterminado) |
| Linux (GTK 4) | `nsh run my-app` | Linux (el predeterminado) |
| Web | `nsh run my-app --target web` | macOS, Windows, Linux |
| Mac Catalyst | `nsh run my-app --target catalyst` | macOS |

<a id="ios-simulator"></a>

#### Simulador de iOS

```sh
nsh run my-app --target ios
nsh run my-app --target ios --device "iPhone 16 Pro"
```

`nsh` usa un simulador ya iniciado, o inicia el iPhone más reciente si no hay ninguno en ejecución, e instala en él la app (el
runner de una app Rust, o el host de desarrollo). `--device` elige un simulador por nombre o UDID.

#### Android

```sh
nsh run my-app --target android
```

Inicia primero un emulador o conecta un dispositivo (`adb devices` los lista; NSH usa el primero). `nsh` instala la app
en él: el `libnsh.so` propio de una app Rust, o un APK de host de desarrollo (recompilado solo cuando cambia el runtime) cuyo puerto de servidor
de desarrollo se reenvía al dispositivo con `adb reverse`, de modo que funciona por USB sin una red compartida.

#### macOS (AppKit)

```sh
nsh run my-app --target macos
```

La app se abre como una app de escritorio para Mac (AppKit, en una ventana redimensionable), con entrada de ratón, trackpad y teclado en lugar de
toques. Requiere macOS 14 o posterior; consulta [macOS](./macos.md).

<a id="windows-default-on-windows"></a>

#### Windows (predeterminado en Windows)

```sh
nsh run my-app
```

La app se abre en una ventana de escritorio (1200×800 puntos), con entrada de ratón, touchpad, táctil y teclado. Requiere Windows
10 1809 o posterior; consulta [Windows](./windows.md).

<a id="linux-default-on-linux"></a>

#### Linux (predeterminado en Linux)

```sh
nsh run my-app
```

La app se abre en una ventana de GTK (390×844 puntos). Requiere GTK 4.14 o posterior; consulta [Linux](./linux.md).

#### Web

```sh
nsh run my-app --target web
```

`nsh` imprime la dirección de la página; ábrela en un navegador. Una app Rust se ejecuta como WebAssembly con tu crate, y la página
abierta carga por sí sola la nueva compilación después de un cambio; consulta [Web](./web.md).

#### Mac Catalyst

```sh
nsh run my-app --target catalyst
```

La app se abre en una ventana del tamaño de un iPhone (390×844 puntos) en tu Mac. Es la forma más rápida de ver una app como la muestra un teléfono:
sin simulador que iniciar. Usa UIKit como iOS, así que lo que ves es lo que muestra un iPhone, salvo por el comportamiento
propio de Mac, como el desplazamiento con la rueda del ratón. Para la app de Mac en sí, usa `--target macos`.

<a id="edit-it"></a>

### Editarla

Deja `nsh run` en ejecución y cambia la etiqueta del botón:

```rust tabs
text("Add one")
    .text_size(px(17.0))
    .text_color(move || theme().primary_foreground)
```

```tsx tabs
<Text style={{ color: "white", fontSize: 17 }}>Add one</Text>
```

Guarda. Una app Rust se compila de nuevo y se reinicia con la nueva etiqueta; el contador vuelve a empezar. Una app TSX recibe una actualización en caliente:
el CLI recompila y envía un parche, y el host vuelve a ejecutar el módulo modificado y renderiza de nuevo solo los componentes
cuyo código cambió. Aquí es `App`, que posee la señal `count`, así que el contador también vuelve a empezar.

Las piezas de UI pasan a componentes propios, o a funciones simples que devuelven elementos:

```rust tabs
/// The app's button: a view that answers presses.
fn tap_button(on_press: impl Fn() + 'static) -> impl IntoElement {
    view()
        .p_3()
        .rounded(px(10.0))
        .bg(move || theme().primary)
        .active(|s| s.opacity(0.6))
        .on_press(on_press)
        .child(text("Tap").text_size(px(17.0)).text_color(move || theme().primary_foreground))
}

// In App: .child(tap_button(move || count.update(|value| *value += 1)))
```

```tsx tabs
function TapButton(props: { onPress: () => void }) {
  return (
    <View onPress={props.onPress} activeStyle={{ opacity: 0.6 }} style={{ padding: 12, borderRadius: 10, backgroundColor: "#0969da" }}>
      <Text style={{ color: "white", fontSize: 17 }}>Tap</Text>
    </View>
  );
}

// In App: <TapButton onPress={() => count.update((c) => c + 1)} />
```

En TSX, el estado sobrevive cuando editas un componente que no lo posee: toca varias veces y luego cambia el
color de `TapButton`, y el botón se actualiza mientras el contador se mantiene. El reemplazo en caliente funciona por componente de nivel superior: una función con un
nombre en mayúscula inicial cuyo cuerpo contiene JSX. Un componente se renderiza de nuevo cuando cambia su propio código, o cuando cambia el
código del módulo fuera de los componentes (una constante que usa, una función auxiliar). Si una edición no puede aplicarse en el lugar (por ejemplo, porque
importa un módulo de NSH que la app en ejecución aún no había importado, o cambia las capacidades de `nsh.json`), el host recarga la
app completa.

<a id="errors"></a>

#### Errores

Un error de compilación de Rust se imprime en la terminal con la salida de cargo, y `nsh run` compila de nuevo con el siguiente guardado. Un
error de compilación de TSX se imprime en la terminal y se muestra en el dispositivo como una superposición roja con el archivo, la línea y la
columna; la app sigue ejecutando la última compilación correcta. La superposición desaparece con la siguiente compilación exitosa (tócala para
cerrarla antes). Una excepción lanzada en tiempo de ejecución se muestra de la misma manera, con su stack asociado de nuevo a tu código fuente `.tsx`.

<a id="host-it-in-your-app"></a>

## Alojarla en tu app

Una app nativa muestra NSH en una vista propia: `NshAppView` (una `UIView`) en iOS, `NshView` (una `View` de Android) en
Android, `AppView` en macOS, Windows, Linux y en apps GPUI. Colócala como cualquier otra vista, en cualquier pantalla y tantas
veces como necesites.

Una raíz Rust forma parte de la compilación de la app: la app enlaza tu crate y monta la raíz con `AppSource::Rust` en el
`AppView` de macOS, Windows, Linux, GPUI e iOS ([Compilar con Rust](./rust.md#an-app-written-in-rust)). Una app TSX es
un módulo que carga la vista: durante el desarrollo desde el servidor de desarrollo, en un release desde un bundle compilado o un paquete firmado
descargado. Las secciones siguientes cargan módulos TSX.

### iOS

Enlaza `NativeShellDev.xcframework` en Debug y `NativeShell.xcframework` en Release ([Incrustar en apps de iOS](./ios.md)), y luego:

```swift
import NativeShell

let app = NshAppView()
app.onError = { message in print("nsh error: \(message)") }
view.addSubview(app)   // and constrain it like any view

#if DEBUG
try app.connectDevServer(URL(string: "ws://127.0.0.1:8790/ws")!)   // `nsh dev my-app` on your Mac
#else
try app.loadBundle(at: Bundle.main.url(forResource: "bundle", withExtension: "nshc", subdirectory: "nsh")!)
#endif
```

`nsh dev my-app` sirve el módulo a la app y envía cada guardado, igual que lo hace `nsh run` con su propio host. Para la
compilación de release, `nsh build my-app --release --out MyApp/nsh` escribe el bundle en una carpeta que añades a los
recursos de la app.

### Android

Añade `nsh-dev.aar` para las compilaciones de depuración y `nsh.aar` para las de release ([Incrustar en apps de Android](./android.md)), y luego:

```kotlin
val nsh = NshView(this)
nsh.setErrorListener { message -> Log.e("nsh", message) }
setContentView(nsh)   // or add it to any layout

if (BuildConfig.DEBUG) {
    nsh.connectDevServer("ws://127.0.0.1:8790/ws")   // with `adb reverse tcp:8790 tcp:8790`
} else {
    nsh.loadAssetBundle("nsh")   // assets/nsh, from `nsh build my-app --release --out app/src/main/assets/nsh`
}
```

<a id="macos-windows-and-linux"></a>

### macOS, Windows y Linux

Las apps de escritorio escritas en Rust incrustan NSH con `AppView`, a partir de los crates `nsh-platform-macos`, `nsh-platform-windows`,
`nsh-platform-linux` y `nsh-platform-gpui`: un `NSView`, una ventana hija, un widget de GTK o una vista de GPUI que
monta una raíz Rust o carga un bundle compilado. Consulta [macOS](./macos.md#embedding-in-a-mac-app),
[Windows](./windows.md#embedding-in-a-win32-app), [Linux](./linux.md#embedding-in-a-gtk-app) y [GPUI](./gpui.md),
y [Plataformas](./platforms.md#embed-in-a-native-app) para ver todos los hosts lado a lado.

<a id="what-the-module-may-do"></a>

### Lo que puede hacer el módulo

En iOS y Android, el host decide antes de cargar lo que un módulo puede hacer: `grantCapabilities` fija los hosts de red
y otras capacidades a las que puede acceder, y los límites restringen su memoria, el tiempo de llamada y el número de nodos ([Sandbox y
capacidades](./sandbox-and-capabilities.md)). Para dar a los módulos tus propias vistas nativas (un mapa, un gráfico, un componente
de sistema de diseño), regístralas como [componentes nativos](./native-components.md).

<a id="ship-updates-as-signed-packages"></a>

## Distribuir actualizaciones como paquetes firmados

Un módulo TSX que la app descarga después del lanzamiento llega como un paquete firmado. Crea una clave raíz una sola vez y guárdala sin conexión,
certifica con ella una clave de release y publica:

```sh
nsh keygen keys/root && nsh keygen keys/release
nsh certify --root keys/root.secret --key keys/release.pub --apps 'com.example.*' -o keys/release.cert
nsh publish my-app --key keys/release.secret --cert keys/release.cert --build 2
```

La app confía en la clave pública de la raíz y carga lo que descarga; NSH verifica la firma, el certificado y la
lista de revocación antes de ejecutar nada:

```swift
let support = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
let trust = try NshTrust(stateDirectory: support.appendingPathComponent("nsh"))
try trust.addRoot(rootPublicKey)   // the contents of keys/root.pub
let info = try await app.loadPackage(at: downloadedFile, trust: trust)
```

Android tiene el mismo flujo con `NshTrust` y `NshPackage`. El alojamiento, la entrega y la revocación en detalle: [Paquetes
firmados](./signed-packages.md).
<a id="or-ship-it-as-a-standalone-app"></a>

## O distribúyela como una app independiente

`nsh package` genera una app instalable, en Rust o TSX, sin un proyecto de Xcode ni una compilación de Gradle propios:

```sh
nsh package my-app --target ios-simulator --run
nsh package my-app --target android
nsh package my-app --target macos
nsh package my-app --target linux
nsh package my-app --target windows
nsh package my-app --target web
```

Una app en Rust se empaqueta con su propio runner, compilado a partir de tu crate y de los crates de NSH, con su raíz montada; una app en TSX, con el runtime precompilado. Opciones, firma e iconos: [Packaging](./packaging.md).

<a id="try-it-in-the-terminal"></a>

## Pruébala en el terminal

`nsh test` ejecuta una app en modo headless, sin dispositivo ni ventana. Dado el `nsh.json` de una app en Rust o el punto de entrada de una app en TSX, abre la app, la deja ejecutarse e imprime lo que monta; con `--trace`, imprime además las operaciones de vistas nativas y el tiempo de cada commit ([Testing](./testing-and-trace.md)):

```sh
nsh test my-app/nsh.json --trace     # a Rust app's root
nsh test my-app/App.tsx --trace      # a TSX app's entry
```

Dado un directorio, ejecuta las pruebas de la app: el `App.test.tsx` de cada plantilla abre la app, pulsa su botón y comprueba lo que muestra (`nsh test my-app`). El de una app en Rust abre su raíz (`open(".")`); también se puede probar en `cargo test` con `nsh_testing::Headless` ([Building with Rust](./rust.md#testing)).

<a id="next-steps"></a>

## Próximos pasos

- [Building with Rust](./rust.md): apps en Rust, su tema y TSX sobre un crate de Rust.
- [JSX and components](./jsx-and-components.md) y [Reactivity](./reactivity.md): componentes y signals, en Rust y TSX.
- [Platforms](./platforms.md): qué admite cada plataforma y su propia página ([iOS](./ios.md), [Android](./android.md), [macOS](./macos.md), [Windows](./windows.md), [Linux](./linux.md)).
- [Signed packages](./signed-packages.md) y [Sandbox and capabilities](./sandbox-and-capabilities.md): la distribución y lo que pueden hacer los módulos.
- [Project structure](./project-structure.md): qué va en `nsh.json`, los assets y los archivos.
