---
title: "Globale APIs"
description: "Die Globals, die jede NSH-App ohne Import zur Verfügung hat – fetch, Streams, URL, Encoding, Blob und FormData, Events und Abort-Signale, Intl, Timer und Console – nativ in Rust implementiert."
order: 15
source_hash: 94d1f5292081a56d
---


# Globale APIs

Neben der ECMAScript-Standardbibliothek verfügt die JS-Umgebung einer NSH-App über eine Reihe standardmäßiger Globals: `fetch` mit `Headers`, `Request` und `Response`; den Streams Standard; `URL` und `URLSearchParams`; `TextEncoder` / `TextDecoder`; `Blob`, `File` und `FormData`; `EventTarget`, `Event` und `AbortController`; Timer, `requestAnimationFrame` und `console`; und `Intl` für die Formatierung von Zahlen und Datumswerten. Sie sind nativ in Rust implementiert, folgen den WHATWG-Standards und benötigen keinen Import, sodass die vielen JavaScript-Bibliotheken, die auf diesen Standards aufbauen (HTTP-Clients, URL- und Encoding-Helfer, Stream-Utilities), unverändert funktionieren.

Diese Seite listet jedes Global auf, das einer App zur Verfügung steht. Es handelt sich um die Globals der TSX-Umgebung: Rust-Code verwendet stattdessen die Standardbibliothek von Rust, crates.io und die NSH-Dienste aus `nsh_core::prelude` (`fetch`, Timer, Tasks; siehe [Mit Rust entwickeln](../docs/rust.md)), die in der Rust-Spalte der Tabelle genannt werden. Die UI wird mit [Elements](../elements/index.md) und den eigenen Komponenten der App aufgebaut, und alles Weitere, was eine App benötigt, stammt aus den [Modulen](./index.md), die sie importiert.

Die TypeScript-Deklarationen aller dieser Globals werden nach `.nsh/types/nsh/globals.d.ts` generiert (siehe [Projektstruktur](../docs/project-structure.md)).

