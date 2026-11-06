---
title: "Erste Schritte"
description: "Erstellen Sie eine App in Rust oder TSX mit nsh init, führen Sie sie unter iOS, Android, macOS, Windows, Linux oder im Web aus, hosten Sie TSX-Module in Ihrer App und liefern Sie sie als signierte Pakete aus, oder paketieren Sie die App eigenständig."
order: 4
group: start
demo: guide-getting-started
source_hash: 57c002bb7e893547
---


# Erste Schritte

Dieser Leitfaden erstellt eine NSH-App, führt sie auf den Zielplattformen aus und liefert sie aus. NSH-Apps werden in Rust oder TSX geschrieben, auf derselben Engine: Rust kompiliert deine App zu nativem Code ohne JavaScript-VM, und TSX läuft auf QuickJS mit Hot Updates, als Module, die eine native App zur Laufzeit laden kann. Der Leitfaden behandelt zuerst eine Rust-App, dann dieselbe App in TSX. Er setzt voraus, dass `nsh` installiert ist und in deinem `PATH` liegt ([Installation](./installation.md)); in einem Checkout verwendest du stattdessen `./target/debug/nsh`.

> [!TIP]
> Kein App-Projekt zur Hand? Die ersten beiden Abschnitte brauchen keines: `nsh run` zeigt die App in einem Fenster auf deinem Computer, im iOS-Simulator, auf einem Android-Gerät oder im Browser. Du kannst dort aufhören oder [sie als eigenständige App verpacken](#or-ship-it-as-a-standalone-app).

<a id="create-an-app"></a>

## App erstellen

In einem Terminal fragt `nsh init`, in welcher Sprache die App geschrieben wird: `rust`, `ts` oder `mixed` (TSX mit einem eigenen Rust-Crate). `--template` wählt ohne Nachfrage.

### In Rust

```sh
nsh init my-app --template rust
```

`nsh init` erstellt das Verzeichnis und schreibt ein Cargo-Projekt:

| Datei | Was sie ist |
|---|---|
| `src/lib.rs` | Die App: ihre Root-Komponente, State und Handler |
| `src/main.rs` | Mountet dieselbe Root unter macOS, Windows oder Linux für `cargo run` |
| `Cargo.toml` | Das Crate, abhängig von `nsh-core` und `nsh-base` in der Version der CLI |
| `nsh.json` | Name, ID, Version und Build-Nummer der App, ihr Crate (`"rust": "."`) und die Root-Komponente (`"root": "App"`) ([Project structure](./project-structure.md#nshjson)) |
| `App.test.tsx` | Der Test der Root, in TypeScript (`nsh test`), mit `tsconfig.json` und `.nsh/types` für deinen Editor |
| `README.md` | Wie man die App ausführt, testet und paketiert und wie man später einen TSX-Einstiegspunkt hinzufügt |
| `.gitignore` | Ignoriert `.nsh/` und `target/` |

Die Rust-Entwicklung braucht eine Rust-Toolchain ([rustup](https://rustup.rs)); die `nsh`-Befehle bauen die Runner der App aus den Crates von NSH auf crates.io, in der Version der CLI.

### In TSX

```sh
nsh init my-app --template ts
```

Eine TSX-App besteht aus einer oder mehreren `.tsx`-Dateien mit einem Einstiegspunkt: dem, was `nsh run` ausführt und was eine Host-App als Modul lädt.

| Datei | Was sie ist |
|---|---|
| `App.tsx` | Das Einstiegsmodul: rendert die App mit `mount` |
| `App.test.tsx` | Sein Test (`nsh test`) |
| `nsh.json` | Name, ID, Version und Build-Nummer der App ([Project structure](./project-structure.md#nshjson)) |
| `tsconfig.json` | Erweitert `.nsh/tsconfig.json`, die TypeScript-Einstellungen von NSH, die `nsh` auf die Deklarationen in `.nsh/types` auflösen |
| `.gitignore` | Ignoriert `.nsh/` und `target/` |
| `.nsh/types/` | Generierte Deklarationen aller NSH-Module, für deinen Editor |

Bereits vorhandene Dateien bleiben erhalten, du kannst den Befehl also in einem Verzeichnis ausführen, in dem einige davon schon liegen; eine Rust-App wird in einem neuen Verzeichnis erstellt.

Für beide gilt: Der Anzeigename ist standardmäßig der Name des Verzeichnisses; mit `--name "My App"` wählst du einen anderen. Die ID wird zu `com.example.<name>`: Ändere sie in `nsh.json`, bevor du ausliefern. `nsh init my-app --template mixed` erstellt eine TSX-App, die zugleich ein Rust-Crate ist (`Cargo.toml` und `src/lib.rs` neben `App.tsx`), mit einer Komponente, einem Modul und einer Klasse, die `App.tsx` importiert ([Building with Rust](./rust.md)).

<a id="the-root-component"></a>

### Die Root-Komponente

Die beiden Vorlagen erzeugen dieselbe App, einen Zähler:

```rust tabs
// src/lib.rs
use nsh_base::theme;
use nsh_core::prelude::*;

/// The crate's UI set: what a TSX entry may import from `my-app/native`.
#[native_module("my-app/native")]
fn native(registry: &mut Registry) {
    registry.register::<App>();
}

/// The application's root component.
#[component]
pub fn App() -> impl IntoElement {
    let count = signal(0_u32);
    view()
        .flex_1()
        .bg(move || theme().background)
        .text_color(move || theme().foreground)
        .child(
            view()
                .flex_1()
                .p_safe_area()
                .child(
                    view()
                        .flex_1()
                        .items_center()
                        .justify_center()
                        .gap_4()
                        .child(text(move || format!("Count: {}", count.get())).text_size(px(28.0)))
                        .child(
                            view()
                                .px_5()
                                .py_3()
                                .rounded(px(10.0))
                                .bg(move || theme().primary)
                                .active(|s| s.opacity(0.6))
                                .on_press(move || count.update(|value| *value += 1))
                                .child(
                                    text("Tap")
                                        .text_size(px(17.0))
                                        .text_color(move || theme().primary_foreground),
                                ),
                        ),
                ),
        )
}
```

```tsx tabs
// App.tsx
import { mount, signal, Text, View } from "nsh";

function App() {
  const count = signal(0);
  return (
    <View class="flex-1 items-center justify-center gap-4 bg-background pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <Text class="text-3xl font-semibold text-foreground">{count()}</Text>
      <View
        onPress={() => count.update((c) => c + 1)}
        role="button"
        class="rounded-(--radius) bg-primary px-5 py-3 active:bg-primary/90"
      >
        <Text class="text-lg text-primary-foreground">Tap</Text>
      </View>
    </View>
  );
}

mount(App);
```

In Rust:

- **`use nsh_core::prelude::*`** bringt die Primitive (`view()`, `text()`, `scroll()`, `input()`, `image()`, ...), [Signals](./reactivity.md) und die typisierten Style-Methoden mit (`.p_safe_area()` versieht eine View mit Innenabstand um die [Safe Area](../elements/safe-area.md)); **`nsh_base`** enthält die ungestylten Basiskomponenten (`button()`, die Tastatur, Dialoge) sowie `theme()`, die Farben und Radien, mit denen die Komponenten der App zeichnen ([Theme](./rust.md#theme)).
- **`#[component] pub fn App()`** ist eine Komponente: eine Funktion, die **einmal** läuft und ihre Elemente zurückgibt. `"root": "App"` von `nsh.json` benennt sie, und `nsh run` mountet sie. `signal(0_u32)` erzeugt einen Wert, der sich im Lauf der Zeit ändert.
- **`text(move || format!(…, count.get()))`** bindet den Text an das Signal: Ändert sich `count`, führt NSH diese Closure erneut aus und aktualisiert genau diesen einen Text, sonst nichts. Styles nehmen Closures auf dieselbe Weise entgegen: `.bg(move || theme().primary)` folgt dem Theme in den Dark Mode.
- **`.on_press(..)`** lässt die View auf Drücken reagieren; `.active(|s| s.opacity(0.6))` ist ihr Style, solange sie gedrückt ist, nativ angewendet. Der Button gehört der App: NSH stellt die Primitive und die Capabilities bereit, und die App zeichnet daraus ihre UI.
- **`.px_5()`, `.rounded(px(10.0))`, `.gap_4()`** sind typisierte Style-Methoden, benannt wie die Utilities von Tailwind, in Punkten (`px`). Das Layout basiert auf Flexbox, und Kinder werden standardmäßig in einer Spalte gestapelt ([Layout](./layout.md)).
- **`#[native_module("my-app/native")]`** legt fest, was ein TSX-Einstiegspunkt aus dem Crate importieren darf, für den Fall, dass du später TSX-Screens darüberlegst ([Building with Rust](./rust.md#extending-a-rust-app-with-tsx)).

In TSX:

- **`import { mount, signal, Text, View } from "nsh"`**: `nsh` ist das Kernmodul: Signals, `mount`, die übrigen reaktiven Primitive und die Host-Elemente. Es wird von der nativen Runtime bereitgestellt, nicht gebündelt. **`nsh/base`** enthält die Basiskomponenten, so wie `nsh_base` in Rust.
- **`function App()`** ist eine Komponente, die **einmal** läuft. **`{count()}`** liest das Signal innerhalb von JSX: Der Compiler erkennt einen Aufruf und lässt diesen Text dem Signal folgen.
- **`<View onPress>`** ist eine native View, die auf Drücken reagiert; `active:`-Klassen sind ihr Style, solange sie gedrückt ist. `View`, `Text`, `Image`, `Scroll` und die übrigen [Host-Elemente](../elements/index.md) werden aus `nsh` importiert (`Input` aus `nsh/base`); nur `If` und `Each` brauchen keinen Import.
- **`class`** nimmt [Tailwind](./tailwind.md)-Klassen entgegen; `style={{ … }}` nimmt ein Objekt mit Style-Eigenschaften in camelCase entgegen, mit Zahlen in Punkten. `bg-background`, `bg-primary`, `text-primary-foreground` und `rounded-(--radius)` benennen die Tokens des Themes der App ([Theme tokens](./tailwind.md#theme-tokens)): Sie folgen dem Dark Mode von selbst, und `"theme"` in `nsh.json` gestaltet sie um.
- **`mount(App)`** rendert die Komponente in die Oberfläche der App.

> [!IMPORTANT]
> Text erscheint in einem Text-Element: `text(..)` in Rust, `<Text>` in TSX. In TSX ist Text, der direkt in einem `<View>` steht (`<View>Hello</View>`), ein Build-Fehler, der darauf zeigt, und ein String, den ein Ausdruck dort platziert (`<View>{name}</View>`), wird im Log gemeldet.

<a id="develop-it"></a>

## Entwickeln

<a id="run-it"></a>

### Ausführen

`nsh run` baut die App, startet sie und baut sie beim Bearbeiten neu; die Logs der App erscheinen im Terminal. Gib ihm das Verzeichnis der App: Es führt die Root einer Rust-App aus oder das `App.tsx` einer TSX-App (`nsh run my-app/App.tsx` benennt einen anderen Einstiegspunkt).

Bei einer Rust-App baut `nsh run` den App-eigenen Runner für das Ziel, mit deinem Crate und der gemounteten Root und ohne QuickJS, und startet ihn; bei einer Änderung am Rust-Code wird neu gebaut und die App neu gestartet. `cargo run` im Verzeichnis der App startet dieselbe Root direkt auf dem Desktop-Backend. Bei einer TSX-App startet `nsh run` einen Dev-Server und einen Entwicklungs-Host, der die App von dort lädt, und patcht die laufende App bei jedem Speichern.

Ohne `--target` nutzt `nsh run` den Rechner, auf dem du arbeitest: ein AppKit-Fenster unter macOS, ein Win32-Fenster unter Windows und ein GTK-Fenster unter Linux. Mit `--target` wählst du eine andere Plattform:

| Ziel | Befehl | Läuft auf |
|---|---|---|
| iOS-Simulator | `nsh run my-app --target ios` | macOS mit Xcode |
| Android | `nsh run my-app --target android` | macOS, Windows, Linux |
| macOS (AppKit) | `nsh run my-app` | macOS (Standard) |
| Windows | `nsh run my-app` | Windows (Standard) |
| Linux (GTK 4) | `nsh run my-app` | Linux (Standard) |
| Web | `nsh run my-app --target web` | macOS, Windows, Linux |
| Mac Catalyst | `nsh run my-app --target catalyst` | macOS |

#### iOS-Simulator

```sh
nsh run my-app --target ios
nsh run my-app --target ios --device "iPhone 16 Pro"
```

`nsh` verwendet einen gebooteten Simulator oder bootet das neueste iPhone, falls keiner läuft, und installiert die App (den Runner einer Rust-App oder den Entwicklungs-Host) darin. `--device` wählt einen Simulator nach Name oder UDID.

#### Android

```sh
nsh run my-app --target android
```

Starte zuerst einen Emulator oder verbinde ein Gerät (`adb devices` listet sie auf; NSH verwendet das erste). `nsh` installiert die App darauf: das eigene `libnsh.so` einer Rust-App oder ein APK des Entwicklungs-Hosts (nur neu gebaut, wenn sich die Runtime ändert), dessen Dev-Server-Port per `adb reverse` an das Gerät weitergeleitet wird, sodass es über USB ohne gemeinsames Netzwerk funktioniert.

#### macOS (AppKit)

```sh
nsh run my-app --target macos
```

Die App öffnet sich als Desktop-Mac-App (AppKit, in einem Fenster mit veränderbarer Größe), mit Maus-, Trackpad- und Tastatureingabe statt Touch. Sie erfordert macOS 14 oder neuer; siehe [macOS](./macos.md).

<a id="windows-default-on-windows"></a>

#### Windows (Standard unter Windows)

```sh
nsh run my-app
```

Die App öffnet sich in einem Desktop-Fenster (1200×800 Punkte), mit Maus-, Touchpad-, Touch- und Tastatureingabe. Sie erfordert Windows 10 1809 oder neuer; siehe [Windows](./windows.md).

<a id="linux-default-on-linux"></a>

#### Linux (Standard unter Linux)

```sh
nsh run my-app
```

Die App öffnet sich in einem GTK-Fenster (390×844 Punkte). Sie erfordert GTK 4.14 oder neuer; siehe [Linux](./linux.md).

#### Web

```sh
nsh run my-app --target web
```

`nsh` gibt die Adresse der Seite aus; öffne sie in einem Browser. Eine Rust-App läuft als WebAssembly mit deinem Crate, und die geöffnete Seite lädt nach einer Änderung den neuen Build von selbst; siehe [Web](./web.md).

#### Mac Catalyst

```sh
nsh run my-app --target catalyst
```

Die App öffnet sich in einem Fenster in iPhone-Größe (390×844 Punkte) auf deinem Mac. Das ist der schnellste Weg, eine App so zu sehen, wie ein Telefon sie zeigt: kein Simulator, der gebootet werden muss. Sie nutzt UIKit wie iOS, du siehst also, was ein iPhone zeigt, abgesehen von Mac-spezifischem Verhalten wie dem Scrollen mit dem Mausrad. Für die Mac-App selbst verwendest du `--target macos`.

<a id="edit-it"></a>

### Bearbeiten

Lass `nsh run` laufen und ändere die Beschriftung des Buttons:

```rust tabs
text("Add one")
    .text_size(px(17.0))
    .text_color(move || theme().primary_foreground)
```

```tsx tabs
<Text style={{ color: "white", fontSize: 17 }}>Add one</Text>
```

Speichere. Eine Rust-App wird neu gebaut und startet mit der neuen Beschriftung neu; der Zähler beginnt von vorn. Eine TSX-App erhält ein Hot Update: Die CLI baut neu und sendet einen Patch, und der Host führt das geänderte Modul erneut aus und rendert nur die Komponenten neu, deren Code sich geändert hat. Hier ist das `App`, das das Signal `count` besitzt, sodass der Zähler ebenfalls von vorn beginnt.

UI-Teile wandern in eigene Komponenten oder in einfache Funktionen, die Elemente zurückgeben:

```rust tabs
/// The app's button: a view that answers presses.
fn tap_button(on_press: impl Fn() + 'static) -> impl IntoElement {
    view()
        .p_3()
        .rounded(px(10.0))
        .bg(move || theme().primary)
        .active(|s| s.opacity(0.6))
        .on_press(on_press)
        .child(text("Tap").text_size(px(17.0)).text_color(move || theme().primary_foreground))
}

// In App: .child(tap_button(move || count.update(|value| *value += 1)))
```

```tsx tabs
function TapButton(props: { onPress: () => void }) {
  return (
    <View onPress={props.onPress} activeStyle={{ opacity: 0.6 }} style={{ padding: 12, borderRadius: 10, backgroundColor: "#0969da" }}>
      <Text style={{ color: "white", fontSize: 17 }}>Tap</Text>
    </View>
  );
}

// In App: <TapButton onPress={() => count.update((c) => c + 1)} />
```

In TSX bleibt der State erhalten, wenn du eine Komponente bearbeitest, die ihn nicht besitzt: Tippe ein paar Mal und ändere dann die Farbe von `TapButton`; der Button wird aktualisiert, während der Zähler bleibt. Das Hot Replacement funktioniert pro Top-Level-Komponente: eine Funktion mit großgeschriebenem Namen, deren Rumpf JSX enthält. Eine Komponente wird neu gerendert, wenn sich ihr eigener Code ändert oder wenn sich der Code des Moduls außerhalb von Komponenten ändert (eine verwendete Konstante, ein Helper). Lässt sich eine Änderung nicht an Ort und Stelle anwenden (zum Beispiel, weil sie ein NSH-Modul importiert, das die laufende App noch nicht importiert hatte, oder die Capabilities von `nsh.json` ändert), lädt der Host die gesamte App neu.

<a id="errors"></a>

#### Fehler

Ein Rust-Kompilierfehler wird im Terminal mit der Ausgabe von cargo ausgegeben, und `nsh run` baut beim nächsten Speichern erneut. Ein TSX-Build-Fehler wird im Terminal ausgegeben und auf dem Gerät als rotes Overlay mit Datei, Zeile und Spalte angezeigt; die App läuft mit dem letzten fehlerfreien Build weiter. Das Overlay verschwindet mit dem nächsten erfolgreichen Build (tippe darauf, um es früher zu schließen). Eine zur Laufzeit geworfene Exception wird auf dieselbe Weise angezeigt, mit ihrem Stack, der auf deinen `.tsx`-Quelltext zurückgeführt wird.

<a id="host-it-in-your-app"></a>

## In deine App einbetten

Eine native App zeigt NSH in einer eigenen View: `NshAppView` (ein `UIView`) unter iOS, `NshView` (ein Android-`View`) unter Android, `AppView` unter macOS, Windows, Linux und in GPUI-Apps. Platziere sie wie jede andere View, auf jedem Screen, so oft du willst.

Eine Rust-Root ist Teil des Builds der App: Die App linkt dein Crate und mountet die Root mit `AppSource::Rust` auf dem `AppView` von macOS, Windows, Linux, GPUI und iOS ([Building with Rust](./rust.md#an-app-written-in-rust)). Eine TSX-App ist ein Modul, das die View lädt: während der Entwicklung vom Dev-Server, in einem Release aus einem gebauten Bundle oder einem heruntergeladenen, signierten Paket. Die folgenden Abschnitte laden TSX-Module.

### iOS

Linke `NativeShellDev.xcframework` in Debug und `NativeShell.xcframework` in Release ([Embedding in iOS apps](./ios.md)), dann:

```swift
import NativeShell

let app = NshAppView()
app.onError = { message in print("nsh error: \(message)") }
view.addSubview(app)   // and constrain it like any view

#if DEBUG
try app.connectDevServer(URL(string: "ws://127.0.0.1:8790/ws")!)   // `nsh dev my-app` on your Mac
#else
try app.loadBundle(at: Bundle.main.url(forResource: "bundle", withExtension: "nshc", subdirectory: "nsh")!)
#endif
```

`nsh dev my-app` stellt der App das Modul bereit und überträgt jedes Speichern, so wie `nsh run` es mit seinem eigenen Host tut. Für den Release-Build schreibt `nsh build my-app --release --out MyApp/nsh` das Bundle in einen Ordner, den du zu den Ressourcen der App hinzufügst.

### Android

Füge `nsh-dev.aar` für Debug-Builds und `nsh.aar` für Release-Builds hinzu ([Embedding in Android apps](./android.md)), dann:

```kotlin
val nsh = NshView(this)
nsh.setErrorListener { message -> Log.e("nsh", message) }
setContentView(nsh)   // or add it to any layout

if (BuildConfig.DEBUG) {
    nsh.connectDevServer("ws://127.0.0.1:8790/ws")   // with `adb reverse tcp:8790 tcp:8790`
} else {
    nsh.loadAssetBundle("nsh")   // assets/nsh, from `nsh build my-app --release --out app/src/main/assets/nsh`
}
```

<a id="macos-windows-and-linux"></a>

### macOS, Windows und Linux

In Rust geschriebene Desktop-Apps betten NSH mit `AppView` ein, aus den Crates `nsh-platform-macos`, `nsh-platform-windows`, `nsh-platform-linux` und `nsh-platform-gpui`: ein `NSView`, ein Kindfenster, ein GTK-Widget oder eine GPUI-View, die eine Rust-Root mountet oder ein gebautes Bundle lädt. Siehe [macOS](./macos.md#embedding-in-a-mac-app), [Windows](./windows.md#embedding-in-a-win32-app), [Linux](./linux.md#embedding-in-a-gtk-app) und [GPUI](./gpui.md) sowie [Platforms](./platforms.md#embed-in-a-native-app) für alle Hosts im Vergleich.

<a id="what-the-module-may-do"></a>

### Was das Modul darf

Unter iOS und Android entscheidet der Host vor dem Laden, was ein Modul tun darf: `grantCapabilities` legt die Netzwerk-Hosts und anderen Capabilities fest, die es erreichen darf, und Limits begrenzen seinen Speicher, die Aufrufdauer und die Anzahl der Nodes ([Sandbox and capabilities](./sandbox-and-capabilities.md)). Um Modulen eigene native Views bereitzustellen (eine Karte, ein Diagramm, eine Komponente eines Design-Systems), registrierst du sie als [native Komponenten](./native-components.md).

<a id="ship-updates-as-signed-packages"></a>

## Updates als signierte Pakete ausliefern

Ein TSX-Modul, das die App nach dem Release herunterlädt, kommt als signiertes Paket. Erstelle einmal einen Root-Schlüssel und bewahre ihn offline auf, zertifiziere damit einen Release-Schlüssel und veröffentliche:

```sh
nsh keygen keys/root && nsh keygen keys/release
nsh certify --root keys/root.secret --key keys/release.pub --apps 'com.example.*' -o keys/release.cert
nsh publish my-app --key keys/release.secret --cert keys/release.cert --build 2
```

Die App vertraut dem öffentlichen Schlüssel der Root und lädt, was sie herunterlädt; NSH prüft die Signatur, das Zertifikat und die Sperrliste, bevor irgendetwas ausgeführt wird:

```swift
let support = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
let trust = try NshTrust(stateDirectory: support.appendingPathComponent("nsh"))
try trust.addRoot(rootPublicKey)   // the contents of keys/root.pub
let info = try await app.loadPackage(at: downloadedFile, trust: trust)
```

Android hat denselben Ablauf mit `NshTrust` und `NshPackage`. Hosting, Auslieferung und Sperrung im Detail: [Signed packages](./signed-packages.md).
<a id="or-ship-it-as-a-standalone-app"></a>

## Oder als eigenständige App ausliefern

`nsh package` erstellt eine installierbare App, in Rust oder TSX, ohne eigenes Xcode-Projekt oder eigenen Gradle-Build:

```sh
nsh package my-app --target ios-simulator --run
nsh package my-app --target android
nsh package my-app --target macos
nsh package my-app --target linux
nsh package my-app --target windows
nsh package my-app --target web
```

Eine Rust-App wird mit einem eigenen Runner paketiert, der aus deinem Crate und den Crates von NSH gebaut wird und dessen Root eingebunden ist; eine TSX-App mit der vorgefertigten Runtime. Optionen, Signierung und Icons: [Packaging](./packaging.md).

<a id="try-it-in-the-terminal"></a>

## Im Terminal ausprobieren

`nsh test` führt eine App headless aus, ohne Gerät und ohne Fenster. Wenn du das `nsh.json` einer Rust-App oder den Einstiegspunkt einer TSX-App übergibst, öffnet es die App, lässt sie laufen und gibt aus, was sie einbindet; mit `--trace` zusätzlich die nativen View-Operationen und die Dauer jedes Commits ([Testing](./testing-and-trace.md)):

```sh
nsh test my-app/nsh.json --trace     # a Rust app's root
nsh test my-app/App.tsx --trace      # a TSX app's entry
```

Wenn du ein Verzeichnis übergibst, führt es die Tests der App aus: Das `App.test.tsx` jeder Vorlage öffnet die App, drückt ihren Button und prüft, was sie anzeigt (`nsh test my-app`). Der Test einer Rust-App öffnet ihr Root (`open(".")`); sie kann auch in `cargo test` mit `nsh_testing::Headless` getestet werden ([Building with Rust](./rust.md#testing)).

<a id="next-steps"></a>

## Nächste Schritte

- [Building with Rust](./rust.md): Rust-Apps, ihr Theme und TSX auf einem Rust-Crate.
- [JSX and components](./jsx-and-components.md) und [Reactivity](./reactivity.md): Komponenten und Signals, in Rust und TSX.
- [Platforms](./platforms.md): was jede Plattform unterstützt, und ihre jeweils eigene Seite ([iOS](./ios.md), [Android](./android.md), [macOS](./macos.md), [Windows](./windows.md), [Linux](./linux.md)).
- [Signed packages](./signed-packages.md) und [Sandbox and capabilities](./sandbox-and-capabilities.md): Auslieferung und was Module tun dürfen.
- [Project structure](./project-structure.md): was in `nsh.json` gehört, Assets, Dateien.
