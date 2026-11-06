---
title: "Canvas"
description: "Dibujar en un canvas con Rust y TSX: las operaciones 2D, trazados y datos de trazado SVG, degradados, texto, imágenes, redibujado a partir de signals y animación de dibujos con valores animados."
order: 44
group: ui
demo: guide-canvas
source_hash: a49acbd4da5a3c5f
---


# Canvas

Un canvas es una vista en la que dibujas con las operaciones de la HTML Canvas 2D API: gráficos, anillos de progreso, medidores, firmas, iconos personalizados, cualquier cosa que sea más fácil de dibujar que de construir con vistas. En Rust, `canvas(..)` muestra lo que registró un `Painter`; en TSX, `Canvas` de `nsh` recibe una función `draw` que registra el dibujo de una sola vez. La plataforma lo reproduce de forma nativa (Core Graphics en iOS, `android.graphics.Canvas` en Android) a la resolución de la pantalla, de modo que los dibujos se mantienen nítidos con cualquier densidad de píxeles.

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

Un canvas acepta todo lo que acepta una [vista](../elements/view.md) (estilos, clases, manejadores táctiles, accesibilidad, refs) además de su dibujo. Necesita un tamaño que provenga de su estilo o de su layout; su contenido es el dibujo. Las coordenadas están en puntos, con el origen en la esquina superior izquierda.

<a id="when-the-drawing-is-made"></a>

## Cuándo se hace el dibujo

En Rust, `canvas(move || ..)` registra dentro de un binding: el closure se ejecuta una vez, y de nuevo cuando cambia un [signal](./reactivity.md) que haya leído. Un dibujo que depende del tamaño del canvas guarda en un signal el tamaño obtenido de `.on_layout(..)` y lo lee, como se muestra arriba. En TSX, `draw(cx, { width, height })` se ejecuta:

- una vez que se conoce el tamaño del canvas (después de su primer layout);
- de nuevo cuando se cambia el tamaño del canvas;
- de nuevo cuando cambia un signal que haya leído.

Cada ejecución reemplaza todo el dibujo. Leer signals mientras se dibuja es la forma en que un canvas sigue tus datos:

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

Las llamadas de dibujo solo registran: el dibujo lo hace la plataforma cuando termina el registro, por lo que no se pueden leer los píxeles de vuelta. El registro se envía a la plataforma como una sola operación.

<a id="the-2d-operations"></a>

## Las operaciones 2D

Las operaciones son un subconjunto de la HTML Canvas 2D API: `CanvasRenderingContext2D` en TSX, y los métodos de `Painter` en Rust, con nombres de Rust (`begin_path`, `fill_rect`, `line_width`, `set_transform`, `draw_image`, ...; colores mediante `fill_color` / `stroke_color`, degradados mediante `fill_style` / `stroke_style`). Lo que se admite:

**Estado**

| Miembro | Rust | Descripción |
|---|---|---|
| `save()`, `restore()` | `.save()`, `.restore()` | Apilan y desapilan el estado de dibujo (estilos, transformación, recorte). |
| `fillStyle`, `strokeStyle` | `.fill_color(..)`, `.fill_style(..)`, `.stroke_color(..)`, `.stroke_style(..)` | Un color CSS, un degradado o un valor animado que interpola colores. |
| `lineWidth`, `lineCap`, `lineJoin`, `miterLimit` | `.line_width(..)`, `.line_cap(..)`, `.line_join(..)`, `.miter_limit(..)` | Forma del trazo. |
| `setLineDash(segments)`, `getLineDash()`, `lineDashOffset` | `.line_dash(..)`, `.line_dash_offset(..)` | Guiones. |
| `globalAlpha` | `.global_alpha(..)` | Opacidad de lo que se dibuja a continuación, de 0 a 1. |
| `globalCompositeOperation` | `.composite(Composite::DestinationOut)` | Cómo se combina: `"source-over"`, `"destination-out"`, `"multiply"`, `"screen"`, ... |
| `shadowColor`, `shadowBlur`, `shadowOffsetX`, `shadowOffsetY` | `.shadow(color, blur, offset)` | Sombras. |
| `font` | `.font(..)` | Forma abreviada `font` de CSS: `"600 14px Inter"` (tamaños en px, pt o rem); `small-caps` y las formas numéricas `tabular-nums`, `oldstyle-nums`, ... pueden ir antes del tamaño. |
| `fontVariantNumeric` | `.font_variant_numeric(..)` | `"tabular-nums"` hace que todas las cifras tengan el mismo ancho, de modo que los números cambiantes (contadores, precios, etiquetas de ejes) no tiemblen; también `"proportional-nums"`, `"oldstyle-nums"`, `"lining-nums"`, `"normal"`. Es una adición de NSH (el `font-variant-numeric` de CSS); al asignar `font` se conserva. Los navegadores la ignoran. |
| `textAlign`, `textBaseline` | `.text_align(..)`, `.text_baseline(..)` | Posición del texto. |

