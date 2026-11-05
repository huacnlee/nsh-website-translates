---
title: "Canvas"
description: "الرسم على Canvas باستخدام Rust وTSX - عمليات الرسم ثنائية الأبعاد، والمسارات وبيانات مسار SVG، والتدرجات اللونية، والنصوص، والصور، وإعادة الرسم استنادًا إلى signals، وتحريك الرسومات باستخدام القيم المتحركة."
order: 44
group: ui
demo: guide-canvas
source_hash: a49acbd4da5a3c5f
---

# Canvas (لوحة الرسم)

الـ canvas هو عنصر عرض ترسم فيه باستخدام عمليات HTML Canvas 2D API: المخططات البيانية، وحلقات التقدم، والمقاييس، والتوقيعات، والأيقونات المخصصة، وأي شيء يكون رسمه أسهل من بنائه من عناصر العرض. في Rust يعرض `canvas(..)` ما سجّله `Painter`؛ وفي TSX يأخذ `Canvas` من `nsh` دالة `draw` تسجّل الرسم دفعة واحدة. تعيد المنصة تشغيل التسجيل محليًا (Core Graphics على iOS، و`android.graphics.Canvas` على Android) بدقة الشاشة، فتبقى الرسومات حادة عند أي كثافة بكسلات.

```rust tabs
use std::f32::consts::TAU;

use nsh_core::prelude::*;

#[component]
pub fn App() -> impl IntoElement {
    let area = signal((0.0_f32, 0.0_f32));
    view().flex_1().p_6().pt(px(60.0)).child(
        canvas(move || {
            let (w, h) = area.get();
            Painter::new()
                .fill_color(rgb(0x0969da))
                .begin_path()
                .arc(w / 2.0, h / 2.0, 60.0, 0.0, TAU)
                .fill()
                .stroke_color(rgb(0x1f2328))
                .line_width(4.0)
                .stroke_rect(bounds(point(px(20.0), px(20.0)), size(px(w - 40.0), px(h - 40.0))))
        })
        .h(px(200.0))
        .rounded(px(12.0))
        .bg(white())
        .on_layout(move |frame: &Bounds<Points>| area.set((frame.size.width.0, frame.size.height.0))),
    )
}
```

```tsx tabs
import { Canvas, mount, View } from "nsh";

function App() {
  return (
    <View style={{ flex: 1, padding: 24, paddingTop: 60 }}>
      <Canvas
        style={{ height: 200, borderRadius: 12, backgroundColor: "#ffffff" }}
        draw={(cx, { width, height }) => {
          cx.fillStyle = "#0969da";
          cx.beginPath();
          cx.arc(width / 2, height / 2, 60, 0, Math.PI * 2);
          cx.fill();
          cx.strokeStyle = "#1f2328";
          cx.lineWidth = 4;
          cx.strokeRect(20, 20, width - 40, height - 40);
        }}
      />
    </View>
  );
}

mount(App);
```

يقبل الـ canvas كل ما يقبله [العرض](../elements/view.md) (الأنماط، والفئات، ومعالجات اللمس، وإمكانية الوصول، والمراجع) إضافةً إلى الرسم الخاص به. ويحتاج إلى حجم يأتي من نمطه أو من التخطيط؛ ومحتواه هو الرسم. الإحداثيات بالنقاط (points)، والأصل في أعلى اليسار.

<a id="when-the-drawing-is-made"></a>

## متى يُنفَّذ الرسم

في Rust يسجّل `canvas(move || ..)` داخل ربط (binding): يعمل الإغلاق (closure) مرة واحدة، ثم يعمل مجددًا عندما تتغير [إشارة](./reactivity.md) قرأها. الرسم الذي يعتمد على حجم الـ canvas يحتفظ بالحجم القادم من `.on_layout(..)` في إشارة ويقرؤه، كما في المثال أعلاه. وفي TSX يعمل `draw(cx, { width, height })`:

