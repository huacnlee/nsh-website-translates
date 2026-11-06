---
title: "Arquitectura"
description: "Cómo se ejecuta una aplicación NSH: el pipeline de compilación, los hilos del motor y principal, el recorrido desde un cambio de señal hasta las vistas nativas, el grafo reactivo nativo, el diseño de texto y los crates."
order: 63
group: tools
source_hash: 03fd3f0b9b408f5b
---


# Arquitectura

Esta página es para desarrolladores de apps que quieren saber qué ocurre entre `count.set(1)` y el cambio de una etiqueta en pantalla,
en una app escrita en Rust o en TSX.
No la necesitas para escribir apps, pero explica por qué NSH se comporta como lo hace: por qué los componentes se ejecutan una sola vez, por qué
las animaciones siguen fluidas mientras JS está ocupado, por qué el hilo principal nunca espera a tu código.

<a id="the-big-picture"></a>

## El panorama general

<div class="diagram-scroll">
<img class="diagram diagram-light" src="/diagrams/architecture-light.svg" alt="How an nsh app runs: the nsh CLI builds App.tsx into bytecode; on the engine thread, QuickJS runs a handler, the reactive graph in nsh-js queues ops, and nsh-core commits one MountBatch; it crosses to the main thread in one hop, which applies it to UIKit or Android views; touches go back as events. Native animations run on the main thread without JavaScript.">
<img class="diagram diagram-dark" src="/diagrams/architecture-dark.svg" alt="How an nsh app runs: the nsh CLI builds App.tsx into bytecode; on the engine thread, QuickJS runs a handler, the reactive graph in nsh-js queues ops, and nsh-core commits one MountBatch; it crosses to the main thread in one hop, which applies it to UIKit or Android views; touches go back as events. Native animations run on the main thread without JavaScript.">
</div>

<a id="building-only-your-code-becomes-js"></a>

## Compilación: solo tu código se convierte en JS

`nsh build`, `nsh dev` y los demás comandos empaquetan tu app con una toolchain escrita en Rust (sin Node.js):

1. **Oxc** elimina los tipos de TypeScript.
2. **El compilador JSX de NSH** convierte JSX en llamadas directas al renderer nativo, en la misma pasada. Las props y los
   hijos estáticos se establecen una sola vez; las expresiones que pueden cambiar (llaman a una función o leen una propiedad) se convierten en bindings que
   el renderer sigue. Los componentes pasan a ser simples llamadas a función con un objeto de props cuyas props cambiantes son getters.
3. **rolldown** empaqueta tus módulos en un único módulo ES. Las importaciones de los módulos de NSH (`nsh`, `nsh/mobile`,
   `nsh/base`, ...) siguen siendo importaciones: esos módulos son nativos y los sirve el runtime. **El bundle contiene solo el código de
   tu app**; el ejemplo del contador ocupa menos de 1 KB de JS.
4. El bundle se compila a **bytecode** (`bundle.nshc`), que se carga más rápido que el código fuente, y se compone un **source map**
   a lo largo de todos los pasos para que los stack traces apunten a las líneas de tu `.tsx`.

Las imágenes y fuentes que importas se recopilan como assets, y las declaraciones de tipos para tu editor se escriben en
`.nsh/types`.

Una app escrita en Rust no tiene bundle: Cargo compila el runner de cada target con tu crate enlazado, y el componente
raíz que nombra `nsh.json` se ejecuta de forma nativa en el engine. Todo lo que sigue también se aplica a ella, con el código de tus componentes
ejecutándose en Rust donde el de una app TSX se ejecuta en QuickJS.

<a id="running-two-threads-per-app"></a>

## Ejecución: dos hilos por app

Cada app en ejecución (un `NshAppView` en iOS, un `NshView` en Android, la ventana de una app empaquetada) es un **engine** con
su propio **hilo del engine** y, para TSX, su propia VM de QuickJS. No hay singletons globales, así que varias apps pueden ejecutarse en paralelo
dentro de una misma app anfitriona.

<a id="the-engine-thread"></a>

### El hilo del engine

Aquí ocurre todo lo relativo a la lógica de tu app:

- **Tu código** se ejecuta aquí: componentes, manejadores de eventos, temporizadores, efectos. Los componentes Rust se ejecutan de forma nativa; TSX se ejecuta en
  **QuickJS**.
- **El grafo reactivo** (signals, valores computados, efectos, owners, contexto) es nativo. Sus nodos son objetos de QuickJS
  de clases nativas, de modo que el recolector de basura ve las referencias a través de ellos, pero el seguimiento de dependencias y la
  planificación de las actualizaciones son Rust (sigue el algoritmo de Solid 1.9).
