---
title: "Checkbox"
description: "مكوّن Checkbox: عنصر تحكم بحالة محددة أو غير محددة أو غير محسومة، يتولى معالجة النقرات والتنشيط عبر لوحة المفاتيح وحالة التعطيل ودوره وقيمته لقارئات الشاشة، مع مؤشر يتولى التطبيق تنسيقه ووضع العلامة عليه."
group: base
demo: el-checkbox
source_hash: c31b1f22eacafd92
---

# Checkbox

يحدد الـ Checkbox خيارًا، أو عنصرًا من قائمة، أو كل العناصر. وهو إما محدد، أو غير محدد، أو في حالة غير حاسمة (أي لا هذا ولا ذاك: مثل "تحديد الكل" عندما يكون التحديد جزئيًا). وهو يتولى السلوك: الضغطات، والتفعيل بلوحة المفاتيح، وحالة التعطيل، ودور الـ checkbox وقيمته لقارئات الشاشة. أما المظهر فهو من مسؤولية التطبيق: فالعنصر `Checkbox` ليس له مربع ولا علامة ولا ألوان ولا أحجام ولا تسمية خاصة به. ويتكوّن من مؤشر (المربع) تظهر بداخله علامة التطبيق، ثم أبنائه (التسمية)، ويُنسّق التطبيق كل جزء بفئات `checked:` و`indeterminate:` و`disabled:` التي تتبع حالة الـ checkbox.

```rust tabs
use nsh_base::{checkbox, theme};
use nsh_core::prelude::*;

fn notify() -> impl IntoElement {
    let on = signal(false);
    checkbox()
        .checked(on)
        .on_change(move |next: &bool| on.set(*next))
        .flex_row()
        .items_center()
        .gap_2()
        .indicator_style(|s| {
            s.size(px(20.0))
                .items_center()
                .justify_center()
                .rounded_md()
                .border_2()
                .border_color(move || theme().border)
                .transition_colors()
                .checked(|s| s.bg(move || theme().primary).border_color(move || theme().primary))
        })
        .indicator(text(move || if on.get() { "✓" } else { "" }).text_color(move || theme().primary_foreground))
        .child(text("Notify me"))
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { Checkbox } from "nsh/base";

function App() {
  const on = signal(false);
  return (
    <Checkbox
      checked={on()}
      onChange={({ checked }) => on.set(checked)}
      class="flex-row items-center gap-2"
      indicatorClass="size-5 items-center justify-center rounded-md border-2 border-border transition-colors checked:border-primary checked:bg-primary"
      indicator={<Text class="text-primary-foreground">{on() ? "✓" : ""}</Text>}
    >
      <Text>Notify me</Text>
    </Checkbox>
  );
}

mount(App);
```

يأتي `Checkbox` من [`nsh/base`](../modules/nsh-base.md)، وهي الـ crate `nsh-base` في Rust. والقيمة ملك للتطبيق: فالضغطة تُبلّغ بالقيمة التالية عبر `onChange`، ويعرض الـ checkbox القيمتين `checked` و`indeterminate` اللتين يمررهما التطبيق إليه. في Rust، ينشئ `checkbox()` عنصرًا بدالة ضبط لكل خاصية (`.checked(..)`، `.indicator_style(..)`)، ومستمعًا لكل حدث (`.on_change(..)`)، ودوال التنسيق المطبوعة للـ checkbox نفسه، و`.child(..)` لتسميته؛ أما تنسيق المؤشر فيقبل دوال الحالات (`.checked(..)`، `.indeterminate(..)`، `.disabled_style(..)`) التي تتبع حالة الـ checkbox.

<a id="props"></a>

## الخصائص

