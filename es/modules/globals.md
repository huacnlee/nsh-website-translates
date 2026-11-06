---
title: "APIs globales"
description: "Los globales que toda aplicación NSH tiene sin necesidad de importar nada: fetch, streams, URL, codificación, Blob y FormData, eventos y señales de aborto, Intl, temporizadores y console, implementados de forma nativa en Rust."
order: 15
source_hash: 94d1f5292081a56d
---


# APIs globales

Además de la biblioteca estándar de ECMAScript, el entorno JS de una app NSH tiene un conjunto de globales estándar: `fetch` con `Headers`, `Request` y `Response`; el Streams Standard; `URL` y `URLSearchParams`; `TextEncoder` / `TextDecoder`; `Blob`, `File` y `FormData`; `EventTarget`, `Event` y `AbortController`; temporizadores, `requestAnimationFrame` y `console`; y `Intl` para el formato de números y fechas. Están implementadas de forma nativa en Rust, siguen los estándares WHATWG y no necesitan importación, de modo que las numerosas bibliotecas JavaScript construidas sobre estos estándares (clientes HTTP, utilidades de URL y codificación, utilidades de streams) funcionan sin cambios.

Esta página enumera todas las globales de una app. Son las del entorno TSX: el código Rust usa en su lugar la biblioteca estándar de Rust, crates.io y los servicios de NSH de `nsh_core::prelude` (`fetch`, temporizadores, tareas; consulta [Desarrollo con Rust](../docs/rust.md)), indicados en la columna Rust de la tabla. La interfaz se construye con [elementos](../elements/index.md) y los componentes propios de la app, y todo lo demás que usa una app proviene de los [módulos](./index.md) que importa.

Las declaraciones TypeScript de todo esto se generan en `.nsh/types/nsh/globals.d.ts` (consulta [Estructura del proyecto](../docs/project-structure.md)).

