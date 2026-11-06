---
title: "Linux"
description: "Führen Sie Rust- und TSX-NSH-Apps unter Linux in GTK-4-Fenstern aus, verpacken Sie sie, betten Sie sie mit AppView in eine GTK-App ein und erfahren Sie, was sich unter Linux unterscheidet."
order: 15
group: platforms
source_hash: c423cb25ff360498
---


# Linux

NSH-Apps laufen auch unter Linux. Das Linux-Backend rendert sie mit GTK-4-Widgets und setzt den Text mit Pango; der Core, der reaktive Graph, der Renderer, das Taffy-Layout und die nativen Module sind dieselben wie unter iOS und Android, sodass eine App überall läuft. Unter Linux ist `os()` `Os::Linux` (`platform.os` ist `"linux"` in TSX), und die `desktop={{…}}`-Props von TSX gelten. Der Fenstertitel, eine eigene Titelleiste der App, die Menüleiste und Kontextmenüs stammen von `nsh_core::element::desktop` in Rust ([Desktop-Titelleisten](./rust.md#desktop-title-bars)) und von [`nsh/desktop`](../modules/nsh-desktop.md) in TSX.

<a id="requirements"></a>

## Voraussetzungen

- **GTK 4.14** oder neuer. Um den Runner einer Rust-App oder die Linux-Runtime von NSH zu bauen (aus einem Checkout oder mit `cargo xtask
  dist` on Linux) you need their development packages and clang: `libgtk-4-dev clang` unter Debian und Ubuntu (ab 24.04), `gtk4 clang` unter Arch, `gtk4-devel clang` unter Fedora.
- **WebKitGTK 6.0** (2.40 oder neuer) für Web Views: `libwebkitgtk-6.0-dev` unter Debian und Ubuntu, `webkitgtk-6.0` unter Arch, `webkitgtk6.0-devel` unter Fedora, um die Runtime zu bauen. Der Entwicklungs-Host und der Release-Runner verwenden sie standardmäßig, daher benötigen paketierte Apps WebKitGTK 6.0 dort, wo sie laufen (`libwebkitgtk-6.0-4` unter Debian und Ubuntu; GNOME-Desktops bringen es mit). `cargo xtask dist` auf einem Rechner ohne die Entwicklungsdateien baut eine Runtime, deren Web Views Platzhalter sind und deren Apps nur GTK benötigen.
- **GStreamer**-Plugins für die Videoformate, die Ihre App abspielt (GTK spielt Video über GStreamer ab).

<a id="running-an-app"></a>

## Eine App ausführen

Unter Linux öffnet `nsh run` die App in einem GTK-Fenster. Eine Rust-App wird aus ihrem Verzeichnis gestartet:

```sh
nsh run                        # --target linux is the default on Linux
```

`nsh` baut einen Debug-Runner mit Ihrem Crate und öffnet die App, wobei ihre Logs (`log::info!` und die übrigen) im Terminal erscheinen; bei einer Änderung am Rust-Code des Crates wird der Runner neu gebaut und die App neu gestartet. `cargo run` startet dasselbe Root aus dem `src/main.rs` des Crates, das `nsh init --template rust` schreibt: [`run_app`](#embedding-in-a-gtk-app) mit `AppSource::Rust`.

Eine TSX-App benennt ihren Einstiegspunkt und öffnet sich standardmäßig in einem Fenster von 390×844, mit Hot Reload, Logs im Terminal und dem Fehler-Overlay wie auf den anderen Zielplattformen:

```sh
nsh run App.tsx
```

In einem Checkout baut `nsh run` zuerst den Entwicklungs-Host (`nsh-linux-host`); die unter Linux erstellte Distribution liefert ihn in `runtime/linux/` mit. Strg+C schließt das Fenster, und das Schließen des Fensters beendet `nsh run`. Der Host führt auch ein gebautes Bundle eigenständig aus:

```sh
nsh build my-app --release -o build
dist/nsh/runtime/linux/nsh-linux-host --bundle build/bundle.nshc --window-size 1024x768   # in a checkout: target/debug/nsh-linux-host
```

`--window-size` ist die Standardgröße des Fensters (TSX-Apps); Tiling-Fenstermanager können dem Fenster eine andere Größe geben.

<a id="packaging"></a>

## Paketierung

```sh
nsh package --target linux [--run]           # a Rust app, from its directory
nsh package App.tsx --target linux [--run]   # a TSX app
```

Schreibt ein Verzeichnis und dasselbe als Archiv:

```text
.nsh/out/<Name>/
  <Name>                 the executable: a Rust app's own runner, built with its crate; nsh's release runner for TSX
  nsh/bundle.nshc        a TSX app, compiled
  nsh/assets/…           the assets it imports (a Rust crate's `assets!()` too)
  nsh/app.json           the window title and the application id
  <id>.desktop           a desktop entry (StartupWMClass is the id)
  <id>.png               the icon, when nsh.json names one
.nsh/out/<Name>.tar.gz
```

Die ausführbare Datei findet `nsh/` neben sich (ein symbolischer Link darauf, etwa in `~/.local/bin`, funktioniert ebenfalls). GTK 4, Pango und WebKitGTK 6.0 müssen dort installiert sein, wo die App läuft. Um die App im Launcher eines Desktops anzuzeigen, legen Sie die ausführbare Datei (oder einen Link) in den `PATH`, die `.desktop`-Datei in `~/.local/share/applications` und das Icon in ein Icon-Theme-Verzeichnis. `--run` startet die App nach dem Paketieren.

<a id="embedding-in-a-gtk-app"></a>

## In eine GTK-App einbetten

Das Crate `nsh-platform-linux` (aus dem NSH-Repository) gibt einer Rust-GTK-App `AppView`: eine NSH-Engine als GTK-Widget. Jede `AppView` ist unabhängig; mehrere können gleichzeitig laufen. Sie führt ein Rust-Root aus, die Root-Komponente Ihres Crates:

```rust
use std::rc::Rc;
use nsh_platform_linux::{gtk4 as gtk, set_ui_sets, AppOptions, AppView, Root};
use gtk::prelude::*;

fn main() -> gtk::glib::ExitCode {
    // Once, before the first view: the UI sets the apps import (NSH's and your crate's).
    set_ui_sets(vec![nsh_base::registry(), my_app::registry()]);
    let app = gtk::Application::builder().application_id("com.example.host").build();
    app.connect_activate(|app| {
        let window = gtk::ApplicationWindow::builder().application(app).default_width(390).default_height(844).build();
        let view = AppView::new(AppOptions::default());
        // register native components here, before loading
        view.load(Root::of::<my_app::App>().into());
        window.set_child(Some(&view.widget()));
        // The window keeps the view; closing it stops the app.
        let keep = std::cell::RefCell::new(Some(Rc::clone(&view)));
        window.connect_destroy(move |_| if let Some(view) = keep.take() { view.stop() });
        window.present();
    });
    app.run()
}
```

`Root::tokens` gibt dem Root sein [Theme](./rust.md#theme), und `Root::app_id` die ID, unter der seine Daten gespeichert werden. Ein TSX-Bundle, das `nsh build` geschrieben hat, wird in dieselbe View geladen, wobei `asset_base` auf sein `assets`-Verzeichnis gesetzt ist:

```rust
use nsh_platform_linux::{AppOptions, AppView, AssetBase, Bundle};

let view = AppView::new(AppOptions {
    asset_base: Some(AssetBase::Directory("app/assets".into())),
    ..AppOptions::default()
});
let code = std::fs::read_to_string("app/bundle.js").expect("bundle");
view.load(Bundle::source(code).into());
```

`AppView::load` ersetzt, was zuvor lief; `stop` beendet die App. `asset_base` teilt ihr mit, wo `asset:/`-URIs aufgelöst werden (`AssetBase::Directory` oder `AssetBase::Http`). Bytecode-Bundles (`bundle.nshc`) werden mit `unsafe { Bundle::bytecode(bytes) }` geladen: QuickJS-Bytecode ist vertrauenswürdige Eingabe, laden Sie ihn daher nur aus den Dateien Ihrer eigenen App. Ein eigenständiges Fenster ist `nsh_platform_linux::run_app(source, options)`, mit `AppSource::Rust(root)` oder `AppSource::Bundle(bundle)`.

`AppOptions::cache` (oder `AppView::set_cache` für die als Nächstes geladenen Apps) legt fest, wo die Apps ihre Caches und die [heruntergeladenen Bilder](./images-and-assets.md#kept-on-disk) ablegen und wie viel jede davon behält (`CacheOptions`: standardmäßig das Cache-Verzeichnis des Systems und 256 MiB für Bilder).

`AppView::set_locale(Some(locale))` und `AppView::set_font_scale(Some(scale))` geben der App Ihre App-Sprache und Ihre Textgröße anstelle der des Systems (`None` folgt wieder dem System): `locale()`, `Intl`, `fontScale()` und Text folgen sofort ([Gerät und Umgebung](./device-and-environment.md#in-an-embedding-app)).

`AppView::set_theme_overrides(Some(json))` legt die Marke Ihrer App über das [Theme](./tailwind.md#theme-tokens) der App: eine Theme-Datei im Format von `nsh.json` aus `"theme"`, deren Tokens im hellen und im dunklen Modus Vorrang vor den gleichnamigen Tokens der App haben, während die übrigen der App erhalten bleiben; Klassen wie `bg-primary` werden sofort neu gestylt, und später geladene Apps starten damit (`None` gibt der App ihr eigenes Theme zurück; eine Datei, die sich nicht parsen lässt, ist ein Fehler und ändert nichts).

Native Komponenten werden mit `AppView::register_component` registriert; siehe [Native Komponenten](./native-components.md#registering-on-linux-rust). `set_ui_sets(sets)` legt die UI-Sets fest, die jede Engine bereitstellt: die von NSH (`nsh_base::registry()`) und die Ihrer Crates (`my_app::registry()`, das `#[native_module]` erzeugt), sodass das TSX, das eine View lädt, auch Ihre Rust-Komponenten und -Module importiert.

<a id="what-differs-on-linux"></a>

## Was unter Linux anders ist

Die Umgebung ist die eines Desktops: Der Safe Area und die Tastaturhöhe sind 0, `idiom()` ist der Desktop (`platform.idiom` ist `"desktop"`), `os_version()` (`platform.version`) ist die Haupt- und Nebenversion des Kernels, und der Dark Mode folgt live der Einstellung des Desktops (über das XDG-Settings-Portal). Siehe [Gerät und Umgebung](./device-and-environment.md).

<a id="keyboard"></a>

### Tastatur

| Tasten | Aktion |
|---|---|
| Return | In einem `Input`, was `submitBehavior` festlegt: absenden (`onSubmit`), absenden und das Feld verlassen oder eine neue Zeile (mehrzeilige Eingaben) |
| Shift+Return, Alt+Return | Eine neue Zeile in einer mehrzeiligen Eingabe, deren Return absendet (Strg+Return sendet ab) |
| Tab, Shift+Tab | Das nächste / vorherige Feld in Bildschirmreihenfolge, innerhalb des neuesten Dialogs |
| Escape | Verlässt das fokussierte Feld; andernfalls hebt es eine Textauswahl auf, dann schließt es den neuesten Dialog oder geht zurück |
| Alt+Links, Zurück-Taste, Zurück-Maustaste | Zurückgehen (auch aus einem Feld) |
| Strg+Pfeiltasten, Pos1 / Ende, mit Shift; Strg+Rückschritt / Entf | In einem Feld wortweise und zeilenweise bewegen, auswählen und löschen, wie in jeder GTK-App |
| Strg+Z, Strg+Shift+Z, Strg+X / C / V / A | Rückgängig, Wiederholen, Ausschneiden, Kopieren, Einfügen, Alles auswählen (ein `masked`-Feld verweigert Ausschneiden und Kopieren); Strg+A / Strg+C wählen auswählbaren Text aus und kopieren ihn |
| Pfeiltasten; Bild auf / ab, Leertaste, Shift+Leertaste; Pos1 / Ende | Scrollen die Scroll View um die fokussierte View oder unter der Maus um eine Zeile, eine Seite, zum Anfang / Ende (nicht, solange ein Feld den Fokus hat) |
| Strg+W, F11, Strg+Q | Fenster schließen, Vollbild, Beenden (`nsh package`- und `nsh run`-Apps) |
| Strg+R | Lädt den neuesten Build neu (`nsh run`) |

Die eigenen Shortcuts der App ([`keymap`](../modules/nsh.md#keymap)) sind ein fensterweiter Shortcut-Controller; Strg+Q und F11 können nicht belegt werden.

Shortcuts funktionieren mit jedem Tastaturlayout (auf einem kyrillischen oder griechischen ist Strg+C die Taste, die auf einem US-Layout C tippt). Ein Return, das die Komposition einer Eingabemethode (Chinesisch, Japanisch, ...) bestätigt, sendet nie ab. `onKeyPress` meldet, was React Native meldet: den eingegebenen Text, `"Enter"`, `"Backspace"` und `"Escape"`; eingefügter Text wird nicht gemeldet.

Web Views sind WebKitGTK-Seiten, die innerhalb der Views von NSH gezeichnet werden: Sheets, Dialoge, Toasts und nachfolgende Views werden über einer Seite gezeichnet, und übergeordnete Views beschneiden sie und blenden sie aus. Ihre Website-Daten (Cookies, Storage, Cache) werden pro App gespeichert, unter `~/.local/share/<app id>/webkit` und `~/.cache/<app id>/webkit`. Die Capability `webview` gilt auch für die Seiten von Frames: Ein `iframe` eines Hosts, der Ihrer App nicht gewährt wurde, bleibt leer. Escape in einer Seite verlässt sie, wie in einem Textfeld (sofern die Seite es nicht selbst verwendet); Alt+Links und die Zurück-Maustaste gehen in der Seite zurück, solange sie einen Verlauf hat.

Nicht unterstützt:

- **Video `rate`**: GTK spielt nur in normaler Geschwindigkeit ab. `onEnd` kommt nur bei Videos, die nicht in einer Schleife laufen.
- **Zoomende Scroll Views** (`zoomTo`, die Zoom-Props).
- **`mixBlendMode` und `backdropFilter`** (die Hintergrundfarbe wird weiterhin gezeichnet); `borderCurve: "continuous"` zeichnet runde Ecken.
- **Input Accessory Views** und die **Statusleiste** (kein Desktop-Äquivalent).
- **Barrierefreiheit**: `accessible`-Gruppierung, benutzerdefinierte `accessibilityActions`; stattdessen werden Live Regions angesagt.

<a id="see-also"></a>

## Siehe auch

- [CLI](./cli.md): `nsh run --target linux`, `nsh package --target linux`
- [Paketierung](./packaging.md)
- [Plattformspezifischer Code](./platform-specific.md)
