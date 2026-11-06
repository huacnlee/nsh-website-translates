---
title: "WebView"
description: "WebView 元素:在應用程式內顯示網頁與內嵌 HTML,並支援雙向訊息傳遞。"
order: 80
group: primitives
demo: el-web-view
---

# WebView

Web view 會在 app 內顯示網頁或你傳入的 HTML:在 iOS 與 Mac Catalyst 上使用 WKWebView,在 Android 上使用 `android.webkit.WebView`。由於 NSH 以原生 view 進行渲染,web view 在版面配置中與其他 view 並無差異,會依順序排列在周圍的 view 之間。在 Rust 中以 `web_view(url)` 或 `web_view_html(html, base_url)` 建立,在 TSX 中則使用 `nsh` 的 `<WebView>`。

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

在 TSX 中,web view 接受 `src` 與 `html` 其中之一(請參閱 [WebView API](../modules/nsh-webview.md))。[web view 與影片指南](../docs/web-view-and-video.md)涵蓋了訊息傳遞模式與 capabilities。

## Props

Web view 接受 [view](./view.md) 的 props(它沒有子元素),另外還有:

| Prop | Rust | 型別 | 預設值 | 說明 |
|---|---|---|---|---|
| `src` | `web_view(url)` | `string` | | 要顯示的頁面 URL。 |
| `html` | `web_view_html(html, base_url)`、`.html(html, base_url)` | `string` | | 內嵌 HTML,會取代 `src` 顯示。 |
| `baseUrl` | `base_url`(包含 `web_view_html` / `.html`) | `string` | | `html` 中相對連結的解析基準。 |
| `injectedJavaScript` | `.injected_java_script(..)` | `string` | | 在每個頁面載入完成後執行。 |
| `injectedJavaScriptBeforeContentLoaded` | `.injected_java_script_before_content(..)` | `string` | | 在每個頁面自身的腳本之前執行。 |
| `userAgent` | `.user_agent(..)` | `string` | | 瀏覽器的 user agent 字串。 |
| `javaScriptEnabled` | `.java_script_enabled(..)` | `boolean` | `true` | 頁面是否執行腳本。 |
| `scrollable` | `.scrollable(..)` | `boolean` | `true` | 使用者是否可以捲動頁面。 |

| `ios` 鍵 | Rust | 型別 | 說明 |
|---|---|---|---|
| `allowsBackForwardNavigationGestures` | `.back_forward_gestures(..)` | `boolean` | 從邊緣滑動以返回與前進。 |

| `desktop` 鍵 | Rust | 型別 | 說明 |
|---|---|---|---|
| `allowsBackForwardNavigationGestures` | `.back_forward_gestures(..)` | `boolean` | macOS:在觸控板上以雙指滑動以返回與前進;Windows:在觸控螢幕上滑動;Linux:在觸控板上滑動。 |

<a id="events"></a>

## 事件

| 事件 | Rust | Payload | 時機 |
|---|---|---|---|
| `onLoadStart` | `.on_load_start` | `WebViewNavigation` | 頁面開始載入。 |
| `onLoad` | `.on_load` | `WebViewNavigation` | 頁面載入完成。 |
| `onError` | `.on_error` | `{ message, code? }`(`&str`,即訊息) | 載入失敗;對於頁面,`code` 為 `"ERR_ACCESS_DENIED"`,對於 app 的 capabilities 未授予的內容,則為 `html`。 |
| `onNavigationStateChange` | `.on_navigation_state_change` | `WebViewNavigation` | URL、標題、載入狀態或歷史記錄已變更。 |
| `onMessage` | `.on_message` | `{ data: string }`(`&str`) | 頁面呼叫了 `window.nsh.postMessage(data)`。 |
| `onDownload` | | `WebViewDownload` | 下載已開始、已完成或失敗(macOS)。 |

`WebViewNavigation` 為 `{ url, title, loading, canGoBack, canGoForward }`;在 Rust 中為 `WebNavigation`,包含 `url`、`title`、`loading`、`can_go_back` 與 `can_go_forward`。

`WebViewDownload` 為 `{ state, id, url, filename, path, bytes?, message? }`:`state` 為 `"started"`、`"finished"`(附帶檔案的 `bytes`)或 `"failed"`(附帶其 `message`)。加上 `onDownload` 監聽器後,頁面所下載的內容(附件、web view 不顯示的類型,或 `download` 連結)會儲存在 app 的資料目錄中,路徑為 `downloads/<id>/<filename>`,即 `path` 所指向的位置,app 可透過 `fs/promises` 讀取。

在 macOS 上,加入該監聽器後,任何經 `webview` capability 允許而載入的頁面都能自動儲存下載內容。app 須自行負責其儲存空間預算,並在使用完畢後從 `downloads/` 移除已完成的檔案。移除 web view 會取消進行中的下載,並移除其未完成的暫存目錄。下載透過 `onDownload` 回報;將導覽轉為下載時,`onError` 仍保留給實際的導覽失敗。檔名中的控制字元與雙向格式控制字元會被移除,過長的名稱會縮短至 200 位元組,同時盡可能保留符合長度的副檔名。

<a id="ref-methods"></a>

## Ref 方法

| 方法 | Rust | 說明 |
|---|---|---|
| `reload()` | `reload()` | 重新載入頁面。 |
| `goBack()` / `goForward()` | `go_back()` / `go_forward()` | 在頁面歷史記錄中移動。 |
| `stopLoading()` | `stop_loading()` | 停止載入。 |
| `injectJavaScript(script)` | `inject_java_script(script)` | 在頁面中執行 JavaScript。 |
| `postMessage(data)` | `post_message(data)` | 向頁面傳送字串,頁面會在 `window` 上收到 `message` 事件。 |

<a id="messaging"></a>

## 訊息傳遞

app 與頁面之間以字串互相交換資料。頁面使用 `window.nsh.postMessage(data)` 傳送;app 則使用 ref 的 `postMessage(data)`(Rust 中為 `post_message(..)`)傳送。若要傳遞結構化資料,請傳送 JSON。

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

當 app 在 `nsh.json` 中宣告 [capabilities](../docs/sandbox-and-capabilities.md) 時,web view 只會顯示並導覽至 `webview` 下列出的主機。對其他主機發出的 `src`,或在沒有 `webview` 的 app 中使用 `html`,都會顯示空白的 view;對其他主機的頂層導覽(例如使用者點選的連結)會在原生層被取消。以上每種情況都會回報 `onError`,並附帶 `code` `"ERR_ACCESS_DENIED"`。

```json
{
  "capabilities": {
    "webview": { "hosts": ["example.com", "*.example.com"] }
  }
}
```

<a id="platform-notes"></a>

## 平台注意事項

- iOS 會在第一次建立 web view 時才載入 WebKit,因此 app 只有在顯示 web view 時才會付出相關成本。
- 在 macOS 上,`onDownload` 使用 WebKit 的 `WKDownload` 儲存下載內容。
- 在 Android 上,頁面的 `postMessage` 呼叫會在背景執行緒上送達,並依序轉送至 app。
- 若要讓 web view 的邊角變圓,請為其設定圓角半徑與 `overflow: "hidden"`(`.overflow_hidden()`)。
