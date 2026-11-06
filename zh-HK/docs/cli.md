---
title: "CLI"
description: "所有 NSH 子命令與旗標:init、build、test、check、dev、run、package,以及簽署相關命令 keygen、certify、publish、verify、symbolicate 和 revoke。"
order: 6
group: start
---

# CLI

`nsh` 是用來建置 NSH 應用程式（以 Rust 或 TSX 撰寫）的工具。每個會建置應用程式的子命令都接受 `[ENTRY]`：應用程式的目錄（預設為目前所在的目錄，因此 `cd my-app && nsh run` 可以運作）。它會執行 Rust 應用程式的根元件（`nsh.json` `"root"`）或 TSX 應用程式的 `App.tsx`，也可以是 TSX 進入點模組。它會讀取應用程式根目錄中的 `nsh.json`，並更新 `.nsh/types` 中的型別宣告。

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

`nsh <command> --help` 會印出命令的旗標；`nsh -V`（`--version`）會印出版本以及建置時所用的 Git revision。

<a id="output"></a>

## 輸出

每個命令每個步驟只印出一行，只有在失敗時才會印出詳細資訊：

```text
✓ built the Rust crate gallery-native (5.0s)
✓ built App.tsx (500 B js, 809 B bytecode, 21ms)
✓ built the development host for the iOS simulator (12.7s)
• iOS Simulator (iPhone 16 Plus) connected, build 1
warn iOS Simulator: image failed: An SSL error has occurred and a secure connection to the server cannot be made.
✓ rebuilt App.tsx (18ms), 1 device
```

`✓` 表示已完成的步驟，`→` 表示連線位置，`•` 表示裝置的動作；`warn` 和 `error` 行是問題，
一般的行則是你的應用程式本身的輸出（`console.log`）。在終端機中，旋轉圖示會顯示正在執行的步驟，
並以顏色標示各行（除非設定了 `NO_COLOR`）；重新導向到檔案時，只會寫入結果行，且不含顏色。
當 NSH 執行的工具（應用程式 Rust crate 所用的 cargo、開發 host）之一失敗時，它們的輸出會印在 `error`
行之下。

`-v, --verbose`（適用於任何命令；也可用 `NSH_VERBOSE=1`）會即時印出所有內容：每一行 log 及其等級與
來源、cargo 的輸出，以及各 host 自身的輸出。

## nsh init

```sh
nsh init [DIR] [--name <NAME>] [--template <ts|rust|mixed>] [--nsh-source <DIR>]
```

依範本在 `DIR`（預設為目前目錄，不存在時會建立）中建立應用程式。未指定 `--template` 時，在終端機中 `nsh init` 會詢問要使用哪一個（按 Enter 選擇 `ts`），在其他環境（腳本、CI）則採用 `ts`。

| 範本 | 建立的內容 |
|---|---|
| `rust` | 以 Rust 撰寫的應用程式：一個 Cargo 專案（`Cargo.toml`、含根元件的 `src/lib.rs`、用於 `cargo run` 的 `src/main.rs`）、含有 `"rust": "."` 和 `"root": "App"` 的 `nsh.json`、含有 `tsconfig.json` 和 `.nsh/types` 的根元件測試 `App.test.tsx`、`.gitignore` 以及一份 README，其中也說明之後如何加入 TSX 進入點。`nsh run` 和 `nsh package` 在每個目標上都不使用 QuickJS 來掛載根元件（`nsh test` 會為 TypeScript 測試開啟它），包括瀏覽器（[使用 Rust 建置](./rust.md)）；`cargo run` 可直接在 macOS、Windows 或 Linux 上啟動它。 |
| `ts` | TSX 應用程式：`App.tsx`、其測試 `App.test.tsx`（`nsh test`）、`nsh.json`、`tsconfig.json`、`.gitignore` 和 `.nsh/types`。已存在的檔案會保留；只有在這些檔案全部已存在時才會失敗。 |
| `mixed` | 在根目錄帶有自己 Rust crate 的 TSX 應用程式：`App.tsx`、其測試 `App.test.tsx`、`tsconfig.json`、含有 `"rust": "."` 的 `nsh.json`、`.gitignore`、`.nsh/types`、一份 README，以及位於 `App.tsx` 旁的 crate（`Cargo.toml`、`src/lib.rs`），其 `#[native_module("<name>/native")]` 匯出了 `App.tsx` 會使用的元件、模組與類別。未指定 `"root"` 時，`App.tsx` 即為進入點。 |

