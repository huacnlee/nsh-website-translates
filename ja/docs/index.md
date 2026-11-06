---
title: "はじめに"
description: "Native Shell とは何か:iOS、Android、macOS、Windows、Linux、Web 向けの、Rust ファーストなネイティブ UI フレームワークです。各プラットフォーム固有の UI とインタラクションをそのまま活かせます。"
order: 1
group: start
source_hash: cdf8a9726ec2ef7b
---

# はじめに

Native Shell(略称 NSH)は、あらゆるプラットフォーム向けのネイティブ UI フレームワークです。アプリは、コンポーネント、シグナル、スタイル、そしてどこでも同じ API という、1 つのアプリモデルで一度作るだけです。NSH はそれを **iOS、Android、macOS、Windows、Linux、web** で実行します。どの環境でも、そのプラットフォームのアプリとして動きます。プラットフォーム固有のビューで構成され、固有のテキストシステムで編集でき、ユーザーが期待する操作感で使えます。アプリ全体を **Rust** で書くことも、画面を **TSX** で書くことも、同じエンジン上で両方を組み合わせることもできます。同じエンジンの上で、すでにリリースしたアプリは、チームが書いた UI でもモデルが生成した UI でも、署名付きモジュールとして実行時に受け取れます。モジュールは、ホストが構成するサンドボックス内で動作します。

> [!IMPORTANT]
> NSH はネイティブのビューとインタラクションを提供し、ビジュアルデザインはアプリが担います。コンポーネント、状態、API はプラットフォーム間で共通ですが、色、タイポグラフィ、余白、形状はアプリが決めます。テキスト入力、フォーカス、メニューは、各デバイスのインタラクション規約に従います。詳しくは [目標と設計原則](./goals.md) を参照してください。

<a id="what-native-means"></a>

## ネイティブとは

NSH におけるネイティブには 2 つの層があります。プラットフォームの基盤と、プラットフォームのインタラクションです。

**プラットフォームの基盤。** 各プラットフォームには専用のバックエンドがあり、そのプラットフォームがすでに持っている UI の上に構築されています。

| プラットフォーム | ビュー | テキスト | テキスト入力 |
|---|---|---|---|
| iOS | UIKit | CoreText | システムのテキストフィールドとテキストビュー |
| Android | Android views | `StaticLayout` | `EditText` |
| macOS | AppKit、Core Animation | CoreText | `NSTextField`、`NSTextView` |
| Windows | Direct2D で描画する Win32 ウィンドウ | DirectWrite | NSH のエディタとシステムの入力メソッド(IMM32) |
| Linux | GTK 4 | Pango | GTK の `Text` と `TextView` |
| Web | CSS でスタイルを付けた HTML 要素 | ブラウザのフォント | ブラウザの入力 |

テキスト選択とそのメニュー、入力メソッド、アクセシビリティ、スクロールはプラットフォームが提供します。新しい OS リリースがこれらにもたらす変更は、そのままアプリにも反映されます。ネイティブコンポーネント(マップ、web view、動画プレーヤー、ホストが登録した任意のビュー)も、同じ階層内のビューの 1 つであり、ほかのビューと同様にレイアウト、クリップ、スクロールされます([Native components](./native-components.md))。

**プラットフォームのインタラクション。** NSH が [`nsh/base`](../modules/nsh-base.md) で提供するコンポーネントは、各デバイスのユーザーが期待するとおりに動作するため、アプリ側は一度書くだけで済みます。

| | デスクトップ(およびデスクトップのブラウザ) | スマートフォンとタブレット |
|---|---|---|
| `Menu` | トリガーの位置にポップアップが開き、サブメニューは項目の横にカスケード表示される | 下からシートが現れ、サブメニューはメニューの項目を置き換える |
| `ContextMenu` | 右クリックでポインターの位置に開く | トリガーを指で長押しすると、シートとして開く |
| `Tooltip` | ポインターがトリガー上に留まると表示される | アプリが開いたときに表示される |
| `Popover` | 外側を押すと閉じ、ポインターの下にあるものにも押下が届く | 外側を押すと閉じる |

