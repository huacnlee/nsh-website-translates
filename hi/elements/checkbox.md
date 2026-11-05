---
title: "Checkbox"
description: "Checkbox कॉम्पोनेंट: चेक किया हुआ, अनचेक किया हुआ या इंडेटरमिनेट कंट्रोल, जो प्रेस, कीबोर्ड एक्टिवेशन, disabled स्टेट और स्क्रीन रीडर के लिए अपना रोल और वैल्यू संभालता है, साथ ही एक इंडिकेटर देता है जिसे ऐप स्टाइल और मार्क करता है।"
group: base
demo: el-checkbox
source_hash: c31b1f22eacafd92
---

# Checkbox

Checkbox किसी विकल्प, सूची के किसी आइटम या सभी आइटम को चुनता है। यह checked, unchecked या indeterminate हो सकता है (न checked, न unchecked: आंशिक चयन पर "सभी चुनें")। व्यवहार इसी का है: प्रेस, कीबोर्ड से सक्रिय करना, disabled स्थिति, और स्क्रीन रीडर के लिए checkbox रोल और उसका मान। रूप ऐप का है: `Checkbox` का अपना कोई बॉक्स, मार्क, रंग, आकार या लेबल नहीं होता। यह एक indicator (बॉक्स) से बना है जिसके अंदर ऐप का मार्क होता है, फिर उसके children (एक लेबल) होते हैं, और ऐप हर भाग को स्टाइल करता है, `checked:`, `indeterminate:` और `disabled:` क्लासेज़ के साथ जो checkbox की स्थिति का अनुसरण करती हैं।

```rust tabs
use nsh_base::{checkbox, theme};
use nsh_core::prelude::*;

fn notify() -> impl IntoElement {
    let on = signal(false);
    checkbox()
        .checked(on)
        .on_change(move |next: &bool| on.set(*next))
        .flex_row()
        .items_center()
        .gap_2()
        .indicator_style(|s| {
            s.size(px(20.0))
                .items_center()
                .justify_center()
                .rounded_md()
                .border_2()
                .border_color(move || theme().border)
                .transition_colors()
                .checked(|s| s.bg(move || theme().primary).border_color(move || theme().primary))
        })
        .indicator(text(move || if on.get() { "✓" } else { "" }).text_color(move || theme().primary_foreground))
        .child(text("Notify me"))
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { Checkbox } from "nsh/base";

function App() {
  const on = signal(false);
  return (
    <Checkbox
      checked={on()}
      onChange={({ checked }) => on.set(checked)}
      class="flex-row items-center gap-2"
      indicatorClass="size-5 items-center justify-center rounded-md border-2 border-border transition-colors checked:border-primary checked:bg-primary"
      indicator={<Text class="text-primary-foreground">{on() ? "✓" : ""}</Text>}
    >
      <Text>Notify me</Text>
    </Checkbox>
  );
}

mount(App);
```

`Checkbox` [`nsh/base`](../modules/nsh-base.md) से आता है, जो Rust में `nsh-base` crate है। मान ऐप का होता है: प्रेस `onChange` के साथ अगला मान रिपोर्ट करता है, और checkbox वही `checked` और `indeterminate` दिखाता है जो ऐप वापस देता है। Rust में `checkbox()` एक checkbox बनाता है, जिसमें हर prop के लिए एक setter (`.checked(..)`, `.indicator_style(..)`), हर event के लिए एक listener (`.on_change(..)`), checkbox के लिए टाइप्ड स्टाइल मेथड और उसके लेबल के लिए `.child(..)` होता है; indicator की स्टाइल में वे स्टेट मेथड (`.checked(..)`, `.indeterminate(..)`, `.disabled_style(..)`) लगते हैं जो checkbox की स्थिति का अनुसरण करते हैं।

## Props

