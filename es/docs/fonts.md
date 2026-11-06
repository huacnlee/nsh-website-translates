---
title: "Fuentes"
description: "La fuente del sistema y las familias genéricas, las listas de fuentes de respaldo, la distribución de archivos .ttf, .otf, .woff y .woff2 desde los assets de un crate de Rust o mediante importaciones TSX, familias con varios pesos y cursivas, y fuentes en estilos tipados y clases de Tailwind."
order: 37
group: ui
source_hash: 9fd911f01604c8c3
---


# Fuentes

Text usa la fuente del sistema (San Francisco en iOS, Roboto en Android) salvo que una familia de fuentes indique otra cosa (`.font_family(..)` en Rust, `fontFamily` en TSX). Una familia puede ser una familia genérica, una fuente instalada en el dispositivo o un archivo de fuente que se incluye con la app.

<a id="system-and-generic-families"></a>

## Familias del sistema y genéricas

| `fontFamily` | Fuente |
|---|---|
| (ninguna), `"system-ui"`, `"sans-serif"`, `"ui-sans-serif"`, `"-apple-system"` | La fuente del sistema |
| `"serif"`, `"ui-serif"` | La fuente serif del sistema (New York en iOS, Noto Serif en Android) |
| `"monospace"`, `"ui-monospace"` | La fuente monoespaciada del sistema (SF Mono en iOS) |
| `"ui-rounded"` | La fuente redondeada del sistema (SF Pro Rounded), solo en iOS |

