---
title: "Sheet"
description: "Sheet कंपोनेंट: स्क्रीन के किनारे पर बैकड्रॉप के ऊपर दिखने वाला एक पैनल, जो बैकड्रॉप, Escape और बैक से बंद होता है और जिसकी स्टाइलिंग ऐप द्वारा की जाती है।"
group: base
demo: el-sheet
source_hash: 9ebaacaa0bebfe35
---

# Sheet

Sheet स्क्रीन के किनारे पर एक पैनल है, जो एक बैकड्रॉप के ऊपर दिखता है और बाकी स्क्रीन को ढक देता है: फ़िल्टर, शेयर पैनल, साइड ड्रॉअर। बैकड्रॉप पर प्रेस, Escape, Android का back बटन और VoiceOver का escape जेस्चर इसे बंद कर देते हैं। यह अपनी विंडो में सबसे ऊपर दिखता है, हर डिवाइस पर एक जैसा, और अपना कुछ भी नहीं बनाता: पैनल और बैकड्रॉप ऐप के होते हैं।

```rust tabs
use nsh_base::{SheetEvent, sheet};
use nsh_core::prelude::*;

fn filters(open: Signal<bool>) -> impl IntoElement {
    sheet()
        .open(move || Some(open.get()))
        .on_open_change(move |e: &SheetEvent| {
            if let SheetEvent::OpenChange(next, _) = e {
                open.set(*next);
            }
        })
        .child(
            view()
                .gap_3()
                .p_6()
                .rounded_t(px(16.0))
                .bg(white())
                .child(text("Filters").font_weight(FontWeight::SEMIBOLD))
                .child(view().on_press(move || open.set(false)).child(text("Done"))),
        )
}
```

```tsx tabs
import { signal, Text, View } from "nsh";
import { Sheet } from "nsh/base";

function Filters() {
  const open = signal(false);
  return (
    <>
      <View onPress={() => open.set(true)}><Text>Filters</Text></View>
      <Sheet
        open={open()}
        onOpenChange={(e) => open.set(e.open)}
        popupClass="gap-3 rounded-t-2xl bg-white p-6"
        backdropClass="bg-black/40"
      >
        <Text class="font-semibold">Filters</Text>
        <View onPress={() => open.set(false)}><Text>Done</Text></View>
      </Sheet>
    </>
  );
}
```

`Sheet` [`nsh/base`](../modules/nsh-base.md) से आता है। इसका कंटेंट हर बार खुलने पर बनाया जाता है। `side` इसे स्क्रीन के `"bottom"` (डिफ़ॉल्ट) या `"top"` पर रखता है, जहाँ यह स्क्रीन जितना चौड़ा होता है, या `"left"` या `"right"` पर, जहाँ यह स्क्रीन जितना ऊँचा होता है; आड़े में इसका आकार पैनल का अपना होता है, जो उसके कंटेंट या `popupClass` से तय होता है।

इसकी स्लाइड पैनल के मापे गए आकार का अनुसरण करती है, भले ही एंट्रेंस के दौरान कंटेंट बने या बढ़े। Lazy कंटेंट और एसिंक्रोनस आकार अपडेट एक ही एनिमेशन प्रोग्रेस साझा करते हैं; पैनल अपने मौजूदा आकार पर आकर ठहरता है।

<a id="open-state"></a>

## खुली स्थिति

`open` के बिना, sheet अपनी स्थिति खुद रखती है, जो `defaultOpen` से शुरू होती है। `open` के साथ, स्थिति ऐप के पास होती है: इसे `onOpenChange({ open, reason })` में बदलें, जो बंद करने के हर अनुरोध को उसके कारण (`"backdropPress"`, `"cancel"`, `"swipe"`) के साथ बताता है। `onOpen` और `onClose` इसके खुलने और बंद होने के साथ चलते हैं, चाहे इसे किसी ने भी खोला या बंद किया हो।

`closeOnEscape={false}` इसे Escape और back पर खुला रखता है, `closeOnBackdropPress={false}` बैकड्रॉप पर प्रेस के लिए यही करता है; `onCancel` फिर भी इन्हें सुनता है, ताकि पहले पूछ सके।

<a id="dragging-a-bottom-sheet"></a>

## Bottom sheet को खींचना

`closeOnSwipe` सेट करें ताकि नीचे का पैनल नीचे की ओर खींचने पर साथ चले। दूरी के साथ इसका बैकड्रॉप फीका पड़ता है; पैनल की ऊँचाई के 30% से आगे छोड़ने पर, या 800 पॉइंट प्रति सेकंड की गति से नीचे की ओर छोड़ने पर, कारण `"swipe"` के साथ बंद करने का अनुरोध होता है। इससे छोटा ड्रैग पैनल को सहजता से वापस लौटा देता है। नियंत्रित (controlled) मालिक बंद करने के अनुरोध के बाद पैनल को वापस लाने के लिए `open` को true रख सकता है। Reduced motion में, छोड़ना और प्रोग्रामैटिक रूप से खोलना/बंद करना तुरंत पूरा हो जाता है; सीधा ड्रैग फिर भी उंगली का अनुसरण करता है।

