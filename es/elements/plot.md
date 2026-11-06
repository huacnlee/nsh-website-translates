---
title: "Plot"
description: "El componente Plot de nsh/base/plot, sus marcas Line, Area, Bar, Rule, Dot, Cell, Grid, Pie, Arc, RadialLine, RadialGrid, Sankey y Treemap, y sus PlotAxis y PlotLabel: gráficos dibujados de forma nativa a partir de las filas de la app, con las escalas de los ejes y sus etiquetas, textos en los puntos de datos, la fila, celda o porción bajo el puntero, movimiento y sin aspecto propio."
group: base
demo: el-plot
source_hash: 2aca4d23862b455b
---


# Plot

Un plot es el marco de un gráfico: las filas de datos que muestra, las escalas de sus ejes x e y, el puntero sobre él y su movimiento. Sus marcas dibujan lo que contiene: un `Line` a través de una serie, un `Area` entre una serie y una línea base, un `Bar` por fila en las bandas de una escala de bandas, un `Rule` por fila desde un inicio hasta un fin (la mecha de una vela), un `Dot` por fila donde se encuentran dos de sus valores (los puntos de un diagrama de dispersión, las burbujas de un gráfico de burbujas), un `Cell` por fila en las bandas de dos categorías, coloreado según su valor (un mapa de calor), un `Grid` de líneas transversales, un `Pie` de las proporciones de las filas (un donut con un agujero), un `Arc` entre dos ángulos, y un `RadialLine` alrededor del centro con los anillos y radios de un `RadialGrid` detrás (un radar), un `Sankey` de flujos entre las filas, y un `Treemap` de rectángulos anidados, donde el área de cada hoja es su valor (un mapa de mercado); un `PlotAxis` rotula un borde con las marcas de su escala, y un `PlotLabel` escribe textos en puntos de las escalas. Cada marca es un canvas que llena el plot, dibujado de forma nativa a partir de las filas: las filas de la app se leen una sola vez cuando las establece, y luego se escalan, se registran y se dibujan en Rust, de modo que un gráfico de mil puntos no ejecuta JS por cada punto. El puntero también se sigue en Rust: la línea cruzada, los puntos y el tooltip del hover se mueven y se desvanecen con el animador de la plataforma, y la app solo se entera de una nueva fila, nada más. El aspecto es de la app: las marcas se pintan con las propiedades de pintura de CSS de las formas SVG (`stroke-*`, `fill-*`), `currentColor` donde no se haya definido ninguna; un área o una barra muestra un fondo (un degradado, `bg-linear-*`) dentro de su forma, y las partes del hover (el punto de cada marca entre ellas) y las etiquetas, marcas de graduación y líneas de los ejes son de la app para darles estilo y rellenarlas.

```rust tabs
use nsh_base::{
    plot::{area, grid, line, plot},
    theme,
};
use nsh_core::{element::{RowAccessor, Rows}, prelude::*};

fn week(visitors: Vec<f64>, hovered: Signal<Option<u32>>) -> impl IntoElement {
    let rows = Rows::from_columns(visitors.len(), [("visitors".into(), visitors)]);
    plot()
        .data(rows)
        .y(RowAccessor::key("visitors"))
        .accessibility_label("Visitors per day")
        .h(px(160.0))
        .on_hover_change(move |index: &Option<u32>| hovered.set(*index))
        .child(grid().y(vec![0.0, 1500.0, 3000.0]).stroke_color(move || theme().border))
        .child(area().fill_color(move || theme().chart_1.opacity(0.2)))
        .child(line().stroke_color(move || theme().chart_1).stroke_width(px(2.0)))
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { Area, Grid, Line, Plot } from "nsh/base/plot";

const rows = [
  { day: "Mon", visitors: 1820 },
  { day: "Tue", visitors: 2140 },
  { day: "Wed", visitors: 1960 },
  { day: "Thu", visitors: 2480 },
  { day: "Fri", visitors: 2310 },
];

function App() {
  const hovered = signal<number | null>(null);
  return (
    <View class="gap-2 p-4">
      <Text class="text-sm text-muted-foreground tabular-nums">
        {hovered() == null ? "Visitors" : `${rows[hovered()!].day}: ${rows[hovered()!].visitors}`}
      </Text>
      <Plot
        data={rows}
        y="visitors"
        yScale={{ type: "linear", domain: [0, 3000] }}
        accessibilityLabel="Visitors per day, highest on Thursday"
        onHoverChange={({ index }) => hovered.set(index)}
        crossLineClass="w-px h-full bg-border"
        dotClass="size-2.5 rounded-full border-2 border-background bg-chart-1"
        class="h-40"
      >
        <Grid y={[0, 1500, 3000]} class="stroke-border" />
        <Area class="fill-chart-1/20" />
        <Line class="stroke-chart-1 stroke-2" />
      </Plot>
    </View>
  );
}

mount(App);
```

`Plot`, `Line`, `Area`, `Bar`, `Rule`, `Dot`, `Cell`, `Grid`, `Pie`, `Arc`, `RadialLine`, `RadialGrid`, `Sankey`, `Treemap`, `PlotAxis` y `PlotLabel` provienen de `nsh/base/plot`, un módulo propio de [`nsh/base`](../modules/nsh-base.md) (en Rust, `nsh_base::plot`). En TypeScript, las props de un plot son genéricas sobre el tipo de sus filas: los nombres de campo se comprueban contra ellas, y una función de una fila recibe el tipo de la fila. En Rust, `plot()` crea uno con un setter por prop, las filas son un `Rows` (columnas de números por clave), los valores son un `RowAccessor` (una clave o una función del índice de la fila), y las marcas aceptan los métodos de pintura tipados (`.stroke_color(..)`, `.fill_color(..)`, `.stroke_width(..)`).

## Plot

