---
title: "التنسيق"
description: "دوال التنسيق المُحدَّدة الأنواع في Rust وخاصية style في TSX - flexbox وgrid وتأثيرات CSS - الألوان والحدود والزوايا والظلال والتدرجات اللونية والفلاتر والتحويلات والانتقالات، مع الاختلافات بين المنصات."
order: 32
group: ui
demo: guide-styling
source_hash: c3b673df4846a333
---

# التنسيق

يُنسَّق كل عنصر بالأنماط الأصلية نفسها، وتُكتب بطريقتين. في Rust تكون الأنماط دوالَّ ذات أنواع محددة تُسلسَل على العنصر (`.p_4()`، `.rounded(px(12.0))`، `.bg(color)`)؛ وفي TSX تُكتب عبر خاصية `style` من خصائص camelCase، أو عبر [فئات Tailwind](./tailwind.md). وتشمل الطريقتان ميزات CSS مثل ظلال الصناديق والتدرجات والمرشحات والخطوط الخارجية والانتقالات والشبكة (grid)، ولا يُرسَل إلى العرض الأصلي إلا الخصائص التي تغيّرت.

الطرق الثلاث تكتب مجموعة الخصائص نفسها وتعني الشيء نفسه. أسماؤها هي أسماء CSS (وبعضها يأخذ الأسماء الأبسط التي تكتبها التطبيقات، مثل `paddingHorizontal` و`marginStart` و`numberOfLines`)، وقيم CSS (الألوان والتدرجات والمرشحات والظلال والتحويلات وكلمات المحاذاة) وأدوات Tailwind المساعدة تعني ما تعنيه على الويب، وكل دالة في Rust وكل أداة مساعدة تضبط ما يولّده Tailwind CSS 4 لها، لذا فما تعرفه من الويب ينطبق هنا: `paddingLeft` هو `padding-left` و`pl-4`، و`boxShadow` هو `box-shadow`، و`display: "flex"` صفٌّ كما أن الفئة `flex` كذلك. أما الباقي فمصمَّم للتطبيقات الأصلية: الأطوال بالنقاط (`16`، `"50%"`، `"auto"`؛ وتقبل الفئات `rem` ووحدات CSS الأخرى)، والقيم الافتراضية هي قيم التخطيط الأصلي (مدرجة أدناه)، والقيمة التي تتغير تأخذ أرقامًا بدل سلسلة نصية (`translate: [x, 0]`، وطبقات الظل)، وما تفعله المنصات إضافةً إلى CSS له [امتدادات](#extensions) خاصة به.

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

تتناول هذه الصفحة كيفية دمج الأنماط والخصائص البصرية. خصائص التخطيط (flexbox والشبكة والأحجام والمواضع) في [التخطيط](./layout.md)، وخصائص النص في [النص](./text.md)، وكل خاصية مع نوعها في [مرجع الأنماط](../modules/style-reference.md).

<a id="combining-styles"></a>

## دمج الأنماط

في Rust، الأنماط المشتركة دوال تأخذ عنصرًا وتعيده منسَّقًا، والشروط هي Rust العادية: `.when(condition, |v| ..)` لما هو معروف عند إنشاء العنصر، و`.style_when(signal, |s| ..)` للأنماط التي تتبدل أثناء تشغيل التطبيق. في TSX، تقبل `style` كائنًا، أو مصفوفة كائنات تُدمج من اليسار إلى اليمين؛ وتُتجاهل القيم الزائفة (`false` و`null` و`undefined`)، مما يجعل الأنماط الشرطية قصيرة:

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

في TSX، عرّف الأنماط المشتركة كثوابت خارج المكوّنات (مع `as const`، ليحتفظ TypeScript بالأنواع الحرفية مثل `"row"`). يكفي كائن عادي: تُحلَّل الأنماط في Rust في كل مرة تُضبط فيها، من كائنات لا يحتاج أحد إلى تسجيلها.

النمط الذي يقرأ إشارات (signals) يتبعها: في Rust، أعطِ الدالة closure (`.bg(move || ..)`)، فتُضبط تلك الخاصية وحدها من جديد عند تغيّر الإشارات؛ وفي TSX، يُعاد بناء تعبير النمط الذي يقرأ إشارات، ويرسل NSH الخصائص التي اختلفت قيمها فقط:

```rust tabs
view()
    .p_3()
    .bg(move || if selected.get() { rgb(0xddf4ff) } else { rgb(0xffffff) })
```

```tsx tabs
<View style={{ backgroundColor: selected() ? "#ddf4ff" : "#ffffff", padding: 12 }} />
```

عندما يحتوي عنصر TSX على الاثنين، تتغلب `style` على `class`: تُطبَّق الفئات أولًا، ثم النمط المضمَّن فوقها. المفتاح المضبوط على `undefined` لا يضبط شيئًا (`backgroundColor: active ? accent : undefined` يُبقي لون الفئة عند عدم التفعيل)؛ أما `null` فيضبط القيمة الافتراضية. في Rust، تتغلب الدالة اللاحقة على السابقة للخاصية نفسها.

داخل نمط واحد (كائن، أو مصفوفة مدموجة في نمط واحد)، لا يؤثر ترتيب المفاتيح: الخاصية الأكثر تحديدًا تتغلب على اختصارها، `borderTopWidth` على `borderWidth`، و`borderLeftColor` على `borderColor`، و`marginTop` على `marginVertical` على `margin` (وكذلك الحشو padding)، و`rowGap` على `gap`، و`flexGrow` على `flex`، و`gridColumnStart` على `gridColumn`. والخاصية المحددة المضبوطة على `null` هناك تُظهر قيمة الاختصار.

<a id="units-and-values"></a>

## الوحدات والقيم

- **الأطوال بالنقاط** (وحدات بكسل مستقلة عن الكثافة): `px(100.0)` في Rust و`width: 100` في TSX تساوي 100 نقطة، أي 200 أو 300 بكسل فعلي على شاشة 2× أو 3×.
- **النسب المئوية** (`relative(0.5)` في Rust، `"50%"` في TSX) نسبةً إلى العنصر الأب، للأحجام والمواضع والهوامش والحشو ([التخطيط](./layout.md)).
- **الزوايا** هي `deg(45.0)` أو `radians(0.5)` أو `turn(0.25)` في Rust، وبالدرجات كأرقام أو كسلاسل نصية مع وحدة في TSX: `45` و`"45deg"` و`"0.5rad"`؛ وتقبل `rotate` و`transform` في CSS أيضًا `"0.25turn"`، وفي سلسلة `transform` تكون لكل زاوية وحدتها.
- **المدد** بالميلي ثانية: `.duration(150.0)` في Rust، وأرقام أو سلاسل نصية (`"150ms"`، `"0.2s"`) في TSX.

<a id="defaults"></a>

## القيم الافتراضية

حيث لا شيء يضبط الخاصية، تُطبَّق القيم الافتراضية في NSH:

| | القيمة الافتراضية |
|---|---|
| تخطيط أبناء العرض | عمود (حاوية flex مع `flexDirection: "column"`)؛ و`display: "flex"` يجعله صفًّا ما لم تُضبط `flexDirection`، كما في CSS |
| `flexShrink` | `0` (لا يتقلص الأبناء ما لم يُطلب ذلك) |
| `alignContent` | `"flex-start"` (في الشبكات، `"normal"` في CSS) |
| `position` | `"relative"` |
| `minWidth` / `minHeight` | `0` |
| `backgroundColor` | شفاف |
| النص | أسود، 14 نقطة، وزن 400 |
| لون الحدود والخط الخارجي | لون النص (`currentColor` في CSS) |

لا تحمل العروض الجديدة أي نمط إطلاقًا حتى تعطيها واحدًا، لذا فالحاويات غير المنسَّقة لا تكلّف شيئًا على الجانب الأصلي.

<a id="colors"></a>

## الألوان

في Rust، الألوان قيم ذات أنواع محددة: `rgb(0x0099ff)` و`rgba(0x0099ffcc)` و`hsla(..)` و`white()` و`black()`، ولوحة Tailwind على شكل `nsh_core::element::palette` (`BLUE.shade(500)`). تقبل دوال الألوان `AdaptiveColor`، أي قيمة فاتحة وأخرى داكنة: `AdaptiveColor::rgb(0xffffff, 0x0d1117)` تتبدل مع مظهر النظام أصليًا، دون إعادة رسم. والألوان من سمة التطبيق (`theme().primary` من `nsh_base`) تكيّفية أيضًا ([Rust](./rust.md#theme)).

في TSX، تقبل خصائص الألوان سلاسل ألوان CSS:

| الصيغة | مثال |
|---|---|
| Hex | `"#09f"`، `"#09fc"`، `"#0099ff"`، `"#0099ffcc"` |
| `rgb()` / `rgba()` | `"rgb(0, 153, 255)"`، `"rgba(0, 0, 0, 0.5)"`، `"rgb(0 0 0 / 10%)"` |
| `hsl()` / `hsla()` | `"hsl(210 100% 50%)"` |
| `oklch()` / `oklab()` | `"oklch(62.3% 0.214 259.8)"` |
| بالاسم | `"white"`، `"black"`، `"transparent"`، `"rebeccapurple"`، ... |
| `currentColor` | `"currentColor"`: لون النص، ويصح أيضًا داخل تدرج أو ظل أو `drop-shadow()` أو `color-mix()` (`"color-mix(in srgb, currentColor 50%, transparent)"`)؛ وتكتبه الفئات `bg-current` و`border-current/50` و`bg-[color-mix(in_srgb,currentColor_50%,transparent)]` |

للوضع الداكن في TSX، اقرأ [`colorScheme()`](../modules/nsh.md#device) من `nsh`، وهو accessor يتبع مظهر النظام، أو استخدم المتغيّر `dark:` في Tailwind:

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

أما للأنماط غير الألوان، فتطبّق `.dark(|s| ..)` في Rust الأنماط في المظهر الداكن، وتقرأ `dark()` المظهر. لون النص الافتراضي أسود في كلا المظهرين: اضبط الألوان صراحةً في التطبيقات التي تدعم الوضع الداكن.

<a id="borders-and-corners"></a>

## الحدود والزوايا

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

- **العروض والألوان** لكل جانب: `borderTopWidth` و`borderRightWidth` و... و`borderTopColor` و...، وتحتفظ بجانبها في أي اتجاه؛ و`borderStartWidth` و`borderEndWidth` و`borderStartColor` و`borderEndColor`، وتتبع [اتجاه التخطيط](./layout.md#right-to-left) (`.border_t(..)` و`.border_t_color(..)` و`.border_s(..)` و`.border_e_color(..)` و... في Rust).
- **لون** الجانب الذي ضُبط عرضه ولم يُضبط لونه هو لون النص، كما في `currentColor` في CSS: `{ borderWidth: 1, color: "#0969da" }` ترسم حدًّا أزرق.
- **أنصاف الأقطار** لكل زاوية: `borderTopLeftRadius` و`borderTopRightRadius` و`borderBottomRightRadius` و`borderBottomLeftRadius`، و`borderTopStartRadius` / `borderTopEndRadius` / `borderBottomStartRadius` / `borderBottomEndRadius` (أعلى البداية، أعلى النهاية، أسفل البداية، أسفل النهاية)، وتتبع [اتجاه التخطيط](./layout.md#right-to-left) (`.rounded_tl(..)` و... و`.rounded_ss(..)` و`.rounded_se(..)` و`.rounded_es(..)` و`.rounded_ee(..)` في Rust، والإعدادات المسبقة `.rounded_lg()` و`.rounded_full()` و...).
- **`borderCurve: "continuous"`** (`.border_curve(BorderCurve::Continuous)`) ترسم زوايا ينساب انحناؤها تدريجيًا إلى الحواف، مثل أيقونات تطبيقات iOS، على المنصتين. ويبقى الشكل الحبّي (`borderRadius` بنصف الارتفاع) حبّيًا.
- **`overflow: "hidden"`** (`.overflow_hidden()`) تقصّ الأبناء على الشكل المستدير. وما تقصّه يُقصّ أيضًا في التخطيط: فلا يصل إلى حجم محتوى عرض التمرير المحيط، لذا فالصندوق الذي يضع ابنًا أعرض منه ثم يصغّره بـ `transform` (التحويلات لا تؤثر في التخطيط) لا يؤثر في عرض التمرير.

تُقيَّد أنصاف الأقطار الأكبر من نصف الضلع، لذا فـ `borderRadius: 9999` (`.rounded_full()`) تصنع دائرة أو شكلًا حبّيًا.

<a id="shadows"></a>

## الظلال

تُلقي العروض `boxShadow` من CSS، ويضيف Android ارتفاعه المادي (material elevation):

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

`boxShadow` تتبع CSS: `offsetX offsetY blur spread color`، و`inset` للظلال الداخلية. وتقبل أيضًا طبقاتها كأرقام، وهي الصيغة المناسبة للقيم المتغيرة، ولا تبني سلسلة نصية: `boxShadow: [{ x: 0, y: 6, blur: 18, spread: 0, color: "#0000004d", inset: false }]` (المطلوب فقط `x` و`y`؛ والطبقة بلا لون تأخذ لون النص). تأخذ Rust الطبقات، `.shadow([BoxShadow { .. }])`. تتبع الظلال الشكل المستدير للعرض، والانتقال يحرّكها (`transitionProperty: "boxShadow"`، `.transition_shadow()`). الإعدادات المسبقة في Tailwind هي `.shadow_sm()` و`.shadow_md()` و`.shadow_lg()` و... في Rust، و`.shadow_color(..)` تعيد تلوين طبقاتها. والظل الذي يتبع محتوى عرض شفاف (رموز أيقونة مثلًا) هو `filter: "drop-shadow(...)"` ([المرشحات](#filters-and-blending))؛ وللنص `textShadow` ([النص](./text.md)).

> [!NOTE]
> على Android، تحتاج الظلال إلى خلفية: العرض ذو الخلفية الشفافة (نص بلا خلفية مثلًا) لا يُلقي ظلًّا.

<a id="gradients"></a>

## التدرجات اللونية

`backgroundImage` تقبل تدرجات CSS، وتُرسم فوق لون الخلفية؛ وفي Rust، `.bg_linear(angle)` و`.bg_radial()` و`.bg_conic(angle)` مع نقاط التوقف `.gradient_from(..)` و`.gradient_via(..)` و`.gradient_to(..)`، كما في `bg-linear-*` من Tailwind مع `from-*` و`via-*` و`to-*`. وفي TSX تُفصل عدة تدرجات بفواصل.

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

تُحدَّد نقاط توقف الألوان بنسب مئوية أو أطوال (`px`، `pt`، `rem`؛ والأرقام المجردة نقاط) على امتداد تدرج خطي أو شعاعي، وبنسب مئوية أو زوايا (`deg`، `turn`، `rad`، `grad`) حول تدرج مخروطي. ونقطة التوقف ذات الموضعين (`#8250df 0 12px`) شريط من لون واحد، وكذلك نقطتان في الموضع نفسه. تُقاس الأطوال على امتداد خط التدرج عند الحجم الحالي للعرض، لذا يبقى شريط بعرض 12px بعرض 12px مهما تغيّر حجم العرض.

تُمزج الألوان بين نقاط التوقف كما في CSS: في الفضاء الذي يسميه التدرج (`linear-gradient(in oklab, …)`؛ وكذلك `srgb` و`srgb-linear` و`xyz` و`oklch` مع طريقة للون الأساسي (hue) مثل `longer hue`، و`hsl`)، وفيما عدا ذلك في sRGB عندما يكون كل لون hex أو `rgb()` أو `hsl()` أو لونًا مسمّى، وفي Oklab عندما يكون أحدها `oklch()` أو `oklab()` أو `lab()` أو `lch()` أو `color()`.

لا ترسم عناصر النص التدرجات على iOS.

<a id="filters-and-blending"></a>

## المرشحات والمزج

| الخاصية | القيمة | Rust |
|---|---|---|
| `filter` | مرشحات CSS للعرض ومحتواه: `brightness()`، `contrast()`، `grayscale()`، `hue-rotate()`، `invert()`، `saturate()`، `sepia()`، `opacity()`، `blur()`، `drop-shadow()` (بلا لون تكون بلون النص، كما في CSS)؛ ويمكن الجمع بين عدة مرشحات مفصولة بمسافات | `.brightness(n)`، `.contrast(n)`، `.grayscale(n)`، `.hue_rotate(angle)`، `.invert(n)`، `.saturate(n)`، `.sepia(n)`، `.blur(px(..))` |
| `backdropFilter` | مرشحات لما خلف العرض: `"blur(10px)"` (زجاج مصنفر) | `.backdrop_blur(px(10.0))`، `.backdrop_saturate(n)`، ... |
| `glassEffect` | `"regular"` أو `"clear"` لـ Liquid Glass من Apple على iOS 26 وmacOS 26 وما بعدهما؛ و`"none"` (الافتراضي) يستخدم `backdropFilter` | `.glass_effect(GlassEffect::Regular)` |
| `mixBlendMode` | كيف يمتزج العرض مع ما خلفه: `"multiply"`، `"screen"`، `"overlay"`، ... | `.mix_blend_mode(BlendMode::Multiply)` |

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

يختلف الدعم بين المنصات:

| | iOS | Android |
|---|---|---|
| `filter` على العروض | `opacity`، و`brightness` حتى 1 و`drop-shadow` فقط | الكل، من Android 12 (API 31)؛ ومرشحات الألوان فقط قبل ذلك |
| `filter` على الصور | كل مرشحات الألوان و`blur` | كما في العروض |
| `backdropFilter` | مادة تمويه من النظام، تقرّب نصف القطر | من Android 12 (API 31) |
| `mixBlendMode` | نعم | من Android 10 (API 29) |

يطبّق الويب وWindows وLinux كل المرشحات على العروض، وmacOS كما يفعل iOS؛ ويرسم GPUI مرشحات الألوان و`drop-shadow()`. ومرشح الخلفية تمويه على iOS وmacOS وAndroid، وكل المرشحات على الويب وWindows؛ أما Linux وGPUI فلا يرسمان أيًّا منها، ويرسم GPUI العروض بوضع المزج العادي. ومن `filter` التي تحتوي عدة `drop-shadow()`، ترسم iOS وmacOS وAndroid الأخير. `mixBlendMode` تمزج العرض مع كل ما رُسم خلفه.

على iOS، تحدد `ios={{ backdropMaterial: "regular" }}` مادة النظام المستخدمة في تمويه `backdropFilter`. القيم هي `"ultraThin"` (الافتراضي) و`"thin"` و`"regular"` و`"thick"` و`"chrome"`. اقرن الخاصية بنصف قطر تمويه موجب لإظهار المادة. تستخدم Rust `.backdrop_material(BackdropMaterial::Regular)` إلى جانب `.backdrop_blur(px(30.0))`. يقرّب نصف القطر قوة المادة: يطبّق NSH جزءًا من المادة المختارة، ويبلغ القوة الكاملة عند 30 نقطة. ويتبع الإصدار الفاتح أو الداكن لون خلفية العرض. تقابل هذه الخيارات [مواد التمويه في نظام](https://developer.apple.com/documentation/uikit/uiblureffect/style/systemmaterial) Apple.

```rust tabs
view().backdrop_blur(px(30.0)).backdrop_material(BackdropMaterial::Regular)
```

```tsx tabs
<View ios={{ backdropMaterial: "regular" }} style={{ height: 64, backdropFilter: "blur(30px)" }} />
```

`glassEffect` ترسم Liquid Glass خلف محتوى العرض على iOS 26 وmacOS 26 وما بعدهما. `"regular"` تستخدم المادة القياسية؛ و`"clear"` تأخذ لونًا أقل من الخلفية. اقرنها بـ `backdropFilter` لإظهار التمويه المعروض في إصدارات iOS الأقدم والمنصات الأخرى. يتبع الزجاج حجم العرض وزواياه المستديرة.

```tsx
<View style={{ height: 80, borderRadius: 16, backdropFilter: "blur(12px)", glassEffect: "regular" }} />
```

<a id="outlines-opacity-and-visibility"></a>

## الخطوط الخارجية والشفافية والرؤية

- `outlineWidth` و`outlineColor` و`outlineStyle` و`outlineOffset` (`.outline(..)` و`.outline_color(..)` و`.outline_dashed()` و`.outline_offset(..)`): خط خارج الحد لا يشغل مساحة (الإزاحات السالبة ترسم في الداخل). و`outlineStyle: "none"` (أو `"hidden"` أو `.outline_none()`) يخفي الخط الخارجي مهما كان عرضه، كما في CSS.
- `opacity` (`.opacity(n)`): من 0 إلى 1، تُطبَّق على العرض وأبنائه.
- `visibility: "hidden"` (`.invisible()` في Rust): لا يُرسم العرض لكنه يحتفظ بمساحته، وتتجاوزه قارئات الشاشة مع شجرته الفرعية، كما في المتصفح. و`display: "none"` (`.hidden()`) يزيله من التخطيط.
- `zIndex` (`.z_index(n)`): الترتيب بين الأشقاء، وهو أيضًا ترتيب التراص الأصلي (ثابت للقيم المتساوية).
- `cursor` (`.cursor(..)`، `.cursor_pointer()`): شكل المؤشر فوق العرض، للمؤشرات وأجهزة سطح المكتب.
<a id="transforms"></a>

## التحويلات

التحويلات هي تحويلات CSS نفسها. في TSX، تُعدّ `translate` و`rotate` و`scale` خصائص قائمة بذاتها، وتقبل `transform` سلسلة CSS من الدوال أو قائمة من الخطوات. تُطبَّق بترتيب CSS، `translate` ثم `rotate` ثم `scale` ثم `transform`، مهما كان ترتيب المفاتيح. في Rust، التحويلات هي دوال (`.translate_x(..)` و`.rotate(..)` و`.scale(..)` و...) تُطبَّق بالترتيب نفسه:

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

| الخاصية | القيمة |
|---|---|
| `translate` | `"10px 20px"` أو `"-50% 0"` (نسب مئوية من حجم العرض نفسه)، أو رقم (نقاط على امتداد المحور x)، أو `[x, y]` مع رقم أو سلسلة أو قيمة متحركة لكل محور |
| `rotate` | `"45deg"` أو `"0.25turn"` حول محور `"x 90deg"`، أو رقم (بالدرجات)، أو قيمة متحركة (بالدرجات) |
| `scale` | `1.5` أو `"150%"` أو `"1 2"` (x وy)، أو قيمة متحركة (للمحورين معًا)، أو `[x, y]` |
| `transform` | دوال CSS: `translate()` و`translateX()` و`translateY()` و`scale()` و`scaleX()` و`scaleY()` و`rotate()` / `rotateZ()` و`rotateX()` و`rotateY()` و`skew()` و`skewX()` و`skewY()` و`perspective()`؛ الأطوال بوحدة `px` (وتقبل الإزاحات أيضًا `%`)، والزوايا بوحدة `deg` أو `rad` أو `turn`؛ `"none"`؛ أو قائمة من الخطوات (`[{ perspective: 800 }, { rotateY: angle }]`) يمكن أن تكون مقاديرها قيمًا متحركة |

كل واحدة منها خاصية قائمة بذاتها، كما في الأصناف (classes): فـ`scale` في النمط يستبدل الصنف `scale-95` ويُبقي `rotate-3`. تحرّك القيم المتحركة `translate` و`rotate` و`scale` بشكل أصلي. أما ما لا تستطيع سلسلة CSS حمله مع مقدار متحرك، مثل الدوران ثلاثي الأبعاد، فأعطِ `transform` قائمة من الخطوات: `translateX` و`translateY` و`scale` و`scaleX` و`scaleY` و`rotate` (`rotateZ`) و`rotateX` و`rotateY` و`skewX` و`skewY` و`perspective` ([الرسوم المتحركة](./animation.md)). يكون `transform` في النمط إحدى الصيغتين لا كلتيهما، لذا فإن المنظور (perspective) الذي يسبق خطوات متحركة يكون خطوة ضمن القائمة.

`.perspective(..)` في Rust هي خاصية `perspective` في CSS، كما أن `perspective-*` في Tailwind كذلك: فهي تمنح أبناء العرض عمقهم، بينما تُطبَّق الدالة `perspective()` في `transform` على تحويل العرض نفسه. تقبل `transformOrigin` كلمات مفتاحية ونسبًا مئوية وأطوالًا (`"top left"` و`"50% 0"` و`[10, 20]`؛ `.origin_top_left()` و`.transform_origin(..)` في Rust)، والقيمة الافتراضية هي المركز. لا تؤثر التحويلات في التخطيط: يتم وضع العروض المجاورة كما لو أن العرض غير محوَّل.

لا يدعم Android تحويلات الميل (skew).

<a id="transitions"></a>

## الانتقالات

يحرّك العرض تغييرات نمطه إذا سمّيتَ ما يجب تحريكه. يعمل التحريك بشكل أصلي، ولا يُنفَّذ أي من شيفرتك في كل إطار.

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

| الخاصية | القيمة | Rust |
|---|---|---|
| `transitionProperty` | ما الذي يتحرك: `"all"`، أو أسماء مفصولة بفواصل: الألوان (`"colors"` و`"backgroundColor"` و`"borderColor"` و...) و`"opacity"` و`"transform"` (كل خصائص التحويل) و`"boxShadow"` و`"borderRadius"` / `"borderWidth"` | `.transition()` و`.transition_all()` و`.transition_colors()` و`.transition_opacity()` و`.transition_transform()` و`.transition_shadow()` |
| `transitionDuration` | `300` و`"300ms"` و`"0.3s"` | `.duration(300.0)` |
| `transitionDelay` | مثل المدة | `.delay(100.0)` |
| `transitionTimingFunction` | `"linear"` و`"ease"` و`"ease-in"` و`"ease-out"` و`"ease-in-out"` و`"cubic-bezier(x1, y1, x2, y2)"` | `.ease_linear()` و`.ease_in()` و`.ease_out()` و`.ease_in_out()` و`.ease_bezier(x1, y1, x2, y2)` |

الأحجام والمواضع تنتمي إلى التخطيط لا إلى النمط، ولذلك لا تنتقل تدريجيًا. حرّك تغييرات التخطيط باستخدام `LayoutAnimation` أو تحكّم في القيم عبر الرسوم المتحركة الأصلية ([الرسوم المتحركة](./animation.md)).

<a id="keyframe-animations"></a>

### رسوم الإطارات المفتاحية المتحركة

تشغّل `animationName` أحد رسوم الإطارات المفتاحية المدمجة في Tailwind بشكل أصلي: `"spin"` أو `"ping"` أو `"pulse"` أو `"bounce"`، مع `animationDuration` و`animationDelay` و`animationTimingFunction` و`animationIterationCount` (رقم أو `"infinite"`)، بأي ترتيب. في Rust، تشغّلها `.animate_spin()` و`.animate_ping()` و`.animate_pulse()` و`.animate_bounce()` بتوقيت Tailwind، وتشغّلها `.animation(KeyframeAnimation::new(..))` بتوقيتك الخاص:

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

## استجابة الضغط

استجابة الضغط هي أنماط التطبيق للحالة المضغوطة، وتُطبَّق بشكل أصلي دون الرجوع إلى شيفرتك. وتقبل حالات التمرير والتركيز والتعطيل أنماطًا بالطريقة نفسها (`.hover(..)` و`.focus(..)` و`.disabled_style(..)` في Rust؛ `hoverStyle` و`focusStyle` و`disabledStyle`، أو `hover:` و`focus:` و`disabled:`، في TSX):

| Rust | TSX | التأثير أثناء الضغط |
|---|---|---|
| `.active(\|s\| s.opacity(0.6))` | `activeStyle={{ opacity: 0.6 }}` | يتلاشى العرض إلى هذه الشفافية |
| `.active(\|s\| s.bg(rgb(0xeaeef2)))` | `activeStyle={{ backgroundColor: "#eaeef2" }}` | تتحول الخلفية إلى هذا اللون |
| `.ripple(Ripple { color: Some(rgba(0x00000022).into()), ..Ripple::default() })` | `android={{ ripple: { color: "#0002" } }}` | تأثير التموج (ripple) المادي في Android |
| `.active(\|s\| s.bg(ZINC.shade(100)).scale(0.95))` | `class="active:bg-zinc-100 active:scale-95"` | أي نمط |

راجع [اللمس والإيماءات](./touch-and-gestures.md).

<a id="extensions"></a>

## الامتدادات

تحمل هذه المفاتيح والأصناف ما تقدمه المنصات الأصلية إلى جانب CSS:

| المفتاح | الصنف | ماذا يفعل |
|---|---|---|
| `placeholderColor` | `placeholder:text-*` | لون النص البديل في `<Input>` |
| `selectionColor` | `selection:bg-*` | تمييز التحديد في `<Input>` أو `<Text>` قابل للتحديد |
| `tintColor` | `tint-*` | يعيد تلوين وحدات البكسل المعتمة في `<Image>` (الصور القالبية والأيقونات) |
| `borderCurve` | | `"continuous"`: زوايا تنساب تدريجيًا نحو الحواف، كما في زوايا النظام نفسه (الزوايا المتصلة continuous corners في Apple) |
| `glassEffect` | | Liquid Glass من Apple خلف العرض على iOS 26 وmacOS 26، و`backdropFilter` في غيرهما |
| `writingDirection` | | الاتجاه الأساسي للنص: `"auto"` (الافتراضي: يُحدَّد من محتواه، كما تفعل عروض النص في المنصات) أو `"ltr"` أو `"rtl"`؛ بينما تحدد `direction` اتجاه التخطيط |
| `textAlignVertical` | | موضع النص الأقصر من صندوق `<Text>` الخاص به: `"top"` (الافتراضي) أو `"center"` أو `"bottom"` |
| `textAlign: "auto"` | | الجانب الطبيعي للنص بحسب اتجاهه (الافتراضي) |
| `selectedStyle` | `selected:` | النمط أثناء كون `accessibilityState.selected` هي `true` (`Button` محدد، وتبويب) |
| | `ios:` و`android:` و`web:` | أصناف لمنصة واحدة (`ios:pt-2`) |

تقبل القيم المتغيرة أيضًا أرقامًا حيث تقبل CSS سلسلة نصية: `transform` كقائمة من الخطوات، و`translate` و`scale` كـ`[x, y]`، و`boxShadow` و`textShadow` كطبقات.

<a id="related"></a>

## ذو صلة

- [Tailwind](./tailwind.md): الأنماط نفسها على شكل أصناف، مع متغيرات (variants) للوضع الداكن وحالات الضغط ونقاط التوقف، ومكافئاتها المضبوطة الأنواع.
- [التخطيط](./layout.md) و[النص](./text.md).
- [مرجع الأنماط](../modules/style-reference.md): كل خاصية نمط ونوعها.
