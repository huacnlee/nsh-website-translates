---
title: "表單與鍵盤"
description: "使用 input 元素處理文字輸入:受控與非受控的值、鍵盤類型、換行鍵(Return 鍵)、焦點、選取範圍、自動增高的多行輸入框,以及讓內容避開軟體鍵盤。"
order: 42
group: ui
demo: guide-forms
source_hash: a7bed0645c77c155
---


# 表單與鍵盤

如果輸入框內文字有變，輸入元件就是文字輸入元件，Rust 中為 `input()`，TSX 中為 `<Input>`：在 iOS 上是 UITextField 或 UITextView，在 Android 上是 EditText。輸入、游標、選取、自動修正和自動填入都由平台負責；你的應用程式透過事件取得文字，並可控制文字內容。NSH 亦會自動讓獲得焦點的輸入框保持在軟鍵盤上方，並把鍵盤高度以響應式數值提供給你，用於它本身無法處理的情況。

輸入框與任何 view 一樣可以套用樣式（Rust 使用具型別的樣式方法，TSX 使用樣式和 Tailwind class），因此表單中的欄位可以具備你應用程式自己的外觀。帶標籤的欄位只是你自己寫的一個簡短元件：

```rust tabs
use nsh_core::prelude::*;

fn field(label: &'static str, value: Signal<String>, masked: bool) -> impl IntoElement {
    let focused = signal(false);
    view()
        .gap_1()
        .child(text(label).text_sm().text_color(rgb(0x737373)))
        .child(
            input()
                .value(move || value.get())
                .on_change(move |text: &str| value.set(text.to_owned()))
                .masked(masked)
                .on_focus(move || focused.set(true))
                .on_blur(move || focused.set(false))
                .rounded_lg()
                .border_1()
                .px_3()
                .py_2()
                .text_base()
                .border_color(move || if focused.get() { rgb(0x0969da) } else { rgb(0xd0d7de) }),
        )
}
```

```tsx tabs
import { signal, Text, View } from "nsh";
import { Input } from "nsh/base";

function Field(props: { label: string; value: string; onChange: (e: { value: string }) => void; masked?: boolean }) {
  const focused = signal(false);
  return (
    <View class="gap-1">
      <Text class="text-sm text-neutral-500">{props.label}</Text>
      <Input
        value={props.value}
        onChange={props.onChange}
        masked={props.masked}
        onFocus={() => focused.set(true)}
        onBlur={() => focused.set(false)}
        class="rounded-lg border px-3 py-2 text-base"
        style={{ borderColor: focused() ? "#0969da" : "#d0d7de" }}
      />
    </View>
  );
}
```

<a id="controlled-and-uncontrolled-inputs"></a>

## 受控與非受控輸入框

傳入 value（`.value(..)`，TSX 為 `value`）的輸入框是**受控**的：它顯示你的 signal 所持有的內容，而你從 change 事件（`.on_change(..)`，TSX 為 `onChange`）更新該 signal。

```rust tabs
use nsh_core::prelude::*;

#[component]
pub fn App() -> impl IntoElement {
    let name = signal(String::new());
    view()
        .flex_1()
        .p(px(16.0))
        .pt(px(60.0))
        .gap(px(8.0))
        .child(
            input()
                .value(move || name.get())
                .on_change(move |text: &str| name.set(text.to_owned()))
                .placeholder("Your name")
                .text_size(px(17.0))
                .border_1()
                .border_color(rgb(0xd0d7de))
                .rounded(px(10.0))
                .p(px(12.0)),
        )
        .child(text(move || {
            let name = name.get();
            format!("Hello, {}", if name.is_empty() { "stranger" } else { &name })
        }))
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { Input } from "nsh/base";

function App() {
  const name = signal("");
  return (
    <View style={{ flex: 1, padding: 16, paddingTop: 60, gap: 8 }}>
      <Input
        value={name()}
        onChange={({ value }) => name.set(value)}
        placeholder="Your name"
        style={{ fontSize: 17, borderWidth: 1, borderColor: "#d0d7de", borderRadius: 10, padding: 12 }}
      />
      <Text>Hello, {name() || "stranger"}</Text>
    </View>
  );
}

mount(App);
```

由於 value 由你控制，你可以轉換使用者輸入的內容：`.on_change(move |t: &str| tag.set(t.to_uppercase()))` 轉為大寫，`onChange={({ value }) => code.set(value.replace(/[^0-9]/g, ""))}` 只保留數字。

<a id="input-methods"></a>

### 輸入法

中文、日文和韓文輸入法會先組字再提交文字：拼音在選定字詞後才變成「腾」。`onCompositionChange`（Rust 為 `.on_composition_change(..)`）會即時回報組字過程，使用者輸入時為 `{ composing: true, text: "teng" }`，組字結束時為 `{ composing: false, text: "" }`；提交的文字會在結束前先送到 `onChange`。在 iOS、Android、macOS 和 web 上，`onChange` 亦會回報正在組字的文字，因為這些系統把組字中的文字保留在輸入框內；在 Windows、Linux 和 GPUI 上，它回報的是已提交的文字。無論應用程式如何處理 value，受控輸入框都會讓組字持續進行：使用者組字期間設定的 `value` 會在組字結束後才顯示，因此轉大寫或過濾文字的輸入框，對拼音輸入也會照常處理。

