---
title: "Safe area"
description: "safe-area-inset एनवायरनमेंट वेरिएबल और safeArea तथा safeAreaInsets एक्सेसर: ऐसा कंटेंट जो नॉच, स्टेटस बार, होम इंडिकेटर और हेडर से दूर रखा जाता है।"
order: 110
group: primitives
demo: el-safe-area
source_hash: b81d3cc1ab15d9ad
---

# सेफ एरिया

सेफ एरिया कंटेंट को नॉच या Dynamic Island, स्टेटस बार, होम इंडिकेटर, नेविगेशन हेडर और Mac Catalyst टाइटल बार से दूर रखता है। कोई भी व्यू CSS के `env()` से खुद को इसके अनुसार पैड कर सकता है:
`env(safe-area-inset-top)`, `env(safe-area-inset-right)`, `env(safe-area-inset-bottom)` और
`env(safe-area-inset-left)`, अपनी padding या margin में। ये उस रूट व्यू के इन्सेट हैं जिसमें नोड रेंडर होता है:
[NavPage](./nav-stack.md) के अंदर पेज के हेडर के नीचे के इन्सेट, [Dialog](./dialog.md) के अंदर डायलॉग के
इन्सेट, और अन्य जगहों पर सरफेस का सेफ एरिया। ब्राउज़र में पेज ही रूट होता है, और वेरिएबल ब्राउज़र के
अपने होते हैं।

```rust tabs
use nsh_core::prelude::*;

fn app() -> impl IntoElement {
    view()
        .flex_1()
        .bg(rgb(0xfff8c5))
        .p_safe_area()
        .child(text("Clear of the notch").text_2xl().font_weight(FontWeight::BOLD))
}
```

```tsx tabs
import { mount, Text, View } from "nsh";

function App() {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#fff8c5",
        paddingTop: "env(safe-area-inset-top)",
        paddingRight: "env(safe-area-inset-right)",
        paddingBottom: "env(safe-area-inset-bottom)",
        paddingLeft: "env(safe-area-inset-left)",
      }}
    >
      <Text style={{ fontSize: 24, fontWeight: "700" }}>Clear of the notch</Text>
    </View>
  );
}

mount(App);
```

बैकग्राउंड कलर पूरे एरिया को भरता है, स्टेटस बार के पीछे के एरिया सहित, और कंटेंट उसके नीचे से शुरू होता है। मान इन्सेट के अनुसार बदलते हैं: रोटेशन पर, किसी दूसरे पेज या डायलॉग में, padding नेटिव रूप से अपडेट हो जाती है।

<a id="values"></a>

## मान

| मान | उदाहरण | अर्थ |
|---|---|---|
| `env(name)` | `paddingTop: "env(safe-area-inset-top)"` | इन्सेट। |
| `env(name, <length>)` | `env(safe-area-inset-top, 20px)` | इन्सेट; CSS की तरह, लंबाई (length) अज्ञात नाम की जगह लेती है। |
| `calc(env(name) + <length>)` | `calc(env(safe-area-inset-bottom) + 16px)` | इन्सेट के साथ एक लंबाई जोड़ी गई, उस कंटेंट के लिए जो अपनी स्पेसिंग खुद रखता है। |
| `calc(<length> + env(name))` | `calc(16px + env(safe-area-inset-left))` | वही। |

ये `padding`, `paddingHorizontal`, `paddingVertical`, `paddingTop`, `paddingRight`, `paddingBottom`,
`paddingLeft` और उन्हीं `margin` कीज़ पर लागू होते हैं। Tailwind में ये `p`, `px`, `py`, `pt`, `pr`, `pb`,
`pl` और `m` यूटिलिटीज़ के arbitrary values हैं (स्पेस छोड़े जा सकते हैं): `pt-[env(safe-area-inset-top)]`,
`pb-[calc(env(safe-area-inset-bottom)+16px)]`। इन मानों का TypeScript टाइप `EnvValue` है। देखें
[स्टाइल रेफ़रेंस](../modules/style-reference.md)।

Rust में `Styled` मेथड इन्हें सेट करते हैं: `.p_safe_area()`, `.px_safe_area()`, `.py_safe_area()`, `.pt_safe_area()`,
`.pr_safe_area()`, `.pb_safe_area()`, `.pl_safe_area()`, वही `m` मेथड, और इन्सेट के साथ लंबाई जोड़ने के लिए `.pt_safe_area_plus(px(16.0))`
(तथा `pr`, `pb`, `pl`, `mt`, `mr`, `mb`, `ml`)।

<a id="choosing-the-edges"></a>

## किनारे चुनना

