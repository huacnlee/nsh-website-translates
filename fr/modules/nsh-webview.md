---
title: "WebView"
description: "WebView, une vue native de page web (WKWebView, android.webkit.WebView), avec ses props, ses événements et ses méthodes de ref."
order: 2.35
source_hash: 6ccdea7b98264f70
---

# WebView

`nsh` exporte `WebView` : une page web affichée par le moteur de navigateur propre à la plateforme (`WKWebView` sur iOS et Mac Catalyst, `android.webkit.WebView` sur Android). C'est une vue native disposée comme n'importe quelle autre, elle défile, découpe son contenu et chevauche donc correctement les autres vues.

```ts
import { WebView, type WebViewNavigation, type WebViewProps } from "nsh";
```

Consultez [Web view et vidéo](../docs/web-view-and-video.md) pour le guide et [`<WebView>`](../elements/web-view.md) pour ses props.

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

`WebView` accepte les [props de vue](../elements/view.md) (style, classes, mise en page, accessibilité, `ref` ; pas d'enfants), ainsi que :

| Prop | Type | Défaut | Description |
|---|---|---|---|
| `src` | `string` | | L'URL de la page à afficher. |
| `html` | `string` | | HTML en ligne, affiché à la place de `src`. |
| `baseUrl` | `string` | | La base par rapport à laquelle les liens relatifs de `html` sont résolus. |
| `injectedJavaScript` | `string` | | S'exécute après le chargement de chaque page. |
| `injectedJavaScriptBeforeContentLoaded` | `string` | | S'exécute avant les scripts propres à chaque page. |
| `userAgent` | `string` | celui de la plateforme | La chaîne user agent. |
| `scrollable` | `boolean` | `true` | L'utilisateur peut faire défiler la page. |
| `javaScriptEnabled` | `boolean` | `true` | Les pages exécutent des scripts. |
| `ios` | `{ allowsBackForwardNavigationGestures?: boolean }` | | iOS uniquement : balayage depuis les bords pour reculer et avancer. |
| `desktop` | `{ allowsBackForwardNavigationGestures?: boolean }` | | macOS : balayages à deux doigts sur le trackpad pour reculer et avancer ; Windows : balayages sur écran tactile ; Linux : balayages sur le pavé tactile. |

<a id="events"></a>

## Événements

| Événement | Payload | Quand |
|---|---|---|
| `onLoadStart` | `WebViewNavigation` | Une page commence à se charger. |
| `onLoad` | `WebViewNavigation` | Une page a fini de se charger. |
| `onError` | `{ message: string }` | Le chargement d'une page a échoué. |
| `onNavigationStateChange` | `WebViewNavigation` | L'URL, le titre, l'état de chargement ou l'historique a changé. |
| `onMessage` | `{ data: string }` | La page a appelé `window.nsh.postMessage(data)`. |

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

## Méthodes de ref

| Méthode | Description |
|---|---|
| `reload()` | Recharge la page. |
| `goBack()` | Recule dans son historique. |
| `goForward()` | Avance dans son historique. |
| `stopLoading()` | Interrompt le chargement. |
| `injectJavaScript(script)` | Exécute `script` dans la page. |
| `postMessage(data)` | Envoie `data` (une chaîne) à la page : un événement `message` sur `window`, avec `data` comme `event.data`. |

<a id="talking-to-the-page"></a>

## Dialoguer avec la page

La page envoie des chaînes à l'application avec `window.nsh.postMessage(…)` ; l'application envoie des chaînes à la page avec `ref.postMessage(…)`. Envoyez du JSON pour les données structurées.

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

## Capacités

Lorsque votre application déclare `capabilities` dans `nsh.json`, une web view ne peut afficher et parcourir que les hôtes listés sous `webview` ; les autres navigations de premier niveau sont refusées nativement. Une application sans clé `capabilities` peut tout afficher. Consultez [Sandbox et capacités](../docs/sandbox-and-capabilities.md).

```json
{
  "capabilities": {
    "webview": { "hosts": ["example.com", "*.example.com"] }
  }
}
```
