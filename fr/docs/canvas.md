---
title: "Canvas"
description: "Dessiner sur un canvas en Rust et TSX : les opérations 2D, les chemins et les données de chemin SVG, les dégradés, le texte, les images, le redessin à partir de signaux, et l'animation des dessins avec des valeurs animées."
order: 44
group: ui
demo: guide-canvas
source_hash: a49acbd4da5a3c5f
---

# Canvas

Un canvas est une vue dans laquelle vous dessinez avec les opérations de l'API HTML Canvas 2D : graphiques, anneaux de progression, jauges, signatures, icônes personnalisées, tout ce qui est plus simple à dessiner qu'à construire avec des vues. En Rust, `canvas(..)` affiche ce qu'un `Painter` a enregistré ; en TSX, `Canvas` de `nsh` prend une fonction `draw` qui enregistre le dessin en une seule fois. La plateforme le rejoue nativement (Core Graphics sur iOS, `android.graphics.Canvas` sur Android) à la résolution de l'écran, de sorte que les dessins restent nets quelle que soit la densité de pixels.

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

Un canvas accepte tout ce qu'accepte une [vue](../elements/view.md) (styles, classes, gestionnaires tactiles, accessibilité, refs), plus son dessin. Il a besoin d'une taille issue de son style ou de la mise en page ; son contenu est le dessin. Les coordonnées sont en points, avec l'origine en haut à gauche.

<a id="when-the-drawing-is-made"></a>

## Quand le dessin est réalisé

En Rust, `canvas(move || ..)` enregistre dans un binding : la closure s'exécute une fois, puis à nouveau lorsqu'un [signal](./reactivity.md) qu'elle a lu change. Un dessin qui dépend de la taille du canvas conserve la taille issue de `.on_layout(..)` dans un signal et la lit, comme ci-dessus. En TSX, `draw(cx, { width, height })` s'exécute :

- une fois que la taille du canvas est connue (après sa première mise en page) ;
- à nouveau lorsque le canvas est redimensionné ;
- à nouveau lorsqu'un signal qu'il a lu change.

Chaque exécution remplace tout le dessin. Lire des signaux pendant le dessin est la façon dont un canvas suit vos données :

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

Les appels de dessin ne font qu'enregistrer : le dessin est réalisé par la plateforme une fois l'enregistrement terminé, donc les pixels ne peuvent pas être relus. L'enregistrement est envoyé à la plateforme en une seule opération.

<a id="the-2d-operations"></a>

## Les opérations 2D

Les opérations forment un sous-ensemble de l'API HTML Canvas 2D : `CanvasRenderingContext2D` en TSX, et les méthodes de `Painter` en Rust, sous des noms Rust (`begin_path`, `fill_rect`, `line_width`, `set_transform`, `draw_image`, ... ; couleurs via `fill_color` / `stroke_color`, dégradés via `fill_style` / `stroke_style`). Ce qui est pris en charge :

**État**

