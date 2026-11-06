---
title: "Imágenes y recursos"
description: "Cómo mostrar imágenes en Rust y TSX: los recursos de la aplicación y los archivos @2x, imágenes SVG, URLs remotas, modos de redimensionamiento, marcadores de posición, desenfoque, tinte, eventos de carga, y cómo leer el tamaño de una imagen o precargarla."
order: 36
group: ui
source_hash: 0ac8dbc4cc613a89
---


# Imágenes y recursos

El elemento de imagen (`image(..)` en Rust, `<Image>` en TSX) muestra un mapa de bits o un dibujo SVG: un archivo incluido con la app o una imagen descargada desde una URL. Las imágenes se leen y se decodifican fuera del hilo principal, se reducen al tamaño con el que las muestra la vista y se guardan en caché; el hilo principal solo muestra el resultado decodificado.

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

Las props del elemento se enumeran en [image](../elements/image.md).

<a id="images-in-the-app"></a>

## Imágenes en la app

Un crate de Rust guarda sus archivos en su directorio `assets/`: `asset!("logo@2x.png")` (la ruta relativa a `assets/`) es un `ImageAsset`, `{ url, size, scales }`, que se lee cuando el crate se compila, y `registry.assets(assets!())` en la función `#[native_module]` del crate incluye cada archivo del directorio con la app. En TSX, importa un archivo de imagen como un módulo: la importación da un `ImageAsset`, `{ url, size, scales? }`, y el bundler incluye el archivo con la app:

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

