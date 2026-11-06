---
title: "Canvas"
description: "Canvas、2D 繪圖環境、Path2D 與漸層，以及 NSH 所支援的 HTML Canvas 2D 部分。"
order: 2.3
demo: mod-canvas
source_hash: c7a960d552328725
---

# Canvas

`Canvas` 使用 HTML Canvas 2D 風格的 context 進行繪圖。你的 `draw` 函式會**記錄**繪圖內容,平台再以螢幕解析度原生重播這些內容(iOS 上使用 Core Graphics,Android 上使用 `android.graphics.Canvas`)。繪圖中的數字與顏色可以是[動畫值](./nsh.md#animation):當它們產生動畫時,平台會自行重繪,無須再次執行 `draw`。

```ts
import { Canvas, CanvasGradient, CanvasRenderingContext2D, Path2D } from "nsh";
```

請參閱 [Canvas](../docs/canvas.md) 取得使用指南,並參閱 [`<Canvas>`](../elements/canvas.md) 了解其 props。

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

以 2D context 繪製的 view。它接受所有 [view props](../elements/view.md)(樣式、class、觸控處理器、無障礙、`ref`),另外還有:

| Prop | 型別 | 說明 |
|---|---|---|
| `draw` | `(cx, { width, height }) => void` | 繪製 canvas。在尺寸確定後執行,當它所讀取的 signal 變更時會再次執行,canvas 調整大小時也會再次執行。以數字或顏色傳入的動畫值會產生動畫,而不會重新執行它。 |

請透過樣式(`width` / `height`、`flex: 1`、`aspectRatio` 等)為 canvas 指定尺寸。座標以 point 為單位,原點位於左上角。

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

## 不重繪的動畫

任何型別為 `CanvasNumber` 的引數,以及任何 paint(`fillStyle`、`strokeStyle`)都接受 `AnimatedNode`。此時 canvas 會在繪製時讀取該節點,並在其動畫的每一幀以原生方式重繪:

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

`draw` 所接收的 context。呼叫只會記錄操作,平台會在 `draw` 返回後才進行繪製。

<a id="state-and-transforms"></a>

### 狀態與變換

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

| 成員 | 說明 |
|---|---|
| `canvas` | canvas 的尺寸,以 point 為單位。 |
| `save()` / `restore()` | 推入/彈出繪圖狀態(變換、裁切、樣式)。 |
| `translate(x, y)` | 移動原點。 |
| `scale(x, y)` | 縮放座標軸。 |
| `rotate(angle)` | 旋轉座標軸;單位為弧度,順時針。 |
| `transform(a, b, c, d, e, f)` | 將目前的變換乘上矩陣 `[a c e; b d f]`。 |
| `setTransform(a, b, c, d, e, f)` | 取代目前的變換。 |
| `resetTransform()` | 還原為單位矩陣。 |

<a id="properties"></a>

### 屬性

| 屬性 | 型別 | 說明 |
|---|---|---|
| `fillStyle` | `CanvasPaint` | 供 `fill`、`fillRect`、`fillText` 使用的顏色、漸層或原生顏色節點。 |
| `strokeStyle` | `CanvasPaint` | 同上,用於描邊。 |
| `lineWidth` | `CanvasNumber` | 描邊寬度,以 point 為單位。 |
| `lineCap` | `"butt" \| "round" \| "square"` | 描邊的端點樣式。 |
| `lineJoin` | `"miter" \| "round" \| "bevel"` | 描邊線段的接合方式。 |
| `miterLimit` | `number` | 超過此長度(以線寬計)的斜接(miter)接合會改為斜切(bevel)。 |
| `lineDashOffset` | `CanvasNumber` | 虛線樣式的起始位置。 |
| `globalAlpha` | `CanvasNumber` | 接下來繪製內容的不透明度,範圍 0..1。 |
| `globalCompositeOperation` | `string` | 接下來繪製的內容如何與 canvas 合成(`"source-over"`、`"multiply"` 等)。 |
| `shadowColor` | `string` | 陰影的顏色(透明:無陰影)。 |
| `shadowBlur` | `number` | 陰影模糊程度,以 point 為單位。 |
| `shadowOffsetX`、`shadowOffsetY` | `number` | 陰影偏移量,以 point 為單位。 |
| `font` | `string` | CSS `font` 簡寫,例如 `"600 14px Inter"`(尺寸可使用 `px`、`pt` 或 `rem`)。 |
| `textAlign` | `"start" \| "end" \| "left" \| "right" \| "center"` | 文字相對於其 x 的水平位置。 |
| `textBaseline` | `"alphabetic" \| "top" \| "hanging" \| "middle" \| "ideographic" \| "bottom"` | 文字相對於其 y 的垂直位置。 |

虛線:`setLineDash(segments: number[])` 與 `getLineDash(): number[]`。

<a id="paths"></a>

### 路徑

context 具有一個目前路徑,其建立方式與 [`Path2D`](#path2d) 使用相同的方法:

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

所有座標皆為 `CanvasNumber`。角度以弧度為單位,從 x 軸起順時針計算。`roundRect` 的 `radii` 可以是單一半徑,也可以如同 CSS `border-radius` 一樣給 2–4 個值(左上角在前)。

<a id="drawing"></a>

### 繪製

```ts
fill(path?: Path2D | "nonzero" | "evenodd", rule?: "nonzero" | "evenodd"): void;
stroke(path?: Path2D): void;
clip(path?: Path2D | "nonzero" | "evenodd", rule?: "nonzero" | "evenodd"): void;
fillRect(x, y, w, h): void;
strokeRect(x, y, w, h): void;
clearRect(x, y, w, h): void;
```

| 方法 | 說明 |
|---|---|
| `fill(path?, rule?)` | 以 `fillStyle` 填滿目前路徑(或 `path`),採用非零環繞(預設)或奇偶規則。 |
| `stroke(path?)` | 以 `strokeStyle` 描繪目前路徑(或 `path`)的邊線。 |
| `clip(path?, rule?)` | 將接下來繪製的內容限制在該路徑內。 |
| `fillRect`、`strokeRect` | 繪製矩形,不會影響目前路徑。 |
| `clearRect` | 將矩形區域清為透明。 |

<a id="text"></a>

### 文字

```ts
fillText(text: string, x: CanvasNumber, y: CanvasNumber, maxWidth?: number): void;
strokeText(text: string, x: CanvasNumber, y: CanvasNumber, maxWidth?: number): void;
measureText(text: string): TextMetrics; // { width: number }
```

`measureText` 是同步的:它使用平台的文字引擎與目前的 `font` 進行測量。只會回報 `width`。

```ts
cx.font = "11px system-ui";
const label = "100";
cx.fillText(label, 40 - cx.measureText(label).width, 20);
```

<a id="gradients"></a>

### 漸層

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

### 圖片

```ts
drawImage(image: string | ImageAsset, ...args: CanvasNumber[]): void;
```

繪製以 URL 或匯入資源(`import logo from "./logo.png"`)提供的圖片。圖片會以原生方式載入,載入完成後 canvas 會再次繪製。匯入的資源會繪製匯入的檔案本身;請匯入 `@3x` 檔案,以便在所有螢幕上都能清晰繪製。與 HTML 相同,共有三種形式:

- `drawImage(image, dx, dy)`:以原始尺寸繪製。
- `drawImage(image, dx, dy, dw, dh)`:縮放至指定矩形內。
- `drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh)`:只繪製其中一部分(來源以圖片像素為單位)。

## Path2D

```ts
class Path2D {
  constructor(path?: Path2D | string);
  addPath(path: Path2D): void;
  // and every path method: moveTo, lineTo, quadraticCurveTo, bezierCurveTo,
  // arc, arcTo, ellipse, rect, roundRect, closePath
}
```

可重複使用的路徑,可用於填滿、描邊或裁切。建構函式會複製另一個 `Path2D`,或以原生方式解析 SVG 路徑資料:

```ts
const heart = new Path2D("M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9z");
cx.save();
cx.scale(4, 4);
cx.fillStyle = "#ef4444";
cx.fill(heart);
cx.restore();
```

<a id="not-supported"></a>

## 不支援的功能

像素存取(`getImageData`、`putImageData`)、`filter`、`isPointInPath` 與 SVG 圖片皆不可用。與 HTML Canvas 相同,無效的顏色或字型會使該項操作被忽略。
