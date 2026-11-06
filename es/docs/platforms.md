---
title: "Descripción general de las plataformas"
description: "Dónde se ejecuta NSH: iOS, Android, macOS, Windows, Linux, GPUI y la web, cada una con su propio backend; cómo ejecutar, empaquetar e integrar una aplicación Rust o TSX en cada una, y qué necesita cada una."
order: 10
group: platforms
source_hash: 122188df65c9a97c
---


# Descripción general de las plataformas

NSH se ejecuta en teléfonos, escritorios y la web: iOS, Android, macOS, Windows, Linux, GPUI y páginas web. Cada plataforma tiene su propio backend, que dibuja con la UI nativa de la plataforma, de modo que una app es un conjunto de vistas UIKit en un iPhone, vistas AppKit en un Mac, widgets GTK 4 en Linux, elementos GPUI en una app GPUI y HTML en un navegador, con el texto, la entrada, la accesibilidad y el modo oscuro de la plataforma. Todo lo que queda por encima del backend es compartido: el grafo reactivo, el renderizador, el layout de Taffy, los componentes y los módulos nativos son el mismo código Rust en todas partes, así que una misma app se ejecuta en todas ellas. Una app escrita en Rust es ese código más tu crate, sin máquina virtual de JavaScript; una app TSX ejecuta sus módulos en QuickJS por encima de él ([Building with Rust](./rust.md)).

En cada plataforma, una app se usa de dos maneras: empaquetada como una app instalable de esa plataforma (`nsh package`), o incrustada en una app nativa propia, ya sea que el host enlace una raíz en Rust o cargue TSX en tiempo de ejecución. La desarrollas con `nsh run` (los cambios en Rust recompilan y reinician la app; los cambios en TSX son actualizaciones en caliente).

<a id="at-a-glance"></a>

## De un vistazo

| Plataforma | Backend; texto | Se ejecuta en | Desarrollo | Empaquetado |
|---|---|---|---|---|
| [iOS](./ios.md) | UIKit; CoreText | iOS 15.0+, dispositivos y el simulador | `nsh run --target ios` | `.app` (simulador), `.ipa` firmado |
| [Android](./android.md) | Vistas de Android; `StaticLayout` | Android 9 (API 28)+, `arm64-v8a`, `armeabi-v7a` y `x86_64` | `nsh run --target android` | `.apk` firmado |
| [macOS](./macos.md) | AppKit y Core Animation; CoreText | macOS 14+ | `nsh run --target macos` | `.app` con firma ad hoc |
| [Windows](./windows.md) | Ventanas Win32 dibujadas con Direct2D; DirectWrite | Windows 10 1809+, Windows 11 | `nsh run` (el predeterminado en Windows) | un directorio y un `.zip` |
| [Linux](./linux.md) | Widgets GTK 4; Pango | GTK 4.14+ | `nsh run` (el predeterminado en Linux) | un directorio y un `.tar.gz` |
| [GPUI](./gpui.md) | GPUI; el sistema de texto de GPUI | macOS, Windows, Linux (Vulkan) | en tu app GPUI; TSX también con `nsh run --target gpui` | dentro de la app GPUI que la incrusta |
| [Web](./web.md) | HTML y CSS; las fuentes del navegador | navegadores modernos, de escritorio y de teléfono | `nsh run --target web` | un sitio estático |

