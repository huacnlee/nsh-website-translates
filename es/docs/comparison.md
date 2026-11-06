---
title: "Comparación de enfoques"
description: "Cómo se compara Native Shell con React Native, Flutter, Qt, GPUI y Slint, con Electron y Tauri, y con las vistas web y la interfaz de usuario dirigida por el servidor para la UI entregada después del lanzamiento."
order: 2
group: start
source_hash: 80f11e255cf3463f
---


# Comparación de enfoques

NSH es un framework para apps completas en iOS, Android, macOS, Windows, Linux y la web, y un runtime para la UI que se entrega a las apps después de su publicación. Esta página lo compara primero con los frameworks multiplataforma en los que se escriben apps y después con las formas en que las apps incorporan UI que no incluyeron al publicarse. El verde significa que la capacidad está disponible, el amarillo que requiere más trabajo propio de la app o un proyecto aparte, y el rojo que no se ofrece; las marcas describen disponibilidad, no rendimiento. Las versiones son los mínimos documentados de cada framework en el momento de escribir esto: compruébalas para la versión que uses.

Leyenda: <span class="status status--yes" role="img" aria-label="Sí"></span> Sí · <span class="status status--partial" role="img" aria-label="Parcial"></span> Parcial · <span class="status status--no" role="img" aria-label="No"></span> No.

<a id="cross-platform-frameworks"></a>

## Frameworks multiplataforma

| Capacidad | NSH | React Native | Flutter | Qt 6 | GPUI | GPUI Fast | Slint |
|---|---|---|---|---|---|---|---|
| Dibujado por | UI de la plataforma | Vistas de la plataforma | Motor propio | Grafo de escena | Propio, GPU | Propio, GPU | Renderizador propio |
| Modelo de UI | Retenido | Retenido | Retenido | Retenido | Inmediato | Inmediato + retenido | Reactivo, retenido |
| Lenguaje | Rust, TSX | JS, TS | Dart | C++, QML | Rust | Rust | Slint + Rust, C++ |
| iOS | <span class="status status--yes" role="img" aria-label="Sí"></span> 15+ | <span class="status status--yes" role="img" aria-label="Sí"></span> 15.1+ | <span class="status status--yes" role="img" aria-label="Sí"></span> 15+ | <span class="status status--yes" role="img" aria-label="Sí"></span> 17+ | <span class="status status--no" role="img" aria-label="No"></span> | <span class="status status--no" role="img" aria-label="No"></span> | <span class="status status--partial" role="img" aria-label="Parcial"></span> Rust |
| Android | <span class="status status--yes" role="img" aria-label="Sí"></span> 9+ | <span class="status status--yes" role="img" aria-label="Sí"></span> 7+ | <span class="status status--yes" role="img" aria-label="Sí"></span> 7+ | <span class="status status--yes" role="img" aria-label="Sí"></span> 9+ | <span class="status status--no" role="img" aria-label="No"></span> | <span class="status status--no" role="img" aria-label="No"></span> | <span class="status status--yes" role="img" aria-label="Sí"></span> |
| macOS | <span class="status status--yes" role="img" aria-label="Sí"></span> 14+ | <span class="status status--partial" role="img" aria-label="Parcial"></span> Aparte | <span class="status status--yes" role="img" aria-label="Sí"></span> 12+ | <span class="status status--yes" role="img" aria-label="Sí"></span> 13+ | <span class="status status--yes" role="img" aria-label="Sí"></span> 12+ | <span class="status status--yes" role="img" aria-label="Sí"></span> 12+ | <span class="status status--yes" role="img" aria-label="Sí"></span> 13+ |
| Windows | <span class="status status--yes" role="img" aria-label="Sí"></span> 10 1809+ | <span class="status status--partial" role="img" aria-label="Parcial"></span> Aparte | <span class="status status--yes" role="img" aria-label="Sí"></span> 10+ | <span class="status status--yes" role="img" aria-label="Sí"></span> 10 1809+ | <span class="status status--yes" role="img" aria-label="Sí"></span> 10+ | <span class="status status--yes" role="img" aria-label="Sí"></span> 10+ | <span class="status status--yes" role="img" aria-label="Sí"></span> 10+ |
| Linux | <span class="status status--yes" role="img" aria-label="Sí"></span> GTK 4.14+ | <span class="status status--no" role="img" aria-label="No"></span> | <span class="status status--yes" role="img" aria-label="Sí"></span> Debian 10+ | <span class="status status--yes" role="img" aria-label="Sí"></span> Debian 11+ | <span class="status status--yes" role="img" aria-label="Sí"></span> Vulkan | <span class="status status--yes" role="img" aria-label="Sí"></span> Vulkan | <span class="status status--yes" role="img" aria-label="Sí"></span> |
| Web | <span class="status status--yes" role="img" aria-label="Sí"></span> HTML | <span class="status status--partial" role="img" aria-label="Parcial"></span> Biblioteca | <span class="status status--yes" role="img" aria-label="Sí"></span> Canvas | <span class="status status--yes" role="img" aria-label="Sí"></span> Canvas | <span class="status status--no" role="img" aria-label="No"></span> | <span class="status status--no" role="img" aria-label="No"></span> | <span class="status status--yes" role="img" aria-label="Sí"></span> Canvas |
| Texto del sistema | <span class="status status--yes" role="img" aria-label="Sí"></span> | <span class="status status--yes" role="img" aria-label="Sí"></span> | <span class="status status--partial" role="img" aria-label="Parcial"></span> | <span class="status status--partial" role="img" aria-label="Parcial"></span> | <span class="status status--partial" role="img" aria-label="Parcial"></span> | <span class="status status--partial" role="img" aria-label="Parcial"></span> | <span class="status status--partial" role="img" aria-label="Parcial"></span> |
| UX por dispositivo | <span class="status status--yes" role="img" aria-label="Sí"></span> | <span class="status status--partial" role="img" aria-label="Parcial"></span> | <span class="status status--partial" role="img" aria-label="Parcial"></span> | <span class="status status--partial" role="img" aria-label="Parcial"></span> | <span class="status status--no" role="img" aria-label="No"></span> | <span class="status status--no" role="img" aria-label="No"></span> | <span class="status status--partial" role="img" aria-label="Parcial"></span> |
| Sin runtime de JS | <span class="status status--yes" role="img" aria-label="Sí"></span> Apps en Rust | <span class="status status--no" role="img" aria-label="No"></span> | <span class="status status--yes" role="img" aria-label="Sí"></span> | <span class="status status--partial" role="img" aria-label="Parcial"></span> C++ | <span class="status status--yes" role="img" aria-label="Sí"></span> | <span class="status status--yes" role="img" aria-label="Sí"></span> | <span class="status status--yes" role="img" aria-label="Sí"></span> |
| Entrega firmada | <span class="status status--yes" role="img" aria-label="Sí"></span> | <span class="status status--partial" role="img" aria-label="Parcial"></span> OTA | <span class="status status--no" role="img" aria-label="No"></span> | <span class="status status--partial" role="img" aria-label="Parcial"></span> QML | <span class="status status--partial" role="img" aria-label="Parcial"></span> Shell | <span class="status status--partial" role="img" aria-label="Parcial"></span> Shell | <span class="status status--no" role="img" aria-label="No"></span> |
| Licencia | Apache-2.0 | MIT | BSD-3-Clause | LGPL, GPL, comercial | Apache-2.0 | Apache-2.0 | GPL, comercial |

