---
title: "OtpInput"
description: "OtpInput कॉम्पोनेंट: एक निश्चित लंबाई वाला संख्यात्मक वन-टाइम कोड, जिसे टाइप किया जा सकता है, पेस्ट किया जा सकता है या ऑटोफ़िल किया जा सकता है, और जो एक ही नेटिव फ़ील्ड में दर्ज होता है। यह सेल, समूहों और कैरेट के रूप में दिखाया जाता है, जिन्हें ऐप स्टाइल करता है।"
group: base
demo: el-otp-input
source_hash: 80ea5e26b79a21ac
---

# OtpInput

वन-टाइम-कोड इनपुट निश्चित संख्या में अंक लेता है (टेक्स्ट संदेश से आया वेरिफ़िकेशन कोड, या ऑथेंटिकेटर का कोड) और उन्हें सेल में दिखाता है। व्यवहार इसी का है: सेल के ऊपर रखा एक पारदर्शी नेटिव टेक्स्ट फ़ील्ड कीबोर्ड लेता है, इसलिए टाइपिंग, इनपुट मेथड, पेस्ट, नंबर पैड और सिस्टम का कोड ऑटोफ़िल (iOS का "From Messages", Android के SMS सुझाव) प्लैटफ़ॉर्म के अपने ही रहते हैं, और स्क्रीन रीडर को केवल एक टेक्स्ट फ़ील्ड मिलता है। केवल अंक ही अंदर जाते हैं, `length` तक; Backspace आख़िरी अंक हटाता है, और `onComplete` बताता है कि कोड पूरा भर गया है। रूप-रंग ऐप का अपना है: `OtpInput` के अपने कोई रंग, आकार, बॉर्डर या लेबल नहीं होते। इसके भाग हैं सेल, वे समूह जिनमें सेल बँटे होते हैं, और एक कैरेट, और ऐप हर एक को स्टाइल करता है।

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

`OtpInput` [`nsh/base`](../modules/nsh-base.md) से आता है, जो Rust में `nsh-base` क्रेट है। Rust में `otp_input()` हर प्रॉप के लिए एक सेटर (`.length(..)`, `.cell_style(..)`), हर इवेंट के लिए एक लिस्नर मेथड (`.on_complete(..)`) और इनपुट के अपने लिए टाइप्ड स्टाइल मेथड के साथ एक इनपुट बनाता है।

<a id="the-code"></a>

## कोड

- **Controlled**: `value` दें और उसे `onChange` में सेट करें। सेल वही `value` दिखाते हैं जो ऐप देता है, जैसा है वैसा; ऐप द्वारा सेट किया गया मान (ग़लत कोड के बाद कोड साफ़ करना) कभी रिपोर्ट नहीं किया जाता।
- **Uncontrolled**: `defaultValue` दें (या कुछ नहीं), और कोड को `onChange` और `onComplete` से पढ़ें।

उपयोगकर्ता जो करता है वह फ़ील्ड से पढ़ा जाता है, कैरेट हमेशा उसके अंत में रहता है:

| उपयोगकर्ता | कोड |
|---|---|
| कोई अंक टाइप करता है | जब तक कोड `length` से छोटा है, वह अंत में जुड़ जाता है; भर जाने के बाद कुछ नहीं बदलता। |
| फ़ुल-विड्थ अंक टाइप करता है (`０`–`９`, पूर्वी एशियाई इनपुट मेथड का) | ASCII अंक जुड़ता है। |
| कुछ और टाइप करता है | कुछ नहीं बदलता; फ़ील्ड उसे छोड़ देता है। |
| Backspace दबाता है | आख़िरी अंक हट जाता है। |
| पेस्ट करता है, या सिस्टम कोड ऑटोफ़िल करता है | उसके अंक उसी तरह जुड़ते हैं; जिस टेक्स्ट में `length` या अधिक अंक हों (`123-456`, किसी संदेश का कोड), वह कोड को अपने पहले `length` अंकों से बदल देता है। |

`onChange` हर बदलाव को नए कोड के साथ रिपोर्ट करता है, और जब बदलाव से आख़िरी सेल भरती है तो `onComplete` उसके बाद आता है, इसलिए ऐप कोड का सत्यापन वहीं करे।

## Props

