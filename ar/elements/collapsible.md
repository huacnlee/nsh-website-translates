---
title: "Collapsible"
description: "المكوّن Collapsible: منطقة يتمدد محتواها وينطوي، ويظهر بعد عناصره الفرعية ما دام التطبيق يُبقيه مفتوحًا، ويُكشف عنه بارتفاع نابضي عند الطلب، بينما يتولى التطبيق تحديد عنصر التشغيل وكل ما يتعلق بالمظهر."
group: base
demo: el-collapsible
source_hash: cf0c6bafa8f80920
---

# Collapsible

الـ Collapsible منطقة يتوسّع محتواها وينطوي: تفاصيل تحت ملخّص، أو "عرض المزيد"، أو قسم من الإعدادات المتقدمة. يعرض أبناءه دائمًا، ويعرض `content` بعدهم عندما يكون `open`. يملك التطبيق `open` والمحفّز الذي يقلبه (وهو أحد الأبناء)، والمظهر من شأن التطبيق: فليس لـ `Collapsible` محفّز ولا سهم ولا تسمية خاصة به. مع `reveal` يُفتح المحتوى ويُغلق بحركة: ارتفاع منطقته ينتقل بنعومة نابضية من الصفر إلى ارتفاع المحتوى نفسه والعكس، وما يلي الـ Collapsible يتحرك معه.

```rust tabs
use nsh_base::{collapsible, theme};
use nsh_core::{AccessibilityState, prelude::*};

fn storage() -> impl IntoElement {
    let open = signal(false);
    collapsible()
        .open(open)
        .reveal(true)
        .gap_2()
        .child(
            view()
                .role(AccessibilityRole::Button)
                .accessibility_state(move || AccessibilityState {
                    expanded: Some(open.get()),
                    ..AccessibilityState::default()
                })
                .on_press(move || open.update(|o| *o = !*o))
                .flex_row()
                .items_center()
                .justify_between()
                .child(text("Storage"))
                .child(text("›").transition_transform().rotate(move || {
                    if open.get() { deg(90.0) } else { deg(0.0) }
                })),
        )
        .content(text("Photos 120 GB · Apps 54 GB · System 38 GB").text_color(move || theme().muted_foreground))
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { Collapsible } from "nsh/base";

function App() {
  const open = signal(false);
  return (
    <Collapsible
      open={open()}
      reveal
      class="gap-2"
      content={<Text class="text-muted-foreground">Photos 120 GB · Apps 54 GB · System 38 GB</Text>}
    >
      <View
        role="button"
        accessibilityState={{ expanded: open() }}
        onPress={() => open.set(!open())}
        class="flex-row items-center justify-between active:opacity-70"
      >
        <Text class="font-medium">Storage</Text>
        <Text class={`transition-transform ${open() ? "rotate-90" : ""}`}>›</Text>
      </View>
    </Collapsible>
  );
}

mount(App);
```

`Collapsible` يأتي من [`nsh/base`](../modules/nsh-base.md)، وهي الـ crate `nsh-base` في Rust. القيمة ملك للتطبيق: محفّزه يقلب `open`، ويعرض الـ Collapsible القيمة التي يمرّرها التطبيق. في Rust ينشئ `collapsible()` واحدًا بدالة ضبط (setter) لكل خاصية (`.open(..)`، `.reveal(..)`، `.content(..)`)، ودوال الأنماط المطبوعة للمنطقة، و`.child(..)` لما يظهر دائمًا.

<a id="props"></a>

## الخصائص

