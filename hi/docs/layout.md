---
title: "लेआउट"
description: "कॉलम डिफ़ॉल्ट के साथ Flexbox, CSS grid, साइज़ और प्रतिशत, aspect ratio, absolute positioning, onLayout से मापन, रिस्पॉन्सिव लेआउट और राइट-टू-लेफ़्ट, Rust और TSX में।"
order: 34
group: ui
demo: guide-layout
source_hash: f4073f703fc9be46
---

# लेआउट

NSH हर element को [Taffy](https://github.com/DioxusLabs/taffy) से लेआउट करता है। Taffy CSS flexbox, grid और block layout का Rust implementation है, जिसे इस तरह configure किया गया है कि children डिफ़ॉल्ट रूप से ऊर्ध्वाधर (vertical) रूप में स्टैक होते हैं और सिकुड़ते नहीं। लेआउट core में, आपके कोड के हर turn के बाद चलता है, और केवल बदले हुए frames ही native views को भेजे जाते हैं। टेक्स्ट को प्लेटफ़ॉर्म का text engine उसी thread पर मापता है, इसलिए लेआउट को main thread का इंतज़ार कभी नहीं करना पड़ता।

नीचे दी गई लेआउट प्रॉपर्टी style प्रॉपर्टी हैं। Rust में ये typed style methods हैं (`.flex_row()`, `.gap_4()`, `.grid_cols(3)`, `.absolute().inset_0()`); TSX में ये `style` prop की keys हैं, और हर एक की एक [Tailwind](./tailwind.md) class है (`flex-row`, `gap-4`, `grid-cols-3`, `absolute inset-0`, ...)। दोनों एक ही native styles में बदलते हैं।

## Flexbox

एक view अपने children को flexbox से लेआउट करता है। जो view कोई `display` सेट नहीं करता, वह अपने children को column में स्टैक करता है; style में `display: "flex"` एक row बनाता है, जब तक `flexDirection` सेट न हो, ठीक CSS की तरह और Tailwind की `flex` class की तरह। जहाँ इन्हें कोई सेट नहीं करता, वहाँ ये डिफ़ॉल्ट लागू होते हैं:

| प्रॉपर्टी | NSH डिफ़ॉल्ट | वेब डिफ़ॉल्ट |
|---|---|---|
| `flexDirection` | `"column"` (वह view जो कोई `display` सेट नहीं करता); `display: "flex"` सेट होने पर `"row"` | `row` |
| `flexShrink` | `0` | `1` |
| `alignContent` | `"flex-start"` (grids: `"normal"`) | `normal` |
| `alignItems` | `"stretch"` | `stretch` |
| `minWidth` / `minHeight` | `0` | `auto` |
| `position` | `"relative"` | `static` |

```rust tabs
view()
    .flex_row()
    .items_center()
    .gap_3()
    .p_4()
    .child(image(avatar).size(px(40.0)).rounded(px(20.0)))
    .child(
        view()
            .flex_1()
            .gap_0p5()
            .child(text(name).font_weight(FontWeight::SEMIBOLD))
            .child(text(message).text_color(rgb(0x6e7781)).number_of_lines(1)),
    )
    .child(text(time).text_color(rgb(0x6e7781)))
```

```tsx tabs
<View style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 16 }}>
  <Image src={avatar} style={{ width: 40, height: 40, borderRadius: 20 }} />
  <View style={{ flex: 1, gap: 2 }}>
    <Text style={{ fontWeight: "600" }}>{props.name}</Text>
    <Text style={{ numberOfLines: 1, color: "#6e7781" }}>{props.message}</Text>
  </View>
  <Text style={{ color: "#6e7781" }}>{props.time}</Text>
</View>
```

| प्रॉपर्टी | मान | Rust |
|---|---|---|
| `flexDirection` | `"column"`, `"row"`, `"column-reverse"`, `"row-reverse"` | `.flex_col()`, `.flex_row()`, `.flex_col_reverse()`, `.flex_row_reverse()` |
| `justifyContent` | मुख्य अक्ष: `"flex-start"`, `"flex-end"`, `"start"`, `"end"`, `"center"`, `"space-between"`, `"space-around"`, `"space-evenly"`, `"stretch"` | `.justify_start()`, `.justify_center()`, `.justify_end()`, `.justify_between()`, `.justify_around()`, `.justify_evenly()` |
| `alignItems` | Cross अक्ष: `"stretch"`, `"flex-start"`, `"flex-end"`, `"start"`, `"end"`, `"self-start"`, `"self-end"`, `"center"`, `"baseline"` | `.items_stretch()`, `.items_start()`, `.items_center()`, `.items_end()`, `.items_baseline()` |
| `alignSelf` | एक child का cross-axis अलाइनमेंट; `"auto"` parent के `alignItems` का अनुसरण करता है | `.self_start()`, `.self_center()`, `.self_end()`, `.self_stretch()` |
| `alignContent` | wrap करने वाले container की लाइनें | |
| `flexWrap` | `"nowrap"`, `"wrap"`, `"wrap-reverse"` | `.flex_wrap()` |
| `flex` | एकल-संख्या शॉर्टहैंड (नीचे) | `.flex_1()`, `.flex_auto()`, `.flex_none()` |
| `flexGrow`, `flexShrink`, `flexBasis` | CSS की तरह | `.flex_grow(n)`, `.flex_shrink(n)`, `.flex_shrink_0()`, `.basis(length)` |
| `gap`, `rowGap`, `columnGap` | children के बीच की जगह | `.gap(length)`, `.gap_y(length)`, `.gap_x(length)`, और स्टेप `.gap_2()`, `.gap_x_4()`, ... |

`flex-start` और `flex-end` flex direction का अनुसरण करते हैं; `start` और `end` writing direction का अनुसरण करते हैं, जैसा CSS में होता है (right to left में `start` दाईं ओर होता है), और `self-start` / `self-end` child की अपनी direction का।

`flex` CSS का शॉर्टहैंड है, जैसे Tailwind की `flex-*` classes हैं: एक संख्या `n` का अर्थ है `n` से grow करना, 1 से shrink करना और 0 के basis से शुरू करना, इसलिए `flex: 1` वाले siblings (Rust में `.flex_1()`, `flex-1`) content चाहे जो हो, जगह को बराबर बाँटते हैं; `"none"` का अर्थ `0 0 auto` है (view अपना आकार बनाए रखता है), `"auto"` का अर्थ `1 1 auto` है, `"initial"` का अर्थ `0 1 auto` है, और grow, shrink तथा basis को अलग-अलग लिखा जा सकता है (`"2 0 50%"`, `"1 1 120px"`)। चूँकि न्यूनतम आकार डिफ़ॉल्ट रूप से 0 होते हैं, `flex: 0` (`0 1 0`) किसी view को शून्य तक सिकोड़ देता है, जब तक `minWidth: "auto"` उसके content का आकार बनाए न रखे।

```rust tabs
view()
    .flex_row()
    .gap_2()
    // One share.
    .child(view().flex_1().h(px(36.0)).bg(rgb(0xc8e1ff)))
    // Two shares.
    .child(view().flex_grow(2.0).flex_shrink(1.0).basis(px(0.0)).h(px(36.0)).bg(rgb(0x79b8ff)))
    // Fixed.
    .child(view().size(px(36.0)).bg(rgb(0x0366d6)))
```

```tsx tabs
<View style={{ flexDirection: "row", gap: 8 }}>
  <View style={{ flex: 1, height: 36, backgroundColor: "#c8e1ff" }} />   {/* one share */}
  <View style={{ flex: 2, height: 36, backgroundColor: "#79b8ff" }} />   {/* two shares */}
  <View style={{ width: 36, height: 36, backgroundColor: "#0366d6" }} /> {/* fixed */}
</View>
```

चूँकि न्यूनतम आकार डिफ़ॉल्ट रूप से 0 होते हैं, row में `flex: 1` वाला टेक्स्ट अपने siblings को बाहर धकेलने के बजाय सिकुड़ता है और wrap हो जाता है। `minWidth: "auto"` / `minHeight: "auto"` (Rust में `min-w-auto` / `min-h-auto`, `.min_w(auto())`) CSS का automatic minimum है: सिकुड़ने वाला item अपने content के सबसे छोटे आकार पर रुक जाता है, यानी टेक्स्ट के सबसे लंबे शब्द पर, जैसा वेब पर होता है।

> [!NOTE]
> `display: "flex"` का अर्थ है row, style में, class (`flex`) में और Rust (`.flex()`) में, जब तक direction सेट न हो: `{ display: "flex", flexDirection: "column" }`, `flex flex-col`, `.flex().flex_col()`। जिस view में `display` नहीं है, उसे column बनने के लिए कुछ भी करने की ज़रूरत नहीं।

<a id="sizes"></a>

## आकार

| प्रॉपर्टी | मान | Rust |
|---|---|---|
| `width`, `height` | पॉइंट, parent का प्रतिशत (`"50%"`), या `"auto"` | `.w(px(120.0))`, `.h(relative(0.5))`, `.w_full()`, `.size(px(44.0))`, स्टेप `.w_10()`, ... |
| `minWidth`, `maxWidth`, `minHeight`, `maxHeight` | पॉइंट या प्रतिशत; `minWidth` / `minHeight` में `"auto"` भी, यानी content का सबसे छोटा आकार | `.min_w(..)`, `.max_w(..)`, `.min_h(..)`, `.max_h(..)` |
| `aspectRatio` | चौड़ाई को ऊँचाई से भाग देने पर: `1`, `16 / 9` | `.aspect_ratio(16.0 / 9.0)`, `.aspect_square()` |
| `padding`, `paddingHorizontal`, `paddingVertical`, `paddingTop`, ... | पॉइंट या प्रतिशत | `.p(..)`, `.px(..)`, `.py(..)`, `.pt(..)`, ..., और स्टेप `.p_4()`, `.px_2()`, ... |
| `margin`, `marginHorizontal`, `marginVertical`, `marginTop`, ... | पॉइंट, प्रतिशत, या `"auto"` | `.m(..)`, `.mx(..)`, `.my(..)`, `.mt(..)`, ..., `.mx(auto())` |

Rust में length typed होती है: `px(16.0)` 16 पॉइंट है, `relative(0.5)` parent का 50% है, `auto()` `auto` है। स्टेप methods Tailwind की spacing scale का पालन करते हैं, जिसमें हर स्टेप 4 पॉइंट का होता है (`.p_4()` 16 पॉइंट है, `.gap_0p5()` 2 पॉइंट)।

आकार न होने पर view उतना ही बड़ा होता है जितना उसका content (और padding), और डिफ़ॉल्ट `alignItems: "stretch"` के कारण वह parent के cross axis पर फैल जाता है। प्रतिशत parent के आकार के सापेक्ष होते हैं (padding और margin के लिए, CSS की तरह, उसकी चौड़ाई के सापेक्ष)।

`aspectRatio` ज्ञात dimension से दूसरी dimension का आकार तय करता है:

```rust tabs
view().w_full().aspect_ratio(16.0 / 9.0).bg(black())
```

```tsx tabs
<View style={{ width: "100%", aspectRatio: 16 / 9, backgroundColor: "#000000" }} />
```

ऐप के assets की छवियों का अपना प्राकृतिक आकार होता है और आकार न देने पर वे उसी पर लेआउट होती हैं ([छवियाँ और assets](./images-and-assets.md))। Remote छवियों का आकार लोड होने तक पता नहीं होता: उन्हें एक आकार दें।

## Grid

`display: "grid"` (Rust में `.grid()`) children को CSS grid tracks में लेआउट करता है:

```rust tabs
view()
    .grid()
    .grid_template_columns("repeat(3, 1fr)")
    .gap_2()
    .child(view().col_span(2).h(px(60.0)).bg(rgb(0xd8b9ff)))
    .child(view().h(px(60.0)).bg(rgb(0xb083f0)))
    .child(view().row_span(2).bg(rgb(0x8250df)))
    .child(view().col_start(2).col_end(4).h(px(60.0)).bg(rgb(0x6639ba)))
```

```tsx tabs
<View style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
  <View style={{ gridColumn: "span 2", height: 60, backgroundColor: "#d8b9ff" }} />
  <View style={{ height: 60, backgroundColor: "#b083f0" }} />
  <View style={{ gridRow: "span 2", backgroundColor: "#8250df" }} />
  <View style={{ gridColumn: "2 / 4", height: 60, backgroundColor: "#6639ba" }} />
</View>
```

| प्रॉपर्टी | मान | Rust |
|---|---|---|
| `gridTemplateColumns`, `gridTemplateRows` | CSS track lists: `"repeat(3, 1fr)"`, `"200px 1fr"`, `minmax()`, `auto-fill` / `auto-fit`, line names | `.grid_cols(3)`, `.grid_rows(2)`, `.grid_template_columns("200px 1fr")`, `.grid_template_rows(..)` |
| `gridAutoColumns`, `gridAutoRows` | अंतर्निहित रूप से बनाए गए columns और rows के tracks | |
| `gridAutoFlow` | `"row"`, `"column"`, `"dense"`, `"row dense"`, `"column dense"` | `.grid_flow_col()`, `.grid_flow_dense()` |
| `gridColumn`, `gridRow` | `"1 / 3"`, `"span 2"`, एक line number या नाम: `"content-start / content-end"`, `"2 col"` (`col` नाम की दूसरी line), `"span col"` (`col` नाम की अगली line तक) | `.col_span(2)`, `.row_span(2)`, `.col_span_full()` |
| `gridColumnStart`, `gridColumnEnd`, `gridRowStart`, `gridRowEnd` | Line numbers या नाम | `.col_start(1)`, `.col_end(3)`, `.row_start(..)`, `.row_end(..)` (line numbers) |
| `justifyItems`, `justifySelf` | items row के अनुदिश अपने areas में कैसे बैठते हैं: `"start"`, `"end"`, `"center"`, `"stretch"`, ... | |
| `alignItems`, `alignSelf` | items column के अनुदिश अपने areas में कैसे बैठते हैं | `.items_*()`, `.self_*()` |
| `justifyContent`, `alignContent` | tracks grid में row और column के अनुदिश कैसे बैठते हैं | `.justify_*()` |

Templates अपनी lines के नाम square brackets में देते हैं, हर line के लिए एक या कई नाम, और items उन्हीं नामों से रखे जाते हैं, जैसा CSS में होता है (Rust में lines के numbers से):

```rust tabs
view()
    .grid()
    .grid_template_columns("[full-start] 16px [content-start] 1fr [content-end] 16px [full-end]")
    // content-start / content-end: lines 2 to 3.
    .child(view().col_start(2).col_end(3).h(px(60.0)).bg(rgb(0xb083f0)))
    // full-start / full-end: lines 1 to 4.
    .child(view().col_start(1).col_end(4).h(px(60.0)).bg(rgb(0x8250df)))
```

```tsx tabs
<View style={{ display: "grid", gridTemplateColumns: "[full-start] 16px [content-start] 1fr [content-end] 16px [full-end]" }}>
  <View style={{ gridColumn: "content-start / content-end", height: 60, backgroundColor: "#b083f0" }} />
  <View style={{ gridColumn: "full-start / full-end", height: 60, backgroundColor: "#8250df" }} />
</View>
```

Grid में `justifyContent` और `alignContent` का डिफ़ॉल्ट CSS का `"normal"` है: `auto` आकार वाले tracks container को भरने के लिए फैलते हैं, इसलिए जिस grid में ऊँचाई हो पर row template न हो, वह उस ऊँचाई को अपनी rows में बाँट देता है। स्पष्ट रूप से सेट किया गया मान (`"start"`, `"center"`, `"space-between"`, ...) tracks को वैसे ही रखता है जैसे CSS में रखता है। Alignment classes ठीक वही सेट करती हैं जो Tailwind CSS सेट करता है: `content-start` (`align-content: flex-start`) और `place-content-start` tracks को शुरुआत में पैक करते हैं, और `content-normal` तथा `justify-normal` उन्हें फैलाते हैं, जैसा browser में होता है।

`display: "block"` CSS block layout का उपयोग करता है (children स्टैक होते हैं, हर एक container जितना चौड़ा), और `display: "none"` (`.hidden()`) view को लेआउट से हटा देता है।

## Absolute positioning

`position: "absolute"` (`.absolute()`) किसी view को flow से बाहर निकाल देता है और उसे `top`, `right`, `bottom` और `left` से, उसके parent के सापेक्ष रखता है:

```rust tabs
view()
    .h(px(200.0))
    .child(image(cover).absolute().inset_0())
    .child(
        view()
            .absolute()
            .left_3()
            .right_3()
            .bottom_3()
            .child(text("Caption").text_color(white()).font_weight(FontWeight::BOLD)),
    )
```

```tsx tabs
<View style={{ height: 200 }}>
  <Image src={cover} style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }} />
  <View style={{ position: "absolute", left: 12, right: 12, bottom: 12 }}>
    <Text style={{ color: "#ffffff", fontWeight: "700" }}>Caption</Text>
  </View>
</View>
```

Offsets पॉइंट और प्रतिशत स्वीकार करते हैं (Rust में `.top(..)`, `.right(..)`, `.bottom(..)`, `.left(..)`, `.inset(..)`)। जिस view में `left` और `right` (या `top` और `bottom`) हों पर आकार न हो, वह उनके बीच फैल जाता है। बाद के siblings पहले वालों के ऊपर बनते हैं; `zIndex` (`.z_index(n)`) क्रम बदल देता है।

<a id="measuring"></a>

## मापन

`onLayout` (`.on_layout(..)`) किसी view का frame, उसके parent के सापेक्ष, हर उस लेआउट के बाद बताता है जिसमें वह बदला हो:

```rust tabs
let width = signal(0.0_f32);

view()
    .on_layout(move |frame: &Bounds<Points>| width.set(frame.size.width.0))
    .child(text(move || format!("{} points wide", width.get())))
```

```tsx tabs
const width = signal(0);

<View onLayout={({ bounds }) => width.set(bounds.size.width)}>
  <Text>{width()} points wide</Text>
</View>
```

Frame पॉइंट में होता है: Rust में `Bounds<Points>`, TSX में `{ bounds }`, एक `Bounds` (`{ origin: { x, y }, size: { width, height } }`)। पूरी विंडो के लिए, Rust में `window()` पढ़ें या TSX में [`nsh`](../modules/nsh.md#device) से `windowSize()` पढ़ें; दोनों rotation और विंडो के आकार बदलने का पालन करते हैं, और जो style इन्हें पढ़ती है वह विंडो के साथ बदलती है:

```rust tabs
view().style_when(|| window().width > px(600.0), |s| s.flex_row())
```

```tsx tabs
import { View } from "nsh";
import { windowSize } from "nsh";

<View style={{ flexDirection: windowSize().width > 600 ? "row" : "column" }} />
```

Tailwind के breakpoints (`sm:`, `md:`, ...) और `portrait:` / `landscape:` बिना कोड के वही परिणाम देते हैं।

## Safe areas

Root view पूरी स्क्रीन को ढकता है, status bar और home indicator के नीचे तक। स्क्रीनों में safe area insets के अनुसार padding देने के लिए CSS के `env()` का उपयोग करें (`paddingTop: "env(safe-area-inset-top)"`, Tailwind `pt-[env(safe-area-inset-top)]`, Rust में `.p_safe_area()`; देखें [Safe area](../elements/safe-area.md)), या Rust में `safe_area()` अथवा TSX में `safeArea()` / `safeAreaInsets()` से insets पढ़कर उन्हें स्वयं लागू करें। [navigation stack](./navigation.md) के पेज पहले से ही अपने header के नीचे होते हैं।

## Right to left

ऐप की लेआउट direction सिस्टम की भाषा का पालन करती है, और view की `direction` style (`"ltr"`, `"rtl"` या `"inherit"`; Rust में `.direction(LayoutDirection::Rtl)`) उसके subtree की direction तय करती है। जब ऐप right to left लेआउट करता है:

- rows दाईं ओर से चलती हैं;
- `left` और `right` अपनी-अपनी दिशा बनाए रखते हैं, जैसा browser में होता है, style keys और classes दोनों में: `paddingLeft`, `marginLeft`, `left`, `borderLeftWidth`, `borderTopLeftRadius`, `textAlign: "left"` और `pl-4`, `ml-2`, `left-0`, `border-l`, `rounded-tl-lg`, `text-left` बाईं ओर ही रहते हैं;
- logical प्रॉपर्टी direction का पालन करती हैं, जिनमें inline start दाईं ओर होता है: `marginStart`, `marginEnd`, `paddingStart`, `paddingEnd`, `start`, `end`, `borderStartWidth`, `borderEndColor`, `borderTopStartRadius`, ..., `textAlign: "start"` / `"end"` (classes के रूप में `ps-4`, `ms-2`, `start-0`, `border-s`, `rounded-ss-lg`, `text-start`; Rust में `.ms(..)`, `.me(..)`, `.ps(..)`, `.pe(..)`, `.border_s(..)`, `.rounded_ss(..)`, ...); `marginHorizontal` और `paddingHorizontal` दोनों ओर सेट करते हैं;
- `textAlign: "auto"` वाला टेक्स्ट दाईं ओर align होता है, और native controls mirror हो जाते हैं।

```rust tabs
view()
    .flex_row()
    .gap_2()
    .child(view().ms_4().rounded_ss(px(12.0)).size(px(44.0)).bg(rgb(0x54aeff)))

let rtl = signal(false);
view()
    .direction(move || if rtl.get() { LayoutDirection::Rtl } else { LayoutDirection::Ltr })
    .on_press(move |_: &()| rtl.set(!rtl.get()))
    .child(text(move || if rtl.get() { "Right to left" } else { "Left to right" }))
```

```tsx tabs
import { signal, Text, View } from "nsh";

const rtl = signal(false);

<View style={{ direction: rtl() ? "rtl" : "ltr" }}>
  <View style={{ flexDirection: "row", gap: 8 }}>
    <View style={{ marginStart: 16, borderTopStartRadius: 12, width: 44, height: 44, backgroundColor: "#54aeff" }} />
  </View>
  <View onPress={() => rtl.set(!rtl())}>
    <Text>{rtl() ? "Right to left" : "Left to right"}</Text>
  </View>
</View>
```

Direction में बदलाव, चाहे भाषा का हो या किसी view का, तुरंत लागू हो जाते हैं, restart की ज़रूरत नहीं। `direction` style एक view और उसके children को उनकी अपनी direction में भी रखती है, उदाहरण के लिए left to right में फ़ोन नंबर। Android पर, जो ऐप्स NSH को embed करते हैं उन्हें native controls के mirror होने के लिए अपने manifest में `android:supportsRtl="true"` चाहिए।

<a id="related"></a>

## संबंधित

- [Styling](./styling.md): styles कैसे मिलती हैं।
- [Scrolling](./scrolling.md) और [Lists](./lists.md): स्क्रीन से बड़ा content।
- [Style reference](../modules/style-reference.md): हर लेआउट प्रॉपर्टी और उसका type।
