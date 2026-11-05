---
title: "مرجع الأنماط"
description: "جميع مفاتيح الأنماط التي يقبلها NSH، مجمّعة حسب LayoutStyle وViewStyle وTextStyle وInputStyle وImageStyle، مع نوع كل مفتاح ومعناه."
order: 16
source_hash: 012ce37fb9fe065c
---

# مرجع الأنماط

تسرد هذه الصفحة كل مفتاح من مفاتيح الخاصية `style`، والدالة في `Styled` التي تضبطه في Rust. تنسّق مكوّنات Rust العناصر بدوال مُنمَّطة بأنواعها تحمل أسماء أدوات Tailwind المساعدة (`.p_4()` و`.rounded(px(12.0))` و`.bg(color)` من `nsh_core::prelude`)، وتُحوَّل إلى المفاتيح نفسها؛ أما TSX فيمرّر كائنات `style` (والفئات classes). يذكر عمود Rust اسم الدالة؛ ويمكن تمرير قيمة أو signal أو closure إلى معظمها، وتجعل `.style_when(…)` / `.style_with(…)` أيًّا منها مشروطًا. تأتي المفاتيح وأنواعها من التصريحات المولَّدة في `.nsh/types/nsh/types.d.ts`، لذا يتحقق محررك منها أثناء الكتابة. يعني مفتاح النمط خاصية CSS التي تحمل اسمه، وهو مطابق للفئة التي تضبطها: `paddingLeft` هو `padding-left` و`pl-4` في CSS، و`boxShadow` هو `box-shadow` و`shadow-md`؛ وتأخذ بعض المفاتيح أسماء أبسط يكتبها مطوّرو التطبيقات (`paddingHorizontal` بدلًا من `padding-inline`، و`marginStart` بدلًا من `margin-inline-start`، و`numberOfLines` بدلًا من `line-clamp`). الأرقام تعني نقاطًا (points)، وميزات CSS متاحة أيضًا: grid والتدرجات وظلال الصناديق والمرشحات وأنماط المزج والمخططات الخارجية والتحويلات والانتقالات ورسوم keyframe المتحركة.

لمعرفة كيفية تطبيق الأنماط ودمجها مع الفئات ووراثة أنماط النص، راجع [التنسيق](../docs/styling.md). ولمعرفة صيغة الفئات، راجع [مرجع Tailwind](./tailwind-reference.md).

<a id="the-five-interfaces"></a>

## الواجهات الخمس

تمتد كل واجهة من التي قبلها:

| الواجهة | تمتد من | تُستخدم في |
|---|---|---|
| `LayoutStyle` | | تخطيط كل عنصر (flexbox وgrid والأحجام والتباعد والموضع) |
| `ViewStyle` | `LayoutStyle` | `<View>` و`<Scroll>` و`<List>` وعناصر التحكم وكل عنصر آخر |
| `TextStyle` | `ViewStyle` | `<Text>` و`<Input>` (وكذلك views، إذ تنتقل أنماط النص فيها إلى النص بداخلها) |
| `InputStyle` | `TextStyle` | `<Input>`: تضيف `placeholderColor` و`caretColor` |
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

يقبل `style` أيضًا مصفوفة؛ تُدمج عناصرها من اليسار إلى اليمين وتُتجاهل العناصر الزائفة (falsy)، فلا حاجة إلى النشر (spreading) في الأنماط الشرطية. في Rust تضيف `.style_when(condition, …)` أنماطًا ما دام الشرط متحققًا:

```rust tabs
card().style_when(selected, |s| s.border_color(rgb(0x2563eb)).border(px(2.0)))
```

```tsx tabs
<View style={[card, selected() && { borderColor: "#2563eb", borderWidth: 2 }]} />
```

> [!NOTE]
> يتغلب `style` المضمَّن دائمًا على `class`. ضبط مفتاح على `null` أو `undefined` يعيده إلى قيمته الافتراضية.

<a id="how-style-keys-read"></a>

## كيف تُقرأ مفاتيح الأنماط

تتبع مفاتيح الأنماط CSS، لذا فإن النمط والفئة اللذين يسميان الخاصية نفسها يؤديان الوظيفة نفسها:

- **اتجاه التخطيط.** الـ view التي لا تضبط `display` تُرتّب أبناءها في عمود. `display: "flex"` يكون صفًّا ما لم يُضبط `flexDirection`، كما في CSS والفئة `flex`. `flexShrink` هو `0` ما لم يُضبط.
- **الجوانب الفيزيائية والمنطقية.** `left` و`right` و`marginLeft` و`paddingRight` و`borderLeftWidth` و`borderTopLeftRadius` و`textAlign: "left"` تحتفظ بجانبها في التخطيطات من اليمين إلى اليسار. أما مفاتيح البداية والنهاية (`marginStart` و`paddingEnd` و`start` و`end` و`borderStartWidth` و...) والعائلة `borderTopStartRadius` و`textAlign: "start" | "end"` فتتبع الاتجاه: بداية السطر (inline start) هي اليسار في التخطيطات من اليسار إلى اليمين، واليمين في التخطيطات من اليمين إلى اليسار.
- **ألوان الحدود.** الحد أو المخطط الخارجي الذي ضُبط عرضه ولم يُضبط لونه يُرسم بلون النص (`currentColor` في CSS).
- **التحويلات.** `translate` و`rotate` و`scale` خصائص مستقلة، ويقبل `transform` سلسلة دوال CSS أو قائمة خطوات يمكن أن تكون مقاديرها قيمًا متحركة. وتُركَّب بهذا الترتيب: `translate` ثم `rotate` ثم `scale` ثم `transform`.

<a id="value-types"></a>

## أنواع القيم

