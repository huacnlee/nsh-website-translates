---
title: "Informe de rendimiento"
description: "Cifras medidas de aplicaciones NSH: costes de commit y de frame según las líneas base de NSH, y la tasa de frames, la CPU y la memoria de la galería página por página en Linux, macOS, Windows e iOS, junto con cómo reproducirlas."
order: 62.5
group: tools
source_hash: 8924d78b30d23299
---


# Informe de rendimiento

Lo que cuestan las apps de NSH, medido. Cómo NSH las mantiene rápidas y cómo medir tu propia app se explica en [Rendimiento](./performance.md).

<a id="baselines"></a>

## Valores de referencia

De las mediciones base del propio NSH (Apple silicon salvo indicación contraria):

| Escenario | Cifras |
|---|---|
| App contador, headless (debug) | Primer frame ~0.5–0.65 ms (58 ops / 49 mount items); un toque ~0.15 ms |
| App contador, Mac Catalyst (release) | Primer frame ~1.05–1.15 ms (unos 0.7 ms se dedican a maquetar 10 textos con CoreText por primera vez); un toque ~0.12 ms |
| Lista de fotos de Gallery, headless (debug) | Primer frame 653 ops / 224 nodos, ~2.7 ms |
| Scroll de la lista de fotos, Catalyst (release) | Revincular una fila mientras se hace scroll lento ~0.4 ms; una pantalla completa de ~32 filas en un fling rápido 0.9–1.6 ms |
| Scroll de la lista de fotos, emulador de Android (arm64, release) | Revincular una fila ~0.3–0.4 ms (JS ~60 µs) |
| Arranque del motor (release) | ~75–155 µs; las APIs globales (`fetch`, `URL`, ...) no cuestan nada hasta el primer uso, y luego ~90 µs |
| Hot reload | ~120 ms desde que se guarda un archivo hasta que la nueva versión está en ejecución; aplicar la actualización 0.2–0.5 ms |

## Linux (GTK 4)

Medido en un escritorio Linux (x86_64, 24 hilos, GPU NVIDIA), con builds release, la galería en una ventana de 1896 × 1030 en una
pantalla de 120 Hz, con cada lectura tomada automáticamente por `examples/gallery/tools/perf.py` (`nsh test --target linux --fps`,
una línea por segundo; la CPU corresponde al proceso completo, en porcentaje de un núcleo). *Frame p95* es el tiempo del hilo principal por frame dibujado
en el percentil 95: por debajo de 8.3 ms, un frame cabe en un refresco de 120 Hz.

<a id="animated-demos"></a>

### Demos animadas

<div class="data-table">

| Demo | FPS | Frame p95 | CPU |
|---|---|---|---|
| Stocks: 22 sparklines en vivo, un gráfico intradía, libro de órdenes, cinta | 117–120 | 5–6 ms | 25–29% (1200 × 800), 28–32% (1896 × 1030) |
| Stocks, con la ventana llenando una pantalla 4K de 144 Hz a 1.6× | 143–145 | 4.1–4.4 ms | 26–29% |
| Canvas: un indicador, un reloj, una matriz de puntos | 120 | 2.6–4.4 ms | 5–10% |
| Animations: tres bucles nativos, springs, secuencias | 120 | 2.0 ms | 12–13% |

</div>

<a id="every-page"></a>

### Todas las páginas

Todas las páginas de la galería, al abrirse y mientras la prueba hace scroll en ellas, en una ventana de 1200 × 800 en una pantalla de 144 Hz (la
misma máquina). NSH dibuja un frame solo cuando algo cambia en pantalla, así que *FPS* aquí es la tasa mientras algo
se mueve: un frame por cada intervalo mediano entre frames dibujados (`moving` de `perf.py`); a los 144 de la pantalla, cada frame de una
animación o de un scroll llega un refresco después del anterior. *Sobre un refresco* es la proporción de frames que tardaron más
que un refresco (6.9 ms). Los GIF y WebP de Images se reproducen a sus propias tasas de frames (unos 50 FPS aquí), igual que el video. Physics, Overlays y Menus son cortas: en 1200 × 800 un scroll llega a su final en pocos frames, por lo que se miden en una ventana de 900 × 500, donde tienen espacio para hacer scroll.

