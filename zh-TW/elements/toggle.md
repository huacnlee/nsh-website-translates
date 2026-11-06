---
title: "Toggle"
description: "Toggle 與 ToggleGroup:Toggle 是可開啟或關閉的按鈕,ToggleGroup 則是由這類按鈕組成的工具列。每個 Toggle 負責處理點按、鍵盤啟動、停用狀態,以及供螢幕閱讀器使用的角色與按下狀態;群組是一個工具列,在鍵盤焦點中只佔一個停駐點;外觀以及哪些 Toggle 處於按下狀態,則由應用程式自行決定。"
group: base
demo: el-toggle
source_hash: d8d3727dd9d04426
---

# Toggle

toggle 是一個保持開啟或關閉的按鈕：文字工具列中的粗體、我的最愛星號、檢視選項。`Toggle` 負責它的行為：按下、鍵盤啟動、停用狀態，以及帶有按下狀態的按鈕角色，螢幕閱讀器會將其播報為切換按鈕。多個 toggle 外面的 `ToggleGroup` 就是工具列：螢幕閱讀器會將其播報為工具列，鍵盤只需一個停駐點即可到達，並以方向鍵在其 toggle 之間移動。外觀由應用程式決定：toggle 本身沒有顏色、尺寸、圖示或標籤。它的子元素是應用程式的圖示或標籤，toggle 上的 `aria-pressed:` 類別，或其內部元素上的 `group-aria-pressed:` 類別，會跟隨它的狀態。

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

`Toggle` 與 `ToggleGroup` 來自 [`nsh/base`](../modules/nsh-base.md)，也就是 Rust 中的 `nsh-base` crate。值屬於應用程式：每個 toggle 都會被告知自己是否被按下，按下時以 `onChange` 回報它所要求的值，而 toggle 會顯示應用程式回傳的 `pressed`。群組同樣不保存任何值，因此可以同時按下多少個 toggle 也由應用程式決定：可以是任意數量（粗體、斜體與底線），也可以恰好一個（對齊方式、檢視切換器），後者由應用程式按下被要求的 toggle，放開其他的，並讓已按下的那個保持按下。在 Rust 中，`toggle()` 與 `toggle_group()` 用來建立它們，每個屬性有一個 setter（`.pressed(..)`），每個事件有一個監聽器（`.on_change(..)`），並提供具型別的樣式方法，以及用於內容的 `.child(..)`。

<a id="props"></a>

## 屬性

<a id="toggle-1"></a>

### Toggle

| 屬性 | Rust | 型別 | 預設值 | 說明 |
|---|---|---|---|---|
| `pressed` | `.pressed(..)` | `boolean` | `false` | 開啟或關閉：螢幕閱讀器會說它已按下，並套用 `aria-pressed:` 樣式。按下時以 `onChange` 回報另一個值；toggle 顯示應用程式回傳的值。 |
| `disabled` | `.disabled(..)` | `boolean` | `false` | 不接受按下，也沒有按下回饋；套用 `disabled:` 樣式，螢幕閱讀器會說它已變暗。位於已停用的 `ToggleGroup` 中的 toggle 同樣會被停用。 |
| `pressedStyle` | `.pressed_style(\|s\| ..)` | `StyleProp<ViewStyle>` | 無 | toggle 在已按下且未停用時的樣式，以 `aria-pressed:` 類別表示。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 無 | 螢幕閱讀器所說的內容：當其子元素沒有可說明用途的文字（例如圖示）時，說明這個 toggle 開啟的是什麼。 |
| `hitSlop` | `.hit_slop(..)` | `number \| Partial<Edges>` | 無 | 在邊界之外多遠的按下仍會算數，單位為 point：所有邊使用同一個數字，或分別指定各邊。與 view 的 `hitSlop` 相同。 |
| `children` | `.child(..)` | `JSX.Element` | 無 | 應用程式的圖示或標籤，螢幕閱讀器會朗讀它。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | 無 | toggle 本身：內容周圍的表面。 |
| `activeStyle`、`hoverStyle`、`focusStyle`、`disabledStyle` | `.active(\|s\| ..)`、`.hover(..)`、`.focus(..)`、`.disabled_style(..)` | `StyleProp<ViewStyle>` | 無 | toggle 在按下進行中、懸停、取得焦點或停用時的樣式，以 `<state>:` 類別表示。 |

### ToggleGroup

| 屬性 | Rust | 型別 | 預設值 | 說明 |
|---|---|---|---|---|
| `disabled` | `.disabled(..)` | `boolean` | `false` | 群組中的每個 toggle 都會被停用，無論其自身的 `disabled` 為何。 |
| `children` | `.child(..)` | `JSX.Element` | 無 | 群組中的 toggle，以及應用程式在它們之間安排的任何內容（例如分隔線）。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | 無 | 群組的版面與外觀：預設為直欄，`flex-row` 則為橫列。 |

<a id="events"></a>

## 事件

| 事件 | Rust | 說明 |
|---|---|---|
| `onChange`（`Toggle`） | `.on_change(\|pressed: &bool\| ..)` | toggle 被按下：點按、點擊、在它擁有鍵盤焦點時按 Space 或 Return，或螢幕閱讀器的啟動操作。`{ pressed }` 是它所要求的值，與 `pressed` 相反。它在任何變化發生之前執行：toggle 顯示應用程式回傳的 `pressed`。 |

