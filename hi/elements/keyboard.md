---
title: "कीबोर्ड"
description: "keyboard-inset-height एनवायरनमेंट वेरिएबल, Keyboard.dismiss और कीबोर्ड की ऊँचाई: कंटेंट को सॉफ़्टवेयर कीबोर्ड के ऊपर रखना, जो कीबोर्ड के साथ-साथ चलता है।"
order: 120
group: primitives
demo: el-keyboard
source_hash: d083e22be8d06de9
---

# कीबोर्ड

`env(keyboard-inset-height)` सतह (surface) के ऊपर सॉफ़्टवेयर कीबोर्ड की ऊँचाई है, और कीबोर्ड छिपा होने पर यह 0 रहती है। किसी view की नीचे की padding या margin के रूप में यह कंटेंट को कीबोर्ड के ऊपर रखती है: जब कीबोर्ड दिखता या छिपता है, तो view उसकी ऊँचाई के बराबर जगह बना लेता है, और यह बदलाव कीबोर्ड के साथ नेटिव रूप से एनिमेट होता है। इसे scroll view के बाहर के कंटेंट के लिए उपयोग करें, जैसे चैट स्क्रीन के नीचे का मैसेज बार; [scroll view](./scroll.md) या [List](./list.md) के अंदर के इनपुट नेटिव रूप से दृश्य में स्क्रॉल हो जाते हैं। इसके साथ `Keyboard.dismiss()` मिलता है, जो कीबोर्ड को छिपाता है, और कीबोर्ड की ऊँचाई भी, जिसे आप अपने खुद के लेआउट के लिए उपयोग कर सकते हैं।

```rust tabs
use nsh_core::prelude::*;

fn chat() -> impl IntoElement {
    let draft = signal(String::new());
    view()
        .flex_1()
        .bg(white())
        .pb_keyboard()
        .child(scroll().flex_1().child(text("Messages…").p_4()))
        .child(
            view()
                .flex_row()
                .gap_2()
                .p_2()
                .border_t_1()
                .border_color(rgb(0xe5e5e5))
                .child(
                    input()
                        .value(draft)
                        .on_change(move |v: &str| draft.set(v.to_owned()))
                        .placeholder("Message")
                        .flex_1()
                        .p_2(),
                ),
        )
}
```

```tsx tabs
import { mount, Scroll, signal, Text, View } from "nsh";
import { Input } from "nsh/base";

function App() {
  const draft = signal("");
  return (
    <View style={{ flex: 1, backgroundColor: "#ffffff", paddingBottom: "env(keyboard-inset-height)" }}>
      <Scroll style={{ flex: 1 }} keyboardDismissMode="interactive">
        <Text style={{ padding: 16, paddingTop: 48 }}>Messages…</Text>
      </Scroll>
      <View style={{ flexDirection: "row", gap: 8, padding: 8, borderTopWidth: 1, borderTopColor: "#e5e5e5" }}>
        <Input
          value={draft()}
          onChange={({ value }) => draft.set(value)}
          placeholder="Message"
          style={{ flex: 1, fontSize: 16, padding: 8 }}
        />
      </View>
    </View>
  );
}

mount(App);
```

कीबोर्ड की पूरी ऊँचाई ऐसे view के लिए उपयुक्त है जो स्क्रीन के निचले किनारे तक पहुँचता है, जैसे किसी स्क्रीन का कंटेंट। जब उसके नीचे कुछ हो, जैसे टैब बार, तो उसे किसी length से घटाएँ: `calc(env(keyboard-inset-height) + -49px)` किसी view को 49 pt के टैब बार के ऊपर रखता है, और `calc(env(keyboard-inset-height) + 12px)` कीबोर्ड के ऊपर अतिरिक्त स्पेसिंग जोड़ता है। Padding कम से कम 0 होती है।

<a id="padding-or-margin"></a>

## Padding या margin

| स्टाइल | जगह कैसे बनती है |
|---|---|
| `paddingBottom: "env(keyboard-inset-height)"` (Tailwind `pb-[env(keyboard-inset-height)]`, Rust `.pb_keyboard()`) | ऊपर का कंटेंट सिकुड़ जाता है; बैकग्राउंड अब भी स्क्रीन के निचले किनारे तक पहुँचता है। |
| `marginBottom: "env(keyboard-inset-height)"` (Tailwind `mb-[env(keyboard-inset-height)]`, Rust `.mb_keyboard()`) | पूरा view, अपने बैकग्राउंड सहित, कीबोर्ड के ऊपरी किनारे पर समाप्त होता है। |

कीबोर्ड की ऊँचाई केवल उसी declaration की length में जुड़ती है, इसलिए view अपनी स्पेसिंग को इसके साथ `calc()` में जोड़ सकता है। Rust में `.pb_keyboard_plus(px(..))` और `.mb_keyboard_plus(px(..))` एक length जोड़ते हैं।

```rust tabs
use nsh_core::prelude::*;

fn sign_in() -> impl IntoElement {
    view()
        .mb_keyboard_plus(px(-49.0))
        .flex_1()
        .p_4()
        .gap_3()
        .child(input().placeholder("E-mail").keyboard_type(KeyboardType::Email))
}
```

```tsx tabs
<View class="flex-1 gap-3 p-4 mb-[calc(env(keyboard-inset-height)+-49px)]">
  <Input placeholder="E-mail" keyboardType="email-address" class="rounded-lg border border-neutral-300 px-3 py-2" />
</View>
```

