---
title: "WebView"
description: "WebView, una vista nativa de páginas web (WKWebView, android.webkit.WebView), con sus props, eventos y métodos de ref."
order: 2.35
source_hash: 6ccdea7b98264f70
---


# WebView

`nsh` exporta `WebView`: una página web mostrada por el motor de navegador propio de la plataforma (`WKWebView` en iOS y Mac Catalyst, `android.webkit.WebView` en Android). Es una vista nativa con el layout como cualquier otra, por lo que se desplaza, recorta y se superpone correctamente a otras vistas.

```ts
import { WebView, type WebViewNavigation, type WebViewProps } from "nsh";
```

Consulta [Web view y vídeo](../docs/web-view-and-video.md) para la guía y [`<WebView>`](../elements/web-view.md) para sus props.

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

`WebView` acepta las [props de vista](../elements/view.md) (style, classes, layout, accesibilidad, `ref`; sin hijos), además de:

| Prop | Tipo | Predeterminado | Descripción |
|---|---|---|---|
| `src` | `string` | | La URL de la página que se muestra. |
| `html` | `string` | | HTML en línea, que se muestra en lugar de `src`. |
| `baseUrl` | `string` | | Base contra la que se resuelven los enlaces relativos de `html`. |
| `injectedJavaScript` | `string` | | Se ejecuta después de cargar cada página. |
| `injectedJavaScriptBeforeContentLoaded` | `string` | | Se ejecuta antes de los scripts propios de cada página. |
| `userAgent` | `string` | el de la plataforma | La cadena de user agent. |
| `scrollable` | `boolean` | `true` | El usuario puede desplazar la página. |
| `javaScriptEnabled` | `boolean` | `true` | Las páginas ejecutan scripts. |
| `ios` | `{ allowsBackForwardNavigationGestures?: boolean }` | | Solo iOS: deslizar desde los bordes para retroceder y avanzar. |
| `desktop` | `{ allowsBackForwardNavigationGestures?: boolean }` | | macOS: los deslizamientos con dos dedos en el trackpad retroceden y avanzan; Windows: deslizamientos en pantalla táctil; Linux: deslizamientos en el touchpad. |

<a id="events"></a>

## Eventos

| Evento | Payload | Cuándo |
|---|---|---|
| `onLoadStart` | `WebViewNavigation` | Una página empieza a cargarse. |
| `onLoad` | `WebViewNavigation` | Una página terminó de cargarse. |
| `onError` | `{ message: string }` | Una página no pudo cargarse. |
| `onNavigationStateChange` | `WebViewNavigation` | Cambió la URL, el título, el estado de carga o el historial. |
| `onMessage` | `{ data: string }` | La página llamó a `window.nsh.postMessage(data)`. |

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

## Métodos del ref

| Método | Descripción |
|---|---|
| `reload()` | Recarga la página. |
| `goBack()` | Retrocede en su historial. |
| `goForward()` | Avanza en su historial. |
| `stopLoading()` | Detiene la carga. |
| `injectJavaScript(script)` | Ejecuta `script` en la página. |
| `postMessage(data)` | Envía `data` (una cadena) a la página: un evento `message` en `window`, con `data` como `event.data`. |

<a id="talking-to-the-page"></a>

## Comunicación con la página

La página envía cadenas a la app con `window.nsh.postMessage(…)`; la app envía cadenas a la página con `ref.postMessage(…)`. Envía JSON para datos estructurados.

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

## Capacidades

Cuando tu app declara `capabilities` en `nsh.json`, un web view solo puede mostrar y navegar a los hosts listados en `webview`; las demás navegaciones de nivel superior se rechazan de forma nativa. Una app sin la clave `capabilities` puede mostrar cualquier cosa. Consulta [Sandbox y capacidades](../docs/sandbox-and-capabilities.md).

```json
{
  "capabilities": {
    "webview": { "hosts": ["example.com", "*.example.com"] }
  }
}
```
