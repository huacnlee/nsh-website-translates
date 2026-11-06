---
title: "Referencia de Tailwind"
description: "Todas las utilidades y variantes de Tailwind que NSH resuelve de forma nativa, la sintaxis de valores arbitrarios y cómo extender el tema en nsh.json."
order: 17
source_hash: 11bee6a70fb79c0f
---


# Referencia de Tailwind

Cada elemento acepta clases de Tailwind CSS en su prop `class` (y las condicionales en `classList`). NSH las resuelve en Rust con el tema por defecto de Tailwind 4: JS solo pasa la cadena, cada cadena distinta se analiza una sola vez y se guarda en caché, y variantes como `dark:` o `active:` se reevalúan de forma nativa cuando cambia la apariencia, el tamaño de la ventana o el estado de pulsación, sin ejecutar nada de JS.

Cada utilidad establece exactamente lo que Tailwind CSS 4 genera para ella, con el mismo significado que en un navegador. Esta página enumera lo que se admite. Para una introducción, consulta [Tailwind](../docs/tailwind.md); para las claves de estilo que establecen las utilidades, consulta la [Referencia de estilos](./style-reference.md).

Los componentes de Rust no reciben cadenas de clases: dan estilo a los elementos con los métodos tipados de `Styled` (`nsh_core::prelude`), que se llaman como estas utilidades y se resuelven a los mismos valores, incluidas las escalas por defecto de Tailwind (`px-4` es `.px_4()`, `rounded-2xl` `.rounded_2xl()`, `shadow-md` `.shadow_md()`, `bg-linear-to-br` `.bg_linear_to_br()`). Los colores son valores: colores del tema, o la paleta de Tailwind como `nsh_core::element::palette` (`ZINC.shade(800)` es `zinc-800`). Las variantes son métodos que reciben un closure de estilos: `.active(|s| …)`, `.hover(…)`, `.focus(…)`, `.disabled_style(…)`, `.dark(…)`, `.group_active(…)` y `.style_when(condition, …)` para el resto. La [Referencia de estilos](./style-reference.md) indica el método de cada clave de estilo.

```rust tabs
use nsh_core::{element::palette::{RED, ZINC}, prelude::*};

view()
    .flex_row()
    .items_center()
    .gap_3()
    .rounded_2xl()
    .bg(white())
    .p_4()
    .shadow_md()
    .active(|s| s.scale(0.98))
    .transition()
    .dark(|s| s.bg(ZINC.shade(800)))
    .child(
        text("Inbox")
            .text_base()
            .font_weight(FontWeight::SEMIBOLD)
            .text_color(ZINC.shade(900))
            .dark(|s| s.text_color(white())),
    )
    .child(
        text(move || unread.get().to_string())
            .text_color(move || if unread.get() > 0 { RED.shade(500) } else { ZINC.shade(400) }),
    )
```

```tsx tabs
<View class="flex-row items-center gap-3 rounded-2xl bg-white p-4 shadow-md active:scale-[0.98] transition dark:bg-zinc-800">
  <Text class="text-base font-semibold text-zinc-900 dark:text-white">Inbox</Text>
  <Text classList={{ "text-red-500": unread() > 0, "text-zinc-400": unread() === 0 }}>{unread()}</Text>
</View>
```

<a id="how-classes-combine"></a>

## Cómo se combinan las clases

- **Gana la última.** Entre utilidades del mismo nivel de variante, gana la que aparece más tarde en la cadena: `"p-4 p-2"` es `p-2`. Un componente puede recibir una prop `class` y añadirla a sus propias clases sin `tailwind-merge`.
- **Las variantes se aplican después de las utilidades simples**, en el orden de variantes de Tailwind: `group-*:` (por su estado, luego por nombre de grupo), `selection:`, `placeholder:`, posición (`first:` ...), `checked:`, `indeterminate:`, `selected:`, `focus-within:`, `hover:`, `focus:`, `focus-visible:`, `active:`, `enabled:`, `disabled:`, `aria-busy:`, `aria-checked:`, `aria-expanded:`, `aria-pressed:`, `aria-selected:`, `data-*:` (por nombre), movimiento, puntos de corte de `max-*:` del más ancho al más estrecho, luego puntos de corte ascendentes, orientación, dirección, `dark:` y, por último, plataforma. Decide la variante más alta de la clase, después la siguiente más alta, y una variante adicional va después (`dark:hover:` después de `dark:`), tal como las ordena Tailwind. Así, `"active:bg-red-500 bg-blue-500"` es rojo mientras está pulsado.
- **`style` gana sobre las clases.** El `style` en línea se aplica encima de las clases resueltas. Una clave de estilo es la propiedad CSS de su nombre, la que establecen las utilidades, así que reemplaza esa propiedad y nada más: `style={{ paddingLeft: 8 }}` se impone a `pl-4` y conserva `pr-4`. Una utilidad importante (`!p-4` o `p-4!`) también se impone al estilo en línea.
- **Los estilos de texto se heredan.** Las utilidades de texto en una vista (`text-white`, `font-bold`, `text-center`, ...) pasan a los elementos `<Text>` y `<Input>` que contiene, como en CSS.
- **El display es el de CSS.** `flex` y `inline-flex` producen una fila salvo que una utilidad de dirección indique otra cosa, esté donde esté en la cadena (`flex-col flex` es una columna). El `display: "flex"` de un estilo es una fila del mismo modo; las vistas que no establecen display mantienen la columna por defecto de NSH.

<a id="units-and-the-theme"></a>

## Unidades y tema

Las longitudes son puntos (`1` = un punto en iOS, un dp en Android). El `1rem` de Tailwind equivale a 16 puntos, de modo que el tema coincide con el de la web a la misma densidad: un paso de espaciado son 4 puntos (`p-4` = 16 puntos), `text-base` son 16 puntos.

<a id="spacing-values"></a>

### Valores de espaciado

Las utilidades que aceptan un valor de espaciado (padding, margin, gap, inset, width, height, `basis`, `translate`, `leading`) admiten:

| Valor | Ejemplo | Resultado |
|---|---|---|
| Pasos (se permiten cuartos de paso) | `p-4`, `gap-1.5`, `m-0.25` | paso × 4 puntos |
| `px` | `p-px`, `-mt-px` | 1 punto |
| `0` | `m-0` | 0 |
| Fracción (inset, width, height, `basis`, `translate`) | `w-1/2`, `left-1/3` | porcentaje del padre |
| `full` (equivalente) | `w-full`, `inset-full` | 100% |
| `auto` (margin, inset, width, height, basis) | `mx-auto`, `w-auto` | `"auto"` |
| Arbitrario | `p-[13px]`, `w-[42%]`, `mt-[1.5rem]` | la longitud indicada |

