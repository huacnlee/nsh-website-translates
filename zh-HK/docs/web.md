---
title: "Web"
description: "以 Rust 或 TSX 建立網頁應用程式,Native Shell 元件會渲染為 HTML 及 CSS,可直接在瀏覽器中開發,並發佈至任何靜態主機或 CDN。"
order: 16
group: platforms
demo: counter
source_hash: 3d223070a2f7ac3d
---


# Web

使用與原生平台相同的元件、樣式和應用程式邏輯，以 Native Shell 建構網頁應用程式。NSH 把介面渲染成 HTML 元素和 CSS：文字、圖片、輸入、捲動、視覺樣式和互動都使用瀏覽器的 DOM 和 Web API。

`nsh package --target web` 會把應用程式發佈為靜態網站，可放在任何網頁伺服器或 CDN 上（[發佈應用程式](#publish-an-app)），而 `nsh run --target web` 會在你編輯時於瀏覽器中執行應用程式（[在瀏覽器中開發](#develop-in-the-browser)）。本網站上的所有即時示範都使用此 web 後端。

已發佈的 TSX 應用程式使用瀏覽器的 JavaScript 引擎。打包時會為每個應用程式連結專屬的執行環境，只包含該應用程式匯入的 `nsh/base` 元件和標準模組：只使用核心元件建構的應用程式，下載大小約為 1.1 MB。語法突顯資料會在首次突顯程式碼時載入。

<a id="what-runs-where"></a>

## 各部分在哪裡運行

頁面由套用 CSS 樣式的 HTML 元素構成。NSH 把元件更新轉換成一批批 DOM 變更，而瀏覽器負責顯示介面，並處理捲動、文字選取和輸入。WebAssembly 承載共用的 Rust 引擎，負責元件狀態、版面配置和更新：若是 Rust 應用程式，會連同其 crate 一併編譯；若是 TSX 應用程式，則與瀏覽器的 JavaScript 引擎並行，後者以 ES 模組形式執行應用程式的程式碼。已發佈的應用程式、開發伺服器的頁面、本網站的示範和 playground 都是如此。

在每個原生平台上，引擎都有自己的執行緒，並在每次提交時把一個 `MountBatch` 交給主執行緒。瀏覽器頁面只有一條執行緒，因此 web 版本會從頁面的事件迴圈逐步驅動同一個引擎（`nsh_engine::LocalEngine`）：

```text
pointer / keyboard / scroll events ─┐
setTimeout (the engine's deadline) ─┼─▶ nsh.wasm: engine turn (Rust or JS, core, layout) ─▶ one JSON batch ─▶ nsh.js: DOM
requestAnimationFrame ──────────────┘                                                 ▲
                                                          native animation outputs ───┘
```

- **版面配置由核心負責。** 每個視圖都是一個絕對定位的元素，位置和大小取自 Taffy 計算出的框架，因此 flexbox、grid、`aspectRatio` 和百分比的行為與在裝置上完全一致。瀏覽器自身的版面配置並不參與。
- **樣式在 Rust 中轉換成 CSS。** 背景、邊框、圓角、陰影（`boxShadow`、`textShadow`）、漸層、濾鏡、`backdropFilter`、變形、`transformOrigin`、`outline`、`mixBlendMode`、轉場和內建的關鍵影格動畫，都會變成 CSS 屬性。Tailwind class、`active:`、`hover:` 和 `focus:` 狀態以及 `dark:`，全都與在裝置上一樣以原生方式解析。
- **文字在 Rust 中排版**，字型量度取自瀏覽器（`CanvasRenderingContext2D.measureText`），並按版面配置選定的位置逐段繪製，因此量度的結果就是繪製的結果。換行會發生在空格之後、CJK 字元前後以及 `\n` 處；`numberOfLines` 會以刪節號截斷文字。
- **原生動畫在 Rust 中運行**，基於 `requestAnimationFrame`：`Animated` 時間曲線、彈簧和衰減、`interpolate`、綁定到 `opacity`、`translate`、`rotate`、`scale` 的動畫數值、`transform` 和 `backgroundColor` 的步驟、以 `pan` 綁定的拖曳、與捲動連動的數值和 canvas 參數。與在裝置上一樣，每一影格都不涉及 JS。`LayoutAnimation`、樣式轉場、`animate-*` 關鍵影格和畫面轉場的移動方式與桌面後端相同，而 `prefers-reduced-motion` 會將它們關閉（畫面改為淡入淡出）。
- **輸入：**帶有 `activeStyle` / `active:` 回饋的按下和長按、responder 系統（`onTouch*`、`PanResponder`）、原生拖曳、雙指縮放和旋轉、捲動視圖（使用瀏覽器的捲動）、下拉重新整理、可縮放的捲動視圖（縮放、ctrl+滾輪和觸控板縮放、`zoomTo`）、帶有受控值的 `<Input>`、焦點和提交、`Canvas`、`NavStack` 和 `NavPage`（配合頁面的 `header`、`Dialog`）。
- **系統 UI 繪製在頁面中：**`AlertDialog` 在桌面瀏覽器上看起來像桌面後端的對話框，在手機上則像 iOS 的對話框（採用 `desktop` 慣例，見下文）。自訂字型會在瀏覽器載入後重新量度，而應用程式會等待它匯入的字型載入完成後才顯示第一個影格。
- **對話框**是覆蓋整個應用程式的一個圖層，顯示應用程式的彈出內容和背景遮罩，與桌面後端相同。Escape、瀏覽器的返回按鈕和按下背景遮罩都會關閉對話框（`closeOnEscape`、`closeOnBackdropPress`），而 `animation`、`onOpen`、`onClose`、`onCancel` 和 `onOpenChange` 的運作方式與在裝置上相同。如果頁面把[應用程式內嵌](#embed-it-in-a-page)在版面的某個部分，可以改為在整個瀏覽器視窗之上顯示對話框和提示（`dialogs: "viewport"`），就像 iOS 和 Android 在整個螢幕上顯示它們一樣。

<a id="keyboard-mouse-and-touch"></a>

## 鍵盤、滑鼠和觸控

已發佈的應用程式在桌面瀏覽器中表現為桌面應用程式，在手機瀏覽器中則表現為手機應用程式：

- **滾輪和觸控板**會捲動沿其軸向仍可移動的最內層捲動視圖（沒有任何垂直方向可捲動時，垂直滾輪會捲動水平清單），並停留在該視圖上直至捲動結束；滾輪的每一格會平滑滑動，分頁和吸附式視圖每次捲動移動一頁。Ctrl + 滾輪和觸控板縮放會以原生縮放值縮放視圖，而不是縮放頁面。與桌面平台一樣，以滑鼠拖曳不會捲動：滑鼠拖曳會交給平移、responder 系統和文字選取。捲動視圖會與桌面平台一樣回報 `onScrollDragStart` / `onScrollDragEnd`、`onMomentumStart` / `End` 和 `onScrollEnd`。
- **鍵盤**：Tab 和 Shift+Tab 在可按下元素和輸入欄位之間移動（應用程式的 `focus:` 樣式會顯示鍵盤焦點）；Return 會按下取得焦點的可按下元素，Space 在放開時按下；方向鍵、Page Up / Page Down、Space、Home 和 End 會捲動焦點周圍或滑鼠下方的捲動視圖；Escape 會離開欄位，其次關閉對話框，然後返回。`keymap` 快速鍵可在瀏覽器中使用，並即時比對（`mod` 在 Mac 上的 Safari 和 Chrome 中是 Command，其他情況下是 Control）。
- **返回**：Escape、Alt+Left（Mac 上為 Cmd+[）和滑鼠的返回按鈕會關閉最新的對話框，或彈出最內層的堆疊，與 Android 返回按鈕的做法相同；`popOnBack` 和 `onBackPress` 的運作方式也與該平台相同。當應用程式佔據整個頁面時，每個推入的頁面和每個開啟的對話框都是一個瀏覽器歷史記錄項目，因此瀏覽器的返回按鈕會在應用程式內返回。
- **觸控**：只有捲動視圖會平移；頁面本身絕不會在應用程式底下捲動、縮放或下拉重新整理，點按也沒有延遲。在 iframe 中，應用程式不處理的滑動會捲動嵌入它的頁面。在具有原生平移、縮放和 responder 系統的視圖上的拖曳，則由應用程式處理。
- **無障礙**：`role`、`accessibilityLabel`、`accessibilityHint`、`accessibilityState`、`accessibilityValue`、`accessibilityLiveRegion` 和 `accessibilityElementsHidden` 會轉換成 ARIA；`announce` 透過 live region 朗讀，而 `setAccessibilityFocus` 會移動焦點。對話框或提示底下的視圖處於 inert 狀態。
- **選取和選單**：在桌面瀏覽器中，文字預設可以選取，與網頁一樣，但互動元素（帶有按下或觸控處理程式的視圖：按鈕、可按下的列、分頁標籤）以及帶有 `userSelect: "none"` 或 `select-none` 的文字除外；以滑鼠拖曳經過文字即可選取，Ctrl/Cmd+C 會逐行複製，Ctrl/Cmd+A 會選取目前選取範圍所在位置的全部文字。在手機和平板瀏覽器中，與原生應用程式一樣，只有帶有 `userSelect: "text"` 的文字可以選取。瀏覽器的右鍵選單只會在可選取的文字和輸入欄位中出現。

<a id="apps-with-rust-components"></a>

## 使用 Rust 元件的應用程式

以 Rust 編寫的應用程式（[以 Rust 建構](./rust.md)）可以從其目錄發佈並在瀏覽器中執行：

```sh
nsh package --target web           # .nsh/out/<Name>/: the app's own nsh.wasm, with its crate
nsh run --target web               # the dev server's page; editing the Rust code builds it again
```

當 `nsh.json` 指定應用程式的根元件（`"root"`）時，頁面只包含應用程式的 Rust 和 NSH 的頁面指令碼，此外別無他物：`nsh.wasm` 包含引擎、元件和應用程式的 crate，網站沒有 `app.js`，而頁面會在執行環境和字型載入完成後立即掛載根元件。整個 Rust 圖庫為 3.3 MB（gzip 後 1.06 MB，brotli 後 0.75 MB），比 TSX 應用程式的執行環境還要小。在其 TSX 入口（`nsh package App.tsx --target web`）下，同一個應用程式會像 TSX 應用程式一樣在瀏覽器的 JavaScript 引擎上執行，並匯入該 crate 的元件和模組。

無論哪種方式，crate 的資產（`assets!()`）都會與應用程式的資產一併發佈，其字型也會在第一個影格之前載入。在 `nsh run --target web` 期間，修改 crate 的 Rust 程式碼會重新建構執行環境，而已開啟的頁面會自行載入；TSX 的修改則維持為熱更新。開發用的執行環境以增量方式建構，因此對 crate 的修改約一秒即可就緒；`nsh package` 則會建構針對大小最佳化的發佈版本。

在每個平台（包括 web）上運行的 Rust 程式碼會使用引擎的服務：`fetch(url).await` 透過與 JS 的 `fetch` 相同的網絡堆疊發出 HTTP 請求（在此處即瀏覽器的堆疊，並受其 CORS 規則約束）；`timer`、`set_timeout` 和 `set_interval` 負責等待；`nsh_core::time::Instant` 和 `nsh_core::time::unix_ms()` 讀取時鐘。`background` 和 `blocking` 則在原生目標的執行緒上執行工作。

建構需要 Rust target，以及能編譯為 WebAssembly 的 clang，與執行環境本身的建構相同：`rustup target add wasm32-unknown-unknown`，加上 `clang` 和 `llvm-ar`（在 macOS 上，需要 LLVM 工具鏈，例如 Homebrew 的 `llvm`，並透過 `CC_wasm32_unknown_unknown` 和 `AR_wasm32_unknown_unknown` 指定）。

<a id="browser-apis-from-rust"></a>

### 在 Rust 中使用瀏覽器 API

crate 可以透過 [wasm-bindgen](https://wasm-bindgen.github.io/wasm-bindgen/) 及其 `web-sys` 和 `js-sys` crate，在 `#[cfg(target_arch = "wasm32")]` 之下呼叫瀏覽器自身的 API：WebSocket、`IndexedDB`、剪貼簿、任何 Web API，以及 crate 自己的 JS（`#[wasm_bindgen(inline_js = …)]`、`module = "/js/…"`）。當應用程式的 web 執行環境以這種方式呼叫 JS（包括 `JsValue` 轉換）時，`nsh` 會對其執行 `wasm-bindgen` CLI，並把其膠水程式碼和 crate 的 JS 一併放在執行環境旁邊，開發環境和已發佈的網站皆然。CLI 的版本與執行環境所連結的 `wasm-bindgen` crate 的版本一致，該版本由 `nsh` 指明：`cargo install wasm-bindgen-cli --version <version> --locked` 會安裝它（`NSH_WASM_BINDGEN` 可指定 `PATH` 以外位置的 CLI）。如果執行環境連結了 wasm-bindgen，但沒有透過它呼叫任何 JS（例如經由某個依賴項的預設功能），則會與其他執行環境一樣建構。

crate 以 `web-sys` 功能的形式指明它使用的 API，而鎖定 `wasm-bindgen` 可令其版本以至 CLI 的版本在每次建構之間保持一致：

```toml
[target.'cfg(target_arch = "wasm32")'.dependencies]
wasm-bindgen = "=0.2.129"
web-sys = { version = "0.3", features = ["WebSocket", "MessageEvent"] }
futures-channel = "0.3"
```

瀏覽器的回呼（到達的訊息、頁面的計時器）會喚醒應用程式的任務，這些任務會立即執行：

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

crate 對瀏覽器 API 的呼叫以頁面本身的權限運行，就如 crate 的原生程式碼在其他平台上以應用程式的權限運行一樣：`nsh.json` 的能力限制管轄經由引擎的內容（`fetch`、應用程式的 JS），而瀏覽器的規則（CORS、頁面的 Content-Security-Policy）則管轄頁面發出的每個請求。

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

`nsh package --target web` 會寫出 `.nsh/out/<Name>/`（若要輸出到另一個目錄，請使用 `--out`），其結構與前端建構相似：一個頁面，以及以內容命名的檔案。

| 檔案 | 說明 |
|---|---|
| `index.html` | 應用程式的頁面：以其名稱作為標題、圖示、其 `appearance` 的顏色、載入指示器，以及應用程式無法載入或啟動時的訊息 |
| `manifest.webmanifest` | 瀏覽器安裝應用程式時使用的名稱、id、圖示和顏色 |
| `nsh.<digest>.js` | DOM 執行環境，已縮小（79 KB，brotli 後 22.5 KB） |
| `nsh.<digest>.wasm` | Rust 引擎、版面配置和元件，以及 Rust 應用程式自己的 crate。TSX 在瀏覽器 JavaScript 中執行；打包時只會連結應用程式第一個畫面所匯入的元件和標準模組。 |
| `nsh-<name>.<digest>.wasm` | 應用程式在第一個畫面之外使用的元件、標準模組和 shader：在畫面顯示後於背景下載 |
| `<file>.br`、`<file>.gz` | 預先壓縮的各個檔案，供會傳送預壓縮檔案的主機使用 |
| `nsh-syntaxes.<digest>.bin` | 程式碼突顯所用的語法（bat 的集合：0.92 MB，brotli 後 0.8 MB），在程式碼區塊、`Editor` 或 `DiffView` 首次顯示某種語言的程式碼時下載 |
| `nsh-bindgen.<digest>.js` | 其 crate 呼叫[在 Rust 中使用瀏覽器 API](#browser-apis-from-rust)的應用程式所用的 wasm-bindgen 膠水程式碼，已縮小 |
| `snippets.<digest>/<crate>-<hash>/…` | 膠水程式碼所匯入的那些 crate 的 JS（`inline_js`、`module = "/js/…"`），位於 wasm-bindgen 給予的路徑下 |
| `app.<digest>.js` | 已編譯的 TSX 入口，為由瀏覽器載入的 ES 模組。 |
| `host.<digest>.js` | 頁面的主機，`nsh.json` `web.host`（[主機的函式](#the-hosts-functions)） |
| `<name>.<digest>.js` | 由 `import()` 按需載入的 ES 模組。 |
| `assets/<path>.<digest>.<ext>` | 應用程式匯入的每項資產，在使用時從其 URL 載入（字型會在註冊它們的程式碼運行之前載入，因為文字是以它們來量度的：在應用程式啟動之前，或與匯入它們的 chunk 一起載入） |
| `icons/<size>.<digest>.png` | `nsh.json` 的圖示，尺寸為 32（favicon）、180（`apple-touch-icon`）、192 和 512 像素 |

`<digest>` 是檔案內容 SHA-256 的開頭部分：只有內容改變時，檔案名稱才會改變，因此新版本只會更改 `index.html` 和真正有變動的檔案。所有內容都使用相對 URL，因此網站可以在任何主機的任何目錄下運作（`https://example.com/apps/counter/`）。

<a id="runtime-size"></a>

### 執行環境大小

打包時會為每個應用程式連結專屬的 `nsh.<digest>.wasm`，其中包含引擎，以及應用程式第一個畫面所匯入的 `nsh/base` 元件、標準模組和 shader。應用程式其他畫面所匯入的內容，會在第一個畫面顯示後於背景下載。若應用程式的 crate 呼叫[在 Rust 中使用瀏覽器 API](#browser-apis-from-rust)，其 `nsh.<digest>.wasm` 會包含完整的執行環境，連同其 crate 在內。以 `nsh package --target web` 量度（MB = 10^6 位元組）：

| 應用程式 | 使用內容 | `nsh.<digest>.wasm` | gzip | Brotli |
|---|---|---|---|---|
| `examples/counter` | 核心元件 | 3.96 MB | 1.32 MB | 0.97 MB |
| `examples/gallery` | 所有元件、`zlib` 和 shader | 4.13 MB | 1.36 MB | 1.01 MB |
<a id="deploy-it"></a>

### 部署

把目錄上載到任何靜態主機:CDN 後面的物件儲存、Cloudflare Pages、Netlify、GitHub Pages、nginx 都可以。兩條規則可讓它載入快速、更新可靠:

| 檔案 | `Cache-Control` |
|---|---|
| `index.html`、`manifest.webmanifest` | `no-cache`(每次載入都重新驗證,因此新版本會即時顯示) |
| 其他所有檔案 | `public, max-age=31536000, immutable` |

把 `.wasm` 以 `application/wasm` 提供(瀏覽器便可在下載的同時進行編譯),並向支援的瀏覽器發送預先壓縮的副本:nginx 的 `brotli_static on; gzip_static on;`、Caddy 的 `file_server { precompressed br gzip }`,或使用 Brotli 壓縮的 CDN。使用 Brotli 時,runtime 比使用 gzip 時小約四分之一。`nsh package --target web --run` 在 `http://127.0.0.1:4173/` 上就是以這種方式提供網站。

發佈到網頁的應用程式,運作方式與打包好的原生應用程式一樣:以 release 形式運行,具備其 `nsh.json` 所宣告的權限([沙箱與權限](./sandbox-and-capabilities.md)),即 TSX 應用程式運行於瀏覽器的 JavaScript 引擎上。當這些權限限制了 `network` 時,頁面還會附帶一個 Content-Security-Policy `connect-src`,其中包含所宣告的主機(以及頁面自身的 origin),讓瀏覽器本身拒絕向任何其他主機發出請求和重新導向跳轉。導致應用程式無法啟動的錯誤會顯示在頁面上;之後的錯誤則輸出到瀏覽器的 console。

<a id="embed-it-with-an-iframe"></a>

### 以 iframe 嵌入

網頁上沒有嵌入 API:請用 `<iframe>` 嵌入已發佈的應用程式。其大小即為應用程式的視窗:

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

這會啟動開發伺服器並印出其頁面的位址 `http://127.0.0.1:8790/`:可在任何瀏覽器中開啟。該頁面與其他開發主機一樣:它會運行應用程式的每次建置,把建置錯誤和執行時錯誤顯示在應用程式上方,並把應用程式的日誌傳送到終端機。Rust 應用程式的 crate 有改動時,會重新建置其 runtime,已開啟的頁面會自動載入;TSX 的修改則原地套用(熱更新)。同一網絡上的手機可開啟 `nsh run` 在其下方印出的位址(`on this network: http://192.168.…:8790/`)。一旦有 web runtime,`nsh dev` 便會提供同一個頁面(在發行版中一定有)。

<a id="build-the-websites-player"></a>

## 建置網站的播放器

```sh
cargo xtask web                       # nsh.wasm, nsh.js, the player and website/demos/*.tsx
cargo xtask web --out target/play     # somewhere else
```

輸出目錄包含:

| 檔案 | 說明 |
|---|---|
| `gallery/nsh.<digest>.wasm` | Gallery 的 runtime,由 `nsh package` 為其連結(使用所有元件和 `zlib`:約 11.8 MB,gzip 後 3.6 MB) |
| `gallery/nsh-syntaxes.<digest>.bin` | runtime 用來為程式碼作語法突顯的語法定義,在示範首次顯示某種語言的程式碼時才下載 |
| `nsh-playground.wasm` | 與上面相同,另加 NSH 的 TSX 編譯器,供 [Playground](#the-playground) 使用(約 8 MB,gzip 後 2.4 MB) |
| `gallery/nsh.<digest>.js` | DOM runtime(已壓縮):載入 wasm、套用批次更新、把輸入轉換成事件 |
| `index.html` | 播放器頁面:為 `#<name>` 運行 `demos/<name>.js` |
| `nsh.wasm`、`nsh.js`、`browser/` | 播放器載入的 runtime:引擎、DOM runtime 和瀏覽器主機的模組 |
| `demos/<name>.js` | 由 `nsh build --release` 編譯的每個示範:一個 ES module |
| `gallery/` | 以 `nsh package --target web` 發佈的 Gallery 應用程式,顯示在 [Gallery](/gallery) 頁面 |

以任何靜態伺服器提供該目錄(需要 `application/wasm` MIME type 以支援串流編譯),然後開啟 `index.html#counter`。

<a id="the-playground"></a>

## Playground

[Playground](/playground) 可在瀏覽器中編輯並運行應用程式:頁面以 NSH 自己的 JSX 編譯器(內建於 `nsh-playground.wasm`,不使用 rolldown)編譯 TSX,並在每次停止輸入時於瀏覽器的 JavaScript 引擎上運行。本網站的每個示範都有 **在 Playground 中編輯** 連結,而 **分享** 會把程式碼放進連結本身,因此伺服器不會儲存任何內容。

Playground 應用程式是單一模組:它可匯入 NSH 的模組(`nsh` 和 `nsh/*`),但不能匯入其他檔案或套件。`console.log` 的輸出和錯誤會顯示在手機畫面下方。

該編譯器同時是一個 Rust 函數 `nsh_bundler::compile_module(name, source, ui_sets)`,無需啟用 crate 的 `bundle` feature 即可使用。

<a id="embed-it-in-a-page"></a>

## 嵌入頁面

Rust 應用程式以其已發佈的網站嵌入,放在 [iframe](#embed-it-with-an-iframe) 中。至於 TSX,`nsh.js` 是一個 ES module。`createPlayer` 把 runtime 載入到容器中;`runModule(url)` 啟動由 `nsh build` 寫出的 bundle(`bundle.js`,一個 ES module),在瀏覽器的 JavaScript 引擎上、於應用程式專屬的 realm 中運行,並取代原本運行的內容。它會回傳一個 promise,在模組載入完成後 resolve,若有錯誤令其停止則以該錯誤 reject,播放器亦會報告該錯誤(`onError`):

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

`assets`(由 `asset:/` 路徑對應到 URL 的 map)取代 `assetBase`;`readAsset(uri)` 回傳引擎需要即時取得的資源(例如字型)的位元組,或 `null`;`data` 把 runtime 首次需要時才下載的檔案對應到其 URL(`syntaxes`:`nsh-syntaxes.<digest>.bin`;預設為 `nsh.js` 旁的 `nsh-<name>.bin`);`glue` 是 runtime 的 wasm-bindgen glue 的 URL,而該 runtime 的 crate 會[從 Rust 呼叫瀏覽器 API](#browser-apis-from-rust)(`nsh-bindgen.<digest>.js`),播放器會隨 runtime 一併載入它;`player.runModule(url, { capabilities, appId })` 讓應用程式按其所宣告的權限(其 `capabilities.json`)運行,並把其儲存空間放在其 `nsh.json` id 之下(沒有 id 時,則放在頁面路徑之下)。`nsh package --target web` 寫出的頁面會用到以上全部選項。

`runModule(url, { chunks })` 也接受[分割 bundle](#split-bundles)的各個 chunk 所在位置。

`player.runSource(code, { name, sourceMap, capabilities, appId })` 以相同的選項運行以原始碼文字提供的 ES module。使用 `nsh-playground.wasm` 時,`player.compileAndRun(tsx, name, options)` 會先編譯 TSX,以 `runSource` 的選項運行,並 resolve 為編譯錯誤,或 `null`;`player.compile(tsx)` 回傳 `{ code }` 或 `{ error }`。

容器的大小即為應用程式的視窗(`windowSize()`);調整容器大小,應用程式也會隨之調整。`player.setDark(true)` 可在運行時切換外觀,應用程式透過 `colorScheme()` 和 `dark:` class 觀察這個變化。

對話框和提示會覆蓋容器。使用 `dialogs: "viewport"` 時,它們會覆蓋整個瀏覽器視窗,就像頁面自身的 modal 對話框一樣,而應用程式仍以容器作為其視窗:`Dialog` 按視窗的大小和安全區域排版,並從視窗底部邊緣滑入,其背景遮罩覆蓋整個頁面,滑鼠滾輪在其上操作時頁面不會移動。對話框顯示在瀏覽器的 top layer(Chrome 114、Safari 17、Firefox 125 及更新版本),因此無論容器在哪裏,它都位於頁面其餘內容之上;在較舊的瀏覽器中,它則覆蓋容器。


`Sheet` 與 `Dialog` 和 `AlertDialog` 遵循相同的呈現設定。在同源的 iframe 中,viewport 呈現會自動覆蓋外層頁面,而應用程式保持其原有的排版大小。最後一個彈出視窗關閉時,iframe 會回復到原來的位置和大小;其引擎和狀態則保持運作。文件中的示範已啟用此呈現方式。

對於跨源或沙箱化的 iframe,嵌入頁面須在載入播放器之前註冊主機:

```js
import { hostPlayerFrame } from "./nsh.js";
const frame = document.querySelector("iframe");
const disconnect = hostPlayerFrame(frame);
frame.src = "https://apps.example.com/player.html"; // player uses dialogs: "viewport"
// When removing the embedding: disconnect();
```

主機接受來自此 iframe 視窗的請求,在彈出視窗顯示期間令周圍的頁面保持惰性並鎖定其捲動,關閉時兩者都會還原。每個跨源嵌入邊界都需要其主機配合;沒有配合時,呈現會停留在該文件之內,播放器會報告警告。

<a id="the-hosts-functions"></a>

## 主機的函數

在網頁上,頁面就是應用程式的主機:它回應 [`host`](../modules/nsh.md#host) 的 `host.call(name, args)`,並發送 `host.on` 所監聽的事件。`createPlayer` 的 `host` 是一個物件,其 `call(name, args)` 回傳結果或結果的 promise;拋出錯誤或 reject 會令應用程式的呼叫以該錯誤的訊息 reject。`player.hostEvent(event, payload)` 發送帶有 JSON payload 的事件(非 JSON 的 payload 會拋出錯誤)。有 `host` 時,`host.available()` 是 `true`。

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

已發佈的應用程式從 `nsh.json` 取得其主機:`web.host` 指定應用程式目錄中的一個 JS 模組(相對於 `nsh.json`),該模組匯出 `createHost(player)`。`nsh package --target web` 把它以 `host.<digest>.js` 複製到網站中,頁面在應用程式啟動前與播放器一起運行 `createHost`;其回傳值(或 resolve 的值)必須具有 `call` 函數,否則頁面會顯示應用程式無法載入。此後,播放器 `createHost` 所接收的物件會發送事件:

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

主機會如上所示,按原樣在其函數表中查找每個名稱,而其 URL 和路徑由主機自行管理:`capabilities.host` 按名稱的開頭授予權限(`user.*`),因此主機若把名稱轉成路徑,便可能觸及授權範圍以外的內容。runtime 會放行長度為 1 至 128 個字元、由 `A`–`Z`、`a`–`z`、`0`–`9`、`_`、`.`、`:` 和 `-` 組成、且不含 `..` 的名稱,並拒絕其他任何名稱的呼叫。前綴授權以分隔符(`bridge.*`)結尾:`bridge*` 同樣會匹配 `bridgeAdmin`。

在應用程式運行之前發送的事件,例如來自 `createHost` 本身的事件,會在應用程式一啟動時按順序送達,因此應用程式頂層的 `host.on` 監聽器會收到它們。在監聽器註冊之前發送的事件不會向它重播:應用程式應透過呼叫(`host.call("user.info")`)讀取其啟動時的狀態,並透過事件追蹤其變化。

主機模組在應用程式的頁面中運行,並共用其 Content-Security-Policy:當應用程式的權限限制了 `network` 時,頁面的 `connect-src` 包含頁面的 origin、`capabilities.network` 所列的主機,以及 `web.connect` 所列的主機。`web.connect` 指定主機模組自身的請求(`fetch`、`XMLHttpRequest`、`WebSocket`)可到達的主機,其模式與 `capabilities.network.hosts`(`api.example.com`、`*.example.com`、`"*"`)相同,一如上文的 `api.example.com`;應用程式自身的請求仍按其 `capabilities` 檢查。

該模組會按原樣複製,因此它以絕對 URL 匯入其他程式碼。應用程式呼叫每個函數時,仍需要其 `host` [權限](./sandbox-and-capabilities.md)。`nsh run --target web` 在開發頁面上運行它,而 `nsh test` 會為其測試開啟的每個應用程式運行同一個模組,無論是 headless 還是在瀏覽器中(`--target web`),因此應用程式與其主機會一併測試([測試](./testing-and-trace.md#the-pages-host))。

<a id="the-browser-as-a-platform"></a>

## 瀏覽器作為平台

`platform.os` 是 `"web"`。瀏覽器所在裝置的種類,決定應用程式的行為,如 `platform.idiom` 所示:

- `"desktop"`:使用滑鼠(可懸停的精細指標),且容器至少 600 點寬。`platform.desktop` 是 `true`,`platform.select` 選用 `desktop`,並套用 `desktop={{…}}` props。
- `"pad"`:短邊至少 600 點的觸控螢幕;否則為 `"phone"`。這些屬於行動裝置:`platform.select` 選用 `mobile`。

idiom 在應用程式啟動時決定,並在運行期間保持不變,與所有平台一樣;狹窄的桌面視窗仍然是桌面,按其 `windowSize()` 排版。`web={{…}}` props、`platform.select({ web })` 和 `web:` class 只適用於瀏覽器;`ios={{…}}`、`native` 和 `ios:` 則不適用於瀏覽器。

頁面會回報環境的其餘部分,並保持更新:

| 值 | 來自瀏覽器 |
|---|---|
| 語言環境(`Intl` 的預設值) | `navigator.languages[0]` |
| 時區(`Date` 的本地時間、`Intl` 的預設 `timeZone`) | 瀏覽器的時區(`Intl.DateTimeFormat().resolvedOptions().timeZone`),包括夏令時間 |
| 排版方向(`rtl:` / `ltr:`) | 有設定 `<html dir>` 時使用它,否則按語言環境的文字書寫系統 |
| `reduceMotion()` | `prefers-reduced-motion` |
| `fontScale()` | 根元素的字型大小 / 16 px(瀏覽器的文字大小設定) |
| `pixelRatio()` | `devicePixelRatio`(會隨縮放和螢幕而改變) |
| `colorScheme()` | `prefers-color-scheme` |
| `safeArea()` | 與容器重疊之處的 `env(safe-area-inset-*)`(手機上的 `viewport-fit=cover` 頁面) |
| `keyboardFrame()` | 螢幕鍵盤覆蓋容器的程度(`visualViewport`) |

`platform.version` 是 `"0.0"`,而 `screenReaderEnabled()` 保持為 `false`(瀏覽器不會提供此資訊)。頁面周圍的瀏覽器工具列屬於瀏覽器;頁面的 [`statusBar`](../modules/nsh-base.md#status-bar) 是為手機而設。

<a id="networking"></a>

## 網絡

`fetch`(包括串流、`AbortController` 和 `FormData`)以及 `<Image>` URL 在 NSH 檢查過應用程式的[權限](./sandbox-and-capabilities.md)之後,會經由瀏覽器自身的網絡堆疊處理。由於請求是瀏覽器發出的,因此適用瀏覽器的規則:

- **相對 URL** 與瀏覽器一樣,相對於頁面的 URL 解析:已發佈的應用程式以 `fetch("/api/items")` 存取自己的 API,`<Image src="/photos/a.jpg" />` 從自己的伺服器載入。(原生平台沒有頁面,因此需要絕對 URL。)
- **CORS。** 向頁面以外的 origin 發出的請求,只有在該伺服器允許頁面的 origin(`Access-Control-Allow-Origin`)時才會成功;否則 `fetch` 會以網絡錯誤 reject。只有伺服器公開的回應標頭才看得到。
- **Cookie**(以及 HTTP 驗證)只會發送到頁面自身的 origin(`credentials: "same-origin"`),而瀏覽器禁止的標頭(`Cookie`、`User-Agent`、`Host` 等)會被丟棄。
- **重新導向** 由瀏覽器跟隨。不得跟隨重新導向的請求會失敗:`redirect: "manual"` 和 `"error"`,以及權限限制了 `network` 的應用程式的請求(NSH 會檢查每一次跳轉,而瀏覽器在跟隨之前不會透露重新導向)。
- **請求主體** 若為 `ReadableStream`,會先收集完整,再一次過發送;回應主體則在抵達時以串流方式處理。
<a id="split-bundles"></a>

## 拆分 bundle

TSX web app 無需在顯示第一個畫面前下載全部程式碼（Rust app 則是一個 `nsh.wasm`，瀏覽器會邊下載邊編譯）。`nsh package --target web` 發佈 TSX app 時會進行拆分，每個 chunk 為 `<name>.<digest>.js`，並由頁面記錄 chunk 與這些檔案的對應。若要自行拆分 bundle，`nsh build --split` 會把 `import()` 載入的模組放進各自的 chunk，與 `bundle.js` 並列：

```sh
nsh build --release --split -o site/app
# bundle.js        the app up to its first screen
# Screen.js        import("./Screen") and what only it uses
# detail.js        what two chunks share, when they do (made by the bundler)
```

第一次 `import("./Screen")` 會一次過下載 `Screen.js` 及其匯入的 chunk，然後再執行求值；之後對它的 import 會即時完成解析。頁面會指明 chunk 的位置：預設放在 bundle 旁邊，或者每個 chunk 各有一個 URL，適用於以內容摘要重新命名的檔案，讓 CDN 可以永久快取：

```js
await player.runModule(entry, {
  chunks: { "Screen.js": "/app.3f2a9c.js", "detail.js": "/app.81bb07.js" },
});
```

無法下載的 chunk 會令 `import()` 被 reject，並帶有指出該 chunk 的 `TypeError`；下一次 `import()` 會重試。Chunk 名稱是 bundle 內固定的檔案名稱：app 無法令頁面下載任何其他內容。

[gallery](/gallery) 就是以這種方式載入每個 demo：`lazy`（位於 `examples/gallery/ui.tsx`）會建立一個元件，在首次渲染時才開始 import，並在 import 完成前顯示佔位內容，完成後再渲染載入的內容。它首次載入的是索引和最先顯示的 demo；demo 所匯入的字型會隨該 demo 的 chunk 一併載入。Native build 已包含所有模組，因此在 native 上 import 會即時完成解析：

```tsx
const Stocks = lazy(() => import("./demos/Stocks").then((m) => m.Stocks));
```

<a id="limits"></a>

## 限制

以下限制由瀏覽器決定，web backend 只是依從：

- **其他網站的 web view**：`WebView` 是一個 `<iframe>`。內嵌 HTML（`html`）可使用全部功能：`onMessage`、`postMessage`、`injectJavaScript`、注入的 script 及載入事件（它以獨立的 origin 執行，與所在頁面分隔）。其他網站的頁面只支援 `postMessage` 及帶有所給定 URL 的載入事件：瀏覽器不會讓外層頁面得知其導航、標題、歷史記錄和錯誤，亦無法設定 `userAgent`。
- **自動開始播放的有聲影片**：`Video` 是 `<video>`，支援全部 prop 和事件，但瀏覽器只會在用戶操作之後才開始播放有聲影片（靜音影片則可以播放）。
- **Native 元件**：已註冊的 native 元件屬於嵌入 NSH 的 native app；在 web 上，它們的 view 保持空白，並在 console 顯示警告。
- **平台服務**：讀取剪貼簿（`Clipboard.readText`，以及 `hasText`）需要安全環境（HTTPS），並可能會詢問用戶。圖片不會回報 `onProgress`。
- **文字排版細節**：換行規則是 UAX #14 的子集（空格、CJK、連字號，以及 CJK 標點的行首行尾規則：如 `。`、`，` 和 `」` 等結束標點不會出現在行首，如 `（` 和 `「` 等開始標點不會出現在行尾），不支援斷字連字，亦不支援段落方向以外的雙向文字重新排序。

Player 和 dev server 以開發設定執行 app；已發佈的 app 則以 release 模式執行。兩者都在瀏覽器的 JavaScript 引擎上，於 app 自己的 realm 中執行 TSX app 的程式碼。

<a id="see-also"></a>

## 另見

- [Packaging](./packaging.md)：`nsh package` 的其他目標平台。
- [Architecture](./architecture.md)：web build 重用的引擎、核心和 mount batch。
- [Testing](./testing-and-trace.md)：`nsh test` 以 headless 方式執行相同的引擎，並使用近似的文字引擎。
