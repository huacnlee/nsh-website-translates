---
title: "表單與鍵盤"
description: "使用 input 元素處理文字輸入：受控與非受控的值、鍵盤類型、換行鍵、焦點、選取範圍、可自動增高的多行輸入框，以及如何讓內容不被軟體鍵盤遮住。"
order: 42
group: ui
demo: guide-forms
source_hash: a7bed0645c77c155
---

# 表單與鍵盤

文字輸入使用 input 元素，Rust 中為 `input()`，TSX 中為 `<Input>`：在 iOS 上是 UITextField 或 UITextView，在 Android 上是 EditText。輸入文字、插入點、選取、自動校正與自動填入皆由平台原生處理；你的 app 透過事件取得文字，並可加以控制。NSH 也會自動讓取得焦點的輸入保持在軟體鍵盤上方，對於它無法自行處理的情況，則提供鍵盤高度作為響應式的值。

input 和任何 view 一樣可以套用樣式（Rust 使用型別化的樣式方法，TSX 使用 styles 與 Tailwind class），因此表單欄位可以呈現 app 自己的外觀。帶標籤的欄位只需自行撰寫一個簡短的元件：

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

## 受控與非受控輸入

當你傳入 input 的值（`.value(..)`，TSX 為 `value`）時，它就是**受控**的：它顯示 signal 所持有的內容，而你要從變更事件（`.on_change(..)`，TSX 為 `onChange`）更新該 signal。

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

由於值由你控制，你可以轉換使用者輸入的內容：`.on_change(move |t: &str| tag.set(t.to_uppercase()))` 會轉為大寫，`onChange={({ value }) => code.set(value.replace(/[^0-9]/g, ""))}` 只保留數字。

<a id="input-methods"></a>

### 輸入法

中文、日文與韓文輸入法會先組字再提交文字：拼音在選定字之後才會變成 腾。`onCompositionChange`（Rust 為 `.on_composition_change(..)`）會持續回報組字過程，使用者輸入時回報 `{ composing: true, text: "teng" }`，組字結束時回報 `{ composing: false, text: "" }`；提交的文字會在結束之前送達 `onChange`。在 iOS、Android、macOS 與 web 上，`onChange` 也會回報正在組字的文字，因為這些系統把組字內容保留在輸入框中；在 Windows、Linux 與 GPUI 上，它則回報已提交的文字。無論 app 如何處理該值，受控輸入都會讓組字持續進行：使用者組字期間設定的 `value` 會在組字結束後才顯示，因此會轉為大寫或過濾文字的輸入，仍能正常接受按原樣輸入的拼音。

一個只搜尋已提交文字的搜尋框：

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

沒有 value 的輸入則是**非受控**的：它自行保存文字，從預設值開始（`.default_value(..)`，TSX 為 `defaultValue`），需要時再從變更或送出事件讀取。適用於只在送出時才讀取的欄位，例如密碼。

> [!NOTE]
> 受控輸入絕不會遺失按鍵。每次原生編輯都帶有一個編輯計數，從 JS 傳回的 `value` 只有在對應最新一次編輯時才會被套用。如果 JS 處理較慢，而使用者在這段期間又輸入了更多內容，過期的值會被丟棄，而不會覆蓋較新的文字。

<a id="props"></a>

## 屬性

在 Rust 中，每個屬性都是 `input()` 的方法，以 snake case 命名（`.placeholder(..)`、`.masked(true)`、`.max_length(6)`、`.return_key_type(ReturnKeyType::Next)`、`.selected_range((0, 4))`），但以下幾個有自己的名稱：`.keyboard_type(KeyboardType::Email)` 與其他 `KeyboardType` 變體、對應 `autoComplete` 的 `.auto_fill(AutoFill::Email)`、以及對應 `ios={{ … }}` 屬性的 `.keyboard_appearance(..)` 和 `.input_accessory(..)`。每個事件都是 `on_` 的方法：`.on_change(|text: &str| ..)`、`.on_submit(|text: &str| ..)`、`.on_focus(..)`、`.on_blur(..)`、`.on_selection_change(|s: &Selection| ..)`、`.on_key_press(|key: &str| ..)`、`.on_content_size_change(|size: &Size<Points>| ..)`。

