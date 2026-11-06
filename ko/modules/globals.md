---
title: "전역 API"
description: "NSH 앱이 import 없이 사용할 수 있는 전역 객체인 fetch, 스트림, URL, 인코딩, Blob과 FormData, 이벤트와 abort signal, Intl, 타이머, console을 Rust로 네이티브하게 구현했습니다."
order: 15
source_hash: 94d1f5292081a56d
---

# 전역 API

ECMAScript 표준 라이브러리 외에도 NSH 앱의 JS 환경에는 다음과 같은 표준 전역 객체가 있습니다: `fetch`(`Headers`, `Request`, `Response` 포함), Streams Standard, `URL` 및 `URLSearchParams`, `TextEncoder` / `TextDecoder`, `Blob`, `File`, `FormData`, `EventTarget`, `Event`, `AbortController`, 타이머, `requestAnimationFrame` 및 `console`, 그리고 숫자와 날짜 서식을 위한 `Intl`. 이들은 Rust로 네이티브 구현되어 있고 WHATWG 표준을 따르며 import가 필요 없으므로, 이 표준들을 기반으로 만들어진 수많은 JavaScript 라이브러리(HTTP 클라이언트, URL 및 인코딩 헬퍼, 스트림 유틸리티)를 수정 없이 사용할 수 있습니다.

이 페이지는 앱이 가진 모든 전역 객체를 나열합니다. 여기에 나온 것은 TSX 환경의 전역 객체입니다. Rust 코드는 대신 Rust 표준 라이브러리, crates.io, 그리고 NSH의 `nsh_core::prelude` 서비스(`fetch`, 타이머, 태스크. [Rust로 빌드하기](../docs/rust.md) 참고)를 사용하며, 해당 항목은 표의 Rust 열에 적혀 있습니다. UI는 [엘리먼트](../elements/index.md)와 앱 자체 컴포넌트로 구성하고, 앱이 사용하는 그 밖의 모든 것은 import하는 [모듈](./index.md)에서 제공됩니다.

이 모든 항목의 TypeScript 선언은 `.nsh/types/nsh/globals.d.ts`에 생성됩니다([프로젝트 구조](../docs/project-structure.md) 참고).

