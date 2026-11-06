---
title: "Radio"
description: "Radio 與 RadioGroup:一組讓使用者只能選擇其中一項的選項。每個 Radio 負責處理按下操作、鍵盤啟用、停用狀態,以及供螢幕閱讀器使用的角色和勾選狀態;RadioGroup 則是整組選項的集合;外觀與數值由應用程式自行決定。"
group: base
demo: el-radio
source_hash: 051314109ae3d0b2
---


# Radio

Radio 讓用戶從一組選項中只揀選一個，例如方案、排序方式或主題。每個 `Radio` 負責一個選項的行為：按下、鍵盤啟動、停用狀態，以及供螢幕閱讀器使用的 radio 角色和其勾選狀態。包住它們的 `RadioGroup` 就是整組選項，螢幕閱讀器會將它們當作一個群組讀出。外觀由應用程式決定：radio 本身沒有圓圈、圓點、顏色、尺寸或標籤。它的子元素就是應用程式的指示器和標籤，而 radio 上的 `checked:` 類別，或其內部元素上的 `group-checked:` 類別，會跟隨它的狀態。

```rust tabs
use nsh_base::{radio, radio_group, theme};
use nsh_core::prelude::*;

fn plans() -> impl IntoElement {
    let plan = signal("basic");
    let option = move |value: &'static str, label: &'static str| {
        let checked = move || plan.get() == value;
        radio()
            .checked(checked)
            .on_change(move |_: &bool| plan.set(value))
            .flex_row()
            .items_center()
            .gap_2()
            .child(
                view()
                    .size(px(20.0))
                    .items_center()
                    .justify_center()
                    .rounded_full()
                    .border_2()
                    .border_color(move || theme().border)
                    .child(
                        view()
                            .size(px(10.0))
                            .rounded_full()
                            .bg(move || theme().primary)
                            .opacity(move || if checked() { 1.0_f32 } else { 0.0 }),
                    ),
            )
            .child(text(label))
    };
    radio_group()
        .gap_3()
        .child(option("basic", "Basic"))
        .child(option("pro", "Pro"))
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { Radio, RadioGroup } from "nsh/base";

function App() {
  const plan = signal("basic");
  const option = (value: string, label: string) => (
    <Radio
      checked={plan() === value}
      onChange={() => plan.set(value)}
      class="group flex-row items-center gap-2"
    >
      <View class="size-5 items-center justify-center rounded-full border-2 border-border group-checked:border-primary">
        <View class="size-2.5 rounded-full group-checked:bg-primary" />
      </View>
      <Text>{label}</Text>
    </Radio>
  );
  return (
    <RadioGroup class="gap-3">
      {option("basic", "Basic")}
      {option("pro", "Pro")}
    </RadioGroup>
  );
}

mount(App);
```

`Radio` 和 `RadioGroup` 來自 [`nsh/base`](../modules/nsh-base.md)，即 Rust 中的 `nsh-base` crate。值由應用程式持有，群組本身不保存任何值。每個 radio 都會被告知自己是否已勾選；按下未勾選的 radio 時會回報 `onChange({ checked: true })`，由應用程式設定其值，而每個 radio 都會顯示應用程式傳回的 `checked`。在 Rust 中，`radio()` 和 `radio_group()` 用來建立它們，每個 prop 有一個 setter（`.checked(..)`），每個事件有一個 listener（`.on_change(..)`），並提供有型別的樣式方法，以及用於內容的 `.child(..)`。

## Props

### Radio

| Prop | Rust | 型別 | 預設值 | 說明 |
|---|---|---|---|---|
| `checked` | `.checked(..)` | `boolean` | `false` | 是否已勾選。按下未勾選的 radio 會回報 `true`，並附帶 `onChange`；radio 顯示應用程式傳回的值。 |
| `disabled` | `.disabled(..)` | `boolean` | `false` | 不接受按下，也沒有按下回饋；`disabled:` 樣式會生效，螢幕閱讀器會讀出它已變暗。 |
| `checkedStyle` | `.checked_style(\|s\| ..)` | `StyleProp<ViewStyle>` | 無 | radio 在已勾選且未停用時的樣式，以 `checked:` 類別表示。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 無 | 螢幕閱讀器讀出的內容：該選項；當其子元素沒有文字說明時使用。 |
| `hitSlop` | `.hit_slop(..)` | `number \| Partial<Edges>` | 無 | 在邊界以外多遠的按下仍會計算，單位為點：所有邊使用同一個數字，或分別指定各邊。與 view 的 `hitSlop` 相同。 |
| `children` | `.child(..)` | `JSX.Element` | 無 | 應用程式的指示器和標籤，螢幕閱讀器會讀出它們。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | 無 | radio 本身：圍繞指示器和標籤的一整行。 |
| `activeStyle`、`hoverStyle`、`focusStyle`、`disabledStyle` | `.active(\|s\| ..)`、`.hover(..)`、`.focus(..)`、`.disabled_style(..)` | `StyleProp<ViewStyle>` | 無 | radio 在按下、懸停、聚焦或停用時的樣式，以 `<state>:` 類別表示。 |

### RadioGroup

| Prop | Rust | 型別 | 預設值 | 說明 |
|---|---|---|---|---|
| `children` | `.child(..)` | `JSX.Element` | 無 | 這組選項的 radio，以及應用程式在它們之間排版的任何內容。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | 無 | 群組的排版和外觀：預設為直向排列，使用 `flex-row` 則為橫向排列。 |

<a id="events"></a>

## 事件

