---
title: "Slider"
description: "مكوّن Slider: قيمة واحدة أو نطاق من قيمتين يتم اختياره على امتداد مسار، مع دعم الضغط والسحب على شاشات اللمس وبالفأرة، ومفاتيح slider وفق WAI-ARIA، وقيمة لقارئات الشاشة على كل مقبض، إضافةً إلى مسار ومؤشر ونطاق ومقابض يمكن للتطبيق تنسيقها."
group: base
demo: el-slider
source_hash: 5dfd7ea970e4cd98
---

# Slider

يختار Slider قيمة على امتداد مسار (مستوى الصوت، السطوع)، أو نطاقًا من قيمتين لكل منهما مقبض (نطاق السعر). يتولى سلوكه بنفسه: الضغط على المسار ينقل أقرب مقبض إلى موضع الضغط، ويتبع المقبض السحب سواء بالماوس أو بالإصبع؛ وتُقرَّب القيم إلى `step`؛ وكل مقبض نقطة توقف في تركيز لوحة المفاتيح ويتحرك بمفاتيح الأسهم، وهو عنصر قابل للضبط لقارئات الشاشة بقيمته الخاصة. أما المظهر فمن شأن التطبيق: فـ `Slider` لا يملك ألوانًا أو أحجامًا أو أنصاف أقطار أو حركة خاصة به. يتكوّن من مسار بداخله مؤشر، ومن النطاق والمقابض على المؤشر، ثم عناصره الفرعية (تسمية، القيمة كنص)، ويتولى التطبيق تنسيق كل جزء.

```rust tabs
use nsh_base::{SliderValue, slider, theme};
use nsh_core::prelude::*;

fn strength(level: Signal<SliderValue>) -> impl IntoElement {
    let percent = move || format!("{}%", level.get().end());
    slider()
        .value(move || level.get())
        .accessibility_label("Option strength")
        .on_change(move |next: &SliderValue| level.set(*next))
        // The value in a column after the rail.
        .flex_row()
        .items_center()
        .gap_2()
        // An 8-point rail; the thumbs travel inside it.
        .track_style(|s| s.h(px(8.0)).flex_1().px(px(8.0)).rounded_full().bg(move || theme().muted))
        .indicator_style(|s| s.h_full())
        // The fill, from the rail's edge, fading into the thumb's tone.
        .range_style(|s| {
            s.ml(-px(8.0))
                .rounded_full()
                .bg_linear_to_r()
                .gradient_from(move || theme().primary)
                .gradient_to(move || theme().muted_foreground)
        })
        // A 16 x 8 pill sitting in the rail.
        .thumb_style(|s| {
            s.w(px(16.0))
                .h(px(8.0))
                .rounded_full()
                .bg(move || theme().muted_foreground)
                .hover(|s| s.brightness(1.1))
                .active(|s| s.brightness(1.25))
        })
        .child(
            text(percent)
                .w(px(42.0))
                .text_right()
                .text_xs()
                .tabular_nums()
                .text_color(move || theme().muted_foreground),
        )
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { Slider } from "nsh/base";

function App() {
  const strength = signal(64);
  return (
    <Slider
      value={strength()}
      onChange={({ value }) => strength.set(value as number)}
      accessibilityLabel="Option strength"
      class="flex-row items-center gap-2"
      trackClass="h-2 flex-1 px-2 rounded-full bg-muted focus-within:ring-2 focus-within:ring-primary/36 focus-within:ring-offset-2 focus-within:ring-offset-background disabled:opacity-35"
      indicatorClass="h-full"
      rangeClass="-ml-2 rounded-full bg-linear-to-r from-primary via-primary to-muted-foreground"
      thumbClass="h-2 w-4 rounded-full bg-muted-foreground transition hover:brightness-110 active:brightness-125 focus:outline-none disabled:brightness-100 motion-reduce:transition-none"
      thumbStyle={{ boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.18), 0 0 0 1px rgba(0, 0, 0, 0.42)" }}
    >
      <Text class="w-[42px] text-right font-mono text-[11px] text-muted-foreground">{`${strength()}%`}</Text>
    </Slider>
  );
}

mount(App);
```

