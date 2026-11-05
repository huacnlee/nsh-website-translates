---
title: "DatePicker"
description: "مكوّن DatePicker: تاريخ، أو نطاق من التواريخ، أو تاريخ ووقت يتم اختيارها من تقويم في نافذة منبثقة عند عنصر التشغيل على أجهزة سطح المكتب، وفي ورقة سفلية على الهواتف، ويتم تنسيقها بواسطة التطبيق."
group: base
demo: el-date-picker
source_hash: ba9910b03fe753f3
---

# DatePicker

يضبط منتقي التاريخ تاريخًا من [Calendar](./calendar.md) يُفتح من مشغّل التطبيق: تاريخ استحقاق، أو تاريخ ميلاد، ومع `range` أيام رحلة، ومع `timePrecision` تاريخ ووقت من اليوم. مثل [Select](./select.md)، يُفتح بالطريقة التي يتوقعها كل جهاز:

- على أجهزة سطح المكتب وفي متصفحاتها، نافذة منبثقة عند المشغّل؛ وفتحها ينقل لوحة المفاتيح إلى الأيام.
- على الهواتف والأجهزة اللوحية، ورقة في أسفل الشاشة فوق خلفية معتمة.

يتولى المنتقي السلوك: القيمة (للتطبيق، أو الخاصة به)، وحالة الفتح، والتقويم، والوقت، والإعدادات المسبقة، ولوحة المفاتيح، وما تنطق به قارئات الشاشة. أما المظهر فللتطبيق: فهو يرسم المشغّل (بالقيمة، ونص مؤقت، وأيقونة) وينسّق النافذة المنبثقة وأجزاء التقويم والإعدادات المسبقة وحقل الوقت.

```rust tabs
use chrono::NaiveDate;
use nsh_base::{DateRangePreset, DateTime, PickedDate, date_picker, theme};
use nsh_core::prelude::*;

fn trip_dates() -> impl IntoElement {
    let trip = signal(DateTime::Range(None, None));
    let title = move || {
        trip.get()
            .format("%b %-d")
            .map(|s| s.to_string())
            .unwrap_or_else(|| "Pick dates".to_string())
    };
    let day = |m, d| NaiveDate::from_ymd_opt(2026, m, d).unwrap();
    date_picker()
        .range(true)
        .number_of_months(2)
        .value(move || trip.get())
        .on_change(move |next: &PickedDate| trip.set(next.value))
        .presets(vec![
            DateRangePreset::range("This week", day(10, 25), day(10, 31)),
            DateRangePreset::range("Next week", day(11, 1), day(11, 7)),
        ])
        .accessibility_label("Trip")
        .offset(px(4.0))
        .popup_style(|s| {
            s.p_3()
                .rounded_lg()
                .border_1()
                .border_color(move || theme().border)
                .bg(move || theme().popover)
                .shadow_md()
        })
        .trigger(
            view()
                .h_9()
                .w_56()
                .px_3()
                .justify_center()
                .rounded_md()
                .border_1()
                .border_color(move || theme().input)
                .child(text(title)),
        )
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { DatePicker, type DatePickerValue } from "nsh/base";

function App() {
  const due = signal<DatePickerValue>(null);
  return (
    <DatePicker
      value={due()}
      onChange={({ value }) => due.set(value)}
      timePrecision="minute"
      cleanable
      clearButton={<Text>×</Text>}
      clearButtonAccessibilityLabel="Clear the due date"
      presets={[{ label: "Tomorrow 9:00", value: "2026-10-29T09:00" }]}
      accessibilityLabel="Due"
      offset={4}
      popupClass="rounded-lg border border-border bg-popover p-3 text-popover-foreground shadow-md"
      backdropClass="bg-black/40"
      contentClass="flex-row gap-3"
      presetClass="rounded-md px-2 py-1.5 text-sm hover:bg-accent"
      headerClass="flex-row items-center justify-between"
      rowClass="flex-row justify-between"
      itemClass="h-8 min-w-8 items-center justify-center rounded-md text-sm focus:ring-2 focus:ring-ring selected:bg-primary selected:text-primary-foreground disabled:opacity-50"
      timeClass="mt-2 gap-3"
      timeLabel={<Text class="text-sm">Time</Text>}
      timeAccessibilityLabel="Due time"
      timeFieldClass="flex-row rounded-md border border-input px-2 py-1"
      segmentClass="text-sm tabular-nums focus:bg-accent"
      trigger={
        <View class="h-9 w-56 justify-center rounded-md border border-input px-3 hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring">
          <Text>{typeof due() === "string" ? (due() as string).replace("T", " ") : "Pick a date"}</Text>
        </View>
      }
    />
  );
}

mount(App);
```

