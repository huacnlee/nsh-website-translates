---
title: "Overlay"
description: "عنصر Overlay: محتوى يُعرض أعلى الشاشة بغضّ النظر عمّا يقصّ عنصره الأب، ويمكن تخطيطه كصندوق ثابت أو وضعه مقابل عنصر مرجعي (anchor) يتبعه، مع الإبلاغ عن الضغطات خارجه وعن ضغطة Escape."
order: 100
group: primitives
demo: el-overlay
source_hash: 7e13ccf223d62c09
---

# Overlay

يعرض Overlay عناصره الفرعية فوق كل شيء في العرض الجذري (root view) الموجود فيه: النافذة، أو مربع الحوار المحيط به.
لا يقصّه حجم العنصر الأب ولا `overflow: hidden` ولا عروض التمرير. ويبقى في موضعه الذي كتبته فيه بالنسبة لكل شيء
آخر: فهو يقرأ السياق المحيط به، ومعالجاته (handlers) تابعة لمكوّنه، ويزول بزوال عنصره الأب. تُبنى عليه النوافذ المنبثقة
والقوائم وتلميحات الأدوات والصفائح (Popovers وMenus وTooltips وSheets)؛ ويوفّرها [`nsh/base`](../modules/nsh-base.md) جاهزة
([Popover](./popover.md) و[Menu](./menu.md) و[Tooltip](./tooltip.md) و[Sheet](./sheet.md))، أما Overlay فهو ما
تستخدمه لبناء مكوّناتك الخاصة.

```rust tabs
use nsh_core::prelude::*;

fn more_button() -> impl IntoElement {
    let open = signal(false);
    let anchor = element_ref();
    view()
        .child(
            view()
                .element_ref(&anchor)
                .on_press(move || open.update(|o| *o = !*o))
                .px_3()
                .py_2()
                .child(text("More")),
        )
        .child(when(move || open.get(), move || {
            overlay()
                .anchor(&anchor)
                .placement(Placement::Bottom)
                .align(Align::Start)
                .offset(px(6.0))
                .margin(px(8.0))
                .on_press_outside(move |_: &Point<Points>| open.set(false))
                .on_cancel(move || open.set(false))
                .rounded_lg()
                .bg(white())
                .p_3()
                .shadow_lg()
                .child(text("Shown above everything"))
        }))
}
```

```tsx tabs
import { Overlay, signal, Text, View, type ViewRef } from "nsh";

function MoreButton() {
  const open = signal(false);
  let anchor: ViewRef | undefined;
  return (
    <View>
      <View ref={anchor} onPress={() => open.set(!open())} class="px-3 py-2">
        <Text>More</Text>
      </View>
      <If when={open()}>
        <Overlay
          anchor={anchor}
          placement="bottom"
          align="start"
          offset={6}
          margin={8}
          onPressOutside={() => open.set(false)}
          onCancel={() => open.set(false)}
          class="rounded-lg bg-white p-3 shadow-lg"
        >
          <Text>Shown above everything</Text>
        </Overlay>
      </If>
    </View>
  );
}
```

يأتي `Overlay` من `nsh` في TSX، و`overlay()` من `nsh_core::prelude` في Rust. يظهر ما دام موجودًا في
العرض: ضعه داخل `If` (في Rust: `when(..)`) لفتحه وإغلاقه. تظهر عناصر Overlay التي تُعرض لاحقًا فوق التي قبلها، وأي
Overlay داخل آخر يظهر فوقه.

<a id="placement"></a>

## التموضع

بدون `anchor`، يُوضع Overlay كصندوق `position: fixed` في العرض الجذري: فقيم `top` و`left` و`inset`
والحجم والهوامش تُحسب بالنسبة إلى النافذة بأكملها (أو مربع الحوار). `class="inset-0"` يغطيها، وهذا يناسب الخلفية الداكنة أو
الطبقة التي تملأ النافذة كلها؛ أما `class="bottom-0 left-0 right-0"` فهو شريط على امتداد الأسفل.

مع `anchor`، يضعه NSH بجوار نقطة الارتكاز (anchor):

- `anchor` هو عرض (`ref`)، أو `Point` (`{ x, y }`) بإحداثيات العرض الجذري، أو `pageX` / `pageY` للمسة
  (قائمة تظهر حيث يكون المؤشر)، أو `Bounds` (`{ origin, size }`) فيه: مثل مؤشر الإدخال في حقل نصي (`pageBounds` الخاص بـ `onCaretMove`)، حيث تُفتح اقتراحات
  لما تتم كتابته.
- `placement` هو الجانب الذي يوضع عليه: `"top"` أو `"bottom"` (الافتراضي) أو `"left"` أو `"right"`. وإذا لم يتسع
  له ذلك الجانب واتسع له الجانب المقابل، ذهب إليه؛ وإذا لم يتسع له أي منهما، وُضع على الجانب الأكثر اتساعًا.
