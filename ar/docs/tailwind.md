---
title: "Tailwind"
description: "فئات Tailwind CSS التي تُحلّ أصلياً في TSX ومكافئاتها المضبوطة الأنواع في Rust - class وclassList، والمتغيّرات (variants) لحالات الضغط، والوضع الداكن ونقاط التوقف، والسمة (theme) في nsh.json، والتحقق من الفئات أثناء البناء."
order: 33
group: ui
demo: guide-tailwind
source_hash: 1112d3bac3b2b097
---

# Tailwind

تتبع أنماط NSH إطار Tailwind CSS 4. في Rust، تكون أدوات Tailwind المساعدة (utilities) دوال أنماط مُنمَّطة بالأسماء والقيم نفسها (`.p_4()` هي `p-4`، و`.rounded_2xl()` هي `rounded-2xl`، و`ZINC.shade(900)` هي `zinc-900`)؛ أما في TSX فيقبل كل عنصر الفئات (classes) نفسها في `class`، وتُحلّ أصلاً مقابل سمة Tailwind 4 الافتراضية. يعرض كل مثال أدناه الدوال المُنمَّطة أولاً ثم الفئات:

```rust tabs
use nsh_core::element::palette::ZINC;

view()
    .flex_row()
    .items_center()
    .gap_3()
    .rounded_2xl()
    .bg(AdaptiveColor::new(white(), ZINC.shade(800)))
    .p_4()
    .shadow_lg()
    .active(|s| s.scale(0.98))
    .child(
        text("Tailwind on native views")
            .text_base()
            .font_weight(FontWeight::SEMIBOLD)
            .text_color(AdaptiveColor::new(ZINC.shade(900), white())),
    )
```

```tsx tabs
<View class="flex-row items-center gap-3 rounded-2xl bg-white p-4 shadow-lg active:scale-[0.98] dark:bg-zinc-800">
  <Text class="text-base font-semibold text-zinc-900 dark:text-white">Tailwind on native views</Text>
</View>
```

تُحوَّل الدوال المُنمَّطة إلى قواعد الأنماط نفسها التي تُترجَم إليها الفئات، دون أي نص يلزم تحليله. أما الفئات، فلا يُولَّد أي CSS ولا يُنفَّذ شيء في JavaScript: يُمرَّر النص إلى النواة، التي تحلّل كل سلسلة فئات مختلفة مرة واحدة (وتخزّنها مؤقتًا)، وتحوّلها إلى قواعد أنماط، ثم تطبّقها. أما المتغيّرات المعتمدة على الحالة (الضغط، الوضع الداكن، عرض النافذة) فتعيد النواة تطبيقها عند تغيّر تلك الحالة، وتُتتبَّع حالتا الضغط والتركيز أصلاً، لذا فإن ردّ الفعل البصري لـ`active:` (`.active(..)` في Rust) لا يتطلب أي ذهاب وإياب إلى شيفرتك.

تنتج الفئات و[الخاصية `style`](./styling.md) الأنماط الأصلية نفسها ويمكن الجمع بينهما؛ وتتناول هذه الصفحة ما يخص الفئات ونظائرها المُنمَّطة. ويسرد [مرجع Tailwind](../modules/tailwind-reference.md) كل أداة مدعومة.

## class and classList

```rust tabs
view()
    .rounded_lg()
    .px_4()
    .py_2()
    .transition_colors()
    .bg(move || if selected.get() { INDIGO.shade(600) } else { ZINC.shade(200) })
    .style_when(busy, |s| s.opacity(0.5))
```

```tsx tabs
<View
  class="rounded-lg px-4 py-2 transition-colors"
  classList={{ "bg-indigo-600": selected(), "bg-zinc-200": !selected(), "opacity-50": busy() }}
/>
```

- **`class`** هي سلسلة من الفئات. ويمكن أن تكون ديناميكية: ``class={`h-6 rounded bg-${color()}-500`}`` تعمل، لأن الفئات تُحلّ وقت التشغيل.
- **`classList`** تربط الفئات بشروط: تُطبَّق الفئة ما دامت قيمتها صحيحة (truthy). وتُطبَّق بعد `class`.
- **في Rust**، تتبعها الدالة التي تُمرَّر إليها دالة مغلقة (closure) أو إشارة (signal) (`.bg(move || ..)`)، وتطبّق `.style_when(condition, |s| ..)` الأنماط ما دام الشرط قائمًا، وتحسم `.when(condition, |v| ..)` الأمر مرة واحدة عند إنشاء العنصر.

