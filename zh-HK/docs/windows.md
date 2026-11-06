---
title: "Windows"
description: "在 Windows 上以 Direct2D 繪製的 Win32 視窗執行 Rust 和 TSX NSH 應用程式、將其打包、透過 AppView 嵌入 Win32 應用程式,以及 Windows 上的差異。"
order: 14
group: platforms
source_hash: d39f39f9d32017d0
---


# Windows

NSH 應用程式亦可在 Windows 上運行。Windows 後端以 Direct2D 在 Win32 視窗中繪製應用程式,並以 DirectWrite 排版文字;核心、響應式圖、渲染器、Taffy 佈局及原生模組均與 iOS 和 Android 相同,因此同一個應用程式可在各平台運行。在 Windows 上,`os()` 是 `Os::Windows`(TSX 中 `platform.os` 是 `"windows"`),TSX 的 `desktop={{…}}` 屬性同樣適用。視窗標題、應用程式自訂的標題列、選單列和右鍵選單,分別來自 Rust 中的 `nsh_core::element::desktop`([桌面標題列](./rust.md#desktop-title-bars))以及 TSX 中的 [`nsh/desktop`](../modules/nsh-desktop.md)。

<a id="requirements"></a>

## 系統需求

- **Windows 10 1809** 或更新版本,或 Windows 11。
- 網頁檢視需要 **WebView2 Runtime**。Windows 11 已內建,Windows 10 上則隨 Microsoft Edge 提供;若沒有安裝,`WebView` 會顯示預留位置。
- 應用程式播放的影片格式需要對應的 **Media Foundation 編解碼器**(影片透過 Windows 自身的媒體堆疊播放)。
- 若要建置 Rust 應用程式的 runner:需要安裝 Visual Studio Build Tools(含 C++ 工作負載)和 Windows SDK。若要建置 NSH 的 Windows 執行環境(從原始碼倉庫,或在 Windows 上執行 `cargo xtask dist`),還需要 LLVM(供 QuickJS 的綁定使用)。

<a id="running-an-app"></a>

## 運行應用程式

在 Windows 上,`nsh run` 會在視窗中開啟應用程式。Rust 應用程式在其目錄下運行:

```sh
nsh run                        # --target windows is the default on Windows
```

`nsh` 會以你的 crate 建置除錯版 runner 並開啟應用程式,日誌(`log::info!` 等)會輸出到終端機;修改 crate 的 Rust 程式碼後,會重新建置 runner 並重新啟動應用程式。`cargo run` 會從 crate 的 `src/main.rs`(由 `nsh init --template rust` 寫入)啟動同一個根元件:[`run_app`](#embedding-in-a-win32-app)與 `AppSource::Rust`。

TSX 應用程式需指定入口,預設以 1200×800 的視窗開啟,支援熱重載,日誌輸出到終端機,並與其他目標平台一樣提供錯誤覆蓋層:

```sh
nsh run App.tsx
```

在原始碼倉庫中,`nsh run` 會先建置開發主機(`nsh-windows-host.exe`);在 Windows 上製作的發行版會將它放在 `runtime\windows\` 中。按 Ctrl-C 會關閉視窗,關閉視窗則會結束 `nsh run`;無論以何種方式結束,主機都不會比 `nsh` 存活更久。主機亦可單獨運行已建置的 bundle:

```sh
nsh build my-app --release -o build
dist\nsh\runtime\windows\nsh-windows-host --bundle build\bundle.nshc --window-size 390x844   # in a checkout: target\debug\nsh-windows-host
```

`--window-size` 是視窗的大小,以點(point)為單位(`<width>x<height>`;適用於 TSX 應用程式)。

<a id="performance-monitor"></a>

### 效能監視器

`--fps`(`nsh run App.tsx --target windows --fps`、`nsh test --target windows --fps`、主機的 `--fps`,或 Rust 應用程式 `run_app` 中的 `AppOptions { fps: true, .. }`)會每秒記錄一次效能監視器的讀數(目標為 `nsh::perf`):包括實際顯示的幀數相對於顯示器更新率的比例、主執行緒每幀所用時間及其各階段(`tick`、`drain`、`paint`、`present`、`canvas`)、引擎的提交次數、CPU 與記憶體,格式與其他桌面平台的日誌一致(毫秒以 mean/p50/p95/max 表示)。`nsh test --fps -v` 會顯示這些數據,`examples/gallery/tools/perf.py` 則會讀取這些數據([效能報告](./performance-report.md#windows-win32-direct2d))。請以發行版本進行量度;監視器關閉時不會產生任何開銷。

<a id="packaging"></a>

## 打包

```sh
nsh package --target windows [--run]           # a Rust app, from its directory
nsh package App.tsx --target windows [--run]   # a TSX app
```

會輸出一個目錄,以及內容相同的壓縮封存檔:

```text
.nsh\out\<Name>\
  <Name>.exe             the executable, with the app's icon: a Rust app's own runner, built with its crate; nsh's release runner for TSX
  nsh\bundle.nshc         a TSX app, compiled
  nsh\assets\…           the assets it imports (a Rust crate's `assets!()` too)
  nsh\app.json           the window title, the app id, the version and the appearance
.nsh\out\<Name>.zip
```

可執行檔會在自身旁邊尋找 `nsh\`;請將整個目錄(或解壓縮 `.zip`)複製到應用程式要存放的位置:不會安裝任何東西。`nsh.json` 中的圖示會嵌入可執行檔(檔案總管和工作列都會顯示),無需任何額外工具;在其他系統上打包則會保留預設圖示。app id 會將應用程式的視窗在工作列中歸為一組。`--run` 會在打包後啟動應用程式。可執行檔沒有簽署:如要發佈,請使用你自己的憑證(`signtool`)簽署。

<a id="embedding-in-a-win32-app"></a>

## 嵌入 Win32 應用程式

`nsh-platform-windows` crate(來自 NSH 倉庫)讓 Rust Win32 應用程式可使用 `AppView`:即在你自己的視窗之內的子視窗中運行一個 NSH 引擎。每個 `AppView` 互相獨立,可同時運行多個。它會運行 Rust 根元件,即你的 crate 的根元件:

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

由 `nsh build` 產生的 TSX bundle 可載入同一個檢視,並將 `asset_base` 設為其 `assets` 目錄:

```rust
let code = std::fs::read_to_string("app/bundle.js").expect("bundle");
view.load(Bundle::source(code).into());
```

檢視是一個子視窗:由你的訊息迴圈驅動它,而當父視窗調整大小時,你需透過其 `hwnd()` 上的 `MoveWindow` 來放置它。請在它所屬視窗的執行緒上建立:其生命週期跟隨該視窗的頂層視窗,即建立時所隸屬的那個視窗。`AppView::load` 會取代原先運行的內容;`stop`(或銷毀視窗)會結束應用程式。`asset_base` 用來指定 `asset:/` URI 的解析位置(`AssetBase::Directory` 或 `AssetBase::Http`)。位元組碼 bundle(`bundle.nshc`)可用 `unsafe { Bundle::bytecode(bytes) }`(或同樣屬 unsafe 的 `Bundle::read_trusted(path)`)載入:QuickJS 位元組碼屬於受信任的輸入,因此只應載入你自己應用程式的檔案。獨立視窗為 `nsh_platform_windows::run_app(source, options)`,可搭配 `AppSource::Rust(root)` 或 `AppSource::Bundle(bundle)`。`Root::tokens` 會為根元件設定其[主題](./rust.md#theme),`Root::app_id` 則設定其資料所使用的 id。

`AppOptions::cache`(或 `AppView::set_cache`,用於之後載入的應用程式)會設定應用程式存放快取的位置、[它們下載的圖片](./images-and-assets.md#kept-on-disk)存放位置,以及各自保留的容量(`CacheOptions`:預設使用系統的快取目錄,圖片上限為 256 MiB)。

`AppView::set_locale(Some(locale))` 和 `AppView::set_font_scale(Some(scale))` 會讓應用程式使用你的應用程式的語言和文字大小,而非系統的設定(`None` 會再次跟隨系統):`locale()`、`Intl`、`fontScale()` 和文字會即時跟隨變更([裝置與環境](./device-and-environment.md#in-an-embedding-app))。

`AppView::set_theme_overrides(Some(json))` 會把你的應用程式品牌樣式套疊在應用程式的[主題](./tailwind.md#theme-tokens)之上:這是一個主題檔案,格式與 `nsh.json` 的 `"theme"` 相同,其中的 token 在淺色和深色模式下,都會優先於應用程式中同名的 token,而應用程式的其他 token 則保持不變;`bg-primary` 等 class 會即時更新樣式,之後載入的應用程式也會以此作為起點(`None` 會將應用程式自己的主題還給它;無法解析的檔案會視為錯誤,且不會造成任何變更)。

原生元件以 `AppView::register_component` 註冊;請參閱[原生元件](./native-components.md#registering-on-windows-rust)。`set_ui_sets(sets)` 會設定每個引擎所提供的 UI 集合:NSH 的(`nsh_base::registry()`)和你的 crate 的(`my_app::registry()`,由 `#[native_module]` 產生),因此檢視所載入的 TSX 亦可匯入你的 Rust 元件和模組。

<a id="what-differs-on-windows"></a>

## Windows 上的差異

環境屬於桌面平台:安全區域和鍵盤高度均為 0,`idiom()` 為桌面(`platform.idiom` 為 `"desktop"`),`os_version()`(`platform.version`)為 `"10.0"`(Windows 11 亦然:Windows 沿用了相同的版本號)。深色模式會即時跟隨「設定 > 個人化 > 色彩」,`fontScale()` 跟隨「文字大小」設定,減少動態效果跟隨動畫效果設定,語言地區則跟隨使用者的區域格式。請參閱[裝置與環境](./device-and-environment.md)。

`cursor` 樣式會在滑鼠停留於檢視上時隨更新而變化。當一批更新改變了游標時,Windows 會在整批更新完成後,依據指標下方的檢視套用新的形狀或 `"none"`。標題列和調整大小的邊框則保留系統游標。

<a id="keyboard"></a>

### 鍵盤

| 按鍵 | 作用 |
|---|---|
| Return | 在 `Input` 中,依 `submitBehavior` 的設定而定:提交(`onSubmit`)、提交並離開欄位,或換行(多行輸入) |
| Shift+Return、Alt+Return | 在以 Return 提交的多行輸入中換行(Ctrl+Return 則提交) |
| Tab、Shift+Tab | 在最上層的對話框內切換至下一個/上一個文字欄位;欄位中的文字會被選取,與 Windows 的對話框一樣 |
| Escape | 離開目前取得焦點的欄位;否則先清除文字選取,再關閉最上層的對話框或返回上一頁 |
| Alt+Left、瀏覽器「上一頁」鍵、滑鼠「上一頁」按鈕 | 返回(在欄位中同樣有效) |
| Ctrl+方向鍵、Home / End、Ctrl+Home / End(可配合 Shift);Ctrl+Backspace / Delete | 在欄位中按字詞和行移動、選取和刪除,與所有 Windows 應用程式一樣 |
| Ctrl+Z、Ctrl+Y、Ctrl+X / C / V / A;Shift+Delete、Ctrl+Insert、Shift+Insert | 復原、重做、剪下、複製、貼上、全選(`masked` 欄位不允許剪下和複製);Ctrl+A / Ctrl+C 可選取並複製可選取的文字 |
| 方向鍵;Page Up / Down、Space、Shift+Space;Home / End、Ctrl+Home / End | 捲動取得焦點的檢視周圍或滑鼠下方的捲動檢視,按一行、一頁或捲到開頭/結尾(欄位取得焦點時除外) |
| F11、Alt+F4 | 全螢幕、關閉視窗(`nsh package` 和 `nsh run` 應用程式) |
| Ctrl+R、F5 | 重新載入最新的建置(`nsh run`) |

快捷鍵適用於任何鍵盤配置(在西里爾字母或希臘字母配置上,Ctrl+C 是在美式配置上輸入 C 的那個鍵)。用來確認輸入法組字(中文、日文等)的 Return 不會觸發提交。`onKeyPress` 所回報的內容與 React Native 一致:輸入的文字、`"Enter"`、`"Backspace"` 和 `"Escape"`;貼上的文字不會被回報。

應用程式自身的快捷鍵([`keymap`](../modules/nsh.md#keymap))優先於取得焦點的欄位、導覽和捲動所使用的按鍵;Alt+F4、F11 和 Ctrl+Q 無法被綁定。

有差異或不支援的功能:

- **`WebView`**:位於具 3D 變換(透視)的檢視內的頁面不會顯示,而覆蓋在頁面上的 `backdropFilter` 不會令頁面模糊。`baseUrl` 接受 `http(s)` URL。自行帶有視窗的原生元件會停留在 NSH 繪製的所有內容之上。
- **影片**:支援已安裝的編解碼器所能解碼的格式;沒有海報圖片;設定 `controls` 時,控制列會一直顯示。
- **可縮放的捲動檢視**(`zoomTo`、縮放相關屬性);捲動指示條無法拖曳。
- **`mixBlendMode` 和 `backdropFilter`** 會被繪製,但不會繪製在具有 `filter` 或 3D 變換的檢視之內;`borderCurve: "continuous"` 會繪製圓形圓角。
- **文字**:頭部和中間省略號只適用於單行(多行文字會使用尾部省略號);彩色表情符號只支援 COLR 字型;小型大寫字母只在字型本身提供時才有效。
- **文字輸入**:鍵盤類型和自動填寫不適用(沒有軟鍵盤);Tab 鍵可在文字欄位之間移動。按右鍵會開啟編輯選單(復原、剪下、複製、貼上、刪除、全選),可選取的文字則為(複製、全選)。
- **無障礙功能**(UI Automation):警示對話框和 toast 不會公開;標題一律回報為第 1 級。
- **輸入附屬檢視**和**狀態列**(桌面平台沒有對應功能)。

<a id="see-also"></a>

## 另請參閱

- [CLI](./cli.md):`nsh run --target windows`、`nsh package --target windows`
- [打包](./packaging.md)
- [平台專屬程式碼](./platform-specific.md)
