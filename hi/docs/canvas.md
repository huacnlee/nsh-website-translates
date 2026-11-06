---
title: "Canvas"
description: "Rust और TSX में canvas पर ड्रॉइंग - 2D ऑपरेशन, paths और SVG path data, gradients, टेक्स्ट, इमेज, signals से दोबारा ड्रॉ करना, और animated values के साथ ड्रॉइंग को एनिमेट करना।"
order: 44
group: ui
demo: guide-canvas
source_hash: a49acbd4da5a3c5f
---

# Canvas

Canvas एक ऐसा view है जिसमें आप HTML Canvas 2D API के ऑपरेशन से ड्रॉ करते हैं: चार्ट, प्रोग्रेस रिंग, गेज, हस्ताक्षर, कस्टम आइकन, यानी कुछ भी जिसे views से बनाने की तुलना में ड्रॉ करना आसान हो। Rust में `canvas(..)` वह दिखाता है जो `Painter` ने रिकॉर्ड किया; TSX में `nsh` का `Canvas` एक `draw` फ़ंक्शन लेता है जो ड्रॉइंग को एक बार में रिकॉर्ड करता है। प्लेटफ़ॉर्म इसे नेटिव रूप से (iOS पर Core Graphics, Android पर `android.graphics.Canvas`) स्क्रीन के रिज़ॉल्यूशन पर दोबारा चलाता है, इसलिए ड्रॉइंग किसी भी पिक्सेल डेंसिटी पर तीक्ष्ण रहती हैं।

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

Canvas वह सब कुछ लेता है जो एक [view](../elements/view.md) लेता है (styles, classes, touch handlers, accessibility, refs), साथ में अपनी ड्रॉइंग भी। इसे अपने style या layout से एक आकार चाहिए; इसकी सामग्री ड्रॉइंग है। निर्देशांक points में होते हैं, और मूल बिंदु (origin) ऊपर बाईं ओर होता है।

<a id="when-the-drawing-is-made"></a>

## ड्रॉइंग कब बनाई जाती है

Rust में `canvas(move || ..)` एक binding में रिकॉर्ड करता है: क्लोज़र एक बार चलता है, और जब उसके द्वारा पढ़ा गया कोई [signal](./reactivity.md) बदलता है तो फिर चलता है। जो ड्रॉइंग canvas के आकार पर निर्भर करती है, वह `.on_layout(..)` से मिला आकार एक signal में रखती है और उसे पढ़ती है, जैसा ऊपर दिखाया गया है। TSX में `draw(cx, { width, height })` तब चलता है:

- जब canvas का आकार पता चल जाए (उसके पहले layout के बाद);
- जब canvas का आकार बदले;
- जब उसके द्वारा पढ़ा गया कोई signal बदले।

हर बार चलने पर पूरी ड्रॉइंग बदल जाती है। ड्रॉ करते समय signals को पढ़ना ही वह तरीका है जिससे canvas आपके डेटा का अनुसरण करता है:

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

ड्रॉइंग कॉल केवल रिकॉर्ड करते हैं: ड्रॉइंग रिकॉर्डिंग पूरी होने के बाद प्लेटफ़ॉर्म बनाता है, इसलिए पिक्सेल वापस नहीं पढ़े जाते। रिकॉर्डिंग प्लेटफ़ॉर्म को एक ऑपरेशन के रूप में भेजी जाती है।

<a id="the-2d-operations"></a>

## 2D ऑपरेशन

ये ऑपरेशन HTML Canvas 2D API का एक उपसमूह हैं: TSX में `CanvasRenderingContext2D`, और Rust में `Painter` के मेथड, Rust के नामों के साथ (`begin_path`, `fill_rect`, `line_width`, `set_transform`, `draw_image`, ...; रंग `fill_color` / `stroke_color` के माध्यम से, gradients `fill_style` / `stroke_style` के माध्यम से)। जो समर्थित है:

**State**

