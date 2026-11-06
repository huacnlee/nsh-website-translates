---
title: "Canvas"
description: "Rust와 TSX에서 canvas에 그리기 - 2D 연산, 경로와 SVG 경로 데이터, 그라디언트, 텍스트, 이미지, signal을 이용한 다시 그리기, 그리고 animated value로 그림에 애니메이션 적용하기."
order: 44
group: ui
demo: guide-canvas
source_hash: a49acbd4da5a3c5f
---

# Canvas

canvas는 HTML Canvas 2D API의 연산으로 그림을 그리는 뷰입니다. 차트, 진행률 링, 게이지, 서명, 커스텀 아이콘처럼 뷰로 구성하기보다 직접 그리는 편이 쉬운 모든 것에 사용합니다. Rust에서는 `canvas(..)`가 `Painter`가 기록한 내용을 보여 주고, TSX에서는 `nsh`의 `Canvas`가 드로잉을 한 번에 기록하는 `draw` 함수를 받습니다. 플랫폼은 기록된 내용을 화면 해상도에 맞춰 네이티브로 재생하므로(iOS에서는 Core Graphics, Android에서는 `android.graphics.Canvas`) 어떤 픽셀 밀도에서도 그림이 선명하게 유지됩니다.

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

canvas는 [view](../elements/view.md)가 받는 모든 것(스타일, 클래스, 터치 핸들러, 접근성, ref)과 더불어 드로잉을 받습니다. 스타일이나 레이아웃에서 크기가 정해져야 하며, 콘텐츠는 드로잉입니다. 좌표는 포인트 단위이고 원점은 왼쪽 위입니다.

<a id="when-the-drawing-is-made"></a>

## 그리기가 수행되는 시점

Rust에서는 `canvas(move || ..)`가 바인딩 안에서 기록합니다. 클로저는 한 번 실행되고, 클로저가 읽은 [signal](./reactivity.md)이 변경되면 다시 실행됩니다. canvas의 크기에 따라 달라지는 드로잉은 `.on_layout(..)`로 받은 크기를 signal에 보관하고 위 예제처럼 그 signal을 읽습니다. TSX에서는 `draw(cx, { width, height })`가 다음 시점에 실행됩니다.

- canvas의 크기가 확정되었을 때(첫 레이아웃 이후)
- canvas의 크기가 바뀔 때
- 드로잉에서 읽은 signal이 변경될 때

실행할 때마다 전체 드로잉이 교체됩니다. 그리는 동안 signal을 읽으면 canvas가 데이터를 따라가게 됩니다.

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

드로잉 호출은 기록만 합니다. 실제 그리기는 기록이 끝난 뒤 플랫폼이 수행하므로 픽셀을 다시 읽어 올 수 없습니다. 기록은 하나의 연산으로 플랫폼에 전달됩니다.

<a id="the-2d-operations"></a>

## 2D 연산

연산은 HTML Canvas 2D API의 부분 집합입니다. TSX에서는 `CanvasRenderingContext2D`이고, Rust에서는 `Painter`의 메서드이며 Rust식 이름을 사용합니다(`begin_path`, `fill_rect`, `line_width`, `set_transform`, `draw_image` 등. 색상은 `fill_color` / `stroke_color`, 그레이디언트는 `fill_style` / `stroke_style`). 지원되는 항목은 다음과 같습니다.

**상태**

| 멤버 | Rust | 설명 |
|---|---|---|
| `save()`, `restore()` | `.save()`, `.restore()` | 드로잉 상태(스타일, 변환, 클리핑)를 push 및 pop합니다. |
| `fillStyle`, `strokeStyle` | `.fill_color(..)`, `.fill_style(..)`, `.stroke_color(..)`, `.stroke_style(..)` | CSS 색상, 그레이디언트 또는 색상을 보간하는 애니메이션 값. |
| `lineWidth`, `lineCap`, `lineJoin`, `miterLimit` | `.line_width(..)`, `.line_cap(..)`, `.line_join(..)`, `.miter_limit(..)` | 선(stroke) 모양. |
| `setLineDash(segments)`, `getLineDash()`, `lineDashOffset` | `.line_dash(..)`, `.line_dash_offset(..)` | 점선. |
| `globalAlpha` | `.global_alpha(..)` | 이후에 그려지는 대상의 불투명도(0..1). |
| `globalCompositeOperation` | `.composite(Composite::DestinationOut)` | 합성 방식: `"source-over"`, `"destination-out"`, `"multiply"`, `"screen"` 등. |
| `shadowColor`, `shadowBlur`, `shadowOffsetX`, `shadowOffsetY` | `.shadow(color, blur, offset)` | 그림자. |
| `font` | `.font(..)` | CSS `font` 단축 속성: `"600 14px Inter"`(크기는 px, pt 또는 rem). `small-caps`와 숫자 형식 `tabular-nums`, `oldstyle-nums` 등은 크기 앞에 올 수 있습니다. |
| `fontVariantNumeric` | `.font_variant_numeric(..)` | `"tabular-nums"`는 모든 숫자의 너비를 같게 만들어, 변하는 숫자(카운터, 가격, 축 레이블)가 흔들리지 않게 합니다. `"proportional-nums"`, `"oldstyle-nums"`, `"lining-nums"`, `"normal"`도 있습니다. CSS의 `font-variant-numeric`에 대한 NSH 확장이며, `font`를 설정해도 유지됩니다. 브라우저는 이를 무시합니다. |
| `textAlign`, `textBaseline` | `.text_align(..)`, `.text_baseline(..)` | 텍스트 배치. |