Archivos admitidos: `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.heic` y `.svg` ([imágenes SVG](#svg-images)).

**Los tamaños están en puntos.** Un sufijo `@2x` o `@3x` en el nombre del archivo indica que el archivo tiene 2 o 3 píxeles por punto, de modo que `logo@2x.png` de 128×128 píxeles es un recurso de 64×64 puntos. Sin sufijo, un píxel es un punto. Un archivo con sufijo en el nombre es el que se muestra; un archivo con nombre sin sufijo muestra sus [variantes de densidad de píxeles](#pixel-densities) cuando las tiene.

**Tamaño natural.** Una imagen de un recurso se maqueta con su tamaño natural cuando su estilo deja abierto el ancho o el alto, así que `image(LOGO)` y `<Image src={logo} />` no necesitan estilo. Define una dimensión y la relación de aspecto, o ambas, para darle otro tamaño.

En Rust, un archivo ausente o dañado hace fallar la compilación, y uno modificado vuelve a compilar el crate. En TSX, los recursos se resuelven de forma relativa al módulo que los importa, y su `url` es relativo a la raíz de la app (el directorio del punto de entrada). `nsh build` los copia a `out/assets/`, `nsh package` los coloca en la app y, durante el desarrollo, el servidor de desarrollo los sirve.

> [!TIP]
> En TSX, `src` también acepta cadenas `asset:/path`, y los archivos importados son los que se garantiza que se incluyen. Una ruta que nunca se importa funciona con el servidor de desarrollo, que sirve todo el directorio de la app, pero falta en las apps empaquetadas. Importa cada imagen que uses. Un crate de Rust incluye todo su directorio `assets/` mediante `assets!()`.

<a id="pixel-densities"></a>

### Densidades de píxeles

Nombra el archivo sin sufijo y coloca sus versiones más densas a su lado, y la app carga la que se ajusta a la pantalla:

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

- `asset!` y el bundler buscan archivos hermanos `@1.5x`, `@2x`, `@3x` y `@4x` de una imagen con nombre sin sufijo. `scales` los enumera, con 1 para el archivo nombrado; una imagen sin hermanos no tiene escalas (en TSX se importa como `{ url, size }`). El bundler incluye los hermanos que encuentra, y `assets!()` incluye todo el directorio.
- La imagen carga la escala más pequeña que sea al menos la relación de píxeles de la pantalla; si no existe, la mayor, como elige React Native: `logo.png` en una pantalla 1×, `logo@2x.png` en una 2×, `logo@3x.png` en un teléfono 3× (y a 2.625). En la web solo se descarga ese archivo.
- Cuando cambia la relación de píxeles (una ventana movida a otra pantalla, el zoom del navegador), las imágenes cuya elección cambia se cargan de nuevo, con sus [eventos de carga](#load-events). Su tamaño sigue siendo el del archivo nombrado, en puntos.
- Una variante cuyos píxeles no equivalen al tamaño del archivo nombrado multiplicado por su escala genera una advertencia de compilación en TSX y hace fallar la compilación en Rust.
- Un archivo con sufijo de densidad (`./logo@3x.png`, `asset!("logo@3x.png")`) es solo ese archivo.
- Una [imagen SVG](#svg-images) se dibuja para la pantalla con cualquier relación, así que no incluye variantes.

Un solo archivo también sirve: expórtalo a la densidad más alta que necesites (`@3x` para el resultado más nítido en cada teléfono) y nómbralo con su sufijo; las imágenes se reducen al tamaño de la pantalla al decodificarse. Las variantes permiten que cada pantalla descargue, decodifique y conserve el archivo que le corresponde.

<a id="svg-images"></a>

## Imágenes SVG

Importa un archivo `.svg` como cualquier imagen. Su tamaño en puntos es su `width` y `height` (o uno de ellos, con el otro obtenido de la relación de aspecto del `viewBox`), y si no, su `viewBox`: un píxel CSS del SVG es un punto, y los sufijos `@2x` dejan los archivos SVG tal cual.

```tsx
import logo from "./assets/logo.svg"; // <svg width="120" height="40" …>
import star from "./assets/star.svg"; // <svg viewBox="0 0 24 24" …>

logo; // { url: "asset:/assets/logo.svg", size: { width: 120, height: 40 } }

<Image src={logo} />
<Image src={star} style={{ width: 36, height: 36, tintColor: "#0969da" }} />
```

Un SVG es nítido al tamaño con el que se muestra. El navegador lo dibuja como vectores; iOS, macOS y Android lo dibujan al tamaño con el que lo muestra la vista, en píxeles, cuando se carga la imagen (igual que reducen los mapas de bits; una vista que crece después escala ese dibujo, hasta que la imagen se carga de nuevo); Windows, Linux y GPUI lo dibujan una vez a cuatro píxeles por punto (hasta 2048 píxeles por lado) y lo escalan a cada vista. Todo lo demás funciona como con los mapas de bits: `objectFit`, `tintColor` (a través de las formas opacas del SVG, de modo que los iconos de un solo color siguen el tema), filtros, `blurRadius`, marcadores de posición, los eventos de carga, `Image.getSize` y `Image.prefetch`. `onLoad` y `Image.getSize` informan el tamaño de un SVG en puntos enteros; la imagen se maqueta con su tamaño exacto. Los archivos SVG remotos se cargan del mismo modo, mediante las mismas descargas y comprobaciones de [capacidades](./sandbox-and-capabilities.md); NSH reconoce un SVG por su contenido (también comprimido con gzip, `.svgz`), sea cual sea la terminación de su URL.

**Qué dibujan las plataformas nativas.** iOS, macOS, Android, Windows, Linux y GPUI dibujan los SVG con un único renderizador (resvg), así que un dibujo se ve igual en cada una: formas y trazados, rellenos y contornos, degradados y patrones, trazados de recorte y máscaras, opacidad, filtros y transformaciones. El texto (`<text>`), la animación (SMIL y CSS), las imágenes incrustadas (`<image>`) y el HTML (`<foreignObject>`) se muestran en el navegador; las plataformas nativas dibujan el resto del SVG, de forma estática, y `nsh build` nombra los archivos que los usan. Exporta el texto como contornos (trazados) para obtener el mismo resultado en todas partes.

**Una imagen autocontenida.** En las plataformas nativas un SVG dibuja solo lo que contiene: se omiten los archivos, las URL, las imágenes `data:` y otros documentos a los que hace referencia. Las plataformas nativas dibujan los SVG, incluidos los remotos, dentro de límites que mantienen la memoria bajo control: un documento de hasta 16 MiB (uno comprimido, una vez descomprimido), un dibujo de hasta 8192 píxeles por lado y 4096 × 4096 píxeles en total (64 MiB; uno mayor se dibuja más pequeño) y capas (grupos con opacidad, máscaras, trazados de recorte y filtros, que el renderizador dibuja aparte) de hasta 256 MiB a la vez. Un SVG que supera el límite de documento o de capas no se carga, con `onError`.

**Tamaños informados en la web.** El navegador mide los SVG por sí mismo, importados o remotos: `onLoad` y `Image.getSize` informan el `width` y el `height` de un SVG cuando los tiene y, si no, el tamaño que le da el navegador, que normalmente se deriva de un valor por defecto de 300 × 150 y de la relación de aspecto del `viewBox`. Los SVG importados se maquetan con el tamaño del bundler en todas las plataformas. Da a los SVG un `width` y un `height` para obtener el mismo tamaño informado en todas partes.

<a id="remote-images"></a>

## Imágenes remotas

Dale al elemento una URL: una cadena en Rust (un closure para una que cambia), una cadena de URL en TSX:

```rust tabs
image(move || user.with(|u| u.avatar_url.clone()))
    .size(px(48.0))
    .rounded(px(24.0))
    .bg(rgb(0xeaeef2))
```

```tsx tabs
<Image src={user().avatarUrl} style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: "#eaeef2" }} />
```

- **Da un tamaño a las imágenes remotas.** Su tamaño se desconoce hasta que se cargan, así que sin ancho y alto (o uno de ellos y una relación de aspecto) colapsan a altura cero.
- **Un color de fondo** se muestra mientras la imagen se carga, o usa un marcador de posición (abajo).
- Las descargas se comparten: varias vistas que muestran la misma URL la descargan una sola vez, también cuando la decodifican a tamaños distintos. Una descarga que ya nadie espera se cancela.
- Las imágenes decodificadas se guardan en caché en memoria (la caché se purga bajo presión de memoria), con clave formada por la URL, el tamaño de decodificación y el radio de desenfoque.
- Cuando la app declara [capacidades](./sandbox-and-capabilities.md), el host de la imagen debe estar permitido en `network`; una imagen rechazada falla con su evento de error.

<a id="kept-on-disk"></a>

### Guardadas en disco

Las imágenes descargadas también se guardan en disco, tal como las envió el servidor, de modo que una app que se vuelve a abrir (una conversación llena de avatares y fotos, un feed) muestra las imágenes que mostró antes sin descargarlas, también sin conexión. La app no necesita ninguna configuración: toda imagen con una URL `http://` o `https://` pasa por la caché en iOS, Android, macOS, Windows, Linux y GPUI, y en el navegador la caché HTTP del propio navegador hace lo mismo.

La caché sigue las cabeceras de caché HTTP del servidor:

- Una imagen se conserva a menos que la respuesta diga `Cache-Control: no-store`.
- Se usa sin hacer una petición mientras está vigente: durante `max-age`, si no hasta `Expires`, si no durante una décima parte del tiempo transcurrido desde `Last-Modified` (como máximo una semana).
- Después se comprueba con el servidor (`If-None-Match` con su `ETag`, `If-Modified-Since` con su `Last-Modified`): una imagen sin cambios (`304`) se vuelve a usar sin descargarla, y una modificada la reemplaza.
- Cuando la petición falla (sin red) o el servidor devuelve un error (`5xx`), se muestra la copia guardada, a menos que la respuesta dijera `must-revalidate` o `no-cache`.

Cada app tiene su propia caché de 256 MiB; al superarla, se descartan primero las imágenes usadas hace más tiempo. Varias vistas, superficies y procesos de una misma app la comparten de forma segura. Las apps que incrustan el framework eligen dónde está y de qué tamaño, o la desactivan:

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

`CacheLocation::Off` (`.off`, `noDiskCache()`) no guarda nada en disco.

Por defecto la caché está en el directorio de caché del sistema: `Library/Caches/nsh` en iOS, `nsh` en el directorio de caché en Android, `~/Library/Caches` en macOS, `%LOCALAPPDATA%` en Windows y `$XDG_CACHE_HOME` (`~/.cache`) en Linux, con cada app en `<app id>/images` dentro de ellos. El sistema puede vaciar estos directorios cuando necesita espacio.

<a id="resize-modes"></a>

## Modos de redimensionado

El estilo `objectFit`, el `object-fit` de CSS (`.object_fit(..)` en Rust), decide cómo una imagen llena una caja de otra forma:

| Valor | Resultado |
|---|---|
| `"cover"` (`ResizeMode::Cover`, por defecto) | Llena la caja, manteniendo la relación de aspecto y recortando lo que sobresale |
| `"contain"` (`ResizeMode::Contain`) | Cabe dentro de la caja, manteniendo la relación de aspecto y dejando bandas vacías |
| `"fill"` (`ResizeMode::Stretch`) | Llena la caja exactamente, deformando la imagen |
| `"none"` (`ResizeMode::Center`) | Tamaño natural, colocada en `objectPosition` (centrada por defecto) |
| `"scale-down"` (`ResizeMode::ScaleDown`) | Tamaño natural, reducida para caber donde es mayor |

```rust tabs
image(photo).object_fit(ResizeMode::Contain).size(px(140.0)).bg(rgb(0xeaeef2))
```

```tsx tabs
<Image src={photo} style={{ width: 140, height: 140, objectFit: "contain", backgroundColor: "#eaeef2" }} />
```

Las clases de Tailwind `object-cover`, `object-contain`, `object-fill`, `object-none` y `object-scale-down` definen el mismo estilo.

<a id="image-position"></a>

### Posición de la imagen

El lugar donde la imagen ya dimensionada se sitúa dentro de su caja lo define el estilo `objectPosition` (`.object_position(..)` y `.object_top()`, ... en Rust), el `object-position` de CSS: el centro por defecto. Una imagen que cubre se recorta alrededor de esa posición, y una contenida se mueve dentro de sus bandas. Acepta palabras clave (`"top"`, `"left bottom"`), porcentajes y longitudes (`"25% 75%"`, `"10px 0"`) y bordes con desplazamientos (`"right 10px bottom 20%"`). Una foto alta en una burbuja de chat muestra así su parte superior:

```rust tabs
image(photo).object_fit(ResizeMode::Cover).object_top().w(px(220.0)).h(px(160.0)).rounded(px(16.0))
```

```tsx tabs
<Image src={photo} style={{ width: 220, height: 160, borderRadius: 16, objectPosition: "top" }} />
```

Las clases de Tailwind son las propias de Tailwind: `object-top`, `object-bottom`, `object-left`, `object-right`, `object-center`, `object-top-left`, `object-top-right`, `object-bottom-left`, `object-bottom-right` y valores arbitrarios (`object-[25%_75%]`).

<a id="styling-images"></a>

## Dar estilo a las imágenes

Las imágenes son vistas: admiten radios de esquina (también por esquina), bordes, sombras, opacidad y transformaciones. Las esquinas recortan la imagen.

```rust tabs
image(avatar).size(px(90.0)).rounded(px(45.0)).border(px(3.0)).border_color(rgb(0x8250df))
```

```tsx tabs
<Image src={avatar} style={{ width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: "#8250df" }} />
```

- **Tinte** (`.tint_color(..)` en Rust, el estilo `tintColor` en TSX) vuelve a colorear los píxeles opacos de la imagen: úsalo para iconos de un solo color que siguen el tema.
- **Filtros** (`.grayscale(..)`, `.sepia(..)`, `.blur(..)`; `filter` en TSX) se aplican a las imágenes en ambas plataformas ([Filtros](./styling.md#filters-and-blending)).

```rust tabs
image(ICON).size(px(24.0)).tint_color(AdaptiveColor::rgb(0x0969da, 0x58a6ff))
```

```tsx tabs
<Image src={icon} style={{ width: 24, height: 24, tintColor: active() ? "#0969da" : "#6e7781" }} />
```

<a id="placeholders-fading-and-blur"></a>

## Marcadores de posición, fundido y desenfoque

| Prop | Rust | Descripción |
|---|---|---|
| `placeholder` | `.placeholder(..)` | Una imagen que se muestra hasta que `src` se ha cargado, una URL o un recurso; mejor un recurso local |
| `fadeDuration` | `.fade_duration(ms)` | Milisegundos durante los que la imagen cargada aparece con un fundido. Por defecto 0 en iOS, 300 en Android |
| `blurRadius` | `.blur_radius(px(..))` | Desenfoca la imagen con este radio en puntos, aplicado una vez al decodificar |

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

## Imágenes animadas

Los archivos GIF, WebP y APNG animados se reproducen automáticamente, como recursos o desde URL. Admiten los mismos estilos, `objectFit` incluido; una imagen animada con tinte muestra su primer fotograma en iOS.

<a id="load-events"></a>

## Eventos de carga

| Evento | Rust | Payload | Cuándo |
|---|---|---|---|
| `onLoadStart` | `.on_load_start(..)` | | Empieza la carga |
| `onProgress` | `.on_progress(..)` | `{ loaded, total }` en bytes (`total` 0 cuando se desconoce) | Durante una descarga, como máximo cada 100 ms |
| `onLoad` | `.on_load(..)` | `{ size }` | La imagen está lista; el tamaño de la fuente en píxeles (el de un SVG en puntos, [en la web tal como lo mide el navegador](#svg-images)) |
| `onError` | `.on_error(..)` | `{ message }` (un `&str` en Rust) | Falló la carga o la decodificación |
| `onLoadEnd` | `.on_load_end(..)` | | Después de `onLoad` o `onError` |

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

El evento de carga informa el tamaño de la imagen de origen, no el tamaño al que se decodificó.

Una imagen con [variantes de densidad de píxeles](#pixel-densities) carga uno de sus archivos, y el evento de carga informa los píxeles de ese archivo: 192×192 para `logo@3x.png` en una pantalla 3×, mientras que `Image.getSize(logo)` se resuelve con los 64×64 del archivo importado. Cuando cambia la relación de píxeles y la imagen carga otra variante, esa carga también informa sus eventos: `onLoadStart`, luego `onLoad` con el tamaño del nuevo archivo (o `onError`), y después `onLoadEnd`.
<a id="an-images-size-and-prefetching"></a>

## Tamaño de una imagen y precarga

Las imágenes que no están en pantalla pueden medirse y cargarse con antelación: `image_size(..)` y `prefetch_image(..)` en Rust, `Image.getSize` y `Image.prefetch` (en el mismo `Image` que renderiza el elemento) en TSX:

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

| Rust | TSX | Devuelve |
|---|---|---|
| `image_size(src)` | `Image.getSize(src)` | El tamaño de la imagen en píxeles (el de un SVG en puntos, [en la web tal como lo mide el navegador](#svg-images)); un error cuando no se puede cargar |
| `prefetch_image(src)` | `Image.prefetch(src)` | Nada, una vez cargados los bytes de la imagen; un error cuando no se puede cargar |

En TSX, `src` es una cadena de URL o una imagen importada. Para una imagen importada con [variantes](#pixel-densities), ambas cargan la variante que las vistas cargan en esta pantalla, y `getSize` da el tamaño del archivo importado. Ambas conservan los bytes descargados para las vistas que muestren la imagen a continuación, de modo que una imagen precargada antes de mostrarse aparece sin descarga.

Un uso habitual es dimensionar una imagen remota según su relación de aspecto:

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

## Otros recursos

| Archivo | Rust (`asset!`) | Importación en TSX | Página |
|---|---|---|---|
| `.ttf`, `.otf`, `.woff`, `.woff2` | Un `FontAsset` con el nombre de su familia | El nombre de la familia de la fuente | [Fuentes](./fonts.md) |
| `.json` y otros archivos | Un `FileAsset` con su URI | `.json`: el valor analizado, incluido en el script | [Estructura del proyecto](./project-structure.md#modules) |

En ambos casos, las fuentes se registran antes del primer fotograma.

<a id="reading-a-file-at-run-time"></a>

### Leer un archivo en tiempo de ejecución

`fetch` lee un archivo que la app distribuye mediante su URL `asset:/`, tanto en TSX como en Rust, en todas las plataformas. Una imagen importada lleva su URL (`url`), y los archivos de un crate de Rust tienen la suya a partir de `asset!` (`FileAsset::uri`) y `assets!()`:

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

El motor lee el archivo de los archivos de la app fuera de su hilo (desde el servidor de desarrollo durante `nsh run`), sin necesidad de ninguna capacidad: son los archivos propios de la app. Una app web descarga lo que la página no precargó desde donde sirve sus recursos. La respuesta es `200` con los bytes del archivo, su `Content-Length` y el `Content-Type` que le corresponde según su extensión (`image/png`, `application/json`, ...), y su `url` es la URL `asset:/` sin importar cómo llegó el archivo; un archivo que la app no distribuye se rechaza con un error de red que lo nombra. La URL nombra el archivo por su ruta dentro de los archivos de la app, y la solicitud lo lee con `GET` (o `HEAD`): una URL cuya ruta sale de ellos (`..`, una ruta absoluta) y una solicitud con otro método se rechazan del mismo modo, antes de leer o descargar nada.

<a id="a-modules-own-url"></a>

### La URL propia de un módulo

En TSX, `import.meta.url` es la URL del módulo en el que está escrito, de modo que `new URL("./data.json", import.meta.url)` nombra un archivo contiguo. Los módulos de una app de escritorio local o empaquetada tienen URL `file:` en el directorio de la app, que `fs/promises` lee bajo un permiso `${pluginDir}`; los de una app web son los de la página; los de una app móvil empaquetada son URL `asset:/` como las de las imágenes importadas. Importa una imagen para distribuirla: una URL construida de este modo nombra el archivo, pero no lo empaqueta.

Las imágenes de mapa de bits también se dibujan en un canvas con `draw_image` / `drawImage` ([Canvas](./canvas.md)), y los degradados sustituyen a muchas imágenes decorativas ([Estilos](./styling.md#gradients)).

<a id="related"></a>

## Relacionado

- [Elemento image](../elements/image.md): todas las props, con `getSize` y `prefetch`.
- [Listas](./lists.md): las listas largas de imágenes reciclan sus vistas.