- بمجرد أن يصبح حجم الـ canvas معروفًا (بعد أول تخطيط له)؛
- مجددًا عند تغيير حجم الـ canvas؛
- مجددًا عندما تتغير إشارة قرأها.

كل تشغيل يستبدل الرسم كاملًا. وقراءة الإشارات أثناء الرسم هي الطريقة التي يتبع بها الـ canvas بياناتك:

```rust tabs
let values = signal(vec![12.0_f32, 30.0, 22.0, 48.0, 36.0, 60.0]);
let width = signal(0.0_f32);
let height = 160.0;

canvas(move || {
    let w = width.get();
    values.with(|v| {
        let x = |i: usize| i as f32 / (v.len() - 1) as f32 * w;
        let y = |n: f32| height - n / 100.0 * height;
        let mut p = Painter::new().begin_path().move_to(x(0), y(v[0]));
        for (i, &n) in v.iter().enumerate().skip(1) {
            p = p.line_to(x(i), y(n));
        }
        p.stroke_color(rgb(0x3b82f6)).line_width(2.5).line_join(LineJoin::Round).stroke()
    })
})
.h(px(height))
.on_layout(move |frame: &Bounds<Points>| width.set(frame.size.width.0))
```

```tsx tabs
const values = signal([12, 30, 22, 48, 36, 60]);

<Canvas
  style={{ height: 160 }}
  draw={(cx, { width, height }) => {
    const v = values();
    const x = (i: number) => (i / (v.length - 1)) * width;
    const y = (n: number) => height - (n / 100) * height;
    cx.beginPath();
    v.forEach((n, i) => (i === 0 ? cx.moveTo(x(i), y(n)) : cx.lineTo(x(i), y(n))));
    cx.strokeStyle = "#3b82f6";
    cx.lineWidth = 2.5;
    cx.lineJoin = "round";
    cx.stroke();
  }}
/>
```

استدعاءات الرسم تسجّل فقط: الرسم تنفّذه المنصة بعد انتهاء التسجيل، لذلك لا تُقرأ البكسلات مرة أخرى. ويُرسل التسجيل إلى المنصة كعملية واحدة.

<a id="the-2d-operations"></a>

## عمليات 2D

العمليات هي مجموعة فرعية من HTML Canvas 2D API: `CanvasRenderingContext2D` في TSX، وطرق `Painter` في Rust بأسماء Rust (`begin_path`، `fill_rect`، `line_width`، `set_transform`، `draw_image`، ...؛ والألوان عبر `fill_color` / `stroke_color`، والتدرجات عبر `fill_style` / `stroke_style`). المدعوم هو:

**الحالة**

| العضو | Rust | الوصف |
|---|---|---|
| `save()`، `restore()` | `.save()`، `.restore()` | حفظ حالة الرسم (الأنماط، والتحويل، والقص) واستعادتها. |
| `fillStyle`، `strokeStyle` | `.fill_color(..)`، `.fill_style(..)`، `.stroke_color(..)`، `.stroke_style(..)` | لون CSS، أو تدرج، أو قيمة متحركة تقوم بالاستيفاء بين الألوان. |
| `lineWidth`، `lineCap`، `lineJoin`، `miterLimit` | `.line_width(..)`، `.line_cap(..)`، `.line_join(..)`، `.miter_limit(..)` | شكل الخط. |
| `setLineDash(segments)`، `getLineDash()`، `lineDashOffset` | `.line_dash(..)`، `.line_dash_offset(..)` | الخطوط المتقطعة. |
| `globalAlpha` | `.global_alpha(..)` | شفافية ما يُرسم لاحقًا، من 0 إلى 1. |
| `globalCompositeOperation` | `.composite(Composite::DestinationOut)` | طريقة الدمج: `"source-over"`، `"destination-out"`، `"multiply"`، `"screen"`، ... |
| `shadowColor`، `shadowBlur`، `shadowOffsetX`، `shadowOffsetY` | `.shadow(color, blur, offset)` | الظلال. |
| `font` | `.font(..)` | الصيغة المختصرة `font` في CSS: `"600 14px Inter"` (الأحجام بوحدات px أو pt أو rem)؛ ويمكن أن يأتي `small-caps` وصيغ الأرقام `tabular-nums`، `oldstyle-nums`، ... قبل الحجم. |
| `fontVariantNumeric` | `.font_variant_numeric(..)` | `"tabular-nums"` يجعل كل الأرقام بالعرض نفسه، فلا تهتز الأرقام المتغيرة (العدادات، والأسعار، وتسميات المحاور)؛ وكذلك `"proportional-nums"`، `"oldstyle-nums"`، `"lining-nums"`، `"normal"`. إضافة من NSH (يقابل `font-variant-numeric` في CSS)؛ وضبط `font` يُبقي عليه. تتجاهله المتصفحات. |
| `textAlign`، `textBaseline` | `.text_align(..)`، `.text_baseline(..)` | موضع النص. |

