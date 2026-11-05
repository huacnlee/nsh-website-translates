---
title: "Global APIs"
description: "वे globals जो हर NSH ऐप में बिना किसी import के उपलब्ध होते हैं — fetch, streams, URL, encoding, Blob और FormData, events और abort signals, Intl, timers और console — जिन्हें Rust में नेटिव रूप से implement किया गया है।"
order: 15
source_hash: 94d1f5292081a56d
---

# ग्लोबल APIs

ECMAScript स्टैंडर्ड लाइब्रेरी के अलावा, NSH ऐप के JS एनवायरनमेंट में स्टैंडर्ड ग्लोबल्स का एक सेट होता है: `fetch`, जिसमें `Headers`, `Request` और `Response` हैं; Streams Standard; `URL` और `URLSearchParams`; `TextEncoder` / `TextDecoder`; `Blob`, `File` और `FormData`; `EventTarget`, `Event` और `AbortController`; टाइमर, `requestAnimationFrame` और `console`; और नंबर तथा तारीख की फ़ॉर्मैटिंग के लिए `Intl`। ये Rust में नेटिव रूप से लागू हैं, WHATWG स्टैंडर्ड का पालन करते हैं और इन्हें import करने की ज़रूरत नहीं होती, इसलिए इन स्टैंडर्ड पर बनी कई JavaScript लाइब्रेरी (HTTP क्लाइंट, URL और एन्कोडिंग हेल्पर, स्ट्रीम यूटिलिटी) बिना बदलाव के काम करती हैं।

यह पेज ऐप के पास मौजूद हर ग्लोबल की सूची देता है। ये TSX एनवायरनमेंट के हैं: Rust कोड इनकी जगह Rust की standard library, crates.io और `nsh_core::prelude` की NSH सेवाओं (`fetch`, टाइमर, टास्क; देखें [Rust के साथ बनाना](../docs/rust.md)) का उपयोग करता है, जो तालिका के Rust कॉलम में दी गई हैं। UI [एलिमेंट्स](../elements/index.md) और ऐप के अपने कंपोनेंट से बनता है, और ऐप जो कुछ और उपयोग करता है वह उन [मॉड्यूल](./index.md) से आता है जिन्हें वह import करता है।

इन सभी के TypeScript डिक्लेरेशन `.nsh/types/nsh/globals.d.ts` में जनरेट होते हैं (देखें [प्रोजेक्ट संरचना](../docs/project-structure.md))।

