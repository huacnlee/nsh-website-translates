---
title: "Rustでビルドする"
description: "QuickJSをどのプラットフォームでも使わずに、Native Shellアプリをすべて Rust で記述する方法、または Rust の上に TSX 画面を重ねて記述する方法を紹介します。どちらを選ぶべきか、そして両者がコンポーネントやモジュールをどのように共有するかを説明します。"
order: 5.5
group: start
source_hash: 3b582ec92e69733e
---

# Rustでビルドする

Native Shell アプリは、Rust、TSX、またはその両方で書けます。3つとも同じエンジン上で動作します。リアクティブグラフ、レンダラー、Taffy レイアウト、ネイティブモジュール（ナビゲーション、ダイアログ、キーボード、ステータスバー）はいずれの場合も Rust で書かれており、各プラットフォームはそれぞれ独自の UI でレンダリングします。違いは自分のコードの言語であり、それに伴ってアプリが JavaScript VM を持つかどうかが変わります。

| | Rust | TSX | Rust と TSX |
|---|---|---|---|
| UI、状態、ハンドラー | Rust | QuickJS 上の TSX | Rust のコンポーネントとモジュール、それらを使う TSX の画面 |
| アプリの実行環境 | エンジンと自分のクレートのみ（全プラットフォームおよびブラウザ） | QuickJS とエンジン（ブラウザではその JavaScript エンジン） | QuickJS とエンジン、および自分のクレート（ブラウザではその JavaScript エンジン） |
| 向いている用途 | 高度なビジネスロジックを持つ中規模・大規模アプリ | 実行時に配信されるアプリやモジュール、素早い反復 | Rust のコアに、頻繁に変わる部分を持つアプリ |
| 編集 | 再ビルドして再起動 | ホットアップデート | TSX はホットアップデート、Rust は再ビルドして再起動 |
| 開始 | `nsh init my-app --template rust` | `nsh init my-app --template ts` | `nsh init my-app --template mixed` |

<a id="choosing"></a>

## 選び方

**Rust** は、ビジネスロジックが大規模で高度なアプリ（トレーディング、エディター、データ集約型ツールなど）に向いています。アプリ全体にわたって Rust の型システムとコンパイル時チェックを利用でき、crates.io のエコシステムを使え、NSH だけでなく自分のコードもネイティブの性能で動作し、`cargo test` で実際の UI をヘッドレスでテストできます。アプリは最初から最後までRustとネイティブコードで構成され、iOS、Android、macOS、Windows、Linux、GPUI、Web のいずれでも JavaScript VM は同梱されず、実行もされません。コンポーネントは一度だけ実行される関数で、TSX と同様にシグナルを表示内容にバインドします（[Reactivity](./reactivity.md)）。スタイルはクラス文字列の代わりに型付きスタイルで記述します。

**TSX** は、アプリの出荷後に届く UI に向いています。たとえば、ネイティブアプリが実行時に読み込むモジュール、モデルが生成したものや別のチームが書いたものを、[署名付きパッケージ](./signed-packages.md)として配信し、ホストが設定したサンドボックスで実行するといった用途です。開発中はホットアップデートも使えます。

**Rust と TSX** は、Rust のコアを維持しつつ、効果のある部分に TSX を加える方法です。画面、設定、オンボーディング、実験的な機能など、ホットアップデートで反復したいものや、実行時に[署名付きパッケージ](./signed-packages.md)として配信したいものが対象です。TSX は、他の NSH モジュールと同様に自分の Rust コンポーネントやモジュールをインポートするため、2つの側は型付きインターフェースで接続されます。TSX は QuickJS 上で動作するため、アプリは QuickJS を抱えることになります。

<a id="an-app-written-in-rust"></a>

## Rust で書くアプリ

```sh
nsh init my-app --template rust
cd my-app
nsh run                        # this machine's backend; --target ios, android, web, macos, linux or windows
nsh package --target web       # or ios, ios-simulator, android, macos, linux, windows
```

`src/lib.rs` がアプリ（コンポーネント、状態、ハンドラー、タスク）を保持します。

```rust
use nsh_base::{button, theme};
use nsh_core::prelude::*;

/// The components available to TSX through `app/native`.
#[native_module("app/native")]
fn native(registry: &mut Registry) {
    registry.register::<App>();
}

#[component]
pub fn App() -> impl IntoElement {
    let count = signal(0_u32);
    let quote = signal(SharedString::from("…"));
    // Async work runs in tasks; requests go through NSH's network stack.
    spawn(async move {
        if let Ok(response) = fetch("https://api.example.com/quote").await {
            quote.set(response.text().into());
        }
    });
    view()
        .flex_1()
        .items_center()
        .justify_center()
        .gap_4()
        .child(text(move || format!("Count: {}", count.get())))
        .child(text(quote))
        .child(
            // nsh_base's unstyled button, drawn with the theme's colors.
            button()
                .px(px(20.0))
                .py(px(12.0))
                .rounded(move || theme().radius)
                .bg(move || theme().primary)
                .active(|s| s.bg(move || theme().primary.opacity(0.9)))
                .on_press(move || count.update(|c| *c += 1))
                .child(text("Tap").text_color(move || theme().primary_foreground)),
        )
}
```

