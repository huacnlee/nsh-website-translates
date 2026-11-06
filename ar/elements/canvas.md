---
title: "Canvas"
description: "عنصر Canvas: رسم مخصص باستخدام سياق ثنائي الأبعاد، تتم إعادة تشغيله بشكل أصلي."
order: 60
group: primitives
demo: el-canvas
source_hash: db2829bf8681ec52
---

# Canvas

الـ canvas هو عرض ترسمه بنفسك باستخدام واجهة رسم ثنائية الأبعاد، هي واجهة HTML Canvas 2D API: مخططات، ومقاييس، وحلقات، وتوقيعات، وأشكال مخصصة. تسجّل شيفرة الرسم العمليات، وتعيد المنصة تشغيلها أصليًا (Core Graphics على iOS وMac Catalyst، و`android.graphics.Canvas` على Android) بدقة الشاشة. يُنشئ Rust واحدًا باستخدام `canvas(painter)`، وهو `Painter` يسجّل الرسم؛ أما TSX فيستخدم `<Canvas>` من `nsh` ودالته `draw`.

```rust tabs
use std::f32::consts::{FRAC_PI_2, TAU};

use nsh_core::{canvas::LineCap, prelude::*};

/// A progress ring, 120 points square.
fn ring(progress: f32) -> impl IntoElement {
    let (center, radius) = (60.0, 50.0);
    canvas(
        Painter::new()
            .line_width(12.0)
            .line_cap(LineCap::Round)
            .stroke_color(rgb(0xe5e7eb))
            .begin_path()
            .arc(center, center, radius, 0.0, TAU)
            .stroke()
            .stroke_color(rgb(0x6366f1))
            .begin_path()
            .arc(center, center, radius, -FRAC_PI_2, -FRAC_PI_2 + progress * TAU)
            .stroke(),
    )
    .size(px(120.0))
}
```

```tsx tabs
import { Canvas, mount } from "nsh";

function Ring(props: { progress: number }) {
  return (
    <Canvas
      style={{ width: 120, height: 120 }}
      draw={(cx, { width, height }) => {
        const centerX = width / 2, cy = height / 2, r = width / 2 - 10;
        cx.lineWidth = 12;
        cx.lineCap = "round";
        cx.strokeStyle = "#e5e7eb";
        cx.beginPath();
        cx.arc(centerX, cy, r, 0, Math.PI * 2);
        cx.stroke();
        cx.strokeStyle = "#6366f1";
        cx.beginPath();
        cx.arc(centerX, cy, r, -Math.PI / 2, -Math.PI / 2 + props.progress * Math.PI * 2);
        cx.stroke();
      }}
    />
  );
}

mount(() => <Ring progress={0.7} />);
```

في TSX، ينشئ `Canvas` عرض canvas الأصلي، ويقيسه، ثم يشغّل الدالة `draw` مع سياق رسم وحجم الـ canvas (راجع [Canvas API](../modules/nsh-canvas.md)). وفي Rust، يقبل `canvas(..)` قيمة `Painter` أو closure تُرجعها: يعيد الـ closure الرسم عندما يتغير ما يقرؤه، ويأتي الحجم من `on_layout` عندما يعتمد الرسم عليه.

<a id="props"></a>

## الخصائص

يقبل الـ canvas خصائص [العرض](./view.md) (الأنماط، وخصائص الضغط والإيماءات، و`onLayout`، وإمكانية الوصول، و`ref`، …) بالإضافة إلى:

| الخاصية | Rust | النوع | الوصف |
|---|---|---|---|
| `draw` | `canvas(painter)` | `(cx: CanvasRenderingContext2D, size: { width: number; height: number }) => void` | يرسم الـ canvas. يعمل بمجرد معرفة الحجم، ويعمل مجددًا عند تغيّر حجم الـ canvas، وكذلك عند تغيّر الإشارات (signals) التي يقرؤها. |

حدّد حجمًا للـ canvas عبر أنماطه (العرض / الارتفاع، و`flex`، ونسبة الأبعاد): حجمه هو الحجم الذي تحدده أنماطه.

<a id="when-it-redraws"></a>

## متى يُعاد الرسم

يُتتبَّع الرسم كما يُتتبَّع الـ effect: قراءة إشارة (signal) داخله تشترك بها شيفرة الرسم.

