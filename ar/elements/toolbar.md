---
title: "Toolbar"
description: "Toolbar وToolbarGroup وToolbarSeparator: شريط من الأزرار ومفاتيح التبديل والروابط يشكّل محطة واحدة في تنقّل لوحة المفاتيح، وتتحرك مفاتيح الأسهم عبره، مع مجموعات مسمّاة وفواصل. أما مظهر كل عنصر تحكم وحالته فمن مسؤولية التطبيق."
group: base
demo: el-toolbar
source_hash: 4c5547977ec8d003
---

# Toolbar

شريط الأدوات هو شريط من عناصر التحكم: أدوات التنسيق في محرر النصوص، وأزرار التحكم في مشغّل الوسائط، ولوحة أدوات عمودية.
يتولى `Toolbar` أمر لوحة المفاتيح ودلالات الشريط: تعلن قارئات الشاشة عن شريط الأدوات (باسمه المحدد بواسطة
`accessibilityLabel`)، وتصل إليه لوحة المفاتيح بوقفة واحدة وتتنقل بين عناصره بمفاتيح الأسهم الخاصة بـ
`axis`. عناصره هي `Button` و`Toggle` و`Link` الموجودة بداخله، على أي عمق. أما `ToolbarGroup` فهي سلسلة مسماة من
العناصر المترابطة (التراجع والإعادة، المحاذاة)، و`ToolbarSeparator` خط يرسمه التطبيق بين هذه السلاسل. المظهر من شأن
التطبيق: ليس لشريط الأدوات ألوان أو حشوة أو فراغات خاصة به، ويحتفظ كل عنصر تحكم بحالته الخاصة.

```rust tabs
use nsh_base::{button, theme, toggle, toolbar, toolbar_group, toolbar_separator};
use nsh_core::prelude::*;

fn formatting() -> impl IntoElement {
    let bold = signal(false);
    toolbar()
        .accessibility_label("Formatting")
        .items_center()
        .gap_1()
        .child(
            toolbar_group()
                .accessibility_label("History")
                .child(button().accessibility_label("Undo").size_8().child(text("↶")))
                .child(button().accessibility_label("Redo").size_8().child(text("↷"))),
        )
        .child(toolbar_separator().w(px(1.0)).h_5().bg(move || theme().border))
        .child(
            toggle()
                .pressed(bold)
                .accessibility_label("Bold")
                .on_change(move |pressed: &bool| bold.set(*pressed))
                .size_8()
                .items_center()
                .justify_center()
                .pressed_style(|s| s.bg(move || theme().accent))
                .child(text("B")),
        )
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { Button, Toggle, Toolbar, ToolbarGroup, ToolbarSeparator } from "nsh/base";

function App() {
  const bold = signal(false);
  return (
    <Toolbar accessibilityLabel="Formatting" class="items-center gap-1 self-start rounded-lg bg-muted p-1">
      <ToolbarGroup accessibilityLabel="History">
        <Button accessibilityLabel="Undo" class="size-8 items-center justify-center rounded-md hover:bg-accent">
          <Text>↶</Text>
        </Button>
        <Button accessibilityLabel="Redo" class="size-8 items-center justify-center rounded-md hover:bg-accent">
          <Text>↷</Text>
        </Button>
      </ToolbarGroup>
      <ToolbarSeparator class="h-5 w-px bg-border" />
      <Toggle
        pressed={bold()}
        accessibilityLabel="Bold"
        onChange={({ pressed }) => bold.set(pressed)}
        class="size-8 items-center justify-center rounded-md aria-pressed:bg-accent"
      >
        <Text>B</Text>
      </Toggle>
    </Toolbar>
  );
}

mount(App);
```

تأتي `Toolbar` و`ToolbarGroup` و`ToolbarSeparator` من [`nsh/base`](../modules/nsh-base.md)، وهي الحزمة `nsh-base` في
Rust. لا يحتفظ شريط الأدوات بأي قيمة: يُبلَّغ المفتاح التبديلي بداخله بما إذا كان مضغوطًا ويُرسل `onChange`، أما الزر
فيُرسل `onPress`، ويحتفظ التطبيق بالحالة. في Rust تنشئها `toolbar()` و`toolbar_group()` و
`toolbar_separator()`، مع دالة ضبط لكل خاصية (`.axis(..)`، `.disabled(..)`)، ودوال التنسيق المطبوعة، و
`.child(..)` لمحتواها.

<a id="props"></a>

## الخصائص

<a id="toolbar-1"></a>

### Toolbar

