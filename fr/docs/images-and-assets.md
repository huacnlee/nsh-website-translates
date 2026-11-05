---
title: "Images et ressources"
description: "Afficher des images en Rust et en TSX - les ressources de l'application et les fichiers @2x, les images SVG, les URL distantes, les modes de redimensionnement, les images de substitution, le flou, la teinte, les événements de chargement, ainsi que la lecture de la taille d'une image ou son préchargement."
order: 36
group: ui
source_hash: 0ac8dbc4cc613a89
---

# Images et ressources

L'élément image (`image(..)` en Rust, `<Image>` en TSX) affiche une image bitmap ou un dessin SVG : un fichier livré avec l'app, ou une image téléchargée depuis une URL. Les images sont lues et décodées hors du thread principal, réduites à la taille à laquelle la vue les affiche, puis mises en cache ; le thread principal ne fait qu'afficher le résultat décodé.

```rust tabs
const LOGO: ImageAsset = asset!("logo@2x.png");

image(LOGO)
image("https://picsum.photos/seed/nsh/600/400").w_full().h(px(200.0)).rounded(px(12.0))
```

```tsx tabs
import { Image } from "nsh";
import logo from "./assets/logo@2x.png";

<Image src={logo} />
<Image src="https://picsum.photos/seed/nsh/600/400" style={{ width: "100%", height: 200, borderRadius: 12 }} />
```

Les props de l'élément sont listées sur [image](../elements/image.md).

<a id="images-in-the-app"></a>

## Images dans l'app

Un crate Rust garde ses fichiers dans son répertoire `assets/` : `asset!("logo@2x.png")` (le chemin relatif à `assets/`) est un `ImageAsset`, `{ url, size, scales }`, lu à la compilation du crate, et `registry.assets(assets!())` dans la fonction `#[native_module]` du crate livre chaque fichier du répertoire avec l'app. En TSX, importez un fichier image comme un module : l'import donne un `ImageAsset`, `{ url, size, scales? }`, et le bundler livre le fichier avec l'app :

```rust tabs
const LOGO: ImageAsset = asset!("logo@2x.png");

// LOGO.url: "asset:/@my-app/logo@2x.png", LOGO.size: 64 × 64 points

#[native_module("app/native")]
fn native(registry: &mut Registry) {
    registry.assets(assets!());
}
```

```tsx tabs
import logo from "./assets/logo@2x.png";

logo; // { url: "asset:/assets/logo@2x.png", size: { width: 64, height: 64 } }
```

