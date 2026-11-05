---
title: "Canvas"
description: "RustとTSXでキャンバスに描画する方法 - 2D操作、パスとSVGパスデータ、グラデーション、テキスト、画像、シグナルによる再描画、アニメーション値を使った描画のアニメーション化。"
order: 44
group: ui
demo: guide-canvas
source_hash: a49acbd4da5a3c5f
---

# Canvas

canvas は、HTML Canvas 2D API の操作で描画するビューです。チャート、プログレスリング、ゲージ、署名、カスタムアイコンなど、ビューを組み合わせるより描画したほうが簡単なものに使います。Rust では `canvas(..)` が `Painter` の記録した内容を表示します。TSX では `nsh` の `Canvas` が `draw` 関数を受け取り、その中で描画を一度にまとめて記録します。プラットフォームがこれをネイティブに再生する（iOS では Core Graphics、Android では `android.graphics.Canvas`）ため、画面の解像度で描画され、どのピクセル密度でも鮮明に表示されます。

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

canvas は [view](../elements/view.md) が受け取るもの（スタイル、クラス、タッチハンドラ、アクセシビリティ、ref）をすべて受け取り、さらに描画内容を持ちます。サイズはスタイルまたはレイアウトから与える必要があり、中身は描画そのものです。座標の単位はポイントで、原点は左上です。

<a id="when-the-drawing-is-made"></a>

## 描画が行われるタイミング

Rust では、`canvas(move || ..)` はバインディング内で記録します。クロージャは一度実行され、読み取った [signal](./reactivity.md) が変化するとあらためて実行されます。canvas のサイズに依存する描画では、`.on_layout(..)` から得たサイズを signal に保持し、上の例のようにそれを読み取ります。TSX では、`draw(cx, { width, height })` は次のタイミングで実行されます。

- canvas のサイズが確定したとき（最初のレイアウトの後）
- canvas のサイズが変更されたとき
- 読み取った signal が変化したとき

実行のたびに、描画全体が置き換えられます。描画中に signal を読み取ることで、canvas はデータに追従します。

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

描画呼び出しは記録するだけです。実際の描画は記録の完了後にプラットフォームが行うため、ピクセルを読み戻すことはできません。記録は 1 つの操作としてプラットフォームに送られます。

<a id="the-2d-operations"></a>

## 2D 操作

操作は HTML Canvas 2D API のサブセットです。TSX では `CanvasRenderingContext2D`、Rust では `Painter` のメソッドを Rust の命名で使います（`begin_path`、`fill_rect`、`line_width`、`set_transform`、`draw_image` など。色は `fill_color` / `stroke_color`、グラデーションは `fill_style` / `stroke_style`）。サポートされているものは次のとおりです。

**状態**

| メンバー | Rust | 説明 |
|---|---|---|
| `save()`、`restore()` | `.save()`、`.restore()` | 描画状態（スタイル、変換、クリップ）をプッシュ／ポップします。 |
| `fillStyle`、`strokeStyle` | `.fill_color(..)`、`.fill_style(..)`、`.stroke_color(..)`、`.stroke_style(..)` | CSS の色、グラデーション、または色を補間するアニメーション値。 |
| `lineWidth`、`lineCap`、`lineJoin`、`miterLimit` | `.line_width(..)`、`.line_cap(..)`、`.line_join(..)`、`.miter_limit(..)` | ストロークの形状。 |
| `setLineDash(segments)`、`getLineDash()`、`lineDashOffset` | `.line_dash(..)`、`.line_dash_offset(..)` | 破線。 |
| `globalAlpha` | `.global_alpha(..)` | 次に描画するものの不透明度（0..1）。 |
| `globalCompositeOperation` | `.composite(Composite::DestinationOut)` | 合成方法: `"source-over"`、`"destination-out"`、`"multiply"`、`"screen"` など。 |
| `shadowColor`、`shadowBlur`、`shadowOffsetX`、`shadowOffsetY` | `.shadow(color, blur, offset)` | 影。 |
| `font` | `.font(..)` | CSS の `font` ショートハンド: `"600 14px Inter"`（サイズは px、pt、rem）。`small-caps` や数値形式の `tabular-nums`、`oldstyle-nums` などをサイズの前に置くこともできます。 |
| `fontVariantNumeric` | `.font_variant_numeric(..)` | `"tabular-nums"` はすべての数字を同じ幅にするため、変化する数値（カウンター、価格、軸ラベル）が揺れません。`"proportional-nums"`、`"oldstyle-nums"`、`"lining-nums"`、`"normal"` も指定できます。これは NSH の追加機能です（CSS の `font-variant-numeric` に相当）。`font` を設定しても保持されます。ブラウザでは無視されます。 |
| `textAlign`、`textBaseline` | `.text_align(..)`、`.text_baseline(..)` | テキストの配置。 |

