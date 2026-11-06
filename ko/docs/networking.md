---
title: "네트워킹"
description: "fetch를 사용한 HTTP - JSON, 헤더, FormData를 이용한 업로드, 스트리밍 응답과 요청 본문, AbortController를 이용한 취소, 오류, 그리고 앱이 선언하는 네트워크 capability."
order: 46
group: ui
source_hash: 98ed5881a270c365
---

# 네트워킹

NSH 앱은 `fetch`로 HTTP 요청을 보냅니다. Rust에서는 `nsh_core::prelude`의 함수를 태스크에서 await하고, TSX에서는 표준 전역 함수를 사용합니다. 둘 다 플랫폼의 네트워크 스택(iOS는 NSURLSession, Android는 HttpURLConnection, [웹에서는](./web.md#apps-with-rust-components) 브라우저의 스택) 위에서 실행되므로 요청은 시스템의 TLS, 프록시, HTTP/2를 사용하며, 둘 다 동일한 [capability 검사](#capabilities-which-hosts-an-app-may-reach)를 거칩니다. Rust의 `fetch`은 URL 또는 `HttpRequest`를 받아 전체 응답(`HttpResponse`: `status()`, `ok()`, `header(name)`, `text()`, `body`)을 돌려줍니다. TSX의 것은 양방향으로 스트리밍합니다. 응답 본문은 스택이 전달하는 대로 스트림으로 도착하고, 요청 본문은 스트림으로 만들어 생성하는 즉시 보낼 수 있습니다. TSX에는 Fetch API의 짝이 되는 것들도 있습니다: `Headers`, `Request`, `Response`, `AbortController`, `FormData`, `Blob`, `File`, `URL`, `URLSearchParams`, `TextEncoder` / `TextDecoder`, 그리고 Web Streams.

<a id="getting-json"></a>

## JSON 가져오기

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

[`resource`](./reactivity.md#resource)는 값, 오류, 로드 진행 여부를 보관하고, 변경되는 소스에서(또는 `refetch()` 시) 다시 로드하며, 더 이상 필요 없는 로드(컴포넌트가 사라지거나 더 새로운 로드가 시작된 경우)를 취소합니다. Rust에서는 로드의 태스크를 drop하여 요청을 취소하고, TSX에서는 전달해 주는 `signal`을 통해 취소합니다. Rust의 `fetch`은 절대 URL을 받으며, JSON은 `serde_json` 같은 크레이트로 파싱합니다.

TSX에서 `Response`은 본문을 한 번만 읽을 수 있으며, `json()`, `text()`, `arrayBuffer()`, `bytes()`, `blob()`, `formData()` 중 하나로 읽거나 `body` 스트림으로 읽습니다. `response.ok`는 2xx 상태 코드에서 true입니다. 브라우저와 마찬가지로 HTTP 오류 상태 코드는 promise를 reject하지 않습니다.

<a id="sending-data"></a>

## 데이터 보내기

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

`HttpRequest::new(method, url)`, `get`, `post`는 요청을 만들고, `.header(..)`과 `.body(..)`은 요청을 완료합니다. TSX에서 `body`는 문자열, `URLSearchParams`, `FormData`, `Blob` 또는 `File`, `ArrayBuffer` 또는 typed array, 혹은 `ReadableStream`를 받습니다.

<a id="uploading-files-with-formdata"></a>

### FormData로 파일 업로드

TSX에서 `FormData` 본문은 boundary와 함께 `multipart/form-data`로 전송됩니다. NSH는 `FormData` 본문에 항상 해당 content type을 설정합니다. 라이브러리가 먼저 기본 `Content-Type`를 설정했더라도 마찬가지인데, boundary가 없으면 서버가 본문을 파싱할 수 없기 때문입니다.

```ts
const form = new FormData();
form.append("title", "Sunset");
form.append("photo", new Blob([bytes], { type: "image/jpeg" }), "sunset.jpg");

const response = await fetch("https://api.example.com/photos", { method: "POST", body: form });
```

<a id="uploading-a-photo-the-user-picks"></a>

### 사용자가 고른 사진 업로드

[`Picker`](../modules/nsh.md#picker)는 사용자가 고른 사진을 파일로 제공합니다. 이 파일의 바이트는 네이티브에 머물며, 축소되어 서버가 받는 형식으로 제공됩니다. Rust는 그 바이트를 전송하고, TSX는 `File`을 `FormData`에 추가합니다.

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

## 스트리밍

TSX의 `fetch`는 응답과 요청 본문을 스트리밍합니다. Rust의 것은 응답과 함께 전체 본문을 돌려줍니다.

<a id="reading-a-response-as-it-arrives"></a>

### 도착하는 대로 응답 읽기

`response.body`는 네트워크가 바이트를 전달하는 대로 채워지는 `ReadableStream<Uint8Array>`입니다. 청크 단위로 읽어 진행 상황을 보여 주거나 서버 전송 라인을 도착하는 대로 처리할 수 있습니다.

```ts
const response = await fetch("https://api.example.com/large.csv");
const total = Number(response.headers.get("Content-Length") ?? 0);
let received = 0;

for await (const chunk of response.body!) {
  received += chunk.length;
  progress.set(total ? received / total : 0);
}
```

텍스트 스트림은 `TextDecoderStream`로 디코딩하고, `TransformStream`로 줄 단위로 나눕니다.

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

백프레셔는 처음부터 끝까지 동작합니다. 응답 중 1 MiB 넘는 분량이 읽히지 않은 채 대기하는 동안에는 코드가 따라잡을 때까지 네트워크 수준에서 요청이 일시 중지됩니다.

<a id="streaming-a-request-body"></a>

### 요청 본문 스트리밍

`ReadableStream` 본문은 네트워크 스택이 요청하는 대로 청크 단위로 전송됩니다(chunked transfer). Fetch 표준이 요구하는 대로 `duplex: "half"`를 전달하세요.

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

스트리밍 본문은 두 번 보낼 수 없으므로, 스트리밍 요청에 대한 307 또는 308 리디렉션은 실패합니다.

<a id="cancelling-and-timeouts"></a>

## 취소와 타임아웃

Rust에서 요청은 태스크 안에서 실행되며 태스크와 함께 취소됩니다. 태스크의 컴포넌트가 사라질 때, 또는 `spawn`이 돌려주는 태스크에 `cancel()`를 호출할 때 취소됩니다. TSX에서는 `AbortSignal`를 전달하여 요청을 취소합니다. promise는 signal의 reason(기본값은 `AbortError` `DOMException`)으로 reject되며, 읽고 있던 본문은 중단됩니다.

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

TSX에서 `AbortSignal.timeout(ms)`은 지연 후 중단되는 signal을 만들고, `AbortSignal.any([...])`은 여러 signal을 결합합니다.

```ts
const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
```

데이터를 로드하는 컴포넌트는 사라질 때 취소해야 합니다. Rust 태스크는 자동으로 취소되고, TSX는 [`cleanup`](./reactivity.md)에서 중단합니다.

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

## 오류

HTTP 응답을 만들지 못한 요청은 실패합니다. Rust의 `fetch`은 메시지가 담긴 `Err`를 돌려주고, TSX의 것은 메시지가 `Network request failed:`로 시작하는 `TypeError`로 reject됩니다. 연결이 없을 때, DNS 또는 TLS 실패, 지원되지 않는 URL 스킴, 앱의 capability가 허용하지 않는 요청의 경우에 발생합니다. HTTP 오류는 `ok()` / `status()`(TSX: `response.ok`, `response.status`)로 확인하세요.

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

## Rust 컴포넌트에서

Rust 컴포넌트, `#[module]` 함수, `#[class]` 멤버는 태스크에서 `fetch`를 호출합니다. 컴포넌트에서는 `spawn`, UI에 표시할 값에는 `resource`, TSX로 내보내 TSX가 Promise로 await하는 경우에는 `async fn`를 사용합니다. 요청은 URL 또는 `HttpRequest`(`HttpRequest::get(url)`, `HttpRequest::post(url, body)`, `.header(name, value)`)이며, 응답은 전체가 한꺼번에 도착합니다. 요청의 소유자는 태스크입니다. 태스크를 drop하거나 태스크를 생성한 컴포넌트가 사라지면 요청이 취소됩니다. 모든 플랫폼과 브라우저에서 TSX와 동일한 네트워크 스택 및 capability 검사를 사용합니다.

<a id="capabilities-which-hosts-an-app-may-reach"></a>

## Capability: 앱이 접근할 수 있는 호스트

앱은 `nsh.json`에서 통신할 호스트를 선언할 수 있습니다. `"capabilities"`가 있으면 목록에 없는 모든 호스트는 거부됩니다.

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

| 키 | 설명 |
|---|---|
| `network.hosts` | 모든 메서드로 접근할 수 있는 호스트: `"*"`(모든 호스트), `"*.example.com"`(하위 도메인, `example.com` 자체는 제외) 또는 호스트 이름. |
| `network.http` | 더 세밀한 허용: `host`, 선택적으로 `methods`, `schemes`, `port`, 정확한 `paths`, `pathPrefixes`로 제한. |

검사는 앱 코드 바깥의 NSH 런타임에서, 요청이 네트워크에 도달하기 전에 수행됩니다.

- 거부된 `fetch`는 추가해야 할 키를 알려 주는 메시지(예: ``Network request failed: fetch GET https://evil.io/ is not granted: add `evil.io` to capabilities.network in nsh.json``)와 함께 실패합니다. TSX에서는 모든 실패한 요청과 마찬가지로 `TypeError`로 실패합니다. TSX에서 오류의 `code`은 `"ERR_ACCESS_DENIED"`, `permission`는 `"network"`, `resource`는 거부된 URL(요청의 URL 또는 리디렉션의 URL)이므로, 앱은 거부와 연결 끊김을 구별할 수 있습니다.

  ```ts
  try {
    await fetch(url);
  } catch (error) {
    if (error.code === "ERR_ACCESS_DENIED") console.warn(`not granted: ${error.resource}`);
    else throw error;
  }
  ```
- **모든 리디렉션은 다시 검사됩니다.** NSH는 플랫폼에 맡기지 않고 리디렉션을 직접(최대 20회) 따라가므로, 허용된 호스트가 앱을 허용되지 않은 호스트로 리디렉션할 수 없습니다.
- 동일한 `network` 허용이 원격 이미지(캔버스와 `Image.getSize` / `prefetch` 포함)와 비디오 소스에도 적용됩니다. 앱 번들 자체의 `asset:` URI는 항상 허용됩니다.
- 호스트는 마지막 `@` 뒤에서 가져오므로 `https://ok.com@evil.io`는 `evil.io`로 간주됩니다.

`"capabilities"`가 없는 앱은 모든 호스트에 접근할 수 있습니다. 독립 실행형 앱은 개발자 자신의 앱이기 때문입니다. 호스트 앱에 임베드되었거나 [서명된 패키지](./signed-packages.md)로 배포되는 앱은 이를 선언해야 합니다. 호스트 앱은 앱이 선언한 것보다 적게 허용할 수 있으며, 요청은 양쪽 모두에서 허용되어야 합니다. `nsh dev` / `nsh run`를 사용하는 개발 환경에서도 동일한 capability가 적용됩니다. [샌드박스와 capability](./sandbox-and-capabilities.md)를 참고하세요.

<a id="differences-from-browsers"></a>

## 브라우저와의 차이점

TSX의 `fetch`는 Fetch 표준을 따르되, 웹 페이지가 아닌 앱에 맞는 차이점이 있습니다.

- **CORS 없음.** 앱은 capability가 허용하는 모든 호스트와 통신할 수 있으며, preflight 요청과 opaque 응답이 없습니다.
- **금지된 헤더 없음.** 앱은 `Cookie`, `User-Agent`, `Origin` 등을 설정할 수 있습니다.
- **`redirect: "manual"`**는 opaque redirect 대신 3xx 응답 자체(`Location` 헤더 포함)를 돌려줍니다. `redirect: "error"`는 리디렉션 시 reject됩니다.
- **`data:` 및 `blob:` URL**은 로컬에서 처리됩니다. `URL.createObjectURL(blob)`는 해제하기 전까지 `fetch`가 읽을 수 있는 `blob:` URL을 만듭니다.
- **`asset:/` URL**은 앱과 함께 배포되는 파일이며, capability 없이 앱 자체 파일에서 읽습니다([런타임에 파일 읽기](./images-and-assets.md#reading-a-file-at-run-time)).
- 브라우저 전용 옵션(`mode`, `credentials`, `cache`, `referrer`, `integrity`, `keepalive`, `priority`)은 라이브러리와의 호환성을 위해 허용됩니다.

`fetch` 기반 라이브러리(그리고 `AbortController`, `FormData`, 스트림 기반 라이브러리)는 대체로 수정 없이 동작합니다. `XMLHttpRequest`는 없으며, 네이티브 호스트는 전역 `WebSocket`와 [`websocket` 모듈](../modules/standard-modules.md)을 제공하고 `fetch`와 동일한 허용 목록에 따라 검사됩니다.

<a id="related"></a>

## 관련 문서

- [전역 API](../modules/globals.md): 모든 전역 항목과 그 멤버.
- [샌드박스와 capability](./sandbox-and-capabilities.md): capability, 제한 사항, 임베딩 앱이 이를 허용하는 방법.
- [이미지와 에셋](./images-and-assets.md): 원격 이미지.
- [리스트](./lists.md#loading-more-onloadmore): API 페이징.
