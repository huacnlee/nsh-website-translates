---
title: "Web View und Video"
description: "Webseiten mit WebView anzeigen und Videos mit Video abspielen – Quellen, Nachrichtenaustausch zwischen Seite und App, Navigation, Wiedergabesteuerung, Refs und Capabilities."
order: 45
group: ui
source_hash: f15d6d5032c41887
---


# Web View und Video

Die Web View und der Videoplayer binden die Web-Engine und den Media Player der Plattform als gewöhnliche Views ein: `web_view` und `video` in Rust (`nsh_core::prelude`), `WebView` und `Video` aus `nsh` in TSX. Da NSH mit nativen Views rendert, liegen sie wie jedes andere Element in deinem Layout: Sie scrollen mit ihrem Parent, unterstützen abgerundete Ecken und Clipping, und andere Views können sie überlagern, ohne dass Probleme mit der Ebenenreihenfolge auftreten.

| Komponente | iOS | Android | macOS | Linux | Windows |
|---|---|---|---|---|---|
| `WebView` | WKWebView | `android.webkit.WebView` | WKWebView | `WebKitWebView` von WebKitGTK 6.0 | WebView2, in einem untergeordneten Fenster |
| `Video` | AVPlayerLayer; AVPlayerViewController mit `controls` | MediaPlayer auf einer TextureView; MediaController mit `controls` | AVPlayerLayer; AVPlayerView von AVKit mit `controls` | GTKs Media Stream (GStreamer) in einem `GtkPicture`; `GtkVideo` mit `controls` | Media Engine von Media Foundation, Frames mit Direct2D gezeichnet; NSHs eigene Steuerleiste mit `controls` |

Die Frameworks dahinter (WebKit, AVFoundation) werden erst geladen, wenn eine App zum ersten Mal eines davon verwendet. Apps, die nie eine Webseite oder ein Video anzeigen, zahlen daher beim Start nichts dafür.

Unter [macOS](./macos.md) hat die Web View keine eigene Scroll View: Mit `scrollable={false}` scrollen das Mausrad und das Trackpad stattdessen die Scroll Views der App rund um die Web View und nicht die Seite, die weiterhin mit der Tastatur und ihren eigenen Skripten scrollt.

Unter [Linux](./linux.md) ist eine Web View eine WebKitGTK-Seite, die innerhalb ihrer View gezeichnet wird: NSH-Inhalte darüber (ein Dialog, ein Sheet) verdecken sie, und ihre Parents schneiden sie ab. Die Capability `webview` gilt dort auch für die Navigationen von Frames (ein `iframe` eines Hosts, der nicht freigegeben ist, bleibt leer), und `scrollable: false` verhindert, dass die Seite selbst scrollt (Elemente darin scrollen weiterhin). Apps benötigen eine installierte WebKitGTK-6.0-Version; eine Laufzeitumgebung, die ohne sie gebaut wurde, zeigt einen neutralen Platzhalter. Videos spielen die Formate ab, welche die installierten GStreamer-Plugins dekodieren; `rate` wird nicht unterstützt (sie laufen mit 1×), und `onEnd` gibt es nur für Videos, die nicht in einer Schleife laufen.

Unter [Windows](./windows.md) ist eine Web View ein WebView2-Control in einem untergeordneten Fenster, das ihrer View folgt: Es wird an seinen Parents und abgerundeten Ecken abgeschnitten, aber NSH-Inhalte, die darüber gezeichnet werden (ein Dialog, ein Sheet), bleiben darunter. Es benötigt die WebView2 Runtime (Teil von Windows 11; unter Windows 10 mit Edge installiert), sonst zeigt es einen Platzhalter; `baseUrl` für HTML, `scrollable` und `allowsBackForwardNavigationGestures` werden nicht unterstützt. Videos sind gewöhnliche Inhalte (abgeschnitten, transformiert und verdeckt wie jede View) und spielen die Formate ab, welche die installierten Media-Foundation-Codecs dekodieren; `rate` funktioniert, es gibt kein Posterbild, und die Steuerleiste wird immer angezeigt, solange `controls` aktiv ist.

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

