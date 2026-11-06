---
title: "簡介"
description: "Native Shell 是什麼:一個以 Rust 為優先的原生 UI 框架,支援 iOS、Android、macOS、Windows、Linux 與 Web,並保有各平台自身的 UI 與互動方式。"
order: 1
group: start
---

# 簡介

Native Shell（簡稱 NSH）是適用於所有平台的原生 UI 框架。你只需用同一套應用模型建構一次 app：元件、signals、樣式與 API 在各平台上都一致。NSH 會讓它在 **iOS、Android、macOS、Windows、Linux 與 Web** 上執行，而且每次都是該平台的原生 app：由平台自己的 view 組成，使用平台自己的文字系統編輯，操作方式符合使用者的預期。你可以用 **Rust** 撰寫整個 app，用 **TSX** 撰寫畫面，也可以在同一個引擎上兩者並用。在同一個引擎之上，已發佈的 app 還能在執行階段接收新的 UI，不論是由你的團隊撰寫，還是由模型產生，這些 UI 以簽章模組的形式，在由宿主設定的沙箱中執行。

> [!IMPORTANT]
> NSH 提供原生的 view 與互動；視覺設計由 app 自行決定。元件、狀態與 API 在各平台間共用，而顏色、字型、間距與形狀則由 app 提供。文字輸入、焦點與選單遵循各裝置的互動慣例。請參閱[目標與設計原則](./goals.md)。

<a id="what-native-means"></a>

## 原生的意義

NSH 所說的原生有兩個層面：平台的基礎，以及平台的互動。

**平台的基礎。** 每個平台都有自己的後端，建構在該平台既有的 UI 之上：

| 平台 | View | 文字 | 文字輸入 |
|---|---|---|---|
| iOS | UIKit | CoreText | 系統的文字欄位與文字視圖 |
| Android | Android views | `StaticLayout` | `EditText` |
| macOS | AppKit、Core Animation | CoreText | `NSTextField`、`NSTextView` |
| Windows | 以 Direct2D 繪製的 Win32 視窗 | DirectWrite | NSH 的編輯器，搭配系統的輸入法（IMM32） |
| Linux | GTK 4 | Pango | GTK 的 `Text` 與 `TextView` |
| Web | 以 CSS 設定樣式的 HTML 元素 | 瀏覽器的字型 | 瀏覽器的輸入元件 |

文字選取與其選單、輸入法、無障礙功能與捲動都來自平台，新版作業系統為這些功能帶來的改進，也會隨之直接進入 app。原生元件，例如地圖、web view、影片播放器，以及宿主註冊的任何 view，都只是同一個階層中的另一個 view，與其他 view 一起進行版面配置、裁切與捲動（[原生元件](./native-components.md)）。

**平台的互動。** NSH 在 [`nsh/base`](../modules/nsh-base.md) 中提供的元件，行為都符合各裝置使用者的預期，因此 app 只需撰寫一次：

| | 桌面平台（含桌面瀏覽器） | 手機與平板 |
|---|---|---|
| `Menu` | 在觸發元件處彈出；子選單在其項目旁層層展開 | 從底部滑出的面板；子選單會取代原選單的項目 |
| `ContextMenu` | 在指標處按一下右鍵開啟 | 手指按住觸發元件，以面板形式開啟 |
| `Tooltip` | 指標停留在觸發元件上時顯示 | 由 app 開啟時顯示 |
| `Popover` | 在外部按下即關閉，且該操作會傳到指標下方的元素 | 在外部按下即關閉 |

頁面、對話框、鍵盤與狀態列也遵循同樣的理念：導覽堆疊以各平台自己的動態效果推入與彈出，返回按鈕、Escape 與滑動返回在各平台上也都做該平台慣常的事（[導覽](./navigation.md)）。

<a id="from-phone-to-desktop-to-web"></a>

## 從手機到桌面再到 Web

NSH 所說的跨平台，是指每種裝置都得到它所預期的 app，而不是把同一個畫面放大或縮小：