Fichiers pris en charge : `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.heic` et `.svg` ([images SVG](#svg-images)).

**Les tailles sont en points.** Un suffixe `@2x` ou `@3x` dans le nom du fichier indique que le fichier a 2 ou 3 pixels par point, donc `logo@2x.png` de 128×128 pixels est une ressource de 64×64 points. Sans suffixe, un pixel vaut un point. Un fichier nommé avec un suffixe est celui qui s'affiche ; un fichier nommé sans suffixe affiche ses [variantes de densité de pixels](#pixel-densities) lorsqu'il en a.

**Taille naturelle.** Une image issue d'une ressource se dimensionne à sa taille naturelle lorsque son style laisse la largeur ou la hauteur ouverte, donc `image(LOGO)` et `<Image src={logo} />` n'ont besoin d'aucun style. Définissez une dimension et le rapport d'aspect, ou les deux, pour la dimensionner autrement.

En Rust, un fichier manquant ou corrompu fait échouer la compilation, et un fichier modifié recompile le crate. En TSX, les ressources sont résolues relativement au module qui les importe, et leur `url` est relatif à la racine de l'app (le répertoire de l'entrée). `nsh build` les copie dans `out/assets/`, `nsh package` les place dans l'app, et pendant le développement le serveur de développement les sert.

> [!TIP]
> En TSX, `src` accepte aussi des chaînes `asset:/path`, et les fichiers importés sont les seuls dont la livraison est garantie. Un chemin qui n'est jamais importé fonctionne avec le serveur de développement, qui sert tout le répertoire de l'app, mais il est absent des apps empaquetées. Importez chaque image que vous utilisez. Un crate Rust livre tout son répertoire `assets/` via `assets!()`.

<a id="pixel-densities"></a>

### Densités de pixels

Nommez le fichier sans suffixe et placez ses versions plus denses à côté de lui, et l'app charge celle qui convient à l'écran :

```text
assets/
├── logo.png       64×64 pixels
├── logo@2x.png    128×128
└── logo@3x.png    192×192
```

```rust tabs
const LOGO: ImageAsset = asset!("logo.png");

// LOGO.size: 64 × 64 points, LOGO.scales: [1.0, 2.0, 3.0]
```

```tsx tabs
import logo from "./assets/logo.png";

logo; // { url: "asset:/assets/logo.png", size: { width: 64, height: 64 }, scales: [1, 2, 3] }
```

- `asset!` et le bundler recherchent les fichiers voisins `@1.5x`, `@2x`, `@3x` et `@4x` d'une image nommée sans suffixe. `scales` les liste, avec 1 pour le fichier nommé ; une image sans voisins n'a aucune échelle (en TSX, elle s'importe comme `{ url, size }`). Le bundler livre les voisins qu'il trouve, et `assets!()` livre tout le répertoire.
- L'image charge la plus petite échelle au moins égale au ratio de pixels de l'écran, sinon la plus grande, comme le fait React Native : `logo.png` sur un écran 1×, `logo@2x.png` sur un écran 2×, `logo@3x.png` sur un téléphone 3× (et à 2,625). Sur le web, seul ce fichier est téléchargé.
- Lorsque le ratio de pixels change (une fenêtre déplacée vers un autre écran, le zoom du navigateur), les images dont le choix change se rechargent, avec leurs [événements de chargement](#load-events). Leur taille reste celle du fichier nommé, en points.
- Une variante dont les pixels ne correspondent pas à la taille du fichier nommé multipliée par son échelle provoque un avertissement de build en TSX et fait échouer le build en Rust.
- Un fichier nommé avec un suffixe de densité (`./logo@3x.png`, `asset!("logo@3x.png")`) est ce fichier seul.
- Une [image SVG](#svg-images) est dessinée pour l'écran à n'importe quel ratio, elle ne livre donc aucune variante.

Un seul fichier convient aussi : exportez-le à la densité la plus haute dont vous avez besoin (`@3x` pour le rendu le plus net sur tous les téléphones) et nommez-le avec son suffixe ; les images sont réduites à l'écran lors du décodage. Les variantes permettent à chaque écran de télécharger, décoder et conserver le fichier qui lui convient.

<a id="svg-images"></a>

## Images SVG

Importez un fichier `.svg` comme n'importe quelle image. Sa taille en points est celle de ses attributs `width` et `height` (ou de l'un d'eux, l'autre étant déduit du rapport d'aspect du `viewBox`), sinon de son `viewBox` : un pixel CSS du SVG vaut un point, et les suffixes `@2x` laissent les fichiers SVG tels quels.

```tsx
import logo from "./assets/logo.svg"; // <svg width="120" height="40" …>
import star from "./assets/star.svg"; // <svg viewBox="0 0 24 24" …>

logo; // { url: "asset:/assets/logo.svg", size: { width: 120, height: 40 } }

<Image src={logo} />
<Image src={star} style={{ width: 36, height: 36, tintColor: "#0969da" }} />
```

Un SVG est net à la taille à laquelle il est affiché. Le navigateur le dessine en vectoriel ; iOS, macOS et Android le dessinent à la taille, en pixels, à laquelle la vue l'affiche au chargement de l'image (comme ils réduisent les bitmaps ; une vue qui grandit ensuite met ce dessin à l'échelle, jusqu'au prochain chargement de l'image) ; Windows, Linux et GPUI le dessinent une fois à quatre pixels par point (jusqu'à 2048 pixels de côté) et le mettent à l'échelle pour chaque vue. Tout le reste fonctionne comme pour les bitmaps : `objectFit`, `tintColor` (à travers les formes opaques du SVG, de sorte que les icônes monochromes suivent le thème), les filtres, `blurRadius`, les placeholders, les événements de chargement, `Image.getSize` et `Image.prefetch`. `onLoad` et `Image.getSize` rapportent la taille d'un SVG en points entiers ; l'image se dimensionne à sa taille exacte. Les fichiers SVG distants se chargent de la même manière, via les mêmes téléchargements et les mêmes vérifications de [capacités](./sandbox-and-capabilities.md) ; NSH reconnaît un SVG à son contenu (y compris compressé en gzip, `.svgz`), quelle que soit la fin de son URL.

**Ce que dessinent les plateformes natives.** iOS, macOS, Android, Windows, Linux et GPUI dessinent les SVG avec un seul moteur de rendu (resvg), de sorte qu'un dessin est identique partout : formes et tracés, remplissages et contours, dégradés et motifs, chemins de découpe et masques, opacité, filtres et transformations. Le texte (`<text>`), l'animation (SMIL et CSS), les images intégrées (`<image>`) et le HTML (`<foreignObject>`) s'affichent dans le navigateur ; les plateformes natives dessinent le reste du SVG, de façon statique, et `nsh build` nomme les fichiers qui les utilisent. Exportez le texte en contours (tracés) pour obtenir le même résultat partout.

**Une image autonome.** Sur les plateformes natives, un SVG ne dessine que ce qu'il contient : les fichiers, URL, images `data:` et autres documents qu'il référence sont ignorés. Les plateformes natives dessinent les SVG, y compris distants, dans des limites qui maîtrisent la mémoire : un document jusqu'à 16 MiB (un document compressé une fois décompressé), un dessin jusqu'à 8192 pixels de côté et 4096 × 4096 pixels au total (64 MiB ; un dessin plus grand est dessiné plus petit), et des calques (groupes avec opacité, masques, chemins de découpe et filtres, que le moteur dessine à part) jusqu'à 256 MiB à la fois. Un SVG qui dépasse la limite de document ou de calque échoue au chargement, avec `onError`.

**Tailles rapportées sur le web.** Le navigateur mesure lui-même les SVG, importés ou distants : `onLoad` et `Image.getSize` rapportent les `width` et `height` d'un SVG lorsqu'il en a, et sinon la taille que lui donne le navigateur, que les navigateurs déduisent généralement d'une valeur par défaut de 300 × 150 et du rapport d'aspect du `viewBox`. Les SVG importés se dimensionnent à la taille du bundler sur toutes les plateformes. Donnez aux SVG un `width` et un `height` pour obtenir la même taille rapportée partout.

<a id="remote-images"></a>

## Images distantes

Donnez une URL à l'élément : une chaîne en Rust (une closure pour une URL qui change), une chaîne d'URL en TSX :

```rust tabs
image(move || user.with(|u| u.avatar_url.clone()))
    .size(px(48.0))
    .rounded(px(24.0))
    .bg(rgb(0xeaeef2))
```

```tsx tabs
<Image src={user().avatarUrl} style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: "#eaeef2" }} />
```

- **Donnez une taille aux images distantes.** Leur taille est inconnue tant qu'elles ne sont pas chargées ; sans largeur ni hauteur (ou l'une des deux et un rapport d'aspect), elles s'effondrent à une hauteur nulle.
- **Une couleur d'arrière-plan** s'affiche pendant le chargement de l'image, ou utilisez un placeholder (ci-dessous).
- Les téléchargements sont partagés : plusieurs vues affichant la même URL la téléchargent une seule fois, même lorsqu'elles la décodent à des tailles différentes. Un téléchargement que plus personne n'attend est annulé.
- Les images décodées sont mises en cache en mémoire (le cache est purgé en cas de pression mémoire), avec pour clé l'URL, la taille de décodage et le rayon de flou.
- Lorsque l'app déclare des [capacités](./sandbox-and-capabilities.md), l'hôte de l'image doit être autorisé dans `network` ; une image refusée échoue avec son événement d'erreur.

<a id="kept-on-disk"></a>

### Conservées sur disque

Les images téléchargées sont aussi conservées sur disque, telles que le serveur les a envoyées, de sorte qu'une app rouverte (une conversation pleine d'avatars et de photos, un fil d'actualité) affiche les images qu'elle affichait auparavant sans les télécharger, y compris hors ligne. L'app n'a besoin d'aucun réglage : chaque image dont l'URL est `http://` ou `https://` passe par le cache sur iOS, Android, macOS, Windows, Linux et GPUI, et dans le navigateur, c'est le cache HTTP du navigateur qui fait de même.

Le cache suit les en-têtes de cache HTTP du serveur :

- Une image est conservée sauf si la réponse indique `Cache-Control: no-store`.
- Elle est utilisée sans requête tant qu'elle est fraîche : pendant `max-age`, sinon jusqu'à `Expires`, sinon pendant un dixième du temps écoulé depuis `Last-Modified` (au plus une semaine).
- Ensuite, elle est vérifiée auprès du serveur (`If-None-Match` avec son `ETag`, `If-Modified-Since` avec son `Last-Modified`) : une image inchangée (`304`) est réutilisée sans être retéléchargée, une image modifiée la remplace.
- Lorsque la requête échoue (pas de réseau) ou que le serveur renvoie une erreur (`5xx`), la copie conservée est affichée, sauf si la réponse indiquait `must-revalidate` ou `no-cache`.

Chaque app a son propre cache de 256 MiB ; au-delà, les images les moins récemment utilisées sont supprimées en premier. Plusieurs vues, surfaces et processus d'une même app le partagent en toute sécurité. Les apps hôtes choisissent son emplacement et sa taille, ou le désactivent :

```rust tabs
// macOS, Windows, Linux and GPUI: the AppView's options (or AppView::set_cache).
let mut cache = CacheOptions::at(CacheLocation::Dir(caches.join("nsh")));  // each app in <dir>/<app id>
cache.images = CachePolicy::MaxSize(ByteSize::mib(64));                     // CachePolicy::Off: none
let view = AppView::new(mtm, AppOptions { cache, ..AppOptions::default() });
```

```swift tabs
// iOS: NshAppView, before loading.
app.cacheOptions = NshCacheOptions(location: .directory(caches.appendingPathComponent("nsh")),
                                   images: .maxSize(megabytes: 64))   // .off: none
```

```java tabs
// Android: NshView, before loading.
nsh.setCacheOptions(NshCacheOptions.builder()
        .location(new File(getCacheDir(), "nsh"))
        .imagesMaxMegabytes(64)          // imagesOff(): none
        .build());
```

`CacheLocation::Off` (`.off`, `noDiskCache()`) ne conserve rien sur disque.

Par défaut, le cache se trouve dans le répertoire de cache du système : `Library/Caches/nsh` sur iOS, `nsh` dans le répertoire de cache sur Android, `~/Library/Caches` sur macOS, `%LOCALAPPDATA%` sur Windows et `$XDG_CACHE_HOME` (`~/.cache`) sur Linux, chaque app dans `<app id>/images` à cet endroit. Le système peut vider ces répertoires lorsqu'il a besoin d'espace.

<a id="resize-modes"></a>

## Modes de redimensionnement

Le style `objectFit`, l'équivalent du `object-fit` de CSS (`.object_fit(..)` en Rust), détermine comment une image remplit une boîte de forme différente :

| Valeur | Résultat |
|---|---|
| `"cover"` (`ResizeMode::Cover`, par défaut) | Remplit la boîte en conservant le rapport d'aspect, en rognant ce qui dépasse |
| `"contain"` (`ResizeMode::Contain`) | S'inscrit dans la boîte en conservant le rapport d'aspect, en laissant des bandes vides |
| `"fill"` (`ResizeMode::Stretch`) | Remplit exactement la boîte, en déformant l'image |
| `"none"` (`ResizeMode::Center`) | Taille naturelle, placée à `objectPosition` (centrée par défaut) |
| `"scale-down"` (`ResizeMode::ScaleDown`) | Taille naturelle, réduite pour tenir là où elle est plus grande |

```rust tabs
image(photo).object_fit(ResizeMode::Contain).size(px(140.0)).bg(rgb(0xeaeef2))
```

```tsx tabs
<Image src={photo} style={{ width: 140, height: 140, objectFit: "contain", backgroundColor: "#eaeef2" }} />
```

Les classes Tailwind `object-cover`, `object-contain`, `object-fill`, `object-none` et `object-scale-down` définissent le même style.

<a id="image-position"></a>

### Position de l'image

L'emplacement de l'image dimensionnée dans sa boîte est défini par le style `objectPosition` (`.object_position(..)` et `.object_top()`, ... en Rust), l'équivalent du `object-position` de CSS : le centre par défaut. Une image qui couvre la boîte est rognée autour de ce point, une image contenue se déplace dans ses bandes. Il accepte des mots-clés (`"top"`, `"left bottom"`), des pourcentages et des longueurs (`"25% 75%"`, `"10px 0"`) et des bords avec décalages (`"right 10px bottom 20%"`). Une photo en hauteur dans une bulle de discussion montre ainsi son haut :

```rust tabs
image(photo).object_fit(ResizeMode::Cover).object_top().w(px(220.0)).h(px(160.0)).rounded(px(16.0))
```

```tsx tabs
<Image src={photo} style={{ width: 220, height: 160, borderRadius: 16, objectPosition: "top" }} />
```

Les classes Tailwind sont celles de Tailwind : `object-top`, `object-bottom`, `object-left`, `object-right`, `object-center`, `object-top-left`, `object-top-right`, `object-bottom-left`, `object-bottom-right` et les valeurs arbitraires (`object-[25%_75%]`).

<a id="styling-images"></a>

## Style des images

Les images sont des vues : elles acceptent les rayons de coin (y compris par coin), les bordures, les ombres, l'opacité et les transformations. Les coins découpent l'image.

```rust tabs
image(avatar).size(px(90.0)).rounded(px(45.0)).border(px(3.0)).border_color(rgb(0x8250df))
```

```tsx tabs
<Image src={avatar} style={{ width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: "#8250df" }} />
```

- **La teinte** (`.tint_color(..)` en Rust, le style `tintColor` en TSX) recolore les pixels opaques de l'image : utilisez-la pour les icônes monochromes qui suivent le thème.
- **Les filtres** (`.grayscale(..)`, `.sepia(..)`, `.blur(..)` ; `filter` en TSX) s'appliquent aux images sur les deux plateformes ([Filtres](./styling.md#filters-and-blending)).

```rust tabs
image(ICON).size(px(24.0)).tint_color(AdaptiveColor::rgb(0x0969da, 0x58a6ff))
```

```tsx tabs
<Image src={icon} style={{ width: 24, height: 24, tintColor: active() ? "#0969da" : "#6e7781" }} />
```

<a id="placeholders-fading-and-blur"></a>

## Placeholders, fondu et flou

| Prop | Rust | Description |
|---|---|---|
| `placeholder` | `.placeholder(..)` | Une image affichée jusqu'au chargement de `src`, une URL ou une ressource ; de préférence une ressource locale |
| `fadeDuration` | `.fade_duration(ms)` | Durée en millisecondes du fondu d'apparition de l'image chargée. 0 par défaut sur iOS, 300 sur Android |
| `blurRadius` | `.blur_radius(px(..))` | Floute l'image selon ce rayon en points, appliqué une seule fois lors du décodage |

```rust tabs
image(move || format!("https://picsum.photos/seed/{}/300/300", id.get()))
    .placeholder(PLACEHOLDER)
    .fade_duration(250.0)
    .size(px(100.0))
    .rounded(px(12.0))
image(cover).blur_radius(px(16.0)).absolute().inset_0()
```

```tsx tabs
<Image
  src={`https://picsum.photos/seed/${id()}/300/300`}
  placeholder={placeholder}
  fadeDuration={250}
  style={{ width: 100, height: 100, borderRadius: 12 }}
/>
<Image src={cover} blurRadius={16} style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }} />
```

<a id="animated-images"></a>

## Images animées

Les fichiers GIF, WebP et APNG animés se lisent automatiquement, comme ressources ou depuis des URL. Ils acceptent les mêmes styles, `objectFit` compris ; une image animée teintée affiche sa première image sur iOS.

<a id="load-events"></a>

## Événements de chargement

| Événement | Rust | Données | Quand |
|---|---|---|---|
| `onLoadStart` | `.on_load_start(..)` | | Le chargement commence |
| `onProgress` | `.on_progress(..)` | `{ loaded, total }` en octets (`total` vaut 0 si inconnu) | Pendant un téléchargement, au plus toutes les 100 ms |
| `onLoad` | `.on_load(..)` | `{ size }` | L'image est prête ; la taille de la source en pixels (celle d'un SVG en points, [sur le web telle que le navigateur la mesure](#svg-images)) |
| `onError` | `.on_error(..)` | `{ message }` (un `&str` en Rust) | Le chargement ou le décodage a échoué |
| `onLoadEnd` | `.on_load_end(..)` | | Après `onLoad` ou `onError` |

```rust tabs
let status = signal(SharedString::from("loading…"));

image(url)
    .on_load(move |size: &Size<DevicePixels>| status.set(format!("{}×{}", size.width.0, size.height.0).into()))
    .on_error(move |message: &str| status.set(message.to_owned().into()))
    .w(px(90.0))
    .h(px(60.0))
```

```tsx tabs
const status = signal("loading…");

<Image
  src={url}
  onLoad={({ size }) => status.set(`${size.width}×${size.height}`)}
  onError={(e) => status.set(e.message)}
  style={{ width: 90, height: 60 }}
/>
```

L'événement de chargement rapporte la taille de l'image source, pas celle à laquelle elle a été décodée.

Une image avec des [variantes de densité de pixels](#pixel-densities) charge l'un de ses fichiers, et l'événement de chargement rapporte les pixels de ce fichier : 192×192 pour `logo@3x.png` sur un écran 3×, alors que `Image.getSize(logo)` se résout avec les 64×64 du fichier importé. Lorsque le ratio de pixels change et que l'image charge une autre variante, ce chargement rapporte aussi ses événements : `onLoadStart`, puis `onLoad` avec la taille du nouveau fichier (ou `onError`), puis `onLoadEnd`.
<a id="an-images-size-and-prefetching"></a>

## Taille d'une image et préchargement

Les images qui ne sont pas à l'écran peuvent être mesurées et chargées à l'avance : `image_size(..)` et `prefetch_image(..)` en Rust, `Image.getSize` et `Image.prefetch` (sur le même `Image` que celui qui affiche l'élément) en TSX :

```rust tabs
spawn(async move {
    // Ok(ImageSize { width, height }), in pixels.
    let size = image_size("https://example.com/photo.jpg").await;
    // Ok(()) once the bytes are in memory.
    let loaded = prefetch_image("https://example.com/next.jpg").await;
});
```

```tsx tabs
import { Image } from "nsh";

const size = await Image.getSize("https://example.com/photo.jpg");   // { width, height } in pixels
await Image.prefetch("https://example.com/next.jpg");                // once the bytes are in memory
```

| Rust | TSX | Retourne |
|---|---|---|
| `image_size(src)` | `Image.getSize(src)` | La taille de l'image en pixels (celle d'un SVG en points, [sur le web telle que le navigateur la mesure](#svg-images)) ; une erreur si l'image ne peut pas être chargée |
| `prefetch_image(src)` | `Image.prefetch(src)` | Rien, une fois les octets de l'image chargés ; une erreur si l'image ne peut pas être chargée |

En TSX, `src` est une chaîne d'URL ou une image importée. Pour une image importée avec des [variantes](#pixel-densities), les deux fonctions chargent la variante que les vues chargent sur cet écran, et `getSize` donne la taille du fichier importé. Toutes deux conservent les octets téléchargés pour les vues qui afficheront ensuite l'image : une image préchargée avant d'être affichée apparaît donc sans téléchargement.

Un usage courant consiste à dimensionner une image distante selon son rapport d'aspect :

```rust tabs
fn remote_image(url: &'static str) -> impl IntoElement {
    let ratio = signal(1.0_f32);
    spawn(async move {
        if let Ok(size) = image_size(url).await {
            ratio.set(size.width.0 as f32 / size.height.0 as f32);
        }
    });
    image(url).w_full().aspect_ratio(ratio)
}
```

```tsx tabs
function RemoteImage(props: { url: string }) {
  const ratio = signal(1);
  Image.getSize(props.url).then((s) => ratio.set(s.width / s.height));
  return <Image src={props.url} style={{ width: "100%", aspectRatio: ratio() }} />;
}
```

<a id="other-assets"></a>

## Autres ressources

| Fichier | Rust (`asset!`) | Import TSX | Page |
|---|---|---|---|
| `.ttf`, `.otf`, `.woff`, `.woff2` | Un `FontAsset` avec le nom de sa famille | Le nom de famille de la police | [Polices](./fonts.md) |
| `.json` et autres fichiers | Un `FileAsset` avec son URI | `.json` : la valeur analysée, intégrée au script | [Structure du projet](./project-structure.md#modules) |

Dans les deux cas, les polices sont enregistrées avant la première image affichée.

<a id="reading-a-file-at-run-time"></a>

### Lire un fichier à l'exécution

`fetch` lit un fichier livré avec l'application à partir de son URL `asset:/`, en TSX comme en Rust, sur toutes les plateformes. Une image importée porte son URL (`url`), les fichiers d'une crate Rust ont la leur grâce à `asset!` (`FileAsset::uri`) et `assets!()` :

```rust tabs
const GREETING: FileAsset = asset!("locales/en.txt");

#[component]
fn Greeting() -> impl IntoElement {
    let greeting = signal(String::new());
    spawn(async move {
        match fetch(GREETING.uri).await {
            Ok(response) => greeting.set(response.text()),
            Err(error) => greeting.set(error),
        }
    });
    text(move || greeting.get())
}
```

```tsx tabs
import flag from "./images/flag.png";

const bytes = await (await fetch(flag.url)).bytes();
```

Le moteur lit le fichier depuis les fichiers de l'application, hors de son thread (depuis le serveur de développement pendant `nsh run`), sans qu'aucune capability soit nécessaire : ce sont les fichiers propres à l'application. Une application web télécharge ce que la page n'a pas préchargé depuis l'endroit où elle sert ses ressources. La réponse est `200` avec les octets du fichier, son `Content-Length` et le `Content-Type` que donne son extension (`image/png`, `application/json`, ...), et son `url` est l'URL `asset:/` quelle que soit la manière dont le fichier est arrivé ; un fichier que l'application ne livre pas est rejeté par une erreur réseau qui le nomme. L'URL désigne le fichier par son chemin à l'intérieur des fichiers de l'application, et la requête le lit avec `GET` (ou `HEAD`) : une URL dont le chemin en sort (`..`, un chemin absolu) et une requête utilisant une autre méthode sont rejetées de la même façon, avant que quoi que ce soit ne soit lu ou téléchargé.

<a id="a-modules-own-url"></a>

### L'URL propre d'un module

En TSX, `import.meta.url` est l'URL du module dans lequel il est écrit, de sorte que `new URL("./data.json", import.meta.url)` désigne un fichier situé à côté. Les modules d'une application de bureau locale ou empaquetée ont des URL `file:` dans le répertoire de l'application, que `fs/promises` lit avec une autorisation `${pluginDir}` ; ceux d'une application web sont ceux de la page ; ceux d'une application mobile empaquetée sont des URL `asset:/` comme celles des images importées. Importez une image pour la livrer : une URL construite ainsi désigne le fichier, elle ne l'empaquette pas.

Les images bitmap se dessinent aussi sur un canvas avec `draw_image` / `drawImage` ([Canvas](./canvas.md)), et les dégradés remplacent de nombreuses images décoratives ([Styling](./styling.md#gradients)).

<a id="related"></a>

## Voir aussi

- [Élément image](../elements/image.md) : toutes les props, avec `getSize` et `prefetch`.
- [Listes](./lists.md) : les longues listes d'images recyclent leurs vues.
