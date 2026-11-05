---
title: "Image"
description: "Image: элемент изображения, а также Image.getSize и Image.prefetch для получения информации об изображении и его предварительной загрузки."
order: 2.2
source_hash: 028257cecdec706c
---

# Image

`nsh` экспортирует `Image` — элемент [`<Image>`](../elements/image.md), который показывает изображения. Тот же `Image` также обращается к нативному загрузчику изображений, не показывая их: узнаёт их размер и загружает их до показа.

```ts
import { Image, type PixelSize } from "nsh";
```

`Image` — это компонент с двумя функциями: `<Image src=…>` отрисовывает нативное представление изображения (компилятор создаёт его на месте, как и `<View>`), а `Image.getSize` / `Image.prefetch` вызываются непосредственно на нём.

```ts
const Image: ((props: ImageProps) => JSX.Element) & {
  getSize(src: string | ImageAsset): Promise<PixelSize>;
  prefetch(src: string | ImageAsset): Promise<void>;
};
```

Руководство см. в разделе [Images and assets](../docs/images-and-assets.md).

## Image.getSize

```ts
getSize(src: string | ImageAsset): Promise<PixelSize>;

interface PixelSize {
  width: number;   // pixels (an SVG's: points)
  height: number;
}
```

Загружает изображение и возвращает его размер в пикселях (исходного изображения, а не уменьшенной копии; для SVG — собственный размер в пунктах, [в вебе — так, как его измеряет браузер](../docs/images-and-assets.md#svg-images)). Для импортированного изображения с [вариантами для разной плотности пикселей](../docs/images-and-assets.md#pixel-densities) загружается вариант, который представления загружают на этом экране, а результат содержит размер импортированного файла, какой бы вариант ни был загружен (`<Image>`, показывающий его, сообщает в `onLoad` пиксели загруженного варианта). Загруженные байты остаются в памяти, поэтому `<Image>`, который покажет изображение следующим, не загружает его повторно. Промис отклоняется, если изображение не удалось загрузить.

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

Загружает изображение заранее, до его показа. Промис разрешается, когда байты изображения оказываются в памяти, и отклоняется с ошибкой, если изображение не удалось загрузить. Для импортированного изображения с вариантами для разной плотности пикселей загружается вариант, который представления загружают на этом экране. Используйте его для следующей страницы галереи или для изображения, которое открывается по нажатию.

```ts
const next = photos.slice(index + 1, index + 4);
next.forEach((p) => Image.prefetch(p.url).catch(() => {})); // the <Image> reports its own error later
```

<a id="related"></a>

## См. также

- [`<Image>`](../elements/image.md): `src`, `placeholder`, стиль `objectFit`, `onLoad`, `onProgress`, `onError` и другие свойства.
- Импорт файла изображения (`import logo from "./logo.png"`) даёт `ImageAsset` (`{ url, size, scales? }`, размер в пунктах), который принимают `<Image src>` и `drawImage` canvas.

> [!NOTE]
> Если ваше приложение объявляет `capabilities` в `nsh.json`, то `getSize` и `prefetch` для удалённых URL должны быть разрешены в `network`, как и `fetch`. URL вне этого списка никогда не запрашивается: промис отклоняется с `Error`, у которого `code` равно `"ERR_ACCESS_DENIED"`, `permission` `"network"` и `resource` URL. См. [Sandbox and capabilities](../docs/sandbox-and-capabilities.md).
