---
title: "Radio"
description: "Radio وRadioGroup: مجموعة من الخيارات يختار المستخدم منها خيارًا واحدًا فقط. يتولى كل Radio معالجة الضغطات والتفعيل عبر لوحة المفاتيح وحالة التعطيل ودوره وحالة تحديده لقارئات الشاشة؛ أما المجموعة فهي الإطار الذي يضم هذه الخيارات؛ بينما يتولى التطبيق المظهر والقيمة."
group: base
demo: el-radio
source_hash: 051314109ae3d0b2
---

# Radio

تقدّم مكوّنات Radio مجموعة من الخيارات يختار المستخدم منها خيارًا واحدًا فقط: خطة، أو ترتيب فرز، أو سمة. يتولى كل `Radio` سلوك خيار واحد: الضغطات، والتفعيل بلوحة المفاتيح، وحالة التعطيل، ودور radio وحالته المحددة لقارئات الشاشة. أما `RadioGroup` الذي يحيط بها فهو المجموعة، وتعلنها قارئات الشاشة كمجموعة واحدة. المظهر يعود إلى التطبيق: لا يملك الـ radio دائرة ولا نقطة ولا ألوانًا ولا أحجامًا ولا تسمية خاصة به. أبناؤه هم مؤشر التطبيق وتسميته، وفئات `checked:` على الـ radio، أو فئات `group-checked:` على ما بداخله، تتبع حالته.

```rust tabs
use nsh_base::{radio, radio_group, theme};
use nsh_core::prelude::*;

fn plans() -> impl IntoElement {
    let plan = signal("basic");
    let option = move |value: &'static str, label: &'static str| {
        let checked = move || plan.get() == value;
        radio()
            .checked(checked)
            .on_change(move |_: &bool| plan.set(value))
            .flex_row()
            .items_center()
            .gap_2()
            .child(
                view()
                    .size(px(20.0))
                    .items_center()
                    .justify_center()
                    .rounded_full()
                    .border_2()
                    .border_color(move || theme().border)
                    .child(
                        view()
                            .size(px(10.0))
                            .rounded_full()
                            .bg(move || theme().primary)
                            .opacity(move || if checked() { 1.0_f32 } else { 0.0 }),
                    ),
            )
            .child(text(label))
    };
    radio_group()
        .gap_3()
        .child(option("basic", "Basic"))
        .child(option("pro", "Pro"))
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { Radio, RadioGroup } from "nsh/base";

function App() {
  const plan = signal("basic");
  const option = (value: string, label: string) => (
    <Radio
      checked={plan() === value}
      onChange={() => plan.set(value)}
      class="group flex-row items-center gap-2"
    >
      <View class="size-5 items-center justify-center rounded-full border-2 border-border group-checked:border-primary">
        <View class="size-2.5 rounded-full group-checked:bg-primary" />
      </View>
      <Text>{label}</Text>
    </Radio>
  );
  return (
    <RadioGroup class="gap-3">
      {option("basic", "Basic")}
      {option("pro", "Pro")}
    </RadioGroup>
  );
}

mount(App);
```

`Radio` و`RadioGroup` يأتيان من [`nsh/base`](../modules/nsh-base.md)، وهو الـ crate `nsh-base` في Rust. القيمة للتطبيق: لا تحتفظ المجموعة بأي قيمة. يُخبَر كل radio ما إذا كان محددًا؛ والضغط على radio غير محدد يُبلغ عن `onChange({ checked: true })`، فيضبط التطبيق قيمته، ويعرض كل radio قيمة `checked` التي يمررها التطبيق. في Rust، `radio()` و`radio_group()` ينشئانهما، مع دالة ضبط لكل خاصية (`.checked(..)`)، ومستمع لكل حدث (`.on_change(..)`)، ودوال التنسيق المطبّعة و`.child(..)` لمحتواهما.

<a id="props"></a>

## الخصائص

<a id="radio-1"></a>

### Radio

