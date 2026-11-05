---
title: "Installation"
description: "Obtenez la commande NSH, à partir d'une distribution précompilée ou d'une copie des sources, ainsi que les outils nécessaires à chaque plateforme : iOS, Android, macOS, Windows et Linux."
order: 3
group: start
source_hash: ee1dd93b8166b092
---

# Installation

Tout ce que fait NSH passe par une seule commande, `nsh`. Elle compile des apps écrites en Rust ou en TSX, les exécute sur toutes les plateformes, sert le TSX aux hôtes de développement avec des mises à jour à chaud, et empaquette des apps installables. Vous pouvez l'utiliser à partir d'une distribution précompilée ou la compiler depuis une copie du dépôt.

Les apps écrites en Rust nécessitent aussi une toolchain Rust ([ci-dessous](#for-apps-written-in-rust)) ; les apps TSX n'ont besoin que de `nsh`. En plus de cela, chaque plateforme a ses propres outils :

| Plateforme | Développer et empaqueter sur | Nécessite |
|---|---|---|
| iOS | macOS | Xcode et un runtime de simulateur iOS |
| Android | macOS, Windows ou Linux | Le SDK Android et un JDK ; un émulateur ou un appareil |
| macOS | macOS | Les outils en ligne de commande de Xcode ; les apps s'exécutent sur macOS 14+ |
| Windows | Windows | Windows 10 1809+ ; le WebView2 Runtime pour les vues web |
| Linux | Linux | GTK 4.14+ (et ses paquets de développement pour compiler le runtime) |
| [GPUI](./gpui.md) (intégration dans des apps GPUI) | macOS, Windows ou Linux | Un GPU (Metal, DirectX ou Vulkan) ; sous Linux, Wayland ou X11 |

L'hôte AppKit est celui par défaut sur macOS. Mac Catalyst (`--target catalyst`) nécessite Xcode comme iOS. Les détails se trouvent dans [Outils par plateforme](#platform-tools).

<a id="installing-a-release"></a>

## Installer une release

Chaque [release GitHub](https://github.com/longbridge/nsh/releases) fournit la distribution précompilée (ci-dessous) pour macOS (Apple silicon), Linux x86_64 et Windows x86_64. Quelle que soit la méthode d'installation, elle place la même commande `nsh` dans votre `PATH`.

**macOS et Linux**, avec le script d'installation :

```sh
curl -fsSL https://nsh.dev/install.sh | sh
```

Il installe la distribution dans `~/.nsh` et crée un lien `~/.local/bin/nsh` vers celle-ci ; le relancer la met à jour. `NSH_VERSION=v0.1.0` fixe une release, `NSH_INSTALL_DIR` choisit un autre répertoire.

**Windows**, dans PowerShell :

```powershell
irm https://nsh.dev/install.ps1 | iex
```

Il installe dans `%LOCALAPPDATA%\nsh` et ajoute son `bin` à votre `PATH` utilisateur (ouvrez ensuite un nouveau terminal). `$env:NSH_VERSION` et `$env:NSH_INSTALL_DIR` fonctionnent comme ci-dessus.

**Homebrew** (macOS et Linux) :

```sh
brew install longbridge/tap/nsh
```

**Scoop** (Windows) :

```powershell
scoop install https://github.com/longbridge/nsh/releases/latest/download/nsh.json
```

**mise** (les trois) :

```sh
mise use -g github:longbridge/nsh
```

Les archives (`nsh-macos-arm64.tar.gz`, `nsh-linux-x86_64.tar.gz`, `nsh-windows-x86_64.zip`, chacune avec un `.sha256`) n'ont pas de version dans leur nom, donc `https://github.com/longbridge/nsh/releases/latest/download/<archive>` récupère toujours la dernière. Les SDK d'intégration sont également publiés séparément, pour les apps natives qui n'ont pas besoin de la CLI : `nsh-embed-ios.zip` et `nsh-embed-android.zip`.

> [!NOTE]
> Les binaires ne sont pas encore signés. macOS met en quarantaine les fichiers téléchargés par un navigateur ; le script d'installation, Homebrew et mise téléchargent avec `curl` et ne sont pas concernés, sinon exécutez `xattr -dr com.apple.quarantine <dir>`. Le runtime Linux nécessite glibc 2.39 et GTK 4.14 ou plus récent (Ubuntu 24.04 et suivantes). Il n'existe pas de build pour Mac Intel ni pour Linux / Windows arm64 : compilez-les depuis une copie du dépôt.

<a id="for-apps-written-in-rust"></a>

## Pour les apps écrites en Rust

Installez Rust avec [rustup](https://rustup.rs). `nsh` compile le runner d'une app Rust pour chaque cible avec Cargo, à partir de votre crate et des crates de NSH sur crates.io, à la version de la CLI ; ajoutez donc les cibles Rust des plateformes sur lesquelles vous exécutez :

```sh
rustup target add aarch64-apple-ios-sim aarch64-apple-ios aarch64-apple-ios-macabi   # iOS simulator, devices, Mac Catalyst
rustup target add aarch64-linux-android armv7-linux-androideabi x86_64-linux-android # Android (with the SDK's NDK)
rustup target add wasm32-unknown-unknown                                             # the web
```

Les desktops se compilent pour la machine sur laquelle vous êtes. `cargo run` dans le répertoire d'une app Rust la lance directement sur le backend desktop, ce qui compile avec les bibliothèques de développement du backend ([Outils par plateforme](#platform-tools)). Les builds Android utilisent aussi un **NDK** du SDK, comme le fait [la compilation du runtime Android](#building-the-android-runtime).

<a id="the-prebuilt-distribution"></a>

## La distribution précompilée

La distribution est un répertoire, `dist/nsh`, contenant la CLI et les runtimes natifs précompilés avec lesquels elle empaquette les apps :

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

Placez `dist/nsh/bin` dans votre `PATH` (ou appelez `dist/nsh/bin/nsh` directement) et gardez le répertoire intact : `nsh` trouve les runtimes à côté de lui, dans `bin/../runtime` (y compris via un lien symbolique vers celui-ci, comme le font aussi les installateurs).

```sh
export PATH="$PWD/dist/nsh/bin:$PATH"
nsh --version
```

La distribution est produite avec `cargo xtask dist` dans une copie du dépôt (ci-dessous). Le binaire `nsh` qu'elle contient est compilé pour cette machine. Sur un Mac avec Xcode, elle inclut les runtimes iOS et macOS (Apple Silicon) ; sous Linux, elle inclut à la place le runtime Linux, compilé pour cette machine ; sous Windows, le runtime Windows, avec `bin\nsh.exe`. Chacune inclut aussi l'hôte de développement [GPUI](./gpui.md), compilé pour cette machine. Toutes incluent le runtime Android (sous Windows uniquement si le SDK Android est trouvé).

<a id="installing-the-latest-source"></a>

## Installer les dernières sources

Sous macOS et Linux, installez le dernier `main` avec Git, Rust et les dépendances de compilation de la plateforme indiquées ci-dessous :

```sh
curl -fsSL https://nsh.dev/install.sh | sh -s -- --source
nsh -V # nsh 0.1.1 (abcdef0)
```

L'installateur conserve la copie du dépôt dans `~/.nsh/source`, compile la CLI en release et la lie dans `~/.local/bin`. Relancez la commande pour mettre à jour ; les modifications locales des sources doivent d'abord être enregistrées. La copie conservée permet à NSH de compiler des runtimes natifs à la demande. Cargo utilise sa configuration et son répertoire cible existants. `NSH_INSTALL_DIR` change le préfixe d'installation ; `NSH_VERSION` sélectionne uniquement les releases précompilées. `-V` et `--version` affichent tous deux la version et la révision des sources sur sept caractères.

<a id="building-from-a-checkout"></a>

## Compiler depuis une copie du dépôt

Vous avez besoin de Rust via [rustup](https://rustup.rs). Le `rust-toolchain.toml` du dépôt sélectionne la toolchain stable et installe les cibles iOS et Android à la première utilisation.

```sh
git clone https://github.com/longbridge/nsh.git
cd nsh
cargo build -p nsh-cli          # ./target/debug/nsh
```

Compilez ensuite, une seule fois, l'hôte de développement de chaque cible sur laquelle vous voulez exécuter, puis de nouveau après chaque mise à jour de la copie du dépôt :

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

Pour `nsh package`, compilez aussi les runners en release :

```sh
cargo build -p nsh-ios-app --target aarch64-apple-ios-sim       # nsh package --target ios-simulator
cargo build -p nsh-ios-app --target aarch64-apple-ios           # nsh package --target ios
cargo xtask android                                             # nsh package --target android
cargo build -p nsh-macos-app                                    # nsh package --target macos
cargo build -p nsh-linux-app                                    # nsh package --target linux
cargo build -p nsh-windows-app                                  # nsh package --target windows
# nsh package --target web uses the same web runtime as nsh run --target web
```

Une CLI compilée depuis une copie du dépôt cherche les runtimes dans `target/<triple>/<profile>` (ceux de macOS, Linux, Windows et GPUI, compilés pour cette machine, dans `target/<profile>`) et `target/android/<profile>[-dev]`, en utilisant son propre profil : `./target/debug/nsh` utilise les runtimes debug, `./target/release/nsh` ceux en release. Compilez les deux avec le même profil (ajoutez `--release` à toutes les commandes pour des apps plus rapides).

> [!TIP]
> `NSH_RUNTIME=/path/to/runtime` fait utiliser à `nsh` un répertoire de runtimes organisé comme le `runtime/` de la distribution, où que se trouve la CLI elle-même.

<a id="platform-tools"></a>

## Outils par plateforme

<a id="ios-and-mac-catalyst"></a>

### iOS et Mac Catalyst

- **Xcode** (avec ses outils en ligne de commande). `nsh run` utilise `xcrun simctl` pour démarrer les simulateurs et installer l'hôte de développement ; `nsh package` utilise `actool` pour les icônes d'app et `codesign` pour la signature.
- Un runtime de simulateur iOS. S'il n'y en a aucun, installez-en un avec `xcodebuild -downloadPlatform iOS`.
- Les apps ciblent iOS 15.0 et versions ultérieures.

### Android

- **Le SDK Android**, trouvé via `ANDROID_HOME`, `ANDROID_SDK_ROOT` ou l'emplacement par défaut d'Android Studio (`~/Library/Android/sdk`, `%LOCALAPPDATA%\Android\Sdk` sous Windows), avec :
  - `platforms;android-35` et un `build-tools` récent (NSH utilise `aapt2`, `zipalign` et `apksigner` qui en proviennent, pas de Gradle) ;
  - `platform-tools` (`adb`).
- **Un JDK** (`keytool` crée le keystore de debug dans `~/.android/debug.keystore` la première fois que vous empaquetez, `apksigner` nécessite Java).
- Un émulateur en cours d'exécution ou un appareil connecté via `adb`. Les apps nécessitent Android 9 (API 28) ou plus récent.

```sh
sdkmanager "platforms;android-35" "build-tools;35.0.1" "platform-tools"
```

### macOS

- **Les outils en ligne de commande de Xcode** (`xcode-select --install`) : le SDK et clang pour compiler le runtime, `codesign` et `sips` pour empaqueter les apps.
- Les apps nécessitent macOS 14 ou plus récent.

Voir [macOS](./macos.md).

### Linux

- **GTK 4.14** ou plus récent, avec leurs paquets de développement et clang pour compiler le runtime : `libgtk-4-dev clang` (Debian, Ubuntu 24.04 ou plus récent), `gtk4 clang` (Arch), `gtk4-devel clang` (Fedora).
- **WebKitGTK 6.0** (2.40 ou plus récent) pour les vues web : `libwebkitgtk-6.0-dev` (Debian, Ubuntu), `webkitgtk-6.0` (Arch), `webkitgtk6.0-devel` (Fedora) pour compiler le runtime ; les apps en ont ensuite besoin là où elles s'exécutent. Sans lui, `cargo xtask dist` compile le runtime avec des substituts pour les vues web.
- Les plugins **GStreamer** pour les formats vidéo lus par les apps.

Voir [Linux](./linux.md).

### Windows

- **Windows 10 1809** ou plus récent, ou Windows 11. Le WebView2 Runtime (inclus dans Windows 11, installé avec Edge sur Windows 10) pour les vues web.
- Pour compiler le runtime : les **Visual Studio Build Tools** avec la charge de travail « Développement Desktop en C++ » et le Windows SDK, et **LLVM** (libclang, pour les bindings de QuickJS ; trouvé dans `C:\Program Files\LLVM`, sinon définissez `LIBCLANG_PATH`).

Voir [Windows](./windows.md).

<a id="building-the-android-runtime"></a>

### Compiler le runtime Android

Compiler le runtime Android depuis une copie du dépôt (`cargo xtask android`) nécessite en plus un **NDK** du SDK (`ndk;<version>` ; définissez `ANDROID_NDK_HOME` si le plus récent installé est incomplet) et `javac`.

<a id="what-works-where"></a>

## Ce qui fonctionne où

| Commande | macOS | Linux | Windows |
|---|---|---|---|
| `nsh init`, `nsh build`, `nsh test`, `nsh dev`, `nsh check` | Oui | Oui | Oui |
| `nsh run --target catalyst` (Mac Catalyst) | Oui | Non | Non |
| `nsh run --target macos`, `nsh package --target macos` | Oui | Non | Non |
| `nsh run --target linux` (par défaut sous Linux), `nsh package --target linux` | Non | Oui | Non |
| `nsh run --target windows` (par défaut sous Windows), `nsh package --target windows` | Non | Non | Oui |
| `nsh run --target gpui` (le backend qu'intègrent les apps GPUI) | Oui | Oui | Oui |
| `nsh run --target ios`, `nsh package --target ios` / `ios-simulator` | Oui, avec Xcode | Non | Non |
| `nsh run --target android`, `nsh package --target android` | Oui | Oui, depuis une copie du dépôt | Oui, avec le runtime Android |
| `nsh keygen`, `certify`, `publish`, `verify`, `revoke` | Oui | Oui | Oui |

Sous Linux, compilez la CLI et le runtime Android depuis une copie du dépôt (`cargo build -p nsh-cli` et `cargo xtask android --dev`) ; la toolchain Linux du NDK est utilisée automatiquement. Sous Windows, la toolchain Windows du NDK est utilisée de la même façon, et `cargo xtask dist` inclut le runtime Android lorsqu'il trouve le SDK Android.

<a id="editor-setup"></a>

## Configuration de l'éditeur

Une app Rust est un projet Cargo : rust-analyzer (VS Code, Zed, Neovim, RustRover) la vérifie et complète l'API de NSH, avec ses commentaires de documentation, comme pour n'importe quelle crate.

Pour le TSX, NSH n'a pas besoin de NPM. `nsh init` écrit un `tsconfig.json` et les déclarations de types de tout ce que fournit NSH dans `.nsh/types`, et chaque commande qui compile l'app les maintient à jour. Tout éditeur qui utilise le serveur de langage TypeScript (VS Code, Zed, Neovim, WebStorm) vérifie les types de l'app grâce à eux. Voir [Structure du projet](./project-structure.md#tsconfigjson-and-nshtypes).

<a id="next-steps"></a>

## Étapes suivantes

Continuez avec [Premiers pas](./getting-started.md) pour créer une app et l'exécuter.
