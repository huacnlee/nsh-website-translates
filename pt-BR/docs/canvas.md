---
title: "Canvas"
description: "Desenhando em um canvas com Rust e TSX: as operações 2D, caminhos e dados de caminho SVG, gradientes, texto, imagens, redesenho a partir de signals e animação de desenhos com valores animados."
order: 44
group: ui
demo: guide-canvas
source_hash: a49acbd4da5a3c5f
---


# Canvas

Um canvas é uma view na qual você desenha com as operações da API HTML Canvas 2D: gráficos, anéis de progresso, medidores, assinaturas, ícones personalizados, qualquer coisa que seja mais fácil de desenhar do que de montar com views. Em Rust, `canvas(..)` mostra o que um `Painter` gravou; em TSX, `Canvas` de `nsh` recebe uma função `draw` que grava o desenho de uma só vez. A plataforma o reproduz nativamente (Core Graphics no iOS, `android.graphics.Canvas` no Android) na resolução da tela, então os desenhos permanecem nítidos em qualquer densidade de pixels.

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

Um canvas aceita tudo o que uma [view](../elements/view.md) aceita (estilos, classes, handlers de toque, acessibilidade, refs), além do seu desenho. Ele precisa de um tamanho vindo do estilo ou do layout; seu conteúdo é o desenho. As coordenadas estão em pontos, com a origem no canto superior esquerdo.

<a id="when-the-drawing-is-made"></a>

## Quando o desenho é feito

Em Rust, `canvas(move || ..)` grava dentro de um binding: o closure é executado uma vez e, de novo, quando um [signal](./reactivity.md) lido por ele muda. Um desenho que depende do tamanho do canvas guarda o tamanho vindo de `.on_layout(..)` em um signal e o lê, como acima. Em TSX, `draw(cx, { width, height })` é executado:

- assim que o tamanho do canvas é conhecido (após o primeiro layout);
- novamente quando o canvas é redimensionado;
- novamente quando um signal lido por ele muda.

Cada execução substitui o desenho inteiro. Ler signals durante o desenho é como um canvas acompanha seus dados:

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

As chamadas de desenho apenas gravam: o desenho é feito pela plataforma depois que a gravação termina, portanto os pixels não podem ser lidos de volta. A gravação é enviada à plataforma como uma única operação.

<a id="the-2d-operations"></a>

## As operações 2D

As operações são um subconjunto da API HTML Canvas 2D: `CanvasRenderingContext2D` em TSX e os métodos de `Painter` em Rust, com nomes em Rust (`begin_path`, `fill_rect`, `line_width`, `set_transform`, `draw_image`, ...; cores por meio de `fill_color` / `stroke_color`, gradientes por meio de `fill_style` / `stroke_style`). O que é suportado:

**Estado**

| Membro | Rust | Descrição |
|---|---|---|
| `save()`, `restore()` | `.save()`, `.restore()` | Empilha e desempilha o estado de desenho (estilos, transformação, recorte). |
| `fillStyle`, `strokeStyle` | `.fill_color(..)`, `.fill_style(..)`, `.stroke_color(..)`, `.stroke_style(..)` | Uma cor CSS, um gradiente ou um valor animado que interpola cores. |
| `lineWidth`, `lineCap`, `lineJoin`, `miterLimit` | `.line_width(..)`, `.line_cap(..)`, `.line_join(..)`, `.miter_limit(..)` | Forma do traço. |
| `setLineDash(segments)`, `getLineDash()`, `lineDashOffset` | `.line_dash(..)`, `.line_dash_offset(..)` | Tracejados. |
| `globalAlpha` | `.global_alpha(..)` | Opacidade do que for desenhado a seguir, de 0 a 1. |
| `globalCompositeOperation` | `.composite(Composite::DestinationOut)` | Como se combina: `"source-over"`, `"destination-out"`, `"multiply"`, `"screen"`, ... |
| `shadowColor`, `shadowBlur`, `shadowOffsetX`, `shadowOffsetY` | `.shadow(color, blur, offset)` | Sombras. |
| `font` | `.font(..)` | Forma abreviada CSS `font`: `"600 14px Inter"` (tamanhos em px, pt ou rem); `small-caps` e as formas numéricas `tabular-nums`, `oldstyle-nums`, ... podem vir antes do tamanho. |
| `fontVariantNumeric` | `.font_variant_numeric(..)` | `"tabular-nums"` faz todos os algarismos terem a mesma largura, de modo que números que mudam (contadores, preços, rótulos de eixo) não tremem; também `"proportional-nums"`, `"oldstyle-nums"`, `"lining-nums"`, `"normal"`. Um acréscimo do NSH (`font-variant-numeric` do CSS); definir `font` o mantém. Navegadores o ignoram. |
| `textAlign`, `textBaseline` | `.text_align(..)`, `.text_baseline(..)` | Posicionamento do texto. |

