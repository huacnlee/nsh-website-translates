---
title: "OtpInput"
description: "OtpInput 元件：固定長度的數字一次性驗證碼，可輸入、貼上或自動填入單一原生欄位，並以應用程式可自訂樣式的儲存格、分組與插入符號呈現。"
group: base
demo: el-otp-input
source_hash: 80ea5e26b79a21ac
---

# OtpInput

一次性驗證碼輸入元件接受固定位數的數字（簡訊中的驗證碼、驗證器產生的代碼），並將這些數字顯示在格子中。它負責處理行為：一個透明的原生文字欄位覆蓋在格子上方接收鍵盤輸入，因此輸入、輸入法、貼上、數字鍵盤，以及系統的驗證碼自動填入（iOS 的「From Messages」、Android 的簡訊建議）都由平台自行處理，螢幕閱讀器也只會找到一個文字欄位。只有數字能輸入，最多到 `length`；Backspace 會移除最後一位數字，`onComplete` 會告知驗證碼已填滿。外觀由應用程式決定：`OtpInput` 本身沒有顏色、尺寸、邊框或標籤。它的組成部分是格子、格子所分成的群組與游標，應用程式可分別為它們設定樣式。

```rust tabs
use nsh_base::{OtpInputCompleteEvent, otp_input, theme};
use nsh_core::prelude::*;

fn verification(verify: impl Fn(&str) + 'static) -> impl IntoElement {
    let code = signal(SharedString::default());
    otp_input()
        .length(6)
        .groups(2)
        .value(move || Some(code.get()))
        .on_change(move |next: &SharedString| code.set(next.clone()))
        .on_complete(move |e: &OtpInputCompleteEvent| verify(&e.value))
        .accessibility_label("Verification code, 6 digits")
        .flex_row()
        .gap_3()
        .group_style(|s| s.flex_row().gap_2())
        .cell_style(|s| {
            s.w(px(40.0))
                .h(px(48.0))
                .items_center()
                .justify_center()
                .rounded(px(8.0))
                .border_1()
                .border_color(move || theme().input)
                .text_xl()
        })
        // The cell that takes the next digit, while the code has the focus,
        // and the cells that hold a digit.
        .cell_class("focus:border-ring data-filled:bg-muted")
        .caret_style(|s| s.w(px(2.0)).h(px(24.0)).bg(move || theme().foreground))
}
```

```tsx tabs
import { mount, signal } from "nsh";
import { OtpInput } from "nsh/base";

function App() {
  const code = signal("");
  const verify = (value: string) => console.log(`checking ${value}`);
  return (
    <OtpInput
      length={6}
      groups={2}
      value={code()}
      onChange={({ value }) => code.set(value)}
      onComplete={({ value }) => verify(value)}
      accessibilityLabel="Verification code, 6 digits"
      class="flex-row gap-3"
      groupClass="flex-row gap-2"
      cellClass="w-10 h-12 items-center justify-center rounded-lg border border-input text-xl focus:border-ring data-filled:bg-muted"
      caretClass="w-0.5 h-6 bg-foreground"
    />
  );
}

mount(App);
```

`OtpInput` 來自 [`nsh/base`](../modules/nsh-base.md)，也就是 Rust 中的 `nsh-base` crate。在 Rust 中，`otp_input()` 會建立一個實例，每個屬性對應一個 setter（`.length(..)`、`.cell_style(..)`），每個事件對應一個監聽方法（`.on_complete(..)`），以及用於設定輸入元件本身的具型別樣式方法。

<a id="the-code"></a>

## 驗證碼

- **受控**：傳入 `value`，並在 `onChange` 中更新它。格子會原樣顯示應用程式傳入的 `value`；應用程式自行設定的值（例如驗證碼錯誤後清空）不會被回報。
- **非受控**：傳入 `defaultValue`（或不傳），並從 `onChange` 與 `onComplete` 讀取驗證碼。

使用者的操作是從欄位讀取的，游標永遠位於結尾：

| 使用者操作 | 驗證碼的變化 |
|---|---|
| 輸入一個數字 | 當驗證碼短於 `length` 時，數字會加在結尾；已填滿時則不會有任何變化。 |
| 輸入全形數字（`０`–`９`，東亞輸入法所輸入的） | 會加入對應的 ASCII 數字。 |
| 輸入其他任何內容 | 不會有任何變化；欄位會捨棄它。 |
| 按下 Backspace | 移除最後一位數字。 |
| 貼上，或由系統自動填入驗證碼 | 其中的數字會以相同方式加入；含有 `length` 位以上數字的文字（`123-456`，例如簡訊中的驗證碼）會以其前 `length` 位數字取代原有的驗證碼。 |

`onChange` 會連同新的驗證碼回報每次變更；當變更填滿最後一個格子時，`onComplete` 會接著觸發，應用程式便可在此時驗證驗證碼。

<a id="props"></a>

## 屬性

