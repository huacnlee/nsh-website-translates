---
title: "效能報告"
description: "NSH 應用程式的實測數據——包括 NSH 基準測試中的 commit 與影格成本,以及 gallery 在 Linux、macOS、Windows 和 iOS 上逐頁量度的影格率、CPU 與記憶體使用量——並說明如何重現這些數據。"
order: 62.5
group: tools
source_hash: 8924d78b30d23299
---


# 效能報告

實測 NSH 應用程式的成本。NSH 如何保持流暢,以及如何量度你自己的應用程式,請見 [Performance](./performance.md)。

<a id="baselines"></a>

## 基準數據

以下為 NSH 自身的基準數據(除特別註明外,均在 Apple silicon 上量度):

| 場景 | 數據 |
|---|---|
| 計數器應用程式,headless(debug) | 首個畫面約 0.5–0.65 ms(58 個 ops / 49 個 mount items);一次點按約 0.15 ms |
| 計數器應用程式,Mac Catalyst(release) | 首個畫面約 1.05–1.15 ms(其中約 0.7 ms 用於首次以 CoreText 排版 10 段文字);一次點按約 0.12 ms |
| Gallery 相片列表,headless(debug) | 首個畫面 653 個 ops / 224 個 nodes,約 2.7 ms |
| 捲動相片列表,Catalyst(release) | 慢速捲動時重新綁定一列約 0.4 ms;快速甩動時整個畫面約 32 列 0.9–1.6 ms |
| 捲動相片列表,Android emulator(arm64,release) | 重新綁定一列約 0.3–0.4 ms(JS 約 60 µs) |
| 引擎啟動(release) | 約 75–155 µs;全域 API(`fetch`、`URL` 等)在首次使用前毫無成本,首次使用後約 90 µs |
| Hot reload | 由儲存檔案到新版本運行約 120 ms;套用更新 0.2–0.5 ms |

<a id="linux-gtk-4"></a>

## Linux(GTK 4)

在一部 Linux 桌面電腦上量度(x86_64、24 條執行緒、NVIDIA GPU),使用 release 版本,gallery 在 120 Hz 顯示器上以 1896 × 1030 視窗運行,所有讀數均由 `examples/gallery/tools/perf.py`(`nsh test --target linux --fps`,每秒一行;CPU 為整個行程的用量,以單一核心的百分比計)自動取得。*Frame p95* 是主執行緒每個已繪製畫面所用時間的第 95 百分位數:低於 8.3 ms,畫面便能趕上 120 Hz 的更新率。

<a id="animated-demos"></a>

### 動畫示範

<div class="data-table">

| 示範 | FPS | Frame p95 | CPU |
|---|---|---|---|
| Stocks:22 條即時 sparkline、一幅日內圖表、order book、tape | 117–120 | 5–6 ms | 25–29%(1200 × 800)、28–32%(1896 × 1030) |
| Stocks,視窗填滿 4K 144 Hz 顯示器,縮放 1.6× | 143–145 | 4.1–4.4 ms | 26–29% |
| Canvas:一個儀表、一個時鐘、一個點陣 | 120 | 2.6–4.4 ms | 5–10% |
| Animations:三個原生循環動畫、springs、sequences | 120 | 2.0 ms | 12–13% |

</div>

<a id="every-page"></a>

### 每個頁面

gallery 的每個頁面,包括開啟時及測試捲動時的表現,在同一部機器上以 1200 × 800 視窗於 144 Hz 顯示器運行。NSH 只在畫面上有內容改變時才繪製畫面,因此這裏的 *FPS* 是指有內容移動時的速率:即已繪製畫面之間間隔中位數的倒數(`perf.py` 的 `moving`);在顯示器的 144 Hz 下,動畫或捲動的每一個畫面都在上一個畫面之後一個更新週期出現。*Over one refresh* 是耗時超過一個更新週期(6.9 ms)的畫面所佔比例。Images 頁面的 GIF 與 WebP 以其自身的幀率播放(這裏約 50 FPS),影片亦然。Physics、Overlays 和 Menus 頁面內容較短:在 1200 × 800 視窗中,捲動數個畫面內便到盡頭,因此改用 900 × 500 視窗量度,讓它們有足夠空間捲動。

