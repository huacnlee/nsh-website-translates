---
title: "View"
description: "عنصر الحاوية الأساسي: التخطيط والخلفيات والحدود والظلال ومعالجة الضغط والإيماءات."
order: 10
group: primitives
demo: el-view
source_hash: 4d3ed9aca6dda87e
---

# View

`View` هو اللبنة الأساسية لكل شاشة: حاوية أصلية (UIView على iOS وMac Catalyst، وViewGroup على
Android) تضع عناصرها الفرعية باستخدام flexbox أو grid، وترسم الخلفية والحدود والظلال والتدرجات اللونية، وتعالج
الضغطات. الأزرار والبطاقات والصفوف والشاشات كلها views. في Rust يُنشأ باستخدام `view()`، وفي TSX باستخدام `<View>` من `nsh`.

```rust tabs
use nsh_core::prelude::*;

fn app() -> impl IntoElement {
    let liked = signal(false);
    view()
        .flex_1()
        .p_6()
        .gap_4()
        .bg(rgb(0xf6f8fa))
        .child(
            view()
                .flex_row()
                .items_center()
                .gap_3()
                .p_4()
                .rounded(px(16.0))
                .bg(white())
                .shadow_md()
                .child(view().size(px(40.0)).rounded_full().bg(rgb(0x8250df)))
                .child(text("A card").flex_1().text_base())
                .child(
                    view()
                        .hit_slop(EdgeInsets::all(px(8.0)))
                        .active(|s| s.opacity(0.5))
                        .on_press(move || liked.update(|l| *l = !*l))
                        .child(text(move || if liked.get() { "♥" } else { "♡" }).text_size(px(22.0))),
                ),
        )
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";

function App() {
  const liked = signal(false);
  return (
    <View style={{ flex: 1, padding: 24, gap: 16, backgroundColor: "#f6f8fa" }}>
      <View
        style={{
          backgroundColor: "#ffffff",
          borderRadius: 16,
          padding: 16,
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        }}
      >
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "#8250df" }} />
        <Text style={{ flex: 1, fontSize: 16 }}>A card</Text>
        <View onPress={() => liked.set(!liked())} activeStyle={{ opacity: 0.5 }} hitSlop={8}>
          <Text style={{ fontSize: 22 }}>{liked() ? "♥" : "♡"}</Text>
        </View>
      </View>
    </View>
  );
}

mount(App);
```

<a id="layout"></a>

## التخطيط

يضع الـ view عناصره الفرعية باستخدام flexbox، بالقيم الافتراضية التالية: `flexDirection: "column"`، `flexShrink: 0`،
`alignContent: "flex-start"`، `position: "relative"`. يحوّل `display: "grid"` (`.grid()` في Rust) التخطيط إلى CSS grid، ويحوّله
`display: "block"` إلى تخطيط الكتل. الأحجام بوحدة النقاط. راجع [التخطيط](../docs/layout.md) و
[مرجع الأنماط](../modules/style-reference.md).

يتبع `display: "flex"` سلوك CSS: ففي النمط، وفي الفئة `flex` وفي `.flex()` في Rust، يكون الاتجاه صفًا ما لم يُحدَّد اتجاه
(`flexDirection: "column"`، `flex-col`، `.flex_col()`). أما الـ view الذي لا يحدد display فيرتب عناصره الفرعية في عمود.

<a id="props"></a>

## الخصائص

يملك `View` خاصية واحدة خاصة به، هي `selectable` (`.selectable(true)` في Rust): تُحدَّد النصوص داخل الـ view معًا كتحديد واحد ([تحديد النص](./text-selection.md)). أما بقية الخصائص فهي [الخصائص المشتركة](./index.md#common-props): الأنماط (`style`، `class`،
`classList`؛ وطرائق `Styled` في Rust)، و`disabled`، وخصائص الضغط (`onPress`، `onLongPress`، `onPressDown`،
`onPressUp`، `delayLongPress`، `hitSlop`)، وأنماط الحالات (`activeStyle`، `hoverStyle`،
`focusStyle`، `disabledStyle`، `checkedStyle`)، و`onMouseEnter` / `onMouseMove` / `onMouseLeave`، و`onContextMenu`،
و`onFileDragEnter` / `onFileDragLeave` / `onFileDrop`، و`focusable`، و`onLayout`، و`ref`، و`nativeID`، و`testID`، وخصائص
الإيماءات (`pan`، `pinch`، `rotation` وأحداثها)، وخصائص اللمس والاستجابة، وخصائص إمكانية الوصول،
و`ios` / `android` / `desktop`.

<a id="selectable-views"></a>

## الـ views القابلة للتحديد

عند استخدام `selectable`، يمتد التحديد عبر عناصر [`Text`](./text.md) و[`TextView`](./text-view.md) داخل
الـ view بترتيب القراءة؛ أما النصوص التي تحمل `selectable={false}` فتبقى خارج التحديد، والـ view القابل للتحديد داخل آخر يُعدّ جزءًا من
الـ view الخارجي. راجع [تحديد النص](./text-selection.md) لمعرفة الإيماءات على كل منصة.

