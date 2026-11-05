---
title: "Canvas"
description: "L'elemento Canvas: disegno personalizzato con un contesto 2D, riprodotto in modo nativo."
order: 60
group: primitives
demo: el-canvas
source_hash: db2829bf8681ec52
---

# Canvas

Un canvas è una view che disegni tu stesso con una API di disegno 2D, quella dell'HTML Canvas 2D API: grafici, indicatori, anelli, firme, forme personalizzate. Il codice di disegno registra le operazioni; la piattaforma le riesegue in modo nativo (Core Graphics su iOS e Mac Catalyst, `android.graphics.Canvas` su Android) alla risoluzione dello schermo. In Rust se ne crea uno con `canvas(painter)`, un `Painter` che registra il disegno; in TSX con `<Canvas>` da `nsh` e la sua funzione `draw`.

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

In TSX, `Canvas` crea la view canvas nativa, ne misura le dimensioni ed esegue la tua funzione `draw` con un contesto e la dimensione del canvas (vedi la [Canvas API](../modules/nsh-canvas.md)). In Rust, `canvas(..)` accetta un `Painter`, oppure una closure che ne restituisce uno: la closure disegna di nuovo quando cambia ciò che legge, e la dimensione proviene da `on_layout` quando il disegno ne dipende.

## Props

Un canvas accetta le prop di una [view](./view.md) (stili, prop di pressione e gesture, `onLayout`, accessibilità, `ref`, …) più:

| Prop | Rust | Tipo | Descrizione |
|---|---|---|---|
| `draw` | `canvas(painter)` | `(cx: CanvasRenderingContext2D, size: { width: number; height: number }) => void` | Disegna il canvas. Viene eseguita quando la dimensione è nota, di nuovo quando il canvas viene ridimensionato e di nuovo quando cambiano i signal che legge. |

Assegna una dimensione al canvas tramite i suoi stili (width / height, `flex`, un aspect ratio): la sua dimensione è quella che gli danno gli stili.

<a id="when-it-redraws"></a>

## Quando si ridisegna

Il disegno viene tracciato come un effect: leggere un signal al suo interno iscrive il disegno a quel signal.

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

Numeri e colori possono anche essere [valori animati nativi](../modules/nsh.md#animation) (`CanvasNumber`, `CanvasPaint`; in Rust un `&AnimatedValue` ovunque sia previsto un numero): la piattaforma allora ridisegna da sé mentre si animano, senza alcun lavoro per frame nel codice dell'app.

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

## Il contesto

`CanvasRenderingContext2D` è un sottoinsieme di quello del browser, e `Painter` ha le stesse operazioni come metodi in snake case (`move_to`, `line_to`, `fill_rect`, `fill_text`, `stroke_color`, …): lo stack dello stato (`save`, `restore`), le trasformazioni, i path (`moveTo`, `lineTo`, `arc`, `arcTo`, `ellipse`, `rect`, `roundRect`, curve di Bézier), `fill` / `stroke` / `clip` (anche di un `Path2D`, che accetta dati di path SVG; `fill_svg` / `stroke_svg` in Rust), rettangoli, testo (`fillText`, `strokeText`, `measureText`), gradienti lineari / radiali / conici, tratteggi delle linee, ombre, `globalAlpha`, `globalCompositeOperation` e `drawImage` (immagini tramite URL o asset). Ogni membro è elencato nel [riferimento della Canvas API](../modules/nsh-canvas.md); la [guida al canvas](../docs/canvas.md) illustra come disegnare grafici e grafica animata.

Le coordinate sono in punti, con l'origine in alto a sinistra. `measureText` è sincrono e restituisce `width`. Anche `Painter` di Rust risponde agli hit test (`is_point_in_path`, `is_point_in_stroke`).

Il contesto disegna operazioni vettoriali e immagini: l'accesso ai pixel (`getImageData` / `putImageData`), `filter` e le immagini SVG ne sono escluse.

<a id="events"></a>

## Eventi

Gli [eventi delle view](./view.md#events): `onPress`, `onLayout`, gesture e tocchi. Per gestire i tap relativi al disegno, leggi `locationX` / `locationY` in `onTouchEnd`, oppure segui un trascinamento con `onResponderMove` (`.on_responder_move(..)` in Rust, con `e.location`).

<a id="ref-methods"></a>

## Metodi del ref

Nessuno specifico.
