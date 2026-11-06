---
title: "Slider"
description: "Slider कॉम्पोनेंट: ट्रैक पर चुना गया एक मान, या दो मानों की एक रेंज, जिसमें टच स्क्रीन और माउस दोनों पर प्रेस और ड्रैग का समर्थन है, WAI-ARIA की slider कीज़ उपलब्ध हैं, हर थंब पर स्क्रीन रीडर के लिए एक मान दिया जाता है, और ट्रैक, इंडिकेटर, रेंज और थंब को ऐप अपनी ज़रूरत के अनुसार स्टाइल कर सकता है।"
group: base
demo: el-slider
source_hash: 5dfd7ea970e4cd98
---

# Slider

Slider ट्रैक के साथ एक मान चुनता है (वॉल्यूम, ब्राइटनेस), या दो मानों की एक रेंज चुनता है, जिसमें हर मान के लिए एक थंब होता है (कीमत की रेंज)। व्यवहार वह खुद संभालता है: ट्रैक पर प्रेस करने से नज़दीकी थंब वहाँ चला जाता है, ड्रैग करने पर थंब माउस या उंगली के साथ चलता है; मान `step` पर स्नैप होते हैं; हर थंब कीबोर्ड फ़ोकस का एक स्टॉप है और एरो कीज़ से चलता है, और स्क्रीन रीडर के लिए अपने मान वाला एक adjustable एलिमेंट है। लुक ऐप का होता है: `Slider` के अपने कोई रंग, आकार, रेडियस या मोशन नहीं होते। यह एक ट्रैक से बना है जिसके अंदर इंडिकेटर है, इंडिकेटर पर रेंज और थंब हैं, और फिर उसके चिल्ड्रन (एक लेबल, टेक्स्ट के रूप में मान) हैं; हर हिस्से को ऐप स्टाइल करता है।

```rust tabs
use nsh_base::{SliderValue, slider, theme};
use nsh_core::prelude::*;

fn strength(level: Signal<SliderValue>) -> impl IntoElement {
    let percent = move || format!("{}%", level.get().end());
    slider()
        .value(move || level.get())
        .accessibility_label("Option strength")
        .on_change(move |next: &SliderValue| level.set(*next))
        // The value in a column after the rail.
        .flex_row()
        .items_center()
        .gap_2()
        // An 8-point rail; the thumbs travel inside it.
        .track_style(|s| s.h(px(8.0)).flex_1().px(px(8.0)).rounded_full().bg(move || theme().muted))
        .indicator_style(|s| s.h_full())
        // The fill, from the rail's edge, fading into the thumb's tone.
        .range_style(|s| {
            s.ml(-px(8.0))
                .rounded_full()
                .bg_linear_to_r()
                .gradient_from(move || theme().primary)
                .gradient_to(move || theme().muted_foreground)
        })
        // A 16 x 8 pill sitting in the rail.
        .thumb_style(|s| {
            s.w(px(16.0))
                .h(px(8.0))
                .rounded_full()
                .bg(move || theme().muted_foreground)
                .hover(|s| s.brightness(1.1))
                .active(|s| s.brightness(1.25))
        })
        .child(
            text(percent)
                .w(px(42.0))
                .text_right()
                .text_xs()
                .tabular_nums()
                .text_color(move || theme().muted_foreground),
        )
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { Slider } from "nsh/base";

function App() {
  const strength = signal(64);
  return (
    <Slider
      value={strength()}
      onChange={({ value }) => strength.set(value as number)}
      accessibilityLabel="Option strength"
      class="flex-row items-center gap-2"
      trackClass="h-2 flex-1 px-2 rounded-full bg-muted focus-within:ring-2 focus-within:ring-primary/36 focus-within:ring-offset-2 focus-within:ring-offset-background disabled:opacity-35"
      indicatorClass="h-full"
      rangeClass="-ml-2 rounded-full bg-linear-to-r from-primary via-primary to-muted-foreground"
      thumbClass="h-2 w-4 rounded-full bg-muted-foreground transition hover:brightness-110 active:brightness-125 focus:outline-none disabled:brightness-100 motion-reduce:transition-none"
      thumbStyle={{ boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.18), 0 0 0 1px rgba(0, 0, 0, 0.42)" }}
    >
      <Text class="w-[42px] text-right font-mono text-[11px] text-muted-foreground">{`${strength()}%`}</Text>
    </Slider>
  );
}

mount(App);
```

