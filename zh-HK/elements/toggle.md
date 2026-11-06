---
title: "Toggle"
description: "Toggle 與 ToggleGroup:Toggle 是可在開啟與關閉之間切換的按鈕,ToggleGroup 則是由多個 Toggle 組成的工具列。每個 Toggle 負責處理按下操作、鍵盤啟動、停用狀態,以及供螢幕閱讀器使用的角色和按下狀態;ToggleGroup 是一個工具列,整組只佔用鍵盤焦點的一個停駐點;外觀以及哪些 Toggle 處於按下狀態,則由應用程式自行決定。"
group: base
demo: el-toggle
source_hash: d8d3727dd9d04426
---


# Toggle

A toggle 是一個保持開或關的按鈕：文字工具列中的粗體、收藏星號、檢視選項都是例子。`Toggle` 負責掌管它的行為：按下、鍵盤啟動、停用狀態，以及帶有按下狀態的按鈕角色，螢幕閱讀器會將它讀作切換按鈕。以 `ToggleGroup` 包住多個切換按鈕就成為工具列：螢幕閱讀器會將它讀作工具列，鍵盤只需一個停駐點就能到達它，並可用方向鍵在其切換按鈕之間移動。外觀由應用程式決定：切換按鈕本身沒有顏色、尺寸、圖示或標籤。它的子元素是應用程式的圖示或標籤，而切換按鈕上的 `aria-pressed:` 類別，或其內部元素上的 `group-aria-pressed:` 類別，會隨其狀態變化。

```rust tabs
use nsh_base::{theme, toggle, toggle_group};
use nsh_core::prelude::*;

fn formatting() -> impl IntoElement {
    let bold = signal(true);
    let italic = signal(false);
    let item = move |label: &'static str, on: Signal<bool>| {
        toggle()
            .pressed(on)
            .accessibility_label(label)
            .on_change(move |pressed: &bool| on.set(*pressed))
            .size_8()
            .items_center()
            .justify_center()
            .rounded(move || theme().radius)
            .pressed_style(|s| s.bg(move || theme().accent))
            .child(text(&label[..1]).text_sm().text_color(move || {
                if on.get() { theme().accent_foreground } else { theme().muted_foreground }
            }))
    };
    toggle_group()
        .flex_row()
        .self_start()
        .gap_1()
        .child(item("Bold", bold))
        .child(item("Italic", italic))
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { Toggle, ToggleGroup } from "nsh/base";

function App() {
  const marks = signal<string[]>(["bold"]);
  const item = (value: string, label: string) => (
    <Toggle
      pressed={marks().includes(value)}
      accessibilityLabel={label}
      onChange={({ pressed }) =>
        marks.set(pressed ? [...marks(), value] : marks().filter((m) => m !== value))
      }
      class="group size-8 items-center justify-center rounded-(--radius) aria-pressed:bg-accent"
    >
      <Text class="text-sm text-muted-foreground group-aria-pressed:text-accent-foreground">{label[0]}</Text>
    </Toggle>
  );
  return (
    <ToggleGroup class="flex-row self-start gap-1">
      {item("bold", "Bold")}
      {item("italic", "Italic")}
    </ToggleGroup>
  );
}

mount(App);
```

`Toggle` 和 `ToggleGroup` 來自 [`nsh/base`](../modules/nsh-base.md)，即 Rust 中的 `nsh-base` crate。數值由應用程式掌管：每個切換按鈕都會被告知是否處於按下狀態，按下時以 `onChange` 回報它所要求的數值，而切換按鈕會顯示應用程式回傳的 `pressed`。群組同樣不持有任何數值，所以可同時按下多少個切換按鈕也由應用程式決定：可以是任意數量（粗體、斜體和底線），或剛好一個（對齊方式、檢視切換器），後者由應用程式按下被要求的切換按鈕、放開其他按鈕，並讓已按下的那個保持按下。在 Rust 中，`toggle()` 和 `toggle_group()` 用來建立它們，每個屬性有一個 setter（`.pressed(..)`），每個事件有一個監聽器（`.on_change(..)`），另有具型別的樣式方法，以及用於內容的 `.child(..)`。

<a id="props"></a>

## 屬性

### Toggle

