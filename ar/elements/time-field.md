---
title: "TimeField"
description: "مكوّن TimeField: وقت من اليوم يُحرَّر جزءًا جزءًا (الساعات والدقائق والثواني) باستخدام لوحة المفاتيح أو لوحة الأرقام في الهاتف، ويُنسَّق مظهره بواسطة التطبيق."
group: base
demo: el-date-picker
source_hash: 2c1c4d77c8f324de
---

# TimeField

يحرّر حقل الوقت وقتًا من اليوم، مقطعًا مقطعًا: الساعة والدقيقة، ومعهما `precision="second"` الثانية، ومعهما `hourCycle="h12"` AM أو PM. مثل وقت تذكير، أو بداية اجتماع، أو ساعات فتح متجر. وهو الوقت الذي يظهر أسفل تقويم [DatePicker](./date-picker.md) عند استخدام `timePrecision`، لكنه هنا مستقل بذاته في الصفحة.

يملك الحقل السلوك: الوقت (وقت التطبيق أو وقته الخاص)، والمقطع الذي تحرّره المفاتيح، وكتابة الأرقام وزيادتها ونقصانها، وما يسمعه قارئو الشاشة. أما المظهر فهو من شأن التطبيق: ينسّق المقاطع و`:` بينها، أو يرسم المقاطع بنفسه.

```rust tabs
use chrono::NaiveTime;
use nsh_base::{HourCycle, TimeFieldSegmentEntry, TimeOfDay, time_field};
use nsh_core::prelude::*;

fn reminder_time() -> impl IntoElement {
    let at = signal(TimeOfDay(NaiveTime::from_hms_opt(9, 30, 0).unwrap()));
    time_field()
        .value(move || Some(at.get()))
        .on_change(move |next: &TimeOfDay| at.set(*next))
        .hour_cycle(HourCycle::H12)
        .accessibility_label("Reminder time")
        .segment_class("rounded-sm focus:bg-accent disabled:opacity-50")
        .render_segment(|segment: &TimeFieldSegmentEntry| view().px_1().child(text(segment.label.clone())))
}
```

```tsx tabs
import { mount, signal } from "nsh";
import { TimeField } from "nsh/base";

function App() {
  const at = signal("09:30");
  return (
    <TimeField
      value={at()}
      onChange={({ value }) => at.set(value)}
      hourCycle="h12"
      accessibilityLabel="Reminder time"
      class="h-9 w-32 flex-row items-center rounded-md border border-input px-2"
      segmentClass="rounded-sm px-0.5 text-sm tabular-nums focus:bg-accent focus:text-accent-foreground"
      separatorClass="text-sm text-muted-foreground"
    />
  );
}

mount(App);
```

يأتي `TimeField` من [`nsh/base`](../modules/nsh-base.md)، وهو الـ crate الخاص بـ `nsh-base` في Rust. في Rust، يُنشئ `time_field()` حقلًا بدالة ضبط (setter) لكل خاصية (`.value(..)`، `.precision(..)`، `.hour_cycle(..)`) ومستمع (listener) لكل حدث (`.on_change(..)`). وقته من النوع `TimeOfDay`، أي `chrono::NaiveTime`.

<a id="value"></a>

## القيمة

القيمة هي وقت من اليوم بنظام 24 ساعة، بصيغة HTML `<input type="time">`: `"HH:MM"`، أو `"HH:MM:SS"` مع `precision="second"`، بحسب `hourCycle` الذي يعرضه الحقل. مع `value` يملك التطبيق القيمة: يعرضها الحقل ويبلّغ عن كل تعديل عبر `onChange({ value })`؛ ويضبط التطبيق `value` ليتبعه. وإن لم تُحدَّد، يحتفظ الحقل بوقته الخاص، بدءًا من `defaultValue` (والافتراضي `00:00`).

`precision` هي أصغر وحدة يحرّرها الحقل: `"minute"` (الافتراضي) أو `"second"`. و`hourCycle` هي طريقة عدّ الساعات: `"h23"` (الافتراضي) من 00 إلى 23، أو `"h12"` من 12 إلى 11 مع مقطع AM/PM بعد الأرقام.

<a id="editing"></a>

## التحرير

يكون مقطع واحد محدّدًا، وتحرّره المفاتيح كما في حقل الوقت في `gpui-base`:

- السهمان لأعلى ولأسفل يغيّران قيمة المقطع بمقدار واحد ويعودان إلى البداية عند الحد (من 59 إلى 00) دون ترحيل إلى المقطع التالي.
- تُكتب الأرقام فيه رقمين رقمين: الرقم الذي لا يمكن أن يبدأ قيمة أطول (مثل `7` في الساعة) يُكمل المقطع وينتقل إلى التالي.
- `a` و`p` تضبطان AM وPM.
- Backspace وDelete تعيدان ضبط المقطع.

الضغط على مقطع يحدّده. والضغط على مقطع AM/PM المحدّد يبدّل قيمته، لأن الهواتف لا تحتوي على مفتاحي `a` و`p`. تذهب المفاتيح إلى حقل نصي أصلي واحد شفاف خلف المقاطع، كما في [OtpInput](./otp-input.md): وعلى الهواتف والأجهزة اللوحية يُظهر لوحة الأرقام.