| Prop | Rust | प्रकार | डिफ़ॉल्ट | विवरण |
|---|---|---|---|---|
| `checked` | `.checked(..)` | `boolean` | `false` | चुना गया है या नहीं। प्रेस `onChange` के साथ अगला मान रिपोर्ट करता है; checkbox वही मान दिखाता है जो ऐप वापस देता है। |
| `indeterminate` | `.indeterminate(..)` | `boolean` | `false` | न checked, न unchecked; जब तक यह लागू है, यह `checked` पर प्रभावी रहता है: स्क्रीन रीडर इसे mixed बताते हैं, और प्रेस checked मांगता है। |
| `disabled` | `.disabled(..)` | `boolean` | `false` | कोई प्रेस नहीं और प्रेस का कोई फ़ीडबैक नहीं; `disabled:` स्टाइल checkbox और उसके indicator पर लागू होती हैं, और स्क्रीन रीडर इसे dimmed बताते हैं। |
| `checkedStyle` | `.checked_style(\|s\| ..)` | `StyleProp<ViewStyle>` | कोई नहीं | checked और not disabled होने पर checkbox की स्टाइल, `checked:` क्लासेज़ के रूप में। |
| `indeterminateStyle` | `.indeterminate_style(\|s\| ..)` | `StyleProp<ViewStyle>` | कोई नहीं | indeterminate और not disabled होने पर checkbox की स्टाइल, `indeterminate:` क्लासेज़ के रूप में। |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | कोई नहीं | स्क्रीन रीडर क्या बोलते हैं: checkbox क्या चुनता है, जब उसके children में इसे बताने वाला टेक्स्ट न हो। |
| `role` | `.role(..)` | `AccessibilityRole` | `"checkbox"` | स्क्रीन रीडर के लिए यह क्या है, जब यह कुछ अधिक विशिष्ट हो (checked मेन्यू आइटम: `"menuitem"`)। |
| `indicatorClass`, `indicatorStyle` | `.indicator_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | कोई नहीं | indicator, यानी वह बॉक्स जो मान दिखाता है। |
| `indicator` | `.indicator(..)` | `JSX.Element` | कोई नहीं | indicator की सामग्री: मार्क (चेक, डैश), जिसे ऐप अपने मान के अनुसार दिखाता है। |
| `hitSlop` | `.hit_slop(..)` | `number \| Partial<Edges>` | कोई नहीं | अपनी सीमाओं से कितना बाहर तक प्रेस गिने जाते हैं, पॉइंट में: सभी ओर के लिए एक संख्या, या नाम देकर अलग-अलग ओर। जैसा view का `hitSlop`। |
| `children` | `.child(..)` | `JSX.Element` | कोई नहीं | indicator के बाद की सामग्री: एक लेबल, जिसे स्क्रीन रीडर बोलते हैं। |
| `class`, `style` | स्टाइल मेथड | `string`, `StyleProp<ViewStyle>` | कोई नहीं | checkbox स्वयं: indicator और लेबल के आसपास की पंक्ति। |
| `activeStyle`, `hoverStyle`, `focusStyle`, `disabledStyle` | `.active(\|s\| ..)`, `.hover(..)`, `.focus(..)`, `.disabled_style(..)` | `StyleProp<ViewStyle>` | कोई नहीं | pressed, hovered, focused या disabled होने पर checkbox की स्टाइल, `<state>:` क्लासेज़ के रूप में। |

## Events

| Event | Rust | विवरण |
|---|---|---|
| `onChange` | `.on_change(\|checked: &bool\| ..)` | checkbox को प्रेस किया गया: टैप, क्लिक, कीबोर्ड फ़ोकस होने पर Space या Return, या स्क्रीन रीडर का सक्रियण। यह वह मान `checked` के रूप में रिपोर्ट करता है जो checkbox मांगता है: unchecked और indeterminate से `true`, checked से `false`। |

Disabled checkbox कुछ भी रिपोर्ट नहीं करता।

<a id="parts"></a>

## भाग

| भाग | किसके अंदर | स्टाइल किससे | स्टेट |
|---|---|---|---|
| Checkbox | | `class`, `style` | `checked:`, `indeterminate:`, `disabled:`, `active:`, `hover:`, `focus:` (या `checkedStyle`, `indeterminateStyle`, `disabledStyle`, ...) |
| Indicator | checkbox, सबसे पहले | `indicatorClass`, `indicatorStyle` | `checked:`, `indeterminate:`, `disabled:` checkbox का अनुसरण करते हैं |
| मार्क | indicator | अपने स्वयं के एलिमेंट (`indicator`) | `group-checked:`, `group-indeterminate:` और अन्य `group-*:` वेरिएंट, `indicatorClass` पर `group` के साथ |
| लेबल | checkbox, indicator के बाद | अपने स्वयं के एलिमेंट (`children`) | checkbox के `class` पर `group` के साथ `group-*:` वेरिएंट |

मार्क ऐप की अपनी सामग्री है, इसलिए वह वही दिखाता है जो ऐप तय करता है: checked होने पर चेक और indeterminate होने पर डैश, जो ऐप के पास मौजूद मान से चुना जाता है, या दोनों मार्क `group-checked:` / `group-indeterminate:` क्लासेज़ के साथ, जो तय करती हैं कि कौन-सा दिखे।

## Indeterminate

"सभी चुनें" checkbox तब indeterminate होता है जब कुछ आइटम चुने हुए हों। प्रेस checked मांगता है, और ऐप हर आइटम को चुन लेता है:

```tsx
const selected = signal<string[]>([]);
const all = () => selected().length === items.length;
const some = () => selected().length > 0 && !all();

