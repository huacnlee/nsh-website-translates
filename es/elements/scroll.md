---
title: "Scroll"
description: "La vista de desplazamiento nativa: desplazamiento vertical y horizontal, paginación y ajuste (snapping), pull to refresh, zoom y eventos de desplazamiento."
order: 40
group: primitives
demo: el-scroll
source_hash: a0ea652770335f03
---


# Scroll

`Scroll` es una vista de desplazamiento nativa (un UIScrollView en iOS y Mac Catalyst, un ScrollView en Android). Dispone todos sus
hijos como contenido y los desplaza de forma nativa: el desplazamiento, el lanzamiento (fling), el rebote y el ajuste (snapping) se ejecutan en la plataforma, a
la frecuencia de la pantalla. Rust crea una con `scroll()`, TSX con `<Scroll>` desde `nsh`.

```rust tabs
use nsh_core::prelude::*;

scroll().flex_1().child(
    view().p_4().gap_2().child(each(
        rows,
        |row: &Row| row.id,
        |row, _index| text(move || row.get().title),
    )),
)
```

```tsx tabs
<Scroll style={{ flex: 1 }}>
  <View style={{ padding: 16, gap: 8 }}>
    <Each of={rows}>{(row) => <Text>{row().title}</Text>}</Each>
  </View>
</Scroll>
```

Una vista de desplazamiento crea todos sus hijos, lo que resulta adecuado para páginas de tamaño moderado. Para datos largos o ilimitados usa una
[lista](./list.md): crea las filas cercanas al viewport y las recicla.

Una vista de desplazamiento necesita un tamaño acotado a lo largo de su eje: dale `flex: 1` (`.flex_1()`) o una altura dentro de un contenedor que
tenga una. Su contenido se dispone al ancho de la vista de desplazamiento (a su alto si es horizontal) y tan alto (ancho) como necesite.

## Props

