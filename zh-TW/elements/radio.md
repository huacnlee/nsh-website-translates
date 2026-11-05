---
title: "Radio"
description: "Radio 與 RadioGroup:一組讓使用者只能選擇其中一項的選項。每個 Radio 負責處理點按、鍵盤啟用、停用狀態,以及供螢幕閱讀器使用的角色與勾選狀態;RadioGroup 則是這些選項所組成的集合;外觀與值則由應用程式自行決定。"
group: base
demo: el-radio
source_hash: 051314109ae3d0b2
---

# Radio

Radio 提供一組選項，使用者只能從中選擇其中一個，例如方案、排序方式或主題。每個 `Radio` 負責單一選項的行為：按壓、鍵盤啟用、停用狀態，以及供螢幕閱讀器使用的 radio 角色與其勾選狀態。包在它們外層的 `RadioGroup` 就是整組選項，螢幕閱讀器會將其視為一個群組來朗讀。外觀由應用程式決定：radio 本身沒有圓圈、圓點、顏色、尺寸或標籤。它的子元素就是應用程式自己的指示器與標籤，radio 上的 `checked:` 類別，或其內部元素上的 `group-checked:` 類別，都會隨其狀態變化。

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

`Radio` 與 `RadioGroup` 來自 [`nsh/base`](../modules/nsh-base.md)，也就是 Rust 中的 `nsh-base` crate。值由應用程式持有，群組本身不保存任何值。每個 radio 都會被告知自己是否已勾選；按壓未勾選的 radio 時會回報 `onChange({ checked: true })`，由應用程式設定其值，而每個 radio 顯示的是應用程式回傳的 `checked`。在 Rust 中，使用 `radio()` 與 `radio_group()` 建立它們，每個 prop 都有對應的 setter（`.checked(..)`），每個事件都有對應的 listener（`.on_change(..)`），並提供具型別的樣式方法，以及用於設定內容的 `.child(..)`。

## Props

<a id="radio-1"></a>

### Radio

| Prop | Rust | 型別 | 預設值 | 說明 |
|---|---|---|---|---|
| `checked` | `.checked(..)` | `boolean` | `false` | 是否已勾選。按壓未勾選的 radio 時會回報 `true`，其值為 `onChange`；radio 顯示的是應用程式回傳的值。 |
| `disabled` | `.disabled(..)` | `boolean` | `false` | 不接受按壓，也沒有按壓回饋；會套用 `disabled:` 樣式，螢幕閱讀器會將其朗讀為已淡化。 |
| `checkedStyle` | `.checked_style(\|s\| ..)` | `StyleProp<ViewStyle>` | 無 | radio 在已勾選且未停用時的樣式，以 `checked:` 類別表示。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 無 | 螢幕閱讀器朗讀的內容：當其子元素沒有可表達該選項的文字時，用此 prop 說明該選項。 |
| `hitSlop` | `.hit_slop(..)` | `number \| Partial<Edges>` | 無 | 超出邊界多遠的按壓仍會被計入，單位為點：可用一個數字套用於所有邊，或分別指定各邊。與 view 的 `hitSlop` 相同。 |
| `children` | `.child(..)` | `JSX.Element` | 無 | 應用程式自己的指示器與標籤，螢幕閱讀器會朗讀其內容。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | 無 | radio 本身：包住指示器與標籤的那一列。 |
| `activeStyle`、`hoverStyle`、`focusStyle`、`disabledStyle` | `.active(\|s\| ..)`、`.hover(..)`、`.focus(..)`、`.disabled_style(..)` | `StyleProp<ViewStyle>` | 無 | radio 在被按壓、懸停、取得焦點或停用時的樣式，以 `<state>:` 類別表示。 |

### RadioGroup

| Prop | Rust | 型別 | 預設值 | 說明 |
|---|---|---|---|---|
| `children` | `.child(..)` | `JSX.Element` | 無 | 這組選項中的各個 radio，以及應用程式在它們之間排入的任何內容。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | 無 | 群組的版面配置與外觀：預設為直向排列，使用 `flex-row` 則為橫向排列。 |

<a id="events"></a>

## 事件

| 事件 | Rust | 說明 |
|---|---|---|
| `onChange`（`Radio`） | `.on_change(\|checked: &bool\| ..)` | 未勾選的 radio 被按壓：包括點選、點擊、在其取得鍵盤焦點時按 Space 或 Return、螢幕閱讀器的啟用操作，或是其群組的方向鍵將鍵盤焦點移到它身上。這表示它要求被勾選，因此 `checked` 為 `true`。此事件在任何變更發生之前執行：radio 顯示的是應用程式回傳的 `checked`。 |

