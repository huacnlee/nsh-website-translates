---
title: "Canvas"
description: "Disegnare su un canvas in Rust e TSX: le operazioni 2D, i percorsi e i dati di percorso SVG, i gradienti, il testo, le immagini, il ridisegno a partire dai signal e l'animazione dei disegni con valori animati."
order: 44
group: ui
demo: guide-canvas
source_hash: a49acbd4da5a3c5f
---

# Canvas

Un canvas è una view in cui si disegna con le operazioni dell'API HTML Canvas 2D: grafici, anelli di progresso, indicatori, firme, icone personalizzate, qualsiasi cosa sia più semplice da disegnare che da costruire con delle view. In Rust, `canvas(..)` mostra ciò che un `Painter` ha registrato; in TSX, `Canvas` da `nsh` accetta una funzione `draw` che registra il disegno in un'unica passata. La piattaforma lo riproduce in modo nativo (Core Graphics su iOS, `android.graphics.Canvas` su Android) alla risoluzione dello schermo, quindi i disegni restano nitidi a qualsiasi densità di pixel.

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

Un canvas accetta tutto ciò che accetta una [view](../elements/view.md) (stili, classi, gestori di tocco, accessibilità, ref) più il proprio disegno. Ha bisogno di una dimensione dal suo stile o dal layout; il suo contenuto è il disegno. Le coordinate sono in punti, con l'origine in alto a sinistra.

<a id="when-the-drawing-is-made"></a>

## Quando viene eseguito il disegno

In Rust, `canvas(move || ..)` registra all'interno di un binding: la closure viene eseguita una volta, e di nuovo quando cambia un [signal](./reactivity.md) che ha letto. Un disegno che dipende dalla dimensione del canvas mantiene in un signal la dimensione ottenuta da `.on_layout(..)` e la legge, come sopra. In TSX, `draw(cx, { width, height })` viene eseguito:

- una volta che la dimensione del canvas è nota (dopo il primo layout);
- di nuovo quando il canvas viene ridimensionato;
- di nuovo quando cambia un signal che ha letto.

Ogni esecuzione sostituisce l'intero disegno. Leggere i signal durante il disegno è il modo in cui un canvas segue i tuoi dati:

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

Le chiamate di disegno si limitano a registrare: il disegno viene realizzato dalla piattaforma al termine della registrazione, quindi i pixel non possono essere riletti. La registrazione viene inviata alla piattaforma come un'unica operazione.

<a id="the-2d-operations"></a>

## Le operazioni 2D

Le operazioni sono un sottoinsieme dell'API HTML Canvas 2D: `CanvasRenderingContext2D` in TSX, e i metodi di `Painter` in Rust, con nomi in stile Rust (`begin_path`, `fill_rect`, `line_width`, `set_transform`, `draw_image`, ...; colori tramite `fill_color` / `stroke_color`, gradienti tramite `fill_style` / `stroke_style`). Ciò che è supportato:

**Stato**

| Membro | Rust | Descrizione |
|---|---|---|
| `save()`, `restore()` | `.save()`, `.restore()` | Salvano e ripristinano lo stato di disegno (stili, trasformazione, clip). |
| `fillStyle`, `strokeStyle` | `.fill_color(..)`, `.fill_style(..)`, `.stroke_color(..)`, `.stroke_style(..)` | Un colore CSS, un gradiente o un valore animato che interpola i colori. |
| `lineWidth`, `lineCap`, `lineJoin`, `miterLimit` | `.line_width(..)`, `.line_cap(..)`, `.line_join(..)`, `.miter_limit(..)` | Forma del tratto. |
| `setLineDash(segments)`, `getLineDash()`, `lineDashOffset` | `.line_dash(..)`, `.line_dash_offset(..)` | Tratteggi. |
| `globalAlpha` | `.global_alpha(..)` | Opacità di ciò che viene disegnato dopo, da 0 a 1. |
| `globalCompositeOperation` | `.composite(Composite::DestinationOut)` | Come si combina: `"source-over"`, `"destination-out"`, `"multiply"`, `"screen"`, ... |
| `shadowColor`, `shadowBlur`, `shadowOffsetX`, `shadowOffsetY` | `.shadow(color, blur, offset)` | Ombre. |
| `font` | `.font(..)` | Forma abbreviata CSS `font`: `"600 14px Inter"` (dimensioni in px, pt o rem); `small-caps` e le forme numeriche `tabular-nums`, `oldstyle-nums`, ... possono precedere la dimensione. |
| `fontVariantNumeric` | `.font_variant_numeric(..)` | `"tabular-nums"` rende tutte le cifre della stessa larghezza, così i numeri che cambiano (contatori, prezzi, etichette degli assi) non tremolano; anche `"proportional-nums"`, `"oldstyle-nums"`, `"lining-nums"`, `"normal"`. Un'aggiunta di NSH (`font-variant-numeric` di CSS); impostare `font` lo mantiene. I browser lo ignorano. |
| `textAlign`, `textBaseline` | `.text_align(..)`, `.text_baseline(..)` | Posizionamento del testo. |