**التحويلات**: `translate(x, y)`، `scale(x, y)`، `rotate(angle)` (بالراديان، باتجاه عقارب الساعة)، `transform(a, b, c, d, e, f)`، `setTransform(a, b, c, d, e, f)`، `resetTransform()`.

**المسارات**: `beginPath()`، `moveTo`، `lineTo`، `quadraticCurveTo`، `bezierCurveTo`، `arc`، `arcTo`، `ellipse`، `rect`، `roundRect(x, y, w, h, radii)`، `closePath()`؛ ثم `fill(rule?)`، `stroke()` و`clip(rule?)`، وكلٌّ منها يقبل أيضًا مسارًا (`fill_path`، `stroke_path`، `clip_path` في Rust). قواعد التعبئة هي `"nonzero"` و`"evenodd"`.

**المستطيلات**: `fillRect`، `strokeRect`، `clearRect`.

**النص**: `fillText(text, x, y, maxWidth?)`، `strokeText(...)`، `measureText(text)` (يقيسها محرك النص في المنصة بشكل متزامن باستخدام `font` الحالي؛ فقط `width`). في Rust يعطي `measure_text(font, text)` العرض.

**اختبار الإصابة (Hit testing)**: `isPointInPath(path?, x, y, rule?)` و`isPointInStroke(path?, x, y)` (`path_contains`، `stroke_contains`، `is_point_in_path` و`is_point_in_stroke` على `Painter`) تجيب بشكل متزامن، وتُحسب من الهندسة المسجلة (التحويل الحالي، والمسار، و`lineWidth` و`lineCap`). احتفظ بالرسم وبالمسارات التي رسمتها لتجد الشكل الواقع تحت نقرة:

```rust tabs
let slices: Rc<Vec<Path>> = Rc::new(vec![svg_path("M50 50 L100 50 A50 50 0 0 1 50 100 Z") /* , ... */]);
let draw = {
    let slices = slices.clone();
    move || slices.iter().fold(Painter::new(), |p, s| p.fill_path(s, FillRule::NonZero))
};

canvas(draw.clone())
    .size(px(100.0))
    .claim_touches(TouchClaim::on_start())
    .on_responder_release(move |e: &ResponderEvent| {
        let drawing = draw();
        if let Some(hit) = slices.iter().position(|s| drawing.path_contains(s, e.location, FillRule::NonZero)) {
            selected.set(Some(hit));
        }
    })
```

```tsx tabs
let cx: CanvasRenderingContext2D | undefined;
const slices = [new Path2D("M50 50 L100 50 A50 50 0 0 1 50 100 Z"), /* ... */];

<Canvas
  style={{ width: 100, height: 100 }}
  onStartShouldSetResponder={() => true}
  onResponderRelease={(e) => {
    const hit = slices.findIndex((p) => cx?.isPointInPath(p, e.locationX, e.locationY));
    if (hit >= 0) select(hit);
  }}
  draw={(c) => {
    cx = c;
    slices.forEach((p) => c.fill(p));
  }}
/>
```

تُختبر الخطوط بوصلات مستديرة ودون تقطيع؛ والإحداثيات المعطاة كقيم متحركة تُحتسب 0.

