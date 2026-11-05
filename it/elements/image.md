---
title: "Image"
description: "L'elemento che mostra un'immagine inclusa nel bundle o remota, con segnaposto, sfocatura, dissolvenze, tinte ed eventi di caricamento."
order: 30
group: primitives
demo: el-image
source_hash: df0573015c43b823
---

# Image

`Image` mostra un'immagine dagli asset dell'app o da un URL. Le immagini vengono scaricate e decodificate fuori dal main thread, ridimensionate alla dimensione con cui la vista le mostra e messe in cache in memoria. Le immagini animate GIF, WebP e APNG vengono riprodotte. In Rust se ne crea una con `image(src)`, in TSX con `<Image>` da `nsh`.

```rust tabs
use nsh_core::prelude::*;

// assets/logo.png in the app's crate.
const LOGO: ImageAsset = asset!("logo.png");

view()
    .flex_row()
    .gap_3()
    .child(image(LOGO))
    .child(
        image("https://example.com/avatar.jpg")
            .placeholder(LOGO)
            .object_fit(ResizeMode::Cover)
            .size(px(64.0))
            .rounded_full(),
    )
```

```tsx tabs
import { Image, View } from "nsh";
import logo from "./assets/logo.png";

<View style={{ flexDirection: "row", gap: 12 }}>
  <Image src={logo} />
  <Image
    src="https://example.com/avatar.jpg"
    placeholder={logo}
    style={{ width: 64, height: 64, borderRadius: 32 }}
  />
</View>;
```