| Prop | Rust | टाइप | डिफ़ॉल्ट | विवरण |
|---|---|---|---|---|
| `length` | `.length(..)` | `number` | आवश्यक | कोड में कितने अंक हैं: हर अंक के लिए एक सेल। |
| `value` | `.value(..)` | `string` | कोई नहीं | ऐप द्वारा नियंत्रित कोड (जैसा है वैसा दिखाया जाता है)। इसके बिना इनपुट अपना कोड स्वयं रखता है। |
| `defaultValue` | `.default_value(..)` | `string` | कोई नहीं | शुरुआत में कोड, जब `value` सेट न हो। |
| `masked` | `.masked(..)` | `boolean` | `false` | भरी हुई सेल अपने अंक की जगह एक बुलेट दिखाती हैं, और फ़ील्ड सुरक्षित (secure) होता है: स्क्रीन रीडर कोड को नहीं पढ़ते, और सिस्टम उसे अपने सुझावों से बाहर रखता है। |
| `disabled` | `.disabled(..)` | `boolean` | `false` | न फ़ोकस, न संपादन; `disabled:` स्टाइल इनपुट और उसके भागों पर लागू होते हैं, और स्क्रीन रीडर बताते हैं कि वह धूसर (dimmed) है। |
| `groups` | `.groups(..)` | `number` | `1` | सेल कितने समूहों में बँटी हैं, जितना हो सके बराबर (छह अंकों को दो में बाँटने पर 3 + 3); कम से कम एक, अधिकतम हर सेल पर एक। |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | कोई नहीं | स्क्रीन रीडर फ़ील्ड के लिए क्या कहते हैं: कोड किसलिए है और उसमें कितने अंक हैं। |
| `cellClass`, `cellStyle` | `.cell_class(..)`, `.cell_style(\|s\| ..)` | `string`, `StyleProp<TextStyle>` | कोई नहीं | हर सेल: उसका आकार, बॉर्डर और टेक्स्ट (`color`, `fontSize`, जिन्हें उसका अंक विरासत में लेता है); `focus:` और `data-filled:` उसकी अवस्थाओं को स्टाइल करते हैं (Parts देखें)। |
| `groupClass`, `groupStyle` | `.group_class(..)`, `.group_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | कोई नहीं | सेल का हर समूह (`flex-row gap-2`)। |
| `caretClass`, `caretStyle` | `.caret_class(..)`, `.caret_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | कोई नहीं | कैरेट: उसकी चौड़ाई, ऊँचाई और रंग। |
| `class`, `style` | स्टाइल मेथड | `string`, `StyleProp<ViewStyle>` | कोई नहीं | स्वयं इनपुट: उसके समूहों के चारों ओर की पंक्ति (या स्तंभ)। |

## Events

| Event | Rust | Payload | कब |
|---|---|---|---|
| `onChange` | `.on_change(\|value: &SharedString\| ..)` | `(e: { value: string })` | उपयोगकर्ता ने कोड बदला: टाइप किया, मिटाया, पेस्ट किया या ऑटोफ़िल किया। |
| `onComplete` | `.on_complete(\|e: &OtpInputCompleteEvent\| ..)` | `{ value }` | उपयोगकर्ता के बदलाव से आख़िरी सेल भर गई, उसके `onChange` के बाद। |
| `onFocus` / `onBlur` | `.on_focus` / `.on_blur` | कोई नहीं | इनपुट को कीबोर्ड फ़ोकस मिला / उसने खोया। |

<a id="ref-methods"></a>

## Ref मेथड

| मेथड | Rust | विवरण |
|---|---|---|
| `focus()` | `focus()` (`OtpInputApi`) | कीबोर्ड फ़ोकस लेता है और सॉफ़्टवेयर कीबोर्ड दिखाता है, जैसा इनपुट पर प्रेस करने से होता है। |

## Parts

