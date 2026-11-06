---
title: "Image"
description: "El elemento que muestra una imagen incluida en el paquete o remota, con marcadores de posición, desenfoque, transiciones de fundido, tintado y eventos de carga."
order: 30
group: primitives
demo: el-image
source_hash: df0573015c43b823
---


# Image

`Image` muestra una imagen de los assets de la app o de una URL. Las imágenes se descargan y se decodifican fuera del hilo principal, se reducen al tamaño con el que la vista las muestra y se almacenan en caché en memoria. Las imágenes animadas GIF, WebP y APNG se reproducen. Rust crea una con `image(src)`, TSX con `<Image>` desde `nsh`.

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

Un asset conoce su tamaño: sin ancho ni alto, la imagen lo toma de él, y con uno de los dos el otro se deduce de la relación de aspecto del asset. El tamaño de una URL se conoce una vez que carga, así que da a las imágenes remotas un ancho y un alto (o una relación de aspecto junto con uno de ellos).

<a id="sources"></a>

## Fuentes

La fuente (`src` y `placeholder`; `image(..)` y `.placeholder(..)` en Rust) acepta:

| Valor | Ejemplo | Descripción |
|---|---|---|
| Un asset | Rust `asset!("logo.png")`, TSX `import logo from "./logo.png"` | Un `ImageAsset` `{ url, size, scales? }`, con tamaño en puntos: un archivo `@2x` cuenta la mitad de sus píxeles. Con `logo@2x.png` / `logo@3x.png` junto a `logo.png`, se carga la variante correspondiente a la densidad de píxeles de la pantalla ([densidades de píxeles](../docs/images-and-assets.md#pixel-densities)). Se pueden importar `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp` y `.heic`, y también `.svg`, con el tamaño dado por su `width` y `height` o `viewBox` ([imágenes SVG](../docs/images-and-assets.md#svg-images)). |
| Una URL | `"https://example.com/a.jpg"` | Se descarga y se almacena en caché. Las descargas de la misma URL se comparten entre vistas. |
| Una ruta de asset | `"asset:/images/a.png"` | Un archivo de los assets de la app. |
| Un URI `data:` | `"data:image/png;base64,iVBOR…"` | Bytes en el URI, en base64 o con codificación porcentual (`data:image/svg+xml,%3Csvg…`). |
| Una URL `blob:` | `URL.createObjectURL(blob)` | Los bytes de un `Blob` o `File` (TSX). La imagen los conserva: revocar la URL deja una imagen que se muestra completa. |

Una imagen creada a partir de bytes que la app ya tiene se muestra sin hacer una petición. Un chat muestra una foto elegida desde su blob mientras se sube, y después cambia `src` a la URL de la foto:

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

Los bytes iguales son una sola imagen: la misma imagen como URI `data:` y como blob se decodifica una vez y comparte la caché.

Durante el desarrollo, los assets los sirve el servidor de desarrollo; `nsh build` y `nsh package` los copian en la app (un crate de Rust incluye su directorio `assets/` con `registry.assets(assets!())`). Consulta [imágenes y assets](../docs/images-and-assets.md).

> [!NOTE]
> Cuando la app declara [capabilities](../docs/sandbox-and-capabilities.md), las imágenes remotas se cargan desde los hosts que esta lista; una imagen de cualquier otro host no se solicita y falla con `onError`, cuyo `code` es `"ERR_ACCESS_DENIED"`. Los URIs `asset:`, los URIs `data:` y las URLs `blob:` siempre se cargan.

## Props

Además de las [props comunes](./index.md#common-props) (con `style` tipado como `ImageStyle`):

| Prop | Rust | Tipo | Valor por defecto | Descripción |
|---|---|---|---|---|
| `src` | `image(src)` | `string \| ImageAsset` | | La imagen. |
| `placeholder` | `.placeholder(src)` | `string \| ImageAsset` | | Se muestra hasta que `src` se haya cargado; lo mejor es un asset local. |
| `blurRadius` | `.blur_radius(px(..))` | `number` | | Desenfoca la imagen con este radio en puntos (se aplica una sola vez durante la decodificación, fuera del hilo principal). |
| `fadeDuration` | `.fade_duration(ms)` | `number` | iOS `0`, Android `300` | Cuánto dura, en milisegundos, el fundido de entrada de una imagen cargada. |
| `tintColor` (estilo) | `.tint_color(..)` | `ColorValue` | | Cambia el color de una imagen de plantilla (un icono dibujado en un solo color). |
| `objectFit` (estilo) | `.object_fit(ResizeMode::Contain)` | `"cover" \| "contain" \| "fill" \| "none" \| "scale-down"` | `"cover"` | Cómo se ajusta la imagen a su caja, como el `object-fit` de CSS (clases `object-*`): `"cover"` la llena y recorta, `"contain"` la ajusta dentro, `"fill"` la estira, `"none"` la muestra a su tamaño natural, `"scale-down"` lo mismo, reducida para caber donde es más grande. |
| `objectPosition` (estilo) | `.object_position(..)`, `.object_top()`, ... | `string` | `"center"` | Dónde se sitúa la imagen en su caja una vez que `objectFit` la ha dimensionado, como el `object-position` de CSS (`"top"`, `"25% 75%"`, `"right 10px bottom 20%"`); una imagen que cubre se recorta alrededor de ese punto. |
| `onLoadStart` | `.on_load_start(..)` | `() => void` | | Comenzó la carga. |
| `onProgress` | `.on_progress(..)` | `(e: { loaded: number; total: number }) => void` | | Progreso de la descarga en bytes (`total` es 0 cuando se desconoce), como máximo cada 100 ms. |
| `onLoad` | `.on_load(..)` | `(e: { size: PixelSize }) => void` | | Cargada; el tamaño de la imagen original en píxeles (no el de la decodificada y reducida; el tamaño de un SVG en puntos, [en la web tal como lo mide el navegador](../docs/images-and-assets.md#svg-images)); para una imagen con variantes, el de la variante cargada. |
| `onError` | `.on_error(..)` | `(e: { message: string; code?: string }) => void` | | La carga falló; `code` es `"ERR_ACCESS_DENIED"` para una URL que las capabilities de la app no permiten. |
| `onLoadEnd` | `.on_load_end(..)` | `() => void` | | Después de `onLoad` o `onError`. |

`ImageStyle` añade `tintColor` a los estilos de la vista, que cambia el color de una imagen de plantilla (un icono dibujado en un solo color), y `objectPosition`, que sitúa la imagen en su caja ([Posición de la imagen](../docs/images-and-assets.md#image-position)).

```rust tabs
image(ICON).size(px(24.0)).tint_color(rgb(0x0969da))
```

```tsx tabs
<Image src={icon} style={{ width: 24, height: 24, tintColor: "#0969da" }} />
```

<a id="events"></a>

## Eventos

| Evento | Rust | Payload | Cuándo |
|---|---|---|---|
| `onLoadStart` | `.on_load_start` | ninguno | Comenzó la carga. |
| `onProgress` | `.on_progress` | `{ loaded, total }` (`ImageProgress`) | Llegaron bytes (como máximo cada 100 ms). |
| `onLoad` | `.on_load` | `{ size }` (`Size<DevicePixels>`) | La imagen se muestra; su tamaño original en píxeles (el de un SVG en puntos, [en la web tal como lo mide el navegador](../docs/images-and-assets.md#svg-images)). |
| `onError` | `.on_error` | `{ message, code? }` (`&str`, el mensaje) | La carga o la decodificación falló, o el host queda fuera de las capabilities de la app (`code` `"ERR_ACCESS_DENIED"`). |
| `onLoadEnd` | `.on_load_end` | ninguno | Después de `onLoad` o `onError`. |

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

Una imagen con [variantes de densidad de píxeles](../docs/images-and-assets.md#pixel-densities) carga uno de sus archivos, y `onLoad` informa de los píxeles de ese archivo: 192×192 para `logo@3x.png` en una pantalla 3×, para un `logo.png` de 64×64 puntos. Cuando la densidad de píxeles cambia y la imagen carga otra variante, también informa de esa carga: `onLoadStart`, luego `onLoad` con el tamaño del nuevo archivo (o `onError`), y después `onLoadEnd`.

Para conocer el tamaño de una imagen o cargarla antes de mostrarla, TSX llama a `Image.getSize(src)` y `Image.prefetch(src)` (el mismo `Image` que renderiza el elemento los incluye; consulta la [API de Image](../modules/nsh-image.md)), y Rust usa `image_size(src)` y `prefetch_image(src)`, con await en una tarea. Dada una imagen importada con variantes, `Image.getSize` y `Image.prefetch` cargan la variante que muestra esta pantalla, y `getSize` devuelve el tamaño del archivo importado (64×64 para `logo.png`).

<a id="ref-methods"></a>

## Métodos de ref

Ninguno propio.

<a id="platform-notes"></a>

## Notas de plataforma

- La clave de la caché incluye el tamaño de decodificación y el radio de desenfoque: la misma URL mostrada en dos tamaños se decodifica dos veces, pero se descarga una sola.
- iOS reproduce las imágenes animadas como una animación de fotogramas clave (hasta 600 fotogramas); una imagen animada con tinte muestra su primer fotograma.
- Android reproduce las imágenes animadas desde la API 28 (`AnimatedImageDrawable`), sin caché y sin desenfoque.
- En Android los bordes se dibujan por encima de la imagen, igual que en iOS.
