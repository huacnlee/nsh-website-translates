---
title: "Canvas"
description: "在 Rust 與 TSX 中於 canvas 上繪圖：2D 操作、路徑與 SVG 路徑資料、漸層、文字、圖片、依據 signal 重新繪製，以及使用動畫值為繪圖加上動畫。"
order: 44
group: ui
demo: guide-canvas
---

# Canvas

Canvas 是一種視圖，你可以用 HTML Canvas 2D API 的操作在上面繪圖：圖表、進度環、儀表、簽名、自訂圖示，以及任何用繪製比用視圖組合更容易實現的內容。在 Rust 中，`canvas(..)` 會顯示 `Painter` 所記錄的內容；在 TSX 中，來自 `nsh` 的 `Canvas` 接受一個 `draw` 函式，一次記錄完整的繪圖。平台會以原生方式重播這些繪圖（iOS 上使用 Core Graphics，Android 上使用 `android.graphics.Canvas`），並採用螢幕的解析度，因此無論像素密度為何，繪圖都能保持清晰。

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

Canvas 支援 [view](../elements/view.md) 支援的一切（樣式、class、觸控處理器、無障礙功能、ref），再加上它的繪圖內容。它需要從樣式或版面配置取得尺寸；它的內容就是繪圖。座標以 point 為單位，原點位於左上角。

<a id="when-the-drawing-is-made"></a>

## 繪圖的時機

在 Rust 中，`canvas(move || ..)` 在一個 binding 中進行記錄：閉包會執行一次，並在它所讀取的 [signal](./reactivity.md) 變更時再次執行。如果繪圖取決於 canvas 的尺寸，請把來自 `.on_layout(..)` 的尺寸存放在 signal 中並讀取它，如上所示。在 TSX 中，`draw(cx, { width, height })` 會在以下時機執行：

- canvas 的尺寸確定之後（首次版面配置之後）；
- canvas 被調整大小時再次執行；
- 它所讀取的 signal 變更時再次執行。

每次執行都會取代整個繪圖。在繪圖時讀取 signal，就是讓 canvas 跟隨資料變化的方式：

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

繪圖呼叫只會進行記錄：繪圖是在記錄完成後由平台執行的，因此無法讀回像素。記錄內容會作為一次操作傳送給平台。

<a id="the-2d-operations"></a>

## 2D 操作

這些操作是 HTML Canvas 2D API 的子集：在 TSX 中為 `CanvasRenderingContext2D`，在 Rust 中則是 `Painter` 的方法，並使用 Rust 的命名（`begin_path`、`fill_rect`、`line_width`、`set_transform`、`draw_image` 等；顏色透過 `fill_color` / `stroke_color`，漸層透過 `fill_style` / `stroke_style`）。支援的內容如下：

**狀態**

| 成員 | Rust | 說明 |
|---|---|---|
| `save()`、`restore()` | `.save()`、`.restore()` | 推入與彈出繪圖狀態（樣式、變換、裁剪）。 |
| `fillStyle`、`strokeStyle` | `.fill_color(..)`、`.fill_style(..)`、`.stroke_color(..)`、`.stroke_style(..)` | CSS 顏色、漸層，或對顏色進行插值的動畫值。 |
| `lineWidth`、`lineCap`、`lineJoin`、`miterLimit` | `.line_width(..)`、`.line_cap(..)`、`.line_join(..)`、`.miter_limit(..)` | 描邊形狀。 |
| `setLineDash(segments)`、`getLineDash()`、`lineDashOffset` | `.line_dash(..)`、`.line_dash_offset(..)` | 虛線。 |
| `globalAlpha` | `.global_alpha(..)` | 接下來繪製內容的不透明度，範圍 0..1。 |
| `globalCompositeOperation` | `.composite(Composite::DestinationOut)` | 合成方式：`"source-over"`、`"destination-out"`、`"multiply"`、`"screen"` 等。 |
| `shadowColor`、`shadowBlur`、`shadowOffsetX`、`shadowOffsetY` | `.shadow(color, blur, offset)` | 陰影。 |
| `font` | `.font(..)` | CSS `font` 簡寫：`"600 14px Inter"`（尺寸可用 px、pt 或 rem）；`small-caps` 與數字形式 `tabular-nums`、`oldstyle-nums` 等可以放在尺寸之前。 |
| `fontVariantNumeric` | `.font_variant_numeric(..)` | `"tabular-nums"` 會讓每個數字的寬度相同，因此會變動的數字（計數器、價格、座標軸標籤）不會抖動；另外還有 `"proportional-nums"`、`"oldstyle-nums"`、`"lining-nums"`、`"normal"`。這是 NSH 的新增功能（對應 CSS 的 `font-variant-numeric`）；設定 `font` 會保留它。瀏覽器會忽略它。 |
| `textAlign`、`textBaseline` | `.text_align(..)`、`.text_baseline(..)` | 文字位置。 |