Un asset conosce le proprie dimensioni: senza larghezza o altezza l'immagine usa quelle dell'asset, e con una sola delle due l'altra segue il rapporto d'aspetto dell'asset. La dimensione di un URL è nota solo dopo il caricamento, quindi per le immagini remote specifica sia la larghezza sia l'altezza (oppure un rapporto d'aspetto insieme a una delle due).

<a id="sources"></a>

## Sorgenti

La sorgente (`src` e `placeholder`; `image(..)` e `.placeholder(..)` in Rust) accetta:

| Valore | Esempio | Descrizione |
|---|---|---|
| Un asset | Rust `asset!("logo.png")`, TSX `import logo from "./logo.png"` | Un `ImageAsset` `{ url, size, scales? }`, dimensionato in punti: un file `@2x` conta la metà dei suoi pixel. Con `logo@2x.png` / `logo@3x.png` accanto a `logo.png`, viene caricata la variante per il rapporto di pixel dello schermo ([densità di pixel](../docs/images-and-assets.md#pixel-densities)). Si possono importare `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp` e `.heic`, e `.svg`, dimensionato dai suoi `width` e `height` o `viewBox` ([immagini SVG](../docs/images-and-assets.md#svg-images)). |
| Un URL | `"https://example.com/a.jpg"` | Scaricato e messo in cache. I download dello stesso URL sono condivisi tra le viste. |
| Un percorso di asset | `"asset:/images/a.png"` | Un file degli asset dell'app. |
| Un URI `data:` | `"data:image/png;base64,iVBOR…"` | Byte contenuti nell'URI, in base64 o con percent-encoding (`data:image/svg+xml,%3Csvg…`). |
| Un URL `blob:` | `URL.createObjectURL(blob)` | I byte di un `Blob` o `File` (TSX). L'immagine li conserva: revocare l'URL lascia un'immagine che si mostra per intero. |

Un'immagine ottenuta da byte che l'app possiede già viene mostrata senza alcuna richiesta. Una chat mostra una foto scelta dal suo blob mentre viene caricata, poi passa con `src` all'URL della foto:

```rust tabs
// Bytes in a `data:` URI (an image the app made or received inline).
image(format!("data:image/png;base64,{encoded}")).size(px(64.0))
```

```tsx tabs
import { Image, signal } from "nsh";

const preview = URL.createObjectURL(photo); // the picked `File`
const src = signal(preview);
upload(photo).then((url) => {
  src.set(url);
  URL.revokeObjectURL(preview);
});

<Image src={src()} style={{ width: 240, height: 180 }} />;
```

Byte uguali sono un'unica immagine: la stessa immagine come URI `data:` e come blob viene decodificata una sola volta e condivide la cache.

Durante lo sviluppo gli asset sono serviti dal dev server; `nsh build` e `nsh package` li copiano nell'app (un crate Rust distribuisce la propria directory `assets/` con `registry.assets(assets!())`). Vedi [immagini e asset](../docs/images-and-assets.md).

> [!NOTE]
> Quando l'app dichiara le [capabilities](../docs/sandbox-and-capabilities.md), le immagini remote vengono caricate dagli host elencati; un'immagine di qualsiasi altro host non viene richiesta e fallisce con `onError`, il cui `code` è `"ERR_ACCESS_DENIED"`. Gli URI `asset:`, gli URI `data:` e gli URL `blob:` vengono sempre caricati.

## Props

Oltre alle [prop comuni](./index.md#common-props) (con `style` di tipo `ImageStyle`):

| Prop | Rust | Tipo | Predefinito | Descrizione |
|---|---|---|---|---|
| `src` | `image(src)` | `string \| ImageAsset` | | L'immagine. |
| `placeholder` | `.placeholder(src)` | `string \| ImageAsset` | | Mostrata finché `src` non è stata caricata; meglio un asset locale. |
| `blurRadius` | `.blur_radius(px(..))` | `number` | | Sfoca l'immagine di questo raggio in punti (applicato una sola volta durante la decodifica, fuori dal main thread). |
| `fadeDuration` | `.fade_duration(ms)` | `number` | iOS `0`, Android `300` | Per quanto tempo un'immagine caricata appare in dissolvenza, in millisecondi. |
| `tintColor` (stile) | `.tint_color(..)` | `ColorValue` | | Ricolora un'immagine template (un'icona disegnata in un solo colore). |
| `objectFit` (stile) | `.object_fit(ResizeMode::Contain)` | `"cover" \| "contain" \| "fill" \| "none" \| "scale-down"` | `"cover"` | Come l'immagine si adatta al suo riquadro, come `object-fit` di CSS (classi `object-*`): `"cover"` lo riempie e ritaglia, `"contain"` la fa stare al suo interno, `"fill"` la deforma per riempirlo, `"none"` la mostra alla sua dimensione naturale, `"scale-down"` lo stesso, ma ridotta per adattarsi dove è più grande. |
| `objectPosition` (stile) | `.object_position(..)`, `.object_top()`, ... | `string` | `"center"` | Dove si colloca l'immagine nel suo riquadro una volta che `objectFit` l'ha dimensionata, come `object-position` di CSS (`"top"`, `"25% 75%"`, `"right 10px bottom 20%"`); un'immagine che copre viene ritagliata attorno ad essa. |
| `onLoadStart` | `.on_load_start(..)` | `() => void` | | Il caricamento è iniziato. |
| `onProgress` | `.on_progress(..)` | `(e: { loaded: number; total: number }) => void` | | Avanzamento del download in byte (`total` è 0 se sconosciuto), al massimo ogni 100 ms. |
| `onLoad` | `.on_load(..)` | `(e: { size: PixelSize }) => void` | | Caricata; la dimensione dell'immagine sorgente in pixel (non quella decodificata e ridimensionata; per un SVG la dimensione in punti, [sul web come la misura il browser](../docs/images-and-assets.md#svg-images)); per un'immagine con varianti, quella della variante caricata. |
| `onError` | `.on_error(..)` | `(e: { message: string; code?: string }) => void` | | Il caricamento è fallito; `code` è `"ERR_ACCESS_DENIED"` per un URL che le capabilities dell'app non concedono. |
| `onLoadEnd` | `.on_load_end(..)` | `() => void` | | Dopo `onLoad` o `onError`. |

`ImageStyle` aggiunge agli stili della vista `tintColor`, che ricolora un'immagine template (un'icona disegnata in un solo colore), e `objectPosition`, che colloca l'immagine nel suo riquadro ([Posizione dell'immagine](../docs/images-and-assets.md#image-position)).

```rust tabs
image(ICON).size(px(24.0)).tint_color(rgb(0x0969da))
```

```tsx tabs
<Image src={icon} style={{ width: 24, height: 24, tintColor: "#0969da" }} />
```

<a id="events"></a>

## Eventi

| Evento | Rust | Payload | Quando |
|---|---|---|---|
| `onLoadStart` | `.on_load_start` | nessuno | Il caricamento è iniziato. |
| `onProgress` | `.on_progress` | `{ loaded, total }` (`ImageProgress`) | Sono arrivati dei byte (al massimo ogni 100 ms). |
| `onLoad` | `.on_load` | `{ size }` (`Size<DevicePixels>`) | L'immagine è mostrata; la dimensione della sorgente in pixel (per un SVG in punti, [sul web come la misura il browser](../docs/images-and-assets.md#svg-images)). |
| `onError` | `.on_error` | `{ message, code? }` (`&str`, il messaggio) | Il caricamento o la decodifica sono falliti, oppure l'host è fuori dalle capabilities dell'app (`code` `"ERR_ACCESS_DENIED"`). |
| `onLoadEnd` | `.on_load_end` | nessuno | Dopo `onLoad` o `onError`. |

```rust tabs
let state = signal(SharedString::from("loading"));

image(url)
    .w_full()
    .aspect_ratio(16.0 / 9.0)
    .on_load(move |size: &Size<DevicePixels>| state.set(format!("{}×{}", size.width.0, size.height.0).into()))
    .on_error(move |message: &str| state.set(message.to_string().into()))
```

```tsx tabs
const state = signal("loading");
<Image
  src={url}
  style={{ width: "100%", aspectRatio: 16 / 9 }}
  onLoad={({ size }) => state.set(`${size.width}×${size.height} px`)}
  onError={(e) => state.set(e.message)}
/>;
```

Un'immagine con [varianti di densità di pixel](../docs/images-and-assets.md#pixel-densities) carica uno dei suoi file, e `onLoad` riporta i pixel di quel file: 192×192 per `logo@3x.png` su uno schermo 3×, per un `logo.png` di 64×64 punti. Quando il rapporto di pixel cambia e l'immagine carica un'altra variante, riporta anche quel caricamento: `onLoadStart`, poi `onLoad` con la dimensione del nuovo file (oppure `onError`), poi `onLoadEnd`.

Per conoscere la dimensione di un'immagine o caricarla prima di mostrarla, in TSX si chiamano `Image.getSize(src)` e `Image.prefetch(src)` (lo stesso `Image` che renderizza l'elemento li espone; vedi l'[Image API](../modules/nsh-image.md)), mentre in Rust si usano `image_size(src)` e `prefetch_image(src)`, con await in un task. Data un'immagine importata con varianti, `Image.getSize` e `Image.prefetch` caricano la variante che questo schermo mostra, e `getSize` restituisce la dimensione del file importato (64×64 per `logo.png`).

<a id="ref-methods"></a>

## Metodi ref

Nessuno specifico.

<a id="platform-notes"></a>

## Note sulle piattaforme

- La chiave della cache include la dimensione di decodifica e il raggio di sfocatura: lo stesso URL mostrato a due dimensioni viene decodificato due volte ma scaricato una sola.
- iOS riproduce le immagini animate come animazione a keyframe (fino a 600 frame); un'immagine animata colorata mostra il suo primo frame.
- Android riproduce le immagini animate a partire da API 28 (`AnimatedImageDrawable`), senza cache e senza sfocatura.
- Su Android i bordi sono disegnati sopra l'immagine, come su iOS.
