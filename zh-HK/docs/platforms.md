---
title: "平台概覽"
description: "NSH 可在 iOS、Android、macOS、Windows、Linux、GPUI 及網頁上運行，各自使用獨立的後端；本文說明如何在各平台上運行、打包及嵌入 Rust 或 TSX 應用程式，以及各平台的需求。"
order: 10
group: platforms
source_hash: 122188df65c9a97c
---


# 平台概覽

NSH 可在手機、桌面和網頁上運行:iOS、Android、macOS、Windows、Linux、GPUI 和網頁。每個平台都有自己的後端,使用該平台原生的 UI 繪製,因此應用程式在 iPhone 上是 UIKit 視圖,在 Mac 上是 AppKit 視圖,在 Linux 上是 GTK 4 widget,在 GPUI 應用程式中是 GPUI 元素,在瀏覽器中則是 HTML,並沿用該平台的文字、輸入、無障礙功能和深色模式。後端以上的一切都是共用的:響應式圖(reactive graph)、渲染器、Taffy 佈局、組件和原生模組在各處都是同一份 Rust 程式碼,所以同一個應用程式可以在所有平台上運行。以 Rust 編寫的應用程式就是這些程式碼加上你的 crate,沒有 JavaScript VM;TSX 應用程式則在其上以 QuickJS 運行自己的模組([使用 Rust 建構](./rust.md))。

在每個平台上,應用程式都有兩種相同的使用方式:打包成該平台可安裝的應用程式(`nsh package`),或嵌入你自己的原生應用程式,無論宿主連結的是 Rust root,還是在運行時載入 TSX。開發時使用 `nsh run`(修改 Rust 會重新建構並重啟應用程式,修改 TSX 則是熱更新)。

<a id="at-a-glance"></a>

## 概覽

| 平台 | 後端;文字 | 運行環境 | 開發 | 打包 |
|---|---|---|---|---|
| [iOS](./ios.md) | UIKit;CoreText | iOS 15.0+,真機和模擬器 | `nsh run --target ios` | `.app`(模擬器)、已簽署的 `.ipa` |
| [Android](./android.md) | Android views;`StaticLayout` | Android 9(API 28)+、`arm64-v8a`、`armeabi-v7a` 和 `x86_64` | `nsh run --target android` | 已簽署的 `.apk` |
| [macOS](./macos.md) | AppKit 和 Core Animation;CoreText | macOS 14+ | `nsh run --target macos` | ad hoc 簽署的 `.app` |
| [Windows](./windows.md) | 以 Direct2D 繪製的 Win32 視窗;DirectWrite | Windows 10 1809+、Windows 11 | `nsh run`(Windows 上的預設值) | 一個目錄和一個 `.zip` |
| [Linux](./linux.md) | GTK 4 widget;Pango | GTK 4.14+ | `nsh run`(Linux 上的預設值) | 一個目錄和一個 `.tar.gz` |
| [GPUI](./gpui.md) | GPUI;GPUI 的文字系統 | macOS、Windows、Linux(Vulkan) | 在你的 GPUI 應用程式中;TSX 也可使用 `nsh run --target gpui` | 包含在嵌入它的 GPUI 應用程式內 |
| [Web](./web.md) | HTML 和 CSS;瀏覽器的字型 | 現代瀏覽器,桌面和手機 | `nsh run --target web` | 靜態網站 |

