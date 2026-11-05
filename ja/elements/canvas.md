---
title: "Canvas"
description: "Canvas要素:2Dコンテキストを使用したカスタム描画。ネイティブで再生されます。"
order: 60
group: primitives
demo: el-canvas
source_hash: db2829bf8681ec52
---

# Canvas

Canvas は、HTML Canvas 2D API と同じ 2D 描画 API を使って自分で描画するビューです。チャート、ゲージ、リング、署名、カスタムシェイプなどに使えます。描画コードは操作を記録し、プラットフォームがそれをネイティブに、画面の解像度で再生します(iOS と Mac Catalyst では Core Graphics、Android では `android.graphics.Canvas`)。Rust では描画を記録した `Painter` である `canvas(painter)` で作成し、TSX では `nsh` の `<Canvas>` とその `draw` 関数で作成します。

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

TSX では、`Canvas` がネイティブの Canvas ビューを作成して測定し、コンテキストと Canvas のサイズを渡して `draw` 関数を実行します([Canvas API](../modules/nsh-canvas.md) を参照)。Rust では、`canvas(..)` は `Painter` またはそれを返すクロージャを受け取ります。クロージャは、読み取っている値が変化すると再び描画します。描画がサイズに依存する場合、サイズは `on_layout` から取得します。

## Props

Canvas は、[ビュー](./view.md)の props(スタイル、プレスおよびジェスチャーの props、`onLayout`、アクセシビリティ、`ref` など)に加えて、次の props を受け取ります。

| プロパティ | Rust | 型 | 説明 |
|---|---|---|---|
| `draw` | `canvas(painter)` | `(cx: CanvasRenderingContext2D, size: { width: number; height: number }) => void` | Canvas を描画します。サイズが確定すると実行され、Canvas のサイズが変わったときと、読み取っているシグナルが変化したときにも再度実行されます。 |

Canvas のサイズはスタイル(幅 / 高さ、`flex`、アスペクト比)で指定します。Canvas のサイズは、スタイルが与えるサイズそのものになります。

<a id="when-it-redraws"></a>

## 再描画のタイミング

描画はエフェクトと同様に追跡されます。描画の中でシグナルを読み取ると、その描画がそのシグナルを購読します。

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

数値と色には、[ネイティブアニメーション値](../modules/nsh.md#animation)(`CanvasNumber`、`CanvasPaint`。Rust では数値を指定できる場所ならどこでも `&AnimatedValue`)も使えます。この場合、アニメーション中はプラットフォームが自動的に再描画するため、アプリのコードでフレームごとに処理する必要はありません。

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

## コンテキスト

`CanvasRenderingContext2D` はブラウザのもののサブセットで、`Painter` には同じ操作がスネークケースのメソッドとして用意されています(`move_to`、`line_to`、`fill_rect`、`fill_text`、`stroke_color` など)。対応している操作は次のとおりです。ステートスタック(`save`、`restore`)、変換、パス(`moveTo`、`lineTo`、`arc`、`arcTo`、`ellipse`、`rect`、`roundRect`、ベジェ曲線)、`fill` / `stroke` / `clip`(SVG パスデータを受け付ける `Path2D` にも対応。Rust では `fill_svg` / `stroke_svg`)、矩形、テキスト(`fillText`、`strokeText`、`measureText`)、線形 / 放射状 / 円錐グラデーション、破線、シャドウ、`globalAlpha`、`globalCompositeOperation`、`drawImage`(URL またはアセットによる画像)。すべてのメンバーは [Canvas API リファレンス](../modules/nsh-canvas.md)に掲載しています。チャートやアニメーショングラフィックスの描画については、[Canvas ガイド](../docs/canvas.md)で順を追って説明しています。

座標の単位はポイントで、原点は左上です。`measureText` は同期的に動作し、`width` を返します。Rust の `Painter` はヒットテストにも対応しています(`is_point_in_path`、`is_point_in_stroke`)。

このコンテキストが描画するのはベクター操作と画像です。ピクセルアクセス(`getImageData` / `putImageData`)、`filter`、SVG 画像には対応していません。

<a id="events"></a>

## イベント

[ビューイベント](./view.md#events)に対応しています。`onPress`、`onLayout`、ジェスチャー、タッチです。描画座標に対するタップを処理するには、`onTouchEnd` で `locationX` / `locationY` を読み取るか、`onResponderMove`(Rust では `.on_responder_move(..)`、`e.location` と組み合わせて使用)でドラッグを追跡します。

<a id="ref-methods"></a>

## Ref メソッド

独自のものはありません。
