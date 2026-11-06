---
title: "Referencia de estilos"
description: "Todas las claves de estilo que NSH acepta, agrupadas por LayoutStyle, ViewStyle, TextStyle, InputStyle e ImageStyle, con su tipo y significado."
order: 16
source_hash: 012ce37fb9fe065c
---


# Referencia de estilos

Esta página enumera cada clave de la prop `style` y el método de `Styled` que la establece en Rust. Los componentes de Rust aplican estilos a los elementos con métodos tipados que llevan el nombre de las utilidades de Tailwind (`.p_4()`, `.rounded(px(12.0))`, `.bg(color)`, de `nsh_core::prelude`), que se reducen a las mismas claves; TSX pasa objetos `style` (y clases). La columna Rust indica el método; a la mayoría de ellos se les puede pasar un valor, una señal o una clausura, y `.style_when(…)` / `.style_with(…)` hacen condicional a cualquiera de ellos. Las claves y sus tipos provienen de las declaraciones generadas en `.nsh/types/nsh/types.d.ts`, de modo que tu editor las comprueba mientras escribes. Una clave de estilo significa la propiedad CSS de su mismo nombre, igual que la clase que la establece: `paddingLeft` es `padding-left` y `pl-4` de CSS, `boxShadow` es `box-shadow` y `shadow-md`; algunas claves usan nombres más simples que las apps escriben (`paddingHorizontal` para `padding-inline`, `marginStart` para `margin-inline-start`, `numberOfLines` para `line-clamp`). Los números son puntos, y las funciones de CSS también están disponibles: grid, degradados, sombras de caja, filtros, modos de mezcla, contornos, transformaciones, transiciones y animaciones con fotogramas clave.

Para saber cómo aplicar estilos, combinarlos con clases y heredar estilos de texto, consulta [Estilos](../docs/styling.md). Para la sintaxis de las clases, consulta la [referencia de Tailwind](./tailwind-reference.md).

<a id="the-five-interfaces"></a>

## Las cinco interfaces

Cada interfaz extiende a la anterior:

| Interfaz | Extiende | Usada por |
|---|---|---|
| `LayoutStyle` | | Diseño de todos los elementos (flexbox, grid, tamaños, espaciado, posición) |
| `ViewStyle` | `LayoutStyle` | `<View>`, `<Scroll>`, `<List>`, controles y cualquier otro elemento |
| `TextStyle` | `ViewStyle` | `<Text>` y `<Input>` (y las vistas, cuyos estilos de texto pasan al texto que contienen) |
| `InputStyle` | `TextStyle` | `<Input>`: añade `placeholderColor` y `caretColor` |
| `ImageStyle` | `ViewStyle` | `<Image>` |

```rust tabs
use nsh_core::prelude::*;

fn card() -> View {
    view().p_4().rounded(px(12.0)).bg(white()).shadow([BoxShadow {
        offset_y: px(4.0),
        blur: px(12.0),
        color: rgba(0x00000014).into(),
        ..BoxShadow::default()
    }])
}

fn title(label: &str) -> Text {
    text(label.to_string()).text_size(px(17.0)).font_weight(FontWeight::SEMIBOLD).text_color(rgb(0x111111))
}

card().child(title("Hello"))
```

```tsx tabs
import type { ViewStyle, TextStyle } from "nsh";
import { Text, View } from "nsh";

const card: ViewStyle = {
  padding: 16,
  borderRadius: 12,
  backgroundColor: "#fff",
  boxShadow: "0 4px 12px rgb(0 0 0 / 0.08)",
};

const title: TextStyle = { fontSize: 17, fontWeight: "600", color: "#111" };

<View style={card}>
  <Text style={title}>Hello</Text>
</View>;
```

`style` también acepta un array; las entradas se combinan de izquierda a derecha y las entradas falsy se omiten, por lo que los estilos condicionales no necesitan spread. En Rust, `.style_when(condition, …)` añade estilos mientras se cumpla la condición:

```rust tabs
card().style_when(selected, |s| s.border_color(rgb(0x2563eb)).border(px(2.0)))
```

```tsx tabs
<View style={[card, selected() && { borderColor: "#2563eb", borderWidth: 2 }]} />
```

> [!NOTE]
> El `style` en línea siempre prevalece sobre `class`. Establecer una clave en `null` o `undefined` la restablece a su valor por defecto.

<a id="how-style-keys-read"></a>

## Cómo se interpretan las claves de estilo

Las claves de estilo siguen CSS, de modo que un estilo y una clase que nombran la misma propiedad hacen lo mismo:

- **Dirección del diseño.** Una vista que no establece `display` dispone a sus hijos en una columna. `display: "flex"` es una fila a menos que se establezca `flexDirection`, como en CSS y la clase `flex`. `flexShrink` es `0` salvo que se establezca.
- **Lados físicos y lógicos.** `left`, `right`, `marginLeft`, `paddingRight`, `borderLeftWidth`, `borderTopLeftRadius` y `textAlign: "left"` mantienen su lado en diseños de derecha a izquierda. Las claves de inicio y fin (`marginStart`, `paddingEnd`, `start`, `end`, `borderStartWidth`, ...), la familia `borderTopStartRadius` y `textAlign: "start" | "end"` siguen la dirección: el inicio en línea es la izquierda en diseños de izquierda a derecha y la derecha en los de derecha a izquierda.
- **Colores de borde.** Un borde o un contorno cuyo grosor está establecido y cuyo color no lo está se dibuja con el color del texto (`currentColor` de CSS).
- **Transformaciones.** `translate`, `rotate` y `scale` son propiedades independientes, y `transform` acepta la cadena de funciones de CSS o una lista de pasos cuyas cantidades pueden ser valores animados. Se componen en este orden: `translate`, `rotate`, `scale` y después `transform`.

<a id="value-types"></a>

## Tipos de valor