| النوع | يقبل | Rust |
|---|---|---|
| `number` | نقاطًا (مستقلة عن الكثافة). `1` تساوي نقطة واحدة على iOS ووحدة dp واحدة على Android. | `Points`: `px(16.0)` |
| `DimensionValue` | `number` (نقاط) أو `` `${number}%` `` (من الأصل) أو `"auto"`. | `Length`: `px(…)` و`relative(0.5)` و`auto()` |
| `LengthValue` | `number` (نقاط) أو `` `${number}%` ``. بلا `"auto"`. | `DefiniteLength`: `px(…)` و`relative(0.5)` |
| `ColorValue` | سلسلة لون CSS: `#rgb` و`#rgba` و`#rrggbb` و`#rrggbbaa` و`rgb()` و`rgba()` و`hsl()` و`hsla()` و`oklch()` و`oklab()`، أو لونًا مسمّى في CSS (`black` و`white` و`transparent` و`rebeccapurple` و...). | `Hsla` / `AdaptiveColor`: `rgb(0x2563eb)` و`hsla(…)` وألوان السمة (`theme().primary`) |
| `EnvValue` | متغير بيئة في الحشو أو الهامش: `env(name)` و`env(name, <length>)` (يحل الطول محل اسم غير معروف) أو `calc(env(name) + <length>)` أو `calc(<length> + env(name))`. الأسماء هي `safe-area-inset-top` و`-right` و`-bottom` و`-left` ([المنطقة الآمنة](../elements/safe-area.md)) و`keyboard-inset-height` ([لوحة المفاتيح](../elements/keyboard.md)). تقبله مفاتيح الحشو والهامش الفيزيائية واختصاراتها. | `.p_safe_area()` و`.pt_safe_area_plus(px(8.0))` و`.pb_keyboard()` و`.mb_keyboard_plus(…)` و... |
| `AnimatedNode` | قيمة متحركة أصلية أو عقدة مشتقة منها (راجع [واجهة الرسوم المتحركة في `nsh`](./nsh.md#animation)). تقبلها `opacity` و`backgroundColor` و`borderColor` و`color` و`translate` و`rotate` و`scale` وخطوات قائمة `transform` والمفتاحان `top` / `left` في view لاصقة؛ وعندها تتحرك القيمة على خيط واجهة المستخدم دون JS. | `AnimatedValue` / `AnimatedNode`، وتُربط بـ `.bind_opacity(&v)` و`.bind_background(&v)` و`.bind_border_color(&v)` و`.bind_color(&v)` و`.bind_translate_x(&v)` و... |

السلاسل ذات صيغة CSS (`boxShadow` و`textShadow` و`backgroundImage` و`filter` و`gridTemplateColumns` و...) تقبل أطوالًا بوحدة `px` وبأرقام مجردة (كلاهما نقاط)، أو `pt` (4/3 نقطة، كما في CSS)، أو `rem` (16 نقطة).

## LayoutStyle

يُحسب التخطيط في Rust (flexbox وCSS grid). الـ view التي لا تضبط `display` هي حاوية flex تتراص أبناؤها في عمود؛ ويجعلها `display: "flex"` صفًّا ما لم يُضبط `flexDirection`، كما في CSS. القيم الافتراضية للعناصر هي `flexShrink: 0` و`alignContent: "flex-start"` (في grid: `"normal"` في CSS) و`alignItems: "stretch"`، ولا يوجد حد أدنى تلقائي للحجم. راجع [التخطيط](../docs/layout.md).

<a id="display-and-position"></a>

### العرض والموضع

| المفتاح | النوع | Rust | الوصف |
|---|---|---|---|
| `display` | `"flex" \| "grid" \| "block" \| "flow-root" \| "none"` | `.flex()` و`.grid()` و`.hidden()` | تخطيط الأبناء. `"flex"` يرتّبهم في صف ما لم يحدد `flexDirection` اتجاهًا، كما في CSS؛ أما view لا تضبط display فترتّبهم في عمود. `"none"` يزيل العنصر من التخطيط ويخفيه. `"block"` يرصّ الأبناء كما يفعل تخطيط block في CSS. |
| `boxSizing` | `"border-box" \| "content-box"` | | تشمل الأبعاد الحدود والحشو، أو المحتوى وحده. الافتراضي `"border-box"`. |
| `position` | `"relative" \| "absolute" \| "static" \| "fixed" \| "sticky"` | `.relative()` و`.absolute()` | `"absolute"` يُخرج العنصر من التدفق ويضعه وفق `top` / `right` / `bottom` / `left` بالنسبة إلى أقرب سلف محدَّد الموضع (أصله المباشر ما لم يكن `"static"`). `"static"` يبقى في التدفق ويتجاهل الإزاحات. `"fixed"` يحافظ على نوع العنصر ويخططه ويركّبه في سطحه أو جذر النافذة المنبثقة (modal)، فيبقى في مكانه بينما يتمرر المحتوى المحيط. `"sticky"` يبقى في التدفق، وما دام أصله ظاهرًا يلتصق `top` (`left` في scroll view أفقية) على مسافة من بداية إطار العرض في scroll view المحيطة به، إلى أن تلتقي نهايته بنهاية صندوق محتوى أصله؛ ويُرسم فوق إخوته ذوي `zIndex` نفسه. الافتراضي `"relative"`. |
| `top` | `DimensionValue \| AnimatedNode` | `.top(…)` و`.inset(…)` و`.bind_sticky_top(&node)` | الإزاحة من الحافة العلوية للأصل (absolute) أو من موضع العنصر نفسه (relative). في view لاصقة، هو موضع الالتصاق، ويمكن لقيمة متحركة أن تحركه في كل إطار. |
| `right` | `DimensionValue` | `.right(…)` | الإزاحة من الحافة اليمنى، في أي اتجاه. |
| `bottom` | `DimensionValue` | `.bottom(…)` | الإزاحة من الحافة السفلية. |
| `left` | `DimensionValue \| AnimatedNode` | `.left(…)` و`.bind_sticky_left(&node)` | الإزاحة من الحافة اليسرى، في أي اتجاه. في view لاصقة داخل scroll view أفقية، هو موضع الالتصاق، ويمكن لقيمة متحركة أن تحركه في كل إطار. |
| `start` | `DimensionValue` | | الإزاحة من حافة بداية السطر: اليسار في التخطيطات من اليسار إلى اليمين، واليمين في التخطيطات من اليمين إلى اليسار. |
| `end` | `DimensionValue` | | الإزاحة من حافة نهاية السطر: اليمين في التخطيطات من اليسار إلى اليمين، واليسار في التخطيطات من اليمين إلى اليسار. |
| `zIndex` | `number` | `.z_index(z)` | الترتيب بين الإخوة (مستقر عند تساوي القيم)؛ وهو أيضًا ترتيب التكديس الأصلي. |
| `direction` | `"inherit" \| "ltr" \| "rtl"` | | اتجاه التخطيط، ويُورَّث افتراضيًا. كما في CSS، تحتفظ الخاصيتان `left` و`right` بجانبيهما من اليمين إلى اليسار، بينما تأخذ مفاتيح بداية السطر / نهايته (`marginStart` و`end` و...) الجانبين اللذين يحددهما الاتجاه. |

### Flexbox

| المفتاح | النوع | Rust | الوصف |
|---|---|---|---|
| `flexDirection` | `"row" \| "column" \| "row-reverse" \| "column-reverse"` | `.flex_row()` و`.flex_col()` و`.flex_row_reverse()` و`.flex_col_reverse()` | المحور الرئيسي. الافتراضي `"column"` في view لا تضبط `display`، و`"row"` بمجرد ضبط `display: "flex"`. |
| `flexWrap` | `"wrap" \| "nowrap" \| "wrap-reverse"` | `.flex_wrap()` | هل يلتف الأبناء على عدة أسطر. الافتراضي `"nowrap"`. |
| `flex` | `number` | `.flex_1()` و`.flex_auto()` و`.flex_none()` | رقم واحد وليس اختصار CSS: الرقم الموجب يضبط `flexGrow` عليه، و`flexShrink: 1` و`flexBasis: 0`؛ و`0` يجعل العنصر غير مرن؛ والرقم السالب يقلّصه حتى حجمه الأدنى. |
| `flexGrow` | `number` | `.flex_grow(f)` | مقدار ما يأخذه العنصر من المساحة الحرة. الافتراضي `0`. |
| `flexShrink` | `number` | `.flex_shrink(f)` و`.flex_shrink_0()` | مقدار تقلص العنصر عند نفاد المساحة. الافتراضي `0` وليس `1` كما في CSS. |
| `flexBasis` | `DimensionValue` | `.basis(…)` | حجم المحور الرئيسي قبل توزيع المساحة الحرة. |
| `justifyContent` | `"flex-start" \| "flex-end" \| "start" \| "end" \| "center" \| "space-between" \| "space-around" \| "space-evenly" \| "stretch" \| "normal"` | `.justify_start()` و`.justify_center()` و`.justify_end()` و`.justify_between()` و`.justify_around()` و`.justify_evenly()` | توزيع الأبناء على المحور الرئيسي. الافتراضي `"normal"`: `"flex-start"` في حاويات flex؛ وفي grid تتمدد المسارات ذات الحجم `auto`. |
| `alignItems` | `"flex-start" \| "flex-end" \| "start" \| "end" \| "self-start" \| "self-end" \| "center" \| "stretch" \| "baseline" \| "normal"` | `.items_start()` و`.items_center()` و`.items_end()` و`.items_stretch()` و`.items_baseline()` | محاذاة الأبناء على المحور المتقاطع. الافتراضي `"stretch"`. |
| `alignSelf` | `"auto" \| "flex-start" \| "flex-end" \| "start" \| "end" \| "self-start" \| "self-end" \| "center" \| "stretch" \| "baseline" \| "normal"` | `.self_start()` و`.self_center()` و`.self_end()` و`.self_stretch()` | يتجاوز `alignItems` الخاص بالأصل لهذا العنصر. |
| `alignContent` | `"flex-start" \| "flex-end" \| "start" \| "end" \| "center" \| "stretch" \| "space-between" \| "space-around" \| "space-evenly" \| "normal"` | `.content_start()` و`.content_center()` و`.content_between()` و… | توزيع الأسطر الملتفة (ومسارات grid) على المحور المتقاطع. الافتراضي `"flex-start"` في حاويات flex و`"normal"` في grid، حيث تتمدد المسارات ذات الحجم `auto`. `"start"` / `"end"` يتبعان اتجاه الكتابة. |
| `gap` | `LengthValue` | `.gap(…)` و`.gap_4()` | المسافة بين صفوف الأبناء وأعمدتهم. |
| `rowGap` | `LengthValue` | `.gap_y(…)` | المسافة بين الصفوف. |
| `columnGap` | `LengthValue` | `.gap_x(…)` | المسافة بين الأعمدة. |

### Grid

اضبط `display: "grid"` لتخطيط الأبناء في شبكة CSS. قوائم المسارات تستخدم صيغة CSS.

| المفتاح | النوع | Rust | الوصف |
|---|---|---|---|
| `gridTemplateColumns` | `string` | `.grid_template_columns(…)` و`.grid_cols(n)` | مسارات الأعمدة: `"repeat(3, 1fr)"` و`"200px 1fr"` و`minmax()` و`auto-fill` / `auto-fit` وأسماء الخطوط (`"[a] 40px [b c] 1fr [d]"`). |
| `gridTemplateRows` | `string` | `.grid_template_rows(…)` و`.grid_rows(n)` | مسارات الصفوف، بالصيغة نفسها. |
| `gridAutoColumns` | `string` | | حجم الأعمدة المنشأة ضمنيًا. |
| `gridAutoRows` | `string` | | حجم الصفوف المنشأة ضمنيًا. |
| `gridAutoFlow` | `"row" \| "column" \| "dense" \| "row dense" \| "column dense"` | `.grid_flow_col()` و`.grid_flow_dense()` | كيف تملأ العناصر غير المحدَّدة الموضع الشبكة. |
| `gridColumn` | `number \| string` | `.col_span(n)` و`.col_span_full()` | موضع العمود: `"1 / 3"` و`"span 2"` أو رقم خط أو اسم خط (`"content-start / content-end"` و`"2 col"` و`"span col"`). |
| `gridColumnStart` | `number \| string` | `.col_start(…)` | خط بداية العمود. |
| `gridColumnEnd` | `number \| string` | `.col_end(…)` | خط نهاية العمود. |
| `gridRow` | `number \| string` | `.row_span(n)` و`.row_span_full()` | موضع الصف، بالصيغة نفسها كما في `gridColumn`. |
| `gridRowStart` | `number \| string` | `.row_start(…)` | خط بداية الصف. |
| `gridRowEnd` | `number \| string` | `.row_end(…)` | خط نهاية الصف. |
| `justifyItems` | `"flex-start" \| "flex-end" \| "start" \| "end" \| "self-start" \| "self-end" \| "center" \| "stretch" \| "baseline" \| "normal"` | | كيف تستقر عناصر الشبكة في مناطقها على امتداد الصف. |
| `justifySelf` | `"auto" \| "flex-start" \| "flex-end" \| "start" \| "end" \| "self-start" \| "self-end" \| "center" \| "stretch" \| "baseline" \| "normal"` | | يتجاوز `justifyItems` لهذا العنصر. |

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

<a id="size"></a>

### الحجم

| المفتاح | النوع | Rust | الوصف |
|---|---|---|---|
| `width` | `DimensionValue` | `.w(…)` و`.w_full()` و`.size(…)` | العرض. |
| `height` | `DimensionValue` | `.h(…)` و`.h_full()` | الارتفاع. |
| `minWidth` | `LengthValue` | `.min_w(…)` | الحد الأدنى للعرض. |
| `minHeight` | `LengthValue` | `.min_h(…)` | الحد الأدنى للارتفاع. |
| `maxWidth` | `LengthValue` | `.max_w(…)` | الحد الأقصى للعرض. |
| `maxHeight` | `LengthValue` | `.max_h(…)` | الحد الأقصى للارتفاع. |
| `aspectRatio` | `number \| "auto" \| "16 / 9"` | `.aspect_ratio(r)` و`.aspect_square()` | العرض مقسومًا على الارتفاع، رقم (`1.5`) أو نسبة CSS (`"16 / 9"`)؛ ويُحسب البعد الناقص من الآخر. `"auto"` لا يضبط شيئًا. |

<a id="margin"></a>

### الهامش الخارجي

تقبل الهوامش `"auto"` (يمتص المساحة الحرة، كما في flexbox) والقيم السالبة. وتقبل المفاتيح الفيزيائية (كلها عدا `marginStart` / `marginEnd`) أيضًا `EnvValue`: `marginBottom: "env(keyboard-inset-height)"` (في Rust `.mb_keyboard()` و`.mt_safe_area()` و...).

| المفتاح | النوع | Rust | الوصف |
|---|---|---|---|
| `margin` | `DimensionValue \| EnvValue` | `.m(…)` و`.m_4()` | الجوانب الأربعة. |
| `marginHorizontal` | `DimensionValue \| EnvValue` | `.mx(…)` | اليسار واليمين. |
| `marginVertical` | `DimensionValue \| EnvValue` | `.my(…)` | الأعلى والأسفل. |
| `marginTop` | `DimensionValue \| EnvValue` | `.mt(…)` | الأعلى. |
| `marginRight` | `DimensionValue \| EnvValue` | `.mr(…)` | اليمين. |
| `marginBottom` | `DimensionValue \| EnvValue` | `.mb(…)` | الأسفل. |
| `marginLeft` | `DimensionValue \| EnvValue` | `.ml(…)` | اليسار. |
| `marginStart` | `DimensionValue` | `.ms(…)` | بداية السطر: اليسار في التخطيطات من اليسار إلى اليمين، واليمين في التخطيطات من اليمين إلى اليسار. |
| `marginEnd` | `DimensionValue` | `.me(…)` | نهاية السطر: الجانب المقابل لـ `marginStart`. |

<a id="padding"></a>

### الحشو

تقبل المفاتيح الفيزيائية (كلها عدا `paddingStart` / `paddingEnd`) أيضًا `EnvValue`: `paddingTop: "env(safe-area-inset-top)"` و`paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)"` (في Rust `.pt_safe_area()` و`.pb_safe_area_plus(px(16.0))` و`.pb_keyboard()` و...). أدنى قيمة للحشو 0.

| المفتاح | النوع | Rust | الوصف |
|---|---|---|---|
| `padding` | `LengthValue \| EnvValue` | `.p(…)` و`.p_4()` | الجوانب الأربعة. |
| `paddingHorizontal` | `LengthValue \| EnvValue` | `.px(…)` | اليسار واليمين. |
| `paddingVertical` | `LengthValue \| EnvValue` | `.py(…)` | الأعلى والأسفل. |
| `paddingTop` | `LengthValue \| EnvValue` | `.pt(…)` | الأعلى. |
| `paddingRight` | `LengthValue \| EnvValue` | `.pr(…)` | اليمين. |
| `paddingBottom` | `LengthValue \| EnvValue` | `.pb(…)` | الأسفل. |
| `paddingLeft` | `LengthValue \| EnvValue` | `.pl(…)` | اليسار. |
| `paddingStart` | `LengthValue` | `.ps(…)` | بداية السطر: اليسار في التخطيطات من اليسار إلى اليمين، واليمين في التخطيطات من اليمين إلى اليسار. |
| `paddingEnd` | `LengthValue` | `.pe(…)` | نهاية السطر: الجانب المقابل لـ `paddingStart`. |

## ViewStyle

كل ما ترسمه الـ view. وتنطبق أيضًا جميع مفاتيح `LayoutStyle`.

<a id="background"></a>

### الخلفية

| المفتاح | النوع | Rust | الوصف |
|---|---|---|---|
| `backgroundColor` | `ColorValue \| AnimatedNode` | `.bg(color)` و`.bind_background(&node)` | لون التعبئة. يقبل لونًا متحركًا أصليًا. |
| `backgroundImage` | `string` | `.bg_linear(angle)` و`.bg_radial()` و`.bg_conic()` مع `.gradient_from` / `_via` / `_to` | تدرجات CSS تُرسم فوق لون الخلفية: `linear-gradient(...)` و`radial-gradient(...)` و`conic-gradient(...)`، ويمكن الجمع بين عدة تدرجات مفصولة بفواصل. |

```rust tabs
view().h(px(120.0)).rounded(px(16.0)).bg_linear(deg(135.0)).gradient_from(rgb(0x6366f1)).gradient_to(rgb(0xec4899))
```

```tsx tabs
<View style={{ height: 120, borderRadius: 16, backgroundImage: "linear-gradient(135deg, #6366f1, #ec4899)" }} />
```
<a id="borders"></a>

### الحدود

| المفتاح | النوع | Rust | الوصف |
|---|---|---|---|
| `borderWidth` | `number` | `.border(w)`, `.border_1()`, `.border_2()` | عرض الجوانب الأربعة. |
| `borderTopWidth` | `number` | `.border_t(w)` | الجانب العلوي. |
| `borderRightWidth` | `number` | `.border_r(w)` | الجانب الأيمن. |
| `borderBottomWidth` | `number` | `.border_b(w)` | الجانب السفلي. |
| `borderLeftWidth` | `number` | `.border_l(w)` | الجانب الأيسر. |
| `borderStartWidth` | `number` | `.border_s(w)` | جانب بداية السطر (الأيسر في التخطيطات من اليسار إلى اليمين، والأيمن في التخطيطات من اليمين إلى اليسار). |
| `borderEndWidth` | `number` | `.border_e(w)` | جانب نهاية السطر. |
| `borderColor` | `ColorValue \| AnimatedNode` | `.border_color(c)`, `.bind_border_color(&node)` | لون الجوانب الأربعة. يقبل لوناً متحركاً أصلياً. |
| `borderTopColor` | `ColorValue` | `.border_t_color(c)` | الجانب العلوي. |
| `borderRightColor` | `ColorValue` | `.border_r_color(c)` | الجانب الأيمن. |
| `borderBottomColor` | `ColorValue` | `.border_b_color(c)` | الجانب السفلي. |
| `borderLeftColor` | `ColorValue` | `.border_l_color(c)` | الجانب الأيسر. |
| `borderStartColor` | `ColorValue` | `.border_s_color(c)` | جانب بداية السطر. |
| `borderEndColor` | `ColorValue` | `.border_e_color(c)` | جانب نهاية السطر. |
| `borderStyle` | `"solid" \| "dashed" \| "dotted" \| "none" \| "hidden"` | `.border_solid()`, `.border_dashed()`, `.border_dotted()`, `.border_none()` | نمط الخط. القيمة الافتراضية `"solid"`. `"none"` و`"hidden"` لا يرسمان حداً ولا يحجزان له مساحة في التخطيط مهما كانت الأعراض، سواء ضُبطت قبلهما أو بعدهما، كما في CSS. |

الجانب الذي ضُبط عرضه ولم يضبط أي شيء لونه يُرسم بلون النص، وهو `currentColor` في CSS: `{ borderWidth: 1, color: "#2563eb" }` يرسم حداً أزرق. وتأخذ المحيطات (outlines) لون النص بالطريقة نفسها.

<a id="corners"></a>

### الزوايا

| المفتاح | النوع | Rust | الوصف |
|---|---|---|---|
| `borderRadius` | `number` | `.rounded(r)`, `.rounded_lg()` | نصف قطر الزوايا الأربع. |
| `borderTopLeftRadius` | `number` | `.rounded_tl(r)` | الزاوية العلوية اليسرى. |
| `borderTopRightRadius` | `number` | `.rounded_tr(r)` | الزاوية العلوية اليمنى. |
| `borderBottomRightRadius` | `number` | `.rounded_br(r)` | الزاوية السفلية اليمنى. |
| `borderBottomLeftRadius` | `number` | `.rounded_bl(r)` | الزاوية السفلية اليسرى. |
| `borderTopStartRadius` | `number` | `.rounded_ss(r)` | الزاوية العلوية على جانب بداية السطر. |
| `borderTopEndRadius` | `number` | `.rounded_se(r)` | الزاوية العلوية على جانب نهاية السطر. |
| `borderBottomStartRadius` | `number` | `.rounded_es(r)` | الزاوية السفلية على جانب بداية السطر. |
| `borderBottomEndRadius` | `number` | `.rounded_ee(r)` | الزاوية السفلية على جانب نهاية السطر. |
| `borderCurve` | `"circular" \| "continuous"` | `.border_curve(curve)` | `"continuous"`: زوايا يتدرج انحناؤها بسلاسة نحو الحواف، مثل أيقونات تطبيقات iOS. وحيث يكون الصندوق صغيراً جداً يعود المنحنى إلى الشكل الدائري، فتبقى الأشكال الكبسولية كبسولية. يعمل على المنصتين. |

<a id="outline"></a>

### المحيط (Outline)

يُرسم المحيط خارج الحد ولا يشغل مساحة في التخطيط.

| المفتاح | النوع | Rust | الوصف |
|---|---|---|---|
| `outlineWidth` | `number` | `.outline(w)` | عرض الخط. |
| `outlineColor` | `ColorValue` | `.outline_color(c)` | لون الخط. القيمة الافتراضية لون النص. |
| `outlineStyle` | `"solid" \| "dashed" \| "dotted" \| "none" \| "hidden"` | `.outline_dashed()`, `.outline_dotted()`, `.outline_none()` | نمط الخط. |
| `outlineOffset` | `number` | `.outline_offset(o)` | المسافة عن حافة الحد؛ القيم السالبة تنقله إلى الداخل. |

<a id="shadows"></a>

### الظلال

يُلقي العنصر ظلالاً باستخدام `boxShadow` من CSS: طبقات متعددة، وظلال ذات انتشار (spread) وظلال داخلية (inset). تحرّكها الانتقالات (`transitionProperty: "boxShadow"`).

| المفتاح | النوع | Rust | الوصف |
|---|---|---|---|
| `boxShadow` | `string \| BoxShadowLayer[]` | `.shadow([BoxShadow { … }])`, `.shadow_md()`, `.shadow_color(c)` | `box-shadow` من CSS: الإزاحات والتمويه والانتشار واللون، وعدة طبقات تفصل بينها فواصل، و`inset` للظلال الداخلية؛ أو طبقاته كأرقام، `[{ x, y, blur, spread, color, inset }]` (`x` و`y` فقط مطلوبان)؛ والطبقة بلا لون تُرسم بلون النص، كما في `currentColor` في CSS. `.shadow_color(c)` يعيد تلوين طبقات إعداد مسبق أو طبقات `.shadow(…)`. |

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
> على Android تحتاج الظلال إلى خلفية: العنصر ذو الخلفية الشفافة (نص بلا شيء خلفه مثلاً) لا يُلقي ظلاً. لاستخدام ظل Material في Android استعمل الخاصية `android={{ elevation }}` بدلاً من النمط.

<a id="opacity-visibility-and-overflow"></a>

### الشفافية والظهور والتجاوز

| المفتاح | النوع | Rust | الوصف |
|---|---|---|---|
| `opacity` | `number \| AnimatedNode` | `.opacity(o)`, `.bind_opacity(&value)` | من 0 (غير مرئي) إلى 1. يقبل قيمة متحركة أصلية. |
| `visibility` | `"visible" \| "hidden" \| "collapse"` | | تحتفظ العناصر المخفية بمساحتها في التخطيط (بخلاف `display: "none"`). |
| `overflow` | `"visible" \| "hidden"` | `.overflow_hidden()` | `"hidden"` يقصّ العناصر الأبناء عند حدود العنصر (وزواياه). |
| `backfaceVisibility` | `"visible" \| "hidden"` | `.backface_hidden()`, `.backface_visible()` | `"hidden"`: غير مرئي أثناء دوران ثلاثي الأبعاد يدير وجهه بعيداً. |
| `verticalAlign` | `"baseline" \| "text-top" \| "text-bottom" \| "middle"` | `.align_baseline()`, `.align_text_top()`, `.align_text_bottom()`, `.align_middle()` | موضع العنصر أو الصورة داخل `<Text>` في سطره، كما في `vertical-align` في CSS: أسفله على خط الأساس (الافتراضي)، أو أعلاه أو أسفله عند أعلى خط النص أو أسفله، أو منتصفه على ارتفاع نصف ارتفاع الحرف x فوق خط الأساس. ويكبر السطر ليتسع له. |

<a id="transforms"></a>

### التحويلات

التحويلات هي تحويلات CSS: الخصائص `translate` و`rotate` و`scale` والخاصية `transform`، وتُركَّب بهذا الترتيب. كل منها خاصية مستقلة، لذا فإن `scale` في نمط ما يستبدل `scale-*` في صنف (class) ويُبقي `rotate-*` الخاص به، وإن `transform` في نمط ما يستبدل دوال التحويل في صنف (`rotate-x-*`, `skew-*`).

| المفتاح | النوع | Rust | الوصف |
|---|---|---|---|
| `translate` | `string \| number \| AnimatedNode \| [x, y]` | `.translate_x(…)`, `.translate_y(…)`; `.bind_translate_x(&v)`, `.bind_translate_y(&v)` | `translate` في CSS: x ثم y (`"10px 20px"`؛ نسب مئوية من حجم العنصر نفسه، `"-50% 0"`). الرقم يعني نقاطاً على المحور x. `[x, y]` يقبل رقماً أو سلسلة نصية (`"50%"`, `"10px"`) أو قيمة متحركة لكل محور؛ والقيمة المتحركة وحدها تحرّكه على المحور x. |
| `rotate` | `string \| number \| AnimatedNode` | `.rotate(deg(…))`; `.bind_rotate(&v)` | `rotate` في CSS: `"45deg"`, `"0.5turn"`، أو حول محور، `"x 90deg"`. الرقم، وكذلك القيمة المتحركة، يعني درجات حول المحور z باتجاه عقارب الساعة. |
| `scale` | `string \| number \| AnimatedNode \| [x, y]` | `.scale(f)`, `.scale_x(f)`, `.scale_y(f)`; `.bind_scale(&v)` | `scale` في CSS: `1.5`, `"150%"`، x وy (`"1 2"`). القيمة المتحركة تكبّر المحورين معاً؛ `[x, y]` يقبل رقماً أو قيمة متحركة لكل محور. |
| `transform` | `string \| TransformStep[]` | `.rotate_x(…)`, `.rotate_y(…)`, `.skew_x(…)`, `.skew_y(…)`, `.transform_none()`; الخطوات المتحركة: `.bind_transform(kind, &v)`, `.bind_motion(&m)` (بعد كل تحويلات النمط) | `transform` في CSS: `"translateX(10px) rotate(45deg) scale(1.5)"`، أو `"none"`. الدوال: `translate()`, `translateX()`, `translateY()`, `scale()`, `scaleX()`, `scaleY()`, `rotate()` / `rotateZ()`, `rotateX()`, `rotateY()`, `skew()`, `skewX()`, `skewY()`, `perspective()`. الأطوال تقبل `px` (والإزاحات تقبل أيضاً `%`، من حجم العنصر نفسه)، والزوايا `deg` أو `rad` أو `turn`. أو قائمة من الخطوات يمكن أن تكون مقاديرها قيماً متحركة: ما لا تستطيع السلسلة النصية حمله، مثل دوران ثلاثي الأبعاد متحرك (`[{ perspective: 800 }, { rotateY: angle }]`)، وقنوات الحركة (`m.transform`). قيمة `transform` في النمط تكون إحدى الصيغتين لا كلتيهما، لذا فإن المنظور (perspective) الذي يسبق خطوات متحركة هو خطوة من القائمة. تُطبَّق بعد `translate` و`rotate` و`scale`. |
| `transformOrigin` | `string \| (number \| string)[]` | `.transform_origin(…)`, `.origin_top_left()`, ... | النقطة التي تعمل التحويلات حولها: كلمات مفتاحية ونسب مئوية وأطوال (`"top left"`, `"50% 0"`, `[10, 20]`). القيمة الافتراضية المركز. |

`TransformStep` هي كائن بمفتاح واحد، وتُطبَّق بترتيب القائمة:

| الخطوة | القيمة | حركة أصلية |
|---|---|---|
| `translateX`, `translateY` | `number` (نقاط) | نعم |
| `scale`, `scaleX`, `scaleY` | `number` (معامل) | نعم |
| `rotate`, `rotateZ`, `rotateX`, `rotateY` | `number` (درجات) أو `string` (`"45deg"`, `"0.5rad"`) | نعم |
| `skewX`, `skewY` | `number` (درجات) أو `string` | لا |
| `perspective` | `number` (نقاط) | لا |

```rust tabs
view().perspective(px(600.0)).child(view().rotate_y(deg(20.0)).scale(0.95))
```

```tsx tabs
<View style={{ transform: "perspective(600px) rotateY(20deg) scale(0.95)" }} />
```

تقود القيمة المتحركة الخصائص `translate` و`rotate` و`scale` مباشرة، وكذلك خطوات قائمة `transform`:

```tsx
const x = createAnimatedValue(0);
const angle = createAnimatedValue(0);

<View style={{ translate: [x, 0], rotate: angle }} />
<View style={{ transform: [{ perspective: 800 }, { rotateY: angle }] }} />
```

> [!NOTE]
> لا يرسم Android الإمالة (skew): `skew()` و`skewX()` و`skewY()` تترك العنصر دون إمالة هناك.

<a id="filters-and-blending"></a>

### المرشحات والمزج

| المفتاح | النوع | Rust | الوصف |
|---|---|---|---|
| `filter` | `string` | `.blur(r)`, `.brightness(…)`, `.contrast(…)`, `.grayscale(…)`, `.hue_rotate(…)`, `.invert(…)`, `.saturate(…)`, `.sepia(…)` | مرشحات CSS للعنصر ومحتواه: `brightness()`, `contrast()`, `grayscale()`, `hue-rotate()`, `invert()`, `saturate()`, `sepia()`, `opacity()`, `blur()`, `drop-shadow()`. |
| `backdropFilter` | `string` | `.backdrop_blur(r)`, `.backdrop_brightness(…)`, ... | مرشحات CSS لما خلف العنصر، مثل `"blur(10px)"` للزجاج المصنفر. |
| `maskImage` | `string` | | تدرّج CSS تحدد شفافيته (alpha) مقدار ما يُرسم من العنصر، كاملاً حيث يكون معتماً ولا شيء حيث يكون شفافاً: `linear-gradient(...)`, `radial-gradient(...)`, `conic-gradient(...)`. يقنّع كل ما يرسمه العنصر، بما فيه مرشح الخلفية. |
| `glassEffect` | `"none" \| "regular" \| "clear"` | `.glass_effect(GlassEffect::Regular)` | Liquid Glass خلف محتوى العنصر على iOS 26 وmacOS 26 وما بعدهما. `"regular"` يستخدم المادة القياسية؛ و`"clear"` يأخذ لوناً أقل من الخلفية. `"none"` هو الافتراضي. اقرنه مع `backdropFilter` للحصول على التمويه الظاهر في إصدارات iOS الأقدم وعلى المنصات الأخرى. |
| `mixBlendMode` | `"normal" \| "multiply" \| "screen" \| "overlay" \| "darken" \| "lighten" \| "color-dodge" \| "color-burn" \| "hard-light" \| "soft-light" \| "difference" \| "exclusion" \| "hue" \| "saturation" \| "color" \| "luminosity" \| "plus-darker" \| "plus-lighter"` | `.mix_blend_mode(mode)` | كيفية مزج العنصر مع ما خلفه. |

> [!WARNING]
> حدود المنصات:
> - يطبّق iOS فقط `opacity()`، و`brightness()` حتى 1، و`drop-shadow()` على العناصر. `<Image>` يقبل كل مرشحات الألوان و`blur()`، وتُطبَّق أثناء فك ترميز الصورة.
> - تمويه `backdropFilter` في iOS يستخدم مادة نظام بنسبة جزئية، وهو تقريب لنصف القطر الدقيق.
> - يحتاج Android إلى API 31 لـ `blur()` و`drop-shadow()` و`backdropFilter`؛ وما دون ذلك تُطبَّق مرشحات الألوان فقط. وتحتاج أوضاع المزج إلى API 29.

<a id="transitions"></a>

### الانتقالات

عندما تتغير خاصية لها انتقال (من نمط جديد أو صنف أو متغير مثل `active:`)، تحرّكها المنصة أصلياً. لا يُنفَّذ أي JS أثناء الحركة.

| المفتاح | النوع | Rust | الوصف |
|---|---|---|---|
| `transitionProperty` | `string` | `.transition()`, `.transition_all()`, `.transition_colors()`, `.transition_opacity()`, `.transition_shadow()`, `.transition_transform()`, `.transition_none()` | الخصائص التي تتحرك، مفصولة بفواصل: `"all"`, `"colors"` (`color`, `backgroundColor`, `borderColor`, ...), `"opacity"`, `"transform"` (كل خصائص التحويل), `"boxShadow"`, `"borderRadius"`, `"borderWidth"`، أو `"none"`. |
| `transitionDuration` | `number \| "${number}ms" \| "${number}s"` | `.duration(ms)` | بالميلي ثانية كرقم، أو `"150ms"` / `"0.2s"`. |
| `transitionDelay` | `number \| "${number}ms" \| "${number}s"` | `.delay(ms)` | التأخير قبل بدء الانتقال. |
| `transitionTimingFunction` | `"linear" \| "ease" \| "ease-in" \| "ease-out" \| "ease-in-out" \| "cubic-bezier(...)"` | `.ease_linear()`, `.ease_in()`, `.ease_out()`, `.ease_in_out()`, `.ease_bezier(…)` | منحنى التسارع (easing). |

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

### الحركات بالإطارات المفتاحية

حركات إطارات مفتاحية مدمجة، تعمل أصلياً (`animate-*` في Tailwind).

| المفتاح | النوع | Rust | الوصف |
|---|---|---|---|
| `animationName` | `"none" \| "spin" \| "ping" \| "pulse" \| "bounce"` | `.animate_spin()`, `.animate_ping()`, `.animate_pulse()`, `.animate_bounce()`, `.animate_none()` | الحركة. |
| `animationDuration` | `number \| "${number}ms" \| "${number}s"` | `.animation(KeyframeAnimation { … })` | مدة تكرار واحد. |
| `animationDelay` | `number \| "${number}ms" \| "${number}s"` | `.animation(KeyframeAnimation { … })` | التأخير قبل التكرار الأول. |
| `animationTimingFunction` | `"linear" \| "ease" \| "ease-in" \| "ease-out" \| "ease-in-out" \| "cubic-bezier(...)"` | `.animation(KeyframeAnimation { … })` | منحنى التسارع (easing). |
| `animationIterationCount` | `number \| "infinite"` | `.animation(KeyframeAnimation { … })` | عدد مرات التشغيل. |

للحركات التي تقودها القيم أو الإيماءات أو النوابض، استخدم [واجهة الحركة في `nsh`](./nsh.md#animation) بدلاً من ذلك.

<a id="pointer-and-selection"></a>

### المؤشر والتحديد

| المفتاح | النوع | Rust | الوصف |
|---|---|---|---|
| `cursor` | `"auto" \| "default" \| "pointer" \| "text" \| "grab" \| "grabbing" \| "not-allowed" \| ...` (كل الكلمات المفتاحية للمؤشر في CSS، و`"none"`) | `.cursor(Cursor)`, `.cursor_pointer()` | شكل المؤشر فوق العنصر، لأجهزة التأشير (لوحات اللمس في iPad وMac Catalyst وأجهزة سطح المكتب). الكلمات المفتاحية القطرية لتغيير الحجم تحتفظ بمحورها: `nwse-resize` / `nw-resize` / `se-resize` (`Cursor::NwseResize`) و`nesw-resize` / `ne-resize` / `sw-resize` (`Cursor::NeswResize`). تعرض Windows وLinux وAndroid والويب وGPUI مؤشرات قطرية؛ ويستخدمها AppKit على macOS 15 وما بعده، مع يد مفتوحة على macOS 14. ويستخدم UIKit تأثيرات المؤشر على iPad وMac Catalyst. |
| `pointerEvents` | `"auto" \| "none" \| "box-none" \| "box-only"` | `.pointer_events(PointerEvents::BoxNone)` | اللمسات التي يستقبلها العنصر والعناصر داخله (`pointer-events-none`, `pointer-events-auto`). `"none"`: لا شيء، وكذلك للعناصر داخله ما لم يضبط أحدها `"auto"`، وهي موروثة كما في CSS. `"box-none"`: لا شيء للعنصر نفسه، وتستقبل العناصر داخله لمساتها؛ `"box-only"`: يستقبلها العنصر نفسه ولا تستقبل العناصر داخله شيئاً (كلاهما من React Native، للعنصر نفسه فقط). القيمة الافتراضية `"auto"`. راجع [اللمس والإيماءات](../docs/touch-and-gestures.md#pointerevents). |
| `userSelect` | `"auto" \| "none" \| "text"` | `.select_text()`, `.select_none()` | هل يمكن تحديد `<Text>` ونسخه (`"text"`, `select-text`) أم لا (`"none"`, `select-none`)؛ وقيمة العنصر تصل إلى النصوص داخله التي لا تضبط شيئاً. `"auto"` (`select-auto`)، وهي الافتراضية، تترك القرار للعنصر المحيط، وإلا فللمنصة. راجع [النص](../elements/text.md). |

<a id="svg-paint"></a>

### طلاء SVG

خصائص الطلاء في CSS لأشكال SVG، يقبلها أي عنصر وترثها العناصر داخله، كما في المتصفح.
وهي تطلي ما ترسمه مكونات Rust على اللوحات (canvases).

| المفتاح | النوع | Rust | الوصف |
|---|---|---|---|
| `fill` | `"none" \| "currentColor" \| ColorValue` | `.fill_color(c)`, `.fill_none()`, `.fill_current()` | ما تُملأ به الأشكال؛ `currentColor` هو لون نص العنصر. |
| `stroke` | `"none" \| "currentColor" \| ColorValue` | `.stroke_color(c)`, `.stroke_none()`, `.stroke_current()` | ما تُطلى به خطوط حدود الأشكال. |
| `strokeWidth` | `number \| string` | `.stroke_width(w)` | عرض تلك الخطوط، وهو طول (1 افتراضياً). |
| `strokeDasharray` | `number \| string` | — | الشرطات والفراغات على طول تلك الخطوط: أطوال تفصل بينها مسافات أو فواصل (`"4 2"`)، والقائمة ذات العدد الفردي تُكرَّر، أو `"none"`. |

## TextStyle

تُطبَّق أنماط النص على `<Text>` و`<Input>`. وهي أيضاً موروثة، كما في CSS: خصائص النص المضبوطة على عنصر تنتقل إلى النصوص والحقول داخله، وترث امتدادات `<Text>` المتداخلة من نصها الأب. وتنطبق أيضاً كل مفاتيح `ViewStyle`. راجع [النص](../docs/text.md).

<a id="font"></a>

### الخط

| المفتاح | النوع | Rust | الوصف |
|---|---|---|---|
| `color` | `ColorValue \| AnimatedNode` | `.text_color(c)`, `.bind_color(&node)` | لون النص. يقبل لوناً متحركاً أصلياً. وهو أيضاً لون الحدود والمحيطات التي لا تضبط لوناً. |
| `fontSize` | `number` | `.text_size(s)`, `.text_sm()`, `.text_lg()`, ... | الحجم بالنقاط. |
| `fontWeight` | `"normal" \| "bold" \| number \| "${number}"` | `.font_weight(FontWeight::SEMIBOLD)` | `"normal"` (400)، `"bold"` (700) أو 100–900. |
| `fontFamily` | `string` | `.font_family(name)` | عائلة خطوط النظام، أو الاسم الذي يُقيَّم إليه خط مستورد (`import Inter from "./Inter.ttf"`)، أو قائمة بها، الأفضل أولاً (`"Brand, 'Noto Sans SC', sans-serif"`). راجع [الخطوط](../docs/fonts.md#fallback-lists). |
| `fontStyle` | `"normal" \| "italic"` | `.italic()` | مائل. |
| `fontVariant` | `FontVariantName[] \| string` | `.small_caps()`, `.oldstyle_nums()`, `.lining_nums()`, `.tabular_nums()`, `.proportional_nums()` | أشكال الأرقام والحروف في OpenType، قائمة (`["tabular-nums"]`) أو أسماء CSS مفصولة بمسافات (`"tabular-nums small-caps"`). `tabular-nums` يُبقي الأرقام بعرض واحد، وهو مفيد للعدّادات والمؤقتات. |
<a id="spacing-and-alignment"></a>

### التباعد والمحاذاة

| Key | Type | Rust | Description |
|---|---|---|---|
| `lineHeight` | `number` | `.line_height(h)` | ارتفاع السطر بالنقاط. |
| `letterSpacing` | `number` | `.letter_spacing(s)` | مسافة إضافية بين الأحرف، بالنقاط. |
| `textAlign` | `"auto" \| "left" \| "center" \| "right" \| "justify" \| "start" \| "end"` | `.text_left()`، `.text_center()`، `.text_right()`، `.text_justify()` | المحاذاة الأفقية. تحتفظ `"left"` و`"right"` بجانبيهما في التخطيطات من اليمين إلى اليسار، بينما تتبع `"start"` و`"end"` الاتجاه. |
| `writingDirection` | `"auto" \| "ltr" \| "rtl"` | `.writing_direction(d)` | الاتجاه الأساسي للنص؛ و`"auto"` يأخذه من المحتوى. |
| `textTransform` | `"none" \| "uppercase" \| "lowercase" \| "capitalize"` | `.uppercase()`، `.lowercase()`، `.capitalize()`، `.normal_case()` | تحويل حالة الأحرف. |

> [!TIP]
> تضبط الفئتان `leading-*` و`tracking-*` في Tailwind ارتفاع السطر كمضاعفات لحجم الخط، وتباعد الأحرف بوحدة `em`، لذا فهي تتناسب مع أحجام `text-*`.

<a id="lines-and-overflow"></a>

### الأسطر والفائض

| Key | Type | Rust | Description |
|---|---|---|---|
| `numberOfLines` | `number` | `.number_of_lines(n)`، `.truncate()` | أقصى عدد من الأسطر يعرضه `<Text>` (`line-clamp` و`line-clamp-*` في CSS)؛ أما `0` (`line-clamp-none`)، وهي القيمة الافتراضية، فتعرضها كلها. `truncate` هو سطر واحد يُقطع بعلامة حذف. |
| `textOverflow` | `"ellipsis" \| "clip" \| "ellipsis-start" \| "ellipsis-middle"` | `.text_overflow(EllipsizeMode::Middle)` | كيفية قطع `<Text>` المقيّد: بعلامة حذف في نهايته (`"ellipsis"`، `text-ellipsis`، وهي القيمة الافتراضية)، أو بالاقتصاص (`"clip"`، `text-clip`)، أو بعلامة الحذف في بدايته أو في منتصفه (لمسارات الملفات). |

<a id="decoration"></a>

### الزخرفة

| Key | Type | Rust | Description |
|---|---|---|---|
| `textDecorationLine` | `"none" \| "underline" \| "line-through" \| "underline line-through"` | `.underline()`، `.line_through()`، `.no_underline()` | خطوط تُرسم مع النص. |
| `textDecorationColor` | `ColorValue` | `.text_decoration_color(c)` | لون الخطوط (افتراضيًا لون النص). |
| `textDecorationStyle` | `"solid" \| "double" \| "dotted" \| "dashed" \| "wavy"` | `.text_decoration_solid()`، `_double()`، `_dotted()`، `_dashed()`، `_wavy()` | نمط الخط. |
| `textDecorationThickness` | `number \| "auto" \| "from-font"` | `.text_decoration_thickness(t)` | سماكة الخط. |
| `textUnderlineOffset` | `number \| "auto"` | `.underline_offset(o)` | بُعد الخط السفلي عن خط الأساس. |

<a id="placeholder-caret-and-selection"></a>

### النص البديل والمؤشر والتحديد

`placeholderColor` و`caretColor` تنتميان إلى `InputStyle`، وهو نمط `<Input>`؛ أما `selectionColor` فتنتمي إلى `TextStyle`، لأن النصوص القابلة للتحديد تأخذه أيضًا.

| Key | Type | Rust | Description |
|---|---|---|---|
| `placeholderColor` | `ColorValue` | `.placeholder_color(c)` of an input | لون النص البديل في `<Input>` (`placeholder:text-*`). |
| `textAlignVertical` | `"auto" \| "top" \| "center" \| "bottom"` | | موضع النص الأقصر من صندوقه (`<Text>` له ارتفاع). |
| `selectionColor` | `ColorValue` | `.selection_color(c)` of an input or a text | تمييز التحديد ومقابضه في `<Input>` أو في `<Text>` القابل للتحديد (`selection:bg-*`)؛ ويكون لون التمييز الخاص بالمنصة افتراضيًا. وعلى iOS يحدد أيضًا مؤشر الإدخال، ما لم يُضبط `caretColor` (إذ يلوّن UIKit كليهما بلون واحد). |
| `caretColor` | `ColorValue` | `.caret_color(c)` of an input | مؤشر `<Input>` (`caret-*`)؛ والقيمة الافتراضية للمنصة عند عدم الضبط. |

<a id="text-shadow"></a>

### ظل النص

| Key | Type | Rust | Description |
|---|---|---|---|
| `textShadow` | `string \| TextShadowLayer[]` | `.text_shadow([TextShadow { … }])`، `.text_shadow_sm()`، `.text_shadow_color(c)` | `text-shadow` في CSS: الإزاحات والتمويه واللون (`"0 1px 2px rgb(0 0 0 / 0.3)"`)، أو طبقاته كأرقام، `[{ x, y, blur, color }]`؛ وعند وجود عدة طبقات تُرسم الطبقة الأوسع؛ والطبقة التي بلا لون تُرسم بلون النص؛ `"none"`. |

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
> لا يرسم iOS تدرجات لونية (`backgroundImage`) ولا ظلال صناديق داخلية على `<Text>`.

## ImageStyle

جميع مفاتيح `ViewStyle`، بالإضافة إلى:

| Key | Type | Rust | Description |
|---|---|---|---|
| `tintColor` | `ColorValue` | `.tint_color(c)` of an image | يعيد تلوين صورة قالبية (يأخذ كل بكسل معتم هذا اللون)، للأيقونات أحادية اللون. |
| `objectFit` | `"fill" \| "contain" \| "cover" \| "none" \| "scale-down"` | `.object_fit(ResizeMode::Contain)` | `object-fit` في CSS: كيفية احتواء الصورة أو الفيديو داخل صندوقه. `"cover"` يملؤه ويقتص، `"contain"` يلائمه داخله، `"fill"` يمدده، `"none"` يحافظ على الحجم الطبيعي، و`"scale-down"` هو `"none"` أو `"contain"`، أيهما أصغر. تغطي الصور صندوقها افتراضيًا، أما الفيديو فيُحتوى داخله. |
| `objectPosition` | `string` | `.object_position(p)`، `.object_top()`، ... of an image | موضع الصورة في صندوقها بعد أن يحدد `objectFit` حجمها، كما في `object-position` في CSS: كلمات مفتاحية ونسب مئوية وأطوال (`"top"`، `"left bottom"`، `"25% 75%"`، `"right 10px bottom 20%"`). وتُقتص الصورة التي تغطي صندوقها حوله. القيمة الافتراضية هي المنتصف. |

`objectFit` ينطبق على `<Video>` أيضًا؛ راجع [image](../elements/image.md) و[video](../elements/video.md).

<a id="props-that-look-like-styles"></a>

## خصائص تبدو كأنماط

ظل Material في Android هو خاصية خاصة بالمنصة، تُضبط بجانب النمط:

| Setting | Prop | Rust | Class |
|---|---|---|---|
| Material shadow (Android) | `android={{ elevation }}` | `.elevation(e)` | |

<a id="related"></a>

## ذو صلة

- [Styling](../docs/styling.md): `style` و`class` والوراثة وأسبقية التطبيق.
- [Tailwind reference](./tailwind-reference.md): كل الأدوات المساعدة والمتغيرات المدعومة.
- [Layout](../docs/layout.md): flexbox وgrid عمليًا.
- [view](../elements/view.md) و[text](../elements/text.md) و[image](../elements/image.md): العناصر التي تنطبق عليها هذه الأنماط.

`width` و`height` و`flexBasis` تقبل أيضًا `"min-content"` و`"max-content"` و`"fit-content"`، ويحسبها Taffy.