| 屬性 | Rust | 類型 | 預設值 | 說明 |
|---|---|---|---|---|
| `pressed` | `.pressed(..)` | `boolean` | `false` | 開或關：螢幕閱讀器會讀出已按下，並套用 `aria-pressed:` 樣式。按下時以 `onChange` 回報相反的數值；切換按鈕顯示應用程式回傳的數值。 |
| `disabled` | `.disabled(..)` | `boolean` | `false` | 不接受按下，也沒有按下回饋；套用 `disabled:` 樣式，螢幕閱讀器會讀出已變暗。位於停用的 `ToggleGroup` 內的切換按鈕同樣會被停用。 |
| `pressedStyle` | `.pressed_style(\|s\| ..)` | `StyleProp<ViewStyle>` | 無 | 切換按鈕在已按下且未停用時的樣式，以 `aria-pressed:` 類別表示。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 無 | 螢幕閱讀器讀出的內容：當子元素沒有可說明用途的文字（例如圖示）時，說明此切換按鈕開啟的是什麼。 |
| `hitSlop` | `.hit_slop(..)` | `number \| Partial<Edges>` | 無 | 在邊界以外多遠的按下仍會被計算，單位為點：所有邊使用同一個數字，或分別指定各邊。與 View 的 `hitSlop` 相同。 |
| `children` | `.child(..)` | `JSX.Element` | 無 | 應用程式的圖示或標籤，螢幕閱讀器會讀出它。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | 無 | 切換按鈕本身：內容周圍的表面。 |
| `activeStyle`、`hoverStyle`、`focusStyle`、`disabledStyle` | `.active(\|s\| ..)`、`.hover(..)`、`.focus(..)`、`.disabled_style(..)` | `StyleProp<ViewStyle>` | 無 | 切換按鈕在按下進行中、懸停、獲得焦點或停用時的樣式，以 `<state>:` 類別表示。 |

### ToggleGroup

| 屬性 | Rust | 類型 | 預設值 | 說明 |
|---|---|---|---|---|
| `disabled` | `.disabled(..)` | `boolean` | `false` | 群組內的每個切換按鈕都會被停用，不論其自身的 `disabled` 為何。 |
| `children` | `.child(..)` | `JSX.Element` | 無 | 群組的切換按鈕，以及應用程式在它們之間排版的任何內容（例如分隔線）。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | 無 | 群組的版面配置和外觀：預設為直向排列，使用 `flex-row` 則為橫向排列。 |

<a id="events"></a>

## 事件

| 事件 | Rust | 說明 |
|---|---|---|
| `onChange`（`Toggle`） | `.on_change(\|pressed: &bool\| ..)` | 切換按鈕被按下：點按、點擊、在它擁有鍵盤焦點時按 Space 或 Return，或螢幕閱讀器的啟動操作。`{ pressed }` 是它所要求的數值，即 `pressed` 的相反值。它在任何改變發生之前執行：切換按鈕顯示應用程式回傳的 `pressed`。 |

`ToggleGroup` 內的方向鍵只會移動鍵盤焦點，不會按下任何按鈕。停用的切換按鈕不會回報任何事件。

<a id="parts"></a>

## 部件

| 部件 | 位於 | 樣式設定 | 狀態 |
|---|---|---|---|
| 群組 | | `ToggleGroup` 的 `class`、`style` | |
| 切換按鈕 | 群組內，或任何位置 | `Toggle` 的 `class`、`style` | `aria-pressed:`、`disabled:`、`active:`、`hover:`、`focus:`（或 `pressedStyle`、`disabledStyle` 等） |
| 圖示或標籤 | 切換按鈕 | 其自身的元素（`children`） | `group-aria-pressed:`、`group-disabled:` 及其他 `group-*:` 變體，配合切換按鈕 `class` 上的 `group` |

