---
title: "Image"
description: "L'élément qui affiche une image intégrée ou distante, avec des espaces réservés, du flou, des fondus, une teinte et des événements de chargement."
order: 30
group: primitives
demo: el-image
source_hash: df0573015c43b823
---

# Image

`Image` affiche une image provenant des ressources de l'app ou d'une URL. Les images sont téléchargées et décodées hors du thread principal, sous-échantillonnées à la taille à laquelle la vue les affiche, puis mises en cache en mémoire. Les images animées GIF, WebP et APNG sont lues. En Rust, on en crée une avec `image(src)`, en TSX avec `<Image>` depuis `nsh`.

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

Une ressource connaît sa taille : sans largeur ni hauteur, l'image prend celle de la ressource, et avec l'une des deux, l'autre s'en déduit grâce au rapport d'aspect de la ressource. La taille d'une URL n'est connue qu'une fois l'image chargée ; donnez donc aux images distantes une largeur et une hauteur (ou un rapport d'aspect avec l'une des deux).

## Sources

La source (`src` et `placeholder` ; `image(..)` et `.placeholder(..)` en Rust) accepte :

| Valeur | Exemple | Description |
|---|---|---|
| Une ressource | Rust `asset!("logo.png")`, TSX `import logo from "./logo.png"` | Un `ImageAsset` `{ url, size, scales? }`, dimensionné en points : un fichier `@2x` compte la moitié de ses pixels. Avec `logo@2x.png` / `logo@3x.png` à côté de `logo.png`, la variante correspondant au ratio de pixels de l'écran est chargée ([densités de pixels](../docs/images-and-assets.md#pixel-densities)). `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp` et `.heic` peuvent être importés, ainsi que `.svg`, dimensionné par ses `width` et `height` ou `viewBox` ([images SVG](../docs/images-and-assets.md#svg-images)). |
| Une URL | `"https://example.com/a.jpg"` | Téléchargée et mise en cache. Les téléchargements d'une même URL sont partagés entre les vues. |
| Un chemin de ressource | `"asset:/images/a.png"` | Un fichier des ressources de l'app. |
| Une URI `data:` | `"data:image/png;base64,iVBOR…"` | Des octets dans l'URI, en base64 ou encodés en pourcentage (`data:image/svg+xml,%3Csvg…`). |
| Une URL `blob:` | `URL.createObjectURL(blob)` | Les octets d'un `Blob` ou d'un `File` (TSX). L'image les conserve : révoquer l'URL laisse une image qui s'affiche en entier. |

Une image issue d'octets que l'app possède déjà s'affiche sans requête. Un chat affiche une photo choisie depuis son blob pendant son envoi, puis passe `src` à l'URL de la photo :

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

Des octets identiques forment une seule image : la même image sous forme d'URI `data:` et de blob n'est décodée qu'une fois et partage le cache.

Pendant le développement, les ressources sont servies par le serveur de développement ; `nsh build` et `nsh package` les copient dans l'app (un crate Rust embarque son répertoire `assets/` avec `registry.assets(assets!())`). Voir [images et ressources](../docs/images-and-assets.md).

> [!NOTE]
> Lorsque l'app déclare des [capabilities](../docs/sandbox-and-capabilities.md), les images distantes sont chargées depuis les hôtes qu'elle liste ; une image provenant de tout autre hôte n'est pas requêtée et échoue avec `onError`, dont `code` vaut `"ERR_ACCESS_DENIED"`. Les URI `asset:`, les URI `data:` et les URL `blob:` se chargent toujours.

## Props

