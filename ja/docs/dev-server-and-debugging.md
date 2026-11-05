---
title: "開発サーバーとデバッグ"
description: "nsh run と nsh dev で Rust と TSX のアプリを実行し、シミュレーター、エミュレーター、実機に接続して、リビルド、ホットモジュールリプレースメント (HMR)、ログ、エラーオーバーレイ、ソースマップ付きスタックトレースを利用します。"
order: 60
group: tools
source_hash: bce9f1fee0870b27
---

# 開発サーバーとデバッグ

開発中、NSH は保存のたびにアプリをビルドします。Rust アプリ(`nsh.json` が `"root"` を指定します)は専用のランナーとしてビルドされ、`nsh run` がそれを起動します。そのクレートを変更すると再びビルドされ、アプリが再起動します。TSX アプリは接続中のすべてのホストにプッシュされ、ホストはその場で更新されます。これを行うコマンドは 2 つあります。

- `nsh run` はアプリをビルド**して**起動します。Mac Catalyst または AppKit のウィンドウ、Linux では GTK ウィンドウ、Windows では Win32 ウィンドウ、iOS シミュレーター、Android デバイスまたはエミュレーター、あるいはブラウザーのページです。TSX の場合は、開発ホストが接続する開発サーバーも起動します。
- `nsh dev --server-only` は、自分で起動するホスト向けに TSX の開発サーバーを起動します。開発 SDK を組み込んだ自分のアプリ、ネットワーク上のデバイス、複数のホストの同時接続などが対象です。

```sh
# A Rust app, from its directory
nsh run                             # AppKit window (macOS); GTK window (Linux); Win32 window (Windows)
nsh run --target ios                # iOS simulator
nsh run --target android            # Android device or emulator

# A TSX app
nsh run App.tsx                     # AppKit window (macOS); GTK window (Linux); Win32 window (Windows)
nsh run App.tsx --target macos      # AppKit window (macOS)
nsh run App.tsx --target ios        # iOS simulator
nsh run App.tsx --target android    # Android device or emulator
nsh dev App.tsx --server-only       # server only
```

`nsh dev` は、デフォルトでネイティブホストも開きます。モバイルホストでは `--target ios` または `--target android` を使います。

## `nsh run`

| Flag | Description |
|---|---|
| `--target <catalyst \| ios \| android \| macos \| linux \| windows \| gpui \| web>` | 実行先。デフォルトは macOS (AppKit) では `macos`、Linux では `linux`、Windows では `windows` です。Rust アプリはそのすべてで動作しますが、`gpui` だけは例外で、これはルートを GPUI アプリ ([GPUI](./gpui.md)) に埋め込みます。 |
| `--device <name or UDID>` | 使用する iOS シミュレーター。デフォルトは、起動済みのもの。なければ最新の iPhone(自動的に起動されます)。 |
| `--port <port>` | 開発サーバーのポート。デフォルトは 8790 で、使用中の場合は次に空いているポートが使われます。 |
| `--release` | TSX のリリースビルドを配信します(minify 済み、デバッグ情報なし、ホットアップデートなし)。 |
| `--trace` | ホスト上のすべてのコミットの時間をログに出力します(TSX アプリ)。 |

各ターゲットの動作は次のとおりです。

- **`catalyst`**(macOS)は、開発ホストを Mac アプリとして実行します。`nsh run` を停止する(Ctrl-C、または `kill`)とホストが閉じ、ウィンドウを閉じると `nsh run` が終了します。
- **`macos`**(macOS)は、AppKit の開発ホストを 1200×800 のウィンドウのデスクトップアプリとして、同様に実行します。Cmd+R で最新のビルドを再読み込みします。macOS 14 以降が必要です ([macOS](./macos.md))。
- **`linux`**(Linux)は、GTK の開発ホストを 390×844 のウィンドウで、同様に実行します。`nsh run` を停止するとホストが閉じ、ウィンドウを閉じると `nsh run` が終了します。GTK 4.14 以降が必要です ([Linux](./linux.md))。
- **`windows`**(Windows)は、Win32 の開発ホストを 1200×800 のウィンドウで、同様に実行します。コンソールを閉じた場合でも、ホストが `nsh run` より長く残ることはありません。Windows 10 1809 以降が必要です ([Windows](./windows.md))。
- **`ios`** は、開発ホストをシミュレーターにインストールし、開発サーバーを指すように起動して、監視を続けます。シミュレーターは Mac のネットワークを共有するため、ホストは `127.0.0.1` でサーバーに到達できます。`nsh run` を停止する(Ctrl-C)とホストが閉じます。閉じないと、そのホストが次のセッションに参加してしまうためです。Xcode が必要です。
- **`android`** は、開発ホストの APK をインストールし(ランタイムが変更された場合のみ再インストール)、デバイス自身の `127.0.0.1` がサーバーに到達できるように `adb reverse tcp:<port> tcp:<port>` を実行してから、ホストを起動します。エミュレーターでも USB デバイスでも動作します。Android SDK (`ANDROID_HOME`) が必要です。`nsh run` が終了すると(Ctrl-C も含む)、ホストを停止してそのポートフォワーディングを削除するため、ホストが次のセッションに参加することはありません。

