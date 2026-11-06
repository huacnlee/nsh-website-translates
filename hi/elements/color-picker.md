---
title: "ColorPicker"
description: "ColorPicker कॉम्पोनेंट और उसके हिस्से: सैचुरेशन और ब्राइटनेस वाले क्षेत्र पर चुना गया रंग, RGB, HSL, HSB या OKLCH के किसी भी चैनल और अल्फ़ा के स्लाइडर पर चुना गया रंग, किसी भी CSS रूप में टाइप किया गया रंग, स्वैच से चुना गया रंग, या आईड्रॉपर से स्क्रीन पर चुना गया रंग, स्क्रीन रीडर के लिए WAI-ARIA की कीज़ और एडजस्टेबल एलिमेंट के साथ, जिसका लेआउट और स्टाइल ऐप तय करता है।"
group: base
demo: el-color-picker
source_hash: b821e71f23b012af
---

# ColorPicker

कलर पिकर एक रंग रखता है, और उसके अंदर के पार्ट्स उसे दिखाते और बदलते हैं: सैचुरेशन और ब्राइटनेस का एक `ColorArea`, RGB, HSL, HSB या OKLCH के किसी भी चैनल और अल्फ़ा के `ColorSlider`, ऐसे `ColorField` जो रंग को टेक्स्ट के रूप में या एक चैनल को संख्या के रूप में लेते हैं, प्रीसेट रंगों के `ColorSwatch` और एक `ColorEyeDropper` जो स्क्रीन पर कहीं से भी रंग चुनता है। ऐप पार्ट्स के बीच अपने एलिमेंट रखकर उन्हें व्यवस्थित करता है (हर चैनल के लिए उसके अक्षर वाली एक पंक्ति, `Tabs` से चुना गया स्पेस, `Popover` में पिकर), और हर पार्ट की स्टाइलिंग करता है: पार्ट्स चैनलों के रंग बनाते हैं, जबकि हर आकार, रेडियस, बॉर्डर और शैडो ऐप का होता है।

```rust tabs
use nsh_base::{
    ColorChannel, ColorPickerEvent, ColorSpace, color_area, color_field, color_picker,
    color_slider, color_swatch, theme,
};
use nsh_core::prelude::*;

fn primary(color: Signal<Hsla>) -> impl IntoElement {
    // A channel of OKLCH: its letter, its slider, its number.
    let channel = move |channel: ColorChannel, letter: &'static str| {
        view()
            .flex_row()
            .items_center()
            .gap_2()
            .child(text(letter).w(px(14.0)).text_sm().text_color(move || theme().muted_foreground))
            .child(
                color_slider()
                    .color_space(ColorSpace::Oklch)
                    .channel(channel)
                    .accessibility_label(letter)
                    .flex_1()
                    .h(px(18.0))
                    .justify_center()
                    .px(px(8.0))
                    .track_style(|s| s.h(px(10.0)).rounded_full())
                    .thumb_style(|s| s.size(px(16.0)).rounded_full().border_2().border_color(white()))
                    .fill_thumb(true),
            )
            .child(
                color_field()
                    .color_space(ColorSpace::Oklch)
                    .channel(channel)
                    .accessibility_label(letter)
                    .w(px(64.0))
                    .h(px(28.0))
                    .px_2()
                    .rounded_md()
                    .border_1()
                    .border_color(move || theme().border)
                    .text_sm(),
            )
    };
    color_picker()
        .value(move || Some(color.get()))
        .on_change(move |e: &ColorPickerEvent| {
            if let ColorPickerEvent::Change(value, _) = e {
                color.set(*value);
            }
        })
        .gap_3()
        .child(
            color_area()
                .accessibility_label("Saturation and brightness")
                .h(px(160.0))
                .panel_style(|s| s.rounded_lg())
                .thumb_style(|s| s.size(px(18.0)).rounded_full().border_2().border_color(white()))
                .fill_thumb(true),
        )
        .child(channel(ColorChannel::Lightness, "L"))
        .child(channel(ColorChannel::Chroma, "C"))
        .child(channel(ColorChannel::Hue, "H"))
        .child(color_swatch().size(px(28.0)).rounded_md())
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { type ColorChannel, ColorArea, ColorField, ColorPicker, ColorSlider, ColorSwatch } from "nsh/base";

const thumb = "rounded-full border-2 border-white";

function Channel(props: { channel: ColorChannel; letter: string }) {
  return (
    <View class="flex-row items-center gap-2">
      <Text class="w-[14px] text-sm text-muted-foreground">{props.letter}</Text>
      <ColorSlider
        colorSpace="oklch"
        channel={props.channel}
        accessibilityLabel={props.letter}
        class="flex-1 h-[18px] justify-center px-2"
        trackClass="h-[10px] rounded-full"
        thumbClass={`size-4 ${thumb}`}
        fillThumb
      />
      <ColorField
        colorSpace="oklch"
        channel={props.channel}
        accessibilityLabel={props.letter}
        class="w-16 h-7 px-2 rounded-md border border-border text-sm text-right"
      />
    </View>
  );
}

function App() {
  const primary = signal("oklch(54.6% 0.215 262.9)");
  return (
    <ColorPicker value={primary()} format="oklch" onChange={({ formatted }) => primary.set(formatted)} class="gap-3">
      <ColorArea accessibilityLabel="Saturation and brightness" class="h-40" panelClass="rounded-lg" thumbClass={`size-[18px] ${thumb}`} fillThumb />
      <Channel channel="lightness" letter="L" />
      <Channel channel="chroma" letter="C" />
      <Channel channel="hue" letter="H" />
      <View class="flex-row items-center gap-2">
        <ColorSwatch class="size-7 rounded-md" />
        <Text class="font-mono text-sm">{`--primary: ${primary()}`}</Text>
      </View>
    </ColorPicker>
  );
}

mount(App);
```

