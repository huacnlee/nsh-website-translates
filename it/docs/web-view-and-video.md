---
title: "Web view e video"
description: "Visualizzazione di pagine web con WebView e riproduzione di video con Video - sorgenti, messaggistica tra la pagina e l'app, navigazione, controllo della riproduzione, ref e capacità."
order: 45
group: ui
source_hash: f15d6d5032c41887
---

# Web view e video

La web view e il video player incorporano il motore web e il media player della piattaforma come normali view: `web_view` e `video` in Rust (`nsh_core::prelude`), `WebView` e `Video` da `nsh` in TSX. Poiché NSH esegue il rendering con view native, si inseriscono nel layout come qualsiasi altro elemento: scorrono con la view genitore, accettano angoli arrotondati e clipping, e altre view possono sovrapporsi a esse senza problemi di stratificazione.

| Componente | iOS | Android | macOS | Linux | Windows |
|---|---|---|---|---|---|
| `WebView` | WKWebView | `android.webkit.WebView` | WKWebView | `WebKitWebView` di WebKitGTK 6.0 | WebView2, in una finestra figlia |
| `Video` | AVPlayerLayer; AVPlayerViewController con `controls` | MediaPlayer su una TextureView; MediaController con `controls` | AVPlayerLayer; AVPlayerView di AVKit con `controls` | media stream di GTK (GStreamer) in un `GtkPicture`; `GtkVideo` con `controls` | media engine di Media Foundation, con i frame disegnati tramite Direct2D; la control bar di NSH con `controls` |

I framework alla base (WebKit, AVFoundation) vengono caricati la prima volta che un'app ne usa uno, quindi le app che non mostrano mai una pagina web o un video non ne pagano il costo all'avvio.

Su [macOS](./macos.md) la web view non ha una scroll view propria: con `scrollable={false}` la rotellina del mouse e il
trackpad fanno scorrere le scroll view dell'app attorno alla pagina invece della pagina stessa, che continua a scorrere con la tastiera e con
i propri script.

Su [Linux](./linux.md) una web view è una pagina WebKitGTK disegnata all'interno della propria view: i contenuti NSH sopra di essa (un dialog, una sheet)
la coprono, e le view genitore la ritagliano. La capability `webview` si applica anche alle navigazioni dei frame (un
`iframe` di un host non consentito resta vuoto), e `scrollable: false` impedisce alla pagina stessa di scorrere
(gli elementi al suo interno continuano a scorrere). Le app richiedono WebKitGTK 6.0 installato; un runtime compilato senza di esso mostra un
placeholder neutro. I video riproducono i formati che i plugin GStreamer installati sanno decodificare; `rate` non è supportato (vengono
riprodotti a 1×), e `onEnd` è disponibile solo per i video che non sono in loop.

Su [Windows](./windows.md) una web view è un controllo WebView2 in una finestra figlia che segue la propria view: viene ritagliata dalle view genitore e dagli
angoli arrotondati, ma i contenuti NSH disegnati sopra di essa (un dialog, una sheet) restano sotto. Richiede il
WebView2 Runtime (incluso in Windows 11; installato con Edge su Windows 10), altrimenti mostra un placeholder;
`baseUrl` per HTML, `scrollable` e `allowsBackForwardNavigationGestures` non sono supportati. I video sono
contenuti ordinari (ritagliati, trasformati e coperti come qualsiasi view) e riproducono i formati che i codec di Media Foundation
installati sanno decodificare; `rate` funziona, non c'è il poster, e la control bar è sempre visibile finché `controls` è attivo.

## WebView

```rust tabs
use nsh_core::prelude::*;

#[component]
pub fn App() -> impl IntoElement {
    web_view("https://en.m.wikipedia.org/wiki/Swift_(programming_language)").flex_1()
}
```

```tsx tabs
import { mount, WebView } from "nsh";

function App() {
  return <WebView src="https://en.m.wikipedia.org/wiki/Swift_(programming_language)" style={{ flex: 1 }} />;
}

mount(App);
```

<a id="sources"></a>

### Sorgenti

Una web view mostra una tra `src` e `html`:

| Props | Mostra |
|---|---|
| `src="https://…"` | Una pagina web. |
| `html="<!doctype html>…"` | HTML da una stringa, mostrato al posto di `src`. |
| `html` con `baseUrl="https://example.com/"` | HTML i cui URL relativi vengono risolti rispetto a `baseUrl`. |

In Rust, `web_view(url)` mostra una pagina e `web_view_html(html, base_url)` mostra HTML (`base_url` un `Option<&str>`); l'URL e l'HTML possono essere un signal o una closure, che ricarica la pagina quando ciò che legge cambia. Cambiare `src` o `html` carica la nuova pagina.

### Props

In Rust ogni prop è un metodo builder in snake case (`injected_java_script`, `java_script_enabled`, `scrollable`, `user_agent`; `injected_java_script_before_content` per `injectedJavaScriptBeforeContentLoaded`, `back_forward_gestures` per `allowsBackForwardNavigationGestures` di iOS) e ogni evento un metodo `on_…` (`on_navigation_state_change`) il cui listener riceve un `WebNavigation` (`url`, `title`, `loading`, `can_go_back`, `can_go_forward`) oppure, per `on_error` e `on_message`, un `&str`.

| Prop | Tipo | Default | Descrizione |
|---|---|---|---|
| `src` | `string` | | L'URL della pagina da mostrare. |
| `html` | `string` | | HTML inline, mostrato al posto di `src`. |
| `baseUrl` | `string` | | Rispetto a cosa vengono risolti gli URL relativi di `html`. |
| `injectedJavaScript` | `string` | | Viene eseguito dopo il caricamento di ogni pagina. |
| `injectedJavaScriptBeforeContentLoaded` | `string` | | Viene eseguito prima degli script di ogni pagina. |
| `javaScriptEnabled` | `boolean` | `true` | Le pagine eseguono script. |
| `scrollable` | `boolean` | `true` | L'utente può far scorrere la pagina. |
| `userAgent` | `string` | | La stringa user agent del browser. |
| `ios={{ allowsBackForwardNavigationGestures }}` | `boolean` | | iOS: scorri per andare indietro e avanti nella cronologia della pagina. |
| `desktop={{ allowsBackForwardNavigationGestures }}` | `boolean` | | macOS: scorri con due dita sul trackpad per andare indietro e avanti; Windows: scorri su un touchscreen; Linux: scorri sul touchpad. |

Eventi:

| Evento | Payload | Quando |
|---|---|---|
| `onLoadStart` | `WebViewNavigation` | Una pagina ha iniziato a caricarsi. |
| `onLoad` | `WebViewNavigation` | Una pagina ha finito di caricarsi. |
| `onError` | `{ message }` | Il caricamento non è riuscito. |
| `onNavigationStateChange` | `WebViewNavigation` | L'URL, il titolo, lo stato di caricamento o la cronologia sono cambiati. |
| `onMessage` | `{ data: string }` | La pagina ha inviato un messaggio (sotto). |

`WebViewNavigation` è `{ url, title, loading, canGoBack, canGoForward }`.

<a id="a-browser-with-back-and-forward"></a>

### Un browser con indietro e avanti

