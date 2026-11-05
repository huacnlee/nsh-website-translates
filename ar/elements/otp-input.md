---
title: "OtpInput"
description: "مكوّن OtpInput: رمز تحقق لمرة واحدة رقمي ثابت الطول، يمكن كتابته أو لصقه أو تعبئته تلقائيًا في حقل أصلي واحد، ويُعرض في خلايا ومجموعات ومؤشر إدخال يُنسّقها التطبيق."
group: base
demo: el-otp-input
source_hash: 80ea5e26b79a21ac
---

# OtpInput

يستقبل مُدخل الرمز أحادي الاستخدام عددًا ثابتًا من الأرقام (رمز تحقق من رسالة نصية، أو رمز من تطبيق مصادقة) ويعرضها في خلايا. وهو يتولى السلوك بنفسه: حقل نصي أصلي واحد، شفاف وفوق الخلايا، يستقبل لوحة المفاتيح، فتكون الكتابة وطرق الإدخال واللصق ولوحة الأرقام والملء التلقائي للرمز من النظام ("From Messages" في iOS، واقتراحات SMS في Android) كلها من المنصة نفسها، وتجد قارئات الشاشة حقلًا نصيًا واحدًا. تُقبل الأرقام فقط، حتى `length`؛ ويحذف Backspace آخر رقم، ويُعلِم `onComplete` باكتمال الرمز. أما المظهر فمن شأن التطبيق: `OtpInput` ليس له ألوان ولا أحجام ولا حدود ولا تسمية خاصة به. أجزاؤه هي الخلايا والمجموعات التي تنقسم إليها ومؤشر الكتابة، ويتولى التطبيق تنسيق كل جزء.

```rust tabs
use nsh_base::{OtpInputCompleteEvent, otp_input, theme};
use nsh_core::prelude::*;

fn verification(verify: impl Fn(&str) + 'static) -> impl IntoElement {
    let code = signal(SharedString::default());
    otp_input()
        .length(6)
        .groups(2)
        .value(move || Some(code.get()))
        .on_change(move |next: &SharedString| code.set(next.clone()))
        .on_complete(move |e: &OtpInputCompleteEvent| verify(&e.value))
        .accessibility_label("Verification code, 6 digits")
        .flex_row()
        .gap_3()
        .group_style(|s| s.flex_row().gap_2())
        .cell_style(|s| {
            s.w(px(40.0))
                .h(px(48.0))
                .items_center()
                .justify_center()
                .rounded(px(8.0))
                .border_1()
                .border_color(move || theme().input)
                .text_xl()
        })
        // The cell that takes the next digit, while the code has the focus,
        // and the cells that hold a digit.
        .cell_class("focus:border-ring data-filled:bg-muted")
        .caret_style(|s| s.w(px(2.0)).h(px(24.0)).bg(move || theme().foreground))
}
```

```tsx tabs
import { mount, signal } from "nsh";
import { OtpInput } from "nsh/base";

function App() {
  const code = signal("");
  const verify = (value: string) => console.log(`checking ${value}`);
  return (
    <OtpInput
      length={6}
      groups={2}
      value={code()}
      onChange={({ value }) => code.set(value)}
      onComplete={({ value }) => verify(value)}
      accessibilityLabel="Verification code, 6 digits"
      class="flex-row gap-3"
      groupClass="flex-row gap-2"
      cellClass="w-10 h-12 items-center justify-center rounded-lg border border-input text-xl focus:border-ring data-filled:bg-muted"
      caretClass="w-0.5 h-6 bg-foreground"
    />
  );
}

mount(App);
```

يأتي `OtpInput` من [`nsh/base`](../modules/nsh-base.md)، وهي حزمة (crate) `nsh-base` في Rust. في Rust، ينشئ `otp_input()` مُدخلًا مع دالة ضبط لكل خاصية (`.length(..)`، `.cell_style(..)`)، ودالة مستمع لكل حدث (`.on_complete(..)`)، ودوال التنسيق المُنمَّطة للمُدخل نفسه.

<a id="the-code"></a>

## الرمز

- **متحكَّم به**: مرّر `value` واضبطه في `onChange`. تعرض الخلايا `value` الذي يمرره التطبيق كما هو؛ والقيمة التي يضبطها التطبيق (مثل مسح الرمز بعد إدخال رمز خاطئ) لا يُبلَّغ عنها أبدًا.
- **غير متحكَّم به**: مرّر `defaultValue` (أو لا شيء)، واقرأ الرمز من `onChange` و`onComplete`.

