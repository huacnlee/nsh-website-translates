---
title: "WebView"
description: "Das WebView-Element: Webseiten und Inline-HTML in einer App, mit Nachrichtenaustausch in beide Richtungen."
order: 80
group: primitives
demo: el-web-view
source_hash: 455bf8f5d2ba5a4c
---


# WebView

Eine Web View zeigt eine Webseite oder von dir übergebenes HTML innerhalb der App an: WKWebView auf iOS und Mac Catalyst,
`android.webkit.WebView` auf Android. Da NSH mit nativen Views rendert, sitzt eine Web View wie jede andere View im Layout, in der
Reihenfolge der umgebenden Views. In Rust erzeugst du sie mit `web_view(url)` oder `web_view_html(html, base_url)`, in TSX
mit `<WebView>` aus `nsh`.

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

In TSX nimmt eine Web View entweder `src` oder `html` entgegen (siehe die [WebView API](../modules/nsh-webview.md)). Der
[Leitfaden zu Web View und Video](../docs/web-view-and-video.md) behandelt Messaging-Muster und Capabilities.

## Props

Eine Web View akzeptiert die Props einer [View](./view.md) (sie hat keine Kinder) sowie:

| Prop | Rust | Typ | Standard | Beschreibung |
|---|---|---|---|---|
| `src` | `web_view(url)` | `string` | | Die URL der anzuzeigenden Seite. |
| `html` | `web_view_html(html, base_url)`, `.html(html, base_url)` | `string` | | Inline-HTML, wird anstelle von `src` angezeigt. |
| `baseUrl` | `base_url` von `web_view_html` / `.html` | `string` | | Die Basis, gegen die relative Links in `html` aufgelöst werden. |
| `injectedJavaScript` | `.injected_java_script(..)` | `string` | | Wird nach dem Laden jeder Seite ausgeführt. |
| `injectedJavaScriptBeforeContentLoaded` | `.injected_java_script_before_content(..)` | `string` | | Wird vor den eigenen Skripten jeder Seite ausgeführt. |
| `userAgent` | `.user_agent(..)` | `string` | | Der User-Agent-String des Browsers. |
| `javaScriptEnabled` | `.java_script_enabled(..)` | `boolean` | `true` | Seiten führen Skripte aus. |
| `scrollable` | `.scrollable(..)` | `boolean` | `true` | Der Benutzer kann die Seite scrollen. |

| `ios`-Schlüssel | Rust | Typ | Beschreibung |
|---|---|---|---|
| `allowsBackForwardNavigationGestures` | `.back_forward_gestures(..)` | `boolean` | Von den Rändern wischen, um zurück und vor zu navigieren. |

| `desktop`-Schlüssel | Rust | Typ | Beschreibung |
|---|---|---|---|
| `allowsBackForwardNavigationGestures` | `.back_forward_gestures(..)` | `boolean` | macOS: mit zwei Fingern auf dem Trackpad wischen, um zurück und vor zu navigieren; Windows: auf einem Touchscreen wischen; Linux: auf dem Touchpad wischen. |

<a id="events"></a>

## Ereignisse

| Ereignis | Rust | Payload | Wann |
|---|---|---|---|
| `onLoadStart` | `.on_load_start` | `WebViewNavigation` | Eine Seite hat begonnen zu laden. |
| `onLoad` | `.on_load` | `WebViewNavigation` | Eine Seite hat das Laden abgeschlossen. |
| `onError` | `.on_error` | `{ message, code? }` (`&str`, die Meldung) | Das Laden ist fehlgeschlagen; `code` ist `"ERR_ACCESS_DENIED"` für eine Seite oder `html` für eine, die die Capabilities der App nicht gewähren. |
| `onNavigationStateChange` | `.on_navigation_state_change` | `WebViewNavigation` | Die URL, der Titel, der Ladezustand oder der Verlauf hat sich geändert. |
| `onMessage` | `.on_message` | `{ data: string }` (`&str`) | Die Seite hat `window.nsh.postMessage(data)` aufgerufen. |
| `onDownload` | | `WebViewDownload` | Ein Download wurde gestartet, abgeschlossen oder ist fehlgeschlagen (macOS). |