`ColorPicker`, `ColorArea`, `ColorSlider`, `ColorField`, `ColorSwatch` और `ColorEyeDropper` [`nsh/base`](../modules/nsh-base.md) से आते हैं, जो Rust में `nsh-base` क्रेट है। Rust में `color_picker()` और उसके पार्ट्स के फ़ंक्शन उन्हें बनाते हैं: हर प्रॉप के लिए एक सेटर (`.channel(..)`, `.thumb_style(..)`), हर इवेंट के लिए एक लिसनर मेथड (`.on_change(..)`) और टाइप्ड स्टाइल मेथड के साथ; रंग एक `Hsla` है, और स्पेस, चैनल और फ़ॉर्मैट क्रमशः `ColorSpace`, `ColorChannel` और `ColorFormat` हैं।

<a id="value"></a>

## मान

रंग एक CSS रंग है: हेक्स (`#3b82f6`, अल्फ़ा सहित `#3b82f680`), `rgb()`, `hsl()`, `hsb()`, `oklch()` या कोई CSS नाम; Rust में एक `Hsla`। ऐप इसे `value` से अपने पास रखता है और वही `onChange` सेट करता है जो रिपोर्ट होता है, जैसा `nsh/base` के हर कंट्रोल के लिए होता है; या वह रंग पिकर पर छोड़ देता है `defaultValue` के साथ और फिर भी बदलाव सुनता है।

- `onChange({ value, formatted })` उपयोगकर्ता द्वारा माँगे गए हर रंग को रिपोर्ट करता है: एरिया या स्लाइडर पर ड्रैग के हर चरण पर, हर कुंजी पर, फ़ील्ड में टाइप करते समय उसकी संख्या पर, स्वैच दबाने पर। `value` रंग है, `formatted` वही रंग है जैसा `format` कहता है वैसे लिखा हुआ (`"hex"`, `"rgb"`, `"hsl"`, `"hsb"` या `"oklch"`), जो सहेजने या टोकन के रूप में सेट करने के लिए तैयार है।
- `onChangeEnd({ value, formatted })` वह रंग रिपोर्ट करता है जिस पर बदलाव समाप्त हुआ, एक बार: जब पॉइंटर उठता है, हर कुंजी के बाद, जब फ़ील्ड छोड़ी या सबमिट की जाती है, जब स्वैच दबाया जाता है।
- पिकर रंग को हर स्पेस में वैसे ही रखता है जैसा उपयोगकर्ता ने सेट किया। एक ग्रे अपना ह्यू और सैचुरेशन बनाए रखता है, इसलिए ह्यू स्लाइडर वहीं रहता है जहाँ उपयोगकर्ता ने उसे छोड़ा; OKLCH में संपादित रंग अपनी लाइटनेस, क्रोमा और ह्यू को वैसा ही रखता है जैसा टाइप किया गया, sRGB जितना दिखा सकता है उससे आगे भी (रिपोर्ट किया गया रंग वह निकटतम रंग है जो sRGB दिखाता है, और `"oklch"` में `formatted` चैनलों को बनाए रखता है)।
- ऐप द्वारा सेट किया गया `value` जिसे पिकर ने रिपोर्ट नहीं किया था, हर स्पेस में रंग को बदल देता है।

