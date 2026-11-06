---
title: "Réseau"
description: "HTTP avec fetch : JSON, en-têtes, envois avec FormData, réponses et corps de requête en streaming, annulation avec AbortController, erreurs et capacités réseau déclarées par une application."
order: 46
group: ui
source_hash: 98ed5881a270c365
---

# Réseau

Les apps NSH font des requêtes HTTP avec `fetch` : en Rust, la fonction de `nsh_core::prelude`, attendue dans une tâche, et en TSX le global standard. Les deux s'appuient sur la pile réseau de la plateforme (NSURLSession sur iOS, HttpURLConnection sur Android, celle du navigateur [sur le web](./web.md#apps-with-rust-components)). Les requêtes utilisent donc le TLS, les proxys et HTTP/2 du système, et les deux passent les mêmes [vérifications de capacités](#capabilities-which-hosts-an-app-may-reach). `fetch` de Rust prend une URL ou un `HttpRequest` et renvoie la réponse complète (`HttpResponse` : `status()`, `ok()`, `header(name)`, `text()`, `body`). Celui de TSX fait du streaming dans les deux sens : le corps d'une réponse arrive sous forme de flux au fur et à mesure que la pile le délivre, et le corps d'une requête peut être un flux envoyé à mesure que vous le produisez. TSX propose aussi les compagnons de l'API Fetch : `Headers`, `Request`, `Response`, `AbortController`, `FormData`, `Blob`, `File`, `URL`, `URLSearchParams`, `TextEncoder` / `TextDecoder` et les Web Streams.

<a id="getting-json"></a>

## Récupérer du JSON

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

