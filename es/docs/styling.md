---
title: "Estilos"
description: "Métodos de estilo tipados en Rust y la prop style en TSX: flexbox, grid y efectos CSS; colores, bordes, esquinas, sombras, degradados, filtros, transformaciones y transiciones, con las diferencias entre plataformas."
order: 32
group: ui
demo: guide-styling
source_hash: c3b673df4846a333
---


# Estilos

Cada elemento se estiliza con los mismos estilos nativos, escritos de dos maneras. En Rust, los estilos son métodos tipados encadenados al elemento (`.p_4()`, `.rounded(px(12.0))`, `.bg(color)`); en TSX, una prop `style` con propiedades en camelCase, o [clases de Tailwind](./tailwind.md). Ambas incluyen funciones de CSS como sombras de caja, degradados, filtros, contornos, transiciones y grid, y solo las propiedades que cambiaron se envían a la vista nativa.

Las tres formas escriben un mismo conjunto de propiedades y significan lo mismo. Sus nombres son los de CSS (unos pocos usan los nombres más simples que escriben las apps, como `paddingHorizontal`, `marginStart` y `numberOfLines`), y los valores CSS (colores, degradados, filtros, sombras, transformaciones, palabras clave de alineación) y las utilidades de Tailwind significan lo mismo que en la web, y cada método de Rust y cada utilidad establece lo que Tailwind CSS 4 genera para ella, de modo que lo que sabes de la web se aplica aquí: `paddingLeft` es `padding-left` y `pl-4`, `boxShadow` es `box-shadow`, `display: "flex"` es una fila igual que la clase `flex`. El resto está hecho para apps nativas: las longitudes son puntos (`16`, `"50%"`, `"auto"`; las clases aceptan `rem` y las demás unidades de CSS), los valores por defecto son los del layout nativo (se listan más abajo), un valor que cambia toma números en lugar de una cadena (`translate: [x, 0]`, las capas de una sombra), y lo que las plataformas hacen más allá de CSS tiene sus propias [extensiones](#extensions).

```rust tabs
view()
    .p_4()
    .rounded(px(12.0))
    .bg(white())
    .border_1()
    .border_color(rgb(0xd0d7de))
    .shadow([BoxShadow {
        offset_y: px(4.0),
        blur: px(12.0),
        color: rgba(0x0000001f).into(),
        ..BoxShadow::default()
    }])
    .child(
        text("Card")
            .text_size(px(17.0))
            .font_weight(FontWeight::SEMIBOLD)
            .text_color(rgb(0x1f2328)),
    )
```

```tsx tabs
<View
  style={{
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d0d7de",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.12)",
  }}
>
  <Text style={{ fontSize: 17, fontWeight: "600", color: "#1f2328" }}>Card</Text>
</View>
```

Esta página explica cómo se combinan los estilos y cuáles son las propiedades visuales. Las propiedades de layout (flexbox, grid, tamaños, posiciones) están en [Layout](./layout.md), las propiedades de texto en [Text](./text.md), y cada propiedad con su tipo aparece en la [referencia de estilos](../modules/style-reference.md).

<a id="combining-styles"></a>

## Combinar estilos

En Rust, los estilos compartidos son funciones que reciben un elemento y lo devuelven con estilo, y las condiciones son Rust normal: `.when(condition, |v| ..)` para lo que se conoce al crear el elemento, `.style_when(signal, |s| ..)` para estilos que cambian mientras la app se ejecuta. En TSX, `style` recibe un objeto, o un arreglo de objetos que se combinan de izquierda a derecha; las entradas falsy (`false`, `null`, `undefined`) se omiten, lo que hace breves los estilos condicionales:

```rust tabs
fn button(danger: bool, busy: Signal<bool>) -> View {
    view()
        .px_4()
        .py(px(10.0))
        .rounded(px(10.0))
        .bg(rgb(0x0969da))
        .when(danger, |v| v.bg(rgb(0xcf222e)))
        .style_when(busy, |s| s.opacity(0.4))
}
```

```tsx tabs
const styles = {
  button: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: "#0969da" },
  disabled: { opacity: 0.4 },
  danger: { backgroundColor: "#cf222e" },
} as const;

<View style={[styles.button, props.danger && styles.danger, busy() && styles.disabled]} />
```

En TSX, define los estilos compartidos como constantes fuera de los componentes (con `as const`, para que TypeScript conserve tipos literales como `"row"`). Basta un objeto simple: los estilos se analizan en Rust cada vez que se establecen, a partir de objetos que nadie necesita registrar.

Un estilo que lee signals las sigue: en Rust, pasa un closure al método (`.bg(move || ..)`), y solo esa propiedad se vuelve a establecer cuando los signals cambian; en TSX, una expresión de estilo que lee signals se reconstruye, y NSH envía solo las propiedades cuyos valores difieren:

```rust tabs
view()
    .p_3()
    .bg(move || if selected.get() { rgb(0xddf4ff) } else { rgb(0xffffff) })
```

```tsx tabs
<View style={{ backgroundColor: selected() ? "#ddf4ff" : "#ffffff", padding: 12 }} />
```

Cuando un elemento TSX tiene ambos, `style` prevalece sobre `class`: primero se aplican las clases y luego el estilo en línea encima. Una clave establecida en `undefined` no establece nada (`backgroundColor: active ? accent : undefined` conserva el color de la clase cuando está inactivo); `null` establece el valor por defecto. En Rust, un método posterior prevalece sobre uno anterior para la misma propiedad.

Dentro de un mismo estilo (un objeto, o un arreglo combinado en uno), el orden de las claves no importa: una propiedad más específica prevalece sobre su forma abreviada, `borderTopWidth` sobre `borderWidth`, `borderLeftColor` sobre `borderColor`, `marginTop` sobre `marginVertical` sobre `margin` (igual con padding), `rowGap` sobre `gap`, `flexGrow` sobre `flex`, `gridColumnStart` sobre `gridColumn`. Una propiedad específica establecida en `null` en ese caso muestra el valor de la forma abreviada.

<a id="units-and-values"></a>

## Unidades y valores

- **Las longitudes son puntos** (píxeles independientes de la densidad): `px(100.0)` en Rust y `width: 100` en TSX equivalen a 100pt, es decir, 200 o 300 píxeles físicos en una pantalla 2× o 3×.
- **Los porcentajes** (`relative(0.5)` en Rust, `"50%"` en TSX) son relativos al padre, para tamaños, posiciones, márgenes y paddings ([Layout](./layout.md)).
- **Los ángulos** son `deg(45.0)`, `radians(0.5)` o `turn(0.25)` en Rust, y grados como números o cadenas con unidad en TSX: `45`, `"45deg"`, `"0.5rad"`; `rotate` y `transform` de CSS también aceptan `"0.25turn"`, y dentro de una cadena `transform` cada ángulo lleva su unidad.
- **Las duraciones** son milisegundos: `.duration(150.0)` en Rust, números o cadenas (`"150ms"`, `"0.2s"`) en TSX.

<a id="defaults"></a>

## Valores por defecto

Donde nada establece una propiedad, se aplican los valores por defecto de NSH:

| | Valor por defecto |
|---|---|
| Layout de los hijos de una vista | una columna (un contenedor flex con `flexDirection: "column"`); `display: "flex"` crea una fila a menos que se establezca `flexDirection`, como en CSS |
| `flexShrink` | `0` (los hijos no se encogen salvo que se pida) |
| `alignContent` | `"flex-start"` (en grids, el `"normal"` de CSS) |
| `position` | `"relative"` |
| `minWidth` / `minHeight` | `0` |
| `backgroundColor` | transparente |
| Texto | negro, 14pt, peso 400 |
| Color de borde y de contorno | el color del texto (`currentColor` de CSS) |

Las vistas nuevas no llevan ningún estilo hasta que les das uno, por lo que los contenedores sin estilo no cuestan nada en el lado nativo.

<a id="colors"></a>

## Colores

En Rust, los colores son valores tipados: `rgb(0x0099ff)`, `rgba(0x0099ffcc)`, `hsla(..)`, `white()`, `black()`, y la paleta de Tailwind como `nsh_core::element::palette` (`BLUE.shade(500)`). Los métodos de color reciben un `AdaptiveColor`, un valor claro y uno oscuro: `AdaptiveColor::rgb(0xffffff, 0x0d1117)` cambia con la apariencia del sistema de forma nativa, sin renderizar. Los colores del tema de la app (`theme().primary` de `nsh_base`) también son adaptativos ([Rust](./rust.md#theme)).

En TSX, las propiedades de color aceptan cadenas de color CSS:

| Forma | Ejemplo |
|---|---|
| Hex | `"#09f"`, `"#09fc"`, `"#0099ff"`, `"#0099ffcc"` |
| `rgb()` / `rgba()` | `"rgb(0, 153, 255)"`, `"rgba(0, 0, 0, 0.5)"`, `"rgb(0 0 0 / 10%)"` |
| `hsl()` / `hsla()` | `"hsl(210 100% 50%)"` |
| `oklch()` / `oklab()` | `"oklch(62.3% 0.214 259.8)"` |
| Con nombre | `"white"`, `"black"`, `"transparent"`, `"rebeccapurple"`, ... |
| `currentColor` | `"currentColor"`: el color del texto, también dentro de un degradado, una sombra, un `drop-shadow()` o un `color-mix()` (`"color-mix(in srgb, currentColor 50%, transparent)"`); las clases lo escriben `bg-current`, `border-current/50`, `bg-[color-mix(in_srgb,currentColor_50%,transparent)]` |

Para el modo oscuro en TSX, lee [`colorScheme()`](../modules/nsh.md#device) de `nsh`, un accessor que sigue la apariencia del sistema, o usa la variante `dark:` de Tailwind:

```rust tabs
view()
    .flex_1()
    .bg(AdaptiveColor::rgb(0xffffff, 0x0d1117))
    .child(text("Follows the system appearance").text_color(AdaptiveColor::rgb(0x1f2328, 0xe6edf3)))
```

```tsx tabs
import { Text, View } from "nsh";
import { colorScheme } from "nsh";

const palette = () =>
  colorScheme() === "dark"
    ? { background: "#0d1117", text: "#e6edf3" }
    : { background: "#ffffff", text: "#1f2328" };

<View style={{ flex: 1, backgroundColor: palette().background }}>
  <Text style={{ color: palette().text }}>Follows the system appearance</Text>
</View>
```

Para estilos que no son colores, `.dark(|s| ..)` en Rust aplica estilos en apariencia oscura, y `dark()` lee la apariencia. El color de texto por defecto es negro en ambas apariencias: establece los colores explícitamente en las apps que admiten modo oscuro.

<a id="borders-and-corners"></a>

## Bordes y esquinas

```rust tabs
view()
    .border_1()
    .border_color(rgb(0xd0d7de))
    .border_dashed()               // .border_solid() | .border_dashed() | .border_dotted()
    .rounded(px(12.0))
    .rounded_tl(px(24.0))          // per corner, overrides .rounded(..)
    .border_b(px(3.0))             // per side
    .border_b_color(rgb(0x0969da))
```

```tsx tabs
<View
  style={{
    borderWidth: 1,
    borderColor: "#d0d7de",
    borderStyle: "dashed",          // "solid" | "dashed" | "dotted"
    borderRadius: 12,
    borderTopLeftRadius: 24,        // per corner, overrides borderRadius
    borderBottomWidth: 3,           // per side
    borderBottomColor: "#0969da",
  }}
/>
```

- **Anchos y colores** por lado: `borderTopWidth`, `borderRightWidth`, ..., `borderTopColor`, ..., que mantienen su lado en cualquier dirección; y `borderStartWidth`, `borderEndWidth`, `borderStartColor`, `borderEndColor`, que siguen la [dirección del layout](./layout.md#right-to-left) (`.border_t(..)`, `.border_t_color(..)`, `.border_s(..)`, `.border_e_color(..)`, ... en Rust).
- **El color** de un lado cuyo ancho está establecido y cuyo color no lo está es el color del texto, como `currentColor` de CSS: `{ borderWidth: 1, color: "#0969da" }` dibuja un borde azul.
- **Radios** por esquina: `borderTopLeftRadius`, `borderTopRightRadius`, `borderBottomRightRadius`, `borderBottomLeftRadius`, y `borderTopStartRadius` / `borderTopEndRadius` / `borderBottomStartRadius` / `borderBottomEndRadius` (inicio superior, fin superior, inicio inferior, fin inferior), que siguen la [dirección del layout](./layout.md#right-to-left) (`.rounded_tl(..)`, ..., `.rounded_ss(..)`, `.rounded_se(..)`, `.rounded_es(..)`, `.rounded_ee(..)` en Rust, y los presets `.rounded_lg()`, `.rounded_full()`, ...).
- **`borderCurve: "continuous"`** (`.border_curve(BorderCurve::Continuous)`) dibuja esquinas cuya curvatura se suaviza hacia los bordes, como los íconos de apps de iOS, en ambas plataformas. Una píldora (`borderRadius` de la mitad de la altura) sigue siendo una píldora.
- **`overflow: "hidden"`** (`.overflow_hidden()`) recorta los hijos a la forma redondeada. Lo que recorta también se recorta en el layout: no llega al tamaño del contenido de un scroll view contenedor, así que una caja que coloca a un hijo más ancho que ella misma y lo reduce con un `transform` (las transformaciones no afectan al layout) deja tranquilo al scroll view.

Los radios mayores que la mitad del lado se limitan, de modo que `borderRadius: 9999` (`.rounded_full()`) produce un círculo o una píldora.

<a id="shadows"></a>

## Sombras

Las vistas proyectan el `boxShadow` de CSS, y Android añade su elevación de material:

```rust tabs
// CSS box-shadow: several layers, with spread and inset.
view().shadow([
    BoxShadow { offset_y: px(1.0), blur: px(2.0), color: rgba(0x00000014).into(), ..BoxShadow::default() },
    BoxShadow { offset_y: px(8.0), blur: px(24.0), color: rgba(0x0000001f).into(), ..BoxShadow::default() },
])
view().shadow([BoxShadow { offset_y: px(2.0), blur: px(4.0), color: rgba(0x00000026).into(), inset: true, ..BoxShadow::default() }])

// A preset in a color of its own.
view().shadow_lg().shadow_color(rgba(0x0969da66))

// Android's material elevation.
view().elevation(px(6.0)).bg(white()).rounded(px(12.0))
```

```tsx tabs
// CSS box-shadow: several, comma separated, with spread and inset
<View style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.12)" }} />
<View style={{ boxShadow: "inset 0 2px 4px rgba(0,0,0,0.15)" }} />

// Android's material elevation (a prop, not a style)
<View android={{ elevation: 6 }} style={{ backgroundColor: "#ffffff", borderRadius: 12 }} />
```

`boxShadow` sigue a CSS: `offsetX offsetY blur spread color`, `inset` para sombras internas. También recibe sus capas como números, la forma para valores que cambian, que no construye ninguna cadena: `boxShadow: [{ x: 0, y: 6, blur: 18, spread: 0, color: "#0000004d", inset: false }]` (solo `x` y `y` son obligatorios; una capa sin color usa el color del texto). Rust recibe las capas, `.shadow([BoxShadow { .. }])`. Las sombras siguen la forma redondeada de la vista, y una transición las anima (`transitionProperty: "boxShadow"`, `.transition_shadow()`). Los presets de Tailwind son `.shadow_sm()`, `.shadow_md()`, `.shadow_lg()`, ... en Rust, y `.shadow_color(..)` recolorea sus capas. Una sombra que sigue el contenido de una vista transparente (los glifos de un ícono, por ejemplo) es un `filter: "drop-shadow(...)"` ([Filters](#filters-and-blending)); el texto tiene `textShadow` ([Text](./text.md)).

> [!NOTE]
> En Android, las sombras necesitan un fondo: una vista con fondo transparente (un texto sin fondo, por ejemplo) no proyecta sombra.

<a id="gradients"></a>

## Degradados

`backgroundImage` acepta degradados CSS, dibujados sobre el color de fondo; en Rust, `.bg_linear(angle)`, `.bg_radial()` y `.bg_conic(angle)` con las paradas `.gradient_from(..)`, `.gradient_via(..)` y `.gradient_to(..)`, como `bg-linear-*` de Tailwind con `from-*`, `via-*` y `to-*`. En TSX, varios degradados se separan con comas.

```rust tabs
view().h(px(120.0)).rounded(px(16.0)).bg_linear(deg(135.0)).gradient_from(rgb(0x54aeff)).gradient_to(rgb(0x8250df))
view().bg_radial().gradient_from(rgb(0xfff8c5)).gradient_to(rgb(0xfd8c73))
view().bg_conic(deg(0.0)).gradient_from(rgb(0xff0000)).gradient_via(rgb(0x00ff00)).gradient_to(rgb(0x0000ff))
view()
    .bg_linear_to_r()
    .gradient_from(rgb(0x8250df))
    .gradient_from_position(percentage(0.3))
    .gradient_to(rgb(0x54aeff))
    .gradient_to_position(percentage(0.3))
```

```tsx tabs
<View style={{ height: 120, borderRadius: 16, backgroundImage: "linear-gradient(135deg, #54aeff, #8250df)" }} />
<View style={{ backgroundImage: "radial-gradient(circle at top left, #fff8c5, #fd8c73)" }} />
<View style={{ backgroundImage: "conic-gradient(red, yellow, lime, aqua, blue, magenta, red)" }} />
<View style={{ backgroundImage: "linear-gradient(90deg, #8250df 0 12px, #54aeff 12px)" }} />
```

Las paradas de color se ubican con porcentajes o longitudes (`px`, `pt`, `rem`; los números simples son puntos) a lo largo de un degradado lineal o radial, y con porcentajes o ángulos (`deg`, `turn`, `rad`, `grad`) alrededor de uno cónico. Una parada con dos posiciones (`#8250df 0 12px`) es una banda de un solo color, igual que dos paradas en la misma posición. Las longitudes se miden a lo largo de la línea del degradado con el tamaño actual de la vista, así que una banda de 12px sigue midiendo 12px de ancho cuando la vista cambia de tamaño.

Los colores se mezclan entre paradas como en CSS: en el espacio que nombra el degradado (`linear-gradient(in oklab, …)`; también `srgb`, `srgb-linear`, `xyz`, `oklch` con un método de matiz como `longer hue`, y `hsl`), y en caso contrario en sRGB cuando todos los colores son hex, `rgb()`, `hsl()` o con nombre, y en Oklab cuando alguno es `oklch()`, `oklab()`, `lab()`, `lch()` o `color()`.

Los elementos de texto no dibujan degradados en iOS.

<a id="filters-and-blending"></a>

## Filtros y mezcla

| Propiedad | Valor | Rust |
|---|---|---|
| `filter` | Filtros CSS de la vista y su contenido: `brightness()`, `contrast()`, `grayscale()`, `hue-rotate()`, `invert()`, `saturate()`, `sepia()`, `opacity()`, `blur()`, `drop-shadow()` (sin color, en el color del texto, como en CSS); varios separados por espacios | `.brightness(n)`, `.contrast(n)`, `.grayscale(n)`, `.hue_rotate(angle)`, `.invert(n)`, `.saturate(n)`, `.sepia(n)`, `.blur(px(..))` |
| `backdropFilter` | Filtros de lo que hay detrás de la vista: `"blur(10px)"` (vidrio esmerilado) | `.backdrop_blur(px(10.0))`, `.backdrop_saturate(n)`, ... |
| `glassEffect` | `"regular"` o `"clear"` para el Liquid Glass de Apple en iOS 26 y macOS 26 y posteriores; `"none"` (el valor por defecto) usa `backdropFilter` | `.glass_effect(GlassEffect::Regular)` |
| `mixBlendMode` | Cómo se mezcla la vista con lo que hay detrás: `"multiply"`, `"screen"`, `"overlay"`, ... | `.mix_blend_mode(BlendMode::Multiply)` |

```rust tabs
image(photo).size(px(120.0)).grayscale(1.0).contrast(1.2)
view()
    .absolute()
    .bottom_0()
    .left_0()
    .right_0()
    .p_3()
    .bg(rgba(0xffffff66))
    .backdrop_blur(px(12.0))
```

```tsx tabs
<Image src={photo} style={{ width: 120, height: 120, filter: "grayscale(1) contrast(1.2)" }} />
<View style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: 12, backgroundColor: "rgba(255,255,255,0.4)", backdropFilter: "blur(12px)" }} />
```

La compatibilidad varía según la plataforma:

| | iOS | Android |
|---|---|---|
| `filter` en vistas | `opacity`, `brightness` hasta 1 y solo `drop-shadow` | Todos, desde Android 12 (API 31); solo filtros de color en versiones anteriores |
| `filter` en imágenes | Todos los filtros de color y `blur` | Igual que en vistas |
| `backdropFilter` | Un material de desenfoque del sistema, que aproxima el radio | Desde Android 12 (API 31) |
| `mixBlendMode` | Sí | Desde Android 10 (API 29) |

La web, Windows y Linux aplican todos los filtros a las vistas, macOS lo hace como iOS; GPUI dibuja los filtros de color y `drop-shadow()`. El filtro de fondo es un desenfoque en iOS, macOS y Android, y admite todos los filtros en la web y Windows; Linux y GPUI no dibujan ninguno, y GPUI dibuja las vistas en el modo de mezcla normal. De un `filter` con varios `drop-shadow()`, iOS, macOS y Android dibujan el último. `mixBlendMode` mezcla la vista con todo lo dibujado detrás de ella.

En iOS, `ios={{ backdropMaterial: "regular" }}` selecciona el material del sistema usado por un
desenfoque `backdropFilter`. Los valores son `"ultraThin"` (el valor por defecto), `"thin"`, `"regular"`, `"thick"`
y `"chrome"`. Combina la prop con un radio de desenfoque positivo para mostrar el material. Rust usa
`.backdrop_material(BackdropMaterial::Regular)` junto con `.backdrop_blur(px(30.0))`.
El radio aproxima la intensidad del material: NSH aplica una fracción del material elegido,
y alcanza la intensidad máxima a los 30 puntos. La variante clara u oscura sigue el color de fondo de la vista.
Estas opciones corresponden a los [materiales de desenfoque del sistema](https://developer.apple.com/documentation/uikit/uiblureffect/style/systemmaterial) de Apple.

```rust tabs
view().backdrop_blur(px(30.0)).backdrop_material(BackdropMaterial::Regular)
```

```tsx tabs
<View ios={{ backdropMaterial: "regular" }} style={{ height: 64, backdropFilter: "blur(30px)" }} />
```

`glassEffect` dibuja Liquid Glass detrás del contenido de una vista en iOS 26 y macOS 26 y posteriores. `"regular"` usa el material estándar;
`"clear"` toma menos color del fondo. Combínalo con `backdropFilter` para el desenfoque que se muestra en versiones anteriores de iOS
y en otras plataformas. El vidrio sigue el tamaño y las esquinas redondeadas de la vista.

```tsx
<View style={{ height: 80, borderRadius: 16, backdropFilter: "blur(12px)", glassEffect: "regular" }} />
```

<a id="outlines-opacity-and-visibility"></a>

## Contornos, opacidad y visibilidad

- `outlineWidth`, `outlineColor`, `outlineStyle`, `outlineOffset` (`.outline(..)`, `.outline_color(..)`, `.outline_dashed()`, `.outline_offset(..)`): una línea fuera del borde que no ocupa espacio (los desplazamientos negativos dibujan hacia dentro). `outlineStyle: "none"` (o `"hidden"`, `.outline_none()`) oculta el contorno sea cual sea su ancho, como en CSS.
- `opacity` (`.opacity(n)`): de 0 a 1, se aplica a la vista y a sus hijos.
- `visibility: "hidden"` (`.invisible()` en Rust): la vista no se dibuja pero conserva su espacio, y los lectores de pantalla la omiten junto con su subárbol, como en un navegador. `display: "none"` (`.hidden()`) la quita del layout.
- `zIndex` (`.z_index(n)`): el orden entre hermanos, también el orden de apilamiento nativo (estable para valores iguales).
- `cursor` (`.cursor(..)`, `.cursor_pointer()`): la forma del puntero sobre la vista, para punteros y escritorios.
<a id="transforms"></a>

## Transformaciones

Las transformaciones son las de CSS. En TSX, `translate`, `rotate` y `scale` son propiedades independientes, y `transform` acepta la cadena de funciones de CSS o una lista de pasos. Se componen en el orden de CSS, `translate`, luego `rotate`, luego `scale` y luego `transform`, sin importar el orden de las claves. En Rust, las transformaciones son métodos (`.translate_x(..)`, `.rotate(..)`, `.scale(..)`, ...) que se componen en el mismo orden:

```rust tabs
view().translate_x(px(20.0)).rotate(deg(-8.0)).scale(0.9)
view().perspective(px(600.0)).child(view().rotate_y(deg(35.0)).backface_hidden())
view().origin_top_left().rotate(deg(30.0))
```

```tsx tabs
<View style={{ translate: "20px 0", rotate: "-8deg", scale: 0.9 }} />
<View style={{ transform: "perspective(600px) rotateY(35deg)", backfaceVisibility: "hidden" }} />
<View style={{ transformOrigin: "top left", rotate: "30deg" }} />
```

| Propiedad | Valor |
|---|---|
| `translate` | `"10px 20px"`, `"-50% 0"` (porcentajes del tamaño propio de la vista), un número (puntos a lo largo de x) o `[x, y]` con un número, una cadena o un valor animado por eje |
| `rotate` | `"45deg"`, `"0.25turn"`, sobre un eje `"x 90deg"`, un número (grados) o un valor animado (grados) |
| `scale` | `1.5`, `"150%"`, `"1 2"` (x e y), un valor animado (ambos ejes) o `[x, y]` |
| `transform` | Funciones de CSS: `translate()`, `translateX()`, `translateY()`, `scale()`, `scaleX()`, `scaleY()`, `rotate()` / `rotateZ()`, `rotateX()`, `rotateY()`, `skew()`, `skewX()`, `skewY()`, `perspective()`; longitudes en `px` (las traslaciones también en `%`), ángulos en `deg`, `rad` o `turn`; `"none"`; o una lista de pasos (`[{ perspective: 800 }, { rotateY: angle }]`) cuyas cantidades pueden ser valores animados |

Cada una es una propiedad independiente, igual que con las clases: el `scale` de un estilo reemplaza una clase `scale-95` y conserva su `rotate-3`. Los valores animados mueven `translate`, `rotate` y `scale` de forma nativa. Para lo que la cadena de CSS no puede expresar con una cantidad animada, como una rotación 3D, pasa a `transform` una lista de pasos: `translateX`, `translateY`, `scale`, `scaleX`, `scaleY`, `rotate` (`rotateZ`), `rotateX`, `rotateY`, `skewX`, `skewY` y `perspective` ([Animación](./animation.md)). El `transform` de un estilo es de una forma o de la otra, así que una perspectiva antes de pasos animados es un paso más de la lista.

`.perspective(..)` en Rust es la propiedad `perspective` de CSS, como `perspective-*` de Tailwind: da profundidad a los hijos de la vista, mientras que la función `perspective()` de un `transform` se aplica a la transformación de la propia vista. `transformOrigin` acepta palabras clave, porcentajes y longitudes (`"top left"`, `"50% 0"`, `[10, 20]`; `.origin_top_left()`, `.transform_origin(..)` en Rust); el valor por defecto es el centro. Las transformaciones no afectan al layout: los elementos hermanos se colocan como si la vista no estuviera transformada.

Android no admite transformaciones skew.

<a id="transitions"></a>

## Transiciones

Una vista anima los cambios de su propio estilo cuando indicas qué animar. La animación se ejecuta de forma nativa; ninguna parte de tu código se ejecuta en cada fotograma.

```rust tabs
let open = signal(false);

view()
    .on_press(move || open.update(|o| *o = !*o))
    .w(px(150.0))
    .h(px(72.0))
    .rounded(move || px(if open.get() { 36.0 } else { 12.0 }))
    .bg(move || if open.get() { rgb(0x8250df) } else { rgb(0x54aeff) })
    .translate_x(move || px(if open.get() { 120.0 } else { 0.0 }))
    .transition_all()
    .duration(300.0)
    .ease_in_out()
```

```tsx tabs
<View
  onPress={() => open.set(!open())}
  style={{
    width: 150,
    height: 72,
    borderRadius: open() ? 36 : 12,
    backgroundColor: open() ? "#8250df" : "#54aeff",
    translate: open() ? 120 : 0,
    transitionProperty: "all",
    transitionDuration: 300,
    transitionTimingFunction: "ease-in-out",
  }}
/>
```

| Propiedad | Valor | Rust |
|---|---|---|
| `transitionProperty` | Qué se anima: `"all"`, o nombres separados por comas: colores (`"colors"`, `"backgroundColor"`, `"borderColor"`, ...), `"opacity"`, `"transform"` (todas las propiedades de transformación), `"boxShadow"`, `"borderRadius"` / `"borderWidth"` | `.transition()`, `.transition_all()`, `.transition_colors()`, `.transition_opacity()`, `.transition_transform()`, `.transition_shadow()` |
| `transitionDuration` | `300`, `"300ms"`, `"0.3s"` | `.duration(300.0)` |
| `transitionDelay` | Igual que la duración | `.delay(100.0)` |
| `transitionTimingFunction` | `"linear"`, `"ease"`, `"ease-in"`, `"ease-out"`, `"ease-in-out"`, `"cubic-bezier(x1, y1, x2, y2)"` | `.ease_linear()`, `.ease_in()`, `.ease_out()`, `.ease_in_out()`, `.ease_bezier(x1, y1, x2, y2)` |

Los tamaños y las posiciones son layout, no estilo, y no hacen transición; anima los cambios de layout con `LayoutAnimation` o controla los valores con animaciones nativas ([Animación](./animation.md)).

<a id="keyframe-animations"></a>

### Animaciones de fotogramas clave

`animationName` ejecuta de forma nativa una de las animaciones de fotogramas clave integradas de Tailwind: `"spin"`, `"ping"`, `"pulse"` o `"bounce"`, con `animationDuration`, `animationDelay`, `animationTimingFunction` y `animationIterationCount` (un número o `"infinite"`), en cualquier orden. En Rust, `.animate_spin()`, `.animate_ping()`, `.animate_pulse()` y `.animate_bounce()` las ejecutan con los tiempos de Tailwind, y `.animation(KeyframeAnimation::new(..))` con los tuyos:

```rust tabs
view()
    .size(px(24.0))
    .rounded(px(4.0))
    .bg(rgb(0x0969da))
    .animation(KeyframeAnimation::new(Keyframes::Spin).duration(1000.0).easing([0.0, 0.0, 1.0, 1.0]))
```

```tsx tabs
<View style={{ width: 24, height: 24, borderRadius: 4, backgroundColor: "#0969da", animationName: "spin", animationDuration: 1000, animationIterationCount: "infinite", animationTimingFunction: "linear" }} />
```

<a id="press-feedback"></a>

## Respuesta al pulsar

La respuesta al pulsar son los estilos de la app para el estado de pulsación, aplicados de forma nativa sin ir y volver a tu código; los estados hovered, focused y disabled aceptan estilos de la misma manera (`.hover(..)`, `.focus(..)`, `.disabled_style(..)` en Rust; `hoverStyle`, `focusStyle` y `disabledStyle`, o `hover:`, `focus:`, `disabled:`, en TSX):

| Rust | TSX | Efecto mientras se pulsa |
|---|---|---|
| `.active(\|s\| s.opacity(0.6))` | `activeStyle={{ opacity: 0.6 }}` | La vista se desvanece hasta esta opacidad |
| `.active(\|s\| s.bg(rgb(0xeaeef2)))` | `activeStyle={{ backgroundColor: "#eaeef2" }}` | El fondo adopta este color |
| `.ripple(Ripple { color: Some(rgba(0x00000022).into()), ..Ripple::default() })` | `android={{ ripple: { color: "#0002" } }}` | El efecto ripple de Material en Android |
| `.active(\|s\| s.bg(ZINC.shade(100)).scale(0.95))` | `class="active:bg-zinc-100 active:scale-95"` | Cualquier estilo |

Consulta [Toque y gestos](./touch-and-gestures.md).

<a id="extensions"></a>

## Extensiones

Estas claves y clases ofrecen lo que las plataformas nativas hacen más allá de CSS:

| Clave | Clase | Qué hace |
|---|---|---|
| `placeholderColor` | `placeholder:text-*` | El color del marcador de posición de un `<Input>` |
| `selectionColor` | `selection:bg-*` | El resaltado de selección de un `<Input>` o de un `<Text>` seleccionable |
| `tintColor` | `tint-*` | Vuelve a colorear los píxeles opacos de un `<Image>` (imágenes plantilla, iconos) |
| `borderCurve` | | `"continuous"`: esquinas que se suavizan hacia los bordes, como las del propio sistema (las esquinas continuas de Apple) |
| `glassEffect` | | El Liquid Glass de Apple detrás de la vista en iOS 26 y macOS 26, y `backdropFilter` en el resto |
| `writingDirection` | | La dirección base de un texto, `"auto"` (el valor por defecto: según su contenido, como hacen las vistas de texto de las plataformas), `"ltr"` o `"rtl"`; `direction` establece la del layout |
| `textAlignVertical` | | Dónde se coloca un texto más corto que su caja `<Text>`: `"top"` (el valor por defecto), `"center"` o `"bottom"` |
| `textAlign: "auto"` | | El lado natural del texto, según su dirección (el valor por defecto) |
| `selectedStyle` | `selected:` | El estilo mientras `accessibilityState.selected` es `true` (un `Button` seleccionado, una pestaña) |
| | `ios:`, `android:`, `web:` | Clases para una sola plataforma (`ios:pt-2`) |

Los valores que cambian también aceptan números donde CSS espera una cadena: `transform` como lista de pasos, `translate` y `scale` como `[x, y]`, `boxShadow` y `textShadow` como capas.

<a id="related"></a>

## Relacionado

- [Tailwind](./tailwind.md): los mismos estilos como clases, con variantes para modo oscuro, estados de pulsación y breakpoints, y sus equivalentes tipados.
- [Layout](./layout.md) y [Texto](./text.md).
- [Referencia de estilos](../modules/style-reference.md): cada propiedad de estilo y su tipo.
