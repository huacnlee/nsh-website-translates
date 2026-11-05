---
title: "फ़ॉर्म और कीबोर्ड"
description: "input एलिमेंट के साथ टेक्स्ट इनपुट - controlled और uncontrolled वैल्यू, कीबोर्ड टाइप, रिटर्न की, फ़ोकस, सेलेक्शन, बढ़ने वाले मल्टीलाइन इनपुट - और कंटेंट को सॉफ़्टवेयर कीबोर्ड से बाहर रखना।"
order: 42
group: ui
demo: guide-forms
source_hash: a7bed0645c77c155
---

# फ़ॉर्म और कीबोर्ड

टेक्स्ट एंट्री input एलिमेंट है, `input()` Rust में और `<Input>` TSX में: iOS पर UITextField या UITextView, Android पर EditText। टाइपिंग, कर्सर, सिलेक्शन, ऑटोकरेक्शन और ऑटोफ़िल प्लेटफ़ॉर्म के अपने हैं; आपका ऐप टेक्स्ट इवेंट के ज़रिए पाता है और उसे नियंत्रित कर सकता है। NSH फ़ोकस्ड input को सॉफ़्टवेयर कीबोर्ड के ऊपर अपने-आप बनाए रखता है, और जिन मामलों को वह खुद नहीं संभाल सकता उनके लिए कीबोर्ड की ऊँचाई को रिएक्टिव वैल्यू के रूप में देता है।

input किसी भी view की तरह स्टाइल लेता है (Rust में टाइप्ड स्टाइल मेथड, TSX में स्टाइल और Tailwind क्लास), इसलिए फ़ॉर्म के फ़ील्ड आपके ऐप का अपना रूप पाते हैं। लेबल वाला फ़ील्ड आपका अपना एक छोटा कंपोनेंट होता है:

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

## Controlled और uncontrolled input

input तब **controlled** होता है जब आप उसकी value देते हैं (`.value(..)`, TSX `value`): वह वही दिखाता है जो आपके signal में है, और आप change इवेंट (`.on_change(..)`, TSX `onChange`) से signal को अपडेट करते हैं।

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

क्योंकि value आपके नियंत्रण में है, आप यूज़र के टाइप किए टेक्स्ट को बदल सकते हैं: `.on_change(move |t: &str| tag.set(t.to_uppercase()))` अपरकेस करता है, `onChange={({ value }) => code.set(value.replace(/[^0-9]/g, ""))}` केवल अंक रखता है।

### Input methods

चीनी, जापानी और कोरियाई input method टेक्स्ट को कमिट करने से पहले कंपोज़ करते हैं: कोई अक्षर चुने जाने पर pinyin 腾 बन जाता है। `onCompositionChange` (Rust `.on_composition_change(..)`) कंपोज़िशन की प्रगति बताता है, यूज़र के टाइप करते समय `{ composing: true, text: "teng" }` और उसके खत्म होने पर `{ composing: false, text: "" }`; कमिट किया गया टेक्स्ट कंपोज़िशन खत्म होने से पहले `onChange` तक पहुँच जाता है। iOS, Android, macOS और web पर `onChange` कंपोज़ हो रहा टेक्स्ट भी बताता है, क्योंकि ये सिस्टम उसे input में ही रखते हैं; Windows, Linux और GPUI पर यह कमिट किया गया टेक्स्ट बताता है। controlled input ऐप के value के साथ कुछ भी करने पर भी कंपोज़िशन चालू रखता है: यूज़र के कंपोज़ करते समय सेट की गई `value` कंपोज़िशन खत्म होने के बाद दिखती है, इसलिए जो input अपना टेक्स्ट अपरकेस या फ़िल्टर करता है, वह pinyin को जैसा टाइप हुआ वैसा ही लेता है।

ऐसा सर्च बॉक्स जो केवल कमिट किए गए टेक्स्ट को खोजता है:

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

