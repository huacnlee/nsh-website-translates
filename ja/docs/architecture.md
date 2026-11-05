---
title: "アーキテクチャ"
description: "NSH アプリの実行の仕組み:ビルドパイプライン、エンジンスレッドとメインスレッド、シグナルの変更からネイティブビューに至る経路、ネイティブのリアクティブグラフ、テキストレイアウト、そしてクレートについて解説します。"
order: 63
group: tools
source_hash: 03fd3f0b9b408f5b
---

# アーキテクチャ

このページは、Rust または TSX で書かれたアプリで、`count.set(1)` から画面上のラベルが変わるまでの間に何が起きているのかを知りたいアプリ開発者向けです。
アプリを書くためにこのページは必須ではありませんが、NSH がなぜそのように動作するのかを説明しています。たとえば、コンポーネントが一度しか実行されない理由、JS がビジー状態でもアニメーションが滑らかなままである理由、メインスレッドがあなたのコードを決して待たない理由です。

<a id="the-big-picture"></a>

## 全体像

<div class="diagram-scroll">
<img class="diagram diagram-light" src="/diagrams/architecture-light.svg" alt="How an nsh app runs: the nsh CLI builds App.tsx into bytecode; on the engine thread, QuickJS runs a handler, the reactive graph in nsh-js queues ops, and nsh-core commits one MountBatch; it crosses to the main thread in one hop, which applies it to UIKit or Android views; touches go back as events. Native animations run on the main thread without JavaScript.">
<img class="diagram diagram-dark" src="/diagrams/architecture-dark.svg" alt="How an nsh app runs: the nsh CLI builds App.tsx into bytecode; on the engine thread, QuickJS runs a handler, the reactive graph in nsh-js queues ops, and nsh-core commits one MountBatch; it crosses to the main thread in one hop, which applies it to UIKit or Android views; touches go back as events. Native animations run on the main thread without JavaScript.">
</div>

<a id="building-only-your-code-becomes-js"></a>

## ビルド: JS になるのはあなたのコードだけ

`nsh build`、`nsh dev`、およびその他のコマンドは、Rust で書かれたツールチェーン(Node.js は不要)でアプリをバンドルします。

1. **Oxc** が TypeScript の型を取り除きます。
2. **NSH の JSX コンパイラ** が、同じパスの中で JSX をネイティブレンダラーへの直接呼び出しに変換します。静的な props と子要素は一度だけ設定されます。変化しうる式(関数を呼び出す、またはプロパティを読み取るもの)は、レンダラーが追跡するバインディングになります。コンポーネントは、通常の関数呼び出しになり、変化する props はゲッターとして props オブジェクトに渡されます。
3. **rolldown** がモジュールを 1 つの ES モジュールにバンドルします。NSH のモジュール(`nsh`、`nsh/mobile`、`nsh/base` など)のインポートはインポートのまま残ります。これらのモジュールはネイティブであり、ランタイムによって提供されます。**バンドルに含まれるのはあなたのアプリのコードだけ** で、カウンターの例は JS が 1 KB 未満です。
4. バンドルは **バイトコード**(`bundle.nshc`)にコンパイルされ、ソースより高速に読み込まれます。また、すべてのステップをまたいで **ソースマップ** が合成されるため、スタックトレースはあなたの `.tsx` の行を指します。

インポートした画像やフォントはアセットとして収集され、エディタ用の型宣言は `.nsh/types` に書き出されます。

Rust で書かれたアプリにはバンドルがありません。Cargo が、あなたのクレートをリンクした各ターゲットのランナーをビルドし、`nsh.json` が指定するルートコンポーネントがエンジン上でネイティブに実行されます。以下の内容はすべてこの場合にも当てはまり、TSX アプリでは QuickJS 上で動くコンポーネントのコードが、Rust アプリでは Rust で動きます。

<a id="running-two-threads-per-app"></a>

## 実行: アプリごとに 2 つのスレッド

実行中の各アプリ(iOS の `NshAppView`、Android の `NshView`、パッケージ化されたアプリのウィンドウ)は、独自の **エンジンスレッド** を持つ 1 つの **エンジン** であり、TSX の場合は独自の QuickJS VM も持ちます。グローバルなシングルトンは存在しないため、1 つのホストアプリ内で複数のアプリを並べて実行できます。

<a id="the-engine-thread"></a>

### エンジンスレッド

アプリのロジックに関することはすべてここで行われます。