**التدرجات**: `createLinearGradient`، `createRadialGradient`، `createConicGradient`، وكلٌّ منها مع `addColorStop(offset, color)` (`CanvasGradient::linear`، `radial`، `conic` و`add_color_stop` في Rust).

**الصور**: `drawImage(image, dx, dy)`، `drawImage(image, dx, dy, dw, dh)`، `drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh)` (`draw_image(url, dest)` و`draw_image_part(..)` في Rust).

`cx.canvas.width` و`cx.canvas.height` يعطيان حجم الـ canvas بالنقاط في TSX.

**المجموعة المدعومة**: عمليات الرسم. تكتب المنصة البكسلات، لذلك فإن `getImageData` / `putImageData` وأي وصول آخر إلى البكسلات خارجها، وكذلك `filter` وصور SVG في `drawImage`. اللون أو الخط غير الصالح يُسقط تلك العملية وحدها، كما في HTML Canvas.

<a id="paths-and-svg-path-data"></a>

## المسارات وبيانات مسار SVG

يمكن ملء مسار بُني مرة واحدة أو رسم حدوده أو استخدامه للقص مرات عديدة: `svg_path(d)` في Rust، و`Path2D` في TSX. كلاهما يقبل بيانات مسار SVG ويحللها محليًا، مما يسهّل التعامل مع الأيقونات:

```rust tabs
use nsh_core::canvas::{FillRule, svg_path};

const HEART: &str = "M12 21s-7-4.35-9.5-8.5C.5 8.5 3 4 7 4c2 0 3.5 1 5 3 1.5-2 3-3 5-3 4 0 6.5 4.5 4.5 8.5C19 16.65 12 21 12 21z";

fn heart(size: f32, color: Rgba) -> impl IntoElement {
    let path = svg_path(HEART);
    canvas(
        Painter::new()
            .scale(size / 24.0, size / 24.0) // the path is drawn on a 24-point grid
            .fill_color(color)
            .fill_path(&path, FillRule::NonZero),
    )
    .size(px(size))
}
```

```tsx tabs
import { Canvas, Path2D } from "nsh";

const heart = new Path2D("M12 21s-7-4.35-9.5-8.5C.5 8.5 3 4 7 4c2 0 3.5 1 5 3 1.5-2 3-3 5-3 4 0 6.5 4.5 4.5 8.5C19 16.65 12 21 12 21z");

function Heart(props: { size: number; color: string }) {
  return (
    <Canvas
      style={{ width: props.size, height: props.size }}
      draw={(cx) => {
        cx.scale(props.size / 24, props.size / 24); // the path is drawn on a 24-point grid
        cx.fillStyle = props.color;
        cx.fill(heart);
      }}
    />
  );
}
```

يملك `Path2D` طرق المسار نفسها الموجودة في السياق (`moveTo`، `arc`، `roundRect`، ...) إضافةً إلى `addPath(other)`. ويقوم `new Path2D(other)` بنسخ مسار.

<a id="gradients"></a>

## التدرجات

```rust tabs
canvas(move || {
    let (w, h) = (width.get(), 120.0);
    let linear = CanvasGradient::linear(point(px(0.0), px(0.0)), point(px(w), px(0.0)))
        .add_color_stop(percentage(0.0), rgb(0x22d3ee))
        .add_color_stop(percentage(1.0), rgb(0x6366f1));
    let center = point(px(w / 2.0), px(h * 0.75));
    let radial = CanvasGradient::radial(center, px(4.0), center, px(40.0))
        .add_color_stop(percentage(0.0), rgb(0xfde68a))
        .add_color_stop(percentage(1.0), rgb(0xf97316));
    Painter::new()
        .fill_style(linear)
        .fill_rect(0.0, 0.0, w, h / 2.0)
        .fill_style(radial)
        .begin_path()
        .arc(w / 2.0, h * 0.75, 28.0, 0.0, TAU)
        .fill()
})
.h(px(120.0))
.on_layout(move |frame: &Bounds<Points>| width.set(frame.size.width.0))
```

