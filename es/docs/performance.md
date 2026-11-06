---
title: "Rendimiento"
description: "Cómo NSH mantiene las apps rápidas (apps en Rust, un runtime nativo, cruces por lotes, animaciones nativas, listas virtualizadas), qué implica esto para tu código y cómo medir en modo headless y en pantalla."
order: 62
group: tools
source_hash: f8f220699bc54685
---


# Rendimiento

Performance es la primera prioridad de NSH, y la mayor parte se decide en el framework y no en tu app: el runtime es nativo, cada actualización cruza hilos una sola vez, las animaciones y la virtualización de listas se ejecutan sin JS, y una app escrita en Rust no ejecuta nada de JS. Esta página explica las reglas que sigue NSH, qué significan para el código que escribes, tanto en Rust como en TSX, y cómo medir.

<a id="the-rules"></a>

## Las reglas

<a id="1-js-does-as-little-as-possible"></a>

### 1. JS hace lo mínimo posible

**Una app escrita en Rust es código nativo de principio a fin**: sus componentes, su estado y sus manejadores se compilan con el motor de NSH, y no se ejecuta ningún intérprete ([Building with Rust](./rust.md)). Es la forma más rápida de escribir una app, y la que conviene elegir para lógica de negocio exigente.

En una app TSX, QuickJS es un intérprete: pequeño, de arranque rápido y mucho más lento que el código nativo para trabajo pesado. Por eso en NSH **solo el código de tu app es JS**. El grafo reactivo (signals, valores computed, effects), el renderer al que llama tu JSX compilado, el motor de layout, la virtualización de listas, la animación y cada módulo que importas son Rust. El parseo, el diffing, el layout y el procesamiento de cadenas ocurren de forma nativa.

El efecto es medible. La misma app de contador en el runtime JS anterior de NSH y en el runtime nativo (builds de release):

| | Runtime JS anterior | Runtime nativo |
|---|---|---|
| Tamaño del bundle | 14 KB JS / 19.6 KB bytecode | 886 B JS / 1.7 KB bytecode |
| Evaluación del bundle | ~390 µs | ~95 µs |
| Tiempo de JS de un tap (mediana) | ~14 µs | ~5 µs |
| Commit de un tap | ~22 µs | ~15 µs |
| Scroll de una lista de 1000 filas, JS por frame de rebinding | ~150 µs | ~77 µs |

Lo mismo ocurre con los componentes: un botón escrito como componente Rust frente a un botón TSX equivalente, 200 de cada uno:

| | Botón Rust: JS / core | Botón TSX: JS / core |
|---|---|---|
| Primer frame (ops) | 1.32 ms / 0.77 ms (1015) | 2.32 ms / 0.70 ms (2415) |
| Actualizar los 200 títulos (ops) | 0.42 ms / 0.42 ms (200) | 0.77 ms / 0.36 ms (600) |

(Medido en Apple silicon; la segunda tabla, en el runtime anterior. Ambas provienen de las líneas base de rendimiento de NSH.)

**Para tu código:** mantén ligeros los manejadores de eventos y los valores computed. El cómputo pesado (parsear payloads grandes, ordenar miles de elementos en cada pulsación de tecla) cuesta más en QuickJS de lo que quizá estás acostumbrado en V8 o JavaScriptCore con JIT. Hazlo una sola vez, guárdalo en caché en un `computed`, o sácalo de la ruta de interacción.

<a id="2-cross-threads-in-batches"></a>

### 2. Cruzar hilos por lotes

El código de tu app, en Rust o en JS, se ejecuta en un hilo del motor, nunca en el hilo principal. Un turno, por ejemplo un manejador de eventos con todo lo que cambia, se convierte en **un commit**: el runtime renderiza componentes, calcula el layout, hace el diff y produce un único lote de operaciones de vistas nativas, que llega al hilo principal en **un solo salto**. No hay un mensaje de bridge por vista ni serialización por prop.

**Para tu código:** no necesitas agrupar escrituras por rendimiento; diez llamadas a `set` en un manejador siguen produciendo un solo commit, en Rust y en TSX. Usa `batch` cuando quieras que los effects y los valores computed vean todas las escrituras a la vez en lugar de ejecutarse después de cada una.

<a id="3-fine-grained-updates"></a>

### 3. Actualizaciones de grano fino

Los componentes se ejecutan **una sola vez**, tanto en Rust como en TSX. Después, solo se vuelven a ejecutar los bindings que leen una signal cuando esta cambia: un texto, una propiedad de estilo, una rama de `when` (`<If>`), las filas de `each` (`<Each>`). Nada vuelve a renderizar un subárbol entero para averiguar qué cambió.

```rust tabs
use nsh_core::prelude::*;

#[derive(Clone, PartialEq)]
struct Quote {
    price: f64,
    change: f64,
}

fn price(quote: Signal<Quote>) -> impl IntoElement {
    // Runs once. When the quote changes, only the text and the color update.
    text(move || format!("{:.2}", quote.with(|q| q.price))).text_color(move || {
        if quote.with(|q| q.change < 0.0) { rgb(0xcf222e) } else { rgb(0x1a7f37) }
    })
}
```

