---
title: "Canvas"
description: "Canvas, 2D 드로잉 컨텍스트, Path2D 및 그라디언트와 함께 NSH가 지원하는 HTML Canvas 2D의 기능을 설명합니다."
order: 2.3
demo: mod-canvas
source_hash: c7a960d552328725
---

# Canvas

`Canvas`는 HTML Canvas 2D 스타일의 컨텍스트로 그립니다. `draw` 함수는 그리기를 **기록**하고, 플랫폼은 이를 화면 해상도에 맞춰 네이티브(iOS에서는 Core Graphics, Android에서는 `android.graphics.Canvas`)로 재생합니다. 그림에 사용되는 숫자와 색상은 [애니메이션 값](./nsh.md#animation)일 수 있습니다. 이 값이 애니메이션되면 `draw`를 다시 실행하지 않고도 플랫폼이 스스로 다시 그립니다.

```ts
import { Canvas, CanvasGradient, CanvasRenderingContext2D, Path2D } from "nsh";
```

가이드는 [Canvas](../docs/canvas.md)를, props는 [`<Canvas>`](../elements/canvas.md)를 참고하세요.

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

2D 컨텍스트로 그려지는 뷰입니다. 모든 [view prop](../elements/view.md)(style, classes, 터치 핸들러, 접근성, `ref`)을 받으며, 추가로 다음 prop을 받습니다.

| Prop | 타입 | 설명 |
|---|---|---|
| `draw` | `(cx, { width, height }) => void` | 캔버스를 그립니다. 크기가 확정되면 실행되고, 읽고 있는 signal이 변경되거나 캔버스 크기가 바뀌면 다시 실행됩니다. 숫자나 색상으로 전달된 애니메이션 값은 이 함수를 실행하지 않고도 애니메이션됩니다. |

캔버스의 크기는 style(`width` / `height`, `flex: 1`, `aspectRatio` 등)로 지정합니다. 좌표는 포인트 단위이며, 원점은 왼쪽 위입니다.

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

## 다시 그리지 않고 애니메이션하기

`CanvasNumber` 타입의 모든 인자와 모든 페인트(`fillStyle`, `strokeStyle`)는 `AnimatedNode`를 받을 수 있습니다. 그러면 캔버스는 그리는 동안 해당 노드를 읽고, 애니메이션의 매 프레임마다 네이티브에서 다시 그립니다.

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

`draw`가 받는 컨텍스트입니다. 호출은 작업을 기록할 뿐이며, 플랫폼은 `draw`가 반환된 후에 그립니다.

<a id="state-and-transforms"></a>

### 상태와 변환

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

| 멤버 | 설명 |
|---|---|
| `canvas` | 캔버스의 크기(포인트 단위)입니다. |
| `save()` / `restore()` | 그리기 상태(변환, 클립, 스타일)를 push / pop 합니다. |
| `translate(x, y)` | 원점을 이동합니다. |
| `scale(x, y)` | 축의 크기를 조절합니다. |
| `rotate(angle)` | 축을 회전합니다. 단위는 라디안이며 시계 방향입니다. |
| `transform(a, b, c, d, e, f)` | 변환에 행렬 `[a c e; b d f]`을 곱합니다. |
| `setTransform(a, b, c, d, e, f)` | 변환을 대체합니다. |
| `resetTransform()` | 항등 변환으로 되돌립니다. |

<a id="properties"></a>

### 속성

| 속성 | 타입 | 설명 |
|---|---|---|
| `fillStyle` | `CanvasPaint` | `fill`, `fillRect`, `fillText`에서 사용하는 색상, 그라디언트 또는 네이티브 색상 노드입니다. |
| `strokeStyle` | `CanvasPaint` | 선(stroke)에 대한 동일한 속성입니다. |
| `lineWidth` | `CanvasNumber` | 선 두께(포인트 단위)입니다. |
| `lineCap` | `"butt" \| "round" \| "square"` | 선의 끝 모양입니다. |
| `lineJoin` | `"miter" \| "round" \| "bevel"` | 선 세그먼트가 연결되는 모양입니다. |
| `miterLimit` | `number` | 이 값(선 두께 기준)보다 긴 miter 조인트는 bevel 처리됩니다. |
| `lineDashOffset` | `CanvasNumber` | 점선 패턴이 시작되는 위치입니다. |
| `globalAlpha` | `CanvasNumber` | 이후에 그려지는 대상의 불투명도이며 0..1 범위입니다. |
| `globalCompositeOperation` | `string` | 이후에 그려지는 대상이 캔버스와 합성되는 방식입니다(`"source-over"`, `"multiply"` 등). |
| `shadowColor` | `string` | 그림자 색상입니다(투명이면 그림자 없음). |
| `shadowBlur` | `number` | 그림자 블러(포인트 단위)입니다. |
| `shadowOffsetX`, `shadowOffsetY` | `number` | 그림자 오프셋(포인트 단위)입니다. |
| `font` | `string` | CSS `font` 단축 속성입니다. 예: `"600 14px Inter"` (크기는 `px`, `pt` 또는 `rem` 단위). |
| `textAlign` | `"start" \| "end" \| "left" \| "right" \| "center"` | x 좌표를 기준으로 텍스트가 가로로 놓이는 위치입니다. |
| `textBaseline` | `"alphabetic" \| "top" \| "hanging" \| "middle" \| "ideographic" \| "bottom"` | y 좌표를 기준으로 텍스트가 세로로 놓이는 위치입니다. |

점선: `setLineDash(segments: number[])` 및 `getLineDash(): number[]`.

<a id="paths"></a>

### 경로

컨텍스트에는 현재 경로가 있으며, [`Path2D`](#path2d)와 동일한 메서드로 만듭니다.

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

모든 좌표는 `CanvasNumber`입니다. 각도는 라디안이며 x축에서 시계 방향입니다. `roundRect`의 `radii`는 반지름 하나이거나, CSS `border-radius`처럼 2~4개입니다(왼쪽 위가 처음).

<a id="drawing"></a>

### 그리기

```ts
fill(path?: Path2D | "nonzero" | "evenodd", rule?: "nonzero" | "evenodd"): void;
stroke(path?: Path2D): void;
clip(path?: Path2D | "nonzero" | "evenodd", rule?: "nonzero" | "evenodd"): void;
fillRect(x, y, w, h): void;
strokeRect(x, y, w, h): void;
clearRect(x, y, w, h): void;
```

| 메서드 | 설명 |
|---|---|
| `fill(path?, rule?)` | 현재 경로(또는 `path`)를 `fillStyle`로 채웁니다. 규칙은 nonzero(기본값) 또는 even-odd입니다. |
| `stroke(path?)` | 현재 경로(또는 `path`)를 `strokeStyle`로 선을 그립니다. |
| `clip(path?, rule?)` | 이후에 그려지는 대상을 해당 경로 안으로 제한합니다. |
| `fillRect`, `strokeRect` | 현재 경로를 건드리지 않고 사각형을 그립니다. |
| `clearRect` | 사각형 영역을 투명하게 만듭니다. |

<a id="text"></a>

### 텍스트

```ts
fillText(text: string, x: CanvasNumber, y: CanvasNumber, maxWidth?: number): void;
strokeText(text: string, x: CanvasNumber, y: CanvasNumber, maxWidth?: number): void;
measureText(text: string): TextMetrics; // { width: number }
```

`measureText`는 동기 방식입니다. 플랫폼의 텍스트 엔진과 현재 `font`를 사용해 측정합니다. `width`만 보고됩니다.

```ts
cx.font = "11px system-ui";
const label = "100";
cx.fillText(label, 40 - cx.measureText(label).width, 20);
```

<a id="gradients"></a>

### 그라디언트

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

### 이미지

```ts
drawImage(image: string | ImageAsset, ...args: CanvasNumber[]): void;
```

URL 또는 import한 에셋(`import logo from "./logo.png"`)으로 지정한 이미지를 그립니다. 이미지는 네이티브에서 로드되며, 로드가 끝나면 캔버스가 다시 그려집니다. import한 에셋은 import한 파일 자체를 그립니다. 모든 화면에서 선명하게 그리려면 `@3x` 파일을 import하세요. HTML과 마찬가지로 세 가지 형태가 있습니다.

- `drawImage(image, dx, dy)`: 원래 크기로 그립니다.
- `drawImage(image, dx, dy, dw, dh)`: 사각형에 맞춰 크기를 조절해 그립니다.
- `drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh)`: 이미지의 일부만 그립니다(원본은 이미지 픽셀 단위).

## Path2D

```ts
class Path2D {
  constructor(path?: Path2D | string);
  addPath(path: Path2D): void;
  // and every path method: moveTo, lineTo, quadraticCurveTo, bezierCurveTo,
  // arc, arcTo, ellipse, rect, roundRect, closePath
}
```

채우기, 선 그리기 또는 클리핑에 재사용할 수 있는 경로입니다. 생성자는 다른 `Path2D`를 복사하거나 SVG 경로 데이터를 네이티브에서 파싱합니다.

```ts
const heart = new Path2D("M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9z");
cx.save();
cx.scale(4, 4);
cx.fillStyle = "#ef4444";
cx.fill(heart);
cx.restore();
```

<a id="not-supported"></a>

## 지원되지 않는 기능

픽셀 접근(`getImageData`, `putImageData`), `filter`, `isPointInPath` 및 SVG 이미지는 사용할 수 없습니다. 유효하지 않은 색상이나 폰트는 HTML Canvas와 마찬가지로 해당 작업 하나만 무시됩니다.
