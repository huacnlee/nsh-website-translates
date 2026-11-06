---
title: "Linux"
description: "在 Linux 上於 GTK 4 視窗中執行 Rust 和 TSX NSH 應用程式、將其打包、透過 AppView 嵌入 GTK 應用程式，以及 Linux 上的差異。"
order: 15
group: platforms
source_hash: c423cb25ff360498
---


# Linux

NSH 應用程式亦可在 Linux 上運行。Linux 後端以 GTK 4 元件繪製應用程式，並以 Pango 排版文字；核心、響應式圖、渲染器、Taffy 佈局及原生模組均與 iOS 和 Android 相同，因此同一個應用程式可在所有平台運行。在 Linux 上，`os()` 是 `Os::Linux`（TSX 中的 `platform.os` 是 `"linux"`），TSX 的 `desktop={{…}}` props 亦適用。視窗標題、應用程式自訂的標題列、選單列和右鍵選單，分別來自 Rust 中的 `nsh_core::element::desktop`（[桌面標題列](./rust.md#desktop-title-bars)）及 TSX 中的 [`nsh/desktop`](../modules/nsh-desktop.md)。

<a id="requirements"></a>

## 系統需求

- **GTK 4.14** 或以上版本。若要建置 Rust 應用程式的 runner 或 NSH 的 Linux 執行環境（從原始碼檢出或使用 `cargo xtask
  dist` on Linux) you need their development packages and clang: `libgtk-4-dev clang`），Debian 和 Ubuntu（24.04 或以上）請安裝上述套件，Arch 請使用 `gtk4 clang`，Fedora 請使用 `gtk4-devel clang`。
- **WebKitGTK 6.0**（2.40 或以上）用於 web view：Debian 和 Ubuntu 使用 `libwebkitgtk-6.0-dev`，Arch 使用 `webkitgtk-6.0`，Fedora 使用 `webkitgtk6.0-devel` 以建置執行環境。開發主機和發佈版 runner 預設會使用它，因此打包後的應用程式在運行的機器上需要 WebKitGTK 6.0（Debian 和 Ubuntu 為 `libwebkitgtk-6.0-4`；GNOME 桌面環境已內建）。在沒有開發檔案的機器上執行 `cargo xtask dist`，會建置出 web view 只是佔位元件的執行環境，其應用程式只需要 GTK。
- 應用程式播放的影片格式所需的 **GStreamer** 外掛程式（GTK 透過 GStreamer 播放影片）。

<a id="running-an-app"></a>

## 運行應用程式

在 Linux 上，`nsh run` 會在 GTK 視窗中開啟應用程式。Rust 應用程式在其目錄中運行：

```sh
nsh run                        # --target linux is the default on Linux
```