يأتي `Slider` من [`nsh/base`](../modules/nsh-base.md)، وهي حزمة `nsh-base` في Rust. في Rust، ينشئ `slider()` مثيلًا منه بدالة ضبط لكل خاصية (`.value(..)`، `.thumb_style(..)`)، ودالة مستمع لكل حدث (`.on_change(..)`)، ودوال التنسيق المطبوعة لـ Slider نفسه، و`.child(..)` لتسميته. قيمته من النوع `SliderValue`: `Single(f64)` أو `Range(f64, f64)`.

<a id="value"></a>

## القيمة

القيمة رقم، أو `[start, end]` لنطاق بمقبضين؛ فشكل القيمة هو ما يحدد عدد المقابض. يملك التطبيق القيمة عبر `value` ويضبط القيمة التي يبلغ عنها `onChange`، كما في كل عنصر تحكم في `nsh/base`؛ أو يترك القيمة لـ Slider عبر `defaultValue`، ويسمع التغييرات مع ذلك. أثناء السحب يتبع المقبضان والنطاق المؤشر في الإطار نفسه، محليًا؛ وعند رفع المؤشر يظهر `value` الخاص بالتطبيق مجددًا، كما ضبطه التطبيق لآخر تغيير في السحب؛ وتسمع قارئات الشاشة قيم السحب تباعًا أثناء جريانه، وقيمته النهائية بخلاف ذلك.

```tsx
const price = signal<[number, number]>([200, 800]);

<Slider
  value={price()}
  onChange={({ value }) => price.set(value as [number, number])}
  onChangeEnd={({ value }) => save(value)}
  min={0}
  max={1000}
  step={10}
  accessibilityLabel="Maximum price"
  startAccessibilityLabel="Minimum price"
/>;
```

- يبلغ `onChange` عن كل قيمة جديدة يطلبها المستخدم: عند الضغط على المسار، وعند كل خطوة من السحب، ولكل مفتاح. وكل بلاغ يحمل قيمة جديدة.
- يبلغ `onChangeEnd` عن القيمة التي انتهى عندها التغيير، مرة واحدة: عند رفع المؤشر بعد ضغط أو سحب ضبط قيمة، وبعد كل خطوة بمفتاح أو بقارئ شاشة (وكل منها تغيير كامل). احفظ القيمة أو أرسلها هناك.
- تُقرَّب القيم إلى `step`، محسوبة من `min` (`min={1} step={2}` يعطي 1، 3، 5، ...)، وتبقى بين `min` و`max`؛ و`max` قابلة للوصول دائمًا، فتكون الخطوة الأخيرة أقصر حين لا يكون النطاق عددًا صحيحًا من الخطوات. ويقبل `step={0}` أي قيمة.
- لا يتخطى مقبضا النطاق أحدهما الآخر: المقبض المسحوب يتوقف عند الآخر. والسحب الذي يبدأ على مقبضين عند قيمة واحدة يحرّك المقبض القادر على الذهاب في اتجاه المؤشر.
- القيمة المعروضة هي قيمة التطبيق، مقيَّدة بـ `min` و`max` (وبترتيب طرفي النطاق)، والقيمة الخارجة عن شبكة الخطوة تُعرض في موضعها؛ ويقرّبها تغيير المستخدم التالي.

<a id="props"></a>

## الخصائص

