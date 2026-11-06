---
title: "Toggle"
description: "Toggle وToggleGroup: زر يكون في حالة تشغيل أو إيقاف، وشريط أدوات يضم مجموعة من هذه الأزرار. يتولى كل Toggle معالجة الضغطات والتفعيل عبر لوحة المفاتيح وحالة التعطيل، إضافة إلى دوره وحالة الضغط الخاصة به لقارئات الشاشة؛ أما المجموعة فهي شريط أدوات له نقطة توقف واحدة في تركيز لوحة المفاتيح؛ بينما يعود المظهر وتحديد أي Toggle مضغوط إلى التطبيق."
group: base
demo: el-toggle
source_hash: d8d3727dd9d04426
---

# Toggle

الـ Toggle هو زر يبقى في حالة تشغيل أو إيقاف: الخط العريض في شريط أدوات النص، أو نجمة المفضلة، أو خيار في العرض. `Toggle` يتولى سلوك واحد منها: الضغطات، والتفعيل بلوحة المفاتيح، وحالة التعطيل، ودور الزر مع حالة الضغط لقارئات الشاشة، التي تعلنه على أنه زر تبديل. أما `ToggleGroup` حول عدة أزرار فهو شريط أدوات: تعلنه قارئات الشاشة على هذا النحو، وتصل إليه لوحة المفاتيح بوقفة واحدة وتنتقل بين أزرار التبديل فيه بمفاتيح الأسهم. المظهر يعود إلى التطبيق: ليس للـ Toggle ألوان أو أحجام أو أيقونة أو تسمية خاصة به. محتوياته هي أيقونة التطبيق أو تسميته، وتتبع حالته فئات `aria-pressed:` على الـ Toggle، أو فئات `group-aria-pressed:` على ما بداخله.

```rust tabs
use nsh_base::{theme, toggle, toggle_group};
use nsh_core::prelude::*;

fn formatting() -> impl IntoElement {
    let bold = signal(true);
    let italic = signal(false);
    let item = move |label: &'static str, on: Signal<bool>| {
        toggle()
            .pressed(on)
            .accessibility_label(label)
            .on_change(move |pressed: &bool| on.set(*pressed))
            .size_8()
            .items_center()
            .justify_center()
            .rounded(move || theme().radius)
            .pressed_style(|s| s.bg(move || theme().accent))
            .child(text(&label[..1]).text_sm().text_color(move || {
                if on.get() { theme().accent_foreground } else { theme().muted_foreground }
            }))
    };
    toggle_group()
        .flex_row()
        .self_start()
        .gap_1()
        .child(item("Bold", bold))
        .child(item("Italic", italic))
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { Toggle, ToggleGroup } from "nsh/base";

function App() {
  const marks = signal<string[]>(["bold"]);
  const item = (value: string, label: string) => (
    <Toggle
      pressed={marks().includes(value)}
      accessibilityLabel={label}
      onChange={({ pressed }) =>
        marks.set(pressed ? [...marks(), value] : marks().filter((m) => m !== value))
      }
      class="group size-8 items-center justify-center rounded-(--radius) aria-pressed:bg-accent"
    >
      <Text class="text-sm text-muted-foreground group-aria-pressed:text-accent-foreground">{label[0]}</Text>
    </Toggle>
  );
  return (
    <ToggleGroup class="flex-row self-start gap-1">
      {item("bold", "Bold")}
      {item("italic", "Italic")}
    </ToggleGroup>
  );
}

mount(App);
```

`Toggle` و`ToggleGroup` يأتيان من [`nsh/base`](../modules/nsh-base.md)، وهي الحزمة `nsh-base` في Rust. القيمة تخص التطبيق: يُخبَر كل Toggle إن كان مضغوطًا، وتُبلّغ الضغطة بالقيمة التي تطلبها عبر `onChange`، ويعرض الـ Toggle ما `pressed` الذي يمرّره التطبيق إليه. المجموعة أيضًا لا تحتفظ بأي قيمة، لذا فعدد أزرار التبديل التي يمكن ضغطها يعود إلى التطبيق كذلك: أي عدد (عريض ومائل ومسطّر)، أو واحد بالضبط (محاذاة، مبدّل عروض)، حيث يضغط التطبيق الزر المطلوب ويحرر الباقي ويُبقي المضغوط مضغوطًا. في Rust يُنشئ `toggle()` و`toggle_group()` هذه العناصر، مع دالة تعيين لكل خاصية (`.pressed(..)`)، ومستمع لكل حدث (`.on_change(..)`)، ودوال الأنماط المطبوعة، و`.child(..)` لمحتواها.

<a id="props"></a>

## الخصائص

<a id="toggle-1"></a>

### Toggle

