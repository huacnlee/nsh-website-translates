---
title: "全域 API"
description: "每個 NSH 應用程式無需匯入即可使用的全域物件,包括 fetch、streams、URL、編碼、Blob 與 FormData、事件與中止訊號、Intl、計時器及 console,全部以 Rust 原生實作。"
order: 15
source_hash: 94d1f5292081a56d
---


# 全域 API

除了 ECMAScript 標準庫之外，NSH 應用程式的 JS 環境還有一組標準全域物件：`fetch` 連同 `Headers`、`Request` 和 `Response`；Streams Standard；`URL` 和 `URLSearchParams`；`TextEncoder` / `TextDecoder`；`Blob`、`File` 和 `FormData`；`EventTarget`、`Event` 和 `AbortController`；計時器、`requestAnimationFrame` 和 `console`；以及用於數字和日期格式化的 `Intl`。它們以 Rust 原生實現，遵循 WHATWG 標準，毋須 import，因此許多建基於這些標準的 JavaScript 程式庫（HTTP 客戶端、URL 與編碼輔助工具、串流工具）可以原封不動地運作。

本頁列出應用程式擁有的所有全域物件。這些屬於 TSX 環境：Rust 程式碼改用 Rust 的標準庫、crates.io 以及 NSH 的 `nsh_core::prelude` 服務（`fetch`、計時器、任務；見 [以 Rust 構建](../docs/rust.md)），並列於表格的 Rust 一欄。UI 以 [元素](../elements/index.md)和應用程式自己的元件構建，應用程式使用的其他一切則來自它所 import 的[模組](./index.md)。

所有這些全域物件的 TypeScript 宣告都會生成到 `.nsh/types/nsh/globals.d.ts`（見[專案結構](../docs/project-structure.md)）。

