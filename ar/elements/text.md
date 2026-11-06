---
title: "Text"
description: "العنصر الذي يرسم النص: النطاقات (spans) المتداخلة، والروابط، وحدود عدد الأسطر، وتغيير حجم الخط، والعروض المضمّنة، وأحداث تخطيط النص."
order: 20
group: primitives
demo: el-text
source_hash: 85fcf31a847a72cd
---

# Text

`Text` يرسم فقرة. وهو العنصر الذي يعرض النصوص: النص الموضوع كابن لـ `View` لا يرسم شيئًا. تُنسَّق الفقرة أصليًا (CoreText على iOS وMac Catalyst، و`StaticLayout` على Android) وتُقاس على خيط المحرك، فلا يفعل الخيط الرئيسي سوى رسمها. تنشئها Rust باستخدام `text(content)`، وتنشئها TSX باستخدام `<Text>` من `nsh`.

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

`text(..)` يقبل نصًا، أو `SharedString`، أو signal، أو closure (`text(move || format!("{} items", count.get()))`): الـ closure أو الـ signal يحدّث النص في مكانه عندما يتغير ما يقرؤه.

<a id="spans"></a>

## المقاطع (Spans)

النص داخل نص هو span من الفقرة نفسها، وليس عرضًا منفصلًا. ترث الـ spans أنماط النص من الفقرة (`color`، `fontSize`، `fontWeight`، …) وتتجاوز ما تحدده هي. الكتلة كلها عرض أصلي واحد. في Rust يعرض `text(..)` محتواه ثم أبناءه: `.child(text(..))` يضيف span، و`.child("…")` يضيف مقطعًا نصيًا عاديًا.

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

<a id="span-backgrounds"></a>

### خلفيات الـ Spans

الـ span الذي له خلفية يملأ صندوق حروفه من خلفها: بارتفاع خطه (الارتفاع فوق خط الأساس والانخفاض تحته، مهما كان ارتفاع السطر)، وعلى كل سطر ينتقل إليه، فيكون جزؤه في كل سطر صندوقًا مستقلًا بنصف قطر زوايا الـ span نفسه. تشترك الـ spans الموجودة داخله في خلفيته ما لم تحدد خلفية خاصة بها. هذا رسم فقط: يُخطَّط النص كما لو لم تكن الخلفية موجودة، والنص القابل للتحديد ينسخ حروف الـ span مع بقية النص. الشيفرة المضمّنة هي span:

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

تعمل أصناف Tailwind بالطريقة نفسها: `<Text class="bg-gray-100 rounded">`. الحشو (padding) والحدود من أنماط الصندوق، ولا تؤثر في الـ spans؛ أما المسافات داخل الـ span فتمنح الصندوق سعة على جانبيه.

<a id="links"></a>

### الروابط

الـ span الذي له معالج ضغط هو رابط: الضغط على حروفه يذهب إلى الـ span، والضغط في أي مكان آخر يذهب إلى الفقرة.

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

<a id="inline-views-and-images"></a>

### العروض والصور المضمّنة

أي عنصر آخر داخل النص (عرض أو صورة، حتى داخل الـ spans) هو مرفق مضمّن: يُخطَّط بحجمه الخاص، ويستقر على خط الأساس (أو حيث يضعه نمط `verticalAlign` الخاص به: `"text-top"`، `"text-bottom"`، `"middle"`، كما في CSS؛ ويكبر السطر ليستوعبه)، ويلتف مع الكلمات. ويستقبل ضغطاته الخاصة.

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

المرفقات التي يقطعها `numberOfLines` أو علامة الحذف تكون مخفية. نسخ نص قابل للتحديد لا يتضمنها.

<a id="whitespace"></a>

### المسافات البيضاء

يتبع نص JSX قواعد React: تُقتطع الأسطر باستثناء طرفي النص، وتُسقَط الأسطر التي تحتوي مسافات فقط، وتُضمّ الأسطر المتبقية بمسافة واحدة. المسافات داخل السطر الواحد تبقى (`{a} {b}` يحتفظ بمسافته). اكتب `{" "}` أو تعبيرًا نصيًا عندما يحتاج الـ span إلى مسافة في بدايته أو نهايته. تُرسم سلاسل Rust كما كُتبت.

<a id="props"></a>

## الخصائص

