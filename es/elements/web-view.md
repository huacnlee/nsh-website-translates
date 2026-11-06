---
title: "WebView"
description: "El elemento WebView: páginas web y HTML en línea dentro de una app, con mensajería en ambos sentidos."
order: 80
group: primitives
demo: el-web-view
source_hash: 455bf8f5d2ba5a4c
---


# WebView

Una vista web muestra una página web, o HTML que le pasas, dentro de la app: WKWebView en iOS y Mac Catalyst,
`android.webkit.WebView` en Android. Como NSH renderiza con vistas nativas, una vista web se coloca en el layout como cualquier otra
vista, en orden con las vistas que la rodean. Rust crea una con `web_view(url)` o `web_view_html(html, base_url)`, y TSX
con `<WebView>` de `nsh`.

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

En TSX, una vista web acepta uno de `src` y `html` (consulta la [API de WebView](../modules/nsh-webview.md)). La
[guía de vista web y vídeo](../docs/web-view-and-video.md) cubre los patrones de mensajería y las capacidades.

## Props

Una vista web acepta las props de una [vista](./view.md) (no tiene hijos) además de:

| Prop | Rust | Tipo | Valor predeterminado | Descripción |
|---|---|---|---|---|
| `src` | `web_view(url)` | `string` | | La URL de la página que se muestra. |
| `html` | `web_view_html(html, base_url)`, `.html(html, base_url)` | `string` | | HTML en línea, que se muestra en lugar de `src`. |
| `baseUrl` | `base_url` de `web_view_html` / `.html` | `string` | | Base contra la que se resuelven los enlaces relativos de `html`. |
| `injectedJavaScript` | `.injected_java_script(..)` | `string` | | Se ejecuta después de cargar cada página. |
| `injectedJavaScriptBeforeContentLoaded` | `.injected_java_script_before_content(..)` | `string` | | Se ejecuta antes de los scripts propios de cada página. |
| `userAgent` | `.user_agent(..)` | `string` | | La cadena de user agent del navegador. |
| `javaScriptEnabled` | `.java_script_enabled(..)` | `boolean` | `true` | Las páginas ejecutan scripts. |
| `scrollable` | `.scrollable(..)` | `boolean` | `true` | El usuario puede desplazar la página. |

| Clave de `ios` | Rust | Tipo | Descripción |
|---|---|---|---|
| `allowsBackForwardNavigationGestures` | `.back_forward_gestures(..)` | `boolean` | Desliza desde los bordes para retroceder y avanzar. |

| Clave de `desktop` | Rust | Tipo | Descripción |
|---|---|---|---|
| `allowsBackForwardNavigationGestures` | `.back_forward_gestures(..)` | `boolean` | macOS: desliza con dos dedos en el trackpad para retroceder y avanzar; Windows: desliza en una pantalla táctil; Linux: desliza en el touchpad. |

<a id="events"></a>

## Eventos

| Evento | Rust | Carga útil | Cuándo |
|---|---|---|---|
| `onLoadStart` | `.on_load_start` | `WebViewNavigation` | Una página empezó a cargarse. |
| `onLoad` | `.on_load` | `WebViewNavigation` | Una página terminó de cargarse. |
| `onError` | `.on_error` | `{ message, code? }` (`&str`, el mensaje) | Falló la carga; `code` es `"ERR_ACCESS_DENIED"` para una página o `html` que las capacidades de la app no conceden. |
| `onNavigationStateChange` | `.on_navigation_state_change` | `WebViewNavigation` | Cambió la URL, el título, el estado de carga o el historial. |
| `onMessage` | `.on_message` | `{ data: string }` (`&str`) | La página llamó a `window.nsh.postMessage(data)`. |
| `onDownload` | | `WebViewDownload` | Una descarga comenzó, terminó o falló (macOS). |

`WebViewNavigation` es `{ url, title, loading, canGoBack, canGoForward }`; en Rust, `WebNavigation` con `url`, `title`,
`loading`, `can_go_back` y `can_go_forward`.

`WebViewDownload` es `{ state, id, url, filename, path, bytes?, message? }`: `state` es `"started"`, `"finished"`
(con el `bytes` del archivo) o `"failed"` (con su `message`). Con un listener de `onDownload`, lo que la página descarga
(un adjunto, un tipo que la vista web no muestra, un enlace `download`) se guarda en el directorio de datos de la app como
`downloads/<id>/<filename>`, adonde apunta `path`, y la app lo lee con `fs/promises`.

En macOS, al añadir el listener, cualquier página cargada que permita la capacidad `webview` puede guardar descargas
automáticamente. La app es responsable de su presupuesto de almacenamiento y de eliminar los archivos completados de `downloads/`
cuando termine de usarlos. Al eliminar la vista web se cancelan las descargas en curso y se eliminan sus directorios
parciales. Las descargas se notifican mediante `onDownload`; convertir una navegación en una descarga reserva `onError`
para los fallos de navegación reales. A los nombres de archivo se les eliminan los caracteres de control y los controles de formato bidireccional,
y los nombres largos se acortan a 200 bytes conservando una extensión que quepa.

<a id="ref-methods"></a>

## Métodos de ref

| Método | Rust | Descripción |
|---|---|---|
| `reload()` | `reload()` | Recarga la página. |
| `goBack()` / `goForward()` | `go_back()` / `go_forward()` | Se mueve por el historial de la página. |
| `stopLoading()` | `stop_loading()` | Detiene la carga. |
| `injectJavaScript(script)` | `inject_java_script(script)` | Ejecuta JavaScript en la página. |
| `postMessage(data)` | `post_message(data)` | Envía una cadena a la página, que recibe un evento `message` en `window`. |

<a id="messaging"></a>

## Mensajería

La app y la página intercambian cadenas. La página publica con `window.nsh.postMessage(data)`; la app publica
con el `postMessage(data)` del ref (`post_message(..)` en Rust). Envía JSON para datos estructurados.

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

<a id="capabilities"></a>

## Capacidades

Cuando la app declara [capacidades](../docs/sandbox-and-capabilities.md) en `nsh.json`, una vista web muestra y
navega a los hosts indicados en `webview`. Un `src` en otro host, o `html` en una app sin `webview`, muestra una
vista vacía; una navegación de nivel superior a otro host (un enlace que toca el usuario) se cancela de forma nativa. Cada caso informa de
`onError` con `code` `"ERR_ACCESS_DENIED"`.

```json
{
  "capabilities": {
    "webview": { "hosts": ["example.com", "*.example.com"] }
  }
}
```

<a id="platform-notes"></a>

## Notas por plataforma

- iOS carga WebKit la primera vez que se crea una vista web, por lo que solo supone un coste para la app cuando muestra una.
- En macOS, `onDownload` guarda las descargas con `WKDownload` de WebKit.
- En Android, las llamadas `postMessage` de la página llegan en un hilo en segundo plano y se reenvían a la app en orden.
- Para redondear las esquinas de una vista web, dale un radio de esquina y `overflow: "hidden"` (`.overflow_hidden()`).
