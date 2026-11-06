---
title: "WebView"
description: "WebView,原生網頁檢視元件(WKWebView、android.webkit.WebView),包含其 props、事件與 ref 方法。"
order: 2.35
---

# WebView

`nsh` 匯出 `WebView`：由平台原生瀏覽器引擎顯示的網頁（iOS 與 Mac Catalyst 上為 `WKWebView`，Android 上為 `android.webkit.WebView`）。它是與其他 view 一樣進行排版的原生 view，因此能正確地捲動、裁切，並與其他 view 重疊。

```ts
import { WebView, type WebViewNavigation, type WebViewProps } from "nsh";
```

指南請參閱 [Web view and video](../docs/web-view-and-video.md)，其 props 請參閱 [`<WebView>`](../elements/web-view.md)。

<a id="webview-1"></a>

## WebView

```ts
const WebView: (props: WebViewProps) => JSX.Element;

interface WebViewProps extends Omit<ViewProps, "children" | "ios" | "desktop">, WebViewHostProps {
  ios?: IOSWebViewHostProps;
  desktop?: DesktopWebViewHostProps;
}
```

```tsx
import { mount, signal, Text, View, WebView, type WebViewNavigation, type WebViewRef } from "nsh";

function Browser() {
  const nav = signal<WebViewNavigation | null>(null);
  let web!: WebViewRef;
  return (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: "row", gap: 16, padding: 12 }}>
        <Text onPress={() => web.goBack()} style={{ opacity: nav()?.canGoBack ? 1 : 0.4 }}>Back</Text>
        <Text onPress={() => web.reload()}>Reload</Text>
        <Text style={{ numberOfLines: 1, flex: 1 }}>{nav()?.title ?? ""}</Text>
      </View>
      <WebView ref={web} src="https://example.com" style={{ flex: 1 }} onNavigationStateChange={(n) => nav.set(n)} />
    </View>
  );
}

mount(Browser);
```

## Props

`WebView` 接受 [view props](../elements/view.md)（style、classes、layout、accessibility、`ref`；不含 children），以及：

| Prop | 型別 | 預設值 | 說明 |
|---|---|---|---|
| `src` | `string` | | 要顯示的頁面 URL。 |
| `html` | `string` | | 內嵌 HTML，會取代 `src` 而顯示。 |
| `baseUrl` | `string` | | `html` 中相對連結的解析基準。 |
| `injectedJavaScript` | `string` | | 在每個頁面載入後執行。 |
| `injectedJavaScriptBeforeContentLoaded` | `string` | | 在每個頁面自身的腳本之前執行。 |
| `userAgent` | `string` | 平台預設值 | User agent 字串。 |
| `scrollable` | `boolean` | `true` | 使用者可以捲動頁面。 |
| `javaScriptEnabled` | `boolean` | `true` | 頁面可執行腳本。 |
| `ios` | `{ allowsBackForwardNavigationGestures?: boolean }` | | 僅限 iOS：從邊緣滑動以返回與前進。 |
| `desktop` | `{ allowsBackForwardNavigationGestures?: boolean }` | | macOS：使用觸控板雙指滑動以返回與前進；Windows：觸控螢幕滑動；Linux：觸控板滑動。 |

## Events

| Event | Payload | 觸發時機 |
|---|---|---|
| `onLoadStart` | `WebViewNavigation` | 頁面開始載入時。 |
| `onLoad` | `WebViewNavigation` | 頁面載入完成時。 |
| `onError` | `{ message: string }` | 頁面載入失敗時。 |
| `onNavigationStateChange` | `WebViewNavigation` | URL、標題、載入狀態或歷史記錄變更時。 |
| `onMessage` | `{ data: string }` | 頁面呼叫了 `window.nsh.postMessage(data)` 時。 |

```ts
interface WebViewNavigation {
  url: string;
  title: string;
  loading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
}
```

## Ref methods

| Method | 說明 |
|---|---|
| `reload()` | 重新載入頁面。 |
| `goBack()` | 在歷史記錄中返回。 |
| `goForward()` | 在歷史記錄中前進。 |
| `stopLoading()` | 停止載入。 |
| `injectJavaScript(script)` | 在頁面中執行 `script`。 |
| `postMessage(data)` | 將 `data`（字串）傳送給頁面：在 `window` 上觸發 `message` 事件，並以 `data` 作為 `event.data`。 |

<a id="talking-to-the-page"></a>

## 與頁面通訊

頁面使用 `window.nsh.postMessage(…)` 將字串傳送給應用程式；應用程式使用 `ref.postMessage(…)` 將字串傳送給頁面。若要傳遞結構化資料，請傳送 JSON。

```tsx
const page = `<!doctype html><html><head><meta name="viewport" content="width=device-width"></head>
<body>
  <button onclick="window.nsh.postMessage('hello from the page')">Post to the app</button>
  <p id="got"></p>
  <script>
    window.addEventListener('message', (e) => { document.getElementById('got').textContent = e.data; });
  </script>
</body></html>`;

let web!: WebViewRef;
const message = signal("");

<WebView ref={web} html={page} style={{ height: 200 }} onMessage={(e) => message.set(e.data)} />
<Text onPress={() => web.postMessage("hi from the app")}>Post to the page</Text>
```

## Capabilities

當您的應用程式在 `nsh.json` 中宣告 `capabilities` 時，web view 只能顯示並導覽至 `webview` 下列出的主機；其他頂層導覽會被原生層拒絕。沒有 `capabilities` 鍵的應用程式可以顯示任何內容。請參閱 [Sandbox and capabilities](../docs/sandbox-and-capabilities.md)。

```json
{
  "capabilities": {
    "webview": { "hosts": ["example.com", "*.example.com"] }
  }
}
```
