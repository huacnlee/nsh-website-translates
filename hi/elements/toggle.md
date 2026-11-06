---
title: "Toggle"
description: "Toggle और ToggleGroup: एक बटन जो चालू या बंद रहता है, और ऐसे बटनों का एक टूलबार। हर Toggle प्रेस, कीबोर्ड से सक्रिय करना, disabled स्थिति, और स्क्रीन रीडर के लिए अपना role और pressed स्थिति खुद संभालता है; ग्रुप एक टूलबार है जिसमें कीबोर्ड फ़ोकस का एक ही स्टॉप होता है; दिखावट और कौन-से Toggle pressed हैं, यह ऐप तय करती है।"
group: base
demo: el-toggle
source_hash: d8d3727dd9d04426
---

# Toggle

टॉगल एक ऐसा बटन है जो चालू या बंद रहता है: टेक्स्ट टूलबार में बोल्ड, पसंदीदा का तारा, व्यू का कोई विकल्प। `Toggle` ऐसे एक टॉगल का व्यवहार संभालता है: प्रेस, कीबोर्ड से सक्रियण, disabled स्थिति, और pressed स्टेट के साथ बटन रोल, जिसे स्क्रीन रीडर टॉगल बटन के रूप में बोलते हैं। कई टॉगल के चारों ओर `ToggleGroup` एक टूलबार बनाता है: स्क्रीन रीडर इसे एक टूलबार के रूप में बोलते हैं, कीबोर्ड एक ही स्टॉप में इस तक पहुँचता है और ऐरो कीज़ से इसके टॉगल के बीच घूमता है। रूप-रंग ऐप का अपना होता है: टॉगल के अपने कोई रंग, आकार, आइकन या लेबल नहीं होते। इसके children ऐप के अपने आइकन या लेबल होते हैं, और टॉगल पर `aria-pressed:` क्लास, या उसके अंदर की चीज़ों पर `group-aria-pressed:` क्लास, उसकी स्टेट के अनुसार लागू होती हैं।

```rust tabs
use nsh_base::{theme, toggle, toggle_group};
use nsh_core::prelude::*;

fn formatting() -> impl IntoElement {
    let bold = signal(true);
    let italic = signal(false);
    let item = move |label: &'static str, on: Signal<bool>| {
        toggle()
            .pressed(on)
            .accessibility_label(label)
            .on_change(move |pressed: &bool| on.set(*pressed))
            .size_8()
            .items_center()
            .justify_center()
            .rounded(move || theme().radius)
            .pressed_style(|s| s.bg(move || theme().accent))
            .child(text(&label[..1]).text_sm().text_color(move || {
                if on.get() { theme().accent_foreground } else { theme().muted_foreground }
            }))
    };
    toggle_group()
        .flex_row()
        .self_start()
        .gap_1()
        .child(item("Bold", bold))
        .child(item("Italic", italic))
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { Toggle, ToggleGroup } from "nsh/base";

function App() {
  const marks = signal<string[]>(["bold"]);
  const item = (value: string, label: string) => (
    <Toggle
      pressed={marks().includes(value)}
      accessibilityLabel={label}
      onChange={({ pressed }) =>
        marks.set(pressed ? [...marks(), value] : marks().filter((m) => m !== value))
      }
      class="group size-8 items-center justify-center rounded-(--radius) aria-pressed:bg-accent"
    >
      <Text class="text-sm text-muted-foreground group-aria-pressed:text-accent-foreground">{label[0]}</Text>
    </Toggle>
  );
  return (
    <ToggleGroup class="flex-row self-start gap-1">
      {item("bold", "Bold")}
      {item("italic", "Italic")}
    </ToggleGroup>
  );
}

mount(App);
```

