---
title: "架構"
description: "說明 NSH 應用程式的執行方式:建置流程、引擎執行緒與主執行緒、從 signal 變更到原生檢視的路徑、原生響應式圖、文字排版,以及各個 crate。"
order: 63
group: tools
---

# 架構

本頁寫給想了解從 `count.set(1)` 到畫面上標籤改變之間究竟發生了什麼事的 App 開發者,適用於以 Rust 或 TSX 撰寫的 App。
撰寫 App 並不需要讀這一頁,但它能解釋 NSH 為何如此運作:為什麼元件只會執行一次、為什麼 JS 忙碌時動畫仍然流暢、為什麼主執行緒從不等待你的程式碼。

<a id="the-big-picture"></a>

## 全貌

<div class="diagram-scroll">
<img class="diagram diagram-light" src="/diagrams/architecture-light.svg" alt="How an nsh app runs: the nsh CLI builds App.tsx into bytecode; on the engine thread, QuickJS runs a handler, the reactive graph in nsh-js queues ops, and nsh-core commits one MountBatch; it crosses to the main thread in one hop, which applies it to UIKit or Android views; touches go back as events. Native animations run on the main thread without JavaScript.">
<img class="diagram diagram-dark" src="/diagrams/architecture-dark.svg" alt="How an nsh app runs: the nsh CLI builds App.tsx into bytecode; on the engine thread, QuickJS runs a handler, the reactive graph in nsh-js queues ops, and nsh-core commits one MountBatch; it crosses to the main thread in one hop, which applies it to UIKit or Android views; touches go back as events. Native animations run on the main thread without JavaScript.">
</div>

<a id="building-only-your-code-becomes-js"></a>

## 建置:只有你的程式碼會變成 JS

`nsh build`、`nsh dev` 以及其他指令會使用以 Rust 撰寫的工具鏈(不需要 Node.js)來打包你的 App:

1. **Oxc** 移除 TypeScript 型別。
2. **NSH 的 JSX 編譯器** 在同一個階段中,把 JSX 轉成對原生 renderer 的直接呼叫。靜態的 props 與子節點只會設定一次;可能變動的運算式(呼叫函式或讀取屬性)則會變成 renderer 所追蹤的 binding。元件會變成一般的函式呼叫,並傳入 props 物件,其中會變動的 props 是 getter。
3. **rolldown** 把你的模組打包成單一 ES module。對 NSH 模組(`nsh`、`nsh/mobile`、`nsh/base` 等)的 import 會保留為 import:這些模組是原生的,由 runtime 提供。**bundle 只包含你 App 的程式碼**;計數器範例的 JS 不到 1 KB。
4. bundle 會被編譯成 **bytecode**(`bundle.nshc`),載入速度比原始碼更快,並且會在所有步驟之間合成一份 **source map**,讓堆疊追蹤指向你的 `.tsx` 行。

你匯入的圖片與字型會被收集成資產,供編輯器使用的型別宣告則會寫入 `.nsh/types`。

以 Rust 撰寫的 App 沒有 bundle:Cargo 會為每個目標建置 runner,並連結你的 crate,而 `nsh.json` 所指定的根元件會在引擎上以原生方式執行。以下所述的一切同樣適用於它,只不過你的元件程式碼在 TSX App 中是跑在 QuickJS,在這裡則是以 Rust 執行。

<a id="running-two-threads-per-app"></a>

## 執行:每個 App 兩個執行緒

每個執行中的 App(iOS 上的 `NshAppView`、Android 上的 `NshView`、打包後 App 的視窗)都是一個**引擎**,擁有自己的**引擎執行緒**;若是 TSX,還有自己專屬的 QuickJS VM。沒有任何全域單例,因此多個 App 可以在同一個宿主 App 中並行執行。

<a id="the-engine-thread"></a>

### 引擎執行緒

與你 App 邏輯有關的一切都在這裡進行:

- **你的程式碼**在此執行:元件、事件處理器、計時器、effect。Rust 元件以原生方式執行;TSX 則在 **QuickJS** 中執行。
- **響應式圖**(signal、computed 值、effect、owner、context)是原生的。它的節點是原生類別的 QuickJS 物件,因此垃圾回收器能透過它們看見參照;但追蹤依賴與排程更新都是由 Rust 完成(遵循 Solid 1.9 的演算法)。
- 你編譯後的 JSX 所呼叫的 **renderer** 是原生的。它會建立節點,並把每一次變更轉成一個 **op**,直接推入原生佇列:沒有 JSON,也不會針對每個 prop 傳送訊息。
- **core** 維護所有節點的 shadow tree。當一個 JS turn 結束時,它會一次取出所有已排入佇列的 op 並進行 **commit**:渲染 Rust 元件(`nsh/base` 的元件與 App 自己的元件)、解析 padding 與 margin 中的 `env()` inset、重建有變更的文字、以 **Taffy** 進行版面配置(flexbox 與 grid,預設為直向排列且不收縮)、比對 frame 與樣式的差異,並產生一個 **MountBatch**:原生 view 所需的操作清單。

<a id="the-main-thread"></a>

### 主執行緒

平台的主(UI)執行緒會以一次切換套用每個 MountBatch:建立 view、插入它們、設定樣式與 frame、交出已完成版面配置的文字。除此之外,它只做必須在主執行緒上進行的事:

- **繪製文字**,而這些文字已在引擎執行緒上完成版面配置;
- **原生動畫**:來自 `nsh` 的動畫值會逐 frame 驅動(iOS 上是 `CADisplayLink`,Android 上是 UI 執行緒的 animator),並直接寫入 view;
- **手勢與捲動**:觸控會轉成事件送往引擎執行緒;`scrollValue` 與 `pan` 會在同一個 frame 內餵入動畫值。

**主執行緒從不等待 JS。** 當系統需要即時的答覆時(這段文字可以變更嗎、返回按鈕可以彈出這個畫面嗎、這個 sheet 可以關閉嗎),答案早已事先以 prop 的形式掛載,而 JS 會在事後透過事件得知結果。引擎執行緒忙碌可能會延遲更新,但不會讓捲動、動畫或系統手勢卡住。

<a id="from-a-tap-to-the-screen"></a>

## 從點擊到畫面

```text
 main thread               engine thread                                              main thread
 ───────────               ─────────────────────────────────────────────────────      ───────────
 tap on a view ─ event ─▶  handler runs: count.set(count() + 1)
                           reactive graph: the bindings that read count() run again
                           renderer: one op per changed binding → native queue
                           JS turn ends → core commit: render, text, layout, diff
                           → MountBatch (e.g. 1 Text item)                 ─ hop ─▶   apply: draw the new text
```

在計數器範例中,於 Mac 上的 release 建置裡,一次點擊(JS 與 commit 合計)約花費 0.12 ms,並產生少量的 mount item(參見[測試](./testing-and-trace.md))。

在 Rust App 中,處理器是一個 Rust closure(`count.set(count.get() + 1)`),後續同樣是相同的圖、commit 與 batch,途中沒有任何直譯器。

這個設計帶來三項特性:

- **一個 turn 就是一次 commit。** 無論處理器設定了多少個 signal,view 都只會一起變更一次。
- **元件只會執行一次。** 只有 binding 會重新執行;不會重新渲染元件,也沒有 virtual DOM 比對。剩下的比對工作由 core 負責,針對 frame 與樣式,並以 Rust 完成。
- **只有變更會被傳送。** 未改變的樣式與 frame 不會被送出;新的 view 不會被指派預設值。

<a id="text-laid-out-once-off-the-main-thread"></a>

## 文字:只配置一次,且不在主執行緒

文字通常是 UI 中成本最高的部分。NSH 在引擎執行緒上使用平台自己的文字引擎進行配置,因此外觀與原生文字完全一致:

1. **prepare**:一個 `<Text>` 及其巢狀的 span 會變成一個 attributed string(Apple 平台上使用 CoreText,Android 上使用 `PrecomputedText` / `StaticLayout`);
2. 以版面配置所要求的寬度進行 **measure**;量測結果會依內容與寬度快取,因此僅變更顏色時不會重新量測;
3. 以最終尺寸進行 **layout**。

主執行緒接收不可變的結果並只負責繪製。巢狀在 `<Text>` 中的文字是 span,而不是 view;位於 `<Text>` 之外的字串不會渲染任何內容。

<a id="lists"></a>

## 列表

