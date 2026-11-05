---
title: "Accordion"
description: "Accordion وأجزاؤه: أقسام متراصة تتوسع وتنطوي أسفل عناوينها، قسم واحد في كل مرة أو عدة أقسام، وتُفتح بحسب قيمة التطبيق، ويظهر محتواها بارتفاع نابضي عند الطلب، مع ترك كل ما يتعلق بالمظهر للتطبيق."
group: base
demo: el-accordion
source_hash: fb5b5e196c111b08
---

# Accordion

يكدّس الأكورديون (Accordion) أقسامًا تتوسع وتنطوي تحت عناوينها: أسئلة الأسئلة الشائعة، ومجموعات صفحة الإعدادات، وخطوات الدفع. يتكوّن من خمسة أجزاء، يملك كل منها جزءًا واحدًا من السلوك ولا يملك شيئًا من المظهر:

- `Accordion`، المكدّس: يحمل `value` التطبيق، وهي قيم العناصر المفتوحة، ويُبلغ بالقيمة التالية عبر `onChange`. يُفتح عنصر واحد في كل مرة، أو عدة عناصر باستخدام `multiple`.
- `AccordionItem`، قسم واحد، يُعرَّف بـ`value`. يكون مفتوحًا ما دامت `value` الأكورديون تحتوي عليه.
- `AccordionHeader`، عنوان العنصر، من `level` تعلنه قارئات الشاشة.
- `AccordionTrigger`، الزر في العنوان الذي يوسّع عنصره ويطويه، ويُعلن ما إذا كان موسّعًا.
- `AccordionPanel`، محتوى العنصر، يظهر ما دام مفتوحًا؛ ومع `reveal` يتمدد ارتفاعه وينكمش بحركة نابضية.

```rust tabs
use nsh_base::{accordion, accordion_header, accordion_item, accordion_panel, accordion_trigger, theme};
use nsh_core::prelude::*;

const FAQ: [(&str, &str, &str); 2] = [
    ("shipping", "When will my order ship?", "Orders placed before 2 pm leave the same day."),
    ("returns", "How do I return an item?", "Print the label from your order within 30 days."),
];

fn faq() -> impl IntoElement {
    let open = signal(vec![SharedString::from("shipping")]);
    let mut list = accordion()
        .value(open)
        .on_change(move |value: &Vec<SharedString>| open.set(value.clone()));
    for (value, question, answer) in FAQ {
        list = list.child(
            accordion_item()
                .value(value)
                .border_b_1()
                .border_color(move || theme().border)
                .child(
                    accordion_header().child(
                        accordion_trigger()
                            .flex_row()
                            .items_center()
                            .justify_between()
                            .py_3()
                            .child(text(question).font_weight(FontWeight::MEDIUM))
                            .child(text("⌄").transition_transform().rotate(move || {
                                let open = open.get().iter().any(|v| &**v == value);
                                if open { deg(180.0) } else { deg(0.0) }
                            })),
                    ),
                )
                .child(
                    accordion_panel()
                        .reveal(true)
                        .accessibility_label(question)
                        .child(view().pb_3().child(text(answer).text_color(move || theme().muted_foreground))),
                ),
        );
    }
    list
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { Accordion, AccordionHeader, AccordionItem, AccordionPanel, AccordionTrigger } from "nsh/base";

const FAQ = [
  { value: "shipping", question: "When will my order ship?", answer: "Orders placed before 2 pm leave the same day." },
  { value: "returns", question: "How do I return an item?", answer: "Print the label from your order within 30 days." },
];

function App() {
  const open = signal(["shipping"]);
  return (
    <Accordion value={open()} onChange={({ value }) => open.set(value)}>
      {FAQ.map((item) => (
        <AccordionItem value={item.value} class="border-b border-border">
          <AccordionHeader>
            <AccordionTrigger class="group flex-row items-center justify-between py-3 active:opacity-70">
              <Text class="font-medium">{item.question}</Text>
              <Text class="transition-transform group-aria-expanded:rotate-180">⌄</Text>
            </AccordionTrigger>
          </AccordionHeader>
          <AccordionPanel reveal accessibilityLabel={item.question}>
            <View class="pb-3">
              <Text class="text-muted-foreground">{item.answer}</Text>
            </View>
          </AccordionPanel>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

mount(App);
```

