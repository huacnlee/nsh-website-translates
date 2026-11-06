---
title: "グローバル API"
description: "import なしですべての NSH アプリで利用できるグローバル — fetch、ストリーム、URL、エンコーディング、Blob と FormData、イベントと中断シグナル、Intl、タイマー、console — を Rust でネイティブに実装しています。"
order: 15
source_hash: 94d1f5292081a56d
---

# グローバル API

ECMAScript 標準ライブラリに加えて、NSH アプリの JS 環境には標準のグローバルが用意されています。`fetch`(`Headers`、`Request`、`Response` を含む)、Streams Standard、`URL` と `URLSearchParams`、`TextEncoder` / `TextDecoder`、`Blob`、`File`、`FormData`、`EventTarget`、`Event`、`AbortController`、タイマー、`requestAnimationFrame` と `console`、そして数値と日付のフォーマット用の `Intl` です。これらは Rust でネイティブに実装されており、WHATWG 標準に従い、import は不要です。そのため、これらの標準の上に構築された多くの JavaScript ライブラリ(HTTP クライアント、URL やエンコーディングのヘルパー、ストリームユーティリティ)がそのまま動作します。

このページでは、アプリが持つすべてのグローバルを一覧します。ここで挙げるのは TSX 環境のものです。Rust コードでは、代わりに Rust の標準ライブラリ、crates.io、および NSH の `nsh_core::prelude` のサービス(`fetch`、タイマー、タスク。[Building with Rust](../docs/rust.md) を参照)を使います。これらは表の Rust 列に記載しています。UI は[要素](../elements/index.md)とアプリ独自のコンポーネントで構築し、そのほかにアプリが使うものはすべて、import する[モジュール](./index.md)から提供されます。

これらすべての TypeScript 宣言は `.nsh/types/nsh/globals.d.ts` に生成されます([Project structure](../docs/project-structure.md) を参照)。

