---
title: "Глобальные API"
description: "Глобальные объекты, доступные в любом приложении NSH без импорта: fetch, streams, URL, кодирование, Blob и FormData, события и сигналы прерывания, Intl, таймеры и console — реализованы нативно на Rust."
order: 15
source_hash: 94d1f5292081a56d
---

# Глобальные API

Помимо стандартной библиотеки ECMAScript, в JS-окружении приложения NSH есть набор стандартных глобальных объектов: `fetch` с `Headers`, `Request` и `Response`; Streams Standard; `URL` и `URLSearchParams`; `TextEncoder` / `TextDecoder`; `Blob`, `File` и `FormData`; `EventTarget`, `Event` и `AbortController`; таймеры, `requestAnimationFrame` и `console`; а также `Intl` для форматирования чисел и дат. Они реализованы нативно на Rust, следуют стандартам WHATWG и не требуют импорта, поэтому множество JavaScript-библиотек, построенных на этих стандартах (HTTP-клиенты, помощники для URL и кодировок, утилиты для потоков), работают без изменений.

На этой странице перечислены все глобальные объекты приложения. Это глобальные объекты окружения TSX: код на Rust вместо них использует стандартную библиотеку Rust, crates.io и сервисы NSH из `nsh_core::prelude` (`fetch`, таймеры, задачи; см. [Сборка на Rust](../docs/rust.md)), которые указаны в столбце Rust таблицы. UI строится из [элементов](../elements/index.md) и собственных компонентов приложения, а всё остальное, что использует приложение, поставляется [модулями](./index.md), которые оно импортирует.

TypeScript-объявления для всех них генерируются в `.nsh/types/nsh/globals.d.ts` (см. [Структура проекта](../docs/project-structure.md)).

