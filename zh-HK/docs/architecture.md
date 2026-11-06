---
title: "架構"
description: "說明 NSH 應用程式如何運作:建置流程、引擎執行緒與主執行緒、由 signal 變更到原生視圖的路徑、原生響應式圖、文字排版,以及各個 crate。"
order: 63
group: tools
source_hash: 03fd3f0b9b408f5b
---


# 架構

這一頁寫給想了解 `count.set(1)` 到畫面上標籤產生變化之間究竟發生了甚麼事的應用程式開發者，適用於以 Rust 或 TSX 編寫的應用程式。
你不需要閱讀本頁也能開發應用程式，但它能解釋 NSH 為何會有這樣的行為：為何元件只執行一次、為何 JS 忙碌時動畫仍然流暢、為何主執行緒從不等待你的程式碼。

<a id="the-big-picture"></a>

## 整體概覽

<div class="diagram-scroll">
<img class="diagram diagram-light" src="/diagrams/architecture-light.svg" alt="How an nsh app runs: the nsh CLI builds App.tsx into bytecode; on the engine thread, QuickJS runs a handler, the reactive graph in nsh-js queues ops, and nsh-core commits one MountBatch; it crosses to the main thread in one hop, which applies it to UIKit or Android views; touches go back as events. Native animations run on the main thread without JavaScript.">
<img class="diagram diagram-dark" src="/diagrams/architecture-dark.svg" alt="How an nsh app runs: the nsh CLI builds App.tsx into bytecode; on the engine thread, QuickJS runs a handler, the reactive graph in nsh-js queues ops, and nsh-core commits one MountBatch; it crosses to the main thread in one hop, which applies it to UIKit or Android views; touches go back as events. Native animations run on the main thread without JavaScript.">
</div>

<a id="building-only-your-code-becomes-js"></a>

## 建置：只有你的程式碼會變成 JS

`nsh build`、`nsh dev` 及其他指令會使用以 Rust 編寫的工具鏈（不需要 Node.js）來打包你的應用程式：

1. **Oxc** 移除 TypeScript 型別。
2. **NSH 的 JSX 編譯器**在同一個處理階段中，把 JSX 轉換成對原生 renderer 的直接呼叫。靜態的 props 和子節點只會設定一次；可能會變化的運算式（呼叫函式或讀取屬性的運算式）則會變成 renderer 追蹤的綁定。元件會變成一般的函式呼叫，並接收一個 props 物件，其中會變化的 props 以 getter 提供。
3. **rolldown** 把你的模組打包成單一 ES module。對 NSH 模組（`nsh`、`nsh/mobile`、`nsh/base` 等）的 import 會保持為 import：這些模組是原生模組，由 runtime 提供。**打包結果只包含你應用程式的程式碼**；計數器範例的 JS 不到 1 KB。
4. 打包結果會編譯成**位元組碼**（`bundle.nshc`），載入速度比原始碼更快；同時會跨所有步驟合成一份 **source map**，讓堆疊追蹤指向你的 `.tsx` 行號。

你匯入的圖片和字型會被收集為資源，而供編輯器使用的型別宣告則會寫入 `.nsh/types`。

以 Rust 編寫的應用程式沒有打包結果：Cargo 會為每個目標建置 runner 並連結你的 crate，而 `nsh.json` 所指定的根元件會在引擎上以原生方式執行。以下所述的一切同樣適用於 Rust 應用程式，只是你的元件程式碼在 TSX 應用程式中於 QuickJS 內執行，在 Rust 應用程式中則以 Rust 執行。

<a id="running-two-threads-per-app"></a>

## 執行：每個應用程式兩個執行緒

每個正在執行的應用程式（iOS 上的 `NshAppView`、Android 上的 `NshView`，或已打包應用程式的視窗）都是一個**引擎**，擁有自己的**引擎執行緒**；若是 TSX，還會有自己的 QuickJS VM。這裡沒有全域單例，因此多個應用程式可以在同一個宿主應用程式中並行運作。

<a id="the-engine-thread"></a>

### 引擎執行緒

應用程式邏輯的一切都在這裡進行：