| Prop | Rust | Tipo | Valor por defecto | Descripción |
|---|---|---|---|---|
| `data` | `.data(..)` | `T[]` | (obligatorio) | Las filas, un objeto por punto. Las marcas leen sus valores una sola vez, cuando la app establece las filas; una fila sin valor (un campo que no es un número, `null`) se omite. |
| `x` | `.x(..)` | `keyof T \| (d: T, index: number) => number` | el índice de la fila | Lo que sitúa una fila a lo largo del eje x en una escala x `linear`. Una escala `point` sitúa las filas en orden. |
| `y` | `.y(..)` | `keyof T \| (d: T, index: number) => number` | ninguno | Lo que dibujan las marcas a menos que indiquen el suyo propio. |
| `xScale` | `.x_scale(..)` | `Scale` | `{ type: "point" }` | Cómo sitúa el eje x las filas: `point` (en orden, de forma uniforme desde el borde izquierdo hasta el derecho; una fila en el medio), `linear` con un `domain` opcional, o `band` (una banda por fila, para barras, [Bar](#bar); o una banda por categoría, para celdas, [Cell](#cell)). Con una escala y `band` el valor por defecto es `linear`, para barras horizontales. `reverse: true` la hace correr desde el borde derecho ([Escalas invertidas](#reversed-scales)). |
| `yScale` | `.y_scale(..)` | `Scale` | `{ type: "linear" }` | Cómo sitúa el eje y los valores: el valor más pequeño del dominio en el borde inferior, el más grande en el superior. Sin un `domain`, la extensión de lo que dibujan las marcas. `band` dispone una banda por fila desde el borde superior hacia abajo, para barras horizontales. `reverse: true` la hace correr al revés: el valor más pequeño en el borde superior, las filas desde el borde inferior hacia arriba ([Escalas invertidas](#reversed-scales)). |
| `y2Scale` | `.y2_scale(..)` | `LinearScale` | ninguno | Una segunda escala y, `{ type: "linear", domain?, reverse? }`, para las marcas que la nombran (`scale="y2"`): la escala derecha de un gráfico de doble eje ([Ejes duales](#dual-axes)). Sin un `domain`, la extensión de los valores que hay en ella. |
| `alignTicks` | `.align_ticks(..)` | `boolean` | `true` | Mientras ninguna escala y nombre un dominio y haya marcas en ambas, las dos se amplían con los mismos pasos redondos para que sus marcas de graduación coincidan en las mismas líneas ([Ejes duales](#dual-axes)). `false` mantiene en cada una la extensión de sus valores. |
| `interactive` | `.interactive(..)` | `boolean` | `true` | El plot sigue al puntero y al teclado: informa de la fila que tiene debajo y muestra las partes del hover, y es una parada de Tab cuyas teclas de flecha mueven el hover ([Teclado](#keyboard)). `false` dibuja solo las marcas (un sparkline en una lista), y las pulsaciones sobre él pasan a las vistas que lo rodean. Si el plot ofrece o no el teclado se decide al crearlo. |
| `motion` | `.motion(..)` | `PlotMotion` | ninguno | La temporización de la aparición, el fundido de entrada y salida del hover, y el resorte sobre el que se desliza el hover cuando las teclas lo mueven (abajo). |
| `appearGeneration` | `.appear_generation(..)` | `number \| string` | ninguno | Activa la aparición: las marcas se dibujan progresivamente cuando el plot se muestra por primera vez, y de nuevo cada vez que esto cambia (otro símbolo, otro período). Dentro de un [`PlotAppearScope`](#plotappearscope), una generación que terminó allí se muestra completa de inmediato. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | ninguno | Lo que los lectores de pantalla dicen del gráfico: qué muestra y qué destaca. |
| `accessibilityValue` | `.accessibility_value(..)` | `{ min?, max?, now?, text? }` | ninguno | Lo que los lectores de pantalla oyen como su valor: las palabras de la app para la fila bajo el puntero. |
| `crossLineClass`, `crossLineStyle` | `.cross_line_class(..)`, `.cross_line_style(..)` | `string`, `StyleProp<ViewStyle>` | ninguno | La línea cruzada: una vista tan alta como el plot, centrada en la fila bajo el puntero. En una escala de bandas se sitúa en la banda de la fila, tan ancha como la banda (a lo ancho del plot en una escala y de bandas). |
| `dotClass`, `dotStyle` | `.dot_class(..)`, `.dot_style(..)` | `string`, `StyleProp<ViewStyle>` | ninguno | Los puntos del hover: una vista por cada `Line`, `Area` y `RadialLine`, centrada en su punto en la fila bajo el puntero, y la de un `Dot` es tan grande como su punto bajo el puntero. El `hoverDotClass` / `hoverDotStyle` de una marca los sustituyen para su propio punto. |
| `tooltipContent` | `.tooltip_content(..)` | `JSX.Element` | ninguno | El tooltip de la app, situado por `tooltipPlacement` y movido y desvanecido junto con la línea cruzada. |
| `tooltipPlacement` | `.tooltip_placement(..)` | `"top" \| "pointer"` | `"top"` | Dónde va el tooltip: en la parte superior del plot, centrado en la línea cruzada; o junto al puntero, en el lado de la línea cruzada que mira al centro del plot y debajo del puntero en la mitad superior, encima de él en la inferior. En la parte superior permanece entre los bordes izquierdo y derecho del plot (su desplazamiento desde el borde superior es de la app: una etiqueta bajo el plot toma la altura del plot y más); junto al puntero permanece dentro del plot. Con el teclado, va junto al punto de la primera línea o área en la fila (el centro de la banda de una barra, el centro del sector de un pie). |
| `tooltipOffset` | `.tooltip_offset(..)` | `number` | `0` | La distancia entre el tooltip y lo que lo sitúa: el borde superior para `"top"`, la línea cruzada y el puntero para `"pointer"`. |
| `colorScale` | `.color_scale(..)` | `ColorScale` | ninguno | Los colores de las marcas: de las categorías que lee su `color`, como el `scaleOrdinal` de d3 (`{ type: "ordinal", domain?, range, unknown? }`, [Colores por categoría](#colors-by-category)), o de los números que lee el `value` de un `Cell` a lo largo de una rampa, como `scaleSequential` y `scaleDiverging` de d3 (`{ type: "sequential" \| "diverging", … }`, [Colores a lo largo de una rampa](#colors-along-a-ramp)). |
| `children` | `.child(..)` | `JSX.Element` | ninguno | Las marcas, dibujadas en orden unas sobre otras, y lo que la app coloque encima. |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | ninguno | El tamaño y el aspecto del plot; las marcas heredan sus propiedades de pintura, como las hereda CSS. Las clases `focus:` / `focus-visible:` y `focusStyle` dibujan su anillo de foco. |

| Evento | Rust | Carga | Cuándo |
|---|---|---|---|
| `onHoverChange` | `.on_hover_change(..)` | `{ index: number \| null }` | El puntero pasó a otra fila: el índice de la fila más cercana a él a lo largo del eje x (a lo largo del eje y cuando solo este tiene bandas), del sector del [pie](#pie-and-arc) bajo él, del [dot](#dot) cuyo centro está más cerca de él, de la [cell](#cell) bajo él (en el hueco entre dos celdas, la más cercana), o de la fila de una [radial line](#radialline-and-radialgrid) más cercana a él por ángulo; `null` una vez que sale del plot (sobre un pie, sus sectores; sobre una radial line, su radio exterior). |

`Scale` es `{ type: "point"; reverse? } | { type: "linear"; domain?: [number, number]; reverse? } | { type: "band";
domain?: string[]; paddingInner?; paddingOuter?; maxBandWidth?; bandCount?; groupPadding?; reverse? }`. A `linear`
El `domain` de una escala es la extensión de sus dos valores, en cualquier orden; un dominio de un solo valor lo coloca en el medio. El `domain` de una escala `band` son las categorías de sus bandas, en orden ([Cell](#cell)); sus otras opciones están en [Bar](#bar).

Una función de una fila (`y={(d) => d.high - d.low}`) se llama una vez por fila cuando cambian las filas o la función, en el siguiente turno, nunca mientras el plot dibuja o sigue al puntero: mantenla pura (la misma fila, el mismo número). Un nombre de campo se lee sin nada de JS.

<a id="reversed-scales"></a>

### Escalas invertidas

`reverse: true` hace correr una escala desde su otro borde, igual que las escalas de visx aceptan `reverse` y las de d3 aceptan un rango escrito al revés. En el eje x, la primera fila, o el valor más pequeño del dominio, está en el borde derecho; en el eje y, el valor más pequeño del dominio está en el borde superior y las filas corren desde el borde inferior hacia arriba. Todo lo situado sobre la escala la sigue: las marcas, la base de las barras y la dirección en que crecen, la línea base de un área, las líneas de la cuadrícula, las marcas de graduación de `PlotAxis`, la fila que encuentra el hover, las teclas de flecha ([Teclado](#keyboard)) y los movimientos a un nuevo dominio. Las barras cuelgan del borde superior en una escala y `linear` invertida, y las barras horizontales crecen hacia la izquierda desde el borde derecho en una escala x `linear` invertida:

```tsx
<Plot
  data={depths}
  y="depth"
  xScale={{ type: "band", paddingInner: 0.2 }}
  yScale={{ type: "linear", domain: [0, 40], reverse: true }}
  class="h-32"
>
  <Bar class="fill-chart-2" cornerRadii={{ bottomLeft: 3, bottomRight: 3 }} />
</Plot>
```

Con la aparición del plot, las líneas y las áreas se dibujan progresivamente desde el borde donde empieza la escala x, el derecho cuando está invertida.

<a id="dual-axes"></a>

### Ejes duales

<!-- demo: el-plot-dual -->

Un plot tiene una segunda escala y para valores de otras unidades: volúmenes junto a un precio, ingresos junto a un margen. Toda parte que sitúa valores a lo largo de y acepta `scale`: `"y"` (el valor por defecto, el `yScale` del plot) o `"y2"` (su `y2Scale`). Un `PlotAxis` a la derecha con `scale="y2"` la rotula:

```tsx
<Plot data={days} xScale={{ type: "band", paddingInner: 0.3 }} class="mx-10 mb-6 h-44">
  <Grid class="stroke-border" />
  <Bar value="volume" class="fill-chart-2/50" />
  <Line y="close" scale="y2" class="stroke-chart-1 stroke-2" />
  <PlotAxis placement="left" format={(v) => `${v}M`} labelClass="pr-2 text-xs text-muted-foreground" />
  <PlotAxis placement="right" scale="y2" labelClass="pl-2 text-xs text-muted-foreground" />
</Plot>
```

El dominio de cada escala es propio: el `domain` de la app, o la extensión de los valores que hay en ella, y cada una se mueve a uno nuevo con `motion.update`. Mientras ninguna escala nombre un dominio, el plot dispone ambas con el mismo número de pasos redondos (1, 2 o 5 veces una potencia de diez, un paso por cada 32 puntos de altura aproximadamente): cuando ambas contienen el cero, el cero cae en la misma línea en las dos; en caso contrario, una escala que empieza en cero (volúmenes) gana sus pasos adicionales hacia arriba y la otra (un precio) por ambos lados. Las marcas de graduación de los ejes son esos pasos, y un `Grid` sin `x` ni `y` dibuja sus líneas en ellos, de modo que una sola cuadrícula sirve a ambos ejes. `alignTicks={false}` desactiva esto; un `domain` que la app indique deja ambas escalas tal como están.

El hover encuentra una fila; el punto de cada marca se sitúa en su propia escala, y la lectura es de la app, que lee ambos valores de la fila que informa `onHoverChange`. Las barras en ambas escalas se colocan una junto a otra en cada banda, y un `stack` apila solo las barras de su escala. `y2Scale` es lineal: un plot cuyo eje y tiene bandas no tiene segunda escala y.
<a id="line-area-and-grid"></a>

## Line, Area y Grid

| Mark | Prop | Tipo | Por defecto | Descripción |
|---|---|---|---|---|
| `Line` | `y` | `string \| (d, index) => number` | el `y` del plot | Lo que dibuja: un punto por cada fila con valor; las filas sin él se omiten. |
| `Line`, `Area` | `data`, `x` | `T[]`, `string \| (d, index) => number` | las filas del plot | Filas de una serie propia (otros valores de x), situadas en las escalas del plot mediante su propio `x` (el índice de la fila si no lo tiene). |
| `Line`, `Area` | `curve` | `"natural" \| "linear" \| "stepAfter"` | `"natural"` | Cómo conecta sus puntos: una curva suave, segmentos rectos o escalones que mantienen cada valor hasta la fila siguiente. El borde inferior de un area sigue la misma curva. |
| `Line` | `dot`, `dotClass`, `dotStyle` | `boolean`, `string`, `StyleProp<ViewStyle>` | `false` | Un punto en cada dato: una vista centrada en él, con su tamaño, fondo y borde definidos por la app. |
| `Line`, `Area` | `hoverDotClass`, `hoverDotStyle` | `string`, `StyleProp<ViewStyle>` | el `dotClass`, `dotStyle` del plot | Su punto de hover, sobre su dato en la fila bajo el puntero: el punto de cada serie, en su propio color. Cada uno sustituye al del plot para este mark (el color del mark sobre el tamaño y el anillo del plot); `hidden` no muestra ninguno. |
| `Area` | `backgroundClass`, `backgroundStyle` | `string`, `StyleProp<ViewStyle>` | ninguno | Su fondo: una caja alrededor de su forma (desde su primer punto hasta el último, desde su punto más alto hasta su línea base, o hasta el punto más bajo de su borde inferior en una banda) cuyo fondo (`bg-*`, `bg-linear-to-b from-… to-…`, `backgroundImage`) se muestra solo dentro de la forma, bajo su `fill`. Con uno, `fill` es `none` donde no se haya definido ninguno. |
| `Area` | `y1` | `string \| (d, index) => number` | el `y` del plot | Lo que forma su borde superior. |
| `Area` | `y0` | `number \| string \| (d, index) => number` | el extremo inferior de la escala y | Su borde inferior: un número es una línea base en la escala y; un campo o una función da a cada fila su propio valor inferior, lo que convierte el area en una banda (del mínimo al máximo de un día, el rango de un pronóstico). Sin él, el area se cierra en el borde donde están los valores más pequeños de la escala y: el borde inferior, o el superior en una escala invertida (un area colgando desde arriba). Una fila sin valor en cualquiera de los dos bordes se omite. |
| `Line`, `Area`, `Grid` | `scale` | `"y" \| "y2"` | `"y"` | La escala y a lo largo de la cual van sus valores: el `yScale` del plot o el segundo, `y2Scale` ([Ejes duales](#dual-axes)). |
| `Grid` | `x` | `number[]` | ninguno | Dónde van sus líneas verticales, como valores de la escala x (índices de fila en una escala `point`). |
| `Grid` | `y` | `number[]` | ninguno | Dónde van sus líneas horizontales, como valores de la escala y. Sin `x` ni `y`, las líneas siguen las marcas de su escala, donde las coloca un `PlotAxis` sin `ticks` (a lo largo de x para barras horizontales). |
| `Grid` | `ticks` | `number` | el valor por defecto del eje | Aproximadamente cuántas líneas dibuja sin `x` ni `y`, como el `ticks` de un `PlotAxis`. |
| `Line`, `Area` | `color` | `string \| (d, index) => string` | ninguno | La categoría de sus filas, con su color tomado del `colorScale` del plot: la categoría de su primera fila da el `stroke` de la línea (el `fill` del area) donde nada lo defina ([Colores por categoría](#colors-by-category)). |

Cada mark ocupa todo el plot y se pinta con sus [propiedades de pintura SVG](../modules/style-reference.md#svg-paint), las suyas sobre las del plot, tal como CSS las hereda:

| Mark | Se pinta con | Donde no hay ninguna definida |
|---|---|---|
| `Line` | `stroke`, `strokeWidth`, `strokeDasharray` | `currentColor`, 1 de ancho, sólido |
| `Area` | `fill` (sobre su parte `background`); su borde superior `stroke`, `strokeWidth`, `strokeDasharray` | `fill` `currentColor` (`none` junto a un fondo); sin trazo |
| `Grid` | `stroke`, `strokeWidth`, `strokeDasharray` | `currentColor`, 1 de ancho, sólido; cada línea en píxeles de dispositivo completos, de modo que una línea fina se mantiene nítida |

Los valores que dibuja un `Line` o un `Area`, también el `y0` de un area (su línea base, o el valor inferior de cada fila), forman el dominio de la escala y cuando el plot no tiene ninguno; los de un grid no. Un mark se vuelve a dibujar solo cuando cambia lo que dibuja (sus filas, valores, curva, el tamaño o las escalas del plot, su pintura); el puntero mueve las partes del hover y nunca vuelve a dibujar un mark.

Una banda es un `Area` cuyo `y0` lee las filas: su borde superior recorre `y1`, su borde inferior vuelve por `y0`, ambos con el `curve` del area, y el appear dibuja ambos desde el borde inicial. Su punto de hover se sitúa en el borde superior; un `Line` encima marca el valor medio:

```tsx
<Plot data={days} y="close">
  <Area y1="high" y0="low" class="fill-chart-1/15" hoverDotClass="hidden" />
  <Line class="stroke-chart-1 stroke-2" />
</Plot>
```

`fill` es el de CSS, como en un navegador: un color. Un degradado bajo una línea es el fondo de un area, igual que una página muestra un degradado en una forma (el `background-image` de una caja bajo `clip-path`): `backgroundClass="bg-linear-to-b from-chart-1/20
to-transparent"` se desvanece desde el punto más alto del area hasta su línea base, con los tokens del tema y los colores de la apariencia, como el fondo de cualquier vista.

## Bar

Un `Bar` dibuja una barra por fila en la banda de la fila de una escala `band`: vertical en una escala x de bandas, horizontal en una escala y de bandas (la escala x entonces `linear`). Cada barra va desde `base` hasta el valor de la fila en la otra escala, de modo que un valor negativo crece en sentido contrario, y una fila sin valor no tiene barra. En una escala de valores invertida, las barras crecen hacia abajo desde el borde superior o hacia la izquierda desde el derecho, y una escala de bandas invertida coloca la banda de la primera fila a la derecha o abajo ([Escalas invertidas](#reversed-scales)).

```tsx
import { Bar, Grid, Plot } from "nsh/base/plot";

const sales = [
  { month: "Jan", online: 42, store: 31 },
  { month: "Feb", online: 51, store: 28 },
  { month: "Mar", online: 48, store: 36 },
];

<Plot
  data={sales}
  xScale={{ type: "band", paddingInner: 0.3, paddingOuter: 0.15, groupPadding: 0.1 }}
  yScale={{ type: "linear", domain: [0, 60] }}
  class="h-40"
>
  <Grid y={[20, 40, 60]} class="stroke-border" />
  <Bar value="online" class="fill-chart-1" cornerRadii={{ topLeft: 4, topRight: 4 }} />
  <Bar value="store" class="fill-chart-2" cornerRadii={{ topLeft: 4, topRight: 4 }} />
</Plot>
```

Las barras fuera de un stack se sitúan una junto a otra en cada banda, en el orden de los marks; las barras con el mismo `stack` se apilan, y la barra de cada fila empieza donde termina la anterior del stack:

```tsx
<Bar value="online" stack="sales" class="fill-chart-1" />
<Bar value="store" stack="sales" class="fill-chart-2" cornerRadii={{ topLeft: 4, topRight: 4 }} label={(d) => `${d.online + d.store}`} />
```

| Prop | Tipo | Por defecto | Descripción |
|---|---|---|---|
| `value` | `string \| (d, index) => number` | el `y` del plot | Lo que muestra cada barra. |
| `base` | `number \| string \| (d, index) => number` | `0` | El valor desde el que crecen sus barras, en la escala de valores: uno para todas las filas, o un campo o función que da a cada fila el suyo, de modo que cada barra abarca desde la base de su fila hasta su valor (una fila sin base no tiene barra). Cuenta en el dominio. Un stack crece desde la base de su primera barra, fila por fila. |
| `stack` | `string` | ninguno | El stack al que se une: las barras con el mismo `stack` se apilan en orden (una fila sin valor no añade nada). |
| `scale` | `"y" \| "y2"` | `"y"` | La escala y a lo largo de la cual van los valores de sus barras verticales ([Ejes duales](#dual-axes)); las barras de ambas se sitúan una junto a otra, y un stack apila solo las barras de su escala. |
| `cornerRadii` | `number \| { topLeft?, topRight?, bottomRight?, bottomLeft? }` | `0` | El radio de cada esquina de sus barras; `{ topLeft: 4, topRight: 4 }` redondea los extremos de las barras verticales. Un radio mayor que la mitad de una barra se ajusta a ella. |
| `stagger` | `number` | `0` | Con el appear del plot, las barras empiezan una tras otra, fila por fila, a lo largo de esta proporción del mismo (de 0 a 0.95), y cada una crece durante el resto; 0 las hace crecer juntas. |
| `inactiveOpacity` | `number` | ninguno | La opacidad de sus barras alejadas de la fila bajo el puntero mientras este está sobre el plot, de modo que esa fila destaque: aparece y desaparece gradualmente con el hover y pasa de barra en barra con él. |
| `label` | `string \| (d, index) => string` | ninguno | El texto en el extremo de valor de cada barra: un campo (su texto o su número) o una función que devuelve el texto que formatea la app. |
| `labelClass`, `labelStyle` | `string`, `StyleProp<TextStyle>` | ninguno | La parte `label`: un texto centrado en la barra, sobre el extremo de una barra vertical (bajo una que crece hacia abajo), después de una barra horizontal (antes de una que crece hacia atrás). Su padding es su distancia a la barra. |
| `backgroundClass`, `backgroundStyle` | `string`, `StyleProp<ViewStyle>` | ninguno | Su fondo: la caja de cada barra, cuyo fondo (`bg-linear-to-t from-… to-…`, desde la base de la barra hasta su extremo) se muestra solo dentro de la barra, bajo su `fill`. Con uno, `fill` es `none` donde no se haya definido ninguno. |
| `color` | `string \| (d, index) => string` | ninguno | La categoría de cada barra, con su color tomado del `colorScale` del plot: el `fill` de la barra donde nada lo defina ([Colores por categoría](#colors-by-category)). |

La escala de bandas dispone una banda por fila del plot, en orden, o una banda por categoría de su `domain`, como hace el `scaleBand` de d3:

| Opción | Por defecto | Descripción |
|---|---|---|
| `domain` | ninguno | Las categorías de sus bandas, en orden (el `scaleBand().domain()` de d3): un [`Cell`](#cell) va en la banda de la categoría de su fila, y un `PlotAxis` escribe la categoría de cada banda; una categoría escrita dos veces conserva su primer lugar. Sin él, las bandas son las filas o, sobre celdas, las categorías que las celdas nombran a lo largo del eje, en el orden en que las filas las traen. |
| `paddingInner` | `0` | El espacio entre bandas vecinas, como proporción del paso de cada banda (de 0 a 1). |
| `paddingOuter` | `0` | El espacio antes de la primera banda y después de la última, como proporción de un paso. La mitad de `paddingInner` sitúa los centros de las bandas a pasos iguales a lo largo del plot. |
| `maxBandWidth` | ninguno | Lo más ancha que puede ser una banda, en puntos: unas pocas bandas en un plot ancho se mantienen estrechas, cada una en el centro de su lugar. |
| `bandCount` | las filas | Las bandas para las que se dispone el eje cuando son más que las filas: las filas ocupan las primeras y conservan su ancho y su lugar a medida que llegan. |
| `groupPadding` | `0` | El espacio entre las barras situadas una junto a otra en una banda, como proporción del lugar de cada barra. |
| `reverse` | `false` | Las bandas corren desde el otro borde: la de la primera fila a la derecha del eje x, en la parte inferior del eje y; las barras situadas una junto a otra en una banda conservan su orden. |

Una barra se pinta con su `fill` (`fill-*`; heredado del plot como CSS hereda), `currentColor` donde no hay ninguno definido (el color de su categoría con `color`), y no muestra punto de hover. En una escala de bandas, el hover encuentra la banda bajo el puntero, y la línea cruzada del plot se sitúa en esa banda, tan ancha como ella: `crossLineClass="w-full h-full bg-foreground/5"` tiñe la banda, `w-px` mantiene una línea en su centro. Los valores y la base de las barras forman el dominio de la escala de valores cuando el plot no tiene ninguno. Con el appear del plot, cada barra crece desde la base de su stack; el movimiento, el desvanecimiento y el deslizamiento se ejecutan en el animator de la plataforma, y el puntero no vuelve a dibujar ninguna barra.

<a id="ranges"></a>

### Rangos

<!-- demo: el-plot-ranges -->

Con `base` como campo o función, cada barra abarca dos valores de su fila: el paso de una cascada (waterfall) desde el total acumulado anterior hasta el posterior, el cuerpo de una vela desde su apertura hasta su cierre, una tarea desde su inicio hasta su fin. Una barra crece desde su propia base al aparecer, y su etiqueta se sitúa en su extremo de valor, sobre una barra que sube y bajo una que baja.

```tsx
const bridge = [
  { step: "Revenue", from: 0, to: 120, kind: "total" },
  { step: "Costs", from: 120, to: 72, kind: "down" },
  { step: "Other", from: 72, to: 81, kind: "up" },
  { step: "Profit", from: 0, to: 81, kind: "total" },
];

<Plot
  data={bridge}
  xScale={{ type: "band", paddingInner: 0.3 }}
  colorScale={{ type: "ordinal", domain: ["total", "up", "down"], range: ["#64748b", "#16a34a", "#dc2626"] }}
  class="h-40"
>
  <Bar value="to" base="from" color="kind" label={(d) => `${d.to - d.from}`} labelClass="text-xs pb-1" />
</Plot>
```

Un embudo (funnel) son barras horizontales, centradas: `base={(d) => -d.users / 2}` y `value={(d) => d.users / 2}` en una escala y de bandas.

## Rule

Un `Rule` dibuja una línea recta por fila a lo largo del eje de valores, desde `base` hasta el valor de la fila: en el centro de la banda de la fila en una escala de bandas (a lo ancho del plot en una escala y de bandas), en el lugar de la fila a lo largo del eje x en una escala de puntos o lineal. La mecha de una vela, el bigote de un diagrama de caja, una barra de error y el tallo de un lollipop son rules; un candlestick es un `Bar` sobre un `Rule`:

```tsx
import { Bar, Plot, Rule } from "nsh/base/plot";

<Plot
  data={days}
  xScale={{ type: "band", paddingInner: 0.4 }}
  colorScale={{ type: "ordinal", domain: ["up", "down"], range: ["#16a34a", "#dc2626"] }}
  class="h-48"
>
  <Rule value="high" base="low" color={(d) => (d.close >= d.open ? "up" : "down")} />
  <Bar value="close" base="open" color={(d) => (d.close >= d.open ? "up" : "down")} />
</Plot>
```

| Prop | Tipo | Por defecto | Descripción |
|---|---|---|---|
| `value` | `string \| (d, index) => number` | el `y` del plot | Dónde termina cada línea. Una fila sin valor no tiene línea. |
| `base` | `number \| string \| (d, index) => number` | `0` | Dónde empieza cada línea: un valor para todas las filas (el tallo de un lollipop desde la línea cero), o un campo o función que da a cada fila el suyo (el mínimo de una vela). Cuenta en el dominio. |
| `scale` | `"y" \| "y2"` | `"y"` | La escala y a lo largo de la cual van sus valores ([Ejes duales](#dual-axes)). |
| `stagger` | `number` | `0` | Con el appear del plot, las líneas empiezan una tras otra, fila por fila, a lo largo de esta proporción del mismo (de 0 a 0.95), y cada una crece desde su inicio durante el resto. |
| `inactiveOpacity` | `number` | ninguno | La opacidad de sus líneas alejadas de la fila bajo el puntero mientras este está sobre el plot, igual que la de `Bar`. |
| `color` | `string \| (d, index) => string` | ninguno | La categoría de cada línea, con su color tomado del `colorScale` del plot: el `stroke` de la línea donde nada lo defina. |

Un rule traza con su `stroke` (`stroke-*`, `strokeWidth`, `strokeDasharray`; heredado del plot como CSS lo hereda), `currentColor` donde no hay ninguno definido, y no muestra punto de hover. Sus valores y su base forman el dominio de la escala de valores cuando el plot no tiene ninguno; crece desde su inicio con el appear del plot y se mueve con los dominios de las escalas, en el animator de la plataforma.
## Dot

<!-- demo: el-plot-dots -->

Un `Dot` dibuja un punto por fila allí donde se encuentran dos valores de la fila: su `x` a lo largo de una escala x `linear` y su `value` hacia arriba en el eje y forman un gráfico de dispersión; en una escala x de bandas, cada punto se sitúa en el centro de la banda de su fila; en una escala y de bandas (la escala x `linear`), su valor se extiende a lo largo de x y la banda de su fila desciende por el gráfico, un gráfico de puntos. Su radio `r` es un único número para todos los puntos, o un valor de cada fila que `rScale` convierte en un radio, un gráfico de burbujas. Una fila sin valor no tiene punto.

```tsx
import { Dot, Grid, Plot } from "nsh/base/plot";
import { token } from "nsh";

const sessions = [
  { minutes: 12, trades: 5, platform: "iOS" },
  { minutes: 8, trades: 3, platform: "Android" },
  { minutes: 26, trades: 11, platform: "Web" },
  { minutes: 17, trades: 8, platform: "iOS" },
];

<Plot
  data={sessions}
  x="minutes"
  xScale={{ type: "linear", domain: [0, 40] }}
  yScale={{ type: "linear", domain: [0, 20] }}
  colorScale={{ type: "ordinal", domain: ["iOS", "Android", "Web"], range: [token("chart-1"), token("chart-2"), token("chart-3")] }}
  class="h-48"
>
  <Grid x={[10, 20, 30]} y={[5, 10, 15]} class="stroke-border" />
  <Dot
    value="trades"
    r={4}
    color="platform"
    inactiveOpacity={0.3}
    class="stroke-card stroke-2"
    hoverDotClass="rounded-full outline-2 outline-offset-1 outline-foreground"
  />
</Plot>
```

Con `r` como campo o como función, el valor de cada fila determina el tamaño de su punto. `rScale={{ type: "sqrt", range: [min, max] }}` asigna las raíces cuadradas de los valores a radios en puntos, como hace `scaleSqrt` de d3, de modo que con un rango que empieza en 0 el área de una burbuja es proporcional a su valor; un rango que empieza por encima de 0 mantiene visibles las burbujas más pequeñas. El dominio va de 0 al mayor valor, salvo que la escala indique uno. Los puntos más grandes se dibujan primero, de modo que los más pequeños sigan visibles encima de ellos:

```tsx
<Plot
  data={countries}
  x="gdp"
  xScale={{ type: "linear", domain: [-10, 95] }}
  yScale={{ type: "linear", domain: [48, 90] }}
  colorScale={{ type: "ordinal", range: [token("chart-1"), token("chart-2"), token("chart-3"), token("chart-4")] }}
  class="h-56"
>
  <Dot value="life" r="population" rScale={{ type: "sqrt", range: [3, 24] }} color="region" class="stroke-card" />
</Plot>
```

Los valores de un punto forman el dominio de la escala de valores cuando el gráfico no tiene ninguno, sin llegar hasta 0, de modo que los ejes de un gráfico de dispersión se ajustan a sus puntos. Dé al gráfico `domain`s con algo de margen alrededor de los valores cuando los puntos sean grandes: una burbuja en el borde del dominio se dibuja sobre el borde del gráfico.

Dos marcas en las mismas bandas forman los gráficos que comparan dos valores de una fila: un lollipop es un `Rule` desde 0 bajo un `Dot` en su valor, y un dumbbell es un `Rule` de un valor a otro con un `Dot` en cada extremo, en una escala y de bandas:

```tsx
<Plot data={stocks} yScale={{ type: "band", paddingInner: 0.3 }} xScale={{ type: "linear", domain: [-50, 80] }} class="h-48">
  <Rule value="high" base="low" class="stroke-border stroke-2" />
  <Dot value="before" r={3.5} class="fill-card stroke-muted-foreground" hoverDotClass="hidden" />
  <Dot value="now" r={5} class="fill-chart-1 stroke-card stroke-2" hitRadius={24} />
</Plot>
```

| Prop | Type | Default | Description |
|---|---|---|---|
| `value` | `string \| (d, index) => number` | el `y` del gráfico | Dónde va cada punto a lo largo del eje de valores: hacia arriba en el eje y, o a lo largo de x en una escala y de bandas. Una fila sin valor no tiene punto. |
| `r` | `number \| string \| (d, index) => number` | `3` | El radio de los puntos en puntos, o un campo o una función que da a cada fila un valor que `rScale` convierte en un radio (sin uno, el valor es el radio). Una fila cuyo valor falta no tiene punto. |
| `rScale` | `{ type: "sqrt"; domain?: [number, number]; range: [number, number] }` | none | Cómo los valores de `r` se convierten en radios: sus raíces cuadradas sobre el `domain` (de 0 al mayor valor si no hay ninguno) hacia el `range` de radios, de modo que un rango que empieza en 0 hace que el área de cada punto sea proporcional a su valor. Los valores fuera del dominio toman los extremos del rango. |
| `stagger` | `number` | `0` | Con el appear del gráfico, los puntos empiezan a crecer uno tras otro, fila por fila, a lo largo de esta fracción de la animación (de 0 a 0.95); 0 los hace crecer a la vez. |
| `inactiveOpacity` | `number` | none | La opacidad de sus demás puntos mientras uno está bajo el puntero o las teclas: se desvanecen y reaparecen con el hover. |
| `color` | `string \| (d, index) => string` | none | La categoría de cada punto, cuyo color procede del `colorScale` del gráfico: el `fill` del punto cuando nada establece uno ([Colors by category](#colors-by-category)). |
| `hitRadius` | `number` | `8` | A qué distancia del borde de un punto el puntero aún lo encuentra: de los puntos dentro de esta distancia, el puntero encuentra aquel cuyo centro esté más cerca (celdas de Voronoi), de modo que una burbuja pequeña sobre una grande se encuentra alrededor de su propio centro. La fila de un gráfico de puntos se encuentra desde cualquier lugar a lo largo de ella con un radio tan grande como una fila. |
| `scale` | `"y" \| "y2"` | `"y"` | La escala y a lo largo de la cual van sus valores ([Dual axes](#dual-axes)); los puntos en una escala y de bandas ponen sus valores a lo largo de x. |
| `hoverDotClass`, `hoverDotStyle` | `string`, `StyleProp<ViewStyle>` | el `dotClass`, `dotStyle` del gráfico | La parte `hoverDot`: una vista tan ancha y alta como el punto bajo el puntero, centrada en él. `rounded-full outline-2 outline-offset-1` lo rodea con un anillo; `hidden` no muestra ninguna para esta marca. |

Un punto se rellena con su `fill` (`fill-*`; heredado del gráfico como CSS lo hereda), con `currentColor` donde no se establece ninguno (el color de su categoría con `color`), y su trazo usa su `stroke` donde se establece uno (`stroke-*`, `strokeWidth`): un anillo del color de la tarjeta mantiene separados los puntos que se solapan. Sobre un gráfico con puntos, el gráfico informa de la fila del punto cuyo centro está más cerca del puntero (`null` lejos de todos los puntos), las teclas recorren las filas en su orden (ordene las filas por x y las teclas recorrerán los puntos de izquierda a derecha), y la parte `hoverDot` marca el punto. Con el appear del gráfico, los puntos crecen desde la nada; con `motion.update`, se mueven a sus nuevos valores y tamaños, el punto de una fila nueva crece y el de una fila que ya no está se encoge hasta desaparecer; todo en el animador de la plataforma, sin volver a dibujar ninguna marca.

## Cell

<!-- demo: el-plot-cells -->

Un `Cell` dibuja un rectángulo por fila en dos bandas a la vez: la banda de su categoría `x` a lo largo de una escala x `band` y la banda de su categoría `y` a lo largo de una escala y `band`, de modo que las filas forman una cuadrícula, un heatmap. Una matriz de correlación, un calendario de rendimientos mensuales y una semana de operaciones por hora son cells. Cada celda llena sus dos bandas, así que `paddingInner` y `paddingOuter` de las escalas son los espacios entre las celdas y a su alrededor. Su color es su `value` a lo largo del `colorScale` del gráfico, una rampa de colores ([Colors along a ramp](#colors-along-a-ramp)), o el de su categoría `color` mediante una escala ordinal. Las celdas se sitúan en las escalas x e y del gráfico.

```tsx
import { Cell, Plot, PlotAxis } from "nsh/base/plot";
import { token } from "nsh";

const months = [
  { year: "2025", month: "Jan", ret: 2.7 },
  { year: "2025", month: "Feb", ret: -1.4 },
  { year: "2025", month: "Mar", ret: -5.8 },
  { year: "2026", month: "Jan", ret: 1.9 },
  { year: "2026", month: "Feb", ret: 3.2 },
];

<Plot
  data={months}
  xScale={{ type: "band", domain: ["Jan", "Feb", "Mar"], paddingInner: 0.08 }}
  yScale={{ type: "band", paddingInner: 0.08 }}
  colorScale={{ type: "diverging", range: [token("destructive"), token("muted"), token("chart-1")] }}
  class="ml-10 mt-6 h-24"
>
  <Cell
    x="month"
    y="year"
    value="ret"
    cornerRadii={3}
    inactiveOpacity={0.4}
    label={(d) => d.ret.toFixed(1)}
    labelClass="text-xs tabular-nums text-black/70 data-dark:text-white"
    hoverCellClass="rounded-sm outline-2 outline-offset-1 outline-foreground"
  />
  <PlotAxis placement="top" labelClass="pb-1.5 text-xs text-muted-foreground" />
  <PlotAxis placement="left" labelClass="w-10 pr-2 text-right text-xs text-muted-foreground" />
</Plot>
```

El `domain` de una escala de bandas nombra las categorías de sus bandas en orden, como hace `scaleBand().domain()` de d3: los meses de un calendario de enero a diciembre, cada uno con su banda haya llegado o no alguna de sus filas, de modo que marzo de 2026 arriba es un hueco en blanco de la cuadrícula. Sin dominio, las bandas son las categorías que las celdas nombran a lo largo del eje, en el orden en que las filas las traen (2025 sobre 2026). Un `PlotAxis` a lo largo de una escala de bandas de categorías escribe la categoría de cada banda, sin `format`.

Una matriz de correlación nombra las mismas posiciones a lo largo de ambos ejes, con su `domain` igual a todo el rango de los coeficientes, de modo que un coeficiente de 0 toma el centro de la rampa sean cuales sean las posiciones:

```tsx
const tickers = ["NVDA", "AMD", "MSFT", "GLD"];

<Plot
  data={pairs}
  xScale={{ type: "band", domain: tickers, paddingInner: 0.06 }}
  yScale={{ type: "band", domain: tickers, paddingInner: 0.06 }}
  colorScale={{ type: "diverging", domain: [-1, 1], range: [token("chart-2"), token("muted"), token("chart-1")] }}
  class="aspect-square"
>
  <Cell x="b" y="a" value="r" label={(d) => d.r.toFixed(2)} labelClass="text-xs text-black/70 data-dark:text-white" />
</Plot>
```

| Prop | Type | Default | Description |
|---|---|---|---|
| `x` | `string \| (d, index) => string` | none | La columna de cada fila: un campo (su texto o su número) o una función que devuelve la categoría. La celda de la fila va en la banda de esa categoría de la escala x; una fila sin categoría no tiene celda. |
| `y` | `string \| (d, index) => string` | none | La línea de cada fila, como `x` a lo largo de la escala y. |
| `value` | `string \| (d, index) => number` | none | El número de cada celda, que un `sequential` o `diverging` `colorScale` convierte en su color. Una fila sin número toma el color `unknown` de la escala, y si no lo hay, no tiene celda. |
| `color` | `string \| (d, index) => string` | none | La categoría de cada celda, cuyo color procede de una `ordinal` `colorScale` ([Colors by category](#colors-by-category)). |
| `cornerRadii` | `number \| { topLeft?, topRight?, bottomRight?, bottomLeft? }` | `0` | El radio de cada esquina de sus celdas. |
| `stagger` | `number` | `0` | Con el appear del gráfico, las celdas empiezan a crecer una tras otra, fila por fila, a lo largo de esta fracción de la animación (de 0 a 0.95), cada una desde su centro durante el resto; 0 las hace crecer a la vez. |
| `inactiveOpacity` | `number` | none | La opacidad de sus demás celdas y de sus etiquetas mientras una está bajo el puntero o las teclas: se desvanecen y reaparecen con el hover. |
| `label` | `string \| (d, index) => string` | none | La parte `label`: un texto en el centro de cada celda, un campo (su texto o su número) o una función que devuelve el texto que la app formatea. Cada etiqueta se muestra donde su tamaño ya maquetado cabe dentro de su celda, de modo que un gráfico estrecho muestra solo los colores. |
| `labelClass`, `labelStyle` | `string`, `StyleProp<TextStyle>` | none | La fuente, el tamaño y el color de las etiquetas. Una etiqueta sobre una celda cuyo color `colorScale` es oscuro tiene el atributo `data-dark` (donde el texto claro se lee mejor), de modo que `data-dark:text-white` lo escribe claro ahí. |
| `hoverCellClass`, `hoverCellStyle` | `string`, `StyleProp<ViewStyle>` | none | La parte `hoverCell`: una vista tan grande como la celda bajo el puntero o las teclas, encima de ella; `rounded-sm outline-2 outline-foreground` la rodea con un anillo. Se mueve con el puntero en el mismo fotograma y se desliza con el resorte `pointer` cuando las teclas la mueven. |

Una celda se rellena con su color del `colorScale` del gráfico donde la app no establece ningún `fill` (las clases y los estilos de `fill-*` tienen prioridad, heredados del gráfico como CSS los hereda), con `currentColor` donde nada establece uno, y su trazo usa su `stroke` donde se establece uno. Sobre un gráfico con celdas, el gráfico informa de la fila de la celda bajo el puntero y, en el espacio entre dos celdas, de la más cercana; las teclas de flecha recorren la cuadrícula tal como se ve en pantalla ([Keyboard](#keyboard)), y los lectores de pantalla recorren las filas en su orden. Con el appear del gráfico, las celdas crecen desde su centro; con `motion.update`, el color de una celda se desliza hasta su nuevo color, la celda de una fila nueva crece, la de una fila que ya no está se encoge hasta desaparecer, y las celdas se mueven a sus nuevas bandas; todo en el animador de la plataforma, sin volver a dibujar ninguna marca.
<a id="pie-and-arc"></a>

## Pie y Arc

Un `Pie` divide una vuelta en una porción por fila, cada una con su parte de los valores de las filas, en sentido horario desde las 12 en punto y en el orden de las filas, alrededor del centro del plot. Un `innerRadius` lo convierte en un donut. Cada porción es un canvas propio, la parte `slice`, así que cada una se pinta con sus propias clases: `sliceClass` son las mismas clases en todas las porciones, o una función de la fila de la porción que da a cada una las suyas. Sobre un pie, el plot informa de la fila de la porción bajo el puntero (ninguna en el hueco ni fuera del anillo), su tooltip sigue al puntero, y esa porción crece en `hoverLift` mientras las demás se atenúan en `hoverDim`, en el animator de la plataforma y con el `motion` del plot. Un `Arc` dibuja un sector entre dos ángulos: la pista y el valor de un gauge, o un anillo detrás de un pie.

<!-- demo: el-plot-pie -->

```tsx
import { signal, Text, View } from "nsh";
import { Pie, Plot } from "nsh/base/plot";

type Plan = { name: string; seats: number };

const FILLS = ["fill-chart-1", "fill-chart-2", "fill-chart-3", "fill-chart-4"];
const KEYS = ["bg-chart-1", "bg-chart-2", "bg-chart-3", "bg-chart-4"];

export function Seats(props: { plans: Plan[] }) {
  const hovered = signal<number | null>(null);
  const total = () => props.plans.reduce((sum, p) => sum + p.seats, 0);
  const shown = () => (hovered() == null ? undefined : props.plans[hovered()!]);
  const share = (n: number) => `${((n / total()) * 100).toFixed(1)}%`;
  return (
    <View class="flex-row items-center gap-6 rounded-xl border border-border bg-card p-4">
      <Plot
        data={props.plans}
        accessibilityLabel={`Seats by plan, ${total()} in all`}
        accessibilityValue={{ text: shown() && `${shown()!.name}, ${shown()!.seats} seats, ${share(shown()!.seats)}` }}
        appearGeneration={1}
        motion={{ appear: { duration: 900, easing: "easeOut" }, enter: { duration: 120 }, exit: { duration: 160 }, pointer: { stiffness: 400, damping: 32 } }}
        onHoverChange={({ index }) => hovered.set(index)}
        class="size-44"
      >
        {/* A donut with 2-point gaps (0.025 of a turn at its 80-point rim). */}
        <Pie
          value="seats"
          innerRadius="62%"
          padAngle={0.025}
          sliceClass={(_, i) => FILLS[i % FILLS.length]}
          hoverLift={6}
          hoverDim={0.64}
        />
        {/* The hovered plan, or the total, in the hole. */}
        <View class="absolute inset-0 items-center justify-center gap-1">
          <Text class="text-xs text-muted-foreground">{shown()?.name ?? "Total"}</Text>
          <Text class="text-2xl font-semibold tabular-nums text-foreground">{shown()?.seats ?? total()}</Text>
        </View>
      </Plot>
      {/* The legend: a key in each slice's color, the value and the share at the end. */}
      <View class="flex-1 gap-1">
        {props.plans.map((plan, i) => (
          <View class="flex-row items-center gap-3 rounded-md px-2 py-1.5" style={{ opacity: hovered() == null || hovered() === i ? 1 : 0.45 }}>
            <View class={`size-2 rounded-sm ${KEYS[i % KEYS.length]}`} />
            <Text class="flex-1 text-sm text-foreground">{plan.name}</Text>
            <Text class="text-right text-sm tabular-nums text-foreground">{plan.seats}</Text>
            <Text class="w-14 text-right text-sm tabular-nums text-muted-foreground">{share(plan.seats)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
```

```rust
use nsh_base::plot::{SliceClass, pie, plot};
use nsh_core::{element::{RowAccessor, Rows}, prelude::*};

fn seats(seats: Vec<f64>) -> impl IntoElement {
    let rows = Rows::from_columns(seats.len(), [("seats".into(), seats)]);
    plot()
        .data(rows)
        .accessibility_label("Seats by plan")
        .w(px(176.0))
        .h(px(176.0))
        .child(
            pie()
                .value(RowAccessor::key("seats"))
                .inner_radius(relative(0.62))
                .slice_class(SliceClass::from_fn(|i| format!("fill-chart-{}", i % 4 + 1).into())),
        )
}
```

| Mark | Prop | Rust | Tipo | Valor por defecto | Descripción |
|---|---|---|---|---|---|
| `Pie` | `value` | `.value(..)` | `keyof T \| (d: T, index: number) => number` | el `y` del plot | Lo que vale cada fila. Una fila que no vale nada, que vale menos, o que no tiene número no tiene porción. |
| `Pie`, `Arc` | `startAngle`, `endAngle` | `.start_angle(..)`, `.end_angle(..)` | `number` (radianes) | `0`, `2 * Math.PI` | Dónde empieza la primera porción y dónde termina la última (los extremos de un arc): radianes desde las 12 en punto, en sentido horario. Un `endAngle` menor que `startAngle` dispone las porciones de un pie en sentido contrario. |
| `Pie` | `padAngle` | `.pad_angle(..)` | `number` (radianes) | `0` | El ángulo entre porciones vecinas en el borde exterior. Cada hueco mantiene esa anchura (unos `padAngle * outerRadius` puntos) en cualquier radio, con sus lados paralelos, de modo que es tan ancho en el centro o en el hueco como en el borde exterior; una porción demasiado estrecha para llegar al centro termina donde se encuentran sus lados. Un pie de una sola porción no tiene ninguno. |
| `Pie`, `Arc` | `innerRadius`, `outerRadius` | `.inner_radius(..)`, `.outer_radius(..)` | ``number \| `${number}%` `` | `0`, `"100%"` | Los radios del hueco y del borde exterior: en puntos, o como porcentaje del círculo más grande que cabe en el plot (la mitad de su lado menor). |
| `Pie`, `Arc` | `cornerRadius` | `.corner_radius(..)` | `number` | `0` | El radio de las esquinas de cada porción (las de un arc), en puntos, como el `arc.cornerRadius` de d3: cada esquina es un círculo que toca el lado y el borde exterior o el hueco, incluidos los lados paralelos de los huecos. Es como máximo la mitad del grosor del anillo, lo que da a un arc extremos redondeados, y en una porción demasiado estrecha para dos esquinas completas estas se encuentran en su mitad. Un anillo completo solo mantiene redondeados sus bordes. |
| `Pie` | `sliceClass` | `.slice_class(..)` | `string \| (d: T, index: number) => string` | ninguno | Las clases de cada porción (`fill-*`, `stroke-*`): las mismas en todas, o una función de la fila de la porción y de su índice, llamada una vez por fila cuando cambian las filas o la función. |
| `Pie` | `sliceStyle` | `.slice_style(..)` | `StyleProp<ViewStyle>` | ninguno | El estilo de cada porción, sobre sus clases (`fill`, `stroke`, `strokeWidth`). |
| `Pie` | `hoverLift` | `.hover_lift(..)` | `number` | `0` | Cuánto crece la porción bajo el puntero respecto a las demás, en puntos: en el spring `pointer` del plot, con fundido de entrada y de salida según el hover. |
| `Pie` | `hoverDim` | `.hover_dim(..)` | `number` (0 a 1) | `0` | Cuánto se atenúan las demás porciones mientras una está bajo el puntero, como proporción de su opacidad, con el fundido del hover. |
| `Pie` | `color` | `.color(..)` | `keyof T \| (d: T, index: number) => string` | ninguno | La categoría de cada porción, cuyo color sale del `colorScale` del plot: el `fill` de la porción donde nada lo establece ([Colores por categoría](#colors-by-category)). |
| `Pie` | `label` | `.label(..)` | `string \| (d: T, index: number) => string` | ninguno | El texto junto a cada porción: un campo (su número) o una función que devuelve el texto que formatea la app. Una fila cuyo texto está vacío, o una porción más estrecha que medio grado, no tiene ninguno. |
| `Pie` | `labelClass`, `labelStyle` | `.label_class(..)`, `.label_style(..)` | `string`, `StyleProp<TextStyle>` | ninguno | La parte `label`: un texto fuera del anillo, al final de su línea guía, centrado sobre ella, después de ella en la mitad derecha del pie y antes de ella en la izquierda. Su padding es su distancia al final de la línea. |
| `Pie` | `labelGap` | `.label_gap(..)` | `number` | `15` | Cuánto sobresalen las etiquetas del borde exterior, en puntos. |
| `Pie` | `labelLineClass`, `labelLineStyle` | `.label_line_class(..)`, `.label_line_style(..)` | `string \| (d: T, index: number) => string`, `StyleProp<ViewStyle>` | ninguno | La parte `labelLine`: la línea guía de cada etiqueta, desde el borde exterior en el centro de la porción hasta el radio de la etiqueta, y luego hasta el texto. Su `stroke` (`currentColor` donde no se establece ninguno), `strokeWidth` y `strokeDasharray`, iguales en cada línea o una función de la fila de la porción; se muestra una vez que tiene estilo. |

Una porción y un arc se rellenan con `fill` (`currentColor` donde no se establece ninguno, el color de la categoría de la porción con `color`) y trazan sus bordes con `stroke` (ninguno donde no se establece), los propios sobre los del pie y del plot tal como los hereda CSS: un trazo del color de la superficie (`stroke-card stroke-2`) también abre huecos entre las porciones. Sus valores no intervienen en las escalas del plot. Las porciones de un pie se vuelven a dibujar solo cuando cambian las filas, sus valores, los ángulos, los radios o el tamaño del plot; el puntero mueve la elevación y el fundido en el animator.

Los plots con un pie suelen colocar el tooltip junto al puntero (`tooltipPlacement="pointer"`), ya que las filas de un pie no tienen lugar a lo largo de un eje: la línea cruzada y el tooltip siguen al puntero sobre él, y no se muestran puntos de hover. El centro de un donut es un elemento propio de la app colocado sobre el plot (el valor de la porción en hover, o el total), y también lo es su leyenda, con cada clave en el color de su porción.

Las etiquetas de un pie nombran sus porciones fuera del anillo: cada texto se sitúa `labelGap` más allá del borde exterior hacia el centro de su porción (el centroide de la porción en ese radio), luego se desplaza hasta ese radio en el lado del pie de su porción, y una línea guía con estilo lo une al borde exterior. Las etiquetas entran en barrido con sus porciones en el appear del plot y aparecen gradualmente hacia su final, se mueven con ellas en `motion.update` y se elevan con la porción en hover; todo ello se ejecuta en el animator de la plataforma. Deja espacio para ellas en el plot: un `outerRadius` menor que `"100%"`, o espacio alrededor del plot. El contenido propio de la app en una porción es un elemento colocado sobre el plot, como lo es el centro de un donut.

```tsx
<Pie
  value="seats"
  outerRadius="64%"
  sliceClass={(_, i) => FILLS[i % FILLS.length]}
  label={(d) => share(d.seats)}
  labelGap={12}
  labelClass="px-1 text-xs tabular-nums text-muted-foreground"
  labelLineClass="stroke-border"
/>
```

<a id="colors-by-category"></a>

## Colores por categoría

El `colorScale` de un plot da colores a las categorías, como hace el `scaleOrdinal` de d3, y el `color` de un mark nombra la categoría de cada fila: un campo (su texto, o su número) o una función de la fila. Las categorías del `domain` toman los colores del `range` en orden, y el rango vuelve a empezar por su primer color cuando el dominio es más largo. Una categoría fuera del dominio toma `unknown`; sin él, se une al dominio la primera vez que un mark la encuentra (los marks en orden, cada uno con sus filas en orden) y toma el siguiente color, de modo que sin ningún `domain` las categorías toman los colores en el orden en que las traen las filas. Los colores son de la app: colores CSS, entre ellos los tokens del tema.

```tsx
import { Pie, Plot } from "nsh/base/plot";
import { token } from "nsh";

const regions = [
  { name: "North America", revenue: 482 },
  { name: "EMEA", revenue: 312 },
  { name: "APAC", revenue: 268 },
];

<Plot data={regions} colorScale={{ type: "ordinal", range: [token("chart-1"), token("chart-2"), token("chart-3")] }} class="size-44">
  <Pie value="revenue" color="name" innerRadius="62%" />
</Plot>
```

Una porción, una barra y un punto toman el color de su fila; un `Line` y un `Area` son una serie cada uno y toman el de su primera fila, así que una línea de filas propias (`data`) tiene el color de sus filas, y una sola escala mantiene el color de una categoría igual en un pie, en barras y en líneas. El color es el `fill` del mark (el `stroke` de una línea) donde nada lo establece, en lugar de `currentColor`: primero van las clases y los estilos de la app, los de la parte (`sliceClass`, `sliceStyle`), los del mark y los que este hereda del plot, de modo que `sliceClass={(d) => (d.name === "Other" ? "fill-muted" : "")}` fija una porción aparte mientras la escala colorea las demás. Junto a una parte `background`, el `fill` de una barra y de un area sigue siendo `none`.

| `OrdinalScale` | Tipo | Valor por defecto | Descripción |
|---|---|---|---|
| `type` | `"ordinal"` | (obligatorio) | El tipo de escala. |
| `domain` | `string[]` | ninguno | Las categorías, en orden. Una categoría escrita dos veces conserva su primer lugar. |
| `range` | `string[]` | (obligatorio) | Los colores, en orden (colores CSS); la categoría `i` toma el color `i % range.length`. |
| `unknown` | `string` | ninguno | El color de toda categoría fuera del dominio; sin él, cada una toma el siguiente color. |

<a id="colors-along-a-ramp"></a>

### Colores a lo largo de una rampa

Un `colorScale` de `type: "sequential"` o `"diverging"` da a los números sus colores a lo largo de una rampa, como hacen el `scaleSequential` y el `scaleDiverging` de d3, para el `value` de un [`Cell`](#cell). Su `range` son dos o más colores repartidos uniformemente a lo largo de la rampa, de su extremo bajo al alto, y mezclados en OKLab entre ellos: los pasos se ven uniformes a la vista, y dos tonos se encuentran a través de su propia mezcla. Un valor fuera del `domain` toma el extremo de la rampa, y una fila sin valor toma `unknown`.

`sequential` reparte su `domain` por toda la rampa, y el dominio es la extensión de los valores de las celdas salvo que la app indique uno: recuentos, volúmenes, actividad. `diverging` sitúa su `pivot` (0 por defecto) en el color central de la rampa, con los valores por debajo a lo largo de la primera mitad y los de por encima a lo largo de la segunda: pérdidas en un tono, ganancias en otro, un mes plano en el neutro del medio. Salvo que la app indique un dominio, este es la extensión de los valores igualada a ambos lados del pivote (el `symmetric` de Observable Plot), de modo que una pérdida y una ganancia del mismo tamaño son igual de intensas; una matriz de correlación indica `domain: [-1, 1]`.

```tsx
colorScale={{ type: "sequential", range: [token("muted"), token("chart-1")] }}
colorScale={{ type: "diverging", pivot: 0, range: [token("destructive"), token("muted"), token("chart-1")] }}
```

| `SequentialScale`, `DivergingScale` | Tipo | Valor por defecto | Descripción |
|---|---|---|---|
| `type` | `"sequential" \| "diverging"` | (obligatorio) | El tipo de rampa. |
| `domain` | `[number, number]` | la extensión de los valores (igualada respecto al pivote para `diverging`) | Los valores de los dos extremos de la rampa. |
| `pivot` | `number` | `0` | `diverging` solo: el valor del color central de la rampa. |
| `range` | `string[]` | (obligatorio) | Los colores a lo largo de la rampa, del extremo bajo al alto (colores CSS), mezclados en OKLab entre ellos. |
| `unknown` | `string` | ninguno | El color de una fila sin valor; sin él, esa fila no tiene celda. |
<a id="radialline-and-radialgrid"></a>

## RadialLine y RadialGrid

Un `RadialLine` dibuja una serie alrededor del centro del plot: el polígono de un radar, o una línea alrededor de un dial. Cada fila con un valor es un punto en el ángulo de la fila, tan lejos como la escala y del plot sitúe su valor, desde `innerRadius` (el valor más pequeño del dominio) hasta `outerRadius` (el mayor). Sin un `angle`, las filas se reparten uniformemente a lo largo de la vuelta desde las 12 en punto, en el sentido de las agujas del reloj y en orden, de modo que seis filas forman un hexágono; `closed` une el último punto con el primero. Una línea traza sus puntos y rellena su área hasta `innerRadius` (el centro por defecto), de modo que una sola marca es el contorno de un radar y su relleno suave. Un `RadialGrid` dibuja detrás la cuadrícula del radar: `rings` en valores de la escala y, polígonos que pasan por los ángulos de las filas o `circular`, y `spokes` hacia cada fila. Sobre una línea radial, el plot informa de la fila cuyo ángulo es el más cercano al del puntero dentro del radio exterior de la línea, y el punto de hover de cada línea se sitúa en su punto de esa fila.

```tsx
import { signal, Text, View } from "nsh";
import { Plot, RadialGrid, RadialLine } from "nsh/base/plot";

type Metric = { name: string; ours: number; theirs: number };

export function Compare(props: { metrics: Metric[] }) {
  const hovered = signal<number | null>(null);
  const shown = () => (hovered() == null ? undefined : props.metrics[hovered()!]);
  return (
    <View class="items-center gap-3 rounded-xl border border-border bg-card p-4">
      <Text class="text-sm tabular-nums text-muted-foreground">
        {shown() ? `${shown()!.name}: ${shown()!.ours} against ${shown()!.theirs}` : "Ours against theirs"}
      </Text>
      <Plot
        data={props.metrics}
        yScale={{ type: "linear", domain: [0, 100] }}
        accessibilityLabel="Ours against theirs on six metrics"
        accessibilityValue={{ text: shown() && `${shown()!.name}: ours ${shown()!.ours}, theirs ${shown()!.theirs}` }}
        appearGeneration={1}
        motion={{ appear: { duration: 700, easing: "easeOut" }, update: { duration: 400, easing: "easeInOut" }, enter: { duration: 120 }, exit: { duration: 160 }, pointer: { stiffness: 380, damping: 34 } }}
        onHoverChange={({ index }) => hovered.set(index)}
        class="size-56"
      >
        <RadialGrid rings={[25, 50, 75, 100]} spokes outerRadius="80%" class="stroke-border" />
        <RadialLine radius="theirs" closed outerRadius="80%" class="fill-chart-2/15 stroke-chart-2" hoverDotClass="size-2 rounded-full border-2 border-card bg-chart-2" />
        <RadialLine radius="ours" closed outerRadius="80%" class="fill-chart-1/25 stroke-chart-1 stroke-2" hoverDotClass="size-2.5 rounded-full border-2 border-card bg-chart-1" />
        {/* Each metric's name past the rim at its row's angle, growing away from the center. */}
        {props.metrics.map((m, i) => {
          const angle = (2 * Math.PI * i) / props.metrics.length;
          const away = (v: number) => (v > 0.01 ? "flex-start" : v < -0.01 ? "flex-end" : "center");
          const align = (v: number) => (v > 0.01 ? "left" : v < -0.01 ? "right" : "center");
          return (
            <View
              class="absolute size-0"
              style={{
                left: `${50 + 44 * Math.sin(angle)}%`,
                top: `${50 - 44 * Math.cos(angle)}%`,
                alignItems: away(Math.sin(angle)),
                justifyContent: away(-Math.cos(angle)),
                pointerEvents: "none",
              }}
            >
              <Text class="w-24 text-xs text-muted-foreground" style={{ textAlign: align(Math.sin(angle)) }}>{m.name}</Text>
            </View>
          );
        })}
      </Plot>
    </View>
  );
}
```

| Marca | Prop | Rust | Tipo | Predeterminado | Descripción |
|---|---|---|---|---|---|
| `RadialLine` | `radius` | `.radius(..)` | `keyof T \| (d: T, index: number) => number` | `y` del plot | Qué sitúa cada fila a distancia del centro: un valor de la escala y, desde `innerRadius` en el valor más pequeño del dominio hasta `outerRadius` en el mayor. Una fila sin él se omite. |
| `RadialLine` | `angle` | `.angle(..)` | `keyof T \| (d: T, index: number) => number` | las filas repartidas uniformemente por la vuelta | Dónde va cada fila alrededor del centro: radianes desde las 12 en punto, en el sentido de las agujas del reloj. |
| `RadialLine`, `RadialGrid` | `startAngle`, `endAngle` | `.start_angle(..)`, `.end_angle(..)` | `number` (radianes) | `0`, `2 * Math.PI` | Dónde van las filas sin `angle`: desde `startAngle`, de forma uniforme. Alrededor de una vuelta completa quedan separadas por un paso de la `1 / rows` de una vuelta, el último un paso antes del primero; sobre una parte de la vuelta, el primero está en `startAngle` y el último en `endAngle`. |
| `RadialLine`, `RadialGrid` | `innerRadius`, `outerRadius` | `.inner_radius(..)`, `.outer_radius(..)` | ``number \| `${number}%` `` | `0`, `"100%"` | Dónde van el valor más pequeño y el mayor del dominio y: puntos, o un porcentaje del círculo más grande que cabe en el plot (la mitad de su lado menor), como los radios de un pie. El área de una línea se rellena hasta `innerRadius`; los radios de una cuadrícula van entre ambos. |
| `RadialLine` | `curve` | `.curve(..)` | `"linear" \| "natural" \| "stepAfter"` | `"linear"` | Cómo conecta sus puntos: segmentos rectos, una curva suave (si está cerrada, un bucle suave) o escalones. |
| `RadialLine` | `closed` | `.closed(..)` | `boolean` | `false` | Continúa desde su último punto de vuelta hasta el primero: el polígono de un radar. Abierta, su área se cierra hacia el centro (o a lo largo de su borde interior). |
| `RadialLine` | `dot`, `dotClass`, `dotStyle` | `.dot(..)`, `.dot_class(..)`, `.dot_style(..)` | `boolean`, `string`, `StyleProp<ViewStyle>` | `false` | Un punto en cada punto de la línea: una vista centrada en él, cuyo tamaño, fondo y borde los define la app. Los puntos crecen hacia fuera y se mueven con la línea. |
| `RadialLine` | `backgroundClass`, `backgroundStyle` | `.background_class(..)`, `.background_style(..)` | `string`, `StyleProp<ViewStyle>` | ninguno | Su fondo: una caja alrededor de su círculo exterior cuyo fondo (`bg-*`, un degradado) solo se muestra dentro de su área, bajo su `fill`, como el de un área. |
| `RadialLine` | `hoverDotClass`, `hoverDotStyle` | `.hover_dot_class(..)`, `.hover_dot_style(..)` | `string`, `StyleProp<ViewStyle>` | `dotClass`, `dotStyle` del plot | Su punto de hover, en su punto de la fila bajo el puntero, con el puntero en el mismo marco y deslizándose a la siguiente fila con el resorte `pointer` del plot cuando las teclas avanzan; `hidden` no muestra ninguno. |
| `RadialGrid` | `rings` | `.rings(..)` | `number[]` | ninguno | Dónde van sus anillos, como valores de la escala y: cada uno tan lejos como una línea radial sitúa ese valor. |
| `RadialGrid` | `spokes` | `.spokes(..)` | `boolean` | `false` | Una línea desde `innerRadius` hasta `outerRadius` en el ángulo de cada fila. |
| `RadialGrid` | `circular` | `.circular(..)` | `boolean` | `false` | Sus anillos son círculos (arcos sobre una parte de la vuelta). Por defecto son polígonos que pasan por los ángulos de las filas, y círculos mientras el plot tenga menos de tres filas. |

Una línea radial traza con `stroke`, `strokeWidth` y `strokeDasharray` (`currentColor`, de 1 de ancho y sólido donde no se define ninguno) y rellena su área con `fill` (ninguno donde no se define ninguno); una cuadrícula radial traza como lo hace una cuadrícula. Su pintura se hereda del plot. Los valores de una línea, junto con 0, forman el dominio de la escala y cuando el plot no tiene uno, de modo que un radar de valores positivos crece desde su centro; los anillos de una cuadrícula no. Da al plot un `domain` en y para mantener fijos los anillos y la escala del radar mientras cambian los valores.

Las etiquetas alrededor de un radar son elementos de la app superpuestos al plot, igual que el centro de un donut. Sin un `angle`, la fila `i` de `n` se sitúa a `a = 2π·i / n` desde las 12 en punto, así que en un plot cuadrado una caja sin tamaño en `left: 50% + r·sin(a)`, `top: 50% − r·cos(a)` (`r` un porcentaje del lado del plot algo mayor que la mitad de la proporción del radio exterior) marca el lugar más allá del borde, y el nombre crece desde ahí alejándose del centro: a su derecha en la mitad derecha, a su izquierda en la mitad izquierda, encima en la parte superior y debajo en la inferior, como arriba.

```rust
use nsh_base::plot::{plot, radial_grid, radial_line};
use nsh_core::{element::{RowAccessor, Rows}, prelude::*};

fn compare(ours: Vec<f64>, theirs: Vec<f64>) -> impl IntoElement {
    let rows = Rows::from_columns(ours.len(), [("ours".into(), ours), ("theirs".into(), theirs)]);
    plot()
        .data(rows)
        .accessibility_label("Ours against theirs")
        .w(px(224.0))
        .h(px(224.0))
        .child(radial_grid().rings(vec![25.0, 50.0, 75.0, 100.0]).spokes(true))
        .child(radial_line().radius(RowAccessor::key("theirs")).closed(true))
        .child(radial_line().radius(RowAccessor::key("ours")).closed(true))
}
```

## Sankey

Un `Sankey` dibuja flujos entre las filas del plot: cada fila es un nodo y `links` nombra los flujos entre ellos, `{ source, target, value }` with the indices of two rows in the plot's `data`. Los dispone como lo hace d3-sankey, en el tamaño del plot: los nodos en columnas (`nodeAlign`), cada uno tan alto como lo máximo que entra o sale de él, los nodos de una columna separados por `nodePadding`, relajados hacia sus flujos durante `iterations` pasadas; y una cinta por enlace desde el borde derecho de su origen hasta el borde izquierdo de su destino, tan ancha en cada extremo como su parte del lado de ese nodo, de modo que ambos lados de cada nodo quedan cubiertos incluso donde sus flujos de entrada y de salida difieren. Cada columna se centra en el plot, y una serie de columnas de un solo nodo iguales se escalona un poco para que las cintas entre ellas se curven. `valueScale="sqrt"` dimensiona según la raíz cuadrada de los valores, de modo que un flujo dominante no eclipse a los pequeños.

Cada nodo y cada cinta es un canvas propio, las partes `node` y `link`, así que cada uno se pinta con sus propias clases: `nodeClass` son las mismas clases en cada nodo o una función de la fila del nodo, y `linkClass` las mismas en cada cinta o una función del enlace. La parte `linkBackground` muestra un fondo dentro de cada cinta, una caja desde su origen hasta su destino: una función del enlace da a cada cinta un degradado desde el color de su origen hasta el de su destino. Las cintas se dibujan bajo los nodos, y ambos se dibujan desde el borde de entrada con el appear del plot.

Sobre un sankey, el plot informa del nodo bajo el puntero (`onHoverChange`, la fila del nodo; ninguno sobre una cinta), su tooltip sigue al puntero y los enlaces no unidos a ese nodo se atenúan en `hoverDim`, con el animador de la plataforma y el `motion` del plot. Las teclas recorren los nodos en el orden de las filas, con el tooltip junto al centro de cada nodo. `nodeLabel` nombra cada nodo y `valueLabel` da su valor, el valor sobre el nombre cuando ambos están definidos: a la izquierda de un nodo de la primera columna, a la derecha de uno de la última, centrado encima de uno intermedio, como los coloca el gráfico de `gpui-component`; una etiqueta junto a un nodo permanece entre la parte superior e inferior del plot, y una que sobrepasa el borde del plot se sitúa en el espacio que la app deja a su alrededor (su margen). El padding de la parte `nodeLabel` es la distancia a su nodo y sus clases definen su texto (`max-w-20 truncate` recorta un nombre largo); las etiquetas aparecen con fundido junto con el appear. Cuando la app cambia los flujos, cada nodo y cada cinta se mueve de su lugar anterior al nuevo con el `motion.update` del plot, y su etiqueta con ellos: un nodo nuevo en los flujos crece desde su centro, un enlace nuevo desde su anchura mínima, y los que desaparecen se van de inmediato; un cambio mientras se mueven continúa desde donde están dibujados. Los enlaces se distinguen por su origen y destino, así que reordenar `links` no mueve nada.

```tsx
import { signal } from "nsh";
import { Plot, Sankey } from "nsh/base/plot";

type Step = { name: string };

const steps: Step[] = [{ name: "Visits" }, { name: "Sign-ups" }, { name: "Bounced" }, { name: "Trials" }, { name: "Paid" }, { name: "Churned" }];
const flows = [
  { source: 0, target: 1, value: 4200 },
  { source: 0, target: 2, value: 5800 },
  { source: 1, target: 3, value: 2600 },
  { source: 3, target: 4, value: 1100 },
  { source: 3, target: 5, value: 1500 },
];
// Each step's color: its node's fill, and its ribbons' gradient ends.
const FILLS = ["fill-chart-1", "fill-chart-2", "fill-muted", "fill-chart-3", "fill-chart-4", "fill-muted"];
const FROM = ["from-chart-1/40", "from-chart-2/40", "from-muted/40", "from-chart-3/40", "from-chart-4/40", "from-muted/40"];
const TO = ["to-chart-1/40", "to-chart-2/40", "to-muted/40", "to-chart-3/40", "to-chart-4/40", "to-muted/40"];

export function Funnel() {
  const hovered = signal<number | null>(null);
  return (
    <Plot
      data={steps}
      accessibilityLabel="Visits to paid: 10,000 visits, 1,100 paid"
      accessibilityValue={{ text: hovered() == null ? undefined : steps[hovered()!].name }}
      onHoverChange={({ index }) => hovered.set(index)}
      appearGeneration={1}
      motion={{ appear: { duration: 900, easing: "easeOut" }, update: { duration: 500 }, enter: { duration: 120 }, exit: { duration: 160 } }}
      class="mx-20 h-64"
    >
      <Sankey
        links={flows}
        nodeWidth={8}
        nodePadding={16}
        nodeCornerRadius={2}
        nodeClass={(_, i) => FILLS[i]}
        linkBackgroundClass={(link) => `bg-linear-to-r ${FROM[link.source]} ${TO[link.target]}`}
        hoverDim={0.7}
        nodeLabel={(d: Step) => d.name}
        valueLabel={(_: Step, value: number) => value.toLocaleString("en-US")}
        nodeLabelClass="px-2 py-1 text-xs text-muted-foreground"
        valueLabelClass="font-medium text-foreground"
      />
    </Plot>
  );
}
```

```rust
use nsh_base::plot::{RowClass, SankeyLinkClass, SankeyLinks, plot, sankey};
use nsh_core::{element::Rows, prelude::*};

fn funnel() -> impl IntoElement {
    plot()
        .data(Rows::from_columns(4, []))
        .accessibility_label("Visits to paid")
        .h(px(256.0))
        .child(
            sankey()
                .links(SankeyLinks::new([(0, 1, 4200.0), (1, 2, 2600.0), (2, 3, 1100.0)]))
                .node_width(px(8.0))
                .node_class(RowClass::from_fn(|i| format!("fill-chart-{}", i + 1).into()))
                .link_class(SankeyLinkClass::from("fill-foreground/10")),
        )
}
```

| Prop | Rust | Tipo | Predeterminado | Descripción |
|---|---|---|---|---|
| `links` | `.links(..)` | `SankeyLink[]` (`{ source: number; target: number; value: number }`) | obligatorio | Los flujos: desde la fila `source` hasta la fila `target` (sus índices en el `data` del plot), siendo `value` su tamaño. Un valor que no es un número o es menor que cero no transporta nada y no dibuja cinta. |
| `nodeWidth` | `.node_width(..)` | `number` | `24` | El ancho de cada nodo, en puntos. |
| `nodePadding` | `.node_padding(..)` | `number` | `8` | El espacio entre los nodos de una columna, en puntos; menor en una columna demasiado llena para él. |
| `nodeAlign` | `.node_align(..)` | `"justify" \| "left" \| "right" \| "center"` | `"justify"` | En qué columna va cada nodo, como en d3-sankey: su profundidad desde la primera columna (`"left"`), tan a la derecha como sus flujos lo permitan (`"right"`), su profundidad con un nodo que solo inicia flujos junto a sus destinos (`"center"`), o su profundidad con los nodos que terminan flujos en la última columna (`"justify"`). |
| `iterations` | `.iterations(..)` | `number` | `6` | Cuántas pasadas relajan los nodos hacia sus flujos. |
| `valueScale` | `.value_scale(..)` | `"linear" \| "sqrt"` | `"linear"` | Alturas y anchos en proporción a los valores, o a sus raíces cuadradas. |
| `minLinkWidth` | `.min_link_width(..)` | `number` | `1` | Lo más fina que se dibuja una cinta, en puntos, para que un flujo pequeño siga siendo visible. |
| `nodeCornerRadius` | `.node_corner_radius(..)` | `number` | `0` | El radio de las esquinas de cada nodo, en puntos. |
| `nodeClass` | `.node_class(..)` | `string \| (d: T, index: number) => string` | ninguno | Las clases de cada nodo (`fill-*`, `stroke-*`): las mismas en cada nodo, o una función de la fila del nodo y su índice, llamada una vez por fila cuando cambian las filas o la función. |
| `nodeStyle` | `.node_style(..)` | `StyleProp<ViewStyle>` | ninguno | El estilo de cada nodo, sobre sus clases. |
| `linkClass` | `.link_class(..)` | `string \| (link: SankeyLink, index: number) => string` | ninguno | Las clases de cada cinta: las mismas en cada cinta, o una función del enlace y su índice en `links`. |
| `linkStyle` | `.link_style(..)` | `StyleProp<ViewStyle>` | ninguno | El estilo de cada cinta, sobre sus clases. |
| `linkBackgroundClass` | `.link_background_class(..)` | `string \| (link: SankeyLink, index: number) => string` | ninguno | Las clases del fondo de cada cinta (`bg-*`, un degradado: `bg-linear-to-r from-… to-…`), mostrado dentro de la cinta sobre una caja desde su origen hasta su destino, bajo su `fill`. Con un fondo, el `fill` de una cinta es `none` donde no se define ninguno. |
| `linkBackgroundStyle` | `.link_background_style(..)` | `StyleProp<ViewStyle>` | ninguno | El estilo del fondo de cada cinta, sobre sus clases. |
| `hoverDim` | `.hover_dim(..)` | `number` (0 a 1) | `0` | Cuánto se atenúan los enlaces no unidos al nodo bajo el puntero, como proporción de su opacidad, con el resorte `pointer` del plot y con el fundido del hover. |
| `nodeLabel` | `.node_label(..)` | `keyof T \| (d: T, index: number) => string` | ninguno | El nombre junto a cada nodo: un campo, o una función de la fila del nodo y su índice. |
| `valueLabel` | `.value_label(..)` | `(d: T, value: number, index: number) => string` | ninguno | El valor junto a cada nodo, sobre su nombre: una función de su fila y de lo máximo que entra o sale de él (en los valores de los enlaces, sea cual sea el `valueScale`). |
| `nodeLabelClass` | `.node_label_class(..)` | `string` | ninguno | Las clases de cada etiqueta, la parte `nodeLabel`: su padding es la distancia a su nodo, y los estilos de su texto se aplican a ambas líneas. |
| `nodeLabelStyle` | `.node_label_style(..)` | `StyleProp<TextStyle>` | ninguno | El estilo de cada etiqueta, sobre sus clases. |
| `valueLabelClass` | `.value_label_class(..)` | `string` | ninguno | Las clases de la línea de valor, la parte `valueLabel`, sobre las de la etiqueta. |
| `valueLabelStyle` | `.value_label_style(..)` | `StyleProp<TextStyle>` | ninguno | El estilo de la línea de valor, sobre sus clases. |

Un nodo y una cinta se rellenan con `fill` (`currentColor` donde no se define ninguno) y se trazan con `stroke` (ninguno donde no se define ninguno), el suyo propio sobre el del sankey y el del plot, tal como CSS los hereda. Un nodo sin nada que pase por él tiene un punto de alto. La disposición se vuelve a calcular solo cuando cambian los enlaces, las opciones o el tamaño del plot, nunca por el puntero ni por el appear; el cambio de tamaño del plot no mueve nada. Los enlaces que forman un ciclo, o que nombran una fila que el plot no tiene, no dibujan nada y registran una advertencia. Sus valores no participan en las escalas del plot.
## Treemap

Un `Treemap` dibuja las filas del plot como una jerarquía de rectángulos anidados: cada fila es un nodo, su `id` y el `parent` que nombra forman el árbol (`stratify` de d3), el área de cada hoja es proporcional a su `value`, y cada grupo es la caja de lo que hay debajo de él, con un valor igual a la suma de los de sus hojas (sea cual sea el que contenga su propia fila). Una fila sin `parent`, o cuyo padre no nombra ninguna fila, es un nodo de nivel superior; sin `id`, el id de una fila es su índice, por lo que `parent` también puede nombrar una fila por su índice. Convertir en filas un árbol con la forma anidada que escribe gpt-vis (`{ name, value, children }`) son pocas líneas de la app; no hay límite de niveles.

Los rectángulos se disponen con el algoritmo squarified, como los hace `treemapSquarify` de d3: los nodos de cada nivel por orden de valor, de mayor a menor desde arriba a la izquierda (`sort="value"`), cerca de la proporción `ratio` (la proporción áurea); `sort="data"` conserva el orden de las filas, de modo que los nodos mantienen su lugar cuando cambian sus valores. `paddingInner` es el espacio entre hermanos, que no se aplica a ningún borde exterior de su padre; `paddingOuter` es el espacio dentro de un grupo alrededor de sus hijos; `paddingTop` es una banda en la parte superior de cada grupo, donde se escribe su `groupLabel`. Cada uno acepta un número para todos los niveles o uno por nivel desde el superior hacia abajo (`[3, 1]`: 3 entre los nodos de nivel superior, 1 por debajo). La banda de un nivel se aplica a todos los hermanos de un padre o a ninguno, y se omite donde uno es demasiado pequeño para ella, de modo que los grupos de un nivel se lean igual.

Una hoja cuyo valor es 0, menor que 0 o no es un número no ocupa área: no se dibuja, no tiene etiqueta y el puntero no la encuentra, y lo mismo ocurre con un grupo cuyas hojas están todas en ese caso.
Las áreas de un treemap son partes de un todo, así que la app muestra con sus propias palabras lo que se deja fuera (una nota bajo el mapa).
Los números negativos son para los colores: el cambio del día en un mapa de mercado.

El color de un nodo es el de su fila en el `colorScale` del plot: `colorValue` es un número a lo largo de una rampa (`sequential`, `diverging`: las pérdidas en rojo, las ganancias en verde, lo neutro en el centro, sobre la extensión de los valores sin `domain`), `color` una categoría (`ordinal`: `"parent"` da el mismo color a las hojas de un grupo). Las hojas son la parte `leaf` (`leafClass`, `leafStyle`) y los grupos la parte `group` (`groupClass`, `groupStyle`), que se dibujan solo con una clase o un estilo: un rectángulo bajo sus hijos, visible en los espacios, su padding y su banda. Cada parte es igual en todos los nodos o una función de la fila del nodo. `cornerRadii` redondea cada rectángulo.

`label` escribe el nombre de cada hoja y `valueLabel` su valor debajo, una función de la fila y de su valor (el de un grupo es la suma de sus hojas): arriba a la izquierda (`labelPlacement="start"`) o en el centro (`"center"`). La parte `label` es una caja tan grande como su hoja: su padding es el espacio desde los bordes de la hoja y su texto da estilo a las líneas. El nombre se corta con puntos suspensivos donde la hoja es más estrecha y solo se muestra donde cabe; el valor se muestra entero o no se muestra. Una etiqueta cuya hoja tiene un color oscuro lleva el atributo `data-dark`, de modo que `data-dark:text-white` la mantiene legible sobre un rojo intenso.

Sobre un treemap, el plot informa del nodo que hay bajo el puntero (`onHoverChange`, la fila del nodo): una hoja, o un grupo en su banda o su padding; al cruzar un espacio entre hermanos, uno de ellos, para que el hover no parpadee. Los demás se atenúan hasta `inactiveOpacity` (una hoja conserva sus grupos, un grupo lo que hay debajo de él), y la parte `hover`, una vista tan grande como el nodo, lo perfila. Las teclas de flecha pasan a la hoja contigua en pantalla, y Inicio y Fin a la primera y la última. Con el appear del plot, los nodos de nivel superior crecen desde su centro, uno tras otro con `stagger`; cuando cambian las filas, cada nodo se mueve a su nueva caja y color con `motion.update`, identificado por su `id`: un nodo nuevo en las filas crece desde su centro y uno que desaparece se encoge hacia el suyo. Las escalas x e y del plot no se usan.

<!-- demo: el-plot-treemap -->

```tsx
import { signal } from "nsh";
import { Plot, Treemap } from "nsh/base/plot";

type Row = { id: string; parent?: string; name: string; cap?: number; chg?: number };

const rows: Row[] = [
  { id: "tech", name: "Technology" },
  { id: "fin", name: "Financials" },
  { id: "NVDA", parent: "tech", name: "NVIDIA", cap: 4300, chg: 2.4 },
  { id: "MSFT", parent: "tech", name: "Microsoft", cap: 3700, chg: -0.6 },
  { id: "AVGO", parent: "tech", name: "Broadcom", cap: 1600, chg: 3.1 },
  { id: "JPM", parent: "fin", name: "JPMorgan", cap: 830, chg: 1.3 },
  { id: "V", parent: "fin", name: "Visa", cap: 670, chg: -0.3 },
];

export function MarketMap() {
  const hovered = signal<number | null>(null);
  return (
    <Plot
      data={rows}
      colorScale={{ type: "diverging", domain: [-3, 3], range: ["#dc2626", "#e5e5e5", "#16a34a"] }}
      accessibilityLabel="Market map of 5 stocks in 2 sectors"
      accessibilityValue={{ text: hovered() == null ? undefined : rows[hovered()!].name }}
      onHoverChange={({ index }) => hovered.set(index)}
      appearGeneration={1}
      motion={{ appear: { duration: 800 }, update: { duration: 500 }, enter: { duration: 120 }, exit: { duration: 160 } }}
      class="h-72"
    >
      <Treemap
        id="id"
        parent="parent"
        value="cap"
        colorValue="chg"
        paddingInner={[3, 1]}
        paddingTop={18}
        cornerRadii={2}
        inactiveOpacity={0.35}
        label="id"
        valueLabel={(d: Row) => `${d.chg! > 0 ? "+" : ""}${d.chg}%`}
        labelPlacement="center"
        labelClass="p-1 text-xs font-semibold text-foreground data-dark:text-white"
        groupLabel="name"
        groupLabelClass="px-1 text-xs text-muted-foreground"
        hoverClass="rounded-xs outline-2 outline-foreground"
      />
    </Plot>
  );
}
```

```rust
use nsh_base::plot::{ColorScale, DivergingScale, TreemapPadding, plot, treemap};
use nsh_core::{element::{RowAccessor, RowText, Rows}, prelude::*};

const IDS: [&str; 5] = ["tech", "fin", "NVDA", "MSFT", "JPM"];
const PARENTS: [&str; 5] = ["", "", "tech", "tech", "fin"];

fn market_map() -> impl IntoElement {
    let rows = Rows::from_columns(
        5,
        [
            ("cap".into(), vec![0.0, 0.0, 4300.0, 3700.0, 830.0]),
            ("chg".into(), vec![0.0, 0.0, 2.4, -0.6, 1.3]),
        ],
    );
    plot()
        .data(rows)
        .color_scale(ColorScale::from(
            DivergingScale::new([rgb(0xdc2626), rgb(0xe5e5e5), rgb(0x16a34a)]).domain([-3.0, 3.0]),
        ))
        .accessibility_label("Market map")
        .h(px(288.0))
        .child(
            treemap()
                .id(RowText::from_fn(|i| IDS[i].into()))
                .parent(RowText::from_fn(|i| PARENTS[i].into()))
                .value(RowAccessor::key("cap"))
                .color_value(RowAccessor::key("chg"))
                .padding_inner(TreemapPadding::from([px(3.0), px(1.0)]))
                .padding_top(TreemapPadding::from(px(18.0)))
                .label(RowText::from_fn(|i| IDS[i].into())),
        )
}
```

| Prop | Rust | Tipo | Valor por defecto | Descripción |
|---|---|---|---|---|
| `id` | `.id(..)` | `keyof T \| (d: T, index: number) => string` | el índice de la fila | El id del nodo de cada fila: lo que nombra `parent` y por lo que se identifica un nodo cuando cambian las filas. |
| `parent` | `.parent(..)` | `keyof T \| (d: T, index: number) => string` | ninguno: cada fila es un nodo de nivel superior | El id del padre de cada fila; vacío, o el id de ninguna fila, para un nodo de nivel superior. |
| `value` | `.value(..)` | `keyof T \| (d: T, index: number) => number` | obligatorio | El tamaño de cada hoja; el de un grupo es la suma de los de sus hijos. Una hoja de 0, menor que 0 o que no sea un número no ocupa área. |
| `sort` | `.sort(..)` | `"value" \| "data"` | `"value"` | Hermanos de mayor a menor desde arriba a la izquierda, o en el orden de las filas. |
| `ratio` | `.ratio(..)` | `number` | la proporción áurea | La proporción a la que se acercan los rectángulos, como mínimo 1. |
| `paddingInner` | `.padding_inner(..)` | `number \| number[]` | `0` | El espacio entre hermanos, en puntos, por nivel desde el superior hacia abajo (el último para los inferiores). |
| `paddingOuter` | `.padding_outer(..)` | `number \| number[]` | `0` | El espacio dentro de cada grupo alrededor de sus hijos, por nivel. |
| `paddingTop` | `.padding_top(..)` | `number \| number[]` | `0` | La banda en la parte superior de cada grupo, para su `groupLabel`, por nivel; en todos los hermanos de un padre o en ninguno. |
| `cornerRadii` | `.corner_radii(..)` | `number \| { topLeft?, topRight?, bottomRight?, bottomLeft? }` | cuadrado | El radio de cada esquina de sus rectángulos. |
| `color` | `.color(..)` | `keyof T \| (d: T, index: number) => string` | ninguno | La categoría de cada nodo, a la que un `ordinal` `colorScale` da un color. |
| `colorValue` | `.color_value(..)` | `keyof T \| (d: T, index: number) => number` | ninguno | El número de cada nodo, que un `sequential` o `diverging` `colorScale` convierte en su color. |
| `leafClass` | `.leaf_class(..)` | `string \| (d: T, index: number) => string` | ninguno | Las clases de cada hoja (`fill-*`, `stroke-*`), iguales en todas las hojas o una función de su fila. |
| `leafStyle` | `.leaf_style(..)` | `StyleProp<ViewStyle>` | ninguno | El estilo de cada hoja, por encima de sus clases. |
| `groupClass` | `.group_class(..)` | `string \| (d: T, index: number) => string` | ninguno | Las clases de cada grupo, un rectángulo bajo sus hijos; los grupos solo se dibujan con una clase o un estilo. |
| `groupStyle` | `.group_style(..)` | `StyleProp<ViewStyle>` | ninguno | El estilo de cada grupo, por encima de sus clases. |
| `inactiveOpacity` | `.inactive_opacity(..)` | `number` (0 a 1) | ninguno | La opacidad de los nodos alejados del que tiene el hover, y de sus etiquetas, con el fundido del hover. |
| `label` | `.label(..)` | `keyof T \| (d: T, index: number) => string` | ninguno | El nombre en cada hoja, en una línea, cortado con puntos suspensivos. |
| `valueLabel` | `.value_label(..)` | `(d: T, value: number, index: number) => string` | ninguno | El valor en cada hoja, debajo de su nombre, mostrado solo donde cabe entero. |
| `labelPlacement` | `.label_placement(..)` | `"start" \| "center"` | `"start"` | Las etiquetas arriba a la izquierda de sus hojas, o en su centro. |
| `labelClass` | `.label_class(..)` | `string` | ninguno | Las clases de la etiqueta de cada hoja, una caja tan grande como la hoja: su padding y los estilos de texto; `data-dark:` en las hojas oscuras. |
| `labelStyle` | `.label_style(..)` | `StyleProp<TextStyle>` | ninguno | El estilo de la etiqueta de cada hoja, por encima de sus clases. |
| `valueLabelClass` | `.value_label_class(..)` | `string` | ninguno | Las clases de la línea del valor, por encima de las de la etiqueta. |
| `valueLabelStyle` | `.value_label_style(..)` | `StyleProp<TextStyle>` | ninguno | El estilo de la línea del valor, por encima de sus clases. |
| `groupLabel` | `.group_label(..)` | `keyof T \| (d: T, index: number) => string` | ninguno | El nombre de cada grupo, en su banda, cortado con puntos suspensivos. |
| `groupLabelClass` | `.group_label_class(..)` | `string` | ninguno | Las clases de la etiqueta de cada grupo, una caja tan grande como la banda. |
| `groupLabelStyle` | `.group_label_style(..)` | `StyleProp<TextStyle>` | ninguno | El estilo de la etiqueta de cada grupo, por encima de sus clases. |
| `stagger` | `.stagger(..)` | `number` (0 a 0.95) | `0` | Cómo aparecen uno tras otro los nodos de nivel superior: la parte del appear durante la cual empiezan. |
| `hoverClass` | `.hover_class(..)` | `string` | ninguno | Las clases de la parte `hover`, una vista tan grande como el nodo con el hover sobre ella (`rounded-xs outline-2 outline-foreground`). |
| `hoverStyle` | `.hover_style(..)` | `StyleProp<ViewStyle>` | ninguno | El estilo de la parte del hover, por encima de sus clases. |

Un rectángulo se rellena con `fill` (el color del `colorScale`, si no `currentColor`, donde no hay ninguno definido) y se traza con `stroke` (sin trazo donde no hay ninguno definido), el suyo propio por encima del del treemap y del plot, tal como los hereda CSS. El layout se ejecuta de nuevo solo cuando cambian las filas, las opciones o el tamaño del plot, nunca por el puntero ni por el appear; el cambio de tamaño del plot no mueve nada. Un `id` repetido, un `parent` que no nombra ninguna fila y una fila que es su propio ancestro registran una advertencia una sola vez: la primera fila conserva el id, el huérfano es un nodo de nivel superior y el ciclo no se dibuja.

## PlotAxis

Un `PlotAxis` etiqueta un borde del plot con las marcas de la escala que lleva ese borde: los bordes inferior y superior las de la escala x, los bordes izquierdo y derecho las de la escala y, como `axisBottom`, `axisTop`, `axisLeft` y `axisRight` de d3. Sus marcas provienen de la escala: valores redondos en una escala `linear` (1, 2 o 5 por una potencia de diez, dentro del dominio), filas en una escala `point` o `band`. Sus etiquetas son textos que coloca el layout del plot, así que la app indica qué dicen y cómo se ven, y el layout las coloca: cada etiqueta se centra en su marca a lo largo del borde. A lo largo de los bordes inferior y superior, la primera y la última se desplazan hacia dentro solo lo necesario para quedar dentro de los extremos del plot; junto a los bordes izquierdo y derecho, cada etiqueta permanece en su marca, de modo que se lee como la de su línea de la cuadrícula, y donde una etiqueta cercana a un extremo sobrepasaría el borde superior o inferior del plot, las escalas y lineales del plot empiezan esa distancia más adentro (la mitad de la altura de la etiqueta para una marca en el extremo), de modo que cada etiqueta queda dentro del plot, sobre su línea de la cuadrícula.

```tsx
import { Area, Grid, Line, Plot, PlotAxis } from "nsh/base/plot";

const rows = [
  { day: "Mon", visitors: 1820 },
  { day: "Tue", visitors: 2140 },
  { day: "Wed", visitors: 1960 },
  { day: "Thu", visitors: 2480 },
  { day: "Fri", visitors: 2310 },
];

<Plot data={rows} y="visitors" yScale={{ type: "linear", domain: [0, 3000] }} class="mb-6 ml-10 h-40">
  <Grid y={[0, 1000, 2000, 3000]} class="stroke-border" />
  <Area class="fill-chart-1/20" />
  <Line class="stroke-chart-1 stroke-2" />
  {/* 0, 1,000, 2,000 and 3,000 left of the plot; a day under each row. */}
  <PlotAxis placement="left" ticks={3} labelClass="pr-2 text-xs tabular-nums text-muted-foreground" />
  <PlotAxis
    format={(i) => rows[i].day}
    labelClass="pt-2 text-xs text-muted-foreground"
    tickClass="h-1 w-px bg-border"
    lineClass="h-px bg-border"
  />
</Plot>
```

| Prop | Rust | Tipo | Valor por defecto | Descripción |
|---|---|---|---|---|
| `placement` | `.placement(..)` | `"bottom" \| "top" \| "left" \| "right"` | `"bottom"` | El borde a lo largo del cual se extiende: los bordes inferior y superior llevan las marcas de la escala x, los bordes izquierdo y derecho las de la escala y. |
| `scale` | `.scale(..)` | `"y" \| "y2"` | `"y"` | La escala y que etiqueta un eje izquierdo o derecho: la `yScale` del plot o la segunda, `y2Scale` ([Ejes duales](#dual-axes)). |
| `labelPlacement` | `.label_placement(..)` | `"outside" \| "inside"` | `"outside"` | Dónde se colocan sus etiquetas: más allá del borde, en el espacio que la app deja alrededor del plot, donde quedan lejos de las marcas; o sobre el plot a lo largo del borde, de modo que el plot conserva todo su tamaño (junto a un borde izquierdo o derecho, cada etiqueta se coloca en el lado superior de su línea de la cuadrícula). |
| `ticks` | `.ticks(..)` | `number` | `10` en una escala `linear` (cada paso de las escalas alineadas), todas las filas en las demás | Aproximadamente cuántas marcas toma: en una escala `linear`, valores redondos dentro del dominio, más o menos esta cantidad; en una escala `point` o `band`, esta cantidad de filas repartidas uniformemente de la primera a la última. |
| `tickValues` | `.tick_values(..)` | `number[]` | ninguno | Los valores de sus marcas, en lugar de `ticks`: valores de la escala, índices de fila en una escala `point` o `band` (`[0, 3, 6]` etiqueta una de cada tres filas). Cada valor dentro del dominio recibe una marca. |
| `format` | `.format(..)` | `(value: number, index: number) => string` | la categoría de una banda en una escala de bandas de categorías, si no el valor, con los decimales que necesita el paso entre marcas, con los miles agrupados | El texto de cada marca: la función de la app de su valor (el índice de una fila en una escala `point` o `band`) y de su índice entre las marcas del eje. |
| `labelClass`, `labelStyle` | `.label_class(..)`, `.label_style(..)` | `string`, `StyleProp<TextStyle>` | ninguno | La parte `label`: un texto por marca, con su fuente, color y padding definidos por la app; su padding hacia el plot es su distancia al borde (`pt-2` bajo un eje inferior). |
| `tickClass`, `tickStyle` | `.tick_class(..)`, `.tick_style(..)` | `string`, `StyleProp<ViewStyle>` | ninguno | La parte `tick`: una vista por marca en el borde, centrada en su marca y que se extiende hacia las etiquetas (`h-1 w-px bg-border` bajo un eje inferior); se muestra una vez que tiene estilo. |
| `lineClass`, `lineStyle` | `.line_class(..)`, `.line_style(..)` | `string`, `StyleProp<ViewStyle>` | ninguno | La parte `line`: una vista a lo largo de todo el borde, en el lado de las etiquetas (`h-px bg-border` bajo un eje inferior); se muestra una vez que tiene estilo. |

En el exterior, las etiquetas se sitúan en el margen del plot, como los ejes de d3 se sitúan en los márgenes de un gráfico: el plot conserva el tamaño que le da la app, y la app le da un margen en el lado del eje tan profundo como las etiquetas (`mb-6` para etiquetas `pt-2 text-xs` bajo él), o su padding de padre en ese lado. Dos ejes en un mismo borde etiquetan cada uno sus propios valores, con su propio estilo: los extremos de un rango tenues y su centro más marcado.

`format` se llama una vez por marca cuando cambian las marcas o la función, en el siguiente turno, nunca mientras el plot se dibuja o sigue al puntero: mantenla pura (el mismo valor, el mismo texto). Sin ella, una marca se lee como la escribe d3: `1,500`, `0.25`, `−2`. En Rust, `plot_axis()` crea un eje, y su `format` es un `TickFormat::from_fn(|value, index| ..)`.
Un eje no recibe puntero, y los lectores de pantalla leen el plot en lugar de sus etiquetas.
## PlotLabel

Un `PlotLabel` escribe textos en puntos del plot: un título sobre un pico, una etiqueta en el último punto de una línea, una nota en el extremo de una línea de la cuadrícula. Cada uno de sus `texts` nombra su punto con valores de las escalas del plot, como hacen las marcas: el índice de una fila en una escala `point` o `band` (el centro de la banda de la fila), un valor en una escala `linear`. El borde superior del texto se sitúa en el punto, y su `align` hace que empiece ahí, se centre en él o termine ahí. El layout del plot coloca los textos, así que siguen el tamaño del plot; se deslizan con los dominios de las escalas (`motion.update`) y aparecen con un fundido junto con el appear.

```tsx
import { Area, Line, Plot, PlotLabel } from "nsh/base/plot";

const rows = [
  { day: "Mon", visitors: 1820 },
  { day: "Tue", visitors: 2140 },
  { day: "Wed", visitors: 1960 },
  { day: "Thu", visitors: 2480 },
  { day: "Fri", visitors: 2310 },
];
const [peak, last] = [3, rows.length - 1];

<Plot data={rows} y="visitors" yScale={{ type: "linear", domain: [0, 3000] }} class="mr-12 h-40">
  <Area class="fill-chart-1/20" />
  <Line class="stroke-chart-1 stroke-2" />
  {/* The peak's value over it, and a tag right of the last point, its middle at the point's height. */}
  <PlotLabel
    class="text-xs tabular-nums text-muted-foreground"
    texts={[
      { text: `High ${rows[peak].visitors}`, x: peak, y: rows[peak].visitors, align: "center", class: "-translate-y-full pb-1" },
      { text: `${rows[last].visitors}`, x: last, y: rows[last].visitors, class: "-translate-y-1/2 ml-2 rounded bg-chart-1 px-1.5 text-white" },
    ]}
  />
</Plot>
```

| Prop | Rust | Tipo | Predeterminado | Descripción |
|---|---|---|---|---|
| `texts` | `.texts(..)` | `PlotText[]` | `[]` | Los textos que escribe, cada uno en su propio punto. |
| `scale` | `.scale(..)` | `"y" \| "y2"` | `"y"` | La escala y de cuyos valores son los `y` de sus textos ([Ejes duales](#dual-axes)). |

Cada texto es un `PlotText`:

| Campo | Tipo | Predeterminado | Descripción |
|---|---|---|---|
| `text` | `string` | | Lo que lee. |
| `x` | `number` | | Dónde va a lo largo del eje x: un valor de la escala x, o el índice de una fila en una escala `point` o `band` (`0.5` está a medio camino entre las dos primeras filas). |
| `y` | `number` | | Dónde va su borde superior a lo largo del eje y: un valor de la escala y. |
| `align` | `"left" \| "center" \| "right"` | `"left"` | Cómo se sitúa a lo largo de x respecto a su punto: empezando en él, centrado en él o terminando en él. |
| `class`, `style` | `string`, `StyleProp<TextStyle>` | ninguno | Las clases y el estilo propios del texto, sobre lo que hereda del label: su caja (el fondo y el padding de una etiqueta) y su distancia al punto. |

El aspecto es el de la app: el `class` del label da a cada texto los estilos de texto que heredan (fuente, tamaño, color), y los `class` y `style` propios de un texto lo estilan a él solo. Un texto va encima de su punto con `-translate-y-full`, y su padding es su separación del punto (`pb-1`); una etiqueta junto al último punto de una línea se sitúa en el margen que la app deja en ese lado (`mr-12`), igual que las etiquetas de un eje. En Rust, `plot_label()` crea un label, y cada texto es un `PlotText::new(text, x, y)` con `.align(PlotTextAlign::Center)`, `.class(..)` y `.style(..)`. El puntero atraviesa los textos hasta el plot, y los lectores de pantalla leen el plot, cuyo `accessibilityLabel` dice lo que señalan los textos.

<a id="motion"></a>

## Movimiento

El movimiento es el de la app, y por defecto no hay ninguno: todo se muestra de inmediato. `motion` acepta las temporizaciones de [`nsh`](../modules/nsh.md#animation) (`{ duration, easing, delay }` y `{ stiffness, damping, mass }`):

| Clave | Tipo | Qué se mueve |
|---|---|---|
| `appear` | temporización | Las marcas se dibujan, con un `appearGeneration`: líneas y áreas desde el borde de entrada, barras que crecen desde su base (una tras otra con el `stagger` de una barra); puntos que crecen desde la nada (uno tras otro con el `stagger` de un punto); celdas que crecen desde su centro (una tras otra con el `stagger` de una celda); el anillo de un pie y de un arc se barre en sentido horario desde su inicio; una línea radial crece desde su radio interior, y sus puntos con ella; los nodos y las cintas de un sankey desde el borde de entrada, con sus labels apareciendo con un fundido. |
| `update` | temporización | Las marcas se mueven a la nueva forma cuando la app la cambia: los puntos a sus nuevos valores y tamaños, el punto de una fila nueva crece y el de una fila que desaparece se encoge; las celdas a sus nuevos colores (mezclados en OKLab) y bandas, la celda de una fila nueva crece y la de una fila que desaparece se encoge; los radios de un pie y de un arc, de modo que el agujero de un donut se abre y se cierra, y sus ángulos, de modo que un gauge o un sector se barre hasta su nuevo valor (`arcTween` de d3: se mueven los ángulos, no el contorno; un sector nuevo se abre desde donde termina el anterior; un cambio mientras otro está en curso continúa desde donde está dibujado); los puntos de una línea radial a sus nuevos valores, ángulos y radios (una fila nueva crece desde el radio interior), y con ellos los anillos de una cuadrícula radial; y el dominio de una escala lineal, el `domain` de la app o la extensión de los valores de las marcas a medida que llegan filas, que se desliza del antiguo al nuevo, y con él las marcas, las líneas de la cuadrícula, los `PlotAxis` y los `PlotLabel`; y los nodos, las cintas y los labels de un sankey, del layout de los flujos antiguos al nuevo, y un cambio mientras se mueven continúa desde donde están dibujados. |
| `enter` | temporización | Las partes del hover aparecen con un fundido cuando el puntero entra en el plot. |
| `exit` | temporización | Desaparecen con un fundido después de que se va. |
| `pointer` | spring | Se deslizan de una fila a la siguiente cuando las teclas o un lector de pantalla mueven el hover; el sector de un pie se eleva con él. |

Las partes del hover siguen al puntero en el mismo fotograma: al moverse, la línea de cruce, los puntos y el tooltip están al instante en la fila que tiene debajo, de modo que siguen a la mano, mientras que su fundido de entrada y de salida (`enter`, `exit`) sigue animándose.

El movimiento se ejecuta en el animador de la plataforma, sin JS por fotograma, y se completa de inmediato para quienes piden movimiento reducido. Un plot que una lista vuelve a crear para una fila que regresa se dibuja de nuevo, a menos que un [`PlotAppearScope`](#plotappearscope) alrededor de la lista haya visto terminar su appear.

Un dominio se mueve como d3 hace la transición del dominio de una escala: la escala intermedia coloca cada valor, así que las marcas conservan sus formas, las líneas de la cuadrícula y las partes del hover se mueven con ellas, las barras conservan sus esquinas, y una fila que entra con el nuevo dominio se mueve con el resto. Un chart en vivo que ajusta su escala y a sus filas de vez en cuando (con algo de margen, para que la cuadrícula se mantenga quieta entre ajustes) se desliza a cada nuevo ajuste con una temporización `update`. Cuando cambia el tamaño del plot, las marcas adoptan el nuevo tamaño de inmediato.

Es el movimiento propio del plot, las temporizaciones de lo que mueve un chart: el recorte de sus marcas y las partes de su hover. Las entradas, salidas y llamadas de atención de una vista son los presets y keyframes de [`createMotion`](../modules/nsh.md#createmotion), que una app puede seguir reproduciendo en la vista del plot o en los elementos que lo rodean.

## PlotAppearScope

Una lista vuelve a crear el plot de una fila cada vez que la fila regresa a la vista, así que un sparkline con un appear se dibuja de nuevo cada vez que la lista vuelve a desplazarse hasta él. Un `PlotAppearScope` alrededor de la lista recuerda los appear que han terminado en ella: un plot vuelto a crear allí cuyo `appearGeneration` terminó muestra sus marcas completas de inmediato. Un plot se recuerda por su generación, así que el plot de cada fila recibe la suya propia, la clave de la fila junto con lo que deba hacer que se reproduzca de nuevo (`` `${symbol} ${period}` ``).

```tsx
import { List } from "nsh";
import { Line, Plot, PlotAppearScope } from "nsh/base/plot";

<PlotAppearScope id={watchlist().id} class="flex-1">
  <List each={watchlist().rows} keyExtractor={(row) => row.symbol} estimatedItemSize={48} class="flex-1">
    {(row) => (
      <Plot
        data={row().closes}
        y="close"
        interactive={false}
        appearGeneration={`${row().symbol} ${period()}`}
        motion={{ appear: { duration: 400, easing: "easeOut" } }}
        class="h-8 w-24"
      >
        <Line class="stroke-chart-1 stroke-[1.5]" />
      </Plot>
    )}
  </List>
</PlotAppearScope>
```

| Prop | Rust | Tipo | Predeterminado | Descripción |
|---|---|---|---|---|
| `id` | `.id(..)` | `number \| string` | ninguno | Para qué recuerda el scope: cuando cambia, el scope olvida y sus plots se dibujan de nuevo, donde están. Dale el nombre del contenido, como una lista de seguimiento o una conversación; sin uno, el scope recuerda mientras se muestre. |
| `children` | `.child(..)` | `JSX.Element` | ninguno | Lo que contiene: la lista, o lo que vuelva a crear sus plots a medida que van y vienen. |

Una generación nueva sigue dibujando el plot, y también lo hace un plot retirado antes de que terminara su appear, desde el principio. Cuando un plot ha terminado una generación nueva, su scope olvida la anterior, así que volver a un periodo anterior dibuja el plot de nuevo. La memoria desaparece con el scope: un scope que ya no se muestra, o uno con un `id` nuevo, dibuja sus plots de nuevo, y un plot recuerda en el scope más interno que lo rodea. Su aspecto es el de la app: `class` y `style` lo disponen como a cualquier vista (`flex-1` alrededor de una lista que llena la pantalla). En Rust, `plot_appear_scope()` crea uno.

<a id="keyboard"></a>

## Teclado

Un plot interactivo es una parada del Tab (macOS, la web), y mientras tiene el foco del teclado sus teclas mueven el mismo hover que el puntero: la línea de cruce, los puntos y el tooltip se deslizan con el spring `pointer`, el sector de un pie se eleva, `onHoverChange` informa de la fila, y los lectores de pantalla leen el `accessibilityValue` que la app da para ella. Su anillo de foco es el de la app: una clase `focus-visible:` o un `focusStyle` (`focus-visible:outline-2 focus-visible:outline-ring`).

| Teclas | Qué hacen |
|---|---|
| Derecha, Izquierda | Se mueven a la fila de ese lado: la fila siguiente o la anterior, al revés en una escala x invertida, cuya primera fila está a la derecha (sobre un pie, sus sectores en el orden de las filas; sobre un sankey, sus nodos; sobre un treemap, la hoja contigua en la pantalla, como hacen Arriba y Abajo); sin ninguna fila en hover, Derecha empieza en la fila del extremo izquierdo e Izquierda en la del extremo derecho (sobre un pie, el primer y el último sector). |
| Inicio, Fin | Se mueven a la primera o a la última fila. |
| Arriba, Abajo | Sobre celdas: se mueven a la celda de arriba o de abajo en la misma columna. Sobre celdas las teclas siguen la cuadrícula en la pantalla (la data grid de WAI-ARIA): Derecha e Izquierda se mueven a la siguiente celda a lo largo de la línea, Inicio y Fin a la primera y a la última celda de la línea; sin ninguna celda en hover, la primera tecla empieza en la celda superior izquierda (Izquierda, Arriba y Fin en la inferior derecha). En un borde el hover se queda. |
| Escape | Borra el hover. |

El plot responde a sus teclas mientras tiene el foco, y a Escape mientras una fila está en hover; el resto del tiempo van a la app y a las vistas que lo rodean. Mover el foco a otro sitio borra un hover creado con las teclas. El plot no recibe pulsaciones, así que un plot dentro de una tarjeta pulsable deja a la tarjeta sus pulsaciones. Los lectores de pantalla también recorren las filas: el deslizamiento hacia arriba y hacia abajo de VoiceOver, el desplazamiento hacia delante y hacia atrás de TalkBack, y todo lector de pantalla que ofrezca las acciones `increment` y `decrement` de un elemento se mueven a la fila siguiente y a la anterior, en el orden de las filas también en una escala invertida.

<a id="building-charts"></a>

## Creación de gráficos

Un chart es un plot, sus marcas, sus ejes y los elementos propios de la app que los rodean. Dale a la escala y un `domain` y a su eje los valores de la cuadrícula (`tickValues`): cada etiqueta queda entonces en su línea de la cuadrícula. La línea de cruce, los puntos y el tooltip del hover son partes del plot, con el estilo y el contenido que les da la app; los valores de la fila van donde la app los muestre.

Las cuadrículas se leen mejor como líneas finas continuas con una línea base más firme, lo que deja libre una línea discontinua para significar un valor de referencia (el precio de apertura más abajo). Un área se lee más ligera como un lavado que se desvanece hacia su línea base que como un relleno plano. El punto de hover de cada serie toma el color de su serie, y el color de la superficie sobre la que está el chart como su anillo, de modo que se recorta de su línea, y el tooltip se sitúa en la parte superior del plot, dentro de sus bordes en la primera y la última fila: un `domain` con espacio por encima del valor más alto lo mantiene fuera de la línea.

```tsx
import { signal, Text, View } from "nsh";
import { Area, Grid, Line, Plot, PlotAxis } from "nsh/base/plot";

type Row = { time: string; price: number };

export function PriceChart(props: { rows: Row[]; low: number; high: number }) {
  const hovered = signal<number | null>(null);
  const shown = () => props.rows[hovered() ?? props.rows.length - 1];
  const middle = () => (props.low + props.high) / 2;
  return (
    <View class="gap-3 rounded-xl border border-border bg-card p-4">
      {/* The value of the row under the pointer, or the last one. */}
      <View class="flex-row items-baseline">
        <Text class="flex-1 text-sm text-muted-foreground">{shown().time}</Text>
        <Text class="text-right text-xl font-semibold tabular-nums text-foreground">{shown().price.toFixed(2)}</Text>
      </View>
      <Plot
        data={props.rows}
        y="price"
        yScale={{ type: "linear", domain: [props.low, props.high] }}
        accessibilityLabel={`Price, from ${props.rows[0].price} to ${props.rows[props.rows.length - 1].price}`}
        accessibilityValue={{ text: `${shown().time}, ${shown().price.toFixed(2)}` }}
        appearGeneration={props.rows.length}
        motion={{ appear: { duration: 600, easing: "easeOut" }, enter: { duration: 120 }, exit: { duration: 160 }, pointer: { stiffness: 300, damping: 30 } }}
        crossLineClass="w-px h-full bg-muted-foreground/50"
        tooltipOffset={4}
        tooltipContent={
          <View class="flex-row items-center gap-1.5 rounded-lg border border-border bg-popover px-2 py-1 shadow-md">
            <View class="h-0.5 w-2.5 rounded-full bg-chart-1" />
            <Text class="text-xs tabular-nums text-popover-foreground">{shown().price.toFixed(2)}</Text>
          </View>
        }
        onHoverChange={({ index }) => hovered.set(index)}
        class="mr-10 mb-6 h-48"
      >
        <Grid y={[middle(), props.high]} class="stroke-border" />
        {/* A wash that fades out toward the baseline. */}
        <Area backgroundClass="bg-linear-to-b from-chart-1/20 to-transparent" />
        <Grid y={[props.low]} class="stroke-muted-foreground/40" />
        <Grid y={[props.rows[0].price]} class="stroke-muted-foreground" style={{ strokeDasharray: "3 3" }} />
        <Line class="stroke-chart-1 stroke-2" hoverDotClass="size-2.5 rounded-full border-2 border-card bg-chart-1" />
        {/* The grid's values right of the plot, and the first and last times under it. */}
        <PlotAxis
          placement="right"
          tickValues={[props.low, middle(), props.high]}
          format={(v) => v.toFixed(0)}
          labelClass="pl-2 text-xs tabular-nums text-muted-foreground"
        />
        <PlotAxis
          tickValues={[0, props.rows.length - 1]}
          format={(i) => props.rows[i].time}
          labelClass="pt-2 text-xs text-muted-foreground"
        />
      </Plot>
    </View>
  );
}
```

Un bar chart se lee mejor con las puntas de sus barras redondeadas y sus bases rectas (`cornerRadii={{ topLeft: 4,
topRight: 4 }}`; in a stack only on its top bar), a hair of room between the bars of a band (`groupPadding`), las barras de las demás filas atenuadas mientras una está en hover (`inactiveOpacity`) y su banda teñida (`crossLineClass`), y los valores en cifras tabulares pequeñas sobre las barras, con el total sobre una pila. Con `paddingOuter` la mitad de `paddingInner`, los centros de las bandas caen a intervalos iguales, y un `PlotAxis` centra cada mes bajo su banda; un `maxBandWidth` mantiene estrechas unas pocas barras en una tarjeta ancha.

```tsx
import { signal, Text, View } from "nsh";
import { Bar, Grid, Plot, PlotAxis } from "nsh/base/plot";

type Sale = { month: string; online: number; store: number };

export function SalesChart(props: { rows: Sale[]; stacked: boolean }) {
  const hovered = signal<number | null>(null);
  const shown = () => props.rows[hovered() ?? props.rows.length - 1];
  const tip = { topLeft: 4, topRight: 4 };
  return (
    <View class="gap-3 rounded-xl border border-border bg-card p-4">
      <View class="flex-row items-baseline">
        <Text class="flex-1 text-sm text-muted-foreground">{shown().month}</Text>
        <Text class="text-right text-sm tabular-nums text-foreground">{`${shown().online + shown().store}k`}</Text>
      </View>
      <Plot
        data={props.rows}
        xScale={{ type: "band", paddingInner: 0.3, paddingOuter: 0.15, maxBandWidth: 56, groupPadding: 0.1 }}
        yScale={{ type: "linear", domain: [0, 130] }}
        accessibilityLabel="Sales per month, online and in store"
        appearGeneration={props.stacked ? 1 : 0}
        motion={{ appear: { duration: 600, easing: "easeOut" }, enter: { duration: 150 }, exit: { duration: 150 }, pointer: { stiffness: 320, damping: 32 } }}
        crossLineClass="w-full h-full bg-foreground/5"
        onHoverChange={({ index }) => hovered.set(index)}
        class="mb-6 h-44"
      >
        <Grid y={[40, 80, 120]} class="stroke-border" />
        <Bar
          value="online"
          stack={props.stacked ? "sales" : undefined}
          cornerRadii={props.stacked ? 0 : tip}
          stagger={0.4}
          inactiveOpacity={0.45}
          label={props.stacked ? undefined : "online"}
          labelClass="pb-1 text-[11px] tabular-nums text-muted-foreground"
          class="fill-chart-1"
        />
        <Bar
          value="store"
          stack={props.stacked ? "sales" : undefined}
          cornerRadii={tip}
          stagger={0.4}
          inactiveOpacity={0.45}
          label={props.stacked ? (d) => String(d.online + d.store) : "store"}
          labelClass="pb-1 text-[11px] tabular-nums text-muted-foreground"
          class="fill-chart-2"
        />
        {/* A month centered under each band. */}
        <PlotAxis format={(i) => props.rows[i].month} labelClass="pt-2 text-xs text-muted-foreground" />
      </Plot>
    </View>
  );
}
```

Un sparkline en una fila de lista es un plot con `interactive={false}`: dibuja sus marcas y no sigue ningún puntero.

<a id="accessibility"></a>

## Accesibilidad

- Un plot es un solo elemento para los lectores de pantalla, con el rol de imagen y el `accessibilityLabel` de la app; sus marcas, las etiquetas de sus ejes, sus `PlotLabel` y las partes del hover son partes de él y no dicen nada por sí mismas. Di en la etiqueta qué muestra el chart y qué destaca (el rango, el valor más alto), y dale a `accessibilityValue` las palabras para la fila bajo el puntero, de modo que un lector de pantalla diga el valor a medida que cambia.
- La fila bajo el puntero se informa con `onHoverChange` en las plataformas con puntero (escritorios, la web, un iPad con trackpad). Las pantallas táctiles no informan de hover: muestra los valores que necesita un usuario táctil en los elementos propios de la app, u ofrece las filas como texto o como lista donde los números importen.
- Sobre un pie, la fila informada es la del sector bajo el puntero: dale a `accessibilityValue` su nombre, valor y proporción (`"Team, 340 seats, 34.0%"`), y di el total y la mayor proporción en la etiqueta. Sobre un radar es el eje más cercano al puntero: dale el nombre del eje y el valor de cada serie en él.
- Un plot interactivo es una parada del foco del teclado cuyas teclas de flecha mueven el hover ([Teclado](#keyboard)), y ofrece a los lectores de pantalla `increment` y `decrement` para recorrer las filas (VoiceOver lo lee como ajustable); un plot con `interactive={false}` no es ninguna de las dos cosas, y en ambos casos no recibe pulsaciones.

Consulta [Accesibilidad](../docs/accessibility.md) para ver etiquetas y roles en general.
<a id="platform-notes"></a>

## Notas de plataforma

- Todas las plataformas dibujan las marcas de la misma manera, a partir de un dibujo por marca grabado en Rust; un cambio en las filas vuelve a dibujar en un solo lote las marcas que las leen, y un cambio en una clase de pintura (la apariencia, `dark:`) reenvía el dibujo sin grabarlo de nuevo.
- La aparición recorta líneas y áreas, y hace crecer las barras, con valores que mueve el animador de la plataforma; el desvanecimiento de una barra a medida que se aleja de la fila con hover es una opacidad que el animador calcula a partir de la posición del hover; las partes del hover son vistas que el animador mueve y desvanece, y mantiene el tooltip dentro del gráfico a partir del tamaño del gráfico y del tooltip.
- El fondo de un área se dibuja en su propio canvas, recortado a la forma del área, con el mismo degradado que la plataforma dibuja para el `bg-linear-*` de una vista; un cambio en sus clases (la apariencia, `dark:`) reenvía el dibujo sin grabarlo de nuevo.
- Un gráfico circular dibuja cada sector en su propio canvas; el sector bajo el puntero se encuentra en Rust a partir de los ángulos y radios de los sectores, su elevación es un radio y el desvanecimiento de los demás es una opacidad que mueve el animador, y el barrido de la aparición mueve los ángulos de los sectores de la misma manera, de modo que ninguno de los dos vuelve a grabar un dibujo.
- La fila de una línea radial bajo el puntero se encuentra en Rust a partir de los ángulos de sus puntos; su punto de hover es una vista que el animador coloca sobre la fila bajo el puntero (deslizándose sobre el resorte `pointer` a medida que las claves avanzan), y mientras aparece o se mueve hacia nuevos valores, sus puntos son números que el animador mueve desde donde estaban, de modo que la línea se graba una sola vez por cambio.
- Una marca de puntos se dibuja en un solo canvas; el punto bajo el puntero se encuentra en Rust a partir de los centros y radios de los puntos, y su punto de hover es una vista que el animador coloca sobre él, del mismo tamaño; el crecimiento de la aparición, los movimientos de un cambio y el desvanecimiento del hover son valores que mueve el animador, de modo que los puntos se graban una sola vez por cambio.
- Una marca de celdas se dibuja en un solo canvas; la celda bajo el puntero se encuentra en Rust a partir de las cajas de las celdas, y su celda de hover es una vista que el animador coloca sobre ella; el crecimiento, los colores y movimientos de un cambio y el desvanecimiento del hover son valores que mueve el animador, de modo que las celdas se graban una sola vez por cambio. Cada etiqueta es un texto de la plataforma, que se muestra donde su tamaño calculado en el layout cabe dentro de su celda.
- Las etiquetas, marcas de graduación y línea de un eje son textos y vistas propios de la plataforma, colocados por el layout en Rust a partir del tamaño y de las escalas del gráfico: se mueven con las marcas cuando cambia el tamaño del gráfico, y un nuevo dominio vuelve a escribir las etiquetas.