يأتي `DatePicker` من [`nsh/base`](../modules/nsh-base.md)، وهو الـ crate `nsh-base` في Rust. في Rust، ينشئ `date_picker()` واحدًا بدالة ضبط لكل خاصية (`.value(..)`، `.range(..)`، `.time_precision(..)`) ومستمع لكل حدث (`.on_change(..)`). قيمته هي `DateTime` (`DateTime::Single`، `DateTime::Range`، من `chrono` تواريخ أو تواريخ وأوقات)؛ ويعطي `onChange` قيمة `PickedDate`، أي القيمة بدقة وقت المنتقي.

<a id="value"></a>

## القيمة

القيمة بصيغ مدخلات HTML: تاريخ ISO، `"2026-10-28"`، مثل صيغة `<input type="date">`؛ ومع `range` تكون `[start, end]`؛ ومع `timePrecision` تاريخ ووقت، `"2026-10-28T09:30"` (`"2026-10-28T09:30:15"` عند الثواني)، مثل صيغة `<input type="datetime-local">`؛ و`null` تعني لا قيمة. مع `value`، يملك التطبيق القيمة: يعرضها المنتقي ويبلّغ عن كل تغيير عبر `onChange({ value })`؛ ويضبط التطبيق `value` ليتابعه. إذا حُذفت، يحتفظ المنتقي بقيمته الخاصة، بدءًا من `defaultValue` في البداية.

