---
title: "API globali"
description: "I globali che ogni app NSH possiede senza bisogno di import — fetch, stream, URL, encoding, Blob e FormData, eventi e abort signal, Intl, timer e console — implementati nativamente in Rust."
order: 15
source_hash: 94d1f5292081a56d
---

# API globali

Oltre alla libreria standard ECMAScript, l'ambiente JS di un'app NSH dispone di un insieme di globali standard: `fetch` con `Headers`, `Request` e `Response`; lo Streams Standard; `URL` e `URLSearchParams`; `TextEncoder` / `TextDecoder`; `Blob`, `File` e `FormData`; `EventTarget`, `Event` e `AbortController`; timer, `requestAnimationFrame` e `console`; e `Intl` per la formattazione di numeri e date. Sono implementate nativamente in Rust, seguono gli standard WHATWG e non richiedono alcun import, quindi le numerose librerie JavaScript basate su questi standard (client HTTP, helper per URL e codifica, utility per stream) funzionano senza modifiche.

Questa pagina elenca tutte le globali di cui dispone un'app. Sono quelle dell'ambiente TSX: il codice Rust usa invece la libreria standard di Rust, crates.io e i servizi di NSH di `nsh_core::prelude` (`fetch`, timer, task; vedi [Sviluppare con Rust](../docs/rust.md)), indicati nella colonna Rust della tabella. L'interfaccia utente si costruisce con gli [elementi](../elements/index.md) e i componenti propri dell'app, e tutto il resto di ciò che un'app usa proviene dai [moduli](./index.md) che importa.

Le dichiarazioni TypeScript di tutte queste API sono generate in `.nsh/types/nsh/globals.d.ts` (vedi [Struttura del progetto](../docs/project-structure.md)).

