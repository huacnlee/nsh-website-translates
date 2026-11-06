---
title: "Canvas"
description: "Рисование на Canvas в Rust и TSX: 2D-операции, контуры и данные контура SVG, градиенты, текст, изображения, перерисовка по сигналам и анимация рисунков с помощью анимируемых значений."
order: 44
group: ui
demo: guide-canvas
source_hash: a49acbd4da5a3c5f
---

# Canvas

Canvas это view, в котором вы рисуете операциями HTML Canvas 2D API: графики, кольца прогресса, индикаторы, подписи, пользовательские иконки, то есть всё, что проще нарисовать, чем собирать из view. В Rust `canvas(..)` показывает то, что записал `Painter`; в TSX `Canvas` из `nsh` принимает функцию `draw`, которая записывает рисунок за один проход. Платформа воспроизводит его нативно (Core Graphics на iOS, `android.graphics.Canvas` на Android) в разрешении экрана, поэтому рисунки остаются чёткими при любой плотности пикселей.

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

Canvas принимает всё, что принимает [view](../elements/view.md) (стили, классы, обработчики касаний, доступность, ref), плюс само рисование. Размер ему нужно задать через стиль или layout; его содержимое это рисунок. Координаты указываются в пунктах, начало координат находится в левом верхнем углу.

<a id="when-the-drawing-is-made"></a>

## Когда создаётся рисунок

В Rust `canvas(move || ..)` записывает рисунок в binding: замыкание выполняется один раз и снова при изменении [сигнала](./reactivity.md), который оно прочитало. Рисунок, зависящий от размера canvas, хранит размер из `.on_layout(..)` в сигнале и читает его, как показано выше. В TSX `draw(cx, { width, height })` выполняется:

- когда становится известен размер canvas (после первого layout);
- снова при изменении размера canvas;
- снова при изменении сигнала, который он прочитал.

Каждый запуск заменяет рисунок целиком. Чтение сигналов во время рисования это способ, которым canvas следует за вашими данными:

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

Вызовы рисования только записываются: сам рисунок создаёт платформа после завершения записи, поэтому пиксели обратно не читаются. Запись передаётся платформе как одна операция.

<a id="the-2d-operations"></a>

## Операции 2D

Операции это подмножество HTML Canvas 2D API: `CanvasRenderingContext2D` в TSX и методы `Painter` в Rust под именами Rust (`begin_path`, `fill_rect`, `line_width`, `set_transform`, `draw_image`, ...; цвета через `fill_color` / `stroke_color`, градиенты через `fill_style` / `stroke_style`). Что поддерживается:

**Состояние**

| Член | Rust | Описание |
|---|---|---|
| `save()`, `restore()` | `.save()`, `.restore()` | Сохранить и восстановить состояние рисования (стили, трансформацию, обрезку). |
| `fillStyle`, `strokeStyle` | `.fill_color(..)`, `.fill_style(..)`, `.stroke_color(..)`, `.stroke_style(..)` | Цвет CSS, градиент или анимированное значение, интерполирующее цвета. |
| `lineWidth`, `lineCap`, `lineJoin`, `miterLimit` | `.line_width(..)`, `.line_cap(..)`, `.line_join(..)`, `.miter_limit(..)` | Форма штриха. |
| `setLineDash(segments)`, `getLineDash()`, `lineDashOffset` | `.line_dash(..)`, `.line_dash_offset(..)` | Пунктир. |
| `globalAlpha` | `.global_alpha(..)` | Непрозрачность следующего рисуемого, от 0 до 1. |
| `globalCompositeOperation` | `.composite(Composite::DestinationOut)` | Способ наложения: `"source-over"`, `"destination-out"`, `"multiply"`, `"screen"`, ... |
| `shadowColor`, `shadowBlur`, `shadowOffsetX`, `shadowOffsetY` | `.shadow(color, blur, offset)` | Тени. |
| `font` | `.font(..)` | Сокращённая запись CSS `font`: `"600 14px Inter"` (размеры в px, pt или rem); `small-caps` и числовые формы `tabular-nums`, `oldstyle-nums`, ... могут стоять перед размером. |
| `fontVariantNumeric` | `.font_variant_numeric(..)` | `"tabular-nums"` делает все цифры одной ширины, поэтому меняющиеся числа (счётчики, цены, подписи осей) не «дрожат»; также `"proportional-nums"`, `"oldstyle-nums"`, `"lining-nums"`, `"normal"`. Дополнение NSH (в CSS `font-variant-numeric`); установка `font` сохраняет его. Браузеры его игнорируют. |
| `textAlign`, `textBaseline` | `.text_align(..)`, `.text_baseline(..)` | Размещение текста. |

**Трансформации**: `translate(x, y)`, `scale(x, y)`, `rotate(angle)` (радианы, по часовой стрелке), `transform(a, b, c, d, e, f)`, `setTransform(a, b, c, d, e, f)`, `resetTransform()`.

**Контуры**: `beginPath()`, `moveTo`, `lineTo`, `quadraticCurveTo`, `bezierCurveTo`, `arc`, `arcTo`, `ellipse`, `rect`, `roundRect(x, y, w, h, radii)`, `closePath()`; затем `fill(rule?)`, `stroke()` и `clip(rule?)`, каждый из которых также принимает контур (`fill_path`, `stroke_path`, `clip_path` в Rust). Правила заливки: `"nonzero"` и `"evenodd"`.

**Прямоугольники**: `fillRect`, `strokeRect`, `clearRect`.

**Текст**: `fillText(text, x, y, maxWidth?)`, `strokeText(...)`, `measureText(text)` (измеряется синхронно текстовым движком платформы с текущим `font`; только `width`). В Rust `measure_text(font, text)` возвращает ширину.

