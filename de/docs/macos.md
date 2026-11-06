---
title: "macOS"
description: "Führen Sie Rust- und TSX-NSH-Apps unter macOS in AppKit-Fenstern aus, verpacken Sie sie als .app-Bundles, binden Sie sie mit AppView in eine Mac-App ein und erfahren Sie, was unter macOS anders ist."
order: 13
group: platforms
source_hash: 1b63a5bad9780b73
---


# macOS

NSH-Apps laufen auch als native Mac-Apps. Das macOS-Backend rendert sie mit AppKit-Views und Core Animation und setzt Text mit CoreText. Der Core, der reaktive Graph, der Renderer, das Taffy-Layout und die nativen Module sind dieselben wie unter iOS und Android, sodass eine App überall läuft. Unter macOS ist `os()` `Os::MacOs` (`platform.os` ist `"macos"` in TSX), und die `desktop={{…}}`-Props von TSX gelten. Der Titel des Fensters, eine eigene Titelleiste der App, die Menüleiste und Kontextmenüs kommen von `nsh_core::element::desktop` in Rust ([Desktop-Titelleisten](./rust.md#desktop-title-bars)) und von [`nsh/desktop`](../modules/nsh-desktop.md) in TSX.

Das macOS-Backend verhält sich wie eine Desktop-App: Eingabe per Maus, Trackpad und Tastatur, in der Größe veränderbare Fenster, Dialoge über dem Fenster und eine Menüleiste.

<a id="requirements"></a>

## Voraussetzungen

- **macOS 14** oder neuer, auf dem die App läuft.
- Die Command-Line-Tools von Xcode (`xcode-select --install`), um die Runner von Rust-Apps und die macOS-Runtime von NSH aus einem Checkout zu bauen und um Apps zu paketieren (`codesign`, `sips`). Die mit `cargo xtask dist` auf einem Mac erstellte Distribution liefert die Runtime von TSX-Apps in `runtime/macos/` mit.

<a id="running-an-app"></a>

## Eine App ausführen

Eine Rust-App läuft aus ihrem Verzeichnis:

```sh
nsh run --target macos         # the default on a Mac
```

`nsh` baut einen Debug-Runner mit deinem Crate und öffnet die App in einem Fenster, wobei ihre Logs (`log::info!` und die übrigen) im Terminal erscheinen. Eine Änderung am Rust-Code des Crates baut den Runner neu und startet die App neu. `cargo run` startet dasselbe Root aus dem `src/main.rs` des Crates, das `nsh init --template rust` schreibt: [`run_app`](#embedding-in-a-mac-app) mit `AppSource::Rust`.

Eine TSX-App benennt ihren Einstiegspunkt:

```sh
nsh run App.tsx --target macos
```

Die App öffnet sich in einem AppKit-Fenster (standardmäßig 1200×800) mit Hot Reload, Logs im Terminal und dem Fehler-Overlay wie auf den anderen Targets. Cmd+R lädt den neuesten Build neu. Die Menüleiste und das Fenster zeigen den Namen der App (nsh.json `"name"`, sonst den ihres Verzeichnisses). In einem Checkout baut `nsh run` zuerst den Entwicklungs-Host (`nsh-macos-host`). Das Beenden von `nsh run` schließt das Fenster, und das Schließen des Fensters beendet `nsh run`. Der Host führt außerdem ein gebautes Bundle eigenständig aus:

```sh
nsh build my-app --release -o build
dist/nsh/runtime/macos/nsh-macos-host --bundle build/bundle.nshc --window-size 1200x800   # in a checkout: target/debug/nsh-macos-host
```

`--window-size` ist die anfängliche Größe des Fensters (TSX-Apps). Die Größe des Fensters kann verändert werden. `--display <n>` (`nsh run` / `nsh test --target macos --display <n>`) centers it on display `n`: `1` ist das primäre Display, also das mit der Menüleiste.

`nsh test --target macos` führt die Tests einer TSX-App in macOS-Fenstern aus, wenn vorhanden auf einem sekundären Display (der Hauptbildschirm bleibt dir überlassen; `--display <n>` wählt ein anderes): Jede App, die ein Test öffnet, erhält ein eigenes Fenster in der Größe, die der Test verlangt, selbst auf einem Display, das kürzer ist. Die Schritte klicken, tippen und scrollen mit der Eingabe des Systems auf den Views, die ihre Selektoren benennen ([Testing](./testing-and-trace.md#on-a-real-platform)).

### Performance-Monitor

`--fps` (`AppOptions { fps: true, .. }` im `run_app` einer Rust-App, `AppView::set_fps_monitor(true)` beim Einbetten, `nsh run App.tsx --target macos --fps`, `--fps` des Hosts oder `open -a MyApp --args --fps` einer paketierten TSX-App) zeigt oben rechts in der App ein Panel, das sich zweimal pro Sekunde aktualisiert:

| Zeile | Misst |
|---|---|
| `FPS` | Angezeigte Frames in der letzten Sekunde: Display-Refreshes, in denen sich die App geändert hat (eine ruhende App zeigt einen niedrigen Wert; das bedeutet keine Langsamkeit). `max` ist das, was der Main-Thread schaffen konnte, danach folgt die Rate des Displays (120 Hz auf ProMotion-Bildschirmen). |
| `TICK` | Die Abstände zwischen den Display-Refreshes, wie sie eintrafen (Mittelwert, p95), und `gap`, der p95-Abstand zwischen angezeigten Frames: ein Refresh (8,3 ms bei 120 Hz), wenn nichts verspätet ist. |
| `MAIN` | Main-Thread-Zeit pro Frame (Anwenden der Änderungen der Engine, Zeichnen von Text und Canvases, Animationen, Eingabe), deren 95. Perzentil und `drop`: der Anteil der Frames, die länger als einen Refresh gedauert haben. |
| `JS` / `CORE` | Pro Commit: dein Code (Handler, Timer, Listenzeilen) und der Core von NSH (Layout, Text, Diffing); Commits pro Sekunde, native View-Änderungen pro Commit. |
| `HOP` | Wie lange Änderungen zwischen dem Engine-Thread und dem Main-Thread warten; wie ausgelastet der Engine-Thread ist. |
| `CPU` / `GPU` / `MEM` | Der Prozess: CPU (100 % entspricht einem Kern), sein GPU-Anteil, sein Speicherbedarf (der Wert der Aktivitätsanzeige). |

Die Balken darunter zeigen die Main-Thread-Zeit der letzten 120 Frames im Verhältnis zu einem Refresh (die Linie): grün innerhalb der Hälfte davon, gelb innerhalb davon, rot darüber. Solange das Panel angezeigt wird, werden die Messwerte außerdem einmal pro Sekunde geloggt (Target `nsh::perf`, in der Form des Linux-Backends mit den Frame-Phasen von macOS `tick`, `drain` und `canvas`; Millisekunden als Mittelwert/p50/p95/Max), was `nsh test --fps -v` anzeigt und `examples/gallery/tools/perf.py` liest. Miss Release-Builds; der Monitor kostet nichts, solange er ausgeschaltet ist.

<a id="packaging"></a>

## Paketierung

```sh
nsh package --target macos [--run]           # a Rust app, from its directory
nsh package App.tsx --target macos [--run]   # a TSX app
```

Schreibt ein App-Bundle:

```text
.nsh/out/<Name>.app/Contents/
  Info.plist
  MacOS/<Name>               the executable: a Rust app's own runner, built with its crate; nsh's release runner for TSX
  Resources/nsh/bundle.nshc  a TSX app, compiled
  Resources/nsh/assets/…     the assets it imports (a Rust crate's `assets!()` too)
  Resources/nsh/app.json     the window title and the app's appearance
  Resources/AppIcon.icns     the icon, when nsh.json names one (converted with sips)
```

Das `.app` ist ad hoc signiert und läuft daher auf dem Mac, der es gebaut hat. Um es zu verteilen, signiere es mit einer Developer ID und lasse es notarisieren. `--run` öffnet die App nach dem Paketieren.

<a id="embedding-in-a-mac-app"></a>

## Einbettung in eine Mac-App

Das Crate `nsh-platform-macos` (aus dem NSH-Repository) gibt einer Rust-Mac-App `AppView`: eine NSH-Engine als `NSView`. Jede `AppView` ist unabhängig; mehrere können gleichzeitig laufen. Sie führt ein Rust-Root aus, die Root-Komponente deines Crates:

```rust
use std::rc::Rc;
use nsh_platform_macos::{
    objc2::MainThreadMarker, objc2_app_kit::NSWindow, set_ui_sets, AppOptions, AppView, Root,
};

fn show(window: &NSWindow) -> Rc<AppView> {
    // Once, before the first view: the UI sets the apps import (NSH's and your crate's).
    set_ui_sets(vec![nsh_base::registry(), my_app::registry()]);
    let mtm = MainThreadMarker::new().expect("main thread");
    let view = AppView::new(mtm, AppOptions::default());
    // register native components here, before loading
    view.load(Root::of::<my_app::App>().into());
    window.setContentView(Some(&view.view()));
    // Keep the view while the window shows it; `stop` it when the window closes.
    view
}
```

`Root::tokens` gibt dem Root sein [Theme](./rust.md#theme) (`nsh_base::Theme::from_json(json)?.into_tokens()`) und `Root::app_id` die ID, unter der seine Daten gespeichert werden. Ein TSX-Bundle, das `nsh build` geschrieben hat, lässt sich in dieselbe View laden:

```rust
use nsh_platform_macos::{AppOptions, AppView, AssetBase, Bundle};

let view = AppView::new(mtm, AppOptions {
    asset_base: Some(AssetBase::Directory("app/assets".into())),
    ..AppOptions::default()
});
let code = std::fs::read_to_string("app/bundle.js").expect("bundle");
view.load(Bundle::source(code).into());
```

`AppView::load` ersetzt, was bisher lief; `stop` beendet die App. `asset_base` teilt ihr mit, wohin `asset:/`-URIs aufgelöst werden (`AssetBase::Directory` oder `AssetBase::Http`). Bytecode-Bundles (`bundle.nshc`) werden mit `unsafe { Bundle::bytecode(bytes) }` geladen: Bytecode ist vertrauenswürdige Eingabe, lade ihn also nur aus den Dateien deiner eigenen App.
Für eine App, die nur eine NSH-App ist, öffnet `run_app(source, options)` (`AppSource::Rust(root)` oder `AppSource::Bundle(bundle)`) eine `AppView` in einem Fenster mit einem Standardmenü (About, Hide, Quit, Edit, Minimize, Zoom, Enter Full Screen, Close), das die App durch `Menu.setApplicationMenu` ersetzen kann ([`nsh/desktop`](../modules/nsh-desktop.md)), und läuft, bis das Fenster geschlossen wird.
Standardmäßig beendet das Schließen des Fensters oder die Wahl von Quit die Engine und kehrt aus `run_app` zurück; der Aufrufer kann dann die Aufräumarbeiten abschließen oder seine ausführbare Datei neu starten.

Setze `AppOptions { keep_alive_on_close: true, ..Default::default() }`, damit die Standalone-Sitzung beim Schließen ihres Fensters am Leben bleibt. Das Schließen blendet das Fenster aus; das erneute Öffnen aus dem Dock zeigt dasselbe Fenster mit derselben Engine. Für ein explizites Beenden oder einen Neustart nach einem Update rufe `nsh_platform_macos::quit_app()` von einem beliebigen Thread aus auf. Es schließt das beibehaltene Fenster, beendet die Engine und kehrt aus `run_app` zurück. `nsh_core::element::desktop::close_window()` folgt der gewählten Richtlinie zum Schließen des Fensters.

`AppOptions::cache` (oder `AppView::set_cache` für die als Nächstes geladenen Apps) legt fest, wo die Apps ihre Caches und die [heruntergeladenen Bilder](./images-and-assets.md#kept-on-disk) ablegen und wie viel jede davon behält (`CacheOptions`: standardmäßig das Cache-Verzeichnis des Systems und 256 MiB an Bildern).

`AppView::set_locale(Some(locale))` und `AppView::set_font_scale(Some(scale))` geben der App die Sprache und die Textgröße deiner App anstelle der des Systems (`None` folgt wieder dem System): `locale()`, `Intl`, `fontScale()` und Text folgen sofort ([Device and environment](./device-and-environment.md#in-an-embedding-app)).

`AppView::set_theme_overrides(Some(json))` legt die Marke deiner App über das [Theme](./tailwind.md#theme-tokens) der App: eine Theme-Datei im Format von `nsh.json` von `"theme"`, deren Tokens die gleichnamigen Tokens der App im hellen und im dunklen Modus überschreiben, während die übrigen der App bleiben. Klassen wie `bg-primary` erhalten sofort ein neues Aussehen, und später geladene Apps starten damit (`None` gibt der App ihr eigenes Theme zurück; eine Datei, die sich nicht parsen lässt, ist ein Fehler und ändert nichts).

Native Komponenten werden mit `AppView::register_component` registriert; siehe [Native components](./native-components.md#registering-on-macos-rust). `set_ui_sets(sets)` legt die UI-Sets fest, die jede Engine bereitstellt: die von NSH (`nsh_base::registry()`) und die deiner Crates (`my_app::registry()`, das `#[native_module]` erzeugt), sodass das TSX, das eine View lädt, auch deine Rust-Komponenten und -Module importiert.

<a id="what-differs-on-macos"></a>

## Was unter macOS anders ist

Die Umgebung ist die eines Desktops: Der Safe Area und die Tastaturhöhe sind 0, `idiom()` ist der Desktop (`platform.idiom` ist `"desktop"`), `os_version()` (`platform.version`) ist die macOS-Version, und der Dark Mode folgt live dem Erscheinungsbild des Systems. Siehe [Device and environment](./device-and-environment.md).

Die Eingabe ist die eines Desktops: Maus, Trackpad (Scrollen mit Trägheit, Pinch und Rotation) und Tastatur. Auswählbarer Text wird durch Ziehen, Doppel- und Dreifachklick ausgewählt und mit Cmd+C kopiert. Escape, Option+Links, Cmd+[ und die Zurück-Taste der Maus schließen den neuesten Dialog oder gehen in einem Stack zurück (Escape in einem fokussierten Feld oder auf einer Webseite verlässt nur dieses; eine Seite erhält diese Tasten zuerst und behält die, die sie verwendet). Ein `Dialog` ist eine Ebene über dem gesamten Fenster, die das Popup und den Backdrop der App zeigt. Seiten zeigen ihren `header` oben. Ein Klick irgendwo in einem `Input`, auch auf dessen Padding, setzt den Cursor an die nächstgelegene Stelle. `AlertDialog` zeigt ein `NSAlert`-Sheet im Fenster: bis zu zwei Alert-Aktionen in einer Reihe (die Abbrechen-Aktion ganz links, die letzte reguläre als Standard für Return), weitere Aktionen und die Aktionen eines Action Sheets gestapelt in ihrer Reihenfolge, mit der Abbrechen-Aktion zuletzt und ohne Standard; Escape wählt die Abbrechen-Aktion.

<a id="keyboard"></a>

### Tastatur

| Tasten | Wirkung |
|---|---|
| Return | In einem `Input`, was `submitBehavior` vorgibt: absenden (`onSubmit`), absenden und das Feld verlassen oder eine neue Zeile (mehrzeilige Eingaben) |
| Return, Enter auf dem Ziffernblock, Leertaste | Eine fokussierte View mit `onPress` einmal beim Tastendruck aktivieren; Auto-Repeat wird verworfen |
| Shift+Return, Option+Return, Ctrl+Return | Eine neue Zeile in einer mehrzeiligen Eingabe, deren Return absendet |
| Tab, Shift+Tab (auch mit Ctrl) | Das nächste / vorherige Feld oder die nächste / vorherige drückbare View in Bildschirmreihenfolge, innerhalb des neuesten Dialogs; Option+Tab tippt einen Tabulator in eine mehrzeilige Eingabe |
| Escape | Verlässt das fokussierte Feld; sonst hebt es eine Textauswahl auf, dann schließt es den neuesten Dialog oder geht zurück |
| Option+Links, Cmd+[, Zurück-Taste der Maus | Zurückgehen (nicht, solange ein Feld den Fokus hat: dort bewegt Option+Links den Cursor) |
| Option / Cmd + Pfeile, mit Shift; Option+Entf, Cmd+Entf; Ctrl+A / E / K | In einem Feld wortweise und zeilenweise bewegen, auswählen und löschen, wie in jeder Mac-App |
| Cmd+Z, Shift+Cmd+Z, Cmd+X / C / V / A | Rückgängig, Wiederholen, Ausschneiden, Kopieren, Einsetzen, Alles auswählen (ein `masked`-Feld verweigert Ausschneiden und Kopieren); Cmd+A / Cmd+C wählen auswählbaren Text aus und kopieren ihn |
| Pfeile; Bild auf / ab, Leertaste, Shift+Leertaste, Option+Auf / Ab; Pos1 / Ende, Cmd+Auf / Ab | Die Scroll View um die fokussierte View oder unter der Maus um eine Zeile, eine Seite, zum Anfang / Ende scrollen (nicht, solange ein Feld den Fokus hat) |
| Cmd+W, Cmd+M, Ctrl+Cmd+F, Cmd+H, Option+Cmd+H, Cmd+Q | Schließen, Minimieren, Vollbild, Ausblenden, Andere ausblenden, Beenden (Menüs der `nsh package`- und `nsh run`-Apps) |
| Cmd+R | Lädt den neuesten Build neu (`nsh run`) |

Die eigenen Tastenkürzel der App ([`keymap`](../modules/nsh.md#keymap)) haben Vorrang vor diesen, außer den Aktivierungstasten für eine fokussierte drückbare View sowie Quit, Hide, Minimize und Full Screen, die sich nicht belegen lassen.

Tastenkürzel funktionieren mit jedem Tastaturlayout (auf einem kyrillischen oder griechischen ist Cmd+C die Taste, die auf einem US-Layout C tippt). Ein Return, das die Komposition einer Eingabemethode bestätigt (Chinesisch, Japanisch, ...), sendet nie ab. `onKeyPress` meldet, was React Native meldet: den getippten Text, `"Enter"`, `"Backspace"` und `"Escape"`.

Nicht unterstützt oder anders:

- **Zoomende Scroll Views** (`zoomTo`, die Zoom-Props).
- **`mixBlendMode`** und `brightness()` über 1.
- **Eingaben**: Inhaltstypen und Autofill, Tastaturtypen, automatische Großschreibung, Buchstabenabstand; Input Accessory Views werden nie angezeigt (es gibt keine Software-Tastatur), und `keyboardShouldPersistTaps` wird ignoriert.
- **`scrollable={false}` von `WebView`** verhindert, dass das Mausrad und das Trackpad die Seite scrollen: Sie scrollen stattdessen die Scroll Views der App darum herum, wie unter iOS. Die Seite scrollt weiterhin mit ihrer Tastatur (Leertaste, Pfeile) und ihren eigenen Skripten, und auch Trackpad-Wischgesten zwischen ihren Seiten (`allowsBackForwardNavigationGestures`) hören auf.
- **Accessibility**: benutzerdefinierte `accessibilityActions`.
- **Die Statusleiste** und **Haptik** (kein Desktop-Äquivalent).

<a id="see-also"></a>

## Siehe auch

- [CLI](./cli.md): `nsh run --target macos`, `nsh package --target macos`
- [Paketierung](./packaging.md)
- [Plattformspezifischer Code](./platform-specific.md)