पैनल अपने कंटेंट के अनुसार बैठता है, छोटे मेनू समेत; ज़्यादा ऊँचे कंटेंट को सीमित करने के लिए `popupStyle` या किसी child की ऊँचाई का उपयोग करें। हैंडल ऐप खुद बनाता है, जो पैनल के अंदर कोई भी view हो सकता है। iOS पर, भीतरी वर्टिकल `Scroll` या `List` अपने शीर्ष तक ड्रैग को खुद लेता है और उसी जेस्चर के भीतर बची हुई नीचे की गति पैनल को सौंप देता है। Android, डेस्कटॉप और वेब पर, स्क्रॉल के बाहर हैंडल या कंटेंट को खींचना उनके नेटिव pan सपोर्ट का उपयोग करता है; भीतरी स्क्रॉल अपने प्लेटफ़ॉर्म का सामान्य जेस्चर निर्धारण बनाए रखते हैं। `closeOnSwipe` को false सेट करने पर पैनल स्थिर रहता है और माउंट किया हुआ कंटेंट तथा स्क्रॉल पोज़िशन बनी रहती है। अन्य किनारे अपना मौजूदा व्यवहार बनाए रखते हैं।

## Native sheets

Sheet को NSH ऐप की विंडो में खुद बनाता है, और उसकी स्टाइल ऐप तय करता है। प्लेटफ़ॉर्म की अपनी प्रस्तुत की गई sheet (iOS पर page sheet) के लिए, `presentation="pageSheet"` के साथ [Dialog](./dialog.md) का उपयोग करें।

## Props

| Prop | Rust | Type | Default | विवरण |
|---|---|---|---|---|
| `open` | `.open(..)` | `boolean` | none | खुला है, ऐप द्वारा नियंत्रित। |
| `defaultOpen` | `.default_open(..)` | `boolean` | `false` | शुरू में खुला, `open` के बिना। |
| `side` | `.side(..)` | `"top" \| "bottom" \| "left" \| "right"` | `"bottom"` | वह किनारा जहाँ यह है। |
| `closeOnEscape` | `.close_on_escape(..)` | `boolean` | `true` | Escape और Android का back बटन इसे बंद करते हैं। |
| `closeOnBackdropPress` | `.close_on_backdrop_press(..)` | `boolean` | `true` | बैकड्रॉप पर प्रेस इसे बंद करता है। |
| `closeOnSwipe` | `.close_on_swipe(..)` | `boolean` | `false` | नीचे का पैनल नीचे की ओर ड्रैग का अनुसरण करता है और पर्याप्त रिलीज़ पर बंद होता है। |
| `popupClass`, `popupStyle` | `.popup_class(..)`, `.popup_style(..)` | `string`, `StyleProp<ViewStyle>` | none | पैनल का रूप। |
| `backdropClass`, `backdropStyle` | `.backdrop_class(..)`, `.backdrop_style(..)` | `string`, `StyleProp<ViewStyle>` | none | बैकड्रॉप का रूप, जैसे पारभासी रंग। |
| `children` | `.child(..)` | `JSX.Element` | none | कंटेंट। |

## Events

| Event | Rust | विवरण |
|---|---|---|
| `onOpenChange` | `.on_open_change(\|e\| ..)` | बंद करने का अनुरोध, कारण के साथ: `"backdropPress"`, `"cancel"` या `"swipe"`। |
| `onOpen` | `.on_open(\|\| ..)` | यह आ गई: पूरी तरह मौजूद है। |
| `onClose` | `.on_close(\|\| ..)` | यह चली गई: पूरी तरह गायब है। ऐप द्वारा बंद किए जाने पर भी। |
| `onCancel` | `.on_cancel(\|\| ..)` | उपयोगकर्ता ने इसे बंद करने की कोशिश की (Escape या back, बैकड्रॉप पर प्रेस, सक्षम स्वाइप), चाहे यह बंद हुई हो या नहीं। |

वेब पर, `dialogs: "viewport"` के साथ एम्बेड करने पर sheet और उसका बैकड्रॉप होस्ट पेज के ऊपर दिखते हैं, same-origin iframe समेत। Cross-origin फ़्रेम [`hostPlayerFrame`](../docs/web.md#embed-it-in-a-page) का उपयोग करते हैं।