| भाग | भीतर | स्टाइल करने के लिए |
|---|---|---|
| इनपुट | | `class`, `style` |
| एक समूह | इनपुट, हर समूह के लिए एक | `groupClass`, `groupStyle`; `disabled:` इनपुट का अनुसरण करता है |
| एक सेल | उसका समूह, हर अंक के लिए एक | `cellClass`, `cellStyle`; `focus:` उस सेल पर जो अगला अंक लेती है जब इनपुट के पास फ़ोकस हो, `data-filled:` हर उस सेल पर जिसमें अंक है, `disabled:` इनपुट का अनुसरण करता है |
| अंक | भरी हुई सेल | सेल के टेक्स्ट स्टाइल (`text-xl`, `font-semibold`); `•` जब `masked` |
| कैरेट | वह खाली सेल जो अगला अंक लेती है, जब इनपुट के पास फ़ोकस हो | `caretClass`, `caretStyle` |

अगला अंक लेने वाली सेल आख़िरी अंक के बाद वाली सेल होती है, या कोड पूरा भर जाने पर आख़िरी सेल। कैरेट टेक्स्ट फ़ील्ड की तरह ब्लिंक करता है (आधा सेकंड चालू, आधा बंद, और हर संपादन के बाद कुछ देर स्थिर), अपनी opacity के द्वारा, नेटिव रूप से, जबकि वह लेआउट में अपनी जगह बनाए रखता है; reduced motion होने पर वह स्थिर रहता है। इनपुट पर कहीं भी प्रेस करने से वह फ़ोकस हो जाता है: फ़ील्ड सेल के ऊपर रहता है।

जिस सेल में अंक है, मास्क किया हुआ हो या नहीं, उसमें एट्रिब्यूट `data-filled` होता है, इसलिए `data-filled:` क्लासेस उन सेल को स्टाइल करती हैं जिन्हें उपयोगकर्ता ने भरा है (गहरा बॉर्डर, एक फ़िल: `data-filled:border-foreground data-filled:bg-muted`), जैसा shadcn/ui अपनी अवस्थाएँ लिखता है। `cellClass` में `group` के साथ, `group-data-filled:` क्लासेस भरी हुई सेल के भीतर की चीज़, यानी उसके अंक, को स्टाइल करती हैं। सेल अपनी क्लासेस बदलती हैं, अपनी सामग्री कभी नहीं, इसलिए एक कुंजी एक ही सेल को फिर से स्टाइल करती है और कुछ दोबारा ड्रॉ नहीं करती।

## Accessibility

- स्क्रीन रीडर को एक टेक्स्ट फ़ील्ड मिलता है, जिसका नाम `accessibilityLabel` से तय होता है (बताएँ कि कोड किसलिए है और उसकी लंबाई कितनी है: "Verification code, 6 digits"), और कोड उसका मान होता है; सेल उनसे छिपी रहती हैं। जब `masked` हो, फ़ील्ड सुरक्षित (secure) होता है, इसलिए कोड ज़ोर से नहीं पढ़ा जाता।
- कीबोर्ड प्लैटफ़ॉर्म का अपना है: फ़ोन पर नंबर पैड, डेस्कटॉप पर कोई भी कीबोर्ड (केवल अंक अंदर जाते हैं), और Backspace। Tab किसी भी टेक्स्ट फ़ील्ड की तरह इनपुट तक पहुँचता है।
- जब `disabled` हो, उसे फ़ोकस नहीं मिलता, और स्क्रीन रीडर बताते हैं कि वह धूसर (dimmed) है।

सामान्य रूप से लेबल, रोल और घोषणाओं के लिए [Accessibility](../docs/accessibility.md) देखें।

<a id="platform-notes"></a>

## प्लैटफ़ॉर्म नोट्स

- iOS: फ़ील्ड एक कोड फ़ील्ड है (`textContentType` `oneTimeCode`), इसलिए QuickType बार Messages या Mail से कोई कोड सुझाता है; नंबर पैड खुलता है। `masked` फ़ील्ड फ़ोकस खोने के बाद दोबारा टाइप करने पर नए सिरे से शुरू होता है, जैसा iOS के secure फ़ील्ड करते हैं।
- Android: `autofillHints` `smsOTPCode` कीबोर्ड और ऑटोफ़िल सेवा को टेक्स्ट संदेश का कोड सुझाने देता है; नंबर कीबोर्ड खुलता है।
- macOS, Windows, Linux और वेब: टाइपिंग और पेस्ट फ़ील्ड में जाते हैं (ब्राउज़र में, फ़ोन के नंबर कीबोर्ड के लिए `inputmode="numeric"` के साथ), और सेल के ऊपर I-beam पॉइंटर दिखता है।