| الخاصية | Rust | النوع | الافتراضي | الوصف |
|---|---|---|---|---|
| `value` | `.value(..)` | `number \| [number, number]` | لا شيء | القيمة (متحكَّم بها): رقم، أو نطاق بمقبضين. يضبط التطبيق القيمة التي يبلغ عنها `onChange`. |
| `defaultValue` | `.default_value(..)` | `number \| [number, number]` | `0` | القيمة الأولية ما دام `value` غير مضبوط؛ ويحتفظ Slider عندئذٍ بقيمته الخاصة. |
| `min` | `.min(..)` | `number` | `0` | أصغر قيمة. |
| `max` | `.max(..)` | `number` | `100` | أكبر قيمة؛ والقيمة الأقل من `min` تصبح `min`. |
| `step` | `.step(..)` | `number` | `1` | الخطوة التي تُقرَّب إليها القيم، محسوبة من `min`؛ ويقبل `0` أي قيمة. |
| `scale` | `.scale(..)` | `"linear" \| "logarithmic"` | `"linear"` | كيفية توزع القيم على المسار: بالتساوي، أو بحسب رتب المقدار (من 1 إلى 1000، ثلث المسافة هو 10). يتطلب اللوغاريتمي أن يكون `min` أكبر من 0؛ ومع `min` أقل يكون خطيًا. |
| `axis` | `.axis(..)` | `"horizontal" \| "vertical"` | `"horizontal"` | اتجاه المسار: `min` عند البداية (اليسار، واليمين في التخطيط من اليمين إلى اليسار)، أو عند الأسفل. يُقرأ عند إنشاء Slider. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | لا تغييرات من المؤشر أو لوحة المفاتيح أو قارئ الشاشة؛ وتُطبَّق فئات `disabled:` على Slider وأجزائه. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | لا شيء | ما تنطق به قارئات الشاشة للمقبض (وفي النطاق، لمقبض النهاية). |
| `startAccessibilityLabel` | `.start_accessibility_label(..)` | `string` | `accessibilityLabel` | ما تنطق به قارئات الشاشة لمقبض بداية النطاق. |
| `trackClass`، `trackStyle` | `.track_style(\|s\| ..)` | `string`، `StyleProp<ViewStyle>` | لا شيء | المسار: المنطقة التي تستقبل الضغطات والسحب. |
| `indicatorClass`، `indicatorStyle` | `.indicator_style(\|s\| ..)` | `string`، `StyleProp<ViewStyle>` | لا شيء | المؤشر، السكة التي تُربط بها القيم. |
| `rangeClass`، `rangeStyle` | `.range_style(\|s\| ..)` | `string`، `StyleProp<ViewStyle>` | لا شيء | النطاق، من `min` إلى المقبض (وبين مقبضي النطاق)، ويضعه Slider. |
| `thumbClass`، `thumbStyle` | `.thumb_style(\|s\| ..)` | `string`، `StyleProp<ViewStyle>` | لا شيء | كل مقبض، متمركز على قيمته. |
| `children` | `.child(..)` | `JSX.Element` | لا شيء | المحتوى بعد المسار: تسمية، القيمة كنص. |
| `class`، `style` | دوال التنسيق | `string`، `StyleProp<ViewStyle>` | لا شيء | Slider نفسه: العمود (أو الصف) المحيط بالمسار والتسمية. |

<a id="events"></a>

## الأحداث

| الحدث | Rust | الحمولة | متى |
|---|---|---|---|
| `onChange` | `.on_change(\|value: &SliderValue\| ..)` | `{ value: number \| [number, number] }` | طلب المستخدم قيمة جديدة: ضغطة على المسار، أو خطوة من السحب، أو مفتاح، أو زيادة أو إنقاص من قارئ الشاشة. |
| `onChangeEnd` | `.on_change_end(\|value: &SliderValue\| ..)` | `{ value: number \| [number, number] }` | انتهى التغيير: رُفع المؤشر، أو اكتملت خطوة بمفتاح أو بقارئ شاشة. مرة واحدة لكل تغيير. |

<a id="parts"></a>

## الأجزاء

| الجزء | بداخل | يُنسَّق بـ |
|---|---|---|
| Slider | | `class`، `style` |
| المسار | Slider، أولًا | `trackClass`، `trackStyle` |
| المؤشر | المسار | `indicatorClass`، `indicatorStyle` |
| النطاق | المؤشر، يوضع بحسب القيم | `rangeClass`، `rangeStyle` |
| مقبض (اثنان في النطاق) | المؤشر، متمركز على قيمته | `thumbClass`، `thumbStyle` |
| التسمية | Slider، بعد المسار | عناصرها الخاصة (`children`) |

يستقبل المسار الضغطات والسحب. طول المؤشر هو نطاق القيم، من `min` عند حافته الأمامية (عند أسفله في الوضع العمودي)؛ ويضع Slider النطاق والمقابض عليه، فيتمركز كل مقبض على قيمته مهما كان حجمه. طريقتان لتخطيطها:

- المسار هو السكة (المثال أعلاه): `h-2 px-2 rounded-full bg-muted` مع مؤشر `h-full`. تُبقي الحشوة المقابض داخل السكة عند الطرفين، ويبدأ `-ml-2` الخاص بالنطاق التعبئة من حافة السكة نفسها.
- المسار شريط حول السكة، أطول ليسهل العثور عليه بالإصبع على شاشة اللمس: `h-8 justify-center` مع مؤشر `h-2 rounded-full` (و`w-8 items-center` و`w-2 h-full` في Slider العمودي).

الحالات التي تعرضها الأجزاء:

- المقبض: `hover:` تحت المؤشر، و`active:` أثناء سحبه، و`focus:` مع تركيز لوحة المفاتيح، و`disabled:`.
- المسار: `active:` أثناء سحب ناتج عن ضغطة عليه؛ وهو `group`، فيأخذ المؤشر والنطاق والمقابض `group-hover:` و`group-active:` منه.
- كل جزء: `disabled:` ما دام Slider كذلك.

تتحرك المقابض مع تغير القيمة، وتتبع السحب فورًا. أما حركة حالات المقابض فاختيار التطبيق (`transition` لمقبض يزداد سطوعه عند `hover:` و`active:`)، ويُبقيها `motion-reduce:` ساكنة لمن يطلبون حركة أقل. وتركيز لوحة المفاتيح للمقبض: يحيط `focus-within:` على المسار بالسكة كلها بينما يملك مقبض التركيز، ويحل `focus:outline-none` الخاص بالمقبض محل مخطط التركيز الأصلي للمنصة.

<a id="keyboard"></a>

## لوحة المفاتيح

على macOS والويب يكون كل مقبض نقطة توقف في تركيز لوحة المفاتيح (Tab)، ويستجيب المقبض المركَّز لمفاتيح slider في WAI-ARIA:

| المفتاح | الوظيفة |
|---|---|
| السهم الأيمن، السهم الأعلى | خطوة واحدة للأعلى (وفي Slider العمودي أيضًا). |
| السهم الأيسر، السهم الأسفل | خطوة واحدة للأسفل. |
| Page Up، Page Down | عُشر النطاق للأعلى أو للأسفل (على امتداد المقياس)، وخطوة واحدة على الأقل. |
| Home، End | إلى أقصى ما يبلغه المقبض للأسفل أو للأعلى (من بداية النطاق حتى نهايته). |

في التخطيط من اليمين إلى اليسار يمتد Slider الأفقي من اليمين، و`min` الخاص به عند الطرف الأيمن: السهم الأيسر خطوة للأعلى والسهم الأيمن خطوة للأسفل، والسحب نحو اليسار يرفع القيمة. ويبقى السهم الأيمن والسهم الأعلى خطوة للأعلى في Slider العمودي.

كل مفتاح يغيّر القيمة يبلغ عن `onChange` ثم `onChangeEnd`. وتتكرر الأسهم والصفحات ما دامت مضغوطة. ولا تصل المفاتيح إلى Slider إلا حين لا يكون هناك إدخال نصي قيد التحرير.

<a id="accessibility"></a>

## إمكانية الوصول

- كل مقبض عنصر قابل للضبط (`"adjustable"`، وهو slider في المتصفح) مع تسميته وقيمته والقيم التي يمكن أن يتخذها: بداية النطاق من `min` حتى النهاية، ونهايته من البداية حتى `max`، فتقرأ قارئات الشاشة القيمتين وتضبطهما. وتُنطق القيمة رقمًا بخانات الخطوة العشرية (`2.5`).
- تحرك إجراءا الزيادة والإنقاص في قارئ الشاشة (تمريرة VoiceOver للأعلى وللأسفل) المقبض بخطوة، كما تفعل مفاتيح الأسهم.
- المقابض هي عناصر Slider لقارئات الشاشة، وتُسمّى بـ `accessibilityLabel` (وبداية النطاق بـ `startAccessibilityLabel`)؛ وتُقرأ التسمية المرئية بين عناصره الفرعية في موضعها.
- ما دام `disabled`، تقول قارئات الشاشة إن المقابض معتمة، ولا تقبل أي إجراءات.

راجع [إمكانية الوصول](../docs/accessibility.md) للاطلاع على التسميات والأدوار والإجراءات عمومًا.

<a id="platform-notes"></a>

## ملاحظات المنصات

- تعرض كل منصة ما ينسّقه التطبيق. وتُتابَع الضغطات والسحب في النواة، للماوس أو القلم أو الإصبع، ولا تأخذ طريقة عرض التمرير المحيطة بـ Slider سحبًا بدأ عليه.
- ينقل Tab تركيز لوحة المفاتيح بين المقابض على macOS والويب، حيث يستجيب المقبض المركَّز لمفاتيح Slider.
- قارئات الشاشة: يضبط VoiceOver (iOS، macOS) وTalkBack كل مقبض؛ وتحصل UI Automation (Windows) وإمكانية الوصول في GTK (Linux) والمتصفح (`role="slider"`، `aria-valuenow`، `aria-valuetext`) على نطاقه وقيمته.
