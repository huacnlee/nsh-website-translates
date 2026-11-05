---
title: "اللمس والإيماءات"
description: "الضغطات وردود فعل الضغط، ومناطق الاستجابة للّمس، وأحداث المؤشر، واللمسات الخام، ونظام المستجيب (responder system)، وPanResponder، وإيماءات السحب والقرص والتدوير الأصلية."
order: 38
group: ui
demo: guide-gestures
source_hash: 00e684506892cb71
---

# اللمس والإيماءات

يتعامل NSH مع اللمس على ثلاثة مستويات. **الضغطات** (`.on_press` في Rust و`onPress` في TSX وما يشبههما) تغطي الأزرار والصفوف والروابط، مع رسم تأثير الضغط بشكل أصلي. **الإيماءات الأصلية** (السحب والقرص والتدوير) تحرّك [القيم المتحركة](./animation.md#animated-values) على خيط واجهة المستخدم (UI thread)، فتتبع البطاقة المسحوبة الإصبع حتى لو كانت شيفرتك مشغولة. **اللمسات الخام ونظام المستجيب** (`.on_touch` و`.claim_touches` مع معالجات `.on_responder_*` في Rust؛ و`onTouchStart` و`onResponderMove` و`PanResponder` في TSX) تمنح شيفرتك موضع كل إصبع لكل ما لا يستطيع المستويان الآخران التعبير عنه، مثل الرسم.

اختر أعلى مستوى يؤدي المطلوب: كلما ارتفع المستوى، قلّ العمل الذي ينتقل من خيط واجهة المستخدم إلى شيفرتك.

<a id="presses"></a>

## الضغطات

يقبل كل عنصر معالجات الضغط؛ فلا يوجد مكوّن "touchable" منفصل. ضع `.on_press` / `onPress` على view أو نص أو صورة أو أي عنصر آخر.

```rust tabs
use nsh_core::prelude::*;

#[component]
fn App() -> impl IntoElement {
    let count = signal(0_u32);
    view().flex_1().items_center().justify_center().child(
        view()
            .on_press(move || count.update(|n| *n += 1))
            .on_long_press(move || count.set(0))
            .active(|s| s.opacity(0.6))
            .role(AccessibilityRole::Button)
            .px(px(20.0))
            .py(px(12.0))
            .rounded(px(10.0))
            .bg(rgb(0x0969da))
            .child(
                text(move || format!("Pressed {} times", count.get()))
                    .text_color(white())
                    .font_weight(FontWeight::SEMIBOLD),
            ),
    )
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";

function App() {
  const count = signal(0);
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <View
        onPress={() => count.update((n) => n + 1)}
        onLongPress={() => count.set(0)}
        activeStyle={{ opacity: 0.6 }}
        role="button"
        style={{ paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, backgroundColor: "#0969da" }}
      >
        <Text style={{ color: "#ffffff", fontWeight: "600" }}>Pressed {count()} times</Text>
      </View>
    </View>
  );
}

mount(App);
```

| Rust | TSX | الافتراضي | الوصف |
|---|---|---|---|
| `.on_press(..)` | `onPress` | | رُفع الإصبع داخل العنصر (بعد ضغطة عادية، وليس ضغطة مطوّلة). |
| `.on_long_press(..)` | `onLongPress` | | بقي الإصبع مضغوطًا طوال مهلة الضغطة المطوّلة. لا يُستدعى معالج الضغط بعدها. |
| `.on_press_down(..)` | `onPressDown` | | بدأت الضغطة. |
| `.on_press_up(..)` | `onPressUp` | | انتهت الضغطة: بالرفع، أو بالانزلاق خارج العنصر، أو باستيلاء scroll view عليها. |
| `.long_press_delay(ms)` | `delayLongPress` | `500` | عدد المللي ثانية قبل أن تصبح الضغطة ضغطة مطوّلة. |
| `.disabled(..)` | `disabled` | `false` | لا يستقبل ضغطات ولا يُظهر أي تأثير؛ يطبّق نمط التعطيل؛ وتعلن قارئات الشاشة أنه معطّل. |

سلوك الضغطات:

- **يستجيب العنصر القابل للضغط الأعمق فقط.** الصف القابل للضغط الذي يحتوي على زر قابل للضغط لا يتلقى ضغطة عند الضغط على الزر.
- **داخل scroll view، تنتظر الضغطة نحو 130 ms** قبل أن تبدأ (ويظهر تأثيرها)، فيؤدي السحب الذي يبدأ على زر إلى التمرير بدل الضغط عليه.
- **الانزلاق خارج العنصر يلغي الضغطة.** تحريك الإصبع خارج العنصر ينهي الضغطة بمعالج رفع الضغط ودون ضغطة مكتملة.
- **التعطيل يزيل مستمعي الضغط** من العناصر المركّبة، فلا يُظهر العنصر أي تأثير إطلاقًا، ويُطبَّق نمط التعطيل (`.disabled_style(..)`، `class="disabled:opacity-40"`).
- **المقاطع النصية المتداخلة التي لها معالج ضغط تعمل كروابط.** الفقرة view أصلي واحد، وتذهب الضغطة إلى المقطع الذي تحت الإصبع. راجع [Text](./text.md).

<a id="press-feedback"></a>

## تأثير الضغط

تأثير الضغط من مسؤولية التطبيق: هو الأنماط التي يتخذها العنصر أثناء الضغط عليه أو تمرير المؤشر فوقه أو حصوله على التركيز أو تعطيله. تُطبَّق أصليًا لحظة تغيّر الحالة، دون رحلة ذهاب وإياب إلى شيفرتك. لكل حالة دالة في Rust، وخاصية نمط في TSX، و[متغيّر Tailwind](./tailwind.md):

| Rust | خاصية TSX | الصنف | الوصف |
|---|---|---|---|
| `.active(\|s\| ..)` | `activeStyle` | `active:` | أثناء الضغط. |
| `.hover(\|s\| ..)` | `hoverStyle` | `hover:` | أثناء وجود مؤشر فوقه (أجهزة سطح المكتب، ومؤشرات iPad، والمتصفحات). |
| `.focus(\|s\| ..)` | `focusStyle` | `focus:` | أثناء حصوله على التركيز. |
| `.focus_within(\|s\| ..)` | `focusWithinStyle` | `focus-within:` | أثناء حصوله هو أو عنصر بداخله على التركيز: إطار الحقل حول الإدخال الذي يُحرَّر. |
| `.disabled_style(\|s\| ..)` | `disabledStyle` | `disabled:` | أثناء التعطيل. |
| `.ripple(Ripple { .. })` | `android={{ ripple }}` | | تأثير material ripple في Android (`color`، `borderless`، `radius`، `foreground`)، إضافةً إلى الأنماط. |

تُطبَّق أنماط الحالات فوق أنماط العنصر نفسه. الحالات اللاحقة تتغلب على السابقة (hover ثم focus ثم active)، ونمط التعطيل يتغلب على الجميع، ولا تُطبَّق الأنماط الأخرى أثناء تعطيل العنصر.

```rust tabs
use nsh_core::{Ripple, prelude::*};

view().on_press(open).active(|s| s.opacity(0.5))

view().on_press(open).active(|s| s.bg(rgb(0xddf4ff))).p(px(16.0))

view()
    .on_press(open)
    .active(|s| s.opacity(0.6))
    .ripple(Ripple {
        color: Some(rgba(0x0969da4d).into()),
        ..Ripple::default()
    })
```

```tsx tabs
<View onPress={open} activeStyle={{ opacity: 0.5 }}>…</View>

<View onPress={open} activeStyle={{ backgroundColor: "#ddf4ff" }} style={{ padding: 16 }}>…</View>

<View
  onPress={open}
  activeStyle={{ opacity: 0.6 }}
  android={{ ripple: { color: "rgba(9,105,218,0.3)" } }}
>
  …
</View>
```

يمتد ripple غير المحدود بحدود خارج العنصر، وهو مناسب لأزرار الأيقونات: `Ripple { borderless: true, radius: Some(px(24.0)), .. }`، `android={{ ripple: { borderless: true, radius: 24 } }}`. راجع [Platform-specific code](./platform-specific.md).

مع الانتقال (`.transition()`، الصنف `transition`) يتحرك تغيّر الحالة بسلاسة. `.group()` (الصنف `group`) يجعل العنصر مجموعة، و`.group_active(..)` (`group-active:`) ينسّق أبناءه أثناء الضغط عليه:

```rust tabs
view()
    .on_press(save)
    .group()
    .rounded_xl()
    .bg(rgb(0x059669))
    .p_4()
    .transition()
    .active(|s| s.scale(0.95).bg(rgb(0x065f46)))
    .child(
        text("Save")
            .font_weight(FontWeight::SEMIBOLD)
            .text_color(white())
            .group_active(|s| s.opacity(0.85)),
    )
```

```tsx tabs
<View
  onPress={save}
  class="group rounded-xl bg-emerald-600 p-4 transition active:scale-95 active:bg-emerald-800"
>
  <Text class="font-semibold text-white group-active:opacity-85">Save</Text>
</View>
```

<a id="hit-areas-hitslop"></a>

## مناطق اللمس: hitSlop

يوسّع hit slop (`.hit_slop(..)`، `hitSlop`) المنطقة التي تستقبل اللمسات خارج حدود العنصر، دون تغيير تخطيطه. استخدمه للأهداف الصغيرة مثل أزرار الإغلاق ومفاتيح التبديل.

```rust tabs
view().hit_slop(EdgeInsets::all(px(12.0))).on_press(close).size(px(20.0))

view()
    .hit_slop(EdgeInsets { top: px(10.0), bottom: px(10.0), left: px(4.0), right: px(4.0) })
    .on_press(next)
```

```tsx tabs
<View hitSlop={12} onPress={close} style={{ width: 20, height: 20 }}>…</View>
<View hitSlop={{ top: 10, bottom: 10, left: 4, right: 4 }} onPress={next}>…</View>
```

| Rust | TSX | الوصف |
|---|---|---|
| `.hit_slop(EdgeInsets)` | `hitSlop: number \| { top?, right?, bottom?, left? }` | نقاط تُضاف حول الحدود. `EdgeInsets::all(..)` والرقم في TSX يُطبَّقان على الجوانب الأربعة. |

أبقِ المنطقة الموسّعة داخل حدود العنصر الأب (أعطِ العنصر الصغير هامشًا خارجيًا أو داخليًا حوله): فاختبار الإصابة يصل إلى الابن عبر أبيه، لذلك لا تصل اللمسة الواقعة خارج الأب إلى hit slop الخاص بالابن.

<a id="children-outside-their-parent"></a>

## أبناء خارج حدود أبيهم

الابن الموضوع خارج حدود أبيه (بتموضع مطلق باستخدام `overflow` وبقي ظاهرًا، مثل قائمة منسدلة تحت حقلها) يستقبل اللمسات حيث يُرسم، مثل أي عنصر آخر: يجري NSH اختبار الإصابة أصليًا للعناصر الفرعية التي تمتد خارج عنصر ما. الأب الذي يقصّ ما يفيض عنه يقصّها، وعندها لا تظهر ولا تستقبل لمسات هناك. تُحسب المنطقة من التخطيط، لذا فإن الابن الذي نُقل خارج أبيه بواسطة transform لا يستقبل اللمسات إلا داخل حدود أبيه.

انتبه إلى ترتيب الرسم: تُرسم القائمة المنسدلة فوق العناصر الشقيقة لحقلها فقط إذا جاء الحقل بعدها أو كان له `z-index` أعلى، وتذهب اللمسات إلى ما يُرسم في الأعلى.

## pointerEvents

مفتاح النمط `pointerEvents` (`.pointer_events(..)` في Rust) يحدد أي عناصر الشجرة الفرعية يمكن أن تكون هدفًا للمسة. يُقيَّم أصليًا أثناء اختبار الإصابة، فلا يكلّف شيئًا لكل لمسة.

| Rust | TSX | العنصر | أبناؤه |
|---|---|---|---|
| `PointerEvents::Auto` (الافتراضي) | `"auto"` | يستقبل اللمسات | يستقبلون اللمسات |
| `PointerEvents::None` | `"none"` | لا يكون هدفًا أبدًا | لا يكونون هدفًا أبدًا ما لم يضبط أحدهم `"auto"`: تمر اللمسات إلى ما خلفها |
| `PointerEvents::BoxNone` | `"box-none"` | لا يكون هدفًا أبدًا | يستقبلون اللمسات |
| `PointerEvents::BoxOnly` | `"box-only"` | يستقبل اللمسات | لا يكونون هدفًا أبدًا |

الاستخدامات المعتادة: طبقة علوية يجب ألا تحجب ما تحتها (none)، وحاوية بملء الشاشة يجب أن تترك مساحتها الفارغة اللمسات تمر إلى المحتوى خلفها بينما تظل أزرارها تعمل (box-none)، وصف يجب أن يستقبل الضغطة حتى عندما يقع الإصبع على أحد أبنائه (box-only).

```rust tabs
view().flex_1().child(map()).child(
    // A floating toolbar: the empty area passes touches to the map.
    view()
        .pointer_events(PointerEvents::BoxNone)
        .absolute()
        .inset_0()
        .justify_end()
        .p(px(16.0))
        .child(
            view()
                .on_press(locate)
                .self_end()
                .p(px(12.0))
                .rounded(px(24.0))
                .bg(white())
                .child(text("Locate")),
        ),
)
```

```tsx tabs
<View style={{ flex: 1 }}>
  <Map />
  {/* A floating toolbar: the empty area passes touches to the map. */}
  <View style={{ pointerEvents: "box-none", position: "absolute", top: 0, left: 0, right: 0, bottom: 0, justifyContent: "flex-end", padding: 16 }}>
    <View onPress={locate} style={{ alignSelf: "flex-end", padding: 12, borderRadius: 24, backgroundColor: "#ffffff" }}>
      <Text>Locate</Text>
    </View>
  </View>
</View>
```

`"none"` يُورَّث مثل `pointer-events` في CSS: العنصر الذي بداخله ويضبط `"auto"` يستقبل اللمسات من جديد. `"box-none"` و`"box-only"` يُطبَّقان على العنصر الذي يضبطهما. صنفا Tailwind ‏`pointer-events-none` و`pointer-events-auto` يضبطان `"none"` و`"auto"`، وبوصفه مفتاح نمط يقبل `pointerEvents` أيضًا أنماط الحالات (`activeStyle`، ...) والمتغيّرات.

<a id="native-gestures-pan-pinch-and-rotation"></a>

## الإيماءات الأصلية: السحب والقرص والتدوير

لعمليات السحب والقرص والتدوير التي تحرّك شيئًا على الشاشة، اربط [القيم المتحركة](./animation.md#animated-values) بالإيماءة. يكتب مُعرِّف إيماءات المنصة القيم على خيط واجهة المستخدم، فتتحرك العناصر المرتبطة بها في الإطار نفسه؛ ويُبلَّغ كودك عند بدء الإيماءة وانتهائها.

```rust tabs
use nsh_core::prelude::*;

#[component]
fn App() -> impl IntoElement {
    let x = animated_value(0.0);
    let y = animated_value(0.0);
    view().flex_1().items_center().justify_center().child(
        view()
            .pan_values(Some(&x), Some(&y))
            .on_pan_end(move |e: &PanEvent| {
                // Spring back, starting at the speed the finger let go with.
                let spring = |velocity| Spring { velocity: Some(velocity), ..Spring::default() };
                x.spring(0.0, spring(e.velocity_x));
                y.spring(0.0, spring(e.velocity_y));
            })
            .size(px(120.0))
            .rounded(px(24.0))
            .bg(rgb(0x8250df))
            .bind_translate_x(&x)
            .bind_translate_y(&y),
    )
}
```

```tsx tabs
import { mount, View } from "nsh";
import { createAnimatedValue } from "nsh";

function App() {
  const x = createAnimatedValue(0);
  const y = createAnimatedValue(0);
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <View
        pan={{ x, y }}
        onPanEnd={(e) => {
          // Spring back, starting at the speed the finger let go with.
          x.spring(0, { velocity: e.velocity.x });
          y.spring(0, { velocity: e.velocity.y });
        }}
        style={{ width: 120, height: 120, borderRadius: 24, backgroundColor: "#8250df", translate: [x, y] }}
      />
    </View>
  );
}

mount(App);
```

| Rust | TSX | الوصف |
|---|---|---|
| `.pan_values(Some(&x), Some(&y))` | `pan={{ x?, y? }}` | السحب بإصبع واحد يحرّك هذه القيم، بالنقاط. |
| `.pinch_value(&scale)` | `pinch={{ scale? }}` | القرص بإصبعين يتحكم في `scale` (معامل). |
| `.rotation_value(&angle)` | `rotation={{ angle? }}` | التدوير بإصبعين يتحكم في `angle`، بالدرجات. |
| `.on_pan_start` / `.on_pan_end` | `onPanStart` / `onPanEnd` | بدأ السحب / انتهى، مع `PanEvent`. |
| `.on_pinch_start` / `.on_pinch_end` | `onPinchStart` / `onPinchEnd` | بدأ القرص / انتهى: مقياسه وسرعته (`GestureEvent`). |
| `.on_rotation_start` / `.on_rotation_end` | `onRotationStart` / `onRotationEnd` | بدأ التدوير / انتهى: زاويته (في Rust: `GestureEvent<Radians>`) وسرعته. |

يحمل حدث السحب الإزاحة (`translation`، وهي `Point`: النقاط منذ البداية)، والسرعة (`velocity_x` / `velocity_y`؛ في TSX: `velocity`، وهي `Point`: نقاط في **الثانية**) والقيم المرتبطة في تلك اللحظة (`value_x` / `value_y`؛ في TSX: `value`، `{ x?, y? }` مع المحاور التي يربطها `pan`).

ما يفعله الجانب الأصلي نيابةً عنك:

- **يستمر السحب من حيث توجد القيمة.** عند البداية تُقرأ القيم وتُضاف إليها الإزاحة؛ والإمساك بقيمة ما زالت تتحرك (نابض في طريق عودته) يوقف الحركة حيث هي.
- **محور واحد فقط يترك الآخر للتمرير.** عند ربط قيمة أفقية فقط لا يبدأ السحب إلا إذا تحرك الإصبع أفقيًا أكثر منه عموديًا، فيظل صف السحب الأفقي داخل scroll view عمودي يتمرر عموديًا. يُتخذ هذا القرار أصليًا حين يسأل النظام عمّا إذا كان يجوز للإيماءة أن تبدأ.
- **السحب والقرص والتدوير تعمل معًا** على العنصر نفسه: يمكن سحب بطاقة واحدة وقرصها وتدويرها في آن واحد.
- **سرعة الإفلات للفيزياء.** سرعة نهاية السحب تغذّي سرعة النابض أو التباطؤ (decay) مباشرةً؛ وتتيح لك القيم اختيار نقطة التثبيت.

```rust tabs
// A card that snaps to the left or right edge.
view()
    .pan_values(Some(&x), None)
    .on_pan_end(move |e: &PanEvent| {
        let projected = e.value_x.unwrap_or(0.0) + e.velocity_x * 0.2;
        let to = if projected > 0.0 { 140.0 } else { -140.0 };
        x.spring(to, Spring { velocity: Some(e.velocity_x), ..Spring::default() });
    })
    .bind_translate_x(&x)
```

```tsx tabs
// A card that snaps to the left or right edge.
<View
  pan={{ x }}
  onPanEnd={(e) => {
    const projected = (e.value?.x ?? 0) + e.velocity.x * 0.2;
    x.spring(projected > 0 ? 140 : -140, { velocity: e.velocity.x });
  }}
  style={{ translate: [x, 0] }}
/>
```

> [!TIP]
> اربط القيم المتحركة بالإيماءة بدل تتبعها عبر المستجيب (responder) كلما كان السحب يحرّك الأشياء فقط. مع القيم المرتبطة لا يستطيع كود التطبيق المشغول أن يجعل السحب يتقطع؛ أما مع المستجيب فكل حركة هي حدث يصل إلى كودك وتحديث لما يعرضه العنصر.

<a id="raw-touches"></a>

## اللمسات الخام

تبلّغ معالجات اللمس عن كل إصبع عند نزوله وحركته ورفعه. وهي مفيدة للتسجيل واختبار الإصابة المخصص والتفاعل مع اللمس المتعدد؛ ولا تستحوذ على اللمسة (فتظل الضغطات وscroll views تعمل).

في Rust، يستمع `.on_touch(..)` إلى كل مرحلة بوصفها `TouchEvent`: `phase` الخاصة بها (`TouchPhase::Start`، `Move`، `End`، `Cancel`)، و`timestamp` و`points`، أي كل إصبع نازل، ولكل منها `id` و`location` في العنصر الذي نزل عليه، وموضعه `page` في السطح، و`changed` للأصابع التي يخصها الحدث. في TSX لكل مرحلة معالجها الخاص:

| TSX | الوصف |
|---|---|
| `onTouchStart` | نزل إصبع على العنصر أو داخله. |
| `onTouchMove` | تحرك إصبع. تُدمج الحركات في كل دورة للمحرك. |
| `onTouchEnd` | رُفع إصبع. |
| `onTouchCancel` | استولى النظام على اللمسة (بدأ scroll view بالتمرير، أو ورد اتصال). |
| `onTouchStartCapture`، `onTouchMoveCapture`، `onTouchEndCapture`، `onTouchCancelCapture` | المعالجات نفسها، لكن تُستدعى من الخارج إلى الداخل، قبل معالجات الفقاعة (bubbling). |

يتلقى كل معالج في TSX `GestureResponderEvent`:

| الحقل | الوصف |
|---|---|
| `identifier` | يعرّف الإصبع طالما هو نازل. |
| `locationX`، `locationY` | الموضع في العنصر الذي نزل عليه الإصبع (`target`). |
| `pageX`، `pageY` | الموضع في السطح. |
| `target` | معرّف العنصر الذي نزل عليه الإصبع. |
| `timestamp` | بالمللي ثانية. |
| `touches` | كل إصبع نازل. |
| `changedTouches` | الأصابع التي يخصها هذا الحدث. |
| `nativeEvent` | الحدث نفسه، فيعمل `e.nativeEvent.locationX` أيضًا. |
| `stopPropagation()` | العناصر الأبعد في الخارج لا ترى حدث اللمس هذا. |

```rust tabs
use nsh_core::{TouchPhase, element::{TouchEvent}, prelude::*};

view().on_touch(|e: &TouchEvent| {
    let Some(p) = e.points.iter().find(|p| p.changed) else { return };
    match e.phase {
        TouchPhase::Start => log::info!("down {:?} {}", p.location, e.points.len()),
        TouchPhase::Move => log::info!("move {:?}", p.page),
        TouchPhase::End | TouchPhase::Cancel => log::info!("up"),
    }
})
```

```tsx tabs
<View
  onTouchStart={(e) => console.log("down", e.locationX, e.locationY, e.touches.length)}
  onTouchMove={(e) => console.log("move", e.pageX, e.pageY)}
  onTouchEnd={() => console.log("up")}
/>
```

<a id="where-a-view-is-measure"></a>

### موقع العنصر: measure

موضع اللمسة نسبي إلى العنصر الذي نزل عليه الإصبع، وقد يكون ابنًا للعنصر الذي يهمك (مثل مقبض شريط تمرير). قياس العنصر يخبرك بمكانه، فتستطيع استخدام موضعه في الصفحة بدلًا من ذلك. في Rust، ضع `element_ref()` على العنصر وانتظر `measure()` الخاص به؛ وفي TSX استدعِ `measure()` على ref الخاص به:

```rust tabs
let track = element_ref();
let origin = stored(px(0.0));
view()
    .element_ref(&track)
    .claim_touches(TouchClaim::on_start())
    .on_responder_grant(move |e: &ResponderEvent| {
        let x = e.page.x;
        spawn(async move {
            let page = track.measure().await.map_or(px(0.0), |m| m.page.x);
            origin.replace(page);
            seek(x - page);
        });
    })
    .on_responder_move(move |e: &ResponderEvent| seek(e.page.x - origin.get()))
```

```tsx tabs
let track!: ViewRef;
let origin = 0;
<View
  ref={track}
  onStartShouldSetResponder={() => true}
  onResponderGrant={async (e) => {
    const x = e.pageX;
    origin = (await track.measure())?.pagePosition.x ?? 0;
    seek(x - origin);
  }}
  onResponderMove={(e) => seek(e.pageX - origin)}
/>;
```

تكتمل العملية بعد أن يُجرى تخطيط التغييرات التي حدثت حتى الآن: في Rust تُنتج `Measurement` (`frame`، وهو الإطار داخل الأب كما يبلّغ به معالج التخطيط، و`page`، وهي الزاوية العلوية اليسرى)، وفي TSX تُنتج `{ bounds, pagePosition }`. الزاوية محسوبة في السطح، أو في الحوار الذي يوجد فيه العنصر، وهي نفس إحداثيات مواضع اللمسات في الصفحة. تؤخذ في الحسبان إزاحات scroll views والقوائم المحيطة به؛ أما التحويلات (transforms)، بما فيها الحركات المتحركة، فلا تؤخذ. وتنتج `None` / `null` للعنصر غير الظاهر على الشاشة.
<a id="the-responder-system"></a>

## نظام المستجيب

عندما يحتاج الكود الخاص بك إلى امتلاك تسلسل لمسات كامل (الرسم بالإصبع، أو شريط تمرير مخصص، أو إيماءة لا توفرها أدوات التعرف الأصلية)، استخدم نظام مستجيب الإيماءات (gesture responder system). في كل لحظة يكون عرض واحد فقط هو **المستجيب** ويتلقى الحركات، وتتفاوض العروض فيما بينها لتحديده.

أن يصبح العرض هو المستجيب:

| Rust | TSX | الوصف |
|---|---|---|
| `.claim_touches(TouchClaim::on_start())` | `onStartShouldSetResponder` تعيد `true` | يُسأل عند ملامسة الإصبع للشاشة، من الهدف نحو الخارج. |
| `.claim_touches(TouchClaim::on_move())` | `onMoveShouldSetResponder` تعيد `true` | يُسأل عند كل حركة ما دام لا يوجد مستجيب (أو للاستحواذ عليه). |
| `TouchClaim::on_start().capture()` | `onStartShouldSetResponderCapture` | كما سبق، لكنه يُسأل من الخارج نحو الداخل، قبل المعالجات الصاعدة. يستخدمه العرض الأب لانتزاع اللمسة من أبنائه. |
| `TouchClaim::on_move().capture()` | `onMoveShouldSetResponderCapture` | نسخة الحركة. |

يُحسم الطلب من العرض وحده، دون تشغيل أي كود من عندك، ما لم يكن الطلب يستدعي ذلك: `TouchClaim::on_move().ask(|r: &ClaimRequest| ..)` يطالب بالمستجيب عندما يستدعي المستمع `r.claim()`، ويقرر بناءً على الإيماءة حتى تلك اللحظة (`r.event.gesture`). تستقبل معالجات TSX الإيماءة كوسيط ثانٍ، `gestureState`، بالحقول نفسها الموجودة في [PanResponder](#panresponder) (`dx`، `dy`، `vx`، `vy`، `moveX`، `moveY`، `x0`، `y0`، `numberActiveTouches`). مثال على سحبة تطالب بالحركات الأفقية فقط: `onMoveShouldSetResponder={(e, g) => Math.abs(g.dx) > 10 && Math.abs(g.dx) > Math.abs(g.dy)}`. يأتي هذا القرار متأخرًا بحركة واحدة، لذلك قد يبدأ عرض التمرير المحيط بالتمرير أولًا؛ وفي السحبات داخل عروض التمرير استخدم [pan activation](#pans-inside-scroll-views-panactivation).

أثناء الاستجابة:

| Rust | TSX | الوصف |
|---|---|---|
| `.on_responder_grant(..)` | `onResponderGrant` | أصبح هذا العرض هو المستجيب الآن. في Rust تمنع عروض التمرير الأصلية افتراضيًا من أخذ اللمسات (`TouchClaim::block_native(false)` يسمح لها بذلك)، أما في TSX فأعد `true` لتحقيق ذلك. |
| `.on_responder_reject(..)` | `onResponderReject` | عرض آخر هو المستجيب ورفض التخلي عنه. |
| `.on_responder_start(..)` | `onResponderStart` | لمس إصبع آخر الشاشة. |
| `.on_responder_move(..)` | `onResponderMove` | تحرك إصبع. |
| `.on_responder_end(..)` | `onResponderEnd` | رُفع إصبع. |
| `.on_responder_release(..)` | `onResponderRelease` | رُفع آخر إصبع: انتهت الإيماءة. |
| `.keep_touches(true)` | `onResponderTerminationRequest` تعيد `false` | عرض آخر يريد اللمسات: احتفظ بها (افتراضيًا تُسلَّم إليه). |
| `.on_responder_terminate(..)` | `onResponderTerminate` | عرض آخر، أو إيماءة أصلية، أخذ اللمسات. |

يبقى مستجيب مكوّن Rust مضغوطًا من لحظة منحه حتى انتهاء لمساته، أينما ذهب الإصبع أو المؤشر، تمامًا كما يبقى `:active` في CSS مضغوطًا حتى يُحرَّر الزر: تحتفظ أنماط `.active(..)` وفئات `group-active:` داخله بمظهرها طوال السحب (مثل مقبض تغيير الحجم الذي يُسحب خارج شريطه).

تستقبل معالجات Rust كائن `ResponderEvent`: ويتضمن `location` الإصبع داخل العرض الذي لمسه، وموضعه `page`، و`timestamp` و`gesture` منذ لحظة المنح.

```rust tabs
use nsh_core::prelude::*;

fn sketch() -> impl IntoElement {
    let strokes = signal(Vec::<Vec<Point<Points>>>::new());
    canvas(move || {
        strokes.with(|all| {
            all.iter().fold(Painter::new().line_width(3.0), |p, s| {
                let mut p = p.begin_path();
                for (i, pt) in s.iter().enumerate() {
                    p = if i == 0 { p.move_to(pt.x, pt.y) } else { p.line_to(pt.x, pt.y) };
                }
                p.stroke()
            })
        })
    })
    .flex_1()
    // The responder: the scroll view around does not take the touches.
    .claim_touches(TouchClaim::on_start())
    .keep_touches(true)
    .on_responder_grant(move |e: &ResponderEvent| strokes.update(|all| all.push(vec![e.location])))
    .on_responder_move(move |e: &ResponderEvent| {
        strokes.update(|all| {
            if let Some(last) = all.last_mut() {
                last.push(e.location);
            }
        })
    })
}
```

```tsx tabs
import { Canvas, type GestureResponderEvent, mount, signal } from "nsh";

function Sketch() {
  const strokes = signal<[number, number][][]>([]);
  const point = (e: GestureResponderEvent): [number, number] => [e.locationX, e.locationY];
  return (
    <Canvas
      style={{ flex: 1 }}
      onStartShouldSetResponder={() => true}
      onResponderGrant={(e) => {
        strokes.set([...strokes(), [point(e)]]);
        return true; // the scroll view around must not take the touches
      }}
      onResponderTerminationRequest={() => false}
      onResponderMove={(e) => {
        const all = strokes();
        strokes.set([...all.slice(0, -1), [...all[all.length - 1], point(e)]]);
      }}
      draw={(cx) => {
        cx.lineWidth = 3;
        for (const s of strokes()) {
          cx.beginPath();
          s.forEach(([x, y], i) => (i === 0 ? cx.moveTo(x, y) : cx.lineTo(x, y)));
          cx.stroke();
        }
      }}
    />
  );
}

mount(Sketch);
```

كيف يعمل: أي عرض له معالج لمس أو معالج مستجيب يستمع إلى اللمسات أصليًا؛ تُبلغ المنصة عن اللمسات عليه (وداخله) مع مسار العروض المستمعة، وتجري المفاوضة في نواة Rust الخاصة بـ NSH، فتسأل الطلبات وتستدعي معالجاتك بالترتيب: معالجات الالتقاط (capture) من العرض الأبعد نحو الداخل، ثم بقية المعالجات من الهدف نحو الخارج. ينتج عن ذلك أمران:

- **عروض التمرير الأصلية والمستجيبون يتنافسون.** ما دام المستجيب يحجبها، تتوقف عروض التمرير المحيطة به عن أخذ اللمسات حتى تنتهي. وإذا بدأ عرض تمرير أصلي السحب أولًا فإنه يفوز: يتلقى المستجيب معالج الإنهاء (terminate)، وتتلقى معالجات اللمس إلغاءً (cancel).
- **كل حركة هي حدث يصل إلى الكود الخاص بك.** تكون السحبات التي يقودها المستجيب سلسة بقدر سرعة الكود الخاص بك؛ أما السحبات التي تحرك العروض فقط فالأفضل لها [القيم المرتبطة](#native-gestures-pan-pinch-and-rotation).

## PanResponder

في Rust تحمل أحداث المستجيب الإيماءة بالفعل: `ResponderEvent::gesture` هو `PanGesture` يتضمن المسافة من نقطة البداية والسرعة وعدد الأصابع. وفي TSX يغلّف `PanResponder` من `nsh` نظام المستجيب ويضيف حالة الإيماءة نفسها؛ مرّر `panHandlers` الخاص به إلى العرض عبر spread.

```rust tabs
use nsh_core::prelude::*;

fn ball() -> impl IntoElement {
    let pos = signal((0.0_f32, 0.0_f32));
    let start = stored((0.0_f32, 0.0_f32));
    view()
        .size(px(60.0))
        .rounded(px(30.0))
        .bg(rgb(0x0969da))
        .style_with(move |s| {
            let (x, y) = pos.get();
            s.translate_x(px(x)).translate_y(px(y))
        })
        .claim_touches(TouchClaim::on_start())
        .on_responder_grant(move |_: &ResponderEvent| {
            start.replace(pos.get_untracked());
        })
        .on_responder_move(move |e: &ResponderEvent| {
            let (x, y) = start.get();
            let d = e.gesture.delta;
            pos.set((x + d.x.0, y + d.y.0));
        })
        .on_responder_release(move |e: &ResponderEvent| {
            log::info!("released at {} {} pt/s", e.gesture.vx, e.gesture.vy)
        })
}
```

```tsx tabs
import { mount, signal, View } from "nsh";
import { PanResponder } from "nsh";

function Ball() {
  const pos = signal({ x: 0, y: 0 });
  let start = { x: 0, y: 0 };
  const responder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      start = pos();
    },
    onPanResponderMove: (_, g) => pos.set({ x: start.x + g.dx, y: start.y + g.dy }),
    onPanResponderRelease: (_, g) => console.log("released at", g.vx, g.vy, "pt/s"),
  });
  return (
    <View
      {...responder.panHandlers}
      style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: "#0969da", translate: [pos().x, pos().y] }}
    />
  );
}

mount(Ball);
```

حالة الإيماءة:

| Rust (`PanGesture`) | TSX (`gestureState`) | الوصف |
|---|---|---|
| | `stateID` | يعرّف الإيماءة. |
| `position` | `moveX`، `moveY` | أحدث موضع لمركز ثقل اللمسات، بنقاط السطح. |
| `origin` | `x0`، `y0` | موضع مركز الثقل عند منح المستجيب. |
| `delta` | `dx`، `dy` | المسافة المقطوعة منذ المنح. |
| `vx`، `vy` | `vx`، `vy` | السرعة، بالنقاط في الثانية. |
| `active_touches` | `numberActiveTouches` | عدد الأصابع الملامسة للشاشة. |

يتتبع `PanGesture::begin` و`PanGesture::update` إيماءة انطلاقًا من اللمسات الخام (`.on_touch`) في Rust. أما دوال TSX فتستقبل `(event, gestureState)`: `onStartShouldSetPanResponder(Capture)`، `onMoveShouldSetPanResponder(Capture)`، `onPanResponderGrant`، `onPanResponderReject`، `onPanResponderStart`، `onPanResponderMove`، `onPanResponderEnd`، `onPanResponderRelease`، `onPanResponderTerminate`، `onPanResponderTerminationRequest` و`onShouldBlockNativeResponder`. وقيمة الأخير الافتراضية `true`: أي أن PanResponder الذي مُنح الاستجابة يمنع عروض التمرير الأصلية من أخذ لمساته.

<a id="pans-inside-scroll-views-panactivation"></a>

## السحبات داخل عروض التمرير: panActivation

المخطط الذي يُمرَّر عليه الإصبع أفقيًا داخل عرض تمرير عمودي يجب أن يأخذ السحبات الأفقية ويترك العمودية لعرض التمرير. المطالبة باللمسة عند بدايتها تحجب التمرير من أول بكسل، والقرار بناءً على الحركات داخل الكود الخاص بك يأتي متأخرًا جدًا: فحين يأتي الجواب قد يكون عرض التمرير قد أخذ اللمسة. يتيح تفعيل السحب (`TouchClaim::on_pan(..)`، `panActivation`) للمنصة أن تقرر على الخيط الرئيسي أثناء حركة الإصبع:

```rust tabs
view()
    .claim_touches(TouchClaim::on_pan(PanActivation::horizontal(px(10.0), px(10.0))))
    .on_responder_grant(|e: &ResponderEvent| scrub(Some(e.location.x)))
    .on_responder_move(|e: &ResponderEvent| scrub(Some(e.location.x)))
    .on_responder_release(|_: &ResponderEvent| scrub(None))
    .child(chart())
```

```tsx tabs
<View
  panActivation={{ activeOffsetX: 10, failOffsetY: 10 }}
  onResponderGrant={(e) => scrub(e.locationX)}
  onResponderMove={(e) => scrub(e.locationX)}
  onResponderRelease={() => scrub(null)}
>
  <Chart />
</View>
```

| Rust (`PanActivation`) | TSX | الوصف |
|---|---|---|
| `active_offset_x`، `active_offset_y` | `activeOffsetX`، `activeOffsetY` | يُفعَّل السحب عندما يتحرك الإصبع أكثر من هذه المسافة عن موضع ملامسته، على ذلك المحور (في أي اتجاه، بالنقاط). |
| `fail_offset_x`، `fail_offset_y` | `failOffsetX`، `failOffsetY` | يفشل السحب عندما يتحرك الإصبع أكثر من هذه المسافة أولًا: تحتفظ عروض التمرير باللمسات. |

يضبط `PanActivation::horizontal(active, fail)` و`PanActivation::vertical(active, fail)` الأزواج المعتادة. وبدون إزاحات التفعيل يُفعَّل السحب بعد 10 نقاط في أي اتجاه. وإلى أن يُفعَّل، تنتظره عروض التمرير المحيطة (على iOS)، ولا تُسأل بقية طلبات العرض. وعند التفعيل لا تستطيع عروض التمرير أخذ هذه اللمسات بعد ذلك ويصبح العرض هو المستجيب (المنح ثم الحركات)؛ وعند الفشل يتمرر عرض التمرير كالمعتاد. وفي TSX تعمل `panHandlers` الخاصة بـ `PanResponder` معه أيضًا: مرّرها بجانب الخاصية (prop)، ويُنفَّذ `onPanResponderGrant` عند التفعيل.

> [!NOTE]
> كل السرعات بالنقاط في الثانية: `vx` / `vy` الخاصان بإيماءة المستجيب، وسرعة السحب، وسرعة النابض (spring) أو التباطؤ (decay)، ولذلك يُمرَّر `vx` إلى النابض أو التباطؤ كما هو.

<a id="why-some-answers-are-props"></a>

## لماذا تكون بعض الإجابات props

لا ينتظر الخيط الرئيسي الكود الخاص بك أبدًا. وعندما يحتاج النظام إلى إجابة فورية (هل يجوز أن تبدأ إيماءة السحب هذه، وهل تصيب هذه النقطة العرض، وهل ينبغي لهذه النقرة أن تُغلق لوحة المفاتيح)، يجيب NSH أصليًا بناءً على ما رُكِّب مسبقًا: قيم السحب المرتبطة (محاورها)، وقيمة التقريب بإصبعين (pinch)، وهامش الإصابة (hit slop)، وأحداث المؤشر، وإعداد نقرات لوحة المفاتيح في عروض التمرير، وتفعيل السحب. أما معالجاتك فتعلم بما حدث بعد وقوعه. ولهذا السبب كانت هذه إعدادات تصريحية وليست دوال استدعاء، ولهذا أيضًا فإن مفاوضة المستجيب، التي تشغّل الكود الخاص بك، تفصل بين المستجيبين فقط ولا تعطّل أبدًا إيماءة أصلية.

<a id="related"></a>

## ذات صلة

- [`View`](../elements/view.md): كل خصائص اللمس في العنصر الأساسي.
- [Animation](./animation.md): القيم المتحركة والنوابض والتباطؤ للحركة التي تقودها الإيماءات.
- [Scrolling](./scrolling.md): إعداد نقرات لوحة المفاتيح، وعروض التمرير، والإيماءات المتداخلة.
- [`PanResponder`](../modules/nsh.md#panresponder): مرجع `PanResponder`.
- [Accessibility](./accessibility.md): العروض القابلة للضغط هي عناصر إتاحة (accessibility elements)؛ امنحها دورًا (role) وتسمية (label).