<div class="data-table">

| Página | Origen de los frames | FPS | Frame p95 | Sobre un refresco | CPU |
|---|---|---|---|---|---|
| Stocks | Datos en vivo, bucles nativos | 144 | 4.1 ms | 0% | 26% |
| Stocks, con scroll | Datos en vivo, scroll | 144 | 4.1 ms | 0% | 25% |
| Photos, con scroll | Scroll | 144 | 2.8 ms | 2% | 9% |
| Lists, con scroll | Scroll | 143 | 1.7 ms | 0% | 7% |
| Scrolling, con scroll | Scroll | 144 | 1.6 ms | 1% | 4% |
| Navigation, con scroll | Scroll | 143 | 1.7 ms | 0% | 2% |
| Form, con scroll | Scroll | 144 | 1.3 ms | 0% | 4% |
| Resizable, con scroll | Scroll | 143 | 0.6 ms | 0% | 1% |
| Dock, con scroll | Scroll | 142 | 0.5 ms | 1% | 1% |
| Gestures | Springs, un anillo pulsante | 144 | 1.6 ms | 0% | 1–5% |
| Physics, con scroll | Scroll (ventana de 900 × 500) | 144 | 1.6 ms | 1% | 1% |
| Animations | Bucles nativos | 144 | 2.6 ms | 0–1% | 5% |
| Canvas, con scroll | Scroll, bucles nativos | 144 | 4.2 ms | 0% | 1–4% |
| Styles, con scroll | Scroll | 144 | 2.3 ms | 2% | 3% |
| Tailwind | Utilidades `animate-*` | 144 | 1.7 ms | 0% | 3–8% |
| Text, con scroll | Scroll | 144 | 1.9 ms | 0% | 4% |
| Text View, con scroll | Scroll | 141 | 1.8 ms | 2% | 7% |
| Images, con scroll | Scroll, frames de GIF y WebP | 143 | 2.9 ms | 2% | 8% |
| Components, con scroll | Scroll | 144 | 1.4 ms | 0% | 3% |
| Overlays, con scroll | Scroll (ventana de 900 × 500) | 144 | 1.7 ms | 0% | 2% |
| Menus, con scroll | Scroll (ventana de 900 × 500) | 144 | 1.9 ms | 0% | 2% |
| Controls | Transiciones | 144 | 0.9 ms | 0% | 1–4% |
| Web and video | Frames de video, la página | 135–142 | 1.0 ms | 0% | 7–8% |

</div>

<a id="memory"></a>

### Memoria

En reposo, 3 s después del arranque (runners release, ventana de 480 × 640). *Private* es la memoria que posee únicamente el proceso (USS);
*resident* suma las páginas de las bibliotecas compartidas (GTK, el controlador de la GPU), que comparten todas las apps GTK de la máquina:

<div class="data-table">

| App | Renderer | Private (USS) | Resident (RSS) |
|---|---|---|---|
| App en Rust (`nsh init --template rust`) | GL (`ngl`) | ~49 MB | ~142 MB |
| App en Rust | Cairo (`GSK_RENDERER=cairo`) | ~28 MB | ~95 MB |
| Contador en TSX (`examples/counter`) | GL | ~79 MB | ~166 MB |
| Ventana GTK 4 con una etiqueta, como referencia | Vulkan / Cairo | ~62 / ~40 MB | ~132 / ~109 MB |

</div>

Volver a visitar una página no añade memoria; la primera visita a una página hace crecer el proceso por lo que almacena en caché a propósito (imágenes
decodificadas, con un límite de 128 MB) y por las bibliotecas que carga en el primer uso (WebKitGTK para las vistas web).

<a id="app-size"></a>

### Tamaño de la app

Una app hello world creada por `nsh init` con cada plantilla, y dos apps que la gente usa, tal como `nsh package --target linux`
las compila para x86_64. El runner es el único ejecutable de la app; el archive es el `.tar.gz` con el que se distribuye. Los hello
worlds se compilan con link-time optimization y se les quitan los símbolos (`CARGO_PROFILE_RELEASE_LTO=fat`,
`CARGO_PROFILE_RELEASE_CODEGEN_UNITS=1`, `CARGO_PROFILE_RELEASE_STRIP=true`):