| الخاصية | Rust | النوع | الافتراضي | الوصف |
|---|---|---|---|---|
| `pressed` | `.pressed(..)` | `boolean` | `false` | مفعّل أو غير مفعّل: تقول قارئات الشاشة إنه مضغوط، وتُطبَّق أنماط `aria-pressed:`. تُبلّغ الضغطة بالقيمة الأخرى عبر `onChange`؛ ويعرض الـ Toggle القيمة التي يمرّرها التطبيق. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | لا ضغطات ولا استجابة للضغط؛ وتُطبَّق أنماط `disabled:`، وتقول قارئات الشاشة إنه باهت (معطّل). الـ Toggle داخل `ToggleGroup` معطّلة يكون معطّلًا أيضًا. |
| `pressedStyle` | `.pressed_style(\|s\| ..)` | `StyleProp<ViewStyle>` | لا شيء | نمط الـ Toggle أثناء الضغط وعدم التعطيل، على شكل فئات `aria-pressed:`. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | لا شيء | ما تقوله قارئات الشاشة: ما الذي يفعّله الـ Toggle، حين لا يحتوي محتواه على نص يقول ذلك (أيقونة). |
| `hitSlop` | `.hit_slop(..)` | `number \| Partial<Edges>` | لا شيء | إلى أي مدى خارج حدوده تُحتسب الضغطات، بالنقاط: رقم واحد لكل الجوانب، أو الجوانب مسمّاة. مثل `hitSlop` الخاص بالعرض. |
| `children` | `.child(..)` | `JSX.Element` | لا شيء | أيقونة التطبيق أو تسميته، وهو ما تقوله قارئات الشاشة. |
| `class`، `style` | دوال الأنماط | `string`، `StyleProp<ViewStyle>` | لا شيء | الـ Toggle نفسه: السطح المحيط بمحتواه. |
| `activeStyle`، `hoverStyle`، `focusStyle`، `disabledStyle` | `.active(\|s\| ..)`، `.hover(..)`، `.focus(..)`، `.disabled_style(..)` | `StyleProp<ViewStyle>` | لا شيء | نمط الـ Toggle أثناء ضغطة جارية، أو تمرير المؤشر، أو التركيز، أو التعطيل، على شكل فئات `<state>:`. |

### ToggleGroup

| الخاصية | Rust | النوع | الافتراضي | الوصف |
|---|---|---|---|---|
| `disabled` | `.disabled(..)` | `boolean` | `false` | كل Toggle في المجموعة معطّل، أيًّا كانت قيمة `disabled` الخاصة به. |
| `children` | `.child(..)` | `JSX.Element` | لا شيء | أزرار التبديل في المجموعة، وأي شيء يضعه التطبيق بينها (فاصل). |
| `class`، `style` | دوال الأنماط | `string`، `StyleProp<ViewStyle>` | لا شيء | تخطيط المجموعة ومظهرها: عمود افتراضيًا، و`flex-row` للصف. |

<a id="events"></a>

## الأحداث

| الحدث | Rust | الوصف |
|---|---|---|
| `onChange` (`Toggle`) | `.on_change(\|pressed: &bool\| ..)` | ضُغط الـ Toggle: نقرة لمسية، أو نقرة بالفأرة، أو Space أو Return أثناء امتلاكه تركيز لوحة المفاتيح، أو تفعيل من قارئ شاشة. `{ pressed }` هي القيمة التي يطلبها، وهي عكس `pressed`. يعمل قبل أن يتغير أي شيء: يعرض الـ Toggle ما `pressed` الذي يمرّره التطبيق. |

مفتاح السهم في `ToggleGroup` ينقل تركيز لوحة المفاتيح فقط: ولا يضغط شيئًا. الـ Toggle المعطّل لا يبلّغ عن شيء.

<a id="parts"></a>

## الأجزاء

| الجزء | داخل | يُنسَّق بواسطة | الحالات |
|---|---|---|---|
| المجموعة | | `ToggleGroup`: `class`، `style` | |
| الـ Toggle | المجموعة، أو في أي مكان | `Toggle`: `class`، `style` | `aria-pressed:`، `disabled:`، `active:`، `hover:`، `focus:` (أو `pressedStyle`، `disabledStyle`، ...) |
| الأيقونة أو التسمية | الـ Toggle | عناصرها الخاصة (`children`) | `group-aria-pressed:`، `group-disabled:` وسائر متغيرات `group-*:` مع `group` على `class` الخاص بالـ Toggle |

