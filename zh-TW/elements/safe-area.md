---
title: "安全區域"
description: "safe-area-inset 環境變數,以及 safeArea 和 safeAreaInsets 存取器:讓內容避開瀏海、狀態列、主畫面指示器與標題列。"
order: 110
group: primitives
demo: el-safe-area
source_hash: b81d3cc1ab15d9ad
---

# 安全區域

安全區域(safe area)可讓內容避開瀏海或 Dynamic Island、狀態列、主畫面指示條、導覽標頭,以及 Mac Catalyst 標題列。任何 view 都可以透過 CSS 的 `env()`:
`env(safe-area-inset-top)`、`env(safe-area-inset-right)`、`env(safe-area-inset-bottom)` 與
`env(safe-area-inset-left)`,在 padding 或 margin 中以它來為自己加上內距。它們是節點所渲染之根 view 的內縮值(inset):
在 [NavPage](./nav-stack.md) 內是頁面標頭下方的內縮值,在 [Dialog](./dialog.md) 內是該對話框的
內縮值,其他情況則是 surface 的安全區域。在瀏覽器中,頁面本身就是根,這些變數即為瀏覽器自己的
變數。

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

背景色會填滿整個區域,包括狀態列後方的區域,而內容則從其下方開始。這些值會隨內縮值變化:旋轉裝置、切換到另一個頁面或對話框時,內距會在原生層自動更新。

<a id="values"></a>

## 值

| 值 | 範例 | 意義 |
|---|---|---|
| `env(name)` | `paddingTop: "env(safe-area-inset-top)"` | 該內縮值。 |
| `env(name, <length>)` | `env(safe-area-inset-top, 20px)` | 該內縮值;其中的長度會在名稱未知時作為備用值,與 CSS 相同。 |
| `calc(env(name) + <length>)` | `calc(env(safe-area-inset-bottom) + 16px)` | 該內縮值再加上一個長度,適用於自帶間距的內容。 |
| `calc(<length> + env(name))` | `calc(16px + env(safe-area-inset-left))` | 同上。 |

它們適用於 `padding`、`paddingHorizontal`、`paddingVertical`、`paddingTop`、`paddingRight`、`paddingBottom`、
`paddingLeft`,以及相同的 `margin` 鍵。在 Tailwind 中,它們是 `p`、`px`、`py`、`pt`、`pr`、`pb`、
`pl` 與 `m` 工具類別的任意值(可省略空格):`pt-[env(safe-area-inset-top)]`、
`pb-[calc(env(safe-area-inset-bottom)+16px)]`。這些值的 TypeScript 型別為 `EnvValue`。請參閱
[樣式參考](../modules/style-reference.md)。

在 Rust 中,可用 `Styled` 方法來設定:`.p_safe_area()`、`.px_safe_area()`、`.py_safe_area()`、`.pt_safe_area()`、
`.pr_safe_area()`、`.pb_safe_area()`、`.pl_safe_area()`、相同的 `m` 方法,以及 `.pt_safe_area_plus(px(16.0))`
(還有 `pr`、`pb`、`pl`、`mt`、`mr`、`mb`、`ml`)用於內縮值加上一個長度。

<a id="choosing-the-edges"></a>

## 選擇邊緣

只為需要的邊緣加上內距,例如當你自己的分頁列(tab bar)或底部列已處理底部內縮值時:

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

具有可見且不透明標頭的 [NavPage](./nav-stack.md) 已經會將內容放在標頭下方,因此該處的頂部
內縮值為 0。安全區域內縮值適用於:

- 沒有導覽堆疊的應用程式的根 view,
- 使用 `headerVisible={false}` 或 `headerTransparent` 的頁面,
- 全螢幕 [Dialog](./dialog.md) 的內容,
- 你自己放在螢幕邊緣的列。

<a id="safearea-and-safeareainsets"></a>

## safeArea 與 safeAreaInsets

若需要在程式碼中取得數值,可以直接讀取。兩個 TSX 存取器都來自 `nsh`,回傳 `Edges` 物件
(`{ top, right, bottom, left }`,單位為 point),而且是響應式的:讀取它們的程式碼會在值變動時重新執行,例如
旋轉裝置時。

| TSX | Rust | 回傳 |
|---|---|---|
| `safeArea()` | `safe_area()` | surface 的安全區域:避開系統 UI(瀏海、主畫面指示條、標題列)的部分。 |
| `safeAreaInsets()` | `cx.insets()` | 元件渲染位置的內縮值:最近的頁面(其標頭下方)、最近的對話框,否則為 surface 的安全區域。這些就是 `safe-area-inset-*` 變數的值。在 TSX 中,請在元件內呼叫,它會回傳一個存取器。你的 crate 中的 Rust 元件則以 `cx.insets()` 讀取。 |

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

若只是要以內縮值本身作為內距,`env()` 是較簡單的寫法:它在原生層更新,不需要執行程式碼。

<a id="platform-notes"></a>

## 平台注意事項

- **iOS**:內縮值來自 UIKit 的安全區域:狀態列、瀏海或 Dynamic Island,以及主畫面
  指示條。
- **Android**:NSH 會回報與 NSH view 重疊的系統列與螢幕挖孔(display cutout)部分。當 NSH
  [嵌入](../docs/android.md)於原生工具列下方時,該 view 的頂部內縮值為 0。
- **Mac Catalyst**:頂部內縮值為視窗的標題列。
- **桌面平台(macOS、Windows、Linux、GPUI)與網頁**:頁面內容從其 `header` 下方開始,而對話框
  會為其內容提供自己的內縮值,與手機上相同。

<a id="related"></a>

## 相關內容

- [Keyboard](./keyboard.md):`env(keyboard-inset-height)`,讓內容保持在軟體鍵盤上方。
- [Device and environment](../docs/device-and-environment.md):安全區域與裝置其他數值的對照。