- **あなたのコード** はここで実行されます。コンポーネント、イベントハンドラー、タイマー、エフェクトなどです。Rust のコンポーネントはネイティブで実行され、TSX は **QuickJS** で実行されます。
- **リアクティブグラフ**(シグナル、算出値、エフェクト、オーナー、コンテキスト)はネイティブです。そのノードはネイティブクラスの QuickJS オブジェクトであるため、ガベージコレクターはそれらを通じて参照を認識しますが、依存関係の追跡と更新のスケジューリングは Rust で行われます(Solid 1.9 のアルゴリズムに従っています)。
- あなたのコンパイル済み JSX が呼び出す **レンダラー** はネイティブです。ノードを作成し、あらゆる変更を **op** に変換して、ネイティブのキューに直接プッシュします。JSON も、props ごとのメッセージもありません。
- **コア** はすべてのノードのシャドウツリーを保持します。JS のターンが終わると、キューにあるすべての op を一度に受け取って **コミット** を行います。具体的には、Rust コンポーネント(`nsh/base`のものとアプリ独自のもの)のレンダリング、padding と margin 内の `env()` インセットの解決、変更されたテキストの再構築、**Taffy** によるレイアウト(flexbox と grid。デフォルトは column で、縮小なし)、フレームとスタイルの差分計算を行い、ネイティブビューが必要とする操作のリストである 1 つの **MountBatch** を生成します。

<a id="the-main-thread"></a>

### メインスレッド

プラットフォームのメイン(UI)スレッドは、各 MountBatch を 1 回の受け渡しで適用します。ビューの作成、挿入、スタイルとフレームの設定、レイアウト済みテキストの受け渡しです。それ以外では、メインスレッドで行う必要があることだけを行います。

- エンジンスレッドで既にレイアウト済みの **テキストの描画**
- **ネイティブアニメーション**: `nsh` のアニメーション値はフレームごとに駆動され(iOS では `CADisplayLink`、Android では UI スレッドのアニメーター)、ビューに直接書き込まれます。
- **ジェスチャーとスクロール**: タッチはイベントとしてエンジンスレッドに送られ、`scrollValue` と `pan` は同じフレーム内でアニメーション値に反映されます。

**メインスレッドは JS を決して待ちません。** システムがその場で答えを必要とする場合(このテキストを変更してよいか、戻るボタンでこの画面を閉じてよいか、このシートを閉じてよいか)、その答えは事前に props としてマウントされており、JS には後からイベントで通知されます。エンジンスレッドがビジーだと更新が遅れることはありますが、スクロール、アニメーション、システムのジェスチャーがフリーズすることはありません。

<a id="from-a-tap-to-the-screen"></a>

## タップから画面まで

```text
 main thread               engine thread                                              main thread
 ───────────               ─────────────────────────────────────────────────────      ───────────
 tap on a view ─ event ─▶  handler runs: count.set(count() + 1)
                           reactive graph: the bindings that read count() run again
                           renderer: one op per changed binding → native queue
                           JS turn ends → core commit: render, text, layout, diff
                           → MountBatch (e.g. 1 Text item)                 ─ hop ─▶   apply: draw the new text
```

カウンターの例では、Mac のリリースビルドで、JS とコミットを合わせてタップ 1 回あたり約 0.12 ms かかり、生成されるマウントアイテムはごくわずかです([Testing](./testing-and-trace.md)を参照)。

Rust アプリではハンドラーは Rust のクロージャ(`count.set(count.get() + 1)`)であり、同じグラフ、コミット、バッチがその後に続きます。途中にインタープリターはありません。

この設計から、次の 3 つの性質が導かれます。

- **1 ターンは 1 コミット。** ハンドラーがいくつのシグナルを設定しても、ビューの変更は 1 回にまとめて行われます。
- **コンポーネントは一度だけ実行される。** 再実行されるのはバインディングだけです。コンポーネントの再レンダリングも仮想 DOM の差分計算もありません。残っている差分計算は、フレームとスタイルに対してコアが Rust で行うものです。
- **変更だけが送られる。** 変更のないスタイルとフレームは送信されず、新しいビューにはデフォルト値が設定されません。

<a id="text-laid-out-once-off-the-main-thread"></a>

## テキスト: 一度だけ、メインスレッド外でレイアウト

テキストは UI の中で最もコストが高い部分であることが多いです。NSH はプラットフォーム標準のテキストエンジンを使ってエンジンスレッドでテキストをレイアウトするため、見た目はネイティブのテキストとまったく同じです。

1. **prepare**: `<Text>` とそのネストされたスパンが、1 つの属性付き文字列になります(Apple プラットフォームでは CoreText、Android では `PrecomputedText` / `StaticLayout`)。
2. **measure**: レイアウトが要求する幅で計測します。計測結果は内容と幅でキャッシュされるため、色だけの変更では再計測されません。
3. **layout**: 最終的なサイズでレイアウトします。

メインスレッドは不変の結果を受け取り、描画するだけです。`<Text>` の中にネストされたテキストはビューではなくスパンであり、`<Text>` の外側にある文字列は何もレンダリングしません。

<a id="lists"></a>

## リスト

