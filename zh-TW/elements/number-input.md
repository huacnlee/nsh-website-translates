---
title: "NumberInput"
description: "NumberInput 元件：數字可在欄位中輸入，也可透過按鈕、方向鍵與螢幕閱讀器逐步調整，並會遵循 step 的小數位數以及 min 與 max 的限制；欄位、按鈕與控制項欄位的樣式皆由應用程式自行決定。"
group: base
demo: el-number-input
source_hash: 4dd788dd07f8f04a
---

# NumberInput

數字輸入框保存使用者輸入或步進調整的數字，例如數量、價格、尺寸。它自行掌管行為：欄位接受數字，或正在輸入成數字的文字（`-`、`1.`），其他一律拒絕，包括其他鍵盤的數字與符號；它的按鈕、上下鍵，以及螢幕閱讀器的遞增與遞減，會以 `step` 為單位步進調整數字並保留其小數位數，且停在 `min` 與 `max`；離開欄位時，輸入的數字會被限制在這個範圍內。外觀由 App 決定：`NumberInput` 本身沒有任何顏色、尺寸、邊框、圖示或字串。它由遞減按鈕、位於 App 的 `prefix` 與 `suffix` 之間的欄位，以及遞增按鈕組成（或是欄位，加上位於其右側、包含兩個按鈕的一欄，`controlsRight`），App 為每個部分設定樣式並填入按鈕內容。

```rust tabs
use nsh_base::{number_input, theme};
use nsh_core::prelude::*;

fn tickets(count: Signal<Option<f64>>) -> impl IntoElement {
    number_input()
        .value(move || count.get())
        .min(1.0)
        .max(10.0)
        .accessibility_label("Tickets")
        .on_change(move |next: &Option<f64>| count.set(*next))
        .h(px(32.0))
        .flex_row()
        .rounded(px(8.0))
        .border_1()
        .border_color(move || theme().input)
        .input_style(|s| s.flex_1().text_center().text_color(move || theme().foreground))
        .decrement_button_style(|s| s.w(px(32.0)).items_center().justify_center())
        .increment_button_style(|s| s.w(px(32.0)).items_center().justify_center())
        .decrement_button(text("−"))
        .increment_button(text("+"))
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { NumberInput } from "nsh/base";

function App() {
  const tickets = signal<number | null>(2);
  return (
    <NumberInput
      value={tickets()}
      onChange={({ value }) => tickets.set(value)}
      min={1}
      max={10}
      accessibilityLabel="Tickets"
      class="h-8 flex-row overflow-hidden rounded-lg border border-input bg-field focus-within:outline-2 focus-within:outline-ring"
      inputClass="flex-1 text-center text-foreground"
      decrementButtonClass="w-8 items-center justify-center enabled:hover:bg-accent active:bg-muted disabled:opacity-40"
      incrementButtonClass="w-8 items-center justify-center enabled:hover:bg-accent active:bg-muted disabled:opacity-40"
      decrementButton={<Text>−</Text>}
      incrementButton={<Text>+</Text>}
    />
  );
}

mount(App);
```

`NumberInput` 來自 [`nsh/base`](../modules/nsh-base.md)，也就是 Rust 中的 `nsh-base` crate。在 Rust 中，`number_input()` 會建立一個數字輸入框，每個 prop 有一個 setter（`.value(..)`、`.input_style(..)`），每個事件有一個監聽方法（`.on_change(..)`），輸入框本身有型別化的樣式方法，欄位周圍的內容則使用 `.prefix(..)` / `.suffix(..)`。它的值是 `Option<f64>`。

<a id="value"></a>

## 值

值是一個數字，欄位為空時則為 `null`。App 以 `value` 掌管值，並設定 `onChange` 回報的值，與 `nsh/base` 的每個控制項相同；或者以 `defaultValue` 把值交給輸入框自行處理，同樣能收到變更通知。

欄位的文字與值在必要之處分開處理，讓使用者能自由輸入：

- 只要文字解讀出的數字有變，`onChange` 就會回報該數字；當文字解讀不出數字（空白、`-`、`.`）時回報 `null`；在 `1` 之後輸入 `1.`，或在 `1.5` 之後輸入 `1.50`，則不會回報任何內容。
- 只要文字解讀出的值與輸入框持有的值相同，文字就維持使用者輸入的樣子，因此把每個回報的值傳回去的受控輸入框會保留 `1.` 與 `2.50`。App 設定、但輸入框並未回報的值，會以能解讀為該值的最短文字顯示在欄位中（`0.3`、`12`）。
- 輸入過程中，數字可以超出 `min` 與 `max` 的範圍（在 `min={10}` 的情況下，要輸入 15 時先輸入的 1），並照輸入的內容回報。離開欄位或按下 Return / Enter 時，數值會被限制在範圍內並回報；解讀不出數字的文字則維持原樣。
- 步進（按鈕、按鍵、螢幕閱讀器的動作）會以 `onChange` 請求下一個值；在受控值的情況下，欄位會在 App 把值傳回後才變動，並保留步進的小數位數（`99.5` 上調到 `max={100}` 會顯示 `100.0`），因此拒絕步進的 App 會讓欄位維持原狀。App 拒絕的編輯在編輯期間會留在欄位中，離開欄位時才消失。

