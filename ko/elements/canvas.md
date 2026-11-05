---
title: "Canvas"
description: "Canvas 요소: 2D 컨텍스트를 사용한 커스텀 드로잉을 네이티브로 재생합니다."
order: 60
group: primitives
demo: el-canvas
source_hash: db2829bf8681ec52
---

# Canvas

Canvas는 HTML Canvas 2D API와 같은 2D 드로잉 API로 직접 그리는 뷰입니다. 차트, 게이지, 링, 서명, 커스텀 도형 등에 사용합니다. 드로잉 코드는 작업을 기록하고, 플랫폼은 이를 화면 해상도에서 네이티브로 재생합니다(iOS와 Mac Catalyst에서는 Core Graphics, Android에서는 `android.graphics.Canvas`). Rust에서는 드로잉을 기록하는 `Painter`인 `canvas(painter)`로 만들고, TSX에서는 `nsh`의 `<Canvas>`와 `draw` 함수로 만듭니다.

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

TSX에서 `Canvas`는 네이티브 canvas 뷰를 만들고 크기를 측정한 다음, 컨텍스트와 canvas의 크기를 인자로 `draw` 함수를 실행합니다([Canvas API](../modules/nsh-canvas.md) 참고). Rust에서 `canvas(..)`는 `Painter` 또는 이를 반환하는 클로저를 받습니다. 클로저는 읽은 값이 바뀔 때 다시 그리며, 드로잉이 크기에 의존하는 경우 크기는 `on_layout`에서 가져옵니다.

## Props

Canvas는 [뷰](./view.md)의 props(스타일, 프레스 및 제스처 props, `onLayout`, 접근성, `ref` 등)에 더해 다음 prop을 받습니다.

| Prop | Rust | 타입 | 설명 |
|---|---|---|---|
| `draw` | `canvas(painter)` | `(cx: CanvasRenderingContext2D, size: { width: number; height: number }) => void` | canvas를 그립니다. 크기가 정해지면 실행되고, canvas의 크기가 바뀔 때와 드로잉에서 읽은 signal이 바뀔 때 다시 실행됩니다. |

스타일(width / height, `flex`, 종횡비)로 canvas에 크기를 지정하세요. canvas의 크기는 스타일이 지정한 크기입니다.

<a id="when-it-redraws"></a>

## 다시 그려지는 시점

드로잉은 effect처럼 추적됩니다. 드로잉 안에서 signal을 읽으면 해당 signal을 구독하게 됩니다.

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

숫자와 색상은 [네이티브 애니메이션 값](../modules/nsh.md#animation)(`CanvasNumber`, `CanvasPaint`, Rust에서는 숫자가 들어가는 모든 곳에 `&AnimatedValue`)이 될 수도 있습니다. 이 경우 값이 애니메이션되는 동안 플랫폼이 스스로 다시 그리며, 앱 코드에서 프레임마다 처리할 작업은 없습니다.

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

## 컨텍스트

`CanvasRenderingContext2D`는 브라우저 컨텍스트의 부분집합이며, `Painter`는 동일한 연산을 스네이크 케이스 메서드로 제공합니다(`move_to`, `line_to`, `fill_rect`, `fill_text`, `stroke_color` 등). 지원하는 기능은 다음과 같습니다. 상태 스택(`save`, `restore`), 변환, 경로(`moveTo`, `lineTo`, `arc`, `arcTo`, `ellipse`, `rect`, `roundRect`, 베지어 곡선), `fill` / `stroke` / `clip`(SVG 경로 데이터를 받는 `Path2D`에도 사용 가능하며, Rust에서는 `fill_svg` / `stroke_svg`), 사각형, 텍스트(`fillText`, `strokeText`, `measureText`), 선형 / 방사형 / 원뿔형 그라디언트, 선 대시, 그림자, `globalAlpha`, `globalCompositeOperation`, `drawImage`(URL 또는 에셋으로 지정한 이미지). 모든 멤버는 [Canvas API 레퍼런스](../modules/nsh-canvas.md)에 나와 있으며, [canvas 가이드](../docs/canvas.md)에서는 차트와 애니메이션 그래픽을 그리는 방법을 단계별로 설명합니다.

좌표는 포인트 단위이며 원점은 왼쪽 위입니다. `measureText`는 동기식이며 `width`를 반환합니다. Rust의 `Painter`는 히트 테스트에도 응답합니다(`is_point_in_path`, `is_point_in_stroke`).

컨텍스트는 벡터 연산과 이미지를 그립니다. 픽셀 접근(`getImageData` / `putImageData`), `filter`, SVG 이미지는 지원 범위에 포함되지 않습니다.

<a id="events"></a>

## 이벤트

[뷰 이벤트](./view.md#events)를 사용할 수 있습니다. `onPress`, `onLayout`, 제스처, 터치 이벤트가 있습니다. 드로잉 기준 좌표의 탭을 처리하려면 `onTouchEnd`에서 `locationX` / `locationY`를 읽거나, `onResponderMove`(Rust에서는 `e.location`와 함께 `.on_responder_move(..)`)로 드래그를 추적하세요.

<a id="ref-methods"></a>

## Ref 메서드

자체 메서드는 없습니다.