`List` はネイティブで仮想化されています。コアは、どの行がビューポートの近くにあるかを判断し、位置、列、スティッキーヘッダーを計算し、セルをリサイクルします。セルが別のアイテムを必要とするとき、ランタイムがそれをバインドします(行関数の `item()` と `index()` アクセサーが変化します)。新しい行が表示されないフレームでは、JS はまったく呼び出されません。[Lists](./lists.md)を参照してください。

<a id="everything-else-the-runtime-does"></a>

## ランタイムが行うその他のこと

- **ネットワーク**: `fetch` やその他のグローバル API はネイティブクラスです。リクエストはプラットフォームの HTTP スタック(`NSURLSession`、`HttpURLConnection`)に渡され、双方向でストリーミングされます。
- **画像** は、メインスレッド外で、ビューのサイズでダウンロードおよびデコードされ、メモリキャッシュが使われます。
- **制限と権限** はランタイムによって Rust で強制されます。[Sandbox and capabilities](./sandbox-and-capabilities.md)を参照してください。
- **ホットモジュール置換** もネイティブです。パッチはランタイムによって 1 ミリ秒を大きく下回る時間で適用されます([Dev server and debugging](./dev-server-and-debugging.md)を参照)。

<a id="three-layers"></a>

## 3 つのレイヤー

NSH の UI は、GPUI Kit と同様に 3 つのレイヤーで構成されています。

| レイヤー | NSH | GPUI Kit | 内容 |
|---|---|---|---|
| プリミティブ | `nsh-core` とランタイム(`nsh`、`nsh/mobile`、`nsh/desktop`) | `gpui` | ホスト要素、スタイル、レイアウト、レンダリング、リアクティビティ、環境 |
| ベースコンポーネント | `nsh-base`(`nsh/base`) | `gpui-base` | 動作、状態、フォーカス、キーボード、アクセシビリティを担い、見た目はアプリから受け取る、スタイルなしのコンポーネント |
| コンポーネントライブラリ | あなたのアプリのもの、またはコミュニティのもの | `gpui-component` | スタイル付きのコンポーネント: ボタン、カード、見た目のある行 |

最初の 2 つのレイヤーは Native Shell に含まれます。3 番目はあなた次第です。アプリは、`nsh/base` とプリミティブの上に独自のコンポーネントライブラリを TSX または[独自のクレート](./rust.md)内の Rust コンポーネントとして構築するか、コミュニティが公開しているものを使うか、アプリ内で直接 UI をスタイリングします。

<a id="the-crates"></a>

## クレート

NSH は Rust ワークスペースです。アプリを書くためにビルドする必要はありません(ディストリビューションには CLI とビルド済みランタイムが含まれています)が、ログやドキュメントにはこれらの名前が登場します。

| クレート | 内容 |
|---|---|
| `nsh-core` | プラットフォーム非依存のコア: シャドウツリー、スタイル、Taffy レイアウト、テキストのマージ、リストの仮想化、マウントアイテム。CSS 値と Tailwind。ネイティブアニメーショングラフ(値、補間、timing / spring / decay)。Rust コンポーネントのフレームワークとテーマ。ランタイムの Rust モジュール(`nsh/mobile`の`BackHandler`など)。 |
| `nsh-base` | `nsh/base`、スタイルなしのベースコンポーネント(NSH の `gpui-base`): ナビゲーション、ダイアログ、コントロール、ステータスバー。Rust アプリは `nsh_base` として使用します。 |
| `nsh-js` | QuickJS ホストと NSH のランタイム: リアクティブグラフ、レンダラー、すべてのネイティブモジュール、グローバル API、ホットモジュール置換、制限。およびそれらすべての TypeScript 宣言。 |
| `nsh-engine` | エンジンスレッド: `nsh-js` と `nsh-core` を駆動し、フレームごとに 1 つのバッチをプラットフォームに渡します。 |
| `nsh-package` | 署名付きパッケージ: 鍵、証明書、失効、トラストストア。 |
| `nsh-bundler` | バンドラー: rolldown、Oxc、NSH の JSX コンパイラ、ソースマップ、Tailwind クラスのチェック。 |
| `nsh-dev` | 開発サーバーとそのクライアント。 |
| `nsh-platform-ios` | UIKit バックエンド(iOS、シミュレーター、Mac Catalyst): ビューのマウント、CoreText テキストエンジン、入力。組み込み SDK。 |
| `nsh-platform-android` | Android バックエンド: `libnsh.so` と Java ランタイム(`NshView`、ビュー、画像、ネットワーク)。 |
| `nsh-cli` | `nsh` コマンド。 |

依存の方向は `nsh-core` ← `nsh-js` ← `nsh-engine` ← プラットフォームであり、`nsh-base` は `nsh-core` の上に構築されています。コアはどのプラットフォームにも JS エンジンにも依存しません。これにより、`nsh test` は実際のランタイムを任意のマシンでヘッドレス実行できます。

<a id="see-also"></a>

## 関連項目

- [Performance](./performance.md)
- [Reactivity](./reactivity.md)
