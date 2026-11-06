---
title: "CLI"
description: "所有 NSH 子指令與旗標：init、build、test、check、dev、run、package，以及簽署相關指令 keygen、certify、publish、verify、symbolicate 和 revoke。"
order: 6
group: start
source_hash: 2fe1bbb5b3e5cfb9
---


# CLI

`nsh` 是用來建構 NSH 應用程式的工具,可使用 Rust 或 TSX。每個建構應用程式的子命令都接受 `[ENTRY]`:即應用程式的目錄(預設為目前目錄,因此 `cd my-app && nsh run` 可直接運作),它會執行 Rust 應用程式的根元件(`nsh.json` `"root"`)或 TSX 應用程式的 `App.tsx`,或 TSX 入口模組。它會讀取應用程式根目錄中的 `nsh.json`,並更新 `.nsh/types` 中的型別宣告。

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

`nsh <command> --help` 會列印命令的旗標;`nsh -V`(`--version`)會列印版本及建構所依據的 Git revision。

<a id="output"></a>

## 輸出

每個命令每個步驟只印出一行,只有在失敗時才印出詳細資料:

```text
✓ built the Rust crate gallery-native (5.0s)
✓ built App.tsx (500 B js, 809 B bytecode, 21ms)
✓ built the development host for the iOS simulator (12.7s)
• iOS Simulator (iPhone 16 Plus) connected, build 1
warn iOS Simulator: image failed: An SSL error has occurred and a secure connection to the server cannot be made.
✓ rebuilt App.tsx (18ms), 1 device
```

`✓` 是已完成的步驟,`→` 是連線位置,`•` 是裝置的動作;`warn` 和 `error` 行屬於問題,而普通行是應用程式自身的輸出(`console.log`)。在終端機上,旋轉指示器會顯示正在執行的步驟,各行會帶有顏色(除非設定了 `NO_COLOR`);若重新導向至檔案,只會寫入結果行,並且不帶顏色。
NSH 所執行工具(應用程式 Rust crate 的 cargo、開發 host)的輸出,會在其中一個失敗時,列印在 `error` 行之下。

`-v, --verbose`(適用於任何命令;亦包括 `NSH_VERBOSE=1`)會即時印出所有內容:每一行日誌連同其等級和來源、cargo 的輸出,以及 host 自身的輸出。

## nsh init

```sh
nsh init [DIR] [--name <NAME>] [--template <ts|rust|mixed>] [--nsh-source <DIR>]
```

在 `DIR`(預設為目前目錄,若不存在則會建立)中,根據範本建立應用程式。若沒有 `--template`,`nsh init` 在終端機上會詢問使用哪個範本(按 Enter 選取 `ts`),在其他情況(指令碼、CI)則採用 `ts`。

| 範本 | 建立內容 |
|---|---|
| `rust` | 以 Rust 編寫的應用程式:一個 Cargo 專案(`Cargo.toml`、含根元件的 `src/lib.rs`、供 `cargo run` 使用的 `src/main.rs`),含 `"rust": "."` 和 `"root": "App"` 的 `nsh.json`,根元件的測試 `App.test.tsx`(含 `tsconfig.json` 和 `.nsh/types`)、`.gitignore` 及一份 README,README 亦說明日後如何加入 TSX 入口。`nsh run` 和 `nsh package` 在每個目標上都不使用 QuickJS 來掛載根元件(`nsh test` 會開啟它以進行 TypeScript 測試),包括瀏覽器([以 Rust 建構](./rust.md));`cargo run` 則直接在 macOS、Windows 或 Linux 上啟動。 |
| `ts` | TSX 應用程式:`App.tsx`、其測試 `App.test.tsx`(`nsh test`)、`nsh.json`、`tsconfig.json`、`.gitignore` 及 `.nsh/types`。已存在的檔案會保留;只有全部檔案都已存在時才會失敗。 |
| `mixed` | 根目錄帶有自身 Rust crate 的 TSX 應用程式:`App.tsx`、其測試 `App.test.tsx`、`tsconfig.json`、含 `"rust": "."` 的 `nsh.json`、`.gitignore`、`.nsh/types`、一份 README,以及位於 `App.tsx`(`Cargo.toml`、`src/lib.rs`)旁的 crate,其 `#[native_module("<name>/native")]` 匯出 `App.tsx` 所使用的一個元件、一個模組和一個類別。若沒有 `"root"`,則 `App.tsx` 為入口。 |