| समूह | ग्लोबल्स | Rust |
|---|---|---|
| [Console और टाइमिंग](#console-and-timing) | `console`, `performance` | `log` crate (`log::info!`, ...), `nsh_core::time::now()` |
| [टाइमर और फ़्रेम](#timers-and-frames) | `setTimeout`, `setInterval`, `clearTimeout`, `clearInterval`, `queueMicrotask`, `requestAnimationFrame`, `cancelAnimationFrame` | `set_timeout`, `set_interval`, `timer(delay).await`, `request_animation_frame`, `next_frame().await`, `Spawned::cancel()` |
| [Base64 और एरर](#base64-and-errors) | `atob`, `btoa`, `DOMException` | `base64` crate, `Result` |
| [इवेंट और abort सिग्नल](#events-and-abort-signals) | `EventTarget`, `Event`, `CustomEvent`, `AbortController`, `AbortSignal` | सिग्नल और क्लोज़र; `Spawned::cancel()` टास्क को समाप्त करता है |
| [URL](#urls) | `URL`, `URLSearchParams` | `url` crate |
| [टेक्स्ट एन्कोडिंग](#text-encoding) | `TextEncoder`, `TextDecoder` | `str::as_bytes`, `String::from_utf8` |
| [Blob और फ़ॉर्म डेटा](#blobs-and-form-data) | `Blob`, `File`, `FormData` | `HttpRequest` की `Vec<u8>` बॉडी |
| [Fetch](#fetch) | `fetch`, `Headers`, `Request`, `Response` | `fetch`, `HttpRequest`, `HttpResponse` |
| [नंबर और तारीख की फ़ॉर्मैटिंग](#number-and-date-formatting) | `Intl.NumberFormat`, `Intl.DateTimeFormat`, `toLocaleString` | `format!` और crates.io के फ़ॉर्मैटिंग crate, `locale()` के साथ |
| [Streams](#streams) | `ReadableStream`, `WritableStream`, `TransformStream`, रीडर, राइटर, कंट्रोलर, `ByteLengthQueuingStrategy`, `CountQueuingStrategy`, `TextEncoderStream`, `TextDecoderStream` | `fetch` पूरी बॉडी देता है; `background` टास्क नेटिव टारगेट पर लंबे समय तक चलने वाले कनेक्शन चलाते हैं |

नेटिव होस्ट `Buffer`, `crypto`, `process` और `WebSocket` भी प्रदान करते हैं; उनके मॉड्यूल, अनुमतियों और संसाधन सीमाओं के लिए देखें [स्टैंडर्ड मॉड्यूल](./standard-modules.md)।

<a id="console-and-timing"></a>

## Console और टाइमिंग

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

Rust में, `log` crate के मैक्रो (`log::info!`, `log::warn!`, ...) उसी लॉग में लिखते हैं, और वे `nsh run` के टर्मिनल में भी दिखते हैं। `console` हर कॉल पर रनटाइम के लॉग (target `js`) में एक पंक्ति लिखता है: `log` और `info` info स्तर पर, `debug`, `warn` और `error` अपने-अपने स्तर पर। आर्गुमेंट स्पेस से जोड़े जाते हैं; स्ट्रिंग जैसी की तैसी छपती हैं, एरर अपने स्टैक के साथ, फ़ंक्शन `[Function name]` के रूप में, और ऑब्जेक्ट तथा ऐरे JSON के रूप में (चक्र होने पर `String(value)` पर वापस जाकर)।

जब कोई डिवाइस dev server से जुड़ा होता है, तो उसकी लॉग पंक्तियाँ `nsh run` / `nsh dev` चलाने वाले टर्मिनल में डिवाइस के नाम के उपसर्ग के साथ दिखती हैं; देखें [Dev server और डीबगिंग](../docs/dev-server-and-debugging.md)।

> [!NOTE]
> केवल ऊपर दिए गए पाँच मेथड मौजूद हैं। `console.table`, `console.group`, `console.time` या `console.assert` नहीं हैं, और `%s` / `%o` फ़ॉर्मैट सब्स्टिट्यूशन भी नहीं हैं।

`performance.now()` वह क्लॉक है जिसे `requestAnimationFrame` अपने कॉलबैक को देता है; Rust में, `nsh_core::time::now()` और `request_animation_frame` तथा `next_frame()` से मिलने वाले `Instant` वही क्लॉक हैं। `performance` का कोई अन्य सदस्य नहीं है।

<a id="timers-and-frames"></a>

## टाइमर और फ़्रेम

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

Rust: `set_timeout(delay, f)` और `set_interval(period, f)` एक `Spawned` हैंडल लौटाते हैं जिसका `cancel()` उन्हें साफ़ करता है, `timer(delay).await` एक टास्क में प्रतीक्षा करता है, और `request_animation_frame(f)` / `next_frame().await` अगले फ़्रेम का समय देते हैं; ये सभी उस कंपोनेंट के साथ समाप्त हो जाते हैं जिसने इन्हें बनाया। टाइमर ब्राउज़र की तरह व्यवहार करते हैं: अनुपस्थित, ऋणात्मक या अनंत (non-finite) देरी को 0 माना जाता है, लौटाया गया id एक धनात्मक पूर्णांक होता है, और अज्ञात id को साफ़ करने पर कुछ नहीं होता। `handler` एक फ़ंक्शन होना चाहिए (स्ट्रिंग हैंडलर का मूल्यांकन नहीं किया जाता)। टाइमर नेस्टेड देरी को 4 ms तक सीमित नहीं करते।

> [!WARNING]
> `setTimeout` / `setInterval` के अतिरिक्त `...args` घोषित हैं, पर फ़िलहाल हैंडलर को नहीं दिए जाते। इसके बजाय क्लोज़र का उपयोग करें: `setTimeout(() => save(id), 100)`।

`requestAnimationFrame` कॉलबैक एक बार चलते हैं, इंजन द्वारा बनाए गए अगले फ़्रेम पर, सभी एक ही `performance.now()` समय के साथ। जो कॉलबैक एक और फ़्रेम माँगता है उसे अगले फ़्रेम पर बुलाया जाता है, इसलिए सामान्य लूप काम करता है:

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
> JS से फ़्रेम-दर-फ़्रेम एनिमेशन चलाने पर QuickJS में आपका कोड हर फ़्रेम पर चलता है। स्टाइल और ट्रांसफ़ॉर्म के एनिमेशन के लिए [`nsh` के एनिमेशन API](./nsh.md#animation) को प्राथमिकता दें, जिसके ड्राइवर JS में वापस कॉल किए बिना नेटिव रूप से चलते हैं (देखें [एनिमेशन](../docs/animation.md))।

<a id="base64-and-errors"></a>

## Base64 और एरर

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

`atob` / `btoa` ब्राउज़र की तरह बाइनरी स्ट्रिंग और Base64 के बीच रूपांतरण करते हैं। `DOMException` वह है जिसके साथ रद्द किए गए ऑपरेशन reject होते हैं: बिना कारण वाला `AbortController.abort()` `"AbortError"` नाम का `DOMException` देता है, और `AbortSignal.timeout` `"TimeoutError"` नाम वाला।

<a id="events-and-abort-signals"></a>

## इवेंट और abort सिग्नल

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

ये DOM Standard की क्लासें हैं, एक अंतर के साथ: कोई ट्री नहीं है, इसलिए इवेंट केवल अपने target पर भेजा जाता है। पहले capture लिस्नर चलते हैं, फिर अन्य, जैसा DOM target पर करता है; `bubbles` का कोई प्रभाव नहीं होता। क्लासों को subclass किया जा सकता है, जिससे `EventTarget` एक छोटा इवेंट एमिटर बन जाता है:

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

ये इवेंट एलिमेंट्स के इवेंट (`onPress`, `onChange`, ...) से असंबंधित हैं, जो props हैं; देखें [टच और जेस्चर](../docs/touch-and-gestures.md)।

`AbortSignal` `fetch` अनुरोधों और स्ट्रीम पाइप को रद्द करता है, और `{ signal }` से जोड़े गए लिस्नर हटाता है। Rust में, अनुरोध एक टास्क में चलता है, और टास्क को रद्द करने से वह रद्द हो जाता है:

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

URL को URL Standard के अनुसार पार्स किया जाता है। URL का `searchParams` दोनों दिशाओं में लाइव है: पैरामीटर बदलने से क्वेरी फिर से लिखी जाती है, और `search` या `href` सेट करने पर वह दोबारा पार्स होता है। Rust कोड `url` crate का उपयोग करता है, जो उसी स्टैंडर्ड का पालन करता है:

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

`URLSearchParams` के इटरेटर (और `Headers` तथा `FormData` के) इटरेटर बनाए जाने के समय लिए गए स्नैपशॉट पर इटरेट करते हैं, और उनमें इटरेटर हेल्पर (`map`, `filter`, `toArray`, ...) होते हैं।

`URL.createObjectURL(blob)` एक `blob:` URL लौटाता है जिसे `revokeObjectURL` के कॉल होने तक `fetch` (`GET` के साथ) पढ़ सकता है। `<Image>` ऐसे URL को अपने `src` या `placeholder` के रूप में दिखाता है ([Image](../elements/image.md))।

<a id="text-encoding"></a>

## टेक्स्ट एन्कोडिंग

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

`TextDecoder` ब्राउज़र की तुलना में कम एन्कोडिंग जानता है: UTF-8, UTF-16LE, UTF-16BE और windows-1252 (जिसे `latin1`, `iso-8859-1`, `ascii` जैसे लेबल भी दर्शाते हैं, जैसा Encoding Standard निर्दिष्ट करता है)। अन्य लेबल `RangeError` फेंकते हैं। `{ stream: true }` के साथ, दो चंक के बीच कटा हुआ मल्टी-बाइट अनुक्रम अगली कॉल के लिए रख लिया जाता है।

<a id="blobs-and-form-data"></a>

## Blob और फ़ॉर्म डेटा

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

Blob अपने बाइट मेमोरी में रखता है, और `slice` उन्हें कॉपी करने के बजाय साझा करता है। Blob केवल इन-मेमोरी वैल्यू हैं: `File` के पीछे कोई फ़ाइल सिस्टम एक्सेस नहीं है, और `FormData` में फ़ॉर्म एलिमेंट से बनाने वाला कोई कंस्ट्रक्टर नहीं है।

`FormData` बॉडी `multipart/form-data` के रूप में भेजी जाती है, और `Response.formData()` / `Request.formData()` `multipart/form-data` और `application/x-www-form-urlencoded` दोनों को पार्स करते हैं।

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

`fetch` HTTP और HTTPS अनुरोध प्लेटफ़ॉर्म के अपने नेटवर्क स्टैक के माध्यम से भेजता है: iOS और Mac Catalyst पर `NSURLSession`, Android पर `HttpURLConnection`। इसलिए सिस्टम की प्रॉक्सी सेटिंग, TLS कॉन्फ़िगरेशन और सर्टिफ़िकेट ट्रस्ट लागू होते हैं। `data:` URL और `blob:` URL (`URL.createObjectURL` से) का उत्तर नेटवर्क को छुए बिना स्थानीय रूप से दिया जाता है; कोई भी अन्य scheme reject होता है। Rust का `fetch(request)` उसी स्टैक और उन्हीं capabilities से गुज़रता है, URL या `HttpRequest` लेता है, और पूरी बॉडी वाले `HttpResponse` के साथ resolve होता है ([नेटवर्किंग](../docs/networking.md#from-rust-components)):

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

### Headers, Request और Response

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

### स्ट्रीमिंग

Response का `body` एक बाइट स्ट्रीम है जो नेटवर्क से डेटा आने के साथ भरती जाती है, इसलिए बड़े या लंबे समय तक चलने वाले response (डाउनलोड, server-sent events, स्ट्रीम किया गया मॉडल आउटपुट) को आने के दौरान ही प्रोसेस किया जा सकता है। जब 1 MiB से अधिक डेटा बिना पढ़े प्रतीक्षा में हो, तो ऐप के दोबारा पढ़ने तक अनुरोध रोक दिया जाता है।

```ts
const res = await fetch("https://api.example.com/events");
const lines = res.body!.pipeThrough(new TextDecoderStream());
for await (const chunk of lines) {
  console.log(chunk);
}
```

`ReadableStream` अनुरोध बॉडी चंक-दर-चंक अपलोड की जाती है, जैसे-जैसे नेटवर्क माँगता है; `duplex: "half"` पास करें जैसा Fetch Standard की आवश्यकता है:

```ts
await fetch("https://api.example.com/upload", {
  method: "PUT",
  body: blob.stream(),
  duplex: "half",
});
```

<a id="differences-from-browsers"></a>

### ब्राउज़र से अंतर

- **न CORS, न origin।** ऐप कोई वेब पेज नहीं है: वह किसी भी ऐसे होस्ट से बात कर सकता है जिसकी उसकी [capabilities](../docs/sandbox-and-capabilities.md) अनुमति देती हैं। `mode` स्वीकार किया जाता है और अनदेखा कर दिया जाता है।
- **कोई forbidden headers नहीं।** ऐप `Cookie`, `User-Agent`, `Origin` और कोई भी अन्य header सेट कर सकता है। जब कोई `Accept` header नहीं दिया जाता, तो `Accept: */*` भेजा जाता है।
- **`redirect: "manual"` 3xx response को स्वयं देता है**, उसके status और `Location` header के साथ, किसी opaque filtered response के बजाय। `"follow"` रीडायरेक्ट का पालन करता है (हर hop को capabilities के विरुद्ध जाँचा जाता है); `"error"` तब reject होता है जब response एक रीडायरेक्ट हो।
- **`FormData` बॉडी को हमेशा `Content-Type: multipart/form-data; boundary=…` मिलता है**, भले ही `Content-Type` header सेट किया गया हो। HTTP लाइब्रेरी अक्सर एक डिफ़ॉल्ट content type सेट करती हैं और उसे केवल वहीं हटाती हैं जहाँ वे ब्राउज़र पहचानती हैं; boundary के बिना सर्वर बॉडी को पार्स नहीं कर सकता।
- **`credentials`, `cache`, `referrer`, `referrerPolicy`, `integrity`, `keepalive` और `priority`** का सत्यापन किया जाता है और उन्हें `Request` ऑब्जेक्ट पर रखा जाता है, पर उन्हें नेटवर्क स्टैक को नहीं दिया जाता: कैशिंग और कुकी हैंडलिंग प्लेटफ़ॉर्म के स्टैक की ही होती है।
- **Capabilities।** जब ऐप `nsh.json` में `network` capabilities घोषित करता है (या एम्बेड करने वाला ऐप कम अनुमति देता है), तो अनुमति-रहित होस्ट को किया गया अनुरोध कभी नेटवर्क तक नहीं पहुँचता और `fetch` एक `TypeError` के साथ reject होता है जिसका `code` `"ERR_ACCESS_DENIED"` है, `permission` `"network"` है और `resource` अस्वीकृत URL है। देखें [सैंडबॉक्स और capabilities](../docs/sandbox-and-capabilities.md)।
- **एरर।** नेटवर्क विफलताएँ `TypeError` के साथ reject होती हैं जिसका संदेश `Network request failed:` से शुरू होता है; abort सिग्नल के `reason` के साथ reject होते हैं।

कंपोनेंट में डेटा लोड करने की गाइड के लिए देखें [नेटवर्किंग](../docs/networking.md)।

## Streams

पूरा WHATWG Streams Standard: readable streams (default और byte streams, BYOB रीडर, `tee`, `pipeTo` / `pipeThrough`, `ReadableStream.from`, async iteration), writable streams, transform streams, दो queuing strategies और टेक्स्ट एन्कोडिंग streams।

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

अंतर्निहित source, sink और transformer ऑब्जेक्ट (`UnderlyingDefaultSource`, `UnderlyingByteSource`, `UnderlyingSink`, `Transformer`) और `StreamPipeOptions` (`preventAbort`, `preventCancel`, `preventClose`, `signal`) की मानक आकृतियाँ हैं; उनके पूरे डिक्लेरेशन `globals.d.ts` में हैं।

`TextEncoderStream` दो स्ट्रिंग चंक के बीच कटे सरोगेट पेयर को साथ रखता है, और `TextDecoderStream` दो बाइट चंक के बीच कटे मल्टी-बाइट अनुक्रम को।

टेक्स्ट को पंक्तियों में बाँटने वाली एक transform stream:

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

## नंबर और तारीख की फ़ॉर्मैटिंग

QuickJS में अपना कोई `Intl` नहीं है; NSH एक जोड़ता है, जो Rust में फ़ॉर्मैट करता है: `Intl.NumberFormat`, `Intl.DateTimeFormat` और `Intl.getCanonicalLocales`, तथा नंबर और BigInt का `toLocaleString` और तारीखों के `toLocaleString` / `toLocaleDateString` / `toLocaleTimeString`, जो वही `locales` और `options` लेते हैं। इनके डिक्लेरेशन TypeScript के अपने हैं (`ES2023` लाइब्रेरी), इसलिए ये `globals.d.ts` में नहीं हैं।

```ts
(1234567.891).toLocaleString();                                              // "1,234,567.891" (en-US)
(1234.5).toLocaleString("de-DE", { style: "currency", currency: "EUR" });  // "1.234,50 €"
new Intl.NumberFormat("en", { notation: "compact" }).format(1_500_000);      // "1.5M"
new Intl.NumberFormat("en", { style: "percent", signDisplay: "exceptZero" }).format(0.042); // "+4%"
new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });   // "09:05"
new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(date); // "Oct 16, 2026, 3:04 PM"
```

`locales` के बिना, डिवाइस का locale उपयोग होता है: उसका region format (iOS पर `NSLocale.currentLocale`, Android पर `Locale.getDefault()`), `nsh test` में `en-US` और वेब पर।

- **नंबर**: `decimal`, `percent`, `currency` (`currencyDisplay` `symbol`, `narrowSymbol`, `code`) और `unit` (सामान्य इकाइयाँ: लंबाई, द्रव्यमान, अवधि, डेटा आकार, तापमान, गति) स्टाइल; `minimumIntegerDigits`, `minimum` / `maximumFractionDigits`, `minimum` / `maximumSignificantDigits`, `roundingPriority`, `trailingZeroDisplay`, `useGrouping`, `signDisplay`; `standard`, `scientific`, `engineering` और `compact` नोटेशन (`compactDisplay` `short` / `long`)। राउंडिंग शून्य से दूर की ओर आधा (half away from zero) होती है, लिखे गए नंबर पर (`1.005` ब्राउज़र की तरह `1.01` पर राउंड होता है)। `format` BigInt और दशमलव स्ट्रिंग भी बिल्कुल सटीक रूप से लेता है। `formatToParts` और `resolvedOptions` ब्राउज़र की तरह काम करते हैं।
- **तारीखें**: `weekday`, `year`, `month` (`numeric`, `2-digit`, `short`, `long`, `narrow`), `day`, `hour`, `minute`, `second`, `fractionalSecondDigits`, `hour12` / `hourCycle`, `timeZoneName` और `dateStyle` / `timeStyle`, ग्रेगोरियन कैलेंडर में। `timeZone` डिवाइस का ज़ोन लेता है (ब्राउज़र में, ब्राउज़र का), `UTC` या एक ऑफ़सेट (`"+08:00"`); अन्य ज़ोन नाम `RangeError` फेंकते हैं (कोई time zone डेटाबेस नहीं है)।
- **Locales**: locale डेटा सामान्य भाषाओं (अंग्रेज़ी, जर्मन, फ़्रेंच, स्पेनिश, इतालवी, पुर्तगाली, डच, रूसी, स्वीडिश, पोलिश, तुर्की, इंडोनेशियाई, वियतनामी, थाई, हिन्दी, चीनी, जापानी, कोरियाई) और उनके क्षेत्रीय रूपों (`en-GB`, `en-IN`, `de-CH`, `es-MX`, `pt-PT`, `zh-TW`, ...) की एक तालिका है, पूरा CLDR नहीं, इसलिए विवरण ब्राउज़र के आउटपुट से भिन्न हो सकते हैं। जिस locale का डेटा नहीं है, वह माँगे गए अगले locale पर, फिर डिवाइस के, फिर `en-US` पर वापस जाता है; रूसी, स्वीडिश, पोलिश, तुर्की, इंडोनेशियाई, वियतनामी, थाई और हिन्दी की तारीखों में महीनों के नाम नहीं हैं (उनके महीने संख्याओं में लिखे जाते हैं, और वार अंग्रेज़ी में)। अंक हमेशा लैटिन होते हैं।
- **उपलब्ध नहीं**: `Intl.Collator` (`String.prototype.localeCompare` QuickJS का है, जो locale को अनदेखा करता है), `PluralRules`, `RelativeTimeFormat`, `ListFormat`, `DisplayNames`, `Segmenter` और `Intl.Locale`; `currencySign: "accounting"` और `currencyDisplay: "name"` `standard` और `code` के रूप में फ़ॉर्मैट होते हैं।

<a id="performance"></a>

## परफ़ॉर्मेंस

ये सभी क्लासें नेटिव हैं: URL पार्स करना, टेक्स्ट को एन्कोड और डिकोड करना, multipart बॉडी बनाना और स्ट्रीम चंक को आगे बढ़ाना Rust में होता है, QuickJS में नहीं। फिर भी, JS से हर कॉल रनटाइम में जाती है, इसलिए JS में बाइट-दर-बाइट लूप की बजाय पूरे बफ़र पर होने वाले ऑपरेशन (`res.json()`, `res.text()`, `encoder.encode(s)`) को प्राथमिकता दें। देखें [परफ़ॉर्मेंस](../docs/performance.md)।
