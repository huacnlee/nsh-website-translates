---
title: "مرجع Tailwind"
description: "كل أدوات Tailwind المساعدة (utilities) ومتغيّراتها (variants) التي يحلّها NSH أصليًا، وصيغة القيم العشوائية، وكيفية توسيع السمة (theme) في nsh.json."
order: 17
source_hash: 11bee6a70fb79c0f
---

# مرجع Tailwind

يقبل كل عنصر فئات Tailwind CSS في الخاصية `class` (والفئات الشرطية في `classList`). يحلّلها NSH في Rust بالاستناد إلى السمة الافتراضية في Tailwind 4: لا تمرّر JS سوى السلسلة النصية، وتُحلَّل كل سلسلة مختلفة مرة واحدة وتُخزَّن مؤقتًا، وتُعاد معالجة المتغيّرات مثل `dark:` أو `active:` أصليًا عند تغيّر المظهر أو حجم النافذة أو حالة الضغط، دون تشغيل أي JS.

تضبط كل فئة بالضبط ما يولّده Tailwind CSS 4 لها، وبالمعنى نفسه كما في المتصفح. تسرد هذه الصفحة ما هو مدعوم. للمقدمة راجع [Tailwind](../docs/tailwind.md)؛ ولمفاتيح الأنماط التي تضبطها الفئات راجع [مرجع الأنماط](./style-reference.md).

لا تقبل مكوّنات Rust سلاسل فئات: فهي تنسّق العناصر بالدوال المضبوطة الأنواع في `Styled` (`nsh_core::prelude`)، المسمّاة على غرار هذه الفئات والتي تُحلّ إلى القيم نفسها، بما فيها مقاييس Tailwind الافتراضية (`px-4` هو `.px_4()`، `rounded-2xl` `.rounded_2xl()`، `shadow-md` `.shadow_md()`، `bg-linear-to-br` `.bg_linear_to_br()`). الألوان قيم: ألوان السمة، أو لوحة Tailwind على هيئة `nsh_core::element::palette` (`ZINC.shade(800)` هو `zinc-800`). المتغيّرات دوال تأخذ closure من الأنماط: `.active(|s| …)`، `.hover(…)`، `.focus(…)`، `.disabled_style(…)`، `.dark(…)`، `.group_active(…)`، و`.style_when(condition, …)` لبقية المتغيّرات. يسمّي [مرجع الأنماط](./style-reference.md) دالة كل مفتاح نمط.

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

## كيفية دمج الفئات

- **الأحدث يفوز.** بين الفئات ضمن مستوى المتغيّر نفسه، تفوز الفئة الأخيرة في السلسلة: `"p-4 p-2"` يساوي `p-2`. يمكن لمكوّن أن يأخذ الخاصية `class` ويلحقها بفئاته الخاصة دون `tailwind-merge`.
- **تُطبَّق المتغيّرات بعد الفئات العادية**، وفق ترتيب المتغيّرات في Tailwind: `group-*:` (حسب حالتها، ثم حسب اسم المجموعة)، `selection:`، `placeholder:`، الموضع (`first:` ...)، `checked:`، `indeterminate:`، `selected:`، `focus-within:`، `hover:`، `focus:`، `focus-visible:`، `active:`، `enabled:`، `disabled:`، `aria-busy:`، `aria-checked:`، `aria-expanded:`، `aria-pressed:`، `aria-selected:`، `data-*:` (حسب الاسم)، الحركة، نقاط التوقف `max-*:` من الأوسع أولًا، ثم نقاط التوقف تصاعديًا، ثم اتجاه الشاشة، ثم اتجاه الكتابة، ثم `dark:`، ثم المنصة. يحسم أعلى متغيّر في الفئة الأمر أولًا، ثم الذي يليه، ويأتي متغيّر إضافي لاحقًا (`dark:hover:` بعد `dark:`)، كما يرتّبها Tailwind. لذا يكون `"active:bg-red-500 bg-blue-500"` أحمر أثناء الضغط.
- **يتفوّق `style` على الفئات.** يُطبَّق `style` المضمَّن فوق الفئات المحلولة. مفتاح النمط هو خاصية CSS التي تحمل اسمه، وهي التي تضبطها الفئات، فيستبدل تلك الخاصية دون غيرها: `style={{ paddingLeft: 8 }}` يتغلّب على `pl-4` ويُبقي `pr-4`. وتتفوّق الفئة ذات الأهمية (`!p-4` أو `p-4!`) على النمط المضمَّن أيضًا.
- **تُورَّث أنماط النص.** تنتقل فئات النص على view (`text-white`، `font-bold`، `text-center`، ...) إلى عناصر `<Text>` و`<Input>` داخله، كما في CSS.
- **يتبع display قواعد CSS.** يجعل `flex` و`inline-flex` العنصر صفًا ما لم تنص فئة اتجاه على غير ذلك، أيًّا كان موضعها في السلسلة (`flex-col flex` عمود). ويكون `display: "flex"` في النمط صفًا بالطريقة نفسها؛ أما الـ views التي لا تضبط display فتحتفظ بالافتراضي في NSH وهو العمود.

<a id="units-and-the-theme"></a>

## الوحدات والسمة

الأطوال بالنقاط (`1` = نقطة واحدة على iOS، وdp واحد على Android). يساوي `1rem` في Tailwind ‏16 نقطة، فتطابق السمة الويب بالكثافة نفسها: خطوة التباعد الواحدة 4 نقاط (`p-4` = 16 نقطة)، و`text-base` يساوي 16 نقطة.

<a id="spacing-values"></a>

### قيم التباعد

الفئات التي تأخذ قيمة تباعد (padding وmargin وgap وinset وwidth وheight، `basis`، `translate`، `leading`) تقبل:

| القيمة | مثال | النتيجة |
|---|---|---|
| الخطوات (يُسمح بأرباع الخطوات) | `p-4`، `gap-1.5`، `m-0.25` | الخطوة × 4 نقاط |
| `px` | `p-px`، `-mt-px` | نقطة واحدة |
| `0` | `m-0` | 0 |
| كسر (inset وwidth وheight، `basis`، `translate`) | `w-1/2`، `left-1/3` | نسبة مئوية من العنصر الأب |
| `full` (بالمعنى نفسه) | `w-full`، `inset-full` | 100% |
| `auto` (margin وinset وwidth وheight وbasis) | `mx-auto`، `w-auto` | `"auto"` |
| مخصّصة | `p-[13px]`، `w-[42%]`، `mt-[1.5rem]` | الطول المعطى |

تقبل margin وinset و`translate` و`rotate` و`skew` و`scale` و`z` و`hue-rotate` و`tracking` و`underline-offset` و`outline-offset` وخطوط الشبكة وزوايا التدرّج الرمز `-` في البداية للقيم السالبة: `-mt-2`، `-translate-x-1/2`، `-rotate-6`. ليس في Tailwind صيغة سالبة لغيرها (`-p-4`، `-gap-2`، `-w-4`)، وكذلك NSH.