<div class="data-table">

| 頁面 | 畫面來源 | FPS | Frame p95 | Over one refresh | CPU |
|---|---|---|---|---|---|
| Stocks | 即時數據、原生循環動畫 | 144 | 4.1 ms | 0% | 26% |
| Stocks, scrolling | 即時數據、捲動 | 144 | 4.1 ms | 0% | 25% |
| Photos, scrolling | 捲動 | 144 | 2.8 ms | 2% | 9% |
| Lists, scrolling | 捲動 | 143 | 1.7 ms | 0% | 7% |
| Scrolling, scrolling | 捲動 | 144 | 1.6 ms | 1% | 4% |
| Navigation, scrolling | 捲動 | 143 | 1.7 ms | 0% | 2% |
| Form, scrolling | 捲動 | 144 | 1.3 ms | 0% | 4% |
| Resizable, scrolling | 捲動 | 143 | 0.6 ms | 0% | 1% |
| Dock, scrolling | 捲動 | 142 | 0.5 ms | 1% | 1% |
| Gestures | Springs、脈動光環 | 144 | 1.6 ms | 0% | 1–5% |
| Physics, scrolling | 捲動(900 × 500 視窗) | 144 | 1.6 ms | 1% | 1% |
| Animations | 原生循環動畫 | 144 | 2.6 ms | 0–1% | 5% |
| Canvas, scrolling | 捲動、原生循環動畫 | 144 | 4.2 ms | 0% | 1–4% |
| Styles, scrolling | 捲動 | 144 | 2.3 ms | 2% | 3% |
| Tailwind | `animate-*` 工具類別 | 144 | 1.7 ms | 0% | 3–8% |
| Text, scrolling | 捲動 | 144 | 1.9 ms | 0% | 4% |
| Text View, scrolling | 捲動 | 141 | 1.8 ms | 2% | 7% |
| Images, scrolling | 捲動、GIF 與 WebP 畫面 | 143 | 2.9 ms | 2% | 8% |
| Components, scrolling | 捲動 | 144 | 1.4 ms | 0% | 3% |
| Overlays, scrolling | 捲動(900 × 500 視窗) | 144 | 1.7 ms | 0% | 2% |
| Menus, scrolling | 捲動(900 × 500 視窗) | 144 | 1.9 ms | 0% | 2% |
| Controls | Transitions | 144 | 0.9 ms | 0% | 1–4% |
| Web and video | 影片畫面、頁面 | 135–142 | 1.0 ms | 0% | 7–8% |

</div>

<a id="memory"></a>

### 記憶體

靜止狀態,啟動後 3 秒(release runner,480 × 640 視窗)。*Private* 是行程獨自擁有的記憶體(USS);*resident* 則加上共用函式庫的記憶體頁(GTK、GPU 驅動程式),這些頁由機器上所有 GTK 應用程式共用:

<div class="data-table">

| 應用程式 | Renderer | Private(USS) | Resident(RSS) |
|---|---|---|---|
| Rust 應用程式(`nsh init --template rust`) | GL(`ngl`) | 約 49 MB | 約 142 MB |
| Rust 應用程式 | Cairo(`GSK_RENDERER=cairo`) | 約 28 MB | 約 95 MB |
| TSX 計數器(`examples/counter`) | GL | 約 79 MB | 約 166 MB |
| 只有一個 label 的 GTK 4 視窗(作參考) | Vulkan / Cairo | 約 62 / 約 40 MB | 約 132 / 約 109 MB |

</div>

重複造訪同一頁面不會增加記憶體;首次造訪頁面時,行程會增長,增幅來自它刻意快取的內容(已解碼的圖片,上限 128 MB)以及首次使用時載入的函式庫(web views 使用的 WebKitGTK)。

<a id="app-size"></a>

### 應用程式大小

