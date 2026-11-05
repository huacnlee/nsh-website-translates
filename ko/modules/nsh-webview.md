---
title: "WebView"
description: "WebView, 네이티브 웹 페이지 뷰(WKWebView, android.webkit.WebView)와 해당 props, 이벤트, ref 메서드를 설명합니다."
order: 2.35
source_hash: 6ccdea7b98264f70
---

# WebView

`nsh`은(는) `WebView`을(를) 내보냅니다. 이는 플랫폼 자체 브라우저 엔진(iOS와 Mac Catalyst에서는 `WKWebView`, Android에서는 `android.webkit.WebView`)이 표시하는 웹 페이지입니다. 다른 뷰와 똑같이 배치되는 네이티브 뷰이므로 스크롤, 클리핑, 다른 뷰와의 겹침이 올바르게 동작합니다.

```ts
import { WebView, type WebViewNavigation, type WebViewProps } from "nsh";
```

가이드는 [웹 뷰와 비디오](../docs/web-view-and-video.md)를, props는 [`<WebView>`](../elements/web-view.md)을(를) 참고하세요.

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

`WebView`은(는) [뷰 props](../elements/view.md)(style, classes, 레이아웃, 접근성, `ref`; children 없음)와 함께 다음을 받습니다.

| Prop | 타입 | 기본값 | 설명 |
|---|---|---|---|
| `src` | `string` | | 표시할 페이지의 URL입니다. |
| `html` | `string` | | 인라인 HTML이며, `src` 대신 표시됩니다. |
| `baseUrl` | `string` | | `html`의 상대 링크가 해석되는 기준입니다. |
| `injectedJavaScript` | `string` | | 각 페이지가 로드된 후 실행됩니다. |
| `injectedJavaScriptBeforeContentLoaded` | `string` | | 각 페이지 자체 스크립트보다 먼저 실행됩니다. |
| `userAgent` | `string` | 플랫폼 기본값 | User agent 문자열입니다. |
| `scrollable` | `boolean` | `true` | 사용자가 페이지를 스크롤할 수 있습니다. |
| `javaScriptEnabled` | `boolean` | `true` | 페이지가 스크립트를 실행합니다. |
| `ios` | `{ allowsBackForwardNavigationGestures?: boolean }` | | iOS 전용: 화면 가장자리에서 스와이프하여 뒤로 또는 앞으로 이동합니다. |
| `desktop` | `{ allowsBackForwardNavigationGestures?: boolean }` | | macOS: 두 손가락 트랙패드 스와이프로 뒤로 또는 앞으로 이동합니다. Windows: 터치스크린 스와이프. Linux: 터치패드 스와이프. |

<a id="events"></a>

## 이벤트

| 이벤트 | 페이로드 | 시점 |
|---|---|---|
| `onLoadStart` | `WebViewNavigation` | 페이지 로드가 시작될 때. |
| `onLoad` | `WebViewNavigation` | 페이지 로드가 완료되었을 때. |
| `onError` | `{ message: string }` | 페이지 로드에 실패했을 때. |
| `onNavigationStateChange` | `WebViewNavigation` | URL, 제목, 로딩 상태 또는 기록이 변경되었을 때. |
| `onMessage` | `{ data: string }` | 페이지가 `window.nsh.postMessage(data)`을(를) 호출했을 때. |

```ts
interface WebViewNavigation {
  url: string;
  title: string;
  loading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
}
```

<a id="ref-methods"></a>

## Ref 메서드

| 메서드 | 설명 |
|---|---|
| `reload()` | 페이지를 다시 로드합니다. |
| `goBack()` | 기록에서 뒤로 이동합니다. |
| `goForward()` | 기록에서 앞으로 이동합니다. |
| `stopLoading()` | 로드를 중지합니다. |
| `injectJavaScript(script)` | 페이지에서 `script`을(를) 실행합니다. |
| `postMessage(data)` | `data`(문자열)을 페이지로 보냅니다. `window`에서 `message` 이벤트가 발생하며, `data`이(가) `event.data`(으)로 전달됩니다. |

<a id="talking-to-the-page"></a>

## 페이지와 통신하기

페이지는 `window.nsh.postMessage(…)`을(를) 사용해 앱에 문자열을 보내고, 앱은 `ref.postMessage(…)`을(를) 사용해 페이지에 문자열을 보냅니다. 구조화된 데이터는 JSON으로 보내세요.

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

앱이 `nsh.json`에 `capabilities`을(를) 선언하면, 웹 뷰는 `webview` 아래에 나열된 호스트만 표시하고 해당 호스트로만 이동할 수 있습니다. 그 외의 최상위 탐색은 네이티브 수준에서 거부됩니다. `capabilities` 키가 없는 앱은 어떤 것이든 표시할 수 있습니다. [샌드박스와 capabilities](../docs/sandbox-and-capabilities.md)를 참고하세요.

```json
{
  "capabilities": {
    "webview": { "hosts": ["example.com", "*.example.com"] }
  }
}
```
