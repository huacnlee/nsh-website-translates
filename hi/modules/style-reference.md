---
title: "स्टाइल संदर्भ"
description: "NSH द्वारा स्वीकार की जाने वाली प्रत्येक स्टाइल कुंजी, LayoutStyle, ViewStyle, TextStyle, InputStyle और ImageStyle के अनुसार समूहीकृत, उसके प्रकार और अर्थ के साथ।"
order: 16
source_hash: 012ce37fb9fe065c
---

# Style reference

यह पेज `style` prop की हर key और Rust में उसे सेट करने वाली `Styled` की method की सूची देता है। Rust कॉम्पोनेंट typed methods से एलिमेंट को स्टाइल करते हैं, जिनके नाम Tailwind की utilities (`.p_4()`, `.rounded(px(12.0))`, `.bg(color)`, `nsh_core::prelude` से) पर रखे गए हैं और जो उन्हीं keys में बदल जाती हैं; TSX `style` ऑब्जेक्ट (और classes) पास करता है। Rust कॉलम method का नाम बताता है; ज़्यादातर methods को वैल्यू, signal या closure दी जा सकती है, और `.style_when(…)` / `.style_with(…)` इनमें से किसी को भी सशर्त बना देते हैं। keys और उनके types `.nsh/types/nsh/types.d.ts` में जनरेट किए गए declarations से आते हैं, इसलिए आपका एडिटर टाइप करते समय ही उन्हें जाँच लेता है। style key का मतलब उसी नाम की CSS property है, ठीक वैसे ही जैसे उसे सेट करने वाली class का: `paddingLeft` CSS का `padding-left` और `pl-4` है, `boxShadow` `box-shadow` और `shadow-md` है; कुछ keys ऐसे सरल नाम लेती हैं जो ऐप्स लिखते हैं (`padding-inline` के लिए `paddingHorizontal`, `margin-inline-start` के लिए `marginStart`, `line-clamp` के लिए `numberOfLines`)। संख्याएँ points में होती हैं, और CSS की सुविधाएँ भी उपलब्ध हैं: grid, gradients, box shadows, filters, blend modes, outlines, transforms, transitions और keyframe animations।

स्टाइल लागू करने, उन्हें classes के साथ मिलाने और text styles inherit करने के बारे में जानने के लिए [Styling](../docs/styling.md) देखें। class syntax के लिए [Tailwind reference](./tailwind-reference.md) देखें।

<a id="the-five-interfaces"></a>

## पाँच इंटरफ़ेस

हर इंटरफ़ेस अपने पिछले इंटरफ़ेस को बढ़ाता है:

| इंटरफ़ेस | किसे बढ़ाता है | कहाँ उपयोग होता है |
|---|---|---|
| `LayoutStyle` | | हर एलिमेंट का लेआउट (flexbox, grid, आकार, स्पेसिंग, position) |
| `ViewStyle` | `LayoutStyle` | `<View>`, `<Scroll>`, `<List>`, controls और बाकी सभी एलिमेंट |
| `TextStyle` | `ViewStyle` | `<Text>` और `<Input>` (और views, जिनकी text styles उनके अंदर के text तक पहुँचती हैं) |
| `InputStyle` | `TextStyle` | `<Input>`: `placeholderColor` और `caretColor` जोड़ता है |
| `ImageStyle` | `ViewStyle` | `<Image>` |

```rust tabs
use nsh_core::prelude::*;

fn card() -> View {
    view().p_4().rounded(px(12.0)).bg(white()).shadow([BoxShadow {
        offset_y: px(4.0),
        blur: px(12.0),
        color: rgba(0x00000014).into(),
        ..BoxShadow::default()
    }])
}

fn title(label: &str) -> Text {
    text(label.to_string()).text_size(px(17.0)).font_weight(FontWeight::SEMIBOLD).text_color(rgb(0x111111))
}

card().child(title("Hello"))
```

```tsx tabs
import type { ViewStyle, TextStyle } from "nsh";
import { Text, View } from "nsh";

const card: ViewStyle = {
  padding: 16,
  borderRadius: 12,
  backgroundColor: "#fff",
  boxShadow: "0 4px 12px rgb(0 0 0 / 0.08)",
};

const title: TextStyle = { fontSize: 17, fontWeight: "600", color: "#111" };

<View style={card}>
  <Text style={title}>Hello</Text>
</View>;
```

`style` एक array भी लेता है; entries बाएँ से दाएँ merge होती हैं और falsy entries छोड़ दी जाती हैं, इसलिए सशर्त styles के लिए spread की ज़रूरत नहीं पड़ती। Rust में, `.style_when(condition, …)` शर्त के सही रहने तक styles जोड़ता है:

```rust tabs
card().style_when(selected, |s| s.border_color(rgb(0x2563eb)).border(px(2.0)))
```

```tsx tabs
<View style={[card, selected() && { borderColor: "#2563eb", borderWidth: 2 }]} />
```

> [!NOTE]
> inline `style` हमेशा `class` पर भारी पड़ता है। किसी key को `null` या `undefined` पर सेट करने से वह अपने डिफ़ॉल्ट पर लौट आती है।

<a id="how-style-keys-read"></a>

## style keys का अर्थ कैसे समझें

style keys CSS का अनुसरण करती हैं, इसलिए एक ही property का नाम लेने वाली style और class एक जैसा काम करती हैं:

- **लेआउट की दिशा।** जो view `display` सेट नहीं करता, वह अपने children को column में रखता है। `display: "flex"` एक row होता है, जब तक `flexDirection` सेट न हो, जैसा CSS और `flex` class में होता है। `flexShrink` `0` होता है, जब तक सेट न किया जाए।
- **भौतिक और तार्किक सिरे।** `left`, `right`, `marginLeft`, `paddingRight`, `borderLeftWidth`, `borderTopLeftRadius` और `textAlign: "left"` right-to-left लेआउट में भी अपना सिरा बनाए रखते हैं। start और end keys (`marginStart`, `paddingEnd`, `start`, `end`, `borderStartWidth`, ...), `borderTopStartRadius` परिवार और `textAlign: "start" | "end"` दिशा का अनुसरण करते हैं: inline start left-to-right लेआउट में बायाँ और right-to-left लेआउट में दायाँ होता है।
- **Border के रंग।** जिस border या outline की चौड़ाई सेट है पर रंग नहीं, वह text के रंग में बनता है (CSS का `currentColor`)।
- **Transforms।** `translate`, `rotate` और `scale` अपने-आप में अलग properties हैं, और `transform` CSS की functions वाली string या steps की सूची लेता है, जिनकी मात्राएँ animated values हो सकती हैं। वे इसी क्रम में जुड़ते हैं: `translate`, `rotate`, `scale`, फिर `transform`।

## Value types

