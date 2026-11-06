---
title: "Canvas"
description: "Canvas、2D 繪圖環境、Path2D 與漸層,以及 NSH 支援的 HTML Canvas 2D 部分。"
order: 2.3
demo: mod-canvas
source_hash: c7a960d552328725
---


# Canvas

`Canvas` 使用 HTML Canvas 2D 風格的 context 繪圖。你的 `draw` 函數會**記錄**繪圖內容,平台再以螢幕解像度以原生方式重播(iOS 使用 Core Graphics,Android 使用 `android.graphics.Canvas`)。繪圖中的數字和顏色可以是[動畫值](./nsh.md#animation):動畫進行時,平台會自行重繪,無需再次執行 `draw`。

```ts
import { Canvas, CanvasGradient, CanvasRenderingContext2D, Path2D } from "nsh";
```

請參閱 [Canvas](../docs/canvas.md) 指南,以及 [`<Canvas>`](../elements/canvas.md) 的屬性說明。

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

以 2D context 繪製的視圖。它支援所有[視圖屬性](../elements/view.md)(樣式、class、觸控處理器、無障礙功能、`ref`),另外還有:

| 屬性 | 類型 | 說明 |
|---|---|---|
| `draw` | `(cx, { width, height }) => void` | 繪製畫布。尺寸確定後執行一次,所讀取的 signal 改變時再次執行,畫布調整大小時亦會再次執行。以數字或顏色傳入的動畫值會直接進行動畫,無需再次執行此函數。 |

請透過樣式為畫布指定尺寸(`width` / `height`、`flex: 1`、`aspectRatio` 等)。座標以點(point)為單位,原點位於左上角。

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

## 無需重繪的動畫

任何型別為 `CanvasNumber` 的參數,以及任何繪製樣式(`fillStyle`、`strokeStyle`),都接受 `AnimatedNode`。畫布會在繪製時讀取該節點,並在其動畫的每一幀以原生方式重繪:

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
| `canvas` | 畫布的尺寸(以點為單位)。 |
| `save()` / `restore()` | 推入 / 彈出繪圖狀態(變換、裁剪、樣式)。 |
| `translate(x, y)` | 移動原點。 |
| `scale(x, y)` | 縮放座標軸。 |
| `rotate(angle)` | 旋轉座標軸;單位為弧度,順時針方向。 |
| `transform(a, b, c, d, e, f)` | 將變換乘以矩陣 `[a c e; b d f]`。 |
| `setTransform(a, b, c, d, e, f)` | 取代目前的變換。 |
| `resetTransform()` | 還原為單位矩陣。 |

<a id="properties"></a>

### 屬性

| 屬性 | 類型 | 說明 |
|---|---|---|
| `fillStyle` | `CanvasPaint` | `fill`、`fillRect`、`fillText` 所使用的顏色、漸變或原生顏色節點。 |
| `strokeStyle` | `CanvasPaint` | 描邊的對應設定。 |
| `lineWidth` | `CanvasNumber` | 描邊寬度(以點為單位)。 |
| `lineCap` | `"butt" \| "round" \| "square"` | 描邊的端點形狀。 |
| `lineJoin` | `"miter" \| "round" \| "bevel"` | 描邊線段的連接方式。 |
| `miterLimit` | `number` | 超過此長度(以線寬計)的尖角連接會被削成斜角。 |
| `lineDashOffset` | `CanvasNumber` | 虛線樣式的起始位置。 |
| `globalAlpha` | `CanvasNumber` | 之後繪製內容的不透明度,範圍 0..1。 |
| `globalCompositeOperation` | `string` | 之後繪製的內容如何與畫布混合(`"source-over"`、`"multiply"` 等)。 |
| `shadowColor` | `string` | 陰影的顏色(透明:無陰影)。 |
| `shadowBlur` | `number` | 陰影模糊程度(以點為單位)。 |
| `shadowOffsetX`、`shadowOffsetY` | `number` | 陰影偏移量(以點為單位)。 |
| `font` | `string` | CSS `font` 簡寫,例如 `"600 14px Inter"`(尺寸可用 `px`、`pt` 或 `rem`)。 |
| `textAlign` | `"start" \| "end" \| "left" \| "right" \| "center"` | 文字相對於其 x 座標的水平位置。 |
| `textBaseline` | `"alphabetic" \| "top" \| "hanging" \| "middle" \| "ideographic" \| "bottom"` | 文字相對於其 y 座標的垂直位置。 |

虛線:`setLineDash(segments: number[])` 和 `getLineDash(): number[]`。

<a id="paths"></a>

### 路徑

context 具有一條目前路徑,其建構方法與 [`Path2D`](#path2d) 相同:

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

所有座標均為 `CanvasNumber`。角度以弧度計,由 x 軸起順時針方向。`roundRect` 的 `radii` 可以是單一半徑,或如 CSS `border-radius` 般的 2 至 4 個值(由左上角開始)。

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
| `fill(path?, rule?)` | 以 `fillStyle` 填充目前路徑(或 `path`),可按非零環繞規則(預設)或奇偶規則填充。 |
| `stroke(path?)` | 以 `strokeStyle` 為目前路徑(或 `path`)描邊。 |
| `clip(path?, rule?)` | 將之後繪製的內容限制在該路徑之內。 |
| `fillRect`、`strokeRect` | 矩形,不會影響目前路徑。 |
| `clearRect` | 將矩形範圍變為透明。 |

<a id="text"></a>

### 文字

```ts
fillText(text: string, x: CanvasNumber, y: CanvasNumber, maxWidth?: number): void;
strokeText(text: string, x: CanvasNumber, y: CanvasNumber, maxWidth?: number): void;
measureText(text: string): TextMetrics; // { width: number }
```

`measureText` 為同步操作:它使用平台的文字引擎,並按目前的 `font` 進行量度。只會回報 `width`。

```ts
cx.font = "11px system-ui";
const label = "100";
cx.fillText(label, 40 - cx.measureText(label).width, 20);
```

<a id="gradients"></a>

### 漸變

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

### 圖像

```ts
drawImage(image: string | ImageAsset, ...args: CanvasNumber[]): void;
```

繪製以 URL 或匯入資源(`import logo from "./logo.png"`)指定的圖像。圖像以原生方式載入,載入完成後畫布會再次繪製。匯入的資源會繪製所匯入的檔案本身;若要在所有螢幕上都清晰顯示,請匯入 `@3x` 檔案。與 HTML 一樣,共有三種形式:

- `drawImage(image, dx, dy)`:以原始尺寸繪製。
- `drawImage(image, dx, dy, dw, dh)`:縮放至指定矩形內。
- `drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh)`:繪製其中一部分(來源以圖像像素為單位)。

## Path2D

```ts
class Path2D {
  constructor(path?: Path2D | string);
  addPath(path: Path2D): void;
  // and every path method: moveTo, lineTo, quadraticCurveTo, bezierCurveTo,
  // arc, arcTo, ellipse, rect, roundRect, closePath
}
```

可重複使用的路徑,可用於填充、描邊或裁剪。建構函數可複製另一個 `Path2D`,或以原生方式解析 SVG 路徑資料:

```ts
const heart = new Path2D("M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9z");
cx.save();
cx.scale(4, 4);
cx.fillStyle = "#ef4444";
cx.fill(heart);
cx.restore();
```

<a id="not-supported"></a>

## 不支援

不支援像素存取(`getImageData`、`putImageData`)、`filter`、`isPointInPath` 及 SVG 圖像。與 HTML Canvas 一樣,無效的顏色或字型只會令該項操作被略過。
