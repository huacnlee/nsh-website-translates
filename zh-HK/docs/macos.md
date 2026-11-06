---
title: "macOS"
description: "在 macOS 的 AppKit 視窗中執行以 Rust 和 TSX 編寫的 NSH 應用程式、將其打包為 .app bundle、透過 AppView 嵌入 Mac 應用程式,以及 macOS 上的差異。"
order: 13
group: platforms
source_hash: 1b63a5bad9780b73
---


# macOS

NSH 應用程式亦可作為原生 Mac 應用程式執行。macOS 後端以 AppKit view 和 Core Animation 渲染應用程式，並以 CoreText 排版文字；核心、響應式圖（reactive graph）、渲染器、Taffy 佈局和原生模組都與 iOS 和 Android 相同，因此同一個應用程式可在所有平台執行。在 macOS 上，`os()` 是 `Os::MacOs`（TSX 中的 `platform.os` 是 `"macos"`），TSX 的 `desktop={{…}}` props 同樣適用。視窗標題、應用程式自訂的標題列、選單列和右鍵選單，分別來自 Rust 中的 `nsh_core::element::desktop`（[桌面標題列](./rust.md#desktop-title-bars)）和 TSX 中的 [`nsh/desktop`](../modules/nsh-desktop.md)。

macOS 後端的行為與桌面應用程式一致：支援滑鼠、觸控板和鍵盤輸入、可調整大小的視窗、覆蓋在視窗上的對話框，以及選單列。

<a id="requirements"></a>

## 系統需求

- **macOS 14** 或更新版本，即應用程式執行的環境。
- Xcode 的命令列工具（`xcode-select --install`），用於從 checkout 建置 Rust 應用程式的 runner 和 NSH 的 macOS 執行環境，以及打包應用程式（`codesign`、`sips`）。在 Mac 上以 `cargo xtask dist` 製作的發行版，會把 TSX 應用程式的執行環境附帶於 `runtime/macos/` 中。

<a id="running-an-app"></a>

## 執行應用程式

Rust 應用程式在其目錄中執行：

```sh
nsh run --target macos         # the default on a Mac
```

`nsh` 會連同你的 crate 建置 debug runner，並在視窗中開啟應用程式，其日誌（`log::info!` 等）會顯示在終端機中；crate 的 Rust 程式碼一有變更，就會重新建置 runner 並重新啟動應用程式。`cargo run` 會從 crate 的 `src/main.rs`（由 `nsh init --template rust` 寫入）啟動同一個根：[`run_app`](#embedding-in-a-mac-app)，搭配 `AppSource::Rust`。

TSX 應用程式需指明其入口：

```sh
nsh run App.tsx --target macos
```

應用程式會在 AppKit 視窗中開啟（預設 1200×800），並支援熱重載、終端機日誌和錯誤覆蓋層，與其他目標平台相同；按 Cmd+R 可重新載入最新的建置。選單列和視窗會顯示應用程式的名稱（nsh.json 的 `"name"`，否則為其目錄名稱）。在 checkout 中，`nsh run` 會先建置開發用 host（`nsh-macos-host`）。停止 `nsh run` 會關閉視窗，關閉視窗則會結束 `nsh run`。host 亦可獨立執行已建置的 bundle：

```sh
nsh build my-app --release -o build
dist/nsh/runtime/macos/nsh-macos-host --bundle build/bundle.nshc --window-size 1200x800   # in a checkout: target/debug/nsh-macos-host
```

`--window-size` 是視窗的初始大小（TSX 應用程式）；視窗可以調整大小。`--display <n>`（`nsh run` / `nsh test
--target macos --display <n>`) centers it on display `n`: `1` 為主顯示器，即設有選單列的那個。

`nsh test --target macos` 會在 macOS 視窗中執行 TSX 應用程式的測試，如有第二個顯示器便使用該顯示器（主螢幕仍由你使用；`--display <n>` 可選擇其他顯示器）：測試開啟的每個應用程式都會有獨立的視窗，大小依測試要求而定，即使顯示器比該大小更矮也一樣；各個步驟會以系統輸入方式，在其選擇器所指的 view 上點按、輸入和捲動（[測試](./testing-and-trace.md#on-a-real-platform)）。

<a id="performance-monitor"></a>

### 效能監察器

`--fps`（Rust 應用程式的 `run_app` 中的 `AppOptions { fps: true, .. }`、嵌入時的 `AppView::set_fps_monitor(true)`、`nsh run App.tsx --target macos --fps`、host 的 `--fps`，或已打包 TSX 應用程式的 `open -a MyApp --args --fps`）會在應用程式右上方顯示一個每秒更新兩次的面板：

| 列 | 量度內容 |
|---|---|
| `FPS` | 過去一秒內顯示的幀數：即應用程式有變化的顯示器更新次數（閒置的應用程式讀數偏低，這並不代表速度慢）。`max` 是主執行緒能夠跟上的幀率，之後是顯示器的更新率（ProMotion 螢幕為 120 Hz）。 |
| `TICK` | 顯示器更新之間實際到達的間隔（平均值、p95），以及 `gap`，即已顯示幀之間的 p95 間隔：沒有任何延遲時為一次更新的時間（120 Hz 下為 8.3 ms）。 |
| `MAIN` | 每幀的主執行緒時間（套用引擎的變更、繪製文字和畫布、動畫、輸入）、其第 95 百分位數，以及 `drop`：耗時超過一次更新的幀所佔的比例。 |
| `JS` / `CORE` | 每次 commit：你的程式碼（處理器、計時器、列表列）和 NSH 的核心（佈局、文字、diff）所用的時間；每秒 commit 數、每次 commit 的原生 view 變更數。 |
| `HOP` | 變更在引擎執行緒與主執行緒之間的等待時間；引擎執行緒的繁忙程度。 |
| `CPU` / `GPU` / `MEM` | 行程：CPU（100% 為一個核心）、其 GPU 佔用比例、其記憶體佔用量（即 Activity Monitor 顯示的數字）。 |

下方的長條是最近 120 幀的主執行緒時間與一次更新時間（那條線）的比較：在一半以內為綠色，在一次更新以內為琥珀色，超出則為紅色。面板顯示期間，讀數亦會每秒記錄一次（目標 `nsh::perf`，格式與 Linux 後端相同，但使用 macOS 的幀階段 `tick`、`drain` 和 `canvas`；毫秒以平均值/p50/p95/最大值表示），可由 `nsh test --fps -v` 顯示，亦可由 `examples/gallery/tools/perf.py` 讀取。請以 release 建置進行量度；監察器關閉時不會產生任何開銷。

<a id="packaging"></a>

## 打包

```sh
nsh package --target macos [--run]           # a Rust app, from its directory
nsh package App.tsx --target macos [--run]   # a TSX app
```

這會寫出一個應用程式 bundle：

```text
.nsh/out/<Name>.app/Contents/
  Info.plist
  MacOS/<Name>               the executable: a Rust app's own runner, built with its crate; nsh's release runner for TSX
  Resources/nsh/bundle.nshc  a TSX app, compiled
  Resources/nsh/assets/…     the assets it imports (a Rust crate's `assets!()` too)
  Resources/nsh/app.json     the window title and the app's appearance
  Resources/AppIcon.icns     the icon, when nsh.json names one (converted with sips)
```

`.app` 以 ad hoc 方式簽署，因此只能在建置它的 Mac 上執行。若要發佈，請以 Developer ID 簽署並進行公證（notarize）。`--run` 會在打包後開啟應用程式。

<a id="embedding-in-a-mac-app"></a>

## 嵌入 Mac 應用程式

`nsh-platform-macos` crate（來自 NSH 儲存庫）為 Rust Mac 應用程式提供 `AppView`：一個作為 `NSView` 的 NSH 引擎。每個 `AppView` 都是獨立的，可同時執行多個。它會執行 Rust 根，即你的 crate 的根元件：

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

`Root::tokens` 為根提供其[主題](./rust.md#theme)（`nsh_base::Theme::from_json(json)?.into_tokens()`），`Root::app_id` 則是其資料保存時使用的 id。由 `nsh build` 寫出的 TSX bundle 可載入到同一個 view 中：

```rust
use nsh_platform_macos::{AppOptions, AppView, AssetBase, Bundle};

let view = AppView::new(mtm, AppOptions {
    asset_base: Some(AssetBase::Directory("app/assets".into())),
    ..AppOptions::default()
});
let code = std::fs::read_to_string("app/bundle.js").expect("bundle");
view.load(Bundle::source(code).into());
```

`AppView::load` 會取代原本執行的內容；`stop` 會結束應用程式。`asset_base` 指明 `asset:/` URI 的解析位置（`AssetBase::Directory` 或 `AssetBase::Http`）。位元組碼 bundle（`bundle.nshc`）以 `unsafe { Bundle::bytecode(bytes) }` 載入：位元組碼屬受信任的輸入，因此只應從你自己應用程式的檔案載入。
對於純粹是 NSH 的應用程式，`run_app(source, options)`（`AppSource::Rust(root)` 或 `AppSource::Bundle(bundle)`）會在視窗中開啟一個 `AppView`，並附有標準選單（About、Hide、Quit、Edit、Minimize、Zoom、Enter Full Screen、Close），應用程式可以用 `Menu.setApplicationMenu`（[`nsh/desktop`](../modules/nsh-desktop.md)）取代這個選單，並一直執行到視窗關閉為止。
預設情況下，關閉視窗或選擇 Quit 會停止引擎，並從 `run_app` 返回；
之後呼叫者可以完成清理工作，或重新啟動其可執行檔。

設定 `AppOptions { keep_alive_on_close: true, ..Default::default() }` 可在視窗關閉時讓
獨立會話繼續存活。關閉時只會隱藏視窗；
從 Dock 重新開啟時，會顯示同一個視窗和引擎。若要明確結束（Exit）
或為更新而重新啟動，請從任何執行緒呼叫 `nsh_platform_macos::quit_app()`。它
會關閉保留的視窗、停止引擎，並從 `run_app` 返回。
`nsh_core::element::desktop::close_window()` 遵循所選的視窗關閉策略。

`AppOptions::cache`（或 `AppView::set_cache`，用於之後載入的應用程式）設定應用程式存放快取、
[其下載的圖片](./images-and-assets.md#kept-on-disk)的位置，以及各自保留的容量（`CacheOptions`：預設為系統的
快取目錄和 256 MiB 的圖片）。

`AppView::set_locale(Some(locale))` 和 `AppView::set_font_scale(Some(scale))` 會讓應用程式使用你的應用程式的語言和
文字大小，取代系統的設定（`None` 會重新跟隨系統）：`locale()`、`Intl`、`fontScale()` 和文字
會隨即跟隨變化（[裝置與環境](./device-and-environment.md#in-an-embedding-app)）。

`AppView::set_theme_overrides(Some(json))` 會把你的應用程式品牌套用在應用程式的[主題](./tailwind.md#theme-tokens)之上：這是一個
採用 `nsh.json` 的 `"theme"` 格式的主題檔案，其中的 token 在淺色和深色模式下，都優先於應用程式中同名的 token，
而應用程式的其他 token 則保持不變；`bg-primary` 等 class 會隨即重新套用樣式，之後載入的應用程式也會以它啟動
（`None` 會讓應用程式恢復使用自己的主題；無法解析的檔案屬錯誤，不會造成任何變更）。

原生元件以 `AppView::register_component` 註冊；請參閱
[原生元件](./native-components.md#registering-on-macos-rust)。`set_ui_sets(sets)` 設定每個引擎提供的 UI 集合：NSH 的（`nsh_base::registry()`）和你的 crate 的（`my_app::registry()`，由 `#[native_module]`
產生），因此 view 載入的 TSX 也可以匯入你的 Rust 元件和模組。

<a id="what-differs-on-macos"></a>

## macOS 的差異

環境與桌面電腦相同：安全區域和鍵盤高度為 0，`idiom()` 是桌面（`platform.idiom` 是 `"desktop"`），`os_version()`（`platform.version`）是 macOS 版本，而深色模式會即時跟隨系統的外觀。請參閱
[裝置與環境](./device-and-environment.md)。

輸入方式與桌面電腦相同：滑鼠、觸控板（帶慣性的捲動、縮放和旋轉）和鍵盤。
可選取的文字可以用拖曳、按兩下和按三下來選取，並以 Cmd+C 複製。Escape、Option+Left、
Cmd+[ 和滑鼠的返回按鈕會關閉最新的對話框，或在 stack 中返回（在獲得焦點的輸入欄位或網頁中，Escape 只會離開該欄位或網頁；網頁會先收到這些按鍵，並保留它所用到的按鍵）；`Dialog` 是覆蓋整個視窗的一層，用來顯示應用程式的彈出視窗和背景遮罩。頁面會在頂部顯示其 `header`。在 `Input` 內任何位置按一下（包括其 padding），都會把插入點放在最接近的位置。`AlertDialog` 會在視窗上顯示 `NSAlert` sheet：警示最多可並排顯示兩個動作（取消動作在最左邊，最後一個一般動作為 Return 的預設動作）；更多的動作以及 action sheet 的動作，則按順序垂直堆疊，取消動作排在最後且沒有預設動作；按 Escape 會選擇取消動作。

<a id="keyboard"></a>

### 鍵盤

| 按鍵 | 作用 |
|---|---|
| Return | 在 `Input` 中，依 `submitBehavior` 的設定：提交（`onSubmit`）、提交並離開欄位，或換行（多行輸入） |
| Return、小鍵盤 Enter、Space | 在按鍵按下時，以 `onPress` 啟動獲得焦點的 view 一次；自動重複的按鍵會被忽略 |
| Shift+Return、Option+Return、Ctrl+Return | 在以 Return 提交的多行輸入中換行 |
| Tab、Shift+Tab（Ctrl 亦可） | 在最新的對話框內，按畫面順序移至下一個 / 上一個欄位或可按壓的 view；Option+Tab 會在多行輸入中輸入 tab |
| Escape | 離開獲得焦點的欄位；否則先清除文字選取，再關閉最新的對話框或返回 |
| Option+Left、Cmd+[、滑鼠返回按鈕 | 返回（欄位取得焦點時不適用：此時 Option+Left 會移動插入點） |
| Option / Cmd + 方向鍵（可加 Shift）；Option+Delete、Cmd+Delete；Ctrl+A / E / K | 在欄位中按詞和按行移動、選取和刪除，與所有 Mac 應用程式一樣 |
| Cmd+Z、Shift+Cmd+Z、Cmd+X / C / V / A | 還原、重做、剪下、複製、貼上、全選（`masked` 欄位不允許剪下和複製）；Cmd+A / Cmd+C 可選取和複製可選取的文字 |
| 方向鍵；Page Up / Down、Space、Shift+Space、Option+Up / Down；Home / End、Cmd+Up / Down | 捲動獲得焦點的 view 周圍或滑鼠下方的捲動 view，按行、按頁或移至開頭 / 結尾（欄位取得焦點時不適用） |
| Cmd+W、Cmd+M、Ctrl+Cmd+F、Cmd+H、Option+Cmd+H、Cmd+Q | 關閉、最小化、全螢幕、隱藏、隱藏其他、結束（`nsh package` 和 `nsh run` 應用程式的選單） |
| Cmd+R | 重新載入最新的建置（`nsh run`） |

應用程式自己的快速鍵（[`keymap`](../modules/nsh.md#keymap)）優先於以上按鍵，但發給獲得焦點的可按壓 view 的啟動按鍵，以及 Quit、Hide、Minimize 和 Full Screen 除外，這些按鍵無法被綁定。

快速鍵適用於任何鍵盤配置（在西里爾字母或希臘字母配置上，Cmd+C 是在美式配置上輸入 C 的那個鍵）。
用於確認輸入法組字（中文、日文等）的 Return，絕不會提交內容。`onKeyPress` 回報的內容與 React Native 一致：輸入的文字、`"Enter"`、`"Backspace"` 和 `"Escape"`。

不支援或有所不同的項目：

- **可縮放的捲動 view**（`zoomTo`、縮放相關的 props）。
- **`mixBlendMode`**，以及大於 1 的 `brightness()`。
- **輸入**：內容類型和自動填寫、鍵盤類型、自動大寫、字母間距；輸入附屬 view
  不會顯示（沒有軟件鍵盤），而 `keyboardShouldPersistTaps` 會被忽略。
- **`WebView` 的 `scrollable={false}`** 會阻止滑鼠滾輪和觸控板捲動頁面：它們改為捲動
  頁面周圍的應用程式捲動 view，與 iOS 相同。頁面仍可用鍵盤（Space、方向鍵）和其自身的
  腳本捲動，而在其頁面之間以觸控板滑動切換（`allowsBackForwardNavigationGestures`）亦同樣會停止。
- **無障礙功能**：自訂 `accessibilityActions`。
- **狀態列**和**觸覺回饋**（桌面平台沒有對應功能）。

<a id="see-also"></a>

## 另請參閱

- [CLI](./cli.md)：`nsh run --target macos`、`nsh package --target macos`
- [打包](./packaging.md)
- [平台專屬程式碼](./platform-specific.md)
