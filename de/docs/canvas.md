---
title: "Canvas"
description: "Zeichnen auf einem Canvas in Rust und TSX - die 2D-Operationen, Pfade und SVG-Pfaddaten, Farbverläufe, Text, Bilder, Neuzeichnen anhand von Signals und Animieren von Zeichnungen mit animierten Werten."
order: 44
group: ui
demo: guide-canvas
source_hash: a49acbd4da5a3c5f
---


# Canvas

Ein Canvas ist eine View, in die du mit den Operationen der HTML Canvas 2D API zeichnest: Diagramme, Fortschrittsringe, Messinstrumente, Signaturen, eigene Icons, kurz alles, was sich leichter zeichnen als aus Views zusammenbauen lässt. In Rust zeigt `canvas(..)`, was ein `Painter` aufgezeichnet hat; in TSX nimmt `Canvas` aus `nsh` eine `draw`-Funktion entgegen, die die Zeichnung in einem Durchgang aufzeichnet. Die Plattform spielt sie nativ ab (Core Graphics auf iOS, `android.graphics.Canvas` auf Android), und zwar in der Auflösung des Bildschirms, sodass Zeichnungen bei jeder Pixeldichte scharf bleiben.

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

Ein Canvas unterstützt alles, was eine [View](../elements/view.md) unterstützt (Styles, Klassen, Touch-Handler, Accessibility, Refs), und zusätzlich seine Zeichnung. Er braucht eine Größe aus seinem Style oder Layout; sein Inhalt ist die Zeichnung. Koordinaten werden in Punkten angegeben, der Ursprung liegt oben links.

<a id="when-the-drawing-is-made"></a>

## Wann die Zeichnung erstellt wird

In Rust zeichnet `canvas(move || ..)` in einem Binding auf: Die Closure läuft einmal und erneut, sobald sich ein [Signal](./reactivity.md) ändert, das sie gelesen hat. Eine Zeichnung, die von der Größe des Canvas abhängt, hält die Größe aus `.on_layout(..)` in einem Signal und liest sie, wie oben gezeigt. In TSX läuft `draw(cx, { width, height })`:

- sobald die Größe des Canvas bekannt ist (nach seinem ersten Layout);
- erneut, wenn die Größe des Canvas geändert wird;
- erneut, wenn sich ein Signal ändert, das gelesen wurde.

Jeder Durchlauf ersetzt die gesamte Zeichnung. Indem du beim Zeichnen Signale liest, folgt ein Canvas deinen Daten:

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

Zeichenaufrufe zeichnen nur auf: Die Zeichnung wird von der Plattform erstellt, nachdem die Aufzeichnung abgeschlossen ist, daher werden keine Pixel zurückgelesen. Die Aufzeichnung wird als eine einzige Operation an die Plattform gesendet.

<a id="the-2d-operations"></a>

## Die 2D-Operationen

Die Operationen sind eine Teilmenge der HTML Canvas 2D API: `CanvasRenderingContext2D` in TSX und die Methoden von `Painter` in Rust, mit Rust-Namen (`begin_path`, `fill_rect`, `line_width`, `set_transform`, `draw_image`, ...; Farben über `fill_color` / `stroke_color`, Verläufe über `fill_style` / `stroke_style`). Unterstützt werden:

**Zustand**

| Member | Rust | Beschreibung |
|---|---|---|
| `save()`, `restore()` | `.save()`, `.restore()` | Zeichenzustand (Styles, Transformation, Clip) auf den Stack legen und wieder entfernen. |
| `fillStyle`, `strokeStyle` | `.fill_color(..)`, `.fill_style(..)`, `.stroke_color(..)`, `.stroke_style(..)` | Eine CSS-Farbe, ein Verlauf oder ein animierter Wert, der Farben interpoliert. |
| `lineWidth`, `lineCap`, `lineJoin`, `miterLimit` | `.line_width(..)`, `.line_cap(..)`, `.line_join(..)`, `.miter_limit(..)` | Form der Linie. |
| `setLineDash(segments)`, `getLineDash()`, `lineDashOffset` | `.line_dash(..)`, `.line_dash_offset(..)` | Strichmuster. |
| `globalAlpha` | `.global_alpha(..)` | Deckkraft dessen, was als Nächstes gezeichnet wird, 0..1. |
| `globalCompositeOperation` | `.composite(Composite::DestinationOut)` | Wie es sich verbindet: `"source-over"`, `"destination-out"`, `"multiply"`, `"screen"`, ... |
| `shadowColor`, `shadowBlur`, `shadowOffsetX`, `shadowOffsetY` | `.shadow(color, blur, offset)` | Schatten. |
| `font` | `.font(..)` | CSS-Kurzschreibweise `font`: `"600 14px Inter"` (Größen in px, pt oder rem); `small-caps` und die Zahlenformen `tabular-nums`, `oldstyle-nums`, ... dürfen vor der Größe stehen. |
| `fontVariantNumeric` | `.font_variant_numeric(..)` | `"tabular-nums"` gibt allen Ziffern dieselbe Breite, sodass sich ändernde Zahlen (Zähler, Preise, Achsenbeschriftungen) nicht springen; außerdem `"proportional-nums"`, `"oldstyle-nums"`, `"lining-nums"`, `"normal"`. Eine Ergänzung von NSH (CSS kennt `font-variant-numeric`); das Setzen von `font` behält sie bei. Browser ignorieren sie. |
| `textAlign`, `textBaseline` | `.text_align(..)`, `.text_baseline(..)` | Textplatzierung. |