यहाँ view के नीचे मौजूद 49 pt का टैब बार कीबोर्ड की ऊँचाई के एक हिस्से को पहले से ढक लेता है। जगह बनाना बंद करने के लिए, वेरिएबल को स्टाइल से हटा दें, उदाहरण के लिए किसी signal पर condition लगाकर।

<a id="hiding-the-keyboard"></a>

## कीबोर्ड छिपाना

`nsh` से `Keyboard.dismiss()` फ़ोकस वाले इनपुट को unfocus करता है, जिससे कीबोर्ड छिप जाता है। यदि कोई इनपुट फ़ोकस में नहीं है, तो यह सब कुछ जैसा है वैसा ही छोड़ देता है। Rust कॉम्पोनेंट `dismiss_keyboard()` को कॉल करते हैं।

```rust tabs
use nsh_base::button;
use nsh_core::prelude::*;

fn done() -> impl IntoElement {
    button()
        .on_press(|| dismiss_keyboard())
        .rounded_lg()
        .bg(rgb(0x2563eb))
        .px_4()
        .py_3()
        .child(text("Done").text_color(white()))
}
```

```tsx tabs
import { Text, Keyboard } from "nsh";
import { Button } from "nsh/base";

function Done() {
  return (
    <Button onPress={() => Keyboard.dismiss()} class="rounded-lg bg-blue-600 px-4 py-3 active:bg-blue-700">
      <Text class="text-center font-semibold text-white">Done</Text>
    </Button>
  );
}
```

> [!TIP]
> जब उपयोगकर्ता scroll view को ड्रैग करे तब कीबोर्ड छिपाने के लिए, [scroll view](./scroll.md) या [List](./list.md) पर `keyboardDismissMode="on-drag"` या `"interactive"` सेट करें।

<a id="the-keyboards-height"></a>

## कीबोर्ड की ऊँचाई

| TSX | Rust | लौटाता है |
|---|---|---|
| `keyboardFrame()` | `keyboard_height()`, `keyboard_duration()` | NSH सतह के ऊपर सॉफ़्टवेयर कीबोर्ड की ऊँचाई, पॉइंट्स में (छिपे होने पर 0), और उसके दिखने या छिपने के एनीमेशन की अवधि, मिलीसेकंड में। |

दोनों reactive हैं: जो effect, JSX एक्सप्रेशन या स्टाइल क्लोज़र इन्हें पढ़ता है, वह कीबोर्ड के दिखने, छिपने या ऊँचाई बदलने पर दोबारा चलता है।

```rust tabs
use nsh_core::prelude::*;

fn message_bar() -> impl IntoElement {
    view()
        .flex_row()
        .p_2()
        .pb(move || {
            // The home indicator's inset only matters while the keyboard is hidden.
            let home = if keyboard_height() > Points::ZERO {
                Points::ZERO
            } else {
                safe_area().bottom
            };
            px(8.0) + home
        })
        .child(input().placeholder("Message").flex_1())
}
```

```tsx tabs
import { View, keyboardFrame, safeArea } from "nsh";
import { Input } from "nsh/base";

function MessageBar() {
  const insets = safeArea();
  return (
    <View
      style={{
        flexDirection: "row",
        padding: 8,
        // The home indicator's inset only matters while the keyboard is hidden.
        paddingBottom: 8 + (keyboardFrame().height > 0 ? 0 : insets().bottom),
      }}
    >
      <Input placeholder="Message" style={{ flex: 1 }} />
    </View>
  );
}
```

यह ऊँचाई कीबोर्ड का वह हिस्सा है जो NSH सतह के ऊपर आता है। जब विंडो स्वयं कीबोर्ड के लिए सिकुड़ जाती है (जैसे Android की कोई activity जो resize होती है), या जब NSH ऐसे view में एम्बेड हो जो कीबोर्ड के ऊपर ही समाप्त हो जाता है, तो ऊँचाई 0 होती है।

> [!NOTE]
> कंटेंट को कीबोर्ड के ऊपर रखने के लिए `env(keyboard-inset-height)` अधिक सरल तरीका है: यह कोड चलाए बिना, कीबोर्ड के साथ नेटिव रूप से एनिमेट होता है।

<a id="platform-notes"></a>

## प्लेटफ़ॉर्म नोट्स

- **iOS**: जगह कीबोर्ड की अपनी अवधि और ease-in-ease-out कर्व के साथ एनिमेट होती है।
- **Android**: जहाँ विंडो कीबोर्ड के लिए सिकुड़ती है (resize होने वाली activity), वहाँ कंटेंट पहले से कीबोर्ड के ऊपर समाप्त होता है और वेरिएबल 0 होता है। जहाँ कीबोर्ड view के ऊपर आता है, वहाँ यह iOS की तरह जगह बनाता है।
- **डेस्कटॉप और Mac Catalyst** में हार्डवेयर कीबोर्ड से टाइप किया जाता है: वेरिएबल 0 होता है और view अपना लेआउट बनाए रखता है।
- **Web**: वेरिएबल ब्राउज़र का अपना (VirtualKeyboard API का) होता है।

फ़ोकस क्रम, रिटर्न कीज़ और इनपुट accessories के लिए [Forms और कीबोर्ड](../docs/forms-and-keyboard.md) देखें, और अन्य environment वेरिएबल के लिए [Safe area](./safe-area.md) देखें।
