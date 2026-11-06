---
title: "Text"
description: "वह एलिमेंट जो टेक्स्ट को ड्रॉ करता है: नेस्टेड स्पैन, लिंक, लाइन सीमा, फ़ॉन्ट स्केलिंग, इनलाइन व्यू और टेक्स्ट लेआउट इवेंट।"
order: 20
group: primitives
demo: el-text
source_hash: 85fcf31a847a72cd
---


# Text

`Text` एक पैराग्राफ़ बनाता है। यही वह एलिमेंट है जो स्ट्रिंग दिखाता है: `View` की चाइल्ड के रूप में दी गई स्ट्रिंग कुछ भी नहीं बनाती। पैराग्राफ़ नेटिव रूप से टाइपसेट होता है (iOS और Mac Catalyst पर CoreText, Android पर `StaticLayout`) और इंजन थ्रेड पर मापा जाता है, इसलिए मुख्य थ्रेड केवल उसे ड्रॉ करता है। Rust में इसे `text(content)` से बनाया जाता है, और TSX में `nsh` से `<Text>` द्वारा।

```rust tabs
use nsh_core::prelude::*;

text("Read the ")
    .text_base()
    .line_height(px(24.0))
    .text_color(rgb(0x1f2328))
    .child(text("terms").font_weight(FontWeight::BOLD))
    .child(" before you continue.")
```

```tsx tabs
<Text style={{ fontSize: 16, lineHeight: 24, color: "#1f2328" }}>
  Read the <Text style={{ fontWeight: "700" }}>terms</Text> before you continue.
</Text>
```

`text(..)` एक स्ट्रिंग, एक `SharedString`, एक सिग्नल या एक क्लोज़र (`text(move || format!("{} items", count.get()))`) लेता है: क्लोज़र या सिग्नल जो कुछ पढ़ता है, उसके बदलने पर टेक्स्ट अपनी जगह पर ही अपडेट हो जाता है।

## Spans

किसी टेक्स्ट के अंदर का टेक्स्ट उसी पैराग्राफ़ का एक स्पैन होता है, अलग व्यू नहीं। स्पैन पैराग्राफ़ की टेक्स्ट स्टाइल (`color`, `fontSize`, `fontWeight`, …) इनहेरिट करते हैं और जो स्टाइल वे खुद सेट करते हैं उसे ओवरराइड करते हैं। पूरा ब्लॉक एक ही नेटिव व्यू है। Rust में `text(..)` पहले अपना कंटेंट दिखाता है और फिर अपनी चिल्ड्रन: `.child(text(..))` एक स्पैन जोड़ता है, `.child("…")` एक सादा रन।

```rust tabs
text("")
    .text_size(px(17.0))
    .child(text("Light ").font_weight(FontWeight::LIGHT))
    .child(text("Bold ").font_weight(FontWeight::BOLD))
    .child(text("Italic").italic().text_color(rgb(0x8250df)))
```

```tsx tabs
<Text style={{ fontSize: 17 }}>
  <Text style={{ fontWeight: "300" }}>Light </Text>
  <Text style={{ fontWeight: "bold" }}>Bold </Text>
  <Text style={{ fontStyle: "italic", color: "#8250df" }}>Italic</Text>
</Text>
```

### Span backgrounds

बैकग्राउंड वाला स्पैन अपने अक्षरों के बॉक्स को उनके पीछे भरता है: उसके फ़ॉन्ट जितना ऊँचा (बेसलाइन के ऊपर ascent और नीचे descent, लाइन हाइट चाहे जो हो), और हर उस लाइन पर जिस पर वह रैप होता है, जहाँ हर लाइन का हिस्सा स्पैन की कॉर्नर रेडियस वाला अपना अलग बॉक्स होता है। इसके अंदर के स्पैन इसका बैकग्राउंड साझा करते हैं, जब तक वे अपना बैकग्राउंड सेट न करें। यह केवल ड्रॉइंग है: टेक्स्ट का लेआउट वैसा ही रहता है जैसा इसके बिना होता, और selectable टेक्स्ट बाकी टेक्स्ट के साथ स्पैन के अक्षर भी कॉपी करता है। इनलाइन कोड एक स्पैन है:

```rust tabs
text("Run ")
    .text_size(px(15.0))
    .line_height(px(22.0))
    .select_text()
    .child(
        text(" cargo test ")
            .font_family("ui-monospace")
            .text_size(px(13.0))
            .bg(rgb(0xeff1f3))
            .rounded(px(4.0)),
    )
    .child(" before you commit.")
```

```tsx tabs
<Text style={{ userSelect: "text", fontSize: 15, lineHeight: 22 }}>
  {"Run "}
  <Text style={{ fontFamily: "ui-monospace", fontSize: 13, backgroundColor: "#eff1f3", borderRadius: 4 }}>
    {" cargo test "}
  </Text>
  {" before you commit."}
</Text>
```

Tailwind क्लासेस भी इसी तरह काम करती हैं: `<Text class="bg-gray-100 rounded">`। पैडिंग और बॉर्डर बॉक्स स्टाइल हैं और स्पैन पर असर नहीं डालते; स्पैन के अंदर के स्पेस उसके किनारों पर बॉक्स को जगह देते हैं।

### Links

प्रेस हैंडलर वाला स्पैन एक लिंक होता है: उसके अक्षरों पर प्रेस स्पैन तक पहुँचता है, और कहीं और का प्रेस पैराग्राफ़ तक।

```rust tabs
text("By continuing you agree to the ")
    .text_size(px(15.0))
    .on_press(move || log("the sentence"))
    .child(
        text("Terms of service")
            .text_color(rgb(0x0969da))
            .underline()
            .on_press(move || open("terms")),
    )
    .child(".")
```

```tsx tabs
<Text style={{ fontSize: 15 }} onPress={() => log("the sentence")}>
  {"By continuing you agree to the "}
  <Text style={{ color: "#0969da", textDecorationLine: "underline" }} onPress={() => open("terms")}>
    Terms of service
  </Text>
  .
</Text>
```

### Inline views and images

टेक्स्ट के अंदर कोई भी अन्य एलिमेंट (व्यू, इमेज, स्पैन के अंदर भी) एक इनलाइन अटैचमेंट होता है: वह अपने आकार में लेआउट होता है, बेसलाइन पर बैठता है (या वहाँ जहाँ उसकी `verticalAlign` स्टाइल उसे रखती है: `"text-top"`, `"text-bottom"`, `"middle"`, जैसा CSS में; उसे समाने के लिए लाइन बढ़ जाती है) और शब्दों के साथ रैप होता है। वह अपने प्रेस खुद लेता है।

```rust tabs
text("Made with ")
    .text_base()
    .line_height(px(26.0))
    .child(image(LOGO).size(px(18.0)).rounded(px(4.0)))
    .child(" NSH. Status ")
    .child(
        view()
            .bg(rgb(0x1a7f37))
            .rounded(px(9.0))
            .px(px(7.0))
            .h(px(18.0))
            .justify_center()
            .child(text("LIVE").text_color(white()).text_size(px(11.0)).font_weight(FontWeight::BOLD)),
    )
```

```tsx tabs
<Text style={{ fontSize: 16, lineHeight: 26 }}>
  {"Made with "}
  <Image src={logo} style={{ width: 18, height: 18, borderRadius: 4 }} />
  {" NSH. Status "}
  <View style={{ backgroundColor: "#1a7f37", borderRadius: 9, paddingHorizontal: 7, height: 18, justifyContent: "center" }}>
    <Text style={{ color: "#ffffff", fontSize: 11, fontWeight: "700" }}>LIVE</Text>
  </View>
</Text>
```

`numberOfLines` या एलिप्सिस से कट गए अटैचमेंट छिपा दिए जाते हैं। selectable टेक्स्ट कॉपी करते समय उन्हें छोड़ दिया जाता है।

### Whitespace

