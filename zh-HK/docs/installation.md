---
title: "安裝"
description: "透過預先建置的發行版或原始碼檢出取得 NSH 指令,以及各平台(iOS、Android、macOS、Windows 與 Linux)所需的工具。"
order: 3
group: start
---

# 安裝

NSH 的所有操作都透過單一指令 `nsh` 完成。它可以建置以 Rust 或 TSX 撰寫的應用程式、在各個平台上執行、以熱更新方式將 TSX 提供給開發主機，並打包可安裝的應用程式。你可以使用預先建置的發行版，也可以從儲存庫的原始碼檢出（checkout）自行建置。

以 Rust 撰寫的應用程式還需要 Rust 工具鏈（[見下文](#for-apps-written-in-rust)）；TSX 應用程式只需要 `nsh`。除此之外，每個平台還需要各自的工具：

| 平台 | 開發與打包環境 | 需求 |
|---|---|---|
| iOS | macOS | Xcode 與 iOS 模擬器執行環境 |
| Android | macOS、Windows 或 Linux | Android SDK 與 JDK；模擬器或實體裝置 |
| macOS | macOS | Xcode 命令列工具；應用程式可在 macOS 14+ 上執行 |
| Windows | Windows | Windows 10 1809+；網頁檢視需要 WebView2 Runtime |
| Linux | Linux | GTK 4.14+（以及建置執行環境所需的開發套件） |
| [GPUI](./gpui.md)（嵌入 GPUI 應用程式） | macOS、Windows 或 Linux | GPU（Metal、DirectX 或 Vulkan）；在 Linux 上需要 Wayland 或 X11 |

在 macOS 上預設使用 AppKit 主機。Mac Catalyst（`--target catalyst`）與 iOS 一樣需要 Xcode。詳細內容請參閱[平台工具](#platform-tools)。

<a id="installing-a-release"></a>

## 安裝發行版

每個 [GitHub release](https://github.com/longbridge/nsh/releases) 都附有適用於 macOS（Apple silicon）、Linux x86_64 與 Windows x86_64 的預先建置發行版（見下文）。無論採用哪種安裝方式，都會將相同的 `nsh` 指令加入你的 `PATH`。

**macOS 與 Linux**，使用安裝腳本：

```sh
curl -fsSL https://nsh.dev/install.sh | sh
```

它會將發行版安裝到 `~/.nsh`，並建立 `~/.local/bin/nsh` 指向該處的連結；再次執行即可更新。`NSH_VERSION=v0.1.0` 可固定使用特定版本，`NSH_INSTALL_DIR` 可選擇其他目錄。

**Windows**，在 PowerShell 中：

```powershell
irm https://nsh.dev/install.ps1 | iex
```

它會安裝到 `%LOCALAPPDATA%\nsh`，並將其 `bin` 加入你的使用者 `PATH`（之後請開啟新的終端機）。`$env:NSH_VERSION` 與 `$env:NSH_INSTALL_DIR` 的用法同上。

**Homebrew**（macOS 與 Linux）：

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

壓縮檔（`nsh-macos-arm64.tar.gz`、`nsh-linux-x86_64.tar.gz`、`nsh-windows-x86_64.zip`，每個都附有 `.sha256`）的檔名不含版本號，因此 `https://github.com/longbridge/nsh/releases/latest/download/<archive>` 一律會取得最新版本。嵌入式 SDK 也會單獨發行，供不需要 CLI 的原生應用程式使用：`nsh-embed-ios.zip` 與 `nsh-embed-android.zip`。

> [!NOTE]
> 這些二進位檔目前尚未簽署。macOS 會隔離瀏覽器下載的檔案；安裝腳本、Homebrew 與 mise 使用 `curl` 下載，因此不受影響，否則請執行 `xattr -dr com.apple.quarantine <dir>`。Linux 執行環境需要 glibc 2.39 與 GTK 4.14 或更新版本（Ubuntu 24.04 及更新版本）。目前沒有 Intel Mac 或 arm64 Linux / Windows 的建置版本：請從原始碼檢出自行建置。

<a id="for-apps-written-in-rust"></a>

## 以 Rust 撰寫的應用程式

請透過 [rustup](https://rustup.rs) 安裝 Rust。`nsh` 會使用 Cargo，根據你的 crate 以及 crates.io 上與 CLI 版本相同的 NSH crates，為每個目標建置 Rust 應用程式的 runner，因此請為你要執行的平台加入對應的 Rust 目標：

```sh
rustup target add aarch64-apple-ios-sim aarch64-apple-ios aarch64-apple-ios-macabi   # iOS simulator, devices, Mac Catalyst
rustup target add aarch64-linux-android armv7-linux-androideabi x86_64-linux-android # Android (with the SDK's NDK)
rustup target add wasm32-unknown-unknown                                             # the web
```

桌面平台會針對你目前使用的機器建置。在 Rust 應用程式的目錄中執行 `cargo run`，會直接在桌面後端上啟動，並使用該後端的開發函式庫進行建置（[平台工具](#platform-tools)）。Android 建置還會使用 SDK 中的 **NDK**，與[建置 Android 執行環境](#building-the-android-runtime)相同。

<a id="the-prebuilt-distribution"></a>

## 預先建置的發行版

發行版是一個目錄 `dist/nsh`，其中包含 CLI 以及用來打包應用程式的預先建置原生執行環境：

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

請將 `dist/nsh/bin` 加入你的 `PATH`（或直接呼叫 `dist/nsh/bin/nsh`），並保持目錄的完整：`nsh` 會在自身旁邊的 `bin/../runtime` 中尋找執行環境（透過指向該目錄的符號連結也可以，安裝程式正是這樣做的）。

```sh
export PATH="$PWD/dist/nsh/bin:$PATH"
nsh --version
```

發行版是在原始碼檢出中使用 `cargo xtask dist` 製作的（見下文）。其中包含的 `nsh` 二進位檔是針對該機器建置的。在安裝了 Xcode 的 Mac 上，它包含 iOS 與 macOS 執行環境（Apple Silicon）；在 Linux 上則改為包含針對該機器建置的 Linux 執行環境；在 Windows 上則包含 Windows 執行環境，並附帶 `bin\nsh.exe`。每個發行版也都包含針對該機器建置的 [GPUI](./gpui.md) 開發主機。所有發行版都包含 Android 執行環境（在 Windows 上，僅在找到 Android SDK 時才包含）。

<a id="installing-the-latest-source"></a>

## 安裝最新原始碼

在 macOS 與 Linux 上，使用 Git、Rust 以及下列平台建置相依項目來安裝最新的 `main`：

```sh
curl -fsSL https://nsh.dev/install.sh | sh -s -- --source
nsh -V # nsh 0.1.1 (abcdef0)
```

安裝程式會將檢出的原始碼保留在 `~/.nsh/source`，建置發行版 CLI，並將其連結到 `~/.local/bin`。重新執行該指令即可更新；本機的原始碼變更必須先儲存。保留的原始碼檢出讓 NSH 能夠按需建置原生執行環境。Cargo 會使用其既有的設定與目標目錄。`NSH_INSTALL_DIR` 可變更安裝前綴；`NSH_VERSION` 則僅選用預先建置的發行版。`-V` 與 `--version` 都會顯示版本與七個字元的原始碼修訂版本。

<a id="building-from-a-checkout"></a>

## 從原始碼檢出建置

你需要透過 [rustup](https://rustup.rs) 安裝 Rust。儲存庫中的 `rust-toolchain.toml` 會選用穩定版工具鏈，並在首次使用時安裝 iOS 與 Android 目標。

```sh
git clone https://github.com/longbridge/nsh.git
cd nsh
cargo build -p nsh-cli          # ./target/debug/nsh
```

接著，為你要執行的每個目標建置一次開發主機，並在更新原始碼檢出後再建置一次：

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

對於 `nsh package`，也要建置發行版 runner：

```sh
cargo build -p nsh-ios-app --target aarch64-apple-ios-sim       # nsh package --target ios-simulator
cargo build -p nsh-ios-app --target aarch64-apple-ios           # nsh package --target ios
cargo xtask android                                             # nsh package --target android
cargo build -p nsh-macos-app                                    # nsh package --target macos
cargo build -p nsh-linux-app                                    # nsh package --target linux
cargo build -p nsh-windows-app                                  # nsh package --target windows
# nsh package --target web uses the same web runtime as nsh run --target web
```

從原始碼檢出建置的 CLI 會在 `target/<triple>/<profile>`（macOS、Linux、Windows 與 GPUI 的執行環境，針對本機建置，位於 `target/<profile>`）與 `target/android/<profile>[-dev]` 中尋找執行環境，並使用它自己的設定檔（profile）：`./target/debug/nsh` 使用 debug 執行環境，`./target/release/nsh` 使用 release 執行環境。請以相同的設定檔建置兩者（在所有指令加上 `--release` 可讓應用程式更快）。

> [!TIP]
> `NSH_RUNTIME=/path/to/runtime` 會讓 `nsh` 使用與發行版的 `runtime/` 相同結構的執行環境目錄，無論 CLI 本身位於何處。

<a id="platform-tools"></a>

## 平台工具

<a id="ios-and-mac-catalyst"></a>

### iOS 與 Mac Catalyst

- **Xcode**（含其命令列工具）。`nsh run` 使用 `xcrun simctl` 來啟動模擬器並安裝開發主機；`nsh package` 使用 `actool` 處理應用程式圖示，並使用 `codesign` 進行簽署。
- iOS 模擬器執行環境。若尚未安裝，請使用 `xcodebuild -downloadPlatform iOS` 安裝。
- 應用程式的目標為 iOS 15.0 及更新版本。

### Android

- **Android SDK**，透過 `ANDROID_HOME`、`ANDROID_SDK_ROOT` 或 Android Studio 的預設位置（`~/Library/Android/sdk`，Windows 上為 `%LOCALAPPDATA%\Android\Sdk`）尋找，並需包含：
  - `platforms;android-35` 與較新的 `build-tools`（NSH 使用其中的 `aapt2`、`zipalign` 與 `apksigner`，不使用 Gradle）；
  - `platform-tools`（`adb`）。
- **JDK**（`keytool` 會在你首次打包時於 `~/.android/debug.keystore` 建立 debug 金鑰庫，`apksigner` 需要 Java）。
- 執行中的模擬器，或透過 `adb` 連接的裝置。應用程式需要 Android 9（API 28）或更新版本。

```sh
sdkmanager "platforms;android-35" "build-tools;35.0.1" "platform-tools"
```

### macOS

- **Xcode 命令列工具**（`xcode-select --install`）：用於建置執行環境的 SDK 與 clang，以及用於打包應用程式的 `codesign` 與 `sips`。
- 應用程式需要 macOS 14 或更新版本。

請參閱 [macOS](./macos.md)。

### Linux

- **GTK 4.14** 或更新版本，以及其開發套件與用於建置執行環境的 clang：`libgtk-4-dev clang`（Debian、Ubuntu 24.04 或更新版本）、`gtk4 clang`（Arch）、`gtk4-devel clang`（Fedora）。
- 網頁檢視需要 **WebKitGTK 6.0**（2.40 或更新版本）：`libwebkitgtk-6.0-dev`（Debian、Ubuntu）、`webkitgtk-6.0`（Arch）、`webkitgtk6.0-devel`（Fedora）用於建置執行環境；應用程式在執行的環境中也需要它。若沒有安裝，`cargo xtask dist` 建置的執行環境會以預留位置取代網頁檢視。
- 應用程式播放的影片格式所需的 **GStreamer** 外掛程式。

請參閱 [Linux](./linux.md)。

### Windows

- **Windows 10 1809** 或更新版本，或 Windows 11。網頁檢視需要 WebView2 Runtime（Windows 11 內建，Windows 10 則隨 Edge 安裝）。
- 若要建置執行環境：需要具備「使用 C++ 的桌面開發」工作負載與 Windows SDK 的 **Visual Studio Build Tools**，以及 **LLVM**（libclang，供 QuickJS 的繫結使用；會在 `C:\Program Files\LLVM` 中尋找，否則請設定 `LIBCLANG_PATH`）。

請參閱 [Windows](./windows.md)。

<a id="building-the-android-runtime"></a>

### 建置 Android 執行環境

從原始碼檢出建置 Android 執行環境（`cargo xtask android`）時，另外需要 SDK 中的 **NDK**（`ndk;<version>`；若已安裝的最新版本不完整，請設定 `ANDROID_NDK_HOME`）以及 `javac`。

<a id="what-works-where"></a>

## 各平台支援情況

| 指令 | macOS | Linux | Windows |
|---|---|---|---|
| `nsh init`、`nsh build`、`nsh test`、`nsh dev`、`nsh check` | 是 | 是 | 是 |
| `nsh run --target catalyst`（Mac Catalyst） | 是 | 否 | 否 |
| `nsh run --target macos`、`nsh package --target macos` | 是 | 否 | 否 |
| `nsh run --target linux`（Linux 上的預設）、`nsh package --target linux` | 否 | 是 | 否 |
| `nsh run --target windows`（Windows 上的預設）、`nsh package --target windows` | 否 | 否 | 是 |
| `nsh run --target gpui`（GPUI 應用程式嵌入的後端） | 是 | 是 | 是 |
| `nsh run --target ios`、`nsh package --target ios` / `ios-simulator` | 是，需要 Xcode | 否 | 否 |
| `nsh run --target android`、`nsh package --target android` | 是 | 是，需從原始碼檢出 | 是，需要 Android 執行環境 |
| `nsh keygen`、`certify`、`publish`、`verify`、`revoke` | 是 | 是 | 是 |

在 Linux 上，請從原始碼檢出建置 CLI 與 Android 執行環境（`cargo build -p nsh-cli` 與 `cargo xtask android --dev`）；系統會自動使用 NDK 的 Linux 工具鏈。在 Windows 上，同樣會自動使用 NDK 的 Windows 工具鏈，而 `cargo xtask dist` 在找到 Android SDK 時會包含 Android 執行環境。

<a id="editor-setup"></a>

## 編輯器設定

Rust 應用程式就是一個 Cargo 專案：rust-analyzer（VS Code、Zed、Neovim、RustRover）會檢查它，並像對待任何 crate 一樣，提供 NSH API 及其文件註解的自動完成。

對於 TSX，NSH 不需要 NPM。`nsh init` 會寫入 `tsconfig.json`，並將 NSH 提供的所有內容的型別宣告寫入 `.nsh/types`，而每個建置應用程式的指令都會讓它們保持最新。任何使用 TypeScript language server 的編輯器（VS Code、Zed、Neovim、WebStorm）都能藉此對應用程式進行型別檢查。請參閱[專案結構](./project-structure.md#tsconfigjson-and-nshtypes)。

<a id="next-steps"></a>

## 下一步

請繼續閱讀[入門指南](./getting-started.md)，建立並執行應用程式。