| 分類 | 全域物件 | Rust |
|---|---|---|
| [控制台與計時](#console-and-timing) | `console`、`performance` | `log` crate（`log::info!` 等）、`nsh_core::time::now()` |
| [計時器與幀](#timers-and-frames) | `setTimeout`、`setInterval`、`clearTimeout`、`clearInterval`、`queueMicrotask`、`requestAnimationFrame`、`cancelAnimationFrame` | `set_timeout`、`set_interval`、`timer(delay).await`、`request_animation_frame`、`next_frame().await`、`Spawned::cancel()` |
| [Base64 與錯誤](#base64-and-errors) | `atob`、`btoa`、`DOMException` | `base64` crate、`Result` |
| [事件與中止訊號](#events-and-abort-signals) | `EventTarget`、`Event`、`CustomEvent`、`AbortController`、`AbortSignal` | 訊號與閉包；`Spawned::cancel()` 會結束任務 |
| [URL](#urls) | `URL`、`URLSearchParams` | `url` crate |
| [文字編碼](#text-encoding) | `TextEncoder`、`TextDecoder` | `str::as_bytes`、`String::from_utf8` |
| [Blob 與表單資料](#blobs-and-form-data) | `Blob`、`File`、`FormData` | `HttpRequest` 的 `Vec<u8>` 本文 |
| [Fetch](#fetch) | `fetch`、`Headers`、`Request`、`Response` | `fetch`、`HttpRequest`、`HttpResponse` |
| [數字與日期格式化](#number-and-date-formatting) | `Intl.NumberFormat`、`Intl.DateTimeFormat`、`toLocaleString` | `format!` 及 crates.io 的格式化 crate，配合 `locale()` |
| [串流](#streams) | `ReadableStream`、`WritableStream`、`TransformStream`、讀取器、寫入器、控制器、`ByteLengthQueuingStrategy`、`CountQueuingStrategy`、`TextEncoderStream`、`TextDecoderStream` | `fetch` 提供完整本文；`background` 任務在原生目標上執行長時間連線 |

原生宿主還提供 `Buffer`、`crypto`、`process` 和 `WebSocket`；其模組、權限和資源限制見[標準模組](./standard-modules.md)。

<a id="console-and-timing"></a>

## 控制台與計時

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

在 Rust 中，`log` crate 的巨集（`log::info!`、`log::warn!` 等）會寫入同一份日誌，並同樣顯示在 `nsh run` 的終端機中。`console` 每次呼叫向執行環境的日誌（target 為 `js`）寫入一行：`log` 和 `info` 屬 info 級別，`debug`、`warn` 和 `error` 則屬各自的級別。引數以空格連接；字串原樣輸出，錯誤連同其堆疊追蹤，函式輸出為 `[Function name]`，物件和陣列輸出為 JSON（遇到循環參照時改用 `String(value)`）。

當裝置連接到開發伺服器時，其日誌行會顯示在執行 `nsh run` / `nsh dev` 的終端機中，並以裝置名稱作前綴；見[開發伺服器與除錯](../docs/dev-server-and-debugging.md)。

> [!NOTE]
> 只有上述五個方法。沒有 `console.table`、`console.group`、`console.time` 或 `console.assert`，也沒有 `%s` / `%o` 格式替換。

`performance.now()` 是 `requestAnimationFrame` 傳給其回呼的時鐘；在 Rust 中，`nsh_core::time::now()` 以及 `Instant` 從 `request_animation_frame` 和 `next_frame()` 取得的值就是該時鐘。`performance` 沒有其他成員。

<a id="timers-and-frames"></a>

## 計時器與幀

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

Rust：`set_timeout(delay, f)` 和 `set_interval(period, f)` 會返回 `Spawned` 控制代碼，其 `cancel()` 可清除計時器，`timer(delay).await` 在任務中等待，`request_animation_frame(f)` / `next_frame().await` 給出下一幀的時間；它們全部都會隨建立它們的元件一同結束。計時器的行為與瀏覽器一致：缺少、為負數或非有限的延遲視為 0，返回的 id 是正整數，清除未知的 id 則不會有任何作用。`handler` 必須是函式（不會評估字串處理器）。計時器不會把巢狀延遲限制為 4 ms。

> [!WARNING]
> `setTimeout` / `setInterval` 額外的 `...args` 雖已宣告，但目前不會傳給處理器。請改用閉包：`setTimeout(() => save(id), 100)`。

`requestAnimationFrame` 回呼只會執行一次，在引擎產生的下一幀執行，且全部使用相同的 `performance.now()` 時間。若回呼再請求另一幀，則會在隨後的一幀被呼叫，因此常見的迴圈寫法可以正常運作：

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
> 在 QuickJS 中由 JS 逐幀驅動動畫，會在每一幀都執行你的程式碼。對於樣式和變換的動畫，請優先使用 [`nsh` 的動畫 API](./nsh.md#animation)，其驅動器在原生層執行，無需回呼到 JS（見[動畫](../docs/animation.md)）。

<a id="base64-and-errors"></a>

## Base64 與錯誤

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

`atob` / `btoa` 在二進位字串與 Base64 之間轉換，與瀏覽器相同。`DOMException` 是被中止的操作用來 reject 的錯誤：沒有原因的 `AbortController.abort()` 會產生名為 `"AbortError"` 的 `DOMException`，而 `AbortSignal.timeout` 則產生名為 `"TimeoutError"` 的錯誤。

<a id="events-and-abort-signals"></a>

## 事件與中止訊號

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

這些是 DOM Standard 的類別，只有一個差異：這裡沒有樹狀結構，因此事件只會派發給其目標。捕獲監聽器先執行，然後才是其他監聽器，與 DOM 在目標處的行為相同；`bubbles` 沒有作用。這些類別可以被繼承，因此 `EventTarget` 可成為一個小型事件發射器：

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

這些事件與元素的事件（`onPress`、`onChange` 等）無關，後者是 props；見[觸控與手勢](../docs/touch-and-gestures.md)。

`AbortSignal` 可取消 `fetch` 請求和串流管道，並移除以 `{ signal }` 加入的監聽器。在 Rust 中，請求在任務內執行，取消該任務即可取消請求：

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

URL 依照 URL Standard 解析。URL 的 `searchParams` 在兩個方向上都是即時連動的：更改參數會改寫查詢字串，而設定 `search` 或 `href` 則會重新解析它。Rust 程式碼使用遵循同一標準的 `url` crate：

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

`URLSearchParams` 的迭代器（以及 `Headers` 和 `FormData` 的迭代器）會遍歷建立迭代器時所取的快照，並具備迭代器輔助方法（`map`、`filter`、`toArray` 等）。

`URL.createObjectURL(blob)` 會返回一個 `blob:` URL，在呼叫 `revokeObjectURL` 之前，`fetch`（連同 `GET`）都可以讀取它。`<Image>` 可將其顯示為其 `src` 或 `placeholder`（[Image](../elements/image.md)）。

<a id="text-encoding"></a>

## 文字編碼

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

`TextDecoder` 支援的編碼比瀏覽器少：UTF-8、UTF-16LE、UTF-16BE 和 windows-1252（標籤 `latin1`、`iso-8859-1`、`ascii` 等也指向它，與 Encoding Standard 的規定一致）。其他標籤會拋出 `RangeError`。使用 `{ stream: true }` 時，被切在兩個區塊之間的多位元組序列會保留至下一次呼叫。

<a id="blobs-and-form-data"></a>

## Blob 與表單資料

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

Blob 將其位元組保存在記憶體中，而 `slice` 會共用這些位元組而非複製。Blob 只是記憶體內的值：`File` 背後沒有檔案系統存取，`FormData` 也沒有由表單元素建構的建構函式。

`FormData` 本文會以 `multipart/form-data` 發送，而 `Response.formData()` / `Request.formData()` 可解析 `multipart/form-data` 和 `application/x-www-form-urlencoded` 兩種格式。

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

`fetch` 透過平台自身的網絡堆疊發送 HTTP 和 HTTPS 請求：在 iOS 和 Mac Catalyst 上使用 `NSURLSession`，在 Android 上使用 `HttpURLConnection`。因此系統的代理伺服器設定、TLS 設定和憑證信任都會生效。`data:` URL 和 `blob:` URL（來自 `URL.createObjectURL`）會在本機直接回應，不經過網絡；任何其他協定都會 reject。Rust 的 `fetch(request)` 經由同一個堆疊和同樣的 capabilities，接受 URL 或 `HttpRequest`，並以包含完整本文的 `HttpResponse` resolve（[Networking](../docs/networking.md#from-rust-components)）：

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

### Headers、Request 與 Response

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

<a id="streaming"></a>

### 串流傳輸

回應的 `body` 是一個隨網絡傳來資料而逐步填充的位元組串流，因此大型或長時間的回應（下載、server-sent events、串流輸出的模型結果）可以在抵達的同時處理。當有超過 1 MiB 的資料等待讀取時，請求會暫停，直至應用程式再次讀取。

```ts
const res = await fetch("https://api.example.com/events");
const lines = res.body!.pipeThrough(new TextDecoderStream());
for await (const chunk of lines) {
  console.log(chunk);
}
```

`ReadableStream` 請求本文會在網絡要求時逐塊上傳；請按 Fetch Standard 的要求傳入 `duplex: "half"`：

```ts
await fetch("https://api.example.com/upload", {
  method: "PUT",
  body: blob.stream(),
  duplex: "half",
});
```

<a id="differences-from-browsers"></a>

### 與瀏覽器的差異

- **沒有 CORS，也沒有 origin。** 應用程式不是網頁：只要其 [capabilities](../docs/sandbox-and-capabilities.md) 允許，它可以與任何主機通訊。`mode` 會被接受但被忽略。
- **沒有禁用標頭。** 應用程式可以設定 `Cookie`、`User-Agent`、`Origin` 及任何其他標頭。若未給出 `Accept` 標頭，則會發送 `Accept: */*`。
- **`redirect: "manual"` 會直接交付 3xx 回應本身**，包括其狀態碼和 `Location` 標頭，而不是不透明的過濾回應。`"follow"` 會跟隨重新導向（每一跳都會按 capabilities 檢查）；`"error"` 則在回應為重新導向時 reject。
- **`FormData` 本文一律帶有 `Content-Type: multipart/form-data; boundary=…`**，即使已設定 `Content-Type` 標頭亦然。HTTP 程式庫通常會設定預設的內容類型，只在偵測到瀏覽器時才清除；沒有 boundary，伺服器便無法解析本文。
- **`credentials`、`cache`、`referrer`、`referrerPolicy`、`integrity`、`keepalive` 和 `priority`** 會被驗證並保留在 `Request` 物件上，但不會傳給網絡堆疊：快取和 cookie 處理由平台的堆疊負責。
- **Capabilities。** 當應用程式在 `nsh.json` 中宣告了 `network` capabilities（或嵌入式應用程式授予的權限較少）時，向不被允許的主機發出的請求不會到達網絡，`fetch` 會以 `TypeError` reject，其 `code` 為 `"ERR_ACCESS_DENIED"`，`permission` 為 `"network"`，而 `resource` 為被拒絕的 URL。見[沙盒與 capabilities](../docs/sandbox-and-capabilities.md)。
- **錯誤。** 網絡故障會以 `TypeError` reject，其訊息以 `Network request failed:` 開頭；中止則以訊號的 `reason` reject。

有關在元件中載入資料的指南，見 [Networking](../docs/networking.md)。

<a id="streams"></a>

## 串流

完整的 WHATWG Streams Standard：可讀串流（預設串流和位元組串流、BYOB 讀取器、`tee`、`pipeTo` / `pipeThrough`、`ReadableStream.from`、非同步迭代）、可寫串流、轉換串流、兩種佇列策略，以及文字編碼串流。

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

底層的 source、sink 和 transformer 物件（`UnderlyingDefaultSource`、`UnderlyingByteSource`、`UnderlyingSink`、`Transformer`）以及 `StreamPipeOptions`（`preventAbort`、`preventCancel`、`preventClose`、`signal`）均為標準形態；其完整宣告見 `globals.d.ts`。

`TextEncoderStream` 會將被切在兩個字串區塊之間的代理對保持在一起，`TextDecoderStream` 則對被切在兩個位元組區塊之間的多位元組序列做同樣處理。

一個將文字拆分為行的轉換串流：

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

## 數字與日期格式化

QuickJS 本身沒有 `Intl`；NSH 加入了一個，並以 Rust 進行格式化：`Intl.NumberFormat`、`Intl.DateTimeFormat` 和 `Intl.getCanonicalLocales`，以及數字和 BigInt 的 `toLocaleString`，還有日期的 `toLocaleString` / `toLocaleDateString` / `toLocaleTimeString`，它們接受相同的 `locales` 和 `options`。其宣告是 TypeScript 自帶的（`ES2023` 程式庫），因此不在 `globals.d.ts` 中。

```ts
(1234567.891).toLocaleString();                                              // "1,234,567.891" (en-US)
(1234.5).toLocaleString("de-DE", { style: "currency", currency: "EUR" });  // "1.234,50 €"
new Intl.NumberFormat("en", { notation: "compact" }).format(1_500_000);      // "1.5M"
new Intl.NumberFormat("en", { style: "percent", signDisplay: "exceptZero" }).format(0.042); // "+4%"
new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });   // "09:05"
new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(date); // "Oct 16, 2026, 3:04 PM"
```

若沒有 `locales`，則使用裝置的地區設定：其區域格式（iOS 的 `NSLocale.currentLocale`、Android 的 `Locale.getDefault()`），在 `nsh test` 和網頁上則為 `en-US`。

- **數字**：`decimal`、`percent`、`currency`（`currencyDisplay` `symbol`、`narrowSymbol`、`code`）和 `unit`（常見單位：長度、質量、時間長度、資料大小、溫度、速度）樣式；`minimumIntegerDigits`、`minimum` / `maximumFractionDigits`、`minimum` / `maximumSignificantDigits`、`roundingPriority`、`trailingZeroDisplay`、`useGrouping`、`signDisplay`；`standard`、`scientific`、`engineering` 和 `compact` 記數法（`compactDisplay` `short` / `long`）。捨入為四捨五入（遠離零），並按所寫的數字進行（`1.005` 捨入為 `1.01`，與瀏覽器相同）。`format` 也可精確地接受 BigInt 和十進位字串。`formatToParts` 和 `resolvedOptions` 的運作與瀏覽器相同。
- **日期**：`weekday`、`year`、`month`（`numeric`、`2-digit`、`short`、`long`、`narrow`）、`day`、`hour`、`minute`、`second`、`fractionalSecondDigits`、`hour12` / `hourCycle`、`timeZoneName` 以及 `dateStyle` / `timeStyle`，採用公曆。`timeZone` 取裝置的時區（在瀏覽器中則為瀏覽器的時區）、`UTC` 或偏移量（`"+08:00"`）；其他時區名稱會拋出 `RangeError`（沒有時區資料庫）。
- **地區設定**：地區設定資料是一張常見語言的表（英語、德語、法語、西班牙語、意大利語、葡萄牙語、荷蘭語、俄語、瑞典語、波蘭語、土耳其語、印尼語、越南語、泰語、印地語、中文、日語、韓語）及其地區變體（`en-GB`、`en-IN`、`de-CH`、`es-MX`、`pt-PT`、`zh-TW` 等），並非完整的 CLDR，因此細節可能與瀏覽器的輸出有所不同。沒有資料的地區設定會回退到所要求的下一個地區設定，然後是裝置的，最後是 `en-US`；俄語、瑞典語、波蘭語、土耳其語、印尼語、越南語、泰語和印地語的日期沒有月份名稱（月份以數字書寫，星期則以英文書寫）。數字一律使用拉丁數字。
- **未提供**：`Intl.Collator`（`String.prototype.localeCompare` 是 QuickJS 的，會忽略地區設定）、`PluralRules`、`RelativeTimeFormat`、`ListFormat`、`DisplayNames`、`Segmenter` 和 `Intl.Locale`；`currencySign: "accounting"` 和 `currencyDisplay: "name"` 的格式化結果分別為 `standard` 和 `code`。

<a id="performance"></a>

## 效能

所有這些類別都是原生的：解析 URL、文字編碼與解碼、構建 multipart 本文以及搬移串流區塊，都在 Rust 中進行，而不是在 QuickJS 中。儘管如此，從 JS 發出的每次呼叫都要跨入執行環境，因此請優先使用整個緩衝區的操作（`res.json()`、`res.text()`、`encoder.encode(s)`），而不要在 JS 中逐位元組迴圈。見[效能](../docs/performance.md)。