```tsx tabs
import type { Accessor } from "nsh";
import { Text } from "nsh";

type Quote = { price: number; change: number };

function Price(props: { quote: Accessor<Quote> }) {
  // Runs once. When quote() changes, only the text and the color update.
  return (
    <Text style={{ color: props.quote().change < 0 ? "#cf222e" : "#1a7f37" }}>
      {props.quote().price.toFixed(2)}
    </Text>
  );
}
```

**Para tu código:**

- Lee las signals donde se usan (dentro de bindings, de closures `move ||` en Rust y de expresiones JSX en TSX, y en `computed` y `effect`), no al inicio de un componente, de modo que se actualice el binding más estrecho.
- Usa `each` / `<Each>` (filas conservadas por clave) o una [lista virtual](./lists.md) para colecciones; las filas recreadas a partir de la colección completa (`dynamic` en Rust, un `.map()` simple en JSX) se crean todas de nuevo en cada cambio.
- Deriva valores con `computed` cuando varios bindings los usen, para que se calculen una sola vez por cambio.

Añadir un cuarto elemento a una lista de tres, tal como lo muestra `nsh test --trace`:

```rust tabs
// 22 mount items: 3 views removed, 4 created
dynamic(move || items.get().into_iter().map(|n| text(format!("row {n}"))).collect::<Vec<_>>())
// 4 mount items: 1 view created
each(move || items.get(), |n: &u32| *n, |n, _| text(move || format!("row {}", n.get())))
```

```tsx tabs
{items().map((n) => <Text>{`row ${n}`}</Text>)}                   // 22 mount items: 3 views removed, 4 created
<Each of={items()}>{(n) => <Text>{`row ${n()}`}</Text>}</Each>      // 4 mount items: 1 view created
```

Consulta [Reactivity](./reactivity.md).

<a id="4-do-not-send-what-is-not-needed"></a>

### 4. No enviar lo que no hace falta

El core envía solo lo que cambió: las vistas nuevas no reciben estilo por defecto ni máscara de eventos vacía, los estilos y frames sin cambios no se envían, y un cambio de color de texto no vuelve a calcular el layout del texto. Un tap que cambia un número envía un solo elemento de texto. Puedes verlo en la salida de `nsh test --trace` (más abajo).

<a id="5-animate-natively"></a>

### 5. Animar de forma nativa

