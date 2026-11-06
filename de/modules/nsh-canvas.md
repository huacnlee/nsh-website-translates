---
title: "Canvas"
description: "Canvas, der 2D-Zeichenkontext, Path2D und Verläufe, mit den Teilen von HTML Canvas 2D, die NSH unterstützt."
order: 2.3
demo: mod-canvas
source_hash: c7a960d552328725
---


# Canvas

`Canvas` zeichnet mit einem Kontext im Stil von HTML Canvas 2D. Deine `draw`-Funktion **zeichnet** die Zeichenbefehle **auf**; die Plattform gibt sie anschließend nativ in der Auflösung des Bildschirms wieder (Core Graphics unter iOS, `android.graphics.Canvas` unter Android). Zahlen und Farben in einer Zeichnung können [animierte Werte](./nsh.md#animation) sein: Wenn sie sich animieren, zeichnet die Plattform selbstständig neu, ohne `draw` erneut auszuführen.

```ts
import { Canvas, CanvasGradient, CanvasRenderingContext2D, Path2D } from "nsh";
```

Siehe [Canvas](../docs/canvas.md) für die Anleitung und [`<Canvas>`](../elements/canvas.md) für die zugehörigen Props.

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

Eine View, die mit einem 2D-Kontext gezeichnet wird. Sie akzeptiert alle [View-Props](../elements/view.md) (Style, Klassen, Touch-Handler, Accessibility, `ref`) sowie:

| Prop | Typ | Beschreibung |
|---|---|---|
| `draw` | `(cx, { width, height }) => void` | Zeichnet den Canvas. Wird ausgeführt, sobald die Größe bekannt ist, erneut, wenn sich die gelesenen Signals ändern, und noch einmal, wenn sich die Größe des Canvas ändert. Animierte Werte, die als Zahlen oder Farben übergeben werden, animieren, ohne dass die Funktion erneut ausgeführt wird. |

Gib dem Canvas über seinen Style eine Größe (`width` / `height`, `flex: 1`, `aspectRatio`, ...). Koordinaten sind in Punkten angegeben, der Ursprung liegt oben links.

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

## Animieren ohne Neuzeichnen

Jedes Argument vom Typ `CanvasNumber` und jede Füllung bzw. Linienfarbe (`fillStyle`, `strokeStyle`) akzeptiert einen `AnimatedNode`. Der Canvas liest den Node dann beim Zeichnen und zeichnet bei jedem Frame der Animation nativ neu:

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

Der Kontext, den `draw` erhält. Aufrufe zeichnen nur Operationen auf; die Plattform zeichnet sie, nachdem `draw` zurückgekehrt ist.

<a id="state-and-transforms"></a>

### Zustand und Transformationen

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

| Member | Beschreibung |
|---|---|
| `canvas` | Die Größe des Canvas in Punkten. |
| `save()` / `restore()` | Legt den Zeichenzustand (Transformation, Clip, Styles) auf den Stack / holt ihn wieder davon. |
| `translate(x, y)` | Verschiebt den Ursprung. |
| `scale(x, y)` | Skaliert die Achsen. |
| `rotate(angle)` | Rotiert die Achsen; Bogenmaß, im Uhrzeigersinn. |
| `transform(a, b, c, d, e, f)` | Multipliziert die Transformation mit der Matrix `[a c e; b d f]`. |
| `setTransform(a, b, c, d, e, f)` | Ersetzt die Transformation. |
| `resetTransform()` | Zurück zur Identität. |

<a id="properties"></a>

### Eigenschaften

| Eigenschaft | Typ | Beschreibung |
|---|---|---|
| `fillStyle` | `CanvasPaint` | Farbe, Verlauf oder nativer Farb-Node, verwendet von `fill`, `fillRect`, `fillText`. |
| `strokeStyle` | `CanvasPaint` | Dasselbe für Linien. |
| `lineWidth` | `CanvasNumber` | Linienbreite in Punkten. |
| `lineCap` | `"butt" \| "round" \| "square"` | Wie Linien enden. |
| `lineJoin` | `"miter" \| "round" \| "bevel"` | Wie Liniensegmente verbunden werden. |
| `miterLimit` | `number` | Miter-Verbindungen, die länger als dieser Wert (in Linienbreiten) sind, werden abgeschrägt. |
| `lineDashOffset` | `CanvasNumber` | Wo das Strichmuster beginnt. |
| `globalAlpha` | `CanvasNumber` | Deckkraft dessen, was als Nächstes gezeichnet wird, 0..1. |
| `globalCompositeOperation` | `string` | Wie sich das, was als Nächstes gezeichnet wird, mit dem Canvas verbindet (`"source-over"`, `"multiply"`, ...). |
| `shadowColor` | `string` | Die Farbe von Schatten (transparent: kein Schatten). |
| `shadowBlur` | `number` | Schattenunschärfe in Punkten. |
| `shadowOffsetX`, `shadowOffsetY` | `number` | Schattenversatz in Punkten. |
| `font` | `string` | CSS-Kurzschreibweise für `font`, z. B. `"600 14px Inter"` (Größen in `px`, `pt` oder `rem`). |
| `textAlign` | `"start" \| "end" \| "left" \| "right" \| "center"` | Wo der Text horizontal relativ zu seinem x liegt. |
| `textBaseline` | `"alphabetic" \| "top" \| "hanging" \| "middle" \| "ideographic" \| "bottom"` | Wo der Text vertikal relativ zu seinem y liegt. |

Strichmuster: `setLineDash(segments: number[])` und `getLineDash(): number[]`.

<a id="paths"></a>

### Pfade

Der Kontext hat einen aktuellen Pfad, der mit denselben Methoden aufgebaut wird wie [`Path2D`](#path2d):

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

Alle Koordinaten sind `CanvasNumber`s. Winkel sind im Bogenmaß angegeben, im Uhrzeigersinn ab der x-Achse. Der Parameter `radii` von `roundRect` ist ein einzelner Radius oder 2 bis 4 Werte wie bei CSS `border-radius` (zuerst oben links).

<a id="drawing"></a>

### Zeichnen

```ts
fill(path?: Path2D | "nonzero" | "evenodd", rule?: "nonzero" | "evenodd"): void;
stroke(path?: Path2D): void;
clip(path?: Path2D | "nonzero" | "evenodd", rule?: "nonzero" | "evenodd"): void;
fillRect(x, y, w, h): void;
strokeRect(x, y, w, h): void;
clearRect(x, y, w, h): void;
```

| Methode | Beschreibung |
|---|---|
| `fill(path?, rule?)` | Füllt den aktuellen Pfad (oder `path`) mit `fillStyle`, nach der Nonzero-Regel (Standard) oder der Even-Odd-Regel. |
| `stroke(path?)` | Zeichnet die Kontur des aktuellen Pfads (oder `path`) mit `strokeStyle`. |
| `clip(path?, rule?)` | Beschränkt das, was als Nächstes gezeichnet wird, auf den Pfad. |
| `fillRect`, `strokeRect` | Ein Rechteck, ohne den aktuellen Pfad zu verändern. |
| `clearRect` | Macht ein Rechteck transparent. |

### Text

```ts
fillText(text: string, x: CanvasNumber, y: CanvasNumber, maxWidth?: number): void;
strokeText(text: string, x: CanvasNumber, y: CanvasNumber, maxWidth?: number): void;
measureText(text: string): TextMetrics; // { width: number }
```

`measureText` arbeitet synchron: Es misst mit der Text-Engine der Plattform und dem aktuellen `font`. Es wird nur `width` zurückgegeben.

```ts
cx.font = "11px system-ui";
const label = "100";
cx.fillText(label, 40 - cx.measureText(label).width, 20);
```

<a id="gradients"></a>

### Verläufe

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

### Bilder

```ts
drawImage(image: string | ImageAsset, ...args: CanvasNumber[]): void;
```

Zeichnet ein Bild, das als URL oder als importiertes Asset (`import logo from "./logo.png"`) angegeben wird. Es wird nativ geladen; der Canvas zeichnet erneut, sobald es geladen ist. Ein importiertes Asset zeichnet die importierte Datei selbst; importiere die Datei `@3x`, um auf jedem Bildschirm scharf zu zeichnen. Drei Formen, wie in HTML:

- `drawImage(image, dx, dy)`: in seiner natürlichen Größe.
- `drawImage(image, dx, dy, dw, dh)`: in ein Rechteck skaliert.
- `drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh)`: ein Ausschnitt davon (Quelle in Bildpixeln).

## Path2D

```ts
class Path2D {
  constructor(path?: Path2D | string);
  addPath(path: Path2D): void;
  // and every path method: moveTo, lineTo, quadraticCurveTo, bezierCurveTo,
  // arc, arcTo, ellipse, rect, roundRect, closePath
}
```

Ein wiederverwendbarer Pfad zum Füllen, Konturieren oder Clippen. Der Konstruktor kopiert einen anderen `Path2D` oder parst SVG-Pfaddaten nativ:

```ts
const heart = new Path2D("M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9z");
cx.save();
cx.scale(4, 4);
cx.fillStyle = "#ef4444";
cx.fill(heart);
cx.restore();
```

<a id="not-supported"></a>

## Nicht unterstützt

Pixelzugriff (`getImageData`, `putImageData`), `filter`, `isPointInPath` und SVG-Bilder sind nicht verfügbar. Eine ungültige Farbe oder Schrift lässt genau diese eine Operation entfallen, wie bei HTML Canvas.
