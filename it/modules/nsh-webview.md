---
title: "WebView"
description: "WebView, una vista nativa per pagine web (WKWebView, android.webkit.WebView), con le relative prop, eventi e metodi ref."
order: 2.35
source_hash: 6ccdea7b98264f70
---

# WebView

`nsh` esporta `WebView`: una pagina web mostrata dal motore browser nativo della piattaforma (`WKWebView` su iOS e Mac Catalyst, `android.webkit.WebView` su Android). È una vista nativa con layout come qualsiasi altra, quindi scorre, applica il clipping e si sovrappone correttamente alle altre viste.

```ts
import { WebView, type WebViewNavigation, type WebViewProps } from "nsh";
```

Consulta [Web view and video](../docs/web-view-and-video.md) per la guida e [`<WebView>`](../elements/web-view.md) per le sue props.

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

`WebView` accetta le [view props](../elements/view.md) (style, classes, layout, accessibilità, `ref`; nessun child), più:

| Prop | Tipo | Predefinito | Descrizione |
|---|---|---|---|
| `src` | `string` | | L'URL della pagina da mostrare. |
| `html` | `string` | | HTML inline, mostrato al posto di `src`. |
| `baseUrl` | `string` | | La base rispetto a cui vengono risolti i link relativi di `html`. |
| `injectedJavaScript` | `string` | | Viene eseguito dopo il caricamento di ogni pagina. |
| `injectedJavaScriptBeforeContentLoaded` | `string` | | Viene eseguito prima degli script propri di ogni pagina. |
| `userAgent` | `string` | quello della piattaforma | La stringa dello user agent. |
| `scrollable` | `boolean` | `true` | L'utente può scorrere la pagina. |
| `javaScriptEnabled` | `boolean` | `true` | Le pagine eseguono script. |
| `ios` | `{ allowsBackForwardNavigationGestures?: boolean }` | | Solo iOS: scorri dai bordi per tornare indietro e avanti. |
| `desktop` | `{ allowsBackForwardNavigationGestures?: boolean }` | | macOS: gli swipe con due dita sul trackpad permettono di tornare indietro e avanti; Windows: swipe sul touchscreen; Linux: swipe sul touchpad. |

<a id="events"></a>

## Eventi

| Evento | Payload | Quando |
|---|---|---|
| `onLoadStart` | `WebViewNavigation` | Una pagina inizia a caricarsi. |
| `onLoad` | `WebViewNavigation` | Una pagina ha terminato il caricamento. |
| `onError` | `{ message: string }` | Il caricamento di una pagina non è riuscito. |
| `onNavigationStateChange` | `WebViewNavigation` | Sono cambiati l'URL, il titolo, lo stato di caricamento o la cronologia. |
| `onMessage` | `{ data: string }` | La pagina ha chiamato `window.nsh.postMessage(data)`. |

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

## Metodi del ref

| Metodo | Descrizione |
|---|---|
| `reload()` | Ricarica la pagina. |
| `goBack()` | Torna indietro nella cronologia. |
| `goForward()` | Va avanti nella cronologia. |
| `stopLoading()` | Interrompe il caricamento. |
| `injectJavaScript(script)` | Esegue `script` nella pagina. |
| `postMessage(data)` | Invia `data` (una stringa) alla pagina: un evento `message` su `window`, con `data` come `event.data`. |

<a id="talking-to-the-page"></a>

## Comunicare con la pagina

La pagina invia stringhe all'app con `window.nsh.postMessage(…)`; l'app invia stringhe alla pagina con `ref.postMessage(…)`. Invia JSON per i dati strutturati.

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

<a id="capabilities"></a>

## Capability

Quando la tua app dichiara `capabilities` in `nsh.json`, una web view può mostrare e navigare solo verso gli host elencati in `webview`; le altre navigazioni di primo livello vengono rifiutate a livello nativo. Un'app senza una chiave `capabilities` può mostrare qualsiasi contenuto. Consulta [Sandbox and capabilities](../docs/sandbox-and-capabilities.md).

```json
{
  "capabilities": {
    "webview": { "hosts": ["example.com", "*.example.com"] }
  }
}
```
