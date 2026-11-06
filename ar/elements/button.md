---
title: "Button"
description: "مكوّن Button: عنصر ضغط يتحكم في عمليات الضغط وفي حالتي التعطيل والتحديد ودوره لقارئات الشاشة، ويُنسَّق مظهره من قِبل التطبيق."
group: base
demo: el-button
source_hash: ae28f575931a4fe9
---

# Button

الزر هو هدف الضغط. وهو يتولى السلوك: الضغطات، وتغذية الضغط الراجعة عبر أنماط الحالة في التطبيق، وحالتَي التعطيل والتحديد، وتركيز لوحة المفاتيح، ودوره لدى قارئات الشاشة. أما المظهر فهو من شأن التطبيق: فالـ `Button` لا يملك ألوانًا أو أحجامًا أو حشوات أو تسمية خاصة به، ولذلك يصبح مكوّن واحد زرًّا أساسيًا، أو زر أيقونة، أو تبويبًا، أو مفتاح تبديل في شريط أدوات، أو صفًّا في قائمة، بحسب الأنماط والعناصر الفرعية التي تمنحه إياها.

```rust tabs
use nsh_base::button;
use nsh_core::prelude::*;

fn counter() -> impl IntoElement {
    let count = signal(0_u32);
    button()
        .on_press(move || count.update(|n| *n += 1))
        .self_center()
        .px_5()
        .py_3()
        .rounded_xl()
        .bg(rgb(0x2563eb))
        .active(|s| s.bg(rgb(0x1d4ed8)))
        .child(
            text(move || format!("Pressed {}", count.get()))
                .text_color(white())
                .font_weight(FontWeight::SEMIBOLD),
        )
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { Button } from "nsh/base";

function App() {
  const count = signal(0);
  return (
    <Button
      onPress={() => count.update((n) => n + 1)}
      class="self-center rounded-xl bg-blue-600 px-5 py-3 active:bg-blue-700"
    >
      <Text class="text-base font-semibold text-white">{`Pressed ${count()}`}</Text>
    </Button>
  );
}

mount(App);
```

يأتي `Button` من [`nsh/base`](../modules/nsh-base.md)، وهي حزمة `nsh-base` في Rust. في TSX يتحدد مظهره بـ `class` و`style`، مع متغيرات الحالة `active:` و`hover:` و`focus:` و`selected:` و`disabled:` (أو ما يقابلها: `activeStyle` و`hoverStyle` و`focusStyle` و`selectedStyle` و`disabledStyle`). في Rust يُنشئ `button()` زرًّا بالطريقة التي يُنشئ بها `view()` عرضًا: دالة ضبط لكل خاصية (`.disabled(..)`، `.selected(..)`)، ومستمع لكل حدث (`.on_press(..)`)، ودوال أنماط مُنمَّطة الأنواع (`.px_4()`، `.bg(..)`) للمظهر، ودوال الحالة (`.active(..)`، `.hover(..)`، `.focus(..)`، `.selected_style(..)`، `.disabled_style(..)`) للحالات، و`.child(..)` للمحتوى.

<a id="props"></a>

## الخصائص

| الخاصية | Rust | النوع | الافتراضي | الوصف |
|---|---|---|---|---|
| `disabled` | `.disabled(..)` | `boolean` | `false` | لا ضغطات ولا تغذية راجعة للضغط؛ تُطبَّق أنماط `disabled:` وتعلن قارئات الشاشة أنه معتّم. |
| `selected` | `.selected(..)` | `boolean` | `false` | محدد: مفتاح تبديل في وضع التشغيل، أو التبويب الحالي. تعلن قارئات الشاشة ذلك. يملك التطبيق القيمة وينسّقها. |
| `selectedStyle` | `.selected_style(\|s\| ..)` | `StyleProp<ViewStyle>` | لا شيء | النمط أثناء `selected` وعدم التعطيل، على هيئة فئات `selected:`. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | لا شيء | ما تقوله قارئات الشاشة عندما لا يكفي المحتوى، كما في الأيقونة. |
| `role` | `.role(..)` | `AccessibilityRole` | `"button"` | ماهية الزر لدى قارئات الشاشة عندما لا يكون هناك مكوّن `nsh/base` يمثّل ذلك التحكم: `"link"` (يفتح عنوان URL)، ... |
| `hitSlop` | `.hit_slop(..)` | `number \| Partial<Edges>` | لا شيء | إلى أي مدى خارج حدوده تظل الضغطات محتسبة، بالنقاط: رقم واحد لكل الجوانب، أو الجوانب مسمّاة. كما في `hitSlop` الخاص بالعرض. |
| `children` | `.child(..)` | `JSX.Element` | لا شيء | المحتوى: نص، أو أيقونة، أو أي تخطيط. |
| `class`، `style` | دوال الأنماط | `string`، `StyleProp<ViewStyle>` | لا شيء | مظهره بالكامل. |
| `activeStyle`، `hoverStyle`، `focusStyle`، `disabledStyle` | `.active(\|s\| ..)`، `.hover(..)`، `.focus(..)`، `.disabled_style(..)` | `StyleProp<ViewStyle>` | لا شيء | النمط أثناء الضغط أو التمرير فوقه أو التركيز عليه أو تعطيله، على هيئة فئات `<state>:`. الحالات اللاحقة تتغلب على السابقة؛ و`disabled` يتغلب على الجميع. |

