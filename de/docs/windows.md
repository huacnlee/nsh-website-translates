---
title: "Windows"
description: "Führen Sie Rust- und TSX-NSH-Apps unter Windows in Win32-Fenstern aus, die mit Direct2D gezeichnet werden, verpacken Sie sie, binden Sie sie mit AppView in eine Win32-App ein und erfahren Sie, was sich unter Windows unterscheidet."
order: 14
group: platforms
source_hash: d39f39f9d32017d0
---


# Windows

NSH-Apps laufen auch unter Windows. Das Windows-Backend zeichnet sie in Win32-Fenstern mit Direct2D und setzt Text mit DirectWrite; der Core, der reaktive Graph, der Renderer, das Taffy-Layout und die nativen Module sind dieselben wie unter iOS und Android, sodass eine App überall läuft. Unter Windows ist `os()` `Os::Windows` (`platform.os` ist `"windows"` in TSX), und die `desktop={{…}}`-Props von TSX gelten. Der Titel des Fensters, eine eigene Titelleiste der App, die Menüleiste und Kontextmenüs stammen von `nsh_core::element::desktop` in Rust ([Desktop-Titelleisten](./rust.md#desktop-title-bars)) und von [`nsh/desktop`](../modules/nsh-desktop.md) in TSX.

<a id="requirements"></a>

## Voraussetzungen

- **Windows 10 1809** oder neuer, oder Windows 11.
- Die **WebView2 Runtime** für Web Views. Sie ist in Windows 11 und in Microsoft Edge unter Windows 10 enthalten; fehlt sie, zeigt eine
  `WebView` einen Platzhalter an.
- **Media Foundation-Codecs** für die Videoformate, die Ihre App abspielt (Videos werden über den eigenen Media-Stack von Windows abgespielt).
- Zum Bauen des Runners einer Rust-App: Visual Studio Build Tools mit der C++-Workload und dem Windows SDK. Zum Bauen der
  Windows-Runtime von NSH (aus einem Checkout oder mit `cargo xtask dist` unter Windows) zusätzlich LLVM (für die Bindings von QuickJS).

<a id="running-an-app"></a>

## Eine App ausführen

Unter Windows öffnet `nsh run` die App in einem Fenster. Eine Rust-App wird aus ihrem Verzeichnis gestartet:

```sh
nsh run                        # --target windows is the default on Windows
```

`nsh` baut einen Debug-Runner mit Ihrem Crate und öffnet die App; ihre Logs (`log::info!` und die übrigen) erscheinen im
Terminal. Eine Änderung am Rust-Code des Crates baut den Runner neu und startet die App neu. `cargo run` startet dasselbe
Root aus dem `src/main.rs` des Crates, das `nsh init --template rust` schreibt: [`run_app`](#embedding-in-a-win32-app)
mit `AppSource::Rust`.

Eine TSX-App benennt ihren Einstiegspunkt und öffnet standardmäßig ein Fenster mit 1200×800, mit Hot Reload, Logs im Terminal und dem
Fehler-Overlay wie auf den anderen Targets:

```sh
nsh run App.tsx
```

In einem Checkout baut `nsh run` zuerst den Development Host (`nsh-windows-host.exe`); die unter Windows erstellte Distribution
liefert ihn in `runtime\windows\` mit. Strg-C schließt das Fenster, und das Schließen des Fensters beendet `nsh run`; der Host
überlebt `nsh` nie, egal wie es endet. Der Host führt außerdem ein gebautes Bundle eigenständig aus:

```sh
nsh build my-app --release -o build
dist\nsh\runtime\windows\nsh-windows-host --bundle build\bundle.nshc --window-size 390x844   # in a checkout: target\debug\nsh-windows-host
```

`--window-size` ist die Größe des Fensters in Punkten (`<width>x<height>`; TSX-Apps).

### Performance-Monitor

`--fps` (`nsh run App.tsx --target windows --fps`, `nsh test --target windows --fps`, das `--fps` des Hosts oder
`AppOptions { fps: true, .. }` im `run_app` einer Rust-App) protokolliert einmal pro Sekunde die Messwerte des Performance-Monitors
(Target `nsh::perf`): angezeigte Frames im Verhältnis zur Bildwiederholrate des Displays, die Zeit des Main Threads pro Frame und seine Phasen (`tick`,
`drain`, `paint`, `present`, `canvas`), die Commits der Engine, CPU und Speicher, im selben Format wie die anderen Desktop-Plattformen
(Millisekunden als Mittelwert/p50/p95/Maximum). `nsh test --fps -v` zeigt sie an, und `examples/gallery/tools/perf.py` liest sie aus
([Performance-Report](./performance-report.md#windows-win32-direct2d)). Messen Sie Release-Builds; der Monitor kostet
nichts, solange er ausgeschaltet ist.

## Packaging

```sh
nsh package --target windows [--run]           # a Rust app, from its directory
nsh package App.tsx --target windows [--run]   # a TSX app
```

Schreibt ein Verzeichnis und dasselbe zusätzlich als Archiv:

```text
.nsh\out\<Name>\
  <Name>.exe             the executable, with the app's icon: a Rust app's own runner, built with its crate; nsh's release runner for TSX
  nsh\bundle.nshc         a TSX app, compiled
  nsh\assets\…           the assets it imports (a Rust crate's `assets!()` too)
  nsh\app.json           the window title, the app id, the version and the appearance
.nsh\out\<Name>.zip
```

Die ausführbare Datei findet `nsh\` neben sich selbst; kopieren Sie das gesamte Verzeichnis (oder entpacken Sie das `.zip`) an den Ort, an dem die App
liegen soll: Es wird nichts installiert. Das Icon aus `nsh.json` wird in die ausführbare Datei eingebettet (Explorer und Taskleiste zeigen es an),
ohne zusätzliche Tools; beim Packaging auf einem anderen System bleibt das Standard-Icon. Die App-ID gruppiert die Fenster der App in
der Taskleiste. `--run` startet die App nach dem Packaging. Die ausführbare Datei ist nicht signiert: Signieren Sie sie mit Ihrem eigenen
Zertifikat (`signtool`), um sie zu verteilen.

<a id="embedding-in-a-win32-app"></a>

## In eine Win32-App einbetten

Das Crate `nsh-platform-windows` (aus dem NSH-Repository) gibt einer Rust-Win32-App `AppView`: eine NSH-Engine in einem Child-
Fenster eines Ihrer Fenster. Jede `AppView` ist unabhängig; mehrere können gleichzeitig laufen. Sie führt ein Rust-Root aus, die Root-
Komponente Ihres Crates:

```rust
use std::rc::Rc;
use nsh_platform_windows::{
    windows::{self, Win32::{Foundation::HWND, System::Ole::OleInitialize, UI::WindowsAndMessaging::MoveWindow}},
    set_ui_sets, AppOptions, AppView, Root,
};

/// Called on the thread that runs your message loop, with your window.
fn embed(parent: HWND) -> windows::core::Result<Rc<AppView>> {
    // Once per thread: COM and OLE (the clipboard, image decoding).
    unsafe { OleInitialize(None)? };
    // Once, before the first view: the UI sets the apps import (NSH's and your crate's).
    set_ui_sets(vec![nsh_base::registry(), my_app::registry()]);
    let view = AppView::new(
        Some(parent),
        AppOptions {
            app_id: "com.example.host".into(),
            ..AppOptions::default()
        },
    )?;
    // register native components here, before loading
    view.load(Root::of::<my_app::App>().into());
    Ok(view)
}

// On WM_SIZE of `parent`:
// unsafe { MoveWindow(view.hwnd(), 0, 0, width, height, true) };
```

Ein TSX-Bundle, das `nsh build` geschrieben hat, wird in dieselbe View geladen, wobei `asset_base` auf sein `assets`-Verzeichnis gesetzt ist:

```rust
let code = std::fs::read_to_string("app/bundle.js").expect("bundle");
view.load(Bundle::source(code).into());
```

Die View ist ein Child-Fenster: Ihre Message Loop führt sie aus, und Sie platzieren sie mit `MoveWindow` auf ihrem `hwnd()`, wenn sich die Größe des
Parents ändert. Erstellen Sie sie auf dem Thread des Fensters, in dem sie liegt: Ihr Lebenszyklus folgt dem Top-Level-
Fenster dieses Fensters, unter dem sie erstellt wurde. `AppView::load` ersetzt, was bisher lief; `stop` (oder das Zerstören des Fensters) beendet die App. `asset_base`
legt fest, wo `asset:/`-URIs aufgelöst werden (`AssetBase::Directory` oder `AssetBase::Http`). Bytecode-Bundles (`bundle.nshc`)
werden mit `unsafe { Bundle::bytecode(bytes) }` geladen (oder `Bundle::read_trusted(path)`, ebenfalls unsafe): QuickJS-Bytecode ist vertrauenswürdige Eingabe, laden Sie ihn
daher nur aus den Dateien Ihrer eigenen App. Ein eigenständiges Fenster ist `nsh_platform_windows::run_app(source, options)`, mit
`AppSource::Rust(root)` oder `AppSource::Bundle(bundle)`. `Root::tokens` gibt einem Root sein [Theme](./rust.md#theme) und
`Root::app_id` die ID, unter der seine Daten gespeichert werden.

`AppOptions::cache` (oder `AppView::set_cache` für die als Nächstes geladenen Apps) legt fest, wo die Apps ihre Caches ablegen, die
[Bilder, die sie herunterladen](./images-and-assets.md#kept-on-disk), und wie viel jede davon behält (`CacheOptions`: standardmäßig das Cache-Verzeichnis
des Systems und 256 MiB für Bilder).

`AppView::set_locale(Some(locale))` und `AppView::set_font_scale(Some(scale))` geben der App die Sprache und
Textgröße Ihrer App anstelle der des Systems (`None` folgt wieder dem System): `locale()`, `Intl`, `fontScale()` und Text
folgen sofort ([Gerät und Umgebung](./device-and-environment.md#in-an-embedding-app)).

`AppView::set_theme_overrides(Some(json))` legt die Marke Ihrer App über das [Theme](./tailwind.md#theme-tokens) der App: eine Theme-Datei
im Format von `nsh.json` `"theme"`, deren Tokens im Light und Dark Mode die gleichnamigen Tokens der App überschreiben,
während die übrigen der App erhalten bleiben; Klassen wie `bg-primary` erhalten sofort ihr neues Styling, und später geladene Apps starten damit
(`None` gibt der App ihr eigenes Theme zurück; eine Datei, die sich nicht parsen lässt, ist ein Fehler und ändert nichts).

Native Komponenten werden mit `AppView::register_component` registriert; siehe
[Native Komponenten](./native-components.md#registering-on-windows-rust). `set_ui_sets(sets)` legt die UI-Sets fest, die jede
Engine bereitstellt: die von NSH (`nsh_base::registry()`) und die Ihrer Crates (`my_app::registry()`, das `#[native_module]`
erzeugt), sodass das TSX, das eine View lädt, auch Ihre Rust-Komponenten und -Module importiert.

<a id="what-differs-on-windows"></a>

## Was unter Windows anders ist

Die Umgebung ist die eines Desktops: Safe Area und Tastaturhöhe sind 0, `idiom()` ist der Desktop
(`platform.idiom` ist `"desktop"`), und `os_version()` (`platform.version`) ist `"10.0"` (auch unter Windows 11: Windows hat die Versionsnummer beibehalten). Der Dark Mode
folgt live den Einstellungen unter Einstellungen > Personalisierung > Farben, `fontScale()` der Einstellung für die Textgröße, „Bewegung reduzieren“ der Einstellung für Animationseffekte und das Locale dem regionalen Format des Benutzers. Siehe [Gerät und Umgebung](./device-and-environment.md).

Der Style `cursor` folgt Aktualisierungen, solange die Maus über einer View ruht. Ändert ein Batch den Cursor,
wendet Windows die neue Form oder `"none"` erst nach dem gesamten Batch an, und zwar anhand der View unter dem Mauszeiger.
Die Titelleiste und die Ränder zum Ändern der Größe behalten ihre System-Cursor.

<a id="keyboard"></a>

### Tastatur

| Tasten | Aktion |
|---|---|
| Return | In einem `Input`, was `submitBehavior` vorgibt: absenden (`onSubmit`), absenden und das Feld verlassen oder eine neue Zeile (mehrzeilige Eingaben) |
| Umschalt+Return, Alt+Return | Eine neue Zeile in einer mehrzeiligen Eingabe, deren Return absendet (Strg+Return sendet ab) |
| Tab, Umschalt+Tab | Das nächste / vorherige Textfeld innerhalb des neuesten Dialogs; der Text des Felds wird markiert, wie in den Dialogen von Windows |
| Escape | Verlässt das fokussierte Feld; andernfalls wird eine Textauswahl aufgehoben, dann der neueste Dialog geschlossen oder zurückgegangen |
| Alt+Links, Browser-Zurück-Taste, Zurück-Taste der Maus | Zurückgehen (auch aus einem Feld) |
| Strg+Pfeiltasten, Pos1 / Ende, Strg+Pos1 / Ende, mit Umschalt; Strg+Rücktaste / Entf | Wort- und zeilenweise bewegen, markieren und löschen in einem Feld, wie in jeder Windows-App |
| Strg+Z, Strg+Y, Strg+X / C / V / A; Umschalt+Entf, Strg+Einfg, Umschalt+Einfg | Rückgängig, Wiederholen, Ausschneiden, Kopieren, Einfügen, Alles auswählen (ein `masked`-Feld verweigert Ausschneiden und Kopieren); Strg+A / Strg+C wählen auswählbaren Text aus und kopieren ihn |
| Pfeiltasten; Bild auf / ab, Leertaste, Umschalt+Leertaste; Pos1 / Ende, Strg+Pos1 / Ende | Scrollen die Scroll View um die fokussierte View oder unter der Maus um eine Zeile, eine Seite, zum Anfang / Ende (nicht, solange ein Feld den Fokus hat) |
| F11, Alt+F4 | Vollbild, Fenster schließen (Apps mit `nsh package` und `nsh run`) |
| Strg+R, F5 | Den neuesten Build neu laden (`nsh run`) |

Tastenkürzel funktionieren mit jedem Tastaturlayout (auf einem kyrillischen oder griechischen Layout ist Strg+C die Taste, die auf einem US-Layout C schreibt).
Ein Return, das die Komposition einer Eingabemethode (Chinesisch, Japanisch, ...) bestätigt, sendet nie ab. `onKeyPress` meldet,
was React Native meldet: den eingegebenen Text, `"Enter"`, `"Backspace"` und `"Escape"`; eingefügter Text wird nicht gemeldet.

Die eigenen Tastenkürzel der App ([`keymap`](../modules/nsh.md#keymap)) haben Vorrang vor den Tasten eines fokussierten Felds, der Navigation
und dem Scrollen; Alt+F4, F11 und Strg+Q können nicht belegt werden.

Anders oder nicht unterstützt:

- **`WebView`**: Eine Seite in einer View mit 3D-Transformation (Perspektive) wird nicht angezeigt, und ein `backdropFilter` über einer
  Seite verwischt sie nicht. `baseUrl` akzeptiert `http(s)`-URLs. Eine native Komponente, die ein eigenes Fenster mitbringt,
  bleibt über allem, was NSH zeichnet.
- **Video**: die Formate, die die installierten Codecs dekodieren; kein Poster; die Steuerleiste wird mit `controls` immer angezeigt.
- **Zoombare Scroll Views** (`zoomTo`, die Zoom-Props); der Scroll-Indikator lässt sich nicht ziehen.
- **`mixBlendMode` und `backdropFilter`** werden gezeichnet, aber nicht in einer View mit `filter` oder einer 3D-Transformation;
  `borderCurve: "continuous"` zeichnet kreisförmige Ecken.
- **Text**: Ellipsen am Anfang und in der Mitte nur bei einer einzelnen Zeile (bei mehr Zeilen gibt es eine Ellipse am Ende); Farb-Emoji nur aus COLR-
  Schriften; Kapitälchen nur, wo die Schrift sie enthält.
- **Text Inputs**: Tastaturtypen und Autofill gelten nicht (es gibt keine Software-Tastatur); Tab wechselt zwischen Text-
  feldern. Ein Rechtsklick öffnet das Bearbeiten-Menü (Rückgängig, Ausschneiden, Kopieren, Einfügen, Löschen, Alles auswählen), wie bei auswählbarem Text (Kopieren,
  Alles auswählen).
- **Barrierefreiheit** (UI Automation): Alert-Dialoge und Toasts werden nicht bereitgestellt; Überschriften melden
  Ebene 1.
- **Input Accessory Views** und die **Statusleiste** (kein Desktop-Äquivalent).

<a id="see-also"></a>

## Siehe auch

- [CLI](./cli.md): `nsh run --target windows`, `nsh package --target windows`
- [Packaging](./packaging.md)
- [Plattformspezifischer Code](./platform-specific.md)
