---
title: "النص"
description: "عرض النص باستخدام عنصر text في Rust وTSX - العناصر span المتداخلة والروابط، والعناصر المضمّنة (inline views)، والخطوط والزخارف، والاقتطاع، وحجم نص النظام، والتحديد، وonTextLayout."
order: 35
group: ui
source_hash: 9d528fcdc65c1a8c
---

# النص

يُعرض كل النص عبر عناصر النص: `text(..)` في Rust، و`<Text>` في TSX. عنصر النص هو فقرة واحدة، يتولى محرك النص في المنصة (CoreText على منصات Apple، و`StaticLayout` على Android) تنسيقها على خيط المحرك عند إجراء التخطيط، ولا تُرسم إلا على الخيط الرئيسي. عناصر النص المتداخلة هي spans ضمن الفقرة نفسها، وليست views منفصلة.

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
> تُعرض السلاسل النصية عبر عناصر النص. في TSX، لا تظهر السلسلة النصية الموضوعة مباشرة داخل `<View>`: غلّفها بـ `<Text>`.

العنصر نفسه موثّق في [text](../elements/text.md)؛ أما هذه الصفحة فتتناول طريقة استخدامه.

<a id="strings-and-whitespace"></a>

## السلاسل النصية والمسافات البيضاء

في Rust، محتوى النص سلسلة نصية تُعرض كما كُتبت: `\n` يكسر السطر. أما المحتوى الذي يقرأ signals فيكون closure، ويتحدّث النص عند تغيّرها. في TSX، يتبع نص JSX القواعد نفسها كما في React: يُقصّ كل سطر، وتُحذف الأسطر التي تحتوي على مسافات بيضاء فقط، وتُدمج الأسطر المتبقية بمسافة واحدة. تُحفظ المسافات البيضاء داخل السطر الواحد، لذا يحتفظ `{first} {last}` بمسافته. استخدم `{" "}` لإضافة مسافة في بداية السطر أو نهايته، و`{"\n"}` لكسر السطر:

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

تتبع التعبيرات داخل النص ما تقرؤه: يتحدّث `text(move || format!("{} items", count.get()))` و`<Text>{count()} items</Text>` عندما يتغيّر `count`.

<a id="spans-and-inheritance"></a>

## الـ spans والوراثة

النص داخل نص آخر هو span. يرث نمط النص من أصله ويتجاوز ما يحدّده بنفسه:

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

تنتقل أنماط النص أيضًا من الـ views إلى أبنائها، كما في CSS: يطبّق `view().text_color(white()).text_sm()` في Rust و`<View class="text-white text-sm">` في TSX النمط على عناصر النص والإدخال داخلها.

<a id="links"></a>

### الروابط

الـ span الذي يملك معالج ضغط (`.on_press(..)` أو `.on_long_press(..)`؛ `onPress` أو `onLongPress`) يكون رابطًا: يذهب الضغط على حروفه إلى الـ span، ويذهب الضغط في أي مكان آخر إلى الفقرة. وتعمل الروابط في الـ spans المتداخلة أيضًا.

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

### خلفيات الـ spans