只搜尋已提交文字的搜尋框：

```rust tabs
let query = signal(String::new());
let composing = signal(false);
input()
    .value(move || query.get())
    .on_change(move |text: &str| {
        query.set(text.to_owned());
        if !composing.get() {
            search(text);
        }
    })
    .on_composition_change(move |e: &Composition| {
        composing.set(e.composing);
        if !e.composing {
            search(&query.get());
        }
    })
```

```tsx tabs
const query = signal("");
let composing = false;
<Input
  value={query()}
  onChange={({ value }) => {
    query.set(value);
    if (!composing) search(value);
  }}
  onCompositionChange={(e) => {
    composing = e.composing;
    if (!e.composing) search(query());
  }}
/>
```

沒有 value 的輸入框是**非受控**的：它自行保管文字，起始內容為預設值（`.default_value(..)`，TSX 為 `defaultValue`），需要時再從 change 或 submit 事件讀取。這適用於只在提交時才讀取的欄位，例如密碼。

> [!NOTE]
> 受控輸入框不會遺失任何按鍵。每次原生編輯都帶有一個編輯計數，而從 JS 傳回的 `value` 只有在回應最新一次編輯時才會被套用。如果 JS 反應較慢，而使用者在此期間又輸入了更多內容，過時的 value 會被丟棄，而不會覆蓋較新的文字。

<a id="props"></a>

## 屬性

在 Rust 中，每個屬性都是 `input()` 的方法，以 snake case 命名（`.placeholder(..)`、`.masked(true)`、`.max_length(6)`、`.return_key_type(ReturnKeyType::Next)`、`.selected_range((0, 4))`），以下為各自獨有的名稱：`.keyboard_type(KeyboardType::Email)` 及其他 `KeyboardType` 變體、用於 `autoComplete` 的 `.auto_fill(AutoFill::Email)`、用於 `ios={{ … }}` 屬性的 `.keyboard_appearance(..)` 和 `.input_accessory(..)`。每個事件都是 `on_` 方法：`.on_change(|text: &str| ..)`、`.on_submit(|text: &str| ..)`、`.on_focus(..)`、`.on_blur(..)`、`.on_selection_change(|s: &Selection| ..)`、`.on_key_press(|key: &str| ..)`、`.on_content_size_change(|size: &Size<Points>| ..)`。