```tsx
const price = signal<number | null>(19.95);

<NumberInput
  value={price()}
  onChange={({ value }) => price.set(value)}
  onSubmit={({ value }) => save(value)}
  min={0}
  step={0.05}
  placeholder="Price"
  accessibilityLabel="Price"
/>;
```

欄位接受：

- 數字、一個小數點，以及位於開頭的正負號（`+` 或 `-`）；字母、第二個小數點或正負號，或位於其他位置的正負號都會被拒絕，欄位會回到原本的文字。
- 全形數字、正負號與小數點、減號（U+2212）以及中文句號（`。`），會被視為對應的 ASCII 形式，如同中文與日文輸入法的輸入方式。
- 當文字中尚無小數點時，逗號會視為小數點（`3,25` 即 3.25），如同許多語言鍵盤上的小數鍵所輸入的內容。

## Props

| Prop | Rust | 型別 | 預設值 | 說明 |
|---|---|---|---|---|
| `value` | `.value(..)` | `number \| null` | 無 | 值（受控）：一個數字，欄位為空時則為 `null`。App 設定 `onChange` 回報的值。 |
| `defaultValue` | `.default_value(..)` | `number \| null` | 無 | 未設定 `value` 時的初始值；此時輸入框自行保存值。 |
| `min` | `.min(..)` | `number` | 無 | 最小值：步進會停在此值，輸入低於此值的數字會在離開欄位時被限制為此值。 |
| `max` | `.max(..)` | `number` | 無 | 最大值，與 `min` 從上方限制的方式相同；低於 `min` 的值視為 `min`。 |
| `step` | `.step(..)` | `number` | `1` | 每次步進的幅度（Page Up / Page Down：十個步進）；不是正數的值視為 `1`。 |
| `disabled` | `.disabled(..)` | `boolean` | `false` | 無法輸入、步進或取得焦點；`disabled:` class 會套用到輸入框及其各部分。 |
| `readonly` | `.readonly(..)` | `boolean` | `false` | 文字可以選取與複製，但無法以輸入或步進變更；按鈕會停用。 |
| `placeholder` | `.placeholder(..)` | `string` | 無 | 欄位為空時顯示。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 無 | 在沒有可見標籤為欄位命名時，螢幕閱讀器為欄位朗讀的內容。 |
| `controlsRight` | `.controls_right(..)` | `boolean` | `false` | 兩個按鈕在欄位右側垂直排成一欄，遞增在上、遞減在下。在建立輸入框時讀取。 |
| `inputClass`、`inputStyle` | `.input_style(\|s\| ..)` | `string`、`StyleProp<InputStyle>` | 無 | 欄位：其方框與文字（`color`、`fontSize`、`textAlign`、`placeholderColor`、`caretColor`）。 |
| `decrementButtonClass`、`decrementButtonStyle` | `.decrement_button_style(\|s\| ..)` | `string`、`StyleProp<ViewStyle>` | 無 | 遞減按鈕。 |
| `incrementButtonClass`、`incrementButtonStyle` | `.increment_button_style(\|s\| ..)` | `string`、`StyleProp<ViewStyle>` | 無 | 遞增按鈕。 |
| `decrementButton`、`incrementButton` | `.decrement_button(..)`、`.increment_button(..)` | `JSX.Element` | 無 | 按鈕的內容：符號、圖示。 |
| `controlsClass`、`controlsStyle` | `.controls_style(\|s\| ..)` | `string`、`StyleProp<ViewStyle>` | 無 | 以 `controlsRight` 容納兩個按鈕的那一欄。 |
| `prefix` | `.prefix(..)` | `JSX.Element` | 無 | 位於欄位之前、左側按鈕之後的內容：貨幣符號、圖示。 |
| `suffix` | `.suffix(..)` | `JSX.Element` | 無 | 位於欄位之後、右側按鈕之前的內容：單位、貨幣。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | 無 | 輸入框本身：圍繞欄位與按鈕的那一列。 |

<a id="events"></a>

## 事件

