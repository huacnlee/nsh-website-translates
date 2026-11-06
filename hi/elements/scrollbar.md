---
title: "Scrollbar"
description: "Scrollbar कॉम्पोनेंट: ऐप के अपने लुक का स्क्रॉल बार, जो हर स्क्रॉल व्यू और लिस्ट के लिए (एक बार सेट की गई थीम से) या किसी एक के लिए, ऐप की इच्छित जगह पर रखा जा सकता है। इसका थंब कंटेंट के साथ चलता है और इसके ड्रैग तथा प्रेस कंटेंट को स्क्रॉल करते हैं। यह स्क्रॉल करते समय, होवर पर या हमेशा दिखाई दे सकता है, और ऐप की तय की गई टाइमिंग के अनुसार फ़ेड इन और फ़ेड आउट होता है।"
group: base
demo: el-scrollbar
source_hash: 961c62cdc9b903d2
---

# Scrollbar

Scrollbar किसी scroll view या list को ऐप के अपने रूप में एक बार देता है: एक पतली पिल जो पॉइंटर के नीचे चौड़ी हो जाती है, ब्रांड के रंग में एक ट्रैक, किसी स्थिर हेडर के बगल में या दो पैनों के साथ लगा एक बार। ऐप की थीम के रूप में एक बार सेट कर देने पर, हर scroll view और list प्लेटफ़ॉर्म के इंडिकेटर की जगह एक बार खींचता है ([Built-in bars](#built-in-bars)); ऐप द्वारा रखे जाने पर, यह उस scroll view का नाम बताता है जिसे यह चलाता है और ऐप जहाँ रखे वहाँ रहता है। यह अपना व्यवहार खुद संभालता है: थंब की लंबाई और स्थिति कंटेंट, व्यूपोर्ट और ऑफ़सेट के अनुसार बदलती है (तब भी जब list बढ़ती है या विंडो का आकार बदलता है); थंब को ड्रैग करने से कंटेंट स्क्रॉल होता है, और ट्रैक पर प्रेस करने से थंब का मध्य भाग वहाँ आ जाता है; यह तब दिखता है जब कंटेंट स्क्रॉल हो रहा हो, जब पॉइंटर उस पर हो, या हमेशा, और नेटिव तरीके से फ़ेड इन और फ़ेड आउट होता है। रूप और समय ऐप के होते हैं: `Scrollbar` के अपने कोई रंग, आकार या radii नहीं होते, और इसके फ़ेड में कोई समय नहीं लगता जब तक ऐप उन्हें समय न दे।

```rust tabs
use nsh_base::{ScrollbarEntrance, ScrollbarMode, ScrollbarMotion, scrollbar, theme};
use nsh_core::prelude::*;

fn inbox(rows: impl IntoElement) -> impl IntoElement {
    let list = element_ref();
    // In over 300 ms and out over 500 ms, 2 s after the last scroll; pointing
    // at the hidden thumb slides it in from the edge.
    let mut motion = ScrollbarMotion::default();
    motion.enter = 300.0;
    motion.exit = 500.0;
    motion.thumb_hover_entrance = ScrollbarEntrance::SlideAndFade;
    view()
        .relative()
        .flex_1()
        // The scroll view's own indicator gives way to the app's bar.
        .child(scroll().element_ref(&list).flex_1().scrollbar(false).child(rows))
        .child(
            scrollbar()
                .scroll(list)
                .mode(ScrollbarMode::Hover)
                .motion(motion)
                .accessibility_label("Messages")
                // The track over the right edge; the thumb right-aligned in it.
                .absolute()
                .top_0()
                .bottom_0()
                .right_0()
                .w(px(16.0))
                .items_end()
                .p(px(4.0))
                .thumb_style(|s| {
                    s.w(px(6.0))
                        .rounded_full()
                        .bg(move || theme().muted_foreground)
                        .opacity(0.6)
                        .group_hover(|s| s.w(px(8.0)).opacity(0.9))
                }),
        )
}
```

```tsx tabs
import { mount, Scroll, Text, View, type YNode } from "nsh";
import { Scrollbar } from "nsh/base";

function App() {
  let list: YNode | undefined;
  return (
    <View class="relative flex-1">
      <Scroll ref={list} scrollbar={false} class="flex-1">
        {Array.from({ length: 60 }, (_, i) => (
          <Text class="px-4 py-3">{`Message ${i + 1}`}</Text>
        ))}
      </Scroll>
      <Scrollbar
        scroll={list}
        mode="hover"
        motion={{ enter: 300, exit: 500, thumbHoverEntrance: "slideAndFade" }}
        accessibilityLabel="Messages"
        class="absolute inset-y-0 right-0 w-4 items-end p-1"
        thumbClass="w-1.5 rounded-full bg-muted-foreground opacity-60 transition-all duration-300 hover:w-2 hover:opacity-90 active:w-2 active:opacity-100"
      />
    </View>
  );
}

mount(App);
```

`Scrollbar` [`nsh/base`](../modules/nsh-base.md) से आता है, जो Rust में `nsh-base` crate है। Rust में, `scrollbar()` हर prop के लिए एक setter (`.scroll(..)`, `.thumb_style(..)`) और बार के लिए typed style मेथड के साथ एक बार बनाता है; इसका `scroll` एक `ElementRef` (या एक `ScrollbarTarget`) लेता है।

## Built-in bars

हर scroll view और list प्लेटफ़ॉर्म के इंडिकेटर की जगह `Scrollbar` खींच सकता है, बिना कोई बार रखे: `Scrollbar.setTheme` हर उस व्यू के बार को ऐप का रूप देता है जिसका `scrollbar` `true` है, एक बार, ऐप जहाँ भी शुरू हो। हर व्यू को अपने व्यूपोर्ट के ऊपर अपना बार मिलता है, जो कंटेंट के स्क्रॉल होने पर भी वहीं रहता है (मुख्य थ्रेड पर, जैसे sticky व्यू रहते हैं) और कंटेंट के ऊपर खींचा जाता है; यह उसी तरह चलता, स्क्रॉल होता और फ़ेड होता है जैसे रखा गया `Scrollbar` करता है।

```rust tabs
use nsh_base::{ScrollbarLook, ScrollbarMode, ScrollbarTheme, set_scrollbar_theme};

fn use_app_scrollbars() {
    let mut vertical = ScrollbarLook::default();
    vertical.class = Some("absolute inset-y-0 right-0 w-4 items-end p-1".into());
    vertical.thumb_class = Some("w-1.5 rounded-full bg-muted-foreground opacity-60 hover:w-2".into());
    let mut horizontal = ScrollbarLook::default();
    horizontal.class = Some("absolute inset-x-0 bottom-0 h-4 items-end p-1".into());
    horizontal.thumb_class = Some("h-1.5 rounded-full bg-muted-foreground opacity-60 hover:h-2".into());
    let mut theme = ScrollbarTheme::default();
    theme.mode = ScrollbarMode::Hover;
    theme.motion.enter = 300.0;
    theme.motion.exit = 500.0;
    theme.vertical = Some(vertical);
    theme.horizontal = Some(horizontal);
    set_scrollbar_theme(Some(theme));
}
```

```tsx tabs
import { Scrollbar } from "nsh/base";

Scrollbar.setTheme({
  mode: "hover",
  motion: { enter: 300, exit: 500 },
  vertical: {
    class: "absolute inset-y-0 right-0 w-4 items-end p-1",
    thumbClass: "w-1.5 rounded-full bg-muted-foreground opacity-60 transition-all duration-300 hover:w-2",
  },
  horizontal: {
    class: "absolute inset-x-0 bottom-0 h-4 items-end p-1",
    thumbClass: "h-1.5 rounded-full bg-muted-foreground opacity-60 transition-all duration-300 hover:h-2",
  },
});
```

`ScrollbarTheme` में बार के वे props होते हैं जो हर व्यू के लिए समान हैं, और हर axis का रूप:

| Field | Type | Default | Description |
|---|---|---|---|
| `mode` | `"scrolling" \| "hover" \| "always"` | `"scrolling"` | बार कब दिखें: [When it shows](#when-it-shows)। |
| `motion` | `ScrollbarMotion` | snaps, `idle` `2000` | वे कैसे दिखें और छिपें: [Motion](#motion)। |
| `minThumbLength` | `number` | `48` | थंब की सबसे छोटी लंबाई। |
| `vertical`, `horizontal` | `ScrollbarLook` | none | वर्टिकल और हॉरिज़ॉन्टल व्यू के बार का रूप: ट्रैक के लिए `class` और `style`, जो व्यू के व्यूपोर्ट में रखे जाते हैं; `thumbClass` और `thumbStyle`; `accessibilityLabel`। जिस व्यू के axis का कोई रूप नहीं है, वह प्लेटफ़ॉर्म का इंडिकेटर रखता है। |

बाद का `setTheme` बार को नए सिरे से स्टाइल करता है, और `Scrollbar.setTheme(null)` व्यूज़ को प्लेटफ़ॉर्म का इंडिकेटर लौटा देता है। एक व्यू अपनी थीम को अपने `scrollbar` prop (`<Scroll scrollbar={{ mode: "always", vertical: { … } }}>`) के रूप में ले सकता है, चाहे ऐप ने कोई थीम सेट की हो या नहीं; `scrollbar={false}` व्यू को बिना बार के छोड़ देता है। अपने parent के व्यूपोर्ट में बिछाई गई list (`viewport="parent"`) उसी व्यू और उसके बार के साथ स्क्रॉल होती है। मल्टीलाइन `Input` को भी अपने वर्टिकल रूप का बार मिलता है, अपने टेक्स्ट के ऊपर, जिसे वह वैसे ही स्क्रॉल करता है जैसे टेक्स्ट व्यू का अपना इंडिकेटर करता है।

## The scroll view it moves

`scroll` उस scroll view या list का नाम बताता है जिसे बार follow करता है: उसका `ref`। बार उसे तब ढूँढता है जब वह स्क्रीन पर आ जाता है, इसलिए `ref` उसी render में बाद के किसी एलिमेंट द्वारा सेट किया जा सकता है; बार को अपने scroll view के बाद लिखें (या `ref` को किसी signal में रखें)। scroll view का अपना इंडिकेटर `scrollbar={false}` से बंद करें, और बार को `class` से रखें: scroll view के किनारे पर, दोनों के चारों ओर बने `relative` बॉक्स में, या स्क्रीन पर कहीं और।

- थंब उतना लंबा होता है जितना कंटेंट का हिस्सा व्यूपोर्ट दिखाता है, ट्रैक के content box (उसकी padding के अंदर) के साथ, और `minThumbLength` से छोटा नहीं। उसकी स्थिति इससे तय होती है कि कंटेंट कितना स्क्रॉल हुआ है; जब कंटेंट किसी सिरे के पार bounce करता है, तो थंब उसी सिरे पर रहता है।
- थंब को ड्रैग करने पर कंटेंट उतना ही स्क्रॉल होता है जितना थंब चलता है। ट्रैक पर प्रेस करने से थंब का मध्य भाग पॉइंटर के नीचे आ जाता है, और ड्रैग वहीं से आगे चलता है।
- वर्टिकल बार वर्टिकल scroll view को follow करता है; `axis="horizontal"` हॉरिज़ॉन्टल scroll view के लिए बार बनाता है (उसे निचले किनारे पर रखें)। हर axis के लिए एक बार।
- list भी इसी तरह काम करती हैं: जैसे-जैसे rows मापी और जोड़ी जाती हैं, थंब list की पूरी लंबाई को follow करता है।

## When it shows

| `mode` | Shows |
|---|---|
| `"scrolling"` (default) | जब कंटेंट स्क्रॉल हो रहा हो, और रुकने के बाद `motion.idle` तक; दिखते समय बार पर पॉइंटर होने से वह बना रहता है। |
| `"hover"` | जब पॉइंटर बार के ऊपर हो (जहाँ वह दिखता है, छिपा होने पर भी), और जैसे `"scrolling"` करता है। |
| `"always"` | हमेशा। |

हर मोड में यह तब दिखता है जब इसका थंब ड्रैग किया जा रहा हो, और आखिरी स्क्रॉल, ड्रैग या hover के बाद `motion.idle` तक रहता है। जब कंटेंट व्यूपोर्ट में समा जाता है, तो यह छिपा रहता है। छिपा होने पर बार `opacity: 0` पर होता है और प्रेस को अपने नीचे की चीज़ तक पहुँचने देता है।

## Motion

`motion` बार के फ़ेड का समय तय करता है, जो नेटिव रूप से चलते हैं, जैसे `gpui-base` का `ScrollbarMotion` करता है:

| Field | Default | Description |
|---|---|---|
| `idle` | `2000` | आखिरी स्क्रॉल, ड्रैग या hover के बाद बार कितनी देर रहता है, मिलीसेकंड में। |
| `enter` | `0` | इसे प्रकट होने में कितना समय लगता है: इसकी opacity linearly बढ़ती है, slide ease out होती है। |
| `exit` | `0` | `idle` समाप्त होने के बाद इसे फ़ेड होकर गायब होने में कितना समय लगता है, ease in के साथ; फ़ेड होते समय यह अपने ट्रैक से बाहर slide करता है। |
| `entrance` | `"fade"` | यह कैसे आता है: `"fade"` अपनी जगह पर, या `"slideAndFade"` उस किनारे से जिस पर यह है (दायाँ, निचला)। |
| `thumbHoverEntrance` | `"fade"` | जब इसके छिपे थंब पर पॉइंटर इसे दिखाता है तब यह कैसे आता है (`"hover"`)। |

बिना durations के बार झटके से आता और जाता है। बीच में उलटा किया गया फ़ेड अपनी गति बनाए रखता है: वह अपनी अवधि के उतने हिस्से तक चलता है जितना तय करना बाकी है। `"always"` बार कभी animate नहीं होता, और न ही कोई तब जब उपयोगकर्ता कम motion माँगता है। ट्रैक उसे clip करता है जो slide करता है। थंब की अपनी motion, जैसे `hover:` पर बढ़ने वाली चौड़ाई, उसकी स्टाइल की होती है (`thumbClass` पर `transition-all`)।

## Props

| Prop | Rust | Type | Default | Description |
|---|---|---|---|---|
| `scroll` | `.scroll(..)` | `YNode` | none | वह scroll view या list जिसे बार follow करता है और चलाता है (उसका `ref`)। |
| `axis` | `.axis(..)` | `"horizontal" \| "vertical"` | `"vertical"` | scroll view का axis: ट्रैक उसी के साथ चलता है। बार बनते समय पढ़ा जाता है। |
| `mode` | `.mode(..)` | `"scrolling" \| "hover" \| "always"` | `"scrolling"` | बार कब दिखता है। |
| `motion` | `.motion(..)` | `ScrollbarMotion` | snaps, `idle` `2000` | यह कैसे दिखता और छिपता है: [Motion](#motion)। |
| `minThumbLength` | `.min_thumb_length(..)` | `number` | `48` | लंबे कंटेंट पर थंब की सबसे छोटी लंबाई, ताकि उसे पकड़ना आसान रहे। |
| `thumbClass`, `thumbStyle` | `.thumb_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | none | थंब। |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | none | screen reader बार के बारे में क्या बोलते हैं। |
| `class`, `style` | style methods | `string`, `StyleProp<ViewStyle>` | none | बार: उसका ट्रैक, जहाँ ऐप उसे रखता है। |

## Parts

| Part | Inside | Styled with |
|---|---|---|
| The track | जहाँ ऐप उसे रखता है | `class`, `style` |
| The thumb | ट्रैक का content box | `thumbClass`, `thumbStyle` |

बार थंब को axis के साथ आकार देता है और चलाता है; उसकी मोटाई और ट्रैक के आर-पार उसकी स्थिति ऐप के हाथ में है (ट्रैक पर `w-1.5` और `items-end` दाईं ओर 6-point का थंब रखते हैं)। ट्रैक की padding थंब को उसके सिरों और किनारों से दूर रखती है।

पार्ट्स जिन states को दिखाते हैं:

- ट्रैक: पॉइंटर के नीचे `hover:`; यह एक `group` है, इसलिए थंब उससे `group-hover:` लेता है (ऐसा थंब जो पॉइंटर के पास आने पर चौड़ा हो जाता है)।
- थंब: पॉइंटर के नीचे `hover:`, ड्रैग किए जाने के दौरान `active:`।

बार की दृश्यता उसकी opacity है: रंगों की पारदर्शिता ट्रैक के background या थंब को दें। जो थंब चौड़ा होता है वह `transition-all` लेता है (यह थंब की स्थिति में कभी देरी नहीं करता, जिसे बार थंब की स्टाइल से अलग तय करता है), और `motion-reduce:` उसे उन लोगों के लिए स्थिर रखता है जो कम motion माँगते हैं।

## Accessibility

- scroll view वही रहता है जिसे screen reader स्क्रॉल करते हैं: वे उसे अपने जेस्चर से चलाते हैं और उसका कंटेंट पढ़ते हैं।
- बार को उन screen reader के लिए `accessibilityLabel` से लेबल किया जाता है जो उस तक पहुँचते हैं।

लेबल, roles और actions के बारे में सामान्य जानकारी के लिए [Accessibility](../docs/accessibility.md) देखें।

## Platform notes

- हर प्लेटफ़ॉर्म वही खींचता है जो ऐप स्टाइल करता है, और थंब उस ऑफ़सेट को follow करता है जो हर प्लेटफ़ॉर्म scroll view के लिए बताता है। थंब के ड्रैग और ट्रैक पर प्रेस माउस, पेन या उँगली से काम करते हैं।
- `"hover"` माउस या टचपैड पॉइंटर को follow करता है (डेस्कटॉप और वेब); टच स्क्रीन पर बार तब दिखता है जब कंटेंट स्क्रॉल हो रहा हो, और उसका छिपा ट्रैक टच को आर-पार जाने देता है।
