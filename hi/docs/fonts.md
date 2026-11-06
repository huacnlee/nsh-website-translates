---
title: "फ़ॉन्ट"
description: "सिस्टम फ़ॉन्ट और जेनेरिक फ़ैमिली, फ़ॉलबैक सूचियाँ, Rust crate के assets या TSX imports से .ttf, .otf, .woff और .woff2 फ़ाइलें शिप करना, कई वेट और इटैलिक वाली फ़ैमिली, और typed styles तथा Tailwind क्लासेज़ में फ़ॉन्ट।"
order: 37
group: ui
source_hash: 9fd911f01604c8c3
---

# Fonts

टेक्स्ट सिस्टम फ़ॉन्ट (iOS पर San Francisco, Android पर Roboto) में दिखता है, जब तक कोई font family कुछ और न बताए (Rust में `.font_family(..)`, TSX में `fontFamily`)। family कोई generic family, डिवाइस पर इंस्टॉल किया हुआ फ़ॉन्ट, या ऐप के साथ भेजी गई फ़ॉन्ट फ़ाइल हो सकती है।

<a id="system-and-generic-families"></a>

## सिस्टम और generic families

| `fontFamily` | फ़ॉन्ट |
|---|---|
| (कोई नहीं), `"system-ui"`, `"sans-serif"`, `"ui-sans-serif"`, `"-apple-system"` | सिस्टम फ़ॉन्ट |
| `"serif"`, `"ui-serif"` | सिस्टम serif (iOS पर New York, Android पर Noto Serif) |
| `"monospace"`, `"ui-monospace"` | सिस्टम monospace फ़ॉन्ट (iOS पर SF Mono) |
| `"ui-rounded"` | गोलाई वाला सिस्टम फ़ॉन्ट (SF Pro Rounded), केवल iOS पर |