كيف تُحسم التعارضات:

1. **الفئات اللاحقة تتغلب** على السابقة في السلسلة نفسها: `"p-2 p-4"` تعني `p-4`. ولا حاجة إلى `tailwind-merge`: يمكن للمكوّن أن يلحق بسلسلته `class` التي يمرّرها المستدعي. وتتغلب الدوال اللاحقة كذلك في Rust.
2. **فئات المتغيّرات تُطبَّق بعد الفئات العادية**، بحسب ترتيب المتغيّرات في Tailwind (`hover:` قبل `active:`، و`max-*:` الأوسع أولاً، ونقاط التوقف تصاعديًا، و`dark:` أخيرًا)، أيًّا كان موضعها في السلسلة. وكما في Tailwind، يحسم أعلى متغيّر في الفئة، ثم الذي يليه، وتأتي الفئة ذات المتغيّر الإضافي لاحقًا: `dark:hover:bg-a dark:bg-b` تعني `bg-a` عند التحويم في الوضع الداكن، و`max-md:p-2 max-lg:p-4` تعني `p-2` دون `md`. وكما في CSS، تمنح `odd:bg-a last:bg-b` الصف الأخير الفردي `bg-a`، لأن Tailwind يرتّب `odd` بعد `last`.
3. **`style` تتغلب على الفئات.** مفتاح النمط هو خاصية CSS التي تحمل اسمه، وهي التي تضبطها الفئات، لذا فهو يستبدل تلك الخاصية وحدها: `style={{ paddingLeft: 8 }}` تستبدل `pl-4` وتُبقي `pr-4`.
4. `!` تجعل الفئة مهمّة (important): `!p-0`.

تقبل مكوّنات Rust (مكوّنات `nsh/base` وتلك الموجودة في حزمة (crate) تطبيقك) `class` و`classList` من TSX أيضًا؛ وتُدمج فئاتك بعد أنماط المكوّن نفسه وتتغلب عند تساوي الرتبة.

## Variants

