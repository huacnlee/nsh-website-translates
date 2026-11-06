---
title: "Radio"
description: "Radio और RadioGroup: विकल्पों का एक समूह, जिनमें से उपयोगकर्ता ठीक एक चुनता है। प्रत्येक Radio प्रेस, कीबोर्ड सक्रियण, disabled स्थिति, और स्क्रीन रीडर के लिए अपनी role और checked स्थिति को स्वयं संभालता है; समूह इन विकल्पों का सेट है; लुक और वैल्यू ऐप तय करता है।"
group: base
demo: el-radio
source_hash: 051314109ae3d0b2
---

# Radio

Radio उपयोगकर्ता को विकल्पों के एक समूह में से ठीक एक चुनने देते हैं: कोई प्लान, कोई सॉर्ट क्रम, कोई थीम। हर `Radio` एक विकल्प का व्यवहार संभालता है: प्रेस, कीबोर्ड से सक्रिय करना, disabled स्थिति, और स्क्रीन रीडर के लिए radio role और उसकी checked स्थिति। इन्हें घेरने वाला `RadioGroup` पूरा सेट है, जिसे स्क्रीन रीडर एक समूह के रूप में बोलते हैं। रूप-रंग ऐप का होता है: radio का अपना कोई गोला, बिंदु, रंग, आकार या लेबल नहीं होता। इसके children ऐप के इंडिकेटर और लेबल होते हैं, और radio पर लगी `checked:` क्लासें, या उसके अंदर की चीज़ों पर लगी `group-checked:` क्लासें, उसकी स्थिति के अनुसार बदलती हैं।

```rust tabs
use nsh_base::{radio, radio_group, theme};
use nsh_core::prelude::*;

fn plans() -> impl IntoElement {
    let plan = signal("basic");
    let option = move |value: &'static str, label: &'static str| {
        let checked = move || plan.get() == value;
        radio()
            .checked(checked)
            .on_change(move |_: &bool| plan.set(value))
            .flex_row()
            .items_center()
            .gap_2()
            .child(
                view()
                    .size(px(20.0))
                    .items_center()
                    .justify_center()
                    .rounded_full()
                    .border_2()
                    .border_color(move || theme().border)
                    .child(
                        view()
                            .size(px(10.0))
                            .rounded_full()
                            .bg(move || theme().primary)
                            .opacity(move || if checked() { 1.0_f32 } else { 0.0 }),
                    ),
            )
            .child(text(label))
    };
    radio_group()
        .gap_3()
        .child(option("basic", "Basic"))
        .child(option("pro", "Pro"))
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { Radio, RadioGroup } from "nsh/base";

function App() {
  const plan = signal("basic");
  const option = (value: string, label: string) => (
    <Radio
      checked={plan() === value}
      onChange={() => plan.set(value)}
      class="group flex-row items-center gap-2"
    >
      <View class="size-5 items-center justify-center rounded-full border-2 border-border group-checked:border-primary">
        <View class="size-2.5 rounded-full group-checked:bg-primary" />
      </View>
      <Text>{label}</Text>
    </Radio>
  );
  return (
    <RadioGroup class="gap-3">
      {option("basic", "Basic")}
      {option("pro", "Pro")}
    </RadioGroup>
  );
}

mount(App);
```

`Radio` और `RadioGroup` [`nsh/base`](../modules/nsh-base.md) से आते हैं, जो Rust में `nsh-base` crate है। value ऐप की होती है: group में कोई value नहीं रहती। हर radio को बताया जाता है कि वह checked है या नहीं; unchecked radio पर प्रेस `onChange({ checked: true })` रिपोर्ट करता है, ऐप अपनी value सेट करती है, और हर radio वही `checked` दिखाता है जो ऐप वापस पास करती है। Rust में `radio()` और `radio_group()` इन्हें बनाते हैं, जिनमें हर prop के लिए एक setter (`.checked(..)`), हर इवेंट के लिए एक listener (`.on_change(..)`), टाइप्ड स्टाइल मेथड और उनकी सामग्री के लिए `.child(..)` होते हैं।

<a id="props"></a>

## प्रॉप्स

<a id="radio-1"></a>

### Radio

