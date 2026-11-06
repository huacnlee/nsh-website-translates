---
title: "安全區域"
description: "safe-area-inset 環境變數,以及 safeArea 和 safeAreaInsets 存取器:讓內容避開瀏海、狀態列、主畫面指示條和標題列。"
order: 110
group: primitives
demo: el-safe-area
source_hash: b81d3cc1ab15d9ad
---


# 安全區域

安全區域可讓內容避開瀏海或 Dynamic Island、狀態列、主畫面指示條、導覽標題列，以及 Mac Catalyst 的標題列。任何檢視都可以在 padding 或 margin 中使用 CSS 的 `env()`：
`env(safe-area-inset-top)`、`env(safe-area-inset-right)`、`env(safe-area-inset-bottom)` 和
`env(safe-area-inset-left)`，按安全區域自行留白。它們是節點所渲染的根檢視的邊距：在 [NavPage](./nav-stack.md) 內是頁面標題列以下的邊距，在 [Dialog](./dialog.md) 內是對話框的邊距，其他情況則是 surface 的安全區域。在瀏覽器中，頁面就是根，變數是瀏覽器本身的。

```rust tabs
use nsh_core::prelude::*;

fn app() -> impl IntoElement {
    view()
        .flex_1()
        .bg(rgb(0xfff8c5))
        .p_safe_area()
        .child(text("Clear of the notch").text_2xl().font_weight(FontWeight::BOLD))
}
```

```tsx tabs
import { mount, Text, View } from "nsh";

function App() {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#fff8c5",
        paddingTop: "env(safe-area-inset-top)",
        paddingRight: "env(safe-area-inset-right)",
        paddingBottom: "env(safe-area-inset-bottom)",
        paddingLeft: "env(safe-area-inset-left)",
      }}
    >
      <Text style={{ fontSize: 24, fontWeight: "700" }}>Clear of the notch</Text>
    </View>
  );
}

mount(App);
```

背景顏色會填滿整個區域，包括狀態列後面的區域，而內容則從其下方開始。數值會跟隨邊距變化：旋轉裝置、切換到另一個頁面或對話框時，padding 會以原生方式更新。

<a id="values"></a>

## 值

| 值 | 範例 | 意思 |
|---|---|---|
| `env(name)` | `paddingTop: "env(safe-area-inset-top)"` | 該邊距。 |
| `env(name, <length>)` | `env(safe-area-inset-top, 20px)` | 該邊距；與 CSS 一樣，長度值用作未知名稱時的後備值。 |
| `calc(env(name) + <length>)` | `calc(env(safe-area-inset-bottom) + 16px)` | 該邊距加上一個長度，適用於自行保留間距的內容。 |
| `calc(<length> + env(name))` | `calc(16px + env(safe-area-inset-left))` | 同上。 |

它們適用於 `padding`、`paddingHorizontal`、`paddingVertical`、`paddingTop`、`paddingRight`、`paddingBottom`、
`paddingLeft`，以及相同的 `margin` 鍵。在 Tailwind 中，它們是 `p`、`px`、`py`、`pt`、`pr`、`pb`、
`pl` 和 `m` 工具類別的任意值（空格可以省略）：`pt-[env(safe-area-inset-top)]`、
`pb-[calc(env(safe-area-inset-bottom)+16px)]`。這些值的 TypeScript 類型是 `EnvValue`。請參閱[樣式參考](../modules/style-reference.md)。

在 Rust 中，可以用 `Styled` 方法來設定：`.p_safe_area()`、`.px_safe_area()`、`.py_safe_area()`、`.pt_safe_area()`、
`.pr_safe_area()`、`.pb_safe_area()`、`.pl_safe_area()`、相同的 `m` 方法，以及 `.pt_safe_area_plus(px(16.0))`
（還有 `pr`、`pb`、`pl`、`mt`、`mr`、`mb`、`ml`）用於邊距加長度。

<a id="choosing-the-edges"></a>

## 選擇邊緣

只為需要的邊緣留白，例如當你自己的分頁列或底部列已經處理了底部邊距時：

```rust tabs
view()
    .flex_1()
    .pt_safe_area()
    .px_safe_area()
```

```tsx tabs
<View class="flex-1 pt-[env(safe-area-inset-top)] px-[calc(env(safe-area-inset-left)+16px)]">
  …
</View>
```

<a id="where-to-use-it"></a>

## 使用時機

帶有可見且不透明標題列的 [NavPage](./nav-stack.md) 已經會把內容放在標題列之下，因此頂部邊距為 0。安全區域邊距適用於：

- 沒有導覽堆疊的應用程式的根檢視，
- 設定了 `headerVisible={false}` 或 `headerTransparent` 的頁面，
- 全螢幕 [Dialog](./dialog.md) 的內容，
- 你自己放在螢幕邊緣的列。

<a id="safearea-and-safeareainsets"></a>

## safeArea 與 safeAreaInsets

如果需要在程式碼中取得數值，可以直接讀取。兩個 TSX 存取器都來自 `nsh`，返回 `Edges` 物件
（`{ top, right, bottom, left }`，單位為 point），而且是響應式的：讀取它們的程式碼會在數值改變時（例如旋轉裝置時）重新執行。

| TSX | Rust | 返回 |
|---|---|---|
| `safeArea()` | `safe_area()` | surface 的安全區域：避開系統 UI（瀏海、主畫面指示條、標題列）的部分。 |
| `safeAreaInsets()` | `cx.insets()` | 元件渲染位置的邊距：最近的頁面（標題列以下）、最近的對話框，否則為 surface 的安全區域。這些就是 `safe-area-inset-*` 變數的值。在 TSX 中，於元件內呼叫它，它會返回一個存取器。你的 crate 中的 Rust 元件則以 `cx.insets()` 讀取。 |

```rust tabs
use nsh_core::prelude::*;

fn bottom_bar() -> impl IntoElement {
    view()
        .flex_row()
        .p_2()
        .pb(move || if safe_area().bottom > Points::ZERO { px(4.0) } else { px(8.0) })
        .child(text("Bottom bar"))
}
```

```tsx tabs
import { Text, View, safeArea } from "nsh";

function BottomBar() {
  const insets = safeArea();
  return (
    <View style={{ flexDirection: "row", padding: 8, paddingBottom: insets().bottom > 0 ? 4 : 8 }}>
      <Text>Bottom bar</Text>
    </View>
  );
}
```

如果只是按邊距本身留白，`env()` 是更簡單的做法：它以原生方式更新，無需執行程式碼。

<a id="platform-notes"></a>

## 平台備註

- **iOS**：邊距來自 UIKit 的安全區域：狀態列、瀏海或 Dynamic Island，以及主畫面指示條。
- **Android**：NSH 會回報與 NSH 檢視重疊的系統列和螢幕缺口部分。當 NSH [嵌入](../docs/android.md)在原生工具列下方時，檢視的頂部邊距為 0。
- **Mac Catalyst**：頂部邊距是視窗的標題列。
- **桌面平台（macOS、Windows、Linux、GPUI）和網頁**：頁面的內容從其 `header` 下方開始，而對話框會為其內容提供自己的邊距，與手機上一樣。

<a id="related"></a>

## 相關內容

- [鍵盤](./keyboard.md)：`env(keyboard-inset-height)`，讓內容保持在軟鍵盤之上。
- [裝置與環境](../docs/device-and-environment.md)：安全區域與裝置其他數值的關係。
