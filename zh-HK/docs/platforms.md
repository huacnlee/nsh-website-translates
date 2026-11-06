---
title: "平台概覽"
description: "NSH 可在 iOS、Android、macOS、Windows、Linux、GPUI 與 Web 上執行,各平台皆有專屬的後端;說明如何在各平台上執行、封裝並嵌入 Rust 或 TSX 應用程式,以及各平台的需求。"
order: 10
group: platforms
---

# 平台總覽

NSH 可在手機、桌面與網頁上執行:iOS、Android、macOS、Windows、Linux、GPUI 與網頁。每個平台各有自己的後端,使用該平台原生的 UI 繪製,因此 App 在 iPhone 上是 UIKit 檢視,在 Mac 上是 AppKit 檢視,在 Linux 上是 GTK 4 元件,在 GPUI App 中是 GPUI 元素,在瀏覽器中則是 HTML,並採用該平台的文字、輸入、無障礙與深色模式。後端以上的部分全部共用:reactive graph、renderer、Taffy layout、元件與原生模組在各處都是相同的 Rust 程式碼,因此一個 App 可在所有平台上執行。以 Rust 撰寫的 App 就是這些程式碼加上你的 crate,不含 JavaScript VM;TSX App 則在其上以 QuickJS 執行模組([以 Rust 開發](./rust.md))。

在每個平台上,App 都以相同的兩種方式使用:打包成該平台可安裝的 App(`nsh package`),或嵌入你自己的原生 App,無論宿主連結的是 Rust root,還是在執行階段載入 TSX。開發時使用 `nsh run`(Rust 的修改會重新建置並重新啟動 App,TSX 的修改則是熱更新)。

<a id="at-a-glance"></a>

## 一覽

| 平台 | 後端;文字 | 執行環境 | 開發 | 打包 |
|---|---|---|---|---|
| [iOS](./ios.md) | UIKit;CoreText | iOS 15.0+,實機與模擬器 | `nsh run --target ios` | `.app`(模擬器),已簽署的 `.ipa` |
| [Android](./android.md) | Android views;`StaticLayout` | Android 9 (API 28)+,`arm64-v8a`、`armeabi-v7a` 與 `x86_64` | `nsh run --target android` | 已簽署的 `.apk` |
| [macOS](./macos.md) | AppKit 與 Core Animation;CoreText | macOS 14+ | `nsh run --target macos` | ad hoc 簽署的 `.app` |
| [Windows](./windows.md) | 以 Direct2D 繪製的 Win32 視窗;DirectWrite | Windows 10 1809+、Windows 11 | `nsh run`(Windows 上的預設) | 一個目錄與一個 `.zip` |
| [Linux](./linux.md) | GTK 4 元件;Pango | GTK 4.14+ | `nsh run`(Linux 上的預設) | 一個目錄與一個 `.tar.gz` |
| [GPUI](./gpui.md) | GPUI;GPUI 的文字系統 | macOS、Windows、Linux (Vulkan) | 在你的 GPUI App 中;TSX 也可使用 `nsh run --target gpui` | 內含於嵌入它的 GPUI App |
| [Web](./web.md) | HTML 與 CSS;瀏覽器的字型 | 現代瀏覽器,桌面與手機 | `nsh run --target web` | 靜態網站 |

