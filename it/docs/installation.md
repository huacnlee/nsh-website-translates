---
title: "Installazione"
description: "Ottieni il comando NSH, da una distribuzione precompilata o da un checkout del codice sorgente, e gli strumenti necessari per ogni piattaforma: iOS, Android, macOS, Windows e Linux."
order: 3
group: start
source_hash: ee1dd93b8166b092
---

# Installazione

Tutto ciò che fa NSH passa da un unico comando, `nsh`. Compila app scritte in Rust o TSX, le esegue su ogni piattaforma, serve TSX agli host di sviluppo con aggiornamenti a caldo e crea i pacchetti delle app installabili. Puoi usarlo da una distribuzione precompilata o compilarlo da un checkout del repository.

Le app scritte in Rust richiedono anche una toolchain Rust ([sotto](#for-apps-written-in-rust)); le app TSX hanno bisogno solo di `nsh`. Inoltre, ogni piattaforma richiede i propri strumenti:

| Piattaforma | Sviluppo e packaging su | Requisiti |
|---|---|---|
| iOS | macOS | Xcode e un runtime del simulatore iOS |
| Android | macOS, Windows o Linux | L'Android SDK e un JDK; un emulatore o un dispositivo |
| macOS | macOS | Gli strumenti da riga di comando di Xcode; le app girano su macOS 14+ |
| Windows | Windows | Windows 10 1809+; il WebView2 Runtime per le web view |
| Linux | Linux | GTK 4.14+ (e i relativi pacchetti di sviluppo per compilare il runtime) |
| [GPUI](./gpui.md) (integrazione nelle app GPUI) | macOS, Windows o Linux | Una GPU (Metal, DirectX o Vulkan); su Linux, Wayland o X11 |

L'host AppKit è quello predefinito su macOS. Mac Catalyst (`--target catalyst`) richiede Xcode come iOS. I dettagli sono in [Strumenti per piattaforma](#platform-tools).

<a id="installing-a-release"></a>

## Installare una release

Ogni [release su GitHub](https://github.com/longbridge/nsh/releases) contiene la distribuzione precompilata (sotto) per macOS (Apple silicon), Linux x86_64 e Windows x86_64. Ogni modalità di installazione mette lo stesso comando `nsh` nel tuo `PATH`.

**macOS e Linux**, con lo script di installazione:

```sh
curl -fsSL https://nsh.dev/install.sh | sh
```

Installa la distribuzione in `~/.nsh` e crea un collegamento da `~/.local/bin/nsh`; eseguirlo di nuovo la aggiorna. `NSH_VERSION=v0.1.0` fissa una release, `NSH_INSTALL_DIR` sceglie un'altra directory.

**Windows**, in PowerShell:

```powershell
irm https://nsh.dev/install.ps1 | iex
```

Installa in `%LOCALAPPDATA%\nsh` e aggiunge il suo `bin` al `PATH` dell'utente (apri poi un nuovo terminale). `$env:NSH_VERSION` e `$env:NSH_INSTALL_DIR` funzionano come sopra.

**Homebrew** (macOS e Linux):

```sh
brew install longbridge/tap/nsh
```

**Scoop** (Windows):

```powershell
scoop install https://github.com/longbridge/nsh/releases/latest/download/nsh.json
```

**mise** (tutti e tre):

```sh
mise use -g github:longbridge/nsh
```

Gli archivi (`nsh-macos-arm64.tar.gz`, `nsh-linux-x86_64.tar.gz`, `nsh-windows-x86_64.zip`, ciascuno con un `.sha256`) non riportano la versione nel nome, quindi `https://github.com/longbridge/nsh/releases/latest/download/<archive>` scarica sempre l'ultima. Gli SDK di integrazione sono rilasciati anche separatamente, per le app native che non hanno bisogno della CLI: `nsh-embed-ios.zip` e `nsh-embed-android.zip`.

> [!NOTE]
> I binari non sono ancora firmati. macOS mette in quarantena i file scaricati da un browser; lo script di installazione, Homebrew e mise scaricano con `curl` e non sono interessati, altrimenti esegui `xattr -dr com.apple.quarantine <dir>`. Il runtime Linux richiede glibc 2.39 e GTK 4.14 o successivo (Ubuntu 24.04 e successive). Non esiste una build per Mac Intel né per Linux / Windows arm64: compilale da un checkout.

<a id="for-apps-written-in-rust"></a>

## Per le app scritte in Rust

Installa Rust tramite [rustup](https://rustup.rs). `nsh` compila il runner di un'app Rust per ciascun target con Cargo, a partire dal tuo crate e dai crate di NSH su crates.io alla versione della CLI, quindi aggiungi i target Rust delle piattaforme su cui esegui:

```sh
rustup target add aarch64-apple-ios-sim aarch64-apple-ios aarch64-apple-ios-macabi   # iOS simulator, devices, Mac Catalyst
rustup target add aarch64-linux-android armv7-linux-androideabi x86_64-linux-android # Android (with the SDK's NDK)
rustup target add wasm32-unknown-unknown                                             # the web
```

I desktop compilano per la macchina in uso. `cargo run` nella directory di un'app Rust la avvia direttamente sul backend desktop, che compila con le librerie di sviluppo del backend ([Strumenti per piattaforma](#platform-tools)). Le build Android usano anche un **NDK** dell'SDK, come fa la [compilazione del runtime Android](#building-the-android-runtime).

<a id="the-prebuilt-distribution"></a>

## La distribuzione precompilata

La distribuzione è una directory, `dist/nsh`, con la CLI e i runtime nativi precompilati con cui impacchetta le app:

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

Metti `dist/nsh/bin` nel tuo `PATH` (oppure chiama direttamente `dist/nsh/bin/nsh`) e mantieni la directory unita: `nsh` trova i runtime accanto a sé, in `bin/../runtime` (anche tramite un collegamento simbolico, come quelli creati dagli installer).

```sh
export PATH="$PWD/dist/nsh/bin:$PATH"
nsh --version
```

La distribuzione viene creata con `cargo xtask dist` in un checkout (sotto). Il binario `nsh` che contiene è compilato per quella macchina. Su un Mac con Xcode include i runtime iOS e macOS (Apple Silicon); su Linux include invece il runtime Linux, compilato per quella macchina; su Windows il runtime Windows, con `bin\nsh.exe`. Ognuna include anche l'host di sviluppo [GPUI](./gpui.md), compilato per quella macchina. Tutte includono il runtime Android (su Windows solo se viene trovato l'Android SDK).

<a id="installing-the-latest-source"></a>

## Installare l'ultimo codice sorgente

Su macOS e Linux, installa l'ultimo `main` con Git, Rust e le dipendenze di build della piattaforma indicate sotto:

```sh
curl -fsSL https://nsh.dev/install.sh | sh -s -- --source
nsh -V # nsh 0.1.1 (abcdef0)
```

L'installer mantiene il checkout in `~/.nsh/source`, compila la CLI in release e la collega in `~/.local/bin`. Riesegui il comando per aggiornare; le modifiche locali al sorgente vanno prima salvate. Il checkout conservato permette a NSH di compilare i runtime nativi su richiesta. Cargo usa la configurazione e la directory target esistenti. `NSH_INSTALL_DIR` cambia il prefisso di installazione; `NSH_VERSION` seleziona solo le release precompilate. Sia `-V` sia `--version` mostrano la versione e la revisione del sorgente di sette caratteri.

<a id="building-from-a-checkout"></a>

## Compilare da un checkout

Ti serve Rust tramite [rustup](https://rustup.rs). Il file `rust-toolchain.toml` del repository seleziona la toolchain stable e installa i target iOS e Android al primo utilizzo.

```sh
git clone https://github.com/longbridge/nsh.git
cd nsh
cargo build -p nsh-cli          # ./target/debug/nsh
```

Poi compila l'host di sviluppo di ogni target su cui vuoi eseguire, una volta, e di nuovo dopo aver aggiornato il checkout:

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

Per `nsh package`, compila anche i runner release:

```sh
cargo build -p nsh-ios-app --target aarch64-apple-ios-sim       # nsh package --target ios-simulator
cargo build -p nsh-ios-app --target aarch64-apple-ios           # nsh package --target ios
cargo xtask android                                             # nsh package --target android
cargo build -p nsh-macos-app                                    # nsh package --target macos
cargo build -p nsh-linux-app                                    # nsh package --target linux
cargo build -p nsh-windows-app                                  # nsh package --target windows
# nsh package --target web uses the same web runtime as nsh run --target web
```

Una CLI compilata da un checkout cerca i runtime in `target/<triple>/<profile>` (quelli macOS, Linux, Windows e GPUI, compilati per questa macchina, in `target/<profile>`) e `target/android/<profile>[-dev]`, usando il proprio profilo: `./target/debug/nsh` usa i runtime debug, `./target/release/nsh` quelli release. Compila entrambi con lo stesso profilo (aggiungi `--release` a tutti per app più veloci).

> [!TIP]
> `NSH_RUNTIME=/path/to/runtime` fa sì che `nsh` usi una directory di runtime organizzata come `runtime/` della distribuzione, ovunque si trovi la CLI stessa.

<a id="platform-tools"></a>

## Strumenti per piattaforma

<a id="ios-and-mac-catalyst"></a>

### iOS e Mac Catalyst

- **Xcode** (con i suoi strumenti da riga di comando). `nsh run` usa `xcrun simctl` per avviare i simulatori e installare l'host di sviluppo; `nsh package` usa `actool` per le icone delle app e `codesign` per la firma.
- Un runtime del simulatore iOS. Se non ne è installato nessuno, installane uno con `xcodebuild -downloadPlatform iOS`.
- Le app hanno come target iOS 15.0 e successivi.

### Android

- **L'Android SDK**, trovato tramite `ANDROID_HOME`, `ANDROID_SDK_ROOT` o la posizione predefinita di Android Studio (`~/Library/Android/sdk`, `%LOCALAPPDATA%\Android\Sdk` su Windows), con:
  - `platforms;android-35` e un `build-tools` recente (NSH usa `aapt2`, `zipalign` e `apksigner` al suo interno, senza Gradle);
  - `platform-tools` (`adb`).
- **Un JDK** (`keytool` crea il keystore di debug in `~/.android/debug.keystore` la prima volta che impacchetti, `apksigner` richiede Java).
- Un emulatore in esecuzione o un dispositivo collegato tramite `adb`. Le app richiedono Android 9 (API 28) o successivo.

```sh
sdkmanager "platforms;android-35" "build-tools;35.0.1" "platform-tools"
```

### macOS

- **Gli strumenti da riga di comando di Xcode** (`xcode-select --install`): l'SDK e clang per compilare il runtime, `codesign` e `sips` per impacchettare le app.
- Le app richiedono macOS 14 o successivo.

Vedi [macOS](./macos.md).

### Linux

- **GTK 4.14** o successivo, con i relativi pacchetti di sviluppo e clang per compilare il runtime: `libgtk-4-dev clang` (Debian, Ubuntu 24.04 o successivo), `gtk4 clang` (Arch), `gtk4-devel clang` (Fedora).
- **WebKitGTK 6.0** (2.40 o successivo) per le web view: `libwebkitgtk-6.0-dev` (Debian, Ubuntu), `webkitgtk-6.0` (Arch), `webkitgtk6.0-devel` (Fedora) per compilare il runtime; le app ne hanno poi bisogno dove vengono eseguite. Senza, `cargo xtask dist` compila il runtime con dei segnaposto per le web view.
- I plugin **GStreamer** per i formati video riprodotti dalle app.

Vedi [Linux](./linux.md).

### Windows

- **Windows 10 1809** o successivo, oppure Windows 11. Il WebView2 Runtime (incluso in Windows 11, installato con Edge su Windows 10) per le web view.
- Per compilare il runtime: **Visual Studio Build Tools** con il carico di lavoro "Desktop development with C++" e il Windows SDK, e **LLVM** (libclang, per i binding di QuickJS; trovato in `C:\Program Files\LLVM`, altrimenti imposta `LIBCLANG_PATH`).

Vedi [Windows](./windows.md).

<a id="building-the-android-runtime"></a>

### Compilare il runtime Android

Compilare il runtime Android da un checkout (`cargo xtask android`) richiede inoltre un **NDK** dell'SDK (`ndk;<version>`; imposta `ANDROID_NDK_HOME` se l'ultimo installato è incompleto) e `javac`.

<a id="what-works-where"></a>

## Cosa funziona dove

| Comando | macOS | Linux | Windows |
|---|---|---|---|
| `nsh init`, `nsh build`, `nsh test`, `nsh dev`, `nsh check` | Sì | Sì | Sì |
| `nsh run --target catalyst` (Mac Catalyst) | Sì | No | No |
| `nsh run --target macos`, `nsh package --target macos` | Sì | No | No |
| `nsh run --target linux` (il predefinito su Linux), `nsh package --target linux` | No | Sì | No |
| `nsh run --target windows` (il predefinito su Windows), `nsh package --target windows` | No | No | Sì |
| `nsh run --target gpui` (il backend che le app GPUI integrano) | Sì | Sì | Sì |
| `nsh run --target ios`, `nsh package --target ios` / `ios-simulator` | Sì, con Xcode | No | No |
| `nsh run --target android`, `nsh package --target android` | Sì | Sì, da un checkout | Sì, con il runtime Android |
| `nsh keygen`, `certify`, `publish`, `verify`, `revoke` | Sì | Sì | Sì |

Su Linux, compila la CLI e il runtime Android da un checkout (`cargo build -p nsh-cli` e `cargo xtask android --dev`); la toolchain Linux dell'NDK viene usata automaticamente. Su Windows la toolchain Windows dell'NDK viene usata allo stesso modo, e `cargo xtask dist` include il runtime Android quando trova l'Android SDK.

<a id="editor-setup"></a>

## Configurazione dell'editor

Un'app Rust è un progetto Cargo: rust-analyzer (VS Code, Zed, Neovim, RustRover) la controlla e completa l'API di NSH, con i relativi commenti di documentazione, come per qualsiasi crate.

Per TSX, NSH non richiede NPM. `nsh init` scrive un `tsconfig.json` e le dichiarazioni di tipo di tutto ciò che NSH fornisce in `.nsh/types`, e ogni comando che compila l'app le mantiene aggiornate. Qualsiasi editor che usa il language server di TypeScript (VS Code, Zed, Neovim, WebStorm) esegue il type-check dell'app con esse. Vedi [Struttura del progetto](./project-structure.md#tsconfigjson-and-nshtypes).

<a id="next-steps"></a>

## Passi successivi

Continua con [Per iniziare](./getting-started.md) per creare un'app ed eseguirla.