| 屬性 | 類型 | 預設值 | 說明 |
|---|---|---|---|
| `value` | `string` | | 由 JS 控制的文字。 |
| `defaultValue` | `string` | | 非受控輸入框的初始文字。 |
| `placeholder` | `string` | | 輸入框為空時顯示。 |
| `masked` | `boolean` | `false` | 隱藏文字（密碼）。 |
| `keyboardType` | `KeyboardType` | `"default"` | 鍵盤配置。 |
| `returnKeyType` | `ReturnKeyType` | `"default"` | 換行鍵的標籤。 |
| `autoCapitalize` | `"none" \| "sentences" \| "words" \| "characters"` | `"sentences"` | 自動大寫。 |
| `autoCorrect` | `boolean` | `true` | 系統的修正功能。 |
| `autoComplete` | `AutoComplete` | | 輸入框所容納的內容類別，供自動填入使用。 |
| `multiline` | `boolean` | `false` | 多行；除非 `submitBehavior` 另有指定，否則按換行鍵會插入換行。 |
| `maxLength` | `number` | | 使用者最多可輸入的字元數。 |
| `readonly` | `boolean` | `false` | 使用者可以選取和複製文字，但不能修改。 |
| `autoFocus` | `boolean` | `false` | 出現時即獲得焦點。 |
| `submitBehavior` | `"submit" \| "blurAndSubmit" \| "newline"` | 單行為 `"blurAndSubmit"`，多行為 `"newline"` | 按換行鍵的行為：提交並保持焦點、提交並取消焦點，或插入換行（僅限多行）。 |
| `pasteBehavior` | `"insert" \| "report"` | `"insert"` | 貼上的行為：插入其文字，或不作任何處理（[貼上](#pasting-images-and-files)）。 |
| `caret` | `boolean` | `true` | 繪製游標；`false` 會隱藏游標。 |
| `ios={{ keyboardAppearance }}` | `"default" \| "light" \| "dark"` | `"default"` | 鍵盤的外觀（iOS）。 |
| `selectedRange` | `{ start: number; end?: number }` | | 受控的選取範圍，以 UTF-16 單位計算。 |
| `allowFontScaling` | `boolean` | `true` | 跟隨系統的文字大小。 |
| `maxFontSizeMultiplier` | `number` | | 系統縮放比例的上限（0：不設上限）。 |
| `ios={{ inputAccessoryViewID }}` | `string` | | iOS：顯示在鍵盤上方的工具列（見下文）。 |
| `ios={{ textContentType }}` | `TextContentType` | | iOS 對 `autoComplete` 值所用的名稱。 |

事件：

| 事件 | 負載 | 時機 |
|---|---|---|
| `onChange` | `{ value }` | 文字已改變：`value` 為目前的文字。 |
| `onSubmit` | `{ text }` | 在會提交的輸入框中按下換行鍵（單行，或 `submitBehavior` `"submit"` / `"blurAndSubmit"`）。 |
| `onFocus` / `onBlur` | | 輸入框獲得 / 失去焦點。 |
| `onSelectionChange` | `{ start, end }` | 游標或選取範圍移動（UTF-16 單位）。 |
| `onPaste` | `{ text, html, files, uris }` | 使用者貼上內容：文字、其 HTML（Linux、web）、以 `File` 表示的圖片，以及本機檔案的 URL（[貼上](#pasting-images-and-files)）。 |
| `onCaretMove` | `{ bounds, pageBounds }` | 游標移動：其在輸入框內和在視窗內的位置（[游標](#the-caret)）。 |
| `onKeyPress` | `{ key }` | 文字改變之前：`key` 為輸入的文字，`"Backspace"` 或 `"Enter"`。 |
| `onContentSizeChange` | `{ size }` | 文字的尺寸（`size`）在輸入時改變（多行時以輸入框的寬度計算）；空的輸入框無論其 placeholder 為何，都回報一行空白。 |
| `onCompositionChange` | `{ composing, text }` | 輸入法的組字開始、改變或結束（見[輸入法](#input-methods)）。 |

輸入框的樣式與文字相同：`fontSize`、`color`、`fontFamily`、`textAlign`、`letterSpacing` 以及[文字樣式](./text.md)的其餘部分，另加邊框、padding 和背景。焦點樣式（Rust 中為 `.focus(|s| ..)`，TSX 中為 `focus:` Tailwind 變體或 `focusStyle`）會在輸入框擁有焦點時套用。placeholder 的顏色為 `.placeholder_color(..)`（
`placeholderColor` 樣式鍵，`placeholder:text-*`），游標的顏色為 `.caret_color(..)`（`caretColor`、`caret-*`），選取範圍標示的顏色為 `.selection_color(..)`
（`selectionColor`、`selection:text-*`）；UIKit 以同一種顏色為游標和選取範圍著色，若有設定則採用游標的顏色：

```rust tabs
input()
    .placeholder("Search")
    .rounded_lg()
    .border_1()
    .border_color(rgb(0xd4d4d8))
    .px_3()
    .py_2()
    .text_base()
    .focus(|s| s.border_color(rgb(0x3b82f6)))
    .placeholder_color(rgb(0xa1a1aa))
    .selection_color(rgb(0x2563eb))
```

```tsx tabs
<Input
  class="rounded-lg border border-zinc-300 px-3 py-2 text-base focus:border-blue-500 placeholder:text-zinc-400 selection:text-blue-600"
  placeholder="Search"
/>
```

<a id="keyboards-and-autofill"></a>

## 鍵盤與自動填入

鍵盤類型（`.keyboard_type(..)`，TSX 為 `keyboardType`）決定鍵盤配置：

| Rust | TSX | 鍵盤 |
|---|---|---|
| `KeyboardType::Default` | `"default"` | 文字。 |
| `KeyboardType::Email` | `"email-address"` | 文字，並方便輸入 `@` 和 `.`。 |
| `KeyboardType::Url` | `"url"` | 文字，附有 `/` 和 `.com`。 |
| `KeyboardType::Number` | `"number-pad"` | 只有數字：沒有正負號，沒有小數分隔符號（驗證碼、PIN）。 |
| `KeyboardType::Decimal` | `"decimal-pad"` | 數字和小數分隔符號。 |
| `KeyboardType::Numeric` | `"numeric"` | 與 React Native 相同：iOS 的小數鍵盤；在 Android 上為帶有正負號和小數分隔符號的數字鍵盤。 |
| `KeyboardType::NumbersAndPunctuation` | `"numbers-and-punctuation"` | 數字、負號和標點符號（iOS 的數字與標點鍵盤；在 Android 上為帶有正負號和小數分隔符號的數字鍵盤）。在 iOS 上輸入負數時使用。 |
| `KeyboardType::Phone` | `"phone-pad"` | 電話撥號鍵盤。 |

在 iOS 上，`.keyboard_appearance(KeyboardAppearance::Dark)`（TSX 為 `ios={{ keyboardAppearance: "dark" }}`；或 light，預設）會讓鍵盤呈現淺色或深色外觀，不受系統外觀影響，適用於在淺色模式下的深色應用程式。Android 的鍵盤一律跟隨系統主題。

自動填入（`.auto_fill(AutoFill::Email)`，TSX 為 `autoComplete`）告訴系統該欄位所容納的內容，讓系統可以提供已儲存的姓名、地址、密碼，以及來自訊息的一次性驗證碼。Rust 的 `AutoFill` 為每種類別提供一個變體（`Name`、`GivenName`、`FamilyName`、`Email`、`Tel`、`Username`、`Password`、`NewPassword`、`OneTimeCode`、`StreetAddress`、`PostalCode`、`Country`、`CreditCardNumber`、`Url`、`Birthdate`……，以及 `Off`）。TSX 接受以下值：`"name"`、`"given-name"`、`"family-name"`、`"email"`、`"tel"`、`"username"`、`"current-password"`、`"new-password"`、`"one-time-code"`、`"street-address"`、`"postal-code"`、`"country"`、`"cc-number"`、`"cc-exp"`、`"cc-csc"`、`"url"`、`"birthdate-full"` 及其他，或 `"off"`；iOS 自己的名稱（`"emailAddress"`、`"oneTimeCode"`……）也可使用，放在 `autoComplete` 或 `ios={{ textContentType }}` 中。

```rust tabs
use nsh_core::element::AutoFill;

input()
    .keyboard_type(KeyboardType::Email)
    .auto_capitalize(AutoCapitalize::None)
    .auto_correct(false)
    .auto_fill(AutoFill::Email)
    .placeholder("E-mail")
input().masked(true).auto_fill(AutoFill::NewPassword).placeholder("Password")
input()
    .keyboard_type(KeyboardType::Number)
    .auto_fill(AutoFill::OneTimeCode)
    .max_length(6)
    .placeholder("Code")
```

```tsx tabs
<Input keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" placeholder="E-mail" />
<Input masked autoComplete="new-password" placeholder="Password" />
<Input keyboardType="number-pad" autoComplete="one-time-code" maxLength={6} placeholder="Code" />
```

<a id="the-return-key-and-moving-between-fields"></a>

## 換行鍵與在欄位之間移動

換行鍵類型（`.return_key_type(ReturnKeyType::Next)`，TSX 為 `returnKeyType`）決定換行鍵的標籤：default、done、go、next、search 或 send。提交行為（`.submit_behavior(..)`，TSX 為 `submitBehavior`）則決定按下它時會發生甚麼：

| Rust | TSX | 換行鍵 | 預設適用於 |
|---|---|---|---|
| `SubmitBehavior::BlurAndSubmit` | `"blurAndSubmit"` | 觸發 submit 事件，然後輸入框失去焦點 | 單行輸入框 |
| `SubmitBehavior::Submit` | `"submit"` | 觸發 submit 事件；輸入框保持焦點 | |
| `SubmitBehavior::Newline` | `"newline"` | 插入換行（僅限多行輸入框） | 多行輸入框 |

設定了 `"submit"` 或 `"blurAndSubmit"` 的多行輸入框會在按下換行鍵時送出，就像聊天輸入框一樣，並且仍會自動換行；在實體鍵盤上（桌上電腦、Mac、平板電腦的鍵盤），按 Shift+Return 或 Option / Alt+Return 會插入換行。用來確認輸入法組字（例如中文或日文輸入）的換行鍵，只會確認組字，不會提交。

若要移到下一個欄位，請保留各輸入框的 ref（Rust 中為 `element_ref()` 和 `.element_ref(&r)`，TSX 中為 `ref`），然後呼叫 `focus()`：

```rust tabs
use nsh_core::prelude::*;

pub fn sign_in() -> impl IntoElement {
    let email = signal(String::new());
    let password = element_ref();
    let submit = move || log::info!("sign in {}", email.get());
    view()
        .flex_1()
        .p(px(16.0))
        .pt(px(60.0))
        .gap(px(12.0))
        .child(
            input()
                .value(move || email.get())
                .on_change(move |t: &str| email.set(t.to_owned()))
                .keyboard_type(KeyboardType::Email)
                .auto_capitalize(AutoCapitalize::None)
                .return_key_type(ReturnKeyType::Next)
                .submit_behavior(SubmitBehavior::Submit)
                .on_submit(move |_: &str| password.focus())
                .placeholder("E-mail"),
        )
        .child(
            input()
                .element_ref(&password)
                .masked(true)
                .return_key_type(ReturnKeyType::Go)
                .on_submit(move |_: &str| submit())
                .placeholder("Password"),
        )
}
```

```tsx tabs
import { type InputRef, mount, signal, View } from "nsh";
import { Input } from "nsh/base";

function SignIn() {
  const email = signal("");
  let password!: InputRef;
  const submit = () => console.log("sign in", email());
  return (
    <View style={{ flex: 1, padding: 16, paddingTop: 60, gap: 12 }}>
      <Input
        value={email()}
        onChange={({ value }) => email.set(value)}
        keyboardType="email-address"
        autoCapitalize="none"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmit={() => password.focus()}
        placeholder="E-mail"
      />
      <Input ref={password} masked returnKeyType="go" onSubmit={submit} placeholder="Password" />
    </View>
  );
}

mount(SignIn);
```

在第一個欄位使用不失去焦點的提交（`SubmitBehavior::Submit`、`submitBehavior="submit"`），可在焦點移動期間保持鍵盤顯示，這樣鍵盤就不會收起後再升起。在送出後保持焦點的聊天輸入框，提交方式也是一樣（見[下方](#content-outside-scroll-views)的輸入框範例）。

最大長度和提交行為都在原生層強制執行：使用者輸入時，平台會詢問「可以加入這個字元嗎？」和「換行鍵應該結束編輯嗎？」，而 NSH 會根據屬性直接回答，無需等待 JS。

<a id="focus-from-code"></a>

## 從程式碼控制焦點

輸入框的 ref 具有以下方法：

| Rust | TSX | 說明 |
|---|---|---|
| `focus()` | `focus()` | 讓輸入框獲得焦點並顯示鍵盤。 |
| `blur()` | `blur()` | 取消其焦點。 |
| `set_selection(start, end)` | `setSelection(start, end?)` | 選取 `start..end`（UTF-16 單位）；兩者相等時為游標（TSX：不帶 `end`）。 |

在 macOS 和 web 上，在接受按下操作的 view 的 ref 上呼叫 `focus()` 和 `blur()`，會像按 Tab 鍵一樣移動鍵盤焦點（[鍵盤焦點](../elements/index.md#keyboard-focus)）。

Rust 中的 `dismiss_keyboard()` 和 TSX 中來自 `nsh` 的 `Keyboard.dismiss()` 會取消目前擁有焦點的任何輸入框的焦點：

```rust tabs
view().on_press(|| dismiss_keyboard())
```

```tsx tabs
import { View, Keyboard } from "nsh";

<View onPress={() => Keyboard.dismiss()}>…</View>
```

<a id="selection"></a>

## 選取範圍

selection 事件（`.on_selection_change(..)`，TSX 為 `onSelectionChange`）回報游標和選取範圍；ref 的 `set_selection` 或所選範圍（`.selected_range(..)`，TSX 為 `selectedRange`）可以設定它們。位置以 UTF-16 code unit 計算，與 JavaScript 字串索引相同，因此在 TSX 中 `text.slice(start, end)` 就是所選的文字；在 Rust 中，則需要切割文字的 UTF-16 單位。

```rust tabs
/// `start..end` of `text` in UTF-16 units, as inputs count.
fn utf16_slice(text: &str, start: u32, end: u32) -> String {
    let units: Vec<u16> = text.encode_utf16().collect();
    let end = (end as usize).min(units.len());
    String::from_utf16_lossy(&units[(start as usize).min(end)..end])
}

let content = signal("Select part of this text".to_owned());
let range = signal(Selection::default());
let field = element_ref();

view()
    .child(
        input()
            .element_ref(&field)
            .value(move || content.get())
            .on_change(move |t: &str| content.set(t.to_owned()))
            .on_selection_change(move |r: &Selection| range.set(*r)),
    )
    .child(text(move || {
        let r = range.get();
        format!("Selected: \"{}\"", content.with(|t| utf16_slice(t, r.start, r.end)))
    }))
    .child(
        view()
            .on_press(move || {
                let len = content.with(|t| t.encode_utf16().count()) as u32;
                field.set_selection(0, len);
            })
            .child(text("Select all")),
    )
```

```tsx tabs
const text = signal("Select part of this text");
const range = signal({ start: 0, end: 0 });
const selection = signal<{ start: number; end?: number } | undefined>(undefined);

<Input
  value={text()}
  onChange={({ value }) => text.set(value)}
  selectedRange={selection()}
  onSelectionChange={(r) => range.set(r)}
/>
<Text>Selected: "{text().slice(range().start, range().end)}"</Text>
<View onPress={() => selection.set({ start: 0, end: text().length })}><Text>Select all</Text></View>
```

<a id="the-caret"></a>

## 游標

caret 事件（`.on_caret_move(..)`，TSX 為 `onCaretMove`）說明游標所在的位置，讓屬於游標處的內容可以在該處開啟：例如 `@` 提及的建議、斜線指令的選單、表情符號選擇器。`bounds` 是輸入框內的一個 `Bounds`
（`origin` 和 `size`，已套用輸入框的 padding 和捲動），寬度與平台繪製的游標相同，高度與其所在行相同；`pageBounds` 是同一個方框在視窗（或輸入框所在的對話框）中的位置，浮層會把它當作其 `anchor`。事件會在輸入框擁有焦點期間，每當游標移動時發出：隨選取範圍移動，以及輸入框的文字捲動或換行到其他行時。在 Rust 中，浮層會以 `.anchor_bounds(..)`
相對於方框來定位。

```rust tabs
let draft = signal(String::new());
let end = signal(0u32);
let caret = signal(None::<Bounds<Points>>);

view()
    .child(
        input()
            .multiline(true)
            .value(move || draft.get())
            .on_change(move |t: &str| draft.set(t.to_owned()))
            .on_selection_change(move |s: &Selection| end.set(s.end))
            .on_caret_move(move |e: &CaretEvent| {
                // Suggestions while the word before the caret starts with "@".
                let typed = draft.with(|t| utf16_slice(t, 0, end.get()));
                let word = typed.rsplit(char::is_whitespace).next().unwrap_or("");
                caret.set(word.starts_with('@').then_some(e.page_bounds));
            })
            .p_2(),
    )
    .child(when(
        move || caret.get().is_some(),
        move || {
            overlay()
                .anchor_bounds(move || caret.get().unwrap_or_default())
                .placement(Placement::Bottom)
                .align(Align::Start)
                .offset(px(4.0))
                .child(text("@ada"))
                .child(text("@grace"))
        },
    ))
```

```tsx tabs
import { type Bounds, Overlay, Text, View, signal } from "nsh";
import { Input } from "nsh/base";

const draft = signal("");
const end = signal(0);
const caret = signal<Bounds | null>(null);

<View>
  <Input
    multiline
    value={draft()}
    onChange={({ value }) => draft.set(value)}
    onSelectionChange={(e) => end.set(e.end)}
    onCaretMove={(e) => {
      // Suggestions while the word before the caret starts with "@".
      const word = draft().slice(0, end()).split(/\s/).pop() ?? "";
      caret.set(word.startsWith("@") ? e.pageBounds : null);
    }}
    class="p-2"
  />
  <If when={caret()}>
    <Overlay anchor={caret()} placement="bottom" align="start" offset={4}>
      <Text>@ada</Text>
      <Text>@grace</Text>
    </Overlay>
  </If>
</View>;
```

`pageBounds` 是事件發出時游標所在的位置：在輸入框下方捲動的頁面會移動輸入框，但不會發出事件，因此請在頁面捲動時關閉建議，或把建議錨定在輸入框本身。

<a id="pasting-images-and-files"></a>

## 貼上圖片和檔案

paste 事件（`.on_paste(..)`，TSX 為 `onPaste`）說明使用者貼上了甚麼，無論是來自鍵盤快速鍵、選單的「貼上」，還是鍵盤的圖片功能：`text`、`html`、`files` 和 `uris`。`html` 是同一內容連同其格式，就像瀏覽器、辦公軟件或富文字編輯器複製時的樣子（在 Linux 和 web 上）。`files` 是剪貼簿以資料形式持有的內容，例如螢幕截圖，或從網頁或其他應用程式複製的圖片：它們是 `File`，其位元組可供應用程式上傳或顯示，名稱為
`image.png`（或其所屬類型）。`uris` 是在檔案管理員中複製的檔案的 `file:` URL，與檔案拖放的相同。
平台只會在使用者貼上的當下讀取剪貼簿，其他時候不會讀取。

輸入框一如往常，會自行插入貼上的文字：事件會在該文字的 `onChange` 之前發出。
圖片和檔案絕不會被插入，因為輸入框只容納文字。若設定 `pasteBehavior` `"report"`，輸入框不會插入任何內容，由應用程式決定貼上的處理方式：把長文字作為附件送出，或插入清理過的版本。
輸入框會根據該屬性即時決定，因為系統會當場詢問它。

```rust tabs
let attachments = signal(Vec::<PastedFile>::new());

input()
    .multiline(true)
    .placeholder("Message")
    .on_paste(move |e: &PasteEvent| {
        // A screenshot pasted into the message goes along as an image.
        attachments.update(|a| a.extend(e.files.iter().cloned()));
    })
    .p_2()
```

```tsx tabs
import { signal } from "nsh";
import { Input } from "nsh/base";

const attachments = signal<File[]>([]);

<Input
  multiline
  placeholder="Message"
  onPaste={(e) => {
    // A screenshot pasted into the message goes along as an image.
    attachments.update((a) => [...a, ...e.files]);
  }}
  class="p-2"
/>;
```

貼上的檔案可以像任何 `File` 一樣上傳，使用 `fetch` 和 `FormData`（`form.append("image", file)`）；在送出之前，其位元組會保留在原生層。在 Android 上，插入圖片（GIF、貼圖）的鍵盤也以同樣方式回報這些內容。在
Linux 上，剪貼簿以非同步方式讀取，因此事件可能在其插入的文字的 `onChange` 之後才發出。
macOS 上的遮罩輸入框沿用 AppKit 自己的貼上行為，不會回報任何內容。

<a id="multiline-inputs-that-grow"></a>

## 會隨內容增長的多行輸入框

多行輸入框（`.multiline(true)`，TSX 為 `multiline`）會在自身高度內捲動文字。若要讓它隨內容增長，請把 content size 事件的高度（`.on_content_size_change(..)`，TSX 為 `onContentSizeChange`）回饋到它的樣式中，並設定上限：

```rust tabs
let height = signal(px(0.0));

input()
    .multiline(true)
    .placeholder("Write a comment")
    .on_content_size_change(move |e: &Size<Points>| height.set(e.height.min(px(120.0))))
    .text_size(px(16.0))
    .p(px(10.0))
    .border_1()
    .border_color(rgb(0xd0d7de))
    .rounded(px(10.0))
    .h(move || height.get().max(px(20.0)) + px(20.0))
```

```tsx tabs
const height = signal(0);

<Input
  multiline
  placeholder="Write a comment"
  onContentSizeChange={({ size }) => height.set(Math.min(size.height, 120))}
  style={{ fontSize: 16, padding: 10, borderWidth: 1, borderColor: "#d0d7de", borderRadius: 10, height: Math.max(height(), 20) + 20 }}
/>
```

回報的高度是文字本身的高度（以輸入框的寬度計算），因此請如上所示自行加上垂直 padding。
<a id="keeping-inputs-above-the-keyboard"></a>

## 讓輸入框保持在鍵盤上方

<a id="inside-scroll-views-automatic"></a>

### 在捲動視圖內:自動處理

當鍵盤出現在位於捲動視圖或列表內的焦點輸入框上方時,NSH 會為該捲動視圖加上與鍵盤同高的底部內距,並將輸入框捲動至可見位置。這是原生行為,無需撰寫任何程式碼。長表單其實就是由多個輸入框組成的捲動視圖:

```rust tabs
scroll()
    .flex_1()
    .keyboard_dismiss_mode(KeyboardDismissMode::OnDrag)
    .keyboard_taps(KeyboardTaps::Handled)
    .child(view().p(px(16.0)).gap(px(12.0)) /* inputs */)
```

```tsx tabs
<Scroll style={{ flex: 1 }} keyboardDismissMode="on-drag" keyboardShouldPersistTaps="handled">
  <View style={{ padding: 16, gap: 12 }}>
    {/* inputs */}
  </View>
</Scroll>
```

收起模式(`.keyboard_dismiss_mode(..)`,TSX 為 `keyboardDismissMode`:none、on drag、interactive)讓使用者拖動表單即可收起鍵盤;已處理的點按(`.keyboard_taps(KeyboardTaps::Handled)`,TSX 為 `keyboardShouldPersistTaps="handled"`)讓鍵盤顯示期間點按按鈕時可直接觸發按鈕,而不是只收起鍵盤。請參閱 [Scrolling](./scrolling.md#scroll-views-and-the-keyboard)。

<a id="content-outside-scroll-views"></a>

### 捲動視圖以外的內容

在 iOS 上,當鍵盤會遮住不在任何捲動視圖內的焦點輸入框時,NSH 會沿著鍵盤的動畫曲線,將該畫面(或對話框)的內容向上移動,直至輸入框剛好位於鍵盤上方;當鍵盤收起或輸入框失去焦點時,內容會再向下移回,行為與 SwiftUI 相同(在 Android 上,處於 `adjustPan` 模式的視窗則由系統平移)。NSH 只會處理應用程式自身佈局仍未避開的被遮擋部分:如果應用程式已按下文方式自行預留空間,內容就不會再被移動。

這種做法會移動整個頁面。如果希望固定在畫面底部的訊息欄隨鍵盤升起,而上方內容改為縮小,請為畫面底部加上 CSS 的 `env(keyboard-inset-height)`(`paddingBottom: "env(keyboard-inset-height)"`,Tailwind 為 `pb-[env(keyboard-inset-height)]`,Rust 為 `.pb_keyboard()`)內距:它會在底部預留與鍵盤同高的空間,並以原生方式與鍵盤同步產生動畫。

```rust tabs
use nsh_core::prelude::*;

pub fn chat_screen() -> impl IntoElement {
    let draft = signal(String::new());
    let send = move || {
        let text = draft.get();
        if !text.trim().is_empty() {
            log::info!("send {text}");
        }
        draft.set(String::new());
    };
    view()
        .flex_1()
        .pb_keyboard()
        .child(scroll().flex_1().keyboard_dismiss_mode(KeyboardDismissMode::Interactive) /* messages */)
        .child(
            view()
                .flex_row()
                .p(px(8.0))
                // Above the home indicator, unless the keyboard covers it.
                .pb(move || {
                    px(8.0) + if keyboard_height() > px(0.0) { px(0.0) } else { safe_area().bottom }
                })
                .child(
                    input()
                        .value(move || draft.get())
                        .on_change(move |t: &str| draft.set(t.to_owned()))
                        .multiline(true)
                        .submit_behavior(SubmitBehavior::Submit)
                        .return_key_type(ReturnKeyType::Send)
                        .on_submit(move |_: &str| send())
                        .placeholder("Message")
                        .flex_1()
                        .max_h(px(120.0)),
                ),
        )
}
```

```tsx tabs
import { Scroll, signal, View, keyboardFrame, safeAreaInsets } from "nsh";
import { Input } from "nsh/base";

function ChatScreen() {
  const insets = safeAreaInsets();
  const draft = signal("");
  const send = () => {
    if (draft().trim()) console.log("send", draft());
    draft.set("");
  };
  return (
    <View style={{ flex: 1, paddingBottom: "env(keyboard-inset-height)" }}>
      <Scroll style={{ flex: 1 }} keyboardDismissMode="interactive">
        {/* messages */}
      </Scroll>
      <View
        style={{
          flexDirection: "row",
          padding: 8,
          // Above the home indicator, unless the keyboard covers it.
          paddingBottom: 8 + (keyboardFrame().height > 0 ? 0 : insets().bottom),
        }}
      >
        <Input
          value={draft()}
          onChange={({ value }) => draft.set(value)}
          multiline
          submitBehavior="submit"
          returnKeyType="send"
          onSubmit={send}
          placeholder="Message"
          style={{ flex: 1, maxHeight: 120 }}
        />
      </View>
    </View>
  );
}
```

內距(`.pb_keyboard()`)會令上方內容縮小,而背景仍然延伸至畫面底部;底部外距(`marginBottom: "env(keyboard-inset-height)"`、`.mb_keyboard()`)則會令整個視圖在鍵盤頂部結束。`calc(env(keyboard-inset-height) + <length>)`(Rust 為 `.pb_keyboard_plus(..)`、`.mb_keyboard_plus(..)`)可加上一個長度,例如減去視圖下方分頁列的高度。

完整高度適用於延伸至介面底部的視圖,例如畫面的內容。在視窗會因鍵盤而調整大小的 Android 主機上,視窗本身會縮小,而該變數為 0。請參閱 [Keyboard](../elements/keyboard.md)。

<a id="the-keyboard-accessor"></a>

### 鍵盤存取器

Rust 中的 `keyboard_height()` 和 `keyboard_duration()`,以及 TSX 中從 `nsh` 匯入的 `keyboardFrame()`(一個 `{ height, duration }`),都是響應式的:分別代表鍵盤伸入介面的距離(隱藏時為 0;包含其下方的底部安全區域),以及其動畫的時長(以毫秒計)。需要自訂處理時可讀取它們,例如在輸入時隱藏浮動按鈕,或調整面板大小。在鍵盤開始移動的那次更新中,隨它們一同變化的內容會跟隨鍵盤移動,採用鍵盤的動畫曲線,並以鍵盤開始移動的時間點計時(`LayoutCurve::Keyboard`),與 `env(keyboard-inset-height)` 相同;如果應用程式為該次更新設定了動畫(`LayoutAnimation.configureNext`),則以應用程式的設定為準。

```rust tabs
view().child(when(
    || keyboard_height() == px(0.0),
    || view().absolute().right(px(16.0)).bottom(px(16.0)), /* … */
))
```

```tsx tabs
import { View, keyboardFrame } from "nsh";

<If when={keyboardFrame().height === 0}>
  <View style={{ position: "absolute", right: 16, bottom: 16 }}>…</View>
</If>
```

<a id="a-bar-over-the-keyboard-ios-inputaccessoryview"></a>

## 鍵盤上方的工具列(iOS):InputAccessoryView

Rust 中的 `input_accessory_view(id)`,以及 TSX 中從 `nsh/mobile` 匯入的 `InputAccessoryView`,會在指定它的輸入框取得焦點期間,顯示一個附著於鍵盤頂部的工具列,即 iOS 的 `inputAccessoryView`。它會以原生方式隨鍵盤移動,包括在互動式收起期間。它在視圖樹中的位置不佔用任何空間;輸入框透過其 id 引用它(`.input_accessory(id)`,TSX 為 `ios={{ inputAccessoryViewID }}` 和 `nativeID`):

```rust tabs
use nsh_core::prelude::*;

pub fn note() -> impl IntoElement {
    let content = signal(String::new());
    let field = element_ref();
    view()
        .p(px(16.0))
        .child(
            input()
                .element_ref(&field)
                .value(move || content.get())
                .on_change(move |t: &str| content.set(t.to_owned()))
                .input_accessory("note-bar")
                .placeholder("A note"),
        )
        .child(
            input_accessory_view("note-bar").bg(rgb(0xf6f8fa)).child(
                view()
                    .flex_row()
                    .items_center()
                    .p(px(8.0))
                    .child(
                        text(move || format!("{} characters", content.with(|t| t.chars().count())))
                            .flex_1()
                            .text_color(rgb(0x57606a)),
                    )
                    .child(
                        text("Done")
                            .on_press(move || field.blur())
                            .text_color(rgb(0x0969da))
                            .font_weight(FontWeight::SEMIBOLD),
                    ),
            ),
        )
}
```

```tsx tabs
import { type InputRef, signal, Text, View } from "nsh";
import { Input } from "nsh/base";
import { InputAccessoryView } from "nsh/mobile";

function Note() {
  const text = signal("");
  let input!: InputRef;
  return (
    <View style={{ padding: 16 }}>
      <Input
        ref={input}
        value={text()}
        onChange={({ value }) => text.set(value)}
        ios={{ inputAccessoryViewID: "note-bar" }}
        placeholder="A note"
      />
      <InputAccessoryView nativeID="note-bar" style={{ backgroundColor: "#f6f8fa" }}>
        <View style={{ flexDirection: "row", alignItems: "center", padding: 8 }}>
          <Text style={{ flex: 1, color: "#57606a" }}>{text().length} characters</Text>
          <Text onPress={() => input.blur()} style={{ color: "#0969da", fontWeight: "600" }}>Done</Text>
        </View>
      </InputAccessoryView>
    </View>
  );
}
```

該工具列的寬度與視窗相同,高度則由其內容決定。輸入輔助工具列是 iOS 專有的:在 Android 上,該工具列是一個空白的隱藏視圖,因此請把這些控制項放在其他位置,例如輸入框上方(Rust 中為 `os() == Os::Android`,TSX 中為 `platform.os === "android"`)。

<a id="related"></a>

## 相關內容

- [`Input`](../elements/input.md):元素參考。
- [Keyboard](../elements/keyboard.md)與 [`Keyboard`](../modules/nsh.md#keyboard-and-keyboardframe)。
- [`InputAccessoryView`](../modules/nsh-mobile.md#inputaccessoryview):`InputAccessoryView`。
- [Scrolling](./scrolling.md#scroll-views-and-the-keyboard):捲動視圖中的鍵盤收起與點按。
