---
title: "Calendar"
description: "مكوّن Calendar: لاختيار تاريخ أو نطاق من التواريخ من خلال أشهر وأيام، مع عرضين للشهر والسنة ودعم لوحة المفاتيح، ويمكن للتطبيق تنسيقه."
group: base
demo: el-date-picker
source_hash: 48766bd0cb573ae0
---

# Calendar

يتيح التقويم (Calendar) اختيار تاريخ، أو نطاق من التواريخ عند استخدام `range`، من أشهر تُعرض أيامها مرتبة في أسابيع: تاريخ استحقاق في نموذج، أو ليالي إقامة، أو أيام تقرير. يعرض شهرًا واحدًا أو عدة أشهر جنبًا إلى جنب، ويقلّب الأشهر بزرَّي السابق والتالي، وينتقل إلى عرض أشهر السنة أو إلى صفحة من السنوات للوصول إلى تواريخ بعيدة. وهو التقويم نفسه الذي يظهر في النافذة المنبثقة لـ [DatePicker](./date-picker.md)، لكنه هنا قائم بذاته في الصفحة.

يمتلك التقويم السلوك: القيمة (من التطبيق أو من التقويم نفسه)، والشهر المعروض، وأنماط العرض، والأيام التي لا يمكن اختيارها، ولوحة المفاتيح، وما تنطق به قارئات الشاشة. أما المظهر فمن مسؤولية التطبيق: ينسّق الترويسة والجسم وكل شهر وكل صف وكل عنصر، ويرسم محتوى العناصر (أسماء الأشهر وأيام الأسبوع، وعلامة اليوم الحالي، وشريط النطاق). تملأ الشبكة العرض المتاح لها كما تفعل أعمدة الجدول: تتقاسم الأشهر العرض، وتتقاسم عناصر الصف الصف بالتساوي. لذلك يمتد التقويم في ورقة سفلية على الهاتف على عرض الشاشة كلها، أما في نافذة منبثقة يُحدَّد حجمها بحسب محتواها فيحتفظ بعرض عناصره (`flex-none` في `itemClass` أو `monthClass` يُبقي العنصر أو الشهر على عرضه الخاص).

```rust tabs
use nsh_base::{CalendarEntry, CalendarItemKind, Date, Matcher, calendar};
use nsh_core::prelude::*;

const MONTHS: [&str; 12] = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];
const WEEKDAYS: [&str; 7] = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

fn due_date() -> impl IntoElement {
    let due = signal(Date::default());
    calendar()
        .value(move || due.get())
        .on_change(move |next: &Date| due.set(*next))
        .disabled_matcher(Matcher::DayOfWeek(vec![0, 6]))
        .previous_accessibility_label("Previous month")
        .next_accessibility_label("Next month")
        .item_class("rounded-md selected:bg-primary selected:text-primary-foreground disabled:opacity-50")
        .render_item(|item: &CalendarEntry| {
            let label = match item.kind {
                CalendarItemKind::Previous => "‹".to_string(),
                CalendarItemKind::Next => "›".to_string(),
                CalendarItemKind::Weekday => WEEKDAYS[item.value as usize].to_string(),
                CalendarItemKind::MonthToggle | CalendarItemKind::Month => {
                    MONTHS[item.value as usize - 1].to_string()
                }
                _ => item.value.to_string(),
            };
            view()
                .w_8()
                .h_8()
                .items_center()
                .justify_center()
                .child(text(label).text_sm())
        })
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { Calendar, type CalendarValue } from "nsh/base";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function App() {
  const due = signal<CalendarValue>(null);
  return (
    <Calendar
      value={due()}
      onChange={({ value }) => due.set(value)}
      disabledMatcher={[0, 6]}
      previousAccessibilityLabel="Previous month"
      nextAccessibilityLabel="Next month"
      class="w-72 gap-2 rounded-lg border border-border p-3"
      headerClass="flex-row items-center justify-between"
      rowClass="flex-row justify-between"
      itemClass="group h-8 min-w-8 items-center justify-center rounded-md text-sm focus:ring-2 focus:ring-ring selected:bg-primary selected:text-primary-foreground data-range-middle:rounded-none data-range-middle:bg-accent data-range-middle:text-accent-foreground data-outside:text-muted-foreground disabled:opacity-50"
      renderItem={(item) => (
        <Text class={item.today ? "font-semibold" : ""}>
          {item.kind === "weekday"
            ? WEEKDAYS[item.value]
            : item.kind === "month" || item.kind === "monthToggle"
              ? MONTHS[item.value - 1]
              : item.kind === "previous"
                ? "‹"
                : item.kind === "next"
                  ? "›"
                  : String(item.value)}
        </Text>
      )}
    />
  );
}

mount(App);
```

