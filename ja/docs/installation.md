---
title: "インストール"
description: "プリビルド版のディストリビューションまたはソースチェックアウトから NSH コマンドを入手する方法と、iOS、Android、macOS、Windows、Linux の各プラットフォームで必要なツールについて説明します。"
order: 3
group: start
source_hash: ee1dd93b8166b092
---

# インストール

NSH のあらゆる操作は、1 つのコマンド `nsh` を通して行います。このコマンドは、Rust または TSX で書かれたアプリのビルド、すべてのプラットフォームでの実行、ホットアップデート付きでの開発ホストへの TSX 配信、インストール可能なアプリのパッケージ化を担います。ビルド済みディストリビューションを使うことも、リポジトリのチェックアウトからビルドすることもできます。

Rust で書かれたアプリには Rust ツールチェーンも必要です([後述](#for-apps-written-in-rust))。TSX アプリに必要なのは `nsh` だけです。これに加えて、各プラットフォームには固有のツールが必要です。

| プラットフォーム | 開発とパッケージ化を行う環境 | 必要なもの |
|---|---|---|
| iOS | macOS | Xcode と iOS シミュレータランタイム |
| Android | macOS、Windows または Linux | Android SDK と JDK、エミュレータまたはデバイス |
| macOS | macOS | Xcode のコマンドラインツール。アプリは macOS 14 以降で動作 |
| Windows | Windows | Windows 10 1809 以降。Web ビュー用に WebView2 Runtime |
| Linux | Linux | GTK 4.14 以降(ランタイムのビルドにはその開発パッケージも必要) |
| [GPUI](./gpui.md)(GPUI アプリへの組み込み) | macOS、Windows または Linux | GPU(Metal、DirectX または Vulkan)。Linux では Wayland または X11 |

macOS では AppKit ホストがデフォルトです。Mac Catalyst(`--target catalyst`)には iOS と同様に Xcode が必要です。詳細は [プラットフォームツール](#platform-tools) を参照してください。

<a id="installing-a-release"></a>

## リリース版のインストール

各 [GitHub リリース](https://github.com/longbridge/nsh/releases) には、macOS(Apple silicon)、Linux x86_64、Windows x86_64 向けのビルド済みディストリビューション(後述)が含まれています。どの方法でインストールしても、同じ `nsh` コマンドが `PATH` に配置されます。

**macOS と Linux** では、インストールスクリプトを使います。

```sh
curl -fsSL https://nsh.dev/install.sh | sh
```

ディストリビューションを `~/.nsh` にインストールし、`~/.local/bin/nsh` をそこへリンクします。再度実行すると更新されます。`NSH_VERSION=v0.1.0` でリリースを固定でき、`NSH_INSTALL_DIR` で別のディレクトリを指定できます。

**Windows** では、PowerShell を使います。

```powershell
irm https://nsh.dev/install.ps1 | iex
```

`%LOCALAPPDATA%\nsh` にインストールし、その `bin` をユーザーの `PATH` に追加します(その後、新しいターミナルを開いてください)。`$env:NSH_VERSION` と `$env:NSH_INSTALL_DIR` は上記と同様に使えます。

**Homebrew**(macOS と Linux):

```sh
brew install longbridge/tap/nsh
```

**Scoop**(Windows):

```powershell
scoop install https://github.com/longbridge/nsh/releases/latest/download/nsh.json
```

**mise**(3 つすべて):

```sh
mise use -g github:longbridge/nsh
```

アーカイブ(`nsh-macos-arm64.tar.gz`、`nsh-linux-x86_64.tar.gz`、`nsh-windows-x86_64.zip`。それぞれに `.sha256` が付属)の名前にはバージョンが含まれないため、`https://github.com/longbridge/nsh/releases/latest/download/<archive>` は常に最新版を取得します。組み込み用 SDK は、CLI を必要としないネイティブアプリ向けに単独でもリリースされています。`nsh-embed-ios.zip` と `nsh-embed-android.zip` です。

> [!NOTE]
> バイナリにはまだ署名がありません。macOS はブラウザーでダウンロードしたファイルを隔離します。インストールスクリプト、Homebrew、mise は `curl` でダウンロードするため影響を受けません。それ以外の場合は `xattr -dr com.apple.quarantine <dir>` を実行してください。Linux ランタイムには glibc 2.39 と GTK 4.14 以降が必要です(Ubuntu 24.04 以降)。Intel Mac 向けと arm64 の Linux / Windows 向けのビルドはありません。これらはチェックアウトからビルドしてください。

<a id="for-apps-written-in-rust"></a>

## Rust で書くアプリの場合

[rustup](https://rustup.rs) で Rust をインストールします。`nsh` は、お使いのクレートと、CLI のバージョンに対応する crates.io 上の NSH のクレートから、Cargo を使ってターゲットごとに Rust アプリのランナーをビルドします。そのため、実行するプラットフォームの Rust ターゲットを追加してください。

```sh
rustup target add aarch64-apple-ios-sim aarch64-apple-ios aarch64-apple-ios-macabi   # iOS simulator, devices, Mac Catalyst
rustup target add aarch64-linux-android armv7-linux-androideabi x86_64-linux-android # Android (with the SDK's NDK)
rustup target add wasm32-unknown-unknown                                             # the web
```

デスクトップ向けは、使用しているマシン用にビルドされます。Rust アプリのディレクトリで `cargo run` を実行すると、デスクトップバックエンドで直接起動します。このとき、バックエンドの開発用ライブラリを使ってビルドされます([プラットフォームツール](#platform-tools))。Android 向けのビルドでは、[Android ランタイムのビルド](#building-the-android-runtime)と同様に、SDK に含まれる **NDK** も使用します。

<a id="the-prebuilt-distribution"></a>

## ビルド済みディストリビューション

ディストリビューションは `dist/nsh` というディレクトリで、CLI と、アプリのパッケージ化に使うビルド済みのネイティブランタイムが含まれています。

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

`dist/nsh/bin` を `PATH` に追加し(または `dist/nsh/bin/nsh` を直接呼び出し)、ディレクトリの中身をまとめたまま保持してください。`nsh` は、自身の隣にある `bin/../runtime` からランタイムを見つけます(インストーラーが作成するように、そこへのシンボリックリンク経由でも動作します)。

```sh
export PATH="$PWD/dist/nsh/bin:$PATH"
nsh --version
```

ディストリビューションは、チェックアウト上で `cargo xtask dist` を使って作成されます(後述)。含まれる `nsh` バイナリは、そのマシン向けにビルドされます。Xcode のある Mac では iOS と macOS のランタイム(Apple Silicon)が含まれ、Linux ではそのマシン向けにビルドした Linux ランタイムが代わりに含まれ、Windows では `bin\nsh.exe` とともに Windows ランタイムが含まれます。いずれにも、そのマシン向けにビルドした [GPUI](./gpui.md) 開発ホストが含まれます。すべてに Android ランタイムが含まれます(Windows では Android SDK が見つかった場合のみ)。

<a id="installing-the-latest-source"></a>

## 最新ソースのインストール

macOS と Linux では、Git、Rust、および後述のプラットフォームのビルド依存関係を用意したうえで、最新の `main` をインストールできます。

```sh
curl -fsSL https://nsh.dev/install.sh | sh -s -- --source
nsh -V # nsh 0.1.1 (abcdef0)
```

インストーラーはチェックアウトを `~/.nsh/source` に保持し、リリース版の CLI をビルドして `~/.local/bin` にリンクします。更新するにはコマンドを再実行してください。その際、ローカルのソース変更は事前に保存しておく必要があります。保持されたチェックアウトにより、NSH は必要に応じてネイティブランタイムをビルドできます。Cargo は既存の設定とターゲットディレクトリを使用します。`NSH_INSTALL_DIR` はインストール先のプレフィックスを変更し、`NSH_VERSION` はビルド済みリリースのみを選択します。`-V` と `--version` はどちらも、バージョンと 7 文字のソースリビジョンを表示します。

<a id="building-from-a-checkout"></a>

## チェックアウトからのビルド

[rustup](https://rustup.rs) で Rust を用意する必要があります。リポジトリの `rust-toolchain.toml` が stable ツールチェーンを選択し、初回使用時に iOS と Android のターゲットをインストールします。

```sh
git clone https://github.com/longbridge/nsh.git
cd nsh
cargo build -p nsh-cli          # ./target/debug/nsh
```

次に、実行したい各ターゲットの開発ホストを一度ビルドします。チェックアウトを更新したときも、再度ビルドしてください。

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

`nsh package` の場合は、リリース用のランナーもビルドします。

```sh
cargo build -p nsh-ios-app --target aarch64-apple-ios-sim       # nsh package --target ios-simulator
cargo build -p nsh-ios-app --target aarch64-apple-ios           # nsh package --target ios
cargo xtask android                                             # nsh package --target android
cargo build -p nsh-macos-app                                    # nsh package --target macos
cargo build -p nsh-linux-app                                    # nsh package --target linux
cargo build -p nsh-windows-app                                  # nsh package --target windows
# nsh package --target web uses the same web runtime as nsh run --target web
```

チェックアウトからビルドした CLI は、自身のプロファイルを使って、`target/<triple>/<profile>`(このマシン向けにビルドした macOS、Linux、Windows、GPUI のランタイムは `target/<profile>`)と `target/android/<profile>[-dev]` からランタイムを探します。`./target/debug/nsh` はデバッグ版のランタイムを、`./target/release/nsh` はリリース版のランタイムを使います。どちらも同じプロファイルでビルドしてください(アプリを高速にするには、すべてに `--release` を追加します)。

> [!TIP]
> `NSH_RUNTIME=/path/to/runtime` を指定すると、CLI 自体がどこにあっても、`nsh` はディストリビューションの `runtime/` と同じ構成のランタイムディレクトリを使用します。

<a id="platform-tools"></a>

## プラットフォームツール

<a id="ios-and-mac-catalyst"></a>

### iOS と Mac Catalyst

- **Xcode**(コマンドラインツールを含む)。`nsh run` は `xcrun simctl` を使ってシミュレータを起動し、開発ホストをインストールします。`nsh package` はアプリアイコンに `actool` を、署名に `codesign` を使います。
- iOS シミュレータランタイム。インストールされていない場合は、`xcodebuild -downloadPlatform iOS` でインストールしてください。
- アプリの対象は iOS 15.0 以降です。

### Android

- **Android SDK**。`ANDROID_HOME`、`ANDROID_SDK_ROOT`、または Android Studio のデフォルトの場所(`~/Library/Android/sdk`、Windows では `%LOCALAPPDATA%\Android\Sdk`)から見つかる必要があり、次を含みます。
  - `platforms;android-35` と最近の `build-tools`(NSH はそこから `aapt2`、`zipalign`、`apksigner` を使用し、Gradle は使いません)。
  - `platform-tools`(`adb`)。
- **JDK**(`keytool` は初回のパッケージ化時に `~/.android/debug.keystore` にデバッグ用キーストアを作成し、`apksigner` には Java が必要です)。
- 起動中のエミュレータ、または `adb` 経由で接続されたデバイス。アプリには Android 9(API 28)以降が必要です。

```sh
sdkmanager "platforms;android-35" "build-tools;35.0.1" "platform-tools"
```

### macOS

- **Xcode のコマンドラインツール**(`xcode-select --install`)。ランタイムのビルドに SDK と clang が、アプリのパッケージ化に `codesign` と `sips` が必要です。
- アプリには macOS 14 以降が必要です。

[macOS](./macos.md) を参照してください。

### Linux

- **GTK 4.14** 以降。ランタイムのビルドには、その開発パッケージと clang も必要です。`libgtk-4-dev clang`(Debian、Ubuntu 24.04 以降)、`gtk4 clang`(Arch)、`gtk4-devel clang`(Fedora)。
- Web ビュー用の **WebKitGTK 6.0**(2.40 以降)。ランタイムのビルドには `libwebkitgtk-6.0-dev`(Debian、Ubuntu)、`webkitgtk-6.0`(Arch)、`webkitgtk6.0-devel`(Fedora)が必要で、アプリの実行環境にも必要です。これがない場合、`cargo xtask dist` は Web ビュー用のプレースホルダー付きでランタイムをビルドします。
- アプリが再生する動画形式に対応する **GStreamer** プラグイン。

[Linux](./linux.md) を参照してください。

### Windows

- **Windows 10 1809** 以降、または Windows 11。Web ビュー用に WebView2 Runtime(Windows 11 に含まれ、Windows 10 では Edge とともにインストールされます)。
- ランタイムをビルドするには、「C++ によるデスクトップ開発」ワークロードと Windows SDK を含む **Visual Studio Build Tools** と、**LLVM**(QuickJS のバインディング用の libclang。`C:\Program Files\LLVM` から探し、見つからなければ `LIBCLANG_PATH` を設定してください)が必要です。

[Windows](./windows.md) を参照してください。

<a id="building-the-android-runtime"></a>

### Android ランタイムのビルド

チェックアウトから Android ランタイムをビルドする場合(`cargo xtask android`)は、さらに SDK の **NDK**(`ndk;<version>`。インストールされている最新のものが不完全な場合は `ANDROID_NDK_HOME` を設定してください)と `javac` が必要です。

<a id="what-works-where"></a>

## どこで何が動くか

| コマンド | macOS | Linux | Windows |
|---|---|---|---|
| `nsh init`、`nsh build`、`nsh test`、`nsh dev`、`nsh check` | 対応 | 対応 | 対応 |
| `nsh run --target catalyst`(Mac Catalyst) | 対応 | 非対応 | 非対応 |
| `nsh run --target macos`、`nsh package --target macos` | 対応 | 非対応 | 非対応 |
| `nsh run --target linux`(Linux のデフォルト)、`nsh package --target linux` | 非対応 | 対応 | 非対応 |
| `nsh run --target windows`(Windows のデフォルト)、`nsh package --target windows` | 非対応 | 非対応 | 対応 |
| `nsh run --target gpui`(GPUI アプリが組み込むバックエンド) | 対応 | 対応 | 対応 |
| `nsh run --target ios`、`nsh package --target ios` / `ios-simulator` | 対応(Xcode が必要) | 非対応 | 非対応 |
| `nsh run --target android`、`nsh package --target android` | 対応 | 対応(チェックアウトから) | 対応(Android ランタイムが必要) |
| `nsh keygen`、`certify`、`publish`、`verify`、`revoke` | 対応 | 対応 | 対応 |

Linux では、CLI と Android ランタイムをチェックアウトからビルドしてください(`cargo build -p nsh-cli` と `cargo xtask android --dev`)。NDK の Linux 用ツールチェーンは自動的に使用されます。Windows でも NDK の Windows 用ツールチェーンが同様に使用され、`cargo xtask dist` は Android SDK が見つかると Android ランタイムを含めます。

<a id="editor-setup"></a>

## エディターの設定

Rust アプリは Cargo プロジェクトです。rust-analyzer(VS Code、Zed、Neovim、RustRover)が、他のクレートと同様にそれをチェックし、ドキュメントコメント付きで NSH の API を補完します。

TSX には NPM は不要です。`nsh init` は `tsconfig.json` と、NSH が提供するすべての型宣言を `.nsh/types` に書き出し、アプリをビルドするすべてのコマンドがそれらを最新の状態に保ちます。TypeScript Language Server を使うエディター(VS Code、Zed、Neovim、WebStorm)であれば、これらを使ってアプリを型チェックできます。[プロジェクト構成](./project-structure.md#tsconfigjson-and-nshtypes)を参照してください。

<a id="next-steps"></a>

## 次のステップ

[はじめに](./getting-started.md)に進んで、アプリを作成して実行してみましょう。
