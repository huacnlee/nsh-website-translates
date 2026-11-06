---
title: "Canvas"
description: "Canvas, 2D-контекст рисования, Path2D и градиенты, а также поддерживаемые в NSH части HTML Canvas 2D."
order: 2.3
demo: mod-canvas
source_hash: c7a960d552328725
---

# Canvas

`Canvas` рисует с помощью контекста в стиле HTML Canvas 2D. Ваша функция `draw` **записывает** рисунок, а платформа воспроизводит его нативно (Core Graphics на iOS, `android.graphics.Canvas` на Android) в разрешении экрана. Числа и цвета в рисунке могут быть [анимируемыми значениями](./nsh.md#animation): когда они анимируются, платформа перерисовывает сама, не запуская `draw` повторно.

```ts
import { Canvas, CanvasGradient, CanvasRenderingContext2D, Path2D } from "nsh";
```

Руководство см. в разделе [Canvas](../docs/canvas.md), а свойства компонента описаны в [`<Canvas>`](../elements/canvas.md).

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

Представление, которое рисуется с помощью 2D-контекста. Принимает все [свойства представлений](../elements/view.md) (стиль, классы, обработчики касаний, доступность, `ref`), а также:

| Свойство | Тип | Описание |
|---|---|---|
| `draw` | `(cx, { width, height }) => void` | Рисует canvas. Запускается, когда становится известен размер, снова при изменении сигналов, которые она читает, и снова при изменении размера canvas. Анимируемые значения, переданные как числа или цвета, анимируются без её запуска. |

Задайте размер canvas через стиль (`width` / `height`, `flex: 1`, `aspectRatio`, ...). Координаты задаются в пунктах, начало координат находится в левом верхнем углу.

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

## Анимация без перерисовки

Любой аргумент типа `CanvasNumber` и любая заливка (`fillStyle`, `strokeStyle`) принимает `AnimatedNode`. Тогда canvas читает узел во время рисования и перерисовывается нативно на каждом кадре его анимации:

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

Контекст, который получает `draw`. Вызовы только записывают операции; платформа рисует их после возврата из `draw`.

<a id="state-and-transforms"></a>

### Состояние и трансформации

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

| Член | Описание |
|---|---|
| `canvas` | Размер canvas в пунктах. |
| `save()` / `restore()` | Помещает в стек / извлекает из стека состояние рисования (трансформацию, обрезку, стили). |
| `translate(x, y)` | Сдвигает начало координат. |
| `scale(x, y)` | Масштабирует оси. |
| `rotate(angle)` | Поворачивает оси; в радианах, по часовой стрелке. |
| `transform(a, b, c, d, e, f)` | Умножает трансформацию на матрицу `[a c e; b d f]`. |
| `setTransform(a, b, c, d, e, f)` | Заменяет трансформацию. |
| `resetTransform()` | Возвращает единичную трансформацию. |

<a id="properties"></a>

### Свойства

| Свойство | Тип | Описание |
|---|---|---|
| `fillStyle` | `CanvasPaint` | Цвет, градиент или нативный узел цвета, используемый в `fill`, `fillRect`, `fillText`. |
| `strokeStyle` | `CanvasPaint` | То же для обводки. |
| `lineWidth` | `CanvasNumber` | Толщина обводки в пунктах. |
| `lineCap` | `"butt" \| "round" \| "square"` | Как заканчиваются линии обводки. |
| `lineJoin` | `"miter" \| "round" \| "bevel"` | Как соединяются сегменты обводки. |
| `miterLimit` | `number` | Острые соединения длиннее этого значения (в толщинах линии) срезаются. |
| `lineDashOffset` | `CanvasNumber` | Откуда начинается штриховой узор. |
| `globalAlpha` | `CanvasNumber` | Непрозрачность того, что рисуется далее, от 0 до 1. |
| `globalCompositeOperation` | `string` | Как то, что рисуется далее, сочетается с содержимым canvas (`"source-over"`, `"multiply"`, ...). |
| `shadowColor` | `string` | Цвет теней (transparent: без тени). |
| `shadowBlur` | `number` | Размытие тени в пунктах. |
| `shadowOffsetX`, `shadowOffsetY` | `number` | Смещение тени в пунктах. |
| `font` | `string` | Краткая запись CSS `font`, например `"600 14px Inter"` (размеры в `px`, `pt` или `rem`). |
| `textAlign` | `"start" \| "end" \| "left" \| "right" \| "center"` | Положение текста по горизонтали относительно его x. |
| `textBaseline` | `"alphabetic" \| "top" \| "hanging" \| "middle" \| "ideographic" \| "bottom"` | Положение текста по вертикали относительно его y. |

Штрихи: `setLineDash(segments: number[])` и `getLineDash(): number[]`.

<a id="paths"></a>

### Контуры

У контекста есть текущий контур, который строится теми же методами, что и у [`Path2D`](#path2d):

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

Все координаты — числа (`CanvasNumber`). Углы задаются в радианах, по часовой стрелке от оси x. Параметр `radii` у `roundRect` — это один радиус или от 2 до 4 радиусов, как в CSS `border-radius` (сначала левый верхний).

<a id="drawing"></a>

### Рисование

```ts
fill(path?: Path2D | "nonzero" | "evenodd", rule?: "nonzero" | "evenodd"): void;
stroke(path?: Path2D): void;
clip(path?: Path2D | "nonzero" | "evenodd", rule?: "nonzero" | "evenodd"): void;
fillRect(x, y, w, h): void;
strokeRect(x, y, w, h): void;
clearRect(x, y, w, h): void;
```

| Метод | Описание |
|---|---|
| `fill(path?, rule?)` | Заливает текущий контур (или `path`) с помощью `fillStyle` по правилу nonzero (по умолчанию) или even-odd. |
| `stroke(path?)` | Обводит текущий контур (или `path`) с помощью `strokeStyle`. |
| `clip(path?, rule?)` | Ограничивает область, в которой рисуется следующее, этим контуром. |
| `fillRect`, `strokeRect` | Прямоугольник, не затрагивающий текущий контур. |
| `clearRect` | Делает прямоугольную область прозрачной. |

<a id="text"></a>

### Текст

```ts
fillText(text: string, x: CanvasNumber, y: CanvasNumber, maxWidth?: number): void;
strokeText(text: string, x: CanvasNumber, y: CanvasNumber, maxWidth?: number): void;
measureText(text: string): TextMetrics; // { width: number }
```

`measureText` работает синхронно: она измеряет текст с помощью текстового движка платформы и текущего `font`. Возвращается только `width`.

```ts
cx.font = "11px system-ui";
const label = "100";
cx.fillText(label, 40 - cx.measureText(label).width, 20);
```

<a id="gradients"></a>

### Градиенты

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

### Изображения

```ts
drawImage(image: string | ImageAsset, ...args: CanvasNumber[]): void;
```

Рисует изображение, заданное как URL или импортированный ресурс (`import logo from "./logo.png"`). Оно загружается нативно; canvas перерисовывается после завершения загрузки. Импортированный ресурс рисуется как сам импортированный файл; чтобы изображение было чётким на любом экране, импортируйте файл `@3x`. Три формы, как в HTML:

- `drawImage(image, dx, dy)`: в натуральном размере.
- `drawImage(image, dx, dy, dw, dh)`: с масштабированием в прямоугольник.
- `drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh)`: часть изображения (источник задаётся в пикселях изображения).

## Path2D

```ts
class Path2D {
  constructor(path?: Path2D | string);
  addPath(path: Path2D): void;
  // and every path method: moveTo, lineTo, quadraticCurveTo, bezierCurveTo,
  // arc, arcTo, ellipse, rect, roundRect, closePath
}
```

Переиспользуемый контур для заливки, обводки или обрезки. Конструктор копирует другой `Path2D` или нативно разбирает данные SVG-контура:

```ts
const heart = new Path2D("M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9z");
cx.save();
cx.scale(4, 4);
cx.fillStyle = "#ef4444";
cx.fill(heart);
cx.restore();
```

<a id="not-supported"></a>

## Не поддерживается

Доступ к пикселям (`getImageData`, `putImageData`), `filter`, `isPointInPath` и SVG-изображения недоступны. Недопустимый цвет или шрифт отбрасывает только эту операцию, как в HTML Canvas.
