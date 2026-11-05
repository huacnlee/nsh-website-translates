---
title: "Linux"
description: "Rust と TSX で書かれた NSH アプリを Linux の GTK 4 ウィンドウで実行し、パッケージ化し、AppView を使って GTK アプリに組み込む方法と、Linux 固有の違いについて説明します。"
order: 15
group: platforms
source_hash: c423cb25ff360498
---

# Linux

NSH アプリは Linux でも動作します。Linux バックエンドは GTK 4 ウィジェットでアプリを描画し、Pango でテキストをレイアウトします。コア、リアクティブグラフ、レンダラー、Taffy レイアウト、ネイティブモジュールは iOS や Android と同じなので、1 つのアプリがどこでも動きます。Linux では `os()` は `Os::Linux` です（TSX では `platform.os` は `"linux"`）。また TSX の `desktop={{…}}` props も適用されます。ウィンドウのタイトル、アプリ独自のタイトルバー、メニューバー、コンテキストメニューは、Rust では `nsh_core::element::desktop`（[デスクトップのタイトルバー](./rust.md#desktop-title-bars)）、TSX では [`nsh/desktop`](../modules/nsh-desktop.md) から設定します。

<a id="requirements"></a>

## 必要条件

- **GTK 4.14** 以降。Rust アプリのランナーや NSH の Linux ランタイムをビルドするには（チェックアウトから、または `cargo xtask
  dist` on Linux) you need their development packages and clang: `libgtk-4-dev clang`）、Debian と Ubuntu（24.04 以降）ではこのパッケージが必要です。Arch では `gtk4 clang`、Fedora では `gtk4-devel clang` が必要です。
- Web ビュー用の **WebKitGTK 6.0**（2.40 以降）。ランタイムをビルドするには、Debian と Ubuntu では `libwebkitgtk-6.0-dev`、Arch では `webkitgtk-6.0`、Fedora では `webkitgtk6.0-devel` が必要です。開発ホストとリリースランナーはデフォルトでこれを使うため、パッケージ化したアプリを実行する環境にも WebKitGTK 6.0 が必要です（Debian と Ubuntu では `libwebkitgtk-6.0-4`。GNOME デスクトップには含まれています）。開発ファイルのないマシンで `cargo xtask dist` を実行すると、Web ビューがプレースホルダーになり、アプリが GTK だけで動作するランタイムがビルドされます。
- アプリが再生する動画形式に対応した **GStreamer** プラグイン（GTK は GStreamer で動画を再生します）。

<a id="running-an-app"></a>

## アプリの実行

Linux では、`nsh run` がアプリを GTK ウィンドウで開きます。Rust アプリはそのディレクトリから実行します。

```sh
nsh run                        # --target linux is the default on Linux
```

