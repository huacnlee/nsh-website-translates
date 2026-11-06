---
title: "Checkbox"
description: "Checkbox 元件:一種可呈現已勾選、未勾選或不確定狀態的控制項,負責處理點按、鍵盤啟用、停用狀態,以及供螢幕閱讀器使用的角色與值,並提供由應用程式自行設定樣式與標記的指示器。"
group: base
demo: el-checkbox
---

# Checkbox

Checkbox 用來選取一個選項、清單中的一個項目，或全部項目。它的狀態為已勾選、未勾選或不確定（兩者皆非：在部分選取時的「全選」）。它負責行為：按壓、鍵盤啟用、停用狀態，以及供螢幕閱讀器使用的 checkbox 角色及其值。外觀則由應用程式決定：`Checkbox` 本身沒有方框、標記、顏色、尺寸或標籤。它由指示器（方框）與其內由應用程式提供的標記組成，接著是其子元素（標籤），應用程式以 `checked:`、`indeterminate:` 和 `disabled:` 類別為各部分設定樣式，這些類別會跟隨 checkbox 的狀態。

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

`Checkbox` 來自 [`nsh/base`](../modules/nsh-base.md)，即 Rust 中的 `nsh-base` crate。值由應用程式持有：按壓時以 `onChange` 回報下一個值，checkbox 則顯示應用程式回傳的 `checked` 與 `indeterminate`。在 Rust 中，`checkbox()` 會建立一個 checkbox，每個 prop 各有一個 setter（`.checked(..)`、`.indicator_style(..)`），每個事件各有一個監聽器（`.on_change(..)`），checkbox 本身使用型別化的樣式方法，其標籤則使用 `.child(..)`；指示器的樣式接受跟隨 checkbox 的狀態方法（`.checked(..)`、`.indeterminate(..)`、`.disabled_style(..)`）。

<a id="props"></a>

## 屬性

| 屬性 | Rust | 型別 | 預設值 | 說明 |
|---|---|---|---|---|
| `checked` | `.checked(..)` | `boolean` | `false` | 是否已勾選。按壓時以 `onChange` 回報下一個值；checkbox 會顯示應用程式回傳的值。 |
| `indeterminate` | `.indeterminate(..)` | `boolean` | `false` | 既非已勾選也非未勾選，成立期間優先於 `checked`：螢幕閱讀器會讀出為混合狀態，按壓時則要求變為已勾選。 |
| `disabled` | `.disabled(..)` | `boolean` | `false` | 不接受按壓，也沒有按壓回饋；`disabled:` 樣式會套用於 checkbox 及其指示器，螢幕閱讀器會讀出為暗淡。 |
| `checkedStyle` | `.checked_style(\|s\| ..)` | `StyleProp<ViewStyle>` | 無 | checkbox 在已勾選且未停用時的樣式，以 `checked:` 類別表示。 |
| `indeterminateStyle` | `.indeterminate_style(\|s\| ..)` | `StyleProp<ViewStyle>` | 無 | checkbox 在不確定且未停用時的樣式，以 `indeterminate:` 類別表示。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 無 | 螢幕閱讀器讀出的內容：當子元素沒有文字說明時，此 checkbox 所選取的對象。 |
| `role` | `.role(..)` | `AccessibilityRole` | `"checkbox"` | 當它有更具體的用途時，螢幕閱讀器所讀出的角色（已勾選的選單項目：`"menuitem"`）。 |
| `indicatorClass`、`indicatorStyle` | `.indicator_style(\|s\| ..)` | `string`、`StyleProp<ViewStyle>` | 無 | 指示器，即顯示值的方框。 |
| `indicator` | `.indicator(..)` | `JSX.Element` | 無 | 指示器的內容：標記（勾號、橫線），由應用程式依其值顯示。 |
| `hitSlop` | `.hit_slop(..)` | `number \| Partial<Edges>` | 無 | 超出其邊界多遠的按壓仍然有效，單位為點：所有邊使用同一個數字，或分別指定各邊。如同 view 的 `hitSlop`。 |
| `children` | `.child(..)` | `JSX.Element` | 無 | 指示器之後的內容：標籤，螢幕閱讀器會讀出。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | 無 | checkbox 本身：圍繞指示器與標籤的列。 |
| `activeStyle`、`hoverStyle`、`focusStyle`、`disabledStyle` | `.active(\|s\| ..)`、`.hover(..)`、`.focus(..)`、`.disabled_style(..)` | `StyleProp<ViewStyle>` | 無 | checkbox 在按下、懸停、取得焦點或停用時的樣式，以 `<state>:` 類別表示。 |