| 그룹 | 전역 객체 | Rust |
|---|---|---|
| [콘솔과 타이밍](#console-and-timing) | `console`, `performance` | `log` crate(`log::info!`, ...), `nsh_core::time::now()` |
| [타이머와 프레임](#timers-and-frames) | `setTimeout`, `setInterval`, `clearTimeout`, `clearInterval`, `queueMicrotask`, `requestAnimationFrame`, `cancelAnimationFrame` | `set_timeout`, `set_interval`, `timer(delay).await`, `request_animation_frame`, `next_frame().await`, `Spawned::cancel()` |
| [Base64와 에러](#base64-and-errors) | `atob`, `btoa`, `DOMException` | `base64` crate, `Result` |
| [이벤트와 abort 시그널](#events-and-abort-signals) | `EventTarget`, `Event`, `CustomEvent`, `AbortController`, `AbortSignal` | 시그널과 클로저. 태스크 종료: `Spawned::cancel()` |
| [URL](#urls) | `URL`, `URLSearchParams` | `url` crate |
| [텍스트 인코딩](#text-encoding) | `TextEncoder`, `TextDecoder` | `str::as_bytes`, `String::from_utf8` |
| [Blob과 폼 데이터](#blobs-and-form-data) | `Blob`, `File`, `FormData` | `HttpRequest`의 `Vec<u8>` 본문 |
| [Fetch](#fetch) | `fetch`, `Headers`, `Request`, `Response` | `fetch`, `HttpRequest`, `HttpResponse` |
| [숫자와 날짜 서식](#number-and-date-formatting) | `Intl.NumberFormat`, `Intl.DateTimeFormat`, `toLocaleString` | `format!` 및 crates.io의 포매팅 crate (`locale()` 병용) |
| [스트림](#streams) | `ReadableStream`, `WritableStream`, `TransformStream`, 리더, 라이터, 컨트롤러, `ByteLengthQueuingStrategy`, `CountQueuingStrategy`, `TextEncoderStream`, `TextDecoderStream` | 전체 본문 반환: `fetch`. 네이티브 타깃에서 오래 유지되는 연결 실행: `background` 태스크 |

네이티브 호스트는 `Buffer`, `crypto`, `process`, `WebSocket`도 제공합니다. 해당 모듈, 권한, 리소스 제한은 [표준 모듈](./standard-modules.md)을 참고하세요.

<a id="console-and-timing"></a>

## 콘솔과 타이밍

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

Rust에서는 `log` crate의 매크로(`log::info!`, `log::warn!`, ...)가 같은 로그에 기록되며, `nsh run`의 터미널에도 표시됩니다. `console` 호출은 호출당 한 줄씩 런타임 로그(타깃 `js`)에 기록됩니다. info 레벨: `log`, `info`. 각자의 레벨: `debug`, `warn`, `error`. 인자는 공백으로 연결되며, 문자열은 그대로 출력되고, 에러는 스택과 함께, 함수는 `[Function name]` 형태로, 객체와 배열은 JSON으로 출력됩니다(순환 참조인 경우 `String(value)`로 대체).

기기가 dev server에 연결되어 있는 동안, 해당 기기의 로그 라인은 `nsh run` / `nsh dev`을 실행 중인 터미널에 기기 이름을 접두사로 붙여 표시됩니다. [Dev server와 디버깅](../docs/dev-server-and-debugging.md)을 참고하세요.

> [!NOTE]
> 위의 다섯 가지 메서드만 존재합니다. `console.table`, `console.group`, `console.time`, `console.assert`은 없으며, `%s` / `%o` 형식 치환도 지원하지 않습니다.

`performance.now()`는 `requestAnimationFrame`가 콜백에 전달하는 클록입니다. Rust에서는 `nsh_core::time::now()`과, `request_animation_frame` 및 `next_frame()`가 반환하는 `Instant`가 이 클록에 해당합니다. `performance`에는 다른 멤버가 없습니다.

<a id="timers-and-frames"></a>

## 타이머와 프레임

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

Rust에서는 `set_timeout(delay, f)`와 `set_interval(period, f)`가 `Spawned` 핸들을 반환하며, 이 핸들의 `cancel()`가 타이머를 해제합니다. `timer(delay).await`는 태스크 안에서 대기하고, `request_animation_frame(f)` / `next_frame().await`는 다음 프레임의 시간을 제공합니다. 이들은 모두 만든 컴포넌트가 사라질 때 함께 종료됩니다. 타이머는 브라우저와 동일하게 동작합니다. 지연 값이 없거나 음수이거나 유한하지 않으면 0으로 처리되고, 반환되는 id는 양의 정수이며, 알 수 없는 id를 해제해도 아무 일도 일어나지 않습니다. `handler`은 반드시 함수여야 합니다(문자열 핸들러는 평가되지 않습니다). 타이머는 중첩된 지연을 4ms로 제한하지 않습니다.

> [!WARNING]
> `setTimeout` / `setInterval`의 추가 인자 `...args`는 선언되어 있지만 현재는 핸들러에 전달되지 않습니다. 대신 클로저를 사용하세요: `setTimeout(() => save(id), 100)`.

`requestAnimationFrame` 콜백은 엔진이 생성하는 다음 프레임에서 한 번 실행되며, 모두 같은 `performance.now()` 시간을 받습니다. 또 다른 프레임을 요청하는 콜백은 그다음 프레임에서 호출되므로, 일반적인 루프를 그대로 사용할 수 있습니다.

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
> JS에서 프레임마다 애니메이션을 구동하면 QuickJS에서 매 프레임 코드가 실행됩니다. 스타일과 변환(transform) 애니메이션에는 JS로 다시 호출하지 않고 드라이버가 네이티브로 실행되는 [`nsh`의 애니메이션 API](./nsh.md#animation)를 사용하는 것이 좋습니다([애니메이션](../docs/animation.md) 참고).

<a id="base64-and-errors"></a>

## Base64와 에러

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

`atob` / `btoa`는 브라우저와 동일하게 바이너리 문자열과 Base64 사이를 변환합니다. `DOMException`는 중단된 작업이 reject될 때 사용하는 에러입니다. 이유 없는 `AbortController.abort()`는 이름이 `"AbortError"`인 `DOMException`를 만들고, `AbortSignal.timeout`는 이름이 `"TimeoutError"`인 에러를 만듭니다.

<a id="events-and-abort-signals"></a>

## 이벤트와 abort 시그널

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

이 클래스들은 DOM Standard의 클래스이며 한 가지 차이가 있습니다. 트리가 없으므로 이벤트는 대상(target)에만 디스패치됩니다. DOM이 대상에서 하는 것과 같이 캡처 리스너가 먼저 실행되고 그다음 나머지 리스너가 실행되며, `bubbles`는 아무 효과가 없습니다. 이 클래스들은 서브클래싱할 수 있으므로 `EventTarget`를 작은 이벤트 에미터로 만들 수 있습니다.

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

이 이벤트들은 prop으로 전달되는 엘리먼트의 이벤트(`onPress`, `onChange`, ...)와 관련이 없습니다. [터치와 제스처](../docs/touch-and-gestures.md)를 참고하세요.

`AbortSignal`는 `fetch` 요청과 스트림 파이프를 취소하고, `{ signal }`로 추가된 리스너를 제거합니다. Rust에서는 요청이 태스크 안에서 실행되며, 태스크를 취소하면 요청도 취소됩니다.

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

URL은 URL Standard에 따라 파싱됩니다. URL의 `searchParams`는 양방향으로 실시간 반영됩니다. 파라미터를 변경하면 쿼리가 다시 작성되고, `search`나 `href`를 설정하면 다시 파싱됩니다. Rust 코드는 같은 표준을 따르는 `url` crate를 사용합니다.

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

`URLSearchParams`(그리고 `Headers`와 `FormData`)의 이터레이터는 이터레이터가 생성된 시점의 스냅샷을 순회하며, 이터레이터 헬퍼(`map`, `filter`, `toArray`, ...)를 제공합니다.

`URL.createObjectURL(blob)`는 `revokeObjectURL`가 호출될 때까지 `fetch`(`GET` 포함)가 읽을 수 있는 `blob:` URL을 반환합니다. `<Image>`는 이를 `src` 또는 `placeholder`로 표시합니다([Image](../elements/image.md)).

<a id="text-encoding"></a>

## 텍스트 인코딩

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

`TextDecoder`는 브라우저보다 지원하는 인코딩이 적습니다. UTF-8, UTF-16LE, UTF-16BE, windows-1252를 지원하며(Encoding Standard의 규정대로 `latin1`, `iso-8859-1`, `ascii` 등의 레이블도 windows-1252를 가리킵니다), 그 외의 레이블은 `RangeError`를 throw합니다. `{ stream: true }`를 사용하면 두 청크 사이에서 잘린 멀티바이트 시퀀스가 다음 호출을 위해 보관됩니다.

<a id="blobs-and-form-data"></a>

## Blob과 폼 데이터

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

Blob은 바이트를 메모리에 보관하며, `slice`는 복사하지 않고 이를 공유합니다. Blob은 메모리 내 값일 뿐입니다. `File` 뒤에는 파일 시스템 접근이 없으며, `FormData`에는 form 엘리먼트로부터 생성하는 생성자가 없습니다.

`FormData` 본문은 `multipart/form-data`로 전송되며, `Response.formData()` / `Request.formData()`는 `multipart/form-data`와 `application/x-www-form-urlencoded`를 모두 파싱합니다.

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

`fetch`는 플랫폼 자체의 네트워크 스택을 통해 HTTP 및 HTTPS 요청을 전송합니다. iOS와 Mac Catalyst에서는 `NSURLSession`, Android에서는 `HttpURLConnection`을 사용합니다. 따라서 시스템의 프록시 설정, TLS 구성, 인증서 신뢰가 그대로 적용됩니다. `data:` URL과 `blob:` URL(`URL.createObjectURL`에서 생성)은 네트워크에 접근하지 않고 로컬에서 응답하며, 그 밖의 스킴은 reject됩니다. Rust의 `fetch(request)`는 같은 스택과 같은 capability를 거치고, URL 또는 `HttpRequest`을 받아 전체 본문을 담은 `HttpResponse`로 resolve됩니다([네트워킹](../docs/networking.md#from-rust-components)).

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

### Headers, Request, Response

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

### 스트리밍

응답의 `body`는 네트워크에서 데이터가 도착하는 대로 채워지는 바이트 스트림이므로, 큰 응답이나 오래 유지되는 응답(다운로드, server-sent events, 스트리밍 모델 출력)을 도착하는 동안 처리할 수 있습니다. 읽지 않은 데이터가 1 MiB를 넘게 쌓이면 앱이 다시 읽을 때까지 요청이 일시 중지됩니다.

```ts
const res = await fetch("https://api.example.com/events");
const lines = res.body!.pipeThrough(new TextDecoderStream());
for await (const chunk of lines) {
  console.log(chunk);
}
```

`ReadableStream` 요청 본문은 네트워크가 요청하는 대로 청크 단위로 업로드됩니다. Fetch Standard가 요구하는 대로 `duplex: "half"`를 전달하세요.

```ts
await fetch("https://api.example.com/upload", {
  method: "PUT",
  body: blob.stream(),
  duplex: "half",
});
```

<a id="differences-from-browsers"></a>

### 브라우저와의 차이점

- **CORS와 origin이 없습니다.** 앱은 웹 페이지가 아니므로 [capability](../docs/sandbox-and-capabilities.md)가 허용하는 모든 호스트와 통신할 수 있습니다. `mode`는 허용되지만 무시됩니다.
- **금지된 헤더가 없습니다.** 앱은 `Cookie`, `User-Agent`, `Origin` 및 그 밖의 모든 헤더를 설정할 수 있습니다. `Accept` 헤더를 지정하지 않으면 `Accept: */*`가 전송됩니다.
- **`redirect: "manual"`는 3xx 응답 자체를 전달합니다.** 불투명한 필터링 응답 대신 상태 코드와 `Location` 헤더가 그대로 전달됩니다. `"follow"`는 리디렉션을 따라가며(각 홉마다 capability를 검사합니다), `"error"`는 응답이 리디렉션이면 reject됩니다.
- **`FormData` 본문에는 항상 `Content-Type: multipart/form-data; boundary=…`가 설정됩니다.** `Content-Type` 헤더가 설정되어 있더라도 마찬가지입니다. HTTP 라이브러리는 기본 content type을 설정해 두었다가 브라우저를 감지한 경우에만 지우는 경우가 많은데, boundary가 없으면 서버가 본문을 파싱할 수 없습니다.
- **`credentials`, `cache`, `referrer`, `referrerPolicy`, `integrity`, `keepalive`, `priority`**는 검증된 후 `Request` 객체에 유지되지만 네트워크 스택에는 전달되지 않습니다. 캐싱과 쿠키 처리는 플랫폼 스택의 방식을 따릅니다.
- **Capability.** 앱이 `nsh.json`에 `network` capability를 선언한 경우(또는 임베딩 앱이 더 적게 부여한 경우), 허용되지 않은 호스트로의 요청은 네트워크에 도달하지 않으며 `fetch`는 `TypeError`로 reject됩니다. 이 에러의 `code`는 `"ERR_ACCESS_DENIED"`, `permission`는 `"network"`이고 `resource`는 거부된 URL입니다. [샌드박스와 capability](../docs/sandbox-and-capabilities.md)를 참고하세요.
- **에러.** 네트워크 실패는 메시지가 `Network request failed:`로 시작하는 `TypeError`로 reject되며, 중단(abort)은 시그널의 `reason`로 reject됩니다.

컴포넌트에서 데이터를 로드하는 방법은 [네트워킹](../docs/networking.md) 가이드를 참고하세요.

<a id="streams"></a>

## 스트림

WHATWG Streams Standard 전체를 지원합니다. 읽기 가능 스트림(기본 스트림과 바이트 스트림, BYOB 리더, `tee`, `pipeTo` / `pipeThrough`, `ReadableStream.from`, 비동기 이터레이션), 쓰기 가능 스트림, 변환 스트림, 두 가지 큐잉 전략, 텍스트 인코딩 스트림이 포함됩니다.

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

underlying source, sink, transformer 객체(`UnderlyingDefaultSource`, `UnderlyingByteSource`, `UnderlyingSink`, `Transformer`)와 `StreamPipeOptions`(`preventAbort`, `preventCancel`, `preventClose`, `signal`)는 표준 형태를 따르며, 전체 선언은 `globals.d.ts`에 있습니다.

`TextEncoderStream`는 두 문자열 청크 사이에서 잘린 서로게이트 쌍을 함께 유지하고, `TextDecoderStream`는 두 바이트 청크 사이에서 잘린 멀티바이트 시퀀스를 함께 유지합니다.

텍스트를 줄 단위로 나누는 변환 스트림:

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

## 숫자와 날짜 서식

QuickJS에는 자체 `Intl`이 없으므로 NSH가 Rust로 서식을 처리하는 구현을 추가합니다. `Intl.NumberFormat`, `Intl.DateTimeFormat`, `Intl.getCanonicalLocales`와, 숫자 및 BigInt의 `toLocaleString`, 날짜의 `toLocaleString` / `toLocaleDateString` / `toLocaleTimeString`가 이에 해당하며, 이들은 같은 `locales`와 `options`를 받습니다. 선언은 TypeScript 자체의 것(`ES2023` 라이브러리)이므로 `globals.d.ts`에는 포함되지 않습니다.

```ts
(1234567.891).toLocaleString();                                              // "1,234,567.891" (en-US)
(1234.5).toLocaleString("de-DE", { style: "currency", currency: "EUR" });  // "1.234,50 €"
new Intl.NumberFormat("en", { notation: "compact" }).format(1_500_000);      // "1.5M"
new Intl.NumberFormat("en", { style: "percent", signDisplay: "exceptZero" }).format(0.042); // "+4%"
new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });   // "09:05"
new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(date); // "Oct 16, 2026, 3:04 PM"
```

`locales`가 없으면 기기의 로케일이 사용됩니다. iOS는 지역 형식 `NSLocale.currentLocale`, Android는 `Locale.getDefault()`, `nsh test`과 웹에서는 `en-US`을 사용합니다.

- **숫자**: `decimal`, `percent`, `currency`(`currencyDisplay` `symbol`, `narrowSymbol`, `code`), `unit`(길이, 질량, 시간, 데이터 크기, 온도, 속도 등 일반적인 단위) 스타일, `minimumIntegerDigits`, `minimum` / `maximumFractionDigits`, `minimum` / `maximumSignificantDigits`, `roundingPriority`, `trailingZeroDisplay`, `useGrouping`, `signDisplay`, 그리고 `standard`, `scientific`, `engineering`, `compact` 표기법(`compactDisplay` `short` / `long`)을 지원합니다. 반올림은 입력된 숫자 그대로를 기준으로 0에서 멀어지는 방향의 반올림(half away from zero)입니다(`1.005`은 브라우저와 같이 `1.01`로 반올림됩니다). `format`는 BigInt와 십진수 문자열도 정확하게 받습니다. `formatToParts`와 `resolvedOptions`는 브라우저와 동일하게 동작합니다.
- **날짜**: 그레고리력 기준으로 `weekday`, `year`, `month`(`numeric`, `2-digit`, `short`, `long`, `narrow`), `day`, `hour`, `minute`, `second`, `fractionalSecondDigits`, `hour12` / `hourCycle`, `timeZoneName`, `dateStyle` / `timeStyle`를 지원합니다. `timeZone`는 기기의 시간대(브라우저에서는 브라우저의 시간대), `UTC` 또는 오프셋(`"+08:00"`)을 받으며, 그 밖의 시간대 이름은 `RangeError`를 throw합니다(시간대 데이터베이스가 없습니다).
- **로케일**: 로케일 데이터는 주요 언어(영어, 독일어, 프랑스어, 스페인어, 이탈리아어, 포르투갈어, 네덜란드어, 러시아어, 스웨덴어, 폴란드어, 터키어, 인도네시아어, 베트남어, 태국어, 힌디어, 중국어, 일본어, 한국어)와 그 지역 변형(`en-GB`, `en-IN`, `de-CH`, `es-MX`, `pt-PT`, `zh-TW`, ...)을 담은 테이블이며 CLDR 전체가 아니므로, 세부 사항이 브라우저의 출력과 다를 수 있습니다. 데이터가 없는 로케일은 요청된 다음 로케일, 그다음 기기의 로케일, 마지막으로 `en-US` 순으로 대체됩니다. 러시아어, 스웨덴어, 폴란드어, 터키어, 인도네시아어, 베트남어, 태국어, 힌디어 날짜에는 월 이름이 없습니다(월은 숫자로, 요일은 영어로 표기됩니다). 숫자는 항상 라틴 숫자입니다.
- **지원하지 않는 항목**: `Intl.Collator`(`String.prototype.localeCompare`는 QuickJS의 것이며 로케일을 무시합니다), `PluralRules`, `RelativeTimeFormat`, `ListFormat`, `DisplayNames`, `Segmenter`, `Intl.Locale`. `currencySign: "accounting"`와 `currencyDisplay: "name"`는 각각 `standard`와 `code`처럼 서식이 지정됩니다.

<a id="performance"></a>

## 성능

이 클래스들은 모두 네이티브입니다. URL 파싱, 텍스트 인코딩과 디코딩, multipart 본문 생성, 스트림 청크 이동은 QuickJS가 아닌 Rust에서 수행됩니다. 그럼에도 JS에서의 모든 호출은 런타임으로 넘어가므로, JS에서 바이트 단위 루프를 돌기보다는 버퍼 전체를 다루는 연산(`res.json()`, `res.text()`, `encoder.encode(s)`)을 사용하는 것이 좋습니다. [성능](../docs/performance.md)을 참고하세요.
