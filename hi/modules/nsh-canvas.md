---
title: "Canvas"
description: "Canvas, 2D ड्रॉइंग कॉन्टेक्स्ट, Path2D और ग्रेडिएंट्स, साथ ही HTML Canvas 2D के वे हिस्से जिन्हें NSH सपोर्ट करता है।"
order: 2.3
demo: mod-canvas
source_hash: c7a960d552328725
---

# Canvas

`Canvas` HTML Canvas 2D-शैली के कॉन्टेक्स्ट से ड्रॉ करता है। आपका `draw` फ़ंक्शन ड्रॉइंग को **रिकॉर्ड** करता है; प्लेटफ़ॉर्म उसे स्क्रीन के रेज़ॉल्यूशन पर नेटिव रूप से रीप्ले करता है (iOS पर Core Graphics, Android पर `android.graphics.Canvas`)। ड्रॉइंग में संख्याएँ और रंग [एनिमेटेड वैल्यू](./nsh.md#animation) हो सकते हैं: जब वे एनिमेट होते हैं, तो प्लेटफ़ॉर्म `draw` को दोबारा चलाए बिना अपने आप फिर से ड्रॉ करता है।

```ts
import { Canvas, CanvasGradient, CanvasRenderingContext2D, Path2D } from "nsh";
```

गाइड के लिए [Canvas](../docs/canvas.md) और इसके प्रॉप्स के लिए [`<Canvas>`](../elements/canvas.md) देखें।

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

2D कॉन्टेक्स्ट से ड्रॉ किया जाने वाला व्यू। यह हर [व्यू प्रॉप](../elements/view.md) (स्टाइल, क्लासेज़, टच हैंडलर, एक्सेसिबिलिटी, `ref`) लेता है, साथ ही:

| प्रॉप | टाइप | विवरण |
|---|---|---|
| `draw` | `(cx, { width, height }) => void` | Canvas को ड्रॉ करता है। साइज़ पता चलते ही एक बार चलता है, जिन सिग्नलों को यह पढ़ता है उनके बदलने पर फिर चलता है, और Canvas का साइज़ बदलने पर भी फिर चलता है। संख्या या रंग के रूप में दिए गए एनिमेटेड वैल्यू इसे चलाए बिना एनिमेट होते हैं। |

Canvas का साइज़ उसकी स्टाइल (`width` / `height`, `flex: 1`, `aspectRatio`, ...) के ज़रिए दें। निर्देशांक पॉइंट्स में होते हैं, और ओरिजिन ऊपर बाएँ कोने पर होता है।

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

## बिना दोबारा ड्रॉ किए एनिमेट करना

`CanvasNumber` टाइप का कोई भी आर्ग्युमेंट और कोई भी पेंट (`fillStyle`, `strokeStyle`) एक `AnimatedNode` स्वीकार करता है। तब Canvas ड्रॉ करते समय उस नोड को पढ़ता है, और अपने एनिमेशन के हर फ़्रेम पर नेटिव रूप से फिर से ड्रॉ करता है:

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

वह कॉन्टेक्स्ट जो `draw` को मिलता है। कॉल केवल ऑपरेशन रिकॉर्ड करते हैं; `draw` के लौटने के बाद प्लेटफ़ॉर्म उन्हें ड्रॉ करता है।

<a id="state-and-transforms"></a>

### स्टेट और ट्रांसफ़ॉर्म

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

| सदस्य | विवरण |
|---|---|
| `canvas` | Canvas का साइज़, पॉइंट्स में। |
| `save()` / `restore()` | ड्रॉइंग स्टेट (ट्रांसफ़ॉर्म, क्लिप, स्टाइल) को पुश / पॉप करता है। |
| `translate(x, y)` | ओरिजिन को खिसकाता है। |
| `scale(x, y)` | अक्षों को स्केल करता है। |
| `rotate(angle)` | अक्षों को घुमाता है; रेडियन में, घड़ी की दिशा में। |
| `transform(a, b, c, d, e, f)` | ट्रांसफ़ॉर्म को मैट्रिक्स `[a c e; b d f]` से गुणा करता है। |
| `setTransform(a, b, c, d, e, f)` | ट्रांसफ़ॉर्म को बदल देता है। |
| `resetTransform()` | आइडेंटिटी पर वापस ले जाता है। |

<a id="properties"></a>

### प्रॉपर्टीज़

| प्रॉपर्टी | टाइप | विवरण |
|---|---|---|
| `fillStyle` | `CanvasPaint` | रंग, ग्रेडिएंट या नेटिव कलर नोड, जिसे `fill`, `fillRect`, `fillText` इस्तेमाल करते हैं। |
| `strokeStyle` | `CanvasPaint` | स्ट्रोक के लिए वही। |
| `lineWidth` | `CanvasNumber` | स्ट्रोक की चौड़ाई, पॉइंट्स में। |
| `lineCap` | `"butt" \| "round" \| "square"` | स्ट्रोक के सिरे कैसे समाप्त होते हैं। |
| `lineJoin` | `"miter" \| "round" \| "bevel"` | स्ट्रोक के सेगमेंट कैसे जुड़ते हैं। |
| `miterLimit` | `number` | इससे लंबे (लाइन की चौड़ाई के अनुपात में) मिटर जॉइन बेवल कर दिए जाते हैं। |
| `lineDashOffset` | `CanvasNumber` | डैश पैटर्न कहाँ से शुरू होता है। |
| `globalAlpha` | `CanvasNumber` | आगे जो ड्रॉ किया जाएगा उसकी अपारदर्शिता, 0..1। |
| `globalCompositeOperation` | `string` | आगे जो ड्रॉ किया जाएगा वह Canvas के साथ कैसे मिलता है (`"source-over"`, `"multiply"`, ...)। |
| `shadowColor` | `string` | शैडो का रंग (transparent: कोई शैडो नहीं)। |
| `shadowBlur` | `number` | शैडो ब्लर, पॉइंट्स में। |
| `shadowOffsetX`, `shadowOffsetY` | `number` | शैडो ऑफ़सेट, पॉइंट्स में। |
| `font` | `string` | CSS `font` शॉर्टहैंड, जैसे `"600 14px Inter"` (साइज़ `px`, `pt` या `rem` में)। |
| `textAlign` | `"start" \| "end" \| "left" \| "right" \| "center"` | टेक्स्ट अपने x के सापेक्ष क्षैतिज रूप से कहाँ रहता है। |
| `textBaseline` | `"alphabetic" \| "top" \| "hanging" \| "middle" \| "ideographic" \| "bottom"` | टेक्स्ट अपने y के सापेक्ष ऊर्ध्वाधर रूप से कहाँ रहता है। |

डैश: `setLineDash(segments: number[])` और `getLineDash(): number[]`।

<a id="paths"></a>

### पाथ

कॉन्टेक्स्ट में एक करंट पाथ होता है, जो [`Path2D`](#path2d) जैसे ही मेथड्स से बनता है:

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

सभी निर्देशांक `CanvasNumber` होते हैं। कोण रेडियन में होते हैं, x अक्ष से घड़ी की दिशा में। `roundRect` का `radii` एक रेडियस होता है, या CSS `border-radius` की तरह 2–4 (पहले ऊपर बायाँ)।

<a id="drawing"></a>

### ड्रॉइंग

```ts
fill(path?: Path2D | "nonzero" | "evenodd", rule?: "nonzero" | "evenodd"): void;
stroke(path?: Path2D): void;
clip(path?: Path2D | "nonzero" | "evenodd", rule?: "nonzero" | "evenodd"): void;
fillRect(x, y, w, h): void;
strokeRect(x, y, w, h): void;
clearRect(x, y, w, h): void;
```

| मेथड | विवरण |
|---|---|
| `fill(path?, rule?)` | करंट पाथ (या `path`) को `fillStyle` से भरता है, nonzero (डिफ़ॉल्ट) या even-odd नियम से। |
| `stroke(path?)` | करंट पाथ (या `path`) को `strokeStyle` से स्ट्रोक करता है। |
| `clip(path?, rule?)` | आगे जो ड्रॉ किया जाएगा उसे पाथ तक सीमित करता है। |
| `fillRect`, `strokeRect` | एक आयत, करंट पाथ को छुए बिना। |
| `clearRect` | किसी आयत को पारदर्शी बनाता है। |

<a id="text"></a>

### टेक्स्ट

```ts
fillText(text: string, x: CanvasNumber, y: CanvasNumber, maxWidth?: number): void;
strokeText(text: string, x: CanvasNumber, y: CanvasNumber, maxWidth?: number): void;
measureText(text: string): TextMetrics; // { width: number }
```

`measureText` सिंक्रोनस है: यह प्लेटफ़ॉर्म के टेक्स्ट इंजन और मौजूदा `font` से माप करता है। केवल `width` रिपोर्ट किया जाता है।

```ts
cx.font = "11px system-ui";
const label = "100";
cx.fillText(label, 40 - cx.measureText(label).width, 20);
```

<a id="gradients"></a>

### ग्रेडिएंट

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

### इमेज

```ts
drawImage(image: string | ImageAsset, ...args: CanvasNumber[]): void;
```

URL या इम्पोर्ट की गई एसेट (`import logo from "./logo.png"`) के रूप में दी गई इमेज को ड्रॉ करता है। इसे नेटिव रूप से लोड किया जाता है; लोड होने के बाद Canvas फिर से ड्रॉ करता है। इम्पोर्ट की गई एसेट वही इम्पोर्ट की गई फ़ाइल ड्रॉ करती है; हर स्क्रीन पर साफ़ ड्रॉ करने के लिए `@3x` फ़ाइल इम्पोर्ट करें। HTML की तरह तीन रूप हैं:

- `drawImage(image, dx, dy)`: उसके प्राकृतिक साइज़ पर।
- `drawImage(image, dx, dy, dw, dh)`: एक आयत में स्केल करके।
- `drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh)`: उसका एक हिस्सा (सोर्स इमेज पिक्सल में)।

## Path2D

```ts
class Path2D {
  constructor(path?: Path2D | string);
  addPath(path: Path2D): void;
  // and every path method: moveTo, lineTo, quadraticCurveTo, bezierCurveTo,
  // arc, arcTo, ellipse, rect, roundRect, closePath
}
```

भरने, स्ट्रोक करने या क्लिप करने के लिए दोबारा इस्तेमाल होने वाला पाथ। कंस्ट्रक्टर किसी दूसरे `Path2D` की कॉपी बनाता है या SVG पाथ डेटा को नेटिव रूप से पार्स करता है:

```ts
const heart = new Path2D("M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9z");
cx.save();
cx.scale(4, 4);
cx.fillStyle = "#ef4444";
cx.fill(heart);
cx.restore();
```

<a id="not-supported"></a>

## समर्थित नहीं

पिक्सल एक्सेस (`getImageData`, `putImageData`), `filter`, `isPointInPath` और SVG इमेज उपलब्ध नहीं हैं। अमान्य रंग या फ़ॉन्ट उस एक ऑपरेशन को छोड़ देता है, जैसा HTML Canvas में होता है।