**변환**: `translate(x, y)`, `scale(x, y)`, `rotate(angle)`(라디안, 시계 방향), `transform(a, b, c, d, e, f)`, `setTransform(a, b, c, d, e, f)`, `resetTransform()`.

**경로**: `beginPath()`, `moveTo`, `lineTo`, `quadraticCurveTo`, `bezierCurveTo`, `arc`, `arcTo`, `ellipse`, `rect`, `roundRect(x, y, w, h, radii)`, `closePath()`. 이어서 `fill(rule?)`, `stroke()`, `clip(rule?)`가 있으며, 각각 경로도 받을 수 있습니다(Rust에서는 `fill_path`, `stroke_path`, `clip_path`). 채우기 규칙은 `"nonzero"`와 `"evenodd"`입니다.

**사각형**: `fillRect`, `strokeRect`, `clearRect`.

**텍스트**: `fillText(text, x, y, maxWidth?)`, `strokeText(...)`, `measureText(text)`(현재 `font`를 사용해 플랫폼의 텍스트 엔진이 동기적으로 측정하며, `width`만 제공합니다). Rust에서는 `measure_text(font, text)`가 너비를 반환합니다.

**히트 테스트**: `isPointInPath(path?, x, y, rule?)`와 `isPointInStroke(path?, x, y)`(`Painter`에서는 `path_contains`, `stroke_contains`, `is_point_in_path`, `is_point_in_stroke`)는 기록된 지오메트리(현재 변환, 경로, `lineWidth`, `lineCap`)로 계산하여 동기적으로 응답합니다. 탭한 위치의 도형을 찾으려면 드로잉과 그린 경로를 보관해 두세요.

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

선(stroke)은 둥근 조인(round join)을 적용하고 점선은 적용하지 않은 상태로 테스트하며, 애니메이션 값으로 주어진 좌표는 0으로 계산합니다.

**그레이디언트**: `createLinearGradient`, `createRadialGradient`, `createConicGradient`. 각각 `addColorStop(offset, color)`를 가집니다(Rust에서는 `CanvasGradient::linear`, `radial`, `conic`, `add_color_stop`).

**이미지**: `drawImage(image, dx, dy)`, `drawImage(image, dx, dy, dw, dh)`, `drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh)`(Rust에서는 `draw_image(url, dest)`와 `draw_image_part(..)`).

TSX에서는 `cx.canvas.width`와 `cx.canvas.height`가 canvas의 크기를 포인트 단위로 제공합니다.

**지원 범위**: 드로잉 연산입니다. 픽셀은 플랫폼이 기록하므로 `getImageData` / `putImageData` 및 기타 픽셀 접근은 지원 범위에 포함되지 않으며, `filter`와 `drawImage`의 SVG 이미지도 마찬가지입니다. 잘못된 색상이나 글꼴은 HTML Canvas와 마찬가지로 해당 연산 하나만 무시됩니다.

<a id="paths-and-svg-path-data"></a>

## 경로와 SVG 경로 데이터

한 번 만든 경로는 여러 번 채우기, 선 그리기, 클리핑에 사용할 수 있습니다. Rust에서는 `svg_path(d)`, TSX에서는 `Path2D`입니다. 둘 다 네이티브로 파싱되는 SVG 경로 데이터를 받으므로 아이콘을 쉽게 만들 수 있습니다.

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

`Path2D`는 컨텍스트와 같은 경로 메서드(`moveTo`, `arc`, `roundRect` 등)와 `addPath(other)`를 가집니다. `new Path2D(other)`는 경로를 복사합니다.

<a id="gradients"></a>

## 그레이디언트

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

