---
title: "Canvas"
description: "Canvas、2D描画コンテキスト、Path2D、グラデーション、および NSH がサポートする HTML Canvas 2D の機能について説明します。"
order: 2.3
demo: mod-canvas
source_hash: c7a960d552328725
---

# Canvas

`Canvas` は HTML Canvas 2D 風のコンテキストで描画します。`draw` 関数は描画内容を**記録**し、プラットフォームがそれを画面の解像度でネイティブに再生します(iOS では Core Graphics、Android では `android.graphics.Canvas`)。描画内の数値や色は[アニメーション値](./nsh.md#animation)にできます。アニメーションする場合、プラットフォームが自前で再描画するため、`draw` は再実行されません。

```ts
import { Canvas, CanvasGradient, CanvasRenderingContext2D, Path2D } from "nsh";
```

ガイドは [Canvas](../docs/canvas.md)、props については [`<Canvas>`](../elements/canvas.md) を参照してください。

<a id="canvas-1"></a>

## Canvas

```ts
function Canvas(props: CanvasProps): JSX.Element;

interface CanvasProps extends ViewProps {
  draw: (cx: CanvasRenderingContext2D, size: CanvasSize) => void;
}

interface CanvasSize {
  width: number;   // points
  height: number;
}
```

2D コンテキストで描画されるビューです。すべての[ビュー props](../elements/view.md)(スタイル、クラス、タッチハンドラ、アクセシビリティ、`ref`)に加えて、次の props を受け取ります。

| Prop | 型 | 説明 |
|---|---|---|
| `draw` | `(cx, { width, height }) => void` | キャンバスを描画します。サイズが確定した時点で一度実行され、読み取っているシグナルが変化したとき、およびキャンバスがリサイズされたときに再度実行されます。数値や色として渡されたアニメーション値は、実行されなくてもアニメーションします。 |

キャンバスのサイズはスタイル(`width` / `height`、`flex: 1`、`aspectRatio` など)で指定します。座標の単位はポイントで、原点は左上です。

```tsx
import { Canvas, mount, signal, Text, View } from "nsh";

function App() {
  const values = signal([12, 30, 22, 48, 36, 60, 52, 75]);
  return (
    <View style={{ flex: 1, padding: 24 }}>
      <Canvas
        style={{ height: 160 }}
        draw={(cx, { width, height }) => {
          const v = values();
          const step = width / (v.length - 1);
          cx.strokeStyle = "#6366f1";
          cx.lineWidth = 3;
          cx.lineJoin = "round";
          cx.beginPath();
          v.forEach((n, i) => (i ? cx.lineTo(i * step, height - n * 2) : cx.moveTo(0, height - n * 2)));
          cx.stroke();
        }}
      />
      <Text onPress={() => values.update((v) => [...v.slice(1), Math.random() * 80])}>Next</Text>
    </View>
  );
}

mount(App);
```

<a id="animating-without-redrawing"></a>

## 再描画なしのアニメーション

`CanvasNumber` 型の引数や、ペイント(`fillStyle`、`strokeStyle`)には `AnimatedNode` を渡せます。キャンバスは描画中にそのノードを読み取り、アニメーションの各フレームでネイティブに再描画します。

```tsx
import { createAnimatedValue, Easing } from "nsh";
import { Canvas } from "nsh";

const progress = createAnimatedValue(0);

<Canvas
  style={{ width: 120, height: 120 }}
  draw={(cx, { width }) => {
    const c = width / 2;
    cx.lineWidth = 12;
    cx.lineCap = "round";
    cx.strokeStyle = "#6366f1";
    cx.beginPath();
    // The end angle is an animated node: animating `progress` redraws natively.
    cx.arc(c, c, c - 10, -Math.PI / 2, progress.mul(Math.PI * 2).sub(Math.PI / 2));
    cx.stroke();
  }}
/>;

progress.timing(0.75, { duration: 900, easing: Easing.inOut(Easing.cubic) });
```

```ts
type CanvasNumber = number | AnimatedNode;
type CanvasPaint = string | CanvasGradient | AnimatedNode;
```

## CanvasRenderingContext2D

`draw` が受け取るコンテキストです。呼び出しは操作を記録するだけで、プラットフォームは `draw` が返った後に描画します。

<a id="state-and-transforms"></a>

### 状態と変換

```ts
readonly canvas: { readonly width: number; readonly height: number };
save(): void;
restore(): void;
translate(x: CanvasNumber, y: CanvasNumber): void;
scale(x: CanvasNumber, y: CanvasNumber): void;
rotate(angle: CanvasNumber): void;
transform(a: CanvasNumber, b: CanvasNumber, c: CanvasNumber, d: CanvasNumber, e: CanvasNumber, f: CanvasNumber): void;
setTransform(a: CanvasNumber, b: CanvasNumber, c: CanvasNumber, d: CanvasNumber, e: CanvasNumber, f: CanvasNumber): void;
resetTransform(): void;
```

| メンバー | 説明 |
|---|---|
| `canvas` | キャンバスのサイズ(ポイント単位)。 |
| `save()` / `restore()` | 描画状態(変換、クリップ、スタイル)をプッシュ / ポップします。 |
| `translate(x, y)` | 原点を移動します。 |
| `scale(x, y)` | 軸を拡大・縮小します。 |
| `rotate(angle)` | 軸を回転します。単位はラジアンで、時計回りです。 |
| `transform(a, b, c, d, e, f)` | 変換に行列 `[a c e; b d f]` を乗算します。 |
| `setTransform(a, b, c, d, e, f)` | 変換を置き換えます。 |
| `resetTransform()` | 単位行列に戻します。 |

<a id="properties"></a>

### プロパティ

| プロパティ | 型 | 説明 |
|---|---|---|
| `fillStyle` | `CanvasPaint` | `fill`、`fillRect`、`fillText` で使用される色、グラデーション、またはネイティブのカラーノード。 |
| `strokeStyle` | `CanvasPaint` | ストローク用の同様の設定。 |
| `lineWidth` | `CanvasNumber` | ストロークの幅(ポイント単位)。 |
| `lineCap` | `"butt" \| "round" \| "square"` | ストロークの端点の形状。 |
| `lineJoin` | `"miter" \| "round" \| "bevel"` | ストロークのセグメントの接合方法。 |
| `miterLimit` | `number` | マイター接合がこの長さ(線幅単位)を超えると、ベベル接合になります。 |
| `lineDashOffset` | `CanvasNumber` | ダッシュパターンの開始位置。 |
| `globalAlpha` | `CanvasNumber` | 次に描画するものの不透明度(0..1)。 |
| `globalCompositeOperation` | `string` | 次に描画するものをキャンバスとどう合成するか(`"source-over"`、`"multiply"` など)。 |
| `shadowColor` | `string` | 影の色(transparent は影なし)。 |
| `shadowBlur` | `number` | 影のぼかし(ポイント単位)。 |
| `shadowOffsetX`、`shadowOffsetY` | `number` | 影のオフセット(ポイント単位)。 |
| `font` | `string` | CSS の `font` ショートハンド。例: `"600 14px Inter"`(サイズは `px`、`pt`、`rem` のいずれか)。 |
| `textAlign` | `"start" \| "end" \| "left" \| "right" \| "center"` | x に対するテキストの水平方向の配置。 |
| `textBaseline` | `"alphabetic" \| "top" \| "hanging" \| "middle" \| "ideographic" \| "bottom"` | y に対するテキストの垂直方向の配置。 |

ダッシュ: `setLineDash(segments: number[])` と `getLineDash(): number[]`。

<a id="paths"></a>

### パス

コンテキストは現在のパスを持ち、[`Path2D`](#path2d) と同じメソッドで構築します。

```ts
beginPath(): void;
moveTo(x, y): void;
lineTo(x, y): void;
quadraticCurveTo(cpx, cpy, x, y): void;
bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y): void;
arc(x, y, radius, startAngle, endAngle, counterclockwise?: boolean): void;
arcTo(x1, y1, x2, y2, radius): void;
ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle, counterclockwise?: boolean): void;
rect(x, y, w, h): void;
roundRect(x, y, w, h, radii?: CanvasNumber | CanvasNumber[]): void;
closePath(): void;
```

座標はすべて `CanvasNumber` です。角度の単位はラジアンで、x 軸から時計回りです。`roundRect` の `radii` は、半径 1 つ、または CSS の `border-radius` と同様に 2〜4 つ(左上が先頭)を指定できます。

<a id="drawing"></a>

### 描画

```ts
fill(path?: Path2D | "nonzero" | "evenodd", rule?: "nonzero" | "evenodd"): void;
stroke(path?: Path2D): void;
clip(path?: Path2D | "nonzero" | "evenodd", rule?: "nonzero" | "evenodd"): void;
fillRect(x, y, w, h): void;
strokeRect(x, y, w, h): void;
clearRect(x, y, w, h): void;
```

| メソッド | 説明 |
|---|---|
| `fill(path?, rule?)` | 現在のパス(または `path`)を `fillStyle` で塗りつぶします。ルールは nonzero(デフォルト)または even-odd です。 |
| `stroke(path?)` | 現在のパス(または `path`)を `strokeStyle` でストロークします。 |
| `clip(path?, rule?)` | 次に描画する範囲をパスに制限します。 |
| `fillRect`、`strokeRect` | 矩形を描画します。現在のパスには影響しません。 |
| `clearRect` | 矩形領域を透明にします。 |

<a id="text"></a>

### テキスト

```ts
fillText(text: string, x: CanvasNumber, y: CanvasNumber, maxWidth?: number): void;
strokeText(text: string, x: CanvasNumber, y: CanvasNumber, maxWidth?: number): void;
measureText(text: string): TextMetrics; // { width: number }
```

`measureText` は同期的に動作し、プラットフォームのテキストエンジンと現在の `font` を使って測定します。報告されるのは `width` のみです。

```ts
cx.font = "11px system-ui";
const label = "100";
cx.fillText(label, 40 - cx.measureText(label).width, 20);
```

<a id="gradients"></a>

### グラデーション

```ts
createLinearGradient(x0: number, y0: number, x1: number, y1: number): CanvasGradient;
createRadialGradient(x0: number, y0: number, r0: number, x1: number, y1: number, r1: number): CanvasGradient;
createConicGradient(startAngle: number, x: number, y: number): CanvasGradient;

class CanvasGradient {
  addColorStop(offset: number, color: string): void; // offset 0..1, any CSS color
}
```

```ts
const g = cx.createLinearGradient(0, 0, 0, height);
g.addColorStop(0, "rgba(99, 102, 241, 0.4)");
g.addColorStop(1, "rgba(99, 102, 241, 0)");
cx.fillStyle = g;
cx.fillRect(0, 0, width, height);
```

<a id="images"></a>

### 画像

```ts
drawImage(image: string | ImageAsset, ...args: CanvasNumber[]): void;
```

URL またはインポートしたアセット(`import logo from "./logo.png"`)として指定した画像を描画します。画像はネイティブに読み込まれ、読み込みが完了するとキャンバスが再描画されます。インポートしたアセットは、インポートしたファイルそのものを描画します。どの画面でも鮮明に描画するには、`@3x` ファイルをインポートしてください。HTML と同様に、3 つの形式があります。

- `drawImage(image, dx, dy)`: 元のサイズで描画します。
- `drawImage(image, dx, dy, dw, dh)`: 矩形に合わせて拡大・縮小して描画します。
- `drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh)`: 画像の一部を描画します(ソースは画像のピクセル単位)。

## Path2D

```ts
class Path2D {
  constructor(path?: Path2D | string);
  addPath(path: Path2D): void;
  // and every path method: moveTo, lineTo, quadraticCurveTo, bezierCurveTo,
  // arc, arcTo, ellipse, rect, roundRect, closePath
}
```

塗りつぶし、ストローク、クリップに使える再利用可能なパスです。コンストラクタは、別の `Path2D` をコピーするか、SVG パスデータをネイティブに解析します。

```ts
const heart = new Path2D("M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9z");
cx.save();
cx.scale(4, 4);
cx.fillStyle = "#ef4444";
cx.fill(heart);
cx.restore();
```

<a id="not-supported"></a>

## 非対応の機能

ピクセルアクセス(`getImageData`、`putImageData`)、`filter`、`isPointInPath`、および SVG 画像は利用できません。無効な色やフォントを指定すると、HTML Canvas と同様に、その操作のみが無視されます。