JSX टेक्स्ट React के नियमों का पालन करता है: टेक्स्ट के सिरों को छोड़कर लाइनें ट्रिम की जाती हैं, केवल व्हाइटस्पेस वाली लाइनें हटा दी जाती हैं और बची हुई लाइनें एक स्पेस से जोड़ दी जाती हैं। एक ही लाइन के स्पेस बने रहते हैं (`{a} {b}` अपना स्पेस रखता है)। जब किसी स्पैन को शुरू या अंत में स्पेस चाहिए, तो `{" "}` या स्ट्रिंग एक्सप्रेशन लिखें। Rust स्ट्रिंग जैसी लिखी हों वैसी ही ड्रॉ होती हैं।

## Props

[सामान्य props](./index.md#common-props) के अलावा (जिनमें `style` का टाइप `TextStyle` है):

| Prop | Rust | प्रकार | डिफ़ॉल्ट | विवरण |
|---|---|---|---|---|
| `numberOfLines` (स्टाइल) | `.number_of_lines(n)`, `.truncate()` | `number` | `0` | दिखाई जाने वाली अधिकतम लाइनें; `0` सभी लाइनें दिखाता है। |
| `textOverflow` (स्टाइल) | `.text_overflow(EllipsizeMode::Middle)` | `"ellipsis" \| "clip" \| "ellipsis-start" \| "ellipsis-middle"` | `"ellipsis"` | जो टेक्स्ट `numberOfLines` में नहीं समाता, उसे कैसे काटा जाए: अंत में, शुरू में या बीच में एलिप्सिस, या सीधे क्लिप। |
| `allowFontScaling` | `.allow_font_scaling(..)` | `boolean` | `true` | सिस्टम की टेक्स्ट साइज़ सेटिंग का पालन करें। |
| `maxFontSizeMultiplier` | `.max_font_size_multiplier(..)` | `number` | `0` | सिस्टम स्केल की ऊपरी सीमा; `0` का मतलब कोई सीमा नहीं। |
| `adjustsFontSizeToFit` | `.shrink_to_fit(min_scale)` | `boolean` | `false` | टेक्स्ट के अपनी लाइनों (`numberOfLines`) और अपने बॉक्स में समाने तक फ़ॉन्ट छोटा करें। |
| `minimumFontScale` | `.shrink_to_fit(min_scale)` | `number` | | `adjustsFontSizeToFit` अधिकतम कितना छोटा करता है (0..1; कम से कम 0.1)। |
| `userSelect` (स्टाइल) | `.select_text()`, `.select_none()` | `"auto" \| "none" \| "text"` | `"auto"` | `"text"`: उपयोगकर्ता टेक्स्ट की रेंज चुन सकता है: लंबा प्रेस एक शब्द चुनता है, हैंडल उसे बढ़ाते हैं, एडिट मेन्यू उसे कॉपी करता है। `"auto"` टेक्स्ट के आसपास के व्यूज़ की सेटिंग लेता है; कुछ भी सेट न होने पर टेक्स्ट selectable नहीं होता, सिवाय डेस्कटॉप ब्राउज़रों के, जहाँ वह तब तक selectable होता है जब तक वह किसी इंटरैक्टिव एलिमेंट के अंदर न हो; `"none"` वहाँ भी उसे unselectable रखता है। |
| `selectionColor` (स्टाइल) | `.selection_color(..)` | `ColorValue` | प्लेटफ़ॉर्म का एक्सेंट | सिलेक्शन की हाइलाइट और हैंडल। |
| `onTextLayout` | | `(e: { lines: TextLayoutLine[] }) => void` | | हर लेआउट के बाद लेआउट हुई लाइनें। |

Tailwind क्लासेस `select-text`, `select-none` और `select-auto` `userSelect` सेट करती हैं, `line-clamp-*` `numberOfLines` सेट करती है, `text-ellipsis` और `text-clip` `textOverflow` सेट करती हैं, और `truncate` एलिप्सिस से कटी एक लाइन है। सिलेक्शन की हाइलाइट और हैंडल स्टाइल की `selectionColor` (`selection:text-*`) लेते हैं, डिफ़ॉल्ट रूप से प्लेटफ़ॉर्म का एक्सेंट।

## Text styles

`TextStyle` व्यू स्टाइल में ये जोड़ता है: `color`, `fontSize`, `fontWeight` (`"normal"`, `"bold"` या 100–900), `fontStyle`, `fontFamily`, `lineHeight`, `letterSpacing`, `textAlign`, `textAlignVertical`, `textTransform`, `textDecorationLine`, `textDecorationColor`, `textDecorationStyle`, `textDecorationThickness`, `textUnderlineOffset`, `textShadow` (CSS का `text-shadow`), `fontVariant`, `writingDirection`, `numberOfLines` और `textOverflow`। Rust में ये `Styled` मेथड हैं: `.text_color(..)`, `.text_size(..)` (या `.text_sm()`, `.text_lg()`, …), `.font_weight(FontWeight::SEMIBOLD)`, `.italic()`, `.font_family(..)`, `.line_height(..)`, `.letter_spacing(..)`, `.text_center()`, `.uppercase()`, `.underline()`, `.line_through()`, `.tabular_nums()`, `.number_of_lines(..)` और बाकी। देखें [स्टाइल रेफ़रेंस](../modules/style-reference.md#textstyle) और [टेक्स्ट](../docs/text.md)।

फ़ॉन्ट फ़ैमिली एक सिस्टम फ़ैमिली या ऐप की एक फ़ॉन्ट फ़ाइल होती है:

```rust tabs
// assets/fonts/Inter-Regular.ttf, shipped by the registry (`registry.assets(assets!())`).
const INTER: FontAsset = asset!("fonts/Inter-Regular.ttf");

text("Inter").font_family(INTER.family).text_size(px(17.0))
```

```tsx tabs
import { Text } from "nsh";
import Inter from "./fonts/Inter-Regular.ttf";

<Text style={{ fontFamily: Inter, fontSize: 17 }}>Inter</Text>;
```

फ़ॉन्ट पहले फ़्रेम से पहले रजिस्टर हो जाता है। देखें [फ़ॉन्ट](../docs/fonts.md)।

## Events

| इवेंट | Rust | पेलोड | कब |
|---|---|---|---|
| `onTextLayout` | | `{ lines: TextLayoutLine[] }` | पैराग्राफ़ के हर लेआउट के बाद। |
| `onPress`, `onLongPress`, … | `.on_press`, `.on_long_press`, … | `PressEvent` (Rust में कोई नहीं) | जैसा [view](./view.md#events) पर; स्पैन पर, उसके अक्षरों पर प्रेस। |
| `onLayout` | `.on_layout` | `{ bounds }` | ब्लॉक का फ़्रेम बदल गया। |

`TextLayoutLine` टेक्स्ट के कंटेंट बॉक्स में `{ text, x, y, width, height, ascender, descender, capHeight, xHeight }` है:

```tsx
const lines = signal(0);
<Text onTextLayout={(e) => lines.set(e.lines.length)}>{article}</Text>;
```

Rust लेआउट से पहले किसी स्ट्रिंग को `measure_text(..)` से मापता है।

## Ref methods

इसकी अपनी कोई नहीं।

## Platform notes

- सिलेक्शन एक टेक्स्ट ब्लॉक (एक टेक्स्ट और उसके स्पैन) के अंदर ही रहता है। iOS अपना एडिट मेन्यू दिखाता है (Copy, Select All, Look Up, Translate, Share), Android एक फ़्लोटिंग टूलबार (Copy, Select all, Share)।
- ठोस एकल लाइन के अलावा अन्य टेक्स्ट डेकोरेशन (`double`, `dotted`, `dashed`, `wavy`) iOS पर NSH द्वारा ड्रॉ किए जाते हैं।
- iOS टेक्स्ट ठोस बैकग्राउंड और बाहरी शैडो ड्रॉ करते हैं।
- [`nsh`](../modules/nsh.md#device) का `fontScale()` (Rust में `font_scale()`) मौजूदा सिस्टम टेक्स्ट स्केल बताता है।