`nsh` 會連同你的 crate 建置 debug runner 並開啟應用程式，其日誌（`log::info!` 等）會顯示在終端機中；修改 crate 的 Rust 程式碼後，會重新建置 runner 並重新啟動應用程式。`cargo run` 會從 crate 的 `src/main.rs`（由 `nsh init --template rust` 寫入）啟動相同的根元件：[`run_app`](#embedding-in-a-gtk-app)，搭配 `AppSource::Rust`。

TSX 應用程式需指定其入口，預設以 390×844 的視窗開啟，並提供熱重載、終端機日誌和錯誤覆蓋層，與其他目標平台一致：

```sh
nsh run App.tsx
```

在原始碼檢出中，`nsh run` 會先建置開發主機（`nsh-linux-host`）；在 Linux 上製作的發行包會將它附於 `runtime/linux/`。按 Ctrl-C 會關閉視窗，而關閉視窗會結束 `nsh run`。該主機亦可單獨運行已建置的 bundle：

```sh
nsh build my-app --release -o build
dist/nsh/runtime/linux/nsh-linux-host --bundle build/bundle.nshc --window-size 1024x768   # in a checkout: target/debug/nsh-linux-host
```

`--window-size` 是視窗的預設大小（適用於 TSX 應用程式）；平鋪式視窗管理器可能會給予視窗不同的大小。

<a id="packaging"></a>

## 打包

```sh
nsh package --target linux [--run]           # a Rust app, from its directory
nsh package App.tsx --target linux [--run]   # a TSX app
```

會寫出一個目錄，以及同樣內容的壓縮檔：

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

可執行檔會在自身旁邊尋找 `nsh/`（指向它的符號連結亦可，例如放在 `~/.local/bin` 中）。應用程式運行的機器上必須已安裝 GTK 4、Pango 和 WebKitGTK 6.0。若要在桌面的啟動器中顯示應用程式，請將可執行檔（或連結）放到 `PATH`，將 `.desktop` 檔案放到 `~/.local/share/applications`，並將圖示放到圖示主題目錄。`--run` 會在打包後啟動應用程式。

<a id="embedding-in-a-gtk-app"></a>

## 嵌入 GTK 應用程式

`nsh-platform-linux` crate（來自 NSH 儲存庫）為 Rust GTK 應用程式提供 `AppView`：一個作為 GTK 元件的 NSH 引擎。每個 `AppView` 互相獨立，可同時運行多個。它運行 Rust 根元件，即你的 crate 的根元件：

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

`Root::tokens` 為根元件提供其[主題](./rust.md#theme)，`Root::app_id` 則是其資料保存時使用的 id。由 `nsh build` 寫出的 TSX bundle 可載入同一個 view，並將 `asset_base` 設為其 `assets` 目錄：

```rust
use nsh_platform_linux::{AppOptions, AppView, AssetBase, Bundle};

let view = AppView::new(AppOptions {
    asset_base: Some(AssetBase::Directory("app/assets".into())),
    ..AppOptions::default()
});
let code = std::fs::read_to_string("app/bundle.js").expect("bundle");
view.load(Bundle::source(code).into());
```

`AppView::load` 會取代正在運行的內容；`stop` 會結束應用程式。`asset_base` 告知它 `asset:/` URI 的解析位置（`AssetBase::Directory` 或 `AssetBase::Http`）。位元組碼 bundle（`bundle.nshc`）以 `unsafe { Bundle::bytecode(bytes) }` 載入：QuickJS 位元組碼屬於受信任的輸入，因此只應從你自己應用程式的檔案載入。獨立視窗則使用 `nsh_platform_linux::run_app(source, options)`，搭配 `AppSource::Rust(root)` 或 `AppSource::Bundle(bundle)`。

`AppOptions::cache`（或對於之後載入的應用程式使用 `AppView::set_cache`）設定應用程式保存快取、[下載的圖片](./images-and-assets.md#kept-on-disk)的位置，以及每個應用程式保留的容量（`CacheOptions`：預設為系統的快取目錄和 256 MiB 的圖片）。

`AppView::set_locale(Some(locale))` 和 `AppView::set_font_scale(Some(scale))` 讓應用程式使用你的應用程式的語言和文字大小，而非系統的（`None` 會再次跟隨系統）：`locale()`、`Intl`、`fontScale()` 和文字會即時跟隨變更（[裝置與環境](./device-and-environment.md#in-an-embedding-app)）。

`AppView::set_theme_overrides(Some(json))` 會將你的應用程式品牌套用於應用程式的[主題](./tailwind.md#theme-tokens)之上：這是一個主題檔案，格式與 `nsh.json` 的 `"theme"` 相同，其 token 在淺色和深色模式下優先於應用程式中同名的 token，而應用程式的其他 token 則保持不變；`bg-primary` 等 class 會即時更新樣式，之後載入的應用程式亦會以此開始（`None` 會讓應用程式還原其自身的主題；無法解析的檔案會視為錯誤，且不會作出任何更改）。

原生元件以 `AppView::register_component` 註冊；請參閱[原生元件](./native-components.md#registering-on-linux-rust)。`set_ui_sets(sets)` 設定每個引擎提供的 UI 集合：NSH 的（`nsh_base::registry()`）以及你的 crate 的（`my_app::registry()`，由 `#[native_module]` 產生），因此 view 載入的 TSX 亦可匯入你的 Rust 元件和模組。

<a id="what-differs-on-linux"></a>

## Linux 上的差異

環境屬於桌面環境：安全區域和鍵盤高度為 0，`idiom()` 是桌面環境（`platform.idiom` 為 `"desktop"`），`os_version()`（`platform.version`）是核心的主版本和次版本，而深色模式會即時跟隨桌面的設定（透過 XDG settings portal）。請參閱[裝置與環境](./device-and-environment.md)。

<a id="keyboard"></a>

### 鍵盤

| 按鍵 | 作用 |
|---|---|
| Return | 在 `Input` 中，依 `submitBehavior` 所指：提交（`onSubmit`）、提交並離開欄位，或換行（多行輸入） |
| Shift+Return、Alt+Return | 在以 Return 提交的多行輸入中換行（Ctrl+Return 為提交） |
| Tab、Shift+Tab | 在最新的對話框內，依畫面順序移到下一個 / 上一個欄位 |
| Escape | 離開焦點所在的欄位；否則先清除文字選取，再關閉最新的對話框或返回 |
| Alt+Left、返回鍵、滑鼠返回按鈕 | 返回（在欄位中亦適用） |
| Ctrl+方向鍵、Home / End，配合 Shift；Ctrl+Backspace / Delete | 在欄位中按字詞和行移動、選取和刪除，與所有 GTK 應用程式一致 |
| Ctrl+Z、Ctrl+Shift+Z、Ctrl+X / C / V / A | 復原、重做、剪下、複製、貼上、全選（`masked` 欄位不允許剪下和複製）；Ctrl+A / Ctrl+C 可選取和複製可選取的文字 |
| 方向鍵；Page Up / Down、Space、Shift+Space；Home / End | 將焦點所在 view 周圍或滑鼠下方的捲動檢視按一行、一頁捲動，或捲動到開頭 / 結尾（欄位擁有焦點時除外） |
| Ctrl+W、F11、Ctrl+Q | 關閉視窗、全螢幕、結束（`nsh package` 和 `nsh run` 應用程式） |
| Ctrl+R | 重新載入最新的建置（`nsh run`） |

應用程式自身的快捷鍵（[`keymap`](../modules/nsh.md#keymap)）是視窗範圍的快捷鍵控制器；Ctrl+Q 和 F11 無法綁定。

快捷鍵可配合任何鍵盤配置使用（在西里爾字母或希臘字母配置上，Ctrl+C 是在美式配置上輸入 C 的那個按鍵）。確認輸入法組字（中文、日文等）的 Return 不會提交。`onKeyPress` 回報的內容與 React Native 相同：輸入的文字、`"Enter"`、`"Backspace"` 和 `"Escape"`；貼上的文字不會被回報。

Web view 是 WebKitGTK 頁面，繪製在 NSH 的 view 之內：sheet、對話框、toast 以及在它們之後的 view 會繪製在頁面之上，而父層會裁剪並淡化它。其網站資料（cookie、儲存空間、快取）按應用程式分別保存，位於 `~/.local/share/<app id>/webkit` 和 `~/.cache/<app id>/webkit` 之下。`webview` 權限同樣適用於 frame 的頁面：未獲授權的主機的 `iframe` 會保持空白。頁面中的 Escape 會離開頁面，與文字欄位相同（除非頁面使用該按鍵）；當頁面有歷史記錄時，Alt+Left 和滑鼠返回按鈕會在頁面中返回。

不支援：

- **影片 `rate`**：GTK 只能以正常速度播放。`onEnd` 只會在不循環播放的影片中觸發。
- **可縮放的捲動檢視**（`zoomTo`、縮放 props）。
- **`mixBlendMode` 和 `backdropFilter`**（背景顏色仍會繪製）；`borderCurve: "continuous"` 會繪製圓形圓角。
- **輸入附屬視圖**和**狀態列**（桌面環境沒有對應功能）。
- **無障礙功能**：`accessible` 分組、自訂 `accessibilityActions`；改以朗讀 live region。

<a id="see-also"></a>

## 另請參閱

- [CLI](./cli.md)：`nsh run --target linux`、`nsh package --target linux`
- [打包](./packaging.md)
- [平台專屬程式碼](./platform-specific.md)
