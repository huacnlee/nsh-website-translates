---
title: "Canvas"
description: "El elemento Canvas: dibujo personalizado con un contexto 2D, reproducido de forma nativa."
order: 60
group: primitives
demo: el-canvas
source_hash: db2829bf8681ec52
---


# Canvas

Un canvas es una vista que dibujas tú mismo con una API de dibujo 2D, la de la HTML Canvas 2D API: gráficos, indicadores, anillos, firmas, formas personalizadas. El código de dibujo registra operaciones; la plataforma las reproduce de forma nativa (Core Graphics en iOS y Mac Catalyst, `android.graphics.Canvas` en Android) a la resolución de la pantalla. Rust crea uno con `canvas(painter)`, un `Painter` que registra el dibujo; TSX, con `<Canvas>` de `nsh` y su función `draw`.

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

En TSX, `Canvas` crea la vista nativa del canvas, la mide y ejecuta tu función `draw` con un contexto y el tamaño del canvas (consulta la [Canvas API](../modules/nsh-canvas.md)). En Rust, `canvas(..)` recibe un `Painter`, o una closure que devuelve uno: la closure vuelve a dibujar cuando cambia lo que lee, y el tamaño proviene de `on_layout` cuando el dibujo depende de él.

## Props

Un canvas acepta las props de una [vista](./view.md) (estilos, props de pulsación y de gestos, `onLayout`, accesibilidad, `ref`, …) además de:

| Prop | Rust | Tipo | Descripción |
|---|---|---|---|
| `draw` | `canvas(painter)` | `(cx: CanvasRenderingContext2D, size: { width: number; height: number }) => void` | Dibuja el canvas. Se ejecuta una vez que se conoce el tamaño, de nuevo cuando el canvas cambia de tamaño y de nuevo cuando cambian las señales que lee. |

Dale un tamaño al canvas mediante sus estilos (width / height, `flex`, una relación de aspecto): su tamaño es el que le dan sus estilos.

<a id="when-it-redraws"></a>

## Cuándo se vuelve a dibujar

El dibujo se rastrea como un efecto: leer una señal dentro de él suscribe el dibujo a esa señal.

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

Los números y los colores también pueden ser [valores animados nativos](../modules/nsh.md#animation) (`CanvasNumber`, `CanvasPaint`; en Rust, un `&AnimatedValue` en cualquier lugar donde vaya un número): la plataforma vuelve a dibujar por sí sola mientras se animan, sin trabajo en el código de la app por cada fotograma.

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

## El contexto

`CanvasRenderingContext2D` es un subconjunto del del navegador, y `Painter` tiene las mismas operaciones como métodos en snake case (`move_to`, `line_to`, `fill_rect`, `fill_text`, `stroke_color`, …): la pila de estados (`save`, `restore`), transformaciones, trazados (`moveTo`, `lineTo`, `arc`, `arcTo`, `ellipse`, `rect`, `roundRect`, curvas de Bézier), `fill` / `stroke` / `clip` (también de un `Path2D`, que acepta datos de trazado SVG; `fill_svg` / `stroke_svg` en Rust), rectángulos, texto (`fillText`, `strokeText`, `measureText`), degradados lineales / radiales / cónicos, guiones de línea, sombras, `globalAlpha`, `globalCompositeOperation` y `drawImage` (imágenes por URL o desde un asset). Cada miembro figura en la [referencia de la Canvas API](../modules/nsh-canvas.md); la [guía de canvas](../docs/canvas.md) explica paso a paso cómo dibujar gráficos y animaciones.

Las coordenadas están en puntos, con el origen en la esquina superior izquierda. `measureText` es síncrono y devuelve `width`. El `Painter` de Rust también responde a pruebas de impacto (`is_point_in_path`, `is_point_in_stroke`).

El contexto dibuja operaciones vectoriales e imágenes: el acceso a píxeles (`getImageData` / `putImageData`), `filter` y las imágenes SVG quedan fuera.

<a id="events"></a>

## Eventos

Los [eventos de vista](./view.md#events): `onPress`, `onLayout`, gestos y toques. Para gestionar toques relativos al dibujo, lee `locationX` / `locationY` en `onTouchEnd`, o sigue un arrastre con `onResponderMove` (`.on_responder_move(..)` en Rust, con `e.location`).

<a id="ref-methods"></a>

## Métodos de ref

Ninguno propio.
