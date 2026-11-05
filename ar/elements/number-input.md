---
title: "NumberInput"
description: "مكوّن NumberInput: رقم يُكتب في حقل أو يُغيَّر بخطوات عبر الأزرار ومفاتيح الأسهم وقارئات الشاشة، ويلتزم بعدد الخانات العشرية الخاص بالخطوة وبالحدّين الأدنى والأقصى (min وmax)، ويتضمن حقلًا وأزرارًا وعمودًا للتحكم يمكن للتطبيق تنسيقها."
group: base
demo: el-number-input
source_hash: 4dd788dd07f8f04a
---

# NumberInput

يحتفظ مُدخل الأرقام برقم يكتبه المستخدم أو يغيّره بالخطوات: كمية أو سعر أو حجم. وهو يملك سلوكه بنفسه: يقبل حقله رقمًا، أو النص الذي في طريقه إلى أن يصبح رقمًا (`-`، `1.`)، ويرفض كل ما عدا ذلك، بما في ذلك أرقام وإشارات لوحات المفاتيح الأخرى؛ وأزراره، ومفتاحا Up وDown، وإجراءا الزيادة والإنقاص في قارئ الشاشة، تغيّر الرقم بمقدار `step` مع الحفاظ على خاناته العشرية، وتتوقف عند `min` و`max`؛ ومغادرة الحقل تقيّد الرقم المكتوب بهما. أما المظهر فللتطبيق: `NumberInput` لا يملك ألوانًا أو أحجامًا أو حدودًا أو أيقونات أو نصوصًا خاصة به. ويتكوّن من زر الإنقاص، والحقل بين `prefix` و`suffix` الخاصين بالتطبيق، وزر الزيادة (أو الحقل بينهما وعمود يضم الزرين، `controlsRight`)، وينسّق التطبيق كل جزء ويملأ الأزرار.

```rust tabs
use nsh_base::{number_input, theme};
use nsh_core::prelude::*;

fn tickets(count: Signal<Option<f64>>) -> impl IntoElement {
    number_input()
        .value(move || count.get())
        .min(1.0)
        .max(10.0)
        .accessibility_label("Tickets")
        .on_change(move |next: &Option<f64>| count.set(*next))
        .h(px(32.0))
        .flex_row()
        .rounded(px(8.0))
        .border_1()
        .border_color(move || theme().input)
        .input_style(|s| s.flex_1().text_center().text_color(move || theme().foreground))
        .decrement_button_style(|s| s.w(px(32.0)).items_center().justify_center())
        .increment_button_style(|s| s.w(px(32.0)).items_center().justify_center())
        .decrement_button(text("−"))
        .increment_button(text("+"))
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { NumberInput } from "nsh/base";

function App() {
  const tickets = signal<number | null>(2);
  return (
    <NumberInput
      value={tickets()}
      onChange={({ value }) => tickets.set(value)}
      min={1}
      max={10}
      accessibilityLabel="Tickets"
      class="h-8 flex-row overflow-hidden rounded-lg border border-input bg-field focus-within:outline-2 focus-within:outline-ring"
      inputClass="flex-1 text-center text-foreground"
      decrementButtonClass="w-8 items-center justify-center enabled:hover:bg-accent active:bg-muted disabled:opacity-40"
      incrementButtonClass="w-8 items-center justify-center enabled:hover:bg-accent active:bg-muted disabled:opacity-40"
      decrementButton={<Text>−</Text>}
      incrementButton={<Text>+</Text>}
    />
  );
}

mount(App);
```

يأتي `NumberInput` من [`nsh/base`](../modules/nsh-base.md)، وهي حزمة (crate) `nsh-base` في Rust. في Rust، ينشئ `number_input()` واحدًا منه بدالة ضبط (setter) لكل خاصية (`.value(..)`، `.input_style(..)`)، ودالة مستمع لكل حدث (`.on_change(..)`)، ودوال التنسيق المطبّعة للمُدخل نفسه، و`.prefix(..)` / `.suffix(..)` لما يحيط بالحقل. وقيمته من النوع `Option<f64>`.

<a id="value"></a>

## القيمة

