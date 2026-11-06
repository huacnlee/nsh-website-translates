---
title: "Texto"
description: "Mostrar texto con el elemento text en Rust y TSX: spans y enlaces anidados, vistas en línea, fuentes y decoraciones, truncamiento, tamaño de texto del sistema, selección y onTextLayout."
order: 35
group: ui
source_hash: 9d528fcdc65c1a8c
---


# Texto

Todo el texto se muestra mediante elementos de texto: `text(..)` en Rust, `<Text>` en TSX. Un elemento de texto es un párrafo, compuesto por el motor de texto de la plataforma (CoreText en las plataformas Apple, `StaticLayout` en Android) en el hilo del motor cuando se calcula su layout, y solo se dibuja en el hilo principal. Los elementos de texto anidados son spans del mismo párrafo, no vistas independientes.

```rust tabs
text("By continuing you agree to the ")
    .text_size(px(16.0))
    .line_height(px(24.0))
    .text_color(rgb(0x1f2328))
    .child(
        text("Terms of service")
            .text_color(rgb(0x0969da))
            .underline()
            .on_press(open_terms),
    )
    .child(".")
```

```tsx tabs
<Text style={{ fontSize: 16, lineHeight: 24, color: "#1f2328" }}>
  By continuing you agree to the{" "}
  <Text style={{ color: "#0969da", textDecorationLine: "underline" }} onPress={openTerms}>
    Terms of service
  </Text>
  .
</Text>
```

> [!IMPORTANT]
> Las cadenas se muestran mediante elementos de texto. En TSX, una cadena colocada directamente en un `<View>` no se muestra: envuélvela en `<Text>`.

El elemento en sí está documentado en [text](../elements/text.md); esta página trata sobre cómo usarlo.

<a id="strings-and-whitespace"></a>

## Cadenas y espacios en blanco

En Rust, el contenido de un texto es una cadena, que se muestra tal como está escrita: `\n` produce un salto de línea. El contenido que lee signals es una closure, y el texto se actualiza cuando estas cambian. En TSX, el texto JSX sigue las mismas reglas que en React: cada línea se recorta, las líneas que solo contienen espacios en blanco se descartan y las líneas restantes se unen con un único espacio. Los espacios dentro de una misma línea se conservan, así que `{first} {last}` mantiene su espacio. Usa `{" "}` para un espacio al principio o al final de una línea, y `{"\n"}` para un salto de línea:

```rust tabs
text(move || format!("Hello, {}!\nWelcome back.", name.get()))
```

```tsx tabs
<Text>
  Hello,
  {name()}!{"\n"}
  Welcome back.
</Text>
```

Las expresiones dentro del texto siguen lo que leen: `text(move || format!("{} items", count.get()))` y `<Text>{count()} items</Text>` se actualizan cuando cambia `count`.

<a id="spans-and-inheritance"></a>

## Spans y herencia

Un texto dentro de un texto es un span. Hereda el estilo de texto de su padre y sobrescribe lo que define:

```rust tabs
text("")
    .text_size(px(17.0))
    .text_color(rgb(0x1f2328))
    .child(text("Light ").font_weight(FontWeight::LIGHT))
    .child(text("Bold ").font_weight(FontWeight::BOLD))
    .child(text("Italic ").italic())
    .child(text("Spaced").letter_spacing(px(4.0)))
```

```tsx tabs
<Text style={{ fontSize: 17, color: "#1f2328" }}>
  <Text style={{ fontWeight: "300" }}>Light </Text>
  <Text style={{ fontWeight: "700" }}>Bold </Text>
  <Text style={{ fontStyle: "italic" }}>Italic </Text>
  <Text style={{ letterSpacing: 4 }}>Spaced</Text>
</Text>
```

Los estilos de texto también se transmiten desde las vistas, como en CSS: `view().text_color(white()).text_sm()` en Rust y `<View class="text-white text-sm">` en TSX dan estilo a los elementos text e input que contienen.

<a id="links"></a>

### Enlaces

Un span con un manejador de pulsación (`.on_press(..)` o `.on_long_press(..)`; `onPress` o `onLongPress`) es un enlace: una pulsación sobre sus caracteres va al span, y una pulsación en cualquier otro lugar va al párrafo. Los enlaces en spans anidados también funcionan.

```rust tabs
text("Read the ")
    .on_press(move || tapped.set("the sentence"))
    .child(text("terms").text_color(rgb(0x0969da)).on_press(move || tapped.set("terms")))
    .child(" first.")
```