以 `nsh init` 按各個範本建立的 hello world 應用程式,以及兩個實際使用中的應用程式,均為 `nsh package --target linux` 針對 x86_64 建置的結果。runner 是應用程式唯一的可執行檔;archive 是其發佈時的 `.tar.gz`。hello world 均以 link-time optimization 建置並已 strip(`CARGO_PROFILE_RELEASE_LTO=fat`、`CARGO_PROFILE_RELEASE_CODEGEN_UNITS=1`、`CARGO_PROFILE_RELEASE_STRIP=true`):

<div class="data-table">

| 應用程式 | 開發語言 | Runner | Archive |
|---|---|---|---|
| Hello world(`--template rust`) | Rust | 16.5 MB | 7.5 MB |
| Hello world(`--template ts`) | TSX,基於 QuickJS | 25.7 MB | 11.6 MB |
| Hello world(`--template mixed`) | TSX 加 Rust crate | 25.8 MB | 11.7 MB |
| [sysmon](https://github.com/huacnlee/sysmon) 0.1.3 | Rust | 20.9 MB(已 strip) | 9.7 MB |
| [Omasend](https://github.com/huacnlee/omasend) 0.2.0 | Rust | 22.3 MB | 9.8 MB |

</div>

TSX runner 內含 QuickJS 執行環境、原生模組及 renderer;應用程式自身的程式碼是 runner 旁邊的 bundle,hello world 的 bundle 不足 1 KB。

這些數字的成因:

- **Renderer**:在 NVIDIA 驅動程式下,NSH 使用 GSK 的 GL renderer 繪製,其每個畫面的成本只是該環境下 Vulkan renderer 的一小部分(Animations 示範:每個畫面繪製約 1 ms,而非約 9.5 ms)。`GSK_RENDERER` 仍可作出選擇。
- **Canvas 點陣化**:每個 canvas 只會點陣化一次,存成保留在 GPU 上的 256 px 圖塊。動畫值只會重繪讀取它的操作所涵蓋的區域,並疊加在繪圖靜態部分已保留的像素之上;不在視野內的 canvas 會等到捲動進入視野時才處理。
- **路徑只需備妥一次**:在長路徑之後執行 `fillRect` 和 `fillText`,路徑會保留原位,直至再次使用(先畫 400 點的線,再畫 240 條長條:0.63 ms)。

<a id="macos-appkit"></a>

## macOS(AppKit)

在一部 MacBook Pro(Apple M3,24 GB)上以其內置 120 Hz ProMotion 顯示器量度,使用 release 版本,gallery 以 1200 × 800 視窗運行,所有讀數均由 `examples/gallery/tools/perf.py`(`nsh test --target macos
--fps`,每秒一行;CPU 為整個行程的用量,以單一核心的百分比計,GPU 為其佔用 GPU 的比例)自動取得。各階段為主執行緒每個畫面的耗時:*tick*(display link 的原生動畫)和 *canvas*(重播繪圖)。

<a id="animated-demos-1"></a>

### 動畫示範

<div class="data-table">

| 示範 | FPS | Frame p95 | CPU | GPU |
|---|---|---|---|---|
| Stocks:22 條即時 sparkline、一幅日內圖表、order book、tape | 120 | 2.7–3.7 ms | 33–36% | 18–22% |
| Canvas:一個儀表、一個時鐘、一個點陣 | 119–120 | 0.6–0.7 ms | 4–7% | 0% |
| Animations:三個原生循環動畫、springs、sequences | 119–120 | 0.3–1.6 ms | 5–8% | 0% |

</div>

在 Stocks 上,每個畫面的主執行緒耗時約 1.6 ms 用於 ticks,其中約 0.45 ms 用於重播各 canvas 的動畫部分;每個 canvas 的其餘部分由 Core Animation 在其自身的執行緒上繪製。

<a id="every-page-1"></a>

### 每個頁面

gallery 的每個頁面,包括開啟時及測試捲動時的表現,使用相同的 1200 × 800 視窗。與 Linux 相同,*FPS* 是指有內容移動時的速率(即已繪製畫面之間間隔中位數的倒數);在顯示器的 120 Hz 下,動畫或捲動的每一個畫面都在上一個畫面之後一個更新週期出現。*Over one refresh* 是耗時超過一個更新週期(8.3 ms)的畫面所佔比例。靜止的頁面不繪製畫面,CPU 用量為 2–5%。Images 頁面的 GIF 與 WebP 由 Core Animation 播放,影片由 AVFoundation 播放,均以其自身的幀率運行。

<div class="data-table">

| 頁面 | 畫面來源 | FPS | Frame p95 | Over one refresh | CPU |
|---|---|---|---|---|---|
| Stocks | 即時數據、原生循環動畫 | 120 | 3.2 ms | 0% | 35% |
| Stocks, scrolling | 即時數據、捲動 | 120 | 3.5 ms | 0% | 36% |
| AI Chat, scrolling | 捲動 | 120 | 2.4 ms | 1% | 5% |
| Photos, scrolling | 捲動 | 120 | 1.4 ms | 0% | 10% |
| Lists, scrolling | 捲動 | 120 | 1.6 ms | 0% | 8% |
| Scrolling, scrolling | 捲動 | 120 | 2.7 ms | 0% | 6% |
| Navigation, scrolling | 捲動 | 120 | 0.2 ms | 0% | 4% |
| Form, scrolling | 捲動 | 120 | 0.6 ms | 0% | 5% |
| Resizable, scrolling | 捲動 | 120 | 0.3 ms | 0% | 4% |
| Dock, scrolling | 捲動 | 120 | 0.3 ms | 1% | 5% |
| Gestures | Springs、脈動光環 | 120 | 0.4 ms | 0% | 4% |
| Physics, scrolling | 捲動 | 120 | 0.3 ms | 0% | 4% |
| Animations | 原生循環動畫 | 120 | 0.3 ms | 0% | 5% |
| Canvas, scrolling | 捲動、原生循環動畫 | 120 | 1.2 ms | 0% | 7% |
| Styles, scrolling | 捲動、擺動的 transform | 120 | 1.0 ms | 0% | 6% |
| Tailwind | `animate-*` 工具類別 | 120 | 0.5 ms | 0% | 4% |
| Text, scrolling | 捲動 | 120 | 0.3 ms | 0% | 5% |
| Text View, scrolling | 捲動 | 120 | 0.7 ms | 0% | 5% |
| Images, scrolling | 捲動 | 120 | 0.4 ms | 0% | 5% |
| Components, scrolling | 捲動 | 120 | 0.3 ms | 0% | 5% |
| Overlays, scrolling | 捲動 | 120 | 0.3 ms | 0% | 4% |
| Menus, scrolling | 捲動 | 120 | 0.3 ms | 0% | 5% |
| Controls | Transitions | 120 | 0.3 ms | 0% | 4% |
| Web and video, scrolling | 捲動 | 120 | 0.2 ms | 0% | 6% |
| System | `requestAnimationFrame`、計時器 | 120 | 0.2 ms | 0% | 3% |
| Standard APIs, scrolling | 捲動 | 120 | 0.3 ms | 0% | 5% |
| Storage, scrolling | 捲動 | 120 | 0.3 ms | 0% | 5% |

</div>

<a id="memory-1"></a>

### 記憶體

靜止狀態,啟動後 3 秒(release runner)。*Footprint* 是 macOS 計入該行程的記憶體(即 Activity Monitor 所顯示的數字);*resident* 則加上系統共用函式庫的記憶體頁:

<div class="data-table">

| 應用程式 | 視窗 | Footprint | Resident(RSS) |
|---|---|---|---|
| Rust 應用程式(`nsh init --template rust`) | 1200 × 800 | 約 19 MB | 約 86 MB |
| TSX 計數器(`examples/counter`) | 1200 × 800 | 約 20 MB | 約 89 MB |
| 只有一個 label 的 AppKit 視窗(作參考) | 480 × 640 | 約 17 MB | 約 80 MB |

</div>

在 gallery 的導覽過程中,行程在 Canvas 頁面之前佔用 84–230 MB,由 Text View 頁面起則約 350–360 MB,其中包括它刻意快取的內容(已解碼的圖片,上限 128 MB;Text View 頁面的文件),以及首次使用時載入的框架(web views 使用的 WebKit);Canvas 頁面的點陣(三個 canvas 同時在畫面上時最高約 310 MB)會在頁面關閉時釋放。
<a id="app-size-1"></a>

### 應用程式大小

由 `nsh init` 以各個範本建立的 hello world 應用程式,按 `nsh package --target macos` 為 Apple silicon (arm64) 建置的方式(啟用連結時最佳化,並像 Linux 上一樣移除符號)測量,另加上述兩個應用程式的 Apple silicon 發行版本。執行檔是 `.app` 內的 runner;zip 是壓縮後的 `.app`(`ditto -c -k`):

<div class="data-table">

| 應用程式 | 編寫語言 | 執行檔 | 壓縮後 `.app` |
|---|---|---|---|
| Hello world(`--template rust`) | Rust | 12.4 MB | 6.0 MB |
| Hello world(`--template ts`) | TSX,運行於 QuickJS | 19.8 MB | 9.5 MB |
| Hello world(`--template mixed`) | TSX 加 Rust crate | 19.8 MB | 9.5 MB |
| [sysmon](https://github.com/huacnlee/sysmon) 0.1.3 | Rust | 21.6 MB | 8.4 MB(其發行版本的 `.tar.gz`) |
| [Omasend](https://github.com/huacnlee/omasend) 0.2.0 | Rust | 18.4 MB | 9.7 MB(其發行版本的 `.tar.gz`) |

</div>

這些數字的成因:

- **只為變化而繪製幀**:原生動畫運行時,display link 才會觸發,動畫結束即停止;動畫會隨其頁面停止(視圖被刪除時,其關鍵幀隨即結束;循環動畫則在其元件的 `cleanup` 中停止)。
- **在成本最低之處繪製 canvas**:經常繪製的 canvas(動畫、即時資料)會在 Core Animation 的執行緒上繪製(`drawsAsynchronously`),讓主執行緒保持空閒;偶爾才重繪的 canvas 則即時繪製,無需佔用非同步繪製所保留的圖形記憶體。動畫值變化時,只會重繪讀取該值的操作所涵蓋的區域。
- **保留靜態的 canvas 部分**:繪圖內容一旦保持不變,第一個動畫操作之前的一長段內容會保留為一個圖層;每一幀繪製該圖層,並只重播動畫的其餘部分,在主執行緒上即時完成(Canvas 頁面的儀表、時鐘和點陣:無需 GPU 運算,記憶體減半)。
- **內容變化時才繪製**:文字和 canvas 繪製到各自的圖層中,只在其內容或大小改變時重繪,移動或捲動時則不會。

<a id="windows-win32-direct2d"></a>

## Windows(Win32、Direct2D)

測量環境為 Windows 11 桌面電腦(Intel Core i7-13700KF、32 GB、NVIDIA GeForce RTX 3060 Ti),4K 144 Hz 顯示器,縮放 150%,release 建置,gallery 置於 1200 × 800 視窗(1800 × 1200 像素);所有讀數均由 `examples/gallery/tools/perf.py` 自動採集(`nsh test --target windows --fps`,每秒一行;CPU 為整個行程,以單一核心的百分比計)。各階段為主執行緒每幀的耗時:*paint*(Direct2D 繪製視窗),以及其中的 *canvas*(錄製和重播繪圖)。

<a id="animated-demos-2"></a>

### 動畫示範

<div class="data-table">

| 示範 | FPS | 幀 p95 | 每幀 paint / canvas | CPU |
|---|---|---|---|---|
| Stocks:22 條即時迷你走勢圖、日內圖表、訂單簿、成交紀錄 | 144 | 3.7–4.3 ms | 1.4 / 0.13 ms | 36–43% |
| Canvas:儀表、時鐘、點陣 | 144 | 1.0–2.0 ms | 0.8–1.4 / 0.05 ms | 21–35% |
| Animations:三個原生循環、彈簧動畫、序列動畫 | 144 | 1.0–3.6 ms | 0.9–1.9 ms | 20–41% |

</div>

Stocks 每秒提交 16–17 次,每次在引擎執行緒上最多耗用 2.1 ms 的 JS 和 1.7 ms 的核心(p95)。

> [!NOTE]
> 動畫會在大面積範圍內移動視圖的頁面,在此平台上比在 Linux 和 macOS 上佔用更多 CPU(Animations 為 20–41%,對比 5–13%;Gestures 為 36%,對比 1–5%)。Windows 每一幀都會在主執行緒上以 Direct2D 重繪變化區域內的每個視圖:一個擴大中的圓環,每一幀都會重繪其下方的卡片。在 macOS 上,Core Animation 會在 GPU 上移動、縮放和淡化它所保留的圖層,無需重繪;在 Linux 上,GSK 則保留未變化內容的 render node。這些數字亦包含在 1800 × 1200 像素下每秒 144 幀的負載。

<a id="every-page-2"></a>

### 所有頁面

gallery 的每一個頁面,在開啟時以及測試捲動期間的表現,同樣在 1200 × 800 視窗中測量。與 Linux 和 macOS 相同,*FPS* 是畫面有動靜時的幀率(每個已繪製幀之間間隔的中位數對應一幀);在顯示器的 144 Hz 下,動畫或捲動的每一幀都在上一幀之後一次刷新出現。*超過一次刷新* 是耗時超過一次刷新(6.9 ms)的幀所佔的比例。靜止的頁面不會繪製任何幀,CPU 佔用為 0–2%。Images 的 GIF 和 WebP 按其自身幀率播放(此處約 40 FPS)。Physics、Overlays、Menus 和 Storage 在 900 × 500 視窗中測量,以便有足夠空間捲動。

<div class="data-table">

| 頁面 | 幀來源 | FPS | 幀 p95 | 超過一次刷新 | CPU |
|---|---|---|---|---|---|
| Stocks | 即時資料、原生循環 | 144 | 3.9 ms | 0% | 36% |
| Stocks,捲動 | 即時資料、捲動 | 144 | 4.3 ms | 0% | 43% |
| Photos,捲動 | 捲動 | 143 | 2.1 ms | 0% | 9% |
| Lists,捲動 | 捲動 | 144 | 2.0 ms | 1% | 19% |
| Scrolling,捲動 | 捲動 | 143 | 2.1 ms | 0% | 7% |
| Navigation,捲動 | 捲動 | 144 | 0.8 ms | 0% | 9% |
| Form,捲動 | 捲動 | 144 | 0.8 ms | 0% | 12% |
| Resizable,捲動 | 捲動 | 143 | 0.4 ms | 0% | 4% |
| Dock,捲動 | 捲動 | 144 | 0.5 ms | 1% | 5% |
| Gestures | 彈簧動畫、脈動圓環 | 144 | 1.8 ms | 0% | 36% |
| Physics,捲動 | 捲動(900 × 500 視窗) | 144 | 0.8 ms | 0% | 4% |
| Animations | 原生循環 | 144 | 1.0 ms | 0% | 28% |
| Canvas,捲動 | 捲動、原生循環 | 144 | 2.0 ms | 0% | 35% |
| Styles,捲動 | 捲動、搖擺的變換 | 144 | 2.1 ms | 0% | 39% |
| Tailwind | `animate-*` 工具類 | 144 | 0.6 ms | 0% | 19% |
| Text,捲動 | 捲動 | 144 | 1.6 ms | 0% | 8% |
| Text View,捲動 | 捲動 | 144 | 1.1 ms | 0% | 10% |
| Images,捲動 | 捲動、GIF 及 WebP 幀 | 143 | 4.8 ms | 2% | 23% |
| Components,捲動 | 捲動 | 144 | 1.0 ms | 1% | 11% |
| Overlays,捲動 | 捲動(900 × 500 視窗) | 144 | 0.6 ms | 0% | 1% |
| Menus,捲動 | 捲動(900 × 500 視窗) | 144 | 0.6 ms | 0% | 2% |
| Controls | 過渡 | 117–144 | 1.5 ms | 0% | 22% |
| Web and video,捲動 | 捲動 | 144 | 1.6 ms | 0% | 15% |
| System | `requestAnimationFrame`、計時器 | 144 | < 0.1 ms | 0% | 1% |
| Storage,捲動 | 捲動(900 × 500 視窗) | 144 | 0.5 ms | 0% | 1% |

</div>

<a id="memory-2"></a>

### 記憶體

靜止狀態,啟動後 3 秒(release runner,1200 × 800 視窗)。*專用工作集* 是行程獨自使用的記憶體(工作管理員的「記憶體」欄);*專用位元組* 是它已提交的記憶體;*工作集* 則另外包含它與其他行程共用的系統程式庫頁面(Direct3D、Direct2D、DirectWrite、GPU 驅動程式):

<div class="data-table">

| 應用程式 | 專用工作集 | 專用位元組 | 工作集 |
|---|---|---|---|
| Rust 應用程式(`nsh init --template rust`) | ~14 MB | ~60 MB | ~53–71 MB |
| TSX 計數器(`examples/counter`) | ~15 MB | ~61 MB | ~56–71 MB |

</div>

在 gallery 的導覽過程中,工作集在 Stocks 上約為 108–115 MB,自 Canvas 頁面起約為 230 MB,自 Text View 頁面起約為 320–340 MB,而當 Web and video 開啟 WebView2 後(其頁面在 WebView2 自己的行程中運行)則約為 390–405 MB,其中包括刻意快取的內容(已解碼的圖片,上限為 128 MB;以及 Text View 頁面的文件)。

<a id="app-size-2"></a>

### 應用程式大小

由 `nsh init` 以各個範本建立的 hello world 應用程式,按 `nsh package --target windows` 為 x86_64 建置的方式測量(Rust runner 啟用連結時最佳化並移除符號,與 Linux 相同)。執行檔是應用程式的 `<Name>.exe`;zip 是寫在其目錄旁的 `.zip`:

<div class="data-table">

| 應用程式 | 編寫語言 | 執行檔 | Zip |
|---|---|---|---|
| Hello world(`--template rust`) | Rust | 15.0 MB | 6.7 MB |
| Hello world(`--template ts`) | TSX,運行於 QuickJS | 28.6 MB | 12.4 MB |
| Hello world(`--template mixed`) | TSX 加 Rust crate | 26.3 MB | 11.5 MB |

</div>

這些數字的成因:

- **只為變化而繪製幀,且只繪製變化之處**:由 compositor 控制節奏的 ticker 在原生動畫、過渡或幀回呼運行時才會運行。每一幀只繪製有變化的視圖區域(其原本位置和現時位置),繪製在視窗保留的像素之上,並只將這些區域呈現給 compositor(Stocks:每幀約 34 個視圖)。
- **Canvas 只錄製其動畫部分**:繪圖會錄製為 Direct2D command list,在任何縮放比例下都保持向量化且清晰。當動畫值變化時,只會重新錄製由第一個讀取動畫值的操作起的內容;之前的部分會保留(Stocks:22 條脈動迷你走勢圖及圖表,每秒約 26 ms 的錄製時間)。
- **只繪製可見的內容**:捲動視圖或裁剪視圖中位於可視範圍之外的子視圖不會納入該幀,而沒有自身內容的視圖只會繪製其背景和邊框。

<a id="ios-uikit"></a>

## iOS(UIKit)

在 iOS 模擬器(iPhone 18 Pro Max,運行於上述 MacBook Pro)中測量,release 建置,使用相同的導覽流程(`perf.py --target ios`:`nsh test --target ios --fps`,即 UIKit 所接收到的手指觸控)。模擬器以 60 Hz 呈現;在配備 ProMotion 螢幕的 iPhone 上,NSH 的 display link 會以螢幕的 120 Hz 運行(由 `nsh package` 建置的應用程式及開發主機會以 `CADisableMinimumFrameDurationOnPhone` 要求此頻率)。各階段為 *tick*(原生動畫)、*drain*(套用引擎的批次更新)和 *scroll*(捲動視圖之後的處理:列表、sticky 儲存格、綁定值)。

<div class="data-table">

| 頁面 | 幀來源 | FPS | 幀 p95 | CPU |
|---|---|---|---|---|
| Home,捲動 | 捲動 | 60 | 0.1 ms | 6% |
| Stocks | 即時資料、原生循環 | 60 | 0.3 ms | 22% |
| Stocks,捲動 | 即時資料、捲動 | 60 | 0.3 ms | 25% |
| Photos,捲動 | 捲動 | 60 | 1.2 ms | 6% |
| Lists,捲動 | 捲動 | 60 | 1.1 ms | 8% |
| Scrolling,捲動 | 捲動 | 60 | 0.1 ms | 7% |
| Navigation,捲動 | 捲動 | 60 | 0.2 ms | 7% |
| Form,捲動 | 捲動 | 60 | 0.3 ms | 7% |
| Gestures | 彈簧動畫、脈動圓環 | 60 | 0.3 ms | 3% |
| Animations | 原生循環 | 60 | 0.7 ms | 6% |
| Canvas | 原生循環 | 60 | 0.4 ms | 16% |
| Styles | 搖擺的變換 | 60 | 0.4 ms | 4% |
| Tailwind,捲動 | 捲動 | 60 | 0.2 ms | 7% |
| Text,捲動 | 捲動 | 60 | 0.1 ms | 7% |
| Text View,捲動 | 捲動 | 60 | 0.1 ms | 6% |
| Images,捲動 | 捲動 | 60 | 0.1 ms | 5% |
| Components,捲動 | 捲動 | 60 | 0.2 ms | 6% |
| Overlays,捲動 | 捲動 | 60 | 0.1 ms | 6% |
| Menus,捲動 | 捲動 | 60 | 0.2 ms | 7% |
| Controls,捲動 | 捲動、過渡 | 60 | 0.2 ms | 5% |
| Web and video,捲動 | 捲動 | 60 | 0.1 ms | 8% |
| System | `requestAnimationFrame`、計時器 | 60 | 0.3 ms | 4% |
| Standard APIs,捲動 | 捲動 | 60 | 0.1 ms | 7% |
| Storage,捲動 | 捲動 | 60 | 0.1 ms | 8% |

</div>

*FPS* 與上文一樣,是畫面有動靜時的幀率:在模擬器的 60 Hz 下,每一幀都在上一幀之後一次刷新出現。沒有任何動靜的頁面不會繪製任何幀,靜止時 CPU 佔用為 1–2%。行程在 gallery 首頁佔用 40 MB,完成整個導覽後約為 180 MB(刻意快取的圖片,以及 Text View 頁面的文件)。

在 iPhone 17 Pro(ProMotion,120 Hz)上,螢幕上只有開發主機和一個示範時,帶動畫的頁面每次刷新都會繪製一幀:

<div class="data-table">

| 頁面 | 幀來源 | FPS | 幀 p95 | 超過一次刷新 | CPU | 記憶體 |
|---|---|---|---|---|---|---|
| Stocks | 即時資料、原生循環 | 120 | 0.2–0.3 ms | 0% | 46–70% | 41–43 MB |
| Canvas | 原生循環 | 120 | 0.1 ms | 0% | 25–36% | 37–38 MB |
| Animations | 原生循環 | 120 | 0.2 ms | 0% | 3–11% | 37 MB |

</div>

Stocks 每秒提交 20 次(每 50 ms 一次 tick),每次在引擎執行緒上耗用 1.5 ms 的 JS 和 1.4 ms 的核心(p95 分別為 2.2 ms 和 2.0 ms),引擎執行緒的忙碌時間佔 4–6%。

<a id="measuring-an-app"></a>

## 測量應用程式

若要以相同方式測量應用程式,請使用 `--fps` 和 `-v` 運行其測試或步驟,平台可選 `--target linux`、`macos`、`windows` 或 `ios`:

```sh
cargo build --release -p nsh-cli
python3 examples/gallery/tools/perf.py --target macos --only Stocks,Canvas   # the gallery, page by page
echo 'await app.wait(5000)' | nsh -v test App.tsx --target linux --fps        # any app
```
