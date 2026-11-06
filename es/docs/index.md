---
title: "Introducción"
description: "Qué es Native Shell: un framework de UI nativa orientado a Rust para iOS, Android, macOS, Windows, Linux y la web, con la interfaz y las interacciones propias de cada plataforma."
order: 1
group: start
source_hash: cdf8a9726ec2ef7b
---


# Introducción

Native Shell (NSH, por sus siglas) es un framework de UI nativa para todas las plataformas. Se construye una app una sola vez, con un único modelo de app (componentes, signals, estilos y la misma API en todas partes), y NSH la ejecuta en **iOS, Android, macOS, Windows, Linux y la web**, siempre como una app de esa plataforma: hecha con sus propias vistas, con edición de texto mediante su propio sistema y con el uso que sus usuarios esperan. Escribe toda la app en **Rust**, escribe las pantallas en **TSX**, o combina ambos en un mismo motor. Sobre ese mismo motor, las apps que ya has publicado pueden recibir UI nueva en tiempo de ejecución, escrita por tu equipo o generada por un modelo, como módulos firmados, en un sandbox que configura el host.

> [!IMPORTANT]
> NSH proporciona vistas e interacción nativas; la app es dueña de su diseño visual. Los componentes, el estado y las APIs se comparten entre plataformas, mientras que los colores, la tipografía, el espaciado y las formas provienen de la app. La entrada de texto, el foco y los menús siguen las convenciones de interacción de cada dispositivo. Consulta [Objetivos y principios de diseño](./goals.md).

<a id="what-native-means"></a>

## Qué significa nativo

Nativo en NSH tiene dos capas: los cimientos de la plataforma y la interacción de la plataforma.

**Los cimientos de la plataforma.** Cada plataforma tiene su propio backend, construido sobre la UI que esa plataforma ya tiene:

| Plataforma | Vistas | Texto | Entrada de texto |
|---|---|---|---|
| iOS | UIKit | CoreText | Los campos de texto y las vistas de texto del sistema |
| Android | Vistas de Android | `StaticLayout` | `EditText` |
| macOS | AppKit, Core Animation | CoreText | `NSTextField`, `NSTextView` |
| Windows | Ventanas Win32 dibujadas con Direct2D | DirectWrite | El editor de NSH, con los métodos de entrada del sistema (IMM32) |
| Linux | GTK 4 | Pango | `Text` y `TextView` de GTK |
| Web | Elementos HTML con estilos CSS | Las fuentes del navegador | Los inputs del navegador |

La selección de texto y su menú, los métodos de entrada, la accesibilidad y el desplazamiento provienen de la plataforma, y lo que aporte una nueva versión del sistema operativo a estos aspectos llega a la app con ella. Los componentes nativos (un mapa, un web view, un reproductor de vídeo, cualquier vista que registre el host) son una vista más de la misma jerarquía, con el mismo layout, recorte y desplazamiento que el resto ([Componentes nativos](./native-components.md)).

**La interacción de la plataforma.** Los componentes que NSH proporciona en [`nsh/base`](../modules/nsh-base.md) se comportan como esperan los usuarios de cada dispositivo, de modo que la app los escribe una sola vez:

| | Escritorio (y navegadores de escritorio) | Teléfonos y tabletas |
|---|---|---|
| `Menu` | Un popup junto a su disparador; los submenús se despliegan en cascada junto a su elemento | Una hoja desde la parte inferior; un submenú reemplaza los elementos de su menú |
| `ContextMenu` | Un clic derecho lo abre en la posición del puntero | Un dedo mantenido sobre el disparador lo abre como una hoja |
| `Tooltip` | Se muestra cuando el puntero se detiene sobre el disparador | Se muestra cuando la app lo abre |
| `Popover` | Una pulsación fuera lo cierra y llega a lo que hay bajo el puntero | Una pulsación fuera lo cierra |

Las páginas, los diálogos, el teclado y la barra de estado siguen la misma idea: las pilas de navegación hacen push y pop con el movimiento propio de cada plataforma, y el botón de retroceso, Escape y el gesto de deslizar hacia atrás hacen lo que hacen allí ([Navegación](./navigation.md)).