| सदस्य | Rust | विवरण |
|---|---|---|
| `save()`, `restore()` | `.save()`, `.restore()` | ड्रॉइंग state (styles, transform, clip) को push और pop करता है। |
| `fillStyle`, `strokeStyle` | `.fill_color(..)`, `.fill_style(..)`, `.stroke_color(..)`, `.stroke_style(..)` | एक CSS रंग, एक gradient, या रंगों को interpolate करने वाला एनिमेटेड मान। |
| `lineWidth`, `lineCap`, `lineJoin`, `miterLimit` | `.line_width(..)`, `.line_cap(..)`, `.line_join(..)`, `.miter_limit(..)` | stroke का आकार। |
| `setLineDash(segments)`, `getLineDash()`, `lineDashOffset` | `.line_dash(..)`, `.line_dash_offset(..)` | डैश। |
| `globalAlpha` | `.global_alpha(..)` | आगे जो ड्रॉ होगा उसकी अपारदर्शिता (opacity), 0..1। |
| `globalCompositeOperation` | `.composite(Composite::DestinationOut)` | वह कैसे मिलता है: `"source-over"`, `"destination-out"`, `"multiply"`, `"screen"`, ... |
| `shadowColor`, `shadowBlur`, `shadowOffsetX`, `shadowOffsetY` | `.shadow(color, blur, offset)` | छाया (Shadows)। |
| `font` | `.font(..)` | CSS `font` शॉर्टहैंड: `"600 14px Inter"` (आकार px, pt या rem में); `small-caps` और संख्या रूप `tabular-nums`, `oldstyle-nums`, ... आकार से पहले आ सकते हैं। |
| `fontVariantNumeric` | `.font_variant_numeric(..)` | `"tabular-nums"` हर अंक को समान चौड़ाई का बनाता है, ताकि बदलती संख्याएँ (काउंटर, कीमतें, अक्ष लेबल) हिलें नहीं; साथ ही `"proportional-nums"`, `"oldstyle-nums"`, `"lining-nums"`, `"normal"`। यह NSH का जोड़ है (CSS का `font-variant-numeric`); `font` सेट करने पर यह बना रहता है। ब्राउज़र इसे अनदेखा करते हैं। |
| `textAlign`, `textBaseline` | `.text_align(..)`, `.text_baseline(..)` | टेक्स्ट की स्थिति। |

**Transforms**: `translate(x, y)`, `scale(x, y)`, `rotate(angle)` (रेडियन, घड़ी की दिशा में), `transform(a, b, c, d, e, f)`, `setTransform(a, b, c, d, e, f)`, `resetTransform()`।

**Paths**: `beginPath()`, `moveTo`, `lineTo`, `quadraticCurveTo`, `bezierCurveTo`, `arc`, `arcTo`, `ellipse`, `rect`, `roundRect(x, y, w, h, radii)`, `closePath()`; फिर `fill(rule?)`, `stroke()` और `clip(rule?)`, जिनमें से हर एक path भी ले सकता है (Rust में `fill_path`, `stroke_path`, `clip_path`)। Fill rules `"nonzero"` और `"evenodd"` हैं।

**Rectangles**: `fillRect`, `strokeRect`, `clearRect`।

**Text**: `fillText(text, x, y, maxWidth?)`, `strokeText(...)`, `measureText(text)` (प्लेटफ़ॉर्म के टेक्स्ट इंजन द्वारा वर्तमान `font` के साथ सिंक्रोनस रूप से मापा जाता है; केवल `width`)। Rust में `measure_text(font, text)` चौड़ाई देता है।

**Hit testing**: `isPointInPath(path?, x, y, rule?)` और `isPointInStroke(path?, x, y)` (`Painter` पर `path_contains`, `stroke_contains`, `is_point_in_path` और `is_point_in_stroke`) सिंक्रोनस रूप से उत्तर देते हैं, जो रिकॉर्ड की गई ज्यामिति (वर्तमान transform, path, `lineWidth` और `lineCap`) से गणना किए जाते हैं। टैप के नीचे का आकार खोजने के लिए ड्रॉइंग और अपने बनाए paths को रखें:

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

Strokes का परीक्षण round joins के साथ और डैश के बिना किया जाता है; एनिमेटेड मानों के रूप में दिए गए निर्देशांक 0 गिने जाते हैं।

**Gradients**: `createLinearGradient`, `createRadialGradient`, `createConicGradient`, हर एक `addColorStop(offset, color)` के साथ (Rust में `CanvasGradient::linear`, `radial`, `conic` और `add_color_stop`)।

**Images**: `drawImage(image, dx, dy)`, `drawImage(image, dx, dy, dw, dh)`, `drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh)` (Rust में `draw_image(url, dest)` और `draw_image_part(..)`)।

TSX में `cx.canvas.width` और `cx.canvas.height` canvas का आकार points में देते हैं।

**समर्थित समूह**: ड्रॉइंग ऑपरेशन। पिक्सेल प्लेटफ़ॉर्म लिखता है, इसलिए `getImageData` / `putImageData` और अन्य पिक्सेल एक्सेस इसके बाहर हैं, साथ ही `filter` और `drawImage` में SVG images भी। अमान्य रंग या फ़ॉन्ट HTML Canvas की तरह केवल उसी एक ऑपरेशन को छोड़ देता है।

<a id="paths-and-svg-path-data"></a>

## Paths और SVG path data

एक बार बनाया गया path कई बार fill, stroke या clip किया जा सकता है: Rust में `svg_path(d)`, TSX में `Path2D`। दोनों SVG path data लेते हैं, जिसे नेटिव रूप से पार्स किया जाता है, इससे आइकन बनाना आसान हो जाता है:

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

`Path2D` में context जैसे ही path मेथड होते हैं (`moveTo`, `arc`, `roundRect`, ...) और `addPath(other)` भी। `new Path2D(other)` एक path की प्रतिलिपि बनाता है।

## Gradients

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

एक conic gradient (`createConicGradient(startAngle, x, y)`, `CanvasGradient::conic(start_angle, center)`) एक बिंदु के चारों ओर रंगों को घुमाता है; इसका प्रारंभिक कोण रेडियन में होता है, x अक्ष से घड़ी की दिशा में। stroke किए गए arc पर conic gradient एक gradient प्रोग्रेस रिंग बनाता है।

