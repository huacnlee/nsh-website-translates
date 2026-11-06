---
title: "Windows"
description: "Rust と TSX で作成した NSH アプリを、Direct2D で描画される Win32 ウィンドウ上で実行する方法、パッケージ化する方法、AppView を使って Win32 アプリに埋め込む方法、そして Windows 固有の違いについて説明します。"
order: 14
group: platforms
source_hash: d39f39f9d32017d0
---

# Windows

NSH アプリは Windows でも動作します。Windows バックエンドは、Direct2D を使ってアプリを Win32 ウィンドウに描画し、DirectWrite でテキストをレイアウトします。コア、リアクティブグラフ、レンダラー、Taffy レイアウト、ネイティブモジュールは iOS や Android と共通なので、1 つのアプリがどこでも動作します。Windows では、`os()` は `Os::Windows` であり(TSX では `platform.os` は `"windows"` です)、TSX の `desktop={{…}}` props が適用されます。ウィンドウのタイトル、アプリ独自のタイトルバー、メニューバー、コンテキストメニューは、Rust の `nsh_core::element::desktop`([デスクトップのタイトルバー](./rust.md#desktop-title-bars))と、TSX の [`nsh/desktop`](../modules/nsh-desktop.md) から設定します。

<a id="requirements"></a>

## 要件

- **Windows 10 1809** 以降、または Windows 11。
- Web ビューには **WebView2 Runtime** が必要です。Windows 11 と、Windows 10 の Microsoft Edge に含まれています。インストールされていない場合、`WebView` はプレースホルダーを表示します。
- アプリが再生する動画形式に対応する **Media Foundation コーデック**(動画は Windows 標準のメディアスタックで再生されます)。
- Rust アプリのランナーをビルドするには、C++ ワークロードと Windows SDK を含む Visual Studio Build Tools が必要です。NSH の Windows ランタイムをビルドする場合(チェックアウトから、または Windows 上で `cargo xtask dist` を使う場合)は、さらに LLVM(QuickJS のバインディング用)も必要です。

<a id="running-an-app"></a>

## アプリの実行

Windows では、`nsh run` がアプリをウィンドウで開きます。Rust アプリは、そのディレクトリから実行します。

```sh
nsh run                        # --target windows is the default on Windows
```

`nsh` はクレートを含むデバッグ用ランナーをビルドしてアプリを開き、ログ(`log::info!` など)をターミナルに出力します。クレートの Rust コードを変更すると、ランナーが再ビルドされてアプリが再起動します。`cargo run` は、`nsh init --template rust` が書き出すクレートの `src/main.rs` から同じルートを起動します。詳しくは [`run_app`](#embedding-in-a-win32-app) と `AppSource::Rust` を参照してください。

TSX アプリはエントリを指定して実行し、デフォルトでは 1200×800 のウィンドウで開きます。ホットリロード、ターミナルへのログ出力、エラーオーバーレイは他のターゲットと同様に動作します。

```sh
nsh run App.tsx
```

チェックアウトでは、`nsh run` が最初に開発ホスト(`nsh-windows-host.exe`)をビルドします。Windows 上で作成した配布物には、これが `runtime\windows\` に含まれます。Ctrl-C でウィンドウが閉じ、ウィンドウを閉じると `nsh run` が終了します。ホストは、どのような終了の仕方でも `nsh` より長く生き残ることはありません。ホストは、ビルド済みバンドルを単独で実行することもできます。

```sh
nsh build my-app --release -o build
dist\nsh\runtime\windows\nsh-windows-host --bundle build\bundle.nshc --window-size 390x844   # in a checkout: target\debug\nsh-windows-host
```

`--window-size` はウィンドウのサイズ(ポイント単位、`<width>x<height>`、TSX アプリ用)です。

<a id="performance-monitor"></a>

### パフォーマンスモニター

`--fps`(`nsh run App.tsx --target windows --fps`、`nsh test --target windows --fps`、ホストの `--fps`、または Rust アプリの `run_app` 内の `AppOptions { fps: true, .. }`)を指定すると、パフォーマンスモニターの計測値が 1 秒ごとにログ出力されます(ターゲット `nsh::perf`)。内容は、ディスプレイのリフレッシュレートに対して表示されたフレーム数、メインスレッドの 1 フレームあたりの時間とそのフェーズ(`tick`、`drain`、`paint`、`present`、`canvas`)、エンジンのコミット、CPU とメモリで、他のデスクトップと同じ形式(ミリ秒を mean/p50/p95/max で表記)で出力されます。`nsh test --fps -v` で表示し、`examples/gallery/tools/perf.py` で読み取ります([パフォーマンスレポート](./performance-report.md#windows-win32-direct2d))。計測にはリリースビルドを使用してください。モニターがオフの間はコストがかかりません。

<a id="packaging"></a>

## パッケージング

```sh
nsh package --target windows [--run]           # a Rust app, from its directory
nsh package App.tsx --target windows [--run]   # a TSX app
```

ディレクトリと、それを固めたアーカイブを書き出します。

```text
.nsh\out\<Name>\
  <Name>.exe             the executable, with the app's icon: a Rust app's own runner, built with its crate; nsh's release runner for TSX
  nsh\bundle.nshc         a TSX app, compiled
  nsh\assets\…           the assets it imports (a Rust crate's `assets!()` too)
  nsh\app.json           the window title, the app id, the version and the appearance
.nsh\out\<Name>.zip
```

実行ファイルは、自身の隣にある `nsh\` を見つけます。ディレクトリ全体をコピーするか(または `.zip` を展開して)、アプリを置きたい場所に配置してください。インストールは行われません。`nsh.json` のアイコンは、追加のツールなしで実行ファイルに埋め込まれます(エクスプローラーとタスクバーに表示されます)。別のシステム上でパッケージングした場合は、デフォルトのアイコンのままになります。アプリ ID は、タスクバー上でアプリのウィンドウをグループ化します。`--run` を指定すると、パッケージング後にアプリを起動します。実行ファイルは署名されません。配布するには、自分の証明書(`signtool`)で署名してください。

<a id="embedding-in-a-win32-app"></a>

## Win32 アプリへの埋め込み

NSH リポジトリの `nsh-platform-windows` クレートを使うと、Rust の Win32 アプリに `AppView` を追加できます。これは、自分のウィンドウ内の子ウィンドウで動作する 1 つの NSH エンジンです。各 `AppView` は独立しており、複数を同時に実行できます。Rust のルート、つまりクレートのルートコンポーネントを実行します。

```rust
use std::rc::Rc;
use nsh_platform_windows::{
    windows::{self, Win32::{Foundation::HWND, System::Ole::OleInitialize, UI::WindowsAndMessaging::MoveWindow}},
    set_ui_sets, AppOptions, AppView, Root,
};

/// Called on the thread that runs your message loop, with your window.
fn embed(parent: HWND) -> windows::core::Result<Rc<AppView>> {
    // Once per thread: COM and OLE (the clipboard, image decoding).
    unsafe { OleInitialize(None)? };
    // Once, before the first view: the UI sets the apps import (NSH's and your crate's).
    set_ui_sets(vec![nsh_base::registry(), my_app::registry()]);
    let view = AppView::new(
        Some(parent),
        AppOptions {
            app_id: "com.example.host".into(),
            ..AppOptions::default()
        },
    )?;
    // register native components here, before loading
    view.load(Root::of::<my_app::App>().into());
    Ok(view)
}

// On WM_SIZE of `parent`:
// unsafe { MoveWindow(view.hwnd(), 0, 0, width, height, true) };
```

`nsh build` が書き出した TSX バンドルも、同じビューに読み込めます。`asset_base` には、その `assets` ディレクトリを設定します。

```rust
let code = std::fs::read_to_string("app/bundle.js").expect("bundle");
view.load(Bundle::source(code).into());
```

ビューは子ウィンドウです。メッセージループがそれを動かし、親のサイズが変わったときは、その `hwnd()` の `MoveWindow` で配置します。ビューは、それが属するウィンドウのスレッドで作成してください。ライフサイクルは、そのウィンドウの最上位ウィンドウ(ビューの作成時に親だったもの)に従います。`AppView::load` は、それまで実行されていたものを置き換えます。`stop`(またはウィンドウの破棄)でアプリが終了します。`asset_base` は、`asset:/` URI の解決先(`AssetBase::Directory` または `AssetBase::Http`)を指定します。バイトコードバンドル(`bundle.nshc`)は `unsafe { Bundle::bytecode(bytes) }`(または、unsafe な `Bundle::read_trusted(path)`)で読み込みます。QuickJS のバイトコードは信頼された入力として扱われるため、自分のアプリのファイルからのみ読み込んでください。スタンドアロンのウィンドウは `nsh_platform_windows::run_app(source, options)` で、`AppSource::Rust(root)` または `AppSource::Bundle(bundle)` を使います。`Root::tokens` はルートに[テーマ](./rust.md#theme)を与え、`Root::app_id` はそのデータを保存する ID を与えます。

`AppOptions::cache`(または、以降に読み込むアプリ用の `AppView::set_cache`)は、アプリがキャッシュや[ダウンロードした画像](./images-and-assets.md#kept-on-disk)を保存する場所と、それぞれが保持する容量(`CacheOptions`。デフォルトはシステムのキャッシュディレクトリと、画像 256 MiB)を設定します。

`AppView::set_locale(Some(locale))` と `AppView::set_font_scale(Some(scale))` は、システムの設定の代わりに、ホストアプリの言語とテキストサイズをアプリに与えます(`None` で再びシステムの設定に従います)。`locale()`、`Intl`、`fontScale()` とテキストは、すぐに追従します([デバイスと環境](./device-and-environment.md#in-an-embedding-app))。

`AppView::set_theme_overrides(Some(json))` は、アプリの[テーマ](./tailwind.md#theme-tokens)の上にホストアプリのブランドを重ねます。`nsh.json` の `"theme"` と同じ形式のテーマファイルを使い、同名のトークンはライトモードとダークモードの両方でアプリのものより優先され、それ以外のアプリのトークンはそのまま残ります。`bg-primary` などのクラスはすぐにスタイルが変わり、後から読み込まれるアプリもこれを適用した状態で始まります(`None` でアプリ自身のテーマに戻ります。解析できないファイルはエラーになり、何も変更されません)。

ネイティブコンポーネントは `AppView::register_component` で登録します。[ネイティブコンポーネント](./native-components.md#registering-on-windows-rust)を参照してください。`set_ui_sets(sets)` は、すべてのエンジンが提供する UI セットを設定します。NSH のもの(`nsh_base::registry()`)と、あなたのクレートのもの(`my_app::registry()`、`#[native_module]` が作成します)が含まれるため、ビューが読み込む TSX は、あなたの Rust コンポーネントやモジュールもインポートできます。

<a id="what-differs-on-windows"></a>

## Windows での違い

環境はデスクトップのものです。セーフエリアとキーボードの高さは 0、`idiom()` はデスクトップ(`platform.idiom` は `"desktop"`)で、`os_version()`(`platform.version`)は `"10.0"` です(Windows 11 でも同様です。Windows はバージョン番号を据え置いたためです)。ダークモードは「設定」>「個人用設定」>「色」にリアルタイムで追従し、`fontScale()` は「テキストのサイズ」設定、モーションの軽減はアニメーション効果の設定、ロケールはユーザーの地域の形式に追従します。[デバイスと環境](./device-and-environment.md)を参照してください。

`cursor` スタイルは、マウスがビュー上で静止している間の更新にも追従します。バッチでカーソルが変更される場合、Windows はバッチ全体の後に、ポインターの下にあるビューを使って新しい形状または `"none"` を適用します。タイトルバーとリサイズ用の枠には、システムのカーソルが維持されます。

<a id="keyboard"></a>

### キーボード

| キー | 動作 |
|---|---|
| Return | `Input` では、`submitBehavior` の指定どおりに動作します。送信(`onSubmit`)、送信してフィールドから抜ける、または改行(複数行の入力)です |
| Shift+Return, Alt+Return | Return で送信する複数行入力での改行(Ctrl+Return で送信) |
| Tab, Shift+Tab | 最前面のダイアログ内で、次 / 前のテキストフィールドへ移動します。フィールドのテキストは、Windows のダイアログと同様に選択されます |
| Escape | フォーカスされているフィールドから抜けます。そうでなければテキスト選択を解除し、続いて最前面のダイアログを閉じるか、前の画面に戻ります |
| Alt+Left, ブラウザーの戻るキー, マウスの戻るボタン | 戻る(フィールド内でも有効) |
| Ctrl+矢印, Home / End, Ctrl+Home / End(Shift 併用可); Ctrl+Backspace / Delete | フィールド内で、単語単位・行単位の移動、選択、削除を行います。すべての Windows アプリと同じ動作です |
| Ctrl+Z, Ctrl+Y, Ctrl+X / C / V / A; Shift+Delete, Ctrl+Insert, Shift+Insert | 元に戻す、やり直す、切り取り、コピー、貼り付け、すべて選択(`masked` フィールドでは切り取りとコピーはできません)。Ctrl+A / Ctrl+C で、選択可能なテキストを選択・コピーします |
| 矢印; Page Up / Down, Space, Shift+Space; Home / End, Ctrl+Home / End | フォーカスされているビューの周囲、またはマウスの下にあるスクロールビューを、1 行、1 ページ、先頭 / 末尾へスクロールします(フィールドにフォーカスがある間は無効) |
| F11, Alt+F4 | フルスクリーン、ウィンドウを閉じる(`nsh package` および `nsh run` アプリ) |
| Ctrl+R, F5 | 最新のビルドをリロード(`nsh run`) |

ショートカットは、どのキーボードレイアウトでも動作します(キリル文字やギリシャ文字のレイアウトでは、US レイアウトで C を入力するキーが Ctrl+C になります)。インプットメソッドの変換(中国語、日本語など)を確定する Return では、送信されません。`onKeyPress` は React Native が報告する内容、つまり入力されたテキスト、`"Enter"`、`"Backspace"`、`"Escape"` を報告します。貼り付けられたテキストは報告されません。

アプリ独自のショートカット([`keymap`](../modules/nsh.md#keymap))は、フォーカスされているフィールドのキー、ナビゲーション、スクロールより優先されます。Alt+F4、F11、Ctrl+Q は割り当てできません。

異なる点、またはサポートされない点:

- **`WebView`**: 3D 変換(パースペクティブ)を持つビューの内側のページは表示されず、ページ上の `backdropFilter` はページをぼかしません。`baseUrl` は `http(s)` URL を受け付けます。独自のウィンドウを持つネイティブコンポーネントは、NSH が描画するすべての上に表示されたままになります。
- **動画**: インストールされているコーデックがデコードできる形式のみ。ポスターは非対応。`controls` を指定すると、コントロールバーが常に表示されます。
- **ズーム可能なスクロールビュー**(`zoomTo`、ズーム関連の props)。スクロールインジケーターはドラッグできません。
- **`mixBlendMode` と `backdropFilter`** は描画されますが、`filter` や 3D 変換を持つビューの内側では描画されません。`borderCurve: "continuous"` は円形の角を描画します。
- **テキスト**: 先頭と中間の省略記号は 1 行の場合のみ(複数行では末尾の省略記号になります)。カラー絵文字は COLR フォントのみ。スモールキャップは、フォントが対応している場合のみ。
- **テキスト入力**: キーボードの種類と自動入力は適用されません(ソフトウェアキーボードがないため)。Tab でテキストフィールド間を移動します。右クリックで編集メニュー(元に戻す、切り取り、コピー、貼り付け、削除、すべて選択)が開きます。選択可能なテキストでは(コピー、すべて選択)が開きます。
- **アクセシビリティ**(UI Automation): アラートダイアログとトーストは公開されません。見出しはレベル 1 として報告されます。
- **入力アクセサリビュー**と**ステータスバー**(デスクトップに相当するものがありません)。

<a id="see-also"></a>

## 関連項目

- [CLI](./cli.md): `nsh run --target windows`、`nsh package --target windows`
- [パッケージング](./packaging.md)
- [プラットフォーム固有のコード](./platform-specific.md)