<a id="spaces-and-channels"></a>

## स्पेस और चैनल

| `colorSpace` | चैनल (`channel`) | रेंज |
|---|---|---|
| `"rgb"` | `"red"`, `"green"`, `"blue"` | 0 से 255 |
| `"hsl"` | `"hue"`, `"saturation"`, `"lightness"` | ह्यू 0 से 360, बाकी 0 से 100 |
| `"hsb"` | `"hue"`, `"saturation"`, `"brightness"` | ह्यू 0 से 360, बाकी 0 से 100 |
| `"oklch"` | `"lightness"`, `"chroma"`, `"hue"` | लाइटनेस 0 से 100 (0.1 के चरण में), क्रोमा 0 से 0.4 (0.001 के चरण में), ह्यू 0 से 360 (0.1 के चरण में) |
| कोई भी | `"alpha"` | 0 से 100 |

स्लाइडर का ट्रैक अपने चैनल के रंग बनाता है, बाकी चैनल स्थिर रखते हुए, इसलिए वह दिखाता है कि हर मान किस ओर ले जाता है। जो चैनल उसके स्पेस में नहीं है, उसकी जगह स्पेस का पहला चैनल लिया जाता है (एक चेतावनी यह बताती है)।

## Props

<a id="colorpicker-1"></a>

### ColorPicker

| Prop | Rust | टाइप | डिफ़ॉल्ट | विवरण |
|---|---|---|---|---|
| `value` | `.value(..)` | `string` | कोई नहीं | रंग (नियंत्रित)। ऐप वही रंग सेट करता है जो `onChange` रिपोर्ट करता है। |
| `defaultValue` | `.default_value(..)` | `string` | `"#000000"` | शुरू का रंग, जब तक `value` सेट नहीं है; तब पिकर अपना रंग खुद रखता है। |
| `format` | `.format(..)` | `"hex" \| "rgb" \| "hsl" \| "hsb" \| "oklch"` | `"hex"` | `formatted` रंग को कैसे लिखता है। |
| `disabled` | `.disabled(..)` | `boolean` | `false` | किसी भी पार्ट से कोई बदलाव नहीं; `disabled:` क्लासेज़ पिकर और उसके पार्ट्स पर लागू होती हैं। |
| `children` | `.child(..)` | `JSX.Element` | कोई नहीं | पार्ट्स और उनके बीच ऐप के एलिमेंट। |
| `class`, `style` | स्टाइल मेथड | `string`, `StyleProp<ViewStyle>` | कोई नहीं | स्वयं पिकर: उसके पार्ट्स के चारों ओर का कॉलम (या रो)। |

### ColorArea

| Prop | Rust | टाइप | डिफ़ॉल्ट | विवरण |
|---|---|---|---|---|
| `panelClass`, `panelStyle` | `.panel_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | कोई नहीं | पैनल, जो एरिया को भरता है: ह्यू के रंग, सैचुरेशन बाएँ से दाएँ (राइट-टू-लेफ़्ट लेआउट में दाएँ से बाएँ) और ब्राइटनेस नीचे से ऊपर, उसके कोनों तक क्लिप किया हुआ। |
| `thumbClass`, `thumbStyle` | `.thumb_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | कोई नहीं | थंब, रंग पर केंद्रित। |
| `fillThumb` | `.fill_thumb(..)` | `boolean` | `false` | थंब का बैकग्राउंड वही रंग है। |
| `disabled` | `.disabled(..)` | `boolean` | `false` | पॉइंटर, कीबोर्ड या स्क्रीन रीडर से कोई बदलाव नहीं। |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | कोई नहीं | थंब के लिए स्क्रीन रीडर क्या बोलते हैं। |
| `class`, `style` | स्टाइल मेथड | `string`, `StyleProp<ViewStyle>` | कोई नहीं | एरिया: उसका आकार ऐप तय करता है। |

### ColorSlider