| Gruppe | Globals | Rust |
|---|---|---|
| [Konsole und Timing](#console-and-timing) | `console`, `performance` | die Crate `log` (`log::info!`, ...), `nsh_core::time::now()` |
| [Timer und Frames](#timers-and-frames) | `setTimeout`, `setInterval`, `clearTimeout`, `clearInterval`, `queueMicrotask`, `requestAnimationFrame`, `cancelAnimationFrame` | `set_timeout`, `set_interval`, `timer(delay).await`, `request_animation_frame`, `next_frame().await`, `Spawned::cancel()` |
| [Base64 und Fehler](#base64-and-errors) | `atob`, `btoa`, `DOMException` | die Crate `base64`, `Result` |
| [Events und Abort-Signale](#events-and-abort-signals) | `EventTarget`, `Event`, `CustomEvent`, `AbortController`, `AbortSignal` | Signals und Closures; `Spawned::cancel()` beendet einen Task |
| [URLs](#urls) | `URL`, `URLSearchParams` | die Crate `url` |
| [Text-Encoding](#text-encoding) | `TextEncoder`, `TextDecoder` | `str::as_bytes`, `String::from_utf8` |
| [Blobs und Formulardaten](#blobs-and-form-data) | `Blob`, `File`, `FormData` | `Vec<u8>`-Bodies von `HttpRequest` |
| [Fetch](#fetch) | `fetch`, `Headers`, `Request`, `Response` | `fetch`, `HttpRequest`, `HttpResponse` |
| [Zahlen- und Datumsformatierung](#number-and-date-formatting) | `Intl.NumberFormat`, `Intl.DateTimeFormat`, `toLocaleString` | `format!` und die Formatierungs-Crates von crates.io, mit `locale()` |
| [Streams](#streams) | `ReadableStream`, `WritableStream`, `TransformStream`, Reader, Writer, Controller, `ByteLengthQueuingStrategy`, `CountQueuingStrategy`, `TextEncoderStream`, `TextDecoderStream` | `fetch` liefert den gesamten Body; `background`-Tasks führen langlebige Verbindungen auf nativen Targets aus |

Native Hosts stellen außerdem `Buffer`, `crypto`, `process` und `WebSocket` bereit; ihre Module, Berechtigungen und Ressourcenlimits finden Sie unter [Standardmodule](./standard-modules.md).

<a id="console-and-timing"></a>

## Konsole und Timing

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

In Rust schreiben die Makros der Crate `log` (`log::info!`, `log::warn!`, ...) in dasselbe Log und erscheinen ebenfalls im Terminal von `nsh run`. `console` schreibt pro Aufruf eine Zeile in das Log der Runtime (Target `js`): `log` und `info` auf Info-Level, `debug`, `warn` und `error` auf ihrem jeweiligen Level. Argumente werden durch Leerzeichen verbunden; Strings werden unverändert ausgegeben, Fehler mit ihrem Stack, Funktionen als `[Function name]`, Objekte und Arrays als JSON (bei Zyklen mit Rückfall auf `String(value)`).

Solange ein Gerät mit dem Dev-Server verbunden ist, erscheinen seine Logzeilen im Terminal, in dem `nsh run` / `nsh dev` läuft, mit dem Gerätenamen als Präfix; siehe [Dev-Server und Debugging](../docs/dev-server-and-debugging.md).

> [!NOTE]
> Es gibt nur die fünf oben genannten Methoden. Es gibt weder `console.table`, `console.group`, `console.time` noch `console.assert`, und auch keine `%s` / `%o`-Formatersetzungen.

`performance.now()` ist die Uhr, die `requestAnimationFrame` an seine Callbacks übergibt; in Rust sind `nsh_core::time::now()` und die `Instant`s, die `request_animation_frame` und `next_frame()` liefern, diese Uhr. `performance` hat keine weiteren Member.

<a id="timers-and-frames"></a>

## Timer und Frames

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

Rust: `set_timeout(delay, f)` und `set_interval(period, f)` geben ein `Spawned`-Handle zurück, dessen `cancel()` sie löscht, `timer(delay).await` wartet in einem Task, und `request_animation_frame(f)` / `next_frame().await` liefern die Zeit des nächsten Frames; alle enden mit der Komponente, die sie erzeugt hat. Timer verhalten sich wie in Browsern: Eine fehlende, negative oder nicht endliche Verzögerung ist 0, die zurückgegebene ID ist eine positive ganze Zahl, und das Löschen einer unbekannten ID bewirkt nichts. `handler` muss eine Funktion sein (String-Handler werden nicht ausgewertet). Timer begrenzen verschachtelte Verzögerungen nicht auf 4 ms.

> [!WARNING]
> Die zusätzlichen `...args` von `setTimeout` / `setInterval` sind deklariert, werden aber derzeit nicht an den Handler übergeben. Verwenden Sie stattdessen eine Closure: `setTimeout(() => save(id), 100)`.

`requestAnimationFrame`-Callbacks laufen einmal, beim nächsten Frame, den die Engine erzeugt, alle mit derselben `performance.now()`-Zeit. Ein Callback, der einen weiteren Frame anfordert, wird beim folgenden Frame aufgerufen, sodass die übliche Schleife funktioniert:

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
> Eine Animation Frame für Frame aus JS anzutreiben, führt Ihren Code in QuickJS bei jedem Frame aus. Für Animationen von Styles und Transforms sollten Sie die [Animations-API von `nsh`](./nsh.md#animation) bevorzugen, deren Driver nativ laufen, ohne zurück in JS zu rufen (siehe [Animation](../docs/animation.md)).

<a id="base64-and-errors"></a>

## Base64 und Fehler

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

`atob` / `btoa` konvertieren wie in Browsern zwischen Binärstrings und Base64. `DOMException` ist der Fehler, mit dem abgebrochene Operationen abgelehnt werden: Ein `AbortController.abort()` ohne Grund ergibt einen `DOMException` mit dem Namen `"AbortError"`, und `AbortSignal.timeout` einen mit dem Namen `"TimeoutError"`.

<a id="events-and-abort-signals"></a>

## Events und Abort-Signale

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

Dies sind die Klassen des DOM Standards mit einem Unterschied: Es gibt keinen Baum, ein Event wird also nur an sein Target gesendet. Capture-Listener laufen zuerst, danach die übrigen, so wie es das DOM am Target tut; `bubbles` hat keine Wirkung. Die Klassen lassen sich ableiten, was `EventTarget` zu einem kleinen Event-Emitter macht:

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

Diese Events haben nichts mit den Events von Elements (`onPress`, `onChange`, ...) zu tun, die Props sind; siehe [Touch und Gesten](../docs/touch-and-gestures.md).

`AbortSignal` bricht `fetch`-Requests und Stream-Pipes ab und entfernt Listener, die mit `{ signal }` hinzugefügt wurden. In Rust läuft ein Request in einem Task, und das Abbrechen des Tasks bricht ihn ab:

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

URLs werden gemäß dem URL Standard geparst. Die `searchParams` einer URL ist in beide Richtungen live: Das Ändern der Parameter schreibt die Query um, und das Setzen von `search` oder `href` parst sie neu. Rust-Code verwendet die Crate `url`, die demselben Standard folgt:

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

Die Iteratoren von `URLSearchParams` (und von `Headers` und `FormData`) iterieren über einen Snapshot, der beim Erzeugen des Iterators erstellt wurde, und bieten die Iterator-Helper (`map`, `filter`, `toArray`, ...).

`URL.createObjectURL(blob)` gibt eine `blob:`-URL zurück, die `fetch` (mit `GET`) lesen kann, bis `revokeObjectURL` aufgerufen wird. `<Image>` zeigt eine solche als `src` oder `placeholder` an ([Image](../elements/image.md)).

## Text-Encoding

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

`TextDecoder` kennt weniger Encodings als ein Browser: UTF-8, UTF-16LE, UTF-16BE und windows-1252 (das auch von den Labels `latin1`, `iso-8859-1`, `ascii` und ähnlichen bezeichnet wird, wie es der Encoding Standard vorgibt). Andere Labels lösen einen `RangeError` aus. Mit `{ stream: true }` wird eine Multibyte-Sequenz, die zwischen zwei Chunks geteilt wurde, für den nächsten Aufruf aufbewahrt.

<a id="blobs-and-form-data"></a>

## Blobs und Formulardaten

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

Ein Blob hält seine Bytes im Speicher, und `slice` teilt sie, statt sie zu kopieren. Blobs sind reine In-Memory-Werte: Hinter `File` steht kein Dateisystemzugriff, und `FormData` hat keinen Konstruktor aus einem Formularelement.

Ein `FormData`-Body wird als `multipart/form-data` gesendet, und `Response.formData()` / `Request.formData()` parsen sowohl `multipart/form-data` als auch `application/x-www-form-urlencoded`.

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

`fetch` sendet HTTP- und HTTPS-Requests über den plattformeigenen Netzwerk-Stack: `NSURLSession` auf iOS und Mac Catalyst, `HttpURLConnection` auf Android. Daher gelten die Proxy-Einstellungen, die TLS-Konfiguration und die Zertifikatsvertrauensstellung des Systems. `data:`-URLs und `blob:`-URLs (aus `URL.createObjectURL`) werden lokal beantwortet, ohne das Netzwerk zu berühren; jedes andere Schema wird abgelehnt. Das `fetch(request)` von Rust läuft über denselben Stack und dieselben Capabilities, nimmt eine URL oder einen `HttpRequest` entgegen und wird mit einer `HttpResponse` aufgelöst, die den gesamten Body enthält ([Networking](../docs/networking.md#from-rust-components)):

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

### Headers, Request und Response

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

Der `body` einer Response ist ein Byte-Stream, der gefüllt wird, sobald das Netzwerk Daten liefert. So können große oder langlebige Responses (Downloads, Server-Sent Events, gestreamte Modellausgaben) verarbeitet werden, während sie eintreffen. Wenn mehr als 1 MiB ungelesen wartet, wird der Request pausiert, bis die App wieder liest.

```ts
const res = await fetch("https://api.example.com/events");
const lines = res.body!.pipeThrough(new TextDecoderStream());
for await (const chunk of lines) {
  console.log(chunk);
}
```

Ein `ReadableStream`-Request-Body wird Chunk für Chunk hochgeladen, sobald das Netzwerk danach fragt; übergeben Sie `duplex: "half"`, wie es der Fetch Standard verlangt:

```ts
await fetch("https://api.example.com/upload", {
  method: "PUT",
  body: blob.stream(),
  duplex: "half",
});
```

<a id="differences-from-browsers"></a>

### Unterschiede zu Browsern

- **Kein CORS und kein Origin.** Eine App ist keine Webseite: Sie darf mit jedem Host kommunizieren, den ihre [Capabilities](../docs/sandbox-and-capabilities.md) erlauben. `mode` wird akzeptiert und ignoriert.
- **Keine verbotenen Header.** Eine App darf `Cookie`, `User-Agent`, `Origin` und jeden anderen Header setzen. Wenn kein `Accept`-Header angegeben ist, wird `Accept: */*` gesendet.
- **`redirect: "manual"` liefert die 3xx-Response selbst** mit ihrem Status und dem `Location`-Header, statt einer opaken gefilterten Response. `"follow"` folgt Weiterleitungen (jeder Hop wird gegen die Capabilities geprüft); `"error"` lehnt ab, wenn die Response eine Weiterleitung ist.
- **Ein `FormData`-Body erhält immer `Content-Type: multipart/form-data; boundary=…`**, auch wenn ein `Content-Type`-Header gesetzt wurde. HTTP-Bibliotheken setzen oft einen Standard-Content-Type und löschen ihn nur dort, wo sie einen Browser erkennen; ohne die Boundary kann der Server den Body nicht parsen.
- **`credentials`, `cache`, `referrer`, `referrerPolicy`, `integrity`, `keepalive` und `priority`** werden validiert und am `Request`-Objekt gespeichert, aber nicht an den Netzwerk-Stack weitergegeben: Caching und Cookie-Behandlung folgen dem Stack der Plattform.
- **Capabilities.** Wenn die App in `nsh.json` `network`-Capabilities deklariert (oder die einbettende App weniger gewährt), erreicht ein Request an einen nicht erlaubten Host nie das Netzwerk, und `fetch` wird mit einem `TypeError` abgelehnt, dessen `code` `"ERR_ACCESS_DENIED"` ist, `permission` `"network"` und `resource` die verweigerte URL. Siehe [Sandbox und Capabilities](../docs/sandbox-and-capabilities.md).
- **Fehler.** Netzwerkfehler lehnen mit einem `TypeError` ab, dessen Nachricht mit `Network request failed:` beginnt; Abbrüche lehnen mit dem `reason` des Signals ab.

Eine Anleitung zum Laden von Daten in Komponenten finden Sie unter [Networking](../docs/networking.md).

## Streams

Der vollständige WHATWG Streams Standard: Readable Streams (Default- und Byte-Streams, BYOB-Reader, `tee`, `pipeTo` / `pipeThrough`, `ReadableStream.from`, asynchrone Iteration), Writable Streams, Transform Streams, die beiden Queuing-Strategien und die Text-Encoding-Streams.

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

Die Underlying-Source-, Sink- und Transformer-Objekte (`UnderlyingDefaultSource`, `UnderlyingByteSource`, `UnderlyingSink`, `Transformer`) und `StreamPipeOptions` (`preventAbort`, `preventCancel`, `preventClose`, `signal`) haben die standardmäßigen Formen; ihre vollständigen Deklarationen stehen in `globals.d.ts`.

`TextEncoderStream` hält ein zwischen zwei String-Chunks getrenntes Surrogatpaar zusammen, und `TextDecoderStream` eine zwischen zwei Byte-Chunks getrennte Multibyte-Sequenz.

Ein Transform Stream, der Text in Zeilen aufteilt:

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

## Zahlen- und Datumsformatierung

QuickJS hat kein eigenes `Intl`; NSH ergänzt eines, das in Rust formatiert: `Intl.NumberFormat`, `Intl.DateTimeFormat` und `Intl.getCanonicalLocales` sowie das `toLocaleString` von Zahlen und BigInts und `toLocaleString` / `toLocaleDateString` / `toLocaleTimeString` von Datumswerten, die dieselben `locales` und `options` akzeptieren. Ihre Deklarationen sind die von TypeScript selbst (die Bibliothek `ES2023`), daher stehen sie nicht in `globals.d.ts`.

```ts
(1234567.891).toLocaleString();                                              // "1,234,567.891" (en-US)
(1234.5).toLocaleString("de-DE", { style: "currency", currency: "EUR" });  // "1.234,50 €"
new Intl.NumberFormat("en", { notation: "compact" }).format(1_500_000);      // "1.5M"
new Intl.NumberFormat("en", { style: "percent", signDisplay: "exceptZero" }).format(0.042); // "+4%"
new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });   // "09:05"
new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(date); // "Oct 16, 2026, 3:04 PM"
```

Ohne `locales` wird die Locale des Geräts verwendet: sein Regionsformat (iOS `NSLocale.currentLocale`, Android `Locale.getDefault()`), `en-US` in `nsh test` und im Web.

- **Zahlen**: die Styles `decimal`, `percent`, `currency` (`currencyDisplay` `symbol`, `narrowSymbol`, `code`) und `unit` (gängige Einheiten: Längen, Massen, Dauern, Datengrößen, Temperaturen, Geschwindigkeiten); `minimumIntegerDigits`, `minimum` / `maximumFractionDigits`, `minimum` / `maximumSignificantDigits`, `roundingPriority`, `trailingZeroDisplay`, `useGrouping`, `signDisplay`; die Notationen `standard`, `scientific`, `engineering` und `compact` (`compactDisplay` `short` / `long`). Gerundet wird kaufmännisch (von null weg), auf der Zahl, wie sie geschrieben ist (`1.005` rundet auf `1.01`, wie in Browsern). `format` akzeptiert auch BigInts und Dezimal-Strings, exakt. `formatToParts` und `resolvedOptions` funktionieren wie in Browsern.
- **Datumswerte**: `weekday`, `year`, `month` (`numeric`, `2-digit`, `short`, `long`, `narrow`), `day`, `hour`, `minute`, `second`, `fractionalSecondDigits`, `hour12` / `hourCycle`, `timeZoneName` und `dateStyle` / `timeStyle`, im gregorianischen Kalender. `timeZone` verwendet die Zeitzone des Geräts (in einem Browser die des Browsers), `UTC` oder einen Offset (`"+08:00"`); andere Zeitzonennamen lösen einen `RangeError` aus (es gibt keine Zeitzonendatenbank).
- **Locales**: Die Locale-Daten sind eine Tabelle gängiger Sprachen (Englisch, Deutsch, Französisch, Spanisch, Italienisch, Portugiesisch, Niederländisch, Russisch, Schwedisch, Polnisch, Türkisch, Indonesisch, Vietnamesisch, Thai, Hindi, Chinesisch, Japanisch, Koreanisch) mit ihren regionalen Varianten (`en-GB`, `en-IN`, `de-CH`, `es-MX`, `pt-PT`, `zh-TW`, ...), nicht das gesamte CLDR, daher können Details von der Ausgabe eines Browsers abweichen. Eine Locale ohne Daten fällt auf die nächste angeforderte zurück, dann auf die des Geräts, dann auf `en-US`; Datumswerte in Russisch, Schwedisch, Polnisch, Türkisch, Indonesisch, Vietnamesisch, Thai und Hindi haben keine Monatsnamen (ihre Monate werden als Zahlen geschrieben, ihre Wochentage auf Englisch). Ziffern sind immer lateinisch.
- **Nicht vorhanden**: `Intl.Collator` (`String.prototype.localeCompare` stammt von QuickJS und ignoriert die Locale), `PluralRules`, `RelativeTimeFormat`, `ListFormat`, `DisplayNames`, `Segmenter` und `Intl.Locale`; `currencySign: "accounting"` und `currencyDisplay: "name"` formatieren als `standard` und `code`.

## Performance

Alle diese Klassen sind nativ: Das Parsen von URLs, das Kodieren und Dekodieren von Text, das Erstellen von Multipart-Bodies und das Weiterreichen von Stream-Chunks geschehen in Rust, nicht in QuickJS. Dennoch überschreitet jeder Aufruf aus JS die Grenze zur Runtime, daher sollten Sie Operationen auf ganzen Buffern (`res.json()`, `res.text()`, `encoder.encode(s)`) Byte-für-Byte-Schleifen in JS vorziehen. Siehe [Performance](../docs/performance.md).