القيمة رقم، أو `null` للحقل الفارغ. يملكها التطبيق عبر `value` ويضبط القيمة التي يبلغ عنها `onChange`، كما في كل عنصر تحكم في `nsh/base`؛ أو يترك القيمة للمُدخل عبر `defaultValue`، ويسمع التغييرات مع ذلك.

يُفصل نص الحقل عن القيمة حيثما لزم ذلك، ليتمكن المستخدم من الكتابة بحرية:

- يبلغ `onChange` عن الرقم الذي يُقرأ من النص كلما تغيّر هذا الرقم: `null` عندما لا يُقرأ من النص أي رقم (فارغ، `-`، `.`)؛ وكتابة `1.` بعد `1`، أو `1.50` بعد `1.5`، لا تُبلغ عن شيء.
- يبقى النص كما كتبه المستخدم ما دام يُقرأ على أنه القيمة التي يحتفظ بها المُدخل، لذا فإن مُدخلًا متحكَّمًا به يعيد كل قيمة مُبلَّغ عنها يحتفظ بـ `1.` و`2.50`. أما القيمة التي يضبطها التطبيق ولم يبلّغ عنها المُدخل فتظهر في الحقل بأقصر نص يُقرأ منه (`0.3`، `12`).
- أثناء الكتابة قد يكون الرقم خارج `min` و`max` (الرقم 1 في طريقه إلى 15 مع `min={10}`)، ويُبلَّغ عنه كما كُتب. وعند مغادرة الحقل، أو عند الضغط على Return / Enter، يُقيَّد الرقم بالنطاق ويُبلَّغ بذلك؛ أما النص الذي لا يُقرأ منه أي رقم فيبقى كما هو.
- تطلب الخطوة (زر أو مفتاح أو إجراء من قارئ الشاشة) القيمة التالية عبر `onChange`؛ ومع قيمة متحكَّم بها يتحرك الحقل عندما يعيدها التطبيق، محتفظًا بخانات الخطوة العشرية (`99.5` صعودًا إلى `max={100}` يعرض `100.0`)، فالتطبيق الذي يرفض خطوة يُبقي الحقل حيث هو. والتعديل الذي يرفضه التطبيق يبقى في الحقل ما دام قيد التحرير، ويزول عند مغادرة الحقل.

```tsx
const price = signal<number | null>(19.95);

<NumberInput
  value={price()}
  onChange={({ value }) => price.set(value)}
  onSubmit={({ value }) => save(value)}
  min={0}
  step={0.05}
  placeholder="Price"
  accessibilityLabel="Price"
/>;
```

يقبل الحقل:

- أرقامًا، ونقطة عشرية واحدة، وإشارة في البداية (`+` أو `-`)؛ ويُرفض الحرف، أو النقطة أو الإشارة الثانية، أو الإشارة في موضع آخر، ويعود الحقل إلى نصه.
- الأرقام والإشارات والنقطة بالعرض الكامل، وعلامة الطرح (U+2212)، والنقطة الأيديوغرافية (`。`)، وتُقرأ بصيغها في ASCII، كما تكتبها طرق الإدخال الصينية واليابانية.
- فاصلة بوصفها نقطة عشرية ما دام النص خاليًا من النقطة (`3,25` تعني 3.25)، كما يكتبها مفتاح الكسر العشري في لوحات مفاتيح لغات كثيرة.

<a id="props"></a>

## الخاصيات