| प्रॉप | Rust | टाइप | डिफ़ॉल्ट | विवरण |
|---|---|---|---|---|
| `checked` | `.checked(..)` | `boolean` | `false` | Checked है या नहीं। unchecked radio पर प्रेस `true` को `onChange` के साथ रिपोर्ट करता है; radio वही value दिखाता है जो ऐप वापस पास करती है। |
| `disabled` | `.disabled(..)` | `boolean` | `false` | कोई प्रेस नहीं और प्रेस का कोई फ़ीडबैक नहीं; `disabled:` स्टाइल लागू होती हैं, और स्क्रीन रीडर बताते हैं कि यह dimmed है। |
| `checkedStyle` | `.checked_style(\|s\| ..)` | `StyleProp<ViewStyle>` | कोई नहीं | checked और not disabled होने पर radio की स्टाइल, `checked:` क्लासों के रूप में। |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | कोई नहीं | स्क्रीन रीडर क्या बोलें: वह विकल्प, जब उसके children में ऐसा कोई टेक्स्ट न हो जो उसे बताता हो। |
| `hitSlop` | `.hit_slop(..)` | `number \| Partial<Edges>` | कोई नहीं | अपनी सीमाओं के कितना बाहर तक प्रेस अब भी गिने जाते हैं, points में: हर तरफ़ के लिए एक संख्या, या नाम लेकर अलग-अलग तरफ़ें। जैसे view का `hitSlop`। |
| `children` | `.child(..)` | `JSX.Element` | कोई नहीं | ऐप का इंडिकेटर और लेबल, जिन्हें स्क्रीन रीडर बोलते हैं। |
| `class`, `style` | स्टाइल मेथड | `string`, `StyleProp<ViewStyle>` | कोई नहीं | radio स्वयं: इंडिकेटर और लेबल के आसपास की पंक्ति। |
| `activeStyle`, `hoverStyle`, `focusStyle`, `disabledStyle` | `.active(\|s\| ..)`, `.hover(..)`, `.focus(..)`, `.disabled_style(..)` | `StyleProp<ViewStyle>` | कोई नहीं | pressed, hovered, focused या disabled होने पर radio की स्टाइल, `<state>:` क्लासों के रूप में। |

### RadioGroup

| प्रॉप | Rust | टाइप | डिफ़ॉल्ट | विवरण |
|---|---|---|---|---|
| `children` | `.child(..)` | `JSX.Element` | कोई नहीं | सेट के radio, और वह सब जो ऐप उनके बीच लेआउट करती है। |
| `class`, `style` | स्टाइल मेथड | `string`, `StyleProp<ViewStyle>` | कोई नहीं | group का लेआउट और रूप: डिफ़ॉल्ट रूप से एक कॉलम, पंक्ति के लिए `flex-row`। |

<a id="events"></a>

## इवेंट्स

| इवेंट | Rust | विवरण |
|---|---|---|
| `onChange` (`Radio`) | `.on_change(\|checked: &bool\| ..)` | किसी unchecked radio को प्रेस किया गया: टैप, क्लिक, कीबोर्ड फ़ोकस होने पर Space या Return, या स्क्रीन रीडर का सक्रिय करना; या उसके group की किसी एरो कुंजी ने कीबोर्ड फ़ोकस उस पर पहुँचाया। यह checked होने का अनुरोध करता है, इसलिए `checked` का मान `true` होता है। यह किसी भी बदलाव से पहले चलता है: radio वही `checked` दिखाता है जो ऐप वापस पास करती है। |

Checked radio checked ही रहता है और कुछ रिपोर्ट नहीं करता, क्योंकि radio खुद को uncheck नहीं कर सकता; disabled radio भी कुछ रिपोर्ट नहीं करता।

<a id="parts"></a>

## पार्ट्स

| पार्ट | अंदर | स्टाइल किससे | स्थितियाँ |
|---|---|---|---|
| Group | | `RadioGroup` के `class`, `style` | |
| Radio | group | `Radio` के `class`, `style` | `checked:`, `disabled:`, `active:`, `hover:`, `focus:` (या `checkedStyle`, `disabledStyle`, ...) |
| इंडिकेटर और लेबल | radio | उनके अपने एलिमेंट (`children`) | `group-checked:`, `group-disabled:` और अन्य `group-*:` वेरिएंट, radio के `class` पर `group` के साथ |

इंडिकेटर ऐप की सामग्री है: बिंदु वाला एक रिंग, एक चेक, एक हाइलाइट किया गया कार्ड। radio के `class` पर `group` के साथ, उसकी `group-checked:` क्लासें radio के checked रहते हुए बिंदु दिखाती हैं।

## Disabled

Disabled radio कोई प्रेस नहीं लेता, और स्क्रीन रीडर उसे dimmed बताते हैं। उसकी `disabled:` क्लासें उसकी `checked:` क्लासों के ऊपर लागू होती हैं, और उसके अंदर की `group-disabled:` क्लासें भी उसी के अनुसार बदलती हैं:

```tsx
<Radio
  checked={plan() === "team"}
  disabled={!eligible()}
  onChange={() => plan.set("team")}
  class="group flex-row items-center gap-2 disabled:opacity-50"
>
  <View class="size-5 items-center justify-center rounded-full border-2 border-border group-checked:border-primary">
    <View class="size-2.5 rounded-full group-checked:bg-primary" />
  </View>
  <Text>Team</Text>
</Radio>
```

<a id="a-small-target-with-hitslop"></a>