<a id="from-phone-to-desktop-to-web"></a>

## Del teléfono al escritorio y a la web

Multiplataforma en NSH significa que cada dispositivo recibe la app que espera, no la misma pantalla ampliada o reducida:

- **Un único modelo de app.** Los componentes, el estado, la lógica de negocio y las pantallas de la app se comparten; cada backend los asigna a su plataforma.
- **Layouts que se remodelan.** [Taffy](https://github.com/DioxusLabs/taffy) calcula el layout de Flexbox y CSS grid en todas las plataformas, y los breakpoints de Tailwind (`md:`, `lg:`) y el tamaño de la ventana (`window()` en Rust) cambian la estructura, no solo el tamaño: una app de chat muestra su barra lateral, las conversaciones y los mensajes uno junto a otro en una ventana ancha, y una sola pantalla a la vez en un teléfono ([Layout](./layout.md), [Tailwind](./tailwind.md)).
- **La entrada que espera cada dispositivo.** Puntero, hover, clics derechos, atajos y foco en el escritorio; toques, gestos, teclado en pantalla y navegación entre páginas en teléfonos. Cuando una app quiere algo propio para cada plataforma, las props `desktop={{…}}` y `platform.select` lo expresan ([Código específico de plataforma](./platform-specific.md)).
- **Verificado en cada destino.** `nsh test` ejecuta las pruebas de la app sin interfaz (headless), y las mismas pruebas en ventanas de macOS, Windows, Linux y GPUI, un simulador de iOS, un dispositivo Android o un navegador, con la entrada propia de la plataforma ([Pruebas y trazas](./testing-and-trace.md)).

Toma una app como un cliente de chat. Su desarrollador la construye en el escritorio con `nsh run`, la abre en un simulador de iOS con `nsh run --target ios` para comprobar el layout del teléfono, después en un navegador con `nsh run --target web` (el mismo proyecto cada vez), y `nsh package` genera las apps instalables y el sitio web. Un solo ingeniero puede asumir lo que antes requería un equipo por plataforma, mientras se construye el backend en paralelo.

<a id="rust-first"></a>

## Rust primero

NSH está construido en Rust, y Rust es un lenguaje de primera clase para escribir apps con él:

- **Apps completas en Rust.** La UI, la lógica y los componentes son Rust, compilados a código nativo en cada plataforma, con la propiedad (ownership), los tipos y los hilos de Rust y el ecosistema de crates.io. El cómputo se ejecuta a velocidad nativa, y los datos grandes, el parsing y el trabajo de sistema permanecen en el lenguaje más adecuado para ellos ([Desarrollo con Rust](./rust.md)).
- **TSX como segundo camino.** TSX es adecuado para pantallas escritas con rapidez, plugins, apps pequeñas y UI entregada en tiempo de ejecución. Se ejecuta en el mismo motor que Rust, con las mismas primitivas, componentes base y signals.
- **Ambos a la vez.** Una app en Rust puede incorporar pantallas TSX, y las pantallas TSX importan los componentes, módulos y clases de Rust de la app.
- **Una sola toolchain.** Un único ejecutable `nsh` crea, compila, comprueba tipos, ejecuta con hot reload, prueba, empaqueta y firma apps para todos los destinos. Incluye su propio bundler de TSX y verificador de TypeScript, de modo que quien venga de Rust, Swift, Kotlin o C++ instala Rust y `nsh`, y se pone a trabajar ([Instalación](./installation.md), [CLI](./cli.md)).

<a id="an-app"></a>

## Una app

El mismo contador, en Rust y en TSX:

```rust tabs
use nsh_core::prelude::*;

#[component]
pub fn Counter() -> impl IntoElement {
    let count = signal(0);
    view()
        .flex_1()
        .items_center()
        .justify_center()
        .gap_3()
        .child(text(move || count.get().to_string()).text_5xl().font_weight(FontWeight::BOLD))
        .child(
            view()
                .rounded_lg()
                .bg(rgb(0x2563eb))
                .px_5()
                .py_3()
                .active(|s| s.opacity(0.6))
                .on_press(move || count.update(|n| *n += 1))
                .child(text("Tap").text_lg().text_color(white())),
        )
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";

function Counter() {
  const count = signal(0);
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12 }}>
      <Text style={{ fontSize: 48, fontWeight: "700" }}>{count()}</Text>
      <View
        onPress={() => count.update((n) => n + 1)}
        activeStyle={{ opacity: 0.6 }}
        class="rounded-lg bg-blue-600 px-5 py-3"
      >
        <Text class="text-white text-lg">Tap</Text>
      </View>
    </View>
  );
}

mount(Counter);
```

Una vista (`view()`, `<View>`) se convierte en un `UIView` en iOS, un `ViewGroup` en Android, un `NSView` en macOS, un widget de GTK en Linux, una vista retenida dibujada con Direct2D en Windows y un elemento HTML en la web; un texto se convierte en una vista de texto nativa, y la respuesta visual de pulsación del botón (`.active(..)`, `activeStyle`) se ejecuta en el hilo principal. Cuando tocas, `count.update` cambia un signal, y solo se actualiza el texto que lo lee: la función del componente no se vuelve a ejecutar. La app en Rust es código nativo de principio a fin; en la app en TSX, solo el código propio del módulo es JavaScript.

<a id="retained-views"></a>

## Vistas retenidas

NSH es retenido: cada elemento es una vista que la plataforma conserva, y una actualización cambia solo lo que cambió.

- **Actualizaciones de grano fino.** [Signals](./reactivity.md) como los de Solid, implementados de forma nativa: los componentes se ejecutan una sola vez, y un cambio vuelve a ejecutar únicamente las expresiones que leen el signal modificado.
- **Solo lo que cambió cruza los hilos.** Los cambios de un turno se calculan juntos y se entregan al hilo principal como un único lote de operaciones de vista por fotograma; los estilos y frames sin cambios no se envían, y las vistas que nada tocó permanecen como están.
- **Las animaciones se ejecutan de forma nativa.** Las animaciones de tipo timing, spring y decay, los gestos y los valores vinculados al scroll se evalúan en el reloj de fotogramas de la plataforma, sin llamar a JS en cada fotograma ([Animación](./animation.md)).

Esto se adapta a las pantallas de las que están hechas la mayoría de las apps (chats, correo, formularios, listas, documentos, ajustes, una respuesta de IA que llega en streaming), donde cambian unas pocas vistas a la vez y el resto espera. Estas pantallas están casi inactivas entre actualizaciones, y el scroll y las animaciones mantienen 120 FPS en pantallas ProMotion. En el [benchmark de rendimiento de NSH](https://github.com/longbridge/nsh-perf-bench), una tabla de cotizaciones de 500 filas actualizada 1000 veces por segundo usa el 18 % de un núcleo en Linux con NSH Rust, frente al 20 % de la misma pantalla escrita directamente sobre [GPUI Fast](https://github.com/longbridge/gpui-fast). El cómputo pesado pertenece a Rust: TSX se ejecuta en QuickJS, un intérprete, mientras que un módulo de Rust se ejecuta a velocidad nativa incluso cuando TSX lo invoca; ordenar 100 000 filas tarda unos 3 ms de esa forma, igual que en Rust puro ([Rendimiento](./performance.md)).

<a id="how-it-runs"></a>

## Cómo se ejecuta

La toolchain es un único binario `nsh`. Una app se escribe en Rust, en TSX, o en ambos, y cada uno sigue su propio camino hacia el mismo motor en Rust.

<a id="rust-apps"></a>

### Apps en Rust

Una app en Rust es un crate, construido por completo con Rust y Native, sin runtime de JavaScript:

1. **Compilación.** `nsh` compila el runner de cada destino (la app de iOS, Android, macOS, Windows, Linux o web) con tu crate enlazado. Los componentes, el estado, los handlers y el motor se compilan juntos en código nativo.
2. **Ejecución.** El componente raíz de la app se ejecuta en el hilo del motor como Rust. El runner no tiene motor de JavaScript: QuickJS no forma parte de una app en Rust en ninguna plataforma.

<a id="tsx-apps"></a>

### Apps en TSX

Una app en TSX (un módulo) es un conjunto de archivos `.tsx` / `.ts` con una entrada, normalmente `App.tsx`:

1. **Compilación.** `nsh` empaqueta los archivos del módulo (con rolldown y Oxc) y compila el JSX con su propio compilador. Las importaciones de `nsh` y `nsh/*` siguen siendo importaciones: el runtime las sirve de forma nativa, así que el bundle contiene solo tu código. El bundle se compila a bytecode de QuickJS.
2. **Ejecución.** El hilo del motor ejecuta el bytecode en [QuickJS](https://github.com/quickjs-ng/quickjs), una VM por vista. El JSX compilado llama directamente al renderizador nativo, y JavaScript solo describe la UI y gestiona los eventos; el parsing de estilos, la resolución de clases de Tailwind, el diffing, el layout y el texto ocurren todos en Rust.

<a id="the-difference"></a>

### La diferencia

| | App en Rust | App en TSX |
|---|---|---|
| Escrita en | Rust | TSX (TypeScript y JSX) |
| Se compila a | Código nativo, enlazado en el runner de cada destino | Bytecode de QuickJS, cargado por el runtime |
| Motor de JavaScript | Ninguno | QuickJS, una VM por vista |
| Durante el desarrollo (`nsh run`) | Se recompila y reinicia en cada guardado | Actualizaciones en caliente en cada guardado |
| Tras el lanzamiento | Se distribuye con la app | También se entrega en tiempo de ejecución como paquetes firmados, en un sandbox |
| Adecuado para | Apps completas, cómputo pesado, trabajo de sistema | Pantallas escritas con rapidez, plugins, UI generada por IA |

Los dos se combinan: una app en Rust puede incorporar pantallas TSX, y las pantallas TSX importan sus componentes, módulos y clases de Rust; una app así enlaza QuickJS para ejecutarlas ([Desarrollo con Rust](./rust.md)).

<a id="the-shared-engine"></a>

### El motor compartido

Desde el motor en adelante, ambos caminos son iguales. Los cambios se recogen por turno, se calcula su layout con Taffy (flexbox y CSS grid) y se entregan al hilo principal como un único lote de operaciones de vista por fotograma; el hilo principal aplica el lote a las vistas nativas. El texto se mide y se maqueta una sola vez en el hilo del motor (CoreText en las plataformas de Apple, `StaticLayout` en Android, DirectWrite en Windows, Pango en Linux, las métricas de fuente del navegador en la web) y solo se dibuja en el hilo principal.

En la web, el mismo motor se ejecuta en la página: el navegador muestra elementos HTML con estilos CSS, los desplaza, selecciona su texto y gestiona la entrada, y `nsh package --target web` publica la app como un sitio estático cuyos archivos se nombran por contenido, listo para cualquier CDN ([Web](./web.md)).

> [!NOTE]
> El hilo principal nunca espera al código de la app. Las preguntas que el sistema hace de forma síncrona (si este input puede aceptar otro carácter, si el usuario puede deslizar hacia atrás, si esta hoja puede cerrarse) se responden de forma nativa a partir de props establecidas de antemano, como `maxLength`, `popOnBack` o `closeOnSwipe`. Los eventos llegan después a los handlers de la app.
<a id="dynamic-ui-and-ai-generated-ui"></a>

## UI dinámica y UI generada por IA

NSH nació como una forma de que las apps nativas incorporaran UI después de su publicación, y sigue siendo uno de sus usos principales. Una app integra un `NshAppView` (iOS), `NshView` (Android), `AppView` (apps de macOS, Windows, Linux y GPUI) o `createPlayer` (una página web) allí donde deba aparecer un módulo, y NSH ejecuta en su interior módulos TSX:

- **Entregada después de la publicación.** Un módulo es un paquete firmado (`.nshpkg`) que la app descarga en tiempo de ejecución. La app comprueba su firma con las claves en las que confía y con una lista de revocación antes de ejecutarlo ([Paquetes firmados](./signed-packages.md)). La app anfitriona incluye el runtime; los equipos crean módulos con su API y los entregan según su propio calendario.
- **La app anfitriona mantiene el control.** Cada módulo se ejecuta en su propia VM de QuickJS, con límites de memoria, de tiempo de llamada y de nodos, y solo accede a lo que el anfitrión le concede: hosts de red, páginas web, la barra de estado ([Sandbox y capacidades](./sandbox-and-capabilities.md)). Varios módulos se ejecutan en paralelo.
- **Se ve como el resto de la app.** Los módulos se renderizan con la UI propia de la plataforma, y el anfitrión puede registrar sus propias vistas nativas (un mapa, un reproductor, un componente del sistema de diseño) para que los módulos las usen ([Componentes nativos](./native-components.md)).

El mismo mecanismo permite que una app **responda con una interfaz**. Un modelo escribe un pequeño módulo TSX (un formulario, un gráfico, una tarjeta de reserva), tu servidor lo comprueba, lo compila y lo firma, y la app lo muestra de forma nativa:

<div class="diagram-scroll">
<img class="diagram diagram-light" src="/diagrams/ai-flow-light.svg" alt="From a prompt to native UI: a model writes a TSX module; your server builds, checks and signs it; across the trust boundary, the app verifies the package, runs it in a sandbox with the limits and capabilities it set, and shows it with the platform's own UI.">
<img class="diagram diagram-dark" src="/diagrams/ai-flow-dark.svg" alt="From a prompt to native UI: a model writes a TSX module; your server builds, checks and signs it; across the trust boundary, the app verifies the package, runs it in a sandbox with the limits and capabilities it set, and shows it with the platform's own UI.">
</div>

En iOS, la parte del anfitrión son unas pocas líneas:

```swift
let app = NshAppView()                         // a UIView: place it anywhere
try app.grantCapabilities(#"{ "network": { "hosts": ["api.example.com"] } }"#)
let info = try await app.loadPackage(at: downloadedFile, trust: trust)   // verified, then run
```

<a id="ai-friendly"></a>

## Pensado para la IA

NSH está diseñado para el software escrito con IA, tanto para apps completas como para pantallas generadas:

- **Un único modelo de app para todas las plataformas.** Un modelo aprende una sola forma de escribir UI, y el resultado se ejecuta en móviles, escritorio y web; NSH adapta la interacción a cada plataforma, de modo que no hay que generar nada seis veces.
- **Rust o TSX, según la tarea.** Rust para apps completas y módulos críticos para el rendimiento, TSX para pantallas, plugins y UI generada por solicitud, todo sobre un mismo motor.
- **Un contrato preciso y generado.** Cada elemento, prop, clave de estilo y módulo tiene declaraciones de TypeScript generadas a partir de las fuentes de Rust (`.nsh/types`), y las API de Rust están tipadas, por lo que un compilador comprueba el código generado. Esta documentación se sirve como texto plano para los modelos ([`llms.txt`](/llms.txt), [`llms-full.txt`](/llms-full.txt)).
- **Una sola línea de comandos para todo el ciclo.** Un agente crea la app, la compila, la ejecuta en un destino, ejecuta sus pruebas, lee el resultado, corrige y empaqueta, todo a través de `nsh`. `nsh test` se ejecuta sin interfaz y sin dispositivo, e informa de los errores y de las vistas producidas; el compilador también se ejecuta en proceso (`nsh_bundler::compile_module`) y en el navegador ([Playground](/playground)).
- **Seguro de ejecutar cuando no es de confianza.** El código generado que se entrega en tiempo de ejecución es código no confiable: llega firmado, se ejecuta en una VM con límites y solo accede a las capacidades que concede el anfitrión.

<a id="where-it-runs"></a>

## Dónde se ejecuta

| Plataforma | Requisitos | Backend | Se integra con |
|---|---|---|---|
| [iOS](./ios.md) | iOS 15.0+ | UIKit | `NativeShell.xcframework` |
| [Android](./android.md) | Android 9+ | Vistas de Android | `nsh.aar` |
| [macOS](./macos.md) | macOS 14+ | AppKit | `AppView` |
| [Windows](./windows.md) | Windows 10 1809+ | Win32, Direct2D | `AppView` |
| [Linux](./linux.md) | GTK 4.14+ | GTK 4 | `AppView` |
| [Web](./web.md) | Navegadores modernos | HTML | `createPlayer`, iframe |
| [GPUI](./gpui.md) | Escritorio | GPUI | `AppView` (apps de GPUI y GPUI Kit) |
| Mac Catalyst | macOS | UIKit | Para desarrollo (`--target catalyst`) |

<div class="diagram-scroll">
<img class="diagram diagram-light" src="/diagrams/platforms-light.svg" alt="One module, many hosts: the same bundle and Rust runtime on iOS, Android, Linux, macOS with AppKit and Windows with Win32 / Direct2D, GPUI on all three desktops, and web pages drawn with HTML.">
<img class="diagram diagram-dark" src="/diagrams/platforms-dark.svg" alt="One module, many hosts: the same bundle and Rust runtime on iOS, Android, Linux, macOS with AppKit and Windows with Win32 / Direct2D, GPUI on all three desktops, and web pages drawn with HTML.">
</div>

<a id="native-shell-and-gpui-shell"></a>

## Native Shell y GPUI Shell

[Longbridge](https://longbridge.com) desarrolla NSH para sus propios clientes. La primera necesidad fue una capa de plugins para el cliente móvil, y el punto de partida fue [GPUI Shell](https://gpui-kit.com/shell), que hace que las apps de escritorio de [GPUI](https://gpui-kit.com) sean extensibles en JavaScript. En los móviles, una UI dibujada por el propio GPUI habría tenido que reconstruir lo que la plataforma ya ofrece (la selección de texto y su menú —Copiar, Compartir, Traducir, Buscar—, los métodos de entrada, la accesibilidad, los materiales visuales que trae cada versión de iOS), y cada equipo móvil habría asumido una nueva pila de UI. Por eso NSH renderiza con la UI propia de cada plataforma, y pasó de esa capa de plugins a ser un framework para apps completas en todas las plataformas.

Ambos tienen un posicionamiento distinto. GPUI Shell extiende las aplicaciones de escritorio de GPUI; Native Shell es un framework para apps nativas en móviles, escritorio y web, y su backend de GPUI integra apps de NSH en apps de GPUI y GPUI Kit ([GPUI](./gpui.md)).

<a id="how-it-compares"></a>

## Comparación con otros enfoques

Para apps completas, NSH se sitúa entre frameworks multiplataforma como React Native, Flutter, Qt, GPUI, Slint, Electron y Tauri; para la UI entregada después de la publicación, entre las web views, la UI dirigida por el servidor y los contenedores de mini programas. Su apuesta es la UI y la interacción propias de cada plataforma bajo un único modelo de app, con Rust como lenguaje de la app y TSX a su lado. [Comparación de enfoques](./comparison.md) repasa cada uno.

<a id="next-steps"></a>

## Siguientes pasos

- [Instalación](./installation.md) y [Primeros pasos](./getting-started.md): obtén `nsh`, escribe una primera app en Rust o TSX y ejecútala en cada plataforma.
- [Desarrollo con Rust](./rust.md): apps escritas en Rust, y TSX por encima.
- [Plataformas](./platforms.md): qué se ejecuta dónde, y cómo ejecutar, empaquetar e integrar en cada plataforma.
- [JSX y componentes](./jsx-and-components.md) y [Reactividad](./reactivity.md): las dos ideas sobre las que se apoya todo lo demás, en Rust y TSX.
- [Paquetes firmados](./signed-packages.md) y [Sandbox y capacidades](./sandbox-and-capabilities.md): entrega módulos y decide qué pueden hacer.