Il ref della web view (un `element_ref()` applicato con `.element_ref(&web)` in Rust, `ref` in TSX) ha `reload`, `go_back` / `goBack`, `go_forward` / `goForward`, `stop_loading` / `stopLoading`, `inject_java_script` / `injectJavaScript(script)`, `post_message` / `postMessage(data)` e `send_input` / `sendInput(input)` ([sotto](#input-as-the-users-own)):

```rust tabs
use nsh_core::prelude::*;

pub fn browser() -> impl IntoElement {
    let web = element_ref();
    let nav = signal(None::<WebNavigation>);
    let button = move |label: &'static str, enabled: fn(&WebNavigation) -> bool, action: fn(&ElementRef)| {
        let enabled = move || nav.with(|n| n.as_ref().is_some_and(enabled));
        text(label)
            .p(px(12.0))
            .text_color(move || if enabled() { rgb(0x0969da) } else { rgb(0x8c959f) })
            .disabled(move || !enabled())
            .on_press(move || action(&web))
    };
    view()
        .flex_1()
        .pt(px(50.0))
        .child(
            text(move || {
                nav.with(|n| match n {
                    Some(n) if n.loading => "Loading…".to_owned(),
                    Some(n) => n.title.clone(),
                    None => String::new(),
                })
            })
            .number_of_lines(1)
            .px(px(12.0))
            .text_color(rgb(0x57606a)),
        )
        .child(
            web_view("https://developer.mozilla.org/")
                .element_ref(&web)
                .flex_1()
                .on_navigation_state_change(move |n: &WebNavigation| nav.set(Some(n.clone())))
                .back_forward_gestures(true),
        )
        .child(
            view()
                .flex_row()
                .justify_around()
                .child(button("Back", |n| n.can_go_back, |web| web.go_back()))
                .child(button("Forward", |n| n.can_go_forward, |web| web.go_forward()))
                .child(button("Reload", |_| true, |web| web.reload())),
        )
}
```

```tsx tabs
import { mount, signal, Text, View, WebView, type WebViewNavigation, type WebViewRef } from "nsh";

function Browser() {
  let web!: WebViewRef;
  const nav = signal<WebViewNavigation | null>(null);
  const button = (label: string, enabled: boolean, action: () => void) => (
    <Text onPress={enabled ? action : undefined} style={{ padding: 12, color: enabled ? "#0969da" : "#8c959f" }}>
      {label}
    </Text>
  );
  return (
    <View style={{ flex: 1, paddingTop: 50 }}>
      <Text style={{ numberOfLines: 1, paddingHorizontal: 12, color: "#57606a" }}>
        {nav()?.loading ? "Loading…" : nav()?.title ?? ""}
      </Text>
      <WebView
        ref={web}
        src="https://developer.mozilla.org/"
        style={{ flex: 1 }}
        onNavigationStateChange={(n) => nav.set(n)}
        ios={{ allowsBackForwardNavigationGestures: true }}
      />
      <View style={{ flexDirection: "row", justifyContent: "space-around" }}>
        {button("Back", !!nav()?.canGoBack, () => web.goBack())}
        {button("Forward", !!nav()?.canGoForward, () => web.goForward())}
        {button("Reload", true, () => web.reload())}
      </View>
    </View>
  );
}

mount(Browser);
```

<a id="messaging-between-the-page-and-the-app"></a>

### Messaggi tra la pagina e l'app

Le pagine comunicano con l'app tramite `window.nsh.postMessage(string)`, che arriva come `on_message` (`onMessage`). L'app comunica con la pagina tramite `post_message` del ref (`postMessage(string)`), che arriva nella pagina come evento `message` su `window`. I messaggi sono stringhe; invia JSON per i dati strutturati.

```rust tabs
use nsh_core::prelude::*;

const PAGE: &str = r#"<!doctype html>
<html><head><meta name="viewport" content="width=device-width"></head>
<body style="font-family: -apple-system, sans-serif; margin: 16px">
  <button onclick="window.nsh.postMessage(JSON.stringify({ type: 'hello', at: Date.now() }))">
    Post to the app
  </button>
  <p id="got">Nothing from the app yet.</p>
  <script>
    window.addEventListener("message", (e) => {
      document.getElementById("got").textContent = "The app says: " + e.data;
    });
  </script>
</body></html>"#;

#[component]
pub fn App() -> impl IntoElement {
    let web = element_ref();
    let last = signal(String::new());
    view()
        .flex_1()
        .pt(px(50.0))
        .gap(px(12.0))
        .child(
            web_view_html(PAGE, None)
                .element_ref(&web)
                .h(px(240.0))
                .on_message(move |data: &str| {
                    let message: serde_json::Value = serde_json::from_str(data).unwrap_or_default();
                    last.set(message["type"].as_str().unwrap_or_default().to_owned());
                }),
        )
        .child(
            text("Post to the page")
                .p(px(16.0))
                .text_color(rgb(0x0969da))
                .on_press(move || web.post_message("hi from nsh")),
        )
        .child(text(move || format!("Last message: {}", last.get())).px(px(16.0)))
}
```

```tsx tabs
import { mount, signal, Text, View, WebView, type WebViewRef } from "nsh";

const page = `<!doctype html>
<html><head><meta name="viewport" content="width=device-width"></head>
<body style="font-family: -apple-system, sans-serif; margin: 16px">
  <button onclick="window.nsh.postMessage(JSON.stringify({ type: 'hello', at: Date.now() }))">
    Post to the app
  </button>
  <p id="got">Nothing from the app yet.</p>
  <script>
    window.addEventListener("message", (e) => {
      document.getElementById("got").textContent = "The app says: " + e.data;
    });
  </script>
</body></html>`;

function App() {
  let web!: WebViewRef;
  const last = signal("");
  return (
    <View style={{ flex: 1, paddingTop: 50, gap: 12 }}>
      <WebView
        ref={web}
        html={page}
        style={{ height: 240 }}
        onMessage={(e) => last.set(JSON.parse(e.data).type)}
      />
      <Text onPress={() => web.postMessage("hi from nsh")} style={{ padding: 16, color: "#0969da" }}>
        Post to the page
      </Text>
      <Text style={{ paddingHorizontal: 16 }}>Last message: {last()}</Text>
    </View>
  );
}

mount(App);
```

`inject_java_script` del ref (`injectJavaScript(script)`) esegue codice nella pagina corrente in qualsiasi momento; `injected_java_script` e `injected_java_script_before_content` (`injectedJavaScript`, `injectedJavaScriptBeforeContentLoaded`) vengono eseguiti a ogni caricamento di pagina, prima o dopo gli script della pagina stessa, ed è il posto giusto per installare gli hook:

```rust tabs
web_view("https://example.com")
    .injected_java_script_before_content("window.isNativeApp = true;")
    .injected_java_script("window.nsh.postMessage(document.title);")
    .on_message(|title: &str| log::info!("title {title}"))
```

```tsx tabs
<WebView
  src="https://example.com"
  injectedJavaScriptBeforeContentLoaded={`window.isNativeApp = true;`}
  injectedJavaScript={`window.nsh.postMessage(document.title);`}
  onMessage={(e) => console.log("title", e.data)}
/>
```

<a id="input-as-the-users-own"></a>

### Input come se fosse dell'utente

`injectJavaScript` può creare solo eventi sintetici, che una pagina vede come non attendibili (`event.isTrusted` è `false`) e che alcuni widget ignorano. `send_input` del ref (`sendInput(input)`) fornisce alla pagina un input come se provenisse dalle mani dell'utente, quindi i suoi eventi sono attendibili:

- `{ type: "click", x, y }` clicca un punto del viewport, in pixel CSS (quelli riportati da `getBoundingClientRect()`).
- `{ type: "text", text }` digita il testo in ciò che ha il focus della pagina, un tasto alla volta: ogni carattere sul tasto corrispondente del layout US, un a capo come Enter, e ciò che nessun tasto US digita (`é`, CJK, emoji) su nessun tasto (`code` è `"Unidentified"`).
- `{ type: "key", key }` preme `Enter`, `Tab`, `Escape` o `Backspace`.

```rust tabs
use nsh_core::{WebInput, WebKey, prelude::*};
use std::time::Duration;

fn search(web: &ElementRef) {
    web.send_input(WebInput::Click { x: px(120.0), y: px(40.0) });
    let web = *web;
    set_timeout(Duration::from_millis(50), move || {
        web.send_input(WebInput::Text("espresso".into()));
        web.send_input(WebInput::Key(WebKey::Enter));
    });
}
```

```tsx tabs
web.sendInput({ type: "click", x: 120, y: 40 });
setTimeout(() => {
  web.sendInput({ type: "text", text: "espresso" });
  web.sendInput({ type: "key", key: "Enter" });
}, 50);
```

In Rust sono `WebInput::Click { x, y }`, `WebInput::Text(text)` e `WebInput::Key(WebKey::Enter)`.

L'input attendibile porta con sé l'attivazione utente (può aprire finestre, scrivere negli appunti, aprire il pannello file del sistema o premere il pulsante di conferma di una pagina), quindi è una capability a sé: l'app ha bisogno di `"webview": { "input": true }` in `capabilities` di `nsh.json` ([`webview`](./sandbox-and-capabilities.md#webview)), anche quando non ne dichiara nessuna, altrimenti il core scarta la chiamata.

Come un click, `sendInput` sposta il focus della tastiera sulla web view, togliendolo al `Input` dell'app. La pagina gestisce l'input con i propri tempi: gli eventi di un click possono essere ancora in arrivo quando inizia la chiamata successiva, quindi lascia che un click si assesti (circa un frame) prima di digitare dopo di esso. macOS consegna l'input; le altre piattaforme per ora lo ignorano.

Prima di offrire qualcosa che ne dipende, verifica se funziona sulla piattaforma corrente: `web_input_available()` (`WebView.inputAvailable()`) risolve `true` solo dove la piattaforma consegna l'input e l'app possiede `webview.input`, quindi è `false` sulle piattaforme che ignorano la chiamata e nelle app senza il grant.

```rust tabs
use nsh_core::prelude::*;

let input = signal(false);
spawn(async move { input.set(web_input_available().await) });
```

```tsx tabs
import { signal, WebView } from "nsh";

const input = signal(false);
WebView.inputAvailable().then((available) => input.set(available));
```

<a id="which-sites-a-web-view-may-show"></a>

### Quali siti può mostrare una web view

Se il tuo `nsh.json` dichiara `"capabilities"`, una web view può mostrare e navigare solo verso gli host elencati in `webview`:

```json
{
  "capabilities": {
    "webview": { "hosts": ["example.com", "*.example.com"] }
  }
}
```

Il controllo copre `src` della web view e ogni navigazione di primo livello compiuta dalla pagina (link, redirect, modifiche di `location`); viene deciso in modo nativo quando la piattaforma chiede se una navigazione può procedere. Le sottorisorse della pagina (script, immagini, frame) sono affare del contenuto web e non vengono controllate. `*.example.com` corrisponde solo ai sottodomini; elenca anche `example.com` per il dominio senza sottodominio. Un'app senza la chiave `"capabilities"` può mostrare qualsiasi pagina. Vedi [Sandbox e capability](./sandbox-and-capabilities.md).

## Video

```rust tabs
use nsh_core::prelude::*;

pub fn player() -> impl IntoElement {
    let player = element_ref();
    let paused = signal(true);
    let time = signal(String::new());
    let link = |label: &'static str| text(label).text_color(rgb(0x0969da));
    view()
        .flex_1()
        .justify_center()
        .p(px(16.0))
        .gap(px(12.0))
        .child(
            video("https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4")
                .element_ref(&player)
                .paused(paused)
                .repeat(true)
                .object_fit(ResizeMode::Contain)
                .h(px(220.0))
                .rounded(px(12.0))
                .overflow_hidden()
                .bg(rgb(0x000000))
                .on_progress(move |e: &VideoProgress| {
                    time.set(format!("{:.1} / {:.1} s", e.current_time, e.duration))
                })
                .on_end(move || paused.set(true)),
        )
        .child(
            view()
                .flex_row()
                .gap(px(16.0))
                .items_center()
                .child(
                    text(move || if paused.get() { "Play" } else { "Pause" })
                        .text_color(rgb(0x0969da))
                        .font_weight(FontWeight::SEMIBOLD)
                        .on_press(move || paused.update(|p| *p = !*p)),
                )
                .child(link("Restart").on_press(move || player.seek(0.0)))
                .child(text(move || time.get()).text_color(rgb(0x57606a))),
        )
}
```

```tsx tabs
import { mount, signal, Text, Video, type VideoRef, View } from "nsh";

function Player() {
  let video!: VideoRef;
  const paused = signal(true);
  const time = signal("");
  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 16, gap: 12 }}>
      <Video
        ref={video}
        src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
        paused={paused()}
        repeat
        style={{ height: 220, borderRadius: 12, overflow: "hidden", backgroundColor: "#000000" }}
        onProgress={(e) => time.set(`${e.currentTime.toFixed(1)} / ${e.duration.toFixed(1)} s`)}
        onEnd={() => paused.set(true)}
      />
      <View style={{ flexDirection: "row", gap: 16, alignItems: "center" }}>
        <Text onPress={() => paused.set(!paused())} style={{ color: "#0969da", fontWeight: "600" }}>
          {paused() ? "Play" : "Pause"}
        </Text>
        <Text onPress={() => video.seek(0)} style={{ color: "#0969da" }}>
          Restart
        </Text>
        <Text style={{ color: "#57606a" }}>{time()}</Text>
      </View>
    </View>
  );
}

mount(Player);
```

La riproduzione è controllata dalle prop: imposta `paused`, `muted`, `volume` e `rate` da signal e il player li segue. Il ref ha `seek(seconds)`.

In Rust, `video(url)` crea il player (l'URL è un valore, un signal o una closure) e ogni prop è un metodo builder in snake case (`paused`, `repeat(true)`, `object_fit(ResizeMode::Contain)` (lo stile `objectFit`), `progress_interval` per `progressUpdateInterval`); `on_load` riceve un `VideoInfo` (`duration`, `size`), `on_progress` un `VideoProgress` (`current_time`, `duration`) e `on_buffer` un `bool`.

| Prop | Tipo | Default | Descrizione |
|---|---|---|---|
| `src` | `string` | | L'URL del video. |
| `paused` | `boolean` | `false` | La riproduzione è in pausa. |
| `muted` | `boolean` | `false` | Nessun audio. |
| `volume` | `number` | `1` | 0..1. |
| `rate` | `number` | `1` | La velocità di riproduzione. |
| `repeat` | `boolean` | `false` | Alla fine riparte dall'inizio. |
| `objectFit` (style), classi `object-*` | `"cover" \| "contain" \| "fill" \| "none" \| "scale-down"` | `"contain"` | Come l'immagine si adatta alla view, come `object-fit` di CSS (`class="object-cover"`). |
| `controls` | `boolean` | `false` | I controlli di riproduzione della piattaforma. |
| `progressUpdateInterval` | `number` | `250` | Millisecondi tra gli eventi `onProgress`. |

| Evento | Payload | Quando |
|---|---|---|
| `onLoadStart` | | Il caricamento è iniziato. |
| `onLoad` | `{ duration, size }` | Il video è pronto: durata in secondi e dimensioni. |
| `onProgress` | `{ currentTime, duration }` | Durante la riproduzione, ogni `progressUpdateInterval` ms. |
| `onBuffer` | `{ isBuffering }` | La riproduzione si è bloccata in attesa di dati, oppure è ripresa. |
| `onEnd` | | La riproduzione è arrivata alla fine. |
| `onError` | `{ message }` | Caricamento o riproduzione non riusciti. |

Con `controls`, la piattaforma disegna il proprio pulsante play, lo scrubber e il pulsante a schermo intero. Senza, disegna i tuoi con view sopra o sotto il video; poiché il video è una view nativa nel tuo layout, gli overlay funzionano in modo naturale:

```rust tabs
view()
    .h(px(220.0))
    .child(video(url).paused(paused).flex_1())
    .child(
        view()
            .absolute()
            .inset_0()
            .items_center()
            .justify_center()
            .on_press(move || paused.update(|p| *p = !*p))
            .child(when(move || paused.get(), || {
                text("▶").text_size(px(48.0)).text_color(rgb(0xffffff))
            })),
    )
```

```tsx tabs
<View style={{ height: 220 }}>
  <Video src={url} paused={paused()} style={{ flex: 1 }} />
  <View
    onPress={() => paused.set(!paused())}
    style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center" }}
  >
    <If when={paused()}>
      <Text style={{ fontSize: 48, color: "#ffffff" }}>▶</Text>
    </If>
  </View>
</View>
```

Le sorgenti video sono richieste di rete: con le capability dichiarate, l'host del video deve essere consentito in `network` di `nsh.json`, come per `fetch` e le immagini remote. Una sorgente rifiutata non mostra nulla, e il rifiuto viene registrato nel log una sola volta, con la chiave da aggiungere.

<a id="related"></a>

## Correlati

- [`WebView`](../elements/web-view.md) e [`Video`](../elements/video.md): i riferimenti agli elementi.
- [Sandbox e capability](./sandbox-and-capabilities.md): i grant `webview` e `network`.
- [Componenti nativi](./native-components.md): incorporare altre view native fornite dalla tua app host.
