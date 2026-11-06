---
title: "Slider"
description: "Slider 元件:沿軌道選取單一數值或由兩個數值組成的範圍,支援在觸控螢幕上按壓和拖曳,以及使用滑鼠操作;每個滑塊均提供 WAI-ARIA 的 slider 按鍵操作,並為螢幕閱讀器提供數值;軌道、指示器、範圍和滑塊的樣式均可由應用程式自行設定。"
group: base
demo: el-slider
source_hash: 5dfd7ea970e4cd98
---


# Slider

滑桿沿軌道選取一個值（例如音量、亮度），或以兩個滑塊各取一值組成區間（例如價格區間）。它自行處理行為：按一下軌道，較近的滑塊會移到該處；滑塊會跟隨拖曳，無論使用滑鼠還是手指；值會貼齊`step`；每個滑塊都是鍵盤焦點的停靠點，可用方向鍵移動，對螢幕閱讀器來說也是可調整元素，各有自己的值。外觀由應用程式決定：`Slider` 本身沒有顏色、尺寸、圓角或動態效果。它由軌道組成，軌道內有指示器，範圍區段和滑塊位於指示器上，然後是其子項（標籤、以文字顯示的值），應用程式為每個部件設定樣式。

```rust tabs
use nsh_base::{SliderValue, slider, theme};
use nsh_core::prelude::*;

fn strength(level: Signal<SliderValue>) -> impl IntoElement {
    let percent = move || format!("{}%", level.get().end());
    slider()
        .value(move || level.get())
        .accessibility_label("Option strength")
        .on_change(move |next: &SliderValue| level.set(*next))
        // The value in a column after the rail.
        .flex_row()
        .items_center()
        .gap_2()
        // An 8-point rail; the thumbs travel inside it.
        .track_style(|s| s.h(px(8.0)).flex_1().px(px(8.0)).rounded_full().bg(move || theme().muted))
        .indicator_style(|s| s.h_full())
        // The fill, from the rail's edge, fading into the thumb's tone.
        .range_style(|s| {
            s.ml(-px(8.0))
                .rounded_full()
                .bg_linear_to_r()
                .gradient_from(move || theme().primary)
                .gradient_to(move || theme().muted_foreground)
        })
        // A 16 x 8 pill sitting in the rail.
        .thumb_style(|s| {
            s.w(px(16.0))
                .h(px(8.0))
                .rounded_full()
                .bg(move || theme().muted_foreground)
                .hover(|s| s.brightness(1.1))
                .active(|s| s.brightness(1.25))
        })
        .child(
            text(percent)
                .w(px(42.0))
                .text_right()
                .text_xs()
                .tabular_nums()
                .text_color(move || theme().muted_foreground),
        )
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { Slider } from "nsh/base";

function App() {
  const strength = signal(64);
  return (
    <Slider
      value={strength()}
      onChange={({ value }) => strength.set(value as number)}
      accessibilityLabel="Option strength"
      class="flex-row items-center gap-2"
      trackClass="h-2 flex-1 px-2 rounded-full bg-muted focus-within:ring-2 focus-within:ring-primary/36 focus-within:ring-offset-2 focus-within:ring-offset-background disabled:opacity-35"
      indicatorClass="h-full"
      rangeClass="-ml-2 rounded-full bg-linear-to-r from-primary via-primary to-muted-foreground"
      thumbClass="h-2 w-4 rounded-full bg-muted-foreground transition hover:brightness-110 active:brightness-125 focus:outline-none disabled:brightness-100 motion-reduce:transition-none"
      thumbStyle={{ boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.18), 0 0 0 1px rgba(0, 0, 0, 0.42)" }}
    >
      <Text class="w-[42px] text-right font-mono text-[11px] text-muted-foreground">{`${strength()}%`}</Text>
    </Slider>
  );
}

mount(App);
```

`Slider` 來自 [`nsh/base`](../modules/nsh-base.md)，即 Rust 中的 `nsh-base` crate。在 Rust 中，`slider()` 會建立一個滑桿，每個屬性有一個 setter（`.value(..)`、`.thumb_style(..)`），每個事件有一個監聽方法（`.on_change(..)`），滑桿本身有型別化的樣式方法，其標籤則使用 `.child(..)`。它的值是 `SliderValue`：`Single(f64)` 或 `Range(f64, f64)`。

<a id="value"></a>

## 值

值可以是一個數字，也可以是 `[start, end]`（有兩個滑塊的區間）；值的形態決定滑塊的數量。應用程式以 `value` 持有該值，並設定 `onChange` 所報告的值，與 `nsh/base` 的所有控制項一樣；或者以 `defaultValue` 把值交給滑桿自行管理，同樣可以收到變更通知。拖曳期間，滑塊和範圍區段會在同一影格內於原生層跟隨指標；指標放開後，會再次顯示應用程式的 `value`，即應用程式針對該次拖曳最後一次變更所設定的值；拖曳進行期間，螢幕閱讀器會隨之讀出拖曳過程中的值，否則讀出結束時的值。

