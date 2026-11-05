---
title: "CLI"
description: "NSH のすべてのサブコマンドとフラグ - init、build、test、check、dev、run、package、および署名コマンドの keygen、certify、publish、verify、symbolicate、revoke。"
order: 6
group: start
source_hash: 2fe1bbb5b3e5cfb9
---

# CLI

`nsh`は、RustまたはTSXでNSHアプリをビルドするためのツールです。アプリをビルドするすべてのサブコマンドは`[ENTRY]`を受け取ります。これはアプリのディレクトリ(デフォルトはカレントディレクトリなので、`cd my-app && nsh run`で動作します)で、Rustアプリのルートコンポーネント(`nsh.json` `"root"`)、TSXアプリの`App.tsx`、またはTSXエントリモジュールを実行します。アプリのルートにある`nsh.json`を読み込み、`.nsh/types`の型宣言を更新します。

```text
nsh <COMMAND>

  init         Create an app in Rust or TSX
  build        Build an app: describe a Rust app's crates, or bundle a TSX app and compile it to QuickJS bytecode
  test         Run an app's tests headless, and its Rust crates' with cargo test
  check        Type check an app with TypeScript's native compiler, and its Rust crates with cargo check
  dev          Serve an app to dev hosts (simulators, devices) and push rebuilds
  run          Like dev, and also run the app in a development host
  package      Package an installable app from the prebuilt runtime
  keygen       Create a signing key
  certify      Certify a release key with a root key
  publish      Build an app in release mode and sign it into a package (.nshpkg)
  verify       Verify a package
  symbolicate  Map the positions in a reported error stack to the app's sources
  revoke       Sign a revocation list
```

`nsh <command> --help`はコマンドのフラグを表示します。`nsh -V`(`--version`)はバージョンと、ビルド元のGitリビジョンを表示します。

<a id="output"></a>

## 出力

すべてのコマンドは、ステップごとに1行を出力し、詳細は失敗したときだけ表示します。

```text
✓ built the Rust crate gallery-native (5.0s)
✓ built App.tsx (500 B js, 809 B bytecode, 21ms)
✓ built the development host for the iOS simulator (12.7s)
• iOS Simulator (iPhone 16 Plus) connected, build 1
warn iOS Simulator: image failed: An SSL error has occurred and a secure connection to the server cannot be made.
✓ rebuilt App.tsx (18ms), 1 device
```

`✓`は完了したステップ、`→`は接続先、`•`はデバイスの動作を表します。`warn`と`error`の行は問題を示し、通常の行はアプリ自身の出力(`console.log`)です。ターミナルでは、実行中のステップがスピナーで表示され、行には色が付きます(`NO_COLOR`が設定されている場合を除く)。ファイルにリダイレクトした場合は、結果の行だけが色なしで書き込まれます。
NSHが実行するツール(アプリのRustクレート用のcargo、開発ホスト)の出力は、いずれかが失敗したときに`error`の行の下に表示されます。

`-v, --verbose`(任意のコマンドで使用可能。`NSH_VERBOSE=1`も同様)は、すべてを出力された順に表示します。レベルとソースが付いたすべてのログ行、cargoの出力、ホスト自身の出力が対象です。

## nsh init

```sh
nsh init [DIR] [--name <NAME>] [--template <ts|rust|mixed>] [--nsh-source <DIR>]
```

テンプレートから`DIR`(デフォルトはカレントディレクトリ。存在しない場合は作成されます)にアプリを作成します。`--template`を指定しない場合、`nsh init`はターミナルではどのテンプレートを使うか尋ね(Enterで`ts`を選択)、それ以外(スクリプト、CI)では`ts`を使用します。

