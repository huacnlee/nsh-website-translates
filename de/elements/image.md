---
title: "Image"
description: "Das Element, das ein gebündeltes oder entferntes Bild anzeigt, mit Platzhaltern, Unschärfe, Überblendungen, Einfärbung und Ladeereignissen."
order: 30
group: primitives
demo: el-image
source_hash: df0573015c43b823
---


# Image

`Image` zeigt ein Bild aus den Assets der App oder von einer URL. Bilder werden außerhalb des Main-Threads heruntergeladen und dekodiert, auf die Größe heruntergerechnet, in der die View sie anzeigt, und im Speicher gecacht. Animierte GIF-, WebP- und APNG-Bilder werden abgespielt. In Rust erzeugt man eines mit `image(src)`, in TSX mit `<Image>` aus `nsh`.

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

Ein Asset kennt seine Größe: Ohne Breite oder Höhe übernimmt das Bild sie, und wird nur eines von beiden angegeben, ergibt sich das andere aus dem Seitenverhältnis des Assets. Die Größe einer URL ist erst nach dem Laden bekannt, daher sollten Remote-Bilder eine Breite und eine Höhe erhalten (oder ein Seitenverhältnis zusammen mit einem von beiden).

<a id="sources"></a>

## Quellen

Die Quelle (`src` und `placeholder`; `image(..)` und `.placeholder(..)` in Rust) akzeptiert:

| Wert | Beispiel | Beschreibung |
|---|---|---|
| Ein Asset | Rust `asset!("logo.png")`, TSX `import logo from "./logo.png"` | Ein `ImageAsset` `{ url, size, scales? }`, in Punkten bemessen: Eine `@2x`-Datei zählt die Hälfte ihrer Pixel. Liegen `logo@2x.png` / `logo@3x.png` neben `logo.png`, wird die Variante für das Pixelverhältnis des Bildschirms geladen ([Pixeldichten](../docs/images-and-assets.md#pixel-densities)). `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp` und `.heic` können importiert werden, ebenso `.svg`, dessen Größe sich aus `width` und `height` oder `viewBox` ergibt ([SVG-Bilder](../docs/images-and-assets.md#svg-images)). |
| Eine URL | `"https://example.com/a.jpg"` | Wird heruntergeladen und gecacht. Downloads derselben URL werden zwischen Views geteilt. |
| Ein Asset-Pfad | `"asset:/images/a.png"` | Eine Datei aus den Assets der App. |
| Ein `data:`-URI | `"data:image/png;base64,iVBOR…"` | Bytes im URI, base64- oder prozentkodiert (`data:image/svg+xml,%3Csvg…`). |
| Eine `blob:`-URL | `URL.createObjectURL(blob)` | Die Bytes eines `Blob` oder `File` (TSX). Das Bild behält sie: Wird die URL widerrufen, zeigt das Bild sich weiterhin vollständig. |

Ein Bild aus Bytes, die die App bereits hat, wird ohne Anfrage angezeigt. Ein Chat zeigt ein ausgewähltes Foto aus seinem Blob an, während es hochgeladen wird, und stellt dann `src` auf die URL des Fotos um:

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

Gleiche Bytes sind ein Bild: Dasselbe Bild als `data:`-URI und als Blob wird nur einmal dekodiert und teilt sich den Cache.

Während der Entwicklung werden Assets vom Dev-Server ausgeliefert; `nsh build` und `nsh package` kopieren sie in die App (ein Rust-Crate liefert sein `assets/`-Verzeichnis mit `registry.assets(assets!())` aus). Siehe
[Bilder und Assets](../docs/images-and-assets.md).

> [!NOTE]
> Deklariert die App [Capabilities](../docs/sandbox-and-capabilities.md), werden Remote-Bilder von den dort aufgeführten Hosts geladen; ein Bild von einem anderen Host wird nicht angefragt und schlägt mit `onError` fehl, dessen `code` `"ERR_ACCESS_DENIED"` ist. `asset:`-URIs, `data:`-URIs und `blob:`-URLs werden immer geladen.

## Props

Neben den [allgemeinen Props](./index.md#common-props) (mit `style` als `ImageStyle` typisiert):

| Prop | Rust | Typ | Standard | Beschreibung |
|---|---|---|---|---|
| `src` | `image(src)` | `string \| ImageAsset` | | Das Bild. |
| `placeholder` | `.placeholder(src)` | `string \| ImageAsset` | | Wird angezeigt, bis `src` geladen ist; am besten ein lokales Asset. |
| `blurRadius` | `.blur_radius(px(..))` | `number` | | Weichzeichnet das Bild mit diesem Radius in Punkten (einmal beim Dekodieren angewendet, außerhalb des Main-Threads). |
| `fadeDuration` | `.fade_duration(ms)` | `number` | iOS `0`, Android `300` | Wie lange ein geladenes Bild eingeblendet wird, in Millisekunden. |
| `tintColor` (Style) | `.tint_color(..)` | `ColorValue` | | Färbt ein Template-Bild um (ein Icon in einer Farbe). |
| `objectFit` (Style) | `.object_fit(ResizeMode::Contain)` | `"cover" \| "contain" \| "fill" \| "none" \| "scale-down"` | `"cover"` | Wie das Bild in seine Box passt, wie CSS' `object-fit` (`object-*`-Klassen): `"cover"` füllt sie und beschneidet, `"contain"` passt hinein, `"fill"` streckt, `"none"` zeigt es in natürlicher Größe, `"scale-down"` ebenso, aber verkleinert, wo es größer ist. |
| `objectPosition` (Style) | `.object_position(..)`, `.object_top()`, ... | `string` | `"center"` | Wo das Bild in seiner Box sitzt, nachdem `objectFit` es dimensioniert hat, wie CSS' `object-position` (`"top"`, `"25% 75%"`, `"right 10px bottom 20%"`); ein füllendes Bild wird um diese Stelle herum beschnitten. |
| `onLoadStart` | `.on_load_start(..)` | `() => void` | | Der Ladevorgang hat begonnen. |
| `onProgress` | `.on_progress(..)` | `(e: { loaded: number; total: number }) => void` | | Download-Fortschritt in Bytes (`total` ist 0, wenn unbekannt), höchstens alle 100 ms. |
| `onLoad` | `.on_load(..)` | `(e: { size: PixelSize }) => void` | | Geladen; die Größe des Quellbilds in Pixeln (nicht des dekodierten, heruntergerechneten; bei einer SVG die Größe in Punkten, [im Web so, wie der Browser sie misst](../docs/images-and-assets.md#svg-images)); bei einem Bild mit Varianten die der geladenen Variante. |
| `onError` | `.on_error(..)` | `(e: { message: string; code?: string }) => void` | | Laden fehlgeschlagen; `code` ist `"ERR_ACCESS_DENIED"` bei einer URL, die die Capabilities der App nicht erlauben. |
| `onLoadEnd` | `.on_load_end(..)` | `() => void` | | Nach `onLoad` oder `onError`. |

`ImageStyle` ergänzt die View-Styles um `tintColor`, das ein Template-Bild umfärbt (ein Icon in einer Farbe), und um `objectPosition`, das das Bild in seiner Box platziert ([Bildposition](../docs/images-and-assets.md#image-position)).

```rust tabs
image(ICON).size(px(24.0)).tint_color(rgb(0x0969da))
```

```tsx tabs
<Image src={icon} style={{ width: 24, height: 24, tintColor: "#0969da" }} />
```

## Events

| Event | Rust | Payload | Wann |
|---|---|---|---|
| `onLoadStart` | `.on_load_start` | keine | Der Ladevorgang hat begonnen. |
| `onProgress` | `.on_progress` | `{ loaded, total }` (`ImageProgress`) | Es sind Bytes angekommen (höchstens alle 100 ms). |
| `onLoad` | `.on_load` | `{ size }` (`Size<DevicePixels>`) | Das Bild wird angezeigt; seine Quellgröße in Pixeln (bei einer SVG in Punkten, [im Web so, wie der Browser sie misst](../docs/images-and-assets.md#svg-images)). |
| `onError` | `.on_error` | `{ message, code? }` (`&str`, die Meldung) | Laden oder Dekodieren ist fehlgeschlagen, oder der Host liegt außerhalb der Capabilities der App (`code` `"ERR_ACCESS_DENIED"`). |
| `onLoadEnd` | `.on_load_end` | keine | Nach `onLoad` oder `onError`. |

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

Ein Bild mit [Pixeldichte-Varianten](../docs/images-and-assets.md#pixel-densities) lädt eine seiner Dateien, und `onLoad` meldet die Pixel dieser Datei: 192×192 für `logo@3x.png` auf einem 3×-Bildschirm, bei einem `logo.png` mit 64×64 Punkten. Ändert sich das Pixelverhältnis und lädt das Bild eine andere Variante, meldet es auch dieses Laden: `onLoadStart`, dann `onLoad` mit der Größe der neuen Datei (oder `onError`), dann `onLoadEnd`.

Um die Größe eines Bildes zu erfahren oder es vor dem Anzeigen zu laden, ruft TSX `Image.getSize(src)` und `Image.prefetch(src)` auf (dasselbe `Image`, das das Element rendert, trägt sie; siehe die [Image API](../modules/nsh-image.md)), und Rust `image_size(src)` und `prefetch_image(src)`, mit await in einem Task. Bei einem importierten Bild mit Varianten laden `Image.getSize` und `Image.prefetch` die Variante, die dieser Bildschirm zeigt, und `getSize` liefert die Größe der importierten Datei (64×64 für `logo.png`).

<a id="ref-methods"></a>

## Ref-Methoden

Keine eigenen.

<a id="platform-notes"></a>

## Plattformhinweise

- Der Cache-Schlüssel enthält die Dekodiergröße und den Weichzeichnungsradius: Dieselbe URL, in zwei Größen angezeigt, wird zweimal dekodiert, aber nur einmal heruntergeladen.
- iOS spielt animierte Bilder als Keyframe-Animation ab (bis zu 600 Frames); ein eingefärbtes animiertes Bild zeigt seinen ersten Frame.
- Android spielt animierte Bilder ab API 28 ab (`AnimatedImageDrawable`), ungecacht und ohne Weichzeichnung.
- Unter Android werden Rahmen über dem Bild gezeichnet, wie unter iOS.