| الخاصية | Rust | النوع | الافتراضي | الوصف |
|---|---|---|---|---|
| `open` | `.open(..)` | `boolean` | `false` | موسَّع: يكون `content` في الشجرة بعد الأبناء. يملك التطبيق هذه القيمة. |
| `reveal` | `.reveal(..)` | `boolean` | `false` | يُفتح ويُغلق بكشف تدريجي: يقع المحتوى في منطقة تقصّه، ينتقل ارتفاعها نابضيًا من الصفر إلى ارتفاع المحتوى نفسه عند تفعيل `open` ويعود عند إيقافه، بتخميد حرج (نحو 265 ملّي ثانية، دون تجاوز). وما يلي الـ Collapsible يتحرك معه، ويبقى المحتوى في الشجرة حتى تُغلق المنطقة. مع تقليل الحركة يُفتح ويُغلق فورًا. المنطقة موجودة في التخطيط حتى وهي مغلقة، بارتفاع صفر، ولذلك فإن `gap` الخاص بالـ Collapsible يسبقها أيضًا. |
| `content` | `.content(..)` | `JSX.Element` | لا يوجد | ما يتوسّع. يُنشأ مرة واحدة ويبقى أثناء الانطواء، فيحتفظ ما بداخله بحالته (نص حقل إدخال، أو موضع تمرير، أو مفتاح تبديل) من فتحة إلى التي تليها. |
| `children` | `.child(..)` | `JSX.Element` | لا يوجد | ما يظهر في الحالتين: ملخّص، وهو المحفّز الذي يقلب `open`. |
| `class`، `style` | دوال الأنماط | `string`، `StyleProp<ViewStyle>` | لا يوجد | المنطقة المحيطة بالأبناء والمحتوى (`gap-2` يضبط المسافات بينها). |

<a id="events"></a>

## الأحداث

لا يُبلغ الـ Collapsible عن أي شيء بنفسه: المحفّز ملك للتطبيق، وضغطته (`onPress` الخاص بـ `View` مع `role="button"`) هي المكان الذي يقلب فيه التطبيق `open`.

<a id="parts"></a>

## الأجزاء

| الجزء | بداخل | يُنسَّق بـ |
|---|---|---|
| المنطقة | | `class`، `style` |
| الأبناء | المنطقة، أولًا | عناصرهم الخاصة |
| منطقة الكشف | المنطقة، بعد الأبناء، مع `reveal` | لا يوجد: تقصّ المحتوى وتأخذ ارتفاعه |
| المحتوى | المنطقة، بعد الأبناء (وفي منطقة الكشف مع `reveal`)، أثناء `open` | عناصره الخاصة (`content`) |

بدون `reveal` يظهر المحتوى ويختفي فورًا، وتعيد كل منصة تخطيط المنطقة عند وصوله أو مغادرته. ومع `reveal` يكون التغيير حركة تخطيط (layout animation) في الـ commit الذي يغيّر `open` (مثل `LayoutAnimation.configureNext`، وتُنفَّذ أصليًا، فلا تعمل JavaScript أثناء الحركة): تنمو منطقة الكشف من الصفر إلى ارتفاع المحتوى وتنكمش عائدة، وتتحرك معها إطارات كل ما يحرّكه التغيير نفسه، ومنها العناصر التي تلي الـ Collapsible. وتنضم إليها أي transition خاصة بالتطبيق: يدور سهم المحفّز (`transition-transform`)، ويمكن للمحتوى أن يظهر تدريجيًا بأصنافه (classes) الخاصة.

<a id="accessibility"></a>

## إمكانية الوصول

- المنطقة ليست عنصرًا مستقلًا لقارئات الشاشة: يُقرأ أبناؤها ومحتواها كما هم.
- يُعلن المحفّز ما إذا كانت المنطقة موسَّعة: امنحه `accessibilityState={{ expanded: open }}` ودور زر (`role="button"` على `View`)، فتعلن قارئات الشاشة "موسَّع" أو "منطوٍ" مع تسميته.
- على macOS والويب يكون المحفّز محطة في تركيز لوحة المفاتيح عندما يستقبل الضغطات: يصل إليه Tab، ويقلب Space وReturn المنطقة.

انظر [Accessibility](../docs/accessibility.md) للتسميات والأدوار والإعلانات بوجه عام.

<a id="platform-notes"></a>

## ملاحظات المنصات

- تعرض كل منصة المحتوى بعد الأبناء عندما يكون `open`، وتُخرجه من التخطيط في غير ذلك.
- مع `reveal` تُحرّك كل منصة ارتفاع المنطقة نابضيًا بمحرّك الحركة الخاص بها (iOS وAndroid وmacOS وWindows وLinux وGPUI والويب)، وتفتحها وتغلقها فورًا عندما يطلب النظام تقليل الحركة.
- iOS وAndroid وMac Catalyst: ضغطة المحفّز هي نقرة لمس (tap). أنظمة سطح المكتب (macOS وWindows وLinux وGPUI) والويب: نقرة (click)، وSpace أو Return على المحفّز المركَّز عليه في macOS والويب.
