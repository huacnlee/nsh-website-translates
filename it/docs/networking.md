---
title: "Networking"
description: "HTTP con fetch - JSON, header, upload con FormData, risposte in streaming e corpi delle richieste in streaming, annullamento con AbortController, errori e le capacità di rete che un'app dichiara."
order: 46
group: ui
source_hash: 98ed5881a270c365
---

# Rete

Le app NSH eseguono richieste HTTP con `fetch`: in Rust la funzione di `nsh_core::prelude`, attesa in un task, e in TSX il global standard. Entrambi usano lo stack di rete della piattaforma (NSURLSession su iOS, HttpURLConnection su Android, quello del browser [sul web](./web.md#apps-with-rust-components)), quindi le richieste usano TLS, proxy e HTTP/2 del sistema, ed entrambi superano gli stessi [controlli delle capability](#capabilities-which-hosts-an-app-may-reach). `fetch` di Rust accetta un URL o un `HttpRequest` e restituisce la risposta completa (`HttpResponse`: `status()`, `ok()`, `header(name)`, `text()`, `body`). Quello di TSX fa streaming in entrambe le direzioni: il corpo di una risposta arriva come stream man mano che lo stack lo consegna, e il corpo di una richiesta può essere uno stream inviato mentre lo produci. TSX ha anche i complementi della Fetch API: `Headers`, `Request`, `Response`, `AbortController`, `FormData`, `Blob`, `File`, `URL`, `URLSearchParams`, `TextEncoder` / `TextDecoder` e i Web Streams.

<a id="getting-json"></a>

## Ottenere JSON

```rust tabs
use nsh_core::prelude::*;

#[derive(Clone, PartialEq)]
struct Post {
    id: u64,
    title: String,
}

fn parse(body: &str) -> Result<Vec<Post>, String> {
    let posts: Vec<serde_json::Value> = serde_json::from_str(body).map_err(|e| e.to_string())?;
    Ok(posts
        .iter()
        .map(|p| Post {
            id: p["id"].as_u64().unwrap_or_default(),
            title: p["title"].as_str().unwrap_or_default().to_owned(),
        })
        .collect())
}

#[component]
fn App() -> impl IntoElement {
    let posts = resource(
        || Some(()),
        |(), _| async move {
            let response = fetch("https://jsonplaceholder.typicode.com/posts?_limit=5").await?;
            if !response.ok() {
                return Err(format!("HTTP {}", response.status()));
            }
            parse(&response.text())
        },
    );
    scroll().flex_1().child(
        view()
            .p_4()
            .pt(px(60.0))
            .gap_2()
            .child(
                text(move || {
                    if posts.loading() { "loading…".to_owned() } else { posts.error().unwrap_or_default() }
                })
                .text_color(rgb(0x57606a)),
            )
            .child(each(
                move || posts.get().unwrap_or_default(),
                |post| post.id,
                |post, _| text(move || post.with(|p| p.title.clone())).number_of_lines(1),
            )),
    )
}
```

```tsx tabs
import { mount, resource, Scroll, Text, View } from "nsh";

type Post = { id: number; title: string };

function App() {
  const posts = resource(async ({ signal }) => {
    const response = await fetch("https://jsonplaceholder.typicode.com/posts?_limit=5", { signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return (await response.json()) as Post[];
  });

  return (
    <Scroll style={{ flex: 1 }}>
      <View style={{ padding: 16, paddingTop: 60, gap: 8 }}>
        <Text style={{ color: "#57606a" }}>{posts.loading() ? "loading…" : String(posts.error() ?? "")}</Text>
        <Each of={posts() ?? []}>{(post) => <Text style={{ numberOfLines: 1 }}>{post().title}</Text>}</Each>
      </View>
    </Scroll>
  );
}

mount(App);
```

[`resource`](./reactivity.md#resource) mantiene il valore, l'errore e lo stato di esecuzione di un caricamento, ricarica quando cambia la sorgente (o su `refetch()`) e annulla un caricamento che non conta più (il componente scompare, o ne parte uno più recente): in Rust eliminando (drop) il task del caricamento, il che annulla la sua richiesta, in TSX tramite il `signal` che passa. `fetch` di Rust accetta URL assoluti; il JSON viene analizzato con un crate come `serde_json`.

In TSX, un `Response` legge il proprio corpo una sola volta, come `json()`, `text()`, `arrayBuffer()`, `bytes()`, `blob()` o `formData()`, oppure come stream `body`. `response.ok` è true per gli status 2xx; come nei browser, uno status di errore HTTP non rifiuta la promise.

<a id="sending-data"></a>

## Inviare dati

```rust tabs
use nsh_core::prelude::*;

// JSON
let body = serde_json::json!({ "title": "Groceries", "items": ["milk", "eggs"] });
let created = fetch(
    HttpRequest::post("https://api.example.com/notes", body.to_string())
        .header("Content-Type", "application/json")
        .header("Authorization", format!("Bearer {token}")),
)
.await?;

// A form, URL-encoded
fetch(
    HttpRequest::post("https://api.example.com/login", "user=ada&password=…")
        .header("Content-Type", "application/x-www-form-urlencoded"),
)
.await?;

// Other methods
fetch(HttpRequest::new("DELETE", "https://api.example.com/notes/1")).await?;
```

```tsx tabs
// JSON
const created = await fetch("https://api.example.com/notes", {
  method: "POST",
  headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
  body: JSON.stringify({ title: "Groceries", items: ["milk", "eggs"] }),
});

// A form, URL-encoded
await fetch("https://api.example.com/login", {
  method: "POST",
  body: new URLSearchParams({ user: "ada", password: "…" }),
});

// Query strings
const url = new URL("https://api.example.com/search");
url.searchParams.set("q", "native shell");
url.searchParams.set("page", "2");
const results = await (await fetch(url)).json();
```

`HttpRequest::new(method, url)`, `get` e `post` creano una richiesta, `.header(..)` e `.body(..)` la completano. In TSX, `body` accetta una stringa, `URLSearchParams`, `FormData`, un `Blob` o `File`, un `ArrayBuffer` o un typed array, oppure un `ReadableStream`.

<a id="uploading-files-with-formdata"></a>

### Caricare file con FormData

In TSX, un corpo `FormData` viene inviato come `multipart/form-data` con il relativo boundary. NSH imposta sempre quel content type per un corpo `FormData`, anche se una libreria imposta prima un `Content-Type` predefinito, perché senza il boundary il server non riesce a interpretarlo.

```ts
const form = new FormData();
form.append("title", "Sunset");
form.append("photo", new Blob([bytes], { type: "image/jpeg" }), "sunset.jpg");

const response = await fetch("https://api.example.com/photos", { method: "POST", body: form });
```

<a id="uploading-a-photo-the-user-picks"></a>

### Caricare una foto scelta dall'utente

[`Picker`](../modules/nsh.md#picker) restituisce le foto scelte dall'utente come file i cui byte restano nativi, ridimensionati
e in un formato accettato dai server; Rust ne invia i byte, TSX aggiunge `File` a un `FormData`:

```rust tabs
use nsh_core::geometry::DevicePixels;
use nsh_core::picker::PickRequest;
use nsh_core::prelude::*;

let mut request = PickRequest::new(false, 1);
request.max_dimension = Some(DevicePixels(2048));
let picked = pick_images(request);
spawn(async move {
    if let Some(photo) = picked.await.into_iter().next() {
        let upload = HttpRequest::post("https://api.example.com/photos", photo.data.to_vec())
            .header("Content-Type", photo.mime.as_str());
        let _ = fetch(upload).await;
    }
});
```

```tsx tabs
import { Picker } from "nsh";

const [photo] = await Picker.pickImages({ maxDimension: 2048 });
if (photo) {
  const form = new FormData();
  form.append("photo", photo.file);
  await fetch("https://api.example.com/photos", { method: "POST", body: form });
}
```

## Streaming

`fetch` di TSX fa streaming di risposte e corpi di richiesta; quello di Rust restituisce il corpo completo insieme alla risposta.

<a id="reading-a-response-as-it-arrives"></a>

### Leggere una risposta man mano che arriva

`response.body` è un `ReadableStream<Uint8Array>` riempito man mano che la rete consegna i byte. Leggilo chunk per chunk per mostrare l'avanzamento o per elaborare le righe server-sent appena arrivano:

```ts
const response = await fetch("https://api.example.com/large.csv");
const total = Number(response.headers.get("Content-Length") ?? 0);
let received = 0;

for await (const chunk of response.body!) {
  received += chunk.length;
  progress.set(total ? received / total : 0);
}
```

Gli stream di testo si decodificano con `TextDecoderStream`, e un `TransformStream` li divide in righe:

```ts
const response = await fetch("https://api.example.com/events", { headers: { Accept: "text/event-stream" } });
let rest = "";
const lines = response
  .body!.pipeThrough(new TextDecoderStream())
  .pipeThrough(
    new TransformStream<string, string>({
      transform(chunk, controller) {
        const parts = (rest + chunk).split("\n");
        rest = parts.pop() ?? "";
        for (const line of parts) controller.enqueue(line);
      },
    }),
  );

for await (const line of lines) {
  if (line.startsWith("data: ")) messages.update((m) => [...m, line.slice(6)]);
}
```

La back pressure funziona end to end: finché più di 1 MiB di una risposta resta in attesa di lettura, la richiesta viene messa in pausa a livello di rete finché il tuo codice non recupera.

<a id="streaming-a-request-body"></a>

### Inviare il corpo di una richiesta in streaming

Un corpo `ReadableStream` viene inviato chunk per chunk man mano che lo stack di rete lo richiede (chunked transfer). Passa `duplex: "half"`, come richiede lo standard Fetch:

```ts
const encoder = new TextEncoder();
const body = new ReadableStream<Uint8Array>({
  async start(controller) {
    for (const line of logLines) controller.enqueue(encoder.encode(line + "\n"));
    controller.close();
  },
});

await fetch("https://api.example.com/logs", { method: "POST", body, duplex: "half" });
```

Un corpo in streaming non può essere inviato due volte, quindi un redirect 307 o 308 di una richiesta in streaming fallisce.

<a id="cancelling-and-timeouts"></a>

## Annullamento e timeout

In Rust, una richiesta viene eseguita in un task e viene annullata insieme a esso: quando il componente del task scompare, oppure con `cancel()` sul task che `spawn` restituisce. In TSX, passa un `AbortSignal` per annullare una richiesta; la promise viene rifiutata con il motivo (reason) del signal (per impostazione predefinita un `AbortError` `DOMException`), e la lettura di un corpo in corso si interrompe.

```rust tabs
let task = spawn(async move {
    if let Ok(response) = fetch(format!("https://api.example.com/search?q={query}")).await {
        results.set(response.text());
    }
});

// Typing again: cancel the previous search.
task.cancel();
```

```tsx tabs
const controller = new AbortController();
const request = fetch("https://api.example.com/search?q=" + encodeURIComponent(query), { signal: controller.signal });

// Typing again: cancel the previous search.
controller.abort();
```

In TSX, `AbortSignal.timeout(ms)` crea un signal che si annulla dopo un ritardo, e `AbortSignal.any([...])` combina più signal:

```ts
const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
```

Un componente che carica dati dovrebbe annullare quando scompare: un task Rust lo fa da solo, e TSX annulla in [`cleanup`](./reactivity.md):

```rust tabs
use nsh_core::prelude::*;

fn weather(city: String) -> impl IntoElement {
    let data = signal(String::new());
    // The task, and its request, end when the component goes away.
    spawn(async move {
        if let Ok(response) = fetch(format!("https://api.example.com/weather?city={city}")).await {
            data.set(response.text());
        }
    });
    text(move || data.get())
}
```

```tsx tabs
import { cleanup, signal, Text } from "nsh";

function Weather(props: { city: string }) {
  const data = signal<unknown>(null);
  const controller = new AbortController();
  cleanup(() => controller.abort());
  fetch(`https://api.example.com/weather?city=${encodeURIComponent(props.city)}`, { signal: controller.signal })
    .then((r) => r.json())
    .then((d) => data.set(d))
    .catch(() => {});
  return <Text>{JSON.stringify(data())}</Text>;
}
```

<a id="errors"></a>

## Errori

Una richiesta che non produce una risposta HTTP fallisce: `fetch` di Rust restituisce un `Err` con il messaggio, quello di TSX viene rifiutato con un `TypeError` il cui messaggio inizia con `Network request failed:`. Succede in assenza di connessione, per un errore DNS o TLS, per uno schema URL non supportato, o per una richiesta che le capability della tua app non consentono. Controlla `ok()` / `status()` (TSX: `response.ok`, `response.status`) per gli errori HTTP.

```rust tabs
match fetch(url).await {
    Ok(response) if response.ok() => items.set(response.text()),
    Ok(response) => error.set(format!("Server answered {}", response.status())),
    Err(message) => error.set(message), // no response, or not granted
}
```

```tsx tabs
try {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Server answered ${response.status}`);
  return await response.json();
} catch (e) {
  if (e instanceof DOMException && e.name === "AbortError") return; // cancelled
  showError(String(e));
}
```

<a id="from-rust-components"></a>

## Dai componenti Rust

I componenti Rust, le funzioni `#[module]` e i membri `#[class]` chiamano `fetch` da un task: `spawn` in un componente, `resource` per un valore mostrato dalla UI, oppure un `async fn` esportato verso TSX, che TSX attende come Promise. Una richiesta è un URL o un `HttpRequest` (`HttpRequest::get(url)`, `HttpRequest::post(url, body)`, `.header(name, value)`), e la sua risposta arriva completa. Il task possiede la richiesta: eliminarlo (drop), o la scomparsa del componente che lo ha avviato, annulla la richiesta. Usa lo stesso stack di rete e gli stessi controlli delle capability di TSX, su ogni piattaforma e nel browser.

<a id="capabilities-which-hosts-an-app-may-reach"></a>

## Capability: quali host può raggiungere un'app

Un'app può dichiarare in `nsh.json` con quali host comunica. Una volta presente `"capabilities"`, tutto ciò che non è elencato viene negato:

```json
{
  "capabilities": {
    "network": {
      "hosts": ["api.example.com", "*.cdn.example.com"],
      "http": [
        { "host": "quotes.example.com", "methods": ["GET"], "pathPrefix": "/v1/" }
      ]
    }
  }
}
```

| Chiave | Descrizione |
|---|---|
| `network.hosts` | Host raggiungibili con qualsiasi metodo: `"*"` (qualsiasi host), `"*.example.com"` (i suoi sottodomini, non `example.com` stesso) o un nome host. |
| `network.http` | Permessi più granulari: un `host`, eventualmente limitato a `methods`, `schemes`, un `port`, `paths` esatto e `pathPrefixes`. |

I controlli vengono applicati nel runtime di NSH, al di fuori del codice della tua app, prima che una richiesta raggiunga la rete:

- Una `fetch` rifiutata fallisce (in TSX con un `TypeError`, come ogni richiesta fallita) con un messaggio che indica la chiave da aggiungere, ad esempio ``Network request failed: fetch GET https://evil.io/ is not granted: add `evil.io` to capabilities.network in nsh.json``. In TSX il `code` dell'errore è `"ERR_ACCESS_DENIED"`, il suo `permission` è `"network"` e il suo `resource` è l'URL rifiutato (quello della richiesta, o di un redirect), così l'app distingue un rifiuto da una connessione persa:

  ```ts
  try {
    await fetch(url);
  } catch (error) {
    if (error.code === "ERR_ACCESS_DENIED") console.warn(`not granted: ${error.resource}`);
    else throw error;
  }
  ```
- **Ogni redirect viene ricontrollato.** NSH segue i redirect da solo (fino a 20) invece di lasciarli alla piattaforma, quindi un host autorizzato non può reindirizzare la tua app verso uno che non lo è.
- Gli stessi permessi `network` valgono per le immagini remote (anche nei canvas e in `Image.getSize` / `prefetch`) e per le sorgenti video. Gli URI `asset:` del tuo bundle sono sempre consentiti.
- L'host viene preso dopo l'ultimo `@`, quindi `https://ok.com@evil.io` conta come `evil.io`.

Un'app senza `"capabilities"` può raggiungere ogni host: un'app standalone appartiene al suo sviluppatore. Le app incorporate in un'app host o distribuite come [pacchetti firmati](./signed-packages.md) dovrebbero dichiararle; l'app host può concedere meno di quanto un'app dichiari, e una richiesta deve essere consentita da entrambe. Lo sviluppo con `nsh dev` / `nsh run` applica le stesse capability. Vedi [Sandbox e capability](./sandbox-and-capabilities.md).

<a id="differences-from-browsers"></a>

## Differenze rispetto ai browser

`fetch` di TSX segue lo standard Fetch con le differenze sensate per un'app anziché per una pagina web:

- **Nessun CORS.** Un'app comunica con qualsiasi host consentito dalle sue capability; non ci sono richieste preflight né risposte opache.
- **Nessun header vietato.** Un'app può impostare `Cookie`, `User-Agent`, `Origin` e altri.
- **`redirect: "manual"`** restituisce la risposta 3xx stessa (con il suo header `Location`) anziché un redirect opaco. `redirect: "error"` viene rifiutato in caso di redirect.
- **Gli URL `data:` e `blob:`** vengono risolti localmente. `URL.createObjectURL(blob)` crea un URL `blob:` che `fetch` può leggere finché non lo revochi.
- **Gli URL `asset:/`** sono i file distribuiti con l'app, letti dai file dell'app stessa senza bisogno di capability ([Leggere un file a run time](./images-and-assets.md#reading-a-file-at-run-time)).
- Le opzioni solo browser (`mode`, `credentials`, `cache`, `referrer`, `integrity`, `keepalive`, `priority`) sono accettate per compatibilità con le librerie.

Le librerie basate su `fetch` (e su `AbortController`, `FormData` e gli stream) in genere funzionano senza modifiche. Non esiste `XMLHttpRequest`; gli host nativi forniscono il global `WebSocket` e il [modulo `websocket`](../modules/standard-modules.md), controllati con gli stessi permessi di `fetch`.

<a id="related"></a>

## Vedi anche

- [API globali](../modules/globals.md): ogni global, con i suoi membri.
- [Sandbox e capability](./sandbox-and-capabilities.md): capability, limiti e come l'app che incorpora li concede.
- [Immagini e asset](./images-and-assets.md): immagini remote.
- [Liste](./lists.md#loading-more-onloadmore): paginazione tramite un'API.