| Membre | Rust | Description |
|---|---|---|
| `save()`, `restore()` | `.save()`, `.restore()` | Empile et dépile l'état de dessin (styles, transformation, découpe). |
| `fillStyle`, `strokeStyle` | `.fill_color(..)`, `.fill_style(..)`, `.stroke_color(..)`, `.stroke_style(..)` | Une couleur CSS, un dégradé ou une valeur animée qui interpole des couleurs. |
| `lineWidth`, `lineCap`, `lineJoin`, `miterLimit` | `.line_width(..)`, `.line_cap(..)`, `.line_join(..)`, `.miter_limit(..)` | Forme du trait. |
| `setLineDash(segments)`, `getLineDash()`, `lineDashOffset` | `.line_dash(..)`, `.line_dash_offset(..)` | Pointillés. |
| `globalAlpha` | `.global_alpha(..)` | Opacité de ce qui est dessiné ensuite, de 0 à 1. |
| `globalCompositeOperation` | `.composite(Composite::DestinationOut)` | Mode de composition : `"source-over"`, `"destination-out"`, `"multiply"`, `"screen"`, ... |
| `shadowColor`, `shadowBlur`, `shadowOffsetX`, `shadowOffsetY` | `.shadow(color, blur, offset)` | Ombres. |
| `font` | `.font(..)` | Raccourci CSS `font` : `"600 14px Inter"` (tailles en px, pt ou rem) ; `small-caps` et les formes numériques `tabular-nums`, `oldstyle-nums`, ... peuvent précéder la taille. |
| `fontVariantNumeric` | `.font_variant_numeric(..)` | `"tabular-nums"` donne la même largeur à tous les chiffres, de sorte que les nombres qui changent (compteurs, prix, étiquettes d'axe) ne bougent pas ; voir aussi `"proportional-nums"`, `"oldstyle-nums"`, `"lining-nums"`, `"normal"`. Un ajout de NSH (`font-variant-numeric` en CSS) ; définir `font` le conserve. Les navigateurs l'ignorent. |
| `textAlign`, `textBaseline` | `.text_align(..)`, `.text_baseline(..)` | Placement du texte. |

**Transformations** : `translate(x, y)`, `scale(x, y)`, `rotate(angle)` (radians, sens horaire), `transform(a, b, c, d, e, f)`, `setTransform(a, b, c, d, e, f)`, `resetTransform()`.

**Tracés** : `beginPath()`, `moveTo`, `lineTo`, `quadraticCurveTo`, `bezierCurveTo`, `arc`, `arcTo`, `ellipse`, `rect`, `roundRect(x, y, w, h, radii)`, `closePath()` ; puis `fill(rule?)`, `stroke()` et `clip(rule?)`, chacun acceptant aussi un tracé (`fill_path`, `stroke_path`, `clip_path` en Rust). Les règles de remplissage sont `"nonzero"` et `"evenodd"`.

**Rectangles** : `fillRect`, `strokeRect`, `clearRect`.

**Texte** : `fillText(text, x, y, maxWidth?)`, `strokeText(...)`, `measureText(text)` (mesuré de façon synchrone par le moteur de texte de la plateforme avec le `font` courant ; uniquement `width`). En Rust, `measure_text(font, text)` donne la largeur.

**Test de collision (hit testing)** : `isPointInPath(path?, x, y, rule?)` et `isPointInStroke(path?, x, y)` (`path_contains`, `stroke_contains`, `is_point_in_path` et `is_point_in_stroke` sur un `Painter`) répondent de façon synchrone, calculés à partir de la géométrie enregistrée (la transformation courante, le tracé, `lineWidth` et `lineCap`). Conservez le dessin et les tracés que vous avez dessinés pour trouver la forme située sous un appui :

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

Les traits sont testés avec des jointures arrondies et sans pointillés ; les coordonnées fournies sous forme de valeurs animées comptent pour 0.

**Dégradés** : `createLinearGradient`, `createRadialGradient`, `createConicGradient`, chacun avec `addColorStop(offset, color)` (`CanvasGradient::linear`, `radial`, `conic` et `add_color_stop` en Rust).

**Images** : `drawImage(image, dx, dy)`, `drawImage(image, dx, dy, dw, dh)`, `drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh)` (`draw_image(url, dest)` et `draw_image_part(..)` en Rust).

`cx.canvas.width` et `cx.canvas.height` donnent la taille du canvas en points en TSX.

**L'ensemble pris en charge** : les opérations de dessin. Les pixels sont écrits par la plateforme, donc `getImageData` / `putImageData` et tout autre accès aux pixels n'en font pas partie, pas plus que `filter` et les images SVG dans `drawImage`. Une couleur ou une police invalide fait abandonner cette seule opération, comme dans HTML Canvas.

<a id="paths-and-svg-path-data"></a>

## Tracés et données de tracé SVG

Un tracé construit une fois peut être rempli, contouré ou utilisé comme découpe de nombreuses fois : `svg_path(d)` en Rust, `Path2D` en TSX. Les deux acceptent des données de tracé SVG, analysées nativement, ce qui facilite les icônes :

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

Un `Path2D` possède les mêmes méthodes de tracé que le contexte (`moveTo`, `arc`, `roundRect`, ...) et `addPath(other)`. `new Path2D(other)` copie un tracé.

<a id="gradients"></a>

## Dégradés

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

Un dégradé conique (`createConicGradient(startAngle, x, y)`, `CanvasGradient::conic(start_angle, center)`) balaie les couleurs autour d'un point ; son angle de départ est en radians, dans le sens horaire à partir de l'axe x. Un dégradé conique appliqué à un arc contouré donne un anneau de progression en dégradé.

<a id="text"></a>

## Texte

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

Les familles de polices sont les mêmes que dans les styles : les familles système et les noms des polices que votre app embarque (voir [Polices](./fonts.md)).

## Images

Dessiner une image prend une URL en Rust (celle d'un asset est `LOGO.url`), et une URL ou un asset importé (`import logo from "./logo.png"`) en TSX. L'image est chargée nativement, et le canvas se redessine une fois l'image chargée, vous n'avez donc pas à suivre le chargement vous-même. Les URL distantes sont soumises aux [capacités réseau](./sandbox-and-capabilities.md) de l'app.

Les canvas sur iOS, macOS, Android, Windows, Linux et GPUI dessinent des images bitmap (PNG, JPEG, GIF, WebP, ...) ; sur ces plateformes, une source SVG est une image qui ne se charge pas, et le journal la nomme. Affichez les images SVG avec [`<Image>`](./images-and-assets.md#svg-images), ou dessinez leurs formes sous forme de tracés `Path2D`. Sur le web, un canvas dessine ce que dessine le navigateur, SVG compris.

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

La forme à neuf arguments (`draw_image_part`) prend le rectangle source en pixels de l'image.

<a id="driving-drawings-with-animated-values"></a>

## Piloter les dessins avec des valeurs animées

Tout argument numérique d'un appel de dessin, ainsi que les peintures de remplissage et de trait, peut être une [valeur animée](./animation.md#animated-values) ou un nœud qui en dérive. Ces arguments sont lus pendant que la plateforme dessine, et lorsque la valeur s'anime, la plateforme redessine d'elle-même, à chaque image, sans réenregistrer le dessin ni exécuter votre code.

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

L'angle de fin de l'arc est `progress.mul(2π).sub(π/2)` : un nœud, de sorte que l'anneau se balaie nativement pendant 900 ms alors que le dessin n'a été enregistré qu'une fois (et une fois de plus pour l'étiquette, qui lit un signal). L'aiguille des secondes d'une horloge fonctionne de la même manière : `rotate(seconds.mul(π / 30))` avec `seconds` animé de façon linéaire.

Les couleurs s'animent de la même façon : `.fill_style(&t.interpolate_colors(&[0.0, 1.0], &[rgb(0x54aeff), rgb(0xcf222e)]))` en Rust, `cx.fillStyle = t.interpolate({ inputRange: [0, 1], outputRange: ["#54aeff", "#cf222e"] })` en TSX.

<a id="touch-on-a-canvas"></a>

## Toucher sur un canvas

Un canvas est une vue, il accepte donc les appuis et le [système de répondeurs](./touch-and-gestures.md#the-responder-system). Le dessin au doigt enregistre des points dans un signal et les dessine :

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

## Performances

- Un dessin est enregistré en Rust (en TSX, sous forme d'appels JS sur le contexte) et parvient à la plateforme en une seule opération ; il n'y a pas de traversée du bridge à chaque appel.
- Chaque dessin réenregistre tout. Gardez un travail proportionnel à ce qui est affiché, et conservez les données qui changent à chaque image dans des valeurs animées plutôt que dans des signaux.
- Séparez un dessin qui comporte une partie statique et une partie qui change souvent en deux canvas superposés, afin qu'un seul soit redessiné.
- Dans une vue de défilement avec zoom, les canvas sont redessinés à la résolution zoomée lorsque le zoom se termine.

<a id="related"></a>

## Voir aussi

- [Élément `Canvas`](../elements/canvas.md) : la référence.
- [Animation](./animation.md) : valeurs animées, `interpolate` et `Easing`.
- [Images et assets](./images-and-assets.md) : les images de l'app.
