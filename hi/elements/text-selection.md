---
title: "टेक्स्ट चयन"
description: "चयन योग्य व्यू: किसी व्यू के भीतर मौजूद टेक्स्ट में, कई व्यू के बीच, Text एलिमेंट और TextView में एक ही चयन, ठीक वैसे जैसे किसी वेब पेज के टेक्स्ट चुने जाते हैं।"
order: 130
group: primitives
demo: el-text-selection
source_hash: d63cc3aa84e5eab5
---

# टेक्स्ट चयन

`selectable` वाला [`View`](./view.md) अपने अंदर के टेक्स्ट को एक साथ चयनित होने देता है, ठीक वैसे ही जैसे किसी वेब पेज में होता है: एक चयन एक टेक्स्ट के किसी स्थान से दूसरे टेक्स्ट के किसी स्थान तक, व्यूज़, [`Text`](./text.md) एलिमेंट्स और [`TextView`](./text-view.md) के आर-पार, पढ़ने के क्रम में चलता है। चैट ट्रांसक्रिप्ट को चयन-योग्य बनाएँ, तो चयन एक संदेश में शुरू होकर अगले संदेश में समाप्त हो सकता है; Copy चयनित टेक्स्ट को क्लिपबोर्ड पर रख देता है, जिसमें अगल-बगल के टेक्स्ट टैब से और बाकी टेक्स्ट लाइन ब्रेक से जुड़ते हैं। Rust में इसे `view().selectable(true)` से सेट किया जाता है, TSX में `<View selectable>` से; कोई एक टेक्स्ट चयन-योग्य है या नहीं, यह उसकी `userSelect` स्टाइल तय करती है।

```rust tabs
use nsh_base::text_view;
use nsh_core::prelude::*;

fn release_notes(notes: &'static str) -> impl IntoElement {
    view()
        .selectable(true)
        .gap_3()
        .p_4()
        .child(text("Release notes").font_weight(FontWeight::SEMIBOLD))
        .child(text_view().markdown(notes))
        .child(
            view()
                .flex_row()
                .gap_2()
                .child(text("Updated").select_none().text_color(rgb(0x737373)))
                .child(text("October 21")),
        )
}
```

```tsx tabs
import { Text, View } from "nsh";
import { TextView } from "nsh/base";

function ReleaseNotes(props: { notes: string }) {
  return (
    <View selectable class="gap-3 p-4">
      <Text class="font-semibold">Release notes</Text>
      <TextView markdown={props.notes} />
      <View class="flex-row gap-2">
        <Text style={{ userSelect: "none" }} class="text-neutral-500">Updated</Text>
        <Text>October 21</Text>
      </View>
    </View>
  );
}
```

व्यू का लेआउट और रूप-रंग ऐप की स्टाइल से तय होते हैं, और उसकी सामग्री उसके चिल्ड्रन होते हैं। चयन स्वयं प्लेटफ़ॉर्म का होता है: व्यू उसके लिए अपना कुछ भी नहीं बनाता।

<a id="a-chat-transcript"></a>

## चैट ट्रांसक्रिप्ट

एक चयन-योग्य व्यू में रखा ट्रांसक्रिप्ट एक पेज की तरह चयनित होता है: ड्रैग एक उत्तर में शुरू होकर दूसरे में समाप्त हो सकता है, और Copy बीच के हर संदेश का टेक्स्ट ले लेता है।

```rust tabs
use nsh_base::text_view;
use nsh_core::prelude::*;

fn transcript(replies: Signal<Vec<SharedString>>) -> impl IntoElement {
    scroll().flex_1().child(
        view().selectable(true).p_4().gap_4().child(each(
            replies,
            |reply: &SharedString| reply.clone(),
            |reply, _index| text_view().markdown(move || reply.get()),
        )),
    )
}
```

```tsx tabs
import { Scroll, View } from "nsh";
import { TextView } from "nsh/base";

<Scroll class="flex-1">
  <View selectable class="gap-4 p-4">
    <Each of={replies}>{(reply) => <TextView markdown={reply()} />}</Each>
  </View>
</Scroll>
```

<a id="how-a-selection-is-made"></a>

## चयन कैसे किया जाता है

| प्लेटफ़ॉर्म | चयन कैसे किया जाता है |
|---|---|
| macOS, Windows, Linux, GPUI | टेक्स्ट के आर-पार ड्रैग करें; डबल क्लिक एक शब्द चुनता है, ट्रिपल क्लिक एक अनुच्छेद, और उनके बाद ड्रैग करने पर चयन शब्दों या अनुच्छेदों के हिसाब से आगे बढ़ता है। Shift+क्लिक चयन को बढ़ाता है। Ctrl / Cmd+A व्यू की हर चीज़ चुनता है, Ctrl / Cmd+C कॉपी करता है, Escape या बाहर प्रेस करने पर चयन हट जाता है। |
| iOS, Android | लंबा प्रेस एक शब्द चुनता है; प्लेटफ़ॉर्म के हैंडल उसे बढ़ाते हैं, और उसके एडिट मेन्यू में Copy और Select All होते हैं। |
| Web | ब्राउज़र का अपना चयन, अपने जेस्चर, मेन्यू और शॉर्टकट के साथ। |

<a id="what-it-selects"></a>

## यह क्या चुनता है

- **बाहर रहने वाले टेक्स्ट**: `userSelect: "none"` वाला टेक्स्ट (Rust में `.select_none()`, क्लास `select-none`; जैसे लेबल, बटन का कैप्शन) चयन और उसके जेस्चर के लिए छोड़ दिया जाता है।
- **नेस्टेड व्यूज़**: किसी चयन-योग्य व्यू के अंदर का चयन-योग्य व्यू बाहरी व्यू का हिस्सा होता है, इसलिए एक चयन दोनों को कवर करता है।
- **TextView**: `selectable` वाला [`TextView`](./text-view.md) अपने आप में एक इकाई की तरह चयनित होता है: उसके अनुच्छेद, सूची आइटम, सेल और कोड ब्लॉक एक साथ चयनित होते हैं। चयन-योग्य व्यू के अंदर यह बाहरी चयन में शामिल हो जाता है।
- **एकल टेक्स्ट**: `userSelect: "text"` वाला टेक्स्ट, जो किसी चयन-योग्य व्यू में नहीं है, अपने आप चयनित होता है, जैसा [Text](./text.md#props) में बताया गया है।
- **रूप** प्रत्येक टेक्स्ट की `selectionColor` (`selection:text-*`) में प्लेटफ़ॉर्म की हाइलाइट होती है।
- **सूचियाँ**: वर्चुअलाइज़्ड [List](./list.md) में चयन उन पंक्तियों को कवर करता है जो माउंट हैं; दृश्य से बाहर रीसायकल हुई पंक्तियाँ चयन से बाहर हो जाती हैं।

<a id="related"></a>

## संबंधित

- [View](./view.md): `selectable` प्रॉप।
- [Text](./text.md): `userSelect`, `selectionColor` और एकल टेक्स्ट का चयन।
- [TextView](./text-view.md): ऐसे दस्तावेज़ जिनके ब्लॉक एक साथ चयनित होते हैं।