| Prop | Rust | टाइप | डिफ़ॉल्ट | विवरण |
|---|---|---|---|---|
| `colorSpace` | `.color_space(..)` | `"rgb" \| "hsl" \| "hsb" \| "oklch"` | `"hsb"` | चैनल का स्पेस। |
| `channel` | `.channel(..)` | `ColorChannel` | `"hue"` | वह चैनल जिसे यह बदलता है: स्पेस का कोई एक चैनल, या `"alpha"`। |
| `axis` | `.axis(..)` | `"horizontal" \| "vertical"` | `"horizontal"` | ट्रैक की दिशा: सबसे छोटा मान शुरुआत में (बाईं ओर, राइट-टू-लेफ़्ट लेआउट में दाईं ओर), या नीचे। स्लाइडर बनाते समय पढ़ा जाता है। |
| `trackClass`, `trackStyle` | `.track_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | कोई नहीं | ट्रैक: उसके साथ-साथ चैनल के रंग, उसके कोनों तक क्लिप किए हुए; थंब उसी पर रखा जाता है। |
| `thumbClass`, `thumbStyle` | `.thumb_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | कोई नहीं | थंब, मान पर केंद्रित। |
| `fillThumb` | `.fill_thumb(..)` | `boolean` | `false` | थंब का बैकग्राउंड वही रंग है (अल्फ़ा स्लाइडर पर उसके अल्फ़ा सहित)। |
| `checkerboardColor` | `.checkerboard_color(..)` | `string` | कोई नहीं | ट्रैक के नीचे चेकरबोर्ड का रंग, जो अल्फ़ा स्लाइडर के रंगों में से दिखता है। |
| `checkerboardSize` | `.checkerboard_size(..)` | `number` | `4` | चेकरबोर्ड के वर्गों की भुजा। |
| `disabled` | `.disabled(..)` | `boolean` | `false` | पॉइंटर, कीबोर्ड या स्क्रीन रीडर से कोई बदलाव नहीं। |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | कोई नहीं | थंब के लिए स्क्रीन रीडर क्या बोलते हैं। |
| `class`, `style` | स्टाइल मेथड | `string`, `StyleProp<ViewStyle>` | कोई नहीं | स्लाइडर: ट्रैक के चारों ओर की पट्टी जो प्रेस और ड्रैग लेती है। |

### ColorField

| Prop | Rust | टाइप | डिफ़ॉल्ट | विवरण |
|---|---|---|---|---|
| `channel` | `.channel(..)` | `ColorChannel` | कोई नहीं | वह चैनल जिसे यह संख्या के रूप में लेता है। इसके बिना, फ़ील्ड पूरा रंग टेक्स्ट के रूप में लेती है। |
| `colorSpace` | `.color_space(..)` | `ColorSpace` | `"hsb"` | `channel` का स्पेस। |
| `format` | `.format(..)` | `ColorFormat` | `"hex"` | फ़ील्ड पूरा रंग कैसे लिखती है। यह किसी भी CSS रूप को पढ़ती है। |
| `placeholder` | `.placeholder(..)` | `string` | कोई नहीं | फ़ील्ड के खाली रहने पर दिखाया जाता है। |
| `disabled` | `.disabled(..)` | `boolean` | `false` | टाइप नहीं किया जा सकता। |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | कोई नहीं | फ़ील्ड के लिए स्क्रीन रीडर क्या बोलते हैं। |
| `class`, `style` | स्टाइल मेथड | `string`, `StyleProp<TextStyle>` | कोई नहीं | फ़ील्ड, एक टेक्स्ट इनपुट। |

किसी चैनल की फ़ील्ड संख्या टाइप होते ही रंग बदल देती है, चैनल की रेंज में सीमित रखते हुए; पूरे रंग की फ़ील्ड उसे तब बदलती है जब फ़ील्ड छोड़ी या सबमिट की जाए, बशर्ते टेक्स्ट रंग के रूप में पढ़ा जा सके। फ़ील्ड छोड़ने पर उसका मान उसके फ़ॉर्मैट में दोबारा लिखा जाता है।

### ColorSwatch