| 旗標 | 說明 |
|---|---|
| `--name <NAME>` | 寫入 `nsh.json` 的顯示名稱。預設:目錄名稱。id 會變成 `com.example.<name>`(只含字母和數字,小寫),而 crate 的匯入識別字 `<name>/native`(小寫,詞語以 `-` 連接)。 |
| `--template <TEMPLATE>` | `rust`、`ts` 或 `mixed`(見上)。`rust` 和 `mixed` 需要 Rust;`cargo run` 另需原生桌面後端的開發程式庫。 |
| `--nsh-source <DIR>` | 與 `rust` 或 `mixed` 併用:crate 會以路徑依賴 `DIR` 中 checkout 的 NSH crate,使應用程式針對 NSH 的原始碼建構。 |

`rust` 和 `mixed` 的 crate 依賴 crates.io 上與 CLI 版本相同的 NSH crate(使用 `--nsh-source` 時,則依賴某個 checkout 的 crate),而 `nsh` 命令會用相同的 crate 建構應用程式的 runner 和 host。在對此類應用程式執行每個命令之前,`nsh` 會建構一個由應用程式 crate 與 NSH core 組成的小程式,用來描述它們的元件、模組和類別,並在 crate 有變更時執行;CLI 憑這份描述自行打包、編譯、型別檢查、提供服務及封裝應用程式。Rust 應用程式的建構只會編譯其 crate 及 NSH core。請在新的應用程式目錄中建立它們:若其中任何檔案已存在,會在寫入任何內容之前報告為衝突。

透過 Git 依賴 NSH 的 Rust crate 的應用程式,會使用 Cargo 在應用程式 lockfile 中解析出來的 checkout。產生的 host 共用該 checkout,包括被應用程式的 Cargo patch 重新導向的 NSH 依賴項目。

## nsh run

```sh
nsh run [ENTRY] [--target catalyst|ios|android|macos|linux|windows|gpui|web] [--device <DEVICE>] [--port <PORT>] [--release] [--limits [<LIMITS>]] [--trace] [--fps] [--name <NAME>] [--window-size <WIDTHxHEIGHT>] [--display <N>]
```

```sh
nsh run my-app                     # a Rust app's root, or a TSX app's App.tsx, on this machine's backend
nsh run my-app --target ios        # in the iOS simulator
nsh run my-app/App.tsx --target web
```

對於 TSX 入口,`nsh run` 會啟動開發伺服器(如同 `nsh dev`),啟動從中載入應用程式的開發 host,並在每次儲存時重新建構。Hot module replacement 會就地修補正在執行的應用程式;應用程式的日誌和錯誤會列印在終端機中。可按 Ctrl-C 停止(或關閉 Catalyst、macOS、Linux、Windows 或 GPUI 視窗)。無論以何種方式結束(Ctrl-C、`kill` / `pkill`、錯誤),它都會停止自己啟動的 host:Catalyst 應用程式、macOS、Linux、Windows 或 GPUI host、模擬器中的開發 host,或 Android 裝置上的開發 host。

Rust 應用程式(`nsh.json` `"root"`,[以 Rust 建構](./rust.md))不需要開發伺服器,也不使用 QuickJS:`nsh run` 會為目標建構掛載了根元件的應用程式 runner 並啟動它(在桌面平台上為 debug 建構,日誌顯示在終端機;在模擬器和 Android 上則安裝該應用程式),當 crate 的 Rust 程式碼有變更時,會重新建構並重新啟動。使用 `--target web` 時,它會列印頁面位址,而已開啟的頁面會自動載入新的 runtime。若要改為執行 TSX 入口,請指定它(`nsh run App.tsx`)。