- **一套應用模型。** app 的元件、狀態、商業邏輯與畫面都是共用的；各後端再將它們對應到自己的平台。
- **會重新塑形的版面。** Flexbox 與 CSS grid 在每個平台上都由 [Taffy](https://github.com/DioxusLabs/taffy) 進行版面配置，而 Tailwind 的斷點（`md:`、`lg:`）與視窗大小（Rust 中的 `window()`）改變的是結構，而不只是尺寸：聊天 app 在寬視窗中並排顯示側邊欄、對話與訊息，在手機上則一次只顯示一個畫面（[版面配置](./layout.md)、[Tailwind](./tailwind.md)）。
- **各裝置預期的輸入方式。** 桌面上有指標、hover、右鍵、快捷鍵與焦點；手機上有觸控、手勢、軟體鍵盤與頁面導覽。如果 app 想為各平台做不同的處理，可以使用 `desktop={{…}}` props 與 `platform.select`（[平台專屬程式碼](./platform-specific.md)）。
- **在每個目標平台上驗證。** `nsh test` 會以 headless 方式執行 app 的測試，也能在 macOS、Windows、Linux 與 GPUI 視窗、iOS 模擬器、Android 裝置或瀏覽器中執行相同的測試，並使用該平台自己的輸入（[測試與追蹤](./testing-and-trace.md)）。

以聊天客戶端這類 app 為例。開發者先用 `nsh run` 在桌面上建構，再用 `nsh run --target ios` 在 iOS 模擬器中開啟以檢查手機版面，接著用 `nsh run --target web` 在瀏覽器中開啟，每次都是同一個專案，最後由 `nsh package` 產生可安裝的 app 與網站。過去每個平台都需要一個團隊才能完成的工作，現在一位工程師就能承擔，同時後端也一併建構。

<a id="rust-first"></a>

## Rust 優先

NSH 以 Rust 建構，而 Rust 是用它撰寫 app 的一等語言：

- **整個 app 都用 Rust。** UI、邏輯與元件都是 Rust，在每個平台上編譯為原生程式碼，並享有 Rust 的所有權、型別、執行緒與 crates.io 生態系。運算以原生速度執行，大量資料、解析與系統層級的工作，則留在最適合它們的語言中（[以 Rust 建構](./rust.md)）。
- **TSX 是第二條路徑。** TSX 適合快速撰寫畫面、外掛、小型 app 與在執行階段交付的 UI。它與 Rust 執行在同一個引擎上，使用相同的基礎元件、內建元件與 signals。
- **兩者並用。** Rust app 可以接收 TSX 畫面，而 TSX 畫面可以匯入 app 的 Rust 元件、模組與類別。
- **單一工具鏈。** 單一的 `nsh` 可執行檔即可針對所有目標平台建立、建構、型別檢查、以熱重載執行、測試、封裝與簽署 app。它內建自己的 TSX 打包器與 TypeScript 檢查器，因此來自 Rust、Swift、Kotlin 或 C++ 的開發者，只需安裝 Rust 與 `nsh` 就能開始工作（[安裝](./installation.md)、[CLI](./cli.md)）。

<a id="an-app"></a>

## 一個 app

同一個計數器，分別以 Rust 與 TSX 撰寫：

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

一個 view（`view()`、`<View>`）在 iOS 上會成為 `UIView`，在 Android 上成為 `ViewGroup`，在 macOS 上成為 `NSView`，在 Linux 上成為 GTK widget，在 Windows 上成為以 Direct2D 繪製的 retained view，在 Web 上則成為 HTML 元素；文字會成為原生的文字 view，而按鈕的按壓回饋（`.active(..)`、`activeStyle`）在主執行緒上執行。當你點按時，`count.update` 會改變一個 signal，只有讀取該 signal 的文字會被更新：元件函式不會重新執行。Rust app 從頭到尾都是原生程式碼；在 TSX app 中，只有模組本身的程式碼是 JavaScript。

<a id="retained-views"></a>

## Retained view

NSH 採用 retained 模式：每個元素都是平台所保存的 view，更新時只會改變有變動的部分。

- **細粒度更新。** [Signals](./reactivity.md) 與 Solid 的類似，但以原生方式實作：元件只執行一次，變動時只會重新執行讀取了該 signal 的運算式。
- **只有變動的內容會跨執行緒傳遞。** 單一回合中的變動會一起進行版面配置，並以每個影格一批 view 操作的方式交給主執行緒；未變動的樣式與影格不會傳送，沒有被動到的 view 則維持原狀。
- **動畫以原生方式執行。** timing、spring 與 decay 動畫、手勢，以及與捲動連動的值，都在平台的影格時脈上計算，不需要每個影格都呼叫 JS（[動畫](./animation.md)）。

這很適合大多數 app 所組成的畫面，例如聊天、郵件、表單、清單、文件、設定，以及逐步串流顯示的 AI 回覆，這些畫面一次只有少數 view 會變動，其餘的則維持靜止。這類畫面在兩次更新之間幾乎處於閒置狀態，捲動與動畫在 ProMotion 顯示器上可維持 120 FPS。在 [NSH 效能基準測試](https://github.com/longbridge/nsh-perf-bench)中，一個 500 列的報價表每秒更新 1,000 次，在 Linux 上使用 NSH Rust 時佔用一個核心的 18%，而直接以 [GPUI Fast](https://github.com/longbridge/gpui-fast) 撰寫的相同畫面則佔用 20%。繁重的運算應交給 Rust：TSX 在 QuickJS 這個直譯器中執行，而 Rust 模組即使由 TSX 呼叫，也以原生速度執行，排序 100,000 列資料約需 3 毫秒，與純 Rust 相同（[效能](./performance.md)）。

<a id="how-it-runs"></a>

## 運作方式

工具鏈是單一的 `nsh` 二進位檔。app 以 Rust、TSX 或兩者並用撰寫，各自經由自己的路徑到達同一個 Rust 引擎。

<a id="rust-apps"></a>

### Rust app

Rust app 是一個 crate，完全以 Rust 與 Native 建構，沒有 JavaScript 執行環境：

1. **建構。** `nsh` 會建構每個目標平台的 runner，也就是 iOS、Android、macOS、Windows、Linux 或 Web 的 app，並連結你的 crate。元件、狀態、處理常式與引擎會一起編譯成原生程式碼。
2. **執行。** app 的根元件以 Rust 的形式在引擎執行緒上執行。runner 中沒有 JavaScript 引擎：在任何平台上，QuickJS 都不是 Rust app 的一部分。

<a id="tsx-apps"></a>

### TSX app

TSX app（模組）是一組 `.tsx` / `.ts` 檔案，並有一個進入點，通常是 `App.tsx`：

1. **建構。** `nsh` 會打包模組的檔案（使用 rolldown 與 Oxc），並以自己的編譯器編譯 JSX。對 `nsh` 與 `nsh/*` 的匯入仍然保持為匯入：由執行階段以原生方式提供，因此打包結果只包含你自己的程式碼。打包結果會被編譯為 QuickJS bytecode。
2. **執行。** 引擎執行緒在 [QuickJS](https://github.com/quickjs-ng/quickjs) 中執行 bytecode，每個 view 一個 VM。編譯後的 JSX 直接呼叫原生 renderer，JavaScript 只負責描述 UI 與處理事件；樣式解析、Tailwind class 解析、diff、版面配置與文字處理，全都在 Rust 中進行。

<a id="the-difference"></a>

### 差異

| | Rust app | TSX app |
|---|---|---|
| 撰寫語言 | Rust | TSX（TypeScript 與 JSX） |
| 建構成 | 原生程式碼，連結到各目標平台的 runner | QuickJS bytecode，由執行階段載入 |
| JavaScript 引擎 | 無 | QuickJS，每個 view 一個 VM |
| 開發期間（`nsh run`） | 每次儲存都會重新建構並重新啟動 | 每次儲存都會熱更新 |
| 發佈之後 | 隨 app 一同發佈 | 也可在執行階段以簽章套件交付，並在沙箱中執行 |
| 適合 | 完整的 app、繁重的運算、系統層級的工作 | 快速撰寫的畫面、外掛、AI 產生的 UI |

兩者可以結合：Rust app 可以接收 TSX 畫面，而 TSX 畫面可以匯入它的 Rust 元件、模組與類別；這樣的 app 會連結 QuickJS 來執行它們（[以 Rust 建構](./rust.md)）。

<a id="the-shared-engine"></a>

### 共用的引擎

從引擎開始，兩條路徑就完全相同。變動會依回合收集，以 Taffy（flexbox 與 CSS grid）進行版面配置，並以每個影格一批 view 操作的方式交給主執行緒；主執行緒再將這一批操作套用到原生 view 上。文字只在引擎執行緒上量測與排版一次（Apple 平台使用 CoreText，Android 使用 `StaticLayout`，Windows 使用 DirectWrite，Linux 使用 Pango，Web 使用瀏覽器的字型度量），並僅在主執行緒上繪製。

在 Web 上，同一個引擎在頁面中執行：瀏覽器顯示以 CSS 設定樣式的 HTML 元素，負責捲動、選取其文字並處理輸入，而 `nsh package --target web` 會將 app 發佈為靜態網站，檔案以內容命名，可直接用於任何 CDN（[Web](./web.md)）。

> [!NOTE]
> 主執行緒從不等待 app 的程式碼。系統同步提出的問題（這個輸入是否能再接受一個字元、使用者是否可以滑動返回、這個面板是否可以關閉），會由原生端根據事先設定的 props 直接回答，例如 `maxLength`、`popOnBack` 或 `closeOnSwipe`。事件隨後才會傳到 app 的處理常式。
<a id="dynamic-ui-and-ai-generated-ui"></a>

## 動態 UI 與 AI 生成 UI

NSH 最初的用途，是讓原生應用在發佈之後還能取得新的 UI，這至今仍是它的主要用途之一。應用程式在需要顯示模組的位置嵌入 `NshAppView`（iOS）、`NshView`（Android）、`AppView`（macOS、Windows、Linux 與 GPUI 應用程式）或 `createPlayer`（網頁），NSH 便會在其中執行 TSX 模組：

- **發佈後再交付。** 模組是一個已簽署的套件（`.nshpkg`），由應用程式在執行時下載。應用程式會先依據自己信任的金鑰與撤銷清單驗證其簽章，才會執行它（[Signed packages](./signed-packages.md)）。宿主應用程式內建執行環境；各團隊針對其 API 開發模組，並按自己的節奏交付。
- **宿主保有控制權。** 每個模組都在各自的 QuickJS VM 中執行，並受到記憶體、呼叫時間與節點數量的限制，只能存取宿主授予的資源：網路主機、網頁、狀態列（[Sandbox and capabilities](./sandbox-and-capabilities.md)）。多個模組可以並行執行。
- **外觀與應用程式其餘部分一致。** 模組使用平台原生的 UI 進行渲染，宿主也可以註冊自己的原生檢視——例如地圖、播放器、設計系統元件——供模組使用（[Native components](./native-components.md)）。

同一套機制也讓應用程式能**以介面作為回應**。模型撰寫一個小型 TSX 模組（表單、圖表、訂位卡片），由你的伺服器檢查、建置並簽署，應用程式再以原生方式呈現：

<div class="diagram-scroll">
<img class="diagram diagram-light" src="/diagrams/ai-flow-light.svg" alt="From a prompt to native UI: a model writes a TSX module; your server builds, checks and signs it; across the trust boundary, the app verifies the package, runs it in a sandbox with the limits and capabilities it set, and shows it with the platform's own UI.">
<img class="diagram diagram-dark" src="/diagrams/ai-flow-dark.svg" alt="From a prompt to native UI: a model writes a TSX module; your server builds, checks and signs it; across the trust boundary, the app verifies the package, runs it in a sandbox with the limits and capabilities it set, and shows it with the platform's own UI.">
</div>

在 iOS 上，宿主端只需要幾行程式碼：

```swift
let app = NshAppView()                         // a UIView: place it anywhere
try app.grantCapabilities(#"{ "network": { "hosts": ["api.example.com"] } }"#)
let info = try await app.loadPackage(at: downloadedFile, trust: trust)   // verified, then run
```

<a id="ai-friendly"></a>

## 對 AI 友善

NSH 的設計目標，是讓以 AI 撰寫的軟體都能順利運作，無論是整個應用程式，還是生成的單一畫面：

- **所有平台共用一套應用程式模型。** 模型只需學會一種撰寫 UI 的方式，產出的結果就能在手機、桌面與網頁上執行；NSH 會依平台調整互動方式，因此不必為每個平台各生成一次。
- **依任務選擇 Rust 或 TSX。** 完整應用程式與效能關鍵的模組使用 Rust，畫面、外掛與依每次請求生成的 UI 使用 TSX，兩者共用同一個引擎。
- **精確且自動生成的契約。** 每個元素、prop、樣式鍵與模組都有由 Rust 原始碼生成的 TypeScript 宣告（`.nsh/types`），Rust API 也具備型別，因此生成的程式碼可由編譯器檢查。這些文件也以純文字形式提供給模型使用（[`llms.txt`](/llms.txt)、[`llms-full.txt`](/llms-full.txt)）。
- **一個命令列涵蓋整個流程。** Agent 可以建立應用程式、建置、在目標裝置上執行、執行測試、讀取結果、修正並打包，全都透過 `nsh` 完成。`nsh test` 以無頭模式執行，不需要裝置，並會回報錯誤與產生的檢視；編譯器也可以在行程內執行（`nsh_bundler::compile_module`），或在瀏覽器中執行（[Playground](/playground)）。
- **即使不受信任，也能安全執行。** 在執行時交付的生成程式碼屬於不受信任的程式碼：它以簽署過的形式送達，在有限制的 VM 中執行，並且只能存取宿主授予的功能。

<a id="where-it-runs"></a>

## 支援的平台

| 平台 | 需求 | 後端 | 嵌入方式 |
|---|---|---|---|
| [iOS](./ios.md) | iOS 15.0+ | UIKit | `NativeShell.xcframework` |
| [Android](./android.md) | Android 9+ | Android views | `nsh.aar` |
| [macOS](./macos.md) | macOS 14+ | AppKit | `AppView` |
| [Windows](./windows.md) | Windows 10 1809+ | Win32, Direct2D | `AppView` |
| [Linux](./linux.md) | GTK 4.14+ | GTK 4 | `AppView` |
| [Web](./web.md) | 現代瀏覽器 | HTML | `createPlayer`、iframe |
| [GPUI](./gpui.md) | 桌面平台 | GPUI | `AppView`（GPUI、GPUI Kit 應用程式） |
| Mac Catalyst | macOS | UIKit | 供開發使用（`--target catalyst`） |

<div class="diagram-scroll">
<img class="diagram diagram-light" src="/diagrams/platforms-light.svg" alt="One module, many hosts: the same bundle and Rust runtime on iOS, Android, Linux, macOS with AppKit and Windows with Win32 / Direct2D, GPUI on all three desktops, and web pages drawn with HTML.">
<img class="diagram diagram-dark" src="/diagrams/platforms-dark.svg" alt="One module, many hosts: the same bundle and Rust runtime on iOS, Android, Linux, macOS with AppKit and Windows with Win32 / Direct2D, GPUI on all three desktops, and web pages drawn with HTML.">
</div>

<a id="native-shell-and-gpui-shell"></a>

## Native Shell 與 GPUI Shell

[Longbridge](https://longbridge.com) 為自家的客戶端開發了 NSH。最初的需求是為行動客戶端提供一層外掛機制，而讓 [GPUI](https://gpui-kit.com) 桌面應用程式可以用 JavaScript 擴充的 [GPUI Shell](https://gpui-kit.com/shell)，就是起點。在手機上，如果由 GPUI 自行繪製 UI，就得重新實作平台原本已經提供的功能——文字選取及其選單（拷貝、分享、翻譯、查詢）、輸入法、無障礙功能，以及每個 iOS 版本帶來的視覺材質——而且每個行動團隊都得接手一套新的 UI 技術堆疊。因此 NSH 改為使用各平台自己的 UI 進行渲染，並從這個外掛層逐步發展成適用於所有平台、可建構完整應用程式的框架。

兩者的定位不同。GPUI Shell 用於擴充 GPUI 桌面應用程式；Native Shell 則是適用於手機、桌面與網頁原生應用程式的框架，其 GPUI 後端可將 NSH 應用程式嵌入 GPUI 與 GPUI Kit 應用程式（[GPUI](./gpui.md)）。

<a id="how-it-compares"></a>

## 與其他方案比較

若是建構完整應用程式，NSH 的定位介於 React Native、Flutter、Qt、GPUI、Slint、Electron 與 Tauri 等跨平台框架之間；若是發佈後再交付 UI，則介於 web view、伺服器驅動 UI 與小程式容器之間。它的取捨是：在同一套應用程式模型下，使用各平台自己的 UI 與互動，以 Rust 作為應用程式語言，並搭配 TSX。[Comparing approaches](./comparison.md) 會逐一說明各方案。

<a id="next-steps"></a>

## 下一步

- [Installation](./installation.md) 與 [Getting started](./getting-started.md)：取得 `nsh`，以 Rust 或 TSX 撰寫第一個應用程式，並在各平台上執行。
- [Building with Rust](./rust.md)：以 Rust 撰寫的應用程式，以及疊加其上的 TSX。
- [Platforms](./platforms.md)：各平台上能執行什麼，以及如何在各平台上執行、打包與嵌入。
- [JSX and components](./jsx-and-components.md) 與 [Reactivity](./reactivity.md)：其他一切所依賴的兩個核心概念，同時適用於 Rust 與 TSX。
- [Signed packages](./signed-packages.md) 與 [Sandbox and capabilities](./sandbox-and-capabilities.md)：交付模組，並決定模組可以做什麼。