La fuente del sistema admite todos los pesos del 100 al 900. Las clases `font-sans`, `font-serif` y `font-mono` de Tailwind corresponden a las tres primeras filas, y `font-sans` y `font-mono` a las fuentes del tema cuando este las define ([Una fuente predeterminada para la app](#a-default-font-for-the-app)).

Una familia instalada en el dispositivo se puede nombrar directamente (`"Georgia"`, `"Avenir Next"` en iOS). Las fuentes instaladas difieren entre plataformas y versiones, así que incluye con la app las fuentes de las que dependa tu diseño. En iOS, una familia que no existe recurre a la fuente del sistema y registra una advertencia en el log (`font family 'X' is not available`); indica una lista para elegir qué se usa en su lugar ([Listas de fuentes alternativas](#fallback-lists)).

<a id="shipping-a-font"></a>

## Incluir una fuente en la app

Un crate de Rust incluye los archivos de su directorio `assets/`: `registry.assets(assets!())` en su función `#[native_module]` los incluye todos, y `asset!("fonts/Pacifico-Regular.ttf")` es un `FontAsset` cuyo `family` es el nombre de familia de la fuente, leído del archivo cuando se compila el crate. En TSX, importa un archivo `.ttf`, `.otf`, `.woff` o `.woff2`: la importación se evalúa como el nombre de familia de la fuente. En ambos casos la fuente se registra antes del primer fotograma, de modo que está lista cuando el texto se renderiza por primera vez. Los archivos WOFF y WOFF2 son fuentes TrueType u OpenType comprimidas (un archivo WOFF2 suele pesar la mitad que su equivalente TrueType, un ahorro tanto en el paquete de la app como en las descargas de la web): NSH los lee como las fuentes que contienen, en todas las plataformas:

```rust tabs
use nsh_core::{element::FontAsset, prelude::*};

const PACIFICO: FontAsset = asset!("fonts/Pacifico-Regular.ttf");

#[native_module("app/native")]
fn native(registry: &mut Registry) {
    registry.assets(assets!());
}

text("Custom fonts").font_family(PACIFICO.family).text_size(px(30.0))
```

```tsx tabs
import { Text } from "nsh";
import Pacifico from "./fonts/Pacifico-Regular.ttf";

<Text style={{ fontFamily: Pacifico, fontSize: 30 }}>Custom fonts</Text>
```

`PACIFICO.family` y la importación de TSX `Pacifico` son la cadena `"Pacifico"`: el nombre de familia almacenado en el archivo de la fuente (su nombre de familia tipográfico o, en su defecto, su nombre de familia), no el nombre del archivo. Usar el valor del recurso en lugar de escribir el nombre a mano mantiene ambos sincronizados; un archivo ausente o dañado hace fallar la compilación de Rust, y un archivo importado queda incluido con seguridad en el paquete.

Los archivos se incluyen con la app como cualquier otro [recurso](./images-and-assets.md). Las fuentes se registran solo para el proceso de la app; no se instalan en el dispositivo.

> [!WARNING]
> En TSX, una importación cuyo valor nunca se usa es eliminada por la elisión de importaciones de TypeScript, y con ella la fuente. Si solo te refieres a una familia por su nombre (por ejemplo, en el tema de Tailwind), importa el archivo por su efecto secundario: `import "./fonts/Inter-Bold.ttf";`. Un crate de Rust incluye todos los archivos de `assets/` mediante `assets!()`.

<a id="fallback-lists"></a>

## Listas de fuentes alternativas

`fontFamily` admite una lista, como CSS: familias separadas por comas, la preferida primero, con el nombre entre comillas o sin ellas si contiene espacios (`"Brand, 'Noto Sans SC', sans-serif"`), y un nombre entre comillas conserva sus comas (`'ACME, Inc'`). El texto se compone con la primera familia que tenga la plataforma, y un carácter que esa familia no tenga (otro sistema de escritura, un símbolo) se toma de la siguiente familia de la lista que lo tenga y, después, de las fuentes alternativas del sistema. Una lista permite que una fuente de marca que solo cubre el alfabeto latino muestre el chino con una fuente a juego, o indicar una fuente que la app descarga junto con una fuente del sistema que se muestre hasta que llegue:

```rust tabs
text("Brand 品牌").font_family("Brand, 'Noto Sans SC', sans-serif")
```

```tsx tabs
<Text style={{ fontFamily: "Brand, 'Noto Sans SC', sans-serif" }}>Brand 品牌</Text>
```

Cada plataforma conserva el orden de la lista con su propia maquinaria de fuentes: una lista en cascada en iOS y macOS, una alternativa de fuentes en Windows (una por párrafo: la lista de su primer estilo), una lista de familias de Pango en Linux, la del navegador en la web y las alternativas de GPUI. En Android, el texto se compone con la primera familia que tenga; cuando esa es una fuente que registra la app, las fuentes registradas que la siguen en la lista son sus alternativas (Android 10 y posteriores).

<a id="weights-and-italics"></a>

## Pesos y cursivas

Una familia suele venir en varios archivos, uno por cada peso y estilo. Incluye cada uno (colócalos en `assets/` en Rust, impórtalos uno a uno en TSX); se registran con el mismo nombre de familia, y el peso y el estilo eligen la variante:

```rust tabs
// assets/fonts: Inter-Regular.ttf, Inter-Medium.ttf, Inter-Bold.ttf, Inter-Italic.ttf
const INTER: FontAsset = asset!("fonts/Inter-Regular.ttf");

text("Regular, ")
    .font_family(INTER.family)
    .text_size(px(16.0))
    .child(text("medium").font_weight(FontWeight::MEDIUM))
    .child(", ")
    .child(text("bold").font_weight(FontWeight::BOLD))
    .child(" and ")
    .child(text("italic").italic())
    .child(".")
```

```tsx tabs
import { Text } from "nsh";
import Inter from "./fonts/Inter-Regular.ttf";
import "./fonts/Inter-Medium.ttf";
import "./fonts/Inter-Bold.ttf";
import "./fonts/Inter-Italic.ttf";

const body = { fontFamily: Inter, fontSize: 16 } as const;

<Text style={body}>
  Regular, <Text style={{ fontWeight: "500" }}>medium</Text>, <Text style={{ fontWeight: "bold" }}>bold</Text> and{" "}
  <Text style={{ fontStyle: "italic" }}>italic</Text>.
</Text>
```

Cuando ninguna variante registrada tiene exactamente el peso solicitado, se usa la más cercana. Las plataformas se comportan de forma distinta cuando falta una variante:

| | iOS | Android |
|---|---|---|
| Peso sin variante | La variante registrada más cercana | La variante más cercana, con la negrita sintética de Android donde corresponda |
| Cursiva sin variante cursiva | La variante vertical (sin inclinar) | Una versión inclinada de la variante vertical |

Incluye las variantes que uses para obtener el mismo resultado en ambas.

<a id="fonts-in-typed-styles-and-tailwind-classes"></a>

## Fuentes en estilos tipados y clases de Tailwind

En Rust, `.font_family(..)` acepta la familia del recurso dondequiera que vaya un estilo, y los métodos de peso (`.font_weight(FontWeight::SEMIBOLD)`) seleccionan las variantes. Para las clases, nombra tus familias en el tema de Tailwind en `nsh.json` para usarlas como clases `font-*`:

```json
{
  "tailwind": {
    "fontFamily": { "display": "Pacifico", "body": "Inter" }
  }
}
```

```rust tabs
use nsh_core::element::palette::VIOLET;

text("Custom fonts").font_family(PACIFICO.family).text_3xl().text_color(VIOLET.shade(600))
text("Bold Inter").font_family(INTER.family).font_weight(FontWeight::BOLD)
```

```tsx tabs
import { Text } from "nsh";
import "./fonts/Pacifico-Regular.ttf";
import "./fonts/Inter-Regular.ttf";
import "./fonts/Inter-Bold.ttf";

<Text class="font-display text-3xl text-violet-600">Custom fonts</Text>
<Text class="font-body font-bold">Bold Inter</Text>
```

Una familia arbitraria funciona sin una entrada en el tema: `font-[Pacifico]`. Las clases de peso (`font-light`, `font-semibold`, `font-bold`, ...) seleccionan variantes igual que `fontWeight`. Los estilos de texto en una vista se transmiten a los textos que contiene, de modo que `.font_family(INTER.family)` en una vista, o `<View class="font-body">`, establece la familia de toda una pantalla.

<a id="a-default-font-for-the-app"></a>

## Una fuente predeterminada para la app

`font-sans` del tema es la fuente de la app: todo texto que no define una familia propia se dibuja con ella, tanto en componentes de Rust como en TSX, igual que una página web con `--font-sans` de Tailwind. `font-mono` es la fuente monoespaciada, de la clase `font-mono` y del código en `TextView`. Defínelas en el tema de la app (`"theme"` en `nsh.json`, [Rust](./rust.md#theme)) e incluye los archivos de fuente como se indicó antes:

```json
{
  "cssVars": {
    "theme": {
      "font-sans": "Inter, sans-serif",
      "font-mono": "JetBrains Mono, monospace"
    }
  }
}
```

La primera familia de la lista que no sea genérica es la fuente; una primera familia genérica (`system-ui`, `sans-serif`) es la fuente del sistema. La fuente también se puede definir en un contenedor: los textos que contiene la heredan.

```rust tabs
#[component]
pub fn Root() -> impl IntoElement {
    view().flex_1().font_family(INTER.family).child(app())
}
```

```tsx tabs
mount(() => (
  <View class="flex-1 font-body">
    <App />
  </View>
));
```

<a id="font-features"></a>

## Características de la fuente

`fontVariant` activa características OpenType de la fuente: `"tabular-nums"`, `"proportional-nums"`, `"lining-nums"`, `"oldstyle-nums"` y `"small-caps"` (`.tabular_nums()`, `.small_caps()`, ... en Rust; [Text](./text.md#text-styles)). La fuente debe contenerlas; las fuentes del sistema las contienen.

<a id="related"></a>

## Véase también

- [Text](./text.md): estilos de texto, tamaños y el ajuste del tamaño de texto del sistema.
- [Tailwind](./tailwind.md#theme): las claves del tema.
- [Imágenes y recursos](./images-and-assets.md): cómo se incluyen los archivos de la app.