| الخاصية | Rust | النوع | الافتراضي | الوصف |
|---|---|---|---|---|
| `checked` | `.checked(..)` | `boolean` | `false` | محدد أو غير محدد. تُبلّغ الضغطة بالقيمة التالية عبر `onChange`؛ ويعرض الـ checkbox القيمة التي يمررها التطبيق إليه. |
| `indeterminate` | `.indeterminate(..)` | `boolean` | `false` | لا محدد ولا غير محدد، ويتقدم على `checked` ما دامت هذه الحالة قائمة: تعلن قارئات الشاشة أنه مختلط، وتطلب الضغطة القيمة "محدد". |
| `disabled` | `.disabled(..)` | `boolean` | `false` | لا ضغطات ولا استجابة بصرية للضغط؛ وتنطبق تنسيقات `disabled:` على الـ checkbox ومؤشره، وتعلن قارئات الشاشة أنه معتّم. |
| `checkedStyle` | `.checked_style(\|s\| ..)` | `StyleProp<ViewStyle>` | لا شيء | تنسيق الـ checkbox أثناء كونه محددًا وغير معطّل، على شكل فئات `checked:`. |
| `indeterminateStyle` | `.indeterminate_style(\|s\| ..)` | `StyleProp<ViewStyle>` | لا شيء | تنسيق الـ checkbox أثناء كونه غير حاسم وغير معطّل، على شكل فئات `indeterminate:`. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | لا شيء | ما تنطق به قارئات الشاشة: ما يحدده الـ checkbox، عندما لا يحتوي أبناؤه على نص يوضح ذلك. |
| `role` | `.role(..)` | `AccessibilityRole` | `"checkbox"` | ماهيته لقارئات الشاشة، عندما يكون شيئًا أكثر تحديدًا (عنصر قائمة محدد: `"menuitem"`). |
| `indicatorClass`، `indicatorStyle` | `.indicator_style(\|s\| ..)` | `string`، `StyleProp<ViewStyle>` | لا شيء | المؤشر، وهو المربع الذي يعرض القيمة. |
| `indicator` | `.indicator(..)` | `JSX.Element` | لا شيء | محتوى المؤشر: العلامة (إشارة صح، أو شرطة)، ويعرضها التطبيق بحسب القيمة. |
| `hitSlop` | `.hit_slop(..)` | `number \| Partial<Edges>` | لا شيء | المسافة خارج حدوده التي ما زالت الضغطات تُحتسب ضمنها، بالنقاط: رقم واحد لكل الجوانب، أو الجوانب مسماة. مثل `hitSlop` في العرض (view). |
| `children` | `.child(..)` | `JSX.Element` | لا شيء | المحتوى بعد المؤشر: التسمية، وتنطق بها قارئات الشاشة. |
| `class`، `style` | دوال التنسيق | `string`، `StyleProp<ViewStyle>` | لا شيء | الـ checkbox نفسه: الصف المحيط بالمؤشر والتسمية. |
| `activeStyle`، `hoverStyle`، `focusStyle`، `disabledStyle` | `.active(\|s\| ..)`، `.hover(..)`، `.focus(..)`، `.disabled_style(..)` | `StyleProp<ViewStyle>` | لا شيء | تنسيق الـ checkbox أثناء الضغط أو التمرير فوقه أو التركيز عليه أو تعطيله، على شكل فئات `<state>:`. |

<a id="events"></a>

## الأحداث

| الحدث | Rust | الوصف |
|---|---|---|
| `onChange` | `.on_change(\|checked: &bool\| ..)` | جرى الضغط على الـ checkbox: نقرة لمس، أو نقرة بالفأرة، أو Space أو Return أثناء حيازته تركيز لوحة المفاتيح، أو تفعيل من قارئ شاشة. يُبلّغ بالقيمة التي يطلبها الـ checkbox عبر `checked`: `true` من حالة غير محدد ومن حالة غير حاسم، و`false` من حالة محدد. |

لا يُبلّغ الـ checkbox المعطّل بأي شيء.

<a id="parts"></a>

## الأجزاء

| الجزء | بداخل | يُنسَّق بـ | الحالات |
|---|---|---|---|
| الـ checkbox | | `class`، `style` | `checked:`، `indeterminate:`، `disabled:`، `active:`، `hover:`، `focus:` (أو `checkedStyle`، `indeterminateStyle`، `disabledStyle`، ...) |
| المؤشر | الـ checkbox، أولًا | `indicatorClass`، `indicatorStyle` | `checked:`، `indeterminate:`، `disabled:` تتبع الـ checkbox |
| العلامة | المؤشر | عناصرها الخاصة (`indicator`) | `group-checked:`، `group-indeterminate:` وبقية متغيرات `group-*:` مع `group` على `indicatorClass` |
| التسمية | الـ checkbox، بعد المؤشر | عناصرها الخاصة (`children`) | متغيرات `group-*:` مع `group` على `class` الخاص بالـ checkbox |

العلامة محتوى يقرره التطبيق، فهي تعرض ما يقرره: إشارة صح عند التحديد وشرطة عند الحالة غير الحاسمة، تُختاران من القيمة التي يحتفظ بها التطبيق، أو تُعرض العلامتان معًا مع فئات `group-checked:` / `group-indeterminate:` التي تختار الظاهرة منهما.

