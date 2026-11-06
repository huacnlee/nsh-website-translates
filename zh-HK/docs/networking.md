---
title: "網絡"
description: "使用 fetch 進行 HTTP 請求:JSON、標頭、使用 FormData 上傳、串流回應與請求主體、使用 AbortController 取消請求、錯誤處理,以及應用程式所宣告的網絡權能。"
order: 46
group: ui
source_hash: 98ed5881a270c365
---


# 網絡

NSH 應用程式透過 `fetch` 發出 HTTP 請求:在 Rust 中是 `nsh_core::prelude` 的函式,於任務中以 await 等待;在 TSX 中則是標準全域函式。兩者都運行於平台的網絡層(iOS 上為 NSURLSession,Android 上為 HttpURLConnection,[網頁版](./web.md#apps-with-rust-components)則為瀏覽器自身的網絡層),因此請求會使用系統的 TLS、代理伺服器和 HTTP/2,而且兩者都會通過相同的[權限檢查](#capabilities-which-hosts-an-app-may-reach)。Rust 的 `fetch` 接受 URL 或 `HttpRequest`,並回傳完整的回應(`HttpResponse`:`status()`、`ok()`、`header(name)`、`text()`、`body`)。TSX 的版本則支援雙向串流:回應內容會隨網絡層送達而以串流形式到達,請求內容也可以是一個串流,在你產生資料時逐步發送。TSX 也提供 Fetch API 的配套物件:`Headers`、`Request`、`Response`、`AbortController`、`FormData`、`Blob`、`File`、`URL`、`URLSearchParams`、`TextEncoder` / `TextDecoder` 和 Web Streams。

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

[`resource`](./reactivity.md#resource) 會保存數值、錯誤,以及載入是否正在進行;當來源改變(或在 `refetch()` 時)會重新載入,並會取消已不再需要的載入(元件被移除,或較新的載入開始時):在 Rust 中,透過丟棄該載入的任務來取消其請求;在 TSX 中,則透過它傳遞的 `signal` 來取消。Rust 的 `fetch` 接受絕對 URL;JSON 可使用 `serde_json` 等 crate 解析。

在 TSX 中,`Response` 的內容只能讀取一次,可讀取為 `json()`、`text()`、`arrayBuffer()`、`bytes()`、`blob()` 或 `formData()`,或讀取為 `body` 串流。`response.ok` 在狀態碼為 2xx 時為 true;與瀏覽器一樣,HTTP 錯誤狀態碼不會令 promise 被拒絕。

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

`HttpRequest::new(method, url)`、`get` 和 `post` 用於建立請求,`.header(..)` 和 `.body(..)` 用於完成請求。在 TSX 中,`body` 接受字串、`URLSearchParams`、`FormData`、`Blob` 或 `File`、`ArrayBuffer` 或 typed array,或 `ReadableStream`。

<a id="uploading-files-with-formdata"></a>

### 使用 FormData 上傳檔案

在 TSX 中,`FormData` 內容會以 `multipart/form-data` 連同其 boundary 一併發送。對於 `FormData` 內容,NSH 一律會設定該 content type,即使程式庫先設定了預設的 `Content-Type` 也一樣,因為沒有 boundary,伺服器便無法解析。

```ts
const form = new FormData();
form.append("title", "Sunset");
form.append("photo", new Blob([bytes], { type: "image/jpeg" }), "sunset.jpg");

const response = await fetch("https://api.example.com/photos", { method: "POST", body: form });
```

<a id="uploading-a-photo-the-user-picks"></a>

### 上傳使用者揀選的相片

[`Picker`](../modules/nsh.md#picker) 會將使用者揀選的相片以檔案形式提供,其位元組保留在原生端,並已縮小尺寸及轉換為伺服器可接受的格式;Rust 發送其位元組,TSX 則將 `File` 附加到 `FormData`:

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

TSX 的 `fetch` 支援串流回應和請求內容;Rust 的則是將完整內容連同回應一併提供。

<a id="reading-a-response-as-it-arrives"></a>

### 邊接收邊讀取回應

`response.body` 是一個 `ReadableStream<Uint8Array>`,隨網絡送達位元組而逐步填入。逐塊讀取即可顯示進度,或在伺服器發送的文字行到達時即時處理:

```ts
const response = await fetch("https://api.example.com/large.csv");
const total = Number(response.headers.get("Content-Length") ?? 0);
let received = 0;

for await (const chunk of response.body!) {
  received += chunk.length;
  progress.set(total ? received / total : 0);
}
```

文字串流以 `TextDecoderStream` 解碼,再由 `TransformStream` 拆分成行:

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

背壓(back pressure)機制貫穿整個流程:當超過 1 MiB 的回應內容等待讀取時,請求會在網絡層暫停,直到你的程式碼追上為止。

<a id="streaming-a-request-body"></a>

### 串流請求內容

`ReadableStream` 內容會在網絡層要求時逐塊發送(分塊傳輸)。依照 Fetch 標準的要求,需傳入 `duplex: "half"`:

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

串流內容無法發送兩次,因此串流請求遇到 307 或 308 重新導向時會失敗。

<a id="cancelling-and-timeouts"></a>

## 取消與逾時

在 Rust 中,請求在任務內運行,並隨任務一同取消:當任務所屬的元件被移除時,或對 `spawn` 回傳的任務呼叫 `cancel()` 時取消。在 TSX 中,傳入 `AbortSignal` 即可取消請求;promise 會以該 signal 的原因被拒絕(預設為 `AbortError` `DOMException`),而正在讀取的內容也會停止。

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

在 TSX 中,`AbortSignal.timeout(ms)` 會建立一個在延遲後中止的 signal,`AbortSignal.any([...])` 則可合併多個 signal:

```ts
const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
```

載入資料的元件應在被移除時取消請求:Rust 任務會自動取消,而 TSX 則在 [`cleanup`](./reactivity.md) 中中止:

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

未能取得 HTTP 回應的請求會失敗:Rust 的 `fetch` 會回傳附帶訊息的 `Err`,TSX 的則會以 `TypeError` 拒絕,其訊息以 `Network request failed:` 開頭。沒有網絡連線、DNS 或 TLS 失敗、不支援的 URL scheme,或請求不被應用程式的權限允許時,都會發生這種情況。HTTP 錯誤則請檢查 `ok()` / `status()`(TSX:`response.ok`、`response.status`)。

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

## 從 Rust 元件發出請求

Rust 元件、`#[module]` 函式和 `#[class]` 成員會在任務中呼叫 `fetch`:在元件中使用 `spawn`,為 UI 顯示的數值使用 `resource`,或使用匯出給 TSX 的 `async fn`(TSX 會將其當作 Promise 來 await)。請求是一個 URL 或 `HttpRequest`(`HttpRequest::get(url)`、`HttpRequest::post(url, body)`、`.header(name, value)`),其回應會完整送達。任務擁有該請求:丟棄任務,或產生該任務的元件被移除,都會取消請求。它在所有平台及瀏覽器中,都使用與 TSX 相同的網絡層和權限檢查。

<a id="capabilities-which-hosts-an-app-may-reach"></a>

## 權限:應用程式可連線的主機

應用程式可在 `nsh.json` 中宣告它會連線的主機。一旦存在 `"capabilities"`,所有未列出的主機都會被拒絕:

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
| `network.hosts` | 可用任何方法連線的主機:`"*"`(任何主機)、`"*.example.com"`(其子網域,不包括 `example.com` 本身)或主機名稱。 |
| `network.http` | 更細緻的授權:一個 `host`,可選擇限制為 `methods`、`schemes`、`port`、確切的 `paths` 和 `pathPrefixes`。 |

這些檢查由 NSH 的執行環境在你的應用程式程式碼之外執行,並在請求到達網絡之前進行:

- 被拒絕的 `fetch` 會失敗(在 TSX 中與所有失敗的請求一樣,以 `TypeError` 拒絕),訊息會指出需要新增的鍵,例如 ``Network request failed: fetch GET https://evil.io/ is not granted: add `evil.io` to capabilities.network in nsh.json``。在 TSX 中,該錯誤的 `code` 為 `"ERR_ACCESS_DENIED"`,其 `permission` 為 `"network"`,其 `resource` 為被拒絕的 URL(請求本身的 URL 或重新導向的 URL),因此應用程式可以分辨是被拒絕,還是連線中斷:

  ```ts
  try {
    await fetch(url);
  } catch (error) {
    if (error.code === "ERR_ACCESS_DENIED") console.warn(`not granted: ${error.resource}`);
    else throw error;
  }
  ```
- **每次重新導向都會再次檢查。** NSH 自行處理重新導向(最多 20 次),而不是交由平台處理,因此已獲授權的主機無法將你的應用程式重新導向到未獲授權的主機。
- 相同的 `network` 授權也適用於遠端圖片(包括 canvas 以及 `Image.getSize` / `prefetch` 中的圖片)和影片來源。你自己套件的 `asset:` URI 一律允許。
- 主機取自最後一個 `@` 之後的部分,因此 `https://ok.com@evil.io` 視為 `evil.io`。

沒有 `"capabilities"` 的應用程式可連線至所有主機:獨立應用程式屬於其開發者自己。嵌入於宿主應用程式,或以[已簽署套件](./signed-packages.md)發佈的應用程式,應宣告這些權限;宿主應用程式授予的權限可以少於應用程式所宣告的,而請求必須同時獲兩者允許。使用 `nsh dev` / `nsh run` 進行開發時,同樣會執行相同的權限檢查。請參閱[沙盒與權限](./sandbox-and-capabilities.md)。

<a id="differences-from-browsers"></a>

## 與瀏覽器的差異

TSX 的 `fetch` 遵循 Fetch 標準,但在以下方面有所不同,這些差異對應用程式而言比對網頁更合理:

- **沒有 CORS。** 應用程式可連線至其權限允許的任何主機;沒有 preflight 請求,也沒有 opaque 回應。
- **沒有禁用的標頭。** 應用程式可以設定 `Cookie`、`User-Agent`、`Origin` 等標頭。
- **`redirect: "manual"`** 會回傳 3xx 回應本身(連同其 `Location` 標頭),而不是 opaque 重新導向。`redirect: "error"` 則會在重新導向時拒絕。
- **`data:` 和 `blob:` URL** 會在本機處理。`URL.createObjectURL(blob)` 會建立一個 `blob:` URL,在你撤銷之前,`fetch` 都可以讀取它。
- **`asset:/` URL** 指應用程式隨附的檔案,從應用程式自己的檔案中讀取,不需要任何權限([在執行時讀取檔案](./images-and-assets.md#reading-a-file-at-run-time))。
- 僅限瀏覽器的選項(`mode`、`credentials`、`cache`、`referrer`、`integrity`、`keepalive`、`priority`)會被接受,以便與程式庫相容。

建基於 `fetch`(以及 `AbortController`、`FormData` 和串流)的程式庫一般無需修改即可運作。這裡沒有 `XMLHttpRequest`;原生宿主提供全域的 `WebSocket` 和 [`websocket` 模組](../modules/standard-modules.md),並按照與 `fetch` 相同的授權進行檢查。

<a id="related"></a>

## 相關內容

- [全域 API](../modules/globals.md):所有全域物件及其成員。
- [沙盒與權限](./sandbox-and-capabilities.md):權限、限制,以及嵌入式應用程式如何授予權限。
- [圖片與資源](./images-and-assets.md):遠端圖片。
- [列表](./lists.md#loading-more-onloadmore):透過 API 分頁載入。