| 屬性 | 型別 | 預設值 | 說明 |
|---|---|---|---|
| `value` | `string` | | 文字，由 JS 控制。 |
| `defaultValue` | `string` | | 非受控輸入的初始文字。 |
| `placeholder` | `string` | | 輸入為空時顯示。 |
| `masked` | `boolean` | `false` | 隱藏文字（密碼）。 |
| `keyboardType` | `KeyboardType` | `"default"` | 鍵盤配置。 |
| `returnKeyType` | `ReturnKeyType` | `"default"` | Return 鍵的標籤。 |
| `autoCapitalize` | `"none" \| "sentences" \| "words" \| "characters"` | `"sentences"` | 自動大寫。 |
| `autoCorrect` | `boolean` | `true` | 系統的校正功能。 |
| `autoComplete` | `AutoComplete` | | 輸入所裝載的內容類型，供自動填入使用。 |
| `multiline` | `boolean` | `false` | 多行；除非 `submitBehavior` 另有指定，否則 Return 會插入換行。 |
| `maxLength` | `number` | | 使用者最多可輸入的字元數。 |
| `readonly` | `boolean` | `false` | 使用者可以選取並複製文字，但不能修改。 |
| `autoFocus` | `boolean` | `false` | 出現時即取得焦點。 |
| `submitBehavior` | `"submit" \| "blurAndSubmit" \| "newline"` | 單行為 `"blurAndSubmit"`，多行為 `"newline"` | Return 的行為：送出並保持焦點、送出並取消焦點，或插入換行（僅限多行）。 |
| `pasteBehavior` | `"insert" \| "report"` | `"insert"` | 貼上的行為：插入其文字，或不做任何事（[貼上](#pasting-images-and-files)）。 |
| `caret` | `boolean` | `true` | 繪製插入點；`false` 會隱藏它。 |
| `ios={{ keyboardAppearance }}` | `"default" \| "light" \| "dark"` | `"default"` | 鍵盤的外觀（iOS）。 |
| `selectedRange` | `{ start: number; end?: number }` | | 受控的選取範圍，以 UTF-16 單位表示。 |
| `allowFontScaling` | `boolean` | `true` | 跟隨系統文字大小。 |
| `maxFontSizeMultiplier` | `number` | | 系統縮放比例的上限（0：無上限）。 |
| `ios={{ inputAccessoryViewID }}` | `string` | | iOS：顯示在鍵盤上方的工具列（見下文）。 |
| `ios={{ textContentType }}` | `TextContentType` | | iOS 對 `autoComplete` 值的命名。 |

事件：

| 事件 | 承載資料 | 時機 |
|---|---|---|
| `onChange` | `{ value }` | 文字已變更：`value` 為目前的文字。 |
| `onSubmit` | `{ text }` | 在會送出的輸入中按下 Return 鍵（單行，或 `submitBehavior` `"submit"` / `"blurAndSubmit"`）。 |
| `onFocus` / `onBlur` | | 輸入取得 / 失去焦點。 |
| `onSelectionChange` | `{ start, end }` | 插入點或選取範圍移動（UTF-16 單位）。 |
| `onPaste` | `{ text, html, files, uris }` | 使用者貼上：文字、其 HTML（Linux、web）、以 `File` 表示的圖片、本機檔案的 URL（[貼上](#pasting-images-and-files)）。 |
| `onCaretMove` | `{ bounds, pageBounds }` | 插入點移動：它在輸入中與在視窗中的位置（[插入點](#the-caret)）。 |
| `onKeyPress` | `{ key }` | 文字變更之前：`key` 為輸入的文字，`"Backspace"` 或 `"Enter"`。 |
| `onContentSizeChange` | `{ size }` | 文字的大小（`size`）在輸入時發生變更（多行時以輸入的寬度計算）；空的輸入會回報一行空白，不論其 placeholder 為何。 |
| `onCompositionChange` | `{ composing, text }` | 輸入法的組字開始、變更或結束（見[輸入法](#input-methods)）。 |

input 的樣式與文字相同：`fontSize`、`color`、`fontFamily`、`textAlign`、`letterSpacing` 以及[文字樣式](./text.md)中的其他項目，再加上邊框、內距與背景。焦點樣式（Rust 中為 `.focus(|s| ..)`，TSX 中為 `focus:` Tailwind 變體或 `focusStyle`）會在輸入取得焦點時套用。placeholder 的顏色是 `.placeholder_color(..)`（`placeholderColor` 樣式鍵，`placeholder:text-*`），插入點的顏色是 `.caret_color(..)`（`caretColor`、`caret-*`），選取反白的顏色是 `.selection_color(..)`（`selectionColor`、`selection:text-*`）；UIKit 以同一種顏色為插入點與選取範圍著色，若有設定則採用插入點的顏色：

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
| `KeyboardType::Email` | `"email-address"` | 文字，並方便輸入 `@` 與 `.`。 |
| `KeyboardType::Url` | `"url"` | 文字，附有 `/` 與 `.com`。 |
| `KeyboardType::Number` | `"number-pad"` | 僅有數字：沒有正負號與小數點（驗證碼、PIN）。 |
| `KeyboardType::Decimal` | `"decimal-pad"` | 數字與小數點。 |
| `KeyboardType::Numeric` | `"numeric"` | 與 React Native 相同：iOS 上為小數數字鍵盤；Android 上為含正負號與小數點的數字。 |
| `KeyboardType::NumbersAndPunctuation` | `"numbers-and-punctuation"` | 數字、負號與標點符號（iOS 的數字與標點鍵盤；Android 上為含正負號與小數點的數字）。在 iOS 上輸入負數時請使用它。 |
| `KeyboardType::Phone` | `"phone-pad"` | 電話撥號鍵盤。 |

在 iOS 上，`.keyboard_appearance(KeyboardAppearance::Dark)`（TSX 為 `ios={{ keyboardAppearance: "dark" }}`；或 light，為預設值）會讓鍵盤呈現淺色或深色外觀，而不論系統的外觀為何，適用於在淺色模式下的深色 app。Android 的鍵盤一律跟隨系統主題。

自動填入（`.auto_fill(AutoFill::Email)`，TSX 為 `autoComplete`）告訴系統欄位所裝載的內容，讓系統能提供已儲存的姓名、地址、密碼，以及來自訊息的一次性驗證碼。Rust 的 `AutoFill` 為每種類型提供一個變體（`Name`、`GivenName`、`FamilyName`、`Email`、`Tel`、`Username`、`Password`、`NewPassword`、`OneTimeCode`、`StreetAddress`、`PostalCode`、`Country`、`CreditCardNumber`、`Url`、`Birthdate`、...，以及 `Off`）。TSX 接受以下的值：`"name"`、`"given-name"`、`"family-name"`、`"email"`、`"tel"`、`"username"`、`"current-password"`、`"new-password"`、`"one-time-code"`、`"street-address"`、`"postal-code"`、`"country"`、`"cc-number"`、`"cc-exp"`、`"cc-csc"`、`"url"`、`"birthdate-full"` 等，或 `"off"`；iOS 自己的名稱（`"emailAddress"`、`"oneTimeCode"`、...）也可在 `autoComplete` 或 `ios={{ textContentType }}` 中使用。

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

## Return 鍵與欄位間切換

Return 鍵類型（`.return_key_type(ReturnKeyType::Next)`，TSX 為 `returnKeyType`）決定 Return 鍵的標籤：default、done、go、next、search 或 send。送出行為（`.submit_behavior(..)`，TSX 為 `submitBehavior`）則決定按下它後會發生什麼事：

| Rust | TSX | Return | 預設用於 |
|---|---|---|---|
| `SubmitBehavior::BlurAndSubmit` | `"blurAndSubmit"` | 觸發送出事件，然後輸入失去焦點 | 單行輸入 |
| `SubmitBehavior::Submit` | `"submit"` | 觸發送出事件；輸入保持焦點 | |
| `SubmitBehavior::Newline` | `"newline"` | 插入換行（僅限多行輸入） | 多行輸入 |

設為 `"submit"` 或 `"blurAndSubmit"` 的多行輸入會在按下 Return 時送出，如同聊天訊息編輯器，且仍會自動換行；在實體鍵盤（桌面電腦、Mac、平板的鍵盤）上，Shift+Return 或 Option / Alt+Return 會插入換行。若 Return 是用來提交輸入法的組字（例如中文或日文輸入），則只會提交組字內容，絕不會送出。

若要移到下一個欄位，請保存各輸入的 ref（Rust 中的 `element_ref()` 與 `.element_ref(&r)`，TSX 中的 `ref`），並呼叫 `focus()`：

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

在第一個欄位使用不失焦的送出（`SubmitBehavior::Submit`、`submitBehavior="submit"`），能在焦點移動時讓鍵盤保持顯示，避免鍵盤收起後又再升起。按下 Return 即送出並保持焦點的聊天輸入，也以同樣方式送出（見[下方](#content-outside-scroll-views)的訊息編輯器）。

最大長度與送出行為都在原生層強制執行：使用者輸入時，平台會詢問「是否可以加入這個字元？」與「Return 是否應結束編輯？」，而 NSH 直接根據屬性回答，無須等待 JS。

<a id="focus-from-code"></a>

## 以程式碼控制焦點

input 的 ref 提供以下方法：

| Rust | TSX | 說明 |
|---|---|---|
| `focus()` | `focus()` | 讓輸入取得焦點並顯示鍵盤。 |
| `blur()` | `blur()` | 取消其焦點。 |
| `set_selection(start, end)` | `setSelection(start, end?)` | 選取 `start..end`（UTF-16 單位）；兩者相等時為插入點（TSX：不帶 `end`）。 |

在 macOS 與 web 上，對可接受按壓的 view 的 ref 呼叫 `focus()` 與 `blur()`，會像 Tab 鍵一樣移動鍵盤焦點（[鍵盤焦點](../elements/index.md#keyboard-focus)）。

Rust 中的 `dismiss_keyboard()` 以及 TSX 中來自 `nsh` 的 `Keyboard.dismiss()`，會取消目前取得焦點的任何輸入的焦點：

```rust tabs
view().on_press(|| dismiss_keyboard())
```

```tsx tabs
import { View, Keyboard } from "nsh";

<View onPress={() => Keyboard.dismiss()}>…</View>
```

<a id="selection"></a>

## 選取範圍

選取事件（`.on_selection_change(..)`，TSX 為 `onSelectionChange`）會回報插入點與選取範圍；ref 的 `set_selection` 或選取範圍（`.selected_range(..)`，TSX 為 `selectedRange`）可用來設定它們。位置採用 UTF-16 code unit，與 JavaScript 字串索引相同，因此在 TSX 中 `text.slice(start, end)` 即為被選取的文字；在 Rust 中，請對文字的 UTF-16 單位進行切片。

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

## 插入點

插入點事件（`.on_caret_move(..)`，TSX 為 `onCaretMove`）會告知插入點的位置，讓屬於插入點的內容可以在該處開啟：`@` 提及的建議清單、斜線命令的選單、表情符號選擇器。`bounds` 是輸入中的一個 `Bounds`（`origin` 與 `size`，已套用輸入的內距與捲動），寬度與平台繪製的插入點相同，高度與其所在行相同；`pageBounds` 是同一個方框在視窗（或輸入所在的對話框）中的位置，覆蓋層可將其作為 `anchor`。只要輸入取得焦點，每當插入點移動時就會觸發此事件：隨選取範圍移動，以及輸入的文字捲動或換行到其他行時。在 Rust 中，覆蓋層以 `.anchor_bounds(..)` 相對於方框定位。

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

`pageBounds` 是事件送出時插入點所在的位置：在輸入下方捲動的頁面會移動輸入，但不會送出事件，因此請在頁面捲動時關閉建議清單，或將它們錨定在輸入本身。

<a id="pasting-images-and-files"></a>

## 貼上圖片與檔案

貼上事件（`.on_paste(..)`，TSX 為 `onPaste`）會告知使用者貼上了什麼，來源可以是鍵盤快速鍵、選單的貼上，或鍵盤的圖片功能：`text`、`html`、`files` 與 `uris`。`html` 是帶有格式的相同內容，如同瀏覽器、辦公室軟體或富文字編輯器複製時的樣子（在 Linux 與 web 上）。`files` 是剪貼簿中以資料形式保存的內容，例如螢幕截圖或從網頁或其他 app 複製的圖片：其位元組可供 app 上傳或顯示的 `File`，名稱為 `image.png`（或其本身的類型）。`uris` 是在檔案管理員中複製的檔案的 `file:` URL，與檔案拖放的相同。平台只會在使用者貼上的當下讀取剪貼簿，之後不會再讀取。

輸入會一如往常自行插入貼上的文字：此事件會在該文字的 `onChange` 之前觸發。圖片與檔案絕不會被插入，因為輸入只存放文字。使用 `pasteBehavior` `"report"` 時，輸入不會插入任何內容，由 app 決定貼上要做什麼：將長文字作為附件送出，或插入清理後的版本。輸入會立即根據該屬性做出決定，因為系統是當場詢問它。

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

貼上的檔案可像任何 `File` 一樣上傳，使用 `fetch` 與 `FormData`（`form.append("image", file)`）；其位元組在送出之前都保留在原生層。在 Android 上，插入圖片（GIF、貼圖）的鍵盤也以同樣方式回報。在 Linux 上，剪貼簿是非同步讀取的，因此事件可能會在其所插入文字的 `onChange` 之後才觸發。macOS 上的遮罩輸入會保留 AppKit 自己的貼上行為，且不回報任何內容。

<a id="multiline-inputs-that-grow"></a>

## 自動增高的多行輸入

多行輸入（`.multiline(true)`，TSX 為 `multiline`）會在自身高度內捲動其文字。若要讓它隨內容增高，請將內容大小事件的高度（`.on_content_size_change(..)`，TSX 為 `onContentSizeChange`）回饋到它的樣式中，並設定上限：

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

回報的高度是文字的高度（以輸入的寬度計算），因此請如上所示自行加上垂直內距。
<a id="keeping-inputs-above-the-keyboard"></a>

## 讓輸入框保持在鍵盤上方

<a id="inside-scroll-views-automatic"></a>

### 在 scroll view 內：自動處理

當鍵盤出現在位於 scroll view 或列表內、且已取得焦點的輸入框上方時，NSH 會為該 scroll view 加上與鍵盤等高的底部 inset，並將輸入框捲動到可見範圍。這是原生行為，不需要撰寫任何程式碼。一個長表單其實就是一個由輸入框組成的 scroll view：

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

關閉模式（`.keyboard_dismiss_mode(..)`，TSX 為 `keyboardDismissMode`：none、on drag、interactive）可讓使用者拖曳表單來收起鍵盤；處理點擊（`.keyboard_taps(KeyboardTaps::Handled)`，TSX 為 `keyboardShouldPersistTaps="handled"`）則讓鍵盤顯示時點擊按鈕能直接生效，而不是只用來關閉鍵盤。請參閱 [Scrolling](./scrolling.md#scroll-views-and-the-keyboard)。

<a id="content-outside-scroll-views"></a>

### scroll view 以外的內容

在 iOS 上，當鍵盤會遮住一個不在任何 scroll view 內、且已取得焦點的輸入框時，NSH 會沿著鍵盤的動畫曲線將其所在畫面（或對話框）的內容向上移動，直到輸入框剛好位於鍵盤上方；當鍵盤收起或輸入框失去焦點時，內容會再沿曲線移回原位，行為與 SwiftUI 相同（在 Android 上，處於 `adjustPan` 模式的視窗則由系統進行平移）。只有在應用程式自身的版面配置仍讓輸入框被遮住時，NSH 才會這麼做：如果應用程式已如下所述自行預留空間，就不會再次移動內容。

這樣會移動整個頁面。若要讓固定在畫面底部的訊息列跟著鍵盤上移，同時讓上方的內容縮小，請以 CSS 的 `env(keyboard-inset-height)`（`paddingBottom: "env(keyboard-inset-height)"`，Tailwind 為 `pb-[env(keyboard-inset-height)]`，Rust 為 `.pb_keyboard()`）為畫面底部加上 padding：它會在底部預留與鍵盤等高的空間，並與鍵盤同步以原生方式產生動畫。

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

Padding（`.pb_keyboard()`）會縮小上方的內容，而背景仍延伸到畫面底部；底部 margin（`marginBottom: "env(keyboard-inset-height)"`、`.mb_keyboard()`）則會讓整個 view 在鍵盤頂端結束。`calc(env(keyboard-inset-height) + <length>)`（Rust 為 `.pb_keyboard_plus(..)`、`.mb_keyboard_plus(..)`）可加上一個長度，例如減去 view 下方 tab bar 的高度。

完整高度適用於延伸到介面底部的 view，例如畫面的內容。在視窗會因鍵盤而調整大小的 Android 主機上，視窗本身會縮小，此時該變數為 0。請參閱 [Keyboard](../elements/keyboard.md)。

<a id="the-keyboard-accessor"></a>

### 鍵盤存取器

Rust 中的 `keyboard_height()` 與 `keyboard_duration()`，以及 TSX 中來自 `nsh` 的 `keyboardFrame()`（一個 `{ height, duration }`）都是響應式的：分別表示鍵盤延伸進介面的距離（隱藏時為 0；包含其下方的底部安全區域），以及其動畫持續時間（單位為毫秒）。任何自訂需求都可以讀取它們：例如在輸入時隱藏浮動按鈕，或調整面板大小。在鍵盤開始移動的那次更新中，隨它們變化的內容會跟著鍵盤移動，沿用鍵盤的動畫曲線，並從鍵盤開始移動的時間點起算（`LayoutCurve::Keyboard`），就像 `env(keyboard-inset-height)` 一樣；若應用程式為該次更新設定了動畫（`LayoutAnimation.configureNext`），則以應用程式設定的動畫為準。

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

## 鍵盤上方的工具列（iOS）：InputAccessoryView

Rust 中的 `input_accessory_view(id)` 與 TSX 中來自 `nsh/mobile` 的 `InputAccessoryView`，會在指定它的輸入框取得焦點時，顯示一個附著在鍵盤頂端的工具列：即 iOS 的 `inputAccessoryView`。它會以原生方式隨鍵盤移動，包括在互動式收起鍵盤的過程中。它在樹狀結構中的所在位置不佔用任何空間；輸入框透過其 id 來參照它（`.input_accessory(id)`，TSX 為 `ios={{ inputAccessoryViewID }}` 與 `nativeID`）：

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

工具列的寬度與視窗相同，高度則由其內容決定。Input accessory 是 iOS 專有的功能：在 Android 上，該工具列是一個空的隱藏 view，因此請把這些控制項放到其他位置，例如輸入框上方（Rust 中為 `os() == Os::Android`，TSX 中為 `platform.os === "android"`）。

<a id="related"></a>

## 相關內容

- [`Input`](../elements/input.md)：元素參考。
- [Keyboard](../elements/keyboard.md) 與 [`Keyboard`](../modules/nsh.md#keyboard-and-keyboardframe)。
- [`InputAccessoryView`](../modules/nsh-mobile.md#inputaccessoryview)：`InputAccessoryView`。
- [Scrolling](./scrolling.md#scroll-views-and-the-keyboard)：scroll view 中的鍵盤收起與點擊。