| المتغيّر | يُطبَّق عندما | Rust |
|---|---|---|
| `active:` | يكون العرض (view) مضغوطًا | `.active(\|s\| ..)` |
| `hover:` | يكون مؤشر فوق العرض (مؤشرات iPad وMac) | `.hover(\|s\| ..)` |
| `focus:`، `focus-visible:` | يكون التركيز على حقل إدخال | `.focus(\|s\| ..)` |
| `focus-within:` | يكون التركيز على العرض أو أحد أبنائه (محتوى `Overlay` هو من أبناء العرض الموجود فيه) | `.focus_within(..)` |
| `disabled:`، `enabled:` | تكون خاصية `disabled` للعنصر true / false | `.disabled_style(\|s\| ..)` |
| `selected:` | يكون العنصر محدّدًا (`selected`، `accessibilityState.selected` الخاصة بـ`Button`) | `.selected_style(..)` |
| `checked:` | يكون العنصر مؤشَّرًا عليه (`accessibilityState.checked` هي `true`؛ `"mixed"` غير مؤشَّر عليه) | `.checked_style(..)` |
| `indeterminate:` | يكون العنصر في حالة غير محسومة (`accessibilityState.checked` هي `"mixed"`) | `.indeterminate_style(..)` |
| `aria-expanded:` | يكون العنصر موسَّعًا (`accessibilityState.expanded` هي `true`): زرّ التشغيل الخاص بـ`Popover` أو `Menu` ما دامت نافذته المنبثقة مفتوحة | `.expanded_style(..)` |
| `aria-pressed:` | يكون العنصر زرّ تبديل في وضع التشغيل (`accessibilityState.pressed` هي `true`؛ `"mixed"` غير مضغوط). ليس `active:`، وهو ضغط قيد التنفيذ | `.aria_pressed(..)`، `.pressed_style(..)` |
| `aria-busy:`، `aria-checked:`، `aria-selected:` | `accessibilityState.busy`، `checked` (`true`، وليس `"mixed"`) أو `selected` هي `true`، كما في متغيّرات `aria-*` في Tailwind: بعد الفئات الزائفة (pseudo-classes)، بترتيب أسمائها | |
| `data-<name>:` | يحمل العنصر السمة `data-*` بالقيمة `name`، كما في متغيّرات `data-*` المنطقية في Tailwind (`&[data-range-start]`): ما يُظهره جزء من المكوّن زيادةً على حالاته، مثل يوم في التقويم عند بداية نطاق (`data-range-start:`). بعد متغيّرات `aria-*`، بترتيب أسمائها | `Interactive::project_data(name, ..)` تضبط واحدة على جزء من مكوّن |
| `group-active:`، `group-hover:`، `group-focus:`، `group-focus-within:`، `group-disabled:`، `group-selected:`، `group-checked:`، `group-indeterminate:`، `group-aria-expanded:`، `group-aria-pressed:`، `group-aria-busy:`، `group-aria-checked:`، `group-aria-selected:`، `group-data-<name>:` | يكون أقرب سلف يحمل الفئة `group` في تلك الحالة، أو يحمل تلك السمة `data-*` | `.group()` على السلف؛ و`.group_active(..)`، `.group_hover(..)`، `.group_focus_within(..)` في الداخل |
| `group-active/name:` ... | الأمر نفسه، لسلف موسوم بـ`group/name` | `.group_named("name")`؛ `.group_active_named("name", ..)`، ... |
| `first:`، `last:`، `odd:`، `even:`، `only:` | موضع العنصر نفسه بين أشقائه. لتلوين نص الصف بحسب موضع الصف، ضع `last:text-*` على الصف: فيرثها النص | Rust عادي انطلاقًا من فهرس الصف (`at.is_first()`، `at.is_last()`، `at.index() % 2`) |
| `placeholder:` | ينسّق النص النائب (placeholder) لحقل إدخال (`placeholder:text-zinc-400`) | `.placeholder_color(..)` |
| `selection:` | يلوّن تمييز التحديد في حقل إدخال أو نص قابل للتحديد، وفي تلك الموجودة داخل العنصر (`selection:bg-violet-200`) | `.selection_color(..)` |
| `dark:` | يكون مظهر النظام داكنًا | `AdaptiveColor`، أو `.dark(\|s\| ..)` |
| `sm:`، `md:`، `lg:`، `xl:`، `2xl:` | يبلغ عرض النافذة 640 أو 768 أو 1024 أو 1280 أو 1536 نقطة على الأقل | `.style_when(\|\| window().width >= px(768.0), \|s\| ..)` |
| `max-sm:`، `max-md:`، ... | تكون النافذة أضيق من نقطة التوقف | الأمر نفسه، مع `<` |
| `min-[600px]:`، `max-[600px]:` | نقاط توقف اعتباطية | الأمر نفسه |
| `portrait:`، `landscape:` | اتجاه النافذة (orientation) | `window().width > window().height` |
| `ios:`، `android:`، `web:` | المنصة | `.when(os() == Os::Ios, \|v\| ..)` |
| `rtl:`، `ltr:` | [اتجاه التخطيط](./layout.md#right-to-left) | `.direction(LayoutDirection::..)` على عرض |
| `motion-safe:`، `motion-reduce:` | إعداد المستخدم لتقليل الحركة | `reduce_motion()` |

تُدمج المتغيّرات: `dark:active:bg-zinc-700`، `md:landscape:flex-row`. في Rust، يكون `AdaptiveColor` داخل نمط `.active(..)` هو `dark:active:`.

```rust tabs
view()
    .group()
    .flex_row()
    .items_center()
    .gap_3()
    .rounded_xl()
    .bg(white())
    .p_3()
    .active(|s| s.bg(ZINC.shade(50)))
    .child(text("Settings").flex_1().text_color(ZINC.shade(900)))
    .child(
        text("›")
            .text_color(ZINC.shade(300))
            .transition_transform()
            .group_active(|s| s.translate_x(px(4.0))),
    )
```

```tsx tabs
<View class="group flex-row items-center gap-3 rounded-xl bg-white p-3 active:bg-zinc-50">
  <Text class="flex-1 text-zinc-900">Settings</Text>
  <Text class="text-zinc-300 transition-transform group-active:translate-x-1">›</Text>
</View>
```

`disabled` على أي عنصر (`.disabled(..)` في Rust) تطبّق فئات `disabled:` (`.disabled_style(..)`) وتزيل معالجات الضغط من المحتوى المركَّب، فلا يُظهر أي ردّ فعل بصري عند الضغط أيضًا:

```rust tabs
view()
    .disabled(saving)
    .on_press(save)
    .rounded_lg()
    .bg(EMERALD.shade(500))
    .px_4()
    .py_2()
    .active(|s| s.bg(EMERALD.shade(600)))
    .disabled_style(|s| s.opacity(0.4))
    .child(text("Save").font_weight(FontWeight::MEDIUM).text_color(white()))
```

```tsx tabs
<View disabled={saving()} onPress={save} class="rounded-lg bg-emerald-500 px-4 py-2 active:bg-emerald-600 disabled:opacity-40">
  <Text class="font-medium text-white">Save</Text>
</View>
```

تُقارَن نقاط التوقف بالنافذة (السطح الذي يرسم عليه NSH)، لا بالجهاز: ففي وضع تقسيم الشاشة على iPad أو في نافذة قابلة لتغيير الحجم، تتبع عرض النافذة، كما تفعل `window()`.

## What differs from Tailwind on the web

- **الوحدات هي النقاط.** `p-4` (`.p_4()`) تساوي 16 نقطة (خطوة تباعد واحدة = 4 نقاط، و1rem = 16 نقطة). والقيم الاعتباطية في `px` بالنقاط أيضًا: `p-[13px]` (`.p(px(13.0))`) تساوي 13 نقطة.
- **`flex` هو صف**، كما في CSS: `class="flex"` يرتّب أبناءه في صف ما لم تقل فئة اتجاه غير ذلك (في أي موضع من السلسلة: `flex-col flex` هو عمود). وكذلك `display: "flex"` في النمط و`.flex()` في Rust صفّان بالطريقة نفسها، أما العرض الذي لا يضبط display فيحتفظ بالعمود الافتراضي في NSH. `block` و`flow-root` تستخدمان تخطيط الكتلة (block)، وكذلك `inline` و`inline-block`، كما يرتّبها المتصفح داخل أب من نوع flex أو grid. وفي Rust، تضبط `.flex_row()` و`.flex_col()` الاتجاه.
- **فئات النص على العروض تُورَّث.** `text-*` و`font-*` و`leading-*` و`tracking-*` وغيرها من أدوات النص على عرض (`.text_color(..)`، `.font_weight(..)`، ... في Rust) تنتقل إلى عناصر النص والإدخال داخله، كما يفعل الوراثة في CSS: `<View class="text-white">` تجعل نصوصه بيضاء.
- **كل عرض صندوق مستقل.** `overflow-x-hidden` و`overflow-y-hidden` تقصّان المحورين معًا، كما تفعل `overflow-hidden` (التمرير من اختصاص عنصر [scroll](../elements/scroll.md))؛ و`invisible` تخفي العرض وكل ما فيه؛ و`mix-blend-*` تمزج العرض بكل ما رُسم خلفه؛ وصناديق `block` تُبقي هوامشها وهوامش أبنائها منفصلة؛ والعرض `absolute` يوضع في أقرب سلف مُموضَع، كما في CSS؛ و`fixed` يرتّب العرض في عرضه الجذر (تُوضع العناصر الأخرى كما في `absolute`).
- **النص يحتفظ بمسافاته البيضاء.** تُرسم المسافات وفواصل الأسطر في النص كما كُتبت، وتضبط `whitespace-*` التفاف الأسطر؛ ويطوي مترجم JSX المسافات البيضاء في نص JSX الحرفي، كما يفعل JSX.
- **الانتقالات تحرّك مجموعات خصائص**: `transition` تحرّك الألوان والشفافية والظلال والتحويلات، و`transition-all` تحرّك أيضًا أنصاف أقطار الزوايا وعروض الحدود؛ أما المرشّحات (filters) ومرشّحات الخلفية والتدرجات والتخطيط فتأخذ قيمها الجديدة دفعة واحدة.
- **`focus-visible:` هي `focus:`**: تُطبَّق كلما كان التركيز على العنصر.
- **خلفيات الحالة تظهر فوق التدرجات.** في CSS يغطي التدرج `background-color`، لذا لن يُرى `active:bg-*` على سطح `bg-linear-*` أبدًا؛ أما في NSH فإن لون خلفية من `active:` أو `hover:` أو `focus:` أو `group-*:` يحلّ محل التدرج ما دامت تلك الحالة قائمة (ما لم تضبط الحالة تدرجًا خاصًا بها، مثل `active:from-*`). وكذلك `activeStyle` وسائر أنماط الحالة، وألوان الخلفية المتحركة.
- **إعدادات النص واللمس مفاتيح أنماط**: `line-clamp-*` تضبط `numberOfLines`، و`text-ellipsis` و`text-clip` تضبطان `textOverflow`، و`truncate` تضبطهما معًا، و`select-*` تضبط `userSelect` و`pointer-events-*` تضبط `pointerEvents`، لذا فهي تعمل في متغيّرات الحالة وتخسر أمام `style` المضمَّنة كما تخسر كل فئة؛ و`caret-*` و`placeholder:text-*` و`selection:bg-*` تضبط أنماط `caretColor` و`placeholderColor` و`selectionColor` بالطريقة نفسها. وفي Rust هذه دوال `Styled` (`.number_of_lines(..)`، `.truncate()`، `.text_overflow(..)`، `.select_text()`، `.pointer_events(..)`، ...). `whitespace-nowrap` تُبقي النص في سطر واحد كفئة. و`object-*` تضبط نمطي `objectFit` و`objectPosition` للصور ومقاطع الفيديو، وتستبدلهما مفاتيح النمط كما تستبدل أي مفتاح آخر.
- **المجموعة المدعومة**: أدوات ومتغيّرات Tailwind 4 التي لها معنى أصلي. متغيّرات `peer-*` والعناصر الزائفة (pseudo-elements) (`before:`، `after:`) والخصائص الاعتباطية (`[mask-type:luminance]`) يُبلَّغ عنها كفئات غير معروفة، وكذلك كل أداة لا معنى أصليًا لها في NSH، حتى لا تعني الفئة شيئًا مختلفًا عمّا تعنيه في المتصفح. أما تلميحات التصيير (`antialiased`، `will-change-transform`، `appearance-none`، `box-border`، ...) فتُقبل ولا تغيّر شيئًا.

وكل ما عدا ذلك يعمل كما يوثّقه Tailwind 4: لوحة الألوان، ومعدّلات الشفافية (`bg-black/40`)، والقيم الاعتباطية (`bg-[#34c759]`، `w-[72px]`، `grid-cols-[1fr_2fr]`؛ وعلى `p` و`px` و`py` و`pt` و`pr` و`pb` و`pl` وأدوات `m` أيضًا متغيّرات البيئة، `pt-[env(safe-area-inset-top)]`، `pb-[calc(env(keyboard-inset-height)+49px)]`، انظر [المنطقة الآمنة](../elements/safe-area.md) و[لوحة المفاتيح](../elements/keyboard.md))، والكسور (`w-1/2`، `translate-x-1/2`)، والظلال والحلقات، والتدرجات (`bg-linear-to-r`، `bg-radial`، `bg-conic` مع `from-` / `via-` / `to-`)، والمرشّحات، و`backdrop-blur-*`، و`mix-blend-*`، والتحويلات، و`transition-*` و`duration-*`، و`animate-spin` / `ping` / `pulse` / `bounce`، والشبكة (grid)، ولكل منها دالتها المُنمَّطة في Rust. وتنطبق قيود المنصات الخاصة بـ[المرشّحات والمزج](./styling.md#filters-and-blending) على الفئات أيضًا.

## Theme

تُحلّ الفئات مقابل سمة Tailwind 4 الافتراضية. وسّعها في `nsh.json` تحت `"tailwind"`؛ تُضاف مدخلاتك إلى الافتراضيات (أو تستبدل الافتراضي الذي يحمل الاسم نفسه):

```json
{
  "tailwind": {
    "colors": {
      "brand": { "50": "#f5f3ff", "500": "#7c3aed", "600": "#6d28d9", "DEFAULT": "#7c3aed" },
      "ink": "#1f2328"
    },
    "radius": { "card": 14 },
    "fontFamily": { "display": "Pacifico" },
    "breakpoints": { "tablet": 600 }
  }
}
```

مع هذه السمة، تكون `bg-brand-500` و`text-brand` (درجة `DEFAULT`) و`border-ink` و`rounded-card` و`font-display` و`tablet:flex-row` فئات صالحة.

| المفتاح | القيم | ينتج |
|---|---|---|
| `colors` | لون CSS، أو كائن من الدرجات (`"DEFAULT"` للاسم المجرد) | `bg-*`، `text-*`، `border-*`، `from-*`، `ring-*`، ... |
| `spacing` | نقاط لكل خطوة تباعد (الافتراضي 4) | `p-*`، `m-*`، `gap-*`، `w-*`، ... |
| `rem` | نقاط لكل `rem` في القيم الاعتباطية (الافتراضي 16) | |
| `breakpoints` | نقاط | متغيّرات `name:` |
| `container` | نقاط | أحجام `max-w-*` |
| `fontSize` | نقاط، أو `[size, lineHeight]` مع ارتفاع سطر يساوي مضاعفًا للحجم | `text-*` |
| `fontWeight` | 1–1000 | `font-*` |
| `fontFamily` | اسم عائلة خطوط (عائلة نظام أو اسم [خط مستورد](./fonts.md)) | `font-*` |
| `tracking` | em | `tracking-*` |
| `leading` | مضاعفات حجم الخط | `leading-*` |
| `radius` | نقاط | `rounded-*` |
| `shadow`، `insetShadow`، `dropShadow` | قيمة CSS من نوع `box-shadow` | `shadow-*`، `inset-shadow-*`، `drop-shadow-*` |
| `blur` | نقاط | `blur-*`، `backdrop-blur-*` |
| `perspective` | نقاط | `perspective-*` |
| `aspect` | نسبة (`1.5`) | `aspect-*` |
| `ease` | `[x1, y1, x2, y2]` | `ease-*` |

المفاتيح غير المعروفة والقيم غير الصالحة هي أخطاء بناء (`nsh.json: tailwind: unknown theme key 'colours'`). وتُترجَم السمة ضمن الحزمة وتُطبَّق قبل الإطار الأول.

تشكّل سمة Tailwind فئاتك. أما الدوال المُنمَّطة فتحتفظ بمقاييس Tailwind الافتراضية، لذا يبدو مكوّن Rust متماثلًا في كل تطبيق، وتأخذ مظهر التطبيق من رموز التصميم (design tokens) في سمته، `"theme"` في `nsh.json` ([Rust](./rust.md#theme)).
<a id="theme-tokens"></a>

## رموز السمة

تحتوي سمة التطبيق (`"theme"` في `nsh.json`) على رموز التصميم الخاصة به: ألوان shadcn/ui (`background`، `foreground`، `primary`، `muted-foreground`، `border`، `ring`، `chart-1`، `sidebar`، ...)، و`radius`، وخطوطه `font-sans` و`font-mono`، وأي رمز يضيفه التطبيق. تسمّي الأصناف هذه الرموز بأسماء Tailwind كما تسمّي متغيرات `@theme` في CSS، وتقرؤها مكونات Rust باستخدام `theme()` من `nsh_base`، ويقرؤها TSX باستخدام `token()` من `nsh`، فتتبع شاشة TSX ومكونات Rust السمة نفسها:

```rust tabs
use nsh_base::theme;

view()
    .rounded(move || theme().radius)
    .border_1()
    .border_color(move || theme().border)
    .bg(move || theme().card)
    .p_4()
    .child(text("Balance").text_color(move || theme().card_foreground))
    .child(text("Updated just now").text_color(move || theme().muted_foreground))
    .child(
        view()
            .rounded(move || theme().radius)
            .bg(move || theme().primary)
            .px_4()
            .py_2()
            .active(|s| s.bg(move || theme().primary.opacity(0.9)))
            .child(text("Continue").text_color(move || theme().primary_foreground)),
    )
```

```tsx tabs
<View class="rounded-(--radius) border border-border bg-card p-4">
  <Text class="text-card-foreground">Balance</Text>
  <Text class="text-muted-foreground">Updated just now</Text>
  <View class="rounded-(--radius) bg-primary px-4 py-2 active:bg-primary/90">
    <Text class="text-primary-foreground">Continue</Text>
  </View>
</View>
```

اسم الرمز هو اسم متغير CSS الخاص به دون `--`، كما يكتبه ملف السمة: `muted-foreground`، `radius`، `chart-1`. في Rust، رموز shadcn هي دوال في `theme()` (`primary()`، `muted_foreground()`، `radius()`، `font_mono()`)، وكل رمز هو `theme().color("up")` أو `theme().number("radius-card")` أو `theme().font("font-display")`.

| الصيغة | ما تأخذه | مثال |
|---|---|---|
| اسم لون في أي أداة لونية | لون من السمة، مع إمكانية تحديد الشفافية | `bg-primary`، `text-muted-foreground/70`، `bg-up/30`، `border-t-border`، `ring-ring`، `from-accent`، `placeholder:text-muted-foreground` |
| `(--name)`، اختصار المتغيرات في Tailwind 4 | لون من السمة أو رقم | `bg-(--primary)`، `rounded-(--radius)`، `p-(--gap-card)` |
| `(color:--name)`، `(length:--name)`، `(number:--name)`، `(family-name:--name)` | الشيء نفسه، لكن بنوع محدد حيث تقبل الأداة عدة أنواع | `text-(color:--up)`، `text-(length:--text-title)`، `font-(family-name:--font-mono)` |
| `font-sans`، `font-mono` | خطوط السمة، إن حددتها | `font-mono` |

- **رموزك الخاصة.** كل اسم في ملف السمة هو رمز، كما أن كل متغير في `@theme` في CSS كذلك: `"up": "#16a34a"` ينشئ `bg-up` و`text-up` و`bg-up/30`؛ و`"radius-card": "14px"` ينشئ `rounded-(--radius-card)`؛ و`"font-display": "Pacifico"` ينشئ `font-(family-name:--font-display)`. الأطوال بالنقاط (points)؛ و`(number:--name)` يمرّر الرقم كما هو.
- **الخطوط.** `font-sans` هو خط التطبيق: كل نص لا يحدد عائلة خط خاصة به يُرسم به، كما تُرسم الصفحة بالخط `--font-sans` في Tailwind. `font-mono` هو خط `font-mono` والشيفرة في `TextView`. إن لم يُحدَّدا، فكلاهما من خطوط النظام.
- **المظهران معًا.** للرمز قيمة فاتحة وقيمة داكنة في السمة: `bg-primary` و`theme().primary` و`token("primary")` تتبدل مع المظهر تلقائيًا، دون الحاجة إلى الصنف `dark:`. اللون الذي تحدده السمة في مظهر واحد فقط يُستخدم في المظهرين.
- **ألوان Tailwind الخاصة بك لها الأولوية.** الاسم في `"tailwind"` `colors` أو في لوحة ألوان Tailwind هو ذلك اللون، لذا يكون `bg-primary` رمزًا من السمة عندما لا يحتوي سمة Tailwind على اللون `primary`.
- **يمكن أن تتغير السمة أثناء تشغيل التطبيق.** عندما يُعطى تطبيق مضمّن في تطبيق أصلي سمةَ ذلك التطبيق، وكلما تغيّرت السمة، تُحدَّث الأصناف التي تسمّي الرموز، وروابط Rust التي تقرأ `theme()`، وشيفرة TSX التي تقرأ `token()`، علمًا بأن الأصناف والروابط تُحدَّث بشكل أصلي. الرموز التي لا توجد في سمة التطبيق المضيف تحتفظ بقيم `"theme"` الخاصة بالتطبيق (ثم قيم السمة الافتراضية). المضيف الذي يضيف علامته التجارية فقط يعطي تجاوزات للسمة، وهي الرموز التي تغيّرها علامته التجارية بصيغة الملف نفسها ([iOS](./ios.md#theme-overrides)، [Android](./android.md#theme-overrides)، و`AppView::set_theme_overrides` على أنظمة سطح المكتب).
- **تُفحص كبقية الأصناف.** الاسم الذي ليس رمزًا في السمة الافتراضية ولا في `"theme"` الخاص بالتطبيق هو صنف غير معروف عند البناء (`unknown class 'bg-chart-up'`). لاستخدام رمز يوفره التطبيق المضيف فقط، أعطِه قيمة في `"theme"` الخاص بالتطبيق أيضًا: ستظهر هذه القيمة عندما يعمل التطبيق بمفرده.

تُحَلّ الأصناف التي تسمّي الرموز مرة واحدة لكل سمة، مثل أي صنف آخر: ورسمها يكلّف ما يكلّفه لون من اللوحة.

<a id="445-in-tsx"></a>

### `token()` في TSX

`token(name)` من `nsh` هو قيمة الرمز في المظهر المعروض: اللون على هيئة `#rrggbbaa`، والطول كعدد من النقاط، والخط كاسم عائلته. وهو تفاعلي (reactive)، فالشيفرة التي تقرؤه داخل مكوّن أو memo أو effect تُعاد عند تغيّر السمة أو المظهر، وهذا مناسب للقيم التي تذهب إلى أماكن لا يصلها صنف، مثل canvas أو مخطط بياني:

```tsx
import { Canvas, token } from "nsh";

<Canvas
  style={{ height: 160 }}
  draw={(cx, { width, height }) => {
    cx.beginPath();
    cx.moveTo(0, height);
    cx.lineTo(width, 0);
    cx.strokeStyle = token("chart-1");
    cx.lineWidth = 2;
    cx.stroke();
  }}
/>
```

الأسماء محددة الأنواع: يكتب NSH رموز التطبيق في `.nsh/types/nsh/tokens.d.ts` انطلاقًا من سمته، فيكون `token("up")` من النوع `string` ما دام `"up"` موجودًا في السمة، والاسم غير الموجود في السمة يُعدّ خطأ في النوع.

<a id="the-class-check"></a>

## فحص الأصناف

`nsh build` و`nsh dev` و`nsh run` و`nsh test` تفحص أسماء الأصناف الثابتة في JSX (السلاسل النصية الحرفية في `class` ومفاتيح `classList`) باستخدام المحلل والسمة نفسيهما اللذين يستخدمهما وقت التشغيل، وتحذّر من الأصناف غير الموجودة:

```text
 warn nsh::build App.tsx:12:36: unknown class `bg-brand-550`
```

التحذيرات لا تفشل البناء. أما الأصناف التي تُبنى وقت التشغيل (``bg-${color()}-500``) فتُفحص عندما يراها وقت التشغيل لأول مرة، ويسجّل كل صنف غير معروف مرة واحدة (`unknown classes: ...`). الدوال محددة الأنواع يفحصها مترجم Rust.

<a id="classes-or-styles"></a>

## الأصناف أم الأنماط؟

كلاهما يُحَلّ بشكل أصلي وبكلفة متقاربة. الأصناف أقصر وتمنحك المتغيرات (حالات الضغط، والوضع الداكن، ونقاط التوقف) دون كتابة شيفرة. أما الأنماط المضمنة فتقبل القيم المحسوبة في JavaScript وتدعم [القيم المتحركة الأصلية](./animation.md) (`opacity: fade`، `translate: [x, 0]`). تستخدم معظم تطبيقات TSX الأصناف للمظهر الثابت و`style` لما هو محسوب أو متحرك. أما مكونات Rust فتستخدم الدوال محددة الأنواع للحالتين، وتربط القيم المتحركة بـ`.bind_opacity(..)` و`.bind_translate_x(..)` وبقية الروابط.

<a id="related"></a>

## مواضيع ذات صلة

- [التنسيق](./styling.md): خاصية style، والدوال محددة الأنواع، وحدود المنصات في التأثيرات.
- [مرجع Tailwind](../modules/tailwind-reference.md): كل الأدوات والمتغيرات.
- [التخطيط](./layout.md): flexbox وgrid، وهما متاحان أيضًا كأصناف.
