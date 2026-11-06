---
title: "Image"
description: "Image: o elemento de imagem, além de Image.getSize e Image.prefetch para obter informações da imagem e carregá-la antecipadamente."
order: 2.2
source_hash: 028257cecdec706c
---


# Image

`nsh` exporta `Image`, o elemento [`<Image>`](../elements/image.md) que exibe imagens. O mesmo `Image` também consulta o carregador de imagens nativo sobre imagens sem exibi-las: seu tamanho e o carregamento antes de serem exibidas.

```ts
import { Image, type PixelSize } from "nsh";
```

`Image` é um componente com duas funções: `<Image src=…>` renderiza a view de imagem nativa (o compilador a gera no local, como faz com `<View>`), e `Image.getSize` / `Image.prefetch` são chamadas diretamente nele.

```ts
const Image: ((props: ImageProps) => JSX.Element) & {
  getSize(src: string | ImageAsset): Promise<PixelSize>;
  prefetch(src: string | ImageAsset): Promise<void>;
};
```

Veja [Imagens e assets](../docs/images-and-assets.md) para o guia.

## Image.getSize

```ts
getSize(src: string | ImageAsset): Promise<PixelSize>;

interface PixelSize {
  width: number;   // pixels (an SVG's: points)
  height: number;
}
```

Carrega a imagem e resolve com seu tamanho em pixels (da imagem de origem, não de uma cópia reduzida; no caso de um SVG, o tamanho intrínseco em pontos, [na web conforme o navegador o mede](../docs/images-and-assets.md#svg-images)). Uma imagem importada com [variantes de densidade de pixels](../docs/images-and-assets.md#pixel-densities) carrega a variante que as views carregam nesta tela e resolve com o tamanho do arquivo importado, seja qual for a variante carregada (um `<Image>` que a exibe informa os pixels da variante carregada em `onLoad`). Os bytes carregados permanecem na memória, então o `<Image>` que a exibir em seguida não a baixa novamente. A promise é rejeitada se a imagem não puder ser carregada.

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

Carrega uma imagem antes de exibi-la. Resolve quando seus bytes estão na memória e rejeita com o erro quando a imagem não pode ser carregada. Para uma imagem importada com variantes de densidade de pixels, carrega a variante que as views carregam nesta tela. Use-o para a próxima página de uma galeria ou para a imagem por trás de um toque.

```ts
const next = photos.slice(index + 1, index + 4);
next.forEach((p) => Image.prefetch(p.url).catch(() => {})); // the <Image> reports its own error later
```

<a id="related"></a>

## Relacionados

- [`<Image>`](../elements/image.md): `src`, `placeholder`, o estilo `objectFit`, `onLoad`, `onProgress`, `onError` e as demais props.
- Importar um arquivo de imagem (`import logo from "./logo.png"`) fornece um `ImageAsset` (`{ url, size, scales? }`, dimensionado em pontos) que `<Image src>` e o `drawImage` do canvas aceitam.

> [!NOTE]
> Quando seu app declara `capabilities` em `nsh.json`, `getSize` e `prefetch` de URLs remotas devem ser permitidos em `network`, como `fetch`. Uma URL fora dessa lista nunca é requisitada: a promise é rejeitada com um `Error` cujo `code` é `"ERR_ACCESS_DENIED"`, `permission` `"network"` e `resource` a URL. Veja [Sandbox e capacidades](../docs/sandbox-and-capabilities.md).
