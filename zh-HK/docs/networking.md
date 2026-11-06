---
title: "網路"
description: "使用 fetch 進行 HTTP 請求:JSON、標頭、使用 FormData 上傳、串流回應與請求主體、使用 AbortController 取消請求、錯誤處理,以及應用程式宣告的網路權限。"
order: 46
group: ui
---

# 網路

NSH 應用程式使用 `fetch` 發出 HTTP 請求：在 Rust 中是 `nsh_core::prelude` 的函式，在任務（task）中以 await 等待；在 TSX 中則是標準的全域函式。兩者都在平台的網路堆疊上執行（iOS 上為 NSURLSession，Android 上為 HttpURLConnection，[在網頁上](./web.md#apps-with-rust-components)則是瀏覽器本身的堆疊），因此請求會使用系統的 TLS、代理與 HTTP/2，且兩者都通過相同的[能力檢查](#capabilities-which-hosts-an-app-may-reach)。Rust 的 `fetch` 接受 URL 或 `HttpRequest`，並回傳完整的回應（`HttpResponse`：`status()`、`ok()`、`header(name)`、`text()`、`body`）。TSX 的版本則雙向皆可串流：回應本文會隨網路堆疊送達而以串流形式到來，請求本文也可以是串流，在你產生資料時隨即送出。TSX 也提供 Fetch API 的配套 API：`Headers`、`Request`、`Response`、`AbortController`、`FormData`、`Blob`、`File`、`URL`、`URLSearchParams`、`TextEncoder` / `TextDecoder` 以及 Web Streams。

<a id="getting-json"></a>

## 取得 JSON

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

[`resource`](./reactivity.md#resource) 會保存值、錯誤以及載入是否正在執行，在來源改變時（或於 `refetch()`）重新載入，並取消不再有效的載入（元件消失，或有較新的載入開始）：在 Rust 中是透過丟棄（drop）該載入的任務來取消其請求，在 TSX 中則是透過它傳入的 `signal`。Rust 的 `fetch` 接受絕對 URL；JSON 可用 `serde_json` 之類的 crate 解析。

在 TSX 中，`Response` 的本文只能讀取一次，可讀為 `json()`、`text()`、`arrayBuffer()`、`bytes()`、`blob()` 或 `formData()`，或讀為 `body` 串流。`response.ok` 在 2xx 狀態碼時為 true；與瀏覽器相同，HTTP 錯誤狀態碼不會使 promise 被拒絕。

<a id="sending-data"></a>

## 傳送資料

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

`HttpRequest::new(method, url)`、`get` 與 `post` 建立請求，`.header(..)` 與 `.body(..)` 完成請求。在 TSX 中，`body` 接受字串、`URLSearchParams`、`FormData`、`Blob` 或 `File`、`ArrayBuffer` 或 typed array，或 `ReadableStream`。

<a id="uploading-files-with-formdata"></a>

### 使用 FormData 上傳檔案

在 TSX 中，`FormData` 本文會以帶有 boundary 的 `multipart/form-data` 送出。NSH 對 `FormData` 本文一律設定該 content type，即使函式庫先設定了預設的 `Content-Type` 也一樣，因為沒有 boundary，伺服器就無法解析。

```ts
const form = new FormData();
form.append("title", "Sunset");
form.append("photo", new Blob([bytes], { type: "image/jpeg" }), "sunset.jpg");

const response = await fetch("https://api.example.com/photos", { method: "POST", body: form });
```

<a id="uploading-a-photo-the-user-picks"></a>

### 上傳使用者挑選的照片

[`Picker`](../modules/nsh.md#picker) 會提供使用者挑選的照片，這些照片是位元組保留在原生端的檔案，已縮小並轉換為伺服器可接受的格式；Rust 傳送其位元組，TSX 則將 `File` 附加到 `FormData`：

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

## 串流

TSX 的 `fetch` 可串流回應與請求本文；Rust 的則隨回應一併給出完整的本文。

<a id="reading-a-response-as-it-arrives"></a>

### 邊接收邊讀取回應

`response.body` 是一個隨網路送達位元組而逐步填入的 `ReadableStream<Uint8Array>`。你可以逐塊讀取它，以顯示進度，或在伺服器傳送的行抵達時隨即處理：

```ts
const response = await fetch("https://api.example.com/large.csv");
const total = Number(response.headers.get("Content-Length") ?? 0);
let received = 0;

for await (const chunk of response.body!) {
  received += chunk.length;
  progress.set(total ? received / total : 0);
}
```

文字串流以 `TextDecoderStream` 解碼，`TransformStream` 則將其切分為行：

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

背壓（back pressure）可端到端運作：當回應有超過 1 MiB 未被讀取時，請求會在網路層暫停，直到你的程式碼跟上為止。

<a id="streaming-a-request-body"></a>

### 串流請求本文

`ReadableStream` 本文會在網路堆疊要求時逐塊送出（chunked transfer）。依 Fetch 標準的要求，請傳入 `duplex: "half"`：

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

串流本文無法送出兩次，因此串流請求遇到 307 或 308 重新導向時會失敗。

<a id="cancelling-and-timeouts"></a>

## 取消與逾時

在 Rust 中，請求在任務中執行，並隨任務一起取消：當任務所屬的元件消失，或對 `spawn` 回傳的任務呼叫 `cancel()` 時即取消。在 TSX 中，傳入 `AbortSignal` 即可取消請求；promise 會以該 signal 的 reason 拒絕（預設為 `AbortError` `DOMException`），且正在讀取的本文會停止。

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

在 TSX 中，`AbortSignal.timeout(ms)` 會建立在延遲後中止的 signal，`AbortSignal.any([...])` 則可組合多個 signal：

```ts
const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
```

載入資料的元件應在消失時取消請求：Rust 任務會自行處理，TSX 則在 [`cleanup`](./reactivity.md) 中中止：

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

## 錯誤

沒有產生 HTTP 回應的請求會失敗：Rust 的 `fetch` 會給出帶有訊息的 `Err`，TSX 的則以 `TypeError` 拒絕，其訊息以 `Network request failed:` 開頭。無網路連線、DNS 或 TLS 失敗、不支援的 URL scheme，或應用程式的能力不允許的請求，都會發生這種情況。HTTP 錯誤請檢查 `ok()` / `status()`（TSX：`response.ok`、`response.status`）。

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

## 從 Rust 元件使用

Rust 元件、`#[module]` 函式與 `#[class]` 成員可在任務中呼叫 `fetch`：在元件中用 `spawn`，為 UI 顯示的值用 `resource`，或使用匯出給 TSX 的 `async fn`，TSX 會以 Promise 的方式 await 它。請求為 URL 或 `HttpRequest`（`HttpRequest::get(url)`、`HttpRequest::post(url, body)`、`.header(name, value)`），回應會完整送達。任務擁有該請求：丟棄任務，或產生它的元件消失，就會取消請求。它在所有平台及瀏覽器上，都使用與 TSX 相同的網路堆疊與能力檢查。

<a id="capabilities-which-hosts-an-app-may-reach"></a>

## 能力：應用程式可存取哪些主機

應用程式可在 `nsh.json` 中宣告它與哪些主機通訊。一旦存在 `"capabilities"`，未列出的一律拒絕：

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

| 鍵 | 說明 |
|---|---|
| `network.hosts` | 可用任何方法存取的主機：`"*"`（任何主機）、`"*.example.com"`（其子網域，不含 `example.com` 本身）或主機名稱。 |
| `network.http` | 更細緻的授權：一個 `host`，可選擇性地限制為 `methods`、`schemes`、一個 `port`、精確的 `paths` 與 `pathPrefixes`。 |

這些檢查由 NSH 的執行階段強制執行，位於你的應用程式程式碼之外，在請求到達網路之前進行：

- 被拒絕的 `fetch` 會失敗（在 TSX 中與所有失敗的請求一樣，會是 `TypeError`），訊息中會指出要加入的鍵，例如 ``Network request failed: fetch GET https://evil.io/ is not granted: add `evil.io` to capabilities.network in nsh.json``。在 TSX 中，錯誤的 `code` 為 `"ERR_ACCESS_DENIED"`，其 `permission` 為 `"network"`，其 `resource` 為被拒絕的 URL（請求本身的 URL 或重新導向的 URL），因此應用程式能區分拒絕與連線中斷：

  ```ts
  try {
    await fetch(url);
  } catch (error) {
    if (error.code === "ERR_ACCESS_DENIED") console.warn(`not granted: ${error.resource}`);
    else throw error;
  }
  ```
- **每次重新導向都會再次檢查。** NSH 自行跟隨重新導向（最多 20 次），而不是交給平台處理，因此已授權的主機無法將你的應用程式重新導向到未授權的主機。
- 相同的 `network` 授權也涵蓋遠端圖片（包括 canvas 中以及 `Image.getSize` / `prefetch` 中的圖片）與影片來源。你自己套件的 `asset:` URI 一律允許。
- 主機取自最後一個 `@` 之後的部分，因此 `https://ok.com@evil.io` 視為 `evil.io`。

沒有 `"capabilities"` 的應用程式可存取所有主機：獨立應用程式屬於其開發者自己。嵌入宿主應用程式，或以[簽署套件](./signed-packages.md)散布的應用程式應宣告這些能力；宿主應用程式授予的權限可以少於應用程式所宣告的，請求必須同時被兩者允許。使用 `nsh dev` / `nsh run` 開發時會強制執行相同的能力。請參閱[沙箱與能力](./sandbox-and-capabilities.md)。

<a id="differences-from-browsers"></a>

## 與瀏覽器的差異

TSX 的 `fetch` 遵循 Fetch 標準，但有一些差異，這些差異是為了適合應用程式而非網頁：

- **沒有 CORS。** 應用程式可與其能力允許的任何主機通訊；沒有預檢（preflight）請求，也沒有不透明（opaque）回應。
- **沒有禁止的標頭。** 應用程式可以設定 `Cookie`、`User-Agent`、`Origin` 等。
- **`redirect: "manual"`** 會直接給出 3xx 回應本身（含其 `Location` 標頭），而不是不透明的重新導向。`redirect: "error"` 則在重新導向時拒絕。
- **`data:` 與 `blob:` URL** 在本機回應。`URL.createObjectURL(blob)` 會建立 `blob:` URL，在你撤銷之前，`fetch` 都可以讀取它。
- **`asset:/` URL** 是應用程式隨附的檔案，從應用程式自己的檔案讀取，不需要任何能力（[在執行時讀取檔案](./images-and-assets.md#reading-a-file-at-run-time)）。
- 僅限瀏覽器的選項（`mode`、`credentials`、`cache`、`referrer`、`integrity`、`keepalive`、`priority`）為了與函式庫相容而被接受。

建構於 `fetch`（以及 `AbortController`、`FormData` 與串流）之上的函式庫，通常不需修改即可運作。沒有 `XMLHttpRequest`；原生宿主提供全域的 `WebSocket` 與 [`websocket` 模組](../modules/standard-modules.md)，並以與 `fetch` 相同的授權進行檢查。

<a id="related"></a>

## 相關內容

- [Global APIs](../modules/globals.md)：所有全域 API 及其成員。
- [Sandbox and capabilities](./sandbox-and-capabilities.md)：能力、限制，以及嵌入的應用程式如何授予它們。
- [Images and assets](./images-and-assets.md)：遠端圖片。
- [Lists](./lists.md#loading-more-onloadmore)：透過 API 分頁載入。
