---
title: "Popover"
description: "مكوّن Popover: محتوى مثبّت على عنصر تشغيل ويظهر فوق كل العناصر الأخرى، ويمكن إغلاقه بواسطة عنصر التشغيل نفسه أو بالضغط خارجه أو بمفتاح Escape أو بزر الرجوع، ويتم تنسيقه من قبل التطبيق."
group: base
demo: el-popover
source_hash: 49f2e25232287792
---

# Popover

يعرض Popover محتوى بجوار العنصر الذي يشغّله وفوق كل ما عداه: تفاصيل، أو نموذجًا صغيرًا، أو أداة لاختيار الألوان.
يفتحه الضغط على المشغّل ويغلقه، كما يغلقه الضغط خارجه، أو Escape، أو زر الرجوع في Android، أو إيماءة الهروب في VoiceOver. يوضع
على أحد جوانب المشغّل، وينتقل إلى الجانب الآخر إذا لم تتوفر مساحة، ويبقى داخل المنطقة الآمنة، ويتبع
المشغّل أثناء التمرير. لا يرسم شيئًا بنفسه: النافذة المنبثقة ومحتواها من عمل التطبيق.

```rust tabs
use nsh_base::{OpenChangeReason, PopoverEvent, popover};
use nsh_core::prelude::*;

fn details() -> impl IntoElement {
    popover()
        .offset(px(6.0))
        .margin(px(8.0))
        .trigger(view().px_3().py_2().rounded_md().bg(rgb(0xe5e7eb)).child(text("Details")))
        .on_open_change(|e: &PopoverEvent| {
            if let PopoverEvent::OpenChange(open, OpenChangeReason::PressOutside) = e {
                log::info!("closed by a press outside: {open}");
            }
        })
        .child(
            view()
                .w(px(240.0))
                .gap_1()
                .p_3()
                .rounded_lg()
                .bg(white())
                .shadow_lg()
                .child(text("Order #1024").font_weight(FontWeight::SEMIBOLD))
                .child(text("Shipped yesterday, arriving Friday.")),
        )
}
```

```tsx tabs
import { Text, View } from "nsh";
import { Popover } from "nsh/base";

function Details() {
  return (
    <Popover
      offset={6}
      margin={8}
      popupClass="w-60 gap-1 rounded-lg bg-white p-3 shadow-lg"
      trigger={
        <View class="rounded-md bg-gray-200 px-3 py-2">
          <Text>Details</Text>
        </View>
      }
    >
      <Text class="font-semibold">Order #1024</Text>
      <Text>Shipped yesterday, arriving Friday.</Text>
    </Popover>
  );
}
```

`Popover` يأتي من [`nsh/base`](../modules/nsh-base.md). يُنشأ محتواه في كل مرة يُفتح فيها، لذا فإن الحالة داخله
تبدأ من جديد.

<a id="open-state"></a>

## حالة الفتح

بدون `open`، يحتفظ Popover بحالته الخاصة، بادئًا من `defaultOpen`. مع `open`، يتولى التطبيق ملكية الحالة: غيّرها
في `onOpenChange({ open, reason })`، الذي يبلّغ عن كل طلب فتح أو إغلاق مع سببه (`"triggerPress"`،
`"pressOutside"`، `"cancel"`).

```tsx
const open = signal(false);

<Popover open={open()} onOpenChange={(e) => open.set(e.open)} trigger={<Text>Filters</Text>}>
  <FilterForm onApply={() => open.set(false)} />
</Popover>
```

`closeOnEscape={false}` يُبقيه مفتوحًا عند Escape والرجوع (ومع ذلك يظل `onCancel` يسمعهما ليسأل أولًا)؛
`closeOnPressOutside={false}` يُبقيه مفتوحًا عند الضغط خارجه.

<a id="phones-and-desktops"></a>

## الهواتف وأجهزة سطح المكتب

يرتبط Popover بمشغّله على كل جهاز: ما يعرضه يخص العنصر الذي فتحه ويجب أن يكون بجواره.

- على أجهزة سطح المكتب وفي متصفحاتها، يغلقه الضغط خارجه ثم يمرَّر إلى ما تحت المؤشر، لذا
  تؤدي نقرة واحدة إلى إغلاق Popover والضغط على الزر الذي وقعت عليه.
- على الهواتف والأجهزة اللوحية، يكتفي الضغط خارجه بإغلاقه: خلفية شفافة تلتقط الضغطة، كما تفعل
  النوافذ المنبثقة في النظام.

لقائمة من الإجراءات استخدم [Menu](./menu.md)، الذي يتحول إلى sheet على الهواتف؛ وللوحة استخدم [Sheet](./sheet.md).

<a id="entrance-and-exit"></a>

## الدخول والخروج

يظهر Popover ويختفي مع انتقالاتك. `popupStartingClass` هو مظهر النافذة المنبثقة في إطارها الأول، وفئات
`transition-*` في `popupClass` تنقلها إلى مظهرها الخاص: أي دخولها. `popupEndingClass` هو مظهرها بعد
الإغلاق: يبقى Popover دون أن يستقبل أي ضغطات أثناء تشغيل هذه الانتقالات، ثم يزول، ويتبع ذلك `onClose`. إذا فُتح
من جديد أثناء خروجه، فإنه يعود إلى مظهره انطلاقًا من موضعه الحالي. `popupStartingStyle` و`popupEndingStyle` يؤديان الدور نفسه
بأنماط مضمّنة. عندما يطلب المستخدم حركة أقل، يظهر ويختفي فورًا.

