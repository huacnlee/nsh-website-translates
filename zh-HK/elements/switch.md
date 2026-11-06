---
title: "Switch"
description: "Switch 元件：開／關控制項，負責處理按下操作、鍵盤啟動、停用狀態，以及供螢幕閱讀器使用的角色和值，並包含由應用程式自行設定樣式的軌道（track）和滑塊（thumb）。"
group: base
demo: el-switch
source_hash: d203427a791f5543
---


# Switch

開關用來開啟或關閉某項設定，變更會即時生效。開關負責行為：按下、鍵盤啟動、停用狀態，以及供螢幕閱讀器使用的開關角色及其值。外觀則由應用程式決定：`Switch` 本身沒有顏色、尺寸、動畫或標籤。它由軌道（內含滑塊）及其後的子元件（標籤）組成，應用程式可為每個部分設定樣式，並使用跟隨開關狀態的 `checked:` 和 `disabled:` class。

```rust tabs
use nsh_base::{switch, theme};
use nsh_core::prelude::*;

fn wifi() -> impl IntoElement {
    let on = signal(false);
    switch()
        .checked(on)
        .on_change(move |next: &bool| on.set(*next))
        .flex_row()
        .items_center()
        .gap_3()
        .track_style(|s| {
            s.w(px(44.0))
                .p(px(2.0))
                .rounded_full()
                .bg(move || theme().muted)
                .transition_colors()
                .checked(|s| s.bg(move || theme().primary))
        })
        .thumb_style(|s| {
            s.size(px(20.0))
                .rounded_full()
                .bg(move || theme().background)
                .shadow_sm()
                .transition_transform()
                .checked(|s| s.translate_x(px(20.0)))
        })
        .child(text("Wi-Fi"))
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { Switch } from "nsh/base";

function App() {
  const on = signal(false);
  return (
    <Switch
      checked={on()}
      onChange={({ checked }) => on.set(checked)}
      class="flex-row items-center gap-3"
      trackClass="w-11 rounded-full bg-muted p-0.5 transition-colors checked:bg-primary"
      thumbClass="size-5 rounded-full bg-background shadow-sm transition-transform checked:translate-x-5"
    >
      <Text>Wi-Fi</Text>
    </Switch>
  );
}

mount(App);
```

`Switch` 來自 [`nsh/base`](../modules/nsh-base.md)，即 Rust 中的 `nsh-base` crate。數值由應用程式持有：按下時會透過 `onChange` 回報下一個數值，而開關則顯示應用程式傳回的 `checked`。在 Rust 中，`switch()` 會建立一個開關，每個 prop 各有一個 setter（`.checked(..)`、`.track_style(..)`），每個事件各有一個監聽器（`.on_change(..)`），開關本身使用具型別的樣式方法，標籤則使用 `.child(..)`；各部分的樣式可使用跟隨開關狀態的狀態方法（`.checked(..)`、`.disabled_style(..)`）。

## Props

| Prop | Rust | 類型 | 預設值 | 說明 |
|---|---|---|---|---|
| `checked` | `.checked(..)` | `boolean` | `false` | 開啟或關閉。按下時會透過 `onChange` 回報下一個數值；開關顯示應用程式傳回的數值。 |
| `disabled` | `.disabled(..)` | `boolean` | `false` | 不接受按下，也沒有按下回饋；`disabled:` 樣式會套用於開關及其各部分，螢幕閱讀器會讀出它呈淡化狀態。 |
| `checkedStyle` | `.checked_style(\|s\| ..)` | `StyleProp<ViewStyle>` | 無 | 開關在 `checked` 且未停用時的樣式，以 `checked:` class 表示。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 無 | 螢幕閱讀器讀出的內容：當子元件沒有文字說明時，用來說明此開關開啟的是甚麼。 |
| `trackClass`、`trackStyle` | `.track_style(\|s\| ..)` | `string`、`StyleProp<ViewStyle>` | 無 | 軌道，即滑塊移動所沿的部分。 |
| `thumbClass`、`thumbStyle` | `.thumb_style(\|s\| ..)` | `string`、`StyleProp<ViewStyle>` | 無 | 滑塊，位於軌道之內。 |
| `hitSlop` | `.hit_slop(..)` | `number \| Partial<Edges>` | 無 | 在邊界以外多遠的按下仍會計算在內，單位為點：可用一個數字套用於所有邊，或分別指定各邊。與 view 的 `hitSlop` 相同。 |
| `children` | `.child(..)` | `JSX.Element` | 無 | 軌道之後的內容：標籤，螢幕閱讀器會讀出它。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | 無 | 開關本身：包住軌道和標籤的一行。 |
| `activeStyle`、`hoverStyle`、`focusStyle`、`disabledStyle` | `.active(\|s\| ..)`、`.hover(..)`、`.focus(..)`、`.disabled_style(..)` | `StyleProp<ViewStyle>` | 無 | 開關在被按下、懸停、取得焦點或停用時的樣式，以 `<state>:` class 表示。 |

