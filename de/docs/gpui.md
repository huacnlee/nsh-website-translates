---
title: "GPUI"
description: "Binden Sie Rust- und TSX-NSH-Apps mit AppView in eine GPUI- oder GPUI-Kit-App ein, die von GPUI unter macOS, Windows und Linux gezeichnet wird, testen Sie TSX-Apps im GPUI-Entwicklungshost und erfahren Sie, was das GPUI-Backend anders macht."
order: 15.5
group: platforms
source_hash: 1f281d4fc1a89362
---


# GPUI

Das GPUI-Backend zeichnet NSH-Apps mit [GPUI](https://gpui-kit.com) (GPUI Fast), dem GPU-beschleunigten UI-Framework, auf dem GPUI Kit aufbaut, und zwar unter macOS, Windows und Linux gleichermaßen. Es ist das Backend zum Einbetten in GPUI- und GPUI-Kit-Apps: Ein `AppView` ist eine GPUI-View, sodass eine GPUI- oder GPUI-Kit-App NSH-Apps, ein eigenes Rust-Root oder geladenes TSX, an beliebiger Stelle in ihrem eigenen Elementbaum anzeigen kann. Eigenständige Apps laufen und werden mit dem jeweiligen Desktop-Backend paketiert: [macOS](./macos.md) (AppKit), [Windows](./windows.md) (Win32) und [Linux](./linux.md) (GTK). Der Core, der reaktive Graph, der Renderer, das Taffy-Layout und die nativen Module sind auf allen anderen Plattformen dieselben, sodass eine App überall läuft. `os()` (`platform.os` in TSX) ist das Betriebssystem, auf dem sie läuft (macOS, Windows oder Linux), und die `desktop={{…}}`-Props von TSX gelten.

Jedes Element und jedes Modul der Backends [macOS](./macos.md) (AppKit), [Windows](./windows.md) (Win32) und [Linux](./linux.md) (GTK) ist vorhanden. Wo GPUI etwas auf eigene Weise zeichnet, beschreibt [Differences](#differences) wie.

<a id="how-it-works"></a>

## Funktionsweise

- **Ein Element pro Surface.** Eine Surface ist ein GPUI-Element, das den Platz ausfüllt, den sein Parent ihm gibt, und den gesamten View-Baum mit den Primitiven von GPUI zeichnet: Quads, Schatten, Pfade, Glyphen und Bilder. NSH hält pro Node eine Retained View, wie unter Windows, und zeichnet nur neu, wenn ein Commit etwas verändert hat.
- **Text wird auf dem Engine-Thread geshapet**, mit dem Textsystem von GPUI (den eigenen Schriften der App), von NSH in Zeilen umgebrochen; der Main-Thread zeichnet nur noch die Glyphen.
- **Ein Hop pro Commit.** Die Engine läuft auf einem eigenen Thread; jeder Commit ist eine Closure, die an den Main-Thread von GPUI gesendet wird und die View benachrichtigt.
- **Eingaben** kommen aus den Maus-, Scroll-, Tasten- und Input-Method-Events von GPUI; Hit-Testing, Presses, das Responder-System, Scrollen und Textbearbeitung folgen derselben Logik wie im Windows-Backend.

<a id="requirements"></a>

## Voraussetzungen

- macOS, Windows oder Linux, mit einer GPU, mit der GPUI zeichnen kann (Metal unter macOS, DirectX unter Windows, Vulkan unter Linux).
- Unter macOS benötigt das Bauen Ihrer GPUI-App oder der Runtime aus einem Checkout die Metal Toolchain von Xcode (`xcodebuild -downloadComponent
  MetalToolchain`), which compiles GPUI's shaders ahead of time. On a Mac without it, `nsh run` baut
  die Runtime mit dem GPUI-Feature `runtime-shaders` und weist darauf hin: Die Shader werden beim Start der App kompiliert (beim ersten Mal ein Sekundenbruchteil, danach von macOS gecacht).
- Unter Linux: ein Vulkan-Treiber, Wayland oder X11 mit `libxkbcommon`, GTK 3 und WebKitGTK 4.1 (Web Views) sowie GStreamer
  1.20 oder neuer mit den Base- und Good-Plug-ins (Videos). Web Views benötigen X11: Auf einem Wayland-Desktop starten Sie die App unter
  Xwayland (`WAYLAND_DISPLAY=` leer), sonst zeigen sie einen Platzhalter. Das Bauen der Runtime aus einem Checkout benötigt außerdem
  die Entwicklungspakete; unter Debian und Ubuntu:

  ```sh
  sudo apt-get install clang libclang-dev pkg-config libfontconfig-dev libfreetype-dev libwayland-dev libx11-xcb-dev \
    libxcb1-dev libxkbcommon-dev libxkbcommon-x11-dev libzstd-dev libvulkan1 libgtk-3-dev libwebkit2gtk-4.1-dev \
    libgstreamer1.0-dev libgstreamer-plugins-base1.0-dev gstreamer1.0-plugins-good
  ```

<a id="running-an-app"></a>

## Eine App ausführen

Eine Rust-App läuft innerhalb Ihrer GPUI-App: Betten Sie ihr Root mit `AppView` ein ([Embedding in a GPUI app](#embedding-in-a-gpui-app)) und `cargo run` Sie die GPUI-App; Ihr Crate und die App sind ein gemeinsamer Cargo-Build. Eigenständig läuft eine Rust-App mit dem Backend des jeweiligen Betriebssystems (`nsh run --target macos`, `windows` oder `linux`).

Eine TSX-App läuft im GPUI-Development-Host:

```sh
nsh run App.tsx --target gpui
```

Er öffnet die App in einem GPUI-Fenster (standardmäßig 1200×800), so wie eine GPUI-App sie anzeigt, die sie einbettet, mit Hot Reload, Logs im Terminal und dem Error-Overlay wie bei den anderen Targets. Der Development-Host (`nsh-gpui-host`) läuft auf jedem Betriebssystem direkt am Ort, ohne App-Bundle drumherum. In einem Checkout baut `nsh run` ihn zuerst; die Distribution liefert ihn in `runtime/gpui/` mit. Der Host führt außerdem ein gebautes Bundle eigenständig aus:

```sh
nsh build my-app --release -o build
dist/nsh/runtime/gpui/nsh-gpui-host --bundle build/bundle.nshc --window-size 390x844   # in a checkout: target/debug/nsh-gpui-host
```

`--window-size` ist die Größe des Fensters in Punkten (`<width>x<height>`).

<a id="packaging"></a>

## Paketierung

Eine GPUI-App liefert NSH innerhalb ihrer eigenen ausführbaren Datei aus: Sie bettet das Rust-Root oder das TSX-Bundle der App mit `AppView` ein ([Embedding in a GPUI app](#embedding-in-a-gpui-app)) und wird als die GPUI-App gebaut und verteilt, die sie ist. Eine eigenständige NSH-App wird mit dem Target des jeweiligen Betriebssystems paketiert: [`--target macos`](./macos.md#packaging), [`--target windows`](./windows.md#packaging) oder [`--target linux`](./linux.md#packaging) ([Packaging](./packaging.md)).

Unter Linux linkt eine GPUI-App mit Web Views und Videos WebKitGTK 4.1 und GStreamer dynamisch, sodass die Rechner, auf denen sie läuft, diese installiert haben müssen, dazu GTK 3 sowie die Base- und Good-Plug-ins von GStreamer (Debian / Ubuntu: `libwebkit2gtk-4.1-0`, `libgstreamer1.0-0`, `libgstreamer-plugins-base1.0-0`, `gstreamer1.0-plugins-good`), außerdem einen Vulkan-Treiber und `libxkbcommon`.

<a id="embedding-in-a-gpui-app"></a>

## In eine GPUI-App einbetten

Das Crate `nsh-platform-gpui` (aus dem NSH-Repository) gibt einer Rust-GPUI-App `AppView`: eine NSH-Engine als GPUI-View (`Entity<AppView>`), die den Platz ausfüllt, den ihr Parent-Element ihr gibt. Jedes `AppView` ist unabhängig; mehrere können gleichzeitig laufen. Es führt ein Rust-Root aus, die Root-Komponente Ihres Crates:

```rust
use gpui::{AppContext, WindowOptions};
use nsh_platform_gpui::{set_ui_sets, App, AppOptions, AppView, Root};

// Once, before the first view: the UI sets the apps import (NSH's and your crate's).
set_ui_sets(vec![nsh_base::registry(), my_app::registry()]);
gpui_platform::application().run(|cx| {
    cx.open_window(WindowOptions::default(), |window, cx| {
        cx.new(|cx| {
            let view = AppView::new(AppOptions::default(), window, cx);
            view.load(App::Rust(Root::of::<my_app::App>()));
            view
        })
    })
    .unwrap();
});
```

`Root::tokens` gibt dem Root sein [Theme](./rust.md#theme) (`nsh_base::Theme::from_json(json)?.into_tokens()`, `Theme` wird hier re-exportiert) und `Root::app_id` die ID, unter der seine Daten gespeichert werden. Ein TSX-Bundle, das `nsh build` geschrieben hat, lässt sich in dieselbe View laden:

```rust
use nsh_platform_gpui::{App, Bundle};

let code = std::fs::read_to_string("app/bundle.js").expect("bundle");
view.load(App::Js(Bundle::source(code)));
```

Setzen Sie die Entity wie jede andere View in Ihren Elementbaum (ein GPUI-Kit-`Root`, ein Panel, ein Dock). `AppView::load` ersetzt, was zuvor lief; `stop` (oder das Verwerfen der View) beendet die App. `AppOptions::asset_base` legt fest, wo `asset:/`-URIs aufgelöst werden (`AssetBase::Directory` oder `AssetBase::Http`). Bytecode-Bundles (`bundle.nshc`) werden mit `unsafe { Bundle::bytecode(bytes) }` geladen (oder `Bundle::read_trusted(path)`, ebenfalls unsafe): QuickJS-Bytecode ist vertrauenswürdige Eingabe, laden Sie ihn daher nur aus den eigenen Dateien Ihrer App.

- `open_app_window(source, options, cx)` öffnet in einer laufenden GPUI-App ein Fenster mit einem `AppView`.
- `run_app(source, options)` startet GPUI und führt eine App in einem Fenster aus, bis es geschlossen wird (das, was der Development-Host tut).
- `AppView::register_component(name, factory)` registriert vor dem Laden eine eigene native Komponente von Ihnen ([Native components](./native-components.md)).
- `AppOptions::cache` (oder `AppView::set_cache`, für die als Nächstes geladenen Apps) legt fest, wo die Apps ihre Caches ablegen, die [Bilder, die sie herunterladen](./images-and-assets.md#kept-on-disk), und wie viel jede davon behält: `CacheOptions { location,
  images }`, `CacheLocation::System` (the default), `Dir(path)` or `Off`, `CachePolicy::Default` (256 MiB), `MaxSize(ByteSize::mib(n))` oder `Off`.
- `AppView::host()` ist der Kanal der View zu den Apps, die sie ausführt ([`host`](../modules/nsh.md#host)), ein `HostChannel`, den jeder Thread nutzen darf: `set_params(map)` vor dem Laden gibt der App ihre Startparameter (`host.params`), `send(name, data)` ein Event (`host.on`), und `handle(name, |call| …)` beantwortet ihre `host.call(name, data)` und hört ihre `host.post` (`call.resolve(json)`, `call.reject(message)`, sofort oder später von einem beliebigen Thread). Handler laufen auf dem Engine-Thread: Geben Sie den Aufruf an Ihre GPUI-Entities weiter (ein Kanal, den ein `cx.spawn`-Task liest) und antworten Sie von dort. Die `AppView`s für macOS, Windows und Linux haben dasselbe `host()`. Ihr `handle_open_url(|request| …)` sieht die URLs, die die App öffnet ([`openUrl`](../modules/nsh.md#openurl)), bevor das System sie sieht: `request.handled()`, wenn Ihre App die URL selbst weitergeleitet hat, `request.decline()` (oder das Verwerfen der Anfrage), damit das System sie mit dem `open_url` von GPUI öffnet.
- `AppOptions::limits` (oder `AppView::set_limits`, für die als Nächstes geladenen Apps) legt die VM-Limits fest: den JS-Heap, den Stack, die Zeitbudgets und das Node-Kontingent ([Sandbox and capabilities](./sandbox-and-capabilities.md)). Eingebettete Apps erhalten `Limits::default()` (ein 256-MB-Heap); der Development-Host führt Apps eigenständig aus, mit `Limits::standalone()`.
- `AppOptions::transparent` macht die View durchsichtig: Sie zeichnet keinen Fensterhintergrund, und `open_app_window` / `run_app` öffnen ein transparentes Fenster, sodass das, was die App unbemalt lässt, zeigt, was hinter dem Fenster liegt (Desktop-Widgets, Overlays). Standardmäßig false.
- `AppView::connect_dev_server(url, cx)` (Feature `dev`) lädt die App aus `nsh dev` und lädt sie beim Bearbeiten neu, mit dem Error-Overlay über der View; `AppView::on_error` hört weiterhin die Fehler der App.
- `AppView::on_app_error(|error| …)` hört die Fehler der App: `error.kind` (die App konnte nicht geladen werden, eine nicht abgefangene Exception, die VM wurde gestoppt), `error.is_fatal()`, wenn kein JS der App mehr läuft, `error.message`, `error.stack` und `error.package` (die ID und der Build des signierten Pakets, aus dem sie stammt). `AppView::on_error` erhält dieselben Fehler als Text.
- `AppView::set_locale(locale, cx)` und `AppView::set_font_scale(scale, cx)` geben der App die Sprache und Textgröße Ihrer App anstelle der des Systems (`None` folgt wieder dem System): `locale()`, `Intl`, `fontScale()` und Text folgen sofort ([Device and environment](./device-and-environment.md#in-an-embedding-app)).
- `AppView::run_package(&package)` führt ein [signiertes Paket](./signed-packages.md#loading-packages-in-a-host-app) aus `verify_package` oder `load_package` aus; `accept_package` hält fest, dass Ihre App es für fehlerfrei befunden hat.
- `set_ui_sets(sets)` legt die UI-Sets fest, die jede Engine bereitstellt: die von NSH (`nsh_base::registry()`) und die Ihrer Crates (`my_app::registry()`, das `#[native_module]` erzeugt; [Building with Rust](./rust.md)), und gibt die eigenen Sets Ihrer App: Eine App erreicht die Funktionen und Klassen eines Sets per Name mit [`nativeModule`](../modules/nsh.md#nativemodule) und wird mit dem Standard-`nsh build` gebaut. Das `examples/embed-gpui` des Repositorys betreibt auf diese Weise einen Trading Desk im Host, den zwei eingebettete Order-Tickets und die eigenen Widgets des Hosts gemeinsam nutzen.

<a id="differences"></a>

## Unterschiede

Was anders zeichnet oder sich anders verhält als bei den nativen Desktop-Backends:

- **Transforms**: Gedrehte, geneigte und projizierte Views drehen ihre Hintergründe, Rahmen und Schatten mit, aber Text bleibt aufrecht, und Bilder, Videos und Canvases werden an ihren Bounds gezeichnet.
- **Opacity** wird auf jede Farbe angewendet statt auf eine Gruppe, sodass sich überlappende Kinder einer durchscheinenden View gegenseitig durchscheinen lassen; die Opacity eines Bildes (ein Einblenden, eine durchscheinende View) ändert sich in Sechzehnteln.
- **Abgerundete Clips** (`overflow: "hidden"` mit Radius) runden die Hintergründe und Bilder der Kinder ab, aber Text, Rahmen, Videos und native Komponenten werden vom Rechteck abgeschnitten.
- **Nicht gezeichnet**: `filter: blur()`, `backdropFilter` und `mixBlendMode`; Schatten scheinen durch durchscheinende Füllungen hindurch; `borderCurve: "continuous"` zeichnet kreisrunde Ecken.
- **Canvas-Text** wird angenähert: aufrecht bei Rotationen, bei `maxWidth` kleiner statt schmaler gemacht, Verläufe zeichnen ihn einfarbig, `strokeText`-Füllungen, seine Schatten sind nicht weichgezeichnet, und Kompositionsoperationen sowie `clearRect` werden darauf nicht angewendet.
- **Scroll Views** zoomen nicht (`zoomTo` und die Zoom-Props werden ignoriert).
- **Video** wird unter Linux abgespielt (GStreamer); unter macOS und Windows zeigt ein Video einen Platzhalter und meldet `onError`.
- **Web Views** sind native Views oberhalb von allem, was NSH an ihrer Stelle zeichnet. Unter Linux benötigen sie X11 (siehe [Requirements](#requirements)); wo Seiten unter Xwayland schwarz bleiben („Failed to create GBM buffer“ im Log), starten Sie die App mit `WEBKIT_DISABLE_DMABUF_RENDERER=1`. Unter macOS und Windows schneiden clippende Vorfahren sie nicht ab, und fehlgeschlagene Ladevorgänge melden kein `onError`. `baseUrl`, `scrollable` und `allowsBackForwardNavigationGestures` werden nicht unterstützt.
- **Accessibility** läuft über AccessKit: Screenreader können überall Elemente aktivieren, fokussieren, Werte setzen und Elemente in den sichtbaren Bereich scrollen; benutzerdefinierte Aktionen und die Kontextmenü-Aktion werden noch nicht weitergegeben.

Zum Vergleich die jeweilige Liste jedes nativen Backends: [macOS](./macos.md#what-differs-on-macos), [Windows](./windows.md#what-differs-on-windows), [Linux](./linux.md#what-differs-on-linux).

<a id="see-also"></a>

## Siehe auch

- [Building with Rust](./rust.md): das Crate, dessen Root eine GPUI-App einbettet
- [CLI](./cli.md): `nsh run --target gpui`
- [Packaging](./packaging.md): eigenständige Apps, mit dem Target des jeweiligen Betriebssystems
- [Platform overview](./platforms.md)
