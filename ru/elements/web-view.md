---
title: "WebView"
description: "Элемент WebView: веб-страницы и встроенный HTML внутри приложения с обменом сообщениями в обе стороны."
order: 80
group: primitives
demo: el-web-view
source_hash: 455bf8f5d2ba5a4c
---

# WebView

Веб-представление показывает веб-страницу или переданный HTML внутри приложения: WKWebView на iOS и Mac Catalyst,
`android.webkit.WebView` на Android. Поскольку NSH отрисовывает интерфейс нативными представлениями, веб-представление располагается в раскладке как любое другое
представление, по порядку среди соседних. В Rust его создают с помощью `web_view(url)` или `web_view_html(html, base_url)`, в TSX —
с помощью `<WebView>` из `nsh`.

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

В TSX веб-представление принимает одно из свойств `src` и `html` (см. [WebView API](../modules/nsh-webview.md)). В
[руководстве по веб-представлению и видео](../docs/web-view-and-video.md) описаны шаблоны обмена сообщениями и capabilities.

<a id="props"></a>

## Свойства

Веб-представление принимает свойства [представления](./view.md) (дочерних элементов у него нет) плюс следующие:

| Свойство | Rust | Тип | По умолчанию | Описание |
|---|---|---|---|---|
| `src` | `web_view(url)` | `string` | | URL отображаемой страницы. |
| `html` | `web_view_html(html, base_url)`, `.html(html, base_url)` | `string` | | Встроенный HTML, отображается вместо `src`. |
| `baseUrl` | `base_url` из `web_view_html` / `.html` | `string` | | Базовый адрес, относительно которого разрешаются относительные ссылки `html`. |
| `injectedJavaScript` | `.injected_java_script(..)` | `string` | | Выполняется после загрузки каждой страницы. |
| `injectedJavaScriptBeforeContentLoaded` | `.injected_java_script_before_content(..)` | `string` | | Выполняется перед собственными скриптами каждой страницы. |
| `userAgent` | `.user_agent(..)` | `string` | | Строка user agent браузера. |
| `javaScriptEnabled` | `.java_script_enabled(..)` | `boolean` | `true` | Страницы выполняют скрипты. |
| `scrollable` | `.scrollable(..)` | `boolean` | `true` | Пользователь может прокручивать страницу. |

| Ключ `ios` | Rust | Тип | Описание |
|---|---|---|---|
| `allowsBackForwardNavigationGestures` | `.back_forward_gestures(..)` | `boolean` | Свайп от краёв для перехода назад и вперёд. |

| Ключ `desktop` | Rust | Тип | Описание |
|---|---|---|---|
| `allowsBackForwardNavigationGestures` | `.back_forward_gestures(..)` | `boolean` | macOS: свайп двумя пальцами по трекпаду для перехода назад и вперёд; Windows: свайп по сенсорному экрану; Linux: свайп по тачпаду. |

<a id="events"></a>

## События

| Событие | Rust | Данные | Когда |
|---|---|---|---|
| `onLoadStart` | `.on_load_start` | `WebViewNavigation` | Страница начала загружаться. |
| `onLoad` | `.on_load` | `WebViewNavigation` | Страница завершила загрузку. |
| `onError` | `.on_error` | `{ message, code? }` (`&str`, сообщение) | Загрузка не удалась; `code` равно `"ERR_ACCESS_DENIED"` для страницы или `html`, не разрешённых capabilities приложения. |
| `onNavigationStateChange` | `.on_navigation_state_change` | `WebViewNavigation` | Изменился URL, заголовок, состояние загрузки или история. |
| `onMessage` | `.on_message` | `{ data: string }` (`&str`) | Страница вызвала `window.nsh.postMessage(data)`. |
| `onDownload` | | `WebViewDownload` | Загрузка файла началась, завершилась или не удалась (macOS). |

`WebViewNavigation` — это `{ url, title, loading, canGoBack, canGoForward }`; в Rust — `WebNavigation` с `url`, `title`,
`loading`, `can_go_back` и `can_go_forward`.

`WebViewDownload` — это `{ state, id, url, filename, path, bytes?, message? }`: `state` равно `"started"`, `"finished"`
(с `bytes` файла) или `"failed"` (с его `message`). При наличии слушателя `onDownload` всё, что страница скачивает
(вложение, тип, который веб-представление не отображает, ссылка `download`), сохраняется в каталоге данных приложения как
`downloads/<id>/<filename>`, куда указывает `path`, и приложение читает файл с помощью `fs/promises`.

На macOS добавление слушателя позволяет любой загруженной странице, разрешённой capability `webview`, сохранять загрузки
автоматически. Приложение отвечает за свой лимит хранилища и за удаление завершённых файлов из `downloads/`
после того, как они перестали использоваться. Удаление веб-представления отменяет текущие загрузки и удаляет их временные
каталоги. О загрузках сообщается через `onDownload`; превращение навигации в загрузку оставляет `onError`
для настоящих ошибок навигации. Из имён файлов удаляются управляющие символы и символы управления двунаправленным форматированием,
а длинные имена сокращаются до 200 байт с сохранением расширения, если оно помещается.

<a id="ref-methods"></a>

## Методы ref

| Метод | Rust | Описание |
|---|---|---|
| `reload()` | `reload()` | Перезагружает страницу. |
| `goBack()` / `goForward()` | `go_back()` / `go_forward()` | Перемещается по истории страницы. |
| `stopLoading()` | `stop_loading()` | Останавливает загрузку. |
| `injectJavaScript(script)` | `inject_java_script(script)` | Выполняет JavaScript на странице. |
| `postMessage(data)` | `post_message(data)` | Отправляет строку странице, которая получает событие `message` на `window`. |

<a id="messaging"></a>

## Обмен сообщениями

Приложение и страница обмениваются строками. Страница отправляет сообщение через `window.nsh.postMessage(data)`; приложение отправляет
через `postMessage(data)` у ref (`post_message(..)` в Rust). Для структурированных данных отправляйте JSON.

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

Если приложение объявляет [capabilities](../docs/sandbox-and-capabilities.md) в `nsh.json`, веб-представление показывает страницы
и переходит на хосты, перечисленные в `webview`. `src` на другом хосте или `html` в приложении без `webview` показывают
пустое представление; переход верхнего уровня на другой хост (по ссылке, на которую нажал пользователь) отменяется на нативном уровне. В каждом случае
сообщается `onError` с `code` `"ERR_ACCESS_DENIED"`.

```json
{
  "capabilities": {
    "webview": { "hosts": ["example.com", "*.example.com"] }
  }
}
```

<a id="platform-notes"></a>

## Особенности платформ

- iOS загружает WebKit при первом создании веб-представления, поэтому приложению это обходится в ресурсы, только когда оно его показывает.
- На macOS `onDownload` сохраняет загрузки средствами WebKit `WKDownload`.
- На Android вызовы `postMessage` со страницы приходят в фоновом потоке и передаются приложению по порядку.
- Чтобы скруглить углы веб-представления, задайте ему радиус скругления и `overflow: "hidden"` (`.overflow_hidden()`).