`nsh run` は、どのように終了した場合でも、自分が起動したホストを停止します。Catalyst アプリを終了し、macOS・Linux・Windows のホストを閉じ、シミュレーター上の開発ホストを終了し、デバイス上のホストは強制停止します。

Rust アプリでは、各ターゲットがそのアプリ自身のランナーを、そのクレートとともにビルドして実行します。デスクトップではデバッグビルドをその場で実行し、出力はターミナルに表示されます。iOS と Android ではそのパッケージをインストールします。TSX の場合、ホストは汎用的で、サーバーが送る任意の NSH アプリを実行するため、アプリごとにビルドするものはありません(独自のクレートを持つアプリには、そのクレートとともにビルドされたホストが使われます)。

## `nsh dev`

```sh
nsh dev App.tsx
```

```text
✓ built App.tsx (3.2 KB js, 9.8 KB bytecode, 21ms)
→ dev server ws://127.0.0.1:8790/ws
  devices on this network: ws://192.168.1.20:8790/ws
```

| Flag | Description |
|---|---|
| `--port <port>` | 開発サーバーのポート。デフォルトは 8790 です(使用中の場合は次に空いているポート)。 |
| `--release` | リリースビルドを配信します。 |

表示された URL にホストを接続します。

- **自分の iOS アプリ**(`NativeShellDev.xcframework` をリンクしたもの):
  `try app.connectDevServer(URL(string: "ws://192.168.1.20:8790/ws")!)`。[Embedding in iOS apps](./ios.md#development) を参照してください。
- **自分の Android アプリ**(`nsh-dev.aar` を使用):`nsh.connectDevServer("ws://192.168.1.20:8790/ws")`、または
  `adb reverse tcp:8790 tcp:8790` と `ws://127.0.0.1:8790/ws`。[Embedding in Android apps](./android.md#development) を参照してください。

いくつでもホストを同時に接続でき、すべてのビルドが全ホストに送られます。後から接続したホストには、現在のビルドがすぐに送られます。アプリが import している UI セットを持たないなど、アプリを実行できないホスト(別のアプリ用にビルドされた開発ホストなど)にはビルドは送られません。そのホストは理由を表示し、ターミナルには、そのアプリのホストをインストールするコマンドとともに `warn` の行が出力されます。

> [!NOTE]
> LAN 上のデバイスは、開発サーバーのポートでお使いのコンピューターに到達できる必要があります。同じネットワーク上にあり、間にファイアウォールがないことが条件です。
> アセット(画像、フォント)は、同じポートからプレーンな HTTP で配信されます。

<a id="rust-edits"></a>

## Rust の編集

Rust はコンパイル言語です。アプリのクレート、またはパスで依存しているクレートを変更すると、アプリが再びビルドされ、`nsh run` が新しいコードでアプリを再起動します。アプリの状態は最初からやり直しになるため、再起動後も残す必要があるものは[ストレージ](../modules/nsh.md#storage)に保存してください。ビルドエラーはターミナルに表示され、次にコンパイルが通る保存で再び実行されます。Rust と TSX の両方を含むアプリでは、TSX の編集はホットアップデート(後述)のままで、Rust の編集ではアプリが再起動します。

## Hot module replacement

TSX の開発ビルドは、ソースファイルごとに 1 つのモジュールを保持します。保存すると、NSH は再ビルドし、直近の正常なビルドとモジュールを比較して、変更されたモジュールだけを含む**パッチ**を送ります。ホストはこれをその場で 1 ミリ秒未満で適用します。ファイルを保存してから変更が表示されるまでは、おおよそ 120 ms です。

アプリでは次のことが起こります。

- **編集したコンポーネントだけが再レンダリングされます。** すべてのトップレベルコンポーネント(JSX を返す、先頭が大文字の関数)は、安定したプロキシでラップされます。そのコードが変更される(または、そのコンポーネントが使うかもしれない、モジュール内の他のコードが変更される)と、そのインスタンスが新しいコードで再レンダリングされます。コードが変わっていないコンポーネントはインスタンスを保持し、シグナルや状態もそのまま残ります。ボタンのスタイルを編集しても、画面はそのままの位置に留まり、入力テキストもスクロール位置も変わりません。
- **変更されたモジュールは再実行されます。** 変更されたモジュールを import していて、更新を単独では受け取れないモジュールも、エントリーまで再実行されます。したがって、状態を保持するもの以外のモジュールレベルのコードは再実行されます。
- **トップレベルのシグナルとナビゲーションスタックは状態を保持します。** モジュールの先頭で `signal(…)` または `createNavStack(…)` によって作られた `const` は、その初期化子が同じである限り、編集をまたいでも値(スタックの場合はそのページ)を保持します。最初からやり直したい場合は、初期化子を変更します(`signal(0)` から `signal(10)` へ)。
- **トップレベルの `context()` オブジェクトは同一性を保ち**、新しいデフォルト値を取り込むため、異なるモジュール間でもプロバイダーとコンシューマーの対応が維持されます。
- **エントリーを編集しても、アプリはマウントされたままです。** `mount(App)`(または `mount(() => <App />)`)が同じコンポーネントで再実行された場合、マウント済みのものが保持され、編集したコンポーネントだけが再レンダリングされます。`App` 自体を編集すると、それが描画するもの(それらの状態は最初からやり直しになります)とともに再レンダリングされますが、モジュールの先頭で作られたナビゲーターはルートを保持するため、プッシュされた画面はプッシュされたままです。変更された `mount` 呼び出し(別のコンポーネント、props)は、アプリを再度マウントします。
- **例外を投げるコンポーネント**はエラーを報告し、修正されるまで何も描画しません。アプリの他の部分は動き続けます。次に正常な保存が行われると回復します。

次の場合、ホストはパッチを適用せず、**アプリ全体を再読み込み**します。

- 変更によって、実行中のアプリがまだ import していない NSH モジュールが import される場合(たとえば、最初の `import … from "nsh"`)。
- `nsh.json` 内のアプリの `capabilities` が変更された場合。
- ホストが、パッチの基になっているビルドを実行していない場合(接続したばかり、または前回の読み込みが失敗した場合)。
- パッチを適用できない場合。

> [!TIP]
> コンポーネントが自身のシグナルに保持している状態は、そのコンポーネント、またはそれを描画するコンポーネントが編集されるとリセットされます。編集をまたいで残す必要がある状態は、トップレベルのシグナル(またはストアモジュール)に保持し、ナビゲーターはモジュールの先頭で作成してください。

`--release` はホットアップデートなしでリリースビルドを配信し、保存のたびにアプリが再読み込みされます。minify されたビルドを確認するために使います。開発サーバーから読み込まれたものは、`--release` かどうかにかかわらず、ランタイムのハードニング(`eval` は引き続き利用可能)をスキップします。詳しくは[Sandbox and capabilities](./sandbox-and-capabilities.md#hardening)を参照してください。

<a id="logs"></a>

## ログ

Rust アプリは `log` クレート(`log::info!`、`log::warn!`、`log::error!`)でログを出力します。`nsh run` は、デスクトップと iOS シミュレーターでは、アプリの出力とともにそれらの行をターミナルに表示します。

TSX では、`console.log`、`console.info`、`console.debug`、`console.warn`、`console.error` がターゲット `js` でネイティブログに出力されます。ホストが接続されている間、そのログ行は `nsh run` / `nsh dev` を実行しているターミナルに転送されます。`console.log` の行はそのまま(複数のデバイスが接続されている場合はデバイス名を先頭に付けて)、警告とエラーはデバイス名の後に表示されます。

```text
• iPhone 16 Pro connected, build 1
loading more after 1000
warn iPhone 16 Pro: deprecated option
error iPhone 16 Pro: uncaught exception: TypeError: cannot read property 'id' of undefined
          at Row (demos/Photos.tsx:18:22)
```

`console.log` は、ブラウザーのコンソールと同様に値をフォーマットします。文字列はそのまま、エラーはスタック付き、関数は名前、オブジェクトと配列は JSON です。ホストが接続されていない場合、ログはプラットフォームのログに出力されます(iOS では Xcode のコンソール / unified log、Android では `adb logcat`)。

reject された Promise に、その reject を引き起こした処理の完了時(マイクロタスクの実行後)でもハンドラーが付いていない場合は、ブラウザーの報告と同じように、エラーとしてログに出力されます。たとえば、誰も await していない間に例外を投げる `async` 関数、誰も catch しない `Promise.reject(…)`、待機しているものがないまま失敗する Rust への呼び出しなどです。この行は `console.error` の出力先(ターミナル、プラットフォームのログ、Web ではブラウザーのコンソール)に出力され、スタックはあなたのソースを指します。

```text
error iPhone 16 Pro: unhandled rejection: Error: HTTP 404
          at loadProfile (App.tsx:12:11)
```

同じターン内で後から付けられたハンドラー(`const p = load(); …; p.catch(…)`)は、処理されたものとみなされます。失敗が重要な場所では、Promise を await するか、`.catch` を付けてください。

ターミナルの残りの出力は、ステップごとに 1 行です(`✓` は完了、`→` は接続先、`•` はデバイスの動作)。NSH が実行するツール(cargo、ホスト自体)の出力は、失敗したときにのみ表示されます。`nsh run -v`(または `NSH_VERBOSE=1`)はすべてを出力します。レベルとソース付きのすべてのログ行、cargo の出力、ホスト自身の出力です。

`--trace` は、すべてのコミットのコストを追加します。

```text
perf commit: 10 ops, 151µs (list js 2µs), 8 mount items, 27 nodes
```

これらの数値の意味については、[Testing](./testing-and-trace.md)を参照してください。

<a id="the-error-overlay"></a>

## エラーオーバーレイ

次のエラーは、ホスト上でアプリの上に、メッセージとスタックを含む赤いオーバーレイとして表示されます。

- ビルドの失敗(構文エラー、未知の要素、import の欠落など)。該当行を指すコードフレームが表示されます。
- バンドルの評価中のエラー。
- イベントハンドラー、タイマー、エフェクトでの未捕捉の例外。

オーバーレイをタップすると閉じます。次の再読み込みが成功したときにも消えます。ビルドの失敗はターミナルにも出力されます。

```text
error building App.tsx failed
App.tsx

  x <Buton> names nothing in scope
   ,-[3:11]
 2 | function App() {
 3 |   return <Buton />;
   :           ^^^^^
 4 | }
```

バンドラーは TypeScript の型を検査せずに除去します。型エラーについては、[`nsh check`](./cli.md#nsh-check)(`tsconfig.json` の `nsh init` が書き出す、TypeScript のネイティブコンパイラー。Node は不要)を実行するか、エディターに頼ってください。

リリースビルド(リリース SDK を使う組み込みアプリ、パッケージ化されたアプリ)では、エラーはログに出力され、ホストアプリのエラーハンドラー(`NshAppView.onError`、`NshView.setErrorListener`)に渡されますが、アプリの上には表示されません。

<a id="source-maps-and-stack-traces"></a>

## ソースマップとスタックトレース

バンドル時には、すべての段階(TypeScript → JSX → バンドル)を合成したソースマップが生成され、各ビルドとともに送られます。スタックトレースが出力または表示される前に、ランタイムはバンドル上の位置をあなたのソースの位置に書き換えるため、スタックはバンドルではなく `App.tsx:2:28` を指します。

```text
error Mac Catalyst: uncaught exception: Error: tap boom
          at <anonymous> (App.tsx:2:58)
```

`nsh build` はマップを `bundle.js.map` として書き出します。フォルダーからバンドルを読み込む組み込みアプリは、バンドルの隣からそれを読み込みます。[署名付きパッケージ](./signed-packages.md)にもマップが含まれますが、パッケージの隣に別途保管して `nsh symbolicate` で適用する場合は除きます([Errors from published packages](./signed-packages.md#errors-from-published-packages))。

<a id="debugging-tips"></a>

## デバッグのヒント

- **編集しても何も更新されない**: ターミナルでビルドエラーを確認してください。オーバーレイでもホスト上に表示されます。
- **リセットされると思っていた古い状態がアプリに残る**: ホットリプレースメントは、変更されていないコンポーネントの状態、トップレベルのシグナル、ナビゲーターを意図的に保持します。Ctrl-C で停止して `nsh run` で再起動するか、状態の初期化子を変更してください。
- **リクエストがパッケージ化されたビルドまたは組み込みビルドでのみ失敗する**: アプリの[capabilities](./sandbox-and-capabilities.md)を確認してください。拒否された場合は、追加すべきキーとともにログに出力されます。
- **何かが遅い**: [`nsh test --trace`](./testing-and-trace.md)でヘッドレスで再現してください。これはすべてのネイティブビュー操作を出力します。または、TSX アプリを `--trace` 付きで実行してください。
- **エディターでの型エラー**: `nsh run` と `nsh dev` は `.nsh/types` を最新の状態に保ちます。[Project structure](./project-structure.md)を参照してください。

<a id="see-also"></a>

## 関連項目

- [CLI](./cli.md)
- [Testing](./testing-and-trace.md)
- [Embedding in iOS apps](./ios.md)、[Embedding in Android apps](./android.md)
