---
title: "iOS"
description: "Führen Sie Rust- und TSX-NSH-Apps auf iOS mit UIKit-Views aus, im Simulator oder auf Geräten, verpacken Sie sie als .app und .ipa und binden Sie sie mit AppView oder NshAppView aus NativeShell.xcframework in eine bestehende iOS-App ein."
order: 11
group: platforms
source_hash: d33e715d25f83ce4
---


# iOS

NSH-Apps laufen unter iOS mit UIKit-Views und CoreText-Text, auf Geräten und im Simulator, ab iOS 15.0. Ganze Apps laufen und werden verpackt wie auf den anderen Plattformen. Außerdem kann eine bestehende App NSH-Apps in ihren eigenen Views anzeigen: ein Rust-Root, das sie linkt, oder TSX, das sie lädt, einschließlich signierter Pakete, die sie herunterlädt, innerhalb der Limits und Capabilities, die sie festlegt. Unter iOS ist `os()` `Os::Ios` (`platform.os` ist `"ios"` in TSX), und die `ios={{…}}`-Props von TSX gelten.

<a id="requirements"></a>

## Voraussetzungen

- **Xcode** auf einem Mac, mit einer iOS-Simulator-Runtime (`xcodebuild -downloadPlatform iOS` installiert eine). Siehe
  [Installation](./installation.md#ios-and-mac-catalyst).
- Apps benötigen **iOS 15.0** oder neuer, auf iPhone und iPad.

<a id="running-an-app"></a>

## Eine App ausführen

Eine Rust-App läuft aus ihrem Verzeichnis, eine TSX-App benennt ihren Einstiegspunkt:

```sh
nsh run --target ios                                  # a Rust app
nsh run --target ios --device "iPhone 16 Pro"
nsh run App.tsx --target ios                          # a TSX app
```

`nsh` verwendet einen gestarteten Simulator oder startet das neueste iPhone. Bei einer Rust-App baut es den eigenen Runner der App mit deinem Crate, installiert ihn und zeigt seine Logs im Terminal an; eine Änderung am Rust-Code des Crates baut ihn neu und startet die App neu. Bei einer TSX-App installiert es den Development-Host und hält die App beim Speichern aktuell, mit Logs im Terminal. `--device` wählt einen Simulator per Name oder UDID. Für einen schnelleren Zyklus ohne Simulator öffnet `nsh run --target catalyst` auf einem Mac dasselbe UIKit-Backend in einem [Mac Catalyst](./getting-started.md#mac-catalyst)-Fenster in iPhone-Größe.

<a id="packaging"></a>

## Paketierung

```sh
nsh package --target ios-simulator --run      # .nsh/out/<Name>.app, installed and launched in the simulator
nsh package --target ios --sign "Apple Distribution: Example Inc (ABCDE12345)" --profile AppStore.mobileprovision
```

Aus dem Verzeichnis einer Rust-App ist die App der iOS-Runner, der mit deinem Crate gebaut wird; eine TSX-App benennt ihren Einstiegspunkt (`nsh package App.tsx --target ios-simulator --run`).

`--target ios` schreibt eine signierte `.ipa` für Geräte, TestFlight oder den App Store. Signing Identities, Provisioning Profiles und Icons: [Paketierung](./packaging.md#ios-devices).

<a id="embedding-in-an-ios-app"></a>

## In eine iOS-App einbetten

Eine bestehende iOS-App kann NSH-Apps in ihrer eigenen UI anzeigen. Eine iOS-App mit Rust-Code linkt dein Crate und das Crate `nsh-platform-ios` und zeigt dein Root in einem `AppView` an ([Eine Rust-App einbetten](#embedding-a-rust-app)). Eine Swift-App linkt `NativeShell.xcframework`, ein Framework mit einem Swift-Modul: Du erstellst ein `NshAppView` (ein `UIView`), fügst es an beliebiger Stelle in deine View-Hierarchie ein und lädst eine TSX-App oder ein signiertes Paket hinein. Deine nativen Screens, die Navigation und die NSH-App existieren nebeneinander in einer UIKit-Hierarchie.

Jede View ist eine unabhängige Engine; es gibt keine globalen Singletons, sodass eine App mehrere NSH-Apps gleichzeitig anzeigen kann, zum Beispiel eine pro Tab.

<div class="diagram-scroll">
<img class="diagram diagram-light" src="/diagrams/host-app-light.svg" alt="One host app with two NshAppView regions: each is its own engine with its own thread, VM, limits and capabilities; the host grants capabilities, sets limits and registers native components such as a map.">
<img class="diagram diagram-dark" src="/diagrams/host-app-dark.svg" alt="One host app with two NshAppView regions: each is its own engine with its own thread, VM, limits and capabilities; the host grants capabilities, sets limits and registers native components such as a map.">
</div>

<a id="embedding-a-rust-app"></a>

## Eine Rust-App einbetten

`nsh_platform_ios::AppView` ist eine Engine als `UIView` für eine iOS-App, die mit Rust gebaut ist: Sie bindet die Root-Komponente deines Crates ein, ganz ohne JavaScript-VM.

```rust
use nsh_platform_ios::{set_ui_sets, AppView, Root, SurfaceOptions};
use objc2::MainThreadMarker;
use objc2_ui_kit::UIView;

fn show(container: &UIView) -> AppView {
    // Once, before the first view: the UI sets the apps import (NSH's and your crate's).
    set_ui_sets(vec![nsh_base::registry(), my_app::registry()]);
    let mtm = MainThreadMarker::new().expect("main thread");
    let app = AppView::new(mtm, container.bounds(), SurfaceOptions::default());
    container.addSubview(app.view());
    app.run(Root::of::<my_app::App>());
    // Keep the AppView: dropping it stops the app.
    app
}
```

Die View passt ihre Größe an ihre Superview an. `AppView::run` ersetzt, was bisher lief; `AppView::load` führt stattdessen ein TSX-Bundle aus (`Bundle::source` oder `unsafe { Bundle::bytecode(bytes) }` für ein `bundle.nshc` im App-Bundle). `SurfaceOptions` enthält die Limits, die gewährten Capabilities, das Datenverzeichnis und die nativen Komponenten, so wie es die Member von `NshAppView` weiter unten tun; `AppView::set_locale`, `set_font_scale` und `set_error_handler` entsprechen `locale`, `fontScale` und `onError`. `nsh package --target ios` baut diese Art von App für dich, mit eingebundenem Root.

<a id="get-the-framework"></a>

## Das Framework beziehen

Die Distribution enthält beide Varianten:

```text
dist/nsh/embed/ios/NativeShell.xcframework      release: bundles and signed packages
dist/nsh/embed/ios/NativeShellDev.xcframework   also connects to a `nsh dev` server
```

Aus einem Checkout von NSH kannst du nur die Frameworks bauen:

```sh
cargo xtask ios-embed    # writes dist/nsh/embed/ios/{NativeShell,NativeShellDev}.xcframework
```

Der Standard-Build erzeugt statische Frameworks. Um dynamische Frameworks zu bauen, verwende:

```sh
cargo xtask ios-embed --dynamic
```

Dynamische Frameworks geben der Runtime ein eigenes Library-Image und eine eigene Unwind-Tabelle, was Host-Apps unterstützt, die bereits andere Rust-Runtimes linken. Wähle die Xcode-Embedding-Einstellung unten passend zum Framework, das du baust.

Standardmäßig hat jedes XCFramework drei arm64-Slices: iOS-Geräte, den iOS-Simulator (Apple Silicon) und Mac Catalyst. Das minimale Deployment-Target ist iOS 15.0. Das Swift-Modul wird mit Library Evolution kompiliert, sodass Apps, die mit anderen Versionen des Swift-Compilers gebaut wurden, es importieren können, und das Framework linkt alles, was es braucht: Du musst nichts weiter hinzufügen.

<a id="add-it-to-an-xcode-project"></a>

## Zu einem Xcode-Projekt hinzufügen

1. Ziehe `NativeShell.xcframework` (oder `NativeShellDev.xcframework` für Development-Builds) in **Frameworks, Libraries, and Embedded Content** des App-Targets. Wähle **Do Not Embed** für die statischen Standard-Frameworks oder **Embed & Sign** für dynamische Frameworks, die mit `--dynamic` gebaut wurden.
2. In Swift: `import NativeShell`.
3. Setze in der `Info.plist` der App `CADisableMinimumFrameDurationOnPhone` auf `YES`: Auf ProMotion-iPhones bewegen sich die Animationen der App dann mit 120 Hz, wie auch das Scrollen (von `nsh package` gebaute Apps haben das).

> [!TIP]
> Linke `NativeShellDev.xcframework` in der Debug-Konfiguration und `NativeShell.xcframework` in Release, damit sich nur Development-Builds mit einem Dev-Server verbinden können.

<a id="ship-a-bundle-with-the-app"></a>

## Ein Bundle mit der App ausliefern

Eine Swift-App liefert TSX-Apps als Bundles aus. Baue die NSH-App in einen Ordner und füge diesen Ordner den Ressourcen der App als Folder Reference mit dem Namen `nsh` hinzu:

```sh
nsh build App.tsx --release --out MyApp/nsh
```

`nsh build` schreibt:

| Datei | Inhalt |
|---|---|
| `bundle.nshc` | Die App, zu Bytecode kompiliert: lädt am schnellsten. |
| `bundle.js` | Dieselbe App als JS-Quelltext. |
| `bundle.js.map` | Ihre Source Map (Stack Traces verweisen auf deine `.tsx`-Dateien). |
| `capabilities.json` | Die [Capabilities](./sandbox-and-capabilities.md), die die App deklariert, sofern `nsh.json` welche enthält. |
| `assets/` | Bilder und Schriften, die die App importiert, unter ihren Pfaden relativ zum Einstiegspunkt. |

<a id="show-the-app"></a>

## Die App anzeigen

```swift
import NativeShell
import UIKit

final class EmbedController: UIViewController {
    private let app = NshAppView()

    override func viewDidLoad() {
        super.viewDidLoad()
        app.translatesAutoresizingMaskIntoConstraints = false
        app.onError = { message in print("nsh error: \(message)") }
        view.addSubview(app)
        NSLayoutConstraint.activate([
            app.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            app.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            app.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            app.bottomAnchor.constraint(equalTo: view.bottomAnchor),
        ])

        guard let url = Bundle.main.url(forResource: "bundle", withExtension: "nshc", subdirectory: "nsh") else { return }
        do {
            try app.loadBundle(at: url)
        } catch {
            print("cannot load: \(error)")
        }
    }

    // Let the embedded app's pages and dialogs decide the status bar.
    override var preferredStatusBarStyle: UIStatusBarStyle { NshAppView.preferredStatusBarStyle }
    override var prefersStatusBarHidden: Bool { NshAppView.prefersStatusBarHidden }
    override var preferredStatusBarUpdateAnimation: UIStatusBarAnimation {
        NshAppView.preferredStatusBarUpdateAnimation
    }
}
```

Die Größe der View ist das Fenster der App: NSH legt die App an den Bounds der View aus und erneut, sobald sie sich ändern. Erneutes Laden ersetzt die laufende App; die App wird beendet, wenn die View deallokiert wird.

Das vollständige Beispiel, eine UIKit-App, die eine NSH-App unterhalb ihres eigenen nativen Headers anzeigt, ist `examples/embed-ios/main.swift`.

## `NshAppView`

`NshAppView` ist eine `UIView`-Subklasse, die auf den Main Actor isoliert ist.

| Member | Beschreibung |
|---|---|
| `init(frame: CGRect = .zero, trace: Bool = false)` | Erstellt die View. `trace` protokolliert die Zeit jedes Commits. `init?(coder:)` unterstützt Storyboards und Nibs. |
| `onError: ((String) -> Void)?` | Erhält fatale App-Fehler (ein Bundle, das nicht geladen werden kann, nicht abgefangene JS-Exceptions, eine durch ein Limit gestoppte VM) auf dem Main Thread. Fehler werden immer protokolliert; Development-Builds zeigen sie zusätzlich über der App an. |
| `limits: NshLimits` | Die VM-Limits der Apps, die ab jetzt geladen werden. |
| `grantCapabilities(_ json: String?) throws` | Das Maximum, das die ab jetzt geladenen Apps tun dürfen, als JSON im Format von `nsh.json` `capabilities`; `nil` gewährt, was jede App deklariert. Wirft `NshError` bei ungültigem JSON. |
| `locale: Locale?` | Sprache und Region der App anstelle derer des Benutzers: `Intl`, `locale()` und die Komponenten folgen ihr sofort, und die später geladenen Apps starten damit. `nil` folgt der des Systems. |
| `fontScale: CGFloat?` | Die Textgröße anstelle der von Dynamic Type (1 ist der Standard): Texte und Eingaben werden mit ihr neu ausgelegt und `fontScale()` liest sie, sofort und für die später geladenen Apps; Längen behalten ihre Größe. `nil` folgt der des Systems. |
| `setThemeOverrides(_ json: String?) throws` | Die Marke des Hosts über dem [Theme](./tailwind.md#theme-tokens) der App: eine Theme-Datei im Format von `nsh.json` `"theme"`. Ihre Tokens haben Vorrang vor denen der App mit denselben Namen, im Light- und Dark-Modus, und die übrigen Tokens der App bleiben bestehen. Wirkt sofort und auf die später geladenen Apps; `nil` gibt der App ihr eigenes Theme zurück. Wirft `NshError` bei einer Datei, die sich nicht parsen lässt. |
| `storageDirectory: URL?` | Wo die ab jetzt geladenen Apps ihren [Storage](../modules/nsh.md#storage) ablegen; `nil`: `Library/Application Support/nsh/<app id>`, nach der eigenen ID der App. |
| `cacheOptions: NshCacheOptions` | Wo die ab jetzt geladenen Apps ihre Caches ablegen, die [Bilder, die sie herunterladen](./images-and-assets.md#kept-on-disk), und wie viel jede behält: `location` `.system` (`Library/Caches/nsh`, jede App in `<app id>`), `.directory(URL)` oder `.off`; `images` `.default` (256 MB), `.maxSize(megabytes:)` oder `.off`. |
| `loadBundle(at url: URL) throws` | Führt ein von `nsh build` geschriebenes Bundle aus. Assets stammen aus `assets/` daneben; `bundle.js.map` und `capabilities.json` daneben werden ebenfalls gelesen. |
| `run(_ package: NshPackage)` | Führt ein verifiziertes signiertes Paket aus (siehe unten). Ein Paket läuft einmal. |
| `loadPackage(at:trust:) async throws -> NshPackage.Info` | Verifiziert das Paket unter einer URL abseits des Main Threads und führt es dann aus. Wirft, warum es abgelehnt wurde; die laufende App bleibt bestehen. |
| `connectDevServer(_ url: URL) throws` | Development: lädt von einem `nsh dev`-Server und lädt bei jeder Änderung neu. Wirft bei `NativeShell.xcframework`, das keinen Development-Support hat. |
| `register(component:_:)` | Registriert eine [native Komponente](./native-components.md). |
| `params: [String: Any]` | Die Startparameter der ab jetzt geladenen Apps: Die App liest sie beim Start als `host.params` ([`host`](../modules/nsh.md#host)). |
| `send(_ name: String, _ data: Any? = nil)` | Sendet ein Event an die App (`host.on(name, …)`); wird aufbewahrt, bis sie zuhört, oder für die nächste App, solange keine läuft. |
| `handle(_ name: String, _ handler:)` | Behandelt die Calls (`host.call`) und Posts (`host.post`) der App von `name` auf dem Main Thread: `{ data, reply in … }` oder eine `async throws`-Funktion `{ data in … }`, deren Ergebnis den Call beantwortet. |
| `removeHandler(_ name: String)` | Entfernt den Handler von `name`: Die Calls der App darauf schlagen sofort fehl. |
| `static preferredStatusBarStyle`, `prefersStatusBarHidden`, `preferredStatusBarUpdateAnimation` | Was die laufenden Apps angefordert haben (`statusBar` ihrer Seiten und Dialoge, der Standard von `nsh.json`): Gib sie aus den Overrides des hostenden View Controllers zurück. |

> [!IMPORTANT]
> `bundle.nshc` (Bytecode) lädt nur aus dem App-Bundle. QuickJS validiert Bytecode nicht, daher könnte Bytecode von anderswo den Speicher beschädigen: Lade für eine Datei außerhalb des App-Bundles `bundle.js` (JS-Quelltext) oder, besser, ein [signiertes Paket](./signed-packages.md).

`limits`, `grantCapabilities`, `storageDirectory` und `cacheOptions` gelten ab dem nächsten Laden: Setze sie vor `loadBundle` / `run`.

Jede App behält ihren Storage unter ihrer eigenen ID, ohne Einstellung: ein signiertes Paket unter der ID, für die das Zertifikat seines Release-Schlüssels bürgt, ein Bundle unter dem `id` seines `nsh.json` (`app.json` daneben, geschrieben von `nsh build`). Setze `storageDirectory`, um die Daten einer App an einem vom Host gewählten Ort abzulegen:

```swift
app.storageDirectory = FileManager.default
    .urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
    .appendingPathComponent("nsh/com.example.orders")
try app.loadBundle(at: url)
```

<a id="talking-to-the-app"></a>

## Mit der App kommunizieren

Die View und die App, die sie ausführt, kommunizieren über einen eigenen Kanal ([`host`](../modules/nsh.md#host)): Startparameter, die die App beim Start liest, Events der Host-App sowie Calls und Posts der App, mit JSON-Daten (auf dieser Seite Foundation-Objekte). Dafür ist keine View in der App und keine native Komponente nötig.

```swift
// Before loading: what the app opens first (`host.params` in TSX).
app.params = ["conversation": notification.conversationID]
try app.loadBundle(at: url)

// The app's `await host.call("user.profile", { id })`: return the answer, or throw to reject it.
app.handle("user.profile") { data in
    let id = (data as? [String: Any])?["id"] as? Int ?? 0
    let profile = try await api.profile(id: id)
    return ["id": id, "name": profile.name]
}

// A handler that answers later, from any thread, with its reply.
app.handle("photo.pick") { _, reply in
    picker.present { url in
        if let url { reply.resolve(url.absoluteString) } else { reply.reject("cancelled") }
    }
}

// The app's `host.post("analytics", …)`: no answer.
app.handle("analytics") { data, _ in analytics.log(data) }

// Later: the app hears `host.on("conversation.open", …)`.
app.send("conversation.open", ["id": tapped.conversationID])
```

Handler laufen auf dem Main Thread; ein Call wartet in der App auf seine Antwort, ohne eine der beiden Seiten zu blockieren. Ein Reply, das unbeantwortet freigegeben wird, lässt den Call fehlschlagen, und ein Call eines Namens ohne Handler schlägt sofort fehl. Events mit Namen, auf die die App noch nicht hört, werden aufbewahrt, bis sie es tut, und Events, die gesendet werden, während keine App läuft (vor `loadBundle`, während eines Reloads), gehen an die nächste, sodass eine getippte Benachrichtigung, während die App startet, sie dennoch erreicht.

## Theme-Overrides

Eine App, die in mehrere gebrandete Host-Apps eingebettet ist, übernimmt die Marke des jeweiligen Hosts: Der Host gibt die Tokens an, die seine Marke ändert, als Theme-Datei im Format von `nsh.json` `"theme"` (`cssVars` von shadcn/ui, Werte so, wie CSS sie schreibt). Sie haben Vorrang vor den Tokens der App mit denselben Namen; die übrigen Tokens der App bleiben bestehen. Gib einem Token seinen Dark-Mode-Wert unter `dark` an (ein Wert, der nur unter `light` oder `theme` steht, ist diese Farbe in beiden Modi):

```swift
try app.setThemeOverrides("""
{ "cssVars": {
    "theme": { "radius": "0.75rem" },
    "light": { "primary": "#e11d48", "primary-foreground": "#ffffff" },
    "dark": { "primary": "#fb7185", "primary-foreground": "#1c1917" }
} }
""")
try app.loadBundle(at: url)
```

Rufe es vor oder nach dem Laden auf: Klassen wie `bg-primary` und `rounded-(--radius)` werden sofort neu gestylt, und jede später geladene App startet mit den Overrides in ihrem ersten Frame. `setThemeOverrides(nil)` gibt der App ihr eigenes Theme zurück.

<a id="links-the-app-opens"></a>

## Links, die die App öffnet

Die URLs, die die App öffnet ([`openUrl`](../modules/nsh.md#openurl), die Links einer `TextView` mit `links="open"`), erreichen zuerst `onOpenURL`, auf dem Main Thread: Gib `true` zurück, wenn die Host-App die URL behandelt hat, etwa indem sie sie über ihren eigenen Router geleitet hat, und `false`, damit das System sie mit `UIApplication.open` öffnet. Ohne `onOpenURL` öffnet das System jede URL. URLs erreichen es, nachdem die Capability `openUrl` der App sie erlaubt hat.

```swift
app.onOpenURL = { url in
    // The host app's own links open in the host app.
    if url.scheme == "lb" || url.host == "longbridge.com" {
        router.open(url)
        return true
    }
    return false
}
```

## Limits

```swift
app.limits = NshLimits(memoryMB: 128, callBudget: 1, maxNodes: 50_000)
```

| `NshLimits`-Feld | Standard | Bedeutung |
|---|---|---|
| `memoryMB: UInt32?` | 256 | JS-Heap in MB. Ist er erschöpft, wird die App gestoppt. |
| `stackKB: UInt32?` | 4096 (zugleich das Maximum) | Interpreter-Stack in KB. Tiefere Rekursion wirft einen `RangeError`. |
| `loadBudget: TimeInterval?` | 10 s | Zeit zum Auswerten des Bundles. |
| `callBudget: TimeInterval?` | 2 s | Zeit jedes anderen Aufrufs in JS (ein Event, ein Timer, ein Frame). Ein Aufruf, der das Limit überschreitet, wird abgebrochen. |
| `maxNodes: UInt32?` | 200 000 | Nodes, die die App behalten darf. |

`nil` behält den Standard. Was jedes Limit bewirkt, wenn es erreicht wird: [Sandbox und Capabilities](./sandbox-and-capabilities.md).

## Capabilities

Eine App deklariert in ihrer `nsh.json`, worauf sie zugreifen darf; die einbettende App kann weniger gewähren. Eine Anfrage muss von beiden erlaubt sein:

```swift
try app.grantCapabilities("""
{
  "network": { "hosts": ["api.example.com", "*.cdn.example.com"] },
  "webview": { "hosts": ["help.example.com"] }
}
""")
try app.loadBundle(at: url)
```

Hier darf die App die Statusleiste nicht setzen (kein `statusBar`), selbst wenn ihre `nsh.json` danach fragt. Details: [Sandbox und Capabilities](./sandbox-and-capabilities.md).

<a id="signed-packages"></a>

## Signierte Pakete

Um Code auszuführen, den die App herunterlädt (Updates, Mini-Apps von Drittanbietern), verwende [signierte Pakete](./signed-packages.md): `nsh publish` schreibt eine `.nshpkg`, die mit einem Release-Schlüssel signiert ist, den dein Root-Schlüssel zertifiziert hat, und die App verifiziert sie, bevor sie sie ausführt.

```swift
let support = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
let trust = try NshTrust(stateDirectory: support.appendingPathComponent("nsh"))
try trust.addRoot(rootPublicKey)   // the contents of root.pub from `nsh keygen`

Task {
    do {
        let info = try await app.loadPackage(at: downloadedFile, trust: trust)
        print("running \(info.id) \(info.version) (build \(info.build))")
    } catch {
        print("refused: \(error)")   // the running app stays
    }
}
```

Um zuerst zu verifizieren und später auszuführen, trenne die beiden Schritte:

```swift
let package = try await trust.openPackage(at: downloadedFile)   // verifies off the main thread
// ... decide, ask the user, ...
app.run(package)
```

| API | Beschreibung |
|---|---|
| `NshTrust(stateDirectory: URL) throws` | Öffnet oder erstellt den Trust Store. Sein Zustand (neueste Sperrliste, höchster akzeptierter Build pro App) bleibt dort erhalten, und die Assets der Pakete werden darunter entpackt. Vertraut keinem Schlüssel bis `addRoot`. Thread-sicher. |
| `addRoot(_ publicKey: String) throws` | Vertraut einem öffentlichen Root-Schlüssel (Base64, der Inhalt einer `.pub`-Datei). Mehreren Roots kann vertraut werden. |
| `updateRevocations(_ json: String) throws` | Wendet eine von `nsh revoke` geschriebene Sperrliste an, die von einem vertrauenswürdigen Root signiert und neuer als die im Store vorhandene ist. |
| `openPackage(at: URL) async throws -> NshPackage` | Verifiziert, entpackt Assets und akzeptiert das Paket (ältere Builds dieser App werden ab dann abgelehnt). |
| `NshPackage.info` | `id`, `name`, `version`, `build` der enthaltenen App. |
| `NshError` | Der Fehler, den jeder werfende Aufruf wirft; `message` gibt den Grund an. |
<a id="development"></a>

## Entwicklung

Mit `NativeShellDev.xcframework` richtest du die View auf einen Dev-Server statt auf ein Bundle:

```swift
#if DEBUG
try app.connectDevServer(URL(string: "ws://127.0.0.1:8790/ws")!)
#else
try app.loadBundle(at: bundledURL)
#endif
```

Führe `nsh dev App.tsx` auf deinem Mac aus. Der Simulator nutzt das Netzwerk des Macs, daher erreicht `127.0.0.1` den Server; ein
Gerät verwendet die LAN-Adresse, die `nsh dev` ausgibt (`devices on this network: ws://192.168.1.20:8790/ws`). Jedes Speichern
aktualisiert die App an Ort und Stelle, Logs erscheinen im Terminal von `nsh dev`, und Fehler werden über der App angezeigt. Siehe
[Dev-Server und Debugging](./dev-server-and-debugging.md).

> [!NOTE]
> Auf einem Gerät ist die Verbindung zu deinem Mac gewöhnlicher Datenverkehr im lokalen Netzwerk über einfaches `ws://` und `http://` (Assets).
> iOS fragt den Benutzer möglicherweise nach dem Zugriff auf das lokale Netzwerk, und die App-Transport-Security-Einstellungen der App müssen ihn erlauben.

<a id="notes"></a>

## Hinweise

- **Threads.** `NshAppView` ist auf den Main Actor isoliert. `NshTrust`, `NshPackage` und `NshComponentContext` sind threadsicher.
  Die JS-Engine läuft auf einem eigenen Thread; der Main Thread wartet nie auf sie.
- **Statusleiste.** Die Seiten und Dialoge der eingebetteten App (`statusBar`) ändern, was `NshAppView.preferredStatusBarStyle` und verwandte Methoden zurückgeben;
  der hostende View Controller muss sie weiterleiten, wie im obigen Beispiel.
- **Safe Area.** Apps verwenden `safe_area()` in Rust und `env(safe-area-inset-*)` im Padding oder
  `safeAreaInsets()` aus [`nsh`](../modules/nsh.md#safe-area-and-keyboard) in TSX, wie gewohnt. Ein `NshAppView`, der unterhalb deines eigenen Headers platziert wird, erhält die Insets, die für ihn gelten, nicht die des Fensters.
- **Mac Catalyst.** Dasselbe Framework funktioniert in Catalyst-Apps.

<a id="see-also"></a>

## Siehe auch

- [Entwickeln mit Rust](./rust.md)
- [Einbetten in Android-Apps](./android.md)
- [Native Komponenten](./native-components.md)
- [Signierte Pakete](./signed-packages.md)
- [Sandbox und Capabilities](./sandbox-and-capabilities.md)