ما يفعله المستخدم يُقرأ من الحقل، ومؤشر الكتابة دائمًا في نهايته:

| المستخدم | الرمز |
|---|---|
| يكتب رقمًا | يُضاف في النهاية ما دام الرمز أقصر من `length`؛ وعند اكتماله لا يتغير شيء. |
| يكتب رقمًا بعرض كامل (`０`–`９`، من طريقة إدخال لغات شرق آسيا) | يُضاف الرقم بصيغة ASCII. |
| يكتب أي شيء آخر | لا يتغير شيء؛ يتجاهله الحقل. |
| يضغط Backspace | يُحذف آخر رقم. |
| يلصق، أو يملأ النظام الرمز تلقائيًا | تُضاف أرقامه بالطريقة نفسها؛ والنص الذي فيه `length` من الأرقام أو أكثر (`123-456`، مثل رمز رسالة) يستبدل الرمز بأول `length` من أرقامه. |

يُبلِّغ `onChange` عن كل تغيير مع الرمز الجديد، ويتبعه `onComplete` حين يملأ التغيير الخلية الأخيرة، فيتحقق التطبيق من الرمز عندها.

<a id="props"></a>

## الخصائص

| الخاصية | Rust | النوع | الافتراضي | الوصف |
|---|---|---|---|---|
| `length` | `.length(..)` | `number` | مطلوبة | عدد أرقام الرمز: خلية لكل رقم. |
| `value` | `.value(..)` | `string` | لا شيء | الرمز، يتحكم به التطبيق (يُعرض كما هو). وبدونها يحتفظ المُدخل برمزه الخاص. |
| `defaultValue` | `.default_value(..)` | `string` | لا شيء | الرمز في البداية، ما دام `value` غير مضبوط. |
| `masked` | `.masked(..)` | `boolean` | `false` | تعرض الخلايا المملوءة نقطة بدل رقمها، ويكون الحقل آمنًا: لا تقرأ قارئات الشاشة الرمز، ويبعده النظام عن اقتراحاته. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | لا تركيز ولا تحرير؛ تنطبق أنماط `disabled:` على المُدخل وأجزائه، وتعلن قارئات الشاشة أنه معطّل. |
| `groups` | `.groups(..)` | `number` | `1` | عدد المجموعات التي تنقسم إليها الخلايا، بأكثر توزيع متساوٍ ممكن (3 + 3 لستة أرقام في مجموعتين)؛ مجموعة واحدة على الأقل، وبحد أقصى مجموعة لكل خلية. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | لا شيء | ما تقوله قارئات الشاشة عن الحقل: الغرض من الرمز وعدد أرقامه. |
| `cellClass`، `cellStyle` | `.cell_class(..)`، `.cell_style(\|s\| ..)` | `string`، `StyleProp<TextStyle>` | لا شيء | كل خلية: حجمها وحدّها ونصها (`color`، `fontSize`، التي يرثها رقمها)؛ ويُنسِّق `focus:` و`data-filled:` حالاتها (انظر الأجزاء). |
| `groupClass`، `groupStyle` | `.group_class(..)`، `.group_style(\|s\| ..)` | `string`، `StyleProp<ViewStyle>` | لا شيء | كل مجموعة من الخلايا (`flex-row gap-2`). |
| `caretClass`، `caretStyle` | `.caret_class(..)`، `.caret_style(\|s\| ..)` | `string`، `StyleProp<ViewStyle>` | لا شيء | مؤشر الكتابة: عرضه وارتفاعه ولونه. |
| `class`، `style` | دوال التنسيق | `string`، `StyleProp<ViewStyle>` | لا شيء | المُدخل نفسه: الصف (أو العمود) الذي يحيط بمجموعاته. |

<a id="events"></a>

## الأحداث

| الحدث | Rust | الحمولة | متى |
|---|---|---|---|
| `onChange` | `.on_change(\|value: &SharedString\| ..)` | `(e: { value: string })` | غيّر المستخدم الرمز: كتابةً أو حذفًا أو لصقًا أو ملءًا تلقائيًا. |
| `onComplete` | `.on_complete(\|e: &OtpInputCompleteEvent\| ..)` | `{ value }` | ملأ تغيير المستخدم الخلية الأخيرة، بعد `onChange` الخاص به. |
| `onFocus` / `onBlur` | `.on_focus` / `.on_blur` | لا شيء | حصل المُدخل على تركيز لوحة المفاتيح / فقده. |

