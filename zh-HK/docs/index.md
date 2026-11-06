---
title: "簡介"
description: "Native Shell 是什麼:一個以 Rust 為先的原生 UI 框架,支援 iOS、Android、macOS、Windows、Linux 及 web,並保留各平台自身的 UI 與互動方式。"
order: 1
group: start
source_hash: cdf8a9726ec2ef7b
---


# 簡介

Native Shell（簡稱 NSH）是適用於所有平台的原生 UI 框架。你只需用同一個應用模型（組件、signals、樣式，以及各平台一致的 API）建構一次應用，NSH 就能在 **iOS、Android、macOS、Windows、Linux 和網頁**上執行它，而且每次都是以該平台自己的應用形式呈現：由平台本身的視圖組成，使用平台本身的文字系統編輯，操作方式也符合用戶的期望。你可以全部用 **Rust** 編寫應用，用 **TSX** 編寫畫面，或在同一個引擎上兩者並用。在同一個引擎之上，已發佈的應用還可以在運行時載入新的 UI（由你的團隊編寫或由模型生成），這些 UI 以簽署模組的形式交付，並在宿主配置的沙箱中運行。

> [!IMPORTANT]
> NSH 提供原生視圖和互動，應用本身掌握視覺設計。組件、狀態和 API 在各平台之間共用，而顏色、字體排印、間距和形狀則由應用決定。文字輸入、焦點和選單遵循各裝置的互動慣例。請參閱[目標與設計原則](./goals.md)。

<a id="what-native-means"></a>

## 「原生」的含義

NSH 所說的原生包含兩個層面：平台的基礎，以及平台的互動。

**平台的基礎。** 每個平台都有自己的後端，建基於該平台現有的 UI：

| 平台 | 視圖 | 文字 | 文字輸入 |
|---|---|---|---|
| iOS | UIKit | CoreText | 系統的文字欄位和文字視圖 |
| Android | Android views | `StaticLayout` | `EditText` |
| macOS | AppKit、Core Animation | CoreText | `NSTextField`、`NSTextView` |
| Windows | 以 Direct2D 繪製的 Win32 視窗 | DirectWrite | NSH 的編輯器，配合系統的輸入法（IMM32） |
| Linux | GTK 4 | Pango | GTK 的 `Text` 和 `TextView` |
| 網頁 | 以 CSS 設定樣式的 HTML 元素 | 瀏覽器的字型 | 瀏覽器的輸入控件 |

文字選取及其選單、輸入法、無障礙功能和捲動都由平台提供，新版作業系統為這些功能帶來的改進，也會隨之直接惠及應用。原生組件（地圖、網頁視圖、影片播放器，以及宿主註冊的任何視圖）只是同一視圖層級中的另一個視圖，與其他視圖一起排版、裁剪和捲動（[原生組件](./native-components.md)）。

**平台的互動。** NSH 在 [`nsh/base`](../modules/nsh-base.md) 中提供的組件，行為符合各裝置用戶的期望，因此應用只需編寫一次：

| | 桌面電腦（及桌面瀏覽器） | 手機和平板電腦 |
|---|---|---|
| `Menu` | 在觸發元素處彈出；子選單在對應項目旁邊逐級展開 | 從底部彈出的面板；子選單會取代其上層選單的項目 |
| `ContextMenu` | 在指標位置按右鍵開啟 | 手指按住觸發元素，以面板形式開啟 |
| `Tooltip` | 指標停留在觸發元素上時顯示 | 由應用開啟時顯示 |
| `Popover` | 在外部按下會將其關閉，而且該操作會傳到指標下方的元素 | 在外部按下會將其關閉 |

頁面、對話框、鍵盤和狀態列也遵循同樣的理念：導航堆疊以各平台自己的動態效果推入和彈出，而返回按鈕、Escape 鍵和滑動返回，也各自按該平台的方式運作（[導航](./navigation.md)）。

