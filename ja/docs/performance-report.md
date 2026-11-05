---
title: "パフォーマンスレポート"
description: "NSH アプリの実測値 - NSH のベースラインにおけるコミットコストとフレームコスト、および Linux、macOS、Windows、iOS 上でのギャラリーのフレームレート、CPU、メモリをページごとにまとめ、再現方法も紹介します。"
order: 62.5
group: tools
source_hash: 8924d78b30d23299
---

# パフォーマンスレポート

NSH アプリのコストを実測した結果です。NSH がアプリを高速に保つ仕組みと、自分のアプリを計測する方法については [Performance](./performance.md) を参照してください。

<a id="baselines"></a>

## ベースライン

NSH 自身のベースラインです(特記がない限り Apple silicon)。

| シナリオ | 数値 |
|---|---|
| カウンターアプリ、ヘッドレス(デバッグ) | 最初のフレーム約 0.5〜0.65 ms(58 ops / 49 mount items)、タップ 1 回あたり約 0.15 ms |
| カウンターアプリ、Mac Catalyst(リリース) | 最初のフレーム約 1.05〜1.15 ms(うち約 0.7 ms は CoreText による 10 個のテキストの初回レイアウト)、タップ 1 回あたり約 0.12 ms |
| Gallery の写真リスト、ヘッドレス(デバッグ) | 最初のフレーム 653 ops / 224 nodes、約 2.7 ms |
| 写真リストのスクロール、Catalyst(リリース) | ゆっくりスクロール中の 1 行の再バインド 約 0.4 ms、速いフリングでの約 32 行ぶんの 1 画面 0.9〜1.6 ms |
| 写真リストのスクロール、Android エミュレーター(arm64、リリース) | 1 行の再バインド 約 0.3〜0.4 ms(JS は約 60 µs) |
| エンジンの起動(リリース) | 約 75〜155 µs。グローバル API(`fetch`、`URL` など)は初めて使われるまでコストがかからず、使用時に約 90 µs |
| ホットリロード | ファイルの保存から新バージョンの実行まで約 120 ms、更新の適用は 0.2〜0.5 ms |

## Linux (GTK 4)

Linux デスクトップ(x86_64、24 スレッド、NVIDIA GPU)でリリースビルドを使い、120 Hz ディスプレイ上の 1896 × 1030 ウィンドウで gallery を動かして計測しました。すべての値は `examples/gallery/tools/perf.py`(`nsh test --target linux --fps`)が自動的に取得したもので、1 秒に 1 行出力されます。CPU はプロセス全体の値で、コア 1 つぶんを 100% とした割合です。*Frame p95* は、描画された 1 フレームあたりのメインスレッドの所要時間の 95 パーセンタイルです。8.3 ms 未満であれば、1 フレームが 120 Hz のリフレッシュに収まります。

<a id="animated-demos"></a>

### アニメーションのデモ

<div class="data-table">

| デモ | FPS | Frame p95 | CPU |
|---|---|---|---|
| Stocks: 22 本のライブスパークライン、日中チャート、板情報、ティッカーテープ | 117–120 | 5–6 ms | 25–29%(1200 × 800)、28–32%(1896 × 1030) |
| Stocks、ウィンドウが 4K 144 Hz ディスプレイ全体を 1.6 倍で占める場合 | 143–145 | 4.1–4.4 ms | 26–29% |
| Canvas: ゲージ、時計、ドットマトリクス | 120 | 2.6–4.4 ms | 5–10% |
| Animations: 3 つのネイティブループ、スプリング、シーケンス | 120 | 2.0 ms | 12–13% |

</div>

<a id="every-page"></a>

### 全ページ

gallery の全ページについて、ページを開いたときと、テストがスクロールしている間の値です。同じマシンの 144 Hz ディスプレイ上、1200 × 800 のウィンドウで計測しました。NSH は画面上で何かが変化したときだけフレームを描画するため、ここでの *FPS* は何かが動いている間のレートで、描画されたフレーム間隔の中央値 1 つぶんを 1 フレームとして算出しています(`perf.py`の `moving`)。ディスプレイの 144 では、アニメーションやスクロールのすべてのフレームが直前のフレームの 1 リフレッシュ後に届きます。*リフレッシュ超過率* は、1 リフレッシュ(6.9 ms)より長くかかったフレームの割合です。Images の GIF と WebP は、動画と同様、それぞれ固有のフレームレート(ここでは約 50 FPS)で再生されます。Physics、Overlays、Menus は内容が短く、1200 × 800 ではスクロールが数フレームで末尾に達してしまうため、スクロールの余地がある 900 × 500 のウィンドウで計測しています。