已勾選的 radio 維持勾選且不回報任何事件，因為 radio 無法自行取消勾選；已停用的 radio 同樣不回報任何事件。

<a id="parts"></a>

## 組成部分

| 部分 | 位於 | 樣式來源 | 狀態 |
|---|---|---|---|
| 群組 | | `RadioGroup` 的 `class`、`style` | |
| radio | 群組內 | `Radio` 的 `class`、`style` | `checked:`、`disabled:`、`active:`、`hover:`、`focus:`（或 `checkedStyle`、`disabledStyle` 等） |
| 指示器與標籤 | radio 內 | 各自的元素（`children`） | `group-checked:`、`group-disabled:`，以及在 radio 的 `class` 上搭配 `group` 的其他 `group-*:` 變體 |

指示器是應用程式的內容：可以是帶圓點的圓環、勾號，或醒目標示的卡片。在 radio 的 `class` 上設定 `group` 後，其 `group-checked:` 類別會在 radio 已勾選時顯示圓點。

<a id="disabled"></a>

## 停用

已停用的 radio 不接受按壓，螢幕閱讀器會將其朗讀為已淡化。它的 `disabled:` 類別會覆蓋其 `checked:` 類別，其內部的 `group-disabled:` 類別也會隨之變化：

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

## 使用 hitSlop 放大小型目標

旁邊沒有標籤的 radio（例如表格列中的一個圓點）可能比手指還小。`hitSlop` 可讓落在其附近的按壓也被計入，範圍為每一邊向外延伸的點數，且不會改變其版面配置或外觀：可用一個數字套用於所有邊，或分別指定各邊（`{ top: 8, bottom: 8 }`），寫法與 [view 的 `hitSlop`](./index.md#presses-and-feedback) 相同。

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

- 對螢幕閱讀器而言，radio 是單一元素，角色為 `"radio"`，並帶有其狀態：是否已勾選，以及勾選時為已選取，因為有些螢幕閱讀器朗讀前者，有些則朗讀後者（UI Automation 的 radio 屬於選取項目）。它的指示器與標籤都是它的一部分；其標籤取自子元素的文字，或 `accessibilityLabel`。
- `RadioGroup` 的角色為 `"radiogroup"`：螢幕閱讀器會將其中的 radio 視為一組，但每個 radio 仍是各自獨立的元素。
- `disabled` 會依各平台自身的方式朗讀（VoiceOver、TalkBack、UI Automation、瀏覽器的無障礙樹）。
- 在 macOS 與 web 上，`RadioGroup` 是鍵盤焦點的單一停駐點，方向鍵可在其 radio 之間移動並勾選（見下文）。

關於標籤、角色與朗讀內容的一般說明，請參閱 [Accessibility](../docs/accessibility.md)。

<a id="keyboard"></a>

## 鍵盤

在 macOS 與 web 上，Tab 可到達接受按壓的 view，此時 `RadioGroup` 遵循 [WAI-ARIA radio group pattern](https://www.w3.org/WAI/ARIA/apg/patterns/radio/)：

| 按鍵 | 作用 |
|---|---|
| Tab、Shift+Tab | 從已勾選的 radio 進入群組（若沒有已勾選的，則進入第一個未停用的 radio），並一步離開群組。 |
| Down、Right | 將焦點移到下一個 radio，從最後一個繞回第一個，並勾選它。 |
| Up、Left | 將焦點移到上一個 radio，從第一個繞回最後一個，並勾選它。 |
| Space | 勾選目前取得焦點的 radio。 |

方向鍵會略過已停用的 radio；它們移往的 radio 會透過 `onChange` 要求被勾選，再由應用程式完成勾選。在由右至左的版面配置中，Left 與 Right 的作用互換：Left 移到下一個 radio，Right 移到上一個；Up 與 Down 則維持不變。`focus:` 樣式會顯示焦點所在位置。位於 `RadioGroup` 之外的 `Radio` 是獨立的停駐點，Tab 可以到達，並可用 Space 與 Return 勾選。

<a id="platform-notes"></a>

## 平台說明

- iOS、Android 與 Mac Catalyst：按壓是指在 radio 上結束的點選，包含其標籤範圍。
- 桌面平台（macOS、Windows、Linux、GPUI）與 web：按壓是指點擊。在 macOS 與 web 上，Space 與 Return 也可勾選取得鍵盤焦點的 radio，方向鍵則可移動焦點（[鍵盤](#keyboard)）。
- 各平台都會繪製應用程式所設定的樣式：指示器、標籤及其轉場效果。
