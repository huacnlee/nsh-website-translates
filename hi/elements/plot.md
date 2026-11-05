---
title: "Plot"
description: "nsh/base/plot का Plot कॉम्पोनेंट, इसके मार्क्स Line, Area, Bar, Rule, Dot, Cell, Grid, Pie, Arc, RadialLine, RadialGrid, Sankey और Treemap, इसके PlotAxis और PlotLabel: ऐसे चार्ट जो ऐप की पंक्तियों (rows) से नेटिव रूप में बनाए जाते हैं, जिनमें अक्षों के स्केल और उनके लेबल, डेटा पॉइंट पर टेक्स्ट, पॉइंटर के नीचे मौजूद पंक्ति, सेल या स्लाइस, और मोशन शामिल हैं, और जिनका अपना कोई लुक नहीं होता।"
group: base
demo: el-plot
source_hash: 2aca4d23862b455b
---

# Plot

Plot चार्ट का फ्रेम है: उसमें दिखने वाली डेटा की पंक्तियाँ, उसके x और y अक्षों के स्केल, उस पर पॉइंटर और उसकी गति। इसके मार्क वह सब बनाते हैं जो यह रखता है: एक सीरीज़ से होकर `Line`, सीरीज़ और बेसलाइन के बीच `Area`, बैंड स्केल के बैंड में प्रति पंक्ति एक `Bar`, प्रति पंक्ति एक शुरुआत से अंत तक `Rule` (कैंडल की विक), प्रति पंक्ति जहाँ उसके दो मान मिलते हैं वहाँ एक `Dot` (स्कैटर के पॉइंट, बबल चार्ट के बबल), दो श्रेणियों के बैंड में प्रति पंक्ति एक `Cell` जो अपने मान से रंगा जाता है (हीटमैप), आर-पार रेखाओं का `Grid`, पंक्तियों के हिस्सों का `Pie` (बीच में छेद वाला डोनट), दो कोणों के बीच `Arc`, और केंद्र के चारों ओर `RadialLine` जिसके पीछे `RadialGrid` के रिंग और स्पोक होते हैं (रडार), पंक्तियों के बीच प्रवाहों का `Sankey`, और नेस्टेड आयतों का `Treemap` जिसमें हर लीफ का क्षेत्रफल उसका मान होता है (मार्केट मैप); `PlotAxis` किसी किनारे को उसके स्केल के टिक से लेबल करता है, और `PlotLabel` स्केल के बिंदुओं पर टेक्स्ट लिखता है। हर मार्क प्लॉट को भरने वाला एक कैनवस है, जो पंक्तियों से नेटिव रूप में बनाया जाता है: ऐप की पंक्तियाँ उसके सेट करते समय एक बार पढ़ी जाती हैं, फिर Rust में स्केल, रिकॉर्ड और ड्रॉ की जाती हैं, इसलिए हज़ार पॉइंट वाला चार्ट प्रति पॉइंट कोई JS नहीं चलाता। पॉइंटर को भी Rust में ही ट्रैक किया जाता है: हॉवर की क्रॉस लाइन, डॉट और टूलटिप प्लेटफ़ॉर्म के एनिमेटर पर चलते और फ़ेड होते हैं, और ऐप को केवल नई पंक्ति की सूचना मिलती है, और कुछ नहीं। लुक ऐप का है: मार्क SVG शेप के लिए CSS की पेंट प्रॉपर्टी (`stroke-*`, `fill-*`) से पेंट होते हैं, जहाँ कोई सेट न हो वहाँ `currentColor` लागू होता है, एरिया या बार अपने आकार के भीतर बैकग्राउंड (एक ग्रेडिएंट, `bg-linear-*`) दिखाता है, और हॉवर के हिस्सों (हर मार्क का डॉट भी उनमें शामिल है) तथा अक्षों के लेबल, टिक मार्क और लाइनों को स्टाइल करना और भरना ऐप का काम है।

```rust tabs
use nsh_base::{
    plot::{area, grid, line, plot},
    theme,
};
use nsh_core::{element::{RowAccessor, Rows}, prelude::*};

fn week(visitors: Vec<f64>, hovered: Signal<Option<u32>>) -> impl IntoElement {
    let rows = Rows::from_columns(visitors.len(), [("visitors".into(), visitors)]);
    plot()
        .data(rows)
        .y(RowAccessor::key("visitors"))
        .accessibility_label("Visitors per day")
        .h(px(160.0))
        .on_hover_change(move |index: &Option<u32>| hovered.set(*index))
        .child(grid().y(vec![0.0, 1500.0, 3000.0]).stroke_color(move || theme().border))
        .child(area().fill_color(move || theme().chart_1.opacity(0.2)))
        .child(line().stroke_color(move || theme().chart_1).stroke_width(px(2.0)))
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { Area, Grid, Line, Plot } from "nsh/base/plot";

const rows = [
  { day: "Mon", visitors: 1820 },
  { day: "Tue", visitors: 2140 },
  { day: "Wed", visitors: 1960 },
  { day: "Thu", visitors: 2480 },
  { day: "Fri", visitors: 2310 },
];

function App() {
  const hovered = signal<number | null>(null);
  return (
    <View class="gap-2 p-4">
      <Text class="text-sm text-muted-foreground tabular-nums">
        {hovered() == null ? "Visitors" : `${rows[hovered()!].day}: ${rows[hovered()!].visitors}`}
      </Text>
      <Plot
        data={rows}
        y="visitors"
        yScale={{ type: "linear", domain: [0, 3000] }}
        accessibilityLabel="Visitors per day, highest on Thursday"
        onHoverChange={({ index }) => hovered.set(index)}
        crossLineClass="w-px h-full bg-border"
        dotClass="size-2.5 rounded-full border-2 border-background bg-chart-1"
        class="h-40"
      >
        <Grid y={[0, 1500, 3000]} class="stroke-border" />
        <Area class="fill-chart-1/20" />
        <Line class="stroke-chart-1 stroke-2" />
      </Plot>
    </View>
  );
}

mount(App);
```

`Plot`, `Line`, `Area`, `Bar`, `Rule`, `Dot`, `Cell`, `Grid`, `Pie`, `Arc`, `RadialLine`, `RadialGrid`, `Sankey`, `Treemap`, `PlotAxis` और `PlotLabel` `nsh/base/plot` से आते हैं, जो अपने आप में [`nsh/base`](../modules/nsh-base.md) का एक मॉड्यूल है (Rust में, `nsh_base::plot`)। TypeScript में प्लॉट के props उसकी पंक्तियों के टाइप पर जेनेरिक होते हैं: फ़ील्ड नामों की जाँच उन्हीं के विरुद्ध होती है, और पंक्ति का फ़ंक्शन पंक्ति का टाइप पाता है। Rust में `plot()` हर prop के लिए एक सेटर के साथ प्लॉट बनाता है, पंक्तियाँ एक `Rows` होती हैं (कुंजी के अनुसार संख्याओं के कॉलम), मान एक `RowAccessor` होते हैं (एक कुंजी या पंक्ति के इंडेक्स का फ़ंक्शन), और मार्क टाइप्ड पेंट मेथड (`.stroke_color(..)`, `.fill_color(..)`, `.stroke_width(..)`) लेते हैं।

<a id="plot-1"></a>

## Plot