إضافة إلى [الخصائص المشتركة](./index.md#common-props) (مع `style` من النوع `TextStyle`):

| الخاصية | Rust | النوع | القيمة الافتراضية | الوصف |
|---|---|---|---|---|
| `numberOfLines` (style) | `.number_of_lines(n)`، `.truncate()` | `number` | `0` | أقصى عدد من الأسطر المعروضة؛ `0` يعرضها كلها. |
| `textOverflow` (style) | `.text_overflow(EllipsizeMode::Middle)` | `"ellipsis" \| "clip" \| "ellipsis-start" \| "ellipsis-middle"` | `"ellipsis"` | كيفية قطع النص الذي لا يتسع في `numberOfLines`: بعلامة حذف في نهايته أو في بدايته أو في وسطه، أو بقصّه. |
| `allowFontScaling` | `.allow_font_scaling(..)` | `boolean` | `true` | اتباع إعداد حجم النص في النظام. |
| `maxFontSizeMultiplier` | `.max_font_size_multiplier(..)` | `number` | `0` | الحد الأعلى لمقياس النظام؛ `0` تعني بلا حد. |
| `adjustsFontSizeToFit` | `.shrink_to_fit(min_scale)` | `boolean` | `false` | تصغير الخط حتى يتسع النص ضمن أسطره (`numberOfLines`) وصندوقه. |
| `minimumFontScale` | `.shrink_to_fit(min_scale)` | `number` | | أقصى مقدار يبلغه تصغير `adjustsFontSizeToFit` (من 0 إلى 1؛ 0.1 على الأقل). |
| `userSelect` (style) | `.select_text()`، `.select_none()` | `"auto" \| "none" \| "text"` | `"auto"` | `"text"`: يستطيع المستخدم تحديد مقاطع من النص: الضغط المطوّل يحدد كلمة، والمقابض توسّع التحديد، وقائمة التحرير تنسخه. `"auto"` يأخذ إعداد العروض المحيطة بالنص؛ وإذا لم يُضبط أي إعداد فالنص غير قابل للتحديد، إلا في متصفحات سطح المكتب، حيث يكون قابلًا للتحديد ما لم يكن داخل عنصر تفاعلي؛ و`"none"` يبقيه غير قابل للتحديد هناك أيضًا. |
| `selectionColor` (style) | `.selection_color(..)` | `ColorValue` | لون التمييز في المنصة | تمييز التحديد ومقابضه. |
| `onTextLayout` | | `(e: { lines: TextLayoutLine[] }) => void` | | الأسطر المخطَّطة بعد كل تخطيط. |

أصناف Tailwind ‏`select-text` و`select-none` و`select-auto` تضبط `userSelect`، و`line-clamp-*` يضبط `numberOfLines`، و`text-ellipsis` و`text-clip` يضبطان `textOverflow`، و`truncate` هو سطر واحد يُقطع بعلامة حذف. يأخذ تمييز التحديد ومقابضه مفتاح النمط `selectionColor` (`selection:text-*`)، ولون التمييز في المنصة افتراضيًا.

<a id="text-styles"></a>

## أنماط النص

`TextStyle` يضيف إلى أنماط العرض: `color`، `fontSize`، `fontWeight` (`"normal"` أو `"bold"` أو 100–900)، `fontStyle`، `fontFamily`، `lineHeight`، `letterSpacing`، `textAlign`، `textAlignVertical`، `textTransform`، `textDecorationLine`، `textDecorationColor`، `textDecorationStyle`، `textDecorationThickness`، `textUnderlineOffset`، `textShadow` (المقابل لـ `text-shadow` في CSS)، `fontVariant`، `writingDirection`، `numberOfLines` و`textOverflow`. في Rust هي دوال `Styled`: `.text_color(..)`، `.text_size(..)` (أو `.text_sm()`، `.text_lg()`، …)، `.font_weight(FontWeight::SEMIBOLD)`، `.italic()`، `.font_family(..)`، `.line_height(..)`، `.letter_spacing(..)`، `.text_center()`، `.uppercase()`، `.underline()`، `.line_through()`، `.tabular_nums()`، `.number_of_lines(..)` وغيرها. راجع [مرجع الأنماط](../modules/style-reference.md#textstyle) و[النص](../docs/text.md).

عائلة الخط إما عائلة خطوط من النظام أو ملف خط من التطبيق:

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

يُسجَّل الخط قبل أول إطار. راجع [الخطوط](../docs/fonts.md).

<a id="events"></a>

## الأحداث

| الحدث | Rust | الحمولة | متى |
|---|---|---|---|
| `onTextLayout` | | `{ lines: TextLayoutLine[] }` | بعد كل تخطيط للفقرة. |
| `onPress`، `onLongPress`، … | `.on_press`، `.on_long_press`، … | `PressEvent` (لا شيء في Rust) | كما في [view](./view.md#events)؛ وعلى الـ span، الضغطات على حروفه. |
| `onLayout` | `.on_layout` | `{ bounds }` | تغيّر إطار الكتلة. |

`TextLayoutLine` هو `{ text, x, y, width, height, ascender, descender, capHeight, xHeight }`، ضمن صندوق محتوى النص:

```tsx
const lines = signal(0);
<Text onTextLayout={(e) => lines.set(e.lines.length)}>{article}</Text>;
```

تقيس Rust السلسلة النصية قبل التخطيط باستخدام `measure_text(..)`.

<a id="ref-methods"></a>

## دوال المرجع (Ref)

لا توجد دوال خاصة به.

<a id="platform-notes"></a>

## ملاحظات المنصات

- يبقى التحديد داخل كتلة نص واحدة (نص واحد مع الـ spans الخاصة به). تعرض iOS قائمة التحرير الخاصة بها (Copy وSelect All وLook Up وTranslate وShare)، وتعرض Android شريط أدوات عائمًا (Copy وSelect all وShare).
- زخارف النص غير الخط المفرد المتصل (`double`، `dotted`، `dashed`، `wavy`) يرسمها NSH على iOS.
- ترسم نصوص iOS الخلفيات الصلبة والظلال الخارجية.
- `fontScale()` من [`nsh`](../modules/nsh.md#device) (`font_scale()` في Rust) يعيد مقياس النص الحالي في النظام.