## Text

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

फ़ॉन्ट families वही हैं जो styles में हैं: सिस्टम families और आपके ऐप के साथ आने वाले फ़ॉन्ट के नाम (देखें [Fonts](./fonts.md))।

## Images

Image ड्रॉ करने के लिए Rust में एक URL चाहिए (किसी asset का URL `LOGO.url` है), और TSX में एक URL या इम्पोर्ट किया गया asset (`import logo from "./logo.png"`)। Image नेटिव रूप से लोड होती है, और लोड होने के बाद canvas फिर से ड्रॉ करता है, इसलिए आपको लोडिंग खुद ट्रैक करने की ज़रूरत नहीं है। रिमोट URL ऐप की [नेटवर्क क्षमताओं](./sandbox-and-capabilities.md) के अधीन हैं।

iOS, macOS, Android, Windows, Linux और GPUI पर canvases bitmap images (PNG, JPEG, GIF, WebP, ...) ड्रॉ करते हैं; इन पर SVG स्रोत ऐसी image होती है जो लोड नहीं हो पाती, और लॉग में उसका नाम आता है। SVG images को [`<Image>`](./images-and-assets.md#svg-images) से दिखाएँ, या उनके आकारों को `Path2D` paths के रूप में ड्रॉ करें। वेब पर canvas वही ड्रॉ करता है जो ब्राउज़र ड्रॉ करता है, SVG समेत।

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

नौ-आर्ग्युमेंट रूप (`draw_image_part`) स्रोत आयत को image के पिक्सेल में लेता है।

<a id="driving-drawings-with-animated-values"></a>

## एनिमेटेड मानों से ड्रॉइंग को चलाना

ड्रॉइंग कॉल का कोई भी संख्या आर्ग्युमेंट, और fill तथा stroke paints, एक [एनिमेटेड मान](./animation.md#animated-values) या उससे व्युत्पन्न node हो सकते हैं। ऐसे आर्ग्युमेंट तब पढ़े जाते हैं जब प्लेटफ़ॉर्म ड्रॉ करता है, और जब मान एनिमेट होता है, तो प्लेटफ़ॉर्म ड्रॉइंग को दोबारा रिकॉर्ड किए बिना और आपका कोई कोड चलाए बिना, हर फ़्रेम पर अपने आप फिर से ड्रॉ करता है।

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

Arc का अंतिम कोण `progress.mul(2π).sub(π/2)` है: एक node, इसलिए रिंग 900 ms तक नेटिव रूप से घूमती है जबकि ड्रॉइंग एक ही बार रिकॉर्ड हुई (और लेबल के लिए एक बार और, जो एक signal पढ़ता है)। घड़ी की सेकंड की सुई भी इसी तरह काम करती है: `rotate(seconds.mul(π / 30))`, जिसमें `seconds` रैखिक रूप से एनिमेट होता है।

रंग भी इसी तरह एनिमेट होते हैं: Rust में `.fill_style(&t.interpolate_colors(&[0.0, 1.0], &[rgb(0x54aeff), rgb(0xcf222e)]))`, TSX में `cx.fillStyle = t.interpolate({ inputRange: [0, 1], outputRange: ["#54aeff", "#cf222e"] })`।

<a id="touch-on-a-canvas"></a>

## Canvas पर टच

Canvas एक view है, इसलिए यह presses और [responder सिस्टम](./touch-and-gestures.md#the-responder-system) लेता है। उंगली से ड्रॉइंग बिंदुओं को एक signal में रिकॉर्ड करती है और उन्हें ड्रॉ करती है:

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

## प्रदर्शन

- ड्रॉइंग Rust में रिकॉर्ड होती है (TSX में, JS द्वारा context को कॉल करने के रूप में) और प्लेटफ़ॉर्म तक एक ऑपरेशन के रूप में पहुँचती है; प्रति-कॉल कोई bridge crossing नहीं होती।
- हर ड्रॉइंग सब कुछ दोबारा रिकॉर्ड करती है। काम को उतना ही रखें जितना दिखाया जा रहा है, और जो डेटा हर फ़्रेम बदलता है उसे signals के बजाय एनिमेटेड मानों में रखें।
- जिस ड्रॉइंग में एक स्थिर हिस्सा और एक बार-बार बदलने वाला हिस्सा हो, उसे एक के ऊपर एक रखे दो canvases में बाँट दें, ताकि केवल एक ही फिर से ड्रॉ हो।
- ज़ूम होने वाले scroll view के अंदर, ज़ूम समाप्त होने पर canvases ज़ूम किए गए रिज़ॉल्यूशन पर फिर से ड्रॉ होते हैं।

<a id="related"></a>

## संबंधित

- [`Canvas` element](../elements/canvas.md): रेफ़रेंस।
- [Animation](./animation.md): एनिमेटेड मान, `interpolate` और `Easing`।
- [Images and assets](./images-and-assets.md): ऐप की images।
