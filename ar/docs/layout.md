---
title: "التخطيط"
description: "Flexbox مع الاتجاه العمودي كقيمة افتراضية، وCSS grid، والأحجام والنسب المئوية، ونسبة العرض إلى الارتفاع، والتموضع المطلق، والقياس باستخدام onLayout، والتخطيطات المتجاوبة والكتابة من اليمين إلى اليسار، في Rust وTSX."
order: 34
group: ui
demo: guide-layout
source_hash: f4073f703fc9be46
---

# التخطيط

يرتّب NSH كل عنصر باستخدام [Taffy](https://github.com/DioxusLabs/taffy)، وهو تنفيذ بلغة Rust لتخطيطات CSS من نوع flexbox وgrid وblock، مضبوط بحيث يرصّ الأبناء عموديًا ولا ينكمشون افتراضيًا. يعمل التخطيط في النواة بعد كل دورة من شيفرتك، ولا تُرسل إلى العروض الأصلية إلا الإطارات التي تغيّرت. يقيس محرك النصوص في المنصة النصوصَ على الخيط نفسه، لذلك لا ينتظر التخطيط الخيط الرئيسي أبدًا.

خصائص التخطيط أدناه هي خصائص أنماط. في Rust هي دوال نمط مُنمَّطة بأنواع (`.flex_row()`، `.gap_4()`، `.grid_cols(3)`، `.absolute().inset_0()`)؛ وفي TSX هي مفاتيح الخاصية `style`، ولكل منها فئة [Tailwind](./tailwind.md) (`flex-row`، `gap-4`، `grid-cols-3`، `absolute inset-0`، ...). وكلاهما يُحوَّل إلى الأنماط الأصلية نفسها.

## Flexbox

يرتّب الـ View أبناءه باستخدام flexbox. الـ View الذي لا يضبط `display` يرصّ أبناءه في عمود؛ و`display: "flex"` في نمط ما يجعله صفًّا ما لم تُضبط `flexDirection`، تمامًا كما في CSS وكما في فئة Tailwind ‏`flex`. عندما لا يضبط شيء هذه القيم، تُطبَّق القيم الافتراضية التالية:

| الخاصية | الافتراضي في NSH | الافتراضي في الويب |
|---|---|---|
| `flexDirection` | `"column"` (View لا يضبط `display`)؛ `"row"` بمجرد ضبط `display: "flex"` | `row` |
| `flexShrink` | `0` | `1` |
| `alignContent` | `"flex-start"` (الشبكات: `"normal"`) | `normal` |
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

| الخاصية | القيم | Rust |
|---|---|---|
| `flexDirection` | `"column"`، `"row"`، `"column-reverse"`، `"row-reverse"` | `.flex_col()`، `.flex_row()`، `.flex_col_reverse()`، `.flex_row_reverse()` |
| `justifyContent` | المحور الرئيسي: `"flex-start"`، `"flex-end"`، `"start"`، `"end"`، `"center"`، `"space-between"`، `"space-around"`، `"space-evenly"`، `"stretch"` | `.justify_start()`، `.justify_center()`، `.justify_end()`، `.justify_between()`، `.justify_around()`، `.justify_evenly()` |
| `alignItems` | المحور المتقاطع: `"stretch"`، `"flex-start"`، `"flex-end"`، `"start"`، `"end"`، `"self-start"`، `"self-end"`، `"center"`، `"baseline"` | `.items_stretch()`، `.items_start()`، `.items_center()`، `.items_end()`، `.items_baseline()` |
| `alignSelf` | محاذاة ابن واحد على المحور المتقاطع؛ `"auto"` تتبع `alignItems` الخاصة بالأب | `.self_start()`، `.self_center()`، `.self_end()`، `.self_stretch()` |
| `alignContent` | أسطر الحاوية الملتفّة | |
| `flexWrap` | `"nowrap"`، `"wrap"`، `"wrap-reverse"` | `.flex_wrap()` |
| `flex` | اختصار برقم واحد (أدناه) | `.flex_1()`، `.flex_auto()`، `.flex_none()` |
| `flexGrow`، `flexShrink`، `flexBasis` | كما في CSS | `.flex_grow(n)`، `.flex_shrink(n)`، `.flex_shrink_0()`، `.basis(length)` |
| `gap`، `rowGap`، `columnGap` | المسافة بين الأبناء | `.gap(length)`، `.gap_y(length)`، `.gap_x(length)`، والخطوات `.gap_2()`، `.gap_x_4()`، ... |

`flex-start` و`flex-end` تتبعان اتجاه flex؛ أما `start` و`end` فتتبعان اتجاه الكتابة، كما في CSS (من اليمين إلى اليسار، `start` هو الجانب الأيمن)، وكذلك `self-start` / `self-end` الخاصتان بالابن نفسه.

`flex` هو اختصار CSS، مثل فئات Tailwind ‏`flex-*`: الرقم `n` يعني النمو بمقدار `n`، والانكماش بمقدار 1، والبدء من أساس قدره 0، وهكذا يتقاسم الأشقاء `flex: 1` (`.flex_1()` في Rust، `flex-1`) المساحة بالتساوي مهما كان محتواهم؛ و`"none"` تعني `0 0 auto` (يحتفظ الـ View بحجمه)، و`"auto"` تعني `1 1 auto`، و`"initial"` تعني `0 1 auto`، ويمكن كتابة النمو والانكماش والأساس صراحةً (`"2 0 50%"`، `"1 1 120px"`). ولأن الحدود الدنيا للأحجام تساوي 0 افتراضيًا، فإن `flex: 0` (`0 1 0`) تُنقص حجم الـ View إلى لا شيء ما لم تُبقِ `minWidth: "auto"` على حجم محتواه.

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

ولأن الحدود الدنيا للأحجام تساوي 0 افتراضيًا، فإن نص `flex: 1` داخل صف ينكمش ويلتف بدلًا من دفع أشقائه إلى الخارج. أما `minWidth: "auto"` / `minHeight: "auto"` (`min-w-auto` / `min-h-auto`، `.min_w(auto())` في Rust) فهي الحد الأدنى التلقائي في CSS: العنصر المنكمش يتوقف عند أصغر حجم لمحتواه، أي أطول كلمة في النص، كما في الويب.

> [!NOTE]
> `display: "flex"` تعني صفًّا، في النمط والفئة (`flex`) وRust (`.flex()`) على حد سواء، ما لم يُضبط اتجاه: `{ display: "flex", flexDirection: "column" }`، `flex flex-col`، `.flex().flex_col()`. الـ View بدون `display` لا يحتاج إلى شيء ليكون عمودًا.

<a id="sizes"></a>

## الأحجام

| الخاصية | القيم | Rust |
|---|---|---|
| `width`، `height` | نقاط، أو نسبة مئوية من الأب (`"50%"`)، أو `"auto"` | `.w(px(120.0))`، `.h(relative(0.5))`، `.w_full()`، `.size(px(44.0))`، والخطوات `.w_10()`، ... |
| `minWidth`، `maxWidth`، `minHeight`، `maxHeight` | نقاط أو نسب مئوية؛ و`minWidth` / `minHeight` تقبلان أيضًا `"auto"`، أي أصغر حجم للمحتوى | `.min_w(..)`، `.max_w(..)`، `.min_h(..)`، `.max_h(..)` |
| `aspectRatio` | العرض مقسومًا على الارتفاع: `1`، `16 / 9` | `.aspect_ratio(16.0 / 9.0)`، `.aspect_square()` |
| `padding`، `paddingHorizontal`، `paddingVertical`، `paddingTop`، ... | نقاط أو نسب مئوية | `.p(..)`، `.px(..)`، `.py(..)`، `.pt(..)`، ...، والخطوات `.p_4()`، `.px_2()`، ... |
| `margin`، `marginHorizontal`، `marginVertical`، `marginTop`، ... | نقاط أو نسب مئوية أو `"auto"` | `.m(..)`، `.mx(..)`، `.my(..)`، `.mt(..)`، ...، `.mx(auto())` |

في Rust يكون الطول مُنمَّطًا بنوع: `px(16.0)` تساوي 16 نقطة، و`relative(0.5)` تساوي 50% من الأب، و`auto()` هي `auto`. تتبع دوال الخطوات مقياس المسافات في Tailwind بواقع 4 نقاط لكل خطوة (`.p_4()` تساوي 16 نقطة، و`.gap_0p5()` تساوي نقطتين).

بدون حجم، يكون الـ View بحجم محتواه (مضافًا إليه الحشو)، ويُمدَّد على المحور المتقاطع لأبيه بفعل `alignItems: "stretch"` الافتراضية. النسب المئوية نسبةً إلى حجم الأب (وفي الحشو والهامش، كما في CSS، نسبةً إلى عرضه).

`aspectRatio` يحدد البعد الآخر انطلاقًا من البعد المعروف:

```rust tabs
view().w_full().aspect_ratio(16.0 / 9.0).bg(black())
```

```tsx tabs
<View style={{ width: "100%", aspectRatio: 16 / 9, backgroundColor: "#000000" }} />
```

للصور القادمة من أصول التطبيق حجم طبيعي، وتُرتَّب بهذا الحجم عندما لا يُحدَّد حجم ([الصور والأصول](./images-and-assets.md)). أما الصور البعيدة فلا حجم لها حتى تُحمَّل: حدّد لها حجمًا.

## Grid

`display: "grid"` (`.grid()` في Rust) يرتّب الأبناء في مسارات شبكة CSS:

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

| الخاصية | القيم | Rust |
|---|---|---|
| `gridTemplateColumns`، `gridTemplateRows` | قوائم مسارات CSS: `"repeat(3, 1fr)"`، `"200px 1fr"`، `minmax()`، `auto-fill` / `auto-fit`، وأسماء الخطوط | `.grid_cols(3)`، `.grid_rows(2)`، `.grid_template_columns("200px 1fr")`، `.grid_template_rows(..)` |
| `gridAutoColumns`، `gridAutoRows` | مسارات الأعمدة والصفوف المُنشأة ضمنيًا | |
| `gridAutoFlow` | `"row"`، `"column"`، `"dense"`، `"row dense"`، `"column dense"` | `.grid_flow_col()`، `.grid_flow_dense()` |
| `gridColumn`، `gridRow` | `"1 / 3"`، `"span 2"`، رقم خط أو اسمه: `"content-start / content-end"`، `"2 col"` (الخط الثاني المسمّى `col`)، `"span col"` (حتى الخط التالي المسمّى `col`) | `.col_span(2)`، `.row_span(2)`، `.col_span_full()` |
| `gridColumnStart`، `gridColumnEnd`، `gridRowStart`، `gridRowEnd` | أرقام الخطوط أو أسماؤها | `.col_start(1)`، `.col_end(3)`، `.row_start(..)`، `.row_end(..)` (أرقام الخطوط) |
| `justifyItems`، `justifySelf` | كيف تستقر العناصر في مناطقها على امتداد الصف: `"start"`، `"end"`، `"center"`، `"stretch"`، ... | |
| `alignItems`، `alignSelf` | كيف تستقر العناصر في مناطقها على امتداد العمود | `.items_*()`، `.self_*()` |
| `justifyContent`، `alignContent` | كيف تستقر المسارات في الشبكة على امتداد الصف والعمود | `.justify_*()` |

تسمّي القوالب خطوطها بين أقواس مربعة، اسمًا واحدًا أو عدة أسماء لكل خط، وتوضع العناصر بحسب هذه الأسماء، كما في CSS (وفي Rust بحسب أرقام الخطوط):

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

في الشبكة، تكون القيمة الافتراضية لـ`justifyContent` و`alignContent` هي `"normal"` في CSS: المسارات ذات الحجم `auto` تتمدد لملء الحاوية، لذلك تتقاسم الشبكة التي لها ارتفاع وبلا قالب صفوف هذا الارتفاع بين صفوفها. أما القيمة المضبوطة صراحةً (`"start"`، `"center"`، `"space-between"`، ...) فتضع المسارات كما تفعل في CSS. وتضبط فئات المحاذاة ما تضبطه Tailwind CSS بالضبط: `content-start` (`align-content: flex-start`) و`place-content-start` تجمعان المسارات عند البداية، و`content-normal` و`justify-normal` تمدّدانها، كما في المتصفح.

`display: "block"` يستخدم تخطيط block في CSS (الأبناء مرصوصون، وكلٌّ منهم بعرض الحاوية)، و`display: "none"` (`.hidden()`) يزيل الـ View من التخطيط.

<a id="absolute-positioning"></a>

## التموضع المطلق

`position: "absolute"` (`.absolute()`) يُخرج الـ View من التدفق ويضعه بواسطة `top` و`right` و`bottom` و`left`، نسبةً إلى أبيه:

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

تقبل الإزاحات نقاطًا ونسبًا مئوية (`.top(..)`، `.right(..)`، `.bottom(..)`، `.left(..)`، `.inset(..)` في Rust). الـ View الذي له `left` و`right` (أو `top` و`bottom`) وبلا حجم يتمدد بينهما. تُرسم الأشقاء اللاحقة فوق السابقة؛ و`zIndex` (`.z_index(n)`) يغيّر الترتيب.

<a id="measuring"></a>

## القياس

`onLayout` (`.on_layout(..)`) يُبلغ عن إطار الـ View، نسبةً إلى أبيه، بعد كل تخطيط تغيّر فيه:

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

الإطار بالنقاط: `Bounds<Points>` في Rust، و`{ bounds }` في TSX، وهو `Bounds` (`{ origin: { x, y }, size: { width, height } }`). لقراءة النافذة كاملةً، اقرأ `window()` في Rust أو `windowSize()` من [`nsh`](../modules/nsh.md#device) في TSX؛ وكلاهما يتبع التدوير وتغيير حجم النافذة، والنمط الذي يقرأهما يتغير مع النافذة:

```rust tabs
view().style_when(|| window().width > px(600.0), |s| s.flex_row())
```

```tsx tabs
import { View } from "nsh";
import { windowSize } from "nsh";

<View style={{ flexDirection: windowSize().width > 600 ? "row" : "column" }} />
```

نقاط التوقف في Tailwind (`sm:`، `md:`، ...) و`portrait:` / `landscape:` تعطي النتيجة نفسها بدون شيفرة.

<a id="safe-areas"></a>

## المناطق الآمنة

يغطي الـ View الجذر الشاشة كلها، تحت شريط الحالة ومؤشر الصفحة الرئيسية. أضف حشوًا للشاشات بمقدار حواف المنطقة الآمنة باستخدام `env()` في CSS (`paddingTop: "env(safe-area-inset-top)"`، وفي Tailwind ‏`pt-[env(safe-area-inset-top)]`، و`.p_safe_area()` في Rust؛ راجع [المنطقة الآمنة](../elements/safe-area.md))، أو اقرأ الحواف بواسطة `safe_area()` في Rust أو `safeArea()` / `safeAreaInsets()` في TSX وطبّقها بنفسك. أما صفحات [مكدّس التنقل](./navigation.md) فتقع أصلًا تحت ترويستها.

<a id="right-to-left"></a>

## من اليمين إلى اليسار

يتبع اتجاه التخطيط في التطبيق لغة النظام، ويحدد النمط `direction` للـ View (`"ltr"` أو `"rtl"` أو `"inherit"`؛ و`.direction(LayoutDirection::Rtl)` في Rust) اتجاه شجرته الفرعية. عندما يُرتَّب التطبيق من اليمين إلى اليسار:

- تمتد الصفوف من اليمين؛
- تحتفظ `left` و`right` بجانبيهما، كما في المتصفح، في مفاتيح الأنماط والفئات على حد سواء: `paddingLeft`، `marginLeft`، `left`، `borderLeftWidth`، `borderTopLeftRadius`، `textAlign: "left"` و`pl-4`، `ml-2`، `left-0`، `border-l`، `rounded-tl-lg`، `text-left` تبقى على اليسار؛
- تتبع الخصائص المنطقية الاتجاه، حيث تكون بداية السطر هي الجانب الأيمن: `marginStart`، `marginEnd`، `paddingStart`، `paddingEnd`، `start`، `end`، `borderStartWidth`، `borderEndColor`، `borderTopStartRadius`، ...، `textAlign: "start"` / `"end"` (`ps-4`، `ms-2`، `start-0`، `border-s`، `rounded-ss-lg`، `text-start` كفئات؛ و`.ms(..)`، `.me(..)`، `.ps(..)`، `.pe(..)`، `.border_s(..)`، `.rounded_ss(..)`، ... في Rust)؛ و`marginHorizontal` و`paddingHorizontal` تضبطان الجانبين معًا؛
- يُحاذى النص ذو `textAlign: "auto"` إلى اليمين، وتنعكس عناصر التحكم الأصلية.

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

تُطبَّق التغييرات في الاتجاه، سواء في اللغة أو في View معيّن، فورًا ودون إعادة تشغيل. كما يُبقي النمط `direction` View واحدًا وأبناءه في اتجاه خاص بهم، مثلًا رقم هاتف من اليسار إلى اليمين. على Android، تحتاج التطبيقات التي تضمّن NSH إلى `android:supportsRtl="true"` في ملف manifest الخاص بها كي تنعكس عناصر التحكم الأصلية.

<a id="related"></a>

## ذات صلة

- [التنسيق](./styling.md): كيف تتحد الأنماط.
- [التمرير](./scrolling.md) و[القوائم](./lists.md): المحتوى الأكبر من الشاشة.
- [مرجع الأنماط](../modules/style-reference.md): كل خاصية تخطيط ونوعها.
