---
title: "はじめに"
description: "nsh init を使って Rust または TSX でアプリを作成し、iOS、Android、macOS、Windows、Linux、または Web 上で実行できます。TSX モジュールをアプリにホストして署名付きパッケージとして配布することも、アプリ単体でパッケージ化することもできます。"
order: 4
group: start
demo: guide-getting-started
source_hash: 57c002bb7e893547
---

# はじめに

このガイドでは、NSH アプリを作成し、対象とするプラットフォームで実行し、出荷するまでを説明します。NSH アプリは Rust または TSX で書き、同じエンジン上で動きます。Rust はアプリを JavaScript VM なしでネイティブコードにコンパイルします。TSX は QuickJS 上で動作し、ネイティブアプリが実行時に読み込めるモジュールとしてホットアップデートに対応します。このガイドでは、まず Rust アプリを扱い、次に同じアプリを TSX で扱います。`nsh` がインストール済みで `PATH` に含まれていることを前提とします（[Installation](./installation.md)）。チェックアウトしたリポジトリ内では、代わりに `./target/debug/nsh` を使います。

> [!TIP]
> 手元にアプリのプロジェクトがありませんか。最初の 2 つのセクションではプロジェクトは不要です。`nsh run` を実行すると、コンピュータ上のウィンドウ、iOS シミュレータ、Android デバイス、またはブラウザにアプリが表示されます。そこで終えることも、[スタンドアロンアプリとしてパッケージ化する](#or-ship-it-as-a-standalone-app)こともできます。

<a id="create-an-app"></a>

## アプリを作成する

ターミナルで `nsh init` を実行すると、アプリを何で書くかを尋ねられます。選択肢は `rust`、`ts`、`mixed`（独自の Rust クレートを持つ TSX）です。`--template` を指定すると、尋ねずに選択できます。

<a id="in-rust"></a>

### Rust の場合

```sh
nsh init my-app --template rust
```

`nsh init` はディレクトリを作成し、Cargo プロジェクトを書き出します。

| ファイル | 内容 |
|---|---|
| `src/lib.rs` | アプリ本体: ルートコンポーネント、状態、ハンドラ |
| `src/main.rs` | `cargo run` のために、同じルートを macOS、Windows、Linux にマウントします |
| `Cargo.toml` | クレート。CLI のバージョンで `nsh-core` と `nsh-base` に依存します |
| `nsh.json` | アプリの名前、id、バージョン、ビルド番号、そのクレート（`"rust": "."`）とルートコンポーネント（`"root": "App"`）（[Project structure](./project-structure.md#nshjson)） |
| `App.test.tsx` | ルートのテスト。TypeScript（`nsh test`）で書かれ、エディタ向けに `tsconfig.json` と `.nsh/types` が付きます |
| `README.md` | アプリの実行、テスト、パッケージ化の方法と、後から TSX エントリを追加する方法 |
| `.gitignore` | `.nsh/` と `target/` を無視します |

Rust での開発には Rust ツールチェーン（[rustup](https://rustup.rs)）が必要です。`nsh` コマンドは、crates.io 上の NSH のクレートから、CLI のバージョンでアプリのランナーをビルドします。

<a id="in-tsx"></a>

### TSX の場合

```sh
nsh init my-app --template ts
```

TSX アプリは、1 つ以上の `.tsx` ファイルとエントリで構成されます。エントリは `nsh run` が実行するものであり、ホストアプリがモジュールとして読み込むものでもあります。

| ファイル | 内容 |
|---|---|
| `App.tsx` | エントリモジュール。`mount` でアプリを描画します |
| `App.test.tsx` | そのテスト（`nsh test`） |
| `nsh.json` | アプリの名前、id、バージョン、ビルド番号（[Project structure](./project-structure.md#nshjson)） |
| `tsconfig.json` | NSH の TypeScript 設定である `.nsh/tsconfig.json` を継承します。この設定は `nsh` を `.nsh/types` の宣言に解決します |
| `.gitignore` | `.nsh/` と `target/` を無視します |
| `.nsh/types/` | エディタ向けに生成される、すべての NSH モジュールの宣言 |

すでに存在するファイルは保持されるため、これらの一部がすでにあるディレクトリでも実行できます。Rust アプリは新しいディレクトリに作成されます。

どちらの場合も、表示名はデフォルトでディレクトリ名になります。別の名前にするには `--name "My App"` を渡します。id は `com.example.<name>` になります。出荷する前に `nsh.json` で変更してください。`nsh init my-app --template mixed` は、Rust クレートでもある TSX アプリを作成します（`Cargo.toml` と `src/lib.rs` が `App.tsx` の隣に置かれます）。そのコンポーネント、モジュール、クラスを `App.tsx` がインポートします（[Building with Rust](./rust.md)）。

<a id="the-root-component"></a>

### ルートコンポーネント

2 つのテンプレートは、カウンターという同じアプリを作ります。

```rust tabs
// src/lib.rs
use nsh_base::theme;
use nsh_core::prelude::*;

/// The crate's UI set: what a TSX entry may import from `my-app/native`.
#[native_module("my-app/native")]
fn native(registry: &mut Registry) {
    registry.register::<App>();
}

/// The application's root component.
#[component]
pub fn App() -> impl IntoElement {
    let count = signal(0_u32);
    view()
        .flex_1()
        .bg(move || theme().background)
        .text_color(move || theme().foreground)
        .child(
            view()
                .flex_1()
                .p_safe_area()
                .child(
                    view()
                        .flex_1()
                        .items_center()
                        .justify_center()
                        .gap_4()
                        .child(text(move || format!("Count: {}", count.get())).text_size(px(28.0)))
                        .child(
                            view()
                                .px_5()
                                .py_3()
                                .rounded(px(10.0))
                                .bg(move || theme().primary)
                                .active(|s| s.opacity(0.6))
                                .on_press(move || count.update(|value| *value += 1))
                                .child(
                                    text("Tap")
                                        .text_size(px(17.0))
                                        .text_color(move || theme().primary_foreground),
                                ),
                        ),
                ),
        )
}
```

```tsx tabs
// App.tsx
import { mount, signal, Text, View } from "nsh";

function App() {
  const count = signal(0);
  return (
    <View class="flex-1 items-center justify-center gap-4 bg-background pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <Text class="text-3xl font-semibold text-foreground">{count()}</Text>
      <View
        onPress={() => count.update((c) => c + 1)}
        role="button"
        class="rounded-(--radius) bg-primary px-5 py-3 active:bg-primary/90"
      >
        <Text class="text-lg text-primary-foreground">Tap</Text>
      </View>
    </View>
  );
}

mount(App);
```

Rust の場合:

- **`use nsh_core::prelude::*`** は、プリミティブ（`view()`、`text()`、`scroll()`、`input()`、`image()` など）、[シグナル](./reactivity.md)、型付きのスタイルメソッド（`.p_safe_area()` はビューに[セーフエリア](../elements/safe-area.md)ぶんのパディングを付けます）を取り込みます。**`nsh_base`** にはスタイルなしの基本コンポーネント（`button()`、キーボード、ダイアログ）と、アプリのコンポーネントが描画に使う色や角丸を持つ `theme()` があります（[Theme](./rust.md#theme)）。
- **`#[component] pub fn App()`** はコンポーネントです。**一度だけ**実行され、要素を返す関数です。`nsh.json` の `"root": "App"` がその名前を決め、`nsh run` がマウントします。`signal(0_u32)` は時間とともに変化する値を作ります。
- **`text(move || format!(…, count.get()))`** はテキストをシグナルにバインドします。`count` が変化すると、NSH はこのクロージャを再実行し、このテキストだけを更新します。スタイルも同じようにクロージャを受け取ります。`.bg(move || theme().primary)` はテーマに従ってダークモードになります。
- **`.on_press(..)`** はビューが押下に応答するようにします。`.active(|s| s.opacity(0.6))` は押されている間のスタイルで、ネイティブに適用されます。このボタンはアプリ自身のものです。NSH はプリミティブと機能を提供し、アプリはそれらから UI を描きます。
- **`.px_5()`、`.rounded(px(10.0))`、`.gap_4()`** は、Tailwind のユーティリティと同じ名前を持つ型付きスタイルメソッドで、単位はポイント（`px`）です。レイアウトは flexbox で、子要素はデフォルトで縦方向に並びます（[Layout](./layout.md)）。
- **`#[native_module("my-app/native")]`** は、TSX エントリがクレートからインポートできるものを指定します。TSX の画面を上に追加するときに使います（[Building with Rust](./rust.md#extending-a-rust-app-with-tsx)）。

TSX の場合:

- **`import { mount, signal, Text, View } from "nsh"`**: `nsh` はコアモジュールで、シグナル、`mount`、その他のリアクティブプリミティブ、ホスト要素を含みます。バンドルされず、ネイティブランタイムから提供されます。**`nsh/base`** には、Rust の `nsh_base` と同様に基本コンポーネントがあります。
- **`function App()`** は**一度だけ**実行されるコンポーネントです。**`{count()}`** は JSX 内でシグナルを読み取ります。コンパイラが呼び出しを検出し、このテキストがシグナルに追従するようにします。
- **`<View onPress>`** は押下に反応するネイティブビューで、`active:` クラスは押されている間のスタイルです。`View`、`Text`、`Image`、`Scroll` とその他の[ホスト要素](../elements/index.md)は `nsh` からインポートします（`Input` は `nsh/base` から）。インポートが不要なのは `If` と `Each` だけです。
- **`class`** は [Tailwind](./tailwind.md) のクラスを受け取ります。`style={{ … }}` は camelCase のスタイルプロパティのオブジェクトを受け取り、数値の単位はポイントです。`bg-background`、`bg-primary`、`text-primary-foreground`、`rounded-(--radius)` はアプリのテーマのトークンを指します（[Theme tokens](./tailwind.md#theme-tokens)）。これらは自動的にダークモードに追従し、`nsh.json` 内の `"theme"` でスタイルを変更できます。
- **`mount(App)`** はコンポーネントをアプリのサーフェスに描画します。

> [!IMPORTANT]
> テキストはテキスト要素内に表示します。Rust では `text(..)`、TSX では `<Text>` です。TSX では、`<View>` に直接書いたテキスト（`<View>Hello</View>`）はその箇所を指すビルドエラーになり、式がそこに置いた文字列（`<View>{name}</View>`）はログに報告されます。

<a id="develop-it"></a>

## 開発する

<a id="run-it"></a>

### 実行する

`nsh run` はアプリをビルドして起動し、編集中は再ビルドします。アプリのログはターミナルに表示されます。アプリのディレクトリを指定すると、Rust アプリのルート、または TSX アプリの `App.tsx` を実行します（`nsh run my-app/App.tsx` で別のエントリを指定できます）。

Rust アプリの場合、`nsh run` は、あなたのクレートとマウントされたルートを含み QuickJS を含まない、ターゲット向けのアプリ専用ランナーをビルドして起動します。Rust コードを変更すると再ビルドされ、アプリが再起動します。アプリのディレクトリで `cargo run` を実行すると、同じルートをデスクトップバックエンドで直接起動します。TSX アプリの場合、`nsh run` は開発サーバーと、そこからアプリを読み込む開発ホストを起動し、保存のたびに実行中のアプリにパッチを当てます。

`--target` を指定しない場合、`nsh run` は現在使っているマシンを使います。macOS では AppKit ウィンドウ、Windows では Win32 ウィンドウ、Linux では GTK ウィンドウです。別のプラットフォームを選ぶには `--target` を使います。

| ターゲット | コマンド | 実行元 |
|---|---|---|
| iOS シミュレータ | `nsh run my-app --target ios` | Xcode のある macOS |
| Android | `nsh run my-app --target android` | macOS、Windows、Linux |
| macOS (AppKit) | `nsh run my-app` | macOS（デフォルト） |
| Windows | `nsh run my-app` | Windows（デフォルト） |
| Linux (GTK 4) | `nsh run my-app` | Linux（デフォルト） |
| Web | `nsh run my-app --target web` | macOS、Windows、Linux |
| Mac Catalyst | `nsh run my-app --target catalyst` | macOS |

<a id="ios-simulator"></a>

#### iOS シミュレータ

```sh
nsh run my-app --target ios
nsh run my-app --target ios --device "iPhone 16 Pro"
```

`nsh` は、起動済みのシミュレータを使います。どれも起動していなければ最新の iPhone を起動し、アプリ（Rust アプリのランナー、または開発ホスト）をそこにインストールします。`--device` で、名前または UDID によりシミュレータを選べます。

#### Android

```sh
nsh run my-app --target android
```

先にエミュレータを起動するか、デバイスを接続してください（`adb devices` で一覧表示されます。NSH は最初の 1 台を使います）。`nsh` はそこにアプリをインストールします。Rust アプリ専用の `libnsh.so`、または開発ホスト APK（ランタイムが変わったときだけ再ビルドされます）が対象で、その開発サーバーのポートは `adb reverse` でデバイスに転送されるため、共有ネットワークなしで USB 経由でも動作します。

#### macOS (AppKit)

```sh
nsh run my-app --target macos
```

アプリはデスクトップの Mac アプリ（AppKit、サイズ変更可能なウィンドウ）として開き、タッチの代わりにマウス、トラックパッド、キーボードで入力します。macOS 14 以降が必要です。[macOS](./macos.md) を参照してください。

<a id="windows-default-on-windows"></a>

#### Windows（Windows ではデフォルト）

```sh
nsh run my-app
```

アプリはデスクトップウィンドウ（1200×800 ポイント）で開き、マウス、タッチパッド、タッチ、キーボードで入力します。Windows 10 1809 以降が必要です。[Windows](./windows.md) を参照してください。

<a id="linux-default-on-linux"></a>

#### Linux（Linux ではデフォルト）

```sh
nsh run my-app
```

アプリは GTK ウィンドウ（390×844 ポイント）で開きます。GTK 4.14 以降が必要です。[Linux](./linux.md) を参照してください。

#### Web

```sh
nsh run my-app --target web
```

`nsh` はページのアドレスを表示するので、ブラウザで開きます。Rust アプリはあなたのクレートとともに WebAssembly として動作し、開いているページは変更後に自動的に新しいビルドを読み込みます。[Web](./web.md) を参照してください。

#### Mac Catalyst

```sh
nsh run my-app --target catalyst
```

アプリは Mac 上の iPhone サイズのウィンドウ（390×844 ポイント）で開きます。シミュレータを起動する必要がないため、アプリが携帯電話でどう見えるかを確認する最も手早い方法です。iOS と同じ UIKit を使うので、マウスホイールによるスクロールのような Mac 固有の挙動を除けば、iPhone と同じ見え方になります。Mac アプリそのものを確認するには `--target macos` を使います。

<a id="edit-it"></a>

### 編集する

`nsh run` を実行したままにして、ボタンのラベルを変更します。

```rust tabs
text("Add one")
    .text_size(px(17.0))
    .text_color(move || theme().primary_foreground)
```

```tsx tabs
<Text style={{ color: "white", fontSize: 17 }}>Add one</Text>
```

保存します。Rust アプリは再ビルドされ、新しいラベルで再起動し、カウントは最初からになります。TSX アプリはホットアップデートされます。CLI が再ビルドしてパッチを送り、ホストは変更されたモジュールを再実行し、コードが変更されたコンポーネントだけを再描画します。ここでは `count` シグナルを持つ `App` が該当するため、この場合もカウントは最初からになります。

UI の一部は、独自のコンポーネント、または要素を返す通常の関数に切り出せます。

```rust tabs
/// The app's button: a view that answers presses.
fn tap_button(on_press: impl Fn() + 'static) -> impl IntoElement {
    view()
        .p_3()
        .rounded(px(10.0))
        .bg(move || theme().primary)
        .active(|s| s.opacity(0.6))
        .on_press(on_press)
        .child(text("Tap").text_size(px(17.0)).text_color(move || theme().primary_foreground))
}

// In App: .child(tap_button(move || count.update(|value| *value += 1)))
```

```tsx tabs
function TapButton(props: { onPress: () => void }) {
  return (
    <View onPress={props.onPress} activeStyle={{ opacity: 0.6 }} style={{ padding: 12, borderRadius: 10, backgroundColor: "#0969da" }}>
      <Text style={{ color: "white", fontSize: 17 }}>Tap</Text>
    </View>
  );
}

// In App: <TapButton onPress={() => count.update((c) => c + 1)} />
```

TSX では、状態を持たないコンポーネントを編集しても状態は保持されます。何度かタップしてから `TapButton` の色を変更すると、ボタンは更新されますがカウントは保たれます。ホットリプレースはトップレベルのコンポーネント単位で働きます。対象は、名前が大文字で始まり、本体に JSX を含む関数です。コンポーネントは、自身のコードが変わったとき、またはモジュール内のコンポーネント外のコード（使用している定数やヘルパー）が変わったときに再描画されます。編集をその場で適用できない場合（たとえば、実行中のアプリがまだインポートしていない NSH モジュールをインポートした場合や、`nsh.json` の機能を変更した場合）、ホストはアプリ全体を再読み込みします。

<a id="errors"></a>

#### エラー

Rust のコンパイルエラーは cargo の出力とともにターミナルに表示され、`nsh run` は次の保存で再ビルドします。TSX のビルドエラーはターミナルに表示され、デバイス上にもファイル、行、列を示す赤いオーバーレイとして表示されます。アプリは最後に成功したビルドで動き続けます。オーバーレイは次のビルドが成功すると消えます（タップすると早めに閉じられます）。実行時に投げられた例外も同じように表示され、そのスタックは `.tsx` のソースに対応付けられます。

<a id="host-it-in-your-app"></a>

## 自分のアプリに組み込む

ネイティブアプリは、NSH を独自のビューに表示します。iOS では `NshAppView`（`UIView`）、Android では `NshView`（Android の `View`）、macOS、Windows、Linux、GPUI アプリでは `AppView` です。ほかのビューと同じように、任意の画面に、必要な数だけ配置できます。

Rust のルートはアプリのビルドの一部です。アプリはあなたのクレートをリンクし、macOS、Windows、Linux、GPUI、iOS の `AppView` 上で `AppSource::Rust` を使ってルートをマウントします（[Building with Rust](./rust.md#an-app-written-in-rust)）。TSX アプリはビューが読み込むモジュールです。開発中は開発サーバーから、リリースではビルド済みのバンドル、またはダウンロードした署名付きパッケージから読み込みます。以下のセクションでは TSX モジュールを読み込みます。

### iOS

Debug では `NativeShellDev.xcframework`、Release では `NativeShell.xcframework` をリンクし（[Embedding in iOS apps](./ios.md)）、次のようにします。

```swift
import NativeShell

let app = NshAppView()
app.onError = { message in print("nsh error: \(message)") }
view.addSubview(app)   // and constrain it like any view

#if DEBUG
try app.connectDevServer(URL(string: "ws://127.0.0.1:8790/ws")!)   // `nsh dev my-app` on your Mac
#else
try app.loadBundle(at: Bundle.main.url(forResource: "bundle", withExtension: "nshc", subdirectory: "nsh")!)
#endif
```

`nsh dev my-app` はモジュールをアプリに提供し、保存のたびにプッシュします。これは `nsh run` が独自のホストで行うのと同じです。リリースビルドでは、`nsh build my-app --release --out MyApp/nsh` がバンドルをフォルダに書き出すので、それをアプリのリソースに追加します。

### Android

デバッグビルドには `nsh-dev.aar`、リリースビルドには `nsh.aar` を追加し（[Embedding in Android apps](./android.md)）、次のようにします。

```kotlin
val nsh = NshView(this)
nsh.setErrorListener { message -> Log.e("nsh", message) }
setContentView(nsh)   // or add it to any layout

if (BuildConfig.DEBUG) {
    nsh.connectDevServer("ws://127.0.0.1:8790/ws")   // with `adb reverse tcp:8790 tcp:8790`
} else {
    nsh.loadAssetBundle("nsh")   // assets/nsh, from `nsh build my-app --release --out app/src/main/assets/nsh`
}
```

<a id="macos-windows-and-linux"></a>

### macOS、Windows、Linux

Rust で書かれたデスクトップアプリは、`nsh-platform-macos`、`nsh-platform-windows`、`nsh-platform-linux`、`nsh-platform-gpui` の各クレートにある `AppView` で NSH を組み込みます。組み込み先は `NSView`、子ウィンドウ、GTK ウィジェット、GPUI ビューのいずれかで、Rust のルートをマウントするか、ビルド済みバンドルを読み込みます。[macOS](./macos.md#embedding-in-a-mac-app)、[Windows](./windows.md#embedding-in-a-win32-app)、[Linux](./linux.md#embedding-in-a-gtk-app)、[GPUI](./gpui.md) を参照してください。すべてのホストを並べて比較するには [Platforms](./platforms.md#embed-in-a-native-app) を参照してください。

<a id="what-the-module-may-do"></a>

### モジュールにできること

iOS と Android では、モジュールに何を許可するかを、読み込む前にホストが決定します。`grantCapabilities` はモジュールが到達できるネットワークホストなどの機能を設定し、制限はメモリ、呼び出し時間、ノード数の上限を定めます（[Sandbox and capabilities](./sandbox-and-capabilities.md)）。独自のネイティブビュー（地図、チャート、デザインシステムのコンポーネント）をモジュールに提供するには、それらを[ネイティブコンポーネント](./native-components.md)として登録します。

<a id="ship-updates-as-signed-packages"></a>

## 署名付きパッケージとして更新を配信する

リリース後にアプリがダウンロードする TSX モジュールは、署名付きパッケージとして提供されます。ルートキーを一度作成してオフラインで保管し、それでリリースキーを認証してから、公開します。

```sh
nsh keygen keys/root && nsh keygen keys/release
nsh certify --root keys/root.secret --key keys/release.pub --apps 'com.example.*' -o keys/release.cert
nsh publish my-app --key keys/release.secret --cert keys/release.cert --build 2
```

アプリはルートの公開鍵を信頼し、ダウンロードしたものを読み込みます。NSH は、何かを実行する前に、署名、証明書、失効リストを検証します。

```swift
let support = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
let trust = try NshTrust(stateDirectory: support.appendingPathComponent("nsh"))
try trust.addRoot(rootPublicKey)   // the contents of keys/root.pub
let info = try await app.loadPackage(at: downloadedFile, trust: trust)
```

Android でも、`NshTrust` と `NshPackage` で同じ流れになります。ホスティング、配信、失効の詳細は [Signed packages](./signed-packages.md) を参照してください。
<a id="or-ship-it-as-a-standalone-app"></a>

## スタンドアロンアプリとして配布する

`nsh package` は、Xcode プロジェクトや Gradle ビルドを自前で用意することなく、Rust または TSX のインストール可能なアプリをビルドします。

```sh
nsh package my-app --target ios-simulator --run
nsh package my-app --target android
nsh package my-app --target macos
nsh package my-app --target linux
nsh package my-app --target windows
nsh package my-app --target web
```

Rust アプリは、あなたのクレートと NSH のクレートからビルドされた専用のランナーとともにパッケージ化され、そのルートがマウントされます。TSX アプリは、ビルド済みのランタイムとともにパッケージ化されます。オプション、署名、アイコンについては [Packaging](./packaging.md) を参照してください。

<a id="try-it-in-the-terminal"></a>

## ターミナルで試す

`nsh test` は、デバイスやウィンドウなしで、アプリをヘッドレスで実行します。Rust アプリの `nsh.json` または TSX アプリのエントリを指定すると、アプリを開いて実行させ、マウントされた内容を出力します。`--trace` を付けると、ネイティブビューの操作と各コミットにかかった時間も出力します ([Testing](./testing-and-trace.md))。

```sh
nsh test my-app/nsh.json --trace     # a Rust app's root
nsh test my-app/App.tsx --trace      # a TSX app's entry
```

ディレクトリを指定すると、そのアプリのテストを実行します。各テンプレートの `App.test.tsx` がアプリを開き、ボタンを押して、表示内容を確認します (`nsh test my-app`)。Rust アプリのテストはルートを開きます (`open(".")`)。`nsh_testing::Headless` を使って `cargo test` でテストすることもできます ([Building with Rust](./rust.md#testing))。

<a id="next-steps"></a>

## 次のステップ

- [Building with Rust](./rust.md): Rust アプリ、そのテーマ、そして Rust クレートの上に構築する TSX。
- [JSX and components](./jsx-and-components.md) と [Reactivity](./reactivity.md): Rust と TSX におけるコンポーネントとシグナル。
- [Platforms](./platforms.md): 各プラットフォームがサポートする機能と、個別のページ ([iOS](./ios.md)、[Android](./android.md)、[macOS](./macos.md)、[Windows](./windows.md)、[Linux](./linux.md))。
- [Signed packages](./signed-packages.md) と [Sandbox and capabilities](./sandbox-and-capabilities.md): 配布方法と、モジュールに許可される操作。
- [Project structure](./project-structure.md): `nsh.json` に置くもの、アセット、ファイル。
