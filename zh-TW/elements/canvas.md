---
title: "Canvas"
description: "Canvas 元素:使用 2D context 進行自訂繪圖,並以原生方式重播。"
order: 60
group: primitives
demo: el-canvas
source_hash: db2829bf8681ec52
---

# Canvas

Canvas 是一種由你自行使用 2D 繪圖 API(即 HTML Canvas 2D API)繪製的 view:圖表、儀表、圓環、簽名、自訂形狀。繪圖程式碼只負責記錄操作,平台再以螢幕解析度原生重播這些操作(在 iOS 與 Mac Catalyst 上使用 Core Graphics,在 Android 上使用 `android.graphics.Canvas`)。Rust 以 `canvas(painter)`(一個記錄繪圖內容的 `Painter`)建立;TSX 則使用來自 `nsh` 的 `<Canvas>` 及其 `draw` 函式。

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

在 TSX 中,`Canvas` 會建立原生 canvas view、量測其大小,並以 context 與 canvas 的尺寸執行你的 `draw` 函式(請參閱 [Canvas API](../modules/nsh-canvas.md))。在 Rust 中,`canvas(..)` 接受一個 `Painter`,或是回傳該物件的閉包:當閉包所讀取的內容改變時,它會重新繪製;若繪圖內容取決於尺寸,則尺寸來自 `on_layout`。

## Props

Canvas 接受 [view](./view.md) 的 props(樣式、按壓與手勢 props、`onLayout`、無障礙、`ref` 等),另外還有:

| Prop | Rust | Type | Description |
|---|---|---|---|
| `draw` | `canvas(painter)` | `(cx: CanvasRenderingContext2D, size: { width: number; height: number }) => void` | 繪製 canvas。在尺寸確定後執行,canvas 調整大小時再次執行,其所讀取的 signal 改變時也會再次執行。 |

請透過樣式(width / height、`flex`、長寬比)指定 canvas 的大小:其尺寸即為樣式所給定的尺寸。

<a id="when-it-redraws"></a>

## 重新繪製的時機

繪圖過程的追蹤方式與 effect 相同:在其中讀取 signal,就會讓繪圖訂閱該 signal。

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

數字與顏色也可以是[原生動畫值](../modules/nsh.md#animation)(`CanvasNumber`、`CanvasPaint`;在 Rust 中,凡是可放入數字之處都可使用 `&AnimatedValue`):此時平台會在這些值產生動畫的期間自行重新繪製,應用程式的程式碼不需要為每一幀做任何處理。

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

`CanvasRenderingContext2D` 是瀏覽器版本的子集,而 `Painter` 以 snake case 的方法提供相同的操作(`move_to`、`line_to`、`fill_rect`、`fill_text`、`stroke_color` 等):狀態堆疊(`save`、`restore`)、變換、路徑(`moveTo`、`lineTo`、`arc`、`arcTo`、`ellipse`、`rect`、`roundRect`、Bézier 曲線)、`fill` / `stroke` / `clip`(也可用於 `Path2D`,它接受 SVG 路徑資料;在 Rust 中為 `fill_svg` / `stroke_svg`)、矩形、文字(`fillText`、`strokeText`、`measureText`)、線性 / 放射狀 / 圓錐漸層、虛線、陰影、`globalAlpha`、`globalCompositeOperation` 與 `drawImage`(以 URL 或資源載入圖片)。所有成員皆列於 [Canvas API 參考文件](../modules/nsh-canvas.md);[canvas 指南](../docs/canvas.md)則會逐步說明如何繪製圖表與動畫圖形。

座標以 point 為單位,原點位於左上角。`measureText` 為同步執行,並回傳 `width`。Rust 的 `Painter` 也能回應命中測試(`is_point_in_path`、`is_point_in_stroke`)。

Context 繪製的是向量操作與圖片:像素存取(`getImageData` / `putImageData`)、`filter` 與 SVG 圖片不在其支援範圍內。

<a id="events"></a>

## 事件

[view 事件](./view.md#events):`onPress`、`onLayout`、手勢與觸控。若要處理相對於繪圖區域的點按,請在 `onTouchEnd` 中讀取 `locationX` / `locationY`,或使用 `onResponderMove` 追蹤拖曳(Rust 中為 `.on_responder_move(..)`,搭配 `e.location`)。

<a id="ref-methods"></a>

## Ref 方法

無自有的方法。
