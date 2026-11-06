---
title: "Checkbox"
description: "Checkbox 元件:一個可處於勾選、未勾選或不確定狀態的控制項,負責處理按壓、鍵盤啟動、停用狀態,以及供螢幕閱讀器使用的角色和數值,並提供可由應用程式自行設定樣式和標記的指示器。"
group: base
demo: el-checkbox
source_hash: c31b1f22eacafd92
---


# Checkbox

checkbox 用來選取一個選項、清單中的一個項目，或全部項目。它的狀態可以是已勾選、未勾選或不確定（兩者皆非，例如對部分選取結果進行「全選」）。它負責處理行為：按下、鍵盤啟動、停用狀態，以及供螢幕閱讀器使用的 checkbox 角色及其值。外觀則由應用程式決定：`Checkbox` 本身沒有方框、標記、顏色、尺寸或標籤。它由指示器（方框，內含應用程式提供的標記）及其後的子元素（標籤）組成，應用程式以 `checked:`、`indeterminate:` 和 `disabled:` class 為各部分設定樣式，這些 class 會跟隨 checkbox 的狀態。

```rust tabs
use nsh_base::{checkbox, theme};
use nsh_core::prelude::*;

fn notify() -> impl IntoElement {
    let on = signal(false);
    checkbox()
        .checked(on)
        .on_change(move |next: &bool| on.set(*next))
        .flex_row()
        .items_center()
        .gap_2()
        .indicator_style(|s| {
            s.size(px(20.0))
                .items_center()
                .justify_center()
                .rounded_md()
                .border_2()
                .border_color(move || theme().border)
                .transition_colors()
                .checked(|s| s.bg(move || theme().primary).border_color(move || theme().primary))
        })
        .indicator(text(move || if on.get() { "✓" } else { "" }).text_color(move || theme().primary_foreground))
        .child(text("Notify me"))
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { Checkbox } from "nsh/base";

function App() {
  const on = signal(false);
  return (
    <Checkbox
      checked={on()}
      onChange={({ checked }) => on.set(checked)}
      class="flex-row items-center gap-2"
      indicatorClass="size-5 items-center justify-center rounded-md border-2 border-border transition-colors checked:border-primary checked:bg-primary"
      indicator={<Text class="text-primary-foreground">{on() ? "✓" : ""}</Text>}
    >
      <Text>Notify me</Text>
    </Checkbox>
  );
}

mount(App);
```

`Checkbox` 來自 [`nsh/base`](../modules/nsh-base.md)，即 Rust 中的 `nsh-base` crate。值由應用程式持有：按下時會透過 `onChange` 回報下一個值，而 checkbox 會顯示應用程式傳回的 `checked` 和 `indeterminate`。在 Rust 中，`checkbox()` 會建立一個 checkbox，每個 prop 各有一個 setter（`.checked(..)`、`.indicator_style(..)`），每個事件各有一個監聽器（`.on_change(..)`），checkbox 本身使用具型別的樣式方法，標籤則使用 `.child(..)`；指示器的樣式可使用跟隨 checkbox 狀態的狀態方法（`.checked(..)`、`.indeterminate(..)`、`.disabled_style(..)`）。

## Props

| 屬性 | Rust | 類型 | 預設值 | 說明 |
|---|---|---|---|---|
| `checked` | `.checked(..)` | `boolean` | `false` | 是否已勾選。按下時會透過 `onChange` 回報下一個值；checkbox 會顯示應用程式傳回的值。 |
| `indeterminate` | `.indeterminate(..)` | `boolean` | `false` | 既非已勾選也非未勾選，成立期間優先於 `checked`：螢幕閱讀器會將其讀作混合狀態，而按下時會要求變為已勾選。 |
| `disabled` | `.disabled(..)` | `boolean` | `false` | 不接受按下，也沒有按下回饋；`disabled:` 樣式會套用於 checkbox 及其指示器，螢幕閱讀器會讀作已變暗。 |
| `checkedStyle` | `.checked_style(\|s\| ..)` | `StyleProp<ViewStyle>` | 無 | checkbox 在已勾選且未停用時的樣式，以 `checked:` class 表示。 |
| `indeterminateStyle` | `.indeterminate_style(\|s\| ..)` | `StyleProp<ViewStyle>` | 無 | checkbox 在不確定且未停用時的樣式，以 `indeterminate:` class 表示。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 無 | 螢幕閱讀器讀出的內容：當子元素沒有文字說明時，用來表示該 checkbox 選取的對象。 |
| `role` | `.role(..)` | `AccessibilityRole` | `"checkbox"` | 當它屬於更具體的類型時，螢幕閱讀器所識別的用途（例如已勾選的選單項目：`"menuitem"`）。 |
| `indicatorClass`、`indicatorStyle` | `.indicator_style(\|s\| ..)` | `string`、`StyleProp<ViewStyle>` | 無 | 指示器，即顯示值的方框。 |
| `indicator` | `.indicator(..)` | `JSX.Element` | 無 | 指示器的內容：標記（勾號、橫線），由應用程式按其值決定顯示哪一個。 |
| `hitSlop` | `.hit_slop(..)` | `number \| Partial<Edges>` | 無 | 在範圍以外多遠的位置按下仍然有效，單位為點：可用一個數字套用於所有邊，或分別指定各邊。與 view 的 `hitSlop` 相同。 |
| `children` | `.child(..)` | `JSX.Element` | 無 | 指示器之後的內容：標籤，螢幕閱讀器會讀出它。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | 無 | checkbox 本身：包住指示器和標籤的一列。 |
| `activeStyle`、`hoverStyle`、`focusStyle`、`disabledStyle` | `.active(\|s\| ..)`、`.hover(..)`、`.focus(..)`、`.disabled_style(..)` | `StyleProp<ViewStyle>` | 無 | checkbox 在按下、懸停、取得焦點或停用時的樣式，以 `<state>:` class 表示。 |