<div class="data-table">

| ページ | フレームの発生源 | FPS | Frame p95 | リフレッシュ超過率 | CPU |
|---|---|---|---|---|---|
| Stocks | ライブデータ、ネイティブループ | 144 | 4.1 ms | 0% | 26% |
| Stocks、スクロール | ライブデータ、スクロール | 144 | 4.1 ms | 0% | 25% |
| Photos、スクロール | スクロール | 144 | 2.8 ms | 2% | 9% |
| Lists、スクロール | スクロール | 143 | 1.7 ms | 0% | 7% |
| Scrolling、スクロール | スクロール | 144 | 1.6 ms | 1% | 4% |
| Navigation、スクロール | スクロール | 143 | 1.7 ms | 0% | 2% |
| Form、スクロール | スクロール | 144 | 1.3 ms | 0% | 4% |
| Resizable、スクロール | スクロール | 143 | 0.6 ms | 0% | 1% |
| Dock、スクロール | スクロール | 142 | 0.5 ms | 1% | 1% |
| Gestures | スプリング、脈動するリング | 144 | 1.6 ms | 0% | 1–5% |
| Physics、スクロール | スクロール(900 × 500 のウィンドウ) | 144 | 1.6 ms | 1% | 1% |
| Animations | ネイティブループ | 144 | 2.6 ms | 0–1% | 5% |
| Canvas、スクロール | スクロール、ネイティブループ | 144 | 4.2 ms | 0% | 1–4% |
| Styles、スクロール | スクロール | 144 | 2.3 ms | 2% | 3% |
| Tailwind | `animate-*` ユーティリティ | 144 | 1.7 ms | 0% | 3–8% |
| Text、スクロール | スクロール | 144 | 1.9 ms | 0% | 4% |
| Text View、スクロール | スクロール | 141 | 1.8 ms | 2% | 7% |
| Images、スクロール | スクロール、GIF と WebP のフレーム | 143 | 2.9 ms | 2% | 8% |
| Components、スクロール | スクロール | 144 | 1.4 ms | 0% | 3% |
| Overlays、スクロール | スクロール(900 × 500 のウィンドウ) | 144 | 1.7 ms | 0% | 2% |
| Menus、スクロール | スクロール(900 × 500 のウィンドウ) | 144 | 1.9 ms | 0% | 2% |
| Controls | トランジション | 144 | 0.9 ms | 0% | 1–4% |
| Web and video | 動画フレーム、ページ | 135–142 | 1.0 ms | 0% | 7–8% |

</div>

<a id="memory"></a>

### メモリ

起動 3 秒後の安止状態の値です(リリースのランナー、480 × 640 のウィンドウ)。*Private* はそのプロセスだけが所有するメモリ(USS)です。*Resident* にはこれに加えて共有ライブラリ(GTK、GPU ドライバー)のページが含まれ、これらはマシン上のすべての GTK アプリで共有されます。

<div class="data-table">

| アプリ | レンダラー | Private (USS) | Resident (RSS) |
|---|---|---|---|
| Rust アプリ(`nsh init --template rust`) | GL(`ngl`) | 約 49 MB | 約 142 MB |
| Rust アプリ | Cairo(`GSK_RENDERER=cairo`) | 約 28 MB | 約 95 MB |
| TSX カウンター(`examples/counter`) | GL | 約 79 MB | 約 166 MB |
| 参考: ラベル 1 つだけの GTK 4 ウィンドウ | Vulkan / Cairo | 約 62 / 約 40 MB | 約 132 / 約 109 MB |

</div>

すでに開いたページに戻ってもメモリは増えません。ページを初めて開くと、意図的にキャッシュするもの(デコード済み画像。上限 128 MB)と、初回使用時に読み込まれるライブラリ(Web ビュー用の WebKitGTK)のぶんだけプロセスが大きくなります。

<a id="app-size"></a>

### アプリのサイズ

