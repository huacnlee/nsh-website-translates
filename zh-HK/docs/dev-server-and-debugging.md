---
title: "開發伺服器與除錯"
description: "使用 nsh run 與 nsh dev 執行 Rust 和 TSX 應用程式,連接模擬器、仿真器與裝置,並運用重新建置、熱模組替換(HMR)、日誌、錯誤覆蓋層以及支援 source map 的堆疊追蹤。"
order: 60
group: tools
---

# 開發伺服器與除錯

開發期間，NSH 會在每次儲存時重新建置你的應用程式。Rust 應用程式（`nsh.json` 為其 `"root"` 命名）會建置成自己的 runner，由 `nsh run` 啟動；變更其 crate 時會再次建置並重新啟動應用程式。TSX 應用程式會推送到每個已連線的 host，並就地更新。有兩個指令可以做到這件事：

- `nsh run` 會建置應用程式**並**啟動它：Mac Catalyst 或 AppKit 視窗、Linux 上的 GTK 視窗、Windows 上的 Win32 視窗、iOS 模擬器、Android 裝置或模擬器，或瀏覽器頁面。對於 TSX，它還會啟動開發伺服器，供開發 host 連線。
- `nsh dev --server-only` 會為 TSX 啟動開發伺服器，供你自行啟動的 host 使用：你搭配開發版 SDK 的自有應用程式、網路上的裝置，或同時多個 host。

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

`nsh dev` 預設也會開啟原生 host；行動 host 則使用 `--target ios` 或 `--target android`。

## `nsh run`

| 旗標 | 說明 |
|---|---|
| `--target <catalyst \| ios \| android \| macos \| linux \| windows \| gpui \| web>` | 執行位置。預設在 macOS（AppKit）為 `macos`，Linux 為 `linux`，Windows 為 `windows`。Rust 應用程式可在所有目標上執行，唯獨 `gpui` 例外，它會將根元件嵌入 GPUI 應用程式（[GPUI](./gpui.md)）。 |
| `--device <name or UDID>` | 要使用的 iOS 模擬器。預設：已啟動的模擬器，否則為最新的 iPhone（會自動為你啟動）。 |
| `--port <port>` | 開發伺服器連接埠。預設為 8790；若已被占用，則使用下一個可用的連接埠。 |
| `--release` | 提供 TSX 的 release 建置（已壓縮、無除錯資訊、無熱更新）。 |
| `--trace` | 記錄 host 上每次 commit 的時間（TSX 應用程式）。 |

各目標的行為：

- **`catalyst`**（macOS）以 Mac 應用程式的形式執行開發 host。停止 `nsh run`（Ctrl-C 或 `kill`）會關閉它，關閉視窗則會結束 `nsh run`。
- **`macos`**（macOS）以相同方式執行 AppKit 開發 host，這是一個 1200×800 視窗的桌面應用程式；Cmd+R 會重新載入最新的建置。需要 macOS 14 或更新版本（[macOS](./macos.md)）。
- **`linux`**（Linux）以相同方式在 390×844 的視窗中執行 GTK 開發 host：停止 `nsh run` 會將其關閉，關閉視窗則會結束 `nsh run`。需要 GTK 4.14 或更新版本（[Linux](./linux.md)）。
- **`windows`**（Windows）以相同方式在 1200×800 的視窗中執行 Win32 開發 host；即使主控台被關閉，host 也不會比 `nsh run` 存活更久。需要 Windows 10 1809 或更新版本（[Windows](./windows.md)）。
- **`ios`** 會在模擬器中安裝開發 host，啟動時指向開發伺服器並持續監看。模擬器與 Mac 共用網路，因此 host 可透過 `127.0.0.1` 連到伺服器。停止 `nsh run`（Ctrl-C）會關閉 host，否則它會加入下一次的工作階段。需要 Xcode。
- **`android`** 會安裝開發 host APK（僅在 runtime 變更時才重新安裝），執行 `adb reverse tcp:<port> tcp:<port>` 讓裝置自己的 `127.0.0.1` 能連到伺服器，然後啟動它。適用於模擬器或 USB 裝置。需要 Android SDK（`ANDROID_HOME`）。當 `nsh run` 結束時（包括按 Ctrl-C），它會停止 host 並移除該連接埠轉發，使 host 不會加入下一次的工作階段。