En plus des [props communes](./index.md#common-props) (avec `style` typé `ImageStyle`) :

| Prop | Rust | Type | Défaut | Description |
|---|---|---|---|---|
| `src` | `image(src)` | `string \| ImageAsset` | | L'image. |
| `placeholder` | `.placeholder(src)` | `string \| ImageAsset` | | Affiché tant que `src` n'est pas chargé ; idéalement une ressource locale. |
| `blurRadius` | `.blur_radius(px(..))` | `number` | | Floute l'image selon ce rayon en points (appliqué une seule fois pendant le décodage, hors du thread principal). |
| `fadeDuration` | `.fade_duration(ms)` | `number` | iOS `0`, Android `300` | Durée du fondu d'apparition d'une image chargée, en millisecondes. |
| `tintColor` (style) | `.tint_color(..)` | `ColorValue` | | Recolore une image modèle (une icône dessinée d'une seule couleur). |
| `objectFit` (style) | `.object_fit(ResizeMode::Contain)` | `"cover" \| "contain" \| "fill" \| "none" \| "scale-down"` | `"cover"` | Comment l'image s'ajuste à son cadre, comme `object-fit` en CSS (classes `object-*`) : `"cover"` le remplit et rogne, `"contain"` l'inscrit à l'intérieur, `"fill"` l'étire, `"none"` l'affiche à sa taille naturelle, `"scale-down"` pareil, réduite pour tenir là où elle est plus grande. |
| `objectPosition` (style) | `.object_position(..)`, `.object_top()`, ... | `string` | `"center"` | Où l'image se place dans son cadre une fois dimensionnée par `objectFit`, comme `object-position` en CSS (`"top"`, `"25% 75%"`, `"right 10px bottom 20%"`) ; une image qui couvre le cadre est rognée autour de ce point. |
| `onLoadStart` | `.on_load_start(..)` | `() => void` | | Le chargement a commencé. |
| `onProgress` | `.on_progress(..)` | `(e: { loaded: number; total: number }) => void` | | Progression du téléchargement en octets (`total` vaut 0 si inconnu), au plus toutes les 100 ms. |
| `onLoad` | `.on_load(..)` | `(e: { size: PixelSize }) => void` | | Chargée ; la taille de l'image source en pixels (pas celle de l'image décodée et sous-échantillonnée ; pour un SVG, sa taille en points, [sur le web telle que le navigateur la mesure](../docs/images-and-assets.md#svg-images)) ; pour une image avec variantes, celle de la variante chargée. |
| `onError` | `.on_error(..)` | `(e: { message: string; code?: string }) => void` | | Échec du chargement ; `code` vaut `"ERR_ACCESS_DENIED"` pour une URL que les capabilities de l'app n'autorisent pas. |
| `onLoadEnd` | `.on_load_end(..)` | `() => void` | | Après `onLoad` ou `onError`. |

`ImageStyle` ajoute `tintColor` aux styles de vue, qui recolore une image modèle (une icône dessinée d'une seule couleur), et `objectPosition`, qui place l'image dans son cadre ([Position de l'image](../docs/images-and-assets.md#image-position)).

```rust tabs
image(ICON).size(px(24.0)).tint_color(rgb(0x0969da))
```

```tsx tabs
<Image src={icon} style={{ width: 24, height: 24, tintColor: "#0969da" }} />
```

<a id="events"></a>

## Événements

| Événement | Rust | Charge utile | Quand |
|---|---|---|---|
| `onLoadStart` | `.on_load_start` | aucune | Le chargement a commencé. |
| `onProgress` | `.on_progress` | `{ loaded, total }` (`ImageProgress`) | Des octets sont arrivés (au plus toutes les 100 ms). |
| `onLoad` | `.on_load` | `{ size }` (`Size<DevicePixels>`) | L'image est affichée ; sa taille source en pixels (pour un SVG, en points, [sur le web telle que le navigateur la mesure](../docs/images-and-assets.md#svg-images)). |
| `onError` | `.on_error` | `{ message, code? }` (`&str`, le message) | Le chargement ou le décodage a échoué, ou l'hôte est hors des capabilities de l'app (`code` `"ERR_ACCESS_DENIED"`). |
| `onLoadEnd` | `.on_load_end` | aucune | Après `onLoad` ou `onError`. |

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

Une image avec des [variantes de densité de pixels](../docs/images-and-assets.md#pixel-densities) charge l'un de ses fichiers, et `onLoad` indique les pixels de ce fichier : 192×192 pour `logo@3x.png` sur un écran 3×, pour un `logo.png` de 64×64 points. Lorsque le ratio de pixels change et que l'image charge une autre variante, elle signale aussi ce chargement : `onLoadStart`, puis `onLoad` avec la taille du nouveau fichier (ou `onError`), puis `onLoadEnd`.

Pour connaître la taille d'une image ou la charger avant de l'afficher, TSX appelle `Image.getSize(src)` et `Image.prefetch(src)` (le même `Image` qui rend l'élément les porte ; voir l'[API Image](../modules/nsh-image.md)), et Rust `image_size(src)` et `prefetch_image(src)`, attendus dans une tâche. Avec une image importée possédant des variantes, `Image.getSize` et `Image.prefetch` chargent la variante affichée par cet écran, et `getSize` renvoie la taille du fichier importé (64×64 pour `logo.png`).

<a id="ref-methods"></a>

## Méthodes de ref

Aucune qui lui soit propre.

<a id="platform-notes"></a>

## Notes par plateforme

- La clé de cache inclut la taille de décodage et le rayon de flou : la même URL affichée à deux tailles est décodée deux fois mais téléchargée une seule fois.
- iOS lit les images animées comme une animation par images clés (jusqu'à 600 images) ; une image animée teintée affiche sa première image.
- Android lit les images animées à partir de l'API 28 (`AnimatedImageDrawable`), sans cache et sans flou.
- Sur Android, les bordures sont dessinées au-dessus de l'image, comme sur iOS.
