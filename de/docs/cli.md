---
title: "CLI"
description: "Alle NSH-Unterbefehle und Flags – init, build, test, check, dev, run, package sowie die Signierbefehle keygen, certify, publish, verify, symbolicate und revoke."
order: 6
group: start
source_hash: 2fe1bbb5b3e5cfb9
---


# CLI

`nsh` ist das Werkzeug, mit dem eine NSH-App in Rust oder TSX gebaut wird. Jeder Unterbefehl, der eine App baut, nimmt `[ENTRY]` entgegen: das Verzeichnis der App (Standard: das aktuelle, sodass `cd my-app && nsh run` funktioniert), das die Root-Komponente einer Rust-App (`nsh.json` `"root"`), das `App.tsx` einer TSX-App oder ein TSX-Entry-Modul ausführt. Er liest `nsh.json` im Stammverzeichnis der App und aktualisiert die Typdeklarationen in `.nsh/types`.

```text
nsh <COMMAND>

  init         Create an app in Rust or TSX
  build        Build an app: describe a Rust app's crates, or bundle a TSX app and compile it to QuickJS bytecode
  test         Run an app's tests headless, and its Rust crates' with cargo test
  check        Type check an app with TypeScript's native compiler, and its Rust crates with cargo check
  dev          Serve an app to dev hosts (simulators, devices) and push rebuilds
  run          Like dev, and also run the app in a development host
  package      Package an installable app from the prebuilt runtime
  keygen       Create a signing key
  certify      Certify a release key with a root key
  publish      Build an app in release mode and sign it into a package (.nshpkg)
  verify       Verify a package
  symbolicate  Map the positions in a reported error stack to the app's sources
  revoke       Sign a revocation list
```

`nsh <command> --help` gibt die Flags eines Befehls aus; `nsh -V` (`--version`) gibt die Version und die Git-Revision aus, aus der das Tool gebaut wurde.

<a id="output"></a>

## Ausgabe

Jeder Befehl gibt pro Schritt eine Zeile aus und Details nur dann, wenn etwas fehlschlägt:

```text
✓ built the Rust crate gallery-native (5.0s)
✓ built App.tsx (500 B js, 809 B bytecode, 21ms)
✓ built the development host for the iOS simulator (12.7s)
• iOS Simulator (iPhone 16 Plus) connected, build 1
warn iOS Simulator: image failed: An SSL error has occurred and a secure connection to the server cannot be made.
✓ rebuilt App.tsx (18ms), 1 device
```

`✓` ist ein abgeschlossener Schritt, `→` zeigt, wohin die Verbindung erfolgt, `•` was ein Gerät getan hat; Zeilen mit `warn` und `error` sind Probleme, und einfache Zeilen sind die eigene Ausgabe deiner App (`console.log`). In einem Terminal zeigt ein Spinner den laufenden Schritt an, und die Zeilen sind farbig (sofern `NO_COLOR` nicht gesetzt ist); bei Umleitung in eine Datei werden nur die Ergebniszeilen ohne Farben geschrieben. Die Ausgabe der Tools, die NSH startet (cargo für das Rust-Crate einer App, die Development-Hosts), wird unter einer `error`-Zeile ausgegeben, wenn eines davon fehlschlägt.

`-v, --verbose` (bei jedem Befehl; auch `NSH_VERBOSE=1`) gibt alles aus, sobald es anfällt: jede Logzeile mit Level und Quelle, die Ausgabe von cargo und die der Hosts selbst.

## nsh init

```sh
nsh init [DIR] [--name <NAME>] [--template <ts|rust|mixed>] [--nsh-source <DIR>]
```

Erstellt aus einer Vorlage eine App in `DIR` (Standard: das aktuelle Verzeichnis, wird bei Bedarf angelegt). Ohne `--template` fragt `nsh init` in einem Terminal, welche Vorlage verwendet werden soll (Enter wählt `ts`), und nimmt andernorts (Skript, CI) `ts`.

