---
title: "WebView"
description: "WebView — нативное представление веб-страницы (WKWebView, android.webkit.WebView), его props, события и методы ref."
order: 2.35
source_hash: 6ccdea7b98264f70
---

# WebView

`nsh` экспортирует `WebView`: веб-страницу, отображаемую собственным браузерным движком платформы (`WKWebView` на iOS и Mac Catalyst, `android.webkit.WebView` на Android). Это нативное представление, которое размещается как любое другое, поэтому оно корректно прокручивается, обрезается и перекрывается другими представлениями.

```ts
import { WebView, type WebViewNavigation, type WebViewProps } from "nsh";
```

Руководство: [Веб-представление и видео](../docs/web-view-and-video.md). Свойства: [`<WebView>`](../elements/web-view.md).

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

`WebView` принимает [свойства представления](../elements/view.md) (style, classes, layout, accessibility, `ref`; без дочерних элементов), а также:

| Свойство | Тип | По умолчанию | Описание |
|---|---|---|---|
| `src` | `string` | | URL отображаемой страницы. |
| `html` | `string` | | Встроенный HTML, отображаемый вместо `src`. |
| `baseUrl` | `string` | | База, относительно которой разрешаются относительные ссылки в `html`. |
| `injectedJavaScript` | `string` | | Выполняется после загрузки каждой страницы. |
| `injectedJavaScriptBeforeContentLoaded` | `string` | | Выполняется перед собственными скриптами каждой страницы. |
| `userAgent` | `string` | значение платформы | Строка user agent. |
| `scrollable` | `boolean` | `true` | Пользователь может прокручивать страницу. |
| `javaScriptEnabled` | `boolean` | `true` | Страницы выполняют скрипты. |
| `ios` | `{ allowsBackForwardNavigationGestures?: boolean }` | | Только iOS: свайп от краёв экрана для перехода назад и вперёд. |
| `desktop` | `{ allowsBackForwardNavigationGestures?: boolean }` | | macOS: свайп двумя пальцами на трекпаде для перехода назад и вперёд; Windows: свайпы на сенсорном экране; Linux: свайпы на тачпаде. |

<a id="events"></a>

## События

| Событие | Данные | Когда |
|---|---|---|
| `onLoadStart` | `WebViewNavigation` | Страница начинает загружаться. |
| `onLoad` | `WebViewNavigation` | Страница загрузилась. |
| `onError` | `{ message: string }` | Страницу не удалось загрузить. |
| `onNavigationStateChange` | `WebViewNavigation` | Изменились URL, заголовок, состояние загрузки или история. |
| `onMessage` | `{ data: string }` | Страница вызвала `window.nsh.postMessage(data)`. |

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

## Методы ref

| Метод | Описание |
|---|---|
| `reload()` | Перезагружает страницу. |
| `goBack()` | Переходит назад по истории. |
| `goForward()` | Переходит вперёд по истории. |
| `stopLoading()` | Останавливает загрузку. |
| `injectJavaScript(script)` | Выполняет `script` на странице. |
| `postMessage(data)` | Отправляет `data` (строку) на страницу: событие `message` на `window`, где `data` передаётся как `event.data`. |

<a id="talking-to-the-page"></a>

## Взаимодействие со страницей

Страница отправляет строки в приложение через `window.nsh.postMessage(…)`, а приложение отправляет строки на страницу через `ref.postMessage(…)`. Для структурированных данных отправляйте JSON.

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

## Возможности

Если ваше приложение объявляет `capabilities` в `nsh.json`, веб-представление может показывать и открывать только хосты, перечисленные в `webview`; остальные навигации верхнего уровня отклоняются на нативном уровне. Приложение без ключа `capabilities` может показывать что угодно. См. [Песочница и возможности](../docs/sandbox-and-capabilities.md).

```json
{
  "capabilities": {
    "webview": { "hosts": ["example.com", "*.example.com"] }
  }
}
```
