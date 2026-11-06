---
title: "Input"
description: "原生文字欄位:受控與非受控文字、鍵盤、自動填入、選取範圍、多行輸入與焦點。"
group: base
demo: el-input
---


# Input

`Input` 是原生文字輸入欄位：在 iOS 與 Mac Catalyst 上是 UITextField（單行）或 UITextView（多行），在 Android 上則是 EditText。輸入、游標、選取、自動修正與自動填入皆由平台本身處理。Rust 以 `nsh_base::input()` 建立，TSX 則使用來自 `nsh/base` 的 `<Input>`。

```rust tabs
use nsh_base::input;
use nsh_core::prelude::*;

fn name_field() -> impl IntoElement {
    let name = signal(String::new());
    input()
        .value(name)
        .on_change(move |text: &str| name.set(text.to_string()))
        .placeholder("Your name")
        .auto_capitalize(AutoCapitalize::Words)
        .return_key_type(ReturnKeyType::Done)
        .text_base()
        .p_3()
        .border_1()
        .border_color(rgb(0xd0d7de))
        .rounded(px(8.0))
}
```

```tsx tabs
import { signal } from "nsh";
import { Input } from "nsh/base";

function NameField() {
  const name = signal("");
  return (
    <Input
      value={name()}
      onChange={({ value }) => name.set(value)}
      placeholder="Your name"
      autoCapitalize="words"
      returnKeyType="done"
      style={{ fontSize: 16, padding: 12, borderWidth: 1, borderColor: "#d0d7de", borderRadius: 8 }}
    />
  );
}
```

<a id="controlled-and-uncontrolled"></a>

## 受控與非受控

- **受控**：傳入 `value`，並在 `onChange` 中更新它。應用程式可以改寫使用者輸入的內容（例如去除空白、格式化）：文字會立即顯示該次編輯，並在新的 `value` 抵達時被修正。每次原生編輯都帶有一個計數，來自應用程式的 `value` 只有在以最新一次編輯為基礎時才會被套用，因此較新的輸入永遠優先於較慢的更新。
- **非受控**：傳入 `defaultValue`（`.default_value(..)`，或不傳），並從 `onChange` 或 `onSubmit` 讀取文字。

使用者輸入期間必須成立的規則是 props，由原生端處理：`maxLength` 限制長度，`submitBehavior` 決定 return 鍵的行為。請參閱[表單與鍵盤](../docs/forms-and-keyboard.md)。

## Props

