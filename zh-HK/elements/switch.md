---
title: "Switch"
description: "Switch 元件:一個開/關控制項,負責處理點按、鍵盤啟動、停用狀態,以及供螢幕閱讀器使用的角色與值,並提供可由應用程式自訂樣式的軌道與滑塊。"
group: base
demo: el-switch
---

# Switch

Switch 用來開啟或關閉某項設定,變更會立即生效。它負責行為:按壓、鍵盤啟用、停用狀態,以及供螢幕閱讀器使用的 switch 角色與其值。外觀則由應用程式決定:`Switch` 本身沒有顏色、尺寸、動態效果或標籤。它由一個軌道(track)與其內的滑塊(thumb)組成,接著是它的子元素(標籤),應用程式為每個部分設定樣式,並使用跟隨 switch 狀態的 `checked:` 和 `disabled:` 類別。

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

`Switch` 來自 [`nsh/base`](../modules/nsh-base.md),也就是 Rust 中的 `nsh-base` crate。值屬於應用程式:一次按壓會以 `onChange` 回報下一個值,而 switch 會顯示應用程式回傳的 `checked`。在 Rust 中,`switch()` 會建立一個 switch,每個屬性都有對應的 setter(`.checked(..)`、`.track_style(..)`),每個事件都有對應的監聽器(`.on_change(..)`),switch 本身使用型別化的樣式方法,其標籤則使用 `.child(..)`;各部分的樣式可使用跟隨 switch 的狀態方法(`.checked(..)`、`.disabled_style(..)`)。

<a id="props"></a>

## 屬性

| 屬性 | Rust | 型別 | 預設值 | 說明 |
|---|---|---|---|---|
| `checked` | `.checked(..)` | `boolean` | `false` | 開啟或關閉。按壓時以 `onChange` 回報下一個值;switch 會顯示應用程式回傳的值。 |
| `disabled` | `.disabled(..)` | `boolean` | `false` | 不接受按壓,也沒有按壓回饋;`disabled:` 樣式會套用於 switch 及其各部分,螢幕閱讀器會表示它呈現變暗狀態。 |
| `checkedStyle` | `.checked_style(\|s\| ..)` | `StyleProp<ViewStyle>` | 無 | switch 在 `checked` 且未停用時的樣式,以 `checked:` 類別表示。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 無 | 螢幕閱讀器所朗讀的內容:當子元素沒有文字可說明時,表示此 switch 開啟的是什麼。 |
| `trackClass`、`trackStyle` | `.track_style(\|s\| ..)` | `string`、`StyleProp<ViewStyle>` | 無 | 軌道,即滑塊移動所沿的部分。 |
| `thumbClass`、`thumbStyle` | `.thumb_style(\|s\| ..)` | `string`、`StyleProp<ViewStyle>` | 無 | 滑塊,位於軌道內。 |
| `hitSlop` | `.hit_slop(..)` | `number \| Partial<Edges>` | 無 | 超出邊界多遠的按壓仍然有效,單位為點(points):一個數字代表所有邊,或分別指定各邊。與 view 的 `hitSlop` 相同。 |
| `children` | `.child(..)` | `JSX.Element` | 無 | 軌道之後的內容:標籤,螢幕閱讀器會朗讀它。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | 無 | switch 本身:軌道與標籤所在的那一列。 |
| `activeStyle`、`hoverStyle`、`focusStyle`、`disabledStyle` | `.active(\|s\| ..)`、`.hover(..)`、`.focus(..)`、`.disabled_style(..)` | `StyleProp<ViewStyle>` | 無 | switch 在被按壓、懸停、取得焦點或停用時的樣式,以 `<state>:` 類別表示。 |

<a id="events"></a>

## 事件

| 事件 | Rust | 說明 |
|---|---|---|
| `onChange` | `.on_change(\|checked: &bool\| ..)` | switch 被按壓:包括輕點、點擊、在取得鍵盤焦點時按下 Space 或 Return,或螢幕閱讀器的啟用操作。它會以 `checked` 回報 switch 要求的值,也就是與目前 `checked` 相反的值。 |

停用的 switch 不會回報任何事件。

<a id="parts"></a>

## 組成部分

| 部分 | 位置 | 樣式設定方式 | 狀態 |
|---|---|---|---|
| switch | | `class`、`style` | `checked:`、`disabled:`、`active:`、`hover:`、`focus:`(或 `checkedStyle`、`disabledStyle` 等) |
| 軌道 | switch 內,最前面 | `trackClass`、`trackStyle` | `checked:`、`disabled:` 跟隨 switch |
| 滑塊 | 軌道內 | `thumbClass`、`thumbStyle` | `checked:`、`disabled:` 跟隨 switch |
| 標籤 | switch 內,位於軌道之後 | 自己的元素(`children`) | switch 的 `class` 上帶有 `group` 的 `group-checked:` 及其他 `group-*:` 變體 |

滑塊透過它自己的 `checked:` 樣式移動:使用位移(`checked:translate-x-5`),或使用邊距,或使用軌道的對齊方式(軌道上的 `checked:justify-end`)。`transition-*` 類別會以原生方式為變化加上動畫。若要將標籤放在軌道之前,請反轉該列的排列:`class="flex-row-reverse justify-between"`。

<a id="disabled"></a>

## 停用狀態

停用的 switch 不接受按壓,螢幕閱讀器會將它宣告為變暗狀態。它的 `disabled:` 類別,以及其軌道與滑塊的對應類別,會覆蓋它們的 `checked:` 類別而生效:

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

## 使用 hitSlop 的小型目標

沒有標籤的 switch 可能比手指還小。`hitSlop` 會讓落在它附近的按壓也算數,範圍為每一邊向外延伸的點數,且不會改變它的版面配置或外觀:可以用一個數字代表所有邊,或分別指定各邊(`{ top: 8, bottom: 8 }`),寫法與 [view 的 `hitSlop`](./index.md#presses-and-feedback) 相同。

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

- 對螢幕閱讀器而言,switch 是單一元素,角色為 `"switch"`,並帶有它的值(開啟或關閉);軌道與滑塊都是它的一部分。它的標籤是其子元素的文字;若沒有子元素文字,請提供 `accessibilityLabel`。
- `disabled` 會依各平台的方式宣告(VoiceOver、TalkBack、UI Automation、瀏覽器的無障礙樹)。
- 在 macOS 與 web 上,switch 是鍵盤焦點的停駐點:可用 Tab 移到它,用 Space 和 Return 切換它,並由 `focus:` 樣式顯示焦點所在位置。

關於標籤、角色與宣告的一般說明,請參閱[無障礙](../docs/accessibility.md)。

<a id="platform-notes"></a>

## 平台說明

- iOS、Android 與 Mac Catalyst:按壓指的是在 switch 上結束的輕點,包含其標籤。
- 桌面平台(macOS、Windows、Linux、GPUI)與 web:按壓指的是點擊。在 macOS 與 web 上,Space 和 Return 也會切換取得鍵盤焦點的 switch。
- 每個平台都會繪製應用程式所設定的樣式;滑塊依照應用程式的樣式與轉場設定移動。