- **[GPUI](./gpui.md)** dibuja las apps con [GPUI](https://gpui-kit.com), el framework del proyecto hermano GPUI Kit, tanto en macOS como en Windows y Linux: es el backend para incrustar en apps GPUI y GPUI Kit, que colocan su `AppView` en su propio árbol de elementos. Las apps de escritorio independientes se ejecutan y se empaquetan con el backend propio de cada sistema operativo (AppKit, Win32, GTK 4).
- **[Web](./web.md)** renderiza las apps como HTML en una página del navegador: `nsh package --target web` publica un sitio estático para cualquier servidor web o CDN, con el motor y el crate de una app Rust compilados a WebAssembly, y una página propia incrusta una app con `createPlayer` o un iframe. También ejecuta las demos en vivo y el [playground](/playground) de este sitio.
- **Mac Catalyst** ejecuta el backend de iOS en una ventana del tamaño de un iPhone (390×844) en un Mac, para desarrollo. Selecciónalo con `--target catalyst` para ver cómo se ve una app en un teléfono.

<a id="develop-and-package"></a>

## Desarrollo y empaquetado

`nsh run` elige la plataforma propia de la máquina cuando no indicas ningún `--target`: AppKit en macOS, la ventana GTK en Linux y la ventana Win32 en Windows. A los teléfonos se llega desde un ordenador: iOS desde un Mac con Xcode, Android desde macOS, Linux o Windows con el SDK de Android ([Installation](./installation.md#what-works-where)).

Una app Rust (su `nsh.json` nombra el componente `"root"`) se ejecuta y se empaqueta desde su directorio: `nsh` compila el runner propio de la app para el destino, con tu crate y sin QuickJS. Una app TSX nombra su punto de entrada:

```sh
# A Rust app, from its directory
nsh run --target macos             # or ios, android, windows, linux, web, catalyst
nsh package --target macos         # or ios, ios-simulator, android, windows, linux, web

# A TSX app
nsh run App.tsx --target macos     # or ios, android, windows, linux, gpui, web, catalyst
nsh package App.tsx --target macos
```

Cada sistema operativo de escritorio empaqueta las apps con su propio backend, compilado para la máquina en la que se ejecuta: empaqueta una app de Mac en un Mac, una app de Windows en Windows y una app de Linux en Linux. [Packaging](./packaging.md) cubre la salida, la firma y los iconos de cada destino.

<a id="embed-in-a-native-app"></a>

## Incrustar en una app nativa

| Plataforma | Vista host | Ejecuta | Se distribuye como | Lenguaje del host |
|---|---|---|---|---|
| macOS | `AppView` (un `NSView`) | una raíz Rust, bundles TSX | el crate `nsh-platform-macos` | Rust |
| Windows | `AppView` (una ventana hija) | una raíz Rust, bundles TSX | el crate `nsh-platform-windows` | Rust |
| Linux | `AppView` (un widget GTK) | una raíz Rust, bundles TSX | el crate `nsh-platform-linux` | Rust |
| GPUI (macOS, Windows, Linux) | `AppView` (una vista GPUI) | una raíz Rust, bundles TSX, paquetes firmados | el crate `nsh-platform-gpui` | Rust |
| iOS | `AppView` (un `UIView`) | una raíz Rust, bundles TSX | el crate `nsh-platform-ios` | Rust |
| iOS | `NshAppView` (un `UIView`) | bundles TSX, paquetes firmados | `NativeShell.xcframework` | Swift |
| Android | `NshView` (un `FrameLayout`) | bundles TSX, paquetes firmados | `nsh.aar` | Java o Kotlin |
| Web | `createPlayer` (un elemento de la página) o un iframe | bundles TSX; una app Rust como su sitio publicado | los archivos de runtime de `nsh package --target web` | JavaScript o HTML |

Un host Rust monta una raíz Rust (`Root::of::<App>()`) como `AppSource::Rust` o `App::Rust`, y da a sus motores los conjuntos de UI de la app con `set_ui_sets`, de modo que el TSX que cargue importe los componentes y módulos propios de la app. Cada vista es un motor, y una app puede mostrar varias. El host registra sus propias vistas nativas para que las apps las usen en cada plataforma ([Native components](./native-components.md)).

> [!NOTE]
> Los hosts Rust incrustan NSH con los crates de plataforma del repositorio de NSH; el `AppView` de macOS, Windows y Linux carga bundles desde los archivos propios de la app (o desde el código fuente), con los límites predeterminados. El crate de GPUI y los SDK de iOS y Android también cargan [paquetes firmados](./signed-packages.md) y establecen límites y capacidades por vista ([Sandbox and capabilities](./sandbox-and-capabilities.md)).

<a id="writing-for-every-platform"></a>

## Escribir para todas las plataformas

La mayor parte de una app no necesita comprobaciones de plataforma: los elementos, los estilos, el layout y los módulos se comportan igual en todas partes. Donde las plataformas difieren, NSH da a la diferencia un único lugar ([Platform-specific code](./platform-specific.md)):

- **El entorno indica dónde se ejecuta la app**: en Rust `os()`, `idiom()` y `is_desktop()` (`nsh_core::prelude`), en TSX `platform.os`, `platform.idiom`, `platform.desktop` y `platform.select` de `nsh`. El sistema operativo es iOS, Android, macOS, Windows, Linux o la web.
- **Las props exclusivas de una plataforma** van en `ios={{…}}`, `android={{…}}`, `web={{…}}` o `desktop={{…}}` en TSX (`desktop`: macOS, Windows, Linux y navegadores de escritorio).
- **La entrada sigue a la plataforma.** Los teléfonos reciben toques y el teclado en pantalla; los escritorios reciben el ratón, el trackpad y el teclado.

Los componentes de una app se dibujan con las primitivas de NSH, así que se ejecutan tanto en escritorios como en teléfonos, con el mismo aspecto en ambos. Un layout de escritorio se construye a partir de las primitivas (`view`, `text`, `scroll`, `virtual_list`, …; `View`, `Text`, `Scroll`, `List`, … en TSX) y una comprobación de escritorio, como hace el layout de escritorio de la galería:

```rust tabs
use nsh_core::prelude::*;

#[component]
pub fn Shell() -> impl IntoElement {
    // macOS, Windows, Linux and desktop browsers get a sidebar; phones get tabs.
    view()
        .flex_1()
        .child(if is_desktop() { sidebar_layout() } else { tab_layout() })
}

fn sidebar_layout() -> AnyElement {
    view().flex_1().flex_row().into_element()
}

fn tab_layout() -> AnyElement {
    view().flex_1().flex_col().into_element()
}
```

```tsx tabs
import { View } from "nsh";
import { platform } from "nsh";

export function Shell() {
  // macOS, Windows, Linux and desktop browsers get a sidebar; phones get tabs.
  return <View class="flex-1">{platform.desktop ? <SidebarLayout /> : <TabLayout />}</View>;
}

function SidebarLayout() {
  return <View class="flex-1 flex-row" />;
}

function TabLayout() {
  return <View class="flex-1 flex-col" />;
}
```

Cada backend enumera lo que hace a su manera: [macOS](./macos.md#what-differs-on-macos), [Windows](./windows.md#what-differs-on-windows), [Linux](./linux.md#what-differs-on-linux), [GPUI](./gpui.md#differences).

<a id="see-also"></a>

## Véase también

- [Getting started](./getting-started.md): una primera app, ejecutada en cada plataforma.
- [Building with Rust](./rust.md): apps escritas en Rust, y Rust con TSX.
- [Installation](./installation.md): las herramientas que necesita cada plataforma.
- [Architecture](./architecture.md): qué se comparte y qué hace cada backend.
