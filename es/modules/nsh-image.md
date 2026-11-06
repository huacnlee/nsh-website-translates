---
title: "Image"
description: "Image: el elemento de imagen, además de Image.getSize e Image.prefetch para obtener información de la imagen y cargarla con antelación."
order: 2.2
source_hash: 028257cecdec706c
---


# Image

`nsh` exporta `Image`, el elemento [`<Image>`](../elements/image.md) que muestra imágenes. El mismo `Image` también consulta al cargador de imágenes nativo sobre imágenes sin mostrarlas: su tamaño y su carga antes de mostrarlas.

```ts
import { Image, type PixelSize } from "nsh";
```

`Image` es un componente que lleva dos funciones: `<Image src=…>` renderiza la vista de imagen nativa (el compilador la crea en el lugar, igual que `<View>`), y `Image.getSize` / `Image.prefetch` se llaman directamente sobre él.

```ts
const Image: ((props: ImageProps) => JSX.Element) & {
  getSize(src: string | ImageAsset): Promise<PixelSize>;
  prefetch(src: string | ImageAsset): Promise<void>;
};
```

Consulta [Imágenes y recursos](../docs/images-and-assets.md) para ver la guía.

## Image.getSize

```ts
getSize(src: string | ImageAsset): Promise<PixelSize>;

interface PixelSize {
  width: number;   // pixels (an SVG's: points)
  height: number;
}
```

Carga la imagen y se resuelve con su tamaño en píxeles (el de la imagen de origen, no el de una copia reducida; el tamaño intrínseco de un SVG en puntos, [en la web tal como lo mide el navegador](../docs/images-and-assets.md#svg-images)). Una imagen importada con [variantes de densidad de píxeles](../docs/images-and-assets.md#pixel-densities) carga la variante que las vistas cargan en esta pantalla y se resuelve con el tamaño del archivo importado, sea cual sea la variante que haya cargado (un `<Image>` que la muestre informa de los píxeles de la variante cargada en `onLoad`). Los bytes cargados permanecen en memoria, de modo que el `<Image>` que la muestre a continuación no la descarga de nuevo. La promesa se rechaza si no se puede cargar la imagen.

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

Carga una imagen antes de mostrarla. Se resuelve cuando sus bytes están en memoria y se rechaza con el error cuando la imagen no se puede cargar. Para una imagen importada con variantes de densidad de píxeles, carga la variante que las vistas cargan en esta pantalla. Úsalo para la siguiente página de una galería o para la imagen que hay detrás de un toque.

```ts
const next = photos.slice(index + 1, index + 4);
next.forEach((p) => Image.prefetch(p.url).catch(() => {})); // the <Image> reports its own error later
```

<a id="related"></a>

## Relacionado

- [`<Image>`](../elements/image.md): `src`, `placeholder`, el estilo `objectFit`, `onLoad`, `onProgress`, `onError` y el resto de props.
- Importar un archivo de imagen (`import logo from "./logo.png"`) da un `ImageAsset` (`{ url, size, scales? }`, con tamaño en puntos) que `<Image src>` y `drawImage` de canvas aceptan.

> [!NOTE]
> Cuando tu app declara `capabilities` en `nsh.json`, `getSize` y `prefetch` de URL remotas deben estar permitidos en `network`, igual que `fetch`. Una URL fuera de ellos nunca se solicita: la promesa se rechaza con un `Error` cuyo `code` es `"ERR_ACCESS_DENIED"`, `permission` `"network"` y `resource` la URL. Consulta [Sandbox y capacidades](../docs/sandbox-and-capabilities.md).
