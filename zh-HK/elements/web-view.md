---
title: "WebView"
description: "WebView 元素:在應用程式內顯示網頁和內嵌 HTML,並支援雙向訊息傳遞。"
order: 80
group: primitives
demo: el-web-view
source_hash: 455bf8f5d2ba5a4c
---


# WebView

Web view 會在應用程式內顯示網頁，或你傳入的 HTML：iOS 和 Mac Catalyst 使用 WKWebView，Android 使用 `android.webkit.WebView`。由於 NSH 以原生視圖渲染，web view 會像其他 view 一樣放進版面，並按順序排在周圍的 view 之間。Rust 使用 `web_view(url)` 或 `web_view_html(html, base_url)` 建立，TSX 則使用來自 `nsh` 的 `<WebView>`。

```rust tabs
use nsh_core::prelude::*;

fn browser() -> impl IntoElement {
    let title = signal(SharedString::from("Loading…"));
    view()
        .flex_1()
        .child(text(title).number_of_lines(1))
        .child(
            web_view("https://example.com")
                .flex_1()
                .on_navigation_state_change(move |e: &WebNavigation| title.set(e.title.clone().into())),
        )
}
```

```tsx tabs
import { signal, Text, View, WebView, type WebViewNavigation } from "nsh";

function Browser() {
  const nav = signal<WebViewNavigation | null>(null);
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ numberOfLines: 1 }}>{nav()?.title ?? "Loading…"}</Text>
      <WebView
        src="https://example.com"
        style={{ flex: 1 }}
        onNavigationStateChange={(e) => nav.set(e)}
      />
    </View>
  );
}
```

在 TSX 中，web view 接受 `src` 和 `html` 其中之一（參閱 [WebView API](../modules/nsh-webview.md)）。[web view 與影片指南](../docs/web-view-and-video.md)介紹了訊息傳遞模式和 capabilities。

## Props

Web view 接受 [view](./view.md) 的 props（它沒有子元素），另外還有：

| Prop | Rust | 類型 | 預設值 | 說明 |
|---|---|---|---|---|
| `src` | `web_view(url)` | `string` | | 要顯示的頁面 URL。 |
| `html` | `web_view_html(html, base_url)`、`.html(html, base_url)` | `string` | | 內嵌 HTML，會取代 `src` 顯示。 |
| `baseUrl` | `base_url`（`web_view_html` / `.html`） | `string` | | `html` 中相對連結所依據的基準。 |
| `injectedJavaScript` | `.injected_java_script(..)` | `string` | | 每次頁面載入後執行。 |
| `injectedJavaScriptBeforeContentLoaded` | `.injected_java_script_before_content(..)` | `string` | | 在每個頁面自身的腳本之前執行。 |
| `userAgent` | `.user_agent(..)` | `string` | | 瀏覽器的 user agent 字串。 |
| `javaScriptEnabled` | `.java_script_enabled(..)` | `boolean` | `true` | 頁面可執行腳本。 |
| `scrollable` | `.scrollable(..)` | `boolean` | `true` | 使用者可捲動頁面。 |

| `ios` 鍵 | Rust | 類型 | 說明 |
|---|---|---|---|
| `allowsBackForwardNavigationGestures` | `.back_forward_gestures(..)` | `boolean` | 由邊緣滑動以返回和前進。 |

| `desktop` 鍵 | Rust | 類型 | 說明 |
|---|---|---|---|
| `allowsBackForwardNavigationGestures` | `.back_forward_gestures(..)` | `boolean` | macOS：在觸控板上以雙指滑動以返回和前進；Windows：在觸控螢幕上滑動；Linux：在觸控板上滑動。 |

<a id="events"></a>

## 事件

| 事件 | Rust | 內容 | 時機 |
|---|---|---|---|
| `onLoadStart` | `.on_load_start` | `WebViewNavigation` | 頁面開始載入。 |
| `onLoad` | `.on_load` | `WebViewNavigation` | 頁面完成載入。 |
| `onError` | `.on_error` | `{ message, code? }`（`&str`，即訊息內容） | 載入失敗；`code` 為 `"ERR_ACCESS_DENIED"` 代表頁面，或為 `html` 代表應用程式 capabilities 未授權的內容。 |
| `onNavigationStateChange` | `.on_navigation_state_change` | `WebViewNavigation` | URL、標題、載入狀態或歷史記錄有所變更。 |
| `onMessage` | `.on_message` | `{ data: string }`（`&str`） | 頁面呼叫了 `window.nsh.postMessage(data)`。 |
| `onDownload` | | `WebViewDownload` | 下載已開始、完成或失敗（macOS）。 |

`WebViewNavigation` 為 `{ url, title, loading, canGoBack, canGoForward }`；在 Rust 中為 `WebNavigation`，包含 `url`、`title`、`loading`、`can_go_back` 和 `can_go_forward`。

