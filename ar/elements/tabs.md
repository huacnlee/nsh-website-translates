---
title: "Tabs"
description: "Tab وTabs: علامات التبويب في قائمة التبويب والقائمة نفسها. يتولى كل Tab الضغطات، والتفعيل بلوحة المفاتيح، وحالة التعطيل، ودوره وحالة تحديده لقارئات الشاشة؛ أما Tabs فهي المجموعة، مع مؤشر يتبع علامة التبويب المحددة بشكل أصلي؛ أما المظهر والقيمة والمحتوى الذي تعرضه كل علامة تبويب فتعود إلى التطبيق."
group: base
demo: el-tabs
source_hash: 31cec668d8fcf6ae
---

# Tabs

تنقل علامات التبويب بين أقسام مكان واحد: نظرة عامة على مشروع ونشاطه، أو عروض مستند.
يتولى كل `Tab` سلوك علامة تبويب واحدة: الضغطات، والتفعيل بلوحة المفاتيح، وحالة التعطيل، ودور علامة التبويب وحالة تحديدها لقارئات الشاشة. ويشكّل `Tabs` المحيط بها قائمة علامات التبويب، وتعلنها قارئات الشاشة كمجموعة واحدة. المظهر من شأن التطبيق: فلا ألوان لعلامة التبويب ولا أحجام ولا تسمية خاصة بها. أبناؤها هم تسمية التطبيق، وتتبع حالتها فئات `selected:` على علامة التبويب، أو فئات `group-selected:` على ما بداخلها. ومحتوى كل قسم من شأن التطبيق أيضًا: يعرض القسم الذي تسميه قيمته، بجانب القائمة. أما مؤشر القائمة، وهو خط سفلي أو حبة ينسّقها التطبيق، فيوضع على علامة التبويب المحددة وينتقل أصليًا إلى التالية ([المؤشر](#indicator)).

```rust tabs
use nsh_base::{tab, tabs, theme};
use nsh_core::prelude::*;

fn sections() -> impl IntoElement {
    let section = signal("overview");
    let item = move |value: &'static str, label: &'static str| {
        let selected = move || section.get() == value;
        tab()
            .selected(selected)
            .on_press(move |_: &()| section.set(value))
            .rounded(move || theme().radius)
            .px_3()
            .py_2()
            .child(text(label).text_sm().text_color(move || {
                if selected() { theme().foreground } else { theme().muted_foreground }
            }))
    };
    view()
        .gap_4()
        .child(
            tabs()
                .flex_row()
                .self_start()
                .gap_1()
                .p_1()
                .rounded(move || theme().radius)
                .bg(move || theme().muted)
                .indicator_style(|s| {
                    s.top_1()
                        .bottom_1()
                        .rounded(move || theme().radius)
                        .bg(move || theme().background)
                })
                .child(item("overview", "Overview"))
                .child(item("activity", "Activity")),
        )
        .child(text(move || {
            if section.get() == "overview" {
                "Visitors, sign-ups and conversion this week."
            } else {
                "Deploys, invoices and new members, newest first."
            }
        }).text_color(move || theme().foreground))
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { Tab, Tabs } from "nsh/base";

function App() {
  const section = signal("overview");
  const item = (value: string, label: string) => (
    <Tab
      selected={section() === value}
      onPress={() => section.set(value)}
      class="group rounded-(--radius) px-3 py-2"
    >
      <Text class="text-sm text-muted-foreground group-selected:text-foreground">{label}</Text>
    </Tab>
  );
  return (
    <View class="gap-4">
      <Tabs
        class="flex-row self-start gap-1 rounded-(--radius-lg) bg-muted p-1"
        indicatorClass="inset-y-1 rounded-(--radius) bg-background"
      >
        {item("overview", "Overview")}
        {item("activity", "Activity")}
      </Tabs>
      <Text class="text-foreground">
        {section() === "overview"
          ? "Visitors, sign-ups and conversion this week."
          : "Deploys, invoices and new members, newest first."}
      </Text>
    </View>
  );
}

mount(App);
```

يأتي `Tab` و`Tabs` من [`nsh/base`](../modules/nsh-base.md)، وهي حزمة `nsh-base` في Rust. القيمة من شأن التطبيق: فالقائمة لا تحتفظ بأي قيمة. تُبلَّغ كل علامة تبويب بما إذا كانت محددة؛ وتُبلِّغ الضغطة عن `onPress`، فيضبط التطبيق قيمته ويعرض ذلك القسم، وتعرض كل علامة تبويب `selected` الذي يمرره التطبيق. زوايا القائمة وزوايا علامات التبويب متحدة المركز: حشوة القائمة (`p-1`) هي الفرق بين `radius.lg` و`radius`. وتعبئة علامة التبويب المحددة هي مؤشر القائمة (`indicatorClass`، داخل تلك الحشوة: `inset-y-1`)، وهو ينتقل بحركة نابضة إلى علامة التبويب التي يحددها التطبيق. في Rust، يُنشئها `tab()` و`tabs()`، مع دالة ضبط لكل خاصية (`.selected(..)`)، ومستمع لكل حدث (`.on_press(..)`)، ودوال التنسيق المطبوعة و`.child(..)` لمحتواها.

<a id="props"></a>

## الخصائص

### Tab

| الخاصية | Rust | النوع | الافتراضي | الوصف |
|---|---|---|---|---|
| `selected` | `.selected(..)` | `boolean` | `false` | علامة التبويب الحالية في قائمتها: تعلن قارئات الشاشة أنها محددة، وتُطبَّق تنسيقات `selected:`. تُبلِّغ الضغطة عن `onPress`؛ وتعرض علامة التبويب القيمة التي يمررها التطبيق. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | لا ضغطات ولا استجابة بصرية للضغط؛ وتُطبَّق تنسيقات `disabled:`، وتعلن قارئات الشاشة أنها خافتة. |
| `selectedStyle` | `.selected_style(\|s\| ..)` | `StyleProp<ViewStyle>` | لا شيء | تنسيق علامة التبويب أثناء تحديدها وعدم تعطيلها، على شكل فئات `selected:`. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | لا شيء | ما تقوله قارئات الشاشة: اسم علامة التبويب، عندما لا يكون في أبنائها نص يقوله (كأيقونة). |
| `children` | `.child(..)` | `JSX.Element` | لا شيء | تسمية التطبيق أو أيقونته أو شارته، وتقرؤها قارئات الشاشة. |
| `class`، `style` | دوال التنسيق | `string`، `StyleProp<ViewStyle>` | لا شيء | علامة التبويب نفسها: السطح المحيط بتسميتها. |
| `activeStyle`، `hoverStyle`، `focusStyle`، `disabledStyle` | `.active(\|s\| ..)`، `.hover(..)`، `.focus(..)`، `.disabled_style(..)` | `StyleProp<ViewStyle>` | لا شيء | تنسيق علامة التبويب أثناء الضغط عليها أو تمرير المؤشر فوقها أو تركيزها أو تعطيلها، على شكل فئات `<state>:`. |

<a id="tabs-1"></a>

### Tabs

| الخاصية | Rust | النوع | الافتراضي | الوصف |
|---|---|---|---|---|
| `indicatorClass` | `.indicator_class(..)` | `string` | لا شيء | فئات Tailwind الخاصة بالمؤشر على علامة التبويب المحددة: مظهره ومكانه عبر القائمة (`bottom-0 h-0.5` لخط سفلي في صف، `inset-y-1` لحبة). وعلى امتداد القائمة يغطي علامة التبويب المحددة، داخل هوامشه الخاصة على ذلك المحور. مع `indicatorClass` أو `indicatorStyle` يكون للقائمة مؤشر. |
| `indicatorStyle` | `.indicator_style(\|s\| ..)` | `StyleProp<ViewStyle>` | لا شيء | تنسيق المؤشر، فوق `indicatorClass`. |
| `children` | `.child(..)` | `JSX.Element` | لا شيء | علامات تبويب القائمة، وما يضعه التطبيق بينها. |
| `class`، `style` | دوال التنسيق | `string`، `StyleProp<ViewStyle>` | لا شيء | تخطيط القائمة ومظهرها: عمود افتراضيًا، و`flex-row` للصف. |

<a id="events"></a>

## الأحداث

| الحدث | Rust | الوصف |
|---|---|---|
| `onPress` (`Tab`) | `.on_press(\|_: &()\| ..)` | ضُغطت علامة التبويب: نقرة لمس أو نقرة بالفأرة، أو Space أو Return أثناء امتلاكها تركيز لوحة المفاتيح، أو تفعيل من قارئ شاشة؛ أو نقل مفتاح سهم أو Home أو End في قائمتها تركيز لوحة المفاتيح إليها. يعمل قبل أن يتغير أي شيء: تعرض علامة التبويب `selected` الذي يمرره التطبيق. |

تُبلِّغ علامة التبويب المحددة عن ضغطاتها أيضًا، ليتمكن التطبيق من التصرف عند ضغطة ثانية (كتمرير قسمها إلى الأعلى مثلًا).
لا تُبلِّغ علامة التبويب المعطلة عن أي شيء.

<a id="parts"></a>

## الأجزاء

| الجزء | داخل | التنسيق بـ | الحالات |
|---|---|---|---|
| القائمة | | `class` و`style` في `Tabs` | |
| المؤشر | القائمة، خلف علامات التبويب | `indicatorClass`، `indicatorStyle` | على علامة التبويب المحددة |
| علامة التبويب | القائمة | `class` و`style` في `Tab` | `selected:`، `disabled:`، `active:`، `hover:`، `focus:` (أو `selectedStyle`، `disabledStyle`، ...) |
| التسمية | علامة التبويب | عناصرها الخاصة (`children`) | `group-selected:` و`group-disabled:` وبقية متغيرات `group-*:` مع `group` على `class` الخاص بعلامة التبويب |
| محتوى القسم | بجانب القائمة | عناصر التطبيق | قيمة التطبيق |

أظهر علامة التبويب المحددة عبر سطحها الخاص: تعبئة، أو تسمية أقوى، أو وزن أثقل (راجع
[أدلة التصميم](../docs/design-guides.md#interaction-states)).

<a id="indicator"></a>

## المؤشر

الخط السفلي تحت علامة التبويب المحددة، أو الحبة خلفها، أو القطعة البارزة في عنصر تحكم مقسّم، هو
مؤشر القائمة: عرض ينسّقه التطبيق بـ `indicatorClass` و`indicatorStyle`، ويُرسم خلف علامات التبويب ويُوضع
بموضع مطلق في القائمة. يضعه Native Shell على علامة التبويب المحددة بعد كل تخطيط. وعلى امتداد القائمة (عرض الصف،
أو ارتفاع العمود) يغطي تلك العلامة، داخل هوامش المؤشر الخاصة على ذلك المحور (`mx-3` لخط سفلي
أقصر من علامته)؛ أما عبر القائمة فتحدد فئاته مكانه:

```tsx
// An underline at the bottom of a row of tabs.
<Tabs class="flex-row gap-4 border-b border-border" indicatorClass="bottom-0 h-0.5 bg-foreground">
  {item("overview", "Overview")}
  {item("activity", "Activity")}
</Tabs>

// A pill behind the selected tab, inside the list's padding.
<Tabs class="flex-row self-start gap-1 rounded-(--radius-lg) bg-muted p-1" indicatorClass="inset-y-1 rounded-(--radius) bg-background shadow-sm">
  {item("overview", "Overview")}
  {item("activity", "Activity")}
</Tabs>
```

عندما يحدد التطبيق علامة تبويب أخرى، ينتقل المؤشر إليها بحركة نابضة أصلية، كما يفعل مؤشر شريط علامات التبويب في GPUI Kit؛ ومع
تقليل الحركة ينتقل فورًا. ويكون مخفيًا ما دامت لا توجد علامة محددة؛ وإذا كانت عدة علامات محددة فهو على الأولى. ويحرّكه تغيير حجم النافذة أو تغيّر عرض إحدى العلامات في الإطار نفسه مع العلامات.
لا يحتاج المؤشر إلى أحداث تخطيط ولا إلى أي شيفرة من التطبيق: علامة التبويب المحددة هي التي يكون `selected` فيها صحيحًا. وفي
قائمة قابلة للتمرير، يحيط عرض التمرير بـ `Tabs`، ويتمرر المؤشر مع علامات التبويب.

<a id="disabled"></a>

## معطّل

لا تقبل علامة التبويب المعطلة أي ضغطات، وتعلنها قارئات الشاشة بأنها خافتة. تُطبَّق فئات `disabled:` فوق فئات
`selected:`، وتتبعها فئات `group-disabled:` بداخلها:

```tsx
<Tab
  selected={section() === "billing"}
  disabled={!isOwner()}
  onPress={() => section.set("billing")}
  class="group rounded-(--radius) px-3 py-2 selected:bg-background disabled:opacity-50"
>
  <Text class="text-sm text-muted-foreground group-selected:text-foreground">Billing</Text>
</Tab>
```

<a id="accessibility"></a>

## إمكانية الوصول

- علامة التبويب عنصر واحد لقارئات الشاشة، بدور `"tab"` وحالة تحديدها. وتسميتها هي نص
  أبنائها، أو `accessibilityLabel`.
- `Tabs` له الدور `"tablist"`: تسمع قارئات الشاشة علامات التبويب بداخله كمجموعة واحدة، وتبقى كل منها عنصرًا
  مستقلًا.
- يُعلَن `disabled` بالطريقة التي تعلنه بها المنصة (VoiceOver وTalkBack وUI Automation وشجرة إمكانية الوصول في المتصفح).
- على macOS والويب تمثل القائمة محطة واحدة لتركيز لوحة المفاتيح، وتنقل مفاتيح الأسهم بين علامات التبويب فيها (أدناه).
- المؤشر مخفي عن قارئات الشاشة ولا يأخذ التركيز: علامات التبويب وحدها هي عناصر القائمة.

راجع [إمكانية الوصول](../docs/accessibility.md) للاطلاع على التسميات والأدوار والإعلانات بوجه عام.

<a id="keyboard"></a>

## لوحة المفاتيح

على macOS والويب، حيث يصل Tab إلى العروض التي تقبل الضغطات، تتبع قائمة `Tabs`
[نمط علامات التبويب في WAI-ARIA](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/):

| المفتاح | ما يفعله |
|---|---|
| Tab، Shift+Tab | يدخل القائمة عند علامة التبويب المحددة (أول علامة غير معطلة إن لم تكن هناك علامة محددة)، ويغادرها بخطوة واحدة. |
| السهم الأيمن، السهم السفلي | ينقل التركيز إلى علامة التبويب التالية، ومن الأخيرة إلى الأولى. |
| السهم الأيسر، السهم العلوي | ينقل التركيز إلى علامة التبويب السابقة، ومن الأولى إلى الأخيرة. |
| Home، End | ينقل التركيز إلى أول علامة تبويب أو آخرها. |
| Space، Return | يضغط علامة التبويب التي عليها التركيز. |

تتخطى مفاتيح الأسهم علامات التبويب المعطلة، وتُبلِّغ العلامة التي تنتقل إليها عن `onPress`، فيحددها التطبيق
مع انتقال التركيز: يتبع القسم التركيز. يعمل زوجا الأسهم معًا مهما كان تخطيط القائمة، فهو من فئات
التطبيق. وفي التخطيط من اليمين إلى اليسار يبدأ الصف من اليمين، فيتبادل اليسار واليمين موضعيهما: ينقل اليسار إلى
علامة التبويب التالية واليمين إلى السابقة؛ أما السهم العلوي والسفلي وHome وEnd فتبقى على حالها. تُظهر تنسيقات `focus:` موضع التركيز. وأي `Tab` خارج `Tabs` هو محطة مستقلة بذاته.

<a id="platform-notes"></a>

## ملاحظات المنصات

- iOS وAndroid وMac Catalyst: الضغطة هي لمسة تنتهي على علامة التبويب، بما في ذلك تسميتها.
- أنظمة سطح المكتب (macOS وWindows وLinux وGPUI) والويب: الضغطة هي نقرة. وعلى macOS والويب، يضغط Space وReturn أيضًا
  علامة التبويب التي عليها تركيز لوحة المفاتيح، وتنقله مفاتيح الأسهم وHome وEnd ([لوحة المفاتيح](#keyboard)).
- كل منصة ترسم ما ينسّقه التطبيق: علامات التبويب، وسطح العلامة المحددة، والمؤشر، ومحتوى
  الأقسام. وانتقال المؤشر هو حركة تخطيط أصلية على كل منصة.
