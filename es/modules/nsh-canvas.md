---
title: "Canvas"
description: "Canvas, el contexto de dibujo 2D, Path2D y los degradados, con las partes de HTML Canvas 2D que NSH admite."
order: 2.3
demo: mod-canvas
source_hash: c7a960d552328725
---


# Canvas

`Canvas` dibuja con un contexto al estilo del Canvas 2D de HTML. Tu función `draw` **registra** el dibujo; la plataforma lo reproduce de forma nativa (Core Graphics en iOS, `android.graphics.Canvas` en Android) a la resolución de la pantalla. Los números y colores de un dibujo pueden ser [valores animados](./nsh.md#animation): cuando se animan, la plataforma vuelve a dibujar por sí sola, sin ejecutar `draw` de nuevo.

```ts
import { Canvas, CanvasGradient, CanvasRenderingContext2D, Path2D } from "nsh";
```

Consulta [Canvas](../docs/canvas.md) para la guía y [`<Canvas>`](../elements/canvas.md) para sus props.

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

Una vista dibujada con un contexto 2D. Acepta todas las [props de vista](../elements/view.md) (estilo, clases, manejadores táctiles, accesibilidad, `ref`), además de:

| Prop | Tipo | Descripción |
|---|---|---|
| `draw` | `(cx, { width, height }) => void` | Dibuja el canvas. Se ejecuta cuando se conoce el tamaño, de nuevo cuando cambian las señales que lee y de nuevo cuando el canvas cambia de tamaño. Los valores animados pasados como números o colores se animan sin ejecutarla. |

Define el tamaño del canvas mediante su estilo (`width` / `height`, `flex: 1`, `aspectRatio`, ...). Las coordenadas están en puntos, con el origen en la esquina superior izquierda.

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

## Animar sin volver a dibujar

Cualquier argumento de tipo `CanvasNumber` y cualquier pintura (`fillStyle`, `strokeStyle`) acepta un `AnimatedNode`. El canvas lee entonces el nodo mientras dibuja y vuelve a dibujar de forma nativa en cada fotograma de su animación:

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

El contexto que recibe `draw`. Las llamadas solo registran operaciones; la plataforma las dibuja después de que `draw` retorne.

<a id="state-and-transforms"></a>

### Estado y transformaciones

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

| Miembro | Descripción |
|---|---|
| `canvas` | El tamaño del canvas en puntos. |
| `save()` / `restore()` | Apila / desapila el estado de dibujo (transformación, recorte, estilos). |
| `translate(x, y)` | Desplaza el origen. |
| `scale(x, y)` | Escala los ejes. |
| `rotate(angle)` | Rota los ejes; en radianes, en sentido horario. |
| `transform(a, b, c, d, e, f)` | Multiplica la transformación por la matriz `[a c e; b d f]`. |
| `setTransform(a, b, c, d, e, f)` | Reemplaza la transformación. |
| `resetTransform()` | Vuelve a la identidad. |

<a id="properties"></a>

### Propiedades

| Propiedad | Tipo | Descripción |
|---|---|---|
| `fillStyle` | `CanvasPaint` | Color, degradado o nodo de color nativo usado por `fill`, `fillRect`, `fillText`. |
| `strokeStyle` | `CanvasPaint` | Lo mismo para los trazos. |
| `lineWidth` | `CanvasNumber` | Grosor del trazo en puntos. |
| `lineCap` | `"butt" \| "round" \| "square"` | Cómo terminan los trazos. |
| `lineJoin` | `"miter" \| "round" \| "bevel"` | Cómo se unen los segmentos del trazo. |
| `miterLimit` | `number` | Las uniones de tipo miter más largas que este valor (en anchos de línea) se biselan. |
| `lineDashOffset` | `CanvasNumber` | Dónde empieza el patrón de guiones. |
| `globalAlpha` | `CanvasNumber` | Opacidad de lo que se dibuja a continuación, de 0 a 1. |
| `globalCompositeOperation` | `string` | Cómo se combina lo que se dibuja a continuación con el canvas (`"source-over"`, `"multiply"`, ...). |
| `shadowColor` | `string` | El color de las sombras (transparente: ninguna). |
| `shadowBlur` | `number` | Desenfoque de la sombra en puntos. |
| `shadowOffsetX`, `shadowOffsetY` | `number` | Desplazamiento de la sombra en puntos. |
| `font` | `string` | Forma abreviada `font` de CSS, p. ej. `"600 14px Inter"` (tamaños en `px`, `pt` o `rem`). |
| `textAlign` | `"start" \| "end" \| "left" \| "right" \| "center"` | Dónde se coloca el texto horizontalmente respecto a su x. |
| `textBaseline` | `"alphabetic" \| "top" \| "hanging" \| "middle" \| "ideographic" \| "bottom"` | Dónde se coloca el texto verticalmente respecto a su y. |

Guiones: `setLineDash(segments: number[])` y `getLineDash(): number[]`.

<a id="paths"></a>

### Trazados

El contexto tiene un trazado actual, construido con los mismos métodos que [`Path2D`](#path2d):

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

Todas las coordenadas son `CanvasNumber`. Los ángulos están en radianes, en sentido horario desde el eje x. El `radii` de `roundRect` es un solo radio o de 2 a 4 como en `border-radius` de CSS (empezando por la esquina superior izquierda).

<a id="drawing"></a>

### Dibujo

```ts
fill(path?: Path2D | "nonzero" | "evenodd", rule?: "nonzero" | "evenodd"): void;
stroke(path?: Path2D): void;
clip(path?: Path2D | "nonzero" | "evenodd", rule?: "nonzero" | "evenodd"): void;
fillRect(x, y, w, h): void;
strokeRect(x, y, w, h): void;
clearRect(x, y, w, h): void;
```

| Método | Descripción |
|---|---|
| `fill(path?, rule?)` | Rellena el trazado actual (o `path`) con `fillStyle`, según la regla nonzero (por defecto) o even-odd. |
| `stroke(path?)` | Traza el contorno del trazado actual (o `path`) con `strokeStyle`. |
| `clip(path?, rule?)` | Restringe lo que se dibuja a continuación al trazado. |
| `fillRect`, `strokeRect` | Un rectángulo, sin tocar el trazado actual. |
| `clearRect` | Hace transparente un rectángulo. |

<a id="text"></a>

### Texto

```ts
fillText(text: string, x: CanvasNumber, y: CanvasNumber, maxWidth?: number): void;
strokeText(text: string, x: CanvasNumber, y: CanvasNumber, maxWidth?: number): void;
measureText(text: string): TextMetrics; // { width: number }
```

`measureText` es síncrono: mide con el motor de texto de la plataforma y el `font` actual. Solo se informa de `width`.

```ts
cx.font = "11px system-ui";
const label = "100";
cx.fillText(label, 40 - cx.measureText(label).width, 20);
```

<a id="gradients"></a>

### Degradados

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

### Imágenes

```ts
drawImage(image: string | ImageAsset, ...args: CanvasNumber[]): void;
```

Dibuja una imagen indicada como URL o como recurso importado (`import logo from "./logo.png"`). Se carga de forma nativa; el canvas vuelve a dibujar cuando termina de cargarse. Un recurso importado dibuja el propio archivo importado; importa el archivo `@3x` para dibujar con nitidez en todas las pantallas. Hay tres formas, como en HTML:

- `drawImage(image, dx, dy)`: a su tamaño natural.
- `drawImage(image, dx, dy, dw, dh)`: escalada dentro de un rectángulo.
- `drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh)`: una parte de ella (origen en píxeles de la imagen).

## Path2D

```ts
class Path2D {
  constructor(path?: Path2D | string);
  addPath(path: Path2D): void;
  // and every path method: moveTo, lineTo, quadraticCurveTo, bezierCurveTo,
  // arc, arcTo, ellipse, rect, roundRect, closePath
}
```

Un trazado reutilizable para rellenar, trazar o recortar. El constructor copia otro `Path2D` o interpreta datos de trazado SVG de forma nativa:

```ts
const heart = new Path2D("M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9z");
cx.save();
cx.scale(4, 4);
cx.fillStyle = "#ef4444";
cx.fill(heart);
cx.restore();
```

<a id="not-supported"></a>

## No compatible

El acceso a píxeles (`getImageData`, `putImageData`), `filter`, `isPointInPath` y las imágenes SVG no están disponibles. Un color o una fuente no válidos descartan esa operación concreta, como en HTML Canvas.
