---
title: "Работа с сетью"
description: "HTTP с помощью fetch: JSON, заголовки, загрузка данных с FormData, потоковая передача ответов и тел запросов, отмена с помощью AbortController, ошибки и сетевые разрешения, которые объявляет приложение."
order: 46
group: ui
source_hash: 98ed5881a270c365
---

# Работа с сетью

Приложения NSH выполняют HTTP-запросы с помощью `fetch`: в Rust это функция из `nsh_core::prelude`, которую ожидают в задаче, а в TSX это стандартная глобальная функция. Обе работают поверх сетевого стека платформы (NSURLSession на iOS, HttpURLConnection на Android, стек браузера [в вебе](./web.md#apps-with-rust-components)), поэтому запросы используют системные TLS, прокси и HTTP/2, а также проходят одни и те же [проверки capabilities](#capabilities-which-hosts-an-app-may-reach). `fetch` в Rust принимает URL или `HttpRequest` и возвращает ответ целиком (`HttpResponse`: `status()`, `ok()`, `header(name)`, `text()`, `body`). Версия в TSX работает потоково в обе стороны: тело ответа поступает как поток по мере того, как его отдаёт сетевой стек, а тело запроса может быть потоком, который отправляется по мере его формирования. В TSX есть и сопутствующие сущности Fetch API: `Headers`, `Request`, `Response`, `AbortController`, `FormData`, `Blob`, `File`, `URL`, `URLSearchParams`, `TextEncoder` / `TextDecoder` и Web Streams.

<a id="getting-json"></a>

## Получение JSON

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

[`resource`](./reactivity.md#resource) хранит значение, ошибку и признак выполнения загрузки, загружает данные заново при изменении источника (или по `refetch()`) и отменяет загрузку, которая уже не нужна (компонент исчез или началась более новая загрузка): в Rust для этого достаточно отбросить задачу загрузки, что отменяет её запрос, а в TSX используется передаваемый `signal`. `fetch` в Rust принимает абсолютные URL; JSON разбирается с помощью крейта, например `serde_json`.

В TSX `Response` позволяет прочитать тело один раз: как `json()`, `text()`, `arrayBuffer()`, `bytes()`, `blob()` или `formData()`, либо как поток `body`. `response.ok` равно true для статусов 2xx; как и в браузерах, HTTP-статус с ошибкой не приводит к отклонению промиса.

<a id="sending-data"></a>

## Отправка данных

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

`HttpRequest::new(method, url)`, `get` и `post` создают запрос, а `.header(..)` и `.body(..)` завершают его. В TSX `body` принимает строку, `URLSearchParams`, `FormData`, `Blob` или `File`, `ArrayBuffer` или типизированный массив, либо `ReadableStream`.

<a id="uploading-files-with-formdata"></a>

### Загрузка файлов с помощью FormData

В TSX тело `FormData` отправляется как `multipart/form-data` вместе с boundary. NSH всегда устанавливает этот content type для тела `FormData`, даже если библиотека заранее задаёт `Content-Type` по умолчанию, потому что без boundary сервер не сможет его разобрать.

```ts
const form = new FormData();
form.append("title", "Sunset");
form.append("photo", new Blob([bytes], { type: "image/jpeg" }), "sunset.jpg");

const response = await fetch("https://api.example.com/photos", { method: "POST", body: form });
```

<a id="uploading-a-photo-the-user-picks"></a>

### Загрузка фото, выбранного пользователем

[`Picker`](../modules/nsh.md#picker) возвращает выбранные пользователем фото как файлы, байты которых остаются нативными, уменьшенные
и в формате, который принимают серверы; Rust отправляет их байты, а TSX добавляет `File` в `FormData`:

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

<a id="streaming"></a>

## Потоковая передача

`fetch` в TSX передаёт потоком ответы и тела запросов; версия в Rust возвращает тело целиком вместе с ответом.

<a id="reading-a-response-as-it-arrives"></a>

### Чтение ответа по мере поступления

`response.body` — это `ReadableStream<Uint8Array>`, который заполняется по мере поступления байтов из сети. Читайте его по частям, чтобы показывать прогресс или обрабатывать строки server-sent events по мере их прихода:

```ts
const response = await fetch("https://api.example.com/large.csv");
const total = Number(response.headers.get("Content-Length") ?? 0);
let received = 0;

for await (const chunk of response.body!) {
  received += chunk.length;
  progress.set(total ? received / total : 0);
}
```

Текстовые потоки декодируются с помощью `TextDecoderStream`, а `TransformStream` разбивает их на строки:

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

Back pressure работает от начала до конца: пока более 1 МиБ ответа ожидает прочтения, запрос приостанавливается на сетевом уровне, пока ваш код не догонит.

<a id="streaming-a-request-body"></a>

### Потоковая отправка тела запроса

Тело `ReadableStream` отправляется по частям, по мере того как его запрашивает сетевой стек (chunked transfer). Передайте `duplex: "half"`, как того требует стандарт Fetch:

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

Потоковое тело нельзя отправить дважды, поэтому редирект 307 или 308 для запроса с потоковым телом завершается ошибкой.

<a id="cancelling-and-timeouts"></a>

## Отмена и тайм-ауты

В Rust запрос выполняется в задаче и отменяется вместе с ней: когда исчезает компонент задачи или при вызове `cancel()` для задачи, которую возвращает `spawn`. В TSX для отмены запроса передайте `AbortSignal`; промис отклоняется с причиной сигнала (по умолчанию это `AbortError` `DOMException`), а чтение тела прекращается.

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

В TSX `AbortSignal.timeout(ms)` создаёт сигнал, который срабатывает через заданную задержку, а `AbortSignal.any([...])` объединяет сигналы:

```ts
const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
```

Компонент, загружающий данные, должен отменять загрузку при исчезновении: задача Rust делает это сама, а в TSX отмену выполняют в [`cleanup`](./reactivity.md):

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

## Ошибки

Запрос, который не привёл к HTTP-ответу, завершается ошибкой: `fetch` в Rust возвращает `Err` с сообщением, а версия в TSX отклоняется с `TypeError`, сообщение которого начинается с `Network request failed:`. Это происходит при отсутствии соединения, сбое DNS или TLS, неподдерживаемой схеме URL или запросе, который не разрешён capabilities вашего приложения. Для HTTP-ошибок проверяйте `ok()` / `status()` (в TSX: `response.ok`, `response.status`).

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

## Из компонентов на Rust

Компоненты на Rust, функции `#[module]` и члены `#[class]` вызывают `fetch` из задачи: `spawn` в компоненте, `resource` для значения, которое показывает UI, или `async fn`, экспортируемую в TSX, которую TSX ожидает как Promise. Запрос — это URL или `HttpRequest` (`HttpRequest::get(url)`, `HttpRequest::post(url, body)`, `.header(name, value)`), а ответ приходит целиком. Задача владеет запросом: если её отбросить или если исчезнет породивший её компонент, запрос будет отменён. Используются тот же сетевой стек и те же проверки capabilities, что и в TSX, на всех платформах и в браузере.

<a id="capabilities-which-hosts-an-app-may-reach"></a>

## Capabilities: к каким хостам приложение может обращаться

Приложение может объявить в `nsh.json`, с какими хостами оно взаимодействует. Как только присутствует `"capabilities"`, всё, что не перечислено, запрещено:

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

| Ключ | Описание |
|---|---|
| `network.hosts` | Хосты, доступные для любого метода: `"*"` (любой хост), `"*.example.com"` (его поддомены, но не сам `example.com`) или имя хоста. |
| `network.http` | Более точные разрешения: `host`, при необходимости ограниченный `methods`, `schemes`, `port`, точным `paths` и `pathPrefixes`. |

Проверки выполняются в среде выполнения NSH, вне кода вашего приложения, до того как запрос попадёт в сеть:

- Отклонённый `fetch` завершается ошибкой (в TSX это `TypeError`, как и для любого неудавшегося запроса) с сообщением, называющим ключ, который нужно добавить, например ``Network request failed: fetch GET https://evil.io/ is not granted: add `evil.io` to capabilities.network in nsh.json``. В TSX `code` ошибки равно `"ERR_ACCESS_DENIED"`, её `permission` равно `"network"`, а `resource` содержит отклонённый URL (самого запроса или редиректа), так что приложение может отличить отказ от потери соединения:

  ```ts
  try {
    await fetch(url);
  } catch (error) {
    if (error.code === "ERR_ACCESS_DENIED") console.warn(`not granted: ${error.resource}`);
    else throw error;
  }
  ```
- **Каждый редирект проверяется заново.** NSH сам следует редиректам (до 20), а не поручает это платформе, поэтому разрешённый хост не может перенаправить ваше приложение на неразрешённый.
- Те же разрешения `network` действуют для удалённых изображений (в том числе в canvas и `Image.getSize` / `prefetch`) и источников видео. URI `asset:` вашего собственного бандла разрешены всегда.
- Хост определяется после последнего `@`, поэтому `https://ok.com@evil.io` считается `evil.io`.

Приложение без `"capabilities"` может обращаться к любым хостам: автономное приложение принадлежит самому разработчику. Приложения, встроенные в хост-приложение или распространяемые как [подписанные пакеты](./signed-packages.md), должны их объявлять; хост-приложение может выдать меньше, чем объявляет приложение, а запрос должен быть разрешён обеими сторонами. При разработке с `nsh dev` / `nsh run` те же capabilities также применяются. См. [Песочница и capabilities](./sandbox-and-capabilities.md).

<a id="differences-from-browsers"></a>

## Отличия от браузеров

`fetch` в TSX следует стандарту Fetch, с отличиями, которые имеют смысл для приложения, а не для веб-страницы:

- **Нет CORS.** Приложение обращается к любому хосту, который разрешают его capabilities; нет preflight-запросов и непрозрачных ответов.
- **Нет запрещённых заголовков.** Приложение может устанавливать `Cookie`, `User-Agent`, `Origin` и другие.
- **`redirect: "manual"`** возвращает сам ответ 3xx (с заголовком `Location`), а не непрозрачный редирект. `redirect: "error"` отклоняется при редиректе.
- **URL `data:` и `blob:`** обрабатываются локально. `URL.createObjectURL(blob)` создаёт URL `blob:`, который `fetch` может читать, пока вы его не отзовёте.
- **URL `asset:/`** указывают на файлы, поставляемые с приложением; они читаются из собственных файлов приложения и не требуют capabilities ([Чтение файла во время выполнения](./images-and-assets.md#reading-a-file-at-run-time)).
- Опции, существующие только в браузерах (`mode`, `credentials`, `cache`, `referrer`, `integrity`, `keepalive`, `priority`), принимаются для совместимости с библиотеками.

Библиотеки, построенные на `fetch` (а также на `AbortController`, `FormData` и потоках), как правило, работают без изменений. `XMLHttpRequest` отсутствует; нативные хосты предоставляют глобальный `WebSocket` и [модуль `websocket`](../modules/standard-modules.md), которые проверяются по тем же разрешениям, что и `fetch`.

<a id="related"></a>

## См. также

- [Глобальные API](../modules/globals.md): все глобальные сущности с их членами.
- [Песочница и capabilities](./sandbox-and-capabilities.md): capabilities, ограничения и то, как их выдаёт встраивающее приложение.
- [Изображения и ресурсы](./images-and-assets.md): удалённые изображения.
- [Списки](./lists.md#loading-more-onloadmore): постраничная загрузка из API.