`Slider` [`nsh/base`](../modules/nsh-base.md) से आता है, जो Rust में `nsh-base` क्रेट है। Rust में `slider()` एक स्लाइडर बनाता है, जिसमें हर prop के लिए एक सेटर (`.value(..)`, `.thumb_style(..)`), हर इवेंट के लिए एक लिसनर मेथड (`.on_change(..)`), स्लाइडर के लिए टाइप्ड स्टाइल मेथड और उसके लेबल के लिए `.child(..)` होता है। इसका मान एक `SliderValue` है: `Single(f64)` या `Range(f64, f64)`।

<a id="value"></a>

## मान

मान एक संख्या होता है, या दो थंब वाली रेंज के लिए `[start, end]`; मान का रूप तय करता है कि कितने थंब होंगे। ऐप इसे `value` से अपने पास रखता है और वही मान सेट करता है जो `onChange` रिपोर्ट करता है, जैसा `nsh/base` के हर कंट्रोल में होता है; या वह मान को `defaultValue` के साथ स्लाइडर पर छोड़ देता है, और बदलाव फिर भी सुनता रहता है। ड्रैग के दौरान थंब और रेंज उसी फ्रेम में, नेटिव रूप से, पॉइंटर के साथ चलते हैं; पॉइंटर उठने पर ऐप का `value` फिर दिखता है, जैसा ऐप ने ड्रैग के आखिरी बदलाव के लिए सेट किया था; ड्रैग चलने के दौरान स्क्रीन रीडर ड्रैग के मान बोलते हैं, अन्यथा उसका अंतिम मान।

```tsx
const price = signal<[number, number]>([200, 800]);

<Slider
  value={price()}
  onChange={({ value }) => price.set(value as [number, number])}
  onChangeEnd={({ value }) => save(value)}
  min={0}
  max={1000}
  step={10}
  accessibilityLabel="Maximum price"
  startAccessibilityLabel="Minimum price"
/>;
```

- `onChange` उपयोगकर्ता के माँगे हर नए मान की रिपोर्ट करता है: ट्रैक पर प्रेस पर, ड्रैग के हर चरण पर, हर कुंजी के लिए। हर रिपोर्ट एक नया मान होती है।
- `onChangeEnd` उस मान की रिपोर्ट एक बार करता है जिस पर बदलाव खत्म हुआ: जब मान सेट करने वाले प्रेस या ड्रैग के बाद पॉइंटर उठता है, और हर कुंजी या स्क्रीन रीडर चरण के बाद (हर एक पूरा बदलाव है)। मान को यहीं सेव करें या भेजें।
- मान `step` पर स्नैप होते हैं, जो `min` से गिने जाते हैं (`min={1} step={2}` से 1, 3, 5, ... मिलता है), और `min` और `max` के बीच रहते हैं; `max` हमेशा पहुँच में रहता है, इसलिए जब रेंज चरणों की पूरी संख्या नहीं होती तो आखिरी चरण छोटा होता है। `step={0}` कोई भी मान लेता है।
- रेंज के थंब कभी एक-दूसरे को पार नहीं करते: खींचा गया थंब दूसरे पर रुक जाता है। जो ड्रैग एक ही मान पर दो थंब पर शुरू होता है, वह उस थंब को चलाता है जो पॉइंटर की दिशा में जा सकता है।
- दिखाया गया मान ऐप का होता है, जो `min` और `max` तक सीमित रहता है (रेंज के सिरे क्रम में), और चरण की ग्रिड से बाहर का मान वहीं दिखता है जहाँ वह है; उपयोगकर्ता का अगला बदलाव स्नैप करता है।

