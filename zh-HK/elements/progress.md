---
title: "Progress"
description: "Progress 元件:線性進度條,負責為屏幕閱讀器提供其角色、範圍和數值,並按數值設定指示器的寬度,包含由應用程式自行設定樣式的軌道和指示器。"
group: base
demo: el-progress
source_hash: c9a75dc1aac1177f
---


# Progress

進度條顯示已知範圍任務的進度（例如下載、上傳或安裝設定的某個步驟）；當 `indeterminate` 時，則表示範圍未知的任務正在進行。進度條負責提供螢幕閱讀器所讀取的資訊，即範圍為 0 至 100 的進度條角色及其數值，以及指示器的寬度：佔軌道寬度的 `value` %。外觀由應用程式決定：`Progress` 本身沒有顏色、尺寸、圓角、動態效果或標籤。它由一條軌道（內含指示器）加上其子元素（標籤、以文字顯示的數值）組成，各部分的樣式均由應用程式設定。

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

`Progress` 來自 [`nsh/base`](../modules/nsh-base.md)，即 Rust 的 `nsh-base` crate。數值由應用程式持有：進度條顯示應用程式傳入的 `value`，並限定在 0 至 100 之間。在 Rust 中，`progress()` 會建立進度條，每個屬性各有一個 setter（`.value(..)`、`.indicator_style(..)`），進度條本身有具型別的樣式方法，其標籤則使用 `.child(..)`。

<a id="props"></a>

## 屬性

| 屬性 | Rust | 類型 | 預設值 | 說明 |
|---|---|---|---|---|
| `value` | `.value(..)` | `number` | `0` | 任務的進度，以 0 至 100 的百分比表示（超出範圍時取最接近的一端）。指示器的寬度即軌道寬度的該百分比，螢幕閱讀器也會讀出此數值。 |
| `indeterminate` | `.indeterminate(..)` | `boolean` | `false` | 任務的範圍未知：螢幕閱讀器會讀出一個沒有數值的進度條，而指示器的寬度由應用程式決定（`indicatorClass`）。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 無 | 螢幕閱讀器讀出的內容：當子元素沒有文字說明時，用來表示正在進行的是甚麼。 |
| `trackClass`、`trackStyle` | `.track_style(\|s\| ..)` | `string`、`StyleProp<ViewStyle>` | 無 | 軌道，即指示器所填滿的部分。 |
| `indicatorClass`、`indicatorStyle` | `.indicator_style(\|s\| ..)` | `string`、`StyleProp<ViewStyle>` | 無 | 軌道內的指示器：its 高度、顏色和動態效果。 |
| `children` | `.child(..)` | `JSX.Element` | 無 | 軌道之後的內容：標籤或以文字顯示的數值，螢幕閱讀器會讀出這些內容。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | 無 | 進度條本身：環繞軌道和標籤的欄（或列）。 |

<a id="parts"></a>

## 部件

| 部件 | 位置 | 樣式設定方式 |
|---|---|---|
| 進度條 | | `class`、`style` |
| 軌道 | 進度條內，最先 | `trackClass`、`trackStyle` |
| 指示器 | 軌道內 | `indicatorClass`、`indicatorStyle`；其寬度為軌道寬度的 `value` % |
| 標籤 | 進度條內，軌道之後 | 自身的元素（`children`） |

指示器從軌道的起始邊緣開始；`overflow-hidden` 以及軌道上的圓角會讓指示器的末端與軌道一同變圓。`w-*` class 或 `indicatorStyle` 中的 `width` 會取代數值所決定的寬度，不確定進度條便是以此取得自己的寬度。

<a id="indeterminate"></a>

## 不確定狀態

當範圍未知時，設定 `indeterminate`，並為指示器指定由應用程式決定的寬度和動態效果。動態效果由應用程式自行選擇，而 `motion-reduce:` 會為要求減少動態效果的使用者保持靜止：

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

## 無障礙

- 對螢幕閱讀器而言，進度條是單一元素，角色為 `"progressbar"`，範圍為 0 至 100，並帶有其數值（VoiceOver 和 TalkBack 會以百分比讀出）；軌道和指示器是它的組成部分。其標籤是子元素的文字；如果沒有子元素文字，請提供 `accessibilityLabel`。
- 當 `indeterminate` 時，它保留角色和範圍，但沒有數值（在瀏覽器中：不設 `aria-valuenow`，與 ARIA 對不確定進度條的規定一致）。
- 它不接受按壓操作，也沒有鍵盤焦點：它只負責回報狀態，而啟動或停止任務的控制項由應用程式提供。

有關標籤、角色和播報的一般說明，請參閱[無障礙](../docs/accessibility.md)。

<a id="platform-notes"></a>

## 平台備註

- 每個平台都會繪製應用程式所設定的樣式；指示器的寬度會即時跟隨 `value`，而當應用程式為變化加上動畫時，變化便會以動畫呈現。
- 螢幕閱讀器：VoiceOver（iOS、macOS）會以百分比讀出數值，並將進度條視為頻繁更新；TalkBack、UI Automation（Windows）、GTK 的無障礙功能（Linux）以及瀏覽器（`aria-valuenow`）則取得範圍和數值。
