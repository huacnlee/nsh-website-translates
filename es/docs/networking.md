---
title: "Redes"
description: "HTTP con fetch: JSON, encabezados, cargas con FormData, respuestas y cuerpos de solicitud en streaming, cancelación con AbortController, errores y las capacidades de red que declara una app."
order: 46
group: ui
source_hash: 98ed5881a270c365
---


# Redes

Las apps de NSH hacen peticiones HTTP con `fetch`: en Rust, la función de `nsh_core::prelude`, con await dentro de una tarea, y en TSX, la global estándar. Ambas se ejecutan sobre la pila de red de la plataforma (NSURLSession en iOS, HttpURLConnection en Android, la del navegador [en la web](./web.md#apps-with-rust-components)), de modo que las peticiones usan el TLS, los proxies y HTTP/2 del sistema, y ambas pasan las mismas [comprobaciones de capacidades](#capabilities-which-hosts-an-app-may-reach). `fetch` de Rust recibe una URL o un `HttpRequest` y devuelve la respuesta completa (`HttpResponse`: `status()`, `ok()`, `header(name)`, `text()`, `body`). El de TSX hace streaming en ambos sentidos: el cuerpo de una respuesta llega como un stream a medida que lo entrega la pila de red, y el cuerpo de una petición puede ser un stream que se envía según lo produces. TSX también incluye los complementos de la Fetch API: `Headers`, `Request`, `Response`, `AbortController`, `FormData`, `Blob`, `File`, `URL`, `URLSearchParams`, `TextEncoder` / `TextDecoder` y Web Streams.

<a id="getting-json"></a>

## Obtener JSON

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

[`resource`](./reactivity.md#resource) mantiene el valor, el error y si hay una carga en curso, vuelve a cargar desde una fuente que cambia (o con `refetch()`), y cancela una carga que ya no cuenta (el componente desaparece, o empieza una carga más reciente): en Rust, descartando (drop) la tarea de la carga, lo que cancela su petición; en TSX, mediante el `signal` que le pasa. `fetch` de Rust admite URLs absolutas; el JSON se analiza con un crate como `serde_json`.

En TSX, un `Response` lee su cuerpo una sola vez, como `json()`, `text()`, `arrayBuffer()`, `bytes()`, `blob()` o `formData()`, o como el stream `body`. `response.ok` es true para los estados 2xx; como en los navegadores, un estado de error HTTP no rechaza la promesa.

<a id="sending-data"></a>

## Enviar datos

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

`HttpRequest::new(method, url)`, `get` y `post` hacen una petición; `.header(..)` y `.body(..)` la completan. En TSX, `body` acepta una cadena, `URLSearchParams`, `FormData`, un `Blob` o `File`, un `ArrayBuffer` o un typed array, o un `ReadableStream`.

<a id="uploading-files-with-formdata"></a>

### Subir archivos con FormData

En TSX, un cuerpo `FormData` se envía como `multipart/form-data` con su boundary. NSH siempre establece ese content type para un cuerpo `FormData`, incluso si una librería define antes un `Content-Type` por defecto, porque sin el boundary el servidor no puede analizarlo.

```ts
const form = new FormData();
form.append("title", "Sunset");
form.append("photo", new Blob([bytes], { type: "image/jpeg" }), "sunset.jpg");

const response = await fetch("https://api.example.com/photos", { method: "POST", body: form });
```

<a id="uploading-a-photo-the-user-picks"></a>

### Subir una foto que elige el usuario

[`Picker`](../modules/nsh.md#picker) entrega las fotos que elige el usuario como archivos cuyos bytes permanecen nativos, reducidos de tamaño y en un formato que los servidores aceptan; Rust envía sus bytes, y TSX añade el `File` a un `FormData`:

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

El `fetch` de TSX hace streaming de respuestas y de cuerpos de petición; el de Rust entrega el cuerpo completo junto con la respuesta.

<a id="reading-a-response-as-it-arrives"></a>

### Leer una respuesta a medida que llega

`response.body` es un `ReadableStream<Uint8Array>` que se llena según la red entrega bytes. Léelo fragmento a fragmento para mostrar el progreso o para procesar líneas de server-sent events según llegan:

```ts
const response = await fetch("https://api.example.com/large.csv");
const total = Number(response.headers.get("Content-Length") ?? 0);
let received = 0;

for await (const chunk of response.body!) {
  received += chunk.length;
  progress.set(total ? received / total : 0);
}
```

Los streams de texto se decodifican con `TextDecoderStream`, y un `TransformStream` los divide en líneas:

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

El back pressure funciona de extremo a extremo: mientras más de 1 MiB de una respuesta espera sin leerse, la petición se pausa a nivel de red hasta que tu código se pone al día.

<a id="streaming-a-request-body"></a>

### Enviar un cuerpo de petición como stream

Un cuerpo `ReadableStream` se envía fragmento a fragmento a medida que la pila de red lo solicita (chunked transfer). Pasa `duplex: "half"`, como exige el estándar Fetch:

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

Un cuerpo en streaming no puede enviarse dos veces, por lo que una redirección 307 o 308 de una petición en streaming falla.

<a id="cancelling-and-timeouts"></a>

## Cancelación y timeouts

En Rust, una petición se ejecuta en una tarea y se cancela junto con ella: cuando desaparece el componente de la tarea, o con `cancel()` sobre la tarea que devuelve `spawn`. En TSX, pasa un `AbortSignal` para cancelar una petición; la promesa se rechaza con el motivo de la señal (por defecto un `AbortError` `DOMException`), y la lectura de un cuerpo en curso se detiene.

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

En TSX, `AbortSignal.timeout(ms)` crea una señal que aborta tras un retardo, y `AbortSignal.any([...])` combina señales:

```ts
const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
```

Un componente que carga datos debe cancelar cuando desaparece: una tarea de Rust lo hace por sí sola, y TSX aborta en [`cleanup`](./reactivity.md):

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

## Errores

Una petición que no produce una respuesta HTTP falla: el `fetch` de Rust devuelve un `Err` con el mensaje, y el de TSX se rechaza con un `TypeError` cuyo mensaje empieza por `Network request failed:`. Esto ocurre sin conexión, ante un fallo de DNS o TLS, con un esquema de URL no admitido, o con una petición que las capacidades de tu app no permiten. Comprueba `ok()` / `status()` (TSX: `response.ok`, `response.status`) para los errores HTTP.

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

## Desde componentes Rust

Los componentes Rust, las funciones `#[module]` y los miembros `#[class]` llaman a `fetch` desde una tarea: `spawn` en un componente, `resource` para un valor que muestra la UI, o un `async fn` exportado a TSX, que TSX espera con await como una Promise. Una petición es una URL o un `HttpRequest` (`HttpRequest::get(url)`, `HttpRequest::post(url, body)`, `.header(name, value)`), y su respuesta llega completa. La tarea es dueña de la petición: descartarla, o que desaparezca el componente que la lanzó, cancela la petición. Usa la misma pila de red y las mismas comprobaciones de capacidades que TSX, en todas las plataformas y en el navegador.

<a id="capabilities-which-hosts-an-app-may-reach"></a>

## Capacidades: a qué hosts puede acceder una app

Una app puede declarar en `nsh.json` con qué hosts se comunica. En cuanto `"capabilities"` está presente, todo lo que no figura se deniega:

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

| Clave | Descripción |
|---|---|
| `network.hosts` | Hosts accesibles con cualquier método: `"*"` (cualquier host), `"*.example.com"` (sus subdominios, no `example.com` en sí) o un nombre de host. |
| `network.http` | Permisos más precisos: un `host`, opcionalmente limitado a `methods`, `schemes`, un `port`, `paths` exacto y `pathPrefixes`. |

Las comprobaciones las aplica el runtime de NSH, fuera del código de tu app, antes de que una petición llegue a la red:

- Un `fetch` rechazado falla (en TSX con un `TypeError`, como toda petición fallida) con un mensaje que nombra la clave que hay que añadir, como ``Network request failed: fetch GET https://evil.io/ is not granted: add `evil.io` to capabilities.network in nsh.json``. En TSX, el `code` del error es `"ERR_ACCESS_DENIED"`, su `permission` es `"network"` y su `resource` es la URL rechazada (la de la petición o la de una redirección), de modo que la app distingue un rechazo de una conexión perdida:

  ```ts
  try {
    await fetch(url);
  } catch (error) {
    if (error.code === "ERR_ACCESS_DENIED") console.warn(`not granted: ${error.resource}`);
    else throw error;
  }
  ```
- **Cada redirección se vuelve a comprobar.** NSH sigue las redirecciones por sí mismo (hasta 20) en lugar de dejar que lo haga la plataforma, así que un host permitido no puede redirigir tu app a uno que no lo está.
- Los mismos permisos de `network` cubren las imágenes remotas (también en canvases y en `Image.getSize` / `prefetch`) y las fuentes de vídeo. Los URIs `asset:` de tu propio bundle siempre están permitidos.
- El host se toma después del último `@`, de modo que `https://ok.com@evil.io` cuenta como `evil.io`.

Una app sin `"capabilities"` puede acceder a todos los hosts: una app independiente es del propio desarrollador. Las apps integradas en una app anfitriona o distribuidas como [paquetes firmados](./signed-packages.md) deberían declararlas; la app anfitriona puede conceder menos de lo que una app declara, y una petición debe estar permitida por ambas. El desarrollo con `nsh dev` / `nsh run` aplica las mismas capacidades. Consulta [Sandbox y capacidades](./sandbox-and-capabilities.md).

<a id="differences-from-browsers"></a>

## Diferencias con los navegadores

El `fetch` de TSX sigue el estándar Fetch, con las diferencias que tienen sentido para una app y no para una página web:

- **Sin CORS.** Una app se comunica con cualquier host que sus capacidades permitan; no hay peticiones preflight ni respuestas opacas.
- **Sin cabeceras prohibidas.** Una app puede establecer `Cookie`, `User-Agent`, `Origin` y otras.
- **`redirect: "manual"`** devuelve la propia respuesta 3xx (con su cabecera `Location`) en lugar de una redirección opaca. `redirect: "error"` se rechaza ante una redirección.
- **Las URLs `data:` y `blob:`** se responden localmente. `URL.createObjectURL(blob)` crea una URL `blob:` que `fetch` puede leer hasta que la revoques.
- **Las URLs `asset:/`** son los archivos que la app incluye, leídos de los propios archivos de la app sin necesidad de capacidades ([Leer un archivo en tiempo de ejecución](./images-and-assets.md#reading-a-file-at-run-time)).
- Las opciones exclusivas de navegador (`mode`, `credentials`, `cache`, `referrer`, `integrity`, `keepalive`, `priority`) se aceptan por compatibilidad con librerías.

Las librerías construidas sobre `fetch` (y sobre `AbortController`, `FormData` y streams) por lo general funcionan sin cambios. No existe `XMLHttpRequest`; los hosts nativos proporcionan la global `WebSocket` y el [módulo `websocket`](../modules/standard-modules.md), comprobados contra los mismos permisos que `fetch`.

<a id="related"></a>

## Relacionado

- [APIs globales](../modules/globals.md): todas las globales, con sus miembros.
- [Sandbox y capacidades](./sandbox-and-capabilities.md): capacidades, límites y cómo las concede la app que integra.
- [Imágenes y recursos](./images-and-assets.md): imágenes remotas.
- [Listas](./lists.md#loading-more-onloadmore): paginar a través de una API.