| Tipo | Acepta | Rust |
|---|---|---|
| `number` | Puntos (independientes de la densidad). `1` es un punto en iOS y un dp en Android. | `Points`: `px(16.0)` |
| `DimensionValue` | `number` (puntos), `` `${number}%` `` (del padre) o `"auto"`. | `Length`: `px(…)`, `relative(0.5)`, `auto()` |
| `LengthValue` | `number` (puntos) o `` `${number}%` ``. Sin `"auto"`. | `DefiniteLength`: `px(…)`, `relative(0.5)` |
| `ColorValue` | Una cadena de color CSS: `#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa`, `rgb()`, `rgba()`, `hsl()`, `hsla()`, `oklch()`, `oklab()`, o un color CSS con nombre (`black`, `white`, `transparent`, `rebeccapurple`, ...). | `Hsla` / `AdaptiveColor`: `rgb(0x2563eb)`, `hsla(…)`, colores del tema (`theme().primary`) |
| `EnvValue` | Una variable de entorno en un padding o margin: `env(name)`, `env(name, <length>)` (la longitud sustituye a un nombre desconocido), `calc(env(name) + <length>)` o `calc(<length> + env(name))`. Los nombres son `safe-area-inset-top`, `-right`, `-bottom`, `-left` ([Área segura](../elements/safe-area.md)) y `keyboard-inset-height` ([Teclado](../elements/keyboard.md)). Aceptada por las claves físicas de padding y margin y sus atajos. | `.p_safe_area()`, `.pt_safe_area_plus(px(8.0))`, `.pb_keyboard()`, `.mb_keyboard_plus(…)`, ... |
| `AnimatedNode` | Un valor animado nativo o un nodo derivado de él (consulta la [API de animación de `nsh`](./nsh.md#animation)). Aceptado por `opacity`, `backgroundColor`, `borderColor`, `color`, `translate`, `rotate`, `scale`, los pasos de una lista `transform` y los `top` / `left` de una vista sticky; el valor entonces se anima en el hilo de la UI sin JS. | `AnimatedValue` / `AnimatedNode`, enlazado con `.bind_opacity(&v)`, `.bind_background(&v)`, `.bind_border_color(&v)`, `.bind_color(&v)`, `.bind_translate_x(&v)`, ... |

Las cadenas con sintaxis CSS (`boxShadow`, `textShadow`, `backgroundImage`, `filter`, `gridTemplateColumns`, ...) aceptan longitudes en `px` y números sin unidad (ambos en puntos), `pt` (4/3 de punto, como en CSS) o `rem` (16 puntos).

## LayoutStyle

El diseño se calcula en Rust (flexbox y CSS grid). Una vista que no establece `display` es un contenedor flex cuyos hijos se apilan en una columna; `display: "flex"` lo convierte en una fila a menos que se establezca `flexDirection`, como en CSS. Los elementos tienen por defecto `flexShrink: 0`, `alignContent: "flex-start"` (grids: `"normal"` de CSS), `alignItems: "stretch"` y ningún tamaño mínimo automático. Consulta [Diseño](../docs/layout.md).

<a id="display-and-position"></a>

### Display y posición

| Clave | Tipo | Rust | Descripción |
|---|---|---|---|
| `display` | `"flex" \| "grid" \| "block" \| "flow-root" \| "none"` | `.flex()`, `.grid()`, `.hidden()` | El diseño de los hijos. `"flex"` los dispone en una fila a menos que `flexDirection` establezca una dirección, como en CSS; una vista que no establece display los dispone en una columna. `"none"` elimina el elemento del diseño y lo oculta. `"block"` apila los hijos como lo hace el diseño de bloque de CSS. |
| `boxSizing` | `"border-box" \| "content-box"` | | Las dimensiones incluyen bordes y padding, o solo el contenido. Por defecto `"border-box"`. |
| `position` | `"relative" \| "absolute" \| "static" \| "fixed" \| "sticky"` | `.relative()`, `.absolute()` | `"absolute"` saca el elemento del flujo y lo coloca según `top` / `right` / `bottom` / `left` respecto a su ancestro posicionado más cercano (su padre, a menos que sea `"static"`). `"static"` permanece en el flujo e ignora los desplazamientos. `"fixed"` conserva el tipo de elemento y lo dispone y monta en su superficie o raíz modal, manteniéndolo en su sitio mientras el contenido circundante se desplaza. `"sticky"` permanece en el flujo y, mientras su padre está a la vista, se fija a `top` (`left` en una vista de desplazamiento horizontal) desde el inicio del viewport de la vista de desplazamiento que lo rodea, hasta que su final coincide con el de la caja de contenido de su padre; se dibuja por encima de sus hermanos del mismo `zIndex`. Por defecto `"relative"`. |
| `top` | `DimensionValue \| AnimatedNode` | `.top(…)`, `.inset(…)`, `.bind_sticky_top(&node)` | Desplazamiento desde el borde superior del padre (absolute) o desde la posición propia del elemento (relative). En una vista sticky, dónde se fija, lo cual un valor animado mueve en cada fotograma. |
| `right` | `DimensionValue` | `.right(…)` | Desplazamiento desde el borde derecho, en cualquier dirección. |
| `bottom` | `DimensionValue` | `.bottom(…)` | Desplazamiento desde el borde inferior. |
| `left` | `DimensionValue \| AnimatedNode` | `.left(…)`, `.bind_sticky_left(&node)` | Desplazamiento desde el borde izquierdo, en cualquier dirección. En una vista sticky dentro de una vista de desplazamiento horizontal, dónde se fija, lo cual un valor animado mueve en cada fotograma. |
| `start` | `DimensionValue` | | Desplazamiento desde el borde de inicio en línea: izquierda en diseños de izquierda a derecha, derecha en los de derecha a izquierda. |
| `end` | `DimensionValue` | | Desplazamiento desde el borde de fin en línea: derecha en diseños de izquierda a derecha, izquierda en los de derecha a izquierda. |
| `zIndex` | `number` | `.z_index(z)` | Orden entre hermanos (estable para valores iguales); también el orden de apilamiento nativo. |
| `direction` | `"inherit" \| "ltr" \| "rtl"` | | Dirección del diseño, heredada por defecto. Como en CSS, las propiedades `left` y `right` mantienen sus lados de derecha a izquierda, mientras que las de inicio / fin en línea (`marginStart`, `end`, ...) toman los lados que les asigna la dirección. |

### Flexbox

| Clave | Tipo | Rust | Descripción |
|---|---|---|---|
| `flexDirection` | `"row" \| "column" \| "row-reverse" \| "column-reverse"` | `.flex_row()`, `.flex_col()`, `.flex_row_reverse()`, `.flex_col_reverse()` | El eje principal. Por defecto `"column"` para una vista que no establece `display`, `"row"` una vez establecido `display: "flex"`. |
| `flexWrap` | `"wrap" \| "nowrap" \| "wrap-reverse"` | `.flex_wrap()` | Si los hijos se ajustan en varias líneas. Por defecto `"nowrap"`. |
| `flex` | `number` | `.flex_1()`, `.flex_auto()`, `.flex_none()` | Un solo número, no el atajo de CSS: un número positivo establece `flexGrow` con ese valor, `flexShrink: 1` y `flexBasis: 0`; `0` hace el elemento inflexible; un número negativo lo encoge hasta su tamaño mínimo. |
| `flexGrow` | `number` | `.flex_grow(f)` | Cuánto del espacio libre ocupa el elemento. Por defecto `0`. |
| `flexShrink` | `number` | `.flex_shrink(f)`, `.flex_shrink_0()` | Cuánto se encoge el elemento cuando falta espacio. Por defecto `0`, no `1` como en CSS. |
| `flexBasis` | `DimensionValue` | `.basis(…)` | El tamaño en el eje principal antes de distribuir el espacio libre. |
| `justifyContent` | `"flex-start" \| "flex-end" \| "start" \| "end" \| "center" \| "space-between" \| "space-around" \| "space-evenly" \| "stretch" \| "normal"` | `.justify_start()`, `.justify_center()`, `.justify_end()`, `.justify_between()`, `.justify_around()`, `.justify_evenly()` | Distribución de los hijos a lo largo del eje principal. Por defecto `"normal"`: `"flex-start"` en contenedores flex; en grids, las pistas de tamaño `auto` se estiran. |
| `alignItems` | `"flex-start" \| "flex-end" \| "start" \| "end" \| "self-start" \| "self-end" \| "center" \| "stretch" \| "baseline" \| "normal"` | `.items_start()`, `.items_center()`, `.items_end()`, `.items_stretch()`, `.items_baseline()` | Alineación de los hijos en el eje transversal. Por defecto `"stretch"`. |
| `alignSelf` | `"auto" \| "flex-start" \| "flex-end" \| "start" \| "end" \| "self-start" \| "self-end" \| "center" \| "stretch" \| "baseline" \| "normal"` | `.self_start()`, `.self_center()`, `.self_end()`, `.self_stretch()` | Anula el `alignItems` del padre para este elemento. |
| `alignContent` | `"flex-start" \| "flex-end" \| "start" \| "end" \| "center" \| "stretch" \| "space-between" \| "space-around" \| "space-evenly" \| "normal"` | `.content_start()`, `.content_center()`, `.content_between()`, … | Distribución de las líneas ajustadas (y de las pistas de grid) en el eje transversal. Por defecto `"flex-start"` en contenedores flex y `"normal"` en grids, donde las pistas de tamaño `auto` se estiran. `"start"` / `"end"` siguen la dirección de escritura. |
| `gap` | `LengthValue` | `.gap(…)`, `.gap_4()` | Espacio entre filas y columnas de hijos. |
| `rowGap` | `LengthValue` | `.gap_y(…)` | Espacio entre filas. |
| `columnGap` | `LengthValue` | `.gap_x(…)` | Espacio entre columnas. |

### Grid

Establece `display: "grid"` para disponer a los hijos en un CSS grid. Las listas de pistas usan sintaxis CSS.

| Clave | Tipo | Rust | Descripción |
|---|---|---|---|
| `gridTemplateColumns` | `string` | `.grid_template_columns(…)`, `.grid_cols(n)` | Pistas de columna: `"repeat(3, 1fr)"`, `"200px 1fr"`, `minmax()`, `auto-fill` / `auto-fit`, nombres de línea (`"[a] 40px [b c] 1fr [d]"`). |
| `gridTemplateRows` | `string` | `.grid_template_rows(…)`, `.grid_rows(n)` | Pistas de fila, misma sintaxis. |
| `gridAutoColumns` | `string` | | Tamaño de las columnas creadas implícitamente. |
| `gridAutoRows` | `string` | | Tamaño de las filas creadas implícitamente. |
| `gridAutoFlow` | `"row" \| "column" \| "dense" \| "row dense" \| "column dense"` | `.grid_flow_col()`, `.grid_flow_dense()` | Cómo los elementos sin ubicación rellenan el grid. |
| `gridColumn` | `number \| string` | `.col_span(n)`, `.col_span_full()` | Ubicación en columnas: `"1 / 3"`, `"span 2"`, un número de línea o un nombre de línea (`"content-start / content-end"`, `"2 col"`, `"span col"`). |
| `gridColumnStart` | `number \| string` | `.col_start(…)` | Línea de columna inicial. |
| `gridColumnEnd` | `number \| string` | `.col_end(…)` | Línea de columna final. |
| `gridRow` | `number \| string` | `.row_span(n)`, `.row_span_full()` | Ubicación en filas, misma sintaxis que `gridColumn`. |
| `gridRowStart` | `number \| string` | `.row_start(…)` | Línea de fila inicial. |
| `gridRowEnd` | `number \| string` | `.row_end(…)` | Línea de fila final. |
| `justifyItems` | `"flex-start" \| "flex-end" \| "start" \| "end" \| "self-start" \| "self-end" \| "center" \| "stretch" \| "baseline" \| "normal"` | | Cómo se sitúan los elementos del grid en sus áreas a lo largo de la fila. |
| `justifySelf` | `"auto" \| "flex-start" \| "flex-end" \| "start" \| "end" \| "self-start" \| "self-end" \| "center" \| "stretch" \| "baseline" \| "normal"` | | Anula `justifyItems` para este elemento. |

```rust tabs
view()
    .grid()
    .grid_template_columns("repeat(3, 1fr)")
    .gap_2()
    .child(view().col_span(2).h(px(60.0)).bg(rgb(0xc7d2fe)))
    .child(view().h(px(60.0)).bg(rgb(0xa5b4fc)))
```

```tsx tabs
<View style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
  <View style={{ gridColumn: "span 2", height: 60, backgroundColor: "#c7d2fe" }} />
  <View style={{ height: 60, backgroundColor: "#a5b4fc" }} />
</View>
```

<a id="size"></a>

### Tamaño

| Clave | Tipo | Rust | Descripción |
|---|---|---|---|
| `width` | `DimensionValue` | `.w(…)`, `.w_full()`, `.size(…)` | Ancho. |
| `height` | `DimensionValue` | `.h(…)`, `.h_full()` | Alto. |
| `minWidth` | `LengthValue` | `.min_w(…)` | Ancho mínimo. |
| `minHeight` | `LengthValue` | `.min_h(…)` | Alto mínimo. |
| `maxWidth` | `LengthValue` | `.max_w(…)` | Ancho máximo. |
| `maxHeight` | `LengthValue` | `.max_h(…)` | Alto máximo. |
| `aspectRatio` | `number \| "auto" \| "16 / 9"` | `.aspect_ratio(r)`, `.aspect_square()` | Ancho dividido por alto, un número (`1.5`) o la razón de CSS (`"16 / 9"`); la dimensión que falta se calcula a partir de la otra. `"auto"` no establece ninguna. |

### Margin

Los márgenes aceptan `"auto"` (absorbe el espacio libre, como en flexbox) y valores negativos. Las claves físicas (todas excepto `marginStart` / `marginEnd`) también aceptan un `EnvValue`: `marginBottom: "env(keyboard-inset-height)"` (Rust `.mb_keyboard()`, `.mt_safe_area()`, ...).

| Clave | Tipo | Rust | Descripción |
|---|---|---|---|
| `margin` | `DimensionValue \| EnvValue` | `.m(…)`, `.m_4()` | Los cuatro lados. |
| `marginHorizontal` | `DimensionValue \| EnvValue` | `.mx(…)` | Izquierda y derecha. |
| `marginVertical` | `DimensionValue \| EnvValue` | `.my(…)` | Arriba y abajo. |
| `marginTop` | `DimensionValue \| EnvValue` | `.mt(…)` | Arriba. |
| `marginRight` | `DimensionValue \| EnvValue` | `.mr(…)` | Derecha. |
| `marginBottom` | `DimensionValue \| EnvValue` | `.mb(…)` | Abajo. |
| `marginLeft` | `DimensionValue \| EnvValue` | `.ml(…)` | Izquierda. |
| `marginStart` | `DimensionValue` | `.ms(…)` | Inicio en línea: izquierda en diseños de izquierda a derecha, derecha en los de derecha a izquierda. |
| `marginEnd` | `DimensionValue` | `.me(…)` | Fin en línea: el lado opuesto de `marginStart`. |

### Padding

Las claves físicas (todas excepto `paddingStart` / `paddingEnd`) también aceptan un `EnvValue`: `paddingTop: "env(safe-area-inset-top)"`, `paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)"` (Rust `.pt_safe_area()`, `.pb_safe_area_plus(px(16.0))`, `.pb_keyboard()`, ...). Un padding es como mínimo 0.

| Clave | Tipo | Rust | Descripción |
|---|---|---|---|
| `padding` | `LengthValue \| EnvValue` | `.p(…)`, `.p_4()` | Los cuatro lados. |
| `paddingHorizontal` | `LengthValue \| EnvValue` | `.px(…)` | Izquierda y derecha. |
| `paddingVertical` | `LengthValue \| EnvValue` | `.py(…)` | Arriba y abajo. |
| `paddingTop` | `LengthValue \| EnvValue` | `.pt(…)` | Arriba. |
| `paddingRight` | `LengthValue \| EnvValue` | `.pr(…)` | Derecha. |
| `paddingBottom` | `LengthValue \| EnvValue` | `.pb(…)` | Abajo. |
| `paddingLeft` | `LengthValue \| EnvValue` | `.pl(…)` | Izquierda. |
| `paddingStart` | `LengthValue` | `.ps(…)` | Inicio en línea: izquierda en diseños de izquierda a derecha, derecha en los de derecha a izquierda. |
| `paddingEnd` | `LengthValue` | `.pe(…)` | Fin en línea: el lado opuesto de `paddingStart`. |

## ViewStyle

Todo lo que dibuja una vista. También se aplican todas las claves de `LayoutStyle`.

<a id="background"></a>

### Fondo

| Clave | Tipo | Rust | Descripción |
|---|---|---|---|
| `backgroundColor` | `ColorValue \| AnimatedNode` | `.bg(color)`, `.bind_background(&node)` | El color de relleno. Acepta un color animado nativo. |
| `backgroundImage` | `string` | `.bg_linear(angle)`, `.bg_radial()`, `.bg_conic()` con `.gradient_from` / `_via` / `_to` | Degradados CSS dibujados sobre el color de fondo: `linear-gradient(...)`, `radial-gradient(...)`, `conic-gradient(...)`, varios separados por comas. |

```rust tabs
view().h(px(120.0)).rounded(px(16.0)).bg_linear(deg(135.0)).gradient_from(rgb(0x6366f1)).gradient_to(rgb(0xec4899))
```

```tsx tabs
<View style={{ height: 120, borderRadius: 16, backgroundImage: "linear-gradient(135deg, #6366f1, #ec4899)" }} />
```
<a id="borders"></a>

### Bordes

| Clave | Tipo | Rust | Descripción |
|---|---|---|---|
| `borderWidth` | `number` | `.border(w)`, `.border_1()`, `.border_2()` | Ancho de los cuatro lados. |
| `borderTopWidth` | `number` | `.border_t(w)` | Lado superior. |
| `borderRightWidth` | `number` | `.border_r(w)` | Lado derecho. |
| `borderBottomWidth` | `number` | `.border_b(w)` | Lado inferior. |
| `borderLeftWidth` | `number` | `.border_l(w)` | Lado izquierdo. |
| `borderStartWidth` | `number` | `.border_s(w)` | Lado de inicio en línea (izquierda en diseños de izquierda a derecha, derecha en los de derecha a izquierda). |
| `borderEndWidth` | `number` | `.border_e(w)` | Lado de fin en línea. |
| `borderColor` | `ColorValue \| AnimatedNode` | `.border_color(c)`, `.bind_border_color(&node)` | Color de los cuatro lados. Acepta un color animado nativo. |
| `borderTopColor` | `ColorValue` | `.border_t_color(c)` | Lado superior. |
| `borderRightColor` | `ColorValue` | `.border_r_color(c)` | Lado derecho. |
| `borderBottomColor` | `ColorValue` | `.border_b_color(c)` | Lado inferior. |
| `borderLeftColor` | `ColorValue` | `.border_l_color(c)` | Lado izquierdo. |
| `borderStartColor` | `ColorValue` | `.border_s_color(c)` | Lado de inicio en línea. |
| `borderEndColor` | `ColorValue` | `.border_e_color(c)` | Lado de fin en línea. |
| `borderStyle` | `"solid" \| "dashed" \| "dotted" \| "none" \| "hidden"` | `.border_solid()`, `.border_dashed()`, `.border_dotted()`, `.border_none()` | Estilo de línea. Por defecto `"solid"`. `"none"` y `"hidden"` no dibujan ni reservan espacio para ningún borde, sea cual sea el ancho, definido antes o después, como en CSS. |

Un lado cuyo ancho está definido y cuyo color no define nada se dibuja con el color del texto, el `currentColor` de CSS: `{ borderWidth: 1, color: "#2563eb" }` dibuja un borde azul. Los contornos toman el color del texto del mismo modo.

<a id="corners"></a>

### Esquinas

| Clave | Tipo | Rust | Descripción |
|---|---|---|---|
| `borderRadius` | `number` | `.rounded(r)`, `.rounded_lg()` | Radio de las cuatro esquinas. |
| `borderTopLeftRadius` | `number` | `.rounded_tl(r)` | Esquina superior izquierda. |
| `borderTopRightRadius` | `number` | `.rounded_tr(r)` | Esquina superior derecha. |
| `borderBottomRightRadius` | `number` | `.rounded_br(r)` | Esquina inferior derecha. |
| `borderBottomLeftRadius` | `number` | `.rounded_bl(r)` | Esquina inferior izquierda. |
| `borderTopStartRadius` | `number` | `.rounded_ss(r)` | Esquina superior del lado de inicio en línea. |
| `borderTopEndRadius` | `number` | `.rounded_se(r)` | Esquina superior del lado de fin en línea. |
| `borderBottomStartRadius` | `number` | `.rounded_es(r)` | Esquina inferior del lado de inicio en línea. |
| `borderBottomEndRadius` | `number` | `.rounded_ee(r)` | Esquina inferior del lado de fin en línea. |
| `borderCurve` | `"circular" \| "continuous"` | `.border_curve(curve)` | `"continuous"`: esquinas cuya curvatura se suaviza hacia los bordes, como los iconos de las apps de iOS. Si la caja es demasiado pequeña, la curva vuelve a ser circular, de modo que las píldoras siguen siendo píldoras. Funciona en ambas plataformas. |

<a id="outline"></a>

### Contorno

Un contorno se dibuja fuera del borde y no ocupa espacio en el layout.

| Clave | Tipo | Rust | Descripción |
|---|---|---|---|
| `outlineWidth` | `number` | `.outline(w)` | Ancho de la línea. |
| `outlineColor` | `ColorValue` | `.outline_color(c)` | Color de la línea. Por defecto, el color del texto. |
| `outlineStyle` | `"solid" \| "dashed" \| "dotted" \| "none" \| "hidden"` | `.outline_dashed()`, `.outline_dotted()`, `.outline_none()` | Estilo de línea. |
| `outlineOffset` | `number` | `.outline_offset(o)` | Distancia desde el borde; los valores negativos lo mueven hacia dentro. |

<a id="shadows"></a>

### Sombras

Una vista proyecta sombras con el `boxShadow` de CSS: varias capas, sombras con spread e inset. Las transiciones la animan (`transitionProperty: "boxShadow"`).

| Clave | Tipo | Rust | Descripción |
|---|---|---|---|
| `boxShadow` | `string \| BoxShadowLayer[]` | `.shadow([BoxShadow { … }])`, `.shadow_md()`, `.shadow_color(c)` | `box-shadow` de CSS: desplazamientos, desenfoque, spread y color, varias capas separadas por comas, `inset` para sombras internas; o sus capas como números, `[{ x, y, blur, spread, color, inset }]` (solo `x` y `y` son obligatorios); una capa sin color se dibuja con el color del texto, como el `currentColor` de CSS. `.shadow_color(c)` recolorea las capas de un preset o de `.shadow(…)`. |

```rust tabs
view().p_4().rounded(px(12.0)).bg(white()).shadow([
    BoxShadow { offset_y: px(1.0), blur: px(2.0), color: rgba(0x0000000f).into(), ..BoxShadow::default() },
    BoxShadow { offset_y: px(8.0), blur: px(24.0), spread: px(-4.0), color: rgba(0x0000001f).into(), ..BoxShadow::default() },
])
```

```tsx tabs
<View style={{ padding: 16, borderRadius: 12, backgroundColor: "#fff",
  boxShadow: "0 1px 2px rgb(0 0 0 / 0.06), 0 8px 24px -4px rgb(0 0 0 / 0.12)" }} />
```

> [!NOTE]
> En Android, las sombras necesitan un fondo: una vista con fondo transparente (por ejemplo, texto sobre nada) no proyecta sombra. Para la sombra material de Android, usa la prop `android={{ elevation }}` en lugar de un estilo.

<a id="opacity-visibility-and-overflow"></a>

### Opacidad, visibilidad y desbordamiento

| Clave | Tipo | Rust | Descripción |
|---|---|---|---|
| `opacity` | `number \| AnimatedNode` | `.opacity(o)`, `.bind_opacity(&value)` | De 0 (invisible) a 1. Acepta un valor animado nativo. |
| `visibility` | `"visible" \| "hidden" \| "collapse"` | | Las vistas ocultas conservan su espacio en el layout (a diferencia de `display: "none"`). |
| `overflow` | `"visible" \| "hidden"` | `.overflow_hidden()` | `"hidden"` recorta los hijos a los límites de la vista (y a sus esquinas). |
| `backfaceVisibility` | `"visible" \| "hidden"` | `.backface_hidden()`, `.backface_visible()` | `"hidden"`: invisible mientras una rotación 3D la deja de espaldas. |
| `verticalAlign` | `"baseline" \| "text-top" \| "text-bottom" \| "middle"` | `.align_baseline()`, `.align_text_top()`, `.align_text_bottom()`, `.align_middle()` | Dónde se sitúa una vista o imagen dentro de un `<Text>` en su línea, como el `vertical-align` de CSS: su parte inferior sobre la línea base (por defecto), su parte superior o inferior en el borde superior o inferior de la fuente del texto, o su centro a media altura x sobre la línea base. La línea crece para acogerla. |

<a id="transforms"></a>

### Transformaciones

Las transformaciones son las de CSS: las propiedades `translate`, `rotate` y `scale` y `transform`, compuestas en ese orden. Cada una es una propiedad independiente, de modo que el `scale` de un estilo reemplaza el `scale-*` de una clase y conserva su `rotate-*`, y el `transform` de un estilo reemplaza las funciones de transformación de una clase (`rotate-x-*`, `skew-*`).

| Clave | Tipo | Rust | Descripción |
|---|---|---|---|
| `translate` | `string \| number \| AnimatedNode \| [x, y]` | `.translate_x(…)`, `.translate_y(…)`; `.bind_translate_x(&v)`, `.bind_translate_y(&v)` | `translate` de CSS: x y luego y (`"10px 20px"`; porcentajes del tamaño de la propia vista, `"-50% 0"`). Un número son puntos a lo largo de x. `[x, y]` acepta un número, una cadena (`"50%"`, `"10px"`) o un valor animado por eje; un valor animado solo lo mueve a lo largo de x. |
| `rotate` | `string \| number \| AnimatedNode` | `.rotate(deg(…))`; `.bind_rotate(&v)` | `rotate` de CSS: `"45deg"`, `"0.5turn"`, o alrededor de un eje, `"x 90deg"`. Un número, y un valor animado, son grados alrededor de z, en sentido horario. |
| `scale` | `string \| number \| AnimatedNode \| [x, y]` | `.scale(f)`, `.scale_x(f)`, `.scale_y(f)`; `.bind_scale(&v)` | `scale` de CSS: `1.5`, `"150%"`, x e y (`"1 2"`). Un valor animado escala ambos ejes; `[x, y]` acepta un número o un valor animado por eje. |
| `transform` | `string \| TransformStep[]` | `.rotate_x(…)`, `.rotate_y(…)`, `.skew_x(…)`, `.skew_y(…)`, `.transform_none()`; pasos animados: `.bind_transform(kind, &v)`, `.bind_motion(&m)` (después de cada transformación del estilo) | `transform` de CSS: `"translateX(10px) rotate(45deg) scale(1.5)"` o `"none"`. Funciones: `translate()`, `translateX()`, `translateY()`, `scale()`, `scaleX()`, `scaleY()`, `rotate()` / `rotateZ()`, `rotateX()`, `rotateY()`, `skew()`, `skewX()`, `skewY()`, `perspective()`. Las longitudes aceptan `px` (las traslaciones también `%`, del tamaño de la propia vista), los ángulos `deg`, `rad` o `turn`. O una lista de pasos cuyas cantidades pueden ser valores animados: lo que la cadena no puede expresar, como una rotación 3D animada (`[{ perspective: 800 }, { rotateY: angle }]`), y los canales de un movimiento (`m.transform`). El `transform` de un estilo es de una forma o de la otra, así que una perspectiva antes de pasos animados es un paso de la lista. Se aplica después de `translate`, `rotate` y `scale`. |
| `transformOrigin` | `string \| (number \| string)[]` | `.transform_origin(…)`, `.origin_top_left()`, ... | El punto alrededor del cual actúan las transformaciones: palabras clave, porcentajes y longitudes (`"top left"`, `"50% 0"`, `[10, 20]`). Por defecto, el centro. |

Un `TransformStep` es un objeto con una sola clave, aplicado en el orden de la lista:

| Paso | Valor | Animado nativo |
|---|---|---|
| `translateX`, `translateY` | `number` (puntos) | sí |
| `scale`, `scaleX`, `scaleY` | `number` (factor) | sí |
| `rotate`, `rotateZ`, `rotateX`, `rotateY` | `number` (grados) o `string` (`"45deg"`, `"0.5rad"`) | sí |
| `skewX`, `skewY` | `number` (grados) o `string` | no |
| `perspective` | `number` (puntos) | no |

```rust tabs
view().perspective(px(600.0)).child(view().rotate_y(deg(20.0)).scale(0.95))
```

```tsx tabs
<View style={{ transform: "perspective(600px) rotateY(20deg) scale(0.95)" }} />
```

Un valor animado controla directamente `translate`, `rotate` y `scale`, así como los pasos de una lista `transform`:

```tsx
const x = createAnimatedValue(0);
const angle = createAnimatedValue(0);

<View style={{ translate: [x, 0], rotate: angle }} />
<View style={{ transform: [{ perspective: 800 }, { rotateY: angle }] }} />
```

> [!NOTE]
> Android no dibuja skew: `skew()`, `skewX()` y `skewY()` dejan la vista sin sesgar en esa plataforma.

<a id="filters-and-blending"></a>

### Filtros y mezcla

| Clave | Tipo | Rust | Descripción |
|---|---|---|---|
| `filter` | `string` | `.blur(r)`, `.brightness(…)`, `.contrast(…)`, `.grayscale(…)`, `.hue_rotate(…)`, `.invert(…)`, `.saturate(…)`, `.sepia(…)` | Filtros CSS de la vista y su contenido: `brightness()`, `contrast()`, `grayscale()`, `hue-rotate()`, `invert()`, `saturate()`, `sepia()`, `opacity()`, `blur()`, `drop-shadow()`. |
| `backdropFilter` | `string` | `.backdrop_blur(r)`, `.backdrop_brightness(…)`, ... | Filtros CSS de lo que hay detrás de la vista, como `"blur(10px)"` para el efecto de vidrio esmerilado. |
| `maskImage` | `string` | | Un degradado CSS cuyo alfa decide cuánto de la vista se dibuja: por completo donde es opaco y nada donde es transparente: `linear-gradient(...)`, `radial-gradient(...)`, `conic-gradient(...)`. Enmascara todo lo que dibuja la vista, incluido su filtro de fondo. |
| `glassEffect` | `"none" \| "regular" \| "clear"` | `.glass_effect(GlassEffect::Regular)` | Liquid Glass detrás del contenido de la vista en iOS 26 y macOS 26 y posteriores. `"regular"` usa el material estándar; `"clear"` toma menos color del fondo. `"none"` es el valor por defecto. Combínalo con `backdropFilter` para el desenfoque que se muestra en versiones anteriores de iOS y en otras plataformas. |
| `mixBlendMode` | `"normal" \| "multiply" \| "screen" \| "overlay" \| "darken" \| "lighten" \| "color-dodge" \| "color-burn" \| "hard-light" \| "soft-light" \| "difference" \| "exclusion" \| "hue" \| "saturation" \| "color" \| "luminosity" \| "plus-darker" \| "plus-lighter"` | `.mix_blend_mode(mode)` | Cómo se mezcla la vista con lo que hay detrás. |

> [!WARNING]
> Límites por plataforma:
> - iOS aplica a las vistas solo `opacity()`, `brightness()` hasta 1 y `drop-shadow()`. `<Image>` acepta todos los filtros de color y `blur()`, aplicados mientras se decodifica la imagen.
> - El desenfoque `backdropFilter` de iOS usa un material del sistema a una fracción, una aproximación del radio exacto.
> - Android necesita API 31 para `blur()`, `drop-shadow()` y `backdropFilter`; por debajo de esa versión solo se aplican los filtros de color. Los modos de mezcla necesitan API 29.

<a id="transitions"></a>

### Transiciones

Cuando cambia una propiedad con transición (por un nuevo estilo, una clase o una variante como `active:`), la plataforma la anima de forma nativa. No se ejecuta JS durante la animación.

| Clave | Tipo | Rust | Descripción |
|---|---|---|---|
| `transitionProperty` | `string` | `.transition()`, `.transition_all()`, `.transition_colors()`, `.transition_opacity()`, `.transition_shadow()`, `.transition_transform()`, `.transition_none()` | Propiedades que se animan, separadas por comas: `"all"`, `"colors"` (`color`, `backgroundColor`, `borderColor`, ...), `"opacity"`, `"transform"` (todas las propiedades de transformación), `"boxShadow"`, `"borderRadius"`, `"borderWidth"` o `"none"`. |
| `transitionDuration` | `number \| "${number}ms" \| "${number}s"` | `.duration(ms)` | Milisegundos como número, o `"150ms"` / `"0.2s"`. |
| `transitionDelay` | `number \| "${number}ms" \| "${number}s"` | `.delay(ms)` | Retraso antes de que empiece la transición. |
| `transitionTimingFunction` | `"linear" \| "ease" \| "ease-in" \| "ease-out" \| "ease-in-out" \| "cubic-bezier(...)"` | `.ease_linear()`, `.ease_in()`, `.ease_out()`, `.ease_in_out()`, `.ease_bezier(…)` | La curva de easing. |

```rust tabs
view()
    .on_press(move || open.update(|o| *o = !*o))
    .h(move || px(if open.get() { 160.0 } else { 56.0 }))
    .opacity(move || if open.get() { 1.0 } else { 0.8 })
    .transition()
    .duration(200.0)
```

```tsx tabs
<View
  onPress={() => open.set(!open())}
  style={{ height: open() ? 160 : 56, opacity: open() ? 1 : 0.8,
    transitionProperty: "opacity, transform", transitionDuration: 200 }}
/>
```

<a id="keyframe-animations"></a>

### Animaciones con keyframes

Animaciones con keyframes integradas, ejecutadas de forma nativa (`animate-*` de Tailwind).

| Clave | Tipo | Rust | Descripción |
|---|---|---|---|
| `animationName` | `"none" \| "spin" \| "ping" \| "pulse" \| "bounce"` | `.animate_spin()`, `.animate_ping()`, `.animate_pulse()`, `.animate_bounce()`, `.animate_none()` | La animación. |
| `animationDuration` | `number \| "${number}ms" \| "${number}s"` | `.animation(KeyframeAnimation { … })` | Duración de una iteración. |
| `animationDelay` | `number \| "${number}ms" \| "${number}s"` | `.animation(KeyframeAnimation { … })` | Retraso antes de la primera iteración. |
| `animationTimingFunction` | `"linear" \| "ease" \| "ease-in" \| "ease-out" \| "ease-in-out" \| "cubic-bezier(...)"` | `.animation(KeyframeAnimation { … })` | La curva de easing. |
| `animationIterationCount` | `number \| "infinite"` | `.animation(KeyframeAnimation { … })` | Cuántas veces se ejecuta. |

Para animaciones controladas por valores, gestos o resortes, usa en su lugar [la API de animación de `nsh`](./nsh.md#animation).

<a id="pointer-and-selection"></a>

### Puntero y selección

| Clave | Tipo | Rust | Descripción |
|---|---|---|---|
| `cursor` | `"auto" \| "default" \| "pointer" \| "text" \| "grab" \| "grabbing" \| "not-allowed" \| ...` (todas las palabras clave de cursor de CSS, y `"none"`) | `.cursor(Cursor)`, `.cursor_pointer()` | La forma del puntero sobre la vista, para punteros (trackpads de iPad, Mac Catalyst, escritorios). Las palabras clave de redimensionado diagonal conservan su eje: `nwse-resize` / `nw-resize` / `se-resize` (`Cursor::NwseResize`) y `nesw-resize` / `ne-resize` / `sw-resize` (`Cursor::NeswResize`). Windows, Linux, Android, la web y GPUI muestran cursores diagonales; AppKit los usa en macOS 15+, con una mano abierta en macOS 14. UIKit usa efectos de puntero en iPad y Mac Catalyst. |
| `pointerEvents` | `"auto" \| "none" \| "box-none" \| "box-only"` | `.pointer_events(PointerEvents::BoxNone)` | Qué toques reciben la vista y las vistas que contiene (`pointer-events-none`, `pointer-events-auto`). `"none"`: ninguno, tampoco para las vistas que contiene salvo que alguna defina `"auto"`, heredado como en CSS. `"box-none"`: ninguno en la propia vista, las vistas que contiene reciben los suyos; `"box-only"`: la propia vista los recibe, las vistas que contiene ninguno (ambos son los de React Native, solo para la vista). Por defecto `"auto"`. Consulta [toque y gestos](../docs/touch-and-gestures.md#pointerevents). |
| `userSelect` | `"auto" \| "none" \| "text"` | `.select_text()`, `.select_none()` | Si un `<Text>` se puede seleccionar y copiar (`"text"`, `select-text`) o no (`"none"`, `select-none`); el de una vista alcanza a los textos que contiene y que no definen ninguno. `"auto"` (`select-auto`), el valor por defecto, lo deja en manos de la vista que lo rodea y, si no, de la plataforma. Consulta [texto](../elements/text.md). |

<a id="svg-paint"></a>

### Pintura SVG

Las propiedades de pintura de CSS de las formas SVG, que acepta cualquier elemento y que heredan los elementos que contiene, como en un navegador.
Pintan lo que los componentes de Rust dibujan en canvas.

| Clave | Tipo | Rust | Descripción |
|---|---|---|---|
| `fill` | `"none" \| "currentColor" \| ColorValue` | `.fill_color(c)`, `.fill_none()`, `.fill_current()` | Con qué se rellenan las formas; `currentColor` es el color del texto del elemento. |
| `stroke` | `"none" \| "currentColor" \| ColorValue` | `.stroke_color(c)`, `.stroke_none()`, `.stroke_current()` | Con qué se pintan los contornos de las formas. |
| `strokeWidth` | `number \| string` | `.stroke_width(w)` | El ancho de esos contornos, una longitud (1 por defecto). |
| `strokeDasharray` | `number \| string` | — | Trazos y huecos a lo largo de esos contornos: longitudes separadas por espacios o comas (`"4 2"`), una lista impar se repite, o `"none"`. |

## TextStyle

Los estilos de texto se aplican a `<Text>` y `<Input>`. También se heredan, como en CSS: las propiedades de texto definidas en una vista pasan a los textos y entradas que contiene, y los spans `<Text>` anidados heredan de su texto padre. También se aplican todas las claves de `ViewStyle`. Consulta [Texto](../docs/text.md).

<a id="font"></a>

### Fuente

| Clave | Tipo | Rust | Descripción |
|---|---|---|---|
| `color` | `ColorValue \| AnimatedNode` | `.text_color(c)`, `.bind_color(&node)` | Color del texto. Acepta un color animado nativo. También es el color de los bordes y contornos que no definen ninguno. |
| `fontSize` | `number` | `.text_size(s)`, `.text_sm()`, `.text_lg()`, ... | Tamaño en puntos. |
| `fontWeight` | `"normal" \| "bold" \| number \| "${number}"` | `.font_weight(FontWeight::SEMIBOLD)` | `"normal"` (400), `"bold"` (700) o 100–900. |
| `fontFamily` | `string` | `.font_family(name)` | Una familia del sistema, o el nombre al que se evalúa una fuente importada (`import Inter from "./Inter.ttf"`), o una lista de ellas, la preferida primero (`"Brand, 'Noto Sans SC', sans-serif"`). Consulta [Fuentes](../docs/fonts.md#fallback-lists). |
| `fontStyle` | `"normal" \| "italic"` | `.italic()` | Cursiva. |
| `fontVariant` | `FontVariantName[] \| string` | `.small_caps()`, `.oldstyle_nums()`, `.lining_nums()`, `.tabular_nums()`, `.proportional_nums()` | Formas de números y letras de OpenType, una lista (`["tabular-nums"]`) o los nombres de CSS separados por espacios (`"tabular-nums small-caps"`). `tabular-nums` mantiene los dígitos con el mismo ancho, útil para contadores y temporizadores. |
<a id="spacing-and-alignment"></a>

### Espaciado y alineación

| Key | Type | Rust | Description |
|---|---|---|---|
| `lineHeight` | `number` | `.line_height(h)` | Altura de línea en puntos. |
| `letterSpacing` | `number` | `.letter_spacing(s)` | Espacio adicional entre caracteres, en puntos. |
| `textAlign` | `"auto" \| "left" \| "center" \| "right" \| "justify" \| "start" \| "end"` | `.text_left()`, `.text_center()`, `.text_right()`, `.text_justify()` | Alineación horizontal. `"left"` y `"right"` mantienen sus lados en diseños de derecha a izquierda; `"start"` y `"end"` siguen la dirección. |
| `writingDirection` | `"auto" \| "ltr" \| "rtl"` | `.writing_direction(d)` | Dirección base del texto; `"auto"` la toma del contenido. |
| `textTransform` | `"none" \| "uppercase" \| "lowercase" \| "capitalize"` | `.uppercase()`, `.lowercase()`, `.capitalize()`, `.normal_case()` | Transformación de mayúsculas y minúsculas. |

> [!TIP]
> Las clases `leading-*` y `tracking-*` de Tailwind establecen la altura de línea como múltiplos del tamaño de fuente y el espaciado entre letras en `em`, por lo que escalan con los tamaños de `text-*`.

<a id="lines-and-overflow"></a>

### Líneas y desbordamiento

| Key | Type | Rust | Description |
|---|---|---|---|
| `numberOfLines` | `number` | `.number_of_lines(n)`, `.truncate()` | El máximo de líneas que muestra un `<Text>` (`line-clamp`, `line-clamp-*` de CSS); `0` (`line-clamp-none`), el valor por defecto, las muestra todas. `truncate` es una sola línea cortada con puntos suspensivos. |
| `textOverflow` | `"ellipsis" \| "clip" \| "ellipsis-start" \| "ellipsis-middle"` | `.text_overflow(EllipsizeMode::Middle)` | Cómo se corta un `<Text>` limitado: con puntos suspensivos al final (`"ellipsis"`, `text-ellipsis`, el valor por defecto), recortado (`"clip"`, `text-clip`), o con los puntos suspensivos al principio o en medio (rutas de archivos). |

<a id="decoration"></a>

### Decoración

| Key | Type | Rust | Description |
|---|---|---|---|
| `textDecorationLine` | `"none" \| "underline" \| "line-through" \| "underline line-through"` | `.underline()`, `.line_through()`, `.no_underline()` | Líneas dibujadas junto con el texto. |
| `textDecorationColor` | `ColorValue` | `.text_decoration_color(c)` | Color de las líneas (por defecto, el color del texto). |
| `textDecorationStyle` | `"solid" \| "double" \| "dotted" \| "dashed" \| "wavy"` | `.text_decoration_solid()`, `_double()`, `_dotted()`, `_dashed()`, `_wavy()` | Estilo de línea. |
| `textDecorationThickness` | `number \| "auto" \| "from-font"` | `.text_decoration_thickness(t)` | Grosor de la línea. |
| `textUnderlineOffset` | `number \| "auto"` | `.underline_offset(o)` | Distancia del subrayado a la línea base. |

<a id="placeholder-caret-and-selection"></a>

### Marcador de posición, cursor y selección

`placeholderColor` y `caretColor` pertenecen a `InputStyle`, el estilo de `<Input>`; `selectionColor` pertenece a `TextStyle`, ya que los textos seleccionables también lo aceptan.

| Key | Type | Rust | Description |
|---|---|---|---|
| `placeholderColor` | `ColorValue` | `.placeholder_color(c)` de un input | El color del marcador de posición de un `<Input>` (`placeholder:text-*`). |
| `textAlignVertical` | `"auto" \| "top" \| "center" \| "bottom"` | | Dónde se coloca el texto más corto que su caja (un `<Text>` con altura). |
| `selectionColor` | `ColorValue` | `.selection_color(c)` de un input o de un text | El resaltado de selección y los tiradores de un `<Input>` o de un `<Text>` seleccionable (`selection:bg-*`); por defecto, el color de acento de la plataforma. En iOS también el cursor de un input, a menos que se establezca `caretColor` (UIKit tiñe ambos con un solo color). |
| `caretColor` | `ColorValue` | `.caret_color(c)` de un input | El cursor de un `<Input>` (`caret-*`); el valor por defecto de la plataforma si no se establece. |

<a id="text-shadow"></a>

### Sombra de texto

| Key | Type | Rust | Description |
|---|---|---|---|
| `textShadow` | `string \| TextShadowLayer[]` | `.text_shadow([TextShadow { … }])`, `.text_shadow_sm()`, `.text_shadow_color(c)` | `text-shadow` de CSS: desplazamientos, desenfoque y color (`"0 1px 2px rgb(0 0 0 / 0.3)"`), o sus capas como números, `[{ x, y, blur, color }]`; varias capas se dibujan como la más ancha; una capa sin color se dibuja con el color del texto; `"none"`. |

```rust tabs
text("Title").text_shadow([TextShadow {
    offset_y: px(1.0),
    radius: px(2.0),
    color: rgba(0x0000004d).into(),
    ..TextShadow::default()
}])
```

```tsx tabs
<Text style={{ textShadow: "0 1px 2px rgb(0 0 0 / 0.3)" }}>Title</Text>
```

> [!NOTE]
> iOS no dibuja degradados (`backgroundImage`) ni sombras de caja internas en `<Text>`.

## ImageStyle

Todas las claves de `ViewStyle`, más:

| Key | Type | Rust | Description |
|---|---|---|---|
| `tintColor` | `ColorValue` | `.tint_color(c)` de una imagen | Retiñe una imagen de plantilla (cada píxel opaco toma este color), para iconos monocromáticos. |
| `objectFit` | `"fill" \| "contain" \| "cover" \| "none" \| "scale-down"` | `.object_fit(ResizeMode::Contain)` | `object-fit` de CSS: cómo se ajusta una imagen o un video a su caja. `"cover"` la rellena y recorta, `"contain"` la ajusta por dentro, `"fill"` la estira, `"none"` mantiene el tamaño natural, `"scale-down"` es `"none"` o `"contain"`, el que sea menor. Por defecto, las imágenes cubren su caja y los videos se contienen en ella. |
| `objectPosition` | `string` | `.object_position(p)`, `.object_top()`, ... de una imagen | Dónde se sitúa la imagen en su caja una vez que `objectFit` le ha dado tamaño, como `object-position` de CSS: palabras clave, porcentajes y longitudes (`"top"`, `"left bottom"`, `"25% 75%"`, `"right 10px bottom 20%"`). Una imagen que cubre se recorta alrededor de este punto. Por defecto, el centro. |

`objectFit` se aplica también a `<Video>`; consulta [image](../elements/image.md) y [video](../elements/video.md).

<a id="props-that-look-like-styles"></a>

## Props que parecen estilos

La sombra de material de Android es una prop de la plataforma, que se establece junto al estilo:

| Setting | Prop | Rust | Class |
|---|---|---|---|
| Sombra de material (Android) | `android={{ elevation }}` | `.elevation(e)` | |

<a id="related"></a>

## Relacionado

- [Styling](../docs/styling.md): `style`, `class`, herencia y precedencia.
- [Tailwind reference](./tailwind-reference.md): todas las utilidades y variantes compatibles.
- [Layout](../docs/layout.md): flexbox y grid en la práctica.
- [view](../elements/view.md), [text](../elements/text.md), [image](../elements/image.md): los elementos a los que se aplican estos estilos.

`width`, `height` y `flexBasis` también aceptan `"min-content"`, `"max-content"` y `"fit-content"`, calculados por Taffy.