`List` 以原生方式進行虛擬化。core 會決定哪些列靠近可視區域、計算位置、欄數與 sticky header,並回收 cell。當某個 cell 需要顯示不同的項目時,runtime 會為它重新綁定(你的 row 函式的 `item()` 與 `index()` 存取器會改變);沒有顯露新列的 frame 完全不會呼叫 JS。參見[列表](./lists.md)。

<a id="everything-else-the-runtime-does"></a>

## runtime 的其他工作

- **網路**:`fetch` 與其他全域 API 都是原生類別。請求會交給平台的 HTTP 堆疊(`NSURLSession`、`HttpURLConnection`),並支援雙向串流。
- **圖片**會在主執行緒之外下載與解碼,尺寸依 view 而定,並有記憶體快取。
- **限制與權限**由 runtime 以 Rust 強制執行:參見[沙盒與權限](./sandbox-and-capabilities.md)。
- **Hot module replacement** 同樣是原生的:patch 由 runtime 套用,耗時遠低於一毫秒(參見[開發伺服器與除錯](./dev-server-and-debugging.md))。

<a id="three-layers"></a>

## 三個層級

NSH 的 UI 分成三個層級建構,與 GPUI Kit 相同:

| 層級 | NSH | GPUI Kit | 說明 |
|---|---|---|---|
| Primitives | `nsh-core` 與 runtime(`nsh`、`nsh/mobile`、`nsh/desktop`) | `gpui` | 宿主元素、樣式、版面配置、渲染、響應式、環境 |
| 基礎元件 | `nsh-base`(`nsh/base`) | `gpui-base` | 無樣式的元件,負責行為、狀態、焦點、鍵盤與無障礙,外觀則由 App 決定 |
| 元件庫 | 你 App 自己的,或社群提供的 | `gpui-component` | 有樣式的元件:按鈕、卡片、具有外觀的列 |

前兩個層級屬於 Native Shell。第三個層級由你負責:App 可以在 `nsh/base` 與 primitives 之上建構自己的元件庫(以 TSX,或以[自己的 crate](./rust.md) 中的 Rust 元件),使用社群發布的元件庫,或直接在 App 中為 UI 設定樣式。

<a id="the-crates"></a>

## Crates

NSH 是一個 Rust workspace。撰寫 App 時你不需要自行建置它(發行版已附帶 CLI 與預先建置的 runtime),但這些名稱會出現在日誌與文件中:

| Crate | 說明 |
|---|---|
| `nsh-core` | 與平台無關的 core:shadow tree、樣式、Taffy 版面配置、文字合併、列表虛擬化、mount item;CSS 值與 Tailwind;原生動畫圖(數值、插值、timing / spring / decay);Rust 元件的框架與主題;runtime 的 Rust 模組(`nsh/mobile` 的 `BackHandler` 等)。 |
| `nsh-base` | `nsh/base`,無樣式的基礎元件(NSH 的 `gpui-base`):導覽、對話框、控制項與狀態列;Rust App 以 `nsh_base` 的名稱使用它。 |
| `nsh-js` | QuickJS 宿主與 NSH 的 runtime:響應式圖、renderer、所有原生模組、全域 API、hot module replacement、限制;以及上述一切的 TypeScript 宣告。 |
| `nsh-engine` | 引擎執行緒:驅動 `nsh-js` 與 `nsh-core`,並每個 frame 向平台交出一個 batch。 |
| `nsh-package` | 已簽署的套件:金鑰、憑證、撤銷、信任儲存區。 |
| `nsh-bundler` | 打包器:rolldown、Oxc、NSH 的 JSX 編譯器、source map、Tailwind class 檢查。 |
| `nsh-dev` | 開發伺服器及其用戶端。 |
| `nsh-platform-ios` | UIKit 後端(iOS、模擬器、Mac Catalyst):view 掛載、CoreText 文字引擎、輸入;嵌入式 SDK。 |
| `nsh-platform-android` | Android 後端:`libnsh.so` 與 Java runtime(`NshView`、view、圖片、網路)。 |
| `nsh-cli` | `nsh` 指令。 |

依賴方向為 `nsh-core` ← `nsh-js` ← `nsh-engine` ← 各平台;`nsh-base` 建構於 `nsh-core` 之上。core 不依賴任何平台與任何 JS 引擎,這使得 `nsh test` 能在任何機器上以無頭模式執行真正的 runtime。

<a id="see-also"></a>

## 另請參閱

- [效能](./performance.md)
- [響應式](./reactivity.md)
