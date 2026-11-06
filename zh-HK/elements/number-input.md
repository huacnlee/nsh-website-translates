---
title: "NumberInput"
description: "NumberInput 元件:數字可以在欄位中輸入,也可以透過按鈕、方向鍵和螢幕閱讀器逐步調整,並會依照 step 的小數位數及 min 和 max 加以限制;包含欄位、按鈕和控制項欄位,樣式由應用程式自行設定。"
group: base
demo: el-number-input
source_hash: 4dd788dd07f8f04a
---


# NumberInput

數字輸入框用於承載用戶輸入或步進調整的數字，例如數量、價格、尺寸。它自行管理行為：欄位接受數字，或正在輸入成數字的文字（`-`、`1.`），其他內容一律拒絕，包括其他鍵盤的數字和符號；它的按鈕、上方向鍵和下方向鍵，以及螢幕閱讀器的遞增和遞減操作，會按 `step` 步進數字並保留其小數位，到 `min` 和 `max` 時停止；離開欄位時，已輸入的數字會被限制在這個範圍內。外觀由應用程式決定：`NumberInput` 本身沒有顏色、尺寸、邊框、圖示或字串。它由遞減按鈕、位於應用程式的 `prefix` 與 `suffix` 之間的欄位，以及遞增按鈕組成（或由欄位，加上一個載有兩個按鈕的直欄組成，`controlsRight`），應用程式為每個部分設定樣式並填充按鈕內容。

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

`NumberInput` 來自 [`nsh/base`](../modules/nsh-base.md)，即 Rust 中的 `nsh-base` crate。在 Rust 中，`number_input()` 會建立一個數字輸入框，每個屬性有一個 setter（`.value(..)`、`.input_style(..)`），每個事件有一個監聽方法（`.on_change(..)`），輸入框本身有型別化的樣式方法，欄位周圍的內容則使用 `.prefix(..)` / `.suffix(..)`。它的值是 `Option<f64>`。

<a id="value"></a>

## 值

值是一個數字，欄位為空時則為 `null`。應用程式以 `value` 持有該值，並設定 `onChange` 所回報的值，與 `nsh/base` 的每個控件一樣；或者以 `defaultValue` 把值交給輸入框管理，同樣可以接收到變更。

欄位的文字與值在必要時各自獨立，讓用戶可以自由輸入：

- 每當文字所讀出的數字改變時，`onChange` 就會回報該數字；當文字讀不出任何數字時（空白、`-`、`.`），回報 `null`；在 `1` 之後輸入 `1.`，或在 `1.5` 之後輸入 `1.50`，則不會回報任何內容。
- 只要文字讀出的值與輸入框持有的值相同，文字就會保持用戶輸入的樣子，因此把每個回報的值傳回去的受控輸入框，會保留 `1.` 和 `2.50`。應用程式設定而輸入框沒有回報過的值，會以能讀出該值的最短文字顯示在欄位中（`0.3`、`12`）。
- 輸入期間，數字可以超出 `min` 和 `max` 的範圍（例如 `min={10}` 時，1 是在輸入 15 的途中），並按輸入的內容回報。離開欄位或按 Return / Enter 時，數字會被限制在範圍內並回報該值；讀不出數字的文字則保持原樣。
- 步進（按鈕、按鍵、螢幕閱讀器的操作）會以 `onChange` 請求下一個值；受控值的情況下，欄位會在應用程式把值傳回後才移動，並保留步進的小數位（`99.5` 向上步進到 `max={100}` 時顯示 `100.0`），因此拒絕步進的應用程式會讓欄位保持不動。被應用程式拒絕的編輯在欄位編輯期間會保留在欄位中，離開欄位時才會消失。

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

- 數字、一個小數點和位於開頭的正負號（`+` 或 `-`）；字母、第二個小數點或正負號，或位於其他位置的正負號會被拒絕，欄位會還原為原本的文字。
- 全形數字、正負號和小數點、減號（U+2212）以及表意句號（`。`），會被讀作對應的 ASCII 形式，就像中文和日文輸入法所輸入的一樣。
- 當文字中還沒有小數點時，逗號會視為小數點（`3,25` 即 3.25），就像許多語言鍵盤上的小數鍵所輸入的一樣。

