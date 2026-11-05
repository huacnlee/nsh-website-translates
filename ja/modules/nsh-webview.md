---
title: "WebView"
description: "WebView は、ネイティブの Web ページビュー (WKWebView、android.webkit.WebView) です。props、イベント、ref メソッドについて説明します。"
order: 2.35
source_hash: 6ccdea7b98264f70
---

# WebView

`nsh` は `WebView` をエクスポートします。これは、プラットフォーム自体のブラウザエンジン(iOS と Mac Catalyst では `WKWebView`、Android では `android.webkit.WebView`)で表示されるウェブページです。他のビューと同じようにレイアウトされるネイティブビューであるため、スクロール、クリップ、他のビューとの重なりが正しく動作します。

```ts
import { WebView, type WebViewNavigation, type WebViewProps } from "nsh";
```

ガイドは [Web view and video](../docs/web-view-and-video.md)、props については [`<WebView>`](../elements/web-view.md) を参照してください。

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

`WebView` は [view props](../elements/view.md)(style、classes、layout、accessibility、`ref`。children は不可)に加えて、次の props を受け取ります。

| Prop | 型 | デフォルト | 説明 |
|---|---|---|---|
| `src` | `string` | | 表示するページの URL。 |
| `html` | `string` | | インライン HTML。`src` の代わりに表示されます。 |
| `baseUrl` | `string` | | `html` の相対リンクを解決する基準。 |
| `injectedJavaScript` | `string` | | 各ページの読み込み後に実行されます。 |
| `injectedJavaScriptBeforeContentLoaded` | `string` | | 各ページ自体のスクリプトより前に実行されます。 |
| `userAgent` | `string` | プラットフォームの値 | ユーザーエージェント文字列。 |
| `scrollable` | `boolean` | `true` | ユーザーがページをスクロールできます。 |
| `javaScriptEnabled` | `boolean` | `true` | ページがスクリプトを実行します。 |
| `ios` | `{ allowsBackForwardNavigationGestures?: boolean }` | | iOS のみ: 画面の端からスワイプして戻る・進むを行います。 |
| `desktop` | `{ allowsBackForwardNavigationGestures?: boolean }` | | macOS: トラックパッドの2本指スワイプで戻る・進む。Windows: タッチスクリーンのスワイプ。Linux: タッチパッドのスワイプ。 |

## Events

| Event | ペイロード | タイミング |
|---|---|---|
| `onLoadStart` | `WebViewNavigation` | ページの読み込みが開始されたとき。 |
| `onLoad` | `WebViewNavigation` | ページの読み込みが完了したとき。 |
| `onError` | `{ message: string }` | ページの読み込みに失敗したとき。 |
| `onNavigationStateChange` | `WebViewNavigation` | URL、タイトル、読み込み状態、または履歴が変更されたとき。 |
| `onMessage` | `{ data: string }` | ページが `window.nsh.postMessage(data)` を呼び出したとき。 |

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

| メソッド | 説明 |
|---|---|
| `reload()` | ページを再読み込みします。 |
| `goBack()` | 履歴を戻ります。 |
| `goForward()` | 履歴を進みます。 |
| `stopLoading()` | 読み込みを停止します。 |
| `injectJavaScript(script)` | ページ内で `script` を実行します。 |
| `postMessage(data)` | `data`(文字列)をページに送信します。`window` に対する `message` イベントとして届き、`data` が `event.data` になります。 |

<a id="talking-to-the-page"></a>

## ページとの通信

ページは `window.nsh.postMessage(…)` でアプリに文字列を送信し、アプリは `ref.postMessage(…)` でページに文字列を送信します。構造化データには JSON を送信してください。

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

アプリが `nsh.json` で `capabilities` を宣言している場合、Web view は `webview` に列挙されたホストのみ表示・遷移できます。それ以外のトップレベルのナビゲーションはネイティブ側で拒否されます。`capabilities` キーのないアプリは、任意のページを表示できます。[Sandbox and capabilities](../docs/sandbox-and-capabilities.md) を参照してください。

```json
{
  "capabilities": {
    "webview": { "hosts": ["example.com", "*.example.com"] }
  }
}
```
