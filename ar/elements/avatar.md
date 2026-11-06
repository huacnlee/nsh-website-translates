---
title: "Avatar"
description: "مكوّنا Avatar وAvatarGroup: صورة الشخص، أو بديل عنها أثناء تحميلها، أو عند فشل تحميلها، أو عند عدم وجود صورة، مع تنفيذ حالة التحميل أصلياً؛ وصف من الصور الرمزية يعرض الأولى منها ويختصر الباقي."
group: base
demo: el-avatar
source_hash: 3ec5a888836ebb12
---

# الصورة الرمزية (Avatar)

تعرض الصورة الرمزية (Avatar) صورة شخص: عضو في فريق، أو كاتب تعليق، أو الحساب في الترويسة. إلى أن تُحمَّل الصورة، وعند فشل تحميلها، وعند عدم وجود صورة، تعرض بديلاً (fallback): الأحرف الأولى من `name` الشخص، أو محتوى التطبيق نفسه (أيقونة). وهي تتولى حالة تحميل الصورة، وتُدار أصلياً (natively) انطلاقاً من حدثي التحميل والخطأ الخاصين بالصورة دون أي JavaScript، كما تتولى ما تقرؤه قارئات الشاشة: صورة موسومة باسم الشخص. أما المظهر فهو من شأن التطبيق: فـ `Avatar` ليس له حجم أو شكل أو ألوان أو خط خاص به. ويعرض `AvatarGroup` الصور الرمزية الأولى من صف، مع عنصر فائض يمثل البقية ("+5").

```rust tabs
use nsh_base::{avatar, theme};
use nsh_core::prelude::*;

fn author(name: &'static str, picture: &'static str) -> impl IntoElement {
    avatar()
        .src(picture)
        .name(name)
        .size(px(40.0))
        .image_style(|s| s.rounded_full())
        .fallback_style(|s| {
            s.rounded_full()
                .items_center()
                .justify_center()
                .bg(move || theme().muted)
                .text_color(move || theme().muted_foreground)
                .text_sm()
        })
}
```

```tsx tabs
import { mount } from "nsh";
import { Avatar } from "nsh/base";

function App() {
  return (
    <Avatar
      src="https://example.com/ada.png"
      name="Ada Lovelace"
      class="size-10"
      imageClass="rounded-full"
      fallbackClass="items-center justify-center rounded-full bg-muted text-sm text-muted-foreground"
    />
  );
}

mount(App);
```

يأتي `Avatar` و`AvatarGroup` من [`nsh/base`](../modules/nsh-base.md)، وهي الحزمة (crate) `nsh-base` في Rust. في Rust، يُنشئهما `avatar()` و`avatar_group()` بدالة ضبط (setter) لكل خاصية (`.src(..)`، `.fallback_delay(..)`)، مع دوال الأنماط المكتوبة للصورة الرمزية نفسها و`.child(..)` لما يوضع فوق الصورة.

<a id="props"></a>

## الخصائص (Props)

