---
title: "WebView"
description: "WebView, eine native Webseitenansicht (WKWebView, android.webkit.WebView), mit ihren Props, Events und Ref-Methoden."
order: 2.35
source_hash: 6ccdea7b98264f70
---


# WebView

`nsh` exportiert `WebView`: eine Webseite, die von der Browser-Engine der Plattform selbst dargestellt wird (`WKWebView` unter iOS und Mac Catalyst, `android.webkit.WebView` unter Android). Es ist eine native View, die wie jede andere View im Layout angeordnet wird, sodass sie korrekt scrollt, clippt und andere Views überlappt.

```ts
import { WebView, type WebViewNavigation, type WebViewProps } from "nsh";
```

Siehe [Web view and video](../docs/web-view-and-video.md) für die Anleitung und [`<WebView>`](../elements/web-view.md) für die zugehörigen Props.

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

`WebView` akzeptiert die [View-Props](../elements/view.md) (Style, Klassen, Layout, Barrierefreiheit, `ref`; keine Children) sowie zusätzlich:

| Prop | Typ | Standard | Beschreibung |
|---|---|---|---|
| `src` | `string` | | Die URL der anzuzeigenden Seite. |
| `html` | `string` | | Inline-HTML, das anstelle von `src` angezeigt wird. |
| `baseUrl` | `string` | | Die Basis, gegen die relative Links aus `html` aufgelöst werden. |
| `injectedJavaScript` | `string` | | Wird nach dem Laden jeder Seite ausgeführt. |
| `injectedJavaScriptBeforeContentLoaded` | `string` | | Wird vor den eigenen Skripten jeder Seite ausgeführt. |
| `userAgent` | `string` | plattformabhängig | Der User-Agent-String. |
| `scrollable` | `boolean` | `true` | Der Benutzer kann die Seite scrollen. |
| `javaScriptEnabled` | `boolean` | `true` | Seiten führen Skripte aus. |
| `ios` | `{ allowsBackForwardNavigationGestures?: boolean }` | | Nur iOS: Wischen von den Rändern, um zurück- und vorwärtszunavigieren. |
| `desktop` | `{ allowsBackForwardNavigationGestures?: boolean }` | | macOS: Wischgesten mit zwei Fingern auf dem Trackpad navigieren zurück und vorwärts; Windows: Wischgesten auf dem Touchscreen; Linux: Wischgesten auf dem Touchpad. |

## Events

| Event | Payload | Wann |
|---|---|---|
| `onLoadStart` | `WebViewNavigation` | Eine Seite beginnt zu laden. |
| `onLoad` | `WebViewNavigation` | Eine Seite wurde fertig geladen. |
| `onError` | `{ message: string }` | Eine Seite konnte nicht geladen werden. |
| `onNavigationStateChange` | `WebViewNavigation` | URL, Titel, Ladezustand oder Verlauf haben sich geändert. |
| `onMessage` | `{ data: string }` | Die Seite hat `window.nsh.postMessage(data)` aufgerufen. |

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

## Ref-Methoden

| Methode | Beschreibung |
|---|---|
| `reload()` | Lädt die Seite neu. |
| `goBack()` | Geht im Verlauf zurück. |
| `goForward()` | Geht im Verlauf vorwärts. |
| `stopLoading()` | Bricht das Laden ab. |
| `injectJavaScript(script)` | Führt `script` in der Seite aus. |
| `postMessage(data)` | Sendet `data` (einen String) an die Seite: ein `message`-Event auf `window`, mit `data` als `event.data`. |

<a id="talking-to-the-page"></a>

## Kommunikation mit der Seite

Die Seite sendet Strings mit `window.nsh.postMessage(…)` an die App; die App sendet Strings mit `ref.postMessage(…)` an die Seite. Für strukturierte Daten sollte JSON gesendet werden.

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

Wenn Ihre App `capabilities` in `nsh.json` deklariert, darf eine Web View nur die unter `webview` aufgeführten Hosts anzeigen und dorthin navigieren; andere Top-Level-Navigationen werden nativ abgelehnt. Eine App ohne `capabilities`-Schlüssel darf beliebige Inhalte anzeigen. Siehe [Sandbox and capabilities](../docs/sandbox-and-capabilities.md).

```json
{
  "capabilities": {
    "webview": { "hosts": ["example.com", "*.example.com"] }
  }
}
```
