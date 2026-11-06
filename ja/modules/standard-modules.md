---
title: "標準モジュール"
description: "Node 形式の 11 個の標準モジュール: バージョン固定された LLRT ユーティリティと、機能チェック付きのファイル、プロセス、ネットワーク。"
order: 14.5
source_hash: d38790f1ea17287e
---

Native Shell は、TSX 向けに 11 個の標準モジュールを提供します。モジュールはベア名でインポートします（Rust コードは Rust 自身のライブラリを使います: [Rust から](#from-rust)）。これらは gpui-shell のものと互換性のある Node 形式の API で、アプリの VM 内で NSH のネイティブランタイム上で動作し、capability は Rust で検査されます。`.nsh/types` にある TypeScript 宣言はモジュールと同じ仕様から生成されるため、型が示す内容がそのままランタイムのエクスポートになります。

| モジュール | エクスポート |
|---|---|
| `buffer` | `Buffer`, `atob`, `btoa`, `constants`, default (LLRT)。`Buffer` はグローバルでもあります |
| `crypto` | `createHash`, `createHmac`, `randomBytes`, `randomFill`, `randomFillSync`, `randomInt`, `randomUUID`, `getRandomValues`, `webcrypto`, `crypto`, `Crc32`, `Crc32c`, `Md5`, `Sha1`, `Sha256`, `Sha384`, `Sha512`, default (LLRT)。`crypto` はグローバルでもあります |
| `path` | `basename`, `delimiter`, `dirname`, `extname`, `format`, `isAbsolute`, `join`, `normalize`, `parse`, `relative`, `resolve`, `sep`, default (LLRT) |
| `url` | `URL`, `URLSearchParams`, `domainToASCII`, `domainToUnicode`, `fileURLToPath`, `format`, `pathToFileURL`, `urlToHttpOptions`, default。`URL` と `URLSearchParams` は NSH のグローバルクラスです |
| `zlib` | `deflate`, `deflateRaw`, `inflate`, `inflateRaw`, `gzip`, `gunzip`, `brotliCompress`, `brotliDecompress`, `zstdCompress`, `zstdDecompress`。それぞれに `Sync` 形式があります, default (LLRT) |
| `os` | `platform()`, `arch()`, `homedir()`, `EOL`, default |
| `console` | default: VM の `console` (`log`, `info`, `debug`, `warn`, `error`) |
| `fs/promises` | `readFile`, `writeFile`, `readdir`, `exists`, `mkdir`, `rename`, `unlink`, `rmdir`, `stat`, `lstat`, `readlink`, default |
| `process` | `run`, `spawn`, `exit`, `platform`, `arch`, `nextTick`, `ChildProcess`, default。default オブジェクトには `env` と `dataDir` もあり、グローバルの `process` でもあります |
| `net` | `connect`, `Socket`, default |
| `websocket` | `WebSocketConnection` (`read`, `write`, `close(code?, reason?)`, `closeCode`, `closeReason`) に解決される `connect(url, options?)`, `WebSocketConnection`, default。ネイティブホストではグローバルの `WebSocket` コンストラクタ |

<a id="from-rust"></a>

## Rust から

Rust コードでは、アプリ自身のネイティブコード内で Rust の標準ライブラリと crates.io を使って同じ処理を行います。ブロッキング呼び出しは `blocking(…)` でランタイムのスレッド上で実行され、非同期呼び出しは `background(…)` (`nsh_core::prelude`) で実行されます。結果はタスクとしてコンポーネントに返されます。`nsh.json` の `capabilities` はアプリの TSX と NSH のサービス (`fetch`、クリップボード) を制御します。アプリ自身の Rust コードは、アプリのプロセスの権限で実行されます。ブラウザアプリでは、Rust コードは `fetch` でネットワークにアクセスし、`nsh_core::storage::Storage` でデータを保持します。

| モジュール | Rust |
|---|---|
| `buffer` | `Vec<u8>`, `&[u8]`, `base64` クレート |
| `crypto` | `sha2`, `hmac`, `rand`, `uuid` などのクレート |
| `path` | `std::path` |
| `url` | `url` クレート |
| `zlib` | `flate2`, `brotli`, `zstd` などのクレート |
| `os` | `std::env::consts`, `os()` |
| `console` | `log` クレート |
| `fs/promises` | `blocking(…)` 内の `std::fs`。キーバリューデータには `Storage` |
| `process` | `blocking(…)` 内の `std::process::Command` |
| `net` | `blocking(…)` 内の `std::net::TcpStream`、または `background(…)` 内の `tokio::net` |
| `websocket` | `background(…)` 内の `tokio-tungstenite` などのクレート |

<a id="imports-and-generated-types"></a>

## インポートと生成される型

各モジュールは、表にある名前そのままでインポートします: `import { join } from "path"`, `import fs from "fs/promises"`。バンドラーはこれらのインポートを保持し、ランタイムがネイティブに提供します。カタログはこの 11 個の名前です。`buffer`, `crypto`, `path`, `url`, `zlib` は LLRT の実装で、`d9fd873e793c6551c5d92b2e31480f3279e3cd8d` に固定されており、宣言はそのリビジョンから、ランタイムが持つエクスポートに絞って射影されています。それ以外は NSH 独自のものです。NSH は URL、Blob、ストリーム、イベントの各クラスの同一性を保ちます。

11 個のモジュールはすべて、ネイティブホストとブラウザアプリで読み込めます。`Buffer`、ハッシュ、暗号、圧縮は、同期 API も含めて、WebAssembly 上で同じ移植可能な Rust 実装を使います。乱数にはブラウザの暗号用エントロピーを使います。ブラウザの `path` 操作は POSIX パスと仮想的な `/` 作業ディレクトリを使います。ブラウザのファイルはアプリ専用の永続ストレージを使い、WebSocket はブラウザのトランスポートを使います。プロセスの実行と生の TCP 呼び出しは、ブラウザでは `code` `ERR_FEATURE_UNAVAILABLE_ON_PLATFORM` で失敗します。

<a id="how-they-compare-with-nodejs-and-gpui-shell"></a>

## Node.js および gpui-shell との比較

これらのモジュールは、エクスポートするサブセットについては Node の名前と形に従い、gpui-shell が動作を定めている部分ではその動作に従います。NSH 独自の選択は次のとおりです。

- `fs/promises` の `exists` は、リンク先が存在しないシンボリックリンクに対して `true` です。また `unlink`, `rename`, `rmdir`, `lstat`, `readlink` はシンボリックリンク自体に作用します。
- `Stats` と `Dirent` は、Node のものと同様に、フィールド (`size`, `mtimeMs`, `name`, ...) を自身のプロパティとして持ち、`isFile()`, `isDirectory()`, `isSymbolicLink()` をプロトタイプ上に持ちます。
- `ChildProcess` リスナーはイベントのペイロードを受け取ります。出力テキスト、または終了時の `{ code, signal }` です（ランタイムが子プロセスを終了させた場合は `error` と `errorCode` を伴います）。`on` は子プロセスを返します。`run` は `{ code, signal, stdout, stderr }` に解決されます。これは gpui-shell の出力に、子プロセスを終了させたシグナルを加えたものです。
- 子プロセスの環境は、ホストが提供する小さな変数セットに、アプリに許可された名前を加えたものです。子プロセスはアプリのデータディレクトリ、または `fs.write` ルート内の `cwd` で実行されます（[プロセス](#processes)）。
- `process.platform`, `process.arch`, `os.platform()`, `os.arch()` は、gpui-shell のものと同様に Rust の `std::env::consts` の名前を返します: `"macos"`, `"windows"`, `"linux"`, `"ios"`, `"android"`、および `"aarch64"`, `"x86_64"`（[OS メタデータ](#os-metadata-and-logging)）。
- `process.dataDir` は、ホストにデータディレクトリがない場合 `null` です。`process.exit` はホストにアプリのサーフェスを閉じるよう要求します。
- 制限は各 API の一部です。サイズ、件数、タイムアウトは、以下の各モジュールの項に記載しています。

<a id="failures"></a>

## 失敗の扱い

プロミスを返す関数は、Node の `fs/promises` と同様に、すべての失敗をプロミスの reject で報告します。不正な引数、アプリに許可されていないパスやホスト、使い切った制限、I/O エラーのいずれも同じなので、1 つの `catch`（または `.catch`）ですべて処理できます。同期関数（`process.spawn`, `process.exit`, `os.homedir`, `ChildProcess.write`、グローバルの `WebSocket` のコンストラクタ、および `send`）は例外をスローします。誤った使い方（型の違う引数、範囲外のオプション）は `TypeError` または `RangeError` になります。アプリが処理できるすべての失敗には `code` が付いており、これはリリース間で変わりません。メッセージは人間向けに書かれており、変更されることがあるため、アプリは `code` で分岐してください。

| `code` | 意味 |
|---|---|
| `ERR_ACCESS_DENIED` | アプリの `capabilities` がその呼び出しを許可していません。エラーには `permission`（`nsh.json` における capability のキー (`"fs"`, `"process"`, `"network"`)）と、`resource`（要求された対象: パス、コマンド（`"exit"`（`process.exit` の場合））、ソケットの `"host:port"`、または WebSocket の URL）が含まれます |
| `ERR_FEATURE_UNAVAILABLE_ON_PLATFORM` | その呼び出しは他のプラットフォーム向けです。ファイルはデスクトップとブラウザ、プロセスはデスクトップ、TCP ソケットはネイティブホスト、`os.homedir()` はホームディレクトリを設定しているホストで動作します |
| `ERR_NSH_QUOTA_EXCEEDED` | ランタイムの制限を使い切りました。実行中の操作またはデータ、子プロセス、ソケット、WebSocket、送信待ちのバイト数、リスナーなどです |
| `ETIMEDOUT` | 呼び出しがタイムアウトしました。`run` の `timeoutMs`、接続、WebSocket のハンドシェイク、書き込み、クローズなどです |
| `ENOENT`, `EEXIST`, `EACCES`, `ECONNREFUSED`, ... | オペレーティングシステムからの応答で、Node のコードを使います。`EACCES` と `EPERM` は、アプリの capability とは別に、OS がファイルを拒否したことを示します |
| `ERR_OUT_OF_RANGE`, `ERR_FS_FILE_TOO_LARGE`, `ERR_SOCKET_CLOSED`, `ERR_CHILD_PROCESS_STDIO_MAXBUFFER` | 制限を超えたサイズ、閉じられた接続、`run` のキャプチャ上限を超えた出力に対する Node のコードです |

```tsx
import fs from "fs/promises";

async function loadSettings(): Promise<string> {
  try {
    return await fs.readFile("${dataDir}/settings.json", "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return "{}";
    if (error.code === "ERR_ACCESS_DENIED") console.warn(`not granted: ${error.permission} ${error.resource}`);
    throw error;
  }
}
```

ホストアプリは、アプリが宣言した権限より少ない権限しか付与しないことがあります（[サンドボックスと Capabilities](../docs/sandbox-and-capabilities.md)）。そのため、アプリは `ERR_ACCESS_DENIED` を、失敗したリクエストと同じように扱ってください。

<a id="os-metadata-and-logging"></a>

## OS メタデータとログ出力

`os.platform(): string` と `os.arch(): string` は実際のネイティブホストの OS とアーキテクチャを報告し、`process.platform` と `process.arch` も同じ値を保持します。これらは gpui-shell のものと同様に Rust の `std::env::consts::OS` と `ARCH` の名前です。OS は `"macos"`, `"windows"`, `"linux"`, `"ios"`, `"android"`、アーキテクチャは `"aarch64"`, `"x86_64"` で、アプリはそれらと直接比較できます（`process.platform === "macos"`）。`os.EOL: string` はホストの改行文字列です。`os.homedir(): string` は設定済みのホームの絶対パスを返します。設定がない場合は、`code` `ERR_FEATURE_UNAVAILABLE_ON_PLATFORM` のエラーをスローします。ディレクトリパスはメタデータです。ファイル操作には引き続き `fs.read` / `fs.write` の許可が必要です。

ブラウザアプリでは `process.env` オブジェクトは空になり、`os.homedir()` は `ERR_FEATURE_UNAVAILABLE_ON_PLATFORM` をスローします。ホームパスと環境変数はネイティブホストのものだからです。

`import console from "console"` は VM のグローバルな `console` オブジェクトを共有します。このモジュールは default エクスポートのみで、`log`, `info`, `debug`, `warn`, `error` をサポートし、それぞれのシグネチャは `(...values: unknown[]): void` です。NSH のロガーのフォーマットを使います。

<a id="compression"></a>

## 圧縮

`zlib` は LLRT のもので、NSH が 1 つ上限を加えています。各解凍処理（`inflate`, `inflateRaw`, `gunzip`, `brotliDecompress`, `zstdDecompress` とその `Sync` 形式）が生成するのは最大 64 MiB、または VM のヒープ上限がそれより小さい場合はその上限までです。出力がそれより長い場合は、Node.js が `maxOutputLength` に対して行うのと同様に `RangeError` をスローします。アプリ自身の `maxOutputLength` を指定すると、その 1 回の呼び出しに対してより低い上限を設定できます。`Buffer.alloc`, `Buffer.allocUnsafe`, `Buffer.allocUnsafeSlow`, `crypto.randomBytes` は、VM のヒープ上限（上限がない場合は 1 GiB）を超えるサイズに対して `RangeError`（`code` `ERR_OUT_OF_RANGE`）をスローします。`allocUnsafe` はゼロ埋めされたメモリを返します。

<a id="files"></a>

## ファイル

`fs/promises` は、デスクトップホスト（macOS、Windows、Linux）ではネイティブファイルを、ブラウザでは Origin Private File System (OPFS) を通じてアプリ専用のブラウザファイルを読み書きします。すべてのパスは、操作の開始前に `capabilities.fs` に照らして検査されます。`readFile`, `readdir`, `stat`, `lstat`, `readlink`, `exists` には `read` のルート、`writeFile`, `mkdir`, `rename`, `unlink`, `rmdir` には `write` のルートが使われます。すべての失敗はプロミスを reject します。許可外のパスは、ディスクへのアクセスが行われる前に `code` `ERR_ACCESS_DENIED`（`permission` `"fs"`、`resource` はアプリが書いたままのパス）で reject されます。

```json
{
  "capabilities": {
    "fs": { "read": ["${dataDir}"], "write": ["${dataDir}"] }
  }
}
```

ルートは、絶対パス、`${dataDir}`（このアプリのデータディレクトリで、ホストが選びます）、`${pluginDir}`（アプリのディレクトリ）、`${homeDir}`、またはアプリのディレクトリからの相対パスです。呼び出しの相対パスは、許可された各ルートで順に解決されます。組み込み先のホストは、許可をさらに狭めることがあります。すべての操作は、シンボリックリンクを含め、許可されたルート内に留まります。絶対パスは書かれたとおりに検査されるため、ルートにはそのルート自身のパス（または解決済みのパス）で到達する必要があり、ルート外のリンク経由では到達できません。`lstat`, `readlink`, `exists`, `unlink`, `rename`, `rmdir` はシンボリックリンク自体に作用します。`exists` は、リンク先が存在しないシンボリックリンクに対して `true` であり、`unlink` はリンクを削除してリンク先は残します。

失敗には Node のエラープロパティが付きます。`code`（`ENOENT`, `EEXIST`, `ENOTDIR`, `EISDIR`, `ENOTEMPTY`, `ELOOP`, `EACCES`, `EPERM`, ...。UTF-8 でないテキストには `EILSEQ`、読み取り上限を超えた場合は `ERR_FS_FILE_TOO_LARGE`）、`syscall`、`path` があり、`error.code === "ENOENT"` でファイルが存在しない場合を区別できます。許可外のパスは `ERR_ACCESS_DENIED` で reject されます。iOS または Android での呼び出し（これらのアプリは [`Storage`](./nsh.md#storage) でデータを保持します）は `ERR_FEATURE_UNAVAILABLE_ON_PLATFORM` で、不正な引数（未知のエンコーディングやオプション）は `TypeError` で reject されます。

`readFile` は `Uint8Array` を返し、`"utf8"` を指定した場合は文字列を返します。読み取れるファイルは最大 64 MiB です。`writeFile` は、最大 8 MiB の文字列または `Uint8Array` を書き込み、通常ファイルを作成または置換します。`readdir` は最大 10 000 個の名前（合計 1 MiB まで。これより大きいディレクトリは `RangeError`、`code` `ERR_OUT_OF_RANGE` で reject されます）をソートして返し、`{ withFileTypes: true }` を指定した場合は `Dirent`（`name`, `isDirectory()`）を返します。`stat` と `lstat` は、`size`, `mode`, `mtimeMs` / `atimeMs` / `birthtimeMs`, `mtime` / `atime` / `birthtime` を `Date` として持ち、さらに `isFile()`, `isDirectory()`, `isSymbolicLink()` を持つ `Stats` に解決されます。`rmdir` は空のディレクトリを 1 つ削除します。1 つの VM が同時に実行できる操作は最大 1024 件で、処理中のファイルデータは最大 64 MiB です（`writeFile` に渡されて書き込まれるまでのデータ、およびプロミスが確定するまでの読み取りデータ）。これらの制限を超える呼び出しは `ERR_NSH_QUOTA_EXCEEDED` で reject され、8 MiB を超える `writeFile` は `RangeError`（`code` `ERR_OUT_OF_RANGE`）で reject されます。

ブラウザのストレージは、ページのオリジンとアプリ固有の名前空間にスコープされ、Rust で検査される同じファイル許可とサイズ制限が適用されます。OPFS には、HTTPS や localhost などのセキュアコンテキストが必要です。ファイルの更新時刻はブラウザのメタデータに由来し、不明なアクセス時刻・作成時刻とモードは 0 になります。`rename` はブラウザのアトミックなハンドル移動を使い、ブラウザがそれを提供しない場合は `ENOTSUP` を報告します。ブラウザのエントリは通常ファイルまたはディレクトリであり、`readlink` は `EINVAL` を報告します。
<a id="processes"></a>

## プロセス

`process.spawn` と `process.run` は、デスクトップホスト(macOS、Windows、Linux)でコマンドを起動します。ランタイムはシェルを介さず、引数配列を渡してプログラムを直接実行し、パイプを自身で管理します。stdout と stderr は UTF-8 の増分データとして届きます。

```json
{
  "capabilities": {
    "process": { "execute": ["git"], "env": ["GIT_AUTHOR_NAME"] },
    "fs": { "write": ["${dataDir}"] }
  }
}
```

コマンドは `process.execute` と完全に一致する必要があります。`git` と `/usr/bin/git` は別々の付与です。パスなしのコマンドは、ホストの `PATH` に含まれる絶対パスのディレクトリを通じて解決されます。Windows では、パスなしのコマンドはそこから `<name>.com` や `<name>.exe` も見つけます。バッチファイル(`.cmd`、`.bat`)は `cmd.exe` 経由で実行されます。その絶対パス(`C:\Windows\System32\cmd.exe`)を付与し、`/d`、`/c`、スクリプトを引数として渡してください。子プロセスの環境は、ホストの `PATH`、`HOME`、`USERPROFILE`、`SystemRoot`、`TEMP`、`TMP`、`TMPDIR`、`LANG`、`LC_*` に、`process.env` が付与する名前を加えたものです(名前は完全一致で照合され、大文字小文字を区別しないのは環境変数がそうである Windows のみです)。子プロセスはアプリのデータディレクトリ(存在しない場合は作成されます)、または `cwd`(`fs.write` ルート内にある既存のディレクトリ)で実行されます。子プロセスは実行場所に書き込める可能性があるためです。埋め込みホストは付与を絞り込むことができます。

```rust tabs
use std::{
    io::{BufRead, BufReader},
    process::{Command, Stdio},
};

spawn(async move {
    // `run`: the whole output once the command exits.
    if let Ok(Ok(output)) = blocking(|| Command::new("git").args(["status", "--short"]).output()).await {
        log::info!("{} {}", output.status, String::from_utf8_lossy(&output.stdout));
    }
    // `spawn` with `lines: true`: each line as it comes.
    let _ = blocking(|| -> std::io::Result<()> {
        let mut child = Command::new("git").args(["log", "--oneline"]).stdout(Stdio::piped()).spawn()?;
        if let Some(stdout) = child.stdout.take() {
            for line in BufReader::new(stdout).lines() {
                log::info!("{}", line?);
            }
        }
        log::info!("done {}", child.wait()?);
        Ok(())
    })
    .await;
});
```

```tsx tabs
import process from "process";

const { code, stdout } = await process.run("git", ["status", "--short"]);
const child = process.spawn("git", ["log", "--oneline"], { lines: true });
child.on("stdout", (line) => console.log(line));
child.on("exit", ({ code, signal }) => console.log("done", code, signal));
```

`run` はどの終了ステータスでも `{ code, signal, stdout, stderr }` で解決されます。`code` は終了ステータスで、`signal` は `null` です。シグナルによって子プロセスが終了した場合は、`code` が `null` となり、`signal` がシグナル名(`"SIGTERM"`)となります。失敗の場合は常に reject されます。`spawn` は子プロセスをすぐに返します。`stdin: "pipe"` は `write` と `end` を有効にし、`lines: true` は完全な行単位で配信します。`on(event, handler)` は子プロセスを返し、ハンドラーにはイベントのペイロードが渡されます。ペイロードはテキスト、または最終出力の後に一度だけ渡される `{ code, signal }` です(ランタイムが子プロセスを終了させた場合、つまりタイムアウトや長すぎる行の場合は `error` を伴います)(後から追加されたリスナーには即座に渡されます)。`pid` は子プロセスのプロセス ID です。`spawn` は、子プロセスの開始前に `run` が reject するものと同じエラーを throw します。`process.execute` が付与していないコマンドは `ERR_ACCESS_DENIED`(`permission` `"process"`、`resource` はコマンド)で失敗し、`fs.write` の付与の外にある `cwd` は `ERR_ACCESS_DENIED`(`permission` `"fs"`、`resource` は `cwd`)で失敗し、デスクトップ以外での呼び出しは `ERR_FEATURE_UNAVAILABLE_ON_PLATFORM` で、子プロセス数の上限を超えた呼び出しは `ERR_NSH_QUOTA_EXCEEDED` で失敗します。起動の失敗には `code`(実行ファイルが存在しない場合は `ENOENT`、OS が実行できない場合は `EACCES`)、`syscall`(`spawn <command>`)、`path` が含まれます。`run` は期限に達すると `ETIMEDOUT` で reject し、キャプチャ上限を超える出力に対しては `RangeError`(`code` `ERR_CHILD_PROCESS_STDIO_MAXBUFFER`)で reject します。spawn された子プロセスの終了には、同じメッセージが `error` に、そのコードが `errorCode` に含まれます。ホストにデータディレクトリがない場合、`process.dataDir` は `null` です。`kill`、タイムアウト、リアクティブオーナーのクリーンアップ、VM の破棄は、プロセスツリー全体を終了させます。Unix ではそのプロセスグループに SIGTERM が送られ、250 ms 後に SIGKILL が送られます(破棄時には即座に SIGKILL)。

| 上限 | 値 |
|---|---|
| `timeoutMs` | 最大 4,294,967,295 ms。`run` のデフォルトは 30 秒、`spawn` は終了まで実行 |
| `run` のキャプチャ | ストリームごとに 8 MiB |
| `lines: true` 使用時の 1 行 | 8 MiB |
| VM あたりの子プロセス数 | 32 |
| VM あたりの処理中の出力 | 8 MiB。リーダーは JS が受け取るまで待機 |
| 子プロセスあたりの保留中の stdin | 1 MiB。これを超えると `write` は `ERR_NSH_QUOTA_EXCEEDED` を throw |
| リスナー | 子プロセスごと、イベントごとに 64 |

`process.exit(code?)` は、ホストにこのアプリのサーフェスを閉じるよう要求します。`capabilities.process` の `"exit": true` で付与してください。エンジンはプラットフォームのアプリ終了コマンドを通じて要求を転送します。付与の対象外の呼び出しは `ERR_ACCESS_DENIED`(`permission` `"process"`、`resource` `"exit"`)を throw します。ホストは、自身がインストールする終了ハンドラーを通じて終了要求を受け取ります。それ以外の環境では、この呼び出しは `ERR_FEATURE_UNAVAILABLE_ON_PLATFORM` を throw します。macOS ではサーフェスのウィンドウを閉じます。ブラウザーでは、ホストページを開いたままアプリを停止し、そのサーフェスをクリアします。埋め込みホストは、サーフェスがこの要求をどう処理するかを制御します。Gallery はこの機能を拒否するため、**Request host exit** アクションは権限の処理を示し、デモを開いたままにします。

<a id="network-permissions-and-boundaries"></a>

## ネットワーク権限と境界

グローバルな `fetch` は NSH のストリーミング HTTP 実装を維持し、リクエストとリダイレクトの各ホップに対して `network.hosts` または `network.http` を確認します。WebSocket は `ws:` / `wss:`、テキストメッセージとバイナリメッセージ、イベントリスナー、クロージングハンドシェイクをサポートします。WebSocket のハンドシェイクは HTTP GET であるため、グローバルな `WebSocket` と `websocket` モジュールの `connect` のどちらも HTTP の付与を使用します。`ws` は `http` として、`wss` は `https` として GET で確認されます(ルールの `schemes` に `ws` / `wss` を列挙することもできます)。NSH は、接続を開始する前に、正規化された最初の URL を確認します。ネイティブのハンドシェイクはその URL に接続し、リダイレクトを拒否します。ブラウザーの WebSocket のリダイレクトと接続ポリシーはブラウザーが制御します。どちらの API も、認証情報またはフラグメントを含む URL を拒否します。各 VM が保持できる WebSocket は、両方の API を合わせて最大 32 個で、メッセージはどちらも最大 8 MiB です。

付与されていない URL は、接続が始まる前に拒否されます。グローバルな `WebSocket` は、ブラウザーが接続の失敗を報告するのと同じ方法で報告します。コンストラクターがソケットを返し、そのソケットが `error` と `close`(コード 1006、`wasClean` `false`)を発火するため、コンストラクターの直後にアプリが設定したハンドラーがそれらを受け取ります。モジュールの `connect` は `ERR_ACCESS_DENIED`(`permission` `"network"`、`resource` は URL)で reject します。33 個目の WebSocket は、コンストラクターでは throw し、`connect` では `ERR_NSH_QUOTA_EXCEEDED` で reject します。不正な形式の URL は、コンストラクターでは `SyntaxError`、`connect` では `TypeError` になります。

グローバルな `WebSocket` は、送信待ちのメッセージを最大 8 件、バッファーは最大 8 MiB(`bufferedAmount`)までキューに入れます。どちらかを超える `send()` は `ERR_NSH_QUOTA_EXCEEDED` を throw し、ソケットがクローズ中になると、ブラウザーと同様に `send()` はデータを破棄します。ハンドシェイクと各書き込みは 30 秒でタイムアウトし、クローズは相手からの close フレームを最大 5 秒待ちます。メッセージは到着するたびに `message` イベントとして配信されます。

`websocket` モジュールの `WebSocketConnection` が保持できる保留中の操作(読み取り、書き込み、クローズ)は最大 8 件、未送信の書き込みは最大 8 MiB です。どちらかを超える `write()` は `ERR_NSH_QUOTA_EXCEEDED` で reject され、8 MiB を超えるメッセージは `RangeError`(`code` `ERR_OUT_OF_RANGE`)で reject されます。同時に待機できる `read()` は 1 つで、2 つ目は `TypeError` で reject されます。読み取られる前に到着したメッセージはアプリが読み取るまで待機し、そのフローはアプリの読み取りに従います。未読のメッセージが 8 件または 8 MiB に達すると、接続はネットワークからの読み取りを停止し、相手側の送信も待機します。アプリが読み取ると読み取りが再開します。名前解決、接続、ハンドシェイクを合わせて、また各書き込みとクローズは 30 秒でタイムアウトします。

`read()` は、メッセージを到着順に解決します。接続が正常にクローズされ(相手がクローズしたか、アプリが `close()` を呼び出した場合)、それより前のメッセージがすべて読み取られると、`read()` は `null` で解決されます。これは `net` ソケットが EOF で行うのと同じです。その後、`closeCode` と `closeReason` には close フレームのコードと理由が入ります(接続が開いている間は `null`。コードのない close フレームでは 1005、クロージングハンドシェイクなしで終了した接続では 1006)。`read()` が reject されるのは失敗の場合のみで、それより前のメッセージの後に、`code` とともに reject されます。クロージングハンドシェイクなしで終了した接続では `ERR_SOCKET_CLOSED`、ソケットエラーでは OS のコードである `ETIMEDOUT`、プロトコルエラーでは `EPROTO`(ハンドシェイクが拒否された場合は HTTP の `status` を伴う)です。`close(code?, reason?)` は、グローバルな `WebSocket` の `close()` と同様に、コード(1000(デフォルト)、または 3000 から 4999)と理由(UTF-8 で最大 123 バイト)を close フレームで送信します。これらの範囲外のコードや理由は `RangeError`(`code` `ERR_OUT_OF_RANGE`)で reject されます。まだ読み取られていないメッセージは破棄され、相手がクロージングハンドシェイクに応答した時点で解決されます。

```tsx
import { connect } from "websocket";

const socket = await connect("wss://chat.example.com/socket");
await socket.write("hello");
for (let message; (message = await socket.read()) !== null; ) {
  console.log(message);
}
console.log(`closed: ${socket.closeCode} ${socket.closeReason}`);
```

`net.connect({ host, port })` は `network.sockets` のみを使用します。これは `"host:port"` の宛先(IPv6 では `"[::1]:9000"`)を正確に列挙したリストで、DNS 参照の前に確認されます。各エントリーは 1 つのホストの 1 つのポートを付与します。ホストパターン、`network.hosts`、HTTP の付与は HTTP トラフィックのみを対象とし、`"capabilities"` のないアプリはソケットも一覧に含めます。返される `Socket` は `read(size?)`、`write(text)`、`close()` を提供します。読み取りは `Uint8Array` を返し、EOF では `null` を返します。すべての失敗は reject されます。付与されていない宛先は `ERR_ACCESS_DENIED`(`permission` `"network"`、`resource` `"host:port"`)で、33 個目のソケットと、待機できる 4 MiB を超える書き込みは `ERR_NSH_QUOTA_EXCEEDED` で、1 MiB を超える読み取りまたは書き込みは `RangeError`(`code` `ERR_OUT_OF_RANGE`)で reject されます。接続と I/O の失敗は、Node の `code`(`ECONNREFUSED`、`ENOTFOUND`、`ETIMEDOUT`、`ECONNRESET` など)と `syscall` で reject され、接続の失敗には `address` と `port` も含まれます。クローズ済みのソケットへの書き込みは `ERR_SOCKET_CLOSED` で reject されます(そこでの読み取りは `null` を返します)。接続と I/O には 30 秒のタイムアウトがあり、各読み取り/書き込みは 1 MiB に制限され、送信待ちにできる書き込みは最大 4 MiB で、`close()` は保留中の読み取りと書き込みを直ちに終了させます。各 VM が開いている、または接続中のソケットは最大 32 個です。これは Promise ベースのクライアントソケットインターフェースです。

生の TCP はネイティブホストを使用します。どちらの WebSocket インターフェースも、Web アプリではブラウザーのトランスポートを使用し、Rust の権限チェックと上記の上限を維持します。ブラウザーのハンドシェイクヘッダーをカスタマイズすると、未サポートのオプションを示す明示的なエラーが報告されます。ブラウザーの接続ポリシーも適用されます。埋め込みホストの付与は、アプリの権限宣言との共通部分になります。

<a id="websocket-grant-example"></a>

## WebSocket 付与の例

この `nsh.json` のフラグメントは、この `wss` URL に対する GET ハンドシェイクを許可し、そのパスと HTTPS のスコープを維持します。

```json
{
  "capabilities": {
    "network": {
      "http": [{
        "host": "chat.example.com",
        "methods": ["GET"],
        "schemes": ["https"],
        "pathPrefix": "/socket"
      }]
    }
  }
}
```

```rust tabs
use futures_util::{SinkExt, StreamExt};
use tokio_tungstenite::{connect_async, tungstenite::Message};

spawn(async move {
    let _ = background(async {
        let (mut socket, _) = connect_async("wss://chat.example.com/socket").await?;
        socket.send(Message::text("hello")).await?;
        while let Some(message) = socket.next().await {
            log::info!("{}", message?);
        }
        Ok::<_, tokio_tungstenite::tungstenite::Error>(())
    })
    .await;
});
```

```tsx tabs
const socket = new WebSocket("wss://chat.example.com/socket");
socket.addEventListener("open", () => socket.send("hello"));
socket.addEventListener("message", (event) => console.log(event.data));
```

<a id="tcp-grant-example"></a>

## TCP 付与の例

TCP はソケットの付与を使用します。付与するのは、アプリが接続する正確なホストとポートです。

```json
{
  "capabilities": {
    "network": { "sockets": ["tcp.example.com:9000"] }
  }
}
```

```rust tabs
use std::{
    io::{Read, Write},
    net::TcpStream,
};

spawn(async move {
    let reply = blocking(|| -> std::io::Result<String> {
        let mut socket = TcpStream::connect(("tcp.example.com", 9000))?;
        socket.write_all(b"hello\n")?;
        let mut bytes = [0; 1024];
        let n = socket.read(&mut bytes)?;
        Ok(String::from_utf8_lossy(&bytes[..n]).into_owned())
    })
    .await;
    if let Ok(Ok(reply)) = reply {
        log::info!("{reply}");
    }
});
```

```tsx tabs
import { connect } from "net";

const socket = await connect({ host: "tcp.example.com", port: 9000 });
try {
  await socket.write("hello\n");
  const bytes = await socket.read(1024);
  if (bytes) console.log(new TextDecoder().decode(bytes));
} finally {
  socket.close();
}
```

## Gallery

`examples/gallery` で **Standard APIs** を開くと、ファイル操作、子プロセス、TCP、2 つの WebSocket インターフェースを実行し、ホストのメタデータとキューに入ったジョブを確認できます。ユーティリティのアクションでは、バッファー、ハッシュ、圧縮、ファイル URL を実演します。各アクションは結果またはエラーを表示します。ファイルは Gallery 自身のデータディレクトリ配下の一時ディレクトリに置かれ、アクションの後に削除されます。TCP と WebSocket のアクションは、ポート 9876 と 9877 のローカルエコーサーバーに接続します。Web では、ファイルアクションは OPFS を使用し、ユーティリティは WebAssembly で実行され、2 つの WebSocket アクションはどちらもブラウザーの接続を使用します。プロセスと TCP のアクションは、ホストの型付きプラットフォームエラーを表示します。

Gallery の **AI Chat** は `process.spawn` を使い、デスクトップ上でローカルにインストールされた Claude または Codex CLI を介してチャットします。ターミナルで CLI からサインインし、コンポーザーでプロバイダーを選択してください。返信は会話をコンテキストとして使用します。Stop を押すか画面を離れると、子プロセスが終了します。Web とモバイルでは、推論、ツールカード、エラーからの回復を含む、スクリプト化されたストリーミング会話を実行します。
