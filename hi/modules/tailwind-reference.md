---
title: "Tailwind संदर्भ"
description: "NSH द्वारा नेटिव रूप से रेज़ॉल्व की जाने वाली हर Tailwind यूटिलिटी और वेरिएंट, arbitrary value सिंटैक्स, और nsh.json में थीम को एक्सटेंड करने का तरीका।"
order: 17
source_hash: 11bee6a70fb79c0f
---

# Tailwind संदर्भ

हर element अपने `class` prop में Tailwind CSS classes लेता है (और शर्त वाली classes `classList` में)। NSH इन्हें Rust में Tailwind 4 की default theme के विरुद्ध resolve करता है: JS केवल string पास करता है, हर अलग string एक बार parse होकर cache हो जाती है, और `dark:` या `active:` जैसे variants, appearance, window size या press state बदलने पर, बिना कोई JS चलाए, native रूप से दोबारा evaluate होते हैं।

हर utility ठीक वही सेट करती है जो Tailwind CSS 4 उसके लिए generate करता है, और उसका अर्थ वही है जो ब्राउज़र में होता है। यह पृष्ठ बताता है कि क्या समर्थित है। परिचय के लिए [Tailwind](../docs/tailwind.md) देखें; utilities जो style keys सेट करती हैं, उनके लिए [Style reference](./style-reference.md) देखें।

Rust components class strings नहीं लेते: वे `Styled` (`nsh_core::prelude`) के typed methods से elements को style करते हैं, जिनके नाम इन्हीं utilities पर आधारित हैं और जो वही मान resolve करते हैं, Tailwind के default scales सहित (`px-4` यानी `.px_4()`, `rounded-2xl` यानी `.rounded_2xl()`, `shadow-md` यानी `.shadow_md()`, `bg-linear-to-br` यानी `.bg_linear_to_br()`)। Colors मान (values) हैं: theme colors, या Tailwind का palette `nsh_core::element::palette` के रूप में (`ZINC.shade(800)` यानी `zinc-800`)। Variants ऐसे methods हैं जो styles का closure लेते हैं: `.active(|s| …)`, `.hover(…)`, `.focus(…)`, `.disabled_style(…)`, `.dark(…)`, `.group_active(…)`, और बाकी के लिए `.style_when(condition, …)`। [Style reference](./style-reference.md) हर style key का method बताता है।

```rust tabs
use nsh_core::{element::palette::{RED, ZINC}, prelude::*};

view()
    .flex_row()
    .items_center()
    .gap_3()
    .rounded_2xl()
    .bg(white())
    .p_4()
    .shadow_md()
    .active(|s| s.scale(0.98))
    .transition()
    .dark(|s| s.bg(ZINC.shade(800)))
    .child(
        text("Inbox")
            .text_base()
            .font_weight(FontWeight::SEMIBOLD)
            .text_color(ZINC.shade(900))
            .dark(|s| s.text_color(white())),
    )
    .child(
        text(move || unread.get().to_string())
            .text_color(move || if unread.get() > 0 { RED.shade(500) } else { ZINC.shade(400) }),
    )
```

```tsx tabs
<View class="flex-row items-center gap-3 rounded-2xl bg-white p-4 shadow-md active:scale-[0.98] transition dark:bg-zinc-800">
  <Text class="text-base font-semibold text-zinc-900 dark:text-white">Inbox</Text>
  <Text classList={{ "text-red-500": unread() > 0, "text-zinc-400": unread() === 0 }}>{unread()}</Text>
</View>
```

<a id="how-classes-combine"></a>

## Classes कैसे मिलती हैं

- **बाद वाली जीतती है।** एक ही variant स्तर की utilities में, string में बाद वाली जीतती है: `"p-4 p-2"` यानी `p-2`। कोई component `class` prop लेकर उसे अपनी classes के अंत में जोड़ सकता है, `tailwind-merge` के बिना।
- **Variants सादी utilities के बाद लागू होते हैं**, Tailwind के variant क्रम में: `group-*:` (पहले उनकी state से, फिर group नाम से), `selection:`, `placeholder:`, position (`first:` ...), `checked:`, `indeterminate:`, `selected:`, `focus-within:`, `hover:`, `focus:`, `focus-visible:`, `active:`, `enabled:`, `disabled:`, `aria-busy:`, `aria-checked:`, `aria-expanded:`, `aria-pressed:`, `aria-selected:`, `data-*:` (नाम से), motion, `max-*:` breakpoints चौड़े से पहले, फिर बढ़ते क्रम में breakpoints, orientation, direction, `dark:`, फिर platform। किसी class का सबसे ऊँचा variant तय करता है, फिर उसका अगला सबसे ऊँचा, और एक अतिरिक्त variant बाद में आता है (`dark:hover:` `dark:` के बाद), जैसा Tailwind उन्हें sort करता है। इसलिए `"active:bg-red-500 bg-blue-500"` दबाए जाने पर लाल होता है।
- **`style` classes पर जीतता है।** Inline `style` resolve हुई classes के ऊपर लागू होता है। Style key अपने नाम की CSS property है, वही जो utilities सेट करती हैं, इसलिए वह केवल उसी property को बदलती है, और कुछ नहीं: `style={{ paddingLeft: 8 }}`, `pl-4` को हराता है और `pr-4` को बनाए रखता है। Important utility (`!p-4` या `p-4!`) inline style पर भी जीतती है।
- **Text styles inherit होती हैं।** View पर text utilities (`text-white`, `font-bold`, `text-center`, ...) उसके अंदर के `<Text>` और `<Input>` elements तक पहुँचती हैं, जैसा CSS में होता है।
- **Display CSS वाला है।** `flex` और `inline-flex` row बनाते हैं, जब तक कोई direction utility कुछ और न कहे, चाहे वह string में कहीं भी हो (`flex-col flex` column है)। Style का `display: "flex"` भी उसी तरह row है; जो views कोई display सेट नहीं करते वे NSH का column default रखते हैं।

<a id="units-and-the-theme"></a>

## Units और theme

लंबाइयाँ points में होती हैं (`1` = iOS पर एक point, Android पर एक dp)। Tailwind का `1rem` 16 points है, इसलिए theme उसी density पर वेब से मेल खाती है: एक spacing step 4 points है (`p-4` = 16 points), `text-base` 16 points है।

<a id="spacing-values"></a>

### Spacing मान

जो utilities spacing मान लेती हैं (padding, margin, gap, inset, width, height, `basis`, `translate`, `leading`) वे ये स्वीकार करती हैं:

| मान | उदाहरण | परिणाम |
|---|---|---|
| Steps (चौथाई steps की अनुमति) | `p-4`, `gap-1.5`, `m-0.25` | step × 4 points |
| `px` | `p-px`, `-mt-px` | 1 point |
| `0` | `m-0` | 0 |
| Fraction (inset, width, height, `basis`, `translate`) | `w-1/2`, `left-1/3` | parent का प्रतिशत |
| `full` (वही) | `w-full`, `inset-full` | 100% |
| `auto` (margin, inset, width, height, basis) | `mx-auto`, `w-auto` | `"auto"` |
| Arbitrary | `p-[13px]`, `w-[42%]`, `mt-[1.5rem]` | दी गई लंबाई |

Margins, insets, `translate`, `rotate`, `skew`, `scale`, `z`, `hue-rotate`, `tracking`, `underline-offset`, `outline-offset`, grid lines और gradient angles negative मानों के लिए आगे `-` लेते हैं: `-mt-2`, `-translate-x-1/2`, `-rotate-6`। Tailwind में बाकियों का कोई negative रूप नहीं है (`-p-4`, `-gap-2`, `-w-4`), और NSH में भी नहीं है।