`ToggleGroup` 的方向鍵只會移動鍵盤焦點：不會按下任何東西。已停用的 toggle 不會回報任何事件。

<a id="parts"></a>

## 組成部分

| 部分 | 位於 | 樣式來源 | 狀態 |
|---|---|---|---|
| 群組 | | `ToggleGroup` 的 `class`、`style` | |
| toggle | 群組內，或任何位置 | `Toggle` 的 `class`、`style` | `aria-pressed:`、`disabled:`、`active:`、`hover:`、`focus:`（或 `pressedStyle`、`disabledStyle` 等） |
| 圖示或標籤 | toggle 內 | 其自身的元素（`children`） | `group-aria-pressed:`、`group-disabled:` 以及其他在 toggle 的 `class` 上帶有 `group` 的 `group-*:` 變體 |

`aria-pressed:` 表示 toggle 處於開啟；`active:` 表示按下正在進行，無論開啟或關閉。請透過 toggle 自身的表面來呈現已按下的狀態：填色、浮起的膠囊形狀、較強烈的圖示（請參閱 [Design guides](../docs/design-guides.md#interaction-states)）。

## Segmented

toggle 彼此相連、一次只按下一個的群組，就是分段控制（檢視切換器）：應用程式保存一個值，並按下與該值對應的 toggle。相連的外觀由應用程式的類別決定：

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

已停用的 toggle 不接受按下，螢幕閱讀器會將其播報為已變暗。它的 `disabled:` 類別會覆蓋其 `aria-pressed:` 類別，其內部的 `group-disabled:` 類別也會跟隨。在 `ToggleGroup` 上設定 `disabled` 會停用其中的每個 toggle，這就是由應用程式鎖定的工具列：

```tsx
<ToggleGroup disabled={readonly()} class="flex-row gap-1">
  <Toggle pressed={bold()} onChange={({ pressed }) => bold.set(pressed)} class="size-8 disabled:opacity-50">
    <Text>B</Text>
  </Toggle>
</ToggleGroup>
```

<a id="a-small-target-with-hitslop"></a>

## 以 hitSlop 放大小型目標

圖示 toggle 可能比手指還小。`hitSlop` 會讓落在它附近的按下也算數，單位為 point，向每一邊外延伸，而不改變它的版面或外觀：所有邊使用同一個數字，或分別指定各邊（`{ top: 8, bottom: 8 }`），與 [view 的 `hitSlop`](./index.md#presses-and-feedback) 接受的方式相同。

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

- 對螢幕閱讀器而言，toggle 是單一元素，角色為 `"button"` 並帶有其按下狀態：即切換按鈕。它的標籤是其子元素的文字，或 `accessibilityLabel`。
- `ToggleGroup` 的角色為 `"toolbar"`：螢幕閱讀器會將其中的 toggle 聽作一個工具列，每個 toggle 仍是各自獨立的元素。
- `disabled` 依平台自己的方式播報（VoiceOver、TalkBack、UI Automation、瀏覽器的無障礙樹）。
- 在 macOS 與網頁上，群組是鍵盤焦點的一個停駐點，方向鍵在其 toggle 之間移動（見下文）。

標籤、角色與播報的一般說明，請參閱 [Accessibility](../docs/accessibility.md)。

<a id="keyboard"></a>

## 鍵盤

在 macOS 與網頁上，Tab 可到達接受按下的 view，此時 `ToggleGroup` 遵循 [WAI-ARIA toolbar pattern](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/)：

| 按鍵 | 作用 |
|---|---|
| Tab、Shift+Tab | 從第一個已按下的 toggle 進入群組（若沒有任何已按下的，則從第一個未停用的 toggle 進入），並一步離開。 |
| Right、Down | 將焦點移到下一個 toggle，從最後一個回到第一個。 |
| Left、Up | 將焦點移到上一個 toggle，從第一個回到最後一個。 |
| Home、End | 將焦點移到第一個或最後一個 toggle。 |
| Space、Return | 按下取得焦點的 toggle。 |

方向鍵會略過已停用的 toggle，也不會按下任何東西：toggle 只有在被按下時才會改變。無論群組的版面為何（那是應用程式的類別），兩組方向鍵都會移動焦點。在由右至左的版面中，Left 與 Right 會互換：Left 移到下一個 toggle，Right 移到上一個；Up、Down、Home 與 End 則維持不變。`focus:` 樣式會顯示焦點所在位置。位於 `ToggleGroup` 之外的 `Toggle` 是自己的一個停駐點。

<a id="platform-notes"></a>

## 平台說明

- iOS、Android 與 Mac Catalyst：按下是在 toggle 上結束的一次點按，包含其內容。
- 桌面平台（macOS、Windows、Linux、GPUI）與網頁：按下是一次點擊。在 macOS 與網頁上，Space 與 Return 同樣會按下擁有鍵盤焦點的 toggle，方向鍵、Home 與 End 則移動焦點（[鍵盤](#keyboard)）。
- 每個平台都會繪製應用程式所設定的樣式：toggle、已按下 toggle 的表面，以及群組的軌道。
