---
title: "Canvas"
description: "Canvas, le contexte de dessin 2D, Path2D et les dégradés, avec les parties de HTML Canvas 2D prises en charge par NSH."
order: 2.3
demo: mod-canvas
source_hash: c7a960d552328725
---

# Canvas

`Canvas` dessine avec un contexte de style HTML Canvas 2D. Votre fonction `draw` **enregistre** le dessin ; la plateforme le rejoue nativement (Core Graphics sur iOS, `android.graphics.Canvas` sur Android) à la résolution de l'écran. Les nombres et les couleurs d'un dessin peuvent être des [valeurs animées](./nsh.md#animation) : lorsqu'elles s'animent, la plateforme redessine d'elle-même, sans réexécuter `draw`.

```ts
import { Canvas, CanvasGradient, CanvasRenderingContext2D, Path2D } from "nsh";
```

Voir [Canvas](../docs/canvas.md) pour le guide et [`<Canvas>`](../elements/canvas.md) pour ses props.

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

Une vue dessinée avec un contexte 2D. Elle accepte toutes les [props de vue](../elements/view.md) (style, classes, gestionnaires tactiles, accessibilité, `ref`), ainsi que :

| Prop | Type | Description |
|---|---|---|
| `draw` | `(cx, { width, height }) => void` | Dessine le canvas. S'exécute une fois la taille connue, de nouveau lorsque les signaux qu'il lit changent, et de nouveau lorsque le canvas est redimensionné. Les valeurs animées passées en tant que nombres ou couleurs s'animent sans l'exécuter. |

Donnez une taille au canvas via son style (`width` / `height`, `flex: 1`, `aspectRatio`, ...). Les coordonnées sont en points, avec l'origine en haut à gauche.

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

## Animer sans redessiner

Tout argument typé `CanvasNumber` et tout style de remplissage (`fillStyle`, `strokeStyle`) accepte un `AnimatedNode`. Le canvas lit alors le nœud pendant qu'il dessine, et redessine nativement à chaque image de son animation :

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

Le contexte que reçoit `draw`. Les appels ne font qu'enregistrer des opérations ; la plateforme les dessine après le retour de `draw`.

<a id="state-and-transforms"></a>

### État et transformations

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

| Membre | Description |
|---|---|
| `canvas` | La taille du canvas en points. |
| `save()` / `restore()` | Empile / dépile l'état de dessin (transformation, découpe, styles). |
| `translate(x, y)` | Déplace l'origine. |
| `scale(x, y)` | Met les axes à l'échelle. |
| `rotate(angle)` | Fait pivoter les axes ; en radians, dans le sens horaire. |
| `transform(a, b, c, d, e, f)` | Multiplie la transformation par la matrice `[a c e; b d f]`. |
| `setTransform(a, b, c, d, e, f)` | Remplace la transformation. |
| `resetTransform()` | Retour à l'identité. |

<a id="properties"></a>

### Propriétés

| Propriété | Type | Description |
|---|---|---|
| `fillStyle` | `CanvasPaint` | Couleur, dégradé ou nœud de couleur natif utilisé par `fill`, `fillRect`, `fillText`. |
| `strokeStyle` | `CanvasPaint` | Idem pour les contours. |
| `lineWidth` | `CanvasNumber` | Épaisseur du contour en points. |
| `lineCap` | `"butt" \| "round" \| "square"` | Forme des extrémités des contours. |
| `lineJoin` | `"miter" \| "round" \| "bevel"` | Forme de la jonction des segments d'un contour. |
| `miterLimit` | `number` | Les jonctions en onglet plus longues que cette valeur (en épaisseurs de ligne) sont biseautées. |
| `lineDashOffset` | `CanvasNumber` | Point de départ du motif de tirets. |
| `globalAlpha` | `CanvasNumber` | Opacité de ce qui est dessiné ensuite, de 0 à 1. |
| `globalCompositeOperation` | `string` | Manière dont ce qui est dessiné ensuite se combine avec le canvas (`"source-over"`, `"multiply"`, ...). |
| `shadowColor` | `string` | La couleur des ombres (transparent : aucune). |
| `shadowBlur` | `number` | Flou de l'ombre en points. |
| `shadowOffsetX`, `shadowOffsetY` | `number` | Décalage de l'ombre en points. |
| `font` | `string` | Notation abrégée CSS `font`, par exemple `"600 14px Inter"` (tailles en `px`, `pt` ou `rem`). |
| `textAlign` | `"start" \| "end" \| "left" \| "right" \| "center"` | Position horizontale du texte par rapport à son x. |
| `textBaseline` | `"alphabetic" \| "top" \| "hanging" \| "middle" \| "ideographic" \| "bottom"` | Position verticale du texte par rapport à son y. |

Tirets : `setLineDash(segments: number[])` et `getLineDash(): number[]`.

<a id="paths"></a>

### Chemins

Le contexte possède un chemin courant, construit avec les mêmes méthodes que [`Path2D`](#path2d) :

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

Toutes les coordonnées sont des `CanvasNumber`. Les angles sont en radians, dans le sens horaire à partir de l'axe x. Le `radii` de `roundRect` est un rayon unique ou 2 à 4 rayons, comme pour `border-radius` en CSS (haut gauche en premier).

<a id="drawing"></a>

### Dessin

```ts
fill(path?: Path2D | "nonzero" | "evenodd", rule?: "nonzero" | "evenodd"): void;
stroke(path?: Path2D): void;
clip(path?: Path2D | "nonzero" | "evenodd", rule?: "nonzero" | "evenodd"): void;
fillRect(x, y, w, h): void;
strokeRect(x, y, w, h): void;
clearRect(x, y, w, h): void;
```

| Méthode | Description |
|---|---|
| `fill(path?, rule?)` | Remplit le chemin courant (ou `path`) avec `fillStyle`, selon la règle non nulle (par défaut) ou pair-impair. |
| `stroke(path?)` | Trace le contour du chemin courant (ou `path`) avec `strokeStyle`. |
| `clip(path?, rule?)` | Restreint ce qui est dessiné ensuite au chemin. |
| `fillRect`, `strokeRect` | Un rectangle, sans toucher au chemin courant. |
| `clearRect` | Rend un rectangle transparent. |

<a id="text"></a>

### Texte

```ts
fillText(text: string, x: CanvasNumber, y: CanvasNumber, maxWidth?: number): void;
strokeText(text: string, x: CanvasNumber, y: CanvasNumber, maxWidth?: number): void;
measureText(text: string): TextMetrics; // { width: number }
```

`measureText` est synchrone : il mesure avec le moteur de texte de la plateforme et le `font` courant. Seul `width` est renvoyé.

```ts
cx.font = "11px system-ui";
const label = "100";
cx.fillText(label, 40 - cx.measureText(label).width, 20);
```

<a id="gradients"></a>

### Dégradés

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

### Images

```ts
drawImage(image: string | ImageAsset, ...args: CanvasNumber[]): void;
```

Dessine une image donnée sous forme d'URL ou de ressource importée (`import logo from "./logo.png"`). Elle est chargée nativement ; le canvas se redessine une fois l'image chargée. Une ressource importée dessine le fichier importé tel quel ; importez le fichier `@3x` pour obtenir un rendu net sur tous les écrans. Trois formes, comme en HTML :

- `drawImage(image, dx, dy)` : à sa taille naturelle.
- `drawImage(image, dx, dy, dw, dh)` : mise à l'échelle dans un rectangle.
- `drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh)` : une partie de l'image (source en pixels de l'image).

## Path2D

```ts
class Path2D {
  constructor(path?: Path2D | string);
  addPath(path: Path2D): void;
  // and every path method: moveTo, lineTo, quadraticCurveTo, bezierCurveTo,
  // arc, arcTo, ellipse, rect, roundRect, closePath
}
```

Un chemin réutilisable à remplir, à tracer ou à utiliser pour découper. Le constructeur copie un autre `Path2D` ou analyse nativement des données de chemin SVG :

```ts
const heart = new Path2D("M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9z");
cx.save();
cx.scale(4, 4);
cx.fillStyle = "#ef4444";
cx.fill(heart);
cx.restore();
```

<a id="not-supported"></a>

## Non pris en charge

L'accès aux pixels (`getImageData`, `putImageData`), `filter`, `isPointInPath` et les images SVG ne sont pas disponibles. Une couleur ou une police invalide annule cette seule opération, comme dans HTML Canvas.
