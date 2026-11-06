---
title: "GPUI"
description: "在 GPUI 或 GPUI Kit 應用程式中使用 AppView 嵌入 Rust 和 TSX 的 NSH 應用程式,由 GPUI 在 macOS、Windows 及 Linux 上繪製;在 GPUI 開發主機中試用 TSX 應用程式,並說明 GPUI 後端有哪些不同之處。"
order: 15.5
group: platforms
source_hash: 1f281d4fc1a89362
---


# GPUI

GPUI 後端以 [GPUI](https://gpui-kit.com)(GPUI Fast)繪製 NSH 應用程式。GPUI 是 GPU 加速的 UI 框架,亦是 GPUI Kit 的基礎,在 macOS、Windows 和 Linux 上均可使用。它是嵌入 GPUI 和 GPUI Kit 應用程式時使用的後端:`AppView` 是一個 GPUI view,因此 GPUI 或 GPUI Kit 應用程式可在自己的元素樹中任何位置顯示 NSH 應用程式,無論是自帶的 Rust 根元件,還是它載入的 TSX。獨立應用程式則以各桌面平台自己的後端執行和打包:[macOS](./macos.md)(AppKit)、[Windows](./windows.md)(Win32)和 [Linux](./linux.md)(GTK)。核心、響應式圖、渲染器、Taffy 佈局和原生模組與其他平台完全相同,因此一個應用程式可以在所有平台上執行。`os()`(TSX 中為 `platform.os`)是應用程式所運行的作業系統(macOS、Windows 或 Linux),TSX 的 `desktop={{…}}` props 同樣適用。

[macOS](./macos.md)(AppKit)、[Windows](./windows.md)(Win32)和 [Linux](./linux.md)(GTK)後端的所有元素和模組,在此後端中一應俱全;GPUI 以自己方式繪製的部分,請參閱[差異](#differences)。

<a id="how-it-works"></a>

## 運作方式

- **每個 surface 一個元素。** 一個 surface 是一個 GPUI 元素,會填滿其父元素提供的空間,並以 GPUI 的基本圖元(quad、陰影、路徑、字形和圖片)繪製整個視圖樹。與 Windows 一樣,NSH 為每個節點保留一個 retained view,只在 commit 改動了內容時才重繪。
- **文字在引擎執行緒上排版**,使用 GPUI 的文字系統(應用程式自己的字型),由 NSH 斷行;主執行緒只負責繪製字形。
- **每次 commit 只跳轉一次。** 引擎在自己的執行緒上運行;每次 commit 是一個傳送到 GPUI 主執行緒的 closure,由它通知視圖。
- **輸入**來自 GPUI 的滑鼠、捲動、按鍵和輸入法事件;命中測試、按壓、responder 系統、捲動和文字編輯的邏輯,與 Windows 後端相同。

<a id="requirements"></a>

## 系統要求

- macOS、Windows 或 Linux,並配備 GPUI 可使用的 GPU(macOS 用 Metal,Windows 用 DirectX,Linux 用 Vulkan)。
- 在 macOS 上,從 checkout 建置 GPUI 應用程式或 runtime,需要 Xcode 的 Metal Toolchain(`xcodebuild -downloadComponent
  MetalToolchain`), which compiles GPUI's shaders ahead of time. On a Mac without it, `nsh run` 會以 GPUI 的 `runtime-shaders` feature 建置 runtime 並加以說明):著色器會在應用程式啟動時編譯(首次約需一瞬間,之後由 macOS 快取)。
- 在 Linux 上:需要 Vulkan 驅動程式、支援 `libxkbcommon` 的 Wayland 或 X11、GTK 3 和 WebKitGTK 4.1(web view),以及 GStreamer 1.20 或更新版本連同其 base 和 good 外掛程式(影片)。Web view 需要 X11:在 Wayland 桌面上,請在 Xwayland 下執行應用程式(`WAYLAND_DISPLAY=` 為空),否則 web view 會顯示佔位符。從 checkout 建置 runtime 亦需要開發套件;在 Debian 和 Ubuntu 上:

  ```sh
  sudo apt-get install clang libclang-dev pkg-config libfontconfig-dev libfreetype-dev libwayland-dev libx11-xcb-dev \
    libxcb1-dev libxkbcommon-dev libxkbcommon-x11-dev libzstd-dev libvulkan1 libgtk-3-dev libwebkit2gtk-4.1-dev \
    libgstreamer1.0-dev libgstreamer-plugins-base1.0-dev gstreamer1.0-plugins-good
  ```

<a id="running-an-app"></a>

## 執行應用程式

Rust 應用程式在你的 GPUI 應用程式內運行:以 `AppView` 嵌入其根元件([嵌入 GPUI 應用程式](#embedding-in-a-gpui-app)),再 `cargo run` GPUI 應用程式;你的 crate 與應用程式屬於同一個 Cargo 建置。單獨執行時,Rust 應用程式使用此作業系統自己的後端(`nsh run --target macos`、`windows` 或 `linux`)。

TSX 應用程式在 GPUI 開發主機中運行:

```sh
nsh run App.tsx --target gpui
```

它會在 GPUI 視窗中開啟應用程式(預設 1200×800),效果與嵌入它的 GPUI 應用程式所顯示的相同,並提供熱重載、終端機日誌和錯誤覆蓋層,與其他目標一樣。開發主機(`nsh-gpui-host`)在每個作業系統上都直接原地運行,不附帶 app bundle。在 checkout 中,`nsh run` 會先建置它;發行版本則把它放在 `runtime/gpui/` 中。主機亦可單獨執行已建置的 bundle:

```sh
nsh build my-app --release -o build
dist/nsh/runtime/gpui/nsh-gpui-host --bundle build/bundle.nshc --window-size 390x844   # in a checkout: target/debug/nsh-gpui-host
```

`--window-size` 是視窗的大小,以 point 為單位(`<width>x<height>`)。

<a id="packaging"></a>

## 打包

GPUI 應用程式把 NSH 放進自己的可執行檔:以 `AppView` 嵌入應用程式的 Rust 根元件或 TSX bundle([嵌入 GPUI 應用程式](#embedding-in-a-gpui-app)),並按 GPUI 應用程式本身的方式建置和發佈。獨立的 NSH 應用程式則使用此作業系統自己的目標打包:[`--target macos`](./macos.md#packaging)、[`--target windows`](./windows.md#packaging)或 [`--target linux`](./linux.md#packaging)([打包](./packaging.md))。

在 Linux 上,含有 web view 和影片的 GPUI 應用程式會動態連結 WebKitGTK 4.1 和 GStreamer,因此運行它的機器必須安裝這些套件,連同 GTK 3 以及 GStreamer 的 base 和 good 外掛程式(Debian / Ubuntu:`libwebkit2gtk-4.1-0`、`libgstreamer1.0-0`、`libgstreamer-plugins-base1.0-0`、`gstreamer1.0-plugins-good`),另外還需要 Vulkan 驅動程式和 `libxkbcommon`。

<a id="embedding-in-a-gpui-app"></a>

## 嵌入 GPUI 應用程式

`nsh-platform-gpui` crate(來自 NSH 儲存庫)為 Rust GPUI 應用程式提供 `AppView`:一個 NSH 引擎,以 GPUI view(`Entity<AppView>`)的形式存在,會填滿其父元素提供的空間。每個 `AppView` 都是獨立的,可同時運行多個。它運行 Rust 根元件,即你的 crate 的根 component:

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

`Root::tokens` 為根元件提供其[主題](./rust.md#theme)(`nsh_base::Theme::from_json(json)?.into_tokens()`,此處重新匯出 `Theme`),`Root::app_id` 則提供保存其資料所用的 id。由 `nsh build` 編寫的 TSX bundle 可載入同一個視圖:

```rust
use nsh_platform_gpui::{App, Bundle};

let code = std::fs::read_to_string("app/bundle.js").expect("bundle");
view.load(App::Js(Bundle::source(code)));
```

把這個 entity 放進你的元素樹,與其他 view 一樣(GPUI Kit 的 `Root`、面板或 dock)。`AppView::load` 會取代正在運行的內容;`stop`(或丟棄該 view)會結束應用程式。`AppOptions::asset_base` 指明 `asset:/` URI 的解析位置(`AssetBase::Directory` 或 `AssetBase::Http`)。位元組碼 bundle(`bundle.nshc`)以 `unsafe { Bundle::bytecode(bytes) }`(或 `Bundle::read_trusted(path)`,同樣是 unsafe)載入:QuickJS 位元組碼屬於受信任的輸入,因此只應從你自己應用程式的檔案載入。

- `open_app_window(source, options, cx)` 在運行中的 GPUI 應用程式裡開啟一個視窗,內含一個 `AppView`。
- `run_app(source, options)` 啟動 GPUI,並在視窗中運行一個應用程式直至視窗關閉(即開發主機的做法)。
- `AppView::register_component(name, factory)` 在載入前註冊你自己的原生元件([原生元件](./native-components.md))。
- `AppOptions::cache`(或 `AppView::set_cache`,用於接下來載入的應用程式)設定應用程式存放快取的位置、[它們下載的圖片](./images-and-assets.md#kept-on-disk),以及每個應用程式保留的容量:`CacheOptions { location,
  images }`, `CacheLocation::System` (the default), `Dir(path)` or `Off`, `CachePolicy::Default`(256 MiB)、`MaxSize(ByteSize::mib(n))` 或 `Off`。
- `AppView::host()` 是 view 與其運行的應用程式之間的通道([`host`](../modules/nsh.md#host)),是任何執行緒都可使用的 `HostChannel`:在載入前呼叫 `set_params(map)` 可為應用程式提供啟動參數(`host.params`),`send(name, data)` 發送事件(`host.on`),`handle(name, |call| …)` 則回應其 `host.call(name, data)` 並接收其 `host.post`(`call.resolve(json)`、`call.reject(message)`,可即時或稍後從任何執行緒回應)。處理函式在引擎執行緒上運行:請把呼叫交給你的 GPUI entity(例如由 `cx.spawn` 任務讀取的 channel),並在那裡回應。macOS、Windows 和 Linux 的 `AppView` 具有相同的 `host()`。它的 `handle_open_url(|request| …)` 會在系統之前看到應用程式開啟的 URL([`openUrl`](../modules/nsh.md#openurl)):若你的應用程式已自行處理該 URL,則回傳 `request.handled()`;回傳 `request.decline()`(或丟棄該請求)則交由系統,以 GPUI 的 `open_url` 開啟。
- `AppOptions::limits`(或 `AppView::set_limits`,用於接下來載入的應用程式)設定 VM 限制:JS heap、stack、時間預算和節點配額([沙盒與權能](./sandbox-and-capabilities.md))。嵌入的應用程式採用 `Limits::default()`(256 MB heap);開發主機獨立運行應用程式,使用 `Limits::standalone()`。
- `AppOptions::transparent` 令 view 變為透明:它不繪製視窗背景,而 `open_app_window` / `run_app` 會開啟透明視窗,因此應用程式未繪製的部分會顯示視窗後面的內容(桌面小工具、覆蓋層)。預設為 false。
- `AppView::connect_dev_server(url, cx)`(feature `dev`)從 `nsh dev` 載入應用程式,並在你編輯時重新載入,錯誤覆蓋層會顯示在 view 上方;`AppView::on_error` 會繼續接收應用程式的錯誤。
- `AppView::on_app_error(|error| …)` 接收應用程式的錯誤:`error.kind`(應用程式載入失敗、未捕獲的例外、VM 已停止)、`error.is_fatal()`(應用程式的 JS 不會再運行時)、`error.message`、`error.stack` 和 `error.package`(它所來自的已簽署套件的 id 和 build)。`AppView::on_error` 會以文字形式取得相同的錯誤。
- `AppView::set_locale(locale, cx)` 和 `AppView::set_font_scale(scale, cx)` 會把你應用程式的語言和文字大小提供給應用程式,取代系統的設定(`None` 則恢復跟隨系統):`locale()`、`Intl`、`fontScale()` 和文字會即時跟隨變化([裝置與環境](./device-and-environment.md#in-an-embedding-app))。
- `AppView::run_package(&package)` 從 `verify_package` 或 `load_package` 運行[已簽署套件](./signed-packages.md#loading-packages-in-a-host-app);待你的應用程式判斷它運作正常後,`accept_package` 會記錄這一點。
- `set_ui_sets(sets)` 設定每個引擎提供的 UI 集:NSH 的(`nsh_base::registry()`)和你的 crate 的(`my_app::registry()`,由 `#[native_module]` 產生;[以 Rust 建置](./rust.md)),並提供你應用程式自己的集:應用程式可用 [`nativeModule`](../modules/nsh.md#nativemodule)按名稱存取其中的函式和類別,並以標準的 `nsh build` 建置。儲存庫的 `examples/embed-gpui` 就以這種方式在主機中運行一個交易台,由兩個嵌入的下單票據與主機自己的小工具共用。

<a id="differences"></a>

## 差異

與原生桌面後端相比,繪製或行為不同之處:

- **變換**:旋轉、傾斜和投影的視圖會轉動其背景、邊框和陰影,但文字保持直立,圖片、影片和 canvas 按其邊界繪製。
- **不透明度**逐個顏色套用,而非整組套用,因此半透明視圖中互相重疊的子元素會互相透出;圖片的不透明度(淡入、半透明視圖)以十六分之一為單位變化。
- **圓角裁剪**(帶半徑的 `overflow: "hidden"`)會裁圓子元素的背景和圖片,但文字、邊框、影片和原生元件仍按矩形裁剪。
- **不繪製**:`filter: blur()`、`backdropFilter` 和 `mixBlendMode`;陰影會透過半透明填色顯示;`borderCurve: "continuous"` 繪製圓形圓角。
- **Canvas 文字**屬近似處理:旋轉時保持直立,對 `maxWidth` 是縮小而非收窄,漸層只會以單一顏色繪製文字,`strokeText` 填色,其陰影不會模糊,合成運算和 `clearRect` 不適用於它。
- **捲動視圖**不支援縮放(`zoomTo` 和縮放 props 會被忽略)。
- **影片**在 Linux 上可播放(GStreamer);在 macOS 和 Windows 上,影片會顯示佔位符並回報 `onError`。
- **Web view** 是位於 NSH 所繪內容之上、在其位置顯示的原生 view。在 Linux 上它們需要 X11(見[系統要求](#requirements));若在 Xwayland 下頁面一片漆黑(日誌中出現 "Failed to create GBM buffer"),請以 `WEBKIT_DISABLE_DMABUF_RENDERER=1` 運行應用程式。在 macOS 和 Windows 上,裁剪用的祖先元素不會裁切它們,載入失敗亦不會回報 `onError`。`baseUrl`、`scrollable` 和 `allowsBackForwardNavigationGestures` 不受支援。
- **無障礙功能**透過 AccessKit 實現:螢幕閱讀器在所有平台上都可啟用、聚焦、設定值,以及把元素捲動至可見範圍;自訂動作和 context-menu 動作暫時尚未傳遞。

如需比較,各原生後端自己的清單:[macOS](./macos.md#what-differs-on-macos)、[Windows](./windows.md#what-differs-on-windows)、[Linux](./linux.md#what-differs-on-linux)。

<a id="see-also"></a>

## 另請參閱

- [以 Rust 建置](./rust.md):GPUI 應用程式所嵌入根元件所屬的 crate
- [CLI](./cli.md):`nsh run --target gpui`
- [打包](./packaging.md):獨立應用程式,使用各作業系統自己的目標
- [平台總覽](./platforms.md)