value के बिना input **uncontrolled** होता है: वह अपना टेक्स्ट खुद रखता है, जो उसकी डिफ़ॉल्ट value (`.default_value(..)`, TSX `defaultValue`) से शुरू होता है, और ज़रूरत पड़ने पर आप उसे change या submit इवेंट से पढ़ते हैं। इसे उन फ़ील्ड के लिए इस्तेमाल करें जिन्हें आप केवल submit पर पढ़ते हैं, जैसे पासवर्ड।

> [!NOTE]
> controlled input कभी कीस्ट्रोक नहीं खोता। हर नेटिव एडिट के साथ एक edit count होता है, और JS से लौटी `value` तभी लागू होती है जब वह सबसे ताज़ा एडिट का जवाब हो। अगर JS धीमा है और इस बीच यूज़र ने और टाइप कर दिया है, तो पुरानी value को छोड़ दिया जाता है, वह नए टेक्स्ट को ओवरराइट नहीं करती।

## Props

Rust में हर prop `input()` का एक मेथड है जिसका नाम snake case में है (`.placeholder(..)`, `.masked(true)`, `.max_length(6)`, `.return_key_type(ReturnKeyType::Next)`, `.selected_range((0, 4))`), इन अपवादों के साथ जिनके अपने नाम हैं: `.keyboard_type(KeyboardType::Email)` और `KeyboardType` के बाकी variant, `autoComplete` के लिए `.auto_fill(AutoFill::Email)`, `ios={{ … }}` prop के लिए `.keyboard_appearance(..)` और `.input_accessory(..)`। हर इवेंट `on_` का मेथड है: `.on_change(|text: &str| ..)`, `.on_submit(|text: &str| ..)`, `.on_focus(..)`, `.on_blur(..)`, `.on_selection_change(|s: &Selection| ..)`, `.on_key_press(|key: &str| ..)`, `.on_content_size_change(|size: &Size<Points>| ..)`।

