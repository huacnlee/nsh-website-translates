---
title: "APIs globais"
description: "Os globais que todo app NSH tem sem precisar de import — fetch, streams, URL, encoding, Blob e FormData, eventos e abort signals, Intl, timers e console — implementados nativamente em Rust."
order: 15
source_hash: 94d1f5292081a56d
---


# APIs globais

Além da biblioteca padrão do ECMAScript, o ambiente JS de um app NSH tem um conjunto de globais padrão: `fetch` com `Headers`, `Request` e `Response`; o Streams Standard; `URL` e `URLSearchParams`; `TextEncoder` / `TextDecoder`; `Blob`, `File` e `FormData`; `EventTarget`, `Event` e `AbortController`; timers, `requestAnimationFrame` e `console`; e `Intl` para formatação de números e datas. Elas são implementadas nativamente em Rust, seguem os padrões WHATWG e não precisam de import, de modo que as muitas bibliotecas JavaScript construídas sobre esses padrões (clientes HTTP, auxiliares de URL e de codificação, utilitários de stream) funcionam sem alterações.

Esta página lista todas as globais que um app tem. Elas são as do ambiente TSX: o código Rust usa a biblioteca padrão do Rust, o crates.io e os serviços do NSH de `nsh_core::prelude` (`fetch`, timers, tarefas; veja [Desenvolvimento com Rust](../docs/rust.md)), indicados na coluna Rust da tabela. A UI é construída com [elementos](../elements/index.md) e os componentes do próprio app, e tudo o mais que um app usa vem dos [módulos](./index.md) que ele importa.

As declarações TypeScript de todas elas são geradas em `.nsh/types/nsh/globals.d.ts` (veja [Estrutura do projeto](../docs/project-structure.md)).