```rust tabs
let values = signal(vec![12.0_f32, 40.0, 28.0, 64.0]);
let width = signal(0.0_f32);
let height = 160.0;

canvas(move || {
    let data = values.get(); // a change of values redraws
    let step = width.get() / data.len() as f32;
    data.iter().enumerate().fold(Painter::new().fill_color(rgb(0x0969da)), |p, (i, v)| {
        p.fill_rect(i as f32 * step + 4.0, height - v, step - 8.0, *v)
    })
})
.h(px(height))
.on_layout(move |frame: &Bounds<Points>| width.set(frame.size.width.0))
```

```tsx tabs
const values = signal([12, 40, 28, 64]);

<Canvas
  style={{ height: 160 }}
  draw={(cx, { width, height }) => {
    const data = values(); // a change of values() redraws
    const step = width / data.length;
    cx.fillStyle = "#0969da";
    data.forEach((v, i) => cx.fillRect(i * step + 4, height - v, step - 8, v));
  }}
/>;
```

يمكن أن تكون الأرقام والألوان أيضًا [قيمًا متحركة أصلية](../modules/nsh.md#animation) (`CanvasNumber`، `CanvasPaint`؛ وفي Rust تُستخدم `&AnimatedValue` في أي موضع يُوضع فيه رقم): عندها تعيد المنصة الرسم من تلقاء نفسها أثناء حركتها، دون أي عمل في شيفرة التطبيق لكل إطار.

```rust tabs
use std::f32::consts::TAU;

let angle = animated_value(0.0);
angle.timing(TAU, 1000.0, Easing::Linear);

canvas(
    Painter::new()
        .translate(40.0, 40.0)
        .rotate(&angle) // animates natively
        .fill_color(rgb(0xcf222e))
        .fill_rect(-20.0, -4.0, 40.0, 8.0),
)
.size(px(80.0))
```

```tsx tabs
import { Canvas } from "nsh";
import { Animated, createAnimatedValue } from "nsh";

const angle = createAnimatedValue(0);
Animated.timing(angle, { toValue: Math.PI * 2, duration: 1000 }).start();

<Canvas
  style={{ width: 80, height: 80 }}
  draw={(cx) => {
    cx.translate(40, 40);
    cx.rotate(angle); // animates natively
    cx.fillStyle = "#cf222e";
    cx.fillRect(-20, -4, 40, 8);
  }}
/>;
```

<a id="the-context"></a>

## السياق

`CanvasRenderingContext2D` مجموعة فرعية من سياق المتصفح، ولدى `Painter` العمليات نفسها كدوال بصيغة snake case (`move_to`، `line_to`، `fill_rect`، `fill_text`، `stroke_color`، …): مكدّس الحالة (`save`، `restore`)، والتحويلات، والمسارات (`moveTo`، `lineTo`، `arc`، `arcTo`، `ellipse`، `rect`، `roundRect`، ومنحنيات Bézier)، و`fill` / `stroke` / `clip` (ولـ `Path2D` أيضًا، الذي يقبل بيانات مسار SVG؛ و`fill_svg` / `stroke_svg` في Rust)، والمستطيلات، والنص (`fillText`، `strokeText`، `measureText`)، والتدرجات الخطية / الشعاعية / المخروطية، وأنماط الخطوط المتقطعة، والظلال، و`globalAlpha`، و`globalCompositeOperation` و`drawImage` (الصور عبر URL أو asset). كل عضو مدرج في [مرجع Canvas API](../modules/nsh-canvas.md)، ويشرح [دليل canvas](../docs/canvas.md) رسم المخططات والرسومات المتحركة خطوة بخطوة.

الإحداثيات بالنقاط (points) والأصل في أعلى اليسار. `measureText` متزامنة وتُرجع `width`. أما `Painter` في Rust فيجيب أيضًا عن اختبارات الإصابة (hit tests) (`is_point_in_path`، `is_point_in_stroke`).

يرسم السياق العمليات المتجهية والصور: الوصول إلى البكسلات (`getImageData` / `putImageData`) و`filter` وصور SVG خارج نطاقه.

<a id="events"></a>

## الأحداث

[أحداث العرض](./view.md#events): `onPress`، `onLayout`، والإيماءات واللمسات. للتعامل مع النقرات بالنسبة إلى الرسم، اقرأ `locationX` / `locationY` في `onTouchEnd`، أو تتبّع السحب باستخدام `onResponderMove` (`.on_responder_move(..)` في Rust، مع `e.location`).

<a id="ref-methods"></a>

## دوال Ref

لا توجد دوال خاصة به.