| الخاصية | Rust | النوع | الافتراضي | الوصف |
|---|---|---|---|---|
| `checked` | `.checked(..)` | `boolean` | `false` | محدد أو غير محدد. الضغط على radio غير محدد يُبلغ عن `true` مع `onChange`؛ ويعرض الـ radio القيمة التي يمررها التطبيق. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | لا ضغطات ولا استجابة للضغط؛ تُطبَّق أنماط `disabled:`، وتذكر قارئات الشاشة أنه باهت (dimmed). |
| `checkedStyle` | `.checked_style(\|s\| ..)` | `StyleProp<ViewStyle>` | لا شيء | نمط الـ radio عندما يكون محددًا وغير معطّل، على هيئة فئات `checked:`. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | لا شيء | ما تنطق به قارئات الشاشة: الخيار، عندما لا يكون في أبنائه نص يذكره. |
| `hitSlop` | `.hit_slop(..)` | `number \| Partial<Edges>` | لا شيء | إلى أي مدى خارج حدوده تُحتسب الضغطات، بالنقاط: رقم واحد لكل الجوانب، أو الجوانب مسماة. كما في `hitSlop` الخاص بالـ view. |
| `children` | `.child(..)` | `JSX.Element` | لا شيء | مؤشر التطبيق وتسميته، وهما ما تنطق به قارئات الشاشة. |
| `class`، `style` | دوال التنسيق | `string`، `StyleProp<ViewStyle>` | لا شيء | الـ radio نفسه: الصف المحيط بالمؤشر والتسمية. |
| `activeStyle`، `hoverStyle`، `focusStyle`، `disabledStyle` | `.active(\|s\| ..)`، `.hover(..)`، `.focus(..)`، `.disabled_style(..)` | `StyleProp<ViewStyle>` | لا شيء | نمط الـ radio أثناء الضغط أو التمرير أو التركيز أو التعطيل، على هيئة فئات `<state>:`. |

### RadioGroup

| الخاصية | Rust | النوع | الافتراضي | الوصف |
|---|---|---|---|---|
| `children` | `.child(..)` | `JSX.Element` | لا شيء | مكوّنات Radio في المجموعة، وأي شيء يرتبه التطبيق بينها. |
| `class`، `style` | دوال التنسيق | `string`، `StyleProp<ViewStyle>` | لا شيء | تخطيط المجموعة ومظهرها: عمود افتراضيًا، و`flex-row` لصف. |

<a id="events"></a>

## الأحداث

| الحدث | Rust | الوصف |
|---|---|---|
| `onChange` (`Radio`) | `.on_change(\|checked: &bool\| ..)` | ضُغط على radio غير محدد: لمسة، أو نقرة، أو Space أو Return أثناء امتلاكه تركيز لوحة المفاتيح، أو تفعيل من قارئ شاشة؛ أو نقل مفتاح سهم في مجموعته تركيز لوحة المفاتيح إليه. هو يطلب أن يُحدَّد، ولذلك `checked` يساوي `true`. يعمل قبل أن يتغير أي شيء: يعرض الـ radio قيمة `checked` التي يمررها التطبيق. |

يبقى الـ radio المحدد محددًا ولا يُبلغ عن شيء، إذ لا يستطيع الـ radio إلغاء تحديد نفسه؛ كما أن الـ radio المعطّل لا يُبلغ عن شيء أيضًا.

<a id="parts"></a>

## الأجزاء

| الجزء | داخل | التنسيق بواسطة | الحالات |
|---|---|---|---|
| المجموعة | | `RadioGroup`: `class`، `style` | |
| الـ radio | المجموعة | `Radio`: `class`، `style` | `checked:`، `disabled:`، `active:`، `hover:`، `focus:` (أو `checkedStyle`، `disabledStyle`، ...) |
| المؤشر والتسمية | الـ radio | عناصرها الخاصة (`children`) | `group-checked:` و`group-disabled:` وبقية متغيرات `group-*:` مع `group` على `class` الخاص بالـ radio |

المؤشر هو محتوى التطبيق: حلقة بنقطة، أو علامة اختيار، أو بطاقة مميزة. مع `group` على `class` الخاص بالـ radio، تُظهر فئات `group-checked:` فيه النقطة ما دام الـ radio محددًا.

<a id="disabled"></a>

## التعطيل

لا يستقبل الـ radio المعطّل أي ضغطات، وتعلنه قارئات الشاشة على أنه باهت. تُطبَّق فئات `disabled:` فيه فوق فئات `checked:`، وتتبعها فئات `group-disabled:` داخله:

```tsx
<Radio
  checked={plan() === "team"}
  disabled={!eligible()}
  onChange={() => plan.set("team")}
  class="group flex-row items-center gap-2 disabled:opacity-50"
>
  <View class="size-5 items-center justify-center rounded-full border-2 border-border group-checked:border-primary">
    <View class="size-2.5 rounded-full group-checked:bg-primary" />
  </View>
  <Text>Team</Text>
</Radio>
```