`nsh init` で各テンプレートから作成した Hello world アプリと、実際に使われている 2 つのアプリを、`nsh package --target linux` が x86_64 向けにビルドした場合のサイズです。ランナーはアプリの唯一の実行ファイルで、アーカイブはそれを配布する形式の `.tar.gz` です。Hello world はリンク時最適化を有効にし、strip してビルドしています(`CARGO_PROFILE_RELEASE_LTO=fat`、`CARGO_PROFILE_RELEASE_CODEGEN_UNITS=1`、`CARGO_PROFILE_RELEASE_STRIP=true`)。

<div class="data-table">

| アプリ | 記述言語 | ランナー | アーカイブ |
|---|---|---|---|
| Hello world(`--template rust`) | Rust | 16.5 MB | 7.5 MB |
| Hello world(`--template ts`) | TSX、QuickJS 上 | 25.7 MB | 11.6 MB |
| Hello world(`--template mixed`) | TSX と Rust クレート | 25.8 MB | 11.7 MB |
| [sysmon](https://github.com/huacnlee/sysmon) 0.1.3 | Rust | 20.9 MB(strip 済み) | 9.7 MB |
| [Omasend](https://github.com/huacnlee/omasend) 0.2.0 | Rust | 22.3 MB | 9.8 MB |

</div>

TSX のランナーには QuickJS ランタイム、ネイティブモジュール、レンダラーが含まれます。アプリ自身のコードはランナーの隣に置かれるバンドルで、Hello world では 1 KB 未満です。

これらの数値を支えているもの:

- **レンダラー**: NVIDIA のドライバー環境では、NSH は GSK の GL レンダラーで描画します。この環境では、Vulkan レンダラーよりフレームのコストがはるかに小さくなります(Animations デモ: 1 フレームあたりの描画が約 9.5 ms ではなく約 1 ms)。それでも最終的な選択は `GSK_RENDERER` が行います。
- **Canvas のラスタライズ**: 各 canvas は一度だけ 256 px のタイルにラスタライズされ、GPU 上に保持されます。アニメーションする値は、その値を読む操作がカバーする領域だけを、描画の静的な部分の保持済みピクセルの上に再描画します。画面外にある canvas は、スクロールで表示されるまで待機します。
- **パスを一度だけ確保**: 長いパスのあとの `fillRect` と `fillText` は、そのパスが再び使われるまでそのまま残します(400 点の折れ線のあとに 240 本の棒: 0.63 ms)。

## macOS (AppKit)

MacBook Pro(Apple M3、24 GB)の内蔵 120 Hz ProMotion ディスプレイ上で、リリースビルドを使い、1200 × 800 のウィンドウで gallery を動かして計測しました。すべての値は `examples/gallery/tools/perf.py`(`nsh test --target macos --fps`、1 秒に 1 行出力)が自動的に取得したものです。CPU はプロセス全体の値でコア 1 つぶんを 100% とした割合、GPU は GPU に占める割合です。フェーズはフレームごとのメインスレッドの処理で、*tick*(ディスプレイリンクのネイティブアニメーション)と *canvas*(描画のリプレイ)があります。

<a id="animated-demos-1"></a>

### アニメーションのデモ

<div class="data-table">

| デモ | FPS | Frame p95 | CPU | GPU |
|---|---|---|---|---|
| Stocks: 22 本のライブスパークライン、日中チャート、板情報、ティッカーテープ | 120 | 2.7–3.7 ms | 33–36% | 18–22% |
| Canvas: ゲージ、時計、ドットマトリクス | 119–120 | 0.6–0.7 ms | 4–7% | 0% |
| Animations: 3 つのネイティブループ、スプリング、シーケンス | 119–120 | 0.3–1.6 ms | 5–8% | 0% |

</div>

Stocks では、1 フレームあたりのメインスレッド時間は tick が約 1.6 ms で、そのうち約 0.45 ms は canvas のアニメーション部分のリプレイです。各 canvas の残りの部分は、Core Animation が専用のスレッドで描画します。

<a id="every-page-1"></a>

### 全ページ

gallery の全ページについて、ページを開いたときと、テストがスクロールしている間の値を、同じ 1200 × 800 のウィンドウで計測しました。Linux と同様に、*FPS* は何かが動いている間のレート(描画されたフレーム間隔の中央値 1 つぶんを 1 フレームとして算出)です。ディスプレイの 120 では、アニメーションやスクロールのすべてのフレームが直前のフレームの 1 リフレッシュ後に届きます。*リフレッシュ超過率* は、1 リフレッシュ(8.3 ms)より長くかかったフレームの割合です。静止しているページはフレームを描画せず、CPU 使用率は 2〜5% です。Images の GIF と WebP は Core Animation で、動画は AVFoundation で、それぞれ固有のフレームレートで再生されます。

<div class="data-table">

| ページ | フレームの発生源 | FPS | Frame p95 | リフレッシュ超過率 | CPU |
|---|---|---|---|---|---|
| Stocks | ライブデータ、ネイティブループ | 120 | 3.2 ms | 0% | 35% |
| Stocks、スクロール | ライブデータ、スクロール | 120 | 3.5 ms | 0% | 36% |
| AI Chat、スクロール | スクロール | 120 | 2.4 ms | 1% | 5% |
| Photos、スクロール | スクロール | 120 | 1.4 ms | 0% | 10% |
| Lists、スクロール | スクロール | 120 | 1.6 ms | 0% | 8% |
| Scrolling、スクロール | スクロール | 120 | 2.7 ms | 0% | 6% |
| Navigation、スクロール | スクロール | 120 | 0.2 ms | 0% | 4% |
| Form、スクロール | スクロール | 120 | 0.6 ms | 0% | 5% |
| Resizable、スクロール | スクロール | 120 | 0.3 ms | 0% | 4% |
| Dock、スクロール | スクロール | 120 | 0.3 ms | 1% | 5% |
| Gestures | スプリング、脈動するリング | 120 | 0.4 ms | 0% | 4% |
| Physics、スクロール | スクロール | 120 | 0.3 ms | 0% | 4% |
| Animations | ネイティブループ | 120 | 0.3 ms | 0% | 5% |
| Canvas、スクロール | スクロール、ネイティブループ | 120 | 1.2 ms | 0% | 7% |
| Styles、スクロール | スクロール、揺れる transform | 120 | 1.0 ms | 0% | 6% |
| Tailwind | `animate-*` ユーティリティ | 120 | 0.5 ms | 0% | 4% |
| Text、スクロール | スクロール | 120 | 0.3 ms | 0% | 5% |
| Text View、スクロール | スクロール | 120 | 0.7 ms | 0% | 5% |
| Images、スクロール | スクロール | 120 | 0.4 ms | 0% | 5% |
| Components、スクロール | スクロール | 120 | 0.3 ms | 0% | 5% |
| Overlays、スクロール | スクロール | 120 | 0.3 ms | 0% | 4% |
| Menus、スクロール | スクロール | 120 | 0.3 ms | 0% | 5% |
| Controls | トランジション | 120 | 0.3 ms | 0% | 4% |
| Web and video、スクロール | スクロール | 120 | 0.2 ms | 0% | 6% |
| System | `requestAnimationFrame`、タイマー | 120 | 0.2 ms | 0% | 3% |
| Standard APIs、スクロール | スクロール | 120 | 0.3 ms | 0% | 5% |
| Storage、スクロール | スクロール | 120 | 0.3 ms | 0% | 5% |

</div>

<a id="memory-1"></a>

### メモリ

起動 3 秒後の安止状態の値です(リリースのランナー)。*Footprint* は macOS がそのプロセスに計上するメモリ(アクティビティモニタに表示される値)です。*Resident* にはこれに加えて、システムの共有ライブラリのページが含まれます。

<div class="data-table">

| アプリ | ウィンドウ | Footprint | Resident (RSS) |
|---|---|---|---|
| Rust アプリ(`nsh init --template rust`) | 1200 × 800 | 約 19 MB | 約 86 MB |
| TSX カウンター(`examples/counter`) | 1200 × 800 | 約 20 MB | 約 89 MB |
| 参考: ラベル 1 つだけの AppKit ウィンドウ | 480 × 640 | 約 17 MB | 約 80 MB |

</div>

gallery のツアー中、プロセスのメモリ使用量は Canvas ページまでは 84〜230 MB、Text View ページ以降は約 350〜360 MB です。これは、意図的にキャッシュするもの(デコード済み画像は上限 128 MB、Text View ページのドキュメント)と、初回使用時に読み込まれるフレームワーク(Web ビュー用の WebKit)によるものです。Canvas ページのラスタは、3 つの canvas がすべて画面に表示されているときで最大約 310 MB になり、ページを閉じると解放されます。
<a id="app-size-1"></a>

### アプリのサイズ

`nsh init` が各テンプレートで作成した hello world アプリを、`nsh package --target macos` が Apple silicon (arm64) 向けにビルドしたもの（Linux と同様にリンク時最適化とストリップを適用）と、上記の 2 つのアプリを Apple silicon 向けの配布形態のまま計測しました。実行ファイルは `.app` 内のランナーです。zip は `.app` を圧縮したものです（`ditto -c -k`）:

<div class="data-table">

| アプリ | 記述言語 | 実行ファイル | zip 圧縮後 `.app` |
|---|---|---|---|
| Hello world (`--template rust`) | Rust | 12.4 MB | 6.0 MB |
| Hello world (`--template ts`) | TSX（QuickJS 上） | 19.8 MB | 9.5 MB |
| Hello world (`--template mixed`) | TSX と Rust クレート | 19.8 MB | 9.5 MB |
| [sysmon](https://github.com/huacnlee/sysmon) 0.1.3 | Rust | 21.6 MB | 8.4 MB（リリースの `.tar.gz`） |
| [Omasend](https://github.com/huacnlee/omasend) 0.2.0 | Rust | 18.4 MB | 9.7 MB（リリースの `.tar.gz`） |

</div>

これらの数値を支えている仕組み:

- **変更があるときだけフレームを生成**: ディスプレイリンクはネイティブアニメーションの実行中のみティックし、アニメーションの終了とともに停止します。アニメーションはそのページとともに停止します（ビューが削除されるとそのキーフレームは終了し、ループはコンポーネントの `cleanup` で停止します）。
- **キャンバスはコストが最も低い場所で描画**: 頻繁に描画されるキャンバス（アニメーションやライブデータ）は Core Animation のスレッド（`drawsAsynchronously`）で描画され、メインスレッドを空けておけます。たまにしか再描画されないキャンバスは即座に描画され、非同期描画が保持するグラフィックスメモリを使いません。アニメーションする値が変わると、その値を読み取る操作がカバーする領域だけが再描画されます。
- **静的なキャンバス部分を保持**: 描画内容が変わらなくなると、最初のアニメーション操作より前にある長い部分がレイヤーとして保持されます。各フレームではそのレイヤーを描画し、アニメーションする残りの部分だけをメインスレッド上で即座に再生します（Canvas ページのゲージ、時計、ドットマトリクスでは、GPU 処理が不要になりメモリは半分になります）。
- **内容が変わったときだけ描画**: テキストとキャンバスはそれぞれ専用のレイヤーに描画され、内容やサイズが変わったときに再描画されます。移動やスクロールでは再描画されません。

## Windows (Win32, Direct2D)

Windows 11 デスクトップ（Intel Core i7-13700KF、32 GB、NVIDIA GeForce RTX 3060 Ti）の 4K 144 Hz ディスプレイ（150%）で、リリースビルド、ギャラリーは 1200 × 800 のウィンドウ（1800 × 1200 ピクセル）として計測しました。すべての値は `examples/gallery/tools/perf.py`（`nsh test --target windows --fps`、1 秒に 1 行）によって自動的に取得しています。CPU はプロセス全体で、1 コアに対するパーセントです。各フェーズはメインスレッドの 1 フレームあたりの値で、*paint*（Direct2D によるウィンドウの描画）と、その内数の *canvas*（描画の記録と再生）があります。

<a id="animated-demos-2"></a>

### アニメーションのデモ

<div class="data-table">

| デモ | FPS | フレーム p95 | フレームあたりの paint / canvas | CPU |
|---|---|---|---|---|
| Stocks: ライブのスパークライン 22 本、日中チャート、板、歩み値 | 144 | 3.7–4.3 ms | 1.4 / 0.13 ms | 36–43% |
| Canvas: ゲージ、時計、ドットマトリクス | 144 | 1.0–2.0 ms | 0.8–1.4 / 0.05 ms | 21–35% |
| Animations: 3 つのネイティブループ、スプリング、シーケンス | 144 | 1.0–3.6 ms | 0.9–1.9 ms | 20–41% |

</div>

Stocks は毎秒 16～17 回コミットし、各コミットはエンジンスレッド上で最大 2.1 ms の JS と 1.7 ms のコアで処理されます（p95）。

> [!NOTE]
> 大きな領域にわたってビューを動かすアニメーションがあるページは、Linux や macOS よりも CPU 使用率が高くなります（Animations は 5–13% に対して 20–41%、Gestures は 1–5% に対して 36%）。Windows では、フレームごとに、変更された領域にあるすべてのビューをメインスレッド上で Direct2D により再描画します。たとえば、拡大するリングは、フレームのたびにその下にあるカードを再描画します。macOS では Core Animation が保持しているレイヤーを、再描画せずに GPU 上で移動、拡大縮小、フェードします。Linux では GSK が変更のなかったレンダーノードを保持します。また、この数値は 1800 × 1200 ピクセルで毎秒 144 フレームを描画した場合のものです。

<a id="every-page-2"></a>

### すべてのページ

ギャラリーのすべてのページについて、同じ 1200 × 800 のウィンドウで、ページを開いたときとテストがスクロールしている間を計測しました。Linux や macOS と同様に、*FPS* は何かが動いている間のレートです（描画されたフレーム間隔の中央値あたり 1 フレーム）。ディスプレイの 144 Hz では、アニメーションやスクロールのフレームはすべて直前のフレームの 1 リフレッシュ後に届きます。*1 リフレッシュ超過*は、フレームが 1 リフレッシュ（6.9 ms）より長くかかった割合です。静止しているページはフレームを描画せず、CPU 使用率は 0–2% です。Images の GIF と WebP はそれぞれ固有のフレームレート（ここでは約 40 FPS）で再生されます。Physics、Overlays、Menus、Storage は、スクロールの余地がある 900 × 500 のウィンドウで計測しています。

<div class="data-table">

| ページ | フレームの発生源 | FPS | フレーム p95 | 1 リフレッシュ超過 | CPU |
|---|---|---|---|---|---|
| Stocks | ライブデータ、ネイティブループ | 144 | 3.9 ms | 0% | 36% |
| Stocks, scrolling | ライブデータ、スクロール | 144 | 4.3 ms | 0% | 43% |
| Photos, scrolling | スクロール | 143 | 2.1 ms | 0% | 9% |
| Lists, scrolling | スクロール | 144 | 2.0 ms | 1% | 19% |
| Scrolling, scrolling | スクロール | 143 | 2.1 ms | 0% | 7% |
| Navigation, scrolling | スクロール | 144 | 0.8 ms | 0% | 9% |
| Form, scrolling | スクロール | 144 | 0.8 ms | 0% | 12% |
| Resizable, scrolling | スクロール | 143 | 0.4 ms | 0% | 4% |
| Dock, scrolling | スクロール | 144 | 0.5 ms | 1% | 5% |
| Gestures | スプリング、脈動するリング | 144 | 1.8 ms | 0% | 36% |
| Physics, scrolling | スクロール（900 × 500 のウィンドウ） | 144 | 0.8 ms | 0% | 4% |
| Animations | ネイティブループ | 144 | 1.0 ms | 0% | 28% |
| Canvas, scrolling | スクロール、ネイティブループ | 144 | 2.0 ms | 0% | 35% |
| Styles, scrolling | スクロール、揺れる transform | 144 | 2.1 ms | 0% | 39% |
| Tailwind | `animate-*` ユーティリティ | 144 | 0.6 ms | 0% | 19% |
| Text, scrolling | スクロール | 144 | 1.6 ms | 0% | 8% |
| Text View, scrolling | スクロール | 144 | 1.1 ms | 0% | 10% |
| Images, scrolling | スクロール、GIF と WebP のフレーム | 143 | 4.8 ms | 2% | 23% |
| Components, scrolling | スクロール | 144 | 1.0 ms | 1% | 11% |
| Overlays, scrolling | スクロール（900 × 500 のウィンドウ） | 144 | 0.6 ms | 0% | 1% |
| Menus, scrolling | スクロール（900 × 500 のウィンドウ） | 144 | 0.6 ms | 0% | 2% |
| Controls | トランジション | 117–144 | 1.5 ms | 0% | 22% |
| Web and video, scrolling | スクロール | 144 | 1.6 ms | 0% | 15% |
| System | `requestAnimationFrame`、タイマー | 144 | < 0.1 ms | 0% | 1% |
| Storage, scrolling | スクロール（900 × 500 のウィンドウ） | 144 | 0.5 ms | 0% | 1% |

</div>

<a id="memory-2"></a>

### メモリ

起動 3 秒後の静止時の値です（リリースランナー、1200 × 800 のウィンドウ）。*プライベートワーキングセット*はプロセスだけが使用するメモリ（タスクマネージャーの「メモリ」列）、*プライベートバイト*はプロセスがコミットしたメモリ、*ワーキングセット*はそれに加えて、他のプロセスと共有するシステムライブラリ（Direct3D、Direct2D、DirectWrite、GPU ドライバー）のページを含みます:

<div class="data-table">

| アプリ | プライベートワーキングセット | プライベートバイト | ワーキングセット |
|---|---|---|---|
| Rust アプリ (`nsh init --template rust`) | 約 14 MB | 約 60 MB | 約 53–71 MB |
| TSX カウンター (`examples/counter`) | 約 15 MB | 約 61 MB | 約 56–71 MB |

</div>

ギャラリーのツアー中のワーキングセットは、Stocks で約 108–115 MB、Canvas ページから約 230 MB、Text View ページから約 320–340 MB、Web and video が WebView2 を開いた後で約 390–405 MB になります（WebView2 のページは WebView2 自身のプロセスで動作します）。これには意図的にキャッシュしているもの（デコード済み画像は 128 MB が上限、Text View ページのドキュメント）が含まれます。

<a id="app-size-2"></a>

### アプリのサイズ

`nsh init` が各テンプレートで作成した hello world アプリを、`nsh package --target windows` が x86_64 向けにビルドしたもの（Rust ランナーは Linux と同様にリンク時最適化とストリップを適用）です。実行ファイルはアプリの `<Name>.exe` です。zip はそのディレクトリの隣に書き出される `.zip` です:

<div class="data-table">

| アプリ | 記述言語 | 実行ファイル | zip |
|---|---|---|---|
| Hello world (`--template rust`) | Rust | 15.0 MB | 6.7 MB |
| Hello world (`--template ts`) | TSX（QuickJS 上） | 28.6 MB | 12.4 MB |
| Hello world (`--template mixed`) | TSX と Rust クレート | 26.3 MB | 11.5 MB |

</div>

これらの数値を支えている仕組み:

- **変更があるときだけフレームを生成し、変更された場所だけを描画**: コンポジターに同期したティッカーは、ネイティブアニメーション、トランジション、またはフレームコールバックの実行中に動作します。1 フレームでは、変更されたビューの領域（以前の位置と現在の位置）を、ウィンドウが保持しているピクセルの上に描画し、その部分だけをコンポジターに提示します（Stocks: 1 フレームあたり約 34 ビュー）。
- **キャンバスはアニメーションする部分を記録**: 描画は Direct2D のコマンドリストとして記録され、どの倍率でもベクターのままシャープに表示されます。アニメーションする値が変わると、アニメーションする値を最初に読み取る操作以降だけが再記録され、それより前の部分は保持されます（Stocks: 脈動するスパークライン 22 本とチャートで、1 秒あたり約 26 ms の記録）。
- **見えているものだけを描画**: スクロールビューやクリッピングビューの子のうち、視界の外にあるものはフレームから除外されます。自身のコンテンツを持たないビューは、背景と枠線以外を描画しません。

## iOS (UIKit)

iOS シミュレーター（iPhone 18 Pro Max、前述の MacBook Pro 上）で、リリースビルド、同じツアー（`perf.py --target ios`: `nsh test --target ios --fps`、UIKit が受け取る指のタッチ）を使って計測しました。シミュレーターは 60 Hz で表示します。ProMotion 搭載の iPhone では、NSH のディスプレイリンクは画面の 120 Hz で動作します（`nsh package` がビルドするアプリと開発ホストは、`CADisableMinimumFrameDurationOnPhone` でこれを要求します）。各フェーズは *tick*（ネイティブアニメーション）、*drain*（エンジンのバッチの適用）、*scroll*（スクロールビューに追従する処理: リスト、スティッキーセル、バインドされた値）です。

<div class="data-table">

| ページ | フレームの発生源 | FPS | フレーム p95 | CPU |
|---|---|---|---|---|
| Home, scrolling | スクロール | 60 | 0.1 ms | 6% |
| Stocks | ライブデータ、ネイティブループ | 60 | 0.3 ms | 22% |
| Stocks, scrolling | ライブデータ、スクロール | 60 | 0.3 ms | 25% |
| Photos, scrolling | スクロール | 60 | 1.2 ms | 6% |
| Lists, scrolling | スクロール | 60 | 1.1 ms | 8% |
| Scrolling, scrolling | スクロール | 60 | 0.1 ms | 7% |
| Navigation, scrolling | スクロール | 60 | 0.2 ms | 7% |
| Form, scrolling | スクロール | 60 | 0.3 ms | 7% |
| Gestures | スプリング、脈動するリング | 60 | 0.3 ms | 3% |
| Animations | ネイティブループ | 60 | 0.7 ms | 6% |
| Canvas | ネイティブループ | 60 | 0.4 ms | 16% |
| Styles | 揺れる transform | 60 | 0.4 ms | 4% |
| Tailwind, scrolling | スクロール | 60 | 0.2 ms | 7% |
| Text, scrolling | スクロール | 60 | 0.1 ms | 7% |
| Text View, scrolling | スクロール | 60 | 0.1 ms | 6% |
| Images, scrolling | スクロール | 60 | 0.1 ms | 5% |
| Components, scrolling | スクロール | 60 | 0.2 ms | 6% |
| Overlays, scrolling | スクロール | 60 | 0.1 ms | 6% |
| Menus, scrolling | スクロール | 60 | 0.2 ms | 7% |
| Controls, scrolling | スクロール、トランジション | 60 | 0.2 ms | 5% |
| Web and video, scrolling | スクロール | 60 | 0.1 ms | 8% |
| System | `requestAnimationFrame`、タイマー | 60 | 0.3 ms | 4% |
| Standard APIs, scrolling | スクロール | 60 | 0.1 ms | 7% |
| Storage, scrolling | スクロール | 60 | 0.1 ms | 8% |

</div>

*FPS* は前述と同じく、何かが動いている間のレートです。シミュレーターの 60 Hz では、すべてのフレームが直前のフレームの 1 リフレッシュ後に届きます。何も動いていないページはフレームを描画せず、静止時の CPU 使用率は 1–2% です。プロセスのメモリ使用量は、ギャラリーのホームページで 40 MB、ツアー全体の後で約 180 MB です（意図的にキャッシュしている画像と、Text View ページのドキュメントを含みます）。

iPhone 17 Pro（ProMotion、120 Hz）で、開発ホストと 1 つのデモを画面に表示した状態では、アニメーションするページはリフレッシュのたびに描画します:

<div class="data-table">

| ページ | フレームの発生源 | FPS | フレーム p95 | 1 リフレッシュ超過 | CPU | メモリ |
|---|---|---|---|---|---|---|
| Stocks | ライブデータ、ネイティブループ | 120 | 0.2–0.3 ms | 0% | 46–70% | 41–43 MB |
| Canvas | ネイティブループ | 120 | 0.1 ms | 0% | 25–36% | 37–38 MB |
| Animations | ネイティブループ | 120 | 0.2 ms | 0% | 3–11% | 37 MB |

</div>

Stocks は毎秒 20 回コミットし（50 ms ごとのティック）、各コミットはエンジンスレッド上で 1.5 ms の JS と 1.4 ms のコアで処理されます（p95 はそれぞれ 2.2 ms と 2.0 ms）。エンジンスレッドの稼働率は 4–6% です。

<a id="measuring-an-app"></a>

## アプリを計測する

同じ方法でアプリを計測するには、`--target linux`、`macos`、`windows`、`ios` のいずれかで、`--fps` と `-v` を使ってテストまたはステップを実行します:

```sh
cargo build --release -p nsh-cli
python3 examples/gallery/tools/perf.py --target macos --only Stocks,Canvas   # the gallery, page by page
echo 'await app.wait(5000)' | nsh -v test App.tsx --target linux --fps        # any app
```