El modo inmediato vuelve a construir la descripción de la UI en cada fotograma; el modo retenido la conserva y actualiza solo lo que cambió. GPUI Fast combina ambos sobre GPUI y funciona donde funciona GPUI. "Shell" es [GPUI Shell](https://gpui-kit.com/shell).

NSH es el único framework de esta lista que reúne todo esto: la UI y la entrada de texto propias de cada plataforma, móviles, escritorio y web desde una sola app (la web como HTML), apps en Rust sin runtime de JavaScript, y UI firmada y aislada en un sandbox que se entrega después de la publicación.

<a id="what-the-rows-mean"></a>

### Qué significan las filas

- **Dibujado por, modelo de UI.** NSH monta las vistas propias de cada plataforma y las conserva (modo retenido): un cambio actualiza solo las vistas que tocó. React Native también monta vistas de la plataforma, en iOS y Android. Flutter, Qt Quick, GPUI y Slint dibujan con sus propios renderizadores; GPUI construye el árbol de elementos en cada fotograma (modo inmediato), y [GPUI Fast](https://github.com/longbridge/gpui-fast) reutiliza lo que no cambió.
- **Plataformas.** Los mínimos de NSH son propios ([Platforms](./platforms.md)). Los demás provienen de [React Native 0.76](https://reactnative.dev/blog/2024/10/23/release-0.76-new-architecture) (iOS 15.1, Android 7 / API 24; macOS y Windows mediante los proyectos separados react-native-macos y react-native-windows, la web mediante la biblioteca react-native-web), [Flutter 3.47](https://docs.flutter.dev/reference/supported-platforms), [Qt 6.10](https://doc.qt.io/qt-6.10/supported-platforms.html), los [requisitos de Zed](https://zed.dev/docs/installation) para GPUI y las [guías de plataforma de Slint](https://docs.slint.dev/latest/docs/slint/guide/platforms/mobile/general/) (iOS desde Rust). "Canvas" significa que el framework dibuja en un canvas dentro de la página; las apps web de NSH son elementos HTML con estilos CSS, que el navegador desplaza, selecciona y edita ([Web](./web.md)).
- **Texto del sistema.** Los campos de texto de NSH son los editores de la plataforma (`UITextView`, `EditText`, `NSTextView`, `TextView` de GTK, los del navegador), con los métodos de entrada, los controles de selección y los menús de edición del sistema; en Windows, el editor propio de NSH funciona con DirectWrite y los métodos de entrada del sistema (IMM32). React Native también usa las entradas de texto de la plataforma. Los frameworks que dibujan su propia UI implementan la edición de texto por su cuenta y la conectan con los métodos de entrada del sistema.
- **UX por dispositivo.** Los componentes base de NSH se adaptan al dispositivo: el mismo `Menu` es una ventana emergente junto a su disparador con un puntero y una hoja desde la parte inferior en un teléfono, y un `ContextMenu` se abre con un clic derecho o con un dedo mantenido. En los demás, adaptar la interacción a cada dispositivo es en su mayor parte trabajo de la propia app.
- **Sin runtime de JS.** Los runners de una app en Rust no enlazan ningún motor de JavaScript en ninguna plataforma; TSX es la segunda vía, sobre el mismo motor. El QML de Qt Quick se ejecuta en el motor de JavaScript de Qt; Qt Widgets en C++ no.
- **Entrega firmada.** NSH verifica los paquetes `.nshpkg` firmados con las claves en las que confía y una lista de revocación, y ejecuta cada uno en una VM con los límites y las capacidades que concede el host ([Signed packages](./signed-packages.md), [Sandbox and capabilities](./sandbox-and-capabilities.md)). Las actualizaciones por aire de React Native distribuyen código de app de confianza; Qt puede cargar archivos QML; las apps de GPUI incorporan módulos de JavaScript mediante [GPUI Shell](https://gpui-kit.com/shell).

<a id="what-sets-nsh-apart"></a>

### Qué distingue a NSH

- **Nativo en cada plataforma, en ambos sentidos.** Cada backend se apoya en las vistas, el texto y los métodos de entrada propios de su plataforma (UIKit, vistas de Android, AppKit, Win32 con Direct2D, GTK 4, HTML), y con ellos viene la interacción de cada plataforma. La selección de texto, los métodos de entrada y la accesibilidad son los del sistema, y lo que una nueva versión del sistema operativo aporte a estos llega a la app ([Introduction](./index.md#what-native-means)).
- **Móviles, escritorio y web desde una sola app.** Seis plataformas son backends de un mismo framework, con diseños que se adaptan y una entrada que sigue al dispositivo; en la web, la app es HTML, publicada como sitio estático.
- **Rust primero, sin runtime de JavaScript.** Una app completa puede ser Rust de principio a fin, compilada a código nativo con los tipos, los hilos y los crates de Rust. TSX es la segunda vía, sobre el mismo motor, para pantallas escritas con rapidez ([Building with Rust](./rust.md)).
- **Vistas retenidas para apps cotidianas.** Los chats, los formularios, las listas y los documentos permanecen casi inactivos en reposo, porque un cambio envía solo las vistas que tocó ([Introduction](./index.md#retained-views)).
- **UI entregada después de la publicación, firmada y aislada en un sandbox.** Las apps creadas con NSH, y las apps nativas escritas con las herramientas propias de cada plataforma, incorporan módulos TSX en tiempo de ejecución, escritos por un equipo o generados por IA ([Dynamic UI](./index.md#dynamic-ui-and-ai-generated-ui)).
- **Una sola cadena de herramientas, para personas y agentes.** Un único ejecutable `nsh` crea, ejecuta, prueba en plataformas reales, empaqueta y firma apps para todos los destinos.

### React Native

React Native es el más cercano en intención: ambos reducen el trabajo duplicado de los clientes y usan las vistas de la plataforma. El centro de React Native es JavaScript o TypeScript con React y su ecosistema de paquetes, en iOS y Android, con soporte de escritorio en proyectos separados. El centro de NSH es Rust: su runtime, su renderizador y sus módulos son Rust, Rust es un lenguaje de apps por derecho propio y TSX es una vía entre dos; sus seis plataformas, incluidos los escritorios y la web, son backends del mismo framework.

### Flutter

Flutter dibuja cada píxel con su propio motor, de modo que una app se ve igual en todas las plataformas. NSH toma el otro camino: las vistas, el texto y la entrada de texto de cada plataforma y, en la web, elementos HTML con el desplazamiento, la selección y la entrada propios del navegador. La edición de texto, los métodos de entrada y la selección son los de la plataforma, en lugar de reimplementarse para cada una.
### Qt

Qt es un toolkit maduro con dos tecnologías de UI, Qt Widgets y Qt Quick, y con herramientas y soporte de plataformas de larga trayectoria. NSH se diferencia en su base y en su modelo: Rust como lenguaje principal con una vía TSX, una toolchain diseñada para el desarrollo automatizado (e impulsado por IA), la web renderizada como HTML, y la interacción móvil, de escritorio y web adaptada dentro de un único modelo de componentes.

<a id="gpui-and-gpui-fast"></a>

### GPUI y GPUI Fast

[GPUI](https://gpui-kit.com) es un framework de UI en Rust que dibuja con la GPU, creado para apps de escritorio exigentes; [GPUI Fast](https://github.com/longbridge/gpui-fast) es el fork de Longbridge con renderizado retenido (reutiliza las vistas, el layout y las mediciones de texto que no cambian), capas de scroll y composición nativa de ventanas. NSH, en cambio, se construye sobre las vistas de cada plataforma, de modo que la entrada de texto, la selección, los métodos de entrada y la interacción con el sistema son los propios de la plataforma, y además cubre teléfonos y la web; el backend GPUI de NSH incrusta apps de NSH en apps de GPUI y GPUI Kit ([GPUI](./gpui.md)).

Ambos se adaptan a cargas distintas. En el [benchmark de rendimiento de NSH](https://github.com/longbridge/nsh-perf-bench) (Linux, una tabla de cotizaciones de 500 filas, NSH con su backend GTK 4), las cargas cotidianas cuestan lo mismo: con 1000 cotizaciones por segundo, NSH Rust usa el 18 % de un núcleo y GPUI Fast el 20 %. Con actualizaciones densas y sostenidas, GPUI Fast va por delante: con 20 000 cotizaciones por segundo usa el 25 % de un núcleo frente al 73–78 % de NSH, y la animación fotograma a fotograma de 1000 cajas le cuesta aproximadamente un tercio de la CPU de NSH.

### Slint

Slint es un toolkit de UI declarativo con su propio lenguaje y renderizadores ligeros, para escritorio y dispositivos embebidos, que se usa desde Rust, C++, JavaScript o Python. Ambos valoran el rendimiento nativo; el camino de NSH es la UI y la interacción propias de cada plataforma, HTML en la web, Rust y TSX como lenguajes de las apps, y desarrollo impulsado por IA en seis plataformas.

<a id="electron-and-tauri"></a>

### Electron y Tauri

Electron empaqueta Chromium y Tauri usa la vista web del sistema: ambos crean apps de escritorio (y, con Tauri, apps móviles) a partir de contenido web, con el texto y la entrada del navegador. NSH, en cambio, construye las vistas propias de cada plataforma y renderiza HTML únicamente en la propia web.

<a id="ui-delivered-after-release"></a>

## UI entregada después del lanzamiento

Una app que quiere UI que no incluía al publicarse (respuestas generadas por un modelo, funciones de socios u otros equipos, pantallas que cambian sin una nueva versión) dispone de un puñado de opciones consolidadas, tanto en teléfonos como en escritorio. Se diferencian en qué dibuja la UI, qué puede hacer el código entregado y cuánto tiene que cambiar la app para alojarlas.

| Capacidad | NSH | Vista web | UI dirigida por el servidor | Miniprogramas | Actualizaciones OTA |
|---|---|---|---|---|---|
| Dibujada por | UI de la plataforma | Motor del navegador | Las vistas de la app | Motor web + capa | Renderizador del framework |
| Aspecto y comportamiento nativos | <span class="status status--yes" role="img" aria-label="Sí"></span> | <span class="status status--no" role="img" aria-label="No"></span> | <span class="status status--yes" role="img" aria-label="Sí"></span> | <span class="status status--partial" role="img" aria-label="Parcial"></span> | <span class="status status--yes" role="img" aria-label="Sí"></span> |
| Estado, lógica y layout propios | <span class="status status--yes" role="img" aria-label="Sí"></span> | <span class="status status--yes" role="img" aria-label="Sí"></span> | <span class="status status--no" role="img" aria-label="No"></span> | <span class="status status--yes" role="img" aria-label="Sí"></span> | <span class="status status--yes" role="img" aria-label="Sí"></span> |
| Componentes nativos del host | <span class="status status--yes" role="img" aria-label="Sí"></span> | <span class="status status--partial" role="img" aria-label="Parcial"></span> Bridge | <span class="status status--yes" role="img" aria-label="Sí"></span> | <span class="status status--partial" role="img" aria-label="Parcial"></span> | <span class="status status--yes" role="img" aria-label="Sí"></span> |
| Sandbox configurado por el host | <span class="status status--yes" role="img" aria-label="Sí"></span> | <span class="status status--partial" role="img" aria-label="Parcial"></span> Same-origin | <span class="status status--yes" role="img" aria-label="Sí"></span> Esquema | <span class="status status--yes" role="img" aria-label="Sí"></span> | <span class="status status--no" role="img" aria-label="No"></span> |
| Paquetes firmados y revocables | <span class="status status--yes" role="img" aria-label="Sí"></span> | <span class="status status--no" role="img" aria-label="No"></span> | <span class="status status--no" role="img" aria-label="No"></span> | <span class="status status--partial" role="img" aria-label="Parcial"></span> | <span class="status status--partial" role="img" aria-label="Parcial"></span> |
| Idónea para UI generada por IA | <span class="status status--yes" role="img" aria-label="Sí"></span> | <span class="status status--partial" role="img" aria-label="Parcial"></span> Páginas web | <span class="status status--partial" role="img" aria-label="Parcial"></span> | <span class="status status--partial" role="img" aria-label="Parcial"></span> | <span class="status status--no" role="img" aria-label="No"></span> |
| Coste para la app host | Una vista y una biblioteca | Un motor de navegador por vista | Un renderizador por componente | Un SDK contenedor | Toda la app en el framework |

- **Vista web (H5).** Una página en un motor de navegador: todo lo que HTML puede expresar, con el aspecto del navegador y un bridge escrito a mano hacia el código nativo.
- **UI dirigida por el servidor.** JSON que recombina los componentes y las acciones que la app ya incluye: fácil de generar, sin estado ni lógica locales más allá de lo que ofrece el esquema.
- **Contenedores de miniprogramas.** Un framework y una API específicos de la plataforma sobre un motor web, dentro de un SDK contenedor de gran tamaño.
- **Actualizaciones over-the-air** (por ejemplo, React Native con un servicio de code-push). El framework completo, pero las actualizaciones son código de app de confianza, y la app tiene que estar escrita en ese framework.
- **NSH.** Un módulo TSX con su propio estado, lógica, animación y layout, renderizado con la UI propia de la plataforma, que puede usar las vistas nativas registradas por el host. Llega como un paquete firmado que la app verifica, se ejecuta en su propia VM con límites de memoria, de tiempo de llamada y de nodos, y solo accede a los hosts de red, las páginas web y los ajustes del sistema que el host le concede ([Sandbox y capacidades](./sandbox-and-capabilities.md)). El host añade una vista en la que aparece el módulo ([Plataformas](./platforms.md#embed-in-a-native-app)), y el mismo bundle se ejecuta en todas las plataformas. Esta es la razón por la que NSH existe junto a [GPUI Shell](./index.md#native-shell-and-gpui-shell).

<a id="when-another-option-fits-better"></a>

## Cuándo encaja mejor otra opción

- La pantalla está dominada por actualizaciones densas y sostenidas de miles de vistas, como un terminal de datos de mercado que recibe decenas de miles de cotizaciones por segundo o una visualización personalizada redibujada en cada fotograma: el renderizado retenido en GPU de GPUI Fast usa una fracción de la CPU (consulta [GPUI y GPUI Fast](#gpui-and-gpui-fast)).
- La app debe verse idéntica al píxel en todas las plataformas: un framework que lo dibuja todo por sí mismo, como Flutter o Slint, lo ofrece por diseño.
- Necesitas hoy un gran ecosistema de paquetes de terceros: React Native, Flutter y Qt tienen años de ventaja.
- La UI es un documento o una página web existente: una vista web lo muestra tal cual.
- El conjunto de pantallas es fijo y reducido, y solo cambian el contenido y el orden: la UI dirigida por el servidor no necesita ningún runtime.

<a id="see-also"></a>

## Véase también

- [Introducción](./index.md): qué es NSH y qué significa nativo en él.
- [Arquitectura](./architecture.md): qué se ejecuta dónde dentro de NSH.
- [Rendimiento](./performance.md): las reglas que sigue NSH y cómo medir una app.
