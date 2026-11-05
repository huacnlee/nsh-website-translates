---
title: "Switch"
description: "مكوّن Switch: عنصر تحكم للتشغيل / الإيقاف يتولى معالجة الضغطات والتنشيط عبر لوحة المفاتيح وحالة التعطيل ودوره وقيمته لقارئات الشاشة، مع مسار ومقبض يقوم التطبيق بتنسيقهما."
group: base
demo: el-switch
source_hash: d203427a791f5543
---

# Switch

يقوم الـ Switch بتشغيل إعداد ما أو إيقافه، ويسري التغيير فوراً. وهو المسؤول عن السلوك: الضغطات، والتفعيل عبر لوحة المفاتيح، وحالة التعطيل، ودور switch وقيمته لقارئات الشاشة. أما المظهر فهو من شأن التطبيق: `Switch` ليس له ألوان أو أحجام أو حركة أو تسمية خاصة به. يتكوّن من track بداخله thumb، ثم عناصره الأبناء (تسمية)، ويُنسّق التطبيق كل جزء بفئات `checked:` و`disabled:` التي تتبع الـ Switch.

```rust tabs
use nsh_base::{switch, theme};
use nsh_core::prelude::*;

fn wifi() -> impl IntoElement {
    let on = signal(false);
    switch()
        .checked(on)
        .on_change(move |next: &bool| on.set(*next))
        .flex_row()
        .items_center()
        .gap_3()
        .track_style(|s| {
            s.w(px(44.0))
                .p(px(2.0))
                .rounded_full()
                .bg(move || theme().muted)
                .transition_colors()
                .checked(|s| s.bg(move || theme().primary))
        })
        .thumb_style(|s| {
            s.size(px(20.0))
                .rounded_full()
                .bg(move || theme().background)
                .shadow_sm()
                .transition_transform()
                .checked(|s| s.translate_x(px(20.0)))
        })
        .child(text("Wi-Fi"))
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { Switch } from "nsh/base";

function App() {
  const on = signal(false);
  return (
    <Switch
      checked={on()}
      onChange={({ checked }) => on.set(checked)}
      class="flex-row items-center gap-3"
      trackClass="w-11 rounded-full bg-muted p-0.5 transition-colors checked:bg-primary"
      thumbClass="size-5 rounded-full bg-background shadow-sm transition-transform checked:translate-x-5"
    >
      <Text>Wi-Fi</Text>
    </Switch>
  );
}

mount(App);
```

`Switch` مصدره [`nsh/base`](../modules/nsh-base.md)، وهو crate `nsh-base` في Rust. القيمة من شأن التطبيق: تُبلغ الضغطة عن القيمة التالية عبر `onChange`، ويعرض الـ Switch قيمة `checked` التي يمررها التطبيق من جديد. في Rust، ينشئ `switch()` واحداً منه مع دالة ضبط (setter) لكل خاصية (`.checked(..)`، `.track_style(..)`)، ومستمع لكل حدث (`.on_change(..)`)، ودوال التنسيق المطبّعة للـ Switch نفسه و`.child(..)` لتسميته؛ ويقبل تنسيق الجزء دوال الحالة (`.checked(..)`، `.disabled_style(..)`) التي تتبع الـ Switch.

<a id="props"></a>

## الخصائص

| الخاصية | Rust | النوع | الافتراضي | الوصف |
|---|---|---|---|---|
| `checked` | `.checked(..)` | `boolean` | `false` | تشغيل أو إيقاف. تُبلغ الضغطة عن القيمة التالية عبر `onChange`؛ ويعرض الـ Switch القيمة التي يمررها التطبيق من جديد. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | لا ضغطات ولا استجابة بصرية للضغط؛ تُطبَّق أنماط `disabled:` على الـ Switch وأجزائه، وتذكر قارئات الشاشة أنه معتّم. |
| `checkedStyle` | `.checked_style(\|s\| ..)` | `StyleProp<ViewStyle>` | لا شيء | نمط الـ Switch أثناء `checked` وعدم التعطيل، على هيئة فئات `checked:`. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | لا شيء | ما تنطق به قارئات الشاشة: ما الذي يشغّله الـ Switch، عندما لا يحوي أبناؤه نصاً يقوله. |
| `trackClass`، `trackStyle` | `.track_style(\|s\| ..)` | `string`، `StyleProp<ViewStyle>` | لا شيء | الـ track، وهو الجزء الذي يتحرك الـ thumb على امتداده. |
| `thumbClass`، `thumbStyle` | `.thumb_style(\|s\| ..)` | `string`، `StyleProp<ViewStyle>` | لا شيء | الـ thumb، داخل الـ track. |
| `hitSlop` | `.hit_slop(..)` | `number \| Partial<Edges>` | لا شيء | المسافة خارج حدوده التي تظل الضغطات محتسبة ضمنها، بالنقاط: رقم واحد لكل الجوانب، أو تسمية الجوانب. كما في `hitSlop` الخاص بالـ view. |
| `children` | `.child(..)` | `JSX.Element` | لا شيء | المحتوى بعد الـ track: تسمية تنطق بها قارئات الشاشة. |
| `class`، `style` | دوال التنسيق | `string`، `StyleProp<ViewStyle>` | لا شيء | الـ Switch نفسه: الصف الذي يحيط بالـ track والتسمية. |
| `activeStyle`، `hoverStyle`، `focusStyle`، `disabledStyle` | `.active(\|s\| ..)`، `.hover(..)`، `.focus(..)`، `.disabled_style(..)` | `StyleProp<ViewStyle>` | لا شيء | نمط الـ Switch أثناء الضغط أو التمرير أو التركيز أو التعطيل، على هيئة فئات `<state>:`. |