<div class="data-table">

| App | Escrita en | Runner | Archive |
|---|---|---|---|
| Hello world (`--template rust`) | Rust | 16.5 MB | 7.5 MB |
| Hello world (`--template ts`) | TSX, sobre QuickJS | 25.7 MB | 11.6 MB |
| Hello world (`--template mixed`) | TSX y un crate de Rust | 25.8 MB | 11.7 MB |
| [sysmon](https://github.com/huacnlee/sysmon) 0.1.3 | Rust | 20.9 MB sin símbolos | 9.7 MB |
| [Omasend](https://github.com/huacnlee/omasend) 0.2.0 | Rust | 22.3 MB | 9.8 MB |

</div>

Los runners de TSX contienen el runtime de QuickJS, los módulos nativos y el renderer; el código propio de una app es su bundle, junto al
runner, de menos de 1 KB para un hello world.

Qué hace posibles estas cifras:

- **El renderer**: con el controlador de NVIDIA, NSH dibuja con el renderer GL de GSK, cuyos frames cuestan una fracción de los del renderer
  Vulkan en ese caso (la demo Animations: ~1 ms de dibujo por frame en lugar de ~9.5 ms). `GSK_RENDERER` sigue teniendo la última palabra.
- **Rasterizados del canvas**: cada canvas se rasteriza una vez en tiles de 256 px que se mantienen en la GPU. Un valor animado vuelve a dibujar solo
  el área que cubren las operaciones que lo leen, sobre los píxeles conservados de la parte estática del dibujo; un canvas fuera de la vista
  espera hasta que entra en pantalla con el scroll.
- **Paths reservados una sola vez**: `fillRect` y `fillText` después de un path largo lo dejan donde está hasta que se vuelve a usar (una
  línea de 400 puntos y luego 240 barras: 0.63 ms).

## macOS (AppKit)

Medido en un MacBook Pro (Apple M3, 24 GB) con su pantalla ProMotion integrada de 120 Hz, con builds release, la galería en
una ventana de 1200 × 800, con cada lectura tomada automáticamente por `examples/gallery/tools/perf.py` (`nsh test --target macos
--fps`, una línea por segundo; la CPU corresponde al proceso completo, en porcentaje de un núcleo, y la GPU a su parte de la GPU). Las fases son
las del hilo principal por frame: *tick* (las animaciones nativas del display link) y *canvas* (la reproducción de los dibujos).

<a id="animated-demos-1"></a>

### Demos animadas

<div class="data-table">

| Demo | FPS | Frame p95 | CPU | GPU |
|---|---|---|---|---|
| Stocks: 22 sparklines en vivo, un gráfico intradía, libro de órdenes, cinta | 120 | 2.7–3.7 ms | 33–36% | 18–22% |
| Canvas: un indicador, un reloj, una matriz de puntos | 119–120 | 0.6–0.7 ms | 4–7% | 0% |
| Animations: tres bucles nativos, springs, secuencias | 119–120 | 0.3–1.6 ms | 5–8% | 0% |

</div>

En Stocks, el tiempo del hilo principal por frame es de ~1.6 ms de ticks, de los cuales ~0.45 ms reproducen las partes animadas de los canvas;
Core Animation dibuja el resto de cada canvas en sus propios hilos.

<a id="every-page-1"></a>

### Todas las páginas

Todas las páginas de la galería, al abrirse y mientras la prueba hace scroll en ellas, en la misma ventana de 1200 × 800. Como en Linux, *FPS*
es la tasa mientras algo se mueve (un frame por cada intervalo mediano entre frames dibujados); a los 120 de la pantalla, cada frame
de una animación o de un scroll llega un refresco después del anterior. *Sobre un refresco* es la proporción de frames que tardaron
más que un refresco (8.3 ms). Una página en reposo no dibuja ningún frame y usa un 2–5% de CPU. Los GIF y WebP de Images se reproducen en Core
Animation y el video en AVFoundation, a sus propias tasas de frames.

<div class="data-table">

| Página | Origen de los frames | FPS | Frame p95 | Sobre un refresco | CPU |
|---|---|---|---|---|---|
| Stocks | Datos en vivo, bucles nativos | 120 | 3.2 ms | 0% | 35% |
| Stocks, con scroll | Datos en vivo, scroll | 120 | 3.5 ms | 0% | 36% |
| AI Chat, con scroll | Scroll | 120 | 2.4 ms | 1% | 5% |
| Photos, con scroll | Scroll | 120 | 1.4 ms | 0% | 10% |
| Lists, con scroll | Scroll | 120 | 1.6 ms | 0% | 8% |
| Scrolling, con scroll | Scroll | 120 | 2.7 ms | 0% | 6% |
| Navigation, con scroll | Scroll | 120 | 0.2 ms | 0% | 4% |
| Form, con scroll | Scroll | 120 | 0.6 ms | 0% | 5% |
| Resizable, con scroll | Scroll | 120 | 0.3 ms | 0% | 4% |
| Dock, con scroll | Scroll | 120 | 0.3 ms | 1% | 5% |
| Gestures | Springs, un anillo pulsante | 120 | 0.4 ms | 0% | 4% |
| Physics, con scroll | Scroll | 120 | 0.3 ms | 0% | 4% |
| Animations | Bucles nativos | 120 | 0.3 ms | 0% | 5% |
| Canvas, con scroll | Scroll, bucles nativos | 120 | 1.2 ms | 0% | 7% |
| Styles, con scroll | Scroll, una transformación oscilante | 120 | 1.0 ms | 0% | 6% |
| Tailwind | Utilidades `animate-*` | 120 | 0.5 ms | 0% | 4% |
| Text, con scroll | Scroll | 120 | 0.3 ms | 0% | 5% |
| Text View, con scroll | Scroll | 120 | 0.7 ms | 0% | 5% |
| Images, con scroll | Scroll | 120 | 0.4 ms | 0% | 5% |
| Components, con scroll | Scroll | 120 | 0.3 ms | 0% | 5% |
| Overlays, con scroll | Scroll | 120 | 0.3 ms | 0% | 4% |
| Menus, con scroll | Scroll | 120 | 0.3 ms | 0% | 5% |
| Controls | Transiciones | 120 | 0.3 ms | 0% | 4% |
| Web and video, con scroll | Scroll | 120 | 0.2 ms | 0% | 6% |
| System | `requestAnimationFrame`, temporizadores | 120 | 0.2 ms | 0% | 3% |
| Standard APIs, con scroll | Scroll | 120 | 0.3 ms | 0% | 5% |
| Storage, con scroll | Scroll | 120 | 0.3 ms | 0% | 5% |

</div>

<a id="memory-1"></a>

### Memoria

En reposo, 3 s después del arranque (runners release). *Footprint* es la memoria que macOS carga al proceso (lo que muestra el Monitor
de Actividad); *resident* suma las páginas de las bibliotecas compartidas del sistema:

<div class="data-table">

| App | Ventana | Footprint | Resident (RSS) |
|---|---|---|---|
| App en Rust (`nsh init --template rust`) | 1200 × 800 | ~19 MB | ~86 MB |
| Contador en TSX (`examples/counter`) | 1200 × 800 | ~20 MB | ~89 MB |
| Ventana AppKit con una etiqueta, como referencia | 480 × 640 | ~17 MB | ~80 MB |

</div>

A lo largo del recorrido por la galería, el proceso ocupa 84–230 MB hasta la página Canvas y ~350–360 MB a partir de la página Text View,
con lo que almacena en caché a propósito (imágenes decodificadas, con un límite de 128 MB; los documentos de la página Text View) y los
frameworks que carga en el primer uso (WebKit para las vistas web); los rasterizados de la página Canvas, de hasta ~310 MB con los tres
canvas en pantalla, se liberan cuando la página se cierra.
<a id="app-size-1"></a>

### Tamaño de la app

Las apps hello world que crea `nsh init` con cada plantilla, tal como las compila `nsh package --target macos` para Apple
silicon (arm64), con optimización en tiempo de enlazado y sin símbolos, como en Linux, y las dos apps anteriores tal como se distribuyen para Apple
silicon. El ejecutable es el runner dentro de `.app`; el zip es el `.app` comprimido (`ditto -c -k`):

<div class="data-table">

| App | Escrita en | Ejecutable | Zip `.app` |
|---|---|---|---|
| Hello world (`--template rust`) | Rust | 12.4 MB | 6.0 MB |
| Hello world (`--template ts`) | TSX, sobre QuickJS | 19.8 MB | 9.5 MB |
| Hello world (`--template mixed`) | TSX y un crate de Rust | 19.8 MB | 9.5 MB |
| [sysmon](https://github.com/huacnlee/sysmon) 0.1.3 | Rust | 21.6 MB | 8.4 MB (`.tar.gz` de su release) |
| [Omasend](https://github.com/huacnlee/omasend) 0.2.0 | Rust | 18.4 MB | 9.7 MB (`.tar.gz` de su release) |

</div>

Qué hace posibles estas cifras:

- **Fotogramas solo para los cambios**: el display link se activa mientras se ejecuta una animación nativa y se detiene con ella; una animación
  se detiene con su página (la eliminación de su vista termina sus fotogramas clave, un bucle se detiene en el `cleanup` de su componente).
- **Canvas dibujados donde cuestan menos**: un canvas que se pinta con frecuencia (una animación, datos en vivo) se dibuja en los hilos de Core
  Animation (`drawsAsynchronously`), lo que mantiene libre el hilo principal; uno que se redibuja de vez en cuando se dibuja
  de inmediato, sin la memoria gráfica que retiene el dibujo asíncrono. Un valor animado redibuja solo el área que cubren las
  operaciones que lo leen.
- **Partes estáticas del canvas conservadas**: cuando un dibujo permanece sin cambios, una parte larga anterior a su primera operación animada se
  conserva como una capa; cada fotograma dibuja esa capa y reproduce solo el resto animado, de inmediato en el hilo principal (el
  indicador, el reloj y la matriz de puntos de la página Canvas: sin trabajo de GPU y con la mitad de memoria).
- **Contenido dibujado cuando cambia**: los textos y los canvas se dibujan en capas propias, de nuevo cuando cambia su contenido o
  su tamaño, no cuando se mueven o se desplazan.

## Windows (Win32, Direct2D)

Medido en un equipo de escritorio con Windows 11 (Intel Core i7-13700KF, 32 GB, NVIDIA GeForce RTX 3060 Ti) con una pantalla 4K de 144 Hz al
150 %, compilaciones release, la galería en una ventana de 1200 × 800 (1800 × 1200 píxeles), con cada lectura tomada automáticamente por
`examples/gallery/tools/perf.py` (`nsh test --target windows --fps`, una línea por segundo; la CPU es la del proceso completo, en
porcentaje de un núcleo). Las fases son las del hilo principal por fotograma: *paint* (Direct2D dibujando la ventana) y, dentro
de ella, *canvas* (grabación y reproducción de dibujos).

<a id="animated-demos-2"></a>

### Demos animadas

<div class="data-table">

| Demo | FPS | Fotograma p95 | Paint / canvas por fotograma | CPU |
|---|---|---|---|---|
| Stocks: 22 sparklines en vivo, un gráfico intradía, libro de órdenes, cinta | 144 | 3.7–4.3 ms | 1.4 / 0.13 ms | 36–43% |
| Canvas: un indicador, un reloj, una matriz de puntos | 144 | 1.0–2.0 ms | 0.8–1.4 / 0.05 ms | 21–35% |
| Animations: tres bucles nativos, springs, secuencias | 144 | 1.0–3.6 ms | 0.9–1.9 ms | 20–41% |

</div>

Stocks confirma cambios entre 16 y 17 veces por segundo, cada uno en hasta 2.1 ms de JS y 1.7 ms del núcleo en el hilo del motor (p95).

> [!NOTE]
> Las páginas cuyas animaciones mueven vistas por áreas grandes consumen más CPU aquí que en Linux y macOS (Animations 20–41%
> frente a 5–13%, Gestures 36% frente a 1–5%). Un fotograma de Windows vuelve a dibujar, con Direct2D en el hilo principal, cada vista
> sobre las áreas que cambiaron: un anillo que crece redibuja la tarjeta que tiene debajo en cada fotograma. En macOS, Core Animation
> mueve, escala y atenúa en la GPU las capas que conserva sin volver a dibujarlas, y en Linux GSK conserva los
> render nodes de lo que no cambió. Además, las cifras incluyen 144 fotogramas por segundo a 1800 × 1200 píxeles.

<a id="every-page-2"></a>

### Todas las páginas

Todas las páginas de la galería, al abrirse y mientras la prueba se desplaza por ellas, en la misma ventana de 1200 × 800. Como en Linux y
macOS, *FPS* es la tasa mientras algo se mueve (un fotograma por cada intervalo mediano entre fotogramas dibujados); a los 144 de la pantalla,
cada fotograma de una animación o de un desplazamiento llega un refresco después del anterior. *Por encima de un refresco* es la proporción de fotogramas
que tardaron más que un refresco (6.9 ms). Una página en reposo no dibuja ningún fotograma y usa entre 0 y 2% de CPU. Los GIF y WebP de Images se reproducen
a sus propias tasas de fotogramas (unos 40 FPS aquí). Physics, Overlays, Menus y Storage se miden en una ventana de 900 × 500,
donde tienen espacio para desplazarse.

<div class="data-table">

| Página | Origen de los fotogramas | FPS | Fotograma p95 | Por encima de un refresco | CPU |
|---|---|---|---|---|---|
| Stocks | Datos en vivo, bucles nativos | 144 | 3.9 ms | 0% | 36% |
| Stocks, scrolling | Datos en vivo, desplazamiento | 144 | 4.3 ms | 0% | 43% |
| Photos, scrolling | Desplazamiento | 143 | 2.1 ms | 0% | 9% |
| Lists, scrolling | Desplazamiento | 144 | 2.0 ms | 1% | 19% |
| Scrolling, scrolling | Desplazamiento | 143 | 2.1 ms | 0% | 7% |
| Navigation, scrolling | Desplazamiento | 144 | 0.8 ms | 0% | 9% |
| Form, scrolling | Desplazamiento | 144 | 0.8 ms | 0% | 12% |
| Resizable, scrolling | Desplazamiento | 143 | 0.4 ms | 0% | 4% |
| Dock, scrolling | Desplazamiento | 144 | 0.5 ms | 1% | 5% |
| Gestures | Springs, un anillo que pulsa | 144 | 1.8 ms | 0% | 36% |
| Physics, scrolling | Desplazamiento (una ventana de 900 × 500) | 144 | 0.8 ms | 0% | 4% |
| Animations | Bucles nativos | 144 | 1.0 ms | 0% | 28% |
| Canvas, scrolling | Desplazamiento, bucles nativos | 144 | 2.0 ms | 0% | 35% |
| Styles, scrolling | Desplazamiento, una transformación oscilante | 144 | 2.1 ms | 0% | 39% |
| Tailwind | Utilidades `animate-*` | 144 | 0.6 ms | 0% | 19% |
| Text, scrolling | Desplazamiento | 144 | 1.6 ms | 0% | 8% |
| Text View, scrolling | Desplazamiento | 144 | 1.1 ms | 0% | 10% |
| Images, scrolling | Desplazamiento, fotogramas de GIF y WebP | 143 | 4.8 ms | 2% | 23% |
| Components, scrolling | Desplazamiento | 144 | 1.0 ms | 1% | 11% |
| Overlays, scrolling | Desplazamiento (una ventana de 900 × 500) | 144 | 0.6 ms | 0% | 1% |
| Menus, scrolling | Desplazamiento (una ventana de 900 × 500) | 144 | 0.6 ms | 0% | 2% |
| Controls | Transiciones | 117–144 | 1.5 ms | 0% | 22% |
| Web and video, scrolling | Desplazamiento | 144 | 1.6 ms | 0% | 15% |
| System | `requestAnimationFrame`, temporizadores | 144 | < 0.1 ms | 0% | 1% |
| Storage, scrolling | Desplazamiento (una ventana de 900 × 500) | 144 | 0.5 ms | 0% | 1% |

</div>

<a id="memory-2"></a>

### Memoria

En reposo, 3 s después del inicio (runners release, una ventana de 1200 × 800). El *conjunto de trabajo privado* es la memoria que usa el proceso
por sí solo (la columna Memoria del Administrador de tareas); los *bytes privados* son lo que tiene confirmado; el *conjunto de trabajo* añade las páginas de las
bibliotecas del sistema que comparte con otros procesos (Direct3D, Direct2D, DirectWrite, el controlador de la GPU):

<div class="data-table">

| App | Conjunto de trabajo privado | Bytes privados | Conjunto de trabajo |
|---|---|---|---|
| App de Rust (`nsh init --template rust`) | ~14 MB | ~60 MB | ~53–71 MB |
| Contador en TSX (`examples/counter`) | ~15 MB | ~61 MB | ~56–71 MB |

</div>

A lo largo del recorrido por la galería, el conjunto de trabajo es de ~108–115 MB en Stocks, ~230 MB desde la página Canvas, ~320–340 MB desde la
página Text View y ~390–405 MB una vez que Web and video ha abierto WebView2 (cuyas páginas se ejecutan en los procesos propios de WebView2),
incluyendo lo que se guarda en caché a propósito (imágenes decodificadas, limitadas a 128 MB; los documentos de la página Text View).

<a id="app-size-2"></a>

### Tamaño de la app

Las apps hello world que crea `nsh init` con cada plantilla, tal como las compila `nsh package --target windows` para x86_64
(los runners de Rust con optimización en tiempo de enlazado y sin símbolos, como en Linux). El ejecutable es el `<Name>.exe` de la app;
el zip es el `.zip` escrito junto a su directorio:

<div class="data-table">

| App | Escrita en | Ejecutable | Zip |
|---|---|---|---|
| Hello world (`--template rust`) | Rust | 15.0 MB | 6.7 MB |
| Hello world (`--template ts`) | TSX, sobre QuickJS | 28.6 MB | 12.4 MB |
| Hello world (`--template mixed`) | TSX y un crate de Rust | 26.3 MB | 11.5 MB |

</div>

Qué hace posibles estas cifras:

- **Fotogramas solo para los cambios, dibujados solo donde cambiaron**: el ticker sincronizado con el compositor se ejecuta mientras corre una animación
  nativa, una transición o un callback de fotograma. Un fotograma dibuja las áreas de las vistas que cambiaron (donde
  estaban y donde están), sobre los píxeles que conserva la ventana, y presenta solo esas al compositor (Stocks:
  ~34 vistas por fotograma).
- **Los canvas graban su parte animada**: un dibujo se graba como listas de comandos de Direct2D, vectoriales y nítidas a cualquier
  escala. Cuando cambia un valor animado, solo se vuelven a grabar las operaciones desde la primera que lee un valor animado en adelante;
  lo que viene antes se conserva (Stocks: ~26 ms de grabación por segundo para 22 sparklines que pulsan y el
  gráfico).
- **Solo se dibuja lo que se ve**: los hijos de una vista de desplazamiento o de una vista con recorte que quedan fuera de la vista se omiten en
  el fotograma, y las vistas sin contenido propio no dibujan más que su fondo y su borde.

## iOS (UIKit)

Medido en el simulador de iOS (un iPhone 18 Pro Max, en el MacBook Pro anterior), compilaciones release, con el mismo recorrido
(`perf.py --target ios`: `nsh test --target ios --fps`, los toques de un dedo tal como los recibe UIKit). El simulador presenta
a 60 Hz; en un iPhone con pantalla ProMotion, los display links de NSH se ejecutan a los 120 Hz de la pantalla (las apps que compila `nsh package`
y el host de desarrollo lo solicitan con `CADisableMinimumFrameDurationOnPhone`). Las fases son *tick* (animaciones
nativas), *drain* (aplicación de los lotes del motor) y *scroll* (lo que sigue a una vista de desplazamiento: listas, celdas fijas,
valores enlazados).

<div class="data-table">

| Página | Origen de los fotogramas | FPS | Fotograma p95 | CPU |
|---|---|---|---|---|
| Home, scrolling | Desplazamiento | 60 | 0.1 ms | 6% |
| Stocks | Datos en vivo, bucles nativos | 60 | 0.3 ms | 22% |
| Stocks, scrolling | Datos en vivo, desplazamiento | 60 | 0.3 ms | 25% |
| Photos, scrolling | Desplazamiento | 60 | 1.2 ms | 6% |
| Lists, scrolling | Desplazamiento | 60 | 1.1 ms | 8% |
| Scrolling, scrolling | Desplazamiento | 60 | 0.1 ms | 7% |
| Navigation, scrolling | Desplazamiento | 60 | 0.2 ms | 7% |
| Form, scrolling | Desplazamiento | 60 | 0.3 ms | 7% |
| Gestures | Springs, un anillo que pulsa | 60 | 0.3 ms | 3% |
| Animations | Bucles nativos | 60 | 0.7 ms | 6% |
| Canvas | Bucles nativos | 60 | 0.4 ms | 16% |
| Styles | Una transformación oscilante | 60 | 0.4 ms | 4% |
| Tailwind, scrolling | Desplazamiento | 60 | 0.2 ms | 7% |
| Text, scrolling | Desplazamiento | 60 | 0.1 ms | 7% |
| Text View, scrolling | Desplazamiento | 60 | 0.1 ms | 6% |
| Images, scrolling | Desplazamiento | 60 | 0.1 ms | 5% |
| Components, scrolling | Desplazamiento | 60 | 0.2 ms | 6% |
| Overlays, scrolling | Desplazamiento | 60 | 0.1 ms | 6% |
| Menus, scrolling | Desplazamiento | 60 | 0.2 ms | 7% |
| Controls, scrolling | Desplazamiento, transiciones | 60 | 0.2 ms | 5% |
| Web and video, scrolling | Desplazamiento | 60 | 0.1 ms | 8% |
| System | `requestAnimationFrame`, temporizadores | 60 | 0.3 ms | 4% |
| Standard APIs, scrolling | Desplazamiento | 60 | 0.1 ms | 7% |
| Storage, scrolling | Desplazamiento | 60 | 0.1 ms | 8% |

</div>

*FPS* es la tasa mientras algo se mueve, como arriba: a los 60 del simulador, cada fotograma llega un refresco después del
anterior. Toda página en la que nada se mueve no dibuja ningún fotograma y usa entre 1 y 2% de CPU en reposo. El proceso ocupa 40 MB en la
página de inicio de la galería y ~180 MB después de todo el recorrido (imágenes guardadas en caché a propósito, los documentos de la página Text View).

En un iPhone 17 Pro (ProMotion, 120 Hz), con el host de desarrollo y una demo en pantalla, las páginas animadas
dibujan en cada refresco:

<div class="data-table">

| Página | Origen de los fotogramas | FPS | Fotograma p95 | Por encima de un refresco | CPU | Memoria |
|---|---|---|---|---|---|---|
| Stocks | Datos en vivo, bucles nativos | 120 | 0.2–0.3 ms | 0% | 46–70% | 41–43 MB |
| Canvas | Bucles nativos | 120 | 0.1 ms | 0% | 25–36% | 37–38 MB |
| Animations | Bucles nativos | 120 | 0.2 ms | 0% | 3–11% | 37 MB |

</div>

Stocks confirma cambios 20 veces por segundo (un tick cada 50 ms), cada uno en 1.5 ms de JS y 1.4 ms del núcleo en el hilo del
motor (p95 de 2.2 y 2.0 ms), que está ocupado entre el 4 y el 6% del tiempo.

<a id="measuring-an-app"></a>

## Medir una app

Para medir una app de la misma manera, ejecuta sus pruebas o pasos con `--fps` y `-v` en `--target linux`, `macos`, `windows` o `ios`:

```sh
cargo build --release -p nsh-cli
python3 examples/gallery/tools/perf.py --target macos --only Stocks,Canvas   # the gallery, page by page
echo 'await app.wait(5000)' | nsh -v test App.tsx --target linux --fps        # any app
```
