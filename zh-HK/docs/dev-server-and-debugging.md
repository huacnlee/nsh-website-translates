---
title: "開發伺服器與除錯"
description: "使用 nsh run 和 nsh dev 執行 Rust 與 TSX 應用程式,連接模擬器、仿真器及實體裝置,並運用重新建置、熱模組替換(hot module replacement)、日誌、錯誤覆蓋層及附帶 source map 的堆疊追蹤。"
order: 60
group: tools
source_hash: bce9f1fee0870b27
---


# 開發伺服器與除錯

在開發期間，NSH 會在每次儲存時建置你的應用程式。Rust 應用程式（`nsh.json` 指定其 `"root"`）會建置成專屬的 runner，由 `nsh run` 啟動；其 crate 一有變更，就會重新建置並重新啟動應用程式。TSX 應用程式則會推送到所有已連線的宿主，宿主會就地更新。以下兩個指令負責這些工作：

- `nsh run` 會建置應用程式**並**啟動它：Mac Catalyst 或 AppKit 視窗、Linux 上的 GTK 視窗、Windows 上的 Win32 視窗、iOS 模擬器、Android 裝置或模擬器，或瀏覽器頁面。對於 TSX，它還會啟動開發伺服器，供開發宿主連線。
- `nsh dev --server-only` 為 TSX 啟動開發伺服器，適用於由你自行啟動的宿主：搭載開發 SDK 的自家應用程式、網絡上的裝置，或同時多個宿主。

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

`nsh dev` 預設也會開啟原生宿主；行動宿主則使用 `--target ios` 或 `--target android`。

## `nsh run`

| 旗標 | 說明 |
|---|---|
| `--target <catalyst \| ios \| android \| macos \| linux \| windows \| gpui \| web>` | 執行位置。預設在 macOS（AppKit）上為 `macos`，在 Linux 上為 `linux`，在 Windows 上為 `windows`。Rust 應用程式可在所有目標上執行，但 `gpui` 除外，後者會將其根元件嵌入 GPUI 應用程式（[GPUI](./gpui.md)）。 |
| `--device <name or UDID>` | 要使用的 iOS 模擬器。預設：已啟動的模擬器，否則使用最新的 iPhone（會替你啟動）。 |
| `--port <port>` | 開發伺服器的連接埠。預設為 8790；如已被佔用，則使用下一個可用的連接埠。 |
| `--release` | 提供 TSX 的正式版本建置（已壓縮、無除錯資訊、無熱更新）。 |
| `--trace` | 記錄宿主上每次提交（commit）的時間（TSX 應用程式）。 |

各目標的行為：

- **`catalyst`**（macOS）以 Mac 應用程式形式執行開發宿主。停止 `nsh run`（Ctrl-C 或 `kill`）會關閉宿主，而關閉視窗則會結束 `nsh run`。
- **`macos`**（macOS）以相同方式執行 AppKit 開發宿主，這是一個 1200×800 視窗的桌面應用程式；按 Cmd+R 可重新載入最新的建置。需要 macOS 14 或更新版本（[macOS](./macos.md)）。
- **`linux`**（Linux）以相同方式在 390×844 視窗中執行 GTK 開發宿主：停止 `nsh run` 會將其關閉，關閉視窗則會結束 `nsh run`。需要 GTK 4.14 或更新版本（[Linux](./linux.md)）。
- **`windows`**（Windows）以相同方式在 1200×800 視窗中執行 Win32 開發宿主；即使主控台已關閉，宿主存活的時間也不會超過 `nsh run`。需要 Windows 10 1809 或更新版本（[Windows](./windows.md)）。
- **`ios`** 會將開發宿主安裝到模擬器，以指向開發伺服器的方式啟動它，並持續監視變更。模擬器與 Mac 共用網絡，因此宿主可透過 `127.0.0.1` 連上伺服器。停止 `nsh run`（Ctrl-C）會關閉宿主，否則它會加入下一個工作階段。需要 Xcode。
- **`android`** 會安裝開發宿主 APK（僅在 runtime 有變更時才再次安裝），執行 `adb reverse tcp:<port> tcp:<port>`，讓裝置本身的 `127.0.0.1` 可連上伺服器，然後啟動它。適用於模擬器或 USB 裝置。需要 Android SDK（`ANDROID_HOME`）。當 `nsh run` 結束時（包括按 Ctrl-C），它會停止宿主並移除該連接埠轉發，使宿主不會加入下一個工作階段。

