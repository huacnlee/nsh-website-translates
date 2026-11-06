---
title: "Dev-Server und Debugging"
description: "Führe Rust- und TSX-Apps mit nsh run und nsh dev aus, verbinde Simulatoren, Emulatoren und Geräte und nutze Rebuilds, Hot Module Replacement, Logs, das Error Overlay und Stacks mit Source Maps."
order: 60
group: tools
source_hash: bce9f1fee0870b27
---


# Dev-Server und Debugging

Während der Entwicklung baut NSH Ihre App bei jedem Speichern neu. Eine Rust-App (`nsh.json` nennt ihr `"root"`) wird in ein
eigenes Runner-Programm gebaut, das `nsh run` startet; eine Änderung an ihrem Crate baut sie erneut und startet die App neu. Eine TSX-App wird an
jeden verbundenen Host gesendet, der sich an Ort und Stelle aktualisiert. Zwei Befehle erledigen das:

- `nsh run` baut die App **und** startet sie: ein Mac-Catalyst- oder AppKit-Fenster, ein GTK-Fenster unter Linux, ein Win32-Fenster
  unter Windows, einen iOS-Simulator, ein Android-Gerät oder einen Emulator oder eine Browserseite. Für TSX startet er außerdem den Dev-Server,
  mit dem sich der Development-Host verbindet.
- `nsh dev --server-only` startet den Dev-Server für TSX, für Hosts, die Sie selbst starten: Ihre eigene App mit dem
  Development-SDK, ein Gerät im Netzwerk oder mehrere Hosts gleichzeitig.

```sh
# A Rust app, from its directory
nsh run                             # AppKit window (macOS); GTK window (Linux); Win32 window (Windows)
nsh run --target ios                # iOS simulator
nsh run --target android            # Android device or emulator

# A TSX app
nsh run App.tsx                     # AppKit window (macOS); GTK window (Linux); Win32 window (Windows)
nsh run App.tsx --target macos      # AppKit window (macOS)
nsh run App.tsx --target ios        # iOS simulator
nsh run App.tsx --target android    # Android device or emulator
nsh dev App.tsx --server-only       # server only
```

`nsh dev` öffnet standardmäßig auch den nativen Host; mobile Hosts verwenden `--target ios` oder `--target android`.

## `nsh run`

| Flag | Beschreibung |
|---|---|
| `--target <catalyst \| ios \| android \| macos \| linux \| windows \| gpui \| web>` | Wo die App läuft. Standard ist `macos` unter macOS (AppKit), `linux` unter Linux, `windows` unter Windows. Eine Rust-App läuft auf allen außer `gpui`, das sein Root in eine GPUI-App einbettet ([GPUI](./gpui.md)). |
| `--device <name or UDID>` | Der zu verwendende iOS-Simulator. Standard: ein bereits gestarteter, sonst das neueste iPhone (wird für Sie gestartet). |
| `--port <port>` | Port des Dev-Servers. Standard 8790; ist er belegt, wird der nächste freie Port verwendet. |
| `--release` | Release-Builds von TSX ausliefern (minifiziert, ohne Debug-Informationen, keine Hot-Updates). |
| `--trace` | Die Zeit jedes Commits auf dem Host protokollieren (TSX-Apps). |

Was die einzelnen Targets tun:

- **`catalyst`** (macOS) führt den Development-Host als Mac-App aus. Das Beenden von `nsh run` (Ctrl-C oder `kill`) schließt ihn, und
  das Schließen des Fensters beendet `nsh run`.
- **`macos`** (macOS) führt den AppKit-Development-Host, eine Desktop-App in einem 1200×800-Fenster, auf die gleiche Weise aus; Cmd+R
  lädt den neuesten Build neu. Erfordert macOS 14 oder neuer ([macOS](./macos.md)).
- **`linux`** (Linux) führt den GTK-Development-Host in einem 390×844-Fenster auf die gleiche Weise aus: Das Beenden von `nsh run` schließt
  ihn, das Schließen des Fensters beendet `nsh run`. Erfordert GTK 4.14 oder neuer ([Linux](./linux.md)).
