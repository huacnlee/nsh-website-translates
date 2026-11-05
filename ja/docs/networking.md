---
title: "ネットワーク"
description: "fetch を使った HTTP 通信 - JSON、ヘッダー、FormData によるアップロード、レスポンスとリクエストボディのストリーミング、AbortController によるキャンセル、エラー、およびアプリが宣言するネットワーク機能。"
order: 46
group: ui
source_hash: 98ed5881a270c365
---

# ネットワーキング

NSH アプリは `fetch` で HTTP リクエストを行います。Rust ではタスク内で await する `nsh_core::prelude` の関数を、TSX では標準のグローバルを使います。どちらもプラットフォームのネットワークスタック(iOS では NSURLSession、Android では HttpURLConnection、[Web](./web.md#apps-with-rust-components)ではブラウザー自身のもの)上で動作するため、リクエストにはシステムの TLS、プロキシ、HTTP/2 が使われ、どちらも同じ[ケイパビリティチェック](#capabilities-which-hosts-an-app-may-reach)を通過します。Rust の `fetch` は URL または `HttpRequest` を受け取り、レスポンス全体を返します(`HttpResponse`:`status()`、`ok()`、`header(name)`、`text()`、`body`)。TSX 版は双方向にストリーミングします。レスポンスボディはスタックが届けるそばからストリームとして到着し、リクエストボディも、生成しながら送信できるストリームにできます。TSX には Fetch API の関連機能も揃っています:`Headers`、`Request`、`Response`、`AbortController`、`FormData`、`Blob`、`File`、`URL`、`URLSearchParams`、`TextEncoder` / `TextDecoder`、および Web Streams。

<a id="getting-json"></a>

## JSON の取得

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

[`resource`](./reactivity.md#resource) は、値、エラー、ロード中かどうかを保持します。変化するソース(または `refetch()` 時)から再ロードし、不要になったロード(コンポーネントが破棄された、または新しいロードが始まった場合)をキャンセルします。Rust ではロードのタスクを drop することでリクエストをキャンセルし、TSX では渡される `signal` を通じてキャンセルします。Rust の `fetch` は絶対 URL を受け取ります。JSON のパースには `serde_json` などのクレートを使います。

TSX では、`Response` のボディは一度だけ、`json()`、`text()`、`arrayBuffer()`、`bytes()`、`blob()`、`formData()` のいずれか、または `body` ストリームとして読み取れます。`response.ok` は 2xx のステータスで true になります。ブラウザーと同様に、HTTP エラーステータスでは Promise は reject されません。

<a id="sending-data"></a>

## データの送信

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

`HttpRequest::new(method, url)`、`get`、`post` がリクエストを作成し、`.header(..)` と `.body(..)` がそれを完了させます。TSX では、`body` に文字列、`URLSearchParams`、`FormData`、`Blob` または `File`、`ArrayBuffer` または型付き配列、あるいは `ReadableStream` を指定できます。

<a id="uploading-files-with-formdata"></a>

### FormData によるファイルのアップロード

TSX では、`FormData` ボディは boundary 付きの `multipart/form-data` として送信されます。NSH は `FormData` ボディに対して常にこの content type を設定します。ライブラリが先にデフォルトの `Content-Type` を設定していても同様です。boundary がないとサーバーがボディをパースできないためです。

```ts
const form = new FormData();
form.append("title", "Sunset");
form.append("photo", new Blob([bytes], { type: "image/jpeg" }), "sunset.jpg");

const response = await fetch("https://api.example.com/photos", { method: "POST", body: form });
```

<a id="uploading-a-photo-the-user-picks"></a>

### ユーザーが選んだ写真のアップロード

[`Picker`](../modules/nsh.md#picker) は、ユーザーが選んだ写真を、バイト列がネイティブ側に保持され、縮小済みでサーバーが受け付ける形式のファイルとして返します。Rust ではそのバイト列を送信し、TSX では `File` を `FormData` に追加します。

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

## ストリーミング

TSX の `fetch` はレスポンスとリクエストボディをストリーミングします。Rust 版はレスポンスとともにボディ全体を返します。

<a id="reading-a-response-as-it-arrives"></a>

### レスポンスを到着と同時に読み取る

`response.body` は、ネットワークがバイトを届けるたびに埋められる `ReadableStream<Uint8Array>` です。チャンクごとに読み取ることで、進捗を表示したり、サーバー送信の行を届いた順に処理したりできます。

```ts
const response = await fetch("https://api.example.com/large.csv");
const total = Number(response.headers.get("Content-Length") ?? 0);
let received = 0;

for await (const chunk of response.body!) {
  received += chunk.length;
  progress.set(total ? received / total : 0);
}
```

テキストストリームは `TextDecoderStream` でデコードでき、`TransformStream` で行に分割できます。

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

バックプレッシャーはエンドツーエンドで機能します。1 MiB を超えるレスポンスが未読のまま溜まっている間、コードが追いつくまでリクエストはネットワークレベルで一時停止されます。

<a id="streaming-a-request-body"></a>

### リクエストボディのストリーミング

`ReadableStream` ボディは、ネットワークスタックが要求するたびにチャンクごとに送信されます(チャンク転送)。Fetch 標準の要求どおり、`duplex: "half"` を渡してください。

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

ストリーミングされたボディは二度送信できないため、ストリーミングされたリクエストが 307 または 308 でリダイレクトされると失敗します。

<a id="cancelling-and-timeouts"></a>

## キャンセルとタイムアウト

Rust ではリクエストはタスク内で実行され、タスクとともにキャンセルされます。タスクを所有するコンポーネントが破棄されたとき、または `spawn` が返すタスクに対して `cancel()` を呼んだときです。TSX では `AbortSignal` を渡してリクエストをキャンセルします。Promise はシグナルの reason(デフォルトでは `AbortError` の `DOMException`)で reject され、読み取り中のボディは停止します。

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

TSX では、`AbortSignal.timeout(ms)` が一定時間後に abort されるシグナルを作成し、`AbortSignal.any([...])` が複数のシグナルを結合します。

```ts
const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
```

データをロードするコンポーネントは、破棄されるときにキャンセルすべきです。Rust のタスクは自動的にキャンセルされ、TSX では [`cleanup`](./reactivity.md) 内で abort します。

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

## エラー

HTTP レスポンスが得られなかったリクエストは失敗します。Rust の `fetch` はメッセージ付きの `Err` を返し、TSX では、メッセージが `Network request failed:` で始まる `TypeError` で reject されます。これは、接続がない場合、DNS または TLS の失敗、未対応の URL スキーム、アプリのケイパビリティが許可していないリクエストの場合に発生します。HTTP エラーについては `ok()` / `status()`(TSX では `response.ok`、`response.status`)を確認してください。

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

## Rust コンポーネントから

Rust のコンポーネント、`#[module]` 関数、`#[class]` メンバーは、タスクから `fetch` を呼び出します。コンポーネントでは `spawn`、UI が表示する値には `resource`、TSX にエクスポートされる `async fn` を使い、TSX 側ではそれを Promise として await します。リクエストは URL または `HttpRequest`(`HttpRequest::get(url)`、`HttpRequest::post(url, body)`、`.header(name, value)`)で表され、レスポンスは全体が一度に届きます。リクエストの所有者はタスクです。タスクを drop するか、タスクを生成したコンポーネントが破棄されると、リクエストはキャンセルされます。TSX と同じネットワークスタックとケイパビリティチェックが、すべてのプラットフォームとブラウザーで使われます。

<a id="capabilities-which-hosts-an-app-may-reach"></a>

## ケイパビリティ:アプリが到達できるホスト

アプリは `nsh.json` で、通信先のホストを宣言できます。`"capabilities"` が存在する場合、記載されていないものはすべて拒否されます。

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

| キー | 説明 |
|---|---|
| `network.hosts` | どのメソッドでも到達できるホスト:`"*"`(任意のホスト)、`"*.example.com"`(サブドメイン。`example.com` 自体は含まない)、またはホスト名。 |
| `network.http` | より細かい許可:`host`。必要に応じて `methods`、`schemes`、`port`、完全一致の `paths`、`pathPrefixes` に限定できます。 |

チェックは、リクエストがネットワークに到達する前に、アプリのコードの外側にある NSH のランタイムで強制されます。

- 拒否された `fetch` は失敗します(TSX では、他の失敗したリクエストと同様に `TypeError` で失敗します)。メッセージには、追加すべきキーが示されます(例:``Network request failed: fetch GET https://evil.io/ is not granted: add `evil.io` to capabilities.network in nsh.json``)。TSX では、エラーの `code` は `"ERR_ACCESS_DENIED"`、`permission` は `"network"`、`resource` は拒否された URL(リクエストのもの、またはリダイレクト先のもの)になるため、アプリは拒否と接続断を区別できます。

  ```ts
  try {
    await fetch(url);
  } catch (error) {
    if (error.code === "ERR_ACCESS_DENIED") console.warn(`not granted: ${error.resource}`);
    else throw error;
  }
  ```
- **すべてのリダイレクトが再チェックされます。** NSH はプラットフォームに任せず、リダイレクトを自身で(最大 20 回)追跡するため、許可されたホストがアプリを許可されていないホストへリダイレクトすることはできません。
- 同じ `network` の許可が、リモート画像(キャンバスや `Image.getSize` / `prefetch` 内も含む)と動画ソースにも適用されます。アプリ自身のバンドルの `asset:` URI は常に許可されます。
- ホストは最後の `@` の後ろから取り出されるため、`https://ok.com@evil.io` は `evil.io` として扱われます。

`"capabilities"` のないアプリはすべてのホストに到達できます。スタンドアロンアプリは開発者自身のものだからです。ホストアプリに組み込まれるアプリや、[署名付きパッケージ](./signed-packages.md)として配布されるアプリは、これらを宣言すべきです。ホストアプリはアプリの宣言より少ない権限を付与でき、リクエストは両方に許可される必要があります。`nsh dev` / `nsh run` での開発でも、同じケイパビリティが適用されます。[サンドボックスとケイパビリティ](./sandbox-and-capabilities.md)を参照してください。

<a id="differences-from-browsers"></a>

## ブラウザーとの違い

TSX の `fetch` は Fetch 標準に従いますが、Web ページではなくアプリとして適切な違いがあります。

- **CORS はありません。** アプリは、ケイパビリティが許可する任意のホストと通信できます。プリフライトリクエストも opaque レスポンスもありません。
- **禁止ヘッダーはありません。** アプリは `Cookie`、`User-Agent`、`Origin` などを設定できます。
- **`redirect: "manual"`** は、opaque リダイレクトではなく、3xx レスポンス自体(`Location` ヘッダー付き)を返します。`redirect: "error"` はリダイレクトで reject されます。
- **`data:` と `blob:` の URL** はローカルで応答されます。`URL.createObjectURL(blob)` は、破棄するまで `fetch` が読み取れる `blob:` URL を作成します。
- **`asset:/` の URL** はアプリに同梱されるファイルで、アプリ自身のファイルから読み取られ、ケイパビリティは不要です([実行時のファイル読み取り](./images-and-assets.md#reading-a-file-at-run-time))。
- ブラウザー専用のオプション(`mode`、`credentials`、`cache`、`referrer`、`integrity`、`keepalive`、`priority`)は、ライブラリとの互換性のために受け付けられます。

`fetch`(および `AbortController`、`FormData`、ストリーム)上に構築されたライブラリは、通常そのまま動作します。`XMLHttpRequest` はありません。ネイティブホストはグローバルの `WebSocket` と [`websocket` モジュール](../modules/standard-modules.md)を提供し、`fetch` と同じ許可に対してチェックされます。

<a id="related"></a>

## 関連項目

- [グローバル API](../modules/globals.md):すべてのグローバルとそのメンバー。
- [サンドボックスとケイパビリティ](./sandbox-and-capabilities.md):ケイパビリティ、制限、組み込み側アプリによる許可の方法。
- [画像とアセット](./images-and-assets.md):リモート画像。
- [リスト](./lists.md#loading-more-onloadmore):API のページング。