| Vorlage | Was sie erzeugt |
|---|---|
| `rust` | Eine in Rust geschriebene App: ein Cargo-Projekt (`Cargo.toml`, `src/lib.rs` mit der Root-Komponente, `src/main.rs` für `cargo run`), `nsh.json` mit `"rust": "."` und `"root": "App"`, der Test der Root-Komponente `App.test.tsx` mit `tsconfig.json` und `.nsh/types`, `.gitignore` und eine README, die auch erklärt, wie man später einen TSX-Entry hinzufügt. `nsh run` und `nsh package` mounten die Root-Komponente auf jedem Target ohne QuickJS (`nsh test` öffnet sie für TypeScript-Tests), einschließlich des Browsers ([Mit Rust bauen](./rust.md)); `cargo run` startet sie direkt unter macOS, Windows oder Linux. |
| `ts` | Eine TSX-App: `App.tsx`, ihr Test `App.test.tsx` (`nsh test`), `nsh.json`, `tsconfig.json`, `.gitignore` und `.nsh/types`. Vorhandene Dateien bleiben erhalten; der Befehl schlägt nur fehl, wenn alle bereits existieren. |
| `mixed` | Eine TSX-App mit einem eigenen Rust-Crate in ihrem Stammverzeichnis: `App.tsx`, ihr Test `App.test.tsx`, `tsconfig.json`, `nsh.json` mit `"rust": "."`, `.gitignore`, `.nsh/types`, eine README und das Crate neben `App.tsx` (`Cargo.toml`, `src/lib.rs`), dessen `#[native_module("<name>/native")]` eine Komponente, ein Modul und eine Klasse exportiert, die `App.tsx` verwendet. Ohne `"root"` ist `App.tsx` der Entry. |

| Flag | Beschreibung |
|---|---|
| `--name <NAME>` | Anzeigename, der in `nsh.json` geschrieben wird. Standard: der Name des Verzeichnisses. Die ID wird zu `com.example.<name>` (nur Buchstaben und Ziffern, Kleinbuchstaben) und der Import-Specifier der Crates zu `<name>/native` (Kleinbuchstaben, Wörter mit `-` verbunden). |
| `--template <TEMPLATE>` | `rust`, `ts` oder `mixed` (siehe oben). `rust` und `mixed` benötigen Rust; `cargo run` benötigt zusätzlich die Entwicklungsbibliotheken des nativen Desktop-Backends. |
| `--nsh-source <DIR>` | Mit `rust` oder `mixed`: Die Crates hängen per Pfad von den NSH-Crates des Checkouts in `DIR` ab, um die App gegen die Quellen von NSH zu bauen. |

Die Crates von `rust` und `mixed` hängen von den NSH-Crates auf crates.io in der Version der CLI ab (mit `--nsh-source` von denen eines Checkouts), und die `nsh`-Befehle bauen die Runner und Hosts der App aus denselben Crates. Vor jedem Befehl für eine solche App baut `nsh` ein kleines Programm aus den Crates der App und dem Core von NSH, das deren Komponenten, Module und Klassen beschreibt, und führt es aus, wenn sich die Crates geändert haben; mit dieser Beschreibung bündelt, kompiliert, typprüft, served und paketiert die CLI die App selbst. Die Builds einer Rust-App kompilieren nur deren Crates und den Core von NSH. Lege sie in einem neuen App-Verzeichnis an: Existiert eine ihrer Dateien bereits, wird dies als Konflikt gemeldet, bevor etwas geschrieben wird.

Apps, deren Rust-Crates über Git von NSH abhängen, verwenden den Checkout, den Cargo in der Lockfile der App auflöst. Generierte Hosts teilen sich diesen Checkout, einschließlich der NSH-Abhängigkeiten, die durch die Cargo-Patches der App umgeleitet werden.

## nsh run

```sh
nsh run [ENTRY] [--target catalyst|ios|android|macos|linux|windows|gpui|web] [--device <DEVICE>] [--port <PORT>] [--release] [--limits [<LIMITS>]] [--trace] [--fps] [--name <NAME>] [--window-size <WIDTHxHEIGHT>] [--display <N>]
```

```sh
nsh run my-app                     # a Rust app's root, or a TSX app's App.tsx, on this machine's backend
nsh run my-app --target ios        # in the iOS simulator
nsh run my-app/App.tsx --target web
```

Bei einem TSX-Entry startet `nsh run` den Dev-Server (wie `nsh dev`), startet einen Development-Host, der die App von dort lädt, und baut bei jedem Speichern neu. Hot Module Replacement patcht die laufende App an Ort und Stelle; Logs und Fehler der App werden im Terminal ausgegeben. Beende ihn mit Strg-C (oder durch Schließen des Fensters von Catalyst, macOS, Linux, Windows oder GPUI). Egal wie er endet (Strg-C, `kill` / `pkill`, ein Fehler), beendet er den Host, den er gestartet hat: die Catalyst-App, den Host für macOS, Linux, Windows oder GPUI, den Development-Host im Simulator oder auf dem Android-Gerät.

