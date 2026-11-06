---
title: "Diseño"
description: "Flexbox con columna como valor predeterminado, CSS grid, tamaños y porcentajes, relación de aspecto, posicionamiento absoluto, medición con onLayout, diseños adaptables y de derecha a izquierda, en Rust y TSX."
order: 34
group: ui
demo: guide-layout
source_hash: f4073f703fc9be46
---


# Diseño

NSH distribuye cada elemento con [Taffy](https://github.com/DioxusLabs/taffy), una implementación en Rust del layout flexbox, grid y block de CSS, configurada para que los hijos se apilen verticalmente y no se encojan por defecto. El layout se ejecuta en el núcleo, después de cada turno de tu código, y solo los frames que cambiaron se envían a las vistas nativas. El texto lo mide el motor de texto de la plataforma en el mismo hilo, de modo que el layout nunca espera al hilo principal.

Las propiedades de layout que siguen son propiedades de estilo. En Rust son métodos de estilo tipados (`.flex_row()`, `.gap_4()`, `.grid_cols(3)`, `.absolute().inset_0()`); en TSX son claves de la prop `style`, y cada una tiene una clase de [Tailwind](./tailwind.md) (`flex-row`, `gap-4`, `grid-cols-3`, `absolute inset-0`, ...). Ambas se traducen a los mismos estilos nativos.

## Flexbox

Una vista distribuye a sus hijos con flexbox. Una vista que no define `display` apila a sus hijos en una columna; `display: "flex"` en un estilo crea una fila a menos que se defina `flexDirection`, exactamente como en CSS y como la clase `flex` de Tailwind. Donde nada los defina, se aplican estos valores por defecto:

| Propiedad | Valor por defecto en NSH | Valor por defecto en la web |
|---|---|---|
| `flexDirection` | `"column"` (una vista que no define `display`); `"row"` cuando se define `display: "flex"` | `row` |
| `flexShrink` | `0` | `1` |
| `alignContent` | `"flex-start"` (grids: `"normal"`) | `normal` |
| `alignItems` | `"stretch"` | `stretch` |
| `minWidth` / `minHeight` | `0` | `auto` |
| `position` | `"relative"` | `static` |

```rust tabs
view()
    .flex_row()
    .items_center()
    .gap_3()
    .p_4()
    .child(image(avatar).size(px(40.0)).rounded(px(20.0)))
    .child(
        view()
            .flex_1()
            .gap_0p5()
            .child(text(name).font_weight(FontWeight::SEMIBOLD))
            .child(text(message).text_color(rgb(0x6e7781)).number_of_lines(1)),
    )
    .child(text(time).text_color(rgb(0x6e7781)))
```

```tsx tabs
<View style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 16 }}>
  <Image src={avatar} style={{ width: 40, height: 40, borderRadius: 20 }} />
  <View style={{ flex: 1, gap: 2 }}>
    <Text style={{ fontWeight: "600" }}>{props.name}</Text>
    <Text style={{ numberOfLines: 1, color: "#6e7781" }}>{props.message}</Text>
  </View>
  <Text style={{ color: "#6e7781" }}>{props.time}</Text>
</View>
```

| Propiedad | Valores | Rust |
|---|---|---|
| `flexDirection` | `"column"`, `"row"`, `"column-reverse"`, `"row-reverse"` | `.flex_col()`, `.flex_row()`, `.flex_col_reverse()`, `.flex_row_reverse()` |
| `justifyContent` | Eje principal: `"flex-start"`, `"flex-end"`, `"start"`, `"end"`, `"center"`, `"space-between"`, `"space-around"`, `"space-evenly"`, `"stretch"` | `.justify_start()`, `.justify_center()`, `.justify_end()`, `.justify_between()`, `.justify_around()`, `.justify_evenly()` |
| `alignItems` | Eje transversal: `"stretch"`, `"flex-start"`, `"flex-end"`, `"start"`, `"end"`, `"self-start"`, `"self-end"`, `"center"`, `"baseline"` | `.items_stretch()`, `.items_start()`, `.items_center()`, `.items_end()`, `.items_baseline()` |
| `alignSelf` | Alineación de un hijo en el eje transversal; `"auto"` sigue el `alignItems` del padre | `.self_start()`, `.self_center()`, `.self_end()`, `.self_stretch()` |
| `alignContent` | Líneas de un contenedor con wrap | |
| `flexWrap` | `"nowrap"`, `"wrap"`, `"wrap-reverse"` | `.flex_wrap()` |
| `flex` | Una forma abreviada de un solo número (abajo) | `.flex_1()`, `.flex_auto()`, `.flex_none()` |
| `flexGrow`, `flexShrink`, `flexBasis` | Como en CSS | `.flex_grow(n)`, `.flex_shrink(n)`, `.flex_shrink_0()`, `.basis(length)` |
| `gap`, `rowGap`, `columnGap` | Espacio entre hijos | `.gap(length)`, `.gap_y(length)`, `.gap_x(length)`, y los pasos `.gap_2()`, `.gap_x_4()`, ... |

`flex-start` y `flex-end` siguen la dirección flex; `start` y `end` siguen la dirección de escritura, como en CSS (de derecha a izquierda, `start` es el lado derecho), y `self-start` / `self-end` la del propio hijo.

`flex` es la forma abreviada de CSS, al igual que las clases `flex-*` de Tailwind: un número `n` significa crecer `n`, encoger 1 y partir de una base de 0, de modo que los hermanos `flex: 1` (`.flex_1()` en Rust, `flex-1`) se reparten el espacio por igual sea cual sea su contenido; `"none"` es `0 0 auto` (la vista conserva su tamaño), `"auto"` es `1 1 auto`, `"initial"` es `0 1 auto`, y crecimiento, encogimiento y base pueden escribirse por separado (`"2 0 50%"`, `"1 1 120px"`). Como los tamaños mínimos son 0 por defecto, `flex: 0` (`0 1 0`) reduce una vista a nada a menos que `minWidth: "auto"` conserve el tamaño de su contenido.

```rust tabs
view()
    .flex_row()
    .gap_2()
    // One share.
    .child(view().flex_1().h(px(36.0)).bg(rgb(0xc8e1ff)))
    // Two shares.
    .child(view().flex_grow(2.0).flex_shrink(1.0).basis(px(0.0)).h(px(36.0)).bg(rgb(0x79b8ff)))
    // Fixed.
    .child(view().size(px(36.0)).bg(rgb(0x0366d6)))
```

```tsx tabs
<View style={{ flexDirection: "row", gap: 8 }}>
  <View style={{ flex: 1, height: 36, backgroundColor: "#c8e1ff" }} />   {/* one share */}
  <View style={{ flex: 2, height: 36, backgroundColor: "#79b8ff" }} />   {/* two shares */}
  <View style={{ width: 36, height: 36, backgroundColor: "#0366d6" }} /> {/* fixed */}
</View>
```

Como los tamaños mínimos son 0 por defecto, un texto `flex: 1` en una fila se encoge y se ajusta en varias líneas en lugar de empujar a sus hermanos fuera. `minWidth: "auto"` / `minHeight: "auto"` (`min-w-auto` / `min-h-auto`, `.min_w(auto())` en Rust) es el mínimo automático de CSS: un elemento que se encoge se detiene en el tamaño más pequeño de su contenido, la palabra más larga de un texto, como en la web.

> [!NOTE]
> `display: "flex"` significa una fila, en un estilo, en una clase (`flex`) y en Rust (`.flex()`) por igual, a menos que se defina una dirección: `{ display: "flex", flexDirection: "column" }`, `flex flex-col`, `.flex().flex_col()`. Una vista sin `display` no necesita nada para ser una columna.

<a id="sizes"></a>

## Tamaños

| Propiedad | Valores | Rust |
|---|---|---|
| `width`, `height` | Puntos, un porcentaje del padre (`"50%"`) o `"auto"` | `.w(px(120.0))`, `.h(relative(0.5))`, `.w_full()`, `.size(px(44.0))`, los pasos `.w_10()`, ... |
| `minWidth`, `maxWidth`, `minHeight`, `maxHeight` | Puntos o porcentajes; `minWidth` / `minHeight` también `"auto"`, el tamaño más pequeño del contenido | `.min_w(..)`, `.max_w(..)`, `.min_h(..)`, `.max_h(..)` |
| `aspectRatio` | Ancho dividido por alto: `1`, `16 / 9` | `.aspect_ratio(16.0 / 9.0)`, `.aspect_square()` |
| `padding`, `paddingHorizontal`, `paddingVertical`, `paddingTop`, ... | Puntos o porcentajes | `.p(..)`, `.px(..)`, `.py(..)`, `.pt(..)`, ..., y los pasos `.p_4()`, `.px_2()`, ... |
| `margin`, `marginHorizontal`, `marginVertical`, `marginTop`, ... | Puntos, porcentajes o `"auto"` | `.m(..)`, `.mx(..)`, `.my(..)`, `.mt(..)`, ..., `.mx(auto())` |

En Rust una longitud es tipada: `px(16.0)` son 16 puntos, `relative(0.5)` es el 50 % del padre, `auto()` es `auto`. Los métodos de pasos siguen la escala de espaciado de Tailwind de 4 puntos por paso (`.p_4()` son 16 puntos, `.gap_0p5()` 2 puntos).

Sin un tamaño, una vista es tan grande como su contenido (más el padding), estirada a lo largo del eje transversal de su padre por el `alignItems: "stretch"` por defecto. Los porcentajes son relativos al tamaño del padre (para padding y margin, como en CSS, a su ancho).

`aspectRatio` calcula la otra dimensión a partir de la que se conoce:

```rust tabs
view().w_full().aspect_ratio(16.0 / 9.0).bg(black())
```

```tsx tabs
<View style={{ width: "100%", aspectRatio: 16 / 9, backgroundColor: "#000000" }} />
```

Las imágenes de los assets de la app tienen un tamaño natural y se distribuyen con él cuando no se indica ninguno ([Imágenes y assets](./images-and-assets.md)). Las imágenes remotas no tienen tamaño hasta que se cargan: dales uno.

## Grid

`display: "grid"` (`.grid()` en Rust) distribuye a los hijos en pistas de grid de CSS:

```rust tabs
view()
    .grid()
    .grid_template_columns("repeat(3, 1fr)")
    .gap_2()
    .child(view().col_span(2).h(px(60.0)).bg(rgb(0xd8b9ff)))
    .child(view().h(px(60.0)).bg(rgb(0xb083f0)))
    .child(view().row_span(2).bg(rgb(0x8250df)))
    .child(view().col_start(2).col_end(4).h(px(60.0)).bg(rgb(0x6639ba)))
```

```tsx tabs
<View style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
  <View style={{ gridColumn: "span 2", height: 60, backgroundColor: "#d8b9ff" }} />
  <View style={{ height: 60, backgroundColor: "#b083f0" }} />
  <View style={{ gridRow: "span 2", backgroundColor: "#8250df" }} />
  <View style={{ gridColumn: "2 / 4", height: 60, backgroundColor: "#6639ba" }} />
</View>
```

| Propiedad | Valores | Rust |
|---|---|---|
| `gridTemplateColumns`, `gridTemplateRows` | Listas de pistas de CSS: `"repeat(3, 1fr)"`, `"200px 1fr"`, `minmax()`, `auto-fill` / `auto-fit`, nombres de línea | `.grid_cols(3)`, `.grid_rows(2)`, `.grid_template_columns("200px 1fr")`, `.grid_template_rows(..)` |
| `gridAutoColumns`, `gridAutoRows` | Pistas de las columnas y filas creadas implícitamente | |
| `gridAutoFlow` | `"row"`, `"column"`, `"dense"`, `"row dense"`, `"column dense"` | `.grid_flow_col()`, `.grid_flow_dense()` |
| `gridColumn`, `gridRow` | `"1 / 3"`, `"span 2"`, un número o nombre de línea: `"content-start / content-end"`, `"2 col"` (la segunda línea llamada `col`), `"span col"` (hasta la siguiente línea llamada `col`) | `.col_span(2)`, `.row_span(2)`, `.col_span_full()` |
| `gridColumnStart`, `gridColumnEnd`, `gridRowStart`, `gridRowEnd` | Números o nombres de línea | `.col_start(1)`, `.col_end(3)`, `.row_start(..)`, `.row_end(..)` (números de línea) |
| `justifyItems`, `justifySelf` | Cómo se colocan los elementos en sus áreas a lo largo de la fila: `"start"`, `"end"`, `"center"`, `"stretch"`, ... | |
| `alignItems`, `alignSelf` | Cómo se colocan los elementos en sus áreas a lo largo de la columna | `.items_*()`, `.self_*()` |
| `justifyContent`, `alignContent` | Cómo se colocan las pistas en el grid a lo largo de la fila y de la columna | `.justify_*()` |

Las plantillas nombran sus líneas entre corchetes, uno o varios nombres por línea, y los elementos se colocan por esos nombres, como en CSS (en Rust, por los números de las líneas):

```rust tabs
view()
    .grid()
    .grid_template_columns("[full-start] 16px [content-start] 1fr [content-end] 16px [full-end]")
    // content-start / content-end: lines 2 to 3.
    .child(view().col_start(2).col_end(3).h(px(60.0)).bg(rgb(0xb083f0)))
    // full-start / full-end: lines 1 to 4.
    .child(view().col_start(1).col_end(4).h(px(60.0)).bg(rgb(0x8250df)))
```

```tsx tabs
<View style={{ display: "grid", gridTemplateColumns: "[full-start] 16px [content-start] 1fr [content-end] 16px [full-end]" }}>
  <View style={{ gridColumn: "content-start / content-end", height: 60, backgroundColor: "#b083f0" }} />
  <View style={{ gridColumn: "full-start / full-end", height: 60, backgroundColor: "#8250df" }} />
</View>
```

En un grid, `justifyContent` y `alignContent` valen por defecto `"normal"` de CSS: las pistas de tamaño `auto` se estiran para llenar el contenedor, de modo que un grid con altura y sin plantilla de filas reparte esa altura entre sus filas. Un valor definido explícitamente (`"start"`, `"center"`, `"space-between"`, ...) coloca las pistas igual que en CSS. Las clases de alineación definen exactamente lo que define Tailwind CSS: `content-start` (`align-content: flex-start`) y `place-content-start` agrupan las pistas al inicio, y `content-normal` y `justify-normal` las estiran, como en un navegador.

`display: "block"` usa el layout block de CSS (hijos apilados, cada uno tan ancho como el contenedor), y `display: "none"` (`.hidden()`) elimina la vista del layout.

<a id="absolute-positioning"></a>

## Posicionamiento absoluto

`position: "absolute"` (`.absolute()`) saca una vista del flujo y la coloca mediante `top`, `right`, `bottom` y `left`, relativos a su padre:

```rust tabs
view()
    .h(px(200.0))
    .child(image(cover).absolute().inset_0())
    .child(
        view()
            .absolute()
            .left_3()
            .right_3()
            .bottom_3()
            .child(text("Caption").text_color(white()).font_weight(FontWeight::BOLD)),
    )
```

```tsx tabs
<View style={{ height: 200 }}>
  <Image src={cover} style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }} />
  <View style={{ position: "absolute", left: 12, right: 12, bottom: 12 }}>
    <Text style={{ color: "#ffffff", fontWeight: "700" }}>Caption</Text>
  </View>
</View>
```

Los desplazamientos aceptan puntos y porcentajes (`.top(..)`, `.right(..)`, `.bottom(..)`, `.left(..)`, `.inset(..)` en Rust). Una vista con `left` y `right` (o `top` y `bottom`) y sin tamaño se estira entre ellos. Los hermanos posteriores se dibujan encima de los anteriores; `zIndex` (`.z_index(n)`) cambia el orden.

<a id="measuring"></a>

## Medición

`onLayout` (`.on_layout(..)`) informa del frame de una vista, relativo a su padre, después de cada layout en el que cambió:

```rust tabs
let width = signal(0.0_f32);

view()
    .on_layout(move |frame: &Bounds<Points>| width.set(frame.size.width.0))
    .child(text(move || format!("{} points wide", width.get())))
```

```tsx tabs
const width = signal(0);

<View onLayout={({ bounds }) => width.set(bounds.size.width)}>
  <Text>{width()} points wide</Text>
</View>
```

El frame está en puntos: `Bounds<Points>` en Rust, `{ bounds }` en TSX, un `Bounds` (`{ origin: { x, y }, size: { width, height } }`). Para toda la ventana, lee `window()` en Rust o `windowSize()` de [`nsh`](../modules/nsh.md#device) en TSX; ambos siguen la rotación y el redimensionado de la ventana, y un estilo que los lea cambia con la ventana:

```rust tabs
view().style_when(|| window().width > px(600.0), |s| s.flex_row())
```

```tsx tabs
import { View } from "nsh";
import { windowSize } from "nsh";

<View style={{ flexDirection: windowSize().width > 600 ? "row" : "column" }} />
```

Los breakpoints de Tailwind (`sm:`, `md:`, ...) y `portrait:` / `landscape:` dan el mismo resultado sin código.

<a id="safe-areas"></a>

## Áreas seguras

La vista raíz cubre toda la pantalla, por debajo de la barra de estado y del indicador de inicio. Aplica a las pantallas un padding según los insets del área segura con `env()` de CSS (`paddingTop: "env(safe-area-inset-top)"`, Tailwind `pt-[env(safe-area-inset-top)]`, `.p_safe_area()` en Rust; consulta [Área segura](../elements/safe-area.md)), o lee los insets con `safe_area()` en Rust o `safeArea()` / `safeAreaInsets()` en TSX y aplícalos tú mismo. Las páginas de una [pila de navegación](./navigation.md) ya quedan debajo de su cabecera.

<a id="right-to-left"></a>

## De derecha a izquierda

La dirección del layout de la app sigue el idioma del sistema, y el estilo `direction` de una vista (`"ltr"`, `"rtl"` o `"inherit"`; `.direction(LayoutDirection::Rtl)` en Rust) define la dirección de su subárbol. Cuando la app se distribuye de derecha a izquierda:

- las filas van desde la derecha;
- `left` y `right` conservan sus lados, como en un navegador, tanto en claves de estilo como en clases: `paddingLeft`, `marginLeft`, `left`, `borderLeftWidth`, `borderTopLeftRadius`, `textAlign: "left"` y `pl-4`, `ml-2`, `left-0`, `border-l`, `rounded-tl-lg`, `text-left` permanecen a la izquierda;
- las propiedades lógicas siguen la dirección, siendo el inicio en línea el lado derecho: `marginStart`, `marginEnd`, `paddingStart`, `paddingEnd`, `start`, `end`, `borderStartWidth`, `borderEndColor`, `borderTopStartRadius`, ..., `textAlign: "start"` / `"end"` (`ps-4`, `ms-2`, `start-0`, `border-s`, `rounded-ss-lg`, `text-start` como clases; `.ms(..)`, `.me(..)`, `.ps(..)`, `.pe(..)`, `.border_s(..)`, `.rounded_ss(..)`, ... en Rust); `marginHorizontal` y `paddingHorizontal` definen ambos lados;
- el texto con `textAlign: "auto"` se alinea a la derecha, y los controles nativos se reflejan.

```rust tabs
view()
    .flex_row()
    .gap_2()
    .child(view().ms_4().rounded_ss(px(12.0)).size(px(44.0)).bg(rgb(0x54aeff)))

let rtl = signal(false);
view()
    .direction(move || if rtl.get() { LayoutDirection::Rtl } else { LayoutDirection::Ltr })
    .on_press(move |_: &()| rtl.set(!rtl.get()))
    .child(text(move || if rtl.get() { "Right to left" } else { "Left to right" }))
```

```tsx tabs
import { signal, Text, View } from "nsh";

const rtl = signal(false);

<View style={{ direction: rtl() ? "rtl" : "ltr" }}>
  <View style={{ flexDirection: "row", gap: 8 }}>
    <View style={{ marginStart: 16, borderTopStartRadius: 12, width: 44, height: 44, backgroundColor: "#54aeff" }} />
  </View>
  <View onPress={() => rtl.set(!rtl())}>
    <Text>{rtl() ? "Right to left" : "Left to right"}</Text>
  </View>
</View>
```

Los cambios de dirección, ya sea del idioma o de una vista, se aplican de inmediato, sin reiniciar. El estilo `direction` también mantiene una vista y sus hijos en una dirección propia, por ejemplo un número de teléfono de izquierda a derecha. En Android, las apps que incorporan NSH necesitan `android:supportsRtl="true"` en su manifiesto para que los controles nativos se reflejen.

<a id="related"></a>

## Relacionado

- [Estilos](./styling.md): cómo se combinan los estilos.
- [Desplazamiento](./scrolling.md) y [Listas](./lists.md): contenido más grande que la pantalla.
- [Referencia de estilos](../modules/style-reference.md): cada propiedad de layout y su tipo.