| Gruppo | Globali | Rust |
|---|---|---|
| [Console e temporizzazione](#console-and-timing) | `console`, `performance` | il crate `log` (`log::info!`, ...), `nsh_core::time::now()` |
| [Timer e frame](#timers-and-frames) | `setTimeout`, `setInterval`, `clearTimeout`, `clearInterval`, `queueMicrotask`, `requestAnimationFrame`, `cancelAnimationFrame` | `set_timeout`, `set_interval`, `timer(delay).await`, `request_animation_frame`, `next_frame().await`, `Spawned::cancel()` |
| [Base64 ed errori](#base64-and-errors) | `atob`, `btoa`, `DOMException` | il crate `base64`, `Result` |
| [Eventi e segnali di interruzione](#events-and-abort-signals) | `EventTarget`, `Event`, `CustomEvent`, `AbortController`, `AbortSignal` | signal e closure; `Spawned::cancel()` termina un task |
| [URL](#urls) | `URL`, `URLSearchParams` | il crate `url` |
| [Codifica del testo](#text-encoding) | `TextEncoder`, `TextDecoder` | `str::as_bytes`, `String::from_utf8` |
| [Blob e dati di form](#blobs-and-form-data) | `Blob`, `File`, `FormData` | body `Vec<u8>` di `HttpRequest` |
| [Fetch](#fetch) | `fetch`, `Headers`, `Request`, `Response` | `fetch`, `HttpRequest`, `HttpResponse` |
| [Formattazione di numeri e date](#number-and-date-formatting) | `Intl.NumberFormat`, `Intl.DateTimeFormat`, `toLocaleString` | `format!` e i crate di formattazione di crates.io, con `locale()` |
| [Streams](#streams) | `ReadableStream`, `WritableStream`, `TransformStream`, reader, writer, controller, `ByteLengthQueuingStrategy`, `CountQueuingStrategy`, `TextEncoderStream`, `TextDecoderStream` | `fetch` restituisce il body completo; i task `background` gestiscono connessioni di lunga durata sui target nativi |

Gli host nativi forniscono inoltre `Buffer`, `crypto`, `process` e `WebSocket`; per i relativi moduli, permessi e limiti di risorse vedi [Moduli standard](./standard-modules.md).

<a id="console-and-timing"></a>

## Console e temporizzazione

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

In Rust, le macro del crate `log` (`log::info!`, `log::warn!`, ...) scrivono sullo stesso log e compaiono anche nel terminale di `nsh run`. `console` scrive una riga per chiamata nel log del runtime (target `js`): `log` e `info` a livello info, `debug`, `warn` e `error` ai rispettivi livelli. Gli argomenti sono uniti da spazi; le stringhe vengono stampate così come sono, gli errori con il loro stack, le funzioni come `[Function name]`, e gli oggetti e gli array come JSON (con ripiego su `String(value)` in caso di cicli).

Mentre un dispositivo è connesso al dev server, le sue righe di log compaiono nel terminale in cui è in esecuzione `nsh run` / `nsh dev`, precedute dal nome del dispositivo; vedi [Dev server e debug](../docs/dev-server-and-debugging.md).

> [!NOTE]
> Esistono solo i cinque metodi indicati sopra. Non ci sono `console.table`, `console.group`, `console.time` né `console.assert`, e nemmeno le sostituzioni di formato `%s` / `%o`.

`performance.now()` è il clock che `requestAnimationFrame` passa alle proprie callback; in Rust, `nsh_core::time::now()` e gli `Instant` restituiti da `request_animation_frame` e `next_frame()` corrispondono a quel clock. `performance` non ha altri membri.

<a id="timers-and-frames"></a>

## Timer e frame

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

Rust: `set_timeout(delay, f)` e `set_interval(period, f)` restituiscono un handle `Spawned` il cui `cancel()` li annulla, `timer(delay).await` attende in un task, e `request_animation_frame(f)` / `next_frame().await` forniscono il tempo del frame successivo; tutti terminano insieme al componente che li ha creati. I timer si comportano come nei browser: un ritardo mancante, negativo o non finito vale 0, l'id restituito è un intero positivo e annullare un id sconosciuto non produce alcun effetto. `handler` deve essere una funzione (gli handler sotto forma di stringa non vengono valutati). I timer non limitano a 4 ms i ritardi annidati.

> [!WARNING]
> Gli `...args` aggiuntivi di `setTimeout` / `setInterval` sono dichiarati ma attualmente non vengono passati all'handler. Usa invece una closure: `setTimeout(() => save(id), 100)`.

Le callback di `requestAnimationFrame` vengono eseguite una sola volta, al frame successivo prodotto dal motore, tutte con lo stesso tempo `performance.now()`. Una callback che richiede un altro frame viene chiamata al frame seguente, quindi il consueto ciclo funziona:

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
> Guidare un'animazione da JS frame per frame esegue il tuo codice a ogni frame in QuickJS. Per le animazioni di stili e trasformazioni, preferisci l'[API di animazione di `nsh`](./nsh.md#animation), i cui driver vengono eseguiti nativamente senza richiamare JS (vedi [Animazione](../docs/animation.md)).

<a id="base64-and-errors"></a>

## Base64 ed errori

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

`atob` / `btoa` convertono tra stringhe binarie e Base64 come nei browser. `DOMException` è l'errore con cui vengono rifiutate le operazioni interrotte: un `AbortController.abort()` senza motivo produce un `DOMException` di nome `"AbortError"`, e `AbortSignal.timeout` uno di nome `"TimeoutError"`.

<a id="events-and-abort-signals"></a>

## Eventi e segnali di interruzione

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

Sono le classi del DOM Standard con una differenza: non c'è alcun albero, quindi un evento viene inviato solo al proprio target. I listener di capture vengono eseguiti per primi, poi gli altri, come fa il DOM sul target; `bubbles` non ha effetto. Le classi possono essere estese con sottoclassi, il che rende `EventTarget` un piccolo event emitter:

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

Questi eventi non hanno relazione con gli eventi degli elementi (`onPress`, `onChange`, ...), che sono prop; vedi [Tocco e gesture](../docs/touch-and-gestures.md).

`AbortSignal` annulla le richieste `fetch` e le pipe degli stream, e rimuove i listener aggiunti con `{ signal }`. In Rust, una richiesta viene eseguita in un task e l'annullamento del task la annulla:

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

<a id="urls"></a>

## URL

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

Gli URL vengono analizzati secondo l'URL Standard. Il `searchParams` di un URL è attivo in entrambe le direzioni: modificare i parametri riscrive la query, e impostare `search` o `href` la analizza di nuovo. Il codice Rust usa il crate `url`, che segue lo stesso standard:

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

Gli iteratori di `URLSearchParams` (e di `Headers` e `FormData`) iterano su uno snapshot acquisito al momento della creazione dell'iteratore e dispongono degli iterator helper (`map`, `filter`, `toArray`, ...).

`URL.createObjectURL(blob)` restituisce un URL `blob:` che `fetch` (con `GET`) può leggere finché non viene chiamato `revokeObjectURL`. `<Image>` ne mostra uno come `src` o `placeholder` ([Image](../elements/image.md)).

<a id="text-encoding"></a>

## Codifica del testo

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

`TextDecoder` conosce meno codifiche di un browser: UTF-8, UTF-16LE, UTF-16BE e windows-1252 (che indicano anche le etichette `latin1`, `iso-8859-1`, `ascii` e simili, come specifica l'Encoding Standard). Le altre etichette generano un `RangeError`. Con `{ stream: true }`, una sequenza multibyte interrotta tra due chunk viene conservata per la chiamata successiva.

<a id="blobs-and-form-data"></a>

## Blob e dati di form

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

Un blob mantiene i propri byte in memoria e `slice` li condivide invece di copiarli. I blob sono solo valori in memoria: dietro `File` non c'è alcun accesso al file system e `FormData` non ha un costruttore a partire da un elemento form.

Un body `FormData` viene inviato come `multipart/form-data`, e `Response.formData()` / `Request.formData()` analizzano sia `multipart/form-data` sia `application/x-www-form-urlencoded`.

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

`fetch` invia richieste HTTP e HTTPS tramite lo stack di rete della piattaforma: `NSURLSession` su iOS e Mac Catalyst, `HttpURLConnection` su Android. Si applicano quindi le impostazioni proxy, la configurazione TLS e l'attendibilità dei certificati del sistema. Gli URL `data:` e gli URL `blob:` (da `URL.createObjectURL`) vengono risolti localmente senza toccare la rete; qualsiasi altro schema viene rifiutato. `fetch(request)` di Rust passa attraverso lo stesso stack e le stesse capability, accetta un URL o un `HttpRequest`, e si risolve con un `HttpResponse` che contiene il body completo ([Rete](../docs/networking.md#from-rust-components)):

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

### Headers, Request e Response

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

Il `body` di una risposta è uno stream di byte che si riempie man mano che la rete consegna i dati, così le risposte di grandi dimensioni o di lunga durata (download, server-sent event, output di modelli in streaming) possono essere elaborate mentre arrivano. Quando più di 1 MiB è in attesa di lettura, la richiesta viene messa in pausa finché l'app non riprende a leggere.

```ts
const res = await fetch("https://api.example.com/events");
const lines = res.body!.pipeThrough(new TextDecoderStream());
for await (const chunk of lines) {
  console.log(chunk);
}
```

Il body di una richiesta `ReadableStream` viene caricato chunk per chunk man mano che la rete lo richiede; passa `duplex: "half"` come richiesto dal Fetch Standard:

```ts
await fetch("https://api.example.com/upload", {
  method: "PUT",
  body: blob.stream(),
  duplex: "half",
});
```

<a id="differences-from-browsers"></a>

### Differenze rispetto ai browser

- **Nessun CORS e nessuna origin.** Un'app non è una pagina web: può comunicare con qualsiasi host consentito dalle sue [capability](../docs/sandbox-and-capabilities.md). `mode` viene accettato e ignorato.
- **Nessun header vietato.** Un'app può impostare `Cookie`, `User-Agent`, `Origin` e qualsiasi altro header. Quando non viene fornito alcun header `Accept`, viene inviato `Accept: */*`.
- **`redirect: "manual"` consegna direttamente la risposta 3xx**, con il suo status e l'header `Location`, invece di una risposta filtrata opaca. `"follow"` segue i redirect (ogni passaggio viene verificato rispetto alle capability); `"error"` viene rifiutato quando la risposta è un redirect.
- **Un body `FormData` riceve sempre `Content-Type: multipart/form-data; boundary=…`**, anche quando è stato impostato un header `Content-Type`. Le librerie HTTP spesso impostano un content type predefinito e lo rimuovono solo dove rilevano un browser; senza il boundary il server non può analizzare il body.
- **`credentials`, `cache`, `referrer`, `referrerPolicy`, `integrity`, `keepalive` e `priority`** vengono validati e conservati sull'oggetto `Request`, ma non vengono passati allo stack di rete: la cache e la gestione dei cookie sono quelle dello stack della piattaforma.
- **Capability.** Quando l'app dichiara capability `network` in `nsh.json` (o l'app che la incorpora ne concede meno), una richiesta verso un host non consentito non raggiunge mai la rete e `fetch` viene rifiutato con un `TypeError` il cui `code` è `"ERR_ACCESS_DENIED"`, `permission` `"network"` e `resource` l'URL rifiutato. Vedi [Sandbox e capability](../docs/sandbox-and-capabilities.md).
- **Errori.** I guasti di rete vengono rifiutati con un `TypeError` il cui messaggio inizia con `Network request failed:`; le interruzioni vengono rifiutate con il `reason` del signal.

Vedi [Rete](../docs/networking.md) per una guida al caricamento dei dati nei componenti.

## Streams

L'intero WHATWG Streams Standard: readable stream (stream predefiniti e di byte, reader BYOB, `tee`, `pipeTo` / `pipeThrough`, `ReadableStream.from`, iterazione asincrona), writable stream, transform stream, le due strategie di accodamento e gli stream di codifica del testo.

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

Gli oggetti underlying source, sink e transformer (`UnderlyingDefaultSource`, `UnderlyingByteSource`, `UnderlyingSink`, `Transformer`) e `StreamPipeOptions` (`preventAbort`, `preventCancel`, `preventClose`, `signal`) hanno le forme standard; le loro dichiarazioni complete si trovano in `globals.d.ts`.

`TextEncoderStream` mantiene insieme una coppia surrogata interrotta tra due chunk di stringa, e `TextDecoderStream` una sequenza multibyte interrotta tra due chunk di byte.

Un transform stream che divide il testo in righe:

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

## Formattazione di numeri e date

QuickJS non ha un proprio `Intl`; NSH ne aggiunge uno, che formatta in Rust: `Intl.NumberFormat`, `Intl.DateTimeFormat` e `Intl.getCanonicalLocales`, e il `toLocaleString` di numeri e BigInt e `toLocaleString` / `toLocaleDateString` / `toLocaleTimeString` delle date, che accettano gli stessi `locales` e `options`. Le loro dichiarazioni sono quelle native di TypeScript (la libreria `ES2023`), quindi non sono in `globals.d.ts`.

```ts
(1234567.891).toLocaleString();                                              // "1,234,567.891" (en-US)
(1234.5).toLocaleString("de-DE", { style: "currency", currency: "EUR" });  // "1.234,50 €"
new Intl.NumberFormat("en", { notation: "compact" }).format(1_500_000);      // "1.5M"
new Intl.NumberFormat("en", { style: "percent", signDisplay: "exceptZero" }).format(0.042); // "+4%"
new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });   // "09:05"
new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(date); // "Oct 16, 2026, 3:04 PM"
```

Senza `locales`, viene usata la locale del dispositivo: il suo formato regionale (iOS `NSLocale.currentLocale`, Android `Locale.getDefault()`), `en-US` in `nsh test` e sul web.

- **Numeri**: gli stili `decimal`, `percent`, `currency` (`currencyDisplay` `symbol`, `narrowSymbol`, `code`) e `unit` (unità comuni: lunghezze, masse, durate, dimensioni di dati, temperature, velocità); `minimumIntegerDigits`, `minimum` / `maximumFractionDigits`, `minimum` / `maximumSignificantDigits`, `roundingPriority`, `trailingZeroDisplay`, `useGrouping`, `signDisplay`; notazione `standard`, `scientific`, `engineering` e `compact` (`compactDisplay` `short` / `long`). L'arrotondamento avviene per eccesso in valore assoluto (half away from zero), sul numero così come è scritto (`1.005` viene arrotondato a `1.01`, come nei browser). `format` accetta anche BigInt e stringhe decimali, in modo esatto. `formatToParts` e `resolvedOptions` funzionano come nei browser.
- **Date**: `weekday`, `year`, `month` (`numeric`, `2-digit`, `short`, `long`, `narrow`), `day`, `hour`, `minute`, `second`, `fractionalSecondDigits`, `hour12` / `hourCycle`, `timeZoneName` e `dateStyle` / `timeStyle`, nel calendario gregoriano. `timeZone` assume il fuso orario del dispositivo (in un browser, quello del browser), `UTC` oppure un offset (`"+08:00"`); altri nomi di fuso generano un `RangeError` (non esiste un database dei fusi orari).
- **Locale**: i dati delle locale sono una tabella delle lingue più comuni (inglese, tedesco, francese, spagnolo, italiano, portoghese, olandese, russo, svedese, polacco, turco, indonesiano, vietnamita, thailandese, hindi, cinese, giapponese, coreano) con le relative varianti regionali (`en-GB`, `en-IN`, `de-CH`, `es-MX`, `pt-PT`, `zh-TW`, ...), non l'intero CLDR, quindi i dettagli possono differire dall'output di un browser. Una locale senza dati ripiega sulla successiva richiesta, poi su quella del dispositivo, quindi su `en-US`; le date in russo, svedese, polacco, turco, indonesiano, vietnamita, thailandese e hindi non hanno nomi dei mesi (i mesi sono scritti come numeri e i giorni della settimana in inglese). Le cifre sono sempre latine.
- **Non presenti**: `Intl.Collator` (`String.prototype.localeCompare` è quello di QuickJS, che ignora la locale), `PluralRules`, `RelativeTimeFormat`, `ListFormat`, `DisplayNames`, `Segmenter` e `Intl.Locale`; `currencySign: "accounting"` e `currencyDisplay: "name"` formattano come `standard` e `code`.

<a id="performance"></a>

## Prestazioni

Tutte queste classi sono native: l'analisi degli URL, la codifica e decodifica del testo, la costruzione dei body multipart e lo spostamento dei chunk degli stream avvengono in Rust, non in QuickJS. Tuttavia, ogni chiamata da JS attraversa il confine verso il runtime, quindi preferisci le operazioni su buffer interi (`res.json()`, `res.text()`, `encoder.encode(s)`) ai cicli byte per byte in JS. Vedi [Prestazioni](../docs/performance.md).
