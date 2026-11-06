---
title: "Switch"
description: "Switch कॉम्पोनेंट: एक on / off कंट्रोल जो प्रेस, कीबोर्ड एक्टिवेशन, disabled स्थिति और स्क्रीन रीडर के लिए अपनी role और value को संभालता है, जिसमें एक ट्रैक और एक थंब होता है जिसे ऐप स्टाइल करता है।"
group: base
demo: el-switch
source_hash: d203427a791f5543
---

# Switch

Switch किसी सेटिंग को चालू या बंद करता है, और बदलाव तुरंत लागू हो जाता है। व्यवहार उसी का है: प्रेस, कीबोर्ड से सक्रियण, disabled स्थिति, और स्क्रीन रीडर के लिए switch role व उसका मान। रूप ऐप का है: `Switch` के अपने कोई रंग, आकार, motion या label नहीं होते। यह एक track से बना है जिसके अंदर एक thumb होता है, फिर उसके children (एक label)। ऐप हर भाग को स्टाइल करता है, `checked:` और `disabled:` classes के साथ जो switch का अनुसरण करती हैं।

```rust tabs
use nsh_base::{switch, theme};
use nsh_core::prelude::*;

fn wifi() -> impl IntoElement {
    let on = signal(false);
    switch()
        .checked(on)
        .on_change(move |next: &bool| on.set(*next))
        .flex_row()
        .items_center()
        .gap_3()
        .track_style(|s| {
            s.w(px(44.0))
                .p(px(2.0))
                .rounded_full()
                .bg(move || theme().muted)
                .transition_colors()
                .checked(|s| s.bg(move || theme().primary))
        })
        .thumb_style(|s| {
            s.size(px(20.0))
                .rounded_full()
                .bg(move || theme().background)
                .shadow_sm()
                .transition_transform()
                .checked(|s| s.translate_x(px(20.0)))
        })
        .child(text("Wi-Fi"))
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { Switch } from "nsh/base";

function App() {
  const on = signal(false);
  return (
    <Switch
      checked={on()}
      onChange={({ checked }) => on.set(checked)}
      class="flex-row items-center gap-3"
      trackClass="w-11 rounded-full bg-muted p-0.5 transition-colors checked:bg-primary"
      thumbClass="size-5 rounded-full bg-background shadow-sm transition-transform checked:translate-x-5"
    >
      <Text>Wi-Fi</Text>
    </Switch>
  );
}

mount(App);
```

`Switch` [`nsh/base`](../modules/nsh-base.md) से आता है, जो Rust में `nsh-base` crate है। मान ऐप का है: प्रेस `onChange` के साथ अगला मान रिपोर्ट करता है, और switch वही `checked` दिखाता है जो ऐप वापस देता है। Rust में `switch()` इसे बनाता है: हर prop के लिए एक setter (`.checked(..)`, `.track_style(..)`), हर event के लिए एक listener (`.on_change(..)`), switch के लिए typed style methods, और उसके label के लिए `.child(..)`। किसी भाग की style में state methods (`.checked(..)`, `.disabled_style(..)`) होते हैं जो switch का अनुसरण करते हैं।

## Props

| Prop | Rust | प्रकार | डिफ़ॉल्ट | विवरण |
|---|---|---|---|---|
| `checked` | `.checked(..)` | `boolean` | `false` | चालू या बंद। प्रेस `onChange` के साथ अगला मान रिपोर्ट करता है; switch वही मान दिखाता है जो ऐप वापस देता है। |
| `disabled` | `.disabled(..)` | `boolean` | `false` | कोई प्रेस नहीं और प्रेस का कोई फ़ीडबैक नहीं; `disabled:` styles switch और उसके भागों पर लागू होती हैं, और स्क्रीन रीडर बताते हैं कि यह dimmed है। |
| `checkedStyle` | `.checked_style(\|s\| ..)` | `StyleProp<ViewStyle>` | कोई नहीं | `checked` होने पर और disabled न होने पर switch की style, `checked:` classes के रूप में। |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | कोई नहीं | स्क्रीन रीडर क्या बोलते हैं: switch क्या चालू करता है, जब उसके children में इसे बताने वाला कोई टेक्स्ट न हो। |
| `trackClass`, `trackStyle` | `.track_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | कोई नहीं | track, यानी वह भाग जिस पर thumb चलता है। |
| `thumbClass`, `thumbStyle` | `.thumb_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | कोई नहीं | thumb, जो track के अंदर होता है। |
| `hitSlop` | `.hit_slop(..)` | `number \| Partial<Edges>` | कोई नहीं | अपनी सीमाओं के कितना बाहर तक प्रेस अब भी गिने जाते हैं, points में: सभी तरफ़ के लिए एक संख्या, या नामित तरफ़ें। जैसा view के `hitSlop` में होता है। |
| `children` | `.child(..)` | `JSX.Element` | कोई नहीं | track के बाद की सामग्री: एक label, जिसे स्क्रीन रीडर बोलते हैं। |
| `class`, `style` | style methods | `string`, `StyleProp<ViewStyle>` | कोई नहीं | स्वयं switch: track और label के आसपास की row। |
| `activeStyle`, `hoverStyle`, `focusStyle`, `disabledStyle` | `.active(\|s\| ..)`, `.hover(..)`, `.focus(..)`, `.disabled_style(..)` | `StyleProp<ViewStyle>` | कोई नहीं | pressed, hovered, focused या disabled होने पर switch की style, `<state>:` classes के रूप में। |

