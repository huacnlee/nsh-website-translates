---
title: "Canvas"
description: "Элемент Canvas: пользовательская отрисовка с помощью 2D-контекста, воспроизводимая нативно."
order: 60
group: primitives
demo: el-canvas
source_hash: db2829bf8681ec52
---

# Canvas

Canvas — это представление (view), которое вы рисуете сами с помощью 2D API рисования, как в HTML Canvas 2D API: графики, индикаторы, кольца, подписи, произвольные фигуры. Код рисования записывает операции, а платформа воспроизводит их нативно (Core Graphics на iOS и Mac Catalyst, `android.graphics.Canvas` на Android) в разрешении экрана. В Rust canvas создаётся с помощью `canvas(painter)`, `Painter`, записывающего рисование; в TSX с помощью `<Canvas>` из `nsh` и её функции `draw`.

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

В TSX `Canvas` создаёт нативное представление canvas, измеряет его и запускает вашу функцию `draw` с контекстом и размером canvas (см. [Canvas API](../modules/nsh-canvas.md)). В Rust `canvas(..)` принимает `Painter` или замыкание, возвращающее его: замыкание рисует заново, когда меняется то, что оно читает, а размер берётся из `on_layout`, если рисунок от него зависит.

## Props

Canvas принимает props [view](./view.md) (стили, props нажатий и жестов, `onLayout`, доступность, `ref` и т. д.) плюс:

| Prop | Rust | Тип | Описание |
|---|---|---|---|
| `draw` | `canvas(painter)` | `(cx: CanvasRenderingContext2D, size: { width: number; height: number }) => void` | Рисует canvas. Запускается, когда размер известен, снова при изменении размера canvas и снова при изменении сигналов, которые он читает. |

Задавайте размер canvas через его стили (width / height, `flex`, соотношение сторон): размер canvas — тот, который дают ему стили.

<a id="when-it-redraws"></a>

## Когда происходит перерисовка

Рисование отслеживается как эффект: чтение сигнала внутри него подписывает рисование на этот сигнал.

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

Числа и цвета также могут быть [нативными анимированными значениями](../modules/nsh.md#animation) (`CanvasNumber`, `CanvasPaint`; в Rust `&AnimatedValue` везде, где допускается число): тогда платформа перерисовывает canvas сама, пока они анимируются, и коду приложения не нужно ничего делать на каждом кадре.

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

## Контекст

`CanvasRenderingContext2D` — подмножество браузерного, а `Painter` имеет те же операции в виде методов в snake case (`move_to`, `line_to`, `fill_rect`, `fill_text`, `stroke_color` и т. д.): стек состояний (`save`, `restore`), трансформации, пути (`moveTo`, `lineTo`, `arc`, `arcTo`, `ellipse`, `rect`, `roundRect`, кривые Безье), `fill` / `stroke` / `clip` (также для `Path2D`, который принимает данные SVG-пути; `fill_svg` / `stroke_svg` в Rust), прямоугольники, текст (`fillText`, `strokeText`, `measureText`), линейные / радиальные / конические градиенты, пунктирные линии, тени, `globalAlpha`, `globalCompositeOperation` и `drawImage` (изображения по URL или из ассетов). Все члены перечислены в [справочнике Canvas API](../modules/nsh-canvas.md); [руководство по canvas](../docs/canvas.md) показывает, как рисовать графики и анимированную графику.

Координаты задаются в точках, начало координат находится в левом верхнем углу. `measureText` синхронен и возвращает `width`. `Painter` в Rust также отвечает на проверки попадания (`is_point_in_path`, `is_point_in_stroke`).

Контекст рисует векторные операции и изображения: доступ к пикселям (`getImageData` / `putImageData`), `filter` и SVG-изображения в него не входят.

<a id="events"></a>

## События

[События view](./view.md#events): `onPress`, `onLayout`, жесты и касания. Чтобы обрабатывать нажатия относительно рисунка, читайте `locationX` / `locationY` в `onTouchEnd` или отслеживайте перетаскивание с помощью `onResponderMove` (`.on_responder_move(..)` в Rust, с `e.location`).

<a id="ref-methods"></a>

## Методы ref

Собственных методов нет.