- **你的程式碼**在這裡執行：元件、事件處理器、計時器、effect。Rust 元件以原生方式執行；TSX 則在 **QuickJS** 中執行。
- **響應式圖**（signal、computed 值、effect、owner、context）是原生的。它的節點是原生類別的 QuickJS 物件，因此垃圾回收器能透過它們看見引用關係，但依賴追蹤和更新排程都由 Rust 負責（遵循 Solid 1.9 的演算法）。
- 你編譯後的 JSX 所呼叫的 **renderer** 是原生的。它建立節點，並把每個變更轉換成一個直接推入原生佇列的 **op**：沒有 JSON，也不會每個 prop 傳送一次訊息。
- **核心**維護所有節點的 shadow tree。當一個 JS turn 結束時，它會一次取出所有已排入佇列的 op 並進行 **commit**：渲染 Rust 元件（`nsh/base` 的元件及應用程式自己的元件）、解析 padding 和 margin 中的 `env()` inset、重建有變化的文字、以 **Taffy** 進行佈局（支援 flexbox 和 grid，預設為縱向排列且不收縮）、比對 frame 和樣式的差異，並產生一個 **MountBatch**：即原生視圖所需的操作清單。

<a id="the-main-thread"></a>

### 主執行緒

平台的主（UI）執行緒會以單次跳轉套用每個 MountBatch：建立視圖、插入視圖、設定樣式和 frame，並交出已完成佈局的文字。除此以外，它只做必須在主執行緒上進行的工作：

- **繪製文字**，而這些文字已在引擎執行緒上完成佈局；
- **原生動畫**：來自 `nsh` 的動畫值會逐幀驅動（iOS 上使用 `CADisplayLink`，Android 上使用 UI 執行緒的 animator），並直接寫入視圖；
- **手勢和捲動**：觸控會變成事件並傳送到引擎執行緒；`scrollValue` 和 `pan` 會在同一幀內為動畫值提供輸入。

**主執行緒從不等待 JS。** 當系統需要即時答覆時（例如這段文字可否更改、返回按鈕可否彈出此畫面、此 sheet 可否關閉），答案已預先以 prop 的形式掛載，而 JS 之後會透過事件得知結果。引擎執行緒繁忙可能會延遲更新，但不會令捲動、動畫或系統手勢卡住。

<a id="from-a-tap-to-the-screen"></a>

## 從點按到畫面

```text
 main thread               engine thread                                              main thread
 ───────────               ─────────────────────────────────────────────────────      ───────────
 tap on a view ─ event ─▶  handler runs: count.set(count() + 1)
                           reactive graph: the bindings that read count() run again
                           renderer: one op per changed binding → native queue
                           JS turn ends → core commit: render, text, layout, diff
                           → MountBatch (e.g. 1 Text item)                 ─ hop ─▶   apply: draw the new text
```

在計數器範例中，一次點按在 Mac 的 release 建置上，JS 和 commit 合計約需 0.12 毫秒，並產生少量的 mount 項目（參閱[測試](./testing-and-trace.md)）。

在 Rust 應用程式中，處理器是一個 Rust closure（`count.set(count.get() + 1)`），之後同樣是相同的響應式圖、commit 和 batch，過程中沒有直譯器。

這個設計帶來三項特性：

- **一個 turn 就是一次 commit。** 不論處理器設定了多少個 signal，視圖都只會一併變更一次。
- **元件只執行一次。** 只有綁定會重新執行；元件不會重新渲染，也沒有虛擬 DOM 比對。剩下的比對工作屬於核心，並以 Rust 對 frame 和樣式進行。
- **只傳送變更。** 沒有變化的樣式和 frame 不會被傳送；新建立的視圖也不會獲得預設值。

<a id="text-laid-out-once-off-the-main-thread"></a>

## 文字：只佈局一次，且不在主執行緒進行

文字往往是 UI 中成本最高的部分。NSH 在引擎執行緒上使用平台自己的文字引擎來佈局文字，所以外觀與原生文字完全一致：

1. **準備**：一個 `<Text>` 及其巢狀的 span 會合併成一個帶屬性的字串（Apple 平台使用 CoreText，Android 使用 `PrecomputedText` / `StaticLayout`）；
2. 在佈局所要求的寬度下進行**量度**；量度結果會按內容和寬度快取，因此只更改顏色時不會重新量度；
3. 以最終尺寸進行**佈局**。

主執行緒接收不可變的結果，並只負責繪製。巢狀在 `<Text>` 內的文字是 span，而不是視圖；位於 `<Text>` 以外的字串不會渲染任何內容。

<a id="lists"></a>

## 列表

