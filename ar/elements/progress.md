---
title: "Progress"
description: "مكوّن Progress: شريط تقدّم خطي يتولّى تحديد الدور والنطاق والقيمة لقارئات الشاشة، ويضبط عرض المؤشر وفقًا للقيمة، ويتكوّن من مسار ومؤشر يتولّى التطبيق تنسيقهما."
group: base
demo: el-progress
source_hash: c9a75dc1aac1177f
---

# التقدم

يعرض شريط التقدم مدى تقدم مهمة ذات مدى معروف (تنزيل، أو رفع، أو خطوة من خطوات الإعداد)، أو يبيّن، أثناء
`indeterminate`، أن مهمة ذات مدى غير معروف قيد التنفيذ. وهو يتولى ما يصل إلى قارئات الشاشة، أي دور شريط التقدم
بالمدى من 0 إلى 100 والقيمة، وعرض المؤشر: `value` بالمئة من عرض المسار. أما المظهر فهو من شأن التطبيق: فـ`Progress` ليس له ألوان
ولا أحجام ولا أنصاف أقطار ولا حركة ولا تسمية خاصة به. ويتكوّن من مسار بداخله مؤشر، ثم عناصره الفرعية (تسمية، والقيمة كنص)،
ويتولى التطبيق تنسيق كل جزء.

```rust tabs
use nsh_base::{progress, theme};
use nsh_core::prelude::*;

fn upload(sent: Signal<f32>) -> impl IntoElement {
    progress()
        .value(sent)
        .accessibility_label("Uploading photos")
        .gap_2()
        .track_style(|s| s.h(px(8.0)).rounded_full().overflow_hidden().bg(move || theme().muted))
        .indicator_style(|s| s.h_full().rounded_full().bg(move || theme().primary))
        .child(
            text(move || format!("{:.0}%", sent.get()))
                .text_sm()
                .text_color(move || theme().muted_foreground),
        )
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { Progress } from "nsh/base";

function App() {
  const sent = signal(40);
  return (
    <Progress
      value={sent()}
      accessibilityLabel="Uploading photos"
      class="gap-2"
      trackClass="h-2 overflow-hidden rounded-full bg-muted"
      indicatorClass="h-full rounded-full bg-primary"
    >
      <Text class="text-sm text-muted-foreground">{`${sent()}%`}</Text>
    </Progress>
  );
}

mount(App);
```

يأتي `Progress` من [`nsh/base`](../modules/nsh-base.md)، وهي الحزمة `nsh-base` في Rust. والقيمة من شأن التطبيق: إذ يعرض شريط التقدم
`value` الذي يمرره التطبيق، مقيّدًا بين 0 و100. وفي Rust يُنشئ `progress()` شريطًا بدالة ضبط لكل خاصية
(`.value(..)`، `.indicator_style(..)`)، ودوال التنسيق المطبّعة لشريط التقدم نفسه، و`.child(..)` لتسميته.

<a id="props"></a>

## الخصائص

| الخاصية | Rust | النوع | القيمة الافتراضية | الوصف |
|---|---|---|---|---|
| `value` | `.value(..)` | `number` | `0` | مدى تقدم المهمة كنسبة مئوية من 0 إلى 100 (وخارج هذا المدى تُؤخذ أقرب نهاية). يكون المؤشر بهذه النسبة من عرض المسار، وتنطقها قارئات الشاشة. |
| `indeterminate` | `.indeterminate(..)` | `boolean` | `false` | مدى المهمة غير معروف: تسمع قارئات الشاشة شريط تقدم بلا قيمة، ويكون عرض المؤشر من شأن التطبيق (`indicatorClass`). |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | لا شيء | ما تنطق به قارئات الشاشة: ما الذي قيد التنفيذ، حين لا يكون في العناصر الفرعية نص يدل عليه. |
| `trackClass`، `trackStyle` | `.track_style(\|s\| ..)` | `string`، `StyleProp<ViewStyle>` | لا شيء | المسار، وهو الجزء الذي يملؤه المؤشر. |
| `indicatorClass`، `indicatorStyle` | `.indicator_style(\|s\| ..)` | `string`، `StyleProp<ViewStyle>` | لا شيء | المؤشر، داخل المسار: ارتفاعه ولونه وحركته. |
| `children` | `.child(..)` | `JSX.Element` | لا شيء | المحتوى الذي يلي المسار: تسمية أو القيمة كنص، وتنطق به قارئات الشاشة. |
| `class`، `style` | دوال التنسيق | `string`، `StyleProp<ViewStyle>` | لا شيء | شريط التقدم نفسه: العمود (أو الصف) الذي يحيط بالمسار والتسمية. |