<a id="events"></a>

## الأحداث

| الحدث | Rust | الوصف |
|---|---|---|
| `onChange` | `.on_change(\|checked: &bool\| ..)` | جرى الضغط على الـ Switch: لمسة، أو نقرة، أو Space أو Return أثناء امتلاكه تركيز لوحة المفاتيح، أو تفعيل من قارئ الشاشة. ويُبلغ عن القيمة التي يطلبها الـ Switch بوصفها `checked`، وهي عكس `checked` التي يحملها. |

لا يُبلغ الـ Switch المعطّل عن شيء.

<a id="parts"></a>

## الأجزاء

| الجزء | بداخل | يُنسَّق بـ | الحالات |
|---|---|---|---|
| الـ Switch | | `class`، `style` | `checked:`، `disabled:`، `active:`، `hover:`، `focus:` (أو `checkedStyle`، `disabledStyle`، ...) |
| الـ track | الـ Switch، أولاً | `trackClass`، `trackStyle` | `checked:`، `disabled:` تتبع الـ Switch |
| الـ thumb | الـ track | `thumbClass`، `thumbStyle` | `checked:`، `disabled:` تتبع الـ Switch |
| التسمية | الـ Switch، بعد الـ track | عناصرها الخاصة (`children`) | `group-checked:` وبقية متغيرات `group-*:` مع `group` على `class` الخاص بالـ Switch |

يتحرك الـ thumb بأنماط `checked:` الخاصة به: إزاحة (`checked:translate-x-5`)، أو هامش أو محاذاة الـ track (`checked:justify-end` على الـ track). وتحرّك فئة `transition-*` التغيير بشكل أصلي (native). ولوضع التسمية قبل الـ track، اعكس اتجاه الصف: `class="flex-row-reverse justify-between"`.

<a id="disabled"></a>

## التعطيل

لا يقبل الـ Switch المعطّل أي ضغطات، وتعلنه قارئات الشاشة على أنه معتّم. وتُطبَّق فئات `disabled:` الخاصة به وبالـ track والـ thumb التابعين له، فوق فئات `checked:` الخاصة بها:

```tsx
<Switch
  checked={on()}
  disabled={!online()}
  onChange={({ checked }) => on.set(checked)}
  class="flex-row items-center gap-3 disabled:opacity-50"
  trackClass="w-11 rounded-full bg-muted p-0.5 checked:bg-primary disabled:bg-muted"
  thumbClass="size-5 rounded-full bg-background checked:translate-x-5"
>
  <Text>Sync over cellular</Text>
</Switch>
```

<a id="a-small-target-with-hitslop"></a>

## هدف صغير مع hitSlop

قد يكون الـ Switch الذي لا تسمية بجانبه أصغر من الإصبع. يجعل `hitSlop` الضغطات التي تقع بالقرب منه محتسبة، بالنقاط خلف كل جانب، دون تغيير تخطيطه أو مظهره: رقم واحد لكل الجوانب، أو تسمية الجوانب (`{ top: 8, bottom: 8 }`)، كما يقبلها [`hitSlop` الخاص بالـ view](./index.md#presses-and-feedback).

```tsx
<Switch
  checked={on()}
  hitSlop={{ top: 8, bottom: 8 }}
  accessibilityLabel="Notifications"
  onChange={({ checked }) => on.set(checked)}
  trackClass="w-9 rounded-full bg-muted p-0.5 checked:bg-primary"
  thumbClass="size-4 rounded-full bg-background checked:translate-x-4"
/>
```

<a id="accessibility"></a>

## إمكانية الوصول

- الـ Switch عنصر واحد لقارئات الشاشة، بدور `"switch"` وقيمته (تشغيل أو إيقاف)؛ والـ track والـ thumb جزءان منه. وتسميته هي نص أبنائه؛ أعطِ `accessibilityLabel` عندما لا يكون له نص.
- يُعلَن `disabled` بالطريقة التي تعلنها بها المنصة (VoiceOver وTalkBack وUI Automation وشجرة إمكانية الوصول في المتصفح).
- على macOS والويب يكون الـ Switch محطة من محطات تركيز لوحة المفاتيح: يصل إليه Tab، ويبدّله Space وReturn، وتُظهر أنماط `focus:` موضع التركيز.

راجع [إمكانية الوصول](../docs/accessibility.md) للاطلاع على التسميات والأدوار والإعلانات بوجه عام.

<a id="platform-notes"></a>

## ملاحظات المنصات

- iOS وAndroid وMac Catalyst: الضغطة هي لمسة تنتهي على الـ Switch، بما في ذلك تسميته.
- أجهزة سطح المكتب (macOS وWindows وLinux وGPUI) والويب: الضغطة هي نقرة. وعلى macOS والويب، يبدّل Space وReturn أيضاً الـ Switch الذي يملك تركيز لوحة المفاتيح.
- ترسم كل منصة ما ينسّقه التطبيق؛ ويتحرك الـ thumb وفق ما تقوله أنماط التطبيق وانتقالاته.