- **El renderer** al que llama tu JSX compilado es nativo. Crea nodos y convierte cada cambio en una **op** que se introduce
  directamente en una cola nativa: sin JSON, sin mensajes por prop.
- **El core** mantiene un shadow tree de todos los nodos. Cuando termina un turno de JS, toma todas las ops en cola de una vez y hace **commit**:
  renderiza los componentes Rust (los de `nsh/base` y los propios de la app), resuelve los insets de `env()` en padding y margin, reconstruye los textos modificados, calcula el layout con **Taffy** (flexbox y grid, con
  columna por defecto y sin shrinking), compara frames y estilos, y produce un **MountBatch**: la lista de operaciones que necesitan las vistas
  nativas.

<a id="the-main-thread"></a>

### El hilo principal

El hilo principal (UI) de la plataforma aplica cada MountBatch en un solo salto: crea vistas, las inserta, establece estilos y frames,
y entrega el texto ya maquetado. Aparte de eso, solo hace lo que debe ocurrir en él:

- **dibujar texto** que ya fue maquetado en el hilo del engine;
- **animaciones nativas**: los valores animados de `nsh` se manejan fotograma a fotograma (un `CADisplayLink` en iOS, un
  animador del hilo de UI en Android) y se escriben directamente en las vistas;
- **gestos y scroll**: los toques se convierten en eventos enviados al hilo del engine; `scrollValue` y `pan` alimentan valores
  animados en el mismo fotograma.

**El hilo principal nunca espera a JS.** Cuando el sistema necesita una respuesta al instante (si este texto puede cambiar, si el
botón de retroceso puede quitar esta pantalla, si esta sheet puede cerrarse), la respuesta se montó de antemano como una prop, y JS se entera
después mediante un evento. Un hilo del engine ocupado puede retrasar las actualizaciones, pero no puede congelar el scroll, las animaciones ni
los gestos del sistema.

<a id="from-a-tap-to-the-screen"></a>

## De un toque a la pantalla

```text
 main thread               engine thread                                              main thread
 ───────────               ─────────────────────────────────────────────────────      ───────────
 tap on a view ─ event ─▶  handler runs: count.set(count() + 1)
                           reactive graph: the bindings that read count() run again
                           renderer: one op per changed binding → native queue
                           JS turn ends → core commit: render, text, layout, diff
                           → MountBatch (e.g. 1 Text item)                 ─ hop ─▶   apply: draw the new text
```

En el ejemplo del contador, un toque cuesta unos 0,12 ms en una build release en un Mac, contando JS y commit juntos, y produce un
puñado de mount items (consulta [Testing](./testing-and-trace.md)).

En una app Rust, el manejador es un closure de Rust (`count.set(count.get() + 1)`), y siguen el mismo grafo, commit y batch,
sin intérprete de por medio.

De este diseño se derivan tres propiedades:

- **Un turno es un commit.** Por muchas signals que establezca un manejador, las vistas cambian una sola vez, todas juntas.
- **Los componentes se ejecutan una vez.** Solo se vuelven a ejecutar los bindings; no hay re-render de un componente ni diff de DOM virtual. El
  diff que queda es el del core, sobre frames y estilos, en Rust.
- **Solo viajan los cambios.** Los estilos y frames sin cambios no se envían; las vistas nuevas no reciben valores por defecto.

<a id="text-laid-out-once-off-the-main-thread"></a>

## Texto: maquetado una vez, fuera del hilo principal

El texto suele ser la parte más costosa de una UI. NSH lo maqueta en el hilo del engine con el motor de texto propio de la plataforma,
de modo que se ve exactamente como el texto nativo:

1. **preparar**: un `<Text>` y sus spans anidados se convierten en una única cadena con atributos (CoreText en las plataformas de Apple,
   `PrecomputedText` / `StaticLayout` en Android);
2. **medir** con los anchos que pide el layout; las mediciones se guardan en caché por contenido y ancho, de modo que un cambio solo de color
   no vuelve a medir;
3. **maquetar** con el tamaño final.

El hilo principal recibe el resultado inmutable y solo lo dibuja. Un texto anidado en un `<Text>` es un span, no una vista;
las cadenas fuera de `<Text>` no se renderizan.

<a id="lists"></a>

## Listas