| グループ | グローバル | Rust |
|---|---|---|
| [コンソールと計測](#console-and-timing) | `console`、`performance` | `log` クレート(`log::info!` など)、`nsh_core::time::now()` |
| [タイマーとフレーム](#timers-and-frames) | `setTimeout`、`setInterval`、`clearTimeout`、`clearInterval`、`queueMicrotask`、`requestAnimationFrame`、`cancelAnimationFrame` | `set_timeout`、`set_interval`、`timer(delay).await`、`request_animation_frame`、`next_frame().await`、`Spawned::cancel()` |
| [Base64 とエラー](#base64-and-errors) | `atob`、`btoa`、`DOMException` | `base64` クレート、`Result` |
| [イベントと中止シグナル](#events-and-abort-signals) | `EventTarget`、`Event`、`CustomEvent`、`AbortController`、`AbortSignal` | シグナルとクロージャ。`Spawned::cancel()` でタスクを終了します |
| [URL](#urls) | `URL`、`URLSearchParams` | `url` クレート |
| [テキストエンコーディング](#text-encoding) | `TextEncoder`、`TextDecoder` | `str::as_bytes`、`String::from_utf8` |
| [Blob とフォームデータ](#blobs-and-form-data) | `Blob`、`File`、`FormData` | `HttpRequest` の `Vec<u8>` ボディ |
| [Fetch](#fetch) | `fetch`、`Headers`、`Request`、`Response` | `fetch`、`HttpRequest`、`HttpResponse` |
| [数値と日付のフォーマット](#number-and-date-formatting) | `Intl.NumberFormat`、`Intl.DateTimeFormat`、`toLocaleString` | `format!` と crates.io のフォーマット用クレート、および `locale()` |
| [ストリーム](#streams) | `ReadableStream`、`WritableStream`、`TransformStream`、リーダー、ライター、コントローラー、`ByteLengthQueuingStrategy`、`CountQueuingStrategy`、`TextEncoderStream`、`TextDecoderStream` | `fetch` はボディ全体を返します。ネイティブターゲットでは `background` タスクが長時間続く接続を実行します |

ネイティブホストは `Buffer`、`crypto`、`process`、`WebSocket` も提供します。これらのモジュール、権限、リソース制限については [Standard modules](./standard-modules.md) を参照してください。

<a id="console-and-timing"></a>

## コンソールと計測

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

Rust では、`log` クレートのマクロ(`log::info!`、`log::warn!` など)が同じログに書き込み、`nsh run` のターミナルにも表示されます。`console` は、呼び出しごとに 1 行をランタイムのログ(ターゲット `js`)に書き込みます。`log` と `info` は info レベル、`debug`、`warn`、`error` はそれぞれのレベルです。引数はスペースで連結されます。文字列はそのまま出力され、エラーはスタック付きで、関数は `[Function name]` として、オブジェクトと配列は JSON として出力されます(循環がある場合は `String(value)` にフォールバックします)。

デバイスが dev サーバーに接続されている間、そのログ行は `nsh run` / `nsh dev` を実行しているターミナルに、デバイス名を先頭に付けて表示されます。[Dev server and debugging](../docs/dev-server-and-debugging.md) を参照してください。

> [!NOTE]
> 上記の 5 つのメソッドのみが存在します。`console.table`、`console.group`、`console.time`、`console.assert` はなく、`%s` / `%o` によるフォーマット置換もありません。

`performance.now()` は、`requestAnimationFrame` がコールバックに渡す時計です。Rust では、`nsh_core::time::now()`、および `request_animation_frame` と `next_frame()` が返す `Instant` がその時計にあたります。`performance` にはこれ以外のメンバーはありません。

<a id="timers-and-frames"></a>

## タイマーとフレーム

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

Rust では、`set_timeout(delay, f)` と `set_interval(period, f)` は `Spawned` ハンドルを返し、その `cancel()` でクリアできます。`timer(delay).await` はタスク内で待機し、`request_animation_frame(f)` / `next_frame().await` は次のフレームの時刻を返します。これらはすべて、作成したコンポーネントの終了とともに終わります。タイマーはブラウザと同じように動作します。遅延が未指定、負、または有限でない場合は 0 として扱われ、返される id は正の整数で、未知の id をクリアしても何も起こりません。`handler` は関数でなければなりません(文字列のハンドラーは評価されません)。タイマーは、ネストした遅延を 4 ms にクランプしません。

> [!WARNING]
> `setTimeout` / `setInterval` の追加の `...args` は宣言されていますが、現在はハンドラーに渡されません。代わりにクロージャを使ってください: `setTimeout(() => save(id), 100)`。

`requestAnimationFrame` のコールバックは、エンジンが生成する次のフレームで 1 回だけ実行され、すべて同じ `performance.now()` の時刻を受け取ります。別のフレームを要求するコールバックは、その次のフレームで呼び出されるため、おなじみのループがそのまま使えます。

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
> JS からフレームごとにアニメーションを駆動すると、QuickJS では毎フレームあなたのコードが実行されます。スタイルやトランスフォームのアニメーションには、[`nsh` のアニメーション API](./nsh.md#animation) の使用をお勧めします。そのドライバーは JS にコールバックせずネイティブで動作します([Animation](../docs/animation.md) を参照)。

<a id="base64-and-errors"></a>

## Base64 とエラー

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

`atob` / `btoa` は、ブラウザと同様にバイナリ文字列と Base64 を相互に変換します。`DOMException` は、中止された操作が reject する際に使われるエラーです。理由なしの `AbortController.abort()` は `"AbortError"` という名前の `DOMException` になり、`AbortSignal.timeout` は `"TimeoutError"` という名前のものになります。

<a id="events-and-abort-signals"></a>

## イベントと中止シグナル

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

これらは DOM Standard のクラスですが、1 点だけ違いがあります。ツリーがないため、イベントはターゲットにのみディスパッチされます。DOM がターゲットで行うのと同様に、キャプチャリスナーが先に、その後にその他のリスナーが実行されます。`bubbles` は効果がありません。これらのクラスはサブクラス化できるため、`EventTarget` を小さなイベントエミッターにできます。

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

これらのイベントは、props である要素のイベント(`onPress`、`onChange` など)とは無関係です。[Touch and gestures](../docs/touch-and-gestures.md) を参照してください。

`AbortSignal` は `fetch` リクエストとストリームのパイプをキャンセルし、`{ signal }` で追加されたリスナーを削除します。Rust では、リクエストはタスク内で実行され、そのタスクをキャンセルするとリクエストもキャンセルされます。

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

URL は URL Standard に従ってパースされます。URL の `searchParams` は双方向にライブです。パラメーターを変更するとクエリが書き換えられ、`search` や `href` を設定すると再パースされます。Rust コードでは、同じ標準に従う `url` クレートを使います。

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

`URLSearchParams`(および `Headers` と `FormData`)のイテレーターは、イテレーターの作成時に取得されたスナップショットを反復処理し、イテレーターヘルパー(`map`、`filter`、`toArray` など)を備えています。

`URL.createObjectURL(blob)` は、`revokeObjectURL` が呼び出されるまで `fetch`(`GET` 付き)が読み取れる `blob:` URL を返します。`<Image>` は、それを `src` または `placeholder` として表示します([Image](../elements/image.md))。

<a id="text-encoding"></a>

## テキストエンコーディング

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

`TextDecoder` が扱えるエンコーディングはブラウザより少なく、UTF-8、UTF-16LE、UTF-16BE、windows-1252 です(Encoding Standard の定めるとおり、`latin1`、`iso-8859-1`、`ascii` などのラベルも windows-1252 を指します)。それ以外のラベルは `RangeError` をスローします。`{ stream: true }` を指定した場合、2 つのチャンクの間で途切れたマルチバイトシーケンスは、次の呼び出しまで保持されます。

<a id="blobs-and-form-data"></a>

## Blob とフォームデータ

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

Blob はそのバイト列をメモリ上に保持し、`slice` はコピーせずにそれを共有します。Blob はメモリ上の値にすぎません。`File` の背後にファイルシステムへのアクセスはなく、`FormData` にはフォーム要素からのコンストラクターもありません。

`FormData` ボディは `multipart/form-data` として送信され、`Response.formData()` / `Request.formData()` は `multipart/form-data` と `application/x-www-form-urlencoded` の両方をパースします。

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

`fetch` は、プラットフォーム自身のネットワークスタックを通じて HTTP および HTTPS リクエストを送信します。iOS と Mac Catalyst では `NSURLSession`、Android では `HttpURLConnection` を使います。そのため、システムのプロキシ設定、TLS 設定、証明書の信頼設定が適用されます。`data:` URL と(`URL.createObjectURL` による)`blob:` URL はネットワークに触れずローカルで応答され、それ以外のスキームは reject されます。Rust の `fetch(request)` は同じスタックと同じ capabilities を通り、URL または `HttpRequest` を受け取り、ボディ全体を保持する `HttpResponse` で解決されます([Networking](../docs/networking.md#from-rust-components))。

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

### Headers、Request、Response

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

### ストリーミング

レスポンスの `body` は、ネットワークからデータが届くのに合わせて満たされるバイトストリームです。そのため、大きなレスポンスや長時間続くレスポンス(ダウンロード、server-sent events、ストリーミングされるモデル出力)を、到着しながら処理できます。1 MiB を超えるデータが未読のまま待機している場合、アプリが再び読み取るまでリクエストは一時停止されます。

```ts
const res = await fetch("https://api.example.com/events");
const lines = res.body!.pipeThrough(new TextDecoderStream());
for await (const chunk of lines) {
  console.log(chunk);
}
```

`ReadableStream` リクエストボディは、ネットワークが要求するたびにチャンク単位でアップロードされます。Fetch Standard の要求どおり、`duplex: "half"` を渡してください。

```ts
await fetch("https://api.example.com/upload", {
  method: "PUT",
  body: blob.stream(),
  duplex: "half",
});
```

<a id="differences-from-browsers"></a>

### ブラウザとの違い

- **CORS もオリジンもありません。** アプリは Web ページではないため、[capabilities](../docs/sandbox-and-capabilities.md) が許可する任意のホストと通信できます。`mode` は受け付けられますが無視されます。
- **禁止ヘッダーはありません。** アプリは `Cookie`、`User-Agent`、`Origin` をはじめ任意のヘッダーを設定できます。`Accept` ヘッダーが指定されていない場合は、`Accept: */*` が送信されます。
- **`redirect: "manual"` は 3xx レスポンスそのものを返し**、不透明なフィルター済みレスポンスの代わりに、そのステータスと `Location` ヘッダーを提供します。`"follow"` はリダイレクトを追跡します(各ホップは capabilities に照らして検査されます)。`"error"` はレスポンスがリダイレクトの場合に reject されます。
- **`FormData` ボディには常に `Content-Type: multipart/form-data; boundary=…` が付きます**。`Content-Type` ヘッダーが設定されていた場合でも同様です。HTTP ライブラリは、デフォルトのコンテンツタイプを設定し、ブラウザを検出した場合にのみそれをクリアすることがよくあります。boundary がないと、サーバーはボディをパースできません。
- **`credentials`、`cache`、`referrer`、`referrerPolicy`、`integrity`、`keepalive`、`priority`** は検証されて `Request` オブジェクトに保持されますが、ネットワークスタックには渡されません。キャッシュと Cookie の処理は、プラットフォームのスタックのものが使われます。
- **Capabilities。** アプリが `nsh.json` で `network` capabilities を宣言している場合(または組み込み側のアプリがそれより少なく許可している場合)、許可されていないホストへのリクエストはネットワークに到達せず、`fetch` は、`code` が `"ERR_ACCESS_DENIED"`、`permission` が `"network"`、`resource` が拒否された URL である `TypeError` で reject されます。[Sandbox and capabilities](../docs/sandbox-and-capabilities.md) を参照してください。
- **エラー。** ネットワーク障害は、メッセージが `Network request failed:` で始まる `TypeError` で reject されます。中止は、シグナルの `reason` で reject されます。

コンポーネントでのデータ読み込みのガイドについては、[Networking](../docs/networking.md) を参照してください。

<a id="streams"></a>

## ストリーム

WHATWG Streams Standard をすべて備えています。読み取りストリーム(デフォルトストリームとバイトストリーム、BYOB リーダー、`tee`、`pipeTo` / `pipeThrough`、`ReadableStream.from`、非同期イテレーション)、書き込みストリーム、変換ストリーム、2 種類のキューイング戦略、そしてテキストエンコーディングストリームです。

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

基盤となる source、sink、transformer のオブジェクト(`UnderlyingDefaultSource`、`UnderlyingByteSource`、`UnderlyingSink`、`Transformer`)と `StreamPipeOptions`(`preventAbort`、`preventCancel`、`preventClose`、`signal`)は標準的な形をしており、その完全な宣言は `globals.d.ts` にあります。

`TextEncoderStream` は、2 つの文字列チャンクの間で途切れたサロゲートペアをまとめて保持し、`TextDecoderStream` は 2 つのバイトチャンクの間で途切れたマルチバイトシーケンスをまとめて保持します。

テキストを行に分割する変換ストリームの例です。

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

## 数値と日付のフォーマット

QuickJS には独自の `Intl` がないため、NSH が Rust でフォーマットを行う実装を追加しています。`Intl.NumberFormat`、`Intl.DateTimeFormat`、`Intl.getCanonicalLocales`、数値と BigInt の `toLocaleString`、そして日付の `toLocaleString` / `toLocaleDateString` / `toLocaleTimeString` で、いずれも同じ `locales` と `options` を受け取ります。これらの宣言は TypeScript 自体のもの(`ES2023` ライブラリ)であるため、`globals.d.ts` には含まれません。

```ts
(1234567.891).toLocaleString();                                              // "1,234,567.891" (en-US)
(1234.5).toLocaleString("de-DE", { style: "currency", currency: "EUR" });  // "1.234,50 €"
new Intl.NumberFormat("en", { notation: "compact" }).format(1_500_000);      // "1.5M"
new Intl.NumberFormat("en", { style: "percent", signDisplay: "exceptZero" }).format(0.042); // "+4%"
new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });   // "09:05"
new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(date); // "Oct 16, 2026, 3:04 PM"
```

`locales` を指定しない場合は、デバイスのロケールが使われます。iOS では `NSLocale.currentLocale` のリージョン形式、Android では `Locale.getDefault()`、`nsh test` では `en-US`、Web ではそれに相当するものです。

- **数値**: `decimal`、`percent`、`currency`(`currencyDisplay` `symbol`、`narrowSymbol`、`code`)、`unit`(一般的な単位: 長さ、質量、時間、データサイズ、温度、速度)の各スタイル。`minimumIntegerDigits`、`minimum` / `maximumFractionDigits`、`minimum` / `maximumSignificantDigits`、`roundingPriority`、`trailingZeroDisplay`、`useGrouping`、`signDisplay`。`standard`、`scientific`、`engineering`、`compact` の各表記(`compactDisplay` `short` / `long`)。丸めは、書かれたとおりの数値に対する、ゼロから遠い方向への四捨五入(half away from zero)です(`1.005` は、ブラウザと同様に `1.01` に丸められます)。`format` は BigInt と 10 進文字列も正確に受け付けます。`formatToParts` と `resolvedOptions` はブラウザと同様に動作します。
- **日付**: `weekday`、`year`、`month`(`numeric`、`2-digit`、`short`、`long`、`narrow`)、`day`、`hour`、`minute`、`second`、`fractionalSecondDigits`、`hour12` / `hourCycle`、`timeZoneName`、`dateStyle` / `timeStyle`。グレゴリオ暦のみです。`timeZone` にはデバイスのタイムゾーン(ブラウザではブラウザのもの)、`UTC`、またはオフセット(`"+08:00"`)を指定できます。それ以外のタイムゾーン名は `RangeError` をスローします(タイムゾーンデータベースはありません)。
- **ロケール**: ロケールデータは、主要な言語(英語、ドイツ語、フランス語、スペイン語、イタリア語、ポルトガル語、オランダ語、ロシア語、スウェーデン語、ポーランド語、トルコ語、インドネシア語、ベトナム語、タイ語、ヒンディー語、中国語、日本語、韓国語)とその地域バリアント(`en-GB`、`en-IN`、`de-CH`、`es-MX`、`pt-PT`、`zh-TW` など)の表であり、CLDR 全体ではないため、細部がブラウザの出力と異なる場合があります。データのないロケールは、次に指定されたロケール、次にデバイスのロケール、最後に `en-US` へとフォールバックします。ロシア語、スウェーデン語、ポーランド語、トルコ語、インドネシア語、ベトナム語、タイ語、ヒンディー語の日付には月名がありません(月は数字で、曜日は英語で書かれます)。数字は常にラテン数字です。
- **ないもの**: `Intl.Collator`(`String.prototype.localeCompare` は QuickJS のもので、ロケールを無視します)、`PluralRules`、`RelativeTimeFormat`、`ListFormat`、`DisplayNames`、`Segmenter`、`Intl.Locale`。`currencySign: "accounting"` と `currencyDisplay: "name"` は `standard` と `code` としてフォーマットされます。

<a id="performance"></a>

## パフォーマンス

これらのクラスはすべてネイティブです。URL のパース、テキストのエンコードとデコード、multipart ボディの構築、ストリームチャンクの移動は、QuickJS ではなく Rust で行われます。それでも、JS からの呼び出しはすべてランタイムへの境界をまたぐため、JS でのバイト単位のループよりも、バッファ全体に対する操作(`res.json()`、`res.text()`、`encoder.encode(s)`)を優先してください。[Performance](../docs/performance.md) を参照してください。
