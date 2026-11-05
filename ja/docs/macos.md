---
title: "macOS"
description: "macOS 上の AppKit ウィンドウで Rust と TSX の NSH アプリを実行し、.app バンドルとしてパッケージ化し、AppView を使って Mac アプリに埋め込む方法と、macOS での違いについて説明します。"
order: 13
group: platforms
source_hash: 1b63a5bad9780b73
---

# macOS

NSH アプリはネイティブの Mac アプリとしても動作します。macOS バックエンドは AppKit ビューと Core Animation でアプリを描画し、CoreText でテキストをレイアウトします。コア、リアクティブグラフ、レンダラー、Taffy レイアウト、ネイティブモジュールは iOS や Android と共通のため、1 つのアプリがどこでも動作します。macOS では `os()` は `Os::MacOs` であり（TSX では `platform.os` は `"macos"`）、TSX の `desktop={{…}}` props が適用されます。ウィンドウのタイトル、アプリ独自のタイトルバー、メニューバー、コンテキストメニューは、Rust では `nsh_core::element::desktop`（[デスクトップのタイトルバー](./rust.md#desktop-title-bars)）、TSX では [`nsh/desktop`](../modules/nsh-desktop.md) から設定します。

macOS バックエンドはデスクトップアプリとして動作します。マウス、トラックパッド、キーボード入力、サイズ変更可能なウィンドウ、ウィンドウ上のダイアログ、メニューバーに対応しています。

<a id="requirements"></a>

## 要件

- アプリを実行する **macOS 14** 以降。
- Xcode のコマンドラインツール（`xcode-select --install`）。Rust アプリのランナーと NSH の macOS ランタイムをチェックアウトからビルドするとき、およびアプリをパッケージングするとき（`codesign`、`sips`）に必要です。Mac 上で `cargo xtask dist` により作成した配布物には、TSX アプリのランタイムが `runtime/macos/` に含まれます。

<a id="running-an-app"></a>

## アプリの実行

Rust アプリはそのディレクトリから実行します。

```sh
nsh run --target macos         # the default on a Mac
```

`nsh` はクレートを含むデバッグ用ランナーをビルドし、アプリをウィンドウで開きます。ログ（`log::info!` など）はターミナルに出力されます。クレートの Rust コードを変更すると、ランナーが再ビルドされ、アプリが再起動します。`cargo run` は、`nsh init --template rust` が書き出すクレートの `src/main.rs` から同じルートを起動します。詳しくは [`run_app`](#embedding-in-a-mac-app) と `AppSource::Rust` を参照してください。

TSX アプリはエントリを指定します。

```sh
nsh run App.tsx --target macos
```

アプリは AppKit ウィンドウ（デフォルトは 1200×800）で開き、他のターゲットと同様にホットリロード、ターミナルへのログ出力、エラーオーバーレイが使えます。Cmd+R で最新のビルドをリロードします。メニューバーとウィンドウにはアプリ名が表示されます（nsh.json の `"name"`、なければディレクトリ名）。チェックアウトでは、`nsh run` が先に開発用ホスト（`nsh-macos-host`）をビルドします。`nsh run` を停止するとウィンドウが閉じ、ウィンドウを閉じると `nsh run` が終了します。ホストは、ビルド済みバンドルを単独で実行することもできます。

```sh
nsh build my-app --release -o build
dist/nsh/runtime/macos/nsh-macos-host --bundle build/bundle.nshc --window-size 1200x800   # in a checkout: target/debug/nsh-macos-host
```

`--window-size` はウィンドウの初期サイズです（TSX アプリ）。ウィンドウのサイズは変更できます。`--display <n>`（`nsh run` / `nsh test
--target macos --display <n>`) centers it on display `n`: `1` はプライマリディスプレイ、つまりメニューバーのあるディスプレイです。

`nsh test --target macos` は TSX アプリのテストを macOS のウィンドウで実行します。セカンダリディスプレイがあればそこで実行されます（メイン画面はそのまま使えます。`--display <n>` で別のディスプレイを選べます）。テストが開くアプリごとに専用のウィンドウが作られ、ディスプレイの高さが足りなくても、テストが要求するサイズになります。各ステップは、セレクターで指定されたビューに対してシステムの入力でクリック、入力、スクロールを行います（[テスト](./testing-and-trace.md#on-a-real-platform)）。

<a id="performance-monitor"></a>

### パフォーマンスモニター

`--fps`（Rust アプリの `run_app` では `AppOptions { fps: true, .. }`、組み込み時は `AppView::set_fps_monitor(true)`、`nsh run App.tsx --target macos --fps`、ホストの `--fps`、またはパッケージ済み TSX アプリの `open -a MyApp --args --fps`）を指定すると、アプリの右上にパネルが表示され、毎秒 2 回更新されます。

| 行 | 計測内容 |
|---|---|
| `FPS` | 直近 1 秒間に表示されたフレーム数。アプリに変化があったディスプレイのリフレッシュ回数です（アイドル中のアプリは低い値になりますが、遅いわけではありません）。`max` はメインスレッドが追従できた値で、続いてディスプレイのレート（ProMotion 画面では 120 Hz）が表示されます。 |
| `TICK` | 実際に届いたディスプレイのリフレッシュ間隔（平均、p95）と、表示されたフレーム間の p95 の間隔である `gap`。遅延がなければ 1 リフレッシュ分（120 Hz では 8.3 ms）になります。 |
| `MAIN` | フレームごとのメインスレッド時間（エンジンの変更の適用、テキストとキャンバスの描画、アニメーション、入力）、その 95 パーセンタイル、および `drop`（1 リフレッシュより長くかかったフレームの割合）。 |
| `JS` / `CORE` | コミットごとの、あなたのコード（ハンドラー、タイマー、リストの行）と NSH のコア（レイアウト、テキスト、差分計算）の時間。毎秒のコミット数、コミットあたりのネイティブビューの変更数。 |
| `HOP` | 変更がエンジンスレッドとメインスレッドの間で待機する時間と、エンジンスレッドのビジー度。 |
| `CPU` / `GPU` / `MEM` | プロセスの CPU（100% は 1 コア分）、GPU の占有率、メモリフットプリント（アクティビティモニタの値）。 |

下部のバーは、直近 120 フレームのメインスレッド時間を 1 リフレッシュ（ライン）と比較したものです。ラインの半分以内は緑、ライン以内は琥珀色、超過は赤で表示されます。パネルの表示中は、計測値が 1 秒に 1 回ログにも出力されます（ターゲットは `nsh::perf`。Linux バックエンドと同じ形式で、macOS のフレームフェーズ `tick`、`drain`、`canvas` を含みます。ミリ秒で、平均/p50/p95/最大の順）。これは `nsh test --fps -v` で表示でき、`examples/gallery/tools/perf.py` で読み取れます。計測にはリリースビルドを使ってください。モニターはオフの間はコストがかかりません。

<a id="packaging"></a>

## パッケージング

```sh
nsh package --target macos [--run]           # a Rust app, from its directory
nsh package App.tsx --target macos [--run]   # a TSX app
```

アプリバンドルを書き出します。

```text
.nsh/out/<Name>.app/Contents/
  Info.plist
  MacOS/<Name>               the executable: a Rust app's own runner, built with its crate; nsh's release runner for TSX
  Resources/nsh/bundle.nshc  a TSX app, compiled
  Resources/nsh/assets/…     the assets it imports (a Rust crate's `assets!()` too)
  Resources/nsh/app.json     the window title and the app's appearance
  Resources/AppIcon.icns     the icon, when nsh.json names one (converted with sips)
```

`.app` は ad hoc 署名されているため、ビルドした Mac 上で動作します。配布するには、Developer ID で署名し、公証（notarize）してください。`--run` を指定すると、パッケージング後にアプリを開きます。

<a id="embedding-in-a-mac-app"></a>

## Mac アプリへの組み込み

`nsh-platform-macos` クレート（NSH リポジトリ内）は、Rust の Mac アプリに `AppView` を提供します。これは、1 つの NSH エンジンを `NSView` として扱うものです。各 `AppView` は独立しており、複数を同時に実行できます。Rust のルート（クレートのルートコンポーネント）を実行します。

```rust
use std::rc::Rc;
use nsh_platform_macos::{
    objc2::MainThreadMarker, objc2_app_kit::NSWindow, set_ui_sets, AppOptions, AppView, Root,
};

fn show(window: &NSWindow) -> Rc<AppView> {
    // Once, before the first view: the UI sets the apps import (NSH's and your crate's).
    set_ui_sets(vec![nsh_base::registry(), my_app::registry()]);
    let mtm = MainThreadMarker::new().expect("main thread");
    let view = AppView::new(mtm, AppOptions::default());
    // register native components here, before loading
    view.load(Root::of::<my_app::App>().into());
    window.setContentView(Some(&view.view()));
    // Keep the view while the window shows it; `stop` it when the window closes.
    view
}
```

`Root::tokens` はルートに [テーマ](./rust.md#theme)（`nsh_base::Theme::from_json(json)?.into_tokens()`）を与え、`Root::app_id` はデータの保存先となる id を与えます。`nsh build` が書き出した TSX バンドルは、同じビューに読み込めます。

```rust
use nsh_platform_macos::{AppOptions, AppView, AssetBase, Bundle};

let view = AppView::new(mtm, AppOptions {
    asset_base: Some(AssetBase::Directory("app/assets".into())),
    ..AppOptions::default()
});
let code = std::fs::read_to_string("app/bundle.js").expect("bundle");
view.load(Bundle::source(code).into());
```

`AppView::load` は実行中のものを置き換え、`stop` はアプリを終了します。`asset_base` は `asset:/` URI の解決先（`AssetBase::Directory` または `AssetBase::Http`）を指定します。バイトコードバンドル（`bundle.nshc`）は `unsafe { Bundle::bytecode(bytes) }` で読み込みます。バイトコードは信頼された入力として扱われるため、自分のアプリのファイルからのみ読み込んでください。NSH アプリだけで構成されるアプリでは、`run_app(source, options)`（`AppSource::Rust(root)` または `AppSource::Bundle(bundle)`）が `AppView` を標準メニュー（About、Hide、Quit、Edit、Minimize、Zoom、Enter Full Screen、Close）付きのウィンドウで開き、ウィンドウが閉じるまで実行されます。このメニューは `Menu.setApplicationMenu`（[`nsh/desktop`](../modules/nsh-desktop.md)）で置き換えられます。デフォルトでは、ウィンドウを閉じるか Quit を選ぶとエンジンが停止し、`run_app` から戻ります。呼び出し側は、その後クリーンアップを完了するか、実行ファイルを再起動できます。

`AppOptions { keep_alive_on_close: true, ..Default::default() }` を設定すると、ウィンドウを閉じてもスタンドアロンセッションが維持されます。閉じるとウィンドウは非表示になり、Dock から再度開くと同じウィンドウとエンジンが表示されます。明示的な終了やアップデート後の再起動には、任意のスレッドから `nsh_platform_macos::quit_app()` を呼び出します。保持されているウィンドウを閉じ、エンジンを停止し、`run_app` から戻ります。`nsh_core::element::desktop::close_window()` は、選択したウィンドウクローズのポリシーに従います。

`AppOptions::cache`（次に読み込まれるアプリ向けには `AppView::set_cache`）は、アプリがキャッシュや[ダウンロードした画像](./images-and-assets.md#kept-on-disk)を保存する場所と、各アプリが保持する量（`CacheOptions`。デフォルトはシステムのキャッシュディレクトリと 256 MiB の画像）を設定します。

`AppView::set_locale(Some(locale))` と `AppView::set_font_scale(Some(scale))` は、システムの設定の代わりにアプリ独自の言語とテキストサイズを与えます（`None` でシステムの設定に戻ります）。`locale()`、`Intl`、`fontScale()`、テキストは即座に追従します（[デバイスと環境](./device-and-environment.md#in-an-embedding-app)）。

`AppView::set_theme_overrides(Some(json))` は、アプリの [テーマ](./tailwind.md#theme-tokens) の上にブランドのテーマを重ねます。`nsh.json` の `"theme"` の形式のテーマファイルで、同名のトークンはライトモードとダークモードの両方でアプリのものより優先され、それ以外のアプリのトークンはそのまま残ります。`bg-primary` などのクラスは即座にスタイルが変わり、後から読み込まれたアプリもそれを適用した状態で始まります（`None` でアプリ自身のテーマに戻ります。パースできないファイルはエラーとなり、何も変更されません）。

ネイティブコンポーネントは `AppView::register_component` で登録します。詳しくは [ネイティブコンポーネント](./native-components.md#registering-on-macos-rust) を参照してください。`set_ui_sets(sets)` は、すべてのエンジンが提供する UI セットを設定します。NSH のもの（`nsh_base::registry()`）とあなたのクレートのもの（`#[native_module]` が作る `my_app::registry()`）が含まれるため、ビューが読み込む TSX は、あなたの Rust コンポーネントやモジュールも import できます。

<a id="what-differs-on-macos"></a>

## macOS での違い

環境はデスクトップのものです。セーフエリアとキーボードの高さは 0、`idiom()` はデスクトップ（`platform.idiom` は `"desktop"`）、`os_version()`（`platform.version`）は macOS のバージョンで、ダークモードはシステムの外観にリアルタイムで追従します。[デバイスと環境](./device-and-environment.md) を参照してください。

入力はデスクトップのものです。マウス、トラックパッド（慣性スクロール、ピンチ、回転）、キーボードに対応します。選択可能なテキストは、ドラッグ、ダブルクリック、トリプルクリックで選択し、Cmd+C でコピーできます。Escape、Option+Left、Cmd+[、マウスの戻るボタンで、最前面のダイアログを閉じるか、スタック内で前の画面に戻ります（フォーカス中のフィールドや Web ページでは Escape はフォーカスを外すだけです。ページはこれらのキーを最初に受け取り、使うものは保持します）。`Dialog` はウィンドウ全体を覆うレイヤーで、アプリのポップアップとバックドロップを表示します。ページには `header` が上部に表示されます。`Input` 内ではパディング部分を含めどこをクリックしても、最も近い位置にキャレットが置かれます。`AlertDialog` は、ウィンドウ上に `NSAlert` シートを表示します。アラートのアクションは 1 行に最大 2 つ（キャンセルが左端、最後の通常アクションが Return のデフォルト）で、それより多い場合やアクションシートのアクションは、順番どおりに縦に並び、キャンセルが最後でデフォルトはありません。Escape でキャンセルのアクションが選ばれます。

<a id="keyboard"></a>

### キーボード

| キー | 動作 |
|---|---|
| Return | `Input` 内で、`submitBehavior` の指定どおりに動作します。送信（`onSubmit`）、送信してフィールドを離れる、または改行（複数行入力） |
| Return、テンキーの Enter、Space | フォーカス中のビューを `onPress` でアクティブにします（キーダウン時に 1 回。オートリピートは無視されます） |
| Shift+Return、Option+Return、Ctrl+Return | return で送信する複数行入力での改行 |
| Tab、Shift+Tab（Ctrl も可） | 最前面のダイアログ内で、画面上の順序で次 / 前のフィールドまたは押せるビューに移動します。Option+Tab は複数行入力でタブを入力します |
| Escape | フォーカス中のフィールドを離れます。それ以外では、テキスト選択を解除し、次に最前面のダイアログを閉じるか前に戻ります |
| Option+Left、Cmd+[、マウスの戻るボタン | 戻ります（フィールドにフォーカスがあるときは戻りません。その場合 Option+Left はキャレットを移動します） |
| Option / Cmd + 矢印（Shift 併用可）、Option+Delete、Cmd+Delete、Ctrl+A / E / K | すべての Mac アプリと同様に、フィールド内で単語や行単位の移動、選択、削除を行います |
| Cmd+Z、Shift+Cmd+Z、Cmd+X / C / V / A | 取り消し、やり直し、切り取り、コピー、貼り付け、すべて選択（`masked` フィールドは切り取りとコピーを拒否します）。Cmd+A / Cmd+C は選択可能なテキストを選択してコピーします |
| 矢印、Page Up / Down、Space、Shift+Space、Option+Up / Down、Home / End、Cmd+Up / Down | フォーカス中のビューの周囲またはマウスの下にあるスクロールビューを、1 行、1 ページ、先頭 / 末尾へスクロールします（フィールドにフォーカスがあるときは動作しません） |
| Cmd+W、Cmd+M、Ctrl+Cmd+F、Cmd+H、Option+Cmd+H、Cmd+Q | 閉じる、最小化、フルスクリーン、非表示、ほかを非表示、終了（`nsh package` と `nsh run` のアプリのメニュー） |
| Cmd+R | 最新のビルドをリロードします（`nsh run`） |

アプリ独自のショートカット（[`keymap`](../modules/nsh.md#keymap)）はこれらより優先されます。ただし、フォーカス中の押せるビューに向けられたアクティベーションキー、Quit、Hide、Minimize、Full Screen は例外で、これらはバインドできません。

ショートカットはどのキーボードレイアウトでも動作します（キリル文字やギリシャ文字のレイアウトでは、Cmd+C は US レイアウトで C を入力するキーです）。入力メソッドの変換を確定する return（中国語、日本語など）は、送信を行いません。`onKeyPress` は React Native が報告するものと同じ、入力されたテキスト、`"Enter"`、`"Backspace"`、`"Escape"` を報告します。

非対応、または動作が異なるもの:

- **ズーム可能なスクロールビュー**（`zoomTo`、zoom 関連の props）。
- **`mixBlendMode`**、および 1 を超える `brightness()`。
- **入力**: コンテンツタイプと自動入力、キーボードタイプ、自動大文字化、文字間隔。入力アクセサリビューは表示されず（ソフトウェアキーボードがないため）、`keyboardShouldPersistTaps` は無視されます。
- **`WebView` の `scrollable={false}`** は、マウスホイールとトラックパッドによるページのスクロールを防ぎます。代わりに、その周囲にあるアプリのスクロールビューがスクロールします（iOS と同様）。ページは引き続きキーボード（Space、矢印）とページ自身のスクリプトでスクロールし、ページ間のトラックパッドスワイプ（`allowsBackForwardNavigationGestures`）も無効になります。
- **アクセシビリティ**: カスタムの `accessibilityActions`。
- **ステータスバー**と**ハプティクス**（デスクトップには相当するものがありません）。

<a id="see-also"></a>

## 関連項目

- [CLI](./cli.md): `nsh run --target macos`、`nsh package --target macos`
- [パッケージング](./packaging.md)
- [プラットフォーム固有のコード](./platform-specific.md)