| Prop | Rust | टाइप | डिफ़ॉल्ट | विवरण |
|---|---|---|---|---|
| `data` | `.data(..)` | `T[]` | (अनिवार्य) | पंक्तियाँ, हर पॉइंट के लिए एक ऑब्जेक्ट। मार्क अपने मान एक बार पढ़ते हैं, जब ऐप पंक्तियाँ सेट करता है; जिस पंक्ति में मान नहीं है (ऐसा फ़ील्ड जो संख्या नहीं है, `null`) उसे छोड़ दिया जाता है। |
| `x` | `.x(..)` | `keyof T \| (d: T, index: number) => number` | पंक्ति का इंडेक्स | `linear` x स्केल पर पंक्ति को x अक्ष पर क्या स्थान देता है। `point` स्केल पंक्तियों को क्रम में रखता है। |
| `y` | `.y(..)` | `keyof T \| (d: T, index: number) => number` | कोई नहीं | मार्क क्या बनाते हैं, जब तक वे अपना नाम न दें। |
| `xScale` | `.x_scale(..)` | `Scale` | `{ type: "point" }` | x अक्ष पंक्तियों को कैसे रखता है: `point` (क्रम में, बाएँ किनारे से दाएँ किनारे तक समान दूरी पर; एक पंक्ति हो तो बीच में), वैकल्पिक `domain` के साथ `linear`, या `band` (हर पंक्ति के लिए एक बैंड, बार के लिए, [Bar](#bar); या हर श्रेणी के लिए एक बैंड, सेल के लिए, [Cell](#cell))। `band` y स्केल के साथ इसका डिफ़ॉल्ट `linear` होता है, आड़े बार के लिए। `reverse: true` इसे दाएँ किनारे से चलाता है ([उलटे स्केल](#reversed-scales))। |
| `yScale` | `.y_scale(..)` | `Scale` | `{ type: "linear" }` | y अक्ष मानों को कैसे रखता है: डोमेन का सबसे छोटा मान निचले किनारे पर, सबसे बड़ा ऊपर। `domain` के बिना, वह विस्तार जो मार्क बनाते हैं। `band` आड़े बार के लिए ऊपरी किनारे से नीचे की ओर हर पंक्ति का एक बैंड रखता है। `reverse: true` इसे उलटी दिशा में चलाता है: सबसे छोटा मान ऊपरी किनारे पर, पंक्तियाँ निचले किनारे से ऊपर की ओर ([उलटे स्केल](#reversed-scales))। |
| `y2Scale` | `.y2_scale(..)` | `LinearScale` | कोई नहीं | दूसरा y स्केल, `{ type: "linear", domain?, reverse? }`, उन मार्क के लिए जो उसका नाम लेते हैं (`scale="y2"`): दोहरे अक्ष वाले चार्ट का दाहिनी ओर का स्केल ([दोहरे अक्ष](#dual-axes))। `domain` के बिना, उस पर मौजूद मानों का विस्तार। |
| `alignTicks` | `.align_ticks(..)` | `boolean` | `true` | जब तक कोई भी y स्केल डोमेन का नाम न दे और दोनों पर मार्क हों, दोनों को एक जैसे गोल चरणों तक बढ़ाया जाता है ताकि उनके टिक एक ही रेखाओं पर पड़ें ([दोहरे अक्ष](#dual-axes))। `false` हर एक को उसके मानों के विस्तार पर रखता है। |
| `interactive` | `.interactive(..)` | `boolean` | `true` | प्लॉट पॉइंटर और कीबोर्ड का अनुसरण करता है: वह उसके नीचे की पंक्ति की रिपोर्ट करता है और हॉवर के हिस्से दिखाता है, और यह Tab का एक स्टॉप है जिसकी ऐरो कुंजियाँ हॉवर को हिलाती हैं ([कीबोर्ड](#keyboard))। `false` केवल मार्क बनाता है (सूची में एक स्पार्कलाइन), और उस पर प्रेस आसपास के व्यू को जाते हैं। प्लॉट कीबोर्ड देता है या नहीं, यह उसके बनाते समय तय होता है। |
| `motion` | `.motion(..)` | `PlotMotion` | कोई नहीं | अपीयर की टाइमिंग, हॉवर का फ़ेड इन और आउट, और वह स्प्रिंग जिस पर हॉवर तब सरकता है जब कुंजियाँ उसे हिलाती हैं (नीचे)। |
| `appearGeneration` | `.appear_generation(..)` | `number \| string` | कोई नहीं | अपीयर चुनता है: प्लॉट के पहली बार दिखने पर मार्क खिंचकर बनते हैं, और जब भी यह बदलता है (दूसरा सिंबल, दूसरी अवधि) फिर से। [`PlotAppearScope`](#plotappearscope) के अंदर, वहाँ पूरी हो चुकी जनरेशन एक साथ पूरी दिखती है। |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | कोई नहीं | स्क्रीन रीडर चार्ट के बारे में क्या कहते हैं: वह क्या दिखाता है और क्या अलग दिखता है। |
| `accessibilityValue` | `.accessibility_value(..)` | `{ min?, max?, now?, text? }` | कोई नहीं | स्क्रीन रीडर उसके मान के रूप में क्या सुनते हैं: पॉइंटर के नीचे की पंक्ति के लिए ऐप के शब्द। |
| `crossLineClass`, `crossLineStyle` | `.cross_line_class(..)`, `.cross_line_style(..)` | `string`, `StyleProp<ViewStyle>` | कोई नहीं | क्रॉस लाइन: प्लॉट जितना ऊँचा एक व्यू, जो पॉइंटर के नीचे की पंक्ति पर केंद्रित होता है। बैंड स्केल पर यह पंक्ति के बैंड में बैठता है, बैंड जितना चौड़ा (बैंड y स्केल पर प्लॉट के आर-पार)। |
| `dotClass`, `dotStyle` | `.dot_class(..)`, `.dot_style(..)` | `string`, `StyleProp<ViewStyle>` | कोई नहीं | हॉवर के डॉट: `Line`, `Area` और `RadialLine` में से हर एक के लिए एक व्यू, जो पॉइंटर के नीचे की पंक्ति पर उसके पॉइंट पर केंद्रित होता है, और `Dot` का व्यू पॉइंटर के नीचे अपने डॉट जितना बड़ा होता है। किसी मार्क के `hoverDotClass` / `hoverDotStyle` उसके अपने डॉट के लिए इन्हें बदल देते हैं। |
| `tooltipContent` | `.tooltip_content(..)` | `JSX.Element` | कोई नहीं | ऐप का टूलटिप, जो `tooltipPlacement` से रखा जाता है और क्रॉस लाइन के साथ हिलता और फ़ेड होता है। |
| `tooltipPlacement` | `.tooltip_placement(..)` | `"top" \| "pointer"` | `"top"` | टूलटिप कहाँ जाता है: प्लॉट के ऊपर, क्रॉस लाइन पर केंद्रित; या पॉइंटर के बगल में, क्रॉस लाइन के उस ओर जो प्लॉट के मध्य की तरफ़ है, और ऊपरी आधे हिस्से में पॉइंटर के नीचे, निचले आधे में उसके ऊपर। ऊपर रहने पर यह प्लॉट के बाएँ और दाएँ किनारों के बीच रहता है (ऊपरी किनारे से उसकी दूरी ऐप तय करता है: प्लॉट के नीचे का टैग प्लॉट की ऊँचाई और उससे अधिक लेता है); पॉइंटर के बगल में रहने पर यह प्लॉट के भीतर रहता है। कीबोर्ड के साथ, यह उस पंक्ति पर पहली लाइन या एरिया के पॉइंट के बगल में जाता है (बार के बैंड का मध्य, पाई की स्लाइस का मध्य)। |
| `tooltipOffset` | `.tooltip_offset(..)` | `number` | `0` | टूलटिप और उसे स्थान देने वाली चीज़ के बीच की दूरी: `"top"` के लिए ऊपरी किनारा, `"pointer"` के लिए क्रॉस लाइन और पॉइंटर। |
| `colorScale` | `.color_scale(..)` | `ColorScale` | कोई नहीं | मार्क के रंग: उन श्रेणियों के जिन्हें उनका `color` पढ़ता है, d3 के `scaleOrdinal` की तरह (`{ type: "ordinal", domain?, range, unknown? }`, [श्रेणी के अनुसार रंग](#colors-by-category)), या उन संख्याओं के जिन्हें `Cell` का `value` रैंप के साथ पढ़ता है, d3 के `scaleSequential` और `scaleDiverging` की तरह (`{ type: "sequential" \| "diverging", … }`, [रैंप के अनुसार रंग](#colors-along-a-ramp))। |
| `children` | `.child(..)` | `JSX.Element` | कोई नहीं | मार्क, जो क्रम से एक-दूसरे के ऊपर बनते हैं, और जो कुछ ऐप उनके ऊपर रखता है। |
| `class`, `style` | style methods | `string`, `StyleProp<ViewStyle>` | कोई नहीं | प्लॉट का आकार और लुक; मार्क उसकी पेंट प्रॉपर्टी इनहेरिट करते हैं, जैसे CSS करता है। `focus:` / `focus-visible:` क्लास और `focusStyle` उसका फ़ोकस रिंग बनाते हैं। |

| इवेंट | Rust | पेलोड | कब |
|---|---|---|---|
| `onHoverChange` | `.on_hover_change(..)` | `{ index: number \| null }` | पॉइंटर किसी दूसरी पंक्ति के ऊपर आया: x अक्ष के अनुसार उसके सबसे निकट की पंक्ति का इंडेक्स (y अक्ष के अनुसार, जब केवल उसी में बैंड हों), उसके नीचे की [pie](#pie-and-arc) की स्लाइस का, उस [dot](#dot) का जिसका केंद्र उसके सबसे निकट है, उसके नीचे के [cell](#cell) का (दो सेल के बीच के गैप के आर-पार, जो अधिक निकट हो), या कोण के अनुसार उसके सबसे निकट की [radial line](#radialline-and-radialgrid) की पंक्ति का; प्लॉट छोड़ने पर `null` (पाई के ऊपर, उसकी स्लाइस; रेडियल लाइन के ऊपर, उसकी बाहरी त्रिज्या)। |

`Scale` है `{ type: "point"; reverse? } | { type: "linear"; domain?: [number, number]; reverse? } | { type: "band";
domain?: string[]; paddingInner?; paddingOuter?; maxBandWidth?; bandCount?; groupPadding?; reverse? }`. A `linear`
स्केल का `domain` उसके दो मानों का विस्तार है, किसी भी क्रम में; एक मान वाला डोमेन उसे बीच में रखता है। `band` स्केल का `domain` उसके बैंड की श्रेणियाँ हैं, क्रम में ([Cell](#cell)); उसके अन्य विकल्प [Bar](#bar) में हैं।

पंक्ति का फ़ंक्शन (`y={(d) => d.high - d.low}`) हर पंक्ति के लिए एक बार बुलाया जाता है जब पंक्तियाँ या फ़ंक्शन बदलते हैं, अगले टर्न में, कभी भी तब नहीं जब प्लॉट ड्रॉ करता हो या पॉइंटर का अनुसरण करता हो: इसे प्योर रखें (वही पंक्ति, वही संख्या)। फ़ील्ड नाम बिना किसी JS के पढ़ा जाता है।

<a id="reversed-scales"></a>

### उलटे स्केल

`reverse: true` स्केल को उसके दूसरे किनारे से चलाता है, जैसे visx के स्केल `reverse` लेते हैं और d3 के स्केल उलटा लिखी रेंज लेते हैं। x अक्ष पर पहली पंक्ति, या डोमेन का सबसे छोटा मान, दाएँ किनारे पर होता है; y अक्ष पर डोमेन का सबसे छोटा मान ऊपरी किनारे पर होता है और पंक्तियाँ निचले किनारे से ऊपर की ओर चलती हैं। स्केल पर रखी हर चीज़ उसका अनुसरण करती है: मार्क, बार का आधार और उनके बढ़ने की दिशा, एरिया की बेसलाइन, ग्रिड लाइनें, `PlotAxis` के टिक, हॉवर जो पंक्ति ढूँढता है, ऐरो कुंजियाँ ([कीबोर्ड](#keyboard)) और नए डोमेन में जाने वाली गतियाँ। उलटे `linear` y स्केल पर बार ऊपरी किनारे से लटकते हैं, और उलटे `linear` x स्केल पर आड़े बार दाएँ किनारे से बाईं ओर बढ़ते हैं:

```tsx
<Plot
  data={depths}
  y="depth"
  xScale={{ type: "band", paddingInner: 0.2 }}
  yScale={{ type: "linear", domain: [0, 40], reverse: true }}
  class="h-32"
>
  <Bar class="fill-chart-2" cornerRadii={{ bottomLeft: 3, bottomRight: 3 }} />
</Plot>
```

प्लॉट के अपीयर के साथ, लाइन और एरिया उस किनारे से खिंचकर बनते हैं जहाँ से x स्केल शुरू होता है, और उलटे होने पर दाएँ किनारे से।

<a id="dual-axes"></a>

### दोहरे अक्ष

<!-- demo: el-plot-dual -->

प्लॉट में अन्य इकाइयों के मानों के लिए एक दूसरा y स्केल होता है: कीमत के बगल में वॉल्यूम, मार्जिन के बगल में राजस्व। y के साथ मान रखने वाला हर हिस्सा `scale` लेता है: `"y"` (डिफ़ॉल्ट, प्लॉट का `yScale`) या `"y2"` (उसका `y2Scale`)। दाईं ओर `scale="y2"` वाला `PlotAxis` उसे लेबल करता है:

```tsx
<Plot data={days} xScale={{ type: "band", paddingInner: 0.3 }} class="mx-10 mb-6 h-44">
  <Grid class="stroke-border" />
  <Bar value="volume" class="fill-chart-2/50" />
  <Line y="close" scale="y2" class="stroke-chart-1 stroke-2" />
  <PlotAxis placement="left" format={(v) => `${v}M`} labelClass="pr-2 text-xs text-muted-foreground" />
  <PlotAxis placement="right" scale="y2" labelClass="pl-2 text-xs text-muted-foreground" />
</Plot>
```

हर स्केल का डोमेन उसका अपना होता है: ऐप का `domain`, या उस पर मौजूद मानों का विस्तार, और हर एक `motion.update` से नए डोमेन में जाता है। जब तक कोई भी स्केल डोमेन का नाम न दे, प्लॉट दोनों को गोल चरणों (10 की घात का 1, 2 या 5 गुना, लगभग हर 32 पॉइंट की ऊँचाई पर एक चरण) की समान संख्या में बिछाता है: जब दोनों में शून्य हो, शून्य दोनों पर एक ही रेखा पर पड़ता है; अन्यथा जो स्केल शून्य से शुरू होता है (वॉल्यूम) वह अपने अतिरिक्त चरण ऊपर की ओर पाता है और दूसरा (कीमत) दोनों ओर। अक्षों के टिक वही चरण हैं, और जो `Grid` न `x` रखता है न `y`, वह अपनी रेखाएँ उन्हीं पर खींचता है, इसलिए एक ग्रिड दोनों अक्षों के काम आता है। `alignTicks={false}` इसे बंद कर देता है; ऐप द्वारा नामित `domain` दोनों स्केल को जैसे वे हैं वैसे ही छोड़ देता है।

हॉवर एक पंक्ति ढूँढता है; हर मार्क का डॉट अपने स्केल पर बैठता है, और रीड-आउट ऐप का है, जो `onHoverChange` द्वारा रिपोर्ट की गई पंक्ति के दोनों मान पढ़ता है। दोनों स्केल के बार हर बैंड में साथ-साथ खड़े होते हैं, और `stack` केवल अपने स्केल के बार को ढेर करता है। `y2Scale` लीनियर है: जिस प्लॉट के y अक्ष में बैंड हैं उसमें दूसरा y स्केल नहीं होता।
<a id="line-area-and-grid"></a>

## Line, Area और Grid

| Mark | Prop | टाइप | डिफ़ॉल्ट | विवरण |
|---|---|---|---|---|
| `Line` | `y` | `string \| (d, index) => number` | plot का `y` | यह क्या बनाता है: मान वाली हर पंक्ति के लिए एक बिंदु; जिन पंक्तियों में मान नहीं है, वे छोड़ दी जाती हैं। |
| `Line`, `Area` | `data`, `x` | `T[]`, `string \| (d, index) => number` | plot की पंक्तियाँ | उसकी अपनी श्रृंखला (series) की पंक्तियाँ (अन्य x मान), जो plot के scales पर उसके अपने `x` से रखी जाती हैं (इसके बिना पंक्ति का index)। |
| `Line`, `Area` | `curve` | `"natural" \| "linear" \| "stepAfter"` | `"natural"` | यह अपने बिंदुओं को कैसे जोड़ता है: एक चिकना वक्र, सीधे खंड, या ऐसी सीढ़ियाँ जो हर मान को अगली पंक्ति तक थामे रखती हैं। area का निचला किनारा भी इसी वक्र का अनुसरण करता है। |
| `Line` | `dot`, `dotClass`, `dotStyle` | `boolean`, `string`, `StyleProp<ViewStyle>` | `false` | हर बिंदु पर एक डॉट: उसी पर केंद्रित एक view, जिसका आकार, background और border ऐप तय करता है। |
| `Line`, `Area` | `hoverDotClass`, `hoverDotStyle` | `string`, `StyleProp<ViewStyle>` | plot के `dotClass`, `dotStyle` | इसका hover डॉट, जो पॉइंटर के नीचे वाली पंक्ति के बिंदु पर आता है: हर श्रृंखला का डॉट उसके अपने रंग में। प्रत्येक इस mark के लिए plot वाले को बदल देता है (plot के आकार और रिंग पर mark का रंग); `hidden` कोई डॉट नहीं दिखाता। |
| `Area` | `backgroundClass`, `backgroundStyle` | `string`, `StyleProp<ViewStyle>` | कोई नहीं | इसका background: इसकी आकृति के चारों ओर एक बॉक्स (पहले बिंदु से आख़िरी तक, सबसे ऊँचे बिंदु से baseline तक, या band पर निचले किनारे के सबसे निचले बिंदु तक) जिसका background (`bg-*`, `bg-linear-to-b from-… to-…`, `backgroundImage`) केवल आकृति के भीतर, इसके `fill` के नीचे दिखता है। इसके होने पर, जहाँ कुछ सेट नहीं है वहाँ `fill` `none` होता है। |
| `Area` | `y1` | `string \| (d, index) => number` | plot का `y` | इसका ऊपरी किनारा क्या बनाता है। |
| `Area` | `y0` | `number \| string \| (d, index) => number` | y scale का निचला सिरा | इसका निचला किनारा: संख्या y scale पर एक baseline है; field या function हर पंक्ति को उसका अपना निचला मान देता है, जिससे area एक band बन जाता है (किसी दिन का न्यूनतम से अधिकतम, किसी पूर्वानुमान की सीमा)। इसके बिना area उस किनारे तक बंद होता है जहाँ y scale के सबसे छोटे मान हैं: नीचे का किनारा, और उलटे scale पर ऊपर वाला (ऊपर से लटकता area)। जिस पंक्ति में किसी भी किनारे का मान नहीं है, उसे छोड़ दिया जाता है। |
| `Line`, `Area`, `Grid` | `scale` | `"y" \| "y2"` | `"y"` | वह y scale जिस पर इसके मान चलते हैं: plot का `yScale` या उसका दूसरा, `y2Scale` ([दोहरे अक्ष](#dual-axes))। |
| `Grid` | `x` | `number[]` | कोई नहीं | इसकी ऊर्ध्वाधर रेखाएँ कहाँ जाएँ, x scale के मानों के रूप में (`point` scale पर पंक्तियों के index)। |
| `Grid` | `y` | `number[]` | कोई नहीं | इसकी क्षैतिज रेखाएँ कहाँ जाएँ, y scale के मानों के रूप में। `x` और `y` दोनों के बिना, रेखाएँ इसके scale के ticks का अनुसरण करती हैं, जहाँ `PlotAxis` उन्हें `ticks` के बिना रखता है (आड़ी bars के लिए x के साथ)। |
| `Grid` | `ticks` | `number` | axis का डिफ़ॉल्ट | `x` और `y` दोनों के बिना यह लगभग कितनी रेखाएँ खींचता है, `PlotAxis` के `ticks` की तरह। |
| `Line`, `Area` | `color` | `string \| (d, index) => string` | कोई नहीं | इसकी पंक्तियों की श्रेणी, जिसका रंग plot के `colorScale` से आता है: जहाँ कुछ सेट नहीं है, वहाँ इसकी पहली पंक्ति की श्रेणी line का `stroke` (area का `fill`) तय करती है ([श्रेणी के अनुसार रंग](#colors-by-category))। |

प्रत्येक mark पूरे plot को भरता है और अपने [SVG paint properties](../modules/style-reference.md#svg-paint) से पेंट करता है, जो plot वालों पर प्रभावी होते हैं, ठीक वैसे ही जैसे CSS उन्हें inherit करता है:

| Mark | इनसे पेंट करता है | जहाँ कुछ सेट नहीं है |
|---|---|---|
| `Line` | `stroke`, `strokeWidth`, `strokeDasharray` | `currentColor`, 1 चौड़ी, ठोस |
| `Area` | `fill` (इसके `background` भाग पर); इसका ऊपरी किनारा `stroke`, `strokeWidth`, `strokeDasharray` | `fill` `currentColor` (background के साथ `none`); कोई stroke नहीं |
| `Grid` | `stroke`, `strokeWidth`, `strokeDasharray` | `currentColor`, 1 चौड़ी, ठोस; हर रेखा पूरे डिवाइस पिक्सेल पर, ताकि पतली रेखा भी तीखी रहे |

जब plot में कोई domain नहीं होता, तब `Line` या `Area` जो मान खींचता है, और area का `y0` भी (उसकी baseline, या हर पंक्ति का निचला मान), y scale का domain बनाते हैं; grid के मान नहीं बनाते। mark तभी दोबारा बनता है जब जो वह खींचता है बदलता है (इसकी पंक्तियाँ, मान, वक्र, plot का आकार या scales, इसका paint); पॉइंटर hover के हिस्सों को हिलाता है और किसी mark को दोबारा नहीं बनवाता।

band एक `Area` है जिसका `y0` पंक्तियों को पढ़ता है: इसका ऊपरी किनारा `y1` से गुज़रता है, निचला किनारा `y0` से वापस आता है, दोनों area के `curve` के साथ, और appear दोनों को आगे के किनारे से अंदर खींचता है। इसका hover डॉट ऊपरी किनारे पर बैठता है; उस पर एक `Line` मध्य मान को चिह्नित करता है:

```tsx
<Plot data={days} y="close">
  <Area y1="high" y0="low" class="fill-chart-1/15" hoverDotClass="hidden" />
  <Line class="stroke-chart-1 stroke-2" />
</Plot>
```

`fill` CSS का ही है, जैसा ब्राउज़र में होता है: एक रंग। line के नीचे का gradient area का background होता है, ठीक वैसे ही जैसे कोई पेज किसी आकृति में gradient दिखाता है (`clip-path` के अंतर्गत बॉक्स का `background-image`): `backgroundClass="bg-linear-to-b from-chart-1/20
to-transparent"` area के सबसे ऊँचे बिंदु से उसकी baseline तक धुँधला करता है, थीम के tokens और appearance के रंगों में, किसी भी view के background की तरह।

## Bar

`Bar` `band` scale के band में हर पंक्ति के लिए एक bar खींचता है: band x scale पर खड़ी, band y scale पर आड़ी (तब x scale `linear`)। प्रत्येक bar `base` से दूसरे scale पर पंक्ति के मान तक चलती है, इसलिए ऋणात्मक मान दूसरी ओर बढ़ता है, और जिस पंक्ति में मान नहीं है उसकी कोई bar नहीं होती। उलटे मान scale पर bars ऊपरी किनारे से नीचे की ओर या दाएँ किनारे से बाईं ओर बढ़ती हैं, और उलटा band scale पहली पंक्ति का band दाईं ओर या नीचे रखता है ([उलटे scales](#reversed-scales))।

```tsx
import { Bar, Grid, Plot } from "nsh/base/plot";

const sales = [
  { month: "Jan", online: 42, store: 31 },
  { month: "Feb", online: 51, store: 28 },
  { month: "Mar", online: 48, store: 36 },
];

<Plot
  data={sales}
  xScale={{ type: "band", paddingInner: 0.3, paddingOuter: 0.15, groupPadding: 0.1 }}
  yScale={{ type: "linear", domain: [0, 60] }}
  class="h-40"
>
  <Grid y={[20, 40, 60]} class="stroke-border" />
  <Bar value="online" class="fill-chart-1" cornerRadii={{ topLeft: 4, topRight: 4 }} />
  <Bar value="store" class="fill-chart-2" cornerRadii={{ topLeft: 4, topRight: 4 }} />
</Plot>
```

stack के बाहर की bars हर band में अगल-बगल खड़ी होती हैं, marks के क्रम में; समान `stack` वाली bars एक के ऊपर एक जमती हैं, और हर पंक्ति की bar वहाँ से शुरू होती है जहाँ stack में उससे पहले वाली समाप्त होती है:

```tsx
<Bar value="online" stack="sales" class="fill-chart-1" />
<Bar value="store" stack="sales" class="fill-chart-2" cornerRadii={{ topLeft: 4, topRight: 4 }} label={(d) => `${d.online + d.store}`} />
```

| Prop | टाइप | डिफ़ॉल्ट | विवरण |
|---|---|---|---|
| `value` | `string \| (d, index) => number` | plot का `y` | प्रत्येक bar क्या दिखाती है। |
| `base` | `number \| string \| (d, index) => number` | `0` | वह मान जहाँ से इसकी bars बढ़ती हैं, मान scale पर: हर पंक्ति के लिए एक, या field अथवा function जो हर पंक्ति को उसका अपना दे, ताकि प्रत्येक bar अपनी पंक्ति के base से उसके मान तक फैले (जिस पंक्ति में base नहीं है उसकी कोई bar नहीं)। यह domain में गिना जाता है। stack अपनी पहली bar के base से, पंक्ति दर पंक्ति, बढ़ता है। |
| `stack` | `string` | कोई नहीं | वह stack जिसमें यह शामिल होती है: समान `stack` वाली bars क्रम से जमती हैं (जिस पंक्ति में मान नहीं है वह कुछ नहीं जोड़ती)। |
| `scale` | `"y" \| "y2"` | `"y"` | वह y scale जिस पर इसकी खड़ी bars के मान चलते हैं ([दोहरे अक्ष](#dual-axes)); दोनों पर की bars अगल-बगल खड़ी होती हैं, और stack केवल अपने scale की bars को जमाता है। |
| `cornerRadii` | `number \| { topLeft?, topRight?, bottomRight?, bottomLeft? }` | `0` | इसकी bars के प्रत्येक कोने की त्रिज्या; `{ topLeft: 4, topRight: 4 }` खड़ी bars के सिरों को गोल करता है। bar के आधे से बड़ी त्रिज्या उसमें समा जाती है। |
| `stagger` | `number` | `0` | plot के appear के साथ, bars पंक्ति दर पंक्ति एक के बाद एक शुरू होती हैं, appear के इस हिस्से (0 से 0.95) में, और प्रत्येक बाकी समय में बढ़ती है; 0 उन्हें एक साथ बढ़ाता है। |
| `inactiveOpacity` | `number` | कोई नहीं | जब पॉइंटर plot के ऊपर हो, तब पॉइंटर के नीचे वाली पंक्ति से दूर की इसकी bars की opacity, ताकि वह पंक्ति उभरे: यह hover के साथ फीकी होती और उभरती है और उसी के साथ एक bar से दूसरी पर जाती है। |
| `label` | `string \| (d, index) => string` | कोई नहीं | प्रत्येक bar के मान वाले सिरे पर पाठ: एक field (उसका पाठ, या उसकी संख्या) या ऐसा function जो ऐप द्वारा फ़ॉर्मैट किया पाठ लौटाए। |
| `labelClass`, `labelStyle` | `string`, `StyleProp<TextStyle>` | कोई नहीं | `label` भाग: bar पर केंद्रित पाठ, खड़ी bar के सिरे के ऊपर (नीचे बढ़ने वाली के नीचे), आड़ी bar के बाद (पीछे बढ़ने वाली के पहले)। इसकी padding bar से इसकी दूरी है। |
| `backgroundClass`, `backgroundStyle` | `string`, `StyleProp<ViewStyle>` | कोई नहीं | इसका background: प्रत्येक bar का बॉक्स, जिसका background (`bg-linear-to-t from-… to-…`, bar के तल से उसके शीर्ष तक) केवल bar के भीतर, उसके `fill` के नीचे दिखता है। इसके होने पर, जहाँ कुछ सेट नहीं है वहाँ `fill` `none` होता है। |
| `color` | `string \| (d, index) => string` | कोई नहीं | प्रत्येक bar की श्रेणी, जिसका रंग plot के `colorScale` से आता है: जहाँ कुछ सेट नहीं है, वहाँ bar का `fill` ([श्रेणी के अनुसार रंग](#colors-by-category))। |

band scale plot की प्रति पंक्ति एक band क्रम से बिछाता है, या अपने `domain` की प्रति श्रेणी एक band, जैसा d3 का `scaleBand` करता है:

| विकल्प | डिफ़ॉल्ट | विवरण |
|---|---|---|
| `domain` | कोई नहीं | इसके bands की श्रेणियाँ, क्रम से (d3 का `scaleBand().domain()`): [`Cell`](#cell) अपनी पंक्ति की श्रेणी के band में जाता है, और `PlotAxis` प्रत्येक band की श्रेणी लिखता है; दो बार लिखी श्रेणी अपनी पहली जगह रखती है। इसके बिना, bands पंक्तियाँ होती हैं, या cells पर वे श्रेणियाँ जिन्हें cells axis के साथ नाम देते हैं, उसी क्रम में जिसमें पंक्तियाँ उन्हें लाती हैं। |
| `paddingInner` | `0` | पड़ोसी bands के बीच का अंतर, प्रत्येक band के step का एक हिस्सा (0 से 1)। |
| `paddingOuter` | `0` | पहले band से पहले और आख़िरी के बाद का अंतर, step का एक हिस्सा। `paddingInner` का आधा bands के मध्य को plot भर में बराबर steps पर रखता है। |
| `maxBandWidth` | कोई नहीं | band अधिकतम कितना चौड़ा हो सकता है, points में: चौड़े plot पर कुछ ही bands संकरे रहते हैं, प्रत्येक अपनी जगह के बीच में। |
| `bandCount` | पंक्तियाँ | पंक्तियों से अधिक होने पर वे bands जिनके लिए axis बिछाया जाता है: पंक्तियाँ शुरुआती bands लेती हैं और अपनी चौड़ाई और जगह वैसी ही रखती हैं जैसी पंक्तियाँ आने पर होती है। |
| `groupPadding` | `0` | एक band में अगल-बगल की bars के बीच का अंतर, प्रत्येक bar की जगह का एक हिस्सा। |
| `reverse` | `false` | bands दूसरे किनारे से चलते हैं: x axis पर पहली पंक्ति का band दाईं ओर, y axis पर नीचे; एक band में अगल-बगल की bars अपना क्रम बनाए रखती हैं। |

bar अपने `fill` (`fill-*`; plot से inherit होकर, जैसा CSS inherit करता है) से पेंट होती है, जहाँ कुछ सेट नहीं है वहाँ `currentColor` (`color` के साथ उसकी श्रेणी का रंग), और कोई hover डॉट नहीं दिखाती। band scale पर, hover पॉइंटर के नीचे का band खोजता है, और plot की cross line उसी band में, उतनी ही चौड़ी, बैठती है: `crossLineClass="w-full h-full bg-foreground/5"` band को रंगता है, `w-px` उसके मध्य में एक रेखा रखता है। जब plot में कोई domain नहीं होता, तब bars के मान और base मान scale का domain बनाते हैं। plot के appear के साथ, प्रत्येक bar अपने stack के base से बढ़ती है; गति, फीका होना और सरकना platform के animator पर चलते हैं, और पॉइंटर किसी bar को दोबारा नहीं बनवाता।

<a id="ranges"></a>

### रेंज

<!-- demo: el-plot-ranges -->

`base` के field या function होने पर, प्रत्येक bar अपनी पंक्ति के दो मानों तक फैलती है: waterfall का step उससे पहले के चालू योग से उसके बाद वाले तक, candle की body उसके open से close तक, कोई कार्य उसकी शुरुआत से अंत तक। दिखने के समय bar अपने base से बढ़ती है, और उसका label उसके मान वाले सिरे पर बैठता है, ऊपर उठती bar के ऊपर और गिरती bar के नीचे।

```tsx
const bridge = [
  { step: "Revenue", from: 0, to: 120, kind: "total" },
  { step: "Costs", from: 120, to: 72, kind: "down" },
  { step: "Other", from: 72, to: 81, kind: "up" },
  { step: "Profit", from: 0, to: 81, kind: "total" },
];

<Plot
  data={bridge}
  xScale={{ type: "band", paddingInner: 0.3 }}
  colorScale={{ type: "ordinal", domain: ["total", "up", "down"], range: ["#64748b", "#16a34a", "#dc2626"] }}
  class="h-40"
>
  <Bar value="to" base="from" color="kind" label={(d) => `${d.to - d.from}`} labelClass="text-xs pb-1" />
</Plot>
```

funnel केंद्रित आड़ी bars है: band y scale पर `base={(d) => -d.users / 2}` और `value={(d) => d.users / 2}`।

## Rule

`Rule` मान अक्ष के साथ प्रति पंक्ति एक सीधी रेखा खींचता है, `base` से पंक्ति के मान तक: band scale पर पंक्ति के band के मध्य में (band y scale पर plot के आर-पार), और point या linear scale पर x अक्ष के साथ पंक्ति की जगह पर। candle की wick, box plot की whisker, error bar और lollipop का डंठल rules हैं; candlestick `Rule` के ऊपर एक `Bar` है:

```tsx
import { Bar, Plot, Rule } from "nsh/base/plot";

<Plot
  data={days}
  xScale={{ type: "band", paddingInner: 0.4 }}
  colorScale={{ type: "ordinal", domain: ["up", "down"], range: ["#16a34a", "#dc2626"] }}
  class="h-48"
>
  <Rule value="high" base="low" color={(d) => (d.close >= d.open ? "up" : "down")} />
  <Bar value="close" base="open" color={(d) => (d.close >= d.open ? "up" : "down")} />
</Plot>
```

| Prop | टाइप | डिफ़ॉल्ट | विवरण |
|---|---|---|---|
| `value` | `string \| (d, index) => number` | plot का `y` | प्रत्येक रेखा कहाँ समाप्त होती है। जिस पंक्ति में मान नहीं है उसकी कोई रेखा नहीं होती। |
| `base` | `number \| string \| (d, index) => number` | `0` | प्रत्येक रेखा कहाँ से शुरू होती है: हर पंक्ति के लिए एक मान (शून्य रेखा से lollipop का डंठल), या field अथवा function जो हर पंक्ति को उसका अपना दे (candle का low)। यह domain में गिना जाता है। |
| `scale` | `"y" \| "y2"` | `"y"` | वह y scale जिस पर इसके मान चलते हैं ([दोहरे अक्ष](#dual-axes))। |
| `stagger` | `number` | `0` | plot के appear के साथ, रेखाएँ पंक्ति दर पंक्ति एक के बाद एक शुरू होती हैं, appear के इस हिस्से (0 से 0.95) में, और प्रत्येक बाकी समय में अपनी शुरुआत से बढ़ती है। |
| `inactiveOpacity` | `number` | कोई नहीं | जब पॉइंटर plot के ऊपर हो, तब पॉइंटर के नीचे वाली पंक्ति से दूर की इसकी रेखाओं की opacity, `Bar` की तरह। |
| `color` | `string \| (d, index) => string` | कोई नहीं | प्रत्येक रेखा की श्रेणी, जिसका रंग plot के `colorScale` से आता है: जहाँ कुछ सेट नहीं है, वहाँ रेखा का `stroke`। |

rule अपने `stroke` (`stroke-*`, `strokeWidth`, `strokeDasharray`; plot से inherit होकर, जैसा CSS inherit करता है) से stroke करती है, जहाँ कुछ सेट नहीं है वहाँ `currentColor`, और कोई hover डॉट नहीं दिखाती। जब plot में कोई domain नहीं होता, तब इसके मान और base मान scale का domain बनाते हैं; यह plot के appear के साथ अपनी शुरुआत से बढ़ती है और scales के domains के साथ चलती है, platform के animator पर।
## Dot

<!-- demo: el-plot-dots -->

`Dot` हर पंक्ति के लिए एक डॉट बनाता है, वहाँ जहाँ पंक्ति के दो मान मिलते हैं: `linear` x स्केल पर उसका `x` और y अक्ष पर ऊपर की ओर उसका `value` मिलकर स्कैटर प्लॉट बनाते हैं; band x स्केल पर हर डॉट अपनी पंक्ति के बैंड के बीच में रहता है; band y स्केल पर (x स्केल `linear`) उसका मान x के साथ चलता है और उसकी पंक्ति का बैंड प्लॉट में नीचे की ओर जाता है, यानी डॉट प्लॉट। उसकी त्रिज्या `r` हर डॉट के लिए एक ही संख्या होती है, या हर पंक्ति का एक मान, जिसे `rScale` त्रिज्या में बदलता है, यानी बबल चार्ट। जिस पंक्ति में मान नहीं है, उसका कोई डॉट नहीं बनता।

```tsx
import { Dot, Grid, Plot } from "nsh/base/plot";
import { token } from "nsh";

const sessions = [
  { minutes: 12, trades: 5, platform: "iOS" },
  { minutes: 8, trades: 3, platform: "Android" },
  { minutes: 26, trades: 11, platform: "Web" },
  { minutes: 17, trades: 8, platform: "iOS" },
];

<Plot
  data={sessions}
  x="minutes"
  xScale={{ type: "linear", domain: [0, 40] }}
  yScale={{ type: "linear", domain: [0, 20] }}
  colorScale={{ type: "ordinal", domain: ["iOS", "Android", "Web"], range: [token("chart-1"), token("chart-2"), token("chart-3")] }}
  class="h-48"
>
  <Grid x={[10, 20, 30]} y={[5, 10, 15]} class="stroke-border" />
  <Dot
    value="trades"
    r={4}
    color="platform"
    inactiveOpacity={0.3}
    class="stroke-card stroke-2"
    hoverDotClass="rounded-full outline-2 outline-offset-1 outline-foreground"
  />
</Plot>
```

`r` के फ़ील्ड या फ़ंक्शन होने पर, हर पंक्ति का मान उसके डॉट का आकार तय करता है। `rScale={{ type: "sqrt", range: [min, max] }}` मानों के वर्गमूलों को पॉइंट में त्रिज्याओं पर मैप करता है, जैसा d3 का `scaleSqrt` करता है, इसलिए 0 से शुरू होने वाली रेंज में बबल का क्षेत्रफल उसके मान के अनुपात में रहता है; 0 से अधिक से शुरू होने वाली रेंज सबसे छोटे बबलों को दिखाई देते रहने देती है। स्केल कोई डोमेन न बताए तो डोमेन 0 से सबसे बड़े मान तक होता है। बड़े डॉट पहले बनते हैं, ताकि छोटे डॉट उनके ऊपर दिखाई देते रहें:

```tsx
<Plot
  data={countries}
  x="gdp"
  xScale={{ type: "linear", domain: [-10, 95] }}
  yScale={{ type: "linear", domain: [48, 90] }}
  colorScale={{ type: "ordinal", range: [token("chart-1"), token("chart-2"), token("chart-3"), token("chart-4")] }}
  class="h-56"
>
  <Dot value="life" r="population" rScale={{ type: "sqrt", range: [3, 24] }} color="region" class="stroke-card" />
</Plot>
```

प्लॉट में डोमेन न होने पर डॉट के मान value स्केल का डोमेन बनाते हैं, बिना 0 तक पहुँचे, ताकि स्कैटर के अक्ष उसके बिंदुओं में फ़िट हों। डॉट बड़े हों तो प्लॉट को `domain` मानों के चारों ओर कुछ जगह के साथ दें: डोमेन के किनारे पर मौजूद बबल प्लॉट के किनारे के पार बन जाता है।

एक ही बैंड में दो मार्क ऐसे चार्ट बनाते हैं जो एक पंक्ति के दो मानों की तुलना करते हैं: लॉलीपॉप में 0 से एक `Rule` होती है जिसके नीचे उसके मान पर एक `Dot` होता है, और डम्बल band y स्केल पर एक मान से दूसरे तक एक `Rule` होती है जिसके हर सिरे पर एक `Dot` होता है:

```tsx
<Plot data={stocks} yScale={{ type: "band", paddingInner: 0.3 }} xScale={{ type: "linear", domain: [-50, 80] }} class="h-48">
  <Rule value="high" base="low" class="stroke-border stroke-2" />
  <Dot value="before" r={3.5} class="fill-card stroke-muted-foreground" hoverDotClass="hidden" />
  <Dot value="now" r={5} class="fill-chart-1 stroke-card stroke-2" hitRadius={24} />
</Plot>
```

| Prop | Type | Default | Description |
|---|---|---|---|
| `value` | `string \| (d, index) => number` | प्लॉट का `y` | हर डॉट value अक्ष पर कहाँ जाएगा: y अक्ष पर ऊपर की ओर, या band y स्केल पर x के साथ। जिस पंक्ति में मान नहीं है, उसका कोई डॉट नहीं बनता। |
| `r` | `number \| string \| (d, index) => number` | `3` | डॉट की त्रिज्या पॉइंट में, या एक फ़ील्ड या फ़ंक्शन जो हर पंक्ति को एक मान देता है जिसे `rScale` त्रिज्या बनाता है (उसके बिना मान ही त्रिज्या होता है)। जिस पंक्ति का मान गायब है, उसका कोई डॉट नहीं बनता। |
| `rScale` | `{ type: "sqrt"; domain?: [number, number]; range: [number, number] }` | कोई नहीं | `r` के मान त्रिज्या कैसे बनते हैं: उनके वर्गमूल `domain` (डोमेन के बिना 0 से सबसे बड़े मान तक) पर त्रिज्याओं की `range` पर मैप होते हैं, इसलिए 0 से शुरू होने वाली रेंज हर डॉट का क्षेत्रफल उसके मान के अनुपात में बनाती है। डोमेन के बाहर के मान रेंज के सिरे ले लेते हैं। |
| `stagger` | `number` | `0` | प्लॉट के appear के साथ, डॉट पंक्ति-दर-पंक्ति एक के बाद एक बढ़ना शुरू करते हैं, उसके इस हिस्से में (0 से 0.95); 0 उन्हें एक साथ बढ़ाता है। |
| `inactiveOpacity` | `number` | कोई नहीं | जब कोई एक डॉट पॉइंटर या कीज़ के नीचे हो तब उसके अन्य डॉट की अपारदर्शिता (opacity): वे hover के साथ फ़ेड इन और आउट होते हैं। |
| `color` | `string \| (d, index) => string` | कोई नहीं | हर डॉट की श्रेणी, उसका रंग प्लॉट के `colorScale` से: जहाँ कुछ और रंग तय न करे वहाँ डॉट का `fill` ([श्रेणी के अनुसार रंग](#colors-by-category))। |
| `hitRadius` | `number` | `8` | डॉट के किनारे से कितनी दूर तक पॉइंटर उसे फिर भी ढूँढ लेता है: इस दूरी के भीतर के डॉट में से पॉइंटर उसे चुनता है जिसका केंद्र उसके सबसे निकट है (Voronoi के सेल), इसलिए बड़े बबल के ऊपर का छोटा बबल अपने केंद्र के आसपास मिलता है। डॉट प्लॉट की पंक्ति, पंक्ति जितनी बड़ी त्रिज्या के साथ, उसके साथ कहीं से भी मिल जाती है। |
| `scale` | `"y" \| "y2"` | `"y"` | वह y स्केल जिसके साथ उसके मान चलते हैं ([Dual axes](#dual-axes)); band y स्केल पर डॉट अपने मान x के साथ रखते हैं। |
| `hoverDotClass`, `hoverDotStyle` | `string`, `StyleProp<ViewStyle>` | प्लॉट के `dotClass`, `dotStyle` | `hoverDot` पार्ट: पॉइंटर के नीचे के डॉट जितना चौड़ा और ऊँचा एक व्यू, उसी पर केंद्रित। `rounded-full outline-2 outline-offset-1` उसे रिंग से घेरता है; `hidden` इस मार्क के लिए कोई नहीं दिखाता। |

डॉट अपने `fill` (`fill-*`; प्लॉट से वैसे ही इनहेरिट होता है जैसे CSS करता है) से भरता है, जहाँ कोई सेट न हो वहाँ `currentColor` से (उसकी श्रेणी का रंग `color` के साथ), और जहाँ सेट हो वहाँ अपने `stroke` (`stroke-*`, `strokeWidth`) से स्ट्रोक करता है: कार्ड के रंग की एक रिंग ओवरलैप होते डॉट को अलग रखती है। डॉट वाले प्लॉट पर, प्लॉट उस डॉट की पंक्ति बताता है जिसका केंद्र पॉइंटर के सबसे निकट है (हर डॉट से `null` दूर होने पर कुछ नहीं), कीज़ पंक्तियों में उनके क्रम में चलती हैं (पंक्तियों को x के अनुसार सॉर्ट करें, तो कीज़ डॉट को बाएँ से दाएँ ले जाती हैं), और `hoverDot` पार्ट डॉट को चिह्नित करता है। प्लॉट के appear के साथ, डॉट शून्य से बढ़ते हैं; `motion.update` के साथ, वे अपने नए मानों और आकारों पर चले जाते हैं, नई पंक्ति का डॉट बढ़कर आता है और हटाई गई पंक्ति का डॉट सिकुड़कर गायब हो जाता है; यह सब प्लैटफ़ॉर्म के animator पर होता है, किसी मार्क को दोबारा बनाए बिना।

## Cell

<!-- demo: el-plot-cells -->

`Cell` हर पंक्ति के लिए एक साथ दो बैंड में एक आयत बनाता है: `band` x स्केल पर उसकी `x` श्रेणी का बैंड और `band` y स्केल पर उसकी `y` श्रेणी का बैंड, इसलिए पंक्तियाँ एक ग्रिड बनाती हैं, यानी हीटमैप। कोरिलेशन मैट्रिक्स, मासिक रिटर्न का कैलेंडर और प्रति घंटे एक सप्ताह के ट्रेड, ये सब cell हैं। हर cell अपने दोनों बैंड को भरता है, इसलिए स्केल के `paddingInner` और `paddingOuter` cell के बीच और उनके चारों ओर की खाली जगह होते हैं। उसका रंग प्लॉट के `colorScale` पर उसका `value` होता है, यानी रंगों की एक रैम्प ([Colors along a ramp](#colors-along-a-ramp)), या ordinal रैम्प के ज़रिए उसकी `color` श्रेणी का रंग। Cell प्लॉट के x और y स्केल पर रहते हैं।

```tsx
import { Cell, Plot, PlotAxis } from "nsh/base/plot";
import { token } from "nsh";

const months = [
  { year: "2025", month: "Jan", ret: 2.7 },
  { year: "2025", month: "Feb", ret: -1.4 },
  { year: "2025", month: "Mar", ret: -5.8 },
  { year: "2026", month: "Jan", ret: 1.9 },
  { year: "2026", month: "Feb", ret: 3.2 },
];

<Plot
  data={months}
  xScale={{ type: "band", domain: ["Jan", "Feb", "Mar"], paddingInner: 0.08 }}
  yScale={{ type: "band", paddingInner: 0.08 }}
  colorScale={{ type: "diverging", range: [token("destructive"), token("muted"), token("chart-1")] }}
  class="ml-10 mt-6 h-24"
>
  <Cell
    x="month"
    y="year"
    value="ret"
    cornerRadii={3}
    inactiveOpacity={0.4}
    label={(d) => d.ret.toFixed(1)}
    labelClass="text-xs tabular-nums text-black/70 data-dark:text-white"
    hoverCellClass="rounded-sm outline-2 outline-offset-1 outline-foreground"
  />
  <PlotAxis placement="top" labelClass="pb-1.5 text-xs text-muted-foreground" />
  <PlotAxis placement="left" labelClass="w-10 pr-2 text-right text-xs text-muted-foreground" />
</Plot>
```

band स्केल का `domain` अपने बैंड की श्रेणियों को क्रम से बताता है, जैसा d3 का `scaleBand().domain()` करता है: कैलेंडर के महीने जनवरी से दिसंबर तक, हर एक अपने बैंड के साथ, चाहे उसकी पंक्तियाँ आई हों या नहीं, इसलिए ऊपर मार्च 2026 ग्रिड में एक खाली जगह है। डोमेन के बिना, बैंड वे श्रेणियाँ होते हैं जिन्हें cell अक्ष पर बताते हैं, उसी क्रम में जिसमें पंक्तियाँ उन्हें लाती हैं (ऊपर 2025 के बाद 2026)। श्रेणियों के band स्केल पर `PlotAxis` हर बैंड की श्रेणी लिखता है, `format` के बिना।

कोरिलेशन मैट्रिक्स दोनों अक्षों पर वही होल्डिंग्स बताता है, उसका `domain` गुणांकों की पूरी रेंज होता है, इसलिए 0 का गुणांक, होल्डिंग्स चाहे जो हों, रैम्प का मध्य लेता है:

```tsx
const tickers = ["NVDA", "AMD", "MSFT", "GLD"];

<Plot
  data={pairs}
  xScale={{ type: "band", domain: tickers, paddingInner: 0.06 }}
  yScale={{ type: "band", domain: tickers, paddingInner: 0.06 }}
  colorScale={{ type: "diverging", domain: [-1, 1], range: [token("chart-2"), token("muted"), token("chart-1")] }}
  class="aspect-square"
>
  <Cell x="b" y="a" value="r" label={(d) => d.r.toFixed(2)} labelClass="text-xs text-black/70 data-dark:text-white" />
</Plot>
```

| Prop | Type | Default | Description |
|---|---|---|---|
| `x` | `string \| (d, index) => string` | कोई नहीं | हर पंक्ति का कॉलम: एक फ़ील्ड (उसका टेक्स्ट, या उसकी संख्या) या श्रेणी लौटाने वाला फ़ंक्शन। पंक्ति का cell x स्केल के उस श्रेणी के बैंड में जाता है; जिस पंक्ति में यह नहीं है, उसका कोई cell नहीं बनता। |
| `y` | `string \| (d, index) => string` | कोई नहीं | हर पंक्ति की लाइन, y स्केल के साथ `x` के रूप में। |
| `value` | `string \| (d, index) => number` | कोई नहीं | हर cell की संख्या, जिसे `sequential` या `diverging` `colorScale` उसका रंग बनाता है। जिस पंक्ति में यह नहीं है, वह स्केल का `unknown` रंग लेती है, और वह भी न हो तो उसका कोई cell नहीं बनता। |
| `color` | `string \| (d, index) => string` | कोई नहीं | हर cell की श्रेणी, उसका रंग एक `ordinal` `colorScale` से ([Colors by category](#colors-by-category))। |
| `cornerRadii` | `number \| { topLeft?, topRight?, bottomRight?, bottomLeft? }` | `0` | उसके cell के हर कोने की त्रिज्या। |
| `stagger` | `number` | `0` | प्लॉट के appear के साथ, cell पंक्ति-दर-पंक्ति एक के बाद एक बढ़ना शुरू करते हैं, उसके इस हिस्से में (0 से 0.95), हर एक बाकी समय अपने मध्य से; 0 उन्हें एक साथ बढ़ाता है। |
| `inactiveOpacity` | `number` | कोई नहीं | जब कोई एक cell पॉइंटर या कीज़ के नीचे हो तब उसके अन्य cell और उनके लेबल की अपारदर्शिता (opacity): वे hover के साथ फ़ेड इन और आउट होते हैं। |
| `label` | `string \| (d, index) => string` | कोई नहीं | `label` पार्ट: हर cell के बीच में एक टेक्स्ट, एक फ़ील्ड (उसका टेक्स्ट, या उसकी संख्या) या ऐप द्वारा फ़ॉर्मैट किया गया टेक्स्ट लौटाने वाला फ़ंक्शन। हर लेबल वहाँ दिखता है जहाँ उसका लेआउट किया गया आकार उसके cell के भीतर आ जाए, इसलिए संकरा प्लॉट केवल रंग दिखाता है। |
| `labelClass`, `labelStyle` | `string`, `StyleProp<TextStyle>` | कोई नहीं | लेबल का फ़ॉन्ट, आकार और रंग। जिस cell का `colorScale` रंग गहरा है उस पर लेबल में attribute `data-dark` होता है (जहाँ हल्का टेक्स्ट बेहतर पढ़ा जाता है), इसलिए `data-dark:text-white` उसे वहाँ हल्का लिखता है। |
| `hoverCellClass`, `hoverCellStyle` | `string`, `StyleProp<ViewStyle>` | कोई नहीं | `hoverCell` पार्ट: पॉइंटर या कीज़ के नीचे के cell जितना बड़ा एक व्यू, उसके ऊपर; `rounded-sm outline-2 outline-foreground` उसे रिंग से घेरता है। वह पॉइंटर के साथ उसी फ़्रेम में चलता है और कीज़ उसे हिलाएँ तो `pointer` spring पर सरकता है। |

Cell अपने रंग से भरता है, प्लॉट के `colorScale` का, जहाँ ऐप कोई `fill` सेट नहीं करता (`fill-*` क्लास और स्टाइल पहले आते हैं, प्लॉट से वैसे ही इनहेरिट होते हैं जैसे CSS करता है), जहाँ कुछ और रंग तय न करे वहाँ `currentColor` से, और जहाँ सेट हो वहाँ अपने `stroke` से स्ट्रोक करता है। cell वाले प्लॉट पर, प्लॉट पॉइंटर के नीचे के cell की पंक्ति बताता है, और दो cell के बीच की खाली जगह पर उसकी जो निकटतम हो; ऐरो कीज़ स्क्रीन पर ग्रिड के आर-पार चलती हैं ([Keyboard](#keyboard)), और स्क्र린 रीडर पंक्तियों में उनके क्रम में। प्लॉट के appear के साथ, cell अपने मध्य से बढ़ते हैं; `motion.update` के साथ, cell का रंग उसके नए रंग तक सरकता है, नई पंक्ति का cell बढ़कर आता है, हटाई गई पंक्ति का cell सिकुड़कर गायब हो जाता है, और cell अपने नए बैंड में चले जाते हैं; यह सब प्लैटफ़ॉर्म के animator पर होता है, किसी मार्क को दोबारा बनाए बिना।
<a id="pie-and-arc"></a>

## Pie और Arc

`Pie` एक पूरे चक्कर को हर रो के लिए एक स्लाइस में बाँटता है। हर स्लाइस रोज़ के मानों में अपने हिस्से के अनुपात में होती है, और स्लाइसें रोज़ के क्रम में प्लॉट के केंद्र के चारों ओर 12 बजे की स्थिति से दक्षिणावर्त चलती हैं। `innerRadius` इसे donut बना देता है। हर स्लाइस अपने आप में एक canvas है, यानी `slice` पार्ट, इसलिए हर स्लाइस अपनी classes से पेंट होती है: `sliceClass` या तो हर स्लाइस पर वही classes होती हैं, या स्लाइस की रो का एक फ़ंक्शन होता है जो हर स्लाइस को अपनी classes देता है। Pie के ऊपर प्लॉट पॉइंटर के नीचे की स्लाइस की रो रिपोर्ट करता है (hole में या रिंग के बाहर कोई नहीं), उसका टूलटिप पॉइंटर के साथ चलता है, और वह स्लाइस `hoverLift` से बढ़ती है जबकि बाकी स्लाइसें `hoverDim` से फीकी पड़ जाती हैं। यह सब प्लेटफ़ॉर्म के animator पर प्लॉट के `motion` के साथ चलता है। `Arc` दो कोणों के बीच एक सेक्टर बनाता है: किसी gauge का ट्रैक और उसका मान, या pie के पीछे की एक रिंग।

<!-- demo: el-plot-pie -->

```tsx
import { signal, Text, View } from "nsh";
import { Pie, Plot } from "nsh/base/plot";

type Plan = { name: string; seats: number };

const FILLS = ["fill-chart-1", "fill-chart-2", "fill-chart-3", "fill-chart-4"];
const KEYS = ["bg-chart-1", "bg-chart-2", "bg-chart-3", "bg-chart-4"];

export function Seats(props: { plans: Plan[] }) {
  const hovered = signal<number | null>(null);
  const total = () => props.plans.reduce((sum, p) => sum + p.seats, 0);
  const shown = () => (hovered() == null ? undefined : props.plans[hovered()!]);
  const share = (n: number) => `${((n / total()) * 100).toFixed(1)}%`;
  return (
    <View class="flex-row items-center gap-6 rounded-xl border border-border bg-card p-4">
      <Plot
        data={props.plans}
        accessibilityLabel={`Seats by plan, ${total()} in all`}
        accessibilityValue={{ text: shown() && `${shown()!.name}, ${shown()!.seats} seats, ${share(shown()!.seats)}` }}
        appearGeneration={1}
        motion={{ appear: { duration: 900, easing: "easeOut" }, enter: { duration: 120 }, exit: { duration: 160 }, pointer: { stiffness: 400, damping: 32 } }}
        onHoverChange={({ index }) => hovered.set(index)}
        class="size-44"
      >
        {/* A donut with 2-point gaps (0.025 of a turn at its 80-point rim). */}
        <Pie
          value="seats"
          innerRadius="62%"
          padAngle={0.025}
          sliceClass={(_, i) => FILLS[i % FILLS.length]}
          hoverLift={6}
          hoverDim={0.64}
        />
        {/* The hovered plan, or the total, in the hole. */}
        <View class="absolute inset-0 items-center justify-center gap-1">
          <Text class="text-xs text-muted-foreground">{shown()?.name ?? "Total"}</Text>
          <Text class="text-2xl font-semibold tabular-nums text-foreground">{shown()?.seats ?? total()}</Text>
        </View>
      </Plot>
      {/* The legend: a key in each slice's color, the value and the share at the end. */}
      <View class="flex-1 gap-1">
        {props.plans.map((plan, i) => (
          <View class="flex-row items-center gap-3 rounded-md px-2 py-1.5" style={{ opacity: hovered() == null || hovered() === i ? 1 : 0.45 }}>
            <View class={`size-2 rounded-sm ${KEYS[i % KEYS.length]}`} />
            <Text class="flex-1 text-sm text-foreground">{plan.name}</Text>
            <Text class="text-right text-sm tabular-nums text-foreground">{plan.seats}</Text>
            <Text class="w-14 text-right text-sm tabular-nums text-muted-foreground">{share(plan.seats)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
```

```rust
use nsh_base::plot::{SliceClass, pie, plot};
use nsh_core::{element::{RowAccessor, Rows}, prelude::*};

fn seats(seats: Vec<f64>) -> impl IntoElement {
    let rows = Rows::from_columns(seats.len(), [("seats".into(), seats)]);
    plot()
        .data(rows)
        .accessibility_label("Seats by plan")
        .w(px(176.0))
        .h(px(176.0))
        .child(
            pie()
                .value(RowAccessor::key("seats"))
                .inner_radius(relative(0.62))
                .slice_class(SliceClass::from_fn(|i| format!("fill-chart-{}", i % 4 + 1).into())),
        )
}
```

| Mark | Prop | Rust | प्रकार | डिफ़ॉल्ट | विवरण |
|---|---|---|---|---|---|
| `Pie` | `value` | `.value(..)` | `keyof T \| (d: T, index: number) => number` | प्लॉट का `y` | हर रो का मान क्या है। जिस रो का मान शून्य, उससे कम, या कोई संख्या ही न हो, उसकी कोई स्लाइस नहीं होती। |
| `Pie`, `Arc` | `startAngle`, `endAngle` | `.start_angle(..)`, `.end_angle(..)` | `number` (रेडियन) | `0`, `2 * Math.PI` | जहाँ पहली स्लाइस शुरू होती है और आख़िरी खत्म होती है (arc के सिरे): 12 बजे की स्थिति से दक्षिणावर्त रेडियन में। `startAngle` से नीचे का `endAngle` pie की स्लाइसों को उल्टी दिशा में बिछाता है। |
| `Pie` | `padAngle` | `.pad_angle(..)` | `number` (रेडियन) | `0` | रिम पर पड़ोसी स्लाइसों के बीच का कोण। हर gap हर त्रिज्या पर वही चौड़ाई (लगभग `padAngle * outerRadius` पॉइंट) रखता है और उसके किनारे समानांतर रहते हैं, इसलिए वह केंद्र या hole पर उतना ही चौड़ा होता है जितना रिम पर; जो स्लाइस केंद्र तक पहुँचने के लिए बहुत संकरी हो, वह वहाँ खत्म होती है जहाँ उसके किनारे मिलते हैं। एक स्लाइस वाले pie में कोई gap नहीं होता। |
| `Pie`, `Arc` | `innerRadius`, `outerRadius` | `.inner_radius(..)`, `.outer_radius(..)` | ``number \| `${number}%` `` | `0`, `"100%"` | hole और रिम की त्रिज्याएँ: पॉइंट में, या प्लॉट में समाने वाले सबसे बड़े वृत्त (उसकी छोटी भुजा का आधा) के प्रतिशत में। |
| `Pie`, `Arc` | `cornerRadius` | `.corner_radius(..)` | `number` | `0` | हर स्लाइस (या arc) के कोनों की त्रिज्या, पॉइंट में, d3 के `arc.cornerRadius` की तरह: हर कोना एक वृत्त है जो किनारे को और रिम या hole को छूता है, जिसमें gaps के समानांतर किनारे भी शामिल हैं। यह अधिकतम रिंग की मोटाई का आधा हो सकती है, जो arc को गोल सिरे देती है, और जिस स्लाइस में दो पूरे कोनों के लिए जगह न हो उस पर वे उसके बीच में मिल जाते हैं। पूरी रिंग केवल अपने गोल किनारे रखती है। |
| `Pie` | `sliceClass` | `.slice_class(..)` | `string \| (d: T, index: number) => string` | none | हर स्लाइस की classes (`fill-*`, `stroke-*`): हर स्लाइस पर वही, या स्लाइस की रो और उसके index का फ़ंक्शन, जो हर रो के लिए एक बार तब कॉल होता है जब rows या फ़ंक्शन बदलते हैं। |
| `Pie` | `sliceStyle` | `.slice_style(..)` | `StyleProp<ViewStyle>` | none | हर स्लाइस की स्टाइल, उसकी classes के ऊपर (`fill`, `stroke`, `strokeWidth`)। |
| `Pie` | `hoverLift` | `.hover_lift(..)` | `number` | `0` | पॉइंटर के नीचे की स्लाइस बाकी से कितनी आगे बढ़ती है, पॉइंट में: प्लॉट के `pointer` spring पर, hover के साथ फीकी होकर आती-जाती हुई। |
| `Pie` | `hoverDim` | `.hover_dim(..)` | `number` (0 से 1) | `0` | जब एक स्लाइस पॉइंटर के नीचे हो तब बाकी स्लाइसें कितनी फीकी पड़ती हैं, उनकी opacity के हिस्से के रूप में, hover के fade के साथ। |
| `Pie` | `color` | `.color(..)` | `keyof T \| (d: T, index: number) => string` | none | हर स्लाइस की श्रेणी, यानी प्लॉट के `colorScale` से उसका रंग: जहाँ कुछ और रंग तय न करे वहाँ स्लाइस का `fill` ([श्रेणी के अनुसार रंग](#colors-by-category))। |
| `Pie` | `label` | `.label(..)` | `string \| (d: T, index: number) => string` | none | हर स्लाइस के पास का टेक्स्ट: एक फ़ील्ड (उसकी संख्या) या ऐसा फ़ंक्शन जो वह टेक्स्ट लौटाए जिसे ऐप फ़ॉर्मैट करता है। जिस रो का टेक्स्ट खाली हो, या जो स्लाइस आधे डिग्री से संकरी हो, उसका कोई टेक्स्ट नहीं होता। |
| `Pie` | `labelClass`, `labelStyle` | `.label_class(..)`, `.label_style(..)` | `string`, `StyleProp<TextStyle>` | none | `label` पार्ट: रिंग के बाहर, leader line के सिरे पर एक टेक्स्ट, जो उस पर केंद्रित होता है, pie के दाएँ आधे भाग में उसके बाद और बाएँ आधे भाग में उसके पहले। इसकी padding लाइन के सिरे से इसकी दूरी है। |
| `Pie` | `labelGap` | `.label_gap(..)` | `number` | `15` | labels रिम से कितनी दूर बैठते हैं, पॉइंट में। |
| `Pie` | `labelLineClass`, `labelLineStyle` | `.label_line_class(..)`, `.label_line_style(..)` | `string \| (d: T, index: number) => string`, `StyleProp<ViewStyle>` | none | `labelLine` पार्ट: हर label की leader line, स्लाइस के बीच में रिम से label की त्रिज्या तक, फिर टेक्स्ट तक आड़ी। इसका `stroke` (जहाँ कोई सेट न हो वहाँ `currentColor`), `strokeWidth` और `strokeDasharray`, हर लाइन पर वही या स्लाइस की रो का फ़ंक्शन; स्टाइल किए जाने पर ही दिखती है। |

स्लाइस और arc `fill` से भरे जाते हैं (जहाँ कोई सेट न हो वहाँ `currentColor`, और स्लाइस की श्रेणी के रंग के साथ `color`) और अपने किनारों पर `stroke` से stroke करते हैं (जहाँ कोई सेट न हो वहाँ कोई नहीं)। उनका अपना मान pie और प्लॉट के मान के ऊपर रहता है, जैसे CSS उन्हें inherit करती है: सतह के रंग (`stroke-card stroke-2`) का stroke स्लाइसों के बीच भी gaps काट देता है। उनके मान प्लॉट के scales में कोई भाग नहीं लेते। Pie की स्लाइसें तभी दोबारा बनती हैं जब rows, उनके मान, कोण, त्रिज्याएँ या प्लॉट का आकार बदलता है; पॉइंटर lift और fade को animator पर चलाता है।

जिन प्लॉट में pie होता है वे आमतौर पर टूलटिप को पॉइंटर के पास रखते हैं (`tooltipPlacement="pointer"`), क्योंकि pie की rows की किसी axis पर कोई जगह नहीं होती: उसके ऊपर cross line और टूलटिप पॉइंटर के साथ चलते हैं, और कोई hover dots नहीं दिखते। Donut का केंद्र ऐप का अपना element होता है जो प्लॉट के ऊपर बिछाया जाता है (hover की गई स्लाइस का मान, या कुल), और उसकी legend भी ऐसी ही होती है, जिसमें हर key अपनी स्लाइस के रंग में होती है।

Pie के labels उसकी स्लाइसों को रिंग के बाहर नाम देते हैं: हर टेक्स्ट अपनी स्लाइस के बीच की ओर रिम से `labelGap` आगे बैठता है (उस त्रिज्या पर स्लाइस का centroid), फिर pie के उसी तरफ़ की उस त्रिज्या तक आड़ा जाता है जहाँ स्लाइस है, और एक स्टाइल की गई leader line उसे रिम से जोड़ती है। labels प्लॉट के appear पर अपनी स्लाइसों के साथ sweep होते हैं और उसके अंत पर fade in होते हैं, `motion.update` पर उनके साथ चलते हैं, और hover की गई स्लाइस के साथ ऊपर उठते हैं; यह सब प्लेटफ़ॉर्म के animator पर चलता है। प्लॉट को उनके लिए जगह दें: `"100%"` से नीचे का `outerRadius`, या प्लॉट के चारों ओर space। किसी स्लाइस पर ऐप की अपनी सामग्री प्लॉट के ऊपर बिछाया गया एक element होती है, जैसे donut का केंद्र।

```tsx
<Pie
  value="seats"
  outerRadius="64%"
  sliceClass={(_, i) => FILLS[i % FILLS.length]}
  label={(d) => share(d.seats)}
  labelGap={12}
  labelClass="px-1 text-xs tabular-nums text-muted-foreground"
  labelLineClass="stroke-border"
/>
```

<a id="colors-by-category"></a>

## श्रेणी के अनुसार रंग

प्लॉट का `colorScale` श्रेणियों को उनके रंग देता है, जैसे d3 का `scaleOrdinal` देता है, और mark का `color` हर रो की श्रेणी का नाम बताता है: एक फ़ील्ड (उसका टेक्स्ट, या उसकी संख्या) या रो का एक फ़ंक्शन। `domain` की श्रेणियाँ `range` के रंग क्रम से लेती हैं, और domain लंबा होने पर range अपने पहले रंग से फिर शुरू होती है। domain के बाहर की श्रेणी `unknown` लेती है; यदि वह न हो, तो वह तब domain में जुड़ती है जब कोई mark पहली बार उससे मिलता है (marks क्रम में, हर एक की rows क्रम में) और अगला रंग लेती है, इसलिए `domain` के बिना श्रेणियाँ उसी क्रम में रंग लेती हैं जिस क्रम में rows उन्हें लाती हैं। रंग ऐप के अपने होते हैं: CSS रंग, जिनमें theme के tokens भी शामिल हैं।

```tsx
import { Pie, Plot } from "nsh/base/plot";
import { token } from "nsh";

const regions = [
  { name: "North America", revenue: 482 },
  { name: "EMEA", revenue: 312 },
  { name: "APAC", revenue: 268 },
];

<Plot data={regions} colorScale={{ type: "ordinal", range: [token("chart-1"), token("chart-2"), token("chart-3")] }} class="size-44">
  <Pie value="revenue" color="name" innerRadius="62%" />
</Plot>
```

स्लाइस, bar और dot अपनी रो का रंग लेते हैं; `Line` और `Area` में से हर एक एक series है और अपनी पहली रो का रंग लेता है, इसलिए अपनी rows वाली लाइन (`data`) अपनी rows के रंग में होती है, और एक scale किसी श्रेणी का रंग pie, bars और lines में एक जैसा रखता है। जहाँ कुछ और रंग तय न करे वहाँ रंग mark का `fill` (लाइन का `stroke`) होता है, `currentColor` की जगह: ऐप की classes और styles पहले आती हैं, फिर पार्ट की (`sliceClass`, `sliceStyle`), mark की और वे जो वह प्लॉट से inherit करता है, इसलिए `sliceClass={(d) => (d.name === "Other" ? "fill-muted" : "")}` एक स्लाइस को अलग रंग देता है जबकि scale बाकी को रंगता है। `background` पार्ट के साथ, bar और area का `fill` `none` रहता है।

| `OrdinalScale` | प्रकार | डिफ़ॉल्ट | विवरण |
|---|---|---|---|
| `type` | `"ordinal"` | (आवश्यक) | scale का प्रकार। |
| `domain` | `string[]` | none | श्रेणियाँ, क्रम में। दो बार लिखी गई श्रेणी अपनी पहली जगह रखती है। |
| `range` | `string[]` | (आवश्यक) | रंग, क्रम में (CSS रंग); श्रेणी `i` रंग `i % range.length` लेती है। |
| `unknown` | `string` | none | domain के बाहर की हर श्रेणी का रंग; इसके बिना, हर श्रेणी अगला रंग लेती है। |

<a id="colors-along-a-ramp"></a>

### रैंप के साथ रंग

`type: "sequential"` या `"diverging"` का `colorScale` संख्याओं को रैंप के साथ उनके रंग देता है, जैसे d3 के `scaleSequential` और `scaleDiverging` देते हैं, किसी [`Cell`](#cell) के `value` के लिए। इसका `range` दो या अधिक रंग होते हैं जो रैंप के निचले सिरे से ऊपरी सिरे तक समान रूप से फैले होते हैं और उनके बीच OKLab में मिलाए जाते हैं: चरण आँख को समान दिखते हैं, और दो hues अपने ही मिश्रण से होकर मिलती हैं। `domain` के पार का मान रैंप का सिरा लेता है, और बिना मान वाली रो `unknown` लेती है।

`sequential` अपने `domain` को पूरे रैंप पर फैलाता है, और domain cells के मानों का विस्तार होता है जब तक ऐप कोई नाम न दे: counts, volumes, activity। `diverging` अपना `pivot` (डिफ़ॉल्ट 0) रैंप के बीच के रंग पर रखता है, उससे नीचे के मान पहले आधे में और ऊपर के मान दूसरे आधे में: घाटे एक hue में, लाभ दूसरी में, और सपाट महीना तटस्थ बीच में। जब तक ऐप कोई domain न दे, वह मानों का विस्तार होता है जिसे pivot के दोनों ओर बराबर किया जाता है (Observable Plot का `symmetric`), इसलिए बराबर आकार का घाटा और लाभ बराबर तीव्र होते हैं; correlation matrix `domain: [-1, 1]` का नाम देता है।

```tsx
colorScale={{ type: "sequential", range: [token("muted"), token("chart-1")] }}
colorScale={{ type: "diverging", pivot: 0, range: [token("destructive"), token("muted"), token("chart-1")] }}
```

| `SequentialScale`, `DivergingScale` | प्रकार | डिफ़ॉल्ट | विवरण |
|---|---|---|---|
| `type` | `"sequential" \| "diverging"` | (आवश्यक) | रैंप का प्रकार। |
| `domain` | `[number, number]` | मानों का विस्तार (`diverging` के लिए pivot के आसपास बराबर किया गया) | रैंप के दोनों सिरों के मान। |
| `pivot` | `number` | `0` | केवल `diverging`: रैंप के बीच के रंग का मान। |
| `range` | `string[]` | (आवश्यक) | रैंप के साथ रंग, निचले सिरे से ऊपरी सिरे तक (CSS रंग), उनके बीच OKLab में मिलाए गए। |
| `unknown` | `string` | none | बिना मान वाली रो का रंग; इसके बिना, उस रो का कोई cell नहीं होता। |
<a id="radialline-and-radialgrid"></a>

## RadialLine और RadialGrid

`RadialLine` प्लॉट के केंद्र के चारों ओर एक सीरीज़ खींचता है: radar का पॉलीगॉन, या किसी डायल के गिर्द एक रेखा। मान वाली हर रो अपने कोण पर एक बिंदु होती है, जो केंद्र से उतनी दूर होती है जितनी दूर प्लॉट का y स्केल उसके मान को रखता है, `innerRadius` (डोमेन का सबसे छोटा मान) से `outerRadius` (उसका सबसे बड़ा मान) तक। `angle` के बिना, रोज़ 12 बजे की दिशा से घड़ी की दिशा में, क्रम से पूरे चक्कर में समान रूप से बँटती हैं, इसलिए छह रोज़ एक षट्भुज बनाती हैं; `closed` आख़िरी बिंदु को पहले बिंदु से जोड़ देता है। रेखा अपने बिंदुओं पर स्ट्रोक करती है और अपने क्षेत्र को `innerRadius` (डिफ़ॉल्ट रूप से केंद्र) तक भरती है, इसलिए एक ही मार्क radar की रूपरेखा भी है और उसका wash भी। `RadialGrid` उसके पीछे radar की ग्रिड खींचता है: y स्केल के मानों पर `rings`, रोज़ के कोणों से गुज़रते पॉलीगॉन या `circular`, और हर रो तक जाने वाली `spokes`। रेडियल लाइन के ऊपर, प्लॉट उस रो की रिपोर्ट करता है जिसका कोण लाइन की बाहरी त्रिज्या के भीतर पॉइंटर के कोण के सबसे निकट है, और हर लाइन का hover डॉट उस रो के अपने बिंदु पर रहता है।

```tsx
import { signal, Text, View } from "nsh";
import { Plot, RadialGrid, RadialLine } from "nsh/base/plot";

type Metric = { name: string; ours: number; theirs: number };

export function Compare(props: { metrics: Metric[] }) {
  const hovered = signal<number | null>(null);
  const shown = () => (hovered() == null ? undefined : props.metrics[hovered()!]);
  return (
    <View class="items-center gap-3 rounded-xl border border-border bg-card p-4">
      <Text class="text-sm tabular-nums text-muted-foreground">
        {shown() ? `${shown()!.name}: ${shown()!.ours} against ${shown()!.theirs}` : "Ours against theirs"}
      </Text>
      <Plot
        data={props.metrics}
        yScale={{ type: "linear", domain: [0, 100] }}
        accessibilityLabel="Ours against theirs on six metrics"
        accessibilityValue={{ text: shown() && `${shown()!.name}: ours ${shown()!.ours}, theirs ${shown()!.theirs}` }}
        appearGeneration={1}
        motion={{ appear: { duration: 700, easing: "easeOut" }, update: { duration: 400, easing: "easeInOut" }, enter: { duration: 120 }, exit: { duration: 160 }, pointer: { stiffness: 380, damping: 34 } }}
        onHoverChange={({ index }) => hovered.set(index)}
        class="size-56"
      >
        <RadialGrid rings={[25, 50, 75, 100]} spokes outerRadius="80%" class="stroke-border" />
        <RadialLine radius="theirs" closed outerRadius="80%" class="fill-chart-2/15 stroke-chart-2" hoverDotClass="size-2 rounded-full border-2 border-card bg-chart-2" />
        <RadialLine radius="ours" closed outerRadius="80%" class="fill-chart-1/25 stroke-chart-1 stroke-2" hoverDotClass="size-2.5 rounded-full border-2 border-card bg-chart-1" />
        {/* Each metric's name past the rim at its row's angle, growing away from the center. */}
        {props.metrics.map((m, i) => {
          const angle = (2 * Math.PI * i) / props.metrics.length;
          const away = (v: number) => (v > 0.01 ? "flex-start" : v < -0.01 ? "flex-end" : "center");
          const align = (v: number) => (v > 0.01 ? "left" : v < -0.01 ? "right" : "center");
          return (
            <View
              class="absolute size-0"
              style={{
                left: `${50 + 44 * Math.sin(angle)}%`,
                top: `${50 - 44 * Math.cos(angle)}%`,
                alignItems: away(Math.sin(angle)),
                justifyContent: away(-Math.cos(angle)),
                pointerEvents: "none",
              }}
            >
              <Text class="w-24 text-xs text-muted-foreground" style={{ textAlign: align(Math.sin(angle)) }}>{m.name}</Text>
            </View>
          );
        })}
      </Plot>
    </View>
  );
}
```

| Mark | Prop | Rust | Type | Default | Description |
|---|---|---|---|---|---|
| `RadialLine` | `radius` | `.radius(..)` | `keyof T \| (d: T, index: number) => number` | प्लॉट का `y` | हर रो को केंद्र से कितनी दूर रखना है: y स्केल का एक मान, जहाँ `innerRadius` डोमेन के सबसे छोटे मान पर और `outerRadius` सबसे बड़े मान पर होता है। जिस रो में मान नहीं है, उसे छोड़ दिया जाता है। |
| `RadialLine` | `angle` | `.angle(..)` | `keyof T \| (d: T, index: number) => number` | रोज़ पूरे चक्कर में समान रूप से | हर रो केंद्र के चारों ओर कहाँ जाती है: 12 बजे की दिशा से घड़ी की दिशा में रेडियन में। |
| `RadialLine`, `RadialGrid` | `startAngle`, `endAngle` | `.start_angle(..)`, `.end_angle(..)` | `number` (रेडियन) | `0`, `2 * Math.PI` | `angle` के बिना रोज़ कहाँ जाती हैं: `startAngle` से, समान दूरी पर। पूरे चक्कर में वे चक्कर के `1 / rows` के एक चरण की दूरी पर होती हैं, और आख़िरी रो पहली से एक चरण पहले होती है; चक्कर के एक हिस्से में पहली रो `startAngle` पर और आख़िरी `endAngle` पर होती है। |
| `RadialLine`, `RadialGrid` | `innerRadius`, `outerRadius` | `.inner_radius(..)`, `.outer_radius(..)` | ``number \| `${number}%` `` | `0`, `"100%"` | y डोमेन के सबसे छोटे और सबसे बड़े मान कहाँ जाते हैं: पॉइंट्स में, या प्लॉट में समाने वाले सबसे बड़े वृत्त (उसकी छोटी भुजा का आधा) के प्रतिशत के रूप में, जैसे pie की त्रिज्याएँ। लाइन का क्षेत्र `innerRadius` तक भरता है; ग्रिड की spokes इन दोनों के बीच चलती हैं। |
| `RadialLine` | `curve` | `.curve(..)` | `"linear" \| "natural" \| "stepAfter"` | `"linear"` | यह अपने बिंदुओं को कैसे जोड़ती है: सीधे खंडों से, एक चिकने वक्र से (बंद होने पर चिकने लूप से), या सीढ़ियों से। |
| `RadialLine` | `closed` | `.closed(..)` | `boolean` | `false` | यह अपने आख़िरी बिंदु से आगे बढ़कर पहले बिंदु तक लौटती है: radar का पॉलीगॉन। खुली होने पर उसका क्षेत्र केंद्र तक (या अपने भीतरी किनारे के साथ) बंद होता है। |
| `RadialLine` | `dot`, `dotClass`, `dotStyle` | `.dot(..)`, `.dot_class(..)`, `.dot_style(..)` | `boolean`, `string`, `StyleProp<ViewStyle>` | `false` | हर बिंदु पर एक डॉट: उसी पर केंद्रित एक view, जिसका आकार, बैकग्राउंड और बॉर्डर ऐप के होते हैं। डॉट्स लाइन के साथ बाहर की ओर बढ़ते और चलते हैं। |
| `RadialLine` | `backgroundClass`, `backgroundStyle` | `.background_class(..)`, `.background_style(..)` | `string`, `StyleProp<ViewStyle>` | none | इसका बैकग्राउंड: इसके बाहरी वृत्त के चारों ओर एक बॉक्स, जिसका बैकग्राउंड (`bg-*`, एक ग्रेडिएंट) केवल इसके क्षेत्र के भीतर, इसके `fill` के नीचे, किसी एरिया की तरह दिखता है। |
| `RadialLine` | `hoverDotClass`, `hoverDotStyle` | `.hover_dot_class(..)`, `.hover_dot_style(..)` | `string`, `StyleProp<ViewStyle>` | प्लॉट का `dotClass`, `dotStyle` | इसका hover डॉट, पॉइंटर के नीचे वाली रो के अपने बिंदु पर, जिसमें पॉइंटर उसी फ़्रेम में होता है और कीज़ के आगे बढ़ने पर प्लॉट के `pointer` स्प्रिंग पर अगली रो की ओर सरकता है; `hidden` कोई डॉट नहीं दिखाता। |
| `RadialGrid` | `rings` | `.rings(..)` | `number[]` | none | इसके रिंग कहाँ जाते हैं, y स्केल के मानों के रूप में: हर रिंग उतनी दूर जितनी दूर रेडियल लाइन उस मान को रखती है। |
| `RadialGrid` | `spokes` | `.spokes(..)` | `boolean` | `false` | हर रो के कोण पर `innerRadius` से `outerRadius` तक एक रेखा। |
| `RadialGrid` | `circular` | `.circular(..)` | `boolean` | `false` | इसके रिंग वृत्त होते हैं (चक्कर के एक हिस्से में चाप)। डिफ़ॉल्ट रूप से वे रोज़ के कोणों से गुज़रते पॉलीगॉन होते हैं, और जब प्लॉट में तीन से कम रोज़ हों तो वृत्त। |

रेडियल लाइन `stroke`, `strokeWidth` और `strokeDasharray` (`currentColor`, जहाँ कुछ सेट न हो वहाँ 1 चौड़ी और ठोस) से स्ट्रोक करती है और अपने क्षेत्र को `fill` (जहाँ कुछ सेट न हो वहाँ none) से भरती है; रेडियल ग्रिड वैसे ही स्ट्रोक करती है जैसे ग्रिड करती है। इनका paint प्लॉट से इनहेरिट होता है। जब प्लॉट में डोमेन न हो, तब लाइन के मान, 0 के साथ मिलकर, y स्केल का डोमेन बनाते हैं, इसलिए धनात्मक मानों वाला radar अपने केंद्र से बढ़ता है; ग्रिड के रिंग ऐसा नहीं करते। मान बदलने पर भी रिंग और radar का स्केल स्थिर रखने के लिए प्लॉट को y `domain` दें।

radar के आसपास के लेबल ऐप के वे एलिमेंट हैं जो प्लॉट के ऊपर बिछाए जाते हैं, जैसे donut का केंद्र। `angle` के बिना, `n` में से रो `i` 12 बजे की दिशा से `a = 2π·i / n` पर होती है, इसलिए वर्गाकार प्लॉट में `left: 50% + r·sin(a)`, `top: 50% − r·cos(a)` (`r` प्लॉट की भुजा का प्रतिशत, जो बाहरी त्रिज्या के हिस्से के आधे से थोड़ा अधिक है) पर बिना आकार वाला बॉक्स किनारे के पार की जगह को चिह्नित करता है, और नाम उससे केंद्र से दूर की ओर बढ़ता है: दाईं आधी तरफ़ उसके दाएँ, बाईं आधी तरफ़ उसके बाएँ, शीर्ष पर उसके ऊपर और तल पर उसके नीचे, जैसा ऊपर है।

```rust
use nsh_base::plot::{plot, radial_grid, radial_line};
use nsh_core::{element::{RowAccessor, Rows}, prelude::*};

fn compare(ours: Vec<f64>, theirs: Vec<f64>) -> impl IntoElement {
    let rows = Rows::from_columns(ours.len(), [("ours".into(), ours), ("theirs".into(), theirs)]);
    plot()
        .data(rows)
        .accessibility_label("Ours against theirs")
        .w(px(224.0))
        .h(px(224.0))
        .child(radial_grid().rings(vec![25.0, 50.0, 75.0, 100.0]).spokes(true))
        .child(radial_line().radius(RowAccessor::key("theirs")).closed(true))
        .child(radial_line().radius(RowAccessor::key("ours")).closed(true))
}
```

## Sankey

`Sankey` प्लॉट की रोज़ के बीच प्रवाह (flows) खींचता है: हर रो एक नोड है और `links` उनके बीच के प्रवाहों को नाम देता है, `{ source, target, value }` with the indices of two rows in the plot's `data`। यह उन्हें प्लॉट के आकार में d3-sankey की तरह लेआउट करता है: नोड कॉलम में रखे जाते हैं (`nodeAlign`), हर नोड उतना ऊँचा होता है जितना उसमें आने या उससे जाने वाला सबसे अधिक प्रवाह है, एक कॉलम के नोड `nodePadding` की दूरी पर होते हैं, और `iterations` पास में अपने प्रवाहों की ओर ढीले किए जाते हैं; और हर लिंक के लिए एक रिबन होता है, उसके स्रोत के दाएँ किनारे से उसके लक्ष्य के बाएँ किनारे तक, जो हर सिरे पर उस नोड की उस तरफ़ में अपने हिस्से जितना चौड़ा होता है, इसलिए हर नोड की दोनों तरफ़ें ढकी रहती हैं, भले ही उसके अंदर और बाहर के प्रवाह अलग हों। हर कॉलम प्लॉट में केंद्रित होता है, और बराबर एकल-नोड कॉलमों की एक शृंखला को थोड़ा सरकाया जाता है ताकि उनके बीच के रिबन मुड़ें। `valueScale="sqrt"` मानों के वर्गमूल से आकार तय करता है, ताकि एक हावी प्रवाह छोटे प्रवाहों को दबा न दे।

हर नोड और हर रिबन अपना एक अलग कैनवस है, `node` और `link` पार्ट्स, इसलिए हर एक अपनी क्लासेज़ से पेंट होता है: `nodeClass` हर नोड पर वही क्लासेज़ है या नोड की रो का फ़ंक्शन, और `linkClass` हर रिबन पर वही या लिंक का फ़ंक्शन। `linkBackground` पार्ट हर रिबन के भीतर एक बैकग्राउंड दिखाता है, जो उसके स्रोत से उसके लक्ष्य तक का एक बॉक्स है: लिंक का फ़ंक्शन हर रिबन को उसके स्रोत के रंग से उसके लक्ष्य के रंग तक का ग्रेडिएंट देता है। रिबन नोड्स के नीचे खिंचते हैं, और दोनों प्लॉट के appear के साथ अग्रणी किनारे से खिंचते हैं।

sankey के ऊपर, प्लॉट पॉइंटर के नीचे वाले नोड की रिपोर्ट करता है (`onHoverChange`, नोड की रो; रिबन के ऊपर कुछ नहीं), उसका टूलटिप पॉइंटर का पीछा करता है, और उस नोड से न जुड़े लिंक प्लॉट के `motion` के साथ प्लेटफ़ॉर्म के एनिमेटर पर `hoverDim` से फीके पड़ जाते हैं। कीज़ नोड्स में रोज़ के क्रम में आगे बढ़ती हैं, और टूलटिप हर नोड के मध्य के बगल में आता है। `nodeLabel` हर नोड को नाम देता है और `valueLabel` उसका मान देता है, दोनों सेट होने पर मान नाम के ऊपर: पहले कॉलम के नोड के बाईं ओर, आख़िरी कॉलम के नोड के दाईं ओर, और बीच वालों के ऊपर केंद्र में, जैसे `gpui-component` का चार्ट उन्हें रखता है; नोड के बगल का लेबल प्लॉट के ऊपर और नीचे के बीच रहता है, और प्लॉट के किनारे के पार वाला लेबल उस जगह में बैठता है जो ऐप उसके आसपास छोड़ता है (उसका मार्जिन)। `nodeLabel` पार्ट की पैडिंग उसके नोड से दूरी है और उसकी क्लासेज़ उसका टेक्स्ट हैं (`max-w-20 truncate` लंबे नाम को छोटा कर देता है); लेबल appear के साथ फीके होकर उभरते हैं। जब ऐप प्रवाह बदलता है, तो हर नोड और रिबन अपनी पुरानी जगह से नई जगह पर प्लॉट के `motion.update` के साथ चलता है, उसका लेबल उसके साथ: प्रवाहों में नया नोड अपने मध्य से उगता है, नया लिंक अपनी न्यूनतम चौड़ाई से, और जो हट जाते हैं वे तुरंत चले जाते हैं; उनके चलते समय हुआ बदलाव वहीं से आगे बढ़ता है जहाँ वे खिंचे हैं। लिंक अपने स्रोत और लक्ष्य से पहचाने जाते हैं, इसलिए `links` का क्रम बदलने से कुछ नहीं हिलता।

```tsx
import { signal } from "nsh";
import { Plot, Sankey } from "nsh/base/plot";

type Step = { name: string };

const steps: Step[] = [{ name: "Visits" }, { name: "Sign-ups" }, { name: "Bounced" }, { name: "Trials" }, { name: "Paid" }, { name: "Churned" }];
const flows = [
  { source: 0, target: 1, value: 4200 },
  { source: 0, target: 2, value: 5800 },
  { source: 1, target: 3, value: 2600 },
  { source: 3, target: 4, value: 1100 },
  { source: 3, target: 5, value: 1500 },
];
// Each step's color: its node's fill, and its ribbons' gradient ends.
const FILLS = ["fill-chart-1", "fill-chart-2", "fill-muted", "fill-chart-3", "fill-chart-4", "fill-muted"];
const FROM = ["from-chart-1/40", "from-chart-2/40", "from-muted/40", "from-chart-3/40", "from-chart-4/40", "from-muted/40"];
const TO = ["to-chart-1/40", "to-chart-2/40", "to-muted/40", "to-chart-3/40", "to-chart-4/40", "to-muted/40"];

export function Funnel() {
  const hovered = signal<number | null>(null);
  return (
    <Plot
      data={steps}
      accessibilityLabel="Visits to paid: 10,000 visits, 1,100 paid"
      accessibilityValue={{ text: hovered() == null ? undefined : steps[hovered()!].name }}
      onHoverChange={({ index }) => hovered.set(index)}
      appearGeneration={1}
      motion={{ appear: { duration: 900, easing: "easeOut" }, update: { duration: 500 }, enter: { duration: 120 }, exit: { duration: 160 } }}
      class="mx-20 h-64"
    >
      <Sankey
        links={flows}
        nodeWidth={8}
        nodePadding={16}
        nodeCornerRadius={2}
        nodeClass={(_, i) => FILLS[i]}
        linkBackgroundClass={(link) => `bg-linear-to-r ${FROM[link.source]} ${TO[link.target]}`}
        hoverDim={0.7}
        nodeLabel={(d: Step) => d.name}
        valueLabel={(_: Step, value: number) => value.toLocaleString("en-US")}
        nodeLabelClass="px-2 py-1 text-xs text-muted-foreground"
        valueLabelClass="font-medium text-foreground"
      />
    </Plot>
  );
}
```

```rust
use nsh_base::plot::{RowClass, SankeyLinkClass, SankeyLinks, plot, sankey};
use nsh_core::{element::Rows, prelude::*};

fn funnel() -> impl IntoElement {
    plot()
        .data(Rows::from_columns(4, []))
        .accessibility_label("Visits to paid")
        .h(px(256.0))
        .child(
            sankey()
                .links(SankeyLinks::new([(0, 1, 4200.0), (1, 2, 2600.0), (2, 3, 1100.0)]))
                .node_width(px(8.0))
                .node_class(RowClass::from_fn(|i| format!("fill-chart-{}", i + 1).into()))
                .link_class(SankeyLinkClass::from("fill-foreground/10")),
        )
}
```

| Prop | Rust | Type | Default | Description |
|---|---|---|---|---|
| `links` | `.links(..)` | `SankeyLink[]` (`{ source: number; target: number; value: number }`) | required | प्रवाह: रो `source` से रो `target` तक (प्लॉट के `data` में उनके इंडेक्स), `value` उसका आकार। जो मान संख्या नहीं है या शून्य से कम है, वह कुछ नहीं ढोता और कोई रिबन नहीं खींचता। |
| `nodeWidth` | `.node_width(..)` | `number` | `24` | हर नोड की चौड़ाई, पॉइंट्स में। |
| `nodePadding` | `.node_padding(..)` | `number` | `8` | एक कॉलम के नोड्स के बीच की दूरी, पॉइंट्स में; जो कॉलम इसके लिए बहुत भरा हो उसमें कम। |
| `nodeAlign` | `.node_align(..)` | `"justify" \| "left" \| "right" \| "center"` | `"justify"` | हर नोड किस कॉलम में जाए, d3-sankey की तरह: पहले कॉलम से उसकी गहराई (`"left"`), उसके प्रवाह जितना दाईं ओर जाने दें उतना (`"right"`), उसकी गहराई, पर जो नोड केवल प्रवाह शुरू करता है वह अपने लक्ष्यों के बगल में (`"center"`), या उसकी गहराई, पर प्रवाह समाप्त करने वाले नोड आख़िरी कॉलम में (`"justify"`)। |
| `iterations` | `.iterations(..)` | `number` | `6` | कितने पास नोड्स को उनके प्रवाहों की ओर ढीला करते हैं। |
| `valueScale` | `.value_scale(..)` | `"linear" \| "sqrt"` | `"linear"` | ऊँचाइयाँ और चौड़ाइयाँ मानों के अनुपात में, या उनके वर्गमूलों के अनुपात में। |
| `minLinkWidth` | `.min_link_width(..)` | `number` | `1` | रिबन जितना पतला खिंचता है उसकी सीमा, पॉइंट्स में, ताकि छोटा प्रवाह दिखता रहे। |
| `nodeCornerRadius` | `.node_corner_radius(..)` | `number` | `0` | हर नोड के कोनों की त्रिज्या, पॉइंट्स में। |
| `nodeClass` | `.node_class(..)` | `string \| (d: T, index: number) => string` | none | हर नोड की क्लासेज़ (`fill-*`, `stroke-*`): हर नोड पर वही, या नोड की रो और उसके इंडेक्स का फ़ंक्शन, जिसे रोज़ या फ़ंक्शन बदलने पर प्रति रो एक बार कॉल किया जाता है। |
| `nodeStyle` | `.node_style(..)` | `StyleProp<ViewStyle>` | none | हर नोड की स्टाइल, उसकी क्लासेज़ के ऊपर। |
| `linkClass` | `.link_class(..)` | `string \| (link: SankeyLink, index: number) => string` | none | हर रिबन की क्लासेज़: हर रिबन पर वही, या लिंक और `links` में उसके इंडेक्स का फ़ंक्शन। |
| `linkStyle` | `.link_style(..)` | `StyleProp<ViewStyle>` | none | हर रिबन की स्टाइल, उसकी क्लासेज़ के ऊपर। |
| `linkBackgroundClass` | `.link_background_class(..)` | `string \| (link: SankeyLink, index: number) => string` | none | हर रिबन के बैकग्राउंड की क्लासेज़ (`bg-*`, एक ग्रेडिएंट: `bg-linear-to-r from-… to-…`), जो रिबन के भीतर उसके स्रोत से उसके लक्ष्य तक के बॉक्स पर, उसके `fill` के नीचे दिखती हैं। बैकग्राउंड होने पर, जहाँ कुछ सेट न हो वहाँ रिबन का `fill` `none` होता है। |
| `linkBackgroundStyle` | `.link_background_style(..)` | `StyleProp<ViewStyle>` | none | हर रिबन के बैकग्राउंड की स्टाइल, उसकी क्लासेज़ के ऊपर। |
| `hoverDim` | `.hover_dim(..)` | `number` (0 से 1) | `0` | पॉइंटर के नीचे वाले नोड से न जुड़े लिंक कितने फीके पड़ते हैं, उनकी अपारदर्शिता के हिस्से के रूप में, प्लॉट के `pointer` स्प्रिंग पर और hover के फेड के साथ। |
| `nodeLabel` | `.node_label(..)` | `keyof T \| (d: T, index: number) => string` | none | हर नोड के बगल का नाम: एक फ़ील्ड, या नोड की रो और उसके इंडेक्स का फ़ंक्शन। |
| `valueLabel` | `.value_label(..)` | `(d: T, value: number, index: number) => string` | none | हर नोड के बगल का मान, उसके नाम के ऊपर: उसकी रो और उसमें आने या उससे जाने वाले सबसे अधिक प्रवाह का फ़ंक्शन (लिंक्स के मानों में, `valueScale` चाहे जो हो)। |
| `nodeLabelClass` | `.node_label_class(..)` | `string` | none | हर लेबल की क्लासेज़, `nodeLabel` पार्ट: उसकी पैडिंग उसके नोड से दूरी, उसका टेक्स्ट दोनों पंक्तियों की स्टाइल। |
| `nodeLabelStyle` | `.node_label_style(..)` | `StyleProp<TextStyle>` | none | हर लेबल की स्टाइल, उसकी क्लासेज़ के ऊपर। |
| `valueLabelClass` | `.value_label_class(..)` | `string` | none | मान वाली पंक्ति की क्लासेज़, `valueLabel` पार्ट, लेबल की क्लासेज़ के ऊपर। |
| `valueLabelStyle` | `.value_label_style(..)` | `StyleProp<TextStyle>` | none | मान वाली पंक्ति की स्टाइल, उसकी क्लासेज़ के ऊपर। |

नोड और रिबन `fill` (जहाँ कुछ सेट न हो वहाँ `currentColor`) से भरते हैं और `stroke` (जहाँ कुछ सेट न हो वहाँ none) से स्ट्रोक करते हैं, अपने-अपने, sankey के और प्लॉट के ऊपर, जैसे CSS उन्हें इनहेरिट करता है। जिस नोड से कुछ नहीं गुज़रता वह एक पॉइंट ऊँचा होता है। लेआउट केवल तब दोबारा चलता है जब लिंक, विकल्प या प्लॉट का आकार बदलता है, पॉइंटर या appear के लिए कभी नहीं; प्लॉट का आकार बदलने से कुछ नहीं हिलता। जो लिंक चक्र बनाते हैं, या ऐसी रो का नाम लेते हैं जो प्लॉट में नहीं है, वे कुछ नहीं खींचते और एक चेतावनी लॉग करते हैं। इसके मान प्लॉट के स्केल में कोई भाग नहीं लेते।
## Treemap

`Treemap` plot की पंक्तियों (rows) को नेस्टेड आयतों के पदानुक्रम के रूप में बनाता है: हर पंक्ति एक नोड है, उसका `id` और जिस `parent` का वह नाम लेता है, वे मिलकर वृक्ष बनाते हैं (d3 का `stratify`), हर लीफ़ का क्षेत्रफल उसके `value` के अनुपात में होता है, और हर समूह अपने नीचे की चीज़ों का बॉक्स है, उसका मान उसके लीफ़ों के मानों का योग है (उसकी अपनी पंक्ति में जो भी हो)। जिस पंक्ति में `parent` नहीं है, या जिसका parent किसी पंक्ति का नाम नहीं लेता, वह शीर्ष-स्तर का नोड है; `id` के बिना पंक्ति की id उसका index होती है, इसलिए `parent` किसी पंक्ति को उसके index से भी नाम दे सकता है। gpt-vis जिस नेस्टेड रूप में वृक्ष लिखता है (`{ name, value, children }`), उससे पंक्तियाँ बनाने के लिए ऐप को बस कुछ पंक्तियाँ कोड लिखना होता है; स्तरों की कोई सीमा नहीं है।

टाइलें squarified होती हैं, जैसे d3 का `treemapSquarify` उन्हें बनाता है: हर स्तर के नोड मान के क्रम में, सबसे बड़ा ऊपर बाएँ से शुरू (`sort="value"`), पहलू अनुपात `ratio` (golden ratio) के निकट; `sort="data"` पंक्तियों का क्रम रखता है, इसलिए मान बदलने पर भी नोड अपनी जगह पर रहते हैं। `paddingInner` siblings के बीच का अंतर है, उनके parent के किसी बाहरी किनारे पर नहीं; `paddingOuter` समूह के भीतर उसके children के चारों ओर की जगह है; `paddingTop` हर समूह के ऊपर की एक पट्टी है, जहाँ उसका `groupLabel` लिखा जाता है। हर एक या तो सभी स्तरों के लिए एक संख्या लेता है या ऊपर के स्तर से नीचे की ओर प्रति स्तर एक संख्या (`[3, 1]`: शीर्ष-स्तर के नोड के बीच 3, उनके नीचे 1)। किसी स्तर की पट्टी एक parent के सभी siblings पर लगती है या किसी पर नहीं, और जहाँ कोई sibling उसके लिए बहुत छोटा हो वहाँ छोड़ दी जाती है, ताकि एक स्तर के समूह एक जैसे दिखें।

जिस लीफ़ का मान 0 है, 0 से कम है या संख्या नहीं है, उसे कोई क्षेत्रफल नहीं मिलता: वह बनाया नहीं जाता, उसका लेबल नहीं होता और pointer उसे नहीं पाता, और वह समूह भी नहीं बनता जिसके सारे लीफ़ ऐसे हों। Treemap के क्षेत्रफल एक पूर्ण के हिस्से होते हैं, इसलिए जो छोड़ दिया गया उसे ऐप अपने शब्दों में बताता है (मैप के नीचे एक नोट)। ऋणात्मक संख्याएँ रंगों के लिए हैं: बाज़ार मैप में दिन का बदलाव।

नोड का रंग plot के `colorScale` में उसकी पंक्ति का होता है: `colorValue` एक रैंप पर संख्या है (`sequential`, `diverging`: हानि लाल, लाभ हरा, स्थिर तटस्थ, `domain` के बिना मानों के विस्तार पर), `color` एक श्रेणी है (`ordinal`: `"parent"` एक समूह के लीफ़ों को एक जैसा रंग देता है)। लीफ़ `leaf` part हैं (`leafClass`, `leafStyle`) और समूह `group` part (`groupClass`, `groupStyle`), जो केवल class या style के साथ बनाए जाते हैं: अपने children के नीचे एक आयत, जो अंतरालों, उसकी padding और उसकी पट्टी में दिखती है। हर part हर नोड पर एक जैसा होता है या नोड की पंक्ति का फ़ंक्शन होता है। `cornerRadii` हर आयत को गोल करता है।

`label` हर लीफ़ का नाम लिखता है और `valueLabel` उसके नीचे उसका मान, जो पंक्ति और उसके मान का फ़ंक्शन है (समूह का मान उसके लीफ़ों का योग है): ऊपर बाएँ (`labelPlacement="start"`) या बीच में (`"center"`)। `label` part अपने लीफ़ जितना बड़ा बॉक्स है: उसकी padding लीफ़ के किनारों से दूरी है और उसके text styles पंक्तियों के हैं। जहाँ लीफ़ संकरा हो वहाँ नाम ellipsis से काटा जाता है और केवल वहीं दिखता है जहाँ वह समा सके; मान पूरा दिखता है या बिल्कुल नहीं। जिस लेबल के लीफ़ का रंग गहरा है उसमें attribute `data-dark` होता है, ताकि `data-dark:text-white` उसे गहरे लाल पर पठनीय रखे।

Treemap के ऊपर plot pointer के नीचे के नोड की रिपोर्ट करता है (`onHoverChange`, नोड की पंक्ति): एक लीफ़, या समूह अपनी पट्टी या padding में; siblings के बीच के अंतर पर उनमें से एक, ताकि hover झिलमिलाए नहीं। बाकी नोड `inactiveOpacity` तक फीके पड़ते हैं (लीफ़ अपने समूह रखता है, समूह अपने नीचे का सब कुछ), और `hover` part, नोड जितना बड़ा एक view, उसकी रूपरेखा बनाता है। Arrow keys स्क्रीन पर बगल के लीफ़ पर जाती हैं, Home और End पहले और अंतिम लीफ़ पर। Plot के appear के साथ शीर्ष-स्तर के नोड अपने बीच से बढ़ते हैं, एक के बाद एक, `stagger` के साथ; जब पंक्तियाँ बदलती हैं, हर नोड `motion.update` के साथ अपने नए box और रंग पर जाता है, जिसे उसके `id` से पहचाना जाता है: पंक्तियों में नया नोड अपने बीच से बढ़ता है और जो चला गया वह अपने ही भीतर सिकुड़ जाता है। Plot के x और y scales उपयोग नहीं होते।

<!-- demo: el-plot-treemap -->

```tsx
import { signal } from "nsh";
import { Plot, Treemap } from "nsh/base/plot";

type Row = { id: string; parent?: string; name: string; cap?: number; chg?: number };

const rows: Row[] = [
  { id: "tech", name: "Technology" },
  { id: "fin", name: "Financials" },
  { id: "NVDA", parent: "tech", name: "NVIDIA", cap: 4300, chg: 2.4 },
  { id: "MSFT", parent: "tech", name: "Microsoft", cap: 3700, chg: -0.6 },
  { id: "AVGO", parent: "tech", name: "Broadcom", cap: 1600, chg: 3.1 },
  { id: "JPM", parent: "fin", name: "JPMorgan", cap: 830, chg: 1.3 },
  { id: "V", parent: "fin", name: "Visa", cap: 670, chg: -0.3 },
];

export function MarketMap() {
  const hovered = signal<number | null>(null);
  return (
    <Plot
      data={rows}
      colorScale={{ type: "diverging", domain: [-3, 3], range: ["#dc2626", "#e5e5e5", "#16a34a"] }}
      accessibilityLabel="Market map of 5 stocks in 2 sectors"
      accessibilityValue={{ text: hovered() == null ? undefined : rows[hovered()!].name }}
      onHoverChange={({ index }) => hovered.set(index)}
      appearGeneration={1}
      motion={{ appear: { duration: 800 }, update: { duration: 500 }, enter: { duration: 120 }, exit: { duration: 160 } }}
      class="h-72"
    >
      <Treemap
        id="id"
        parent="parent"
        value="cap"
        colorValue="chg"
        paddingInner={[3, 1]}
        paddingTop={18}
        cornerRadii={2}
        inactiveOpacity={0.35}
        label="id"
        valueLabel={(d: Row) => `${d.chg! > 0 ? "+" : ""}${d.chg}%`}
        labelPlacement="center"
        labelClass="p-1 text-xs font-semibold text-foreground data-dark:text-white"
        groupLabel="name"
        groupLabelClass="px-1 text-xs text-muted-foreground"
        hoverClass="rounded-xs outline-2 outline-foreground"
      />
    </Plot>
  );
}
```

```rust
use nsh_base::plot::{ColorScale, DivergingScale, TreemapPadding, plot, treemap};
use nsh_core::{element::{RowAccessor, RowText, Rows}, prelude::*};

const IDS: [&str; 5] = ["tech", "fin", "NVDA", "MSFT", "JPM"];
const PARENTS: [&str; 5] = ["", "", "tech", "tech", "fin"];

fn market_map() -> impl IntoElement {
    let rows = Rows::from_columns(
        5,
        [
            ("cap".into(), vec![0.0, 0.0, 4300.0, 3700.0, 830.0]),
            ("chg".into(), vec![0.0, 0.0, 2.4, -0.6, 1.3]),
        ],
    );
    plot()
        .data(rows)
        .color_scale(ColorScale::from(
            DivergingScale::new([rgb(0xdc2626), rgb(0xe5e5e5), rgb(0x16a34a)]).domain([-3.0, 3.0]),
        ))
        .accessibility_label("Market map")
        .h(px(288.0))
        .child(
            treemap()
                .id(RowText::from_fn(|i| IDS[i].into()))
                .parent(RowText::from_fn(|i| PARENTS[i].into()))
                .value(RowAccessor::key("cap"))
                .color_value(RowAccessor::key("chg"))
                .padding_inner(TreemapPadding::from([px(3.0), px(1.0)]))
                .padding_top(TreemapPadding::from(px(18.0)))
                .label(RowText::from_fn(|i| IDS[i].into())),
        )
}
```

| प्रॉप | Rust | टाइप | डिफ़ॉल्ट | विवरण |
|---|---|---|---|---|
| `id` | `.id(..)` | `keyof T \| (d: T, index: number) => string` | पंक्ति का index | हर पंक्ति के नोड की id: जिसे `parent` नाम देता है, और जिससे पंक्तियाँ बदलने पर नोड पहचाना जाता है। |
| `parent` | `.parent(..)` | `keyof T \| (d: T, index: number) => string` | कोई नहीं: हर पंक्ति शीर्ष-स्तर का नोड है | हर पंक्ति के parent की id; शीर्ष-स्तर के नोड के लिए खाली, या किसी पंक्ति की id नहीं। |
| `value` | `.value(..)` | `keyof T \| (d: T, index: number) => number` | आवश्यक | हर लीफ़ का आकार; समूह का आकार उसके children के योग के बराबर है। 0, 0 से कम या संख्या न होने वाला लीफ़ कोई क्षेत्रफल नहीं लेता। |
| `sort` | `.sort(..)` | `"value" \| "data"` | `"value"` | Siblings सबसे बड़े पहले ऊपर बाएँ से, या पंक्तियों के क्रम में। |
| `ratio` | `.ratio(..)` | `number` | golden ratio | वह पहलू अनुपात जिसके निकट टाइलें पहुँचती हैं, कम से कम 1। |
| `paddingInner` | `.padding_inner(..)` | `number \| number[]` | `0` | Siblings के बीच का अंतर, points में, ऊपर के स्तर से नीचे की ओर प्रति स्तर (अंतिम मान उसके नीचे के स्तरों के लिए)। |
| `paddingOuter` | `.padding_outer(..)` | `number \| number[]` | `0` | हर समूह के भीतर उसके children के चारों ओर की जगह, प्रति स्तर। |
| `paddingTop` | `.padding_top(..)` | `number \| number[]` | `0` | हर समूह के ऊपर की पट्टी, उसके `groupLabel` के लिए, प्रति स्तर; एक parent के सभी siblings पर या किसी पर नहीं। |
| `cornerRadii` | `.corner_radii(..)` | `number \| { topLeft?, topRight?, bottomRight?, bottomLeft? }` | वर्गाकार | उसकी आयतों के हर कोने की त्रिज्या। |
| `color` | `.color(..)` | `keyof T \| (d: T, index: number) => string` | कोई नहीं | हर नोड की श्रेणी, जिसे `ordinal` `colorScale` रंग देता है। |
| `colorValue` | `.color_value(..)` | `keyof T \| (d: T, index: number) => number` | कोई नहीं | हर नोड की संख्या, जिसे `sequential` या `diverging` `colorScale` उसका रंग बनाता है। |
| `leafClass` | `.leaf_class(..)` | `string \| (d: T, index: number) => string` | कोई नहीं | हर लीफ़ की classes (`fill-*`, `stroke-*`), हर लीफ़ पर एक जैसी या उसकी पंक्ति का फ़ंक्शन। |
| `leafStyle` | `.leaf_style(..)` | `StyleProp<ViewStyle>` | कोई नहीं | हर लीफ़ का style, उसकी classes के ऊपर। |
| `groupClass` | `.group_class(..)` | `string \| (d: T, index: number) => string` | कोई नहीं | हर समूह की classes, उसके children के नीचे एक आयत; समूह केवल class या style के साथ बनाए जाते हैं। |
| `groupStyle` | `.group_style(..)` | `StyleProp<ViewStyle>` | कोई नहीं | हर समूह का style, उसकी classes के ऊपर। |
| `inactiveOpacity` | `.inactive_opacity(..)` | `number` (0 से 1) | कोई नहीं | hover वाले नोड से दूर के नोड और उनके लेबल की opacity, hover के fade के साथ। |
| `label` | `.label(..)` | `keyof T \| (d: T, index: number) => string` | कोई नहीं | हर लीफ़ में नाम, एक पंक्ति में, ellipsis से कटा हुआ। |
| `valueLabel` | `.value_label(..)` | `(d: T, value: number, index: number) => string` | कोई नहीं | हर लीफ़ में मान, उसके नाम के नीचे, केवल वहीं दिखता है जहाँ वह पूरा समा सके। |
| `labelPlacement` | `.label_placement(..)` | `"start" \| "center"` | `"start"` | लेबल अपने लीफ़ के ऊपर बाएँ, या बीच में। |
| `labelClass` | `.label_class(..)` | `string` | कोई नहीं | हर लीफ़ के लेबल की classes, लीफ़ जितना बड़ा box: उसकी padding और text styles; गहरे लीफ़ों पर `data-dark:`। |
| `labelStyle` | `.label_style(..)` | `StyleProp<TextStyle>` | कोई नहीं | हर लीफ़ के लेबल का style, उसकी classes के ऊपर। |
| `valueLabelClass` | `.value_label_class(..)` | `string` | कोई नहीं | मान वाली पंक्ति की classes, लेबल की classes के ऊपर। |
| `valueLabelStyle` | `.value_label_style(..)` | `StyleProp<TextStyle>` | कोई नहीं | मान वाली पंक्ति का style, उसकी classes के ऊपर। |
| `groupLabel` | `.group_label(..)` | `keyof T \| (d: T, index: number) => string` | कोई नहीं | हर समूह का नाम, उसकी पट्टी में, ellipsis से कटा हुआ। |
| `groupLabelClass` | `.group_label_class(..)` | `string` | कोई नहीं | हर समूह के लेबल की classes, पट्टी जितना बड़ा box। |
| `groupLabelStyle` | `.group_label_style(..)` | `StyleProp<TextStyle>` | कोई नहीं | हर समूह के लेबल का style, उसकी classes के ऊपर। |
| `stagger` | `.stagger(..)` | `number` (0 से 0.95) | `0` | शीर्ष-स्तर के नोड एक के बाद एक कैसे प्रकट होते हैं: appear का वह हिस्सा जिसमें वे शुरू होते हैं। |
| `hoverClass` | `.hover_class(..)` | `string` | कोई नहीं | `hover` part की classes, उसके ऊपर hover वाले नोड जितना बड़ा एक view (`rounded-xs outline-2 outline-foreground`)। |
| `hoverStyle` | `.hover_style(..)` | `StyleProp<ViewStyle>` | कोई नहीं | hover part का style, उसकी classes के ऊपर। |

आयत `fill` से भरती है (`colorScale` का रंग, नहीं तो `currentColor`, जहाँ कोई सेट न हो) और `stroke` से stroke करती है (जहाँ कोई सेट न हो वहाँ कोई नहीं), उसका अपना मान treemap और plot के मान के ऊपर रहता है, जैसे CSS उन्हें inherit करता है। Layout केवल तब फिर चलता है जब पंक्तियाँ, options या plot का आकार बदलता है, pointer या appear के लिए कभी नहीं; plot का आकार बदलने से कुछ नहीं हिलता। दोहराई गई `id`, कोई पंक्ति न बताने वाला `parent` और अपनी ही पूर्वज पंक्ति एक बार warning लॉग करते हैं: पहली पंक्ति id रखती है, अनाथ पंक्ति शीर्ष-स्तर का नोड बन जाती है, और चक्र बनाया नहीं जाता।

## PlotAxis

`PlotAxis` plot के एक किनारे पर उस scale के ticks के साथ लेबल लगाता है जो वह किनारा रखता है: नीचे और ऊपर के किनारे x scale के, बाएँ और दाएँ वाले y scale के, जैसे d3 के `axisBottom`, `axisTop`, `axisLeft` और `axisRight`। उसके ticks scale से आते हैं: `linear` scale पर गोल मान (10 की घात का 1, 2 या 5 गुना, domain के भीतर), `point` या `band` scale पर पंक्तियाँ। उसके लेबल वे texts हैं जिन्हें plot का layout रखता है, इसलिए ऐप बताता है कि वे क्या पढ़ें और कैसे दिखें, और layout उन्हें जगह पर रखता है: हर लेबल किनारे के साथ अपने tick पर केंद्रित होता है। नीचे और ऊपर के किनारों पर, पहला और अंतिम लेबल उतना ही भीतर की ओर खिसकते हैं जितना plot के सिरों के भीतर रहने के लिए ज़रूरी हो; बाएँ और दाएँ किनारों के पास हर लेबल अपने tick पर रहता है, ताकि वह अपनी grid line का लेबल लगे, और जहाँ सिरे के पास का कोई लेबल plot के ऊपरी या निचले किनारे को पार करता, वहाँ plot के linear y scales उस किनारे से उतना भीतर से शुरू होते हैं (सिरे पर स्थित tick के लिए लेबल की आधी ऊँचाई), ताकि हर लेबल plot के भीतर, अपनी grid line पर रहे।

```tsx
import { Area, Grid, Line, Plot, PlotAxis } from "nsh/base/plot";

const rows = [
  { day: "Mon", visitors: 1820 },
  { day: "Tue", visitors: 2140 },
  { day: "Wed", visitors: 1960 },
  { day: "Thu", visitors: 2480 },
  { day: "Fri", visitors: 2310 },
];

<Plot data={rows} y="visitors" yScale={{ type: "linear", domain: [0, 3000] }} class="mb-6 ml-10 h-40">
  <Grid y={[0, 1000, 2000, 3000]} class="stroke-border" />
  <Area class="fill-chart-1/20" />
  <Line class="stroke-chart-1 stroke-2" />
  {/* 0, 1,000, 2,000 and 3,000 left of the plot; a day under each row. */}
  <PlotAxis placement="left" ticks={3} labelClass="pr-2 text-xs tabular-nums text-muted-foreground" />
  <PlotAxis
    format={(i) => rows[i].day}
    labelClass="pt-2 text-xs text-muted-foreground"
    tickClass="h-1 w-px bg-border"
    lineClass="h-px bg-border"
  />
</Plot>
```

| प्रॉप | Rust | टाइप | डिफ़ॉल्ट | विवरण |
|---|---|---|---|---|
| `placement` | `.placement(..)` | `"bottom" \| "top" \| "left" \| "right"` | `"bottom"` | वह किनारा जिसके साथ वह चलता है: नीचे और ऊपर के किनारे x scale के ticks रखते हैं, बाएँ और दाएँ वाले y scale के। |
| `scale` | `.scale(..)` | `"y" \| "y2"` | `"y"` | बाएँ या दाएँ axis जिस y scale पर लेबल लगाता है: plot का `yScale` या उसका दूसरा, `y2Scale` ([Dual axes](#dual-axes))। |
| `labelPlacement` | `.label_placement(..)` | `"outside" \| "inside"` | `"outside"` | उसके लेबल कहाँ रहते हैं: किनारे के पार, उस जगह में जो ऐप plot के चारों ओर छोड़ता है, जहाँ वे marks से दूर रहते हैं; या किनारे के साथ plot के ऊपर, ताकि plot अपना पूरा आकार रखे (बाएँ या दाएँ किनारे के पास, हर लेबल अपनी grid line के ऊपरी ओर बैठता है)। |
| `ticks` | `.ticks(..)` | `number` | `10` `linear` scale पर (aligned scales का हर चरण), अन्य पर हर पंक्ति | ticks की लगभग कितनी संख्या: `linear` scale पर domain के भीतर लगभग इतने गोल मान; `point` या `band` scale पर, पहली से अंतिम तक समान रूप से फैली इतनी पंक्तियाँ। |
| `tickValues` | `.tick_values(..)` | `number[]` | कोई नहीं | उसके ticks के मान, `ticks` की जगह: scale के मान, `point` या `band` scale पर पंक्तियों के indices (`[0, 3, 6]` हर तीसरी पंक्ति पर लेबल लगाता है)। domain के भीतर के हर मान को एक tick मिलता है। |
| `format` | `.format(..)` | `(value: number, index: number) => string` | band scale of categories पर band की श्रेणी, नहीं तो मान, उतने दशमलव के साथ जितने ticks के बीच के चरण को चाहिए, हज़ारों समूहित | हर tick का text: उसके मान (`point` या `band` scale पर पंक्ति का index) और axis के ticks में उसके index का, ऐप का फ़ंक्शन। |
| `labelClass`, `labelStyle` | `.label_class(..)`, `.label_style(..)` | `string`, `StyleProp<TextStyle>` | कोई नहीं | `label` part: प्रति tick एक text, उसका font, रंग और padding ऐप के; plot की ओर उसकी padding किनारे से उसकी दूरी है (नीचे के axis में `pt-2`)। |
| `tickClass`, `tickStyle` | `.tick_class(..)`, `.tick_style(..)` | `string`, `StyleProp<ViewStyle>` | कोई नहीं | `tick` part: किनारे पर प्रति tick एक view, अपने tick पर केंद्रित और लेबल की ओर पहुँचता हुआ (नीचे के axis में `h-1 w-px bg-border`); style मिलने पर दिखता है। |
| `lineClass`, `lineStyle` | `.line_class(..)`, `.line_style(..)` | `string`, `StyleProp<ViewStyle>` | कोई नहीं | `line` part: पूरे किनारे के साथ एक view, लेबल की ओर (नीचे के axis में `h-px bg-border`); style मिलने पर दिखता है। |

Outside में लेबल plot के margin में रहते हैं, जैसे d3 के axes चार्ट के margins में रहते हैं: plot वही आकार रखता है जो ऐप उसे देता है, और ऐप उसे axis की ओर उतना गहरा margin देता है जितने लेबल हैं (`mb-6` उसके नीचे `pt-2 text-xs` लेबल के लिए), या वहाँ उसका parent padding। एक किनारे पर दो axes हर एक अपने मानों पर, अपनी style में लेबल लगाते हैं: range के सिरे फीके और उसका मध्य भाग गहरा।

`format` को हर tick के लिए एक बार बुलाया जाता है जब ticks या फ़ंक्शन बदलते हैं, अगले turn में, plot के बनाते समय या pointer का पीछा करते समय कभी नहीं: उसे pure रखें (वही मान, वही text)। उसके बिना tick वैसे पढ़ा जाता है जैसे d3 लिखता है: `1,500`, `0.25`, `−2`। Rust में `plot_axis()` axis बनाता है, उसका `format` एक `TickFormat::from_fn(|value, index| ..)` है। Axis pointer नहीं लेता, और screen readers लेबल की जगह plot को सुनते हैं।
## PlotLabel

`PlotLabel` प्लॉट के बिंदुओं पर टेक्स्ट लिखता है: किसी चोटी के ऊपर कैप्शन, किसी लाइन के आखिरी बिंदु पर टैग, किसी ग्रिड लाइन के सिरे पर नोट। इसका हर `texts` अपना बिंदु प्लॉट के स्केल के मानों से बताता है, ठीक वैसे ही जैसे मार्क्स बताते हैं: `point` या `band` स्केल पर पंक्ति का इंडेक्स (पंक्ति के बैंड का मध्य), और `linear` स्केल पर एक मान। टेक्स्ट का ऊपरी किनारा बिंदु पर रहता है, और इसका `align` उसे वहीं से शुरू करता है, उस पर केंद्रित करता है या वहीं समाप्त करता है। टेक्स्ट को प्लॉट का लेआउट रखता है, इसलिए वे प्लॉट के आकार का अनुसरण करते हैं; वे स्केल के डोमेन के साथ सरकते हैं (`motion.update`) और appear के साथ फ़ेड इन होते हैं।

```tsx
import { Area, Line, Plot, PlotLabel } from "nsh/base/plot";

const rows = [
  { day: "Mon", visitors: 1820 },
  { day: "Tue", visitors: 2140 },
  { day: "Wed", visitors: 1960 },
  { day: "Thu", visitors: 2480 },
  { day: "Fri", visitors: 2310 },
];
const [peak, last] = [3, rows.length - 1];

<Plot data={rows} y="visitors" yScale={{ type: "linear", domain: [0, 3000] }} class="mr-12 h-40">
  <Area class="fill-chart-1/20" />
  <Line class="stroke-chart-1 stroke-2" />
  {/* The peak's value over it, and a tag right of the last point, its middle at the point's height. */}
  <PlotLabel
    class="text-xs tabular-nums text-muted-foreground"
    texts={[
      { text: `High ${rows[peak].visitors}`, x: peak, y: rows[peak].visitors, align: "center", class: "-translate-y-full pb-1" },
      { text: `${rows[last].visitors}`, x: last, y: rows[last].visitors, class: "-translate-y-1/2 ml-2 rounded bg-chart-1 px-1.5 text-white" },
    ]}
  />
</Plot>
```

| Prop | Rust | टाइप | डिफ़ॉल्ट | विवरण |
|---|---|---|---|---|
| `texts` | `.texts(..)` | `PlotText[]` | `[]` | वे टेक्स्ट जो यह लिखता है, हर एक अपने बिंदु पर। |
| `scale` | `.scale(..)` | `"y" \| "y2"` | `"y"` | वह y स्केल जिसके मान इसके टेक्स्ट के `y` हैं ([Dual axes](#dual-axes))। |

हर टेक्स्ट एक `PlotText` है:

| फ़ील्ड | टाइप | डिफ़ॉल्ट | विवरण |
|---|---|---|---|
| `text` | `string` | | वह जो यह पढ़ाता है। |
| `x` | `number` | | x अक्ष पर यह कहाँ जाता है: x स्केल का एक मान, या `point` या `band` स्केल पर पंक्ति का इंडेक्स (`0.5` पहली दो पंक्तियों के ठीक बीच में है)। |
| `y` | `number` | | y अक्ष पर इसका ऊपरी किनारा कहाँ जाता है: y स्केल का एक मान। |
| `align` | `"left" \| "center" \| "right"` | `"left"` | अपने बिंदु से x पर यह कैसे बैठता है: बिंदु से शुरू होकर, बिंदु पर केंद्रित, या बिंदु पर समाप्त होकर। |
| `class`, `style` | `string`, `StyleProp<TextStyle>` | कोई नहीं | टेक्स्ट की अपनी क्लासेज़ और स्टाइल, जो label से मिली विरासत के ऊपर लगती हैं: इसका बॉक्स (टैग का बैकग्राउंड और पैडिंग) और बिंदु से इसकी दूरी। |

रूप-रंग ऐप का होता है: label का `class` हर टेक्स्ट को वे टेक्स्ट स्टाइल देता है जो वे विरासत में पाते हैं (फ़ॉन्ट, आकार, रंग), और टेक्स्ट के अपने `class` और `style` केवल उसी को स्टाइल करते हैं। टेक्स्ट को उसके बिंदु के ऊपर `-translate-y-full` से रखा जाता है, और उसकी पैडिंग ही बिंदु से उसकी दूरी है (`pb-1`); किसी लाइन के आखिरी बिंदु के बगल का टैग उस ओर ऐप द्वारा छोड़े गए मार्जिन में बैठता है (`mr-12`), जैसे किसी अक्ष के labels बैठते हैं। Rust में, `plot_label()` एक label बनाता है, और हर टेक्स्ट `.align(PlotTextAlign::Center)`, `.class(..)` और `.style(..)` के साथ एक `PlotText::new(text, x, y)` होता है। पॉइंटर टेक्स्ट के आर-पार प्लॉट तक पहुँच जाता है, और स्क्रीन रीडर प्लॉट को सुनते हैं, जिसका `accessibilityLabel` बताता है कि टेक्स्ट किस ओर इशारा करते हैं।

## Motion

Motion ऐप का होता है, और डिफ़ॉल्ट रूप से कोई नहीं होता: सब कुछ एक साथ दिख जाता है। `motion` [`nsh`](../modules/nsh.md#animation) की टाइमिंग लेता है (`{ duration, easing, delay }` और `{ stiffness, damping, mass }`):

| Key | टाइप | क्या हिलता है |
|---|---|---|
| `appear` | timing | मार्क्स `appearGeneration` के साथ खिंचकर बनते हैं: लाइनें और एरिया अग्रणी किनारे से, बार अपने आधार से उगते हुए (बार के `stagger` के साथ एक के बाद एक); डॉट शून्य से बढ़ते हुए (डॉट के `stagger` के साथ एक के बाद एक); सेल अपने मध्य से बढ़ते हुए (सेल के `stagger` के साथ एक के बाद एक); pie और arc का रिंग अपनी शुरुआत से दक्षिणावर्त घूमता हुआ आता है; रेडियल लाइन अपनी भीतरी त्रिज्या से उगती है, उसके डॉट साथ में; sankey के नोड और रिबन अग्रणी किनारे से, उसके labels फ़ेड इन होते हुए। |
| `update` | timing | ऐप जब आकार बदलता है तो मार्क्स नए आकार में चले जाते हैं: डॉट अपने नए मानों और आकारों पर, नई पंक्ति का डॉट उगता हुआ और हटी पंक्ति का डॉट सिकुड़ता हुआ; सेल अपने नए रंगों (OKLab में मिश्रित) और बैंड पर, नई पंक्ति का सेल उगता हुआ और हटी पंक्ति का सेल सिकुड़ता हुआ; pie और arc की त्रिज्याएँ, जिससे donut का छेद खुलता और बंद होता है, और उनके कोण, जिससे गेज या स्लाइस अपने नए मान तक घूम जाता है (d3 का `arcTween`: कोण चलते हैं, रूपरेखा नहीं; नया स्लाइस वहाँ से खुलता है जहाँ उससे पहले वाला खत्म होता है; किसी के चलते समय हुआ बदलाव वहीं से आगे बढ़ता है जहाँ वह खिंचा दिख रहा है); रेडियल लाइन के बिंदु अपने नए मानों, कोणों और त्रिज्याओं पर (नई पंक्ति भीतरी त्रिज्या से उगती हुई), और उनके साथ रेडियल ग्रिड के रिंग; और linear स्केल का डोमेन, यानी ऐप का `domain` या पंक्तियाँ आने पर मार्क्स के मानों का विस्तार, जो पुराने से नए तक सरकता है, उसके साथ मार्क्स, ग्रिड लाइनें, `PlotAxis` और `PlotLabel` भी; और sankey के नोड, रिबन और labels, पुराने flows के लेआउट से नए तक, और उनके चलते समय हुआ बदलाव वहीं से आगे बढ़ता है जहाँ वे खिंचे दिख रहे हैं। |
| `enter` | timing | पॉइंटर के प्लॉट पर आने पर hover के हिस्से फ़ेड इन होते हैं। |
| `exit` | timing | पॉइंटर के जाने के बाद वे फ़ेड आउट होते हैं। |
| `pointer` | spring | कीज़ या स्क्रीन रीडर के hover को आगे बढ़ाने पर वे एक पंक्ति से अगली पर सरकते हैं; इस पर pie का स्लाइस उठता है। |

Hover के हिस्से उसी फ़्रेम में पॉइंटर का अनुसरण करते हैं: जैसे ही वह चलता है, क्रॉस लाइन, डॉट और tooltip तुरंत उसके नीचे की पंक्ति पर होते हैं, इसलिए वे हाथ के साथ चलते हैं, जबकि उनका फ़ेड इन और आउट (`enter`, `exit`) फिर भी एनिमेट होता है।

Motion प्लॉटफ़ॉर्म के animator पर चलता है, प्रति फ़्रेम कोई JS नहीं चलती, और जो लोग reduced motion माँगते हैं उनके लिए यह तुरंत पूरा हो जाता है। जो प्लॉट किसी सूची द्वारा लौटी पंक्ति के लिए दोबारा बनाया जाता है, वह फिर से खिंचकर बनता है, जब तक कि सूची के आसपास का कोई [`PlotAppearScope`](#plotappearscope) उसका appear पूरा होते न देख चुका हो।

डोमेन उसी तरह चलता है जैसे d3 किसी स्केल के डोमेन को transition करता है: बीच का स्केल हर मान को रखता है, इसलिए मार्क्स अपने आकार बनाए रखते हैं, ग्रिड लाइनें और hover के हिस्से उनके साथ चलते हैं, बार अपने कोने बनाए रखते हैं, और नए डोमेन के साथ आने वाली पंक्ति बाकी के साथ चलती है। जो live चार्ट समय-समय पर अपने y स्केल को अपनी पंक्तियों के अनुसार फ़िट करता है (कुछ जगह छोड़कर, ताकि फ़िट के बीच ग्रिड स्थिर रहे), वह हर नए फ़िट तक `update` timing के साथ सरकता है। प्लॉट का आकार बदलने पर मार्क्स नया आकार तुरंत ले लेते हैं।

यह प्लॉट का अपना motion है, यानी चार्ट जो कुछ हिलाता है उसकी timings: उसके मार्क्स की क्लिप और उसके hover के हिस्से। किसी view के entrances, exits और attention seekers [`createMotion`](../modules/nsh.md#createmotion) के presets और keyframes हैं, जिन्हें ऐप फिर भी प्लॉट के view पर या उसके आसपास के elements पर चला सकता है।

## PlotAppearScope

सूची हर बार किसी पंक्ति का प्लॉट फिर से बनाती है जब पंक्ति दोबारा दृश्य में आती है, इसलिए appear वाली sparkline तब-तब फिर से खिंचकर बनती है जब सूची उस तक वापस स्क्रॉल होती है। सूची के आसपास का `PlotAppearScope` उसमें पूरे हो चुके appears को याद रखता है: वहाँ फिर से बना प्लॉट, जिसका `appearGeneration` पूरा हो चुका है, अपने मार्क्स तुरंत पूरे दिखाता है।
प्लॉट को उसकी generation से याद रखा जाता है, इसलिए हर पंक्ति के प्लॉट को अपनी generation मिलती है: पंक्ति की key के साथ वह सब जो उसे फिर से चलवाए (`` `${symbol} ${period}` ``)।

```tsx
import { List } from "nsh";
import { Line, Plot, PlotAppearScope } from "nsh/base/plot";

<PlotAppearScope id={watchlist().id} class="flex-1">
  <List each={watchlist().rows} keyExtractor={(row) => row.symbol} estimatedItemSize={48} class="flex-1">
    {(row) => (
      <Plot
        data={row().closes}
        y="close"
        interactive={false}
        appearGeneration={`${row().symbol} ${period()}`}
        motion={{ appear: { duration: 400, easing: "easeOut" } }}
        class="h-8 w-24"
      >
        <Line class="stroke-chart-1 stroke-[1.5]" />
      </Plot>
    )}
  </List>
</PlotAppearScope>
```

| Prop | Rust | टाइप | डिफ़ॉल्ट | विवरण |
|---|---|---|---|---|
| `id` | `.id(..)` | `number \| string` | कोई नहीं | स्कोप किसके लिए याद रखता है: यह बदलने पर स्कोप भूल जाता है और उसके प्लॉट जहाँ हैं वहीं नए सिरे से खिंचकर बनते हैं। इसका नाम सामग्री के नाम पर रखें, जैसे watchlist या conversation; इसके बिना, स्कोप जब तक दिखता रहता है तब तक याद रखता है। |
| `children` | `.child(..)` | `JSX.Element` | कोई नहीं | यह क्या थामता है: सूची, या वह जो भी उसके प्लॉट को आते-जाते फिर से बनाता है। |

नई generation पर प्लॉट फिर भी खिंचकर बनता है, और वह प्लॉट भी जिसे उसका appear पूरा होने से पहले हटा लिया गया, शुरू से। जैसे ही कोई प्लॉट नई generation पूरी कर लेता है, उसका स्कोप उससे पहले वाली को भूल जाता है, इसलिए किसी पहले की अवधि पर वापस जाने पर प्लॉट फिर से खिंचकर बनता है। याददाश्त स्कोप के साथ जाती है: जो स्कोप अब नहीं दिखता, या जिसका `id` नया है, वह अपने प्लॉट नए सिरे से खींचता है, और प्लॉट अपने आसपास के सबसे भीतरी स्कोप में याद रखता है। इसका रूप-रंग ऐप का होता है: `class` और `style` इसे किसी भी view की तरह लेआउट करते हैं (पूरी स्क्रीन भरने वाली सूची के आसपास `flex-1`)। Rust में, `plot_appear_scope()` एक बनाता है।

## Keyboard

इंटरैक्टिव प्लॉट Tab का एक पड़ाव है (macOS, वेब), और जब तक उस पर कीबोर्ड फ़ोकस है, उसकी कीज़ वही hover चलाती हैं जो पॉइंटर चलाता है: क्रॉस लाइन, डॉट और tooltip `pointer` spring पर सरकते हैं, pie का स्लाइस उठता है, `onHoverChange` पंक्ति की सूचना देता है, और स्क्रीन रीडर वह `accessibilityValue` पढ़ते हैं जो ऐप उसके लिए देता है। इसका फ़ोकस रिंग ऐप का होता है: `focus-visible:` क्लास या `focusStyle` (`focus-visible:outline-2 focus-visible:outline-ring`)।

| Keys | क्या करती हैं |
|---|---|
| Right, Left | उस ओर की पंक्ति पर जाएँ: अगली या पिछली पंक्ति, उलटे x स्केल पर इसका उलटा, जिसकी पहली पंक्ति दाईं ओर होती है (pie पर, उसके स्लाइस पंक्तियों के क्रम में; sankey पर, उसके नोड; treemap पर, स्क्रीन पर बगल वाला leaf, जैसा Up और Down करते हैं); जब कोई पंक्ति hover में न हो, Right बाएँ सिरे की पंक्ति से शुरू करता है और Left दाएँ सिरे की पंक्ति से (pie पर, पहला और आखिरी स्लाइस)। |
| Home, End | पहली या आखिरी पंक्ति पर जाएँ। |
| Up, Down | सेल पर: उसी कॉलम में ऊपर या नीचे के सेल पर जाएँ। सेल पर कीज़ स्क्रीन पर ग्रिड का अनुसरण करती हैं (WAI-ARIA का data grid): Right और Left लाइन में अगले सेल पर जाती हैं, Home और End लाइन के पहले और आखिरी सेल पर; जब कोई सेल hover में न हो, पहली की सबसे ऊपर-बाएँ सेल से शुरू करती है (Left, Up और End सबसे नीचे-दाएँ से)। किनारे पर hover वहीं रहता है। |
| Escape | hover हटा देता है। |

प्लॉट अपनी कीज़ का जवाब तब तक देता है जब तक उस पर फ़ोकस है, और Escape का तब जब कोई पंक्ति hover में हो; बाकी समय वे ऐप और आसपास के views तक जाती हैं। फ़ोकस हटाने पर कीज़ से बना hover साफ़ हो जाता है। प्लॉट कोई प्रेस नहीं लेता, इसलिए pressable कार्ड के अंदर का प्लॉट प्रेस कार्ड के लिए छोड़ देता है। स्क्रीन रीडर भी पंक्तियों में आगे बढ़ते हैं: VoiceOver का swipe up और down, TalkBack का scroll forward और back, और हर वह स्क्रीन रीडर जो element के `increment` और `decrement` actions देता है, अगली और पिछली पंक्ति पर जाते हैं, उलटे स्केल पर भी पंक्तियों के क्रम में।

## Building charts

चार्ट एक प्लॉट, उसके मार्क्स, उसके अक्ष और उनके आसपास ऐप के अपने elements से बनता है। y स्केल को `domain` दें और उसके अक्ष को ग्रिड के मान दें (`tickValues`): तब हर label अपनी ग्रिड लाइन पर बैठता है। Hover की क्रॉस लाइन, डॉट और tooltip प्लॉट के हिस्से हैं, जिन्हें ऐप स्टाइल करता और भरता है; पंक्ति के मान वहाँ जाते हैं जहाँ ऐप उन्हें दिखाता है।

ग्रिड ठोस बारीक लाइनों और थोड़ी गहरी आधार रेखा के रूप में सबसे अच्छे पढ़े जाते हैं, जिससे dashed लाइन किसी संदर्भ मान के लिए खाली रहती है (नीचे का ओपनिंग प्राइस)। एरिया सपाट भराव की बजाय ऐसी धुलाई के रूप में हल्का पढ़ा जाता है जो अपनी आधार रेखा की ओर फीकी पड़ती जाती है। हर series का hover डॉट अपनी series का रंग लेता है, और अपनी रिंग के रूप में उस सतह का रंग जिस पर चार्ट बैठा है, ताकि वह अपनी लाइन से कटा हुआ दिखे, और tooltip प्लॉट के शीर्ष पर बैठता है, पहली और आखिरी पंक्तियों पर उसके किनारों के भीतर: सबसे ऊँचे मान के ऊपर जगह वाला `domain` उसे लाइन से दूर रखता है।

```tsx
import { signal, Text, View } from "nsh";
import { Area, Grid, Line, Plot, PlotAxis } from "nsh/base/plot";

type Row = { time: string; price: number };

export function PriceChart(props: { rows: Row[]; low: number; high: number }) {
  const hovered = signal<number | null>(null);
  const shown = () => props.rows[hovered() ?? props.rows.length - 1];
  const middle = () => (props.low + props.high) / 2;
  return (
    <View class="gap-3 rounded-xl border border-border bg-card p-4">
      {/* The value of the row under the pointer, or the last one. */}
      <View class="flex-row items-baseline">
        <Text class="flex-1 text-sm text-muted-foreground">{shown().time}</Text>
        <Text class="text-right text-xl font-semibold tabular-nums text-foreground">{shown().price.toFixed(2)}</Text>
      </View>
      <Plot
        data={props.rows}
        y="price"
        yScale={{ type: "linear", domain: [props.low, props.high] }}
        accessibilityLabel={`Price, from ${props.rows[0].price} to ${props.rows[props.rows.length - 1].price}`}
        accessibilityValue={{ text: `${shown().time}, ${shown().price.toFixed(2)}` }}
        appearGeneration={props.rows.length}
        motion={{ appear: { duration: 600, easing: "easeOut" }, enter: { duration: 120 }, exit: { duration: 160 }, pointer: { stiffness: 300, damping: 30 } }}
        crossLineClass="w-px h-full bg-muted-foreground/50"
        tooltipOffset={4}
        tooltipContent={
          <View class="flex-row items-center gap-1.5 rounded-lg border border-border bg-popover px-2 py-1 shadow-md">
            <View class="h-0.5 w-2.5 rounded-full bg-chart-1" />
            <Text class="text-xs tabular-nums text-popover-foreground">{shown().price.toFixed(2)}</Text>
          </View>
        }
        onHoverChange={({ index }) => hovered.set(index)}
        class="mr-10 mb-6 h-48"
      >
        <Grid y={[middle(), props.high]} class="stroke-border" />
        {/* A wash that fades out toward the baseline. */}
        <Area backgroundClass="bg-linear-to-b from-chart-1/20 to-transparent" />
        <Grid y={[props.low]} class="stroke-muted-foreground/40" />
        <Grid y={[props.rows[0].price]} class="stroke-muted-foreground" style={{ strokeDasharray: "3 3" }} />
        <Line class="stroke-chart-1 stroke-2" hoverDotClass="size-2.5 rounded-full border-2 border-card bg-chart-1" />
        {/* The grid's values right of the plot, and the first and last times under it. */}
        <PlotAxis
          placement="right"
          tickValues={[props.low, middle(), props.high]}
          format={(v) => v.toFixed(0)}
          labelClass="pl-2 text-xs tabular-nums text-muted-foreground"
        />
        <PlotAxis
          tickValues={[0, props.rows.length - 1]}
          format={(i) => props.rows[i].time}
          labelClass="pt-2 text-xs text-muted-foreground"
        />
      </Plot>
    </View>
  );
}
```

बार चार्ट तब सबसे अच्छा पढ़ा जाता है जब उसके बारों के सिरे गोल और आधार चौकोर हों (`cornerRadii={{ topLeft: 4,
topRight: 4 }}`; in a stack only on its top bar), a hair of room between the bars of a band (`groupPadding`), जब एक पंक्ति hover में हो तो बाकी पंक्तियों के बार फीके हों (`inactiveOpacity`) और उसका बैंड रंगा हुआ हो (`crossLineClass`), और मान बारों के ऊपर छोटे tabular अंकों में हों, स्टैक पर कुल के साथ। `paddingOuter` को `paddingInner` का आधा रखने पर बैंड के मध्य बराबर कदमों पर पड़ते हैं, और `PlotAxis` हर महीने को उसके बैंड के नीचे केंद्रित करता है; `maxBandWidth` चौड़े कार्ड में कुछ बारों को पतला रखता है।

```tsx
import { signal, Text, View } from "nsh";
import { Bar, Grid, Plot, PlotAxis } from "nsh/base/plot";

type Sale = { month: string; online: number; store: number };

export function SalesChart(props: { rows: Sale[]; stacked: boolean }) {
  const hovered = signal<number | null>(null);
  const shown = () => props.rows[hovered() ?? props.rows.length - 1];
  const tip = { topLeft: 4, topRight: 4 };
  return (
    <View class="gap-3 rounded-xl border border-border bg-card p-4">
      <View class="flex-row items-baseline">
        <Text class="flex-1 text-sm text-muted-foreground">{shown().month}</Text>
        <Text class="text-right text-sm tabular-nums text-foreground">{`${shown().online + shown().store}k`}</Text>
      </View>
      <Plot
        data={props.rows}
        xScale={{ type: "band", paddingInner: 0.3, paddingOuter: 0.15, maxBandWidth: 56, groupPadding: 0.1 }}
        yScale={{ type: "linear", domain: [0, 130] }}
        accessibilityLabel="Sales per month, online and in store"
        appearGeneration={props.stacked ? 1 : 0}
        motion={{ appear: { duration: 600, easing: "easeOut" }, enter: { duration: 150 }, exit: { duration: 150 }, pointer: { stiffness: 320, damping: 32 } }}
        crossLineClass="w-full h-full bg-foreground/5"
        onHoverChange={({ index }) => hovered.set(index)}
        class="mb-6 h-44"
      >
        <Grid y={[40, 80, 120]} class="stroke-border" />
        <Bar
          value="online"
          stack={props.stacked ? "sales" : undefined}
          cornerRadii={props.stacked ? 0 : tip}
          stagger={0.4}
          inactiveOpacity={0.45}
          label={props.stacked ? undefined : "online"}
          labelClass="pb-1 text-[11px] tabular-nums text-muted-foreground"
          class="fill-chart-1"
        />
        <Bar
          value="store"
          stack={props.stacked ? "sales" : undefined}
          cornerRadii={tip}
          stagger={0.4}
          inactiveOpacity={0.45}
          label={props.stacked ? (d) => String(d.online + d.store) : "store"}
          labelClass="pb-1 text-[11px] tabular-nums text-muted-foreground"
          class="fill-chart-2"
        />
        {/* A month centered under each band. */}
        <PlotAxis format={(i) => props.rows[i].month} labelClass="pt-2 text-xs text-muted-foreground" />
      </Plot>
    </View>
  );
}
```

सूची की पंक्ति में sparkline `interactive={false}` वाला प्लॉट है: यह अपने मार्क्स खींचता है और किसी पॉइंटर का अनुसरण नहीं करता।

## Accessibility

- स्क्रीन रीडर के लिए प्लॉट एक element है, जिसकी image role और ऐप का `accessibilityLabel` है; उसके मार्क्स, उसके अक्षों के labels, उसके `PlotLabel` और hover के हिस्से उसी के हिस्से हैं और खुद कुछ नहीं कहते। label में बताएँ कि चार्ट क्या दिखाता है और क्या अलग दिखता है (रेंज, सबसे ऊँचा मान), और `accessibilityValue` को पॉइंटर के नीचे की पंक्ति के शब्द दें, ताकि स्क्रीन रीडर मान बदलते समय उसे बोले।
- पॉइंटर के नीचे की पंक्ति की सूचना `onHoverChange` से उन प्लैटफ़ॉर्म पर दी जाती है जिनमें पॉइंटर होता है (डेस्कटॉप, वेब, ट्रैकपैड वाला iPad)। टच स्क्रीन hover की सूचना नहीं देतीं: टच उपयोगकर्ता को जो मान चाहिए उन्हें ऐप के अपने elements में दिखाएँ, या जहाँ संख्याएँ मायने रखती हैं वहाँ पंक्तियाँ टेक्स्ट या सूची के रूप में दें।
- Pie पर बताई गई पंक्ति पॉइंटर के नीचे वाले स्लाइस की होती है: `accessibilityValue` को उसका नाम, मान और हिस्सा दें (`"Team, 340 seats, 34.0%"`), और label में कुल और सबसे बड़ा हिस्सा बताएँ। Radar पर यह पॉइंटर के सबसे पास वाला अक्ष होता है: उसे अक्ष का नाम और वहाँ हर series का मान दें।
- इंटरैक्टिव प्लॉट कीबोर्ड फ़ोकस का एक पड़ाव है जिसकी arrow कीज़ hover को चलाती हैं ([Keyboard](#keyboard)), और वह स्क्रीन रीडर को पंक्तियों में आगे बढ़ने के लिए `increment` और `decrement` देता है (VoiceOver इसे adjustable के रूप में पढ़ता है); `interactive={false}` वाला प्लॉट इनमें से कुछ नहीं है, और दोनों स्थितियों में वह कोई प्रेस नहीं लेता।

labels और roles के बारे में सामान्य जानकारी के लिए [Accessibility](../docs/accessibility.md) देखें।
<a id="platform-notes"></a>

## प्लेटफ़ॉर्म नोट्स

- हर platform marks को एक ही तरीके से draw करता है, हर mark के लिए Rust में record की गई एक drawing से; rows में बदलाव होने पर उन marks को, जो उन्हें पढ़ते हैं, एक batch में फिर से draw किया जाता है, और किसी paint class में बदलाव (appearance, `dark:`) होने पर drawing को बिना record किए दोबारा भेजा जाता है।
- appear lines और areas को clip करता है और bars को उन values से बढ़ाता है जिन्हें platform का animator चलाता है; hover की गई row से किसी bar का फीका पड़ना एक opacity है जिसे animator hover की जगह से निकालता है; hover के हिस्से ऐसे views हैं जिन्हें animator चलाता और फीका करता है, और वह plot के आकार और tooltip के आकार से tooltip को plot के भीतर रखता है।
- किसी area का background उसके अपने canvas में draw किया जाता है, area के आकार तक clip करके, उसी gradient के साथ जो platform किसी view के `bg-linear-*` के लिए draw करता है; उसकी classes में बदलाव (appearance, `dark:`) होने पर drawing को बिना record किए दोबारा भेजा जाता है।
- एक pie हर slice को उसके अपने canvas में draw करता है; pointer के नीचे वाला slice Rust में slices के कोणों और radii से खोजा जाता है, उसका उठना एक radius है और बाकियों का फीका पड़ना एक opacity, जिन्हें animator चलाता है, और appear का sweep slices के कोणों को उसी तरह चलाता है, इसलिए दोनों में से कोई भी drawing को दोबारा record नहीं करता।
- किसी radial line की pointer के नीचे वाली row Rust में उसके points के कोणों से खोजी जाती है; उसका hover dot एक view है जिसे animator pointer के नीचे वाली row पर रखता है (keys के बदलने पर `pointer` spring पर सरकता हुआ), और जब वह appear हो रही हो या नई values पर जा रही हो, तब उसके points ऐसी संख्याएँ होते हैं जिन्हें animator उनकी पिछली जगह से चलाता है, इसलिए line हर बदलाव पर एक बार record होती है।
- एक dot mark एक canvas में draw किया जाता है; pointer के नीचे वाला dot Rust में dots के केंद्रों और radii से खोजा जाता है, और उसका hover dot एक view है जिसे animator उसी पर रखता है, उसी जितना बड़ा; appear की वृद्धि, किसी बदलाव की गतियाँ और hover का फीका पड़ना ऐसी values हैं जिन्हें animator चलाता है, इसलिए dots हर बदलाव पर एक बार record होते हैं।
- एक cell mark एक canvas में draw किया जाता है; pointer के नीचे वाला cell Rust में cells के boxes से खोजा जाता है, और उसका hover cell एक view है जिसे animator उसी पर रखता है; वृद्धि, किसी बदलाव के रंग और गतियाँ, और hover का फीका पड़ना ऐसी values हैं जिन्हें animator चलाता है, इसलिए cells हर बदलाव पर एक बार record होते हैं। हर label platform का अपना एक text है, जो वहाँ दिखाया जाता है जहाँ उसका laid-out आकार उसके cell के भीतर समा जाए।
- किसी axis के labels, tick marks और line platform के अपने texts और views हैं, जिन्हें layout Rust में plot के आकार और scales से रखता है: plot का आकार बदलने पर वे marks के साथ चलते हैं, और नया domain labels को फिर से लिखता है।
