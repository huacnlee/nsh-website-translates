---
title: "GPUI"
description: "在 GPUI 或 GPUI Kit 應用程式中使用 AppView 嵌入 Rust 與 TSX 的 NSH 應用程式,由 GPUI 在 macOS、Windows 和 Linux 上繪製;也可以在 GPUI 開發宿主中試用 TSX 應用程式,並了解 GPUI 後端有哪些不同之處。"
order: 15.5
group: platforms
---

# GPUI

GPUI 後端使用 [GPUI](https://gpui-kit.com)（GPUI Fast）繪製 NSH 應用程式。GPUI 是 GPU 加速的 UI 框架，GPUI Kit 即建立於其上，支援 macOS、Windows 與 Linux。它是嵌入 GPUI 與 GPUI Kit 應用程式時使用的後端：`AppView` 是一個 GPUI 檢視，因此 GPUI 或 GPUI Kit 應用程式可以在自己的元素樹中的任何位置顯示 NSH 應用程式，不論是它自己的 Rust 根元件，或是它載入的 TSX。獨立應用程式則使用各桌面平台自己的後端來執行與打包：[macOS](./macos.md)（AppKit）、[Windows](./windows.md)（Win32）與 [Linux](./linux.md)（GTK）。核心、響應式圖、渲染器、Taffy 版面配置與原生模組都與其他平台相同，因此一個應用程式可以在所有平台上執行。`os()`（TSX 中為 `platform.os`）是它所執行的作業系統（macOS、Windows 或 Linux），TSX 的 `desktop={{…}}` 屬性也同樣適用。

[macOS](./macos.md)（AppKit）、[Windows](./windows.md)（Win32）與 [Linux](./linux.md)（GTK）後端的每個元素與模組在此都有提供；GPUI 以自己的方式繪製的部分，請參閱[差異](#differences)。

<a id="how-it-works"></a>

## 運作方式

- **每個表面一個元素。** 表面是一個 GPUI 元素，會填滿其父元素給予的空間，並以 GPUI 的基本繪製元件繪製整個檢視樹：四邊形、陰影、路徑、字形與影像。如同 Windows 上的做法，NSH 為每個節點保留一個檢視，且只在提交（commit）變更了某些內容時才重新繪製。
- **文字在引擎執行緒上排版**，使用 GPUI 的文字系統（應用程式自己的字型），並由 NSH 斷行；主執行緒只負責繪製字形。
- **每次提交只跳轉一次。** 引擎在自己的執行緒上執行；每次提交都是送到 GPUI 主執行緒的一個閉包，由它通知檢視。
- **輸入**來自 GPUI 的滑鼠、捲動、按鍵與輸入法事件；命中測試、按下、回應者系統、捲動與文字編輯的邏輯都與 Windows 後端相同。

<a id="requirements"></a>

## 需求

- macOS、Windows 或 Linux，且具備 GPUI 可用於繪製的 GPU（macOS 使用 Metal，Windows 使用 DirectX，Linux 使用 Vulkan）。
- 在 macOS 上，從原始碼檢出建置你的 GPUI 應用程式或執行階段時，會用到 Xcode 的 Metal Toolchain（`xcodebuild -downloadComponent
  MetalToolchain`), which compiles GPUI's shaders ahead of time. On a Mac without it, `nsh run` 會以 GPUI 的 `runtime-shaders` 功能建置執行階段，並會如此提示：著色器在應用程式啟動時編譯（第一次約需零點幾秒，之後由 macOS 快取）。
- 在 Linux 上：需要 Vulkan 驅動程式、搭配 `libxkbcommon` 的 Wayland 或 X11、GTK 3 與 WebKitGTK 4.1（網頁檢視），以及 GStreamer 1.20 或更新版本及其 base 與 good 外掛程式（影片）。網頁檢視需要 X11：在 Wayland 桌面上，請於 Xwayland 下執行應用程式（`WAYLAND_DISPLAY=` 為空），否則網頁檢視只會顯示預留位置。從原始碼檢出建置執行階段時也需要開發套件；在 Debian 與 Ubuntu 上：

  ```sh
  sudo apt-get install clang libclang-dev pkg-config libfontconfig-dev libfreetype-dev libwayland-dev libx11-xcb-dev \
    libxcb1-dev libxkbcommon-dev libxkbcommon-x11-dev libzstd-dev libvulkan1 libgtk-3-dev libwebkit2gtk-4.1-dev \
    libgstreamer1.0-dev libgstreamer-plugins-base1.0-dev gstreamer1.0-plugins-good
  ```

<a id="running-an-app"></a>

## 執行應用程式

Rust 應用程式在你的 GPUI 應用程式內執行：以 `AppView` 嵌入其根元件（[嵌入 GPUI 應用程式](#embedding-in-a-gpui-app)），並 `cargo run` 該 GPUI 應用程式；你的 crate 與該應用程式屬於同一個 Cargo 建置。單獨執行時，Rust 應用程式會使用此作業系統自己的後端（`nsh run --target macos`、`windows` 或 `linux`）。

TSX 應用程式在 GPUI 開發主機中執行：

```sh
nsh run App.tsx --target gpui
```

它會在 GPUI 視窗中開啟應用程式（預設為 1200×800），就如同嵌入它的 GPUI 應用程式所顯示的一樣，並提供熱重載、終端機中的記錄，以及與其他目標相同的錯誤覆蓋層。開發主機（`nsh-gpui-host`）在每個作業系統上都直接就地執行，不需要外包應用程式套件。在原始碼檢出中，`nsh run` 會先建置它；發行版則將它放在 `runtime/gpui/` 中。主機也可以單獨執行已建置的套件：

```sh
nsh build my-app --release -o build
dist/nsh/runtime/gpui/nsh-gpui-host --bundle build/bundle.nshc --window-size 390x844   # in a checkout: target/debug/nsh-gpui-host
```

`--window-size` 是以點（point）為單位的視窗大小（`<width>x<height>`）。

<a id="packaging"></a>

## 打包

GPUI 應用程式將 NSH 內建於自己的可執行檔中：以 `AppView` 嵌入應用程式的 Rust 根元件或 TSX 套件（[嵌入 GPUI 應用程式](#embedding-in-a-gpui-app)），並以其本身作為 GPUI 應用程式來建置與發布。獨立的 NSH 應用程式則使用此作業系統自己的目標來打包：[`--target macos`](./macos.md#packaging)、[`--target windows`](./windows.md#packaging) 或 [`--target linux`](./linux.md#packaging)（[打包](./packaging.md)）。

在 Linux 上，含有網頁檢視與影片的 GPUI 應用程式會以動態方式連結 WebKitGTK 4.1 與 GStreamer，因此執行它的機器必須安裝這些套件，以及 GTK 3 與 GStreamer 的 base 和 good 外掛程式（Debian / Ubuntu：`libwebkit2gtk-4.1-0`、`libgstreamer1.0-0`、`libgstreamer-plugins-base1.0-0`、`gstreamer1.0-plugins-good`），此外還需要 Vulkan 驅動程式與 `libxkbcommon`。

<a id="embedding-in-a-gpui-app"></a>

## 嵌入 GPUI 應用程式

`nsh-platform-gpui` crate（來自 NSH 儲存庫）為 Rust GPUI 應用程式提供 `AppView`：一個 NSH 引擎，以 GPUI 檢視（`Entity<AppView>`）的形式呈現，並填滿其父元素給予的空間。每個 `AppView` 都是獨立的；可以同時執行多個。它執行 Rust 根元件，也就是你的 crate 的根元件：

```rust
use gpui::{AppContext, WindowOptions};
use nsh_platform_gpui::{set_ui_sets, App, AppOptions, AppView, Root};

// Once, before the first view: the UI sets the apps import (NSH's and your crate's).
set_ui_sets(vec![nsh_base::registry(), my_app::registry()]);
gpui_platform::application().run(|cx| {
    cx.open_window(WindowOptions::default(), |window, cx| {
        cx.new(|cx| {
            let view = AppView::new(AppOptions::default(), window, cx);
            view.load(App::Rust(Root::of::<my_app::App>()));
            view
        })
    })
    .unwrap();
});
```

`Root::tokens` 為根元件提供其[主題](./rust.md#theme)（`nsh_base::Theme::from_json(json)?.into_tokens()`，`Theme` 在此重新匯出），`Root::app_id` 則提供其資料所儲存的 id。`nsh build` 所撰寫的 TSX 套件可以載入同一個檢視：

```rust
use nsh_platform_gpui::{App, Bundle};

let code = std::fs::read_to_string("app/bundle.js").expect("bundle");
view.load(App::Js(Bundle::source(code)));
```

將該 entity 放入你的元素樹，如同任何其他檢視（GPUI Kit 的 `Root`、面板、停靠區）。`AppView::load` 會取代正在執行的內容；`stop`（或釋放該檢視）會結束應用程式。`AppOptions::asset_base` 指定 `asset:/` URI 的解析位置（`AssetBase::Directory` 或 `AssetBase::Http`）。位元組碼套件（`bundle.nshc`）以 `unsafe { Bundle::bytecode(bytes) }`（或同樣為 unsafe 的 `Bundle::read_trusted(path)`）載入：QuickJS 位元組碼屬於受信任的輸入，因此只能從你自己應用程式的檔案載入。

- `open_app_window(source, options, cx)` 在執行中的 GPUI 應用程式內開啟一個含有一個 `AppView` 的視窗。
- `run_app(source, options)` 啟動 GPUI，並在視窗中執行一個應用程式，直到視窗關閉為止（開發主機的做法即是如此）。
- `AppView::register_component(name, factory)` 在載入之前註冊你自己的原生元件（[原生元件](./native-components.md)）。
- `AppOptions::cache`（或針對接下來載入之應用程式的 `AppView::set_cache`）設定應用程式存放快取的位置、[它們下載的影像](./images-and-assets.md#kept-on-disk)，以及每個應用程式保留的容量：`CacheOptions { location,
  images }`, `CacheLocation::System` (the default), `Dir(path)` or `Off`, `CachePolicy::Default`（256 MiB）、`MaxSize(ByteSize::mib(n))` 或 `Off`。
- `AppView::host()` 是檢視與其所執行之應用程式之間的通道（[`host`](../modules/nsh.md#host)），任何執行緒都可以使用的 `HostChannel`：在載入前呼叫 `set_params(map)` 可提供應用程式其啟動參數（`host.params`），`send(name, data)` 傳送事件（`host.on`），而 `handle(name, |call| …)` 則回應其 `host.call(name, data)` 並接收其 `host.post`（`call.resolve(json)`、`call.reject(message)`，可立即或稍後從任何執行緒進行）。處理常式在引擎執行緒上執行：請將呼叫交給你的 GPUI entity（例如由 `cx.spawn` 任務讀取的通道），並從那裡回應。macOS、Windows 與 Linux 的 `AppView` 具有相同的 `host()`。它的 `handle_open_url(|request| …)` 會在系統之前看到應用程式所開啟的 URL（[`openUrl`](../modules/nsh.md#openurl)）：當你的應用程式自行路由了該 URL 時回傳 `request.handled()`，回傳 `request.decline()`（或釋放該請求）則由系統透過 GPUI 的 `open_url` 開啟它。
- `AppOptions::limits`（或針對接下來載入之應用程式的 `AppView::set_limits`）設定 VM 限制：JS 堆積、堆疊、時間預算與節點配額（[沙箱與權能](./sandbox-and-capabilities.md)）。嵌入的應用程式使用 `Limits::default()`（256 MB 堆積）；開發主機則以 `Limits::standalone()` 自行執行應用程式。
- `AppOptions::transparent` 使檢視透明：它不繪製視窗背景，而 `open_app_window` / `run_app` 會開啟透明視窗，因此應用程式未繪製的部分會顯示視窗後方的內容（桌面小工具、覆蓋層）。預設為 false。
- `AppView::connect_dev_server(url, cx)`（功能 `dev`）從 `nsh dev` 載入應用程式，並在你編輯時重新載入，錯誤覆蓋層會顯示在檢視之上；`AppView::on_error` 會持續接收應用程式的錯誤。
- `AppView::on_app_error(|error| …)` 接收應用程式的錯誤：`error.kind`（應用程式載入失敗、未捕捉的例外、VM 已停止）、`error.is_fatal()`（應用程式的 JS 不會再執行時）、`error.message`、`error.stack` 與 `error.package`（其來源已簽署套件的 id 與組建版本）。`AppView::on_error` 會以文字形式取得相同的錯誤。
- `AppView::set_locale(locale, cx)` 與 `AppView::set_font_scale(scale, cx)` 以你的應用程式的語言與文字大小取代系統的設定（`None` 會再次跟隨系統）：`locale()`、`Intl`、`fontScale()` 與文字會立即跟隨變更（[裝置與環境](./device-and-environment.md#in-an-embedding-app)）。
- `AppView::run_package(&package)` 從 `verify_package` 或 `load_package` 執行[已簽署的套件](./signed-packages.md#loading-packages-in-a-host-app)；當你的應用程式判定它狀態健康後，`accept_package` 會記錄這一點。
- `set_ui_sets(sets)` 設定每個引擎提供的 UI 集合：NSH 的（`nsh_base::registry()`）與你的 crate 的（`my_app::registry()`，由 `#[native_module]` 產生；[以 Rust 建置](./rust.md)），並提供你的應用程式自己的集合：應用程式可以透過 [`nativeModule`](../modules/nsh.md#nativemodule) 以名稱存取其中的函式與類別，並以標準的 `nsh build` 建置。儲存庫的 `examples/embed-gpui` 以這種方式在主機中維護一個交易台，兩個嵌入的下單票據與主機自己的小工具共用它。

<a id="differences"></a>

## 差異

與原生桌面後端相比，繪製或行為不同之處：

- **變形**：旋轉、傾斜與投影的檢視，其背景、邊框與陰影會隨之變形，但文字保持直立，影像、影片與畫布則以其邊界繪製。
- **不透明度**套用於每個顏色而非整個群組，因此半透明檢視的重疊子元素會彼此透出；影像的不透明度（淡入、半透明檢視）以十六分之一為單位變化。
- **圓角裁切**（帶有半徑的 `overflow: "hidden"`）會使子元素的背景與影像呈圓角，但文字、邊框、影片與原生元件則以矩形裁切。
- **不繪製**：`filter: blur()`、`backdropFilter` 與 `mixBlendMode`；陰影會透過半透明填色顯示；`borderCurve: "continuous"` 繪製圓形圓角。
- **畫布文字**為近似呈現：旋轉時保持直立，對 `maxWidth` 是縮小而非變窄，漸層以單一顏色繪製文字，`strokeText` 填色，其陰影不會模糊，而合成運算與 `clearRect` 不適用於它。
- **捲動檢視**不支援縮放（`zoomTo` 與縮放屬性會被忽略）。
- **影片**在 Linux 上可播放（GStreamer）；在 macOS 與 Windows 上，影片會顯示預留位置並回報 `onError`。
- **網頁檢視**是原生檢視，位於 NSH 在其位置所繪製的一切內容之上。在 Linux 上它們需要 X11（請參閱[需求](#requirements)）；在 Xwayland 下頁面仍呈黑色的情況（記錄中出現 "Failed to create GBM buffer"），請以 `WEBKIT_DISABLE_DMABUF_RENDERER=1` 執行應用程式。在 macOS 與 Windows 上，裁切的祖先元素不會裁切它們，載入失敗也不會回報 `onError`。`baseUrl`、`scrollable` 與 `allowsBackForwardNavigationGestures` 不受支援。
- **無障礙功能**透過 AccessKit 運作：螢幕閱讀器在各處都可以啟動、聚焦、設定值，並將元素捲動至可見範圍；自訂動作與情境選單動作目前尚未傳遞。

若要比較，請參閱各原生後端自己的清單：[macOS](./macos.md#what-differs-on-macos)、[Windows](./windows.md#what-differs-on-windows)、[Linux](./linux.md#what-differs-on-linux)。

<a id="see-also"></a>

## 另請參閱

- [以 Rust 建置](./rust.md)：GPUI 應用程式所嵌入其根元件的 crate
- [CLI](./cli.md)：`nsh run --target gpui`
- [打包](./packaging.md)：獨立應用程式，使用各作業系統自己的目標
- [平台概覽](./platforms.md)