**変換**: `translate(x, y)`、`scale(x, y)`、`rotate(angle)`（ラジアン、時計回り）、`transform(a, b, c, d, e, f)`、`setTransform(a, b, c, d, e, f)`、`resetTransform()`。

**パス**: `beginPath()`、`moveTo`、`lineTo`、`quadraticCurveTo`、`bezierCurveTo`、`arc`、`arcTo`、`ellipse`、`rect`、`roundRect(x, y, w, h, radii)`、`closePath()`。続いて `fill(rule?)`、`stroke()`、`clip(rule?)`があり、それぞれパスも受け取れます（Rust では `fill_path`、`stroke_path`、`clip_path`）。塗りつぶしルールは `"nonzero"` と `"evenodd"` です。

**矩形**: `fillRect`、`strokeRect`、`clearRect`。

**テキスト**: `fillText(text, x, y, maxWidth?)`、`strokeText(...)`、`measureText(text)`（プラットフォームのテキストエンジンが現在の `font` を使って同期的に計測します。対応するのは `width` のみ）。Rust では `measure_text(font, text)` が幅を返します。

**ヒットテスト**: `isPointInPath(path?, x, y, rule?)` と `isPointInStroke(path?, x, y)`（`Painter` では `path_contains`、`stroke_contains`、`is_point_in_path`、`is_point_in_stroke`）は同期的に結果を返し、記録されたジオメトリ（現在の変換、パス、`lineWidth`、`lineCap`）から計算されます。描画した内容とパスを保持しておけば、タップ位置にある図形を調べられます。

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

ストロークは、角を丸い結合として、破線なしでテストされます。アニメーション値として与えられた座標は 0 として扱われます。

**グラデーション**: `createLinearGradient`、`createRadialGradient`、`createConicGradient`。それぞれ `addColorStop(offset, color)` を持ちます（Rust では `CanvasGradient::linear`、`radial`、`conic`、`add_color_stop`）。

**画像**: `drawImage(image, dx, dy)`、`drawImage(image, dx, dy, dw, dh)`、`drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh)`（Rust では `draw_image(url, dest)` と `draw_image_part(..)`）。

TSX では、`cx.canvas.width` と `cx.canvas.height` が canvas のサイズをポイント単位で返します。

**サポート範囲**: 描画操作です。ピクセルの書き込みはプラットフォームが行うため、`getImageData` / `putImageData` などのピクセルアクセスは対象外です。`filter` や `drawImage` での SVG 画像も対象外です。無効な色やフォントを指定した場合は、HTML Canvas と同様に、その操作だけが破棄されます。

<a id="paths-and-svg-path-data"></a>

## パスと SVG パスデータ

一度作成したパスは、何度でも塗りつぶし、ストローク、クリップに使えます。Rust では `svg_path(d)`、TSX では `Path2D` を使います。どちらも SVG パスデータを受け取り、ネイティブに解析するため、アイコンを簡単に扱えます。

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

`Path2D` は、コンテキストと同じパスメソッド（`moveTo`、`arc`、`roundRect` など）と `addPath(other)` を持ちます。`new Path2D(other)` はパスをコピーします。