<a id="a-small-target-with-hitslop"></a>

## هدف صغير مع hitSlop

قد يكون الـ radio الذي لا تسمية بجانبه (نقطة في صف جدول) أصغر من إصبع. يجعل `hitSlop` الضغطات التي تقع قريبًا منه تُحتسب، بالنقاط خارج كل جانب، دون تغيير تخطيطه أو مظهره: رقم واحد لكل الجوانب، أو الجوانب مسماة (`{ top: 8, bottom: 8 }`)، كما يقبلها [`hitSlop` الخاص بالـ view](./index.md#presses-and-feedback).

```tsx
<Radio
  checked={plan() === "team"}
  hitSlop={12}
  accessibilityLabel="Team"
  onChange={() => plan.set("team")}
  class="group size-5 items-center justify-center rounded-full border-2 border-border group-checked:border-primary"
>
  <View class="size-2.5 rounded-full group-checked:bg-primary" />
</Radio>
```

<a id="accessibility"></a>

## إمكانية الوصول

- الـ radio عنصر واحد لقارئات الشاشة، بالدور `"radio"` وحالته: محدد أو غير محدد، ومختار ما دام محددًا، لأن بعض قارئات الشاشة تقرأ الأولى وبعضها الثانية (أزرار radio في UI Automation هي عناصر اختيار). المؤشر والتسمية جزءان منه؛ وتسميته هي نص أبنائه، أو `accessibilityLabel`.
- يحمل `RadioGroup` الدور `"radiogroup"`: تسمع قارئات الشاشة أزرار radio بداخله كمجموعة واحدة، ويبقى كل منها عنصرًا مستقلًا.
- يُعلَن `disabled` كما تعلنه المنصة (VoiceOver وTalkBack وUI Automation وشجرة إمكانية الوصول في المتصفح).
- على macOS والويب يمثل `RadioGroup` محطة واحدة لتركيز لوحة المفاتيح، وتنقل مفاتيح الأسهم بين أزرار radio فيه وتحددها (أدناه).

راجع [إمكانية الوصول](../docs/accessibility.md) للاطلاع على التسميات والأدوار والإعلانات بشكل عام.

<a id="keyboard"></a>

## لوحة المفاتيح

على macOS والويب، حيث يصل Tab إلى الـ views التي تستقبل الضغطات، يتبع `RadioGroup` [نمط مجموعة radio في WAI-ARIA](https://www.w3.org/WAI/ARIA/apg/patterns/radio/):

| المفتاح | ما يفعله |
|---|---|
| Tab، Shift+Tab | يدخل المجموعة عند الـ radio المحدد (أول radio غير معطّل إن لم يكن هناك محدد)، ويغادرها في خطوة واحدة. |
| Down، Right | ينقل التركيز إلى الـ radio التالي، ومن الأخير إلى الأول، ويحدده. |
| Up، Left | ينقل التركيز إلى الـ radio السابق، ومن الأول إلى الأخير، ويحدده. |
| Space | يحدد الـ radio الذي عليه التركيز. |

تتخطى مفاتيح الأسهم أزرار radio المعطّلة؛ ويطلب الـ radio الذي تنتقل إليه أن يُحدَّد عبر `onChange`، ويحدده التطبيق. في التخطيط من اليمين إلى اليسار يتبادل Left وRight موضعيهما: ينقل Left إلى الـ radio التالي وRight إلى السابق؛ أما Up وDown فيحتفظان بوظيفتيهما. تُظهر أنماط `focus:` موضع التركيز. أما `Radio` خارج `RadioGroup` فهو محطة مستقلة، يصل إليها Tab ويحدده Space وReturn.

<a id="platform-notes"></a>

## ملاحظات حسب المنصة

- iOS وAndroid وMac Catalyst: الضغطة هي لمسة تنتهي على الـ radio، بما في ذلك تسميته.
- أنظمة سطح المكتب (macOS وWindows وLinux وGPUI) والويب: الضغطة هي نقرة. على macOS والويب، يحدد Space وReturn أيضًا الـ radio الذي عليه تركيز لوحة المفاتيح، وتنقله مفاتيح الأسهم ([لوحة المفاتيح](#keyboard)).
- كل منصة ترسم ما ينسقه التطبيق: المؤشر والتسمية وانتقالاتهما.
