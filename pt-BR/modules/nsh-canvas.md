---
title: "Canvas"
description: "Canvas, o contexto de desenho 2D, Path2D e gradientes, com as partes do HTML Canvas 2D que o NSH suporta."
order: 2.3
demo: mod-canvas
source_hash: c7a960d552328725
---


# Canvas

`Canvas` desenha com um contexto no estilo do HTML Canvas 2D. Sua função `draw` **grava** o desenho; a plataforma o reproduz nativamente (Core Graphics no iOS, `android.graphics.Canvas` no Android) na resolução da tela. Números e cores em um desenho podem ser [valores animados](./nsh.md#animation): quando animam, a plataforma redesenha por conta própria, sem executar `draw` novamente.

```ts
import { Canvas, CanvasGradient, CanvasRenderingContext2D, Path2D } from "nsh";
```

Veja [Canvas](../docs/canvas.md) para o guia e [`<Canvas>`](../elements/canvas.md) para suas props.

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

Uma view desenhada com um contexto 2D. Ela aceita todas as [props de view](../elements/view.md) (style, classes, handlers de toque, acessibilidade, `ref`), além de:

| Prop | Tipo | Descrição |
|---|---|---|
| `draw` | `(cx, { width, height }) => void` | Desenha o canvas. Executa assim que o tamanho é conhecido, novamente quando os signals que ela lê mudam e novamente quando o canvas é redimensionado. Valores animados passados como números ou cores animam sem executá-la. |

Defina o tamanho do canvas por meio do style (`width` / `height`, `flex: 1`, `aspectRatio`, ...). As coordenadas são em pontos, com a origem no canto superior esquerdo.

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

## Animando sem redesenhar

Qualquer argumento do tipo `CanvasNumber` e qualquer paint (`fillStyle`, `strokeStyle`) aceita um `AnimatedNode`. O canvas então lê o nó enquanto desenha e redesenha nativamente a cada frame da animação:

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

O contexto que `draw` recebe. As chamadas apenas gravam operações; a plataforma as desenha depois que `draw` retorna.

<a id="state-and-transforms"></a>

### Estado e transformações

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

| Membro | Descrição |
|---|---|
| `canvas` | O tamanho do canvas em pontos. |
| `save()` / `restore()` | Empilha / desempilha o estado de desenho (transformação, clip, estilos). |
| `translate(x, y)` | Move a origem. |
| `scale(x, y)` | Escala os eixos. |
| `rotate(angle)` | Rotaciona os eixos; em radianos, sentido horário. |
| `transform(a, b, c, d, e, f)` | Multiplica a transformação pela matriz `[a c e; b d f]`. |
| `setTransform(a, b, c, d, e, f)` | Substitui a transformação. |
| `resetTransform()` | Volta à identidade. |

<a id="properties"></a>

### Propriedades

| Propriedade | Tipo | Descrição |
|---|---|---|
| `fillStyle` | `CanvasPaint` | Cor, gradiente ou nó de cor nativo usado por `fill`, `fillRect`, `fillText`. |
| `strokeStyle` | `CanvasPaint` | O mesmo para os traços. |
| `lineWidth` | `CanvasNumber` | Largura do traço em pontos. |
| `lineCap` | `"butt" \| "round" \| "square"` | Como os traços terminam. |
| `lineJoin` | `"miter" \| "round" \| "bevel"` | Como os segmentos do traço se unem. |
| `miterLimit` | `number` | Junções miter mais longas que isso (em larguras de linha) são chanfradas. |
| `lineDashOffset` | `CanvasNumber` | Onde o padrão de tracejado começa. |
| `globalAlpha` | `CanvasNumber` | Opacidade do que for desenhado a seguir, de 0 a 1. |
| `globalCompositeOperation` | `string` | Como o que for desenhado a seguir se combina com o canvas (`"source-over"`, `"multiply"`, ...). |
| `shadowColor` | `string` | A cor das sombras (transparent: nenhuma). |
| `shadowBlur` | `number` | Desfoque da sombra em pontos. |
| `shadowOffsetX`, `shadowOffsetY` | `number` | Deslocamento da sombra em pontos. |
| `font` | `string` | Forma abreviada `font` do CSS, por exemplo `"600 14px Inter"` (tamanhos em `px`, `pt` ou `rem`). |
| `textAlign` | `"start" \| "end" \| "left" \| "right" \| "center"` | Onde o texto fica horizontalmente em relação ao seu x. |
| `textBaseline` | `"alphabetic" \| "top" \| "hanging" \| "middle" \| "ideographic" \| "bottom"` | Onde o texto fica verticalmente em relação ao seu y. |

Tracejados: `setLineDash(segments: number[])` e `getLineDash(): number[]`.

<a id="paths"></a>

### Caminhos

O contexto tem um caminho atual, construído com os mesmos métodos de [`Path2D`](#path2d):

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

Todas as coordenadas são do tipo `CanvasNumber`. Os ângulos são em radianos, no sentido horário a partir do eixo x. O `radii` de `roundRect` é um único raio ou 2 a 4 raios, como no `border-radius` do CSS (canto superior esquerdo primeiro).

<a id="drawing"></a>

### Desenho

```ts
fill(path?: Path2D | "nonzero" | "evenodd", rule?: "nonzero" | "evenodd"): void;
stroke(path?: Path2D): void;
clip(path?: Path2D | "nonzero" | "evenodd", rule?: "nonzero" | "evenodd"): void;
fillRect(x, y, w, h): void;
strokeRect(x, y, w, h): void;
clearRect(x, y, w, h): void;
```

| Método | Descrição |
|---|---|
| `fill(path?, rule?)` | Preenche o caminho atual (ou `path`) com `fillStyle`, pela regra nonzero (padrão) ou even-odd. |
| `stroke(path?)` | Traça o caminho atual (ou `path`) com `strokeStyle`. |
| `clip(path?, rule?)` | Restringe o que for desenhado a seguir ao caminho. |
| `fillRect`, `strokeRect` | Um retângulo, sem alterar o caminho atual. |
| `clearRect` | Torna um retângulo transparente. |

<a id="text"></a>

### Texto

```ts
fillText(text: string, x: CanvasNumber, y: CanvasNumber, maxWidth?: number): void;
strokeText(text: string, x: CanvasNumber, y: CanvasNumber, maxWidth?: number): void;
measureText(text: string): TextMetrics; // { width: number }
```

`measureText` é síncrono: ele mede com o mecanismo de texto da plataforma e o `font` atual. Apenas `width` é informado.

```ts
cx.font = "11px system-ui";
const label = "100";
cx.fillText(label, 40 - cx.measureText(label).width, 20);
```

<a id="gradients"></a>

### Gradientes

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

### Imagens

```ts
drawImage(image: string | ImageAsset, ...args: CanvasNumber[]): void;
```

Desenha uma imagem informada como URL ou como asset importado (`import logo from "./logo.png"`). Ela é carregada nativamente; o canvas desenha novamente assim que ela for carregada. Um asset importado desenha o próprio arquivo importado; importe o arquivo `@3x` para desenhar com nitidez em todas as telas. Três formas, como no HTML:

- `drawImage(image, dx, dy)`: no tamanho natural.
- `drawImage(image, dx, dy, dw, dh)`: redimensionada para caber em um retângulo.
- `drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh)`: uma parte dela (origem em pixels da imagem).

## Path2D

```ts
class Path2D {
  constructor(path?: Path2D | string);
  addPath(path: Path2D): void;
  // and every path method: moveTo, lineTo, quadraticCurveTo, bezierCurveTo,
  // arc, arcTo, ellipse, rect, roundRect, closePath
}
```

Um caminho reutilizável para preencher, traçar ou recortar. O construtor copia outro `Path2D` ou interpreta dados de caminho SVG nativamente:

```ts
const heart = new Path2D("M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9z");
cx.save();
cx.scale(4, 4);
cx.fillStyle = "#ef4444";
cx.fill(heart);
cx.restore();
```

<a id="not-supported"></a>

## Não suportado

Acesso a pixels (`getImageData`, `putImageData`), `filter`, `isPointInPath` e imagens SVG não estão disponíveis. Uma cor ou fonte inválida descarta apenas aquela operação, como no HTML Canvas.
