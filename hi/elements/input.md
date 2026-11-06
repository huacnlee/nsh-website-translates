---
title: "Input"
description: "नेटिव टेक्स्ट फ़ील्ड: नियंत्रित और अनियंत्रित टेक्स्ट, कीबोर्ड, ऑटोफ़िल, चयन, मल्टीलाइन इनपुट और फ़ोकस।"
group: base
demo: el-input
source_hash: 1f03d974252777de
---


# Input

`Input` एक native text field है: iOS और Mac Catalyst पर UITextField (single line) या UITextView (multiline), और Android पर EditText। टाइपिंग, caret, selection, autocorrection और autofill प्लेटफ़ॉर्म के अपने हैं। Rust में इसे `nsh_base::input()` से बनाया जाता है, और TSX में `nsh/base` से `<Input>` द्वारा।

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

## Controlled और uncontrolled

- **Controlled**: `value` पास करें और उसे `onChange` में अपडेट करें। ऐप उपयोगकर्ता के टाइप किए हुए टेक्स्ट को बदल सकता है (trim करना, format करना): टेक्स्ट में edit तुरंत दिखता है और नया `value` आते ही उसे सुधार दिया जाता है। हर native edit के साथ एक count होता है, और ऐप से आया `value` तभी लागू होता है जब वह नवीनतम edit पर आधारित हो, इसलिए नई टाइपिंग हमेशा धीमे अपडेट पर भारी पड़ती है।
- **Uncontrolled**: `defaultValue` पास करें (`.default_value(..)`, या कुछ नहीं) और टेक्स्ट को `onChange` या `onSubmit` से पढ़ें।

जो नियम उपयोगकर्ता के टाइप करते समय लागू रहने चाहिए, वे props हैं और native रूप से संभाले जाते हैं: `maxLength` लंबाई सीमित करता है और `submitBehavior` तय करता है कि return क्या करेगा। देखें [forms और keyboard](../docs/forms-and-keyboard.md)।

## Props

