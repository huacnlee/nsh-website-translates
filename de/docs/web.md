---
title: "Web"
description: "Erstellen Sie Web-Apps in Rust oder TSX mit Native Shell-Komponenten, die als HTML und CSS gerendert werden, entwickeln Sie im Browser und veröffentlichen Sie auf jedem statischen Host oder CDN."
order: 16
group: platforms
demo: counter
source_hash: 3d223070a2f7ac3d
---


# Web

Erstellen Sie Web-Apps mit Native Shell und verwenden Sie dabei dieselben Komponenten, Stile und Anwendungslogik wie auf nativen Plattformen. NSH rendert die Oberfläche als HTML-Elemente und CSS: Text, Bilder, Eingaben, Scrollen, visuelle Stile und Interaktionen nutzen das DOM und die Web-APIs des Browsers.

`nsh package --target web` veröffentlicht die App als statische Website für jeden Webserver oder jedes CDN ([App veröffentlichen](#publish-an-app)), und `nsh run --target web` führt sie im Browser aus, während Sie sie bearbeiten ([Im Browser entwickeln](#develop-in-the-browser)). Jede Live-Demo auf dieser Website verwendet dieses Web-Backend.

Veröffentlichte TSX-Apps verwenden die JavaScript-Engine des Browsers. Beim Packaging erhält jede App ihre eigene Runtime, die nur die `nsh/base`-Komponenten und Standardmodule enthält, die die App importiert: Eine App, die aus den Kernkomponenten gebaut ist, lädt etwa 1,1 MB herunter. Die Daten für die Syntaxhervorhebung werden geladen, wenn Code zum ersten Mal hervorgehoben wird.

<a id="what-runs-where"></a>

## Was wo läuft

Die Seite besteht aus HTML-Elementen, die mit CSS gestaltet sind. NSH wandelt Komponenten-Updates in Stapel von DOM-Änderungen um, während der Browser die Oberfläche darstellt und Scrollen, Textauswahl und Eingaben übernimmt. WebAssembly hostet die gemeinsame Rust-Engine für Komponentenzustand, Layout und Updates: entweder mit dem kompilierten Crate einer Rust-App oder neben der JavaScript-Engine des Browsers, die den Code einer TSX-App als ES-Module ausführt: veröffentlichte Apps, die Seite des Dev-Servers, die Demos dieser Website und der Playground gleichermaßen.

Auf jeder nativen Plattform hat die Engine einen eigenen Thread und übergibt pro Commit ein `MountBatch` an den Main-Thread. Eine Browserseite hat nur einen Thread, daher treibt der Web-Build dieselbe Engine Schritt für Schritt aus der Event-Loop der Seite an (`nsh_engine::LocalEngine`):

```text
pointer / keyboard / scroll events ─┐
setTimeout (the engine's deadline) ─┼─▶ nsh.wasm: engine turn (Rust or JS, core, layout) ─▶ one JSON batch ─▶ nsh.js: DOM
requestAnimationFrame ──────────────┘                                                 ▲
                                                          native animation outputs ───┘
```

- **Das Layout kommt vom Kern.** Jede View ist ein absolut positioniertes Element mit dem Frame, den Taffy berechnet hat, sodass Flexbox, Grid, `aspectRatio` und Prozentwerte sich genau wie auf Geräten verhalten. Das Layout des Browsers ist nicht beteiligt.
- **Stile werden in Rust in CSS umgewandelt.** Hintergrund, Rahmen, Radien, Schatten (`boxShadow`, `textShadow`), Verläufe, Filter, `backdropFilter`, Transformationen, `transformOrigin`, `outline`, `mixBlendMode`, Übergänge und die eingebauten Keyframe-Animationen werden zu CSS-Eigenschaften. Tailwind-Klassen, `active:`, `hover:`- und `focus:`-Zustände sowie `dark:` werden alle nativ aufgelöst, genau wie auf Geräten.
- **Text wird in Rust gesetzt**, mit Schriftmessungen des Browsers (`CanvasRenderingContext2D.measureText`), und Run für Run an den Positionen gezeichnet, die das Layout gewählt hat, sodass das Gemessene dem Gezeichneten entspricht. Zeilen werden nach Leerzeichen, um CJK-Zeichen herum und bei `\n` umbrochen; `numberOfLines` kürzt mit einer Ellipse.
- **Native Animationen laufen in Rust** auf `requestAnimationFrame`: `Animated`-Timing, Spring und Decay, `interpolate`, animierte Werte, die an `opacity`, `translate`, `rotate`, `scale` gebunden sind, die Schritte von `transform` und `backgroundColor`, mit `pan` gebundene Drags, an Scrollen gekoppelte Werte und Canvas-Argumente. JS ist pro Frame nicht beteiligt, wie auf Geräten. `LayoutAnimation`, Style-Übergänge, die `animate-*`-Keyframes und Screen-Übergänge bewegen sich wie in den Desktop-Backends, und `prefers-reduced-motion` schaltet sie ab (Screens blenden ein und aus).
- **Eingabe:** Presses mit `activeStyle`- / `active:`-Feedback und Long Presses, das Responder-System (`onTouch*`, `PanResponder`), native Drags sowie Pinch und Rotation mit zwei Fingern, Scroll-Views (das Scrollen des Browsers), Pull-to-Refresh, zoomende Scroll-Views (Pinch, Ctrl+Mausrad und Touchpad-Pinch, `zoomTo`), `<Input>` mit kontrollierten Werten, Fokus und Submit, `Canvas`, `NavStack` und `NavPage` mit dem `header` der Seite, `Dialog`.
- **System-UI wird in der Seite gezeichnet:** `AlertDialog` sieht in Desktop-Browsern aus wie die Dialoge der Desktop-Backends und auf Smartphones wie die von iOS (mit dem `desktop`-Idiom, siehe unten). Eigene Schriften werden neu vermessen, sobald der Browser sie geladen hat, und eine App wartet auf die Schriften, die sie importiert, bevor ihr erster Frame erscheint.
- **Dialoge** sind eine Ebene über der gesamten App, die das Popup und den Backdrop der App zeigt, wie in den Desktop-Backends. Escape, die Zurück-Schaltfläche des Browsers und ein Press auf den Backdrop schließen sie (`closeOnEscape`, `closeOnBackdropPress`), und `animation`, `onOpen`, `onClose`, `onCancel` und `onOpenChange` funktionieren wie auf Geräten. Eine Seite, die [die App einbettet](#embed-it-in-a-page) und sie nur einen Teil ihres Layouts einnehmen lässt, kann Dialoge und Alerts stattdessen über dem gesamten Browserfenster anzeigen (`dialogs: "viewport"`), so wie iOS und Android sie über dem ganzen Bildschirm zeigen.

<a id="keyboard-mouse-and-touch"></a>

## Tastatur, Maus und Touch

Veröffentlichte Apps verhalten sich in Desktop-Browsern wie Desktop-Apps und in Smartphone-Browsern wie Smartphone-Apps:

- **Mausräder und Touchpads** scrollen die innerste Scroll-View entlang ihrer Achse, die sich noch bewegen kann (ein vertikales Mausrad scrollt eine horizontale Liste, wenn sich nichts Vertikales bewegen lässt), und bleiben auf ihr, bis das Scrollen endet; Mausrad-Rasten gleiten, Paging- und Snapping-Views bewegen sich pro Scrollvorgang um eine Seite. Ctrl + Mausrad und Touchpad-Pinch zoomen Views mit nativen Pinch-Werten, statt die Seite zu zoomen. Mit der Maus zu ziehen scrollt nicht, wie auf den Desktop-Plattformen: Maus-Drags gehen an Pans, das Responder-System und die Textauswahl. Scroll-Views melden `onScrollDragStart` / `onScrollDragEnd`, `onMomentumStart` / `End` und `onScrollEnd` wie auf den Desktop-Plattformen.
- **Tastatur**: Tab und Shift+Tab wechseln zwischen Pressables und Eingaben (die `focus:`-Stile der App zeigen den Tastaturfokus); Return löst das fokussierte Pressable aus, Space löst es beim Loslassen aus; Pfeiltasten, Page Up / Page Down, Space, Home und End scrollen die Scroll-View um den Fokus oder unter der Maus; Escape verlässt ein Feld, schließt den Dialog und geht dann zurück. `keymap`-Shortcuts funktionieren im Browser und werden an Ort und Stelle abgeglichen (`mod` ist Command in Safari und Chrome auf einem Mac, sonst Control).
- **Zurückgehen**: Escape, Alt+Left (Cmd+[ auf einem Mac) und die Zurück-Taste der Maus schließen den neuesten Dialog oder entfernen den innersten Stack, wie es die Zurück-Taste von Android tut; `popOnBack` und `onBackPress` funktionieren dort genauso. Wenn die App die gesamte Seite einnimmt, ist jede gepushte Seite und jeder geöffnete Dialog ein Eintrag im Browserverlauf, sodass die Zurück-Schaltfläche des Browsers in der App zurückgeht.
- **Touch**: Nur Scroll-Views schwenken; die Seite selbst scrollt, zoomt oder aktualisiert sich nie per Pull-to-Refresh unter der App, und Taps haben keine Verzögerung. In einem iframe scrollen Wischgesten, die die App nicht übernimmt, die einbettende Seite. Drags auf Views mit nativen Pans, Pinches und dem Responder-System gehören der App.
- **Barrierefreiheit**: `role`, `accessibilityLabel`, `accessibilityHint`, `accessibilityState`, `accessibilityValue`, `accessibilityLiveRegion` und `accessibilityElementsHidden` werden zu ARIA; `announce` spricht über eine Live Region, und `setAccessibilityFocus` verschiebt den Fokus. Views unter einem Dialog oder Alert sind inert.
- **Auswahl und Menüs**: In Desktop-Browsern ist Text standardmäßig auswählbar, wie auf einer Webseite, außer innerhalb interaktiver Elemente (Views mit Press- oder Touch-Handlern: Buttons, anklickbare Zeilen, Tabs) und bei Text mit `userSelect: "none"` oder `select-none`; wer die Maus darüber zieht, wählt ihn aus, Ctrl/Cmd+C kopiert ihn zeilenweise und Ctrl/Cmd+A wählt den gesamten Text aus, in dem sich die Auswahl befindet. In Smartphone- und Tablet-Browsern ist nur Text mit `userSelect: "text"` auswählbar, wie in nativen Apps. Das Kontextmenü des Browsers erscheint nur bei auswählbarem Text und in Eingaben.

<a id="apps-with-rust-components"></a>

## Apps mit Rust-Komponenten

Eine in Rust geschriebene App ([Mit Rust entwickeln](./rust.md)) wird aus ihrem Verzeichnis veröffentlicht und läuft im Browser:

```sh
nsh package --target web           # .nsh/out/<Name>/: the app's own nsh.wasm, with its crate
nsh run --target web               # the dev server's page; editing the Rust code builds it again
```

Wenn `nsh.json` die Root-Komponente der App benennt (`"root"`), besteht die Seite aus dem Rust-Code der App und dem Page-Script von NSH, und
nichts sonst: `nsh.wasm` enthält die Engine, die Komponenten und das Crate der App, die Website hat kein
`app.js`, und die Seite mountet die Root-Komponente, sobald Runtime und Schriften geladen sind. Die gesamte Rust-
Galerie ist 3,3 MB groß (1,06 MB mit gzip, 0,75 MB mit Brotli), weniger als die Runtime von TSX-Apps. Unter ihrem TSX-Entry
(`nsh package App.tsx --target web`) läuft dieselbe App wie TSX-Apps auf der JavaScript-Engine des Browsers und importiert die
Komponenten und Module des Crates.

In beiden Fällen werden die Assets des Crates (`assets!()`) zusammen mit denen der App veröffentlicht, und seine Schriften werden vor dem ersten Frame geladen.
Während `nsh run --target web` baut eine Änderung am Rust-Code des Crates die Runtime neu, und die geöffnete Seite lädt sie
selbstständig; TSX-Änderungen bleiben Hot Updates. Die Entwicklungs-Runtime wird inkrementell gebaut, sodass eine Änderung am Crate in
etwa einer Sekunde bereit ist; `nsh package` baut die veröffentlichte Runtime auf Größe optimiert.

Rust-Code, der auf jeder Plattform läuft, einschließlich des Webs, verwendet die Dienste der Engine: `fetch(url).await` sendet
HTTP-Anfragen über denselben Netzwerk-Stack wie `fetch` in JS (hier der des Browsers, mit seinen CORS-Regeln); `timer`,
`set_timeout` und `set_interval` warten; und `nsh_core::time::Instant` und `nsh_core::time::unix_ms()` lesen die Uhr.
`background` und `blocking` führen Arbeit auf den Threads der nativen Ziele aus.

Der Build benötigt das Rust-Target und einen clang, der nach WebAssembly kompiliert, so wie auch der Build der Runtime selbst:
`rustup target add wasm32-unknown-unknown` sowie `clang` und `llvm-ar` (unter macOS eine LLVM-Toolchain wie
das `llvm` von Homebrew, über `CC_wasm32_unknown_unknown` und `AR_wasm32_unknown_unknown`).

<a id="browser-apis-from-rust"></a>

### Browser-APIs aus Rust

Ein Crate kann die eigenen APIs des Browsers über [wasm-bindgen](https://wasm-bindgen.github.io/wasm-bindgen/) und
dessen Crates `web-sys` und `js-sys` aufrufen, hinter `#[cfg(target_arch = "wasm32")]`: einen WebSocket, `IndexedDB`, die
Zwischenablage, jede Web-API sowie eigenes JS des Crates (`#[wasm_bindgen(inline_js = …)]`, `module = "/js/…"`). Wenn die
Web-Runtime der App auf diese Weise JS aufruft (einschließlich `JsValue`-Konvertierungen), führt `nsh` die `wasm-bindgen`-CLI darauf aus und
liefert deren Glue-Code und das JS des Crates neben der Runtime aus, in der Entwicklung wie in veröffentlichten Websites. Die Version der CLI ist die des `wasm-bindgen`-
Crates, das die Runtime einbindet und das `nsh` benennt: `cargo install wasm-bindgen-cli --version <version> --locked` installiert sie
(`NSH_WASM_BINDGEN` benennt eine CLI an einem anderen Ort als auf `PATH`). Eine Runtime, die wasm-bindgen einbindet, aber kein JS
darüber aufruft (durch die Standard-Features einer Abhängigkeit), wird wie jede andere Runtime gebaut.

Das Crate benennt die APIs, die es verwendet, als `web-sys`-Features, und das Festlegen von `wasm-bindgen` hält seine Version und damit die der
CLI von Build zu Build gleich:

```toml
[target.'cfg(target_arch = "wasm32")'.dependencies]
wasm-bindgen = "=0.2.129"
web-sys = { version = "0.3", features = ["WebSocket", "MessageEvent"] }
futures-channel = "0.3"
```

Die Callbacks des Browsers (eine eintreffende Nachricht, ein Timer der Seite) wecken die Tasks der App, die sofort laufen:

```rust
#[cfg(target_arch = "wasm32")]
async fn echo(url: &str, text: String) -> Result<String, String> {
    use wasm_bindgen::{JsCast, prelude::*};
    let ws = web_sys::WebSocket::new(url).map_err(|e| format!("{e:?}"))?;
    let (tx, rx) = futures_channel::oneshot::channel();
    let tx = std::cell::RefCell::new(Some(tx));
    let on_message = Closure::<dyn FnMut(web_sys::MessageEvent)>::new(move |e: web_sys::MessageEvent| {
        if let (Some(tx), Some(data)) = (tx.borrow_mut().take(), e.data().as_string()) {
            let _ = tx.send(data);
        }
    });
    ws.set_onmessage(Some(on_message.as_ref().unchecked_ref()));
    on_message.forget();
    let open = ws.clone();
    let on_open = Closure::<dyn FnMut()>::new(move || {
        let _ = open.send_with_str(&text);
    });
    ws.set_onopen(Some(on_open.as_ref().unchecked_ref()));
    on_open.forget();
    rx.await.map_err(|_| "closed".to_owned())
}
```

Aufrufe von Browser-APIs durch ein Crate laufen mit den eigenen Berechtigungen der Seite, so wie der native Code eines Crates auf den anderen Plattformen mit denen der App läuft:
Die Capabilities von `nsh.json` bestimmen, was durch die Engine geht (`fetch`, das JS der App),
und die Regeln des Browsers (CORS, die Content-Security-Policy der Seite) bestimmen jede Anfrage, die die Seite stellt.

<a id="publish-an-app"></a>

## App veröffentlichen

```sh
# A Rust app, from its directory
nsh package --target web                   # .nsh/out/<Name>/: a static site
nsh package --target web --run             # and serve it on this machine (open the address it prints)

# A TSX app
nsh package App.tsx --target web
nsh package App.tsx --target web --run
```

`nsh package --target web` schreibt `.nsh/out/<Name>/` (`--out` für ein anderes Verzeichnis), aufgebaut wie ein Frontend-Build: eine
Seite und Dateien, die nach ihrem Inhalt benannt sind.

| Datei | Was es ist |
|---|---|
| `index.html` | Die Seite der App: ihr Name als Titel, die Icons, die Farben ihres `appearance`, ein Ladeindikator und eine Meldung, wenn die App nicht geladen oder gestartet werden kann |
| `manifest.webmanifest` | Name, ID, Icons und Farben, mit denen Browser die App installieren |
| `nsh.<digest>.js` | Die DOM-Runtime, minifiziert (79 KB, 22,5 KB mit Brotli) |
| `nsh.<digest>.wasm` | Die Rust-Engine, Layout und Komponenten, plus das eigene Crate einer Rust-App. TSX läuft in Browser-JavaScript; das Packaging bindet nur die Komponenten und Standardmodule ein, die der erste Screen der App importiert. |
| `nsh-<name>.<digest>.wasm` | Komponenten, Standardmodule und Shader, die die App über ihren ersten Screen hinaus verwendet: werden im Hintergrund heruntergeladen, nachdem er erscheint |
| `<file>.br`, `<file>.gz` | Jede Datei vorab komprimiert, für Hosts, die vorkomprimierte Dateien ausliefern |
| `nsh-syntaxes.<digest>.bin` | Die Syntaxen, mit denen Code hervorgehoben wird (das Set von bat: 0,92 MB, 0,8 MB mit Brotli), heruntergeladen, wenn ein Codeblock, ein `Editor` oder ein `DiffView` zum ersten Mal Code in einer Sprache zeigt |
| `nsh-bindgen.<digest>.js` | Der wasm-bindgen-Glue-Code einer App, deren Crates [Browser-APIs aus Rust](#browser-apis-from-rust) aufrufen, minifiziert |
| `snippets.<digest>/<crate>-<hash>/…` | Das JS dieser Crates, das der Glue-Code importiert (`inline_js`, `module = "/js/…"`), unter den Pfaden, die wasm-bindgen ihm gibt |
| `app.<digest>.js` | Der kompilierte TSX-Entry als ES-Modul, vom Browser geladen. |
| `host.<digest>.js` | Der Host der Seite, `nsh.json` `web.host` ([die Funktionen des Hosts](#the-hosts-functions)) |
| `<name>.<digest>.js` | ES-Module, die von `import()` bei Bedarf geladen werden. |
| `assets/<path>.<digest>.<ext>` | Jedes Asset, das die App importiert, von seiner URL geladen, wenn es verwendet wird (Schriften vor dem Code, der sie registriert, da Text mit ihnen vermessen wird: vor dem Start der App oder mit dem Chunk, der sie importiert) |
| `icons/<size>.<digest>.png` | Das Icon von `nsh.json` in 32 (Favicon), 180 (`apple-touch-icon`), 192 und 512 Pixeln |

`<digest>` ist der Anfang des SHA-256 des Dateiinhalts: Der Name einer Datei ändert sich genau dann, wenn sich ihr Inhalt ändert, sodass ein
neues Release nur `index.html` und die Dateien ändert, die sich wirklich geändert haben. Alles verwendet relative URLs, sodass die Website
aus jedem Verzeichnis jedes Hosts funktioniert (`https://example.com/apps/counter/`).

<a id="runtime-size"></a>

### Runtime-Größe

Beim Packaging erhält jede App ihre eigene `nsh.<digest>.wasm`, die die Engine und die `nsh/base`-Komponenten, Standard-
module und Shader enthält, die der erste Screen der App importiert. Was die anderen Screens der App importieren, wird im
Hintergrund heruntergeladen, sobald der erste Screen erscheint. Eine App, deren Crates [Browser-APIs aus Rust](#browser-apis-from-rust) aufrufen,
erhält die gesamte Runtime, ihre Crates eingeschlossen, in ihrer `nsh.<digest>.wasm`. Gemessen mit `nsh package --target web`
(MB = 10^6 Bytes):

| App | Verwendet | `nsh.<digest>.wasm` | gzip | Brotli |
|---|---|---|---|---|
| `examples/counter` | Die Kernkomponenten | 3,96 MB | 1,32 MB | 0,97 MB |
| `examples/gallery` | Jede Komponente, `zlib` und Shader | 4,13 MB | 1,36 MB | 1,01 MB |
<a id="deploy-it"></a>

### Veröffentlichen

Lade das Verzeichnis auf einen beliebigen statischen Host hoch: einen Object Store hinter einem CDN, Cloudflare Pages, Netlify, GitHub Pages oder nginx. Zwei Regeln sorgen dafür, dass die App schnell lädt und zuverlässig aktualisiert wird:

| Dateien | `Cache-Control` |
|---|---|
| `index.html`, `manifest.webmanifest` | `no-cache` (wird bei jedem Laden revalidiert, damit ein Release sofort erscheint) |
| alles andere | `public, max-age=31536000, immutable` |

Liefere `.wasm` als `application/wasm` aus (Browser kompilieren es dann schon während des Downloads) und sende die vorkomprimierten
Kopien an Browser, die sie akzeptieren: nginx' `brotli_static on; gzip_static on;`, Caddys `file_server {
precompressed br gzip }` oder ein CDN, das mit Brotli komprimiert. Mit Brotli ist die Runtime etwa ein Viertel kleiner
als mit gzip. `nsh package --target web --run` liefert die Website auf diese Weise auf `http://127.0.0.1:4173/` aus.

Eine für das Web veröffentlichte App läuft wie eine paketierte native App: als Release, mit den Capabilities, die ihr `nsh.json` deklariert
([Sandbox und Capabilities](./sandbox-and-capabilities.md)), als TSX-App auf der JavaScript-Engine des Browsers. Wenn sie `network` einschränken, enthält die Seite außerdem eine
Content-Security-Policy `connect-src` mit den deklarierten Hosts (und dem eigenen Origin der Seite), sodass der Browser selbst
Anfragen und Redirect-Schritte zu jedem anderen Host ablehnt. Ein Fehler, der den Start verhindert, wird auf der Seite angezeigt;
spätere Fehler landen in der Konsole des Browsers.

<a id="embed-it-with-an-iframe"></a>

### Mit einem iframe einbetten

Im Web gibt es keine Embedding-API: Bette die veröffentlichte App mit einem `<iframe>` ein. Seine Größe ist das Fenster der App:

```html
<iframe src="https://apps.example.com/counter/" title="Counter"
        style="width: 390px; height: 844px; border: 0"></iframe>
```

<a id="develop-in-the-browser"></a>

## Im Browser entwickeln

```sh
nsh run --target web               # a Rust app, from its directory
nsh run App.tsx --target web       # a TSX app
```

startet den Dev-Server und gibt die Adresse seiner Seite aus, `http://127.0.0.1:8790/`: Öffne sie in einem beliebigen Browser. Die Seite ist wie die anderen ein Development-Host:
Sie führt jeden Build der App aus, zeigt Build-Fehler und Laufzeitfehler über der App an und sendet die
Logs der App an das Terminal. Eine Änderung am Crate einer Rust-App baut deren Runtime neu, und die geöffnete Seite lädt sie selbstständig;
TSX-Änderungen werden direkt angewendet (Hot Updates). Smartphones im selben Netzwerk öffnen die
Adresse, die `nsh run` darunter ausgibt (`on this network: http://192.168.…:8790/`). `nsh dev` liefert dieselbe Seite aus, sobald die
Web-Runtime vorhanden ist (in der Distribution immer).

<a id="build-the-websites-player"></a>

## Den Player der Website bauen

```sh
cargo xtask web                       # nsh.wasm, nsh.js, the player and website/demos/*.tsx
cargo xtask web --out target/play     # somewhere else
```

Das Ausgabeverzeichnis enthält:

| Datei | Bedeutung |
|---|---|
| `gallery/nsh.<digest>.wasm` | Die Runtime der Gallery, von `nsh package` dafür gelinkt (sie verwendet alle Komponenten und `zlib`: etwa 11,8 MB, 3,6 MB gzip-komprimiert) |
| `gallery/nsh-syntaxes.<digest>.bin` | Die Syntaxdefinitionen, mit denen die Runtime Code hervorhebt; sie werden beim ersten Mal geladen, wenn eine Demo Code in einer Sprache zeigt |
| `nsh-playground.wasm` | Dasselbe plus der TSX-Compiler von NSH, für den [Playground](#the-playground) (etwa 8 MB, 2,4 MB gzip-komprimiert) |
| `gallery/nsh.<digest>.js` | Die DOM-Runtime (minifiziert): lädt das Wasm, wendet Batches an und wandelt Eingaben in Events um |
| `index.html` | Eine Player-Seite: führt `demos/<name>.js` für `#<name>` aus |
| `nsh.wasm`, `nsh.js`, `browser/` | Die Runtime, die der Player lädt: die Engine, die DOM-Runtime und die Module des Browser-Hosts |
| `demos/<name>.js` | Jede von `nsh build --release` kompilierte Demo: ein ES-Modul |
| `gallery/` | Die mit `nsh package --target web` veröffentlichte Gallery-App, gezeigt auf der Seite [Gallery](/gallery) |

Liefere das Verzeichnis mit einem beliebigen statischen Server aus (er benötigt den MIME-Typ `application/wasm` für Streaming-Kompilierung) und öffne `index.html#counter`.

<a id="the-playground"></a>

## Der Playground

Der [Playground](/playground) bearbeitet und führt eine App im Browser aus: Die Seite kompiliert das TSX mit dem eigenen JSX-Compiler von NSH (in `nsh-playground.wasm` eingebaut, ohne rolldown) und führt es bei jeder Tipppause auf der JavaScript-Engine des Browsers aus. Jede Demo auf dieser Website hat einen Link **Edit in Playground**, und **Share** legt den Code im Link selbst ab, sodass nichts auf einem Server gespeichert wird.

Eine Playground-App besteht aus einem einzigen Modul: Sie importiert die Module von NSH (`nsh` und `nsh/*`), aber keine anderen Dateien oder Pakete. Ausgaben und Fehler von `console.log` erscheinen unter dem Smartphone.

Der Compiler ist auch eine Rust-Funktion, `nsh_bundler::compile_module(name, source, ui_sets)`, die ohne das Feature `bundle` des Crates verfügbar ist.

<a id="embed-it-in-a-page"></a>

## In eine Seite einbetten

Eine Rust-App wird als ihre veröffentlichte Website in einem [iframe](#embed-it-with-an-iframe) eingebettet. Bei TSX ist `nsh.js` ein ES-
Modul. `createPlayer` lädt die Runtime in einen Container; `runModule(url)` startet ein Bundle, das `nsh build` schreibt
(`bundle.js`, ein ES-Modul), auf der JavaScript-Engine des Browsers in einem eigenen Realm der App und ersetzt dabei, was zuvor lief. Es
gibt ein Promise zurück, das aufgelöst wird, sobald das Modul geladen ist, und mit dem Fehler abgelehnt wird, der es gestoppt hat; diesen meldet auch der
Player (`onError`):

```js
import { createPlayer } from "./nsh.js";

const player = await createPlayer(document.querySelector("#phone"), {
  wasm: "./nsh.wasm",
  assetBase: "./assets/",   // where `asset:/…` URIs (image imports) are served from
  // dark: true,            // force an appearance; otherwise it follows the system
  // idiom: "phone",        // force "phone", "pad" or "desktop"; otherwise the pointer and the size decide
  // history: false,        // pages and dialogs as browser history entries; by default only when the app is the page, not in an iframe
  // dialogs: "viewport",   // Dialog, Sheet and AlertDialog over the whole browser window; by default over the container
});
await player.runModule(new URL("./bundle.js", location.href).href);
```

`assets` (eine Map von `asset:/`-Pfaden auf URLs) ersetzt `assetBase`, `readAsset(uri)` liefert die Bytes eines Assets, das die Engine sofort benötigt (eine Schrift), oder `null`, `data` ordnet die Dateien, die die Runtime erst bei Bedarf lädt, ihren URLs zu (`syntaxes`: `nsh-syntaxes.<digest>.bin`; standardmäßig `nsh-<name>.bin` neben `nsh.js`), und `glue` ist die URL des wasm-bindgen-Glue-Codes einer Runtime, deren Crates [Browser-APIs aus Rust](#browser-apis-from-rust) aufrufen (`nsh-bindgen.<digest>.js`); der Player lädt ihn zusammen mit der Runtime. `player.runModule(url, { capabilities, appId })` führt die App mit den Capabilities aus, die sie deklariert (ihr `capabilities.json`), und legt ihren Speicher unter ihrer `nsh.json`-ID ab (ohne eine solche unter dem Pfad der Seite). Die Seite, die `nsh package --target web` schreibt, verwendet alle davon.

`runModule(url, { chunks })` nimmt außerdem entgegen, wo die Chunks eines [geteilten Bundles](#split-bundles) liegen.

`player.runSource(code, { name, sourceMap, capabilities, appId })` führt ein als Quelltext übergebenes ES-Modul mit denselben Optionen aus. Mit `nsh-playground.wasm` kompiliert `player.compileAndRun(tsx, name, options)` zuerst TSX, führt es mit den Optionen von `runSource` aus und liefert als Ergebnis den Kompilierfehler oder `null`; `player.compile(tsx)` gibt `{ code }` oder `{ error }` zurück.

Die Größe des Containers ist das Fenster der App (`windowSize()`); wird der Container in der Größe geändert, ändert sich auch die App. `player.setDark(true)` schaltet das Erscheinungsbild zur Laufzeit um, was Apps über die Klassen `colorScheme()` und `dark:` beobachten.

Dialoge und Alerts bedecken den Container. Mit `dialogs: "viewport"` bedecken sie das gesamte Browserfenster, wie die eigenen modalen Dialoge einer Seite, während die App den Container als Fenster behält: Ein `Dialog` wird in der Größe und dem Safe Area des Fensters gelayoutet und gleitet von dessen unterem Rand herein, sein Backdrop bedeckt die ganze Seite, und das Mausrad darüber lässt die Seite an Ort und Stelle. Der Dialog erscheint im Top Layer des Browsers (Chrome 114, Safari 17, Firefox 125 und neuer) und liegt damit über dem Rest der Seite, wo auch immer sich der Container befindet; in früheren Browsern bedeckt er den Container.


`Sheet` folgt derselben Präsentationseinstellung wie `Dialog` und `AlertDialog`. In einem iframe mit gleichem Origin
bedeckt die Viewport-Präsentation automatisch die äußere Seite, während die App ihre ursprüngliche Layoutgröße behält.
Der iframe kehrt an seine ursprüngliche Position und Größe zurück, wenn das letzte Popup geschlossen wird; seine Engine und sein Zustand bleiben erhalten.
Die Demos der Dokumentation aktivieren diese Präsentation.

Bei einem Cross-Origin- oder Sandbox-iframe registriert die einbettende Seite den Host, bevor sie den Player lädt:

```js
import { hostPlayerFrame } from "./nsh.js";
const frame = document.querySelector("iframe");
const disconnect = hostPlayerFrame(frame);
frame.src = "https://apps.example.com/player.html"; // player uses dialogs: "viewport"
// When removing the embedding: disconnect();
```

Der Host akzeptiert Anfragen vom Fenster dieses iframes, hält die umgebende Seite inaktiv und sperrt deren Scrollen,
solange ein Popup sichtbar ist, und stellt beides beim Schließen wieder her. Jede Cross-Origin-Einbettungsgrenze erfordert die
Mitwirkung ihres Hosts; ohne sie bleibt die Präsentation innerhalb dieses Dokuments, und der Player meldet eine Warnung.

<a id="the-hosts-functions"></a>

## Die Funktionen des Hosts

Im Web ist die Seite der Host der App: Sie beantwortet das `host.call(name, args)` von [`host`](../modules/nsh.md#host) und sendet die Events, auf die `host.on` lauscht. Das `host` von `createPlayer` ist ein Objekt, dessen `call(name, args)` das Ergebnis oder ein Promise darauf zurückgibt; ein Throw oder eine Ablehnung lehnt den Aufruf der App mit der Nachricht des Fehlers ab. `player.hostEvent(event, payload)` sendet ein Event mit einer JSON-Payload (eine Payload, die kein JSON ist, löst einen Fehler aus). Mit einem `host` ist `host.available()` gleich `true`.

```js
const player = await createPlayer(container, {
  wasm: "./nsh.wasm",
  host: {
    async call(name, args) {
      if (name === "user.info") return { name: "Ada" };
      throw new Error(`no host function ${name}`);
    },
  },
});
player.hostEvent("theme", { dark: true });
```

Eine veröffentlichte App erhält ihren Host von `nsh.json`: `web.host` benennt ein JS-Modul im Verzeichnis der App, relativ zu `nsh.json`, das `createHost(player)` exportiert. `nsh package --target web` kopiert es als `host.<digest>.js` in die Website, und die Seite führt `createHost` mit dem Player aus, bevor die App startet; was es zurückgibt (oder womit es aufgelöst wird), muss eine Funktion `call` haben, sonst zeigt die Seite an, dass die App nicht geladen werden konnte. Der Player `createHost` erhält von da an gesendete Events:

```json
{
  "capabilities": {
    "host": ["user.*"]
  },
  "web": { "host": "./host.js", "connect": ["api.example.com"] }
}
```

```js
// host.js
const post = (url) => (args) =>
  fetch(url, { method: "POST", body: JSON.stringify(args) }).then((r) => r.json());

// The functions the app may call, by their exact names.
const functions = new Map([
  ["user.info", post("https://api.example.com/user/info")],
  ["user.settings", post("https://api.example.com/user/settings")],
]);

export async function createHost(player) {
  addEventListener("online", () => player.hostEvent("online", {}));
  return {
    call(name, args) {
      const f = functions.get(name);
      if (!f) throw new Error(`no host function ${name}`);
      return f(args);
    },
  };
}
```

Der Host schlägt jeden Namen so, wie er ist, in einer Tabelle seiner Funktionen nach, wie oben, und hält seine URLs und Pfade für sich: `capabilities.host` erteilt Namen anhand ihres Anfangs (`user.*`), sodass ein Name, den der Host in einen Pfad umwandelt, etwas erreichen könnte, das die Freigabe ausschließt. Die Runtime lässt Namen mit 1 bis 128 Zeichen aus `A`–`Z`, `a`–`z`, `0`–`9`, `_`, `.`, `:` und `-` durch, ohne `..`, und lehnt den Aufruf jedes anderen Namens ab. Eine Präfix-Freigabe endet mit einem Trennzeichen (`bridge.*`): `bridge*` passt auch auf `bridgeAdmin`.

Events, die gesendet werden, bevor die App läuft, etwa von `createHost` selbst, werden der Reihe nach zugestellt, sobald sie startet, sodass die `host.on`-Listener der App auf oberster Ebene sie erhalten. Ein Event, das gesendet wird, bevor sich ein Listener registriert, wird ihm nicht erneut zugespielt: Eine App liest den Zustand, mit dem sie startet, über einen Aufruf (`host.call("user.info")`) und verfolgt dessen Änderungen über Events.

Das Host-Modul läuft in der Seite der App und teilt deren Content-Security-Policy: Wenn die Capabilities der App `network` einschränken, enthält das `connect-src` der Seite den Origin der Seite, die Hosts, die `capabilities.network` auflistet, und die Hosts, die `web.connect` auflistet. `web.connect` benennt die Hosts, die die eigenen Anfragen des Host-Moduls (`fetch`, `XMLHttpRequest`, `WebSocket`) erreichen, als Muster wie die von `capabilities.network.hosts` (`api.example.com`, `*.example.com`, `"*"`), wie `api.example.com` oben; die eigenen Anfragen der App werden weiterhin gegen ihr `capabilities` geprüft.

Das Modul wird unverändert kopiert und importiert anderen Code daher über absolute URLs. Die App benötigt für jede Funktion, die sie aufruft, weiterhin ihre `host`-[Capability](./sandbox-and-capabilities.md). `nsh run --target web` führt es auf der Entwicklungsseite aus, und `nsh test` führt dasselbe Modul für jede App aus, die ihre Tests öffnen, headless oder in einem Browser (`--target web`), sodass die App und ihr Host gemeinsam getestet werden ([Testing](./testing-and-trace.md#the-pages-host)).

<a id="the-browser-as-a-platform"></a>

## Der Browser als Plattform

`platform.os` ist `"web"`. Welche Art von Gerät der Browser ist, bestimmt, wie sich die App verhält, als `platform.idiom`:

- `"desktop"`: eine Maus (ein präziser Zeiger, der Hover unterstützt) und ein Container, der mindestens 600 Punkte breit ist. `platform.desktop` ist `true`, `platform.select` wählt `desktop`, und die Props `desktop={{…}}` greifen.
- `"pad"`: ein Touchscreen, dessen kurze Seite mindestens 600 Punkte misst; andernfalls `"phone"`. Diese gelten als mobil: `platform.select` wählt `mobile`.

Das Idiom wird beim Start der App festgelegt und bleibt während der Laufzeit gleich, wie auf jeder Plattform; ein schmales Desktop-Fenster ist weiterhin ein Desktop und wird für sein `windowSize()` gelayoutet. Die Props `web={{…}}` sowie die Klassen `platform.select({ web })` und `web:` greifen nur in Browsern; `ios={{…}}`, `native` und `ios:` greifen dort nicht.

Die Seite meldet den Rest der Umgebung und hält ihn aktuell:

| Wert | Vom Browser |
|---|---|
| Locale (Standard von `Intl`) | `navigator.languages[0]` |
| Zeitzone (lokale Zeit von `Date`, Standard-`timeZone` von `Intl`) | die des Browsers (`Intl.DateTimeFormat().resolvedOptions().timeZone`), einschließlich Sommerzeit |
| Die Layoutrichtung (`rtl:` / `ltr:`) | `<html dir>`, wenn gesetzt, sonst die Schrift der Locale |
| `reduceMotion()` | `prefers-reduced-motion` |
| `fontScale()` | die Schriftgröße des Root-Elements / 16 px (die Texteinstellung des Browsers) |
| `pixelRatio()` | `devicePixelRatio` (ändert sich mit Zoom und Bildschirmen) |
| `colorScheme()` | `prefers-color-scheme` |
| `safeArea()` | `env(safe-area-inset-*)`, wo er den Container überlappt (`viewport-fit=cover`-Seiten auf Smartphones) |
| `keyboardFrame()` | wie viel vom Container die Bildschirmtastatur verdeckt (`visualViewport`) |

`platform.version` ist `"0.0"`, und `screenReaderEnabled()` bleibt `false` (Browser teilen es nicht mit). Die Leisten des Browsers um die Seite gehören dem Browser; das [`statusBar`](../modules/nsh-base.md#status-bar) einer Seite ist für Smartphones gedacht.

<a id="networking"></a>

## Netzwerk

`fetch` (mit Streams, `AbortController` und `FormData`) und `<Image>`-URLs laufen über den eigenen Netzwerk-Stack des Browsers, nachdem NSH die [Capabilities](./sandbox-and-capabilities.md) der App geprüft hat. Da die Anfragen die des Browsers sind, gelten die Regeln des Browsers:

- **Relative URLs** werden wie im Browser gegen die URL der Seite aufgelöst: Eine veröffentlichte App erreicht ihre eigene API mit `fetch("/api/items")`, und `<Image src="/photos/a.jpg" />` lädt von ihrem eigenen Server. (Native Plattformen haben keine Seite und benötigen daher absolute URLs.)
- **CORS.** Eine Anfrage an einen anderen Origin als den der Seite ist nur erfolgreich, wenn dieser Server den Origin der Seite erlaubt (`Access-Control-Allow-Origin`); andernfalls wird `fetch` mit einem Netzwerkfehler abgelehnt. Sichtbar sind nur die Response-Header, die der Server freigibt.
- **Cookies** (und HTTP-Authentifizierung) werden nur an den eigenen Origin der Seite gesendet (`credentials: "same-origin"`), und Header, die Browser verbieten (`Cookie`, `User-Agent`, `Host`, ...), werden verworfen.
- **Redirects** folgt der Browser. Eine umgeleitete Anfrage, die ihm nicht folgen darf, schlägt fehl: `redirect: "manual"` und `"error"` sowie Anfragen einer App, deren Capabilities `network` einschränken (NSH prüft jeden Schritt, und Browser legen einen Redirect nicht offen, bevor sie ihm folgen).
- **Request-Bodys**, die ein `ReadableStream` sind, werden zuerst gesammelt und in einem Stück gesendet; Response-Bodys werden gestreamt, sobald sie eintreffen.
<a id="split-bundles"></a>

## Gesplittete Bundles

Eine TSX-Web-App muss nicht ihren gesamten Code herunterladen, bevor der erste Bildschirm erscheint (eine Rust-App ist ein `nsh.wasm`, das der Browser kompiliert, während er es herunterlädt). `nsh package --target web` veröffentlicht TSX-Apps gesplittet, wobei jeder Chunk als `<name>.<digest>.js` vorliegt und die Seite die Chunks diesen Dateien zuordnet. Um ein Bundle selbst zu splitten, legt `nsh build --split` die Module, die `import()` lädt, in eigene Chunks neben `bundle.js`:

```sh
nsh build --release --split -o site/app
# bundle.js        the app up to its first screen
# Screen.js        import("./Screen") and what only it uses
# detail.js        what two chunks share, when they do (made by the bundler)
```

Der erste `import("./Screen")` lädt `Screen.js` und die Chunks, die es importiert, alle auf einmal herunter und wertet sie dann aus; spätere Importe davon werden sofort aufgelöst. Die Seite gibt an, wo die Chunks liegen: standardmäßig neben dem Bundle oder mit einer URL pro Chunk, für Dateien, die mit einem Content-Digest umbenannt wurden, damit ein CDN sie unbegrenzt cachen kann:

```js
await player.runModule(entry, {
  chunks: { "Screen.js": "/app.3f2a9c.js", "detail.js": "/app.81bb07.js" },
});
```

Ein Chunk, der nicht heruntergeladen werden kann, lehnt das `import()` mit einem `TypeError` ab, der ihn benennt; der nächste `import()` versucht es erneut. Chunk-Namen sind feste Dateinamen aus dem Bundle: Die App kann die Seite nicht dazu bringen, etwas anderes herunterzuladen.

Die [Galerie](/gallery) lädt jede Demo auf diese Weise: `lazy` (in `examples/gallery/ui.tsx`) erzeugt eine Komponente, die den Import beim ersten Rendern startet, bis zur Auflösung einen Platzhalter anzeigt und dann das Geladene rendert. Ihr erster Ladevorgang umfasst den Index und die zuerst angezeigte Demo; eine Schrift, die eine Demo importiert, kommt mit dem Chunk dieser Demo. Native Builds enthalten alle Module, daher wird der Import dort sofort aufgelöst:

```tsx
const Stocks = lazy(() => import("./demos/Stocks").then((m) => m.Stocks));
```

<a id="limits"></a>

## Einschränkungen

Diese werden vom Browser bestimmt, und das Web-Backend folgt ihm:

- **Web Views fremder Websites**: `WebView` ist ein `<iframe>`. Inline-HTML (`html`) bekommt alles: `onMessage`, `postMessage`, `injectJavaScript`, die injizierten Skripte und Ladeereignisse (es läuft mit einem eigenen Origin, getrennt von der Seite). Eine Seite einer anderen Website erhält nur `postMessage` und Ladeereignisse mit der URL, die ihr übergeben wurde: Browser verbergen ihre Navigationen, ihren Titel, ihren Verlauf und ihre Fehler vor der umgebenden Seite, und `userAgent` kann nicht gesetzt werden.
- **Videos mit Ton, die von selbst starten**: `Video` ist ein `<video>` mit allen Props und Ereignissen, aber Browser starten ein Video mit Ton erst nach einer Benutzergeste (stummgeschaltete Videos werden abgespielt).
- **Native Komponenten**: Registrierte native Komponenten gehören zu den nativen Apps, die NSH einbetten; im Web bleibt ihre View leer, mit einer Warnung in der Konsole.
- **Plattformdienste**: Das Lesen der Zwischenablage (`Clipboard.readText`, auch `hasText`) erfordert einen sicheren Kontext (HTTPS) und fragt gegebenenfalls den Benutzer. Bilder melden `onProgress` nicht.
- **Details der Textformung**: Der Zeilenumbruch ist eine Teilmenge von UAX #14 (Leerzeichen, CJK, Bindestriche sowie die Regeln für Zeilenanfang und -ende bei CJK-Satzzeichen: schließende Zeichen wie `。`, `，` und `」` stehen nie am Zeilenanfang, öffnende Zeichen wie `（` und `「` nie am Zeilenende), ohne Silbentrennung und ohne bidirektionale Umordnung über die Absatzrichtung hinaus.

Der Player und der Dev-Server führen Apps mit Entwicklungseinstellungen aus; veröffentlichte Apps laufen als Releases. Beide führen den Code einer TSX-App in der JavaScript-Engine des Browsers aus, in einem eigenen Realm der App.

<a id="see-also"></a>

## Siehe auch

- [Packaging](./packaging.md): die anderen Ziele von `nsh package`.
- [Architecture](./architecture.md): die Engine, der Core und die Mount-Batches, die der Web-Build wiederverwendet.
- [Testing](./testing-and-trace.md): `nsh test` führt dieselbe Engine headless aus, mit einer näherungsweisen Text-Engine.