- **[GPUI](./gpui.md)** 在 macOS、Windows 與 Linux 上同樣以 [GPUI](https://gpui-kit.com)(姊妹專案 GPUI Kit 的框架)繪製 App:它是嵌入 GPUI 與 GPUI Kit App 的後端,這些 App 會將 `AppView` 放進自己的元素樹。獨立桌面 App 則以各作業系統自己的後端(AppKit、Win32、GTK 4)執行與打包。
- **[Web](./web.md)** 將 App 以 HTML 渲染在瀏覽器頁面中:`nsh package --target web` 會發佈可用於任何網頁伺服器或 CDN 的靜態網站,Rust App 的引擎與 crate 會編譯為 WebAssembly,而你自己的頁面可用 `createPlayer` 或 iframe 嵌入 App。本站的即時範例與 [playground](/playground) 也是以它執行。
- **Mac Catalyst** 在 Mac 上以 iPhone 大小(390×844)的視窗執行 iOS 後端,供開發使用。以 `--target catalyst` 選取它,即可查看 App 在手機上的樣子。

<a id="develop-and-package"></a>

## 開發與打包

在你未提供 `--target` 時,`nsh run` 會選擇本機自己的平台:macOS 上為 AppKit,Linux 上為 GTK 視窗,Windows 上為 Win32 視窗。手機需從電腦連接:iOS 需在裝有 Xcode 的 Mac 上,Android 則可在裝有 Android SDK 的 macOS、Linux 或 Windows 上([安裝](./installation.md#what-works-where))。

Rust App(其 `nsh.json` 指定 `"root"` 元件)從其目錄執行與打包:`nsh` 會為目標平台建置 App 專屬的 runner,內含你的 crate,且不含 QuickJS。TSX App 則需指定其入口:

```sh
# A Rust app, from its directory
nsh run --target macos             # or ios, android, windows, linux, web, catalyst
nsh package --target macos         # or ios, ios-simulator, android, windows, linux, web

# A TSX app
nsh run App.tsx --target macos     # or ios, android, windows, linux, gpui, web, catalyst
nsh package App.tsx --target macos
```

每個桌面作業系統都以自己的後端打包 App,且須在其執行的機器上建置:Mac App 在 Mac 上打包,Windows App 在 Windows 上打包,Linux App 在 Linux 上打包。[打包](./packaging.md)涵蓋每個目標的輸出、簽署與圖示。

<a id="embed-in-a-native-app"></a>

## 嵌入原生 App

| 平台 | 宿主檢視 | 執行 | 發佈形式 | 宿主語言 |
|---|---|---|---|---|
| macOS | `AppView`(一個 `NSView`) | Rust root、TSX bundle | `nsh-platform-macos` crate | Rust |
| Windows | `AppView`(一個子視窗) | Rust root、TSX bundle | `nsh-platform-windows` crate | Rust |
| Linux | `AppView`(一個 GTK 元件) | Rust root、TSX bundle | `nsh-platform-linux` crate | Rust |
| GPUI(macOS、Windows、Linux) | `AppView`(一個 GPUI 檢視) | Rust root、TSX bundle、已簽署的套件 | `nsh-platform-gpui` crate | Rust |
| iOS | `AppView`(一個 `UIView`) | Rust root、TSX bundle | `nsh-platform-ios` crate | Rust |
| iOS | `NshAppView`(一個 `UIView`) | TSX bundle、已簽署的套件 | `NativeShell.xcframework` | Swift |
| Android | `NshView`(一個 `FrameLayout`) | TSX bundle、已簽署的套件 | `nsh.aar` | Java 或 Kotlin |
| Web | `createPlayer`(一個頁面元素)或 iframe | TSX bundle;Rust App 則是其發佈的網站 | 來自 `nsh package --target web` 的執行階段檔案 | JavaScript 或 HTML |

Rust 宿主以 `AppSource::Rust` 或 `App::Rust` 掛載 Rust root(`Root::of::<App>()`),並以 `set_ui_sets` 為其引擎提供 App 的 UI 集合,因此它載入的 TSX 可匯入 App 自己的元件與模組。每個檢視是一個引擎,一個 App 可顯示多個。宿主在每個平台上都可註冊自己的原生檢視供 App 使用([原生元件](./native-components.md))。

> [!NOTE]
> Rust 宿主使用 NSH 儲存庫中的平台 crate 嵌入 NSH;macOS、Windows 與 Linux 的 `AppView` 會以預設限制,從 App 自己的檔案(或原始碼)載入 bundle。GPUI crate 以及 iOS 與 Android SDK 還能載入[已簽署的套件](./signed-packages.md),並依檢視設定限制與能力([沙箱與能力](./sandbox-and-capabilities.md))。

<a id="writing-for-every-platform"></a>

## 為所有平台撰寫

App 的大部分內容不需要檢查平台:元素、樣式、版面與模組在各處的行為都相同。在平台有差異之處,NSH 為差異提供了單一的處理位置([平台專屬程式碼](./platform-specific.md)):

- **環境會告訴你 App 在哪裡執行**:在 Rust 中是 `os()`、`idiom()` 與 `is_desktop()`(`nsh_core::prelude`),在 TSX 中是來自 `nsh` 的 `platform.os`、`platform.idiom`、`platform.desktop` 與 `platform.select`。作業系統為 iOS、Android、macOS、Windows、Linux 或網頁。
- **僅限特定平台的 props** 在 TSX 中放入 `ios={{…}}`、`android={{…}}`、`web={{…}}` 或 `desktop={{…}}`(`desktop`:macOS、Windows、Linux 與桌面瀏覽器)。
- **輸入隨平台而異。** 手機使用觸控與軟體鍵盤;桌面使用滑鼠、觸控板與鍵盤。

App 的元件以 NSH 的 primitives 繪製,因此既能在桌面上執行,也能在手機上執行,且兩者外觀一致。桌面版面由 primitives 組成(`view`、`text`、`scroll`、`virtual_list` 等;TSX 中為 `View`、`Text`、`Scroll`、`List` 等),再加上對桌面的檢查,就像 gallery 的桌面版面那樣:

```rust tabs
use nsh_core::prelude::*;

#[component]
pub fn Shell() -> impl IntoElement {
    // macOS, Windows, Linux and desktop browsers get a sidebar; phones get tabs.
    view()
        .flex_1()
        .child(if is_desktop() { sidebar_layout() } else { tab_layout() })
}

fn sidebar_layout() -> AnyElement {
    view().flex_1().flex_row().into_element()
}

fn tab_layout() -> AnyElement {
    view().flex_1().flex_col().into_element()
}
```

```tsx tabs
import { View } from "nsh";
import { platform } from "nsh";

export function Shell() {
  // macOS, Windows, Linux and desktop browsers get a sidebar; phones get tabs.
  return <View class="flex-1">{platform.desktop ? <SidebarLayout /> : <TabLayout />}</View>;
}

function SidebarLayout() {
  return <View class="flex-1 flex-row" />;
}

function TabLayout() {
  return <View class="flex-1 flex-col" />;
}
```

各後端都列出了它以自己方式處理的項目:[macOS](./macos.md#what-differs-on-macos)、[Windows](./windows.md#what-differs-on-windows)、[Linux](./linux.md#what-differs-on-linux)、[GPUI](./gpui.md#differences)。

<a id="see-also"></a>

## 另請參閱

- [開始使用](./getting-started.md):第一個 App,在各平台上執行。
- [以 Rust 開發](./rust.md):以 Rust 撰寫的 App,以及 Rust 搭配 TSX。
- [安裝](./installation.md):各平台所需的工具。
- [架構](./architecture.md):哪些部分共用,以及各後端負責什麼。
