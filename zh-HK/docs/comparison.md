---
title: "方案比較"
description: "比較 Native Shell 與 React Native、Flutter、Qt、GPUI 和 Slint,以及 Electron 和 Tauri,還有在發佈後交付 UI 時所用的 web view 與伺服器驅動 UI(server-driven UI)。"
order: 2
group: start
source_hash: 80f11e255cf3463f
---


# 方案比較

NSH 是一個適用於 iOS、Android、macOS、Windows、Linux 和 Web 的完整應用程式框架，同時也是一個執行階段，用來向已發佈的應用程式交付 UI。本頁先將它與人們用來編寫應用程式的跨平台框架比較，再與應用程式取得發佈時未附帶 UI 的各種方式比較。綠色表示該功能可用，黃色表示需要應用程式自行投入更多工作或另一個獨立專案，紅色表示不提供；標記只說明功能是否具備，並不代表效能表現。版本為各框架在撰寫時所記載的最低要求：請按你所用的版本自行核對。

圖例：<span class="status status--yes" role="img" aria-label="支援"></span> 支援 · <span class="status status--partial" role="img" aria-label="部分支援"></span> 部分支援 · <span class="status status--no" role="img" aria-label="不支援"></span> 不支援。

<a id="cross-platform-frameworks"></a>

## 跨平台框架

| 功能 | NSH | React Native | Flutter | Qt 6 | GPUI | GPUI Fast | Slint |
|---|---|---|---|---|---|---|---|
| 繪製方式 | 平台 UI | 平台視圖 | 自有引擎 | Scene graph | 自有，GPU | 自有，GPU | 自有渲染器 |
| UI 模型 | 保留模式 | 保留模式 | 保留模式 | 保留模式 | 即時模式 | 即時 + 保留模式 | 響應式，保留模式 |
| 語言 | Rust、TSX | JS、TS | Dart | C++、QML | Rust | Rust | Slint + Rust、C++ |
| iOS | <span class="status status--yes" role="img" aria-label="支援"></span> 15+ | <span class="status status--yes" role="img" aria-label="支援"></span> 15.1+ | <span class="status status--yes" role="img" aria-label="支援"></span> 15+ | <span class="status status--yes" role="img" aria-label="支援"></span> 17+ | <span class="status status--no" role="img" aria-label="不支援"></span> | <span class="status status--no" role="img" aria-label="不支援"></span> | <span class="status status--partial" role="img" aria-label="部分支援"></span> Rust |
| Android | <span class="status status--yes" role="img" aria-label="支援"></span> 9+ | <span class="status status--yes" role="img" aria-label="支援"></span> 7+ | <span class="status status--yes" role="img" aria-label="支援"></span> 7+ | <span class="status status--yes" role="img" aria-label="支援"></span> 9+ | <span class="status status--no" role="img" aria-label="不支援"></span> | <span class="status status--no" role="img" aria-label="不支援"></span> | <span class="status status--yes" role="img" aria-label="支援"></span> |
| macOS | <span class="status status--yes" role="img" aria-label="支援"></span> 14+ | <span class="status status--partial" role="img" aria-label="部分支援"></span> 獨立專案 | <span class="status status--yes" role="img" aria-label="支援"></span> 12+ | <span class="status status--yes" role="img" aria-label="支援"></span> 13+ | <span class="status status--yes" role="img" aria-label="支援"></span> 12+ | <span class="status status--yes" role="img" aria-label="支援"></span> 12+ | <span class="status status--yes" role="img" aria-label="支援"></span> 13+ |
| Windows | <span class="status status--yes" role="img" aria-label="支援"></span> 10 1809+ | <span class="status status--partial" role="img" aria-label="部分支援"></span> 獨立專案 | <span class="status status--yes" role="img" aria-label="支援"></span> 10+ | <span class="status status--yes" role="img" aria-label="支援"></span> 10 1809+ | <span class="status status--yes" role="img" aria-label="支援"></span> 10+ | <span class="status status--yes" role="img" aria-label="支援"></span> 10+ | <span class="status status--yes" role="img" aria-label="支援"></span> 10+ |
| Linux | <span class="status status--yes" role="img" aria-label="支援"></span> GTK 4.14+ | <span class="status status--no" role="img" aria-label="不支援"></span> | <span class="status status--yes" role="img" aria-label="支援"></span> Debian 10+ | <span class="status status--yes" role="img" aria-label="支援"></span> Debian 11+ | <span class="status status--yes" role="img" aria-label="支援"></span> Vulkan | <span class="status status--yes" role="img" aria-label="支援"></span> Vulkan | <span class="status status--yes" role="img" aria-label="支援"></span> |
| Web | <span class="status status--yes" role="img" aria-label="支援"></span> HTML | <span class="status status--partial" role="img" aria-label="部分支援"></span> 函式庫 | <span class="status status--yes" role="img" aria-label="支援"></span> Canvas | <span class="status status--yes" role="img" aria-label="支援"></span> Canvas | <span class="status status--no" role="img" aria-label="不支援"></span> | <span class="status status--no" role="img" aria-label="不支援"></span> | <span class="status status--yes" role="img" aria-label="支援"></span> Canvas |
| 系統文字 | <span class="status status--yes" role="img" aria-label="支援"></span> | <span class="status status--yes" role="img" aria-label="支援"></span> | <span class="status status--partial" role="img" aria-label="部分支援"></span> | <span class="status status--partial" role="img" aria-label="部分支援"></span> | <span class="status status--partial" role="img" aria-label="部分支援"></span> | <span class="status status--partial" role="img" aria-label="部分支援"></span> | <span class="status status--partial" role="img" aria-label="部分支援"></span> |
| 按裝置調整的體驗 | <span class="status status--yes" role="img" aria-label="支援"></span> | <span class="status status--partial" role="img" aria-label="部分支援"></span> | <span class="status status--partial" role="img" aria-label="部分支援"></span> | <span class="status status--partial" role="img" aria-label="部分支援"></span> | <span class="status status--no" role="img" aria-label="不支援"></span> | <span class="status status--no" role="img" aria-label="不支援"></span> | <span class="status status--partial" role="img" aria-label="部分支援"></span> |
| 無 JS 執行階段 | <span class="status status--yes" role="img" aria-label="支援"></span> Rust 應用程式 | <span class="status status--no" role="img" aria-label="不支援"></span> | <span class="status status--yes" role="img" aria-label="支援"></span> | <span class="status status--partial" role="img" aria-label="部分支援"></span> C++ | <span class="status status--yes" role="img" aria-label="支援"></span> | <span class="status status--yes" role="img" aria-label="支援"></span> | <span class="status status--yes" role="img" aria-label="支援"></span> |
| 簽署交付 | <span class="status status--yes" role="img" aria-label="支援"></span> | <span class="status status--partial" role="img" aria-label="部分支援"></span> OTA | <span class="status status--no" role="img" aria-label="不支援"></span> | <span class="status status--partial" role="img" aria-label="部分支援"></span> QML | <span class="status status--partial" role="img" aria-label="部分支援"></span> Shell | <span class="status status--partial" role="img" aria-label="部分支援"></span> Shell | <span class="status status--no" role="img" aria-label="不支援"></span> |
| 授權 | Apache-2.0 | MIT | BSD-3-Clause | LGPL、GPL、商業授權 | Apache-2.0 | Apache-2.0 | GPL、商業授權 |

