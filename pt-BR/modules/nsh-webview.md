---
title: "WebView"
description: "WebView, uma view nativa de página web (WKWebView, android.webkit.WebView), com suas props, eventos e métodos de ref."
order: 2.35
source_hash: 6ccdea7b98264f70
---


# WebView

`nsh` exporta `WebView`: uma página web exibida pelo mecanismo de navegador da própria plataforma (`WKWebView` no iOS e no Mac Catalyst, `android.webkit.WebView` no Android). É uma view nativa com layout como qualquer outra, então rola, recorta e se sobrepõe a outras views corretamente.

```ts
import { WebView, type WebViewNavigation, type WebViewProps } from "nsh";
```

Veja [Web view e vídeo](../docs/web-view-and-video.md) para o guia e [`<WebView>`](../elements/web-view.md) para suas props.

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

`WebView` aceita as [props de view](../elements/view.md) (estilo, classes, layout, acessibilidade, `ref`; sem filhos), além de:

| Prop | Tipo | Padrão | Descrição |
|---|---|---|---|
| `src` | `string` | | A URL da página a ser exibida. |
| `html` | `string` | | HTML inline, exibido no lugar de `src`. |
| `baseUrl` | `string` | | Base em relação à qual os links relativos de `html` são resolvidos. |
| `injectedJavaScript` | `string` | | Executa depois que cada página é carregada. |
| `injectedJavaScriptBeforeContentLoaded` | `string` | | Executa antes dos scripts próprios de cada página. |
| `userAgent` | `string` | da plataforma | A string de user agent. |
| `scrollable` | `boolean` | `true` | O usuário pode rolar a página. |
| `javaScriptEnabled` | `boolean` | `true` | As páginas executam scripts. |
| `ios` | `{ allowsBackForwardNavigationGestures?: boolean }` | | Somente iOS: deslize a partir das bordas para voltar e avançar. |
| `desktop` | `{ allowsBackForwardNavigationGestures?: boolean }` | | macOS: deslizar com dois dedos no trackpad volta e avança; Windows: deslizes na tela sensível ao toque; Linux: deslizes no touchpad. |

<a id="events"></a>

## Eventos

| Evento | Payload | Quando |
|---|---|---|
| `onLoadStart` | `WebViewNavigation` | Uma página começa a carregar. |
| `onLoad` | `WebViewNavigation` | Uma página terminou de carregar. |
| `onError` | `{ message: string }` | Uma página falhou ao carregar. |
| `onNavigationStateChange` | `WebViewNavigation` | A URL, o título, o estado de carregamento ou o histórico mudou. |
| `onMessage` | `{ data: string }` | A página chamou `window.nsh.postMessage(data)`. |

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

## Métodos de ref

| Método | Descrição |
|---|---|
| `reload()` | Recarrega a página. |
| `goBack()` | Volta no histórico. |
| `goForward()` | Avança no histórico. |
| `stopLoading()` | Interrompe o carregamento. |
| `injectJavaScript(script)` | Executa `script` na página. |
| `postMessage(data)` | Envia `data` (uma string) para a página: um evento `message` em `window`, com `data` como `event.data`. |

<a id="talking-to-the-page"></a>

## Comunicação com a página

A página envia strings para o app com `window.nsh.postMessage(…)`; o app envia strings para a página com `ref.postMessage(…)`. Envie JSON para dados estruturados.

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

Quando seu app declara `capabilities` em `nsh.json`, uma web view só pode exibir e navegar para os hosts listados em `webview`; outras navegações de nível superior são recusadas nativamente. Um app sem a chave `capabilities` pode exibir qualquer coisa. Veja [Sandbox e capacidades](../docs/sandbox-and-capabilities.md).

```json
{
  "capabilities": {
    "webview": { "hosts": ["example.com", "*.example.com"] }
  }
}
```
