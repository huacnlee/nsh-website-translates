---
title: "效能報告"
description: "NSH 應用程式的實測數據:來自 NSH 基準測試的 commit 與影格(frame)成本,以及圖庫(gallery)在 Linux、macOS、Windows 和 iOS 上逐頁量測的影格率、CPU 與記憶體使用量,並說明如何重現這些數據。"
order: 62.5
group: tools
source_hash: 8924d78b30d23299
---

# 效能報告

NSH 應用程式的實測成本。NSH 如何維持高效能，以及如何量測你自己的應用程式，請參閱[效能](./performance.md)。

<a id="baselines"></a>

## 基準數據

以下取自 NSH 自身的基準測試（除非另有註明，皆為 Apple silicon）：

| 情境 | 數據 |
|---|---|
| 計數器應用程式，headless（debug） | 首幀約 0.5–0.65 ms（58 個 ops／49 個 mount items）；一次點按約 0.15 ms |
| 計數器應用程式，Mac Catalyst（release） | 首幀約 1.05–1.15 ms（其中約 0.7 ms 用於首次以 CoreText 排版 10 段文字）；一次點按約 0.12 ms |
| Gallery 照片清單，headless（debug） | 首幀 653 個 ops／224 個節點，約 2.7 ms |
| 捲動照片清單，Catalyst（release） | 緩慢捲動時重新繫結一列約 0.4 ms；快速甩動時整個畫面約 32 列為 0.9–1.6 ms |
| 捲動照片清單，Android 模擬器（arm64、release） | 重新繫結一列約 0.3–0.4 ms（JS 約 60 µs） |
| 引擎啟動（release） | 約 75–155 µs；全域 API（`fetch`、`URL` 等）在首次使用前不產生任何成本，首次使用後約 90 µs |
| Hot reload | 從儲存檔案到新版本開始執行約 120 ms；套用更新 0.2–0.5 ms |

<a id="linux-gtk-4"></a>

## Linux（GTK 4）

在 Linux 桌面（x86_64、24 執行緒、NVIDIA GPU）上以 release 版本量測，Gallery 位於 120 Hz 顯示器上 1896 × 1030 的視窗中，所有讀數皆由 `examples/gallery/tools/perf.py`（`nsh test --target linux --fps`，每秒一行；CPU 為整個行程的用量，以單一核心的百分比表示）自動取得。*Frame p95* 是主執行緒每個已繪製影格所花時間的第 95 百分位數：低於 8.3 ms 時，影格即可趕上 120 Hz 的更新週期。

<a id="animated-demos"></a>

### 動畫範例

<div class="data-table">

| 範例 | FPS | Frame p95 | CPU |
|---|---|---|---|
| Stocks：22 條即時 sparkline、一張日內走勢圖、委託簿、成交明細 | 117–120 | 5–6 ms | 25–29%（1200 × 800）、28–32%（1896 × 1030） |
| Stocks，視窗以 1.6× 縮放填滿 4K 144 Hz 顯示器 | 143–145 | 4.1–4.4 ms | 26–29% |
| Canvas：一個儀表、一個時鐘、一個點陣 | 120 | 2.6–4.4 ms | 5–10% |
| Animations：三個原生迴圈、彈簧、序列動畫 | 120 | 2.0 ms | 12–13% |

</div>

<a id="every-page"></a>

### 每個頁面

Gallery 的每個頁面，在開啟時以及測試捲動它時的表現，視窗為 1200 × 800，顯示器為 144 Hz（同一台機器）。NSH 只在畫面上有內容變動時才繪製影格，因此這裡的 *FPS* 是有內容在移動時的速率：即已繪製影格之間間隔中位數所對應的每秒影格數（`perf.py` 的 `moving`）；在顯示器的 144 Hz 下，動畫或捲動的每個影格都在前一個影格之後一個更新週期出現。*Over one refresh* 是耗時超過一個更新週期（6.9 ms）的影格所占比例。Images 的 GIF 與 WebP 以其自身的影格率播放（此處約 50 FPS），影片亦同。Physics、Overlays 與 Menus 的內容較短：在 1200 × 800 的視窗中，捲動幾個影格就會到底，因此改以 900 × 500 的視窗量測，讓它們有足夠的捲動空間。