`nsh` は、あなたのクレートでデバッグランナーをビルドしてアプリを開き、ログ（`log::info!` など）をターミナルに出力します。クレートの Rust コードを変更すると、ランナーが再ビルドされ、アプリが再起動します。`cargo run` は、`nsh init --template rust` が書き出すクレートの `src/main.rs` から同じルートを起動します：[`run_app`](#embedding-in-a-gtk-app)（`AppSource::Rust` 付き）。

TSX アプリはエントリを指定し、デフォルトで 390×844 のウィンドウで開きます。他のターゲットと同様に、ホットリロード、ターミナルへのログ出力、エラーオーバーレイが使えます。

```sh
nsh run App.tsx
```

チェックアウトでは、`nsh run` がまず開発ホスト（`nsh-linux-host`）をビルドします。Linux 上で作成したディストリビューションには、開発ホストが `runtime/linux/` に含まれます。Ctrl-C でウィンドウが閉じ、ウィンドウを閉じると `nsh run` が終了します。ホストはビルド済みバンドルを単独で実行することもできます。

```sh
nsh build my-app --release -o build
dist/nsh/runtime/linux/nsh-linux-host --bundle build/bundle.nshc --window-size 1024x768   # in a checkout: target/debug/nsh-linux-host
```

`--window-size` はウィンドウのデフォルトサイズです（TSX アプリ）。タイル型ウィンドウマネージャーは別のサイズを割り当てることがあります。

<a id="packaging"></a>

## パッケージング

```sh
nsh package --target linux [--run]           # a Rust app, from its directory
nsh package App.tsx --target linux [--run]   # a TSX app
```

ディレクトリと、同じ内容のアーカイブを書き出します。

```text
.nsh/out/<Name>/
  <Name>                 the executable: a Rust app's own runner, built with its crate; nsh's release runner for TSX
  nsh/bundle.nshc        a TSX app, compiled
  nsh/assets/…           the assets it imports (a Rust crate's `assets!()` too)
  nsh/app.json           the window title and the application id
  <id>.desktop           a desktop entry (StartupWMClass is the id)
  <id>.png               the icon, when nsh.json names one
.nsh/out/<Name>.tar.gz
```

実行ファイルは、自身と同じ場所にある `nsh/` を見つけます（たとえば `~/.local/bin` に置いたシンボリックリンクでも動作します）。アプリを実行する環境には GTK 4、Pango、WebKitGTK 6.0 がインストールされている必要があります。デスクトップのランチャーにアプリを表示するには、実行ファイル（またはリンク）を `PATH` に、`.desktop` ファイルを `~/.local/share/applications` に、アイコンをアイコンテーマのディレクトリに置きます。`--run` は、パッケージ化した後にアプリを起動します。

<a id="embedding-in-a-gtk-app"></a>

## GTK アプリへの組み込み

`nsh-platform-linux` クレート（NSH リポジトリ内）は、Rust の GTK アプリに `AppView` を提供します。これは 1 つの NSH エンジンを GTK ウィジェットにしたものです。各 `AppView` は独立しており、複数を同時に実行できます。Rust のルート、つまりあなたのクレートのルートコンポーネントを実行します。

```rust
use std::rc::Rc;
use nsh_platform_linux::{gtk4 as gtk, set_ui_sets, AppOptions, AppView, Root};
use gtk::prelude::*;

fn main() -> gtk::glib::ExitCode {
    // Once, before the first view: the UI sets the apps import (NSH's and your crate's).
    set_ui_sets(vec![nsh_base::registry(), my_app::registry()]);
    let app = gtk::Application::builder().application_id("com.example.host").build();
    app.connect_activate(|app| {
        let window = gtk::ApplicationWindow::builder().application(app).default_width(390).default_height(844).build();
        let view = AppView::new(AppOptions::default());
        // register native components here, before loading
        view.load(Root::of::<my_app::App>().into());
        window.set_child(Some(&view.widget()));
        // The window keeps the view; closing it stops the app.
        let keep = std::cell::RefCell::new(Some(Rc::clone(&view)));
        window.connect_destroy(move |_| if let Some(view) = keep.take() { view.stop() });
        window.present();
    });
    app.run()
}
```

`Root::tokens` はルートに[テーマ](./rust.md#theme)を与え、`Root::app_id` はデータを保存する際の id を与えます。`nsh build` が書き出した TSX バンドルは、`asset_base` にその `assets` ディレクトリを設定して、同じビューに読み込めます。

```rust
use nsh_platform_linux::{AppOptions, AppView, AssetBase, Bundle};

let view = AppView::new(AppOptions {
    asset_base: Some(AssetBase::Directory("app/assets".into())),
    ..AppOptions::default()
});
let code = std::fs::read_to_string("app/bundle.js").expect("bundle");
view.load(Bundle::source(code).into());
```

`AppView::load` は実行中のものを置き換え、`stop` はアプリを終了します。`asset_base` は `asset:/` URI の解決先（`AssetBase::Directory` または `AssetBase::Http`）を指定します。バイトコードバンドル（`bundle.nshc`）は `unsafe { Bundle::bytecode(bytes) }` で読み込みます。QuickJS バイトコードは信頼された入力として扱われるため、自分のアプリのファイルからのみ読み込んでください。単独のウィンドウは `nsh_platform_linux::run_app(source, options)` で、`AppSource::Rust(root)` または `AppSource::Bundle(bundle)` を使います。

`AppOptions::cache`（以降に読み込まれるアプリ向けには `AppView::set_cache`）は、アプリがキャッシュや[ダウンロードした画像](./images-and-assets.md#kept-on-disk)を保存する場所と、それぞれが保持する量を設定します（`CacheOptions`：デフォルトではシステムのキャッシュディレクトリと 256 MiB の画像）。

`AppView::set_locale(Some(locale))` と `AppView::set_font_scale(Some(scale))` は、システムの設定の代わりに、あなたのアプリの言語とテキストサイズをアプリに与えます（`None` で再びシステムの設定に従います）。`locale()`、`Intl`、`fontScale()` とテキストはすぐに追従します（[デバイスと環境](./device-and-environment.md#in-an-embedding-app)）。

`AppView::set_theme_overrides(Some(json))` は、アプリの[テーマ](./tailwind.md#theme-tokens)の上にあなたのブランドを重ねます。`nsh.json` の `"theme"` の形式のテーマファイルを使い、そのトークンはライトモードとダークモードの両方でアプリの同名のトークンより優先され、アプリのその他のトークンはそのまま残ります。`bg-primary` のようなクラスは即座にスタイルが変わり、後から読み込まれるアプリもそれを適用した状態で始まります（`None` でアプリ独自のテーマに戻ります。パースできないファイルはエラーとなり、何も変更されません）。

ネイティブコンポーネントは `AppView::register_component` で登録します。[ネイティブコンポーネント](./native-components.md#registering-on-linux-rust)を参照してください。`set_ui_sets(sets)` は、すべてのエンジンが提供する UI セットを設定します。NSH のもの（`nsh_base::registry()`）と、あなたのクレートのもの（`#[native_module]` が作る `my_app::registry()`）です。これにより、ビューが読み込む TSX から、あなたの Rust コンポーネントやモジュールもインポートできます。

<a id="what-differs-on-linux"></a>

## Linux での相違点

環境はデスクトップのものです。セーフエリアとキーボードの高さは 0、`idiom()` はデスクトップ（`platform.idiom` は `"desktop"`）、`os_version()`（`platform.version`）はカーネルのメジャーバージョンとマイナーバージョンで、ダークモードはデスクトップの設定（XDG settings portal 経由）にリアルタイムで従います。[デバイスと環境](./device-and-environment.md)を参照してください。

<a id="keyboard"></a>

### キーボード

| キー | 動作 |
|---|---|
| Return | `Input` 内では、`submitBehavior` の指定どおりに動作：送信（`onSubmit`）、送信してフィールドを離れる、または改行（複数行入力） |
| Shift+Return, Alt+Return | Return が送信になる複数行入力での改行（Ctrl+Return で送信） |
| Tab, Shift+Tab | 画面上の順序で次／前のフィールドへ（最前面のダイアログ内） |
| Escape | フォーカス中のフィールドから抜ける。それ以外では、テキスト選択を解除し、その後、最前面のダイアログを閉じるか戻る |
| Alt+Left, Back key, mouse back button | 戻る（フィールド内からも） |
| Ctrl+arrows, Home / End, with Shift; Ctrl+Backspace / Delete | フィールド内で単語・行単位の移動、選択、削除（すべての GTK アプリと同様） |
| Ctrl+Z, Ctrl+Shift+Z, Ctrl+X / C / V / A | 元に戻す、やり直し、切り取り、コピー、貼り付け、すべて選択（`masked` フィールドでは切り取りとコピーができません）。Ctrl+A / Ctrl+C で選択可能なテキストを選択・コピー |
| Arrows; Page Up / Down, Space, Shift+Space; Home / End | フォーカスされたビューの周囲、またはマウスの下にあるスクロールビューを、1 行、1 ページ、先頭／末尾へスクロール（フィールドにフォーカスがある間は無効） |
| Ctrl+W, F11, Ctrl+Q | ウィンドウを閉じる、フルスクリーン、終了（`nsh package` と `nsh run` のアプリ） |
| Ctrl+R | 最新のビルドをリロード（`nsh run`） |

アプリ独自のショートカット（[`keymap`](../modules/nsh.md#keymap)）はウィンドウ全体のショートカットコントローラーです。Ctrl+Q と F11 はバインドできません。

ショートカットはどのキーボードレイアウトでも動作します（キリル文字やギリシャ文字のレイアウトでは、Ctrl+C は US レイアウトで C を入力するキーです）。入力メソッドの変換を確定する Return（中国語、日本語など）は、決して送信になりません。`onKeyPress` は React Native が報告する内容を報告します。入力されたテキスト、`"Enter"`、`"Backspace"`、`"Escape"` です。貼り付けられたテキストは報告されません。

Web ビューは WebKitGTK のページで、NSH のビューの内部に描画されます。シート、ダイアログ、トースト、およびそれより後のビューはページの上に描画され、親はページをクリップしてフェードさせます。ウェブサイトデータ（Cookie、ストレージ、キャッシュ）はアプリごとに `~/.local/share/<app id>/webkit` と `~/.cache/<app id>/webkit` の下に保存されます。`webview` ケイパビリティはフレームのページにも適用されます。アプリに許可されていないホストの `iframe` は空のままです。ページ内の Escape は、テキストフィールドと同様にページから抜けます（ページが Escape を使う場合を除く）。Alt+Left とマウスの戻るボタンは、ページに履歴がある間はページ内で戻ります。

サポートされないもの：

- **動画 `rate`**：GTK は通常速度でのみ再生します。`onEnd` はループしない動画でのみ発生します。
- **ズームするスクロールビュー**（`zoomTo`、ズーム関連の props）。
- **`mixBlendMode` と `backdropFilter`**（背景色は描画されます）。`borderCurve: "continuous"` は円形の角を描画します。
- **入力アクセサリビュー** と **ステータスバー**（デスクトップに相当するものがありません）。
- **アクセシビリティ**：`accessible` のグルーピング、カスタム `accessibilityActions`。代わりにライブリージョンが読み上げられます。

<a id="see-also"></a>

## 関連項目

- [CLI](./cli.md)：`nsh run --target linux`、`nsh package --target linux`
- [パッケージング](./packaging.md)
- [プラットフォーム固有のコード](./platform-specific.md)