Además de las [props comunes](./index.md#common-props) (con `style` tipado como `ViewStyle`). En Rust, las props de desplazamiento
son métodos del trait `Scrollable`, que las listas comparten.

<a id="scrolling"></a>

### Desplazamiento

| Prop | Rust | Tipo | Valor por defecto | Descripción |
|---|---|---|---|---|
| `horizontal` | `.horizontal()` | `boolean` | `false` | Se desplaza lateralmente. |
| `scrollable` | `.scrollable(..)` | `boolean` | `true` | El usuario puede desplazarla. |
| `scrollbar` | `.scrollbar(..)` | `boolean \| ScrollbarTheme` | `true` | Se muestra el indicador de desplazamiento: el de la plataforma, o la [barra integrada](./scrollbar.md#built-in-bars) de la app una vez que ha definido un tema; un objeto es un tema propio de la vista. En el escritorio y en los navegadores de escritorio una vista horizontal lo conserva: es la barra de desplazamiento del ratón. |
| `bounces` | `.bounces(..)` | `boolean` | `true` | Desplazamiento excesivo más allá de los bordes. |
| `pagingEnabled` | `.paging(..)` | `boolean` | `false` | Se detiene en múltiplos del viewport. |
| `snapToInterval` | `.snap_interval(px(..))` | `number` | `0` | Se detiene en múltiplos de esta longitud (0: desactivado). |
| `snapToOffsets` | `.snap_offsets(..)` | `number[]` | | Se detiene en estos desplazamientos. |
| `snapToAlignment` | `.snap_alignment(SnapAlignment::Center)` | `"start" \| "center" \| "end"` | `"start"` | Qué punto de un elemento se alinea con el viewport con `snapToInterval`. |
| `disableIntervalMomentum` | `.disable_interval_momentum(..)` | `boolean` | `false` | Un fling avanza como máximo un punto de ajuste. |
| `decelerationRate` | `.deceleration(rate)` | `"normal" \| "fast" \| number` | plataforma | Con qué rapidez se frena un fling: la velocidad que se conserva por milisegundo (`normal` 0.998, `fast` 0.99). |
| `contentInset` | `.content_inset(EdgeInsets { .. })` | `Partial<Edges>` | | Espacio alrededor del contenido. |
| `contentOffset` | `.content_offset(point(..))` | `{ x?, y? }` | | Dónde comienza. |
| `contentStyle` | los estilos propios de la vista de contenido | `ViewStyle` | | El estilo de una vista alrededor de los hijos que se desplaza con ellos; `flexGrow: 1` hace que sea al menos tan alta como el viewport (un estado vacío centrado). |
| `contentClass` | los estilos propios de la vista de contenido | `string` | | Lo mismo que classes, p. ej. `"grow justify-center p-4"`. |
| `keyboardDismissMode` | `.keyboard_dismiss_mode(KeyboardDismissMode::OnDrag)` | `"none" \| "on-drag" \| "interactive"` | `"none"` | Si arrastrar descarta el teclado. |
| `keyboardShouldPersistTaps` | `.keyboard_taps(KeyboardTaps::Handled)` | `"never" \| "always" \| "handled" \| boolean` | `"never"` | Si un toque descarta el teclado: `never` (el toque solo lo descarta), `always` (permanece visible), `handled` (permanece visible cuando algo gestiona el toque). |
| `scrollValue` | `.scroll_value(&value)` | `AnimatedValue` | | Un valor animado alimentado con el desplazamiento (eje principal), para animaciones vinculadas al scroll. |
| `scrollEventThrottle` | `.event_throttle(ms)` | `number` | | Milisegundos mínimos entre eventos `onScroll` (como máximo uno por fotograma de todos modos). |

### Pull to refresh

| Prop | Rust | Tipo | Descripción |
|---|---|---|---|
| `refreshing` | `.refreshing(..)` | `boolean` | Se muestra el indicador de actualización. |
| `onRefresh` | `.on_refresh(..)` | `() => void` | El usuario tiró para actualizar: inicia la carga y establece `refreshing` hasta que termine. |
| `refreshIndicator` | `.refresh_indicator(Some(height))` | `{ height: number }` | La app dibuja su propio indicador, de `height` puntos de alto: el spinner de la plataforma se oculta, un tirón actualiza al alcanzar `height`, y mientras se actualiza se mantiene `height` por encima del contenido. Una altura de 0 o menos significa ninguno. |
| `pullValue` | `.pull_value(&value)` | `AnimatedValue` | Un valor animado alimentado con cuánto se tira de la vista más allá de su parte superior (0 en reposo, creciendo con el tirón; el espacio que se mantiene sobre el contenido mientras se actualiza: `height` con `refreshIndicator`), para el indicador de la app. |

```rust tabs
let refreshing = signal(false);

scroll()
    .flex_1()
    .refreshing(refreshing)
    .on_refresh(move || {
        refreshing.set(true);
        spawn(async move {
            load().await;
            refreshing.set(false);
        });
    })
    .child(content())
```

```tsx tabs
const refreshing = signal(false);
async function reload() {
  refreshing.set(true);
  await load();
  refreshing.set(false);
}

<Scroll style={{ flex: 1 }} refreshing={refreshing()} onRefresh={reload}>
  …
</Scroll>;
```

<a id="zooming"></a>

### Zoom

Al establecer `maximumZoomScale` por encima de `minimumZoomScale` (`.zoom_range(min, max)` en Rust) el contenido se puede ampliar con un
gesto de pellizco; con zoom, se desplaza en ambos sentidos. Las listas mantienen su escala.

| Prop | Rust | Tipo | Valor por defecto | Descripción |
|---|---|---|---|---|
| `minimumZoomScale` | `.zoom_range(min, max)` | `number` | `1` | El zoom mínimo. |
| `maximumZoomScale` | `.zoom_range(min, max)` | `number` | `1` | El zoom máximo. |
| `zoomScale` | `.zoom(..)` | `number` | | Hace zoom a esta escala cuando cambia; de lo contrario se conserva el zoom del usuario. |
| `bouncesZoom` | `.bounces_zoom(..)` | `boolean` | `true` | El pellizco puede sobrepasar los límites y vuelve con un efecto de resorte. |
| `zoomable` | `.zoomable(..)` | `boolean` | `true` | El usuario puede hacer zoom con un pellizco. |
| `centerContent` | `.center_content(..)` | `boolean` | `false` | El contenido más pequeño que el viewport (alejado) se centra. |

```rust tabs
let photo = element_ref();

scroll()
    .element_ref(&photo)
    .zoom_range(1.0, 4.0)
    .center_content(true)
    .flex_1()
    .bg(black())
    .child(
        image(PICTURE)
            .w(px(390.0))
            .h(px(520.0))
            .on_press(move || photo.zoom_to(1.0, None, true)),
    )
```

```tsx tabs
let photo!: ScrollRef;
<Scroll ref={photo} maximumZoomScale={4} centerContent style={{ flex: 1, backgroundColor: "#000" }}>
  <Image src={picture} style={{ width: 390, height: 520 }} onPress={() => photo.zoomTo({ scale: 1, animated: true })} />
</Scroll>;
```

<a id="events"></a>

## Eventos

| Evento | Rust | Payload | Cuándo |
|---|---|---|---|
| `onScroll` | `.on_scroll` | `ScrollEvent` | El desplazamiento cambió (como máximo una vez por fotograma, y no con más frecuencia que `scrollEventThrottle`). |
| `onScrollDragStart` / `onScrollDragEnd` | `.on_scroll_drag_start` / `.on_scroll_drag_end` | `{ offset }` (`Point<Points>`) | El usuario empezó / dejó de arrastrar. |
| `onMomentumStart` / `onMomentumEnd` | `.on_momentum_start` / `.on_momentum_end` | `{ offset }` | Un deslizamiento posterior al arrastre empezó / terminó. Un deslizamiento interrumpido por un nuevo arrastre termina igualmente con `onMomentumEnd`. |
| `onScrollEnd` | `.on_scroll_end` | `{ offset }` | El desplazamiento llegó al reposo. |
| `onRefresh` | `.on_refresh` | ninguno | Se tiró para actualizar. |

`ScrollEvent` es `{ offset: Point; contentSize: Size; size: Size; zoomScale }` (en Rust `offset`, `content_size`,
`size`, `zoom_scale`): el desplazamiento, el tamaño del contenido (con zoom), el tamaño del viewport y la escala de zoom (1 a menos que la vista
tenga zoom).

> [!TIP]
> Para mover algo con la posición de desplazamiento (un encabezado que se reduce, una imagen con parallax), vincula `scrollValue` a un valor
> nativo e interpólalo en un estilo. Se ejecuta en el hilo de la UI a la frecuencia de la pantalla, mientras que `onScroll` es un evento por
> fotograma en el código de la app. Consulta [animación](../docs/animation.md).

<a id="ref-methods"></a>

## Métodos de ref

| Método | Rust | Descripción |
|---|---|---|
| `scrollTo({ x?, y?, animated? })` | `scroll_to(point(x, y), animated)` | Se desplaza a una posición. |
| `zoomTo({ scale, x?, y?, animated? })` | `zoom_to(scale, Some(point(x, y)), animated)` | Hace zoom a `scale` (limitado a los límites) con el punto de contenido (`x`, `y`, puntos sin zoom) en el centro del viewport, o alrededor del centro. P. ej. un doble toque que amplía el punto tocado. |

```rust tabs
let scroller = element_ref();
scroll().element_ref(&scroller).child(content());

scroller.scroll_to(point(px(0.0), px(0.0)), true);
```

```tsx tabs
let scroller!: ScrollRef;
<Scroll ref={scroller}>…</Scroll>;
scroller.scrollTo({ y: 0, animated: true });
```

<a id="keyboard"></a>

## Teclado

Los campos de entrada dentro de una vista de desplazamiento se mantienen libres del teclado de forma nativa: la vista de desplazamiento recibe un inset inferior y se desplaza
por sí sola hasta el campo enfocado. Para contenido fuera de las vistas de desplazamiento usa [`env(keyboard-inset-height)`](./keyboard.md)
en un padding o margin inferior. Consulta [formularios y el teclado](../docs/forms-and-keyboard.md).

<a id="right-to-left"></a>

## De derecha a izquierda

Las vistas de desplazamiento horizontales comienzan en el extremo derecho en los diseños de derecha a izquierda y mantienen su distancia a él cuando el contenido
cambia; sus hijos se reflejan.

<a id="platform-notes"></a>

## Notas de plataforma

- Android: NSH dibuja el pull to refresh (el overscroll sigue siendo nativo), `contentInset` se aplica como padding, y
  `decelerationRate` da forma a los deslizamientos de ajuste.
- Android hace zoom con el scroll view propio de NSH, que escala el contenido alrededor de su esquina superior izquierda y se desplaza en ambos sentidos.
  Los pellizcos comienzan después de la separación mínima entre los dedos de Android (unos 27 mm).
- En Mac Catalyst (idioma Mac), NSH detecta el tirón y muestra su spinner.
- iOS vuelve a dibujar textos y canvases a la resolución con zoom cuando termina un zoom.
