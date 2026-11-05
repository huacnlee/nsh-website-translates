---
title: "Windows"
description: "在 Windows 上以 Direct2D 繪製的 Win32 視窗中執行 Rust 與 TSX 的 NSH 應用程式、進行封裝、使用 AppView 將其嵌入 Win32 應用程式,以及 Windows 上的差異之處。"
order: 14
group: platforms
source_hash: d39f39f9d32017d0
---

# Windows

NSH 應用程式也能在 Windows 上執行。Windows 後端使用 Direct2D 在 Win32 視窗中繪製應用程式，並以 DirectWrite 排版文字；核心、響應式圖（reactive graph）、渲染器、Taffy 版面配置以及原生模組都與 iOS 和 Android 相同，因此同一個應用程式可以在所有平台上執行。在 Windows 上，`os()` 為 `Os::Windows`（`platform.os` 在 TSX 中為 `"windows"`），且 TSX 的 `desktop={{…}}` 屬性同樣適用。視窗標題、應用程式自訂的標題列、選單列與右鍵選單，在 Rust 中來自 `nsh_core::element::desktop`（[桌面版標題列](./rust.md#desktop-title-bars)），在 TSX 中來自 [`nsh/desktop`](../modules/nsh-desktop.md)。

<a id="requirements"></a>

## 系統需求

- **Windows 10 1809** 或更新版本，或 Windows 11。
- 網頁檢視需要 **WebView2 Runtime**。Windows 11 以及 Windows 10 上的 Microsoft Edge 皆已內建；若沒有安裝，`WebView` 會顯示預留位置。
- 應用程式播放的影片格式需要對應的 **Media Foundation 編解碼器**（影片透過 Windows 自身的媒體堆疊播放）。
- 若要建置 Rust 應用程式的 runner：需要安裝含 C++ 工作負載的 Visual Studio Build Tools 以及 Windows SDK。若要建置 NSH 的 Windows 執行階段（從原始碼 checkout 建置，或在 Windows 上執行 `cargo xtask dist`），還需要 LLVM（供 QuickJS 的繫結使用）。

<a id="running-an-app"></a>

## 執行應用程式

在 Windows 上，`nsh run` 會在視窗中開啟應用程式。Rust 應用程式在其目錄下執行：

```sh
nsh run                        # --target windows is the default on Windows
```

`nsh` 會以你的 crate 建置除錯版 runner 並開啟應用程式，其記錄（`log::info!` 等）會輸出在終端機中；當 crate 的 Rust 程式碼有變更時，會重新建置 runner 並重新啟動應用程式。`cargo run` 會從 crate 的 `src/main.rs`（由 `nsh init --template rust` 寫入）啟動相同的根元件：[`run_app`](#embedding-in-a-win32-app)，搭配 `AppSource::Rust`。

TSX 應用程式需指定其進入點，預設開啟 1200×800 的視窗，並提供熱重載、終端機記錄與錯誤覆蓋層，與其他目標平台相同：

```sh
nsh run App.tsx
```

在 checkout 中，`nsh run` 會先建置開發用 host（`nsh-windows-host.exe`）；在 Windows 上製作的發行版會將它放在 `runtime\windows\` 中。按下 Ctrl-C 會關閉視窗，而關閉視窗則會結束 `nsh run`；無論以何種方式結束，host 都不會比 `nsh` 活得更久。host 也可以單獨執行已建置的 bundle：

```sh
nsh build my-app --release -o build
dist\nsh\runtime\windows\nsh-windows-host --bundle build\bundle.nshc --window-size 390x844   # in a checkout: target\debug\nsh-windows-host
```

`--window-size` 為視窗大小，單位為點（`<width>x<height>`；僅限 TSX 應用程式）。

<a id="performance-monitor"></a>

### 效能監控

`--fps`（`nsh run App.tsx --target windows --fps`、`nsh test --target windows --fps`、host 的 `--fps`，或在 Rust 應用程式的 `run_app` 中使用 `AppOptions { fps: true, .. }`）會每秒記錄一次效能監控的讀數（目標 `nsh::perf`）：包括顯示的幀數與顯示器更新率之比、主執行緒每幀的耗時及其各階段（`tick`、`drain`、`paint`、`present`、`canvas`）、引擎的提交次數、CPU 與記憶體，格式與其他桌面平台的記錄相同（毫秒以 mean/p50/p95/max 表示）。`nsh test --fps -v` 會顯示這些讀數，`examples/gallery/tools/perf.py` 則會讀取它們（[效能報告](./performance-report.md#windows-win32-direct2d)）。請在 release 版本上進行量測；監控關閉時不會產生任何成本。

<a id="packaging"></a>

## 打包

```sh
nsh package --target windows [--run]           # a Rust app, from its directory
nsh package App.tsx --target windows [--run]   # a TSX app
```

會產生一個目錄，以及內容相同的封存檔：

```text
.nsh\out\<Name>\
  <Name>.exe             the executable, with the app's icon: a Rust app's own runner, built with its crate; nsh's release runner for TSX
  nsh\bundle.nshc         a TSX app, compiled
  nsh\assets\…           the assets it imports (a Rust crate's `assets!()` too)
  nsh\app.json           the window title, the app id, the version and the appearance
.nsh\out\<Name>.zip
```

可執行檔會在自身旁邊尋找 `nsh\`；請將整個目錄複製（或解壓縮 `.zip`）到應用程式要存放的位置：不需要任何安裝。來自 `nsh.json` 的圖示會嵌入可執行檔中（檔案總管與工作列都會顯示它），不需要任何額外工具；若在其他系統上打包，則會保留預設圖示。應用程式 id 用於在工作列中將應用程式的視窗歸為一組。`--run` 會在打包後啟動應用程式。可執行檔未經簽署：若要發行，請以你自己的憑證簽署（`signtool`）。

<a id="embedding-in-a-win32-app"></a>

## 嵌入 Win32 應用程式

`nsh-platform-windows` crate（來自 NSH 儲存庫）為 Rust 的 Win32 應用程式提供 `AppView`：在你自己的視窗之子視窗中執行一個 NSH 引擎。每個 `AppView` 都是獨立的，可以同時執行多個。它執行的是 Rust 根元件，也就是你 crate 的根元件：

```rust
use std::rc::Rc;
use nsh_platform_windows::{
    windows::{self, Win32::{Foundation::HWND, System::Ole::OleInitialize, UI::WindowsAndMessaging::MoveWindow}},
    set_ui_sets, AppOptions, AppView, Root,
};

/// Called on the thread that runs your message loop, with your window.
fn embed(parent: HWND) -> windows::core::Result<Rc<AppView>> {
    // Once per thread: COM and OLE (the clipboard, image decoding).
    unsafe { OleInitialize(None)? };
    // Once, before the first view: the UI sets the apps import (NSH's and your crate's).
    set_ui_sets(vec![nsh_base::registry(), my_app::registry()]);
    let view = AppView::new(
        Some(parent),
        AppOptions {
            app_id: "com.example.host".into(),
            ..AppOptions::default()
        },
    )?;
    // register native components here, before loading
    view.load(Root::of::<my_app::App>().into());
    Ok(view)
}

// On WM_SIZE of `parent`:
// unsafe { MoveWindow(view.hwnd(), 0, 0, width, height, true) };
```

由 `nsh build` 產生的 TSX bundle 可以載入同一個檢視中，並將 `asset_base` 設為其 `assets` 目錄：

```rust
let code = std::fs::read_to_string("app/bundle.js").expect("bundle");
view.load(Bundle::source(code).into());
```

此檢視是一個子視窗：由你的訊息迴圈驅動它，當父視窗調整大小時，請以其 `hwnd()` 上的 `MoveWindow` 來擺放它。請在其所在視窗的執行緒上建立它：其生命週期跟隨該視窗的最上層視窗，也就是建立它時所在的那個。`AppView::load` 會取代正在執行的內容；`stop`（或銷毀該視窗）會結束應用程式。`asset_base` 用來指定 `asset:/` URI 的解析位置（`AssetBase::Directory` 或 `AssetBase::Http`）。位元組碼 bundle（`bundle.nshc`）可用 `unsafe { Bundle::bytecode(bytes) }`（或同樣屬於 unsafe 的 `Bundle::read_trusted(path)`）載入：QuickJS 位元組碼屬於受信任的輸入，因此只能從你自己應用程式的檔案載入。獨立視窗為 `nsh_platform_windows::run_app(source, options)`，可搭配 `AppSource::Rust(root)` 或 `AppSource::Bundle(bundle)`。`Root::tokens` 會為根元件指定其[主題](./rust.md#theme)，`Root::app_id` 則指定用來保存其資料的 id。

`AppOptions::cache`（或用於之後載入之應用程式的 `AppView::set_cache`）會設定應用程式存放快取的位置、[其下載的圖片](./images-and-assets.md#kept-on-disk)，以及各自保留的容量（`CacheOptions`：預設為系統的快取目錄與 256 MiB 的圖片）。

`AppView::set_locale(Some(locale))` 與 `AppView::set_font_scale(Some(scale))` 會讓應用程式使用你的應用程式所設定的語言與文字大小，而非系統的設定（`None` 會再次跟隨系統）：`locale()`、`Intl`、`fontScale()` 與文字會立即跟著更新（[裝置與環境](./device-and-environment.md#in-an-embedding-app)）。

`AppView::set_theme_overrides(Some(json))` 會將你的應用程式品牌套用在應用程式的[主題](./tailwind.md#theme-tokens)之上：這是一個主題檔，格式與 `nsh.json` 的 `"theme"` 相同，其中的 token 在淺色與深色模式下會優先於應用程式中同名的 token，而應用程式的其他 token 則維持不變；諸如 `bg-primary` 的類別會立即重新套用樣式，之後載入的應用程式也會以它作為起點（`None` 會把應用程式自己的主題還給它；無法解析的檔案會視為錯誤，且不會變更任何內容）。

原生元件以 `AppView::register_component` 註冊；請參閱[原生元件](./native-components.md#registering-on-windows-rust)。`set_ui_sets(sets)` 會設定每個引擎所提供的 UI 集合：NSH 的（`nsh_base::registry()`）以及你的 crate 的（`my_app::registry()`，由 `#[native_module]` 產生），因此檢視所載入的 TSX 也能匯入你的 Rust 元件與模組。

<a id="what-differs-on-windows"></a>

## Windows 上的差異

環境與桌面平台一致：安全區域與鍵盤高度為 0，`idiom()` 為桌面（`platform.idiom` 為 `"desktop"`），`os_version()`（`platform.version`）為 `"10.0"`（在 Windows 11 上也是如此：Windows 沿用了相同的版本號）。深色模式會即時跟隨「設定 > 個人化 > 色彩」，`fontScale()` 跟隨「文字大小」設定，減少動態效果跟隨動畫效果設定，地區設定則跟隨使用者的地區格式。請參閱[裝置與環境](./device-and-environment.md)。

`cursor` 樣式會在滑鼠停留於檢視上時跟著更新。當一批更新改變了游標時，Windows 會在整批更新完成後，依據指標下方的檢視套用新的形狀或 `"none"`。標題列與調整大小的邊框則保留系統的游標。

<a id="keyboard"></a>

### 鍵盤

| 按鍵 | 作用 |
|---|---|
| Return | 在 `Input` 中，依 `submitBehavior` 的設定而定：提交（`onSubmit`）、提交並離開欄位，或換行（多行輸入） |
| Shift+Return、Alt+Return | 在 Return 會提交的多行輸入中換行（Ctrl+Return 提交） |
| Tab、Shift+Tab | 在最上層的對話方塊內移至下一個／上一個文字欄位；欄位中的文字會被選取，與 Windows 的對話方塊相同 |
| Escape | 離開已取得焦點的欄位；否則先清除文字選取，再關閉最上層的對話方塊或返回上一頁 |
| Alt+Left、瀏覽器「上一頁」鍵、滑鼠上一頁按鈕 | 返回（在欄位中也適用） |
| Ctrl+方向鍵、Home / End、Ctrl+Home / End，可搭配 Shift；Ctrl+Backspace / Delete | 在欄位中以字詞與行為單位移動、選取與刪除，與所有 Windows 應用程式相同 |
| Ctrl+Z、Ctrl+Y、Ctrl+X / C / V / A；Shift+Delete、Ctrl+Insert、Shift+Insert | 復原、重做、剪下、複製、貼上、全選（`masked` 欄位不允許剪下與複製）；Ctrl+A / Ctrl+C 可選取並複製可選取的文字 |
| 方向鍵；Page Up / Down、Space、Shift+Space；Home / End、Ctrl+Home / End | 捲動已取得焦點之檢視周圍或滑鼠下方的捲動檢視，單位為一行、一頁，或捲到開頭／結尾（欄位取得焦點時不適用） |
| F11、Alt+F4 | 全螢幕、關閉視窗（`nsh package` 與 `nsh run` 應用程式） |
| Ctrl+R、F5 | 重新載入最新的建置（`nsh run`） |

快捷鍵可搭配任何鍵盤配置使用（在西里爾字母或希臘字母配置上，Ctrl+C 是在美式配置上會輸入 C 的那個按鍵）。用來確認輸入法組字（中文、日文等）的 Return 不會提交。`onKeyPress` 回報的內容與 React Native 相同：輸入的文字、`"Enter"`、`"Backspace"` 與 `"Escape"`；貼上的文字不會被回報。

應用程式自己的快捷鍵（[`keymap`](../modules/nsh.md#keymap)）優先於已取得焦點之欄位的按鍵、導覽與捲動；Alt+F4、F11 與 Ctrl+Q 無法被綁定。

不同或不支援的項目：

- **`WebView`**：位於具有 3D 轉換（透視）之檢視內的頁面不會顯示，且頁面上方的 `backdropFilter` 不會使其模糊。`baseUrl` 接受 `http(s)` URL。自帶視窗的原生元件會停留在 NSH 繪製的所有內容之上。
- **影片**：支援已安裝之編解碼器能解碼的格式；沒有海報圖；使用 `controls` 時控制列一律顯示。
- **可縮放的捲動檢視**（`zoomTo`、縮放屬性）；捲動指示器無法拖曳。
- **`mixBlendMode` 與 `backdropFilter`** 會被繪製，但在具有 `filter` 或 3D 轉換的檢視內則不會；`borderCurve: "continuous"` 會繪製圓形圓角。
- **文字**：頭部與中間的省略號僅適用於單行（多行則使用尾部省略號）；彩色 emoji 僅支援 COLR 字型；小型大寫字母僅在字型提供時可用。
- **文字輸入**：鍵盤類型與自動填入不適用（沒有軟體鍵盤）；Tab 會在文字欄位之間移動。按右鍵會開啟編輯選單（復原、剪下、複製、貼上、刪除、全選），可選取的文字則為（複製、全選）。
- **無障礙功能**（UI Automation）：警示對話方塊與 toast 不會公開；標題一律回報為層級 1。
- **輸入附屬檢視**與**狀態列**（桌面平台上沒有對應的功能）。

<a id="see-also"></a>

## 另請參閱

- [CLI](./cli.md)：`nsh run --target windows`、`nsh package --target windows`
- [打包](./packaging.md)
- [平台專屬程式碼](./platform-specific.md)
