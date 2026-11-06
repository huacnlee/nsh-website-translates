---
title: "Rede"
description: "HTTP com fetch - JSON, cabeçalhos, uploads com FormData, streaming de respostas e de corpos de requisição, cancelamento com AbortController, erros e as capacidades de rede que um app declara."
order: 46
group: ui
source_hash: 98ed5881a270c365
---


# Rede

Apps NSH fazem requisições HTTP com `fetch`: em Rust, a função de `nsh_core::prelude`, aguardada com await em uma task, e em TSX, o global padrão. Ambos rodam sobre a pilha de rede da plataforma (NSURLSession no iOS, HttpURLConnection no Android, o do navegador [na web](./web.md#apps-with-rust-components)). Assim, as requisições usam o TLS, os proxies e o HTTP/2 do sistema, e ambos passam pelas mesmas [verificações de capabilities](#capabilities-which-hosts-an-app-may-reach). O `fetch` do Rust recebe uma URL ou um `HttpRequest` e devolve a resposta completa (`HttpResponse`: `status()`, `ok()`, `header(name)`, `text()`, `body`). O do TSX faz streaming nos dois sentidos: o corpo da resposta chega como um stream, conforme a pilha o entrega, e o corpo de uma requisição pode ser um stream enviado à medida que você o produz. O TSX também tem os complementos da Fetch API: `Headers`, `Request`, `Response`, `AbortController`, `FormData`, `Blob`, `File`, `URL`, `URLSearchParams`, `TextEncoder` / `TextDecoder` e Web Streams.

<a id="getting-json"></a>

## Obtendo JSON

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

[`resource`](./reactivity.md#resource) mantém o valor, o erro e se um carregamento está em andamento, recarrega a partir de uma origem que muda (ou em `refetch()`) e cancela um carregamento que não importa mais (o componente desaparece ou um carregamento mais novo começa): no Rust, descartando a task do carregamento, o que cancela sua requisição; no TSX, por meio do `signal` que ele repassa. O `fetch` do Rust aceita URLs absolutas; o JSON é interpretado com um crate como `serde_json`.

Em TSX, um `Response` lê seu corpo uma única vez, como `json()`, `text()`, `arrayBuffer()`, `bytes()`, `blob()` ou `formData()`, ou como o stream `body`. `response.ok` é true para status 2xx; como nos navegadores, um status de erro HTTP não rejeita a promise.

<a id="sending-data"></a>

## Enviando dados

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

`HttpRequest::new(method, url)`, `get` e `post` fazem uma requisição, `.header(..)` e `.body(..)` a completam. Em TSX, `body` aceita uma string, `URLSearchParams`, `FormData`, um `Blob` ou `File`, um `ArrayBuffer` ou typed array, ou um `ReadableStream`.

<a id="uploading-files-with-formdata"></a>

### Enviando arquivos com FormData

Em TSX, um corpo `FormData` é enviado como `multipart/form-data` com seu boundary. O NSH sempre define esse content type para um corpo `FormData`, mesmo que uma biblioteca defina antes um `Content-Type` padrão, porque sem o boundary o servidor não consegue interpretá-lo.

```ts
const form = new FormData();
form.append("title", "Sunset");
form.append("photo", new Blob([bytes], { type: "image/jpeg" }), "sunset.jpg");

const response = await fetch("https://api.example.com/photos", { method: "POST", body: form });
```

<a id="uploading-a-photo-the-user-picks"></a>

### Enviando uma foto escolhida pelo usuário

[`Picker`](../modules/nsh.md#picker) entrega as fotos escolhidas pelo usuário como arquivos cujos bytes permanecem nativos, reduzidos
e em um formato aceito pelos servidores; o Rust envia seus bytes, e o TSX adiciona o `File` a um `FormData`:

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

O `fetch` do TSX faz streaming de respostas e de corpos de requisição; o do Rust entrega o corpo inteiro junto com a resposta.

<a id="reading-a-response-as-it-arrives"></a>

### Lendo uma resposta conforme ela chega

`response.body` é um `ReadableStream<Uint8Array>` preenchido à medida que a rede entrega os bytes. Leia-o pedaço por pedaço para mostrar o progresso ou para processar linhas de server-sent events assim que elas chegam:

```ts
const response = await fetch("https://api.example.com/large.csv");
const total = Number(response.headers.get("Content-Length") ?? 0);
let received = 0;

for await (const chunk of response.body!) {
  received += chunk.length;
  progress.set(total ? received / total : 0);
}
```

Streams de texto são decodificados com `TextDecoderStream`, e um `TransformStream` os divide em linhas:

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

O back pressure funciona de ponta a ponta: enquanto mais de 1 MiB de uma resposta aguarda sem ser lido, a requisição é pausada no nível da rede até que seu código a alcance.

<a id="streaming-a-request-body"></a>

### Fazendo streaming do corpo de uma requisição

Um corpo `ReadableStream` é enviado pedaço por pedaço, conforme a pilha de rede o solicita (chunked transfer). Passe `duplex: "half"`, como exige o padrão Fetch:

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

Um corpo em streaming não pode ser enviado duas vezes, portanto um redirecionamento 307 ou 308 de uma requisição em streaming falha.

<a id="cancelling-and-timeouts"></a>

## Cancelamento e timeouts

Em Rust, uma requisição roda em uma task e é cancelada junto com ela: quando o componente da task desaparece, ou com `cancel()` na task que `spawn` devolve. Em TSX, passe um `AbortSignal` para cancelar uma requisição; a promise é rejeitada com o motivo (reason) do signal (por padrão, um `AbortError` `DOMException`), e a leitura de um corpo em andamento é interrompida.

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

Em TSX, `AbortSignal.timeout(ms)` cria um signal que aborta após um atraso, e `AbortSignal.any([...])` combina signals:

```ts
const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
```

Um componente que carrega dados deve cancelar quando desaparece: uma task do Rust faz isso sozinha, e o TSX aborta em [`cleanup`](./reactivity.md):

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

## Erros

Uma requisição que não produz uma resposta HTTP falha: o `fetch` do Rust devolve um `Err` com a mensagem, e o do TSX é rejeitado com um `TypeError` cuja mensagem começa com `Network request failed:`. Isso acontece sem conexão, com falha de DNS ou de TLS, com um esquema de URL não suportado ou com uma requisição que as capabilities do seu app não permitem. Verifique `ok()` / `status()` (TSX: `response.ok`, `response.status`) para erros HTTP.

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

## A partir de componentes Rust

Componentes Rust, funções `#[module]` e membros `#[class]` chamam `fetch` a partir de uma task: `spawn` em um componente, `resource` para um valor que a UI exibe, ou um `async fn` exportado para o TSX, que o TSX aguarda como uma Promise. Uma requisição é uma URL ou um `HttpRequest` (`HttpRequest::get(url)`, `HttpRequest::post(url, body)`, `.header(name, value)`), e sua resposta chega inteira. A task é dona da requisição: descartá-la, ou o componente que a iniciou desaparecer, cancela a requisição. Ela usa a mesma pilha de rede e as mesmas verificações de capabilities do TSX, em todas as plataformas e no navegador.

<a id="capabilities-which-hosts-an-app-may-reach"></a>

## Capabilities: quais hosts um app pode acessar

Um app pode declarar em `nsh.json` com quais hosts ele se comunica. Uma vez que `"capabilities"` esteja presente, tudo o que não estiver listado é negado:

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

| Chave | Descrição |
|---|---|
| `network.hosts` | Hosts acessíveis com qualquer método: `"*"` (qualquer host), `"*.example.com"` (seus subdomínios, não o próprio `example.com`) ou um nome de host. |
| `network.http` | Permissões mais granulares: um `host`, opcionalmente limitado a `methods`, `schemes`, um `port`, `paths` exato e `pathPrefixes`. |

As verificações são aplicadas no runtime do NSH, fora do código do seu app, antes que uma requisição chegue à rede:

- Um `fetch` recusado falha (em TSX com um `TypeError`, como toda requisição que falha) com uma mensagem que nomeia a chave a adicionar, como ``Network request failed: fetch GET https://evil.io/ is not granted: add `evil.io` to capabilities.network in nsh.json``. Em TSX, o `code` do erro é `"ERR_ACCESS_DENIED"`, seu `permission` é `"network"` e seu `resource` é a URL recusada (a da requisição ou a de um redirecionamento), de modo que o app distingue uma recusa de uma conexão perdida:

  ```ts
  try {
    await fetch(url);
  } catch (error) {
    if (error.code === "ERR_ACCESS_DENIED") console.warn(`not granted: ${error.resource}`);
    else throw error;
  }
  ```
- **Todo redirecionamento é verificado novamente.** O NSH segue os redirecionamentos por conta própria (até 20) em vez de deixar a plataforma fazê-lo, de modo que um host permitido não pode redirecionar seu app para um que não seja.
- As mesmas permissões de `network` valem para imagens remotas (também em canvases e `Image.getSize` / `prefetch`) e para fontes de vídeo. URIs `asset:` do seu próprio bundle são sempre permitidas.
- O host é obtido após o último `@`, de modo que `https://ok.com@evil.io` conta como `evil.io`.

Um app sem `"capabilities"` pode acessar qualquer host: um app standalone pertence ao próprio desenvolvedor. Apps embutidos em um app host ou distribuídos como [pacotes assinados](./signed-packages.md) devem declará-las; o app host pode conceder menos do que um app declara, e uma requisição precisa ser permitida por ambos. O desenvolvimento com `nsh dev` / `nsh run` aplica as mesmas capabilities. Veja [Sandbox e capabilities](./sandbox-and-capabilities.md).

<a id="differences-from-browsers"></a>

## Diferenças em relação aos navegadores

O `fetch` do TSX segue o padrão Fetch, com as diferenças que fazem sentido para um app e não para uma página web:

- **Sem CORS.** Um app se comunica com qualquer host que suas capabilities permitam; não há requisições preflight nem respostas opacas.
- **Sem headers proibidos.** Um app pode definir `Cookie`, `User-Agent`, `Origin` e outros.
- **`redirect: "manual"`** devolve a própria resposta 3xx (com seu header `Location`) em vez de um redirecionamento opaco. `redirect: "error"` rejeita em um redirecionamento.
- **URLs `data:` e `blob:`** são respondidas localmente. `URL.createObjectURL(blob)` cria uma URL `blob:` que `fetch` pode ler até que você a revogue.
- **URLs `asset:/`** são os arquivos que o app distribui, lidos dos arquivos do próprio app sem precisar de capability ([Lendo um arquivo em tempo de execução](./images-and-assets.md#reading-a-file-at-run-time)).
- Opções exclusivas de navegador (`mode`, `credentials`, `cache`, `referrer`, `integrity`, `keepalive`, `priority`) são aceitas por compatibilidade com bibliotecas.

Bibliotecas construídas sobre `fetch` (e sobre `AbortController`, `FormData` e streams) geralmente funcionam sem alterações. Não há `XMLHttpRequest`; os hosts nativos fornecem o global `WebSocket` e o [módulo `websocket`](../modules/standard-modules.md), verificados contra as mesmas permissões de `fetch`.

<a id="related"></a>

## Relacionados

- [APIs globais](../modules/globals.md): todos os globais, com seus membros.
- [Sandbox e capabilities](./sandbox-and-capabilities.md): capabilities, limites e como o app embedder as concede.
- [Imagens e assets](./images-and-assets.md): imagens remotas.
- [Listas](./lists.md#loading-more-onloadmore): paginação por meio de uma API.