**Transformações**: `translate(x, y)`, `scale(x, y)`, `rotate(angle)` (radianos, sentido horário), `transform(a, b, c, d, e, f)`, `setTransform(a, b, c, d, e, f)`, `resetTransform()`.

**Caminhos**: `beginPath()`, `moveTo`, `lineTo`, `quadraticCurveTo`, `bezierCurveTo`, `arc`, `arcTo`, `ellipse`, `rect`, `roundRect(x, y, w, h, radii)`, `closePath()`; depois `fill(rule?)`, `stroke()` e `clip(rule?)`, cada um aceitando também um caminho (`fill_path`, `stroke_path`, `clip_path` em Rust). As regras de preenchimento são `"nonzero"` e `"evenodd"`.

**Retângulos**: `fillRect`, `strokeRect`, `clearRect`.

**Texto**: `fillText(text, x, y, maxWidth?)`, `strokeText(...)`, `measureText(text)` (medido de forma síncrona pelo motor de texto da plataforma com o `font` atual; apenas `width`). Em Rust, `measure_text(font, text)` retorna a largura.

**Teste de colisão (hit testing)**: `isPointInPath(path?, x, y, rule?)` e `isPointInStroke(path?, x, y)` (`path_contains`, `stroke_contains`, `is_point_in_path` e `is_point_in_stroke` em um `Painter`) respondem de forma síncrona, calculados a partir da geometria gravada (a transformação atual, o caminho, `lineWidth` e `lineCap`). Guarde o desenho e os caminhos que você desenhou para encontrar a forma sob um toque:

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

Os traços são testados com junções arredondadas e sem tracejado; coordenadas fornecidas como valores animados contam como 0.

**Gradientes**: `createLinearGradient`, `createRadialGradient`, `createConicGradient`, cada um com `addColorStop(offset, color)` (`CanvasGradient::linear`, `radial`, `conic` e `add_color_stop` em Rust).

**Imagens**: `drawImage(image, dx, dy)`, `drawImage(image, dx, dy, dw, dh)`, `drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh)` (`draw_image(url, dest)` e `draw_image_part(..)` em Rust).

`cx.canvas.width` e `cx.canvas.height` fornecem o tamanho do canvas em pontos em TSX.

**O conjunto suportado**: operações de desenho. Os pixels são escritos pela plataforma, então `getImageData` / `putImageData` e outros acessos a pixels ficam fora dele, assim como `filter` e imagens SVG em `drawImage`. Uma cor ou fonte inválida descarta apenas aquela operação, como no HTML Canvas.

<a id="paths-and-svg-path-data"></a>

## Caminhos e dados de caminho SVG

Um caminho construído uma vez pode ser preenchido, traçado ou usado como recorte muitas vezes: `svg_path(d)` em Rust, `Path2D` em TSX. Ambos aceitam dados de caminho SVG, interpretados nativamente, o que facilita o uso de ícones:

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

Um `Path2D` tem os mesmos métodos de caminho que o contexto (`moveTo`, `arc`, `roundRect`, ...) e `addPath(other)`. `new Path2D(other)` copia um caminho.