| テンプレート | 作成されるもの |
|---|---|
| `rust` | Rustで書かれたアプリ。Cargoプロジェクト(`Cargo.toml`、ルートコンポーネントを持つ`src/lib.rs`、`cargo run`用の`src/main.rs`)、`"rust": "."`と`"root": "App"`を持つ`nsh.json`、`tsconfig.json`と`.nsh/types`を持つルートのテスト`App.test.tsx`、`.gitignore`、およびREADMEが作成されます。READMEには、後からTSXエントリを追加する方法も記載されています。`nsh run`と`nsh package`は、QuickJSなしですべてのターゲット(ブラウザを含む)でルートをマウントします(`nsh test`はTypeScriptテスト用にルートを開きます)([Rustでのビルド](./rust.md))。`cargo run`は、macOS、Windows、Linuxで直接起動します。 |
| `ts` | TSXアプリ。`App.tsx`、そのテスト`App.test.tsx`(`nsh test`)、`nsh.json`、`tsconfig.json`、`.gitignore`、`.nsh/types`が作成されます。既存のファイルは保持され、すべてのファイルがすでに存在する場合にのみ失敗します。 |
| `mixed` | ルートに専用のRustクレートを持つTSXアプリ。`App.tsx`、そのテスト`App.test.tsx`、`tsconfig.json`、`"rust": "."`を持つ`nsh.json`、`.gitignore`、`.nsh/types`、README、および`App.tsx`と並ぶクレート(`Cargo.toml`、`src/lib.rs`)が作成されます。その`#[native_module("<name>/native")]`は、`App.tsx`が使用するコンポーネント、モジュール、クラスをエクスポートします。`"root"`を指定しない場合、`App.tsx`がエントリになります。 |

| フラグ | 説明 |
|---|---|
| `--name <NAME>` | `nsh.json`に書き込まれる表示名。デフォルトはディレクトリ名です。idは`com.example.<name>`(英数字のみ、小文字)になり、クレートのインポート指定子は`<name>/native`(小文字、単語を`-`で連結)になります。 |
| `--template <TEMPLATE>` | `rust`、`ts`、または`mixed`(上記)。`rust`と`mixed`にはRustが必要です。`cargo run`には、ネイティブデスクトップバックエンドの開発ライブラリも必要です。 |
| `--nsh-source <DIR>` | `rust`または`mixed`と併用する場合:クレートは、`DIR`にあるチェックアウトのNSHクレートにパスで依存し、NSHのソースに対してアプリをビルドします。 |

`rust`と`mixed`のクレートは、CLIのバージョンに対応するcrates.ioのNSHクレートに依存します(`--nsh-source`を指定した場合は、チェックアウトのクレートに依存します)。`nsh`コマンドは、同じクレートからアプリのランナーとホストをビルドします。このようなアプリに対する各コマンドの実行前に、`nsh`はアプリのクレートとNSHのコアから小さなプログラムをビルドして、それらのコンポーネント、モジュール、クラスを記述し、クレートが変更されていればそれを実行します。この記述を使って、CLI自身がアプリのバンドル、コンパイル、型チェック、配信、パッケージ化を行います。Rustアプリのビルドでは、アプリのクレートとNSHのコアだけがコンパイルされます。これらは新しいアプリディレクトリに作成してください。これらのファイルが1つでも存在する場合は、何かが書き込まれる前に競合として報告されます。

RustクレートがGit経由でNSHに依存するアプリは、アプリのロックファイルでCargoが解決したチェックアウトを使用します。生成されるホストはそのチェックアウトを共有します。これには、アプリのCargoパッチによってリダイレクトされたNSHの依存関係も含まれます。

## nsh run

```sh
nsh run [ENTRY] [--target catalyst|ios|android|macos|linux|windows|gpui|web] [--device <DEVICE>] [--port <PORT>] [--release] [--limits [<LIMITS>]] [--trace] [--fps] [--name <NAME>] [--window-size <WIDTHxHEIGHT>] [--display <N>]
```

```sh
nsh run my-app                     # a Rust app's root, or a TSX app's App.tsx, on this machine's backend
nsh run my-app --target ios        # in the iOS simulator
nsh run my-app/App.tsx --target web
```

TSXエントリの場合、`nsh run`はdevサーバーを(`nsh dev`と同様に)起動し、そこからアプリを読み込む開発ホストを起動して、保存のたびに再ビルドします。Hot Module Replacementは実行中のアプリをその場でパッチします。アプリのログとエラーはターミナルに出力されます。Ctrl-C(またはCatalyst、macOS、Linux、Windows、GPUIのウィンドウを閉じる)で停止します。どのような終了の仕方(Ctrl-C、`kill` / `pkill`、エラー)でも、起動したホスト(Catalystアプリ、macOS、Linux、Windows、GPUIのホスト、シミュレータ内の開発ホスト、またはAndroidデバイス上の開発ホスト)は停止されます。