<a id="parts"></a>

## الأجزاء

| الجزء | موقعه | يُنسَّق باستخدام |
|---|---|---|
| شريط التقدم | | `class`، `style` |
| المسار | داخل شريط التقدم، أولًا | `trackClass`، `trackStyle` |
| المؤشر | داخل المسار | `indicatorClass`، `indicatorStyle`؛ وعرضه `value` بالمئة من عرض المسار |
| التسمية | داخل شريط التقدم، بعد المسار | عناصرها الخاصة (`children`) |

يبدأ المؤشر من الحافة الأمامية للمسار؛ ويقوم `overflow-hidden` ونصف القطر على المسار بتدوير نهايته مع نهاية
المسار. ويحل صنف `w-*` أو `width` في `indicatorStyle` محل عرض القيمة، وبهذا يحصل الشريط غير المحدد على عرضه الخاص.

<a id="indeterminate"></a>

## غير المحدد

أثناء كون المدى غير معروف، اضبط `indeterminate` وامنح المؤشر عرضًا وحركة خاصين بالتطبيق. فالحركة
من اختيار التطبيق، ويُبقيها `motion-reduce:` ساكنة لمن يطلبون حركة أقل:

```tsx
<Progress
  value={0}
  indeterminate={connecting()}
  trackClass="h-2 overflow-hidden rounded-full bg-muted"
  indicatorClass={
    connecting()
      ? "h-full w-1/3 rounded-full bg-primary animate-pulse motion-reduce:animate-none"
      : "h-full rounded-full bg-primary"
  }
/>
```

<a id="accessibility"></a>

## إمكانية الوصول

- شريط التقدم عنصر واحد بالنسبة إلى قارئات الشاشة، بالدور `"progressbar"` والمدى من 0 إلى 100 وقيمته
  (ينطقها VoiceOver وTalkBack كنسبة مئوية)؛ والمسار والمؤشر جزءان منه. وتسميته هي نص
  عناصره الفرعية؛ فمرّر `accessibilityLabel` إذا لم يكن له نص.
- أثناء `indeterminate`، يحتفظ بالدور والمدى ولا تكون له قيمة (وفي المتصفح: يُحذف `aria-valuenow`،
  كما تنص ARIA على شريط التقدم غير المحدد).
- لا يقبل نقرات ولا تركيز لوحة المفاتيح: فهو يُبلغ فقط، أما عناصر التحكم التي تبدأ المهمة أو توقفها فمن شأن التطبيق.

انظر [إمكانية الوصول](../docs/accessibility.md) للاطلاع على التسميات والأدوار والإعلانات بوجه عام.

<a id="platform-notes"></a>

## ملاحظات المنصات

- كل منصة ترسم ما ينسّقه التطبيق؛ ويتبع عرض المؤشر `value` فورًا، ويتحرك التغيير
  حين يُحرّكه التطبيق.
- قارئات الشاشة: يسمع VoiceOver (iOS وmacOS) القيمة كنسبة مئوية والشريط على أنه يتحدث باستمرار؛
  أما TalkBack وUI Automation (Windows) وإمكانية الوصول في GTK (Linux) والمتصفح (`aria-valuenow`) فتحصل على المدى و
  القيمة.