| Prop | टाइप | डिफ़ॉल्ट | विवरण |
|---|---|---|---|
| `value` | `string` | | टेक्स्ट, जिसे JS नियंत्रित करता है। |
| `defaultValue` | `string` | | uncontrolled input का शुरुआती टेक्स्ट। |
| `placeholder` | `string` | | input खाली होने पर दिखता है। |
| `masked` | `boolean` | `false` | टेक्स्ट छिपाता है (पासवर्ड)। |
| `keyboardType` | `KeyboardType` | `"default"` | कीबोर्ड का लेआउट। |
| `returnKeyType` | `ReturnKeyType` | `"default"` | return की का लेबल। |
| `autoCapitalize` | `"none" \| "sentences" \| "words" \| "characters"` | `"sentences"` | अपने-आप कैपिटलाइज़ेशन। |
| `autoCorrect` | `boolean` | `true` | सिस्टम के सुधार। |
| `autoComplete` | `AutoComplete` | | input में क्या है, ऑटोफ़िल के लिए। |
| `multiline` | `boolean` | `false` | कई लाइनें; `submitBehavior` के अलग कहने तक return लाइन ब्रेक डालता है। |
| `maxLength` | `number` | | यूज़र अधिकतम कितने अक्षर डाल सकता है। |
| `readonly` | `boolean` | `false` | यूज़र टेक्स्ट चुन और कॉपी कर सकता है, पर बदल नहीं सकता। |
| `autoFocus` | `boolean` | `false` | दिखते ही फ़ोकस हो जाता है। |
| `submitBehavior` | `"submit" \| "blurAndSubmit" \| "newline"` | सिंगल लाइन `"blurAndSubmit"`, मल्टीलाइन `"newline"` | return क्या करता है: submit करके फ़ोकस रखना, submit करके unfocus करना, या लाइन ब्रेक डालना (केवल मल्टीलाइन)। |
| `pasteBehavior` | `"insert" \| "report"` | `"insert"` | paste क्या करता है: उसका टेक्स्ट डालना, या कुछ नहीं ([पेस्ट करना](#pasting-images-and-files))। |
| `caret` | `boolean` | `true` | कर्सर दिखता है; `false` उसे छिपाता है। |
| `ios={{ keyboardAppearance }}` | `"default" \| "light" \| "dark"` | `"default"` | कीबोर्ड का रूप (iOS)। |
| `selectedRange` | `{ start: number; end?: number }` | | नियंत्रित सिलेक्शन, UTF-16 यूनिट में। |
| `allowFontScaling` | `boolean` | `true` | सिस्टम के टेक्स्ट साइज़ का पालन करता है। |
| `maxFontSizeMultiplier` | `number` | | सिस्टम स्केल की ऊपरी सीमा (0: कोई नहीं)। |
| `ios={{ inputAccessoryViewID }}` | `string` | | iOS: कीबोर्ड के ऊपर दिखने वाला बार (नीचे देखें)। |
| `ios={{ textContentType }}` | `TextContentType` | | `autoComplete` values के लिए iOS के अपने नाम। |

इवेंट:

| इवेंट | पेलोड | कब |
|---|---|---|
| `onChange` | `{ value }` | टेक्स्ट बदला: `value` अब का टेक्स्ट है। |
| `onSubmit` | `{ text }` | ऐसे input में return की दबाई गई जो submit करता है (सिंगल लाइन, या `submitBehavior` `"submit"` / `"blurAndSubmit"`)। |
| `onFocus` / `onBlur` | | input को फ़ोकस मिला / उसका फ़ोकस गया। |
| `onSelectionChange` | `{ start, end }` | कर्सर या सिलेक्शन हिला (UTF-16 यूनिट)। |
| `onPaste` | `{ text, html, files, uris }` | यूज़र ने paste किया: टेक्स्ट, उसका HTML (Linux, web), इमेज `File` के रूप में, लोकल फ़ाइलों के URL ([पेस्ट करना](#pasting-images-and-files))। |
| `onCaretMove` | `{ bounds, pageBounds }` | कर्सर हिला: वह input में और विंडो में कहाँ है ([कर्सर](#the-caret))। |
| `onKeyPress` | `{ key }` | टेक्स्ट बदलने से पहले: `key` टाइप किया गया टेक्स्ट है, `"Backspace"` या `"Enter"`। |
| `onContentSizeChange` | `{ size }` | टेक्स्ट का साइज़ (`size`) बदला (मल्टीलाइन होने पर input की चौड़ाई पर), जैसे-जैसे टाइप होता है; खाली input अपने placeholder की परवाह किए बिना एक खाली लाइन बताता है। |
| `onCompositionChange` | `{ composing, text }` | input method की कंपोज़िशन शुरू हुई, बदली या खत्म हुई ([Input methods](#input-methods) देखें)। |

input को टेक्स्ट की तरह स्टाइल किया जाता है: `fontSize`, `color`, `fontFamily`, `textAlign`, `letterSpacing` और [टेक्स्ट स्टाइल](./text.md) के बाकी गुण, साथ ही बॉर्डर, पैडिंग और बैकग्राउंड। फ़ोकस स्टाइल (Rust में `.focus(|s| ..)`, TSX में `focus:` Tailwind variant या `focusStyle`) तब लागू होती है जब input के पास फ़ोकस हो। placeholder का रंग `.placeholder_color(..)` है (
`placeholderColor` स्टाइल key, `placeholder:text-*`), कर्सर का `.caret_color(..)` (`caretColor`, `caret-*`), और सिलेक्शन हाइलाइट का `.selection_color(..)`
(`selectionColor`, `selection:text-*`); UIKit कर्सर और सिलेक्शन को एक ही रंग से टिंट करता है, और सेट होने पर कर्सर का रंग लेता है:

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

## कीबोर्ड और ऑटोफ़िल

कीबोर्ड टाइप (`.keyboard_type(..)`, TSX `keyboardType`) लेआउट चुनता है:

| Rust | TSX | कीबोर्ड |
|---|---|---|
| `KeyboardType::Default` | `"default"` | टेक्स्ट। |
| `KeyboardType::Email` | `"email-address"` | टेक्स्ट, जिसमें `@` और `.` हाथ के पास हों। |
| `KeyboardType::Url` | `"url"` | टेक्स्ट, `/` और `.com` के साथ। |
| `KeyboardType::Number` | `"number-pad"` | केवल अंक: कोई चिह्न नहीं, कोई दशमलव विभाजक नहीं (कोड, PIN)। |
| `KeyboardType::Decimal` | `"decimal-pad"` | अंक और एक दशमलव विभाजक। |
| `KeyboardType::Numeric` | `"numeric"` | React Native की तरह: iOS का decimal pad; Android पर अंक, चिह्न और दशमलव विभाजक के साथ। |
| `KeyboardType::NumbersAndPunctuation` | `"numbers-and-punctuation"` | अंक, एक माइनस चिह्न और विराम चिह्न (iOS का numbers and punctuation कीबोर्ड; Android पर अंक, चिह्न और दशमलव विभाजक के साथ)। iOS पर ऋणात्मक संख्याओं के लिए इसका उपयोग करें। |
| `KeyboardType::Phone` | `"phone-pad"` | फ़ोन डायल पैड। |

iOS पर `.keyboard_appearance(KeyboardAppearance::Dark)` (TSX `ios={{ keyboardAppearance: "dark" }}`; या light, डिफ़ॉल्ट) कीबोर्ड को सिस्टम की अपीयरेंस से स्वतंत्र, हल्का या गहरा रूप देता है, जो light mode में डार्क ऐप के लिए काम आता है। Android के कीबोर्ड हमेशा सिस्टम की थीम का पालन करते हैं।

ऑटोफ़िल (`.auto_fill(AutoFill::Email)`, TSX `autoComplete`) सिस्टम को बताता है कि फ़ील्ड में क्या है, ताकि वह सेव किए गए नाम, पते, पासवर्ड और मैसेज से मिले वन-टाइम कोड सुझा सके। Rust के `AutoFill` में हर प्रकार के लिए एक variant है (`Name`, `GivenName`, `FamilyName`, `Email`, `Tel`, `Username`, `Password`, `NewPassword`, `OneTimeCode`, `StreetAddress`, `PostalCode`, `Country`, `CreditCardNumber`, `Url`, `Birthdate`, ..., और `Off`)। TSX ये values लेता है: `"name"`, `"given-name"`, `"family-name"`, `"email"`, `"tel"`, `"username"`, `"current-password"`, `"new-password"`, `"one-time-code"`, `"street-address"`, `"postal-code"`, `"country"`, `"cc-number"`, `"cc-exp"`, `"cc-csc"`, `"url"`, `"birthdate-full"` और अन्य, या `"off"`; iOS के अपने नाम (`"emailAddress"`, `"oneTimeCode"`, ...) भी `autoComplete` या `ios={{ textContentType }}` में स्वीकार किए जाते हैं।

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

## Return की और फ़ील्ड के बीच जाना

return key type (`.return_key_type(ReturnKeyType::Next)`, TSX `returnKeyType`) return की को लेबल देता है: default, done, go, next, search या send। submit behavior (`.submit_behavior(..)`, TSX `submitBehavior`) बताता है कि उसे दबाने पर क्या होता है:

| Rust | TSX | Return | इनके लिए डिफ़ॉल्ट |
|---|---|---|---|
| `SubmitBehavior::BlurAndSubmit` | `"blurAndSubmit"` | submit इवेंट चलाता है, फिर input का फ़ोकस चला जाता है | सिंगल-लाइन input |
| `SubmitBehavior::Submit` | `"submit"` | submit इवेंट चलाता है; input का फ़ोकस बना रहता है | |
| `SubmitBehavior::Newline` | `"newline"` | लाइन ब्रेक डालता है (केवल मल्टीलाइन input) | मल्टीलाइन input |

`"submit"` या `"blurAndSubmit"` वाला मल्टीलाइन input return पर भेज देता है, जैसा चैट कंपोज़र करते हैं, और फिर भी अपनी लाइनें रैप करता है; हार्डवेयर कीबोर्ड पर (डेस्कटॉप, Mac, टैबलेट का कीबोर्ड) Shift+Return या Option / Alt+Return लाइन ब्रेक डालता है। जो return किसी input method की कंपोज़िशन (जैसे चीनी या जापानी input) को कमिट करता है, वह केवल उसे कमिट करता है और कभी submit नहीं करता।

अगले फ़ील्ड पर जाने के लिए, input के ref रखें (Rust में `element_ref()` और `.element_ref(&r)`, TSX में `ref`) और `focus()` को कॉल करें:

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

पहले फ़ील्ड पर blur किए बिना submit करना (`SubmitBehavior::Submit`, `submitBehavior="submit"`) फ़ोकस बदलते समय कीबोर्ड को ऊपर बनाए रखता है, इसलिए वह नीचे जाकर फिर ऊपर नहीं आता। जो चैट input return पर भेजता है और फ़ोकस्ड रहता है, वह इसी तरह submit करता है (कंपोज़र देखें [नीचे](#content-outside-scroll-views))।

अधिकतम लंबाई और submit behavior, दोनों नेटिव रूप से लागू होते हैं: यूज़र के टाइप करते समय प्लेटफ़ॉर्म पूछता है "क्या यह अक्षर जोड़ा जा सकता है?" और "क्या return से एडिटिंग खत्म होनी चाहिए?", और NSH JS का इंतज़ार किए बिना props से जवाब देता है।

<a id="focus-from-code"></a>

## कोड से फ़ोकस

input के ref में ये हैं:

| Rust | TSX | विवरण |
|---|---|---|
| `focus()` | `focus()` | input को फ़ोकस करता है और कीबोर्ड दिखाता है। |
| `blur()` | `blur()` | उसका फ़ोकस हटाता है। |
| `set_selection(start, end)` | `setSelection(start, end?)` | `start..end` को सेलेक्ट करता है (UTF-16 यूनिट); दोनों बराबर हों तो कर्सर (TSX: `end` के बिना)। |

macOS और web पर, ऐसे view के ref पर `focus()` और `blur()`, जो प्रेस लेता है, कीबोर्ड फ़ोकस को वैसे ही हिलाते हैं जैसे Tab ([कीबोर्ड फ़ोकस](../elements/index.md#keyboard-focus))।

Rust में `dismiss_keyboard()` और TSX में `nsh` से `Keyboard.dismiss()` उस input का फ़ोकस हटाते हैं जिसके पास फ़ोकस है:

```rust tabs
view().on_press(|| dismiss_keyboard())
```

```tsx tabs
import { View, Keyboard } from "nsh";

<View onPress={() => Keyboard.dismiss()}>…</View>
```

## Selection

selection इवेंट (`.on_selection_change(..)`, TSX `onSelectionChange`) कर्सर और सिलेक्शन बताता है; ref का `set_selection` या चुनी गई रेंज (`.selected_range(..)`, TSX `selectedRange`) उन्हें सेट करते हैं। पोज़िशन UTF-16 कोड यूनिट होती हैं, जैसे JavaScript के string इंडेक्स होते हैं, इसलिए TSX में `text.slice(start, end)` चुना गया टेक्स्ट है; Rust में टेक्स्ट के UTF-16 यूनिट को स्लाइस करें।

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

## कर्सर

caret इवेंट (`.on_caret_move(..)`, TSX `onCaretMove`) बताता है कि कर्सर कहाँ है, ताकि जो कुछ कर्सर पर होना चाहिए वह वहीं खुल सके: `@` mention के सुझाव, स्लैश कमांड का मेनू, इमोजी पिकर। `bounds` input में एक `Bounds` है
(`origin` और `size`, input की पैडिंग और स्क्रॉलिंग लागू करके), उतना चौड़ा जितना प्लेटफ़ॉर्म कर्सर बनाता है
और उतना ऊँचा जितनी उसकी लाइन; `pageBounds` वही बॉक्स विंडो में है (या उस डायलॉग में जिसमें input है), जिसे ओवरले अपने `anchor` के रूप में लेता है। इवेंट तब आता है जब input के पास फ़ोकस हो, हर बार जब कर्सर हिलता है: सिलेक्शन के साथ, और जब input का टेक्स्ट स्क्रॉल होता है या दूसरी लाइनों पर रैप होता है। Rust में ओवरले को बॉक्स के सापेक्ष
`.anchor_bounds(..)` से रखा जाता है।

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

`pageBounds` वह जगह है जहाँ इवेंट आते समय कर्सर था: input के नीचे स्क्रॉल होने वाला पेज input को हिलाता है
पर कोई इवेंट नहीं भेजता, इसलिए स्क्रॉल होने पर सुझाव बंद कर दें, या उन्हें input से ही जोड़ दें।

<a id="pasting-images-and-files"></a>

## इमेज और फ़ाइलें paste करना

paste इवेंट (`.on_paste(..)`, TSX `onPaste`) बताता है कि यूज़र ने क्या paste किया, कीबोर्ड शॉर्टकट से, मेनू के
Paste से या कीबोर्ड की इमेज से: `text`, `html`, `files` और `uris`। `html` वही सामग्री उसकी फ़ॉर्मैटिंग के साथ है, जैसे ब्राउज़र, ऑफ़िस सुइट या रिच टेक्स्ट एडिटर ने उसे कॉपी किया (Linux और web पर)। `files` वह है जो क्लिपबोर्ड में डेटा के रूप में था, जैसे
स्क्रीनशॉट या किसी पेज या दूसरे ऐप से कॉपी की गई इमेज: `File` जिनके बाइट ऐप अपलोड या दिखा सकता है, जिनका नाम
`image.png` है (या वह टाइप जो वह है)। `uris` फ़ाइल मैनेजर में कॉपी की गई फ़ाइलों के `file:` URL हैं, जैसे फ़ाइल ड्रॉप के।
प्लेटफ़ॉर्म क्लिपबोर्ड को तभी पढ़ता है जब यूज़र paste करता है, उससे पहले नहीं।

input paste किया गया टेक्स्ट खुद ही डालता है, जैसा वह हमेशा करता है: इवेंट उस टेक्स्ट के `onChange` से पहले आता है।
इमेज और फ़ाइलें कभी नहीं डाली जातीं, क्योंकि input टेक्स्ट रखता है। `pasteBehavior` `"report"` के साथ input कुछ नहीं
डालता, और ऐप तय करता है कि paste क्या करे: लंबे टेक्स्ट को अटैचमेंट के रूप में भेजना, या साफ़ किया हुआ संस्करण डालना।
input इसे prop से तुरंत तय करता है, क्योंकि सिस्टम उससे उसी क्षण पूछता है।

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

paste की गई फ़ाइल को किसी भी `File` की तरह अपलोड करें, `fetch` और `FormData` (`form.append("image", file)`) के साथ; उसके बाइट
भेजे जाने तक नेटिव रहते हैं। Android पर इमेज डालने वाले कीबोर्ड (GIF, स्टिकर) उन्हें इसी तरह बताते हैं। Linux
पर क्लिपबोर्ड asynchronous रूप से पढ़ा जाता है, इसलिए इवेंट उस टेक्स्ट के `onChange` के बाद आ सकता है जिसे वह डालता है।
macOS पर masked input AppKit का अपना paste रखते हैं और कुछ नहीं बताते।

<a id="multiline-inputs-that-grow"></a>

## बढ़ने वाले मल्टीलाइन input

मल्टीलाइन input (`.multiline(true)`, TSX `multiline`) अपने टेक्स्ट को अपनी ही ऊँचाई के भीतर स्क्रॉल करता है। उसे सामग्री के साथ बढ़ाने के लिए, content size इवेंट की ऊँचाई (`.on_content_size_change(..)`, TSX `onContentSizeChange`) को सीमा के साथ वापस उसकी स्टाइल में दें:

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

बताई गई ऊँचाई टेक्स्ट की है (input की चौड़ाई पर), इसलिए ऊपर की तरह वर्टिकल पैडिंग खुद जोड़ें।
<a id="keeping-inputs-above-the-keyboard"></a>

## कीबोर्ड के ऊपर इनपुट बनाए रखना

<a id="inside-scroll-views-automatic"></a>

### Scroll view के अंदर: स्वचालित

जब कीबोर्ड किसी ऐसे फ़ोकस्ड इनपुट के ऊपर आता है जो scroll view या list के अंदर है, तो NSH उस scroll view को कीबोर्ड जितना ऊँचा नीचे का inset देता है और इनपुट को दृश्य में स्क्रोल कर देता है। यह नेटिव है और इसके लिए किसी कोड की ज़रूरत नहीं है। एक लंबा फ़ॉर्म बस इनपुट्स का एक scroll view होता है:

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

डिसमिस मोड (`.keyboard_dismiss_mode(..)`, TSX `keyboardDismissMode`: none, on drag, interactive) फ़ॉर्म को ड्रैग करके कीबोर्ड छिपाने देता है; handled taps (`.keyboard_taps(KeyboardTaps::Handled)`, TSX `keyboardShouldPersistTaps="handled"`) कीबोर्ड खुला रहने पर बटन पर टैप को केवल कीबोर्ड डिसमिस करने के बजाय आगे जाने देते हैं। देखें [Scrolling](./scrolling.md#scroll-views-and-the-keyboard)।

<a id="content-outside-scroll-views"></a>

### Scroll view के बाहर का कंटेंट

iOS पर, जब कीबोर्ड किसी ऐसे फ़ोकस्ड इनपुट को ढक देता है जो किसी scroll view में नहीं है, तो NSH उसकी स्क्रीन (या डायलॉग) के कंटेंट को कीबोर्ड के कर्व के साथ तब तक ऊपर ले जाता है जब तक इनपुट कीबोर्ड के ठीक ऊपर न आ जाए, और कीबोर्ड छिपने या इनपुट का फ़ोकस हटने पर उसे वापस नीचे ले आता है, जैसा SwiftUI करता है (Android पर, `adjustPan` मोड वाली विंडो को सिस्टम pan करता है)। यह केवल उसी हिस्से के लिए ऐसा करता है जिसे ऐप का अपना लेआउट ढका हुआ छोड़ता है: जो ऐप नीचे दिए तरीके से खुद जगह बना लेता है, उसे दोबारा नहीं हिलाया जाता।

इससे पूरा पेज हिलता है। स्क्रीन के नीचे जमा हुआ मैसेज बार कीबोर्ड के साथ ऊपर आना चाहिए, जबकि उसके ऊपर का कंटेंट सिकुड़ना चाहिए: इसके लिए स्क्रीन के नीचे की padding को CSS के `env(keyboard-inset-height)` (`paddingBottom: "env(keyboard-inset-height)"`, Tailwind `pb-[env(keyboard-inset-height)]`, Rust `.pb_keyboard()`) से सेट करें: यह नीचे कीबोर्ड जितनी ऊँची जगह बनाता है, जो कीबोर्ड के साथ नेटिव रूप से एनिमेट होती है।

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

Padding (`.pb_keyboard()`) ऊपर के कंटेंट को सिकोड़ती है जबकि बैकग्राउंड स्क्रीन के निचले किनारे तक पहुँचता है; नीचे का margin (`marginBottom: "env(keyboard-inset-height)"`, `.mb_keyboard()`) पूरे view को कीबोर्ड के ऊपरी किनारे पर समाप्त कर देता है। `calc(env(keyboard-inset-height) + <length>)` (Rust `.pb_keyboard_plus(..)`, `.mb_keyboard_plus(..)`) एक लंबाई जोड़ता है, जैसे view के नीचे मौजूद tab bar की ऊँचाई को घटाना।

पूरी ऊँचाई ऐसे view के लिए उपयुक्त है जो सतह के निचले किनारे तक पहुँचता है, जैसा स्क्रीन का कंटेंट पहुँचता है। जिस Android होस्ट की विंडो कीबोर्ड के लिए resize होती है, वहाँ विंडो खुद सिकुड़ जाती है और वेरिएबल 0 रहता है। देखें [Keyboard](../elements/keyboard.md)।

<a id="the-keyboard-accessor"></a>

### कीबोर्ड accessor

Rust में `keyboard_height()` और `keyboard_duration()`, और TSX में `nsh` से `keyboardFrame()` (एक `{ height, duration }`), रिएक्टिव हैं: कीबोर्ड सतह में कितनी दूर तक पहुँचता है (छिपा होने पर 0; उसके नीचे का bottom safe area शामिल) और उसकी एनिमेशन की अवधि मिलीसेकंड में। किसी भी कस्टम ज़रूरत के लिए इन्हें पढ़ें: टाइप करते समय फ़्लोटिंग बटन छिपाएँ, या कोई पैनल आकार दें। जिस अपडेट में कीबोर्ड की गति शुरू होती है, उसमें इनके साथ जो कुछ बदलता है वह कीबोर्ड के साथ, उसी के कर्व पर और उसके हिलना शुरू करने के समय से (`LayoutCurve::Keyboard`) चलता है, जैसा `env(keyboard-inset-height)` करता है; उस अपडेट के लिए ऐप जो एनिमेशन कॉन्फ़िगर करता है (`LayoutAnimation.configureNext`) वही लागू होता है।

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

## कीबोर्ड के ऊपर एक बार (iOS): InputAccessoryView

Rust में `input_accessory_view(id)` और TSX में `nsh/mobile` से `InputAccessoryView` कीबोर्ड के ऊपरी हिस्से से जुड़ा एक बार दिखाते हैं, जब तक कोई ऐसा इनपुट फ़ोकस में है जो उसका नाम लेता है: यह iOS का `inputAccessoryView` है। यह कीबोर्ड के साथ नेटिव रूप से चलता है, इंटरैक्टिव डिसमिसल के दौरान भी। ट्री में जहाँ इसे रखा जाता है वहाँ यह कोई जगह नहीं लेता; इनपुट इसे इसकी id से संदर्भित करते हैं (`.input_accessory(id)`, TSX `ios={{ inputAccessoryViewID }}` और `nativeID`):

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

बार विंडो जितना चौड़ा और अपने कंटेंट जितना ऊँचा होता है। इनपुट accessories iOS की हैं: Android पर यह बार एक खाली छिपा हुआ view होता है, इसलिए वहाँ इन कंट्रोल्स को कहीं और रखें, जैसे इनपुट के ऊपर (Rust में `os() == Os::Android`, TSX में `platform.os === "android"`)।

<a id="related"></a>

## संबंधित

- [`Input`](../elements/input.md): एलिमेंट रेफ़रेंस।
- [Keyboard](../elements/keyboard.md) और [`Keyboard`](../modules/nsh.md#keyboard-and-keyboardframe)।
- [`InputAccessoryView`](../modules/nsh-mobile.md#inputaccessoryview): `InputAccessoryView`।
- [Scrolling](./scrolling.md#scroll-views-and-the-keyboard): scroll view में कीबोर्ड डिसमिसल और टैप।