- **`windows`** (Windows) führt den Win32-Development-Host in einem 1200×800-Fenster auf die gleiche Weise aus; der Host überlebt
  `nsh run` nie, auch nicht, wenn die Konsole geschlossen wird. Erfordert Windows 10 1809 oder neuer ([Windows](./windows.md)).
- **`ios`** installiert den Development-Host im Simulator, startet ihn mit Verweis auf den Dev-Server und beobachtet weiter.
  Der Simulator teilt sich das Netzwerk des Macs, sodass der Host den Server unter `127.0.0.1` erreicht. Das Beenden von `nsh run` (Ctrl-C)
  schließt den Host, der sonst an der nächsten Sitzung teilnehmen würde. Erfordert Xcode.
- **`android`** installiert die APK des Development-Hosts (erneut nur, wenn sich die Runtime geändert hat), führt
  `adb reverse tcp:<port> tcp:<port>` aus, damit das `127.0.0.1` des Geräts den Server erreicht, und startet ihn. Funktioniert mit einem
  Emulator oder einem USB-Gerät. Erfordert das Android SDK (`ANDROID_HOME`). Wenn `nsh run` endet (auch per Ctrl-C), beendet es den
  Host und entfernt diese Portweiterleitung, damit der Host nicht an der nächsten Sitzung teilnimmt.

Wenn `nsh run` endet, egal wie, beendet es den Host, den es gestartet hat: Es beendet die Catalyst-App oder schließt den macOS-, Linux- oder Windows-Host, beendet den
Development-Host im Simulator oder erzwingt sein Beenden auf dem Gerät.

Für eine Rust-App führt jedes Target den eigenen Runner der App aus, der mit ihrem Crate gebaut wird: auf den Desktops ein Debug-Build an Ort und Stelle, mit
seiner Ausgabe im Terminal; unter iOS und Android ein Paket davon, installiert. Für TSX sind die Hosts generisch: Sie führen jede
NSH-App aus, die der Server sendet, sodass pro App nichts gebaut werden muss (eine App mit eigenem Crate erhält damit gebaute Hosts).

## `nsh dev`

```sh
nsh dev App.tsx
```

```text
✓ built App.tsx (3.2 KB js, 9.8 KB bytecode, 21ms)
→ dev server ws://127.0.0.1:8790/ws
  devices on this network: ws://192.168.1.20:8790/ws
```

| Flag | Beschreibung |
|---|---|
| `--port <port>` | Port des Dev-Servers. Standard 8790 (der nächste freie, falls belegt). |
| `--release` | Release-Builds ausliefern. |

Verbinden Sie Hosts mit der ausgegebenen URL:

- **Ihre eigene iOS-App**, gelinkt mit `NativeShellDev.xcframework`:
  `try app.connectDevServer(URL(string: "ws://192.168.1.20:8790/ws")!)`. Siehe [Embedding in iOS apps](./ios.md#development).
- **Ihre eigene Android-App**, mit `nsh-dev.aar`: `nsh.connectDevServer("ws://192.168.1.20:8790/ws")` oder
  `adb reverse tcp:8790 tcp:8790` und `ws://127.0.0.1:8790/ws`. Siehe [Embedding in Android apps](./android.md#development).

Beliebig viele Hosts können gleichzeitig verbunden sein; jeder Build geht an alle. Ein Host, der sich später verbindet, erhält den
aktuellen Build sofort. Ein Host, der die App nicht ausführen kann, weil ihm ein UI-Set fehlt, das die App importiert (ein Development-Host,
der für eine andere App gebaut wurde), erhält keinen Build: Er zeigt den Grund an, und das Terminal gibt eine `warn`-Zeile mit dem Befehl aus, der
den Host der App installiert.

> [!NOTE]
> Ein Gerät im LAN muss Ihren Computer auf dem Port des Dev-Servers erreichen können: dasselbe Netzwerk, keine Firewall dazwischen.
> Assets (Bilder, Schriftarten) werden per einfachem HTTP über denselben Port ausgeliefert.

<a id="rust-edits"></a>

## Rust-Änderungen

Rust wird kompiliert: Eine Änderung am Crate einer App oder an einem Crate, von dem sie per Pfad abhängt, baut die App erneut, und `nsh run`
startet sie mit dem neuen Code neu. Der Zustand der App beginnt von vorn; bewahren Sie, was einen Neustart überleben muss, im
[Storage](../modules/nsh.md#storage) auf. Ein Build-Fehler wird im Terminal ausgegeben, und der nächste Speichervorgang, der kompiliert, führt die App
erneut aus. In einer App mit Rust und TSX bleiben TSX-Änderungen Hot-Updates (siehe unten), und Rust-Änderungen starten die App neu.

## Hot Module Replacement

TSX-Development-Builds behalten pro Quelldatei ein Modul. Beim Speichern baut NSH neu, vergleicht die Module mit dem letzten
guten Build und sendet einen **Patch** nur mit den geänderten Modulen. Der Host wendet ihn an Ort und Stelle in deutlich unter einer
Millisekunde an; vom Speichern einer Datei bis zur sichtbaren Änderung vergehen etwa 120 ms.

Was mit Ihrer App geschieht:

- **Nur die Komponenten, die Sie bearbeitet haben, werden erneut gerendert.** Jede Top-Level-Komponente (eine mit Großbuchstaben beginnende Funktion, die JSX zurückgibt)
  wird in einen stabilen Proxy gehüllt. Ändert sich ihr Code (oder der übrige Code ihres Moduls, den sie verwenden kann), werden ihre
  Instanzen mit dem neuen Code erneut gerendert; Komponenten, deren Code sich nicht geändert hat, behalten ihre Instanzen und damit
  ihre Signals und ihren Zustand. Bearbeiten Sie den Stil eines Buttons, und der
  Bildschirm bleibt, wo er war, mit demselben Eingabetext und derselben Scroll-Position.
- **Geänderte Module werden erneut ausgeführt**, ebenso die Module, die ein geändertes Modul importieren und das Update nicht
  selbst übernehmen können, bis hinauf zum Entry. Code auf Modulebene wird daher erneut ausgeführt, außer dem, was seinen Zustand behält:
- **Top-Level-Signals und Navigation-Stacks behalten ihren Zustand**: Ein `const`, das mit `signal(…)` oder `createNavStack(…)` am
  Anfang eines Moduls erzeugt wurde, behält seinen Wert (ein Stack seine Seiten) über Änderungen hinweg, solange sein eigener Initialisierer derselbe ist;
  ändern Sie den Initialisierer (`signal(0)` zu `signal(10)`), um neu zu beginnen.
- **Top-Level-`context()`-Objekte behalten ihre Identität** und übernehmen den neuen Standardwert, sodass Provider und Consumer in
  verschiedenen Modulen weiterhin zusammenpassen.
- **Das Bearbeiten des Entry hält die App gemountet.** Ein erneut ausgeführtes `mount(App)` (oder `mount(() => <App />)`) mit derselben
  Komponente behält, was es gemountet hat: Nur die Komponenten, die Sie bearbeitet haben, werden erneut gerendert. Bearbeiten Sie `App` selbst, wird es
  erneut gerendert, samt dessen, was es rendert (deren eigener Zustand beginnt von vorn), aber ein Navigator, der am Anfang des Moduls erzeugt wurde, behält seine
  Routen, sodass ein gepushter Screen gepusht bleibt. Ein geänderter `mount`-Aufruf (andere Komponente, andere Props) mountet die App
  erneut.
- **Eine Komponente, die einen Fehler wirft**, meldet den Fehler und rendert nichts, bis Sie ihn beheben; der Rest der App läuft
  weiter. Der nächste gute Speichervorgang stellt sie wieder her.

Der Host **lädt die gesamte App neu**, anstatt zu patchen, wenn:

- die Änderung ein NSH-Modul importiert, das die laufende App noch nicht importiert hatte (zum Beispiel das erste `import … from "nsh"`);
- sich das `capabilities` der App in `nsh.json` geändert hat;
- der Host nicht den Build ausführt, auf dem der Patch basiert (er hat sich gerade verbunden, oder ein früheres Laden ist fehlgeschlagen);
- ein Patch nicht angewendet werden kann.

> [!TIP]
> Zustand, den eine Komponente in ihren eigenen Signals hält, wird zurückgesetzt, wenn diese Komponente oder eine, die sie rendert, bearbeitet wird. Halten Sie
> Zustand, der Änderungen überleben muss, in Top-Level-Signals (oder einem Store-Modul), und erzeugen Sie Navigatoren am Anfang eines Moduls.

`--release` liefert Release-Builds ohne Hot-Updates aus: Jedes Speichern lädt die App neu. Verwenden Sie es, um den minifizierten Build zu prüfen.
Alles, was von einem Dev-Server geladen wird, ob mit `--release` oder nicht, umgeht die Härtung der Runtime (`eval` bleibt verfügbar); siehe
[Sandbox and capabilities](./sandbox-and-capabilities.md#hardening).

## Logs

Eine Rust-App protokolliert mit dem Crate `log` (`log::info!`, `log::warn!`, `log::error!`): `nsh run` zeigt die Zeilen in seinem
Terminal zusammen mit der Ausgabe der App an, auf den Desktops und im iOS-Simulator.

In TSX gehen `console.log`, `console.info`, `console.debug`, `console.warn` und `console.error` an das native Log mit
dem Target `js`. Solange ein Host verbunden ist, werden seine Logzeilen an das Terminal weitergeleitet, in dem `nsh run` / `nsh dev` läuft: Ihre
`console.log`-Zeilen unverändert (mit dem Namen des Geräts als Präfix, wenn mehrere Geräte verbunden sind), Warnungen und
Fehler hinter dem Namen des Geräts:

```text
• iPhone 16 Pro connected, build 1
loading more after 1000
warn iPhone 16 Pro: deprecated option
error iPhone 16 Pro: uncaught exception: TypeError: cannot read property 'id' of undefined
          at Row (demos/Photos.tsx:18:22)
```

`console.log` formatiert Werte wie eine Browser-Konsole: Strings unverändert, Fehler mit ihrem Stack, Funktionen mit ihrem Namen,
Objekte und Arrays als JSON. Ist der Host nicht verbunden, gehen die Logs an das Log der Plattform (die Xcode-Konsole / das
Unified Log unter iOS, `adb logcat` unter Android).

Ein Promise, das abgelehnt wurde und noch keinen Handler hat, sobald die Arbeit, die es abgelehnt hat, erledigt ist (seine Microtasks sind gelaufen), wird
ebenfalls als Fehler protokolliert, so wie es ein Browser meldet: eine `async`-Funktion, die einen Fehler wirft, während niemand sie awaitet, ein
`Promise.reject(…)`, das niemand abfängt, ein Aufruf in Rust, der fehlschlägt, ohne dass etwas darauf wartet. Die Zeile geht dorthin, wohin
`console.error` geht (das Terminal, das Log der Plattform, die Browser-Konsole im Web), mit einem Stack, der auf
Ihre Quellen zeigt:

```text
error iPhone 16 Pro: unhandled rejection: Error: HTTP 404
          at loadProfile (App.tsx:12:11)
```

Ein Handler, der später im selben Turn angehängt wird (`const p = load(); …; p.catch(…)`), gilt als Behandlung. Awaiten Sie das
Promise oder geben Sie ihm ein `.catch`, wo der Fehlschlag von Bedeutung ist.

Der Rest des Terminals ist eine Zeile pro Schritt (`✓` fertig, `→` wo man sich verbindet, `•` was ein Gerät getan hat); die Ausgabe der
Tools, die NSH ausführt (cargo, die Hosts selbst), wird nur ausgegeben, wenn eines fehlschlägt. `nsh run -v` (oder `NSH_VERBOSE=1`)
gibt alles aus: jede Logzeile mit Level und Quelle, die Ausgabe von cargo und die der Hosts selbst.

`--trace` fügt die Kosten jedes Commits hinzu:

```text
perf commit: 10 ops, 151µs (list js 2µs), 8 mount items, 27 nodes
```

Siehe [Testing](./testing-and-trace.md) für die Bedeutung dieser Zahlen.

<a id="the-error-overlay"></a>

## Das Error-Overlay

Diese Fehler zeigen auf dem Host ein rotes Overlay über der App mit Meldung und Stack:

- ein Build-Fehler (ein Syntaxfehler, ein unbekanntes Element, ein fehlender Import), mit einem Code-Frame, der auf die Zeile zeigt;
- ein Fehler beim Auswerten des Bundles;
- eine nicht abgefangene Exception in einem Event-Handler, Timer oder Effect.

Tippen Sie auf das Overlay, um es zu schließen. Es verschwindet auch beim nächsten erfolgreichen Neuladen. Build-Fehler werden auch im
Terminal ausgegeben:

```text
error building App.tsx failed
App.tsx

  x <Buton> names nothing in scope
   ,-[3:11]
 2 | function App() {
 3 |   return <Buton />;
   :           ^^^^^
 4 | }
```

Der Bundler entfernt TypeScript-Typen, ohne sie zu prüfen; führen Sie [`nsh check`](./cli.md#nsh-check) aus (den
nativen Compiler von TypeScript mit den `tsconfig.json` `nsh init` schreibt; kein Node erforderlich) oder verlassen Sie sich für Typfehler auf Ihren Editor.

In Release-Builds (eine einbettende App mit dem Release-SDK, eine paketierte App) werden Fehler protokolliert und an den Error-Handler der Host-App
(`NshAppView.onError`, `NshView.setErrorListener`) übergeben, aber nicht über der App angezeigt.

<a id="source-maps-and-stack-traces"></a>

## Source Maps und Stack Traces

Das Bundling erzeugt eine Source Map, die jeden Schritt zusammensetzt (TypeScript → JSX → das Bundle), und sie wird mit jedem
Build mitgesendet. Bevor ein Stack Trace ausgegeben oder angezeigt wird, schreibt die Runtime die Positionen des Bundles auf Ihre Quellen um, sodass Stacks
auf `App.tsx:2:28` zeigen, nicht auf das Bundle:

```text
error Mac Catalyst: uncaught exception: Error: tap boom
          at <anonymous> (App.tsx:2:58)
```

`nsh build` schreibt die Map als `bundle.js.map`; eine einbettende App, die ein Bundle aus einem Ordner lädt, liest sie neben
dem Bundle, und [signierte Pakete](./signed-packages.md) enthalten sie ebenfalls, es sei denn, sie wird neben dem Paket aufbewahrt und mit
`nsh symbolicate` angewendet ([Errors from published packages](./signed-packages.md#errors-from-published-packages)).

<a id="debugging-tips"></a>

## Tipps zum Debuggen

- **Nach einer Änderung aktualisiert sich nichts**: Prüfen Sie das Terminal auf einen Build-Fehler; das Overlay zeigt ihn auch auf dem Host an.
- **Die App behält alten Zustand, den Sie zurücksetzen wollten**: Hot Replacement behält absichtlich den Zustand unveränderter Komponenten, Top-Level-
  Signals und Navigatoren. Starten Sie mit Ctrl-C und `nsh run` neu oder ändern Sie den Initialisierer des Zustands.
- **Eine Anfrage schlägt nur in einem paketierten oder eingebetteten Build fehl**: Prüfen Sie die [Capabilities](./sandbox-and-capabilities.md) der App;
  Ablehnungen werden mit dem hinzuzufügenden Schlüssel protokolliert.
- **Etwas ist langsam**: Reproduzieren Sie es headless mit [`nsh test --trace`](./testing-and-trace.md), das jede
  native View-Operation ausgibt, oder führen Sie eine TSX-App mit `--trace` aus.
- **Typfehler im Editor**: `nsh run` und `nsh dev` halten `.nsh/types` aktuell; siehe
  [Project structure](./project-structure.md).

<a id="see-also"></a>

## Siehe auch

- [CLI](./cli.md)
- [Testing](./testing-and-trace.md)
- [Embedding in iOS apps](./ios.md), [Embedding in Android apps](./android.md)
