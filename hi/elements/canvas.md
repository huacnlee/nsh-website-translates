---
title: "Canvas"
description: "Canvas एलिमेंट: 2D कॉन्टेक्स्ट के साथ कस्टम ड्रॉइंग, जिसे नेटिव रूप से रीप्ले किया जाता है।"
order: 60
group: primitives
demo: el-canvas
source_hash: db2829bf8681ec52
---

# Canvas

Canvas एक ऐसा view है जिसे आप 2D drawing API से खुद ड्रॉ करते हैं, यानी HTML Canvas 2D API से: चार्ट, गेज, रिंग, हस्ताक्षर, कस्टम आकृतियाँ। ड्रॉइंग कोड ऑपरेशन रिकॉर्ड करता है; प्लेटफ़ॉर्म उन्हें स्क्रीन के रेज़ोल्यूशन पर नेटिव रूप से दोबारा चलाता है (iOS और Mac Catalyst पर Core Graphics, Android पर `android.graphics.Canvas`)। Rust में इसे `canvas(painter)` से बनाया जाता है, जो ड्रॉइंग को रिकॉर्ड करने वाला `Painter` है; TSX में `nsh` से `<Canvas>` और उसके `draw` फ़ंक्शन से।

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

TSX में `Canvas` नेटिव canvas view बनाता है, उसका आकार मापता है, और आपका `draw` फ़ंक्शन एक context और canvas के आकार के साथ चलाता है ([Canvas API](../modules/nsh-canvas.md) देखें)। Rust में `canvas(..)` एक `Painter` लेता है, या ऐसा क्लोज़र जो उसे लौटाता हो: जब क्लोज़र जो कुछ पढ़ता है वह बदलता है तो वह दोबारा ड्रॉ करता है, और जब ड्रॉइंग आकार पर निर्भर हो तो आकार `on_layout` से मिलता है।

## Props

Canvas एक [view](./view.md) के props लेता है (स्टाइल, press और gesture props, `onLayout`, accessibility, `ref`, …) और साथ में:

| Prop | Rust | Type | विवरण |
|---|---|---|---|
| `draw` | `canvas(painter)` | `(cx: CanvasRenderingContext2D, size: { width: number; height: number }) => void` | Canvas को ड्रॉ करता है। आकार ज्ञात होने पर चलता है, canvas का आकार बदलने पर फिर चलता है, और जब वे signals बदलते हैं जिन्हें यह पढ़ता है तब भी फिर चलता है। |

Canvas को उसकी स्टाइल के ज़रिए आकार दें (width / height, `flex`, aspect ratio): उसका आकार वही होता है जो उसकी स्टाइल उसे देती हैं।

<a id="when-it-redraws"></a>

## यह कब दोबारा ड्रॉ होता है

ड्रॉइंग को एक effect की तरह ट्रैक किया जाता है: इसके अंदर किसी signal को पढ़ने से ड्रॉइंग उस signal की सदस्य बन जाती है।

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

संख्याएँ और रंग [नेटिव animated values](../modules/nsh.md#animation) भी हो सकते हैं (`CanvasNumber`, `CanvasPaint`; Rust में जहाँ भी संख्या आती है वहाँ `&AnimatedValue`): तब प्लेटफ़ॉर्म एनिमेशन के दौरान खुद ही दोबारा ड्रॉ करता है, और ऐप के कोड में प्रति फ़्रेम कोई काम नहीं करना पड़ता।

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

## Context

`CanvasRenderingContext2D` ब्राउज़र वाले का एक उपसमुच्चय है, और `Painter` में वही ऑपरेशन snake case के मेथड के रूप में हैं (`move_to`, `line_to`, `fill_rect`, `fill_text`, `stroke_color`, …): state stack (`save`, `restore`), transforms, paths (`moveTo`, `lineTo`, `arc`, `arcTo`, `ellipse`, `rect`, `roundRect`, Bézier curves), `fill` / `stroke` / `clip` (`Path2D` के भी, जो SVG path data स्वीकार करता है; Rust में `fill_svg` / `stroke_svg`), आयत, टेक्स्ट (`fillText`, `strokeText`, `measureText`), linear / radial / conic gradients, line dashes, shadows, `globalAlpha`, `globalCompositeOperation` और `drawImage` (URL या asset से images)। हर सदस्य [Canvas API reference](../modules/nsh-canvas.md) में सूचीबद्ध है; [canvas guide](../docs/canvas.md) चार्ट और एनिमेटेड ग्राफ़िक्स बनाने की प्रक्रिया समझाती है।

निर्देशांक points में होते हैं और मूल बिंदु ऊपर बाईं ओर होता है। `measureText` सिंक्रोनस है और `width` लौटाता है। Rust का `Painter` hit tests का भी जवाब देता है (`is_point_in_path`, `is_point_in_stroke`)।

Context वेक्टर ऑपरेशन और images ड्रॉ करता है: पिक्सेल एक्सेस (`getImageData` / `putImageData`), `filter` और SVG images इसके दायरे से बाहर हैं।

## Events

[View events](./view.md#events): `onPress`, `onLayout`, gestures और touches। ड्रॉइंग के सापेक्ष टैप संभालने के लिए `onTouchEnd` में `locationX` / `locationY` पढ़ें, या `onResponderMove` से ड्रैग ट्रैक करें (Rust में `.on_responder_move(..)`, `e.location` के साथ)।

## Ref methods

इसके अपने कोई नहीं हैं।