<a id="props"></a>

## 屬性

| 屬性 | Rust | 類型 | 預設值 | 說明 |
|---|---|---|---|---|
| `value` | `.value(..)` | `number \| null` | 無 | 值（受控）：一個數字，欄位為空時則為 `null`。應用程式設定 `onChange` 所回報的值。 |
| `defaultValue` | `.default_value(..)` | `number \| null` | 無 | 在未設定 `value` 時的初始值；之後輸入框自行保存值。 |
| `min` | `.min(..)` | `number` | 無 | 最小值：步進到此為止，低於此值的輸入內容會在離開欄位時被限制為此值。 |
| `max` | `.max(..)` | `number` | 無 | 最大值，與 `min` 從上限方面的行為相同；低於 `min` 的值會當作 `min`。 |
| `step` | `.step(..)` | `number` | `1` | 每次步進的幅度（Page Up / Page Down：十個步進）；不是正數的值會當作 `1`。 |
| `disabled` | `.disabled(..)` | `boolean` | `false` | 不能輸入、步進或取得焦點；`disabled:` class 會套用於輸入框及其各部分。 |
| `readonly` | `.readonly(..)` | `boolean` | `false` | 文字可以選取和複製，但不能透過輸入或步進更改；按鈕會停用。 |
| `placeholder` | `.placeholder(..)` | `string` | 無 | 欄位為空時顯示。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 無 | 在沒有可見標籤為欄位命名時，螢幕閱讀器為該欄位朗讀的內容。 |
| `controlsRight` | `.controls_right(..)` | `boolean` | `false` | 兩個按鈕在欄位右側排成一直欄，遞增按鈕在遞減按鈕之上。於建立輸入框時讀取。 |
| `inputClass`、`inputStyle` | `.input_style(\|s\| ..)` | `string`、`StyleProp<InputStyle>` | 無 | 欄位：它的方框和文字（`color`、`fontSize`、`textAlign`、`placeholderColor`、`caretColor`）。 |
| `decrementButtonClass`、`decrementButtonStyle` | `.decrement_button_style(\|s\| ..)` | `string`、`StyleProp<ViewStyle>` | 無 | 遞減按鈕。 |
| `incrementButtonClass`、`incrementButtonStyle` | `.increment_button_style(\|s\| ..)` | `string`、`StyleProp<ViewStyle>` | 無 | 遞增按鈕。 |
| `decrementButton`、`incrementButton` | `.decrement_button(..)`、`.increment_button(..)` | `JSX.Element` | 無 | 按鈕的內容：符號、圖示。 |
| `controlsClass`、`controlsStyle` | `.controls_style(\|s\| ..)` | `string`、`StyleProp<ViewStyle>` | 無 | 使用 `controlsRight` 時，容納兩個按鈕的直欄。 |
| `prefix` | `.prefix(..)` | `JSX.Element` | 無 | 欄位之前的內容，位於左側按鈕之後：貨幣符號、圖示。 |
| `suffix` | `.suffix(..)` | `JSX.Element` | 無 | 欄位之後的內容，位於右側按鈕之前：單位、貨幣。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | 無 | 輸入框本身：圍繞欄位和按鈕的一行。 |

<a id="events"></a>

## 事件

| 事件 | Rust | 載荷 | 時機 |
|---|---|---|---|
| `onChange` | `.on_change(\|value: &Option<f64>\| ..)` | `{ value: number \| null }` | 欄位所讀出的數字改變時（輸入、步進、螢幕閱讀器的遞增或遞減、離開欄位時值超出範圍）。 |
| `onSubmit` | `.on_submit(\|value: &Option<f64>\| ..)` | `{ value: number \| null }` | 在欄位中按 Return / Enter：值會被限制在 `min` 和 `max` 之內。 |
| `onFocus` | `.on_focus(..)` | 無 | 欄位取得了鍵盤焦點。 |
| `onBlur` | `.on_blur(..)` | 無 | 欄位失去了鍵盤焦點（其值會先被限制在 `min` 和 `max` 之內）。 |

