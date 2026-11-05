---
title: "パッケージング"
description: "nsh package を使用して、iOS デバイス、iOS シミュレータ、Android、macOS、Windows、Linux、Web 向けに、インストール可能な Rust および TSX アプリをビルドします。アプリのメタデータ、アイコン、署名にも対応しています。"
order: 19
group: platforms
source_hash: 74c2991490481926
---

# パッケージング

`nsh package` は、アプリをインストール可能な形にします。iOS シミュレータ向けの `.app`、iOS デバイス向けの署名付き `.ipa`、Android 向けの署名付き `.apk`、macOS 向けの ad hoc 署名付き `.app`、Linux 向けのディレクトリと `.tar.gz`、Windows 向けのディレクトリと `.zip`、そして Web 向けの静的サイトです。Xcode プロジェクトも Gradle も不要です。

- **Rust アプリ**(`nsh.json` が `"root"` を指定します)は、そのディレクトリからパッケージされます。`nsh` は、あなたのクレートをコンパイルして組み込み、ルートをマウントした対象プラットフォームのランナーをリリースモードでビルドします。QuickJS は使いません。必要なのは Cargo、プラットフォームの Rust ターゲット(`rustup target add …`)、そして Android の場合は NDK です。
- **TSX アプリ**はエントリを指定します。そのリリースビルド(`nsh build --release` が行うのと同じ、minify して QuickJS バイトコードにコンパイルしたもの)は、NSH に同梱される**ビルド済みランタイム**と並べて配置されるため、Rust ツールチェーンは不要です。独自のクレートを持つアプリ(`"root"` なしの `"rust"`)では、そのクレートを組み込んだランナーがビルドされます。

```sh
# A Rust app, from its directory
nsh package --target ios-simulator --run     # build, install and launch in the simulator
nsh package --target android --run           # build, install and launch on a device or emulator
nsh package --target macos --run             # build and launch on this Mac
nsh package --target linux --run             # build and launch on this machine
nsh package --target windows --run           # build and launch on this machine
nsh package --target web --run               # build, serve on this machine and open in the browser
nsh package --target ios --sign "Apple Development: Jane Doe (ABCDE12345)" --profile Dev.mobileprovision

# A TSX app: the same with its entry
nsh package App.tsx --target ios-simulator --run
```

出力先は、`--out` を渡さない限り `.nsh/out/` です。以下の各セクションでは、Rust アプリ向けに各ターゲットのコマンドを示します。TSX アプリではエントリ(`nsh package App.tsx --target …`)を追加します。

