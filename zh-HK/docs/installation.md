---
title: "安裝"
description: "透過預先建置的發行版或原始碼檢出取得 NSH 指令,以及各平台(iOS、Android、macOS、Windows 和 Linux)所需的工具。"
order: 3
group: start
source_hash: ee1dd93b8166b092
---


# 安裝

NSH 的一切操作都透過單一指令 `nsh` 完成。它可以建置以 Rust 或 TSX 編寫的應用程式，在各個平台上執行，以熱更新方式將 TSX 提供給開發主機，並打包可安裝的應用程式。你可以使用預先建置的發行版本，也可以從儲存庫的 checkout 自行建置。

以 Rust 編寫的應用程式還需要 Rust 工具鏈（[見下文](#for-apps-written-in-rust)）；TSX 應用程式只需要 `nsh`。此外，各平台各有所需的工具：

| 平台 | 開發及打包所用系統 | 所需工具 |
|---|---|---|
| iOS | macOS | Xcode 及 iOS 模擬器 runtime |
| Android | macOS、Windows 或 Linux | Android SDK 及 JDK；模擬器或裝置 |
| macOS | macOS | Xcode 的命令列工具；應用程式可在 macOS 14+ 上執行 |
| Windows | Windows | Windows 10 1809+；網頁檢視需要 WebView2 Runtime |
| Linux | Linux | GTK 4.14+（以及建置 runtime 所需的開發套件） |
| [GPUI](./gpui.md)（嵌入 GPUI 應用程式） | macOS、Windows 或 Linux | GPU（Metal、DirectX 或 Vulkan）；在 Linux 上需要 Wayland 或 X11 |

AppKit host 是 macOS 上的預設。Mac Catalyst（`--target catalyst`）與 iOS 一樣需要 Xcode。詳情見[平台工具](#platform-tools)。

<a id="installing-a-release"></a>

## 安裝發行版本

每個 [GitHub release](https://github.com/longbridge/nsh/releases) 都附有適用於 macOS（Apple silicon）、Linux x86_64 及 Windows x86_64 的預先建置發行版本（見下文）。無論採用哪種安裝方式，都會把相同的 `nsh` 指令放到你的 `PATH` 上。

**macOS 和 Linux**，使用安裝指令碼：

```sh
curl -fsSL https://nsh.dev/install.sh | sh
```

它會將發行版本安裝到 `~/.nsh`，並將 `~/.local/bin/nsh` 連結到該處；再次執行即可更新。`NSH_VERSION=v0.1.0` 可固定使用某個發行版本，`NSH_INSTALL_DIR` 可選擇其他目錄。

**Windows**，在 PowerShell 中：

```powershell
irm https://nsh.dev/install.ps1 | iex
```

它會安裝到 `%LOCALAPPDATA%\nsh`，並將其 `bin` 加入你的使用者 `PATH`（之後請開啟新的終端機）。`$env:NSH_VERSION` 和 `$env:NSH_INSTALL_DIR` 的用法同上。

**Homebrew**（macOS 和 Linux）：

```sh
brew install longbridge/tap/nsh
```

**Scoop**（Windows）：

```powershell
scoop install https://github.com/longbridge/nsh/releases/latest/download/nsh.json
```

**mise**（三個平台皆適用）：

```sh
mise use -g github:longbridge/nsh
```

壓縮檔（`nsh-macos-arm64.tar.gz`、`nsh-linux-x86_64.tar.gz`、`nsh-windows-x86_64.zip`，各附有 `.sha256`）的檔名不含版本號，因此 `https://github.com/longbridge/nsh/releases/latest/download/<archive>` 永遠取得最新版本。嵌入用的 SDK 亦會單獨發佈，供不需要 CLI 的原生應用程式使用：`nsh-embed-ios.zip` 和 `nsh-embed-android.zip`。

> [!NOTE]
> 二進位檔尚未簽署。macOS 會隔離由瀏覽器下載的檔案；安裝指令碼、Homebrew 和 mise 均以 `curl` 下載，不受影響，否則請執行 `xattr -dr com.apple.quarantine <dir>`。Linux runtime 需要 glibc 2.39 以及 GTK 4.14 或更新版本（Ubuntu 24.04 及更新版本）。目前沒有 Intel Mac 或 arm64 Linux / Windows 的建置版本：請從 checkout 自行建置。

<a id="for-apps-written-in-rust"></a>

## 以 Rust 編寫的應用程式

請透過 [rustup](https://rustup.rs) 安裝 Rust。`nsh` 會使用 Cargo，根據你的 crate 以及 crates.io 上與 CLI 版本相同的 NSH crates，為每個目標建置 Rust 應用程式的 runner，因此請加入你所執行平台的 Rust target：

```sh
rustup target add aarch64-apple-ios-sim aarch64-apple-ios aarch64-apple-ios-macabi   # iOS simulator, devices, Mac Catalyst
rustup target add aarch64-linux-android armv7-linux-androideabi x86_64-linux-android # Android (with the SDK's NDK)
rustup target add wasm32-unknown-unknown                                             # the web
```

桌面平台會為你目前使用的機器建置。在 Rust 應用程式的目錄中執行 `cargo run`，會直接在桌面 backend 上啟動應用程式，並使用該 backend 的開發函式庫建置（[平台工具](#platform-tools)）。Android 建置同樣會使用 SDK 中的 **NDK**，與[建置 Android runtime](#building-the-android-runtime) 的做法相同。

<a id="the-prebuilt-distribution"></a>

## 預先建置的發行版本

發行版本是一個目錄 `dist/nsh`，內含 CLI 以及用來打包應用程式的預先建置原生 runtime：

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

請將 `dist/nsh/bin` 加入你的 `PATH`（或直接呼叫 `dist/nsh/bin/nsh`），並保持目錄完整：`nsh` 會在自身旁邊的 `bin/../runtime` 中尋找 runtime（安裝程式所建立的指向該目錄的符號連結同樣適用）。

```sh
export PATH="$PWD/dist/nsh/bin:$PATH"
nsh --version
```

發行版本是在 checkout 中使用 `cargo xtask dist` 製作的（見下文）。其中包含的 `nsh` 二進位檔是為該機器建置的。在安裝了 Xcode 的 Mac 上，它包含 iOS 和 macOS runtime（Apple Silicon）；在 Linux 上則改為包含為該機器建置的 Linux runtime；在 Windows 上則包含 Windows runtime，以及 `bin\nsh.exe`。每個版本亦包含為該機器建置的 [GPUI](./gpui.md) 開發主機。所有版本都包含 Android runtime（在 Windows 上，只有找到 Android SDK 時才會包含）。

<a id="installing-the-latest-source"></a>

## 安裝最新原始碼

在 macOS 和 Linux 上，可使用 Git、Rust 及下列平台建置相依項目來安裝最新的 `main`：

```sh
curl -fsSL https://nsh.dev/install.sh | sh -s -- --source
nsh -V # nsh 0.1.1 (abcdef0)
```

安裝程式會將 checkout 保存在 `~/.nsh/source`，建置 release 版 CLI，並將它連結到 `~/.local/bin`。重新執行該指令即可更新；本機的原始碼變更必須先儲存。保留下來的 checkout 讓 NSH 可按需要建置原生 runtime。Cargo 會使用其現有的設定及 target 目錄。`NSH_INSTALL_DIR` 可更改安裝前綴；`NSH_VERSION` 則只選用預先建置的發行版本。`-V` 和 `--version` 都會顯示版本及七個字元的原始碼修訂版本。

<a id="building-from-a-checkout"></a>

## 從 checkout 建置

你需要透過 [rustup](https://rustup.rs) 安裝 Rust。儲存庫的 `rust-toolchain.toml` 會選用 stable 工具鏈，並在首次使用時安裝 iOS 和 Android target。

```sh
git clone https://github.com/longbridge/nsh.git
cd nsh
cargo build -p nsh-cli          # ./target/debug/nsh
```

然後為你想執行的每個目標建置一次開發主機；更新 checkout 後需要再建置一次：

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

對於 `nsh package`，也需要建置 release 版 runner：

```sh
cargo build -p nsh-ios-app --target aarch64-apple-ios-sim       # nsh package --target ios-simulator
cargo build -p nsh-ios-app --target aarch64-apple-ios           # nsh package --target ios
cargo xtask android                                             # nsh package --target android
cargo build -p nsh-macos-app                                    # nsh package --target macos
cargo build -p nsh-linux-app                                    # nsh package --target linux
cargo build -p nsh-windows-app                                  # nsh package --target windows
# nsh package --target web uses the same web runtime as nsh run --target web
```

從 checkout 建置的 CLI 會在 `target/<triple>/<profile>`（為這部機器建置的 macOS、Linux、Windows 和 GPUI runtime，位於 `target/<profile>`）以及 `target/android/<profile>[-dev]` 中尋找 runtime，並使用它自己的 profile：`./target/debug/nsh` 使用 debug runtime，`./target/release/nsh` 使用 release runtime。請以相同的 profile 建置兩者（為所有項目加上 `--release` 可令應用程式更快）。

> [!TIP]
> `NSH_RUNTIME=/path/to/runtime` 會令 `nsh` 使用一個佈局與發行版本的 `runtime/` 相同的 runtime 目錄，不論 CLI 本身位於何處。

<a id="platform-tools"></a>

## 平台工具

<a id="ios-and-mac-catalyst"></a>

### iOS 和 Mac Catalyst

- **Xcode**（連同其命令列工具）。`nsh run` 使用 `xcrun simctl` 來啟動模擬器並安裝開發主機；`nsh package` 使用 `actool` 處理應用程式圖示，並使用 `codesign` 進行簽署。
- iOS 模擬器 runtime。如果尚未安裝，請使用 `xcodebuild -downloadPlatform iOS` 安裝。
- 應用程式的目標為 iOS 15.0 及更新版本。

### Android

- **Android SDK**，可透過 `ANDROID_HOME`、`ANDROID_SDK_ROOT` 或 Android Studio 的預設位置（`~/Library/Android/sdk`，Windows 上為 `%LOCALAPPDATA%\Android\Sdk`）找到，並包含：
  - `platforms;android-35` 及較新的 `build-tools`（NSH 使用其中的 `aapt2`、`zipalign` 和 `apksigner`，不使用 Gradle）；
  - `platform-tools`（`adb`）。
- **JDK**（首次打包時，`keytool` 會在 `~/.android/debug.keystore` 中建立 debug keystore，`apksigner` 需要 Java）。
- 正在執行的模擬器，或透過 `adb` 連接的裝置。應用程式需要 Android 9（API 28）或更新版本。

```sh
sdkmanager "platforms;android-35" "build-tools;35.0.1" "platform-tools"
```

### macOS

- **Xcode 的命令列工具**（`xcode-select --install`）：用於建置 runtime 的 SDK 和 clang，以及用於打包應用程式的 `codesign` 和 `sips`。
- 應用程式需要 macOS 14 或更新版本。

請參閱 [macOS](./macos.md)。

### Linux

- **GTK 4.14** 或更新版本，連同其開發套件，以及用來建置 runtime 的 clang：`libgtk-4-dev clang`（Debian、Ubuntu 24.04 或更新版本）、`gtk4 clang`（Arch）、`gtk4-devel clang`（Fedora）。
- 網頁檢視需要 **WebKitGTK 6.0**（2.40 或更新版本）：`libwebkitgtk-6.0-dev`（Debian、Ubuntu）、`webkitgtk-6.0`（Arch）、`webkitgtk6.0-devel`（Fedora）用於建置 runtime；應用程式執行的環境之後也需要安裝它。如果沒有安裝，`cargo xtask dist` 建置的 runtime 會以佔位項目取代網頁檢視。
- 應用程式播放影片格式所需的 **GStreamer** 外掛程式。

請參閱 [Linux](./linux.md)。

### Windows

- **Windows 10 1809** 或更新版本，或 Windows 11。網頁檢視需要 WebView2 Runtime（Windows 11 已內建，Windows 10 則隨 Edge 安裝）。
- 建置 runtime 需要：安裝了「Desktop development with C++」工作負載及 Windows SDK 的 **Visual Studio Build Tools**，以及 **LLVM**（libclang，供 QuickJS 的 bindings 使用；會在 `C:\Program Files\LLVM` 中尋找，否則請設定 `LIBCLANG_PATH`）。

請參閱 [Windows](./windows.md)。

<a id="building-the-android-runtime"></a>

### 建置 Android runtime

從 checkout 建置 Android runtime（`cargo xtask android`）時，另外需要 SDK 中的 **NDK**（`ndk;<version>`；如果已安裝的最新版本不完整，請設定 `ANDROID_NDK_HOME`）以及 `javac`。

<a id="what-works-where"></a>

## 各平台支援情況

| 指令 | macOS | Linux | Windows |
|---|---|---|---|
| `nsh init`、`nsh build`、`nsh test`、`nsh dev`、`nsh check` | 是 | 是 | 是 |
| `nsh run --target catalyst`（Mac Catalyst） | 是 | 否 | 否 |
| `nsh run --target macos`、`nsh package --target macos` | 是 | 否 | 否 |
| `nsh run --target linux`（Linux 上的預設）、`nsh package --target linux` | 否 | 是 | 否 |
| `nsh run --target windows`（Windows 上的預設）、`nsh package --target windows` | 否 | 否 | 是 |
| `nsh run --target gpui`（GPUI 應用程式嵌入的 backend） | 是 | 是 | 是 |
| `nsh run --target ios`、`nsh package --target ios` / `ios-simulator` | 是，需要 Xcode | 否 | 否 |
| `nsh run --target android`、`nsh package --target android` | 是 | 是，從 checkout 建置 | 是，需要 Android runtime |
| `nsh keygen`、`certify`、`publish`、`verify`、`revoke` | 是 | 是 | 是 |

在 Linux 上，請從 checkout 建置 CLI 和 Android runtime（`cargo build -p nsh-cli` 及 `cargo xtask android --dev`）；NDK 的 Linux 工具鏈會自動使用。在 Windows 上，NDK 的 Windows 工具鏈同樣會自動使用，而 `cargo xtask dist` 在找到 Android SDK 時會包含 Android runtime。

<a id="editor-setup"></a>

## 編輯器設定

Rust 應用程式是一個 Cargo 專案：rust-analyzer（VS Code、Zed、Neovim、RustRover）會檢查它，並像處理任何 crate 一樣，提供 NSH API 的自動完成及其文件註解。

對於 TSX，NSH 不需要 NPM。`nsh init` 會寫入 `tsconfig.json`，並將 NSH 提供的所有內容的型別宣告寫入 `.nsh/types`，而每個建置應用程式的指令都會令它們保持最新。任何使用 TypeScript language server 的編輯器（VS Code、Zed、Neovim、WebStorm）都可以憑它們對應用程式進行型別檢查。請參閱[專案結構](./project-structure.md#tsconfigjson-and-nshtypes)。

<a id="next-steps"></a>

## 下一步

請繼續閱讀[入門指南](./getting-started.md)，建立並執行一個應用程式。