<a id="parts"></a>

## 部分

| 部分 | 位置 | 樣式設定方式 |
|---|---|---|
| 輸入框 | | `class`、`style` |
| 遞減按鈕 | 在輸入框內，第一個（使用 `controlsRight` 時：在控制直欄內，第二個） | `decrementButtonClass`、`decrementButtonStyle`；其內容為 `decrementButton` |
| 欄位 | 在輸入框內 | `inputClass`、`inputStyle` |
| 前綴 | 在輸入框內，位於欄位之前 | 自己的元素（`prefix`） |
| 後綴 | 在輸入框內，位於欄位之後 | 自己的元素（`suffix`） |
| 遞增按鈕 | 在輸入框內，最後一個（使用 `controlsRight` 時：在控制直欄內，第一個） | `incrementButtonClass`、`incrementButtonStyle`；其內容為 `incrementButton` |
| 控制直欄 | 在輸入框內，最後一個，配合 `controlsRight` 使用 | `controlsClass`、`controlsStyle` |

輸入框是一行由應用程式排版的元素：在 `class` 上使用 `flex-row`，並在欄位上使用 `flex-1`，讓它佔用按鈕剩下的空間。各部分會顯示的狀態：

- 輸入框：欄位編輯期間為 `focus-within:`（圍繞整個輸入框的光環），以及 `disabled:`。
- 欄位：編輯期間為 `focus:`，以及 `disabled:`。
- 按鈕：指標位於其上時為 `hover:`，按下期間為 `active:`，輸入框停用或唯讀，以及步進無效時為 `disabled:`（在 `min` 時的遞減按鈕、在 `max` 時的遞增按鈕）。請把懸停樣式放在 `enabled:`（`enabled:hover:bg-accent`）之後，這樣停用的按鈕就不會亮起。

狀態的動態效果由應用程式決定（`transition-colors`），而 `motion-reduce:` 會為要求減少動態效果的用戶讓它保持靜止。

<a id="keyboard"></a>

## 鍵盤

欄位編輯期間，輸入框接受 WAI-ARIA 的 spin button 按鍵，按住時會重複觸發：

| 按鍵 | 作用 |
|---|---|
| 上方向鍵 | 向上步進一次。 |
| 下方向鍵 | 向下步進一次。 |
| Page Up、Page Down | 向上或向下步進十次。 |

Home 和 End 仍屬於欄位：它們會在文字中移動插入點。按鈕不是鍵盤焦點的停靠點：Tab 會從欄位移到輸入框之後的內容，而按下按鈕會讓焦點留在欄位中（在桌面平台上，如果焦點原本在別處，按下按鈕會把焦點移到欄位；在觸控螢幕上則保持不變，因此不會彈出鍵盤）。

<a id="accessibility"></a>

## 無障礙功能

- 欄位是一個 spin button（`"spinbutton"`），帶有它的標籤、值（它所讀出的數字，介於 `min` 和 `max` 之間）及其文字。
- 螢幕閱讀器的遞增和遞減操作（VoiceOver 的向上和向下滑動）會像上方向鍵和下方向鍵一樣步進數字。
- 按鈕對螢幕閱讀器隱藏，與瀏覽器的數字欄位相同：由欄位本身的遞增和遞減操作來步進。
- 當 `disabled` 時，螢幕閱讀器會說明該欄位呈暗灰狀態。

有關標籤、角色和操作的一般說明，請參閱 [無障礙功能](../docs/accessibility.md)。

<a id="platform-notes"></a>

## 平台說明

- 欄位是平台的文字欄位（[Input](./input.md)）：鍵盤、插入點、選取、複製和貼上、輸入法均由系統提供。手機會顯示小數鍵盤，當 `min` 小於 0 或未設定時，鍵盤會帶有正負號。
- 每個平台都會繪製應用程式所設定的樣式。在所有平台上，實體鍵盤的上方向鍵、下方向鍵以及 Page Up / Page Down 都能作用於輸入框。