**Transformationen**: `translate(x, y)`, `scale(x, y)`, `rotate(angle)` (Bogenmaß, im Uhrzeigersinn), `transform(a, b, c, d, e, f)`, `setTransform(a, b, c, d, e, f)`, `resetTransform()`.

**Pfade**: `beginPath()`, `moveTo`, `lineTo`, `quadraticCurveTo`, `bezierCurveTo`, `arc`, `arcTo`, `ellipse`, `rect`, `roundRect(x, y, w, h, radii)`, `closePath()`; dann `fill(rule?)`, `stroke()` und `clip(rule?)`, die jeweils auch einen Pfad entgegennehmen (`fill_path`, `stroke_path`, `clip_path` in Rust). Füllregeln sind `"nonzero"` und `"evenodd"`.

**Rechtecke**: `fillRect`, `strokeRect`, `clearRect`.

**Text**: `fillText(text, x, y, maxWidth?)`, `strokeText(...)`, `measureText(text)` (synchron von der Text-Engine der Plattform mit dem aktuellen `font` gemessen; nur `width`). In Rust liefert `measure_text(font, text)` die Breite.

**Hit-Testing**: `isPointInPath(path?, x, y, rule?)` und `isPointInStroke(path?, x, y)` (`path_contains`, `stroke_contains`, `is_point_in_path` und `is_point_in_stroke` auf einem `Painter`) antworten synchron und werden aus der aufgezeichneten Geometrie berechnet (aktuelle Transformation, Pfad, `lineWidth` und `lineCap`). Behalte die Zeichnung und die gezeichneten Pfade, um die Form unter einem Tap zu finden:

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

Linien werden mit runden Verbindungen und ohne Strichmuster getestet; Koordinaten, die als animierte Werte angegeben sind, zählen als 0.

**Verläufe**: `createLinearGradient`, `createRadialGradient`, `createConicGradient`, jeweils mit `addColorStop(offset, color)` (`CanvasGradient::linear`, `radial`, `conic` und `add_color_stop` in Rust).

**Bilder**: `drawImage(image, dx, dy)`, `drawImage(image, dx, dy, dw, dh)`, `drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh)` (`draw_image(url, dest)` und `draw_image_part(..)` in Rust).

`cx.canvas.width` und `cx.canvas.height` liefern in TSX die Größe des Canvas in Punkten.

**Die unterstützte Menge**: Zeichenoperationen. Pixel werden von der Plattform geschrieben, daher gehören `getImageData` / `putImageData` und anderer Pixelzugriff nicht dazu, ebenso wenig `filter` und SVG-Bilder in `drawImage`. Eine ungültige Farbe oder Schrift verwirft genau diese eine Operation, wie bei HTML Canvas.

<a id="paths-and-svg-path-data"></a>

## Pfade und SVG-Pfaddaten

Ein einmal erstellter Pfad lässt sich beliebig oft füllen, zeichnen oder als Clip verwenden: `svg_path(d)` in Rust, `Path2D` in TSX. Beide nehmen SVG-Pfaddaten entgegen, die nativ geparst werden, was Icons einfach macht:

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

Ein `Path2D` hat dieselben Pfadmethoden wie der Kontext (`moveTo`, `arc`, `roundRect`, ...) und `addPath(other)`. `new Path2D(other)` kopiert einen Pfad.

<a id="gradients"></a>

## Verläufe

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

