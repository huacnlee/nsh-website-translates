---
title: "Collapsible"
description: "Collapsible कॉम्पोनेंट: एक ऐसा क्षेत्र जिसकी सामग्री फैलती और सिमटती है। जब तक ऐप इसे खुला रखता है, यह अपने चाइल्ड एलिमेंट्स के बाद दिखाई देता है, अनुरोध पर स्प्रिंग जैसी ऊँचाई के साथ प्रकट होता है, और इसका ट्रिगर तथा हर रूप ऐप का अपना होता है।"
group: base
demo: el-collapsible
source_hash: cf0c6bafa8f80920
---

# Collapsible

Collapsible एक ऐसा region है जिसकी सामग्री फैलती और सिमटती है: summary के नीचे details, "और दिखाएँ", या advanced settings का कोई सेक्शन। यह अपने children को हमेशा render करता है और `open` होने पर उनके बाद अपना `content` render करता है। `open` का मालिक ऐप है, और उसे पलटने वाला trigger भी (जो children में से एक होता है) ऐप का ही है। इसका रूप-रंग भी ऐप तय करता है: `Collapsible` का अपना कोई trigger, chevron या label नहीं होता। `reveal` के साथ, सामग्री motion के साथ खुलती और बंद होती है: उसके region की ऊँचाई शून्य से सामग्री की अपनी ऊँचाई तक और वापस spring होती है, और collapsible के बाद आने वाली चीज़ें साथ खिसकती हैं।

```rust tabs
use nsh_base::{collapsible, theme};
use nsh_core::{AccessibilityState, prelude::*};

fn storage() -> impl IntoElement {
    let open = signal(false);
    collapsible()
        .open(open)
        .reveal(true)
        .gap_2()
        .child(
            view()
                .role(AccessibilityRole::Button)
                .accessibility_state(move || AccessibilityState {
                    expanded: Some(open.get()),
                    ..AccessibilityState::default()
                })
                .on_press(move || open.update(|o| *o = !*o))
                .flex_row()
                .items_center()
                .justify_between()
                .child(text("Storage"))
                .child(text("›").transition_transform().rotate(move || {
                    if open.get() { deg(90.0) } else { deg(0.0) }
                })),
        )
        .content(text("Photos 120 GB · Apps 54 GB · System 38 GB").text_color(move || theme().muted_foreground))
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { Collapsible } from "nsh/base";

function App() {
  const open = signal(false);
  return (
    <Collapsible
      open={open()}
      reveal
      class="gap-2"
      content={<Text class="text-muted-foreground">Photos 120 GB · Apps 54 GB · System 38 GB</Text>}
    >
      <View
        role="button"
        accessibilityState={{ expanded: open() }}
        onPress={() => open.set(!open())}
        class="flex-row items-center justify-between active:opacity-70"
      >
        <Text class="font-medium">Storage</Text>
        <Text class={`transition-transform ${open() ? "rotate-90" : ""}`}>›</Text>
      </View>
    </Collapsible>
  );
}

mount(App);
```

`Collapsible` [`nsh/base`](../modules/nsh-base.md) से आता है, जो Rust में `nsh-base` crate है। मान ऐप का होता है: उसका trigger `open` को पलटता है, और collapsible वही मान दिखाता है जो ऐप उसे देता है। Rust में `collapsible()` हर prop के लिए एक setter (`.open(..)`, `.reveal(..)`, `.content(..)`), region के लिए typed style methods और हमेशा दिखने वाली सामग्री के लिए `.child(..)` के साथ एक collapsible बनाता है।

## Props