Eine Rust-App (`nsh.json` `"root"`, [Mit Rust bauen](./rust.md)) läuft ohne Dev-Server und ohne QuickJS: `nsh run` baut den Runner der App für das Target mit gemounteter Root-Komponente und startet ihn (auf den Desktops als Debug-Build, mit seinen Logs im Terminal; im Simulator und auf Android wird die App installiert) und baut ihn bei einer Änderung am Rust-Code des Crates erneut und startet ihn neu. Mit `--target web` gibt er die Adresse der Seite aus, und die geöffnete Seite lädt die neue Runtime selbstständig. Gib den TSX-Entry an (`nsh run App.tsx`), um stattdessen diesen auszuführen.

| Flag | Standard | Beschreibung |
|---|---|---|
| `--target <TARGET>` | `macos` unter macOS, `linux` unter Linux, `windows` unter Windows | `catalyst`: der Mac-Catalyst-Host, ein Fenster in iPhone-Größe (390×844). `ios`: der Host in einem iOS-Simulator. `android`: der Host auf einem Android-Gerät oder -Emulator. `macos`: der AppKit-Host, ein Fenster mit 1200×800 ([macOS](./macos.md)). `linux`: der GTK-Host, ein Fenster mit 390×844 ([Linux](./linux.md)). `windows`: der Win32-Host, ein Fenster mit 1200×800 ([Windows](./windows.md)). `gpui`: der GPUI-Host, ein Fenster mit 1200×800, unter macOS, Windows oder Linux, der eine TSX-App so zeigt, wie GPUI-Apps sie zeigen, die sie einbetten ([GPUI](./gpui.md)). `web`: die Seite des Dev-Servers unter der Adresse, die er ausgibt ([Web](./web.md#develop-in-the-browser)). |
| `--device <DEVICE>` | | Zu verwendender iOS-Simulator, per Name (`"iPhone 16 Pro"`) oder UDID. Standard: ein bereits gestarteter, sonst das neueste iPhone, das gebootet wird. |
| `--port <PORT>` | `8790` | Port des Dev-Servers. Ersetzt die vorherige NSH-Entwicklungssitzung auf diesem Port, nachdem deren Bereinigung abgeschlossen ist. |
| `--release` | | Minifiziert und entfernt Debug-Informationen. Release-Bundles haben kein Hot Module Replacement: Jedes Speichern lädt die App neu. |
| `--limits [<LIMITS>]` | | Führt die App als in eine andere App eingebettete App aus, innerhalb der Grenzen, die ihre Host-App setzt: `memory` und `stack` (in `KB`, `MB` oder `GB`), `load` und `call` (in `ms` oder `s`) sowie `nodes`, etwa `--limits memory=128MB,call=500ms`. Nicht angegebene behalten die Einbettungs-Standardwerte, mit denen `--limits` allein läuft ([Sandbox und Capabilities](./sandbox-and-capabilities.md#limits)). Ohne dieses Flag läuft die App eigenständig, wie eine paketierte App. Nur TSX-Entries. |
| `--trace` | | Der Host schreibt das Timing jedes Commits (JS, Layout, Mount-Items) ins Terminal. |
| `--fps` | | Der Performance-Monitor: Framerate, Kosten von Frames und Commits, CPU, GPU und Speicher, unter macOS über der App eingeblendet ([macOS](./macos.md#performance-monitor)) und unter macOS, Linux, Windows und iOS einmal pro Sekunde geloggt. |
| `--name <NAME>` | `nsh.json`-Name | Anzeigename der Anwendung in der Menüleiste und anfänglicher Fenstertitel (`--target macos`, TSX-Entries). |
| `--window-size <WIDTHxHEIGHT>` | Host-Standard | Anfängliche Fenstergröße in Punkten, etwa `800x600` (`--target macos`, `linux`, `windows` und `gpui`, TSX-Entries). |
| `--display <N>` | Das Hauptdisplay | Das Display, auf dem das Fenster zentriert geöffnet wird: `1` ist das primäre Display (das mit der Menüleiste), `2` das nächste und so weiter; bei einer Nummer ohne zugehöriges Display öffnet es sich auf dem Hauptdisplay (`--target macos`, TSX-Entries). |

Mit `--target android` wird das erste Gerät verwendet, das `adb devices` auflistet; der Port des Dev-Servers wird mit `adb reverse` dorthin weitergeleitet. Siehe [Erste Schritte](./getting-started.md#run-it) und [Dev-Server und Debugging](./dev-server-and-debugging.md).

Eine Ersetzung wartet bis zu zehn Sekunden darauf, dass die vorherige Sitzung ihre Bereinigung beendet. Ein Port, der von einem anderen Programm oder einer älteren NSH-CLI belegt ist, führt zu einem Fehler, der den Port nennt. Verwende unterschiedliche `--port`-Werte, um mehrere Apps gleichzeitig auszuführen; `--port 0` fordert vom Betriebssystem einen freien Port an.

## nsh dev

```sh
nsh dev [ENTRY] [--target catalyst|ios|android|macos|linux|windows|gpui|web] [--device <DEVICE>] [--server-only] [--port <PORT>] [--release] [--limits [<LIMITS>]]
```

Startet den Dev-Server und öffnet den nativen Host dieses Systems: AppKit unter macOS, GTK unter Linux, Win32 unter Windows. Wähle für die mobile Entwicklung ausdrücklich `--target ios` oder `--target android`. `--server-only` bedient Hosts, die du selbst startest. Der Server baut die App, überwacht das Verzeichnis des Entrys und schickt jeden Rebuild an die verbundenen Hosts. Mit `--server-only` gibt er die URL für Hosts auf diesem Rechner und je eine pro LAN-Adresse für Geräte aus und, sofern die Web-Runtime vorhanden ist, die Seite, die Browser öffnen, um die App auszuführen ([Web](./web.md#develop-in-the-browser)):

```text
✓ built App.tsx (3.2 KB js, 9.8 KB bytecode, 21ms)
→ dev server ws://127.0.0.1:8790/ws
  browsers: http://127.0.0.1:8790/
  devices on this network: ws://192.168.1.20:8790/ws
  browsers on this network: http://192.168.1.20:8790/
```

Verwende `nsh dev --server-only` mit einer App, die das Development-SDK einbettet (`NativeShellDev.xcframework`, `nsh-dev.aar`). `--target`, `--device`, `--port`, `--release` und `--limits` funktionieren wie bei `nsh run`; `--server-only` wählt einen Server ohne gestarteten Host.

## nsh test

```sh
nsh test [PATH] [--filter <NAME>] [--trace] [--fps] [--junit <FILE>] [--target <TARGET>] [--browser <PATH>] [--web-host <JS>] [--display <N>]
```

Führt die Tests der App headless aus ([Testen](./testing-and-trace.md)): die Testdateien (`*.test.tsx`, `*.test.ts`, die `nsh/test` importieren) in `PATH`, einem Verzeichnis (Standard: das aktuelle; versteckte Verzeichnisse, `node_modules` und `target` werden übersprungen), oder die Testdatei `PATH`. Wird ein Verzeichnis einer App mit eigenen Rust-Crates übergeben (`nsh.json` `"rust"`: eine Rust-App oder eine TSX-App mit einem Crate), führt er zuerst `cargo test` für jedes Crate im Verzeichnis aus, im eigenen Verzeichnis des Crates, und zeigt und zählt jeden Rust-Test zusammen mit den TypeScript-Tests, unter der Datei seines Test-Targets (`src/lib.rs › tests::adds`); auch eine Rust-App mit ausschließlich Rust-Tests wird so getestet. Jede Testdatei läuft auf einer eigenen Engine und jede App, die ihre Tests öffnen, auf einer weiteren, frischen. Er gibt pro Test eine Zeile aus und bei einem Fehlschlag, was geworfen wurde, wo in der Testdatei und die Texte auf dem Bildschirm; jeder Fehlschlag lässt ihn mit einem Exit-Code ungleich null enden. Wird der Entry der App übergeben (`nsh test App.tsx`; bei einer Rust-App: `nsh test nsh.json`), öffnet er die App im Netzwerk, lässt sie 1,2 s laufen und führt die Schritte aus, die die Standardeingabe liefert (`await app.press("Add")`, wobei `app` die App ist). Eine TSX-App läuft im eigenen Prozess der CLI; eine App mit eigenen Rust-Crates läuft in einem mit diesen gebauten Headless-Runner, für den die CLI die Entries baut. Headless-Läufe verhalten sich wie iOS, sofern ein Test die App nicht als Android öffnet (`open` mit `platform`): `platform.os` ist `"ios"`, und es gelten `ios:`-Klassen und `ios={{…}}`-Props.

```text
✓ App.test.tsx › counts taps (321ms)
✓ 1 test: 1 passed, 0 failed (343ms)
```

| Flag | Beschreibung |
|---|---|
| `--filter <NAME>` | Führt nur die Tests aus, deren Name (nach den Namen der `describe`-Blöcke, in denen er steht) `NAME` enthält; für die Crates `cargo test <NAME>`. |
| `--trace` | Gibt jeden Mount-Batch der Apps, die die Tests öffnen, unter dem Schritt aus, in dem er kam (`── press(Add): 7 items`), sowie die Zeit jedes Commits: was der erste Frame, ein Schritt oder ein Scroll-Frame kostet. Mit `--target` die Batches und Timings des Hosts. |
| `--fps` | Mit `--target linux`, `macos`, `windows` oder `ios`: Der Host loggt die Messwerte seines Performance-Monitors einmal pro Sekunde (Framerate, Frame-Phasen, Commits, CPU, Speicher), angezeigt mit `-v`. |
| `--junit <FILE>` | Schreibt die Ergebnisse zusätzlich als JUnit-XML-Report nach `FILE`, dem Format, aus dem CI-Dienste Testergebnisse anzeigen: ein `testsuite` pro Testdatei, ein `testcase` pro Test. |
| `--target <TARGET>` | Führt die Apps, die die Tests öffnen, statt headless auf dem Development-Host dieser Plattform aus (`macos`, `linux`, `windows`, `gpui`, `web`, `ios` und `android`; `web` führt sie in einem Headless-Chrome, -Edge oder -Chromium aus): Die Schritte agieren mit der plattformeigenen Eingabe ([Testen](./testing-and-trace.md#on-a-real-platform)), und `open` prüft seine Optionen gegen die Plattform und weist eine zurück, die es nicht einhalten kann (`ERR_NSH_TEST_UNSUPPORTED`: `width` und `height` unter iOS und Android, ein `platform` einer anderen Geräteart). Die Rust-Tests der Crates laufen auf diesem Rechner, in Läufen ohne `--target`. |
| `--browser <PATH>` | Die Chrome-, Edge- oder Chromium-Programmdatei, in der `--target web` die Apps ausführt (Standard: die auf diesem Rechner installierte). |
| `--display <N>` | Mit `--target macos`: das Display, auf dem die Fenster der Apps zentriert geöffnet werden: `1` ist das primäre Display (das mit der Menüleiste), `2` das nächste und so weiter; bei einer Nummer ohne zugehöriges Display öffnen sie sich auf dem Hauptdisplay. Standardmäßig öffnen sie sich auf einem sekundären Display (dem ersten außer dem primären, keine Spiegelung davon), sodass ein Testlauf auf einem eigenen Bildschirm bleibt, und auf dem primären, wenn es das einzige ist. Die Tests laufen auf jedem Display gleich. |
| `--web-host <JS>` | Das Host-Modul der Webseite, das die headless geöffneten Apps erhalten (Standard: `nsh.json` `web.host`; es exportiert `createHost(player)`): Es beantwortet deren [`host`](../modules/nsh.md#host)-Aufrufe, und sein `player.hostEvent` erreicht `host.on` ([Testen](./testing-and-trace.md#the-pages-host)). Nur bei Headless-Läufen; `--target web` führt das `web.host` von `nsh.json` aus. |
## nsh check

```sh
nsh check [ENTRY] [--tsc <TSC>] [-- <TSC ARGS>...]
```

Prüft die Typen der App. Bei einer App mit eigenen Rust-Crates (`nsh.json` `"rust"`) wird zuerst jedes Crate mit `cargo check --all-targets` im Verzeichnis des Crates geprüft, einschließlich seiner Tests; Cargo-Fehler führen zu einem Exit-Code ungleich null. Eine Rust-App (`"root"`) wird anschließend so weit geprüft, wie sie TypeScript enthält: Mit einer `tsconfig.json` (der, die `nsh init --template rust` für `App.test.tsx` schreibt) werden auch ihre Testdateien typgeprüft. Die TypeScript-Prüfung aktualisiert `.nsh/types` und `.nsh/tsconfig.json` und führt dann `tsc -p <app directory> --noEmit` mit der `tsconfig.json` der App aus. Sie verwendet TypeScript 7, den nativen Compiler, der kein Node benötigt: Beim ersten Lauf lädt sie ihn aus der npm-Registry herunter (etwa 9 MB), prüft ihn anhand der Prüfsumme, die NSH vermerkt hat, und legt ihn im Cache von NSH ab (`~/Library/Caches/nsh` unter macOS, `~/.cache/nsh` unter Linux, `%LOCALAPPDATA%\nsh` unter Windows oder `NSH_CACHE`). Typfehler führen zu einem Exit-Code ungleich null. Sie warnt, wenn `tsconfig.json` nicht `./.nsh/tsconfig.json` erweitert, wo NSH seine TypeScript-Einstellungen ablegt ([Projektstruktur](./project-structure.md#tsconfigjson-and-nshtypes)).

| Flag | Beschreibung |
|---|---|
| `--tsc <TSC>` | Stattdessen diesen `tsc` ausführen (auch `NSH_TSC`), zum Beispiel einen aus `node_modules` oder eine Kopie für Rechner ohne Netzwerk. |
| `-- <TSC ARGS>` | Wird an `tsc` weitergereicht, z. B. `nsh check -- --pretty false`. |

Von NSH erzeugte Dateien liegen unter `.nsh/`: Deklarationen, Runner-Quellen sowie standardmäßige Build- und Package-Ausgaben in
`.nsh/out/`. Cargo behält seinen normalen `target/`-Cache und das bestehende `CARGO_TARGET_DIR`-Verhalten; NSH fügt keine
Cargo-Konfiguration hinzu, um ihn zu verlagern. `--out` überschreibt weiterhin den Ausgabeort.

## nsh build

```sh
nsh build [ENTRY] [-o <OUT>] [--release] [--split]
```

Baut die App. Bei einer Rust-App (`nsh.json` `"root"`) baut und beschreibt der Befehl die Crates der App und schreibt `app.json` sowie die Dateien, die mit ausgeliefert werden (`assets/`): Die Runner binden das Stammverzeichnis ein. Bei einer TSX-App bündelt er die App und kompiliert sie zu QuickJS-Bytecode, für Apps, die NSH einbetten und das Bundle selbst ausliefern.

| Flag | Standard | Beschreibung |
|---|---|---|
| `-o, --out <OUT>` | `.nsh/out` | Ausgabeverzeichnis. |
| `--release` | | Minifizieren und Debug-Informationen entfernen. |
| `--split` | | Das, was `import()` lädt, in eigene Chunk-Dateien auslagern, die beim ersten Import heruntergeladen werden (Web-Apps, siehe [Geteilte Bundles](./web.md#split-bundles)). Ohne dieses Flag enthält das Bundle die gesamte App. |

Er schreibt:

| Datei | Inhalt |
|---|---|
| `bundle.js` | Das Bundle als JavaScript |
| `bundle.js.map` | Seine Source Map (Stacktraces werden auf Ihre Quellen zurückabgebildet) |
| `bundle.nshc` | Das Bundle als kompilierter Bytecode: das, was Apps laden |
| `<Chunk>.js`, `<Chunk>.js.map`, `<Chunk>.nshc` | Mit `--split`: jeder Chunk, seine Source Map und sein Bytecode (`Screen.js` für `import("./Screen")`) |
| `capabilities.json` | Die `capabilities` von `nsh.json`, falls deklariert (sonst entfernt) |
| `assets/` | Jedes importierte Bild und jede importierte Schrift, unter ihrem Pfad relativ zum App-Stammverzeichnis |

## nsh package

```sh
nsh package [ENTRY] --target ios|ios-simulator|android|macos|linux|windows|web [-o <OUT>] [flags]
```

Baut eine installierbare App im Release-Modus. Eine Rust-App (`nsh.json` `"root"`) wird mit ihrem eigenen Runner paketiert, der mit Cargo aus Ihren Crates und denen von NSH gebaut wird, wobei ihr Stammverzeichnis ohne QuickJS eingebunden wird ([Mit Rust bauen](./rust.md)); eine TSX-App mit der vorgebauten Runtime. Es ist kein Xcode-Projekt und kein Gradle-Build beteiligt: NSH stellt das App-Bundle selbst zusammen und verwendet `actool` und `codesign` von Xcode (iOS) beziehungsweise `aapt2`, `zipalign` und `apksigner` des SDK (Android); für macOS stellt es ein Ad-hoc-signiertes `.app` mit `codesign` zusammen (und `sips` für das Icon); für Linux kopiert es den Runner und schreibt eine `.tar.gz` mit `tar`; für Windows kopiert es den Runner, bettet das Icon ein und schreibt eine `.zip`, ohne Hilfswerkzeuge; für das Web schreibt es eine statische Website, ebenfalls ohne Hilfswerkzeuge. Die Metadaten stammen aus `nsh.json` und werden von den Flags überschrieben.

| Flag | Beschreibung |
|---|---|
| `--target <TARGET>` | Erforderlich. `ios`: iOS-Geräte, ein signiertes `.ipa` (oder ein unsigniertes `.app` ohne `--sign`). `ios-simulator`: ein Ad-hoc-signiertes `.app`. `android`: ein signiertes `.apk`. `macos`: ein Ad-hoc-signiertes `.app` ([macOS](./macos.md#packaging)). `linux`: ein Verzeichnis `<Name>/` (die ausführbare Datei, `nsh/`, eine `.desktop`-Datei) und `<Name>.tar.gz` ([Linux](./linux.md#packaging)). `windows`: ein Verzeichnis `<Name>\` (`<Name>.exe`, `nsh\`) und `<Name>.zip` ([Windows](./windows.md#packaging)). `web`: ein Verzeichnis `<Name>/`, eine statische Website (`index.html` und nach ihrem Inhalt benannte Dateien) ([Web](./web.md#publish-an-app)). |
| `-o, --out <OUT>` | Ausgabeverzeichnis (Standard `.nsh/out`). |
| `--name <NAME>` | Anzeigename. |
| `--id <ID>` | Bundle-Identifier, z. B. `com.example.app`. |
| `--app-version <VERSION>` | Version, z. B. `1.2.0`. |
| `--build <BUILD>` | Build-Nummer. |
| `--icon <ICON>` | App-Icon: ein quadratisches PNG, idealerweise 1024×1024. |
| `--sign <IDENTITY>` | iOS-Geräte: Code-Signing-Identität, z. B. `"Apple Development: …"`. |
| `--profile <FILE>` | iOS-Geräte: Provisioning Profile (`.mobileprovision`). Die Entitlements stammen daraus. |
| `--keystore <FILE>` | Android: Release-Keystore. Standard: der Debug-Schlüssel in `~/.android/debug.keystore` (wird angelegt, falls er fehlt). |
| `--key-alias <ALIAS>` | Android: Schlüsselalias im Keystore. |
| `--keystore-password <PASSWORD>` | Android: Keystore-Passwort. Wird auch aus `NSH_KEYSTORE_PASSWORD` gelesen. |
| `--abi <ABI>` | Android: die ABIs des APK (`arm64-v8a`, `armeabi-v7a`, `x86_64`), wiederholt oder durch Kommas getrennt angegeben. Standard: `arm64-v8a` und `armeabi-v7a`, plus die des Geräts mit `--run`. |
| `--run` | Die App anschließend installieren und starten: im Simulator (`ios-simulator`) oder auf dem verbundenen Android-Gerät; `macos`, `linux` und `windows` starten sie; `web` stellt die Website auf diesem Rechner unter der ausgegebenen Adresse bereit. |

```sh
nsh package my-app --target ios-simulator --run
nsh package my-app --target ios --sign "Apple Development: Jane Doe (ABCDE12345)" --profile dev.mobileprovision
nsh package my-app --target android --keystore release.jks --key-alias upload
nsh package my-app --target macos
nsh package my-app --target linux
nsh package my-app --target windows
nsh package my-app --target web
```

Siehe [Paketierung](./packaging.md).

## Signing commands

Diese Befehle erstellen und prüfen signierte Pakete (`.nshpkg`): App-Bundles, die Apps mit eingebettetem NSH herunterladen und vor der Ausführung verifizieren. [Signierte Pakete](./signed-packages.md) erklärt das Modell (ein Offline-Root-Key zertifiziert Release-Keys für bestimmte App-IDs).

### nsh keygen

```sh
nsh keygen <NAME>
```

Erstellt ein Ed25519-Schlüsselpaar: `<NAME>.secret` und `<NAME>.pub` (z. B. `nsh keygen keys/root`). Bewahren Sie den `.secret` eines Root-Keys offline auf; Apps vertrauen seinem `.pub`.

### nsh certify

```sh
nsh certify --root <ROOT.secret> --key <KEY.pub> --apps <PATTERN>... [--days <DAYS>] -o <OUT>
```

Zertifiziert einen Release-Key mit einem Root-Key für bestimmte App-IDs und ein Zeitfenster; Pakete tragen das Zertifikat.

| Flag | Beschreibung |
|---|---|
| `--root <ROOT>` | Der geheime Schlüssel des Roots. |
| `--key <KEY>` | Der öffentliche Schlüssel des Release-Keys. |
| `--apps <APPS>` | App-IDs, für die er signieren darf: `*`, `com.example.*` oder eine ID. Wiederholbar. |
| `--days <DAYS>` | Wie lange er signieren darf, ab jetzt (Standard 365). |
| `-o, --out <OUT>` | Das zu schreibende Zertifikat. |

### nsh publish

```sh
nsh publish [ENTRY] --key <KEY.secret> --cert <CERT> [-o <OUT>] [--id <ID>] [--app-version <V>] [--build <N>]
            [--source-map package|file|none] [--strip-debug] [--min-runtime <VERSION>]
```

Baut die App im Release-Modus und signiert sie zu einem Paket. Die Metadaten stammen aus `nsh.json` und werden von den Flags überschrieben.

Wird ein Paket übergeben (`ENTRY` ist eine `.nshpkg`-Datei), signiert der Befehl dieses Paket mit diesem Schlüssel erneut, so wie es eine Plattform tut, die
die Pakete ihrer Apps mit einem eigenen Schlüssel signiert. Die Dateien und der Header des Pakets bleiben unverändert; sein Zertifikat,
der Signaturzeitpunkt und die Signatur werden die des neuen Schlüssels ([Signierte Pakete](./signed-packages.md#sign-a-package-again)). `-o`
kann das gelesene Paket benennen, und nur `--key`, `--cert` und `-o` gelten.

| Flag | Beschreibung |
|---|---|
| `--key <KEY>` | Der geheime Schlüssel des Release-Keys. |
| `--cert <CERT>` | Sein Zertifikat (`nsh certify`). |
| `-o, --out <OUT>` | Das zu schreibende Paket. Standard: `.nsh/out/<id>-<build>.nshpkg`. |
| `--id <ID>` | App-ID. |
| `--app-version <VERSION>` | Version. |
| `--build <BUILD>` | Build-Nummer: muss mit jedem Release steigen. |
| `--source-map <WHERE>` | Wohin die Source Map kommt: `package` (Standard), `file` (`<package>.map` neben dem Paket) oder `none` ([Signierte Pakete](./signed-packages.md#errors-from-published-packages)). |
| `--strip-debug` | Die Zeilen- und Spaltentabellen im Bytecode weglassen: kleiner, aber Fehler-Stacks enthalten keine Positionen. |
| `--min-runtime <VERSION>` | Die älteste Runtime, die das Paket ausführt, z. B. `0.2.0`; ältere Runtimes lehnen es ab. Standard: die Version dieser CLI ([Signierte Pakete](./signed-packages.md#which-runtimes-run-a-package)). |

### nsh verify

```sh
nsh verify <PACKAGE> [--root <ROOT.pub>]... [--revocations <LIST>]
```

Verifiziert ein Paket so, wie es eine App täte, die den angegebenen Roots vertraut. Ohne `--root` wird nur die eigene Signatur des Pakets geprüft. Der Befehl gibt das SHA-256 des Pakets aus, das `nsh revoke --package` entgegennimmt.

### nsh symbolicate

```sh
nsh symbolicate <MAP> [INPUT]
```

Schreibt die Bundle-Positionen (`bundle.js:LINE:COL`) eines Fehlers, den ein Paket gemeldet hat, auf Ihre Quellen um und gibt das
Ergebnis aus. `MAP` ist eine Source Map (`<package>.map` aus `nsh publish --source-map file`, `bundle.js.map`) oder ein Paket, das
eine enthält; `INPUT` ist der Fehlertext (Standard: Standardeingabe).

### nsh revoke

```sh
nsh revoke --root <ROOT.secret> [--extend <LIST>] [--sequence <N>] [--key <ID>]... [--package <SHA256>]... -o <OUT>
```

Signiert eine Sperrliste: Release-Keys und Pakete, die nicht mehr geladen werden dürfen.

| Flag | Beschreibung |
|---|---|
| `--root <ROOT>` | Der geheime Schlüssel des Roots. |
| `--extend <EXTEND>` | Die Einträge dieser Liste übernehmen (der zuletzt veröffentlichten). |
| `--sequence <N>` | Die Nummer der Liste, höher als jede zuvor veröffentlichte. Standard mit `--extend`: die Nummer dieser Liste plus eins. |
| `--key <ID>` | Eine zu sperrende Release-Key-ID. Wiederholbar. |
| `--package <SHA256>` | Ein zu sperrendes Paket-SHA-256. Wiederholbar. |
| `-o, --out <OUT>` | Die zu schreibende Liste. |

## Environment variables

| Variable | Verwendet von | Beschreibung |
|---|---|---|
| `ANDROID_HOME`, `ANDROID_SDK_ROOT` | Android-Targets | Das Android SDK. Fallback: `~/Library/Android/sdk`. |
| `CARGO_TARGET_DIR` | Apps mit Rust-Crates | Wo die Runner der App gebaut werden. Standard: das `target/` der App. |
| `NSH_KEYSTORE_PASSWORD` | `package --target android` | Das Keystore-Passwort. |
| `NSH_RUNTIME` | `run`, `package` | Ein Runtime-Verzeichnis, das statt des Verzeichnisses neben der CLI verwendet wird. |
| `NSH_VERBOSE` | jeder Befehl | `1`: wie `--verbose`. |
| `NSH_WASM_BINDGEN` | `run`, `package` (`--target web`) | Die `wasm-bindgen`-CLI für eine App, deren Crates [Browser-APIs aufrufen](./web.md#browser-apis-from-rust). Standard: die auf `PATH`. |
| `NO_COLOR` | jeder Befehl | Gesetzt: keine Farben in Terminals. |
