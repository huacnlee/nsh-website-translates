---
title: "模組"
description: "NSH 應用程式所匯入的模組、各模組所匯出的內容,以及它們的組織方式。"
order: 1
source_hash: c212e0667eddb588
---

# 模組

NSH 應用程式從一小組模組匯入它所使用的一切。它們全部是原生的：反應式圖（reactive graph）、渲染器以及每個模組都在執行階段內以 Rust 實作，而打包工具會將 `import ... from "nsh/..."` 保留為匯入，而不是把程式碼複製到你的 bundle 中。你的 bundle 只包含你自己的程式碼。

```tsx
import { createAnimatedValue, mount, signal, windowSize } from "nsh";
import { Button } from "nsh/base";
import { TabBar } from "nsh/mobile";
```

<a id="three-layers"></a>

## 三個層級

NSH 的 UI 分為三個層級，與 GPUI Kit 相同（`gpui`、`gpui-base`、`gpui-component`）：

| 層級 | 模組 | 為應用程式提供什麼 |
|---|---|---|
| Primitives | `nsh`、`nsh/mobile`、`nsh/desktop` | 反應性、host elements、版面配置、清單、canvas、動畫、手勢、裝置資訊以及各平台自身的 API |
| Base components | [`nsh/base`](./nsh-base.md) | 無樣式的元件，負責行為、狀態、焦點與無障礙功能：按鈕、Markdown 與 HTML 文件、導覽堆疊與對話框，以及系統對話框，適用於所有平台 |
| 元件庫 | 應用程式自己的，或來自社群的 | 具有外觀的按鈕、卡片、列與畫面 |

應用程式的外觀由應用程式自己決定。它的元件庫是第三層：由 [host elements](../elements/index.md) 與 `nsh/base` 組成的元件，使用 `style`、[Tailwind](../docs/tailwind.md) class 與其主題來設定樣式；也可以是它在[自己的 crate](../docs/rust.md) 中發佈的 Rust 元件，或是社群在同一基礎上發佈的元件庫。

沒有包羅萬象的模組：每個 API 都只存在於一個位置。行動平台的 API 位於 `nsh/mobile`（iOS 與 Android），桌面平台的 API 位於 `nsh/desktop`（macOS、Windows、Linux）；兩者在所有平台上都可以匯入，因此同一個 bundle 可在所有平台上執行（在其他平台上，其呼叫會立即返回，而 `platform.os` 會告訴你目前所在的平台）。

型別是由執行階段產生的：`nsh init`、`nsh build`、`nsh dev` 與 `nsh test` 會在你的應用程式旁寫入 `.nsh/types`，因此 TypeScript 宣告一律與你用來建置的執行階段相符（請參閱[專案結構](../docs/project-structure.md)）。

<a id="all-modules"></a>

## 所有模組

| 模組 | 匯出 | 頁面 |
|---|---|---|
| `nsh` | `signal`、`computed`、`effect`、`batch`、`untracked`、`cleanup`、`context`、`split`、`mount`、`ErrorBoundary`；primitives `View`、`Text`、`Scroll`、[`List`](./nsh-list.md)、[`Image`](./nsh-image.md)（含 `Image.getSize`、`Image.prefetch`）、[`Canvas`](./nsh-canvas.md)（含 `Path2D`、`CanvasRenderingContext2D`、`CanvasGradient`）、[`WebView`](./nsh-webview.md)、[`Video`](./nsh-video.md)；`safeArea`、`safeAreaInsets`；`Keyboard`、`keyboardFrame`；[動畫](./nsh.md#animation)（`createAnimatedValue`、`AnimatedValue`、`AnimatedNode`、`Animated`、`Easing`、`LayoutAnimation`）；[環境](./nsh.md#device)（`windowSize`、`colorScheme`、`setColorScheme`、`fontScale`、`pixelRatio`、`locale`、`platform`、`openUrl`）；[`PanResponder`](./nsh.md#panresponder)；[`Clipboard`](./nsh.md#clipboard)；[`Picker`](./nsh.md#picker)；[`Storage`](./nsh.md#storage)；[`host`](./nsh.md#host)（`available`、`call`、`on`，以及原生 SDK `params` 與 `post`）；[`keymap`](./nsh.md#keymap)（鍵盤快速鍵：`mod+k`、`ctrl+shift+p` 等）；[`nativeComponent`、`nativeModule`](./nsh.md#nativecomponent-and-nativemodule)（由嵌入的應用程式註冊的元件與函式）；[無障礙功能](./nsh.md#accessibility)（`announce`、`setAccessibilityFocus`、`screenReaderEnabled`、`reduceMotion`）；元素、樣式、事件與 JSX 的型別（`ViewRef`、`InputRef`、...、`ViewStyle`、...） | [nsh](./nsh.md) |
| `nsh/base` | `Button`、`Input`；`TextView`；`createNavStack`、`NavStack`、`NavPage`、`Dialog`；`AlertDialog` | [nsh/base](./nsh-base.md) |
| `nsh/mobile` | `isAvailable`、`TabBar`（系統的分頁列，iOS 與 Android）、`InputAccessoryView`（iOS）、`BackHandler`（Android） | [nsh/mobile](./nsh-mobile.md) |
| `nsh/desktop` | `isAvailable`、`Window`（標題、標題列、最大化、全螢幕）、`titleBar`、`Menu`（應用程式選單、右鍵選單） | [nsh/desktop](./nsh-desktop.md) |
| 標準模組 | `buffer`、`console`、`crypto`、`fs/promises`、`net`、`os`、`path`、`process`、`url`、`websocket`、`zlib` | [標準模組](./standard-modules.md) |
| 全域 | `fetch`、`URL`、`TextEncoder`、`Blob`、`FormData`、`AbortController`、`Intl`、計時器、`console`、`requestAnimationFrame` 等（無需匯入） | [全域 API](./globals.md) |

非模組的參考頁面：

| 頁面 | 涵蓋內容 |
|---|---|
| [樣式參考](./style-reference.md) | 每個樣式鍵、其型別與意義 |
| [Tailwind 參考](./tailwind-reference.md) | `class` 接受的 Tailwind 工具類別與變體 |

## Host elements

Host elements 是與其他一切相同、以匯入方式使用的元件：來自 `nsh` 的 `View`、`Text`、`Scroll`、`Image`、`List`、`Canvas`、`WebView`、`Video` 與 `Overlay`，來自 `nsh/base` 的 base components（`Button`、`Input`、`Dialog`、`NavStack`、`NavPage`），以及來自 `nsh/mobile` 的 `InputAccessoryView`。只有 `If` 與 `Each` 是全域的。編譯器會就地建立這些元素，因此這些匯入在執行階段不會產生任何成本。它們的 props 記載於[元素](../elements/index.md)之下。