### Quellen

Eine Web View zeigt entweder `src` oder `html`:

| Props | Zeigt |
|---|---|
| `src="https://…"` | Eine Webseite. |
| `html="<!doctype html>…"` | HTML aus einem String, anstelle von `src` angezeigt. |
| `html` mit `baseUrl="https://example.com/"` | HTML, dessen relative URLs gegen `baseUrl` aufgelöst werden. |

In Rust zeigt `web_view(url)` eine Seite und `web_view_html(html, base_url)` HTML (`base_url` ein `Option<&str>`); die URL und das HTML können ein Signal oder eine Closure sein, wodurch die Seite erneut geladen wird, wenn sich das Gelesene ändert. Eine Änderung von `src` oder `html` lädt die neue Seite.

### Props

In Rust ist jede Prop eine Builder-Methode in Snake Case (`injected_java_script`, `java_script_enabled`, `scrollable`, `user_agent`; `injected_java_script_before_content` für `injectedJavaScriptBeforeContentLoaded`, `back_forward_gestures` für `allowsBackForwardNavigationGestures` unter iOS) und jedes Event eine `on_…`-Methode (`on_navigation_state_change`), deren Listener ein `WebNavigation` erhält (`url`, `title`, `loading`, `can_go_back`, `can_go_forward`) oder, für `on_error` und `on_message`, ein `&str`.

| Prop | Typ | Standard | Beschreibung |
|---|---|---|---|
| `src` | `string` | | Die URL der anzuzeigenden Seite. |
| `html` | `string` | | Inline-HTML, anstelle von `src` angezeigt. |
| `baseUrl` | `string` | | Wogegen die relativen URLs von `html` aufgelöst werden. |
| `injectedJavaScript` | `string` | | Läuft nach dem Laden jeder Seite. |
| `injectedJavaScriptBeforeContentLoaded` | `string` | | Läuft vor den eigenen Skripten jeder Seite. |
| `javaScriptEnabled` | `boolean` | `true` | Seiten führen Skripte aus. |
| `scrollable` | `boolean` | `true` | Der Benutzer kann die Seite scrollen. |
| `userAgent` | `string` | | Der User-Agent-String des Browsers. |
| `ios={{ allowsBackForwardNavigationGestures }}` | `boolean` | | iOS: Wischen, um im Seitenverlauf vor- und zurückzugehen. |
| `desktop={{ allowsBackForwardNavigationGestures }}` | `boolean` | | macOS: Mit zwei Fingern auf dem Trackpad wischen, um vor- und zurückzugehen; Windows: auf einem Touchscreen wischen; Linux: auf dem Touchpad wischen. |

Events:

| Event | Payload | Wann |
|---|---|---|
| `onLoadStart` | `WebViewNavigation` | Eine Seite hat zu laden begonnen. |
| `onLoad` | `WebViewNavigation` | Eine Seite wurde fertig geladen. |
| `onError` | `{ message }` | Das Laden ist fehlgeschlagen. |
| `onNavigationStateChange` | `WebViewNavigation` | Die URL, der Titel, der Ladezustand oder der Verlauf hat sich geändert. |
| `onMessage` | `{ data: string }` | Die Seite hat eine Nachricht gesendet (siehe unten). |

`WebViewNavigation` ist `{ url, title, loading, canGoBack, canGoForward }`.

<a id="a-browser-with-back-and-forward"></a>

### Ein Browser mit Zurück und Vor

