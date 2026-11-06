---
title: "Netzwerk"
description: "HTTP mit fetch – JSON, Header, Uploads mit FormData, Streaming von Antworten und Request-Bodys, Abbrechen mit AbortController, Fehler und die Netzwerkberechtigungen, die eine App deklariert."
order: 46
group: ui
source_hash: 98ed5881a270c365
---


# Netzwerk

NSH-Apps senden HTTP-Anfragen mit `fetch`: in Rust mit der Funktion von `nsh_core::prelude`, die in einem Task mit await abgewartet wird, und in TSX mit dem Standard-Global. Beide laufen auf dem Netzwerk-Stack der Plattform (NSURLSession unter iOS, HttpURLConnection unter Android, [im Web](./web.md#apps-with-rust-components) der Stack des Browsers), sodass Anfragen TLS, Proxys und HTTP/2 des Systems nutzen und beide dieselben [Capability-Prüfungen](#capabilities-which-hosts-an-app-may-reach) durchlaufen. `fetch` in Rust nimmt eine URL oder `HttpRequest` entgegen und liefert die gesamte Antwort (`HttpResponse`: `status()`, `ok()`, `header(name)`, `text()`, `body`). Das von TSX streamt in beide Richtungen: Ein Antwort-Body kommt als Stream an, sobald der Stack ihn liefert, und ein Request-Body kann ein Stream sein, der gesendet wird, während Sie ihn erzeugen. TSX bietet auch die Begleiter der Fetch API: `Headers`, `Request`, `Response`, `AbortController`, `FormData`, `Blob`, `File`, `URL`, `URLSearchParams`, `TextEncoder` / `TextDecoder` und Web Streams.

<a id="getting-json"></a>

## JSON abrufen

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

[`resource`](./reactivity.md#resource) hält den Wert, den Fehler und den Zustand, ob gerade geladen wird, lädt erneut, wenn sich eine Quelle ändert (oder bei `refetch()`), und bricht einen Ladevorgang ab, der nicht mehr zählt (die Komponente verschwindet oder ein neuerer Ladevorgang startet): in Rust, indem der Task des Ladevorgangs verworfen wird, was die Anfrage abbricht, in TSX über das `signal`, das es weitergibt. `fetch` in Rust akzeptiert absolute URLs; JSON wird mit einem Crate wie `serde_json` geparst.

In TSX lässt sich der Body von `Response` nur einmal lesen: als `json()`, `text()`, `arrayBuffer()`, `bytes()`, `blob()` oder `formData()` oder als `body`-Stream. `response.ok` ist bei 2xx-Status true; wie in Browsern lehnt ein HTTP-Fehlerstatus das Promise nicht ab.

<a id="sending-data"></a>

## Daten senden

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

`HttpRequest::new(method, url)`, `get` und `post` erstellen eine Anfrage, `.header(..)` und `.body(..)` schließen sie ab. In TSX akzeptiert `body` einen String, `URLSearchParams`, `FormData`, `Blob` oder `File`, `ArrayBuffer` oder ein Typed Array oder `ReadableStream`.

<a id="uploading-files-with-formdata"></a>

### Dateien mit FormData hochladen

In TSX wird ein `FormData`-Body als `multipart/form-data` mit seiner Boundary gesendet. NSH setzt diesen Content-Type für einen `FormData`-Body immer, selbst wenn eine Bibliothek zuvor einen Standard-`Content-Type` setzt, weil der Server den Body ohne die Boundary nicht parsen kann.

```ts
const form = new FormData();
form.append("title", "Sunset");
form.append("photo", new Blob([bytes], { type: "image/jpeg" }), "sunset.jpg");

const response = await fetch("https://api.example.com/photos", { method: "POST", body: form });
```

<a id="uploading-a-photo-the-user-picks"></a>

### Ein vom Nutzer gewähltes Foto hochladen

[`Picker`](../modules/nsh.md#picker) liefert die vom Nutzer gewählten Fotos als Dateien, deren Bytes nativ bleiben, verkleinert und in einem Format, das Server akzeptieren; Rust sendet ihre Bytes, TSX hängt `File` an `FormData` an:

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

`fetch` in TSX streamt Antworten und Request-Bodys; das von Rust liefert den gesamten Body mit der Antwort.

<a id="reading-a-response-as-it-arrives"></a>

### Eine Antwort lesen, während sie eintrifft

`response.body` ist vom Typ `ReadableStream<Uint8Array>` und wird befüllt, sobald das Netzwerk Bytes liefert. Lesen Sie den Stream Chunk für Chunk, um den Fortschritt anzuzeigen oder vom Server gesendete Zeilen zu verarbeiten, sobald sie eintreffen:

```ts
const response = await fetch("https://api.example.com/large.csv");
const total = Number(response.headers.get("Content-Length") ?? 0);
let received = 0;

for await (const chunk of response.body!) {
  received += chunk.length;
  progress.set(total ? received / total : 0);
}
```

Text-Streams werden mit `TextDecoderStream` dekodiert, und `TransformStream` teilt sie in Zeilen auf:

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

Back Pressure funktioniert durchgängig: Solange mehr als 1 MiB einer Antwort ungelesen wartet, wird die Anfrage auf Netzwerkebene pausiert, bis Ihr Code aufgeholt hat.

<a id="streaming-a-request-body"></a>

### Einen Request-Body streamen

Ein `ReadableStream`-Body wird Chunk für Chunk gesendet, sobald der Netzwerk-Stack ihn anfordert (Chunked Transfer). Übergeben Sie `duplex: "half"`, wie es der Fetch-Standard verlangt:

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

Ein gestreamter Body kann nicht zweimal gesendet werden, daher schlägt eine Weiterleitung mit 307 oder 308 bei einer gestreamten Anfrage fehl.

<a id="cancelling-and-timeouts"></a>

## Abbrechen und Timeouts

In Rust läuft eine Anfrage in einem Task und wird mit diesem abgebrochen: wenn die Komponente des Tasks verschwindet oder mit `cancel()` auf dem Task, den `spawn` zurückgibt. In TSX übergeben Sie `AbortSignal`, um eine Anfrage abzubrechen; das Promise wird mit dem Grund des Signals abgelehnt (standardmäßig `AbortError` `DOMException`), und ein gerade gelesener Body stoppt.

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

In TSX erzeugt `AbortSignal.timeout(ms)` ein Signal, das nach einer Verzögerung abbricht, und `AbortSignal.any([...])` kombiniert Signale:

```ts
const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
```

Eine Komponente, die Daten lädt, sollte abbrechen, wenn sie verschwindet: Ein Rust-Task tut das von selbst, und TSX bricht in [`cleanup`](./reactivity.md) ab:

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

## Fehler

Eine Anfrage, die keine HTTP-Antwort liefert, schlägt fehl: `fetch` in Rust liefert `Err` mit der Meldung, das von TSX wird mit `TypeError` abgelehnt, dessen Meldung mit `Network request failed:` beginnt. Das passiert bei fehlender Verbindung, einem DNS- oder TLS-Fehler, einem nicht unterstützten URL-Schema oder einer Anfrage, die die Capabilities Ihrer App nicht erlauben. Prüfen Sie `ok()` / `status()` (TSX: `response.ok`, `response.status`) auf HTTP-Fehler.

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

## Aus Rust-Komponenten

Rust-Komponenten, `#[module]`-Funktionen und `#[class]`-Member rufen `fetch` aus einem Task auf: `spawn` in einer Komponente, `resource` für einen Wert, den die UI anzeigt, oder eine nach TSX exportierte `async fn`, die TSX als Promise mit await abwartet. Eine Anfrage ist eine URL oder `HttpRequest` (`HttpRequest::get(url)`, `HttpRequest::post(url, body)`, `.header(name, value)`), und ihre Antwort trifft vollständig ein. Der Task besitzt die Anfrage: Wird er verworfen oder verschwindet die Komponente, die ihn gestartet hat, wird die Anfrage abgebrochen. Er nutzt denselben Netzwerk-Stack und dieselben Capability-Prüfungen wie TSX, auf jeder Plattform und im Browser.

<a id="capabilities-which-hosts-an-app-may-reach"></a>

## Capabilities: welche Hosts eine App erreichen darf

Eine App kann in `nsh.json` deklarieren, mit welchen Hosts sie kommuniziert. Sobald `"capabilities"` vorhanden ist, wird alles nicht Aufgeführte verweigert:

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

| Schlüssel | Beschreibung |
|---|---|
| `network.hosts` | Hosts, die mit jeder Methode erreichbar sind: `"*"` (jeder Host), `"*.example.com"` (seine Subdomains, nicht `example.com` selbst) oder ein Hostname. |
| `network.http` | Feinere Freigaben: `host`, optional beschränkt auf `methods`, `schemes`, `port`, exakte `paths` und `pathPrefixes`. |

Die Prüfungen werden in der Runtime von NSH außerhalb des Codes Ihrer App durchgesetzt, bevor eine Anfrage das Netzwerk erreicht:

- Ein verweigerter Aufruf von `fetch` schlägt fehl (in TSX mit `TypeError`, wie jede fehlgeschlagene Anfrage) mit einer Meldung, die den hinzuzufügenden Schlüssel nennt, etwa ``Network request failed: fetch GET https://evil.io/ is not granted: add `evil.io` to capabilities.network in nsh.json``. In TSX ist `code` des Fehlers `"ERR_ACCESS_DENIED"`, sein `permission` `"network"` und sein `resource` die verweigerte URL (die der Anfrage oder die einer Weiterleitung), sodass die App eine Verweigerung von einer verlorenen Verbindung unterscheiden kann:

  ```ts
  try {
    await fetch(url);
  } catch (error) {
    if (error.code === "ERR_ACCESS_DENIED") console.warn(`not granted: ${error.resource}`);
    else throw error;
  }
  ```
- **Jede Weiterleitung wird erneut geprüft.** NSH folgt Weiterleitungen selbst (bis zu 20), statt es der Plattform zu überlassen, sodass ein freigegebener Host Ihre App nicht auf einen nicht freigegebenen umleiten kann.
- Dieselben `network`-Freigaben gelten für Remote-Bilder (auch in Canvases und `Image.getSize` / `prefetch`) und Videoquellen. `asset:`-URIs Ihres eigenen Bundles sind immer erlaubt.
- Der Host wird nach dem letzten `@` ermittelt, sodass `https://ok.com@evil.io` als `evil.io` zählt.

Eine App ohne `"capabilities"` darf jeden Host erreichen: Eine eigenständige App gehört ihrem Entwickler. In eine Host-App eingebettete oder als [signierte Pakete](./signed-packages.md) verteilte Apps sollten sie deklarieren; die Host-App kann weniger freigeben, als eine App deklariert, und eine Anfrage muss von beiden erlaubt werden. Die Entwicklung mit `nsh dev` / `nsh run` erzwingt dieselben Capabilities. Siehe [Sandbox und Capabilities](./sandbox-and-capabilities.md).

<a id="differences-from-browsers"></a>

## Unterschiede zu Browsern

`fetch` in TSX folgt dem Fetch-Standard, mit den Abweichungen, die für eine App statt einer Webseite sinnvoll sind:

- **Kein CORS.** Eine App spricht mit jedem Host, den ihre Capabilities erlauben; es gibt keine Preflight-Anfragen und keine opaken Antworten.
- **Keine verbotenen Header.** Eine App darf `Cookie`, `User-Agent`, `Origin` und weitere setzen.
- **`redirect: "manual"`** liefert die 3xx-Antwort selbst (mit ihrem `Location`-Header) statt einer opaken Weiterleitung. `redirect: "error"` lehnt bei einer Weiterleitung ab.
- **`data:`- und `blob:`-URLs** werden lokal beantwortet. `URL.createObjectURL(blob)` erzeugt eine `blob:`-URL, die `fetch` lesen kann, bis Sie sie widerrufen.
- **`asset:/`-URLs** sind die Dateien, die die App mitliefert, gelesen aus den eigenen Dateien der App, ohne dass eine Capability nötig ist ([Eine Datei zur Laufzeit lesen](./images-and-assets.md#reading-a-file-at-run-time)).
- Optionen, die es nur in Browsern gibt (`mode`, `credentials`, `cache`, `referrer`, `integrity`, `keepalive`, `priority`), werden aus Kompatibilitätsgründen mit Bibliotheken akzeptiert.

Bibliotheken, die auf `fetch` aufbauen (und auf `AbortController`, `FormData` und Streams), funktionieren in der Regel unverändert. Es gibt kein `XMLHttpRequest`; native Hosts stellen das globale `WebSocket` und das [Modul `websocket`](../modules/standard-modules.md) bereit, geprüft gegen dieselben Freigaben wie `fetch`.

<a id="related"></a>

## Siehe auch

- [Global APIs](../modules/globals.md): jedes Global mit seinen Membern.
- [Sandbox und Capabilities](./sandbox-and-capabilities.md): Capabilities, Limits und wie die einbettende App sie freigibt.
- [Bilder und Assets](./images-and-assets.md): Remote-Bilder.
- [Listen](./lists.md#loading-more-onloadmore): Paginierung durch eine API.
