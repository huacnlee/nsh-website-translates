---
title: "Sheet"
description: "مكوّن Sheet: لوحة تظهر عند حافة الشاشة فوق خلفية معتمة، ويمكن إغلاقها بالنقر على الخلفية أو بالضغط على Escape أو بزر الرجوع، ويتولى التطبيق تنسيقها."
group: base
demo: el-sheet
source_hash: 9ebaacaa0bebfe35
---

# Sheet

الـ Sheet هي لوحة عند حافة الشاشة فوق خلفية تغطي بقية الشاشة: مرشحات، أو لوحة مشاركة، أو درج جانبي. يغلقها الضغط على الخلفية، أو مفتاح Escape، أو زر الرجوع في Android، أو إيماءة الهروب في VoiceOver. تظهر فوق كل شيء في نافذتها، بالشكل نفسه على كل جهاز، ولا ترسم شيئًا من تلقاء نفسها: اللوحة والخلفية من مسؤولية التطبيق.

```rust tabs
use nsh_base::{SheetEvent, sheet};
use nsh_core::prelude::*;

fn filters(open: Signal<bool>) -> impl IntoElement {
    sheet()
        .open(move || Some(open.get()))
        .on_open_change(move |e: &SheetEvent| {
            if let SheetEvent::OpenChange(next, _) = e {
                open.set(*next);
            }
        })
        .child(
            view()
                .gap_3()
                .p_6()
                .rounded_t(px(16.0))
                .bg(white())
                .child(text("Filters").font_weight(FontWeight::SEMIBOLD))
                .child(view().on_press(move || open.set(false)).child(text("Done"))),
        )
}
```

```tsx tabs
import { signal, Text, View } from "nsh";
import { Sheet } from "nsh/base";

function Filters() {
  const open = signal(false);
  return (
    <>
      <View onPress={() => open.set(true)}><Text>Filters</Text></View>
      <Sheet
        open={open()}
        onOpenChange={(e) => open.set(e.open)}
        popupClass="gap-3 rounded-t-2xl bg-white p-6"
        backdropClass="bg-black/40"
      >
        <Text class="font-semibold">Filters</Text>
        <View onPress={() => open.set(false)}><Text>Done</Text></View>
      </Sheet>
    </>
  );
}
```

`Sheet` تأتي من [`nsh/base`](../modules/nsh-base.md). يُنشأ محتواها في كل مرة تُفتح فيها. يضعها `side` عند `"bottom"` (الافتراضي) أو `"top"` من الشاشة، بعرض الشاشة كاملًا، أو عند `"left"` أو `"right"`، بارتفاع الشاشة كاملًا؛ أما حجمها في الاتجاه المعاكس فهو حجم اللوحة، ويُحدَّد من محتواها أو من `popupClass`.

يتبع انزلاقها الحجم المقيس للوحة أثناء إنشاء المحتوى أو نموه خلال الدخول. يتشارك المحتوى الكسول وتحديثات الحجم غير المتزامنة تقدّم الحركة نفسه؛ وتستقر اللوحة عند حجمها الحالي.

<a id="open-state"></a>

## حالة الفتح

بدون `open`، تحتفظ الـ Sheet بحالتها الخاصة، بدءًا من `defaultOpen`. ومع `open`، يملك التطبيق الحالة: غيّرها في `onOpenChange({ open, reason })`، الذي يبلغ عن كل طلب إغلاق مع سببه (`"backdropPress"`، `"cancel"`، `"swipe"`).
يتبع `onOpen` و`onClose` الحالة عند الدخول والخروج، سواء من فتحها أو أغلقها.

يُبقيها `closeOnEscape={false}` مفتوحة عند Escape والرجوع، ويُبقيها `closeOnBackdropPress={false}` مفتوحة عند الضغط على الخلفية؛
ويظل `onCancel` يستقبل هذه الأحداث، ليسأل أولًا.

<a id="dragging-a-bottom-sheet"></a>

## سحب الـ Sheet السفلية

اضبط `closeOnSwipe` لتسمح للوحة السفلية باتباع السحب نحو الأسفل. تتلاشى خلفيتها مع المسافة؛ وعند الإفلات بعد تجاوز 30% من ارتفاع اللوحة، أو بسرعة نحو الأسفل تبلغ 800 نقطة في الثانية، يُطلب الإغلاق بالسبب `"swipe"`.
أما السحب الأقصر فتعود اللوحة بعده بسلاسة. يمكن للمالك المتحكم أن يُبقي `open` مساويًا لـ true لإعادة اللوحة بعد طلب الإغلاق.
عند تفعيل الحركة المخفّضة، يستقر الإفلات والفتح/الإغلاق البرمجي فورًا؛ ويظل السحب المباشر يتبع الإصبع.