<a id="gradients"></a>

## グラデーション

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

円錐グラデーション（`createConicGradient(startAngle, x, y)`、`CanvasGradient::conic(start_angle, center)`）は、ある点を中心に色を回転方向に変化させます。開始角度はラジアンで、x 軸から時計回りです。ストロークした円弧に円錐グラデーションを使うと、グラデーションのプログレスリングになります。

<a id="text"></a>

## テキスト

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

フォントファミリーはスタイルと同じです。システムのファミリーと、アプリが同梱するフォントの名前を使えます（[Fonts](./fonts.md) を参照）。

<a id="images"></a>

## 画像

画像の描画には、Rust では URL（アセットの URL は `LOGO.url`）、TSX では URL またはインポートしたアセット（`import logo from "./logo.png"`）を指定します。画像はネイティブに読み込まれ、読み込みが完了すると canvas が再描画されるため、読み込みを自分で追跡する必要はありません。リモート URL にはアプリの[ネットワーク権限](./sandbox-and-capabilities.md)が適用されます。

iOS、macOS、Android、Windows、Linux、GPUI の canvas は、ビットマップ画像（PNG、JPEG、GIF、WebP など）を描画します。これらのプラットフォームでは、SVG ソースは読み込みに失敗する画像として扱われ、ログにその名前が出力されます。SVG 画像は [`<Image>`](./images-and-assets.md#svg-images) で表示するか、図形を `Path2D` パスとして描画してください。Web では、canvas はブラウザが描画できるもの（SVG を含む）を描画します。

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

9 引数の形式（`draw_image_part`）では、ソース矩形を画像のピクセル単位で指定します。

<a id="driving-drawings-with-animated-values"></a>

## アニメーション値による描画の駆動

描画呼び出しの任意の数値引数と、塗りおよびストロークのペイントには、[アニメーション値](./animation.md#animated-values)またはそこから派生したノードを指定できます。このような引数はプラットフォームが描画する際に読み取られ、値がアニメーションすると、描画を再記録したりコードを実行したりすることなく、プラットフォームが毎フレーム自動的に再描画します。

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

円弧の終了角度は `progress.mul(2π).sub(π/2)` です。これはノードなので、描画は一度だけ記録されたまま（ラベルは signal を読み取るため、その分もう一度記録されます）、リングは 900 ms の間ネイティブにスイープします。時計の秒針も同じ方法で実現できます。`rotate(seconds.mul(π / 30))` と、線形にアニメーションする `seconds` を使います。

色も同じようにアニメーションできます。Rust では `.fill_style(&t.interpolate_colors(&[0.0, 1.0], &[rgb(0x54aeff), rgb(0xcf222e)]))`、TSX では `cx.fillStyle = t.interpolate({ inputRange: [0, 1], outputRange: ["#54aeff", "#cf222e"] })` を使います。

<a id="touch-on-a-canvas"></a>

## canvas へのタッチ

canvas はビューなので、プレスや[レスポンダーシステム](./touch-and-gestures.md#the-responder-system)を受け取れます。指での描画は、点を signal に記録して描画します。

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

## パフォーマンス

- 描画は Rust で記録され（TSX では JS がコンテキストを呼び出す形で記録され）、1 つの操作としてプラットフォームに送られます。呼び出しごとのブリッジ越えは発生しません。
- 描画のたびにすべてが再記録されます。作業量は表示される内容に比例させ、毎フレーム変化するデータは signal ではなくアニメーション値に保持してください。
- 静的な部分と頻繁に変化する部分がある描画は、2 つの canvas を重ねて分割すると、再描画されるのは片方だけになります。
- ズームするスクロールビュー内では、ズームの終了時に canvas がズーム後の解像度で再描画されます。

<a id="related"></a>

## 関連項目

- [`Canvas` 要素](../elements/canvas.md): リファレンス。
- [Animation](./animation.md): アニメーション値、`interpolate`、`Easing`。
- [Images and assets](./images-and-assets.md): アプリの画像。