| 事件 | Rust | Payload | 時機 |
|---|---|---|---|
| `onChange` | `.on_change(\|value: &Option<f64>\| ..)` | `{ value: number \| null }` | 欄位解讀出的數字有變（輸入、步進、螢幕閱讀器的遞增或遞減、離開欄位時值超出範圍）。 |
| `onSubmit` | `.on_submit(\|value: &Option<f64>\| ..)` | `{ value: number \| null }` | 在欄位中按下 Return / Enter：值會先被限制在 `min` 與 `max` 之間。 |
| `onFocus` | `.on_focus(..)` | 無 | 欄位取得鍵盤焦點。 |
| `onBlur` | `.on_blur(..)` | 無 | 欄位失去鍵盤焦點（其值會先被限制在 `min` 與 `max` 之間）。 |

<a id="parts"></a>

## 組成部分

| 部分 | 位置 | 樣式設定 |
|---|---|---|
| 輸入框 | | `class`、`style` |
| 遞減按鈕 | 在輸入框內，位於最前（使用 `controlsRight` 時：在控制欄內，位於第二） | `decrementButtonClass`、`decrementButtonStyle`；其內容為 `decrementButton` |
| 欄位 | 在輸入框內 | `inputClass`、`inputStyle` |
| 前綴 | 在輸入框內，位於欄位之前 | 自己的元素（`prefix`） |
| 後綴 | 在輸入框內，位於欄位之後 | 自己的元素（`suffix`） |
| 遞增按鈕 | 在輸入框內，位於最後（使用 `controlsRight` 時：在控制欄內，位於第一） | `incrementButtonClass`、`incrementButtonStyle`；其內容為 `incrementButton` |
| 控制欄 | 在輸入框內，位於最後，搭配 `controlsRight` | `controlsClass`、`controlsStyle` |

輸入框是由 App 負責排版的一列：在 `class` 上使用 `flex-row`，並在欄位上使用 `flex-1`，讓欄位取得按鈕之外剩餘的空間。各部分會呈現的狀態如下：

- 輸入框：欄位編輯期間為 `focus-within:`（整個輸入框外圍的光環）、`disabled:`。
- 欄位：編輯期間為 `focus:`、`disabled:`。
- 按鈕：指標位於其上時為 `hover:`，按下期間為 `active:`，輸入框停用或唯讀，以及步進不會有任何作用時為 `disabled:`（在 `min` 的遞減按鈕、在 `max` 的遞增按鈕）。請把 hover 放在 `enabled:`（`enabled:hover:bg-accent`）之後，這樣停用的按鈕就不會亮起。

狀態的動態效果由 App 自行選擇（`transition-colors`），而 `motion-reduce:` 會讓要求減少動態效果的使用者看到靜止的畫面。

<a id="keyboard"></a>

## 鍵盤

欄位編輯期間，輸入框接受 WAI-ARIA 的 spin button 按鍵，按住時會重複觸發：

| 按鍵 | 作用 |
|---|---|
| Up | 向上一個步進。 |
| Down | 向下一個步進。 |
| Page Up、Page Down | 向上或向下十個步進。 |

Home 與 End 仍屬於欄位：它們會在文字中移動插入點。按鈕不是鍵盤焦點的停駐點：Tab 會從欄位移到輸入框之後的內容，而按下按鈕會讓焦點留在欄位中（在桌面平台上，若焦點原本在別處，按下按鈕會把焦點移到欄位；在觸控螢幕上則維持不動，因此不會跳出鍵盤）。

<a id="accessibility"></a>

## 無障礙

- 欄位是一個 spin button（`"spinbutton"`），具有標籤、值（它解讀出的數字，介於 `min` 與 `max` 之間）以及文字。
- 螢幕閱讀器的遞增與遞減動作（VoiceOver 的上下滑動）會像 Up 與 Down 一樣對欄位進行步進。
- 按鈕對螢幕閱讀器隱藏，與瀏覽器的數字欄位相同：欄位本身的遞增與遞減就能進行步進。
- 當 `disabled` 時，螢幕閱讀器會說明欄位呈暗淡狀態。

關於標籤、角色與動作的一般說明，請參閱 [Accessibility](../docs/accessibility.md)。

<a id="platform-notes"></a>

## 平台說明

- 欄位是平台的文字欄位（[Input](./input.md)）：鍵盤、插入點、選取、複製與貼上、輸入法皆由系統提供。當 `min` 小於 0 或未設定時，手機會顯示帶有正負號的小數鍵盤。
- 每個平台都會繪製 App 設定的樣式。在每個平台上，Up / Down 與 Page Up / Page Down 都能從實體鍵盤傳達到輸入框。