<a id="events"></a>

## 事件

| 事件 | Rust | 說明 |
|---|---|---|
| `onChange` | `.on_change(\|checked: &bool\| ..)` | checkbox 被按壓：點按、點擊、在取得鍵盤焦點時按 Space 或 Return，或螢幕閱讀器的啟用。它以 `checked` 回報 checkbox 所要求的值：從未勾選與不確定狀態為 `true`，從已勾選為 `false`。 |

已停用的 checkbox 不會回報任何事件。

<a id="parts"></a>

## 組成部分

| 部分 | 位於 | 樣式設定方式 | 狀態 |
|---|---|---|---|
| checkbox | | `class`、`style` | `checked:`、`indeterminate:`、`disabled:`、`active:`、`hover:`、`focus:`（或 `checkedStyle`、`indeterminateStyle`、`disabledStyle` 等） |
| 指示器 | checkbox 內，第一個 | `indicatorClass`、`indicatorStyle` | `checked:`、`indeterminate:`、`disabled:` 跟隨 checkbox |
| 標記 | 指示器內 | 自己的元素（`indicator`） | `group-checked:`、`group-indeterminate:` 及其他 `group-*:` 變體，搭配 `group` 於 `indicatorClass` |
| 標籤 | checkbox 內，位於指示器之後 | 自己的元素（`children`） | `group-*:` 變體，搭配 `group` 於 checkbox 的 `class` |

標記是應用程式的內容，因此顯示什麼由應用程式決定：已勾選時顯示勾號，不確定時顯示橫線，依應用程式持有的值來選擇；或同時放入兩個標記，由 `group-checked:` / `group-indeterminate:` 類別挑選要顯示的那一個。

## Indeterminate

當部分項目被選取時，「全選」checkbox 處於不確定狀態。按壓會要求變為已勾選，應用程式便選取所有項目：

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

<a id="disabled"></a>

## 停用

已停用的 checkbox 不接受按壓，螢幕閱讀器會將其讀出為暗淡。它的 `disabled:` 類別與其指示器的類別都會套用，並優先於其 `checked:` 與 `indeterminate:` 類別：

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

<a id="a-small-target-with-hitslop"></a>

## 使用 hitSlop 放大點擊目標

旁邊沒有標籤的 checkbox（例如列的選取方框）可能比手指還小。`hitSlop` 讓落在其附近的按壓也能生效，範圍以各邊之外的點數表示，且不會改變其版面配置或外觀：所有邊使用同一個數字，或分別指定各邊（`{ top: 8, bottom: 8 }`），與 [view 的 `hitSlop`](./index.md#presses-and-feedback) 接受的方式相同。

```tsx
<Checkbox
  checked={selected()}
  hitSlop={12}
  accessibilityLabel="Select row"
  onChange={({ checked }) => selected.set(checked)}
  indicatorClass="size-4 rounded border border-border checked:bg-primary"
/>
```

<a id="accessibility"></a>

## 無障礙

- 對螢幕閱讀器而言，checkbox 是單一元素，角色為 `"checkbox"`（或其 `role`），並帶有其值：已勾選、未勾選，或在不確定時為混合。指示器與標記都是它的一部分。其標籤是子元素的文字；若沒有文字，請提供 `accessibilityLabel`。
- `disabled` 會依各平台自身的方式播報（VoiceOver、TalkBack、UI Automation、瀏覽器的無障礙樹）。
- 在 macOS 與 web 上，checkbox 是鍵盤焦點的停駐點：Tab 可以到達，Space 與 Return 可以切換，`focus:` 樣式會顯示焦點所在。

關於標籤、角色與播報的一般說明，請參閱 [無障礙](../docs/accessibility.md)。

<a id="platform-notes"></a>

## 平台備註

- iOS、Android 與 Mac Catalyst：按壓是結束於 checkbox（包含其標籤）上的點按。
- 桌面平台（macOS、Windows、Linux、GPUI）與 web：按壓是點擊。在 macOS 與 web 上，Space 與 Return 也會切換擁有鍵盤焦點的 checkbox。
- 每個平台都會繪製應用程式所設定樣式的內容：指示器、標記及其轉場。
