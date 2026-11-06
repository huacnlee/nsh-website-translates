---
title: "Sandbox y capacidades"
description: "Los límites bajo los que se ejecuta cada app de NSH (memoria, tiempo, nodos), el endurecimiento del lenguaje en las compilaciones de release, y las capacidades declaradas en nsh.json y concedidas por las apps host."
order: 21
group: delivery
source_hash: 4659e6a8ee8e724e
---


# Sandbox y capacidades

Una app escrita en Rust es código nativo compilado dentro de la app que la distribuye, igual que el resto de esa app, y se ejecuta con su nivel de confianza; sus llamadas a los servicios de NSH (`fetch`, imágenes, web views, la barra de estado) pasan por las mismas comprobaciones nativas que las de TSX, dentro de lo que conceda el host. El TSX y el JavaScript que ejecuta una app, ya sean propios o de un [paquete firmado](./signed-packages.md) que descarga, se ejecutan en una VM QuickJS por vista, y todo lo que pueden hacer fuera de esa VM pasa por el runtime nativo de NSH. Esto permite ejecutar código que no escribiste, como mini apps de terceros o actualizaciones descargadas, bajo reglas que controla la app host:

- Los **límites** acotan la memoria, el tiempo y los recursos nativos que puede usar una app.
- El **endurecimiento** elimina, en las compilaciones de release, las formas de convertir cadenas en código.
- Las **capacidades** enumeran a qué puede acceder una app: desde qué hosts puede hacer fetch, qué páginas puede mostrar una web view, si puede cambiar la barra de estado. La app las declara; una app host puede conceder menos.

Un bundle contiene solo el código de la app: el grafo reactivo, el renderizador y cada módulo que la app importa son nativos. Por eso nada en JS es de confianza y cada límite y cada comprobación se aplican en Rust; no hay código JS que una app pueda modificar para eludirlos.

<a id="limits"></a>

## Límites

Los límites acotan una VM: se aplican a TSX y JavaScript. Una app incrustada en otra app se ejecuta dentro de los límites que decide su app host. Una app independiente (empaquetada con `nsh package`, incluida la web, o ejecutada con `nsh run`) es tu propio código, igual que una app nativa: usa la memoria y el tiempo que le da el dispositivo, y su pila del intérprete de 4096 KB convierte la recursión profunda en un `RangeError` que la app puede capturar.

Una app incrustada tiene estos límites:

| Límite | Valor por defecto | Cuando se alcanza |
|---|---|---|
| Heap de JS | 256 MB | La VM se detiene. |
| Pila del intérprete | 4096 KB (también el máximo) | La recursión profunda lanza un `RangeError`, que la app puede capturar. |
| Tiempo para evaluar el bundle | 10 s | La evaluación se interrumpe. |
| Tiempo de cualquier otra llamada a JS | 2 s | La llamada se interrumpe; la app continúa. |
| Nodos conservados | 200 000 | La VM se detiene. |
| Cambios a la vez (operaciones en cola) | 8 000 000 de valores | La VM se detiene. |
| Operaciones en un dibujo de canvas | 1 000 000 | La VM se detiene. |

**El tiempo se presupuesta por llamada, no por app.** Una "llamada" es una cosa que el runtime le pide hacer a JS: gestionar un evento (incluido el renderizado que provoca), enlazar una fila de lista, ejecutar un temporizador, ejecutar los callbacks de `requestAnimationFrame` de un fotograma, vaciar la cola de microtareas. Una app de larga ejecución nunca acumula tiempo hacia un límite; solo se interrumpe una única llamada que no retorna a tiempo. Las llamadas anidadas dentro de otra comparten el presupuesto de la llamada exterior.

Una llamada interrumpida termina con una excepción que ningún `catch` puede tragarse, y el error se informa junto con el presupuesto que superó:

```text
the script was interrupted: a call into JS exceeded its budget of 2000 ms
```