| 屬性 | Rust | 型別 | 預設值 | 說明 |
|---|---|---|---|---|
| `length` | `.length(..)` | `number` | 必填 | 驗證碼的位數：每位數字一個格子。 |
| `value` | `.value(..)` | `string` | 無 | 由應用程式控制的驗證碼（原樣顯示）。未設定時，輸入元件會自行保存。 |
| `defaultValue` | `.default_value(..)` | `string` | 無 | 在未設定 `value` 時，驗證碼的初始值。 |
| `masked` | `.masked(..)` | `boolean` | `false` | 已填入的格子會顯示圓點而非數字，且該欄位為安全欄位：螢幕閱讀器不會讀出驗證碼，系統也不會將其列入建議。 |
| `disabled` | `.disabled(..)` | `boolean` | `false` | 無法取得焦點也無法編輯；`disabled:` 樣式會套用於輸入元件及其各部分，螢幕閱讀器會說明它已停用（dimmed）。 |
| `groups` | `.groups(..)` | `number` | `1` | 格子被分成幾個群組，盡可能平均分配（六位數分成兩組時為 3 + 3）；至少一組，最多每個格子各一組。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 無 | 螢幕閱讀器為此欄位朗讀的內容：驗證碼的用途與位數。 |
| `cellClass`、`cellStyle` | `.cell_class(..)`、`.cell_style(\|s\| ..)` | `string`、`StyleProp<TextStyle>` | 無 | 每個格子的尺寸、邊框與文字（`color`、`fontSize`，其中的數字會繼承這些設定）；`focus:` 與 `data-filled:` 用於設定其狀態樣式（見組成部分）。 |
| `groupClass`、`groupStyle` | `.group_class(..)`、`.group_style(\|s\| ..)` | `string`、`StyleProp<ViewStyle>` | 無 | 每個格子群組（`flex-row gap-2`）。 |
| `caretClass`、`caretStyle` | `.caret_class(..)`、`.caret_style(\|s\| ..)` | `string`、`StyleProp<ViewStyle>` | 無 | 游標：其寬度、高度與顏色。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | 無 | 輸入元件本身：包住各群組的列（或欄）。 |

<a id="events"></a>

## 事件

| 事件 | Rust | 資料內容 | 觸發時機 |
|---|---|---|---|
| `onChange` | `.on_change(\|value: &SharedString\| ..)` | `(e: { value: string })` | 使用者變更了驗證碼：輸入、刪除、貼上或自動填入。 |
| `onComplete` | `.on_complete(\|e: &OtpInputCompleteEvent\| ..)` | `{ value }` | 使用者的變更填滿了最後一個格子，在其 `onChange` 之後觸發。 |
| `onFocus` / `onBlur` | `.on_focus` / `.on_blur` | 無 | 輸入元件取得／失去鍵盤焦點。 |

<a id="ref-methods"></a>

## Ref 方法

| 方法 | Rust | 說明 |
|---|---|---|
| `focus()` | `focus()`（`OtpInputApi`） | 取得鍵盤焦點並顯示軟體鍵盤，效果與按一下輸入元件相同。 |

<a id="parts"></a>

## 組成部分

| 部分 | 位於 | 樣式設定 |
|---|---|---|
| 輸入元件 | | `class`、`style` |
| 群組 | 輸入元件內，每組一個 | `groupClass`、`groupStyle`；`disabled:` 跟隨輸入元件 |
| 格子 | 所屬群組內，每個數字一個 | `cellClass`、`cellStyle`；輸入元件擁有焦點時，`focus:` 用於接收下一個數字的格子，`data-filled:` 用於每個已有數字的格子，`disabled:` 跟隨輸入元件 |
| 數字 | 已填入的格子 | 格子的文字樣式（`text-xl`、`font-semibold`）；當 `masked` 時使用 `•` |
| 游標 | 輸入元件擁有焦點時，接收下一個數字的空格子 | `caretClass`、`caretStyle` |

接收下一個數字的格子，是最後一個數字之後的那一格；驗證碼填滿後則是最後一個格子。游標的閃爍方式與文字欄位相同（亮半秒、暗半秒，每次編輯後會短暫維持不閃爍），透過其不透明度以原生方式實現，同時在版面配置中保持原位；啟用減少動態效果時，游標會保持靜止。按一下輸入元件的任何位置都會使它取得焦點：欄位覆蓋在格子上方。

已有數字的格子（無論是否遮蔽）具有屬性 `data-filled`，因此 `data-filled:` 類別可用來設定使用者已填入的格子的樣式（更粗的邊框、填色：`data-filled:border-foreground data-filled:bg-muted`），寫法與 shadcn/ui 設定其狀態的方式相同。當 `cellClass` 中有 `group` 時，`group-data-filled:` 類別可用來設定已填入格子內部的內容，也就是其中的數字。格子只會改變其類別，而不會改變其內容，因此每次按鍵只會重新設定一個格子的樣式，不會重新繪製任何內容。

<a id="accessibility"></a>

## 無障礙

- 螢幕閱讀器只會找到一個文字欄位，由 `accessibilityLabel` 命名（說明驗證碼的用途與長度，例如「Verification code, 6 digits」），並以驗證碼作為其值；格子則對螢幕閱讀器隱藏。當 `masked` 時，該欄位為安全欄位，因此驗證碼不會被朗讀出來。
- 鍵盤由平台提供：手機上是數字鍵盤，桌面上可使用任何鍵盤（只有數字能輸入），以及 Backspace。Tab 鍵可像任何文字欄位一樣移到輸入元件。
- 當 `disabled` 時，它無法取得焦點，螢幕閱讀器會說明它已停用（dimmed）。

關於標籤、角色與通知的一般說明，請參閱[無障礙](../docs/accessibility.md)。

<a id="platform-notes"></a>

## 平台備註

- iOS：該欄位是驗證碼欄位（`textContentType` `oneTimeCode`），因此 QuickType 列會提供來自 Messages 或 Mail 的驗證碼；系統會顯示數字鍵盤。`masked` 欄位在失去焦點後再次輸入時會重新開始，與 iOS 的安全欄位行為相同。
- Android：`autofillHints` `smsOTPCode` 讓鍵盤與自動填入服務能提供簡訊中的驗證碼；系統會顯示數字鍵盤。
- macOS、Windows、Linux 與網頁：輸入與貼上都會送到該欄位（在瀏覽器中，搭配 `inputmode="numeric"` 以顯示手機的數字鍵盤），並且在格子上方會顯示 I 形指標。
