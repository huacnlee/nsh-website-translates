---
title: "HoverCard"
description: "المكوّن HoverCard: معاينة لما يشير إليه عنصر التفعيل الخاص به، تظهر أثناء بقاء المؤشر فوق عنصر التفعيل، ويتولى التطبيق تنسيقها."
group: base
demo: el-hover-card
source_hash: 30e2d3b34842945d
---

# HoverCard

تعرض بطاقة التمرير (hover card) معاينة لما يشير إليه المشغّل (trigger) دون مغادرة الصفحة: الملف الشخصي خلف إشارة، أو الصفحة خلف رابط، أو السعر خلف رمز سهم. على أجهزة سطح المكتب وفي متصفحاتها تُفتح البطاقة بعد أن يستقر المؤشر على المشغّل مدة `openDelay` (600 مللي ثانية)، أو بمجرد انتقال تركيز لوحة المفاتيح إلى المشغّل. وتبقى مفتوحة بينما ينتقل المؤشر من المشغّل إلى البطاقة والعكس، وما دام تركيز لوحة المفاتيح على المشغّل أو على رابط أو زر داخل البطاقة، بحيث يمكن استخدام كل ما في البطاقة بالمؤشر وبلوحة المفاتيح على حد سواء. وتُغلق بعد `closeDelay` (300 مللي ثانية) من مغادرة المؤشر للمشغّل والبطاقة معًا وخروج التركيز منهما. ويغلقها الضغط على Escape أو الضغط خارجها فورًا. أما على الهواتف والأجهزة اللوحية فيفتحها الضغط على المشغّل ويغلقها، ويغلقها الضغط خارجها.

`HoverCard` من [`nsh/base`](../modules/nsh-base.md) لا يرسم شيئًا بنفسه: المشغّل هو عنصرك، والنافذة المنبثقة ومحتواها من عندك.

```rust tabs
use nsh_base::hover_card;
use nsh_core::prelude::*;

fn mention() -> impl IntoElement {
    hover_card()
        .offset(px(8.0))
        .popup_class("w-72 gap-2 rounded-xl border border-border bg-popover p-4 shadow-lg")
        .trigger(text("@ada").text_color(rgb(0x2563eb)))
        .child(text("Ada Lovelace").font_weight(FontWeight::SEMIBOLD))
        .child(text("Writes the first programs for the Analytical Engine."))
}
```

```tsx tabs
import { Text } from "nsh";
import { HoverCard } from "nsh/base";

function Mention() {
  return (
    <HoverCard
      offset={8}
      popupClass="w-72 gap-2 rounded-xl border border-border bg-popover p-4 shadow-lg"
      trigger={<Text class="text-blue-600">@ada</Text>}
    >
      <Text class="font-semibold">Ada Lovelace</Text>
      <Text>Writes the first programs for the Analytical Engine.</Text>
    </HoverCard>
  );
}
```

يحتفظ المشغّل بدوره وضغطاته ومظهره: فالعنصر الذي له `role="link"` و`onPress` خاص به ينتقل إلى الوجهة نفسها عند الضغط عليه، وتضيف البطاقة معاينة إليه. يُنشأ المحتوى في كل مرة تُفتح فيها البطاقة، فيمكنه تحميل ما يعرضه حينها. وعلى الهواتف والأجهزة اللوحية، حيث يفتح الضغط البطاقة، يُعلم المشغّل قارئات الشاشة بما إذا كانت بطاقته مفتوحة. وفي [Toolbar](./toolbar.md) يمكن أن يكون المشغّل أحد عناصرها، أما ما تعرضه البطاقة فليس منها: فأزراره وروابطه تحتفظ بمحطات Tab الخاصة بها، ولا يغيّرها `disabled` الخاص بـ Toolbar.

<a id="delays"></a>

## التأخيرات

يمنع `openDelay` البطاقة من الانفتاح المفاجئ عندما يعبر المؤشر المشغّل في طريقه إلى مكان آخر، ويمنح `closeDelay` المؤشر وقتًا لعبور الفجوة بين المشغّل والبطاقة. وكلاهما بالمللي ثانية. يجري تتبع المؤشر والتأخيرات أصليًا، فلا يُنفَّذ أي من شيفرتك أثناء استقرار المؤشر على المشغّل أو تنقله بينه وبين البطاقة إلى أن تُفتح البطاقة أو تُغلق. وقيمة `Infinity` لـ `openDelay` تترك الفتح للتطبيق (وللضغط على الشاشة اللمسية)، وقيمة `Infinity` لـ `closeDelay` تترك الإغلاق لـ Escape والضغط خارج البطاقة وللتطبيق.

```tsx
<HoverCard openDelay={300} closeDelay={150} trigger={<Text>AAPL</Text>}>
  <Quote symbol="AAPL" />
</HoverCard>
```

<a id="open-state"></a>

## حالة الفتح

بدون `open` تحتفظ البطاقة بحالتها الخاصة، وتبدأ من `defaultOpen`. ومع `open` يملك التطبيق الحالة: غيّرها في `onOpenChange({ open, reason })`، الذي يبلّغ عن كل طلب للفتح أو الإغلاق مع سببه: `"hover"` (المؤشر)، `"focus"` (تركيز لوحة المفاتيح)، `"triggerPress"` (الضغط على شاشة لمسية)، `"pressOutside"` أو `"cancel"` (Escape أو الرجوع).

```tsx
const open = signal(false);

<HoverCard open={open()} onOpenChange={(e) => open.set(e.open)} trigger={<Text>@ada</Text>}>
  <Profile id="ada" />
</HoverCard>
```

<a id="entrance-and-exit"></a>

## الدخول والخروج

