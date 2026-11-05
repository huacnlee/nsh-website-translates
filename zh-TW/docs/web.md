---
title: "Web"
description: "使用 Rust 或 TSX 搭配 Native Shell 元件建構網頁應用程式，元件會渲染為 HTML 與 CSS，可直接在瀏覽器中進行開發，並發佈到任何靜態主機或 CDN。"
order: 16
group: platforms
demo: counter
source_hash: 3d223070a2f7ac3d
---

# Web

使用 Native Shell 建構 Web 應用程式，並與原生平台共用相同的元件、樣式與應用程式邏輯。NSH 會將介面渲染為 HTML 元素與 CSS：文字、圖片、輸入、捲動、視覺樣式與互動皆使用瀏覽器的 DOM 與 Web API。

`nsh package --target web` 會將應用程式發佈為靜態網站，可部署到任何 Web 伺服器或 CDN（[發佈應用程式](#publish-an-app)），而 `nsh run --target web` 會在你編輯時於瀏覽器中執行應用程式（[在瀏覽器中開發](#develop-in-the-browser)）。本網站上的每個即時示範都使用此 Web 後端。

已發佈的 TSX 應用程式使用瀏覽器的 JavaScript 引擎。打包時會為每個應用程式連結專屬的執行階段，其中只包含該應用程式匯入的 `nsh/base` 元件與標準模組：以核心元件建構的應用程式約需下載 1.1 MB。語法醬色資料會在第一次醬色程式碼時載入。

<a id="what-runs-where"></a>

## 各部分在哪裡執行

頁面由套用 CSS 樣式的 HTML 元素組成。NSH 會將元件更新轉換為批次的 DOM 變更，而瀏覽器負責顯示介面並處理捲動、文字選取與輸入。WebAssembly 承載共用的 Rust 引擎，負責元件狀態、版面配置與更新：可與 Rust 應用程式編譯進來的 crate 一起執行，或搭配瀏覽器的 JavaScript 引擎，由後者以 ES 模組執行 TSX 應用程式的程式碼：已發佈的應用程式、開發伺服器的頁面、本網站的示範與 playground 皆是如此。

在每個原生平台上，引擎都有自己的執行緒，並在每次提交時將一個 `MountBatch` 交給主執行緒。瀏覽器頁面只有一個執行緒，因此 Web 版本會從頁面的事件迴圈逐步驅動同一個引擎（`nsh_engine::LocalEngine`）：

```text
pointer / keyboard / scroll events ─┐
setTimeout (the engine's deadline) ─┼─▶ nsh.wasm: engine turn (Rust or JS, core, layout) ─▶ one JSON batch ─▶ nsh.js: DOM
requestAnimationFrame ──────────────┘                                                 ▲
                                                          native animation outputs ───┘
```

- **版面配置由核心負責。** 每個檢視都是依 Taffy 計算出的框架進行絕對定位的元素，因此 flexbox、grid、`aspectRatio` 與百分比的行為與在裝置上完全相同。瀏覽器本身的版面配置不會參與。
- **樣式在 Rust 中轉換為 CSS。** 背景、邊框、圓角、陰影（`boxShadow`、`textShadow`）、漸層、濾鏡、`backdropFilter`、變形、`transformOrigin`、`outline`、`mixBlendMode`、轉場與內建的關鍵影格動畫都會成為 CSS 屬性。Tailwind 類別、`active:`、`hover:` 與 `focus:` 狀態以及 `dark:` 皆在原生端解析，與在裝置上相同。
- **文字在 Rust 中排版**，字型度量來自瀏覽器（`CanvasRenderingContext2D.measureText`），並依版面配置選定的位置逐段繪製，因此量測的結果就是繪製的結果。換行會發生在空格之後、CJK 字元前後以及 `\n`；`numberOfLines` 會以省略號截斷。
- **原生動畫在 Rust 中執行**於 `requestAnimationFrame`：`Animated` 時間、彈簧與衰減、`interpolate`、綁定到 `opacity`、`translate`、`rotate`、`scale` 的動畫值、`transform` 與 `backgroundColor` 的步驟、以 `pan` 綁定的拖曳、與捲動連動的值以及 canvas 引數。與在裝置上一樣，每個影格都不會涉及 JS。`LayoutAnimation`、樣式轉場、`animate-*` 關鍵影格與畫面轉場的行為與桌面後端相同，而 `prefers-reduced-motion` 會將它們關閉（畫面改為淡入淡出）。
- **輸入：** 帶有 `activeStyle` / `active:` 回饋的按壓與長按、responder 系統（`onTouch*`、`PanResponder`）、原生拖曳與雙指縮放及旋轉、捲動檢視（使用瀏覽器的捲動）、下拉重新整理、可縮放的捲動檢視（縮放、ctrl+滾輪與觸控板縮放，`zoomTo`）、具有受控值的 `<Input>`、焦點與提交、`Canvas`、`NavStack` 與 `NavPage`，搭配頁面的 `header`、`Dialog`。
- **系統 UI 繪製於頁面中：** `AlertDialog` 在桌面瀏覽器上看起來像桌面後端的對話框，在手機上則像 iOS 的對話框（採用 `desktop` 慣用形式，詳見下文）。自訂字型會在瀏覽器載入完成後重新量測，而應用程式會等待其匯入的字型載入完成後才顯示第一個影格。
- **對話框**是覆蓋整個應用程式的一層，用來顯示應用程式的彈出視窗與背景遮罩，與桌面後端相同。Escape、瀏覽器的返回按鈕以及按壓背景遮罩都會關閉對話框（`closeOnEscape`、`closeOnBackdropPress`），而 `animation`、`onOpen`、`onClose`、`onCancel` 與 `onOpenChange` 的運作方式與在裝置上相同。若頁面將[應用程式嵌入](#embed-it-in-a-page)其版面配置的一部分，則可改為在整個瀏覽器視窗上方顯示對話框與警示（`dialogs: "viewport"`），就像 iOS 與 Android 會在整個螢幕上方顯示它們一樣。

<a id="keyboard-mouse-and-touch"></a>

## 鍵盤、滑鼠與觸控

已發佈的應用程式在桌面瀏覽器中表現為桌面應用程式，在手機瀏覽器中則表現為手機應用程式：

- **滾輪與觸控板**會沿其軸向捲動仍可移動的最內層捲動檢視（當沒有任何可垂直捲動的檢視時，垂直滾輪會捲動水平清單），並在捲動結束前一直停留在該檢視上；滾輪刻度會平滑滑動，分頁與貼齊式檢視每次捲動移動一頁。Ctrl + 滾輪與觸控板縮放會以原生縮放值縮放檢視，而不是縮放頁面。如同桌面平台，以滑鼠拖曳不會捲動：滑鼠拖曳會交給平移、responder 系統與文字選取。捲動檢視會如同桌面平台一般回報 `onScrollDragStart` / `onScrollDragEnd`、`onMomentumStart` / `End` 與 `onScrollEnd`。
- **鍵盤**：Tab 與 Shift+Tab 在可按壓元素與輸入之間移動（應用程式的 `focus:` 樣式會顯示鍵盤焦點）；Return 會按下取得焦點的可按壓元素，Space 則在放開時按下；方向鍵、Page Up / Page Down、Space、Home 與 End 會捲動焦點周圍或滑鼠下方的捲動檢視；Escape 會離開欄位、關閉對話框，然後返回。`keymap` 快速鍵可在瀏覽器中運作，並即時比對（`mod` 在 Mac 上的 Safari 與 Chrome 為 Command，其他環境為 Control）。
- **返回**：Escape、Alt+Left（Mac 上為 Cmd+[）與滑鼠的返回按鈕會關閉最新的對話框或彈出最內層的堆疊，與 Android 的返回按鈕相同；`popOnBack` 與 `onBackPress` 的運作方式也與該處相同。當應用程式佔據整個頁面時，每個推入的頁面與開啟的對話框都是一筆瀏覽器歷史記錄，因此瀏覽器的返回按鈕會在應用程式內返回。
- **觸控**：只有捲動檢視會平移；頁面本身絕不會在應用程式下捲動、縮放或下拉重新整理，且點按沒有延遲。在 iframe 中，應用程式未處理的滑動會捲動嵌入它的頁面。在具有原生平移、縮放與 responder 系統的檢視上拖曳，則由應用程式處理。
- **無障礙**：`role`、`accessibilityLabel`、`accessibilityHint`、`accessibilityState`、`accessibilityValue`、`accessibilityLiveRegion` 與 `accessibilityElementsHidden` 會轉換為 ARIA；`announce` 透過 live region 朗讀，`setAccessibilityFocus` 則會移動焦點。對話框或警示下方的檢視為 inert。
- **選取與選單**：在桌面瀏覽器中，文字預設可選取，如同網頁，但互動元素（具有按壓或觸控處理常式的檢視：按鈕、可按壓的列、分頁標籤）內部以及帶有 `userSelect: "none"` 或 `select-none` 的文字除外；以滑鼠拖曳即可選取，Ctrl/Cmd+C 會逐行複製，Ctrl/Cmd+A 會選取選取範圍所在位置的全部文字。在手機與平板瀏覽器中，與原生應用程式相同，只有帶有 `userSelect: "text"` 的文字可選取。瀏覽器的右鍵選單只會出現在可選取的文字與輸入上。

<a id="apps-with-rust-components"></a>

## 使用 Rust 元件的應用程式

以 Rust 撰寫的應用程式（[使用 Rust 建構](./rust.md)）可從其目錄發佈並在瀏覽器中執行：

```sh
nsh package --target web           # .nsh/out/<Name>/: the app's own nsh.wasm, with its crate
nsh run --target web               # the dev server's page; editing the Rust code builds it again
```

當 `nsh.json` 指定應用程式的根元件（`"root"`）時，頁面僅包含應用程式的 Rust 與 NSH 的頁面指令碼，別無其他：`nsh.wasm` 包含引擎、元件與應用程式的 crate，網站沒有
`app.js`，而頁面會在執行階段與字型載入完成後立即掛載根元件。整個
Rust 圖庫為 3.3 MB（gzip 後 1.06 MB，brotli 後 0.75 MB），比 TSX 應用程式的執行階段還小。在其 TSX 進入點
（`nsh package App.tsx --target web`）之下，同一個應用程式會如同 TSX 應用程式一樣在瀏覽器的 JavaScript 引擎上執行，並匯入 crate 的
元件與模組。

無論採用哪種方式，crate 的資產（`assets!()`）都會與應用程式的資產一同發佈，且其字型會在第一個影格之前載入。
在 `nsh run --target web` 期間，變更 crate 的 Rust 程式碼會重新建置執行階段，而已開啟的頁面會自行載入；
TSX 的編輯仍為熱更新。開發用執行階段採增量建置，因此對 crate 的變更約一秒內即可就緒；
`nsh package` 則會建置針對大小最佳化的發佈版本。

在每個平台（包括 Web）上執行的 Rust 程式碼會使用引擎的服務：`fetch(url).await` 透過與 JS 的 `fetch` 相同的網路堆疊發出
HTTP 請求（此處為瀏覽器的堆疊，並遵循其 CORS 規則）；`timer`、
`set_timeout` 與 `set_interval` 用於等待；`nsh_core::time::Instant` 與 `nsh_core::time::unix_ms()` 用於讀取時鐘。
`background` 與 `blocking` 會在原生目標的執行緒上執行工作。

建置需要 Rust target 以及可編譯為 WebAssembly 的 clang，與執行階段本身的建置相同：
`rustup target add wasm32-unknown-unknown`，加上 `clang` 與 `llvm-ar`（在 macOS 上，需要 LLVM 工具鏈，例如
Homebrew 的 `llvm`，並透過 `CC_wasm32_unknown_unknown` 與 `AR_wasm32_unknown_unknown`）。

<a id="browser-apis-from-rust"></a>

### 從 Rust 呼叫瀏覽器 API

crate 可透過 [wasm-bindgen](https://wasm-bindgen.github.io/wasm-bindgen/) 及其
`web-sys` 與 `js-sys` crate，在 `#[cfg(target_arch = "wasm32")]` 之後呼叫瀏覽器自身的 API：WebSocket、`IndexedDB`、
剪貼簿、任何 Web API，以及 crate 自己的 JS（`#[wasm_bindgen(inline_js = …)]`、`module = "/js/…"`）。當
應用程式的 Web 執行階段以這種方式呼叫 JS（包括 `JsValue` 轉換）時，`nsh` 會對其執行 `wasm-bindgen` CLI，並
將其膠合程式碼與 crate 的 JS 一併放在執行階段旁，開發與已發佈的網站皆是如此。CLI 的版本與執行階段所連結的 `wasm-bindgen`
crate 相同，由 `nsh` 指定：`cargo install wasm-bindgen-cli --version <version> --locked` 會安裝它
（`NSH_WASM_BINDGEN` 可指定 `PATH` 以外位置的 CLI）。若執行階段連結了 wasm-bindgen 卻沒有透過它呼叫任何 JS
（例如經由相依套件的預設功能），則其建置方式與其他執行階段相同。

crate 會以 `web-sys` 功能指定其使用的 API，而固定 `wasm-bindgen` 可讓其版本（以及 CLI 的版本）在每次建置之間保持一致：

```toml
[target.'cfg(target_arch = "wasm32")'.dependencies]
wasm-bindgen = "=0.2.129"
web-sys = { version = "0.3", features = ["WebSocket", "MessageEvent"] }
futures-channel = "0.3"
```

瀏覽器的回呼（抵達的訊息、頁面的計時器）會喚醒應用程式的任務，任務會立即執行：

```rust
#[cfg(target_arch = "wasm32")]
async fn echo(url: &str, text: String) -> Result<String, String> {
    use wasm_bindgen::{JsCast, prelude::*};
    let ws = web_sys::WebSocket::new(url).map_err(|e| format!("{e:?}"))?;
    let (tx, rx) = futures_channel::oneshot::channel();
    let tx = std::cell::RefCell::new(Some(tx));
    let on_message = Closure::<dyn FnMut(web_sys::MessageEvent)>::new(move |e: web_sys::MessageEvent| {
        if let (Some(tx), Some(data)) = (tx.borrow_mut().take(), e.data().as_string()) {
            let _ = tx.send(data);
        }
    });
    ws.set_onmessage(Some(on_message.as_ref().unchecked_ref()));
    on_message.forget();
    let open = ws.clone();
    let on_open = Closure::<dyn FnMut()>::new(move || {
        let _ = open.send_with_str(&text);
    });
    ws.set_onopen(Some(on_open.as_ref().unchecked_ref()));
    on_open.forget();
    rx.await.map_err(|_| "closed".to_owned())
}
```

crate 對瀏覽器 API 的呼叫會以頁面自身的權限執行，就像 crate 的原生程式碼在其他平台上以應用程式的
權限執行一樣：`nsh.json` 的能力控管經由引擎的內容（`fetch`、應用程式的 JS），
而瀏覽器的規則（CORS、頁面的 Content-Security-Policy）則控管頁面發出的每個請求。

<a id="publish-an-app"></a>

## 發佈應用程式

```sh
# A Rust app, from its directory
nsh package --target web                   # .nsh/out/<Name>/: a static site
nsh package --target web --run             # and serve it on this machine (open the address it prints)

# A TSX app
nsh package App.tsx --target web
nsh package App.tsx --target web --run
```

`nsh package --target web` 會寫入 `.nsh/out/<Name>/`（使用 `--out` 可指定其他目錄），其配置如同前端建置：一個
頁面，以及以內容命名的檔案。

| 檔案 | 說明 |
|---|---|
| `index.html` | 應用程式的頁面：以其名稱作為標題、圖示、其 `appearance` 的顏色、載入指示器，以及應用程式無法載入或啟動時的訊息 |
| `manifest.webmanifest` | 瀏覽器用來安裝應用程式的名稱、id、圖示與顏色 |
| `nsh.<digest>.js` | DOM 執行階段，已最小化（79 KB，brotli 後 22.5 KB） |
| `nsh.<digest>.wasm` | Rust 引擎、版面配置與元件，加上 Rust 應用程式自己的 crate。TSX 在瀏覽器 JavaScript 中執行；打包時只會連結應用程式第一個畫面所匯入的元件與標準模組。 |
| `nsh-<name>.<digest>.wasm` | 應用程式第一個畫面之外所使用的元件、標準模組與著色器：在畫面顯示後於背景下載 |
| `<file>.br`、`<file>.gz` | 預先壓縮的每個檔案，供會傳送預壓縮檔案的主機使用 |
| `nsh-syntaxes.<digest>.bin` | 程式碼醬色所用的語法（bat 的集合：0.92 MB，brotli 後 0.8 MB），在程式碼區塊、`Editor` 或 `DiffView` 首次以某種語言顯示程式碼時下載 |
| `nsh-bindgen.<digest>.js` | 其 crate 呼叫[從 Rust 呼叫瀏覽器 API](#browser-apis-from-rust)之應用程式的 wasm-bindgen 膠合程式碼，已最小化 |
| `snippets.<digest>/<crate>-<hash>/…` | 膠合程式碼所匯入的這些 crate 的 JS（`inline_js`、`module = "/js/…"`），位於 wasm-bindgen 指定的路徑下 |
| `app.<digest>.js` | 已編譯的 TSX 進入點，為 ES 模組，由瀏覽器載入。 |
| `host.<digest>.js` | 頁面的主機，`nsh.json` `web.host`（[主機的函式](#the-hosts-functions)） |
| `<name>.<digest>.js` | 由 `import()` 按需載入的 ES 模組。 |
| `assets/<path>.<digest>.<ext>` | 應用程式匯入的每個資產，在使用時從其 URL 載入（字型會在註冊它們的程式碼執行之前載入，因為文字是以它們量測的：在應用程式啟動之前，或隨匯入它們的 chunk 一起載入） |
| `icons/<size>.<digest>.png` | `nsh.json` 的圖示，尺寸為 32（favicon）、180（`apple-touch-icon`）、192 與 512 像素 |

`<digest>` 是檔案內容 SHA-256 的開頭部分：檔案名稱只有在其內容改變時才會改變，因此
新版本只會變更 `index.html` 以及真正有變更的檔案。所有項目皆使用相對 URL，因此網站
可從任何主機的任何目錄運作（`https://example.com/apps/counter/`）。
<a id="runtime-size"></a>

### 執行階段大小

打包時會為每個應用程式連結專屬的 `nsh.<digest>.wasm`，其中包含引擎，以及應用程式第一個畫面所匯入的 `nsh/base` 元件、標準模組與著色器（shader）。應用程式其他畫面所匯入的內容，會在第一個畫面顯示後於背景下載。若應用程式的 crate 會[從 Rust 呼叫瀏覽器 API](#browser-apis-from-rust)，其 `nsh.<digest>.wasm` 會包含完整的執行階段（含其 crate）。以 `nsh package --target web` 測量（MB = 10^6 位元組）：

| 應用程式 | 使用內容 | `nsh.<digest>.wasm` | gzip | Brotli |
|---|---|---|---|---|
| `examples/counter` | 核心元件 | 3.96 MB | 1.32 MB | 0.97 MB |
| `examples/gallery` | 所有元件、`zlib` 與著色器 | 4.13 MB | 1.36 MB | 1.01 MB |

<a id="deploy-it"></a>

### 部署

將目錄上傳到任何靜態主機：CDN 後方的物件儲存、Cloudflare Pages、Netlify、GitHub Pages、nginx。以下兩項規則可讓它載入快速且更新可靠：

| 檔案 | `Cache-Control` |
|---|---|
| `index.html`、`manifest.webmanifest` | `no-cache`（每次載入都會重新驗證，因此新版本會立即生效） |
| 其他所有檔案 | `public, max-age=31536000, immutable` |

請將 `.wasm` 以 `application/wasm` 提供（瀏覽器便能在下載的同時進行編譯），並將預先壓縮的副本傳送給支援的瀏覽器：nginx 的 `brotli_static on; gzip_static on;`、Caddy 的 `file_server {
precompressed br gzip }`，或使用 Brotli 壓縮的 CDN。使用 Brotli 時，執行階段的大小約比 gzip 小四分之一。`nsh package --target web --run` 就是以這種方式在 `http://127.0.0.1:4173/` 提供網站。

為網頁發佈的應用程式，其執行方式與打包後的原生應用程式相同：以正式版（release）執行，具備其 `nsh.json` 所宣告的權限（[沙盒與權限](./sandbox-and-capabilities.md)），TSX 應用程式則在瀏覽器的 JavaScript 引擎上執行。當這些權限限制了 `network` 時，頁面還會帶有 Content-Security-Policy `connect-src`，其中列出所宣告的主機（以及頁面本身的來源），因此瀏覽器本身會拒絕對任何其他主機的請求與重新導向跳轉。導致應用程式無法啟動的錯誤會顯示在頁面上；之後的錯誤則會輸出到瀏覽器的主控台。

<a id="embed-it-with-an-iframe"></a>

### 以 iframe 嵌入

網頁上沒有嵌入 API：請以 `<iframe>` 嵌入已發佈的應用程式。其大小即為應用程式的視窗：

```html
<iframe src="https://apps.example.com/counter/" title="Counter"
        style="width: 390px; height: 844px; border: 0"></iframe>
```

<a id="develop-in-the-browser"></a>

## 在瀏覽器中開發

```sh
nsh run --target web               # a Rust app, from its directory
nsh run App.tsx --target web       # a TSX app
```

會啟動開發伺服器並印出其頁面的位址 `http://127.0.0.1:8790/`：請在任何瀏覽器中開啟。此頁面與其他開發宿主一樣：它會執行應用程式的每一次建置，將建置錯誤與執行階段錯誤顯示在應用程式上方，並將應用程式的日誌傳送到終端機。變更 Rust 應用程式的 crate 會重新建置其執行階段，已開啟的頁面會自動載入；TSX 的編輯則會就地套用（熱更新）。同一網路上的手機可開啟 `nsh run` 在其下方印出的位址（`on this network: http://192.168.…:8790/`）。一旦有 Web 執行階段（在發行版中一律具備），`nsh dev` 就會提供相同的頁面。

<a id="build-the-websites-player"></a>

## 建置網站的播放器

```sh
cargo xtask web                       # nsh.wasm, nsh.js, the player and website/demos/*.tsx
cargo xtask web --out target/play     # somewhere else
```

輸出目錄包含：

| 檔案 | 說明 |
|---|---|
| `gallery/nsh.<digest>.wasm` | Gallery 的執行階段，由 `nsh package` 為其連結（使用所有元件與 `zlib`：約 11.8 MB，gzip 後 3.6 MB） |
| `gallery/nsh-syntaxes.<digest>.bin` | 執行階段用來醒目提示程式碼的語法，在示範首次顯示某種語言的程式碼時才會擷取 |
| `nsh-playground.wasm` | 同上，另加 NSH 的 TSX 編譯器，供 [playground](#the-playground) 使用（約 8 MB，gzip 後 2.4 MB） |
| `gallery/nsh.<digest>.js` | DOM 執行階段（已壓縮）：載入 wasm、套用批次更新，並將輸入轉換為事件 |
| `index.html` | 播放器頁面：為 `#<name>` 執行 `demos/<name>.js` |
| `nsh.wasm`、`nsh.js`、`browser/` | 播放器載入的執行階段：引擎、DOM 執行階段與瀏覽器宿主的模組 |
| `demos/<name>.js` | 由 `nsh build --release` 編譯的每個示範：一個 ES 模組 |
| `gallery/` | 以 `nsh package --target web` 發佈的 Gallery 應用程式，顯示於 [Gallery](/gallery) 頁面 |

請以任何靜態伺服器提供此目錄（串流編譯需要 `application/wasm` MIME 類型），然後開啟 `index.html#counter`。

<a id="the-playground"></a>

## Playground

[Playground](/playground) 可在瀏覽器中編輯並執行應用程式：頁面會以 NSH 自己的 JSX 編譯器（內建於 `nsh-playground.wasm`，不使用 rolldown）編譯 TSX，並在每次停止輸入時於瀏覽器的 JavaScript 引擎上執行。本站的每個示範都有 **Edit in Playground** 連結，而 **Share** 會將程式碼放進連結本身，因此不會在伺服器上儲存任何內容。

Playground 應用程式是單一模組：它可匯入 NSH 的模組（`nsh` 與 `nsh/*`），但不能匯入其他檔案或套件。`console.log` 的輸出與錯誤會顯示在手機下方。

此編譯器同時也是一個 Rust 函式 `nsh_bundler::compile_module(name, source, ui_sets)`，不需啟用該 crate 的 `bundle` 功能即可使用。

<a id="embed-it-in-a-page"></a>

## 嵌入頁面

Rust 應用程式會以其已發佈的網站嵌入，使用 [iframe](#embed-it-with-an-iframe)。對於 TSX，`nsh.js` 是一個 ES 模組。`createPlayer` 會將執行階段載入容器；`runModule(url)` 會啟動由 `nsh build` 寫出的 bundle（`bundle.js`，一個 ES 模組），在瀏覽器的 JavaScript 引擎上、於應用程式專屬的 realm 中執行，並取代原本執行的內容。它會回傳一個 promise，在模組載入完成後 resolve，並以使其停止的錯誤 reject，播放器也會回報該錯誤（`onError`）：

```js
import { createPlayer } from "./nsh.js";

const player = await createPlayer(document.querySelector("#phone"), {
  wasm: "./nsh.wasm",
  assetBase: "./assets/",   // where `asset:/…` URIs (image imports) are served from
  // dark: true,            // force an appearance; otherwise it follows the system
  // idiom: "phone",        // force "phone", "pad" or "desktop"; otherwise the pointer and the size decide
  // history: false,        // pages and dialogs as browser history entries; by default only when the app is the page, not in an iframe
  // dialogs: "viewport",   // Dialog, Sheet and AlertDialog over the whole browser window; by default over the container
});
await player.runModule(new URL("./bundle.js", location.href).href);
```

`assets`（從 `asset:/` 路徑對應到 URL 的對照表）會取代 `assetBase`，`readAsset(uri)` 會回傳引擎需要立即取得的資源（如字型）的位元組，或 `null`，`data` 會將執行階段首次需要時才擷取的檔案對應到其 URL（`syntaxes`：`nsh-syntaxes.<digest>.bin`；預設為 `nsh.js` 旁的 `nsh-<name>.bin`），而 `glue` 是執行階段 wasm-bindgen glue 的 URL，該執行階段的 crate 會呼叫[從 Rust 呼叫瀏覽器 API](#browser-apis-from-rust)（`nsh-bindgen.<digest>.js`），播放器會隨執行階段一併載入；`player.runModule(url, { capabilities, appId })` 會依應用程式所宣告的權限（其 `capabilities.json`）執行應用程式，並將其儲存空間保存在其 `nsh.json` ID 之下（若沒有 ID，則保存在頁面的路徑之下）。`nsh package --target web` 寫出的頁面會用到以上所有項目。

`runModule(url, { chunks })` 也接受[分割 bundle](#split-bundles) 的各個 chunk 所在位置。

`player.runSource(code, { name, sourceMap, capabilities, appId })` 會執行以原始碼文字給定的 ES 模組，選項相同。搭配 `nsh-playground.wasm` 時，`player.compileAndRun(tsx, name, options)` 會先編譯 TSX，以 `runSource` 的選項執行，並 resolve 為編譯錯誤，或 `null`；`player.compile(tsx)` 會回傳 `{ code }` 或 `{ error }`。

容器的大小即為應用程式的視窗（`windowSize()`）；調整容器大小也會調整應用程式大小。`player.setDark(true)` 可在執行階段切換外觀，應用程式可透過 `colorScheme()` 與 `dark:` 類別觀察到變化。

對話框與警示會覆蓋容器。使用 `dialogs: "viewport"` 時，它們會覆蓋整個瀏覽器視窗，如同頁面自己的強制回應對話框，而應用程式仍以容器作為其視窗：`Dialog` 會以視窗的大小與安全區域進行版面配置，並從其底部邊緣滑入，其背景遮罩會覆蓋整個頁面，且在其上滾動滑鼠滾輪不會使頁面移動。對話框會顯示在瀏覽器的最上層（top layer，Chrome 114、Safari 17、Firefox 125 及之後版本），因此無論容器位於何處，都會位於頁面其餘內容之上；在較早的瀏覽器中，則只會覆蓋容器。

`Sheet` 與 `Dialog` 和 `AlertDialog` 遵循相同的呈現設定。在同源的 iframe 中，視口（viewport）呈現會自動覆蓋外層頁面，而應用程式仍保持其原本的版面大小。當最後一個彈出視窗關閉時，iframe 會回到其原本的位置與大小；其引擎與狀態會持續保留。文件中的示範皆啟用了此呈現方式。

對於跨來源或沙盒化的 iframe，嵌入頁面須在載入播放器之前註冊宿主：

```js
import { hostPlayerFrame } from "./nsh.js";
const frame = document.querySelector("iframe");
const disconnect = hostPlayerFrame(frame);
frame.src = "https://apps.example.com/player.html"; // player uses dialogs: "viewport"
// When removing the embedding: disconnect();
```

宿主會接受來自此 iframe 視窗的請求，在彈出視窗顯示期間讓周圍的頁面保持惰性並鎖定其捲動，並在關閉時還原兩者。每一層跨來源的嵌入邊界都需要其宿主的配合；若無配合，呈現會維持在該文件之內，且播放器會回報警告。

<a id="the-hosts-functions"></a>

## 宿主的函式

在網頁上，頁面就是應用程式的宿主：它會回應 [`host`](../modules/nsh.md#host) 的 `host.call(name, args)`，並傳送 `host.on` 所監聽的事件。`createPlayer` 的 `host` 是一個物件，其 `call(name, args)` 會回傳結果或結果的 promise；擲出例外或 reject 會使應用程式的呼叫以該錯誤的訊息 reject。`player.hostEvent(event, payload)` 會傳送帶有 JSON 酬載的事件（非 JSON 的酬載會擲出例外）。有 `host` 時，`host.available()` 為 `true`。

```js
const player = await createPlayer(container, {
  wasm: "./nsh.wasm",
  host: {
    async call(name, args) {
      if (name === "user.info") return { name: "Ada" };
      throw new Error(`no host function ${name}`);
    },
  },
});
player.hostEvent("theme", { dark: true });
```

已發佈的應用程式會從 `nsh.json` 取得其宿主：`web.host` 指定應用程式目錄中的一個 JS 模組（相對於 `nsh.json`），並由它匯出 `createHost(player)`。`nsh package --target web` 會將其以 `host.<digest>.js` 之名複製到網站中，頁面會在應用程式啟動前，連同播放器一起執行 `createHost`；其回傳（或 resolve）的內容必須具有 `call` 函式，否則頁面會顯示應用程式無法載入。播放器 `createHost` 自此起會接收傳送的事件：

```json
{
  "capabilities": {
    "host": ["user.*"]
  },
  "web": { "host": "./host.js", "connect": ["api.example.com"] }
}
```

```js
// host.js
const post = (url) => (args) =>
  fetch(url, { method: "POST", body: JSON.stringify(args) }).then((r) => r.json());

// The functions the app may call, by their exact names.
const functions = new Map([
  ["user.info", post("https://api.example.com/user/info")],
  ["user.settings", post("https://api.example.com/user/settings")],
]);

export async function createHost(player) {
  addEventListener("online", () => player.hostEvent("online", {}));
  return {
    call(name, args) {
      const f = functions.get(name);
      if (!f) throw new Error(`no host function ${name}`);
      return f(args);
    },
  };
}
```

宿主會依名稱原樣在其函式表中查找，如上所示，並讓其 URL 與路徑保持為自己所有：`capabilities.host` 是依名稱的開頭授予權限（`user.*`），因此若宿主將名稱轉換成路徑，就可能觸及授權範圍之外的內容。執行階段會放行長度為 1 到 128 個字元、由 `A`–`Z`、`a`–`z`、`0`–`9`、`_`、`.`、`:` 與 `-` 組成且不含 `..` 的名稱，並拒絕任何其他名稱的呼叫。前綴授權以分隔符號結尾（`bridge.*`）：`bridge*` 也會比對到 `bridgeAdmin`。

在應用程式執行之前傳送的事件，例如來自 `createHost` 本身的事件，會在其啟動後立即依序傳遞，因此應用程式頂層的 `host.on` 監聽器可以收到它們。在監聽器註冊之前傳送的事件不會重新傳送給它：應用程式應透過呼叫（`host.call("user.info")`）讀取其起始狀態，並透過事件追蹤其變化。

宿主模組在應用程式的頁面中執行，並共用其 Content-Security-Policy：當應用程式的權限限制了 `network` 時，頁面的 `connect-src` 會包含頁面的來源、`capabilities.network` 列出的主機，以及 `web.connect` 列出的主機。`web.connect` 指定宿主模組自己的請求（`fetch`、`XMLHttpRequest`、`WebSocket`）可到達的主機，其模式與 `capabilities.network.hosts` 相同（`api.example.com`、`*.example.com`、`"*"`），如上方的 `api.example.com`；應用程式自己的請求仍依其 `capabilities` 檢查。

模組會原樣複製，因此它以絕對 URL 匯入其他程式碼。應用程式對其呼叫的每個函式，仍需要其 `host` [權限](./sandbox-and-capabilities.md)。`nsh run --target web` 會在開發頁面上執行它，而 `nsh test` 會為其測試所開啟的每個應用程式（無頭模式或在瀏覽器中，`--target web`）執行同一個模組，因此應用程式與其宿主會一起接受測試（[測試](./testing-and-trace.md#the-pages-host)）。

<a id="the-browser-as-a-platform"></a>

## 作為平台的瀏覽器

`platform.os` 是 `"web"`。瀏覽器所在的裝置類型決定應用程式的行為，如 `platform.idiom`：

- `"desktop"`：使用滑鼠（可懸停的精確指標）且容器寬度至少 600 點。`platform.desktop` 為 `true`，`platform.select` 選擇 `desktop`，並套用 `desktop={{…}}` 屬性。
- `"pad"`：短邊至少 600 點的觸控螢幕；否則為 `"phone"`。這些屬於行動裝置：`platform.select` 選擇 `mobile`。

慣用型態（idiom）在應用程式啟動時決定，並在其執行期間保持不變，與所有平台相同；窄的桌面視窗仍然是桌面，會依其 `windowSize()` 進行版面配置。`web={{…}}` 屬性、`platform.select({ web })` 與 `web:` 類別僅適用於瀏覽器；`ios={{…}}`、`native` 與 `ios:` 不適用於瀏覽器。

頁面會回報其餘的環境資訊，並保持其為最新：

| 值 | 來自瀏覽器 |
|---|---|
| 地區設定（`Intl` 的預設值） | `navigator.languages[0]` |
| 時區（`Date` 的本地時間、`Intl` 的預設 `timeZone`） | 瀏覽器的時區（`Intl.DateTimeFormat().resolvedOptions().timeZone`），包含日光節約時間 |
| 版面方向（`rtl:` / `ltr:`） | 有設定時取自 `<html dir>`，否則取自地區設定的文字書寫系統 |
| `reduceMotion()` | `prefers-reduced-motion` |
| `fontScale()` | 根元素的字型大小 / 16 px（瀏覽器的文字大小設定） |
| `pixelRatio()` | `devicePixelRatio`（會隨縮放與螢幕而改變） |
| `colorScheme()` | `prefers-color-scheme` |
| `safeArea()` | `env(safe-area-inset-*)` 與容器重疊之處（手機上的 `viewport-fit=cover` 頁面） |
| `keyboardFrame()` | 螢幕鍵盤覆蓋容器的程度（`visualViewport`） |

`platform.version` 為 `"0.0"`，而 `screenReaderEnabled()` 維持 `false`（瀏覽器不會告知）。頁面周圍的瀏覽器工具列屬於瀏覽器；頁面的 [`statusBar`](../modules/nsh-base.md#status-bar) 是為手機而設。
<a id="networking"></a>

## 網路

`fetch`（包含串流、`AbortController` 與 `FormData`）以及 `<Image>` 的 URL 都會經由瀏覽器自身的網路堆疊處理，而在這之前 NSH 會先檢查應用程式的[權限](./sandbox-and-capabilities.md)。由於這些請求是由瀏覽器發出的，因此適用瀏覽器的規則：

- **相對 URL** 與瀏覽器一樣，會以頁面的 URL 作為基準來解析：已發佈的應用程式可用 `fetch("/api/items")` 存取自己的 API，`<Image src="/photos/a.jpg" />` 則從自己的伺服器載入。（原生平台沒有頁面，因此需要使用絕對 URL。）
- **CORS。** 對頁面以外的其他來源發出的請求，只有在該伺服器允許頁面的來源（`Access-Control-Allow-Origin`）時才會成功；否則 `fetch` 會以網路錯誤拒絕。只有伺服器公開的回應標頭才看得到。
- **Cookie**（以及 HTTP 驗證）只會傳送給頁面自身的來源（`credentials: "same-origin"`），而瀏覽器禁止的標頭（`Cookie`、`User-Agent`、`Host` 等）會被捨棄。
- **重新導向**由瀏覽器自動跟隨。若請求被重新導向後不應該繼續跟隨，則該請求會失敗：`redirect: "manual"` 與 `"error"`，以及應用程式的權限限制了 `network` 的請求（NSH 會檢查每一次跳轉，而瀏覽器在跟隨重新導向之前不會透露該次重新導向）。
- **請求本文**若為 `ReadableStream`，會先全部收集後再一次性送出；回應本文則會在抵達時以串流方式處理。

<a id="split-bundles"></a>

## 拆分的 bundle

TSX 網頁應用程式不需要在顯示第一個畫面之前就下載全部程式碼（Rust 應用程式則是單一的 `nsh.wasm`，瀏覽器會在下載的同時進行編譯）。`nsh package --target web` 會以拆分的方式發佈 TSX 應用程式，每個 chunk 都是 `<name>.<digest>.js`，並由頁面將 chunk 對應到這些檔案。若要自行拆分 bundle，`nsh build --split` 會把 `import()` 載入的模組放入各自獨立的 chunk，與 `bundle.js` 並列：

```sh
nsh build --release --split -o site/app
# bundle.js        the app up to its first screen
# Screen.js        import("./Screen") and what only it uses
# detail.js        what two chunks share, when they do (made by the bundler)
```

第一次 `import("./Screen")` 會一次下載 `Screen.js` 及其所匯入的 chunk，接著再進行求值；之後對它的匯入會立即完成解析。頁面會指定 chunk 的位置：預設為與 bundle 放在一起，或是每個 chunk 各自指定一個 URL，用於以內容摘要重新命名的檔案，讓 CDN 可以永久快取：

```js
await player.runModule(entry, {
  chunks: { "Screen.js": "/app.3f2a9c.js", "detail.js": "/app.81bb07.js" },
});
```

無法下載的 chunk 會使 `import()` 以指出該 chunk 的 `TypeError` 拒絕；下一次 `import()` 會再次嘗試。Chunk 名稱是 bundle 中固定的檔案名稱：應用程式無法讓頁面下載任何其他內容。

[範例庫](/gallery)就是以這種方式載入每個示範：`lazy`（位於 `examples/gallery/ui.tsx`）會建立一個元件，在第一次渲染時開始匯入，在匯入完成前顯示佔位內容，完成後再渲染所載入的內容。它的第一次載入包含索引以及最先顯示的示範；示範所匯入的字型會隨該示範的 chunk 一起載入。原生建置包含所有模組，因此在原生平台上匯入會立即完成解析：

```tsx
const Stocks = lazy(() => import("./demos/Stocks").then((m) => m.Stocks));
```

<a id="limits"></a>

## 限制

以下由瀏覽器決定，Web 後端會遵循瀏覽器的行為：

- **其他網站的 Web view**：`WebView` 是一個 `<iframe>`。內嵌 HTML（`html`）可使用全部功能：`onMessage`、`postMessage`、`injectJavaScript`、注入的腳本與載入事件（它以自己獨立的來源執行，與頁面分離）。其他網站的頁面則只有 `postMessage` 以及帶有所給定 URL 的載入事件：瀏覽器會對外圍的頁面隱藏它的導覽、標題、歷史紀錄與錯誤，而且無法設定 `userAgent`。
- **自動開始播放且帶有聲音的影片**：`Video` 是一個具備所有屬性與事件的 `<video>`，但瀏覽器只有在使用者手勢之後才會開始播放帶有聲音的影片（靜音影片則可播放）。
- **原生元件**：已註冊的原生元件屬於嵌入 NSH 的原生應用程式；在 Web 上它們的檢視會保持空白，並在主控台顯示警告。
- **平台服務**：讀取剪貼簿（`Clipboard.readText`，以及 `hasText`）需要安全環境（HTTPS），並可能會詢問使用者。圖片不會回報 `onProgress`。
- **文字排版細節**：換行規則是 UAX #14 的子集（空格、CJK、連字號，以及 CJK 標點符號的行首與行尾規則：`。`、`，` 與 `」` 等結束標點不會出現在行首，`（` 與 `「` 等開始標點不會出現在行尾），不支援斷字連接，也不支援段落方向以外的雙向重新排序。

播放器與開發伺服器會以開發設定執行應用程式；已發佈的應用程式則以正式版本執行。兩者都會在瀏覽器的 JavaScript 引擎上，於應用程式專屬的 realm 中執行 TSX 應用程式的程式碼。

<a id="see-also"></a>

## 另請參閱

- [Packaging](./packaging.md)：`nsh package` 的其他目標。
- [Architecture](./architecture.md)：Web 建置所重用的引擎、核心與掛載批次。
- [Testing](./testing-and-trace.md)：`nsh test` 以近似的文字引擎，以無頭模式執行相同的引擎。