| Prop | Rust | टाइप | डिफ़ॉल्ट | विवरण |
|---|---|---|---|---|
| `color` | `.color(..)` | `string` | कोई नहीं | वह रंग जो यह दिखाता है; दबाने पर वह इसके आसपास के पिकर में चुन लिया जाता है। इसके बिना, पिकर का अपना रंग: एक प्रिव्यू। |
| `selectedStyle` | `.selected_style(..)` | `StyleProp<ViewStyle>` | कोई नहीं | स्टाइल, जब यह पिकर का रंग हो, `selected:` क्लासेज़ के रूप में। |
| `checkerboardColor` | `.checkerboard_color(..)` | `string` | कोई नहीं | पारदर्शी रंग के नीचे एक चेकरबोर्ड। |
| `checkerboardSize` | `.checkerboard_size(..)` | `number` | `4` | उसके वर्गों की भुजा। |
| `disabled` | `.disabled(..)` | `boolean` | `false` | कोई प्रेस नहीं। |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | हेक्स में रंग | स्क्रीन रीडर क्या बोलते हैं। |
| `children` | `.child(..)` | `JSX.Element` | कोई नहीं | रंग के ऊपर की सामग्री: चुने हुए स्वैच पर एक चेक (`group-selected:`)। |
| `class`, `style` | स्टाइल मेथड | `string`, `StyleProp<ViewStyle>` | कोई नहीं | स्वैच: उसका आकार, शेप और बॉर्डर; उसके कोने रंग को क्लिप करते हैं। |

### ColorEyeDropper

| Prop | Rust | टाइप | डिफ़ॉल्ट | विवरण |
|---|---|---|---|---|
| `disabled` | `.disabled(..)` | `boolean` | `false` | कोई प्रेस नहीं। जहाँ प्लेटफ़ॉर्म में आईड्रॉपर नहीं है, वहाँ यह भी डिसेबल रहता है। |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | कोई नहीं | स्क्रीन रीडर क्या बोलते हैं। |
| `children` | `.child(..)` | `JSX.Element` | कोई नहीं | इसकी सामग्री: ऐप का आइकन या लेबल। |
| `class`, `style` | स्टाइल मेथड | `string`, `StyleProp<ViewStyle>` | कोई नहीं | बटन। |

दबाने पर सिस्टम का आईड्रॉपर दिखता है: macOS पर AppKit का कलर सैंपलर, वेब पर ब्राउज़र का `EyeDropper` (Chrome और Edge में)। चुना गया रंग पिकर का रंग बन जाता है (`onChange`, फिर `onChangeEnd`); Escape दबाने पर कोई रंग नहीं चुना जाता। जहाँ प्लेटफ़ॉर्म में आईड्रॉपर नहीं है, वहाँ बटन डिसेबल रहता है, और `disabled:hidden` उसे वहाँ छिपा देता है।

<a id="events"></a>

## इवेंट

| इवेंट | किसका | Rust | पेलोड | कब |
|---|---|---|---|---|
| `onChange` | `ColorPicker` | `.on_change(\|e: &ColorPickerEvent\| ..)` | `({ value: string, formatted: string })` | उपयोगकर्ता ने रंग बदला। |
| `onChangeEnd` | `ColorPicker` | `.on_change_end(\|e: &ColorPickerEvent\| ..)` | `({ value: string, formatted: string })` | बदलाव समाप्त हुआ। हर बदलाव पर एक बार। |
| `onPress` | `ColorSwatch` | `.on_press(\|color: &Hsla\| ..)` | `({ color: string })` | स्वैच दबाया गया; यह अकेले भी काम करता है, पैलेट के चिप की तरह। |
| `onPick` | `ColorEyeDropper` | `.on_pick(\|color: &Hsla\| ..)` | `({ color: string })` | उपयोगकर्ता ने स्क्रीन पर से रंग चुना; यह अकेले भी काम करता है। |

Rust में `ColorPickerEvent::Change(Hsla, SharedString)` और `ColorPickerEvent::ChangeEnd(Hsla, SharedString)` रंग और उसका `formatted` टेक्स्ट रखते हैं।

<a id="parts"></a>

## पार्ट्स

| पार्ट | कहाँ | स्टाइल किसके साथ |
|---|---|---|
| `ColorArea` | पिकर के अंदर | `class`, `style` |
| एरिया का पैनल | एरिया के अंदर, उसे भरता हुआ | `panelClass`, `panelStyle` |
| एरिया का थंब | एरिया के अंदर, रंग पर केंद्रित | `thumbClass`, `thumbStyle` |
| `ColorSlider` | पिकर के अंदर | `class`, `style` |
| स्लाइडर का ट्रैक | स्लाइडर के अंदर | `trackClass`, `trackStyle` |
| स्लाइडर का थंब | स्लाइडर के अंदर, ट्रैक पर मान पर केंद्रित | `thumbClass`, `thumbStyle` |
| `ColorField` | पिकर के अंदर | `class`, `style` |
| `ColorSwatch` | पिकर के अंदर, या अकेला | `class`, `style`, `selectedStyle` |
| `ColorEyeDropper` | पिकर के अंदर, या अकेला | `class`, `style` |