**Transformaciones**: `translate(x, y)`, `scale(x, y)`, `rotate(angle)` (radianes, en sentido horario), `transform(a, b, c, d, e, f)`, `setTransform(a, b, c, d, e, f)`, `resetTransform()`.

**Paths**: `beginPath()`, `moveTo`, `lineTo`, `quadraticCurveTo`, `bezierCurveTo`, `arc`, `arcTo`, `ellipse`, `rect`, `roundRect(x, y, w, h, radii)`, `closePath()`; luego `fill(rule?)`, `stroke()` y `clip(rule?)`, cada uno de los cuales también acepta un path (`fill_path`, `stroke_path`, `clip_path` en Rust). Las reglas de relleno son `"nonzero"` y `"evenodd"`.

**Rectángulos**: `fillRect`, `strokeRect`, `clearRect`.

**Texto**: `fillText(text, x, y, maxWidth?)`, `strokeText(...)`, `measureText(text)` (medido de forma síncrona por el motor de texto de la plataforma con el `font` actual; solo `width`). En Rust, `measure_text(font, text)` devuelve el ancho.

**Hit testing**: `isPointInPath(path?, x, y, rule?)` y `isPointInStroke(path?, x, y)` (`path_contains`, `stroke_contains`, `is_point_in_path` y `is_point_in_stroke` en un `Painter`) responden de forma síncrona, calculados a partir de la geometría registrada (la transformación actual, el path, `lineWidth` y `lineCap`). Conserva el dibujo y los paths que dibujaste para encontrar la forma que queda bajo un toque:

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

Los trazos se comprueban con uniones redondeadas y sin guiones; las coordenadas dadas como valores animados cuentan como 0.

**Degradados**: `createLinearGradient`, `createRadialGradient`, `createConicGradient`, cada uno con `addColorStop(offset, color)` (`CanvasGradient::linear`, `radial`, `conic` y `add_color_stop` en Rust).

**Imágenes**: `drawImage(image, dx, dy)`, `drawImage(image, dx, dy, dw, dh)`, `drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh)` (`draw_image(url, dest)` y `draw_image_part(..)` en Rust).

`cx.canvas.width` y `cx.canvas.height` devuelven el tamaño del canvas en puntos en TSX.

**El conjunto admitido**: operaciones de dibujo. Los píxeles los escribe la plataforma, por lo que `getImageData` / `putImageData` y cualquier otro acceso a píxeles quedan fuera, al igual que `filter` y las imágenes SVG en `drawImage`. Un color o una fuente no válidos descartan esa operación concreta, como en HTML Canvas.

<a id="paths-and-svg-path-data"></a>

## Paths y datos de path SVG

Un path construido una sola vez puede rellenarse, trazarse o usarse como recorte muchas veces: `svg_path(d)` en Rust, `Path2D` en TSX. Ambos aceptan datos de path SVG, que se analizan de forma nativa, lo que facilita crear iconos:

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

Un `Path2D` tiene los mismos métodos de path que el contexto (`moveTo`, `arc`, `roundRect`, ...) y `addPath(other)`. `new Path2D(other)` copia un path.