| الخاصية | Rust | النوع | الافتراضي | الوصف |
|---|---|---|---|---|
| `axis` | `.axis(..)` | `"horizontal" \| "vertical"` | `"horizontal"` | الاتجاه الذي تمتد عليه عناصره: مفاتيح الأسهم التي تتنقل على امتداده (Left وRight، أو Up وDown)، والاتجاه الذي يرتب فيه أبناءه (صف أو عمود). تُقرأ عند إنشاء شريط الأدوات. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | كل عنصر في شريط الأدوات معطَّل، مهما كانت قيمة `disabled` الخاصة به: لا ضغطات، ولا وقفة لتركيز لوحة المفاتيح، ويظهر باهتًا لقارئات الشاشة. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | لا شيء | الاسم الذي تنطق به قارئات الشاشة لشريط الأدوات ("Formatting")، للصفحة التي تحتوي على أكثر من شريط. |
| `children` | `.child(..)` | `JSX.Element` | لا شيء | العناصر ومجموعاتها وفواصلها، وأي شيء آخر يرتبه التطبيق بينها (عنوان، أو فراغ مرن، أو حقل إدخال). |
| `class`، `style` | دوال التنسيق | `string`، `StyleProp<ViewStyle>` | لا شيء | تخطيط الشريط ومظهره: المحاذاة والفراغات والحشوة وسطحه. |

### ToolbarGroup

| الخاصية | Rust | النوع | الافتراضي | الوصف |
|---|---|---|---|---|
| `disabled` | `.disabled(..)` | `boolean` | `false` | كل عنصر في المجموعة معطَّل، مهما كانت قيمة `disabled` الخاصة به. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | لا شيء | الاسم الذي تنطق به قارئات الشاشة للمجموعة ("History"، "Alignment"). |
| `children` | `.child(..)` | `JSX.Element` | لا شيء | عناصر المجموعة، وأي شيء يرتبه التطبيق بينها. |
| `class`، `style` | دوال التنسيق | `string`، `StyleProp<ViewStyle>` | لا شيء | تخطيط المجموعة ومظهرها. تمتد على محور شريط الأدوات. |

### ToolbarSeparator

| الخاصية | Rust | النوع | الافتراضي | الوصف |
|---|---|---|---|---|
| `class`، `style` | دوال التنسيق | `string`، `StyleProp<ViewStyle>` | لا شيء | الخط: خط رفيع يعبر الصف (`h-5 w-px bg-border`) أو العمود (`h-px self-stretch bg-border`). |

<a id="items"></a>

## العناصر

عناصر شريط الأدوات هي `Button` و`Toggle` و`Link` الموجودة بداخله، وفي مجموعاته، وكذلك في
[`ToggleGroup`](./toggle.md) بداخله. ومشغِّل [`Menu`](./menu.md) أو [`Popover`](./popover.md) هو
عنصر أيضًا: أي العرض الموجود في خانته `trigger`، والذي تمنحه النافذة المنبثقة ضغطاته وتركيزه وحالة `expanded` الخاصة به. أما
الأداة التي يرسمها التطبيق بنفسه فهي `Button` بفئات التطبيق: لا مظهر خاصًا لـ`Button`، فيبدو كما ينسّقه التطبيق
ويكون عنصرًا (أما `View` مع `onPress` فيبقى وقفة مستقلة خارج مفاتيح الأسهم). و`ToggleGroup` داخل شريط
الأدوات هي إحدى مجموعاته: مفاتيحها التبديلية هي عناصر الشريط، وتسمع قارئات الشاشة مجموعة، وتظل `disabled` الخاصة بها
تعطّل مفاتيحها التبديلية. أما عناصر التحكم الأخرى (`Input` و`Select` و`Slider`) فتبقى وقفات مستقلة
وتحتفظ بمفاتيح الأسهم الخاصة بها؛ ضعها في نهاية الشريط. وما تعرضه النافذة المنبثقة التي يفتحها عنصر (حقول
النافذة المنبثقة وأزرارها، وعناصر القائمة، وروابط بطاقة التمرير) ليس جزءًا من شريط الأدوات. تمر مفاتيح الأسهم على العناصر بالترتيب الذي
يرتبها به الشريط، مهما كان عمق كل منها، ويأخذ العنصر الذي يعرضه التطبيق لاحقًا مكانه بينها.

<a id="parts"></a>

## الأجزاء

| الجزء | داخل | يُنسَّق بواسطة | الحالات |
|---|---|---|---|
| الشريط | | `Toolbar`: `class`، `style` | |
| مجموعة | الشريط | `ToolbarGroup`: `class`، `style` | |
| فاصل | الشريط، مجموعة | `ToolbarSeparator`: `class`، `style` | |
| عنصر | الشريط، مجموعة | `class` و`style` الخاصان بالعنصر نفسه | الخاصة به: `aria-pressed:`، `disabled:`، `hover:`، `focus:`، `active:` |