**變換**：`translate(x, y)`、`scale(x, y)`、`rotate(angle)`（弧度，順時針）、`transform(a, b, c, d, e, f)`、`setTransform(a, b, c, d, e, f)`、`resetTransform()`。

**路徑**：`beginPath()`、`moveTo`、`lineTo`、`quadraticCurveTo`、`bezierCurveTo`、`arc`、`arcTo`、`ellipse`、`rect`、`roundRect(x, y, w, h, radii)`、`closePath()`；接著是 `fill(rule?)`、`stroke()` 與 `clip(rule?)`，它們也都可以接受路徑（Rust 中為 `fill_path`、`stroke_path`、`clip_path`）。填充規則為 `"nonzero"` 與 `"evenodd"`。

**矩形**：`fillRect`、`strokeRect`、`clearRect`。

**文字**：`fillText(text, x, y, maxWidth?)`、`strokeText(...)`、`measureText(text)`（由平台的文字引擎以目前的 `font` 同步量測；僅支援 `width`）。在 Rust 中，`measure_text(font, text)` 會回傳寬度。

**點擊測試**：`isPointInPath(path?, x, y, rule?)` 與 `isPointInStroke(path?, x, y)`（在 `Painter` 上則為 `path_contains`、`stroke_contains`、`is_point_in_path` 與 `is_point_in_stroke`）會同步回應，其結果根據已記錄的幾何資訊計算（目前的變換、路徑、`lineWidth` 與 `lineCap`）。請保留繪圖以及你所繪製的路徑，以找出被點擊位置下方的形狀：

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

描邊的測試採用圓角連接且不含虛線；以動畫值給定的座標一律視為 0。

**漸層**：`createLinearGradient`、`createRadialGradient`、`createConicGradient`，各自搭配 `addColorStop(offset, color)`（Rust 中為 `CanvasGradient::linear`、`radial`、`conic` 與 `add_color_stop`）。

**圖片**：`drawImage(image, dx, dy)`、`drawImage(image, dx, dy, dw, dh)`、`drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh)`（Rust 中為 `draw_image(url, dest)` 與 `draw_image_part(..)`）。

在 TSX 中，`cx.canvas.width` 與 `cx.canvas.height` 會給出 canvas 以 point 為單位的尺寸。

**支援的範圍**：繪圖操作。像素是由平台寫入的，因此 `getImageData` / `putImageData` 及其他像素存取都不在範圍內，`filter` 以及 `drawImage` 中的 SVG 圖片也是如此。無效的顏色或字型會捨棄該項操作，與 HTML Canvas 相同。

<a id="paths-and-svg-path-data"></a>

## 路徑與 SVG 路徑資料

建立一次的路徑可以被多次填充、描邊或裁剪：Rust 中使用 `svg_path(d)`，TSX 中使用 `Path2D`。兩者都接受 SVG 路徑資料，並由原生端解析，讓圖示的製作變得容易：

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

`Path2D` 擁有與 context 相同的路徑方法（`moveTo`、`arc`、`roundRect` 等）以及 `addPath(other)`。`new Path2D(other)` 會複製一個路徑。