Ein konischer Verlauf (`createConicGradient(startAngle, x, y)`, `CanvasGradient::conic(start_angle, center)`) lässt Farben um einen Punkt kreisen; sein Startwinkel ist in Bogenmaß angegeben, im Uhrzeigersinn ab der x-Achse. Ein konischer Verlauf auf einem gezeichneten Bogen ergibt einen Fortschrittsring mit Farbverlauf.

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

Schriftfamilien sind dieselben wie in Styles: Systemfamilien und die Namen der Schriften, die deine App mitliefert (siehe [Fonts](./fonts.md)).

<a id="images"></a>

## Bilder

Zum Zeichnen eines Bildes wird in Rust eine URL verwendet (die eines Assets ist `LOGO.url`), in TSX eine URL oder ein importiertes Asset (`import logo from "./logo.png"`). Das Bild wird nativ geladen, und der Canvas zeichnet erneut, sobald es geladen ist, sodass du den Ladezustand nicht selbst verfolgen musst. Für Remote-URLs gelten die [Netzwerk-Capabilities](./sandbox-and-capabilities.md) der App.

Canvases auf iOS, macOS, Android, Windows, Linux und GPUI zeichnen Bitmap-Bilder (PNG, JPEG, GIF, WebP, ...); auf diesen Plattformen ist eine SVG-Quelle ein Bild, das nicht geladen werden kann, und das Log nennt sie. Zeige SVG-Bilder mit [`<Image>`](./images-and-assets.md#svg-images) an oder zeichne ihre Formen als `Path2D`-Pfade. Im Web zeichnet ein Canvas, was der Browser zeichnet, einschließlich SVG.

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

Die Form mit neun Argumenten (`draw_image_part`) nimmt das Quellrechteck in den Pixeln des Bildes entgegen.

<a id="driving-drawings-with-animated-values"></a>

## Zeichnungen mit animierten Werten steuern

Jedes Zahlenargument eines Zeichenaufrufs sowie die Füll- und Linienfarben können ein [animierter Wert](./animation.md#animated-values) oder ein daraus abgeleiteter Knoten sein. Solche Argumente werden gelesen, während die Plattform zeichnet, und wenn der Wert animiert wird, zeichnet die Plattform von selbst in jedem Frame neu, ohne die Zeichnung erneut aufzuzeichnen und ohne deinen Code auszuführen.

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

Der Endwinkel des Bogens ist `progress.mul(2π).sub(π/2)`: ein Knoten, sodass der Ring 900 ms lang nativ überstreicht, während die Zeichnung nur einmal aufgezeichnet wurde (und einmal mehr für das Label, das ein Signal liest). Der Sekundenzeiger einer Uhr funktioniert genauso: `rotate(seconds.mul(π / 30))` mit linear animiertem `seconds`.

Farben werden auf dieselbe Weise animiert: `.fill_style(&t.interpolate_colors(&[0.0, 1.0], &[rgb(0x54aeff), rgb(0xcf222e)]))` in Rust, `cx.fillStyle = t.interpolate({ inputRange: [0, 1], outputRange: ["#54aeff", "#cf222e"] })` in TSX.

<a id="touch-on-a-canvas"></a>

## Touch auf einem Canvas

Ein Canvas ist eine View und unterstützt daher Presses und das [Responder-System](./touch-and-gestures.md#the-responder-system). Beim Zeichnen mit dem Finger werden Punkte in einem Signal gespeichert und gezeichnet:

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

## Performance

- Eine Zeichnung wird in Rust aufgezeichnet (in TSX als JS-Aufrufe auf den Kontext) und als eine einzige Operation an die Plattform übertragen; es gibt keinen Bridge-Übergang pro Aufruf.
- Jede Zeichnung zeichnet alles neu auf. Halte den Aufwand proportional zu dem, was angezeigt wird, und halte Daten, die sich in jedem Frame ändern, in animierten Werten statt in Signalen.
- Teile eine Zeichnung mit einem statischen und einem häufig wechselnden Teil auf zwei übereinandergelegte Canvases auf, sodass nur einer neu zeichnet.
- In einer zoomenden Scroll-View werden Canvases in der gezoomten Auflösung neu gezeichnet, wenn der Zoom endet.

<a id="related"></a>

## Siehe auch

- [`Canvas`-Element](../elements/canvas.md): die Referenz.
- [Animation](./animation.md): animierte Werte, `interpolate` und `Easing`.
- [Bilder und Assets](./images-and-assets.md): die Bilder der App.