`List` 以原生方式進行虛擬化。核心會決定哪些列靠近可視範圍、計算位置、欄數和 sticky header，並回收儲存格。當儲存格需要顯示不同的項目時，runtime 會為它綁定資料（你的列函式的 `item()` 和 `index()` accessor 會隨之改變）；如果某一幀沒有顯示新的列，則完全不會呼叫 JS。參閱[列表](./lists.md)。

<a id="everything-else-the-runtime-does"></a>

## runtime 的其他工作

- **網絡**：`fetch` 及其他全域 API 都是原生類別。請求會交給平台的 HTTP 堆疊處理（`NSURLSession`、`HttpURLConnection`），並支援雙向串流。
- **圖片**會在主執行緒以外下載和解碼，按視圖的大小處理，並設有記憶體快取。
- **限制和權限**由 runtime 以 Rust 強制執行：參閱[沙盒與權限](./sandbox-and-capabilities.md)。
- **熱模組替換**同樣是原生的：runtime 套用修補只需遠少於一毫秒（參閱[開發伺服器與除錯](./dev-server-and-debugging.md)）。

<a id="three-layers"></a>

## 三個層次

NSH 的 UI 與 GPUI Kit 一樣，分為三個層次構建：

| 層次 | NSH | GPUI Kit | 說明 |
|---|---|---|---|
| 基礎元素 | `nsh-core` 與 runtime（`nsh`、`nsh/mobile`、`nsh/desktop`） | `gpui` | 宿主元素、樣式、佈局、渲染、響應式機制、環境 |
| 基礎元件 | `nsh-base`（`nsh/base`） | `gpui-base` | 無樣式的元件，負責行為、狀態、焦點、鍵盤和無障礙功能，外觀則由應用程式決定 |
| 元件庫 | 你的應用程式自己的，或社群提供的 | `gpui-component` | 有樣式的元件：按鈕、卡片、帶有外觀的列 |

前兩個層次屬於 Native Shell，第三個層次則由你負責：應用程式可以在 `nsh/base` 和基礎元素之上建立自己的元件庫（以 TSX 或作為[自己 crate](./rust.md) 中的 Rust 元件），也可以使用社群發佈的元件庫，或直接在應用程式中為 UI 設定樣式。

<a id="the-crates"></a>

## Crate 一覽

NSH 是一個 Rust workspace。開發應用程式時你無需自行建置它（發行版已附帶 CLI 和預先建置的 runtime），但這些名稱會出現在日誌和文件中：

| Crate | 說明 |
|---|---|
| `nsh-core` | 與平台無關的核心：shadow tree、樣式、Taffy 佈局、文字合併、列表虛擬化、mount 項目；CSS 值和 Tailwind；原生動畫圖（數值、插值、timing / spring / decay）；Rust 元件的框架和主題；runtime 的 Rust 模組（`nsh/mobile` 的 `BackHandler` 等）。 |
| `nsh-base` | `nsh/base`，即無樣式的基礎元件（NSH 的 `gpui-base`）：導覽、對話框、控制項和狀態列；Rust 應用程式以 `nsh_base` 使用它。 |
| `nsh-js` | QuickJS 宿主和 NSH 的 runtime：響應式圖、renderer、所有原生模組、全域 API、熱模組替換、限制；以及以上所有內容的 TypeScript 宣告。 |
| `nsh-engine` | 引擎執行緒：驅動 `nsh-js` 和 `nsh-core`，並每幀向平台交出一個 batch。 |
| `nsh-package` | 已簽署的套件：金鑰、憑證、撤銷、信任存放區。 |
| `nsh-bundler` | 打包器：rolldown、Oxc、NSH 的 JSX 編譯器、source map、Tailwind class 檢查。 |
| `nsh-dev` | 開發伺服器及其客戶端。 |
| `nsh-platform-ios` | UIKit 後端（iOS、模擬器、Mac Catalyst）：視圖掛載、CoreText 文字引擎、輸入；嵌入式 SDK。 |
| `nsh-platform-android` | Android 後端：`libnsh.so` 和 Java runtime（`NshView`、視圖、圖片、網絡）。 |
| `nsh-cli` | `nsh` 指令。 |

依賴方向為 `nsh-core` ← `nsh-js` ← `nsh-engine` ← 各平台；`nsh-base` 建基於 `nsh-core`。核心不依賴任何平台，也不依賴任何 JS 引擎，因此 `nsh test` 能在任何機器上以 headless 方式執行真正的 runtime。

<a id="see-also"></a>

## 另請參閱

- [效能](./performance.md)
- [響應式機制](./reactivity.md)
