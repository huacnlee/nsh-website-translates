---
title: "Slider"
description: "Slider 元件：沿著軌道選取單一數值或由兩個數值構成的範圍，支援在觸控螢幕與滑鼠上的點按與拖曳，每個滑塊皆提供 WAI-ARIA 的 slider 按鍵操作以及供螢幕閱讀器使用的數值，並可由應用程式自訂軌道、指示器、範圍與滑塊的樣式。"
group: base
demo: el-slider
---

# Slider

滑桿讓使用者沿著軌道選取一個值(例如音量、亮度),或是選取由兩個值構成的區間,每個值各有一個滑塊(例如價格區間)。滑桿自行負責其行為:在軌道上按下時,會將較近的滑塊移到該處;滑塊會跟隨拖曳,無論使用滑鼠或手指;值會對齊到 `step`;每個滑塊都是鍵盤焦點的一個停駐點,可用方向鍵移動,對螢幕閱讀器而言則是可調整的元素,並各自帶有自己的值。外觀由應用程式決定:`Slider` 本身沒有顏色、尺寸、圓角或動態效果。它由軌道組成,軌道內有指示條,範圍區段與滑塊位於指示條上,接著是其子元素(標籤、以文字呈現的值),由應用程式為各部分設定樣式。

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

`Slider` 來自 [`nsh/base`](../modules/nsh-base.md),即 Rust 中的 `nsh-base` crate。在 Rust 中,`slider()` 會建立一個滑桿,每個屬性有對應的 setter(`.value(..)`、`.thumb_style(..)`),每個事件有對應的監聽方法(`.on_change(..)`),滑桿本身使用具型別的樣式方法,其標籤則使用 `.child(..)`。其值為 `SliderValue`:`Single(f64)` 或 `Range(f64, f64)`。

<a id="value"></a>

## 值

值可以是一個數字,或是具有兩個滑塊的 `[start, end]` 區間;值的形態決定滑塊的數量。應用程式可以透過 `value` 擁有該值,並設定 `onChange` 所回報的值,與 `nsh/base` 的所有控制項相同;也可以透過 `defaultValue` 將值交給滑桿管理,同樣能收到變更通知。拖曳期間,滑塊與範圍區段會在同一個影格中以原生方式跟隨指標;指標抬起後,畫面會再次顯示應用程式的 `value`,也就是應用程式針對該次拖曳最後一次變更所設定的值;拖曳進行時,螢幕閱讀器會即時聽到拖曳過程中的值,否則聽到的是結束時的值。

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

- `onChange` 會回報使用者要求的每一個新值:在軌道上按下時、拖曳的每一個步進、每次按鍵。每次回報都是一個新值。
- `onChangeEnd` 會回報該次變更結束時的值,且只回報一次:在設定了值的按下或拖曳之後指標抬起時,以及每次按鍵或螢幕閱讀器步進之後(每一次都是一次完整的變更)。請在此儲存或傳送該值。
- 值會對齊到 `step`,從 `min` 開始計算(`min={1} step={2}` 會得到 1、3、5……),並保持在 `min` 與 `max` 之間;`max` 一律可以到達,因此當範圍不是步進的整數倍時,最後一步會較短。`step={0}` 可接受任何值。
- 區間的兩個滑塊不會交叉:被拖曳的滑塊會停在另一個滑塊處。若拖曳從兩個位於同一值的滑塊上開始,則移動能朝指標方向前進的那一個。
- 顯示的值是應用程式提供的值,並受 `min` 與 `max` 限制(區間的兩端會依序排列);不在步進網格上的值會顯示在其實際位置,使用者的下一次變更才會對齊。

<a id="props"></a>

## 屬性