| 旗標 | 預設值 | 說明 |
|---|---|---|
| `--target <TARGET>` | macOS 上為 `macos`,Linux 上為 `linux`,Windows 上為 `windows` | `catalyst`:Mac Catalyst host,iPhone 大小的視窗(390×844)。`ios`:iOS 模擬器中的 host。`android`:Android 裝置或模擬器上的 host。`macos`:AppKit host,1200×800 視窗([macOS](./macos.md))。`linux`:GTK host,390×844 視窗([Linux](./linux.md))。`windows`:Win32 host,1200×800 視窗([Windows](./windows.md))。`gpui`:GPUI host,1200×800 視窗,可在 macOS、Windows 或 Linux 上執行,以嵌入 TSX 應用程式的 GPUI 應用程式顯示它的方式來顯示([GPUI](./gpui.md))。`web`:開發伺服器的頁面,位於其列印的位址([Web](./web.md#develop-in-the-browser))。 |
| `--device <DEVICE>` | | 要使用的 iOS 模擬器,以名稱(`"iPhone 16 Pro"`)或 UDID 指定。預設:已啟動的模擬器,否則為最新的 iPhone,並會將其啟動。 |
| `--port <PORT>` | `8790` | 開發伺服器埠號。在清理完成後,取代此埠號上先前的 NSH 開發工作階段。 |
| `--release` | | 壓縮並移除除錯資訊。Release bundle 沒有 hot module replacement:每次儲存都會重新載入應用程式。 |
| `--limits [<LIMITS>]` | | 將應用程式作為嵌入另一個應用程式的應用程式執行,並受其 host 應用程式所設的限制:`memory` 和 `stack`(在 `KB`、`MB` 或 `GB` 中)、`load` 和 `call`(在 `ms` 或 `s` 中)以及 `nodes`,例如 `--limits memory=128MB,call=500ms`。省略的項目沿用嵌入預設值,即單獨使用 `--limits` 時所採用的預設值([沙盒與能力](./sandbox-and-capabilities.md#limits))。不使用時,應用程式如封裝後的應用程式般獨立執行。適用於 TSX 入口。 |
| `--trace` | | host 會將每次 commit 的時間(JS、版面配置、mount items)記錄到終端機。 |
| `--fps` | | 效能監視器:影格率、影格和 commit 的成本、CPU、GPU 及記憶體,在 macOS 上顯示於應用程式之上([macOS](./macos.md#performance-monitor)),並在 macOS、Linux、Windows 和 iOS 上每秒記錄一次。 |
| `--name <NAME>` | `nsh.json` 名稱 | 選單列中的應用程式顯示名稱及初始視窗標題(`--target macos`,TSX 入口)。 |
| `--window-size <WIDTHxHEIGHT>` | Host 預設值 | 初始視窗大小(以點為單位),例如 `800x600`(`--target macos`、`linux`、`windows` 和 `gpui`,TSX 入口)。 |
| `--display <N>` | 主顯示器 | 視窗置中開啟的顯示器:`1` 是主顯示器(有選單列的那個),`2` 是下一個,如此類推;若數字沒有對應的顯示器,則在主顯示器開啟(`--target macos`,TSX 入口)。 |

使用 `--target android` 時,會採用 `adb devices` 列出的第一個裝置;開發伺服器的埠號會以 `adb reverse` 轉發到該裝置。請參閱[入門指南](./getting-started.md#run-it)及[開發伺服器與除錯](./dev-server-and-debugging.md)。

取代操作最多會等待十秒,讓先前的工作階段完成清理。若埠號被其他程式或較舊的 NSH CLI 佔用,會產生指出該埠號的錯誤。請使用不同的 `--port` 值來同時執行多個應用程式;`--port 0` 會要求作業系統提供空閒的埠號。

## nsh dev

```sh
nsh dev [ENTRY] [--target catalyst|ios|android|macos|linux|windows|gpui|web] [--device <DEVICE>] [--server-only] [--port <PORT>] [--release] [--limits [<LIMITS>]]
```

啟動開發伺服器,並開啟本系統的原生 host:macOS 上為 AppKit,Linux 上為 GTK,Windows 上為 Win32。進行行動開發時,請明確選擇 `--target ios` 或 `--target android`。`--server-only` 為你自行啟動的 host 提供服務。伺服器會建構應用程式、監看入口所在的目錄,並將每次重新建構推送給已連線的 host。使用 `--server-only` 時,它會列印供本機 host 使用的 URL、每個區域網絡位址各一個供裝置使用的 URL,以及(當 web runtime 存在時)瀏覽器開啟以執行應用程式的頁面([Web](./web.md#develop-in-the-browser)):

```text
✓ built App.tsx (3.2 KB js, 9.8 KB bytecode, 21ms)
→ dev server ws://127.0.0.1:8790/ws
  browsers: http://127.0.0.1:8790/
  devices on this network: ws://192.168.1.20:8790/ws
  browsers on this network: http://192.168.1.20:8790/
```

搭配嵌入開發 SDK 的應用程式使用 `nsh dev --server-only`(`NativeShellDev.xcframework`、`nsh-dev.aar`)。`--target`、`--device`、`--port`、`--release` 和 `--limits` 的作用與 `nsh run` 相同;`--server-only` 會選擇不啟動 host 的伺服器。

## nsh test

```sh
nsh test [PATH] [--filter <NAME>] [--trace] [--fps] [--junit <FILE>] [--target <TARGET>] [--browser <PATH>] [--web-host <JS>] [--display <N>]
```

以無頭模式執行應用程式的測試([測試](./testing-and-trace.md)):執行 `PATH`(一個目錄,預設為目前目錄;隱藏目錄、`node_modules` 和 `target` 會被略過)中的測試檔案(`*.test.tsx`、`*.test.ts`,匯入 `nsh/test`),或單一測試檔案 `PATH`。若指定的是帶有自身 Rust crate 的應用程式目錄(`nsh.json` `"rust"`:Rust 應用程式,或帶 crate 的 TSX 應用程式),它會先對目錄中的每個 crate 在該 crate 自己的目錄中執行 `cargo test`,並將每個 Rust 測試與 TypeScript 測試一併顯示和計算,歸入其測試目標的檔案之下(`src/lib.rs › tests::adds`);只有 Rust 測試的 Rust 應用程式也以此方式測試。每個測試檔案在各自的引擎上執行,而其測試開啟的每個應用程式則在另一個全新的引擎上執行。它每個測試印出一行,失敗時會印出拋出的內容、在測試檔案中的位置及螢幕上的文字;任何失敗都會令它以非零代碼結束。若指定應用程式的入口(`nsh test App.tsx`;Rust 應用程式的入口:`nsh test nsh.json`),它會透過網絡開啟應用程式,讓它運行 1.2 秒,並執行標準輸入給出的步驟(`await app.press("Add")`,其中 `app` 為該應用程式)。TSX 應用程式在 CLI 自己的行程中執行;帶有自身 Rust crate 的應用程式則在以這些 crate 建構的無頭 runner 中執行,CLI 會為其建構入口。除非測試以 Android 開啟應用程式(`open` 的 `platform`),否則無頭執行時的行為等同 iOS:`platform.os` 為 `"ios"`,並套用 `ios:` 類別和 `ios={{…}}` props。

```text
✓ App.test.tsx › counts taps (321ms)
✓ 1 test: 1 passed, 0 failed (343ms)
```

| 旗標 | 說明 |
|---|---|
| `--filter <NAME>` | 只執行名稱(在其所屬的 `describe` 區塊名稱之後)包含 `NAME` 的測試;對於 crate,則為 `cargo test <NAME>`。 |
| `--trace` | 列印測試所開啟應用程式的每個 mount batch(列於其所屬步驟(`── press(Add): 7 items`)之下),以及每次 commit 的時間:首個影格、一個步驟或一個捲動影格的成本。使用 `--target` 時,則為 host 的 batch 和時間。 |
| `--fps` | 與 `--target linux`、`macos`、`windows` 或 `ios` 併用:host 每秒記錄一次其效能監視器的讀數(影格率、影格階段、commit、CPU、記憶體),以 `-v` 顯示。 |
| `--junit <FILE>` | 同時將結果以 JUnit XML 報告寫入 `FILE`,這是 CI 服務用來顯示測試結果的格式:每個測試檔案一個 `testsuite`,每個測試一個 `testcase`。 |
| `--target <TARGET>` | 在此平台的開發 host 上執行測試所開啟的應用程式,而非無頭模式(`macos`、`linux`、`windows`、`gpui`、`web`、`ios` 和 `android`;`web` 會在無頭 Chrome、Edge 或 Chromium 中執行):各步驟使用該平台自身的輸入([測試](./testing-and-trace.md#on-a-real-platform)),而 `open` 會對照平台檢查其選項,拒絕無法支援的選項(`ERR_NSH_TEST_UNSUPPORTED`:iOS 和 Android 上的 `width` 和 `height`,其他裝置類型的 `platform`)。crate 的 Rust 測試在本機執行,於不帶 `--target` 的執行中進行。 |
| `--browser <PATH>` | `--target web` 用來執行應用程式的 Chrome、Edge 或 Chromium 可執行檔(預設:本機已安裝的那個)。 |
| `--display <N>` | 與 `--target macos` 併用:應用程式視窗置中開啟的顯示器:`1` 是主顯示器(有選單列的那個),`2` 是下一個,如此類推;若數字沒有對應的顯示器,則在主顯示器開啟。預設會在次要顯示器(主顯示器以外的第一個,且不是其鏡像)開啟,使測試執行時獨佔一個螢幕;若只有一個顯示器則在主顯示器開啟。測試在每個顯示器上的執行結果相同。 |
| `--web-host <JS>` | 無頭開啟的應用程式所取得的網頁 host 模組(預設:`nsh.json` `web.host`;它匯出 `createHost(player)`):它回應其 [`host`](../modules/nsh.md#host) 呼叫,而其 `player.hostEvent` 可存取 `host.on`([測試](./testing-and-trace.md#the-pages-host))。只適用於無頭執行;`--target web` 會執行 `nsh.json` 的 `web.host`。 |
## nsh check

```sh
nsh check [ENTRY] [--tsc <TSC>] [-- <TSC ARGS>...]
```

對應用程式進行類型檢查。若應用程式有自己的 Rust crate（`nsh.json` `"rust"`），會先在各 crate 的目錄中以 `cargo check --all-targets` 逐一檢查，包括其測試；Cargo 報錯時，命令會以非零代碼結束。Rust 應用程式（`"root"`）隨後只會檢查其包含的 TypeScript 部分：若有 `tsconfig.json`（即 `nsh init --template rust` 為 `App.test.tsx` 所寫的那個），其測試檔案也會一併進行類型檢查。TypeScript 檢查會先更新 `.nsh/types` 和 `.nsh/tsconfig.json`，然後以應用程式的 `tsconfig.json` 執行 `tsc -p <app directory> --noEmit`。它使用 TypeScript 7（原生編譯器），無需 Node：首次執行時會從 npm registry 下載（約 9 MB），對照 NSH 所記錄的校驗和進行驗證，並保存在 NSH 的快取中（macOS 為 `~/Library/Caches/nsh`，Linux 為 `~/.cache/nsh`，Windows 為 `%LOCALAPPDATA%\nsh`，或 `NSH_CACHE`）。出現類型錯誤時，命令會以非零代碼結束。若 `tsconfig.json` 沒有 extend `./.nsh/tsconfig.json`（NSH 的 TypeScript 設定存放於此），命令會發出警告（[專案結構](./project-structure.md#tsconfigjson-and-nshtypes)）。

| 選項 | 說明 |
|---|---|
| `--tsc <TSC>` | 改用此 `tsc`（亦可用 `NSH_TSC`），例如來自 `node_modules` 的版本，或供沒有網絡的機器使用的副本。 |
| `-- <TSC ARGS>` | 傳遞給 `tsc`，例如 `nsh check -- --pretty false`。 |

NSH 生成的檔案都保存在 `.nsh/` 之下：包括宣告檔、runner 原始碼，以及位於 `.nsh/out/` 的預設建置／打包輸出。Cargo 仍使用其一般的 `target/` 快取和現有的 `CARGO_TARGET_DIR` 行為；NSH 不會加入任何 Cargo 設定來搬移它。`--out` 仍然會覆寫輸出位置。

## nsh build

```sh
nsh build [ENTRY] [-o <OUT>] [--release] [--split]
```

建置應用程式。對於 Rust 應用程式（`nsh.json` `"root"`），它會建置並描述應用程式的 crate，並寫出 `app.json` 以及它們附帶的檔案（`assets/`）：其 runner 會掛載該根目錄。對於 TSX 應用程式，它會將應用程式打包並編譯為 QuickJS bytecode，供內嵌 NSH 並自行發佈 bundle 的應用程式使用。

| 選項 | 預設值 | 說明 |
|---|---|---|
| `-o, --out <OUT>` | `.nsh/out` | 輸出目錄。 |
| `--release` | | 壓縮並移除除錯資訊。 |
| `--split` | | 將 `import()` 載入的內容放入各自獨立的 chunk 檔案，在首次匯入時才下載（適用於網頁應用程式，見[分割 bundle](./web.md#split-bundles)）。不使用此選項時，bundle 會包含整個應用程式。 |

它會寫出：

| 檔案 | 內容 |
|---|---|
| `bundle.js` | JavaScript 格式的 bundle |
| `bundle.js.map` | 其 source map（堆疊追蹤會對應回你的原始碼） |
| `bundle.nshc` | 編譯為 bytecode 的 bundle：應用程式實際載入的內容 |
| `<Chunk>.js`、`<Chunk>.js.map`、`<Chunk>.nshc` | 使用 `--split` 時：每個 chunk、其 source map 及其 bytecode（`import("./Screen")` 對應 `Screen.js`） |
| `capabilities.json` | `nsh.json` 的 `capabilities`（如有宣告；否則會被移除） |
| `assets/` | 每個匯入的圖片和字型，位於相對於應用程式根目錄的路徑 |

## nsh package

```sh
nsh package [ENTRY] --target ios|ios-simulator|android|macos|linux|windows|web [-o <OUT>] [flags]
```

以 release 模式建置可安裝的應用程式。Rust 應用程式（`nsh.json` `"root"`）會連同其專屬 runner 一起打包，該 runner 由 Cargo 根據你的 crate 和 NSH 的 crate 建置，其根目錄已掛載且不含 QuickJS（[以 Rust 建置](./rust.md)）；TSX 應用程式則使用預先建置的 runtime。過程不涉及 Xcode 專案或 Gradle 建置：NSH 會自行組裝應用程式 bundle，並使用 Xcode 的 `actool` 和 `codesign`（iOS）或 SDK 的 `aapt2`、`zipalign` 和 `apksigner`（Android）；macOS 會以 `codesign` 組裝經 ad hoc 簽署的 `.app`（圖示則使用 `sips`）；Linux 會複製 runner，並以 `tar` 寫出 `.tar.gz`；Windows 會複製 runner、嵌入圖示並寫出 `.zip`，無需任何工具；網頁則會寫出靜態網站，同樣無需任何工具。中繼資料取自 `nsh.json`，可由各選項覆寫。

| 選項 | 說明 |
|---|---|
| `--target <TARGET>` | 必填。`ios`：iOS 裝置，已簽署的 `.ipa`（未使用 `--sign` 時為未簽署的 `.app`）。`ios-simulator`：經 ad hoc 簽署的 `.app`。`android`：已簽署的 `.apk`。`macos`：經 ad hoc 簽署的 `.app`（[macOS](./macos.md#packaging)）。`linux`：目錄 `<Name>/`（可執行檔、`nsh/`、`.desktop` 檔案）以及 `<Name>.tar.gz`（[Linux](./linux.md#packaging)）。`windows`：目錄 `<Name>\`（`<Name>.exe`、`nsh\`）以及 `<Name>.zip`（[Windows](./windows.md#packaging)）。`web`：目錄 `<Name>/`，即靜態網站（`index.html` 以及按內容命名的檔案）（[Web](./web.md#publish-an-app)）。 |
| `-o, --out <OUT>` | 輸出目錄（預設為 `.nsh/out`）。 |
| `--name <NAME>` | 顯示名稱。 |
| `--id <ID>` | Bundle 識別碼，例如 `com.example.app`。 |
| `--app-version <VERSION>` | 版本，例如 `1.2.0`。 |
| `--build <BUILD>` | 建置編號。 |
| `--icon <ICON>` | 應用程式圖示：正方形 PNG，最好為 1024×1024。 |
| `--sign <IDENTITY>` | iOS 裝置：程式碼簽署身分，例如 `"Apple Development: …"`。 |
| `--profile <FILE>` | iOS 裝置：provisioning profile（`.mobileprovision`）。Entitlements 取自該檔案。 |
| `--keystore <FILE>` | Android：release keystore。預設：位於 `~/.android/debug.keystore` 的 debug 金鑰（如不存在會建立）。 |
| `--key-alias <ALIAS>` | Android：keystore 中的金鑰別名。 |
| `--keystore-password <PASSWORD>` | Android：keystore 密碼。亦會從 `NSH_KEYSTORE_PASSWORD` 讀取。 |
| `--abi <ABI>` | Android：APK 的 ABI（`arm64-v8a`、`armeabi-v7a`、`x86_64`），可重複指定或以逗號分隔。預設：`arm64-v8a` 和 `armeabi-v7a`，使用 `--run` 時另加裝置的 ABI。 |
| `--run` | 之後安裝並啟動應用程式：在模擬器（`ios-simulator`）或已連接的 Android 裝置上進行；`macos`、`linux` 和 `windows` 會啟動應用程式；`web` 會在本機提供該網站，位址會顯示在輸出中。 |

```sh
nsh package my-app --target ios-simulator --run
nsh package my-app --target ios --sign "Apple Development: Jane Doe (ABCDE12345)" --profile dev.mobileprovision
nsh package my-app --target android --keystore release.jks --key-alias upload
nsh package my-app --target macos
nsh package my-app --target linux
nsh package my-app --target windows
nsh package my-app --target web
```

參見[打包](./packaging.md)。

## Signing commands

這些命令用於製作和檢查已簽署的套件（`.nshpkg`）：即內嵌 NSH 的應用程式在執行前會下載並驗證的應用程式 bundle。[已簽署的套件](./signed-packages.md)說明了其模型（離線的 root 金鑰為某些應用程式 id 認證 release 金鑰）。

### nsh keygen

```sh
nsh keygen <NAME>
```

建立 Ed25519 金鑰對：`<NAME>.secret` 和 `<NAME>.pub`（例如 `nsh keygen keys/root`）。root 的 `.secret` 應離線保管；應用程式信任其 `.pub`。

### nsh certify

```sh
nsh certify --root <ROOT.secret> --key <KEY.pub> --apps <PATTERN>... [--days <DAYS>] -o <OUT>
```

以 root 金鑰為 release 金鑰認證，指定適用的應用程式 id 和時間範圍；套件會附帶該證書。

| 選項 | 說明 |
|---|---|
| `--root <ROOT>` | root 的私密金鑰。 |
| `--key <KEY>` | release 金鑰的公開金鑰。 |
| `--apps <APPS>` | 可簽署的應用程式 id：`*`、`com.example.*` 或某個 id。可重複指定。 |
| `--days <DAYS>` | 從現在起可簽署多久（預設為 365）。 |
| `-o, --out <OUT>` | 要寫出的證書。 |

### nsh publish

```sh
nsh publish [ENTRY] --key <KEY.secret> --cert <CERT> [-o <OUT>] [--id <ID>] [--app-version <V>] [--build <N>]
            [--source-map package|file|none] [--strip-debug] [--min-runtime <VERSION>]
```

以 release 模式建置應用程式，並將其簽署為套件。中繼資料取自 `nsh.json`，可由各選項覆寫。

若給定的是套件（`ENTRY` 為 `.nshpkg` 檔案），則會以此金鑰重新簽署該套件，就像平台以自己的一把金鑰簽署其應用程式的套件一樣。套件的檔案和標頭維持不變；其證書、簽署時間和簽章會換成新金鑰的（[已簽署的套件](./signed-packages.md#sign-a-package-again)）。`-o` 可指定要讀取的套件，而且只有 `--key`、`--cert` 和 `-o` 適用。

| 選項 | 說明 |
|---|---|
| `--key <KEY>` | release 金鑰的私密金鑰。 |
| `--cert <CERT>` | 其證書（`nsh certify`）。 |
| `-o, --out <OUT>` | 要寫出的套件。預設：`.nsh/out/<id>-<build>.nshpkg`。 |
| `--id <ID>` | 應用程式 id。 |
| `--app-version <VERSION>` | 版本。 |
| `--build <BUILD>` | 建置編號：每次發佈都必須遞增。 |
| `--source-map <WHERE>` | source map 的存放位置：`package`（預設）、`file`（`<package>.map` 放在套件旁）或 `none`（[已簽署的套件](./signed-packages.md#errors-from-published-packages)）。 |
| `--strip-debug` | 不在 bytecode 中包含行號和列號表：體積較小，但錯誤堆疊不會有位置資訊。 |
| `--min-runtime <VERSION>` | 可執行該套件的最低 runtime 版本，例如 `0.2.0`；較舊的 runtime 會拒絕載入。預設：此 CLI 的版本（[已簽署的套件](./signed-packages.md#which-runtimes-run-a-package)）。 |

### nsh verify

```sh
nsh verify <PACKAGE> [--root <ROOT.pub>]... [--revocations <LIST>]
```

以信任指定 root 的應用程式的方式驗證套件。若沒有 `--root`，則只會檢查套件本身的簽章。它會輸出套件的 SHA-256，可供 `nsh revoke --package` 使用。

### nsh symbolicate

```sh
nsh symbolicate <MAP> [INPUT]
```

將套件所回報錯誤中的 bundle 位置（`bundle.js:LINE:COL`）改寫為你的原始碼位置，並輸出結果。`MAP` 是 source map（來自 `nsh publish --source-map file`、`bundle.js.map` 的 `<package>.map`）或包含 source map 的套件；`INPUT` 是錯誤文字（預設：標準輸入）。

### nsh revoke

```sh
nsh revoke --root <ROOT.secret> [--extend <LIST>] [--sequence <N>] [--key <ID>]... [--package <SHA256>]... -o <OUT>
```

簽署撤銷清單：列出不得再載入的 release 金鑰和套件。

| 選項 | 說明 |
|---|---|
| `--root <ROOT>` | root 的私密金鑰。 |
| `--extend <EXTEND>` | 保留此清單（最近一次發佈的清單）中的條目。 |
| `--sequence <N>` | 清單編號，必須大於之前發佈的任何編號。使用 `--extend` 時的預設值：該清單的編號加一。 |
| `--key <ID>` | 要撤銷的 release 金鑰 id。可重複指定。 |
| `--package <SHA256>` | 要撤銷的套件 SHA-256。可重複指定。 |
| `-o, --out <OUT>` | 要寫出的清單。 |

## Environment variables

| 變數 | 使用者 | 說明 |
|---|---|---|
| `ANDROID_HOME`、`ANDROID_SDK_ROOT` | Android 目標 | Android SDK。後備：`~/Library/Android/sdk`。 |
| `CARGO_TARGET_DIR` | 含 Rust crate 的應用程式 | 應用程式 runner 的建置位置。預設：應用程式的 `target/`。 |
| `NSH_KEYSTORE_PASSWORD` | `package --target android` | keystore 密碼。 |
| `NSH_RUNTIME` | `run`、`package` | 用來取代 CLI 旁邊那個的 runtime 目錄。 |
| `NSH_VERBOSE` | 所有命令 | `1`：等同 `--verbose`。 |
| `NSH_WASM_BINDGEN` | `run`、`package`（`--target web`） | 供其 crate [呼叫瀏覽器 API](./web.md#browser-apis-from-rust) 的應用程式使用的 `wasm-bindgen` CLI。預設：`PATH` 上的那個。 |
| `NO_COLOR` | 所有命令 | 設定後：終端機不使用顏色。 |