<a id="props"></a>

## الخصائص

| الخاصية | Rust | النوع | الافتراضي | الوصف |
|---|---|---|---|---|
| `value` | `.value(..)` | `string` | لا شيء | الوقت، ويملكه التطبيق. |
| `defaultValue` | `.default_value(..)` | `string` | `"00:00"` | الوقت في البداية، عند غياب `value`. |
| `precision` | `.precision(..)` | `"minute" \| "second"` | `"minute"` | أصغر وحدة يحرّرها. |
| `hourCycle` | `.hour_cycle(..)` | `"h23" \| "h12"` | `"h23"` | طريقة عدّ الساعات؛ و`"h12"` يضيف مقطع AM/PM. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | لا تركيز ولا تحرير؛ وتُطبَّق تنسيقات `disabled:` على الحقل ومقاطعه. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | لا شيء | الاسم الذي يستخدمه قارئو الشاشة للحقل. |
| `segmentClass`، `segmentStyle` | `.segment_class(..)`، `.segment_style(..)` | `string`، `StyleProp<TextStyle>` | لا شيء | كل مقطع: `focus:` على المقطع المحدّد أثناء تركيز الحقل، و`disabled:` مع الحقل؛ ومع `group` يتبعهما محتواه (`group-focus:`، `group-disabled:`). |
| `separatorClass`، `separatorStyle` | `.separator_class(..)`، `.separator_style(..)` | `string`، `StyleProp<TextStyle>` | لا شيء | كل `:` بين الأرقام. |
| `renderSegment` | `.render_segment(..)` | `(segment: TimeFieldSegmentEntry) => JSX.Element` | لا شيء | محتوى المقطع، يرسمه التطبيق بناءً على ما يعرضه؛ وإلا فتسميته. |
| `class`، `style` | دوال التنسيق | `string`، `StyleProp<ViewStyle>` | لا شيء | الحقل، حول مقاطعه (صف). |

يتلقى `renderSegment` قيمة `TimeFieldSegmentEntry`: `segment` (`"hour"` أو `"minute"` أو `"second"` أو `"period"`)، و`value` (الساعة بحسب نظام الحقل، أو الدقيقة، أو الثانية؛ و`0` لـ AM و`1` لـ PM)، و`label` (رقمان، أو `AM` / `PM`). ولا يتلقى حالة المقطع أبدًا: فالمقطع `focus:` ما دامت المفاتيح تحرّره، و`disabled:` مع الحقل، ومع `group` في `segmentClass` يتبعهما محتواه عبر `group-focus:` و`group-disabled:`. لذلك لا يُعاد رسم المقطع إلا عند تغيّر قيمته؛ أما الانتقال بين المقاطع وكسب التركيز وفقدانه فلا يرسم شيئًا:

```tsx
<TimeField
  segmentClass="group rounded-sm px-0.5 focus:bg-primary"
  renderSegment={(segment) => <Text class="text-sm tabular-nums text-foreground group-focus:text-primary-foreground">{segment.label}</Text>}
/>
```

<a id="events"></a>

## الأحداث

| الحدث | Rust | الوصف |
|---|---|---|
| `onChange` | `.on_change(\|value\| ..)` | غيّر المستخدم الوقت: `{ value }`. اضبط `value` لتتبعه. ولا يُبلَّغ أبدًا عن `value` يمرّره التطبيق. |

<a id="parts"></a>

## الأجزاء

| الجزء | الموضع | يُنسَّق بـ |
|---|---|---|
| الحقل | الجذر، صف | `class`، `style` |
| المقطع | الحقل: الساعة، الدقيقة، الثانية، AM/PM | `segmentClass`، `segmentStyle`، `renderSegment` (`group-focus:`، `group-disabled:` في داخله، تحت `group` في `segmentClass`) |
| الفاصل | الحقل، بين رقمين | `separatorClass`، `separatorStyle` |

<a id="keyboard"></a>

## لوحة المفاتيح

يصل Tab إلى الحقل مع مقطعه المحدّد. بعد ذلك:

| المفتاح | الإجراء |
|---|---|
| السهم الأيسر / الأيمن | المقطع السابق أو التالي. |
| Tab / Shift+Tab | المقطع التالي أو السابق؛ يخرج Tab من الحقل عند المقطع الأخير، ويخرج Shift+Tab منه عند المقطع الأول. |
| السهم لأعلى / لأسفل | يزيد قيمة المقطع أو ينقصها بمقدار واحد مع العودة إلى البداية عند الحد. |
| من 0 إلى 9 | يكتب في المقطع. |
| A / P | AM أو PM. |
| Backspace، Delete | يعيد ضبط المقطع. |

<a id="accessibility"></a>

## إمكانية الوصول

- الحقل حقل نصي يُسمّى بـ `accessibilityLabel`؛ ويقرأ قارئو الشاشة الوقت الذي يعرضه. و`disabled` يجعله باهتًا.
- تُظهر الهواتف والأجهزة اللوحية لوحة الأرقام.

راجع [إمكانية الوصول](../docs/accessibility.md) للاطلاع على التسميات والأدوار والإعلانات بوجه عام.