<a id="colors"></a>

### الألوان

لوحة Tailwind 4 كاملة مضمّنة: `red`، `orange`، `amber`، `yellow`، `lime`، `green`، `emerald`، `teal`، `cyan`، `sky`، `blue`، `indigo`، `violet`، `purple`، `fuchsia`، `pink`، `rose`، `slate`، `gray`، `zinc`، `neutral`، `stone`، `mauve`، `olive`، `mist`، `taupe`، كل منها بدرجات `50`، `100`–`900`، `950`؛ إضافةً إلى `black` و`white` و`transparent`. تأتي ألوانك الخاصة من `nsh.json` (راجع [تخصيص السمة](#theme-customization)).

تقبل كل فئة لون:

| الصيغة | مثال |
|---|---|
| لون من السمة | `bg-sky-500`، `text-brand` |
| معدّل شفافية (نسبة مئوية) | `bg-black/50`، `ring-black/5` |
| شفافية مخصّصة | `text-black/[0.35]` |
| لون مخصّص | `bg-[#0ea5e9]`، `border-[rgb(0_0_0_/_0.1)]`، `text-[oklch(70%_0.2_50)]` |
| لون مخصّص مع معدّل | `bg-[rgb(0_0_255)]/25` |

ليست `currentColor` و`inherit` قيمًا لونية. كما في المتصفح، تُرسم الحدود (border) أو الإطار الخارجي (outline) أو الحلقة (ring) التي لا تحمل فئة لون بلون نص العنصر، سواء كان خاصًّا به أو موروثًا (`<View class="text-white"><View class="border ring-2" /></View>` يرسم الاثنين باللون الأبيض)، وكذلك الحدّ الذي تضبط الخاصية `style` عرضه دون لون.

<a id="arbitrary-values"></a>

## القيم المخصّصة

تمرّر الأقواس المربعة قيمة لا تحتويها السمة: `w-[37px]`، `grid-cols-[200px_1fr]`، `bg-[linear-gradient(45deg,red,blue)]`.

- يمثّل `_` مسافة (`grid-cols-[1fr_2fr]`)؛ اكتب `\_` للحصول على شرطة سفلية حرفية.
- الأطوال: رقم مجرد أو `px` (نقاط)، `pt` (4/3 نقطة، كما في CSS)، `rem` (16 نقطة)، و`%` حيث تكون النسب المئوية ذات معنى.
- الزوايا (`rotate-[...]`، `hue-rotate-[...]`، `bg-linear-[...]`): `deg`، `rad`، `grad`، `turn`.
- الأزمنة (`duration-[...]`، `delay-[...]`): `ms` أو `s`؛ والرقم المجرد يعني ميلي ثانية.
- تحسم تلميحات النوع القيم الملتبسة: `text-[length:22px]` حجم، `text-[color:#333]` لون؛ وكذلك `border-[length:3px]`.

خصائص CSS المخصّصة (`[mask-type:luminance]`) غير مدعومة.

<a id="layout"></a>

## التخطيط

| الفئة | تضبط |
|---|---|
| `flex`، `inline-flex` | `display: "flex"`، وصفًّا ما لم توجد فئة اتجاه |
| `grid`، `inline-grid` | `display: "grid"` |
| `block`، `flow-root` | تخطيط block أو سياق تنسيق block مستقل |
| `box-border`، `box-content` | تشمل الأبعاد الحدود والحشو، أو المحتوى وحده |
| `w/h/size-min`، `w/h/size-max`، `w/h/size-fit` | أحجام Taffy الجوهرية: `min-content`، `max-content`، `fit-content` |
| `inline`، `inline-block` | `display: "block"`: ما يحسبه المتصفح لهما داخل عنصر أب من نوع flex أو grid |
| `hidden` | `display: "none"` |
| `relative`، `absolute` | `position` |
| `static` | `position: "static"`: داخل التدفق، وتُتجاهل إزاحاته؛ ويستخدم الأحفاد ذوو الموضع المطلق أقرب سلف محدَّد الموضع |
| `sticky` | `position: "sticky"`: داخل التدفق، يلتصق بـ`top` (`left` في scroll view أفقي) ضمن scroll view المحيط به ما دام عنصره الأب ظاهرًا |
| `fixed` | `position: "fixed"`: عنصر يُخطَّط ضمن صندوق root view الخاص به (النافذة أو modal الخاصة به) فوق أبناء ذلك الـ root view، ويبقى في مكانه بينما يتمرّر ما حوله |
| `inset-<n>`، `inset-x-<n>`، `inset-y-<n>` | `top` / `right` / `bottom` / `left` |
| `top-<n>`، `right-<n>`، `bottom-<n>`، `left-<n>` | الإزاحة المقابلة |
| `start-<n>`، `end-<n>` | `start` / `end` (يراعي الاتجاه) |
| `z-<n>`، `z-auto`، `z-[<n>]` | `zIndex` (`z-auto` يساوي 0) |
| `visible` | `visibility: "visible"` |
| `invisible`، `collapse` | `visibility: "hidden"` (يحتفظ بمساحته) |
| `overflow-hidden`، `overflow-clip`، `overflow-x-hidden`، `overflow-y-hidden` | `overflow: "hidden"` |
| `overflow-visible` | `overflow: "visible"` |
| `aspect-square`، `aspect-video`، `aspect-<a>/<b>`، `aspect-[<a>/<b>]`، `aspect-auto` | `aspectRatio` (1، 16/9، a/b، بلا) |

التمرير عنصر وليس فئة: `overflow-auto` و`overflow-scroll` غير مدعومين؛ استخدم [scroll](../elements/scroll.md).

<a id="flexbox-and-grid"></a>

## Flexbox وgrid

| الفئة | تضبط |
|---|---|
| `flex-row`، `flex-row-reverse`، `flex-col`، `flex-col-reverse` | `flexDirection` |
| `flex-wrap`، `flex-wrap-reverse`، `flex-nowrap` | `flexWrap` |
| `flex-1` | grow 1 وshrink 1 وbasis 0 |
| `flex-<n>` | grow n وshrink 1 وbasis 0 |
| `flex-auto` | grow 1 وshrink 1 وbasis auto |
| `flex-initial` | grow 0 وshrink 1 وbasis auto |
| `flex-none` | grow 0 وshrink 0 وbasis auto |
| `flex-[<grow>]`، `flex-[<grow>_<shrink>_<basis>]` | الصيغة المختصرة في CSS: `flex-[2]`، `flex-[3_0_50%]` |
| `grow`، `grow-<n>`، `grow-[<n>]` | `flexGrow` (بدون قيمة: 1) |
| `shrink`، `shrink-<n>`، `shrink-[<n>]` | `flexShrink` (بدون قيمة: 1) |
| `basis-<n>` | `flexBasis` (تباعد، كسر، `full`، `auto`، مخصّص) |
| `justify-start`، `justify-end`، `justify-center`، `justify-between`، `justify-around`، `justify-evenly`، `justify-stretch`، `justify-normal` | `justifyContent` |
| `items-start`، `items-end`، `items-center`، `items-baseline`، `items-stretch` | `alignItems` |
| `self-auto`، `self-start`، `self-end`، `self-center`، `self-stretch`، `self-baseline` | `alignSelf` |
| `content-start`، `content-end`، `content-center`، `content-between`، `content-around`، `content-evenly`، `content-stretch`، `content-normal` | `alignContent` |
| `justify-items-start`، `-end`، `-center`، `-stretch`، `-normal` | `justifyItems` |
| `justify-self-auto`، `-start`، `-end`، `-center`، `-stretch` | `justifySelf` |
| `place-content-center`، `-start`، `-end`، `-between`، `-stretch` | `alignContent` و`justifyContent` |
| `place-items-center`، `-start`، `-end`، `-stretch` | `alignItems` و`justifyItems` |
| `place-self-auto`، `-center`، `-start`، `-end`، `-stretch` | `alignSelf` و`justifySelf` |
| `gap-<n>`، `gap-x-<n>`، `gap-y-<n>` | `gap`، `columnGap`، `rowGap` |
| `space-x-<n>`، `space-y-<n>` (والسالبة) | هامش على كل ابن عدا الأخير: هامش النهاية (`space-x`) أو الهامش السفلي (`space-y`)، تحت هوامش الابن نفسه، كما في Tailwind CSS؛ ويُضاف إلى `gap` |
| `space-x-reverse`، `space-y-reverse` | الهامش على جهة البداية / الأعلى بدلًا من ذلك (الأبناء بترتيب معكوس) |
| `grid-cols-<n>` | `gridTemplateColumns: "repeat(n, minmax(0, 1fr))"` |
| `grid-cols-[<tracks>]`، `grid-cols-none` | `gridTemplateColumns` (`grid-cols-[200px_1fr]`) |
| `grid-rows-<n>`، `grid-rows-[<tracks>]`، `grid-rows-none` | `gridTemplateRows` |
| `col-span-<n>`، `col-span-full`، `col-auto`، `col-<n>`، `col-[<value>]` | `gridColumn` |
| `col-start-<n>`، `col-end-<n>` (و`-auto`) | `gridColumnStart`، `gridColumnEnd` |
| `row-span-<n>`، `row-span-full`، `row-auto`، `row-<n>`، `row-[<value>]` | `gridRow` |
| `row-start-<n>`، `row-end-<n>` (و`-auto`) | `gridRowStart`، `gridRowEnd` |
| `grid-flow-row`، `grid-flow-col`، `grid-flow-dense`، `grid-flow-row-dense`، `grid-flow-col-dense` | `gridAutoFlow` |
| `auto-cols-auto`، `-min`، `-max`، `-fr`، `auto-cols-[<track>]` | `gridAutoColumns` |
| `auto-rows-auto`، `-min`، `-max`، `-fr`، `auto-rows-[<track>]` | `gridAutoRows` |

<a id="spacing"></a>

## التباعد

| الفئة | تضبط |
|---|---|
| `p-<n>`، `px-<n>`، `py-<n>` | `padding`، `paddingHorizontal`، `paddingVertical` |
| `pt-<n>`، `pr-<n>`، `pb-<n>`، `pl-<n>` | `paddingTop` / `Right` / `Bottom` / `Left` |
| `ps-<n>`، `pe-<n>` | `paddingStart`، `paddingEnd` (يراعي الاتجاه) |
| `m-<n>`، `mx-<n>`، `my-<n>` | `margin`، `marginHorizontal`، `marginVertical` |
| `mt-<n>`، `mr-<n>`، `mb-<n>`، `ml-<n>` | `marginTop` / `Right` / `Bottom` / `Left` |
| `ms-<n>`، `me-<n>` | `marginStart`، `marginEnd` (يراعي الاتجاه) |

<a id="sizing"></a>

## الأبعاد

| الفئة | تضبط |
|---|---|
| `w-<n>`، `h-<n>` | `width`، `height` (تباعد، كسر، `full`، `auto`، مخصّص) |
| `size-<n>` | `width` و`height` |
| `min-w-<n>`، `max-w-<n>`، `min-h-<n>`، `max-h-<n>` | الحد المقابل |
| `w-screen`، `w-dvw`، `w-svw`، `w-lvw` | عرض النافذة (وعلى `min-w-` / `max-w-` أيضًا) |
| `h-screen`، `h-dvh`، `h-svh`، `h-lvh` | ارتفاع النافذة (وعلى `min-h-` / `max-h-` أيضًا) |
| `w-auto`، `h-auto` | `auto` (يُحدَّد حجمه بالمحتوى) |
| `max-w-none`، `max-h-none` | بلا حد |
| `w-<container>`، `min-w-<container>`، `max-w-<container>` | عرض حاوية (أدناه) |

عروض الحاويات (بالنقاط): `3xs` ‏256، `2xs` ‏288، `xs` ‏320، `sm` ‏384، `md` ‏448، `lg` ‏512، `xl` ‏576، `2xl` ‏672، `3xl` ‏768، `4xl` ‏896، `5xl` ‏1024، `6xl` ‏1152، `7xl` ‏1280؛ و`prose` يساوي 65 ضعف عرض `0` في خط العنصر (`65ch` في CSS)، كما في Tailwind CSS.

<a id="typography"></a>

## الطباعة

<a id="font"></a>

### الخط

| الفئة | تضبط |
|---|---|
| `font-sans` | خط النظام |
| `font-serif`، `font-mono` | `fontFamily: "serif"` / `"monospace"` |
| `font-thin` (100)، `font-extralight` (200)، `font-light` (300)، `font-normal` (400)، `font-medium` (500)، `font-semibold` (600)، `font-bold` (700)، `font-extrabold` (800)، `font-black` (900) | `fontWeight` |
| `font-[<weight>]`، `font-[<family>]` | وزن رقمي، وإلا فعائلة خطوط: `font-[650]`، `font-[Inter]` |
| `italic`، `not-italic` | `fontStyle` |
| `normal-nums`، `small-caps`، `oldstyle-nums`، `lining-nums`، `tabular-nums`، `proportional-nums` | `fontVariant` (تُدمج معًا؛ `normal-nums` يعيد ضبط صيغ الأرقام) |

<a id="size-color-and-line-height"></a>

### الحجم واللون وارتفاع السطر

يضبط `text-<size>` حجم الخط وارتفاع السطر المطابق في Tailwind، وتستبدله فئة `leading-*` أيًّا كان موضعها في السلسلة وأيًّا كان متغيّرها (`leading-tight md:text-lg` يُبقي التباعد الضيق بين الأسطر):

| الفئة | الحجم | ارتفاع السطر |
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

| الفئة | تضبط |
|---|---|
| `text-<size>/<leading>` | الحجم وارتفاع السطر: `text-sm/6` (24 نقطة)، `text-lg/tight` |
| `text-[<length>]` | `fontSize`: `text-[22px]`، `text-[length:22px]` |
| `text-<color>` | `color` |
| `leading-none` (1)، `leading-tight` (1.25)، `leading-snug` (1.375)، `leading-normal` (1.5)، `leading-relaxed` (1.625)، `leading-loose` (2) | `lineHeight` كمضاعف لحجم الخط |
| `leading-<n>`، `leading-[<length>]` | `lineHeight` بالنقاط (`leading-6` = 24) |
| `leading-[<number>]` | `lineHeight` كمضاعف لحجم الخط (`leading-[1.5]`)، يُورَّث بوصفه ذلك المضاعف؛ أما `em` و`%` فتحسبان طولًا بحجم خط العنصر قبل التوريث |
| `tracking-tighter` (-0.05em)، `tracking-tight` (-0.025em)، `tracking-normal` (0)، `tracking-wide` (0.025em)، `tracking-wider` (0.05em)، `tracking-widest` (0.1em) | `letterSpacing` نسبةً إلى حجم الخط |
| `tracking-[<value>]` | `letterSpacing`: `tracking-[0.2em]`، `tracking-[1px]` |

<a id="alignment-case-and-wrapping"></a>

### المحاذاة وحالة الأحرف والالتفاف

| الفئة | تضبط |
|---|---|
| `text-left`، `text-center`، `text-right`، `text-justify` | `textAlign` |
| `text-start`، `text-end` | `textAlign: "start"` / `"end"`: بداية السطر أو نهايته في اتجاه التخطيط |
| `align-baseline`، `align-text-top`، `align-text-bottom`، `align-middle` | `verticalAlign` (الـ views والصور داخل النص) |
| `uppercase`، `lowercase`، `capitalize`، `normal-case` | `textTransform` |
| `truncate` | سطر واحد، وحذف في النهاية بنقاط الحذف، دون التفاف، `overflow: hidden` (على view: لا تلتف نصوصه) |
| `line-clamp-<n>`، `line-clamp-none` | `numberOfLines` (`none` يعرض كل الأسطر) |
| `text-ellipsis`، `text-clip` | `textOverflow: "ellipsis"` / `"clip"` |
| `whitespace-nowrap`، `text-nowrap` | لا تلتف الأسطر أبدًا؛ وعلى view تنطبق على أسطر النصوص داخله (موروثة، كما في `white-space` في CSS) |
| `whitespace-normal`، `text-wrap`، `text-balance`، `text-pretty` | تلتف الأسطر (لا تُوازَن) |
| `select-text`، `select-none` | `userSelect: "text"` / `"none"`؛ وعلى view تنطبق على النصوص داخله التي لا تضبط شيئًا |
| `select-auto` | `userSelect: "auto"`: يقرّر الـ view المحيط به، كما في `user-select: auto` في CSS (`select-none md:select-auto`) |
<a id="decoration-and-shadow"></a>

### الزخرفة والظل

| الصنف | يضبط |
|---|---|
| `underline`, `line-through`, `no-underline` | `textDecorationLine` |
| `decoration-solid`, `decoration-double`, `decoration-dotted`, `decoration-dashed`, `decoration-wavy` | `textDecorationStyle` |
| `decoration-<n>`, `decoration-[<length>]` | `textDecorationThickness` |
| `decoration-auto`, `decoration-from-font` | `textDecorationThickness: "auto"` |
| `decoration-<color>` | `textDecorationColor` |
| `underline-offset-<n>`, `underline-offset-[<length>]`, `underline-offset-auto` | `textUnderlineOffset` |
| `text-shadow-2xs`, `-xs`, `-sm`, `-md`, `-lg`; `/<alpha>` | ظل نص من السمة (طبقة واحدة: الأعرض بين طبقات السمة)؛ المُعدِّل هو ألفا الطبقات: `text-shadow-md/20` |
| `text-shadow-<color>`, `text-shadow-current` | لونه، بألفا الحجم |
| `text-shadow-none` | يزيله |

تحتوي ظلال النص في Tailwind على عدة طبقات؛ أما في البيئة الأصلية فيُرسم ظل واحد، هو الطبقة الأعرض.

<a id="inputs"></a>

### حقول الإدخال

| الصنف | يضبط |
|---|---|
| `placeholder:text-<color>` | `placeholderColor` |
| `selection:bg-<color>` | `selectionColor` (إبراز التحديد في حقل الإدخال أو في النص القابل للتحديد، وفي ما بداخل العنصر منهما) |
| `caret-<color>` | لون المؤشر |

<a id="backgrounds"></a>

## الخلفيات

| الصنف | يضبط |
|---|---|
| `bg-<color>` | `backgroundColor` |
| `bg-[<gradient>]` | `backgroundImage`: `bg-[linear-gradient(45deg,red,blue)]`, `bg-[radial-gradient(...)]` |
| `bg-linear-to-t`, `-tr`, `-r`, `-br`, `-b`, `-bl`, `-l`, `-tl` | تدرج خطي نحو جانب أو زاوية (`bg-gradient-to-*` هو الاسم في الإصدار v3) |
| `bg-linear-<angle>`, `bg-linear-[<angle>]` | تدرج خطي بزاوية: `bg-linear-45`, `-bg-linear-12`, `bg-linear-[0.25turn]` |
| `bg-radial` | تدرج شعاعي من المركز |
| `bg-conic`, `bg-conic-<angle>` | تدرج مخروطي، يبدأ اختياريًا من زاوية |
| `from-<color>`, `via-<color>`, `to-<color>` | نقاط توقف التدرج (الافتراضي شفاف عند الطرفين) |
| `from-<p>%`, `via-<p>%`, `to-<p>%` | مواضع نقاط التوقف: `via-40%`, `from-[15%]` |
| `bg-none` | يزيل التدرج |

تمزج أدوات التدرج ألوانها في Oklab كما يكتبها Tailwind CSS (`in oklab`)؛ وعند موضع عشوائي (`bg-linear-[25deg]`, `bg-conic-[0.25turn]`) تتبع الإعداد الافتراضي في CSS: Oklab مع ألوان اللوحة، وsRGB عندما تكون كل نقطة توقف لونًا سداسيًا (hex) أو `rgb()` أو `hsl()` أو لونًا مسمًّى.

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

## الحدود

| الصنف | يضبط |
|---|---|
| `border`, `border-<n>`, `border-[<length>]` | `borderWidth` (بدون قيمة: 1) |
| `border-x`, `border-y`, `border-t`, `border-r`, `border-b`, `border-l`, `border-s`, `border-e` (مع `-<n>` أو بدونها) | عرض الجوانب المطابقة |
| `border-<color>`, `border-t-<color>`, ... | `borderColor` وألوان الجوانب كلٌّ على حدة |
| `border-solid`, `border-dashed`, `border-dotted` | `borderStyle` |
| `border-none`, `border-hidden` | `borderStyle: "none"` / `"hidden"`: لا حدود مهما كانت أصناف العرض، وبأي ترتيب (`md:border-solid` تُظهرها من جديد) |
| `rounded`, `rounded-<size>`, `rounded-none`, `rounded-full`, `rounded-[<length>]` | `borderRadius` (بدون قيمة: `sm`) |
| `rounded-t-`, `-r-`, `-b-`, `-l-`, `-tl-`, `-tr-`, `-br-`, `-bl-` | الزوايا المطابقة |
| `rounded-s-`, `-e-`, `-ss-`, `-se-`, `-es-`, `-ee-` | زوايا البداية / النهاية (تراعي الاتجاه): `borderTopStartRadius`, `borderTopEndRadius`, `borderBottomStartRadius`, `borderBottomEndRadius` |
| `outline`, `outline-<n>`, `outline-[<length>]` | `outlineWidth` (بدون قيمة: 1)، متصل ما لم يوجد صنف نمط في أي موضع من السلسلة (`outline-dashed outline-2` متقطع، `outline-none outline-2` لا يرسم شيئًا) |
| `outline-<color>` | `outlineColor` |
| `outline-solid`, `outline-dashed`, `outline-dotted`, `outline-none`, `outline-hidden` | `outlineStyle`؛ النمط وحده يعني العرض المتوسط (medium) في CSS، أي 3 نقاط |
| `outline-offset-<n>`, `outline-offset-[<length>]` | `outlineOffset` |

أحجام نصف القطر (بالنقاط): `xs` 2، `sm` 4، `md` 6، `lg` 8، `xl` 12، `2xl` 16، `3xl` 24، `4xl` 32، `full` 9999.

<a id="rings"></a>

### الحلقات

الحلقات هي ظلال صندوقية ذات انتشار، تُرسم خارج الحد دون أن تشغل حيزًا.

| الصنف | يضبط |
|---|---|
| `ring`, `ring-<n>`, `ring-[<length>]` | حلقة بذلك العرض (بدون قيمة: 1) |
| `ring-<color>` | لونها (الافتراضي لون نص العنصر) |
| `ring-inset` | يرسم الحلقة من الداخل |
| `ring-offset-<n>`, `ring-offset-<color>` | فجوة بين العنصر والحلقة (الافتراضي أبيض) |
| `inset-ring`, `inset-ring-<n>`, `inset-ring-<color>` | حلقة داخلية |

<a id="effects"></a>

## التأثيرات

| الصنف | يضبط |
|---|---|
| `shadow-2xs`, `shadow-xs`, `shadow-sm`, `shadow`, `shadow-md`, `shadow-lg`, `shadow-xl`, `shadow-2xl`; `/<alpha>` | `boxShadow` من السمة؛ المُعدِّل هو ألفا الطبقات: `shadow-xl/20` |
| `shadow-[<box-shadow>]` | ظل عشوائي: `shadow-[0_8px_24px_rgb(0_0_0_/_0.12)]` |
| `shadow-<color>`, `shadow-current` | يعيد تلوين طبقات الظل، بألفا الحجم: `shadow-indigo-500/40` |
| `shadow-none` | بلا ظل |
| `inset-shadow-2xs`, `-xs`, `-sm`, `inset-shadow`, `inset-shadow-[...]`, `inset-shadow-<color>`, `inset-shadow-none` | ظل داخلي |
| `opacity-<n>`, `opacity-[<value>]` | `opacity`: `opacity-50` = 0.5 |
| `mix-blend-<mode>` | `mixBlendMode`: `normal`, `multiply`, `screen`, `overlay`, `darken`, `lighten`, `color-dodge`, `color-burn`, `hard-light`, `soft-light`, `difference`, `exclusion`, `hue`, `saturation`, `color`, `luminosity`, `plus-darker`, `plus-lighter` |

تُدمج الظلال والحلقات والظلال الداخلية في قائمة `boxShadow` واحدة، كما في CSS. يستبدل لون الظل لون كل طبقة، بما في ذلك ألفا، مثل `--tw-shadow-color` في Tailwind: `shadow-md shadow-red-500` ظل أحمر معتم، و`shadow-md/20 shadow-red-500` ظل أحمر بنسبة 20%.

<a id="filters"></a>

## المرشحات

| الصنف | يضبط |
|---|---|
| `blur`, `blur-xs` (4), `-sm` (8), `-md` (12), `-lg` (16), `-xl` (24), `-2xl` (40), `-3xl` (64), `blur-none`, `blur-[<length>]` | `blur()` |
| `brightness-<n>`, `contrast-<n>`, `saturate-<n>` | عوامل نسبة مئوية: `brightness-125` = 1.25 |
| `grayscale`, `grayscale-<n>`, `invert`, `invert-<n>`, `sepia`, `sepia-<n>` | بدون قيمة: 100% |
| `hue-rotate-<deg>`, `-hue-rotate-<deg>` | `hue-rotate()` |
| `drop-shadow`, `drop-shadow-xs`, `-sm`, `-md`, `-lg`, `-xl`, `-2xl`, `drop-shadow-[...]`, `drop-shadow-none`; `drop-shadow-<color>`, `drop-shadow-current`; `/<alpha>` على أي منهما | `drop-shadow()` لكل طبقة، بعد المرشحات الأخرى؛ اللون يستبدل ألوان الطبقات، بألفا الحجم؛ ترسم الويب وLinux وWindows وGPUI كل الطبقات، أما iOS وmacOS وAndroid فترسم الطبقة الأعرض |
| `drop-shadow-none` | يزيله |
| `filter-none` | يزيل كل المرشحات |
| `backdrop-blur`, `backdrop-blur-<size>`, `backdrop-blur-[<length>]` | يطمس ما خلف العنصر |
| `backdrop-brightness-<n>`, `backdrop-contrast-<n>`, `backdrop-grayscale`, `backdrop-hue-rotate-<deg>`, `backdrop-invert`, `backdrop-opacity-<n>`, `backdrop-saturate-<n>`, `backdrop-sepia` | مرشحات الخلفية |
| `backdrop-filter-none` | يزيلها |

> [!WARNING]
> لا يطبّق iOS على العناصر إلا `opacity` و`brightness` حتى 1 و`drop-shadow`؛ أما `<Image>` فتقبل كل مرشحات الألوان و`blur`. يتطلب Android الإصدار API 31 من أجل `blur` و`drop-shadow` وطمس الخلفية. راجع [مرجع الأنماط](./style-reference.md#filters-and-blending).

<a id="transforms"></a>

## التحويلات

| الصنف | يضبط |
|---|---|
| `translate-x-<n>`, `translate-y-<n>`, `translate-<n>` | `translate` (المسافات، `full`، وكسور من حجم العنصر نفسه: `-translate-x-1/2`، وقيم عشوائية) |
| `rotate-<deg>`, `rotate-[<angle>]` | `rotate` |
| `rotate-x-<deg>`, `rotate-y-<deg>`, `rotate-z-<deg>` | تدوير ثلاثي الأبعاد (في `transform`، بعد الإزاحة والتدوير والتحجيم) |
| `scale-<pct>`, `scale-x-<pct>`, `scale-y-<pct>`, `scale-[<factor>]` | `scale`: `scale-95` = 0.95، و`-scale-x-100` تعكس |
| `skew-<deg>`, `skew-x-<deg>`, `skew-y-<deg>` | الإمالة (skew)، في `transform` (غير متاحة على Android) |
| `perspective-dramatic` (100), `-near` (300), `-normal` (500), `-midrange` (800), `-distant` (1200), `perspective-[<length>]`, `perspective-none` | العمق للتدويرات ثلاثية الأبعاد لأبناء العنصر، منظورًا إليها من مركزه (`perspective` في CSS: `<View class="perspective-near"><View class="rotate-y-45" /></View>`) |
| `origin-center`, `-top`, `-top-right`, `-right`, `-bottom-right`, `-bottom`, `-bottom-left`, `-left`, `-top-left`, `origin-[<value>]` | `transformOrigin` |
| `backface-hidden`, `backface-visible` | `backfaceVisibility` |
| `transform-none` | يمسح التدويرات ثلاثية الأبعاد والإمالات (`transform: none` في CSS) |
| `translate-none`, `rotate-none`, `scale-none` | يمسح الإزاحة والتدوير والتحجيم |

تتركب أدوات التحويل كما في CSS: `translate-*` و`rotate-*` و`scale-*` تضبط الخصائص `translate` و`rotate` و`scale` وتجتمع بصرف النظر عن الترتيب، ثم يُطبَّق `transform` (`rotate-x-*`, `skew-*`). أما مفاتيح الخاصية `style` التي تحمل الأسماء نفسها فتستبدل خاصيتها وحدها: `style={{ scale: 1.1 }}` تستبدل `scale-95` وتُبقي `rotate-3`. تُقبل `transform` و`transform-gpu` و`transform-cpu` و`transform-flat` ولا تفعل شيئًا: يركّب NSH كل التحويلات بالطريقة نفسها، مسطّحة. تُحسب الإزاحات بكسر من الحجم بالنسبة إلى إطار العنصر، وتتبعه عند تغيير حجمه.

<a id="transitions-and-animation"></a>

## الانتقالات والحركة

| الصنف | يضبط |
|---|---|
| `transition` | الألوان والعتامة والظل والتحويل؛ 150 مللي ثانية، `cubic-bezier(0.4, 0, 0.2, 1)` |
| `transition-all`, `transition-colors`, `transition-opacity`, `transition-shadow`, `transition-transform` | الخصائص المتحركة |
| `transition-none` | بلا انتقال |
| `duration-<ms>`, `duration-[<time>]` | `transitionDuration`: `duration-300`, `duration-[0.4s]` |
| `delay-<ms>`, `delay-[<time>]` | `transitionDelay` |
| `ease-linear`, `ease-in`, `ease-out`, `ease-in-out`, `ease-initial`, `ease-[cubic-bezier(...)]` | `transitionTimingFunction` |
| `animate-spin`, `animate-ping`, `animate-pulse`, `animate-bounce` | حركة أصلية بإطارات مفتاحية، تتكرر إلى الأبد |
| `animate-none` | توقفها |

تعمل الانتقالات على خيط واجهة المستخدم عند تغير قيمة، بما في ذلك عندما يبدأ تطابق متغيّر (variant) أو ينتهي، لذا يحرّك `transition active:scale-95` الضغط دون JS. غلّف الحركات في `motion-safe:` لاحترام إعداد تقليل الحركة.

<a id="interactivity"></a>

## التفاعل

| الصنف | يضبط |
|---|---|
| `pointer-events-none`, `pointer-events-auto` | `pointerEvents: "none"` / `"auto"`: هل العنصر هدف للمس والمؤشر، وتُورَّث كما في CSS: داخل عنصر `pointer-events-none` يعود عنصر `pointer-events-auto` هدفًا من جديد |
| `cursor-<name>`, `cursor-[<name>]` | `cursor`: `cursor-pointer`, `cursor-grab`, `cursor-not-allowed`, ... (كل كلمات المؤشر المفتاحية في CSS) |
| `select-none`, `select-text`, `select-auto` | تحديد النص (انظر الطباعة) |

## SVG

| الصنف | يضبط |
|---|---|
| `fill-<color>`, `fill-none`, `fill-current`, `fill-inherit` | `fill` (`fill-current` هو `currentColor`) |
| `stroke-<color>`, `stroke-none`, `stroke-current`, `stroke-inherit` | `stroke` |
| `stroke-<number>`, `stroke-[<length>]` | `strokeWidth` |

<a id="images"></a>

## الصور

| الصنف | يضبط |
|---|---|
| `object-cover`, `object-contain`, `object-fill`, `object-none`, `object-scale-down` | `objectFit` (`fill` تمدّد، `none` تُبقي الحجم الطبيعي، موضوعة عند `objectPosition`، و`scale-down` مثلها، لكن تُصغَّر لتلائم المساحة حيث تكون أكبر)؛ للصور ومقاطع الفيديو |
| `object-top`, `object-bottom`, `object-left`, `object-right`, `object-center`, `object-top-left`, `object-top-right`, `object-bottom-left`, `object-bottom-right`, `object-[<position>]` | `objectPosition` (`object-left-top`, ... مثل `object-top-left`, ...) |
| `tint-<color>` | `tintColor` (يعيد تلوين الصور القالبية) |

<a id="accepted-without-effect"></a>

## مقبولة دون تأثير

هذه الأدوات إما تلميحات للعرض أو تصف ما هو عليه كل عنصر أصلي أصلًا؛ تُحلَّل دون تحذير ولا تغيّر شيئًا: `antialiased`, `subpixel-antialiased`, `isolation-auto`, `box-border`, `appearance-none`, `appearance-auto`, `will-change-auto`, `will-change-scroll`, `will-change-contents`, `will-change-transform`, `will-change-[<value>]`, `transform`, `transform-gpu`, `transform-cpu`, `transform-flat`. التمرير والالتقاط والتمرير الزائد هي خصائص لـ [scroll](../elements/scroll.md).

<a id="not-supported"></a>

## غير مدعومة

متغيّرات `peer-*`، والعناصر الزائفة (`before:`, `after:`)، والخصائص العشوائية (`[prop:value]`)، و`overflow-auto` / `overflow-scroll`، و`divide-*`، و`columns-*`، و`float-*`، و`container`، واستعلامات الحاويات، و`order-*`، و`transform-3d`، و`select-all`، و`border-double` / `outline-double`، وقيود الحد الأدنى/الأقصى الجوهرية (مثل `max-w-max`)، و`snap-*`، و`scroll-*`، و`overscroll-*`، و`touch-*`، و`isolate` كلها أصناف غير معروفة. ينبّه `nsh build` و`nsh dev` إلى الأصناف غير المعروفة التي يجدانها في شيفرتك المصدرية (`file:line:col: unknown class '...'`)، ويسجّل وقت التشغيل كل صنف غير معروف مرة واحدة.

<a id="variants"></a>

## المتغيّرات (Variants)

تجعل المتغيّرات الأداة مشروطة: `dark:bg-zinc-900`, `md:flex-row`, `active:opacity-70`. يمكن تكديسها (`dark:active:bg-zinc-700`) وتُقيَّم أصليًا كلما تغيّر ما تعتمد عليه.

<a id="appearance-and-environment"></a>

### المظهر والبيئة

| المتغيّر | يُطبَّق عندما | Rust |
|---|---|---|
| `dark:` | يكون المظهر داكنًا | `.dark(\|s\| …)` |
| `ios:` | يعمل التطبيق على iOS أو Mac Catalyst | `.when(os() == Os::Ios, …)` |
| `android:` | يعمل التطبيق على Android | `.when(os() == Os::Android, …)` |
| `portrait:`, `landscape:` | تكون النافذة أطول من عرضها / أعرض من طولها | `.style_when(move \|\| window().height > window().width, …)` |
| `ltr:`, `rtl:` | اتجاه التخطيط | `.style_when(rtl, …)` |
| `motion-safe:`, `motion-reduce:` | لم يطلب المستخدم / طلب تقليل الحركة | `.style_when(reduce_motion, …)` |

<a id="breakpoints"></a>

### نقاط التوقف (Breakpoints)

تقارن نقاط التوقف عرض النافذة بالنقاط.

| المتغيّر | الحد الأدنى للعرض |
|---|---|
| `sm:` | 640 |
| `md:` | 768 |
| `lg:` | 1024 |
| `xl:` | 1280 |
| `2xl:` | 1536 |

| الصيغة | مثال | يُطبَّق عندما |
|---|---|---|
| `<bp>:` | `md:p-8` | العرض ≥ نقطة التوقف |
| `max-<bp>:` | `max-md:p-1` | العرض < نقطة التوقف |
| `min-[<length>]:` | `min-[600px]:grid-cols-3` | العرض ≥ الطول المحدد |
| `max-[<length>]:` | `max-[400px]:text-sm` | العرض < الطول المحدد |

لا يطابق الهاتف في الوضع الرأسي (بعرض 390 نقطة) أيًّا من نقاط التوقف الافتراضية؛ أما الجهاز اللوحي أو الهاتف في الوضع الأفقي فيطابق عدة نقاط. في Rust، نقطة التوقف شرط على النافذة: `.style_when(move || window().width >= px(768.0), |s| s.p_8())` هو `md:p-8`.

<a id="interaction-states"></a>

### حالات التفاعل

لا تتتبع المنصة الحالات إلا للعناصر التي تستخدمها أصنافها، وتُطبَّق التغييرات أصليًا دون ذهاب وإياب عبر JS.

| المتغيّر | يُطبَّق عندما | Rust |
|---|---|---|
| `active:` | يكون العنصر مضغوطًا | `.active(\|s\| …)` |
| `hover:` | يكون المؤشر فوقه (مؤشر iPad، وMac Catalyst، وفأرة Android) | `.hover(\|s\| …)` |
| `focus:`, `focus-visible:` | يكون التركيز على حقل الإدخال | `.focus(\|s\| …)` |
| `focus-within:` | يكون التركيز على العنصر أو على أحد أحفاده (محتوى `Overlay` هو من أحفاد العنصر الذي يوجد فيه) | `.focus_within(…)` |
| `disabled:` | يملك العنصر الخاصية `disabled` | `.disabled_style(\|s\| …)` |
| `enabled:` | لا يملك العنصر الخاصية `disabled` |  |
| `selected:` | يكون العنصر محددًا: `selected` الخاصة بـ `Button`، أو `accessibilityState.selected` |  |
| `checked:` | يكون العنصر مفعّلًا (checked): `accessibilityState.checked` هو `true` (`"mixed"` غير مفعّل) |  |
| `indeterminate:` | يكون العنصر في حالة غير محسومة (indeterminate): `accessibilityState.checked` هو `"mixed"` |  |
| `aria-expanded:` | يكون العنصر موسّعًا: `accessibilityState.expanded` هو `true` (زر التشغيل الخاص بـ `Popover` أو `Menu` ما دامت نافذته المنبثقة مفتوحة) |  |
| `aria-pressed:` | يكون العنصر زر تبديل في وضع التشغيل: `accessibilityState.pressed` هو `true` (`"mixed"` غير مضغوط؛ وليس `active:`، أي ضغطة جارية) | `.aria_pressed(\|s\| …)` |
| `aria-busy:` | يكون العنصر مشغولًا: `accessibilityState.busy` هو `true` |  |
| `aria-checked:` | يكون العنصر مفعّلًا: `accessibilityState.checked` هو `true`، مثل `checked:` |  |
| `aria-selected:` | يكون العنصر محددًا: `accessibilityState.selected` هو `true`، مثل `selected:` |  |
| `data-<name>:` | يملك العنصر السمة المنطقية `data-*` `name` (`&[data-<name>]` في Tailwind؛ أسماؤها من أحرف صغيرة وأرقام و`-`): ما يعرضه جزء من مكوّن زيادةً على حالاته، مثل يوم في تقويم عند بداية نطاق `data-range-start` | `Interactive::project_data(name, …)` يضبط واحدة |

الحالات نفسها على هيئة كائنات أنماط هي الخصائص `activeStyle` و`hoverStyle` و`focusStyle` و`disabledStyle` و`checkedStyle` و`indeterminateStyle` و`expandedStyle` و`pressedStyle` لكل عنصر (ولـ `selectedStyle` الخاصة بـ `Button`)؛ وتتغلب على نمط العنصر وأصنافه.

يعمل `disabled` على أي عنصر: فهو يطبّق `disabled:` ويزيل معالجات الضغط من العنصر، فلا يظهر عليه أي تجاوب مع الضغط أيضًا.

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

### المجموعات

علّم عنصرًا سلفًا باستخدام `group` ونسّق العناصر التابعة له بحسب حالته باستخدام `group-<state>:`. سمِّ المجموعات لتداخلها: `group/card` و`group-hover/card:`.

| المتغير | ينطبق عندما تكون المجموعة | Rust |
|---|---|---|
| `group-active:` | مضغوطة | `.group_active(…)`، `.group_active_named(name, …)` |
| `group-hover:` | تحت المؤشر | `.group_hover(…)`، `.group_hover_named(name, …)` |
| `group-focus:`، `group-focus-visible:` | عليها التركيز |  |
| `group-focus-within:` | عليها التركيز أو تحتوي على عنصر عليه التركيز | `.group_focus_within(…)`، `.group_focus_within_named(name, …)` |
| `group-disabled:` | معطّلة |  |
| `group-selected:` | محددة |  |
| `group-checked:` | مفعّلة (checked) |  |
| `group-indeterminate:` | في حالة غير محسومة |  |
| `group-aria-expanded:` | موسّعة |  |
| `group-aria-pressed:` | زر تبديل في وضع التشغيل |  |
| `group-aria-busy:`، `group-aria-checked:`، `group-aria-selected:` | مشغولة، مفعّلة، محددة |  |
| `group-data-<name>:` | تعرض السمة `data-*` بالقيمة `name` |  |

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

### الموضع بين العناصر الشقيقة

| المتغير | ينطبق على |
|---|---|
| `first:` | العنصر الابن الأول |
| `last:` | العنصر الابن الأخير |
| `only:` | العنصر الابن الوحيد |
| `odd:` | العنصر الابن الأول والثالث ... |
| `even:` | العنصر الابن الثاني والرابع ... |

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

### النص البديل والتحديد

يُطبَّق `placeholder:` على النص البديل (placeholder) الخاص بـ `<Input>` ويقبل لون النص فقط: `placeholder:text-zinc-400` (مفتاح النمط `placeholderColor`). ويُطبَّق `selection:` على التحديد داخل `<Input>` أو `<Text>` قابل للتحديد، وعلى أي عنصر بالنسبة إلى العناصر داخله (مكافئ `& *::selection` في Tailwind؛ وتكون الغلبة لأقرب عنصر)، ويقبل لون الخلفية، أي التمييز: `selection:bg-violet-200` (مفتاح النمط `selectionColor`، الذي يلوّن أيضًا مؤشر الإدخال في حقل الإدخال على المنصات التي ترسمه بلون واحد).

<a id="important"></a>

### مهم

وضع `!` قبل الأداة المساعدة أو بعدها (`!p-4`، `p-4!`) يجعلها تتغلب على كل الفئات الأخرى وعلى `style` المضمّن.

<a id="theme-customization"></a>

## تخصيص السمة

وسّع السمة في الكائن `"tailwind"` داخل `nsh.json` الخاص بتطبيقك. تُضاف العناصر ذات الأسماء الجديدة، أما العناصر ذات الأسماء الموجودة فتحل محل القيم الافتراضية. الأطوال بالنقاط. يُتحقَّق من السمة عند تجميع التطبيق: المفتاح غير المعروف أو القيمة غير الصالحة يسبب خطأ في البناء.

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

مع هذه السمة، تعمل جميعها: `bg-brand-500`، `bg-brand` (درجة `DEFAULT`)، `text-accent`، `tablet:flex-row`، `font-display`، `text-huge`، `font-heavy`، `rounded-card`، `shadow-card`، `inset-shadow-well`، `drop-shadow-icon`، `tracking-label`، `leading-dense`، `blur-glass`، `perspective-card`، `aspect-photo`، `ease-snappy` و`max-w-content`.

| المفتاح | القيمة | يستخدمه |
|---|---|---|
| `colors` | `{ name: color }` أو `{ name: { shade: color } }`؛ ويسمّي `DEFAULT` اللون المجرد. أي صيغة لون في CSS. | كل أداة مساعدة للألوان |
| `spacing` | نقاط لكل خطوة (الافتراضي 4) | `p-*`، `m-*`، `gap-*`، `w-*`، ... |
| `rem` | نقاط لكل `rem` (الافتراضي 16) | |
| `breakpoints` | `{ name: width }` | متغيرات نقاط التوقف (مرتبة بحسب العرض) |
| `container` | `{ name: width }` | `w-*`، `min-w-*`، `max-w-*` |
| `fontFamily` | `{ name: family }` (عائلة خطوط للنظام أو اسم خط مضمَّن) | `font-*` |
| `fontSize` | `{ name: size }` أو `{ name: [size, lineHeightMultiple] }` | `text-*` |
| `fontWeight` | `{ name: 1–1000 }` | `font-*` |
| `tracking` | `{ name: em }` | `tracking-*` |
| `leading` | `{ name: multiple }` | `leading-*` |
| `radius` | `{ name: points }` | `rounded-*` |
| `shadow`، `insetShadow`، `dropShadow` | `{ name: "CSS box-shadow" }` | `shadow-*`، `inset-shadow-*`، `drop-shadow-*` |
| `blur` | `{ name: points }` | `blur-*`، `backdrop-blur-*` |
| `perspective` | `{ name: points }` | `perspective-*` |
| `aspect` | `{ name: ratio }` | `aspect-*` |
| `ease` | `{ name: [x1, y1, x2, y2] }` | `ease-*` |

> [!NOTE]
> تحدد سمة Tailwind شكل فئات تطبيقك فقط. أما رموز التصميم (design tokens) الخاصة بالتطبيق (ألوان shadcn/ui، و`radius`، والخطوط، والرموز الخاصة بالتطبيق) فهي سمته، أي المفتاح `"theme"` في `nsh.json`، وهي التي ترسم بها مكوّنات Rust؛ راجع [Rust](../docs/rust.md#theme). تشير الفئات إلى هذه الرموز بوصفها متغيرات `@theme` بأسماء Tailwind (`bg-primary`، `bg-up/30`، `rounded-(--radius)`): راجع [رموز السمة](../docs/tailwind.md#theme-tokens).

<a id="related"></a>

## ذو صلة

- [Tailwind](../docs/tailwind.md): الدليل.
- [التنسيق](../docs/styling.md): `class` و`classList` و`style` وكيفية اجتماعها.
- [مرجع الأنماط](./style-reference.md): مفاتيح الأنماط التي تضبطها الأدوات المساعدة.