## Props

| Prop | Rust | प्रकार | डिफ़ॉल्ट | विवरण |
|---|---|---|---|---|
| `value` | `.value(..)` | `number \| [number, number]` | कोई नहीं | मान (नियंत्रित): एक संख्या, या दो थंब वाली रेंज। ऐप वही मान सेट करता है जो `onChange` रिपोर्ट करता है। |
| `defaultValue` | `.default_value(..)` | `number \| [number, number]` | `0` | शुरुआती मान, जब `value` सेट न हो; तब स्लाइडर अपना मान खुद रखता है। |
| `min` | `.min(..)` | `number` | `0` | सबसे छोटा मान। |
| `max` | `.max(..)` | `number` | `100` | सबसे बड़ा मान; `min` से एक कम होने पर यह `min` होता है। |
| `step` | `.step(..)` | `number` | `1` | वह चरण जिस पर मान स्नैप होते हैं, `min` से गिने जाते हैं; `0` कोई भी मान लेता है। |
| `scale` | `.scale(..)` | `"linear" \| "logarithmic"` | `"linear"` | ट्रैक पर मान कैसे फैलते हैं: समान रूप से, या परिमाण के क्रम (orders of magnitude) से (1 से 1000 तक, एक-तिहाई रास्ते पर 10 होता है)। Logarithmic के लिए `min` का 0 से ऊपर होना ज़रूरी है; कम `min` के साथ यह linear होता है। |
| `axis` | `.axis(..)` | `"horizontal" \| "vertical"` | `"horizontal"` | ट्रैक की दिशा: `min` शुरुआत में (बाईं ओर, राइट-टू-लेफ़्ट लेआउट में दाईं ओर), या नीचे। स्लाइडर बनते समय पढ़ा जाता है। |
| `disabled` | `.disabled(..)` | `boolean` | `false` | पॉइंटर, कीबोर्ड या स्क्रीन रीडर से कोई बदलाव नहीं; `disabled:` क्लासेज़ स्लाइडर और उसके हिस्सों पर लागू होती हैं। |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | कोई नहीं | थंब के लिए स्क्रीन रीडर क्या बोलते हैं (रेंज में, अंतिम सिरे का)। |
| `startAccessibilityLabel` | `.start_accessibility_label(..)` | `string` | `accessibilityLabel` | रेंज के शुरुआती थंब के लिए स्क्रीन रीडर क्या बोलते हैं। |
| `trackClass`, `trackStyle` | `.track_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | कोई नहीं | ट्रैक: वह क्षेत्र जो प्रेस और ड्रैग लेता है। |
| `indicatorClass`, `indicatorStyle` | `.indicator_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | कोई नहीं | इंडिकेटर, वह रेल जिस पर मान मैप होते हैं। |
| `rangeClass`, `rangeStyle` | `.range_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | कोई नहीं | रेंज, `min` से थंब तक (रेंज के थंबों के बीच), जिसे स्लाइडर रखता है। |
| `thumbClass`, `thumbStyle` | `.thumb_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | कोई नहीं | हर थंब, अपने मान पर केंद्रित। |
| `children` | `.child(..)` | `JSX.Element` | कोई नहीं | ट्रैक के बाद की सामग्री: एक लेबल, टेक्स्ट के रूप में मान। |
| `class`, `style` | स्टाइल मेथड | `string`, `StyleProp<ViewStyle>` | कोई नहीं | स्लाइडर स्वयं: ट्रैक और लेबल के चारों ओर का कॉलम (या रो)। |

<a id="events"></a>

## इवेंट

