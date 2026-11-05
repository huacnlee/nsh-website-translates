---
title: "Collapsible"
description: "Collapsible 元件：一個內容可展開與收合的區域，在應用程式將其開啟時顯示於其子元素之後，並在需要時以彈簧式高度動畫展開；觸發器與所有外觀樣式皆由應用程式自行決定。"
group: base
demo: el-collapsible
source_hash: cf0c6bafa8f80920
---

# Collapsible

Collapsible 是內容可展開與收合的區域：摘要下方的詳細內容、「顯示更多」，或是一段進階設定。它一律渲染其子元素，並在 `open` 時於子元素之後渲染 `content`。應用程式擁有 `open` 以及切換它的觸發器（子元素之一），外觀也由應用程式決定：`Collapsible` 本身沒有觸發器、箭頭或標籤。啟用 `reveal` 時，內容會以動態效果展開與收合：其區域的高度會以彈簧動畫從零變為內容本身的高度，再變回零，位於 Collapsible 之後的內容也會隨之移動。

```rust tabs
use nsh_base::{collapsible, theme};
use nsh_core::{AccessibilityState, prelude::*};

fn storage() -> impl IntoElement {
    let open = signal(false);
    collapsible()
        .open(open)
        .reveal(true)
        .gap_2()
        .child(
            view()
                .role(AccessibilityRole::Button)
                .accessibility_state(move || AccessibilityState {
                    expanded: Some(open.get()),
                    ..AccessibilityState::default()
                })
                .on_press(move || open.update(|o| *o = !*o))
                .flex_row()
                .items_center()
                .justify_between()
                .child(text("Storage"))
                .child(text("›").transition_transform().rotate(move || {
                    if open.get() { deg(90.0) } else { deg(0.0) }
                })),
        )
        .content(text("Photos 120 GB · Apps 54 GB · System 38 GB").text_color(move || theme().muted_foreground))
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { Collapsible } from "nsh/base";

function App() {
  const open = signal(false);
  return (
    <Collapsible
      open={open()}
      reveal
      class="gap-2"
      content={<Text class="text-muted-foreground">Photos 120 GB · Apps 54 GB · System 38 GB</Text>}
    >
      <View
        role="button"
        accessibilityState={{ expanded: open() }}
        onPress={() => open.set(!open())}
        class="flex-row items-center justify-between active:opacity-70"
      >
        <Text class="font-medium">Storage</Text>
        <Text class={`transition-transform ${open() ? "rotate-90" : ""}`}>›</Text>
      </View>
    </Collapsible>
  );
}

mount(App);
```

`Collapsible` 來自 [`nsh/base`](../modules/nsh-base.md)，也就是 Rust 中的 `nsh-base` crate。值由應用程式持有：其觸發器切換 `open`，而 Collapsible 顯示應用程式傳入的值。在 Rust 中，`collapsible()` 會建立一個 Collapsible，每個屬性各有一個 setter（`.open(..)`、`.reveal(..)`、`.content(..)`），另有用於區域的具型別樣式方法，以及用於一律顯示內容的 `.child(..)`。

<a id="props"></a>

## 屬性

| 屬性 | Rust | 型別 | 預設值 | 說明 |
|---|---|---|---|---|
| `open` | `.open(..)` | `boolean` | `false` | 已展開：`content` 位於樹中，在子元素之後。值由應用程式持有。 |
| `reveal` | `.reveal(..)` | `boolean` | `false` | 以展開動畫開啟與關閉：內容位於會裁切它的區域中，該區域的高度在 `open` 開啟時以彈簧動畫從零增長到內容本身的高度，關閉時再縮回，採臨界阻尼（約 265 毫秒，無過衝）。位於 Collapsible 之後的內容會隨之移動，且內容會一直留在樹中，直到區域完全關閉。啟用減少動態效果時，則會立即開啟與關閉。區域在關閉時也仍在版面中，高度為零，因此 Collapsible 的 `gap` 也會出現在它之前。 |
| `content` | `.content(..)` | `JSX.Element` | 無 | 要展開的內容。它只建立一次，收合時仍會保留，因此其中的內容（輸入框的文字、捲動位置、開關）在每次開啟之間都會保持狀態。 |
| `children` | `.child(..)` | `JSX.Element` | 無 | 一律顯示的內容：摘要，以及切換 `open` 的觸發器。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | 無 | 包住子元素與內容的區域（`gap-2` 用於設定它們的間距）。 |

<a id="events"></a>

## 事件

Collapsible 本身不回報任何事件：觸發器屬於應用程式，其按下動作（帶有 `role="button"` 的 `View` 的 `onPress`）就是應用程式切換 `open` 的時機。

<a id="parts"></a>

## 組成部分

| 部分 | 位置 | 樣式設定方式 |
|---|---|---|
| 區域 | | `class`、`style` |
| 子元素 | 區域內，最先 | 各自的元素 |
| 展開動畫的區域 | 區域內，位於子元素之後，搭配 `reveal` | 無：它裁切內容並取用內容的高度 |
| 內容 | 區域內，位於子元素之後（搭配 `reveal` 時位於展開動畫的區域內），在 `open` 期間 | 各自的元素（`content`） |

沒有 `reveal` 時，內容會立即出現與消失，各平台會在內容加入或離開時重新排版該區域。有 `reveal` 時，這個變化會成為變更 `open` 的那次 commit 的版面動畫（作為 `LayoutAnimation.configureNext`，在原生層執行，因此移動期間不會執行任何 JavaScript）：展開動畫的區域從零增長到內容的高度，再縮回；同一次變更所移動的任何東西，其 frame 也會一併移動，包括位於 Collapsible 之後的 view。應用程式自己的 transition 也會同步進行：觸發器的箭頭會旋轉（`transition-transform`），內容也可以用它自己的 class 淡入。

<a id="accessibility"></a>

## 無障礙

- 對螢幕閱讀器而言，區域本身不是獨立的元素：其子元素與內容會照原樣朗讀。
- 觸發器會說明區域是否已展開：請為它設定 `accessibilityState={{ expanded: open }}` 與按鈕角色（在 `View` 上使用 `role="button"`），螢幕閱讀器便會連同其標籤一起朗讀「已展開」或「已收合」。
- 在 macOS 與網頁上，當觸發器接受按下操作時，它是鍵盤焦點的停駐點：Tab 可以移到它，Space 與 Return 可切換區域。

有關標籤、角色與朗讀播報的一般說明，請參閱[無障礙](../docs/accessibility.md)。

<a id="platform-notes"></a>

## 平台說明

- 每個平台都會在 `open` 時於子元素之後顯示內容，其餘時候則將它排除在版面之外。
- 啟用 `reveal` 時，每個平台都會以各自的動畫器對區域的高度施加彈簧動畫（iOS、Android、macOS、Windows、Linux、GPUI 與網頁），而在系統要求減少動態效果時，則會立即開啟與關閉。
- iOS、Android 與 Mac Catalyst：觸發器的按下動作是點按（tap）。桌面平台（macOS、Windows、Linux、GPUI）與網頁：點擊（click），而在 macOS 與網頁上，對取得焦點的觸發器按 Space 或 Return 也可以。
