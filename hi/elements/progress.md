---
title: "Progress"
description: "Progress कॉम्पोनेन्ट: एक रैखिक प्रोग्रेस बार, जो स्क्रीन रीडर के लिए अपनी भूमिका (role), रेंज और वैल्यू को संभालता है और वैल्यू के अनुसार इंडिकेटर की चौड़ाई तय करता है; इसमें एक ट्रैक और एक इंडिकेटर होता है जिन्हें ऐप स्टाइल करता है।"
group: base
demo: el-progress
source_hash: c9a75dc1aac1177f
---

# Progress

प्रोग्रेस बार दिखाता है कि ज्ञात विस्तार वाला कोई कार्य कितना आगे बढ़ा है (डाउनलोड, अपलोड, सेटअप का कोई चरण), या `indeterminate` होने पर यह कि अज्ञात विस्तार वाला कोई कार्य जारी है। स्क्रीन रीडर को जो मिलता है, यानी progress bar role, 0 से 100 की रेंज और वैल्यू, और इंडिकेटर की चौड़ाई (ट्रैक की चौड़ाई का `value` प्रतिशत), यह सब प्रोग्रेस बार संभालता है। रूप ऐप का होता है: `Progress` के अपने कोई रंग, आकार, रेडियस, मोशन या लेबल नहीं होते। यह एक ट्रैक से बनता है जिसके अंदर इंडिकेटर होता है, फिर इसके चिल्ड्रन (एक लेबल, टेक्स्ट के रूप में वैल्यू), और हर भाग को ऐप स्टाइल करता है।

```rust tabs
use nsh_base::{progress, theme};
use nsh_core::prelude::*;

fn upload(sent: Signal<f32>) -> impl IntoElement {
    progress()
        .value(sent)
        .accessibility_label("Uploading photos")
        .gap_2()
        .track_style(|s| s.h(px(8.0)).rounded_full().overflow_hidden().bg(move || theme().muted))
        .indicator_style(|s| s.h_full().rounded_full().bg(move || theme().primary))
        .child(
            text(move || format!("{:.0}%", sent.get()))
                .text_sm()
                .text_color(move || theme().muted_foreground),
        )
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { Progress } from "nsh/base";

function App() {
  const sent = signal(40);
  return (
    <Progress
      value={sent()}
      accessibilityLabel="Uploading photos"
      class="gap-2"
      trackClass="h-2 overflow-hidden rounded-full bg-muted"
      indicatorClass="h-full rounded-full bg-primary"
    >
      <Text class="text-sm text-muted-foreground">{`${sent()}%`}</Text>
    </Progress>
  );
}

mount(App);
```

`Progress` [`nsh/base`](../modules/nsh-base.md) से आता है, जो Rust में `nsh-base` crate है। वैल्यू ऐप की होती है: प्रोग्रेस बार वही `value` दिखाता है जो ऐप उसे देता है, जिसे 0 से 100 के बीच सीमित किया जाता है। Rust में `progress()` हर prop के लिए एक सेटर (`.value(..)`, `.indicator_style(..)`), प्रोग्रेस बार के लिए टाइप्ड स्टाइल मेथड और उसके लेबल के लिए `.child(..)` के साथ एक प्रोग्रेस बार बनाता है।

## Props

| Prop | Rust | टाइप | डिफ़ॉल्ट | विवरण |
|---|---|---|---|---|
| `value` | `.value(..)` | `number` | `0` | कार्य कितना आगे बढ़ा है, 0 से 100 तक के प्रतिशत के रूप में (रेंज से बाहर होने पर निकटतम सिरा)। इंडिकेटर ट्रैक की चौड़ाई का उतना ही हिस्सा होता है, और स्क्रीन रीडर इसे बोलते हैं। |
| `indeterminate` | `.indeterminate(..)` | `boolean` | `false` | कार्य का विस्तार अज्ञात है: स्क्रीन रीडर बिना वैल्यू वाला प्रोग्रेस बार सुनते हैं, और इंडिकेटर की चौड़ाई ऐप तय करता है (`indicatorClass`)। |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | कोई नहीं | स्क्रीन रीडर क्या बोलते हैं: क्या प्रगति पर है, जब इसके चिल्ड्रन में ऐसा कोई टेक्स्ट नहीं जो यह बताए। |
| `trackClass`, `trackStyle` | `.track_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | कोई नहीं | ट्रैक, वह भाग जिसे इंडिकेटर भरता है। |
| `indicatorClass`, `indicatorStyle` | `.indicator_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | कोई नहीं | इंडिकेटर, ट्रैक के अंदर: उसकी ऊँचाई, रंग और मोशन। |
| `children` | `.child(..)` | `JSX.Element` | कोई नहीं | ट्रैक के बाद की सामग्री: एक लेबल या टेक्स्ट के रूप में वैल्यू, जिसे स्क्रीन रीडर बोलते हैं। |
| `class`, `style` | स्टाइल मेथड | `string`, `StyleProp<ViewStyle>` | कोई नहीं | प्रोग्रेस बार स्वयं: ट्रैक और लेबल के चारों ओर का कॉलम (या रो)। |