ページ、ダイアログ、キーボード、ステータスバーも同じ考え方です。ナビゲーションスタックは各プラットフォームのモーションで push と pop を行い、戻るボタン、Escape、スワイプバックはそれぞれのプラットフォームでの動作どおりに働きます([Navigation](./navigation.md))。

<a id="from-phone-to-desktop-to-web"></a>

## スマートフォンからデスクトップ、webまで

NSH におけるクロスプラットフォームとは、同じ画面を拡大縮小して使い回すことではなく、各デバイスが期待するアプリを届けることです。

- **1 つのアプリモデル。** アプリのコンポーネント、状態、ビジネスロジック、画面は共有され、各バックエンドがそれらをそれぞれのプラットフォームにマッピングします。
- **形を変えるレイアウト。** Flexbox と CSS grid は、すべてのプラットフォームで [Taffy](https://github.com/DioxusLabs/taffy) がレイアウトします。Tailwind のブレークポイント(`md:`、`lg:`)とウィンドウのサイズ(Rust では `window()`)は、大きさだけでなく構造を変えます。たとえばチャットアプリは、広いウィンドウではサイドバー、会話、メッセージを並べて表示し、スマートフォンでは一度に 1 画面ずつ表示します([Layout](./layout.md)、[Tailwind](./tailwind.md))。
- **各デバイスが期待する入力。** デスクトップではポインター、ホバー、右クリック、ショートカット、フォーカス、スマートフォンではタッチ、ジェスチャー、ソフトウェアキーボード、ページナビゲーションに対応します。プラットフォームごとに独自の動作をさせたい場合は、`desktop={{…}}` props と `platform.select` で指定します([Platform-specific code](./platform-specific.md))。
- **すべてのターゲットで検証。** `nsh test` はアプリのテストをヘッドレスで実行できます。同じテストを、macOS、Windows、Linux、GPUI のウィンドウ、iOS シミュレーター、Android デバイス、ブラウザ上でも、そのプラットフォーム自身の入力で実行できます([Testing and tracing](./testing-and-trace.md))。

チャットクライアントのようなアプリを例に取りましょう。開発者はデスクトップで `nsh run` を使って構築し、スマートフォンのレイアウトを確認するために `nsh run --target ios` で iOS シミュレーターに開き、次に `nsh run --target web` でブラウザに開きます。毎回同じプロジェクトで、`nsh package` がインストール可能なアプリと web サイトを生成します。以前はプラットフォームごとにチームが必要だった作業を 1 人のエンジニアが担えるので、その間にバックエンドを並行して構築できます。

<a id="rust-first"></a>

## Rust ファースト

NSH は Rust で作られており、Rust はアプリを書くための第一級の言語です。

- **アプリ全体を Rust で。** UI、ロジック、コンポーネントはすべて Rust で、あらゆるプラットフォームでネイティブコードにコンパイルされます。Rust の所有権、型、スレッド、crates.io エコシステムをそのまま使えます。計算はネイティブの速度で実行され、大規模なデータ、パース、システム処理は、それに最も適した言語にとどまります([Building with Rust](./rust.md))。
- **2 つ目の道としての TSX。** TSX は、素早く書く画面、プラグイン、小さなアプリ、実行時に配信される UI に適しています。Rust と同じエンジン上で、同じプリミティブ、基本コンポーネント、シグナルを使って動作します。
- **両方を一緒に。** Rust アプリは TSX の画面を取り込め、TSX の画面はアプリの Rust コンポーネント、モジュール、クラスをインポートできます。
- **1 つのツールチェーン。** 単一の `nsh` 実行ファイルが、すべてのターゲット向けに、アプリの作成、ビルド、型チェック、ホットリロード付きの実行、テスト、パッケージ化、署名を行います。TSX のバンドラーと TypeScript のチェッカーも内蔵しているため、Rust、Swift、Kotlin、C++ の経験者は、Rust と `nsh` をインストールすればすぐに作業を始められます([Installation](./installation.md)、[CLI](./cli.md))。

<a id="an-app"></a>

## アプリの例

同じカウンターを、Rust と TSX で示します。

```rust tabs
use nsh_core::prelude::*;

#[component]
pub fn Counter() -> impl IntoElement {
    let count = signal(0);
    view()
        .flex_1()
        .items_center()
        .justify_center()
        .gap_3()
        .child(text(move || count.get().to_string()).text_5xl().font_weight(FontWeight::BOLD))
        .child(
            view()
                .rounded_lg()
                .bg(rgb(0x2563eb))
                .px_5()
                .py_3()
                .active(|s| s.opacity(0.6))
                .on_press(move || count.update(|n| *n += 1))
                .child(text("Tap").text_lg().text_color(white())),
        )
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";

function Counter() {
  const count = signal(0);
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12 }}>
      <Text style={{ fontSize: 48, fontWeight: "700" }}>{count()}</Text>
      <View
        onPress={() => count.update((n) => n + 1)}
        activeStyle={{ opacity: 0.6 }}
        class="rounded-lg bg-blue-600 px-5 py-3"
      >
        <Text class="text-white text-lg">Tap</Text>
      </View>
    </View>
  );
}

mount(Counter);
```

ビュー(`view()`、`<View>`)は、iOS では `UIView`、Android では `ViewGroup`、macOS では `NSView`、Linux では GTK ウィジェット、Windows では Direct2D で描画される retained view、web では HTML 要素になります。テキストはネイティブのテキストビューになり、ボタンの押下フィードバック(`.active(..)`、`activeStyle`)はメインスレッドで実行されます。タップすると `count.update` が 1 つのシグナルを変更し、それを読み取っているテキストだけが更新されます。コンポーネント関数は再実行されません。Rust アプリは最初から最後までネイティブコードです。TSX アプリで JavaScript になるのは、モジュール自身のコードだけです。

<a id="retained-views"></a>

## Retained ビュー

NSH は retained 方式です。すべての要素はプラットフォームが保持するビューであり、更新では変更された部分だけが変わります。

- **きめ細かな更新。** Solid のような [シグナル](./reactivity.md) をネイティブに実装しています。コンポーネントは一度だけ実行され、変更があると、変更されたシグナルを読み取っている式だけが再実行されます。
- **変更分だけがスレッドをまたぐ。** 1 ターンの変更はまとめてレイアウトされ、フレームごとに 1 つのビュー操作バッチとしてメインスレッドに渡されます。変更のないスタイルやフレームは送られず、何も触れられていないビューはそのまま残ります。
- **アニメーションはネイティブで動作。** timing、spring、decay の各アニメーション、ジェスチャー、スクロール連動の値は、フレームごとに JS を呼び出すことなく、プラットフォームのフレームクロック上で評価されます([Animation](./animation.md))。

これは、チャット、メール、フォーム、リスト、ドキュメント、設定、ストリーミングで届く AI の返信など、多くのアプリを構成する画面に適しています。こうした画面では、一度に変化するビューは少数で、残りは待機しています。更新の合間はほぼアイドル状態で、スクロールやアニメーションは ProMotion ディスプレイで 120 FPS を維持します。[NSH performance benchmark](https://github.com/longbridge/nsh-perf-bench) では、500 行の相場表を毎秒 1,000 回更新した場合の CPU 使用率は、Linux 上で NSH Rust が 1 コアの 18% でした。同じ画面を [GPUI Fast](https://github.com/longbridge/gpui-fast) で直接書いた場合は 20% です。重い計算は Rust に任せるべきです。TSX はインタプリタである QuickJS で動作しますが、Rust モジュールは TSX から呼び出してもネイティブの速度で動作します。10 万行のソートは、素の Rust と同様に約 3 ms で完了します([Performance](./performance.md))。

<a id="how-it-runs"></a>

## 実行の仕組み

ツールチェーンは単一の `nsh` バイナリです。アプリは Rust、TSX、またはその両方で書かれ、それぞれが独自の経路で同じ Rust エンジンに到達します。

<a id="rust-apps"></a>

### Rust アプリ

Rust アプリは crate であり、JavaScript ランタイムを使わず、Rust と Native だけでビルドされます。

1. **ビルド。** `nsh` が、あなたの crate をリンクした各ターゲット(iOS、Android、macOS、Windows、Linux、web のアプリ)のランナーをビルドします。コンポーネント、状態、ハンドラー、エンジンは、まとめてネイティブコードにコンパイルされます。
2. **実行。** アプリのルートコンポーネントは、エンジンスレッド上で Rust として実行されます。ランナーには JavaScript エンジンがなく、どのプラットフォームでも QuickJS は Rust アプリの一部ではありません。

<a id="tsx-apps"></a>

### TSX アプリ

TSX アプリ(モジュール)は、エントリー(通常は `App.tsx`)を持つ `.tsx` / `.ts` ファイルの集まりです。

1. **ビルド。** `nsh` がモジュールのファイルを(rolldown と Oxc で)バンドルし、JSX を独自のコンパイラーでコンパイルします。`nsh` と `nsh/*` のインポートはインポートのまま残ります。ランタイムがそれらをネイティブに提供するため、バンドルにはあなたのコードだけが含まれます。バンドルは QuickJS バイトコードにコンパイルされます。
2. **実行。** エンジンスレッドは、バイトコードを [QuickJS](https://github.com/quickjs-ng/quickjs) で、ビューごとに 1 つの VM で実行します。コンパイル済みの JSX はネイティブレンダラーを直接呼び出し、JavaScript は UI の記述とイベントの処理だけを行います。スタイルのパース、Tailwind クラスの解決、差分検出、レイアウト、テキスト処理は、すべて Rust で行われます。

<a id="the-difference"></a>

### 違い

| | Rust アプリ | TSX アプリ |
|---|---|---|
| 記述言語 | Rust | TSX(TypeScript と JSX) |
| ビルド結果 | ネイティブコード(各ターゲットのランナーにリンク) | QuickJS バイトコード(ランタイムが読み込む) |
| JavaScript エンジン | なし | QuickJS(ビューごとに 1 つの VM) |
| 開発中(`nsh run`) | 保存のたびに再ビルドして再起動 | 保存のたびにホットアップデート |
| リリース後 | アプリに同梱して配布 | 署名付きパッケージとして、サンドボックス内で実行時にも配信可能 |
| 適した用途 | アプリ全体、重い計算、システム処理 | 素早く書く画面、プラグイン、AI 生成 UI |

両者は組み合わせられます。Rust アプリは TSX の画面を取り込め、TSX の画面はその Rust コンポーネント、モジュール、クラスをインポートできます。このようなアプリは、TSX を実行するために QuickJS をリンクします([Building with Rust](./rust.md))。

<a id="the-shared-engine"></a>

### 共有エンジン

エンジンから先は、どちらの経路も同じです。変更はターン単位で収集され、Taffy(flexbox と CSS grid)でレイアウトされ、フレームごとに 1 つのビュー操作バッチとしてメインスレッドに渡されます。メインスレッドはそのバッチをネイティブビューに適用します。テキストはエンジンスレッドで一度だけ計測とレイアウトが行われ(Apple プラットフォームでは CoreText、Android では `StaticLayout`、Windows では DirectWrite、Linux では Pango、web ではブラウザのフォントメトリクス)、メインスレッドでは描画だけが行われます。

web では、同じエンジンがページ内で動作します。ブラウザは CSS でスタイルを付けた HTML 要素を表示し、スクロール、テキスト選択、入力処理を行います。`nsh package --target web` は、アプリを、ファイル名がコンテンツで決まる静的サイトとして公開し、任意の CDN にそのまま載せられます([Web](./web.md))。

> [!NOTE]
> メインスレッドがアプリのコードを待つことはありません。システムが同期的に問い合わせる事柄(この入力がもう 1 文字受け付けられるか、ユーザーがスワイプバックしてよいか、このシートを閉じてよいか)には、`maxLength`、`popOnBack`、`closeOnSwipe` のように事前に設定された props をもとに、ネイティブ側で応答します。イベントはその後でアプリのハンドラーに届きます。
<a id="dynamic-ui-and-ai-generated-ui"></a>

## 動的 UI と AI 生成 UI

NSH はもともと、ネイティブアプリがリリース後に UI を取り込むための仕組みとして始まりました。そして現在も、その主要な用途の一つです。アプリは、モジュールを表示したい場所に `NshAppView`(iOS)、`NshView`(Android)、`AppView`(macOS、Windows、Linux、GPUI アプリ)、または `createPlayer`(Web ページ)を埋め込み、NSH がその中で TSX モジュールを実行します。

- **リリース後に配信。** モジュールは署名付きパッケージ(`.nshpkg`)で、アプリが実行時にダウンロードします。アプリは実行前に、信頼する鍵と失効リストに照らして署名を検証します([Signed packages](./signed-packages.md))。ホストアプリはランタイムを同梱し、チームはその API に対してモジュールを開発して、自分たちのスケジュールで配信できます。
- **ホストが制御を保つ。** 各モジュールは、メモリ、呼び出し時間、ノード数に制限のある独立した QuickJS VM で動作し、ホストが許可したものにだけアクセスできます。許可の対象は、ネットワークホスト、Web ページ、ステータスバーなどです([Sandbox and capabilities](./sandbox-and-capabilities.md))。複数のモジュールを並行して実行できます。
- **アプリの他の部分と同じ見た目。** モジュールはプラットフォーム標準の UI で描画されます。ホストは、地図、プレイヤー、デザインシステムのコンポーネントなど独自のネイティブビューを登録して、モジュールから使えるようにできます([Native components](./native-components.md))。

同じ仕組みにより、アプリは**インターフェースで応答**できます。モデルが小さな TSX モジュール(フォーム、チャート、予約カードなど)を書き、サーバーがそれを検証・ビルド・署名し、アプリがネイティブ UI として表示します。

<div class="diagram-scroll">
<img class="diagram diagram-light" src="/diagrams/ai-flow-light.svg" alt="From a prompt to native UI: a model writes a TSX module; your server builds, checks and signs it; across the trust boundary, the app verifies the package, runs it in a sandbox with the limits and capabilities it set, and shows it with the platform's own UI.">
<img class="diagram diagram-dark" src="/diagrams/ai-flow-dark.svg" alt="From a prompt to native UI: a model writes a TSX module; your server builds, checks and signs it; across the trust boundary, the app verifies the package, runs it in a sandbox with the limits and capabilities it set, and shows it with the platform's own UI.">
</div>

iOS では、ホスト側のコードは数行で済みます。

```swift
let app = NshAppView()                         // a UIView: place it anywhere
try app.grantCapabilities(#"{ "network": { "hosts": ["api.example.com"] } }"#)
let info = try await app.loadPackage(at: downloadedFile, trust: trust)   // verified, then run
```

<a id="ai-friendly"></a>

## AI との親和性

NSH は、生成された画面だけでなくアプリ全体も、AI を使って開発することを前提に設計されています。

- **すべてのプラットフォームで共通のアプリモデル。** モデルが覚える UI の書き方は一つだけで、その結果がスマートフォン、デスクトップ、Web で動作します。NSH がプラットフォームごとにインタラクションを調整するため、6 回生成し直す必要はありません。
- **用途に応じて Rust または TSX。** アプリ全体やパフォーマンスが重要なモジュールには Rust、画面、プラグイン、リクエストごとに生成される UI には TSX を使えます。どちらも同じエンジン上で動作します。
- **正確で生成される契約(型定義)。** すべての要素、props、スタイルキー、モジュールについて、Rust のソースから生成された TypeScript の型宣言があります(`.nsh/types`)。Rust の API も型付けされているため、生成されたコードはコンパイラで検査できます。このドキュメントはモデル向けにプレーンテキストでも提供されています([`llms.txt`](/llms.txt)、[`llms-full.txt`](/llms-full.txt))。
- **ループ全体を一つのコマンドラインで。** エージェントは、アプリの作成、ビルド、ターゲット上での実行、テストの実行、結果の読み取り、修正、パッケージ化のすべてを `nsh` で行えます。`nsh test` はデバイスなしのヘッドレスで動作し、エラーと生成されたビューを報告します。コンパイラはインプロセス(`nsh_bundler::compile_module`)やブラウザー([Playground](/playground))でも実行できます。
- **信頼できない場合でも安全に実行。** 実行時に配信される生成コードは、信頼できないコードとして扱われます。署名付きで届き、制限のある VM 内で動作し、ホストが許可した機能にのみアクセスできます。

<a id="where-it-runs"></a>

## 動作環境

| プラットフォーム | 要件 | バックエンド | 組み込み方法 |
|---|---|---|---|
| [iOS](./ios.md) | iOS 15.0+ | UIKit | `NativeShell.xcframework` |
| [Android](./android.md) | Android 9+ | Android views | `nsh.aar` |
| [macOS](./macos.md) | macOS 14+ | AppKit | `AppView` |
| [Windows](./windows.md) | Windows 10 1809+ | Win32, Direct2D | `AppView` |
| [Linux](./linux.md) | GTK 4.14+ | GTK 4 | `AppView` |
| [Web](./web.md) | 最新のブラウザー | HTML | `createPlayer`、iframe |
| [GPUI](./gpui.md) | デスクトップ | GPUI | `AppView`(GPUI、GPUI Kit アプリ) |
| Mac Catalyst | macOS | UIKit | 開発用(`--target catalyst`) |

<div class="diagram-scroll">
<img class="diagram diagram-light" src="/diagrams/platforms-light.svg" alt="One module, many hosts: the same bundle and Rust runtime on iOS, Android, Linux, macOS with AppKit and Windows with Win32 / Direct2D, GPUI on all three desktops, and web pages drawn with HTML.">
<img class="diagram diagram-dark" src="/diagrams/platforms-dark.svg" alt="One module, many hosts: the same bundle and Rust runtime on iOS, Android, Linux, macOS with AppKit and Windows with Win32 / Direct2D, GPUI on all three desktops, and web pages drawn with HTML.">
</div>

<a id="native-shell-and-gpui-shell"></a>

## Native Shell と GPUI Shell

[Longbridge](https://longbridge.com) は、自社のクライアント向けに NSH を開発しています。最初のニーズはモバイルクライアント向けのプラグイン層であり、その出発点となったのが、[GPUI](https://gpui-kit.com) デスクトップアプリを JavaScript で拡張可能にする [GPUI Shell](https://gpui-kit.com/shell) でした。ただしスマートフォンでは、GPUI 自身が描画する UI だと、プラットフォームがすでに提供している機能、つまりテキスト選択とそのメニュー(コピー、共有、翻訳、調べる)、入力メソッド、アクセシビリティ、iOS のリリースごとに追加されるビジュアルマテリアルを作り直す必要があります。さらに、すべてのモバイルチームが新しい UI スタックを抱え込むことになります。そこで NSH は各プラットフォーム標準の UI で描画することにし、このプラグイン層から、あらゆるプラットフォーム向けのアプリ全体を構築するフレームワークへと発展しました。

両者の位置づけは異なります。GPUI Shell は GPUI デスクトップアプリケーションを拡張するものです。Native Shell は、スマートフォン、デスクトップ、Web のネイティブアプリ向けのフレームワークであり、その GPUI バックエンドは、GPUI アプリや GPUI Kit アプリに NSH アプリを組み込みます([GPUI](./gpui.md))。

<a id="how-it-compares"></a>

## 他の手法との比較

アプリ全体の開発では、NSH は React Native、Flutter、Qt、GPUI、Slint、Electron、Tauri などのクロスプラットフォームフレームワークと並ぶ選択肢です。リリース後に配信する UI としては、Web ビュー、サーバー駆動 UI、ミニプログラムコンテナと並ぶ選択肢になります。NSH が選んだのは、一つのアプリモデルのもとで各プラットフォーム標準の UI とインタラクションを使うことであり、アプリの言語は Rust、それに並んで TSX を使えます。それぞれとの違いは [Comparing approaches](./comparison.md) で詳しく説明します。

<a id="next-steps"></a>

## 次のステップ

- [Installation](./installation.md) と [Getting started](./getting-started.md): `nsh` を入手し、Rust または TSX で最初のアプリを書いて、各プラットフォームで実行します。
- [Building with Rust](./rust.md): Rust で書くアプリと、その上で使う TSX について説明します。
- [Platforms](./platforms.md): どのプラットフォームで何が動くか、各プラットフォームでの実行、パッケージ化、組み込みの方法を説明します。
- [JSX and components](./jsx-and-components.md) と [Reactivity](./reactivity.md): 他のすべての土台となる二つの考え方を、Rust と TSX で説明します。
- [Signed packages](./signed-packages.md) と [Sandbox and capabilities](./sandbox-and-capabilities.md): モジュールを配信し、モジュールに許可する操作を決めます。
