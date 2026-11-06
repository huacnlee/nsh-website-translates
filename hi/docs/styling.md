---
title: "स्टाइलिंग"
description: "Rust में टाइप्ड स्टाइल मेथड और TSX में style prop - flexbox, grid और CSS इफ़ेक्ट - रंग, बॉर्डर, कोने, शैडो, ग्रेडिएंट, फ़िल्टर, ट्रांसफ़ॉर्म और ट्रांज़िशन, प्लेटफ़ॉर्म के अंतरों सहित।"
order: 32
group: ui
demo: guide-styling
source_hash: c3b673df4846a333
---

# स्टाइलिंग

हर element को एक ही native styles से स्टाइल किया जाता है, जिन्हें दो तरीकों से लिखा जाता है। Rust में styles element पर जोड़ी जाने वाली typed methods हैं (`.p_4()`, `.rounded(px(12.0))`, `.bg(color)`); TSX में camelCase properties का `style` prop, या [Tailwind classes](./tailwind.md)। दोनों में box shadows, gradients, filters, outlines, transitions और grid जैसे CSS features शामिल हैं, और native view को केवल वही properties भेजी जाती हैं जो बदली हैं।

ये तीनों तरीके properties का एक ही सेट लिखते हैं और एक ही अर्थ रखते हैं। इनके नाम CSS के हैं (कुछ में वे सरल नाम हैं जो apps लिखते हैं, जैसे `paddingHorizontal`, `marginStart` और `numberOfLines`), और CSS values (colors, gradients, filters, shadows, transforms, alignment keywords) तथा Tailwind utilities का वही अर्थ है जो web पर है। हर Rust method और utility वही सेट करती है जो Tailwind CSS 4 उसके लिए generate करता है, इसलिए web से आपका ज्ञान यहाँ भी काम आता है: `paddingLeft` का अर्थ `padding-left` और `pl-4` है, `boxShadow` का अर्थ `box-shadow` है, `display: "flex"` एक row है, जैसे `flex` class। बाकी सब native apps के लिए बनाया गया है: lengths points में होती हैं (`16`, `"50%"`, `"auto"`; classes `rem` और CSS की अन्य units लेती हैं), defaults native layout के हैं (नीचे सूचीबद्ध), जो value बदलती है वह string की जगह numbers लेती है (`translate: [x, 0]`, shadow की layers), और CSS से आगे platforms जो करते हैं उसके लिए अपने [extensions](#extensions) हैं।

```rust tabs
view()
    .p_4()
    .rounded(px(12.0))
    .bg(white())
    .border_1()
    .border_color(rgb(0xd0d7de))
    .shadow([BoxShadow {
        offset_y: px(4.0),
        blur: px(12.0),
        color: rgba(0x0000001f).into(),
        ..BoxShadow::default()
    }])
    .child(
        text("Card")
            .text_size(px(17.0))
            .font_weight(FontWeight::SEMIBOLD)
            .text_color(rgb(0x1f2328)),
    )
```

```tsx tabs
<View
  style={{
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d0d7de",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.12)",
  }}
>
  <Text style={{ fontSize: 17, fontWeight: "600", color: "#1f2328" }}>Card</Text>
</View>
```

यह पेज बताता है कि styles कैसे मिलती हैं और visual properties क्या हैं। Layout properties (flexbox, grid, sizes, positions) [Layout](./layout.md) पर, text properties [Text](./text.md) पर, और हर property अपने type के साथ [style reference](../modules/style-reference.md) में सूचीबद्ध है।

<a id="combining-styles"></a>

## Styles को मिलाना

Rust में साझा styles ऐसे functions हैं जो element लेकर उसे स्टाइल करके लौटाते हैं, और conditions सामान्य Rust हैं: `.when(condition, |v| ..)` उसके लिए जो element बनते समय पता हो, `.style_when(signal, |s| ..)` उन styles के लिए जो app चलते समय बदलती हैं। TSX में `style` एक object, या बाएँ से दाएँ merge किए गए objects का array लेता है; falsy entries (`false`, `null`, `undefined`) छोड़ दी जाती हैं, जिससे conditional styles छोटी हो जाती हैं:

```rust tabs
fn button(danger: bool, busy: Signal<bool>) -> View {
    view()
        .px_4()
        .py(px(10.0))
        .rounded(px(10.0))
        .bg(rgb(0x0969da))
        .when(danger, |v| v.bg(rgb(0xcf222e)))
        .style_when(busy, |s| s.opacity(0.4))
}
```

```tsx tabs
const styles = {
  button: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: "#0969da" },
  disabled: { opacity: 0.4 },
  danger: { backgroundColor: "#cf222e" },
} as const;

<View style={[styles.button, props.danger && styles.danger, busy() && styles.disabled]} />
```

TSX में साझा styles को components के बाहर constants के रूप में परिभाषित करें (`as const` के साथ, ताकि TypeScript `"row"` जैसे literal types बनाए रखे)। एक सादा object ही काफ़ी है: styles को हर बार सेट करते समय Rust में parse किया जाता है, ऐसे objects से जिन्हें किसी को register नहीं करना पड़ता।

जो style signals पढ़ती है वह उन्हें follow करती है: Rust में method को closure दें (`.bg(move || ..)`), और signals बदलने पर केवल वही property दोबारा सेट होती है; TSX में signals पढ़ने वाला style expression फिर से बनता है, और NSH केवल वे properties भेजता है जिनकी values अलग हैं:

```rust tabs
view()
    .p_3()
    .bg(move || if selected.get() { rgb(0xddf4ff) } else { rgb(0xffffff) })
```

```tsx tabs
<View style={{ backgroundColor: selected() ? "#ddf4ff" : "#ffffff", padding: 12 }} />
```

जब किसी TSX element में दोनों हों, तो `style` `class` पर भारी पड़ता है: पहले classes लागू होती हैं, फिर उनके ऊपर inline style। `undefined` पर सेट की गई key कुछ सेट नहीं करती (`backgroundColor: active ? accent : undefined` inactive होने पर class का color बनाए रखता है); `null` default सेट करता है। Rust में उसी property के लिए बाद वाली method पहले वाली पर भारी पड़ती है।

एक ही style के भीतर (एक object, या एक में merge किया गया array) keys के क्रम से कोई फ़र्क नहीं पड़ता: अधिक विशिष्ट property अपने shorthand पर भारी पड़ती है, `borderTopWidth` `borderWidth` पर, `borderLeftColor` `borderColor` पर, `marginTop` `marginVertical` पर और वह `margin` पर (padding भी इसी तरह), `rowGap` `gap` पर, `flexGrow` `flex` पर, `gridColumnStart` `gridColumn` पर। वहाँ `null` पर सेट की गई विशिष्ट property shorthand की value दिखाती है।

<a id="units-and-values"></a>

## Units और values

- **Lengths points में होती हैं** (density-independent pixels): Rust में `px(100.0)` और TSX में `width: 100` 100pt हैं, जो 2× या 3× screen पर 200 या 300 physical pixels होते हैं।
- **Percentages** (Rust में `relative(0.5)`, TSX में `"50%"`) sizes, positions, margins और paddings के लिए parent के सापेक्ष होते हैं ([Layout](./layout.md))।
- **Angles** Rust में `deg(45.0)`, `radians(0.5)` या `turn(0.25)` होते हैं, और TSX में numbers के रूप में degrees या unit वाली strings: `45`, `"45deg"`, `"0.5rad"`; CSS के `rotate` और `transform` भी `"0.25turn"` लेते हैं, और `transform` string के भीतर हर angle की अपनी unit होती है।
- **Durations** milliseconds में होती हैं: Rust में `.duration(150.0)`, TSX में numbers या strings (`"150ms"`, `"0.2s"`)।

## Defaults

जहाँ कोई property सेट नहीं होती, वहाँ NSH के defaults लागू होते हैं:

| | Default |
|---|---|
| View के children का layout | एक column (`flexDirection: "column"` वाला flex container); `display: "flex"` row बनाता है जब तक `flexDirection` सेट न हो, जैसा CSS में होता है |
| `flexShrink` | `0` (children shrink नहीं होते जब तक कहा न जाए) |
| `alignContent` | `"flex-start"` (grids में, CSS का `"normal"`) |
| `position` | `"relative"` |
| `minWidth` / `minHeight` | `0` |
| `backgroundColor` | पारदर्शी |
| Text | काला, 14pt, weight 400 |
| Border और outline का color | text color (CSS का `currentColor`) |

नए views में तब तक कोई style नहीं होती जब तक आप उन्हें न दें, इसलिए बिना style वाले wrappers का native side पर कोई खर्च नहीं होता।

<a id="colors"></a>

## रंग

Rust में colors typed values हैं: `rgb(0x0099ff)`, `rgba(0x0099ffcc)`, `hsla(..)`, `white()`, `black()`, और Tailwind का palette `nsh_core::element::palette` के रूप में (`BLUE.shade(500)`)। Color methods `AdaptiveColor`, यानी एक light और एक dark value, लेती हैं: `AdaptiveColor::rgb(0xffffff, 0x0d1117)` system appearance के साथ native रूप से बदलता है, बिना render के। App के theme के colors (`nsh_base` से `theme().primary`) भी adaptive हैं ([Rust](./rust.md#theme))।

TSX में color properties CSS color strings स्वीकार करती हैं:

| रूप | उदाहरण |
|---|---|
| Hex | `"#09f"`, `"#09fc"`, `"#0099ff"`, `"#0099ffcc"` |
| `rgb()` / `rgba()` | `"rgb(0, 153, 255)"`, `"rgba(0, 0, 0, 0.5)"`, `"rgb(0 0 0 / 10%)"` |
| `hsl()` / `hsla()` | `"hsl(210 100% 50%)"` |
| `oklch()` / `oklab()` | `"oklch(62.3% 0.214 259.8)"` |
| नामित | `"white"`, `"black"`, `"transparent"`, `"rebeccapurple"`, ... |
| `currentColor` | `"currentColor"`: text color, gradient, shadow, `drop-shadow()` या `color-mix()` (`"color-mix(in srgb, currentColor 50%, transparent)"`) के भीतर भी; classes इसे `bg-current`, `border-current/50`, `bg-[color-mix(in_srgb,currentColor_50%,transparent)]` लिखती हैं |

TSX में dark mode के लिए `nsh` से [`colorScheme()`](../modules/nsh.md#device) पढ़ें, जो system appearance को follow करने वाला accessor है, या Tailwind के `dark:` variant का उपयोग करें:

```rust tabs
view()
    .flex_1()
    .bg(AdaptiveColor::rgb(0xffffff, 0x0d1117))
    .child(text("Follows the system appearance").text_color(AdaptiveColor::rgb(0x1f2328, 0xe6edf3)))
```

```tsx tabs
import { Text, View } from "nsh";
import { colorScheme } from "nsh";

const palette = () =>
  colorScheme() === "dark"
    ? { background: "#0d1117", text: "#e6edf3" }
    : { background: "#ffffff", text: "#1f2328" };

<View style={{ flex: 1, backgroundColor: palette().background }}>
  <Text style={{ color: palette().text }}>Follows the system appearance</Text>
</View>
```

Colors के अलावा अन्य styles के लिए Rust में `.dark(|s| ..)` dark appearance में styles लागू करता है, और `dark()` appearance पढ़ता है। दोनों appearances में default text color काला है: dark mode सपोर्ट करने वाले apps में colors स्पष्ट रूप से सेट करें।

<a id="borders-and-corners"></a>

## Borders और corners

```rust tabs
view()
    .border_1()
    .border_color(rgb(0xd0d7de))
    .border_dashed()               // .border_solid() | .border_dashed() | .border_dotted()
    .rounded(px(12.0))
    .rounded_tl(px(24.0))          // per corner, overrides .rounded(..)
    .border_b(px(3.0))             // per side
    .border_b_color(rgb(0x0969da))
```

```tsx tabs
<View
  style={{
    borderWidth: 1,
    borderColor: "#d0d7de",
    borderStyle: "dashed",          // "solid" | "dashed" | "dotted"
    borderRadius: 12,
    borderTopLeftRadius: 24,        // per corner, overrides borderRadius
    borderBottomWidth: 3,           // per side
    borderBottomColor: "#0969da",
  }}
/>
```

- **Widths और colors** हर side के लिए: `borderTopWidth`, `borderRightWidth`, ..., `borderTopColor`, ..., जो किसी भी direction में अपनी side बनाए रखती हैं; और `borderStartWidth`, `borderEndWidth`, `borderStartColor`, `borderEndColor`, जो [layout direction](./layout.md#right-to-left) का अनुसरण करती हैं (Rust में `.border_t(..)`, `.border_t_color(..)`, `.border_s(..)`, `.border_e_color(..)`, ...)।
- **Color**: जिस side की width सेट है पर color नहीं, उसका color text color होता है, जैसे CSS का `currentColor`: `{ borderWidth: 1, color: "#0969da" }` नीले रंग का border बनाता है।
- **Radii** हर corner के लिए: `borderTopLeftRadius`, `borderTopRightRadius`, `borderBottomRightRadius`, `borderBottomLeftRadius`, और `borderTopStartRadius` / `borderTopEndRadius` / `borderBottomStartRadius` / `borderBottomEndRadius` (top start, top end, bottom start, bottom end), जो [layout direction](./layout.md#right-to-left) का अनुसरण करती हैं (Rust में `.rounded_tl(..)`, ..., `.rounded_ss(..)`, `.rounded_se(..)`, `.rounded_es(..)`, `.rounded_ee(..)`, और presets `.rounded_lg()`, `.rounded_full()`, ...)।
- **`borderCurve: "continuous"`** (`.border_curve(BorderCurve::Continuous)`) ऐसे corners draw करता है जिनकी curvature किनारों में धीरे-धीरे घुलती है, जैसे iOS के app icons, दोनों platforms पर। Pill (`borderRadius` जो ऊँचाई का आधा हो) pill ही रहती है।
- **`overflow: "hidden"`** (`.overflow_hidden()`) children को rounded आकार में clip करता है। जो हिस्सा यह clip करता है वह layout में भी clip हो जाता है: वह आसपास के scroll view के content size तक नहीं पहुँचता, इसलिए जो box किसी child को अपनी चौड़ाई से अधिक चौड़ा layout करके `transform` से छोटा कर देता है (transforms layout को प्रभावित नहीं करते), वह scroll view को अछूता छोड़ता है।

जो radii side के आधे से बड़ी हों उन्हें clamp कर दिया जाता है, इसलिए `borderRadius: 9999` (`.rounded_full()`) circle या pill बनाता है।

## Shadows

Views CSS का `boxShadow` डालते हैं, और Android अपनी material elevation जोड़ता है:

```rust tabs
// CSS box-shadow: several layers, with spread and inset.
view().shadow([
    BoxShadow { offset_y: px(1.0), blur: px(2.0), color: rgba(0x00000014).into(), ..BoxShadow::default() },
    BoxShadow { offset_y: px(8.0), blur: px(24.0), color: rgba(0x0000001f).into(), ..BoxShadow::default() },
])
view().shadow([BoxShadow { offset_y: px(2.0), blur: px(4.0), color: rgba(0x00000026).into(), inset: true, ..BoxShadow::default() }])

// A preset in a color of its own.
view().shadow_lg().shadow_color(rgba(0x0969da66))

// Android's material elevation.
view().elevation(px(6.0)).bg(white()).rounded(px(12.0))
```

```tsx tabs
// CSS box-shadow: several, comma separated, with spread and inset
<View style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.12)" }} />
<View style={{ boxShadow: "inset 0 2px 4px rgba(0,0,0,0.15)" }} />

// Android's material elevation (a prop, not a style)
<View android={{ elevation: 6 }} style={{ backgroundColor: "#ffffff", borderRadius: 12 }} />
```

`boxShadow` CSS का अनुसरण करता है: `offsetX offsetY blur spread color`, inner shadows के लिए `inset`। यह अपनी layers numbers के रूप में भी लेता है, जो बदलती values के लिए उपयुक्त रूप है और कोई string नहीं बनाता: `boxShadow: [{ x: 0, y: 6, blur: 18, spread: 0, color: "#0000004d", inset: false }]` (केवल `x` और `y` आवश्यक; बिना color की layer text color में होती है)। Rust layers लेता है, `.shadow([BoxShadow { .. }])`। Shadows view के rounded आकार का अनुसरण करती हैं, और transition उन्हें animate करता है (`transitionProperty: "boxShadow"`, `.transition_shadow()`)। Tailwind के presets Rust में `.shadow_sm()`, `.shadow_md()`, `.shadow_lg()`, ... हैं, और `.shadow_color(..)` उनकी layers का रंग बदलता है। पारदर्शी view की content का अनुसरण करने वाली shadow (जैसे icon के glyphs) एक `filter: "drop-shadow(...)"` है ([Filters](#filters-and-blending)); text के लिए `textShadow` है ([Text](./text.md))।

> [!NOTE]
> Android पर shadows के लिए background चाहिए: जिस view का background पारदर्शी हो (उदाहरण के लिए बिना background वाला text) वह कोई shadow नहीं डालता।

## Gradients

`backgroundImage` CSS gradients लेता है, जो background color के ऊपर draw होते हैं; Rust में `.bg_linear(angle)`, `.bg_radial()` और `.bg_conic(angle)` stops `.gradient_from(..)`, `.gradient_via(..)` और `.gradient_to(..)` के साथ, जैसे Tailwind का `bg-linear-*` `from-*`, `via-*` और `to-*` के साथ। TSX में कई gradients commas से अलग किए जाते हैं।

```rust tabs
view().h(px(120.0)).rounded(px(16.0)).bg_linear(deg(135.0)).gradient_from(rgb(0x54aeff)).gradient_to(rgb(0x8250df))
view().bg_radial().gradient_from(rgb(0xfff8c5)).gradient_to(rgb(0xfd8c73))
view().bg_conic(deg(0.0)).gradient_from(rgb(0xff0000)).gradient_via(rgb(0x00ff00)).gradient_to(rgb(0x0000ff))
view()
    .bg_linear_to_r()
    .gradient_from(rgb(0x8250df))
    .gradient_from_position(percentage(0.3))
    .gradient_to(rgb(0x54aeff))
    .gradient_to_position(percentage(0.3))
```

```tsx tabs
<View style={{ height: 120, borderRadius: 16, backgroundImage: "linear-gradient(135deg, #54aeff, #8250df)" }} />
<View style={{ backgroundImage: "radial-gradient(circle at top left, #fff8c5, #fd8c73)" }} />
<View style={{ backgroundImage: "conic-gradient(red, yellow, lime, aqua, blue, magenta, red)" }} />
<View style={{ backgroundImage: "linear-gradient(90deg, #8250df 0 12px, #54aeff 12px)" }} />
```

Color stops percentages या lengths से रखे जाते हैं (`px`, `pt`, `rem`; सादे numbers points हैं) linear या radial gradient के साथ, और conic gradient के चारों ओर percentages या angles से (`deg`, `turn`, `rad`, `grad`)। दो positions वाला stop (`#8250df 0 12px`) एक रंग की band है, वैसे ही एक ही position पर दो stops भी। Lengths gradient line के साथ view के वर्तमान size पर मापी जाती हैं, इसलिए 12px की band view के resize होने पर भी 12px चौड़ी रहती है।

Stops के बीच colors CSS की तरह मिश्रित होते हैं: उस space में जिसका नाम gradient देता है (`linear-gradient(in oklab, …)`; साथ ही `srgb`, `srgb-linear`, `xyz`, `oklch` hue method जैसे `longer hue` के साथ, और `hsl`), और अन्यथा sRGB में जब हर color hex, `rgb()`, `hsl()` या named color हो, और Oklab में जब कोई `oklch()`, `oklab()`, `lab()`, `lch()` या `color()` हो।

Text elements iOS पर gradients draw नहीं करते।

<a id="filters-and-blending"></a>

## Filters और blending

| Property | मान | Rust |
|---|---|---|
| `filter` | view और उसकी content के CSS filters: `brightness()`, `contrast()`, `grayscale()`, `hue-rotate()`, `invert()`, `saturate()`, `sepia()`, `opacity()`, `blur()`, `drop-shadow()` (बिना color के, text color में, जैसा CSS में); कई filters spaces से अलग | `.brightness(n)`, `.contrast(n)`, `.grayscale(n)`, `.hue_rotate(angle)`, `.invert(n)`, `.saturate(n)`, `.sepia(n)`, `.blur(px(..))` |
| `backdropFilter` | view के पीछे जो है उसके filters: `"blur(10px)"` (frosted glass) | `.backdrop_blur(px(10.0))`, `.backdrop_saturate(n)`, ... |
| `glassEffect` | iOS 26 और macOS 26 व उसके बाद Apple के Liquid Glass के लिए `"regular"` या `"clear"`; `"none"` (default) `backdropFilter` का उपयोग करता है | `.glass_effect(GlassEffect::Regular)` |
| `mixBlendMode` | view उसके पीछे की चीज़ों के साथ कैसे blend होता है: `"multiply"`, `"screen"`, `"overlay"`, ... | `.mix_blend_mode(BlendMode::Multiply)` |

```rust tabs
image(photo).size(px(120.0)).grayscale(1.0).contrast(1.2)
view()
    .absolute()
    .bottom_0()
    .left_0()
    .right_0()
    .p_3()
    .bg(rgba(0xffffff66))
    .backdrop_blur(px(12.0))
```

```tsx tabs
<Image src={photo} style={{ width: 120, height: 120, filter: "grayscale(1) contrast(1.2)" }} />
<View style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: 12, backgroundColor: "rgba(255,255,255,0.4)", backdropFilter: "blur(12px)" }} />
```

Platform support अलग-अलग है:

| | iOS | Android |
|---|---|---|
| Views पर `filter` | `opacity`, 1 तक `brightness` और केवल `drop-shadow` | सभी, Android 12 (API 31) से; इससे नीचे केवल color filters |
| Images पर `filter` | हर color filter और `blur` | views की तरह |
| `backdropFilter` | एक system blur material, जो radius का अनुमान लगाता है | Android 12 (API 31) से |
| `mixBlendMode` | हाँ | Android 10 (API 29) से |

web, Windows और Linux views पर हर filter लागू करते हैं, macOS वैसे ही करता है जैसे iOS; GPUI color filters और `drop-shadow()` draw करता है। Backdrop filter iOS, macOS और Android पर blur है, web और Windows पर हर filter; Linux और GPUI कोई filter draw नहीं करते, और GPUI views को normal blend mode में draw करता है। कई `drop-shadow()` वाले `filter` में से iOS, macOS और Android आखिरी वाला draw करते हैं। `mixBlendMode` view को उसके पीछे draw की गई हर चीज़ के साथ blend करता है।

iOS पर `ios={{ backdropMaterial: "regular" }}` उस system material को चुनता है जो `backdropFilter` blur में उपयोग होता है। Values `"ultraThin"` (default), `"thin"`, `"regular"`, `"thick"` और `"chrome"` हैं। Material दिखाने के लिए prop को धनात्मक blur radius के साथ जोड़ें। Rust `.backdrop_blur(px(30.0))` के साथ `.backdrop_material(BackdropMaterial::Regular)` का उपयोग करता है। Radius material की ताकत का अनुमान है: NSH चुने गए material का एक अंश लागू करता है, जो 30 points पर पूरी ताकत तक पहुँचता है। Light या dark variant view के background color का अनुसरण करता है। ये विकल्प Apple के [system blur materials](https://developer.apple.com/documentation/uikit/uiblureffect/style/systemmaterial) से मेल खाते हैं।

```rust tabs
view().backdrop_blur(px(30.0)).backdrop_material(BackdropMaterial::Regular)
```

```tsx tabs
<View ios={{ backdropMaterial: "regular" }} style={{ height: 64, backdropFilter: "blur(30px)" }} />
```

`glassEffect` iOS 26 और macOS 26 व उसके बाद के versions पर view की content के पीछे Liquid Glass draw करता है। `"regular"` standard material का उपयोग करता है; `"clear"` background से कम color लेता है। पहले के iOS versions और अन्य platforms पर दिखने वाले blur के लिए इसे `backdropFilter` के साथ जोड़ें। Glass view के size और rounded corners का अनुसरण करता है।

```tsx
<View style={{ height: 80, borderRadius: 16, backdropFilter: "blur(12px)", glassEffect: "regular" }} />
```

<a id="outlines-opacity-and-visibility"></a>

## Outlines, opacity और visibility

- `outlineWidth`, `outlineColor`, `outlineStyle`, `outlineOffset` (`.outline(..)`, `.outline_color(..)`, `.outline_dashed()`, `.outline_offset(..)`): border के बाहर की एक line जो जगह नहीं लेती (negative offsets अंदर draw करते हैं)। `outlineStyle: "none"` (या `"hidden"`, `.outline_none()`) outline को उसकी width चाहे जो हो छिपा देता है, जैसा CSS में।
- `opacity` (`.opacity(n)`): 0 से 1, view और उसके children पर लागू।
- `visibility: "hidden"` (Rust में `.invisible()`): view draw नहीं होता पर अपनी जगह रखता है, और screen readers उसे और उसके subtree को छोड़ देते हैं, जैसे browser में। `display: "none"` (`.hidden()`) उसे layout से हटा देता है।
- `zIndex` (`.z_index(n)`): siblings के बीच क्रम, साथ ही native stacking order (समान values के लिए stable)।
- `cursor` (`.cursor(..)`, `.cursor_pointer()`): view के ऊपर pointer का आकार, pointers और desktops के लिए।
<a id="transforms"></a>

## ट्रांसफ़ॉर्म

ट्रांसफ़ॉर्म CSS के ही हैं। TSX में `translate`, `rotate` और `scale` अपने-आप में अलग प्रॉपर्टी हैं और `transform` CSS के फ़ंक्शन की स्ट्रिंग या स्टेप की सूची लेता है; ये CSS के क्रम में ही लागू होते हैं, `translate`, फिर `rotate`, फिर `scale`, फिर `transform`, चाहे keys का क्रम कुछ भी हो। Rust में ट्रांसफ़ॉर्म मेथड हैं (`.translate_x(..)`, `.rotate(..)`, `.scale(..)`, ...) जो उसी क्रम में लागू होते हैं:

```rust tabs
view().translate_x(px(20.0)).rotate(deg(-8.0)).scale(0.9)
view().perspective(px(600.0)).child(view().rotate_y(deg(35.0)).backface_hidden())
view().origin_top_left().rotate(deg(30.0))
```

```tsx tabs
<View style={{ translate: "20px 0", rotate: "-8deg", scale: 0.9 }} />
<View style={{ transform: "perspective(600px) rotateY(35deg)", backfaceVisibility: "hidden" }} />
<View style={{ transformOrigin: "top left", rotate: "30deg" }} />
```

| प्रॉपर्टी | मान |
|---|---|
| `translate` | `"10px 20px"`, `"-50% 0"` (व्यू के अपने आकार का प्रतिशत), एक संख्या (x अक्ष पर पॉइंट), या `[x, y]` जिसमें प्रत्येक अक्ष के लिए संख्या, स्ट्रिंग या एनिमेटेड मान हो |
| `rotate` | `"45deg"`, `"0.25turn"`, किसी अक्ष `"x 90deg"` के गिर्द, एक संख्या (डिग्री) या एनिमेटेड मान (डिग्री) |
| `scale` | `1.5`, `"150%"`, `"1 2"` (x और y), एनिमेटेड मान (दोनों अक्ष) या `[x, y]` |
| `transform` | CSS के फ़ंक्शन: `translate()`, `translateX()`, `translateY()`, `scale()`, `scaleX()`, `scaleY()`, `rotate()` / `rotateZ()`, `rotateX()`, `rotateY()`, `skew()`, `skewX()`, `skewY()`, `perspective()`; लंबाइयाँ `px` में (translate में `%` भी), कोण `deg`, `rad` या `turn` में; `"none"`; या स्टेप की सूची (`[{ perspective: 800 }, { rotateY: angle }]`) जिसकी मात्राएँ एनिमेटेड मान हो सकती हैं |

क्लासेज़ की तरह ही हर एक अपने-आप में अलग प्रॉपर्टी है: स्टाइल का `scale` किसी `scale-95` क्लास की जगह ले लेता है और उसका `rotate-3` बनाए रखता है। एनिमेटेड मान `translate`, `rotate` और `scale` को नेटिव रूप से चलाते हैं; जो चीज़ें CSS की स्ट्रिंग एनिमेटेड मात्रा के साथ नहीं रख सकती, जैसे 3D रोटेशन, उनके लिए `transform` को स्टेप की सूची दें: `translateX`, `translateY`, `scale`, `scaleX`, `scaleY`, `rotate` (`rotateZ`), `rotateX`, `rotateY`, `skewX`, `skewY` और `perspective` ([एनिमेशन](./animation.md))। स्टाइल का `transform` इन दोनों रूपों में से केवल एक होता है, इसलिए एनिमेटेड स्टेप से पहले आने वाला perspective सूची का ही एक स्टेप है।

Rust का `.perspective(..)` CSS की `perspective` प्रॉपर्टी है, जैसा Tailwind का `perspective-*`: यह व्यू के चाइल्ड को उनकी गहराई देता है, जबकि `transform` का `perspective()` फ़ंक्शन व्यू के अपने ट्रांसफ़ॉर्म पर लागू होता है। `transformOrigin` कीवर्ड, प्रतिशत और लंबाइयाँ लेता है (`"top left"`, `"50% 0"`, `[10, 20]`; Rust में `.origin_top_left()`, `.transform_origin(..)`); डिफ़ॉल्ट केंद्र है। ट्रांसफ़ॉर्म लेआउट को प्रभावित नहीं करते: सिबलिंग ऐसे रखे जाते हैं मानो व्यू पर ट्रांसफ़ॉर्म लगा ही न हो।

Android में skew ट्रांसफ़ॉर्म नहीं हैं।

<a id="transitions"></a>

## ट्रांज़िशन

जब आप बताते हैं कि क्या एनिमेट करना है, तो व्यू अपनी स्टाइल के बदलावों को एनिमेट करता है। एनिमेशन नेटिव रूप से चलता है; प्रति फ़्रेम आपका कोई कोड नहीं चलता।

```rust tabs
let open = signal(false);

view()
    .on_press(move || open.update(|o| *o = !*o))
    .w(px(150.0))
    .h(px(72.0))
    .rounded(move || px(if open.get() { 36.0 } else { 12.0 }))
    .bg(move || if open.get() { rgb(0x8250df) } else { rgb(0x54aeff) })
    .translate_x(move || px(if open.get() { 120.0 } else { 0.0 }))
    .transition_all()
    .duration(300.0)
    .ease_in_out()
```

```tsx tabs
<View
  onPress={() => open.set(!open())}
  style={{
    width: 150,
    height: 72,
    borderRadius: open() ? 36 : 12,
    backgroundColor: open() ? "#8250df" : "#54aeff",
    translate: open() ? 120 : 0,
    transitionProperty: "all",
    transitionDuration: 300,
    transitionTimingFunction: "ease-in-out",
  }}
/>
```

| प्रॉपर्टी | मान | Rust |
|---|---|---|
| `transitionProperty` | क्या एनिमेट होता है: `"all"`, या अल्पविराम से अलग किए गए नाम: रंग (`"colors"`, `"backgroundColor"`, `"borderColor"`, ...), `"opacity"`, `"transform"` (हर ट्रांसफ़ॉर्म प्रॉपर्टी), `"boxShadow"`, `"borderRadius"` / `"borderWidth"` | `.transition()`, `.transition_all()`, `.transition_colors()`, `.transition_opacity()`, `.transition_transform()`, `.transition_shadow()` |
| `transitionDuration` | `300`, `"300ms"`, `"0.3s"` | `.duration(300.0)` |
| `transitionDelay` | अवधि की तरह | `.delay(100.0)` |
| `transitionTimingFunction` | `"linear"`, `"ease"`, `"ease-in"`, `"ease-out"`, `"ease-in-out"`, `"cubic-bezier(x1, y1, x2, y2)"` | `.ease_linear()`, `.ease_in()`, `.ease_out()`, `.ease_in_out()`, `.ease_bezier(x1, y1, x2, y2)` |

आकार और स्थितियाँ स्टाइल नहीं, लेआउट हैं, और ये ट्रांज़िशन नहीं होते; लेआउट के बदलावों को `LayoutAnimation` से एनिमेट करें या नेटिव एनिमेशन से मान चलाएँ ([एनिमेशन](./animation.md))।

<a id="keyframe-animations"></a>

### कीफ़्रेम एनिमेशन

`animationName` Tailwind के बिल्ट-इन कीफ़्रेम एनिमेशन में से एक को नेटिव रूप से चलाता है: `"spin"`, `"ping"`, `"pulse"` या `"bounce"`, साथ में `animationDuration`, `animationDelay`, `animationTimingFunction` और `animationIterationCount` (एक संख्या या `"infinite"`), किसी भी क्रम में। Rust में `.animate_spin()`, `.animate_ping()`, `.animate_pulse()` और `.animate_bounce()` इन्हें Tailwind की टाइमिंग के साथ चलाते हैं, और `.animation(KeyframeAnimation::new(..))` आपकी अपनी टाइमिंग के साथ:

```rust tabs
view()
    .size(px(24.0))
    .rounded(px(4.0))
    .bg(rgb(0x0969da))
    .animation(KeyframeAnimation::new(Keyframes::Spin).duration(1000.0).easing([0.0, 0.0, 1.0, 1.0]))
```

```tsx tabs
<View style={{ width: 24, height: 24, borderRadius: 4, backgroundColor: "#0969da", animationName: "spin", animationDuration: 1000, animationIterationCount: "infinite", animationTimingFunction: "linear" }} />
```

<a id="press-feedback"></a>

## प्रेस फ़ीडबैक

प्रेस फ़ीडबैक दबी हुई स्थिति के लिए ऐप की स्टाइल है, जो आपके कोड तक round trip किए बिना नेटिव रूप से लागू होती है; hovered, focused और disabled स्थितियाँ भी स्टाइल इसी तरह लेती हैं (Rust में `.hover(..)`, `.focus(..)`, `.disabled_style(..)`; TSX में `hoverStyle`, `focusStyle` और `disabledStyle`, या `hover:`, `focus:`, `disabled:`):

| Rust | TSX | दबे होने पर प्रभाव |
|---|---|---|
| `.active(\|s\| s.opacity(0.6))` | `activeStyle={{ opacity: 0.6 }}` | व्यू इस opacity तक फ़ेड हो जाता है |
| `.active(\|s\| s.bg(rgb(0xeaeef2)))` | `activeStyle={{ backgroundColor: "#eaeef2" }}` | बैकग्राउंड इस रंग का हो जाता है |
| `.ripple(Ripple { color: Some(rgba(0x00000022).into()), ..Ripple::default() })` | `android={{ ripple: { color: "#0002" } }}` | Android का material ripple |
| `.active(\|s\| s.bg(ZINC.shade(100)).scale(0.95))` | `class="active:bg-zinc-100 active:scale-95"` | कोई भी स्टाइल |

देखें [टच और जेस्चर](./touch-and-gestures.md)।

<a id="extensions"></a>

## एक्सटेंशन

ये keys और क्लासेज़ वह सब देती हैं जो नेटिव प्लैटफ़ॉर्म CSS से आगे करते हैं:

| Key | क्लास | यह क्या करता है |
|---|---|---|
| `placeholderColor` | `placeholder:text-*` | `<Input>` का placeholder रंग |
| `selectionColor` | `selection:bg-*` | `<Input>` या चयन-योग्य `<Text>` का सिलेक्शन हाइलाइट |
| `tintColor` | `tint-*` | `<Image>` के अपारदर्शी पिक्सेल को दोबारा रंगता है (टेम्पलेट इमेज, आइकन) |
| `borderCurve` | | `"continuous"`: किनारों में घुलते कोने, जैसे सिस्टम के अपने (Apple के continuous corners) |
| `glassEffect` | | iOS 26 और macOS 26 पर व्यू के पीछे Apple का Liquid Glass, अन्यत्र `backdropFilter` |
| `writingDirection` | | टेक्स्ट की बेस दिशा, `"auto"` (डिफ़ॉल्ट: उसकी सामग्री से, जैसा प्लैटफ़ॉर्म के टेक्स्ट व्यू करते हैं), `"ltr"` या `"rtl"`; `direction` लेआउट की दिशा तय करता है |
| `textAlignVertical` | | अपने `<Text>` बॉक्स से छोटा टेक्स्ट कहाँ बैठता है: `"top"` (डिफ़ॉल्ट), `"center"` या `"bottom"` |
| `textAlign: "auto"` | | टेक्स्ट की स्वाभाविक ओर, उसकी दिशा के अनुसार (डिफ़ॉल्ट) |
| `selectedStyle` | `selected:` | वह स्टाइल जब `accessibilityState.selected` का मान `true` हो (चयनित `Button`, एक टैब) |
| | `ios:`, `android:`, `web:` | किसी एक प्लैटफ़ॉर्म के लिए क्लासेज़ (`ios:pt-2`) |

जो मान बदलते हैं, वे वहाँ संख्याएँ भी लेते हैं जहाँ CSS स्ट्रिंग लेता है: `transform` स्टेप की सूची के रूप में, `translate` और `scale` `[x, y]` के रूप में, `boxShadow` और `textShadow` लेयर के रूप में।

<a id="related"></a>

## संबंधित

- [Tailwind](./tailwind.md): वही स्टाइल क्लासेज़ के रूप में, डार्क मोड, दबी हुई स्थितियों और ब्रेकपॉइंट के वैरिएंट के साथ, और उनके टाइप्ड समकक्ष।
- [लेआउट](./layout.md) और [टेक्स्ट](./text.md)।
- [स्टाइल रेफ़रेंस](../modules/style-reference.md): हर स्टाइल प्रॉपर्टी और उसका टाइप।
