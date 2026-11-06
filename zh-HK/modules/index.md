---
title: "模組"
description: "NSH 應用程式匯入的模組、各模組匯出的內容,以及它們的組織方式。"
order: 1
source_hash: c212e0667eddb588
---


# 模組

NSH 應用程式會從少數幾個模組匯入它用到的所有內容。這些模組全部都是原生的：響應式圖（reactive graph）、渲染器及每個模組都是在執行環境內以 Rust 實作，而打包工具會將 `import ... from "nsh/..."` 保留為匯入，而不是把程式碼複製到你的 bundle 中。你的 bundle 只包含你自己的程式碼。

```tsx
import { createAnimatedValue, mount, signal, windowSize } from "nsh";
import { Button } from "nsh/base";
import { TabBar } from "nsh/mobile";
```

<a id="three-layers"></a>

## 三個層級

NSH 的 UI 分為三個層級，與 GPUI Kit 的做法一樣（`gpui`、`gpui-base`、`gpui-component`）：

| 層級 | 模組 | 為應用程式提供什麼 |
|---|---|---|
| 基本元件（Primitives） | `nsh`、`nsh/mobile`、`nsh/desktop` | 響應式、宿主元素、版面配置、清單、canvas、動畫、手勢、裝置資訊，以及各平台自有的 API |
| 基礎元件（Base components） | [`nsh/base`](./nsh-base.md) | 不帶樣式的元件，負責行為、狀態、焦點和無障礙功能：按鈕、Markdown 和 HTML 文件、導覽堆疊、對話框，以及系統對話框，所有平台皆適用 |
| 元件庫 | 你的應用程式自己的元件庫，或來自社群的元件庫 | 具備外觀的按鈕、卡片、列和畫面 |

應用程式的外觀由應用程式自己決定。它的元件庫就是第三層：可以是用[宿主元素](../elements/index.md)和 `nsh/base` 編寫的元件，以 `style`、[Tailwind](../docs/tailwind.md) class 和應用程式的主題來設定樣式；也可以是隨[自己的 crate](../docs/rust.md) 發佈的 Rust 元件，或是社群在同一基礎上發佈的元件庫。

沒有包羅萬有的模組：每個 API 都只存在於一個位置。行動平台的 API 位於 `nsh/mobile`（iOS 和 Android），桌面平台的 API 位於 `nsh/desktop`（macOS、Windows、Linux）；兩者在所有平台上都可以匯入，因此同一個 bundle 可在各處運行（在其他平台上，這些呼叫會立即返回，而 `platform.os` 會告訴你目前所在的平台）。

型別由執行環境生成：`nsh init`、`nsh build`、`nsh dev` 和 `nsh test` 會在你的應用程式旁寫入 `.nsh/types`，因此 TypeScript 宣告一定與你建置所用的執行環境一致（參閱[專案結構](../docs/project-structure.md)）。

<a id="all-modules"></a>

## 所有模組

| 模組 | 匯出內容 | 頁面 |
|---|---|---|
| `nsh` | `signal`、`computed`、`effect`、`batch`、`untracked`、`cleanup`、`context`、`split`、`mount`、`ErrorBoundary`；基本元件 `View`、`Text`、`Scroll`、[`List`](./nsh-list.md)、[`Image`](./nsh-image.md)（連同 `Image.getSize`、`Image.prefetch`）、[`Canvas`](./nsh-canvas.md)（連同 `Path2D`、`CanvasRenderingContext2D`、`CanvasGradient`）、[`WebView`](./nsh-webview.md)、[`Video`](./nsh-video.md)；`safeArea`、`safeAreaInsets`；`Keyboard`、`keyboardFrame`；[動畫](./nsh.md#animation)（`createAnimatedValue`、`AnimatedValue`、`AnimatedNode`、`Animated`、`Easing`、`LayoutAnimation`）；[環境](./nsh.md#device)（`windowSize`、`colorScheme`、`setColorScheme`、`fontScale`、`pixelRatio`、`locale`、`platform`、`openUrl`）；[`PanResponder`](./nsh.md#panresponder)；[`Clipboard`](./nsh.md#clipboard)；[`Picker`](./nsh.md#picker)；[`Storage`](./nsh.md#storage)；[`host`](./nsh.md#host)（`available`、`call`、`on`，以及原生 SDK 的 `params` 和 `post`）；[`keymap`](./nsh.md#keymap)（鍵盤快速鍵：`mod+k`、`ctrl+shift+p` 等）；[`nativeComponent`、`nativeModule`](./nsh.md#nativecomponent-and-nativemodule)（由嵌入應用程式註冊的元件和函式）；[無障礙功能](./nsh.md#accessibility)（`announce`、`setAccessibilityFocus`、`screenReaderEnabled`、`reduceMotion`）；元素、樣式、事件和 JSX 的型別（`ViewRef`、`InputRef` 等，以及 `ViewStyle` 等） | [nsh](./nsh.md) |
| `nsh/base` | `Button`、`Input`；`TextView`；`createNavStack`、`NavStack`、`NavPage`、`Dialog`；`AlertDialog` | [nsh/base](./nsh-base.md) |
| `nsh/mobile` | `isAvailable`、`TabBar`（系統分頁列，iOS 和 Android）、`InputAccessoryView`（iOS）、`BackHandler`（Android） | [nsh/mobile](./nsh-mobile.md) |
| `nsh/desktop` | `isAvailable`、`Window`（標題、標題列、最大化、全螢幕）、`titleBar`、`Menu`（應用程式選單、右鍵選單） | [nsh/desktop](./nsh-desktop.md) |
| 標準模組 | `buffer`、`console`、`crypto`、`fs/promises`、`net`、`os`、`path`、`process`、`url`、`websocket`、`zlib` | [標準模組](./standard-modules.md) |
| 全域 API | `fetch`、`URL`、`TextEncoder`、`Blob`、`FormData`、`AbortController`、`Intl`、計時器、`console`、`requestAnimationFrame` 等（無需匯入） | [全域 API](./globals.md) |

並非模組的參考頁面：

| 頁面 | 內容 |
|---|---|
| [樣式參考](./style-reference.md) | 每個樣式鍵、其型別和含義 |
| [Tailwind 參考](./tailwind-reference.md) | `class` 接受的 Tailwind 工具類別和變體 |

<a id="host-elements"></a>

## 宿主元素

宿主元素是與其他內容一樣透過匯入使用的元件：`View`、`Text`、`Scroll`、`Image`、`List`、`Canvas`、`WebView`、`Video` 和 `Overlay` 來自 `nsh`，基礎元件（`Button`、`Input`、`Dialog`、`NavStack`、`NavPage`）來自 `nsh/base`，`InputAccessoryView` 來自 `nsh/mobile`。只有 `If` 和 `Each` 是全域的。編譯器會就地生成這些元素，因此這些匯入在執行時不會產生任何開銷。它們的 props 記載於[元素](../elements/index.md)。