### Colors

पूरा Tailwind 4 palette built-in है: `red`, `orange`, `amber`, `yellow`, `lime`, `green`, `emerald`, `teal`, `cyan`, `sky`, `blue`, `indigo`, `violet`, `purple`, `fuchsia`, `pink`, `rose`, `slate`, `gray`, `zinc`, `neutral`, `stone`, `mauve`, `olive`, `mist`, `taupe`, हर एक shades `50`, `100`–`900`, `950` में; साथ में `black`, `white` और `transparent`। आपके अपने colors `nsh.json` से आते हैं (देखें [Theme customization](#theme-customization))।

हर color utility ये लेती है:

| रूप | उदाहरण |
|---|---|
| Theme color | `bg-sky-500`, `text-brand` |
| Opacity modifier (प्रतिशत) | `bg-black/50`, `ring-black/5` |
| Arbitrary opacity | `text-black/[0.35]` |
| Arbitrary color | `bg-[#0ea5e9]`, `border-[rgb(0_0_0_/_0.1)]`, `text-[oklch(70%_0.2_50)]` |
| Modifier के साथ arbitrary color | `bg-[rgb(0_0_255)]/25` |

`currentColor` और `inherit` color मान नहीं हैं। ब्राउज़र की तरह, color class के बिना border, outline या ring element के text color में बनता है, चाहे वह उसका अपना हो या inherit किया हुआ (`<View class="text-white"><View class="border ring-2" /></View>` दोनों को सफ़ेद बनाता है), और यही उस border के साथ भी होता है जिसकी चौड़ाई `style` prop बिना color के सेट करता है।

<a id="arbitrary-values"></a>

## Arbitrary मान

Square brackets ऐसा मान पास करते हैं जो theme में नहीं है: `w-[37px]`, `grid-cols-[200px_1fr]`, `bg-[linear-gradient(45deg,red,blue)]`।

- `_` एक space के लिए है (`grid-cols-[1fr_2fr]`); शाब्दिक underscore के लिए `\_` लिखें।
- लंबाइयाँ: केवल संख्या या `px` (points), `pt` (एक point का 4/3, जैसा CSS में), `rem` (16 points), और `%` जहाँ प्रतिशत का अर्थ बनता है।
- Angles (`rotate-[...]`, `hue-rotate-[...]`, `bg-linear-[...]`): `deg`, `rad`, `grad`, `turn`।
- Times (`duration-[...]`, `delay-[...]`): `ms` या `s`; केवल संख्या milliseconds मानी जाती है।
- Type hints अस्पष्ट मानों को तय करते हैं: `text-[length:22px]` एक size है, `text-[color:#333]` एक color; `border-[length:3px]` भी इसी तरह।

Arbitrary CSS properties (`[mask-type:luminance]`) समर्थित नहीं हैं।

## Layout

| Class | सेट करता है |
|---|---|
| `flex`, `inline-flex` | `display: "flex"`, और row, जब तक कोई direction utility मौजूद न हो |
| `grid`, `inline-grid` | `display: "grid"` |
| `block`, `flow-root` | block layout या स्वतंत्र block formatting context |
| `box-border`, `box-content` | आयामों में border और padding शामिल हैं, या केवल content |
| `w/h/size-min`, `w/h/size-max`, `w/h/size-fit` | Taffy intrinsic sizes: `min-content`, `max-content`, `fit-content` |
| `inline`, `inline-block` | `display: "block"`: flex या grid parent में ब्राउज़र उनके लिए जो गणना करता है |
| `hidden` | `display: "none"` |
| `relative`, `absolute` | `position` |
| `static` | `position: "static"`: flow में, इसके insets अनदेखे किए जाते हैं; absolute वंशज अपने निकटतम positioned पूर्वज का उपयोग करते हैं |
| `sticky` | `position: "sticky"`: flow में, यह अपने आसपास के scroll view के भीतर `top` पर चिपकता है (horizontal scroll view में `left`), जब तक इसका parent दिखाई दे रहा हो |
| `fixed` | `position: "fixed"`: ऐसा element जो अपने root view के box (window या उसका modal) में, उस root view के children के ऊपर लेआउट होता है, और आसपास की चीज़ें scroll होने पर भी अपनी जगह रहता है |
| `inset-<n>`, `inset-x-<n>`, `inset-y-<n>` | `top` / `right` / `bottom` / `left` |
| `top-<n>`, `right-<n>`, `bottom-<n>`, `left-<n>` | संबंधित offset |
| `start-<n>`, `end-<n>` | `start` / `end` (direction के अनुसार) |
| `z-<n>`, `z-auto`, `z-[<n>]` | `zIndex` (`z-auto` यानी 0) |
| `visible` | `visibility: "visible"` |
| `invisible`, `collapse` | `visibility: "hidden"` (अपनी जगह बनाए रखता है) |
| `overflow-hidden`, `overflow-clip`, `overflow-x-hidden`, `overflow-y-hidden` | `overflow: "hidden"` |
| `overflow-visible` | `overflow: "visible"` |
| `aspect-square`, `aspect-video`, `aspect-<a>/<b>`, `aspect-[<a>/<b>]`, `aspect-auto` | `aspectRatio` (1, 16/9, a/b, none) |

Scrolling एक element है, class नहीं: `overflow-auto` और `overflow-scroll` समर्थित नहीं हैं; [scroll](../elements/scroll.md) का उपयोग करें।

<a id="flexbox-and-grid"></a>

## Flexbox और grid

| Class | सेट करता है |
|---|---|
| `flex-row`, `flex-row-reverse`, `flex-col`, `flex-col-reverse` | `flexDirection` |
| `flex-wrap`, `flex-wrap-reverse`, `flex-nowrap` | `flexWrap` |
| `flex-1` | grow 1, shrink 1, basis 0 |
| `flex-<n>` | grow n, shrink 1, basis 0 |
| `flex-auto` | grow 1, shrink 1, basis auto |
| `flex-initial` | grow 0, shrink 1, basis auto |
| `flex-none` | grow 0, shrink 0, basis auto |
| `flex-[<grow>]`, `flex-[<grow>_<shrink>_<basis>]` | CSS shorthand: `flex-[2]`, `flex-[3_0_50%]` |
| `grow`, `grow-<n>`, `grow-[<n>]` | `flexGrow` (बिना मान के: 1) |
| `shrink`, `shrink-<n>`, `shrink-[<n>]` | `flexShrink` (बिना मान के: 1) |
| `basis-<n>` | `flexBasis` (spacing, fraction, `full`, `auto`, arbitrary) |
| `justify-start`, `justify-end`, `justify-center`, `justify-between`, `justify-around`, `justify-evenly`, `justify-stretch`, `justify-normal` | `justifyContent` |
| `items-start`, `items-end`, `items-center`, `items-baseline`, `items-stretch` | `alignItems` |
| `self-auto`, `self-start`, `self-end`, `self-center`, `self-stretch`, `self-baseline` | `alignSelf` |
| `content-start`, `content-end`, `content-center`, `content-between`, `content-around`, `content-evenly`, `content-stretch`, `content-normal` | `alignContent` |
| `justify-items-start`, `-end`, `-center`, `-stretch`, `-normal` | `justifyItems` |
| `justify-self-auto`, `-start`, `-end`, `-center`, `-stretch` | `justifySelf` |
| `place-content-center`, `-start`, `-end`, `-between`, `-stretch` | `alignContent` और `justifyContent` |
| `place-items-center`, `-start`, `-end`, `-stretch` | `alignItems` और `justifyItems` |
| `place-self-auto`, `-center`, `-start`, `-end`, `-stretch` | `alignSelf` और `justifySelf` |
| `gap-<n>`, `gap-x-<n>`, `gap-y-<n>` | `gap`, `columnGap`, `rowGap` |
| `space-x-<n>`, `space-y-<n>` (और negative) | आखिरी को छोड़कर हर child पर margin: end margin (`space-x`) या bottom वाला (`space-y`), child के अपने margins के नीचे, जैसा Tailwind CSS में होता है; यह `gap` में जुड़ता है |
| `space-x-reverse`, `space-y-reverse` | इसके बजाय start / top तरफ़ का margin (children उल्टे क्रम में) |
| `grid-cols-<n>` | `gridTemplateColumns: "repeat(n, minmax(0, 1fr))"` |
| `grid-cols-[<tracks>]`, `grid-cols-none` | `gridTemplateColumns` (`grid-cols-[200px_1fr]`) |
| `grid-rows-<n>`, `grid-rows-[<tracks>]`, `grid-rows-none` | `gridTemplateRows` |
| `col-span-<n>`, `col-span-full`, `col-auto`, `col-<n>`, `col-[<value>]` | `gridColumn` |
| `col-start-<n>`, `col-end-<n>` (और `-auto`) | `gridColumnStart`, `gridColumnEnd` |
| `row-span-<n>`, `row-span-full`, `row-auto`, `row-<n>`, `row-[<value>]` | `gridRow` |
| `row-start-<n>`, `row-end-<n>` (और `-auto`) | `gridRowStart`, `gridRowEnd` |
| `grid-flow-row`, `grid-flow-col`, `grid-flow-dense`, `grid-flow-row-dense`, `grid-flow-col-dense` | `gridAutoFlow` |
| `auto-cols-auto`, `-min`, `-max`, `-fr`, `auto-cols-[<track>]` | `gridAutoColumns` |
| `auto-rows-auto`, `-min`, `-max`, `-fr`, `auto-rows-[<track>]` | `gridAutoRows` |

## Spacing

| Class | सेट करता है |
|---|---|
| `p-<n>`, `px-<n>`, `py-<n>` | `padding`, `paddingHorizontal`, `paddingVertical` |
| `pt-<n>`, `pr-<n>`, `pb-<n>`, `pl-<n>` | `paddingTop` / `Right` / `Bottom` / `Left` |
| `ps-<n>`, `pe-<n>` | `paddingStart`, `paddingEnd` (direction के अनुसार) |
| `m-<n>`, `mx-<n>`, `my-<n>` | `margin`, `marginHorizontal`, `marginVertical` |
| `mt-<n>`, `mr-<n>`, `mb-<n>`, `ml-<n>` | `marginTop` / `Right` / `Bottom` / `Left` |
| `ms-<n>`, `me-<n>` | `marginStart`, `marginEnd` (direction के अनुसार) |

## Sizing

| Class | सेट करता है |
|---|---|
| `w-<n>`, `h-<n>` | `width`, `height` (spacing, fraction, `full`, `auto`, arbitrary) |
| `size-<n>` | `width` और `height` |
| `min-w-<n>`, `max-w-<n>`, `min-h-<n>`, `max-h-<n>` | संबंधित सीमा |
| `w-screen`, `w-dvw`, `w-svw`, `w-lvw` | window की चौड़ाई (`min-w-` / `max-w-` पर भी) |
| `h-screen`, `h-dvh`, `h-svh`, `h-lvh` | window की ऊँचाई (`min-h-` / `max-h-` पर भी) |
| `w-auto`, `h-auto` | `auto` (आकार content से तय होता है) |
| `max-w-none`, `max-h-none` | कोई सीमा नहीं |
| `w-<container>`, `min-w-<container>`, `max-w-<container>` | container की चौड़ाई (नीचे) |

Container की चौड़ाइयाँ (points में): `3xs` 256, `2xs` 288, `xs` 320, `sm` 384, `md` 448, `lg` 512, `xl` 576, `2xl` 672, `3xl` 768, `4xl` 896, `5xl` 1024, `6xl` 1152, `7xl` 1280; `prose` element के font के `0` की चौड़ाई का 65 गुना है (CSS का `65ch`), जैसा Tailwind CSS में होता है।

## Typography

### Font

| Class | सेट करता है |
|---|---|
| `font-sans` | system font |
| `font-serif`, `font-mono` | `fontFamily: "serif"` / `"monospace"` |
| `font-thin` (100), `font-extralight` (200), `font-light` (300), `font-normal` (400), `font-medium` (500), `font-semibold` (600), `font-bold` (700), `font-extrabold` (800), `font-black` (900) | `fontWeight` |
| `font-[<weight>]`, `font-[<family>]` | संख्यात्मक weight, अन्यथा family: `font-[650]`, `font-[Inter]` |
| `italic`, `not-italic` | `fontStyle` |
| `normal-nums`, `small-caps`, `oldstyle-nums`, `lining-nums`, `tabular-nums`, `proportional-nums` | `fontVariant` (ये आपस में जुड़ते हैं; `normal-nums` number forms को रीसेट करता है) |

<a id="size-color-and-line-height"></a>

### Size, color और line height

`text-<size>` font size और Tailwind की उससे मेल खाती line height सेट करता है, जिसे `leading-*` class बदल देती है, चाहे वह string में कहीं भी हो और उसका variant कुछ भी हो (`leading-tight md:text-lg` तंग leading को बनाए रखता है):

| Class | Size | Line height |
|---|---|---|
| `text-xs` | 12 | 16 |
| `text-sm` | 14 | 20 |
| `text-base` | 16 | 24 |
| `text-lg` | 18 | 28 |
| `text-xl` | 20 | 28 |
| `text-2xl` | 24 | 32 |
| `text-3xl` | 30 | 36 |
| `text-4xl` | 36 | 40 |
| `text-5xl` | 48 | 1× |
| `text-6xl` | 60 | 1× |
| `text-7xl` | 72 | 1× |
| `text-8xl` | 96 | 1× |
| `text-9xl` | 128 | 1× |

| Class | सेट करता है |
|---|---|
| `text-<size>/<leading>` | size और line height: `text-sm/6` (24 points), `text-lg/tight` |
| `text-[<length>]` | `fontSize`: `text-[22px]`, `text-[length:22px]` |
| `text-<color>` | `color` |
| `leading-none` (1), `leading-tight` (1.25), `leading-snug` (1.375), `leading-normal` (1.5), `leading-relaxed` (1.625), `leading-loose` (2) | font size के गुणक के रूप में `lineHeight` |
| `leading-<n>`, `leading-[<length>]` | points में `lineHeight` (`leading-6` = 24) |
| `leading-[<number>]` | font size के गुणक के रूप में `lineHeight` (`leading-[1.5]`), उसी गुणक के रूप में inherit होता है; `em` और `%` inheritance से पहले element के font size पर एक लंबाई की गणना करते हैं |
| `tracking-tighter` (-0.05em), `tracking-tight` (-0.025em), `tracking-normal` (0), `tracking-wide` (0.025em), `tracking-wider` (0.05em), `tracking-widest` (0.1em) | font size के सापेक्ष `letterSpacing` |
| `tracking-[<value>]` | `letterSpacing`: `tracking-[0.2em]`, `tracking-[1px]` |

<a id="alignment-case-and-wrapping"></a>

### Alignment, case और wrapping

| Class | सेट करता है |
|---|---|
| `text-left`, `text-center`, `text-right`, `text-justify` | `textAlign` |
| `text-start`, `text-end` | `textAlign: "start"` / `"end"`: layout direction में पंक्ति की शुरुआत या अंत |
| `align-baseline`, `align-text-top`, `align-text-bottom`, `align-middle` | `verticalAlign` (text के अंदर views और images) |
| `uppercase`, `lowercase`, `capitalize`, `normal-case` | `textTransform` |
| `truncate` | एक पंक्ति, अंत में ellipsis, कोई wrapping नहीं, `overflow: hidden` (view पर: उसके texts wrap नहीं होते) |
| `line-clamp-<n>`, `line-clamp-none` | `numberOfLines` (`none` हर पंक्ति दिखाता है) |
| `text-ellipsis`, `text-clip` | `textOverflow: "ellipsis"` / `"clip"` |
| `whitespace-nowrap`, `text-nowrap` | पंक्तियाँ कभी wrap नहीं होतीं; view पर, उसके अंदर के texts की पंक्तियाँ (inherit होता है, जैसा CSS का `white-space`) |
| `whitespace-normal`, `text-wrap`, `text-balance`, `text-pretty` | पंक्तियाँ wrap होती हैं (balancing नहीं की जाती) |
| `select-text`, `select-none` | `userSelect: "text"` / `"none"`; view पर, उसके अंदर के उन texts की जो कुछ सेट नहीं करते |
| `select-auto` | `userSelect: "auto"`: आसपास का view तय करता है, जैसा CSS का `user-select: auto` (`select-none md:select-auto`) |
<a id="decoration-and-shadow"></a>

### सजावट और शैडो

| क्लास | सेट करता है |
|---|---|
| `underline`, `line-through`, `no-underline` | `textDecorationLine` |
| `decoration-solid`, `decoration-double`, `decoration-dotted`, `decoration-dashed`, `decoration-wavy` | `textDecorationStyle` |
| `decoration-<n>`, `decoration-[<length>]` | `textDecorationThickness` |
| `decoration-auto`, `decoration-from-font` | `textDecorationThickness: "auto"` |
| `decoration-<color>` | `textDecorationColor` |
| `underline-offset-<n>`, `underline-offset-[<length>]`, `underline-offset-auto` | `textUnderlineOffset` |
| `text-shadow-2xs`, `-xs`, `-sm`, `-md`, `-lg`; `/<alpha>` | थीम से एक टेक्स्ट शैडो (एक लेयर: थीम की सबसे चौड़ी लेयर); मॉडिफ़ायर लेयरों का अल्फ़ा है: `text-shadow-md/20` |
| `text-shadow-<color>`, `text-shadow-current` | इसका रंग, साइज़ के अल्फ़ा पर |
| `text-shadow-none` | इसे हटाता है |

Tailwind के टेक्स्ट शैडो में कई लेयर होती हैं; नेटिव रूप से एक शैडो बनाया जाता है, सबसे चौड़ी लेयर।

<a id="inputs"></a>

### इनपुट

| क्लास | सेट करता है |
|---|---|
| `placeholder:text-<color>` | `placeholderColor` |
| `selection:bg-<color>` | `selectionColor` (इनपुट या चुने जा सकने वाले टेक्स्ट की सिलेक्शन हाइलाइट, और एलिमेंट के भीतर मौजूद इनपुट व टेक्स्ट की भी) |
| `caret-<color>` | कर्सर का रंग |

<a id="backgrounds"></a>

## बैकग्राउंड

| क्लास | सेट करता है |
|---|---|
| `bg-<color>` | `backgroundColor` |
| `bg-[<gradient>]` | `backgroundImage`: `bg-[linear-gradient(45deg,red,blue)]`, `bg-[radial-gradient(...)]` |
| `bg-linear-to-t`, `-tr`, `-r`, `-br`, `-b`, `-bl`, `-l`, `-tl` | किसी तरफ़ या कोने की ओर एक लीनियर ग्रेडिएंट (`bg-gradient-to-*` v3 का नाम है) |
| `bg-linear-<angle>`, `bg-linear-[<angle>]` | किसी कोण पर एक लीनियर ग्रेडिएंट: `bg-linear-45`, `-bg-linear-12`, `bg-linear-[0.25turn]` |
| `bg-radial` | केंद्र से एक रेडियल ग्रेडिएंट |
| `bg-conic`, `bg-conic-<angle>` | एक कोनिक ग्रेडिएंट, वैकल्पिक रूप से किसी कोण से शुरू |
| `from-<color>`, `via-<color>`, `to-<color>` | ग्रेडिएंट के स्टॉप (डिफ़ॉल्ट रूप से सिरों पर पारदर्शी) |
| `from-<p>%`, `via-<p>%`, `to-<p>%` | स्टॉप की पोज़िशन: `via-40%`, `from-[15%]` |
| `bg-none` | ग्रेडिएंट को हटाता है |

ग्रेडिएंट यूटिलिटी अपने रंगों को Oklab में मिलाती हैं, जैसा Tailwind CSS उन्हें लिखता है (`in oklab`); किसी मनमानी पोज़िशन (`bg-linear-[25deg]`, `bg-conic-[0.25turn]`) पर वे CSS के डिफ़ॉल्ट का पालन करती हैं: पैलेट के रंगों के साथ Oklab, और जब हर स्टॉप hex, `rgb()`, `hsl()` या नामित रंग हो तब sRGB।

```rust tabs
view()
    .h_32()
    .rounded_2xl()
    .bg_linear_to_br()
    .gradient_from(INDIGO.shade(500))
    .gradient_via(PURPLE.shade(500))
    .gradient_via_position(percentage(0.4))
    .gradient_to(PINK.shade(500))
```

```tsx tabs
<View class="h-32 rounded-2xl bg-linear-to-br from-indigo-500 via-purple-500 via-40% to-pink-500" />
```

<a id="borders"></a>

## बॉर्डर

| क्लास | सेट करता है |
|---|---|
| `border`, `border-<n>`, `border-[<length>]` | `borderWidth` (अकेला: 1) |
| `border-x`, `border-y`, `border-t`, `border-r`, `border-b`, `border-l`, `border-s`, `border-e` (`-<n>` के साथ या अकेले) | संबंधित तरफ़ों की चौड़ाई |
| `border-<color>`, `border-t-<color>`, ... | `borderColor` और प्रति-तरफ़ के रंग |
| `border-solid`, `border-dashed`, `border-dotted` | `borderStyle` |
| `border-none`, `border-hidden` | `borderStyle: "none"` / `"hidden"`: चौड़ाई क्लास चाहे जो हों और जिस क्रम में हों, कोई बॉर्डर नहीं (`md:border-solid` इसे फिर दिखाता है) |
| `rounded`, `rounded-<size>`, `rounded-none`, `rounded-full`, `rounded-[<length>]` | `borderRadius` (अकेला: `sm`) |
| `rounded-t-`, `-r-`, `-b-`, `-l-`, `-tl-`, `-tr-`, `-br-`, `-bl-` | संबंधित कोने |
| `rounded-s-`, `-e-`, `-ss-`, `-se-`, `-es-`, `-ee-` | शुरुआती / अंतिम कोने (दिशा के अनुसार): `borderTopStartRadius`, `borderTopEndRadius`, `borderBottomStartRadius`, `borderBottomEndRadius` |
| `outline`, `outline-<n>`, `outline-[<length>]` | `outlineWidth` (अकेला: 1), सॉलिड रहता है जब तक स्ट्रिंग में कहीं कोई स्टाइल क्लास न हो (`outline-dashed outline-2` डैश्ड है, `outline-none outline-2` कुछ नहीं बनाता) |
| `outline-<color>` | `outlineColor` |
| `outline-solid`, `outline-dashed`, `outline-dotted`, `outline-none`, `outline-hidden` | `outlineStyle`; अकेली स्टाइल CSS की medium चौड़ाई है, 3 पॉइंट |
| `outline-offset-<n>`, `outline-offset-[<length>]` | `outlineOffset` |

रेडियस साइज़ (पॉइंट में): `xs` 2, `sm` 4, `md` 6, `lg` 8, `xl` 12, `2xl` 16, `3xl` 24, `4xl` 32, `full` 9999।

<a id="rings"></a>

### रिंग

रिंग स्प्रेड वाले बॉक्स शैडो हैं, जो बॉर्डर के बाहर बनते हैं और जगह नहीं घेरते।

| क्लास | सेट करता है |
|---|---|
| `ring`, `ring-<n>`, `ring-[<length>]` | उस चौड़ाई की एक रिंग (अकेला: 1) |
| `ring-<color>` | इसका रंग (डिफ़ॉल्ट रूप से एलिमेंट का टेक्स्ट रंग) |
| `ring-inset` | रिंग को अंदर बनाता है |
| `ring-offset-<n>`, `ring-offset-<color>` | एलिमेंट और रिंग के बीच एक गैप (डिफ़ॉल्ट सफ़ेद) |
| `inset-ring`, `inset-ring-<n>`, `inset-ring-<color>` | एक भीतरी रिंग |

<a id="effects"></a>

## इफ़ेक्ट

| क्लास | सेट करता है |
|---|---|
| `shadow-2xs`, `shadow-xs`, `shadow-sm`, `shadow`, `shadow-md`, `shadow-lg`, `shadow-xl`, `shadow-2xl`; `/<alpha>` | थीम से `boxShadow`; मॉडिफ़ायर लेयरों का अल्फ़ा है: `shadow-xl/20` |
| `shadow-[<box-shadow>]` | एक मनमाना शैडो: `shadow-[0_8px_24px_rgb(0_0_0_/_0.12)]` |
| `shadow-<color>`, `shadow-current` | शैडो लेयरों का रंग बदलता है, साइज़ के अल्फ़ा पर: `shadow-indigo-500/40` |
| `shadow-none` | कोई शैडो नहीं |
| `inset-shadow-2xs`, `-xs`, `-sm`, `inset-shadow`, `inset-shadow-[...]`, `inset-shadow-<color>`, `inset-shadow-none` | एक भीतरी शैडो |
| `opacity-<n>`, `opacity-[<value>]` | `opacity`: `opacity-50` = 0.5 |
| `mix-blend-<mode>` | `mixBlendMode`: `normal`, `multiply`, `screen`, `overlay`, `darken`, `lighten`, `color-dodge`, `color-burn`, `hard-light`, `soft-light`, `difference`, `exclusion`, `hue`, `saturation`, `color`, `luminosity`, `plus-darker`, `plus-lighter` |

शैडो, रिंग और इनसेट शैडो CSS की तरह एक ही `boxShadow` सूची में मिल जाते हैं। शैडो का रंग हर लेयर के रंग को, अल्फ़ा सहित, बदल देता है, जैसा Tailwind का `--tw-shadow-color` करता है: `shadow-md shadow-red-500` एक अपारदर्शी लाल शैडो है, `shadow-md/20 shadow-red-500` 20% वाला।

<a id="filters"></a>

## फ़िल्टर

| क्लास | सेट करता है |
|---|---|
| `blur`, `blur-xs` (4), `-sm` (8), `-md` (12), `-lg` (16), `-xl` (24), `-2xl` (40), `-3xl` (64), `blur-none`, `blur-[<length>]` | `blur()` |
| `brightness-<n>`, `contrast-<n>`, `saturate-<n>` | प्रतिशत गुणक: `brightness-125` = 1.25 |
| `grayscale`, `grayscale-<n>`, `invert`, `invert-<n>`, `sepia`, `sepia-<n>` | अकेला: 100% |
| `hue-rotate-<deg>`, `-hue-rotate-<deg>` | `hue-rotate()` |
| `drop-shadow`, `drop-shadow-xs`, `-sm`, `-md`, `-lg`, `-xl`, `-2xl`, `drop-shadow-[...]`, `drop-shadow-none`; `drop-shadow-<color>`, `drop-shadow-current`; दोनों में से किसी पर `/<alpha>` | हर लेयर के लिए एक `drop-shadow()`, अन्य फ़िल्टरों के बाद; रंग लेयरों के रंग को साइज़ के अल्फ़ा पर बदल देता है; वेब, Linux, Windows और GPUI हर लेयर बनाते हैं, iOS, macOS और Android सबसे चौड़ी लेयर |
| `drop-shadow-none` | इसे हटाता है |
| `filter-none` | सभी फ़िल्टर हटाता है |
| `backdrop-blur`, `backdrop-blur-<size>`, `backdrop-blur-[<length>]` | व्यू के पीछे की चीज़ को धुंधला करता है |
| `backdrop-brightness-<n>`, `backdrop-contrast-<n>`, `backdrop-grayscale`, `backdrop-hue-rotate-<deg>`, `backdrop-invert`, `backdrop-opacity-<n>`, `backdrop-saturate-<n>`, `backdrop-sepia` | बैकड्रॉप फ़िल्टर |
| `backdrop-filter-none` | उन्हें हटाता है |

> [!WARNING]
> iOS व्यू पर केवल `opacity`, 1 तक का `brightness` और `drop-shadow` लागू करता है; `<Image>` हर कलर फ़िल्टर और `blur` लेता है। Android को `blur`, `drop-shadow` और बैकड्रॉप ब्लर के लिए API 31 चाहिए। [Style reference](./style-reference.md#filters-and-blending) देखें।

<a id="transforms"></a>

## ट्रांसफ़ॉर्म

| क्लास | सेट करता है |
|---|---|
| `translate-x-<n>`, `translate-y-<n>`, `translate-<n>` | `translate` (स्पेसिंग, `full`, एलिमेंट के अपने साइज़ के अंश: `-translate-x-1/2`, मनमाना) |
| `rotate-<deg>`, `rotate-[<angle>]` | `rotate` |
| `rotate-x-<deg>`, `rotate-y-<deg>`, `rotate-z-<deg>` | 3D रोटेशन (`transform` में, ट्रांसलेशन, रोटेशन और स्केल के बाद) |
| `scale-<pct>`, `scale-x-<pct>`, `scale-y-<pct>`, `scale-[<factor>]` | `scale`: `scale-95` = 0.95, `-scale-x-100` मिरर करता है |
| `skew-<deg>`, `skew-x-<deg>`, `skew-y-<deg>` | स्क्यू, `transform` में (Android पर नहीं) |
| `perspective-dramatic` (100), `-near` (300), `-normal` (500), `-midrange` (800), `-distant` (1200), `perspective-[<length>]`, `perspective-none` | एलिमेंट के चाइल्ड के 3D रोटेशन के लिए गहराई, उसके केंद्र से देखी गई (CSS का `perspective`: `<View class="perspective-near"><View class="rotate-y-45" /></View>`) |
| `origin-center`, `-top`, `-top-right`, `-right`, `-bottom-right`, `-bottom`, `-bottom-left`, `-left`, `-top-left`, `origin-[<value>]` | `transformOrigin` |
| `backface-hidden`, `backface-visible` | `backfaceVisibility` |
| `transform-none` | 3D रोटेशन और स्क्यू साफ़ करता है (CSS का `transform: none`) |
| `translate-none`, `rotate-none`, `scale-none` | ट्रांसलेशन, रोटेशन, स्केल साफ़ करता है |

ट्रांसफ़ॉर्म यूटिलिटी CSS की तरह कंपोज़ होती हैं: `translate-*`, `rotate-*` और `scale-*` क्रमशः `translate`, `rotate` और `scale` प्रॉपर्टी सेट करती हैं और क्रम की परवाह किए बिना मिल जाती हैं, फिर `transform` लागू होता है (`rotate-x-*`, `skew-*`)। `style` प्रॉप की उन्हीं नामों वाली कीज़ केवल अपनी प्रॉपर्टी बदलती हैं: `style={{ scale: 1.1 }}` `scale-95` को बदलता है और `rotate-3` को रखता है। `transform`, `transform-gpu`, `transform-cpu` और `transform-flat` स्वीकार किए जाते हैं और कुछ नहीं करते: NSH हर ट्रांसफ़ॉर्म को एक ही तरह, फ़्लैट, कंपोज़ करता है। साइज़ के किसी अंश से किए गए ट्रांसलेशन एलिमेंट के फ़्रेम के सापेक्ष हल किए जाते हैं और उसके आकार बदलने पर उसके साथ चलते हैं।

<a id="transitions-and-animation"></a>

## ट्रांज़िशन और एनिमेशन

| क्लास | सेट करता है |
|---|---|
| `transition` | रंग, ओपैसिटी, शैडो और ट्रांसफ़ॉर्म; 150 ms, `cubic-bezier(0.4, 0, 0.2, 1)` |
| `transition-all`, `transition-colors`, `transition-opacity`, `transition-shadow`, `transition-transform` | एनिमेट होने वाली प्रॉपर्टी |
| `transition-none` | कोई ट्रांज़िशन नहीं |
| `duration-<ms>`, `duration-[<time>]` | `transitionDuration`: `duration-300`, `duration-[0.4s]` |
| `delay-<ms>`, `delay-[<time>]` | `transitionDelay` |
| `ease-linear`, `ease-in`, `ease-out`, `ease-in-out`, `ease-initial`, `ease-[cubic-bezier(...)]` | `transitionTimingFunction` |
| `animate-spin`, `animate-ping`, `animate-pulse`, `animate-bounce` | एक नेटिव कीफ़्रेम एनिमेशन, हमेशा दोहराया जाने वाला |
| `animate-none` | इसे रोकता है |

ट्रांज़िशन UI थ्रेड पर तब चलते हैं जब कोई मान बदलता है, इसमें वह स्थिति भी शामिल है जब कोई वेरिएंट मेल खाना शुरू या बंद करता है, इसलिए `transition active:scale-95` बिना JS के प्रेस को एनिमेट करता है। रिड्यूस-मोशन सेटिंग का सम्मान करने के लिए एनिमेशन को `motion-safe:` में लपेटें।

<a id="interactivity"></a>

## इंटरैक्टिविटी

| क्लास | सेट करता है |
|---|---|
| `pointer-events-none`, `pointer-events-auto` | `pointerEvents: "none"` / `"auto"`: व्यू टच और पॉइंटर का टारगेट है या नहीं, CSS की तरह इनहेरिट होता है: `pointer-events-none` व्यू के भीतर, `pointer-events-auto` वाला फिर से टारगेट बन जाता है |
| `cursor-<name>`, `cursor-[<name>]` | `cursor`: `cursor-pointer`, `cursor-grab`, `cursor-not-allowed`, ... (हर CSS कर्सर कीवर्ड) |
| `select-none`, `select-text`, `select-auto` | टेक्स्ट सिलेक्शन (Typography देखें) |

## SVG

| क्लास | सेट करता है |
|---|---|
| `fill-<color>`, `fill-none`, `fill-current`, `fill-inherit` | `fill` (`fill-current` `currentColor` है) |
| `stroke-<color>`, `stroke-none`, `stroke-current`, `stroke-inherit` | `stroke` |
| `stroke-<number>`, `stroke-[<length>]` | `strokeWidth` |

<a id="images"></a>

## इमेज

| क्लास | सेट करता है |
|---|---|
| `object-cover`, `object-contain`, `object-fill`, `object-none`, `object-scale-down` | `objectFit` (`fill` खींचता है, `none` प्राकृतिक साइज़ रखता है और `objectPosition` पर रखता है, `scale-down` वही है, पर जहाँ बड़ा हो वहाँ फ़िट होने तक छोटा करता है); इमेज और वीडियो |
| `object-top`, `object-bottom`, `object-left`, `object-right`, `object-center`, `object-top-left`, `object-top-right`, `object-bottom-left`, `object-bottom-right`, `object-[<position>]` | `objectPosition` (`object-left-top`, ... `object-top-left`, ... के समान हैं) |
| `tint-<color>` | `tintColor` (टेम्पलेट इमेज का रंग बदलता है) |

<a id="accepted-without-effect"></a>

## बिना प्रभाव के स्वीकार किए गए

ये यूटिलिटी रेंडरिंग संकेत हैं, या वह जो हर नेटिव व्यू पहले से है; ये बिना चेतावनी के पार्स होती हैं और कुछ नहीं बदलतीं: `antialiased`, `subpixel-antialiased`, `isolation-auto`, `box-border`, `appearance-none`, `appearance-auto`, `will-change-auto`, `will-change-scroll`, `will-change-contents`, `will-change-transform`, `will-change-[<value>]`, `transform`, `transform-gpu`, `transform-cpu`, `transform-flat`। स्क्रॉलिंग, स्नैपिंग और ओवरस्क्रॉल [scroll](../elements/scroll.md) के प्रॉप हैं।

<a id="not-supported"></a>

## समर्थित नहीं

`peer-*` वेरिएंट, स्यूडो-एलिमेंट (`before:`, `after:`), मनमानी प्रॉपर्टी (`[prop:value]`), `overflow-auto` / `overflow-scroll`, `divide-*`, `columns-*`, `float-*`, `container`, कंटेनर क्वेरी, `order-*`, `transform-3d`, `select-all`, `border-double` / `outline-double`, इंट्रिन्सिक min/max कंस्ट्रेंट (जैसे `max-w-max`), `snap-*`, `scroll-*`, `overscroll-*`, `touch-*` और `isolate` अज्ञात क्लास हैं। `nsh build` और `nsh dev` आपके सोर्स में मिलने वाली अज्ञात क्लास के बारे में चेतावनी देते हैं (`file:line:col: unknown class '...'`), और रनटाइम हर अज्ञात क्लास को एक बार लॉग करता है।

<a id="variants"></a>

## वेरिएंट

वेरिएंट किसी यूटिलिटी को सशर्त बनाते हैं: `dark:bg-zinc-900`, `md:flex-row`, `active:opacity-70`। ये स्टैक हो सकते हैं (`dark:active:bg-zinc-700`) और जब भी वह बदलता है जिस पर वे निर्भर हैं, नेटिव रूप से मूल्यांकित होते हैं।

<a id="appearance-and-environment"></a>

### दिखावट और परिवेश

| वेरिएंट | कब लागू होता है | Rust |
|---|---|---|
| `dark:` | दिखावट डार्क हो | `.dark(\|s\| …)` |
| `ios:` | iOS या Mac Catalyst पर चल रहा हो | `.when(os() == Os::Ios, …)` |
| `android:` | Android पर चल रहा हो | `.when(os() == Os::Android, …)` |
| `portrait:`, `landscape:` | विंडो चौड़ाई से ज़्यादा ऊँची हो / ऊँचाई से ज़्यादा चौड़ी हो | `.style_when(move \|\| window().height > window().width, …)` |
| `ltr:`, `rtl:` | लेआउट की दिशा | `.style_when(rtl, …)` |
| `motion-safe:`, `motion-reduce:` | उपयोगकर्ता ने कम गति का अनुरोध नहीं किया है / किया है | `.style_when(reduce_motion, …)` |

<a id="breakpoints"></a>

### ब्रेकपॉइंट

ब्रेकपॉइंट विंडो की चौड़ाई की तुलना पॉइंट में करते हैं।

| वेरिएंट | न्यूनतम चौड़ाई |
|---|---|
| `sm:` | 640 |
| `md:` | 768 |
| `lg:` | 1024 |
| `xl:` | 1280 |
| `2xl:` | 1536 |

| रूप | उदाहरण | कब लागू होता है |
|---|---|---|
| `<bp>:` | `md:p-8` | चौड़ाई ≥ ब्रेकपॉइंट |
| `max-<bp>:` | `max-md:p-1` | चौड़ाई < ब्रेकपॉइंट |
| `min-[<length>]:` | `min-[600px]:grid-cols-3` | चौड़ाई ≥ लंबाई |
| `max-[<length>]:` | `max-[400px]:text-sm` | चौड़ाई < लंबाई |

पोर्ट्रेट में एक फ़ोन (390 पॉइंट चौड़ा) किसी भी डिफ़ॉल्ट ब्रेकपॉइंट से मेल नहीं खाता; एक टैबलेट या लैंडस्केप में फ़ोन कई से मेल खाता है। Rust में, ब्रेकपॉइंट विंडो पर एक शर्त है: `.style_when(move || window().width >= px(768.0), |s| s.p_8())` `md:p-8` है।

<a id="interaction-states"></a>

### इंटरैक्शन स्टेट

स्टेट को प्लेटफ़ॉर्म केवल उन्हीं एलिमेंट के लिए ट्रैक करता है जिनकी क्लास उनका उपयोग करती हैं, और बदलाव नेटिव रूप से लागू होते हैं, बिना JS राउंड ट्रिप के।

| वेरिएंट | कब लागू होता है | Rust |
|---|---|---|
| `active:` | एलिमेंट दबा हुआ हो | `.active(\|s\| …)` |
| `hover:` | उस पर पॉइंटर हो (iPad पॉइंटर, Mac Catalyst, Android माउस) | `.hover(\|s\| …)` |
| `focus:`, `focus-visible:` | इनपुट पर फ़ोकस हो | `.focus(\|s\| …)` |
| `focus-within:` | एलिमेंट या उसके किसी डिसेंडेंट पर फ़ोकस हो (`Overlay` की सामग्री उस एलिमेंट का डिसेंडेंट है जिसमें वह है) | `.focus_within(…)` |
| `disabled:` | एलिमेंट में `disabled` प्रॉप हो | `.disabled_style(\|s\| …)` |
| `enabled:` | एलिमेंट में `disabled` प्रॉप न हो |  |
| `selected:` | एलिमेंट चुना हुआ हो: `Button` का `selected`, या `accessibilityState.selected` |  |
| `checked:` | एलिमेंट चेक्ड हो: `accessibilityState.checked` `true` है (`"mixed"` चेक्ड नहीं है) |  |
| `indeterminate:` | एलिमेंट इंडिटरमिनेट हो: `accessibilityState.checked` `"mixed"` है |  |
| `aria-expanded:` | एलिमेंट एक्सपैंडेड हो: `accessibilityState.expanded` `true` है (`Popover` या `Menu` का ट्रिगर, जब उसका पॉपअप खुला हो) |  |
| `aria-pressed:` | एलिमेंट एक टॉगल बटन हो जो ऑन है: `accessibilityState.pressed` `true` है (`"mixed"` दबा हुआ नहीं है; `active:` नहीं, जो जारी प्रेस है) | `.aria_pressed(\|s\| …)` |
| `aria-busy:` | एलिमेंट व्यस्त हो: `accessibilityState.busy` `true` है |  |
| `aria-checked:` | एलिमेंट चेक्ड हो: `accessibilityState.checked` `true` है, `checked:` की तरह |  |
| `aria-selected:` | एलिमेंट चुना हुआ हो: `accessibilityState.selected` `true` है, `selected:` की तरह |  |
| `data-<name>:` | एलिमेंट में बूलियन `data-*` एट्रिब्यूट `name` हो (Tailwind का `&[data-<name>]`; छोटे अक्षरों, अंकों और `-` वाले नाम): जो किसी कॉम्पोनेंट का पार्ट अपने स्टेट के अलावा दिखाता है, जैसे रेंज की शुरुआत पर कैलेंडर का दिन `data-range-start` | `Interactive::project_data(name, …)` एक सेट करता है |

यही स्टेट स्टाइल ऑब्जेक्ट के रूप में हर एलिमेंट के `activeStyle`, `hoverStyle`, `focusStyle`, `disabledStyle`, `checkedStyle`, `indeterminateStyle`, `expandedStyle` और `pressedStyle` प्रॉप हैं (और `Button` के `selectedStyle` भी); ये एलिमेंट की स्टाइल और क्लास के ऊपर लागू होते हैं।

`disabled` किसी भी एलिमेंट पर काम करता है: यह `disabled:` लागू करता है और एलिमेंट के प्रेस हैंडलर हटा देता है, इसलिए यह कोई प्रेस फ़ीडबैक भी नहीं दिखाता।

```rust tabs
view()
    .on_press(save)
    .disabled(saving)
    .rounded_lg()
    .bg(BLUE.shade(600))
    .px_4()
    .py_2()
    .transition()
    .active(|s| s.scale(0.95).bg(BLUE.shade(700)))
    .disabled_style(|s| s.opacity(0.4))
    .child(text("Save").font_weight(FontWeight::MEDIUM).text_color(white()))
```

```tsx tabs
<View
  onPress={save}
  disabled={saving()}
  class="rounded-lg bg-blue-600 px-4 py-2 transition active:scale-95 active:bg-blue-700 disabled:opacity-40"
>
  <Text class="font-medium text-white">Save</Text>
</View>
```
<a id="groups"></a>

### समूह (Groups)

किसी पूर्वज (ancestor) को `group` से चिह्नित करें और उसकी स्थिति के आधार पर वंशजों (descendants) को `group-<state>:` से स्टाइल करें। समूहों को नेस्ट करने के लिए उन्हें नाम दें: `group/card` और `group-hover/card:`।

| Variant | समूह कब लागू होता है | Rust |
|---|---|---|
| `group-active:` | दबाए जाने (pressed) पर | `.group_active(…)`, `.group_active_named(name, …)` |
| `group-hover:` | होवर (hovered) होने पर | `.group_hover(…)`, `.group_hover_named(name, …)` |
| `group-focus:`, `group-focus-visible:` | फ़ोकस होने पर | |
| `group-focus-within:` | फ़ोकस होने पर या फ़ोकस समाहित होने पर | `.group_focus_within(…)`, `.group_focus_within_named(name, …)` |
| `group-disabled:` | अक्षम (disabled) होने पर | |
| `group-selected:` | चयनित (selected) होने पर | |
| `group-checked:` | चेक (checked) होने पर | |
| `group-indeterminate:` | अनिर्धारित (indeterminate) होने पर | |
| `group-aria-expanded:` | विस्तारित (expanded) होने पर | |
| `group-aria-pressed:` | टॉगल बटन जो चालू है | |
| `group-aria-busy:`, `group-aria-checked:`, `group-aria-selected:` | busy, checked, selected | |
| `group-data-<name>:` | जब `data-*` attribute `name` दिखा रहा हो | |

```rust tabs
view()
    .on_press(open)
    .group_named("row")
    .flex_row()
    .items_center()
    .gap_3()
    .p_3()
    .active(|s| s.bg(ZINC.shade(100)))
    .child(
        text("Settings")
            .flex_1()
            .text_color(ZINC.shade(900))
            .group_active_named("row", |s| s.text_color(BLUE.shade(600))),
    )
    .child(
        text("›")
            .text_color(ZINC.shade(400))
            .group_active_named("row", |s| s.translate_x(px(4.0)))
            .transition_transform(),
    )
```

```tsx tabs
<View onPress={open} class="group/row flex-row items-center gap-3 p-3 active:bg-zinc-100">
  <Text class="flex-1 text-zinc-900 group-active/row:text-blue-600">Settings</Text>
  <Text class="text-zinc-400 group-active/row:translate-x-1 transition-transform">›</Text>
</View>
```

<a id="position-among-siblings"></a>

### सहोदरों (siblings) के बीच स्थिति

| Variant | किस पर लागू होता है |
|---|---|
| `first:` | पहला चाइल्ड |
| `last:` | अंतिम चाइल्ड |
| `only:` | एकमात्र चाइल्ड |
| `odd:` | 1ला, 3रा, ... चाइल्ड |
| `even:` | 2रा, 4था, ... चाइल्ड |

```rust tabs
each(items, |item: &Item| item.id, move |item, index| {
    text(move || item.with(|i| i.name.clone()))
        .border_b(px(1.0))
        .border_color(ZINC.shade(200))
        .py_3()
        .style_when(move || index.get() + 1 == items.with(Vec::len), |s| s.border_b(px(0.0)))
})
```

```tsx tabs
<Each of={items()}>{(item) => <Text class="border-b border-zinc-200 py-3 last:border-b-0">{item().name}</Text>}</Each>
```

<a id="placeholder-and-selection"></a>

### Placeholder और चयन (selection)

`placeholder:` किसी `<Input>` के placeholder पर लागू होता है और केवल टेक्स्ट का रंग लेता है: `placeholder:text-zinc-400` (स्टाइल कुंजी `placeholderColor`)। `selection:` किसी `<Input>` या चयन-योग्य `<Text>` के चयन पर लागू होता है, और किसी भी एलिमेंट पर उसके अंदर मौजूद एलिमेंट्स पर (Tailwind का `& *::selection`; सबसे नज़दीकी एलिमेंट का मान लागू होता है), और यह उसकी पृष्ठभूमि (background), यानी हाइलाइट, लेता है: `selection:bg-violet-200` (स्टाइल कुंजी `selectionColor`, जो उन प्लेटफ़ॉर्म पर input के caret को भी वही रंग देती है जहाँ caret एक ही रंग में बनाया जाता है)।

<a id="important"></a>

### महत्वपूर्ण

किसी utility (`!p-4`, `p-4!`) से पहले या बाद में `!` लगाने पर वह अन्य सभी क्लासेज़ और inline `style` पर प्राथमिकता पाती है।

<a id="theme-customization"></a>

## थीम कस्टमाइज़ेशन

अपने ऐप के `nsh.json` के `"tailwind"` ऑब्जेक्ट में थीम को विस्तारित करें। नए नाम वाली प्रविष्टियाँ जोड़ी जाती हैं; मौजूदा नाम वाली प्रविष्टियाँ डिफ़ॉल्ट को बदल देती हैं। लंबाइयाँ points में होती हैं। ऐप को bundle करते समय थीम की जाँच की जाती है: कोई अज्ञात कुंजी या अमान्य मान build error है।

```json
{
  "name": "My App",
  "id": "com.example.myapp",
  "tailwind": {
    "colors": {
      "brand": { "50": "#f5f3ff", "500": "#7c3aed", "600": "#6d28d9", "DEFAULT": "#7c3aed" },
      "accent": "#f59e0b"
    },
    "spacing": 4,
    "breakpoints": { "tablet": 600 },
    "fontFamily": { "display": "Inter" },
    "fontSize": { "huge": [48, 1.1] },
    "fontWeight": { "heavy": 850 },
    "radius": { "card": 14 },
    "shadow": { "card": "0 2px 8px rgb(0 0 0 / 0.12)" },
    "insetShadow": { "well": "inset 0 2px 6px rgb(0 0 0 / 0.1)" },
    "dropShadow": { "icon": "0 2px 4px rgb(0 0 0 / 0.2)" },
    "tracking": { "label": 0.08 },
    "leading": { "dense": 1.15 },
    "blur": { "glass": 20 },
    "perspective": { "card": 700 },
    "aspect": { "photo": 1.5 },
    "ease": { "snappy": [0.2, 0, 0, 1] },
    "container": { "content": 680 }
  }
}
```

इस थीम के साथ `bg-brand-500`, `bg-brand` (`DEFAULT` shade), `text-accent`, `tablet:flex-row`, `font-display`, `text-huge`, `font-heavy`, `rounded-card`, `shadow-card`, `inset-shadow-well`, `drop-shadow-icon`, `tracking-label`, `leading-dense`, `blur-glass`, `perspective-card`, `aspect-photo`, `ease-snappy` और `max-w-content` सभी काम करते हैं।

| कुंजी | मान | किसके द्वारा उपयोग किया जाता है |
|---|---|---|
| `colors` | `{ name: color }` या `{ name: { shade: color } }`; `DEFAULT` बिना shade वाले रंग का नाम है। कोई भी CSS रंग सिंटैक्स। | हर रंग utility |
| `spacing` | प्रति चरण points (डिफ़ॉल्ट 4) | `p-*`, `m-*`, `gap-*`, `w-*`, ... |
| `rem` | प्रति `rem` points (डिफ़ॉल्ट 16) | |
| `breakpoints` | `{ name: width }` | breakpoint variants (चौड़ाई के अनुसार क्रमबद्ध) |
| `container` | `{ name: width }` | `w-*`, `min-w-*`, `max-w-*` |
| `fontFamily` | `{ name: family }` (कोई सिस्टम फ़ॉन्ट फ़ैमिली या bundle किए गए फ़ॉन्ट का नाम) | `font-*` |
| `fontSize` | `{ name: size }` या `{ name: [size, lineHeightMultiple] }` | `text-*` |
| `fontWeight` | `{ name: 1–1000 }` | `font-*` |
| `tracking` | `{ name: em }` | `tracking-*` |
| `leading` | `{ name: multiple }` | `leading-*` |
| `radius` | `{ name: points }` | `rounded-*` |
| `shadow`, `insetShadow`, `dropShadow` | `{ name: "CSS box-shadow" }` | `shadow-*`, `inset-shadow-*`, `drop-shadow-*` |
| `blur` | `{ name: points }` | `blur-*`, `backdrop-blur-*` |
| `perspective` | `{ name: points }` | `perspective-*` |
| `aspect` | `{ name: ratio }` | `aspect-*` |
| `ease` | `{ name: [x1, y1, x2, y2] }` | `ease-*` |

> [!NOTE]
> Tailwind थीम केवल आपके ऐप की क्लासेज़ को आकार देती है। ऐप के design tokens (shadcn/ui के रंग, `radius`, फ़ॉन्ट और ऐप के अपने tokens) उसकी थीम हैं, यानी `nsh.json` की `"theme"` कुंजी, जिससे Rust कंपोनेंट्स ड्रॉ होते हैं; देखें [Rust](../docs/rust.md#theme)। क्लासेज़ इन tokens को Tailwind के नामों के रूप में `@theme` वेरिएबल्स (`bg-primary`, `bg-up/30`, `rounded-(--radius)`) से संदर्भित करती हैं: देखें [Theme tokens](../docs/tailwind.md#theme-tokens)।

<a id="related"></a>

## संबंधित

- [Tailwind](../docs/tailwind.md): गाइड।
- [Styling](../docs/styling.md): `class`, `classList`, `style` और वे कैसे मिलकर काम करते हैं।
- [Style reference](./style-reference.md): वे स्टाइल कुंजियाँ जो utilities सेट करती हैं।
