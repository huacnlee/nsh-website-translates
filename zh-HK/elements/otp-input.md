---
title: "OtpInput"
description: "OtpInput 元件:固定長度的數字一次性驗證碼,可透過輸入、貼上或自動填入的方式輸入至單一原生欄位,並以應用程式自訂樣式的儲存格、分組及游標顯示。"
group: base
demo: el-otp-input
source_hash: 80ea5e26b79a21ac
---


# OtpInput

一次性驗證碼輸入元件接受固定位數的數字（短訊中的驗證碼、驗證器應用程式的驗證碼），並以格子顯示。它負責處理行為：一個原生文字欄位以透明方式覆蓋在格子上方並接收鍵盤輸入，因此輸入、輸入法、貼上、數字鍵盤，以及系統的驗證碼自動填入（iOS 的「來自訊息」、Android 的短訊建議）均由平台本身處理，而螢幕閱讀器只會找到一個文字欄位。只接受數字，最多 `length` 位；Backspace 會移除最後一位數字，而 `onComplete` 會在驗證碼填滿時通知。外觀由應用程式決定：`OtpInput` 本身沒有顏色、尺寸、邊框或標籤。它的組成部分是格子、將格子分隔而成的群組，以及游標，各部分均由應用程式設定樣式。

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

`OtpInput` 來自 [`nsh/base`](../modules/nsh-base.md)，即 Rust 中的 `nsh-base` crate。在 Rust 中，`otp_input()` 會建立一個實例，每個 prop 有對應的 setter（`.length(..)`、`.cell_style(..)`），每個事件有對應的監聽方法（`.on_complete(..)`），並提供用於輸入元件本身的具型別樣式方法。

<a id="the-code"></a>

## 驗證碼

- **受控**：傳入 `value` 並在 `onChange` 中設定。格子會原樣顯示應用程式傳入的 `value`；應用程式自行設定的值（例如輸入錯誤後清除驗證碼）不會被回報。
- **非受控**：傳入 `defaultValue`（或不傳），並從 `onChange` 和 `onComplete` 讀取驗證碼。

使用者的操作會從欄位讀取，游標始終位於末端：

| 使用者 | 驗證碼 |
|---|---|
| 輸入數字 | 若驗證碼短於 `length`，數字會加在末端；已填滿時，不會有任何變化。 |
| 輸入全形數字（`０`–`９`，東亞輸入法所輸入的） | 會加入對應的 ASCII 數字。 |
| 輸入其他內容 | 沒有變化；欄位會丟棄該內容。 |
| 按下 Backspace | 移除最後一位數字。 |
| 貼上，或系統自動填入驗證碼 | 其中的數字以同樣方式加入；若文字含有 `length` 位或以上數字（`123-456`，例如訊息中的驗證碼），則以其首 `length` 位數字取代驗證碼。 |

`onChange` 會連同新驗證碼回報每次變更；當變更填滿最後一個格子時，`onComplete` 隨後觸發，應用程式可在此時驗證驗證碼。

<a id="props"></a>

## 屬性

| 屬性 | Rust | 類型 | 預設值 | 說明 |
|---|---|---|---|---|
| `length` | `.length(..)` | `number` | 必填 | 驗證碼的位數：每位數字一個格子。 |
| `value` | `.value(..)` | `string` | 無 | 由應用程式控制的驗證碼（原樣顯示）。未設定時，輸入元件會自行保存驗證碼。 |
| `defaultValue` | `.default_value(..)` | `string` | 無 | 初始的驗證碼，僅在未設定 `value` 時適用。 |
| `masked` | `.masked(..)` | `boolean` | `false` | 已填入的格子會顯示圓點而非數字，而欄位會成為安全欄位：螢幕閱讀器不會讀出驗證碼，系統也不會將其納入建議。 |
| `disabled` | `.disabled(..)` | `boolean` | `false` | 不能取得焦點，也不能編輯；`disabled:` 樣式會套用於輸入元件及其各部分，螢幕閱讀器會說明它已停用。 |
| `groups` | `.groups(..)` | `number` | `1` | 格子被分成多少個群組，盡可能平均分配（六位數字分成兩組則為 3 + 3）；至少一組，最多每個格子一組。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 無 | 螢幕閱讀器為欄位朗讀的內容：驗證碼的用途及位數。 |
| `cellClass`、`cellStyle` | `.cell_class(..)`、`.cell_style(\|s\| ..)` | `string`、`StyleProp<TextStyle>` | 無 | 每個格子：其尺寸、邊框和文字（`color`、`fontSize`，其數字會繼承）；`focus:` 和 `data-filled:` 用於設定其狀態的樣式（見「組成部分」）。 |
| `groupClass`、`groupStyle` | `.group_class(..)`、`.group_style(\|s\| ..)` | `string`、`StyleProp<ViewStyle>` | 無 | 每組格子（`flex-row gap-2`）。 |
| `caretClass`、`caretStyle` | `.caret_class(..)`、`.caret_style(\|s\| ..)` | `string`、`StyleProp<ViewStyle>` | 無 | 游標：其寬度、高度和顏色。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | 無 | 輸入元件本身：圍繞各群組的列（或欄）。 |

