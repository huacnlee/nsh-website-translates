---
title: "واجهات برمجة التطبيقات العامة"
description: "الكائنات والدوال العامة التي يمتلكها كل تطبيق NSH دون الحاجة إلى استيراد — fetch والتدفقات (streams) وURL والترميز وBlob وFormData والأحداث وإشارات الإلغاء (abort signals) وIntl والمؤقتات وconsole — مُنفَّذة أصلياً بلغة Rust."
order: 15
source_hash: 94d1f5292081a56d
---

# واجهات API العامة

إلى جانب المكتبة القياسية لـ ECMAScript، تحتوي بيئة JS في تطبيق NSH على مجموعة من المتغيرات العامة القياسية: `fetch` مع `Headers` و`Request` و`Response`؛ ومعيار Streams؛ و`URL` و`URLSearchParams`؛ و`TextEncoder` / `TextDecoder`؛ و`Blob` و`File` و`FormData`؛ و`EventTarget` و`Event` و`AbortController`؛ والمؤقتات، و`requestAnimationFrame` و`console`؛ و`Intl` لتنسيق الأرقام والتواريخ. وهي مبنية أصلاً بلغة Rust، وتتبع معايير WHATWG، ولا تحتاج إلى أي استيراد، لذلك تعمل المكتبات الكثيرة المبنية على هذه المعايير (عملاء HTTP، ومساعدات URL والترميز، وأدوات التدفقات) دون أي تعديل.

تسرد هذه الصفحة كل المتغيرات العامة المتاحة للتطبيق. وهي خاصة ببيئة TSX: أما شيفرة Rust فتستخدم مكتبة Rust القياسية وcrates.io وخدمات NSH من `nsh_core::prelude` بدلاً منها (`fetch`، والمؤقتات، والمهام؛ راجع [البناء باستخدام Rust](../docs/rust.md))، وهي مذكورة في عمود Rust من الجدول. تُبنى واجهة المستخدم باستخدام [العناصر](../elements/index.md) ومكونات التطبيق نفسه، وكل ما عدا ذلك يأتي من [الوحدات](./index.md) التي يستوردها التطبيق.

تُولَّد تصريحات TypeScript لكل ما سبق داخل `.nsh/types/nsh/globals.d.ts` (راجع [بنية المشروع](../docs/project-structure.md)).