Die Ref der Web View (ein `element_ref()`, das in Rust mit `.element_ref(&web)` und in TSX mit `ref` darauf gesetzt wird) hat `reload`, `go_back` / `goBack`, `go_forward` / `goForward`, `stop_loading` / `stopLoading`, `inject_java_script` / `injectJavaScript(script)`, `post_message` / `postMessage(data)` und `send_input` / `sendInput(input)` ([siehe unten](#input-as-the-users-own)):

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

### Nachrichten zwischen Seite und App

Seiten kommunizieren mit der App über `window.nsh.postMessage(string)`, was als `on_message` ankommt (`onMessage`). Die App kommuniziert mit der Seite über `post_message` der Ref (`postMessage(string)`), was in der Seite als `message`-Event auf `window` ankommt. Nachrichten sind Strings; sende JSON für strukturierte Daten.

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

`inject_java_script` der Ref (`injectJavaScript(script)`) führt jederzeit Code in der aktuellen Seite aus; `injected_java_script` und `injected_java_script_before_content` (`injectedJavaScript`, `injectedJavaScriptBeforeContentLoaded`) laufen bei jedem Laden einer Seite, vor oder nach den eigenen Skripten der Seite, und eignen sich daher zum Installieren von Hooks:

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

### Eingaben wie vom Benutzer selbst

`injectJavaScript` kann nur synthetische Events erzeugen, die eine Seite als nicht vertrauenswürdig ansieht (`event.isTrusted` ist `false`) und die manche Widgets ignorieren. `send_input` der Ref (`sendInput(input)`) gibt der Seite Eingaben, als kämen sie von den eigenen Händen des Benutzers, sodass ihre Events vertrauenswürdig sind:

- `{ type: "click", x, y }` klickt auf einen Punkt des Viewports, in CSS-Pixeln (was `getBoundingClientRect()` liefert).
- `{ type: "text", text }` tippt den Text in das Element, das den Fokus der Seite hat, Taste für Taste: jedes Zeichen auf der Taste des US-Layouts dafür, einen Zeilenumbruch als Enter, und was keine US-Taste tippt (`é`, CJK, Emoji) auf keiner Taste (`code` ist `"Unidentified"`).
- `{ type: "key", key }` drückt `Enter`, `Tab`, `Escape` oder `Backspace`.

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

In Rust heißen diese `WebInput::Click { x, y }`, `WebInput::Text(text)` und `WebInput::Key(WebKey::Enter)`.

Vertrauenswürdige Eingaben tragen eine Benutzeraktivierung (sie dürfen Fenster öffnen, die Zwischenablage beschreiben, den Dateidialog des Systems öffnen oder den Bestätigungsbutton einer Seite drücken) und sind deshalb eine eigene Capability: Die App benötigt `"webview": { "input": true }` in `capabilities` von `nsh.json` ([`webview`](./sandbox-and-capabilities.md#webview)), auch wenn sie keine deklariert, und der Core verwirft den Aufruf andernfalls.

Wie ein Klick holt `sendInput` den Tastaturfokus für die Web View und nimmt ihn dem `Input` der App. Die Seite verarbeitet Eingaben nach ihrem eigenen Zeitplan: Die Events eines Klicks können noch unterwegs sein, wenn der nächste Aufruf beginnt, also lass einen Klick sich setzen (etwa einen Frame), bevor du danach tippst. macOS liefert die Eingabe aus; die anderen Plattformen ignorieren sie vorerst.

Bevor du etwas anbietest, das davon abhängt, frage ab, ob es hier funktioniert: `web_input_available()` (`WebView.inputAvailable()`) liefert nur dann `true`, wenn die Plattform die Eingabe ausliefert und die App `webview.input` besitzt; es ist also `false` auf Plattformen, die den Aufruf ignorieren, und in Apps ohne die Freigabe.

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

### Welche Seiten eine Web View anzeigen darf

Wenn deine `nsh.json` `"capabilities"` deklariert, darf eine Web View nur die unter `webview` aufgeführten Hosts anzeigen und dorthin navigieren:

```json
{
  "capabilities": {
    "webview": { "hosts": ["example.com", "*.example.com"] }
  }
}
```

Die Prüfung umfasst `src` der Web View und jede Top-Level-Navigation der Seite (Links, Redirects, Änderungen von `location`); sie wird nativ entschieden, wenn die Plattform fragt, ob eine Navigation fortfahren darf. Die eigenen Subressourcen einer Seite (Skripte, Bilder, Frames) sind Sache des Web-Contents und werden nicht geprüft. `*.example.com` trifft nur auf Subdomains zu; führe zusätzlich `example.com` für die reine Domain auf. Eine App ohne einen `"capabilities"`-Schlüssel darf jede Seite anzeigen. Siehe [Sandbox und Capabilities](./sandbox-and-capabilities.md).

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

Die Wiedergabe wird über Props gesteuert: Setze `paused`, `muted`, `volume` und `rate` aus Signalen, und der Player folgt. Die Ref hat `seek(seconds)`.

In Rust erzeugt `video(url)` den Player (die URL als Wert, Signal oder Closure), und jede Prop ist eine Builder-Methode in Snake Case (`paused`, `repeat(true)`, `object_fit(ResizeMode::Contain)` (der Stil `objectFit`), `progress_interval` für `progressUpdateInterval`); `on_load` erhält ein `VideoInfo` (`duration`, `size`), `on_progress` ein `VideoProgress` (`current_time`, `duration`) und `on_buffer` ein `bool`.

| Prop | Typ | Standard | Beschreibung |
|---|---|---|---|
| `src` | `string` | | Die URL des Videos. |
| `paused` | `boolean` | `false` | Die Wiedergabe ist pausiert. |
| `muted` | `boolean` | `false` | Kein Ton. |
| `volume` | `number` | `1` | 0..1. |
| `rate` | `number` | `1` | Die Wiedergabegeschwindigkeit. |
| `repeat` | `boolean` | `false` | Spielt am Ende wieder von vorn ab. |
| `objectFit` (Style), `object-*` Klassen | `"cover" \| "contain" \| "fill" \| "none" \| "scale-down"` | `"contain"` | Wie das Bild in die View passt, wie bei `object-fit` in CSS (`class="object-cover"`). |
| `controls` | `boolean` | `false` | Die Wiedergabesteuerung der Plattform. |
| `progressUpdateInterval` | `number` | `250` | Millisekunden zwischen `onProgress`-Events. |

| Event | Payload | Wann |
|---|---|---|
| `onLoadStart` | | Das Laden hat begonnen. |
| `onLoad` | `{ duration, size }` | Das Video ist bereit: seine Länge in Sekunden und seine Größe. |
| `onProgress` | `{ currentTime, duration }` | Während der Wiedergabe, alle `progressUpdateInterval` ms. |
| `onBuffer` | `{ isBuffering }` | Die Wiedergabe stockt, weil sie auf Daten wartet, oder wurde fortgesetzt. |
| `onEnd` | | Die Wiedergabe hat das Ende erreicht. |
| `onError` | `{ message }` | Laden oder Wiedergabe sind fehlgeschlagen. |

Mit `controls` zeichnet die Plattform ihren eigenen Play-Button, Scrubber und Vollbild-Button. Ohne zeichnest du eigene mit Views über oder unter dem Video; da das Video eine native View in deinem Layout ist, funktionieren Overlays ganz natürlich:

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

Videoquellen sind Netzwerkanfragen: Bei deklarierten Capabilities muss der Host des Videos unter `network` in `nsh.json` erlaubt sein, wie bei `fetch` und Remote-Bildern. Eine abgelehnte Quelle zeigt nichts an, und die Ablehnung wird einmal mit dem hinzuzufügenden Schlüssel protokolliert.

<a id="related"></a>

## Siehe auch

- [`WebView`](../elements/web-view.md) und [`Video`](../elements/video.md): die Elementreferenzen.
- [Sandbox und Capabilities](./sandbox-and-capabilities.md): Freigaben für `webview` und `network`.
- [Native Components](./native-components.md): Einbetten weiterer nativer Views, die deine Host-App bereitstellt.
