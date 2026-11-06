---
title: "Installation"
description: "So erhalten Sie den NSH-Befehl, entweder aus einer vorkompilierten Distribution oder aus einem Source-Checkout, sowie die Tools, die jede Plattform benötigt – iOS, Android, macOS, Windows und Linux."
order: 3
group: start
source_hash: ee1dd93b8166b092
---


# Installation

Alles in NSH läuft über einen Befehl, `nsh`. Er baut Apps, die in Rust oder TSX geschrieben sind, führt sie auf jeder Plattform aus, liefert TSX mit Hot Updates an Entwicklungs-Hosts und paketiert installierbare Apps. Du kannst ihn aus einer vorgefertigten Distribution verwenden oder aus einem Checkout des Repositorys bauen.

Apps in Rust benötigen zusätzlich eine Rust-Toolchain ([siehe unten](#for-apps-written-in-rust)); TSX-Apps brauchen nur `nsh`. Darüber hinaus benötigt jede Plattform ihre eigenen Tools:

| Plattform | Entwickeln und paketieren unter | Benötigt |
|---|---|---|
| iOS | macOS | Xcode und eine iOS-Simulator-Runtime |
| Android | macOS, Windows oder Linux | Das Android SDK und ein JDK; einen Emulator oder ein Gerät |
| macOS | macOS | Die Command Line Tools von Xcode; Apps laufen ab macOS 14 |
| Windows | Windows | Windows 10 1809+; die WebView2 Runtime für Web Views |
| Linux | Linux | GTK 4.14+ (und die zugehörigen Entwicklungspakete, um die Runtime zu bauen) |
| [GPUI](./gpui.md) (Einbettung in GPUI-Apps) | macOS, Windows oder Linux | Eine GPU (Metal, DirectX oder Vulkan); unter Linux Wayland oder X11 |

Auf macOS ist der AppKit-Host der Standard. Mac Catalyst (`--target catalyst`) benötigt wie iOS Xcode. Details findest du unter [Plattform-Tools](#platform-tools).

<a id="installing-a-release"></a>

## Ein Release installieren

Jedes [GitHub-Release](https://github.com/longbridge/nsh/releases) enthält die vorgefertigte Distribution (siehe unten) für macOS (Apple Silicon), Linux x86_64 und Windows x86_64. Jede Installationsart legt denselben Befehl `nsh` in deinen `PATH`.

**macOS und Linux** mit dem Installationsskript:

```sh
curl -fsSL https://nsh.dev/install.sh | sh
```

Es installiert die Distribution nach `~/.nsh` und verlinkt `~/.local/bin/nsh` darauf; erneutes Ausführen aktualisiert sie. `NSH_VERSION=v0.1.0` legt ein bestimmtes Release fest, `NSH_INSTALL_DIR` wählt ein anderes Verzeichnis.

**Windows** in PowerShell:

```powershell
irm https://nsh.dev/install.ps1 | iex
```

Es installiert nach `%LOCALAPPDATA%\nsh` und fügt dessen `bin` zu deinem `PATH` des Benutzers hinzu (öffne danach ein neues Terminal). `$env:NSH_VERSION` und `$env:NSH_INSTALL_DIR` funktionieren wie oben.

**Homebrew** (macOS und Linux):

```sh
brew install longbridge/tap/nsh
```

**Scoop** (Windows):

```powershell
scoop install https://github.com/longbridge/nsh/releases/latest/download/nsh.json
```

**mise** (alle drei):

```sh
mise use -g github:longbridge/nsh
```

Die Archive (`nsh-macos-arm64.tar.gz`, `nsh-linux-x86_64.tar.gz`, `nsh-windows-x86_64.zip`, jeweils mit einer `.sha256`) tragen keine Version im Namen, daher lädt `https://github.com/longbridge/nsh/releases/latest/download/<archive>` immer die neueste herunter. Die Embedding-SDKs werden außerdem einzeln veröffentlicht, für native Apps, die keine CLI benötigen: `nsh-embed-ios.zip` und `nsh-embed-android.zip`.

> [!NOTE]
> Die Binaries sind noch nicht signiert. macOS versetzt Dateien, die ein Browser heruntergeladen hat, in Quarantäne; das Installationsskript, Homebrew und mise laden mit `curl` herunter und sind davon nicht betroffen, andernfalls führe `xattr -dr com.apple.quarantine <dir>` aus. Die Linux-Runtime benötigt glibc 2.39 und GTK 4.14 oder neuer (Ubuntu 24.04 und später). Es gibt keinen Build für Intel-Macs sowie für arm64-Linux und -Windows: Baue diese aus einem Checkout.

<a id="for-apps-written-in-rust"></a>

## Für Apps in Rust

Installiere Rust über [rustup](https://rustup.rs). `nsh` baut den Runner einer Rust-App für jedes Ziel mit Cargo, aus deinem Crate und den NSH-Crates von crates.io in der Version der CLI. Füge daher die Rust-Targets der Plattformen hinzu, auf denen du die App ausführst:

```sh
rustup target add aarch64-apple-ios-sim aarch64-apple-ios aarch64-apple-ios-macabi   # iOS simulator, devices, Mac Catalyst
rustup target add aarch64-linux-android armv7-linux-androideabi x86_64-linux-android # Android (with the SDK's NDK)
rustup target add wasm32-unknown-unknown                                             # the web
```

Die Desktops werden für den Rechner gebaut, auf dem du arbeitest. `cargo run` im Verzeichnis einer Rust-App startet sie direkt auf dem Desktop-Backend; dabei wird mit den Entwicklungsbibliotheken des Backends gebaut ([Plattform-Tools](#platform-tools)). Android-Builds verwenden außerdem ein **NDK** aus dem SDK, genau wie das [Bauen der Android-Runtime](#building-the-android-runtime).

<a id="the-prebuilt-distribution"></a>

## Die vorgefertigte Distribution

Die Distribution ist ein Verzeichnis, `dist/nsh`, mit der CLI und den vorgefertigten nativen Runtimes, mit denen sie Apps paketiert:

```sh
dist/nsh/bin/nsh                                             # the CLI
dist/nsh/runtime/ios/iphoneos/nsh-ios-app                    # runs packaged apps on iOS devices
dist/nsh/runtime/ios/iphonesimulator/{nsh-ios-app,nsh-ios-host}
dist/nsh/runtime/ios/maccatalyst/nsh-ios-host                # the Mac Catalyst development host
dist/nsh/runtime/android/{release,dev}/                      # classes.dex, lib/<abi>/libnsh.so, symbols/<abi>/libnsh.so
dist/nsh/runtime/macos/{nsh-macos-host,nsh-macos-app}        # the macOS (AppKit) development host and release runner
dist/nsh/runtime/linux/{nsh-linux-host,nsh-linux-app}        # the Linux development host and release runner
dist/nsh/runtime/windows/{nsh-windows-host,nsh-windows-app}.exe  # the Windows development host and release runner
dist/nsh/runtime/gpui/nsh-gpui-host[.exe]                    # the GPUI development host, for this OS
dist/nsh/runtime/web/{nsh.wasm,nsh-dev.wasm,nsh.js}          # the web runtimes (nsh package / run --target web)
dist/nsh/embed/ios/{NativeShell,NativeShellDev}.xcframework  # embedding in iOS apps
dist/nsh/embed/android/{nsh,nsh-dev}.aar                     # embedding in Android apps
```

Lege `dist/nsh/bin` in deinen `PATH` (oder rufe `dist/nsh/bin/nsh` direkt auf) und halte das Verzeichnis zusammen: `nsh` findet die Runtimes neben sich selbst, in `bin/../runtime` (auch über einen Symlink darauf, wie ihn die Installer ebenfalls anlegen).

```sh
export PATH="$PWD/dist/nsh/bin:$PATH"
nsh --version
```

Die Distribution wird mit `cargo xtask dist` in einem Checkout erstellt (siehe unten). Die darin enthaltene Binary `nsh` wird für diesen Rechner gebaut. Auf einem Mac mit Xcode enthält sie die iOS- und macOS-Runtimes (Apple Silicon); unter Linux stattdessen die Linux-Runtime, ebenfalls für diesen Rechner gebaut; unter Windows die Windows-Runtime mit `bin\nsh.exe`. Jede enthält außerdem den Entwicklungs-Host für [GPUI](./gpui.md), für diesen Rechner gebaut. Alle enthalten die Android-Runtime (unter Windows nur, wenn das Android SDK gefunden wird).

<a id="installing-the-latest-source"></a>

## Den neuesten Quellcode installieren

Installiere unter macOS und Linux den neuesten `main` mit Git, Rust und den unten genannten Build-Abhängigkeiten der Plattform:

```sh
curl -fsSL https://nsh.dev/install.sh | sh -s -- --source
nsh -V # nsh 0.1.1 (abcdef0)
```

Der Installer hält den Checkout in `~/.nsh/source`, baut die Release-CLI und verlinkt sie in `~/.local/bin`. Führe den Befehl erneut aus, um zu aktualisieren; lokale Änderungen am Quellcode müssen zuvor gespeichert sein. Der behaltene Checkout erlaubt es NSH, native Runtimes bei Bedarf zu bauen. Cargo verwendet seine bestehende Konfiguration und sein vorhandenes Target-Verzeichnis. `NSH_INSTALL_DIR` ändert das Installationspräfix; `NSH_VERSION` wählt ausschließlich vorgefertigte Releases. Sowohl `-V` als auch `--version` zeigen die Version und die siebenstellige Revision des Quellcodes an.

<a id="building-from-a-checkout"></a>

## Aus einem Checkout bauen

Du benötigst Rust über [rustup](https://rustup.rs). Die `rust-toolchain.toml` des Repositorys wählt die stabile Toolchain und installiert beim ersten Gebrauch die iOS- und Android-Targets.

```sh
git clone https://github.com/longbridge/nsh.git
cd nsh
cargo build -p nsh-cli          # ./target/debug/nsh
```

Baue anschließend einmalig den Entwicklungs-Host jedes Ziels, auf dem du ausführen möchtest, und wiederhole das nach jeder Aktualisierung des Checkouts:

```sh
cargo build -p nsh-ios-host --target aarch64-apple-ios-macabi   # nsh run (Mac Catalyst window)
cargo build -p nsh-ios-host --target aarch64-apple-ios-sim      # nsh run --target ios
cargo xtask android --dev                                       # nsh run --target android
cargo build -p nsh-macos-host                                   # nsh run --target macos (built for you in a checkout)
cargo build -p nsh-linux-host                                   # nsh run on Linux (built for you in a checkout)
cargo build -p nsh-windows-host                                 # nsh run on Windows (built for you in a checkout)
cargo build --manifest-path crates/gpui/Cargo.toml --target-dir target -p nsh-gpui-host   # nsh run --target gpui (built for you in a checkout)
cargo build --profile web -p nsh-platform-web --target wasm32-unknown-unknown   # nsh run --target web (built for you in a checkout)
```

Baue für `nsh package` zusätzlich die Release-Runner:

```sh
cargo build -p nsh-ios-app --target aarch64-apple-ios-sim       # nsh package --target ios-simulator
cargo build -p nsh-ios-app --target aarch64-apple-ios           # nsh package --target ios
cargo xtask android                                             # nsh package --target android
cargo build -p nsh-macos-app                                    # nsh package --target macos
cargo build -p nsh-linux-app                                    # nsh package --target linux
cargo build -p nsh-windows-app                                  # nsh package --target windows
# nsh package --target web uses the same web runtime as nsh run --target web
```

Eine aus einem Checkout gebaute CLI sucht die Runtimes in `target/<triple>/<profile>` (die für macOS, Linux, Windows und GPUI, für diesen Rechner gebaut, in `target/<profile>`) und `target/android/<profile>[-dev]`, und zwar mit ihrem eigenen Profil: `./target/debug/nsh` verwendet Debug-Runtimes, `./target/release/nsh` Release-Runtimes. Baue beide mit demselben Profil (füge `--release` bei allen hinzu, um schnellere Apps zu erhalten).

> [!TIP]
> `NSH_RUNTIME=/path/to/runtime` sorgt dafür, dass `nsh` ein Runtime-Verzeichnis verwendet, das wie das `runtime/` der Distribution aufgebaut ist, unabhängig davon, wo die CLI selbst liegt.

<a id="platform-tools"></a>

## Plattform-Tools

<a id="ios-and-mac-catalyst"></a>

### iOS und Mac Catalyst

- **Xcode** (mit seinen Command Line Tools). `nsh run` verwendet `xcrun simctl`, um Simulatoren zu starten und den Entwicklungs-Host zu installieren; `nsh package` verwendet `actool` für App-Icons und `codesign` zum Signieren.
- Eine iOS-Simulator-Runtime. Ist keine installiert, installiere eine mit `xcodebuild -downloadPlatform iOS`.
- Apps unterstützen iOS 15.0 und neuer.

### Android

- **Das Android SDK**, gefunden über `ANDROID_HOME`, `ANDROID_SDK_ROOT` oder den Standardort von Android Studio (`~/Library/Android/sdk`, unter Windows `%LOCALAPPDATA%\Android\Sdk`), mit:
  - `platforms;android-35` und einem aktuellen `build-tools` (NSH verwendet daraus `aapt2`, `zipalign` und `apksigner`, kein Gradle);
  - `platform-tools` (`adb`).
- **Ein JDK** (`keytool` erstellt den Debug-Keystore in `~/.android/debug.keystore` beim ersten Paketieren, `apksigner` benötigt Java).
- Einen laufenden Emulator oder ein über `adb` verbundenes Gerät. Apps benötigen Android 9 (API 28) oder neuer.

```sh
sdkmanager "platforms;android-35" "build-tools;35.0.1" "platform-tools"
```

### macOS

- **Die Command Line Tools von Xcode** (`xcode-select --install`): das SDK und clang zum Bauen der Runtime, `codesign` und `sips` zum Paketieren von Apps.
- Apps benötigen macOS 14 oder neuer.

Siehe [macOS](./macos.md).

### Linux

- **GTK 4.14** oder neuer, mit den zugehörigen Entwicklungspaketen und clang, um die Runtime zu bauen: `libgtk-4-dev clang` (Debian, Ubuntu 24.04 oder neuer), `gtk4 clang` (Arch), `gtk4-devel clang` (Fedora).
- **WebKitGTK 6.0** (2.40 oder neuer) für Web Views: `libwebkitgtk-6.0-dev` (Debian, Ubuntu), `webkitgtk-6.0` (Arch), `webkitgtk6.0-devel` (Fedora), um die Runtime zu bauen; Apps benötigen es dann dort, wo sie laufen. Ohne WebKitGTK baut `cargo xtask dist` die Runtime mit Platzhaltern für Web Views.
- **GStreamer**-Plugins für die Videoformate, die Apps abspielen.

Siehe [Linux](./linux.md).

### Windows

- **Windows 10 1809** oder neuer, oder Windows 11. Die WebView2 Runtime (Teil von Windows 11, unter Windows 10 mit Edge installiert) für Web Views.
- Zum Bauen der Runtime: **Visual Studio Build Tools** mit dem Workload „Desktopentwicklung mit C++“ und dem Windows SDK sowie **LLVM** (libclang, für die Bindings von QuickJS; gefunden in `C:\Program Files\LLVM`, andernfalls setze `LIBCLANG_PATH`).

Siehe [Windows](./windows.md).

<a id="building-the-android-runtime"></a>

### Die Android-Runtime bauen

Das Bauen der Android-Runtime aus einem Checkout (`cargo xtask android`) benötigt zusätzlich ein **NDK** aus dem SDK (`ndk;<version>`; setze `ANDROID_NDK_HOME`, falls die neueste installierte Version unvollständig ist) und `javac`.

<a id="what-works-where"></a>

## Was wo funktioniert

| Befehl | macOS | Linux | Windows |
|---|---|---|---|
| `nsh init`, `nsh build`, `nsh test`, `nsh dev`, `nsh check` | Ja | Ja | Ja |
| `nsh run --target catalyst` (Mac Catalyst) | Ja | Nein | Nein |
| `nsh run --target macos`, `nsh package --target macos` | Ja | Nein | Nein |
| `nsh run --target linux` (der Standard unter Linux), `nsh package --target linux` | Nein | Ja | Nein |
| `nsh run --target windows` (der Standard unter Windows), `nsh package --target windows` | Nein | Nein | Ja |
| `nsh run --target gpui` (das Backend, das GPUI-Apps einbetten) | Ja | Ja | Ja |
| `nsh run --target ios`, `nsh package --target ios` / `ios-simulator` | Ja, mit Xcode | Nein | Nein |
| `nsh run --target android`, `nsh package --target android` | Ja | Ja, aus einem Checkout | Ja, mit der Android-Runtime |
| `nsh keygen`, `certify`, `publish`, `verify`, `revoke` | Ja | Ja | Ja |

Baue unter Linux die CLI und die Android-Runtime aus einem Checkout (`cargo build -p nsh-cli` und `cargo xtask android --dev`); die Linux-Toolchain des NDK wird automatisch verwendet. Unter Windows wird die Windows-Toolchain des NDK auf dieselbe Weise verwendet, und `cargo xtask dist` nimmt die Android-Runtime auf, sobald es das Android SDK findet.

<a id="editor-setup"></a>

## Editor-Einrichtung

Eine Rust-App ist ein Cargo-Projekt: rust-analyzer (VS Code, Zed, Neovim, RustRover) prüft sie und vervollständigt die API von NSH samt Doc-Kommentaren, wie bei jedem anderen Crate.

Für TSX benötigt NSH kein NPM. `nsh init` schreibt eine `tsconfig.json` und die Typdeklarationen von allem, was NSH bereitstellt, nach `.nsh/types`, und jeder Befehl, der die App baut, hält sie aktuell. Jeder Editor, der den TypeScript Language Server verwendet (VS Code, Zed, Neovim, WebStorm), prüft die App damit auf Typen. Siehe [Projektstruktur](./project-structure.md#tsconfigjson-and-nshtypes).

<a id="next-steps"></a>

## Nächste Schritte

Fahre mit [Erste Schritte](./getting-started.md) fort, um eine App zu erstellen und auszuführen.