| المجموعة | المتغيرات العامة | Rust |
|---|---|---|
| [وحدة التحكم والتوقيت](#console-and-timing) | `console`، `performance` | حزمة `log` (`log::info!`، ...)، `nsh_core::time::now()` |
| [المؤقتات والإطارات](#timers-and-frames) | `setTimeout`، `setInterval`، `clearTimeout`، `clearInterval`، `queueMicrotask`، `requestAnimationFrame`، `cancelAnimationFrame` | `set_timeout`، `set_interval`، `timer(delay).await`، `request_animation_frame`، `next_frame().await`، `Spawned::cancel()` |
| [Base64 والأخطاء](#base64-and-errors) | `atob`، `btoa`، `DOMException` | حزمة `base64`، `Result` |
| [الأحداث وإشارات الإلغاء](#events-and-abort-signals) | `EventTarget`، `Event`، `CustomEvent`، `AbortController`، `AbortSignal` | الإشارات (signals) والإغلاقات (closures)؛ `Spawned::cancel()` تنهي مهمة |
| [عناوين URL](#urls) | `URL`، `URLSearchParams` | حزمة `url` |
| [ترميز النصوص](#text-encoding) | `TextEncoder`، `TextDecoder` | `str::as_bytes`، `String::from_utf8` |
| [Blob وبيانات النماذج](#blobs-and-form-data) | `Blob`، `File`، `FormData` | محتويات `Vec<u8>` في `HttpRequest` |
| [Fetch](#fetch) | `fetch`، `Headers`، `Request`، `Response` | `fetch`، `HttpRequest`، `HttpResponse` |
| [تنسيق الأرقام والتواريخ](#number-and-date-formatting) | `Intl.NumberFormat`، `Intl.DateTimeFormat`، `toLocaleString` | `format!` وحزم التنسيق في crates.io، مع `locale()` |
| [التدفقات](#streams) | `ReadableStream`، `WritableStream`، `TransformStream`، والقارئات، والكاتبات، والمتحكمات، `ByteLengthQueuingStrategy`، `CountQueuingStrategy`، `TextEncoderStream`، `TextDecoderStream` | `fetch` تعيد المحتوى كاملاً؛ وتشغّل مهام `background` الاتصالات طويلة الأمد على المنصات الأصلية |

توفر المضيفات الأصلية أيضاً `Buffer` و`crypto` و`process` و`WebSocket`؛ راجع [الوحدات القياسية](./standard-modules.md) لمعرفة وحداتها وأذوناتها وحدود مواردها.

<a id="console-and-timing"></a>

## وحدة التحكم والتوقيت

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

في Rust، تكتب وحدات الماكرو في حزمة `log` (`log::info!`، `log::warn!`، ...) في السجل نفسه، وتظهر أيضاً في طرفية `nsh run`. تكتب `console` سطراً واحداً لكل استدعاء في سجل وقت التشغيل (الهدف `js`): `log` و`info` بمستوى info، و`debug` و`warn` و`error` بمستوياتها الخاصة. تُضم الوسائط بمسافات؛ وتُطبع السلاسل النصية كما هي، والأخطاء مع تتبع المكدس، والدوال بصيغة `[Function name]`، والكائنات والمصفوفات بصيغة JSON (مع الرجوع إلى `String(value)` في حالة الدورات).

وأثناء اتصال جهاز بخادم التطوير، تظهر أسطر سجله في الطرفية التي تشغّل `nsh run` / `nsh dev` مسبوقة باسم الجهاز؛ راجع [خادم التطوير وتصحيح الأخطاء](../docs/dev-server-and-debugging.md).

> [!NOTE]
> لا توجد إلا الدوال الخمس المذكورة أعلاه. لا وجود لـ `console.table` ولا `console.group` ولا `console.time` ولا `console.assert`، ولا لاستبدالات التنسيق `%s` / `%o`.

`performance.now()` هي الساعة التي يمررها `requestAnimationFrame` إلى دوال الاستدعاء الخاصة به؛ وفي Rust، تمثل `nsh_core::time::now()` و`Instant` التي تعيدها `request_animation_frame` و`next_frame()` هذه الساعة نفسها. ليس لـ `performance` أي أعضاء آخرين.

<a id="timers-and-frames"></a>

## المؤقتات والإطارات

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

في Rust: تعيد `set_timeout(delay, f)` و`set_interval(period, f)` مقبضاً من النوع `Spawned` يلغيها عبر `cancel()`، وتنتظر `timer(delay).await` داخل مهمة، وتعطي `request_animation_frame(f)` / `next_frame().await` وقت الإطار التالي؛ وتنتهي كلها بانتهاء المكوّن الذي أنشأها. تعمل المؤقتات كما في المتصفحات: التأخير المفقود أو السالب أو غير المنتهي يُعامل على أنه 0، والمعرّف المُعاد عدد صحيح موجب، وإلغاء معرّف غير معروف لا يفعل شيئاً. يجب أن يكون `handler` دالة (لا تُقيَّم معالجات السلاسل النصية). ولا تقيّد المؤقتات التأخيرات المتداخلة بحد أدنى قدره 4 مللي ثانية.

> [!WARNING]
> الوسائط الإضافية `...args` في `setTimeout` / `setInterval` مُصرَّح بها لكنها لا تُمرَّر حالياً إلى المعالج. استخدم إغلاقاً (closure) بدلاً منها: `setTimeout(() => save(id), 100)`.

تعمل دوال الاستدعاء الخاصة بـ `requestAnimationFrame` مرة واحدة، عند الإطار التالي الذي ينتجه المحرك، وكلها بوقت `performance.now()` نفسه. أما دالة الاستدعاء التي تطلب إطاراً آخر فتُستدعى عند الإطار الذي يليه، وبذلك تعمل الحلقة المعتادة:

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
> تشغيل رسم متحرك من JS إطاراً بإطار يعني تنفيذ شيفرتك في كل إطار داخل QuickJS. للرسوم المتحركة للأنماط والتحويلات، فضّل [واجهة الرسوم المتحركة في `nsh`](./nsh.md#animation)، التي تعمل محركاتها أصلياً دون الرجوع إلى JS (راجع [الرسوم المتحركة](../docs/animation.md)).

<a id="base64-and-errors"></a>

## Base64 والأخطاء

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

تحوّل `atob` / `btoa` بين السلاسل الثنائية وBase64 كما في المتصفحات. أما `DOMException` فهو الخطأ الذي ترفض به العمليات الملغاة: `AbortController.abort()` بلا سبب يعطي `DOMException` باسم `"AbortError"`، و`AbortSignal.timeout` يعطي واحداً باسم `"TimeoutError"`.

<a id="events-and-abort-signals"></a>

## الأحداث وإشارات الإلغاء

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

هذه هي أصناف DOM Standard مع اختلاف واحد: لا توجد شجرة، لذلك يُرسَل الحدث إلى هدفه فقط. تعمل مستمعات الالتقاط (capture) أولاً، ثم بقية المستمعات، كما يفعل DOM عند الهدف؛ ولا يؤثر `bubbles` في شيء. يمكن اشتقاق هذه الأصناف، مما يجعل `EventTarget` باعث أحداث صغيراً:

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

لا علاقة لهذه الأحداث بأحداث العناصر (`onPress`، `onChange`، ...)، فهذه الأخيرة خصائص (props)؛ راجع [اللمس والإيماءات](../docs/touch-and-gestures.md).

يلغي `AbortSignal` طلبات `fetch` وأنابيب التدفقات، ويزيل المستمعات المضافة عبر `{ signal }`. وفي Rust، يعمل الطلب داخل مهمة، وإلغاء المهمة يلغيه:

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

## عناوين URL

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

تُحلَّل عناوين URL وفق URL Standard. وخاصية `searchParams` في عنوان URL حية في الاتجاهين: تغيير المعاملات يعيد كتابة الاستعلام، وتعيين `search` أو `href` يعيد تحليله. وتستخدم شيفرة Rust حزمة `url`، التي تتبع المعيار نفسه:

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

تتكرر مكررات `URLSearchParams` (و`Headers` و`FormData`) على لقطة تُؤخذ عند إنشاء المكرر، وفيها دوال مساعدة للمكررات (`map`، `filter`، `toArray`، ...).

تعيد `URL.createObjectURL(blob)` عنوان URL من النوع `blob:` يمكن لـ `fetch` (مع `GET`) قراءته إلى أن يُستدعى `revokeObjectURL`. ويعرضه `<Image>` عبر `src` أو `placeholder` ([Image](../elements/image.md)).

<a id="text-encoding"></a>

## ترميز النصوص

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

يعرف `TextDecoder` ترميزات أقل مما يعرفه المتصفح: UTF-8 وUTF-16LE وUTF-16BE وwindows-1252 (التي تشير إليها أيضاً التسميات `latin1` و`iso-8859-1` و`ascii` وما شابهها، كما يحدد Encoding Standard). أما التسميات الأخرى فتُطلق `RangeError`. ومع `{ stream: true }`، يُحتفظ بالتسلسل متعدد البايتات المقطوع بين جزأين للاستدعاء التالي.

<a id="blobs-and-form-data"></a>

## Blob وبيانات النماذج

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

يحتفظ الـ Blob ببايتاته في الذاكرة، وتشاركها `slice` بدلاً من نسخها. الـ Blob قيم في الذاكرة فقط: لا يوجد وصول إلى نظام الملفات خلف `File`، ولا يملك `FormData` دالة بانية من عنصر نموذج.

يُرسَل محتوى `FormData` بصيغة `multipart/form-data`، وتحلل `Response.formData()` / `Request.formData()` كلاً من `multipart/form-data` و`application/x-www-form-urlencoded`.

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

يرسل `fetch` طلبات HTTP وHTTPS عبر حزمة الشبكة الخاصة بالمنصة: `NSURLSession` على iOS وMac Catalyst، و`HttpURLConnection` على Android. لذلك تسري إعدادات الوكيل (proxy) في النظام وإعدادات TLS والثقة بالشهادات. أما عناوين `data:` وعناوين `blob:` (من `URL.createObjectURL`) فيُجاب عنها محلياً دون لمس الشبكة؛ وأي مخطط آخر يُرفض. وتمر `fetch(request)` في Rust عبر الحزمة نفسها والقدرات نفسها، وتقبل عنوان URL أو `HttpRequest`، وتكتمل بـ `HttpResponse` يحمل المحتوى كاملاً ([الشبكات](../docs/networking.md#from-rust-components)):

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

### Headers وRequest وResponse

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

### البث

إن `body` في الاستجابة تدفق بايتات يمتلئ كلما وصلت البيانات من الشبكة، لذلك يمكن معالجة الاستجابات الكبيرة أو طويلة الأمد (التنزيلات، وserver-sent events، ومخرجات النماذج المبثوثة) أثناء وصولها. وعندما ينتظر أكثر من 1 MiB دون قراءة، يُوقَف الطلب مؤقتاً إلى أن يقرأ التطبيق مجدداً.

```ts
const res = await fetch("https://api.example.com/events");
const lines = res.body!.pipeThrough(new TextDecoderStream());
for await (const chunk of lines) {
  console.log(chunk);
}
```

يُرفَع محتوى طلب `ReadableStream` جزءاً بجزء كلما طلبته الشبكة؛ مرّر `duplex: "half"` كما يشترط Fetch Standard:

```ts
await fetch("https://api.example.com/upload", {
  method: "PUT",
  body: blob.stream(),
  duplex: "half",
});
```

<a id="differences-from-browsers"></a>

### الاختلافات عن المتصفحات

- **لا CORS ولا origin.** التطبيق ليس صفحة ويب: يمكنه التواصل مع أي مضيف تسمح به [قدراته](../docs/sandbox-and-capabilities.md). ويُقبل `mode` لكن يُتجاهَل.
- **لا ترويسات محظورة.** يمكن للتطبيق تعيين `Cookie` و`User-Agent` و`Origin` وأي ترويسة أخرى. وعندما لا تُعطى ترويسة `Accept`، يُرسَل `Accept: */*`.
- **`redirect: "manual"` يسلّم استجابة 3xx نفسها**، بحالتها وترويسة `Location`، بدلاً من استجابة معتمة مفلترة. أما `"follow"` فيتبع عمليات إعادة التوجيه (يُتحقق من كل قفزة مقابل القدرات)؛ وفي `"error"` يُرفض الطلب عندما تكون الاستجابة إعادة توجيه.
- **محتوى `FormData` يحصل دائماً على `Content-Type: multipart/form-data; boundary=…`**، حتى لو عُيّنت ترويسة `Content-Type`. غالباً ما تعيّن مكتبات HTTP نوع محتوى افتراضياً ولا تمسحه إلا عندما تكتشف أنها تعمل في متصفح؛ وبدون الحد (boundary) لا يستطيع الخادم تحليل المحتوى.
- **`credentials` و`cache` و`referrer` و`referrerPolicy` و`integrity` و`keepalive` و`priority`** يُتحقق منها وتُحفظ في الكائن `Request`، لكنها لا تُمرَّر إلى حزمة الشبكة: فالتخزين المؤقت ومعالجة ملفات تعريف الارتباط يتبعان حزمة المنصة.
- **القدرات.** عندما يعلن التطبيق قدرات `network` في `nsh.json` (أو يمنح التطبيق المضيف قدراً أقل)، فإن الطلب إلى مضيف غير مسموح به لا يصل إلى الشبكة أبداً، ويُرفض `fetch` بـ `TypeError` تكون `code` فيه `"ERR_ACCESS_DENIED"`، و`permission` `"network"`، و`resource` عنوان URL المرفوض. راجع [العزل والقدرات](../docs/sandbox-and-capabilities.md).
- **الأخطاء.** تُرفَض إخفاقات الشبكة بـ `TypeError` تبدأ رسالته بـ `Network request failed:`؛ وتُرفَض عمليات الإلغاء بـ `reason` الخاصة بالإشارة.

راجع [الشبكات](../docs/networking.md) للاطلاع على دليل تحميل البيانات في المكونات.

<a id="streams"></a>

## التدفقات

معيار WHATWG Streams كاملاً: التدفقات القابلة للقراءة (الافتراضية وتدفقات البايتات، وقارئات BYOB، و`tee`، و`pipeTo` / `pipeThrough`، و`ReadableStream.from`، والتكرار غير المتزامن)، والتدفقات القابلة للكتابة، وتدفقات التحويل، واستراتيجيتا الطابور، وتدفقات ترميز النصوص.

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

كائنات المصدر والمصرف والمحوّل الأساسية (`UnderlyingDefaultSource`، `UnderlyingByteSource`، `UnderlyingSink`، `Transformer`) و`StreamPipeOptions` (`preventAbort`، `preventCancel`، `preventClose`، `signal`) لها الأشكال القياسية؛ وتصريحاتها الكاملة في `globals.d.ts`.

يُبقي `TextEncoderStream` الزوج البديل (surrogate pair) المقطوع بين جزأين نصيين معاً، ويفعل `TextDecoderStream` ذلك مع التسلسل متعدد البايتات المقطوع بين جزأين من البايتات.

تدفق تحويل يقسّم النص إلى أسطر:

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

## تنسيق الأرقام والتواريخ

لا يملك QuickJS كائن `Intl` خاصاً به؛ وتضيف NSH واحداً يجري التنسيق فيه بلغة Rust: `Intl.NumberFormat` و`Intl.DateTimeFormat` و`Intl.getCanonicalLocales`، إضافة إلى `toLocaleString` للأرقام وأعداد BigInt، و`toLocaleString` / `toLocaleDateString` / `toLocaleTimeString` للتواريخ، وهذه تقبل `locales` و`options` نفسيهما. تصريحاتها هي تصريحات TypeScript نفسها (مكتبة `ES2023`)، لذلك ليست في `globals.d.ts`.

```ts
(1234567.891).toLocaleString();                                              // "1,234,567.891" (en-US)
(1234.5).toLocaleString("de-DE", { style: "currency", currency: "EUR" });  // "1.234,50 €"
new Intl.NumberFormat("en", { notation: "compact" }).format(1_500_000);      // "1.5M"
new Intl.NumberFormat("en", { style: "percent", signDisplay: "exceptZero" }).format(0.042); // "+4%"
new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });   // "09:05"
new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(date); // "Oct 16, 2026, 3:04 PM"
```

بدون `locales`، تُستخدم لغة الجهاز: تنسيق منطقته (iOS `NSLocale.currentLocale`، Android `Locale.getDefault()`)، و`en-US` في `nsh test` وعلى الويب.

- **الأرقام**: الأنماط `decimal` و`percent` و`currency` (`currencyDisplay` `symbol`، `narrowSymbol`، `code`) و`unit` (الوحدات الشائعة: الأطوال، والكتل، والمدد، وأحجام البيانات، ودرجات الحرارة، والسرعات)؛ و`minimumIntegerDigits`، و`minimum` / `maximumFractionDigits`، و`minimum` / `maximumSignificantDigits`، و`roundingPriority`، و`trailingZeroDisplay`، و`useGrouping`، و`signDisplay`؛ والتدوين `standard` و`scientific` و`engineering` و`compact` (`compactDisplay` `short` / `long`). التقريب يكون بعيداً عن الصفر عند المنتصف، على الرقم كما كُتب (`1.005` يُقرَّب إلى `1.01`، كما في المتصفحات). كما يقبل `format` أعداد BigInt والسلاسل العشرية، بدقة تامة. ويعمل `formatToParts` و`resolvedOptions` كما في المتصفحات.
- **التواريخ**: `weekday` و`year` و`month` (`numeric` و`2-digit` و`short` و`long` و`narrow`) و`day` و`hour` و`minute` و`second` و`fractionalSecondDigits` و`hour12` / `hourCycle` و`timeZoneName` و`dateStyle` / `timeStyle`، في التقويم الميلادي. يأخذ `timeZone` منطقة الجهاز الزمنية (وفي المتصفح، منطقة المتصفح)، أو `UTC` أو إزاحة (`"+08:00"`)؛ أما أسماء المناطق الأخرى فتُطلق `RangeError` (لا توجد قاعدة بيانات للمناطق الزمنية).
- **اللغات المحلية**: بيانات اللغات جدول للغات الشائعة (الإنجليزية، والألمانية، والفرنسية، والإسبانية، والإيطالية، والبرتغالية، والهولندية، والروسية، والسويدية، والبولندية، والتركية، والإندونيسية، والفيتنامية، والتايلاندية، والهندية، والصينية، واليابانية، والكورية) مع متغيراتها الإقليمية (`en-GB`، `en-IN`، `de-CH`، `es-MX`، `pt-PT`، `zh-TW`، ...)، وليست CLDR بأكملها، لذلك قد تختلف التفاصيل عن مخرجات المتصفح. وإذا لم تتوفر بيانات للغة، يُرجَع إلى اللغة التالية المطلوبة، ثم إلى لغة الجهاز، ثم `en-US`؛ وتواريخ الروسية والسويدية والبولندية والتركية والإندونيسية والفيتنامية والتايلاندية والهندية ليس لها أسماء أشهر (تُكتب أشهرها أرقاماً، وأيام أسبوعها بالإنجليزية). الأرقام لاتينية دائماً.
- **غير الموجود**: `Intl.Collator` (`String.prototype.localeCompare` تابعة لـ QuickJS، وتتجاهل اللغة المحلية)، و`PluralRules`، و`RelativeTimeFormat`، و`ListFormat`، و`DisplayNames`، و`Segmenter`، و`Intl.Locale`؛ ويُنسَّق `currencySign: "accounting"` و`currencyDisplay: "name"` بصيغة `standard` و`code`.

<a id="performance"></a>

## الأداء

كل هذه الأصناف أصلية: تحليل عناوين URL، وترميز النصوص وفك ترميزها، وبناء محتويات multipart، ونقل أجزاء التدفقات، كلها تجري في Rust لا في QuickJS. ومع ذلك، فكل استدعاء من JS يعبر إلى وقت التشغيل، لذلك فضّل العمليات على المخزن المؤقت كاملاً (`res.json()`، `res.text()`، `encoder.encode(s)`) على الحلقات بايتاً بايتاً في JS. راجع [الأداء](../docs/performance.md).