**Проверка попадания**: `isPointInPath(path?, x, y, rule?)` и `isPointInStroke(path?, x, y)` (`path_contains`, `stroke_contains`, `is_point_in_path` и `is_point_in_stroke` для `Painter`) отвечают синхронно, вычисляя результат по записанной геометрии (текущая трансформация, контур, `lineWidth` и `lineCap`). Сохраняйте рисунок и контуры, которые вы нарисовали, чтобы находить фигуру под касанием:

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

Штрихи проверяются со скруглёнными соединениями и без пунктира; координаты, заданные анимированными значениями, считаются равными 0.

**Градиенты**: `createLinearGradient`, `createRadialGradient`, `createConicGradient`, у каждого есть `addColorStop(offset, color)` (`CanvasGradient::linear`, `radial`, `conic` и `add_color_stop` в Rust).

**Изображения**: `drawImage(image, dx, dy)`, `drawImage(image, dx, dy, dw, dh)`, `drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh)` (`draw_image(url, dest)` и `draw_image_part(..)` в Rust).

`cx.canvas.width` и `cx.canvas.height` возвращают размер canvas в пунктах в TSX.

**Поддерживаемый набор**: операции рисования. Пиксели записывает платформа, поэтому `getImageData` / `putImageData` и другой доступ к пикселям в него не входят, как и `filter` и изображения SVG в `drawImage`. Недопустимый цвет или шрифт отбрасывает только эту операцию, как и в HTML Canvas.

<a id="paths-and-svg-path-data"></a>

## Контуры и данные контуров SVG

Контур, построенный один раз, можно заливать, обводить или использовать для обрезки много раз: `svg_path(d)` в Rust, `Path2D` в TSX. Оба принимают данные контура SVG, которые разбираются нативно, что упрощает работу с иконками:

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

У `Path2D` те же методы контура, что и у контекста (`moveTo`, `arc`, `roundRect`, ...), а также `addPath(other)`. `new Path2D(other)` копирует контур.

<a id="gradients"></a>

## Градиенты

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

Конический градиент (`createConicGradient(startAngle, x, y)`, `CanvasGradient::conic(start_angle, center)`) разворачивает цвета вокруг точки; его начальный угол задаётся в радианах по часовой стрелке от оси x. Конический градиент на обведённой дуге даёт кольцо прогресса с градиентом.

<a id="text"></a>

## Текст

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

Семейства шрифтов те же, что и в стилях: системные семейства и названия шрифтов, поставляемых вашим приложением (см. [Шрифты](./fonts.md)).

<a id="images"></a>

## Изображения

Для рисования изображения в Rust нужен URL (у ресурса он такой: `LOGO.url`), а в TSX URL или импортированный ресурс (`import logo from "./logo.png"`). Изображение загружается нативно, а canvas перерисовывается после загрузки, поэтому отслеживать загрузку самостоятельно не нужно. Для удалённых URL действуют [сетевые разрешения](./sandbox-and-capabilities.md) приложения.

Canvas на iOS, macOS, Android, Windows, Linux и GPUI рисуют растровые изображения (PNG, JPEG, GIF, WebP, ...); на них источник SVG считается изображением, которое не удалось загрузить, и имя источника попадает в журнал. Показывайте изображения SVG через [`<Image>`](./images-and-assets.md#svg-images) или рисуйте их формы как контуры `Path2D`. В вебе canvas рисует то, что рисует браузер, включая SVG.

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

Форма с девятью аргументами (`draw_image_part`) принимает исходный прямоугольник в пикселях изображения.

<a id="driving-drawings-with-animated-values"></a>

## Управление рисунками с помощью анимированных значений

Любой числовой аргумент вызова рисования, а также заливка и обводка могут быть [анимированным значением](./animation.md#animated-values) или узлом, производным от него. Такие аргументы читаются во время рисования платформой, и когда значение анимируется, платформа перерисовывает сама, каждый кадр, без повторной записи рисунка и без выполнения вашего кода.

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

Конечный угол дуги равен `progress.mul(2π).sub(π/2)`: это узел, поэтому кольцо заполняется нативно в течение 900 мс, тогда как рисунок был записан один раз (и ещё один раз для подписи, которая читает сигнал). Секундная стрелка часов работает так же: `rotate(seconds.mul(π / 30))` с линейно анимируемым `seconds`.

Цвета анимируются так же: `.fill_style(&t.interpolate_colors(&[0.0, 1.0], &[rgb(0x54aeff), rgb(0xcf222e)]))` в Rust, `cx.fillStyle = t.interpolate({ inputRange: [0, 1], outputRange: ["#54aeff", "#cf222e"] })` в TSX.

<a id="touch-on-a-canvas"></a>

## Касания на canvas

Canvas это view, поэтому он принимает нажатия и работает с [системой респондеров](./touch-and-gestures.md#the-responder-system). Рисование пальцем записывает точки в сигнал и рисует их:

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

## Производительность

- Рисунок записывается в Rust (в TSX как вызовы JS у контекста) и передаётся платформе как одна операция; пересечений границы моста на каждый вызов нет.
- Каждое рисование записывается заново целиком. Держите объём работы пропорциональным тому, что показано, и храните данные, меняющиеся каждый кадр, в анимированных значениях, а не в сигналах.
- Рисунок со статической частью и часто меняющейся частью разделите на два canvas, расположенных друг над другом, чтобы перерисовывался только один.
- Внутри масштабируемого scroll view canvas перерисовываются в увеличенном разрешении, когда масштабирование заканчивается.

<a id="related"></a>

## См. также

- [Элемент `Canvas`](../elements/canvas.md): справочник.
- [Анимация](./animation.md): анимированные значения, `interpolate` и `Easing`.
- [Изображения и ресурсы](./images-and-assets.md): изображения приложения.
