---
title: "Collapsible"
description: "Collapsible 元件：一個內容可展開及收合的區域，當應用程式將其開啟時，內容會顯示在其子元件之後，並按需要以彈簧式的高度變化展開，觸發元件及所有外觀樣式均由應用程式自行提供。"
group: base
demo: el-collapsible
source_hash: cf0c6bafa8f80920
---


# Collapsible

Collapsible 是內容可展開和收合的區域，例如摘要下的詳細資料、「顯示更多」，或是進階設定區段。它一律渲染子元素，並在 `open` 時於子元素之後渲染 `content`。`open` 和切換它的觸發元件（子元素之一）由應用程式擁有，外觀亦由應用程式決定：`Collapsible` 本身沒有觸發元件、箭咀圖示或標籤。啟用 `reveal` 後，內容會以動畫展開和收合：區域的高度會以彈簧動畫由零變為內容本身的高度，收合時則反向變回零，而 collapsible 之後的內容亦會隨之移動。

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

`Collapsible` 來自 [`nsh/base`](../modules/nsh-base.md)，即 Rust 的 `nsh-base` crate。數值由應用程式擁有：觸發元件會切換 `open`，而 collapsible 會顯示應用程式傳入的值。在 Rust 中，`collapsible()` 會建立 collapsible，每個 prop 各有一個 setter（`.open(..)`、`.reveal(..)`、`.content(..)`），並提供用於區域的具類型樣式方法，以及用於常駐顯示內容的 `.child(..)`。

## Props

| Prop | Rust | 類型 | 預設值 | 說明 |
|---|---|---|---|---|
| `open` | `.open(..)` | `boolean` | `false` | 是否展開：展開時，`content` 會位於樹中，排在子元素之後。數值由應用程式擁有。 |
| `reveal` | `.reveal(..)` | `boolean` | `false` | 以揭示動畫展開和收合：內容放在一個會裁切它的區域內，當 `open` 開啟時，該區域的高度會由零以彈簧動畫變為內容本身的高度，關閉時則變回零，採用臨界阻尼（約 265 毫秒，無過衝）。collapsible 之後的內容會隨之移動，而內容會保留在樹中，直至區域完全收合為止。若啟用減少動態效果，則會即時展開和收合。區域在收合時仍然處於佈局中，高度為零，因此 collapsible 的 `gap` 也會排在它之前。 |
| `content` | `.content(..)` | `JSX.Element` | 無 | 展開的內容。內容只會建立一次，並在收合期間保留，因此其中的狀態（輸入框的文字、捲動位置、開關）會在每次展開之間保持不變。 |
| `children` | `.child(..)` | `JSX.Element` | 無 | 無論展開與否都會顯示的內容：摘要，以及切換 `open` 的觸發元件。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | 無 | 包住子元素和內容的區域（`gap-2` 會設定它們之間的間距）。 |

## Events

Collapsible 本身不會回報任何事件：觸發元件由應用程式擁有，應用程式會在其按下事件（帶有 `role="button"` 的 `View` 的 `onPress`）中切換 `open`。

## Parts

| Part | 位置 | 樣式設定 |
|---|---|---|
| 區域 | | `class`、`style` |
| 子元素 | 區域內，最先 | 各自的元素 |
| 揭示區域 | 區域內，位於子元素之後，需配合 `reveal` | 無：它負責裁切內容，並取用內容的高度 |
| 內容 | 區域內，位於子元素之後（使用 `reveal` 時位於揭示區域內），於 `open` 時顯示 | 各自的元素（`content`） |

未使用 `reveal` 時，內容會即時出現和消失，而各平台會在內容出現或消失時重新佈局區域。使用 `reveal` 時，這個變化會成為更改 `open` 的該次 commit 的佈局動畫（作為 `LayoutAnimation.configureNext`，在原生層執行，因此動畫進行期間不會執行 JavaScript）：揭示區域會由零增長至內容的高度，並再收縮回去，而同一變更所移動的任何內容的 frame，包括 collapsible 之後的 view，都會隨之移動。應用程式自己的 transition 亦會一併執行：觸發元件的箭咀圖示會旋轉（`transition-transform`），而內容亦可用自己的 class 淡入。

## Accessibility

- 對螢幕閱讀器而言，區域本身不是獨立的元素：其子元素和內容會按原樣朗讀。
- 觸發元件會說明區域是否已展開：請為它設定 `accessibilityState={{ expanded: open }}` 和按鈕角色（在 `View` 上使用 `role="button"`），螢幕閱讀器便會連同其標籤宣告「已展開」或「已收合」。
- 在 macOS 和網頁上，當觸發元件可接受按下操作時，它會成為鍵盤焦點的停駐點：可用 Tab 鍵移到它，並以 Space 和 Return 切換區域。

有關標籤、角色和宣告的一般說明，請參閱 [Accessibility](../docs/accessibility.md)。

<a id="platform-notes"></a>

## 平台備註

- 所有平台都會在 `open` 時，於子元素之後顯示內容，否則會將它移出佈局。
- 使用 `reveal` 時，所有平台都會以各自的動畫器對區域高度施加彈簧動畫（iOS、Android、macOS、Windows、Linux、GPUI 和網頁），並在系統要求減少動態效果時即時展開和收合。
- iOS、Android 和 Mac Catalyst：觸發元件的按下操作是輕按。桌面平台（macOS、Windows、Linux、GPUI）和網頁：點按，而在 macOS 和網頁上，亦可在已取得焦點的觸發元件上按 Space 或 Return。