<a id="gradients"></a>

## 漸層

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

圓錐漸層（`createConicGradient(startAngle, x, y)`、`CanvasGradient::conic(start_angle, center)`）會圍繞某個點掃過各種顏色；其起始角度以弧度表示，從 x 軸起順時針計算。在描邊的圓弧上使用圓錐漸層，就能做出漸層進度環。

<a id="text"></a>

## 文字

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

字型家族與樣式中相同：系統字型家族，以及你的應用程式隨附的字型名稱（請參閱 [Fonts](./fonts.md)）。

<a id="images"></a>

## 圖片

在 Rust 中，繪製圖片需要一個 URL（資產的 URL 為 `LOGO.url`）；在 TSX 中，則可使用 URL 或匯入的資產（`import logo from "./logo.png"`）。圖片由原生端載入，載入完成後 canvas 會重新繪製，因此你不需要自行追蹤載入狀態。遠端 URL 受應用程式的[網路權限](./sandbox-and-capabilities.md)限制。

iOS、macOS、Android、Windows、Linux 與 GPUI 上的 canvas 可繪製點陣圖片（PNG、JPEG、GIF、WebP 等）；在這些平台上，SVG 來源會被視為載入失敗的圖片，並由日誌指出其名稱。請使用 [`<Image>`](./images-and-assets.md#svg-images) 顯示 SVG 圖片，或將其形狀繪製為 `Path2D` 路徑。在 web 上，canvas 會繪製瀏覽器所能繪製的內容，包括 SVG。

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

九個參數的形式（`draw_image_part`）以圖片的像素為單位指定來源矩形。

<a id="driving-drawings-with-animated-values"></a>

## 以動畫值驅動繪圖

繪圖呼叫中的任何數字參數，以及填充與描邊的顏料，都可以是[動畫值](./animation.md#animated-values)或由它衍生的節點。這類參數會在平台繪製時被讀取；當該值產生動畫時，平台會自行逐幀重繪，無需重新記錄繪圖，也不會執行你的任何程式碼。

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

圓弧的結束角度是 `progress.mul(2π).sub(π/2)`：它是一個節點，因此進度環會以原生方式在 900 毫秒內掃過，而繪圖只被記錄了一次（標籤因為讀取了 signal，所以會再記錄一次）。時鐘的秒針也以同樣方式運作：`rotate(seconds.mul(π / 30))` 搭配以線性方式產生動畫的 `seconds`。

顏色也能以同樣的方式產生動畫：Rust 中使用 `.fill_style(&t.interpolate_colors(&[0.0, 1.0], &[rgb(0x54aeff), rgb(0xcf222e)]))`，TSX 中使用 `cx.fillStyle = t.interpolate({ inputRange: [0, 1], outputRange: ["#54aeff", "#cf222e"] })`。

<a id="touch-on-a-canvas"></a>

## Canvas 上的觸控

Canvas 是一種視圖，因此它支援按壓事件以及 [responder system](./touch-and-gestures.md#the-responder-system)。手指繪圖會把點記錄在 signal 中並加以繪製：

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

## 效能

- 繪圖在 Rust 中被記錄（在 TSX 中則是以 JS 呼叫 context），並作為一次操作傳送給平台；不會有每次呼叫都跨越橋接的情況。
- 每次繪圖都會重新記錄所有內容。請讓工作量與所顯示的內容成正比，並將每一幀都會變動的資料放在動畫值中，而不是 signal 中。
- 若繪圖包含靜態部分與頻繁變動的部分，請將它拆成兩個上下堆疊的 canvas，這樣只有其中一個會重繪。
- 在可縮放的 scroll view 內，canvas 會在縮放結束時以縮放後的解析度重新繪製。

<a id="related"></a>

## 相關內容

- [`Canvas` 元素](../elements/canvas.md)：參考文件。
- [Animation](./animation.md)：動畫值、`interpolate` 與 `Easing`。
- [Images and assets](./images-and-assets.md)：應用程式的圖片。
