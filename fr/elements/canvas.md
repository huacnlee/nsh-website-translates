---
title: "Canvas"
description: "L'élément Canvas : dessin personnalisé avec un contexte 2D, rejoué nativement."
order: 60
group: primitives
demo: el-canvas
source_hash: db2829bf8681ec52
---

# Canvas

Un canvas est une vue que vous dessinez vous-même avec une API de dessin 2D, celle de l'API HTML Canvas 2D : graphiques, jauges, anneaux, signatures, formes personnalisées. Le code de dessin enregistre des opérations ; la plateforme les rejoue nativement (Core Graphics sur iOS et Mac Catalyst, `android.graphics.Canvas` sur Android) à la résolution de l'écran. Rust en crée un avec `canvas(painter)`, un `Painter` qui enregistre le dessin ; TSX avec `<Canvas>` de `nsh` et sa fonction `draw`.

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

En TSX, `Canvas` crée la vue canvas native, la mesure, puis exécute votre fonction `draw` avec un contexte et la taille du canvas (voir l'[API Canvas](../modules/nsh-canvas.md)). En Rust, `canvas(..)` prend un `Painter`, ou une closure qui en renvoie un : la closure redessine lorsque ce qu'elle lit change, et la taille provient de `on_layout` lorsque le dessin en dépend.

## Props

Un canvas accepte les props d'une [vue](./view.md) (styles, props de pression et de gestes, `onLayout`, accessibilité, `ref`, …) ainsi que :

| Prop | Rust | Type | Description |
|---|---|---|---|
| `draw` | `canvas(painter)` | `(cx: CanvasRenderingContext2D, size: { width: number; height: number }) => void` | Dessine le canvas. S'exécute une fois la taille connue, de nouveau lorsque le canvas est redimensionné, et de nouveau lorsque les signaux qu'il lit changent. |

Donnez une taille au canvas via ses styles (largeur / hauteur, `flex`, un ratio d'aspect) : sa taille est celle que lui donnent ses styles.

<a id="when-it-redraws"></a>

## Quand il se redessine

Le dessin est suivi comme un effet : lire un signal à l'intérieur abonne le dessin à ce signal.

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

Les nombres et les couleurs peuvent aussi être des [valeurs animées natives](../modules/nsh.md#animation) (`CanvasNumber`, `CanvasPaint` ; en Rust, un `&AnimatedValue` partout où un nombre est attendu) : la plateforme redessine alors d'elle-même pendant leur animation, sans aucun travail dans le code de l'application à chaque frame.

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

## Le contexte

`CanvasRenderingContext2D` est un sous-ensemble de celui du navigateur, et `Painter` propose les mêmes opérations sous forme de méthodes en snake case (`move_to`, `line_to`, `fill_rect`, `fill_text`, `stroke_color`, …) : la pile d'états (`save`, `restore`), les transformations, les tracés (`moveTo`, `lineTo`, `arc`, `arcTo`, `ellipse`, `rect`, `roundRect`, courbes de Bézier), `fill` / `stroke` / `clip` (également sur un `Path2D`, qui accepte les données de tracé SVG ; `fill_svg` / `stroke_svg` en Rust), les rectangles, le texte (`fillText`, `strokeText`, `measureText`), les dégradés linéaires / radiaux / coniques, les pointillés de ligne, les ombres, `globalAlpha`, `globalCompositeOperation` et `drawImage` (images par URL ou par asset). Chaque membre est listé dans la [référence de l'API Canvas](../modules/nsh-canvas.md) ; le [guide du canvas](../docs/canvas.md) présente pas à pas le dessin de graphiques et de graphismes animés.

Les coordonnées sont en points, avec l'origine en haut à gauche. `measureText` est synchrone et renvoie `width`. Le `Painter` de Rust répond aussi aux tests de collision (`is_point_in_path`, `is_point_in_stroke`).

Le contexte dessine des opérations vectorielles et des images : l'accès aux pixels (`getImageData` / `putImageData`), `filter` et les images SVG n'en font pas partie.

<a id="events"></a>

## Événements

Les [événements de vue](./view.md#events) : `onPress`, `onLayout`, gestes et touches. Pour gérer les appuis relatifs au dessin, lisez `locationX` / `locationY` dans `onTouchEnd`, ou suivez un glissement avec `onResponderMove` (`.on_responder_move(..)` en Rust, avec `e.location`).

<a id="ref-methods"></a>

## Méthodes de ref

Aucune qui lui soit propre.