| 屬性 | Rust | 型別 | 預設值 | 說明 |
|---|---|---|---|---|
| `value` | `.value(..)` | `number \| [number, number]` | 無 | 值(受控):一個數字,或具有兩個滑塊的區間。應用程式設定 `onChange` 所回報的值。 |
| `defaultValue` | `.default_value(..)` | `number \| [number, number]` | `0` | 在未設定 `value` 時的初始值;此時滑桿會自行保存值。 |
| `min` | `.min(..)` | `number` | `0` | 最小值。 |
| `max` | `.max(..)` | `number` | `100` | 最大值;若低於 `min`,則為 `min`。 |
| `step` | `.step(..)` | `number` | `1` | 值對齊的步進,從 `min` 開始計算;`0` 可接受任何值。 |
| `scale` | `.scale(..)` | `"linear" \| "logarithmic"` | `"linear"` | 值在軌道上的分佈方式:均勻分佈,或依數量級分佈(從 1 到 1000,三分之一處為 10)。對數刻度需要 `min` 大於 0;若 `min` 更低,則為線性。 |
| `axis` | `.axis(..)` | `"horizontal" \| "vertical"` | `"horizontal"` | 軌道的方向:`min` 位於起點(左側,在由右至左的版面中則為右側),或位於底部。在建立滑桿時讀取。 |
| `disabled` | `.disabled(..)` | `boolean` | `false` | 指標、鍵盤或螢幕閱讀器皆無法變更值;`disabled:` 類別會套用到滑桿及其各部分。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 無 | 螢幕閱讀器為滑塊朗讀的內容(在區間上則是結束端滑塊)。 |
| `startAccessibilityLabel` | `.start_accessibility_label(..)` | `string` | `accessibilityLabel` | 螢幕閱讀器為區間起始滑塊朗讀的內容。 |
| `trackClass`、`trackStyle` | `.track_style(\|s\| ..)` | `string`、`StyleProp<ViewStyle>` | 無 | 軌道:接收按下與拖曳的區域。 |
| `indicatorClass`、`indicatorStyle` | `.indicator_style(\|s\| ..)` | `string`、`StyleProp<ViewStyle>` | 無 | 指示條,即值所對應的軌條。 |
| `rangeClass`、`rangeStyle` | `.range_style(\|s\| ..)` | `string`、`StyleProp<ViewStyle>` | 無 | 範圍區段,從 `min` 到滑塊(在區間中則位於兩個滑塊之間),由滑桿負責定位。 |
| `thumbClass`、`thumbStyle` | `.thumb_style(\|s\| ..)` | `string`、`StyleProp<ViewStyle>` | 無 | 每個滑塊,以其值為中心。 |
| `children` | `.child(..)` | `JSX.Element` | 無 | 軌道之後的內容:標籤、以文字呈現的值。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | 無 | 滑桿本身:包住軌道與標籤的直欄(或橫列)。 |

<a id="events"></a>

## 事件

| 事件 | Rust | 負載 | 時機 |
|---|---|---|---|
| `onChange` | `.on_change(\|value: &SliderValue\| ..)` | `{ value: number \| [number, number] }` | 使用者要求新值:在軌道上按下、拖曳的一個步進、一次按鍵、螢幕閱讀器的增加或減少。 |
| `onChangeEnd` | `.on_change_end(\|value: &SliderValue\| ..)` | `{ value: number \| [number, number] }` | 變更結束:指標抬起、一次按鍵或螢幕閱讀器的步進完成。每次變更只觸發一次。 |

<a id="parts"></a>

## 組成部分

| 部分 | 位置 | 樣式設定 |
|---|---|---|
| 滑桿 | | `class`、`style` |
| 軌道 | 位於滑桿內,排在最前 | `trackClass`、`trackStyle` |
| 指示條 | 位於軌道內 | `indicatorClass`、`indicatorStyle` |
| 範圍區段 | 位於指示條內,依值定位 | `rangeClass`、`rangeStyle` |
| 滑塊(區間有兩個) | 位於指示條內,以其值為中心 | `thumbClass`、`thumbStyle` |
| 標籤 | 位於滑桿內,排在軌道之後 | 其自身的元素(`children`) |

軌道接收按下與拖曳。指示條的長度即值的範圍,從其前緣的 `min` 開始(垂直時則從底部開始);滑桿會將範圍區段與滑塊放置在指示條上,無論滑塊大小為何,都以其值為中心。有兩種配置方式:

- 軌道本身就是軌條(如上方範例):`h-2 px-2 rounded-full bg-muted` 搭配 `h-full` 指示條。內距會讓滑塊在兩端都保持在軌條之內,而範圍區段的 `-ml-2` 則讓填色從軌條自身的邊緣開始。
- 軌道是環繞軌條的一個帶狀區域,高度較大,讓手指在觸控螢幕上更容易點到:`h-8 justify-center` 搭配 `h-2 rounded-full` 指示條(垂直滑桿則為 `w-8 items-center` 與 `w-2 h-full`)。

各部分會呈現的狀態:

- 滑塊:指標位於其上時為 `hover:`,被拖曳時為 `active:`,具有鍵盤焦點時為 `focus:`,以及 `disabled:`。
- 軌道:在按下並拖曳期間為 `active:`;它是一個 `group`,因此指示條、範圍區段與滑塊會由它取得 `group-hover:` 與 `group-active:`。
- 每個部分:滑桿處於 `disabled:` 時,各部分也處於該狀態。

滑塊會隨值的變化而移動,並立即跟隨拖曳。滑塊各狀態的動態效果由應用程式決定(例如讓滑塊在 `hover:` 與 `active:` 時變亮,可使用 `transition`),而 `motion-reduce:` 會讓要求減少動態效果的使用者看到靜止的畫面。鍵盤焦點屬於滑塊:當滑塊具有焦點時,軌道上的 `focus-within:` 會為整條軌條加上焦點環,而滑塊的 `focus:outline-none` 會取代平台本身的焦點外框。

<a id="keyboard"></a>

## 鍵盤

在 macOS 與網頁上,每個滑塊都是鍵盤焦點(Tab)的一個停駐點,取得焦點的滑塊可使用 WAI-ARIA 的滑桿按鍵:

| 按鍵 | 作用 |
|---|---|
| Right、Up | 增加一個步進(垂直滑桿上亦同)。 |
| Left、Down | 減少一個步進。 |
| Page Up、Page Down | 沿刻度增加或減少範圍的十分之一,至少為一個步進。 |
| Home、End | 移到滑塊所能到達的最低或最高值(區間的起始滑塊最高到其結束端)。 |

在由右至左的版面中,水平滑桿從右側開始,其 `min` 位於右端:Left 為增加一個步進,Right 為減少一個步進,向左拖曳則會提高值。垂直滑桿仍以 Right 與 Up 作為增加一個步進。

每個會改變值的按鍵都會先回報 `onChange`,再回報 `onChangeEnd`。方向鍵與翻頁鍵在按住時會重複觸發。只有在沒有文字輸入正在編輯時,按鍵才會傳到滑桿。

<a id="accessibility"></a>

## 無障礙

- 每個滑塊都是可調整的元素(`"adjustable"`,在瀏覽器中為 slider),帶有其標籤、其值,以及它可取的值:區間的起始滑塊從 `min` 到結束端,結束滑塊從起始端到 `max`,因此螢幕閱讀器可以讀取並設定兩者。朗讀的值為數字,並依步進的小數位數呈現(`2.5`)。
- 螢幕閱讀器的增加與減少動作(VoiceOver 的上下滑動)會讓滑塊步進,效果與方向鍵相同。
- 滑塊是螢幕閱讀器所見的滑桿元素,以 `accessibilityLabel` 命名(區間的起始滑塊則以 `startAccessibilityLabel` 命名);子元素中可見的標籤則會在其所在位置被朗讀。
- 在 `disabled` 時,螢幕閱讀器會說明滑塊已變暗,且滑塊不接受任何動作。

關於標籤、角色與動作的一般說明,請參閱[無障礙](../docs/accessibility.md)。

<a id="platform-notes"></a>

## 平台說明

- 每個平台都會繪製應用程式所設定的樣式。按下與拖曳是在核心中追蹤的,適用於滑鼠、觸控筆或手指,而滑桿周圍的捲動檢視不會接管從滑桿上開始的拖曳。
- 在 macOS 與網頁上,Tab 會在滑塊之間移動鍵盤焦點,取得焦點的滑塊可使用滑桿按鍵。
- 螢幕閱讀器:VoiceOver(iOS、macOS)與 TalkBack 可調整每個滑塊;UI Automation(Windows)、GTK 的無障礙功能(Linux)以及瀏覽器(`role="slider"`、`aria-valuenow`、`aria-valuetext`)則可取得其範圍與值。