```tsx
<Popover
  popupClass="rounded-lg bg-white p-3 shadow-lg transition-all duration-150 ease-out"
  popupStartingClass="opacity-0 scale-95"
  popupEndingClass="opacity-0 scale-95"
  onPosition={({ placement }) => side.set(placement)}
  trigger={<Text>Details</Text>}
>
  <OrderSummary />
</Popover>
```

`onPosition({ placement, bounds, available })` يخبرك أين ذهبت النافذة المنبثقة: جانب المشغّل (الجانب الآخر إذا لم تتوفر مساحة
في `placement`)، وإطارها، والمساحة المتاحة على ذلك الجانب، بحيث يمكن لسهم أو لحركة دخول أن يشير إلى المشغّل.

<a id="props"></a>

## الخصائص

| الخاصية | Rust | النوع | القيمة الافتراضية | الوصف |
|---|---|---|---|---|
| `open` | `.open(..)` | `boolean` | لا شيء | مفتوح، ويتحكم به التطبيق. |
| `defaultOpen` | `.default_open(..)` | `boolean` | `false` | مفتوح في البداية، بدون `open`. |
| `placement` | `.placement(..)` | `"top" \| "bottom" \| "left" \| "right"` | `"bottom"` | جانب المشغّل الذي يوضع عليه. |
| `align` | `.align(..)` | `"start" \| "center" \| "end"` | `"center"` | كيفية محاذاته للمشغّل على طول ذلك الجانب. |
| `offset` | `.offset(..)` | `number` | `0` | الفجوة بين المشغّل والنافذة المنبثقة. |
| `margin` | `.margin(..)` | `number` | `0` | المسافة التي يحافظ عليها من حواف المنطقة الآمنة. |
| `closeOnEscape` | `.close_on_escape(..)` | `boolean` | `true` | Escape وزر الرجوع في Android يغلقانه. |
| `closeOnPressOutside` | `.close_on_press_outside(..)` | `boolean` | `true` | الضغط خارجه يغلقه. |
| `popupClass`، `popupStyle` | `.popup_class(..)`، `.popup_style(..)` | `string`، `StyleProp<ViewStyle>` | لا شيء | مظهر النافذة المنبثقة، أي الصندوق الذي يوجد فيه المحتوى. |
| `popupStartingClass`، `popupStartingStyle` | `.popup_starting_class(..)`، `.popup_starting_style(..)` | `string`، `StyleProp<ViewStyle>` | لا شيء | مظهر النافذة المنبثقة في إطارها الأول، فوق مظهرها الخاص: تبدأ انتقالاتها منه. |
| `popupEndingClass`، `popupEndingStyle` | `.popup_ending_class(..)`، `.popup_ending_style(..)` | `string`، `StyleProp<ViewStyle>` | لا شيء | مظهر النافذة المنبثقة بعد الإغلاق، فوق مظهرها الخاص: تبقى أثناء تشغيل انتقالاتها. |
| `trigger` | `.trigger(..)` | `JSX.Element` | لا شيء | ما يفتحه؛ ويوضع Popover بالنسبة إليه. وما دام مفتوحًا تُطبَّق فئات `aria-expanded:` و`expandedStyle` الخاصة به. |
| `children` | `.child(..)` | `JSX.Element` | لا شيء | المحتوى. |

<a id="events"></a>

## الأحداث

| الحدث | Rust | الوصف |
|---|---|---|
| `onOpenChange` | `.on_open_change(\|e\| ..)` | فُتح أو أُغلق، مع السبب: `"triggerPress"` أو `"pressOutside"` أو `"cancel"`. |
| `onOpen` | `.on_open(\|\| ..)` | ظهر. |
| `onClose` | `.on_close(\|\| ..)` | زال، بعد خروجه؛ وكذلك عندما أغلقه التطبيق. |
| `onCancel` | `.on_cancel(\|\| ..)` | حاول المستخدم إغلاقه (Escape أو الرجوع، أو الضغط خارجه)، سواء أُغلق أم لا. |
| `onPosition` | `.on_position(\|e\| ..)` | وُضعت النافذة المنبثقة: `placement` (الجانب الذي وُضعت عليه)، `bounds` (إطارها)، `available` (المساحة المتاحة على ذلك الجانب). |

<a id="accessibility"></a>

## إمكانية الوصول

يخبر المشغّل قارئات الشاشة بما إذا كان Popover موسّعًا. يغلقه Escape وزر الرجوع، كما يتوقع المستخدمون
من أي نافذة منبثقة. في TSX يكون المشغّل هو العنصر الذي تمرره، سواء `Button` أو view من صنعك: فهو يتلقى الضغطات
وحالة التوسيع بنفسه، لذا تظهر فئات `active:` الخاصة به و`activeStyle` أثناء الضغط عليه، ويعمل `onPress` الخاص به
أيضًا.