| इवेंट | Rust | पेलोड | कब |
|---|---|---|---|
| `onChange` | `.on_change(\|value: &SliderValue\| ..)` | `{ value: number \| [number, number] }` | उपयोगकर्ता ने नया मान माँगा: ट्रैक पर प्रेस, ड्रैग का एक चरण, एक कुंजी, स्क्रीन रीडर का increment या decrement। |
| `onChangeEnd` | `.on_change_end(\|value: &SliderValue\| ..)` | `{ value: number \| [number, number] }` | बदलाव खत्म हुआ: पॉइंटर उठा, कुंजी या स्क्रीन रीडर का चरण पूरा हुआ। हर बदलाव पर एक बार। |

<a id="parts"></a>

## हिस्से

| हिस्सा | कहाँ | स्टाइल किया जाता है |
|---|---|---|
| स्लाइडर | | `class`, `style` |
| ट्रैक | स्लाइडर के अंदर, पहले | `trackClass`, `trackStyle` |
| इंडिकेटर | ट्रैक के अंदर | `indicatorClass`, `indicatorStyle` |
| रेंज | इंडिकेटर के अंदर, मानों के अनुसार रखी जाती है | `rangeClass`, `rangeStyle` |
| थंब (रेंज में दो) | इंडिकेटर के अंदर, अपने मान पर केंद्रित | `thumbClass`, `thumbStyle` |
| लेबल | स्लाइडर के अंदर, ट्रैक के बाद | अपने एलिमेंट (`children`) |

ट्रैक प्रेस और ड्रैग लेता है। इंडिकेटर की लंबाई मानों की रेंज है, जिसमें `min` उसके अग्रणी किनारे पर होता है (वर्टिकल होने पर उसके नीचे); स्लाइडर रेंज और थंब को उस पर रखता है, और थंब अपने आकार की परवाह किए बिना अपने मान पर केंद्रित रहता है। इन्हें रखने के दो तरीके हैं:

- ट्रैक ही रेल है (ऊपर का उदाहरण): `h-2 px-2 rounded-full bg-muted` और `h-full` इंडिकेटर के साथ। पैडिंग थंब को रेल के दोनों सिरों पर अंदर रखती है, और रेंज का `-ml-2` भरावट को रेल के अपने किनारे से शुरू करता है।
- ट्रैक रेल के चारों ओर एक बैंड है, जो ऊँचा होता है ताकि टच स्क्रीन पर उंगली उसे आसानी से पा सके: `h-8 justify-center` और `h-2 rounded-full` इंडिकेटर के साथ (वर्टिकल स्लाइडर पर `w-8 items-center` और `w-2 h-full`)।

हिस्से जो स्टेट दिखाते हैं:

- थंब: पॉइंटर के नीचे `hover:`, खींचे जाने के दौरान `active:`, कीबोर्ड फ़ोकस के साथ `focus:`, `disabled:`।
- ट्रैक: जब तक उस पर प्रेस ड्रैग कर रहा हो `active:`; यह एक `group` है, इसलिए इंडिकेटर, रेंज और थंब उससे `group-hover:` और `group-active:` लेते हैं।
- हर हिस्सा: जब स्लाइडर हो तब `disabled:`।

मान बदलने पर थंब चलते हैं, और ड्रैग को तुरंत फ़ॉलो करते हैं। थंब की स्टेट्स का मोशन ऐप की पसंद है (`transition` ऐसे थंब के लिए जो `hover:` और `active:` पर चमकता है), और `motion-reduce:` उन लोगों के लिए इसे स्थिर रखता है जो कम मोशन माँगते हैं। कीबोर्ड फ़ोकस थंब का होता है: ट्रैक पर `focus-within:` पूरी रेल के चारों ओर रिंग बनाता है जब थंब के पास फ़ोकस हो, और थंब का `focus:outline-none` प्लेटफ़ॉर्म की अपनी फ़ोकस आउटलाइन की जगह लेता है।

<a id="keyboard"></a>

## कीबोर्ड