تأتي الأجزاء من [`nsh/base`](../modules/nsh-base.md)، وهي حزمة `nsh-base` في Rust. القيمة ملك التطبيق: فضغطة المشغّل تُبلغ بالقيمة `value` التالية عبر `onChange`، ويفتح الأكورديون العناصر التي تعيد إليه التطبيقُ قيمها. يجد كل جزء الجزء المحيط به من تلقاء نفسه، فيرتّبها التطبيق بحرية: فواصل بين العناصر، وشارة في عنوان، وأيقونة قبل العنوان. في Rust تُنشئ `accordion()` و`accordion_item()` و`accordion_header()` و`accordion_trigger()` و`accordion_panel()` هذه الأجزاء، مع دالة ضبط لكل خاصية و`.child(..)` لما بداخلها.

<a id="props"></a>

## الخصائص

<a id="accordion-1"></a>

### Accordion

| الخاصية | Rust | النوع | القيمة الافتراضية | الوصف |
|---|---|---|---|---|
| `value` | `.value(..)` | `string[]` | `[]` | `value` العناصر المفتوحة. يملكها التطبيق: فضغطة المشغّل تُبلغ بالقيم التالية عبر `onChange`، ويعرض الأكورديون القيم التي يعيدها التطبيق. |
| `multiple` | `.multiple(..)` | `boolean` | `false` | عدة عناصر مفتوحة في آن واحد: فتح عنصر يترك العناصر الأخرى مفتوحة. وبدونها، يُغلق فتحُ عنصرٍ العنصرَ الذي كان مفتوحًا. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | جميع العناصر معطّلة: لا يقبل أي مشغّل ضغطات، وتعلن قارئات الشاشة أن كل عنصر باهت. |
| `children` | `.child(..)` | `JSX.Element` | لا شيء | العناصر، وما يرتّبه التطبيق بينها (فواصل). |
| `class`، `style` | دوال التنسيق | `string`، `StyleProp<ViewStyle>` | لا شيء | تخطيط المكدّس ومظهره: بطاقة حول العناصر، والمسافة بينها. |

### AccordionItem

| الخاصية | Rust | النوع | القيمة الافتراضية | الوصف |
|---|---|---|---|---|
| `value` | `.value(..)` | `string` | مطلوبة | ما يُعرّف العنصر في `value` الأكورديون: معرّف التطبيق نفسه، وليس عنوانه أبدًا، لأن العنوان يتغير باللغة. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | لا يقبل مشغّله ضغطات، وتعلن قارئات الشاشة أنه باهت. ويبقى مفتوحًا أو مغلقًا بحسب ما تقوله `value` الأكورديون. |
| `children` | `.child(..)` | `JSX.Element` | لا شيء | ترويسة العنصر ولوحته، وما يرتّبه التطبيق فيه. |
| `class`، `style` | دوال التنسيق | `string`، `StyleProp<ViewStyle>` | لا شيء | القسم: فاصل تحته، وبطاقة حوله. |

### AccordionHeader

| الخاصية | Rust | النوع | القيمة الافتراضية | الوصف |
|---|---|---|---|---|
| `level` | `.level(..)` | `number` | `3` | مستوى العنوان بين عناوين الصفحة، لقارئات الشاشة (1 هو الأعلى). |
| `children` | `.child(..)` | `JSX.Element` | لا شيء | مشغّل العنصر، وما تحمله الترويسة أيضًا (شارة، إجراء خاص بها). |
| `class`، `style` | دوال التنسيق | `string`، `StyleProp<ViewStyle>` | لا شيء | تخطيط العنوان. |

### AccordionTrigger

