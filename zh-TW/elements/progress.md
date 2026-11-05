---
title: "Progress"
description: "Progress 元件：線性進度列，負責為螢幕閱讀器提供其角色、範圍與值，並依據該值決定指示器的寬度，包含由應用程式自行設定樣式的軌道與指示器。"
group: base
demo: el-progress
source_hash: c9a75dc1aac1177f
---

# Progress

進度條會顯示範圍已知的任務（下載、上傳、設定中的某個步驟）進行到哪裡，或是在 `indeterminate` 時表示範圍未知的任務正在進行中。它負責螢幕閱讀器取得的內容（範圍 0 到 100 的進度條角色與其值），以及指示器的寬度：軌道寬度的 `value` %。外觀由 app 決定：`Progress` 本身沒有顏色、尺寸、圓角、動態效果或標籤。它由軌道與其內的指示器組成，後面接著它的子元素（標籤、以文字呈現的值），每個部分都由 app 設定樣式。

```rust tabs
use nsh_base::{progress, theme};
use nsh_core::prelude::*;

fn upload(sent: Signal<f32>) -> impl IntoElement {
    progress()
        .value(sent)
        .accessibility_label("Uploading photos")
        .gap_2()
        .track_style(|s| s.h(px(8.0)).rounded_full().overflow_hidden().bg(move || theme().muted))
        .indicator_style(|s| s.h_full().rounded_full().bg(move || theme().primary))
        .child(
            text(move || format!("{:.0}%", sent.get()))
                .text_sm()
                .text_color(move || theme().muted_foreground),
        )
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { Progress } from "nsh/base";

function App() {
  const sent = signal(40);
  return (
    <Progress
      value={sent()}
      accessibilityLabel="Uploading photos"
      class="gap-2"
      trackClass="h-2 overflow-hidden rounded-full bg-muted"
      indicatorClass="h-full rounded-full bg-primary"
    >
      <Text class="text-sm text-muted-foreground">{`${sent()}%`}</Text>
    </Progress>
  );
}

mount(App);
```

`Progress` 來自 [`nsh/base`](../modules/nsh-base.md)，也就是 Rust 中的 `nsh-base` crate。值由 app 掌控：進度條顯示 app 傳入的 `value`，並限制在 0 到 100 之間。在 Rust 中，`progress()` 會建立一個進度條，每個屬性都有對應的 setter（`.value(..)`、`.indicator_style(..)`）、用於進度條本身的型別化樣式方法，以及用於其標籤的 `.child(..)`。

<a id="props"></a>

## 屬性

| 屬性 | Rust | 型別 | 預設值 | 說明 |
|---|---|---|---|---|
| `value` | `.value(..)` | `number` | `0` | 任務進行到哪裡，以 0 到 100 的百分比表示（超出範圍時取最接近的端點）。指示器的寬度為軌道寬度的該比例，螢幕閱讀器會唸出此值。 |
| `indeterminate` | `.indeterminate(..)` | `boolean` | `false` | 任務的範圍未知：螢幕閱讀器會聽到沒有值的進度條，指示器的寬度由 app 決定（`indicatorClass`）。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 無 | 螢幕閱讀器唸出的內容：當子元素沒有文字說明時，用來說明正在進行的是什麼。 |
| `trackClass`、`trackStyle` | `.track_style(\|s\| ..)` | `string`、`StyleProp<ViewStyle>` | 無 | 軌道，即指示器填滿的部分。 |
| `indicatorClass`、`indicatorStyle` | `.indicator_style(\|s\| ..)` | `string`、`StyleProp<ViewStyle>` | 無 | 軌道內的指示器：其高度、顏色與動態效果。 |
| `children` | `.child(..)` | `JSX.Element` | 無 | 軌道之後的內容：標籤或以文字呈現的值，螢幕閱讀器會唸出。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | 無 | 進度條本身：包住軌道與標籤的直欄（或橫列）。 |

<a id="parts"></a>

## 部件

| 部件 | 位置 | 樣式設定方式 |
|---|---|---|
| 進度條 | | `class`、`style` |
| 軌道 | 進度條內，第一個 | `trackClass`、`trackStyle` |
| 指示器 | 軌道內 | `indicatorClass`、`indicatorStyle`；其寬度為軌道寬度的 `value` % |
| 標籤 | 進度條內，軌道之後 | 它自己的元素（`children`） |

指示器從軌道的起始邊緣開始；`overflow-hidden` 與軌道上的圓角會讓指示器的末端與軌道一起變圓。`w-*` class 或 `indicatorStyle` 中的 `width` 會取代由值決定的寬度，不確定進度的進度條就是這樣取得自己的寬度。

<a id="indeterminate"></a>

## 不確定進度

範圍未知時，請設定 `indeterminate`，並為指示器指定由 app 自訂的寬度與動態效果。動態效果由 app 決定，而 `motion-reduce:` 會讓它在使用者要求減少動態效果時保持靜止：

```tsx
<Progress
  value={0}
  indeterminate={connecting()}
  trackClass="h-2 overflow-hidden rounded-full bg-muted"
  indicatorClass={
    connecting()
      ? "h-full w-1/3 rounded-full bg-primary animate-pulse motion-reduce:animate-none"
      : "h-full rounded-full bg-primary"
  }
/>
```

<a id="accessibility"></a>

## 無障礙功能

- 對螢幕閱讀器而言，進度條是單一元素，角色為 `"progressbar"`，範圍為 0 到 100，並帶有其值（VoiceOver 與 TalkBack 會以百分比唸出）；軌道與指示器是它的一部分。它的標籤是其子元素的文字；若沒有子元素文字，請提供 `accessibilityLabel`。
- 在 `indeterminate` 時，它仍保有角色與範圍，但沒有值（在瀏覽器中：`aria-valuenow` 會被省略，這符合 ARIA 對不確定進度條的規定）。
- 它不接受按壓，也不會取得鍵盤焦點：它只負責回報，而開始或停止任務的控制項由 app 提供。

關於標籤、角色與公告的一般說明，請參閱[無障礙功能](../docs/accessibility.md)。

<a id="platform-notes"></a>

## 平台說明

- 每個平台都會繪製 app 所設定的樣式；指示器的寬度會立即隨 `value` 變化，而當 app 為變化加上動畫時，變化便會以動畫呈現。
- 螢幕閱讀器：VoiceOver（iOS、macOS）會以百分比唸出值，並將進度條視為頻繁更新；TalkBack、UI Automation（Windows）、GTK 的無障礙功能（Linux）與瀏覽器（`aria-valuenow`）則會取得範圍與值。