```tsx
const price = signal<[number, number]>([200, 800]);

<Slider
  value={price()}
  onChange={({ value }) => price.set(value as [number, number])}
  onChangeEnd={({ value }) => save(value)}
  min={0}
  max={1000}
  step={10}
  accessibilityLabel="Maximum price"
  startAccessibilityLabel="Minimum price"
/>;
```

- `onChange` 會報告使用者要求的每個新值：按一下軌道時、拖曳的每一步、每次按鍵。每次報告都是一個新值。
- `onChangeEnd` 只會報告一次變更結束時的值：在設定了值的按壓或拖曳之後指標放開時，以及每次按鍵或螢幕閱讀器步進之後（每一次都是一次完整的變更）。請在此儲存或傳送該值。
- 值會貼齊 `step`，從 `min` 起算（`min={1} step={2}` 得出 1、3、5……），並保持在 `min` 與 `max` 之間；`max` 一定可以到達，因此當值域不是步長的整數倍時，最後一步會較短。`step={0}` 可接受任何值。
- 區間的滑塊不會交叉：被拖曳的滑塊會停在另一個滑塊處。若拖曳始於兩個滑塊處於同一值的位置，則移動能朝指標方向前進的那一個。
- 顯示的值是應用程式的值，並受 `min` 和 `max` 限制（區間的兩端按順序排列）；不在步長網格上的值會顯示在其實際位置，使用者下一次變更時才會貼齊。

<a id="props"></a>

## 屬性

| 屬性 | Rust | 類型 | 預設值 | 說明 |
|---|---|---|---|---|
| `value` | `.value(..)` | `number \| [number, number]` | 無 | 值（受控）：一個數字，或有兩個滑塊的區間。應用程式設定 `onChange` 所報告的值。 |
| `defaultValue` | `.default_value(..)` | `number \| [number, number]` | `0` | 在未設定 `value` 時的初始值；之後由滑桿自行保存值。 |
| `min` | `.min(..)` | `number` | `0` | 最小值。 |
| `max` | `.max(..)` | `number` | `100` | 最大值；低於 `min` 的值視為 `min`。 |
| `step` | `.step(..)` | `number` | `1` | 值貼齊的步長，從 `min` 起算；`0` 可接受任何值。 |
| `scale` | `.scale(..)` | `"linear" \| "logarithmic"` | `"linear"` | 值沿軌道的分佈方式：均勻分佈，或按數量級分佈（由 1 到 1000，走到三分之一處是 10）。對數刻度需要 `min` 大於 0；`min` 較低時則為線性。 |
| `axis` | `.axis(..)` | `"horizontal" \| "vertical"` | `"horizontal"` | 軌道的方向：`min` 位於起點（左側，在由右至左的版面中為右側），或位於底部。建立滑桿時讀取。 |
| `disabled` | `.disabled(..)` | `boolean` | `false` | 指標、鍵盤或螢幕閱讀器都無法更改值；`disabled:` 類別會套用到滑桿及其部件。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 無 | 螢幕閱讀器為滑塊讀出的內容（在區間中則為結束端的滑塊）。 |
| `startAccessibilityLabel` | `.start_accessibility_label(..)` | `string` | `accessibilityLabel` | 螢幕閱讀器為區間起始滑塊讀出的內容。 |
| `trackClass`、`trackStyle` | `.track_style(\|s\| ..)` | `string`、`StyleProp<ViewStyle>` | 無 | 軌道：接收按壓和拖曳的區域。 |
| `indicatorClass`、`indicatorStyle` | `.indicator_style(\|s\| ..)` | `string`、`StyleProp<ViewStyle>` | 無 | 指示器，即值所對應的軌條。 |
| `rangeClass`、`rangeStyle` | `.range_style(\|s\| ..)` | `string`、`StyleProp<ViewStyle>` | 無 | 範圍區段，從 `min` 到滑塊（區間則在兩個滑塊之間），由滑桿放置。 |
| `thumbClass`、`thumbStyle` | `.thumb_style(\|s\| ..)` | `string`、`StyleProp<ViewStyle>` | 無 | 每個滑塊，以其值為中心。 |
| `children` | `.child(..)` | `JSX.Element` | 無 | 軌道之後的內容：標籤、以文字顯示的值。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | 無 | 滑桿本身：包住軌道和標籤的直欄（或橫列）。 |

<a id="events"></a>

## 事件

| 事件 | Rust | 負載 | 時機 |
|---|---|---|---|
| `onChange` | `.on_change(\|value: &SliderValue\| ..)` | `{ value: number \| [number, number] }` | 使用者要求新值：按一下軌道、拖曳的每一步、按鍵、螢幕閱讀器的增加或減少。 |
| `onChangeEnd` | `.on_change_end(\|value: &SliderValue\| ..)` | `{ value: number \| [number, number] }` | 變更結束：指標放開、按鍵或螢幕閱讀器的步進完成。每次變更一次。 |

<a id="parts"></a>

## 部件