> [!NOTE]
> NSH を既存のネイティブアプリの*内部*に組み込む場合は [Platforms](./platforms.md#embed-in-a-native-app) を、GPUI または GPUI Kit アプリの場合は [GPUI](./gpui.md#embedding-in-a-gpui-app) を参照してください。アプリがダウンロードして検証するアップデートを配布するには、[Signed packages](./signed-packages.md) を参照してください。

<a id="app-metadata-30"></a>

## アプリのメタデータ: `nsh.json`

`nsh package` は、アプリのディレクトリ(TSX アプリの場合はエントリファイルの隣)にある `nsh.json` を読み込みます。`nsh init` がひとつ作成します。

```json
{
  "name": "Gallery",
  "id": "com.example.gallery",
  "version": "1.0.0",
  "build": 1,
  "icon": "icon.png"
}
```

| キー | 型 | デフォルト | 用途 |
|---|---|---|---|
| `name` | 文字列 | エントリのディレクトリ名 | アイコンの下に表示される名前(`CFBundleDisplayName`、Android の `android:label`)と、出力ファイル名。 |
| `id` | 文字列 | 必須 | バンドル識別子 / Android パッケージ名。所有するドメインに基づく逆ドメイン形式で指定します。アプリの[ストレージ](../modules/nsh.md#storage)の保存場所の名前にもなるため、アプリごとに独立します。`nsh package` と `nsh publish` は `com.example.` プレースホルダについて警告します。 |
| `version` | 文字列 | `"1.0.0"` | ユーザーに表示されるバージョン(`CFBundleShortVersionString`、`versionName`)。 |
| `build` | 数値 | `1` | ビルド番号(`CFBundleVersion`、`versionCode`)。アップロードするリリースごとに増やします。 |
| `icon` | 文字列 | なし | 正方形の PNG(1024×1024 が理想)。`nsh.json` からの相対パスで指定します。 |

`nsh.json` には、`rust` と `root`(アプリのクレートとルートコンポーネント。[Building with Rust](./rust.md) を参照)、`theme` と `appearance`、`tailwind`([Tailwind](./tailwind.md) を参照)、`capabilities`([Sandbox and capabilities](./sandbox-and-capabilities.md) を参照)も含まれます。すべてのキーは [Project structure](./project-structure.md#nshjson) に一覧があります。未知のキーはエラーになります。

上記のキーはすべてコマンドラインから上書きできるため、CI で便利です。

```sh
nsh package --target android --app-version 1.4.0 --build 42
```

<a id="options"></a>

## オプション

| フラグ | 説明 |
|---|---|
| `--target <ios \| ios-simulator \| android \| macos \| linux \| windows \| web>` | ビルド対象(必須)。 |
| `-o, --out <dir>` | 出力ディレクトリ。デフォルトは `.nsh/out`。 |
| `--name <name>` | 表示名。 |
| `--id <id>` | バンドル識別子(例: `com.example.app`)。 |
| `--app-version <version>` | バージョン(例: `1.2.0`)。 |
| `--build <n>` | ビルド番号。 |
| `--icon <png>` | アプリアイコン。正方形の PNG(1024×1024 が理想)。 |
| `--sign <identity>` | iOS: デバイス用のコード署名 identity。 |
| `--profile <file>` | iOS: デバイス用のプロビジョニングプロファイル(`.mobileprovision`)。 |
| `--keystore <file>` | Android: リリース用キーストア(デフォルト: デバッグキー)。 |
| `--key-alias <alias>` | Android: キーストア内のキーエイリアス。 |
| `--keystore-password <password>` | Android: キーストアのパスワード。`NSH_KEYSTORE_PASSWORD` からも読み込まれます。 |
| `--abi <abi>` | Android: APK の ABI。繰り返し指定するか、カンマで区切ります(デフォルト: `arm64-v8a` と `armeabi-v7a`)。 |
| `--run` | ビルド後にインストールして起動します。iOS シミュレータ、または `adb` が認識する Android デバイスやエミュレータが対象です。macOS、Linux、Windows のアプリはこのマシン上で起動され、Web サイトはこのマシンで配信されてブラウザで開かれます。`--target ios` には使えません。 |

<a id="ios-simulator"></a>

## iOS シミュレータ

```sh
nsh package --target ios-simulator --run
```

ad hoc 署名された `.nsh/out/<Name>.app` を書き出します(シミュレータには署名が必要ですが、identity は不要です)。`--run` を付けると、シミュレータが起動していなければ起動し、アプリをインストールして起動します。Xcode が必要です。

<a id="ios-devices"></a>

## iOS デバイス

```sh
nsh package --target ios \
  --sign "Apple Distribution: Example Inc (ABCDE12345)" \
  --profile AppStore.mobileprovision
```

TestFlight、App Store アップロードツール、または直接インストール(プロファイルによります)に使える `.nsh/out/<Name>.ipa` を書き出します。処理内容は次のとおりです。

- プロビジョニングプロファイルが `embedded.mobileprovision` としてアプリにコピーされます。
- entitlements はプロファイルから取得されます。NSH は、プロファイルの application identifier がアプリの `id` を含んでいることを確認し(`TEAMID.*` や `TEAMID.com.example.*` のようなワイルドカードプロファイルも使えます)、そうでなければエラーで停止します。
- アプリは、その identity を使って `codesign` で署名され、その後 `.ipa`(`Payload/<Name>.app`)に zip 圧縮されます。

identity は次のコマンドで確認できます。

```sh
security find-identity -v -p codesigning
```

`--sign` と `--profile` がない場合、NSH は未署名の `.nsh/out/<Name>.app` を書き出してその旨を通知します。これはそのままではデバイスにインストールできません。

アプリは iPhone と iPad に対応し、縦向きと横向きをサポートします(上下逆の縦向きは iPad のみ)。iOS 15.0 以降が必要です。

## Android

```sh
nsh package --target android --run
```

`.nsh/out/<Name>.apk` を書き出します。APK は、SDK のビルドツール(`aapt2`、`zipalign`、`apksigner`)を使って Gradle なしで直接組み立てられます。要件は次のとおりです。

- `ANDROID_HOME`(または `ANDROID_SDK_ROOT`、`~/Library/Android/sdk`)から見つかる Android SDK。ビルドツールと `platforms;android-35` パッケージが必要です。不足している場合、NSH が `sdkmanager` コマンドを案内します。
- 初回にデバッグキーストアを作成するための JDK。
- Rust アプリの場合は Android NDK(`sdkmanager "ndk;<version>"`、または `ANDROID_NDK_HOME`)。これが `libnsh.so` をビルドします。

アプリは API 35 をターゲットとし、API 28(Android 9)以降が必要です。スマートフォンの ABI である `arm64-v8a` と `armeabi-v7a` のネイティブコードを含みます。`--run` を使うと、エミュレータの `x86_64` など、そのデバイスの ABI も含まれます。`--abi` で ABI を自分で選ぶこともできます。たとえば `--abi arm64-v8a` とすると 64 ビットのスマートフォン専用になり、APK は最小になります。

```sh
nsh package --target android --abi arm64-v8a
```

<a id="signing-for-release"></a>

### リリース用の署名

`--keystore` がない場合、APK は標準のデバッグキー(`~/.android/debug.keystore`。なければ作成されます)で署名され、NSH はストアリリース向けではないと警告します。リリースでは、キーストアを一度作成して渡します。

```sh
keytool -genkeypair -v -keystore release.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000

NSH_KEYSTORE_PASSWORD=… nsh package --target android \
  --keystore release.jks --key-alias upload
```

パスワードがシェルの履歴に残らないよう、`--keystore-password` よりも環境変数を使うことをお勧めします。

## macOS

```sh
nsh package --target macos --run
```

`.nsh/out/<Name>.app` を書き出します。`Contents/MacOS/` に実行ファイルが入り、`nsh/assets/…`、`nsh/app.json`(ウィンドウタイトルとアプリの外観)、そして TSX アプリの `nsh/bundle.nshc` が `Contents/Resources/` に入ります。アプリは ad hoc 署名され、macOS 14 以降が必要です。配布するには、Developer ID で署名して公証してください。[macOS](./macos.md#packaging) を参照してください。

## Linux

```sh
nsh package --target linux --run
```

`.nsh/out/<Name>/`(実行ファイル `<Name>`、`nsh/assets/…`、ウィンドウタイトルとアプリケーション ID を含む `nsh/app.json`、TSX アプリの `nsh/bundle.nshc`、`<id>.desktop`、アイコン `<id>.png`)と、`.nsh/out/<Name>.tar.gz` と同じものを書き出します。Linux 上でパッケージしてください。ランナーはビルドを行ったマシン向けにビルドされます。アプリを実行する環境には、GTK 4(4.14 以降)、Pango、および WebKitGTK 6.0(Web ビューを使う場合)がインストールされている必要があります。インストール方法とデスクトップエントリについては [Linux](./linux.md#packaging) を参照してください。

## Windows

```sh
nsh package --target windows --run
```

`.nsh\out\<Name>\`(アプリのアイコンを持つ実行ファイル `<Name>.exe`、`nsh\assets\…`、ウィンドウタイトル・アプリ ID・バージョン・外観を含む `nsh\app.json`、そして TSX アプリの `nsh\bundle.nshc`)と、`.nsh\out\<Name>.zip` と同じものを書き出します。TSX アプリに追加のツールは不要ですが、Rust アプリのランナーは Visual Studio Build Tools でビルドされます。Windows 上でパッケージしてください。ランナーはビルドを行ったマシン向けにビルドされ、アイコンを埋め込めるのは Windows だけです。アプリはディレクトリのコピー先でそのまま動作し、インストールは行われません。[Windows](./windows.md#packaging) を参照してください。

## Web

```sh
nsh package --target web --run
```

静的サイト `.nsh/out/<Name>/` を書き出します。内容は `index.html`、`manifest.webmanifest`、ページスクリプト(`nsh.<digest>.js`)、`nsh.<digest>.wasm`(Rust アプリのエンジンとクレート。TSX アプリではランタイムで、アプリの ES モジュール `app.<digest>.js` の隣に置かれます)、アセットとアイコンです。各ファイルは内容に基づいて命名されるため、ホスト側で恒久的にキャッシュできます。ディレクトリは任意の Web サーバーまたは CDN にデプロイしてください。`--run` は `http://127.0.0.1:4173/` で配信するので、開いて確認できます。キャッシュヘッダーと埋め込みについては [Web](./web.md#publish-an-app) を参照してください。

<a id="icons"></a>

## アイコン

正方形の PNG(1024×1024 が理想)を `nsh.json`(`"icon": "icon.png"`)か `--icon` で指定します。

- **iOS:** Xcode の `actool` によってアプリのアセットカタログ(`Assets.car`)にコンパイルされ、iOS に必要なすべてのサイズが生成されます。
- **Android:** 192×192 にリサイズされ、ランチャーアイコン(`mipmap-xxxhdpi`)として使われます。
- **macOS:** `sips` によって `AppIcon.icns` に変換されます。
- **Linux:** `<id>.png` としてコピーされ、`.desktop` ファイルがその `Icon` として参照します。
- **Windows:** 16〜64 ピクセルと 256 ピクセルにリサイズされ、実行ファイルのアイコンとして埋め込まれます。ウィンドウ、エクスプローラー、タスクバーに表示されます。
- **Web:** 32 ピクセル(favicon)、180(`apple-touch-icon`)、192 と 512(Web アプリマニフェスト)にリサイズされます。

アイコンがない場合は、システムのデフォルトが表示されます。

<a id="what-is-inside"></a>

## 中身

Rust アプリのパッケージは、あなたのクレートとそのルートを組み込んでビルドされたランナーと、クレートが登録するアセット(`assets!()`)で構成されます。TSX アプリのパッケージには、バイトコード、`capabilities.json`(capability を宣言している場合)、インポートしたアセットがビルド済みランタイムと並んで含まれます。

| ターゲット | ランタイム | TSX アプリ |
|---|---|---|
| iOS | `nsh-ios-app` 実行ファイル | `<Name>.app/nsh/bundle.nshc`、`nsh/assets/…` |
| Android | `classes.dex`、`lib/<abi>/libnsh.so`(シンボルなし、無圧縮で格納、16 KB アライメント) | `assets/nsh/bundle.nshc`、`assets/nsh/assets/…` |
| macOS | `nsh-macos-app` 実行ファイル(`<Name>` にリネーム) | `<Name>.app/Contents/Resources/nsh/bundle.nshc`、`nsh/assets/…` |
| Linux | `nsh-linux-app` 実行ファイル(`<Name>` にリネーム) | `<Name>/nsh/bundle.nshc`、`nsh/assets/…` |
| Windows | `nsh-windows-app.exe` 実行ファイル(`<Name>.exe` にリネーム) | `<Name>\nsh\bundle.nshc`、`nsh\assets\…` |
| Web | `nsh.<digest>.wasm`、`nsh.<digest>.js` | `<Name>/app.<digest>.js`、`assets/…`、`index.html` |

パッケージされたアプリは[ネイティブコンポーネント](./native-components.md)を登録しません。ネイティブコンポーネントが必要な場合は、NSH を独自のアプリに組み込んでください。

<a id="finding-the-runtime"></a>

## ランタイムの検索

Rust アプリは独自のランナーをビルドします。TSX アプリでは、`nsh package` は CLI の隣(ディストリビューションでは `bin/../runtime`)にあるビルド済みランタイムを探します。NSH のチェックアウト内では、CLI 自身のプロファイルに合わせて `target/<triple>/<profile>` と `target/android/<profile>` を使います(デバッグ版 CLI はデバッグランタイムを使います)。これらは `cargo build -p nsh-ios-app --target aarch64-apple-ios-sim`(デバイス向けには `aarch64-apple-ios`)と `cargo xtask android`(リリース版 CLI では `--release` を追加)でビルドします。`nsh-macos-app`(macOS)、`nsh-linux-app`(Linux)、`nsh-windows-app`(Windows)は、このマシン向けに `target/<profile>`(`cargo build -p nsh-macos-app`、`cargo build -p nsh-linux-app`、`cargo build -p nsh-windows-app`)にビルドされます。Web ランタイムは CLI のプロファイルに関係なく `web` プロファイルでビルドされ、`target/wasm32-unknown-unknown/web/` に出力されます。環境変数 `NSH_RUNTIME` を使うと、ディストリビューションの `runtime/`(`ios/iphoneos`、`ios/iphonesimulator`、`android/release`、`macos`、`linux`、`windows`、`gpui`、`web` など)と同じ構成の別のディレクトリを CLI に指定できます。

<a id="see-also"></a>

## 関連項目

- [CLI](./cli.md): すべてのコマンド
- [Signed packages](./signed-packages.md): アプリがダウンロードするアップデート
- [Project structure](./project-structure.md): `nsh.json` とアプリのファイル