| الخاصية | Rust | النوع | القيمة الافتراضية | الوصف |
|---|---|---|---|---|
| `expandedStyle` | `.expanded_style(\|s\| ..)` | `StyleProp<ViewStyle>` | لا شيء | تنسيق المشغّل أثناء فتح عنصره، على هيئة فئات `aria-expanded:`. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | لا شيء | ما تقوله قارئات الشاشة، حين لا يكون في العناصر الفرعية نص يقوله. |
| `children` | `.child(..)` | `JSX.Element` | لا شيء | العنوان والسهم؛ وتتبع فئات `group-aria-expanded:` بداخلها المشغّلَ باستخدام `group` على `class` الخاص به. |
| `class`، `style` | دوال التنسيق | `string`، `StyleProp<ViewStyle>` | لا شيء | المشغّل نفسه: الصف الذي يضغطه المستخدم. |
| `activeStyle`، `hoverStyle`، `focusStyle`، `disabledStyle` | `.active(\|s\| ..)`، `.hover(..)`، `.focus(..)`، `.disabled_style(..)` | `StyleProp<ViewStyle>` | لا شيء | تنسيق المشغّل أثناء الضغط أو التمرير أو التركيز أو التعطيل، على هيئة فئات `<state>:`. |

### AccordionPanel

| الخاصية | Rust | النوع | القيمة الافتراضية | الوصف |
|---|---|---|---|---|
| `reveal` | `.reveal(..)` | `boolean` | `false` | يُفتح ويُغلق بكشف تدريجي، كما في `Collapsible`: تقصّ اللوحة محتواها، ويتمدد ارتفاعها بحركة نابضية من الصفر إلى ارتفاع المحتوى وبالعكس، بتخميد حرج (نحو 265 ملّي ثانية، بلا تجاوز)، وتتحرك العناصر التي بعدها معها. ومع تقليل الحركة تُفتح وتُغلق فورًا. |
| `keepMounted` | `.keep_mounted(..)` | `boolean` | `false` | يبقى المحتوى في الشجرة أثناء إغلاق العنصر، بعيدًا عن الأنظار وعن تركيز لوحة المفاتيح وعن قارئات الشاشة: فيحتفظ الفيديو بموضعه، وتحتفظ عروض الويب بصفحتها. وبدونها يغادر المحتوى الشجرة عند إغلاق اللوحة (بعد أن يُنهي الكشف إغلاقها) ويعود كما كان. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | لا شيء | ما تسمّي به قارئات الشاشة المنطقة: عادةً عنوان العنصر، كما تقوله ترويسته. |
| `children` | `.child(..)` | `JSX.Element` | لا شيء | المحتوى. |
| `class`، `style` | دوال التنسيق | `string`، `StyleProp<ViewStyle>` | لا شيء | تخطيط المنطقة ومظهرها. ومع `reveal` تبقى اللوحة في التخطيط وهي مغلقة بارتفاع صفر، لذا توضع الحشوات والحدود على عرض (View) يحتوي المحتوى. |

<a id="events"></a>

## الأحداث

| الحدث | Rust | الوصف |
|---|---|---|
| `onChange({ value })` (`Accordion`) | `.on_change(\|value: &Vec<SharedString>\| ..)` | ضُغط مشغّل: نقرة لمسية، أو نقرة بالفأرة، أو Space أو Return أثناء تركيز لوحة المفاتيح عليه، أو تفعيل من قارئ شاشة. `value` هي قيم العناصر المفتوحة كما ستكون: قيمة العنصر المفتوح تغادرها، وقيمة العنصر المغلق تنضم إليها في النهاية، أو، بدون `multiple`، تحل محلها. ويعمل قبل أن يتغير أي شيء: اضبط `value` لتتبعه. |

<a id="parts"></a>

## الأجزاء

| الجزء | داخل | يُنسَّق بواسطة | الحالات |
|---|---|---|---|
| المكدّس | | `Accordion` الخاصة بـ`class`، `style` | |
| عنصر | المكدّس | `AccordionItem` الخاصة بـ`class`، `style` | قيمة التطبيق |
| العنوان | العنصر | `AccordionHeader` الخاصة بـ`class`، `style` | |
| المشغّل | العنوان | `AccordionTrigger` الخاصة بـ`class`، `style` | `aria-expanded:`، `disabled:`، `active:`، `hover:`، `focus:` (أو `expandedStyle`، `disabledStyle`، ...) |
| العنوان الفرعي والسهم | المشغّل | عناصرها الخاصة (`children`) | `group-aria-expanded:`، `group-disabled:` مع `group` على `class` الخاص بالمشغّل |
| اللوحة | العنصر، بعد العنوان | `AccordionPanel` الخاصة بـ`class`، `style` | |
| المحتوى | اللوحة | عناصره الخاصة (`children`) | |