केवल उन्हीं किनारों को पैड करें जिन्हें इसकी ज़रूरत है, उदाहरण के लिए जब आपका अपना टैब बार या बॉटम बार निचले इन्सेट को संभालता हो:

```rust tabs
view()
    .flex_1()
    .pt_safe_area()
    .px_safe_area()
```

```tsx tabs
<View class="flex-1 pt-[env(safe-area-inset-top)] px-[calc(env(safe-area-inset-left)+16px)]">
  …
</View>
```

<a id="where-to-use-it"></a>

## इसका उपयोग कहाँ करें

दिखाई देने वाले और अपारदर्शी हेडर वाला [NavPage](./nav-stack.md) पहले से ही अपना कंटेंट हेडर के नीचे रखता है, इसलिए वहाँ ऊपरी
इन्सेट 0 होता है। सेफ एरिया इन्सेट इनके लिए हैं:

- नेविगेशन स्टैक के बिना ऐप का रूट,
- `headerVisible={false}` या `headerTransparent` वाला पेज,
- फ़ुल-स्क्रीन [Dialog](./dialog.md) का कंटेंट,
- स्क्रीन के किनारों पर आपके अपने बार।

<a id="safearea-and-safeareainsets"></a>

## safeArea और safeAreaInsets

जब आपको कोड में संख्याएँ चाहिए हों, तो उन्हें सीधे पढ़ें। दोनों TSX एक्सेसर `nsh` से आते हैं, एक `Edges` ऑब्जेक्ट लौटाते हैं
(`{ top, right, bottom, left }` पॉइंट में) और रिएक्टिव हैं: उन्हें पढ़ने वाला कोड बदलाव होने पर, उदाहरण के लिए
रोटेशन पर, दोबारा चलता है।

| TSX | Rust | लौटाता है |
|---|---|---|
| `safeArea()` | `safe_area()` | सरफेस का सेफ एरिया: सिस्टम UI (नॉच, होम इंडिकेटर, टाइटल बार) से मुक्त हिस्से। |
| `safeAreaInsets()` | `cx.insets()` | वे इन्सेट जहाँ कंपोनेंट रेंडर होता है: सबसे नज़दीकी पेज के (उसके हेडर के नीचे), सबसे नज़दीकी डायलॉग के, या अन्यथा सरफेस का सेफ एरिया। ये `safe-area-inset-*` वेरिएबल के मान हैं। TSX में इसे किसी कंपोनेंट में कॉल करें; यह एक एक्सेसर लौटाता है। आपके crate का Rust कंपोनेंट इन्हें `cx.insets()` से पढ़ता है। |

```rust tabs
use nsh_core::prelude::*;

fn bottom_bar() -> impl IntoElement {
    view()
        .flex_row()
        .p_2()
        .pb(move || if safe_area().bottom > Points::ZERO { px(4.0) } else { px(8.0) })
        .child(text("Bottom bar"))
}
```

```tsx tabs
import { Text, View, safeArea } from "nsh";

function BottomBar() {
  const insets = safeArea();
  return (
    <View style={{ flexDirection: "row", padding: 8, paddingBottom: insets().bottom > 0 ? 4 : 8 }}>
      <Text>Bottom bar</Text>
    </View>
  );
}
```

इन्सेट के अनुसार ही padding के लिए `env()` सरल रूप है: यह बिना कोड चलाए, नेटिव रूप से अपडेट होता है।

<a id="platform-notes"></a>

## प्लेटफ़ॉर्म नोट्स

- **iOS**: इन्सेट UIKit के सेफ एरिया से आते हैं: स्टेटस बार, नॉच या Dynamic Island, और होम
  इंडिकेटर।
- **Android**: NSH सिस्टम बार और डिस्प्ले कटआउट के उन हिस्सों की रिपोर्ट करता है जो NSH व्यू से ओवरलैप होते हैं। जब NSH को किसी नेटिव टूलबार के नीचे
  [एम्बेड](../docs/android.md) किया जाता है, तो व्यू का ऊपरी इन्सेट 0 होता है।
- **Mac Catalyst**: ऊपरी इन्सेट विंडो का टाइटल बार है।
- **डेस्कटॉप (macOS, Windows, Linux, GPUI) और वेब**: पेज का कंटेंट उसके `header` के नीचे से शुरू होता है, और डायलॉग
  अपने कंटेंट को अपने इन्सेट देता है, जैसा फ़ोन पर होता है।

<a id="related"></a>

## संबंधित

- [Keyboard](./keyboard.md): `env(keyboard-inset-height)`, सॉफ़्टवेयर कीबोर्ड के ऊपर रखा गया कंटेंट।
- [Device and environment](../docs/device-and-environment.md): डिवाइस के अन्य मानों के बीच सेफ एरिया।