सिस्टम फ़ॉन्ट 100 से 900 तक हर weight को सपोर्ट करता है। Tailwind के `font-sans`, `font-serif` और `font-mono` पहली तीन पंक्तियों से मैप होते हैं, और `font-sans` व `font-mono` थीम के फ़ॉन्ट से, यदि थीम उन्हें सेट करती है ([ऐप के लिए डिफ़ॉल्ट फ़ॉन्ट](#a-default-font-for-the-app))।

डिवाइस पर इंस्टॉल की गई family को सीधे नाम से इस्तेमाल किया जा सकता है (`"Georgia"`, iOS पर `"Avenir Next"`)। इंस्टॉल किए गए फ़ॉन्ट प्लेटफ़ॉर्म और वर्शन के अनुसार अलग-अलग होते हैं, इसलिए जिन फ़ॉन्ट पर आपका डिज़ाइन निर्भर है उन्हें ऐप के साथ भेजें। iOS पर, जो family मौजूद नहीं है वह लॉग में चेतावनी (`font family 'X' is not available`) के साथ सिस्टम फ़ॉन्ट पर लौट जाती है; इसकी जगह क्या आए, यह चुनने के लिए नामों की सूची दें ([फ़ॉलबैक सूचियाँ](#fallback-lists))।

<a id="shipping-a-font"></a>

## फ़ॉन्ट को ऐप के साथ भेजना

Rust crate अपनी `assets/` डायरेक्टरी की फ़ाइलें भेजता है: अपने `#[native_module]` फ़ंक्शन में `registry.assets(assets!())` उन सभी को भेज देता है, और `asset!("fonts/Pacifico-Regular.ttf")` एक `FontAsset` है जिसका `family` फ़ॉन्ट की family का नाम है, जो crate के कंपाइल होते समय फ़ाइल से पढ़ा जाता है। TSX में `.ttf`, `.otf`, `.woff` या `.woff2` फ़ाइल import करें: import का मान फ़ॉन्ट की family का नाम होता है। दोनों तरीकों में फ़ॉन्ट पहले फ़्रेम से पहले रजिस्टर हो जाता है, इसलिए टेक्स्ट पहली बार रेंडर होते ही वह तैयार रहता है। WOFF और WOFF2 फ़ाइलें compressed TrueType या OpenType फ़ॉन्ट हैं (WOFF2 फ़ाइल अक्सर अपने TrueType से आधे आकार की होती है, जिससे ऐप के पैकेज और वेब के डाउनलोड में बचत होती है): NSH उन्हें हर प्लेटफ़ॉर्म पर उन्हीं फ़ॉन्ट के रूप में पढ़ता है जो उनमें हैं:

```rust tabs
use nsh_core::{element::FontAsset, prelude::*};

const PACIFICO: FontAsset = asset!("fonts/Pacifico-Regular.ttf");

#[native_module("app/native")]
fn native(registry: &mut Registry) {
    registry.assets(assets!());
}

text("Custom fonts").font_family(PACIFICO.family).text_size(px(30.0))
```

```tsx tabs
import { Text } from "nsh";
import Pacifico from "./fonts/Pacifico-Regular.ttf";

<Text style={{ fontFamily: Pacifico, fontSize: 30 }}>Custom fonts</Text>
```

`PACIFICO.family` और TSX import `Pacifico` स्ट्रिंग `"Pacifico"` हैं: यानी फ़ॉन्ट फ़ाइल में संग्रहीत family का नाम (उसका typographic family name, या वह न हो तो family name), फ़ाइल का नाम नहीं। नाम हाथ से लिखने के बजाय asset का मान इस्तेमाल करने से दोनों सिंक में रहते हैं; फ़ाइल गायब या खराब हो तो Rust बिल्ड विफल हो जाता है, और import की गई फ़ाइल का बंडल होना निश्चित है।

ये फ़ाइलें किसी भी अन्य [asset](./images-and-assets.md) की तरह ऐप के साथ भेजी जाती हैं। फ़ॉन्ट केवल ऐप की प्रोसेस के लिए रजिस्टर होते हैं; वे डिवाइस पर इंस्टॉल नहीं होते।

> [!WARNING]
> TSX में, जिस import का मान कभी इस्तेमाल नहीं होता उसे TypeScript का import elision हटा देता है, और उसके साथ फ़ॉन्ट भी हट जाता है। यदि आप किसी family को केवल नाम से संदर्भित करते हैं (उदाहरण के लिए Tailwind थीम में), तो फ़ाइल को उसके side effect के लिए import करें: `import "./fonts/Inter-Bold.ttf";`। Rust crate `assets!()` के ज़रिए `assets/` की हर फ़ाइल भेजता है।

<a id="fallback-lists"></a>

## फ़ॉलबैक सूचियाँ

`fontFamily` CSS की तरह एक सूची लेता है: families कॉमा से अलग की गई, सबसे पसंदीदा पहले, स्पेस वाला नाम quotes में या बिना quotes के (`"Brand, 'Noto Sans SC', sans-serif"`), और quotes वाला नाम अपने कॉमा सहित (`'ACME, Inc'`)। टेक्स्ट उस पहली family में सेट होता है जो प्लेटफ़ॉर्म के पास है, और जो अक्षर उस family में नहीं है (दूसरी लिपि, कोई प्रतीक) वह सूची की अगली उस family से आता है जिसमें वह है, फिर सिस्टम के fallback फ़ॉन्ट से। सूची की मदद से ऐसा ब्रांड फ़ॉन्ट जो केवल Latin को कवर करता है, चीनी टेक्स्ट को मेल खाते फ़ॉन्ट में दिखा सकता है, या ऐप द्वारा डाउनलोड किए जाने वाले फ़ॉन्ट के साथ एक सिस्टम फ़ॉन्ट नाम दिया जा सकता है जो उसके आने तक दिखे:

```rust tabs
text("Brand 品牌").font_family("Brand, 'Noto Sans SC', sans-serif")
```

```tsx tabs
<Text style={{ fontFamily: "Brand, 'Noto Sans SC', sans-serif" }}>Brand 品牌</Text>
```

हर प्लेटफ़ॉर्म सूची का क्रम अपनी फ़ॉन्ट मशीनरी से बनाए रखता है: iOS और macOS पर cascade list, Windows पर font fallback (प्रति पैराग्राफ़ एक: उसकी पहली style की सूची), Linux पर Pango family list, वेब पर ब्राउज़र की अपनी, और GPUI के fallbacks। Android पर टेक्स्ट उस पहली family में सेट होता है जो उसके पास है; जब वह ऐसा फ़ॉन्ट हो जिसे ऐप रजिस्टर करता है, तो सूची में उसके बाद के रजिस्टर किए गए फ़ॉन्ट उसके fallbacks होते हैं (Android 10 और उसके बाद)।

<a id="weights-and-italics"></a>

## Weights और italics

एक family आमतौर पर कई फ़ाइलों में आती है, हर weight और style के लिए एक। हर एक को भेजें (Rust में उन्हें `assets/` में रखें, TSX में हर एक को import करें); वे एक ही family नाम के तहत रजिस्टर होती हैं, और weight व style तय करते हैं कि कौन सा face इस्तेमाल हो:

```rust tabs
// assets/fonts: Inter-Regular.ttf, Inter-Medium.ttf, Inter-Bold.ttf, Inter-Italic.ttf
const INTER: FontAsset = asset!("fonts/Inter-Regular.ttf");

text("Regular, ")
    .font_family(INTER.family)
    .text_size(px(16.0))
    .child(text("medium").font_weight(FontWeight::MEDIUM))
    .child(", ")
    .child(text("bold").font_weight(FontWeight::BOLD))
    .child(" and ")
    .child(text("italic").italic())
    .child(".")
```

```tsx tabs
import { Text } from "nsh";
import Inter from "./fonts/Inter-Regular.ttf";
import "./fonts/Inter-Medium.ttf";
import "./fonts/Inter-Bold.ttf";
import "./fonts/Inter-Italic.ttf";

const body = { fontFamily: Inter, fontSize: 16 } as const;

<Text style={body}>
  Regular, <Text style={{ fontWeight: "500" }}>medium</Text>, <Text style={{ fontWeight: "bold" }}>bold</Text> and{" "}
  <Text style={{ fontStyle: "italic" }}>italic</Text>.
</Text>
```

जब माँगे गए weight का सटीक face रजिस्टर नहीं होता, तो सबसे नज़दीकी वाला इस्तेमाल होता है। face न होने पर प्लेटफ़ॉर्म अलग व्यवहार करते हैं:

| | iOS | Android |
|---|---|---|
| बिना face वाला weight | सबसे नज़दीकी रजिस्टर किया हुआ face | सबसे नज़दीकी face, जहाँ लागू हो वहाँ Android का synthetic bold |
| italic face के बिना italic | सीधा (upright) face (कोई तिरछापन नहीं) | सीधे face का तिरछा किया हुआ रूप |

दोनों पर एक जैसा नतीजा पाने के लिए वे सभी faces भेजें जिन्हें आप इस्तेमाल करते हैं।

<a id="fonts-in-typed-styles-and-tailwind-classes"></a>

## Typed styles और Tailwind classes में फ़ॉन्ट

Rust में, `.font_family(..)` हर उस जगह asset की family लेता है जहाँ style जाती है, और weight methods (`.font_weight(FontWeight::SEMIBOLD)`) faces चुनते हैं। classes के लिए, अपनी families को `nsh.json` में Tailwind थीम में नाम दें ताकि उन्हें `font-*` classes के रूप में इस्तेमाल किया जा सके:

```json
{
  "tailwind": {
    "fontFamily": { "display": "Pacifico", "body": "Inter" }
  }
}
```

```rust tabs
use nsh_core::element::palette::VIOLET;

text("Custom fonts").font_family(PACIFICO.family).text_3xl().text_color(VIOLET.shade(600))
text("Bold Inter").font_family(INTER.family).font_weight(FontWeight::BOLD)
```

```tsx tabs
import { Text } from "nsh";
import "./fonts/Pacifico-Regular.ttf";
import "./fonts/Inter-Regular.ttf";
import "./fonts/Inter-Bold.ttf";

<Text class="font-display text-3xl text-violet-600">Custom fonts</Text>
<Text class="font-body font-bold">Bold Inter</Text>
```

थीम में एंट्री के बिना भी कोई भी family काम करती है: `font-[Pacifico]`। Weight classes (`font-light`, `font-semibold`, `font-bold`, ...) faces को वैसे ही चुनती हैं जैसे `fontWeight` करता है। view पर लगी text styles उसके भीतर के texts तक पहुँचती हैं, इसलिए view पर `.font_family(INTER.family)`, या `<View class="font-body">`, पूरी स्क्रीन की family सेट कर देता है।

<a id="a-default-font-for-the-app"></a>

## ऐप के लिए डिफ़ॉल्ट फ़ॉन्ट

थीम का `font-sans` ऐप का फ़ॉन्ट है: हर वह टेक्स्ट जो अपनी कोई family सेट नहीं करता, उसी में बनता है, Rust components और TSX दोनों में, ठीक वैसे ही जैसे वेब पेज Tailwind के `--font-sans` के साथ होता है। `font-mono` monospaced फ़ॉन्ट है, `font-mono` class का और `TextView` में code का। इन्हें ऐप की थीम में सेट करें (`nsh.json` में `"theme"`, [Rust](./rust.md#theme)) और ऊपर बताए अनुसार फ़ॉन्ट फ़ाइलें भेजें:

```json
{
  "cssVars": {
    "theme": {
      "font-sans": "Inter, sans-serif",
      "font-mono": "JetBrains Mono, monospace"
    }
  }
}
```

सूची की पहली वह family जो generic नहीं है, वही फ़ॉन्ट होती है; पहली family generic हो (`system-ui`, `sans-serif`) तो वह सिस्टम फ़ॉन्ट है। फ़ॉन्ट किसी container पर भी सेट किया जा सकता है: उसके भीतर के texts उसे inherit करते हैं।

```rust tabs
#[component]
pub fn Root() -> impl IntoElement {
    view().flex_1().font_family(INTER.family).child(app())
}
```

```tsx tabs
mount(() => (
  <View class="flex-1 font-body">
    <App />
  </View>
));
```

## Font features

`fontVariant` फ़ॉन्ट की OpenType features चालू करता है: `"tabular-nums"`, `"proportional-nums"`, `"lining-nums"`, `"oldstyle-nums"` और `"small-caps"` (Rust में `.tabular_nums()`, `.small_caps()`, ...; [Text](./text.md#text-styles))। फ़ॉन्ट में वे features होनी चाहिए; सिस्टम फ़ॉन्ट में होती हैं।

<a id="related"></a>

## संबंधित

- [Text](./text.md): text styles, sizes और सिस्टम की text size सेटिंग।
- [Tailwind](./tailwind.md#theme): थीम की keys।
- [Images और assets](./images-and-assets.md): ऐप की फ़ाइलें कैसे भेजी जाती हैं।