| 旗標 | 說明 |
|---|---|
| `--name <NAME>` | 寫入 `nsh.json` 的顯示名稱。預設：目錄名稱。id 會變成 `com.example.<name>`（僅限字母與數字，小寫），而 crate 的匯入識別字 `<name>/native`（小寫，單字以 `-` 連接）。 |
| `--template <TEMPLATE>` | `rust`、`ts` 或 `mixed`（如上）。`rust` 和 `mixed` 需要 Rust；`cargo run` 還需要原生桌面後端的開發函式庫。 |
| `--nsh-source <DIR>` | 搭配 `rust` 或 `mixed`：crate 會以路徑依賴 `DIR` 中 checkout 的 NSH crate，以便針對 NSH 的原始碼建置應用程式。 |

`rust` 和 `mixed` 的 crate 依賴 crates.io 上與 CLI 版本相同的 NSH crate（使用 `--nsh-source` 時，則依賴某個 checkout 中的 crate），而 `nsh` 命令會用同樣的 crate 建置應用程式的 runner 與 host。對這類應用程式執行每個命令之前，`nsh` 會建置一個由應用程式的 crate 與 NSH 核心組成的小型程式，用來描述它們的元件、模組與類別，並在 crate 變更時執行它；CLI 會憑這份描述自行完成應用程式的打包、編譯、型別檢查、提供服務與封裝。Rust 應用程式的建置只會編譯它的 crate 與 NSH 核心。請在新的應用程式目錄中建立它們：只要其中任何檔案已存在，就會在寫入任何內容之前回報衝突。

Rust crate 透過 Git 依賴 NSH 的應用程式，會使用 Cargo 在應用程式 lockfile 中解析出的 checkout。產生的 host 共用該 checkout，包括被應用程式的 Cargo patch 重新導向的 NSH 依賴。

## nsh run

```sh
nsh run [ENTRY] [--target catalyst|ios|android|macos|linux|windows|gpui|web] [--device <DEVICE>] [--port <PORT>] [--release] [--limits [<LIMITS>]] [--trace] [--fps] [--name <NAME>] [--window-size <WIDTHxHEIGHT>] [--display <N>]
```

```sh
nsh run my-app                     # a Rust app's root, or a TSX app's App.tsx, on this machine's backend
nsh run my-app --target ios        # in the iOS simulator
nsh run my-app/App.tsx --target web
```

對於 TSX 進入點，`nsh run` 會啟動開發伺服器（如同 `nsh dev`），啟動一個從開發伺服器載入應用程式的開發 host，並在每次儲存時重新建置。Hot module replacement 會就地修補執行中的應用程式；應用程式的 log 與錯誤會印在終端機中。按 Ctrl-C 即可停止（或關閉 Catalyst、macOS、Linux、Windows 或 GPUI 視窗）。無論以何種方式結束（Ctrl-C、`kill` / `pkill`、發生錯誤），它都會停止自己啟動的 host：Catalyst 應用程式、macOS、Linux、Windows 或 GPUI host、模擬器中的開發 host，或 Android 裝置上的開發 host。

Rust 應用程式（`nsh.json` `"root"`，[使用 Rust 建置](./rust.md)）不需要開發伺服器與 QuickJS 即可執行：`nsh run` 會為目標建置掛載了其根元件的應用程式 runner 並啟動它（在桌面平台上為 debug 建置，其 log 顯示在終端機中；在模擬器與 Android 上則是安裝應用程式），並在 crate 的 Rust 程式碼變更時重新建置並重新啟動。使用 `--target web` 時，它會印出頁面的位址，而已開啟的頁面會自動載入新的 runtime。若要改為執行 TSX 進入點，請指定它（`nsh run App.tsx`）。