`Toggle` और `ToggleGroup` [`nsh/base`](../modules/nsh-base.md) से आते हैं, जो Rust में `nsh-base` क्रेट है। वैल्यू ऐप की होती है: हर टॉगल को बताया जाता है कि वह pressed है या नहीं, प्रेस `onChange` के साथ वही वैल्यू रिपोर्ट करता है जो वह चाहता है, और टॉगल वही `pressed` दिखाता है जो ऐप वापस देता है। ग्रुप भी कोई वैल्यू नहीं रखता, इसलिए कितने टॉगल pressed हो सकते हैं, यह भी ऐप तय करता है: कितने भी (बोल्ड, इटैलिक और अंडरलाइन), या ठीक एक (अलाइनमेंट, व्यू स्विचर), जहाँ ऐप माँगे गए टॉगल को press करता है, बाकी को छोड़ देता है और pressed टॉगल को pressed ही रखता है। Rust में `toggle()` और `toggle_group()` इन्हें बनाते हैं, जिनमें हर prop के लिए एक सेटर (`.pressed(..)`), हर इवेंट के लिए एक लिसनर (`.on_change(..)`), टाइप्ड स्टाइल मेथड और उनकी सामग्री के लिए `.child(..)` होता है।

## Props

<a id="toggle-1"></a>

### Toggle

| Prop | Rust | Type | Default | Description |
|---|---|---|---|---|
| `pressed` | `.pressed(..)` | `boolean` | `false` | चालू या बंद: स्क्रीन रीडर इसे pressed बोलते हैं, और `aria-pressed:` स्टाइल लागू होती हैं। प्रेस `onChange` के साथ दूसरी वैल्यू रिपोर्ट करता है; टॉगल वही वैल्यू दिखाता है जो ऐप वापस देता है। |
| `disabled` | `.disabled(..)` | `boolean` | `false` | कोई प्रेस नहीं और प्रेस का कोई फ़ीडबैक नहीं; `disabled:` स्टाइल लागू होती हैं, और स्क्रीन रीडर इसे dimmed बोलते हैं। disabled `ToggleGroup` में मौजूद टॉगल भी disabled होता है। |
| `pressedStyle` | `.pressed_style(\|s\| ..)` | `StyleProp<ViewStyle>` | कोई नहीं | pressed और not disabled होने पर टॉगल की स्टाइल, `aria-pressed:` क्लास के रूप में। |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | कोई नहीं | स्क्रीन रीडर क्या बोलते हैं: टॉगल क्या चालू करता है, जब उसके children में इसे बताने वाला टेक्स्ट न हो (जैसे आइकन)। |
| `hitSlop` | `.hit_slop(..)` | `number \| Partial<Edges>` | कोई नहीं | अपनी सीमाओं से बाहर कितनी दूर तक प्रेस अब भी गिने जाते हैं, points में: हर तरफ़ के लिए एक संख्या, या नामित तरफ़ें। जैसे किसी view का `hitSlop`। |
| `children` | `.child(..)` | `JSX.Element` | कोई नहीं | ऐप का आइकन या लेबल, जिसे स्क्रीन रीडर बोलते हैं। |
| `class`, `style` | style methods | `string`, `StyleProp<ViewStyle>` | कोई नहीं | टॉगल स्वयं: उसकी सामग्री के चारों ओर की सतह। |
| `activeStyle`, `hoverStyle`, `focusStyle`, `disabledStyle` | `.active(\|s\| ..)`, `.hover(..)`, `.focus(..)`, `.disabled_style(..)` | `StyleProp<ViewStyle>` | कोई नहीं | प्रेस जारी रहने, hover, focus या disabled होने पर टॉगल की स्टाइल, `<state>:` क्लास के रूप में। |

### ToggleGroup

| Prop | Rust | Type | Default | Description |
|---|---|---|---|---|
| `disabled` | `.disabled(..)` | `boolean` | `false` | ग्रुप का हर टॉगल disabled हो जाता है, चाहे उसका अपना `disabled` कुछ भी हो। |
| `children` | `.child(..)` | `JSX.Element` | कोई नहीं | ग्रुप के टॉगल, और उनके बीच ऐप जो भी लेआउट करे (जैसे सेपरेटर)। |
| `class`, `style` | style methods | `string`, `StyleProp<ViewStyle>` | कोई नहीं | ग्रुप का लेआउट और रूप: डिफ़ॉल्ट रूप से कॉलम, पंक्ति के लिए `flex-row`। |