स्लाइडर का थंब ट्रैक पर केंद्रित होता है, इसलिए चैनल के सिरों पर वह ट्रैक के सिरों पर होता है। स्लाइडर पर थंब की आधी चौड़ाई के बराबर पैडिंग (`h-3` ट्रैक के चारों ओर `h-6 justify-center px-2.5`) पूरे थंब को स्लाइडर के अंदर रखती है, जहाँ वह दोनों सिरों पर प्रेस लेता है। पार्ट्स जो स्टेट दिखाते हैं: थंब का `active:` जब उसे ड्रैग किया जाए और कीबोर्ड फ़ोकस के साथ `focus:`, स्वैच का `selected:`, और हर पार्ट का `disabled:`।

<a id="keyboard"></a>

## कीबोर्ड

macOS और वेब पर हर थंब कीबोर्ड फ़ोकस (Tab) का एक पड़ाव है:

| कुंजी | स्लाइडर पर | एरिया पर |
|---|---|---|
| Right, Up | एक चरण ऊपर | Right: अधिक सैचुरेशन; Up: अधिक ब्राइटनेस |
| Left, Down | एक चरण नीचे | Left: कम सैचुरेशन; Down: कम ब्राइटनेस |
| Shift के साथ तीर | दस चरण | दस चरण |
| Page Up, Page Down | दस चरण | ब्राइटनेस के दस चरण |
| Home, End | चैनल के सिरे | |

राइट-टू-लेफ़्ट लेआउट में क्षैतिज स्लाइडर और एरिया दाईं ओर से शुरू होते हैं, सबसे छोटा मान (सबसे कम सैचुरेशन) दाएँ सिरे पर होता है: Left एक चरण ऊपर और Right एक चरण नीचे होता है, और प्रेस या ड्रैग पॉइंटर के नीचे का वह मान चुनता है जैसा वह खींचा गया दिखता है। ऊर्ध्वाधर स्लाइडर में Right और Up एक चरण ऊपर ही रहते हैं; एरिया पर Up और Down ब्राइटनेस ही बदलते हैं।

स्वैच Space और Return लेता है। हर कुंजी पहले `onChange` और फिर `onChangeEnd` रिपोर्ट करती है; तीर दबाए रखने पर दोहराते हैं।

<a id="accessibility"></a>

## एक्सेसिबिलिटी

- एरिया और हर स्लाइडर के थंब एडजस्टेबल एलिमेंट हैं (`"adjustable"`, ब्राउज़र में एक स्लाइडर) जिनके साथ उनका लेबल, मान और रेंज होती है; स्क्रीन रीडर के इन्क्रीमेंट और डिक्रीमेंट उन्हें चरणों में बदलते हैं।
- हर फ़ील्ड अपने लेबल के साथ एक टेक्स्ट फ़ील्ड है; हर स्वैच एक बटन है, जो पिकर का रंग होने पर चयनित रहता है, और जब तक `accessibilityLabel` उसे नाम न दे, हेक्स में अपने रंग से नामित होता है। आईड्रॉपर ऐप के लेबल वाला एक बटन है।
- डिसेबल होने पर स्क्रीन रीडर बताते हैं कि पार्ट्स धुँधले हैं, और वे कोई एक्शन नहीं लेते।

लेबल, रोल और एक्शन के बारे में सामान्य जानकारी के लिए [एक्सेसिबिलिटी](../docs/accessibility.md) देखें।

<a id="platform-notes"></a>

## प्लेटफ़ॉर्म नोट्स

- हर प्लेटफ़ॉर्म वही बनाता है जो ऐप स्टाइल करता है; ट्रैक और पैनल के रंग ग्रेडिएंट हैं जिन्हें प्लेटफ़ॉर्म बनाता है। प्रेस और ड्रैग कोर में ट्रैक किए जाते हैं, माउस, पेन या उँगली के लिए, और पिकर के आसपास का स्क्रॉल व्यू अपनी स्क्रॉलिंग उन ड्रैग तक सीमित रखता है जो कहीं और से शुरू होते हैं।
- `ColorEyeDropper` macOS पर AppKit के कलर सैंपलर से और वेब पर ब्राउज़र के `EyeDropper` से रंग चुनता है; रंग sRGB में आता है।