| Prop | Rust | Type | Default | विवरण |
|---|---|---|---|---|
| `open` | `.open(..)` | `boolean` | `false` | फैला हुआ: `content` tree में है, children के बाद। मान का मालिक ऐप है। |
| `reveal` | `.reveal(..)` | `boolean` | `false` | reveal के साथ खुलता और बंद होता है: सामग्री एक ऐसे region में रहती है जो उसे clip करता है, और जिसकी ऊँचाई `open` के चालू होने पर शून्य से सामग्री की अपनी ऊँचाई तक spring होती है और बंद होने पर वापस, critically damped (लगभग 265 ms, बिना overshoot के)। collapsible के बाद की चीज़ें उसके साथ खिसकती हैं, और region के बंद होने तक सामग्री tree में बनी रहती है। reduced motion में यह तुरंत खुलता और बंद होता है। region बंद रहने पर भी layout में रहता है, शून्य ऊँचाई के साथ, इसलिए collapsible का `gap` भी उससे पहले आता है। |
| `content` | `.content(..)` | `JSX.Element` | none | जो फैलता है। यह एक बार बनता है और सिमटे रहने पर भी बना रहता है, इसलिए अंदर की चीज़ें अपनी state (input का text, scroll position, switch) एक बार खुलने से अगली बार खुलने तक बनाए रखती हैं। |
| `children` | `.child(..)` | `JSX.Element` | none | जो दोनों स्थितियों में दिखता है: एक summary, यानी `open` को पलटने वाला trigger। |
| `class`, `style` | style methods | `string`, `StyleProp<ViewStyle>` | none | children और सामग्री के चारों ओर का region (`gap-2` उनके बीच की जगह तय करता है)। |

## Events

Collapsible अपनी ओर से कुछ report नहीं करता: trigger ऐप का है, और उसका press (`role="button"` वाले `View` का `onPress`) वह जगह है जहाँ ऐप `open` को पलटता है।

## Parts

| Part | भीतर | Styling |
|---|---|---|
| Region | | `class`, `style` |
| Children | region, सबसे पहले | उनके अपने elements |
| Reveal का region | region, children के बाद, `reveal` के साथ | none: यह सामग्री को clip करता है और उसकी ऊँचाई लेता है |
| सामग्री | region, children के बाद (`reveal` के साथ reveal के region में), `open` होने पर | उसके अपने elements (`content`) |

`reveal` के बिना, सामग्री तुरंत आती और जाती है, और हर प्लेटफ़ॉर्म region को तब फिर से layout करता है जब वह आती या जाती है। `reveal` के साथ, यह बदलाव उस commit का एक layout animation होता है जो `open` को बदलता है (`LayoutAnimation.configureNext` के रूप में, native रूप से चलता है, इसलिए motion के दौरान कोई JavaScript नहीं चलता): reveal का region शून्य से सामग्री की ऊँचाई तक बढ़ता है और वापस सिकुड़ता है, और उसी बदलाव से खिसकने वाली हर चीज़ के frames, जिनमें collapsible के बाद के views भी शामिल हैं, उसके साथ खिसकते हैं। ऐप का कोई transition साथ चलता है: trigger का chevron घूमता है (`transition-transform`), और सामग्री अपनी classes से fade in हो सकती है।

<a id="accessibility"></a>

## एक्सेसिबिलिटी

- screen readers के लिए region अपने आप में कोई element नहीं है: उसके children और सामग्री जैसी हैं वैसी ही पढ़ी जाती हैं।
- trigger बताता है कि region फैला हुआ है या नहीं: उसे `accessibilityState={{ expanded: open }}` और एक button role दें (`View` पर `role="button"`), और screen readers उसके label के साथ "expanded" या "collapsed" बोलते हैं।
- macOS और web पर, जब trigger presses लेता है तो वह keyboard focus का एक पड़ाव होता है: Tab उस तक पहुँचता है, Space और Return region को पलटते हैं।

labels, roles और announcements के बारे में सामान्य जानकारी के लिए [एक्सेसिबिलिटी](../docs/accessibility.md) देखें।

<a id="platform-notes"></a>

## प्लेटफ़ॉर्म नोट्स

- `open` होने पर हर प्लेटफ़ॉर्म सामग्री को children के बाद दिखाता है, और अन्यथा उसे layout से बाहर रखता है।
- `reveal` के साथ, हर प्लेटफ़ॉर्म region की ऊँचाई को अपने animator पर spring करता है (iOS, Android, macOS, Windows, Linux, GPUI और web), और जब तक सिस्टम reduced motion माँगता है, उसे तुरंत खोलता और बंद करता है।
- iOS, Android और Mac Catalyst: trigger का press एक tap है। Desktops (macOS, Windows, Linux, GPUI) और web पर: एक click, और macOS तथा web पर focus वाले trigger पर Space या Return।