`List` está virtualizada de forma nativa. El core decide qué filas están cerca del viewport, calcula posiciones, columnas y
sticky headers, y recicla las celdas. Cuando una celda necesita un elemento distinto, el runtime la enlaza (los accesores `item()` y `index()`
de tu función de fila cambian); los fotogramas que no revelan ninguna fila nueva no llaman a JS en absoluto. Consulta [Lists](./lists.md).

<a id="everything-else-the-runtime-does"></a>

## Todo lo demás que hace el runtime

- **Redes**: `fetch` y las demás APIs globales son clases nativas. Las peticiones van a la pila HTTP de la plataforma
  (`NSURLSession`, `HttpURLConnection`), con streaming en ambas direcciones.
- **Las imágenes** se descargan y decodifican fuera del hilo principal, al tamaño de la vista, con una caché en memoria.
- **Los límites y capacidades** los aplica el runtime, en Rust: consulta [Sandbox and capabilities](./sandbox-and-capabilities.md).
- **El hot module replacement** también es nativo: el runtime aplica los parches en mucho menos de un milisegundo (consulta
  [Dev server and debugging](./dev-server-and-debugging.md)).

<a id="three-layers"></a>

## Tres capas

La UI de NSH se construye en tres capas, igual que la de GPUI Kit:

| Capa | NSH | GPUI Kit | Qué es |
|---|---|---|---|
| Primitivas | `nsh-core` y el runtime (`nsh`, `nsh/mobile`, `nsh/desktop`) | `gpui` | Los elementos host, estilos, layout, renderizado, reactividad, el entorno |
| Componentes base | `nsh-base` (`nsh/base`) | `gpui-base` | Componentes sin estilo que se encargan del comportamiento, el estado, el foco, el teclado y la accesibilidad, y toman su aspecto de la app |
| Biblioteca de componentes | la de tu app, o la de la comunidad | `gpui-component` | Componentes con estilo: botones, tarjetas, filas con aspecto propio |

Las dos primeras capas son Native Shell. La tercera es tuya: una app construye su propia biblioteca de componentes sobre `nsh/base` y
las primitivas, en TSX o como componentes Rust en [su propio crate](./rust.md), usa una que publique la comunidad, o
da estilo a su UI directamente en la app.

<a id="the-crates"></a>

## Los crates

NSH es un workspace de Rust. Nunca lo compilas para escribir apps (la distribución incluye la CLI y los runtimes precompilados), pero
los nombres aparecen en logs y documentación:

| Crate | Qué es |
|---|---|
| `nsh-core` | El core independiente de la plataforma: shadow tree, estilos, layout con Taffy, fusión de texto, virtualización de listas, mount items; valores CSS y Tailwind; el grafo de animación nativo (valores, interpolación, timing / spring / decay); el framework y el tema de los componentes Rust; los módulos Rust del runtime (`BackHandler` de `nsh/mobile`, ...). |
| `nsh-base` | `nsh/base`, los componentes base sin estilo (`gpui-base` de NSH): navegación, diálogos, controles y la barra de estado; las apps Rust lo usan como `nsh_base`. |
| `nsh-js` | El host de QuickJS y el runtime de NSH: el grafo reactivo, el renderer, todos los módulos nativos, las APIs globales, el hot module replacement, los límites; y las declaraciones de TypeScript de todo ello. |
| `nsh-engine` | El hilo del engine: maneja `nsh-js` y `nsh-core` y entrega un batch por fotograma a la plataforma. |
| `nsh-package` | Paquetes firmados: claves, certificados, revocación, el trust store. |
| `nsh-bundler` | El bundler: rolldown, Oxc, el compilador JSX de NSH, source maps, comprobaciones de clases de Tailwind. |
| `nsh-dev` | El dev server y su cliente. |
| `nsh-platform-ios` | El backend de UIKit (iOS, simulador, Mac Catalyst): montaje de vistas, el motor de texto CoreText, entrada; el SDK de embedding. |
| `nsh-platform-android` | El backend de Android: `libnsh.so` y el runtime de Java (`NshView`, las vistas, imágenes, redes). |
| `nsh-cli` | El comando `nsh`. |

La dirección de las dependencias es `nsh-core` ← `nsh-js` ← `nsh-engine` ← plataformas; `nsh-base` se construye sobre `nsh-core`. El core no depende de ninguna plataforma ni de ningún motor de JS,
lo que permite que `nsh test` ejecute el runtime real sin interfaz en cualquier máquina.

<a id="see-also"></a>

## Véase también

- [Performance](./performance.md)
- [Reactivity](./reactivity.md)
