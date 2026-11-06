---
title: "Text"
description: "El elemento que dibuja texto: spans anidados, enlaces, límites de línea, escalado de fuente, vistas en línea y eventos de diseño de texto."
order: 20
group: primitives
demo: el-text
source_hash: 85fcf31a847a72cd
---


# Text

`Text` dibuja un párrafo. Es el elemento que muestra cadenas de texto: una cadena hija de un `View` no dibuja nada. El
párrafo se compone de forma nativa (CoreText en iOS y Mac Catalyst, `StaticLayout` en Android) y se mide en el hilo del
motor, de modo que el hilo principal solo lo dibuja. En Rust se crea con `text(content)`, en TSX con `<Text>` desde `nsh`.

```rust tabs
use nsh_core::prelude::*;

text("Read the ")
    .text_base()
    .line_height(px(24.0))
    .text_color(rgb(0x1f2328))
    .child(text("terms").font_weight(FontWeight::BOLD))
    .child(" before you continue.")
```

```tsx tabs
<Text style={{ fontSize: 16, lineHeight: 24, color: "#1f2328" }}>
  Read the <Text style={{ fontWeight: "700" }}>terms</Text> before you continue.
</Text>
```

`text(..)` acepta una cadena, un `SharedString`, una signal o una closure (`text(move || format!("{} items", count.get()))`):
una closure o una signal actualiza el texto en su sitio cuando cambia lo que lee.

## Spans

Un texto dentro de un texto es un span del mismo párrafo, no una vista independiente. Los spans heredan los estilos de texto del
párrafo (`color`, `fontSize`, `fontWeight`, …) y sobrescriben los que definen. Todo el bloque es una única vista nativa. En
Rust, `text(..)` muestra su contenido y después sus hijos: `.child(text(..))` añade un span, `.child("…")` un fragmento de texto plano.

```rust tabs
text("")
    .text_size(px(17.0))
    .child(text("Light ").font_weight(FontWeight::LIGHT))
    .child(text("Bold ").font_weight(FontWeight::BOLD))
    .child(text("Italic").italic().text_color(rgb(0x8250df)))
```

```tsx tabs
<Text style={{ fontSize: 17 }}>
  <Text style={{ fontWeight: "300" }}>Light </Text>
  <Text style={{ fontWeight: "bold" }}>Bold </Text>
  <Text style={{ fontStyle: "italic", color: "#8250df" }}>Italic</Text>
</Text>
```

<a id="span-backgrounds"></a>

### Fondos de los spans

Un span con fondo rellena la caja de sus caracteres, por detrás de ellos: tan alta como su fuente (el ascent por encima de la
línea base y el descent por debajo, sea cual sea la altura de línea), y en cada línea a la que se ajusta, donde la parte de cada línea es una caja
propia con el radio de esquina del span. Los spans que contiene comparten su fondo a menos que definan el suyo. Es solo
dibujo: el texto se distribuye igual que sin él, y un texto seleccionable copia los caracteres del span junto con el resto. El código
en línea es un span:

```rust tabs
text("Run ")
    .text_size(px(15.0))
    .line_height(px(22.0))
    .select_text()
    .child(
        text(" cargo test ")
            .font_family("ui-monospace")
            .text_size(px(13.0))
            .bg(rgb(0xeff1f3))
            .rounded(px(4.0)),
    )
    .child(" before you commit.")
```

```tsx tabs
<Text style={{ userSelect: "text", fontSize: 15, lineHeight: 22 }}>
  {"Run "}
  <Text style={{ fontFamily: "ui-monospace", fontSize: 13, backgroundColor: "#eff1f3", borderRadius: 4 }}>
    {" cargo test "}
  </Text>
  {" before you commit."}
</Text>
```

Las clases de Tailwind funcionan de la misma manera: `<Text class="bg-gray-100 rounded">`. El padding y los bordes son estilos de caja y
no afectan a los spans; los espacios dentro del span dan holgura a la caja por sus lados.

<a id="links"></a>

### Enlaces

Un span con un manejador de pulsación es un enlace: una pulsación sobre sus caracteres va al span, y una pulsación en cualquier otro punto, al párrafo.

```rust tabs
text("By continuing you agree to the ")
    .text_size(px(15.0))
    .on_press(move || log("the sentence"))
    .child(
        text("Terms of service")
            .text_color(rgb(0x0969da))
            .underline()
            .on_press(move || open("terms")),
    )
    .child(".")
```