| Type | क्या स्वीकार करता है | Rust |
|---|---|---|
| `number` | Points (density-independent)। `1` iOS पर एक point और Android पर एक dp होता है। | `Points`: `px(16.0)` |
| `DimensionValue` | `number` (points), `` `${number}%` `` (parent का), या `"auto"`। | `Length`: `px(…)`, `relative(0.5)`, `auto()` |
| `LengthValue` | `number` (points) या `` `${number}%` ``। `"auto"` नहीं। | `DefiniteLength`: `px(…)`, `relative(0.5)` |
| `ColorValue` | CSS रंग की string: `#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa`, `rgb()`, `rgba()`, `hsl()`, `hsla()`, `oklch()`, `oklab()`, या CSS का कोई named color (`black`, `white`, `transparent`, `rebeccapurple`, ...)। | `Hsla` / `AdaptiveColor`: `rgb(0x2563eb)`, `hsla(…)`, theme colors (`theme().primary`) |
| `EnvValue` | padding या margin में environment variable: `env(name)`, `env(name, <length>)` (अज्ञात नाम की जगह length इस्तेमाल होती है), `calc(env(name) + <length>)` या `calc(<length> + env(name))`। नाम हैं `safe-area-inset-top`, `-right`, `-bottom`, `-left` ([Safe area](../elements/safe-area.md)) और `keyboard-inset-height` ([Keyboard](../elements/keyboard.md))। भौतिक padding और margin keys और उनके shorthands इसे स्वीकार करते हैं। | `.p_safe_area()`, `.pt_safe_area_plus(px(8.0))`, `.pb_keyboard()`, `.mb_keyboard_plus(…)`, ... |
| `AnimatedNode` | एक native animated value या उससे बना node (देखें [`nsh` का animation API](./nsh.md#animation))। `opacity`, `backgroundColor`, `borderColor`, `color`, `translate`, `rotate`, `scale`, `transform` सूची के steps, और sticky view के `top` / `left` इसे स्वीकार करते हैं; तब वैल्यू JS के बिना UI thread पर animate होती है। | `AnimatedValue` / `AnimatedNode`, `.bind_opacity(&v)`, `.bind_background(&v)`, `.bind_border_color(&v)`, `.bind_color(&v)`, `.bind_translate_x(&v)`, ... से bind की जाती है |

CSS syntax वाली strings (`boxShadow`, `textShadow`, `backgroundImage`, `filter`, `gridTemplateColumns`, ...) में lengths `px` और सादी संख्याओं (दोनों points), `pt` (एक point का 4/3, जैसा CSS में), या `rem` (16 points) में दी जाती हैं।

## LayoutStyle

लेआउट Rust में कंप्यूट होता है (flexbox और CSS grid)। जो view `display` सेट नहीं करता, वह एक flex container है जिसके children column में जमते हैं; `display: "flex"` उसे row बना देता है, जब तक `flexDirection` सेट न हो, जैसा CSS में होता है। एलिमेंट का डिफ़ॉल्ट `flexShrink: 0`, `alignContent: "flex-start"` (grids में: CSS का `"normal"`), `alignItems: "stretch"` होता है, और कोई स्वचालित न्यूनतम आकार नहीं होता। देखें [Layout](../docs/layout.md)।

<a id="display-and-position"></a>

### Display और position

| Key | Type | Rust | विवरण |
|---|---|---|---|
| `display` | `"flex" \| "grid" \| "block" \| "flow-root" \| "none"` | `.flex()`, `.grid()`, `.hidden()` | children का लेआउट। `"flex"` उन्हें row में रखता है, जब तक `flexDirection` कोई दिशा तय न करे, जैसा CSS में होता है; जो view display सेट नहीं करता वह उन्हें column में रखता है। `"none"` एलिमेंट को लेआउट से हटा देता है और छिपा देता है। `"block"` children को वैसे ही जमाता है जैसे CSS block layout जमाता है। |
| `boxSizing` | `"border-box" \| "content-box"` | | आयामों में border और padding शामिल होते हैं, या केवल content। डिफ़ॉल्ट `"border-box"`। |
| `position` | `"relative" \| "absolute" \| "static" \| "fixed" \| "sticky"` | `.relative()`, `.absolute()` | `"absolute"` एलिमेंट को flow से बाहर निकालता है और उसे अपने सबसे नज़दीकी positioned ancestor के सापेक्ष `top` / `right` / `bottom` / `left` से रखता है (उसका parent, जब तक वह `"static"` न हो)। `"static"` flow में रहता है और insets को अनदेखा करता है। `"fixed"` एलिमेंट का type बनाए रखता है और उसे उसकी surface या modal root में लेआउट और mount करता है, ताकि आसपास की content के scroll होने पर भी वह अपनी जगह बना रहे। `"sticky"` flow में रहता है और, जब तक उसका parent दिखाई दे, अपने आसपास के scroll view के viewport की शुरुआत से `top` (horizontal scroll view में `left`) पर चिपका रहता है, जब तक उसका अंत parent के content box के अंत से न मिल जाए; यह उसी `zIndex` वाले अपने siblings के ऊपर बनता है। डिफ़ॉल्ट `"relative"`। |
| `top` | `DimensionValue \| AnimatedNode` | `.top(…)`, `.inset(…)`, `.bind_sticky_top(&node)` | parent के ऊपरी किनारे से (absolute) या एलिमेंट की अपनी position से (relative) offset। sticky view पर, यह वह जगह तय करता है जहाँ वह चिपकता है, जिसे animated value हर frame पर हिलाती है। |
| `right` | `DimensionValue` | `.right(…)` | दाएँ किनारे से offset, किसी भी दिशा में। |
| `bottom` | `DimensionValue` | `.bottom(…)` | निचले किनारे से offset। |
| `left` | `DimensionValue \| AnimatedNode` | `.left(…)`, `.bind_sticky_left(&node)` | बाएँ किनारे से offset, किसी भी दिशा में। horizontal scroll view में sticky view पर, यह वह जगह तय करता है जहाँ वह चिपकता है, जिसे animated value हर frame पर हिलाती है। |
| `start` | `DimensionValue` | | inline start किनारे से offset: left-to-right लेआउट में बायाँ, right-to-left में दायाँ। |
| `end` | `DimensionValue` | | inline end किनारे से offset: left-to-right लेआउट में दायाँ, right-to-left में बायाँ। |
| `zIndex` | `number` | `.z_index(z)` | siblings के बीच क्रम (बराबर वैल्यू के लिए stable); साथ ही native stacking order भी। |
| `direction` | `"inherit" \| "ltr" \| "rtl"` | | लेआउट की दिशा, डिफ़ॉल्ट रूप से inherit होती है। CSS की तरह, `left` और `right` properties right to left में भी अपने सिरे बनाए रखती हैं, जबकि inline start / end वाली (`marginStart`, `end`, ...) वे सिरे लेती हैं जो दिशा उन्हें देती है। |

### Flexbox

| Key | Type | Rust | विवरण |
|---|---|---|---|
| `flexDirection` | `"row" \| "column" \| "row-reverse" \| "column-reverse"` | `.flex_row()`, `.flex_col()`, `.flex_row_reverse()`, `.flex_col_reverse()` | मुख्य अक्ष। जो view `display` सेट नहीं करता उसके लिए डिफ़ॉल्ट `"column"`, और `display: "flex"` सेट होने पर `"row"`। |
| `flexWrap` | `"wrap" \| "nowrap" \| "wrap-reverse"` | `.flex_wrap()` | children कई पंक्तियों में wrap होंगे या नहीं। डिफ़ॉल्ट `"nowrap"`। |
| `flex` | `number` | `.flex_1()`, `.flex_auto()`, `.flex_none()` | एक संख्या, CSS का shorthand नहीं: धनात्मक संख्या `flexGrow` को वही मान देती है, साथ में `flexShrink: 1` और `flexBasis: 0`; `0` एलिमेंट को अलचीला बना देता है; ऋणात्मक संख्या उसे उसके न्यूनतम आकार तक सिकोड़ती है। |
| `flexGrow` | `number` | `.flex_grow(f)` | एलिमेंट खाली जगह का कितना हिस्सा लेता है। डिफ़ॉल्ट `0`। |
| `flexShrink` | `number` | `.flex_shrink(f)`, `.flex_shrink_0()` | जगह कम पड़ने पर एलिमेंट कितना सिकुड़ता है। डिफ़ॉल्ट `0`, CSS की तरह `1` नहीं। |
| `flexBasis` | `DimensionValue` | `.basis(…)` | खाली जगह बाँटे जाने से पहले का मुख्य-अक्ष आकार। |
| `justifyContent` | `"flex-start" \| "flex-end" \| "start" \| "end" \| "center" \| "space-between" \| "space-around" \| "space-evenly" \| "stretch" \| "normal"` | `.justify_start()`, `.justify_center()`, `.justify_end()`, `.justify_between()`, `.justify_around()`, `.justify_evenly()` | मुख्य अक्ष पर children का वितरण। डिफ़ॉल्ट `"normal"`: flex containers में `"flex-start"`; grids में `auto` आकार वाले tracks फैल जाते हैं। |
| `alignItems` | `"flex-start" \| "flex-end" \| "start" \| "end" \| "self-start" \| "self-end" \| "center" \| "stretch" \| "baseline" \| "normal"` | `.items_start()`, `.items_center()`, `.items_end()`, `.items_stretch()`, `.items_baseline()` | cross अक्ष पर children का संरेखण। डिफ़ॉल्ट `"stretch"`। |
| `alignSelf` | `"auto" \| "flex-start" \| "flex-end" \| "start" \| "end" \| "self-start" \| "self-end" \| "center" \| "stretch" \| "baseline" \| "normal"` | `.self_start()`, `.self_center()`, `.self_end()`, `.self_stretch()` | इस एलिमेंट के लिए parent के `alignItems` को override करता है। |
| `alignContent` | `"flex-start" \| "flex-end" \| "start" \| "end" \| "center" \| "stretch" \| "space-between" \| "space-around" \| "space-evenly" \| "normal"` | `.content_start()`, `.content_center()`, `.content_between()`, … | cross अक्ष पर wrap हुई पंक्तियों (और grid tracks) का वितरण। flex containers में डिफ़ॉल्ट `"flex-start"` और grids में `"normal"`, जहाँ `auto` आकार वाले tracks फैल जाते हैं। `"start"` / `"end"` लेखन की दिशा का अनुसरण करते हैं। |
| `gap` | `LengthValue` | `.gap(…)`, `.gap_4()` | children की rows और columns के बीच की जगह। |
| `rowGap` | `LengthValue` | `.gap_y(…)` | rows के बीच की जगह। |
| `columnGap` | `LengthValue` | `.gap_x(…)` | columns के बीच की जगह। |

### Grid

children को CSS grid में रखने के लिए `display: "grid"` सेट करें। Track सूचियाँ CSS syntax का उपयोग करती हैं।

| Key | Type | Rust | विवरण |
|---|---|---|---|
| `gridTemplateColumns` | `string` | `.grid_template_columns(…)`, `.grid_cols(n)` | Column tracks: `"repeat(3, 1fr)"`, `"200px 1fr"`, `minmax()`, `auto-fill` / `auto-fit`, line names (`"[a] 40px [b c] 1fr [d]"`)। |
| `gridTemplateRows` | `string` | `.grid_template_rows(…)`, `.grid_rows(n)` | Row tracks, वही syntax। |
| `gridAutoColumns` | `string` | | अपने-आप बने columns का आकार। |
| `gridAutoRows` | `string` | | अपने-आप बनी rows का आकार। |
| `gridAutoFlow` | `"row" \| "column" \| "dense" \| "row dense" \| "column dense"` | `.grid_flow_col()`, `.grid_flow_dense()` | बिना placement वाले items grid को कैसे भरते हैं। |
| `gridColumn` | `number \| string` | `.col_span(n)`, `.col_span_full()` | Column placement: `"1 / 3"`, `"span 2"`, line number या line name (`"content-start / content-end"`, `"2 col"`, `"span col"`)। |
| `gridColumnStart` | `number \| string` | `.col_start(…)` | शुरुआती column line। |
| `gridColumnEnd` | `number \| string` | `.col_end(…)` | अंतिम column line। |
| `gridRow` | `number \| string` | `.row_span(n)`, `.row_span_full()` | Row placement, `gridColumn` जैसा ही syntax। |
| `gridRowStart` | `number \| string` | `.row_start(…)` | शुरुआती row line। |
| `gridRowEnd` | `number \| string` | `.row_end(…)` | अंतिम row line। |
| `justifyItems` | `"flex-start" \| "flex-end" \| "start" \| "end" \| "self-start" \| "self-end" \| "center" \| "stretch" \| "baseline" \| "normal"` | | grid items row के अनुदिश अपने areas में कैसे बैठते हैं। |
| `justifySelf` | `"auto" \| "flex-start" \| "flex-end" \| "start" \| "end" \| "self-start" \| "self-end" \| "center" \| "stretch" \| "baseline" \| "normal"` | | इस item के लिए `justifyItems` को override करता है। |

```rust tabs
view()
    .grid()
    .grid_template_columns("repeat(3, 1fr)")
    .gap_2()
    .child(view().col_span(2).h(px(60.0)).bg(rgb(0xc7d2fe)))
    .child(view().h(px(60.0)).bg(rgb(0xa5b4fc)))
```

```tsx tabs
<View style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
  <View style={{ gridColumn: "span 2", height: 60, backgroundColor: "#c7d2fe" }} />
  <View style={{ height: 60, backgroundColor: "#a5b4fc" }} />
</View>
```

### Size

| Key | Type | Rust | विवरण |
|---|---|---|---|
| `width` | `DimensionValue` | `.w(…)`, `.w_full()`, `.size(…)` | चौड़ाई। |
| `height` | `DimensionValue` | `.h(…)`, `.h_full()` | ऊँचाई। |
| `minWidth` | `LengthValue` | `.min_w(…)` | न्यूनतम चौड़ाई। |
| `minHeight` | `LengthValue` | `.min_h(…)` | न्यूनतम ऊँचाई। |
| `maxWidth` | `LengthValue` | `.max_w(…)` | अधिकतम चौड़ाई। |
| `maxHeight` | `LengthValue` | `.max_h(…)` | अधिकतम ऊँचाई। |
| `aspectRatio` | `number \| "auto" \| "16 / 9"` | `.aspect_ratio(r)`, `.aspect_square()` | चौड़ाई को ऊँचाई से भाग देने पर मिला मान, एक संख्या (`1.5`) या CSS का ratio (`"16 / 9"`); छूटा हुआ आयाम दूसरे से निकाला जाता है। `"auto"` कुछ भी सेट नहीं करता। |

### Margin

Margins `"auto"` (खाली जगह सोख लेता है, जैसा flexbox में) और ऋणात्मक मान स्वीकार करते हैं। भौतिक keys (`marginStart` / `marginEnd` को छोड़कर सभी) `EnvValue` भी लेती हैं: `marginBottom: "env(keyboard-inset-height)"` (Rust `.mb_keyboard()`, `.mt_safe_area()`, ...)।

| Key | Type | Rust | विवरण |
|---|---|---|---|
| `margin` | `DimensionValue \| EnvValue` | `.m(…)`, `.m_4()` | चारों ओर। |
| `marginHorizontal` | `DimensionValue \| EnvValue` | `.mx(…)` | बायाँ और दायाँ। |
| `marginVertical` | `DimensionValue \| EnvValue` | `.my(…)` | ऊपर और नीचे। |
| `marginTop` | `DimensionValue \| EnvValue` | `.mt(…)` | ऊपर। |
| `marginRight` | `DimensionValue \| EnvValue` | `.mr(…)` | दायाँ। |
| `marginBottom` | `DimensionValue \| EnvValue` | `.mb(…)` | नीचे। |
| `marginLeft` | `DimensionValue \| EnvValue` | `.ml(…)` | बायाँ। |
| `marginStart` | `DimensionValue` | `.ms(…)` | Inline start: left-to-right लेआउट में बायाँ, right-to-left में दायाँ। |
| `marginEnd` | `DimensionValue` | `.me(…)` | Inline end: `marginStart` का विपरीत सिरा। |

### Padding

भौतिक keys (`paddingStart` / `paddingEnd` को छोड़कर सभी) `EnvValue` भी लेती हैं: `paddingTop: "env(safe-area-inset-top)"`, `paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)"` (Rust `.pt_safe_area()`, `.pb_safe_area_plus(px(16.0))`, `.pb_keyboard()`, ...)। Padding कम से कम 0 होता है।

| Key | Type | Rust | विवरण |
|---|---|---|---|
| `padding` | `LengthValue \| EnvValue` | `.p(…)`, `.p_4()` | चारों ओर। |
| `paddingHorizontal` | `LengthValue \| EnvValue` | `.px(…)` | बायाँ और दायाँ। |
| `paddingVertical` | `LengthValue \| EnvValue` | `.py(…)` | ऊपर और नीचे। |
| `paddingTop` | `LengthValue \| EnvValue` | `.pt(…)` | ऊपर। |
| `paddingRight` | `LengthValue \| EnvValue` | `.pr(…)` | दायाँ। |
| `paddingBottom` | `LengthValue \| EnvValue` | `.pb(…)` | नीचे। |
| `paddingLeft` | `LengthValue \| EnvValue` | `.pl(…)` | बायाँ। |
| `paddingStart` | `LengthValue` | `.ps(…)` | Inline start: left-to-right लेआउट में बायाँ, right-to-left में दायाँ। |
| `paddingEnd` | `LengthValue` | `.pe(…)` | Inline end: `paddingStart` का विपरीत सिरा। |

## ViewStyle

view द्वारा बनाई जाने वाली हर चीज़। `LayoutStyle` की सभी keys भी लागू होती हैं।

### Background

| Key | Type | Rust | विवरण |
|---|---|---|---|
| `backgroundColor` | `ColorValue \| AnimatedNode` | `.bg(color)`, `.bind_background(&node)` | भरने का रंग। native animated color स्वीकार करता है। |
| `backgroundImage` | `string` | `.bg_linear(angle)`, `.bg_radial()`, `.bg_conic()` के साथ `.gradient_from` / `_via` / `_to` | background color के ऊपर बनने वाले CSS gradients: `linear-gradient(...)`, `radial-gradient(...)`, `conic-gradient(...)`, कई हों तो अल्पविराम से अलग किए हुए। |

```rust tabs
view().h(px(120.0)).rounded(px(16.0)).bg_linear(deg(135.0)).gradient_from(rgb(0x6366f1)).gradient_to(rgb(0xec4899))
```

```tsx tabs
<View style={{ height: 120, borderRadius: 16, backgroundImage: "linear-gradient(135deg, #6366f1, #ec4899)" }} />
```
<a id="borders"></a>

### बॉर्डर

| कुंजी | प्रकार | Rust | विवरण |
|---|---|---|---|
| `borderWidth` | `number` | `.border(w)`, `.border_1()`, `.border_2()` | चारों ओर की चौड़ाई। |
| `borderTopWidth` | `number` | `.border_t(w)` | ऊपर की ओर। |
| `borderRightWidth` | `number` | `.border_r(w)` | दाईं ओर। |
| `borderBottomWidth` | `number` | `.border_b(w)` | नीचे की ओर। |
| `borderLeftWidth` | `number` | `.border_l(w)` | बाईं ओर। |
| `borderStartWidth` | `number` | `.border_s(w)` | इनलाइन आरंभ की ओर (बाएँ-से-दाएँ लेआउट में बाईं, दाएँ-से-बाएँ लेआउट में दाईं)। |
| `borderEndWidth` | `number` | `.border_e(w)` | इनलाइन अंत की ओर। |
| `borderColor` | `ColorValue \| AnimatedNode` | `.border_color(c)`, `.bind_border_color(&node)` | चारों ओर का रंग। native animated color स्वीकार करता है। |
| `borderTopColor` | `ColorValue` | `.border_t_color(c)` | ऊपर की ओर। |
| `borderRightColor` | `ColorValue` | `.border_r_color(c)` | दाईं ओर। |
| `borderBottomColor` | `ColorValue` | `.border_b_color(c)` | नीचे की ओर। |
| `borderLeftColor` | `ColorValue` | `.border_l_color(c)` | बाईं ओर। |
| `borderStartColor` | `ColorValue` | `.border_s_color(c)` | इनलाइन आरंभ की ओर। |
| `borderEndColor` | `ColorValue` | `.border_e_color(c)` | इनलाइन अंत की ओर। |
| `borderStyle` | `"solid" \| "dashed" \| "dotted" \| "none" \| "hidden"` | `.border_solid()`, `.border_dashed()`, `.border_dotted()`, `.border_none()` | रेखा की शैली। डिफ़ॉल्ट `"solid"`। `"none"` और `"hidden"` कोई बॉर्डर नहीं बनाते और न ही लेआउट में जगह घेरते हैं, चाहे चौड़ाई कुछ भी हो और वह पहले सेट की गई हो या बाद में, जैसा CSS में होता है। |

जिस ओर की चौड़ाई सेट है लेकिन रंग कोई सेट नहीं करता, वह टेक्स्ट के रंग में बनती है, यानी CSS का `currentColor`: `{ borderWidth: 1, color: "#2563eb" }` नीले रंग का बॉर्डर बनाता है। आउटलाइन भी इसी तरह टेक्स्ट का रंग लेती हैं।

<a id="corners"></a>

### कोने

| कुंजी | प्रकार | Rust | विवरण |
|---|---|---|---|
| `borderRadius` | `number` | `.rounded(r)`, `.rounded_lg()` | चारों कोनों की त्रिज्या। |
| `borderTopLeftRadius` | `number` | `.rounded_tl(r)` | ऊपर-बायाँ कोना। |
| `borderTopRightRadius` | `number` | `.rounded_tr(r)` | ऊपर-दायाँ कोना। |
| `borderBottomRightRadius` | `number` | `.rounded_br(r)` | नीचे-दायाँ कोना। |
| `borderBottomLeftRadius` | `number` | `.rounded_bl(r)` | नीचे-बायाँ कोना। |
| `borderTopStartRadius` | `number` | `.rounded_ss(r)` | इनलाइन आरंभ की ओर का ऊपरी कोना। |
| `borderTopEndRadius` | `number` | `.rounded_se(r)` | इनलाइन अंत की ओर का ऊपरी कोना। |
| `borderBottomStartRadius` | `number` | `.rounded_es(r)` | इनलाइन आरंभ की ओर का निचला कोना। |
| `borderBottomEndRadius` | `number` | `.rounded_ee(r)` | इनलाइन अंत की ओर का निचला कोना। |
| `borderCurve` | `"circular" \| "continuous"` | `.border_curve(curve)` | `"continuous"`: ऐसे कोने जिनकी वक्रता किनारों में धीरे-धीरे घुल जाती है, जैसे iOS ऐप आइकन। जहाँ बॉक्स बहुत छोटा हो, वहाँ वक्र वृत्ताकार हो जाता है, इसलिए पिल आकार पिल ही रहते हैं। दोनों platforms पर काम करता है। |

<a id="outline"></a>

### आउटलाइन

आउटलाइन बॉर्डर के बाहर बनती है और लेआउट में कोई जगह नहीं लेती।

| कुंजी | प्रकार | Rust | विवरण |
|---|---|---|---|
| `outlineWidth` | `number` | `.outline(w)` | रेखा की चौड़ाई। |
| `outlineColor` | `ColorValue` | `.outline_color(c)` | रेखा का रंग। डिफ़ॉल्ट टेक्स्ट का रंग। |
| `outlineStyle` | `"solid" \| "dashed" \| "dotted" \| "none" \| "hidden"` | `.outline_dashed()`, `.outline_dotted()`, `.outline_none()` | रेखा की शैली। |
| `outlineOffset` | `number` | `.outline_offset(o)` | बॉर्डर के किनारे से दूरी; ऋणात्मक मान इसे अंदर की ओर ले जाते हैं। |

<a id="shadows"></a>

### शैडो

एक view CSS के `boxShadow` से शैडो डालता है: कई लेयर, स्प्रेड और इनसेट शैडो। Transitions इसे एनिमेट करते हैं (`transitionProperty: "boxShadow"`)।

| कुंजी | प्रकार | Rust | विवरण |
|---|---|---|---|
| `boxShadow` | `string \| BoxShadowLayer[]` | `.shadow([BoxShadow { … }])`, `.shadow_md()`, `.shadow_color(c)` | CSS `box-shadow`: ऑफ़सेट, ब्लर, स्प्रेड और रंग, कई लेयर कॉमा से अलग की हुई, भीतरी शैडो के लिए `inset`; या इसकी लेयर संख्याओं के रूप में, `[{ x, y, blur, spread, color, inset }]` (केवल `x` और `y` आवश्यक); बिना रंग वाली लेयर टेक्स्ट के रंग में बनती है, जैसा CSS के `currentColor` में होता है। `.shadow_color(c)` किसी प्रीसेट या `.shadow(…)` की लेयर का रंग बदलता है। |

```rust tabs
view().p_4().rounded(px(12.0)).bg(white()).shadow([
    BoxShadow { offset_y: px(1.0), blur: px(2.0), color: rgba(0x0000000f).into(), ..BoxShadow::default() },
    BoxShadow { offset_y: px(8.0), blur: px(24.0), spread: px(-4.0), color: rgba(0x0000001f).into(), ..BoxShadow::default() },
])
```

```tsx tabs
<View style={{ padding: 16, borderRadius: 12, backgroundColor: "#fff",
  boxShadow: "0 1px 2px rgb(0 0 0 / 0.06), 0 8px 24px -4px rgb(0 0 0 / 0.12)" }} />
```

> [!NOTE]
> Android पर शैडो के लिए बैकग्राउंड ज़रूरी है: पारदर्शी बैकग्राउंड वाला view (उदाहरण के लिए, कुछ नहीं के ऊपर रखा टेक्स्ट) कोई शैडो नहीं डालता। Android की material shadow के लिए style की जगह `android={{ elevation }}` prop का उपयोग करें।

<a id="opacity-visibility-and-overflow"></a>

### ओपेसिटी, दृश्यता और ओवरफ़्लो

| कुंजी | प्रकार | Rust | विवरण |
|---|---|---|---|
| `opacity` | `number \| AnimatedNode` | `.opacity(o)`, `.bind_opacity(&value)` | 0 (अदृश्य) से 1 तक। native animated value स्वीकार करता है। |
| `visibility` | `"visible" \| "hidden" \| "collapse"` | | छिपे हुए views लेआउट में अपनी जगह बनाए रखते हैं (`display: "none"` के विपरीत)। |
| `overflow` | `"visible" \| "hidden"` | `.overflow_hidden()` | `"hidden"` चाइल्ड को view की सीमाओं (और कोनों) पर क्लिप करता है। |
| `backfaceVisibility` | `"visible" \| "hidden"` | `.backface_hidden()`, `.backface_visible()` | `"hidden"`: 3D रोटेशन के उसे घुमा देने पर अदृश्य। |
| `verticalAlign` | `"baseline" \| "text-top" \| "text-bottom" \| "middle"` | `.align_baseline()`, `.align_text_top()`, `.align_text_bottom()`, `.align_middle()` | `<Text>` के अंदर कोई view या इमेज अपनी पंक्ति में कहाँ बैठे, जैसा CSS के `vertical-align` में: उसका निचला किनारा बेसलाइन पर (डिफ़ॉल्ट), उसका ऊपरी या निचला किनारा टेक्स्ट फ़ॉन्ट के ऊपरी या निचले किनारे पर, या उसका मध्य बेसलाइन से x-ऊँचाई का आधा ऊपर। उसे समेटने के लिए पंक्ति बड़ी हो जाती है। |

<a id="transforms"></a>

### ट्रांसफ़ॉर्म

ट्रांसफ़ॉर्म CSS वाले ही हैं: `translate`, `rotate` और `scale` properties तथा `transform`, इसी क्रम में संयोजित। हर एक अपनी अलग property है, इसलिए style का `scale` क्लास के `scale-*` को बदल देता है और उसका `rotate-*` बनाए रखता है, और style का `transform` क्लास के transform functions (`rotate-x-*`, `skew-*`) को बदल देता है।

| कुंजी | प्रकार | Rust | विवरण |
|---|---|---|---|
| `translate` | `string \| number \| AnimatedNode \| [x, y]` | `.translate_x(…)`, `.translate_y(…)`; `.bind_translate_x(&v)`, `.bind_translate_y(&v)` | CSS का `translate`: पहले x, फिर y (`"10px 20px"`; view के अपने आकार का प्रतिशत, `"-50% 0"`)। संख्या x के अनुदिश points होती है। `[x, y]` प्रति अक्ष एक संख्या, एक string (`"50%"`, `"10px"`) या एक animated value स्वीकार करता है; अकेला animated value उसे x के अनुदिश ले जाता है। |
| `rotate` | `string \| number \| AnimatedNode` | `.rotate(deg(…))`; `.bind_rotate(&v)` | CSS का `rotate`: `"45deg"`, `"0.5turn"`, या किसी अक्ष के परितः, `"x 90deg"`। संख्या, और animated value, z के परितः डिग्री में होती है, दक्षिणावर्त। |
| `scale` | `string \| number \| AnimatedNode \| [x, y]` | `.scale(f)`, `.scale_x(f)`, `.scale_y(f)`; `.bind_scale(&v)` | CSS का `scale`: `1.5`, `"150%"`, x और y (`"1 2"`)। animated value दोनों अक्षों को स्केल करता है; `[x, y]` प्रति अक्ष एक संख्या या animated value स्वीकार करता है। |
| `transform` | `string \| TransformStep[]` | `.rotate_x(…)`, `.rotate_y(…)`, `.skew_x(…)`, `.skew_y(…)`, `.transform_none()`; animated steps: `.bind_transform(kind, &v)`, `.bind_motion(&m)` (हर style transform के बाद) | CSS का `transform`: `"translateX(10px) rotate(45deg) scale(1.5)"`, या `"none"`। Functions: `translate()`, `translateX()`, `translateY()`, `scale()`, `scaleX()`, `scaleY()`, `rotate()` / `rotateZ()`, `rotateX()`, `rotateY()`, `skew()`, `skewX()`, `skewY()`, `perspective()`। लंबाइयाँ `px` स्वीकार करती हैं (translations में view के अपने आकार का `%` भी), कोण `deg`, `rad` या `turn`। या steps की एक सूची जिनकी मात्राएँ animated values हो सकती हैं: जो string में नहीं समा सकता, जैसे animated 3D रोटेशन (`[{ perspective: 800 }, { rotateY: angle }]`), और किसी motion के channels (`m.transform`)। style का `transform` इनमें से कोई एक रूप होता है, इसलिए animated steps से पहले का perspective सूची का एक step होता है। `translate`, `rotate` और `scale` के बाद लागू होता है। |
| `transformOrigin` | `string \| (number \| string)[]` | `.transform_origin(…)`, `.origin_top_left()`, ... | वह बिंदु जिसके चारों ओर transforms काम करते हैं: कीवर्ड, प्रतिशत और लंबाइयाँ (`"top left"`, `"50% 0"`, `[10, 20]`)। डिफ़ॉल्ट केंद्र। |

`TransformStep` एक ऐसा object है जिसमें एक key होती है, और वह सूची के क्रम में लागू होता है:

| Step | मान | Native animated |
|---|---|---|
| `translateX`, `translateY` | `number` (points) | हाँ |
| `scale`, `scaleX`, `scaleY` | `number` (गुणक) | हाँ |
| `rotate`, `rotateZ`, `rotateX`, `rotateY` | `number` (डिग्री) या `string` (`"45deg"`, `"0.5rad"`) | हाँ |
| `skewX`, `skewY` | `number` (डिग्री) या `string` | नहीं |
| `perspective` | `number` (points) | नहीं |

```rust tabs
view().perspective(px(600.0)).child(view().rotate_y(deg(20.0)).scale(0.95))
```

```tsx tabs
<View style={{ transform: "perspective(600px) rotateY(20deg) scale(0.95)" }} />
```

एक animated value `translate`, `rotate` और `scale` को सीधे चलाता है, और `transform` सूची के steps को भी:

```tsx
const x = createAnimatedValue(0);
const angle = createAnimatedValue(0);

<View style={{ translate: [x, 0], rotate: angle }} />
<View style={{ transform: [{ perspective: 800 }, { rotateY: angle }] }} />
```

> [!NOTE]
> Android कोई skew नहीं बनाता: `skew()`, `skewX()` और `skewY()` वहाँ view को बिना skew के छोड़ देते हैं।

<a id="filters-and-blending"></a>

### फ़िल्टर और ब्लेंडिंग

| कुंजी | प्रकार | Rust | विवरण |
|---|---|---|---|
| `filter` | `string` | `.blur(r)`, `.brightness(…)`, `.contrast(…)`, `.grayscale(…)`, `.hue_rotate(…)`, `.invert(…)`, `.saturate(…)`, `.sepia(…)` | view और उसकी सामग्री के CSS फ़िल्टर: `brightness()`, `contrast()`, `grayscale()`, `hue-rotate()`, `invert()`, `saturate()`, `sepia()`, `opacity()`, `blur()`, `drop-shadow()`। |
| `backdropFilter` | `string` | `.backdrop_blur(r)`, `.backdrop_brightness(…)`, ... | view के पीछे जो है उसके CSS फ़िल्टर, जैसे फ्रॉस्टेड ग्लास के लिए `"blur(10px)"`। |
| `maskImage` | `string` | | एक CSS ग्रेडिएंट जिसका alpha तय करता है कि view का कितना हिस्सा बनाया जाए, जहाँ अपारदर्शी हो वहाँ पूरा और जहाँ पारदर्शी हो वहाँ बिल्कुल नहीं: `linear-gradient(...)`, `radial-gradient(...)`, `conic-gradient(...)`। view जो कुछ भी बनाता है उस सब पर मास्क लगाता है, उसके backdrop filter पर भी। |
| `glassEffect` | `"none" \| "regular" \| "clear"` | `.glass_effect(GlassEffect::Regular)` | iOS 26 और macOS 26 तथा उसके बाद के संस्करणों पर view की सामग्री के पीछे Liquid Glass। `"regular"` मानक material उपयोग करता है; `"clear"` बैकग्राउंड से कम रंग लेता है। `"none"` डिफ़ॉल्ट है। iOS के पुराने संस्करणों और अन्य platforms पर दिखने वाले ब्लर के लिए `backdropFilter` के साथ जोड़ें। |
| `mixBlendMode` | `"normal" \| "multiply" \| "screen" \| "overlay" \| "darken" \| "lighten" \| "color-dodge" \| "color-burn" \| "hard-light" \| "soft-light" \| "difference" \| "exclusion" \| "hue" \| "saturation" \| "color" \| "luminosity" \| "plus-darker" \| "plus-lighter"` | `.mix_blend_mode(mode)` | view अपने पीछे की चीज़ों के साथ कैसे ब्लेंड होता है। |

> [!WARNING]
> Platform सीमाएँ:
> - iOS views पर केवल `opacity()`, 1 तक `brightness()` और `drop-shadow()` लागू करता है। `<Image>` हर रंग फ़िल्टर और `blur()` स्वीकार करता है, जो इमेज के डिकोड होते समय लागू होते हैं।
> - iOS `backdropFilter` ब्लर एक अंश पर system material उपयोग करता है, जो सटीक त्रिज्या का अनुमान है।
> - `blur()`, `drop-shadow()` और `backdropFilter` के लिए Android को API 31 चाहिए; उससे नीचे केवल रंग फ़िल्टर लागू होते हैं। Blend modes के लिए API 29 चाहिए।

<a id="transitions"></a>

### ट्रांज़िशन

जब कोई transitioned property बदलती है (नए style, किसी क्लास या `active:` जैसे variant से), तो platform उसे native रूप से एनिमेट करता है। एनिमेशन के दौरान कोई JS नहीं चलती।

| कुंजी | प्रकार | Rust | विवरण |
|---|---|---|---|
| `transitionProperty` | `string` | `.transition()`, `.transition_all()`, `.transition_colors()`, `.transition_opacity()`, `.transition_shadow()`, `.transition_transform()`, `.transition_none()` | कॉमा से अलग की गई वे properties जो एनिमेट होती हैं: `"all"`, `"colors"` (`color`, `backgroundColor`, `borderColor`, ...), `"opacity"`, `"transform"` (हर transform property), `"boxShadow"`, `"borderRadius"`, `"borderWidth"`, या `"none"`। |
| `transitionDuration` | `number \| "${number}ms" \| "${number}s"` | `.duration(ms)` | मिलीसेकंड में एक संख्या, या `"150ms"` / `"0.2s"`। |
| `transitionDelay` | `number \| "${number}ms" \| "${number}s"` | `.delay(ms)` | ट्रांज़िशन शुरू होने से पहले की देरी। |
| `transitionTimingFunction` | `"linear" \| "ease" \| "ease-in" \| "ease-out" \| "ease-in-out" \| "cubic-bezier(...)"` | `.ease_linear()`, `.ease_in()`, `.ease_out()`, `.ease_in_out()`, `.ease_bezier(…)` | इज़िंग कर्व। |

```rust tabs
view()
    .on_press(move || open.update(|o| *o = !*o))
    .h(move || px(if open.get() { 160.0 } else { 56.0 }))
    .opacity(move || if open.get() { 1.0 } else { 0.8 })
    .transition()
    .duration(200.0)
```

```tsx tabs
<View
  onPress={() => open.set(!open())}
  style={{ height: open() ? 160 : 56, opacity: open() ? 1 : 0.8,
    transitionProperty: "opacity, transform", transitionDuration: 200 }}
/>
```

<a id="keyframe-animations"></a>

### Keyframe एनिमेशन

अंतर्निहित keyframe एनिमेशन, जो native रूप से चलते हैं (Tailwind का `animate-*`)।

| कुंजी | प्रकार | Rust | विवरण |
|---|---|---|---|
| `animationName` | `"none" \| "spin" \| "ping" \| "pulse" \| "bounce"` | `.animate_spin()`, `.animate_ping()`, `.animate_pulse()`, `.animate_bounce()`, `.animate_none()` | एनिमेशन। |
| `animationDuration` | `number \| "${number}ms" \| "${number}s"` | `.animation(KeyframeAnimation { … })` | एक पुनरावृत्ति की अवधि। |
| `animationDelay` | `number \| "${number}ms" \| "${number}s"` | `.animation(KeyframeAnimation { … })` | पहली पुनरावृत्ति से पहले की देरी। |
| `animationTimingFunction` | `"linear" \| "ease" \| "ease-in" \| "ease-out" \| "ease-in-out" \| "cubic-bezier(...)"` | `.animation(KeyframeAnimation { … })` | इज़िंग कर्व। |
| `animationIterationCount` | `number \| "infinite"` | `.animation(KeyframeAnimation { … })` | यह कितनी बार चलता है। |

मानों, जेस्चर या स्प्रिंग से चलने वाले एनिमेशन के लिए, इसके बजाय [`nsh` की animation API](./nsh.md#animation) का उपयोग करें।

<a id="pointer-and-selection"></a>

### पॉइंटर और चयन

| कुंजी | प्रकार | Rust | विवरण |
|---|---|---|---|
| `cursor` | `"auto" \| "default" \| "pointer" \| "text" \| "grab" \| "grabbing" \| "not-allowed" \| ...` (हर CSS cursor कीवर्ड, और `"none"`) | `.cursor(Cursor)`, `.cursor_pointer()` | view के ऊपर पॉइंटर का आकार, पॉइंटरों के लिए (iPad ट्रैकपैड, Mac Catalyst, डेस्कटॉप)। तिरछे resize कीवर्ड अपना अक्ष बनाए रखते हैं: `nwse-resize` / `nw-resize` / `se-resize` (`Cursor::NwseResize`) और `nesw-resize` / `ne-resize` / `sw-resize` (`Cursor::NeswResize`)। Windows, Linux, Android, वेब और GPUI तिरछे cursor दिखाते हैं; AppKit उन्हें macOS 15+ पर उपयोग करता है, और macOS 14 पर खुला हाथ दिखाता है। UIKit, iPad और Mac Catalyst पर पॉइंटर इफ़ेक्ट उपयोग करता है। |
| `pointerEvents` | `"auto" \| "none" \| "box-none" \| "box-only"` | `.pointer_events(PointerEvents::BoxNone)` | view और उसके अंदर के views कौन से टच लेते हैं (`pointer-events-none`, `pointer-events-auto`)। `"none"`: कोई नहीं, अंदर के views के लिए भी, जब तक कोई `"auto"` सेट न करे, CSS की तरह इनहेरिट होता है। `"box-none"`: view पर स्वयं कोई नहीं, उसके अंदर के views अपने टच लेते हैं; `"box-only"`: view स्वयं टच लेता है, उसके अंदर के views कोई नहीं (दोनों React Native के हैं, केवल view के लिए)। डिफ़ॉल्ट `"auto"`। [टच और जेस्चर](../docs/touch-and-gestures.md#pointerevents) देखें। |
| `userSelect` | `"auto" \| "none" \| "text"` | `.select_text()`, `.select_none()` | क्या कोई `<Text>` चुना और कॉपी किया जा सकता है (`"text"`, `select-text`) या नहीं (`"none"`, `select-none`); किसी view का मान उसके अंदर के उन टेक्स्ट तक पहुँचता है जो कोई मान सेट नहीं करते। `"auto"` (`select-auto`), जो डिफ़ॉल्ट है, इसे आसपास के view पर छोड़ देता है, अन्यथा platform पर। [टेक्स्ट](../elements/text.md) देखें। |

### SVG paint

SVG आकृतियों की CSS paint properties, जिन्हें कोई भी element स्वीकार करता है और उसके अंदर के elements इनहेरिट करते हैं, जैसा ब्राउज़र में होता है।
Rust components canvases पर जो बनाते हैं, ये उसे रंगती हैं।

| कुंजी | प्रकार | Rust | विवरण |
|---|---|---|---|
| `fill` | `"none" \| "currentColor" \| ColorValue` | `.fill_color(c)`, `.fill_none()`, `.fill_current()` | आकृतियाँ किससे भरी जाती हैं; `currentColor` element का टेक्स्ट रंग है। |
| `stroke` | `"none" \| "currentColor" \| ColorValue` | `.stroke_color(c)`, `.stroke_none()`, `.stroke_current()` | आकृतियों की रूपरेखाएँ किससे रंगी जाती हैं। |
| `strokeWidth` | `number \| string` | `.stroke_width(w)` | उन रूपरेखाओं की चौड़ाई, एक लंबाई (डिफ़ॉल्ट रूप से 1)। |
| `strokeDasharray` | `number \| string` | — | उन रूपरेखाओं के अनुदिश डैश और खाली जगहें: स्पेस या कॉमा से अलग की गई लंबाइयाँ (`"4 2"`), विषम संख्या की सूची दोहराई जाती है, या `"none"`। |

## TextStyle

टेक्स्ट styles `<Text>` और `<Input>` पर लागू होती हैं। ये CSS की तरह इनहेरिट भी होती हैं: किसी view पर सेट की गई टेक्स्ट properties उसके अंदर के टेक्स्ट और इनपुट तक पहुँचती हैं, और नेस्टेड `<Text>` spans अपने पैरेंट टेक्स्ट से इनहेरिट करते हैं। `ViewStyle` की सभी keys भी लागू होती हैं। [Text](../docs/text.md) देखें।

<a id="font"></a>

### फ़ॉन्ट

| कुंजी | प्रकार | Rust | विवरण |
|---|---|---|---|
| `color` | `ColorValue \| AnimatedNode` | `.text_color(c)`, `.bind_color(&node)` | टेक्स्ट का रंग। native animated color स्वीकार करता है। उन बॉर्डर और आउटलाइन का रंग भी, जो कोई रंग सेट नहीं करतीं। |
| `fontSize` | `number` | `.text_size(s)`, `.text_sm()`, `.text_lg()`, ... | points में आकार। |
| `fontWeight` | `"normal" \| "bold" \| number \| "${number}"` | `.font_weight(FontWeight::SEMIBOLD)` | `"normal"` (400), `"bold"` (700) या 100–900। |
| `fontFamily` | `string` | `.font_family(name)` | कोई system family, या वह नाम जिसका आयात किया गया फ़ॉन्ट मूल्यांकन होता है (`import Inter from "./Inter.ttf"`), या उनकी सूची, सबसे पसंदीदा पहले (`"Brand, 'Noto Sans SC', sans-serif"`)। [Fonts](../docs/fonts.md#fallback-lists) देखें। |
| `fontStyle` | `"normal" \| "italic"` | `.italic()` | इटैलिक। |
| `fontVariant` | `FontVariantName[] \| string` | `.small_caps()`, `.oldstyle_nums()`, `.lining_nums()`, `.tabular_nums()`, `.proportional_nums()` | OpenType अंक और अक्षर रूप, एक सूची (`["tabular-nums"]`) या स्पेस से अलग किए गए CSS के नाम (`"tabular-nums small-caps"`)। `tabular-nums` अंकों की चौड़ाई समान रखता है, जो काउंटर और टाइमर के लिए उपयोगी है। |
<a id="spacing-and-alignment"></a>

### स्पेसिंग और अलाइनमेंट

| कुंजी | प्रकार | Rust | विवरण |
|---|---|---|---|
| `lineHeight` | `number` | `.line_height(h)` | पॉइंट में लाइन की ऊँचाई। |
| `letterSpacing` | `number` | `.letter_spacing(s)` | अक्षरों के बीच अतिरिक्त जगह, पॉइंट में। |
| `textAlign` | `"auto" \| "left" \| "center" \| "right" \| "justify" \| "start" \| "end"` | `.text_left()`, `.text_center()`, `.text_right()`, `.text_justify()` | क्षैतिज अलाइनमेंट। `"left"` और `"right"` दाएँ-से-बाएँ लेआउट में भी अपनी-अपनी ओर बने रहते हैं; `"start"` और `"end"` लेआउट की दिशा का पालन करते हैं। |
| `writingDirection` | `"auto" \| "ltr" \| "rtl"` | `.writing_direction(d)` | टेक्स्ट की मूल दिशा; `"auto"` इसे कंटेंट से लेता है। |
| `textTransform` | `"none" \| "uppercase" \| "lowercase" \| "capitalize"` | `.uppercase()`, `.lowercase()`, `.capitalize()`, `.normal_case()` | केस रूपांतरण। |

> [!TIP]
> Tailwind की `leading-*` और `tracking-*` क्लासेस लाइन की ऊँचाई को फ़ॉन्ट साइज़ के गुणज में और अक्षरों के बीच की जगह को `em` में सेट करती हैं, इसलिए ये `text-*` साइज़ के साथ स्केल होती हैं।

<a id="lines-and-overflow"></a>

### लाइनें और ओवरफ़्लो

| कुंजी | प्रकार | Rust | विवरण |
|---|---|---|---|
| `numberOfLines` | `number` | `.number_of_lines(n)`, `.truncate()` | `<Text>` अधिकतम कितनी लाइनें दिखाता है (CSS के `line-clamp`, `line-clamp-*`); `0` (`line-clamp-none`), जो डिफ़ॉल्ट है, सभी लाइनें दिखाता है। `truncate` एक लाइन है जो एलिप्सिस के साथ कटी होती है। |
| `textOverflow` | `"ellipsis" \| "clip" \| "ellipsis-start" \| "ellipsis-middle"` | `.text_overflow(EllipsizeMode::Middle)` | सीमित किए गए `<Text>` को कैसे काटा जाए: अंत में एलिप्सिस (`"ellipsis"`, `text-ellipsis`, डिफ़ॉल्ट), क्लिप किया हुआ (`"clip"`, `text-clip`), या एलिप्सिस शुरुआत में अथवा बीच में (फ़ाइल पाथ के लिए)। |

<a id="decoration"></a>

### डेकोरेशन

| कुंजी | प्रकार | Rust | विवरण |
|---|---|---|---|
| `textDecorationLine` | `"none" \| "underline" \| "line-through" \| "underline line-through"` | `.underline()`, `.line_through()`, `.no_underline()` | टेक्स्ट के साथ खींची जाने वाली लाइनें। |
| `textDecorationColor` | `ColorValue` | `.text_decoration_color(c)` | लाइनों का रंग (डिफ़ॉल्ट रूप से टेक्स्ट का रंग)। |
| `textDecorationStyle` | `"solid" \| "double" \| "dotted" \| "dashed" \| "wavy"` | `.text_decoration_solid()`, `_double()`, `_dotted()`, `_dashed()`, `_wavy()` | लाइन की शैली। |
| `textDecorationThickness` | `number \| "auto" \| "from-font"` | `.text_decoration_thickness(t)` | लाइन की मोटाई। |
| `textUnderlineOffset` | `number \| "auto"` | `.underline_offset(o)` | बेसलाइन से अंडरलाइन की दूरी। |

<a id="placeholder-caret-and-selection"></a>

### प्लेसहोल्डर, कैरेट और सिलेक्शन

`placeholderColor` और `caretColor` `InputStyle` के हैं, जो `<Input>` की शैली है; `selectionColor` `TextStyle` का है, क्योंकि
चयन योग्य टेक्स्ट भी इसे लेते हैं।

| कुंजी | प्रकार | Rust | विवरण |
|---|---|---|---|
| `placeholderColor` | `ColorValue` | इनपुट का `.placeholder_color(c)` | `<Input>` के प्लेसहोल्डर का रंग (`placeholder:text-*`)। |
| `textAlignVertical` | `"auto" \| "top" \| "center" \| "bottom"` | | अपने बॉक्स से छोटा टेक्स्ट कहाँ स्थित होता है (ऊँचाई वाला `<Text>`)। |
| `selectionColor` | `ColorValue` | इनपुट या टेक्स्ट का `.selection_color(c)` | `<Input>` या चयन योग्य `<Text>` का सिलेक्शन हाइलाइट और हैंडल (`selection:bg-*`); डिफ़ॉल्ट रूप से प्लेटफ़ॉर्म का एक्सेंट। iOS पर यह इनपुट का कैरेट भी होता है, जब तक `caretColor` सेट न हो (UIKit दोनों को एक ही रंग से टिंट करता है)। |
| `caretColor` | `ColorValue` | इनपुट का `.caret_color(c)` | `<Input>` का कैरेट (`caret-*`); सेट न होने पर प्लेटफ़ॉर्म का डिफ़ॉल्ट। |

<a id="text-shadow"></a>

### टेक्स्ट शैडो

| कुंजी | प्रकार | Rust | विवरण |
|---|---|---|---|
| `textShadow` | `string \| TextShadowLayer[]` | `.text_shadow([TextShadow { … }])`, `.text_shadow_sm()`, `.text_shadow_color(c)` | CSS का `text-shadow`: ऑफ़सेट, ब्लर और रंग (`"0 1px 2px rgb(0 0 0 / 0.3)"`), या इसकी लेयरें संख्याओं के रूप में, `[{ x, y, blur, color }]`; कई लेयरें होने पर सबसे चौड़ी लेयर ही खींची जाती है; बिना रंग वाली लेयर टेक्स्ट के रंग में खींची जाती है; `"none"`। |

```rust tabs
text("Title").text_shadow([TextShadow {
    offset_y: px(1.0),
    radius: px(2.0),
    color: rgba(0x0000004d).into(),
    ..TextShadow::default()
}])
```

```tsx tabs
<Text style={{ textShadow: "0 1px 2px rgb(0 0 0 / 0.3)" }}>Title</Text>
```

> [!NOTE]
> iOS पर `<Text>` में कोई ग्रेडिएंट (`backgroundImage`) या इनसेट बॉक्स शैडो नहीं खींचे जाते।

## ImageStyle

`ViewStyle` की सभी कुंजियाँ, साथ में:

| कुंजी | प्रकार | Rust | विवरण |
|---|---|---|---|
| `tintColor` | `ColorValue` | इमेज का `.tint_color(c)` | टेम्पलेट इमेज का रंग बदलता है (हर अपारदर्शी पिक्सेल यही रंग लेता है), मोनोक्रोम आइकन के लिए। |
| `objectFit` | `"fill" \| "contain" \| "cover" \| "none" \| "scale-down"` | `.object_fit(ResizeMode::Contain)` | CSS का `object-fit`: इमेज या वीडियो अपने बॉक्स में कैसे फ़िट होता है। `"cover"` इसे भर देता है और क्रॉप करता है, `"contain"` इसके अंदर फ़िट करता है, `"fill"` खींचकर फैलाता है, `"none"` प्राकृतिक आकार बनाए रखता है, `"scale-down"` में `"none"` या `"contain"` में से जो छोटा हो वह लागू होता है। इमेज डिफ़ॉल्ट रूप से अपने बॉक्स को ढकती हैं, वीडियो उसके अंदर समाहित होते हैं। |
| `objectPosition` | `string` | इमेज का `.object_position(p)`, `.object_top()`, ... | `objectFit` द्वारा आकार तय करने के बाद इमेज अपने बॉक्स में कहाँ स्थित होती है, CSS के `object-position` की तरह: कीवर्ड, प्रतिशत और लंबाइयाँ (`"top"`, `"left bottom"`, `"25% 75%"`, `"right 10px bottom 20%"`)। ढकने वाली इमेज इसके आसपास से क्रॉप होती है। डिफ़ॉल्ट केंद्र है। |

`objectFit` `<Video>` पर भी लागू होता है; देखें [image](../elements/image.md) और [video](../elements/video.md)।

<a id="props-that-look-like-styles"></a>

## स्टाइल जैसे दिखने वाले Props

Android का मटीरियल शैडो एक प्लेटफ़ॉर्म प्रॉप है, जिसे स्टाइल के साथ अलग से सेट किया जाता है:

| सेटिंग | Prop | Rust | क्लास |
|---|---|---|---|
| मटीरियल शैडो (Android) | `android={{ elevation }}` | `.elevation(e)` | |

<a id="related"></a>

## संबंधित

- [Styling](../docs/styling.md): `style`, `class`, इनहेरिटेंस और प्रायोरिटी।
- [Tailwind reference](./tailwind-reference.md): समर्थित हर यूटिलिटी और वेरिएंट।
- [Layout](../docs/layout.md): व्यवहार में flexbox और grid।
- [view](../elements/view.md), [text](../elements/text.md), [image](../elements/image.md): वे एलिमेंट जिन पर ये स्टाइल लागू होते हैं।

`width`, `height` और `flexBasis` भी `"min-content"`, `"max-content"` और `"fit-content"` स्वीकार करते हैं, जिनकी गणना Taffy द्वारा की जाती है।