```tsx tabs
<Canvas
  style={{ height: 120 }}
  draw={(cx, { width, height }) => {
    const linear = cx.createLinearGradient(0, 0, width, 0);
    linear.addColorStop(0, "#22d3ee");
    linear.addColorStop(1, "#6366f1");
    cx.fillStyle = linear;
    cx.fillRect(0, 0, width, height / 2);

    const radial = cx.createRadialGradient(width / 2, height * 0.75, 4, width / 2, height * 0.75, 40);
    radial.addColorStop(0, "#fde68a");
    radial.addColorStop(1, "#f97316");
    cx.fillStyle = radial;
    cx.beginPath();
    cx.arc(width / 2, height * 0.75, 28, 0, Math.PI * 2);
    cx.fill();
  }}
/>
```

التدرج المخروطي (`createConicGradient(startAngle, x, y)`، `CanvasGradient::conic(start_angle, center)`) يمرّر الألوان حول نقطة؛ وزاوية بدايته بالراديان، باتجاه عقارب الساعة من المحور x. والتدرج المخروطي على قوس مرسوم الحدود ينتج حلقة تقدم متدرجة.

<a id="text"></a>

## النص

```rust tabs
Painter::new()
    .font("600 20px system-ui")
    .fill_color(rgb(0x1f2328))
    .text_align(CanvasTextAlign::Center)
    .text_baseline(CanvasTextBaseline::Middle)
    .fill_text("72%", width / 2.0, height / 2.0)
    .font("11px system-ui")
    .fill_text("100", 32.0 - 6.0 - measure_text("11px system-ui", "100").0, 16.0)
```

```tsx tabs
cx.font = "600 20px system-ui";
cx.fillStyle = "#1f2328";
cx.textAlign = "center";
cx.textBaseline = "middle";
cx.fillText("72%", width / 2, height / 2);

cx.font = "11px system-ui";
const label = "100";
cx.fillText(label, 32 - 6 - cx.measureText(label).width, 16);
```

عائلات الخطوط هي نفسها المستخدمة في الأنماط: عائلات النظام وأسماء الخطوط التي يشحنها تطبيقك (انظر [الخطوط](./fonts.md)).

<a id="images"></a>

## الصور

يأخذ رسم الصورة عنوان URL في Rust (وعنوان أصل asset هو `LOGO.url`)، وعنوان URL أو أصلًا مستوردًا (`import logo from "./logo.png"`) في TSX. تُحمَّل الصورة محليًا، ويعيد الـ canvas الرسم بعد اكتمال التحميل، فلا تحتاج إلى تتبع التحميل بنفسك. تخضع عناوين URL البعيدة لـ[إمكانات الشبكة](./sandbox-and-capabilities.md) الخاصة بالتطبيق.