Rustアプリ(`nsh.json` `"root"`、[Rustでのビルド](./rust.md))は、devサーバーもQuickJSも使わずに実行されます。`nsh run`は、ルートをマウントした状態でターゲット用のアプリのランナーをビルドして起動し(デスクトップではデバッグビルドで、ログはターミナルに出力されます。シミュレータとAndroidではアプリがインストールされます)、クレートのRustコードが変更されると再度ビルドして再起動します。`--target web`を指定するとページのアドレスが出力され、開いているページは新しいランタイムを自動的に読み込みます。代わりにTSXエントリを実行するには、そのエントリ(`nsh run App.tsx`)を指定します。

| フラグ | デフォルト | 説明 |
|---|---|---|
| `--target <TARGET>` | macOSでは`macos`、Linuxでは`linux`、Windowsでは`windows` | `catalyst`: Mac Catalystホスト。iPhoneサイズのウィンドウ(390×844)。`ios`: iOSシミュレータ内のホスト。`android`: AndroidデバイスまたはエミュレータのAndroid上のホスト。`macos`: AppKitホスト。1200×800のウィンドウ([macOS](./macos.md))。`linux`: GTKホスト。390×844のウィンドウ([Linux](./linux.md))。`windows`: Win32ホスト。1200×800のウィンドウ([Windows](./windows.md))。`gpui`: GPUIホスト。macOS、Windows、Linuxで1200×800のウィンドウとして、GPUIアプリが埋め込んだ場合と同じ形でTSXアプリを表示します([GPUI](./gpui.md))。`web`: 出力されるアドレスにあるdevサーバーのページ([Web](./web.md#develop-in-the-browser))。 |
| `--device <DEVICE>` | | 使用するiOSシミュレータを、名前(`"iPhone 16 Pro"`)またはUDIDで指定します。デフォルトは、起動済みのもの、なければ最新のiPhoneで、これが起動されます。 |
| `--port <PORT>` | `8790` | devサーバーのポート。クリーンアップの完了後、このポートにある以前のNSH開発セッションを置き換えます。 |
| `--release` | | 最小化し、デバッグ情報を削除します。リリースバンドルにはHot Module Replacementがなく、保存のたびにアプリが再読み込みされます。 |
| `--limits [<LIMITS>]` | | ホストアプリが設定する制限の範囲内で、アプリを別のアプリに埋め込まれたアプリとして実行します。`memory`と`stack`(`KB`、`MB`、または`GB`内)、`load`と`call`(`ms`または`s`内)、および`--limits memory=128MB,call=500ms`などの`nodes`が対象です。指定されなかったものは埋め込みのデフォルトのままで、`--limits`だけを指定した場合はそれで実行されます([サンドボックスとケイパビリティ](./sandbox-and-capabilities.md#limits))。指定しない場合、アプリはパッケージ化されたアプリと同様に単独で実行されます。TSXエントリのみ。 |
| `--trace` | | ホストが、すべてのコミット(JS、レイアウト、マウントアイテム)のタイミングをターミナルに記録します。 |
| `--fps` | | パフォーマンスモニター。フレームレート、フレームとコミットのコスト、CPU、GPU、メモリを、macOSではアプリの上に表示し([macOS](./macos.md#performance-monitor))、macOS、Linux、Windows、iOSでは毎秒1回ログに出力します。 |
| `--name <NAME>` | `nsh.json`の名前 | メニューバーのアプリケーション表示名と、ウィンドウの初期タイトル(`--target macos`、TSXエントリ)。 |
| `--window-size <WIDTHxHEIGHT>` | ホストのデフォルト | ポイント単位のウィンドウの初期サイズ(例: `800x600`)(`--target macos`、`linux`、`windows`、`gpui`、TSXエントリ)。 |
| `--display <N>` | メインディスプレイ | ウィンドウを中央に開くディスプレイ。`1`はプライマリディスプレイ(メニューバーのあるもの)、`2`は次のディスプレイ、以降も同様です。該当するディスプレイがない番号を指定した場合は、メインディスプレイに開きます(`--target macos`、TSXエントリ)。 |

`--target android`を指定した場合、`adb devices`が一覧表示する最初のデバイスが使用され、devサーバーのポートは`adb reverse`でそのデバイスに転送されます。[はじめに](./getting-started.md#run-it)と[devサーバーとデバッグ](./dev-server-and-debugging.md)を参照してください。

置き換えでは、前のセッションがクリーンアップを終えるまで最大10秒待機します。別のプログラムまたは古いNSH CLIがポートを使用している場合は、そのポートを示すエラーになります。複数のアプリを同時に実行するには、異なる`--port`の値を使用してください。`--port 0`を指定すると、OSに空きポートを割り当てさせます。

## nsh dev

```sh
nsh dev [ENTRY] [--target catalyst|ios|android|macos|linux|windows|gpui|web] [--device <DEVICE>] [--server-only] [--port <PORT>] [--release] [--limits [<LIMITS>]]
```

devサーバーを起動し、このシステムのネイティブホスト(macOSではAppKit、LinuxではGTK、WindowsではWin32)を開きます。モバイル開発では、`--target ios`または`--target android`を明示的に選択してください。`--server-only`は、自分で起動したホストに対してサーバーを提供します。サーバーはアプリをビルドし、エントリのディレクトリを監視して、再ビルドのたびに接続中のホストへプッシュします。`--server-only`を指定すると、このマシン上のホスト用のURLと、デバイス用にLANアドレスごとのURLを出力します。Webランタイムがある場合は、ブラウザがアプリを実行するために開くページも出力されます([Web](./web.md#develop-in-the-browser))。

```text
✓ built App.tsx (3.2 KB js, 9.8 KB bytecode, 21ms)
→ dev server ws://127.0.0.1:8790/ws
  browsers: http://127.0.0.1:8790/
  devices on this network: ws://192.168.1.20:8790/ws
  browsers on this network: http://192.168.1.20:8790/
```

開発SDK(`NativeShellDev.xcframework`、`nsh-dev.aar`)を埋め込んだアプリでは、`nsh dev --server-only`を使用します。`--target`、`--device`、`--port`、`--release`、`--limits`は`nsh run`と同様に動作します。`--server-only`は、ホストを起動しないサーバーを選択します。

## nsh test

```sh
nsh test [PATH] [--filter <NAME>] [--trace] [--fps] [--junit <FILE>] [--target <TARGET>] [--browser <PATH>] [--web-host <JS>] [--display <N>]
```

アプリのテストをヘッドレスで実行します([テスト](./testing-and-trace.md))。対象は、`PATH`にあるテストファイル(`*.test.tsx`、`*.test.ts`、`nsh/test`をインポート)、ディレクトリ(デフォルトはカレントディレクトリ。隠しディレクトリ、`node_modules`、`target`はスキップされます)、またはテストファイル`PATH`です。専用のRustクレートを持つアプリ(`nsh.json` `"rust"`: Rustアプリ、またはクレートを持つTSXアプリ)のディレクトリを指定した場合は、まずディレクトリ内の各クレートに対して、そのクレート自身のディレクトリで`cargo test`を実行し、各Rustテストを、そのテストターゲットのファイル(`src/lib.rs › tests::adds`)の下に、TypeScriptテストとともに表示して集計します。Rustのテストだけを持つRustアプリも、この方法でテストされます。各テストファイルは専用のエンジンで実行され、テストが開く各アプリは、さらに別の新しいエンジンで実行されます。テストごとに1行を出力し、失敗については、スローされた内容、テストファイル内の位置、画面上のテキストを出力します。失敗が1つでもあると、ゼロ以外のコードで終了します。アプリのエントリ(`nsh test App.tsx`。Rustアプリの場合は`nsh test nsh.json`)を指定した場合は、アプリをネットワーク上で開き、1.2秒間実行させて、標準入力で与えられたステップを実行します(`await app.press("Add")`。`app`がアプリです)。TSXアプリはCLI自身のプロセスで実行されます。専用のRustクレートを持つアプリは、それらとともにビルドされたヘッドレスランナーで実行され、CLIがそのためのエントリをビルドします。ヘッドレス実行は、テストがアプリをAndroidとして開く場合(`open`の`platform`)を除き、iOSとして動作します。`platform.os`は`"ios"`で、`ios:`クラスと`ios={{…}}`プロパティが適用されます。

```text
✓ App.test.tsx › counts taps (321ms)
✓ 1 test: 1 passed, 0 failed (343ms)
```

| フラグ | 説明 |
|---|---|
| `--filter <NAME>` | 名前(それが含まれる`describe`ブロックの名前の後の部分)に`NAME`を含むテストだけを実行します。クレートの場合は`cargo test <NAME>`です。 |
| `--trace` | テストが開くアプリのすべてのマウントバッチを、それが発生したステップ(`── press(Add): 7 items`)の下に出力するとともに、すべてのコミットの時間(最初のフレーム、ステップ、スクロールのフレームにかかるコスト)も出力します。`--target`を指定すると、ホストのバッチとタイミングが出力されます。 |
| `--fps` | `--target linux`、`macos`、`windows`、または`ios`と併用する場合:ホストがパフォーマンスモニターの値(フレームレート、フレームのフェーズ、コミット、CPU、メモリ)を毎秒1回ログに出力し、`-v`で表示されます。 |
| `--junit <FILE>` | 結果をJUnit XMLレポート(CIサービスがテスト結果を表示する形式)として`FILE`にも書き込みます。テストファイルごとに`testsuite`、テストごとに`testcase`が出力されます。 |
| `--target <TARGET>` | テストが開くアプリを、ヘッドレスではなく、このプラットフォームの開発ホストで実行します(`macos`、`linux`、`windows`、`gpui`、`web`、`ios`、`android`。`web`はヘッドレスのChrome、Edge、Chromiumで実行します)。ステップはプラットフォーム独自の入力で動作し([テスト](./testing-and-trace.md#on-a-real-platform))、`open`はそのオプションをプラットフォームに照らして検証し、対応できないものは拒否します(`ERR_NSH_TEST_UNSUPPORTED`: iOSとAndroidでの`width`と`height`、別の種類のデバイスの`platform`)。クレートのRustテストは、`--target`なしの実行ではこのマシン上で実行されます。 |
| `--browser <PATH>` | `--target web`がアプリを実行するChrome、Edge、またはChromiumの実行ファイル(デフォルトはこのマシンにインストールされているもの)。 |
| `--display <N>` | `--target macos`と併用する場合:アプリのウィンドウを中央に開くディスプレイ。`1`はプライマリディスプレイ(メニューバーのあるもの)、`2`は次のディスプレイ、以降も同様です。該当するディスプレイがない番号を指定した場合は、メインディスプレイに開きます。デフォルトでは、テスト実行が専用の画面に収まるよう、セカンダリディスプレイ(プライマリ以外で最初のもので、そのミラーではないもの)に開き、ディスプレイが1つだけの場合はプライマリに開きます。テストはどのディスプレイでも同じように実行されます。 |
| `--web-host <JS>` | ヘッドレスで開かれたアプリが受け取る、Webページのホストモジュール(デフォルトは`nsh.json` `web.host`で、`createHost(player)`をエクスポートします)。アプリの[`host`](../modules/nsh.md#host)呼び出しに応答し、その`player.hostEvent`は`host.on`に到達します([テスト](./testing-and-trace.md#the-pages-host))。ヘッドレス実行のみ。`--target web`は`nsh.json`の`web.host`を実行します。 |
## nsh check

```sh
nsh check [ENTRY] [--tsc <TSC>] [-- <TSC ARGS>...]
```

アプリの型チェックを行います。独自の Rust クレートを持つアプリ（`nsh.json` `"rust"`）では、まず各クレートをそのディレクトリで `cargo check --all-targets` によりチェックします（テストも含みます）。Cargo がエラーを出すと、ゼロ以外のコードで終了します。Rust アプリ（`"root"`）は、その後、TypeScript がある範囲でチェックされます。`tsconfig.json`（`nsh init --template rust` が `App.test.tsx` 用に書き出すもの）があれば、テストファイルも型チェックされます。TypeScript のチェックでは `.nsh/types` と `.nsh/tsconfig.json` を更新し、アプリの `tsconfig.json` を指定して `tsc -p <app directory> --noEmit` を実行します。ネイティブコンパイラである TypeScript 7 を使うため、Node は不要です。初回実行時に npm レジストリからダウンロードし（約 9 MB）、NSH が記録しているチェックサムと照合したうえで、NSH のキャッシュ（macOS では `~/Library/Caches/nsh`、Linux では `~/.cache/nsh`、Windows では `%LOCALAPPDATA%\nsh`、または `NSH_CACHE`）に保存します。型エラーがあると、ゼロ以外のコードで終了します。`tsconfig.json` が `./.nsh/tsconfig.json` を拡張していない場合は警告します。NSH はこのファイルに TypeScript の設定を置いています（[プロジェクト構成](./project-structure.md#tsconfigjson-and-nshtypes)）。

| フラグ | 説明 |
|---|---|
| `--tsc <TSC>` | 代わりにこの `tsc` を実行します（`NSH_TSC` でも指定可）。たとえば `node_modules` のものや、ネットワークのないマシン向けのコピーなどです。 |
| `-- <TSC ARGS>` | `tsc` にそのまま渡されます。例: `nsh check -- --pretty false`。 |

NSH が生成するファイルは `.nsh/` 以下に置かれます。宣言、ランナーのソース、デフォルトのビルド／パッケージ出力は
`.nsh/out/` に置かれます。Cargo は通常の `target/` キャッシュと既存の `CARGO_TARGET_DIR` の動作をそのまま使い、NSH はこれを移動するための
Cargo 設定を追加しません。`--out` を指定すれば、出力先を引き続き上書きできます。

## nsh build

```sh
nsh build [ENTRY] [-o <OUT>] [--release] [--split]
```

アプリをビルドします。Rust アプリ（`nsh.json` `"root"`）では、アプリのクレートをビルドして記述し、`app.json` と、クレートが同梱するファイル（`assets/`）を書き出します。ランナーはこのルートをマウントします。TSX アプリでは、アプリをバンドルして QuickJS バイトコードにコンパイルします。これは、NSH を組み込み、バンドルを自分で配布するアプリ向けです。

| フラグ | デフォルト | 説明 |
|---|---|---|
| `-o, --out <OUT>` | `.nsh/out` | 出力ディレクトリ。 |
| `--release` | | 最小化し、デバッグ情報を取り除きます。 |
| `--split` | | `import()` が読み込むものを独自のチャンクファイルに分け、最初にインポートされたときにダウンロードします（Web アプリ。[バンドルの分割](./web.md#split-bundles)を参照）。指定しない場合、バンドルにアプリ全体が含まれます。 |

次のファイルを書き出します。

| ファイル | 内容 |
|---|---|
| `bundle.js` | JavaScript としてのバンドル |
| `bundle.js.map` | そのソースマップ（スタックトレースは元のソースに対応付けられます） |
| `bundle.nshc` | コンパイル済みバイトコードとしてのバンドル。アプリが読み込むものです |
| `<Chunk>.js`, `<Chunk>.js.map`, `<Chunk>.nshc` | `--split` 指定時: 各チャンク、そのソースマップ、そのバイトコード（`import("./Screen")` の場合は `Screen.js`） |
| `capabilities.json` | `nsh.json` の `capabilities`（宣言されている場合。なければ削除されます） |
| `assets/` | インポートされたすべての画像とフォント。アプリルートからの相対パスに置かれます |

## nsh package

```sh
nsh package [ENTRY] --target ios|ios-simulator|android|macos|linux|windows|web [-o <OUT>] [flags]
```

インストール可能なアプリをリリースモードでビルドします。Rust アプリ（`nsh.json` `"root"`）は、自身のランナーでパッケージ化されます。ランナーは、あなたのクレートと NSH のクレートから Cargo でビルドされ、ルートをマウントし、QuickJS は使いません（[Rust でのビルド](./rust.md)）。TSX アプリは、ビルド済みのランタイムでパッケージ化されます。Xcode プロジェクトや Gradle ビルドは不要です。NSH がアプリバンドルを自分で組み立て、iOS では Xcode の `actool` と `codesign`、Android では SDK の `aapt2`、`zipalign`、`apksigner` を使います。macOS では `codesign` により ad hoc 署名された `.app` を組み立てます（アイコンには `sips` を使います）。Linux ではランナーをコピーし、`tar` を含む `.tar.gz` を書き出します。Windows ではランナーをコピーし、アイコンを埋め込んで `.zip` を書き出します。ツールは不要です。Web では静的サイトを書き出します。ツールは不要です。メタデータは `nsh.json` から取得され、フラグで上書きされます。

| フラグ | 説明 |
|---|---|
| `--target <TARGET>` | 必須。`ios`: iOS 実機向けの、署名済み `.ipa`（`--sign` がなければ署名なしの `.app`）。`ios-simulator`: ad hoc 署名された `.app`。`android`: 署名済み `.apk`。`macos`: ad hoc 署名された `.app`（[macOS](./macos.md#packaging)）。`linux`: ディレクトリ `<Name>/`（実行ファイル、`nsh/`、`.desktop` ファイル）と `<Name>.tar.gz`（[Linux](./linux.md#packaging)）。`windows`: ディレクトリ `<Name>\`（`<Name>.exe`、`nsh\`）と `<Name>.zip`（[Windows](./windows.md#packaging)）。`web`: ディレクトリ `<Name>/`、静的サイト（`index.html` と、内容にちなんで名付けられたファイル）（[Web](./web.md#publish-an-app)）。 |
| `-o, --out <OUT>` | 出力ディレクトリ（デフォルトは `.nsh/out`）。 |
| `--name <NAME>` | 表示名。 |
| `--id <ID>` | バンドル識別子。例: `com.example.app`。 |
| `--app-version <VERSION>` | バージョン。例: `1.2.0`。 |
| `--build <BUILD>` | ビルド番号。 |
| `--icon <ICON>` | アプリアイコン。正方形の PNG で、1024×1024 が理想です。 |
| `--sign <IDENTITY>` | iOS 実機: コード署名 ID。例: `"Apple Development: …"`。 |
| `--profile <FILE>` | iOS 実機: プロビジョニングプロファイル（`.mobileprovision`）。エンタイトルメントはここから取得されます。 |
| `--keystore <FILE>` | Android: リリース用キーストア。デフォルトは `~/.android/debug.keystore` のデバッグキーです（なければ作成されます）。 |
| `--key-alias <ALIAS>` | Android: キーストア内のキーエイリアス。 |
| `--keystore-password <PASSWORD>` | Android: キーストアのパスワード。`NSH_KEYSTORE_PASSWORD` からも読み取られます。 |
| `--abi <ABI>` | Android: APK の ABI（`arm64-v8a`、`armeabi-v7a`、`x86_64`）。繰り返し指定するか、カンマ区切りで指定します。デフォルトは `arm64-v8a` と `armeabi-v7a` で、`--run` を指定するとデバイスの ABI も加わります。 |
| `--run` | 完了後にアプリをインストールして起動します。シミュレータ（`ios-simulator`）または接続中の Android デバイスで行います。`macos`、`linux`、`windows` では起動のみ行います。`web` では、表示されるアドレスでこのマシン上にサイトを配信します。 |

```sh
nsh package my-app --target ios-simulator --run
nsh package my-app --target ios --sign "Apple Development: Jane Doe (ABCDE12345)" --profile dev.mobileprovision
nsh package my-app --target android --keystore release.jks --key-alias upload
nsh package my-app --target macos
nsh package my-app --target linux
nsh package my-app --target windows
nsh package my-app --target web
```

[パッケージング](./packaging.md)を参照してください。

<a id="signing-commands"></a>

## 署名コマンド

これらのコマンドは、署名付きパッケージ（`.nshpkg`）を作成・検証します。署名付きパッケージとは、NSH を組み込むアプリが、実行前にダウンロードして検証するアプリバンドルです。[署名付きパッケージ](./signed-packages.md)で、そのモデル（オフラインのルートキーが、特定のアプリ ID に対してリリースキーを認証する）を説明しています。

### nsh keygen

```sh
nsh keygen <NAME>
```

Ed25519 のキーペア `<NAME>.secret` と `<NAME>.pub`（例: `nsh keygen keys/root`）を作成します。ルートの `.secret` はオフラインで保管してください。アプリは、その `.pub` を信頼します。

### nsh certify

```sh
nsh certify --root <ROOT.secret> --key <KEY.pub> --apps <PATTERN>... [--days <DAYS>] -o <OUT>
```

ルートキーで、特定のアプリ ID と期間についてリリースキーを認証します。パッケージにはこの証明書が含まれます。

| フラグ | 説明 |
|---|---|
| `--root <ROOT>` | ルートの秘密鍵。 |
| `--key <KEY>` | リリースキーの公開鍵。 |
| `--apps <APPS>` | 署名を許可するアプリ ID: `*`、`com.example.*`、または ID。複数回指定できます。 |
| `--days <DAYS>` | 署名を許可する期間（現在から）。デフォルトは 365。 |
| `-o, --out <OUT>` | 書き出す証明書。 |

### nsh publish

```sh
nsh publish [ENTRY] --key <KEY.secret> --cert <CERT> [-o <OUT>] [--id <ID>] [--app-version <V>] [--build <N>]
            [--source-map package|file|none] [--strip-debug] [--min-runtime <VERSION>]
```

アプリをリリースモードでビルドし、署名してパッケージにします。メタデータは `nsh.json` から取得され、フラグで上書きされます。

パッケージ（`ENTRY` は `.nshpkg` ファイル）が指定された場合は、プラットフォームが自らのアプリのパッケージを独自の 1 つのキーで署名するのと同様に、そのパッケージをこのキーで署名し直します。パッケージのファイルとヘッダーはそのままで、証明書、署名時刻、署名が新しいキーのものになります（[署名付きパッケージ](./signed-packages.md#sign-a-package-again)）。`-o`
には読み込むパッケージを指定でき、`--key`、`--cert`、`-o` のみが有効です。

| フラグ | 説明 |
|---|---|
| `--key <KEY>` | リリースキーの秘密鍵。 |
| `--cert <CERT>` | その証明書（`nsh certify`）。 |
| `-o, --out <OUT>` | 書き出すパッケージ。デフォルトは `.nsh/out/<id>-<build>.nshpkg`。 |
| `--id <ID>` | アプリ ID。 |
| `--app-version <VERSION>` | バージョン。 |
| `--build <BUILD>` | ビルド番号。リリースごとに増やす必要があります。 |
| `--source-map <WHERE>` | ソースマップの置き場所: `package`（デフォルト）、`file`（`<package>.map` をパッケージの隣に置く）、または `none`（[署名付きパッケージ](./signed-packages.md#errors-from-published-packages)）。 |
| `--strip-debug` | 行・列テーブルをバイトコードから省きます。サイズは小さくなりますが、エラーのスタックに位置情報が含まれなくなります。 |
| `--min-runtime <VERSION>` | パッケージを実行できる最低限のランタイム。例: `0.2.0`。これより古いランタイムは実行を拒否します。デフォルトはこの CLI のバージョンです（[署名付きパッケージ](./signed-packages.md#which-runtimes-run-a-package)）。 |

### nsh verify

```sh
nsh verify <PACKAGE> [--root <ROOT.pub>]... [--revocations <LIST>]
```

指定されたルートを信頼するアプリと同じ方法でパッケージを検証します。`--root` がない場合は、パッケージ自体の署名のみを確認します。パッケージの SHA-256 を出力し、これは `nsh revoke --package` で指定できます。

### nsh symbolicate

```sh
nsh symbolicate <MAP> [INPUT]
```

パッケージが報告したエラーのバンドル上の位置（`bundle.js:LINE:COL`）を、元のソースの位置に書き換えて結果を出力します。
`MAP` はソースマップ（`nsh publish --source-map file`、`bundle.js.map` の `<package>.map`）か、それを含む
パッケージです。`INPUT` はエラーのテキストです（デフォルトは標準入力）。

### nsh revoke

```sh
nsh revoke --root <ROOT.secret> [--extend <LIST>] [--sequence <N>] [--key <ID>]... [--package <SHA256>]... -o <OUT>
```

失効リストに署名します。これは、もう読み込んではならないリリースキーとパッケージのリストです。

| フラグ | 説明 |
|---|---|
| `--root <ROOT>` | ルートの秘密鍵。 |
| `--extend <EXTEND>` | このリスト（最後に公開されたもの）のエントリを引き継ぎます。 |
| `--sequence <N>` | リストの番号。これまでに公開されたどの番号よりも大きくします。`--extend` 指定時のデフォルトは、そのリストの番号に 1 を足した値です。 |
| `--key <ID>` | 失効させるリリースキー ID。複数回指定できます。 |
| `--package <SHA256>` | 失効させるパッケージの SHA-256。複数回指定できます。 |
| `-o, --out <OUT>` | 書き出すリスト。 |

<a id="environment-variables"></a>

## 環境変数

| 変数 | 使用するコマンド | 説明 |
|---|---|---|
| `ANDROID_HOME`, `ANDROID_SDK_ROOT` | Android ターゲット | Android SDK。フォールバック: `~/Library/Android/sdk`。 |
| `CARGO_TARGET_DIR` | Rust クレートを持つアプリ | アプリのランナーをビルドする場所。デフォルトはアプリの `target/`。 |
| `NSH_KEYSTORE_PASSWORD` | `package --target android` | キーストアのパスワード。 |
| `NSH_RUNTIME` | `run`, `package` | CLI の隣にあるものの代わりに使うランタイムディレクトリ。 |
| `NSH_VERBOSE` | すべてのコマンド | `1`: `--verbose` と同様。 |
| `NSH_WASM_BINDGEN` | `run`, `package`（`--target web`） | クレートが[ブラウザ API を呼び出す](./web.md#browser-apis-from-rust)アプリ向けの `wasm-bindgen` CLI。デフォルトは `PATH` にあるもの。 |
| `NO_COLOR` | すべてのコマンド | 設定すると、ターミナルで色を使いません。 |