**Trasformazioni**: `translate(x, y)`, `scale(x, y)`, `rotate(angle)` (radianti, in senso orario), `transform(a, b, c, d, e, f)`, `setTransform(a, b, c, d, e, f)`, `resetTransform()`.

**Percorsi**: `beginPath()`, `moveTo`, `lineTo`, `quadraticCurveTo`, `bezierCurveTo`, `arc`, `arcTo`, `ellipse`, `rect`, `roundRect(x, y, w, h, radii)`, `closePath()`; poi `fill(rule?)`, `stroke()` e `clip(rule?)`, ciascuno accettabile anche con un percorso (`fill_path`, `stroke_path`, `clip_path` in Rust). Le regole di riempimento sono `"nonzero"` e `"evenodd"`.

**Rettangoli**: `fillRect`, `strokeRect`, `clearRect`.

**Testo**: `fillText(text, x, y, maxWidth?)`, `strokeText(...)`, `measureText(text)` (misurato in modo sincrono dal motore di testo della piattaforma con il `font` corrente; solo `width`). In Rust, `measure_text(font, text)` restituisce la larghezza.

**Hit testing**: `isPointInPath(path?, x, y, rule?)` e `isPointInStroke(path?, x, y)` (`path_contains`, `stroke_contains`, `is_point_in_path` e `is_point_in_stroke` su un `Painter`) rispondono in modo sincrono, calcolati dalla geometria registrata (la trasformazione corrente, il percorso, `lineWidth` e `lineCap`). Conserva il disegno e i percorsi che hai disegnato per trovare la forma sotto un tocco:

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

I tratti vengono verificati con giunzioni arrotondate e senza tratteggi; le coordinate fornite come valori animati contano come 0.

**Gradienti**: `createLinearGradient`, `createRadialGradient`, `createConicGradient`, ciascuno con `addColorStop(offset, color)` (`CanvasGradient::linear`, `radial`, `conic` e `add_color_stop` in Rust).

**Immagini**: `drawImage(image, dx, dy)`, `drawImage(image, dx, dy, dw, dh)`, `drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh)` (`draw_image(url, dest)` e `draw_image_part(..)` in Rust).

`cx.canvas.width` e `cx.canvas.height` restituiscono la dimensione del canvas in punti in TSX.

**L'insieme supportato**: operazioni di disegno. I pixel sono scritti dalla piattaforma, quindi `getImageData` / `putImageData` e altri accessi ai pixel ne sono esclusi, così come `filter` e le immagini SVG in `drawImage`. Un colore o un font non valido scarta quella singola operazione, come in HTML Canvas.

<a id="paths-and-svg-path-data"></a>

## Percorsi e dati di percorso SVG

Un percorso costruito una sola volta può essere riempito, tracciato o usato come clip molte volte: `svg_path(d)` in Rust, `Path2D` in TSX. Entrambi accettano dati di percorso SVG, analizzati in modo nativo, il che semplifica la creazione di icone:

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

Un `Path2D` ha gli stessi metodi di percorso del contesto (`moveTo`, `arc`, `roundRect`, ...) e `addPath(other)`. `new Path2D(other)` copia un percorso.