| 部件 | 位於 | 樣式設定 |
|---|---|---|
| 滑桿 | | `class`、`style` |
| 軌道 | 滑桿內，第一個 | `trackClass`、`trackStyle` |
| 指示器 | 軌道內 | `indicatorClass`、`indicatorStyle` |
| 範圍區段 | 指示器內，按值放置 | `rangeClass`、`rangeStyle` |
| 滑塊（區間有兩個） | 指示器內，以其值為中心 | `thumbClass`、`thumbStyle` |
| 標籤 | 滑桿內，位於軌道之後 | 其本身的元素（`children`） |

軌道接收按壓和拖曳。指示器的長度就是值域，`min` 位於其起始邊緣（垂直時位於底部）；滑桿會把範圍區段和滑塊放在指示器上，滑塊無論大小，都以其值為中心。有兩種排版方式：

- 軌道就是軌條（上面的範例）：`h-2 px-2 rounded-full bg-muted` 配合 `h-full` 指示器。內距讓滑塊在兩端都保持在軌條之內，而範圍區段的 `-ml-2` 則讓填充從軌條本身的邊緣開始。
- 軌道是環繞軌條的一條帶狀區域，較高，方便手指在觸控螢幕上找到：`h-8 justify-center` 配合 `h-2 rounded-full` 指示器（垂直滑桿則使用 `w-8 items-center` 和 `w-2 h-full`）。

各部件顯示的狀態：

- 滑塊：`hover:` 為指標在其上方，`active:` 為被拖曳時，`focus:` 為擁有鍵盤焦點時，`disabled:`。
- 軌道：按壓並拖曳時為 `active:`；它是 `group`，因此指示器、範圍區段和滑塊會從它取得 `group-hover:` 和 `group-active:`。
- 每個部件：滑桿處於 `disabled:` 時亦同。

滑塊會隨值的變化而移動，並即時跟隨拖曳。滑塊各狀態的動態效果由應用程式決定（例如 `transition`，讓滑塊在 `hover:` 和 `active:` 時變亮），而 `motion-reduce:` 會讓要求減少動態效果的使用者看到靜止的效果。鍵盤焦點屬於滑塊：滑塊擁有焦點時，軌道上的 `focus-within:` 會為整條軌條加上焦點環，而滑塊的 `focus:outline-none` 會取代平台本身的焦點外框。

<a id="keyboard"></a>

## 鍵盤

在 macOS 和網頁上，每個滑塊都是鍵盤焦點（Tab）的停靠點，獲得焦點的滑塊支援 WAI-ARIA 的滑桿按鍵：

| 按鍵 | 作用 |
|---|---|
| 右方向鍵、上方向鍵 | 增加一步（垂直滑桿亦然）。 |
| 左方向鍵、下方向鍵 | 減少一步。 |
| Page Up、Page Down | 向上或向下移動值域的十分之一（沿刻度計算），至少一步。 |
| Home、End | 移到滑塊能到達的最低或最高處（區間的起始滑塊最高到結束滑塊處）。 |

在由右至左的版面中，水平滑桿由右側開始，其 `min` 位於右端：左方向鍵為增加一步，右方向鍵為減少一步，向左拖曳會提高值。垂直滑桿仍以右方向鍵和上方向鍵增加一步。

每個更改值的按鍵都會先報告 `onChange`，再報告 `onChangeEnd`。方向鍵和翻頁鍵按住時會重複。只有在沒有文字輸入框正在編輯時，按鍵才會傳到滑桿。

<a id="accessibility"></a>

## 無障礙功能

- 每個滑塊都是可調整元素（`"adjustable"`，在瀏覽器中為 slider），具有標籤、值以及可取的值：區間的起始端由 `min` 到結束端，結束端由起始端到 `max`，因此螢幕閱讀器可以讀取並設定兩者。值會以數字加上步長的小數位讀出（`2.5`）。
- 螢幕閱讀器的增加和減少動作（VoiceOver 的向上和向下滑動）會讓滑塊步進，與方向鍵相同。
- 對螢幕閱讀器而言，滑塊就是滑桿的元素，由 `accessibilityLabel` 命名（區間的起始端則由 `startAccessibilityLabel` 命名）；子項中的可見標籤會在其所在位置被讀出。
- 當 `disabled` 時，螢幕閱讀器會表示滑塊已變暗，且不接受任何動作。

標籤、角色和動作的一般說明，請參閱[無障礙功能](../docs/accessibility.md)。

<a id="platform-notes"></a>

## 平台備註

- 每個平台都會繪製應用程式所設定的樣式。按壓和拖曳由核心追蹤，適用於滑鼠、手寫筆或手指，而滑桿外圍的捲動檢視不會接管始於滑桿上的拖曳。
- 在 macOS 和網頁上，Tab 會在滑塊之間移動鍵盤焦點，獲得焦點的滑塊支援滑桿按鍵。
- 螢幕閱讀器：VoiceOver（iOS、macOS）和 TalkBack 可調整每個滑塊；UI Automation（Windows）、GTK 的無障礙功能（Linux）和瀏覽器（`role="slider"`、`aria-valuenow`、`aria-valuetext`）可取得其範圍和值。
