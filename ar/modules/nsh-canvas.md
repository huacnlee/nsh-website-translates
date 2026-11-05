---
title: "Canvas"
description: "Canvas، سياق الرسم ثنائي الأبعاد، وPath2D والتدرجات اللونية، مع أجزاء HTML Canvas 2D التي يدعمها NSH."
order: 2.3
demo: mod-canvas
source_hash: c7a960d552328725
---

# Canvas

`Canvas` يرسم باستخدام سياق (context) من نمط HTML Canvas 2D. تقوم الدالة `draw` لديك **بتسجيل** الرسم، ثم تعيد المنصة تشغيله أصليًا (Core Graphics على iOS، و`android.graphics.Canvas` على Android) بدقة الشاشة. يمكن أن تكون الأرقام والألوان في الرسم [قيمًا متحركة](./nsh.md#animation): وعندما تتحرك، تعيد المنصة الرسم من تلقاء نفسها، دون تشغيل `draw` مرة أخرى.

```ts
import { Canvas, CanvasGradient, CanvasRenderingContext2D, Path2D } from "nsh";
```

راجع [Canvas](../docs/canvas.md) للاطلاع على الدليل، و[`<Canvas>`](../elements/canvas.md) للاطلاع على خصائصه (props).

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

عرض (view) يُرسم باستخدام سياق ثنائي الأبعاد. يقبل كل [خصائص العرض](../elements/view.md) (الأنماط، والفئات، ومعالجات اللمس، وإمكانية الوصول، `ref`)، بالإضافة إلى:

| الخاصية | النوع | الوصف |
|---|---|---|
| `draw` | `(cx, { width, height }) => void` | ترسم الـ canvas. تعمل بمجرد معرفة الحجم، وتعمل مرة أخرى عندما تتغير الإشارات (signals) التي تقرؤها، وعندما يتغير حجم الـ canvas. القيم المتحركة الممررة كأرقام أو ألوان تتحرك دون تشغيلها. |

حدّد حجم الـ canvas من خلال نمطه (`width` / `height`، `flex: 1`، `aspectRatio`، ...). الإحداثيات بالنقاط (points)، والأصل في أعلى اليسار.

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

## التحريك دون إعادة الرسم

أي وسيط من النوع `CanvasNumber` وأي طلاء (`fillStyle`، `strokeStyle`) يقبل `AnimatedNode`. عندها يقرأ الـ canvas العقدة (node) أثناء الرسم، ويعيد الرسم أصليًا في كل إطار من إطارات حركتها:

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

السياق الذي يستقبله `draw`. الاستدعاءات تسجّل العمليات فقط؛ وترسمها المنصة بعد عودة `draw`.

<a id="state-and-transforms"></a>

### الحالة والتحويلات

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

| العضو | الوصف |
|---|---|
| `canvas` | حجم الـ canvas بالنقاط. |
| `save()` / `restore()` | يدفع / يسحب حالة الرسم (التحويل، والقص، والأنماط). |
| `translate(x, y)` | ينقل نقطة الأصل. |
| `scale(x, y)` | يغيّر مقياس المحاور. |
| `rotate(angle)` | يدير المحاور؛ بالراديان، في اتجاه عقارب الساعة. |
| `transform(a, b, c, d, e, f)` | يضرب التحويل في المصفوفة `[a c e; b d f]`. |
| `setTransform(a, b, c, d, e, f)` | يستبدل التحويل. |
| `resetTransform()` | يعود إلى مصفوفة الوحدة. |

<a id="properties"></a>

### الخصائص

| الخاصية | النوع | الوصف |
|---|---|---|
| `fillStyle` | `CanvasPaint` | لون أو تدرج لوني أو عقدة لون أصلية تستخدمها `fill` و`fillRect` و`fillText`. |
| `strokeStyle` | `CanvasPaint` | الشيء نفسه للخطوط (strokes). |
| `lineWidth` | `CanvasNumber` | عرض الخط بالنقاط. |
| `lineCap` | `"butt" \| "round" \| "square"` | كيفية إنهاء الخطوط. |
| `lineJoin` | `"miter" \| "round" \| "bevel"` | كيفية وصل أجزاء الخط. |
| `miterLimit` | `number` | تُشطَّب وصلات miter الأطول من هذه القيمة (بوحدات عرض الخط). |
| `lineDashOffset` | `CanvasNumber` | النقطة التي يبدأ منها نمط الشرطات. |
| `globalAlpha` | `CanvasNumber` | شفافية ما سيُرسم لاحقًا، من 0 إلى 1. |
| `globalCompositeOperation` | `string` | كيفية اندماج ما سيُرسم لاحقًا مع الـ canvas (`"source-over"`، `"multiply"`، ...). |
| `shadowColor` | `string` | لون الظلال (الشفاف: بلا ظل). |
| `shadowBlur` | `number` | تمويه الظل بالنقاط. |
| `shadowOffsetX`، `shadowOffsetY` | `number` | إزاحة الظل بالنقاط. |
| `font` | `string` | صيغة CSS المختصرة `font`، مثل `"600 14px Inter"` (الأحجام بوحدات `px` أو `pt` أو `rem`). |
| `textAlign` | `"start" \| "end" \| "left" \| "right" \| "center"` | موضع النص أفقيًا بالنسبة إلى x. |
| `textBaseline` | `"alphabetic" \| "top" \| "hanging" \| "middle" \| "ideographic" \| "bottom"` | موضع النص رأسيًا بالنسبة إلى y. |

الشرطات: `setLineDash(segments: number[])` و`getLineDash(): number[]`.

<a id="paths"></a>

### المسارات

للسياق مسار حالي، يُبنى بالأساليب نفسها المستخدمة في [`Path2D`](#path2d):

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

جميع الإحداثيات من النوع `CanvasNumber`. الزوايا بالراديان، في اتجاه عقارب الساعة بدءًا من المحور x. الخاصية `radii` في `roundRect` هي نصف قطر واحد أو من 2 إلى 4 كما في CSS `border-radius` (الزاوية العلوية اليسرى أولًا).

<a id="drawing"></a>

### الرسم

```ts
fill(path?: Path2D | "nonzero" | "evenodd", rule?: "nonzero" | "evenodd"): void;
stroke(path?: Path2D): void;
clip(path?: Path2D | "nonzero" | "evenodd", rule?: "nonzero" | "evenodd"): void;
fillRect(x, y, w, h): void;
strokeRect(x, y, w, h): void;
clearRect(x, y, w, h): void;
```

| الأسلوب | الوصف |
|---|---|
| `fill(path?, rule?)` | يملأ المسار الحالي (أو `path`) باستخدام `fillStyle`، وفق قاعدة nonzero (الافتراضية) أو even-odd. |
| `stroke(path?)` | يرسم حدود المسار الحالي (أو `path`) باستخدام `strokeStyle`. |
| `clip(path?, rule?)` | يقصر ما سيُرسم لاحقًا على المسار. |
| `fillRect`، `strokeRect` | مستطيل، دون التأثير في المسار الحالي. |
| `clearRect` | يجعل مستطيلًا شفافًا. |

<a id="text"></a>

### النص

```ts
fillText(text: string, x: CanvasNumber, y: CanvasNumber, maxWidth?: number): void;
strokeText(text: string, x: CanvasNumber, y: CanvasNumber, maxWidth?: number): void;
measureText(text: string): TextMetrics; // { width: number }
```

`measureText` متزامنة: فهي تقيس باستخدام محرك النص في المنصة و`font` الحالي. يُبلَّغ عن `width` فقط.

```ts
cx.font = "11px system-ui";
const label = "100";
cx.fillText(label, 40 - cx.measureText(label).width, 20);
```

<a id="gradients"></a>

### التدرجات اللونية

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

### الصور

```ts
drawImage(image: string | ImageAsset, ...args: CanvasNumber[]): void;
```

ترسم صورة تُعطى كعنوان URL أو كأصل مستورد (`import logo from "./logo.png"`). تُحمَّل أصليًا؛ ويعيد الـ canvas الرسم بمجرد انتهاء التحميل. الأصل المستورد يرسم الملف المستورد نفسه؛ استورد الملف `@3x` لرسم صورة حادة على كل شاشة. هناك ثلاث صيغ، كما في HTML:

- `drawImage(image, dx, dy)`: بحجمها الطبيعي.
- `drawImage(image, dx, dy, dw, dh)`: مع تغيير مقياسها داخل مستطيل.
- `drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh)`: جزء منها (المصدر بوحدات بكسل الصورة).

## Path2D

```ts
class Path2D {
  constructor(path?: Path2D | string);
  addPath(path: Path2D): void;
  // and every path method: moveTo, lineTo, quadraticCurveTo, bezierCurveTo,
  // arc, arcTo, ellipse, rect, roundRect, closePath
}
```

مسار قابل لإعادة الاستخدام للملء أو الرسم أو القص. يقوم المنشئ (constructor) بنسخ `Path2D` آخر أو بتحليل بيانات مسار SVG أصليًا:

```ts
const heart = new Path2D("M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9z");
cx.save();
cx.scale(4, 4);
cx.fillStyle = "#ef4444";
cx.fill(heart);
cx.restore();
```

<a id="not-supported"></a>

## غير مدعوم

الوصول إلى البكسلات (`getImageData`، `putImageData`)، و`filter`، و`isPointInPath`، وصور SVG غير متاحة. اللون أو الخط غير الصالح يُسقِط تلك العملية وحدها، كما في HTML Canvas.