```tsx tabs
<Text style={{ fontSize: 15 }} onPress={() => log("the sentence")}>
  {"By continuing you agree to the "}
  <Text style={{ color: "#0969da", textDecorationLine: "underline" }} onPress={() => open("terms")}>
    Terms of service
  </Text>
  .
</Text>
```

<a id="inline-views-and-images"></a>

### Vistas e imágenes en línea

Cualquier otro elemento dentro de un texto (una vista, una imagen, incluso dentro de spans) es un adjunto en línea: se distribuye con su
propio tamaño, se sitúa sobre la línea base (o donde lo coloque su estilo `verticalAlign`: `"text-top"`, `"text-bottom"`,
`"middle"`, como en CSS; la línea crece para contenerlo) y se ajusta junto con las palabras. Recibe sus propias pulsaciones.

```rust tabs
text("Made with ")
    .text_base()
    .line_height(px(26.0))
    .child(image(LOGO).size(px(18.0)).rounded(px(4.0)))
    .child(" NSH. Status ")
    .child(
        view()
            .bg(rgb(0x1a7f37))
            .rounded(px(9.0))
            .px(px(7.0))
            .h(px(18.0))
            .justify_center()
            .child(text("LIVE").text_color(white()).text_size(px(11.0)).font_weight(FontWeight::BOLD)),
    )
```

```tsx tabs
<Text style={{ fontSize: 16, lineHeight: 26 }}>
  {"Made with "}
  <Image src={logo} style={{ width: 18, height: 18, borderRadius: 4 }} />
  {" NSH. Status "}
  <View style={{ backgroundColor: "#1a7f37", borderRadius: 9, paddingHorizontal: 7, height: 18, justifyContent: "center" }}>
    <Text style={{ color: "#ffffff", fontSize: 11, fontWeight: "700" }}>LIVE</Text>
  </View>
</Text>
```

Los adjuntos recortados por `numberOfLines` o por unos puntos suspensivos quedan ocultos. Al copiar un texto seleccionable se omiten.

<a id="whitespace"></a>

### Espacios en blanco

El texto JSX sigue las reglas de React: las líneas se recortan salvo en los extremos del texto, las líneas con solo espacios en blanco se descartan y las
líneas restantes se unen con un espacio. Los espacios dentro de una misma línea se conservan (`{a} {b}` conserva su espacio). Escribe
`{" "}` o una expresión de cadena cuando un span necesite un espacio al inicio o al final. Las cadenas de Rust se dibujan tal como se escriben.

## Props