`WebViewNavigation` ist `{ url, title, loading, canGoBack, canGoForward }`; in Rust `WebNavigation` mit `url`, `title`,
`loading`, `can_go_back` und `can_go_forward`.

`WebViewDownload` ist `{ state, id, url, filename, path, bytes?, message? }`: `state` ist `"started"`, `"finished"`
(mit dem `bytes` der Datei) oder `"failed"` (mit zugehörigem `message`). Mit einem `onDownload`-Listener wird das, was die Seite herunterlädt
(ein Anhang, ein Typ, den die Web View nicht anzeigt, ein `download`-Link), im Datenverzeichnis der App als
`downloads/<id>/<filename>` gespeichert, worauf `path` zeigt, und die App liest es mit `fs/promises`.

Unter macOS erlaubt das Hinzufügen des Listeners jeder geladenen Seite, die durch die Capability `webview` zugelassen ist, Downloads
automatisch zu speichern. Die App ist für ihr Speicherbudget verantwortlich und dafür, abgeschlossene Dateien aus `downloads/` zu entfernen,
sobald sie sie nicht mehr benötigt. Das Entfernen der Web View bricht laufende Downloads ab und entfernt deren partielle
Verzeichnisse. Downloads werden über `onDownload` gemeldet; wird eine Navigation in einen Download umgewandelt, bleibt `onError`
tatsächlichen Navigationsfehlern vorbehalten. Aus Dateinamen werden Steuerzeichen und bidirektionale Formatierungszeichen entfernt,
und lange Namen werden auf 200 Bytes gekürzt, wobei eine passende Dateiendung erhalten bleibt.

<a id="ref-methods"></a>

## Ref-Methoden

| Methode | Rust | Beschreibung |
|---|---|---|
| `reload()` | `reload()` | Lädt die Seite neu. |
| `goBack()` / `goForward()` | `go_back()` / `go_forward()` | Navigiert im Verlauf der Seite. |
| `stopLoading()` | `stop_loading()` | Beendet das Laden. |
| `injectJavaScript(script)` | `inject_java_script(script)` | Führt JavaScript in der Seite aus. |
| `postMessage(data)` | `post_message(data)` | Sendet einen String an die Seite, die ein `message`-Ereignis auf `window` erhält. |

## Messaging

Die App und die Seite tauschen Strings aus. Die Seite sendet mit `window.nsh.postMessage(data)`; die App sendet
mit der `postMessage(data)` der Ref (`post_message(..)` in Rust). Sende JSON für strukturierte Daten.

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

Wenn die App [Capabilities](../docs/sandbox-and-capabilities.md) in `nsh.json` deklariert, zeigt eine Web View die unter `webview` aufgeführten Hosts an und
navigiert dorthin. Ein `src` auf einem anderen Host oder `html` in einer App ohne `webview` zeigt eine
leere View; eine Top-Level-Navigation zu einem anderen Host (ein Link, den der Benutzer antippt) wird nativ abgebrochen. Jeder dieser Fälle meldet
`onError` mit `code` `"ERR_ACCESS_DENIED"`.

```json
{
  "capabilities": {
    "webview": { "hosts": ["example.com", "*.example.com"] }
  }
}
```

<a id="platform-notes"></a>

## Hinweise zu Plattformen

- iOS lädt WebKit erst, wenn zum ersten Mal eine Web View erstellt wird; es kostet eine App also nur dann etwas, wenn sie eine anzeigt.
- Unter macOS speichert `onDownload` Downloads mit WebKits `WKDownload`.
- Unter Android treffen die `postMessage`-Aufrufe der Seite in einem Hintergrund-Thread ein und werden der Reihe nach an die App weitergeleitet.
- Um die Ecken einer Web View abzurunden, gib ihr einen Eckenradius und `overflow: "hidden"` (`.overflow_hidden()`).