<a id="parts"></a>

## भाग

| भाग | अंदर | स्टाइल करने का तरीका |
|---|---|---|
| प्रोग्रेस बार | | `class`, `style` |
| ट्रैक | प्रोग्रेस बार, सबसे पहले | `trackClass`, `trackStyle` |
| इंडिकेटर | ट्रैक | `indicatorClass`, `indicatorStyle`; इसकी चौड़ाई ट्रैक की चौड़ाई का `value` प्रतिशत है |
| लेबल | प्रोग्रेस बार, ट्रैक के बाद | इसके अपने एलिमेंट (`children`) |

इंडिकेटर ट्रैक के अग्रणी किनारे से शुरू होता है; `overflow-hidden` और ट्रैक पर रेडियस इसके सिरे को ट्रैक के साथ गोल करते हैं। `w-*` क्लास या `indicatorStyle` में `width` वैल्यू की चौड़ाई की जगह ले लेता है, और इसी तरह एक indeterminate बार को अपनी चौड़ाई मिलती है।

## Indeterminate

जब तक विस्तार अज्ञात है, `indeterminate` सेट करें और इंडिकेटर को ऐप की अपनी चौड़ाई और मोशन दें। मोशन ऐप का चुनाव है, और `motion-reduce:` उन लोगों के लिए उसे स्थिर रखता है जो कम मोशन माँगते हैं:

```tsx
<Progress
  value={0}
  indeterminate={connecting()}
  trackClass="h-2 overflow-hidden rounded-full bg-muted"
  indicatorClass={
    connecting()
      ? "h-full w-1/3 rounded-full bg-primary animate-pulse motion-reduce:animate-none"
      : "h-full rounded-full bg-primary"
  }
/>
```

<a id="accessibility"></a>

## सुलभता

- स्क्रीन रीडर के लिए प्रोग्रेस बार एक ही एलिमेंट है, जिसका role `"progressbar"` है, रेंज 0 से 100 है और उसकी वैल्यू है (VoiceOver और TalkBack इसे प्रतिशत के रूप में बोलते हैं); ट्रैक और इंडिकेटर उसके भाग हैं। इसका लेबल इसके चिल्ड्रन का टेक्स्ट है; जब चिल्ड्रन में टेक्स्ट न हो तो `accessibilityLabel` दें।
- `indeterminate` होने पर यह role और रेंज बनाए रखता है और इसकी कोई वैल्यू नहीं होती (ब्राउज़र में: `aria-valuenow` छोड़ दिया जाता है, जैसा कि ARIA indeterminate प्रोग्रेस बार के लिए कहता है)।
- यह न प्रेस लेता है, न कीबोर्ड फ़ोकस: यह केवल जानकारी देता है, और कार्य को शुरू या बंद करने वाले कंट्रोल ऐप के होते हैं।

लेबल, roles और announcements के बारे में सामान्य जानकारी के लिए [एक्सेसिबिलिटी](../docs/accessibility.md) देखें।

<a id="platform-notes"></a>

## प्लेटफ़ॉर्म नोट्स

- हर प्लेटफ़ॉर्म वही बनाता है जो ऐप स्टाइल करता है; इंडिकेटर की चौड़ाई तुरंत `value` का अनुसरण करती है, और जब ऐप बदलाव को एनिमेट करता है तो बदलाव एनिमेट होता है।
- स्क्रीन रीडर: VoiceOver (iOS, macOS) वैल्यू को प्रतिशत के रूप में और बार को बार-बार अपडेट होने वाले के रूप में सुनता है; TalkBack, UI Automation (Windows), GTK की accessibility (Linux) और ब्राउज़र (`aria-valuenow`) को रेंज और वैल्यू मिलती है।
