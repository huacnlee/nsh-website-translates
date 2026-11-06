---
title: "Canvas"
description: "Canvas 元素:透過 2D context 進行自訂繪圖,並以原生方式重播。"
order: 60
group: primitives
demo: el-canvas
source_hash: db2829bf8681ec52
---


# Canvas

一個 canvas 是由你以 2D 繪圖 API(即 HTML Canvas 2D API)親自繪製內容的視圖,適用於圖表、儀表、環形圖、簽名和自訂形狀。繪圖程式碼會記錄各項操作,再由平台以原生方式按螢幕解析度重播(iOS 和 Mac Catalyst 使用 Core Graphics,Android 使用 `android.graphics.Canvas`)。Rust 以 `canvas(painter)` 建立 canvas,它是記錄繪圖內容的 `Painter`;TSX 則使用 `nsh` 的 `<Canvas>` 及其 `draw` 函式。

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

在 TSX 中,`Canvas` 會建立原生 canvas 視圖、量度其大小,並以 context 和 canvas 的尺寸執行你的 `draw` 函式(參閱 [Canvas API](../modules/nsh-canvas.md))。在 Rust 中,`canvas(..)` 接受一個 `Painter`,或一個回傳它的閉包:當閉包讀取的內容改變時,它會重新繪製;若繪圖內容取決於尺寸,則尺寸來自 `on_layout`。

## Props

Canvas 接受[視圖](./view.md)的 props(樣式、按壓和手勢 props、`onLayout`、無障礙、`ref` 等),另外還有:

| Prop | Rust | 類型 | 說明 |
|---|---|---|---|
| `draw` | `canvas(painter)` | `(cx: CanvasRenderingContext2D, size: { width: number; height: number }) => void` | 繪製 canvas。在尺寸確定後執行一次,canvas 改變大小時再執行,而它所讀取的 signal 改變時亦會再執行。 |

請透過樣式為 canvas 指定尺寸(寬度/高度、`flex`、長寬比):其尺寸以樣式所指定的為準。

<a id="when-it-redraws"></a>

## 重繪時機

繪圖過程會像 effect 一樣被追蹤:在其中讀取 signal,便會讓繪圖訂閱該 signal。

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

數字和顏色亦可以是[原生動畫值](../modules/nsh.md#animation)(`CanvasNumber`、`CanvasPaint`;在 Rust 中,凡是可放數字的地方都可放 `&AnimatedValue`):此時平台會在它們播放動畫期間自行重繪,應用程式的程式碼無需逐格處理。

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

## Context

`CanvasRenderingContext2D` 是瀏覽器版本的子集,而 `Painter` 則以 snake case 的方法提供相同的操作(`move_to`、`line_to`、`fill_rect`、`fill_text`、`stroke_color` 等):狀態堆疊(`save`、`restore`)、變換、路徑(`moveTo`、`lineTo`、`arc`、`arcTo`、`ellipse`、`rect`、`roundRect`、Bézier 曲線)、`fill` / `stroke` / `clip`(亦適用於 `Path2D`,它接受 SVG 路徑資料;在 Rust 中為 `fill_svg` / `stroke_svg`)、矩形、文字(`fillText`、`strokeText`、`measureText`)、線性 / 放射 / 錐形漸層、虛線、陰影、`globalAlpha`、`globalCompositeOperation` 及 `drawImage`(以 URL 或資源載入圖片)。所有成員均列於 [Canvas API 參考](../modules/nsh-canvas.md);[canvas 指南](../docs/canvas.md)會逐步介紹如何繪製圖表和動畫圖形。

座標以點(point)為單位,原點位於左上角。`measureText` 是同步的,並會回傳 `width`。Rust 的 `Painter` 亦可回應點擊測試(`is_point_in_path`、`is_point_in_stroke`)。

Context 繪製向量操作和圖片:像素存取(`getImageData` / `putImageData`)、`filter` 及 SVG 圖片不在其支援範圍內。

<a id="events"></a>

## 事件

[視圖事件](./view.md#events):`onPress`、`onLayout`、手勢和觸控。若要處理相對於繪圖區域的點按,請在 `onTouchEnd` 中讀取 `locationX` / `locationY`,或以 `onResponderMove` 追蹤拖曳(在 Rust 中為 `.on_responder_move(..)`,搭配 `e.location`)。

<a id="ref-methods"></a>

## Ref 方法

沒有專屬的方法。