<div class="data-table">

| 頁面 | 影格來源 | FPS | Frame p95 | Over one refresh | CPU |
|---|---|---|---|---|---|
| Stocks | 即時資料、原生迴圈 | 144 | 4.1 ms | 0% | 26% |
| Stocks，捲動 | 即時資料、捲動 | 144 | 4.1 ms | 0% | 25% |
| Photos，捲動 | 捲動 | 144 | 2.8 ms | 2% | 9% |
| Lists，捲動 | 捲動 | 143 | 1.7 ms | 0% | 7% |
| Scrolling，捲動 | 捲動 | 144 | 1.6 ms | 1% | 4% |
| Navigation，捲動 | 捲動 | 143 | 1.7 ms | 0% | 2% |
| Form，捲動 | 捲動 | 144 | 1.3 ms | 0% | 4% |
| Resizable，捲動 | 捲動 | 143 | 0.6 ms | 0% | 1% |
| Dock，捲動 | 捲動 | 142 | 0.5 ms | 1% | 1% |
| Gestures | 彈簧、脈動光環 | 144 | 1.6 ms | 0% | 1–5% |
| Physics，捲動 | 捲動（900 × 500 視窗） | 144 | 1.6 ms | 1% | 1% |
| Animations | 原生迴圈 | 144 | 2.6 ms | 0–1% | 5% |
| Canvas，捲動 | 捲動、原生迴圈 | 144 | 4.2 ms | 0% | 1–4% |
| Styles，捲動 | 捲動 | 144 | 2.3 ms | 2% | 3% |
| Tailwind | `animate-*` 工具類別 | 144 | 1.7 ms | 0% | 3–8% |
| Text，捲動 | 捲動 | 144 | 1.9 ms | 0% | 4% |
| Text View，捲動 | 捲動 | 141 | 1.8 ms | 2% | 7% |
| Images，捲動 | 捲動、GIF 與 WebP 影格 | 143 | 2.9 ms | 2% | 8% |
| Components，捲動 | 捲動 | 144 | 1.4 ms | 0% | 3% |
| Overlays，捲動 | 捲動（900 × 500 視窗） | 144 | 1.7 ms | 0% | 2% |
| Menus，捲動 | 捲動（900 × 500 視窗） | 144 | 1.9 ms | 0% | 2% |
| Controls | 轉場 | 144 | 0.9 ms | 0% | 1–4% |
| Web and video | 影片影格、頁面 | 135–142 | 1.0 ms | 0% | 7–8% |

</div>

<a id="memory"></a>

### 記憶體

閒置狀態，啟動後 3 秒（release runner，480 × 640 視窗）。*Private* 是行程獨自擁有的記憶體（USS）；*resident* 則再加上共用函式庫（GTK、GPU 驅動程式）的分頁，機器上所有 GTK 應用程式都共用這些分頁：

<div class="data-table">

| 應用程式 | 渲染器 | Private（USS） | Resident（RSS） |
|---|---|---|---|
| Rust 應用程式（`nsh init --template rust`） | GL（`ngl`） | 約 49 MB | 約 142 MB |
| Rust 應用程式 | Cairo（`GSK_RENDERER=cairo`） | 約 28 MB | 約 95 MB |
| TSX 計數器（`examples/counter`） | GL | 約 79 MB | 約 166 MB |
| 僅含一個標籤的 GTK 4 視窗，作為對照 | Vulkan / Cairo | 約 62 / 約 40 MB | 約 132 / 約 109 MB |

</div>

重複造訪同一頁面不會增加記憶體；首次造訪某個頁面時，行程會成長，增加的部分來自它刻意快取的內容（已解碼的圖片，上限 128 MB），以及首次使用時載入的函式庫（web view 所用的 WebKitGTK）。

<a id="app-size"></a>

### 應用程式大小

