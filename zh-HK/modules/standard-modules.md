---
title: "標準模組"
description: "十一個仿 Node 風格的標準模組:固定版本的 LLRT 工具,以及具備能力檢查的檔案、處理程序和網絡功能。"
order: 14.5
source_hash: d38790f1ea17287e
---

Native Shell 為 TSX 提供十一個標準模組，以裸名稱匯入（Rust 程式碼使用 Rust 自身的函式庫：[從 Rust 使用](#from-rust)）。這些是與 gpui-shell 相容、形態類似 Node 的 API，在應用程式的 VM 中於 NSH 的原生執行環境上運行，其權限（capabilities）在 Rust 中檢查。位於 `.nsh/types` 的 TypeScript 宣告與模組由同一份規格生成，因此型別所顯示的，就是執行環境實際匯出的內容。

| 模組 | 匯出 |
|---|---|
| `buffer` | `Buffer`、`atob`、`btoa`、`constants`、default（LLRT）；`Buffer` 同時是全域變數 |
| `crypto` | `createHash`、`createHmac`、`randomBytes`、`randomFill`、`randomFillSync`、`randomInt`、`randomUUID`、`getRandomValues`、`webcrypto`、`crypto`、`Crc32`、`Crc32c`、`Md5`、`Sha1`、`Sha256`、`Sha384`、`Sha512`、default（LLRT）；`crypto` 同時是全域變數 |
| `path` | `basename`、`delimiter`、`dirname`、`extname`、`format`、`isAbsolute`、`join`、`normalize`、`parse`、`relative`、`resolve`、`sep`、default（LLRT） |
| `url` | `URL`、`URLSearchParams`、`domainToASCII`、`domainToUnicode`、`fileURLToPath`、`format`、`pathToFileURL`、`urlToHttpOptions`、default；`URL` 與 `URLSearchParams` 是 NSH 的全域類別 |
| `zlib` | `deflate`、`deflateRaw`、`inflate`、`inflateRaw`、`gzip`、`gunzip`、`brotliCompress`、`brotliDecompress`、`zstdCompress`、`zstdDecompress`，各有其 `Sync` 形式，default（LLRT） |
| `os` | `platform()`、`arch()`、`homedir()`、`EOL`、default |
| `console` | default：VM 的 `console`（`log`、`info`、`debug`、`warn`、`error`） |
| `fs/promises` | `readFile`、`writeFile`、`readdir`、`exists`、`mkdir`、`rename`、`unlink`、`rmdir`、`stat`、`lstat`、`readlink`、default |
| `process` | `run`、`spawn`、`exit`、`platform`、`arch`、`nextTick`、`ChildProcess`、default；default 物件另有 `env` 和 `dataDir`，並且是全域的 `process` |
| `net` | `connect`、`Socket`、default |
| `websocket` | `connect(url, options?)` 解析為 `WebSocketConnection`（`read`、`write`、`close(code?, reason?)`、`closeCode`、`closeReason`）、`WebSocketConnection`、default；在原生主機上另有全域的 `WebSocket` 建構函式 |

<a id="from-rust"></a>

## 從 Rust 使用

Rust 程式碼以 Rust 標準函式庫和 crates.io 完成相同的工作，並運行於應用程式自身的原生程式碼中：阻塞式呼叫使用 `blocking(…)` 在執行環境的執行緒上運行，非同步呼叫則使用 `background(…)`（`nsh_core::prelude`），其結果會以任務（task）的形式返回元件。`nsh.json` 的 `capabilities` 管轄應用程式的 TSX 以及 NSH 的服務（`fetch`、剪貼簿）；應用程式自身的 Rust 程式碼則以應用程式行程的權限運行。在瀏覽器應用程式中，Rust 程式碼以 `fetch` 存取網絡，並以 `nsh_core::storage::Storage` 保存資料。

| 模組 | Rust |
|---|---|
| `buffer` | `Vec<u8>`、`&[u8]`、`base64` crate |
| `crypto` | 例如 `sha2`、`hmac`、`rand` 和 `uuid` 等 crate |
| `path` | `std::path` |
| `url` | `url` crate |
| `zlib` | 例如 `flate2`、`brotli` 和 `zstd` 等 crate |
| `os` | `std::env::consts`、`os()` |
| `console` | `log` crate |
| `fs/promises` | `blocking(…)` 中的 `std::fs`；鍵值資料則用 `Storage` |
| `process` | `blocking(…)` 中的 `std::process::Command` |
| `net` | `blocking(…)` 中的 `std::net::TcpStream`，或 `background(…)` 中的 `tokio::net` |
| `websocket` | 例如 `background(…)` 中的 `tokio-tungstenite` 等 crate |

<a id="imports-and-generated-types"></a>

## 匯入與生成的型別

每個模組都以表中的名稱原樣匯入：`import { join } from "path"`、`import fs from "fs/promises"`。打包工具會保留這些匯入，由執行環境以原生方式提供；模組目錄就只有這十一個名稱。`buffer`、`crypto`、`path`、`url` 和 `zlib` 是 LLRT 的實作，固定於 `d9fd873e793c6551c5d92b2e31480f3279e3cd8d`，其宣告由該修訂版本投影到執行環境實際擁有的匯出上。其餘模組是 NSH 自行實作的。NSH 會保留其 URL、Blob、串流和事件類別的身分（identity）。

十一個模組都可在原生主機和瀏覽器應用程式中載入。`Buffer`、雜湊、加密和壓縮在 WebAssembly 中使用相同的可移植 Rust 實作，包括同步 API；隨機值則使用瀏覽器的加密熵源。瀏覽器中的 `path` 操作使用 POSIX 路徑和虛擬的 `/` 工作目錄。瀏覽器中的檔案使用持久的應用程式私有儲存空間，WebSocket 則使用瀏覽器的傳輸層。在瀏覽器中，執行行程和原始 TCP 呼叫會以 `code` `ERR_FEATURE_UNAVAILABLE_ON_PLATFORM` 失敗。

<a id="how-they-compare-with-nodejs-and-gpui-shell"></a>

## 與 Node.js 和 gpui-shell 的比較

這些模組對其所匯出的子集沿用 Node 的名稱和形態，並在 gpui-shell 有所定義之處沿用其行為。NSH 自己的取捨如下：

- `fs/promises` 的 `exists` 對於目標不存在的符號連結（symlink）是 `true`，而 `unlink`、`rename`、`rmdir`、`lstat` 和 `readlink` 作用於符號連結本身。
- `Stats` 和 `Dirent` 的欄位（`size`、`mtimeMs`、`name` 等）與 Node 一樣是自有屬性，而 `isFile()`、`isDirectory()` 和 `isSymbolicLink()` 則在其原型上。
- `ChildProcess` 監聽器接收事件的負載：輸出文字，或退出時的 `{ code, signal }`（當執行環境終止子行程時，還會附帶 `error` 和 `errorCode`）。`on` 返回子行程。`run` 解析為 `{ code, signal, stdout, stderr }`：即 gpui-shell 的輸出，加上終止子行程的訊號。
- 子行程的環境變數是來自主機的一小組變數，加上應用程式獲授權的名稱；它在應用程式的資料目錄，或 `fs.write` 根目錄內的 `cwd` 中運行（[Processes](#processes)）。
- `process.platform`、`process.arch`、`os.platform()` 和 `os.arch()` 如 gpui-shell 一樣，給出 Rust 的 `std::env::consts` 名稱：`"macos"`、`"windows"`、`"linux"`、`"ios"`、`"android"`；`"aarch64"`、`"x86_64"`（[OS metadata](#os-metadata-and-logging)）。
- 當主機沒有資料目錄時，`process.dataDir` 為 `null`；`process.exit` 會請求主機關閉應用程式介面。
- 限制是每個 API 的一部分：大小、數量和逾時時間會在下文各模組中列出。

<a id="failures"></a>

## 失敗處理

返回 promise 的函式，會以拒絕（reject）該 promise 來回報所有失敗，與 Node 的 `fs/promises` 相同：參數錯誤、應用程式未獲授權的路徑或主機、用盡的限制以及 I/O 錯誤皆然，因此一個 `catch`（或 `.catch`）就能處理全部。同步函式（`process.spawn`、`process.exit`、`os.homedir`、`ChildProcess.write`、全域 `WebSocket` 的建構函式和 `send`）則會拋出錯誤。錯誤的用法（參數型別錯誤、選項超出範圍）會是 `TypeError` 或 `RangeError`。應用程式可處理的每個失敗都帶有 `code`，其值在各個版本之間保持不變；訊息是寫給人看的，可能會改變，因此應用程式應根據 `code` 作分支處理：

| `code` | 含義 |
|---|---|
| `ERR_ACCESS_DENIED` | 應用程式的 `capabilities` 不允許該呼叫。錯誤帶有 `permission`（即該能力在 `nsh.json` 中的鍵：`"fs"`、`"process"`、`"network"`），以及 `resource`（所請求的對象：路徑、指令（`process.exit` 則為 `"exit"`）、socket 的 `"host:port"`，或 WebSocket 的 URL） |
| `ERR_FEATURE_UNAVAILABLE_ON_PLATFORM` | 該呼叫屬於其他平台：檔案在桌面和瀏覽器中運行，行程在桌面中運行，TCP socket 在原生主機中運行，`os.homedir()` 則在有設定主目錄的主機上運行 |
| `ERR_NSH_QUOTA_EXCEEDED` | 執行環境的某項限制已用盡：進行中的操作或資料、子行程、socket、WebSocket、等待發送的位元組、監聽器 |
| `ETIMEDOUT` | 呼叫逾時：`run` 的 `timeoutMs`、連線、WebSocket 握手、寫入或關閉 |
| `ENOENT`、`EEXIST`、`EACCES`、`ECONNREFUSED`、... | 作業系統的回應，使用 Node 的錯誤碼；`EACCES` 和 `EPERM` 是作業系統拒絕存取檔案，與應用程式的能力無關 |
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

宿主應用程式可能授予少於應用程式所聲明的權限（[Sandbox and Capabilities](../docs/sandbox-and-capabilities.md)），因此應用程式應像處理失敗的請求一樣處理 `ERR_ACCESS_DENIED`。

<a id="os-metadata-and-logging"></a>

## OS metadata 與日誌

`os.platform(): string` 和 `os.arch(): string` 回報實際的原生主機作業系統和架構，`process.platform` 和 `process.arch` 的值與之相同。它們與 gpui-shell 一樣，使用 Rust 的 `std::env::consts::OS` 和 `ARCH` 的名稱：作業系統為 `"macos"`、`"windows"`、`"linux"`、`"ios"`、`"android"`，架構為 `"aarch64"`、`"x86_64"`，因此應用程式可直接與之比較（`process.platform === "macos"`）。`os.EOL: string` 是主機的換行分隔符。`os.homedir(): string` 返回已設定的主機主目錄絕對路徑；若沒有設定，則拋出帶有 `code` `ERR_FEATURE_UNAVAILABLE_ON_PLATFORM` 的錯誤。目錄路徑只是 metadata：檔案操作仍然需要 `fs.read` / `fs.write` 授權。

瀏覽器應用程式讀取到的是空的 `process.env` 物件，而 `os.homedir()` 在瀏覽器中會拋出 `ERR_FEATURE_UNAVAILABLE_ON_PLATFORM`，因為主目錄路徑和環境變數屬於原生主機。

`import console from "console"` 共用 VM 的全域 `console` 物件。該模組只有 default 匯出，支援 `log`、`info`、`debug`、`warn`、`error`，每個的簽名皆為 `(...values: unknown[]): void`。它使用 NSH 的日誌格式化。

<a id="compression"></a>

## 壓縮

`zlib` 來自 LLRT，NSH 另外加入了一項限制：每次解壓縮（`inflate`、`inflateRaw`、`gunzip`、`brotliDecompress`、`zstdDecompress` 及其 `Sync` 形式）最多產生 64 MiB，若 VM 的堆積（heap）限制較小，則以該限制為準。輸出超出時會拋出 `RangeError`，與 Node.js 對 `maxOutputLength` 的處理相同；應用程式自己的 `maxOutputLength` 可為單次呼叫設定更低的上限。`Buffer.alloc`、`Buffer.allocUnsafe`、`Buffer.allocUnsafeSlow` 和 `crypto.randomBytes` 在大小超出 VM 的堆積限制（若無限制則為 1 GiB）時，會拋出 `RangeError`（`code` `ERR_OUT_OF_RANGE`）；`allocUnsafe` 返回已清零的記憶體。

<a id="files"></a>

## 檔案

`fs/promises` 在桌面主機（macOS、Windows 和 Linux）上讀寫原生檔案，在瀏覽器中則透過 Origin Private File System（OPFS）讀寫應用程式私有的檔案。每個路徑在操作開始前，都會根據 `capabilities.fs` 檢查：`read` 根目錄用於 `readFile`、`readdir`、`stat`、`lstat`、`readlink` 和 `exists`，`write` 根目錄用於 `writeFile`、`mkdir`、`rename`、`unlink` 和 `rmdir`。每個失敗都會拒絕 promise：路徑超出授權範圍時，會在進行任何磁碟操作之前，以 `code` `ERR_ACCESS_DENIED`（`permission` `"fs"`，`resource` 為應用程式所寫的路徑原樣）拒絕。

```json
{
  "capabilities": {
    "fs": { "read": ["${dataDir}"], "write": ["${dataDir}"] }
  }
}
```

根目錄可以是絕對路徑、`${dataDir}`（本應用程式的資料目錄，由主機選定）、`${pluginDir}`（應用程式的目錄）、`${homeDir}`，或相對於應用程式目錄的路徑。呼叫中的相對路徑會依次在每個獲授權的根目錄中解析。嵌入的主機可以進一步收窄授權。每個操作都限於其獲授權的根目錄之內，包括符號連結在內；絕對路徑按其書寫形式檢查，因此要到達根目錄，須使用它自己的路徑（或其解析後的路徑），而不是經由根目錄以外的連結。`lstat`、`readlink`、`exists`、`unlink`、`rename` 和 `rmdir` 作用於符號連結本身：`exists` 對於目標不存在的符號連結是 `true`，而 `unlink` 會移除連結並保留其目標。

失敗帶有 Node 的錯誤屬性：`code`（`ENOENT`、`EEXIST`、`ENOTDIR`、`EISDIR`、`ENOTEMPTY`、`ELOOP`、`EACCES`、`EPERM` 等；`EILSEQ` 表示並非 UTF-8 的文字，`ERR_FS_FILE_TOO_LARGE` 表示超出讀取限制）、`syscall` 和 `path`，因此 `error.code === "ENOENT"` 可分辨檔案不存在的情況。超出授權範圍的路徑會以 `ERR_ACCESS_DENIED` 拒絕；在 iOS 或 Android 上的呼叫（這些應用程式以 [`Storage`](./nsh.md#storage) 保存資料）會以 `ERR_FEATURE_UNAVAILABLE_ON_PLATFORM` 拒絕；參數錯誤（未知的編碼或選項）則以 `TypeError` 拒絕。

`readFile` 返回 `Uint8Array`，或在指定 `"utf8"` 時返回字串，可讀取最大 64 MiB 的檔案。`writeFile` 寫入最大 8 MiB 的字串或 `Uint8Array`，建立或取代一個一般檔案。`readdir` 列出最多 10 000 個名稱（合共 1 MiB；較大的目錄會以 `RangeError`、`code` `ERR_OUT_OF_RANGE` 拒絕），結果已排序，或在指定 `{ withFileTypes: true }` 時返回 `Dirent`（`name`、`isDirectory()`）。`stat` 和 `lstat` 解析為帶有 `size`、`mode`、`mtimeMs` / `atimeMs` / `birthtimeMs`、`mtime` / `atime` / `birthtime`（作為 `Date`）以及 `isFile()`、`isDirectory()` 和 `isSymbolicLink()` 的 `Stats`。`rmdir` 移除一個空目錄。一個 VM 最多同時執行 1024 個操作，並最多同時持有 64 MiB 的進行中檔案資料（交給 `writeFile` 而尚未寫入的資料，以及已讀取而其 promise 尚未完成的資料）；超出這些限制的呼叫會以 `ERR_NSH_QUOTA_EXCEEDED` 拒絕，而超過 8 MiB 的 `writeFile` 則以 `RangeError`（`code` `ERR_OUT_OF_RANGE`）拒絕。

瀏覽器儲存空間以頁面的來源（origin）和應用程式自己的命名空間為範圍，使用相同的檔案授權和大小限制，並在 Rust 中檢查。OPFS 需要安全情境（secure context），例如 HTTPS 或 localhost。檔案修改時間來自瀏覽器的 metadata；未知的存取時間、建立時間和權限模式則為零。`rename` 使用瀏覽器的原子性控制代碼移動，若瀏覽器不支援，則回報 `ENOTSUP`。瀏覽器中的項目是一般檔案或目錄，而 `readlink` 回報 `EINVAL`。
<a id="processes"></a>

## 處理程序

`process.spawn` 和 `process.run` 在桌面主機（macOS、Windows 和 Linux）上啟動命令。執行階段以參數陣列直接執行程式，不經過 shell，並擁有自己的管道；stdout 和 stderr 以增量 UTF-8 形式送達。

```json
{
  "capabilities": {
    "process": { "execute": ["git"], "env": ["GIT_AUTHOR_NAME"] },
    "fs": { "write": ["${dataDir}"] }
  }
}
```

命令必須與 `process.execute` 完全相符：`git` 和 `/usr/bin/git` 是各自獨立的授權。裸命令會透過主機 `PATH` 中的絕對目錄解析；在 Windows 上，裸命令也會在這些目錄中找到 `<name>.com` 和 `<name>.exe`。批次檔（`.cmd`、`.bat`）透過 `cmd.exe` 執行：授予其絕對路徑（`C:\Windows\System32\cmd.exe`），並將 `/d`、`/c` 和腳本作為參數傳入。子程序的環境變數包括來自主機的 `PATH`、`HOME`、`USERPROFILE`、`SystemRoot`、`TEMP`、`TMP`、`TMPDIR`、`LANG` 和 `LC_*`，以及 `process.env` 所授予的名稱（完全比對；只有在 Windows 上才忽略大小寫，因為其環境變數本來就不分大小寫）。子程序在應用程式的資料目錄中執行（若不存在則建立），或在 `cwd` 中執行，該目錄必須是 `fs.write` 根目錄內已存在的目錄，因為子程序可能會寫入其執行所在的位置。嵌入式主機可以收窄授權。

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

`run` 無論結束狀態為何都會 resolve `{ code, signal, stdout, stderr }`：`code` 是結束狀態，`signal` 為 `null`；若子程序是被信號終止，則 `code` 為 `null`，`signal` 為信號名稱（`"SIGTERM"`）。所有失敗情況都會 reject。`spawn` 會立即返回子程序；`stdin: "pipe"` 會啟用 `write` 和 `end`，`lines: true` 則會傳送完整的行。`on(event, handler)` 返回子程序，處理函式會收到事件的 payload：文字，或在最後一次輸出之後只觸發一次的 `{ code, signal }`（當執行階段終止子程序時，例如逾時或行過長，會附帶 `error`）（對於稍後才加入的監聽器則會立即觸發）。`pid` 是子程序的處理程序 ID。`spawn` 會在子程序啟動前拋出 `run` reject 的相同內容：`process.execute` 未授予的命令會以 `ERR_ACCESS_DENIED` 失敗（`permission` `"process"`，`resource` 為該命令），超出 `fs.write` 授權範圍的 `cwd` 會以 `ERR_ACCESS_DENIED` 失敗（`permission` `"fs"`，`resource` 為 `cwd`），在桌面平台以外呼叫會以 `ERR_FEATURE_UNAVAILABLE_ON_PLATFORM` 失敗，超過子程序數量上限的呼叫會以 `ERR_NSH_QUOTA_EXCEEDED` 失敗；啟動失敗會帶有 `code`（`ENOENT` 表示找不到可執行檔，`EACCES` 表示作業系統無法執行該檔案）、`syscall`（`spawn <command>`）和 `path`。`run` 在期限屆滿時以 `ETIMEDOUT` reject，輸出超出擷取上限時則以 `RangeError`（`code` `ERR_CHILD_PROCESS_STDIO_MAXBUFFER`）reject；已 spawn 的子程序結束時，其 `error` 帶有相同的訊息，`errorCode` 則帶有其代碼。當主機沒有資料目錄時，`process.dataDir` 為 `null`。`kill`、逾時、reactive owner 的清理以及 VM 的拆除，都會終止整個處理程序樹：在 Unix 上，其處理程序群組會先收到 SIGTERM，250 ms 後再收到 SIGKILL（拆除時則立即發送 SIGKILL）。

| 限制 | 值 |
|---|---|
| `timeoutMs` | 最多 4,294,967,295 ms；`run` 預設為 30 秒，`spawn` 則會一直執行至結束 |
| `run` 的擷取 | 每個串流 8 MiB |
| 使用 `lines: true` 的單行 | 8 MiB |
| 每個 VM 的子程序數 | 32 |
| 每個 VM 處理中的輸出 | 8 MiB；讀取器會等待 JS 取走 |
| 每個子程序待處理的 stdin | 1 MiB；超出時 `write` 會拋出 `ERR_NSH_QUOTA_EXCEEDED` |
| 監聽器 | 每個子程序每個事件 64 個 |

`process.exit(code?)` 會請求主機關閉此應用程式介面。請在 `capabilities.process` 中以 `"exit": true` 授予此權限；引擎會透過平台的應用程式結束命令轉發該請求。授權未涵蓋的呼叫會拋出 `ERR_ACCESS_DENIED`（`permission` `"process"`，`resource` `"exit"`）。主機透過其安裝的結束處理函式接收結束請求；在其他情況下，呼叫會拋出 `ERR_FEATURE_UNAVAILABLE_ON_PLATFORM`。在 macOS 上，這會關閉介面視窗。在瀏覽器中，這會停止應用程式並清除其介面，同時保持主機頁面開啟。嵌入式主機可自行控制其介面如何處理該請求。Gallery 拒絕此權限，因此其 **Request host exit** 操作用於示範權限處理，並保持示範開啟。

<a id="network-permissions-and-boundaries"></a>

## 網絡權限與邊界

全域 `fetch` 保留 NSH 的串流 HTTP 實作，會針對請求和重新導向跳轉檢查 `network.hosts` 或 `network.http`。WebSocket 支援 `ws:` / `wss:`、文字與二進位訊息、事件監聽器以及關閉握手。WebSocket 握手是一個 HTTP GET，因此全域 `WebSocket` 與 `websocket` 模組的 `connect` 都使用 HTTP 授權：`ws` 會作為 `http` 檢查，`wss` 會作為 `https` 檢查，並使用 GET（規則亦可在 `schemes` 中列出 `ws` / `wss`）。NSH 會在開始連線前檢查經正規化的初始 URL。原生握手會連線至該 URL 並拒絕重新導向；瀏覽器中的 WebSocket 重新導向與連線政策則由瀏覽器控制。兩種 API 都會拒絕含有憑證或片段的 URL。每個 VM 在兩種 API 合計下最多持有 32 個 WebSocket，兩者的訊息上限均為 8 MiB。

未獲授權的 URL 會在開始任何連線之前被拒絕。全域 `WebSocket` 會以瀏覽器回報連線失敗的方式回報：建構函式會返回該 socket，其後會觸發 `error` 和 `close`（代碼 1006，`wasClean` `false`），因此應用程式在建構函式之後立即設定的處理函式能夠收到這些事件。模組的 `connect` 會以 `ERR_ACCESS_DENIED` reject（`permission` `"network"`，`resource` 為該 URL）。第 33 個 WebSocket 會（在建構函式中）拋出或（`connect`）reject `ERR_NSH_QUOTA_EXCEEDED`，格式錯誤的 URL 則會是 `SyntaxError`（建構函式）或 `TypeError`（`connect`）。

全域 `WebSocket` 最多將八則訊息排入待發送佇列，緩衝上限為 8 MiB（`bufferedAmount`）；超出任一上限的 `send()` 會拋出 `ERR_NSH_QUOTA_EXCEEDED`，而 socket 一旦進入關閉中狀態，`send()` 便會丟棄其資料，與瀏覽器的行為一致。其握手和每次寫入都會在 30 秒後逾時，關閉時最多等待對端的關閉幀 5 秒。訊息會在到達時以 `message` 事件傳遞。

`websocket` 模組的 `WebSocketConnection` 最多持有八個待處理操作（讀取、寫入、關閉），以及最多 8 MiB 尚未送出的寫入；超出任一上限的 `write()` 會以 `ERR_NSH_QUOTA_EXCEEDED` reject，超過 8 MiB 的訊息則會以 `RangeError`（`code` `ERR_OUT_OF_RANGE`）reject。同一時間只可有一個 `read()` 在等待；第二個會以 `TypeError` reject。在被讀取之前到達的訊息會等待應用程式處理，其流量跟隨應用程式的讀取：當有八則訊息或 8 MiB 尚未被讀取時，連線會停止從網絡讀取，因此對端的發送也會等待，待應用程式讀取後再恢復讀取。解析、連線和握手合計、每次寫入以及關閉，都會在 30 秒後逾時。

`read()` 按到達順序 resolve 訊息。當連線已正常關閉（由對端關閉，或應用程式呼叫了 `close()`）且之前的所有訊息都已被讀取後，`read()` 會 resolve `null`，與 `net` socket 在 EOF 時的行為相同；`closeCode` 和 `closeReason` 此時保存關閉幀的代碼和原因（連線開啟時為 `null`；沒有代碼的關閉幀為 1005；未經關閉握手就結束的連線為 1006）。`read()` 只會在失敗時 reject，並且在其之前的訊息之後，附帶其 `code`：未經關閉握手就結束的連線為 `ERR_SOCKET_CLOSED`，作業系統針對 socket 錯誤的代碼為 `ETIMEDOUT`，協定錯誤則為 `EPROTO`（若握手被拒絕，則附帶 HTTP `status`）。`close(code?, reason?)` 會在關閉幀中發送其代碼（1000，即預設值，或 3000 至 4999）和原因（最多 123 個 UTF-8 位元組），與全域 `WebSocket` 的 `close()` 相同；超出這些範圍的代碼或原因會以 `RangeError`（`code` `ERR_OUT_OF_RANGE`）reject。它會丟棄尚未讀取的訊息，並在對端回應關閉握手後 resolve。

```tsx
import { connect } from "websocket";

const socket = await connect("wss://chat.example.com/socket");
await socket.write("hello");
for (let message; (message = await socket.read()) !== null; ) {
  console.log(message);
}
console.log(`closed: ${socket.closeCode} ${socket.closeReason}`);
```

`net.connect({ host, port })` 只使用 `network.sockets`，即一份精確 `"host:port"` 目的地的清單（IPv6 則使用 `"[::1]:9000"`），並在 DNS 查詢之前檢查。每個項目授予某個主機上的一個連接埠；主機模式、`network.hosts` 和 HTTP 授權只涵蓋 HTTP 流量，而沒有 `"capabilities"` 的應用程式也會列出其 socket。返回的 `Socket` 提供 `read(size?)`、`write(text)` 和 `close()`；讀取會返回 `Uint8Array`，在 EOF 時則返回 `null`。每個失敗都會 reject：未獲授權的目的地以 `ERR_ACCESS_DENIED`（`permission` `"network"`，`resource` `"host:port"`）reject，第 33 個 socket 以及超過可等待的 4 MiB 的寫入以 `ERR_NSH_QUOTA_EXCEEDED` reject，超過 1 MiB 的讀取或寫入以 `RangeError`（`code` `ERR_OUT_OF_RANGE`）reject；連線和 I/O 失敗以 Node 的 `code`（`ECONNREFUSED`、`ENOTFOUND`、`ETIMEDOUT`、`ECONNRESET` 等）和 `syscall` reject，連線失敗還會附帶 `address` 和 `port`，在已關閉的 socket 上寫入則以 `ERR_SOCKET_CLOSED` reject（在該處讀取則返回 `null`）。連線和 I/O 均有 30 秒逾時，每次讀取或寫入上限為 1 MiB，最多 4 MiB 的寫入可等待發送，而 `close()` 會立即結束待處理的讀取和寫入。每個 VM 最多同時保持 32 個處於開啟或連線中狀態的 socket。這是一個基於 promise 的客戶端 socket 介面。

原始 TCP 使用原生主機。兩種 WebSocket 介面在網頁應用程式中都使用瀏覽器傳輸，並保留 Rust 的權限檢查及上述限制。自訂瀏覽器握手標頭會回報明確的不支援選項錯誤。瀏覽器的連線政策同樣適用。嵌入式授權會與應用程式的權限宣告取交集。

<a id="websocket-grant-example"></a>

## WebSocket 授權範例

此 `nsh.json` 片段允許對此 `wss` URL 進行 GET 握手，並保留其路徑和 HTTPS 範圍：

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

TCP 使用 socket 授權：即應用程式所連線的精確主機和連接埠。

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

在 `examples/gallery` 中開啟 **Standard APIs**，即可執行檔案操作、子程序、TCP 以及兩種 WebSocket 介面，並檢視主機中繼資料和佇列中的工作。工具操作會示範緩衝區、雜湊、壓縮和檔案 URL。每個操作都會顯示其結果或錯誤。檔案保存在 gallery 自身資料目錄下的臨時目錄中，並在操作後移除。TCP 和 WebSocket 操作會連線至連接埠 9876 和 9877 上的本機 echo 伺服器。在網頁上，檔案操作使用 OPFS，工具在 WebAssembly 中執行，兩個 WebSocket 操作都使用瀏覽器連線；處理程序和 TCP 操作則會顯示主機的具型別平台錯誤。

Gallery 的 **AI Chat** 在桌面平台上使用 `process.spawn`，透過本機安裝的 Claude 或 Codex CLI 進行對話。請先在終端機中透過該 CLI 登入，然後在輸入區選擇提供者。回覆會以對話作為上下文；按 Stop 或離開畫面都會終止子程序。網頁和行動裝置則執行腳本化的串流對話，包括推理、工具卡片和錯誤復原。