<a id="events"></a>

## 事件

| 事件 | Rust | 說明 |
|---|---|---|
| `onChange` | `.on_change(\|checked: &bool\| ..)` | 開關被按下：包括輕按、點擊、在開關取得鍵盤焦點時按 Space 或 Return，或螢幕閱讀器的啟動操作。它會以 `checked` 回報開關要求的數值，即與目前 `checked` 相反的值。 |

已停用的開關不會回報任何事件。

<a id="parts"></a>

## 組成部分

| 部分 | 位於 | 樣式設定方式 | 狀態 |
|---|---|---|---|
| 開關 | | `class`、`style` | `checked:`、`disabled:`、`active:`、`hover:`、`focus:`（或 `checkedStyle`、`disabledStyle` 等） |
| 軌道 | 開關內，第一個 | `trackClass`、`trackStyle` | `checked:`、`disabled:` 跟隨開關 |
| 滑塊 | 軌道內 | `thumbClass`、`thumbStyle` | `checked:`、`disabled:` 跟隨開關 |
| 標籤 | 開關內，位於軌道之後 | 自身的元素（`children`） | `group-checked:` 及其他 `group-*:` 變體，配合開關上的 `group` 與 `class` |

滑塊透過自身的 `checked:` 樣式移動：使用平移（`checked:translate-x-5`），或使用邊距，又或軌道的對齊方式（軌道上的 `checked:justify-end`）。`transition-*` class 會以原生方式為變化加上動畫。若要將標籤放在軌道之前，請反轉該行：`class="flex-row-reverse justify-between"`。

<a id="disabled"></a>

## 停用

已停用的開關不接受按下，螢幕閱讀器會將它讀作淡化狀態。它的 `disabled:` class，以及軌道和滑塊各自的同類 class 會生效，並覆蓋它們的 `checked:` 樣式：

```tsx
<Switch
  checked={on()}
  disabled={!online()}
  onChange={({ checked }) => on.set(checked)}
  class="flex-row items-center gap-3 disabled:opacity-50"
  trackClass="w-11 rounded-full bg-muted p-0.5 checked:bg-primary disabled:bg-muted"
  thumbClass="size-5 rounded-full bg-background checked:translate-x-5"
>
  <Text>Sync over cellular</Text>
</Switch>
```

<a id="a-small-target-with-hitslop"></a>

## 使用 hitSlop 擴大小型目標

沒有旁邊標籤的開關可能比手指還小。`hitSlop` 可讓落在開關附近的按下也被計算在內，範圍為每邊向外延伸的點數，且不會改變其佈局或外觀：可用一個數字套用於所有邊，或分別指定各邊（`{ top: 8, bottom: 8 }`），與 [view 的 `hitSlop`](./index.md#presses-and-feedback) 的接受方式相同。

```tsx
<Switch
  checked={on()}
  hitSlop={{ top: 8, bottom: 8 }}
  accessibilityLabel="Notifications"
  onChange={({ checked }) => on.set(checked)}
  trackClass="w-9 rounded-full bg-muted p-0.5 checked:bg-primary"
  thumbClass="size-4 rounded-full bg-background checked:translate-x-4"
/>
```

<a id="accessibility"></a>

## 無障礙

- 對螢幕閱讀器而言，開關是一個單一元素，角色為 `"switch"`，並帶有其值（開啟或關閉）；軌道和滑塊都是它的組成部分。它的標籤是子元件的文字；若沒有子元件文字，請提供 `accessibilityLabel`。
- `disabled` 會按各平台自身的方式讀出（VoiceOver、TalkBack、UI Automation、瀏覽器的無障礙樹）。
- 在 macOS 和網頁上，開關是鍵盤焦點的停駐點：按 Tab 可移到它，按 Space 和 Return 可切換它，而 `focus:` 樣式會顯示焦點所在位置。

有關標籤、角色和朗讀內容的一般說明，請參閱 [無障礙](../docs/accessibility.md)。

<a id="platform-notes"></a>

## 平台備註

- iOS、Android 和 Mac Catalyst：按下是指結束於開關上的輕按，包括其標籤在內。
- 桌面平台（macOS、Windows、Linux、GPUI）和網頁：按下是指點擊。在 macOS 和網頁上，Space 和 Return 同樣可切換取得鍵盤焦點的開關。
- 每個平台都會繪製應用程式所設定的樣式；滑塊會依照應用程式的樣式和轉場效果移動。
