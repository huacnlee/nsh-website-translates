---
title: "Instalación"
description: "Obtén el comando NSH, ya sea desde una distribución precompilada o desde una copia del código fuente, y las herramientas que necesita cada plataforma: iOS, Android, macOS, Windows y Linux."
order: 3
group: start
source_hash: ee1dd93b8166b092
---


# Instalación

Todo lo que hace NSH pasa por un único comando, `nsh`. Compila apps escritas en Rust o TSX, las ejecuta en todas las plataformas, sirve TSX a los hosts de desarrollo con actualizaciones en caliente y empaqueta apps instalables. Puedes usarlo desde una distribución precompilada o compilarlo a partir de un clon del repositorio.

Las apps escritas en Rust también necesitan una toolchain de Rust ([más abajo](#for-apps-written-in-rust)); las apps TSX solo necesitan `nsh`. Además, cada plataforma requiere sus propias herramientas:

| Plataforma | Desarrollar y empaquetar en | Requiere |
|---|---|---|
| iOS | macOS | Xcode y un runtime de simulador de iOS |
| Android | macOS, Windows o Linux | El Android SDK y un JDK; un emulador o un dispositivo |
| macOS | macOS | Las herramientas de línea de comandos de Xcode; las apps se ejecutan en macOS 14+ |
| Windows | Windows | Windows 10 1809+; el WebView2 Runtime para las web views |
| Linux | Linux | GTK 4.14+ (y sus paquetes de desarrollo para compilar el runtime) |
| [GPUI](./gpui.md) (integración en apps GPUI) | macOS, Windows o Linux | Una GPU (Metal, DirectX o Vulkan); en Linux, Wayland o X11 |

El host AppKit es el predeterminado en macOS. Mac Catalyst (`--target catalyst`) necesita Xcode, igual que iOS. Los detalles están en [Herramientas por plataforma](#platform-tools).

<a id="installing-a-release"></a>

## Instalar una versión publicada

Cada [versión de GitHub](https://github.com/longbridge/nsh/releases) incluye la distribución precompilada (más abajo) para macOS (Apple silicon), Linux x86_64 y Windows x86_64. Todas las formas de instalarla dejan el mismo comando `nsh` en tu `PATH`.

**macOS y Linux**, con el script de instalación:

```sh
curl -fsSL https://nsh.dev/install.sh | sh
```

Instala la distribución en `~/.nsh` y enlaza `~/.local/bin/nsh` a ella; al ejecutarlo de nuevo, se actualiza. `NSH_VERSION=v0.1.0` fija una versión y `NSH_INSTALL_DIR` elige otro directorio.

**Windows**, en PowerShell:

```powershell
irm https://nsh.dev/install.ps1 | iex
```

Se instala en `%LOCALAPPDATA%\nsh` y agrega su `bin` al `PATH` de tu usuario (abre una terminal nueva después). `$env:NSH_VERSION` y `$env:NSH_INSTALL_DIR` funcionan como arriba.

**Homebrew** (macOS y Linux):

```sh
brew install longbridge/tap/nsh
```

**Scoop** (Windows):

```powershell
scoop install https://github.com/longbridge/nsh/releases/latest/download/nsh.json
```

**mise** (los tres sistemas):

```sh
mise use -g github:longbridge/nsh
```

Los archivos comprimidos (`nsh-macos-arm64.tar.gz`, `nsh-linux-x86_64.tar.gz`, `nsh-windows-x86_64.zip`, cada uno con un `.sha256`) no llevan versión en el nombre, así que `https://github.com/longbridge/nsh/releases/latest/download/<archive>` siempre descarga la más reciente. Los SDK de integración también se publican por separado, para apps nativas que no necesitan la CLI: `nsh-embed-ios.zip` y `nsh-embed-android.zip`.

> [!NOTE]
> Los binarios todavía no están firmados. macOS pone en cuarentena los archivos descargados con un navegador; el script de instalación, Homebrew y mise descargan con `curl` y no se ven afectados; en cualquier otro caso, ejecuta `xattr -dr com.apple.quarantine <dir>`. El runtime de Linux necesita glibc 2.39 y GTK 4.14 o posterior (Ubuntu 24.04 y posteriores). No hay compilación para Mac Intel ni para Linux / Windows arm64: compílalos a partir de un clon del repositorio.

<a id="for-apps-written-in-rust"></a>

## Para apps escritas en Rust

Instala Rust mediante [rustup](https://rustup.rs). `nsh` compila el runner de una app Rust para cada destino con Cargo, a partir de tu crate y de los crates de NSH en crates.io en la versión de la CLI, así que agrega los destinos de Rust de las plataformas en las que ejecutas:

```sh
rustup target add aarch64-apple-ios-sim aarch64-apple-ios aarch64-apple-ios-macabi   # iOS simulator, devices, Mac Catalyst
rustup target add aarch64-linux-android armv7-linux-androideabi x86_64-linux-android # Android (with the SDK's NDK)
rustup target add wasm32-unknown-unknown                                             # the web
```

Los escritorios se compilan para la máquina en la que estás. `cargo run` en el directorio de una app Rust la inicia directamente en el backend de escritorio, que se compila con las bibliotecas de desarrollo del backend ([Herramientas por plataforma](#platform-tools)). Las compilaciones para Android también usan un **NDK** del SDK, igual que [compilar el runtime de Android](#building-the-android-runtime).

<a id="the-prebuilt-distribution"></a>

## La distribución precompilada

La distribución es un directorio, `dist/nsh`, con la CLI y los runtimes nativos precompilados con los que empaqueta las apps:

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

Pon `dist/nsh/bin` en tu `PATH` (o llama a `dist/nsh/bin/nsh` directamente) y mantén el directorio unido: `nsh` encuentra los runtimes junto a sí mismo, en `bin/../runtime` (también a través de un enlace simbólico hacia él, como los que crean los instaladores).

```sh
export PATH="$PWD/dist/nsh/bin:$PATH"
nsh --version
```

La distribución se crea con `cargo xtask dist` en un clon del repositorio (más abajo). El binario `nsh` que contiene se compila para esa máquina. En un Mac con Xcode incluye los runtimes de iOS y macOS (Apple Silicon); en Linux incluye en su lugar el runtime de Linux, compilado para esa máquina; en Windows, el runtime de Windows, con `bin\nsh.exe`. Cada una incluye además el host de desarrollo de [GPUI](./gpui.md), compilado para esa máquina. Todas incluyen el runtime de Android (en Windows solo cuando se encuentra el Android SDK).

<a id="installing-the-latest-source"></a>

## Instalar el código fuente más reciente

En macOS y Linux, instala el `main` más reciente con Git, Rust y las dependencias de compilación de la plataforma que se indican abajo:

```sh
curl -fsSL https://nsh.dev/install.sh | sh -s -- --source
nsh -V # nsh 0.1.1 (abcdef0)
```

El instalador mantiene el clon en `~/.nsh/source`, compila la CLI en modo release y la enlaza en `~/.local/bin`. Vuelve a ejecutar el comando para actualizar; los cambios locales en el código fuente deben guardarse antes. El clon conservado permite que NSH compile runtimes nativos bajo demanda. Cargo usa su configuración y su directorio de destino existentes. `NSH_INSTALL_DIR` cambia el prefijo de instalación; `NSH_VERSION` selecciona solo versiones precompiladas. Tanto `-V` como `--version` muestran la versión y la revisión del código fuente de siete caracteres.

<a id="building-from-a-checkout"></a>

## Compilar desde un clon del repositorio

Necesitas Rust mediante [rustup](https://rustup.rs). El `rust-toolchain.toml` del repositorio selecciona la toolchain estable e instala los destinos de iOS y Android la primera vez que se usa.

```sh
git clone https://github.com/longbridge/nsh.git
cd nsh
cargo build -p nsh-cli          # ./target/debug/nsh
```

Luego compila, una sola vez, el host de desarrollo de cada destino en el que quieras ejecutar, y de nuevo cada vez que actualices el clon:

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

Para `nsh package`, compila también los runners en modo release:

```sh
cargo build -p nsh-ios-app --target aarch64-apple-ios-sim       # nsh package --target ios-simulator
cargo build -p nsh-ios-app --target aarch64-apple-ios           # nsh package --target ios
cargo xtask android                                             # nsh package --target android
cargo build -p nsh-macos-app                                    # nsh package --target macos
cargo build -p nsh-linux-app                                    # nsh package --target linux
cargo build -p nsh-windows-app                                  # nsh package --target windows
# nsh package --target web uses the same web runtime as nsh run --target web
```

Una CLI compilada desde un clon busca los runtimes en `target/<triple>/<profile>` (los de macOS, Linux, Windows y GPUI, compilados para esta máquina, en `target/<profile>`) y en `target/android/<profile>[-dev]`, usando su propio perfil: `./target/debug/nsh` usa runtimes de depuración y `./target/release/nsh`, runtimes release. Compila ambos con el mismo perfil (agrega `--release` a todos para obtener apps más rápidas).

> [!TIP]
> `NSH_RUNTIME=/path/to/runtime` hace que `nsh` use un directorio de runtimes con la misma estructura que el `runtime/` de la distribución, esté donde esté la propia CLI.

<a id="platform-tools"></a>

## Herramientas por plataforma

<a id="ios-and-mac-catalyst"></a>

### iOS y Mac Catalyst

- **Xcode** (con sus herramientas de línea de comandos). `nsh run` usa `xcrun simctl` para arrancar simuladores e instalar el host de desarrollo; `nsh package` usa `actool` para los iconos de la app y `codesign` para firmar.
- Un runtime de simulador de iOS. Si no hay ninguno instalado, instala uno con `xcodebuild -downloadPlatform iOS`.
- Las apps apuntan a iOS 15.0 y posteriores.

### Android

- **El Android SDK**, localizado mediante `ANDROID_HOME`, `ANDROID_SDK_ROOT` o la ubicación predeterminada de Android Studio (`~/Library/Android/sdk`, `%LOCALAPPDATA%\Android\Sdk` en Windows), con:
  - `platforms;android-35` y un `build-tools` reciente (NSH usa `aapt2`, `zipalign` y `apksigner` de él, sin Gradle);
  - `platform-tools` (`adb`).
- **Un JDK** (`keytool` crea el keystore de depuración en `~/.android/debug.keystore` la primera vez que empaquetas, `apksigner` necesita Java).
- Un emulador en ejecución o un dispositivo conectado mediante `adb`. Las apps necesitan Android 9 (API 28) o posterior.

```sh
sdkmanager "platforms;android-35" "build-tools;35.0.1" "platform-tools"
```

### macOS

- **Las herramientas de línea de comandos de Xcode** (`xcode-select --install`): el SDK y clang para compilar el runtime, `codesign` y `sips` para empaquetar apps.
- Las apps necesitan macOS 14 o posterior.

Consulta [macOS](./macos.md).

### Linux

- **GTK 4.14** o posterior, con sus paquetes de desarrollo y clang para compilar el runtime: `libgtk-4-dev clang` (Debian, Ubuntu 24.04 o posterior), `gtk4 clang` (Arch), `gtk4-devel clang` (Fedora).
- **WebKitGTK 6.0** (2.40 o posterior) para las web views: `libwebkitgtk-6.0-dev` (Debian, Ubuntu), `webkitgtk-6.0` (Arch), `webkitgtk6.0-devel` (Fedora) para compilar el runtime; las apps lo necesitan después en el lugar donde se ejecutan. Sin él, `cargo xtask dist` compila el runtime con marcadores de posición para las web views.
- Plugins de **GStreamer** para los formatos de vídeo que reproducen las apps.

Consulta [Linux](./linux.md).

### Windows

- **Windows 10 1809** o posterior, o Windows 11. El WebView2 Runtime (parte de Windows 11, instalado con Edge en Windows 10) para las web views.
- Para compilar el runtime: **Visual Studio Build Tools** con la carga de trabajo "Desarrollo de escritorio con C++" y el Windows SDK, y **LLVM** (libclang, para los bindings de QuickJS; se busca en `C:\Program Files\LLVM`, y si no, define `LIBCLANG_PATH`).

Consulta [Windows](./windows.md).

<a id="building-the-android-runtime"></a>

### Compilar el runtime de Android

Compilar el runtime de Android desde un clon del repositorio (`cargo xtask android`) requiere además un **NDK** del SDK (`ndk;<version>`; define `ANDROID_NDK_HOME` si el más reciente instalado está incompleto) y `javac`.

<a id="what-works-where"></a>

## Qué funciona dónde

| Comando | macOS | Linux | Windows |
|---|---|---|---|
| `nsh init`, `nsh build`, `nsh test`, `nsh dev`, `nsh check` | Sí | Sí | Sí |
| `nsh run --target catalyst` (Mac Catalyst) | Sí | No | No |
| `nsh run --target macos`, `nsh package --target macos` | Sí | No | No |
| `nsh run --target linux` (el predeterminado en Linux), `nsh package --target linux` | No | Sí | No |
| `nsh run --target windows` (el predeterminado en Windows), `nsh package --target windows` | No | No | Sí |
| `nsh run --target gpui` (el backend que integran las apps GPUI) | Sí | Sí | Sí |
| `nsh run --target ios`, `nsh package --target ios` / `ios-simulator` | Sí, con Xcode | No | No |
| `nsh run --target android`, `nsh package --target android` | Sí | Sí, desde un clon del repositorio | Sí, con el runtime de Android |
| `nsh keygen`, `certify`, `publish`, `verify`, `revoke` | Sí | Sí | Sí |

En Linux, compila la CLI y el runtime de Android desde un clon del repositorio (`cargo build -p nsh-cli` y `cargo xtask android --dev`); la toolchain de Linux del NDK se usa automáticamente. En Windows, la toolchain de Windows del NDK se usa del mismo modo, y `cargo xtask dist` incluye el runtime de Android cuando encuentra el Android SDK.

<a id="editor-setup"></a>

## Configuración del editor

Una app Rust es un proyecto de Cargo: rust-analyzer (VS Code, Zed, Neovim, RustRover) la revisa y autocompleta la API de NSH, con sus comentarios de documentación, como con cualquier crate.

Para TSX, NSH no necesita NPM. `nsh init` escribe un `tsconfig.json` y las declaraciones de tipos de todo lo que ofrece NSH en `.nsh/types`, y todos los comandos que compilan la app los mantienen actualizados. Cualquier editor que use el servidor de lenguaje de TypeScript (VS Code, Zed, Neovim, WebStorm) comprueba los tipos de la app con ellos. Consulta [Estructura del proyecto](./project-structure.md#tsconfigjson-and-nshtypes).

<a id="next-steps"></a>

## Siguientes pasos

Continúa con [Primeros pasos](./getting-started.md) para crear una app y ejecutarla.
