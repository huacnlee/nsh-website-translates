---
title: "WebView"
description: "L'elemento WebView: pagine web e HTML inline all'interno di un'app, con messaggistica bidirezionale."
order: 80
group: primitives
demo: el-web-view
source_hash: 455bf8f5d2ba5a4c
---

# WebView

Una web view mostra una pagina web, oppure l'HTML che le passi, all'interno dell'app: WKWebView su iOS e Mac Catalyst,
`android.webkit.WebView` su Android. Poiché NSH esegue il rendering con view native, una web view si inserisce nel layout come qualsiasi altra
view, nell'ordine rispetto alle view che la circondano. Rust ne crea una con `web_view(url)` o `web_view_html(html, base_url)`, TSX
con `<WebView>` da `nsh`.

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

In TSX una web view accetta uno tra `src` e `html` (vedi la [WebView API](../modules/nsh-webview.md)). La
[guida a web view e video](../docs/web-view-and-video.md) tratta i pattern di messaggistica e le capability.

## Props

Una web view accetta le prop di una [view](./view.md) (non ha figli) più:

| Prop | Rust | Tipo | Predefinito | Descrizione |
|---|---|---|---|---|
| `src` | `web_view(url)` | `string` | | L'URL della pagina da mostrare. |
| `html` | `web_view_html(html, base_url)`, `.html(html, base_url)` | `string` | | HTML inline, mostrato al posto di `src`. |
| `baseUrl` | `base_url` di `web_view_html` / `.html` | `string` | | Il riferimento rispetto al quale vengono risolti i link relativi di `html`. |
| `injectedJavaScript` | `.injected_java_script(..)` | `string` | | Viene eseguito dopo il caricamento di ogni pagina. |
| `injectedJavaScriptBeforeContentLoaded` | `.injected_java_script_before_content(..)` | `string` | | Viene eseguito prima degli script propri di ogni pagina. |
| `userAgent` | `.user_agent(..)` | `string` | | La stringa user agent del browser. |
| `javaScriptEnabled` | `.java_script_enabled(..)` | `boolean` | `true` | Le pagine eseguono script. |
| `scrollable` | `.scrollable(..)` | `boolean` | `true` | L'utente può scorrere la pagina. |

| Chiave `ios` | Rust | Tipo | Descrizione |
|---|---|---|---|
| `allowsBackForwardNavigationGestures` | `.back_forward_gestures(..)` | `boolean` | Scorrimento dai bordi per tornare indietro e avanti. |

| Chiave `desktop` | Rust | Tipo | Descrizione |
|---|---|---|---|
| `allowsBackForwardNavigationGestures` | `.back_forward_gestures(..)` | `boolean` | macOS: scorrimento con due dita sul trackpad per tornare indietro e avanti; Windows: scorrimento su touchscreen; Linux: scorrimento sul touchpad. |

<a id="events"></a>

## Eventi

| Evento | Rust | Payload | Quando |
|---|---|---|---|
| `onLoadStart` | `.on_load_start` | `WebViewNavigation` | Una pagina ha iniziato a caricarsi. |
| `onLoad` | `.on_load` | `WebViewNavigation` | Una pagina ha terminato il caricamento. |
| `onError` | `.on_error` | `{ message, code? }` (`&str`, il messaggio) | Il caricamento non è riuscito; `code` è `"ERR_ACCESS_DENIED"` per una pagina o `html` che le capability dell'app non concedono. |
| `onNavigationStateChange` | `.on_navigation_state_change` | `WebViewNavigation` | L'URL, il titolo, lo stato di caricamento o la cronologia sono cambiati. |
| `onMessage` | `.on_message` | `{ data: string }` (`&str`) | La pagina ha chiamato `window.nsh.postMessage(data)`. |
| `onDownload` | | `WebViewDownload` | Un download è iniziato, terminato o fallito (macOS). |

`WebViewNavigation` è `{ url, title, loading, canGoBack, canGoForward }`; in Rust `WebNavigation` con `url`, `title`,
`loading`, `can_go_back` e `can_go_forward`.

`WebViewDownload` è `{ state, id, url, filename, path, bytes?, message? }`: `state` è `"started"`, `"finished"`
(con il `bytes` del file) oppure `"failed"` (con il relativo `message`). Con un listener `onDownload`, ciò che la pagina scarica
(un allegato, un tipo che la web view non mostra, un link `download`) viene salvato nella directory dei dati dell'app come
`downloads/<id>/<filename>`, dove punta `path`, e l'app lo legge con `fs/promises`.

Su macOS, l'aggiunta del listener consente a qualsiasi pagina caricata e permessa dalla capability `webview` di salvare i download
automaticamente. L'app è responsabile del proprio budget di archiviazione e della rimozione dei file completati da `downloads/`
quando ha finito di usarli. La rimozione della web view annulla i download in corso e rimuove le relative directory
parziali. I download vengono segnalati tramite `onDownload`; la conversione di una navigazione in download mantiene `onError`
per i veri errori di navigazione. Dai nomi dei file vengono rimossi i caratteri di controllo e i controlli di formattazione bidirezionale,
e i nomi lunghi vengono abbreviati a 200 byte preservando un'estensione che rientri nel limite.

<a id="ref-methods"></a>

## Metodi del ref

| Metodo | Rust | Descrizione |
|---|---|---|
| `reload()` | `reload()` | Ricarica la pagina. |
| `goBack()` / `goForward()` | `go_back()` / `go_forward()` | Si sposta nella cronologia della pagina. |
| `stopLoading()` | `stop_loading()` | Interrompe il caricamento. |
| `injectJavaScript(script)` | `inject_java_script(script)` | Esegue JavaScript nella pagina. |
| `postMessage(data)` | `post_message(data)` | Invia una stringa alla pagina, che riceve un evento `message` su `window`. |

<a id="messaging"></a>

## Messaggistica

L'app e la pagina si scambiano stringhe. La pagina invia con `window.nsh.postMessage(data)`; l'app invia
con il `postMessage(data)` del ref (`post_message(..)` in Rust). Invia JSON per i dati strutturati.

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

## Capability

Quando l'app dichiara le [capability](../docs/sandbox-and-capabilities.md) in `nsh.json`, una web view mostra e
naviga verso gli host elencati in `webview`. Un `src` su un altro host, oppure `html` in un'app senza `webview`, mostra una
view vuota; una navigazione di primo livello verso un altro host (un link toccato dall'utente) viene annullata a livello nativo. Ciascuno segnala
`onError` con `code` `"ERR_ACCESS_DENIED"`.

```json
{
  "capabilities": {
    "webview": { "hosts": ["example.com", "*.example.com"] }
  }
}
```

<a id="platform-notes"></a>

## Note sulle piattaforme

- iOS carica WebKit la prima volta che viene creata una web view, quindi ha un costo per l'app solo quando ne mostra una.
- Su macOS `onDownload` salva i download con `WKDownload` di WebKit.
- Su Android le chiamate `postMessage` della pagina arrivano su un thread in background e vengono inoltrate all'app in ordine.
- Per arrotondare gli angoli di una web view, assegnale un raggio degli angoli e `overflow: "hidden"` (`.overflow_hidden()`).
