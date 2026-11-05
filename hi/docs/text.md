---
title: "टेक्स्ट"
description: "Rust और TSX में text element के साथ टेक्स्ट दिखाना - नेस्टेड spans और links, इनलाइन views, fonts और decorations, truncation, सिस्टम टेक्स्ट साइज़, selection और onTextLayout।"
order: 35
group: ui
source_hash: 9d528fcdc65c1a8c
---

# टेक्स्ट

सारा टेक्स्ट text elements द्वारा दिखाया जाता है: Rust में `text(..)`, TSX में `<Text>`। एक text element एक पैराग्राफ होता है, जिसे प्लेटफ़ॉर्म का टेक्स्ट इंजन (Apple प्लेटफ़ॉर्म पर CoreText, Android पर `StaticLayout`) लेआउट के समय engine thread पर टाइपसेट करता है, और केवल main thread पर ड्रॉ किया जाता है। नेस्टेड text elements उसी पैराग्राफ के spans होते हैं, अलग व्यू नहीं।

```rust tabs
text("By continuing you agree to the ")
    .text_size(px(16.0))
    .line_height(px(24.0))
    .text_color(rgb(0x1f2328))
    .child(
        text("Terms of service")
            .text_color(rgb(0x0969da))
            .underline()
            .on_press(open_terms),
    )
    .child(".")
```

```tsx tabs
<Text style={{ fontSize: 16, lineHeight: 24, color: "#1f2328" }}>
  By continuing you agree to the{" "}
  <Text style={{ color: "#0969da", textDecorationLine: "underline" }} onPress={openTerms}>
    Terms of service
  </Text>
  .
</Text>
```

> [!IMPORTANT]
> Strings को text elements दिखाते हैं। TSX में, `<View>` के भीतर सीधे रखी गई string नहीं दिखती: उसे `<Text>` में लपेटें।

एलिमेंट का दस्तावेज़ [text](../elements/text.md) पर है; यह पेज उसके उपयोग के बारे में है।

<a id="strings-and-whitespace"></a>

## Strings और व्हाइटस्पेस

Rust में, text की सामग्री एक string होती है, जो जैसी लिखी गई वैसी दिखती है: `\n` लाइन तोड़ता है। जो सामग्री signals पढ़ती है वह एक closure होती है, और signals बदलने पर text अपडेट होता है। TSX में, JSX text के नियम React जैसे ही हैं: हर लाइन ट्रिम की जाती है, केवल व्हाइटस्पेस वाली लाइनें हटा दी जाती हैं, और बची हुई लाइनें एक स्पेस से जोड़ दी जाती हैं। एक लाइन के भीतर का व्हाइटस्पेस बना रहता है, इसलिए `{first} {last}` अपना स्पेस रखता है। लाइन की शुरुआत या अंत में स्पेस के लिए `{" "}` और लाइन ब्रेक के लिए `{"\n"}` का उपयोग करें:

```rust tabs
text(move || format!("Hello, {}!\nWelcome back.", name.get()))
```

```tsx tabs
<Text>
  Hello,
  {name()}!{"\n"}
  Welcome back.
</Text>
```

टेक्स्ट में एक्सप्रेशन उसी के अनुसार चलते हैं जो वे पढ़ते हैं: `count` बदलने पर `text(move || format!("{} items", count.get()))` और `<Text>{count()} items</Text>` अपडेट होते हैं।

<a id="spans-and-inheritance"></a>

## Spans और इनहेरिटेंस

text के भीतर का text एक span होता है। वह अपने पैरेंट की text style इनहेरिट करता है और जो कुछ वह सेट करता है उसे ओवरराइड करता है:

```rust tabs
text("")
    .text_size(px(17.0))
    .text_color(rgb(0x1f2328))
    .child(text("Light ").font_weight(FontWeight::LIGHT))
    .child(text("Bold ").font_weight(FontWeight::BOLD))
    .child(text("Italic ").italic())
    .child(text("Spaced").letter_spacing(px(4.0)))
```

