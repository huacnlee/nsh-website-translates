---
title: "Image"
description: "Image: das Bildelement sowie Image.getSize und Image.prefetch für Bildinformationen und Vorabladen."
order: 2.2
source_hash: 028257cecdec706c
---


# Image

`nsh` exportiert `Image`, das [`<Image>`](../elements/image.md)-Element, das Bilder anzeigt. Dasselbe `Image` fragt außerdem den nativen Image Loader nach Bildern, ohne sie anzuzeigen: nach ihrer Größe und danach, sie zu laden, bevor sie angezeigt werden.

```ts
import { Image, type PixelSize } from "nsh";
```

`Image` ist eine Komponente mit zwei Funktionen: `<Image src=…>` rendert die native Bildansicht (der Compiler erzeugt sie direkt an Ort und Stelle, wie er es auch bei `<View>` tut), und `Image.getSize` / `Image.prefetch` werden direkt darauf aufgerufen.

```ts
const Image: ((props: ImageProps) => JSX.Element) & {
  getSize(src: string | ImageAsset): Promise<PixelSize>;
  prefetch(src: string | ImageAsset): Promise<void>;
};
```

Den Leitfaden finden Sie unter [Bilder und Assets](../docs/images-and-assets.md).

## Image.getSize

```ts
getSize(src: string | ImageAsset): Promise<PixelSize>;

interface PixelSize {
  width: number;   // pixels (an SVG's: points)
  height: number;
}
```

Lädt das Bild und liefert dessen Größe in Pixeln (des Quellbilds, nicht einer herunterskalierten Kopie; bei einer SVG die intrinsische Größe in Punkten, [im Web so, wie der Browser sie misst](../docs/images-and-assets.md#svg-images)). Ein importiertes Bild mit [Pixeldichte-Varianten](../docs/images-and-assets.md#pixel-densities) lädt die Variante, die die Views auf diesem Bildschirm laden, und liefert die Größe der importierten Datei, unabhängig davon, welche Variante geladen wurde (ein `<Image>`, das es anzeigt, meldet die Pixel der geladenen Variante in `onLoad`). Die geladenen Bytes bleiben im Speicher, sodass das `<Image>`, das es als Nächstes anzeigt, es nicht erneut herunterlädt. Das Promise wird abgelehnt, wenn das Bild nicht geladen werden kann.

```tsx
import { Image, signal } from "nsh";

const url = "https://picsum.photos/seed/nsh/1200/800";
const ratio = signal(1);

Image.getSize(url).then(({ width, height }) => ratio.set(width / height));

<Image src={url} style={{ width: "100%", aspectRatio: ratio() }} />;
```

## Image.prefetch

```ts
prefetch(src: string | ImageAsset): Promise<void>;
```

Lädt ein Bild, bevor es angezeigt wird. Das Promise wird aufgelöst, sobald die Bytes im Speicher liegen, und mit dem Fehler abgelehnt, wenn das Bild nicht geladen werden kann. Bei einem importierten Bild mit Pixeldichte-Varianten wird die Variante geladen, die die Views auf diesem Bildschirm laden. Verwenden Sie es für die nächste Seite einer Galerie oder das Bild hinter einem Tap.

```ts
const next = photos.slice(index + 1, index + 4);
next.forEach((p) => Image.prefetch(p.url).catch(() => {})); // the <Image> reports its own error later
```

<a id="related"></a>

## Siehe auch

- [`<Image>`](../elements/image.md): `src`, `placeholder`, der Style `objectFit`, `onLoad`, `onProgress`, `onError` und die übrigen Props.
- Das Importieren einer Bilddatei (`import logo from "./logo.png"`) liefert ein `ImageAsset` (`{ url, size, scales? }`, in Punkten dimensioniert), das `<Image src>` und Canvas-`drawImage` akzeptieren.

> [!NOTE]
> Wenn Ihre App `capabilities` in `nsh.json` deklariert, müssen `getSize` und `prefetch` von Remote-URLs unter `network` erlaubt sein, wie `fetch`. Eine URL außerhalb davon wird nie angefragt: Das Promise wird mit einem `Error` abgelehnt, dessen `code` `"ERR_ACCESS_DENIED"` ist, `permission` `"network"` und die URL `resource`. Siehe [Sandbox und Capabilities](../docs/sandbox-and-capabilities.md).
