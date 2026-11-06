---
title: "Canvas"
description: "O elemento Canvas: desenho personalizado com um contexto 2D, reproduzido nativamente."
order: 60
group: primitives
demo: el-canvas
source_hash: db2829bf8681ec52
---


# Canvas

Um canvas é uma view que você mesmo desenha com uma API de desenho 2D, a da HTML Canvas 2D API: gráficos, medidores, anéis, assinaturas, formas personalizadas. O código de desenho registra operações; a plataforma as reproduz nativamente (Core Graphics no iOS e no Mac Catalyst, `android.graphics.Canvas` no Android) na resolução da tela. Em Rust, cria-se um com `canvas(painter)`, um `Painter` que registra o desenho; em TSX, com `<Canvas>` de `nsh` e sua função `draw`.

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

Em TSX, `Canvas` cria a view de canvas nativa, mede essa view e executa sua função `draw` com um contexto e o tamanho do canvas (veja a [Canvas API](../modules/nsh-canvas.md)). Em Rust, `canvas(..)` recebe um `Painter`, ou um closure que retorna um: o closure desenha novamente quando o que ele lê muda, e o tamanho vem de `on_layout` quando o desenho depende dele.

## Props

Um canvas aceita as props de uma [view](./view.md) (estilos, props de toque e gestos, `onLayout`, acessibilidade, `ref`, …) além de:

| Prop | Rust | Tipo | Descrição |
|---|---|---|---|
| `draw` | `canvas(painter)` | `(cx: CanvasRenderingContext2D, size: { width: number; height: number }) => void` | Desenha o canvas. Executa assim que o tamanho é conhecido, novamente quando o canvas é redimensionado e novamente quando os signals que ele lê mudam. |

Dê um tamanho ao canvas por meio de seus estilos (width / height, `flex`, uma proporção): o tamanho dele é o que os estilos definem.

<a id="when-it-redraws"></a>

## Quando redesenha

O desenho é rastreado como um effect: ler um signal dentro dele inscreve o desenho nesse signal.

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

Números e cores também podem ser [valores animados nativos](../modules/nsh.md#animation) (`CanvasNumber`, `CanvasPaint`; em Rust, um `&AnimatedValue` em qualquer lugar onde entra um número): a plataforma então redesenha por conta própria enquanto eles animam, sem nenhum trabalho por frame no código do app.

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

## O contexto

`CanvasRenderingContext2D` é um subconjunto do contexto do navegador, e `Painter` tem as mesmas operações como métodos em snake case (`move_to`, `line_to`, `fill_rect`, `fill_text`, `stroke_color`, …): a pilha de estado (`save`, `restore`), transformações, caminhos (`moveTo`, `lineTo`, `arc`, `arcTo`, `ellipse`, `rect`, `roundRect`, curvas de Bézier), `fill` / `stroke` / `clip` (também de um `Path2D`, que aceita dados de caminho SVG; `fill_svg` / `stroke_svg` em Rust), retângulos, texto (`fillText`, `strokeText`, `measureText`), gradientes lineares / radiais / cônicos, tracejados de linha, sombras, `globalAlpha`, `globalCompositeOperation` e `drawImage` (imagens por URL ou asset). Todos os membros estão listados na [referência da Canvas API](../modules/nsh-canvas.md); o [guia de canvas](../docs/canvas.md) mostra passo a passo como desenhar gráficos e elementos animados.

As coordenadas são em pontos, com a origem no canto superior esquerdo. `measureText` é síncrono e retorna `width`. O `Painter` do Rust também responde a hit tests (`is_point_in_path`, `is_point_in_stroke`).

O contexto desenha operações vetoriais e imagens: acesso a pixels (`getImageData` / `putImageData`), `filter` e imagens SVG ficam fora dele.

<a id="events"></a>

## Eventos

Os [eventos de view](./view.md#events): `onPress`, `onLayout`, gestos e toques. Para tratar toques relativos ao desenho, leia `locationX` / `locationY` em `onTouchEnd`, ou acompanhe um arrasto com `onResponderMove` (`.on_responder_move(..)` em Rust, com `e.location`).

<a id="ref-methods"></a>

## Métodos de ref

Nenhum próprio.