Los márgenes, los insets, `translate`, `rotate`, `skew`, `scale`, `z`, `hue-rotate`, `tracking`, `underline-offset`, `outline-offset`, las líneas de la cuadrícula y los ángulos de los degradados admiten un `-` inicial para valores negativos: `-mt-2`, `-translate-x-1/2`, `-rotate-6`. Tailwind no tiene forma negativa para el resto (`-p-4`, `-gap-2`, `-w-4`), y NSH tampoco.

<a id="colors"></a>

### Colores

La paleta completa de Tailwind 4 está incorporada: `red`, `orange`, `amber`, `yellow`, `lime`, `green`, `emerald`, `teal`, `cyan`, `sky`, `blue`, `indigo`, `violet`, `purple`, `fuchsia`, `pink`, `rose`, `slate`, `gray`, `zinc`, `neutral`, `stone`, `mauve`, `olive`, `mist`, `taupe`, cada uno en los tonos `50`, `100`–`900`, `950`; además de `black`, `white` y `transparent`. Tus propios colores provienen de `nsh.json` (consulta [Personalización del tema](#theme-customization)).

Toda utilidad de color admite:

| Forma | Ejemplo |
|---|---|
| Un color del tema | `bg-sky-500`, `text-brand` |
| Un modificador de opacidad (porcentaje) | `bg-black/50`, `ring-black/5` |
| Una opacidad arbitraria | `text-black/[0.35]` |
| Un color arbitrario | `bg-[#0ea5e9]`, `border-[rgb(0_0_0_/_0.1)]`, `text-[oklch(70%_0.2_50)]` |
| Un color arbitrario con modificador | `bg-[rgb(0_0_255)]/25` |

`currentColor` y `inherit` no son valores de color. Como en un navegador, un borde, un contorno o un anillo sin clase de color se dibuja con el color de texto del elemento, el propio o el que hereda (`<View class="text-white"><View class="border ring-2" /></View>` dibuja ambos en blanco), y lo mismo ocurre con un borde cuyo grosor establece la prop `style` sin color.

<a id="arbitrary-values"></a>

## Valores arbitrarios

Los corchetes pasan un valor que el tema no tiene: `w-[37px]`, `grid-cols-[200px_1fr]`, `bg-[linear-gradient(45deg,red,blue)]`.

- `_` representa un espacio (`grid-cols-[1fr_2fr]`); escribe `\_` para un guion bajo literal.
- Longitudes: un número sin unidad o `px` (puntos), `pt` (4/3 de punto, como en CSS), `rem` (16 puntos) y `%` donde los porcentajes tienen sentido.
- Ángulos (`rotate-[...]`, `hue-rotate-[...]`, `bg-linear-[...]`): `deg`, `rad`, `grad`, `turn`.
- Tiempos (`duration-[...]`, `delay-[...]`): `ms` o `s`; un número sin unidad son milisegundos.
- Las indicaciones de tipo resuelven valores ambiguos: `text-[length:22px]` es un tamaño, `text-[color:#333]` un color; `border-[length:3px]` igualmente.

Las propiedades CSS arbitrarias (`[mask-type:luminance]`) no se admiten.

## Layout

| Clase | Establece |
|---|---|
| `flex`, `inline-flex` | `display: "flex"`, y una fila salvo que haya una utilidad de dirección |
| `grid`, `inline-grid` | `display: "grid"` |
| `block`, `flow-root` | layout de bloque o un contexto de formato de bloque independiente |
| `box-border`, `box-content` | las dimensiones incluyen bordes y padding, o solo el contenido |
| `w/h/size-min`, `w/h/size-max`, `w/h/size-fit` | tamaños intrínsecos de Taffy: `min-content`, `max-content`, `fit-content` |
| `inline`, `inline-block` | `display: "block"`: lo que un navegador calcula para ellos en un padre flex o grid |
| `hidden` | `display: "none"` |
| `relative`, `absolute` | `position` |
| `static` | `position: "static"`: en el flujo, sus insets se ignoran; los descendientes absolutos usan su ancestro posicionado más cercano |
| `sticky` | `position: "sticky"`: en el flujo, se queda pegado en `top` (`left` en una vista de scroll horizontal) dentro de la vista de scroll que lo rodea mientras su padre está visible |
| `fixed` | `position: "fixed"`: un elemento dispuesto en la caja de su vista raíz (la ventana o su modal) por encima de los hijos de esa vista raíz, que permanece en su sitio mientras lo que lo rodea se desplaza |
| `inset-<n>`, `inset-x-<n>`, `inset-y-<n>` | `top` / `right` / `bottom` / `left` |
| `top-<n>`, `right-<n>`, `bottom-<n>`, `left-<n>` | el desplazamiento correspondiente |
| `start-<n>`, `end-<n>` | `start` / `end` (según la dirección) |
| `z-<n>`, `z-auto`, `z-[<n>]` | `zIndex` (`z-auto` es 0) |
| `visible` | `visibility: "visible"` |
| `invisible`, `collapse` | `visibility: "hidden"` (conserva su espacio) |
| `overflow-hidden`, `overflow-clip`, `overflow-x-hidden`, `overflow-y-hidden` | `overflow: "hidden"` |
| `overflow-visible` | `overflow: "visible"` |
| `aspect-square`, `aspect-video`, `aspect-<a>/<b>`, `aspect-[<a>/<b>]`, `aspect-auto` | `aspectRatio` (1, 16/9, a/b, none) |

El scroll es un elemento, no una clase: `overflow-auto` y `overflow-scroll` no se admiten; usa [scroll](../elements/scroll.md).

<a id="flexbox-and-grid"></a>

## Flexbox y grid

| Clase | Establece |
|---|---|
| `flex-row`, `flex-row-reverse`, `flex-col`, `flex-col-reverse` | `flexDirection` |
| `flex-wrap`, `flex-wrap-reverse`, `flex-nowrap` | `flexWrap` |
| `flex-1` | grow 1, shrink 1, basis 0 |
| `flex-<n>` | grow n, shrink 1, basis 0 |
| `flex-auto` | grow 1, shrink 1, basis auto |
| `flex-initial` | grow 0, shrink 1, basis auto |
| `flex-none` | grow 0, shrink 0, basis auto |
| `flex-[<grow>]`, `flex-[<grow>_<shrink>_<basis>]` | la forma abreviada de CSS: `flex-[2]`, `flex-[3_0_50%]` |
| `grow`, `grow-<n>`, `grow-[<n>]` | `flexGrow` (sin valor: 1) |
| `shrink`, `shrink-<n>`, `shrink-[<n>]` | `flexShrink` (sin valor: 1) |
| `basis-<n>` | `flexBasis` (espaciado, fracción, `full`, `auto`, arbitrario) |
| `justify-start`, `justify-end`, `justify-center`, `justify-between`, `justify-around`, `justify-evenly`, `justify-stretch`, `justify-normal` | `justifyContent` |
| `items-start`, `items-end`, `items-center`, `items-baseline`, `items-stretch` | `alignItems` |
| `self-auto`, `self-start`, `self-end`, `self-center`, `self-stretch`, `self-baseline` | `alignSelf` |
| `content-start`, `content-end`, `content-center`, `content-between`, `content-around`, `content-evenly`, `content-stretch`, `content-normal` | `alignContent` |
| `justify-items-start`, `-end`, `-center`, `-stretch`, `-normal` | `justifyItems` |
| `justify-self-auto`, `-start`, `-end`, `-center`, `-stretch` | `justifySelf` |
| `place-content-center`, `-start`, `-end`, `-between`, `-stretch` | `alignContent` y `justifyContent` |
| `place-items-center`, `-start`, `-end`, `-stretch` | `alignItems` y `justifyItems` |
| `place-self-auto`, `-center`, `-start`, `-end`, `-stretch` | `alignSelf` y `justifySelf` |
| `gap-<n>`, `gap-x-<n>`, `gap-y-<n>` | `gap`, `columnGap`, `rowGap` |
| `space-x-<n>`, `space-y-<n>` (y negativos) | un margen en cada hijo salvo el último: el margen final (`space-x`) o el inferior (`space-y`), por debajo de los márgenes propios del hijo, como en Tailwind CSS; se suma a un `gap` |
| `space-x-reverse`, `space-y-reverse` | el margen en el lado inicial / superior en su lugar (hijos en orden inverso) |
| `grid-cols-<n>` | `gridTemplateColumns: "repeat(n, minmax(0, 1fr))"` |
| `grid-cols-[<tracks>]`, `grid-cols-none` | `gridTemplateColumns` (`grid-cols-[200px_1fr]`) |
| `grid-rows-<n>`, `grid-rows-[<tracks>]`, `grid-rows-none` | `gridTemplateRows` |
| `col-span-<n>`, `col-span-full`, `col-auto`, `col-<n>`, `col-[<value>]` | `gridColumn` |
| `col-start-<n>`, `col-end-<n>` (y `-auto`) | `gridColumnStart`, `gridColumnEnd` |
| `row-span-<n>`, `row-span-full`, `row-auto`, `row-<n>`, `row-[<value>]` | `gridRow` |
| `row-start-<n>`, `row-end-<n>` (y `-auto`) | `gridRowStart`, `gridRowEnd` |
| `grid-flow-row`, `grid-flow-col`, `grid-flow-dense`, `grid-flow-row-dense`, `grid-flow-col-dense` | `gridAutoFlow` |
| `auto-cols-auto`, `-min`, `-max`, `-fr`, `auto-cols-[<track>]` | `gridAutoColumns` |
| `auto-rows-auto`, `-min`, `-max`, `-fr`, `auto-rows-[<track>]` | `gridAutoRows` |

<a id="spacing"></a>

## Espaciado

| Clase | Establece |
|---|---|
| `p-<n>`, `px-<n>`, `py-<n>` | `padding`, `paddingHorizontal`, `paddingVertical` |
| `pt-<n>`, `pr-<n>`, `pb-<n>`, `pl-<n>` | `paddingTop` / `Right` / `Bottom` / `Left` |
| `ps-<n>`, `pe-<n>` | `paddingStart`, `paddingEnd` (según la dirección) |
| `m-<n>`, `mx-<n>`, `my-<n>` | `margin`, `marginHorizontal`, `marginVertical` |
| `mt-<n>`, `mr-<n>`, `mb-<n>`, `ml-<n>` | `marginTop` / `Right` / `Bottom` / `Left` |
| `ms-<n>`, `me-<n>` | `marginStart`, `marginEnd` (según la dirección) |

<a id="sizing"></a>

## Tamaño

| Clase | Establece |
|---|---|
| `w-<n>`, `h-<n>` | `width`, `height` (espaciado, fracción, `full`, `auto`, arbitrario) |
| `size-<n>` | `width` y `height` |
| `min-w-<n>`, `max-w-<n>`, `min-h-<n>`, `max-h-<n>` | el límite correspondiente |
| `w-screen`, `w-dvw`, `w-svw`, `w-lvw` | el ancho de la ventana (también en `min-w-` / `max-w-`) |
| `h-screen`, `h-dvh`, `h-svh`, `h-lvh` | el alto de la ventana (también en `min-h-` / `max-h-`) |
| `w-auto`, `h-auto` | `auto` (dimensionado según el contenido) |
| `max-w-none`, `max-h-none` | sin límite |
| `w-<container>`, `min-w-<container>`, `max-w-<container>` | un ancho de contenedor (a continuación) |

Anchos de contenedor (puntos): `3xs` 256, `2xs` 288, `xs` 320, `sm` 384, `md` 448, `lg` 512, `xl` 576, `2xl` 672, `3xl` 768, `4xl` 896, `5xl` 1024, `6xl` 1152, `7xl` 1280; `prose` es 65 veces el ancho del `0` de la fuente del elemento (el `65ch` de CSS), como en Tailwind CSS.

<a id="typography"></a>

## Tipografía

<a id="font"></a>

### Fuente

| Clase | Establece |
|---|---|
| `font-sans` | la fuente del sistema |
| `font-serif`, `font-mono` | `fontFamily: "serif"` / `"monospace"` |
| `font-thin` (100), `font-extralight` (200), `font-light` (300), `font-normal` (400), `font-medium` (500), `font-semibold` (600), `font-bold` (700), `font-extrabold` (800), `font-black` (900) | `fontWeight` |
| `font-[<weight>]`, `font-[<family>]` | un peso numérico; en caso contrario, una familia: `font-[650]`, `font-[Inter]` |
| `italic`, `not-italic` | `fontStyle` |
| `normal-nums`, `small-caps`, `oldstyle-nums`, `lining-nums`, `tabular-nums`, `proportional-nums` | `fontVariant` (se combinan; `normal-nums` restablece las formas numéricas) |

<a id="size-color-and-line-height"></a>

### Tamaño, color y altura de línea

`text-<size>` establece el tamaño de fuente y la altura de línea correspondiente de Tailwind, que una clase `leading-*` reemplaza esté donde esté en la cadena y sea cual sea su variante (`leading-tight md:text-lg` conserva el interlineado ajustado):

| Clase | Tamaño | Altura de línea |
|---|---|---|
| `text-xs` | 12 | 16 |
| `text-sm` | 14 | 20 |
| `text-base` | 16 | 24 |
| `text-lg` | 18 | 28 |
| `text-xl` | 20 | 28 |
| `text-2xl` | 24 | 32 |
| `text-3xl` | 30 | 36 |
| `text-4xl` | 36 | 40 |
| `text-5xl` | 48 | 1× |
| `text-6xl` | 60 | 1× |
| `text-7xl` | 72 | 1× |
| `text-8xl` | 96 | 1× |
| `text-9xl` | 128 | 1× |

| Clase | Establece |
|---|---|
| `text-<size>/<leading>` | tamaño y altura de línea: `text-sm/6` (24 puntos), `text-lg/tight` |
| `text-[<length>]` | `fontSize`: `text-[22px]`, `text-[length:22px]` |
| `text-<color>` | `color` |
| `leading-none` (1), `leading-tight` (1.25), `leading-snug` (1.375), `leading-normal` (1.5), `leading-relaxed` (1.625), `leading-loose` (2) | `lineHeight` como múltiplo del tamaño de fuente |
| `leading-<n>`, `leading-[<length>]` | `lineHeight` en puntos (`leading-6` = 24) |
| `leading-[<number>]` | `lineHeight` como múltiplo del tamaño de fuente (`leading-[1.5]`), heredado como ese multiplicador; `em` y `%` calculan una longitud con el tamaño de fuente del elemento antes de la herencia |
| `tracking-tighter` (-0.05em), `tracking-tight` (-0.025em), `tracking-normal` (0), `tracking-wide` (0.025em), `tracking-wider` (0.05em), `tracking-widest` (0.1em) | `letterSpacing` relativo al tamaño de fuente |
| `tracking-[<value>]` | `letterSpacing`: `tracking-[0.2em]`, `tracking-[1px]` |

<a id="alignment-case-and-wrapping"></a>

### Alineación, mayúsculas y ajuste de línea

| Clase | Establece |
|---|---|
| `text-left`, `text-center`, `text-right`, `text-justify` | `textAlign` |
| `text-start`, `text-end` | `textAlign: "start"` / `"end"`: el inicio o el final de la línea según la dirección del layout |
| `align-baseline`, `align-text-top`, `align-text-bottom`, `align-middle` | `verticalAlign` (vistas e imágenes dentro de un texto) |
| `uppercase`, `lowercase`, `capitalize`, `normal-case` | `textTransform` |
| `truncate` | una línea, puntos suspensivos al final, sin ajuste de línea, `overflow: hidden` (en una vista: sus textos no se ajustan) |
| `line-clamp-<n>`, `line-clamp-none` | `numberOfLines` (`none` muestra todas las líneas) |
| `text-ellipsis`, `text-clip` | `textOverflow: "ellipsis"` / `"clip"` |
| `whitespace-nowrap`, `text-nowrap` | las líneas nunca se ajustan; en una vista, las líneas de los textos que contiene (heredado, como el `white-space` de CSS) |
| `whitespace-normal`, `text-wrap`, `text-balance`, `text-pretty` | las líneas se ajustan (no se realiza el balanceo) |
| `select-text`, `select-none` | `userSelect: "text"` / `"none"`; en una vista, de los textos que contiene y que no establecen ninguno |
| `select-auto` | `userSelect: "auto"`: decide la vista que lo rodea, como el `user-select: auto` de CSS (`select-none md:select-auto`) |
<a id="decoration-and-shadow"></a>

### Decoración y sombra

| Clase | Establece |
|---|---|
| `underline`, `line-through`, `no-underline` | `textDecorationLine` |
| `decoration-solid`, `decoration-double`, `decoration-dotted`, `decoration-dashed`, `decoration-wavy` | `textDecorationStyle` |
| `decoration-<n>`, `decoration-[<length>]` | `textDecorationThickness` |
| `decoration-auto`, `decoration-from-font` | `textDecorationThickness: "auto"` |
| `decoration-<color>` | `textDecorationColor` |
| `underline-offset-<n>`, `underline-offset-[<length>]`, `underline-offset-auto` | `textUnderlineOffset` |
| `text-shadow-2xs`, `-xs`, `-sm`, `-md`, `-lg`; `/<alpha>` | una sombra de texto del tema (una sola capa: la más ancha de las del tema); el modificador es el alfa de las capas: `text-shadow-md/20` |
| `text-shadow-<color>`, `text-shadow-current` | su color, con el alfa del tamaño |
| `text-shadow-none` | la elimina |

Las sombras de texto de Tailwind tienen varias capas; de forma nativa se dibuja una sola sombra, la capa más ancha.

### Inputs

| Clase | Establece |
|---|---|
| `placeholder:text-<color>` | `placeholderColor` |
| `selection:bg-<color>` | `selectionColor` (el resaltado de la selección de un input o de un texto seleccionable, y de los que están dentro del elemento) |
| `caret-<color>` | el color del cursor |

<a id="backgrounds"></a>

## Fondos

| Clase | Establece |
|---|---|
| `bg-<color>` | `backgroundColor` |
| `bg-[<gradient>]` | `backgroundImage`: `bg-[linear-gradient(45deg,red,blue)]`, `bg-[radial-gradient(...)]` |
| `bg-linear-to-t`, `-tr`, `-r`, `-br`, `-b`, `-bl`, `-l`, `-tl` | un degradado lineal hacia un lado o una esquina (`bg-gradient-to-*` es el nombre en v3) |
| `bg-linear-<angle>`, `bg-linear-[<angle>]` | un degradado lineal con un ángulo: `bg-linear-45`, `-bg-linear-12`, `bg-linear-[0.25turn]` |
| `bg-radial` | un degradado radial desde el centro |
| `bg-conic`, `bg-conic-<angle>` | un degradado cónico, que opcionalmente empieza en un ángulo |
| `from-<color>`, `via-<color>`, `to-<color>` | las paradas del degradado (por defecto transparentes en los extremos) |
| `from-<p>%`, `via-<p>%`, `to-<p>%` | posiciones de las paradas: `via-40%`, `from-[15%]` |
| `bg-none` | elimina el degradado |

Las utilidades de degradado mezclan sus colores en Oklab, tal como las escribe Tailwind CSS (`in oklab`); en una posición arbitraria (`bg-linear-[25deg]`, `bg-conic-[0.25turn]`) siguen el comportamiento por defecto de CSS: Oklab con los colores de la paleta y sRGB cuando todas las paradas son colores hexadecimales, `rgb()`, `hsl()` o colores con nombre.

```rust tabs
view()
    .h_32()
    .rounded_2xl()
    .bg_linear_to_br()
    .gradient_from(INDIGO.shade(500))
    .gradient_via(PURPLE.shade(500))
    .gradient_via_position(percentage(0.4))
    .gradient_to(PINK.shade(500))
```

```tsx tabs
<View class="h-32 rounded-2xl bg-linear-to-br from-indigo-500 via-purple-500 via-40% to-pink-500" />
```

<a id="borders"></a>

## Bordes

| Clase | Establece |
|---|---|
| `border`, `border-<n>`, `border-[<length>]` | `borderWidth` (sin valor: 1) |
| `border-x`, `border-y`, `border-t`, `border-r`, `border-b`, `border-l`, `border-s`, `border-e` (con `-<n>` o sin valor) | los anchos de los lados correspondientes |
| `border-<color>`, `border-t-<color>`, ... | `borderColor` y los colores por lado |
| `border-solid`, `border-dashed`, `border-dotted` | `borderStyle` |
| `border-none`, `border-hidden` | `borderStyle: "none"` / `"hidden"`: sin borde sea cual sea la clase de ancho, en cualquier orden (`md:border-solid` lo muestra de nuevo) |
| `rounded`, `rounded-<size>`, `rounded-none`, `rounded-full`, `rounded-[<length>]` | `borderRadius` (sin valor: `sm`) |
| `rounded-t-`, `-r-`, `-b-`, `-l-`, `-tl-`, `-tr-`, `-br-`, `-bl-` | las esquinas correspondientes |
| `rounded-s-`, `-e-`, `-ss-`, `-se-`, `-es-`, `-ee-` | esquinas de inicio / fin (según la dirección): `borderTopStartRadius`, `borderTopEndRadius`, `borderBottomStartRadius`, `borderBottomEndRadius` |
| `outline`, `outline-<n>`, `outline-[<length>]` | `outlineWidth` (sin valor: 1), sólido salvo que haya una clase de estilo en cualquier parte de la cadena (`outline-dashed outline-2` es discontinuo, `outline-none outline-2` no dibuja nada) |
| `outline-<color>` | `outlineColor` |
| `outline-solid`, `outline-dashed`, `outline-dotted`, `outline-none`, `outline-hidden` | `outlineStyle`; un estilo solo equivale al ancho medium de CSS, 3 puntos |
| `outline-offset-<n>`, `outline-offset-[<length>]` | `outlineOffset` |

Tamaños de radio (puntos): `xs` 2, `sm` 4, `md` 6, `lg` 8, `xl` 12, `2xl` 16, `3xl` 24, `4xl` 32, `full` 9999.

<a id="rings"></a>

### Anillos

Los anillos son sombras de caja con propagación (spread), dibujadas fuera del borde sin ocupar espacio.

| Clase | Establece |
|---|---|
| `ring`, `ring-<n>`, `ring-[<length>]` | un anillo de ese ancho (sin valor: 1) |
| `ring-<color>` | su color (por defecto, el color del texto del elemento) |
| `ring-inset` | dibuja el anillo por dentro |
| `ring-offset-<n>`, `ring-offset-<color>` | un espacio entre el elemento y el anillo (por defecto blanco) |
| `inset-ring`, `inset-ring-<n>`, `inset-ring-<color>` | un anillo interior |

<a id="effects"></a>

## Efectos

| Clase | Establece |
|---|---|
| `shadow-2xs`, `shadow-xs`, `shadow-sm`, `shadow`, `shadow-md`, `shadow-lg`, `shadow-xl`, `shadow-2xl`; `/<alpha>` | `boxShadow` del tema; el modificador es el alfa de las capas: `shadow-xl/20` |
| `shadow-[<box-shadow>]` | una sombra arbitraria: `shadow-[0_8px_24px_rgb(0_0_0_/_0.12)]` |
| `shadow-<color>`, `shadow-current` | cambia el color de las capas de la sombra, con el alfa del tamaño: `shadow-indigo-500/40` |
| `shadow-none` | sin sombra |
| `inset-shadow-2xs`, `-xs`, `-sm`, `inset-shadow`, `inset-shadow-[...]`, `inset-shadow-<color>`, `inset-shadow-none` | una sombra interior |
| `opacity-<n>`, `opacity-[<value>]` | `opacity`: `opacity-50` = 0.5 |
| `mix-blend-<mode>` | `mixBlendMode`: `normal`, `multiply`, `screen`, `overlay`, `darken`, `lighten`, `color-dodge`, `color-burn`, `hard-light`, `soft-light`, `difference`, `exclusion`, `hue`, `saturation`, `color`, `luminosity`, `plus-darker`, `plus-lighter` |

Las sombras, los anillos y las sombras interiores se combinan en una sola lista `boxShadow`, como en CSS. El color de una sombra reemplaza el color de cada capa, también su alfa, igual que `--tw-shadow-color` de Tailwind: `shadow-md shadow-red-500` es una sombra roja opaca, `shadow-md/20 shadow-red-500` una al 20 %.

<a id="filters"></a>

## Filtros

| Clase | Establece |
|---|---|
| `blur`, `blur-xs` (4), `-sm` (8), `-md` (12), `-lg` (16), `-xl` (24), `-2xl` (40), `-3xl` (64), `blur-none`, `blur-[<length>]` | `blur()` |
| `brightness-<n>`, `contrast-<n>`, `saturate-<n>` | factores porcentuales: `brightness-125` = 1.25 |
| `grayscale`, `grayscale-<n>`, `invert`, `invert-<n>`, `sepia`, `sepia-<n>` | sin valor: 100 % |
| `hue-rotate-<deg>`, `-hue-rotate-<deg>` | `hue-rotate()` |
| `drop-shadow`, `drop-shadow-xs`, `-sm`, `-md`, `-lg`, `-xl`, `-2xl`, `drop-shadow-[...]`, `drop-shadow-none`; `drop-shadow-<color>`, `drop-shadow-current`; `/<alpha>` en cualquiera de los dos | un `drop-shadow()` por capa, después de los demás filtros; un color reemplaza el de las capas, con el alfa del tamaño; la web, Linux, Windows y GPUI dibujan todas las capas, iOS, macOS y Android la más ancha |
| `drop-shadow-none` | lo elimina |
| `filter-none` | elimina todos los filtros |
| `backdrop-blur`, `backdrop-blur-<size>`, `backdrop-blur-[<length>]` | desenfoca lo que hay detrás de la vista |
| `backdrop-brightness-<n>`, `backdrop-contrast-<n>`, `backdrop-grayscale`, `backdrop-hue-rotate-<deg>`, `backdrop-invert`, `backdrop-opacity-<n>`, `backdrop-saturate-<n>`, `backdrop-sepia` | filtros de fondo (backdrop) |
| `backdrop-filter-none` | los elimina |

> [!WARNING]
> iOS aplica solo `opacity`, `brightness` hasta 1 y `drop-shadow` a las vistas; `<Image>` admite todos los filtros de color y `blur`. Android necesita API 31 para `blur`, `drop-shadow` y el desenfoque de fondo. Consulta la [Referencia de estilos](./style-reference.md#filters-and-blending).

<a id="transforms"></a>

## Transformaciones

| Clase | Establece |
|---|---|
| `translate-x-<n>`, `translate-y-<n>`, `translate-<n>` | `translate` (espaciado, `full`, fracciones del tamaño propio del elemento: `-translate-x-1/2`, arbitrario) |
| `rotate-<deg>`, `rotate-[<angle>]` | `rotate` |
| `rotate-x-<deg>`, `rotate-y-<deg>`, `rotate-z-<deg>` | rotación 3D (en `transform`, después de la traslación, la rotación y la escala) |
| `scale-<pct>`, `scale-x-<pct>`, `scale-y-<pct>`, `scale-[<factor>]` | `scale`: `scale-95` = 0.95, `-scale-x-100` refleja |
| `skew-<deg>`, `skew-x-<deg>`, `skew-y-<deg>` | inclinación (skew), en `transform` (no en Android) |
| `perspective-dramatic` (100), `-near` (300), `-normal` (500), `-midrange` (800), `-distant` (1200), `perspective-[<length>]`, `perspective-none` | profundidad para las rotaciones 3D de los hijos del elemento, vistas desde su centro (`perspective` de CSS: `<View class="perspective-near"><View class="rotate-y-45" /></View>`) |
| `origin-center`, `-top`, `-top-right`, `-right`, `-bottom-right`, `-bottom`, `-bottom-left`, `-left`, `-top-left`, `origin-[<value>]` | `transformOrigin` |
| `backface-hidden`, `backface-visible` | `backfaceVisibility` |
| `transform-none` | elimina las rotaciones 3D y las inclinaciones (`transform: none` de CSS) |
| `translate-none`, `rotate-none`, `scale-none` | elimina la traslación, la rotación, la escala |

Las utilidades de transformación se componen como en CSS: `translate-*`, `rotate-*` y `scale-*` establecen las propiedades `translate`, `rotate` y `scale` y se combinan sin importar el orden; después se aplica `transform` (`rotate-x-*`, `skew-*`). Las claves del prop `style` con los mismos nombres reemplazan solo su propia propiedad: `style={{ scale: 1.1 }}` reemplaza `scale-95` y conserva `rotate-3`. `transform`, `transform-gpu`, `transform-cpu` y `transform-flat` se aceptan y no hacen nada: NSH compone todas las transformaciones por igual, en plano. Las traslaciones por una fracción del tamaño se resuelven con respecto al frame del elemento y lo siguen cuando cambia de tamaño.

<a id="transitions-and-animation"></a>

## Transiciones y animación

| Clase | Establece |
|---|---|
| `transition` | colores, opacidad, sombra y transformación; 150 ms, `cubic-bezier(0.4, 0, 0.2, 1)` |
| `transition-all`, `transition-colors`, `transition-opacity`, `transition-shadow`, `transition-transform` | las propiedades animadas |
| `transition-none` | sin transición |
| `duration-<ms>`, `duration-[<time>]` | `transitionDuration`: `duration-300`, `duration-[0.4s]` |
| `delay-<ms>`, `delay-[<time>]` | `transitionDelay` |
| `ease-linear`, `ease-in`, `ease-out`, `ease-in-out`, `ease-initial`, `ease-[cubic-bezier(...)]` | `transitionTimingFunction` |
| `animate-spin`, `animate-ping`, `animate-pulse`, `animate-bounce` | una animación nativa por fotogramas clave, repetida indefinidamente |
| `animate-none` | la detiene |

Las transiciones se ejecutan en el hilo de la UI cuando cambia un valor, incluso cuando una variante empieza o deja de coincidir, de modo que `transition active:scale-95` anima la pulsación sin JS. Envuelve las animaciones en `motion-safe:` para respetar el ajuste de reducción de movimiento.

<a id="interactivity"></a>

## Interactividad

| Clase | Establece |
|---|---|
| `pointer-events-none`, `pointer-events-auto` | `pointerEvents: "none"` / `"auto"`: si la vista es un destino para los toques y el puntero, heredado como en CSS: dentro de una vista `pointer-events-none`, una vista `pointer-events-auto` vuelve a ser un destino |
| `cursor-<name>`, `cursor-[<name>]` | `cursor`: `cursor-pointer`, `cursor-grab`, `cursor-not-allowed`, ... (todas las palabras clave de cursor de CSS) |
| `select-none`, `select-text`, `select-auto` | selección de texto (consulta Tipografía) |

## SVG

| Clase | Establece |
|---|---|
| `fill-<color>`, `fill-none`, `fill-current`, `fill-inherit` | `fill` (`fill-current` es `currentColor`) |
| `stroke-<color>`, `stroke-none`, `stroke-current`, `stroke-inherit` | `stroke` |
| `stroke-<number>`, `stroke-[<length>]` | `strokeWidth` |

<a id="images"></a>

## Imágenes

| Clase | Establece |
|---|---|
| `object-cover`, `object-contain`, `object-fill`, `object-none`, `object-scale-down` | `objectFit` (`fill` estira, `none` conserva el tamaño natural, colocado en `objectPosition`, `scale-down` es igual, reducido para que quepa donde es más grande); imágenes y vídeos |
| `object-top`, `object-bottom`, `object-left`, `object-right`, `object-center`, `object-top-left`, `object-top-right`, `object-bottom-left`, `object-bottom-right`, `object-[<position>]` | `objectPosition` (`object-left-top`, ... equivalen a `object-top-left`, ...) |
| `tint-<color>` | `tintColor` (cambia el color de las imágenes de plantilla) |

<a id="accepted-without-effect"></a>

## Aceptadas sin efecto

Estas utilidades son indicaciones de renderizado, o lo que ya es toda vista nativa; se analizan sin advertencia y no cambian nada: `antialiased`, `subpixel-antialiased`, `isolation-auto`, `box-border`, `appearance-none`, `appearance-auto`, `will-change-auto`, `will-change-scroll`, `will-change-contents`, `will-change-transform`, `will-change-[<value>]`, `transform`, `transform-gpu`, `transform-cpu`, `transform-flat`. El desplazamiento, el snapping y el overscroll son props de [scroll](../elements/scroll.md).

<a id="not-supported"></a>

## No compatibles

Las variantes `peer-*`, los pseudoelementos (`before:`, `after:`), las propiedades arbitrarias (`[prop:value]`), `overflow-auto` / `overflow-scroll`, `divide-*`, `columns-*`, `float-*`, `container`, las container queries, `order-*`, `transform-3d`, `select-all`, `border-double` / `outline-double`, las restricciones intrínsecas de mínimo/máximo (como `max-w-max`), `snap-*`, `scroll-*`, `overscroll-*`, `touch-*` y `isolate` son clases desconocidas. `nsh build` y `nsh dev` avisan de las clases desconocidas que encuentran en tu código fuente (`file:line:col: unknown class '...'`), y el runtime registra cada clase desconocida una sola vez.

<a id="variants"></a>

## Variantes

Las variantes hacen que una utilidad sea condicional: `dark:bg-zinc-900`, `md:flex-row`, `active:opacity-70`. Se pueden apilar (`dark:active:bg-zinc-700`) y se evalúan de forma nativa cada vez que cambia aquello de lo que dependen.

<a id="appearance-and-environment"></a>

### Apariencia y entorno

| Variante | Se aplica cuando | Rust |
|---|---|---|
| `dark:` | la apariencia es oscura | `.dark(\|s\| …)` |
| `ios:` | se ejecuta en iOS o Mac Catalyst | `.when(os() == Os::Ios, …)` |
| `android:` | se ejecuta en Android | `.when(os() == Os::Android, …)` |
| `portrait:`, `landscape:` | la ventana es más alta que ancha / más ancha que alta | `.style_when(move \|\| window().height > window().width, …)` |
| `ltr:`, `rtl:` | la dirección del layout | `.style_when(rtl, …)` |
| `motion-safe:`, `motion-reduce:` | el usuario no ha pedido / ha pedido reducir el movimiento | `.style_when(reduce_motion, …)` |

### Breakpoints

Los breakpoints comparan el ancho de la ventana en puntos.

| Variante | Ancho mínimo |
|---|---|
| `sm:` | 640 |
| `md:` | 768 |
| `lg:` | 1024 |
| `xl:` | 1280 |
| `2xl:` | 1536 |

| Forma | Ejemplo | Se aplica cuando |
|---|---|---|
| `<bp>:` | `md:p-8` | ancho ≥ breakpoint |
| `max-<bp>:` | `max-md:p-1` | ancho < breakpoint |
| `min-[<length>]:` | `min-[600px]:grid-cols-3` | ancho ≥ la longitud |
| `max-[<length>]:` | `max-[400px]:text-sm` | ancho < la longitud |

Un teléfono en vertical (390 puntos de ancho) no coincide con ninguno de los breakpoints por defecto; una tableta o un teléfono en horizontal coincide con varios. En Rust, un breakpoint es una condición sobre la ventana: `.style_when(move || window().width >= px(768.0), |s| s.p_8())` es `md:p-8`.

<a id="interaction-states"></a>

### Estados de interacción

La plataforma sigue los estados solo en los elementos cuyas clases los usan, y los cambios se aplican de forma nativa, sin ida y vuelta a JS.

| Variante | Se aplica cuando | Rust |
|---|---|---|
| `active:` | el elemento está pulsado | `.active(\|s\| …)` |
| `hover:` | un puntero está sobre él (puntero de iPad, Mac Catalyst, ratón en Android) | `.hover(\|s\| …)` |
| `focus:`, `focus-visible:` | el input tiene el foco | `.focus(\|s\| …)` |
| `focus-within:` | el elemento o un descendiente tiene el foco (el contenido de un `Overlay` es un descendiente del elemento en el que está) | `.focus_within(…)` |
| `disabled:` | el elemento tiene el prop `disabled` | `.disabled_style(\|s\| …)` |
| `enabled:` | el elemento no tiene el prop `disabled` |  |
| `selected:` | el elemento está seleccionado: `selected` de un `Button`, o `accessibilityState.selected` |  |
| `checked:` | el elemento está marcado: `accessibilityState.checked` es `true` (`"mixed"` no está marcado) |  |
| `indeterminate:` | el elemento está indeterminado: `accessibilityState.checked` es `"mixed"` |  |
| `aria-expanded:` | el elemento está expandido: `accessibilityState.expanded` es `true` (el disparador de un `Popover` o de un `Menu` mientras su popup está abierto) |  |
| `aria-pressed:` | el elemento es un botón de alternancia que está activado: `accessibilityState.pressed` es `true` (`"mixed"` no está pulsado; no `active:`, una pulsación en curso) | `.aria_pressed(\|s\| …)` |
| `aria-busy:` | el elemento está ocupado: `accessibilityState.busy` es `true` |  |
| `aria-checked:` | el elemento está marcado: `accessibilityState.checked` es `true`, igual que `checked:` |  |
| `aria-selected:` | el elemento está seleccionado: `accessibilityState.selected` es `true`, igual que `selected:` |  |
| `data-<name>:` | el elemento tiene el atributo booleano `data-*` `name` (`&[data-<name>]` de Tailwind; nombres de letras minúsculas, dígitos y `-`): lo que muestra la parte de un componente además de sus estados, el día de un calendario al inicio de un rango `data-range-start` | `Interactive::project_data(name, …)` establece uno |

Los mismos estados como objetos de estilo son los props `activeStyle`, `hoverStyle`, `focusStyle`, `disabledStyle`, `checkedStyle`, `indeterminateStyle`, `expandedStyle` y `pressedStyle` de cada elemento (y `selectedStyle` de un `Button`); se superponen al estilo y a las clases del elemento.

`disabled` funciona en cualquier elemento: aplica `disabled:` y elimina los manejadores de pulsación del elemento, por lo que tampoco muestra respuesta visual al pulsar.

```rust tabs
view()
    .on_press(save)
    .disabled(saving)
    .rounded_lg()
    .bg(BLUE.shade(600))
    .px_4()
    .py_2()
    .transition()
    .active(|s| s.scale(0.95).bg(BLUE.shade(700)))
    .disabled_style(|s| s.opacity(0.4))
    .child(text("Save").font_weight(FontWeight::MEDIUM).text_color(white()))
```

```tsx tabs
<View
  onPress={save}
  disabled={saving()}
  class="rounded-lg bg-blue-600 px-4 py-2 transition active:scale-95 active:bg-blue-700 disabled:opacity-40"
>
  <Text class="font-medium text-white">Save</Text>
</View>
```
<a id="groups"></a>

### Grupos

Marca un ancestro con `group` y aplica estilos a los descendientes según su estado con `group-<state>:`. Asigna nombres a los grupos para anidarlos: `group/card` y `group-hover/card:`.

| Variante | Se aplica cuando el grupo está | Rust |
|---|---|---|
| `group-active:` | presionado | `.group_active(…)`, `.group_active_named(name, …)` |
| `group-hover:` | con el cursor encima | `.group_hover(…)`, `.group_hover_named(name, …)` |
| `group-focus:`, `group-focus-visible:` | con el foco |  |
| `group-focus-within:` | con el foco o que contiene el foco | `.group_focus_within(…)`, `.group_focus_within_named(name, …)` |
| `group-disabled:` | deshabilitado |  |
| `group-selected:` | seleccionado |  |
| `group-checked:` | marcado |  |
| `group-indeterminate:` | indeterminado |  |
| `group-aria-expanded:` | expandido |  |
| `group-aria-pressed:` | un botón de alternancia activado |  |
| `group-aria-busy:`, `group-aria-checked:`, `group-aria-selected:` | ocupado, marcado, seleccionado |  |
| `group-data-<name>:` | que muestra el atributo `data-*` `name` |  |

```rust tabs
view()
    .on_press(open)
    .group_named("row")
    .flex_row()
    .items_center()
    .gap_3()
    .p_3()
    .active(|s| s.bg(ZINC.shade(100)))
    .child(
        text("Settings")
            .flex_1()
            .text_color(ZINC.shade(900))
            .group_active_named("row", |s| s.text_color(BLUE.shade(600))),
    )
    .child(
        text("›")
            .text_color(ZINC.shade(400))
            .group_active_named("row", |s| s.translate_x(px(4.0)))
            .transition_transform(),
    )
```

```tsx tabs
<View onPress={open} class="group/row flex-row items-center gap-3 p-3 active:bg-zinc-100">
  <Text class="flex-1 text-zinc-900 group-active/row:text-blue-600">Settings</Text>
  <Text class="text-zinc-400 group-active/row:translate-x-1 transition-transform">›</Text>
</View>
```

<a id="position-among-siblings"></a>

### Posición entre hermanos

| Variante | Se aplica a |
|---|---|
| `first:` | el primer hijo |
| `last:` | el último hijo |
| `only:` | el hijo único |
| `odd:` | el 1.º, 3.º, ... hijo |
| `even:` | el 2.º, 4.º, ... hijo |

```rust tabs
each(items, |item: &Item| item.id, move |item, index| {
    text(move || item.with(|i| i.name.clone()))
        .border_b(px(1.0))
        .border_color(ZINC.shade(200))
        .py_3()
        .style_when(move || index.get() + 1 == items.with(Vec::len), |s| s.border_b(px(0.0)))
})
```

```tsx tabs
<Each of={items()}>{(item) => <Text class="border-b border-zinc-200 py-3 last:border-b-0">{item().name}</Text>}</Each>
```

<a id="placeholder-and-selection"></a>

### Marcador de posición y selección

`placeholder:` se aplica al marcador de posición de un `<Input>` y solo admite un color de texto: `placeholder:text-zinc-400` (la clave de estilo `placeholderColor`). `selection:` se aplica a la selección de un `<Input>` o de un `<Text>` seleccionable, y en cualquier elemento a los que contiene (el `& *::selection` de Tailwind; prevalece el del elemento más cercano), y admite su fondo, el resaltado: `selection:bg-violet-200` (la clave de estilo `selectionColor`, que también tiñe el cursor de texto de un input en las plataformas que lo dibujan de un solo color).

<a id="important"></a>

### Importante

`!` antes o después de una utilidad (`!p-4`, `p-4!`) hace que prevalezca sobre cualquier otra clase y sobre el `style` en línea.

<a id="theme-customization"></a>

## Personalización del tema

Extiende el tema en el objeto `"tailwind"` del `nsh.json` de tu app. Las entradas con un nombre nuevo se añaden; las entradas con un nombre existente reemplazan a las predeterminadas. Las longitudes están en puntos. El tema se comprueba al empaquetar la app: una clave desconocida o un valor no válido provoca un error de compilación.

```json
{
  "name": "My App",
  "id": "com.example.myapp",
  "tailwind": {
    "colors": {
      "brand": { "50": "#f5f3ff", "500": "#7c3aed", "600": "#6d28d9", "DEFAULT": "#7c3aed" },
      "accent": "#f59e0b"
    },
    "spacing": 4,
    "breakpoints": { "tablet": 600 },
    "fontFamily": { "display": "Inter" },
    "fontSize": { "huge": [48, 1.1] },
    "fontWeight": { "heavy": 850 },
    "radius": { "card": 14 },
    "shadow": { "card": "0 2px 8px rgb(0 0 0 / 0.12)" },
    "insetShadow": { "well": "inset 0 2px 6px rgb(0 0 0 / 0.1)" },
    "dropShadow": { "icon": "0 2px 4px rgb(0 0 0 / 0.2)" },
    "tracking": { "label": 0.08 },
    "leading": { "dense": 1.15 },
    "blur": { "glass": 20 },
    "perspective": { "card": 700 },
    "aspect": { "photo": 1.5 },
    "ease": { "snappy": [0.2, 0, 0, 1] },
    "container": { "content": 680 }
  }
}
```

Con este tema, `bg-brand-500`, `bg-brand` (la tonalidad `DEFAULT`), `text-accent`, `tablet:flex-row`, `font-display`, `text-huge`, `font-heavy`, `rounded-card`, `shadow-card`, `inset-shadow-well`, `drop-shadow-icon`, `tracking-label`, `leading-dense`, `blur-glass`, `perspective-card`, `aspect-photo`, `ease-snappy` y `max-w-content` funcionan.

| Clave | Valor | Usado por |
|---|---|---|
| `colors` | `{ name: color }` o `{ name: { shade: color } }`; `DEFAULT` nombra el color base. Cualquier sintaxis de color CSS. | todas las utilidades de color |
| `spacing` | puntos por paso (4 por defecto) | `p-*`, `m-*`, `gap-*`, `w-*`, ... |
| `rem` | puntos por `rem` (16 por defecto) | |
| `breakpoints` | `{ name: width }` | variantes de breakpoint (ordenadas por ancho) |
| `container` | `{ name: width }` | `w-*`, `min-w-*`, `max-w-*` |
| `fontFamily` | `{ name: family }` (una familia del sistema o el nombre de una fuente incluida) | `font-*` |
| `fontSize` | `{ name: size }` o `{ name: [size, lineHeightMultiple] }` | `text-*` |
| `fontWeight` | `{ name: 1–1000 }` | `font-*` |
| `tracking` | `{ name: em }` | `tracking-*` |
| `leading` | `{ name: multiple }` | `leading-*` |
| `radius` | `{ name: points }` | `rounded-*` |
| `shadow`, `insetShadow`, `dropShadow` | `{ name: "CSS box-shadow" }` | `shadow-*`, `inset-shadow-*`, `drop-shadow-*` |
| `blur` | `{ name: points }` | `blur-*`, `backdrop-blur-*` |
| `perspective` | `{ name: points }` | `perspective-*` |
| `aspect` | `{ name: ratio }` | `aspect-*` |
| `ease` | `{ name: [x1, y1, x2, y2] }` | `ease-*` |

> [!NOTE]
> El tema de Tailwind da forma únicamente a las clases de tu app. Los tokens de diseño de la app (los colores de shadcn/ui, `radius`, las fuentes y los propios de la app) son su tema, la clave `"theme"` de `nsh.json`, con el que se dibujan los componentes de Rust; consulta [Rust](../docs/rust.md#theme). Las clases nombran esos tokens como Tailwind nombra las variables `@theme` (`bg-primary`, `bg-up/30`, `rounded-(--radius)`): consulta [Tokens del tema](../docs/tailwind.md#theme-tokens).

<a id="related"></a>

## Relacionado

- [Tailwind](../docs/tailwind.md): la guía.
- [Estilos](../docs/styling.md): `class`, `classList`, `style` y cómo se combinan.
- [Referencia de estilos](./style-reference.md): las claves de estilo que establecen las utilidades.
