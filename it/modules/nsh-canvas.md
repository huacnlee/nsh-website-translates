---
title: "Canvas"
description: "Canvas, il contesto di disegno 2D, Path2D e i gradienti, con le parti di HTML Canvas 2D supportate da NSH."
order: 2.3
demo: mod-canvas
source_hash: c7a960d552328725
---

# Canvas

`Canvas` disegna con un contesto in stile HTML Canvas 2D. La tua funzione `draw` **registra** il disegno; la piattaforma lo riproduce in modo nativo (Core Graphics su iOS, `android.graphics.Canvas` su Android) alla risoluzione dello schermo. I numeri e i colori di un disegno possono essere [valori animati](./nsh.md#animation): quando si animano, la piattaforma ridisegna da sola, senza eseguire di nuovo `draw`.

```ts
import { Canvas, CanvasGradient, CanvasRenderingContext2D, Path2D } from "nsh";
```

Consulta [Canvas](../docs/canvas.md) per la guida e [`<Canvas>`](../elements/canvas.md) per le sue prop.

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

Una vista disegnata con un contesto 2D. Accetta ogni [prop delle viste](../elements/view.md) (stile, classi, gestori del tocco, accessibilità, `ref`), oltre a:

| Prop | Tipo | Descrizione |
|---|---|---|
| `draw` | `(cx, { width, height }) => void` | Disegna il canvas. Viene eseguita non appena la dimensione è nota, di nuovo quando cambiano i signal che legge e di nuovo quando il canvas viene ridimensionato. I valori animati passati come numeri o colori si animano senza eseguirla. |

Assegna una dimensione al canvas tramite il suo stile (`width` / `height`, `flex: 1`, `aspectRatio`, ...). Le coordinate sono in punti, con l'origine in alto a sinistra.

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

## Animare senza ridisegnare

Qualsiasi argomento di tipo `CanvasNumber` e qualsiasi paint (`fillStyle`, `strokeStyle`) accetta un `AnimatedNode`. Il canvas legge quindi il nodo mentre disegna e ridisegna in modo nativo a ogni frame della sua animazione:

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

Il contesto che riceve `draw`. Le chiamate si limitano a registrare le operazioni; la piattaforma le disegna dopo che `draw` ha restituito il controllo.

<a id="state-and-transforms"></a>

### Stato e trasformazioni

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

| Membro | Descrizione |
|---|---|
| `canvas` | La dimensione del canvas in punti. |
| `save()` / `restore()` | Inserisce / rimuove dallo stack lo stato di disegno (trasformazione, clip, stili). |
| `translate(x, y)` | Sposta l'origine. |
| `scale(x, y)` | Scala gli assi. |
| `rotate(angle)` | Ruota gli assi; in radianti, in senso orario. |
| `transform(a, b, c, d, e, f)` | Moltiplica la trasformazione per la matrice `[a c e; b d f]`. |
| `setTransform(a, b, c, d, e, f)` | Sostituisce la trasformazione. |
| `resetTransform()` | Torna all'identità. |

<a id="properties"></a>

### Proprietà

| Proprietà | Tipo | Descrizione |
|---|---|---|
| `fillStyle` | `CanvasPaint` | Colore, gradiente o nodo colore nativo usato da `fill`, `fillRect`, `fillText`. |
| `strokeStyle` | `CanvasPaint` | Lo stesso per i contorni. |
| `lineWidth` | `CanvasNumber` | Spessore del contorno in punti. |
| `lineCap` | `"butt" \| "round" \| "square"` | Come terminano i contorni. |
| `lineJoin` | `"miter" \| "round" \| "bevel"` | Come si uniscono i segmenti del contorno. |
| `miterLimit` | `number` | Le giunzioni miter più lunghe di questo valore (in spessori di linea) vengono smussate. |
| `lineDashOffset` | `CanvasNumber` | Il punto in cui inizia il motivo del tratteggio. |
| `globalAlpha` | `CanvasNumber` | Opacità di ciò che viene disegnato dopo, da 0 a 1. |
| `globalCompositeOperation` | `string` | Come ciò che viene disegnato dopo si combina con il canvas (`"source-over"`, `"multiply"`, ...). |
| `shadowColor` | `string` | Il colore delle ombre (transparent: nessuna). |
| `shadowBlur` | `number` | Sfocatura dell'ombra in punti. |
| `shadowOffsetX`, `shadowOffsetY` | `number` | Offset dell'ombra in punti. |
| `font` | `string` | Notazione abbreviata CSS `font`, ad es. `"600 14px Inter"` (dimensioni in `px`, `pt` o `rem`). |
| `textAlign` | `"start" \| "end" \| "left" \| "right" \| "center"` | Dove si colloca il testo orizzontalmente rispetto alla sua x. |
| `textBaseline` | `"alphabetic" \| "top" \| "hanging" \| "middle" \| "ideographic" \| "bottom"` | Dove si colloca il testo verticalmente rispetto alla sua y. |

Tratteggi: `setLineDash(segments: number[])` e `getLineDash(): number[]`.

<a id="paths"></a>

### Percorsi

Il contesto ha un percorso corrente, costruito con gli stessi metodi di [`Path2D`](#path2d):

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

Tutte le coordinate sono `CanvasNumber`. Gli angoli sono in radianti, in senso orario a partire dall'asse x. Il `radii` di `roundRect` è un singolo raggio oppure da 2 a 4 valori come in CSS `border-radius` (prima l'angolo in alto a sinistra).

<a id="drawing"></a>

### Disegno

```ts
fill(path?: Path2D | "nonzero" | "evenodd", rule?: "nonzero" | "evenodd"): void;
stroke(path?: Path2D): void;
clip(path?: Path2D | "nonzero" | "evenodd", rule?: "nonzero" | "evenodd"): void;
fillRect(x, y, w, h): void;
strokeRect(x, y, w, h): void;
clearRect(x, y, w, h): void;
```

| Metodo | Descrizione |
|---|---|
| `fill(path?, rule?)` | Riempie il percorso corrente (o `path`) con `fillStyle`, secondo la regola nonzero (predefinita) o even-odd. |
| `stroke(path?)` | Traccia il contorno del percorso corrente (o `path`) con `strokeStyle`. |
| `clip(path?, rule?)` | Limita ciò che viene disegnato dopo al percorso. |
| `fillRect`, `strokeRect` | Un rettangolo, senza toccare il percorso corrente. |
| `clearRect` | Rende trasparente un rettangolo. |

<a id="text"></a>

### Testo

```ts
fillText(text: string, x: CanvasNumber, y: CanvasNumber, maxWidth?: number): void;
strokeText(text: string, x: CanvasNumber, y: CanvasNumber, maxWidth?: number): void;
measureText(text: string): TextMetrics; // { width: number }
```

`measureText` è sincrono: misura con il motore di testo della piattaforma e il `font` corrente. Viene riportato solo `width`.

```ts
cx.font = "11px system-ui";
const label = "100";
cx.fillText(label, 40 - cx.measureText(label).width, 20);
```

<a id="gradients"></a>

### Gradienti

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

### Immagini

```ts
drawImage(image: string | ImageAsset, ...args: CanvasNumber[]): void;
```

Disegna un'immagine indicata come URL o come asset importato (`import logo from "./logo.png"`). Viene caricata in modo nativo; il canvas ridisegna una volta completato il caricamento. Un asset importato disegna il file importato così com'è; importa il file `@3x` per ottenere un disegno nitido su ogni schermo. Tre forme, come in HTML:

- `drawImage(image, dx, dy)`: alla sua dimensione naturale.
- `drawImage(image, dx, dy, dw, dh)`: scalata all'interno di un rettangolo.
- `drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh)`: una sua parte (sorgente in pixel dell'immagine).

## Path2D

```ts
class Path2D {
  constructor(path?: Path2D | string);
  addPath(path: Path2D): void;
  // and every path method: moveTo, lineTo, quadraticCurveTo, bezierCurveTo,
  // arc, arcTo, ellipse, rect, roundRect, closePath
}
```

Un percorso riutilizzabile da riempire, tracciare o usare come clip. Il costruttore copia un altro `Path2D` oppure interpreta in modo nativo i dati di percorso SVG:

```ts
const heart = new Path2D("M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9z");
cx.save();
cx.scale(4, 4);
cx.fillStyle = "#ef4444";
cx.fill(heart);
cx.restore();
```

<a id="not-supported"></a>

## Non supportato

L'accesso ai pixel (`getImageData`, `putImageData`), `filter`, `isPointInPath` e le immagini SVG non sono disponibili. Un colore o un font non validi annullano quella singola operazione, come in HTML Canvas.
