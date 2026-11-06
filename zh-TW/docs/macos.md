---
title: "macOS"
description: "在 macOS 上於 AppKit 視窗中執行 Rust 與 TSX 的 NSH 應用程式,將其封裝為 .app bundle,透過 AppView 嵌入 Mac 應用程式,並說明 macOS 上的差異之處。"
order: 13
group: platforms
source_hash: 1b63a5bad9780b73
---

# macOS

NSH 應用程式也能以原生 Mac 應用程式的形式執行。macOS 後端以 AppKit 檢視和 Core Animation 進行繪製，並以 CoreText 排版文字；核心、響應式圖（reactive graph）、渲染器、Taffy 版面配置和原生模組都與 iOS 和 Android 相同，因此同一個應用程式可以在所有平台上執行。在 macOS 上，`os()` 即是 `Os::MacOs`（TSX 中的 `platform.os` 即是 `"macos"`），且 TSX 的 `desktop={{…}}` 屬性同樣適用。視窗標題、應用程式自訂的標題列、選單列和右鍵選單，在 Rust 中來自 `nsh_core::element::desktop`（[桌面標題列](./rust.md#desktop-title-bars)），在 TSX 中則來自 [`nsh/desktop`](../modules/nsh-desktop.md)。

macOS 後端的行為與桌面應用程式一致：支援滑鼠、觸控板和鍵盤輸入、可調整大小的視窗、顯示在視窗上方的對話框，以及選單列。

<a id="requirements"></a>

## 系統需求

- 執行應用程式需要 **macOS 14** 或更新版本。
- 需要 Xcode 命令列工具（`xcode-select --install`），用於從原始碼檢出建置 Rust 應用程式的 runner 與 NSH 的 macOS 執行環境，以及打包應用程式（`codesign`、`sips`）。在 Mac 上以 `cargo xtask dist` 產生的發行版，會將 TSX 應用程式的執行環境放在 `runtime/macos/` 中。

<a id="running-an-app"></a>

## 執行應用程式

Rust 應用程式可在其目錄中執行：

```sh
nsh run --target macos         # the default on a Mac
```

`nsh` 會以你的 crate 建置除錯版 runner，並在視窗中開啟應用程式，其日誌（`log::info!` 等）顯示在終端機中；crate 的 Rust 程式碼一有變更，就會重新建置 runner 並重新啟動應用程式。`cargo run` 會從 crate 的 `src/main.rs`（由 `nsh init --template rust` 寫入）啟動同一個根元件：[`run_app`](#embedding-in-a-mac-app)，搭配 `AppSource::Rust`。

TSX 應用程式需指定其入口：

```sh
nsh run App.tsx --target macos
```

應用程式會在 AppKit 視窗中開啟（預設為 1200×800），並提供熱重載、終端機日誌和錯誤覆蓋層，與其他目標平台相同；按 Cmd+R 可重新載入最新的建置。選單列和視窗會顯示應用程式的名稱（nsh.json 的 `"name"`，否則為其目錄名稱）。在原始碼檢出中，`nsh run` 會先建置開發用主機（`nsh-macos-host`）。停止 `nsh run` 會關閉視窗，關閉視窗則會結束 `nsh run`。主機也可以單獨執行已建置的 bundle：

```sh
nsh build my-app --release -o build
dist/nsh/runtime/macos/nsh-macos-host --bundle build/bundle.nshc --window-size 1200x800   # in a checkout: target/debug/nsh-macos-host
```

`--window-size` 是視窗的初始大小（TSX 應用程式）；視窗可以調整大小。`--display <n>`（`nsh run` / `nsh test
--target macos --display <n>`) centers it on display `n`: `1` 是主顯示器，也就是有選單列的那一個。

`nsh test --target macos` 會在 macOS 視窗中執行 TSX 應用程式的測試，若有第二個顯示器則使用之（主螢幕仍留給你使用；`--display <n>` 可選擇其他顯示器）：測試開啟的每個應用程式都會有專屬視窗，大小依測試的要求而定，即使顯示器比該大小更矮也一樣；各個步驟會以系統輸入，對其選擇器所指定的檢視進行點擊、輸入和捲動（[測試](./testing-and-trace.md#on-a-real-platform)）。

<a id="performance-monitor"></a>

### 效能監視器

`--fps`（Rust 應用程式的 `run_app` 中的 `AppOptions { fps: true, .. }`、嵌入時的 `AppView::set_fps_monitor(true)`、`nsh run App.tsx --target macos --fps`、主機的 `--fps`，或已打包 TSX 應用程式的 `open -a MyApp --args --fps`）會在應用程式右上角顯示一個面板，每秒更新兩次：

| 列 | 量測內容 |
|---|---|
| `FPS` | 過去一秒內顯示的影格數：應用程式內容有變動的顯示器更新次數（閒置的應用程式數值偏低，這並不代表緩慢）。`max` 是主執行緒能跟上的速率，接著是顯示器的更新率（ProMotion 螢幕上為 120 Hz）。 |
| `TICK` | 顯示器更新之間實際到達的間隔（平均值、p95），以及 `gap`，即已顯示影格之間的 p95 間隔：沒有任何延遲時為一次更新的時間（120 Hz 下為 8.3 ms）。 |
| `MAIN` | 每個影格的主執行緒時間（套用引擎的變更、繪製文字與畫布、動畫、輸入）、其第 95 百分位數，以及 `drop`：耗時超過一次顯示器更新的影格所占比例。 |
| `JS` / `CORE` | 每次提交（commit）的耗時：你的程式碼（處理常式、計時器、清單列）和 NSH 的核心（版面配置、文字、差異比對）；每秒提交次數，以及每次提交的原生檢視變更數。 |
| `HOP` | 變更在引擎執行緒與主執行緒之間等待的時間；引擎執行緒的忙碌程度。 |
| `CPU` / `GPU` / `MEM` | 行程資訊：CPU（100% 代表一個核心）、其 GPU 占用比例、其記憶體占用量（即「活動監視器」顯示的數字）。 |

下方的長條圖顯示最近 120 個影格的主執行緒時間與一次顯示器更新時間（那條線）的對照：在一半以內為綠色，在一次更新以內為琥珀色，超過則為紅色。面板顯示期間，這些讀數也會每秒記錄一次到日誌（目標 `nsh::perf`，格式與 Linux 後端相同，並帶有 macOS 的影格階段 `tick`、`drain` 和 `canvas`；毫秒值以平均值/p50/p95/最大值表示），可由 `nsh test --fps -v` 顯示，並由 `examples/gallery/tools/perf.py` 讀取。請以發行版建置進行量測；監視器關閉時不會產生任何開銷。

<a id="packaging"></a>

## 打包

```sh
nsh package --target macos [--run]           # a Rust app, from its directory
nsh package App.tsx --target macos [--run]   # a TSX app
```

會寫出一個應用程式 bundle：

```text
.nsh/out/<Name>.app/Contents/
  Info.plist
  MacOS/<Name>               the executable: a Rust app's own runner, built with its crate; nsh's release runner for TSX
  Resources/nsh/bundle.nshc  a TSX app, compiled
  Resources/nsh/assets/…     the assets it imports (a Rust crate's `assets!()` too)
  Resources/nsh/app.json     the window title and the app's appearance
  Resources/AppIcon.icns     the icon, when nsh.json names one (converted with sips)
```

`.app` 以 ad hoc 方式簽署，因此可在建置它的 Mac 上執行。若要散布，請以 Developer ID 簽署並進行公證（notarize）。`--run` 會在打包後開啟應用程式。

<a id="embedding-in-a-mac-app"></a>

## 嵌入 Mac 應用程式

`nsh-platform-macos` crate（來自 NSH 儲存庫）為 Rust Mac 應用程式提供 `AppView`：一個 NSH 引擎，以 `NSView` 的形式存在。每個 `AppView` 都是獨立的，可同時執行多個。它會執行一個 Rust 根元件，也就是你 crate 的根元件：

```rust
use std::rc::Rc;
use nsh_platform_macos::{
    objc2::MainThreadMarker, objc2_app_kit::NSWindow, set_ui_sets, AppOptions, AppView, Root,
};

fn show(window: &NSWindow) -> Rc<AppView> {
    // Once, before the first view: the UI sets the apps import (NSH's and your crate's).
    set_ui_sets(vec![nsh_base::registry(), my_app::registry()]);
    let mtm = MainThreadMarker::new().expect("main thread");
    let view = AppView::new(mtm, AppOptions::default());
    // register native components here, before loading
    view.load(Root::of::<my_app::App>().into());
    window.setContentView(Some(&view.view()));
    // Keep the view while the window shows it; `stop` it when the window closes.
    view
}
```

`Root::tokens` 為根元件提供其[主題](./rust.md#theme)（`nsh_base::Theme::from_json(json)?.into_tokens()`），`Root::app_id` 則提供儲存其資料所用的 id。由 `nsh build` 寫出的 TSX bundle 可載入同一個檢視：

```rust
use nsh_platform_macos::{AppOptions, AppView, AssetBase, Bundle};

let view = AppView::new(mtm, AppOptions {
    asset_base: Some(AssetBase::Directory("app/assets".into())),
    ..AppOptions::default()
});
let code = std::fs::read_to_string("app/bundle.js").expect("bundle");
view.load(Bundle::source(code).into());
```

`AppView::load` 會取代原先執行的內容；`stop` 會結束應用程式。`asset_base` 指定 `asset:/` URI 的解析位置（`AssetBase::Directory` 或 `AssetBase::Http`）。位元組碼 bundle（`bundle.nshc`）以 `unsafe { Bundle::bytecode(bytes) }` 載入：位元組碼屬於受信任的輸入，因此只能從你自己應用程式的檔案載入。對於僅由 NSH 組成的應用程式，`run_app(source, options)`（`AppSource::Rust(root)` 或 `AppSource::Bundle(bundle)`）會在視窗中開啟一個 `AppView`，並附帶標準選單（關於、隱藏、結束、編輯、最小化、縮放、進入全螢幕、關閉），應用程式可以用 `Menu.setApplicationMenu`（[`nsh/desktop`](../modules/nsh-desktop.md)）取代該選單，並持續執行直到視窗關閉。預設情況下，關閉視窗或選擇「結束」會停止引擎，並從 `run_app` 返回；呼叫端接著可以完成清理工作，或重新啟動其可執行檔。

設定 `AppOptions { keep_alive_on_close: true, ..Default::default() }` 可在視窗關閉時讓獨立工作階段持續運作。關閉時只會隱藏視窗；從 Dock 重新開啟會顯示同一個視窗和引擎。若要明確結束或因更新而重新啟動，可從任何執行緒呼叫 `nsh_platform_macos::quit_app()`。它會關閉保留的視窗、停止引擎，並從 `run_app` 返回。`nsh_core::element::desktop::close_window()` 遵循所選的視窗關閉策略。

`AppOptions::cache`（或針對接下來載入的應用程式使用 `AppView::set_cache`）設定應用程式存放快取的位置、其[下載的圖片](./images-and-assets.md#kept-on-disk)，以及各自保留的量（`CacheOptions`：預設為系統的快取目錄，以及 256 MiB 的圖片）。

`AppView::set_locale(Some(locale))` 和 `AppView::set_font_scale(Some(scale))` 會以你的應用程式語言和文字大小取代系統的設定（`None` 則重新跟隨系統）：`locale()`、`Intl`、`fontScale()` 和文字會立即跟著變化（[裝置與環境](./device-and-environment.md#in-an-embedding-app)）。

`AppView::set_theme_overrides(Some(json))` 會把你的應用程式品牌套用在應用程式的[主題](./tailwind.md#theme-tokens)之上：它是一個主題檔，格式與 `nsh.json` 的 `"theme"` 相同，其中的 token 在淺色與深色模式下，都會覆蓋應用程式中同名的 token，應用程式的其他 token 則保持不變；諸如 `bg-primary` 的類別會立即重新套用樣式，之後載入的應用程式也會以它為起點（`None` 會還給應用程式它自己的主題；無法解析的檔案會產生錯誤，且不會變更任何內容）。

原生元件以 `AppView::register_component` 註冊；請參閱[原生元件](./native-components.md#registering-on-macos-rust)。`set_ui_sets(sets)` 設定每個引擎所提供的 UI 集合：NSH 的（`nsh_base::registry()`）和你的 crate 的（`my_app::registry()`，由 `#[native_module]` 產生），因此檢視所載入的 TSX 也能匯入你的 Rust 元件和模組。

<a id="what-differs-on-macos"></a>

## macOS 上的差異

環境與桌面相同：安全區域和鍵盤高度為 0，`idiom()` 為桌面（`platform.idiom` 為 `"desktop"`），`os_version()`（`platform.version`）為 macOS 版本，深色模式會即時跟隨系統外觀。請參閱[裝置與環境](./device-and-environment.md)。

輸入方式與桌面相同：滑鼠、觸控板（含慣性捲動、縮放手勢和旋轉）以及鍵盤。可選取的文字可透過拖曳、按兩下和按三下來選取，並以 Cmd+C 複製。Escape、Option+Left、Cmd+[ 以及滑鼠的返回鍵，會關閉最新的對話框或在堆疊中返回（在獲得焦點的輸入欄位或網頁中，Escape 只會離開該處；網頁優先接收這些按鍵，並保留它所使用的按鍵）；`Dialog` 是覆蓋整個視窗的一層，用來顯示應用程式的彈出視窗和背景遮罩。頁面會在頂端顯示其 `header`。在 `Input` 內的任何位置點擊（包括其內距），都會把插入點放在最近的位置。`AlertDialog` 會在視窗上顯示 `NSAlert` 面板：一列最多兩個警示動作（取消動作在最左側，最後一個一般動作為 Return 的預設動作）；更多的動作以及動作面板的動作則依其順序垂直堆疊，取消動作排在最後且沒有預設動作；按 Escape 會選擇取消動作。

<a id="keyboard"></a>

### 鍵盤

| 按鍵 | 作用 |
|---|---|
| Return | 在 `Input` 中，依 `submitBehavior` 所指定的行為：提交（`onSubmit`）、提交並離開欄位，或換行（多行輸入） |
| Return、數字鍵台 Enter、Space | 以 `onPress` 啟動獲得焦點的檢視，於按下按鍵時觸發一次；自動重複的按鍵會被忽略 |
| Shift+Return、Option+Return、Ctrl+Return | 在 Return 會提交的多行輸入中換行 |
| Tab、Shift+Tab（Ctrl 亦可） | 在最新的對話框內，依畫面順序移到下一個／上一個欄位或可按壓的檢視；Option+Tab 會在多行輸入中輸入定位字元 |
| Escape | 離開獲得焦點的欄位；否則先清除文字選取，再關閉最新的對話框或返回 |
| Option+Left、Cmd+[、滑鼠返回鍵 | 返回（欄位獲得焦點時不適用：此時 Option+Left 會移動插入點） |
| Option / Cmd + 方向鍵（可搭配 Shift）；Option+Delete、Cmd+Delete；Ctrl+A / E / K | 在欄位中依字詞和行移動、選取和刪除，與所有 Mac 應用程式相同 |
| Cmd+Z、Shift+Cmd+Z、Cmd+X / C / V / A | 復原、重做、剪下、拷貝、貼上、全選（`masked` 欄位不允許剪下和拷貝）；Cmd+A / Cmd+C 可選取並拷貝可選取的文字 |
| 方向鍵；Page Up / Down、Space、Shift+Space、Option+Up / Down；Home / End、Cmd+Up / Down | 捲動獲得焦點的檢視周圍或滑鼠下方的捲動檢視，以行、頁為單位，或捲到開頭／結尾（欄位獲得焦點時不適用） |
| Cmd+W、Cmd+M、Ctrl+Cmd+F、Cmd+H、Option+Cmd+H、Cmd+Q | 關閉、最小化、全螢幕、隱藏、隱藏其他、結束（`nsh package` 和 `nsh run` 應用程式的選單） |
| Cmd+R | 重新載入最新的建置（`nsh run`） |

應用程式自身的快速鍵（[`keymap`](../modules/nsh.md#keymap)）優先於以上這些，但以下情況除外：傳給獲得焦點之可按壓檢視的啟動按鍵，以及 Quit、Hide、Minimize 和 Full Screen，這些無法被綁定。

快速鍵可搭配任何鍵盤配置使用（在西里爾字母或希臘字母配置上，Cmd+C 是在美式配置上輸入 C 的那個按鍵）。用來確認輸入法組字（中文、日文等）的 Return 絕不會觸發提交。`onKeyPress` 回報的內容與 React Native 相同：輸入的文字、`"Enter"`、`"Backspace"` 和 `"Escape"`。

不支援或有所不同之處：

- **縮放捲動檢視**（`zoomTo`，縮放相關屬性）。
- **`mixBlendMode`**，以及大於 1 的 `brightness()`。
- **輸入**：內容類型與自動填入、鍵盤類型、自動大寫、字母間距；輸入附屬檢視（input accessory view）永遠不會顯示（沒有軟體鍵盤），且 `keyboardShouldPersistTaps` 會被忽略。
- **`WebView` 的 `scrollable={false}`** 會讓滑鼠滾輪和觸控板無法捲動頁面：它們會捲動頁面周圍的應用程式捲動檢視，與 iOS 相同。頁面仍可透過鍵盤（Space、方向鍵）及其自身的指令碼捲動，而觸控板在其頁面之間的滑動（`allowsBackForwardNavigationGestures`）同樣會停用。
- **無障礙**：自訂的 `accessibilityActions`。
- **狀態列**和**觸覺回饋**（沒有對應的桌面功能）。

<a id="see-also"></a>

## 另請參閱

- [CLI](./cli.md)：`nsh run --target macos`、`nsh package --target macos`
- [打包](./packaging.md)
- [平台專屬程式碼](./platform-specific.md)