[common props](./index.md#common-props) के अलावा (`style` का type `TextStyle` है: font, color, alignment और view styles लागू होते हैं):

### Text

| Prop | Rust | Type | Default | Description |
|---|---|---|---|---|
| `value` | `.value(..)` | `string` | | टेक्स्ट, जिसे ऐप नियंत्रित करता है। |
| `defaultValue` | `.default_value(..)` | `string` | | शुरुआती टेक्स्ट। |
| `placeholder` | `.placeholder(..)` | `string` | | input खाली होने पर दिखता है। |
| `multiline` | `.multiline(..)` | `boolean` | `false` | कई पंक्तियाँ; return line break जोड़ता है, जब तक `submitBehavior` कुछ और न कहे। |
| `scrollbar` | `.scrollbar(..)` | `boolean \| ScrollbarTheme` | `true` | multiline input का scroll bar: प्लेटफ़ॉर्म का indicator, या ऐप का built-in bar जब ऐप ने कोई सेट किया हो ([Scrollbar](./scrollbar.md#built-in-bars)); object का अपना अलग theme होता है, `false` का मतलब कोई नहीं। |
| `maxLength` | `.max_length(..)` | `number` | | उपयोगकर्ता अधिकतम कितने characters दर्ज कर सकता है। |
| `readonly` | `.readonly(..)` | `boolean` | `false` | उपयोगकर्ता टेक्स्ट select और copy कर सकता है, लेकिन बदल नहीं सकता। |
| `masked` | `.masked(..)` | `boolean` | `false` | टेक्स्ट छिपा रहता है (passwords)। |
| `allowFontScaling` | | `boolean` | `true` | सिस्टम के टेक्स्ट आकार का पालन करें। |
| `maxFontSizeMultiplier` | | `number` | `0` | सिस्टम scale की ऊपरी सीमा (0 का मतलब कोई सीमा नहीं)। |

### Keyboard

| Prop | Rust | Type | Default | Description |
|---|---|---|---|---|
| `keyboardType` | `.keyboard_type(KeyboardType::Email)` | `"default" \| "number-pad" \| "decimal-pad" \| "numeric" \| "numbers-and-punctuation" \| "email-address" \| "phone-pad" \| "url"` | `"default"` | keyboard layout ([values](../docs/forms-and-keyboard.md#keyboards-and-autofill); iOS पर `numbers-and-punctuation` में minus sign होता है)। |
| `returnKeyType` | `.return_key_type(ReturnKeyType::Next)` | `"default" \| "done" \| "go" \| "next" \| "search" \| "send"` | `"default"` | return key का label। |
| `autoCapitalize` | `.auto_capitalize(AutoCapitalize::None)` | `"none" \| "sentences" \| "words" \| "characters"` | `"sentences"` | अपने-आप capitalization। |
| `autoCorrect` | `.auto_correct(..)` | `boolean` | `true` | सिस्टम के सुधार। |
| `autoComplete` | `.auto_fill(AutoFill::OneTimeCode)` | `AutoComplete \| TextContentType` | | input में क्या है, iOS, Android और web पर autofill के लिए: `"username"`, `"current-password"`, `"new-password"`, `"one-time-code"`, `"email"`, `"tel"`, `"postal-code"`, `"cc-number"`, `"off"`, … |
| `pasteBehavior` | `.paste_behavior(PasteBehavior::Report)` | `"insert" \| "report"` | `"insert"` | paste क्या करता है: `"insert"` paste किया हुआ टेक्स्ट जोड़ता है, `"report"` कुछ नहीं जोड़ता, ताकि ऐप `onPaste` की रिपोर्ट को संभाल सके। Images और files कभी नहीं जोड़ी जातीं। |
| `submitBehavior` | `.submit_behavior(SubmitBehavior::Submit)` | `"submit" \| "blurAndSubmit" \| "newline"` | `"blurAndSubmit"` (single line), `"newline"` (multiline) | return क्या करता है: `"submit"` `onSubmit` रिपोर्ट करता है और focus बनाए रखता है, `"blurAndSubmit"` focus भी हटा देता है, `"newline"` line break जोड़ता है (multiline; single line submit करती है)। जो multiline input submit करता है, वह hardware keyboards पर Shift+Return या Option / Alt+Return से line break फिर भी लेता है। `"submit"` keyboard को ऊपर रखता है (जैसे कई संदेश भेजने के लिए)। |
| `autoFocus` | `.auto_focus(..)` | `boolean` | `false` | दिखते ही focus पा लेता है। |

<a id="caret-and-selection"></a>

### Caret और selection

| Prop | Rust | Type | Description |
|---|---|---|---|
| `caret` | `.caret(..)` | `boolean` | caret बनाया जाता है (default `true`; `false` उसे छिपा देता है)। |
| `selectedRange` | `.selected_range((start, end))` | `{ start: number; end?: number }` | नियंत्रित selection, UTF-16 units में; `end` का default `start` है (एक caret)। |

caret तब तक blink करता है जब तक उसकी window दिख रही और active है। Linux पर GPUI windows में, GTK ऐप्स की तरह, टाइप करने या उसे हिलाने के दस सेकंड बाद वह स्थिर दिखता रहता है, इसलिए अकेला छोड़ा गया focused field कोई frames खर्च नहीं करता।

### Colors

placeholder, caret और selection highlight के colors style keys हैं, अपनी Tailwind classes के साथ, और Rust में methods हैं (UIKit caret और selection को एक ही color से tint करता है, और caret का color सेट होने पर वही लेता है):

| Style key | Rust | Class | Description |
|---|---|---|---|
| `placeholderColor` | `.placeholder_color(..)` | `placeholder:text-*` | placeholder का color। |
| `caretColor` | `.caret_color(..)` | `caret-*` | caret का color। |
| `selectionColor` | `.selection_color(..)` | `selection:text-*` | selection highlight का color। |

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

| `ios` key | Rust | Type | Description |
|---|---|---|---|
| `textContentType` | `.auto_fill(..)` | `AutoComplete \| TextContentType` | `autoComplete` के लिए iOS के नाम (`"oneTimeCode"`, `"newPassword"`, …)। |
| `inputAccessoryViewID` | `.input_accessory(id)` | `string` | input के focus में रहते समय keyboard के ऊपर दिखने वाले `InputAccessoryView` ([`InputAccessoryView`](../modules/nsh-mobile.md#inputaccessoryview)) का `nativeID`। |
| `keyboardAppearance` | `.keyboard_appearance(KeyboardAppearance::Dark)` | `"default" \| "light" \| "dark"` | keyboard का रूप; `"default"` सिस्टम के appearance का पालन करता है। Android के keyboards सिस्टम के theme का पालन करते हैं। |

```rust tabs
use nsh_core::element::AutoFill;

input().auto_fill(AutoFill::OneTimeCode).keyboard_type(KeyboardType::Number)
```

```tsx tabs
<Input autoComplete="one-time-code" keyboardType="number-pad" ios={{ textContentType: "oneTimeCode" }} />
```

## Events

| Event | Rust | Payload | When |
|---|---|---|---|
| `onChange` | `.on_change(\|text: &str\| ..)` | `{ value }` | उपयोगकर्ता ने टेक्स्ट बदला: `value` अब का टेक्स्ट है। |
| `onSubmit` | `.on_submit(\|text: &str\| ..)` | `{ text }` | उस input में return key दबाई गई जो submit करता है (single line, या `submitBehavior` `"submit"` / `"blurAndSubmit"`)। |
| `onFocus` / `onBlur` | `.on_focus` / `.on_blur` | कोई नहीं | input को focus मिला / उसने focus खोया। |
| `onSelectionChange` | `.on_selection_change(\|s: &Selection\| ..)` | `{ start, end }` | caret या selection हिला (UTF-16 units)। |
| `onPaste` | `.on_paste(\|e: &PasteEvent\| ..)` | `{ text, html, files, uris }` | उपयोगकर्ता ने paste किया: टेक्स्ट, उसकी formatting HTML के रूप में (Linux, web), images (screenshot) `File` के रूप में, local files के `file:` URLs। जो टेक्स्ट वह जोड़ता है उसके `onChange` से पहले ([forms और keyboard](../docs/forms-and-keyboard.md#pasting-images-and-files))। |
| `onCaretMove` | `.on_caret_move(\|e: &CaretEvent\| ..)` | `{ bounds, pageBounds }` | caret हिला, selection के साथ या टेक्स्ट के scroll या wrap होने पर: `bounds` input में उसकी जगह है, `pageBounds` window में, और `anchor` एक `Overlay` का ([forms और keyboard](../docs/forms-and-keyboard.md#the-caret))। |
| `onKeyPress` | `.on_key_press(\|key: &str\| ..)` | `{ key }` | टेक्स्ट बदलने से पहले: `key` टाइप किया गया टेक्स्ट है, `"Backspace"` या `"Enter"`। |
| `onContentSizeChange` | `.on_content_size_change(\|size: &Size<Points>\| ..)` | `{ size }` | टाइप करते समय टेक्स्ट का आकार बदला (multiline होने पर input की चौड़ाई पर); खाली input एक खाली पंक्ति रिपोर्ट करता है, उसका placeholder चाहे जो हो। |
| `onCompositionChange` | `.on_composition_change(\|e: &Composition\| ..)` | `{ composing, text }` | input method की composition शुरू हुई, बदली या समाप्त हुई: `text` वह है जो compose हो रहा है (character चुनने से पहले pinyin, conversion से पहले kana), समाप्त होने पर `""`। committed टेक्स्ट समाप्ति से पहले `onChange` तक पहुँचता है। |

एक multiline input जो अपने टेक्स्ट के साथ बढ़ता है:

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

## Ref methods

| Method | Rust | Description |
|---|---|---|
| `focus()` | `focus()` | input को focus करता है और keyboard दिखाता है। |
| `blur()` | `blur()` | उसका focus हटाता है। |
| `setSelection(start, end?)` | `set_selection(start, end)` | `start..end` को select करता है (UTF-16 units); दोनों बराबर हों तो caret। |

return पर अगले field पर focus ले जाना:

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

`nsh` का `Keyboard.dismiss()` (Rust में `dismiss_keyboard()`) keyboard को छिपा देता है, चाहे वह किसी भी input के पास हो।

## Platform notes

- macOS पर, single-line टेक्स्ट, placeholders और carets native field के font metrics साझा करते हैं और content box के भीतर साथ-साथ केंद्रित होते हैं। `lineHeight` layout में भाग लेता है; multiline editors इसे paragraph spacing के लिए भी उपयोग करते हैं।
- [scroll view](./scroll.md#keyboard) के अंदर के inputs native रूप से keyboard से दूर रखे जाते हैं। अन्यत्र [`env(keyboard-inset-height)`](./keyboard.md) का bottom padding या margin उपयोग करें।
- `disabled` input को disable करता है (कोई focus नहीं) और disabled styles भी लागू करता है; `readonly` input अपना focus और selection बनाए रखता है।
- `inputAccessoryViewID` iOS पर लागू होता है, जहाँ keyboard में accessory bar होती है।