تأتي بطاقة التمرير وتذهب مع انتقالاتك (transitions)، كما يفعل [Popover](./popover.md). `popupStartingClass` هو مظهر النافذة المنبثقة في إطارها الأول، وتنقلها فئات `transition-*` في `popupClass` إلى مظهرها الخاص. أما `popupEndingClass` فهو مظهرها عند الإغلاق: تبقى البطاقة دون أن تستقبل المؤشر أثناء تشغيل تلك الانتقالات، ثم تزول، ويتبعها `onClose`. وإذا استقر المؤشر على المشغّل من جديد أثناء زوالها عادت. وعندما يطلب المستخدم تقليل الحركة، تظهر البطاقة وتزول فورًا.

```tsx
<HoverCard
  popupClass="rounded-xl bg-popover p-4 shadow-lg transition-all duration-150 ease-out"
  popupStartingClass="opacity-0 scale-95"
  popupEndingClass="opacity-0 scale-95"
  trigger={<Text>@ada</Text>}
>
  <Profile id="ada" />
</HoverCard>
```

تظهر أسفل المشغّل افتراضيًا (`placement`، `align`)، وعلى الجانب الآخر إذا لم تتوفر مساحة، وتبقى داخل المنطقة الآمنة. ويخبرك `onPosition({ placement, bounds, available })` بالمكان الذي ذهبت إليه.

<a id="props"></a>

## الخصائص

| الخاصية | Rust | النوع | الافتراضي | الوصف |
|---|---|---|---|---|
| `open` | `.open(..)` | `boolean` | لا شيء | مفتوحة، ويتحكم بها التطبيق. |
| `defaultOpen` | `.default_open(..)` | `boolean` | `false` | مفتوحة في البداية، بدون `open`. |
| `openDelay` | `.open_delay(..)` | `number` | `600` | المللي ثواني التي يستقر فيها المؤشر على المشغّل، أو يبقى التركيز عليه، قبل أن تُفتح البطاقة؛ `Infinity`: لا تُفتح من تلقاء نفسها أبدًا. |
| `closeDelay` | `.close_delay(..)` | `number` | `300` | المللي ثواني التي يبتعد فيها المؤشر عن المشغّل والبطاقة، مع خروج التركيز منهما، قبل أن تُغلق؛ `Infinity`: لا تُغلق من تلقاء نفسها أبدًا. |
| `placement` | `.placement(..)` | `"top" \| "bottom" \| "left" \| "right"` | `"bottom"` | جانب المشغّل الذي تظهر عليه. |
| `align` | `.align(..)` | `"start" \| "center" \| "end"` | `"center"` | كيفية محاذاتها للمشغّل على طول ذلك الجانب. |
| `offset` | `.offset(..)` | `number` | `0` | الفجوة بين المشغّل والبطاقة. |
| `margin` | `.margin(..)` | `number` | `0` | المسافة التي تحافظ عليها من حواف المنطقة الآمنة. |
| `popupClass`، `popupStyle` | `.popup_class(..)`، `.popup_style(..)` | `string`، `StyleProp<ViewStyle>` | لا شيء | مظهر النافذة المنبثقة، أي البطاقة التي يوجد المحتوى داخلها. |
| `popupStartingClass`، `popupStartingStyle` | `.popup_starting_class(..)`، `.popup_starting_style(..)` | `string`، `StyleProp<ViewStyle>` | لا شيء | مظهر النافذة المنبثقة في إطارها الأول، فوق مظهرها الخاص: تبدأ انتقالاتها منه. |
| `popupEndingClass`، `popupEndingStyle` | `.popup_ending_class(..)`، `.popup_ending_style(..)` | `string`، `StyleProp<ViewStyle>` | لا شيء | مظهر النافذة المنبثقة عند الإغلاق، فوق مظهرها الخاص: يبقى أثناء تشغيل انتقالاتها. |
| `trigger` | `.trigger(..)` | `JSX.Element` | لا شيء | ما تعرض معاينته؛ وتوضع البطاقة بالنسبة إليه. |
| `children` | `.child(..)` | `JSX.Element` | لا شيء | المحتوى، ويُنشأ في كل مرة تُفتح فيها البطاقة. |

<a id="events"></a>

## الأحداث

| الحدث | Rust | الوصف |
|---|---|---|
| `onOpenChange` | `.on_open_change(\|e\| ..)` | يطلب الفتح أو الإغلاق مع السبب: `"hover"` أو `"focus"` أو `"triggerPress"` أو `"pressOutside"` أو `"cancel"`. |
| `onOpen` | `.on_open(\|\| ..)` | عُرضت البطاقة. |
| `onClose` | `.on_close(\|\| ..)` | زالت البطاقة بعد خروجها؛ ويحدث ذلك أيضًا عندما أغلقها التطبيق. |
| `onPosition` | `.on_position(\|e\| ..)` | وُضعت النافذة المنبثقة: `placement` (الجانب الذي ظهرت عليه)، `bounds` (إطارها)، `available` (المساحة المتوفرة على ذلك الجانب). |

<a id="accessibility"></a>

## إمكانية الوصول

تضيف بطاقة التمرير إلى مشغّلها دون أن تغيّره: يحتفظ المشغّل بدوره وتسميته، ويبقى ما يفتحه أو يفعله عند الضغط عليه كما هو. يحصل مستخدمو لوحة المفاتيح على البطاقة عندما يستقر التركيز على المشغّل، ويغلقها Escape. لا تأخذ البطاقة تركيزًا لنفسها، فيواصل Tab الانتقال من المشغّل كما كان. وتأخذ الروابط والأزرار داخل البطاقة التركيز كما في أي مكان آخر، وتبقى البطاقة مفتوحة ما دام أحدها يملكه؛ وينبغي أن يكون كل ما هو مهم في البطاقة متاحًا أيضًا من الصفحة التي يقود إليها المشغّل.