要素とコンポーネントは同じ方法で作ります。関数が1つを作り（`view()`、`text(..)`、`nsh_base` の `button()`、自分の `#[component] fn Chart` の `chart()`）、そのメソッドで props（prop ごとに1つのセッターで、値、シグナル、クロージャを受け取れます）とリスナー（イベントごとに1つのメソッド）を設定します。リスナーはそのイベントを受け取るクロージャで（`move |text: &str| ..`）、データのないイベントには `move || ..` を使います。`.child(..)` は、要素、または `Option`、`Vec`、配列、要素のイテレーターを受け取ります（`.child(rows.iter().map(|r| row(r)))`）。

`nsh.json` がルートを指定し、`nsh` がそれをマウントします。

```json
{
  "name": "My App",
  "rust": ".",
  "root": "App",
  "theme": "theme.json",
  "appearance": "system"
}
```

`"root"` はクレート内のコンポーネントのパスです（`App`、`shell::Gallery`。最初のものは[複数のクレート](#several-crates)の場合）。`"theme"` はそのコンポーネントが描画に使う[テーマ](#theme)で、`"appearance"` は TSX アプリと同様にそのテーマに適用されます。これがあれば、アプリのディレクトリで `nsh run` と `nsh package` を実行すると、ルートをマウントした、QuickJS をリンクしない、そのターゲット向けのアプリ専用ランナーがビルドされます。

| ターゲット | 実行されるもの |
|---|---|
| macOS、Windows、Linux | 自分のクレートを含むリリースランナーがウィンドウで動作します。`nsh run` はデバッグビルドを実行し、アプリのログをターミナルに表示します |
| iOS、iOS シミュレーター、Mac Catalyst | 自分のクレートを含む iOS ランナーがアプリとして動作します |
| Android | 自分のクレートを含むアプリの `libnsh.so` を、ランタイムのアクティビティが起動します |
| Web | エンジンと自分のクレートを含む `nsh.wasm`（Rust ギャラリー全体で 3.3 MB、brotli で 0.75 MB）。ページがルートをマウントします |

`nsh` は、自分のクレートに必要なものだけをビルドします。つまり、自分のクレートと NSH のコアからなる小さなプログラム（コンポーネントとモジュールを CLI に記述するもの。以降の処理は CLI 自身が行います）と、実行またはパッケージ化する各ターゲットのランナーです。新しい Rust アプリの最初のビルドでは、自分のクレートと NSH のコア、約 60 クレートをコンパイルします。`nsh test` は、同じ方法でビルドした自分のクレートのランナーで、アプリのテストをヘッドレスで実行します。

Linux では、クレートがオプションのプラットフォーム機能を選択します。Web ビューを使うには、`nsh-platform-linux` 依存関係で `webview` を有効にします。これは WebKitGTK 6.0 をリンクするため、アプリのビルドと実行にはそれがインストールされている必要があります。生成されたランナーは、Cargo のフィーチャー統合によってこの選択を引き継ぎます。

`nsh run` の間は、クレートの Rust コードを変更するとランナーが再ビルドされ、アプリが再起動します。ブラウザでは、開いているページが新しいランタイムを自動的に読み込みます。`cargo run` は同じルートをデスクトップバックエンド（`src/main.rs`）で直接起動します。NSH を組み込むネイティブアプリは、macOS、Windows、Linux、GPUI、iOS の `AppView` に対して `AppSource::Rust` で Rust のルートをマウントします。

Web を含むすべてのプラットフォーム向けのコードは、NSH のサービスを使います。HTTP には `fetch`（[Networking](./networking.md#from-rust-components)）、待機には `timer`、`set_timeout`、`set_interval`、時刻には `nsh_core::time::Instant` と `nsh_core::time::unix_ms()` を使います。`background` と `blocking` は、ネイティブターゲットのスレッド上で処理を実行します。

<a id="desktop-title-bars"></a>

## デスクトップのタイトルバー

Rust アプリは `nsh_core::element::desktop` で独自のタイトルバーを描画します。`set_title_bar(TitleBarStyle::Hidden, Some(height))` を呼び出し、`.window_drag(true)` でバーの背景を指定し、`title_bar()` でネイティブのウィンドウコントロールの領域を確保します。その `top` はバーの高さで、`left` と `right` はシステムコントロールが占める幅です。これを読み取ると、フルスクリーンを含む変更が購読されます。ウィンドウのドラッグとユーザーのタイトルバーのダブルクリック動作はプラットフォームが処理します。`.window_drag(false)` は、子要素を親のドラッグ領域から除外します。

```rust
use nsh_core::{
    desktop::TitleBarStyle,
    element::{desktop::{close_window, set_title_bar, title_bar}}, prelude::*,
};

fn window_bar() -> impl IntoElement {
    set_title_bar(TitleBarStyle::Hidden, Some(px(42.0)));
    view()
        .h(px(42.0))
        .flex_row()
        .items_center()
        .window_drag(true)
        .pl(move || title_bar().left + px(12.0))
        .pr(move || title_bar().right + px(12.0))
        .child(text("My app").flex_1())
        .child(text("Close").window_drag(false).on_press(close_window))
}
```

`set_title_bar(TitleBarStyle::Default, None)` はシステムのタイトルバーを復元します。`close_window()` は、組み込み先ホストの通常のウィンドウクローズ動作に従います。このモジュールには、ウィンドウに関するその他の関数（`set_title`、`minimize`、`toggle_full_screen` など）やメニュー（`set_application_menu`、`popup_menu`）もあります。詳しくは [nsh/desktop](../modules/nsh-desktop.md) を参照してください。

<a id="files-and-folders"></a>

## ファイルとフォルダー

デスクトップでは、Rust コードからシステムのファイルダイアログを表示したり、ローカルパスをシステムに渡したりできます。各応答はタスク内で待機します。`OpenDialog`（`OpenDialog::files()`、`::folders()`、`::files_and_folders()`）を伴う `pick_paths`、`SaveDialog` を伴う `pick_save_path`、`open_path`（ファイルのデフォルトアプリ）、`reveal_path`（Finder、ファイルエクスプローラー、またはファイルマネージャーで選択されたアイテム）、`move_to_trash`（macOS が返す場合、アイテムの移動先）があります。ダイアログは、ユーザーがキャンセルすると `Ok(None)` を返し、表示できない場合（ファイルチューザーポータルのない Linux、および iOS、Android、Web。Web では `open_path`、`reveal_path`、`move_to_trash` もエラーを返します）はエラーを返します。失敗したリクエストは必ずそのエラーを返し、`false` を返すことはありません。

```rust
use nsh_core::{
    file_dialog::{FileFilter, OpenDialog},
    prelude::*,
};

fn open_notes() {
    let picked = pick_paths(
        OpenDialog::files()
            .multiple(true)
            .filter(FileFilter::new("Markdown", ["md", "markdown"]))
            .button_label("Open"),
    );
    spawn(async move {
        match picked.await {
            Ok(Some(paths)) => {
                for path in paths {
                    let _ = reveal_path(path).await;
                }
            }
            Ok(None) => {} // Cancelled.
            Err(error) => log::warn!("no file dialog: {error}"),
        }
    });
}
```

<a id="extending-a-rust-app-with-tsx"></a>

## TSX で Rust アプリを拡張する

クレートの `#[native_module("app/native")]` 関数は、TSX がインポートできるものを指定します。コンポーネント（`registry.register::<Chart>()`）、関数のモジュール（`registry.module::<Portfolio>()`、ユニット構造体とその `impl` に対する `#[module]`）、クラス（`registry.class::<Ledger>()`、構造体とその `impl` に対する `#[class]`）、アセットです。この属性はクレートのルートに `pub fn registry()` も生成します。これはテストやその他の Rust コードでも同じ集合です（`nsh_base::registry()` の隣の `my_app_native::registry()`）。`#[module]` または `#[class]` の `impl` では、`pub fn` がエクスポートされます（`pub(crate)` も同様）。可視性のない関数は Rust に留まるヘルパーです。それらの TypeScript 宣言は、ドキュメントコメントを含め、Rust の型から `.nsh/types` に生成されるため、TSX は `nsh check` とエディターによって検査されます。

```rust
/// A price chart.
#[derive(Clone, PartialEq, Props)]
pub struct ChartProps {
    /// The symbol to chart.
    pub symbol: Prop<SharedString>,
    /// The range shown.
    #[prop(default = SharedString::from("1D"))]
    pub range: Prop<SharedString>,
}

#[derive(Event)]
pub enum ChartEvent {
    /// A price was selected.
    #[args(price)]
    Select(f64),
}

/// A price chart; a press selects the last price.
#[component]
pub fn Chart(props: ChartProps, cx: Scope<ChartEvent>) -> impl IntoElement {
    view()
        .h(px(160.0))
        .bg(move || theme().muted)
        .on_press(move || cx.emit(ChartEvent::Select(101.5)))
        .child(text(move || format!("{} · {}", props.symbol.get(), props.range.get())))
}

/// A ledger kept in Rust.
#[class]
pub struct Ledger {
    entries: Vec<f64>,
}

#[class]
impl Ledger {
    /// An empty ledger.
    pub fn new() -> Self {
        Ledger { entries: Vec::new() }
    }

    /// Adds `amount`; the new balance.
    pub fn add(&mut self, amount: f64) -> f64 {
        self.entries.push(amount);
        self.balance()
    }

    /// The balance.
    #[getter]
    pub fn balance(&self) -> f64 {
        self.entries.iter().sum()
    }

    /// Uploads the entries; resolves when the server has them.
    pub async fn upload(this: Instance<Ledger>, url: String) -> Result<(), String> {
        let body = this.with(|l| format!("{:?}", l.entries));
        fetch(HttpRequest::post(url, body)).await.map(|_| ())
    }
}

/// The app's holdings.
#[module]
pub struct Portfolio;

#[module]
impl Portfolio {
    /// The value of the holdings.
    pub fn total() -> f64 {
        1250.0
    }
}
```

```tsx
import { mount, signal, View, Text } from "nsh";
import { Chart, Ledger, Portfolio } from "app/native";   // Rust

const ledger = new Ledger();   // its state lives in Rust

function Overview() {
  const balance = signal(ledger.add(Portfolio.total()));   // Rust, called at once
  return (
    <View class="gap-2 p-4">
      <Text>Balance: {balance()}</Text>
      <Chart symbol="NSH" range="1M" onSelect={(e) => balance.set(ledger.add(e.price))} />
      <View onPress={() => ledger.upload("https://example.com/ledger")} role="button" class="rounded-lg bg-blue-600 px-4 py-2 active:bg-blue-700">
        <Text class="text-white">Upload</Text>
      </View>
    </View>
  );
}

mount(() => <Overview />);
```

各エクスポートは、それを指定する Rust アイテムのドキュメントコメントによって TypeScript で文書化されます。コンポーネントは `#[component] fn`（`Chart`）、モジュールとクラスはその構造体（`Portfolio`、`Ledger`）、props、イベント、関数、メンバーはそれぞれ自身のコメントです（セッターにはゲッターの隣に別のコメントは不要です）。`Props` 構造体とイベント enum 自体のドキュメントコメント、および `impl` ブロックのものは Rust に残ります。`#[module]` または `#[class]` の `impl` ブロックにドキュメントコメントを付けるとコンパイルエラーになります。TypeScript では表示されないためです。`.nsh/types` を書き出す各コマンドは、ドキュメントコメントのない、TSX から見えるエクスポートについて、その名前を挙げて警告します（`Ledger.add`、`Chart.range`）。

TypeScript はドキュメントコメントを最初の見出しまで表示します。Rust の呼び出し側向けの注記、たとえば `&self` が何を借用するか、関数がなぜ `cx` を取るかは、見出しの下に書きます。`# Rust`（または rustdoc の `# Panics`、`# Examples`）で、Rust のドキュメントにだけ残ります。

```rust
/// Puts `text` on the clipboard; resolves with the number of characters copied.
///
/// # Rust
///
/// Taking `cx` makes it an op, run in order with the UI changes TS made before it.
pub fn copy(text: String, cx: &mut ModuleCx) -> u32 {
    let count = text.chars().count() as u32;
    cx.set_clipboard(text);
    count
}
```

props はコンポーネントの `Props` 構造体のフィールド、イベントはその `Event` enum のバリアント（`onSelect`）で、どちらもキャメルケースです。Rust コードでは、同じコンポーネントを、コンストラクター、prop ごとのセッター、イベントごとのリスナーメソッドで配置します（`chart().symbol("NSH").range("1M").on_select(move |price: &f64| last.set(*price))`）。Rust コンポーネント自身のコンテンツ、イベント、状態は Rust に留まり、TSX は props を渡してイベントを受け取ります。誤った型の prop（`u32` の prop に対する `level={1.5}`）は、組み込み要素と同様に警告となり、その prop は値を保持し、コンポーネントの残りは描画されます。

関数やメンバーは、その Rust シグネチャが示すとおりに実行されます。`async` でないものは TSX の呼び出し内で実行され、その値を返します（`Portfolio.total()` は数値、`ledger.balance` はプロパティ）。計算を行い、状態を保持します。`async fn` は Promise を返し、NSH のサービス（`fetch`、`timer`、ダイアログ）を使うタスクとして実行されます。`cx: &mut ModuleCx` を取るモジュール関数は、UI と順序を保ってプラットフォーム（トースト、ステータスバー）にアクセスします。コンポーネントの ref メソッドも同様です。戻り値の型によって TSX が受け取るものが決まります。`()` を返すものは `void` になり、返信はありません（TSX は呼び出して先へ進みます）。`Result<(), E>` を返すものは `Promise<void>` になり、`Err` のメッセージで reject されます（この呼び出しは TSX の呼び出しが戻った後、UI の変更とともに実行されるため、Promise がそのエラーを運びます。誰も await も catch もしない Promise は[未処理の拒否](./dev-server-and-debugging.md#logs)としてログに記録されます）。値を返すものは `Promise<T>` になります。引数と結果はシグネチャから型付けされます。数値、文字列、`Option`、`Vec`、自分の `#[derive(JsObject)]` 構造体と `#[derive(PropEnum)]` enum、自分のクラスのインスタンス、TSX 関数（`Callback<A, R>`。Rust は呼び出し内で即座に、または `post` と `call_async` で後から呼び出します。TS では `Callback<f64>` に対して `(value: number) => void` と見え、`#[args(balance)] listener: Callback<f64>` が引数 `(balance: number) => void` を指定します）です。リスニングを開始する関数は `on(event, listener)` という名前で `Stop`（`Stop::new(|| …)`）を返し、TSX はこれをリスニングを止める関数として受け取ります（`() => void`）。これは、TSX がそれを呼び出したとき、または `on` を呼び出したもの（コンポーネント、またはホットリロード下でのモジュールの実行）が終了したときに、一度だけ実行されます。イベントのハンドラーは1つのオブジェクトを受け取ります。バリアントの値はそのフィールド `value` で、バリアント上の `#[args(price)]` がその名前を指定し（`onSelect({ price })`）、複数のフィールドを持つバリアントのフィールドは `#[args(open, reason)]` で名前を指定します。誤った型の引数は、その呼び出しで `TypeError` をスローするか、Promise を返す関数の場合はその Promise を reject します。`Err` はそのメッセージとともにスロー（または reject）されます。クラスのオブジェクトは自身の Rust の値を所有し、オブジェクトがガベージコレクションされるとき、または `ledger.dispose()`（`using ledger = new Ledger()` も同様）で即座に解放されます。TSX のエントリ `nsh run App.tsx` または `nsh package App.tsx --target …` を指定して実行します。TSX の編集はホットアップデートで、Rust の編集はアプリを再ビルドして再起動します。CLI は、クレートの説明からそのエクスポートを把握したうえで、TSX 自身をバンドルしてコンパイルします。開発ホストと `nsh test` のヘッドレスランナーは、自分のクレートと QuickJS とともにビルドされます。

リポジトリ内の `examples/rust-exports` はエクスポートのリファレンスです。これは小さな TSX アプリで、そのクレートは1つのコンポーネント（必須、デフォルト付き、オプションの props、1つのイベント、子要素）、1つのモジュール（各種類の関数を1つずつ）、1つのクラス（コンストラクター、メソッド、ゲッターとセッター、static、`async` メンバー、引数としての別のインスタンス、Rust が投稿するコールバック、`dispose()` と `using`）をエクスポートし、それぞれに短いドキュメントコメントが付いています。また、アプリを操作して各要素の表示内容を確認する Rust と TypeScript のテスト（`App.test.tsx`）も含まれます。

リポジトリ内の `examples/gallery-rs` は完全な Rust アプリです。すべてのデモが Rust で書かれており、`nsh run examples/gallery-rs
--target web` (or `ios`, `android`, …) runs its root, `nsh test examples/gallery-rs` でそのテストをヘッドレスで実行でき、`cargo run -p gallery-native` でデスクトップバックエンド上で起動します。
<a id="render-functions-and-the-apps-classes"></a>

### レンダー関数とアプリのクラス

コンポーネントは、持っている値(データの行、ドキュメントのコードブロックなど)に対するアプリ独自のコンテンツを、レンダー関数で描画します。レンダー関数は prop の `Option<Renderer<T>>`(TypeScript では `(value: T) => JSX.Element`)です。コンポーネントはコンテンツを置く位置で `render(key, value)` を呼び出し、他のビューと同じようにスタイルを設定して配置できるビュー(`text(..)` の内側、インラインビュー)を受け取ります。コンテンツは値が等しい間はキーごとに保持され、値が変わると再レンダーされます。Rust の親は prop のセッター(`quote().render_badge(|symbol| ..)`)にクロージャを渡し、セッターがそこから `Renderer` を作ります。

コンポーネント内のスタイルは型付けされています。アプリの Tailwind クラスは、クラス用の prop と、その部分の要素の `.app_class(..)` を通じて、コンポーネントの各部分に届きます。クラスは要素自身のスタイルの後に適用され、要素上の `class` と同じように、アプリのテーマ、`dark:`、各状態が反映されます。

```rust
/// A quote: its symbol, then content of the app's.
#[derive(Clone, Copy, PartialEq, Props)]
pub struct QuoteProps {
    /// The symbol.
    pub symbol: Prop<SharedString>,
    /// Tailwind classes of the symbol's text.
    pub symbol_class: Prop<Option<SharedString>>,
    /// Content of the app's after the symbol (a change, a badge).
    pub render_badge: Prop<Option<Renderer<SharedString>>>,
}

/// A quote of a symbol.
#[component]
pub fn Quote(props: QuoteProps) -> impl IntoElement {
    view()
        .flex_row()
        .items_center()
        .gap_2()
        .child(text(props.symbol).app_class(props.symbol_class))
        .child(dynamic(move || {
            props.render_badge.get().map(|r| r.render("badge", props.symbol.get()).flex_1())
        }))
}
```

```tsx
<Quote
  symbol="NSH"
  symbolClass="text-lg font-semibold"
  renderBadge={(symbol) => <Text class="text-green-600">{`${symbol} ▲ 2.4%`}</Text>}
/>
```

`nsh/base` の `TextView` はこの方法で作られています。`renderCodeBlock`、`renderMath`、... はレンダー関数で、`classes` は部分ごとのアプリのクラスです([TextView](../elements/text-view.md))。

<a id="testing"></a>

## テスト

Rust アプリのテストは、`cargo test` または `nsh test` で、同じドライバーを使ってヘッドレスで実行されます。実際のエンジン上で、ウィンドウなしに、60 Hz のディスプレイフレームで動くため、タイマー、タスク、アニメーションは画面上と同じように実行されます。ドライバーはアプリを起動し、表示されているビューのモデルを保持し、セレクター(テキスト、アクセシビリティラベル、テスト ID。`text:`、`label:`、`id:`)で指定したビューに対して操作(`press`、`type_text`、`submit`、`scroll`、`wait_for`)を行います。実行できない操作は、画面上のテキストとともに失敗します。

`cargo test` では、`nsh_testing::Headless`(nsh-testing のデフォルト機能、QuickJS なし)がルート(`app.screen()`:画面上のテキスト、送信したコマンド)を実行します。`EngineConfig::new` は、他に何も設定されていない、スマートフォンサイズのエンジンです。`nsh test` は、あなたのクレートでビルドされたヘッドレスランナーで TypeScript のテスト([Testing](./testing-and-trace.md))を実行し、その中で `open(".")` が Rust アプリのルートを起動します。

```toml
[dev-dependencies]
nsh-engine = "0.1"
nsh-testing = "0.1"
```

```rust tabs
// tests/app.rs: cargo test
use nsh_engine::{EngineConfig, Root};
use nsh_testing::Headless;

#[test]
fn a_tap_counts() {
    let mut app = Headless::start(EngineConfig::new(Root::of::<my_app::App>())).unwrap();
    app.wait_for("Count: 0").unwrap();
    app.press("Tap").unwrap();
    app.wait_for("Count: 1").unwrap();
}
```

```tsx tabs
// App.test.tsx, next to nsh.json: nsh test
import { expect, open, test } from "nsh/test";

test("a tap counts", async () => {
  const app = await open(".");
  await app.press("Tap");
  expect(app.texts()).toContain("Count: 1");
});
```

TSX エントリは、`nsh run` がビルドするのと同様に、`nsh-testing` の機能 `bundle` を有効にして、そのホストが提供する UI セット(NSH のものと、各クレートの `registry()`。`#[native_module]` が作成します)に対してビルドされます。

```toml
[dev-dependencies]
nsh-testing = { version = "0.1", features = ["bundle"] }
nsh-base = "0.1"
```

```rust
#[test]
fn the_module_formats_money() {
    let sets = vec![nsh_base::registry(), my_app_native::registry()];
    let mut app = nsh_testing::tsx("../App.tsx", sets).unwrap();
    app.wait_for("Formatted at once: $1,234.50").unwrap();
}
```

`nsh_testing::compile_tsx` は複数のテストのためにエントリを一度だけビルドし、`nsh_testing::start` は画面の独自モデルを保持するテストにバッチを渡します。`examples/rust-exports` はこの方法で TSX エントリをテストし、`examples/gallery-rs` は Rust のルートを TypeScript でテストします(デモごとにおよそ 1 つのテストファイルがあります)。

<a id="theme"></a>

## テーマ

アプリの見た目はアプリ自身のものです。NSH は `nsh_base` のプリミティブとスタイルなしのベースコンポーネントを提供し、あなたのクレートはその上のスタイル付きレイヤー、つまりアプリ独自のコンポーネントライブラリになります([Three layers](./architecture.md#three-layers))。Rust コンポーネントは、色、角丸、フォントをテーマから取得します。テーマは `nsh_base` から `theme()` されるため、1 つのファイルでアプリのすべてのコンポーネントのスタイルを変更できます。各色にはライト用とダーク用の値があり、システムが外観を切り替えると、`.bg(move || theme().primary)` のようなバインディングは、レンダーなしでネイティブに色を変更します。

テーマには [shadcn/ui](https://ui.shadcn.com/docs/theming) のデザイントークンが含まれ、デフォルトは shadcn の `neutral` テーマ(角丸 10 pt の白黒パレット)です。独自のテーマを使うには、`nsh.json` の `"theme"` に、`nsh.json` からの相対パスでテーマファイルのパスを指定するか、テーマの内容をインラインで指定します。

```json
{
  "name": "My App",
  "rust": ".",
  "theme": "brand-theme.json"
}
```

テーマファイルは shadcn の `cssVars`、つまり shadcn のテーマとレジストリアイテムの形式なので、[shadcn's themes](https://ui.shadcn.com/themes) や [tweakcn](https://tweakcn.com) からエクスポートしたテーマをそのまま使えます。`light` はライト外観の値、`dark` はダーク外観の値、`theme` は両方の値を設定します。

```json
{
  "cssVars": {
    "theme": {
      "radius": "0.5rem",
      "font-sans": "Inter, sans-serif"
    },
    "light": {
      "primary": "oklch(0.541 0.281 293.009)",
      "primary-foreground": "oklch(0.969 0.016 293.756)",
      "ring": "var(--primary)",
      "up": "#16a34a"
    },
    "dark": {
      "primary": "oklch(0.702 0.183 293.541)",
      "primary-foreground": "oklch(0.283 0.141 291.089)",
      "up": "#4ade80"
    }
  }
}
```

- テーマはデフォルトテーマの上に適用されるため、変更するものだけを記述します。`light` で設定され、`dark` に含まれない値は、両方の外観で使われます。
- 値は CSS と同じように記述します。色は任意の CSS カラー(`#7c3aed`、`rgb(…)`、`hsl(…)`、`oklch(…)`、`white`)、`color-mix(in oklab, var(--primary) 80%, white)`、または同じ外観の別のトークン `var(--primary)`(フォールバック付き:`var(--brand, #7c3aed)`)です。長さは `rem`(16 ポイント)または `px`(ポイント)です。フォントはフォントファミリーのリストで、ジェネリックでない最初のファミリーが使われ、最初のファミリーがジェネリック(`system-ui`、`sans-serif`)の場合はシステムフォントになります。
- **独自のトークン。** それ以外の名前はアプリのトークンで、Tailwind の `@theme` の変数と同じように扱われます。上の `"up"` は、Rust では `theme().color("up")`、クラスでは `bg-up` / `text-up/70`、TSX では `token("up")` です([Theme tokens](./tailwind.md#theme-tokens))。`"radius-card": "14px"` のような数値は `theme().number("radius-card")` および `rounded-(--radius-card)` です。
- バンドラーはビルド時にテーマを検査します。ファイルが見つからない、JSON が不正、または `cssVars` 以外のテーマである場合、`nsh.json: theme: …` エラーでビルドが失敗します。

デフォルトのライト値とダーク値を含むトークン一覧(shadcn の `neutral`):

| トークン | `theme()` | ライト | ダーク | 役割 |
|---|---|---|---|---|
| `background` / `foreground` | `background` / `foreground` | `oklch(1 0 0)` / `oklch(0.145 0 0)` | `oklch(0.145 0 0)` / `oklch(0.985 0 0)` | アプリの背景と、その上のテキスト |
| `card` / `card-foreground` | `card` / `card_foreground` | `oklch(1 0 0)` / `oklch(0.145 0 0)` | `oklch(0.205 0 0)` / `oklch(0.985 0 0)` | カードやグループ化された面と、その上のテキスト |
| `popover` / `popover-foreground` | `popover` / `popover_foreground` | `oklch(1 0 0)` / `oklch(0.145 0 0)` | `oklch(0.205 0 0)` / `oklch(0.985 0 0)` | ポップオーバー、メニュー、ツールチップと、その上のテキスト |
| `primary` / `primary-foreground` | `primary` / `primary_foreground` | `oklch(0.205 0 0)` / `oklch(0.985 0 0)` | `oklch(0.922 0 0)` / `oklch(0.205 0 0)` | メインのアクション(プライマリボタン)と、その上のテキスト |
| `secondary` / `secondary-foreground` | `secondary` / `secondary_foreground` | `oklch(0.97 0 0)` / `oklch(0.205 0 0)` | `oklch(0.269 0 0)` / `oklch(0.985 0 0)` | セカンダリのアクションと、その上のテキスト |
| `muted` / `muted-foreground` | `muted` / `muted_foreground` | `oklch(0.97 0 0)` / `oklch(0.556 0 0)` | `oklch(0.269 0 0)` / `oklch(0.708 0 0)` |控えめな面、補助テキスト(キャプション、ラベル、プレースホルダー) |
| `accent` / `accent-foreground` | `accent` / `accent_foreground` | `oklch(0.97 0 0)` / `oklch(0.205 0 0)` | `oklch(0.269 0 0)` / `oklch(0.985 0 0)` | ホバー中またはハイライトされた項目(メニュー項目やリスト行など)と、そのテキスト |
| `destructive` | `destructive` | `oklch(0.577 0.245 27.325)` | `oklch(0.704 0.191 22.216)` | 破壊的なアクションとエラー |
| `border` | `border` | `oklch(0.922 0 0)` | `oklch(1 0 0 / 10%)` | 区切り線と枠線 |
| `input` | `input` | `oklch(0.922 0 0)` | `oklch(1 0 0 / 15%)` | 入力欄の枠線 |
| `ring` | `ring` | `oklch(0.708 0 0)` | `oklch(0.556 0 0)` | フォーカスリング |
| `chart-1` … `chart-5` | `chart_1` … `chart_5` | `oklch(0.87 0 0)` … `oklch(0.269 0 0)` | 同じ | チャートの系列 |
| `sidebar`, `sidebar-foreground`, `sidebar-primary`, `sidebar-primary-foreground`, `sidebar-accent`, `sidebar-accent-foreground`, `sidebar-border`, `sidebar-ring` | `sidebar`, `sidebar_foreground`, ... | `sidebar` `oklch(0.985 0 0)`, `sidebar-primary` `oklch(0.205 0 0)` | `sidebar` `oklch(0.205 0 0)`, `sidebar-primary` `oklch(0.488 0.243 264.376)` | サイドバーの面、メインのアクション、ハイライトされた項目、枠線、フォーカスリング |
| `radius` | `radius` | `0.625rem`(10 pt) | | 角丸 |
| `font-sans` | `font_sans` | システムフォント | | アプリのフォント:独自のファミリーを設定しないすべてのテキスト |
| `font-mono` | `font_mono` | システムの等幅フォント | | 等幅フォント:`font-mono`、`TextView` 内のコード |

<a id="several-crates"></a>

## 複数のクレート

アプリの Rust コードは複数のクレートに分割でき、それぞれ独自のスペecifierでインポートされます。`"rust"` はクレートパスのリストを受け取り、リスト内の各クレートは独自の `#[native_module]` 関数を持ちます。

```json
{
  "rust": ["native/charts", "native/storage"],
  "root": "App"
}
```

```tsx
import { Chart } from "app/charts";        // native/charts: #[native_module("app/charts")]
import { Store } from "app/storage";       // native/storage: #[native_module("app/storage")]
```

すべてのランナーとホストがこれらをすべてリンクし、`.nsh/types` が各スペecifierを宣言します。クレート間のコードは Cargo のパス依存関係(`shared = { path = "../shared" }`)で共有します。会社共通のコンポーネントのクレートを複数のクレートで使用し、複数のアプリに載せることができ、`"rust"` に列挙されたクレートだけが TSX にエクスポートされます。列挙された各クレートは固有のパッケージ名とスペecifierを持ち、重複がある場合、`nsh` はそれを共有する 2 つのパスとともに報告します。Rust アプリの `"root"` は、列挙された最初のクレートのコンポーネントです。`nsh run` と `nsh dev` の間、これらのいずれか、またはパスで依存しているクレートに変更があると、アプリが再ビルドされて再起動されます。

<a id="browser-apis-on-the-web"></a>

## Web でのブラウザ API

Web では、クレートから wasm-bindgen と `web-sys` を通じて、ブラウザの API(WebSocket、`IndexedDB` など)を呼び出せます。`nsh` は、それらに必要なグルーコードをランタイムとともにビルドします。[Web](./web.md#browser-apis-from-rust) を参照してください。

<a id="see-also"></a>

## 関連項目

- [Project structure](./project-structure.md):`nsh.json` のすべてのキー。
- [Web](./web.md#apps-with-rust-components):ブラウザ上の Rust アプリ。
- [Networking](./networking.md#from-rust-components):Rust からの `fetch`。
- [CLI](./cli.md#nsh-init):`nsh init --template rust` と `--template mixed`。