## Events

| Event | Rust | Description |
|---|---|---|
| `onChange` (`Toggle`) | `.on_change(\|pressed: &bool\| ..)` | टॉगल को press किया गया: टैप, क्लिक, कीबोर्ड फ़ोकस होने पर Space या Return, या स्क्रीन रीडर का सक्रियण। `{ pressed }` वह वैल्यू है जो टॉगल चाहता है, यानी `pressed` का उलटा। यह कुछ भी बदलने से पहले चलता है: टॉगल वही `pressed` दिखाता है जो ऐप वापस देता है। |

`ToggleGroup` की ऐरो की केवल कीबोर्ड फ़ोकस को ले जाती है: यह कुछ press नहीं करती। disabled टॉगल कुछ रिपोर्ट नहीं करता।

## Parts

| Part | Inside | Styled with | States |
|---|---|---|---|
| ग्रुप | | `ToggleGroup` के `class`, `style` | |
| टॉगल | ग्रुप, या कहीं भी | `Toggle` के `class`, `style` | `aria-pressed:`, `disabled:`, `active:`, `hover:`, `focus:` (या `pressedStyle`, `disabledStyle`, ...) |
| आइकन या लेबल | टॉगल | अपने स्वयं के एलिमेंट (`children`) | `group-aria-pressed:`, `group-disabled:` और टॉगल के `class` पर `group` के साथ अन्य `group-*:` वेरिएंट |