| Группа | Глобальные объекты | Rust |
|---|---|---|
| [Консоль и измерение времени](#console-and-timing) | `console`, `performance` | крейт `log` (`log::info!`, ...), `nsh_core::time::now()` |
| [Таймеры и кадры](#timers-and-frames) | `setTimeout`, `setInterval`, `clearTimeout`, `clearInterval`, `queueMicrotask`, `requestAnimationFrame`, `cancelAnimationFrame` | `set_timeout`, `set_interval`, `timer(delay).await`, `request_animation_frame`, `next_frame().await`, `Spawned::cancel()` |
| [Base64 и ошибки](#base64-and-errors) | `atob`, `btoa`, `DOMException` | крейт `base64`, `Result` |
| [События и сигналы прерывания](#events-and-abort-signals) | `EventTarget`, `Event`, `CustomEvent`, `AbortController`, `AbortSignal` | сигналы и замыкания; `Spawned::cancel()` завершает задачу |
| [URL](#urls) | `URL`, `URLSearchParams` | крейт `url` |
| [Кодирование текста](#text-encoding) | `TextEncoder`, `TextDecoder` | `str::as_bytes`, `String::from_utf8` |
| [Blob и данные форм](#blobs-and-form-data) | `Blob`, `File`, `FormData` | `Vec<u8>`-тела `HttpRequest` |
| [Fetch](#fetch) | `fetch`, `Headers`, `Request`, `Response` | `fetch`, `HttpRequest`, `HttpResponse` |
| [Форматирование чисел и дат](#number-and-date-formatting) | `Intl.NumberFormat`, `Intl.DateTimeFormat`, `toLocaleString` | `format!` и крейты форматирования с crates.io, вместе с `locale()` |
| [Потоки](#streams) | `ReadableStream`, `WritableStream`, `TransformStream`, ридеры, райтеры, контроллеры, `ByteLengthQueuingStrategy`, `CountQueuingStrategy`, `TextEncoderStream`, `TextDecoderStream` | `fetch` возвращает тело целиком; задачи `background` обслуживают долгоживущие соединения на нативных платформах |

Нативные хосты также предоставляют `Buffer`, `crypto`, `process` и `WebSocket`; их модули, разрешения и ограничения ресурсов описаны в разделе [Стандартные модули](./standard-modules.md).

<a id="console-and-timing"></a>

## Консоль и измерение времени

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

В Rust макросы крейта `log` (`log::info!`, `log::warn!`, ...) пишут в тот же журнал и тоже появляются в терминале `nsh run`. `console` пишет по одной строке на вызов в журнал среды выполнения (target `js`): `log` и `info` на уровне info, `debug`, `warn` и `error` на соответствующих уровнях. Аргументы объединяются через пробел; строки выводятся как есть, ошибки со стеком, функции как `[Function name]`, а объекты и массивы в виде JSON (при циклических ссылках используется `String(value)`).

Пока устройство подключено к dev-серверу, его строки журнала появляются в терминале, где запущены `nsh run` / `nsh dev`, с префиксом в виде имени устройства; см. [Dev-сервер и отладка](../docs/dev-server-and-debugging.md).

> [!NOTE]
> Существуют только пять перечисленных выше методов. Нет `console.table`, `console.group`, `console.time` и `console.assert`, а также подстановок формата `%s` / `%o`.

`performance.now()` это часы, которые `requestAnimationFrame` передаёт в свои колбэки; в Rust это те же часы: `nsh_core::time::now()` и `Instant`, которые возвращают `request_animation_frame` и `next_frame()`. У `performance` нет других членов.

<a id="timers-and-frames"></a>

## Таймеры и кадры

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

Rust: `set_timeout(delay, f)` и `set_interval(period, f)` возвращают дескриптор `Spawned`, чей `cancel()` отменяет их, `timer(delay).await` ожидает в задаче, а `request_animation_frame(f)` / `next_frame().await` возвращают время следующего кадра; все они завершаются вместе с компонентом, который их создал. Таймеры ведут себя как в браузерах: отсутствующая, отрицательная или не являющаяся конечным числом задержка равна 0, возвращаемый id является положительным целым числом, а очистка неизвестного id ничего не делает. `handler` должен быть функцией (строковые обработчики не вычисляются). Таймеры не ограничивают вложенные задержки значением 4 мс.

> [!WARNING]
> Дополнительные `...args` у `setTimeout` / `setInterval` объявлены, но пока не передаются обработчику. Используйте вместо этого замыкание: `setTimeout(() => save(id), 100)`.

Колбэки `requestAnimationFrame` выполняются один раз, на следующем кадре, который создаёт движок, и все получают одно и то же время `performance.now()`. Колбэк, запрашивающий ещё один кадр, вызывается на следующем кадре, поэтому обычный цикл работает:

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
> Покадровое управление анимацией из JS выполняет ваш код в QuickJS на каждом кадре. Для анимации стилей и трансформаций лучше использовать [API анимации `nsh`](./nsh.md#animation), драйверы которого работают нативно, не обращаясь обратно к JS (см. [Анимация](../docs/animation.md)).

<a id="base64-and-errors"></a>

## Base64 и ошибки

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

`atob` / `btoa` преобразуют двоичные строки в Base64 и обратно, как в браузерах. `DOMException` это то, чем отклоняются прерванные операции: `AbortController.abort()` без причины даёт `DOMException` с именем `"AbortError"`, а `AbortSignal.timeout` с именем `"TimeoutError"`.

<a id="events-and-abort-signals"></a>

## События и сигналы прерывания

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

Это классы из DOM Standard с одним отличием: дерева нет, поэтому событие отправляется только своей цели. Сначала выполняются capture-слушатели, затем остальные, как это делает DOM на самой цели; `bubbles` не имеет эффекта. От этих классов можно наследоваться, что превращает `EventTarget` в небольшой источник событий (event emitter):

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

Эти события не связаны с событиями элементов (`onPress`, `onChange`, ...), которые являются props; см. [Касания и жесты](../docs/touch-and-gestures.md).

`AbortSignal` отменяет запросы `fetch` и конвейеры потоков (pipes), а также удаляет слушатели, добавленные через `{ signal }`. В Rust запрос выполняется в задаче, и отмена задачи отменяет его:

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

URL разбираются по URL Standard. `searchParams` у URL «живой» в обе стороны: изменение параметров переписывает запрос, а установка `search` или `href` разбирает его заново. Код на Rust использует крейт `url`, который следует тому же стандарту:

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

Итераторы `URLSearchParams` (а также `Headers` и `FormData`) обходят снимок, сделанный при создании итератора, и имеют вспомогательные методы итераторов (`map`, `filter`, `toArray`, ...).

`URL.createObjectURL(blob)` возвращает URL `blob:`, который может прочитать `fetch` (с `GET`), пока не вызван `revokeObjectURL`. `<Image>` показывает такой URL как свой `src` или `placeholder` ([Image](../elements/image.md)).

<a id="text-encoding"></a>

## Кодирование текста

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

`TextDecoder` поддерживает меньше кодировок, чем браузер: UTF-8, UTF-16LE, UTF-16BE и windows-1252 (которую, как предписывает Encoding Standard, обозначают также метки `latin1`, `iso-8859-1`, `ascii` и подобные). Другие метки приводят к исключению `RangeError`. При `{ stream: true }` многобайтовая последовательность, разрезанная между двумя фрагментами, сохраняется до следующего вызова.

<a id="blobs-and-form-data"></a>

## Blob и данные форм

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

Blob хранит свои байты в памяти, а `slice` делит их, а не копирует. Blob это только значения в памяти: за `File` нет доступа к файловой системе, а у `FormData` нет конструктора из элемента формы.

Тело `FormData` отправляется как `multipart/form-data`, а `Response.formData()` / `Request.formData()` разбирают и `multipart/form-data`, и `application/x-www-form-urlencoded`.

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

`fetch` отправляет HTTP- и HTTPS-запросы через собственный сетевой стек платформы: `NSURLSession` на iOS и Mac Catalyst, `HttpURLConnection` на Android. Поэтому действуют системные настройки прокси, конфигурация TLS и доверие к сертификатам. URL `data:` и URL `blob:` (из `URL.createObjectURL`) обрабатываются локально, без обращения к сети; любая другая схема отклоняется. `fetch(request)` в Rust проходит через тот же стек и те же capabilities, принимает URL или `HttpRequest` и завершается с `HttpResponse`, содержащим тело целиком ([Работа с сетью](../docs/networking.md#from-rust-components)):

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

### Headers, Request и Response

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

### Потоковая передача

`body` ответа это поток байтов, наполняемый по мере поступления данных из сети, поэтому большие или долгоживущие ответы (загрузки, server-sent events, потоковый вывод модели) можно обрабатывать по мере их прихода. Когда непрочитанными ожидает более 1 МиБ, запрос приостанавливается, пока приложение снова не начнёт читать.

```ts
const res = await fetch("https://api.example.com/events");
const lines = res.body!.pipeThrough(new TextDecoderStream());
for await (const chunk of lines) {
  console.log(chunk);
}
```

Тело запроса `ReadableStream` загружается фрагмент за фрагментом по мере запроса сетью; передавайте `duplex: "half"`, как требует Fetch Standard:

```ts
await fetch("https://api.example.com/upload", {
  method: "PUT",
  body: blob.stream(),
  duplex: "half",
});
```

<a id="differences-from-browsers"></a>

### Отличия от браузеров

- **Нет CORS и origin.** Приложение не веб-страница: оно может обращаться к любому хосту, который разрешают его [capabilities](../docs/sandbox-and-capabilities.md). `mode` принимается и игнорируется.
- **Нет запрещённых заголовков.** Приложение может задавать `Cookie`, `User-Agent`, `Origin` и любой другой заголовок. Если заголовок `Accept` не указан, отправляется `Accept: */*`.
- **`redirect: "manual"` возвращает сам ответ 3xx** с его статусом и заголовком `Location`, а не непрозрачный отфильтрованный ответ. `"follow"` следует перенаправлениям (каждый переход проверяется по capabilities); `"error"` отклоняется, если ответ является перенаправлением.
- **Тело `FormData` всегда получает `Content-Type: multipart/form-data; boundary=…`**, даже если был задан заголовок `Content-Type`. HTTP-библиотеки часто задают тип содержимого по умолчанию и сбрасывают его только там, где обнаруживают браузер; без boundary сервер не может разобрать тело.
- **`credentials`, `cache`, `referrer`, `referrerPolicy`, `integrity`, `keepalive` и `priority`** проверяются и сохраняются в объекте `Request`, но не передаются сетевому стеку: кэширование и обработка cookie выполняются средствами стека платформы.
- **Capabilities.** Если приложение объявляет capabilities `network` в `nsh.json` (или встраивающее приложение выдаёт меньше), запрос к неразрешённому хосту никогда не доходит до сети, а `fetch` отклоняется с `TypeError`, у которой `code` равно `"ERR_ACCESS_DENIED"`, `permission` равно `"network"`, а `resource` это отклонённый URL. См. [Песочница и capabilities](../docs/sandbox-and-capabilities.md).
- **Ошибки.** Сетевые сбои отклоняются с `TypeError`, сообщение которой начинается с `Network request failed:`; прерывания отклоняются с `reason` сигнала.

Руководство по загрузке данных в компонентах см. в разделе [Работа с сетью](../docs/networking.md).

<a id="streams"></a>

## Потоки

Полный WHATWG Streams Standard: читаемые потоки (обычные и байтовые потоки, BYOB-ридеры, `tee`, `pipeTo` / `pipeThrough`, `ReadableStream.from`, асинхронная итерация), записываемые потоки, трансформирующие потоки, две стратегии очередей и потоки кодирования текста.

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

Объекты базового источника, приёмника и трансформера (`UnderlyingDefaultSource`, `UnderlyingByteSource`, `UnderlyingSink`, `Transformer`) и `StreamPipeOptions` (`preventAbort`, `preventCancel`, `preventClose`, `signal`) имеют стандартную форму; их полные объявления находятся в `globals.d.ts`.

`TextEncoderStream` склеивает суррогатную пару, разрезанную между двумя строковыми фрагментами, а `TextDecoderStream` многобайтовую последовательность, разрезанную между двумя байтовыми фрагментами.

Трансформирующий поток, разбивающий текст на строки:

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

## Форматирование чисел и дат

В QuickJS нет собственного `Intl`; NSH добавляет его, выполняя форматирование на Rust: `Intl.NumberFormat`, `Intl.DateTimeFormat` и `Intl.getCanonicalLocales`, а также `toLocaleString` для чисел и BigInt и `toLocaleString` / `toLocaleDateString` / `toLocaleTimeString` для дат, которые принимают те же `locales` и `options`. Их объявления входят в сам TypeScript (библиотека `ES2023`), поэтому в `globals.d.ts` их нет.

```ts
(1234567.891).toLocaleString();                                              // "1,234,567.891" (en-US)
(1234.5).toLocaleString("de-DE", { style: "currency", currency: "EUR" });  // "1.234,50 €"
new Intl.NumberFormat("en", { notation: "compact" }).format(1_500_000);      // "1.5M"
new Intl.NumberFormat("en", { style: "percent", signDisplay: "exceptZero" }).format(0.042); // "+4%"
new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });   // "09:05"
new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(date); // "Oct 16, 2026, 3:04 PM"
```

Без `locales` используется локаль устройства: его региональный формат (iOS `NSLocale.currentLocale`, Android `Locale.getDefault()`), `en-US` в `nsh test` и в вебе.

- **Числа**: стили `decimal`, `percent`, `currency` (`currencyDisplay` `symbol`, `narrowSymbol`, `code`) и `unit` (распространённые единицы: длины, массы, длительности, размеры данных, температуры, скорости); `minimumIntegerDigits`, `minimum` / `maximumFractionDigits`, `minimum` / `maximumSignificantDigits`, `roundingPriority`, `trailingZeroDisplay`, `useGrouping`, `signDisplay`; нотации `standard`, `scientific`, `engineering` и `compact` (`compactDisplay` `short` / `long`). Округление выполняется от нуля (half away from zero) по числу в том виде, как оно записано (`1.005` округляется до `1.01`, как в браузерах). `format` также точно принимает BigInt и десятичные строки. `formatToParts` и `resolvedOptions` работают как в браузерах.
- **Даты**: `weekday`, `year`, `month` (`numeric`, `2-digit`, `short`, `long`, `narrow`), `day`, `hour`, `minute`, `second`, `fractionalSecondDigits`, `hour12` / `hourCycle`, `timeZoneName` и `dateStyle` / `timeStyle` в григорианском календаре. `timeZone` принимает часовой пояс устройства (в браузере пояс браузера), `UTC` или смещение (`"+08:00"`); другие названия поясов приводят к исключению `RangeError` (базы данных часовых поясов нет).
- **Локали**: данные локалей это таблица распространённых языков (английский, немецкий, французский, испанский, итальянский, португальский, нидерландский, русский, шведский, польский, турецкий, индонезийский, вьетнамский, тайский, хинди, китайский, японский, корейский) с их региональными вариантами (`en-GB`, `en-IN`, `de-CH`, `es-MX`, `pt-PT`, `zh-TW`, ...), а не весь CLDR, поэтому детали могут отличаться от вывода браузера. Локаль без данных заменяется следующей из запрошенных, затем локалью устройства, затем `en-US`; в датах для русского, шведского, польского, турецкого, индонезийского, вьетнамского, тайского и хинди нет названий месяцев (месяцы записываются числами, дни недели по-английски). Цифры всегда латинские.
- **Отсутствует**: `Intl.Collator` (`String.prototype.localeCompare` это метод QuickJS, который игнорирует локаль), `PluralRules`, `RelativeTimeFormat`, `ListFormat`, `DisplayNames`, `Segmenter` и `Intl.Locale`; `currencySign: "accounting"` и `currencyDisplay: "name"` форматируют как `standard` и `code`.

<a id="performance"></a>

## Производительность

Все эти классы нативные: разбор URL, кодирование и декодирование текста, сборка multipart-тел и перемещение фрагментов потоков выполняются в Rust, а не в QuickJS. Тем не менее каждый вызов из JS пересекает границу с рантаймом, поэтому предпочитайте операции над буфером целиком (`res.json()`, `res.text()`, `encoder.encode(s)`) побайтовым циклам в JS. См. [Производительность](../docs/performance.md).