即時模式每一幀都會重新建立 UI 描述；保留模式則會保留該描述，只更新有變化的部分。GPUI Fast 在 GPUI 之上結合兩者，GPUI 能運行的地方它也能運行。「Shell」指 [GPUI Shell](https://gpui-kit.com/shell)。

NSH 是此處唯一把以下各項結合起來的框架：各平台自有的 UI 和文字輸入、以同一個應用程式涵蓋手機、桌面和 Web（Web 以 HTML 呈現）、不含 JavaScript 執行階段的 Rust 應用程式，以及在發佈後交付、經簽署並在沙盒中運行的 UI。

<a id="what-the-rows-mean"></a>

### 各列的含義

- **繪製方式、UI 模型。** NSH 會掛載各平台自有的視圖並保留它們（保留模式）：一次變更只會更新受影響的視圖。React Native 同樣在 iOS 和 Android 上掛載平台視圖。Flutter、Qt Quick、GPUI 和 Slint 則以自己的渲染器繪製；GPUI 每一幀都會建立元素樹（即時模式），而 [GPUI Fast](https://github.com/longbridge/gpui-fast) 會重用沒有變化的部分。
- **平台。** NSH 的最低版本為自行訂定（[平台](./platforms.md)）。其他框架的資料來自 [React Native 0.76](https://reactnative.dev/blog/2024/10/23/release-0.76-new-architecture)（iOS 15.1、Android 7 / API 24；macOS 和 Windows 透過獨立的 react-native-macos 和 react-native-windows 專案，Web 則透過 react-native-web 函式庫）、[Flutter 3.47](https://docs.flutter.dev/reference/supported-platforms)、[Qt 6.10](https://doc.qt.io/qt-6.10/supported-platforms.html)、GPUI 的 [Zed 系統需求](https://zed.dev/docs/installation)，以及 [Slint 的平台指南](https://docs.slint.dev/latest/docs/slint/guide/platforms/mobile/general/)（iOS 透過 Rust）。「Canvas」是指框架在頁面的 canvas 上繪製；NSH 的 Web 應用程式則是以 CSS 設定樣式的 HTML 元素，由瀏覽器負責捲動、選取和編輯（[Web](./web.md)）。
- **系統文字。** NSH 的文字欄位就是各平台的編輯器：`UITextView`、`EditText`、`NSTextView`、GTK 的 `TextView`，以及瀏覽器的編輯器，並配備系統的輸入法、選取控點和編輯選單；在 Windows 上，NSH 自家的編輯器配合 DirectWrite 和系統輸入法（IMM32）運作。React Native 同樣使用平台的文字輸入元件。自行繪製的框架則自行實作文字編輯，再接駁到系統的輸入法。
- **按裝置調整的體驗。** NSH 的基礎元件會跟隨裝置：同一個 `Menu` 在使用指標時會在觸發位置彈出，在手機上則是從底部升起的面板；`ContextMenu` 則以右鍵點按或手指長按開啟。在其他框架中，按裝置調整互動方式大多要由應用程式自行處理。
- **無 JS 執行階段。** Rust 應用程式的 runner 在任何平台上都不會連結 JavaScript 引擎；TSX 是第二條路徑，使用同一個引擎。Qt Quick 的 QML 運行於 Qt 的 JavaScript 引擎；以 C++ 編寫的 Qt Widgets 則不會。
- **簽署交付。** NSH 會根據所信任的金鑰和撤銷清單驗證已簽署的 `.nshpkg` 套件，並在虛擬機器中運行每個套件，其限制和能力由宿主授予（[簽署套件](./signed-packages.md)、[沙盒與能力](./sandbox-and-capabilities.md)）。React Native 的空中更新（OTA）交付的是受信任的應用程式程式碼；Qt 可以載入 QML 檔案；GPUI 應用程式則透過 [GPUI Shell](https://gpui-kit.com/shell) 載入 JavaScript 模組。

<a id="what-sets-nsh-apart"></a>

### NSH 的獨特之處

- **在每個平台上都是原生，兩方面皆然。** 每個後端都建基於所在平台自有的視圖、文字和輸入法（UIKit、Android views、AppKit、配合 Direct2D 的 Win32、GTK 4、HTML），各平台的互動方式也隨之而來。文字選取、輸入法和無障礙功能都由系統提供，新版作業系統為這些功能帶來的改進也會惠及應用程式（[簡介](./index.md#what-native-means)）。
- **一個應用程式涵蓋手機、桌面和 Web。** 六個平台是同一個框架的後端，版面會隨之重新調整，輸入方式亦跟隨裝置；在 Web 上，應用程式就是 HTML，並以靜態網站形式發佈。
- **Rust 優先，不含 JavaScript 執行階段。** 整個應用程式可以由頭到尾都以 Rust 編寫，編譯為原生程式碼，並享有 Rust 的型別、執行緒和 crate。TSX 是第二條路徑，使用同一個引擎，適合快速編寫畫面（[使用 Rust 構建](./rust.md)）。
- **適合日常應用程式的保留式視圖。** 聊天、表單、列表和文件在靜止時近乎閒置，因為一次變更只會傳送受影響的視圖（[簡介](./index.md#retained-views)）。
- **發佈後交付的 UI，經簽署並在沙盒中運行。** 以 NSH 構建的應用程式，以及以各平台自有工具編寫的原生應用程式，都可以在執行時載入由團隊編寫或由 AI 生成的 TSX 模組（[動態 UI](./index.md#dynamic-ui-and-ai-generated-ui)）。
- **一套工具鏈，同時服務開發者和代理。** 一個 `nsh` 可執行檔即可為所有目標平台建立、運行、在真實平台上測試、打包和簽署應用程式。

### React Native

React Native 與 NSH 的目標最為接近：兩者都旨在減少重複的客戶端工作，並使用平台的視圖。React Native 的核心是搭配 React 及其套件生態的 JavaScript 或 TypeScript，運行於 iOS 和 Android，桌面支援則由獨立專案提供。NSH 的核心是 Rust：其執行階段、渲染器和模組都是 Rust，Rust 本身就是一種應用程式語言，而 TSX 只是兩條路徑之一；它的六個平台（包括桌面和 Web）都是同一個框架的後端。

### Flutter

Flutter 以自己的引擎繪製每一個像素，因此應用程式在每個平台上外觀一致。NSH 則走另一條路：使用各平台自有的視圖、文字和文字輸入，在 Web 上則使用 HTML 元素以及瀏覽器自有的捲動、選取和輸入。文字編輯、輸入法和選取都由平台負責，而不是在每個平台上重新實作。
### Qt

Qt 是成熟的工具包，提供 Qt Widgets 和 Qt Quick 兩種 UI 技術，工具和平台支援歷史悠久。NSH 的不同之處在於基礎和模型：以 Rust 作為核心語言並提供 TSX 路徑，工具鏈專為自動化（包括 AI 驅動）開發而設計，在 web 上渲染為 HTML，並在同一個 component 模型內適配流動裝置、桌面和 web 的互動。

<a id="gpui-and-gpui-fast"></a>

### GPUI 與 GPUI Fast

[GPUI](https://gpui-kit.com) 是以 GPU 繪製的 Rust UI 框架，專為要求嚴苛的桌面應用程式而設；[GPUI Fast](https://github.com/longbridge/gpui-fast) 是 Longbridge 的分支版本，具備保留式渲染（會重用未變動的 view、版面和文字量度）、捲動圖層和原生視窗合成。NSH 則建基於各平台自身的 view，因此文字輸入、選取、輸入法和系統互動都由平台本身處理，並且同時涵蓋手機和 web；NSH 的 GPUI backend 可將 NSH 應用程式嵌入 GPUI 和 GPUI Kit 應用程式（[GPUI](./gpui.md)）。

兩者適合不同的負載。在 [NSH 效能基準測試](https://github.com/longbridge/nsh-perf-bench)中（Linux、500 行報價表、NSH 使用其 GTK 4 backend），日常負載的開銷相同：每秒 1,000 個報價時，NSH Rust 佔用 18% 的單一核心，GPUI Fast 則佔 20%。在持續而密集的更新下，GPUI Fast 領先：每秒 20,000 個報價時，它佔用 25% 的單一核心，而 NSH 佔 73–78%；對 1,000 個方塊逐格製作動畫時，其 CPU 開銷約為 NSH 的三分之一。

### Slint

Slint 是宣告式 UI 工具包，擁有自己的語言和輕量渲染器，適用於桌面和嵌入式裝置，可從 Rust、C++、JavaScript 或 Python 使用。兩者都重視原生效能；NSH 的路線是採用各平台自身的 UI 和互動、在 web 上使用 HTML、以 Rust 和 TSX 作為應用程式語言，並在六個平台上進行 AI 驅動的開發。

<a id="electron-and-tauri"></a>

### Electron 與 Tauri

Electron 內含 Chromium，Tauri 則使用系統的 web view：兩者都以 web 內容建構桌面應用程式（Tauri 亦可建構流動應用程式），並採用瀏覽器的文字和輸入處理。NSH 則建構各平台自身的 view，只在 web 本身才渲染 HTML。

<a id="ui-delivered-after-release"></a>

## 發布後交付的 UI

如果應用程式想要加入發布時並未附帶的 UI，例如由模型生成的回答、來自合作夥伴或其他團隊的功能，或無需發布新版本即可變更的畫面，無論在手機還是桌面上，都有幾種成熟的做法。它們的差別在於由什麼繪製 UI、所交付的程式碼可以做什麼，以及應用程式需要改動多少才能承載它們。

| 能力 | NSH | Web view | Server-driven UI | 小程式 | OTA 更新 |
|---|---|---|---|---|---|
| 繪製者 | 平台 UI | 瀏覽器引擎 | 應用程式自身的 view | Web 引擎 + 封裝層 | 框架渲染器 |
| 原生外觀與行為 | <span class="status status--yes" role="img" aria-label="Yes"></span> | <span class="status status--no" role="img" aria-label="No"></span> | <span class="status status--yes" role="img" aria-label="Yes"></span> | <span class="status status--partial" role="img" aria-label="Partial"></span> | <span class="status status--yes" role="img" aria-label="Yes"></span> |
| 自有狀態、邏輯與版面 | <span class="status status--yes" role="img" aria-label="Yes"></span> | <span class="status status--yes" role="img" aria-label="Yes"></span> | <span class="status status--no" role="img" aria-label="No"></span> | <span class="status status--yes" role="img" aria-label="Yes"></span> | <span class="status status--yes" role="img" aria-label="Yes"></span> |
| 宿主的原生 component | <span class="status status--yes" role="img" aria-label="Yes"></span> | <span class="status status--partial" role="img" aria-label="Partial"></span> 橋接 | <span class="status status--yes" role="img" aria-label="Yes"></span> | <span class="status status--partial" role="img" aria-label="Partial"></span> | <span class="status status--yes" role="img" aria-label="Yes"></span> |
| 由宿主配置的沙盒 | <span class="status status--yes" role="img" aria-label="Yes"></span> | <span class="status status--partial" role="img" aria-label="Partial"></span> 同源 | <span class="status status--yes" role="img" aria-label="Yes"></span> Schema | <span class="status status--yes" role="img" aria-label="Yes"></span> | <span class="status status--no" role="img" aria-label="No"></span> |
| 已簽署、可撤銷的套件 | <span class="status status--yes" role="img" aria-label="Yes"></span> | <span class="status status--no" role="img" aria-label="No"></span> | <span class="status status--no" role="img" aria-label="No"></span> | <span class="status status--partial" role="img" aria-label="Partial"></span> | <span class="status status--partial" role="img" aria-label="Partial"></span> |
| 適合 AI 生成的 UI | <span class="status status--yes" role="img" aria-label="Yes"></span> | <span class="status status--partial" role="img" aria-label="Partial"></span> 網頁 | <span class="status status--partial" role="img" aria-label="Partial"></span> | <span class="status status--partial" role="img" aria-label="Partial"></span> | <span class="status status--no" role="img" aria-label="No"></span> |
| 宿主應用程式的成本 | 一個 view 加一個函式庫 | 每個 view 一個瀏覽器引擎 | 每個 component 一個渲染器 | 一個容器 SDK | 整個應用程式都要使用該框架 |

- **Web view（H5）。** 在瀏覽器引擎中顯示的頁面：HTML 能表達的內容都可以實現，採用瀏覽器的外觀，並以手寫橋接連接原生程式碼。
- **Server-driven UI。** 以 JSON 重新組合應用程式已內建的 component 和動作：容易生成，但除了 schema 所提供的之外，沒有本地狀態或邏輯。
- **小程式容器。** 建立在 web 引擎上、針對特定平台的框架和 API，並置於龐大的容器 SDK 之內。
- **Over-the-air 更新**（例如 React Native 配合 code-push 服務）。擁有完整的框架，但更新內容屬於受信任的應用程式程式碼，而且應用程式必須以該框架編寫。
- **NSH。** 一個 TSX 模組，擁有自己的狀態、邏輯、動畫和版面，以平台自身的 UI 渲染，並可使用宿主已註冊的原生 view。它以應用程式會驗證的已簽署套件形式送達，在擁有記憶體、呼叫時間和節點限制的獨立 VM 中運行，只能存取宿主授權的網絡主機、網頁和系統設定（[沙盒與權限](./sandbox-and-capabilities.md)）。宿主只需在模組出現的位置加入一個 view（[平台](./platforms.md#embed-in-a-native-app)），同一個 bundle 便可在所有平台上運行。這正是 NSH 在 [GPUI Shell](./index.md#native-shell-and-gpui-shell) 之外仍然存在的原因。

<a id="when-another-option-fits-better"></a>

## 何時其他方案更合適

- 畫面以數千個 view 的持續密集更新為主，例如每秒串流數萬個報價的市場數據終端，或每一幀都重繪的自訂視覺化：GPUI Fast 的保留式 GPU 渲染只佔用一小部分 CPU（參見 [GPUI 與 GPUI Fast](#gpui-and-gpui-fast)）。
- 應用程式必須在每個平台上看起來完全一致：由框架自行繪製一切的方案（例如 Flutter 或 Slint）在設計上即可做到。
- 你現在就需要龐大的第三方套件生態：React Native、Flutter 和 Qt 都已累積多年。
- UI 是一份文件或現有的網頁：web view 可以原樣顯示。
- 畫面的集合固定而且數量少，只有內容和順序會變：server-driven UI 完全不需要 runtime。

<a id="see-also"></a>

## 另見

- [簡介](./index.md)：NSH 是什麼，以及「原生」在 NSH 中的含義。
- [架構](./architecture.md)：NSH 內部各部分在何處運行。
- [效能](./performance.md)：NSH 遵循的規則，以及如何量度應用程式。
