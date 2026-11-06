---
title: "GPUI"
description: "GPUI または GPUI Kit アプリに、Rust と TSX で書かれた NSH アプリを AppView で埋め込みます。描画は macOS、Windows、Linux 上で GPUI が行います。また、GPUI 開発ホストで TSX アプリを試す方法と、GPUI バックエンドの動作の違いについても説明します。"
order: 15.5
group: platforms
source_hash: 1f281d4fc1a89362
---

# GPUI

GPUI バックエンドは、macOS、Windows、Linux のいずれでも、GPUI Kit の基盤である GPU アクセラレーション対応 UI フレームワーク [GPUI](https://gpui-kit.com)(GPUI Fast)で NSH アプリを描画します。GPUI および GPUI Kit アプリに埋め込むためのバックエンドで、`AppView` は GPUI ビューです。そのため GPUI や GPUI Kit アプリは、独自の Rust ルートや読み込んだ TSX による NSH アプリを、自身の要素ツリーの任意の場所に表示できます。スタンドアロンアプリは、各デスクトップ固有のバックエンドで実行・パッケージ化されます: [macOS](./macos.md)(AppKit)、[Windows](./windows.md)(Win32)、[Linux](./linux.md)(GTK)。コア、リアクティブグラフ、レンダラー、Taffy レイアウト、ネイティブモジュールは他のプラットフォームと同じなので、1 つのアプリがどこでも動作します。`os()`(TSX では `platform.os`)は実行中の OS(macOS、Windows、Linux)になり、TSX の `desktop={{…}}` props が適用されます。

[macOS](./macos.md)(AppKit)、[Windows](./windows.md)(Win32)、[Linux](./linux.md)(GTK)の各バックエンドにあるすべての要素とモジュールが利用できます。GPUI が独自の方法で描画する部分については、[Differences](#differences) を参照してください。

## How it works

- **サーフェスごとに 1 つの要素。** サーフェスは、親が与えるスペースを埋める 1 つの GPUI 要素で、ビューツリー全体を GPUI のプリミティブ(クアッド、シャドウ、パス、グリフ、画像)で描画します。NSH は Windows と同様にノードごとに 1 つの保持ビューを持ち、コミットで何かが変わったときだけ再描画します。
- **テキストはエンジンスレッドでシェイピング**されます。GPUI のテキストシステム(アプリ自身のフォント)を使い、NSH が行に分割します。メインスレッドはグリフを描画するだけです。
- **コミットごとに 1 ホップ。** エンジンは専用のスレッドで動作し、各コミットは GPUI のメインスレッドに送られる 1 つのクロージャとなって、ビューに通知されます。
- **入力**は GPUI のマウス、スクロール、キー、入力メソッドのイベントから受け取ります。ヒットテスト、プレス、レスポンダーシステム、スクロール、テキスト編集は Windows バックエンドと同じロジックです。

## Requirements

- macOS、Windows、または Linux で、GPUI が描画に使える GPU(macOS では Metal、Windows では DirectX、Linux では Vulkan)が必要です。
- macOS では、チェックアウトから GPUI アプリやランタイムをビルドする際に Xcode の Metal Toolchain を使用します(`xcodebuild -downloadComponent
  MetalToolchain`), which compiles GPUI's shaders ahead of time. On a Mac without it, `nsh run` は、GPUI の `runtime-shaders` feature でランタイムをビルドし、その旨を表示します。シェーダーはアプリの起動時にコンパイルされ(初回は 1 秒に満たず)、以降は macOS がキャッシュします。
- Linux では、Vulkan ドライバー、`libxkbcommon` を備えた Wayland または X11、GTK 3 と WebKitGTK 4.1(Web ビュー用)、GStreamer 1.20 以降とその base および good プラグイン(動画用)が必要です。Web ビューには X11 が必要です。Wayland デスクトップでは、アプリを Xwayland 上で実行してください(`WAYLAND_DISPLAY=` を空にします)。そうしないと、プレースホルダーが表示されます。チェックアウトからランタイムをビルドする場合は、開発用パッケージも必要です。Debian および Ubuntu の場合:

  ```sh
  sudo apt-get install clang libclang-dev pkg-config libfontconfig-dev libfreetype-dev libwayland-dev libx11-xcb-dev \
    libxcb1-dev libxkbcommon-dev libxkbcommon-x11-dev libzstd-dev libvulkan1 libgtk-3-dev libwebkit2gtk-4.1-dev \
    libgstreamer1.0-dev libgstreamer-plugins-base1.0-dev gstreamer1.0-plugins-good
  ```

## Running an app

Rust アプリは GPUI アプリの内部で動作します。`AppView` でルートを埋め込み([Embedding in a GPUI app](#embedding-in-a-gpui-app))、GPUI アプリを `cargo run` します。あなたのクレートとアプリは 1 つの Cargo ビルドになります。単体で実行する場合、Rust アプリはこの OS 固有のバックエンド(`nsh run --target macos`、`windows`、`linux`)で動作します。

TSX アプリは GPUI 開発ホストで実行します:

```sh
nsh run App.tsx --target gpui
```

アプリは GPUI ウィンドウ(デフォルトは 1200×800)で開き、GPUI アプリに埋め込んだ場合と同じように表示されます。ホットリロード、ターミナルへのログ出力、エラーオーバーレイは他のターゲットと同様に使えます。開発ホスト(`nsh-gpui-host`)は、アプリバンドルなしで各 OS 上でそのまま実行されます。チェックアウトでは `nsh run` が先にビルドし、ディストリビューションでは `runtime/gpui/` に同梱されています。ホストはビルド済みバンドルを単体で実行することもできます:

```sh
nsh build my-app --release -o build
dist/nsh/runtime/gpui/nsh-gpui-host --bundle build/bundle.nshc --window-size 390x844   # in a checkout: target/debug/nsh-gpui-host
```

`--window-size` はウィンドウのサイズ(ポイント単位、`<width>x<height>`)です。

## Packaging

GPUI アプリは、自身の実行ファイルの中に NSH を同梱します。`AppView` でアプリの Rust ルートまたは TSX バンドルを埋め込み([Embedding in a GPUI app](#embedding-in-a-gpui-app))、GPUI アプリとしてビルド・配布します。スタンドアロンの NSH アプリは、この OS 固有のターゲット [`--target macos`](./macos.md#packaging)、[`--target windows`](./windows.md#packaging)、[`--target linux`](./linux.md#packaging) でパッケージ化します([Packaging](./packaging.md))。

Linux では、Web ビューと動画を使う GPUI アプリは WebKitGTK 4.1 と GStreamer を動的にリンクします。そのため、実行するマシンには、Vulkan ドライバーと `libxkbcommon` に加えて、これらと GTK 3、GStreamer の base および good プラグインがインストールされている必要があります(Debian / Ubuntu: `libwebkit2gtk-4.1-0`、`libgstreamer1.0-0`、`libgstreamer-plugins-base1.0-0`、`gstreamer1.0-plugins-good`)。

## Embedding in a GPUI app

`nsh-platform-gpui` クレート(NSH リポジトリ提供)は、Rust の GPUI アプリに `AppView` を提供します。これは 1 つの NSH エンジンを GPUI ビュー(`Entity<AppView>`)として扱うもので、親要素が与えるスペースを埋めます。各 `AppView` は独立しており、複数を同時に実行できます。Rust ルート、つまりあなたのクレートのルートコンポーネントを実行します:

```rust
use gpui::{AppContext, WindowOptions};
use nsh_platform_gpui::{set_ui_sets, App, AppOptions, AppView, Root};

// Once, before the first view: the UI sets the apps import (NSH's and your crate's).
set_ui_sets(vec![nsh_base::registry(), my_app::registry()]);
gpui_platform::application().run(|cx| {
    cx.open_window(WindowOptions::default(), |window, cx| {
        cx.new(|cx| {
            let view = AppView::new(AppOptions::default(), window, cx);
            view.load(App::Rust(Root::of::<my_app::App>()));
            view
        })
    })
    .unwrap();
});
```

`Root::tokens` はルートに [theme](./rust.md#theme)(`nsh_base::Theme::from_json(json)?.into_tokens()`、`Theme` はここで再エクスポートされています)を渡し、`Root::app_id` はデータを保存する際の ID を渡します。`nsh build` が書いた TSX バンドルも同じビューに読み込めます:

```rust
use nsh_platform_gpui::{App, Bundle};

let code = std::fs::read_to_string("app/bundle.js").expect("bundle");
view.load(App::Js(Bundle::source(code)));
```

エンティティは他のビューと同じように要素ツリーに配置します(GPUI Kit の `Root`、パネル、ドックなど)。`AppView::load` は実行中のものを置き換え、`stop`(またはビューの破棄)でアプリを終了します。`AppOptions::asset_base` は `asset:/` URI の解決先(`AssetBase::Directory` または `AssetBase::Http`)を指定します。バイトコードバンドル(`bundle.nshc`)は `unsafe { Bundle::bytecode(bytes) }`(または unsafe 版の `Bundle::read_trusted(path)`)で読み込みます。QuickJS バイトコードは信頼された入力として扱われるため、自分のアプリのファイルからのみ読み込んでください。

- `open_app_window(source, options, cx)` は、実行中の GPUI アプリで 1 つの `AppView` を持つウィンドウを開きます。
- `run_app(source, options)` は GPUI を起動し、閉じられるまでウィンドウ内で 1 つのアプリを実行します(開発ホストが行っていることです)。
- `AppView::register_component(name, factory)` は、読み込み前に独自のネイティブコンポーネントを登録します([Native components](./native-components.md))。
- `AppOptions::cache`(次に読み込むアプリ向けには `AppView::set_cache`)は、アプリがキャッシュを保存する場所、[ダウンロードする画像](./images-and-assets.md#kept-on-disk)、および各アプリが保持する容量を設定します: `CacheOptions { location,
  images }`, `CacheLocation::System` (the default), `Dir(path)` or `Off`, `CachePolicy::Default`(256 MiB)、`MaxSize(ByteSize::mib(n))`、または `Off`。
- `AppView::host()` は、ビューと実行中のアプリとのチャネル([`host`](../modules/nsh.md#host))で、任意のスレッドから使える `HostChannel` です。読み込み前に `set_params(map)` を呼ぶとアプリに起動パラメーター(`host.params`)を渡せ、`send(name, data)` はイベント(`host.on`)を送り、`handle(name, |call| …)` はアプリの `host.call(name, data)` に応答して `host.post`(`call.resolve(json)`、`call.reject(message)`。即時でも、後から任意のスレッドからでも可)を受け取ります。ハンドラーはエンジンスレッドで実行されるため、呼び出しを GPUI のエンティティに渡し(`cx.spawn` タスクが読み取るチャネルなど)、そこから応答してください。macOS、Windows、Linux の `AppView` も同じ `host()` を持ちます。その `handle_open_url(|request| …)` は、アプリが開く URL([`openUrl`](../modules/nsh.md#openurl))をシステムより先に受け取ります。アプリ側で URL を自前でルーティングした場合は `request.handled()` を、システムに GPUI の `open_url` で開かせる場合は `request.decline()`(またはリクエストの破棄)を返します。
- `AppOptions::limits`(次に読み込むアプリ向けには `AppView::set_limits`)は、VM の制限(JS ヒープ、スタック、時間予算、ノードクォータ)を設定します([Sandbox and capabilities](./sandbox-and-capabilities.md))。埋め込みアプリには `Limits::default()`(256 MB のヒープ)が適用されます。開発ホストはアプリを単独で実行し、`Limits::standalone()` を使用します。
- `AppOptions::transparent` はビューを透過にします。ウィンドウの背景を描画せず、`open_app_window` / `run_app` は透明なウィンドウを開くため、アプリが描画していない部分にはウィンドウの背後(デスクトップウィジェット、オーバーレイ)が表示されます。デフォルトは false です。
- `AppView::connect_dev_server(url, cx)`(feature `dev`)は `nsh dev` からアプリを読み込み、編集に応じて再読み込みします。ビューの上にはエラーオーバーレイが表示され、`AppView::on_error` はアプリのエラーを受け取り続けます。
- `AppView::on_app_error(|error| …)` はアプリのエラーを受け取ります: `error.kind`(アプリの読み込み失敗、未捕捉の例外、VM の停止)、アプリの JS が二度と実行されない場合の `error.is_fatal()`、`error.message`、`error.stack`、`error.package`(由来となった署名付きパッケージの ID とビルド)。`AppView::on_error` は同じエラーをテキストとして受け取ります。
- `AppView::set_locale(locale, cx)` と `AppView::set_font_scale(scale, cx)` は、システムのものの代わりにアプリの言語とテキストサイズをアプリに渡します(`None` で再びシステムに従います)。`locale()`、`Intl`、`fontScale()` とテキストは即座に追従します([Device and environment](./device-and-environment.md#in-an-embedding-app))。
- `AppView::run_package(&package)` は、`verify_package` または `load_package` から [署名付きパッケージ](./signed-packages.md#loading-packages-in-a-host-app) を実行し、`accept_package` はアプリが正常だと判断した時点でそれを記録します。
- `set_ui_sets(sets)` は、すべてのエンジンが提供する UI セットを設定します。NSH のもの(`nsh_base::registry()`)とあなたのクレートのもの(`my_app::registry()`、`#[native_module]` が生成します。[Building with Rust](./rust.md))に加え、アプリ独自のセットも指定できます。アプリは [`nativeModule`](../modules/nsh.md#nativemodule) を使って名前でセットの関数やクラスにアクセスでき、標準の `nsh build` でビルドされます。リポジトリの `examples/embed-gpui` は、この方法でホスト内にトレーディングデスクを構築しており、2 つの埋め込み注文チケットとホスト自身のウィジェットがそれを共有しています。

## Differences

ネイティブデスクトップバックエンドと描画や挙動が異なる点:

- **Transforms**: 回転、スキュー、射影されたビューでは、背景、ボーダー、シャドウは変形しますが、テキストは直立のままで、画像、動画、キャンバスは境界どおりに描画されます。
- **Opacity** はグループ単位ではなく各色に適用されるため、半透明ビューの重なり合う子同士が透けて見えます。画像の不透明度(フェードインや半透明ビュー)は 16 分の 1 刻みで変化します。
- **Rounded clips**(半径付きの `overflow: "hidden"`)は、子の背景と画像を丸めますが、テキスト、ボーダー、動画、ネイティブコンポーネントは矩形で切り取られます。
- **描画されないもの**: `filter: blur()`、`backdropFilter`、`mixBlendMode`。シャドウは半透明の塗りを透過して見えます。`borderCurve: "continuous"` は円形の角を描画します。
- **Canvas text** は近似的に描画されます。回転しても直立のままで、`maxWidth` では幅を狭めるのではなく小さくなり、グラデーションでは単色で描画され、`strokeText` の塗りがあり、シャドウはぼかされず、合成操作と `clearRect` は適用されません。
- **Scroll views** はズームしません(`zoomTo` とズーム関連の props は無視されます)。
- **Video** は Linux(GStreamer)で再生できます。macOS と Windows ではプレースホルダーが表示され、`onError` が報告されます。
- **Web views** は、NSH が描画するすべてのものの上に、その位置で重なるネイティブビューです。Linux では X11 が必要です([Requirements](#requirements) を参照)。Xwayland でページが黒いままになる場合(ログに "Failed to create GBM buffer" と出ます)は、`WEBKIT_DISABLE_DMABUF_RENDERER=1` を付けてアプリを実行してください。macOS と Windows では、クリップする祖先要素による切り取りは適用されず、読み込み失敗時に `onError` は報告されません。`baseUrl`、`scrollable`、`allowsBackForwardNavigationGestures` はサポートされていません。
- **Accessibility** は AccessKit を経由します。スクリーンリーダーは、どのプラットフォームでも要素のアクティブ化、フォーカス、値の設定、表示位置へのスクロールができます。カスタムアクションとコンテキストメニューアクションは、まだ渡されません。

比較用に、各ネイティブバックエンド固有の一覧: [macOS](./macos.md#what-differs-on-macos)、[Windows](./windows.md#what-differs-on-windows)、[Linux](./linux.md#what-differs-on-linux)。

## See also

- [Building with Rust](./rust.md): GPUI アプリがルートを埋め込むクレート
- [CLI](./cli.md): `nsh run --target gpui`
- [Packaging](./packaging.md): スタンドアロンアプリと、各 OS 固有のターゲット
- [Platform overview](./platforms.md)
