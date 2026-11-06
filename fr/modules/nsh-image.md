---
title: "Image"
description: "Image : l'élément image, ainsi que Image.getSize et Image.prefetch pour obtenir des informations sur les images et les charger à l'avance."
order: 2.2
source_hash: 028257cecdec706c
---

# Image

`nsh` exporte `Image`, l'élément [`<Image>`](../elements/image.md) qui affiche des images. Le même `Image` permet aussi d'interroger le chargeur d'images natif sur des images sans les afficher : connaître leur taille, et les charger avant de les afficher.

```ts
import { Image, type PixelSize } from "nsh";
```

`Image` est un composant qui porte deux fonctions : `<Image src=…>` affiche la vue d'image native (le compilateur la crée sur place, comme il le fait pour `<View>`), et `Image.getSize` / `Image.prefetch` sont appelées directement sur celui-ci.

```ts
const Image: ((props: ImageProps) => JSX.Element) & {
  getSize(src: string | ImageAsset): Promise<PixelSize>;
  prefetch(src: string | ImageAsset): Promise<void>;
};
```

Voir [Images et ressources](../docs/images-and-assets.md) pour le guide.

## Image.getSize

```ts
getSize(src: string | ImageAsset): Promise<PixelSize>;

interface PixelSize {
  width: number;   // pixels (an SVG's: points)
  height: number;
}
```

Charge l'image et se résout avec sa taille en pixels (celle de l'image source, et non d'une copie réduite ; pour un SVG, sa taille intrinsèque en points, [sur le web telle que le navigateur la mesure](../docs/images-and-assets.md#svg-images)). Une image importée avec des [variantes de densité de pixels](../docs/images-and-assets.md#pixel-densities) charge la variante que les vues chargent sur cet écran et se résout avec la taille du fichier importé, quelle que soit la variante chargée (un `<Image>` qui l'affiche indique dans `onLoad` les pixels de la variante chargée). Les octets chargés restent en mémoire, de sorte que le `<Image>` qui l'affiche ensuite ne la télécharge pas de nouveau. La promesse est rejetée si l'image ne peut pas être chargée.

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

Charge une image avant de l'afficher. Se résout dès que ses octets sont en mémoire, et est rejetée avec l'erreur lorsque l'image ne peut pas être chargée. Pour une image importée avec des variantes de densité de pixels, elle charge la variante que les vues chargent sur cet écran. Utilisez-la pour la page suivante d'une galerie ou pour l'image située derrière un appui.

```ts
const next = photos.slice(index + 1, index + 4);
next.forEach((p) => Image.prefetch(p.url).catch(() => {})); // the <Image> reports its own error later
```

<a id="related"></a>

## Voir aussi

- [`<Image>`](../elements/image.md) : `src`, `placeholder`, le style `objectFit`, `onLoad`, `onProgress`, `onError` et les autres props.
- L'importation d'un fichier image (`import logo from "./logo.png"`) fournit un `ImageAsset` (`{ url, size, scales? }`, dimensionné en points) que `<Image src>` et `drawImage` de canvas acceptent.

> [!NOTE]
> Lorsque votre application déclare `capabilities` dans `nsh.json`, `getSize` et `prefetch` des URL distantes doivent être autorisés dans `network`, comme `fetch`. Une URL qui n'en fait pas partie n'est jamais requêtée : la promesse est rejetée avec une `Error` dont `code` vaut `"ERR_ACCESS_DENIED"`, `permission` `"network"` et `resource` l'URL. Voir [Bac à sable et capacités](../docs/sandbox-and-capabilities.md).