بدون `reveal`، تخرج اللوحة المغلقة من التخطيط ويخرج محتواها من الشجرة. ومع `reveal`، يكون التغيير حركة تخطيط (layout animation) في الإيداع الذي يغيّر `value` (كما في `LayoutAnimation.configureNext`، وتُنفَّذ أصلية، فلا تعمل JavaScript أثناء الحركة): تنمو اللوحة التي تُفتح من الصفر إلى ارتفاع محتواها، وتنكمش التي تُغلق إلى الوراء، كلتاهما بالنابض نفسه، وتتحرك العناصر التي بعدهما معهما. وتصحبها انتقالة من التطبيق: يدور السهم (`transition-transform group-aria-expanded:rotate-180`).

<a id="disabled"></a>

## التعطيل

لا يقبل مشغّل العنصر المعطّل ضغطات، وتعلنه قارئات الشاشة باهتًا؛ وتتبعه فئات `disabled:` على المشغّل و`group-disabled:` بداخله. وتعطّل `disabled` الأكورديون جميع العناصر. ويظل العنصر المعطّل يعرض ما تقوله `value` التطبيق: إذ يستطيع التطبيق فتحه.

<a id="accessibility"></a>

## إمكانية الوصول

- المكدّس مجموعة، وكل ترويسة عنوان من `level` الخاص بها، وكل مشغّل زر بداخلها يعلن ما إذا كان عنصره موسّعًا. وتستطيع قارئات الشاشة الانتقال من عنوان إلى عنوان.
- اللوحة المفتوحة منطقة (region) تُسمّى بـ`accessibilityLabel`؛ أما المغلقة فمخفية عن قارئات الشاشة، بما في ذلك المحتوى المُبقى فيها.
- مظهر العنصر المفتوح من شأن التطبيق، ولا ينبغي أن يعتمد على اللون وحده: أدِر السهم كما تفعل الأمثلة.

انظر [Accessibility](../docs/accessibility.md) للاطلاع على التسميات والأدوار والإعلانات عمومًا.

<a id="keyboard"></a>

## لوحة المفاتيح

حيث تكون العروض التي تقبل الضغطات محطات لتركيز لوحة المفاتيح (macOS والويب)، يكون كل مشغّل محطة، بترتيب الصفحة، ويضغطه Space وReturn. تُتخطى المشغّلات المعطّلة، وكذلك محتوى اللوحة المغلقة. وينقل Tab التركيز من مشغّل إلى عناصر التحكم في لوحته المفتوحة ثم إلى المشغّل التالي.

<a id="platform-notes"></a>

## ملاحظات المنصات

- تعرض كل منصة لوحة العنصر المفتوح تحت عنوانه وتترك المغلقة خارج التخطيط (بارتفاع صفر مع `reveal`).
- ومع `reveal`، تُحرّك كل منصة ارتفاعات اللوحات نابضيًا بمحرّك الحركة الخاص بها (iOS وAndroid وmacOS وWindows وLinux وGPUI والويب)، وتفتحها وتغلقها فورًا ما دام النظام يطلب تقليل الحركة.
- تسمع قارئ الشاشة في كل منصة العنوان ومستواه أثناء قراءة العناوين، والمشغّل بداخله زرًّا مع حالته الموسّعة؛ وفي iOS يقرأ VoiceOver المشغّل نفسه.
- iOS وAndroid وMac Catalyst: ضغطة المشغّل نقرة لمسية. أنظمة سطح المكتب (macOS وWindows وLinux وGPUI) والويب: نقرة بالفأرة، وSpace أو Return على المشغّل المركَّز عليه في macOS والويب.