`aria-pressed:` تعني أن الـ Toggle مفعّل؛ و`active:` تعني ضغطة جارية، سواء كان مفعّلًا أم لا. أظهر الـ Toggle المضغوط عبر سطحه نفسه: تعبئة، أو حبة مرتفعة، أو أيقونة أقوى (انظر [أدلة التصميم](../docs/design-guides.md#interaction-states)).

## Segmented

المجموعة التي تكون أزرار التبديل فيها متصلة ويُضغط واحد منها في كل مرة هي عنصر تحكم مقسّم (مبدّل عروض): يحتفظ التطبيق بقيمة واحدة ويضغط الـ Toggle الذي يحمل اسمها. المظهر المتصل هو فئات التطبيق:

```tsx
<ToggleGroup class="flex-row self-start">
  <Each of={["grid", "list"]}>
    {(value) => (
      <Toggle
        pressed={view() === value()}
        accessibilityLabel={`${value()} view`}
        onChange={({ pressed }) => pressed && view.set(value())}
        class="-ml-px h-8 px-3 border border-border first:ml-0 first:rounded-l-(--radius) last:rounded-r-(--radius) aria-pressed:bg-accent"
      >
        <Text class="text-sm">{value()}</Text>
      </Toggle>
    )}
  </Each>
</ToggleGroup>
```

<a id="disabled"></a>

## معطّل

الـ Toggle المعطّل لا يقبل ضغطات، وتعلنه قارئات الشاشة على أنه باهت. تُطبَّق فئات `disabled:` الخاصة به فوق فئات `aria-pressed:`، وتتبعها فئات `group-disabled:` بداخله. `disabled` على `ToggleGroup` يعطّل كل Toggle فيها، أي شريط أدوات يقفله التطبيق:

```tsx
<ToggleGroup disabled={readonly()} class="flex-row gap-1">
  <Toggle pressed={bold()} onChange={({ pressed }) => bold.set(pressed)} class="size-8 disabled:opacity-50">
    <Text>B</Text>
  </Toggle>
</ToggleGroup>
```

<a id="a-small-target-with-hitslop"></a>

## هدف صغير مع hitSlop

قد يكون الـ Toggle ذو الأيقونة أصغر من إصبع. `hitSlop` تجعل الضغطات التي تقع بالقرب منه تُحتسب، بالنقاط بعد كل جانب، دون تغيير تخطيطه أو مظهره: رقم واحد لكل الجوانب، أو الجوانب مسمّاة (`{ top: 8, bottom: 8 }`)، كما يقبلها [`hitSlop` الخاص بالعرض](./index.md#presses-and-feedback).

```tsx
<Toggle
  pressed={favorite()}
  hitSlop={12}
  accessibilityLabel="Favorite"
  onChange={({ pressed }) => favorite.set(pressed)}
  class="size-5 items-center justify-center"
>
  <Text>★</Text>
</Toggle>
```

<a id="accessibility"></a>

## إمكانية الوصول

- الـ Toggle عنصر واحد لقارئات الشاشة، بالدور `"button"` وحالة الضغط: زر تبديل. تسميته هي نص محتوياته، أو `accessibilityLabel`.
- `ToggleGroup` لها الدور `"toolbar"`: تسمع قارئات الشاشة أزرار التبديل بداخلها على أنها شريط أدوات واحد، مع بقاء كل منها عنصرًا مستقلًا.
- `disabled` يُعلَن بالطريقة التي تعلنه بها المنصة (VoiceOver وTalkBack وUI Automation وشجرة إمكانية الوصول في المتصفح).
- على macOS والويب تكون المجموعة وقفة واحدة في تركيز لوحة المفاتيح، وتنقل مفاتيح الأسهم بين أزرار التبديل فيها (أدناه).

راجع [إمكانية الوصول](../docs/accessibility.md) للاطلاع على التسميات والأدوار والإعلانات عمومًا.

<a id="keyboard"></a>

## لوحة المفاتيح

على macOS والويب، حيث يصل Tab إلى العروض التي تقبل الضغطات، تتبع `ToggleGroup` [نمط شريط الأدوات في WAI-ARIA](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/):

| المفتاح | ما يفعله |
|---|---|
| Tab، Shift+Tab | يدخل المجموعة عند أول Toggle مضغوط (أو أول Toggle غير معطّل إن لم يكن أي منها مضغوطًا)، ويغادرها بخطوة واحدة. |
| Right، Down | ينقل التركيز إلى الـ Toggle التالي، ومن الأخير إلى الأول. |
| Left، Up | ينقل التركيز إلى الـ Toggle السابق، ومن الأول إلى الأخير. |
| Home، End | ينقل التركيز إلى أول Toggle أو آخره. |
| Space، Return | يضغط الـ Toggle الذي عليه التركيز. |

تتخطى مفاتيح الأسهم أزرار التبديل المعطّلة ولا تضغط شيئًا: لا يتغير الـ Toggle إلا عند ضغطه. يعمل زوجا الأسهم كلاهما أيًّا كان تخطيط المجموعة، وهو من فئات التطبيق. في التخطيط من اليمين إلى اليسار يتبادل Left وRight موضعيهما: ينتقل Left إلى الـ Toggle التالي وRight إلى السابق؛ أما Up وDown وHome وEnd فتبقى كما هي. تُظهر أنماط `focus:` موضع التركيز. و`Toggle`
خارج `ToggleGroup` وقفة مستقلة بذاتها.

<a id="platform-notes"></a>

## ملاحظات المنصات

- iOS وAndroid وMac Catalyst: الضغطة هي نقرة لمسية تنتهي على الـ Toggle، بما في ذلك محتواه.
- أنظمة سطح المكتب (macOS وWindows وLinux وGPUI) والويب: الضغطة هي نقرة. على macOS والويب، يضغط Space وReturn أيضًا الـ Toggle الذي عليه تركيز لوحة المفاتيح، وتنقل مفاتيح الأسهم وHome وEnd التركيز ([لوحة المفاتيح](#keyboard)).
- كل منصة ترسم ما ينسّقه التطبيق: أزرار التبديل، وسطح الأزرار المضغوطة، ومسار المجموعة.