```tsx
<View selectable class="gap-3 p-4">
  <Text>One selection runs from here…</Text>
  <Text>…to here.</Text>
</View>
```

<a id="press-feedback"></a>

## ردود الفعل عند الضغط

الـ view القابل للضغط هو أي view له معالج ضغط. وردّ الفعل عند الضغط يعود إلى التطبيق: نمط يُطبَّق أثناء الضغط ويُنفَّذ أصليًا
ما دام الإصبع مضغوطًا، دون الرجوع إلى شيفرة التطبيق. وتؤدي `hoverStyle` و`focusStyle` و`disabledStyle` الدور
نفسه للحالات الأخرى:

```rust tabs
// Fade the whole view.
view().on_press(open).active(|s| s.opacity(0.6))

// Show a background; group_active styles the children.
view()
    .group()
    .on_press(open)
    .active(|s| s.bg(rgb(0xe5e7eb)))
    .child(text("Open").group_active(|s| s.opacity(0.7)))

// Change any style while pressed.
view().on_press(open).bg(rgb(0x2563eb)).active(|s| s.bg(rgb(0x1e40af)).scale(0.95))
```

```tsx tabs
// Fade the whole view.
<View onPress={open} activeStyle={{ opacity: 0.6 }}>…</View>

// Show a background; group-active: styles the children.
<View onPress={open} class="group" activeStyle={{ backgroundColor: "#e5e7eb" }}>
  <Text class="group-active:opacity-70">Open</Text>
</View>

// Change any style while pressed with active: classes.
<View onPress={open} class="bg-blue-600 active:bg-blue-800 active:scale-95">…</View>
```

على Android، تضيف `android={{ ripple: { color: "#0000001f" } }}` (`.ripple(Ripple { .. })` في Rust) تأثير
الموجة (ripple) الخاص بـ Material (وتعدّله `borderless` و`radius` و`foreground`).

يزيل `disabled` مستمعات الضغط من الـ view الأصلي (فلا ضغط ولا ردّ فعل) ويطبّق أنماط التعطيل:

```rust tabs
view()
    .on_press(submit)
    .disabled(move || !valid.get())
    .bg(rgb(0x16a34a))
    .disabled_style(|s| s.opacity(0.4))
```

```tsx tabs
<View onPress={submit} disabled={!valid()} class="bg-green-600 disabled:opacity-40">…</View>
```

<a id="events"></a>

## الأحداث