| 事件 | Rust | 說明 |
|---|---|---|
| `onChange`（`Radio`） | `.on_change(\|checked: &bool\| ..)` | 未勾選的 radio 被按下：包括輕按、點按、在它擁有鍵盤焦點時按 Space 或 Return、螢幕閱讀器的啟動操作，或是其群組的方向鍵將鍵盤焦點移到它身上。它會要求被勾選，所以 `checked` 為 `true`。此事件在任何改變發生之前執行：radio 顯示應用程式傳回的 `checked`。 |

已勾選的 radio 會維持勾選，也不會回報任何事件，因為 radio 無法自行取消勾選；已停用的 radio 同樣不會回報任何事件。

<a id="parts"></a>

## 組成部分

| 部分 | 位於 | 樣式來源 | 狀態 |
|---|---|---|---|
| 群組 | | `RadioGroup` 的 `class`、`style` | |
| radio | 群組內 | `Radio` 的 `class`、`style` | `checked:`、`disabled:`、`active:`、`hover:`、`focus:`（或 `checkedStyle`、`disabledStyle` 等） |
| 指示器和標籤 | radio 內 | 它們自己的元素（`children`） | `group-checked:`、`group-disabled:`，以及在 radio 的 `class` 上設定 `group` 後的其他 `group-*:` 變體 |

指示器是應用程式的內容：可以是帶圓點的圓環、剔號，或高亮的卡片。在 radio 的 `class` 上設定 `group` 後，它的 `group-checked:` 類別會在 radio 已勾選時顯示圓點。

<a id="disabled"></a>

## 停用

已停用的 radio 不接受按下，螢幕閱讀器會讀出它已變暗。它的 `disabled:` 類別會覆蓋 `checked:` 類別，而其內部的 `group-disabled:` 類別也會跟隨：

```tsx
<Radio
  checked={plan() === "team"}
  disabled={!eligible()}
  onChange={() => plan.set("team")}
  class="group flex-row items-center gap-2 disabled:opacity-50"
>
  <View class="size-5 items-center justify-center rounded-full border-2 border-border group-checked:border-primary">
    <View class="size-2.5 rounded-full group-checked:bg-primary" />
  </View>
  <Text>Team</Text>
</Radio>
```

<a id="a-small-target-with-hitslop"></a>

## 使用 hitSlop 擴大細小的目標

旁邊沒有標籤的 radio（例如表格列中的一個圓點）可能比手指還要小。`hitSlop` 令落在它附近的按下也會計算，範圍是每邊向外延伸的點數，而不會改變它的版面或外觀：所有邊使用同一個數字，或分別指定各邊（`{ top: 8, bottom: 8 }`），用法與 [view 的 `hitSlop`](./index.md#presses-and-feedback) 相同。

```tsx
<Radio
  checked={plan() === "team"}
  hitSlop={12}
  accessibilityLabel="Team"
  onChange={() => plan.set("team")}
  class="group size-5 items-center justify-center rounded-full border-2 border-border group-checked:border-primary"
>
  <View class="size-2.5 rounded-full group-checked:bg-primary" />
</Radio>
```

<a id="accessibility"></a>

## 無障礙

- 對螢幕閱讀器而言，radio 是單一元素，角色為 `"radio"`，並帶有它的狀態：已勾選與否，以及勾選時的已選取狀態，因為有些螢幕閱讀器讀取前者，有些則讀取後者（UI Automation 的 radio 屬於選取項目）。它的指示器和標籤都是它的一部分；它的標籤是其子元素的文字，或是 `accessibilityLabel`。
- `RadioGroup` 的角色為 `"radiogroup"`：螢幕閱讀器會將其內的 radio 當作一組讀出，而每個 radio 仍然是獨立的元素。
- `disabled` 會按各平台自身的方式讀出（VoiceOver、TalkBack、UI Automation、瀏覽器的無障礙樹）。
- 在 macOS 和 web 上，`RadioGroup` 是鍵盤焦點的一個停駐點，方向鍵可在其 radio 之間移動並勾選它們（見下文）。

有關標籤、角色和朗讀內容的一般說明，請參閱[無障礙](../docs/accessibility.md)。

<a id="keyboard"></a>

## 鍵盤

在 macOS 和 web 上，Tab 可以到達接受按下的 view，`RadioGroup` 遵循 [WAI-ARIA radio group 模式](https://www.w3.org/WAI/ARIA/apg/patterns/radio/)：

| 按鍵 | 作用 |
|---|---|
| Tab、Shift+Tab | 在已勾選的 radio 處進入群組（若沒有已勾選的，則進入第一個未停用的 radio），並一步離開群組。 |
| Down、Right | 將焦點移到下一個 radio（由最後一個移到第一個），並勾選它。 |
| Up、Left | 將焦點移到上一個 radio（由第一個移到最後一個），並勾選它。 |
| Space | 勾選擁有焦點的 radio。 |

方向鍵會跳過已停用的 radio；它們移到的 radio 會以 `onChange` 要求被勾選，再由應用程式將它勾選。在由右至左的版面中，Left 和 Right 的作用互換：Left 移到下一個 radio，Right 移到上一個；Up 和 Down 則維持不變。`focus:` 樣式會顯示焦點所在位置。不在 `RadioGroup` 內的 `Radio` 本身就是一個獨立的停駐點，可以用 Tab 到達，並以 Space 和 Return 勾選。

<a id="platform-notes"></a>

## 平台備註

- iOS、Android 和 Mac Catalyst：按下指在 radio 上結束的輕按，包括其標籤範圍。
- 桌面平台（macOS、Windows、Linux、GPUI）和 web：按下指點按。在 macOS 和 web 上，Space 和 Return 也可以勾選擁有鍵盤焦點的 radio，方向鍵則可移動焦點（[鍵盤](#keyboard)）。
- 每個平台都會繪製應用程式所設定的樣式：指示器、標籤及其過渡效果。
