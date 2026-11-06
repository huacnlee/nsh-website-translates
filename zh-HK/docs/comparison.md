---
title: "方法比較"
description: "比較 Native Shell 與 React Native、Flutter、Qt、GPUI 和 Slint、與 Electron 和 Tauri,以及與 web views 和 server-driven UI 在發布後交付 UI 方面的差異。"
order: 2
group: start
---

# 方案比較

NSH 是一個可用於 iOS、Android、macOS、Windows、Linux 與網頁上完整應用程式的框架，同時也是一個執行環境，可將 UI 在應用程式發佈後交付給它。本頁先將 NSH 與開發者用來撰寫應用程式的跨平台框架比較，再與應用程式取得發佈時未隨附之 UI 的各種方式比較。綠色表示該功能可用，黃色表示需要應用程式自行投入更多工作或另行搭配其他專案，紅色表示未提供；這些標記表示的是功能是否可用，而非效能。版本為各框架在撰寫時文件所載的最低需求：請依您所使用的版本自行確認。

圖例：<span class="status status--yes" role="img" aria-label="是"></span> 是 · <span class="status status--partial" role="img" aria-label="部分"></span> 部分 · <span class="status status--no" role="img" aria-label="否"></span> 否。

<a id="cross-platform-frameworks"></a>

## 跨平台框架

| 功能 | NSH | React Native | Flutter | Qt 6 | GPUI | GPUI Fast | Slint |
|---|---|---|---|---|---|---|---|
| 繪製方式 | 平台 UI | 平台檢視 | 自有引擎 | 場景圖 | 自有 GPU 繪製 | 自有 GPU 繪製 | 自有渲染器 |
| UI 模型 | 保留模式 | 保留模式 | 保留模式 | 保留模式 | 立即模式 | 立即 + 保留模式 | 響應式、保留模式 |
| 語言 | Rust、TSX | JS、TS | Dart | C++、QML | Rust | Rust | Slint + Rust、C++ |
| iOS | <span class="status status--yes" role="img" aria-label="是"></span> 15+ | <span class="status status--yes" role="img" aria-label="是"></span> 15.1+ | <span class="status status--yes" role="img" aria-label="是"></span> 15+ | <span class="status status--yes" role="img" aria-label="是"></span> 17+ | <span class="status status--no" role="img" aria-label="否"></span> | <span class="status status--no" role="img" aria-label="否"></span> | <span class="status status--partial" role="img" aria-label="部分"></span> Rust |
| Android | <span class="status status--yes" role="img" aria-label="是"></span> 9+ | <span class="status status--yes" role="img" aria-label="是"></span> 7+ | <span class="status status--yes" role="img" aria-label="是"></span> 7+ | <span class="status status--yes" role="img" aria-label="是"></span> 9+ | <span class="status status--no" role="img" aria-label="否"></span> | <span class="status status--no" role="img" aria-label="否"></span> | <span class="status status--yes" role="img" aria-label="是"></span> |
| macOS | <span class="status status--yes" role="img" aria-label="是"></span> 14+ | <span class="status status--partial" role="img" aria-label="部分"></span> 另有專案 | <span class="status status--yes" role="img" aria-label="是"></span> 12+ | <span class="status status--yes" role="img" aria-label="是"></span> 13+ | <span class="status status--yes" role="img" aria-label="是"></span> 12+ | <span class="status status--yes" role="img" aria-label="是"></span> 12+ | <span class="status status--yes" role="img" aria-label="是"></span> 13+ |
| Windows | <span class="status status--yes" role="img" aria-label="是"></span> 10 1809+ | <span class="status status--partial" role="img" aria-label="部分"></span> 另有專案 | <span class="status status--yes" role="img" aria-label="是"></span> 10+ | <span class="status status--yes" role="img" aria-label="是"></span> 10 1809+ | <span class="status status--yes" role="img" aria-label="是"></span> 10+ | <span class="status status--yes" role="img" aria-label="是"></span> 10+ | <span class="status status--yes" role="img" aria-label="是"></span> 10+ |
| Linux | <span class="status status--yes" role="img" aria-label="是"></span> GTK 4.14+ | <span class="status status--no" role="img" aria-label="否"></span> | <span class="status status--yes" role="img" aria-label="是"></span> Debian 10+ | <span class="status status--yes" role="img" aria-label="是"></span> Debian 11+ | <span class="status status--yes" role="img" aria-label="是"></span> Vulkan | <span class="status status--yes" role="img" aria-label="是"></span> Vulkan | <span class="status status--yes" role="img" aria-label="是"></span> |
| 網頁 | <span class="status status--yes" role="img" aria-label="是"></span> HTML | <span class="status status--partial" role="img" aria-label="部分"></span> 函式庫 | <span class="status status--yes" role="img" aria-label="是"></span> Canvas | <span class="status status--yes" role="img" aria-label="是"></span> Canvas | <span class="status status--no" role="img" aria-label="否"></span> | <span class="status status--no" role="img" aria-label="否"></span> | <span class="status status--yes" role="img" aria-label="是"></span> Canvas |
| 系統文字 | <span class="status status--yes" role="img" aria-label="是"></span> | <span class="status status--yes" role="img" aria-label="是"></span> | <span class="status status--partial" role="img" aria-label="部分"></span> | <span class="status status--partial" role="img" aria-label="部分"></span> | <span class="status status--partial" role="img" aria-label="部分"></span> | <span class="status status--partial" role="img" aria-label="部分"></span> | <span class="status status--partial" role="img" aria-label="部分"></span> |
| 依裝置調整的互動 | <span class="status status--yes" role="img" aria-label="是"></span> | <span class="status status--partial" role="img" aria-label="部分"></span> | <span class="status status--partial" role="img" aria-label="部分"></span> | <span class="status status--partial" role="img" aria-label="部分"></span> | <span class="status status--no" role="img" aria-label="否"></span> | <span class="status status--no" role="img" aria-label="否"></span> | <span class="status status--partial" role="img" aria-label="部分"></span> |
| 無 JS 執行環境 | <span class="status status--yes" role="img" aria-label="是"></span> Rust 應用程式 | <span class="status status--no" role="img" aria-label="否"></span> | <span class="status status--yes" role="img" aria-label="是"></span> | <span class="status status--partial" role="img" aria-label="部分"></span> C++ | <span class="status status--yes" role="img" aria-label="是"></span> | <span class="status status--yes" role="img" aria-label="是"></span> | <span class="status status--yes" role="img" aria-label="是"></span> |
| 簽署式交付 | <span class="status status--yes" role="img" aria-label="是"></span> | <span class="status status--partial" role="img" aria-label="部分"></span> OTA | <span class="status status--no" role="img" aria-label="否"></span> | <span class="status status--partial" role="img" aria-label="部分"></span> QML | <span class="status status--partial" role="img" aria-label="部分"></span> Shell | <span class="status status--partial" role="img" aria-label="部分"></span> Shell | <span class="status status--no" role="img" aria-label="否"></span> |
| 授權 | Apache-2.0 | MIT | BSD-3-Clause | LGPL、GPL、商業授權 | Apache-2.0 | Apache-2.0 | GPL、商業授權 |