| الحدث | Rust | البيانات المرسلة | متى |
|---|---|---|---|
| `onPress` | `.on_press` | `PressEvent` (لا شيء في Rust) | انتهت نقرة داخل الـ view. |
| `onLongPress` | `.on_long_press` | `PressEvent` (لا شيء في Rust) | بقي الإصبع مضغوطًا مدة `delayLongPress` (500 مللي ثانية). |
| `onPressDown` / `onPressUp` | `.on_press_down` / `.on_press_up` | `PressEvent` (لا شيء في Rust) | نزل إصبع على الـ view / رُفع أو غادره. |
| `onMouseEnter` / `onMouseLeave` | `.on_mouse_enter` / `.on_mouse_leave` | `MouseEvent` | دخل الماوس إلى الـ view (أو إلى view داخله) / غادره أو غادر النافذة ([التمرير بالمؤشر](./index.md#hover))؛ وقيمة `onMouseLeave` هي آخر موضع كان فيه. |
| `onMouseMove` | `.on_mouse_move` | `MouseEvent` | تحرك الماوس فوق الـ view (أو فوق view داخله)، مع زر مضغوط أو بدونه، أو ضُغط مفتاح تعديل أو رُفع بينما يستقر المؤشر هناك دون أي زر مضغوط: `position`، `pagePosition` (قيم `Point`)، `modifiers` و`pressedButton` (`"left"`، `"right"`، `"middle"`، `"back"`، `"forward"` أو `null`)؛ مرة واحدة كحد أقصى في كل إطار. |
| `onContextMenu` | `.on_context_menu` | `ContextMenuEvent` | ضُغط الزر الثانوي فوق الـ view ([القوائم السياقية](./index.md#context-menus)). |
| `onFileDragEnter` / `onFileDragLeave` | `.on_file_drag_enter` / `.on_file_drag_leave` | لا شيء | دخلت عملية سحب ملفات محلية إلى وجهة سطح المكتب النشطة / غادرتها. |
| `onFileDrop` | `.on_file_drop` | `{ uris: string[] }` (`FileDropEvent`) | أُسقطت ملفات أو مجلدات محلية على وجهة سطح المكتب. |
| `onLayout` | `.on_layout` | `{ bounds }` (`Bounds<Points>`) | تغيّر الإطار بالنسبة إلى الأصل. |
| `onPanStart` / `onPanEnd` | `.on_pan_start` / `.on_pan_end` | `PanEvent` | بدأ / انتهى سحب مرتبط بـ `pan`؛ وتكون قيمة `cancelled` صحيحة (true) عندما يلغيه النظام. |
| `onPinchStart` / `onPinchEnd` | `.on_pinch_start` / `.on_pinch_end` | `{ scale, velocity }` | بدأت / انتهت إيماءة قرص مرتبطة بـ `pinch`. |
| `onRotationStart` / `onRotationEnd` | `.on_rotation_start` / `.on_rotation_end` | `{ rotation, velocity }` | بدأ / انتهى تدوير مرتبط بـ `rotation`. |
| `onAccessibilityAction` | `.on_accessibility_action` | `{ actionName }` | نُفّذ إجراء إمكانية وصول مخصص. |

أحداث اللمس والاستجابة: راجع [الخصائص المشتركة](./index.md#raw-touches-and-the-responder-system).

<a id="desktop-file-drops"></a>

## إسقاط الملفات على سطح المكتب

على AppKit وGTK وWin32 وGPUI، يستقبل الـ view الذي يملك `onFileDrop` الملفات والمجلدات المحلية المسحوبة من تطبيق
آخر. يتتبع `onFileDragEnter` و`onFileDragLeave` الوجهة النشطة؛ ويستقبل `onFileDrop`
`{ uris: string[] }` بترتيب قائمة الملفات الأصلية. كل عنصر هو عنوان `file:` مطلق تُهرَّب فيه المسافات
والمحارف غير ASCII. حلِّل العنوان للحصول على مسار نظام الملفات بدلًا من إزالة البادئة يدويًا.

```rust tabs
let hovering = signal(false);
let files = signal(Vec::<String>::new());

view()
    .min_h(px(160.0))
    .p_6()
    .on_file_drag_enter(move || hovering.set(true))
    .on_file_drag_leave(move || hovering.set(false))
    .on_file_drop(move |event: &FileDropEvent| {
        files.set(event.uris.clone());
        hovering.set(false);
    })
    .child(text(move || if hovering.get() { "Release files here" } else { "Drop files here" }))
    .child(text(move || files.get().join("\n")))
```

```tsx tabs
const hovering = signal(false);
const files = signal<string[]>([]);

<View
  onFileDragEnter={() => hovering.set(true)}
  onFileDragLeave={() => hovering.set(false)}
  onFileDrop={(event) => {
    files.set(event.uris);
    hovering.set(false);
  }}
  style={{ minHeight: 160, padding: 24 }}
>
  <Text>{hovering() ? "Release files here" : "Drop files here"}</Text>
  <Text>{files().join("\n")}</Text>
</View>
```

أقرب سلف مفعَّل يستمع إلى `onFileDrop` هو من يستقبل الإسقاط. ويحدّ الجذر المشروط (modal) هذا البحث. يزيل `disabled`
مستمعات سحب/إسقاط الملفات؛ ويؤدي الخروج والإلغاء والإكمال وإزالة الوجهة إلى مسح الحالة النشطة.
يعتمد القبول على عملية Copy وعلى الحالة الأصلية المركّبة. ويقرر التطبيق ما إذا كان سيقرأ الملفات المستلمة أو يفتحها أو ينقلها.

<a id="ref-methods"></a>

## طرائق المرجع (Ref)

مرجع الـ view العادي هو `ViewRef`: `focus()` و`blur()` و`measure()`. يعطيك `ref` (`.element_ref(&handle)` في Rust) عقدته، مثلًا لتمريرها إلى
`setAccessibilityFocus` ([واجهة إمكانية الوصول الخاصة بـ `nsh`](../modules/nsh.md#accessibility))، أو لقياسها
(`handle.measure()` في Rust).

<a id="views-inside-text"></a>

## الـ views داخل النص

الـ view الموضوع داخل نص هو مرفق مضمَّن: يستقر على خط الأساس ويلتف مع الكلمات، ويستقبل
ضغطات خاصة به. راجع [النص](./text.md#inline-views-and-images).

<a id="platform-notes"></a>

## ملاحظات حول المنصات

- يرسم `boxShadow` على كل المنصات؛ أما `android={{ elevation }}` فيعطي ظل Material الخاص بـ Android بدلًا منه. وعلى Android يحتاج الظل إلى
  لون خلفية (فالـ view ذو الخلفية الشفافة لا يلقي ظلًا).
- `filter` على الـ views: يدعم iOS `opacity()` و`brightness()` حتى 1 و`drop-shadow()` (وتقبل الصور كل مرشحات
  الألوان و`blur()`)؛ ويدعمها Android كلها ابتداءً من API 31، ومرشحات الألوان فقط دون ذلك.
- `backdropFilter: "blur(…)"` مادة نظام على iOS (تقريبية) ويتطلب API 31 على Android.
- يرسم Android تحويلات `translate` و`scale` و`rotate`؛ أما التحويلات المائلة (`skew()`، `skewX()`، `skewY()`) فتُطبَّق على المنصات الأخرى.
- يرسم `borderCurve: "continuous"` (`.border_curve(BorderCurve::Continuous)`) زوايا تنساب نحو الحواف (كما في
  أيقونات تطبيقات iOS)، على المنصتين.
- يُطبَّق النمط `cursor` حيثما يوجد مؤشر (Mac Catalyst، وiPad مع مؤشر، وأجهزة سطح المكتب).