أظهر العنصر الذي عليه لوحة المفاتيح بأنماط `focus:`، وأظهر المفتاح التبديلي المضغوط عبر سطحه الخاص (انظر
[أدلة التصميم](../docs/design-guides.md#interaction-states)).

<a id="vertical"></a>

## عمودي

لوحة الأدوات عمود: `axis="vertical"` يرتب العناصر من الأعلى إلى الأسفل، ويتنقل Up وDown على امتدادها.

```tsx
<Toolbar axis="vertical" accessibilityLabel="Tools" class="gap-1 self-start rounded-lg bg-muted p-1">
  <Each of={["select", "pen", "shape", "text"]}>
    {(t) => (
      <Toggle
        pressed={tool() === t()}
        accessibilityLabel={t()}
        onChange={({ pressed }) => pressed && tool.set(t())}
        class="size-8 items-center justify-center rounded-md aria-pressed:bg-accent"
      >
        <Text>{t()[0].toUpperCase()}</Text>
      </Toggle>
    )}
  </Each>
</Toolbar>
```

<a id="disabled"></a>

## معطَّل

`disabled` على شريط الأدوات يعطّل كل عنصر فيه، أي شريط يقفله التطبيق؛ وعلى مجموعة، يعطّل عناصر المجموعة. العنصر المعطَّل
لا يقبل ضغطات، وتتجاوزه مفاتيح الأسهم، وتعلن عنه قارئات الشاشة على أنه باهت:

```tsx
<Toolbar disabled={readonly()} accessibilityLabel="Review" class="flex-row gap-1">
  <Button onPress={approve} class="h-8 px-3 disabled:opacity-50">
    <Text>Approve</Text>
  </Button>
</Toolbar>
```

<a id="accessibility"></a>

## إمكانية الوصول

- لـ`Toolbar` الدور `"toolbar"`، ويُسمّى بواسطة `accessibilityLabel`؛ وتبقى عناصره عناصر مستقلة. على iOS
  يكون شريط الأدوات مجموعة دلالية يدخلها VoiceOver.
- لـ`ToolbarGroup` الدور `"group"`، ويُسمّى بواسطة `accessibilityLabel`، فتُقرأ سلسلة العناصر وحدة واحدة.
  و`ToggleGroup` داخل شريط الأدوات مجموعة أيضًا.
- `ToolbarSeparator` ليس عنصرًا بالنسبة لقارئات الشاشة.
- يُعلَن عن `disabled` بالطريقة التي تعلن بها المنصة عنه (VoiceOver وTalkBack وUI Automation وشجرة إمكانية الوصول في
  المتصفح).

راجع [إمكانية الوصول](../docs/accessibility.md) للاطلاع على التسميات والأدوار والإعلانات بوجه عام.

<a id="keyboard"></a>

## لوحة المفاتيح

على macOS والويب، حيث يصل Tab إلى العروض التي تقبل الضغطات، يتبع `Toolbar`
[نمط شريط الأدوات في WAI-ARIA](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/):

| المفتاح | الوظيفة |
|---|---|
| Tab، Shift+Tab | يدخل شريط الأدوات عند العنصر الذي غادره التركيز آخر مرة (وفي البداية، عند أول عنصر غير معطَّل)، ويغادره بخطوة واحدة. |
| Right، Left (`axis="horizontal"`) | ينقل التركيز إلى العنصر التالي أو السابق، من الأخير إلى الأول والعكس. |
| Down، Up (`axis="vertical"`) | ينقل التركيز إلى العنصر التالي أو السابق، من الأخير إلى الأول والعكس. |
| Home، End | ينقل التركيز إلى العنصر الأول أو الأخير. |
| Space، Return | يضغط العنصر المركَّز عليه. |

تتخطى مفاتيح الأسهم العناصر المعطَّلة ولا تضغط شيئًا: لا يتغير المفتاح التبديلي إلا عند الضغط عليه. أما زوج الأسهم الآخر
فيُترك للعناصر (يفتح مشغِّل القائمة قائمته بـ Down). في التخطيط من اليمين إلى اليسار يمتد شريط الأدوات الأفقي
من اليمين، فينقل Left إلى العنصر التالي وينقل Right إلى العنصر السابق؛ أما الشريط العمودي فيحتفظ بـ Down و
Up.

<a id="platform-notes"></a>

## ملاحظات المنصات

- iOS وAndroid وMac Catalyst: يُضغط كل عنصر بنقرة؛ وشريط الأدوات مجموعة تعلن عنها قارئات الشاشة.
- أنظمة سطح المكتب (macOS وWindows وLinux وGPUI) والويب: الضغطة هي نقرة. على macOS والويب يكون شريط الأدوات وقفة واحدة
  في Tab، وتتنقل مفاتيح الأسهم وHome وEnd بين عناصره ([لوحة المفاتيح](#keyboard)).
- ترسم كل منصة ما ينسّقه التطبيق: الشريط ومجموعاته وفواصله وعناصره.
