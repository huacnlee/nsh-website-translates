---
title: "Tooltip"
description: "مكوّن Tooltip: تلميح حول العنصر الذي يوجد فيه، يظهر على أنظمة سطح المكتب عندما يستقر المؤشر عليه، ويتحكم التطبيق في تنسيقه."
group: base
demo: el-tooltip
source_hash: bc1733626637e39f
---

# Tooltip

التلميح (Tooltip) إشارة قصيرة بجوار العنصر الذي تتعلق به: ماذا يفعل زر أيقونة، أو النص الكامل لتسمية مقتطعة.
على أجهزة سطح المكتب ومتصفحاتها يظهر بعد أن يستقر المؤشر على العنصر المُحفِّز لمدة `delay` (500 مللي ثانية)، ويختفي
عندما يغادر المؤشر العنصر أو يضغط عليه. على الهواتف والأجهزة اللوحية لا يظهر التلميح إلا عندما يفتحه التطبيق
(`open`). لا يستحوذ أبدًا على المؤشر أو الضغطات، لذا يعمل العنصر المُحفِّز تمامًا كما يعمل بدونه.

`Tooltip` من [`nsh/base`](../modules/nsh-base.md) يُمرَّر عبر الخاصية `tooltip` التي يملكها كل عنصر
([الخصائص المشتركة](index.md#tooltips))، مثل `.tooltip(..)` في GPUI: العنصر هو ما يستقر عليه المؤشر وما يُوضَع التلميح بالنسبة إليه.
أما التلميح نفسه فهو الفقاعة: نسّقها باستخدام `class` / `style`، وأبناؤها هم ما تقوله.

```rust tabs
use nsh_base::tooltip;
use nsh_core::prelude::*;

fn save_button(on_save: impl Fn() + 'static) -> impl IntoElement {
    view()
        .on_press(on_save)
        .accessibility_label("Save")
        .p_2()
        .child(text("💾"))
        .tooltip(
            tooltip()
                .placement(Placement::Bottom)
                .rounded_md()
                .bg(rgb(0x111827))
                .px_2()
                .py_1()
                .child(text("Save the document").text_color(white())),
        )
}
```

```tsx tabs
import { Text, View } from "nsh";
import { Tooltip } from "nsh/base";

function SaveButton(props: { onSave: () => void }) {
  return (
    <View
      onPress={props.onSave}
      accessibilityLabel="Save"
      class="p-2"
      tooltip={
        <Tooltip placement="bottom" class="rounded-md bg-gray-900 px-2 py-1">
          <Text class="text-white">Save the document</Text>
        </Tooltip>
      }
    >
      <Text>💾</Text>
    </View>
  );
}
```

يظهر فوق العنصر المُحفِّز افتراضيًا (`placement`)، وعلى الجانب الآخر عند عدم وجود مساحة، ويبقى داخل المنطقة الآمنة.
مع `open` يقرر التطبيق متى يظهر: فهو يتبع `onOpenChange`، الذي يُبلِّغ عن استقرار المؤشر على العنصر المُحفِّز أو مغادرته له،
ويمكنه إظهاره على أي جهاز.

يظهر ويختفي وفق انتقالاتك: `startingClass` هو مظهره في إطاره الأول و`endingClass` مظهره بعد الإخفاء، ويحتفظ به أثناء تشغيل
فئات `transition-*` في `class`؛ ثم يليه `onClose`.

```tsx
<Tooltip
  class="rounded-md bg-gray-900 px-2 py-1 transition-opacity duration-100"
  startingClass="opacity-0"
  endingClass="opacity-0"
>
  <Text class="text-white">Save the document</Text>
</Tooltip>
```

<a id="props"></a>

## الخصائص

| الخاصية | Rust | النوع | الافتراضي | الوصف |
|---|---|---|---|---|
| `children` | `.child(..)` | `JSX.Element` | لا شيء | ما يقوله. |
| `class`، `style` | `.app_class(..)`، طرائق `Styled` | `string`، `StyleProp<ViewStyle>` | لا شيء | مظهر الفقاعة، أي التلميح نفسه. |
| `startingClass`، `startingStyle` | `.starting_class(..)`، `.starting_style(..)` | `string`، `StyleProp<ViewStyle>` | لا شيء | مظهره في إطاره الأول: تبدأ انتقالاته منه. |
| `endingClass`، `endingStyle` | `.ending_class(..)`، `.ending_style(..)` | `string`، `StyleProp<ViewStyle>` | لا شيء | مظهره بعد الإخفاء: يبقى أثناء تشغيل انتقالاته. |
| `open` | `.open(..)` | `boolean` | لا شيء | ظاهر، ويتحكم فيه التطبيق. |
| `defaultOpen` | `.default_open(..)` | `boolean` | `false` | ظاهر في البداية، دون `open`. |
| `delay` | `.delay(..)` | `number` | `500` | عدد المللي ثانية التي يستقر فيها المؤشر على العنصر المُحفِّز قبل ظهوره؛ `Infinity`: لا يظهر من تلقاء نفسه أبدًا، بل فقط عندما يفتحه التطبيق. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | لا يظهر أبدًا. |
| `placement` | `.placement(..)` | `"top" \| "bottom" \| "left" \| "right"` | `"top"` | جانب العنصر المُحفِّز الذي يوضع عليه. |
| `align` | `.align(..)` | `"start" \| "center" \| "end"` | `"center"` | كيفية محاذاته للعنصر المُحفِّز على امتداد ذلك الجانب. |
| `offset` | `.offset(..)` | `number` | `4` | المسافة بين العنصر المُحفِّز والتلميح. |
| `margin` | `.margin(..)` | `number` | `4` | المسافة التي يحافظ عليها من حواف المنطقة الآمنة. |

<a id="events"></a>

## الأحداث

| الحدث | Rust | الوصف |
|---|---|---|
| `onOpenChange` | `.on_open_change(\|e\| ..)` | استقر المؤشر على العنصر المُحفِّز، أو غادره أو ضغط عليه (`reason` `"hover"`). |
| `onOpen` | `.on_open(\|\| ..)` | ظهر التلميح. |
| `onClose` | `.on_close(\|\| ..)` | اختفى التلميح بعد انتهاء خروجه؛ وكذلك عندما يخفيه التطبيق. |

<a id="accessibility"></a>

## إمكانية الوصول

يكرر التلميح ما يقوله العنصر المُحفِّز لقارئات الشاشة: امنح العنصر المُحفِّز `accessibilityLabel` أيضًا، ليكون
التلميح متاحًا للجميع.