`aria-pressed:` 表示切換按鈕處於開啟；`active:` 表示按下正在進行，不論是開或關。請透過切換按鈕自身的表面來顯示已按下的狀態：填色、凸起的膠囊形狀、更強烈的圖示（參閱[設計指南](../docs/design-guides.md#interaction-states)）。

<a id="segmented"></a>

## 分段式

切換按鈕連在一起、一次只按下一個的群組，就是分段控制（檢視切換器）：應用程式保存一個數值，並按下與它對應的切換按鈕。連接起來的外觀由應用程式的類別決定：

```tsx
<ToggleGroup class="flex-row self-start">
  <Each of={["grid", "list"]}>
    {(value) => (
      <Toggle
        pressed={view() === value()}
        accessibilityLabel={`${value()} view`}
        onChange={({ pressed }) => pressed && view.set(value())}
        class="-ml-px h-8 px-3 border border-border first:ml-0 first:rounded-l-(--radius) last:rounded-r-(--radius) aria-pressed:bg-accent"
      >
        <Text class="text-sm">{value()}</Text>
      </Toggle>
    )}
  </Each>
</ToggleGroup>
```

<a id="disabled"></a>

## 停用

停用的切換按鈕不接受按下，螢幕閱讀器會讀出它已變暗。它的 `disabled:` 類別會覆蓋 `aria-pressed:` 類別，其內部的 `group-disabled:` 類別也會跟隨。在 `ToggleGroup` 上使用 `disabled` 會停用其中每個切換按鈕，也就是由應用程式鎖定的工具列：

```tsx
<ToggleGroup disabled={readonly()} class="flex-row gap-1">
  <Toggle pressed={bold()} onChange={({ pressed }) => bold.set(pressed)} class="size-8 disabled:opacity-50">
    <Text>B</Text>
  </Toggle>
</ToggleGroup>
```

<a id="a-small-target-with-hitslop"></a>

## 使用 hitSlop 的小型目標

圖示切換按鈕可能比手指還小。`hitSlop` 讓落在它附近的按下也被計算，每邊向外延伸若干點，而不會改變其版面配置或外觀：所有邊使用同一個數字，或分別指定各邊（`{ top: 8, bottom: 8 }`），與 [View 的 `hitSlop`](./index.md#presses-and-feedback)接受的格式相同。

```tsx
<Toggle
  pressed={favorite()}
  hitSlop={12}
  accessibilityLabel="Favorite"
  onChange={({ pressed }) => favorite.set(pressed)}
  class="size-5 items-center justify-center"
>
  <Text>★</Text>
</Toggle>
```

<a id="accessibility"></a>

## 無障礙

- 對螢幕閱讀器而言，切換按鈕是一個元素，角色為 `"button"` 並帶有其按下狀態：即切換按鈕。它的標籤是其子元素的文字，或 `accessibilityLabel`。
- `ToggleGroup` 的角色為 `"toolbar"`：螢幕閱讀器會將其內的切換按鈕讀作一個工具列，而每個切換按鈕仍然是各自獨立的元素。
- `disabled` 會按平台自身的方式讀出（VoiceOver、TalkBack、UI Automation、瀏覽器的無障礙樹）。
- 在 macOS 和 web 上，群組是鍵盤焦點的一個停駐點，方向鍵在其切換按鈕之間移動（見下文）。

有關標籤、角色和朗讀通告的一般說明，請參閱[無障礙](../docs/accessibility.md)。

<a id="keyboard"></a>

## 鍵盤

在 macOS 和 web 上，Tab 可到達接受按下的 View，此時 `ToggleGroup` 遵循 [WAI-ARIA 工具列模式](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/)：

| 按鍵 | 作用 |
|---|---|
| Tab、Shift+Tab | 從第一個已按下的切換按鈕進入群組（若沒有已按下的，則從第一個未停用的切換按鈕進入），並一步離開群組。 |
| Right、Down | 將焦點移到下一個切換按鈕，從最後一個移到第一個。 |
| Left、Up | 將焦點移到上一個切換按鈕，從第一個移到最後一個。 |
| Home、End | 將焦點移到第一個或最後一個切換按鈕。 |
| Space、Return | 按下目前擁有焦點的切換按鈕。 |

方向鍵會略過停用的切換按鈕，也不會按下任何按鈕：切換按鈕只有在被按下時才會改變。無論群組的版面配置為何（這由應用程式的類別決定），兩組方向鍵都會移動焦點。在由右至左的版面配置中，Left 和 Right 互換作用：Left 移到下一個切換按鈕，Right 移到上一個；Up、Down、Home 和 End 則保持不變。`focus:` 樣式會顯示焦點所在位置。位於 `ToggleGroup` 以外的 `Toggle` 自成一個停駐點。

<a id="platform-notes"></a>

## 平台備註

- iOS、Android 和 Mac Catalyst：按下是指在切換按鈕（包括其內容）上結束的一次點按。
- 桌面平台（macOS、Windows、Linux、GPUI）和 web：按下是指一次點擊。在 macOS 和 web 上，Space 和 Return 同樣會按下擁有鍵盤焦點的切換按鈕，而方向鍵、Home 和 End 則用來移動焦點（[鍵盤](#keyboard)）。
- 每個平台都會繪製應用程式所設定的樣式：切換按鈕、已按下按鈕的表面，以及群組的軌道。