`WebViewDownload` 為 `{ state, id, url, filename, path, bytes?, message? }`：`state` 為 `"started"`、`"finished"`（附帶檔案的 `bytes`）或 `"failed"`（附帶其 `message`）。加入 `onDownload` 監聽器後，頁面下載的內容（附件、web view 不會顯示的類型，或 `download` 連結）會儲存在應用程式的資料目錄中，名稱為 `downloads/<id>/<filename>`，由 `path` 指向，應用程式可使用 `fs/promises` 讀取。

在 macOS 上，加入該監聽器後，任何已載入且獲 `webview` capability 允許的頁面都可自動儲存下載內容。應用程式須自行管理儲存空間預算，並在用完已完成的檔案後，從 `downloads/` 中移除它們。移除 web view 會取消進行中的下載，並移除其未完成的目錄。下載會透過 `onDownload` 回報；將導覽轉為下載時，`onError` 仍只用於實際的導覽失敗。檔案名稱中的控制字元和雙向格式控制字元會被移除，過長的名稱會縮短至 200 位元組，並在可容納的情況下保留副檔名。

<a id="ref-methods"></a>

## Ref 方法

| 方法 | Rust | 說明 |
|---|---|---|
| `reload()` | `reload()` | 重新載入頁面。 |
| `goBack()` / `goForward()` | `go_back()` / `go_forward()` | 在頁面的歷史記錄中移動。 |
| `stopLoading()` | `stop_loading()` | 停止載入。 |
| `injectJavaScript(script)` | `inject_java_script(script)` | 在頁面中執行 JavaScript。 |
| `postMessage(data)` | `post_message(data)` | 向頁面傳送字串，頁面會在 `window` 上收到 `message` 事件。 |

<a id="messaging"></a>

## 訊息傳遞

應用程式與頁面之間以字串互相傳遞。頁面使用 `window.nsh.postMessage(data)` 傳送；應用程式使用 ref 的 `postMessage(data)`（Rust 中為 `post_message(..)`）傳送。結構化資料請傳送 JSON。

```rust tabs
use nsh_core::prelude::*;

const PAGE: &str = r#"<!doctype html>
<meta name="viewport" content="width=device-width">
<button onclick="window.nsh.postMessage('hello from the page')">Post to the app</button>
<p id="got"></p>
<script>
  window.addEventListener("message", (e) => { document.getElementById("got").textContent = e.data; });
</script>"#;

fn bridge() -> impl IntoElement {
    let message = signal(String::new());
    let web = element_ref();
    view()
        .gap_3()
        .child(
            web_view_html(PAGE.to_string(), None)
                .element_ref(&web)
                .h(px(200.0))
                .on_message(move |data: &str| message.set(data.to_string())),
        )
        .child(
            text(move || format!("Post to the page · got: {}", message.get()))
                .on_press(move || web.post_message("hi from the app")),
        )
}
```

```tsx tabs
import { signal, Text, View, WebView, type WebViewRef } from "nsh";

const page = `<!doctype html>
<meta name="viewport" content="width=device-width">
<button onclick="window.nsh.postMessage('hello from the page')">Post to the app</button>
<p id="got"></p>
<script>
  window.addEventListener("message", (e) => { document.getElementById("got").textContent = e.data; });
</script>`;

function Bridge() {
  const message = signal("");
  let web!: WebViewRef;
  return (
    <View style={{ gap: 12 }}>
      <WebView ref={web} html={page} style={{ height: 200 }} onMessage={(e) => message.set(e.data)} />
      <Text onPress={() => web.postMessage("hi from the app")}>Post to the page · got: {message()}</Text>
    </View>
  );
}
```

## Capabilities

當應用程式在 `nsh.json` 中宣告 [capabilities](../docs/sandbox-and-capabilities.md) 時，web view 只會顯示並導覽至 `webview` 下列出的主機。指向其他主機的 `src`，或在沒有 `webview` 的應用程式中使用 `html`，都會顯示空白視圖；導覽至其他主機的頂層導覽（例如使用者點按的連結）會在原生層被取消。以上每種情況都會回報 `onError`，並附帶 `code` `"ERR_ACCESS_DENIED"`。

```json
{
  "capabilities": {
    "webview": { "hosts": ["example.com", "*.example.com"] }
  }
}
```

<a id="platform-notes"></a>

## 平台注意事項

- iOS 在首次建立 web view 時才載入 WebKit，因此應用程式只有在顯示 web view 時才會付出這項成本。
- 在 macOS 上，`onDownload` 使用 WebKit 的 `WKDownload` 儲存下載內容。
- 在 Android 上，頁面的 `postMessage` 呼叫會在背景執行緒上到達，並按順序轉發給應用程式。
- 要為 web view 設定圓角，請指定圓角半徑及 `overflow: "hidden"`（`.overflow_hidden()`）。