تتلاءم اللوحة مع محتواها، بما في ذلك القوائم القصيرة؛ استخدم `popupStyle` أو ارتفاع أحد العناصر الفرعية لتقييد المحتوى الأطول.
يرسم التطبيق مقبضه الخاص، ويمكن أن يكون أي عنصر عرض داخل اللوحة. على iOS، يستهلك `Scroll` أو `List` رأسي داخلي السحب حتى بلوغ أعلاه، ثم يمرر الحركة المتبقية نحو الأسفل إلى اللوحة ضمن الإيماءة نفسها.
على Android وأنظمة سطح المكتب والويب، يستخدم سحب المقبض أو المحتوى خارج منطقة التمرير دعم السحب الأصلي لديها؛
وتحتفظ عناصر التمرير الداخلية بآلية الفصل بين الإيماءات المعتادة في منصتها. ضبط `closeOnSwipe` على false يُبقي اللوحة
ثابتة ويحافظ على المحتوى المُركَّب وموضع التمرير. أما الحواف الأخرى فتحتفظ بسلوكها الحالي.

<a id="native-sheets"></a>

## الـ Sheet الأصلية

تُرسم الـ Sheet بواسطة NSH داخل نافذة التطبيق، وينسّق التطبيق مظهرها. أما للحصول على الـ Sheet التي تعرضها المنصة نفسها (صفحة Sheet على iOS)، فاستخدم [Dialog](./dialog.md) مع `presentation="pageSheet"`.

<a id="props"></a>

## الخصائص

| الخاصية | Rust | النوع | الافتراضي | الوصف |
|---|---|---|---|---|
| `open` | `.open(..)` | `boolean` | لا شيء | مفتوحة، ويتحكم بها التطبيق. |
| `defaultOpen` | `.default_open(..)` | `boolean` | `false` | مفتوحة في البداية، بدون `open`. |
| `side` | `.side(..)` | `"top" \| "bottom" \| "left" \| "right"` | `"bottom"` | الحافة التي توجد عندها. |
| `closeOnEscape` | `.close_on_escape(..)` | `boolean` | `true` | يغلقها Escape وزر الرجوع في Android. |
| `closeOnBackdropPress` | `.close_on_backdrop_press(..)` | `boolean` | `true` | يغلقها الضغط على الخلفية. |
| `closeOnSwipe` | `.close_on_swipe(..)` | `boolean` | `false` | تتبع اللوحة السفلية السحب نحو الأسفل وتُغلق عند إفلات كافٍ. |
| `popupClass`، `popupStyle` | `.popup_class(..)`، `.popup_style(..)` | `string`، `StyleProp<ViewStyle>` | لا شيء | مظهر اللوحة. |
| `backdropClass`، `backdropStyle` | `.backdrop_class(..)`، `.backdrop_style(..)` | `string`، `StyleProp<ViewStyle>` | لا شيء | مظهر الخلفية، مثل لون شبه شفاف. |
| `children` | `.child(..)` | `JSX.Element` | لا شيء | المحتوى. |

<a id="events"></a>

## الأحداث

| الحدث | Rust | الوصف |
|---|---|---|
| `onOpenChange` | `.on_open_change(\|e\| ..)` | طلب إغلاق، مع السبب: `"backdropPress"` أو `"cancel"` أو `"swipe"`. |
| `onOpen` | `.on_open(\|\| ..)` | دخلت: اكتمل ظهورها بالكامل. |
| `onClose` | `.on_close(\|\| ..)` | خرجت: اختفت بالكامل. وكذلك عندما يغلقها التطبيق. |
| `onCancel` | `.on_cancel(\|\| ..)` | حاول المستخدم إغلاقها (Escape أو الرجوع، أو الضغط على الخلفية، أو سحب مفعّل)، سواء أُغلقت أم لا. |

على الويب، يعرض التضمين باستخدام `dialogs: "viewport"` الـ Sheet وخلفيتها فوق الصفحة المضيفة،
بما في ذلك iframe من الأصل نفسه. أما الإطارات من أصول مختلفة فتستخدم [`hostPlayerFrame`](../docs/web.md#embed-it-in-a-page).