```tsx tabs
<Text onPress={() => log("the sentence")}>
  Read the <Text style={{ color: "#0969da" }} onPress={() => open(termsUrl)}>terms</Text> first.
</Text>
```

<a id="backgrounds-of-spans"></a>

### Fondos de los spans

El color de fondo y el radio de esquina de un span pintan una caja detrás de sus caracteres en cada línea que ocupa, con la altura de su fuente; el texto se distribuye igual y se copia completo, por lo que el código en línea es un span ([Text element](../elements/text.md#span-backgrounds)):

```rust tabs
text("Run ")
    .child(text(" npm test ").font_family("ui-monospace").bg(rgb(0xeff1f3)).rounded(px(4.0)))
    .child(" first.")
```

```tsx tabs
<Text>
  Run <Text style={{ fontFamily: "ui-monospace", backgroundColor: "#eff1f3", borderRadius: 4 }}> npm test </Text> first.
</Text>
```

<a id="views-and-images-inside-text"></a>

### Vistas e imágenes dentro del texto

Cualquier elemento distinto de un texto dentro de un texto se coloca en línea, sobre la línea base, y se ajusta con las palabras. Puede recibir sus propias pulsaciones:

```rust tabs
text("Made with ")
    .text_size(px(16.0))
    .line_height(px(26.0))
    .child(image(LOGO).size(px(18.0)))
    .child(" nsh. Status ")
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
  Made with <Image src={logo} style={{ width: 18, height: 18 }} /> nsh. Status{" "}
  <View style={{ backgroundColor: "#1a7f37", borderRadius: 9, paddingHorizontal: 7, height: 18, justifyContent: "center" }}>
    <Text style={{ color: "#ffffff", fontSize: 11, fontWeight: "700" }}>LIVE</Text>
  </View>
</Text>
```

Los elementos en línea recortados por `numberOfLines` o por puntos suspensivos quedan ocultos; al copiar el texto se omiten. El texto dentro de un elemento en línea toma el color del texto que lo rodea, como el `color` de CSS alcanza a un bloque en línea, a menos que defina el suyo propio (como hace la insignia `LIVE` de arriba); su fuente y su altura de línea siguen siendo las suyas.

La clave de estilo `verticalAlign` coloca un elemento en línea dentro de su línea, como el `vertical-align` de CSS coloca una imagen: `"baseline"` (el valor por defecto) apoya su parte inferior en la línea base, `"text-top"` y `"text-bottom"` sitúan su parte superior o inferior en la parte superior o inferior de la fuente del texto, y `"middle"` lo centra a la mitad de la altura x de la fuente por encima de la línea base. La línea crece para contener el elemento allí donde sobrepase la fuente, también con un `lineHeight` fijo. Un icono al principio de un párrafo que deba alinearse con la parte inferior del texto, como lo dibuja el `ImageSpan` de Android, usa `"text-bottom"`. Las clases son `align-baseline`, `align-text-top`, `align-text-bottom` y `align-middle`; en Rust, `.align_text_bottom()` y las demás con los mismos nombres.

```tsx
<Text style={{ fontSize: 16 }}>
  <Image src={badge} style={{ width: 16, height: 16, verticalAlign: "text-bottom" }} /> Verified seller
</Text>
```

<a id="text-styles"></a>

## Estilos de texto

| Propiedad | Valores | Rust |
|---|---|---|
| `color` | Un [color](./styling.md#colors). Por defecto, negro | `.text_color(..)` |
| `fontSize` | Puntos. Por defecto 14 | `.text_size(px(..))`, `.text_sm()`, `.text_lg()`, ... |
| `fontWeight` | `"normal"` (400), `"bold"` (700), o `100`–`900` (número o cadena) | `.font_weight(FontWeight::BOLD)` |
| `fontStyle` | `"normal"`, `"italic"`: los emoji en color permanecen rectos | `.italic()` |
| `fontFamily` | Una familia del sistema, una familia genérica o una [fuente importada](./fonts.md) | `.font_family(..)` |
| `lineHeight` | Puntos | `.line_height(px(..))` |
| `letterSpacing` | Puntos | `.letter_spacing(px(..))` |
| `textAlign` | `"auto"`, `"left"`, `"center"`, `"right"`, `"justify"`, `"start"`, `"end"`: `left` y `right` mantienen sus lados de derecha a izquierda, `start` y `end` siguen la dirección | `.text_left()`, `.text_center()`, `.text_right()`, `.text_justify()` |
| `textAlignVertical` | `"auto"`, `"top"`, `"center"`, `"bottom"`: dónde se sitúa el texto más corto que su caja | |
| `textTransform` | `"none"`, `"uppercase"`, `"lowercase"`, `"capitalize"` | `.normal_case()`, `.uppercase()`, `.lowercase()`, `.capitalize()` |
| `textDecorationLine` | `"none"`, `"underline"`, `"line-through"`, `"underline line-through"` | `.no_underline()`, `.underline()`, `.line_through()` |
| `textDecorationColor`, `textDecorationStyle` | Color; `"solid"`, `"double"`, `"dotted"`, `"dashed"`, `"wavy"` | `.text_decoration_color(..)`, `.text_decoration_wavy()`, ... |
| `textDecorationThickness`, `textUnderlineOffset` | Puntos, o `"auto"` (el grosor también `"from-font"`) | `.text_decoration_thickness(px(..))`, `.underline_offset(px(..))` |
| `textShadow` | El `text-shadow` de CSS, una sombra detrás de los glifos: `"2px 2px 4px rgb(0 0 0 / 0.6)"` (desplazamientos, desenfoque, color), o sus capas como números, `[{ x: 2, y: 2, blur: 4, color: "#00000099" }]`; varias capas se dibujan como la más ancha | `.text_shadow([TextShadow { .. }])`, `.text_shadow_sm()`, ..., `.text_shadow_color(..)` |
| `fontVariant` | Características OpenType: `["tabular-nums"]`, `"small-caps"`, `"oldstyle-nums"`, `"lining-nums"`, `"proportional-nums"` | `.tabular_nums()`, `.small_caps()`, `.oldstyle_nums()`, `.lining_nums()`, `.proportional_nums()` |
| `writingDirection` | `"auto"`, `"ltr"`, `"rtl"`: la dirección base del párrafo | `.writing_direction(WritingDirection::Rtl)` |

Un elemento de texto también es una vista: admite fondos, bordes, esquinas, padding y los demás [estilos de vista](./styling.md).

```rust tabs
text(move || format!("{:.2}", price.get())).text_size(px(18.0)).tabular_nums()
text("Typo").underline().text_decoration_wavy().text_decoration_color(rgb(0xcf222e))
text("Shadow")
    .text_size(px(26.0))
    .font_weight(FontWeight::EXTRA_BOLD)
    .text_color(white())
    .text_shadow([TextShadow {
        offset_x: px(2.0),
        offset_y: px(2.0),
        radius: px(4.0),
        color: rgba(0x00000099).into(),
    }])
```

```tsx tabs
<Text style={{ fontSize: 18, fontVariant: ["tabular-nums"] }}>{price().toFixed(2)}</Text>
<Text style={{ textDecorationLine: "underline", textDecorationStyle: "wavy", textDecorationColor: "#cf222e" }}>Typo</Text>
<Text style={{ fontSize: 26, fontWeight: "800", color: "#ffffff", textShadow: "2px 2px 4px rgba(0,0,0,0.6)" }}>
  Shadow
</Text>
```

`tabular-nums` da a todos los dígitos el mismo ancho, lo que evita que los contadores y los precios vibren al cambiar.

<a id="truncation"></a>

## Truncamiento

```rust tabs
text(long_description).number_of_lines(2)
text(file_path).number_of_lines(1).text_overflow(EllipsizeMode::Middle)
```

```tsx tabs
<Text style={{ numberOfLines: 2 }}>{longDescription}</Text>
<Text style={{ numberOfLines: 1, textOverflow: "ellipsis-middle" }}>{filePath}</Text>
```

| Clave de estilo / prop | Rust | Descripción |
|---|---|---|
| `numberOfLines` (estilo) | `.number_of_lines(n)` | El máximo de líneas mostradas; `0` (por defecto) las muestra todas |
| `textOverflow` (estilo) | `.text_overflow(EllipsizeMode::Middle)` | Cómo se corta el texto que no cabe: con puntos suspensivos al final (`"ellipsis"`, por defecto), al principio (`"ellipsis-start"`) o en el medio (`"ellipsis-middle"`), o `"clip"` |
| `adjustsFontSizeToFit` | `.shrink_to_fit(min_scale)` | Reduce la fuente hasta que el texto quepa en sus líneas y su caja |
| `minimumFontScale` | | Cuánto puede reducirse `adjustsFontSizeToFit` (0–1) |

```rust tabs
text(move || total.get())
    .number_of_lines(1)
    .shrink_to_fit(0.5)
    .text_size(px(48.0))
    .w(px(200.0))
```

```tsx tabs
<Text adjustsFontSizeToFit minimumFontScale={0.5} style={{ numberOfLines: 1, fontSize: 48, width: 200 }}>
  {total()}
</Text>
```

Las clases de Tailwind `line-clamp-*`, `text-ellipsis` y `text-clip` establecen las mismas claves, y `truncate` (`.truncate()`) es una sola línea cortada con puntos suspensivos; como claves de estilo también admiten estilos de estado y variantes.

<a id="system-text-size"></a>

## Tamaño de texto del sistema

Por defecto, el texto sigue el ajuste de tamaño de texto del usuario (Dynamic Type en iOS, tamaño de fuente en Android).

| Prop | Rust | Descripción |
|---|---|---|
| `allowFontScaling` | `.allow_font_scaling(false)` | `false` mantiene el tamaño fijo. Por defecto `true` |
| `maxFontSizeMultiplier` | `.max_font_size_multiplier(1.5)` | La mayor escala aplicada, p. ej. `1.5`. `0` significa sin límite |

`font_scale()` en Rust y `fontScale()` de [`nsh`](../modules/nsh.md#device) en TSX son la escala actual, y cambian cuando el usuario modifica el ajuste. Los inputs también admiten `allowFontScaling` y `maxFontSizeMultiplier`.

```rust tabs
text("Tab label").max_font_size_multiplier(1.3).text_size(px(13.0))
```

```tsx tabs
<Text maxFontSizeMultiplier={1.3} style={{ fontSize: 13 }}>Tab label</Text>
```

Es preferible limitar la escala que desactivarla: el texto grande es un ajuste de accesibilidad en el que la gente confía.

<a id="selection"></a>

## Selección

La clave de estilo `userSelect: "text"` (`.select_text()`, la clase `select-text`) permite al usuario seleccionar y copiar el texto, como en las vistas de texto propias del sistema: una pulsación larga selecciona la palabra bajo el dedo, los tiradores mueven los extremos de la selección y el menú de edición ofrece Copiar y Seleccionar todo (iOS añade Consultar, Traducir y Compartir; Android, Compartir). Una selección permanece dentro de un único bloque de texto. La clave de estilo `selectionColor` (`.selection_color(..)`, `selection:text-*`) colorea el resaltado y los tiradores. `userSelect` establecido en una vista alcanza a los textos que contiene y que no definen ninguno.

En los navegadores de escritorio el texto es seleccionable por defecto, como en una página web, salvo dentro de elementos interactivos (vistas con manejadores de pulsación o de toque, como botones y filas pulsables); `userSelect: "none"` (`.select_none()`, la clase `select-none`) mantiene un texto no seleccionable ahí. Los navegadores de teléfono y tableta siguen la regla nativa.

```rust tabs
text(order_number).select_text().selection_color(rgb(0x7c3aed))
```

```tsx tabs
<Text style={{ userSelect: "text", selectionColor: "#7c3aed" }}>{orderNumber}</Text>
```

Para copiar desde el código (un botón Copiar), usa `set_clipboard(..)` en Rust o [`Clipboard`](../modules/nsh.md#clipboard) en TSX.

## onTextLayout

`onTextLayout` (el evento `TextLayout` en Rust) informa de las líneas distribuidas tras cada layout, en la caja de contenido del texto:

```rust tabs
text(move || body.get()).on(EventKind::TextLayout, move |e: &EventPayload| {
    if let EventPayload::TextLayout(laid_out) = e {
        lines.set(laid_out.len());
    }
})
```

```tsx tabs
<Text
  onTextLayout={(e) => {
    lines.set(e.lines.length);
    console.log(e.lines.map((l) => `${l.text} (${l.bounds.size.width.toFixed(0)}pt)`));
  }}
>
  {body()}
</Text>
```

Cada línea tiene `text`, `x`, `y`, `width`, `height`, `ascender`, `descender`, `capHeight` y `xHeight` (`cap_height` y `x_height` en Rust). Úsalo para mostrar un botón «Leer más» solo cuando el texto se ha cortado, o para alinear otro contenido con una línea base.

<a id="accessibility"></a>

## Accesibilidad

Los lectores de pantalla leen un elemento de texto como su contenido. Asigna un rol al texto que actúa como encabezado (`.role(AccessibilityRole::Header)`, `role="header"`) y a los enlaces (`AccessibilityRole::Link`, `role="link"`). Consulta [Accesibilidad](./accessibility.md).

<a id="related"></a>

## Relacionado

- [Fuentes](./fonts.md): fuentes personalizadas y pesos.
- [Elemento text](../elements/text.md): todas las props.
- [Formularios y teclado](./forms-and-keyboard.md): entrada de texto.