## Events

| Event | Rust | विवरण |
|---|---|---|
| `onChange` | `.on_change(\|checked: &bool\| ..)` | switch को दबाया गया: tap, click, फ़ोकस होने पर Space या Return, या स्क्रीन रीडर का सक्रियण। यह वह मान `checked` के रूप में रिपोर्ट करता है जो switch माँगता है, यानी उसके मौजूदा `checked` का उल्टा। |

Disabled switch कुछ रिपोर्ट नहीं करता।

<a id="parts"></a>

## भाग

| भाग | अंदर | स्टाइल का तरीका | States |
|---|---|---|---|
| Switch | | `class`, `style` | `checked:`, `disabled:`, `active:`, `hover:`, `focus:` (या `checkedStyle`, `disabledStyle`, ...) |
| Track | switch, सबसे पहले | `trackClass`, `trackStyle` | `checked:`, `disabled:` switch का अनुसरण करते हैं |
| Thumb | track | `thumbClass`, `thumbStyle` | `checked:`, `disabled:` switch का अनुसरण करते हैं |
| Label | switch, track के बाद | अपने elements (`children`) | `group-checked:` और अन्य `group-*:` variants, switch के `class` पर `group` के साथ |

Thumb अपनी `checked:` styles से चलता है: translation (`checked:translate-x-5`), या margin या track का alignment (track पर `checked:justify-end`)। `transition-*` class बदलाव को native रूप से animate करती है। label को track से पहले रखने के लिए row को उल्टा करें: `class="flex-row-reverse justify-between"`।

## Disabled

Disabled switch कोई प्रेस नहीं लेता, और स्क्रीन रीडर उसे dimmed बताते हैं। उसकी `disabled:` classes और उसके track व thumb की classes लागू होती हैं, उनकी `checked:` classes के ऊपर:

```tsx
<Switch
  checked={on()}
  disabled={!online()}
  onChange={({ checked }) => on.set(checked)}
  class="flex-row items-center gap-3 disabled:opacity-50"
  trackClass="w-11 rounded-full bg-muted p-0.5 checked:bg-primary disabled:bg-muted"
  thumbClass="size-5 rounded-full bg-background checked:translate-x-5"
>
  <Text>Sync over cellular</Text>
</Switch>
```

<a id="a-small-target-with-hitslop"></a>

## hitSlop के साथ छोटा लक्ष्य

जिस switch के बगल में कोई label नहीं है, वह उँगली से छोटा हो सकता है। `hitSlop` उसके पास पड़ने वाले प्रेस को भी गिनता है, हर तरफ़ से points में, उसके layout या रूप को बदले बिना: सभी तरफ़ के लिए एक संख्या, या नामित तरफ़ें (`{ top: 8, bottom: 8 }`), जैसे [view का `hitSlop`](./index.md#presses-and-feedback) इन्हें लेता है।

```tsx
<Switch
  checked={on()}
  hitSlop={{ top: 8, bottom: 8 }}
  accessibilityLabel="Notifications"
  onChange={({ checked }) => on.set(checked)}
  trackClass="w-9 rounded-full bg-muted p-0.5 checked:bg-primary"
  thumbClass="size-4 rounded-full bg-background checked:translate-x-4"
/>
```

<a id="accessibility"></a>

## एक्सेसिबिलिटी

- स्क्रीन रीडर के लिए switch एक ही element है, जिसका role `"switch"` है और जिसका मान (चालू या बंद) बताया जाता है; track और thumb उसके भाग हैं। उसका label उसके children का टेक्स्ट है; अगर कोई टेक्स्ट नहीं है तो `accessibilityLabel` दें।
- `disabled` को वैसे ही बोला जाता है जैसे प्लेटफ़ॉर्म बोलता है (VoiceOver, TalkBack, UI Automation, ब्राउज़र का accessibility tree)।
- macOS और web पर switch कीबोर्ड फ़ोकस का एक पड़ाव है: Tab से उस तक पहुँचा जाता है, Space और Return उसे टॉगल करते हैं, और `focus:` styles दिखाती हैं कि फ़ोकस कहाँ है।

labels, roles और announcements के बारे में सामान्य जानकारी के लिए [एक्सेसिबिलिटी](../docs/accessibility.md) देखें।

<a id="platform-notes"></a>

## प्लेटफ़ॉर्म नोट्स

- iOS, Android और Mac Catalyst: प्रेस एक tap है जो switch पर ही खत्म होता है, उसके label सहित।
- डेस्कटॉप (macOS, Windows, Linux, GPUI) और web: प्रेस एक click है। macOS और web पर, Space और Return भी उस switch को टॉगल करते हैं जिस पर कीबोर्ड फ़ोकस है।
- हर प्लेटफ़ॉर्म वही बनाता है जो ऐप स्टाइल करता है; thumb वैसे ही चलता है जैसा ऐप की styles और transitions कहती हैं।