<a id="events"></a>

## 事件

| 事件 | Rust | 負載 | 時機 |
|---|---|---|---|
| `onChange` | `.on_change(\|value: &SharedString\| ..)` | `(e: { value: string })` | 使用者更改了驗證碼：輸入、刪除、貼上或自動填入。 |
| `onComplete` | `.on_complete(\|e: &OtpInputCompleteEvent\| ..)` | `{ value }` | 使用者的變更填滿了最後一個格子，在 `onChange` 之後觸發。 |
| `onFocus` / `onBlur` | `.on_focus` / `.on_blur` | 無 | 輸入元件取得／失去鍵盤焦點。 |

<a id="ref-methods"></a>

## Ref 方法

| 方法 | Rust | 說明 |
|---|---|---|
| `focus()` | `focus()`（`OtpInputApi`） | 取得鍵盤焦點並顯示軟鍵盤，與按下輸入元件的效果相同。 |

<a id="parts"></a>

## 組成部分

| 部分 | 位置 | 樣式設定 |
|---|---|---|
| 輸入元件 | | `class`、`style` |
| 群組 | 輸入元件內，每組一個 | `groupClass`、`groupStyle`；`disabled:` 跟隨輸入元件 |
| 格子 | 所屬群組內，每位數字一個 | `cellClass`、`cellStyle`；輸入元件取得焦點時，`focus:` 作用於接收下一位數字的格子，`data-filled:` 作用於每個已有數字的格子，`disabled:` 跟隨輸入元件 |
| 數字 | 已填入的格子 | 格子的文字樣式（`text-xl`、`font-semibold`）；`•` 在 `masked` 時套用 |
| 游標 | 接收下一位數字的空格子，且輸入元件取得焦點時 | `caretClass`、`caretStyle` |

接收下一位數字的格子，是最後一位數字之後的格子；驗證碼填滿後則是最後一個格子。游標如文字欄位的游標般閃爍（亮半秒、暗半秒，每次編輯後會短暫保持不閃），透過其不透明度以原生方式實現，同時在版面配置中保留其位置；啟用減少動態效果時則保持靜止。按下輸入元件的任何位置都會使其取得焦點：欄位覆蓋在格子上方。

已有數字的格子（無論是否遮蔽）帶有屬性 `data-filled`，因此 `data-filled:` 類別可為使用者已填入的格子設定樣式（更粗的邊框、填色：`data-filled:border-foreground data-filled:bg-muted`），寫法與 shadcn/ui 對其狀態的寫法相同。當 `group` 位於 `cellClass` 中時，`group-data-filled:` 類別可為已填入格子內的內容（即其數字）設定樣式。格子只會更改類別，絕不更改內容，因此按一個鍵只會重新設定一個格子的樣式，不會重新繪製任何內容。

<a id="accessibility"></a>

## 無障礙設計

- 螢幕閱讀器只會找到一個文字欄位，其名稱由 `accessibilityLabel` 提供（說明驗證碼的用途及長度：「驗證碼，6 位數字」），其值為驗證碼；格子對螢幕閱讀器隱藏。當 `masked` 時，欄位為安全欄位，因此驗證碼不會被朗讀。
- 鍵盤由平台提供：手機上為數字鍵盤，桌面電腦上為任何鍵盤（只接受數字），以及 Backspace。Tab 可像移至任何文字欄位一樣移至輸入元件。
- 當 `disabled` 時，它不會取得焦點，螢幕閱讀器會說明它已停用。

有關標籤、角色及播報的一般說明，請參閱 [無障礙設計](../docs/accessibility.md)。

<a id="platform-notes"></a>

## 平台備註

- iOS：欄位為驗證碼欄位（`textContentType` `oneTimeCode`），因此 QuickType 列會提供來自「訊息」或「郵件」的驗證碼，並會彈出數字鍵盤。`masked` 欄位在失去焦點後再次輸入時會重新開始，與 iOS 的安全欄位一致。
- Android：`autofillHints` `smsOTPCode` 讓鍵盤和自動填入服務可提供短訊中的驗證碼；並會彈出數字鍵盤。
- macOS、Windows、Linux 和網頁：輸入和貼上會傳送至欄位（在瀏覽器中，使用 `inputmode="numeric"` 以顯示手機的數字鍵盤），而指標移到格子上時會顯示 I-beam 指標。