<a id="indeterminate"></a>

## الحالة غير الحاسمة

يكون الـ checkbox الخاص بـ "تحديد الكل" في حالة غير حاسمة عندما تكون بعض العناصر فقط محددة. تطلب الضغطة القيمة "محدد"، فيحدد التطبيق كل العناصر:

```tsx
const selected = signal<string[]>([]);
const all = () => selected().length === items.length;
const some = () => selected().length > 0 && !all();

<Checkbox
  checked={all()}
  indeterminate={some()}
  onChange={({ checked }) => selected.set(checked ? items.map((i) => i.id) : [])}
  class="flex-row items-center gap-2"
  indicatorClass="group size-5 items-center justify-center rounded-md border-2 border-border checked:border-primary checked:bg-primary indeterminate:border-primary indeterminate:bg-primary"
  indicator={
    <>
      <Text class="hidden text-primary-foreground group-checked:flex">✓</Text>
      <View class="hidden h-0.5 w-2.5 bg-primary-foreground group-indeterminate:flex" />
    </>
  }
>
  <Text>Select all</Text>
</Checkbox>
```

<a id="disabled"></a>

## التعطيل

لا يقبل الـ checkbox المعطّل أي ضغطات، وتعلن قارئات الشاشة أنه معتّم. تنطبق فئات `disabled:` الخاصة به وبمؤشره، وتتقدم على فئات `checked:` و`indeterminate:`:

```tsx
<Checkbox
  checked={on()}
  disabled={locked()}
  onChange={({ checked }) => on.set(checked)}
  class="flex-row items-center gap-2 disabled:opacity-50"
  indicatorClass="size-5 rounded-md border-2 border-border checked:border-primary checked:bg-primary disabled:border-border disabled:bg-muted"
>
  <Text>Share usage data</Text>
</Checkbox>
```

<a id="a-small-target-with-hitslop"></a>

## هدف صغير مع hitSlop

قد يكون الـ checkbox الذي لا تسمية بجانبه (مثل مربع تحديد صف) أصغر من الإصبع. يجعل `hitSlop` الضغطات التي تقع بالقرب منه تُحتسب، بمسافة بالنقاط خلف كل جانب، دون تغيير تخطيطه أو مظهره: رقم واحد لكل الجوانب، أو الجوانب مسماة (`{ top: 8, bottom: 8 }`)، كما يقبلها [`hitSlop` في العرض (view)](./index.md#presses-and-feedback).

```tsx
<Checkbox
  checked={selected()}
  hitSlop={12}
  accessibilityLabel="Select row"
  onChange={({ checked }) => selected.set(checked)}
  indicatorClass="size-4 rounded border border-border checked:bg-primary"
/>
```

<a id="accessibility"></a>

## إمكانية الوصول

- الـ checkbox عنصر واحد لقارئات الشاشة، بالدور `"checkbox"` (أو `role` الخاص به) وبقيمته: محدد، أو غير محدد، أو مختلط عند الحالة غير الحاسمة. المؤشر والعلامة جزءان منه. وتسميته هي نص أبنائه؛ فمرّر `accessibilityLabel` عندما لا يكون له نص.
- يُعلَن عن `disabled` بالطريقة التي تعلن بها المنصة عنه (VoiceOver وTalkBack وUI Automation وشجرة إمكانية الوصول في المتصفح).
- على macOS والويب يكون الـ checkbox محطة لتركيز لوحة المفاتيح: يصل إليه Tab، ويبدّل حالته Space وReturn، وتُظهر تنسيقات `focus:` موضع التركيز.

راجع [إمكانية الوصول](../docs/accessibility.md) للاطلاع على التسميات والأدوار والإعلانات بوجه عام.

<a id="platform-notes"></a>

## ملاحظات المنصات

- iOS وAndroid وMac Catalyst: الضغطة هي نقرة لمس تنتهي على الـ checkbox، بما في ذلك تسميته.
- أنظمة سطح المكتب (macOS وWindows وLinux وGPUI) والويب: الضغطة هي نقرة. وعلى macOS والويب، يبدّل Space وReturn أيضًا حالة الـ checkbox الحائز على تركيز لوحة المفاتيح.
- ترسم كل منصة ما يُنسّقه التطبيق: المؤشر والعلامة وانتقالاتهما.