## hitSlop के साथ छोटा टारगेट

जिस radio के बगल में कोई लेबल नहीं है (जैसे तालिका की किसी पंक्ति में एक बिंदु), वह उंगली से छोटा हो सकता है। `hitSlop` उसके पास पड़ने वाले प्रेस को गिनने योग्य बनाता है, हर तरफ़ से points में बाहर तक, बिना उसका लेआउट या रूप बदले: हर तरफ़ के लिए एक संख्या, या नाम लेकर अलग-अलग तरफ़ें (`{ top: 8, bottom: 8 }`), ठीक वैसे ही जैसे [view का `hitSlop`](./index.md#presses-and-feedback) उन्हें लेता है।

```tsx
<Radio
  checked={plan() === "team"}
  hitSlop={12}
  accessibilityLabel="Team"
  onChange={() => plan.set("team")}
  class="group size-5 items-center justify-center rounded-full border-2 border-border group-checked:border-primary"
>
  <View class="size-2.5 rounded-full group-checked:bg-primary" />
</Radio>
```

<a id="accessibility"></a>

## एक्सेसिबिलिटी

- स्क्रीन रीडर के लिए radio एक ही एलिमेंट है, जिसका role `"radio"` है और उसकी स्थिति: checked है या नहीं, और checked रहते हुए selected, क्योंकि कुछ स्क्रीन रीडर एक को पढ़ते हैं और कुछ दूसरे को (UI Automation के radio selection आइटम हैं)। उसका इंडिकेटर और लेबल उसी के हिस्से हैं; उसका लेबल उसके children का टेक्स्ट है, या `accessibilityLabel`।
- `RadioGroup` का role `"radiogroup"` है: स्क्रीन रीडर उसके अंदर के radio को एक सेट के रूप में सुनते हैं, और हर radio फिर भी अपने आप में एक एलिमेंट रहता है।
- `disabled` को वैसे ही बोला जाता है जैसे प्लेटफ़ॉर्म उसे बोलता है (VoiceOver, TalkBack, UI Automation, ब्राउज़र का accessibility tree)।
- macOS और वेब पर `RadioGroup` कीबोर्ड फ़ोकस का एक ही पड़ाव है, और एरो कुंजियाँ उसके radio के बीच चलती हैं और उन्हें check करती हैं (नीचे देखें)।

सामान्य रूप से लेबल, role और announcements के लिए [Accessibility](../docs/accessibility.md) देखें।

<a id="keyboard"></a>

## कीबोर्ड

macOS और वेब पर, जहाँ Tab प्रेस लेने वाले views तक पहुँचता है, `RadioGroup` [WAI-ARIA radio group pattern](https://www.w3.org/WAI/ARIA/apg/patterns/radio/) का पालन करता है:

| कुंजी | क्या करती है |
|---|---|
| Tab, Shift+Tab | group में checked radio पर प्रवेश करती है (अगर कोई checked नहीं है तो पहले ऐसे radio पर जो disabled नहीं है), और एक ही कदम में उससे बाहर निकल जाती है। |
| Down, Right | फ़ोकस को अगले radio पर ले जाती है, आख़िरी से पहले पर लौटती है, और उसे check करती है। |
| Up, Left | फ़ोकस को पिछले radio पर ले जाती है, पहले से आख़िरी पर जाती है, और उसे check करती है। |
| Space | फ़ोकस वाले radio को check करती है। |

एरो कुंजियाँ disabled radio को छोड़ देती हैं; जिस radio पर वे जाती हैं वह `onChange` से checked होने का अनुरोध करता है, और ऐप उसे check करती है। right-to-left लेआउट में Left और Right की भूमिकाएँ आपस में बदल जाती हैं: Left अगले radio पर और Right पिछले पर ले जाता है; Up और Down अपनी जगह रहते हैं। `focus:` स्टाइल दिखाती हैं कि फ़ोकस कहाँ है। `RadioGroup` के बाहर का `Radio` अपने आप में एक पड़ाव है, जिस तक Tab पहुँचता है और जिसे Space और Return check करते हैं।

<a id="platform-notes"></a>

## प्लेटफ़ॉर्म नोट्स

- iOS, Android और Mac Catalyst: प्रेस वह टैप है जो radio पर खत्म होता है, उसके लेबल सहित।
- डेस्कटॉप (macOS, Windows, Linux, GPUI) और वेब: प्रेस एक क्लिक है। macOS और वेब पर, Space और Return भी कीबोर्ड फ़ोकस वाले radio को check करते हैं, और एरो कुंजियाँ उसे आगे-पीछे ले जाती हैं ([कीबोर्ड](#keyboard))।
- हर प्लेटफ़ॉर्म वही बनाता है जो ऐप स्टाइल करती है: इंडिकेटर, लेबल और उनके ट्रांज़िशन।