立即模式會在每個影格重新建立 UI 描述；保留模式則會保留該描述，並只更新有變動的部分。GPUI Fast 在 GPUI 之上結合兩者，凡是 GPUI 能執行之處它也能執行。「Shell」指的是 [GPUI Shell](https://gpui-kit.com/shell)。

在這些框架中，NSH 是唯一把以下各項整合在一起的：各平台自己的 UI 與文字輸入、以單一應用程式涵蓋手機、桌面與網頁（網頁以 HTML 呈現）、不含 JavaScript 執行環境的 Rust 應用程式，以及在發佈後交付的已簽署、沙箱化 UI。

<a id="what-the-rows-mean"></a>

### 各列的含義

- **繪製方式、UI 模型。** NSH 會掛載各平台自己的檢視並保留它們（保留模式）：一次變更只會更新受影響的檢視。React Native 在 iOS 與 Android 上同樣掛載平台檢視。Flutter、Qt Quick、GPUI 與 Slint 則使用自己的渲染器繪製；GPUI 在每個影格建立元素樹（立即模式），而 [GPUI Fast](https://github.com/longbridge/gpui-fast) 會重複使用沒有變動的部分。
- **平台。** NSH 的最低版本需求由其自身訂定（[Platforms](./platforms.md)）。其他框架的資料來源為 [React Native 0.76](https://reactnative.dev/blog/2024/10/23/release-0.76-new-architecture)（iOS 15.1、Android 7 / API 24；macOS 與 Windows 透過獨立的 react-native-macos 與 react-native-windows 專案，網頁則透過 react-native-web 函式庫）、[Flutter 3.47](https://docs.flutter.dev/reference/supported-platforms)、[Qt 6.10](https://doc.qt.io/qt-6.10/supported-platforms.html)、GPUI 的 [Zed 系統需求](https://zed.dev/docs/installation)，以及 [Slint 的平台指南](https://docs.slint.dev/latest/docs/slint/guide/platforms/mobile/general/)（iOS 以 Rust 使用）。「Canvas」表示框架在頁面上的畫布中繪製；NSH 的網頁應用程式則是以 CSS 設定樣式的 HTML 元素，由瀏覽器負責捲動、選取與編輯（[Web](./web.md)）。
- **系統文字。** NSH 的文字欄位就是平台的編輯器：`UITextView`、`EditText`、`NSTextView`、GTK 的 `TextView`，以及瀏覽器自身的編輯器，並搭配系統的輸入法、選取控點與編輯選單；在 Windows 上，NSH 自己的編輯器則與 DirectWrite 及系統輸入法（IMM32）搭配運作。React Native 同樣使用平台的文字輸入元件。自行繪製的框架則是自己實作文字編輯，再與系統輸入法銜接。
- **依裝置調整的互動。** NSH 的基礎元件會依裝置而調整：同一個 `Menu` 在使用指標裝置時是出現在觸發處的彈出視窗，在手機上則是從底部滑出的面板；`ContextMenu` 則會在按右鍵或長按手指時開啟。在其他框架中，依裝置調整互動方式大多需要應用程式自行處理。
- **無 JS 執行環境。** Rust 應用程式的 runner 在任何平台上都不會連結 JavaScript 引擎；TSX 是第二條路徑，使用同一個引擎。Qt Quick 的 QML 在 Qt 的 JavaScript 引擎上執行；以 C++ 撰寫的 Qt Widgets 則不需要。
- **簽署式交付。** NSH 會依其信任的金鑰與撤銷清單驗證已簽署的 `.nshpkg` 套件，並將每個套件在 VM 中執行，限制與能力由宿主授予（[Signed packages](./signed-packages.md)、[Sandbox and capabilities](./sandbox-and-capabilities.md)）。React Native 的空中更新（OTA）交付的是受信任的應用程式程式碼；Qt 可以載入 QML 檔案；GPUI 應用程式則透過 [GPUI Shell](https://gpui-kit.com/shell) 載入 JavaScript 模組。

<a id="what-sets-nsh-apart"></a>

### NSH 的獨特之處

- **各平台皆為原生，兩層意義皆然。** 每個後端都建構在其平台自己的檢視、文字與輸入法之上，即 UIKit、Android 檢視、AppKit、搭配 Direct2D 的 Win32、GTK 4 與 HTML，各平台的互動方式也隨之而來。文字選取、輸入法與無障礙功能都屬於系統，新版作業系統為這些功能帶來的改進也會直接惠及應用程式（[Introduction](./index.md#what-native-means)）。
- **一個應用程式涵蓋手機、桌面與網頁。** 六個平台是同一個框架的後端，版面可隨之重新調整，輸入方式也會依裝置而變；在網頁上，應用程式即為 HTML，並以靜態網站發佈。
- **Rust 優先，不含 JavaScript 執行環境。** 整個應用程式可以從頭到尾都使用 Rust，編譯為原生程式碼，並享有 Rust 的型別、執行緒與 crate。TSX 是第二條路徑，使用同一個引擎，適合快速撰寫畫面（[Building with Rust](./rust.md)）。
- **適用於日常應用程式的保留式檢視。** 聊天、表單、清單與文件在靜止時幾乎處於閒置狀態，因為一次變更只會傳送受影響的檢視（[Introduction](./index.md#retained-views)）。
- **發佈後交付的 UI，已簽署且沙箱化。** 以 NSH 建構的應用程式，以及以各平台自有工具撰寫的原生應用程式，都能在執行時載入由團隊撰寫或由 AI 產生的 TSX 模組（[Dynamic UI](./index.md#dynamic-ui-and-ai-generated-ui)）。
- **供人與代理程式共用的單一工具鏈。** 一個 `nsh` 可執行檔即可為所有目標建立、執行、在真實平台上測試、打包並簽署應用程式。

### React Native

React Native 在目的上最為接近：兩者都減少重複的用戶端工作，也都使用平台的檢視。React Native 的核心是搭配 React 及其套件生態系的 JavaScript 或 TypeScript，面向 iOS 與 Android，桌面支援則由獨立專案提供。NSH 的核心是 Rust：其執行環境、渲染器與模組都是 Rust，Rust 本身就是一種應用程式語言，而 TSX 只是兩條路徑之一；它的六個平台（包含桌面與網頁）都是同一個框架的後端。

### Flutter

Flutter 以自己的引擎繪製每一個像素，因此應用程式在每個平台上看起來都一樣。NSH 走的是另一條路：採用各平台的檢視、文字與文字輸入，在網頁上則使用 HTML 元素，以及瀏覽器自身的捲動、選取與輸入。文字編輯、輸入法與選取皆由平台負責，而不是在每個平台上重新實作。
### Qt

Qt 是成熟的工具套件，提供 Qt Widgets 與 Qt Quick 兩種 UI 技術，並擁有長年累積的工具與平台支援。NSH 的差異在於基礎與模型：以 Rust 作為核心語言並提供 TSX 路徑，工具鏈為自動化（含 AI 驅動）開發而設計，在 Web 上以 HTML 渲染，並在同一套元件模型中適配行動、桌面與 Web 的互動。

<a id="gpui-and-gpui-fast"></a>

### GPUI 與 GPUI Fast

[GPUI](https://gpui-kit.com) 是以 GPU 繪製的 Rust UI 框架，專為高要求的桌面應用打造；[GPUI Fast](https://github.com/longbridge/gpui-fast) 是 Longbridge 的分支版本，具備保留式渲染（會重用未變更的 view、版面配置與文字量測結果）、捲動圖層與原生視窗合成。NSH 則建立在各平台自身的 view 之上，因此文字輸入、選取、輸入法與系統互動都是平台原生的，並且同時涵蓋手機與 Web；NSH 的 GPUI 後端可將 NSH 應用嵌入 GPUI 與 GPUI Kit 應用中（[GPUI](./gpui.md)）。

兩者適合不同的負載。在 [NSH 效能基準測試](https://github.com/longbridge/nsh-perf-bench)中（Linux、500 列報價表、NSH 使用其 GTK 4 後端），日常負載的成本相同：每秒 1,000 筆報價時，NSH Rust 使用 18% 的單一核心，GPUI Fast 為 20%。在持續且密集的更新下，GPUI Fast 領先：每秒 20,000 筆報價時，它使用 25% 的單一核心，而 NSH 為 73–78%；對 1,000 個方塊進行逐幀動畫時，GPUI Fast 的 CPU 成本約為 NSH 的三分之一。

### Slint

Slint 是宣告式 UI 工具套件，擁有自己的語言與輕量渲染器，適用於桌面與嵌入式裝置，可從 Rust、C++、JavaScript 或 Python 使用。兩者都重視原生等級的效能；NSH 的路線是採用各平台自身的 UI 與互動、在 Web 上使用 HTML、以 Rust 和 TSX 作為應用語言，並在六個平台上實現 AI 驅動的開發。

<a id="electron-and-tauri"></a>

### Electron 與 Tauri

Electron 內建 Chromium，Tauri 則使用系統的 web view：兩者都以 Web 內容建構桌面應用（Tauri 還能建構行動應用），並沿用瀏覽器的文字與輸入。NSH 則建構各平台自身的 view，只在 Web 平台本身才渲染 HTML。

<a id="ui-delivered-after-release"></a>

## 發布後才交付的 UI

如果應用想提供出貨時並未內建的 UI，例如由模型生成的回答、來自合作夥伴或其他團隊的功能、無需發版即可變更的畫面，在手機與桌面上都有幾種既有的做法。它們的差異在於由誰繪製 UI、交付的程式碼能做什麼，以及宿主應用需要改動多少才能承載它們。

| 能力 | NSH | Web view | Server-driven UI | 小程式 | OTA 更新 |
|---|---|---|---|---|---|
| 繪製者 | 平台 UI | 瀏覽器引擎 | 應用自身的 view | Web 引擎 + 中間層 | 框架渲染器 |
| 原生外觀與行為 | <span class="status status--yes" role="img" aria-label="Yes"></span> | <span class="status status--no" role="img" aria-label="No"></span> | <span class="status status--yes" role="img" aria-label="Yes"></span> | <span class="status status--partial" role="img" aria-label="Partial"></span> | <span class="status status--yes" role="img" aria-label="Yes"></span> |
| 自有狀態、邏輯與版面配置 | <span class="status status--yes" role="img" aria-label="Yes"></span> | <span class="status status--yes" role="img" aria-label="Yes"></span> | <span class="status status--no" role="img" aria-label="No"></span> | <span class="status status--yes" role="img" aria-label="Yes"></span> | <span class="status status--yes" role="img" aria-label="Yes"></span> |
| 宿主的原生元件 | <span class="status status--yes" role="img" aria-label="Yes"></span> | <span class="status status--partial" role="img" aria-label="Partial"></span> 透過橋接 | <span class="status status--yes" role="img" aria-label="Yes"></span> | <span class="status status--partial" role="img" aria-label="Partial"></span> | <span class="status status--yes" role="img" aria-label="Yes"></span> |
| 由宿主設定的沙箱 | <span class="status status--yes" role="img" aria-label="Yes"></span> | <span class="status status--partial" role="img" aria-label="Partial"></span> 同源 | <span class="status status--yes" role="img" aria-label="Yes"></span> Schema | <span class="status status--yes" role="img" aria-label="Yes"></span> | <span class="status status--no" role="img" aria-label="No"></span> |
| 已簽章、可撤銷的套件 | <span class="status status--yes" role="img" aria-label="Yes"></span> | <span class="status status--no" role="img" aria-label="No"></span> | <span class="status status--no" role="img" aria-label="No"></span> | <span class="status status--partial" role="img" aria-label="Partial"></span> | <span class="status status--partial" role="img" aria-label="Partial"></span> |
| 適合 AI 生成的 UI | <span class="status status--yes" role="img" aria-label="Yes"></span> | <span class="status status--partial" role="img" aria-label="Partial"></span> 網頁 | <span class="status status--partial" role="img" aria-label="Partial"></span> | <span class="status status--partial" role="img" aria-label="Partial"></span> | <span class="status status--no" role="img" aria-label="No"></span> |
| 對宿主應用的成本 | 一個 view 與一個函式庫 | 每個 view 一個瀏覽器引擎 | 每個元件一個渲染器 | 一個容器 SDK | 整個應用都要放進該框架 |

- **Web view（H5）。** 在瀏覽器引擎中顯示的頁面：HTML 能表達的內容都可以呈現，外觀沿用瀏覽器，並透過手寫的橋接連接原生程式碼。
- **Server-driven UI。** 以 JSON 重新組合應用已內建的元件與動作：容易生成，但除了 schema 提供的部分之外，沒有本地狀態或邏輯。
- **小程式容器。** 在 Web 引擎上運行、各平台專屬的框架與 API，並內含龐大的容器 SDK。
- **Over-the-air 更新**（例如搭配 code-push 服務的 React Native）。提供完整的框架，但更新的程式碼被視為受信任的應用程式碼，且應用必須以該框架撰寫。
- **NSH。** 一個 TSX 模組，擁有自己的狀態、邏輯、動畫與版面配置，以平台自身的 UI 渲染，並可使用宿主註冊的原生 view。它以應用可驗證的已簽章套件形式送達，在自己的 VM 中運行，並受記憶體、呼叫時間與節點數量的限制，只能存取宿主授權的網路主機、網頁與系統設定（[Sandbox and capabilities](./sandbox-and-capabilities.md)）。宿主只需在模組出現的位置加入一個 view（[Platforms](./platforms.md#embed-in-a-native-app)），同一個 bundle 即可在所有平台上運行。這正是 NSH 在 [GPUI Shell](./index.md#native-shell-and-gpui-shell) 之外仍有其存在價值的原因。

<a id="when-another-option-fits-better"></a>

## 其他選項更合適的情況

- 畫面以數千個 view 的持續、密集更新為主，例如每秒串流數萬筆報價的行情終端機，或每幀重繪的自訂視覺化：GPUI Fast 的保留式 GPU 渲染只需使用一小部分 CPU（參見 [GPUI 與 GPUI Fast](#gpui-and-gpui-fast)）。
- 應用必須在每個平台上呈現像素等級的一致：像 Flutter 或 Slint 這類自行繪製一切的框架，在設計上就能做到。
- 你現在就需要龐大的第三方套件生態系：React Native、Flutter 與 Qt 都已累積多年。
- UI 是一份文件或既有的網頁：web view 能原樣顯示。
- 畫面集合固定且很少，只有內容與順序會變動：server-driven UI 完全不需要執行環境。

<a id="see-also"></a>

## 另請參閱

- [Introduction](./index.md)：NSH 是什麼，以及「原生」在 NSH 中的含義。
- [Architecture](./architecture.md)：NSH 內部各部分在何處運行。
- [Performance](./performance.md)：NSH 遵循的規則，以及如何衡量應用的效能。