```tsx tabs
<Text style={{ fontSize: 17, color: "#1f2328" }}>
  <Text style={{ fontWeight: "300" }}>Light </Text>
  <Text style={{ fontWeight: "700" }}>Bold </Text>
  <Text style={{ fontStyle: "italic" }}>Italic </Text>
  <Text style={{ letterSpacing: 4 }}>Spaced</Text>
</Text>
```

Text styles व्यू से भी नीचे की ओर जाती हैं, जैसे CSS में: Rust में `view().text_color(white()).text_sm()` और TSX में `<View class="text-white text-sm">` उनके भीतर के text और input elements को स्टाइल करते हैं।

### Links

प्रेस हैंडलर वाला span (`.on_press(..)` या `.on_long_press(..)`; `onPress` या `onLongPress`) एक लिंक होता है: उसके अक्षरों पर प्रेस span को जाता है, कहीं और का प्रेस पैराग्राफ को। नेस्टेड spans में भी लिंक काम करते हैं।

```rust tabs
text("Read the ")
    .on_press(move || tapped.set("the sentence"))
    .child(text("terms").text_color(rgb(0x0969da)).on_press(move || tapped.set("terms")))
    .child(" first.")
```

```tsx tabs
<Text onPress={() => log("the sentence")}>
  Read the <Text style={{ color: "#0969da" }} onPress={() => open(termsUrl)}>terms</Text> first.
</Text>
```

<a id="backgrounds-of-spans"></a>

### Spans के बैकग्राउंड

