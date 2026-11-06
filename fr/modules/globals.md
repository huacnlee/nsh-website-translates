---
title: "API globales"
description: "Les globales dont dispose chaque application NSH sans import : fetch, streams, URL, encodage, Blob et FormData, événements et signaux d'abandon, Intl, minuteries et console, implémentées nativement en Rust."
order: 15
source_hash: 94d1f5292081a56d
---

# Global APIs

Outre la bibliothèque standard ECMAScript, l'environnement JS d'une app NSH dispose d'un ensemble de globales standard : `fetch` avec `Headers`, `Request` et `Response` ; la Streams Standard ; `URL` et `URLSearchParams` ; `TextEncoder` / `TextDecoder` ; `Blob`, `File` et `FormData` ; `EventTarget`, `Event` et `AbortController` ; les timers, `requestAnimationFrame` et `console` ; et `Intl` pour le formatage des nombres et des dates. Elles sont implémentées nativement en Rust, suivent les standards WHATWG et ne nécessitent aucun import ; les nombreuses bibliothèques JavaScript construites sur ces standards (clients HTTP, utilitaires d'URL et d'encodage, utilitaires de streams) fonctionnent donc sans modification.

Cette page liste toutes les globales dont dispose une app. Ce sont celles de l'environnement TSX : le code Rust utilise à la place la bibliothèque standard de Rust, crates.io et les services de `nsh_core::prelude` de NSH (`fetch`, timers, tâches ; voir [Développer avec Rust](../docs/rust.md)), indiqués dans la colonne Rust du tableau. L'interface se construit avec des [éléments](../elements/index.md) et les composants propres à l'app, et tout le reste provient des [modules](./index.md) que l'app importe.

Les déclarations TypeScript de toutes ces globales sont générées dans `.nsh/types/nsh/globals.d.ts` (voir [Structure du projet](../docs/project-structure.md)).