## Events

| 事件 | Rust | 說明 |
|---|---|---|
| `onChange` | `.on_change(\|checked: &bool\| ..)` | checkbox 被按下：包括點按、點擊、在其取得鍵盤焦點時按 Space 或 Return，或螢幕閱讀器的啟動操作。它會以 `checked` 回報 checkbox 所要求的值：從未勾選和不確定變為 `true`，從已勾選變為 `false`。 |

已停用的 checkbox 不會回報任何事件。

## Parts

| 部分 | 位於 | 樣式設定方式 | 狀態 |
|---|---|---|---|
| checkbox | | `class`、`style` | `checked:`、`indeterminate:`、`disabled:`、`active:`、`hover:`、`focus:`（或 `checkedStyle`、`indeterminateStyle`、`disabledStyle`……） |
| 指示器 | checkbox 內，最前面 | `indicatorClass`、`indicatorStyle` | `checked:`、`indeterminate:`、`disabled:` 跟隨 checkbox |
| 標記 | 指示器內 | 其自身的元素（`indicator`） | `group-checked:`、`group-indeterminate:` 以及其他 `group-*:` 變體，配合 `group` 作用於 `indicatorClass` |
| 標籤 | checkbox 內，位於指示器之後 | 其自身的元素（`children`） | `group-*:` 變體，配合 `group` 作用於 checkbox 的 `class` |

標記屬於應用程式的內容，因此會顯示應用程式所決定的內容：已勾選時顯示勾號，不確定時顯示橫線，由應用程式所持有的值決定；或者同時放入兩個標記，再以 `group-checked:` / `group-indeterminate:` class 選擇顯示哪一個。

## Indeterminate

當只有部分項目被選取時，「全選」checkbox 會處於不確定狀態。按下時會要求變為已勾選，而應用程式會選取所有項目：

```tsx
const selected = signal<string[]>([]);
const all = () => selected().length === items.length;
const some = () => selected().length > 0 && !all();

<Checkbox
  checked={all()}
  indeterminate={some()}
  onChange={({ checked }) => selected.set(checked ? items.map((i) => i.id) : [])}
  class="flex-row items-center gap-2"
  indicatorClass="group size-5 items-center justify-center rounded-md border-2 border-border checked:border-primary checked:bg-primary indeterminate:border-primary indeterminate:bg-primary"
  indicator={
    <>
      <Text class="hidden text-primary-foreground group-checked:flex">✓</Text>
      <View class="hidden h-0.5 w-2.5 bg-primary-foreground group-indeterminate:flex" />
    </>
  }
>
  <Text>Select all</Text>
</Checkbox>
```

## Disabled

已停用的 checkbox 不接受按下，螢幕閱讀器會將其讀作已變暗。它及其指示器的 `disabled:` class 會生效，並優先於它們的 `checked:` 和 `indeterminate:` class：

```tsx
<Checkbox
  checked={on()}
  disabled={locked()}
  onChange={({ checked }) => on.set(checked)}
  class="flex-row items-center gap-2 disabled:opacity-50"
  indicatorClass="size-5 rounded-md border-2 border-border checked:border-primary checked:bg-primary disabled:border-border disabled:bg-muted"
>
  <Text>Share usage data</Text>
</Checkbox>
```

## A small target with hitSlop

沒有旁邊標籤的 checkbox（例如列表中某一行的選取方塊）可能比手指還小。`hitSlop` 可讓靠近它的按下操作也算有效，範圍為每一邊向外延伸的點數，而不會改變其版面或外觀：可用一個數字套用於所有邊，或分別指定各邊（`{ top: 8, bottom: 8 }`），做法與 [view 的 `hitSlop`](./index.md#presses-and-feedback) 相同。

```tsx
<Checkbox
  checked={selected()}
  hitSlop={12}
  accessibilityLabel="Select row"
  onChange={({ checked }) => selected.set(checked)}
  indicatorClass="size-4 rounded border border-border checked:bg-primary"
/>
```

## Accessibility

- 對螢幕閱讀器而言，checkbox 是單一元素，角色為 `"checkbox"`（或其 `role`），並帶有其值：已勾選、未勾選，或在不確定時為混合。指示器和標記都是它的組成部分。它的標籤是子元素的文字；若沒有文字，請提供 `accessibilityLabel`。
- `disabled` 會按各平台的方式朗讀（VoiceOver、TalkBack、UI Automation、瀏覽器的 accessibility tree）。
- 在 macOS 和 web 上，checkbox 是鍵盤焦點的停駐點：按 Tab 可移到它，按 Space 和 Return 可切換其狀態，而 `focus:` 樣式會顯示焦點所在位置。

有關標籤、角色和朗讀內容的一般說明，請參閱 [Accessibility](../docs/accessibility.md)。

## Platform notes

- iOS、Android 和 Mac Catalyst：按下是指在 checkbox（包括其標籤）上結束的點按。
- 桌面平台（macOS、Windows、Linux、GPUI）和 web：按下是指點擊。在 macOS 和 web 上，Space 和 Return 同樣可切換取得鍵盤焦點的 checkbox。
- 各平台都會繪製應用程式所設定樣式的內容：指示器、標記及其轉場效果。