يأتي `Calendar` من [`nsh/base`](../modules/nsh-base.md)، وهي الحزمة `nsh-base` (crate) في Rust. في Rust، يُنشئ `calendar()` مكوّنًا بدالة ضبط (setter) لكل خاصية (`.value(..)`، `.range(..)`، `.number_of_months(..)`) ومستمع لكل حدث (`.on_change(..)`). قيمته من النوع `Date` (`Date::Single` أو `Date::Range`، من `chrono::NaiveDate` أو من زوج منها)، والأيام التي يعطّلها من النوع `Matcher`.

<a id="value"></a>

## القيمة

القيمة تاريخ بصيغة ISO، `"2026-10-28"`، كما في `<input type="date">` في HTML؛ ومع `range` تكون `[start, end]`، وتعني `null` عدم وجود تاريخ. مع `value` يملك التطبيق القيمة: يعرضها التقويم محددة ويُبلغ عن الاختيار عبر `onChange({ value })`؛ ويضبط التطبيق `value` ليتابعها. إذا لم تُحدَّد، يحتفظ التقويم بقيمته الخاصة، بدءًا من `defaultValue`.

يُبلغ `onChange` عن القيم الكاملة فقط، كما يفعل `gpui-base` عبر `Selected`: يومٌ تم الضغط عليه، أو نهاية نطاق.