La VM sigue funcionando: el siguiente evento, temporizador o fotograma se ejecuta con normalidad.

**Quedarse sin memoria o superar una cuota detiene la VM.** El error se informa una sola vez (al gestor de errores de la app host y, en las compilaciones de desarrollo, sobre la app), no se ejecuta más JS después y las vistas se quedan como estaban. Las cuotas de nodos y de operaciones existen porque las vistas nativas y los cambios en cola viven en memoria nativa, que el límite del heap de JS no cubre: sin ellas, una app podría agotar la memoria del dispositivo a través de la UI.

> [!TIP]
> Estos límites son generosos para las apps normales. Si alcanzas el presupuesto de 2 s por llamada, el trabajo es demasiado largo para un solo evento de todos modos: congelaría las actualizaciones de la app durante ese tiempo. Divídelo con `setTimeout` o sácalo del gestor de eventos.

Las apps host establecen los límites por vista: `NshAppView.limits` en [iOS](./ios.md#limits), `NshView.setLimits` en [Android](./android.md#limits), `AppOptions::limits` / `AppView::set_limits` en una [app GPUI](./gpui.md#embedding-in-a-gpui-app). Se aplican a partir de la siguiente carga.

Para ver en desarrollo qué hace una app TSX dentro de los límites de una app host, ejecútala con [`--limits`](./cli.md#nsh-run): `nsh run App.tsx --limits` usa los valores por defecto de arriba, y `nsh run --limits memory=128MB,call=500ms` establece esos dos como lo haría una app host, y el resto conserva sus valores por defecto.

<a id="hardening"></a>

## Endurecimiento

Las compilaciones de release (todo lo que no se carga desde un servidor de desarrollo) se endurecen al cargarse:

- `eval` se elimina, y los constructores `Function`, `AsyncFunction`, `GeneratorFunction` y `AsyncGeneratorFunction` lanzan una excepción. NSH no ejecuta código creado a partir de cadenas:

  ```text
  TypeError: the Function constructor is disabled: nsh runs no code from strings (development builds allow it)
  ```

- Los prototipos que comparten todos los módulos (`Object`, `Array`, `Function`, `String`, `Number`, `Promise`, `Map`, los typed arrays y el resto) están congelados, de modo que un módulo (o una biblioteca) no pueda cambiar `Array.prototype` para todos los demás. `Error.prototype` sigue siendo escribible, para que las subclases de error puedan establecer `this.name`.

Congelar los prototipos normalmente rompería un patrón común, el "override mistake": asignar `Sub.prototype.constructor = Sub` o `obj.toString = …` lanza una excepción cuando la propiedad heredada está congelada. NSH convierte los miembros que se sobrescriben con más frecuencia (`constructor`, `toString`, `valueOf`, `toJSON`, ...) en accessors cuyo setter define la propiedad en el objeto al que se asigna, de modo que ese código (y bibliotecas como axios que lo usan) sigue funcionando.

Los bundles servidos por `nsh dev` / `nsh run` (con o sin `--release`) no se endurecen, así que puedes depurar con `eval`. Prueba el comportamiento de release con `nsh test` (que endurece) o con una compilación empaquetada antes de publicar código que dependa de código dinámico.

<a id="capabilities"></a>

## Capacidades

Una app declara a qué puede acceder fuera de su VM en `nsh.json`:

```json
{
  "name": "Quotes",
  "id": "com.example.quotes",
  "version": "1.0.0",
  "build": 3,
  "capabilities": {
    "network": {
      "hosts": ["api.example.com", "*.cdn.example.com"],
      "http": [{ "host": "quotes.example.com", "methods": ["GET"], "pathPrefix": "/v1/" }],
      "sockets": ["feed.example.com:7000"]
    },
    "webview": { "hosts": ["*.example.com"], "input": true },
    "statusBar": true,
    "clipboard": true,
    "picker": true,
    "speech": true,
    "host": ["getUserInfo", "bridge.*"],
    "openUrl": { "schemes": ["https", "mailto"] }
  }
}
```

**Una app sin `"capabilities"` puede hacerlo todo**: una app independiente es del propio desarrollador y no se restringe nada. Los sockets TCP sin procesar se conceden por nombre en cada app, mediante `network.sockets`, y las funciones del host mediante `host`. **Una app con `"capabilities"` solo puede hacer lo que enumera**: todo lo demás se deniega. Las claves desconocidas son errores de compilación, de modo que un error tipográfico se detecta al compilar en lugar de convertirse en un permiso ausente en tiempo de ejecución. Un [paquete firmado](./signed-packages.md#packages-from-newer-versions-of-nsh) de un NSH más reciente puede declarar capacidades que un runtime más antiguo no conoce: allí no se conceden.

### `network`

Cubre `fetch` (incluida cada redirección), WebSockets, imágenes remotas (`<Image>`, `placeholder`, imágenes de canvas, `Image.getSize` / `Image.prefetch`), fuentes de vídeo y sockets TCP sin procesar (`net.connect`).

| Clave | Tipo | Descripción |
|---|---|---|
| `hosts` | `string[]` | Hosts a los que la app puede acceder con cualquier método y esquema (`http`, `https`, `ws`, `wss`). |
| `http` | `object[]` | Concesiones más precisas: un host, acotado por cualquiera de las claves siguientes. |
| `http[].host` | `string` | El host o patrón de host (obligatorio). |
| `http[].methods` | `string[]` | Métodos permitidos, como `["GET", "HEAD"]`. Si falta: cualquiera. |
| `http[].schemes` | `string[]` | Esquemas permitidos (`scheme`: uno, como cadena). Si falta: cualquiera de `http`, `https`, `ws`, `wss`. |
| `http[].port` | `number` | El puerto; una URL sin puerto tiene el predeterminado de su esquema (443 para `https`). Si falta: cualquiera. |
| `http[].paths` | `string[]` | Rutas exactas, como `["/v1/quote"]` (la query no forma parte de la ruta). |
| `http[].pathPrefixes` | `string[]` | Prefijos de ruta que cubren segmentos completos: `/v1` cubre `/v1` y `/v1/quote`, `/v1/` lo que lo sigue. `pathPrefix` (uno, como cadena) y `path_prefixes` se leen igual. |
| `sockets` | `string[]` | Destinos TCP sin procesar para [`net.connect`](../modules/standard-modules.md), cada uno un `"host:port"` exacto (`"[::1]:9000"` para IPv6). |

Una regla `http` cubre todas las rutas cuando no enumera `paths` ni `pathPrefixes`, y, con ambos, una ruta que coincida con cualquiera de los dos.

Los patrones de host son `*` (cualquier host), `*.example.com` (cualquier subdominio de `example.com`, pero no `example.com` en sí) o un nombre de host exacto. La comparación ignora mayúsculas y minúsculas y el puerto. El host se toma después del último `@`, de modo que `https://api.example.com@evil.io/` se comprueba como `evil.io`.

Un handshake de WebSocket es un GET HTTP: `ws://` se comprueba como `http://` y `wss://` como `https://`, así que las concesiones de hosts y de `http` que permiten un GET de la URL permiten el WebSocket. Un socket sin procesar llega más allá de cualquier regla HTTP, así que `sockets` enumera cada host y puerto exactamente, y solo `sockets` los concede.

Los URI `asset:` (los archivos propios de la app) siempre están permitidos; las imágenes y los vídeos también pueden usar URI `data:` y rutas relativas.

### `webview`

| Clave | Tipo | Descripción |
|---|---|---|
| `hosts` | `string[]` | Hosts que una [web view](./web-view-and-video.md) puede mostrar y a los que puede navegar (`http` y `https`). Sin `webview`, la app no puede mostrar páginas web en absoluto. |
| `input` | `boolean` | El ref de una web view puede dar a su página entrada de confianza ([`sendInput`](./web-view-and-video.md#input-as-the-users-own)). Nunca se concede salvo que se declare, tampoco en una app sin `"capabilities"`. |

Las navegaciones de nivel superior dentro de la web view también se comprueban, mediante el delegado de navegación de la plataforma, antes de cargarse. Los subrecursos de la propia página (sus scripts, imágenes, XHR) son asunto del contenido web y no se comprueban. `about:blank` y el HTML en línea (`html`) solo necesitan que se concedan las web views: `"webview": { "hosts": [] }` los permite sin permitir ninguna página remota.

`input` es independiente de `hosts` porque la entrada de confianza lleva activación del usuario, que `injectJavaScript` nunca obtiene: la página entonces puede abrir ventanas, escribir en el portapapeles, abrir el panel de archivos del sistema, iniciar WebAuthn o solicitudes de permisos y pulsar cualquier botón que compruebe `isTrusted`. Sin ella, el núcleo descarta `sendInput` y registra qué clave añadir.

### `statusBar`

`"statusBar": true` permite a la app cambiar la barra de estado (el `statusBar` de páginas y diálogos en [`nsh/base`](../modules/nsh-base.md#status-bar), y el valor por defecto de `"statusBar"` de `nsh.json`).

### `clipboard`

`"clipboard": true` permite a la app leer y escribir el portapapeles del sistema ([`Clipboard`](../modules/nsh.md#clipboard)). Copiar desde el menú de edición de un texto seleccionable es un acto propio del usuario y no necesita ninguna capacidad.

### `picker`

`"picker": true` permite a la app mostrar el selector del sistema para fotos ([`Picker`](../modules/nsh.md#picker)): el usuario elige lo que llega a la app.

### `speech`

`"speech": true` permite a la app reconocer lo que dice el usuario ([`Speech`](../modules/nsh.md#speech)): el micrófono y el reconocedor de voz del sistema, cuya transcripción llega a la app. El sistema sigue preguntando al usuario una vez.

### `openUrl`

Permite a la app abrir URL fuera de ella ([`openUrl`](../modules/nsh.md#openurl), los enlaces de un `TextView` con `links="open"`): `"openUrl": true` para todos los esquemas, `"openUrl": { "schemes": ["https", "mailto"] }` para los esquemas enumerados. Una URL cuyo esquema no está concedido se rechaza con `ERR_ACCESS_DENIED` (`permission` `"openUrl"`, `resource` la URL). Las URL que ejecutarían código o accederían a los datos propios de la app (`javascript:`, `data:`, `file:`, ...) nunca se abren, sea cual sea la capacidad.

<a id="storage"></a>

### Almacenamiento

Toda app puede guardar sus propios datos en el dispositivo con [`Storage`](../modules/nsh.md#storage), sin ninguna capacidad: el almacenamiento contiene únicamente los datos de esa app, y la app que la incrusta decide dónde se guardan.

### `host`

`host` enumera las funciones de la app que incrusta NSH que el `host.call(name, args)` de `nsh` puede llamar: nombres exactos (`"getUserInfo"`) o prefijos que terminan en `*` (`"bridge.*"` coincide con `bridge.call` y `bridge.share`). `"host": true` permite todas las funciones. Una función que no está en la lista se rechaza, también en una app sin `"capabilities"`: las funciones del host nunca se conceden por defecto, y al compilar una app que importa `host` de `nsh` sin `host` se avisa de que se rechazará cada llamada. Los nombres tienen de 1 a 128 caracteres entre `A`–`Z`, `a`–`z`, `0`–`9`, `_`, `.`, `:` y `-`, sin `..`; la llamada a cualquier otro nombre se rechaza antes de leer las concesiones. Termina un prefijo con un separador (`"bridge.*"`): `"bridge*"` también coincide con `bridgeAdmin`. Los eventos del host (`host.on(event, listener)`) llegan a los listeners de la app tal como el host los envía.

```ts
import { host } from "nsh";

if (host.available()) {
  const user = await host.call("getUserInfo");
  const stop = host.on("loginChanged", (payload) => console.log(payload));
  stop();
}
```

`host.available()` es true en las plataformas que incrustan un host; en las demás, `host.call` se rechaza con `code` `"ERR_FEATURE_UNAVAILABLE_ON_PLATFORM"`.
<a id="what-a-refusal-looks-like"></a>

### Cómo se ve un rechazo

| Solicitud | Resultado |
|---|---|
| `fetch` | La promesa se rechaza con un `TypeError`, como toda solicitud fallida, cuyo `code` es `ERR_ACCESS_DENIED`, `permission` `"network"` y `resource` la URL (la de la solicitud o la de la redirección); la solicitud nunca llega a la red. |
| `Image.getSize`, `Image.prefetch` | La promesa se rechaza con `ERR_ACCESS_DENIED`, `permission` `"network"` y `resource` la URL; la imagen nunca se solicita. |
| Imagen remota, fuente de video, fuente de web view o `html` | No se muestra nada, y el `onError` del elemento lo notifica con `code` `"ERR_ACCESS_DENIED"`. La navegación de una web view a un host no concedido se cancela y se notifica del mismo modo. |
| Cambio de la barra de estado, imagen de canvas | No cambia ni se dibuja nada; el rechazo se registra en el log. |
| Portapapeles | Todas las funciones de `Clipboard` se rechazan con `ERR_ACCESS_DENIED`, `permission` `"clipboard"` y `resource` `""`; el portapapeles del sistema nunca se toca. |
| Selector | `pickImages` no muestra nada y se rechaza con `ERR_ACCESS_DENIED`, `permission` `"picker"` y `resource` `""`. |
| Voz | `Speech.start` lanza `ERR_ACCESS_DENIED`, `permission` `"speech"` y `resource` `""`; el micrófono permanece apagado. |
| `openUrl` | La promesa se rechaza con `ERR_ACCESS_DENIED`, `permission` `"openUrl"` y `resource` la URL; no se abre nada. |
| Llamada al host | `host.call` se rechaza con `ERR_ACCESS_DENIED`, `permission` `"host"` y `resource` el nombre de la función (`host.post` lo lanza); la llamada nunca llega al host. |
| Archivos (`fs/promises`) | La promesa se rechaza con `ERR_ACCESS_DENIED`, `permission` `"fs"` y `resource` la ruta; el disco nunca se toca. |
| Procesos (`process`) | `run` se rechaza, y `spawn` y `exit` lanzan, con `ERR_ACCESS_DENIED`, `permission` `"process"` y `resource` el comando (`"exit"` para `exit`); no se inicia ningún proceso hijo. |
| Socket TCP (`net.connect`) | La promesa se rechaza con `ERR_ACCESS_DENIED`, `permission` `"network"` y `resource` el `"host:port"`, antes de cualquier consulta DNS. |
| WebSocket | El `connect` del módulo `websocket` se rechaza con `ERR_ACCESS_DENIED`, `permission` `"network"` y `resource` la URL; el `WebSocket` global dispara `error` y luego `close` (código 1006), como lo hace una conexión que falla. |

Los errores de los [módulos estándar](../modules/standard-modules.md#failures) llevan `code` `"ERR_ACCESS_DENIED"`, de modo que una app distingue un rechazo de una operación fallida, y su `permission` y `resource` nombran la capacidad y lo que se solicitó. Los módulos de [`nsh`](../modules/nsh.md) rechazan del mismo modo: sus promesas se rechazan con `ERR_ACCESS_DENIED`, `permission` y `resource` (`fetch` con un `TypeError`, la clase de toda solicitud fallida).

```ts
import { Clipboard } from "nsh";

try {
  await Clipboard.writeText(link);
} catch (error) {
  if (error.code !== "ERR_ACCESS_DENIED") throw error;
  console.warn(`${error.permission} is not granted`); // "clipboard"
}
```

Los componentes de Rust reciben los mismos rechazos en términos de Rust: una lectura rechazada del portapapeles responde lo mismo que un portapapeles vacío, una selección rechazada no devuelve archivos, un `open_url` `false` rechazado y un `fetch` rechazado un `Err` con el mensaje.

Cada rechazo se registra una sola vez, indicando qué clave añadir:

```text
fetch GET https://evil.example.org/x is not granted: add `evil.example.org` to capabilities.network in nsh.json
```

Las redirecciones las sigue NSH, no la pila HTTP de la plataforma, por lo que cada salto se comprueba contra las capacidades. (Un cuerpo de solicitud en streaming no se envía dos veces, por lo que una redirección `307` / `308` de una subida en streaming falla.)

<a id="where-capabilities-travel"></a>

### Por dónde viajan las capacidades

La declaración acompaña a la app dondequiera que va:

- `nsh build` y `nsh package` la escriben junto al bundle como `capabilities.json`;
- `nsh publish` la incluye en la cabecera del [paquete firmado](./signed-packages.md), cubierta por la firma;
- `nsh dev` la envía con cada build, de modo que el desarrollo aplica las mismas reglas. Cambiar `capabilities` recarga la app en lugar de aplicar un hot-patch.

<a id="grants-what-a-host-app-allows"></a>

## Concesiones: lo que permite una app anfitriona

Una app anfitriona que integra NSH puede conceder **como máximo** algunas capacidades, con el mismo formato JSON:

```rust
// iOS, in Rust (nsh_platform_ios::AppView)
let grant = nsh_engine::Capabilities::from_json(&serde_json::json!({
    "network": { "hosts": ["api.example.com"] }
}))?;
app.set_granted_capabilities(Some(grant));
```

```swift
// iOS
try app.grantCapabilities(#"{ "network": { "hosts": ["api.example.com"] } }"#)
```

```java
// Android
nsh.setGrantedCapabilities("{ \"network\": { \"hosts\": [\"api.example.com\"] } }");
```

Una solicitud debe estar permitida **tanto** por la declaración de la app **como** por la concesión del host. Con la concesión anterior, una app que declara `"hosts": ["*"]` solo puede acceder a `api.example.com`, y no puede mostrar páginas web ni cambiar la barra de estado. Sin concesión (`nil` / `null`, el valor por defecto), se aplica lo que declara cada app.

Las concesiones se aplican a partir de la siguiente carga. Una configuración típica para mini apps de terceros: conceder a cada una solo su propio host de API, ejecutarla desde un [paquete firmado](./signed-packages.md) cuya declaración hayas revisado, y mantener los límites por defecto o reducirlos.

> [!WARNING]
> Los [componentes nativos](./native-components.md) que registra la app anfitriona son código propio del host: las capacidades no se aplican a ellos. Registra solo componentes que sean seguros para cualquier app que la vista pueda ejecutar.

<a id="summary"></a>

## Resumen

| Capa | Aplicada por | Definida por |
|---|---|---|
| Límites (heap, pila, tiempo, nodos) | el runtime, por VM | la app anfitriona por vista (apps integradas) |
| Hardening | el runtime, al cargar | siempre activo fuera de desarrollo |
| Capacidades | el runtime (fetch, imágenes, video, web views, barra de estado, archivos, procesos, sockets) | la app (`nsh.json`) y la app anfitriona (concesión) |
| Integridad del código | verificación de la firma | `nsh publish`; las raíces de confianza de la app anfitriona |

<a id="see-also"></a>

## Véase también

- [Paquetes firmados](./signed-packages.md)
- [Redes](./networking.md)
- [Integración en apps de iOS](./ios.md), [Integración en apps de Android](./android.md)
