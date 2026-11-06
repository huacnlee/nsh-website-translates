---
title: "Image"
description: "Image: l'elemento immagine, più Image.getSize e Image.prefetch per ottenere informazioni sulle immagini e caricarle in anticipo."
order: 2.2
source_hash: 028257cecdec706c
---

# Image

`nsh` esporta `Image`, l'elemento [`<Image>`](../elements/image.md) che mostra le immagini. Lo stesso `Image` interroga anche il loader di immagini nativo sulle immagini senza mostrarle: la loro dimensione, e il loro caricamento prima che vengano mostrate.

```ts
import { Image, type PixelSize } from "nsh";
```

`Image` è un componente che porta con sé due funzioni: `<Image src=…>` renderizza la vista immagine nativa (il compilatore la crea sul posto, come fa con `<View>`), mentre `Image.getSize` / `Image.prefetch` vengono chiamate direttamente su di esso.

```ts
const Image: ((props: ImageProps) => JSX.Element) & {
  getSize(src: string | ImageAsset): Promise<PixelSize>;
  prefetch(src: string | ImageAsset): Promise<void>;
};
```

Consulta [Immagini e risorse](../docs/images-and-assets.md) per la guida.

## Image.getSize

```ts
getSize(src: string | ImageAsset): Promise<PixelSize>;

interface PixelSize {
  width: number;   // pixels (an SVG's: points)
  height: number;
}
```

Carica l'immagine e si risolve con la sua dimensione in pixel (dell'immagine sorgente, non di una copia ridotta; per un SVG, la dimensione intrinseca in punti, [sul web come la misura il browser](../docs/images-and-assets.md#svg-images)). Un'immagine importata con [varianti per densità di pixel](../docs/images-and-assets.md#pixel-densities) carica la variante che le viste caricano su questo schermo e si risolve con la dimensione del file importato, qualunque variante abbia caricato (un `<Image>` che la mostra riporta in `onLoad` i pixel della variante caricata). I byte caricati restano in memoria, quindi il `<Image>` che la mostra successivamente non la scarica di nuovo. La promise viene rifiutata se l'immagine non può essere caricata.

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

Carica un'immagine prima di mostrarla. Si risolve non appena i suoi byte sono in memoria e viene rifiutata con l'errore quando l'immagine non può essere caricata. Per un'immagine importata con varianti per densità di pixel, carica la variante che le viste caricano su questo schermo. Usalo per la pagina successiva di una galleria o per l'immagine dietro a un tap.

```ts
const next = photos.slice(index + 1, index + 4);
next.forEach((p) => Image.prefetch(p.url).catch(() => {})); // the <Image> reports its own error later
```

<a id="related"></a>

## Correlati

- [`<Image>`](../elements/image.md): `src`, `placeholder`, lo stile `objectFit`, `onLoad`, `onProgress`, `onError` e le altre prop.
- Importare un file immagine (`import logo from "./logo.png"`) restituisce un `ImageAsset` (`{ url, size, scales? }`, dimensionato in punti) che `<Image src>` e `drawImage` del canvas accettano.

> [!NOTE]
> Quando la tua app dichiara `capabilities` in `nsh.json`, `getSize` e `prefetch` degli URL remoti devono essere consentiti in `network`, come `fetch`. Un URL al di fuori di essi non viene mai richiesto: la promise viene rifiutata con un `Error` il cui `code` è `"ERR_ACCESS_DENIED"`, `permission` `"network"` e `resource` l'URL. Consulta [Sandbox e capability](../docs/sandbox-and-capabilities.md).