- تاريخ واحد: الضغط على يوم يضبط القيمة ويغلق النافذة المنبثقة.
- مع `range`، يبدأ الضغط الأول النطاق وينهيه الضغط الثاني، كما في [التقويم](./calendar.md#value)؛ والنطاق الكامل يضبط القيمة ويغلق النافذة المنبثقة.
- مع `timePrecision` (لتاريخ واحد فقط)، يظهر حقل وقت تحت التقويم ويُبلَّغ عن كل تعديل للوقت. على أجهزة سطح المكتب، يُبقي اختيار يوم النافذة المنبثقة مفتوحة لضبط الوقت ويُبلَّغ عن التاريخ مع وقته؛ والضغط مجددًا على اليوم المحدد يغلق النافذة المنبثقة. على الهواتف والأجهزة اللوحية، تختار النقرة على يوم ذلك اليوم بوقته وتغلق الورقة، كما يفعل التاريخ الواحد؛ وتُفتح الورقة مجددًا لضبط الوقت. اليوم المختار قبل ضبط أي وقت يحصل على `defaultTime` (الافتراضي `00:00`). `hourCycle` هو الطريقة التي يعدّ بها الحقل الساعات.

يضيف `cleanable` زر مسح ما دامت هناك قيمة: الضغط عليه يمسحها (`onChange({ value: null })`). يأتي بعد المشغّل لا بداخله، فلا يفتح الضغط عليه النافذة المنبثقة أبدًا؛ ويضعه التطبيق ويملؤه (`clearButton`)، كما في [زر المسح في select](./select.md#value).

<a id="presets"></a>

## الإعدادات المسبقة

`presets` أزرار بجانب التقويم تضبط القيمة: "اليوم"، "آخر 7 أيام"، "غدًا الساعة 9". كل واحد منها `{ label, value }`، `value` تاريخ أو نطاق أو تواريخ وأوقات، تُحفظ كما أُعطيت؛ والضغط عليه يضبط القيمة ويغلق النافذة المنبثقة. يرتّب `contentClass` عمود الإعدادات المسبقة والتقويم مع الوقت (صف، `flex-row`)؛ وينسّق `presetsClass` العمود، و`presetClass` كل زر.

<a id="the-calendar"></a>

## التقويم

كل خاصية في [Calendar](./calendar.md) عدا قيمته تنتقل إلى المنتقي: `numberOfMonths`، `firstDayOfWeek`، `disabledMatcher`، `yearRange`، `previousAccessibilityLabel`، `nextAccessibilityLabel`، والأجزاء (من `headerClass` إلى `itemStyle`) و`renderItem`. ينسّق `calendarClass` و`calendarStyle` التقويم نفسه. أما عروضه ومفاتيحه فهي كما في التقويم.

يحمل صف الوقت (`timeClass`، `timeStyle`) العنصر `timeLabel`، وهو كلمات التطبيق له ("الوقت")، في بدايته وحقل الوقت (`timeFieldClass`، `timeFieldStyle`، `timeAccessibilityLabel`) في نهايته: صف عناصره في المنتصف ومتباعدة (`flex-row items-center justify-between`، كما في `gpui-component`). أما مقاطع الحقل فهي مقاطع [TimeField](./time-field.md) (`segmentClass`، `separatorClass`، `renderSegment`).

<a id="props"></a>

## الخصائص

| الخاصية | Rust | النوع | القيمة الافتراضية | الوصف |
|---|---|---|---|---|
| `value` | `.value(..)` | `DatePickerValue` | لا شيء | القيمة، يملكها التطبيق. |
| `defaultValue` | `.default_value(..)` | `DatePickerValue` | `null` | القيمة في البداية، من دون `value`. |
| `range` | `.range(..)` | `boolean` | `false` | اختيار نطاق من التواريخ. |
| `open`، `defaultOpen` | `.open(..)`، `.default_open(..)` | `boolean` | `false` | حالة الفتح، للتطبيق أو للمنتقي نفسه. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | يبقى مغلقًا ولا يقبل ضغطات ولا تركيز لوحة المفاتيح. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | لا شيء | الاسم الذي تنطق به قارئات الشاشة. |
| `dateFormat` | `.date_format(..)` | `string` | `"%Y/%m/%d"` مع الوقت | كيف تنطق قارئات الشاشة القيمة، بصيغة `chrono`. |
| `timePrecision` | `.time_precision(..)` | `"minute" \| "second"` | لا شيء | تعديل وقت اليوم أيضًا، حتى هذه الدقة. |
| `hourCycle` | `.hour_cycle(..)` | `"h23" \| "h12"` | `"h23"` | كيف يعدّ حقل الوقت الساعات. |
| `defaultTime` | `.default_time(..)` | `string` | `"00:00"` | الوقت الذي يحصل عليه التاريخ قبل أن يضبط المستخدم وقتًا. |
| `cleanable` | `.cleanable(..)` | `boolean` | `false` | زر مسح ما دامت هناك قيمة. |
| `presets` | `.presets(..)` | `DateRangePreset[]` | `[]` | أزرار في النافذة المنبثقة تضبط القيمة. |
| `numberOfMonths`، `firstDayOfWeek`، `disabledMatcher`، `yearRange` | كما في `Calendar` | كما في `Calendar` | كما في `Calendar` | أشهر التقويم وأسابيعه وتواريخه المعطّلة وسنواته. |
| `previousAccessibilityLabel`، `nextAccessibilityLabel` | كما في `Calendar` | `string` | لا شيء | ما تقوله قارئات الشاشة لزرّي السابق والتالي في التقويم. |
| `placement`، `align`، `offset`، `margin` | `.placement(..)`, ... | كما في `Select` | `"bottom"`، `"start"`، 0، 0 | أجهزة سطح المكتب: موضع النافذة المنبثقة بالنسبة إلى المشغّل. |
| `popupClass`، `popupStyle` | `.popup_class(..)`، `.popup_style(..)` | `string`، `StyleProp<ViewStyle>` | لا شيء | النافذة المنبثقة (سطح المكتب) أو الورقة (الشاشات اللمسية). |
| `backdropClass`، `backdropStyle` | `.backdrop_class(..)`، `.backdrop_style(..)` | `string`، `StyleProp<ViewStyle>` | لا شيء | الخلفية المعتمة خلف الورقة. |
| `contentClass`، `contentStyle` | `.content_class(..)`، `.content_style(..)` | `string`، `StyleProp<ViewStyle>` | لا شيء | محتوى النافذة المنبثقة: الإعدادات المسبقة بجانب التقويم والوقت. |
| `presetsClass`، `presetsStyle` | `.presets_class(..)`، `.presets_style(..)` | `string`، `StyleProp<ViewStyle>` | لا شيء | عمود الإعدادات المسبقة. |
| `presetClass`، `presetStyle` | `.preset_class(..)`، `.preset_style(..)` | `string`، `StyleProp<TextStyle>` | لا شيء | زر كل إعداد مسبق. |
| `calendarClass`، `calendarStyle` | `.calendar_class(..)`، `.calendar_style(..)` | `string`، `StyleProp<ViewStyle>` | لا شيء | التقويم. |
| `headerClass` … `itemStyle` | كما في `Calendar` | كما في `Calendar` | لا شيء | رأس التقويم وجسمه وأشهره وصفوفه وعناصره. |
| `renderItem` | `.render_item(..)` | `(item: CalendarEntry) => JSX.Element` | لا شيء | كل عنصر في التقويم، يرسمه التطبيق بحسب ما هو؛ وحالاته هي فئات العناصر، كما في `Calendar`. |
| `timeClass`، `timeStyle` | `.time_class(..)`، `.time_style(..)` | `string`، `StyleProp<ViewStyle>` | لا شيء | صف الوقت: عنوانه في البداية والحقل في النهاية. |
| `timeLabel` | `.time_label(..)` | `JSX.Element` | لا شيء | ما يعرضه صف الوقت قبل الحقل. |
| `timeFieldClass`، `timeFieldStyle` | `.time_field_class(..)`، `.time_field_style(..)` | `string`، `StyleProp<ViewStyle>` | لا شيء | حقل الوقت. |
| `timeAccessibilityLabel` | `.time_accessibility_label(..)` | `string` | لا شيء | الاسم الذي تنطق به قارئات الشاشة لحقل الوقت. |
| `segmentClass`، `segmentStyle`، `separatorClass`، `separatorStyle`، `renderSegment` | كما في `TimeField` | كما في `TimeField` | لا شيء | مقاطع حقل الوقت و`:`. |
| `clearButtonClass`، `clearButtonStyle` | `.clear_button_class(..)`، `.clear_button_style(..)` | `string`، `StyleProp<ViewStyle>` | لا شيء | زر المسح (`cleanable`). |
| `clearButton` | `.clear_button(..)` | `JSX.Element` | لا شيء | محتوى زر المسح. |
| `clearButtonAccessibilityLabel` | `.clear_button_accessibility_label(..)` | `string` | لا شيء | الاسم الذي تنطق به قارئات الشاشة لزر المسح. |
| `trigger` | `.trigger(..)` | `JSX.Element` | لا شيء | ما يفتح النافذة المنبثقة عند الضغط عليه؛ وتوضع النافذة المنبثقة بالنسبة إليه. |
| `class`، `style` | دوال التنسيق | `string`، `StyleProp<ViewStyle>` | لا شيء | العرض المحيط بالمشغّل. |

<a id="events"></a>

## الأحداث

| الحدث | Rust | الوصف |
|---|---|---|
| `onChange` | `.on_change(\|value\| ..)` | تغيّرت القيمة (يوم، أو نهاية نطاق، أو إعداد مسبق، أو الوقت، أو زر المسح): `{ value }`. اضبط `value` لمتابعته. |
| `onOpenChange` | `.on_open_change(\|e\| ..)` | فُتحت النافذة المنبثقة أو أُغلقت، مع السبب (`{ open, reason }`). اضبط `open` لمتابعته. |
| `onOpen`، `onClose` | `.on_open(..)`، `.on_close(..)` | النافذة المنبثقة ظاهرة، أو اختفت. |
| `onCancel` | `.on_cancel(..)` | أغلق المستخدم النافذة المنبثقة دون اختيار (Escape أو الرجوع، أو ضغطة خارجها أو على الخلفية المعتمة). |

<a id="parts"></a>

## الأجزاء

| الجزء | الموضع | يُنسَّق بواسطة |
|---|---|---|
| المشغّل | عرض المنتقي | عنصر التطبيق نفسه (`trigger`) |
| زر المسح | عرض المنتقي، بعد المشغّل (`cleanable`، ما دامت هناك قيمة) | `clearButtonClass`، `clearButtonStyle`؛ ومحتواه `clearButton` |
| النافذة المنبثقة أو الورقة | فوق كل شيء، عند المشغّل (سطح المكتب) أو في الأسفل (الشاشات اللمسية) | `popupClass`، `popupStyle` |
| الخلفية المعتمة | خلف الورقة (الشاشات اللمسية) | `backdropClass`، `backdropStyle` |
| المحتوى | النافذة المنبثقة | `contentClass`، `contentStyle` |
| الإعدادات المسبقة | المحتوى، أولًا (`presets`) | `presetsClass`، `presetsStyle`؛ وكل واحد `presetClass`، `presetStyle` |
| التقويم | المحتوى | `calendarClass`، `calendarStyle`، وأجزاء [Calendar](./calendar.md#parts) |
| صف الوقت | تحت التقويم (`timePrecision`) | `timeClass`، `timeStyle`؛ وعنوانه `timeLabel` |
| حقل الوقت | صف الوقت | `timeFieldClass`، `timeFieldStyle`، وأجزاء [TimeField](./time-field.md#parts) |

<a id="keyboard"></a>

## لوحة المفاتيح

| المفتاح | الإجراء |
|---|---|
| Return (على المشغّل) | يفتح النافذة المنبثقة، أو يغلقها. |
| Delete، Backspace (على المشغّل) | يمسح القيمة ما دامت النافذة المنبثقة مغلقة. |
| Escape | يغلق النافذة المنبثقة دون اختيار. |

في النافذة المنبثقة، تنتقل مفاتيح التقويم بين الأيام وتختار يومًا (انظر [لوحة المفاتيح](./calendar.md#keyboard)) وتعدّل مفاتيح حقل الوقت الوقت (انظر [لوحة المفاتيح](./time-field.md#keyboard)).

<a id="accessibility"></a>

## إمكانية الوصول

- المشغّل هو combobox بالنسبة إلى قارئات الشاشة: تسميته `accessibilityLabel`، وقيمته التاريخ كما يكتبه `dateFormat` (افتراضيًا `2026/10/28`، مع الوقت عند `timePrecision`)، ويذكر ما إذا كانت النافذة المنبثقة موسّعة. ويجعله `disabled` باهتًا.
- أيام التقويم أزرار تُسمّى بتواريخ ISO الخاصة بها (انظر [إمكانية الوصول](./calendar.md#accessibility))؛ والإعدادات المسبقة أزرار تُسمّى بعناوينها؛ وحقل الوقت يُسمّى بـ `timeAccessibilityLabel`.
- زر المسح زر يُسمّى بـ `clearButtonAccessibilityLabel`.

انظر [إمكانية الوصول](../docs/accessibility.md) للاطلاع على التسميات والأدوار والإعلانات بوجه عام.