<a id="gradients"></a>

## Gradientes

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

Um gradiente cônico (`createConicGradient(startAngle, x, y)`, `CanvasGradient::conic(start_angle, center)`) varre as cores ao redor de um ponto; seu ângulo inicial está em radianos, no sentido horário a partir do eixo x. Um gradiente cônico em um arco traçado produz um anel de progresso com gradiente.

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

As famílias de fontes são as mesmas dos estilos: famílias do sistema e os nomes das fontes que seu app inclui (veja [Fontes](./fonts.md)).

<a id="images"></a>

## Imagens

Desenhar uma imagem exige uma URL em Rust (a de um asset é `LOGO.url`) e uma URL ou um asset importado (`import logo from "./logo.png"`) em TSX. A imagem é carregada nativamente, e o canvas desenha novamente assim que ela é carregada, então você não precisa acompanhar o carregamento por conta própria. URLs remotas estão sujeitas às [capacidades de rede](./sandbox-and-capabilities.md) do app.

Os canvases no iOS, macOS, Android, Windows, Linux e GPUI desenham imagens bitmap (PNG, JPEG, GIF, WebP, ...); neles, uma fonte SVG é uma imagem que falha ao carregar, e o log informa o nome dela. Exiba imagens SVG com [`<Image>`](./images-and-assets.md#svg-images) ou desenhe suas formas como caminhos `Path2D`. Na web, um canvas desenha o que o navegador desenha, inclusive SVG.

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

A forma com nove argumentos (`draw_image_part`) recebe o retângulo de origem em pixels da imagem.

<a id="driving-drawings-with-animated-values"></a>

## Controlando desenhos com valores animados

Qualquer argumento numérico de uma chamada de desenho, e os preenchimentos e traços (paints), pode ser um [valor animado](./animation.md#animated-values) ou um nó derivado dele. Esses argumentos são lidos enquanto a plataforma desenha e, quando o valor anima, a plataforma redesenha por conta própria, a cada quadro, sem gravar o desenho novamente nem executar nenhum código seu.

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

O ângulo final do arco é `progress.mul(2π).sub(π/2)`: um nó, de modo que o anel varre nativamente por 900 ms enquanto o desenho foi gravado uma vez (e mais uma vez para o rótulo, que lê um signal). O ponteiro de segundos de um relógio funciona da mesma forma: `rotate(seconds.mul(π / 30))` com `seconds` animado de forma linear.

As cores animam do mesmo modo: `.fill_style(&t.interpolate_colors(&[0.0, 1.0], &[rgb(0x54aeff), rgb(0xcf222e)]))` em Rust, `cx.fillStyle = t.interpolate({ inputRange: [0, 1], outputRange: ["#54aeff", "#cf222e"] })` em TSX.

<a id="touch-on-a-canvas"></a>

## Toque em um canvas

Um canvas é uma view, então aceita pressionamentos e o [sistema de responders](./touch-and-gestures.md#the-responder-system). O desenho com o dedo grava pontos em um signal e os desenha:

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

## Desempenho

- Um desenho é gravado em Rust (em TSX, como chamadas JS ao contexto) e viaja até a plataforma como uma única operação; não há travessia de bridge por chamada.
- Cada desenho regrava tudo. Mantenha o trabalho proporcional ao que é exibido e mantenha dados que mudam a cada quadro em valores animados em vez de signals.
- Divida um desenho que tem uma parte estática e uma parte que muda com frequência em dois canvases empilhados um sobre o outro, para que apenas um seja redesenhado.
- Dentro de uma scroll view com zoom, os canvases são desenhados novamente na resolução ampliada quando o zoom termina.

<a id="related"></a>

## Relacionado

- [Elemento `Canvas`](../elements/canvas.md): a referência.
- [Animação](./animation.md): valores animados, `interpolate` e `Easing`.
- [Imagens e assets](./images-and-assets.md): as imagens do app.