- `align` يحاذيه على امتداد ذلك الجانب: `"start"` أو `"center"` (الافتراضي) أو `"end"`. فوق نقطة الارتكاز وتحتها،
  يتبع start وend اتجاه التخطيط: start هو الحافة اليسرى، أو الحافة اليمنى في التخطيط من اليمين إلى اليسار.
- `offset` هو الفجوة بين نقطة الارتكاز وOverlay؛ و`margin` هي المسافة التي يحافظ عليها من حواف
  المنطقة الآمنة (safe area) التي يبقى داخلها: فينزلق على امتداد جانبه ليتسع له المكان.

يتبع Overlay المرتكز نقطةَ ارتكازه: فعندما تتمرر نقطة الارتكاز أو تتحرك أو يتغير حجمها، يتحرك Overlay معها في
الإطار نفسه الذي يضع فيه NSH التخطيط. ويخبرك `onPosition` أين استقر، فيمكن لسهم أن يشير إلى نقطة الارتكاز، أو لقائمة طويلة أن
تحدّ من ارتفاعها:

```tsx
<Overlay
  anchor={anchor}
  onPosition={(e) => {
    side.set(e.placement); // "top" when it flipped
    maxHeight.set(e.available.height);
  }}
/>
```

<a id="dismissing"></a>

## الإغلاق

يبلّغ Overlay بما يغلق النوافذ المنبثقة عادةً، ويترك القرار لك:

- `onPressOutside` يُطلق عندما ينزل إصبع أو زر الفأرة خارج Overlay ونقطة ارتكازه وعناصر Overlay
  الموجودة داخله. ويستمر الضغط إلى ما تحته.
- `onCancel` يُطلق عند الضغط على Escape، أو زر الرجوع في Android، أو إيماءة الهروب في VoiceOver على iOS، وذلك لأعلى Overlay يستمع إليه فقط. ويستقبلها
  قبل الصفحات و`BackHandler`.

لحجب الشاشة خلف نافذة منبثقة، ضع Overlay ثانيًا تحتها مع `class="inset-0"` و`onPress` يغلق
كليهما: هكذا يعمل [Sheet](./sheet.md) وعرض [Popover](./popover.md) على الهاتف.

<a id="props"></a>

## الخصائص

| الخاصية | Rust | النوع | القيمة الافتراضية | الوصف |
|---|---|---|---|---|
| `anchor` | `.anchor(&element_ref)`, `.anchor_point(point)`, `.anchor_bounds(bounds)` | `ViewRef \| Point \| Bounds \| null` | لا شيء | العرض أو النقطة أو الصندوق الذي يوضع بالنسبة إليه. بدونه يكون صندوقًا ثابتًا في عرضه الجذري. |
| `placement` | `.placement(..)` | `"top" \| "bottom" \| "left" \| "right"` | `"bottom"` | الجانب من نقطة الارتكاز الذي يوضع عليه. |
| `align` | `.align(..)` | `"start" \| "center" \| "end"` | `"center"` | كيف يحاذي نقطة الارتكاز على امتداد ذلك الجانب. |
| `offset` | `.offset(px(..))` | `number` | `0` | الفجوة بين نقطة الارتكاز وOverlay. |
| `margin` | `.margin(px(..))` | `number` | `0` | المسافة التي يحافظ عليها من حواف المنطقة الآمنة. |
| `children` | `.child(..)` | `JSX.Element` | لا شيء | ما يعرضه. |
| `class`, `style` | style methods | `string`, `StyleProp<ViewStyle>` | لا شيء | مظهره، ومكانه عند عدم وجود نقطة ارتكاز. |

كما يقبل [الخصائص المشتركة](./index.md#common-props) للعروض.

<a id="events"></a>

## الأحداث

| الحدث | Rust | الوصف |
|---|---|---|
| `onPressOutside` | `.on_press_outside(\|point\| ..)` | حدث ضغط خارج Overlay ونقطة ارتكازه وعناصر Overlay الموجودة داخله (`pagePosition`، و`Point`). |
| `onCancel` | `.on_cancel(\|\| ..)` | Escape أو زر الرجوع في Android أو إيماءة الهروب في VoiceOver، عندما يكون أعلى Overlay مستمعًا. |
| `onPosition` | `.on_position(\|position\| ..)` | وضعه NSH: `placement` (الجانب الذي استقر عليه)، و`bounds` في العرض الجذري، و`available` (`Size`: المساحة المتاحة على ذلك الجانب). |

<a id="platform-notes"></a>

## ملاحظات المنصات

- تعرض كل منصة Overlay كعرض أصلي (native view) ضمن العرض الجذري للنافذة (أو مربع الحوار)، يُرسم ويُختبر لمس الضغط عليه
  كما تُرسم العروض المحيطة به: UIKit وعروض Android وAppKit وGTK وWin32 وGPUI وDOM.
- يظهر Overlay داخل [Dialog](./dialog.md) في ذلك الحوار، فوق محتواه.
- تبقى عناصر Overlay داخل نافذتها: فالقائمة التي كانت ستتجاوز حافة النافذة تنزلق عائدةً إلى داخلها.
