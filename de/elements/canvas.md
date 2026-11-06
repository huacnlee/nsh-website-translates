---
title: "Canvas"
description: "Das Canvas-Element: benutzerdefiniertes Zeichnen mit einem 2D-Kontext, das nativ wiedergegeben wird."
order: 60
group: primitives
demo: el-canvas
source_hash: db2829bf8681ec52
---


# Canvas

Ein Canvas ist eine View, die du selbst mit einer 2D-Zeichen-API zeichnest, nämlich der der HTML Canvas 2D API: Diagramme, Anzeigen, Ringe, Signaturen, eigene Formen. Der Zeichencode zeichnet Operationen auf; die Plattform spielt sie nativ ab (Core Graphics auf iOS und Mac Catalyst, `android.graphics.Canvas` auf Android), und zwar in der Auflösung des Bildschirms. Rust erzeugt einen Canvas mit `canvas(painter)`, einem `Painter`, das die Zeichnung aufzeichnet; TSX mit `<Canvas>` aus `nsh` und dessen Funktion `draw`.

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

In TSX erzeugt `Canvas` die native Canvas-View, misst sie und führt deine Funktion `draw` mit einem Kontext und der Größe des Canvas aus (siehe die [Canvas API](../modules/nsh-canvas.md)). In Rust nimmt `canvas(..)` ein `Painter` oder eine Closure, die eines zurückgibt: Die Closure zeichnet erneut, wenn sich etwas ändert, das sie liest, und die Größe kommt von `on_layout`, wenn die Zeichnung von ihr abhängt.

## Props

Ein Canvas akzeptiert die Props einer [View](./view.md) (Styles, Press- und Gesten-Props, `onLayout`, Barrierefreiheit, `ref`, …) sowie:

| Prop | Rust | Typ | Beschreibung |
|---|---|---|---|
| `draw` | `canvas(painter)` | `(cx: CanvasRenderingContext2D, size: { width: number; height: number }) => void` | Zeichnet den Canvas. Läuft, sobald die Größe bekannt ist, erneut bei Größenänderung des Canvas und erneut, wenn sich Signals ändern, die darin gelesen werden. |

Gib dem Canvas über seine Styles eine Größe (Breite / Höhe, `flex`, ein Seitenverhältnis): Seine Größe ist die, die seine Styles ihm geben.

<a id="when-it-redraws"></a>

## Wann neu gezeichnet wird

Die Zeichnung wird wie ein Effect verfolgt: Wer in ihr ein Signal liest, abonniert die Zeichnung auf dieses Signal.

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

Zahlen und Farben können auch [native animierte Werte](../modules/nsh.md#animation) sein (`CanvasNumber`, `CanvasPaint`; in Rust ein `&AnimatedValue` überall dort, wo eine Zahl steht): Die Plattform zeichnet dann selbstständig neu, solange sie animiert werden, ohne dass der Code der App pro Frame etwas tun muss.

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

## Der Kontext

`CanvasRenderingContext2D` ist eine Teilmenge des Kontexts im Browser, und `Painter` bietet dieselben Operationen als Methoden in Snake Case (`move_to`, `line_to`, `fill_rect`, `fill_text`, `stroke_color`, …): den State-Stack (`save`, `restore`), Transformationen, Pfade (`moveTo`, `lineTo`, `arc`, `arcTo`, `ellipse`, `rect`, `roundRect`, Bézierkurven), `fill` / `stroke` / `clip` (auch mit einem `Path2D`, der SVG-Pfaddaten akzeptiert; `fill_svg` / `stroke_svg` in Rust), Rechtecke, Text (`fillText`, `strokeText`, `measureText`), lineare / radiale / konische Verläufe, Strichmuster, Schatten, `globalAlpha`, `globalCompositeOperation` und `drawImage` (Bilder per URL oder Asset). Alle Member sind in der [Canvas-API-Referenz](../modules/nsh-canvas.md) aufgeführt; der [Canvas-Leitfaden](../docs/canvas.md) zeigt Schritt für Schritt, wie Diagramme und animierte Grafiken gezeichnet werden.

Koordinaten sind in Punkten angegeben, der Ursprung liegt oben links. `measureText` ist synchron und gibt `width` zurück. Der `Painter` in Rust beantwortet auch Hit-Tests (`is_point_in_path`, `is_point_in_stroke`).

Der Kontext zeichnet Vektoroperationen und Bilder: Pixelzugriff (`getImageData` / `putImageData`), `filter` und SVG-Bilder gehören nicht dazu.

## Events

Die [View-Events](./view.md#events): `onPress`, `onLayout`, Gesten und Touches. Um Taps relativ zur Zeichnung zu behandeln, lies `locationX` / `locationY` in `onTouchEnd` oder verfolge einen Drag mit `onResponderMove` (`.on_responder_move(..)` in Rust, mit `e.location`).

<a id="ref-methods"></a>

## Ref-Methoden

Keine eigenen.