Una animación dirigida desde el hilo del motor (una signal escrita en cada frame) cuesta un commit por frame y una llamada JS en TSX, y se entrecorta cuando el hilo del motor está ocupado. Los valores animados ([Animation](./animation.md): `animated_value` en Rust, [la API de animación de `nsh`](../modules/nsh.md#animation) en TSX) ejecutan las animaciones de forma nativa:

```rust tabs
use nsh_core::prelude::*;

let scroll_y = animated_value(0.0);

view()
    .bind_opacity(&scroll_y.interpolate(&[0.0, 120.0], &[1.0, 0.35]))
    .bind_translate_y(&scroll_y.interpolate(&[0.0, 120.0], &[0.0, -6.0]));
virtual_list(move || photos.with(Vec::len), move |at| photo_row(photos, at))
    .scroll_value(&scroll_y)
    .estimated_item_size(px(64.0))
    .flex_1();
```

```tsx tabs
import { List, View } from "nsh";
import { createAnimatedValue } from "nsh";

const scrollY = createAnimatedValue(0);

<View
  style={{
    opacity: scrollY.interpolate({ inputRange: [0, 120], outputRange: [1, 0.35] }),
    translate: [0, scrollY.interpolate({ inputRange: [0, 120], outputRange: [0, -6] })],
  }}
/>;
<List each={photos()} scrollValue={scrollY} estimatedItemSize={64} style={{ flex: 1 }}>
  {(photo) => <Row photo={photo()} />}
</List>;
```

- `timing`, `spring` y `decay` se ejecutan en el hilo de UI de la plataforma, frame a frame, sin trabajo en el hilo del motor por cada frame.
- `scroll_value` (`scrollValue`) escribe un offset de scroll en un valor animado en el mismo frame; un pan (`pan={{ x, y }}`) permite que los arrastres muevan una vista directamente. Tu código se entera del final (la animación se completa, el final del pan recibe la velocidad).
- `Animated.sequence` / `parallel` / `stagger` / `loop` se ejecutan como un único árbol nativo: cada paso empieza en el momento en que termina el anterior, sin espera por JS.
- `LayoutAnimation.configureNext` anima de forma nativa los frames, inserciones y eliminaciones del siguiente commit.

<a id="6-virtualize-long-lists"></a>

### 6. Virtualizar las listas largas

[`List`](./lists.md) mantiene solo las filas cercanas al viewport, recicla sus celdas y calcula de forma nativa posiciones, columnas, encabezados fijos y visibilidad. Los frames de scroll que no revelan ninguna fila nueva no ejecutan nada de tu código y no producen ningún lote; un frame que enlaza una fila nueva de la lista de fotos de la galería son 4 operaciones y 4 elementos de montaje.

**Para tu código:**

- Da a `estimated_item_size` (`estimatedItemSize`) un valor cercano a la altura real de la fila.
- Mantén el estado por elemento en tus datos (indexado por id), no en signals creadas dentro de la fila: las celdas se reutilizan para otros elementos, y la posición de la fila (`at.index()`; `item()` / `index()` en TSX) cambia cuando esto ocurre.
- Mantén las filas baratas: una fila se enlaza una vez por reciclaje, así que su código se ejecuta mientras el usuario hace scroll.
- Usa `scroll_value` (`scrollValue`) en lugar de `on_scroll` (`onScroll`) para los efectos que siguen la posición del scroll. Un listener de scroll recibe como máximo un evento por turno del motor, pero cada uno sigue siendo una llamada a tu código (a JS, en TSX).

<a id="measuring"></a>

## Medir

<a id="headless-50"></a>

### Sin interfaz: `--trace`

En un test de Rust, `EngineConfig::trace` registra las mismas líneas `perf` y `Headless::observe` ve cada lote ([Testing](./testing-and-trace.md#tracing-with-trace)). `nsh test --trace` las imprime para TSX:

```sh
echo 'await app.press("Add")' | nsh test App.tsx --trace                 # first frame + a press
echo 'await app.scroll("id:feed", 3000)' | nsh test App.tsx --trace       # scrolling, 10 pt per frame
```

```text
perf commit: 56 ops, 395µs (list js 6µs), 49 mount items, 21 nodes
perf first frame: eval 271µs, total 1235µs
perf event js: 88µs
perf commit: 10 ops, 151µs (list js 2µs), 8 mount items, 27 nodes
```

Qué mirar:

- **ops** (operaciones que tu JS puso en cola) y **mount items** (operaciones de vistas nativas): son deterministas. Si un tap que debería cambiar una etiqueta produce 40 elementos, algo está recreando vistas que debería actualizar.
- **event js**: el costo en JS de un manejador y de lo que desencadenó.
- **commit**: el costo del core al renderizar componentes, calcular el layout y hacer el diff.
- **list js**: el JS gastado en enlazar filas de lista durante ese commit.

Guía completa: [Testing](./testing-and-trace.md).

<a id="on-a-device-55"></a>

### En un dispositivo: `--trace`

```sh
nsh run App.tsx --trace
nsh run App.tsx --target android --trace --release
```

registra las mismas líneas de commit desde el host real de una app TSX, con el motor de texto propio de la plataforma. `NshAppView(trace: true)` y `new NshView(context, true)` hacen lo mismo en una app embebedora.

<a id="on-screen-58"></a>

### En pantalla: `--fps`

```sh
nsh run App.tsx --target macos --fps --release
```

(`AppOptions { fps: true, .. }` en el `run_app` de una app Rust) muestra la tasa de frames y lo que cuestan los frames y los commits sobre la app en ejecución, junto con CPU, GPU y memoria ([macOS: performance monitor](./macos.md#performance-monitor)). En Linux y Windows, `--target linux --fps` y `--target windows --fps` registran las mismas lecturas una vez por segundo, con el tiempo de cada fase de un frame; `nsh test --target linux --fps -v` (o `windows`) las toma mientras un test controla la app.

> [!TIP]
> Las mediciones aisladas están dominadas por el estado del reloj de la CPU: un hilo que acaba de dormir se ejecuta más lento durante un rato. Compara el mínimo de varias ejecuciones, en la misma máquina, y prefiere builds de release para medir tiempos.

<a id="reference-numbers"></a>

## Números de referencia

Los números medidos, las líneas base de NSH y la galería página por página en Linux están en el [informe de rendimiento](./performance-report.md).

<a id="checklist"></a>

## Lista de verificación

- Lenguaje: escribe la app, o las partes que más usa, en Rust ([Building with Rust](./rust.md)); deja TSX para lo que cambia con frecuencia o se entrega en tiempo de ejecución.
- Interacciones: un tap cambia un puñado de mount items, no docenas.
- Listas: una lista virtual (`virtual_list`, `List`) para cualquier cosa larga, con un tamaño de elemento estimado; estado por elemento en los datos.
- Animaciones: valores animados, no signals escritas en cada frame.
- Efectos de scroll: `scroll_value` (`scrollValue`), no un listener de scroll.
- Manejadores: sin trabajo pesado por pulsación de tecla ni por evento de scroll; usa caché en `computed`.

<a id="see-also"></a>

## Ver también

- [Informe de rendimiento](./performance-report.md)
- [Architecture](./architecture.md)
- [Testing](./testing-and-trace.md)
- [Lists](./lists.md), [Animation](./animation.md), [Reactivity](./reactivity.md)
