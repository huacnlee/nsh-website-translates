---
title: "تحديد النص"
description: "طرق العرض القابلة للتحديد: تحديد واحد عبر النصوص داخل طريقة العرض، وعبر طرق العرض، وعناصر Text وعناصر TextView، كما تُحدَّد نصوص صفحة الويب."
order: 130
group: primitives
demo: el-text-selection
source_hash: d63cc3aa84e5eab5
---

# تحديد النص

يجعل [`View`](./view.md) مع `selectable` النصوص الموجودة بداخله تُحدَّد معًا، كما في صفحات الويب: يمتد تحديد واحد من موضع في نص إلى موضع في نص آخر، عبر العروض (views) وعناصر [`Text`](./text.md) وعناصر [`TextView`](./text-view.md)، بترتيب القراءة. اجعل سجل محادثة قابلًا للتحديد، فيمكن أن يبدأ التحديد في رسالة وينتهي في التالية؛ ويضع النسخ (Copy) النص المحدد في الحافظة، مع ربط النصوص المتجاورة جنبًا إلى جنب بمسافة جدولة (tab) وربط البقية بفاصل أسطر. يُضبط ذلك في Rust باستخدام `view().selectable(true)`، وفي TSX باستخدام `<View selectable>`؛ أما إمكانية تحديد نص منفرد فيحددها النمط `userSelect`.

```rust tabs
use nsh_base::text_view;
use nsh_core::prelude::*;

fn release_notes(notes: &'static str) -> impl IntoElement {
    view()
        .selectable(true)
        .gap_3()
        .p_4()
        .child(text("Release notes").font_weight(FontWeight::SEMIBOLD))
        .child(text_view().markdown(notes))
        .child(
            view()
                .flex_row()
                .gap_2()
                .child(text("Updated").select_none().text_color(rgb(0x737373)))
                .child(text("October 21")),
        )
}
```

```tsx tabs
import { Text, View } from "nsh";
import { TextView } from "nsh/base";

function ReleaseNotes(props: { notes: string }) {
  return (
    <View selectable class="gap-3 p-4">
      <Text class="font-semibold">Release notes</Text>
      <TextView markdown={props.notes} />
      <View class="flex-row gap-2">
        <Text style={{ userSelect: "none" }} class="text-neutral-500">Updated</Text>
        <Text>October 21</Text>
      </View>
    </View>
  );
}
```

تخطيط العرض ومظهره يعودان إلى أنماط التطبيق، ومحتواه هو عناصره الفرعية. أما التحديد نفسه فيعود إلى المنصة: لا يرسم العرض شيئًا خاصًا به من أجله.

<a id="a-chat-transcript"></a>

## سجل محادثة

يُحدَّد سجل المحادثة داخل عرض واحد قابل للتحديد كأنه صفحة واحدة: يبدأ السحب في رد وينتهي في رد آخر، وينسخ Copy نص كل رسالة بينهما.

```rust tabs
use nsh_base::text_view;
use nsh_core::prelude::*;

fn transcript(replies: Signal<Vec<SharedString>>) -> impl IntoElement {
    scroll().flex_1().child(
        view().selectable(true).p_4().gap_4().child(each(
            replies,
            |reply: &SharedString| reply.clone(),
            |reply, _index| text_view().markdown(move || reply.get()),
        )),
    )
}
```

```tsx tabs
import { Scroll, View } from "nsh";
import { TextView } from "nsh/base";

<Scroll class="flex-1">
  <View selectable class="gap-4 p-4">
    <Each of={replies}>{(reply) => <TextView markdown={reply()} />}</Each>
  </View>
</Scroll>
```

<a id="how-a-selection-is-made"></a>

## كيف يتم التحديد

| المنصة | كيف يتم التحديد |
|---|---|
| macOS, Windows, Linux, GPUI | اسحب عبر النصوص؛ النقر المزدوج يحدد كلمة، والنقر الثلاثي يحدد فقرة، والسحب بعدهما يستمر كلمةً كلمة أو فقرةً فقرة. Shift+click يمدد التحديد. Ctrl / Cmd+A يحدد كل شيء في العرض، وCtrl / Cmd+C ينسخ، وEscape أو الضغط خارج العرض يلغي التحديد. |
| iOS, Android | الضغط المطوّل يحدد كلمة؛ وتمدده مقابض المنصة، وتتضمن قائمة التحرير فيها Copy وSelect All. |
| Web | تحديد المتصفح نفسه، بإيماءاته وقائمته واختصاراته. |

<a id="what-it-selects"></a>

## ما الذي يحدده

- **النصوص المستبعدة**: النص الذي يحمل `userSelect: "none"` (`.select_none()` في Rust، والفئة `select-none`؛ مثل التسمية (label) أو عنوان الزر) يتجاوزه التحديد وإيماءاته.
- **العروض المتداخلة**: العرض القابل للتحديد داخل عرض آخر يُعد جزءًا من العرض الخارجي، فيشملهما تحديد واحد.
- **TextView**: يُحدَّد [`TextView`](./text-view.md) مع `selectable` كوحدة مستقلة: تُحدَّد فقراته وعناصر قوائمه وخلاياه وكتل الشيفرة فيه معًا. وداخل عرض قابل للتحديد ينضم إلى التحديد الخارجي.
- **النصوص المنفردة**: النص الذي يحمل `userSelect: "text"` وليس داخل أي عرض قابل للتحديد يُحدَّد وحده، كما يصف [Text](./text.md#props).
- **المظهر** هو تمييز المنصة في `selectionColor` الخاص بكل نص (`selection:text-*`).
- **القوائم**: في [List](./list.md) الافتراضية (virtualized)، يشمل التحديد الصفوف المركّبة (mounted)؛ أما الصفوف التي أُعيد تدويرها وخرجت من مجال الرؤية فتغادره.

<a id="related"></a>

## ذات صلة

- [View](./view.md): الخاصية `selectable`.
- [Text](./text.md): `userSelect` و`selectionColor` وتحديد نص منفرد.
- [TextView](./text-view.md): مستندات تُحدَّد كتلها كوحدة واحدة.