<a id="from-phone-to-desktop-to-web"></a>

## 從手機、桌面電腦到網頁

NSH 所說的跨平台，是指每款裝置都能得到用戶期望的應用，而不是把同一個畫面放大或縮小：

- **一個應用模型。** 應用的組件、狀態、業務邏輯和畫面全部共用，由各個後端對應到所屬平台。
- **可重塑的版面。** 在每個平台上，Flexbox 和 CSS grid 都由 [Taffy](https://github.com/DioxusLabs/taffy) 負責排版；Tailwind 的斷點（`md:`、`lg:`）和視窗大小（Rust 中的 `window()`）改變的是結構，而不僅是尺寸：聊天應用在寬視窗中並排顯示側邊欄、對話列表和訊息，在手機上則一次只顯示一個畫面（[版面配置](./layout.md)、[Tailwind](./tailwind.md)）。
- **各裝置期望的輸入方式。** 桌面電腦上有指標、懸停、右鍵、快捷鍵和焦點；手機上則有觸控、手勢、軟件鍵盤和頁面導航。如果應用想為各平台提供專屬的處理方式，可以透過 `desktop={{…}}` props 和 `platform.select` 來指明（[平台專屬程式碼](./platform-specific.md)）。
- **在每個目標平台上驗證。** `nsh test` 以無介面模式運行應用的測試，同樣的測試也可以在 macOS、Windows、Linux 和 GPUI 視窗、iOS 模擬器、Android 裝置或瀏覽器中運行，並使用該平台自己的輸入（[測試與追蹤](./testing-and-trace.md)）。

以聊天客戶端這類應用為例。開發者用 `nsh run` 在桌面電腦上建構，再用 `nsh run --target ios` 在 iOS 模擬器中開啟以檢查手機版面，然後用 `nsh run --target web` 在瀏覽器中開啟，每次都是同一個專案；最後由 `nsh package` 製作可安裝的應用和網站。過去每個平台都需要一個團隊才能完成的工作，現在一位工程師就能承擔，同時後端也一併開發。

<a id="rust-first"></a>

## Rust 優先

NSH 以 Rust 建構，而 Rust 是用它編寫應用時的一等語言：

- **整個應用都用 Rust。** UI、邏輯和組件都是 Rust，並在每個平台上編譯為原生程式碼，同時享有 Rust 的所有權、型別、執行緒和 crates.io 生態系統。運算以原生速度運行，大量資料、解析和系統層面的工作，也都留在最適合它們的語言中（[使用 Rust 建構](./rust.md)）。
- **TSX 是第二條途徑。** TSX 適合快速編寫畫面、外掛、小型應用，以及在運行時交付的 UI。它與 Rust 運行在同一個引擎上，使用相同的基礎元件、基礎組件和 signals。
- **兩者並用。** Rust 應用可以載入 TSX 畫面，而 TSX 畫面也可以匯入應用的 Rust 組件、模組和類別。
- **單一工具鏈。** 一個 `nsh` 可執行檔即可為所有目標平台建立、建構、型別檢查、以熱重載運行、測試、打包和簽署應用。它自帶 TSX 打包器和 TypeScript 檢查器，因此來自 Rust、Swift、Kotlin 或 C++ 的開發者，只需安裝 Rust 和 `nsh` 就可以開始工作（[安裝](./installation.md)、[CLI](./cli.md)）。

<a id="an-app"></a>

## 一個應用

同一個計數器，分別以 Rust 和 TSX 編寫：

```rust tabs
use nsh_core::prelude::*;

#[component]
pub fn Counter() -> impl IntoElement {
    let count = signal(0);
    view()
        .flex_1()
        .items_center()
        .justify_center()
        .gap_3()
        .child(text(move || count.get().to_string()).text_5xl().font_weight(FontWeight::BOLD))
        .child(
            view()
                .rounded_lg()
                .bg(rgb(0x2563eb))
                .px_5()
                .py_3()
                .active(|s| s.opacity(0.6))
                .on_press(move || count.update(|n| *n += 1))
                .child(text("Tap").text_lg().text_color(white())),
        )
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";

function Counter() {
  const count = signal(0);
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12 }}>
      <Text style={{ fontSize: 48, fontWeight: "700" }}>{count()}</Text>
      <View
        onPress={() => count.update((n) => n + 1)}
        activeStyle={{ opacity: 0.6 }}
        class="rounded-lg bg-blue-600 px-5 py-3"
      >
        <Text class="text-white text-lg">Tap</Text>
      </View>
    </View>
  );
}

mount(Counter);
```

視圖（`view()`、`<View>`）在 iOS 上會成為 `UIView`，在 Android 上成為 `ViewGroup`，在 macOS 上成為 `NSView`，在 Linux 上成為 GTK 小部件，在 Windows 上成為以 Direct2D 繪製的保留式視圖，在網頁上則成為 HTML 元素；文字會成為原生文字視圖，而按鈕的按壓回饋（`.active(..)`、`activeStyle`）在主執行緒上運行。當你點按時，`count.update` 會改變一個 signal，而只有讀取該 signal 的文字才會更新：組件函式不會重新執行。Rust 應用由始至終都是原生程式碼；在 TSX 應用中，只有模組自身的程式碼是 JavaScript。

<a id="retained-views"></a>

## 保留式視圖

NSH 採用保留式模式：每個元素都是平台保留的視圖，而更新只會改動有變化的部分。

- **細粒度更新。** [Signals](./reactivity.md) 與 Solid 的類似，但以原生方式實現：組件只執行一次，而當 signal 改變時，只有讀取該 signal 的表達式會重新執行。
- **只有變化的部分才會跨執行緒傳遞。** 同一個回合中的變更會一併排版，並以每幀一批視圖操作的方式交給主執行緒；沒有變化的樣式和框架不會被傳送，沒有被觸及的視圖則保持原樣。
- **動畫以原生方式運行。** Timing、spring 和 decay 動畫、手勢以及與捲動連動的數值，都在平台的幀時鐘上計算，無需每幀呼叫 JS（[動畫](./animation.md)）。

這很適合大多數應用所包含的畫面，例如聊天、郵件、表單、清單、文件、設定，以及逐步串流顯示的 AI 回覆：這類畫面每次只有少數視圖變化，其餘的則保持靜止。這些畫面在兩次更新之間幾乎處於閒置狀態，而捲動和動畫在 ProMotion 顯示器上能保持 120 FPS。在 [NSH 效能基準測試](https://github.com/longbridge/nsh-perf-bench)中，一個有 500 行的報價表以每秒 1,000 次的頻率更新，在 Linux 上以 NSH Rust 運行時佔用 18% 的單個核心，而直接以 [GPUI Fast](https://github.com/longbridge/gpui-fast) 編寫的同一畫面則佔用 20%。繁重的運算應交給 Rust：TSX 在 QuickJS（一個直譯器）中運行，而 Rust 模組即使由 TSX 呼叫，也以原生速度運行，因此排序 100,000 行大約需要 3 毫秒，與純 Rust 相同（[效能](./performance.md)）。

<a id="how-it-runs"></a>

## 運作方式

工具鏈是單一的 `nsh` 二進位檔。應用可以用 Rust、TSX 或兩者並用編寫，而每種方式都有各自通往同一個 Rust 引擎的路徑。

<a id="rust-apps"></a>

### Rust 應用

Rust 應用是一個 crate，完全以 Rust 和 Native 建構，不含 JavaScript 執行環境：

1. **建構。** `nsh` 為每個目標平台建構 runner（即 iOS、Android、macOS、Windows、Linux 或網頁應用），並將你的 crate 連結進去。組件、狀態、處理器和引擎會一併編譯為原生程式碼。
2. **執行。** 應用的根組件以 Rust 形式在引擎執行緒上運行。runner 沒有 JavaScript 引擎：在任何平台上，QuickJS 都不是 Rust 應用的一部分。

<a id="tsx-apps"></a>

### TSX 應用

TSX 應用（一個模組）是一組 `.tsx` / `.ts` 檔案，並有一個入口，通常是 `App.tsx`：

1. **建構。** `nsh` 會打包模組的檔案（使用 rolldown 和 Oxc），並以自己的編譯器編譯 JSX。對 `nsh` 和 `nsh/*` 的匯入會保持為匯入：由執行環境以原生方式提供，因此打包結果只包含你自己的程式碼。打包結果會被編譯為 QuickJS 位元組碼。
2. **執行。** 引擎執行緒在 [QuickJS](https://github.com/quickjs-ng/quickjs) 中運行位元組碼，每個視圖一個 VM。編譯後的 JSX 直接呼叫原生渲染器，而 JavaScript 只負責描述 UI 和處理事件；解析樣式、解析 Tailwind 類別、差異比對、排版和文字處理，全部在 Rust 中完成。

<a id="the-difference"></a>

### 兩者的差異

| | Rust 應用 | TSX 應用 |
|---|---|---|
| 編寫語言 | Rust | TSX（TypeScript 和 JSX） |
| 建構成 | 原生程式碼，連結到各目標平台的 runner 中 | QuickJS 位元組碼，由執行環境載入 |
| JavaScript 引擎 | 無 | QuickJS，每個視圖一個 VM |
| 開發期間（`nsh run`） | 每次儲存都會重新建構並重新啟動 | 每次儲存都會熱更新 |
| 發佈之後 | 隨應用一併發佈 | 也可以在運行時以簽署套件的形式交付，並在沙箱中運行 |
| 適合 | 整個應用、繁重運算、系統層面的工作 | 快速編寫的畫面、外掛、AI 生成的 UI |

兩者可以結合：Rust 應用可以載入 TSX 畫面，而 TSX 畫面可以匯入其 Rust 組件、模組和類別；這類應用會連結 QuickJS 來運行它們（[使用 Rust 建構](./rust.md)）。

<a id="the-shared-engine"></a>

### 共用的引擎

從引擎開始，兩條路徑便完全相同。變更按回合收集，以 Taffy（Flexbox 和 CSS grid）排版，並以每幀一批視圖操作的方式交給主執行緒；主執行緒再將這一批操作套用到原生視圖上。文字只在引擎執行緒上量度和排版一次（Apple 平台使用 CoreText，Android 使用 `StaticLayout`，Windows 使用 DirectWrite，Linux 使用 Pango，網頁則使用瀏覽器的字型度量），主執行緒只負責繪製。

在網頁上，同一個引擎在頁面中運行：瀏覽器顯示以 CSS 設定樣式的 HTML 元素，並負責捲動、選取其中的文字和處理輸入，而 `nsh package --target web` 會將應用發佈為靜態網站，其檔案以內容命名，可直接用於任何 CDN（[網頁](./web.md)）。

> [!NOTE]
> 主執行緒從不等待應用的程式碼。系統同步提出的問題（這個輸入是否可再接受一個字元、用戶是否可以滑動返回、這個面板是否可以關閉），會根據事先設定好的 props（例如 `maxLength`、`popOnBack` 或 `closeOnSwipe`）在原生層直接回答。事件隨後才會傳到應用的處理器。
<a id="dynamic-ui-and-ai-generated-ui"></a>

## 動態 UI 與 AI 生成的 UI

NSH 最初是為了讓原生應用程式在發佈後取得 UI，這至今仍是其主要用途之一。應用程式在模組應出現的位置嵌入 `NshAppView`（iOS）、`NshView`（Android）、`AppView`（macOS、Windows、Linux 及 GPUI 應用程式）或 `createPlayer`（網頁），NSH 便在其中執行 TSX 模組：

- **發佈後交付。** 模組是應用程式在執行時下載的已簽署套件（`.nshpkg`）。應用程式在執行前，會根據所信任的金鑰及撤銷清單驗證其簽署（[已簽署套件](./signed-packages.md)）。宿主應用程式提供執行環境，各團隊針對其 API 開發模組，並按自己的時程交付。
- **宿主保持控制權。** 每個模組都在自己的 QuickJS VM 中執行，受記憶體、呼叫時間及節點數量限制，只能存取宿主授予的資源：網絡主機、網頁、狀態列（[沙盒與權限](./sandbox-and-capabilities.md)）。多個模組可並排執行。
- **外觀與應用程式其餘部分一致。** 模組以平台自身的 UI 渲染，宿主亦可註冊自己的原生檢視（例如地圖、播放器、設計系統元件）供模組使用（[原生元件](./native-components.md)）。

同一機制也讓應用程式可以**以介面作出回應**。模型撰寫一個小型 TSX 模組（例如表單、圖表、預訂卡片），由你的伺服器檢查、建置並簽署，然後應用程式以原生方式顯示：

<div class="diagram-scroll">
<img class="diagram diagram-light" src="/diagrams/ai-flow-light.svg" alt="From a prompt to native UI: a model writes a TSX module; your server builds, checks and signs it; across the trust boundary, the app verifies the package, runs it in a sandbox with the limits and capabilities it set, and shows it with the platform's own UI.">
<img class="diagram diagram-dark" src="/diagrams/ai-flow-dark.svg" alt="From a prompt to native UI: a model writes a TSX module; your server builds, checks and signs it; across the trust boundary, the app verifies the package, runs it in a sandbox with the limits and capabilities it set, and shows it with the platform's own UI.">
</div>

在 iOS 上，宿主需要做的只有幾行程式碼：

```swift
let app = NshAppView()                         // a UIView: place it anywhere
try app.grantCapabilities(#"{ "network": { "hosts": ["api.example.com"] } }"#)
let info = try await app.loadPackage(at: downloadedFile, trust: trust)   // verified, then run
```

<a id="ai-friendly"></a>

## 對 AI 友好

NSH 專為借助 AI 編寫的軟件而設計，無論是整個應用程式還是生成的畫面：

- **所有平台共用一個應用程式模型。** 模型只需學會一種撰寫 UI 的方式，結果即可在手機、桌面及網頁上執行；NSH 會按平台調整互動方式，因此無需為六個平台各生成一次。
- **按任務選用 Rust 或 TSX。** Rust 用於完整應用程式及對效能要求高的模組，TSX 用於畫面、外掛程式及按請求生成的 UI，兩者共用同一個引擎。
- **精確且自動生成的規範。** 每個元素、prop、樣式鍵及模組都有由 Rust 原始碼生成的 TypeScript 宣告（`.nsh/types`），而 Rust API 亦有型別，因此生成的程式碼可由編譯器檢查。這些文件亦以純文字形式提供給模型使用（[`llms.txt`](/llms.txt)、[`llms-full.txt`](/llms-full.txt)）。
- **以一套命令列完成整個流程。** 代理程式可以建立應用程式、建置、在目標平台上執行、運行測試、讀取結果、修正並打包，全部透過 `nsh` 完成。`nsh test` 以無頭模式執行，無需裝置，並會回報錯誤及產生的檢視；編譯器亦可在行程內執行（`nsh_bundler::compile_module`）及在瀏覽器中執行（[Playground](/playground)）。
- **即使不受信任也能安全執行。** 執行時交付的生成程式碼屬於不受信任的程式碼：它以簽署形式送達，在有限制的 VM 中執行，並且只能存取宿主授予的權限。

<a id="where-it-runs"></a>

## 可在哪裡執行

| 平台 | 需求 | 後端 | 嵌入方式 |
|---|---|---|---|
| [iOS](./ios.md) | iOS 15.0+ | UIKit | `NativeShell.xcframework` |
| [Android](./android.md) | Android 9+ | Android views | `nsh.aar` |
| [macOS](./macos.md) | macOS 14+ | AppKit | `AppView` |
| [Windows](./windows.md) | Windows 10 1809+ | Win32, Direct2D | `AppView` |
| [Linux](./linux.md) | GTK 4.14+ | GTK 4 | `AppView` |
| [Web](./web.md) | 現代瀏覽器 | HTML | `createPlayer`、iframe |
| [GPUI](./gpui.md) | 桌面電腦 | GPUI | `AppView`（GPUI、GPUI Kit 應用程式） |
| Mac Catalyst | macOS | UIKit | 用於開發（`--target catalyst`） |

<div class="diagram-scroll">
<img class="diagram diagram-light" src="/diagrams/platforms-light.svg" alt="One module, many hosts: the same bundle and Rust runtime on iOS, Android, Linux, macOS with AppKit and Windows with Win32 / Direct2D, GPUI on all three desktops, and web pages drawn with HTML.">
<img class="diagram diagram-dark" src="/diagrams/platforms-dark.svg" alt="One module, many hosts: the same bundle and Rust runtime on iOS, Android, Linux, macOS with AppKit and Windows with Win32 / Direct2D, GPUI on all three desktops, and web pages drawn with HTML.">
</div>

<a id="native-shell-and-gpui-shell"></a>

## Native Shell 與 GPUI Shell

[Longbridge](https://longbridge.com) 為自家客戶端開發 NSH。最初的需求是為手機客戶端提供外掛層，而 [GPUI Shell](https://gpui-kit.com/shell)（讓 [GPUI](https://gpui-kit.com) 桌面應用程式可用 JavaScript 擴充）是起點。在手機上，若由 GPUI 自行繪製 UI，就必須重新實現平台原本已有的功能，例如文字選取及其選單（拷貝、分享、翻譯、查詢）、輸入法、無障礙功能，以及每個 iOS 版本帶來的視覺材質，而且每個手機團隊都要接手一套新的 UI 技術棧。因此 NSH 以各平台自身的 UI 渲染，並由該外掛層發展為可在所有平台上構建完整應用程式的框架。

兩者的定位不同。GPUI Shell 擴充 GPUI 桌面應用程式；Native Shell 則是適用於手機、桌面及網頁原生應用程式的框架，其 GPUI 後端可將 NSH 應用程式嵌入 GPUI 及 GPUI Kit 應用程式（[GPUI](./gpui.md)）。

<a id="how-it-compares"></a>

## 與其他方案比較

就完整應用程式而言，NSH 屬於 React Native、Flutter、Qt、GPUI、Slint、Electron 及 Tauri 等跨平台框架之列；就發佈後交付的 UI 而言，則屬於 web view、伺服器驅動 UI 及小程式容器之列。它的取向是在同一個應用程式模型下，使用各平台自身的 UI 與互動，以 Rust 作為應用程式語言，並以 TSX 輔助。[方案比較](./comparison.md)會逐一說明。

<a id="next-steps"></a>

## 下一步

- [安裝](./installation.md)與[入門](./getting-started.md)：取得 `nsh`，以 Rust 或 TSX 編寫第一個應用程式，並在各平台上執行。
- [使用 Rust 構建](./rust.md)：以 Rust 編寫的應用程式，以及疊加其上的 TSX。
- [平台](./platforms.md)：各平台支援的內容，以及如何在各平台上執行、打包和嵌入。
- [JSX 與元件](./jsx-and-components.md)和[響應式](./reactivity.md)：其餘一切所依據的兩個概念，涵蓋 Rust 與 TSX。
- [已簽署套件](./signed-packages.md)與[沙盒與權限](./sandbox-and-capabilities.md)：交付模組並決定它們可以做什麼。