| 旗標 | 預設 | 說明 |
|---|---|---|
| `--target <TARGET>` | macOS 上為 `macos`，Linux 上為 `linux`，Windows 上為 `windows` | `catalyst`：Mac Catalyst host，iPhone 大小的視窗（390×844）。`ios`：iOS 模擬器中的 host。`android`：Android 裝置或模擬器上的 host。`macos`：AppKit host，1200×800 的視窗（[macOS](./macos.md)）。`linux`：GTK host，390×844 的視窗（[Linux](./linux.md)）。`windows`：Win32 host，1200×800 的視窗（[Windows](./windows.md)）。`gpui`：GPUI host，1200×800 的視窗，可在 macOS、Windows 或 Linux 上執行，以內嵌 TSX 應用程式的 GPUI 應用程式顯示它的方式來顯示 TSX 應用程式（[GPUI](./gpui.md)）。`web`：開發伺服器的頁面，位於它所印出的位址（[Web](./web.md#develop-in-the-browser)）。 |
| `--device <DEVICE>` | | 要使用的 iOS 模擬器，以名稱（`"iPhone 16 Pro"`）或 UDID 指定。預設：已開機的模擬器，否則為最新的 iPhone，並將其開機。 |
| `--port <PORT>` | `8790` | 開發伺服器的連接埠。在清理完成後，會取代此連接埠上先前的 NSH 開發工作階段。 |
| `--release` | | 縮減程式碼並移除除錯資訊。Release bundle 沒有 hot module replacement：每次儲存都會重新載入應用程式。 |
| `--limits [<LIMITS>]` | | 將應用程式以內嵌於另一個應用程式中的方式執行，並受其 host 應用程式所設的限制約束：`memory` 和 `stack`（在 `KB`、`MB` 或 `GB` 中）、`load` 和 `call`（在 `ms` 或 `s` 中）以及 `nodes`，例如 `--limits memory=128MB,call=500ms`。未列出的項目維持內嵌預設值，單獨使用 `--limits` 時即以這些預設值執行（[沙箱與能力](./sandbox-and-capabilities.md#limits)）。未使用時，應用程式會像封裝後的應用程式一樣獨立執行。適用於 TSX 進入點。 |
| `--trace` | | Host 會將每次 commit 的時間（JS、版面配置、mount 項目）記錄到終端機。 |
| `--fps` | | 效能監視器：影格率、影格與 commit 的耗費、CPU、GPU 與記憶體，在 macOS 上顯示於應用程式上方（[macOS](./macos.md#performance-monitor)），並在 macOS、Linux、Windows 與 iOS 上每秒記錄一次。 |
| `--name <NAME>` | `nsh.json` 名稱 | 選單列中的應用程式顯示名稱與初始視窗標題（`--target macos`，TSX 進入點）。 |
| `--window-size <WIDTHxHEIGHT>` | Host 預設值 | 初始視窗大小（以 point 為單位），例如 `800x600`（`--target macos`、`linux`、`windows` 和 `gpui`，TSX 進入點）。 |
| `--display <N>` | 主顯示器 | 視窗置中開啟的顯示器：`1` 是主顯示器（有選單列的那個），`2` 是下一個，依此類推；若指定的數字沒有對應的顯示器，則在主顯示器上開啟（`--target macos`，TSX 進入點）。 |

使用 `--target android` 時，會使用 `adb devices` 列出的第一個裝置；開發伺服器的連接埠會以 `adb reverse` 轉送到該裝置。請參閱[開始使用](./getting-started.md#run-it)與[開發伺服器與偵錯](./dev-server-and-debugging.md)。

取代時，最多會等待十秒，讓前一個工作階段完成清理。若連接埠被其他程式或較舊的 NSH CLI 佔用，會產生指出該連接埠的錯誤。請使用不同的 `--port` 值來同時執行多個應用程式；`--port 0` 會向作業系統要求一個可用的連接埠。

## nsh dev

```sh
nsh dev [ENTRY] [--target catalyst|ios|android|macos|linux|windows|gpui|web] [--device <DEVICE>] [--server-only] [--port <PORT>] [--release] [--limits [<LIMITS>]]
```

啟動開發伺服器，並開啟此系統的原生 host：macOS 上為 AppKit，Linux 上為 GTK，Windows 上為 Win32。進行行動裝置開發時，請明確選擇 `--target ios` 或 `--target android`。`--server-only` 為你自行啟動的 host 提供服務。伺服器會建置應用程式、監看進入點所在的目錄，並將每次重新建置的結果推送給已連線的 host。使用 `--server-only` 時，它會印出供本機 host 使用的 URL、供裝置使用的每個區域網路位址各一個 URL，並且在 web runtime 存在時，印出供瀏覽器開啟以執行應用程式的頁面（[Web](./web.md#develop-in-the-browser)）：

```text
✓ built App.tsx (3.2 KB js, 9.8 KB bytecode, 21ms)
→ dev server ws://127.0.0.1:8790/ws
  browsers: http://127.0.0.1:8790/
  devices on this network: ws://192.168.1.20:8790/ws
  browsers on this network: http://192.168.1.20:8790/
```

`nsh dev --server-only` 用於內嵌了開發 SDK 的應用程式（`NativeShellDev.xcframework`、`nsh-dev.aar`）。`--target`、`--device`、`--port`、`--release` 和 `--limits` 的作用與 `nsh run` 相同；`--server-only` 會選擇不啟動 host 的伺服器。

## nsh test

```sh
nsh test [PATH] [--filter <NAME>] [--trace] [--fps] [--junit <FILE>] [--target <TARGET>] [--browser <PATH>] [--web-host <JS>] [--display <N>]
```

以 headless 方式執行應用程式的測試（[測試](./testing-and-trace.md)）：測試檔（`*.test.tsx`、`*.test.ts`，匯入 `nsh/test`）位於 `PATH`、某個目錄（預設為目前目錄；隱藏目錄、`node_modules` 和 `target` 會被略過），或是測試檔 `PATH`。若指定的是帶有自己 Rust crate 的應用程式目錄（`nsh.json` `"rust"`：Rust 應用程式或帶有 crate 的 TSX 應用程式），它會先在目錄中每個 crate 自己的目錄裡執行 `cargo test`，並將每個 Rust 測試與 TypeScript 測試一起顯示並計數，歸在其測試目標的檔案之下（`src/lib.rs › tests::adds`）；只有 Rust 測試的 Rust 應用程式也以此方式測試。每個測試檔都在各自的 engine 上執行，其測試開啟的每個應用程式則在另一個全新的 engine 上執行。它會為每個測試印出一行，失敗時則印出擲出的內容、測試檔中的位置，以及畫面上的文字；只要有任何失敗，就會以非零代碼結束。若指定的是應用程式的進入點（`nsh test App.tsx`；Rust 應用程式的進入點：`nsh test nsh.json`），它會透過網路開啟應用程式，讓它執行 1.2 秒，並執行標準輸入所給的步驟（`await app.press("Add")`，其中 `app` 為該應用程式）。TSX 應用程式在 CLI 自己的處理序中執行；帶有自己 Rust crate 的應用程式，則在以這些 crate 建置的 headless runner 中執行，CLI 會為它建置進入點。除非測試將應用程式以 Android 開啟（`open` 的 `platform`），否則 headless 執行的行為等同 iOS：`platform.os` 為 `"ios"`，並套用 `ios:` 類別與 `ios={{…}}` props。

```text
✓ App.test.tsx › counts taps (321ms)
✓ 1 test: 1 passed, 0 failed (343ms)
```

| 旗標 | 說明 |
|---|---|
| `--filter <NAME>` | 只執行名稱（接在它所在的 `describe` 區塊名稱之後）包含 `NAME` 的測試；對 crate 而言則為 `cargo test <NAME>`。 |
| `--trace` | 在測試所開啟的應用程式中，依其所屬的步驟（`── press(Add): 7 items`）印出每個 mount 批次，以及每次 commit 的時間：第一個影格、一個步驟或捲動的一個影格所耗費的成本。搭配 `--target` 時，則是 host 的批次與時間。 |
| `--fps` | 搭配 `--target linux`、`macos`、`windows` 或 `ios`：host 會每秒記錄一次其效能監視器的讀數（影格率、影格階段、commit、CPU、記憶體），以 `-v` 顯示。 |
| `--junit <FILE>` | 同時將結果以 JUnit XML 報告的形式寫入 `FILE`，這是 CI 服務用來顯示測試結果的格式：每個測試檔一個 `testsuite`，每個測試一個 `testcase`。 |
| `--target <TARGET>` | 在此平台的開發 host 上，而非以 headless 方式，執行測試所開啟的應用程式（`macos`、`linux`、`windows`、`gpui`、`web`、`ios` 和 `android`；`web` 會在 headless 的 Chrome、Edge 或 Chromium 中執行它們）：各步驟會使用該平台自己的輸入（[測試](./testing-and-trace.md#on-a-real-platform)），而 `open` 會依平台檢查它的選項，並拒絕無法支援的選項（`ERR_NSH_TEST_UNSUPPORTED`：iOS 與 Android 上的 `width` 和 `height`、其他種類裝置的 `platform`）。在不使用 `--target` 的執行中，crate 的 Rust 測試會在這台機器上執行。 |
| `--browser <PATH>` | `--target web` 用來執行應用程式的 Chrome、Edge 或 Chromium 可執行檔（預設：這台機器上安裝的那個）。 |
| `--display <N>` | 搭配 `--target macos`：應用程式視窗置中開啟的顯示器：`1` 是主顯示器（有選單列的那個），`2` 是下一個，依此類推；若指定的數字沒有對應的顯示器，則在主顯示器上開啟。預設會在次要顯示器上開啟（主顯示器之外的第一個，且不是它的鏡像），讓測試執行獨佔一個螢幕；若只有一個顯示器，則在主顯示器上開啟。測試在每個顯示器上的執行結果都相同。 |
| `--web-host <JS>` | 以 headless 方式開啟的應用程式所取得的網頁 host 模組（預設：`nsh.json` `web.host`；它匯出 `createHost(player)`）：它回應這些應用程式的 [`host`](../modules/nsh.md#host) 呼叫，而它的 `player.hostEvent` 會到達 `host.on`（[測試](./testing-and-trace.md#the-pages-host)）。僅限 headless 執行；`--target web` 會執行 `nsh.json` 的 `web.host`。 |
## nsh check

```sh
nsh check [ENTRY] [--tsc <TSC>] [-- <TSC ARGS>...]
```

對應用程式進行型別檢查。若應用程式有自己的 Rust crate（`nsh.json` `"rust"`），會先在各 crate 的目錄中以 `cargo check --all-targets` 檢查每個 crate，包含其測試；Cargo 回報錯誤時，指令會以非零代碼結束。Rust 應用程式（`"root"`）接著會針對其含有的 TypeScript 部分進行檢查：若有 `tsconfig.json`（即 `nsh init --template rust` 為 `App.test.tsx` 所寫入的那一個），其測試檔也會一併進行型別檢查。TypeScript 檢查會先更新 `.nsh/types` 與 `.nsh/tsconfig.json`，接著執行 `tsc -p <app directory> --noEmit`，並帶入應用程式的 `tsconfig.json`。它使用 TypeScript 7，也就是不需要 Node 的原生編譯器：首次執行時會從 npm registry 下載（約 9 MB），以 NSH 記錄的校驗碼驗證，並保存在 NSH 的快取中（macOS 為 `~/Library/Caches/nsh`，Linux 為 `~/.cache/nsh`，Windows 為 `%LOCALAPPDATA%\nsh`，或 `NSH_CACHE`）。型別錯誤會使指令以非零代碼結束。若 `tsconfig.json` 沒有繼承 `./.nsh/tsconfig.json`（NSH 存放其 TypeScript 設定之處），會發出警告（[專案結構](./project-structure.md#tsconfigjson-and-nshtypes)）。

| 旗標 | 說明 |
|---|---|
| `--tsc <TSC>` | 改為執行這個 `tsc`（也可用 `NSH_TSC`），例如來自 `node_modules` 的版本，或供無網路機器使用的副本。 |
| `-- <TSC ARGS>` | 傳遞給 `tsc`，例如 `nsh check -- --pretty false`。 |

NSH 產生的檔案都放在 `.nsh/` 之下：宣告檔、runner 原始碼，以及位於 `.nsh/out/` 的預設建置／封裝輸出。Cargo 維持其一般的 `target/` 快取與既有的 `CARGO_TARGET_DIR` 行為；NSH 不會加入任何 Cargo 設定來搬移它。`--out` 仍會覆寫輸出位置。

## nsh build

```sh
nsh build [ENTRY] [-o <OUT>] [--release] [--split]
```

建置應用程式。對於 Rust 應用程式（`nsh.json` `"root"`），會建置並描述應用程式的 crate，並寫出 `app.json` 以及它們隨附的檔案（`assets/`）：其 runner 會掛載該根目錄。對於 TSX 應用程式，則會打包應用程式並編譯為 QuickJS 位元組碼，供內嵌 NSH 並自行發行 bundle 的應用程式使用。

| 旗標 | 預設值 | 說明 |
|---|---|---|
| `-o, --out <OUT>` | `.nsh/out` | 輸出目錄。 |
| `--release` | | 壓縮並移除除錯資訊。 |
| `--split` | | 將 `import()` 載入的內容放進各自獨立的 chunk 檔案，於首次匯入時才下載（網頁應用程式，請參閱[拆分 bundle](./web.md#split-bundles)）。未使用時，bundle 會包含整個應用程式。 |

它會寫出：

| 檔案 | 內容 |
|---|---|
| `bundle.js` | JavaScript 形式的 bundle |
| `bundle.js.map` | 其 source map（堆疊追蹤會對應回你的原始碼） |
| `bundle.nshc` | 編譯為位元組碼的 bundle：應用程式實際載入的檔案 |
| `<Chunk>.js`、`<Chunk>.js.map`、`<Chunk>.nshc` | 使用 `--split` 時：各個 chunk、其 source map 與其位元組碼（`import("./Screen")` 為 `Screen.js`） |
| `capabilities.json` | `nsh.json` 的 `capabilities`（若有宣告；否則會移除） |
| `assets/` | 每個被匯入的圖片與字型，位於相對於應用程式根目錄的路徑 |

## nsh package

```sh
nsh package [ENTRY] --target ios|ios-simulator|android|macos|linux|windows|web [-o <OUT>] [flags]
```

以 release 模式建置可安裝的應用程式。Rust 應用程式（`nsh.json` `"root"`）會與其專屬的 runner 一起封裝，該 runner 由 Cargo 以你的 crate 與 NSH 的 crate 建置，掛載其根目錄且不含 QuickJS（[以 Rust 建置](./rust.md)）；TSX 應用程式則搭配預先建置的 runtime。過程不涉及 Xcode 專案或 Gradle 建置：NSH 自行組裝應用程式 bundle，並使用 Xcode 的 `actool` 與 `codesign`（iOS）或 SDK 的 `aapt2`、`zipalign` 與 `apksigner`（Android）；在 macOS 上，以 `codesign`（圖示則用 `sips`）組裝以 ad hoc 簽署的 `.app`；在 Linux 上，複製 runner 並以 `tar` 寫出 `.tar.gz`；在 Windows 上，複製 runner、嵌入圖示並寫出 `.zip`，不需任何工具；在網頁上，寫出靜態網站，不需任何工具。中繼資料來自 `nsh.json`，可由旗標覆寫。

| 旗標 | 說明 |
|---|---|
| `--target <TARGET>` | 必填。`ios`：iOS 裝置，已簽署的 `.ipa`（未使用 `--sign` 時為未簽署的 `.app`）。`ios-simulator`：以 ad hoc 簽署的 `.app`。`android`：已簽署的 `.apk`。`macos`：以 ad hoc 簽署的 `.app`（[macOS](./macos.md#packaging)）。`linux`：目錄 `<Name>/`（可執行檔、`nsh/`、一個 `.desktop` 檔案）以及 `<Name>.tar.gz`（[Linux](./linux.md#packaging)）。`windows`：目錄 `<Name>\`（`<Name>.exe`、`nsh\`）以及 `<Name>.zip`（[Windows](./windows.md#packaging)）。`web`：目錄 `<Name>/`，一個靜態網站（`index.html` 與以內容命名的檔案）（[Web](./web.md#publish-an-app)）。 |
| `-o, --out <OUT>` | 輸出目錄（預設為 `.nsh/out`）。 |
| `--name <NAME>` | 顯示名稱。 |
| `--id <ID>` | Bundle 識別碼，例如 `com.example.app`。 |
| `--app-version <VERSION>` | 版本，例如 `1.2.0`。 |
| `--build <BUILD>` | 建置編號。 |
| `--icon <ICON>` | 應用程式圖示：正方形 PNG，建議為 1024×1024。 |
| `--sign <IDENTITY>` | iOS 裝置：程式碼簽署身分，例如 `"Apple Development: …"`。 |
| `--profile <FILE>` | iOS 裝置：佈建描述檔（`.mobileprovision`）。Entitlements 來自該檔案。 |
| `--keystore <FILE>` | Android：release keystore。預設：位於 `~/.android/debug.keystore` 的除錯金鑰（若不存在則建立）。 |
| `--key-alias <ALIAS>` | Android：keystore 中的金鑰別名。 |
| `--keystore-password <PASSWORD>` | Android：keystore 密碼。也會從 `NSH_KEYSTORE_PASSWORD` 讀取。 |
| `--abi <ABI>` | Android：APK 的 ABI（`arm64-v8a`、`armeabi-v7a`、`x86_64`），可重複指定或以逗號分隔。預設：`arm64-v8a` 與 `armeabi-v7a`，使用 `--run` 時再加上裝置的 ABI。 |
| `--run` | 之後安裝並啟動應用程式：在模擬器（`ios-simulator`）中或在已連接的 Android 裝置上；`macos`、`linux` 與 `windows` 會啟動它；`web` 會在本機提供該網站，並印出其位址。 |

```sh
nsh package my-app --target ios-simulator --run
nsh package my-app --target ios --sign "Apple Development: Jane Doe (ABCDE12345)" --profile dev.mobileprovision
nsh package my-app --target android --keystore release.jks --key-alias upload
nsh package my-app --target macos
nsh package my-app --target linux
nsh package my-app --target windows
nsh package my-app --target web
```

請參閱[封裝](./packaging.md)。

## Signing commands

這些指令用於製作與檢查已簽署的套件（`.nshpkg`）：內嵌 NSH 的應用程式會先下載並驗證這些應用程式 bundle，才會執行。[已簽署的套件](./signed-packages.md)說明了其模型（離線的根金鑰為某些應用程式 id 認證 release 金鑰）。

### nsh keygen

```sh
nsh keygen <NAME>
```

建立 Ed25519 金鑰對：`<NAME>.secret` 與 `<NAME>.pub`（例如 `nsh keygen keys/root`）。請將根金鑰的 `.secret` 保存在離線環境；應用程式信任其 `.pub`。

### nsh certify

```sh
nsh certify --root <ROOT.secret> --key <KEY.pub> --apps <PATTERN>... [--days <DAYS>] -o <OUT>
```

以根金鑰為 release 金鑰認證特定的應用程式 id 與時間範圍；套件會附帶該憑證。

| 旗標 | 說明 |
|---|---|
| `--root <ROOT>` | 根金鑰的私密金鑰。 |
| `--key <KEY>` | release 金鑰的公開金鑰。 |
| `--apps <APPS>` | 可簽署的應用程式 id：`*`、`com.example.*` 或某個 id。可重複指定。 |
| `--days <DAYS>` | 從現在起可簽署多久（預設 365）。 |
| `-o, --out <OUT>` | 要寫出的憑證。 |

### nsh publish

```sh
nsh publish [ENTRY] --key <KEY.secret> --cert <CERT> [-o <OUT>] [--id <ID>] [--app-version <V>] [--build <N>]
            [--source-map package|file|none] [--strip-debug] [--min-runtime <VERSION>]
```

以 release 模式建置應用程式並簽署為套件。中繼資料來自 `nsh.json`，可由旗標覆寫。

若給定的是一個套件（`ENTRY` 為 `.nshpkg` 檔案），則會以此金鑰重新簽署該套件，就像平台以自己的一把金鑰簽署其應用程式的套件那樣。套件的檔案與標頭維持不變；其憑證、簽署時間與簽章會換成新金鑰的（[已簽署的套件](./signed-packages.md#sign-a-package-again)）。`-o` 可以指定所讀取的套件，且只有 `--key`、`--cert` 與 `-o` 適用。

| 旗標 | 說明 |
|---|---|
| `--key <KEY>` | release 金鑰的私密金鑰。 |
| `--cert <CERT>` | 其憑證（`nsh certify`）。 |
| `-o, --out <OUT>` | 要寫出的套件。預設：`.nsh/out/<id>-<build>.nshpkg`。 |
| `--id <ID>` | 應用程式 id。 |
| `--app-version <VERSION>` | 版本。 |
| `--build <BUILD>` | 建置編號：每次發行都必須遞增。 |
| `--source-map <WHERE>` | source map 的存放位置：`package`（預設）、`file`（`<package>.map` 放在套件旁）或 `none`（[已簽署的套件](./signed-packages.md#errors-from-published-packages)）。 |
| `--strip-debug` | 從位元組碼中省略行與欄對照表：體積較小，但錯誤堆疊沒有位置資訊。 |
| `--min-runtime <VERSION>` | 可執行該套件的最低 runtime，例如 `0.2.0`；較舊的 runtime 會拒絕載入。預設：此 CLI 的版本（[已簽署的套件](./signed-packages.md#which-runtimes-run-a-package)）。 |

### nsh verify

```sh
nsh verify <PACKAGE> [--root <ROOT.pub>]... [--revocations <LIST>]
```

以信任指定根金鑰的應用程式的方式驗證套件。未使用 `--root` 時，只會檢查套件本身的簽章。它會印出套件的 SHA-256，供 `nsh revoke --package` 使用。

### nsh symbolicate

```sh
nsh symbolicate <MAP> [INPUT]
```

將套件所回報錯誤中的 bundle 位置（`bundle.js:LINE:COL`）改寫為對應到你的原始碼，並印出結果。`MAP` 是 source map（來自 `nsh publish --source-map file` 的 `<package>.map`、`bundle.js.map`）或包含 source map 的套件；`INPUT` 是錯誤文字（預設：標準輸入）。

### nsh revoke

```sh
nsh revoke --root <ROOT.secret> [--extend <LIST>] [--sequence <N>] [--key <ID>]... [--package <SHA256>]... -o <OUT>
```

簽署撤銷清單：列出不得再被載入的 release 金鑰與套件。

| 旗標 | 說明 |
|---|---|
| `--root <ROOT>` | 根金鑰的私密金鑰。 |
| `--extend <EXTEND>` | 保留此清單（最後一次發布的清單）中的項目。 |
| `--sequence <N>` | 清單的編號，必須高於先前發布過的任何編號。使用 `--extend` 時的預設值：該清單的編號加一。 |
| `--key <ID>` | 要撤銷的 release 金鑰 id。可重複指定。 |
| `--package <SHA256>` | 要撤銷的套件 SHA-256。可重複指定。 |
| `-o, --out <OUT>` | 要寫出的清單。 |

## Environment variables

| 變數 | 使用者 | 說明 |
|---|---|---|
| `ANDROID_HOME`、`ANDROID_SDK_ROOT` | Android 目標 | Android SDK。後備值：`~/Library/Android/sdk`。 |
| `CARGO_TARGET_DIR` | 含 Rust crate 的應用程式 | 應用程式 runner 的建置位置。預設：應用程式的 `target/`。 |
| `NSH_KEYSTORE_PASSWORD` | `package --target android` | keystore 密碼。 |
| `NSH_RUNTIME` | `run`、`package` | 改用的 runtime 目錄，取代 CLI 旁的那一個。 |
| `NSH_VERBOSE` | 所有指令 | `1`：等同於 `--verbose`。 |
| `NSH_WASM_BINDGEN` | `run`、`package`（`--target web`） | 供 crate [呼叫瀏覽器 API](./web.md#browser-apis-from-rust) 的應用程式使用的 `wasm-bindgen` CLI。預設：位於 `PATH` 上的那一個。 |
| `NO_COLOR` | 所有指令 | 設定後：終端機不使用顏色。 |