以 `nsh init` 搭配各個範本建立的 hello world 應用程式，以及兩個實際有人使用的應用程式，皆由 `nsh package --target linux` 針對 x86_64 建置。Runner 是應用程式唯一的可執行檔；archive 則是它發佈時所用的 `.tar.gz`。Hello world 皆啟用連結時期最佳化並已 strip（`CARGO_PROFILE_RELEASE_LTO=fat`、`CARGO_PROFILE_RELEASE_CODEGEN_UNITS=1`、`CARGO_PROFILE_RELEASE_STRIP=true`）：

<div class="data-table">

| 應用程式 | 開發語言 | Runner | Archive |
|---|---|---|---|
| Hello world（`--template rust`） | Rust | 16.5 MB | 7.5 MB |
| Hello world（`--template ts`） | TSX，基於 QuickJS | 25.7 MB | 11.6 MB |
| Hello world（`--template mixed`） | TSX 與一個 Rust crate | 25.8 MB | 11.7 MB |
| [sysmon](https://github.com/huacnlee/sysmon) 0.1.3 | Rust | 20.9 MB（已 strip） | 9.7 MB |
| [Omasend](https://github.com/huacnlee/omasend) 0.2.0 | Rust | 22.3 MB | 9.8 MB |

</div>

TSX 的 runner 內含 QuickJS 執行環境、原生模組與渲染器；應用程式自身的程式碼則是放在 runner 旁的 bundle，hello world 的 bundle 不到 1 KB。

這些數字的成因：

- **渲染器**：在 NVIDIA 驅動程式下，NSH 使用 GSK 的 GL 渲染器繪製，其影格成本僅為該環境下 Vulkan 渲染器的一小部分（Animations 範例：每個影格約 1 ms 的繪製時間，而非約 9.5 ms）。最終仍由 `GSK_RENDERER` 決定。
- **Canvas 點陣化**：每個 canvas 只會點陣化一次，存成保留在 GPU 上的 256 px 圖磚。動畫值只會重繪讀取它的操作所涵蓋的區域，並疊在繪圖靜態部分已保留的像素之上；位於畫面之外的 canvas 會等到捲入視野時才處理。
- **路徑只需擱置一次**：在長路徑之後呼叫 `fillRect` 與 `fillText`，會讓該路徑保留原位，直到再次使用為止（先畫一條 400 點的折線，再畫 240 根長條：0.63 ms）。

<a id="macos-appkit"></a>

## macOS（AppKit）

在 MacBook Pro（Apple M3、24 GB）的內建 120 Hz ProMotion 顯示器上以 release 版本量測，Gallery 位於 1200 × 800 的視窗中，所有讀數皆由 `examples/gallery/tools/perf.py`（`nsh test --target macos --fps`，每秒一行；CPU 為整個行程的用量，以單一核心的百分比表示，GPU 為其占用 GPU 的比例）自動取得。各階段為主執行緒每個影格的耗時：*tick*（display link 的原生動畫）與 *canvas*（重播繪圖）。

<a id="animated-demos-1"></a>

### 動畫範例

<div class="data-table">

| 範例 | FPS | Frame p95 | CPU | GPU |
|---|---|---|---|---|
| Stocks：22 條即時 sparkline、一張日內走勢圖、委託簿、成交明細 | 120 | 2.7–3.7 ms | 33–36% | 18–22% |
| Canvas：一個儀表、一個時鐘、一個點陣 | 119–120 | 0.6–0.7 ms | 4–7% | 0% |
| Animations：三個原生迴圈、彈簧、序列動畫 | 119–120 | 0.3–1.6 ms | 5–8% | 0% |

</div>

在 Stocks 上，每個影格的主執行緒時間約 1.6 ms 用於 tick，其中約 0.45 ms 用來重播各 canvas 的動畫部分；每個 canvas 的其餘部分由 Core Animation 在其自身的執行緒上繪製。

<a id="every-page-1"></a>

### 每個頁面

Gallery 的每個頁面，在開啟時以及測試捲動它時的表現，視窗同為 1200 × 800。與 Linux 相同，*FPS* 是有內容在移動時的速率（即已繪製影格之間間隔中位數所對應的每秒影格數）；在顯示器的 120 Hz 下，動畫或捲動的每個影格都在前一個影格之後一個更新週期出現。*Over one refresh* 是耗時超過一個更新週期（8.3 ms）的影格所占比例。靜止的頁面不會繪製影格，CPU 用量為 2–5%。Images 的 GIF 與 WebP 由 Core Animation 播放，影片由 AVFoundation 播放，皆以其自身的影格率進行。

<div class="data-table">

| 頁面 | 影格來源 | FPS | Frame p95 | Over one refresh | CPU |
|---|---|---|---|---|---|
| Stocks | 即時資料、原生迴圈 | 120 | 3.2 ms | 0% | 35% |
| Stocks，捲動 | 即時資料、捲動 | 120 | 3.5 ms | 0% | 36% |
| AI Chat，捲動 | 捲動 | 120 | 2.4 ms | 1% | 5% |
| Photos，捲動 | 捲動 | 120 | 1.4 ms | 0% | 10% |
| Lists，捲動 | 捲動 | 120 | 1.6 ms | 0% | 8% |
| Scrolling，捲動 | 捲動 | 120 | 2.7 ms | 0% | 6% |
| Navigation，捲動 | 捲動 | 120 | 0.2 ms | 0% | 4% |
| Form，捲動 | 捲動 | 120 | 0.6 ms | 0% | 5% |
| Resizable，捲動 | 捲動 | 120 | 0.3 ms | 0% | 4% |
| Dock，捲動 | 捲動 | 120 | 0.3 ms | 1% | 5% |
| Gestures | 彈簧、脈動光環 | 120 | 0.4 ms | 0% | 4% |
| Physics，捲動 | 捲動 | 120 | 0.3 ms | 0% | 4% |
| Animations | 原生迴圈 | 120 | 0.3 ms | 0% | 5% |
| Canvas，捲動 | 捲動、原生迴圈 | 120 | 1.2 ms | 0% | 7% |
| Styles，捲動 | 捲動、搖擺的 transform | 120 | 1.0 ms | 0% | 6% |
| Tailwind | `animate-*` 工具類別 | 120 | 0.5 ms | 0% | 4% |
| Text，捲動 | 捲動 | 120 | 0.3 ms | 0% | 5% |
| Text View，捲動 | 捲動 | 120 | 0.7 ms | 0% | 5% |
| Images，捲動 | 捲動 | 120 | 0.4 ms | 0% | 5% |
| Components，捲動 | 捲動 | 120 | 0.3 ms | 0% | 5% |
| Overlays，捲動 | 捲動 | 120 | 0.3 ms | 0% | 4% |
| Menus，捲動 | 捲動 | 120 | 0.3 ms | 0% | 5% |
| Controls | 轉場 | 120 | 0.3 ms | 0% | 4% |
| Web and video，捲動 | 捲動 | 120 | 0.2 ms | 0% | 6% |
| System | `requestAnimationFrame`、計時器 | 120 | 0.2 ms | 0% | 3% |
| Standard APIs，捲動 | 捲動 | 120 | 0.3 ms | 0% | 5% |
| Storage，捲動 | 捲動 | 120 | 0.3 ms | 0% | 5% |

</div>

<a id="memory-1"></a>

### 記憶體

閒置狀態，啟動後 3 秒（release runner）。*Footprint* 是 macOS 計入該行程的記憶體（即「活動監視器」顯示的數值）；*resident* 則再加上系統共用函式庫的分頁：

<div class="data-table">

| 應用程式 | 視窗 | Footprint | Resident（RSS） |
|---|---|---|---|
| Rust 應用程式（`nsh init --template rust`） | 1200 × 800 | 約 19 MB | 約 86 MB |
| TSX 計數器（`examples/counter`） | 1200 × 800 | 約 20 MB | 約 89 MB |
| 僅含一個標籤的 AppKit 視窗，作為對照 | 480 × 640 | 約 17 MB | 約 80 MB |

</div>

在 Gallery 的導覽過程中，行程在到達 Canvas 頁面之前占用 84–230 MB，從 Text View 頁面起則約為 350–360 MB，這包含它刻意快取的內容（已解碼的圖片，上限 128 MB；Text View 頁面的文件），以及首次使用時載入的框架（web view 所用的 WebKit）；Canvas 頁面的點陣圖在三個 canvas 同時顯示於畫面時最高可達約 310 MB，頁面關閉後即會釋放。
<a id="app-size-1"></a>

### App 大小

`nsh init` 以每個範本建立的 hello world 應用程式,依 `nsh package --target macos` 為 Apple silicon (arm64) 建置的結果(啟用連結時期最佳化,並如同在 Linux 上一樣移除符號),加上上述兩個以 Apple silicon 版本發行的應用程式。可執行檔是 `.app` 內的 runner;zip 是壓縮後的 `.app`(`ditto -c -k`):

<div class="data-table">

| 應用程式 | 開發語言 | 可執行檔 | 壓縮後 `.app` |
|---|---|---|---|
| Hello world(`--template rust`) | Rust | 12.4 MB | 6.0 MB |
| Hello world(`--template ts`) | TSX,基於 QuickJS | 19.8 MB | 9.5 MB |
| Hello world(`--template mixed`) | TSX 與 Rust crate | 19.8 MB | 9.5 MB |
| [sysmon](https://github.com/huacnlee/sysmon) 0.1.3 | Rust | 21.6 MB | 8.4 MB(其發行版本的 `.tar.gz`) |
| [Omasend](https://github.com/huacnlee/omasend) 0.2.0 | Rust | 18.4 MB | 9.7 MB(其發行版本的 `.tar.gz`) |

</div>

這些數字的成因:

- **只為變化產生影格**:原生動畫執行期間,display link 會持續觸發,動畫結束後即停止;動畫會隨頁面一同停止(其 view 被刪除時,關鍵影格隨之結束;迴圈則在其元件的 `cleanup` 中停止)。
- **在成本最低之處繪製 canvas**:經常重繪的 canvas(動畫、即時資料)會在 Core Animation 的執行緒上繪製(`drawsAsynchronously`),讓主執行緒保持空閒;偶爾才重繪的 canvas 則立即繪製,不佔用非同步繪製所保留的圖形記憶體。動畫值變化時,只會重繪讀取該值的操作所涵蓋的區域。
- **保留靜態的 canvas 部分**:繪圖內容維持不變後,第一個動畫操作之前的一長段內容會保留為一個圖層;每個影格繪製該圖層,並只重播其餘的動畫部分,直接在主執行緒上立即完成(Canvas 頁面的儀表、時鐘與點陣:不需 GPU 運算,記憶體減半)。
- **內容變動時才繪製**:文字與 canvas 會繪製到各自的圖層中,僅在內容或大小改變時重繪,移動或捲動時則不會。

<a id="windows-win32-direct2d"></a>

## Windows(Win32、Direct2D)

在 Windows 11 桌機(Intel Core i7-13700KF、32 GB、NVIDIA GeForce RTX 3060 Ti)上量測,顯示器為 4K 144 Hz、縮放 150%,使用 release 建置,gallery 位於 1200 × 800 的視窗中(1800 × 1200 像素),所有讀數皆由 `examples/gallery/tools/perf.py` 自動擷取(`nsh test --target windows --fps`,每秒一行;CPU 為整個行程的使用量,以單一核心的百分比表示)。各階段為主執行緒每個影格的耗時:*paint*(Direct2D 繪製視窗),以及其中的 *canvas*(錄製與重播繪圖)。

<a id="animated-demos-2"></a>

### 動畫範例

<div class="data-table">

| 範例 | FPS | 影格 p95 | 每影格 Paint / canvas | CPU |
|---|---|---|---|---|
| Stocks:22 條即時走勢線、一張盤中圖表、委託簿、成交明細 | 144 | 3.7–4.3 ms | 1.4 / 0.13 ms | 36–43% |
| Canvas:儀表、時鐘、點陣 | 144 | 1.0–2.0 ms | 0.8–1.4 / 0.05 ms | 21–35% |
| Animations:三個原生迴圈、彈簧、序列 | 144 | 1.0–3.6 ms | 0.9–1.9 ms | 20–41% |

</div>

Stocks 每秒提交 16–17 次,每次在引擎執行緒上最多花費 2.1 ms 於 JS,以及 1.7 ms 於核心(p95)。

> [!NOTE]
> 動畫會讓 view 在大範圍區域移動的頁面,在此平台上比 Linux 與 macOS 耗用更多 CPU(Animations 為 20–41%,對比 5–13%;Gestures 為 36%,對比 1–5%)。Windows 每個影格都會在主執行緒上以 Direct2D 重新繪製變動區域上的每個 view:不斷擴大的圓環會在每個影格重繪其下方的卡片。在 macOS 上,Core Animation 會在 GPU 上移動、縮放與淡化它所保留的圖層,無需重新繪製;在 Linux 上,GSK 則會保留未變動內容的 render node。此外,這些數字還包含了在 1800 × 1200 像素下每秒 144 個影格的負載。

<a id="every-page-2"></a>

### 每個頁面

gallery 的每個頁面,在同樣 1200 × 800 的視窗中,涵蓋頁面開啟時以及測試捲動它時的情況。與 Linux 和 macOS 相同,*FPS* 是有東西在移動時的速率(以已繪製影格之間的間隔中位數換算為一個影格);在顯示器的 144 Hz 下,動畫或捲動的每個影格都在上一個影格之後的一次更新週期出現。*Over one refresh* 是耗時超過一次更新週期(6.9 ms)的影格所占比例。靜止的頁面不會繪製影格,CPU 使用率為 0–2%。Images 的 GIF 與 WebP 依其自身的影格率播放(此處約 40 FPS)。Physics、Overlays、Menus 與 Storage 是在 900 × 500 的視窗中量測,以便有空間可捲動。

<div class="data-table">

| 頁面 | 影格來源 | FPS | 影格 p95 | 超過一次更新週期 | CPU |
|---|---|---|---|---|---|
| Stocks | 即時資料、原生迴圈 | 144 | 3.9 ms | 0% | 36% |
| Stocks, scrolling | 即時資料、捲動 | 144 | 4.3 ms | 0% | 43% |
| Photos, scrolling | 捲動 | 143 | 2.1 ms | 0% | 9% |
| Lists, scrolling | 捲動 | 144 | 2.0 ms | 1% | 19% |
| Scrolling, scrolling | 捲動 | 143 | 2.1 ms | 0% | 7% |
| Navigation, scrolling | 捲動 | 144 | 0.8 ms | 0% | 9% |
| Form, scrolling | 捲動 | 144 | 0.8 ms | 0% | 12% |
| Resizable, scrolling | 捲動 | 143 | 0.4 ms | 0% | 4% |
| Dock, scrolling | 捲動 | 144 | 0.5 ms | 1% | 5% |
| Gestures | 彈簧、脈動圓環 | 144 | 1.8 ms | 0% | 36% |
| Physics, scrolling | 捲動(900 × 500 視窗) | 144 | 0.8 ms | 0% | 4% |
| Animations | 原生迴圈 | 144 | 1.0 ms | 0% | 28% |
| Canvas, scrolling | 捲動、原生迴圈 | 144 | 2.0 ms | 0% | 35% |
| Styles, scrolling | 捲動、擺動的 transform | 144 | 2.1 ms | 0% | 39% |
| Tailwind | `animate-*` 工具類別 | 144 | 0.6 ms | 0% | 19% |
| Text, scrolling | 捲動 | 144 | 1.6 ms | 0% | 8% |
| Text View, scrolling | 捲動 | 144 | 1.1 ms | 0% | 10% |
| Images, scrolling | 捲動、GIF 與 WebP 影格 | 143 | 4.8 ms | 2% | 23% |
| Components, scrolling | 捲動 | 144 | 1.0 ms | 1% | 11% |
| Overlays, scrolling | 捲動(900 × 500 視窗) | 144 | 0.6 ms | 0% | 1% |
| Menus, scrolling | 捲動(900 × 500 視窗) | 144 | 0.6 ms | 0% | 2% |
| Controls | 轉場 | 117–144 | 1.5 ms | 0% | 22% |
| Web and video, scrolling | 捲動 | 144 | 1.6 ms | 0% | 15% |
| System | `requestAnimationFrame`、計時器 | 144 | < 0.1 ms | 0% | 1% |
| Storage, scrolling | 捲動(900 × 500 視窗) | 144 | 0.5 ms | 0% | 1% |

</div>

<a id="memory-2"></a>

### 記憶體

靜止狀態,啟動後 3 秒(release runner,1200 × 800 視窗)。*Private working set* 是該行程獨自使用的記憶體(工作管理員的「記憶體」欄);*private bytes* 是它已認可(committed)的記憶體;*working set* 則另外加上它與其他行程共用的系統程式庫分頁(Direct3D、Direct2D、DirectWrite、GPU 驅動程式):

<div class="data-table">

| 應用程式 | Private working set | Private bytes | Working set |
|---|---|---|---|
| Rust 應用程式(`nsh init --template rust`) | ~14 MB | ~60 MB | ~53–71 MB |
| TSX 計數器(`examples/counter`) | ~15 MB | ~61 MB | ~56–71 MB |

</div>

在 gallery 的導覽流程中,working set 在 Stocks 約為 108–115 MB,進入 Canvas 頁面後約 230 MB,進入 Text View 頁面後約 320–340 MB,而在 Web and video 開啟 WebView2 後約 390–405 MB(其網頁在 WebView2 自己的行程中執行),其中包含刻意快取的內容(解碼後的影像,上限為 128 MB;Text View 頁面的文件)。

<a id="app-size-2"></a>

### App 大小

`nsh init` 以每個範本建立的 hello world 應用程式,依 `nsh package --target windows` 為 x86_64 建置的結果(Rust runner 啟用連結時期最佳化並移除符號,與 Linux 相同)。可執行檔是應用程式的 `<Name>.exe`;zip 是寫在其目錄旁的 `.zip`:

<div class="data-table">

| 應用程式 | 開發語言 | 可執行檔 | Zip |
|---|---|---|---|
| Hello world(`--template rust`) | Rust | 15.0 MB | 6.7 MB |
| Hello world(`--template ts`) | TSX,基於 QuickJS | 28.6 MB | 12.4 MB |
| Hello world(`--template mixed`) | TSX 與 Rust crate | 26.3 MB | 11.5 MB |

</div>

這些數字的成因:

- **只為變化產生影格,且只繪製變動之處**:由合成器(compositor)調節節奏的 ticker 會在原生動畫、轉場或影格回呼執行期間運作。每個影格會在視窗所保留的像素之上,繪製發生變化的 view 區域(包含其原本位置與目前位置),並且只將這些區域提交給合成器(Stocks:每個影格約 34 個 view)。
- **Canvas 錄製其動畫部分**:繪圖內容會被錄製為 Direct2D 命令清單,在任何縮放比例下都保持向量與銳利。當動畫值改變時,只有從第一個讀取動畫值的操作起的後續操作會重新錄製;之前的部分則予以保留(Stocks:22 條脈動走勢線與圖表,每秒約 26 ms 的錄製時間)。
- **只繪製可見的內容**:捲動 view 或裁切 view 中位於可視範圍外的子項目不會納入影格,而沒有自身內容的 view 僅繪製其背景與邊框。

<a id="ios-uikit"></a>

## iOS(UIKit)

在 iOS 模擬器(iPhone 18 Pro Max,執行於上述 MacBook Pro)中量測,使用 release 建置與相同的導覽流程(`perf.py --target ios`:`nsh test --target ios --fps`,即 UIKit 所收到的手指觸控)。模擬器以 60 Hz 呈現;在配備 ProMotion 螢幕的 iPhone 上,NSH 的 display link 會以螢幕的 120 Hz 運作(由 `nsh package` 建置的應用程式與開發主機會透過 `CADisableMinimumFrameDurationOnPhone` 要求此行為)。各階段為 *tick*(原生動畫)、*drain*(套用引擎的批次更新)與 *scroll*(捲動 view 之後接續的處理:清單、sticky 儲存格、繫結值)。

<div class="data-table">

| 頁面 | 影格來源 | FPS | 影格 p95 | CPU |
|---|---|---|---|---|
| Home, scrolling | 捲動 | 60 | 0.1 ms | 6% |
| Stocks | 即時資料、原生迴圈 | 60 | 0.3 ms | 22% |
| Stocks, scrolling | 即時資料、捲動 | 60 | 0.3 ms | 25% |
| Photos, scrolling | 捲動 | 60 | 1.2 ms | 6% |
| Lists, scrolling | 捲動 | 60 | 1.1 ms | 8% |
| Scrolling, scrolling | 捲動 | 60 | 0.1 ms | 7% |
| Navigation, scrolling | 捲動 | 60 | 0.2 ms | 7% |
| Form, scrolling | 捲動 | 60 | 0.3 ms | 7% |
| Gestures | 彈簧、脈動圓環 | 60 | 0.3 ms | 3% |
| Animations | 原生迴圈 | 60 | 0.7 ms | 6% |
| Canvas | 原生迴圈 | 60 | 0.4 ms | 16% |
| Styles | 擺動的 transform | 60 | 0.4 ms | 4% |
| Tailwind, scrolling | 捲動 | 60 | 0.2 ms | 7% |
| Text, scrolling | 捲動 | 60 | 0.1 ms | 7% |
| Text View, scrolling | 捲動 | 60 | 0.1 ms | 6% |
| Images, scrolling | 捲動 | 60 | 0.1 ms | 5% |
| Components, scrolling | 捲動 | 60 | 0.2 ms | 6% |
| Overlays, scrolling | 捲動 | 60 | 0.1 ms | 6% |
| Menus, scrolling | 捲動 | 60 | 0.2 ms | 7% |
| Controls, scrolling | 捲動、轉場 | 60 | 0.2 ms | 5% |
| Web and video, scrolling | 捲動 | 60 | 0.1 ms | 8% |
| System | `requestAnimationFrame`、計時器 | 60 | 0.3 ms | 4% |
| Standard APIs, scrolling | 捲動 | 60 | 0.1 ms | 7% |
| Storage, scrolling | 捲動 | 60 | 0.1 ms | 8% |

</div>

如上所述,*FPS* 是有東西在移動時的速率:在模擬器的 60 Hz 下,每個影格都在上一個影格之後的一次更新週期出現。沒有任何內容在移動的頁面不會繪製影格,靜止時 CPU 使用率為 1–2%。該行程在 gallery 首頁佔用 40 MB,完成整個導覽流程後約 180 MB(包含刻意快取的影像,以及 Text View 頁面的文件)。

在 iPhone 17 Pro(ProMotion,120 Hz)上,螢幕上同時執行開發主機與一個範例時,動畫頁面會在每次更新時繪製影格:

<div class="data-table">

| 頁面 | 影格來源 | FPS | 影格 p95 | 超過一次更新週期 | CPU | 記憶體 |
|---|---|---|---|---|---|---|
| Stocks | 即時資料、原生迴圈 | 120 | 0.2–0.3 ms | 0% | 46–70% | 41–43 MB |
| Canvas | 原生迴圈 | 120 | 0.1 ms | 0% | 25–36% | 37–38 MB |
| Animations | 原生迴圈 | 120 | 0.2 ms | 0% | 3–11% | 37 MB |

</div>

Stocks 每秒提交 20 次(每 50 ms 一個 tick),每次在引擎執行緒上花費 1.5 ms 於 JS,以及 1.4 ms 於核心(p95 分別為 2.2 與 2.0 ms),引擎執行緒的忙碌時間占 4–6%。

<a id="measuring-an-app"></a>

## 量測應用程式

若要以相同方式量測應用程式,請在 `--target linux`、`macos`、`windows` 或 `ios` 上,使用 `--fps` 與 `-v` 執行其測試或步驟:

```sh
cargo build --release -p nsh-cli
python3 examples/gallery/tools/perf.py --target macos --only Stocks,Canvas   # the gallery, page by page
echo 'await app.wait(5000)' | nsh -v test App.tsx --target linux --fps        # any app
```