[`resource`](./reactivity.md#resource) conserve la valeur, l'erreur et l'état d'exécution d'un chargement, recharge à partir d'une source qui change (ou sur `refetch()`), et annule un chargement qui ne compte plus (le composant disparaît, ou un chargement plus récent démarre) : en Rust en abandonnant la tâche du chargement, ce qui annule sa requête, en TSX via le `signal` qu'il transmet. `fetch` de Rust prend des URL absolues ; le JSON est analysé avec une crate telle que `serde_json`.

En TSX, un `Response` lit son corps une seule fois, sous forme de `json()`, `text()`, `arrayBuffer()`, `bytes()`, `blob()` ou `formData()`, ou sous forme de flux `body`. `response.ok` vaut true pour les statuts 2xx ; comme dans les navigateurs, un statut d'erreur HTTP ne rejette pas la promesse.

<a id="sending-data"></a>

## Envoyer des données

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

`HttpRequest::new(method, url)`, `get` et `post` effectuent une requête, `.header(..)` et `.body(..)` la complètent. En TSX, `body` accepte une chaîne, `URLSearchParams`, `FormData`, un `Blob` ou `File`, un `ArrayBuffer` ou un tableau typé, ou un `ReadableStream`.

<a id="uploading-files-with-formdata"></a>

### Téléverser des fichiers avec FormData

En TSX, un corps `FormData` est envoyé en `multipart/form-data` avec sa frontière (boundary). NSH définit toujours ce type de contenu pour un corps `FormData`, même si une bibliothèque définit d'abord un `Content-Type` par défaut, car sans la frontière le serveur ne peut pas l'analyser.

```ts
const form = new FormData();
form.append("title", "Sunset");
form.append("photo", new Blob([bytes], { type: "image/jpeg" }), "sunset.jpg");

const response = await fetch("https://api.example.com/photos", { method: "POST", body: form });
```

<a id="uploading-a-photo-the-user-picks"></a>

### Téléverser une photo choisie par l'utilisateur

[`Picker`](../modules/nsh.md#picker) fournit les photos choisies par l'utilisateur sous forme de fichiers dont les octets restent natifs, réduits
et dans un format accepté par les serveurs ; Rust envoie leurs octets, TSX ajoute le `File` à un `FormData` :

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

`fetch` de TSX diffuse en flux les réponses et les corps de requête ; celui de Rust renvoie le corps entier avec la réponse.

<a id="reading-a-response-as-it-arrives"></a>

### Lire une réponse au fur et à mesure

`response.body` est un `ReadableStream<Uint8Array>` rempli à mesure que le réseau délivre les octets. Lisez-le morceau par morceau pour afficher la progression ou pour traiter les lignes server-sent dès leur arrivée :

```ts
const response = await fetch("https://api.example.com/large.csv");
const total = Number(response.headers.get("Content-Length") ?? 0);
let received = 0;

for await (const chunk of response.body!) {
  received += chunk.length;
  progress.set(total ? received / total : 0);
}
```

Les flux de texte se décodent avec `TextDecoderStream`, et un `TransformStream` les découpe en lignes :

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

La contre-pression fonctionne de bout en bout : tant que plus de 1 Mio d'une réponse attend d'être lu, la requête est suspendue au niveau réseau jusqu'à ce que votre code rattrape son retard.

<a id="streaming-a-request-body"></a>

### Envoyer un corps de requête en flux

Un corps `ReadableStream` est envoyé morceau par morceau à mesure que la pile réseau le demande (transfert chunked). Passez `duplex: "half"`, comme l'exige le standard Fetch :

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

Un corps en flux ne peut pas être envoyé deux fois ; une redirection 307 ou 308 d'une requête en flux échoue donc.

<a id="cancelling-and-timeouts"></a>

## Annulation et délais d'expiration

En Rust, une requête s'exécute dans une tâche et est annulée avec elle : lorsque le composant de la tâche disparaît, ou avec `cancel()` sur la tâche que `spawn` renvoie. En TSX, passez un `AbortSignal` pour annuler une requête ; la promesse est rejetée avec la raison du signal (par défaut un `AbortError` `DOMException`), et la lecture d'un corps en cours s'arrête.

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

En TSX, `AbortSignal.timeout(ms)` crée un signal qui abandonne après un délai, et `AbortSignal.any([...])` combine des signaux :

```ts
const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
```

Un composant qui charge des données doit annuler lorsqu'il disparaît : une tâche Rust le fait d'elle-même, et TSX abandonne dans [`cleanup`](./reactivity.md) :

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

## Erreurs

Une requête qui ne produit pas de réponse HTTP échoue : `fetch` de Rust renvoie une `Err` avec le message, celui de TSX est rejeté avec une `TypeError` dont le message commence par `Network request failed:`. Cela se produit en l'absence de connexion, lors d'un échec DNS ou TLS, avec un schéma d'URL non pris en charge, ou avec une requête que les capacités de votre app n'autorisent pas. Vérifiez `ok()` / `status()` (TSX : `response.ok`, `response.status`) pour les erreurs HTTP.

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

## Depuis des composants Rust

Les composants Rust, les fonctions `#[module]` et les membres `#[class]` appellent `fetch` depuis une tâche : `spawn` dans un composant, `resource` pour une valeur que l'UI affiche, ou une `async fn` exportée vers TSX, que TSX attend comme une Promise. Une requête est une URL ou un `HttpRequest` (`HttpRequest::get(url)`, `HttpRequest::post(url, body)`, `.header(name, value)`), et sa réponse arrive en entier. La tâche possède la requête : l'abandonner, ou la disparition du composant qui l'a lancée, annule la requête. Elle utilise la même pile réseau et les mêmes vérifications de capacités que TSX, sur toutes les plateformes et dans le navigateur.

<a id="capabilities-which-hosts-an-app-may-reach"></a>

## Capacités : quels hôtes une app peut joindre

Une app peut déclarer dans `nsh.json` les hôtes avec lesquels elle communique. Dès que `"capabilities"` est présent, tout ce qui n'est pas listé est refusé :

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

| Clé | Description |
|---|---|
| `network.hosts` | Hôtes joignables avec n'importe quelle méthode : `"*"` (n'importe quel hôte), `"*.example.com"` (ses sous-domaines, pas `example.com` lui-même) ou un nom d'hôte. |
| `network.http` | Autorisations plus fines : un `host`, éventuellement limité à `methods`, `schemes`, un `port`, `paths` exact et `pathPrefixes`. |

Les vérifications sont appliquées dans le runtime de NSH, en dehors du code de votre app, avant qu'une requête n'atteigne le réseau :

- Un `fetch` refusé échoue (en TSX avec une `TypeError`, comme toute requête échouée) avec un message nommant la clé à ajouter, par exemple ``Network request failed: fetch GET https://evil.io/ is not granted: add `evil.io` to capabilities.network in nsh.json``. En TSX, le `code` de l'erreur vaut `"ERR_ACCESS_DENIED"`, son `permission` `"network"` et son `resource` l'URL refusée (celle de la requête, ou d'une redirection), ce qui permet à l'app de distinguer un refus d'une connexion perdue :

  ```ts
  try {
    await fetch(url);
  } catch (error) {
    if (error.code === "ERR_ACCESS_DENIED") console.warn(`not granted: ${error.resource}`);
    else throw error;
  }
  ```
- **Chaque redirection est revérifiée.** NSH suit lui-même les redirections (jusqu'à 20) au lieu de laisser la plateforme le faire, de sorte qu'un hôte autorisé ne peut pas rediriger votre app vers un hôte qui ne l'est pas.
- Les mêmes autorisations `network` couvrent les images distantes (également dans les canvas et `Image.getSize` / `prefetch`) et les sources vidéo. Les URI `asset:` de votre propre bundle sont toujours autorisés.
- L'hôte est pris après le dernier `@`, de sorte que `https://ok.com@evil.io` compte comme `evil.io`.

Une app sans `"capabilities"` peut joindre tous les hôtes : une app autonome appartient à son développeur. Les apps intégrées dans une app hôte ou distribuées sous forme de [paquets signés](./signed-packages.md) devraient les déclarer ; l'app hôte peut accorder moins que ce qu'une app déclare, et une requête doit être autorisée par les deux. Le développement avec `nsh dev` / `nsh run` applique les mêmes capacités. Voir [Sandbox et capacités](./sandbox-and-capabilities.md).

<a id="differences-from-browsers"></a>

## Différences avec les navigateurs

`fetch` de TSX suit le standard Fetch, avec les différences qui ont du sens pour une app plutôt que pour une page web :

- **Pas de CORS.** Une app communique avec tout hôte que ses capacités autorisent ; il n'y a ni requêtes preflight ni réponses opaques.
- **Pas d'en-têtes interdits.** Une app peut définir `Cookie`, `User-Agent`, `Origin` et d'autres.
- **`redirect: "manual"`** donne la réponse 3xx elle-même (avec son en-tête `Location`) plutôt qu'une redirection opaque. `redirect: "error"` rejette en cas de redirection.
- **Les URL `data:` et `blob:`** sont traitées localement. `URL.createObjectURL(blob)` crée une URL `blob:` que `fetch` peut lire jusqu'à sa révocation.
- **Les URL `asset:/`** sont les fichiers livrés avec l'app, lus depuis les fichiers propres de l'app sans capacité requise ([Lire un fichier à l'exécution](./images-and-assets.md#reading-a-file-at-run-time)).
- Les options propres aux navigateurs (`mode`, `credentials`, `cache`, `referrer`, `integrity`, `keepalive`, `priority`) sont acceptées pour la compatibilité avec les bibliothèques.

Les bibliothèques construites sur `fetch` (et sur `AbortController`, `FormData` et les flux) fonctionnent généralement sans modification. Il n'y a pas de `XMLHttpRequest` ; les hôtes natifs fournissent le global `WebSocket` et le [module `websocket`](../modules/standard-modules.md), vérifiés selon les mêmes autorisations que `fetch`.

<a id="related"></a>

## Voir aussi

- [API globales](../modules/globals.md) : chaque global, avec ses membres.
- [Sandbox et capacités](./sandbox-and-capabilities.md) : capacités, limites et manière dont l'app hôte les accorde.
- [Images et ressources](./images-and-assets.md) : images distantes.
- [Listes](./lists.md#loading-more-onloadmore) : paginer une API.