في Rust تكون كل خاصية دالة ضبط تقبل قيمة أو إشارة (signal) أو دالة مغلقة (closure)؛ والخصائص التي تتركها تحتفظ بقيمها الافتراضية:

```rust
button()
    .disabled(move || saving.get())
    .accessibility_label("Save")
```

<a id="events"></a>

## الأحداث

| الحدث | Rust | الوصف |
|---|---|---|
| `onPress` | `.on_press(\|\| ..)` | جرى الضغط على الزر: نقرة لمسية، أو نقرة بالفأرة، أو Return أو Space أثناء امتلاكه تركيز لوحة المفاتيح، أو تفعيل من قارئ الشاشة. |
| `onPressDown` | `.on_press_down(\|\| ..)` | بدأ ضغط عليه. |
| `onPressUp` | `.on_press_up(\|\| ..)` | انتهى الضغط: بالإفلات، أو بالابتعاد، أو بالإلغاء. |

`onPressDown` و`onPressUp` مخصصان لتغذية الضغط الراجعة الخاصة بك، مثل حركة نابضية أو تمييز لا تعبّر عنه أنماط الحالة. الزر المعطّل لا يُصدر أيًّا منها.

<a id="styling"></a>

## التنسيق

مظهر الزر من شأن تطبيقك: فالتطبيق هو من يقرر ما هو الزر الأساسي وما هو الثانوي. يكفي زوج من المكونات الصغيرة لإبقاء هذا القرار في مكان واحد:

```rust tabs
use nsh_base::button;
use nsh_core::prelude::*;

/// A filled button, darker while pressed.
fn primary(label: &'static str, on_press: impl Fn() + 'static) -> impl IntoElement {
    button()
        .on_press(on_press)
        .items_center()
        .rounded_lg()
        .px_4()
        .py_3()
        .bg(rgb(0x2563eb))
        .active(|s| s.bg(rgb(0x1d4ed8)))
        .disabled_style(|s| s.opacity(0.4))
        .child(text(label).text_color(white()).font_weight(FontWeight::SEMIBOLD))
}

/// An outlined button.
fn secondary(label: &'static str, on_press: impl Fn() + 'static) -> impl IntoElement {
    button()
        .on_press(on_press)
        .items_center()
        .rounded_lg()
        .px_4()
        .py_3()
        .border_1()
        .border_color(rgb(0xd4d4d4))
        .hover(|s| s.bg(rgb(0xfafafa)))
        .active(|s| s.bg(rgb(0xf5f5f5)))
        .child(text(label).text_color(rgb(0x171717)))
}
```

```tsx tabs
import { Text } from "nsh";
import { Button } from "nsh/base";

function Primary(props: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Button
      onPress={props.onPress}
      disabled={props.disabled}
      class="items-center rounded-lg bg-blue-600 px-4 py-3 active:bg-blue-700 disabled:opacity-40"
    >
      <Text class="font-semibold text-white">{props.label}</Text>
    </Button>
  );
}

function Secondary(props: { label: string; onPress: () => void }) {
  return (
    <Button
      onPress={props.onPress}
      class="items-center rounded-lg border border-neutral-300 px-4 py-3 active:bg-neutral-100 hover:bg-neutral-50"
    >
      <Text class="text-neutral-900">{props.label}</Text>
    </Button>
  );
}
```