<a id="ref-methods"></a>

## دوال Ref

| الدالة | Rust | الوصف |
|---|---|---|
| `focus()` | `focus()` (`OtpInputApi`) | تأخذ تركيز لوحة المفاتيح وتعرض لوحة المفاتيح البرمجية، كما يفعل الضغط على المُدخل. |

<a id="parts"></a>

## الأجزاء

| الجزء | داخل | يُنسَّق بـ |
|---|---|---|
| المُدخل | | `class`، `style` |
| مجموعة | المُدخل، واحدة لكل مجموعة | `groupClass`، `groupStyle`؛ `disabled:` يتبع المُدخل |
| خلية | مجموعتها، واحدة لكل رقم | `cellClass`، `cellStyle`؛ `focus:` على الخلية التي تستقبل الرقم التالي ما دام المُدخل يملك التركيز، `data-filled:` على كل خلية فيها رقم، `disabled:` يتبع المُدخل |
| الرقم | خلية مملوءة | أنماط نص الخلية (`text-xl`، `font-semibold`)؛ `•` عندما `masked` |
| مؤشر الكتابة | الخلية الفارغة التي تستقبل الرقم التالي، ما دام المُدخل يملك التركيز | `caretClass`، `caretStyle` |

الخلية التي تستقبل الرقم التالي هي التي تلي آخر رقم، أو الخلية الأخيرة عند اكتمال الرمز. ويومض مؤشر الكتابة كما يومض في الحقل النصي (نصف ثانية ظاهر ونصف ثانية مخفي، ويثبت لحظة بعد كل تعديل)، عبر شفافيته، بشكل أصلي، مع بقائه في مكانه في التخطيط؛ ومع تقليل الحركة يبقى ثابتًا. والضغط في أي موضع على المُدخل يمنحه التركيز: فالحقل يقع فوق الخلايا.

الخلية التي فيها رقم، مُقنَّعًا كان أو لا، لها السمة `data-filled`، فتُنسِّق الأصناف `data-filled:` الخلايا التي ملأها المستخدم (حدّ أقوى، تعبئة: `data-filled:border-foreground data-filled:bg-muted`)، كما يكتب shadcn/ui حالاته. ومع `group` في `cellClass`، تُنسِّق الأصناف `group-data-filled:` ما داخل الخلية المملوءة، أي رقمها. تغيّر الخلايا أصنافها ولا تغيّر محتواها أبدًا، فيُعاد تنسيق خلية واحدة عند كل ضغطة مفتاح، ولا يُعاد رسم أي شيء.

<a id="accessibility"></a>

## إمكانية الوصول

- تجد قارئات الشاشة حقلًا نصيًا واحدًا، اسمه من `accessibilityLabel` (اذكر الغرض من الرمز وطوله: "رمز التحقق، 6 أرقام") وقيمته هي الرمز؛ أما الخلايا فمخفية عنها. وما دام `masked` فالحقل آمن، فلا يُقرأ الرمز بصوت عالٍ.
- لوحة المفاتيح هي لوحة المنصة: لوحة الأرقام على الهواتف، وأي لوحة مفاتيح على أجهزة سطح المكتب (تُقبل الأرقام فقط)، ومفتاح Backspace. ويصل Tab إلى المُدخل كما يصل إلى أي حقل نصي.
- ما دام `disabled` فلا يأخذ تركيزًا، وتعلن قارئات الشاشة أنه معطّل.

انظر [إمكانية الوصول](../docs/accessibility.md) للاطلاع على التسميات والأدوار والإعلانات بوجه عام.

<a id="platform-notes"></a>

## ملاحظات المنصات

- iOS: الحقل حقل رمز (`textContentType` `oneTimeCode`)، فيعرض شريط QuickType رمزًا من Messages أو Mail؛ وتظهر لوحة الأرقام. ويبدأ حقل `masked` من جديد عند الكتابة فيه مرة أخرى بعد فقدانه التركيز، كما تفعل الحقول الآمنة في iOS.
- Android: يتيح `autofillHints` `smsOTPCode` للوحة المفاتيح وخدمة الملء التلقائي اقتراح رمز الرسالة النصية؛ وتظهر لوحة الأرقام.
- macOS وWindows وLinux والويب: تذهب الكتابة واللصق إلى الحقل (في المتصفح، مع `inputmode="numeric"` للوحة أرقام الهاتف)، ويظهر مؤشر I-beam فوق الخلايا.