| Grupo | Globales | Rust |
|---|---|---|
| [Consola y temporización](#console-and-timing) | `console`, `performance` | el crate `log` (`log::info!`, ...), `nsh_core::time::now()` |
| [Temporizadores y frames](#timers-and-frames) | `setTimeout`, `setInterval`, `clearTimeout`, `clearInterval`, `queueMicrotask`, `requestAnimationFrame`, `cancelAnimationFrame` | `set_timeout`, `set_interval`, `timer(delay).await`, `request_animation_frame`, `next_frame().await`, `Spawned::cancel()` |
| [Base64 y errores](#base64-and-errors) | `atob`, `btoa`, `DOMException` | el crate `base64`, `Result` |
| [Eventos y señales de aborto](#events-and-abort-signals) | `EventTarget`, `Event`, `CustomEvent`, `AbortController`, `AbortSignal` | signals y closures; `Spawned::cancel()` termina una tarea |
| [URLs](#urls) | `URL`, `URLSearchParams` | el crate `url` |
| [Codificación de texto](#text-encoding) | `TextEncoder`, `TextDecoder` | `str::as_bytes`, `String::from_utf8` |
| [Blobs y datos de formulario](#blobs-and-form-data) | `Blob`, `File`, `FormData` | cuerpos `Vec<u8>` de `HttpRequest` |
| [Fetch](#fetch) | `fetch`, `Headers`, `Request`, `Response` | `fetch`, `HttpRequest`, `HttpResponse` |
| [Formato de números y fechas](#number-and-date-formatting) | `Intl.NumberFormat`, `Intl.DateTimeFormat`, `toLocaleString` | `format!` y los crates de formato de crates.io, con `locale()` |
| [Streams](#streams) | `ReadableStream`, `WritableStream`, `TransformStream`, lectores, escritores, controladores, `ByteLengthQueuingStrategy`, `CountQueuingStrategy`, `TextEncoderStream`, `TextDecoderStream` | `fetch` da el cuerpo completo; las tareas `background` ejecutan conexiones de larga duración en destinos nativos |

Los hosts nativos también proporcionan `Buffer`, `crypto`, `process` y `WebSocket`; consulta [Módulos estándar](./standard-modules.md) para ver sus módulos, permisos y límites de recursos.

<a id="console-and-timing"></a>

## Consola y temporización

```ts
declare var console: {
  log(...data: unknown[]): void;
  info(...data: unknown[]): void;
  debug(...data: unknown[]): void;
  warn(...data: unknown[]): void;
  error(...data: unknown[]): void;
};

declare var performance: {
  /** Milliseconds since the JS context started, with sub-millisecond precision. */
  now(): number;
};
```

En Rust, las macros del crate `log` (`log::info!`, `log::warn!`, ...) escriben en el mismo registro y también aparecen en el terminal de `nsh run`. `console` escribe una línea por llamada en el registro del runtime (target `js`): `log` y `info` con nivel info, `debug`, `warn` y `error` con sus respectivos niveles. Los argumentos se unen con espacios; las cadenas se imprimen tal cual, los errores con su stack, las funciones como `[Function name]`, y los objetos y arrays como JSON (con `String(value)` como alternativa para los ciclos).

Mientras un dispositivo está conectado al servidor de desarrollo, sus líneas de registro aparecen en el terminal que ejecuta `nsh run` / `nsh dev`, con el nombre del dispositivo como prefijo; consulta [Servidor de desarrollo y depuración](../docs/dev-server-and-debugging.md).

> [!NOTE]
> Solo existen los cinco métodos anteriores. No hay `console.table`, `console.group`, `console.time` ni `console.assert`, ni sustituciones de formato `%s` / `%o`.

`performance.now()` es el reloj que `requestAnimationFrame` pasa a sus callbacks; en Rust, `nsh_core::time::now()` y los `Instant` que devuelven `request_animation_frame` y `next_frame()` son ese reloj. `performance` no tiene otros miembros.

<a id="timers-and-frames"></a>

## Temporizadores y frames

```ts
function setTimeout(handler: (...args: any[]) => void, timeout?: number, ...args: any[]): number;
function setInterval(handler: (...args: any[]) => void, timeout?: number, ...args: any[]): number;
function clearTimeout(id: number | undefined): void;
function clearInterval(id: number | undefined): void;
function queueMicrotask(callback: () => void): void;
/** Runs `callback` at the next display frame with its time in milliseconds. */
function requestAnimationFrame(callback: (time: number) => void): number;
function cancelAnimationFrame(id: number): void;
```

En Rust: `set_timeout(delay, f)` y `set_interval(period, f)` devuelven un handle `Spawned` cuyo `cancel()` los cancela, `timer(delay).await` espera en una tarea, y `request_animation_frame(f)` / `next_frame().await` dan el tiempo del siguiente frame; todos terminan junto con el componente que los creó. Los temporizadores se comportan como en los navegadores: un retardo ausente, negativo o no finito es 0, el id devuelto es un entero positivo, y cancelar un id desconocido no hace nada. `handler` debe ser una función (los manejadores de tipo cadena no se evalúan). Los temporizadores no limitan a 4 ms los retardos anidados.

> [!WARNING]
> Los argumentos adicionales `...args` de `setTimeout` / `setInterval` están declarados, pero actualmente no se pasan al manejador. Usa una closure en su lugar: `setTimeout(() => save(id), 100)`.

Los callbacks de `requestAnimationFrame` se ejecutan una vez, en el siguiente frame que produce el motor, todos con el mismo tiempo `performance.now()`. Un callback que solicita otro frame es llamado en el frame siguiente, de modo que el bucle habitual funciona:

```rust tabs
spawn(async move {
    let start = next_frame().await;
    loop {
        let time = next_frame().await;
        let elapsed = time.duration_since(start).as_secs_f32() * 1000.0;
        progress.set((elapsed / 300.0).min(1.0));
        if elapsed >= 300.0 {
            break;
        }
    }
});
```

```tsx tabs
let start = 0;
function tick(time: number) {
  if (!start) start = time;
  progress.set(Math.min(1, (time - start) / 300));
  if (time - start < 300) requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
```

> [!TIP]
> Dirigir una animación desde JS frame a frame ejecuta tu código en cada frame en QuickJS. Para animaciones de estilos y transformaciones, prefiere la [API de animación de `nsh`](./nsh.md#animation), cuyos drivers se ejecutan de forma nativa sin volver a llamar a JS (consulta [Animación](../docs/animation.md)).

<a id="base64-and-errors"></a>

## Base64 y errores

```ts
function atob(data: string): string;
function btoa(data: string): string;

class DOMException extends Error {
  constructor(message?: string, name?: string);
  readonly name: string;
  readonly message: string;
  readonly code: number;
}
```

`atob` / `btoa` convierten entre cadenas binarias y Base64 como en los navegadores. `DOMException` es con lo que se rechazan las operaciones abortadas: un `AbortController.abort()` sin motivo produce un `DOMException` llamado `"AbortError"`, y `AbortSignal.timeout` uno llamado `"TimeoutError"`.

<a id="events-and-abort-signals"></a>

## Eventos y señales de aborto

```ts
class EventTarget {
  constructor();
  addEventListener(type: string, listener: EventListenerOrEventListenerObject | null,
    options?: AddEventListenerOptions | boolean): void;
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject | null,
    options?: { capture?: boolean } | boolean): void;
  dispatchEvent(event: Event): boolean;
}

interface AddEventListenerOptions {
  capture?: boolean;
  once?: boolean;
  passive?: boolean;
  signal?: AbortSignal;
}

class Event {
  constructor(type: string, init?: { bubbles?: boolean; cancelable?: boolean; composed?: boolean });
  readonly type: string;
  readonly target: EventTarget | null;
  readonly currentTarget: EventTarget | null;
  readonly eventPhase: number; // NONE 0, CAPTURING_PHASE 1, AT_TARGET 2, BUBBLING_PHASE 3
  readonly bubbles: boolean;
  readonly cancelable: boolean;
  readonly defaultPrevented: boolean;
  readonly composed: boolean;
  readonly isTrusted: boolean;
  readonly timeStamp: number;
  returnValue: boolean;
  cancelBubble: boolean;
  readonly srcElement: EventTarget | null; // legacy: `target`
  initEvent(type: string, bubbles?: boolean, cancelable?: boolean): void; // legacy
  composedPath(): EventTarget[];
  preventDefault(): void;
  stopPropagation(): void;
  stopImmediatePropagation(): void;
}

class CustomEvent<T = any> extends Event {
  constructor(type: string, init?: EventInit & { detail?: T });
  readonly detail: T;
}

class AbortController {
  readonly signal: AbortSignal;
  abort(reason?: any): void;
}

class AbortSignal extends EventTarget {
  readonly aborted: boolean;
  readonly reason: any;
  onabort: ((event: Event) => void) | null;
  throwIfAborted(): void;
  static abort(reason?: any): AbortSignal;
  static timeout(milliseconds: number): AbortSignal;
  static any(signals: Iterable<AbortSignal>): AbortSignal;
}
```

Son las clases del DOM Standard con una diferencia: no hay árbol, así que un evento se despacha solo a su destino. Los listeners de captura se ejecutan primero y luego los demás, como hace el DOM en el destino; `bubbles` no tiene efecto. Las clases se pueden extender mediante subclases, lo que convierte `EventTarget` en un pequeño emisor de eventos:

```ts
class Channel extends EventTarget {
  send(message: string) {
    this.dispatchEvent(new CustomEvent("message", { detail: message }));
  }
}

const channel = new Channel();
channel.addEventListener("message", (e) => console.log((e as CustomEvent<string>).detail));
channel.send("hello");
```

Estos eventos no tienen relación con los eventos de los elementos (`onPress`, `onChange`, ...), que son props; consulta [Toque y gestos](../docs/touch-and-gestures.md).

`AbortSignal` cancela las peticiones `fetch` y los pipes de streams, y elimina los listeners añadidos con `{ signal }`. En Rust, una petición se ejecuta en una tarea, y cancelar la tarea la cancela:

```rust tabs
let search = spawn(async move {
    let _ = fetch("https://api.example.com/search?q=nsh").await;
});
// later, for example when the screen closes (a task also ends with its component):
search.cancel();
```

```tsx tabs
const controller = new AbortController();
const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(10_000)]);
fetch("https://api.example.com/search?q=nsh", { signal }).catch((e) => {
  if (e.name === "AbortError" || e.name === "TimeoutError") return;
  throw e;
});
// later, for example when the screen closes:
controller.abort();
```

## URLs

```ts
class URL {
  constructor(url: string | URL, base?: string | URL);
  static canParse(url: string | URL, base?: string | URL): boolean;
  static parse(url: string | URL, base?: string | URL): URL | null;
  /** A `blob:` URL `fetch` reads `blob` from, until revoked. */
  static createObjectURL(blob: Blob): string;
  static revokeObjectURL(url: string): void;
  href: string;
  readonly origin: string;
  protocol: string;
  username: string;
  password: string;
  host: string;
  hostname: string;
  port: string;
  pathname: string;
  search: string;
  hash: string;
  readonly searchParams: URLSearchParams;
  toString(): string;
  toJSON(): string;
}

class URLSearchParams {
  constructor(init?: string | Record<string, string> | Iterable<[string, string]> | URLSearchParams);
  readonly size: number;
  append(name: string, value: string): void;
  delete(name: string, value?: string): void;
  get(name: string): string | null;
  getAll(name: string): string[];
  has(name: string, value?: string): boolean;
  set(name: string, value: string): void;
  sort(): void;
  forEach(callback: (value: string, key: string, parent: URLSearchParams) => void, thisArg?: unknown): void;
  entries(): IterableIterator<[string, string]>;
  keys(): IterableIterator<string>;
  values(): IterableIterator<string>;
  [Symbol.iterator](): IterableIterator<[string, string]>;
  toString(): string;
}
```

Las URLs se analizan según el URL Standard. El `searchParams` de una URL es dinámico en ambos sentidos: cambiar los parámetros reescribe la query, y asignar `search` o `href` la analiza de nuevo. El código Rust usa el crate `url`, que sigue el mismo estándar:

```rust tabs
let mut url = url::Url::parse("https://api.example.com")?.join("/v1/items")?;
url.query_pairs_mut().append_pair("page", "2").append_pair("tag", "new");
url.as_str(); // "https://api.example.com/v1/items?page=2&tag=new"
```

```tsx tabs
const url = new URL("/v1/items", "https://api.example.com");
url.searchParams.set("page", "2");
url.searchParams.append("tag", "new");
url.href; // "https://api.example.com/v1/items?page=2&tag=new"
```

Los iteradores de `URLSearchParams` (y de `Headers` y `FormData`) recorren una instantánea tomada cuando se creó el iterador, y tienen los iterator helpers (`map`, `filter`, `toArray`, ...).

`URL.createObjectURL(blob)` devuelve una URL `blob:` que `fetch` (con `GET`) puede leer hasta que se llame a `revokeObjectURL`. `<Image>` muestra una como su `src` o `placeholder` ([Image](../elements/image.md)).

<a id="text-encoding"></a>

## Codificación de texto

```ts
class TextEncoder {
  readonly encoding: "utf-8";
  encode(input?: string): Uint8Array;
  encodeInto(source: string, destination: Uint8Array): { read: number; written: number };
}

/** UTF-8, UTF-16LE / BE and windows-1252 (with the labels of latin1 and ASCII). */
class TextDecoder {
  constructor(label?: string, options?: { fatal?: boolean; ignoreBOM?: boolean });
  readonly encoding: string;
  readonly fatal: boolean;
  readonly ignoreBOM: boolean;
  decode(input?: BufferSource, options?: { stream?: boolean }): string;
}
```

`TextDecoder` conoce menos codificaciones que un navegador: UTF-8, UTF-16LE, UTF-16BE y windows-1252 (que las etiquetas `latin1`, `iso-8859-1`, `ascii` y similares también designan, como especifica el Encoding Standard). Otras etiquetas lanzan un `RangeError`. Con `{ stream: true }`, una secuencia multibyte cortada entre dos fragmentos se conserva para la siguiente llamada.

<a id="blobs-and-form-data"></a>

## Blobs y datos de formulario

```ts
class Blob {
  constructor(blobParts?: Iterable<BlobPart>, options?: { type?: string; endings?: "transparent" | "native" });
  readonly size: number;
  readonly type: string;
  slice(start?: number, end?: number, contentType?: string): Blob;
  arrayBuffer(): Promise<ArrayBuffer>;
  bytes(): Promise<Uint8Array>;
  text(): Promise<string>;
  stream(): ReadableStream<Uint8Array>;
}

class File extends Blob {
  constructor(fileBits: Iterable<BlobPart>, fileName: string,
    options?: { type?: string; endings?: "transparent" | "native"; lastModified?: number });
  readonly name: string;
  readonly lastModified: number;
  readonly webkitRelativePath: string;
}

class FormData {
  constructor();
  append(name: string, value: string | Blob, fileName?: string): void;
  delete(name: string): void;
  get(name: string): File | string | null;
  getAll(name: string): (File | string)[];
  has(name: string): boolean;
  set(name: string, value: string | Blob, fileName?: string): void;
  forEach(callback: (value: File | string, key: string, parent: FormData) => void, thisArg?: unknown): void;
  entries(): IterableIterator<[string, File | string]>;
  keys(): IterableIterator<string>;
  values(): IterableIterator<File | string>;
  [Symbol.iterator](): IterableIterator<[string, File | string]>;
}

type BlobPart = ArrayBuffer | ArrayBufferView | Blob | string;
```

Un blob guarda sus bytes en memoria, y `slice` los comparte en lugar de copiarlos. Los blobs son solo valores en memoria: no hay acceso al sistema de archivos detrás de `File`, y `FormData` no tiene constructor a partir de un elemento de formulario.

Un cuerpo `FormData` se envía como `multipart/form-data`, y `Response.formData()` / `Request.formData()` analizan tanto `multipart/form-data` como `application/x-www-form-urlencoded`.

```ts
const form = new FormData();
form.append("title", "Holiday");
form.append("photo", new Blob([bytes], { type: "image/jpeg" }), "photo.jpg");
await fetch("https://api.example.com/upload", { method: "POST", body: form });
```

## Fetch

```ts
/**
 * HTTP through the platform's network stack (NSURLSession,
 * HttpURLConnection), streaming both ways; `data:` and `blob:` URLs are
 * answered locally, and `asset:/` URLs with the app's bundled files.
 */
function fetch(input: string | URL | Request, init?: RequestInit): Promise<Response>;

interface RequestInit {
  method?: string;
  headers?: HeadersInit;
  /** A ReadableStream is sent as it is read (chunked), with `duplex: "half"`. */
  body?: BodyInit | null;
  duplex?: "half";
  signal?: AbortSignal | null;
  /** "manual" gives the 3xx response itself. */
  redirect?: "follow" | "manual" | "error";
  credentials?: "omit" | "same-origin" | "include";
  cache?: "default" | "no-store" | "reload" | "no-cache" | "force-cache" | "only-if-cached";
  mode?: "same-origin" | "no-cors" | "cors";
  referrer?: string;
  referrerPolicy?: string;
  integrity?: string;
  keepalive?: boolean;
  priority?: "high" | "low" | "auto";
}

type HeadersInit = Headers | Record<string, string> | Iterable<[string, string]>;
type BodyInit = ReadableStream<Uint8Array> | Blob | BufferSource | FormData | URLSearchParams | string;
```

`fetch` envía peticiones HTTP y HTTPS a través de la pila de red propia de la plataforma: `NSURLSession` en iOS y Mac Catalyst, `HttpURLConnection` en Android. Por tanto, se aplican la configuración de proxy del sistema, la configuración TLS y la confianza en certificados. Las URLs `data:` y las URLs `blob:` (de `URL.createObjectURL`) se responden localmente sin tocar la red; cualquier otro esquema se rechaza. El `fetch(request)` de Rust pasa por la misma pila y las mismas capabilities, acepta una URL o un `HttpRequest`, y se resuelve con un `HttpResponse` que contiene el cuerpo completo ([Redes](../docs/networking.md#from-rust-components)):

```rust tabs
#[derive(serde::Deserialize)]
struct Todo {
    id: u32,
    title: String,
    done: bool,
}

async fn load_todos(token: &str) -> Result<Vec<Todo>, String> {
    let request = HttpRequest::get("https://api.example.com/todos").header("Authorization", format!("Bearer {token}"));
    let response = fetch(request).await?;
    if !response.ok() {
        return Err(format!("HTTP {}", response.status()));
    }
    serde_json::from_slice(&response.body).map_err(|e| e.to_string())
}
```

```tsx tabs
type Todo = { id: number; title: string; done: boolean };

async function loadTodos(): Promise<Todo[]> {
  const res = await fetch("https://api.example.com/todos", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
```

<a id="headers-request-and-response"></a>

### Headers, Request y Response

```ts
class Headers {
  constructor(init?: HeadersInit);
  append(name: string, value: string): void;
  delete(name: string): void;
  get(name: string): string | null;
  getSetCookie(): string[];
  has(name: string): boolean;
  set(name: string, value: string): void;
  forEach(callback: (value: string, key: string, parent: Headers) => void, thisArg?: unknown): void;
  entries(): IterableIterator<[string, string]>;
  keys(): IterableIterator<string>;
  values(): IterableIterator<string>;
  [Symbol.iterator](): IterableIterator<[string, string]>;
}

interface Body {
  /** The body as it arrives (a byte stream), or null. */
  readonly body: ReadableStream<Uint8Array> | null;
  readonly bodyUsed: boolean;
  arrayBuffer(): Promise<ArrayBuffer>;
  blob(): Promise<Blob>;
  bytes(): Promise<Uint8Array>;
  formData(): Promise<FormData>;
  json(): Promise<any>;
  text(): Promise<string>;
}

class Request implements Body {
  constructor(input: string | URL | Request, init?: RequestInit);
  readonly method: string;
  readonly url: string;
  readonly headers: Headers;
  readonly destination: string;
  readonly referrer: string;
  readonly referrerPolicy: string;
  readonly mode: string;
  readonly credentials: string;
  readonly cache: string;
  readonly redirect: "follow" | "manual" | "error";
  readonly integrity: string;
  readonly keepalive: boolean;
  readonly isReloadNavigation: boolean;
  readonly isHistoryNavigation: boolean;
  readonly signal: AbortSignal;
  readonly duplex: "half";
  clone(): Request;
  // ...and the Body members
}

class Response implements Body {
  constructor(body?: BodyInit | null, init?: { status?: number; statusText?: string; headers?: HeadersInit });
  static json(data: unknown, init?: ResponseInit): Response;
  static error(): Response;
  static redirect(url: string | URL, status?: number): Response;
  readonly type: "basic" | "default" | "error";
  readonly url: string;
  readonly redirected: boolean;
  readonly status: number;
  readonly ok: boolean;
  readonly statusText: string;
  readonly headers: Headers;
  clone(): Response;
  // ...and the Body members
}
```

### Streaming

El `body` de una respuesta es un stream de bytes que se llena a medida que la red entrega datos, de modo que las respuestas grandes o de larga duración (descargas, server-sent events, salida de modelos en streaming) se pueden procesar mientras llegan. Cuando hay más de 1 MiB esperando sin leer, la petición se pausa hasta que la app vuelve a leer.

```ts
const res = await fetch("https://api.example.com/events");
const lines = res.body!.pipeThrough(new TextDecoderStream());
for await (const chunk of lines) {
  console.log(chunk);
}
```

El cuerpo de una petición `ReadableStream` se sube fragmento a fragmento a medida que la red lo solicita; pasa `duplex: "half"` como exige el Fetch Standard:

```ts
await fetch("https://api.example.com/upload", {
  method: "PUT",
  body: blob.stream(),
  duplex: "half",
});
```

<a id="differences-from-browsers"></a>

### Diferencias con los navegadores

- **Sin CORS y sin origen.** Una app no es una página web: puede comunicarse con cualquier host que sus [capabilities](../docs/sandbox-and-capabilities.md) permitan. `mode` se acepta y se ignora.
- **Sin headers prohibidos.** Una app puede establecer `Cookie`, `User-Agent`, `Origin` y cualquier otro header. Cuando no se indica ningún header `Accept`, se envía `Accept: */*`.
- **`redirect: "manual"` entrega la propia respuesta 3xx**, con su estado y su header `Location`, en lugar de una respuesta filtrada opaca. `"follow"` sigue las redirecciones (cada salto se comprueba contra las capabilities); `"error"` rechaza cuando la respuesta es una redirección.
- **Un cuerpo `FormData` siempre recibe `Content-Type: multipart/form-data; boundary=…`**, incluso cuando se estableció un header `Content-Type`. Las bibliotecas HTTP suelen establecer un tipo de contenido por defecto y lo borran solo donde detectan un navegador; sin el boundary, el servidor no puede analizar el cuerpo.
- **`credentials`, `cache`, `referrer`, `referrerPolicy`, `integrity`, `keepalive` y `priority`** se validan y se conservan en el objeto `Request`, pero no se pasan a la pila de red: la caché y la gestión de cookies son las de la pila de la plataforma.
- **Capabilities.** Cuando la app declara capabilities `network` en `nsh.json` (o la app anfitriona concede menos), una petición a un host no permitido nunca llega a la red y `fetch` se rechaza con un `TypeError` cuyo `code` es `"ERR_ACCESS_DENIED"`, `permission` `"network"` y `resource` la URL rechazada. Consulta [Sandbox y capabilities](../docs/sandbox-and-capabilities.md).
- **Errores.** Los fallos de red se rechazan con un `TypeError` cuyo mensaje empieza por `Network request failed:`; los abortos se rechazan con el `reason` de la señal.

Consulta [Redes](../docs/networking.md) para ver una guía sobre la carga de datos en componentes.

## Streams

El Streams Standard de WHATWG completo: readable streams (por defecto y de bytes, lectores BYOB, `tee`, `pipeTo` / `pipeThrough`, `ReadableStream.from`, iteración asíncrona), writable streams, transform streams, las dos estrategias de cola y los streams de codificación de texto.

```ts
class ReadableStream<R = any> {
  constructor(underlyingSource: UnderlyingByteSource, strategy?: { highWaterMark?: number });
  constructor(underlyingSource?: UnderlyingDefaultSource<R>, strategy?: QueuingStrategy<R>);
  static from<R>(iterable: Iterable<R | PromiseLike<R>> | AsyncIterable<R>): ReadableStream<R>;
  readonly locked: boolean;
  cancel(reason?: any): Promise<void>;
  getReader(options: { mode: "byob" }): ReadableStreamBYOBReader;
  getReader(): ReadableStreamDefaultReader<R>;
  pipeThrough<T>(transform: { writable: WritableStream<R>; readable: ReadableStream<T> },
    options?: StreamPipeOptions): ReadableStream<T>;
  pipeTo(destination: WritableStream<R>, options?: StreamPipeOptions): Promise<void>;
  tee(): [ReadableStream<R>, ReadableStream<R>];
  values(options?: { preventCancel?: boolean }): AsyncIterableIterator<R>;
  [Symbol.asyncIterator](options?: { preventCancel?: boolean }): AsyncIterableIterator<R>;
}

class ReadableStreamDefaultReader<R = any> {
  constructor(stream: ReadableStream<R>);
  readonly closed: Promise<void>;
  read(): Promise<{ done: false; value: R } | { done: true; value?: R }>;
  releaseLock(): void;
  cancel(reason?: any): Promise<void>;
}

class ReadableStreamBYOBReader {
  constructor(stream: ReadableStream<Uint8Array>);
  readonly closed: Promise<void>;
  read<T extends ArrayBufferView>(view: T, options?: { min?: number }): Promise<ReadableStreamReadResult<T>>;
  releaseLock(): void;
  cancel(reason?: any): Promise<void>;
}

class ReadableStreamDefaultController<R = any> {
  readonly desiredSize: number | null;
  close(): void;
  enqueue(chunk?: R): void;
  error(e?: any): void;
}

class ReadableByteStreamController {
  readonly byobRequest: ReadableStreamBYOBRequest | null;
  readonly desiredSize: number | null;
  close(): void;
  enqueue(chunk: ArrayBufferView): void;
  error(e?: any): void;
}

class ReadableStreamBYOBRequest {
  readonly view: ArrayBufferView | null;
  respond(bytesWritten: number): void;
  respondWithNewView(view: ArrayBufferView): void;
}

class WritableStream<W = any> {
  constructor(underlyingSink?: UnderlyingSink<W>, strategy?: QueuingStrategy<W>);
  readonly locked: boolean;
  abort(reason?: any): Promise<void>;
  close(): Promise<void>;
  getWriter(): WritableStreamDefaultWriter<W>;
}

class WritableStreamDefaultWriter<W = any> {
  constructor(stream: WritableStream<W>);
  readonly closed: Promise<void>;
  readonly desiredSize: number | null;
  readonly ready: Promise<void>;
  abort(reason?: any): Promise<void>;
  close(): Promise<void>;
  releaseLock(): void;
  write(chunk?: W): Promise<void>;
}

class WritableStreamDefaultController {
  readonly signal: AbortSignal;
  error(e?: any): void;
}

class TransformStream<I = any, O = any> {
  constructor(transformer?: Transformer<I, O>, writableStrategy?: QueuingStrategy<I>,
    readableStrategy?: QueuingStrategy<O>);
  readonly readable: ReadableStream<O>;
  readonly writable: WritableStream<I>;
}

class TransformStreamDefaultController<O = any> {
  readonly desiredSize: number | null;
  enqueue(chunk?: O): void;
  error(reason?: any): void;
  terminate(): void;
}

class ByteLengthQueuingStrategy {
  constructor(init: { highWaterMark: number });
  readonly highWaterMark: number;
  readonly size: (chunk: ArrayBufferView) => number;
}

class CountQueuingStrategy {
  constructor(init: { highWaterMark: number });
  readonly highWaterMark: number;
  readonly size: (chunk: any) => 1;
}

class TextEncoderStream {
  readonly encoding: "utf-8";
  readonly readable: ReadableStream<Uint8Array>;
  readonly writable: WritableStream<string>;
}

class TextDecoderStream {
  constructor(label?: string, options?: { fatal?: boolean; ignoreBOM?: boolean });
  readonly encoding: string;
  readonly fatal: boolean;
  readonly ignoreBOM: boolean;
  readonly readable: ReadableStream<string>;
  readonly writable: WritableStream<BufferSource>;
}
```

Los objetos subyacentes de source, sink y transformer (`UnderlyingDefaultSource`, `UnderlyingByteSource`, `UnderlyingSink`, `Transformer`) y `StreamPipeOptions` (`preventAbort`, `preventCancel`, `preventClose`, `signal`) tienen las formas estándar; sus declaraciones completas están en `globals.d.ts`.

`TextEncoderStream` mantiene unido un par sustituto cortado entre dos fragmentos de cadena, y `TextDecoderStream` una secuencia multibyte cortada entre dos fragmentos de bytes.

Un transform stream que divide el texto en líneas:

```ts
function lines(): TransformStream<string, string> {
  let rest = "";
  return new TransformStream({
    transform(chunk, controller) {
      const parts = (rest + chunk).split("\n");
      rest = parts.pop()!;
      for (const line of parts) controller.enqueue(line);
    },
    flush(controller) {
      if (rest) controller.enqueue(rest);
    },
  });
}

const res = await fetch("https://api.example.com/log");
for await (const line of res.body!.pipeThrough(new TextDecoderStream()).pipeThrough(lines())) {
  console.log(line);
}
```

<a id="number-and-date-formatting"></a>

## Formato de números y fechas

QuickJS no tiene un `Intl` propio; NSH añade uno, que da formato en Rust: `Intl.NumberFormat`, `Intl.DateTimeFormat` y `Intl.getCanonicalLocales`, y el `toLocaleString` de números y BigInts y `toLocaleString` / `toLocaleDateString` / `toLocaleTimeString` de fechas, que toman los mismos `locales` y `options`. Sus declaraciones son las propias de TypeScript (la biblioteca `ES2023`), por lo que no están en `globals.d.ts`.

```ts
(1234567.891).toLocaleString();                                              // "1,234,567.891" (en-US)
(1234.5).toLocaleString("de-DE", { style: "currency", currency: "EUR" });  // "1.234,50 €"
new Intl.NumberFormat("en", { notation: "compact" }).format(1_500_000);      // "1.5M"
new Intl.NumberFormat("en", { style: "percent", signDisplay: "exceptZero" }).format(0.042); // "+4%"
new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });   // "09:05"
new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(date); // "Oct 16, 2026, 3:04 PM"
```

Sin `locales`, se usa la configuración regional del dispositivo: su formato de región (iOS `NSLocale.currentLocale`, Android `Locale.getDefault()`), `en-US` en `nsh test` y en la web.

- **Números**: los estilos `decimal`, `percent`, `currency` (`currencyDisplay` `symbol`, `narrowSymbol`, `code`) y `unit` (unidades comunes: longitudes, masas, duraciones, tamaños de datos, temperaturas, velocidades); `minimumIntegerDigits`, `minimum` / `maximumFractionDigits`, `minimum` / `maximumSignificantDigits`, `roundingPriority`, `trailingZeroDisplay`, `useGrouping`, `signDisplay`; notación `standard`, `scientific`, `engineering` y `compact` (`compactDisplay` `short` / `long`). El redondeo es hacia el valor más alejado de cero en el caso de empate (half away from zero), sobre el número tal como está escrito (`1.005` se redondea a `1.01`, como en los navegadores). `format` también acepta BigInts y cadenas decimales, de forma exacta. `formatToParts` y `resolvedOptions` funcionan como en los navegadores.
- **Fechas**: `weekday`, `year`, `month` (`numeric`, `2-digit`, `short`, `long`, `narrow`), `day`, `hour`, `minute`, `second`, `fractionalSecondDigits`, `hour12` / `hourCycle`, `timeZoneName` y `dateStyle` / `timeStyle`, en el calendario gregoriano. `timeZone` toma la zona del dispositivo (en un navegador, la del navegador), `UTC` o un desfase (`"+08:00"`); otros nombres de zona lanzan un `RangeError` (no hay base de datos de zonas horarias).
- **Configuraciones regionales**: los datos de locale son una tabla de idiomas comunes (inglés, alemán, francés, español, italiano, portugués, neerlandés, ruso, sueco, polaco, turco, indonesio, vietnamita, tailandés, hindi, chino, japonés, coreano) con sus variantes regionales (`en-GB`, `en-IN`, `de-CH`, `es-MX`, `pt-PT`, `zh-TW`, ...), no todo CLDR, por lo que los detalles pueden diferir de la salida de un navegador. Un locale sin datos recurre al siguiente solicitado, luego al del dispositivo y después a `en-US`; las fechas en ruso, sueco, polaco, turco, indonesio, vietnamita, tailandés y hindi no tienen nombres de mes (sus meses se escriben como números y sus días de la semana en inglés). Los dígitos son siempre latinos.
- **No disponible**: `Intl.Collator` (`String.prototype.localeCompare` es el de QuickJS, que ignora el locale), `PluralRules`, `RelativeTimeFormat`, `ListFormat`, `DisplayNames`, `Segmenter` y `Intl.Locale`; `currencySign: "accounting"` y `currencyDisplay: "name"` se formatean como `standard` y `code`.

<a id="performance"></a>

## Rendimiento

Todas estas clases son nativas: el análisis de URLs, la codificación y decodificación de texto, la construcción de cuerpos multipart y el movimiento de fragmentos de stream ocurren en Rust, no en QuickJS. Aun así, cada llamada desde JS cruza hacia el runtime, así que prefiere las operaciones sobre buffers completos (`res.json()`, `res.text()`, `encoder.encode(s)`) a los bucles byte a byte en JS. Consulta [Rendimiento](../docs/performance.md).