تعرض الـ canvas على iOS وmacOS وAndroid وWindows وLinux وGPUI الصور النقطية (PNG وJPEG وGIF وWebP، ...)؛ وعليها يُعدّ مصدر SVG صورة يفشل تحميلها، ويذكر السجل اسمه. اعرض صور SVG باستخدام [`<Image>`](./images-and-assets.md#svg-images)، أو ارسم أشكالها كمسارات `Path2D`. أما على الويب فيرسم الـ canvas ما يرسمه المتصفح، بما في ذلك SVG.

```rust tabs
const LOGO: ImageAsset = asset!("logo.png");

canvas(
    Painter::new()
        .save()
        .begin_path()
        .arc(60.0, 60.0, 56.0, 0.0, TAU)
        .clip() // a round avatar
        .draw_image(LOGO.url, bounds(point(px(4.0), px(4.0)), size(px(112.0), px(112.0))))
        .restore(),
)
.size(px(120.0))
```

```tsx tabs
import { Canvas } from "nsh";
import logo from "./logo.png";

<Canvas
  style={{ width: 120, height: 120 }}
  draw={(cx) => {
    cx.save();
    cx.beginPath();
    cx.arc(60, 60, 56, 0, Math.PI * 2);
    cx.clip(); // a round avatar
    cx.drawImage(logo, 4, 4, 112, 112);
    cx.restore();
  }}
/>
```

الصيغة ذات الوسائط التسعة (`draw_image_part`) تأخذ المستطيل المصدر بوحدات بكسلات الصورة.

<a id="driving-drawings-with-animated-values"></a>

## التحكم بالرسومات عبر القيم المتحركة

يمكن أن يكون أي وسيط رقمي في استدعاء رسم، وكذلك طلاءات التعبئة والخط، [قيمة متحركة](./animation.md#animated-values) أو عقدة مشتقة منها. تُقرأ هذه الوسائط أثناء رسم المنصة، وعندما تتحرك القيمة تعيد المنصة الرسم من تلقاء نفسها، في كل إطار، دون تسجيل الرسم مجددًا ودون تشغيل أي من شيفرتك.

```rust tabs
use std::f32::consts::{FRAC_PI_2, TAU};

use nsh_core::{
    canvas::{CanvasTextAlign, CanvasTextBaseline, LineCap},
    prelude::*,
};

pub fn ring() -> impl IntoElement {
    let progress = animated_value(0.3);
    let label = signal(30_u32);
    let go = move |to: f32| {
        label.set((to * 100.0).round() as u32);
        progress.timing(to, 900.0, Easing::Curve(Curve::Cubic, EaseMode::InOut));
    };
    let (center_x, cy, r) = (70.0, 70.0, 60.0);
    view()
        .flex_1()
        .items_center()
        .justify_center()
        .gap_4()
        .child(
            canvas(move || {
                // The end angle reads the animated value on every frame.
                let end = progress.mul(TAU).sub(FRAC_PI_2);
                Painter::new()
                    .line_width(12.0)
                    .line_cap(LineCap::Round)
                    .stroke_color(rgb(0xe5e7eb))
                    .begin_path()
                    .arc(center_x, cy, r, 0.0, TAU)
                    .stroke()
                    .stroke_color(rgb(0x6366f1))
                    .begin_path()
                    .arc(center_x, cy, r, -FRAC_PI_2, &end)
                    .stroke()
                    .fill_color(rgb(0x1f2328))
                    .font("600 22px system-ui")
                    .text_align(CanvasTextAlign::Center)
                    .text_baseline(CanvasTextBaseline::Middle)
                    .fill_text(&format!("{}%", label.get()), center_x, cy)
            })
            .size(px(140.0)),
        )
        .child(
            text("Animate")
                .text_color(rgb(0x0969da))
                .on_press(move || go(if label.get_untracked() < 50 { 0.85 } else { 0.2 })),
        )
}
```

```tsx tabs
import { Canvas, mount, signal, Text, View } from "nsh";
import { createAnimatedValue, Easing } from "nsh";

function Ring() {
  const progress = createAnimatedValue(0.3);
  const label = signal(30);
  const go = (to: number) => {
    label.set(Math.round(to * 100));
    progress.timing(to, { duration: 900, easing: Easing.inOut(Easing.cubic) });
  };
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 16 }}>
      <Canvas
        style={{ width: 140, height: 140 }}
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
          // The end angle reads the animated value on every frame.
          cx.arc(centerX, cy, r, -Math.PI / 2, progress.mul(Math.PI * 2).sub(Math.PI / 2));
          cx.stroke();
          cx.fillStyle = "#1f2328";
          cx.font = "600 22px system-ui";
          cx.textAlign = "center";
          cx.textBaseline = "middle";
          cx.fillText(`${label()}%`, centerX, cy);
        }}
      />
      <View onPress={() => go(Math.random())}>
        <Text style={{ color: "#0969da" }}>Animate</Text>
      </View>
    </View>
  );
}

mount(Ring);
```

زاوية نهاية القوس هي `progress.mul(2π).sub(π/2)`: عقدة، لذلك تمسح الحلقة محليًا لمدة 900 مللي ثانية بينما سُجّل الرسم مرة واحدة (ومرة أخرى للتسمية التي تقرأ إشارة). ويعمل عقرب الثواني في الساعة بالطريقة نفسها: `rotate(seconds.mul(π / 30))` مع `seconds` متحركة خطيًا.

تتحرك الألوان بالطريقة نفسها: `.fill_style(&t.interpolate_colors(&[0.0, 1.0], &[rgb(0x54aeff), rgb(0xcf222e)]))` في Rust، و`cx.fillStyle = t.interpolate({ inputRange: [0, 1], outputRange: ["#54aeff", "#cf222e"] })` في TSX.

<a id="touch-on-a-canvas"></a>

## اللمس على canvas

الـ canvas عنصر عرض، لذلك يقبل الضغطات و[نظام المستجيبات (responder system)](./touch-and-gestures.md#the-responder-system). الرسم بالإصبع يسجّل النقاط في إشارة ويرسمها:

```rust tabs
let strokes = signal(Vec::<Vec<(f32, f32)>>::new());

canvas(move || {
    strokes.with(|strokes| {
        let mut p = Painter::new().line_width(3.0).line_cap(LineCap::Round).line_join(LineJoin::Round);
        for stroke in strokes {
            p = p.begin_path();
            for (i, &(x, y)) in stroke.iter().enumerate() {
                p = if i == 0 { p.move_to(x, y) } else { p.line_to(x, y) };
            }
            p = p.stroke();
        }
        p
    })
})
.h(px(240.0))
.claim_touches(TouchClaim::on_start())
.keep_touches(true) // a scroll view around must not take the touches
.on_responder_grant(move |e: &ResponderEvent| {
    strokes.update(|s| s.push(vec![(e.location.x.0, e.location.y.0)]))
})
.on_responder_move(move |e: &ResponderEvent| {
    strokes.update(|s| {
        if let Some(stroke) = s.last_mut() {
            stroke.push((e.location.x.0, e.location.y.0));
        }
    })
})
```

```tsx tabs
const strokes = signal<[number, number][][]>([]);

<Canvas
  style={{ height: 240 }}
  onStartShouldSetResponder={() => true}
  onResponderGrant={(e) => {
    strokes.set([...strokes(), [[e.locationX, e.locationY]]]);
    return true; // a scroll view around must not take the touches
  }}
  onResponderMove={(e) => {
    const all = strokes();
    strokes.set([...all.slice(0, -1), [...all[all.length - 1], [e.locationX, e.locationY]]]);
  }}
  draw={(cx) => {
    cx.lineWidth = 3;
    cx.lineCap = "round";
    cx.lineJoin = "round";
    for (const s of strokes()) {
      cx.beginPath();
      s.forEach(([x, y], i) => (i === 0 ? cx.moveTo(x, y) : cx.lineTo(x, y)));
      cx.stroke();
    }
  }}
/>
```

<a id="performance"></a>

## الأداء

- يُسجَّل الرسم في Rust (وفي TSX كاستدعاءات JS على السياق) ويصل إلى المنصة كعملية واحدة؛ فلا يوجد عبور للجسر (bridge) لكل استدعاء.
- كل رسم يعيد تسجيل كل شيء. اجعل العمل متناسبًا مع ما يُعرض، وأبقِ البيانات التي تتغير في كل إطار في قيم متحركة بدل الإشارات.
- قسّم الرسم الذي فيه جزء ثابت وجزء يتغير كثيرًا إلى canvas ين متراكبين فوق بعضهما، بحيث يُعاد رسم أحدهما فقط.
- داخل عرض تمرير يدعم التكبير، يُعاد رسم الـ canvas بدقة التكبير عند انتهاء التكبير.

<a id="related"></a>

## مراجع ذات صلة

- [عنصر `Canvas`](../elements/canvas.md): المرجع.
- [الحركة (Animation)](./animation.md): القيم المتحركة، و`interpolate` و`Easing`.
- [الصور والأصول](./images-and-assets.md): صور التطبيق.