span का बैकग्राउंड रंग और कॉर्नर रेडियस उसके अक्षरों के पीछे, हर उस लाइन पर जिस तक वह पहुँचता है, एक बॉक्स बनाते हैं, जिसकी ऊँचाई उसके फ़ॉन्ट जितनी होती है; text का लेआउट वैसा ही रहता है और वह पूरा कॉपी होता है, इसलिए इनलाइन कोड एक span होता है
([Text element](../elements/text.md#span-backgrounds)):

```rust tabs
text("Run ")
    .child(text(" npm test ").font_family("ui-monospace").bg(rgb(0xeff1f3)).rounded(px(4.0)))
    .child(" first.")
```

```tsx tabs
<Text>
  Run <Text style={{ fontFamily: "ui-monospace", backgroundColor: "#eff1f3", borderRadius: 4 }}> npm test </Text> first.
</Text>
```

<a id="views-and-images-inside-text"></a>

### Text के भीतर व्यू और इमेज

text के भीतर text के अलावा कोई भी element इनलाइन, बेसलाइन पर लेआउट होता है, और शब्दों के साथ रैप होता है। वह अपने खुद के प्रेस ले सकता है:

```rust tabs
text("Made with ")
    .text_size(px(16.0))
    .line_height(px(26.0))
    .child(image(LOGO).size(px(18.0)))
    .child(" nsh. Status ")
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
  Made with <Image src={logo} style={{ width: 18, height: 18 }} /> nsh. Status{" "}
  <View style={{ backgroundColor: "#1a7f37", borderRadius: 9, paddingHorizontal: 7, height: 18, justifyContent: "center" }}>
    <Text style={{ color: "#ffffff", fontSize: 11, fontWeight: "700" }}>LIVE</Text>
  </View>
</Text>
```

`numberOfLines` या ellipsis से कटे हुए इनलाइन elements छिप जाते हैं; text कॉपी करने पर वे छूट जाते हैं। इनलाइन element के भीतर का text अपने आसपास के text का रंग लेता है, जैसे CSS का `color` इनलाइन ब्लॉक तक पहुँचता है, जब तक वह अपना रंग सेट न करे (ऊपर का `LIVE` badge ऐसा करता है); उसका फ़ॉन्ट और लाइन की ऊँचाई उसकी अपनी रहती है।

style key `verticalAlign` इनलाइन element को उसकी लाइन में रखती है, जैसे CSS का `vertical-align` इमेज को रखता है:
`"baseline"` (डिफ़ॉल्ट) उसके निचले हिस्से को बेसलाइन पर रखता है, `"text-top"` और `"text-bottom"` उसके ऊपरी या निचले हिस्से को text के फ़ॉन्ट के ऊपरी या निचले हिस्से पर रखते हैं, और `"middle"` उसे बेसलाइन से फ़ॉन्ट की x height के आधे ऊपर केंद्रित करता है। जहाँ भी element फ़ॉन्ट से आगे निकलता है, वहाँ लाइन उसे समाने के लिए बढ़ जाती है, निश्चित `lineHeight` के साथ भी। पैराग्राफ की शुरुआत में ऐसा आइकन जिसे text के निचले हिस्से से मेल खाना चाहिए, जैसे Android का `ImageSpan` उसे ड्रॉ करता है, `"text-bottom"` लेता है। क्लासेस हैं
`align-baseline`, `align-text-top`, `align-text-bottom` और `align-middle`; Rust में `.align_text_bottom()` और इन्हीं नामों वाले अन्य।

```tsx
<Text style={{ fontSize: 16 }}>
  <Image src={badge} style={{ width: 16, height: 16, verticalAlign: "text-bottom" }} /> Verified seller
</Text>
```

## Text styles

| Property | Values | Rust |
|---|---|---|
| `color` | एक [color](./styling.md#colors)। डिफ़ॉल्ट काला | `.text_color(..)` |
| `fontSize` | Points। डिफ़ॉल्ट 14 | `.text_size(px(..))`, `.text_sm()`, `.text_lg()`, ... |
| `fontWeight` | `"normal"` (400), `"bold"` (700), या `100`–`900` (number या string) | `.font_weight(FontWeight::BOLD)` |
| `fontStyle` | `"normal"`, `"italic"`: रंगीन emoji सीधे रहते हैं | `.italic()` |
| `fontFamily` | एक system family, एक generic family, या एक [imported font](./fonts.md) | `.font_family(..)` |
| `lineHeight` | Points | `.line_height(px(..))` |
| `letterSpacing` | Points | `.letter_spacing(px(..))` |
| `textAlign` | `"auto"`, `"left"`, `"center"`, `"right"`, `"justify"`, `"start"`, `"end"`: `left` और `right` अपनी दिशाएँ दाएँ से बाएँ ही रखते हैं, `start` और `end` दिशा का अनुसरण करते हैं | `.text_left()`, `.text_center()`, `.text_right()`, `.text_justify()` |
| `textAlignVertical` | `"auto"`, `"top"`, `"center"`, `"bottom"`: अपने बॉक्स से छोटा text कहाँ बैठता है | |
| `textTransform` | `"none"`, `"uppercase"`, `"lowercase"`, `"capitalize"` | `.normal_case()`, `.uppercase()`, `.lowercase()`, `.capitalize()` |
| `textDecorationLine` | `"none"`, `"underline"`, `"line-through"`, `"underline line-through"` | `.no_underline()`, `.underline()`, `.line_through()` |
| `textDecorationColor`, `textDecorationStyle` | रंग; `"solid"`, `"double"`, `"dotted"`, `"dashed"`, `"wavy"` | `.text_decoration_color(..)`, `.text_decoration_wavy()`, ... |
| `textDecorationThickness`, `textUnderlineOffset` | Points, या `"auto"` (मोटाई भी `"from-font"`) | `.text_decoration_thickness(px(..))`, `.underline_offset(px(..))` |
| `textShadow` | CSS का `text-shadow`, अक्षरों के पीछे एक शैडो: `"2px 2px 4px rgb(0 0 0 / 0.6)"` (offsets, blur, color), या उसकी परतें संख्याओं के रूप में, `[{ x: 2, y: 2, blur: 4, color: "#00000099" }]`; कई परतें सबसे चौड़ी परत की तरह ड्रॉ होती हैं | `.text_shadow([TextShadow { .. }])`, `.text_shadow_sm()`, ..., `.text_shadow_color(..)` |
| `fontVariant` | OpenType features: `["tabular-nums"]`, `"small-caps"`, `"oldstyle-nums"`, `"lining-nums"`, `"proportional-nums"` | `.tabular_nums()`, `.small_caps()`, `.oldstyle_nums()`, `.lining_nums()`, `.proportional_nums()` |
| `writingDirection` | `"auto"`, `"ltr"`, `"rtl"`: पैराग्राफ की बेस दिशा | `.writing_direction(WritingDirection::Rtl)` |

text element एक व्यू भी है: वह बैकग्राउंड, बॉर्डर, कॉर्नर, पैडिंग और अन्य [view styles](./styling.md) लेता है।

```rust tabs
text(move || format!("{:.2}", price.get())).text_size(px(18.0)).tabular_nums()
text("Typo").underline().text_decoration_wavy().text_decoration_color(rgb(0xcf222e))
text("Shadow")
    .text_size(px(26.0))
    .font_weight(FontWeight::EXTRA_BOLD)
    .text_color(white())
    .text_shadow([TextShadow {
        offset_x: px(2.0),
        offset_y: px(2.0),
        radius: px(4.0),
        color: rgba(0x00000099).into(),
    }])
```

```tsx tabs
<Text style={{ fontSize: 18, fontVariant: ["tabular-nums"] }}>{price().toFixed(2)}</Text>
<Text style={{ textDecorationLine: "underline", textDecorationStyle: "wavy", textDecorationColor: "#cf222e" }}>Typo</Text>
<Text style={{ fontSize: 26, fontWeight: "800", color: "#ffffff", textShadow: "2px 2px 4px rgba(0,0,0,0.6)" }}>
  Shadow
</Text>
```

`tabular-nums` हर अंक को समान चौड़ाई देता है, जिससे काउंटर और कीमतें बदलते समय हिलती नहीं हैं।

## Truncation

```rust tabs
text(long_description).number_of_lines(2)
text(file_path).number_of_lines(1).text_overflow(EllipsizeMode::Middle)
```

```tsx tabs
<Text style={{ numberOfLines: 2 }}>{longDescription}</Text>
<Text style={{ numberOfLines: 1, textOverflow: "ellipsis-middle" }}>{filePath}</Text>
```

| Style key / prop | Rust | Description |
|---|---|---|
| `numberOfLines` (style) | `.number_of_lines(n)` | दिखाई जाने वाली अधिकतम लाइनें; `0` (डिफ़ॉल्ट) सभी दिखाता है |
| `textOverflow` (style) | `.text_overflow(EllipsizeMode::Middle)` | जो text फ़िट नहीं होता उसे कैसे काटा जाए: अंत में ellipsis (`"ellipsis"`, डिफ़ॉल्ट), शुरुआत में (`"ellipsis-start"`) या बीच में (`"ellipsis-middle"`), या `"clip"` |
| `adjustsFontSizeToFit` | `.shrink_to_fit(min_scale)` | फ़ॉन्ट को तब तक छोटा करें जब तक text अपनी लाइनों और बॉक्स में फ़िट न हो जाए |
| `minimumFontScale` | | `adjustsFontSizeToFit` कितना छोटा कर सकता है (0–1) |

```rust tabs
text(move || total.get())
    .number_of_lines(1)
    .shrink_to_fit(0.5)
    .text_size(px(48.0))
    .w(px(200.0))
```

```tsx tabs
<Text adjustsFontSizeToFit minimumFontScale={0.5} style={{ numberOfLines: 1, fontSize: 48, width: 200 }}>
  {total()}
</Text>
```

Tailwind क्लासेस `line-clamp-*`, `text-ellipsis` और `text-clip` वही keys सेट करती हैं, और `truncate` (`.truncate()`) ellipsis के साथ कटी हुई एक लाइन है; style keys के रूप में ये state styles और variants भी लेती हैं।

<a id="system-text-size"></a>

## सिस्टम text size

Text डिफ़ॉल्ट रूप से उपयोगकर्ता की text size सेटिंग (iOS पर Dynamic Type, Android पर font size) का पालन करता है।

| Prop | Rust | Description |
|---|---|---|
| `allowFontScaling` | `.allow_font_scaling(false)` | `false` साइज़ को स्थिर रखता है। डिफ़ॉल्ट `true` |
| `maxFontSizeMultiplier` | `.max_font_size_multiplier(1.5)` | लागू होने वाला सबसे बड़ा स्केल, जैसे `1.5`। `0` का मतलब कोई सीमा नहीं |

Rust में `font_scale()` और TSX में [`nsh`](../modules/nsh.md#device) से `fontScale()` वर्तमान स्केल हैं, और उपयोगकर्ता के सेटिंग बदलने पर बदलते हैं। Inputs भी `allowFontScaling` और `maxFontSizeMultiplier` लेते हैं।

```rust tabs
text("Tab label").max_font_size_multiplier(1.3).text_size(px(13.0))
```

```tsx tabs
<Text maxFontSizeMultiplier={1.3} style={{ fontSize: 13 }}>Tab label</Text>
```

स्केल को बंद करने के बजाय उसे सीमित करना बेहतर है: बड़ा text एक accessibility सेटिंग है जिस पर लोग निर्भर करते हैं।

## Selection

style key `userSelect: "text"` (`.select_text()`, क्लास `select-text`) उपयोगकर्ता को text चुनने और कॉपी करने देती है, जैसे सिस्टम के अपने text views में: लंबा प्रेस उँगली के नीचे का शब्द चुनता है, हैंडल चयन के सिरों को हिलाते हैं, और edit menu Copy और Select All देता है (iOS में Look Up, Translate और Share जुड़ते हैं; Android में Share)। चयन एक text block के भीतर ही रहता है। style key `selectionColor` (`.selection_color(..)`, `selection:text-*`) हाइलाइट और हैंडल का रंग तय करती है। व्यू पर सेट की गई `userSelect` उसके भीतर के उन texts तक पहुँचती है जो कोई मान सेट नहीं करते।

डेस्कटॉप ब्राउज़र में text डिफ़ॉल्ट रूप से चुनने योग्य होता है, जैसे वेब पेज पर, सिवाय इंटरैक्टिव elements के भीतर (प्रेस या टच हैंडलर वाले व्यू, जैसे बटन और pressable rows); वहाँ `userSelect: "none"` (`.select_none()`, क्लास `select-none`) text को न चुनने योग्य बनाए रखती है। फ़ोन और टैबलेट ब्राउज़र नेटिव नियम का पालन करते हैं।

```rust tabs
text(order_number).select_text().selection_color(rgb(0x7c3aed))
```

```tsx tabs
<Text style={{ userSelect: "text", selectionColor: "#7c3aed" }}>{orderNumber}</Text>
```

कोड से कॉपी करने के लिए (Copy बटन), Rust में `set_clipboard(..)` या TSX में [`Clipboard`](../modules/nsh.md#clipboard) का उपयोग करें।

## onTextLayout

`onTextLayout` (Rust में `TextLayout` event) हर लेआउट के बाद, text के content box में, लेआउट हुई लाइनों की जानकारी देता है:

```rust tabs
text(move || body.get()).on(EventKind::TextLayout, move |e: &EventPayload| {
    if let EventPayload::TextLayout(laid_out) = e {
        lines.set(laid_out.len());
    }
})
```

```tsx tabs
<Text
  onTextLayout={(e) => {
    lines.set(e.lines.length);
    console.log(e.lines.map((l) => `${l.text} (${l.bounds.size.width.toFixed(0)}pt)`));
  }}
>
  {body()}
</Text>
```

हर लाइन में `text`, `x`, `y`, `width`, `height`, `ascender`, `descender`, `capHeight` और `xHeight` होते हैं (Rust में `cap_height` और `x_height`)। इसका उपयोग "Read more" बटन केवल तब दिखाने के लिए करें जब text कटा हो, या अन्य सामग्री को बेसलाइन से संरेखित करने के लिए।

## Accessibility

text element को स्क्रीन रीडर उसकी सामग्री के रूप में पढ़ते हैं। जो text हेडिंग का काम करता है (`.role(AccessibilityRole::Header)`, `role="header"`) और लिंक (`AccessibilityRole::Link`, `role="link"`) उन्हें role दें। देखें [Accessibility](./accessibility.md)।

<a id="related"></a>

## संबंधित

- [Fonts](./fonts.md): कस्टम फ़ॉन्ट और weights।
- [text element](../elements/text.md): हर prop।
- [Forms and keyboard](./forms-and-keyboard.md): text input।