تُطبَّق متغيرات الحالة بشكل أصلي: فالضغط يُغمّق الزر على الخيط الرئيسي دون تشغيل أي JS أو Rust. في Rust تكون دوال الحالة هي المتغيرات نفسها: `.active(..)` و`.hover(..)` و`.focus(..)` و`.selected_style(..)` و`.disabled_style(..)` تتبع حالات الزر نفسه. وتعمل ألوان السمة لديك بالطريقة نفسها: `bg-primary` في TSX، و`theme().primary` في Rust (راجع [رموز السمة](../docs/tailwind.md#theme-tokens)).

<a id="disabled"></a>

## التعطيل

الزر المعطّل لا يقبل ضغطات ولا يعطي تغذية راجعة، وتعلن قارئات الشاشة أنه معتّم. أما مظهره أثناء التعطيل فهو من اختيارك، عبر فئات `disabled:` أو `disabledStyle`:

```rust tabs
fn save(saving: Signal<bool>) -> impl IntoElement {
    button()
        .disabled(saving)
        .on_press(move || saving.set(true))
        .rounded_lg()
        .px_4()
        .py_3()
        .bg(rgb(0x2563eb))
        .disabled_style(|s| s.opacity(0.4))
        .child(text("Save").text_color(white()))
}
```

```tsx tabs
<Button disabled={saving()} onPress={save} class="rounded-lg bg-blue-600 px-4 py-3 disabled:opacity-40">
  <Text class="text-white">Save</Text>
</Button>
```

<a id="a-toggle-with-selected"></a>

## مفتاح تبديل مع selected

`selected` يجعل الزر مفتاح تبديل: كزر الخط العريض في شريط أدوات، أو شريحة تصفية، أو التبويب الحالي. يحتفظ التطبيق بالقيمة، ويقلبها في `onPress`، وينسّق الحالة المحددة؛ وتعلن قارئات الشاشة أن الزر محدد.

```rust tabs
fn bold(on: Signal<bool>) -> impl IntoElement {
    button()
        .selected(on)
        .accessibility_label("Bold")
        .on_press(move || on.update(|on| *on = !*on))
        .size(px(40.0))
        .items_center()
        .justify_center()
        .rounded_md()
        .selected_style(|s| s.bg(rgb(0xdbeafe)))
        .child(text("B").font_weight(FontWeight::BOLD))
}
```

```tsx tabs
<Button
  selected={bold()}
  onPress={() => bold.set(!bold())}
  accessibilityLabel="Bold"
  class="size-10 items-center justify-center rounded-md selected:bg-blue-100"
>
  <Text class="font-bold">B</Text>
</Button>
```

صف التبويبات هو [`Tabs`](./tabs.md) والتحكم بالتشغيل / الإيقاف هو [`Switch`](./switch.md)، من `nsh/base`: فهما يتوليان الدور وحالة التحديد ولوحة المفاتيح الخاصة بنوعهما، وهو ما لا يوفره `Button` مع `role="tab"` أو `role="switch"`.

<a id="a-small-target-with-hitslop"></a>

## هدف صغير مع hitSlop

قد يكون زر الأيقونة أصغر من إصبع. `hitSlop` يجعل الضغطات التي تقع بقربه محتسبة، بالنقاط بعد كل جانب، دون تغيير تخطيطه أو مظهره: رقم واحد لكل الجوانب، أو الجوانب مسمّاة (`{ top: 8, bottom: 8 }`)، كما يقبلها [`hitSlop` الخاص بالعرض](./index.md#presses-and-feedback).

```rust tabs
fn close(open: Signal<bool>) -> impl IntoElement {
    button()
        .hit_slop(EdgeInsets::all(px(12.0)))
        .accessibility_label("Close")
        .on_press(move || open.set(false))
        .size(px(20.0))
        .items_center()
        .justify_center()
        .child(text("×"))
}
```

```tsx tabs
<Button hitSlop={12} accessibilityLabel="Close" onPress={() => open.set(false)} class="size-5 items-center justify-center">
  <Text>×</Text>
</Button>
```

<a id="accessibility"></a>

## إمكانية الوصول

- الزر عنصر واحد لدى قارئات الشاشة، بالدور `"button"` ما لم يقل `role` غير ذلك. تسميته هي محتواه النصي؛ فأعطِ `accessibilityLabel` عندما يكون المحتوى أيقونة أو يقول القليل جدًا.
- يُعلَن عن `disabled` و`selected` بالطريقة التي تعلن بها المنصة عنهما (VoiceOver وTalkBack وUI Automation وشجرة إمكانية الوصول في المتصفح).
- على macOS والويب يكون الزر نقطة توقف لتركيز لوحة المفاتيح: يصل إليه Tab، ويضغطه Return وSpace، وتُظهر أنماط `focus:` موضع التركيز.

راجع [إمكانية الوصول](../docs/accessibility.md) للاطلاع على التسميات والأدوار والإعلانات عمومًا.

<a id="platform-notes"></a>

## ملاحظات المنصات

- iOS وAndroid وMac Catalyst: الضغط هو نقرة لمسية تنتهي على الزر؛ والابتعاد عنه يلغيها، كما في أزرار النظام نفسها.
- أنظمة سطح المكتب (macOS وWindows وLinux وGPUI) والويب: الضغط هو نقرة. على macOS والويب، يضغط Return وSpace أيضًا الزر الذي يملك تركيز لوحة المفاتيح. وتُطبَّق أنماط `hover:` عند مؤشر الفأرة أو لوحة اللمس.
- كل منصة ترسم ما ينسّقه التطبيق: فتغذية الضغط الراجعة هي `active:` / `activeStyle` أو حركة من صنعك.