<Checkbox
  checked={all()}
  indeterminate={some()}
  onChange={({ checked }) => selected.set(checked ? items.map((i) => i.id) : [])}
  class="flex-row items-center gap-2"
  indicatorClass="group size-5 items-center justify-center rounded-md border-2 border-border checked:border-primary checked:bg-primary indeterminate:border-primary indeterminate:bg-primary"
  indicator={
    <>
      <Text class="hidden text-primary-foreground group-checked:flex">✓</Text>
      <View class="hidden h-0.5 w-2.5 bg-primary-foreground group-indeterminate:flex" />
    </>
  }
>
  <Text>Select all</Text>
</Checkbox>
```

## Disabled

Disabled checkbox कोई प्रेस नहीं लेता, और स्क्रीन रीडर इसे dimmed बताते हैं। इसकी और इसके indicator की `disabled:` क्लासेज़ लागू होती हैं, जो उनकी `checked:` और `indeterminate:` क्लासेज़ पर प्रभावी रहती हैं:

```tsx
<Checkbox
  checked={on()}
  disabled={locked()}
  onChange={({ checked }) => on.set(checked)}
  class="flex-row items-center gap-2 disabled:opacity-50"
  indicatorClass="size-5 rounded-md border-2 border-border checked:border-primary checked:bg-primary disabled:border-border disabled:bg-muted"
>
  <Text>Share usage data</Text>
</Checkbox>
```

<a id="a-small-target-with-hitslop"></a>

## hitSlop के साथ छोटा टारगेट

जिस checkbox के पास कोई लेबल न हो (किसी पंक्ति का चयन बॉक्स) वह उंगली से छोटा हो सकता है। `hitSlop` उसके पास पड़ने वाले प्रेस को गिना जाने योग्य बनाता है, हर ओर पॉइंट में, उसके लेआउट या रूप को बदले बिना: सभी ओर के लिए एक संख्या, या नाम देकर अलग-अलग ओर (`{ top: 8, bottom: 8 }`), जैसे [view का `hitSlop`](./index.md#presses-and-feedback) इन्हें लेता है।

```tsx
<Checkbox
  checked={selected()}
  hitSlop={12}
  accessibilityLabel="Select row"
  onChange={({ checked }) => selected.set(checked)}
  indicatorClass="size-4 rounded border border-border checked:bg-primary"
/>
```

<a id="accessibility"></a>

## एक्सेसिबिलिटी

- स्क्रीन रीडर के लिए checkbox एक ही एलिमेंट है, जिसका रोल `"checkbox"` (या उसका `role`) है और जिसका मान है: checked, unchecked, या indeterminate होने पर mixed। indicator और मार्क इसके भाग हैं। इसका लेबल इसके children का टेक्स्ट है; जब children में टेक्स्ट न हो तब `accessibilityLabel` दें।
- `disabled` वैसे ही बोला जाता है जैसे प्लेटफ़ॉर्म उसे बोलता है (VoiceOver, TalkBack, UI Automation, ब्राउज़र का accessibility tree)।
- macOS और वेब पर checkbox कीबोर्ड फ़ोकस का एक पड़ाव है: Tab उस तक पहुंचता है, Space और Return उसे टॉगल करते हैं, और `focus:` स्टाइल दिखाती हैं कि फ़ोकस कहां है।

सामान्य रूप से लेबल, रोल और घोषणाओं के लिए [एक्सेसिबिलिटी](../docs/accessibility.md) देखें।

<a id="platform-notes"></a>

## प्लेटफ़ॉर्म नोट्स

- iOS, Android और Mac Catalyst: प्रेस वह टैप है जो checkbox पर समाप्त होता है, उसके लेबल सहित।
- डेस्कटॉप (macOS, Windows, Linux, GPUI) और वेब: प्रेस एक क्लिक है। macOS और वेब पर, कीबोर्ड फ़ोकस वाले checkbox को Space और Return भी टॉगल करते हैं।
- हर प्लेटफ़ॉर्म वही बनाता है जो ऐप स्टाइल करता है: indicator, मार्क और उनके ट्रांज़िशन।