Además de las [props comunes](./index.md#common-props) (con `style` tipado como `TextStyle`):

| Prop | Rust | Tipo | Valor por defecto | Descripción |
|---|---|---|---|---|
| `numberOfLines` (style) | `.number_of_lines(n)`, `.truncate()` | `number` | `0` | El máximo de líneas que se muestran; `0` las muestra todas. |
| `textOverflow` (style) | `.text_overflow(EllipsizeMode::Middle)` | `"ellipsis" \| "clip" \| "ellipsis-start" \| "ellipsis-middle"` | `"ellipsis"` | Cómo se corta el texto que no cabe en `numberOfLines`: con puntos suspensivos al final, al principio o en medio, o recortado. |
| `allowFontScaling` | `.allow_font_scaling(..)` | `boolean` | `true` | Sigue el ajuste del tamaño de texto del sistema. |
| `maxFontSizeMultiplier` | `.max_font_size_multiplier(..)` | `number` | `0` | El límite superior de la escala del sistema; `0` significa sin límite. |
| `adjustsFontSizeToFit` | `.shrink_to_fit(min_scale)` | `boolean` | `false` | Reduce la fuente hasta que el texto quepa en sus líneas (`numberOfLines`) y en su caja. |
| `minimumFontScale` | `.shrink_to_fit(min_scale)` | `number` | | Cuánto como máximo se reduce `adjustsFontSizeToFit` (0..1; al menos 0.1). |
| `userSelect` (style) | `.select_text()`, `.select_none()` | `"auto" \| "none" \| "text"` | `"auto"` | `"text"`: el usuario puede seleccionar rangos del texto: una pulsación larga selecciona una palabra, los tiradores la amplían y el menú de edición la copia. `"auto"` toma el ajuste de las vistas que rodean al texto; si no hay ninguno definido, el texto no es seleccionable, salvo en los navegadores de escritorio, donde lo es a menos que esté dentro de un elemento interactivo; `"none"` lo mantiene no seleccionable también allí. |
| `selectionColor` (style) | `.selection_color(..)` | `ColorValue` | el color de acento de la plataforma | El resaltado y los tiradores de la selección. |
| `onTextLayout` | | `(e: { lines: TextLayoutLine[] }) => void` | | Las líneas distribuidas tras cada layout. |

Las clases de Tailwind `select-text`, `select-none` y `select-auto` definen `userSelect`, `line-clamp-*` define `numberOfLines`, `text-ellipsis` y `text-clip` definen `textOverflow`, y `truncate` es una sola línea cortada con puntos suspensivos. El resaltado y los tiradores de la selección toman la clave de estilo
`selectionColor` (`selection:text-*`), por defecto el color de acento de la plataforma.

<a id="text-styles"></a>

## Estilos de texto

`TextStyle` añade a los estilos de vista: `color`, `fontSize`, `fontWeight` (`"normal"`, `"bold"` o 100–900), `fontStyle`,
`fontFamily`, `lineHeight`, `letterSpacing`, `textAlign`, `textAlignVertical`, `textTransform`, `textDecorationLine`,
`textDecorationColor`, `textDecorationStyle`, `textDecorationThickness`, `textUnderlineOffset`, `textShadow` (el
`text-shadow` de CSS), `fontVariant`, `writingDirection`, `numberOfLines` y `textOverflow`. En Rust son métodos de `Styled`:
`.text_color(..)`, `.text_size(..)` (o `.text_sm()`, `.text_lg()`, …), `.font_weight(FontWeight::SEMIBOLD)`,
`.italic()`, `.font_family(..)`, `.line_height(..)`, `.letter_spacing(..)`, `.text_center()`, `.uppercase()`,
`.underline()`, `.line_through()`, `.tabular_nums()`, `.number_of_lines(..)` y el resto. Consulta la
[referencia de estilos](../modules/style-reference.md#textstyle) y [text](../docs/text.md).

La familia tipográfica es una familia del sistema o un archivo de fuente de la app:

```rust tabs
// assets/fonts/Inter-Regular.ttf, shipped by the registry (`registry.assets(assets!())`).
const INTER: FontAsset = asset!("fonts/Inter-Regular.ttf");

text("Inter").font_family(INTER.family).text_size(px(17.0))
```

```tsx tabs
import { Text } from "nsh";
import Inter from "./fonts/Inter-Regular.ttf";

<Text style={{ fontFamily: Inter, fontSize: 17 }}>Inter</Text>;
```

La fuente se registra antes del primer frame. Consulta [fuentes](../docs/fonts.md).

<a id="events"></a>

## Eventos

| Evento | Rust | Payload | Cuándo |
|---|---|---|---|
| `onTextLayout` | | `{ lines: TextLayoutLine[] }` | Después de cada layout del párrafo. |
| `onPress`, `onLongPress`, … | `.on_press`, `.on_long_press`, … | `PressEvent` (ninguno en Rust) | Igual que en [view](./view.md#events); en un span, pulsaciones sobre sus caracteres. |
| `onLayout` | `.on_layout` | `{ bounds }` | El frame del bloque cambió. |

`TextLayoutLine` es `{ text, x, y, width, height, ascender, descender, capHeight, xHeight }`, dentro de la caja de contenido del texto:

```tsx
const lines = signal(0);
<Text onTextLayout={(e) => lines.set(e.lines.length)}>{article}</Text>;
```

Rust mide una cadena antes de distribuirla con `measure_text(..)`.

<a id="ref-methods"></a>

## Métodos de ref

Ninguno propio.

<a id="platform-notes"></a>

## Notas de plataforma

- La selección permanece dentro de un bloque de texto (un texto y sus spans). iOS muestra su menú de edición (Copy, Select All, Look Up,
  Translate, Share), Android una barra de herramientas flotante (Copy, Select all, Share).
- Las decoraciones de texto distintas de una línea simple sólida (`double`, `dotted`, `dashed`, `wavy`) las dibuja NSH en iOS.
- Los textos de iOS dibujan fondos sólidos y sombras exteriores.
- `fontScale()` de [`nsh`](../modules/nsh.md#device) (`font_scale()` en Rust) informa de la escala de texto actual del sistema.