| Groupe | Globales | Rust |
|---|---|---|
| [Console et mesure du temps](#console-and-timing) | `console`, `performance` | la crate `log` (`log::info!`, ...), `nsh_core::time::now()` |
| [Timers et frames](#timers-and-frames) | `setTimeout`, `setInterval`, `clearTimeout`, `clearInterval`, `queueMicrotask`, `requestAnimationFrame`, `cancelAnimationFrame` | `set_timeout`, `set_interval`, `timer(delay).await`, `request_animation_frame`, `next_frame().await`, `Spawned::cancel()` |
| [Base64 et erreurs](#base64-and-errors) | `atob`, `btoa`, `DOMException` | la crate `base64`, `Result` |
| [Événements et signaux d'abandon](#events-and-abort-signals) | `EventTarget`, `Event`, `CustomEvent`, `AbortController`, `AbortSignal` | signaux et closures ; `Spawned::cancel()` termine une tâche |
| [URLs](#urls) | `URL`, `URLSearchParams` | la crate `url` |
| [Encodage de texte](#text-encoding) | `TextEncoder`, `TextDecoder` | `str::as_bytes`, `String::from_utf8` |
| [Blobs et données de formulaire](#blobs-and-form-data) | `Blob`, `File`, `FormData` | `Vec<u8>` corps de `HttpRequest` |
| [Fetch](#fetch) | `fetch`, `Headers`, `Request`, `Response` | `fetch`, `HttpRequest`, `HttpResponse` |
| [Formatage des nombres et des dates](#number-and-date-formatting) | `Intl.NumberFormat`, `Intl.DateTimeFormat`, `toLocaleString` | `format!` et les crates de formatage de crates.io, avec `locale()` |
| [Streams](#streams) | `ReadableStream`, `WritableStream`, `TransformStream`, readers, writers, controllers, `ByteLengthQueuingStrategy`, `CountQueuingStrategy`, `TextEncoderStream`, `TextDecoderStream` | `fetch` fournit le corps entier ; les tâches `background` gèrent les connexions de longue durée sur les cibles natives |

Les hôtes natifs fournissent également `Buffer`, `crypto`, `process` et `WebSocket` ; voir [Modules standard](./standard-modules.md) pour leurs modules, permissions et limites de ressources.

<a id="console-and-timing"></a>

## Console et mesure du temps

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

En Rust, les macros de la crate `log` (`log::info!`, `log::warn!`, ...) écrivent dans le même journal et apparaissent aussi dans le terminal de `nsh run`. `console` écrit une ligne par appel dans le journal du runtime (cible `js`) : `log` et `info` au niveau info, `debug`, `warn` et `error` à leurs niveaux respectifs. Les arguments sont joints par des espaces ; les chaînes sont affichées telles quelles, les erreurs avec leur stack, les fonctions sous la forme `[Function name]`, et les objets et tableaux en JSON (avec repli sur `String(value)` en cas de cycle).

Lorsqu'un appareil est connecté au serveur de développement, ses lignes de journal apparaissent dans le terminal qui exécute `nsh run` / `nsh dev`, préfixées par le nom de l'appareil ; voir [Serveur de développement et débogage](../docs/dev-server-and-debugging.md).

> [!NOTE]
> Seules les cinq méthodes ci-dessus existent. Il n'y a ni `console.table`, ni `console.group`, ni `console.time`, ni `console.assert`, et aucune substitution de format `%s` / `%o`.

`performance.now()` est l'horloge que `requestAnimationFrame` transmet à ses callbacks ; en Rust, `nsh_core::time::now()` et les `Instant` que renvoient `request_animation_frame` et `next_frame()` correspondent à cette horloge. `performance` n'a aucun autre membre.

<a id="timers-and-frames"></a>

## Timers et frames

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

Rust : `set_timeout(delay, f)` et `set_interval(period, f)` renvoient un handle `Spawned` dont `cancel()` les annule, `timer(delay).await` attend dans une tâche, et `request_animation_frame(f)` / `next_frame().await` donnent l'instant de la prochaine frame ; tous prennent fin avec le composant qui les a créés. Les timers se comportent comme dans les navigateurs : un délai absent, négatif ou non fini vaut 0, l'identifiant renvoyé est un entier positif, et annuler un identifiant inconnu ne fait rien. `handler` doit être une fonction (les handlers sous forme de chaîne ne sont pas évalués). Les timers ne limitent pas les délais imbriqués à 4 ms.

> [!WARNING]
> Les arguments supplémentaires `...args` de `setTimeout` / `setInterval` sont déclarés mais ne sont actuellement pas transmis au handler. Utilisez plutôt une closure : `setTimeout(() => save(id), 100)`.

Les callbacks de `requestAnimationFrame` s'exécutent une seule fois, à la prochaine frame produite par le moteur, tous avec le même instant `performance.now()`. Un callback qui demande une autre frame est appelé à la frame suivante, de sorte que la boucle habituelle fonctionne :

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
> Piloter une animation depuis JS frame par frame exécute votre code à chaque frame dans QuickJS. Pour les animations de styles et de transformations, préférez l'[API d'animation de `nsh`](./nsh.md#animation), dont les drivers s'exécutent nativement sans rappeler JS (voir [Animation](../docs/animation.md)).

<a id="base64-and-errors"></a>

## Base64 et erreurs

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

`atob` / `btoa` convertissent entre chaînes binaires et Base64 comme dans les navigateurs. `DOMException` est l'erreur avec laquelle les opérations abandonnées sont rejetées : un `AbortController.abort()` sans raison donne une `DOMException` nommée `"AbortError"`, et `AbortSignal.timeout` une nommée `"TimeoutError"`.

<a id="events-and-abort-signals"></a>

## Événements et signaux d'abandon

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

Ce sont les classes du DOM Standard, avec une différence : il n'y a pas d'arbre, donc un événement est distribué uniquement à sa cible. Les listeners de capture s'exécutent en premier, puis les autres, comme le fait le DOM au niveau de la cible ; `bubbles` n'a aucun effet. Les classes peuvent être dérivées, ce qui fait de `EventTarget` un petit émetteur d'événements :

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

Ces événements n'ont aucun rapport avec les événements des éléments (`onPress`, `onChange`, ...), qui sont des props ; voir [Toucher et gestes](../docs/touch-and-gestures.md).

`AbortSignal` annule les requêtes `fetch` et les pipes de streams, et supprime les listeners ajoutés avec `{ signal }`. En Rust, une requête s'exécute dans une tâche, et annuler la tâche l'annule :

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

Les URLs sont analysées selon l'URL Standard. Le `searchParams` d'une URL est synchronisé dans les deux sens : modifier les paramètres réécrit la query, et affecter `search` ou `href` l'analyse à nouveau. Le code Rust utilise la crate `url`, qui suit le même standard :

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

Les itérateurs de `URLSearchParams` (ainsi que de `Headers` et `FormData`) parcourent un instantané pris à la création de l'itérateur, et disposent des iterator helpers (`map`, `filter`, `toArray`, ...).

`URL.createObjectURL(blob)` renvoie une URL `blob:` que `fetch` (avec `GET`) peut lire jusqu'à l'appel de `revokeObjectURL`. `<Image>` en affiche une via son `src` ou `placeholder` ([Image](../elements/image.md)).

<a id="text-encoding"></a>

## Encodage de texte

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

`TextDecoder` connaît moins d'encodages qu'un navigateur : UTF-8, UTF-16LE, UTF-16BE et windows-1252 (que désignent aussi les labels `latin1`, `iso-8859-1`, `ascii` et similaires, comme le spécifie l'Encoding Standard). Les autres labels lèvent une `RangeError`. Avec `{ stream: true }`, une séquence multi-octets coupée entre deux chunks est conservée pour l'appel suivant.

<a id="blobs-and-form-data"></a>

## Blobs et données de formulaire

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

Un blob conserve ses octets en mémoire, et `slice` les partage au lieu de les copier. Les blobs sont uniquement des valeurs en mémoire : il n'y a aucun accès au système de fichiers derrière `File`, et `FormData` n'a pas de constructeur à partir d'un élément de formulaire.

Un corps `FormData` est envoyé en `multipart/form-data`, et `Response.formData()` / `Request.formData()` analysent à la fois `multipart/form-data` et `application/x-www-form-urlencoded`.

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

`fetch` envoie des requêtes HTTP et HTTPS via la pile réseau propre à la plateforme : `NSURLSession` sur iOS et Mac Catalyst, `HttpURLConnection` sur Android. Les réglages de proxy du système, la configuration TLS et la confiance dans les certificats s'appliquent donc. Les URLs `data:` et les URLs `blob:` (issues de `URL.createObjectURL`) sont traitées localement sans toucher au réseau ; tout autre schéma est rejeté. Le `fetch(request)` de Rust passe par la même pile et les mêmes capabilities, accepte une URL ou un `HttpRequest`, et se résout avec un `HttpResponse` contenant le corps entier ([Réseau](../docs/networking.md#from-rust-components)) :

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

### Headers, Request et Response

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

Le `body` d'une réponse est un flux d'octets alimenté à mesure que le réseau livre les données, de sorte que les réponses volumineuses ou de longue durée (téléchargements, server-sent events, sortie de modèle en streaming) peuvent être traitées au fil de leur arrivée. Lorsque plus de 1 MiB attend d'être lu, la requête est mise en pause jusqu'à ce que l'app lise à nouveau.

```ts
const res = await fetch("https://api.example.com/events");
const lines = res.body!.pipeThrough(new TextDecoderStream());
for await (const chunk of lines) {
  console.log(chunk);
}
```

Un corps de requête `ReadableStream` est envoyé chunk par chunk à mesure que le réseau le demande ; passez `duplex: "half"` comme l'exige le Fetch Standard :

```ts
await fetch("https://api.example.com/upload", {
  method: "PUT",
  body: blob.stream(),
  duplex: "half",
});
```

<a id="differences-from-browsers"></a>

### Différences avec les navigateurs

- **Ni CORS ni origine.** Une app n'est pas une page web : elle peut communiquer avec tout hôte autorisé par ses [capabilities](../docs/sandbox-and-capabilities.md). `mode` est accepté et ignoré.
- **Aucun en-tête interdit.** Une app peut définir `Cookie`, `User-Agent`, `Origin` et tout autre en-tête. Lorsqu'aucun en-tête `Accept` n'est fourni, `Accept: */*` est envoyé.
- **`redirect: "manual"` livre lui-même la réponse 3xx**, avec son statut et son en-tête `Location`, au lieu d'une réponse filtrée opaque. `"follow"` suit les redirections (chaque saut est vérifié par rapport aux capabilities) ; `"error"` est rejeté lorsque la réponse est une redirection.
- **Un corps `FormData` reçoit toujours `Content-Type: multipart/form-data; boundary=…`**, même lorsqu'un en-tête `Content-Type` a été défini. Les bibliothèques HTTP définissent souvent un type de contenu par défaut et ne l'effacent que lorsqu'elles détectent un navigateur ; sans la boundary, le serveur ne peut pas analyser le corps.
- **`credentials`, `cache`, `referrer`, `referrerPolicy`, `integrity`, `keepalive` et `priority`** sont validés et conservés sur l'objet `Request`, mais ne sont pas transmis à la pile réseau : la gestion du cache et des cookies est celle de la pile de la plateforme.
- **Capabilities.** Lorsque l'app déclare des capabilities `network` dans `nsh.json` (ou que l'app hôte en accorde moins), une requête vers un hôte non autorisé n'atteint jamais le réseau et `fetch` est rejeté avec une `TypeError` dont `code` vaut `"ERR_ACCESS_DENIED"`, `permission` `"network"` et `resource` l'URL refusée. Voir [Sandbox et capabilities](../docs/sandbox-and-capabilities.md).
- **Erreurs.** Les échecs réseau sont rejetés avec une `TypeError` dont le message commence par `Network request failed:` ; les abandons sont rejetés avec le `reason` du signal.

Voir [Réseau](../docs/networking.md) pour un guide du chargement de données dans les composants.

## Streams

La Streams Standard WHATWG complète : readable streams (streams par défaut et streams d'octets, readers BYOB, `tee`, `pipeTo` / `pipeThrough`, `ReadableStream.from`, itération asynchrone), writable streams, transform streams, les deux stratégies de file d'attente et les streams d'encodage de texte.

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

Les objets source, sink et transformer sous-jacents (`UnderlyingDefaultSource`, `UnderlyingByteSource`, `UnderlyingSink`, `Transformer`) et `StreamPipeOptions` (`preventAbort`, `preventCancel`, `preventClose`, `signal`) ont les formes standard ; leurs déclarations complètes se trouvent dans `globals.d.ts`.

`TextEncoderStream` garde ensemble une paire de substituts coupée entre deux chunks de chaîne, et `TextDecoderStream` une séquence multi-octets coupée entre deux chunks d'octets.

Un transform stream qui découpe le texte en lignes :

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

## Formatage des nombres et des dates

QuickJS n'a pas de `Intl` propre ; NSH en ajoute un, qui formate en Rust : `Intl.NumberFormat`, `Intl.DateTimeFormat` et `Intl.getCanonicalLocales`, ainsi que le `toLocaleString` des nombres et des BigInts et `toLocaleString` / `toLocaleDateString` / `toLocaleTimeString` des dates, qui acceptent les mêmes `locales` et `options`. Leurs déclarations sont celles de TypeScript (la bibliothèque `ES2023`), elles ne figurent donc pas dans `globals.d.ts`.

```ts
(1234567.891).toLocaleString();                                              // "1,234,567.891" (en-US)
(1234.5).toLocaleString("de-DE", { style: "currency", currency: "EUR" });  // "1.234,50 €"
new Intl.NumberFormat("en", { notation: "compact" }).format(1_500_000);      // "1.5M"
new Intl.NumberFormat("en", { style: "percent", signDisplay: "exceptZero" }).format(0.042); // "+4%"
new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });   // "09:05"
new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(date); // "Oct 16, 2026, 3:04 PM"
```

Sans `locales`, la locale de l'appareil est utilisée : son format régional (iOS `NSLocale.currentLocale`, Android `Locale.getDefault()`), `en-US` dans `nsh test` et sur le web.

- **Nombres** : les styles `decimal`, `percent`, `currency` (`currencyDisplay` `symbol`, `narrowSymbol`, `code`) et `unit` (unités courantes : longueurs, masses, durées, tailles de données, températures, vitesses) ; `minimumIntegerDigits`, `minimum` / `maximumFractionDigits`, `minimum` / `maximumSignificantDigits`, `roundingPriority`, `trailingZeroDisplay`, `useGrouping`, `signDisplay` ; les notations `standard`, `scientific`, `engineering` et `compact` (`compactDisplay` `short` / `long`). L'arrondi se fait à la valeur la plus éloignée de zéro en cas d'égalité, sur le nombre tel qu'il est écrit (`1.005` s'arrondit à `1.01`, comme dans les navigateurs). `format` accepte aussi les BigInts et les chaînes décimales, de façon exacte. `formatToParts` et `resolvedOptions` fonctionnent comme dans les navigateurs.
- **Dates** : `weekday`, `year`, `month` (`numeric`, `2-digit`, `short`, `long`, `narrow`), `day`, `hour`, `minute`, `second`, `fractionalSecondDigits`, `hour12` / `hourCycle`, `timeZoneName` et `dateStyle` / `timeStyle`, dans le calendrier grégorien. `timeZone` prend le fuseau de l'appareil (dans un navigateur, celui du navigateur), `UTC` ou un décalage (`"+08:00"`) ; les autres noms de fuseau lèvent une `RangeError` (il n'y a pas de base de données de fuseaux horaires).
- **Locales** : les données de locale forment une table des langues courantes (anglais, allemand, français, espagnol, italien, portugais, néerlandais, russe, suédois, polonais, turc, indonésien, vietnamien, thaï, hindi, chinois, japonais, coréen) avec leurs variantes régionales (`en-GB`, `en-IN`, `de-CH`, `es-MX`, `pt-PT`, `zh-TW`, ...), et non l'intégralité de CLDR ; les détails peuvent donc différer de la sortie d'un navigateur. Une locale sans données se replie sur la suivante demandée, puis sur celle de l'appareil, puis sur `en-US` ; les dates en russe, suédois, polonais, turc, indonésien, vietnamien, thaï et hindi n'ont pas de noms de mois (les mois sont écrits en chiffres, les jours de la semaine en anglais). Les chiffres sont toujours latins.
- **Absents** : `Intl.Collator` (`String.prototype.localeCompare` est celui de QuickJS, qui ignore la locale), `PluralRules`, `RelativeTimeFormat`, `ListFormat`, `DisplayNames`, `Segmenter` et `Intl.Locale` ; `currencySign: "accounting"` et `currencyDisplay: "name"` se formatent comme `standard` et `code`.

## Performance

Toutes ces classes sont natives : l'analyse des URLs, l'encodage et le décodage de texte, la construction des corps multipart et le déplacement des chunks de streams se font en Rust, pas dans QuickJS. Néanmoins, chaque appel depuis JS traverse la frontière vers le runtime ; préférez donc les opérations sur des buffers entiers (`res.json()`, `res.text()`, `encoder.encode(s)`) aux boucles octet par octet en JS. Voir [Performance](../docs/performance.md).