`aria-pressed:` का मतलब है टॉगल का चालू होना; `active:` का मतलब है प्रेस जारी होना, चालू हो या बंद। pressed टॉगल को उसकी अपनी सतह से दिखाएँ: फ़िल, उठी हुई पिल, या गहरा आइकन ([Design guides](../docs/design-guides.md#interaction-states) देखें)।

## Segmented

जिस ग्रुप के टॉगल जुड़े हुए हों और एक समय में एक ही pressed हो, वह segmented control (व्यू स्विचर) है: ऐप एक वैल्यू रखता है और उस वैल्यू वाले टॉगल को press करता है। जुड़ा हुआ रूप ऐप की क्लास से बनता है:

```tsx
<ToggleGroup class="flex-row self-start">
  <Each of={["grid", "list"]}>
    {(value) => (
      <Toggle
        pressed={view() === value()}
        accessibilityLabel={`${value()} view`}
        onChange={({ pressed }) => pressed && view.set(value())}
        class="-ml-px h-8 px-3 border border-border first:ml-0 first:rounded-l-(--radius) last:rounded-r-(--radius) aria-pressed:bg-accent"
      >
        <Text class="text-sm">{value()}</Text>
      </Toggle>
    )}
  </Each>
</ToggleGroup>
```

## Disabled

disabled टॉगल कोई प्रेस नहीं लेता, और स्क्रीन रीडर उसे dimmed बोलते हैं। उसकी `disabled:` क्लास उसकी `aria-pressed:` क्लास के ऊपर लागू होती हैं, और उसके अंदर की `group-disabled:` क्लास भी उसके अनुसार चलती हैं। `ToggleGroup` पर `disabled` उसके हर टॉगल को disabled कर देता है, यानी ऐप द्वारा लॉक किया गया टूलबार:

```tsx
<ToggleGroup disabled={readonly()} class="flex-row gap-1">
  <Toggle pressed={bold()} onChange={({ pressed }) => bold.set(pressed)} class="size-8 disabled:opacity-50">
    <Text>B</Text>
  </Toggle>
</ToggleGroup>
```

<a id="a-small-target-with-hitslop"></a>

## hitSlop के साथ छोटा टारगेट

आइकन टॉगल उँगली से छोटा हो सकता है। `hitSlop` उसके पास पड़ने वाले प्रेस को गिनता है, हर तरफ़ से points में, उसके लेआउट या रूप को बदले बिना: हर तरफ़ के लिए एक संख्या, या नामित तरफ़ें (`{ top: 8, bottom: 8 }`), ठीक वैसे जैसे [view का `hitSlop`](./index.md#presses-and-feedback) उन्हें लेता है।

```tsx
<Toggle
  pressed={favorite()}
  hitSlop={12}
  accessibilityLabel="Favorite"
  onChange={({ pressed }) => favorite.set(pressed)}
  class="size-5 items-center justify-center"
>
  <Text>★</Text>
</Toggle>
```

## Accessibility

- स्क्रीन रीडर के लिए टॉगल एक ही एलिमेंट है, जिसका रोल `"button"` है और साथ में उसकी pressed स्टेट: यानी टॉगल बटन। उसका लेबल उसके children का टेक्स्ट है, या `accessibilityLabel`।
- `ToggleGroup` का रोल `"toolbar"` है: स्क्रीन रीडर उसके अंदर के टॉगल को एक टूलबार के रूप में सुनते हैं, और हर टॉगल फिर भी अपना अलग एलिमेंट रहता है।
- `disabled` को वैसे ही बोला जाता है जैसे प्लेटफ़ॉर्म उसे बोलता है (VoiceOver, TalkBack, UI Automation, ब्राउज़र का accessibility tree)।
- macOS और वेब पर ग्रुप कीबोर्ड फ़ोकस का एक स्टॉप है, और ऐरो कीज़ उसके टॉगल के बीच घूमती हैं (नीचे देखें)।

लेबल, रोल और घोषणाओं के बारे में सामान्य जानकारी के लिए [एक्सेसिबिलिटी](../docs/accessibility.md) देखें।

## Keyboard

macOS और वेब पर, जहाँ Tab प्रेस लेने वाले views तक पहुँचता है, `ToggleGroup` [WAI-ARIA toolbar pattern](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/) का पालन करता है:

| Key | What it does |
|---|---|
| Tab, Shift+Tab | ग्रुप में पहले pressed टॉगल पर प्रवेश करता है (यदि कोई pressed नहीं है तो पहले ऐसे टॉगल पर जो disabled नहीं है), और एक ही चरण में उससे बाहर निकल जाता है। |
| Right, Down | फ़ोकस को अगले टॉगल पर ले जाता है, अंतिम से पहले पर। |
| Left, Up | फ़ोकस को पिछले टॉगल पर ले जाता है, पहले से अंतिम पर। |
| Home, End | फ़ोकस को पहले या अंतिम टॉगल पर ले जाता है। |
| Space, Return | फ़ोकस वाले टॉगल को press करता है। |

ऐरो कीज़ disabled टॉगल को छोड़ देती हैं और कुछ press नहीं करतीं: टॉगल केवल तभी बदलता है जब उसे press किया जाए। ग्रुप का लेआउट जो भी हो, जो ऐप की क्लास है, ऐरो के दोनों जोड़े फ़ोकस को ले जाते हैं। right-to-left लेआउट में Left और Right की भूमिकाएँ आपस में बदल जाती हैं: Left अगले टॉगल पर और Right पिछले पर ले जाता है; Up, Down, Home और End अपनी भूमिका बनाए रखते हैं। `focus:` स्टाइल दिखाती हैं कि फ़ोकस कहाँ है। `ToggleGroup` के बाहर का `Toggle` अपने आप में एक अलग स्टॉप है।

## Platform notes

- iOS, Android और Mac Catalyst: प्रेस एक ऐसा टैप है जो टॉगल पर समाप्त होता है, उसकी सामग्री सहित।
- डेस्कटॉप (macOS, Windows, Linux, GPUI) और वेब: प्रेस एक क्लिक है। macOS और वेब पर, Space और Return भी कीबोर्ड फ़ोकस वाले टॉगल को press करते हैं, और ऐरो कीज़, Home और End उसे ले जाती हैं ([कीबोर्ड](#keyboard))।
- हर प्लेटफ़ॉर्म वही बनाता है जो ऐप स्टाइल करता है: टॉगल, pressed टॉगल की सतह और ग्रुप का ट्रैक।