| Grupo | Globais | Rust |
|---|---|---|
| [Console e medição de tempo](#console-and-timing) | `console`, `performance` | o crate `log` (`log::info!`, ...), `nsh_core::time::now()` |
| [Timers e frames](#timers-and-frames) | `setTimeout`, `setInterval`, `clearTimeout`, `clearInterval`, `queueMicrotask`, `requestAnimationFrame`, `cancelAnimationFrame` | `set_timeout`, `set_interval`, `timer(delay).await`, `request_animation_frame`, `next_frame().await`, `Spawned::cancel()` |
| [Base64 e erros](#base64-and-errors) | `atob`, `btoa`, `DOMException` | o crate `base64`, `Result` |
| [Eventos e abort signals](#events-and-abort-signals) | `EventTarget`, `Event`, `CustomEvent`, `AbortController`, `AbortSignal` | signals e closures; `Spawned::cancel()` encerra uma tarefa |
| [URLs](#urls) | `URL`, `URLSearchParams` | o crate `url` |
| [Codificação de texto](#text-encoding) | `TextEncoder`, `TextDecoder` | `str::as_bytes`, `String::from_utf8` |
| [Blobs e form data](#blobs-and-form-data) | `Blob`, `File`, `FormData` | corpos `Vec<u8>` de `HttpRequest` |
| [Fetch](#fetch) | `fetch`, `Headers`, `Request`, `Response` | `fetch`, `HttpRequest`, `HttpResponse` |
| [Formatação de números e datas](#number-and-date-formatting) | `Intl.NumberFormat`, `Intl.DateTimeFormat`, `toLocaleString` | `format!` e os crates de formatação do crates.io, com `locale()` |
| [Streams](#streams) | `ReadableStream`, `WritableStream`, `TransformStream`, readers, writers, controllers, `ByteLengthQueuingStrategy`, `CountQueuingStrategy`, `TextEncoderStream`, `TextDecoderStream` | `fetch` entrega o corpo inteiro; tarefas `background` executam conexões de longa duração em alvos nativos |

Os hosts nativos também fornecem `Buffer`, `crypto`, `process` e `WebSocket`; veja [Módulos padrão](./standard-modules.md) para seus módulos, permissões e limites de recursos.

<a id="console-and-timing"></a>

## Console e medição de tempo

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

Em Rust, as macros do crate `log` (`log::info!`, `log::warn!`, ...) escrevem no mesmo log e também aparecem no terminal de `nsh run`. `console` escreve uma linha por chamada no log do runtime (target `js`): `log` e `info` no nível info, `debug`, `warn` e `error` em seus respectivos níveis. Os argumentos são unidos por espaços; strings são impressas literalmente, erros com seu stack, funções como `[Function name]`, e objetos e arrays como JSON (recorrendo a `String(value)` em caso de ciclos).

Enquanto um dispositivo está conectado ao servidor de desenvolvimento, suas linhas de log aparecem no terminal que executa `nsh run` / `nsh dev`, prefixadas com o nome do dispositivo; veja [Servidor de desenvolvimento e depuração](../docs/dev-server-and-debugging.md).

> [!NOTE]
> Existem apenas os cinco métodos acima. Não há `console.table`, `console.group`, `console.time` nem `console.assert`, e não há substituições de formato `%s` / `%o`.

`performance.now()` é o relógio que `requestAnimationFrame` passa para seus callbacks; em Rust, `nsh_core::time::now()` e os `Instant`s que `request_animation_frame` e `next_frame()` fornecem são esse relógio. `performance` não tem outros membros.

<a id="timers-and-frames"></a>

## Timers e frames

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

Rust: `set_timeout(delay, f)` e `set_interval(period, f)` retornam um handle `Spawned` cujo `cancel()` os cancela, `timer(delay).await` espera em uma tarefa, e `request_animation_frame(f)` / `next_frame().await` fornecem o tempo do próximo frame; todos terminam junto com o componente que os criou. Os timers se comportam como nos navegadores: um atraso ausente, negativo ou não finito é 0, o id retornado é um inteiro positivo, e cancelar um id desconhecido não faz nada. `handler` deve ser uma função (handlers em string não são avaliados). Os timers não limitam atrasos aninhados a 4 ms.

> [!WARNING]
> Os `...args` extras de `setTimeout` / `setInterval` são declarados, mas atualmente não são passados ao handler. Use uma closure: `setTimeout(() => save(id), 100)`.

Os callbacks de `requestAnimationFrame` são executados uma vez, no próximo frame que o engine produzir, todos com o mesmo tempo `performance.now()`. Um callback que solicita outro frame é chamado no frame seguinte, de modo que o loop usual funciona:

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
> Conduzir uma animação a partir do JS frame a frame executa seu código a cada frame no QuickJS. Para animações de estilos e transformações, prefira a [API de animação de `nsh`](./nsh.md#animation), cujos drivers rodam nativamente sem chamar de volta o JS (veja [Animação](../docs/animation.md)).

<a id="base64-and-errors"></a>

## Base64 e erros

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

`atob` / `btoa` convertem entre strings binárias e Base64 como nos navegadores. `DOMException` é com o que as operações abortadas são rejeitadas: um `AbortController.abort()` sem motivo gera um `DOMException` chamado `"AbortError"`, e `AbortSignal.timeout` um chamado `"TimeoutError"`.

<a id="events-and-abort-signals"></a>

## Eventos e abort signals

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

Estas são as classes do DOM Standard com uma diferença: não há árvore, então um evento é despachado apenas para o seu alvo. Os listeners de captura são executados primeiro, depois os demais, como o DOM faz no alvo; `bubbles` não tem efeito. As classes podem ser estendidas por subclasses, o que torna `EventTarget` um pequeno emissor de eventos:

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

Esses eventos não têm relação com os eventos dos elementos (`onPress`, `onChange`, ...), que são props; veja [Toque e gestos](../docs/touch-and-gestures.md).

`AbortSignal` cancela requisições `fetch` e pipes de stream, e remove listeners adicionados com `{ signal }`. Em Rust, uma requisição é executada em uma tarefa, e cancelar a tarefa a cancela:

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

As URLs são analisadas conforme o URL Standard. O `searchParams` de uma URL é ativo nas duas direções: alterar os parâmetros reescreve a query, e definir `search` ou `href` a analisa de novo. O código Rust usa o crate `url`, que segue o mesmo padrão:

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

Os iteradores de `URLSearchParams` (e de `Headers` e `FormData`) iteram sobre um snapshot feito quando o iterador foi criado, e têm os iterator helpers (`map`, `filter`, `toArray`, ...).

`URL.createObjectURL(blob)` retorna uma URL `blob:` que `fetch` (com `GET`) pode ler até que `revokeObjectURL` seja chamado. `<Image>` exibe uma como seu `src` ou `placeholder` ([Image](../elements/image.md)).

<a id="text-encoding"></a>

## Codificação de texto

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

`TextDecoder` conhece menos codificações que um navegador: UTF-8, UTF-16LE, UTF-16BE e windows-1252 (que os rótulos `latin1`, `iso-8859-1`, `ascii` e semelhantes também nomeiam, como o Encoding Standard especifica). Outros rótulos lançam um `RangeError`. Com `{ stream: true }`, uma sequência multibyte cortada entre dois chunks é mantida para a próxima chamada.

<a id="blobs-and-form-data"></a>

## Blobs e form data

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

Um blob mantém seus bytes na memória, e `slice` os compartilha em vez de copiá-los. Blobs são apenas valores em memória: não há acesso ao sistema de arquivos por trás de `File`, e `FormData` não tem construtor a partir de um elemento de formulário.

Um corpo `FormData` é enviado como `multipart/form-data`, e `Response.formData()` / `Request.formData()` analisam tanto `multipart/form-data` quanto `application/x-www-form-urlencoded`.

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

`fetch` envia requisições HTTP e HTTPS pela pilha de rede da própria plataforma: `NSURLSession` no iOS e no Mac Catalyst, `HttpURLConnection` no Android. Assim, as configurações de proxy do sistema, a configuração de TLS e a confiança em certificados se aplicam. URLs `data:` e URLs `blob:` (de `URL.createObjectURL`) são respondidas localmente sem tocar na rede; qualquer outro esquema é rejeitado. O `fetch(request)` do Rust passa pela mesma pilha e pelas mesmas capabilities, recebe uma URL ou um `HttpRequest`, e resolve com um `HttpResponse` contendo o corpo inteiro ([Rede](../docs/networking.md#from-rust-components)):

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

O `body` de uma resposta é um stream de bytes preenchido à medida que a rede entrega os dados, de modo que respostas grandes ou de longa duração (downloads, server-sent events, saída de modelos em streaming) podem ser processadas enquanto chegam. Quando mais de 1 MiB está esperando sem ser lido, a requisição é pausada até que o app volte a ler.

```ts
const res = await fetch("https://api.example.com/events");
const lines = res.body!.pipeThrough(new TextDecoderStream());
for await (const chunk of lines) {
  console.log(chunk);
}
```

Um corpo de requisição `ReadableStream` é enviado chunk a chunk conforme a rede o solicita; passe `duplex: "half"` como o Fetch Standard exige:

```ts
await fetch("https://api.example.com/upload", {
  method: "PUT",
  body: blob.stream(),
  duplex: "half",
});
```

<a id="differences-from-browsers"></a>

### Diferenças em relação aos navegadores

- **Sem CORS e sem origin.** Um app não é uma página web: ele pode se comunicar com qualquer host que suas [capabilities](../docs/sandbox-and-capabilities.md) permitam. `mode` é aceito e ignorado.
- **Sem headers proibidos.** Um app pode definir `Cookie`, `User-Agent`, `Origin` e qualquer outro header. Quando nenhum header `Accept` é informado, `Accept: */*` é enviado.
- **`redirect: "manual"` entrega a própria resposta 3xx**, com seu status e o header `Location`, em vez de uma resposta filtrada opaca. `"follow"` segue redirecionamentos (cada salto é verificado contra as capabilities); `"error"` rejeita quando a resposta é um redirecionamento.
- **Um corpo `FormData` sempre recebe `Content-Type: multipart/form-data; boundary=…`**, mesmo quando um header `Content-Type` foi definido. Bibliotecas HTTP frequentemente definem um content type padrão e o removem apenas onde detectam um navegador; sem o boundary, o servidor não consegue analisar o corpo.
- **`credentials`, `cache`, `referrer`, `referrerPolicy`, `integrity`, `keepalive` e `priority`** são validados e mantidos no objeto `Request`, mas não são passados à pilha de rede: o cache e o tratamento de cookies são os da pilha da plataforma.
- **Capabilities.** Quando o app declara capabilities `network` em `nsh.json` (ou o app hospedeiro concede menos), uma requisição a um host não permitido nunca chega à rede e `fetch` rejeita com um `TypeError` cujo `code` é `"ERR_ACCESS_DENIED"`, `permission` `"network"` e `resource` a URL recusada. Veja [Sandbox e capabilities](../docs/sandbox-and-capabilities.md).
- **Erros.** Falhas de rede rejeitam com um `TypeError` cuja mensagem começa com `Network request failed:`; cancelamentos rejeitam com o `reason` do signal.

Veja [Rede](../docs/networking.md) para um guia de carregamento de dados em componentes.

## Streams

O Streams Standard completo do WHATWG: readable streams (default e byte streams, BYOB readers, `tee`, `pipeTo` / `pipeThrough`, `ReadableStream.from`, iteração assíncrona), writable streams, transform streams, as duas estratégias de enfileiramento e os streams de codificação de texto.

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

Os objetos underlying source, sink e transformer (`UnderlyingDefaultSource`, `UnderlyingByteSource`, `UnderlyingSink`, `Transformer`) e `StreamPipeOptions` (`preventAbort`, `preventCancel`, `preventClose`, `signal`) têm os formatos padrão; suas declarações completas estão em `globals.d.ts`.

`TextEncoderStream` mantém junto um surrogate pair cortado entre dois chunks de string, e `TextDecoderStream` uma sequência multibyte cortada entre dois chunks de bytes.

Um transform stream que divide texto em linhas:

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

## Formatação de números e datas

O QuickJS não tem um `Intl` próprio; o NSH adiciona um, formatando em Rust: `Intl.NumberFormat`, `Intl.DateTimeFormat` e `Intl.getCanonicalLocales`, e o `toLocaleString` de números e BigInts e `toLocaleString` / `toLocaleDateString` / `toLocaleTimeString` de datas, que recebem os mesmos `locales` e `options`. Suas declarações são as do próprio TypeScript (a biblioteca `ES2023`), portanto não estão em `globals.d.ts`.

```ts
(1234567.891).toLocaleString();                                              // "1,234,567.891" (en-US)
(1234.5).toLocaleString("de-DE", { style: "currency", currency: "EUR" });  // "1.234,50 €"
new Intl.NumberFormat("en", { notation: "compact" }).format(1_500_000);      // "1.5M"
new Intl.NumberFormat("en", { style: "percent", signDisplay: "exceptZero" }).format(0.042); // "+4%"
new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });   // "09:05"
new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(date); // "Oct 16, 2026, 3:04 PM"
```

Sem `locales`, o locale do dispositivo é usado: seu formato de região (iOS `NSLocale.currentLocale`, Android `Locale.getDefault()`), `en-US` em `nsh test` e na web.

- **Números**: os estilos `decimal`, `percent`, `currency` (`currencyDisplay` `symbol`, `narrowSymbol`, `code`) e `unit` (unidades comuns: comprimentos, massas, durações, tamanhos de dados, temperaturas, velocidades); `minimumIntegerDigits`, `minimum` / `maximumFractionDigits`, `minimum` / `maximumSignificantDigits`, `roundingPriority`, `trailingZeroDisplay`, `useGrouping`, `signDisplay`; notação `standard`, `scientific`, `engineering` e `compact` (`compactDisplay` `short` / `long`). O arredondamento é para longe do zero em caso de metade, sobre o número como escrito (`1.005` arredonda para `1.01`, como nos navegadores). `format` também aceita BigInts e strings decimais, com exatidão. `formatToParts` e `resolvedOptions` funcionam como nos navegadores.
- **Datas**: `weekday`, `year`, `month` (`numeric`, `2-digit`, `short`, `long`, `narrow`), `day`, `hour`, `minute`, `second`, `fractionalSecondDigits`, `hour12` / `hourCycle`, `timeZoneName` e `dateStyle` / `timeStyle`, no calendário gregoriano. `timeZone` assume o fuso do dispositivo (em um navegador, o do navegador), `UTC` ou um offset (`"+08:00"`); outros nomes de fuso lançam um `RangeError` (não há banco de dados de fusos horários).
- **Locales**: os dados de locale são uma tabela de idiomas comuns (inglês, alemão, francês, espanhol, italiano, português, holandês, russo, sueco, polonês, turco, indonésio, vietnamita, tailandês, hindi, chinês, japonês, coreano) com suas variantes regionais (`en-GB`, `en-IN`, `de-CH`, `es-MX`, `pt-PT`, `zh-TW`, ...), e não o CLDR inteiro, portanto os detalhes podem diferir da saída de um navegador. Um locale sem dados recorre ao próximo solicitado, depois ao do dispositivo e então a `en-US`; as datas em russo, sueco, polonês, turco, indonésio, vietnamita, tailandês e hindi não têm nomes de meses (os meses são escritos como números e os dias da semana em inglês). Os dígitos são sempre latinos.
- **Não existem**: `Intl.Collator` (`String.prototype.localeCompare` é o do QuickJS, que ignora o locale), `PluralRules`, `RelativeTimeFormat`, `ListFormat`, `DisplayNames`, `Segmenter` e `Intl.Locale`; `currencySign: "accounting"` e `currencyDisplay: "name"` formatam como `standard` e `code`.

<a id="performance"></a>

## Desempenho

Todas essas classes são nativas: a análise de URLs, a codificação e decodificação de texto, a construção de corpos multipart e a movimentação de chunks de stream acontecem em Rust, não no QuickJS. Ainda assim, toda chamada do JS atravessa para o runtime, então prefira operações sobre o buffer inteiro (`res.json()`, `res.text()`, `encoder.encode(s)`) a loops byte a byte em JS. Veja [Desempenho](../docs/performance.md).