- بدون `range`، يؤدي الضغط على يوم إلى اختياره.
- مع `range`، يبدأ الضغط الأول النطاق ويُنهيه الضغط الثاني، وتدخل الأيام بينهما في النطاق (كلٌّ منها `selected`، بما فيها طرفاه، انظر [العناصر](#items)). الضغط الثاني على يوم أسبق يعيد بدء النطاق منه، وكذلك الضغط بعد اكتمال النطاق. يظل نصف النطاق معروضًا حتى يكتمل، ولا يُبلَّغ عنه إلا حينها.

يُفتح التقويم على شهر القيمة (أو شهر بداية النطاق)، وإلا على الشهر الحالي.

<a id="months-and-views"></a>

## الأشهر وأنماط العرض

يعرض `numberOfMonths` هذا العدد من الأشهر جنبًا إلى جنب، بدءًا من الشهر المعروض؛ ويقلّبها السابق والتالي شهرًا شهرًا. `firstDayOfWeek` هو اليوم الذي تبدأ به الأسابيع، من `0` الأحد (الافتراضي) إلى `6` السبت.

تحتوي الترويسة على السابق وزرَّي تبديل والتالي:

- يعرض نمط الأيام أيام الأشهر، وكل شهر عمود يضم صف أيام الأسبوع وأسابيعه؛ وتملأ أيام الأشهر السابقة واللاحقة الأسابيع (`outside`، `data-outside`).
- يفتح زر تبديل الشهر (`monthToggle`) نمط عرض الأشهر: الأشهر الاثنا عشر، في صفوف من ثلاثة. يعرض اختيار أحدها ذلك الشهر في نمط الأيام.
- يفتح زر تبديل السنة (`yearToggle`) نمط عرض السنوات: صفحة من 20 سنة، في صفوف من خمس، ويقلّب السابق والتالي الصفحات. يعرض اختيار سنة تلك السنة في نمط الأيام. `yearRange` هي السنوات التي تمتد عبرها الصفحات، `[start, end)` (الافتراضي: من 50 سنة قبل السنة الحالية إلى 50 بعدها).

عند عرض عدة أشهر، تعرض الترويسة عنوان كل شهر بدلًا من زرَّي التبديل (عنصر `monthToggle` لا يقبل الضغط)، كما في `gpui-base`.

<a id="disabled-dates"></a>

## التواريخ المعطّلة

`disabledMatcher` هي الأيام التي لا يستطيع المستخدم اختيارها، من النوع `Matcher` في `gpui-base`، بإحدى أربع صيغ:

| الصيغة | ما تعطّله |
|---|---|
| `[0, 6]` | تلك الأيام من الأسبوع، `0` الأحد إلى `6` السبت. |
| `{ before, after }` | الأيام قبل `before` وبعد `after` (يمكن حذف أيٍّ منهما). |
| `{ from, to }` | الأيام من `from` إلى `to` شاملةً الطرفين (الطرف المحذوف يعني نطاقًا مفتوحًا). |
| `(date) => boolean` | الأيام التي تُرجع الدالة من أجلها `true`، بعد تمرير تاريخ ISO لكل يوم معروض. |

تُستدعى الدالة مرة واحدة لكل يوم معروض، في دورة JS التالية، ولا تُستدعى ثانيةً لأي يوم سبق أن أجابت عنه: فتقليب الأشهر يسأل فقط عن الأيام التي تجلبها، لذا يجب أن تكون إجابتها دالة نقية (pure function) للتاريخ. تمرير دالة أخرى يعيد السؤال. اليوم المعطّل `disabled:`: لا يقبل الضغط، ولا يختاره Return ولا Space.

<a id="items"></a>

## العناصر

كل هدف للضغط وكل تسمية في التقويم هو عنصر: السابق، وزرَّا التبديل، والتالي، وأيام الأسبوع، والأيام، والأشهر، والسنوات. يُرسم كلٌّ منها في جزء يُنسَّق بـ `itemClass` و`itemStyle`، وتتبع متغيراته حالته:

| المتغير | العنصر |
|---|---|
| `selected:` | محدد: التاريخ، وكل يوم من نطاق كامل (بما في ذلك طرفاه، كما في React Aria range calendar)، وبداية نصف نطاق، والشهر أو السنة المعروضة، وزر تبديل النمط المفتوح. تنطق به قارئات الشاشة على أنه محدد. |
| `disabled:` | لا يقبل الضغط: تاريخ معطّل، أو يوم من أيام الأسبوع، أو عنوان شهر، أو السابق والتالي في نمط الأشهر أو عند طرفَي السنوات. |
| `focus:` | يملك لوحة المفاتيح. |
| `data-range-start:`، `data-range-end:` | هو أول يوم أو آخر يوم في نطاق كامل (النطاق ذو اليوم الواحد يكون الاثنين معًا). |
| `data-range-middle:` | يوم داخل نطاق كامل وليس أحد طرفيه. |
| `data-today:` | هو اليوم الحالي. |
| `data-outside:` | يوم من الشهر السابق أو اللاحق، يملأ أسابيعه. |

متغيرات `data-*` هي متغيرات Tailwind (`data-range-start:` يطابق `[data-range-start]`)، كما يُنسّق تقويم shadcn أيامه؛ ومع `group` في `itemClass`، يتبعها المحتوى بـ `group-selected:`، `group-data-range-middle:`، وهكذا. `selected:` تعني كل يوم من النطاق، لذا يأخذ طرفا النطاق مظهرهما فوقه (المتغيرات اللاحقة تغلب: يأتي `data-*` بعد `selected:`)، وتأخذ أيامه الوسطى مظهرها:

```tsx
<Calendar
  range
  itemClass="group rounded-md selected:bg-primary selected:text-primary-foreground data-range-middle:rounded-none data-range-middle:bg-accent data-range-middle:text-accent-foreground data-range-start:rounded-r-none data-range-end:rounded-l-none data-range-start:data-range-end:rounded-md"
/>
```

يرسم `renderItem` محتوى العنصر مما هو عليه، أي `CalendarEntry`، لا من حالته أبدًا: يتم الرسم مرة واحدة ويبقى ما دام العنصر محددًا أو يملك التركيز أو داخل نطاق، فلا تعيد المفاتيح ولا الاختيار ولا التركيز أي رسم، ويرسم تقليب الأشهر الأيام التي يجلبها مرة واحدة لكل منها (يحتفظ اليوم برسمه بحسب شهره وتاريخه: ومع عدة أشهر، تحتفظ الأشهر التي ما زالت معروضة برسمها).

| الحقل | المعنى |
|---|---|
| `kind` | `"previous"` أو `"monthToggle"` أو `"yearToggle"` أو `"next"` أو `"weekday"` أو `"day"` أو `"month"` أو `"year"`. |
| `value` | رقمه: يوم الشهر، أو الشهر (من 1 إلى 12)، أو السنة، أو يوم الأسبوع (`0` الأحد إلى `6`)؛ `0` للسابق والتالي. |
| `date` | تاريخ ISO لليوم. |
| `year`، `month` | السنة والشهر اللذان ينتمي إليهما: لليوم (الشهر الذي تعرضه أسابيعه)، ولزر تبديل الشهر أو عنوانه، ولشهر في نمط عرض الأشهر؛ والسنة الخاصة بزر تبديل السنة وبالسنة نفسها. `0` للسابق والتالي وأيام الأسبوع (و`month` لزر تبديل السنة والسنوات). |
| `today` | اليوم هو اليوم الحالي. |
| `outside` | اليوم من الشهر السابق أو اللاحق. |

بدون `renderItem`، يعرض العنصر رقمه، ويعرض السابق والتالي `‹` و`›`، كما في `gpui-base`؛ ويعرض يوم الأسبوع رقمه أيضًا، من `0` إلى `6`، لأن أسماء الأشهر وأيام الأسبوع هي كلمات التطبيق بلغته.

<a id="props"></a>

## الخصائص

| الخاصية | Rust | النوع | الافتراضي | الوصف |
|---|---|---|---|---|
| `value` | `.value(..)` | `CalendarValue` | لا شيء | القيمة، يملكها التطبيق. |
| `defaultValue` | `.default_value(..)` | `CalendarValue` | `null` | القيمة الأولية، بدون `value`. |
| `range` | `.range(..)` | `boolean` | `false` | اختيار نطاق: يبدؤه الضغط الأول ويُنهيه الثاني. |
| `numberOfMonths` | `.number_of_months(..)` | `number` | `1` | عدد الأشهر المعروضة جنبًا إلى جنب. |
| `firstDayOfWeek` | `.first_day_of_week(..)` | `number` | `0` | اليوم الذي تبدأ به الأسابيع، من `0` الأحد إلى `6` السبت. |
| `disabledMatcher` | `.disabled_matcher(..)` | `DateMatcher` | لا شيء | التواريخ التي لا يمكن اختيارها. |
| `yearRange` | `.year_range(..)` | `[number, number]` | 50 سنة في كل اتجاه | السنوات التي يتنقل عبرها نمط عرض السنوات، `[start, end)`. |
| `previousAccessibilityLabel` | `.previous_accessibility_label(..)` | `string` | لا شيء | ما تنطق به قارئات الشاشة للسابق. |
| `nextAccessibilityLabel` | `.next_accessibility_label(..)` | `string` | لا شيء | ما تنطق به قارئات الشاشة للتالي. |
| `headerClass`، `headerStyle` | `.header_class(..)`، `.header_style(..)` | `string`، `StyleProp<ViewStyle>` | لا شيء | الترويسة: السابق، وزرَّا التبديل (أو عناوين الأشهر)، والتالي. |
| `bodyClass`، `bodyStyle` | `.body_class(..)`، `.body_style(..)` | `string`، `StyleProp<ViewStyle>` | لا شيء | الجسم: الأشهر جنبًا إلى جنب، أو صفوف نمط عرض الأشهر أو السنوات. |
| `monthClass`، `monthStyle` | `.month_class(..)`، `.month_style(..)` | `string`، `StyleProp<ViewStyle>` | لا شيء | كل شهر في نمط الأيام. |
| `rowClass`، `rowStyle` | `.row_class(..)`، `.row_style(..)` | `string`، `StyleProp<ViewStyle>` | لا شيء | كل صف: أيام الأسبوع، أو أسبوع، أو صف من الأشهر أو السنوات. |
| `itemClass`، `itemStyle` | `.item_class(..)`، `.item_style(..)` | `string`، `StyleProp<TextStyle>` | لا شيء | كل عنصر: `selected:`، `disabled:`، `focus:`؛ ولليوم `data-range-start:`، `data-range-end:`، `data-range-middle:`، `data-today:`، `data-outside:` ([العناصر](#items)). |
| `renderItem` | `.render_item(..)` | `(item: CalendarEntry) => JSX.Element` | لا شيء | محتوى العنصر، يرسمه التطبيق مما هو عليه العنصر؛ وإلا فرقمه. |
| `class`، `style` | دوال التنسيق | `string`، `StyleProp<ViewStyle>` | لا شيء | التقويم: الترويسة فوق الجسم. |

<a id="events"></a>

## الأحداث

| الحدث | Rust | الوصف |
|---|---|---|
| `onChange` | `.on_change(\|value\| ..)` | اختار المستخدم قيمة كاملة: `{ value }`، يومًا أو نطاقًا. اضبط `value` لتتابعها. لا يُبلَّغ أبدًا عن `value` يمرّره التطبيق. |

<a id="parts"></a>

## الأجزاء

| الجزء | موضعه | يُنسَّق بـ |
|---|---|---|
| التقويم | الجذر | `class`، `style` |
| الترويسة | في التقويم، أولًا | `headerClass`، `headerStyle` |
| الجسم | في التقويم، بعد الترويسة | `bodyClass`، `bodyStyle` |
| شهر | الجسم (نمط الأيام) | `monthClass`، `monthStyle` |
| صف | شهر، أو الجسم (نمطا الأشهر والسنوات) | `rowClass`، `rowStyle` |
| عنصر | الترويسة والصفوف | `itemClass`، `itemStyle`، `renderItem` (`group-selected:`، `group-data-range-middle:`، ... في الداخل، تحت `group` في `itemClass`) |

<a id="keyboard"></a>

## لوحة المفاتيح

الأيام محطة واحدة لمفتاح Tab: يصل إلى اليوم المحدد، وإلا اليوم الحالي، وإلا أول يوم معروض. بعد ذلك:

| المفتاح | الإجراء |
|---|---|
| Left / Right | اليوم السابق أو اللاحق. |
| Up / Down | اليوم نفسه قبل أسبوع أو بعد أسبوع. |
| Home / End | أول يوم أو آخر يوم في الأسبوع. |
| Page Up / Page Down | اليوم نفسه قبل شهر أو بعد شهر. |
| Shift+Page Up / Shift+Page Down | اليوم نفسه قبل سنة أو بعد سنة. |
| Return, Space | يختار اليوم. |

في التخطيط من اليمين إلى اليسار تجري الأسابيع من اليمين، فيكون Left هو اليوم اللاحق وRight هو اليوم السابق؛ أما Up وDown فيحافظان على الأسابيع. يؤدي تجاوز الأشهر المعروضة إلى تقليبها. يقبل السابق وزرَّا التبديل والتالي والأشهر والسنوات الضغط.
تقبل أيام `gpui-base` الضغط فقط؛ والمفاتيح من NSH، وفق نمط WAI-ARIA لحوار منتقي التاريخ (date picker dialog).

<a id="accessibility"></a>

## إمكانية الوصول

- كل يوم زر يُسمّى بتاريخه بصيغة ISO، ويكون محددًا ما دام هو التاريخ أو يومًا من النطاق (بما في ذلك طرفاه، كما في React Aria range calendar)، ويظهر باهتًا ما دام معطّلًا.
- السابق والتالي زرّان يُسمَّيان بـ `previousAccessibilityLabel` و`nextAccessibilityLabel`؛ أما أزرار التبديل والأشهر والسنوات فأزرار تُسمّى بما تعرضه.

راجع [إمكانية الوصول](../docs/accessibility.md) للاطلاع على التسميات والأدوار والإعلانات بوجه عام.