macOS और वेब पर हर थंब कीबोर्ड फ़ोकस (Tab) का एक स्टॉप है, और फ़ोकस वाला थंब WAI-ARIA की slider कुंजियाँ लेता है:

| कुंजी | क्या करती है |
|---|---|
| Right, Up | एक चरण ऊपर (वर्टिकल स्लाइडर पर भी)। |
| Left, Down | एक चरण नीचे। |
| Page Up, Page Down | रेंज का दसवाँ हिस्सा ऊपर या नीचे (स्केल के अनुसार), कम से कम एक चरण। |
| Home, End | जहाँ तक थंब जा सके, नीचे या ऊपर (रेंज के शुरुआती थंब के लिए उसके अंतिम थंब तक)। |

राइट-टू-लेफ़्ट लेआउट में हॉरिज़ॉन्टल स्लाइडर दाईं ओर से चलता है, उसका `min` दाएँ सिरे पर होता है: Left एक चरण ऊपर और Right एक चरण नीचे होता है, और बाईं ओर ड्रैग मान बढ़ाता है। वर्टिकल स्लाइडर में Right और Up एक चरण ऊपर ही रहते हैं।

मान बदलने वाली हर कुंजी पहले `onChange` और फिर `onChangeEnd` रिपोर्ट करती है। एरो और पेज कुंजियाँ दबाए रखने पर दोहराई जाती हैं। कुंजियाँ स्लाइडर तक तभी पहुँचती हैं जब कोई टेक्स्ट इनपुट एडिट न हो रहा हो।

<a id="accessibility"></a>

## एक्सेसिबिलिटी

- हर थंब एक adjustable एलिमेंट है (`"adjustable"`, ब्राउज़र में slider) जिसके पास अपना लेबल, अपना मान और वे मान हैं जो वह ले सकता है: रेंज का शुरुआती थंब `min` से अंतिम तक, उसका अंतिम थंब शुरुआती से `max` तक, ताकि स्क्रीन रीडर दोनों को पढ़ और सेट कर सकें। मान चरण के दशमलव अंकों के साथ संख्या के रूप में बोला जाता है (`2.5`)।
- स्क्रीन रीडर के increment और decrement एक्शन (VoiceOver का ऊपर और नीचे स्वाइप) थंब को एक चरण चलाते हैं, जैसे एरो कुंजियाँ करती हैं।
- थंब स्क्रीन रीडर के लिए स्लाइडर के एलिमेंट हैं, जिनका नाम `accessibilityLabel` से तय होता है (और रेंज के शुरुआती थंब का `startAccessibilityLabel` से); उसके चिल्ड्रन में दिखने वाला लेबल वहीं पढ़ा जाता है जहाँ वह है।
- जब `disabled` हो, स्क्रीन रीडर बताते हैं कि थंब dimmed हैं, और वे कोई एक्शन नहीं लेते।

लेबल, रोल और एक्शन की सामान्य जानकारी के लिए [Accessibility](../docs/accessibility.md) देखें।

<a id="platform-notes"></a>

## प्लेटफ़ॉर्म नोट्स

- हर प्लेटफ़ॉर्म वही बनाता है जो ऐप स्टाइल करता है। प्रेस और ड्रैग को कोर में फ़ॉलो किया जाता है, माउस, पेन या उंगली के लिए, और स्लाइडर के चारों ओर का स्क्रॉल व्यू उस ड्रैग को नहीं लेता जो स्लाइडर पर शुरू हुआ था।
- macOS और वेब पर Tab कीबोर्ड फ़ोकस को थंबों के बीच ले जाता है, जहाँ फ़ोकस वाला थंब slider कुंजियाँ लेता है।
- स्क्रीन रीडर: VoiceOver (iOS, macOS) और TalkBack हर थंब को adjust करते हैं; UI Automation (Windows), GTK की एक्सेसिबिलिटी (Linux) और ब्राउज़र (`role="slider"`, `aria-valuenow`, `aria-valuetext`) को उसकी रेंज और मान मिलते हैं।