يرسم لون خلفية الـ span ونصف قطر زواياه مربعًا خلف حروفه في كل سطر يمتد إليه، بارتفاع خطه؛ ويبقى تخطيط النص كما هو وينسخ كاملًا، لذا يكون الكود المضمّن span
([عنصر النص](../elements/text.md#span-backgrounds)):

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

### الـ views والصور داخل النص

أي عنصر غير النص داخل نص يُخطَّط ضمن السطر، على خط الأساس، ويلتف مع الكلمات. ويمكنه استقبال ضغطاته الخاصة:

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

تُخفى العناصر المضمّنة التي يقطعها `numberOfLines` أو علامة الحذف؛ ولا يتضمنها النص المنسوخ. ويأخذ النص داخل
العنصر المضمّن لون النص المحيط به، كما يصل `color` في CSS إلى inline block، ما لم يحدّد لونه الخاص
(كما تفعل الشارة `LIVE` أعلاه)؛ ويبقى خطه وارتفاع سطره خاصَّين به.

يحدّد مفتاح النمط `verticalAlign` موضع العنصر المضمّن في سطره، كما يحدّد `vertical-align` في CSS موضع الصورة:
`"baseline"` (الافتراضي) يضع قاعدته على خط الأساس، ويضع `"text-top"` و`"text-bottom"` أعلاه أو أسفله
عند أعلى خط النص أو أسفله، ويوسّطه `"middle"` على ارتفاع نصف ارتفاع x للخط فوق خط الأساس.
ويكبر السطر ليتّسع للعنصر حيثما تجاوز الخط، وكذلك مع `lineHeight` ثابت. الأيقونة في بداية الفقرة التي يجب أن
تصطف مع أسفل النص، كما يرسمها `ImageSpan` في Android، تأخذ `"text-bottom"`. الفئات هي
`align-baseline` و`align-text-top` و`align-text-bottom` و`align-middle`؛ وفي Rust `.align_text_bottom()`
وغيرها بالأسماء نفسها.

```tsx
<Text style={{ fontSize: 16 }}>
  <Image src={badge} style={{ width: 16, height: 16, verticalAlign: "text-bottom" }} /> Verified seller
</Text>
```

<a id="text-styles"></a>

## أنماط النص

| الخاصية | القيم | Rust |
|---|---|---|
| `color` | [لون](./styling.md#colors). الافتراضي أسود | `.text_color(..)` |
| `fontSize` | نقاط. الافتراضي 14 | `.text_size(px(..))`، `.text_sm()`، `.text_lg()`، ... |
| `fontWeight` | `"normal"` (400)، `"bold"` (700)، أو `100`–`900` (رقم أو سلسلة نصية) | `.font_weight(FontWeight::BOLD)` |
| `fontStyle` | `"normal"`، `"italic"`: تبقى رموز emoji الملوّنة مستقيمة | `.italic()` |
| `fontFamily` | عائلة خطوط النظام، أو عائلة عامة، أو [خط مستورد](./fonts.md) | `.font_family(..)` |
| `lineHeight` | نقاط | `.line_height(px(..))` |
| `letterSpacing` | نقاط | `.letter_spacing(px(..))` |
| `textAlign` | `"auto"`، `"left"`، `"center"`، `"right"`، `"justify"`، `"start"`، `"end"`: يحافظ `left` و`right` على جانبيهما الأيمن والأيسر ثابتين، بينما يتبع `start` و`end` الاتجاه | `.text_left()`، `.text_center()`، `.text_right()`، `.text_justify()` |
| `textAlignVertical` | `"auto"`، `"top"`، `"center"`، `"bottom"`: موضع النص الأقصر من صندوقه | |
| `textTransform` | `"none"`، `"uppercase"`، `"lowercase"`، `"capitalize"` | `.normal_case()`، `.uppercase()`، `.lowercase()`، `.capitalize()` |
| `textDecorationLine` | `"none"`، `"underline"`، `"line-through"`، `"underline line-through"` | `.no_underline()`، `.underline()`، `.line_through()` |
| `textDecorationColor`، `textDecorationStyle` | لون؛ `"solid"`، `"double"`، `"dotted"`، `"dashed"`، `"wavy"` | `.text_decoration_color(..)`، `.text_decoration_wavy()`، ... |
| `textDecorationThickness`، `textUnderlineOffset` | نقاط، أو `"auto"` (والسماكة أيضًا `"from-font"`) | `.text_decoration_thickness(px(..))`، `.underline_offset(px(..))` |
| `textShadow` | `text-shadow` في CSS، ظل خلف الحروف: `"2px 2px 4px rgb(0 0 0 / 0.6)"` (الإزاحات، التمويه، اللون)، أو طبقاته كأرقام، `[{ x: 2, y: 2, blur: 4, color: "#00000099" }]`؛ وعند وجود عدة طبقات يُرسم الأوسع | `.text_shadow([TextShadow { .. }])`، `.text_shadow_sm()`، ...، `.text_shadow_color(..)` |
| `fontVariant` | ميزات OpenType: `["tabular-nums"]`، `"small-caps"`، `"oldstyle-nums"`، `"lining-nums"`، `"proportional-nums"` | `.tabular_nums()`، `.small_caps()`، `.oldstyle_nums()`، `.lining_nums()`، `.proportional_nums()` |
| `writingDirection` | `"auto"`، `"ltr"`، `"rtl"`: الاتجاه الأساسي للفقرة | `.writing_direction(WritingDirection::Rtl)` |

عنصر النص هو أيضًا view: فهو يقبل الخلفيات والحدود والزوايا والحشو وبقية [أنماط الـ view](./styling.md).

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

يمنح `tabular-nums` كل رقم العرض نفسه، مما يمنع العدّادات والأسعار من الاهتزاز عند تغيّرها.

<a id="truncation"></a>

## الاقتطاع

```rust tabs
text(long_description).number_of_lines(2)
text(file_path).number_of_lines(1).text_overflow(EllipsizeMode::Middle)
```

```tsx tabs
<Text style={{ numberOfLines: 2 }}>{longDescription}</Text>
<Text style={{ numberOfLines: 1, textOverflow: "ellipsis-middle" }}>{filePath}</Text>
```

| مفتاح النمط / الخاصية | Rust | الوصف |
|---|---|---|
| `numberOfLines` (نمط) | `.number_of_lines(n)` | أقصى عدد من الأسطر المعروضة؛ `0` (الافتراضي) يعرضها كلها |
| `textOverflow` (نمط) | `.text_overflow(EllipsizeMode::Middle)` | كيفية قطع النص الذي لا يتسع: علامة حذف في النهاية (`"ellipsis"`، الافتراضي)، أو في البداية (`"ellipsis-start"`)، أو في المنتصف (`"ellipsis-middle"`)، أو `"clip"` |
| `adjustsFontSizeToFit` | `.shrink_to_fit(min_scale)` | تصغير الخط حتى يتسع النص لأسطره وصندوقه |
| `minimumFontScale` | | مدى التصغير المسموح به لـ `adjustsFontSizeToFit` (0–1) |

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

تضبط فئات Tailwind ‏`line-clamp-*` و`text-ellipsis` و`text-clip` المفاتيح نفسها، ويمثّل `truncate` (`.truncate()`) سطرًا واحدًا مقطوعًا بعلامة حذف؛ وبوصفها مفاتيح نمط فإنها تقبل أيضًا أنماط الحالة والمتغيّرات.

<a id="system-text-size"></a>

## حجم نص النظام

يتبع النص إعداد حجم النص لدى المستخدم (Dynamic Type على iOS، وحجم الخط على Android) افتراضيًا.

| الخاصية | Rust | الوصف |
|---|---|---|
| `allowFontScaling` | `.allow_font_scaling(false)` | `false` يُبقي الحجم ثابتًا. الافتراضي `true` |
| `maxFontSizeMultiplier` | `.max_font_size_multiplier(1.5)` | أكبر مقياس يُطبَّق، مثل `1.5`. `0` يعني بلا حد |

يمثّل `font_scale()` في Rust و`fontScale()` من [`nsh`](../modules/nsh.md#device) في TSX المقياس الحالي، ويتغيّران عندما يغيّر المستخدم الإعداد. وتقبل حقول الإدخال `allowFontScaling` و`maxFontSizeMultiplier` أيضًا.

```rust tabs
text("Tab label").max_font_size_multiplier(1.3).text_size(px(13.0))
```

```tsx tabs
<Text maxFontSizeMultiplier={1.3} style={{ fontSize: 13 }}>Tab label</Text>
```

يُفضَّل تحديد المقياس على إيقافه: فالنص الكبير إعداد لإمكانية الوصول يعتمد عليه الناس.

<a id="selection"></a>

## التحديد

يتيح مفتاح النمط `userSelect: "text"` (`.select_text()`، والفئة `select-text`) للمستخدم تحديد النص ونسخه، كما في عروض النص الأصلية في النظام: الضغط المطوّل يحدد الكلمة تحت الإصبع، وتحرّك المقابض طرفي التحديد، وتقدّم قائمة التحرير خيارَي Copy وSelect All (ويضيف iOS خيارات Look Up وTranslate وShare؛ وAndroid خيار Share). يبقى التحديد داخل كتلة نص واحدة. ويلوّن مفتاح النمط `selectionColor` (`.selection_color(..)`، `selection:text-*`) التمييز والمقابض. وما يُضبط بـ `userSelect` على view يصل إلى النصوص داخله التي لم تضبط شيئًا.

في متصفحات سطح المكتب يكون النص قابلًا للتحديد افتراضيًا، كما في صفحة الويب، باستثناء العناصر التفاعلية (الـ views التي لها معالجات ضغط أو لمس، مثل الأزرار والصفوف القابلة للضغط)؛ ويبقي `userSelect: "none"` (`.select_none()`، والفئة `select-none`) النص غير قابل للتحديد هناك. أما متصفحات الهاتف واللوح فتتبع القاعدة الأصلية.

```rust tabs
text(order_number).select_text().selection_color(rgb(0x7c3aed))
```

```tsx tabs
<Text style={{ userSelect: "text", selectionColor: "#7c3aed" }}>{orderNumber}</Text>
```

للنسخ من الكود (زر Copy) استخدم `set_clipboard(..)` في Rust أو [`Clipboard`](../modules/nsh.md#clipboard) في TSX.

## onTextLayout

يعيد `onTextLayout` (الحدث `TextLayout` في Rust) الأسطر المخطَّطة بعد كل تخطيط، ضمن صندوق محتوى النص:

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

لكل سطر `text` و`x` و`y` و`width` و`height` و`ascender` و`descender` و`capHeight` و`xHeight` (`cap_height` و`x_height` في Rust). استخدمه لإظهار زر "Read more" فقط عندما يُقطع النص، أو لمحاذاة محتوى آخر مع خط أساس.

<a id="accessibility"></a>

## إمكانية الوصول

يقرأ قارئ الشاشة عنصر النص بوصفه محتواه. امنح دورًا للنص الذي يعمل كعنوان (`.role(AccessibilityRole::Header)`، `role="header"`) وللروابط (`AccessibilityRole::Link`، `role="link"`). راجع [إمكانية الوصول](./accessibility.md).

<a id="related"></a>

## ذات صلة

- [الخطوط](./fonts.md): الخطوط المخصصة والأوزان.
- [عنصر text](../elements/text.md): كل الخصائص.
- [النماذج ولوحة المفاتيح](./forms-and-keyboard.md): إدخال النص.