<a id="gradients"></a>

## Gradienti

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

Un gradiente conico (`createConicGradient(startAngle, x, y)`, `CanvasGradient::conic(start_angle, center)`) fa ruotare i colori attorno a un punto; il suo angolo iniziale è in radianti, in senso orario a partire dall'asse x. Un gradiente conico su un arco tracciato produce un anello di progresso con gradiente.

<a id="text"></a>

## Testo

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

Le famiglie di font sono le stesse degli stili: famiglie di sistema e nomi dei font inclusi nella tua app (vedi [Fonts](./fonts.md)).

<a id="images"></a>

## Immagini

Per disegnare un'immagine serve un URL in Rust (quello di un asset è `LOGO.url`), e un URL o un asset importato (`import logo from "./logo.png"`) in TSX. L'immagine viene caricata in modo nativo e il canvas ridisegna una volta completato il caricamento, quindi non devi tenere traccia del caricamento. Gli URL remoti sono soggetti alle [network capabilities](./sandbox-and-capabilities.md) dell'app.

I canvas su iOS, macOS, Android, Windows, Linux e GPUI disegnano immagini bitmap (PNG, JPEG, GIF, WebP, ...); su queste piattaforme, una sorgente SVG è un'immagine che non si carica, e il log ne riporta il nome. Mostra le immagini SVG con [`<Image>`](./images-and-assets.md#svg-images), oppure disegna le loro forme come percorsi `Path2D`. Sul web, un canvas disegna ciò che disegna il browser, SVG incluso.

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

La forma a nove argomenti (`draw_image_part`) accetta il rettangolo sorgente nei pixel dell'immagine.

<a id="driving-drawings-with-animated-values"></a>

## Guidare i disegni con valori animati

Qualsiasi argomento numerico di una chiamata di disegno, e i paint di riempimento e di tratto, può essere un [valore animato](./animation.md#animated-values) o un nodo da esso derivato. Tali argomenti vengono letti mentre la piattaforma disegna e, quando il valore si anima, la piattaforma ridisegna da sola, a ogni frame, senza registrare di nuovo il disegno e senza eseguire alcun tuo codice.

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

L'angolo finale dell'arco è `progress.mul(2π).sub(π/2)`: un nodo, quindi l'anello si espande in modo nativo per 900 ms mentre il disegno è stato registrato una sola volta (e una seconda volta per l'etichetta, che legge un signal). La lancetta dei secondi di un orologio funziona allo stesso modo: `rotate(seconds.mul(π / 30))` con `seconds` animato in modo lineare.

I colori si animano nello stesso modo: `.fill_style(&t.interpolate_colors(&[0.0, 1.0], &[rgb(0x54aeff), rgb(0xcf222e)]))` in Rust, `cx.fillStyle = t.interpolate({ inputRange: [0, 1], outputRange: ["#54aeff", "#cf222e"] })` in TSX.

<a id="touch-on-a-canvas"></a>

## Tocco su un canvas

Un canvas è una view, quindi accetta pressioni e il [responder system](./touch-and-gestures.md#the-responder-system). Il disegno a mano libera registra i punti in un signal e li disegna:

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

## Prestazioni

- Un disegno viene registrato in Rust (in TSX, come chiamate JS al contesto) e arriva alla piattaforma come un'unica operazione; non c'è alcun attraversamento del bridge per ogni chiamata.
- Ogni disegno registra di nuovo tutto. Mantieni il lavoro proporzionale a ciò che viene mostrato, e tieni i dati che cambiano a ogni frame in valori animati anziché in signal.
- Dividi un disegno che ha una parte statica e una che cambia di frequente in due canvas sovrapposti, così se ne ridisegna uno solo.
- All'interno di una scroll view con zoom, i canvas vengono ridisegnati alla risoluzione dello zoom al termine dello zoom.

<a id="related"></a>

## Correlati

- [Elemento `Canvas`](../elements/canvas.md): il riferimento.
- [Animation](./animation.md): valori animati, `interpolate` e `Easing`.
- [Immagini e asset](./images-and-assets.md): le immagini dell'app.