除了[通用 props](./index.md#common-props)（其中 `style` 的型別為 `TextStyle`：字型、顏色、對齊與檢視樣式皆適用）之外：

<a id="text"></a>

### 文字

| Prop | Rust | 型別 | 預設值 | 說明 |
|---|---|---|---|---|
| `value` | `.value(..)` | `string` | | 文字，由應用程式控制。 |
| `defaultValue` | `.default_value(..)` | `string` | | 初始文字。 |
| `placeholder` | `.placeholder(..)` | `string` | | 輸入欄位為空時顯示。 |
| `multiline` | `.multiline(..)` | `boolean` | `false` | 多行；除非 `submitBehavior` 另有指定，否則 return 會插入換行。 |
| `scrollbar` | `.scrollbar(..)` | `boolean \| ScrollbarTheme` | `true` | 多行輸入欄位的捲軸：使用平台的指示器，或在應用程式設定後使用其內建捲軸（[Scrollbar](./scrollbar.md#built-in-bars)）；傳入物件則為其專屬的主題，`false` 表示不顯示。 |
| `maxLength` | `.max_length(..)` | `number` | | 使用者最多可輸入的字元數。 |
| `readonly` | `.readonly(..)` | `boolean` | `false` | 使用者可以選取並複製文字，但無法修改。 |
| `masked` | `.masked(..)` | `boolean` | `false` | 文字會被隱藏（用於密碼）。 |
| `allowFontScaling` | | `boolean` | `true` | 跟隨系統文字大小。 |
| `maxFontSizeMultiplier` | | `number` | `0` | 系統縮放比例的上限（0 表示無上限）。 |

<a id="keyboard"></a>

### 鍵盤

| Prop | Rust | 型別 | 預設值 | 說明 |
|---|---|---|---|---|
| `keyboardType` | `.keyboard_type(KeyboardType::Email)` | `"default" \| "number-pad" \| "decimal-pad" \| "numeric" \| "numbers-and-punctuation" \| "email-address" \| "phone-pad" \| "url"` | `"default"` | 鍵盤配置（[可用值](../docs/forms-and-keyboard.md#keyboards-and-autofill)；在 iOS 上 `numbers-and-punctuation` 含有減號）。 |
| `returnKeyType` | `.return_key_type(ReturnKeyType::Next)` | `"default" \| "done" \| "go" \| "next" \| "search" \| "send"` | `"default"` | return 鍵的標籤。 |
| `autoCapitalize` | `.auto_capitalize(AutoCapitalize::None)` | `"none" \| "sentences" \| "words" \| "characters"` | `"sentences"` | 自動大寫。 |
| `autoCorrect` | `.auto_correct(..)` | `boolean` | `true` | 系統的修正功能。 |
| `autoComplete` | `.auto_fill(AutoFill::OneTimeCode)` | `AutoComplete \| TextContentType` | | 輸入欄位所存放的內容，供 iOS、Android 與網頁的自動填入使用：`"username"`、`"current-password"`、`"new-password"`、`"one-time-code"`、`"email"`、`"tel"`、`"postal-code"`、`"cc-number"`、`"off"`、… |
| `pasteBehavior` | `.paste_behavior(PasteBehavior::Report)` | `"insert" \| "report"` | `"insert"` | 貼上時的行為：`"insert"` 會插入貼上的文字，`"report"` 則不插入任何內容，交由應用程式處理 `onPaste` 所回報的內容。圖片與檔案永遠不會被插入。 |
| `submitBehavior` | `.submit_behavior(SubmitBehavior::Submit)` | `"submit" \| "blurAndSubmit" \| "newline"` | `"blurAndSubmit"`（單行）、`"newline"`（多行） | return 鍵的行為：`"submit"` 會回報 `onSubmit` 並保持焦點，`"blurAndSubmit"` 還會取消焦點，`"newline"` 會插入換行（多行；單行則為提交）。在實體鍵盤上，提交型的多行輸入欄位仍可透過 Shift+Return 或 Option / Alt+Return 輸入換行。`"submit"` 會讓鍵盤保持顯示（例如連續傳送多則訊息）。 |
| `autoFocus` | `.auto_focus(..)` | `boolean` | `false` | 出現時取得焦點。 |

<a id="caret-and-selection"></a>

### 游標與選取

| Prop | Rust | 型別 | 說明 |
|---|---|---|---|
| `caret` | `.caret(..)` | `boolean` | 是否繪製游標（預設 `true`；`false` 會隱藏游標）。 |
| `selectedRange` | `.selected_range((start, end))` | `{ start: number; end?: number }` | 受控的選取範圍，以 UTF-16 單位計算；`end` 預設為 `start`（即游標）。 |

游標會在其視窗顯示且處於作用中時閃爍。在 Linux 的 GPUI 視窗中，若十秒內未輸入或移動游標，游標會保持顯示，與 GTK 應用程式相同，因此被擱置的焦點欄位不會消耗任何影格。

<a id="colors"></a>

### 顏色

預留位置、游標與選取高亮的顏色是樣式鍵，各有對應的 Tailwind class，在 Rust 中則為方法（UIKit 以同一種顏色為游標與選取著色，若已設定則採用游標的顏色）：

| 樣式鍵 | Rust | Class | 說明 |
|---|---|---|---|
| `placeholderColor` | `.placeholder_color(..)` | `placeholder:text-*` | 預留位置的顏色。 |
| `caretColor` | `.caret_color(..)` | `caret-*` | 游標的顏色。 |
| `selectionColor` | `.selection_color(..)` | `selection:text-*` | 選取高亮的顏色。 |

```rust tabs
input()
    .placeholder("Search")
    .text_color(rgb(0x18181b))
    .placeholder_color(rgb(0x9ca3af))
    .caret_color(rgb(0x2563eb))
    .selection_color(rgb(0x93c5fd))
```

```tsx tabs
<Input placeholder="Search" class="text-zinc-900 placeholder:text-zinc-400 selection:text-blue-600" />
<Input placeholder="Search" style={{ placeholderColor: "#9ca3af", caretColor: "#2563eb", selectionColor: "#93c5fd" }} />
```

### iOS

| `ios` 鍵 | Rust | 型別 | 說明 |
|---|---|---|---|
| `textContentType` | `.auto_fill(..)` | `AutoComplete \| TextContentType` | iOS 對 `autoComplete` 的命名（`"oneTimeCode"`、`"newPassword"`、…）。 |
| `inputAccessoryViewID` | `.input_accessory(id)` | `string` | 在輸入欄位取得焦點期間，顯示於鍵盤上方的 `InputAccessoryView`（[`InputAccessoryView`](../modules/nsh-mobile.md#inputaccessoryview)）的 `nativeID`。 |
| `keyboardAppearance` | `.keyboard_appearance(KeyboardAppearance::Dark)` | `"default" \| "light" \| "dark"` | 鍵盤的外觀；`"default"` 跟隨系統的外觀。Android 的鍵盤跟隨系統的主題。 |

```rust tabs
use nsh_core::element::AutoFill;

input().auto_fill(AutoFill::OneTimeCode).keyboard_type(KeyboardType::Number)
```

```tsx tabs
<Input autoComplete="one-time-code" keyboardType="number-pad" ios={{ textContentType: "oneTimeCode" }} />
```

<a id="events"></a>

## 事件

| 事件 | Rust | Payload | 時機 |
|---|---|---|---|
| `onChange` | `.on_change(\|text: &str\| ..)` | `{ value }` | 使用者更改了文字：`value` 為目前的文字。 |
| `onSubmit` | `.on_submit(\|text: &str\| ..)` | `{ text }` | 在會提交的輸入欄位中按下 return 鍵（單行，或 `submitBehavior` `"submit"` / `"blurAndSubmit"`）。 |
| `onFocus` / `onBlur` | `.on_focus` / `.on_blur` | 無 | 輸入欄位取得／失去焦點。 |
| `onSelectionChange` | `.on_selection_change(\|s: &Selection\| ..)` | `{ start, end }` | 游標或選取範圍移動（UTF-16 單位）。 |
| `onPaste` | `.on_paste(\|e: &PasteEvent\| ..)` | `{ text, html, files, uris }` | 使用者貼上內容：包含文字、其 HTML 格式（Linux、網頁）、以 `File` 表示的圖片（例如螢幕截圖），以及本機檔案的 `file:` URL。發生於其所插入文字的 `onChange` 之前（[表單與鍵盤](../docs/forms-and-keyboard.md#pasting-images-and-files)）。 |
| `onCaretMove` | `.on_caret_move(\|e: &CaretEvent\| ..)` | `{ bounds, pageBounds }` | 游標移動，無論是隨選取範圍移動，或因文字捲動或換行而移動：`bounds` 為其在輸入欄位中的位置，`pageBounds` 為其在視窗中的位置，以及 `Overlay` 的 `anchor`（[表單與鍵盤](../docs/forms-and-keyboard.md#the-caret)）。 |
| `onKeyPress` | `.on_key_press(\|key: &str\| ..)` | `{ key }` | 文字變更之前：`key` 為輸入的文字，`"Backspace"` 或 `"Enter"`。 |
| `onContentSizeChange` | `.on_content_size_change(\|size: &Size<Points>\| ..)` | `{ size }` | 文字的尺寸在輸入時發生變化（多行時以輸入欄位的寬度計算）；空的輸入欄位會回報一個空行，不論其預留位置為何。 |
| `onCompositionChange` | `.on_composition_change(\|e: &Composition\| ..)` | `{ composing, text }` | 輸入法的組字開始、變更或結束：`text` 為正在組字的內容（選字前的拼音、轉換前的假名），結束後為 `""`。已確認的文字會在結束之前傳送到 `onChange`。 |

會隨文字增長的多行輸入欄位：

```rust tabs
let height = signal(px(40.0));

input()
    .multiline(true)
    .on_content_size_change(move |size: &Size<Points>| {
        height.set(px((size.height.0 + 16.0).clamp(40.0, 120.0)));
    })
    .h(move || height.get())
    .px_3()
    .py_2()
```

```tsx tabs
const height = signal(40);
<Input
  multiline
  onContentSizeChange={({ size }) => height.set(Math.min(120, Math.max(40, size.height + 16)))}
  style={{ height: height(), paddingHorizontal: 12, paddingVertical: 8 }}
/>;
```

<a id="ref-methods"></a>

## Ref 方法

| 方法 | Rust | 說明 |
|---|---|---|
| `focus()` | `focus()` | 讓輸入欄位取得焦點並顯示鍵盤。 |
| `blur()` | `blur()` | 取消其焦點。 |
| `setSelection(start, end?)` | `set_selection(start, end)` | 選取 `start..end`（UTF-16 單位）；兩者相等時為游標。 |

按下 return 時將焦點移到下一個欄位：

```rust tabs
use nsh_core::element::AutoFill;

let password = element_ref();

view()
    .child(input().return_key_type(ReturnKeyType::Next).on_submit(move |_: &str| password.focus()))
    .child(input().element_ref(&password).masked(true).auto_fill(AutoFill::Password))
```

```tsx tabs
let password!: InputRef;
<>
  <Input returnKeyType="next" onSubmit={() => password.focus()} />
  <Input ref={password} masked autoComplete="current-password" />
</>;
```

來自 `nsh` 的 `Keyboard.dismiss()`（Rust 中為 `dismiss_keyboard()`）會隱藏鍵盤，不論是哪個輸入欄位持有它。

<a id="platform-notes"></a>

## 平台注意事項

- 在 macOS 上，單行文字、預留位置與游標共用原生欄位的字型度量，並一起在內容框內置中。`lineHeight` 會參與版面配置；多行編輯器也會用它來決定段落間距。
- 位於[捲動檢視](./scroll.md#keyboard)內的輸入欄位會由原生端自動避開鍵盤。在其他情況下，請使用等同 [`env(keyboard-inset-height)`](./keyboard.md) 的底部 padding 或 margin。
- `disabled` 會停用輸入欄位（無法取得焦點），同時套用停用樣式；`readonly` 的輸入欄位則保有其焦點與選取範圍。
- `inputAccessoryViewID` 適用於 iOS，因為該平台的鍵盤具有附屬列。