當 `nsh run` 結束時，無論以何種方式結束，它都會停止自己啟動的宿主：結束 Catalyst 應用程式、關閉 macOS、Linux 或 Windows 宿主、終止模擬器中的開發宿主，或在裝置上強制停止它。

對於 Rust 應用程式，每個目標都會執行該應用程式自己的 runner，並與其 crate 一同建置：桌面平台就地建置除錯版本，輸出顯示在終端機中；iOS 和 Android 則建置成套件並安裝。對於 TSX，宿主是通用的：它們可執行伺服器傳送的任何 NSH 應用程式，因此無需為每個應用程式個別建置（擁有自己 crate 的應用程式，會取得與該 crate 一同建置的宿主）。

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
| `--port <port>` | 開發伺服器的連接埠。預設為 8790（如已被佔用，則使用下一個可用的連接埠）。 |
| `--release` | 提供正式版本建置。 |

將宿主連線到所列印的 URL：

- **你自己的 iOS 應用程式**，已連結 `NativeShellDev.xcframework`：`try app.connectDevServer(URL(string: "ws://192.168.1.20:8790/ws")!)`。請參閱[嵌入 iOS 應用程式](./ios.md#development)。
- **你自己的 Android 應用程式**，使用 `nsh-dev.aar`：`nsh.connectDevServer("ws://192.168.1.20:8790/ws")`，或 `adb reverse tcp:8790 tcp:8790` 與 `ws://127.0.0.1:8790/ws`。請參閱[嵌入 Android 應用程式](./android.md#development)。

可同時連線任意數量的宿主；每次建置都會傳送給所有宿主。稍後才連線的宿主會立即收到目前的建置。如果宿主無法執行該應用程式，原因是缺少應用程式所匯入的 UI 組合（例如為另一個應用程式建置的開發宿主），它將不會收到建置：宿主會顯示原因，而終端機會列印一行 `warn`，附上安裝該應用程式宿主的指令。

> [!NOTE]
> 區域網絡上的裝置需要能夠透過開發伺服器的連接埠連上你的電腦：處於同一網絡，且中間沒有防火牆。資產（圖片、字型）會透過同一連接埠以純 HTTP 提供。

<a id="rust-edits"></a>

## Rust 編輯

Rust 是經編譯的語言：應用程式的 crate，或其透過路徑依賴的 crate 一有變更，就會重新建置應用程式，而 `nsh run` 會以新程式碼重新啟動它。應用程式的狀態會重新開始；需要在重新啟動後保留的內容，請存放在[儲存空間](../modules/nsh.md#storage)。建置錯誤會列印在終端機中，下一次能成功編譯的儲存會再次執行。在同時包含 Rust 和 TSX 的應用程式中，TSX 的編輯仍為熱更新（見下文），而 Rust 的編輯則會重新啟動應用程式。

<a id="hot-module-replacement"></a>

## 熱模組替換

TSX 開發建置會為每個原始碼檔案保留一個模組。當你儲存時，NSH 會重新建置，將模組與上一次成功的建置比較，並只傳送包含已變更模組的**修補**（patch）。宿主會就地套用修補，耗時遠低於一毫秒；從儲存檔案到看到變更，大約需要 120 毫秒。

你的應用程式會出現以下情況：

- **只有你編輯過的元件會重新渲染。** 每個頂層元件（傳回 JSX 的大寫開頭函式）都會被包裝在一個穩定的代理（proxy）中。當它的程式碼變更（或其模組中其他它可能用到的程式碼變更）時，它的實例會以新程式碼重新渲染；程式碼未變更的元件則保留其實例，以及其中的 signal 和狀態。編輯按鈕的樣式後，畫面會維持原狀，輸入的文字和捲動位置都不變。
- **已變更的模組會重新執行**，而匯入已變更模組、且無法自行接受更新的模組也會重新執行，直至入口為止。因此模組層級的程式碼會重新執行，但保有狀態的部分除外：
- **頂層 signal 和導覽堆疊會保留其狀態**：在模組頂層由 `signal(…)` 或 `createNavStack(…)` 建立的 `const`，只要其初始化式不變，其值（堆疊則為其頁面）就會在編輯後保留；若要重新開始，請更改初始化式（`signal(0)` 改為 `signal(10)`）。
- **頂層 `context()` 物件會保留其身分**，並採用新的預設值，因此不同模組中的 provider 和 consumer 仍然相互對應。
- **編輯入口時應用程式會保持掛載。** 以相同元件再次執行 `mount(App)`（或 `mount(() => <App />)`）時，會保留已掛載的內容：只有你編輯過的元件會重新渲染。若編輯 `App` 本身，它會連同其所渲染的內容重新渲染（這些內容自己的狀態會重新開始），但在模組頂層建立的導覽器會保留其路由，因此已推入的畫面仍然保持推入狀態。如果 `mount` 的呼叫有變更（換了另一個元件或 props），則會重新掛載應用程式。
- **拋出錯誤的元件**會回報錯誤並不渲染任何內容，直至你修正為止；應用程式的其餘部分繼續執行。下一次成功的儲存即可恢復。

在以下情況，宿主會**重新載入整個應用程式**而非套用修補：

- 該變更匯入了執行中的應用程式尚未匯入的 NSH 模組（例如第一次使用 `import … from "nsh"`）；
- 應用程式在 `nsh.json` 中的 `capabilities` 有變更；
- 宿主執行的並非該修補所基於的建置（它剛剛連線，或先前的載入失敗）；
- 修補無法套用。

> [!TIP]
> 元件保存在自己 signal 中的狀態，會在該元件或渲染它的元件被編輯時重設。需要在編輯後保留的狀態，請放在頂層 signal（或 store 模組）中，並在模組頂層建立導覽器。

`--release` 提供正式版本建置，不含熱更新：每次儲存都會重新載入應用程式。可用它來檢查已壓縮的建置。從開發伺服器載入的任何內容，無論是否使用 `--release`，都會略過 runtime 的強化防護（`eval` 仍可使用）；請參閱[沙盒與權限](./sandbox-and-capabilities.md#hardening)。

<a id="logs"></a>

## 日誌

Rust 應用程式使用 `log` crate 記錄日誌（`log::info!`、`log::warn!`、`log::error!`）：在桌面平台和 iOS 模擬器上，`nsh run` 會在其終端機中連同應用程式的輸出一併顯示這些日誌行。

在 TSX 中，`console.log`、`console.info`、`console.debug`、`console.warn` 和 `console.error` 會寫入原生日誌，目標為 `js`。宿主連線期間，其日誌行會轉發到執行 `nsh run` / `nsh dev` 的終端機：你的 `console.log` 行會原樣顯示（連線多部裝置時會加上裝置名稱作為前綴），警告和錯誤則顯示在裝置名稱之後：

```text
• iPhone 16 Pro connected, build 1
loading more after 1000
warn iPhone 16 Pro: deprecated option
error iPhone 16 Pro: uncaught exception: TypeError: cannot read property 'id' of undefined
          at Row (demos/Photos.tsx:18:22)
```

`console.log` 會像瀏覽器主控台一樣格式化數值：字串原樣輸出，錯誤連同其堆疊，函式顯示名稱，物件和陣列以 JSON 顯示。宿主未連線時，日誌會寫入平台的日誌（iOS 上為 Xcode 的主控台 / unified log，Android 上為 `adb logcat`）。

當導致 Promise 被拒絕（reject）的工作完成後（其 microtask 已執行），仍沒有處理程式的被拒絕 Promise，同樣會像瀏覽器般記錄為錯誤：例如無人 await 而拋出錯誤的 `async` 函式、無人捕捉的 `Promise.reject(…)`，或是沒有任何東西在等待、卻失敗的 Rust 呼叫。該行會輸出到 `console.error` 所指向的位置（終端機、平台日誌，在網頁上則是瀏覽器主控台），其堆疊指向你的原始碼：

```text
error iPhone 16 Pro: unhandled rejection: Error: HTTP 404
          at loadProfile (App.tsx:12:11)
```

在同一輪（turn）稍後才附加的處理程式（`const p = load(); …; p.catch(…)`）算作已處理。若失敗情況值得關注，請 await 該 Promise，或為它加上 `.catch`。

終端機的其餘輸出為每個步驟一行（`✓` 表示完成、`→` 表示連線位置、`•` 表示裝置的操作）；NSH 所執行工具（cargo、宿主本身）的輸出，只會在其失敗時才列印。`nsh run -v`（或 `NSH_VERBOSE=1`）會列印所有內容：每一行日誌連同其級別和來源、cargo 的輸出，以及各宿主自身的輸出。

`--trace` 會加上每次提交的耗時：

```text
perf commit: 10 ops, 151µs (list js 2µs), 8 mount items, 27 nodes
```

這些數字的含義，請參閱[測試](./testing-and-trace.md)。

<a id="the-error-overlay"></a>

## 錯誤覆蓋層

以下錯誤會在宿主的應用程式上方顯示紅色覆蓋層，內含訊息和堆疊：

- 建置失敗（語法錯誤、未知元素、缺少匯入），並附有指向該行的程式碼框；
- 評估 bundle 時發生的錯誤；
- 事件處理程式、計時器或 effect 中未捕捉的例外。

點按覆蓋層即可關閉。它也會在下一次成功重新載入時消失。建置失敗同樣會列印在終端機中：

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

打包工具會移除 TypeScript 型別但不會檢查型別；請執行 [`nsh check`](./cli.md#nsh-check)（TypeScript 的原生編譯器，搭配 `tsconfig.json` 寫出的 `nsh init`；無需 Node），或依靠編輯器來找出型別錯誤。

在正式版本建置中（使用正式版 SDK 的嵌入式應用程式、已打包的應用程式），錯誤會被記錄並傳遞給宿主應用程式的錯誤處理程式（`NshAppView.onError`、`NshView.setErrorListener`），但不會顯示在應用程式上方。

<a id="source-maps-and-stack-traces"></a>

## Source map 與堆疊追蹤

打包時會產生一份 source map，涵蓋每個步驟（TypeScript → JSX → bundle），並隨每次建置一併傳送。在列印或顯示堆疊追蹤之前，runtime 會將 bundle 中的位置改寫為你的原始碼位置，因此堆疊指向 `App.tsx:2:28`，而非 bundle：

```text
error Mac Catalyst: uncaught exception: Error: tap boom
          at <anonymous> (App.tsx:2:58)
```

`nsh build` 會將該 map 寫成 `bundle.js.map`；從資料夾載入 bundle 的嵌入式應用程式，會從 bundle 旁邊讀取它，而[已簽署的套件](./signed-packages.md)也會附帶它，除非它被存放在套件旁邊，並以 `nsh symbolicate` 套用（[已發佈套件的錯誤](./signed-packages.md#errors-from-published-packages)）。

<a id="debugging-tips"></a>

## 除錯提示

- **編輯後沒有任何更新**：檢查終端機是否有建置錯誤；覆蓋層也會在宿主上顯示該錯誤。
- **應用程式保留了你預期會重設的舊狀態**：熱替換會刻意保留未變更元件的狀態、頂層 signal 和導覽器。請按 Ctrl-C 並重新執行 `nsh run`，或更改該狀態的初始化式。
- **請求只在已打包或嵌入式建置中失敗**：檢查應用程式的[權限](./sandbox-and-capabilities.md)；被拒絕的操作會連同需要加入的鍵一併記錄。
- **某處運作緩慢**：使用 [`nsh test --trace`](./testing-and-trace.md) 以無介面方式重現，它會列印每個原生視圖操作；或使用 `--trace` 執行 TSX 應用程式。
- **編輯器中的型別錯誤**：`nsh run` 和 `nsh dev` 會讓 `.nsh/types` 保持最新；請參閱[專案結構](./project-structure.md)。

<a id="see-also"></a>

## 另請參閱

- [CLI](./cli.md)
- [測試](./testing-and-trace.md)
- [嵌入 iOS 應用程式](./ios.md)、[嵌入 Android 應用程式](./android.md)
