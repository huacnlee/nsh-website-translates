---
title: "標準模組"
description: "十一個 Node 風格的標準模組：固定版本的 LLRT 工具，以及具備權限檢查的檔案、處理程序與網路功能。"
order: 14.5
source_hash: d38790f1ea17287e
---

Native Shell 為 TSX 提供十一個標準模組，以裸名稱匯入（Rust 程式碼使用 Rust 自己的函式庫：[從 Rust 使用](#from-rust)）：這些是與 gpui-shell 相容的 Node 風格 API，在應用程式的 VM 中於 NSH 的原生執行階段上運行，其能力由 Rust 檢查。位於 `.nsh/types` 的 TypeScript 宣告與模組由同一份規格產生，因此型別所顯示的內容，就是執行階段實際匯出的內容。

| 模組 | 匯出 |
|---|---|
| `buffer` | `Buffer`、`atob`、`btoa`、`constants`、default (LLRT)；`Buffer` 同時也是全域變數 |
| `crypto` | `createHash`、`createHmac`、`randomBytes`、`randomFill`、`randomFillSync`、`randomInt`、`randomUUID`、`getRandomValues`、`webcrypto`、`crypto`、`Crc32`、`Crc32c`、`Md5`、`Sha1`、`Sha256`、`Sha384`、`Sha512`、default (LLRT)；`crypto` 同時也是全域變數 |
| `path` | `basename`、`delimiter`、`dirname`、`extname`、`format`、`isAbsolute`、`join`、`normalize`、`parse`、`relative`、`resolve`、`sep`、default (LLRT) |
| `url` | `URL`、`URLSearchParams`、`domainToASCII`、`domainToUnicode`、`fileURLToPath`、`format`、`pathToFileURL`、`urlToHttpOptions`、default；`URL` 與 `URLSearchParams` 是 NSH 的全域類別 |
| `zlib` | `deflate`、`deflateRaw`、`inflate`、`inflateRaw`、`gzip`、`gunzip`、`brotliCompress`、`brotliDecompress`、`zstdCompress`、`zstdDecompress`，各有其 `Sync` 形式，default (LLRT) |
| `os` | `platform()`、`arch()`、`homedir()`、`EOL`、default |
| `console` | default：VM 的 `console`（`log`、`info`、`debug`、`warn`、`error`） |
| `fs/promises` | `readFile`、`writeFile`、`readdir`、`exists`、`mkdir`、`rename`、`unlink`、`rmdir`、`stat`、`lstat`、`readlink`、default |
| `process` | `run`、`spawn`、`exit`、`platform`、`arch`、`nextTick`、`ChildProcess`、default；default 物件另有 `env` 與 `dataDir`，並且就是全域的 `process` |
| `net` | `connect`、`Socket`、default |
| `websocket` | `connect(url, options?)` 解析為 `WebSocketConnection`（`read`、`write`、`close(code?, reason?)`、`closeCode`、`closeReason`）、`WebSocketConnection`、default；在原生主機上另有全域的 `WebSocket` 建構函式 |

<a id="from-rust"></a>

## 從 Rust 使用

Rust 程式碼以 Rust 標準函式庫與 crates.io 完成相同的工作，並在應用程式自己的原生程式碼中執行：阻塞呼叫以 `blocking(…)` 在執行階段的執行緒上執行，非同步呼叫則以 `background(…)`（`nsh_core::prelude`）執行，其結果會在一個 task 中回到元件。`nsh.json` 的 `capabilities` 規範應用程式的 TSX 與 NSH 的服務（`fetch`、剪貼簿）；應用程式自己的 Rust 程式碼則以應用程式處理程序的權限執行。在瀏覽器應用程式中，Rust 程式碼以 `fetch` 存取網路，並以 `nsh_core::storage::Storage` 保存資料。

| 模組 | Rust |
|---|---|
| `buffer` | `Vec<u8>`、`&[u8]`、`base64` crate |
| `crypto` | 如 `sha2`、`hmac`、`rand` 與 `uuid` 等 crate |
| `path` | `std::path` |
| `url` | `url` crate |
| `zlib` | 如 `flate2`、`brotli` 與 `zstd` 等 crate |
| `os` | `std::env::consts`、`os()` |
| `console` | `log` crate |
| `fs/promises` | `blocking(…)` 中的 `std::fs`；鍵值資料使用 `Storage` |
| `process` | `blocking(…)` 中的 `std::process::Command` |
| `net` | `blocking(…)` 中的 `std::net::TcpStream`，或 `background(…)` 中的 `tokio::net` |
| `websocket` | 如 `background(…)` 中的 `tokio-tungstenite` 這類 crate |

<a id="imports-and-generated-types"></a>

## 匯入與產生的型別

每個模組都以表格中的名稱精確匯入：`import { join } from "path"`、`import fs from "fs/promises"`。打包工具會保留這些匯入，執行階段則以原生方式提供；目錄中就是這十一個名稱。`buffer`、`crypto`、`path`、`url` 與 `zlib` 是 LLRT 的實作，固定在 `d9fd873e793c6551c5d92b2e31480f3279e3cd8d`，其宣告由該版本投射到執行階段實際擁有的匯出上。其餘模組則是 NSH 自己的實作。NSH 保留其 URL、Blob、stream 與 event 類別的身分。

所有十一個模組都能在原生主機與瀏覽器應用程式中載入。`Buffer`、雜湊、加密與壓縮在 WebAssembly 中使用相同的可攜式 Rust 實作，包括同步 API；隨機值使用瀏覽器的密碼學熵來源。瀏覽器中的 `path` 操作使用 POSIX 路徑與虛擬的 `/` 工作目錄。瀏覽器檔案使用持久的應用程式私有儲存空間，WebSocket 則使用瀏覽器的傳輸層。在瀏覽器中，行程執行與原始 TCP 呼叫會以 `code` `ERR_FEATURE_UNAVAILABLE_ON_PLATFORM` 失敗。

<a id="how-they-compare-with-nodejs-and-gpui-shell"></a>

## 與 Node.js 及 gpui-shell 的比較

對於所匯出的子集，這些模組沿用 Node 的名稱與形狀；在 gpui-shell 有定義行為之處，則遵循 gpui-shell 的行為。NSH 自己的選擇如下：

- `fs/promises` 的 `exists` 在符號連結的目標不存在時為 `true`，而 `unlink`、`rename`、`rmdir`、`lstat` 與 `readlink` 作用於符號連結本身。
- `Stats` 與 `Dirent` 的欄位（`size`、`mtimeMs`、`name` 等）如同 Node 一樣是自有屬性，而 `isFile()`、`isDirectory()` 與 `isSymbolicLink()` 則位於其原型上。
- `ChildProcess` 監聽器會收到事件的負載：輸出文字，或結束事件的 `{ code, signal }`（當執行階段終止子行程時，還會帶有 `error` 與 `errorCode`）。`on` 會回傳子行程。`run` 解析為 `{ code, signal, stdout, stderr }`：即 gpui-shell 的輸出，加上終止子行程的訊號。
- 子行程的環境變數，是來自主機的一小組變數加上應用程式被授予的名稱；它在應用程式的資料目錄中執行，或在 `fs.write` 根目錄內的 `cwd` 中執行（[處理程序](#processes)）。
- `process.platform`、`process.arch`、`os.platform()` 與 `os.arch()` 如同 gpui-shell 一樣，給出 Rust 的 `std::env::consts` 名稱：`"macos"`、`"windows"`、`"linux"`、`"ios"`、`"android"`；`"aarch64"`、`"x86_64"`（[作業系統中繼資料](#os-metadata-and-logging)）。
- 當主機沒有資料目錄時，`process.dataDir` 為 `null`；`process.exit` 會要求主機關閉應用程式介面。
- 限制是每個 API 的一部分：大小、數量與逾時都列在下方各模組中。

<a id="failures"></a>

## 失敗

回傳 promise 的函式，會以拒絕（reject）該 promise 的方式回報所有失敗，如同 Node 的 `fs/promises`：無論是錯誤的引數、應用程式未被授權的路徑或主機、已用盡的限制，或是 I/O 錯誤，都一樣，因此一個 `catch`（或 `.catch`）就能處理全部。同步函式（`process.spawn`、`process.exit`、`os.homedir`、`ChildProcess.write`、全域 `WebSocket` 的建構函式與 `send`）則會拋出錯誤。錯誤的用法（型別錯誤的引數、超出範圍的選項）會是 `TypeError` 或 `RangeError`。應用程式能處理的每個失敗都帶有 `code`，它在各版本之間保持不變；訊息是寫給人看的，可能會變動，因此應用程式應依 `code` 分支處理：

| `code` | 意義 |
|---|---|
| `ERR_ACCESS_DENIED` | 應用程式的 `capabilities` 未授權此呼叫。錯誤帶有 `permission`（該能力在 `nsh.json` 中的鍵，如 `"fs"`、`"process"`、`"network"`），以及 `resource`（所要求的對象：路徑、指令（`process.exit` 時為 `"exit"`）、socket 的 `"host:port"`，或 WebSocket 的 URL） |
| `ERR_FEATURE_UNAVAILABLE_ON_PLATFORM` | 此呼叫屬於其他平台：檔案可在桌面與瀏覽器中執行，行程可在桌面上執行，TCP socket 可在原生主機上執行，`os.homedir()` 則可在設定了家目錄的主機上執行 |
| `ERR_NSH_QUOTA_EXCEEDED` | 已用盡執行階段的某項限制：進行中的操作或資料、子行程、socket、WebSocket、等待傳送的位元組、監聽器 |
| `ETIMEDOUT` | 呼叫逾時：`run` 的 `timeoutMs`、連線、WebSocket 握手、寫入或關閉 |
| `ENOENT`、`EEXIST`、`EACCES`、`ECONNREFUSED` 等 | 作業系統的回應，使用 Node 的錯誤碼；`EACCES` 與 `EPERM` 是作業系統拒絕存取檔案，與應用程式的能力無關 |
| `ERR_OUT_OF_RANGE`、`ERR_FS_FILE_TOO_LARGE`、`ERR_SOCKET_CLOSED`、`ERR_CHILD_PROCESS_STDIO_MAXBUFFER` | Node 的錯誤碼，分別表示大小超出限制、連線已關閉，以及輸出超出 `run` 的擷取上限 |

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

主機應用程式授予的權限可能少於應用程式所宣告的（[沙箱與能力](../docs/sandbox-and-capabilities.md)），因此應用程式處理 `ERR_ACCESS_DENIED` 的方式，應如同處理失敗的請求。

<a id="os-metadata-and-logging"></a>

## 作業系統中繼資料與日誌

`os.platform(): string` 與 `os.arch(): string` 回報實際的原生主機作業系統與架構，`process.platform` 與 `process.arch` 則持有相同的值。它們如同 gpui-shell 一樣，是 Rust 的 `std::env::consts::OS` 與 `ARCH` 的名稱：作業系統為 `"macos"`、`"windows"`、`"linux"`、`"ios"`、`"android"`，架構為 `"aarch64"`、`"x86_64"`，因此應用程式可直接與它們比較（`process.platform === "macos"`）。`os.EOL: string` 是主機的換行分隔符。`os.homedir(): string` 回傳已設定的主機家目錄絕對路徑；若未設定，則拋出帶有 `code` `ERR_FEATURE_UNAVAILABLE_ON_PLATFORM` 的錯誤。目錄路徑屬於中繼資料：檔案操作仍然需要 `fs.read` / `fs.write` 授權。

瀏覽器應用程式讀到的是空的 `process.env` 物件，而 `os.homedir()` 在瀏覽器中會拋出 `ERR_FEATURE_UNAVAILABLE_ON_PLATFORM`，因為家目錄路徑與環境變數屬於原生主機。

`import console from "console"` 共用 VM 的全域 `console` 物件。該模組只有預設匯出，支援 `log`、`info`、`debug`、`warn`、`error`，每個的簽章皆為 `(...values: unknown[]): void`。它使用 NSH 的記錄器格式。

<a id="compression"></a>

## 壓縮

`zlib` 來自 LLRT，另外加上 NSH 新增的一項界限：每次解壓縮（`inflate`、`inflateRaw`、`gunzip`、`brotliDecompress`、`zstdDecompress` 及其 `Sync` 形式）最多產生 64 MiB，或在 VM 的堆積限制更小時，以該限制為準。輸出更長時會拋出 `RangeError`，如同 Node.js 對 `maxOutputLength` 的行為；應用程式自己的 `maxOutputLength` 可為單次呼叫設定更低的上限。`Buffer.alloc`、`Buffer.allocUnsafe`、`Buffer.allocUnsafeSlow` 與 `crypto.randomBytes` 在大小超過 VM 的堆積限制（若無限制則為 1 GiB）時，會拋出 `RangeError`（`code` `ERR_OUT_OF_RANGE`）；`allocUnsafe` 回傳已清零的記憶體。

<a id="files"></a>

## 檔案

`fs/promises` 在桌面主機（macOS、Windows 與 Linux）上讀寫原生檔案，並在瀏覽器中透過 Origin Private File System (OPFS) 讀寫應用程式私有的瀏覽器檔案。每個路徑在操作開始前，都會依 `capabilities.fs` 檢查：`readFile`、`readdir`、`stat`、`lstat`、`readlink` 與 `exists` 使用 `read` 根目錄，`writeFile`、`mkdir`、`rename`、`unlink` 與 `rmdir` 使用 `write` 根目錄。每個失敗都會拒絕 promise：超出授權範圍的路徑會以 `code` `ERR_ACCESS_DENIED`（`permission` `"fs"`，`resource` 為應用程式所寫的路徑原樣）拒絕，且發生在任何磁碟操作之前。

```json
{
  "capabilities": {
    "fs": { "read": ["${dataDir}"], "write": ["${dataDir}"] }
  }
}
```

根目錄可以是絕對路徑、`${dataDir}`（此應用程式的資料目錄，由主機選定）、`${pluginDir}`（應用程式的目錄）、`${homeDir}`，或相對於應用程式目錄的路徑。呼叫中的相對路徑會依序在每個被授權的根目錄中解析。內嵌的主機可以進一步縮小授權範圍。每個操作都停留在其被授權的根目錄內，符號連結也不例外；絕對路徑依其書寫方式檢查，因此根目錄要以它自己的路徑（或其解析後的路徑）存取，而不能透過位於其外的連結。`lstat`、`readlink`、`exists`、`unlink`、`rename` 與 `rmdir` 作用於符號連結本身：`exists` 在符號連結的目標不存在時為 `true`，而 `unlink` 會移除該連結並保留其目標。

失敗帶有 Node 的錯誤屬性：`code`（`ENOENT`、`EEXIST`、`ENOTDIR`、`EISDIR`、`ENOTEMPTY`、`ELOOP`、`EACCES`、`EPERM` 等；非 UTF-8 的文字為 `EILSEQ`，超過讀取限制為 `ERR_FS_FILE_TOO_LARGE`）、`syscall` 與 `path`，因此 `error.code === "ENOENT"` 可分辨出檔案不存在。超出授權範圍的路徑會以 `ERR_ACCESS_DENIED` 拒絕；在 iOS 或 Android 上的呼叫（其應用程式以 [`Storage`](./nsh.md#storage) 保存資料）會以 `ERR_FEATURE_UNAVAILABLE_ON_PLATFORM` 拒絕；錯誤的引數（未知的編碼或選項）則以 `TypeError` 拒絕。

`readFile` 回傳 `Uint8Array`，或在指定 `"utf8"` 時回傳字串，且可讀取最大 64 MiB 的檔案。`writeFile` 寫入最多 8 MiB 的字串或 `Uint8Array`，建立或取代一般檔案。`readdir` 列出最多 10 000 個名稱（其總量 1 MiB；更大的目錄會以 `RangeError`、`code` `ERR_OUT_OF_RANGE` 拒絕），並排序，或在指定 `{ withFileTypes: true }` 時回傳 `Dirent`（`name`、`isDirectory()`）。`stat` 與 `lstat` 解析為帶有 `size`、`mode`、`mtimeMs` / `atimeMs` / `birthtimeMs`、以 `Date` 表示的 `mtime` / `atime` / `birthtime`，以及 `isFile()`、`isDirectory()` 與 `isSymbolicLink()` 的 `Stats`。`rmdir` 移除一個空目錄。單一 VM 最多同時執行 1024 個操作，並最多持有 64 MiB 的進行中檔案資料（交給 `writeFile` 且尚未寫入的資料，以及已讀取但其 promise 尚未結算的資料）；超出這些限制的呼叫會以 `ERR_NSH_QUOTA_EXCEEDED` 拒絕，而超過 8 MiB 的 `writeFile` 會以 `RangeError`（`code` `ERR_OUT_OF_RANGE`）拒絕。

瀏覽器儲存空間以頁面的 origin 與應用程式自己的命名空間為範圍，使用相同的檔案授權與大小限制，並在 Rust 中檢查。OPFS 需要安全環境，例如 HTTPS 或 localhost。檔案修改時間來自瀏覽器中繼資料；未知的存取／建立時間與模式為零。`rename` 使用瀏覽器控制代碼的原子移動，並在瀏覽器未提供該功能時回報 `ENOTSUP`。瀏覽器中的項目是一般檔案或目錄，而 `readlink` 回報 `EINVAL`。
<a id="processes"></a>

## 行程

`process.spawn` 與 `process.run` 在桌面主機（macOS、Windows 與 Linux）上啟動命令。執行階段會以引數陣列直接執行程式，不經過 shell，並擁有自己的管線；stdout 與 stderr 以增量 UTF-8 的形式送達。

```json
{
  "capabilities": {
    "process": { "execute": ["git"], "env": ["GIT_AUTHOR_NAME"] },
    "fs": { "write": ["${dataDir}"] }
  }
}
```

命令必須與 `process.execute` 完全相符：`git` 與 `/usr/bin/git` 是各自獨立的授權。裸命令會透過主機 `PATH` 中的絕對目錄來解析；在 Windows 上，裸命令也會在那裡找到 `<name>.com` 與 `<name>.exe`。批次檔（`.cmd`、`.bat`）透過 `cmd.exe` 執行：請授權其絕對路徑（`C:\Windows\System32\cmd.exe`），並將 `/d`、`/c` 與該指令碼作為引數傳入。子行程的環境變數包含來自主機的 `PATH`、`HOME`、`USERPROFILE`、`SystemRoot`、`TEMP`、`TMP`、`TMPDIR`、`LANG` 與 `LC_*`，再加上 `process.env` 所授權的名稱（需完全相符，僅在 Windows 上忽略大小寫，因為其環境變數本就如此）。子行程會在應用程式的資料目錄中執行（若不存在則建立），或在 `cwd` 中執行，該目錄須為 `fs.write` 根目錄內既有的目錄，因為子行程可能寫入其執行所在的位置。嵌入式主機可以縮小授權範圍。

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

`run` 無論結束狀態為何都會 resolve `{ code, signal, stdout, stderr }`：`code` 為結束狀態，`signal` 為 `null`；若是由訊號終止子行程，則 `code` 為 `null`，`signal` 為訊號名稱（`"SIGTERM"`）。它在任何失敗時都會 reject。`spawn` 會立即回傳子行程；`stdin: "pipe"` 啟用 `write` 與 `end`，而 `lines: true` 則傳遞完整的行。`on(event, handler)` 回傳子行程，處理函式會收到事件的 payload：文字，或在最終輸出之後僅觸發一次的 `{ code, signal }`（當執行階段終止子行程時，例如逾時或單行過長，則帶有 `error`）（之後才加入的監聽器會立即收到）。`pid` 是子行程的行程 ID。`spawn` 會在子行程啟動之前拋出 `run` reject 的內容：`process.execute` 未授權的命令會以 `ERR_ACCESS_DENIED` 失敗（`permission` `"process"`，`resource` 為該命令），`cwd` 不在 `fs.write` 授權範圍內時會以 `ERR_ACCESS_DENIED` 失敗（`permission` `"fs"`，`resource` 為 `cwd`），在桌面平台以外呼叫會以 `ERR_FEATURE_UNAVAILABLE_ON_PLATFORM` 失敗，超過子行程上限的呼叫會以 `ERR_NSH_QUOTA_EXCEEDED` 失敗；啟動失敗則帶有 `code`（找不到可執行檔時為 `ENOENT`，作業系統無法執行時為 `EACCES`）、`syscall`（`spawn <command>`）與 `path`。`run` 在截止時間以 `ETIMEDOUT` reject，輸出超過擷取上限時以 `RangeError`（`code` `ERR_CHILD_PROCESS_STDIO_MAXBUFFER`）reject；已啟動子行程的結束會在 `error` 中帶有相同的訊息，並在 `errorCode` 中帶有其代碼。`process.dataDir` 在主機沒有資料目錄時為 `null`。`kill`、逾時、reactive owner 的清理以及 VM 的拆除，都會結束整個行程樹：在 Unix 上，其行程群組會先收到 SIGTERM，250 毫秒後再收到 SIGKILL（拆除時則立即發送 SIGKILL）。

| 限制 | 值 |
|---|---|
| `timeoutMs` | 最高 4,294,967,295 毫秒；`run` 預設為 30 秒，`spawn` 則執行到結束 |
| `run` 的擷取 | 每個串流 8 MiB |
| 使用 `lines: true` 時的單行 | 8 MiB |
| 每個 VM 的子行程數 | 32 |
| 每個 VM 的處理中輸出 | 8 MiB；讀取端會等待 JS 取走 |
| 每個子行程的待處理 stdin | 1 MiB；超過時 `write` 會拋出 `ERR_NSH_QUOTA_EXCEEDED` |
| 監聽器 | 每個子行程每個事件 64 個 |

`process.exit(code?)` 請求主機關閉此應用程式 surface。請在 `capabilities.process` 中以 `"exit": true` 授權；引擎會透過平台的應用程式結束命令轉送該請求。授權未涵蓋的呼叫會拋出 `ERR_ACCESS_DENIED`（`permission` `"process"`，`resource` `"exit"`）。主機透過其安裝的結束處理常式接收結束請求；在其他情況下，呼叫會拋出 `ERR_FEATURE_UNAVAILABLE_ON_PLATFORM`。在 macOS 上，這會關閉 surface 視窗。在瀏覽器中，它會停止應用程式並清除其 surface，同時保持主機頁面開啟。嵌入式主機控制其 surface 如何處理該請求。Gallery 拒絕此能力，因此其 **Request host exit** 動作用來示範權限處理，並讓示範保持開啟。

<a id="network-permissions-and-boundaries"></a>

## 網路權限與邊界

全域 `fetch` 保留 NSH 的串流 HTTP 實作，對請求與重新導向跳轉檢查 `network.hosts` 或 `network.http`。WebSocket 支援 `ws:` / `wss:`、文字與二進位訊息、事件監聽器以及關閉交握。WebSocket 交握是一個 HTTP GET，因此全域 `WebSocket` 與 `websocket` 模組的 `connect` 都使用 HTTP 授權：`ws` 以 `http` 檢查，`wss` 以 `https` 檢查，並使用 GET（規則也可以在 `schemes` 中列出 `ws` / `wss`）。NSH 在啟動連線之前會檢查初始的正規化 URL。原生交握會連線到該 URL 並拒絕重新導向；瀏覽器 WebSocket 的重新導向與連線政策由瀏覽器控制。兩個 API 都拒絕帶有憑證或片段的 URL。每個 VM 在兩個 API 之間最多持有 32 個 WebSocket，兩者的訊息大小上限皆為 8 MiB。

未授權給應用程式的 URL 會在任何連線開始之前被拒絕。全域 `WebSocket` 會以瀏覽器回報連線失敗的方式回報：建構函式會回傳該 socket，隨後它會觸發 `error` 與 `close`（代碼 1006，`wasClean` `false`），因此應用程式在建構函式之後立即設定的處理函式能收到它們。模組的 `connect` 會以 `ERR_ACCESS_DENIED` reject（`permission` `"network"`，`resource` 為該 URL）。第 33 個 WebSocket 會以 `ERR_NSH_QUOTA_EXCEEDED` 拋出（建構函式）或 reject（`connect`），格式錯誤的 URL 則為 `SyntaxError`（建構函式）或 `TypeError`（`connect`）。

全域 `WebSocket` 最多佇列八則待傳送的訊息，緩衝最多 8 MiB（`bufferedAmount`）；超過任一限制的 `send()` 會拋出 `ERR_NSH_QUOTA_EXCEEDED`，而一旦 socket 正在關閉，`send()` 會丟棄其資料，與瀏覽器的行為相同。其交握與每次寫入在 30 秒後逾時，關閉時最多等待 5 秒以取得對端的關閉框架。訊息抵達時會以 `message` 事件傳遞。

`websocket` 模組的 `WebSocketConnection` 最多持有八個待處理操作（讀取、寫入、關閉），以及最多 8 MiB 尚未傳送的寫入；超過任一限制的 `write()` 會以 `ERR_NSH_QUOTA_EXCEEDED` reject，超過 8 MiB 的訊息則以 `RangeError`（`code` `ERR_OUT_OF_RANGE`）reject。同一時間只能有一個 `read()` 在等待；第二個會以 `TypeError` reject。在被讀取之前抵達的訊息會等待應用程式，其流量取決於應用程式的讀取：當八則訊息或 8 MiB 未被讀取而在等待時，連線會停止從網路讀取，因此對端的傳送也會等待，並隨著應用程式讀取而恢復讀取。解析、連線與交握合計、每次寫入以及關閉，皆在 30 秒後逾時。

`read()` 依抵達順序 resolve 訊息。一旦連線已正常關閉（對端關閉，或應用程式呼叫 `close()`），且在其之前的每則訊息都已被讀取，`read()` 就會 resolve `null`，如同 `net` socket 在 EOF 時的行為；`closeCode` 與 `closeReason` 此時保存關閉框架的代碼與原因（連線開啟時為 `null`；沒有代碼的關閉框架為 1005；未經關閉交握就結束的連線為 1006）。`read()` 只在失敗時 reject，且在其之前的訊息之後，附帶其 `code`：未經關閉交握就結束的連線為 `ERR_SOCKET_CLOSED`，`ETIMEDOUT` 為 socket 錯誤的作業系統代碼，`EPROTO` 為協定錯誤（若交握被拒絕，則帶有 HTTP `status`）。`close(code?, reason?)` 在關閉框架中傳送其代碼（1000，預設值，或 3000 至 4999）與原因（最多 123 個 UTF-8 位元組），與全域 `WebSocket` 的 `close()` 相同；超出這些範圍的代碼或原因會以 `RangeError`（`code` `ERR_OUT_OF_RANGE`）reject。它會丟棄尚未讀取的訊息，並在對端回應關閉交握後 resolve。

```tsx
import { connect } from "websocket";

const socket = await connect("wss://chat.example.com/socket");
await socket.write("hello");
for (let message; (message = await socket.read()) !== null; ) {
  console.log(message);
}
console.log(`closed: ${socket.closeCode} ${socket.closeReason}`);
```

`net.connect({ host, port })` 僅使用 `network.sockets`，這是一份精確 `"host:port"` 目的地的清單（IPv6 為 `"[::1]:9000"`），會在 DNS 查詢之前檢查。每個項目授權一個主機上的一個連接埠；主機模式、`network.hosts` 與 HTTP 授權僅涵蓋 HTTP 流量，而沒有 `"capabilities"` 的應用程式也會列出其 socket。回傳的 `Socket` 提供 `read(size?)`、`write(text)` 與 `close()`；讀取會回傳 `Uint8Array`，或在 EOF 時回傳 `null`。所有失敗都會 reject：未授權的目的地以 `ERR_ACCESS_DENIED`（`permission` `"network"`，`resource` `"host:port"`）reject，第 33 個 socket 以及超過可等待之 4 MiB 的寫入以 `ERR_NSH_QUOTA_EXCEEDED` reject，超過 1 MiB 的讀取或寫入以 `RangeError`（`code` `ERR_OUT_OF_RANGE`）reject；連線與 I/O 失敗以 Node 的 `code`（`ECONNREFUSED`、`ENOTFOUND`、`ETIMEDOUT`、`ECONNRESET` 等）與 `syscall` reject，連線失敗還會帶有 `address` 與 `port`，在已關閉的 socket 上寫入則以 `ERR_SOCKET_CLOSED` reject（在其上讀取則回傳 `null`）。連線與 I/O 有 30 秒逾時，每次讀取/寫入限制為 1 MiB，最多 4 MiB 的寫入可等待傳送，`close()` 會立即結束待處理的讀取與寫入。每個 VM 最多保持 32 個開啟或連線中的 socket。這是一個基於 promise 的用戶端 socket 介面。

原始 TCP 使用原生主機。兩種 WebSocket 介面在 Web 應用程式中都使用瀏覽器傳輸，並保留 Rust 能力檢查與上述限制。自訂的瀏覽器交握標頭會回報明確的不支援選項錯誤。瀏覽器連線政策也同樣適用。嵌入式授權會與應用程式的能力宣告取交集。

<a id="websocket-grant-example"></a>

## WebSocket 授權範例

此 `nsh.json` 片段允許此 `wss` URL 的 GET 交握，並保留其路徑與 HTTPS 範圍：

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

## TCP 授權範例

TCP 使用 socket 授權：應用程式所連線的精確主機與連接埠。

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

在 `examples/gallery` 中開啟 **Standard APIs**，以執行檔案操作、子行程、TCP 與兩種 WebSocket 介面，並檢視主機中繼資料與已佇列的工作。utilities 動作會示範緩衝區、雜湊、壓縮與檔案 URL。每個動作都會顯示其結果或錯誤。檔案存放於 Gallery 自身資料目錄下的暫存目錄中，並在動作之後移除。TCP 與 WebSocket 動作會連線到連接埠 9876 與 9877 上的本機 echo 伺服器。在 Web 上，檔案動作會使用 OPFS，utilities 在 WebAssembly 中執行，兩個 WebSocket 動作都使用瀏覽器連線；行程與 TCP 動作會顯示主機有型別的平台錯誤。

Gallery 的 **AI Chat** 使用 `process.spawn`，在桌面上透過本機安裝的 Claude 或 Codex CLI 進行聊天。請在終端機中透過 CLI 登入，然後在輸入區選擇提供者。回覆會以對話作為上下文；Stop 與離開畫面都會結束子行程。Web 與行動裝置則執行腳本化的串流對話，包含推理、工具卡片與錯誤復原。