원뿔형(conic) 그레이디언트(`createConicGradient(startAngle, x, y)`, `CanvasGradient::conic(start_angle, center)`)는 한 점을 중심으로 색상을 회전하며 펼칩니다. 시작 각도는 라디안이며 x축에서 시계 방향입니다. 선으로 그린 호에 conic 그레이디언트를 적용하면 그레이디언트 진행률 링이 됩니다.

<a id="text"></a>

## 텍스트

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

글꼴 패밀리는 스타일에서와 같습니다. 시스템 패밀리와 앱에 포함된 글꼴의 이름을 사용합니다([Fonts](./fonts.md) 참고).

<a id="images"></a>

## 이미지

이미지를 그리려면 Rust에서는 URL(에셋의 URL은 `LOGO.url`)을, TSX에서는 URL 또는 import한 에셋(`import logo from "./logo.png"`)을 전달합니다. 이미지는 네이티브로 로드되고 로드가 끝나면 canvas가 다시 그려지므로 로딩 상태를 직접 추적할 필요가 없습니다. 원격 URL에는 앱의 [network capabilities](./sandbox-and-capabilities.md)가 적용됩니다.

iOS, macOS, Android, Windows, Linux, GPUI의 canvas는 비트맵 이미지(PNG, JPEG, GIF, WebP 등)를 그립니다. 이 플랫폼에서 SVG 소스는 로드에 실패하는 이미지로 처리되며 로그에 해당 이미지의 이름이 남습니다. SVG 이미지는 [`<Image>`](./images-and-assets.md#svg-images)로 표시하거나, 그 도형을 `Path2D` 경로로 그리세요. 웹에서는 canvas가 브라우저가 그릴 수 있는 것을 그대로 그리며, SVG도 포함됩니다.

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

인자가 아홉 개인 형식(`draw_image_part`)은 이미지 픽셀 단위의 소스 사각형을 받습니다.

<a id="driving-drawings-with-animated-values"></a>

## 애니메이션 값으로 드로잉 구동하기

드로잉 호출의 모든 숫자 인자와 채우기 및 선 페인트는 [animated value](./animation.md#animated-values) 또는 그로부터 파생된 노드가 될 수 있습니다. 이러한 인자는 플랫폼이 그리는 동안 읽히며, 값이 애니메이션되면 플랫폼이 드로잉을 다시 기록하거나 사용자 코드를 실행하지 않고 매 프레임 스스로 다시 그립니다.

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

호의 끝 각도는 `progress.mul(2π).sub(π/2)`입니다. 이는 노드이므로, 드로잉은 한 번만 기록되었는데도(그리고 signal을 읽는 레이블 때문에 한 번 더) 링이 900ms 동안 네이티브로 채워집니다. 시계의 초침도 같은 방식으로 동작합니다. `rotate(seconds.mul(π / 30))`에 선형으로 애니메이션되는 `seconds`를 사용하면 됩니다.

색상도 같은 방식으로 애니메이션됩니다. Rust에서는 `.fill_style(&t.interpolate_colors(&[0.0, 1.0], &[rgb(0x54aeff), rgb(0xcf222e)]))`, TSX에서는 `cx.fillStyle = t.interpolate({ inputRange: [0, 1], outputRange: ["#54aeff", "#cf222e"] })`를 사용합니다.

<a id="touch-on-a-canvas"></a>

## canvas에서의 터치

canvas는 뷰이므로 press와 [responder system](./touch-and-gestures.md#the-responder-system)을 받을 수 있습니다. 손가락으로 그리기는 점을 signal에 기록하고 그 점들을 그리는 방식으로 구현합니다.

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

## 성능

- 드로잉은 Rust에서(TSX에서는 JS가 컨텍스트를 호출하여) 기록되고 하나의 연산으로 플랫폼에 전달됩니다. 호출마다 브리지를 건너는 일은 없습니다.
- 드로잉할 때마다 모든 것을 다시 기록합니다. 작업량을 화면에 표시되는 내용에 비례하게 유지하고, 매 프레임 바뀌는 데이터는 signal이 아니라 애니메이션 값에 두세요.
- 정적인 부분과 자주 바뀌는 부분이 함께 있는 드로잉은 두 개의 canvas로 나누어 서로 겹쳐 쌓으면 한쪽만 다시 그려집니다.
- 확대/축소가 가능한 scroll view 안에서는 확대/축소가 끝날 때 canvas가 확대된 해상도로 다시 그려집니다.

<a id="related"></a>

## 관련 문서

- [`Canvas` 요소](../elements/canvas.md): 레퍼런스.
- [Animation](./animation.md): 애니메이션 값, `interpolate`, `Easing`.
- [Images and assets](./images-and-assets.md): 앱의 이미지.
