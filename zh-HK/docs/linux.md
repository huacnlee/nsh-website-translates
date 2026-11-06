---
title: "Linux"
description: "在 Linux 上以 GTK 4 視窗執行 Rust 與 TSX 的 NSH 應用程式、將其打包、使用 AppView 嵌入 GTK 應用程式中,以及 Linux 上的差異之處。"
order: 15
group: platforms
---

# Linux

NSH 應用程式也能在 Linux 上執行。Linux 後端以 GTK 4 元件進行繪製,並以 Pango 排版文字;核心、響應式圖(reactive graph)、渲染器、Taffy 版面配置與原生模組都與 iOS 和 Android 相同,因此一個應用程式即可在所有平台上執行。在 Linux 上,`os()` 即是 `Os::Linux`(TSX 中 `platform.os` 即是 `"linux"`),TSX 的 `desktop={{…}}` 屬性同樣適用。視窗標題、應用程式自訂的標題列、選單列與右鍵選單,在 Rust 中來自 `nsh_core::element::desktop`([Desktop title bars](./rust.md#desktop-title-bars)),在 TSX 中來自 [`nsh/desktop`](../modules/nsh-desktop.md)。

<a id="requirements"></a>

## 需求

- **GTK 4.14** 或更新版本。若要建置 Rust 應用程式的 runner 或 NSH 的 Linux 執行階段(從原始碼檢出,或使用 `cargo xtask
  dist` on Linux) you need their development packages and clang: `libgtk-4-dev clang`,適用於 Debian 與 Ubuntu(24.04 或更新版本)),在 Arch 上使用 `gtk4 clang`,在 Fedora 上使用 `gtk4-devel clang`。
- **WebKitGTK 6.0**(2.40 或更新版本),用於 Web 檢視:在 Debian 與 Ubuntu 上為 `libwebkitgtk-6.0-dev`,在 Arch 上為 `webkitgtk-6.0`,在 Fedora 上為 `webkitgtk6.0-devel`,用於建置執行階段。開發主機與發行版 runner 預設都會使用它,因此打包後的應用程式在執行的機器上需要有 WebKitGTK 6.0(Debian 與 Ubuntu 上為 `libwebkitgtk-6.0-4`;GNOME 桌面環境已內建)。在沒有其開發檔案的機器上執行 `cargo xtask dist`,會建置出 Web 檢視僅為預留位置的執行階段,其應用程式只需要 GTK。
- 應用程式所播放影片格式所需的 **GStreamer** 外掛(GTK 透過 GStreamer 播放影片)。

<a id="running-an-app"></a>

## 執行應用程式

在 Linux 上,`nsh run` 會在 GTK 視窗中開啟應用程式。Rust 應用程式從其目錄執行:

```sh
nsh run                        # --target linux is the default on Linux
```

`nsh` 會連同你的 crate 建置除錯版 runner 並開啟應用程式,其日誌(`log::info!` 等)會顯示在終端機中;修改 crate 的 Rust 程式碼後,會重新建置 runner 並重新啟動應用程式。`cargo run` 會從 crate 的 `src/main.rs`(由 `nsh init --template rust` 寫入)啟動相同的根元件:[`run_app`](#embedding-in-a-gtk-app),搭配 `AppSource::Rust`。

TSX 應用程式需指定其進入點,預設在 390×844 的視窗中開啟,並提供熱重載、終端機日誌與錯誤覆蓋層,與其他目標平台相同:

```sh
nsh run App.tsx
```

在原始碼檢出中,`nsh run` 會先建置開發主機(`nsh-linux-host`);在 Linux 上製作的發行版會將它放在 `runtime/linux/` 中。按下 Ctrl-C 會關閉視窗,而關閉視窗會結束 `nsh run`。主機也可以單獨執行已建置的 bundle:

```sh
nsh build my-app --release -o build
dist/nsh/runtime/linux/nsh-linux-host --bundle build/bundle.nshc --window-size 1024x768   # in a checkout: target/debug/nsh-linux-host
```

`--window-size` 是視窗的預設大小(適用於 TSX 應用程式);平鋪式視窗管理員可能會給視窗不同的大小。

<a id="packaging"></a>

## 打包

```sh
nsh package --target linux [--run]           # a Rust app, from its directory
nsh package App.tsx --target linux [--run]   # a TSX app
```

會寫出一個目錄,以及同樣內容的封存檔:

```text
.nsh/out/<Name>/
  <Name>                 the executable: a Rust app's own runner, built with its crate; nsh's release runner for TSX
  nsh/bundle.nshc        a TSX app, compiled
  nsh/assets/…           the assets it imports (a Rust crate's `assets!()` too)
  nsh/app.json           the window title and the application id
  <id>.desktop           a desktop entry (StartupWMClass is the id)
  <id>.png               the icon, when nsh.json names one
.nsh/out/<Name>.tar.gz
```

可執行檔會在自身旁邊尋找 `nsh/`(指向它的符號連結,例如放在 `~/.local/bin` 中,同樣可行)。應用程式執行的機器上必須已安裝 GTK 4、Pango 與 WebKitGTK 6.0。若要讓應用程式顯示在桌面的啟動器中,請將可執行檔(或連結)放到 `PATH`,將 `.desktop` 檔案放到 `~/.local/share/applications`,並將圖示放到圖示主題目錄。`--run` 會在打包後啟動應用程式。

<a id="embedding-in-a-gtk-app"></a>

## 嵌入 GTK 應用程式

`nsh-platform-linux` crate(來自 NSH 儲存庫)為 Rust GTK 應用程式提供 `AppView`:將一個 NSH 引擎作為 GTK 元件。每個 `AppView` 都是獨立的;可同時執行多個。它會執行 Rust 根元件,也就是你的 crate 的根元件:

```rust
use std::rc::Rc;
use nsh_platform_linux::{gtk4 as gtk, set_ui_sets, AppOptions, AppView, Root};
use gtk::prelude::*;

fn main() -> gtk::glib::ExitCode {
    // Once, before the first view: the UI sets the apps import (NSH's and your crate's).
    set_ui_sets(vec![nsh_base::registry(), my_app::registry()]);
    let app = gtk::Application::builder().application_id("com.example.host").build();
    app.connect_activate(|app| {
        let window = gtk::ApplicationWindow::builder().application(app).default_width(390).default_height(844).build();
        let view = AppView::new(AppOptions::default());
        // register native components here, before loading
        view.load(Root::of::<my_app::App>().into());
        window.set_child(Some(&view.widget()));
        // The window keeps the view; closing it stops the app.
        let keep = std::cell::RefCell::new(Some(Rc::clone(&view)));
        window.connect_destroy(move |_| if let Some(view) = keep.take() { view.stop() });
        window.present();
    });
    app.run()
}
```

`Root::tokens` 為根元件提供其[主題](./rust.md#theme),`Root::app_id` 則提供其資料所保存的 id。由 `nsh build` 寫出的 TSX bundle 可載入同一個檢視,並將 `asset_base` 設為其 `assets` 目錄:

```rust
use nsh_platform_linux::{AppOptions, AppView, AssetBase, Bundle};

let view = AppView::new(AppOptions {
    asset_base: Some(AssetBase::Directory("app/assets".into())),
    ..AppOptions::default()
});
let code = std::fs::read_to_string("app/bundle.js").expect("bundle");
view.load(Bundle::source(code).into());
```

`AppView::load` 會取代原本執行的內容;`stop` 會結束應用程式。`asset_base` 會告訴它 `asset:/` URI 要在何處解析(`AssetBase::Directory` 或 `AssetBase::Http`)。位元組碼 bundle(`bundle.nshc`)以 `unsafe { Bundle::bytecode(bytes) }` 載入:QuickJS 位元組碼屬於受信任的輸入,因此只能從你自己應用程式的檔案載入。獨立視窗則為 `nsh_platform_linux::run_app(source, options)`,搭配 `AppSource::Rust(root)` 或 `AppSource::Bundle(bundle)`。

`AppOptions::cache`(或針對接下來載入之應用程式的 `AppView::set_cache`)會設定這些應用程式保存快取與[其下載的圖片](./images-and-assets.md#kept-on-disk)的位置,以及各自保留的容量(`CacheOptions`:預設為系統的快取目錄與 256 MiB 的圖片)。

`AppView::set_locale(Some(locale))` 與 `AppView::set_font_scale(Some(scale))` 會讓應用程式使用你的應用程式的語言與文字大小,而非系統的(`None` 會重新跟隨系統):`locale()`、`Intl`、`fontScale()` 與文字會立即跟著變更([Device and environment](./device-and-environment.md#in-an-embedding-app))。

`AppView::set_theme_overrides(Some(json))` 會將你的應用程式品牌套用在應用程式的[主題](./tailwind.md#theme-tokens)之上:這是一個主題檔案,格式同 `nsh.json` 的 `"theme"`,其中的 token 在淺色與深色模式下,會優先於應用程式中同名的 token,而應用程式的其他 token 保持不變;諸如 `bg-primary` 的類別會立即重新套用樣式,之後載入的應用程式也會以此開始(`None` 會還給應用程式它自己的主題;無法解析的檔案會產生錯誤且不會變更任何內容)。

原生元件以 `AppView::register_component` 註冊;請參閱[原生元件](./native-components.md#registering-on-linux-rust)。`set_ui_sets(sets)` 會設定每個引擎所提供的 UI 集合:NSH 的(`nsh_base::registry()`)以及你的 crate 的(`my_app::registry()`,由 `#[native_module]` 產生),因此檢視所載入的 TSX 也能匯入你的 Rust 元件與模組。

<a id="what-differs-on-linux"></a>

## Linux 上的差異

環境屬於桌面環境:安全區域與鍵盤高度皆為 0,`idiom()` 為桌面環境(`platform.idiom` 為 `"desktop"`),`os_version()`(`platform.version`)為核心的主要與次要版本,深色模式則會即時跟隨桌面環境的設定(透過 XDG settings portal)。請參閱 [Device and environment](./device-and-environment.md)。

<a id="keyboard"></a>

### 鍵盤

| 按鍵 | 作用 |
|---|---|
| Return | 在 `Input` 中,依 `submitBehavior` 所指定:送出(`onSubmit`)、送出並離開欄位,或換行(多行輸入) |
| Shift+Return、Alt+Return | 在 Return 會送出的多行輸入中換行(Ctrl+Return 為送出) |
| Tab、Shift+Tab | 依畫面順序移至下一個 / 上一個欄位,範圍限於最新的對話框內 |
| Escape | 離開焦點所在的欄位;否則先清除文字選取,再關閉最新的對話框或返回 |
| Alt+Left、返回鍵、滑鼠返回按鈕 | 返回(在欄位中也適用) |
| Ctrl+方向鍵、Home / End,搭配 Shift;Ctrl+Backspace / Delete | 在欄位中依字詞與行移動、選取與刪除,與所有 GTK 應用程式相同 |
| Ctrl+Z、Ctrl+Shift+Z、Ctrl+X / C / V / A | 復原、重做、剪下、複製、貼上、全選(`masked` 欄位不允許剪下與複製);Ctrl+A / Ctrl+C 可選取並複製可選取的文字 |
| 方向鍵;Page Up / Down、Space、Shift+Space;Home / End | 依一行、一頁、至開頭 / 結尾的方式,捲動焦點檢視周圍或滑鼠下方的捲動檢視(欄位擁有焦點時不適用) |
| Ctrl+W、F11、Ctrl+Q | 關閉視窗、全螢幕、結束(`nsh package` 與 `nsh run` 應用程式) |
| Ctrl+R | 重新載入最新的建置(`nsh run`) |

應用程式自己的快速鍵([`keymap`](../modules/nsh.md#keymap))是視窗範圍的快速鍵控制器;Ctrl+Q 與 F11 無法被綁定。

快速鍵可搭配任何鍵盤配置運作(在西里爾字母或希臘字母配置上,Ctrl+C 是在美式配置上輸入 C 的那個按鍵)。確認輸入法組字(中文、日文等)的 Return 絕不會送出。`onKeyPress` 會回報 React Native 所回報的內容:輸入的文字、`"Enter"`、`"Backspace"` 與 `"Escape"`;貼上的文字不會被回報。

Web 檢視是 WebKitGTK 頁面,繪製在 NSH 的檢視之內:工作表、對話框、提示訊息與其後的檢視會繪製在頁面之上,而父層會裁切並淡化該頁面。其網站資料(Cookie、儲存空間、快取)會依應用程式分別保存,位於 `~/.local/share/<app id>/webkit` 與 `~/.cache/<app id>/webkit` 之下。`webview` 權限同樣適用於 frame 的頁面:對於未授予你的應用程式的主機,其 `iframe` 會保持空白。在頁面中按 Escape 會離開頁面,與文字欄位相同(除非該頁面使用它);當頁面有歷史記錄時,Alt+Left 與滑鼠返回按鈕會在頁面中返回上一頁。

不支援:

- **影片 `rate`**:GTK 僅以正常速度播放。`onEnd` 僅會在不循環的影片上觸發。
- **可縮放的捲動檢視**(`zoomTo`,縮放相關屬性)。
- **`mixBlendMode` 與 `backdropFilter`**(背景色仍會繪製);`borderCurve: "continuous"` 會繪製圓形圓角。
- **輸入輔助檢視**與**狀態列**(桌面環境中沒有對應的功能)。
- **無障礙**:`accessible` 分組、自訂 `accessibilityActions`;改為朗讀即時區域(live region)。

<a id="see-also"></a>

## 另請參閱

- [CLI](./cli.md):`nsh run --target linux`、`nsh package --target linux`
- [Packaging](./packaging.md)
- [Platform-specific code](./platform-specific.md)