- **[GPUI](./gpui.md)** 使用 [GPUI](https://gpui-kit.com)(姊妹專案 GPUI Kit 的框架)在 macOS、Windows 和 Linux 上同樣繪製應用程式:它是嵌入 GPUI 和 GPUI Kit 應用程式時使用的後端,這些應用程式會把 `AppView` 放進自己的元素樹中。獨立的桌面應用程式則使用各作業系統自己的後端(AppKit、Win32、GTK 4)來運行和打包。
- **[Web](./web.md)** 在瀏覽器頁面中以 HTML 渲染應用程式:`nsh package --target web` 會發佈適用於任何網頁伺服器或 CDN 的靜態網站,其中 Rust 應用程式的引擎和 crate 會編譯成 WebAssembly,而你自己的頁面可以用 `createPlayer` 或 iframe 嵌入應用程式。本網站上的即時示範和 [playground](/playground) 也是以此運行。
- **Mac Catalyst** 在 Mac 上以 iPhone 大小(390×844)的視窗運行 iOS 後端,供開發之用。使用 `--target catalyst` 選取它,即可查看應用程式在手機上的外觀。

<a id="develop-and-package"></a>

## 開發和打包

如果你沒有提供 `--target`,`nsh run` 會選用該機器自己的平台:macOS 上是 AppKit,Linux 上是 GTK 視窗,Windows 上是 Win32 視窗。手機則要從電腦連接:iOS 需要裝有 Xcode 的 Mac,Android 則可從 macOS、Linux 或 Windows 使用 Android SDK([安裝](./installation.md#what-works-where))。

Rust 應用程式(其 `nsh.json` 指定 `"root"` 組件)在其目錄中運行和打包:`nsh` 會為目標平台建構應用程式自己的 runner,包含你的 crate,不含 QuickJS。TSX 應用程式則需指定其入口:

```sh
# A Rust app, from its directory
nsh run --target macos             # or ios, android, windows, linux, web, catalyst
nsh package --target macos         # or ios, ios-simulator, android, windows, linux, web

# A TSX app
nsh run App.tsx --target macos     # or ios, android, windows, linux, gpui, web, catalyst
nsh package App.tsx --target macos
```

每個桌面作業系統都使用自己的後端來打包應用程式,並且是為其運行的機器而建構:Mac 應用程式要在 Mac 上打包,Windows 應用程式要在 Windows 上打包,Linux 應用程式要在 Linux 上打包。[打包](./packaging.md)涵蓋每個目標的輸出、簽署和圖示。

<a id="embed-in-a-native-app"></a>

## 嵌入原生應用程式

| 平台 | 宿主視圖 | 運行內容 | 發佈形式 | 宿主語言 |
|---|---|---|---|---|
| macOS | `AppView`(一個 `NSView`) | Rust root、TSX bundle | `nsh-platform-macos` crate | Rust |
| Windows | `AppView`(子視窗) | Rust root、TSX bundle | `nsh-platform-windows` crate | Rust |
| Linux | `AppView`(一個 GTK widget) | Rust root、TSX bundle | `nsh-platform-linux` crate | Rust |
| GPUI(macOS、Windows、Linux) | `AppView`(一個 GPUI 視圖) | Rust root、TSX bundle、已簽署的套件 | `nsh-platform-gpui` crate | Rust |
| iOS | `AppView`(一個 `UIView`) | Rust root、TSX bundle | `nsh-platform-ios` crate | Rust |
| iOS | `NshAppView`(一個 `UIView`) | TSX bundle、已簽署的套件 | `NativeShell.xcframework` | Swift |
| Android | `NshView`(一個 `FrameLayout`) | TSX bundle、已簽署的套件 | `nsh.aar` | Java 或 Kotlin |
| Web | `createPlayer`(一個頁面元素)或 iframe | TSX bundle;Rust 應用程式則為其發佈的網站 | 來自 `nsh package --target web` 的運行時檔案 | JavaScript 或 HTML |

Rust 宿主會把 Rust root(`Root::of::<App>()`)掛載為 `AppSource::Rust` 或 `App::Rust`,並透過 `set_ui_sets` 為其引擎提供應用程式的 UI 集合,讓它載入的 TSX 可以匯入應用程式自己的組件和模組。每個視圖是一個引擎,而一個應用程式可以顯示多個視圖。宿主會在每個平台上註冊自己的原生視圖供應用程式使用([原生組件](./native-components.md))。

> [!NOTE]
> Rust 宿主使用 NSH 儲存庫中的平台 crate 來嵌入 NSH;macOS、Windows 和 Linux 的 `AppView` 會以預設限制,從應用程式自己的檔案(或原始碼)載入 bundle。GPUI crate 以及 iOS 和 Android SDK 還可以載入[已簽署的套件](./signed-packages.md),並為每個視圖設定限制和權限([沙盒和權限](./sandbox-and-capabilities.md))。

<a id="writing-for-every-platform"></a>

## 為所有平台編寫

應用程式大部分內容都不需要平台檢查:元素、樣式、佈局和模組在各處的行為都相同。當平台之間有差異時,NSH 為這些差異提供了單一位置([平台專屬程式碼](./platform-specific.md)):

- **環境會告知應用程式在哪裏運行**:在 Rust 中是 `os()`、`idiom()` 和 `is_desktop()`(`nsh_core::prelude`),在 TSX 中是來自 `nsh` 的 `platform.os`、`platform.idiom`、`platform.desktop` 和 `platform.select`。作業系統為 iOS、Android、macOS、Windows、Linux 或網頁。
- **平台專屬的 props** 在 TSX 中放在 `ios={{…}}`、`android={{…}}`、`web={{…}}` 或 `desktop={{…}}` 內(`desktop`:macOS、Windows、Linux 和桌面瀏覽器)。
- **輸入遵循平台。** 手機使用觸控和軟鍵盤;桌面使用滑鼠、觸控板和鍵盤。

應用程式的組件是以 NSH 的 primitive 繪製的,因此既可在桌面上運行,也可在手機上運行,並且兩者外觀一致。桌面佈局由這些 primitive(`view`、`text`、`scroll`、`virtual_list` 等;在 TSX 中是 `View`、`Text`、`Scroll`、`List` 等)加上桌面檢查構成,圖庫(gallery)的桌面佈局就是這樣做的:

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

每個後端都列出了它以自己方式處理的內容:[macOS](./macos.md#what-differs-on-macos)、[Windows](./windows.md#what-differs-on-windows)、[Linux](./linux.md#what-differs-on-linux)、[GPUI](./gpui.md#differences)。

<a id="see-also"></a>

## 另請參閱

- [入門](./getting-started.md):第一個應用程式,在各平台上運行。
- [使用 Rust 建構](./rust.md):以 Rust 編寫的應用程式,以及 Rust 搭配 TSX。
- [安裝](./installation.md):各平台所需的工具。
- [架構](./architecture.md):哪些部分是共用的,以及各後端負責甚麼。