當 `nsh run` 結束時，無論以何種方式結束，它都會停止自己啟動的 host：結束 Catalyst 應用程式或關閉 macOS、Linux 或 Windows host、終止模擬器中的開發 host，或在裝置上強制停止它。

對於 Rust 應用程式，每個目標都會執行應用程式自己的 runner，並與其 crate 一同建置：桌面平台就地進行 debug 建置，輸出顯示在終端機中；iOS 與 Android 則安裝它的封裝。對於 TSX，host 是通用的：它們會執行伺服器傳來的任何 NSH 應用程式，因此不需要為每個應用程式個別建置（擁有自己 crate 的應用程式，則會取得與該 crate 一同建置的 host）。

## `nsh dev`

```sh
nsh dev App.tsx
```

```text
✓ built App.tsx (3.2 KB js, 9.8 KB bytecode, 21ms)
→ dev server ws://127.0.0.1:8790/ws
  devices on this network: ws://192.168.1.20:8790/ws
```

| 旗標 | 說明 |
|---|---|
| `--port <port>` | 開發伺服器連接埠。預設為 8790（若已被占用，則使用下一個可用的連接埠）。 |
| `--release` | 提供 release 建置。 |

將 host 連到顯示的 URL：

- **你自己的 iOS 應用程式**，連結 `NativeShellDev.xcframework`：`try app.connectDevServer(URL(string: "ws://192.168.1.20:8790/ws")!)`。請參閱[嵌入 iOS 應用程式](./ios.md#development)。
- **你自己的 Android 應用程式**，搭配 `nsh-dev.aar`：`nsh.connectDevServer("ws://192.168.1.20:8790/ws")`，或 `adb reverse tcp:8790 tcp:8790` 與 `ws://127.0.0.1:8790/ws`。請參閱[嵌入 Android 應用程式](./android.md#development)。

可同時連接任意數量的 host；每次建置都會傳送給所有 host。稍後才連線的 host 會立即收到目前的建置。如果 host 無法執行該應用程式，因為它缺少應用程式所匯入的 UI set（例如為另一個應用程式建置的開發 host），就不會收到建置：它會顯示原因，終端機也會印出一行 `warn`，其中包含安裝該應用程式 host 的指令。

> [!NOTE]
> 區域網路上的裝置必須能透過開發伺服器的連接埠連到你的電腦：位於同一個網路，且中間沒有防火牆。資源（圖片、字型）會透過同一個連接埠以純 HTTP 提供。

<a id="rust-edits"></a>

## 修改 Rust 程式碼

Rust 是編譯式語言：應用程式的 crate，或它以路徑相依的 crate 發生變更時，會再次建置應用程式，並由 `nsh run` 以新的程式碼重新啟動。應用程式的狀態會從頭開始；必須在重新啟動後保留的內容，請存放在[儲存空間](../modules/nsh.md#storage)中。建置錯誤會印在終端機中，下一次能成功編譯的儲存就會再次執行。在同時包含 Rust 與 TSX 的應用程式中，TSX 的修改仍是熱更新（見下文），而 Rust 的修改會重新啟動應用程式。

<a id="hot-module-replacement"></a>

## 熱模組替換

TSX 開發建置會為每個原始檔案保留一個模組。當你儲存時，NSH 會重新建置，將模組與上一次成功的建置比較，並只傳送有變更模組的**修補**。host 會就地套用，耗時遠低於一毫秒；從儲存檔案到看見變更，大約需要 120 毫秒。

你的應用程式會發生什麼事：

- **只有你編輯過的元件會重新渲染。** 每個頂層元件（回傳 JSX 的首字母大寫函式）都包裹在一個穩定的 proxy 中。當它的程式碼變更（或其模組中它可能使用的其餘程式碼變更）時，它的實例會以新的程式碼重新渲染；程式碼沒有變更的元件會保留其實例，以及其中的 signal 與狀態。編輯按鈕的樣式後，畫面會維持原狀，輸入的文字與捲動位置也都不變。
- **有變更的模組會重新執行**，匯入了有變更模組、且無法自行接受更新的模組也會重新執行，一路向上直到入口。因此模組層級的程式碼會重新執行，但保留狀態的部分除外：
- **頂層 signal 與導覽堆疊會保留其狀態**：在模組頂層由 `signal(…)` 或 `createNavStack(…)` 建立的 `const`，只要其自身的初始化式不變，就會在多次編輯之間保留其值（堆疊則保留其頁面）；變更初始化式（`signal(0)` 改為 `signal(10)`）即可從頭開始。
- **頂層 `context()` 物件會保留其身分識別**，並採用新的預設值，因此不同模組中的 provider 與 consumer 仍能相互對應。
- **編輯入口檔案時應用程式仍保持掛載。** 以相同元件再次執行 `mount(App)`（或 `mount(() => <App />)`）時，會保留它已掛載的內容：只有你編輯過的元件會重新渲染。編輯 `App` 本身時，它會連同其渲染的內容一起重新渲染（它們自己的狀態會從頭開始），但在模組頂層建立的 navigator 會保留其路由，因此已推入的畫面仍會維持在堆疊中。若 `mount` 呼叫有變更（不同的元件、props），則會重新掛載應用程式。
- **拋出錯誤的元件**會回報錯誤且不渲染任何內容，直到你修正為止；應用程式的其餘部分會繼續執行。下一次成功的儲存即可恢復。

在以下情況，host 會**重新載入整個應用程式**而不是套用修補：

- 變更匯入了執行中的應用程式尚未匯入的 NSH 模組（例如第一次使用 `import … from "nsh"`）；
- 應用程式在 `nsh.json` 中的 `capabilities` 有變更；
- host 執行的建置並非該修補所基於的建置（它剛連線，或前一次載入失敗）；
- 修補無法套用。

> [!TIP]
> 元件保存在自己 signal 中的狀態，會在該元件或渲染它的元件被編輯時重設。必須在編輯後保留的狀態，請放在頂層 signal（或 store 模組）中，並將 navigator 建立在模組頂層。

`--release` 會提供 release 建置，沒有熱更新：每次儲存都會重新載入應用程式。可用它來檢查壓縮後的建置。從開發伺服器載入的任何內容，無論是否使用 `--release`，都會略過 runtime 的強化防護（`eval` 仍可使用）；請參閱[沙箱與權限](./sandbox-and-capabilities.md#hardening)。

<a id="logs"></a>

## 日誌

Rust 應用程式使用 `log` crate（`log::info!`、`log::warn!`、`log::error!`）記錄日誌：`nsh run` 會在桌面平台與 iOS 模擬器上，於其終端機中連同應用程式的輸出一併顯示這些行。

在 TSX 中，`console.log`、`console.info`、`console.debug`、`console.warn` 與 `console.error` 會寫入原生日誌，目標為 `js`。host 連線期間，其日誌行會轉發到執行 `nsh run` / `nsh dev` 的終端機：你的 `console.log` 行會原樣顯示（連接多個裝置時，會加上裝置名稱作為前綴），警告與錯誤則顯示在裝置名稱之後：

```text
• iPhone 16 Pro connected, build 1
loading more after 1000
warn iPhone 16 Pro: deprecated option
error iPhone 16 Pro: uncaught exception: TypeError: cannot read property 'id' of undefined
          at Row (demos/Photos.tsx:18:22)
```

`console.log` 會像瀏覽器主控台一樣格式化值：字串照原樣、錯誤連同其堆疊、函式以名稱表示、物件與陣列以 JSON 表示。當 host 未連線時，日誌會寫入平台的日誌（iOS 上為 Xcode 的主控台 / unified log，Android 上為 `adb logcat`）。

一個被拒絕（rejected）的 promise，如果在導致拒絕的工作完成後（其 microtask 已執行）仍沒有處理器，也會像瀏覽器一樣被記錄為錯誤：拋出錯誤而無人 await 的 `async` 函式、無人捕捉的 `Promise.reject(…)`、呼叫 Rust 失敗而無人等待結果。這一行會輸出到 `console.error` 的輸出位置（終端機、平台的日誌，在 web 上則是瀏覽器主控台），其堆疊會指向你的原始碼：

```text
error iPhone 16 Pro: unhandled rejection: Error: HTTP 404
          at loadProfile (App.tsx:12:11)
```

在同一個 turn 稍後才附加的處理器（`const p = load(); …; p.catch(…)`）也算作已處理。在失敗需要被處理的地方，請 await 該 promise，或為它加上 `.catch`。

終端機的其餘輸出是每個步驟一行（`✓` 完成、`→` 連線位置、`•` 裝置的動作）；NSH 所執行工具（cargo、host 本身）的輸出，只有在失敗時才會印出。`nsh run -v`（或 `NSH_VERBOSE=1`）會印出所有內容：每一行日誌及其層級與來源、cargo 的輸出，以及 host 自己的輸出。

`--trace` 會加上每次 commit 的成本：

```text
perf commit: 10 ops, 151µs (list js 2µs), 8 mount items, 27 nodes
```

這些數字的意義，請參閱[測試](./testing-and-trace.md)。

<a id="the-error-overlay"></a>

## 錯誤覆蓋層

以下錯誤會在 host 的應用程式上方顯示紅色覆蓋層，內含訊息與堆疊：

- 建置失敗（語法錯誤、未知的元素、缺少的 import），並附有指向該行的程式碼框；
- 評估 bundle 時發生的錯誤；
- 事件處理器、計時器或 effect 中未捕捉的例外。

點擊覆蓋層即可關閉。它也會在下一次成功重新載入時消失。建置失敗同樣會印在終端機中：

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

打包工具只會移除 TypeScript 型別而不檢查它們；請執行 [`nsh check`](./cli.md#nsh-check)（TypeScript 的原生編譯器，搭配 `tsconfig.json` `nsh init` 寫入；不需要 Node），或依靠編輯器來檢查型別錯誤。

在 release 建置中（內嵌 release SDK 的應用程式、已封裝的應用程式），錯誤會被記錄並傳給 host 應用程式的錯誤處理器（`NshAppView.onError`、`NshView.setErrorListener`），但不會顯示在應用程式上方。

<a id="source-maps-and-stack-traces"></a>

## Source map 與堆疊追蹤

打包會產生一份串接每個步驟（TypeScript → JSX → bundle）的 source map，並隨每次建置一同傳送。在印出或顯示堆疊追蹤之前，runtime 會將 bundle 中的位置改寫為你的原始碼，因此堆疊會指向 `App.tsx:2:28`，而不是 bundle：

```text
error Mac Catalyst: uncaught exception: Error: tap boom
          at <anonymous> (App.tsx:2:58)
```

`nsh build` 會將 map 寫成 `bundle.js.map`；從資料夾載入 bundle 的內嵌應用程式會從 bundle 旁邊讀取它，而[已簽署的套件](./signed-packages.md)也會攜帶它，除非它被另外保存在套件旁並以 `nsh symbolicate` 套用（[已發布套件的錯誤](./signed-packages.md#errors-from-published-packages)）。

<a id="debugging-tips"></a>

## 除錯技巧

- **編輯後沒有任何更新**：檢查終端機是否有建置錯誤；覆蓋層也會在 host 上顯示它。
- **應用程式保留了你預期會重設的舊狀態**：熱替換會刻意保留未變更元件的狀態、頂層 signal 與 navigator。請以 Ctrl-C 重新啟動並執行 `nsh run`，或變更該狀態的初始化式。
- **請求只在已封裝或內嵌的建置中失敗**：檢查應用程式的[權限](./sandbox-and-capabilities.md)；被拒絕的請求會連同要新增的 key 一併記錄。
- **有東西很慢**：以 [`nsh test --trace`](./testing-and-trace.md) 在 headless 模式下重現，它會印出每個原生 view 操作，或以 `--trace` 執行 TSX 應用程式。
- **編輯器中的型別錯誤**：`nsh run` 與 `nsh dev` 會讓 `.nsh/types` 保持最新；請參閱[專案結構](./project-structure.md)。

<a id="see-also"></a>

## 另請參閱

- [CLI](./cli.md)
- [測試](./testing-and-trace.md)
- [嵌入 iOS 應用程式](./ios.md)、[嵌入 Android 應用程式](./android.md)
