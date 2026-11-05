---
title: "Web"
description: "Rust または TSX で、HTML と CSS としてレンダリングされる Native Shell コンポーネントを使って Web アプリを構築し、ブラウザ上で開発して、任意の静的ホストや CDN に公開できます。"
order: 16
group: platforms
demo: counter
source_hash: 3d223070a2f7ac3d
---

# Web

Native Shell を使うと、ネイティブプラットフォームと同じコンポーネント、スタイル、アプリケーションロジックで Web アプリをビルドできます。NSH はインターフェースを HTML 要素と CSS としてレンダリングします。テキスト、画像、入力、スクロール、ビジュアルスタイル、インタラクションには、ブラウザーの DOM と Web API を使用します。

`nsh package --target web` はアプリを静的サイトとして公開し、任意の Web サーバーや CDN に配置できます([アプリを公開する](#publish-an-app))。`nsh run --target web` は編集中のアプリをブラウザーで実行します([ブラウザーで開発する](#develop-in-the-browser))。このサイトのライブデモはすべて、この Web バックエンドを使っています。

公開された TSX アプリはブラウザーの JavaScript エンジンを使用します。パッケージ化の際、各アプリには専用のランタイムがリンクされ、そのアプリがインポートする `nsh/base` コンポーネントと標準モジュールだけが含まれます。コアコンポーネントだけで構築したアプリのダウンロードサイズは約 1.1 MB です。シンタックスハイライト用のデータは、コードが最初にハイライトされるときに読み込まれます。

<a id="what-runs-where"></a>

## 何がどこで動くか

ページは CSS でスタイル付けされた HTML 要素で構成されます。NSH はコンポーネントの更新を DOM 変更のバッチに変換し、ブラウザーがインターフェースの表示、スクロール、テキスト選択、入力を処理します。WebAssembly は、コンポーネントの状態、レイアウト、更新を扱う共有の Rust エンジンをホストします。Rust アプリの場合はそのアプリのクレートがコンパイルされて組み込まれ、TSX アプリの場合はブラウザーの JavaScript エンジンと並んで動作し、そのエンジンが TSX アプリのコードを ES モジュールとして実行します。これは公開アプリ、開発サーバーのページ、このサイトのデモ、プレイグラウンドのいずれでも同じです。

ネイティブプラットフォームでは、エンジンは専用のスレッドを持ち、コミットごとに 1 つの `MountBatch` をメインスレッドに渡します。ブラウザーのページにはスレッドが 1 つしかないため、Web ビルドでは同じエンジンをページのイベントループから 1 ステップずつ駆動します(`nsh_engine::LocalEngine`)。

```text
pointer / keyboard / scroll events ─┐
setTimeout (the engine's deadline) ─┼─▶ nsh.wasm: engine turn (Rust or JS, core, layout) ─▶ one JSON batch ─▶ nsh.js: DOM
requestAnimationFrame ──────────────┘                                                 ▲
                                                          native animation outputs ───┘
```

- **レイアウトはコアが担当します。** すべてのビューは、Taffy が計算したフレームに絶対配置された要素です。そのため、flexbox、grid、`aspectRatio`、パーセント指定は、デバイス上とまったく同じように動作します。ブラウザー自身のレイアウトは関与しません。
- **スタイルは Rust で CSS に変換されます。** 背景、ボーダー、角丸、シャドウ(`boxShadow`、`textShadow`)、グラデーション、フィルター、`backdropFilter`、トランスフォーム、`transformOrigin`、`outline`、`mixBlendMode`、トランジション、組み込みのキーフレームアニメーションは CSS プロパティになります。Tailwind クラス、`active:`、`hover:` と `focus:` の状態、`dark:` はすべて、デバイス上と同様にネイティブで解決されます。
- **テキストは Rust でレイアウトされ**、ブラウザーによるフォントの計測値(`CanvasRenderingContext2D.measureText`)を使い、レイアウトが決めた位置にラン単位で描画されます。そのため、計測されたものがそのまま描画されます。行は、スペースの後、CJK 文字の前後、`\n` で折り返され、`numberOfLines` は省略記号で切り詰めます。
- **ネイティブアニメーションは Rust で実行されます**(`requestAnimationFrame` 上)。`Animated` のタイミング、スプリングとディケイ、`interpolate`、`opacity`、`translate`、`rotate`、`scale` にバインドされたアニメーション値、`transform` と `backgroundColor` のステップ、`pan` でバインドされたドラッグ、スクロール連動の値、キャンバスの引数が対象です。デバイス上と同様、フレームごとに JS が関与することはありません。`LayoutAnimation`、スタイルトランジション、`animate-*` キーフレーム、画面遷移はデスクトップバックエンドと同じように動作し、`prefers-reduced-motion` を有効にするとこれらは無効になります(画面はフェードします)。
- **入力:** `activeStyle` / `active:` フィードバック付きのプレスと長押し、レスポンダーシステム(`onTouch*`、`PanResponder`)、ネイティブのドラッグと 2 本指のピンチおよび回転、スクロールビュー(ブラウザーのスクロール)、プルして更新、ズーム可能なスクロールビュー(ピンチ、Ctrl+ホイール、タッチパッドのピンチ、`zoomTo`)、制御された値を持つ `<Input>`、フォーカスと送信、`Canvas`、`NavStack`、そしてページの `header` を使った `NavPage`、`Dialog` に対応しています。
- **システム UI はページ内に描画されます:** `AlertDialog` は、デスクトップブラウザーではデスクトップバックエンドのダイアログのように、スマートフォンでは iOS のダイアログのように表示されます(`desktop` イディオムを使用。詳細は後述)。カスタムフォントは、ブラウザーが読み込んだ後に再計測されます。また、アプリはインポートしたフォントが揃うまで待ってから最初のフレームを表示します。
- **ダイアログ**は、デスクトップバックエンドと同様に、アプリのポップアップとバックドロップを表示する、アプリ全体を覆うレイヤーです。Escape、ブラウザーの戻るボタン、バックドロップのプレスでダイアログが閉じます(`closeOnEscape`、`closeOnBackdropPress`)。`animation`、`onOpen`、`onClose`、`onCancel`、`onOpenChange` はデバイス上と同様に動作します。[アプリを埋め込む](#embed-it-in-a-page)ページがレイアウトの一部にアプリを置く場合は、iOS や Android が画面全体にダイアログを表示するのと同様に、ダイアログやアラートをブラウザーウィンドウ全体に表示することもできます(`dialogs: "viewport"`)。

<a id="keyboard-mouse-and-touch"></a>

## キーボード、マウス、タッチ

公開されたアプリは、デスクトップブラウザーではデスクトップアプリとして、スマートフォンのブラウザーではスマートフォンアプリとして動作します。

- **ホイールとタッチパッド**は、その軸方向にまだ動かせる最も内側のスクロールビューをスクロールし、スクロールが終わるまでそのビューに留まります(縦方向に動かせるものがなければ、縦ホイールで横方向のリストがスクロールされます)。ホイールのノッチは滑らかに移動し、ページングやスナップのあるビューはスクロールごとに 1 ページ移動します。Ctrl+ホイールとタッチパッドのピンチは、ページをズームする代わりに、ネイティブのピンチ値でビューをピンチします。マウスでのドラッグは、デスクトッププラットフォームと同様にスクロールしません。マウスのドラッグはパン、レスポンダーシステム、テキスト選択に渡されます。スクロールビューは、デスクトッププラットフォームと同様に `onScrollDragStart` / `onScrollDragEnd`、`onMomentumStart` / `End`、`onScrollEnd` を報告します。
- **キーボード**: Tab と Shift+Tab でプレス可能な要素と入力欄の間を移動します(アプリの `focus:` スタイルがキーボードフォーカスを示します)。Return はフォーカス中のプレス可能な要素をプレスし、Space は離したときにプレスします。矢印キー、Page Up / Page Down、Space、Home、End は、フォーカス周辺またはマウス下のスクロールビューをスクロールします。Escape はフィールドから抜け、ダイアログを閉じ、その後で戻ります。`keymap` ショートカットはブラウザーで動作し、その場で照合されます(`mod` は、Mac の Safari と Chrome では Command、それ以外では Control です)。
- **戻る操作**: Escape、Alt+Left(Mac では Cmd+[)、マウスの戻るボタンは、Android の戻るボタンと同様に、最も新しいダイアログを閉じるか、最も内側のスタックをポップします。`popOnBack` と `onBackPress` も同様に動作します。アプリがページ全体の場合、プッシュされたページや開いているダイアログはそれぞれブラウザーの履歴エントリになるため、ブラウザーの戻るボタンでアプリ内を戻れます。
- **タッチ**: パンするのはスクロールビューだけです。ページ自体がアプリの下でスクロール、ズーム、プルして更新を行うことはなく、タップに遅延もありません。iframe 内では、アプリが処理しないスワイプは埋め込み元のページをスクロールします。ネイティブのパン、ピンチ、レスポンダーシステムを持つビュー上のドラッグは、アプリが処理します。
- **アクセシビリティ**: `role`、`accessibilityLabel`、`accessibilityHint`、`accessibilityState`、`accessibilityValue`、`accessibilityLiveRegion`、`accessibilityElementsHidden` は ARIA になります。`announce` はライブリージョンを通じて読み上げられ、`setAccessibilityFocus` はフォーカスを移動します。ダイアログやアラートの下にあるビューは inert になります。
- **選択とメニュー**: デスクトップブラウザーでは、Web ページと同様に、テキストはデフォルトで選択可能です。ただし、インタラクティブな要素(プレスやタッチのハンドラーを持つビュー: ボタン、プレス可能な行、タブ)の内部と、`userSelect: "none"` または `select-none` を持つテキストは除きます。その上でマウスをドラッグすると選択され、Ctrl/Cmd+C で行ごとにコピーされ、Ctrl/Cmd+A で選択のあるテキスト全体が選択されます。スマートフォンやタブレットのブラウザーでは、ネイティブアプリと同様に、`userSelect: "text"` を持つテキストだけが選択可能です。ブラウザーのコンテキストメニューは、選択可能なテキストと入力欄にのみ表示されます。

<a id="apps-with-rust-components"></a>

## Rust コンポーネントを使うアプリ

Rust で書かれたアプリ([Rust でビルドする](./rust.md))は、そのディレクトリからブラウザー向けに公開・実行できます。

```sh
nsh package --target web           # .nsh/out/<Name>/: the app's own nsh.wasm, with its crate
nsh run --target web               # the dev server's page; editing the Rust code builds it again
```

`nsh.json` がアプリのルートコンポーネント(`"root"`)を指定している場合、ページはアプリの Rust と NSH のページスクリプトだけで構成され、それ以外は何もありません。`nsh.wasm` にエンジン、コンポーネント、アプリのクレートが含まれ、サイトに `app.js` はなく、ページはランタイムとフォントが揃い次第ルートをマウントします。Rust ギャラリー全体で 3.3 MB(gzip で 1.06 MB、brotli で 0.75 MB)となり、TSX アプリのランタイムより小さくなります。TSX エントリ(`nsh package App.tsx --target web`)の下では、同じアプリが TSX アプリと同様にブラウザーの JavaScript エンジン上で動作し、クレートのコンポーネントとモジュールをインポートします。

どちらの場合も、クレートのアセット(`assets!()`)はアプリのアセットとともに公開され、そのフォントは最初のフレームの前に読み込まれます。`nsh run --target web` 中は、クレートの Rust コードを変更するとランタイムが再ビルドされ、開いているページが自動的にそれを読み込みます。TSX の編集はこれまでどおりホットアップデートです。開発用ランタイムはインクリメンタルにビルドされるため、クレートの変更は約 1 秒で反映されます。`nsh package` は、公開用のランタイムをサイズ重視で最適化してビルドします。

Web を含むすべてのプラットフォームで動作する Rust コードは、エンジンのサービスを使います。`fetch(url).await` は、JS の `fetch` と同じネットワークスタックを通じて HTTP リクエストを行い(Web ではブラウザーのもので、CORS のルールが適用されます)、`timer`、`set_timeout`、`set_interval` は待機し、`nsh_core::time::Instant` と `nsh_core::time::unix_ms()` は時計を読み取ります。`background` と `blocking` は、ネイティブターゲットではスレッド上で処理を実行します。

ビルドには、ランタイム自体のビルドと同様に、Rust ターゲットと、WebAssembly にコンパイルできる clang が必要です。`rustup target add wasm32-unknown-unknown` に加えて `clang` と `llvm-ar` が必要です(macOS では、Homebrew の `llvm` などの LLVM ツールチェーンを、`CC_wasm32_unknown_unknown` と `AR_wasm32_unknown_unknown` を通じて使用します)。

<a id="browser-apis-from-rust"></a>

### Rust からのブラウザー API

クレートは [wasm-bindgen](https://wasm-bindgen.github.io/wasm-bindgen/) とその `web-sys` および `js-sys` クレートを通じて、`#[cfg(target_arch = "wasm32")]` のもとでブラウザー自身の API を呼び出せます。WebSocket、`IndexedDB`、クリップボード、任意の Web API、そしてクレート独自の JS(`#[wasm_bindgen(inline_js = …)]`、`module = "/js/…"`)が対象です。アプリの Web ランタイムがこの方法で JS を呼び出す場合(`JsValue` の変換を含む)、`nsh` はそれに対して `wasm-bindgen` CLI を実行し、そのグルーコードとクレートの JS を、開発時も公開サイトでもランタイムの隣に配置します。CLI のバージョンは、ランタイムがリンクする `wasm-bindgen` クレートのバージョンで、`nsh` がそれを指定します。`cargo install wasm-bindgen-cli --version <version> --locked` がそれをインストールします(`NSH_WASM_BINDGEN` は `PATH` 以外の場所にある CLI を指定します)。wasm-bindgen をリンクしていても、それを通じて JS を呼び出さないランタイム(依存クレートのデフォルト機能経由など)は、他のランタイムと同様にビルドされます。

クレートは使用する API を `web-sys` の機能として指定します。`wasm-bindgen` を固定すると、そのバージョン、ひいては CLI のバージョンがビルドごとに変わらなくなります。

```toml
[target.'cfg(target_arch = "wasm32")'.dependencies]
wasm-bindgen = "=0.2.129"
web-sys = { version = "0.3", features = ["WebSocket", "MessageEvent"] }
futures-channel = "0.3"
```

ブラウザーのコールバック(到着したメッセージ、ページのタイマー)はアプリのタスクを起こし、タスクは直ちに実行されます。

```rust
#[cfg(target_arch = "wasm32")]
async fn echo(url: &str, text: String) -> Result<String, String> {
    use wasm_bindgen::{JsCast, prelude::*};
    let ws = web_sys::WebSocket::new(url).map_err(|e| format!("{e:?}"))?;
    let (tx, rx) = futures_channel::oneshot::channel();
    let tx = std::cell::RefCell::new(Some(tx));
    let on_message = Closure::<dyn FnMut(web_sys::MessageEvent)>::new(move |e: web_sys::MessageEvent| {
        if let (Some(tx), Some(data)) = (tx.borrow_mut().take(), e.data().as_string()) {
            let _ = tx.send(data);
        }
    });
    ws.set_onmessage(Some(on_message.as_ref().unchecked_ref()));
    on_message.forget();
    let open = ws.clone();
    let on_open = Closure::<dyn FnMut()>::new(move || {
        let _ = open.send_with_str(&text);
    });
    ws.set_onopen(Some(on_open.as_ref().unchecked_ref()));
    on_open.forget();
    rx.await.map_err(|_| "closed".to_owned())
}
```

クレートによるブラウザー API の呼び出しは、他のプラットフォームでクレートのネイティブコードがアプリの権限で実行されるのと同様に、ページ自身の権限で実行されます。`nsh.json` のケイパビリティはエンジンを通るもの(`fetch`、アプリの JS)を制御し、ブラウザーのルール(CORS、ページの Content-Security-Policy)はページが行うすべてのリクエストを制御します。

<a id="publish-an-app"></a>

## アプリを公開する

```sh
# A Rust app, from its directory
nsh package --target web                   # .nsh/out/<Name>/: a static site
nsh package --target web --run             # and serve it on this machine (open the address it prints)

# A TSX app
nsh package App.tsx --target web
nsh package App.tsx --target web --run
```

`nsh package --target web` は `.nsh/out/<Name>/` を書き出します(別のディレクトリには `--out`)。構成はフロントエンドのビルドと同様で、1 つのページと、内容にちなんで名付けられたファイルからなります。

| ファイル | 内容 |
|---|---|
| `index.html` | アプリのページ。タイトルとしてのアプリ名、アイコン、`appearance` の色、読み込みインジケーター、アプリを読み込めない場合や起動できない場合のメッセージを含みます |
| `manifest.webmanifest` | ブラウザーがアプリをインストールする際の名前、ID、アイコン、色 |
| `nsh.<digest>.js` | DOM ランタイム(minify 済み、79 KB、brotli で 22.5 KB) |
| `nsh.<digest>.wasm` | Rust エンジン、レイアウト、コンポーネント、および Rust アプリ自身のクレート。TSX はブラウザーの JavaScript で動作し、パッケージ化の際には、アプリの最初の画面がインポートするコンポーネントと標準モジュールだけがリンクされます。 |
| `nsh-<name>.<digest>.wasm` | 最初の画面以外でアプリが使うコンポーネント、標準モジュール、シェーダー。アプリの表示後にバックグラウンドでダウンロードされます |
| `<file>.br`、`<file>.gz` | 事前圧縮済みの各ファイル。事前圧縮ファイルを送信するホスト向けです |
| `nsh-syntaxes.<digest>.bin` | コードのハイライトに使うシンタックス(bat のセット: 0.92 MB、brotli で 0.8 MB)。コードブロック、`Editor`、`DiffView` がある言語のコードを初めて表示するときにダウンロードされます |
| `nsh-bindgen.<digest>.js` | クレートが [Rust からのブラウザー API](#browser-apis-from-rust) を呼び出すアプリの wasm-bindgen グルーコード(minify 済み) |
| `snippets.<digest>/<crate>-<hash>/…` | グルーコードがインポートするそれらのクレートの JS(`inline_js`、`module = "/js/…"`)。パスは wasm-bindgen が付けたものです |
| `app.<digest>.js` | ES モジュールとしてコンパイルされた TSX エントリ。ブラウザーが読み込みます。 |
| `host.<digest>.js` | ページのホスト、`nsh.json` `web.host`([ホストの関数](#the-hosts-functions)) |
| `<name>.<digest>.js` | `import()` によってオンデマンドで読み込まれる ES モジュール。 |
| `assets/<path>.<digest>.<ext>` | アプリがインポートするすべてのアセット。使用時にその URL から読み込まれます(フォントは、それを使ってテキストが計測されるため、登録するコードが実行される前、つまりアプリの起動前か、それをインポートするチャンクとともに読み込まれます) |
| `icons/<size>.<digest>.png` | `nsh.json` のアイコン(32(favicon)、180(`apple-touch-icon`)、192、512 ピクセル) |

`<digest>` はファイル内容の SHA-256 の先頭部分です。ファイル名が変わるのは内容が変わったときだけなので、新しいリリースで変わるのは `index.html` と、実際に変更されたファイルだけです。すべて相対 URL を使うため、サイトはどのホストのどのディレクトリからでも動作します(`https://example.com/apps/counter/`)。
<a id="runtime-size"></a>

### ランタイムサイズ

パッケージングでは、各アプリに専用の`nsh.<digest>.wasm`をリンクします。これには、エンジンと、アプリの最初の画面がインポートする`nsh/base`コンポーネント、標準モジュール、シェーダーが含まれます。アプリのその他の画面がインポートするものは、最初の画面が表示された後にバックグラウンドでダウンロードされます。[Rust からのブラウザ API](#browser-apis-from-rust)を呼び出すクレートを持つアプリは、クレートを含むランタイム全体を`nsh.<digest>.wasm`に含みます。`nsh package --target web`で計測した値は次のとおりです(MB = 10^6 バイト)。

| アプリ | 使用するもの | `nsh.<digest>.wasm` | gzip | Brotli |
|---|---|---|---|---|
| `examples/counter` | コアコンポーネント | 3.96 MB | 1.32 MB | 0.97 MB |
| `examples/gallery` | すべてのコンポーネント、`zlib`、シェーダー | 4.13 MB | 1.36 MB | 1.01 MB |

<a id="deploy-it"></a>

### デプロイする

ディレクトリを任意の静的ホストにアップロードします。CDN の背後にあるオブジェクトストア、Cloudflare Pages、Netlify、GitHub Pages、nginx などが使えます。次の 2 つのルールで、読み込みが速く、更新が確実になります。

| ファイル | `Cache-Control` |
|---|---|
| `index.html`, `manifest.webmanifest` | `no-cache`(読み込みのたびに再検証されるため、リリースがすぐに反映されます) |
| それ以外のすべて | `public, max-age=31536000, immutable` |

`.wasm`を`application/wasm`として配信してください(ブラウザはダウンロード中にコンパイルします)。また、圧縮済みのコピーを、対応しているブラウザに送ってください。nginx の`brotli_static on; gzip_static on;`、Caddy の `file_server {
precompressed br gzip }`、または Brotli で圧縮する CDN が使えます。Brotli を使うと、ランタイムは gzip の場合より約 4 分の 1 小さくなります。`nsh package --target web --run`は、`http://127.0.0.1:4173/`でサイトをこの方法で配信しています。

Web 向けに公開したアプリは、パッケージ化されたネイティブアプリと同様に、リリースとして動作します。`nsh.json`が宣言するケーパビリティ([サンドボックスとケーパビリティ](./sandbox-and-capabilities.md))の下で、ブラウザの JavaScript エンジン上の TSX アプリとして実行されます。`network`を制限する場合、ページには宣言されたホスト(とページ自身のオリジン)を持つ Content-Security-Policy `connect-src`も付与され、ブラウザ自体がその他のホストへのリクエストとリダイレクトを拒否します。起動できなくなるエラーはページに表示され、それ以降のエラーはブラウザのコンソールに出力されます。

<a id="embed-it-with-an-iframe"></a>

### iframe で埋め込む

Web には埋め込み API がありません。公開したアプリは`<iframe>`で埋め込みます。サイズはアプリのウィンドウになります。

```html
<iframe src="https://apps.example.com/counter/" title="Counter"
        style="width: 390px; height: 844px; border: 0"></iframe>
```

<a id="develop-in-the-browser"></a>

## ブラウザで開発する

```sh
nsh run --target web               # a Rust app, from its directory
nsh run App.tsx --target web       # a TSX app
```

は開発サーバーを起動し、そのページのアドレス`http://127.0.0.1:8790/`を表示します。任意のブラウザで開いてください。このページは他と同様の開発ホストで、アプリの各ビルドを実行し、ビルドエラーとランタイムエラーをアプリの上に表示し、アプリのログをターミナルに送ります。Rust アプリのクレートを変更するとランタイムが再ビルドされ、開いているページが自動的にそれを読み込みます。TSX の編集はその場で適用されます(ホットアップデート)。同じネットワーク上のスマートフォンでは、`nsh run`がその下に表示するアドレス(`on this network: http://192.168.…:8790/`)を開きます。Web ランタイムが存在する場合(ディストリビューションでは常に)、`nsh dev`が同じページを配信します。

<a id="build-the-websites-player"></a>

## Web サイトのプレーヤーをビルドする

```sh
cargo xtask web                       # nsh.wasm, nsh.js, the player and website/demos/*.tsx
cargo xtask web --out target/play     # somewhere else
```

出力ディレクトリには次のものが入ります。

| ファイル | 内容 |
|---|---|
| `gallery/nsh.<digest>.wasm` | ギャラリーのランタイム。`nsh package`によってリンクされます(すべてのコンポーネントと`zlib`を使用し、約 11.8 MB、gzip 圧縮で 3.6 MB) |
| `gallery/nsh-syntaxes.<digest>.bin` | ランタイムがコードをハイライトするためのシンタックス。デモが ある言語のコードを初めて表示するときに取得されます |
| `nsh-playground.wasm` | 上記と同じものに NSH の TSX コンパイラを加えたもの。[プレイグラウンド](#the-playground)用です(約 8 MB、gzip 圧縮で 2.4 MB) |
| `gallery/nsh.<digest>.js` | DOM ランタイム(minify 済み)。wasm を読み込み、バッチを適用し、入力をイベントに変換します |
| `index.html` | プレーヤーページ。`#<name>`のために`demos/<name>.js`を実行します |
| `nsh.wasm`, `nsh.js`, `browser/` | プレーヤーが読み込むランタイム。エンジン、DOM ランタイム、ブラウザホストのモジュールです |
| `demos/<name>.js` | `nsh build --release`でコンパイルされた各デモ。ES モジュールです |
| `gallery/` | `nsh package --target web`で公開されたギャラリーアプリ。[Gallery](/gallery)ページに表示されます |

ディレクトリを任意の静的サーバーで配信し(ストリーミングコンパイルには`application/wasm` MIME タイプが必要です)、`index.html#counter`を開いてください。

<a id="the-playground"></a>

## プレイグラウンド

[プレイグラウンド](/playground)は、ブラウザ上でアプリを編集して実行します。ページは NSH 独自の JSX コンパイラ(`nsh-playground.wasm`に組み込まれており、rolldown は使いません)で TSX をコンパイルし、入力が止まるたびにブラウザの JavaScript エンジン上で実行します。このサイトのすべてのデモには **Edit in Playground** リンクがあり、**Share** はコードをリンク自体に含めるため、サーバーには何も保存されません。

プレイグラウンドのアプリは 1 つのモジュールです。NSH のモジュール(`nsh`と`nsh/*`)はインポートできますが、他のファイルやパッケージはインポートできません。`console.log`の出力とエラーは、スマートフォンの下に表示されます。

コンパイラは Rust の関数`nsh_bundler::compile_module(name, source, ui_sets)`としても提供されており、クレートの`bundle`フィーチャーなしで利用できます。

<a id="embed-it-in-a-page"></a>

## ページに埋め込む

Rust アプリは、公開したサイトを [iframe](#embed-it-with-an-iframe) で埋め込みます。TSX の場合、`nsh.js`は ES モジュールです。`createPlayer`はコンテナにランタイムを読み込み、`runModule(url)`は`nsh build`が書き出すバンドル(`bundle.js`、ES モジュール)を、アプリ専用のレルムでブラウザの JavaScript エンジン上で起動し、実行中のものを置き換えます。この関数は、モジュールの読み込みが完了すると解決され、停止の原因となったエラーで拒否される Promise を返します。このエラーはプレーヤーも報告します(`onError`)。

```js
import { createPlayer } from "./nsh.js";

const player = await createPlayer(document.querySelector("#phone"), {
  wasm: "./nsh.wasm",
  assetBase: "./assets/",   // where `asset:/…` URIs (image imports) are served from
  // dark: true,            // force an appearance; otherwise it follows the system
  // idiom: "phone",        // force "phone", "pad" or "desktop"; otherwise the pointer and the size decide
  // history: false,        // pages and dialogs as browser history entries; by default only when the app is the page, not in an iframe
  // dialogs: "viewport",   // Dialog, Sheet and AlertDialog over the whole browser window; by default over the container
});
await player.runModule(new URL("./bundle.js", location.href).href);
```

`assets`(`asset:/`のパスから URL へのマップ)は`assetBase`の代わりになります。`readAsset(uri)`は、エンジンがすぐに必要とするアセット(フォント)のバイト列、または`null`を返します。`data`は、ランタイムが初めて必要とするときに取得するファイルを URL に対応付けます(`syntaxes`: `nsh-syntaxes.<digest>.bin`。デフォルトでは`nsh.js`の隣の`nsh-<name>.bin`)。`glue`は、クレートが[Rust からのブラウザ API](#browser-apis-from-rust)(`nsh-bindgen.<digest>.js`)を呼び出すランタイムの wasm-bindgen グルーの URL で、プレーヤーがランタイムとともに読み込みます。`player.runModule(url, { capabilities, appId })`は、アプリが宣言したケーパビリティ(その`capabilities.json`)の下でアプリを実行し、ストレージを`nsh.json` id の下に保持します(id がない場合はページのパスの下)。`nsh package --target web`が書き出すページは、これらすべてを使用します。

`runModule(url, { chunks })`は、[分割バンドル](#split-bundles)のチャンクの場所も受け取ります。

`player.runSource(code, { name, sourceMap, capabilities, appId })`は、ソーステキストとして渡された ES モジュールを、同じオプションで実行します。`nsh-playground.wasm`を指定すると、`player.compileAndRun(tsx, name, options)`はまず TSX をコンパイルし、`runSource`のオプションで実行して、コンパイルエラー、または`null`に解決されます。`player.compile(tsx)`は`{ code }`または`{ error }`を返します。

コンテナのサイズがアプリのウィンドウ(`windowSize()`)になり、コンテナをリサイズするとアプリもリサイズされます。`player.setDark(true)`は実行時に外観を切り替え、アプリは`colorScheme()`と`dark:`クラスを通じてこれを観測します。

ダイアログとアラートはコンテナを覆います。`dialogs: "viewport"`を指定すると、ページ自身のモーダルダイアログと同様にブラウザウィンドウ全体を覆い、アプリはコンテナをウィンドウとして保ちます。`Dialog`はウィンドウのサイズとセーフエリアでレイアウトされて下端からスライドインし、バックドロップはページ全体を覆い、その上でマウスホイールを操作してもページはスクロールしません。ダイアログはブラウザのトップレイヤー(Chrome 114、Safari 17、Firefox 125 以降)に表示されるため、コンテナがどこにあってもページの他の部分より上に表示されます。それ以前のブラウザではコンテナを覆います。

`Sheet`は、`Dialog`や`AlertDialog`と同じプレゼンテーション設定に従います。同一オリジンの iframe では、ビューポートプレゼンテーションが自動的に外側のページを覆い、アプリは元のレイアウトサイズを保ちます。最後のポップアップが閉じると、iframe は元の位置とサイズに戻ります。エンジンと状態は維持されます。ドキュメントのデモではこのプレゼンテーションが有効になっています。

クロスオリジンまたはサンドボックス化された iframe では、埋め込み側のページがプレーヤーを読み込む前にホストを登録します。

```js
import { hostPlayerFrame } from "./nsh.js";
const frame = document.querySelector("iframe");
const disconnect = hostPlayerFrame(frame);
frame.src = "https://apps.example.com/player.html"; // player uses dialogs: "viewport"
// When removing the embedding: disconnect();
```

ホストはこの iframe のウィンドウからのリクエストを受け付け、ポップアップが表示されている間は周囲のページを非アクティブにしてスクロールをロックし、閉じると両方を元に戻します。クロスオリジンの埋め込み境界ごとに、そのホストの協力が必要です。協力がない場合、プレゼンテーションはそのドキュメント内にとどまり、プレーヤーは警告を報告します。

<a id="the-hosts-functions"></a>

## ホストの関数

Web ではページがアプリのホストになります。ページは [`host`](../modules/nsh.md#host)の`host.call(name, args)`に応答し、`host.on`が待ち受けるイベントを送ります。`createPlayer`の`host`は、`call(name, args)`が結果またはその Promise を返すオブジェクトです。throw または reject はアプリの呼び出しをエラーのメッセージとともに拒否します。`player.hostEvent(event, payload)`は JSON ペイロードを持つイベントを送ります(JSON でないペイロードは throw されます)。`host`を指定すると、`host.available()`は`true`になります。

```js
const player = await createPlayer(container, {
  wasm: "./nsh.wasm",
  host: {
    async call(name, args) {
      if (name === "user.info") return { name: "Ada" };
      throw new Error(`no host function ${name}`);
    },
  },
});
player.hostEvent("theme", { dark: true });
```

公開されたアプリは、`nsh.json`からホストを取得します。`web.host`は、アプリのディレクトリ内にある JS モジュールを`nsh.json`からの相対パスで指定し、そのモジュールは`createHost(player)`をエクスポートします。`nsh package --target web`はそれを`host.<digest>.js`としてサイトにコピーし、ページはアプリの起動前にプレーヤーとともに`createHost`を実行します。その戻り値(または解決値)には`call`関数が必要で、なければページはアプリを読み込めなかったことを表示します。以降、プレーヤーの`createHost`が受け取るイベントを送信します。

```json
{
  "capabilities": {
    "host": ["user.*"]
  },
  "web": { "host": "./host.js", "connect": ["api.example.com"] }
}
```

```js
// host.js
const post = (url) => (args) =>
  fetch(url, { method: "POST", body: JSON.stringify(args) }).then((r) => r.json());

// The functions the app may call, by their exact names.
const functions = new Map([
  ["user.info", post("https://api.example.com/user/info")],
  ["user.settings", post("https://api.example.com/user/settings")],
]);

export async function createHost(player) {
  addEventListener("online", () => player.hostEvent("online", {}));
  return {
    call(name, args) {
      const f = functions.get(name);
      if (!f) throw new Error(`no host function ${name}`);
      return f(args);
    },
  };
}
```

ホストは、上記のように関数のテーブルから各名前をそのまま検索し、URL とパスはホスト自身の管理下に置きます。`capabilities.host`は名前を先頭部分で許可する(`user.*`)ため、ホストが名前をパスに変換すると、許可の対象外のものにも到達できてしまいます。ランタイムは、`A`–`Z`、`a`–`z`、`0`–`9`、`_`、`.`、`:`、`-`からなる 1 〜 128 文字の名前(`..`を含まないもの)を通し、それ以外の名前の呼び出しは拒否します。プレフィックスによる許可は区切り文字(`bridge.*`)で終わります。`bridge*`は`bridgeAdmin`にも一致します。

アプリが実行される前に送られたイベント(`createHost`自身からのものなど)は、アプリの起動と同時に順番どおり配信されるため、アプリのトップレベルの`host.on`リスナーがそれらを受け取ります。リスナーが登録される前に送られたイベントは、そのリスナーには再送されません。アプリは、開始時の状態を呼び出し(`host.call("user.info")`)で読み取り、その変化をイベントで追跡します。

ホストモジュールはアプリのページ内で実行され、その Content-Security-Policy を共有します。アプリのケーパビリティが`network`を制限する場合、ページの`connect-src`には、ページのオリジン、`capabilities.network`が列挙するホスト、`web.connect`が列挙するホストが含まれます。`web.connect`は、ホストモジュール自身のリクエスト(`fetch`、`XMLHttpRequest`、`WebSocket`)が到達するホストを、`capabilities.network.hosts`(`api.example.com`、`*.example.com`、`"*"`)と同様のパターンで指定します。`api.example.com`は上記のとおりです。アプリ自身のリクエストは、引き続き`capabilities`に対して検査されます。

モジュールはそのままコピーされるため、他のコードは絶対 URL でインポートします。アプリは、呼び出す関数ごとに`host`の[ケーパビリティ](./sandbox-and-capabilities.md)を必要とします。`nsh run --target web`は開発ページでそれを実行し、`nsh test`は、テストが開くすべてのアプリ(ヘッドレスまたはブラウザ上、`--target web`)で同じモジュールを実行するため、アプリとそのホストは一緒にテストされます([テスト](./testing-and-trace.md#the-pages-host))。

<a id="the-browser-as-a-platform"></a>

## プラットフォームとしてのブラウザ

`platform.os`は`"web"`です。ブラウザがどのような種類のデバイス上にあるかによって、`platform.idiom`のとおり、アプリの動作が決まります。

- `"desktop"`: マウス(ホバーできるファインポインタ)があり、コンテナの幅が 600 ポイント以上の場合。`platform.desktop`は`true`で、`platform.select`は`desktop`を選択し、`desktop={{…}}`プロパティが適用されます。
- `"pad"`: 短辺が 600 ポイント以上のタッチスクリーン。それ以外は`"phone"`です。これらはモバイルで、`platform.select`は`mobile`を選択します。

イディオムはアプリの起動時に決まり、他のプラットフォームと同様に、実行中は変わりません。幅の狭いデスクトップウィンドウでも、それはデスクトップであり、`windowSize()`向けにレイアウトされます。`web={{…}}`プロパティ、`platform.select({ web })`クラス、`web:`クラスはブラウザでのみ適用され、`ios={{…}}`、`native`、`ios:`はそこでは適用されません。

ページはそれ以外の環境も報告し、最新の状態に保ちます。

| 値 | ブラウザからの取得元 |
|---|---|
| ロケール(`Intl`のデフォルト) | `navigator.languages[0]` |
| タイムゾーン(`Date`のローカル時刻、`Intl`のデフォルトの`timeZone`) | ブラウザのもの(`Intl.DateTimeFormat().resolvedOptions().timeZone`)。夏時間を含みます |
| レイアウト方向(`rtl:` / `ltr:`) | 設定されていれば`<html dir>`、なければロケールのスクリプト |
| `reduceMotion()` | `prefers-reduced-motion` |
| `fontScale()` | ルート要素のフォントサイズ / 16 px(ブラウザのテキストサイズ設定) |
| `pixelRatio()` | `devicePixelRatio`(ズームや画面によって変わります) |
| `colorScheme()` | `prefers-color-scheme` |
| `safeArea()` | コンテナと重なる部分の`env(safe-area-inset-*)`(スマートフォンでは`viewport-fit=cover`ページ) |
| `keyboardFrame()` | オンスクリーンキーボードがコンテナを覆っている量(`visualViewport`) |

`platform.version`は`"0.0"`で、`screenReaderEnabled()`は`false`のままです(ブラウザは通知しません)。ページの周囲にあるブラウザのバーはブラウザのものです。ページの[`statusBar`](../modules/nsh-base.md#status-bar)はスマートフォン向けです。
<a id="networking"></a>

## ネットワーク

`fetch`(ストリーム、`AbortController`、`FormData`を含む)と`<Image>`のURLは、NSH がアプリの[ケイパビリティ](./sandbox-and-capabilities.md)を確認した後、ブラウザー自身のネットワークスタックを通ります。リクエストはブラウザーのものなので、ブラウザーのルールが適用されます。

- **相対URL**は、ブラウザーと同様にページのURLを基準に解決されます。公開されたアプリは`fetch("/api/items")`で自身のAPIにアクセスでき、`<Image src="/photos/a.jpg" />`は自身のサーバーから読み込まれます。(ネイティブプラットフォームにはページがないため、絶対URLが必要です。)
- **CORS。** ページとは別のオリジンへのリクエストは、そのサーバーがページのオリジンを許可している場合(`Access-Control-Allow-Origin`)にのみ成功します。許可されていない場合、`fetch`はネットワークエラーで reject されます。見えるのは、サーバーが公開しているレスポンスヘッダーのみです。
- **Cookie**(および HTTP 認証)は、ページ自身のオリジンにのみ送信され(`credentials: "same-origin"`)、ブラウザーが禁止しているヘッダー(`Cookie`、`User-Agent`、`Host`など)は破棄されます。
- **リダイレクト**はブラウザーが追跡します。リダイレクトを追跡してはならないリクエストは失敗します。対象は`redirect: "manual"`と`"error"`、および`network`を制限するケイパビリティを持つアプリのリクエストです(NSH はすべてのホップを確認しますが、ブラウザーはリダイレクトを追跡する前にそれを知らせません)。
- `ReadableStream`である**リクエストボディ**は、先にすべて収集されてから一括で送信されます。レスポンスボディは到着するたびにストリーミングされます。

<a id="split-bundles"></a>

## バンドルの分割

TSX の Web アプリは、最初の画面を表示する前にすべてのコードをダウンロードする必要はありません(Rust アプリは1つの`nsh.wasm`で、ダウンロードしながらブラウザーがコンパイルします)。`nsh package --target web`は TSX アプリを分割して公開し、各チャンクを`<name>.<digest>.js`とし、ページがチャンクとそれらのファイルの対応を管理します。バンドルを自分で分割するには、`nsh build --split`が、`import()`が読み込むモジュールを、`bundle.js`の隣に独立したチャンクとして配置します。

```sh
nsh build --release --split -o site/app
# bundle.js        the app up to its first screen
# Screen.js        import("./Screen") and what only it uses
# detail.js        what two chunks share, when they do (made by the bundler)
```

最初の`import("./Screen")`は、`Screen.js`とそれがインポートするチャンクをすべて同時にダウンロードしてから評価します。以降のそのインポートは即座に解決されます。チャンクの場所はページが指定します。デフォルトではバンドルの隣ですが、CDN が永続的にキャッシュできるよう、コンテンツダイジェスト付きにリネームしたファイルに対して、チャンクごとに1つのURLを指定することもできます。

```js
await player.runModule(entry, {
  chunks: { "Screen.js": "/app.3f2a9c.js", "detail.js": "/app.81bb07.js" },
});
```

ダウンロードできなかったチャンクは、そのチャンクを示す`TypeError`とともに`import()`を reject します。次の`import()`は再試行します。チャンク名はバンドルで固定されたファイル名であり、アプリがページに任意の他のものをダウンロードさせることはできません。

[ギャラリー](/gallery)は、各デモをこの方法で読み込みます。`lazy`(`examples/gallery/ui.tsx`内)は、初めてレンダリングされたときにインポートを開始するコンポーネントを作成し、解決されるまでプレースホルダーを表示し、その後、読み込んだものをレンダリングします。最初の読み込みはインデックスと最初に表示されるデモで、デモがインポートするフォントはそのデモのチャンクに含まれます。ネイティブビルドはすべてのモジュールを保持しているため、そこではインポートは即座に解決されます。

```tsx
const Stocks = lazy(() => import("./demos/Stocks").then((m) => m.Stocks));
```

<a id="limits"></a>

## 制限事項

これらはブラウザーが決定するもので、Web バックエンドはそれに従います。

- **他サイトの Web ビュー**: `WebView`は`<iframe>`です。インライン HTML(`html`)ではすべてが使えます。`onMessage`、`postMessage`、`injectJavaScript`、注入されたスクリプトとロードイベントです(独自のオリジンで実行され、ページからは分離されます)。他サイトのページでは、`postMessage`と、指定された URL を持つロードイベントのみが使えます。ブラウザーは、そのナビゲーション、タイトル、履歴、エラーを周囲のページから隠すため、`userAgent`は設定できません。
- **自動で始まる音声付きビデオ**: `Video`はすべての props とイベントを備えた`<video>`ですが、ブラウザーは、ユーザー操作の後でなければ音声付きビデオを開始しません(ミュートされたビデオは再生されます)。
- **ネイティブコンポーネント**: 登録されたネイティブコンポーネントは、NSH を組み込むネイティブアプリに属します。Web ではそのビューは空のままで、コンソールに警告が表示されます。
- **プラットフォームサービス**: クリップボードの読み取り(`Clipboard.readText`、`hasText`も同様)にはセキュアコンテキスト(HTTPS)が必要で、ユーザーへの確認が表示される場合があります。画像は`onProgress`を報告しません。
- **テキストシェイピングの詳細**: 行分割は UAX #14 のサブセットです(スペース、CJK、ハイフン、および CJK 句読点の行頭・行末禁則。`。`、`，`、`」`などの閉じ記号は行頭に来ず、`（`や`「`などの開き記号は行末に来ません)。ハイフネーションはなく、段落方向を超える双方向の並べ替えもありません。

プレーヤーと開発サーバーは、開発用の設定でアプリを実行します。公開されたアプリはリリースとして実行されます。どちらも、TSX アプリのコードをブラウザーの JavaScript エンジン上で、アプリ専用のレルム内で実行します。

<a id="see-also"></a>

## 関連項目

- [Packaging](./packaging.md): `nsh package`のその他のターゲット。
- [Architecture](./architecture.md): Web ビルドが再利用するエンジン、コア、マウントバッチ。
- [Testing](./testing-and-trace.md): `nsh test`は、近似的なテキストエンジンを使い、同じエンジンをヘッドレスで実行します。