<a id="gradients"></a>

## Degradados

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

Un degradado cónico (`createConicGradient(startAngle, x, y)`, `CanvasGradient::conic(start_angle, center)`) recorre los colores alrededor de un punto; su ángulo inicial está en radianes, en sentido horario desde el eje x. Un degradado cónico sobre un arco trazado produce un anillo de progreso con degradado.

<a id="text"></a>

## Texto

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

Las familias tipográficas son las mismas que en los estilos: familias del sistema y los nombres de las fuentes que incluye tu app (consulta [Fuentes](./fonts.md)).

<a id="images"></a>

## Imágenes

Dibujar una imagen requiere una URL en Rust (la de un asset es `LOGO.url`), y una URL o un asset importado (`import logo from "./logo.png"`) en TSX. La imagen se carga de forma nativa y el canvas vuelve a dibujar cuando termina de cargarse, por lo que no necesitas seguir la carga tú mismo. Las URL remotas están sujetas a las [capacidades de red](./sandbox-and-capabilities.md) de la app.

Los canvas en iOS, macOS, Android, Windows, Linux y GPUI dibujan imágenes de mapa de bits (PNG, JPEG, GIF, WebP, ...); en ellos, una fuente SVG es una imagen que no se carga, y el log la nombra. Muestra las imágenes SVG con [`<Image>`](./images-and-assets.md#svg-images), o dibuja sus formas como paths `Path2D`. En la web, un canvas dibuja lo que dibuja el navegador, SVG incluido.

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

La forma de nueve argumentos (`draw_image_part`) toma el rectángulo de origen en los píxeles de la imagen.

<a id="driving-drawings-with-animated-values"></a>

## Controlar los dibujos con valores animados

Cualquier argumento numérico de una llamada de dibujo, y los paints de relleno y de trazo, pueden ser un [valor animado](./animation.md#animated-values) o un nodo derivado de él. Estos argumentos se leen mientras la plataforma dibuja y, cuando el valor se anima, la plataforma vuelve a dibujar por sí sola, en cada fotograma, sin registrar el dibujo de nuevo ni ejecutar nada de tu código.

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

El ángulo final del arco es `progress.mul(2π).sub(π/2)`: un nodo, de modo que el anillo avanza de forma nativa durante 900 ms mientras el dibujo se registró una sola vez (y una vez más para la etiqueta, que lee un signal). La manecilla de los segundos de un reloj funciona igual: `rotate(seconds.mul(π / 30))` con `seconds` animado de forma lineal.

Los colores se animan de la misma manera: `.fill_style(&t.interpolate_colors(&[0.0, 1.0], &[rgb(0x54aeff), rgb(0xcf222e)]))` en Rust, `cx.fillStyle = t.interpolate({ inputRange: [0, 1], outputRange: ["#54aeff", "#cf222e"] })` en TSX.

<a id="touch-on-a-canvas"></a>

## Toques en un canvas

Un canvas es una vista, por lo que acepta pulsaciones y el [responder system](./touch-and-gestures.md#the-responder-system). El dibujo con el dedo registra puntos en un signal y los dibuja:

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

## Rendimiento

- Un dibujo se registra en Rust (en TSX, como llamadas JS al contexto) y viaja a la plataforma como una sola operación; no hay cruce del bridge por cada llamada.
- Cada dibujo vuelve a registrar todo. Mantén el trabajo proporcional a lo que se muestra, y guarda los datos que cambian en cada fotograma en valores animados en lugar de en signals.
- Divide un dibujo que tiene una parte estática y otra que cambia con frecuencia en dos canvas apilados uno encima del otro, de modo que solo se vuelva a dibujar uno.
- Dentro de un scroll view con zoom, los canvas se vuelven a dibujar a la resolución ampliada cuando termina el zoom.

<a id="related"></a>

## Relacionado

- [Elemento `Canvas`](../elements/canvas.md): la referencia.
- [Animación](./animation.md): valores animados, `interpolate` y `Easing`.
- [Imágenes y assets](./images-and-assets.md): las imágenes de la app.