| الخاصية | Rust | النوع | الافتراضي | الوصف |
|---|---|---|---|---|
| `value` | `.value(..)` | `number \| null` | لا شيء | القيمة (متحكَّم بها): رقم، أو `null` للحقل الفارغ. يضبط التطبيق القيمة التي يبلغ عنها `onChange`. |
| `defaultValue` | `.default_value(..)` | `number \| null` | لا شيء | القيمة الأولية ما دام `value` غير مضبوط؛ فيحتفظ المُدخل حينئذٍ بقيمته الخاصة. |
| `min` | `.min(..)` | `number` | لا شيء | أصغر قيمة: تتوقف الخطوات عندها، والقيمة المكتوبة الأقل منها تُقيَّد بها عند مغادرة الحقل. |
| `max` | `.max(..)` | `number` | لا شيء | أكبر قيمة، مثلما يعمل `min` من الأعلى؛ وما كان أقل من `min` فهو `min`. |
| `step` | `.step(..)` | `number` | `1` | مقدار الخطوة (Page Up / Page Down: عشر خطوات)؛ وما ليس رقمًا موجبًا فهو `1`. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | لا كتابة ولا خطوات ولا تركيز؛ وتنطبق فئات `disabled:` على المُدخل وأجزائه. |
| `readonly` | `.readonly(..)` | `boolean` | `false` | يمكن تحديد النص ونسخه لكن لا يمكن تغييره، لا بالكتابة ولا بالخطوات؛ والأزرار معطّلة. |
| `placeholder` | `.placeholder(..)` | `string` | لا شيء | يظهر ما دام الحقل فارغًا. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | لا شيء | ما تنطق به قارئات الشاشة للحقل، عندما لا توجد تسمية مرئية تسمّيه. |
| `controlsRight` | `.controls_right(..)` | `boolean` | `false` | الزران معًا في عمود على يمين الحقل، وزر الزيادة فوق زر الإنقاص. يُقرأ عند إنشاء المُدخل. |
| `inputClass`، `inputStyle` | `.input_style(\|s\| ..)` | `string`، `StyleProp<InputStyle>` | لا شيء | الحقل: صندوقه ونصه (`color`، `fontSize`، `textAlign`، `placeholderColor`، `caretColor`). |
| `decrementButtonClass`، `decrementButtonStyle` | `.decrement_button_style(\|s\| ..)` | `string`، `StyleProp<ViewStyle>` | لا شيء | زر الإنقاص. |
| `incrementButtonClass`، `incrementButtonStyle` | `.increment_button_style(\|s\| ..)` | `string`، `StyleProp<ViewStyle>` | لا شيء | زر الزيادة. |
| `decrementButton`، `incrementButton` | `.decrement_button(..)`، `.increment_button(..)` | `JSX.Element` | لا شيء | محتوى الأزرار: علامة أو أيقونة. |
| `controlsClass`، `controlsStyle` | `.controls_style(\|s\| ..)` | `string`، `StyleProp<ViewStyle>` | لا شيء | العمود الذي يضم الزرين مع `controlsRight`. |
| `prefix` | `.prefix(..)` | `JSX.Element` | لا شيء | ما يأتي قبل الحقل، بعد الزر الموجود على يساره: علامة عملة أو أيقونة. |
| `suffix` | `.suffix(..)` | `JSX.Element` | لا شيء | ما يلي الحقل، قبل الأزرار على يمينه: وحدة أو عملة. |
| `class`، `style` | دوال التنسيق | `string`، `StyleProp<ViewStyle>` | لا شيء | المُدخل نفسه: الصف المحيط بالحقل والأزرار. |

<a id="events"></a>

## الأحداث

| الحدث | Rust | الحمولة | متى |
|---|---|---|---|
| `onChange` | `.on_change(\|value: &Option<f64>\| ..)` | `{ value: number \| null }` | تغيّر الرقم الذي يُقرأ من الحقل (كتابة، أو خطوة، أو زيادة أو إنقاص من قارئ الشاشة، أو مغادرة الحقل بقيمة خارج النطاق). |
| `onSubmit` | `.on_submit(\|value: &Option<f64>\| ..)` | `{ value: number \| null }` | Return / Enter في الحقل: القيمة، مقيَّدة بـ `min` و`max`. |
| `onFocus` | `.on_focus(..)` | لا شيء | حصل الحقل على تركيز لوحة المفاتيح. |
| `onBlur` | `.on_blur(..)` | لا شيء | فقد الحقل تركيز لوحة المفاتيح (بعد تقييد قيمته بـ `min` و`max` أولًا). |

<a id="parts"></a>

## الأجزاء

