---
title: "إمكانية الوصول"
description: "جعل التطبيقات تعمل مع VoiceOver وTalkBack - التسميات والأدوار والحالات والقيم والإجراءات المخصصة والتجميع والإخفاء والإعلانات والتركيز وحجم النص وتقليل الحركة."
order: 48
group: ui
source_hash: 0f504242ebec73ee
---

# إمكانية الوصول

يعرض NSH الواجهات باستخدام عناصر عرض أصلية، لذلك ترى تقنيات المساعدة في المنصات (VoiceOver على iOS وMac Catalyst، وTalkBack على Android، وSwitch Control، وVoice Control، ...) التسلسل الهرمي الحقيقي لعناصر العرض في تطبيقك. ما تضيفه أنت هو الأوصاف التي لا تستطيع هذه التقنيات استنتاجها: ما هو العنصر، وماذا يقول، وفي أي حالة هو، وماذا يستطيع أن يفعل. كل عنصر يقبل الدوال (Rust) والخصائص (TSX) التالية.

<a id="what-you-get-without-doing-anything"></a>

## ما تحصل عليه دون أي عمل

- **النص يُقرأ.** عنصر النص هو عنصر وصول تكون تسميته هي نصه. أما عنصر العرض الذي بلا تسمية فتُقرأ النصوص الموجودة بداخله.
- **عناصر العرض القابلة للضغط هي عناصر وصول.** عنصر العرض الذي له معالج ضغط أو ضغط مطوّل (`.on_press`، `onPress`) يكون عنصر وصول افتراضيًا، وتفعيله (نقرتان مع VoiceOver أو TalkBack) يضغطه.
- **حقول الإدخال هي حقول نصية**، مع النص البديل (placeholder) والقيمة ولوحة المفاتيح.
- **النص يتبع إعداد الحجم لدى المستخدم.** راجع [حجم النص](#text-size).

<a id="labels-hints-and-roles"></a>

## التسميات والتلميحات والأدوار

```rust tabs
view()
    .on_press(play)
    .role(AccessibilityRole::Button)
    .label("Play")
    .hint("Starts the song")
    .size(px(44.0))
    .items_center()
    .justify_center()
    .child(text("▶"))
```

```tsx tabs
<View
  onPress={play}
  role="button"
  accessibilityLabel="Play"
  accessibilityHint="Starts the song"
  style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}
>
  <Text>▶</Text>
</View>
```

| Rust | TSX | النوع | الوصف |
|---|---|---|---|
| `.accessible(..)` | `accessible` | `boolean` | يصبح عنصر العرض عنصرًا واحدًا لتقنيات المساعدة؛ ولا تُعرض عناصره الأبناء بشكل منفصل. |
| `.label(..)` | `accessibilityLabel` | `string` | ما يقرؤه قارئ الشاشة بدلًا من النصوص الموجودة بداخل العنصر. |
| `.hint(..)` | `accessibilityHint` | `string` | ما يفعله تفعيل العنصر، ويُقرأ بعد توقف قصير. |
| `.role(..)` | `role` | `AccessibilityRole` | ما هو العنصر. |
| `.accessibility_state(..)` | `accessibilityState` | `AccessibilityState` | حالته: معطّل، محدد، مفعّل، مشغول، موسّع، مضغوط، حالي. `selected` يطبّق أيضًا نمط التحديد، و`checked` نمط التفعيل عندما تكون القيمة true ونمط الحالة غير المحددة عندما تكون `"mixed"`، و`pressed` نمط الضغط عندما تكون القيمة true. |
| `.accessibility_level(..)` | `accessibilityLevel` | `number` | مستوى العنوان (1 هو الأعلى)، وعمق عنصر الشجرة (1 في الأعلى). |
| `.accessibility_value(..)` | `accessibilityValue` | `{ min?, max?, now?, text? }` | قيمة عنصر نطاقي أو نصي. |
| | `accessibilityActions` | `{ name, label? }[]` | الإجراءات المعروضة على تقنيات المساعدة. |
| `.on_accessibility_action(..)` | `onAccessibilityAction` | `(e: { actionName }) => void` | تم تنفيذ إجراء (في Rust: اسمه). |
| `.accessibility_elements_hidden(..)` | `accessibilityElementsHidden` | `boolean` | يخفي عنصر العرض وشجرته الفرعية عن تقنيات المساعدة. |
| | `importantForAccessibility` | `"auto" \| "yes" \| "no" \| "no-hide-descendants"` | هل عنصر العرض (وشجرته الفرعية) معروض لتقنيات المساعدة. |
| | `android={{ accessibilityLiveRegion }}` | `"none" \| "polite" \| "assertive"` | Android: كيف تُعلَن تغييرات عنصر العرض في TalkBack. |
| `.test_id(..)` | `testID` | `string` | معرّف لاختبارات واجهة المستخدم (accessibility identifier على iOS، وresource id على Android)؛ ولا يُقرأ بصوت عالٍ. |

أعطِ كل عنصر تحكم يحتوي على أيقونة فقط تسمية: فقارئ الشاشة لا يستطيع قراءة رمز أو صورة. اجعل التسميات قصيرة ولا تضمّنها الدور ("تشغيل"، وليس "زر تشغيل")، فالدور يُعلَن بشكل مستقل.

<a id="roles"></a>

### الأدوار

يخبر الدور (`.role(AccessibilityRole::Header)`، `role="header"`) المستخدم بنوع هذا العنصر وكيفية تشغيله. في Rust هو أحد متغيرات `AccessibilityRole` (`Button`، `Header`، `Switch`، ...)؛ وقيم TSX هي `"none"`، `"button"`، `"link"`، `"search"`، `"image"`، `"imagebutton"`، `"keyboardkey"`، `"text"`، `"adjustable"`، `"header"`، `"summary"`، `"alert"`، `"checkbox"`، `"combobox"`، `"menu"`، `"menubar"`، `"menuitem"`، `"progressbar"`، `"radio"`، `"radiogroup"`، `"scrollbar"`، `"spinbutton"`، `"switch"`، `"tab"`، `"tablist"`، `"timer"`، `"toolbar"`، `"list"`، `"grid"`، `"table"`، `"rowgroup"`، `"row"`، `"columnheader"` و`"cell"` (أدوار أجزاء [`Table`](../elements/table.md))، و`"listbox"` و`"option"` (قائمة خيارات للاختيار من بينها، مثل قائمة [`Select`](../elements/select.md)، وخياراتها، ويُعلَّم الخيار المختار بـ`accessibilityState.selected`)، و`"group"` (عناصر مترابطة تنتمي معًا)، و`"region"` (قسم يستحق الوصول إليه بمفرده، مثل لوحة الأكورديون)، و`"navigation"` (روابط تتنقل داخل التطبيق، مثل ترقيم الصفحات)، و`"tree"` و`"treeitem"` (عناصر تتوسع وتنطوي، كل منها عند `accessibilityLevel`)، و`"menuitemcheckbox"` و`"menuitemradio"` (عناصر قائمة قابلة للتفعيل، منفردة أو كخيار واحد ضمن مجموعة).

أكثرها فائدة:

- `"button"` لأي عنصر قابل للضغط وليس رابطًا؛ و`"link"` للتنقل إلى محتوى.
- `"header"` لعناوين الأقسام: يتنقل مستخدمو قارئ الشاشة بين العناوين لتصفح الشاشة سريعًا. `accessibilityLevel` يحدد مستواه (1 هو الأعلى) حيثما تقرؤه المنصة.
- `"button"` مع `accessibilityState.pressed` لزر تبديل، أي زر يبقى مفعّلًا أو معطّلًا (الخط العريض في شريط أدوات).
- `"navigation"` حول الروابط التي تتنقل بين الصفحات، ورابط الصفحة المعروضة مع `accessibilityState.current: "page"`.
- `"switch"`، `"checkbox"`، `"radio"` مع `accessibilityState.checked`.
- `"adjustable"` للمنزلقات وعناصر الزيادة والنقصان، مع `accessibilityValue` والإجراءين `increment` / `decrement`
  (كل مقبض في [`Slider`](../elements/slider.md) هو واحد منها).
- `"spinbutton"` لحقل يحمل رقمًا يستطيع المستخدم أيضًا زيادته أو إنقاصه، بنفس القيمة والإجراءات (حقل
  [`NumberInput`](../elements/number-input.md)).
- `"image"` للصور ذات المعنى، مع تسمية؛ أما الصور الزخرفية فيجب إخفاؤها بدلًا من ذلك.

```rust tabs
text("Settings")
    .role(AccessibilityRole::Header)
    .text_size(px(22.0))
    .font_weight(FontWeight::BOLD)
```

```tsx tabs
<Text role="header" style={{ fontSize: 22, fontWeight: "700" }}>Settings</Text>
```

<a id="states-and-values"></a>

### الحالات والقيم

لعنصر تحكم تشغيل / إيقاف في تطبيق، استخدم [`Switch`](../elements/switch.md) من `nsh/base`، فهو يضبط الدور والحالة بنفسه. يوضح المثال ما يفعله الدور والحالة على عنصر عرض.

```rust tabs
use nsh_core::{Checked, prelude::*};

// A toggle drawn with views.
view()
    .on_press(move || on.update(|v| *v = !*v))
    .role(AccessibilityRole::Switch)
    .label("Wi-Fi")
    .accessibility_state(move || AccessibilityState {
        checked: Some(if on.get() { Checked::True } else { Checked::False }),
        ..AccessibilityState::default()
    })
    .hit_slop(EdgeInsets::all(px(8.0)))
    .w(px(51.0))
    .h(px(31.0))
    .rounded_full()
    .p(px(2.0))
    .bg(move || if on.get() { rgb(0x22c55e) } else { rgb(0xd4d4d8) })
    .child(
        view()
            .size(px(27.0))
            .rounded_full()
            .bg(white())
            .style_with(move |s| s.translate_x(px(if on.get() { 20.0 } else { 0.0 }))),
    )
```

```tsx tabs
// A toggle drawn with views.
<View
  onPress={() => on.set(!on())}
  role="switch"
  accessibilityLabel="Wi-Fi"
  accessibilityState={{ checked: on() }}
  hitSlop={8}
  class="h-[31px] w-[51px] rounded-full p-0.5 transition-colors"
  classList={{ "bg-green-500": on(), "bg-zinc-300": !on() }}
>
  <View class="size-[27px] rounded-full bg-white transition-transform" classList={{ "translate-x-5": on() }} />
</View>
```

الحالة هي `AccessibilityState { disabled, selected, checked: Option<Checked>, busy, expanded, pressed: Option<Checked>, current: Option<AccessibilityCurrent> }` في Rust و`{ disabled?, selected?, checked?: boolean | "mixed", busy?, expanded?, pressed?: boolean | "mixed", current?: boolean | "page" | "step" | "location" | "date" | "time" }` في TSX. `pressed` يجعل الزر زر تبديل (`aria-pressed` في ARIA)؛ و`current` يعلّم العنصر الحالي في مجموعة (`aria-current` في ARIA): صفحة في ترقيم الصفحات، أو خطوة في معالج. `disabled` يُفترض أيضًا عند تعطيل عنصر العرض (`.disabled(..)`، `disabled`). `accessibilityValue` مع `min` و`max` و`now` يُقرأ كنسبة مئوية؛ ومع `text` يُقرأ كما هو ("3 من 10"، "متوسط").

<a id="actions"></a>

## الإجراءات

عنصر العرض القابل للضغط يدعم التفعيل أصلًا. أما لأي شيء آخر، فاعلن الإجراءات باستخدام `accessibilityActions` وعالجها باستخدام `onAccessibilityAction`؛ ويسمع مكوّن Rust اسم الإجراء المنفَّذ عبر `.on_accessibility_action(|name: &str| ..)`:

```tsx
function Quantity() {
  const n = signal(1);
  return (
    <View
      accessible
      role="adjustable"
      accessibilityLabel="Quantity"
      accessibilityValue={{ text: String(n()) }}
      accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
      onAccessibilityAction={(e) => {
        if (e.actionName === "increment") n.update((v) => v + 1);
        if (e.actionName === "decrement") n.update((v) => Math.max(0, v - 1));
      }}
      style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
    >
      <View onPress={() => n.update((v) => Math.max(0, v - 1))}><Text>−</Text></View>
      <Text>{n()}</Text>
      <View onPress={() => n.update((v) => v + 1)}><Text>+</Text></View>
    </View>
  );
}
```

بعض أسماء الإجراءات قياسية وتقابل إيماءات المنصات نفسها:

| الاسم | iOS (VoiceOver) | Android (TalkBack) |
|---|---|---|
| `activate` | نقرتان | نقرتان (نقر) |
| `increment`، `decrement` | تمرير للأعلى / للأسفل، ثم يقرأ VoiceOver القيمة الجديدة | تمرير للأمام / للخلف |
| `longpress` | | نقرتان مع الاستمرار |
| `expand`، `collapse` | | توسيع / طي |
| `magicTap` | نقرتان بإصبعين | |
| `escape` | حركة Z بإصبعين | |

العنصر الذي له `increment` أو `decrement` قابل للضبط مهما كان دوره: يحتفظ المخطط البياني بدوره `"image"` ويتنقل بين نقاطه بتمريرات VoiceOver وتمريرات TalkBack، ويُقرأ `accessibilityValue` بعد كل خطوة.

أي اسم آخر يصبح إجراءً مخصصًا، يُعرض في مُدوّر الإجراءات في VoiceOver وقائمة الإجراءات في TalkBack مع `label` (أو باسمه). الإجراءات المخصصة هي الصيغة الميسّرة للتمرير للحذف وما شابهه من الإيماءات:

```tsx
<View
  accessibilityActions={[{ name: "archive", label: "Archive" }, { name: "delete", label: "Delete" }]}
  onAccessibilityAction={(e) => (e.actionName === "archive" ? archive(mail.id) : remove(mail.id))}
>
  …
</View>
```

<a id="grouping-and-hiding"></a>

## التجميع والإخفاء

جعل عنصر العرض قابلًا للوصول (`.accessible(true)`، `accessible`) يجعله عنصرًا واحدًا: فالبطاقة التي تضم عنوانًا وعنوانًا فرعيًا وسعرًا تُقرأ دفعة واحدة، بدلًا من أن يمرر المستخدم عبر ثلاثة نصوص.

```rust tabs
view()
    .accessible(true)
    .on_press(open)
    .role(AccessibilityRole::Button)
    .p(px(16.0))
    .child(text("Blue jacket"))
    .child(text("Size M"))
    .child(text("$120"))
```

```tsx tabs
<View accessible onPress={open} role="button" style={{ padding: 16 }}>
  <Text>Blue jacket</Text>
  <Text>Size M</Text>
  <Text>$120</Text>
</View>
```

أخفِ ما لا يضيف شيئًا: الصور الزخرفية، والفواصل، وأيقونة بجانب نص يقول الشيء نفسه.

```tsx
<Image src={decoration} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
```

`accessibilityElementsHidden` (اسم iOS) و`importantForAccessibility="no-hide-descendants"` (اسم Android) كلاهما يخفي الشجرة الفرعية على المنصتين؛ وضبطهما معًا لا ضرر فيه.

<a id="the-screen-reader-and-the-users-settings"></a>

## قارئ الشاشة وإعدادات المستخدم

في Rust، تعرض المقدمة (prelude) إعدادات المستخدم وتتحدث إلى قارئ الشاشة: `screen_reader()` و`reduce_motion()` تفاعليان، و`announce_for_accessibility(message)` يجعل قارئ الشاشة يقرأ رسالة، و`element_ref()` الخاص بالعنصر ينقل تركيز قارئ الشاشة إليه باستخدام `set_accessibility_focus()`. في TSX، تعرض واجهة إمكانية الوصول في `nsh` إعدادات المستخدم وتتيح لك التحدث إلى قارئ الشاشة.

| العضو | الوصف |
|---|---|
| `screenReaderEnabled()` | هل يعمل VoiceOver أو TalkBack (تفاعلي). |
| `reduceMotion()` | هل طلب المستخدم حركة أقل (تفاعلي). |
| `announce(message)` | يقرأ قارئ الشاشة `message`. |
| `setAccessibilityFocus(ref)` | ينقل تركيز قارئ الشاشة إلى عنصر عرض. |

الإعدادات دوال وصول (accessors): اقرأها داخل ربط (binding) أو تأثير (effect)، وما يقرؤها يتحدث عندما يغيّر المستخدم الإعداد، دون حاجة إلى تنظيف.

```rust tabs
use nsh_core::prelude::*;

fn upload() -> impl IntoElement {
    let done = signal(false);
    let result = element_ref();
    let finish = move || {
        done.set(true);
        announce_for_accessibility("Upload complete");
        result.set_accessibility_focus();
    };
    view()
        .gap(px(12.0))
        // Autoplaying carousels are hard to use with a screen reader: show a list instead.
        .child(when(move || !screen_reader(), photo_carousel).otherwise(photo_list))
        .child(
            text(move || if done.get() { "Uploaded 3 photos" } else { "Uploading…" })
                .element_ref(&result),
        )
}
```

```tsx tabs
import { signal, Text, View, type ViewRef } from "nsh";
import { announce, screenReaderEnabled, setAccessibilityFocus } from "nsh";

function Upload() {
  const done = signal(false);
  let result!: ViewRef;
  const finish = () => {
    done.set(true);
    announce("Upload complete");
    setAccessibilityFocus(result);
  };
  return (
    <View style={{ gap: 12 }}>
      {/* Autoplaying carousels are hard to use with a screen reader: show a list instead. */}
      <If when={!screenReaderEnabled()} else={<PhotoList />}>
        <PhotoCarousel />
      </If>
      <Text ref={result}>{done() ? "Uploaded 3 photos" : "Uploading…"}</Text>
    </View>
  );
}
```

أعلن التغييرات التي قد يفوتها المستخدم: انتهاء حفظ في الخلفية، أو ظهور خطأ بعيدًا عن موضع التركيز، أو انتهاء مؤقّت. على Android، يجعل `android={{ accessibilityLiveRegion: "polite" }}` على عنصر عرض TalkBack يعلن تغييراته بنفسه.

<a id="text-size"></a>

## حجم النص

يتبع النص وحقول الإدخال حجم النص في النظام (Dynamic Type على iOS، وحجم الخط على Android) ما لم تعطّل ذلك (`.allow_font_scaling(false)`، `allowFontScaling={false}`). وبدلًا من تعطيله، صمّم مع أخذه في الحسبان:

- دع النص يلتف: تجنب الارتفاعات الثابتة في عناصر العرض التي تحتوي على نص.
- ضع حدًا أقصى للعناوين الكبيرة جدًا باستخدام `.max_font_size_multiplier(..)` / `maxFontSizeMultiplier` بدلًا من تعطيل التحجيم.
- بدّل التخطيطات عندما يكون النص كبيرًا: اقرأ `font_scale()` (Rust) أو `fontScale()` من `nsh` (TSX) (مثلًا، ضع التسمية وقيمتها فوق بعضهما عموديًا عندما يتجاوز 1.3).

راجع [الجهاز والبيئة](./device-and-environment.md#text-size).

<a id="reduced-motion"></a>

## الحركة المخفضة

`reduce_motion()` (Rust) و`reduceMotion()` (TSX) تكونان `true` عندما يفعّل المستخدم Reduce Motion في iOS أو إعداد إزالة الرسوم المتحركة في Android. تعمل رسومك المتحركة كما كتبتها، لذا استخدمها، أو استخدم متغيري Tailwind `motion-reduce:` و`motion-safe:`، لاستبدال الحركة الكبيرة بتلاشٍ أو تغيير فوري:

```rust tabs
use nsh_core::{element::LayoutAnimation, prelude::*};

let toggle = move || {
    if !reduce_motion() {
        animate_layout(LayoutAnimation::SPRING);
    }
    expanded.update(|e| *e = !*e);
};

view()
    .on_press(toggle)
    .when(!reduce_motion(), |v| v.active(|s| s.scale(0.95)))
```

```tsx tabs
import { View } from "nsh";
import { reduceMotion } from "nsh";
import { LayoutAnimation } from "nsh";

const toggle = () => {
  if (!reduceMotion()) LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
  expanded.set(!expanded());
};

<View onPress={open} class="transition active:scale-95 motion-reduce:transition-none" />
<View class="motion-safe:animate-bounce" />
```

<a id="touch-targets"></a>

## أهداف اللمس

اجعل العناصر القابلة للضغط بحجم 44 × 44 نقطة على الأقل. وعندما يجب أن يبدو عنصر التحكم أصغر، وسّع منطقة لمسه باستخدام هامش الإصابة (hit slop) (`.hit_slop(..)`، `hitSlop`) بدلًا من حجمه؛ راجع [اللمس والإيماءات](./touch-and-gestures.md#hit-areas-hitslop).

<a id="checking-your-app"></a>

## فحص تطبيقك

- شغّل VoiceOver (إعدادات iOS، إمكانية الوصول، أو انقر ثلاث مرات على الزر الجانبي إذا كان معدًّا) أو TalkBack، واستخدم التطبيق دون النظر: يجب أن يقول كل عنصر تحكم ما هو وماذا يفعل.
- في محاكيات iOS، يعرض Accessibility Inspector في Xcode تسمية كل عنصر وسماته وقيمته.
- جرّب أكبر حجم للنص والوضع الداكن.
- معرّف الاختبار (`.test_id(..)`، `testID`) يمنح اختبارات واجهة المستخدم مقبضًا ثابتًا لا يتغير بتغير لغة التسمية.

<a id="related"></a>

## ذات صلة

- [واجهة إمكانية الوصول في `nsh`](../modules/nsh.md#accessibility): المرجع.
- [`View`](../elements/view.md): كل خصائص إمكانية الوصول.
- [الرسوم المتحركة](./animation.md#reduced-motion) و[الجهاز والبيئة](./device-and-environment.md).