| الخاصية | Rust | النوع | القيمة الافتراضية | الوصف |
|---|---|---|---|---|
| `src` | `.src(..)` | `string \| ImageAsset` | لا شيء | الصورة، بالصيغة التي يقبلها `src` في [`<Image>`](./image.md): عنوان URL، أو URI من نوع `asset:/` أو `data:`، أو عنوان URL من نوع `blob:` (صورة اختارها المستخدم: `URL.createObjectURL(file)`)، أو صورة مستوردة. تظهر بعد تحميلها؛ والسلسلة الفارغة تعني عدم وجود صورة. |
| `name` | `.name(..)` | `string` | لا شيء | اسم الشخص: ما تنطق به قارئات الشاشة، والأحرف الأولى التي يعرضها البديل عندما لا يمرر التطبيق `fallback`. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | `name` | ما تنطق به قارئات الشاشة، ويتقدم على `name`. يجعل `""` الصورة الرمزية زخرفية، مخفية عن قارئات الشاشة. |
| `fallbackDelay` | `.fallback_delay(..)` | `number` (ms) | `0` | المدة التي ينتظرها البديل أثناء تحميل الصورة، حتى تظهر الصورة سريعة التحميل دون أن يومض البديل أولاً. `Infinity`: لا بديل أثناء التحميل، بل فقط عند الفشل أو عدم وجود الصورة. |
| `imageClass`، `imageStyle` | `.image_style(\|s\| ..)` | `string`، `StyleProp<ViewStyle>` | لا شيء | الصورة: ملاءمتها (fit) ونصف قطرها (radius) وحركتها. |
| `fallbackClass`، `fallbackStyle` | `.fallback_style(\|s\| ..)` | `string`، `StyleProp<ViewStyle>` | لا شيء | البديل: خلفيته ولون نصه وحجمه، وكيفية محاذاة محتواه. |
| `fallback` | `.fallback(..)` | `JSX.Element` | الأحرف الأولى | محتوى البديل بدلاً من الأحرف الأولى: أيقونة، أو عنصر نائب لشخص بلا اسم. |
| `children` | `.child(..)` | `JSX.Element` | لا شيء | ما يظهر فوق الصورة: نقطة الحضور، أو شارة. تسمع قارئات الشاشة وسم الصورة الرمزية لا هذه العناصر (انظر [إمكانية الوصول](#accessibility)). |
| `class`، `style` | دوال الأنماط | `string`، `StyleProp<ViewStyle>` | لا شيء | الصورة الرمزية نفسها: حجمها وشكلها. |

| الحدث | Rust | الحمولة (Payload) | الوصف |
|---|---|---|---|
| `onStatusChange` | `.on_status_change(..)` | `{ status: AvatarStatus }` | تغيرت حالة الصورة: `"idle"` (بلا `src`)، أو `"loading"`، أو `"loaded"`، أو `"error"`. |

<a id="parts"></a>

## الأجزاء

| الجزء | موضعه | يُنسَّق باستخدام |
|---|---|---|
| الصورة الرمزية | | `class`، `style` |
| البديل | داخل الصورة الرمزية، أولاً، وبحجمها كاملاً؛ يوجد أثناء تحميل الصورة (بعد `fallbackDelay`)، أو عند فشلها، أو عند عدم وجودها | `fallbackClass`، `fallbackStyle`؛ ومحتواه الأحرف الأولى أو `fallback` |
| الصورة | داخل الصورة الرمزية، فوق البديل، وتملؤه | `imageClass`، `imageStyle` |
| محتوى التطبيق | داخل الصورة الرمزية، أخيراً | عناصره الخاصة (`children`) |

حدد للصورة الرمزية حجمها (`class="size-10"`): فيملؤه البديل والصورة، فلا يُعاد أي تخطيط عند زوال البديل. تُخطَّط الصورة منذ البداية وهي شفافة، ثم تصبح معتمة بمجرد تحميلها؛ ثم يزول البديل. ويؤدي `transition-opacity` في `imageClass` إلى ظهورها تدريجياً (وعند تفعيل تقليل الحركة تظهر فوراً). دوِّر زوايا الصورة والبديل (`rounded-full` على كل منهما) بدلاً من قص الصورة الرمزية، حتى تبقى نقطة الحضور الموضوعة عند حافتها (`absolute bottom-0 right-0`) كاملة.

الأحرف الأولى هي أول حرف من أول كلمتين في الاسم، بحروف كبيرة ("Ada Lovelace" تصبح "AL")؛ والكلمة الواحدة تعطي أول حرفين منها ("huacnlee" تصبح "HU")، أما الاسم المكتوب بنظام كتابة لا يميز بين الأحرف الكبيرة والصغيرة فيعطي أول حرف منه ("王小明" تصبح "王").

<a id="groups"></a>

## المجموعات

```tsx
import { Text } from "nsh";
import { Avatar, AvatarGroup } from "nsh/base";

<AvatarGroup
  limit={3}
  total={members.length}
  accessibilityLabel={`${members.length} members`}
  class="flex-row"
  overflowClass="-ml-2 size-8 items-center justify-center rounded-full bg-muted ring-2 ring-background"
  overflowAccessibilityLabel={`${members.length - 3} more people`}
  overflow={<Text class="text-xs">{`+${members.length - 3}`}</Text>}
>
  <Each of={members.slice(0, 3)} key={(m) => m.id}>
    {(m, i) => <Avatar src={m().picture} name={m().name} class={i() > 0 ? "-ml-2 size-8" : "size-8"} />}
  </Each>
</AvatarGroup>
```

| الخاصية | Rust | النوع | القيمة الافتراضية | الوصف |
|---|---|---|---|---|
| `limit` | `.limit(..)` | `number` | `3` | يظهر منها هذا العدد على الأكثر، وهي الصور الرمزية الأولى؛ أما البقية فلا تُنشأ لها عناصر عرض. |
| `total` | `.total(..)` | `number` | عدد العناصر الفرعية | عدد الأشخاص الذين تمثلهم المجموعة، عندما يمرر التطبيق الأوائل منهم فقط. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | لا شيء | ما تنطق به قارئات الشاشة عن المجموعة. |
| `overflowClass`، `overflowStyle` | `.overflow_style(\|s\| ..)` | `string`، `StyleProp<ViewStyle>` | لا شيء | جزء الفائض، بعد الصور الرمزية المعروضة. |
| `overflow` | `.overflow(..)` | `JSX.Element` | لا شيء | ما يمثل الأشخاص غير المعروضين ("+5"، "⋯")، ويوجد ما دام في المجموعة أكثر من الصور الرمزية المعروضة. |
| `overflowAccessibilityLabel` | `.overflow_accessibility_label(..)` | `string` | لا شيء | ما تنطق به قارئات الشاشة عن الفائض بدلاً من محتواه: "5 أشخاص آخرين" بدلاً من "+5". |
| `children` | `.child(..)` | `JSX.Element` | لا شيء | الصور الرمزية، بالترتيب. |
| `class`، `style` | دوال الأنماط | `string`، `StyleProp<ViewStyle>` | لا شيء | الصف: اتجاهه (`flex-row`) وتباعده. |

التداخل والحلقات وشكل الفائض من شأن التطبيق: فهامش سالب على كل صورة رمزية بعد الأولى (`-ml-2`) يرصّها فوق بعضها، وحلقة بلون الخلفية تفصل بينها. وللقوائم الطويلة، مرر أول `limit` من الأشخاص مع `total`: فلا تُنشأ إلا الصور الرمزية المعروضة. والعدد الذي يمثله الفائض هو `total` ناقص الصور الرمزية المعروضة، وهي الأقل بين عدد العناصر الفرعية و`limit`: فـ `total={8}` مع عنصرين فرعيين يعرض صورتين رمزيتين و"+6".

<a id="accessibility"></a>

## إمكانية الوصول

- الصورة الرمزية صورة واحدة بالنسبة إلى قارئات الشاشة، موسومة بـ `accessibilityLabel` أو `name`: فيُنطق الاسم مرة واحدة. أما البديل والصورة فمخفيان عنها، فلا تُقرأ الأحرف الأولى منفصلة. والصورة الرمزية التي ليس لها أي منهما، أو التي لها `accessibilityLabel=""`، زخرفية: مخفية عن قارئات الشاشة، كما ينبغي أن تكون الصورة الرمزية الموضوعة بجوار الاسم الذي تعرضه.
- المجموعة مجموعة (group)، موسومة بـ `accessibilityLabel` ("Ada وGrace و5 آخرون")؛ والصور الرمزية المعروضة صور داخلها. ويُقرأ الفائض بمحتواه ("+5")، أو بـ `overflowAccessibilityLabel` ("5 أشخاص آخرين") عندما يحدده التطبيق: فلا يكتب NSH أي كلمات من عنده.
- الصورة الرمزية عنصر واحد بالنسبة إلى قارئات الشاشة، فما تعرضه عناصرها الفرعية لا يُقرأ منفصلاً، وعلى iOS لا يمكن الوصول إطلاقاً إلى زر أو رابط بينها. اذكر معنى نقطة الحضور أو الشارة في `accessibilityLabel` ("Ada Lovelace، متصل")، وضع ما يمكن الضغط عليه بجوار الصورة الرمزية لا داخلها.
- لا تستقبل أي منهما الضغطات ولا تركيز لوحة المفاتيح: ضع الصورة الرمزية داخل `Button` لتصبح عنصراً قابلاً للضغط.

انظر [إمكانية الوصول](../docs/accessibility.md) للاطلاع على الوسوم والأدوار والإعلانات بوجه عام.

<a id="platform-notes"></a>

## ملاحظات حول المنصات

- تحمّل كل منصة الصورة بمحمّل الصور (image loader) والذاكرة المؤقتة الخاصين بها (انظر [Image](./image.md))؛ وتغيّر أحداث التحميل والخطأ فيها حالة الصورة الرمزية في Rust، فلا يغيّر تحميل الصورة أو فشلها سوى الصورة والبديل.
- يبدأ تحميل الصورة بمجرد أن يكون لها إطار (frame)، فتبقى مُخطَّطة وهي شفافة.