| الجزء | الموضع | التنسيق بـ |
|---|---|---|
| المُدخل | | `class`، `style` |
| زر الإنقاص | المُدخل، أولًا (مع `controlsRight`: عمود الأزرار، ثانيًا) | `decrementButtonClass`، `decrementButtonStyle`؛ ومحتواه `decrementButton` |
| الحقل | المُدخل | `inputClass`، `inputStyle` |
| البادئة | المُدخل، قبل الحقل | عناصرها الخاصة (`prefix`) |
| اللاحقة | المُدخل، بعد الحقل | عناصرها الخاصة (`suffix`) |
| زر الزيادة | المُدخل، أخيرًا (مع `controlsRight`: عمود الأزرار، أولًا) | `incrementButtonClass`، `incrementButtonStyle`؛ ومحتواه `incrementButton` |
| عمود الأزرار | المُدخل، أخيرًا، مع `controlsRight` | `controlsClass`، `controlsStyle` |

المُدخل صف يرتّبه التطبيق: `flex-row` على `class`، و`flex-1` على الحقل ليأخذ المساحة التي تتركها الأزرار. الحالات التي تعرضها الأجزاء:

- المُدخل: `focus-within:` ما دام حقله قيد التحرير (حلقة حول المُدخل كله)، `disabled:`.
- الحقل: `focus:` ما دام قيد التحرير، `disabled:`.
- الزر: `hover:` تحت المؤشر، `active:` أثناء الضغط، `disabled:` عندما يكون المُدخل معطّلًا أو للقراءة فقط، وحيث لا تفعل الخطوة شيئًا (الإنقاص عند `min`، والزيادة عند `max`). ضع التمرير خلف `enabled:` (`enabled:hover:bg-accent`) كي لا يضيء الزر المعطّل.

حركة الحالات من اختيار التطبيق (`transition-colors`)، و`motion-reduce:` يُبقيها ساكنة لمن يطلبون حركة أقل.

<a id="keyboard"></a>

## لوحة المفاتيح

ما دام الحقل قيد التحرير، يلتقط المُدخل مفاتيح spin button في WAI-ARIA، وهي تتكرر عند إبقائها مضغوطة:

| المفتاح | الوظيفة |
|---|---|
| Up | خطوة واحدة للأعلى. |
| Down | خطوة واحدة للأسفل. |
| Page Up, Page Down | عشر خطوات للأعلى أو للأسفل. |

يبقى Home وEnd للحقل: فهما يحركان المؤشر في النص. والأزرار ليست محطات لتركيز لوحة المفاتيح: ينتقل Tab من الحقل إلى ما يلي المُدخل، وتُبقي الضغطة على زر التركيز في الحقل (في أجهزة سطح المكتب تنقل الضغطة التركيز إلى الحقل إن كان في مكان آخر؛ وفي الشاشات اللمسية تتركه حيث هو، فلا تظهر لوحة مفاتيح).

<a id="accessibility"></a>

## إمكانية الوصول

- الحقل هو spin button (`"spinbutton"`) مع تسميته وقيمته (الرقم الذي يُقرأ منه، بين `min` و`max`) ونصه.
- تغيّره إجراءا الزيادة والإنقاص في قارئ الشاشة (السحب لأعلى ولأسفل في VoiceOver) بخطوة، كما يفعل Up وDown.
- الأزرار مخفية عن قارئات الشاشة، كما هي في حقل الأرقام في المتصفح: فإجراءا الزيادة والإنقاص في الحقل نفسه يغيّرانه بخطوة.
- ما دام `disabled`، تُعلن قارئات الشاشة أن الحقل معتَّم.

راجع [Accessibility](../docs/accessibility.md) للاطلاع على التسميات والأدوار والإجراءات بوجه عام.

<a id="platform-notes"></a>

## ملاحظات المنصات

- الحقل هو حقل النص الخاص بالمنصة ([Input](./input.md)): فلوحة المفاتيح والمؤشر والتحديد والنسخ واللصق وطرق الإدخال كلها من النظام. وتعرض الهواتف لوحة مفاتيح عشرية، مع إشارة عندما يكون `min` أقل من 0 أو غير مضبوط.
- ترسم كل منصة ما ينسّقه التطبيق. وتصل مفاتيح Up / Down وPage Up / Page Down إلى المُدخل من لوحة مفاتيح فعلية على كل منصة.
