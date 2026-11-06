---
title: "Desplazamiento"
description: "Vistas de desplazamiento en Rust y TSX: paginación y ajuste, zoom, tirar para actualizar, eventos de desplazamiento, efectos vinculados al desplazamiento con scrollValue, el teclado en las vistas de desplazamiento y desplazamiento desde código."
order: 39
group: ui
demo: guide-scrolling
source_hash: 9701cda661979af8
---


# Desplazamiento

La vista de scroll (`scroll()` en Rust, `<Scroll>` en TSX) es la vista de desplazamiento propia de la plataforma (UIScrollView en iOS, un ScrollView en Android): los flings, los rebotes, el indicador de scroll y el pull to refresh son nativos, y también lo es el snapping. Tu código se entera del scroll mediante eventos y puede vincular el offset a un [valor animado](./animation.md#animated-values) para lograr efectos que siguen al dedo fotograma a fotograma.

Usa una vista de scroll para contenido de tamaño conocido y moderado: una página de ajustes, un formulario, un artículo, una fila de chips. Para datos largos o ilimitados usa una [lista](./lists.md), que recicla las filas y acepta las mismas props de scroll.

<a id="a-scroll-view"></a>

## Una vista de scroll

Una vista de scroll es el viewport; sus hijos son el contenido. El viewport necesita un tamaño de su padre (normalmente `flex: 1`, `.flex_1()`), y el contenido se maqueta con el ancho del viewport (vertical) o con su alto (horizontal), y tan largo como necesite.

```rust tabs
#[component]
pub fn App() -> impl IntoElement {
    scroll().flex_1().bg(rgb(0xf6f8fa)).child(
        view().p_4().gap_3().children((1..=50).map(|n| {
            view().p_4().rounded(px(10.0)).bg(white()).child(text(format!("Row {n}")))
        })),
    )
}
```

```tsx tabs
import { mount, Scroll, Text, View } from "nsh";

function App() {
  return (
    <Scroll style={{ flex: 1, backgroundColor: "#f6f8fa" }}>
      <View style={{ padding: 16, gap: 12 }}>
        <Each of={Array.from({ length: 50 }, (_, i) => i + 1)}>
          {(n) => (
            <View style={{ padding: 16, borderRadius: 10, backgroundColor: "#ffffff" }}>
              <Text>Row {n()}</Text>
            </View>
          )}
        </Each>
      </View>
    </Scroll>
  );
}

mount(App);
```

La vista hija de arriba es el contenedor de contenido de la vista de scroll; en TSX, `contentStyle` (o `contentClass`) crea uno por ti, envolviendo los hijos en una vista con ese estilo, que se desplaza con ellos. `flexGrow: 1` (`.flex_grow(1.0)`) hace que el contenido sea al menos tan alto como el viewport, de modo que un contenido corto se pueda centrar y uno largo siga desplazándose:

```rust tabs
scroll().flex_1().child(
    view().flex_grow(1.0).justify_center().p_4().child(
        when(move || messages.with(|m| !m.is_empty()), move || {
            each(messages, |m| m.id, |m, _| text(move || m.with(|m| m.text.clone())))
        })
        .otherwise(|| text("No messages yet")),
    ),
)
```

```tsx tabs
<Scroll style={{ flex: 1 }} contentStyle={{ flexGrow: 1, justifyContent: "center", padding: 16 }}>
  <If when={messages().length > 0} else={<Text>No messages yet</Text>}>
    <Each of={messages()}>{(m) => <Text>{m().text}</Text>}</Each>
  </If>
</Scroll>
```

Una vista de scroll horizontal recibe `horizontal` (`.horizontal()`) y una fila como hijo:

```rust tabs
scroll().horizontal().scrollbar(false).child(
    view().flex_row().gap_2().px_4().children(["Today", "This week", "This month", "This year"].map(|label| {
        text(label).px(px(14.0)).py_2().rounded(px(16.0)).overflow_hidden().bg(white())
    })),
)
```

```tsx tabs
<Scroll horizontal scrollbar={false}>
  <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: 16 }}>
    <Each of={["Today", "This week", "This month", "This year"]}>
      {(label) => <Text style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, overflow: "hidden", backgroundColor: "#ffffff" }}>{label()}</Text>}
    </Each>
  </View>
</Scroll>
```

De derecha a izquierda (consulta [Dispositivo y entorno](./device-and-environment.md#right-to-left)), una vista de scroll horizontal empieza en su extremo derecho y conserva la distancia a él.

Los dedos arrastran las vistas de scroll. En escritorio (macOS, Windows, Linux) y en el navegador, el ratón se desplaza como en las aplicaciones de escritorio: con su rueda (Shift + rueda desplaza en horizontal), el touchpad, el teclado y el indicador de scroll, que aparece mientras el ratón se mueve sobre la vista y se arrastra como una barra de desplazamiento; los arrastres del ratón van a los pans, los responders y la selección de texto de la app. Las pantallas táctiles en escritorio arrastran las vistas de scroll igual que los dedos. Allí, las vistas horizontales conservan su indicador incluso con `scrollbar={false}`, ya que es la forma en que un ratón sin rueda horizontal las mueve.

<a id="behavior-props"></a>

### Props de comportamiento

| Prop | Rust | Tipo | Valor por defecto | Descripción |
|---|---|---|---|---|
| `horizontal` | `.horizontal()` | `boolean` | `false` | Se desplaza lateralmente. |
| `scrollable` | `.scrollable(..)` | `boolean` | `true` | El usuario puede desplazarla. El scroll desde código sigue funcionando. |
| `bounces` | `.bounces(..)` | `boolean` | `true` | Overscroll más allá de los bordes. |
| `scrollbar` | `.scrollbar(..)` | `boolean` | `true` | Se muestra el indicador de scroll. En escritorio y en navegadores de escritorio una vista horizontal lo conserva: es la barra de desplazamiento del ratón. |
| `contentInset` | `.content_inset(EdgeInsets { .. })` | `Partial<Edges>` | | Espacio alrededor del contenido, al que se puede desplazar. |
| `contentOffset` | `.content_offset(point(..))` | `{ x?, y? }` | | Dónde empieza. |
| `decelerationRate` | `.deceleration(rate)` | `"normal" \| "fast" \| number` | el de la plataforma | Con qué rapidez se frena un fling: `"normal"`, `"fast"`, o la velocidad conservada por milisegundo (`0.998` es normal, `0.99` rápida; `0` es el valor por defecto de la plataforma). |

<a id="paging-and-snapping"></a>

## Paginación y snapping

El snapping se decide de forma nativa cuando el dedo se levanta, a partir del offset de suelta, el deslizamiento proyectado y la velocidad; la vista de scroll se desliza entonces hasta la parada elegida, sin que intervenga nada de tu código.

| Prop | Rust | Tipo | Descripción |
|---|---|---|---|
| `pagingEnabled` | `.paging(true)` | `boolean` | Se detiene en múltiplos del tamaño del viewport. |
| `snapToInterval` | `.snap_interval(px(..))` | `number` | Se detiene en múltiplos de esta longitud (0: desactivado). |
| `snapToOffsets` | `.snap_offsets(vec![..])` | `number[]` | Se detiene en estos offsets. |
| `snapToAlignment` | `.snap_alignment(SnapAlignment::Center)` | `"start" \| "center" \| "end"` | Con `snapToInterval`: qué punto de un elemento se alinea con el viewport. |
| `disableIntervalMomentum` | `.disable_interval_momentum(true)` | `boolean` | Un fling avanza como máximo una parada. |

Un paginador: páginas tan anchas como la vista de scroll y un indicador que se actualiza cuando termina el deslizamiento.

```rust tabs
const COLORS: [u32; 4] = [0x0969da, 0x8250df, 0xbf3989, 0x1a7f37];

pub fn pager() -> impl IntoElement {
    let width = signal(0.0_f32);
    let page = signal(0_usize);
    let settle = move |e: &Point<Points>| {
        let width = width.get_untracked();
        if width > 0.0 {
            page.set((e.x.0 / width).round() as usize);
        }
    };
    let pages = COLORS.iter().enumerate().map(|(i, &color)| {
        view()
            .w(move || px(width.get()))
            .h(px(160.0))
            .bg(rgb(color))
            .items_center()
            .justify_center()
            .child(text(format!("Page {}", i + 1)).text_color(white()).text_2xl().font_weight(FontWeight::BOLD))
    });
    let dots = (0..COLORS.len()).map(|i| {
        view()
            .size_2()
            .rounded(px(4.0))
            .bg(move || if page.get() == i { rgb(0x0969da) } else { rgb(0xd0d7de) })
    });
    view()
        .gap_2()
        .p_4()
        .child(
            scroll()
                .horizontal()
                .paging(true)
                .scrollbar(false)
                .h(px(160.0))
                .rounded(px(12.0))
                .on_layout(move |frame: &Bounds<Points>| width.set(frame.size.width.0))
                .on_scroll_end(settle)
                .child(view().flex_row().children(pages)),
        )
        .child(view().flex_row().justify_center().gap(px(6.0)).children(dots))
}
```

```tsx tabs
import { mount, type Point, Scroll, signal, Text, View } from "nsh";

const colors = ["#0969da", "#8250df", "#bf3989", "#1a7f37"];

function Pager() {
  const width = signal(0);
  const page = signal(0);
  const settle = ({ offset }: { offset: Point }) => page.set(Math.round(offset.x / width()));
  return (
    <View style={{ gap: 8, padding: 16 }}>
      <Scroll
        horizontal
        pagingEnabled
        scrollbar={false}
        style={{ height: 160, borderRadius: 12 }}
        onLayout={({ bounds }) => width.set(bounds.size.width)}
        onScrollEnd={settle}
      >
        <View style={{ flexDirection: "row" }}>
          <Each of={colors}>
            {(color, i) => (
              <View style={{ width: width(), height: 160, backgroundColor: color(), alignItems: "center", justifyContent: "center" }}>
                <Text style={{ color: "#ffffff", fontSize: 24, fontWeight: "700" }}>Page {i() + 1}</Text>
              </View>
            )}
          </Each>
        </View>
      </Scroll>
      <View style={{ flexDirection: "row", justifyContent: "center", gap: 6 }}>
        <Each of={colors}>
          {(_, i) => <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: page() === i() ? "#0969da" : "#d0d7de" }} />}
        </Each>
      </View>
    </View>
  );
}

mount(Pager);
```

Un carrusel de tarjetas que se ajustan al centro, una tarjeta por fling:

```rust tabs
scroll()
    .horizontal()
    .snap_interval(px(232.0))          // card width (220) + gap (12)
    .snap_alignment(SnapAlignment::Center)
    .deceleration(0.99)
    .disable_interval_momentum(true)
    .scrollbar(false)
    .child(view().flex_row().gap_3().px_4().children(cards))
```

```tsx tabs
<Scroll
  horizontal
  snapToInterval={232}          // card width (220) + gap (12)
  snapToAlignment="center"
  decelerationRate="fast"
  disableIntervalMomentum
  scrollbar={false}
>
  <View style={{ flexDirection: "row", gap: 12, paddingHorizontal: 16 }}>…</View>
</Scroll>
```

Las listas aceptan las mismas props de snapping, lo que las convierte en la mejor opción para un carrusel largo.

<a id="scroll-events"></a>

## Eventos de scroll

| Prop | Rust | Payload | Cuándo |
|---|---|---|---|
| `onScroll` | `.on_scroll(..)` | `ScrollEvent` | El offset cambió. Como máximo una vez por fotograma; `scrollEventThrottle` los espacia más. |
| `scrollEventThrottle` | `.event_throttle(ms)` | `number` | Milisegundos mínimos entre eventos `onScroll`. |
| `onScrollDragStart` | `.on_scroll_drag_start(..)` | `{ offset }` | El usuario empezó a arrastrar. |
| `onScrollDragEnd` | `.on_scroll_drag_end(..)` | `{ offset }` | El usuario levantó el dedo. |
| `onMomentumStart` | `.on_momentum_start(..)` | `{ offset }` | Comenzó el deslizamiento posterior a un fling. |
| `onMomentumEnd` | `.on_momentum_end(..)` | `{ offset }` | El deslizamiento terminó (también cuando un nuevo arrastre lo captura). |
| `onScrollEnd` | `.on_scroll_end(..)` | `{ offset }` | Un scroll del usuario llegó al reposo: tras el deslizamiento, o al final de un arrastre sin él. |

`ScrollEvent` lleva el offset (`offset`, un `Point`; igual en Rust), el tamaño del contenido con zoom (`contentSize`, un `Size`; `content_size`), el viewport (`size`) y `zoomScale` (`zoom_scale`). Los demás eventos llevan el offset: `{ offset }` con un `Point` en TSX, un `Point<Points>` en Rust.

```rust tabs
let at_bottom = signal(false);

scroll()
    .flex_1()
    .event_throttle(100.0)
    .on_scroll(move |e: &ScrollEvent| {
        at_bottom.set(e.offset.y + e.size.height >= e.content_size.height - px(20.0))
    })
    .child(content)
```

```tsx tabs
const atBottom = signal(false);

<Scroll
  style={{ flex: 1 }}
  scrollEventThrottle={100}
  onScroll={(e) => atBottom.set(e.offset.y + e.size.height >= e.contentSize.height - 20)}
>
  …
</Scroll>
```

> [!TIP]
> `onScroll` ejecuta tu código en cada fotograma de un scroll (sujeto al throttle). Para algo que solo tiene que *parecer* vinculado al scroll, como un encabezado que se desvanece o una imagen con parallax, usa en su lugar [`scrollValue`](#scroll-linked-effects-scrollvalue): se ejecuta por completo de forma nativa.

<a id="scroll-linked-effects-scrollvalue"></a>

## Efectos vinculados al scroll: scrollValue

`scrollValue` (`.scroll_value(&value)`) recibe un [valor animado](./animation.md#animated-values) y escribe en él de forma nativa el offset del scroll (a lo largo del eje principal), en el mismo fotograma en que se mueve el contenido. Vincula ese valor, o nodos derivados de él con `interpolate`, `diffClamp` (`diff_clamp`) o aritmética, a los estilos.

```rust tabs
#[component]
pub fn App() -> impl IntoElement {
    let offset = animated_value(0.0);
    view()
        .flex_1()
        .child(
            view()
                .h(px(56.0))
                .justify_center()
                .px_4()
                // Transparent at the top, white after 80 points.
                .bind_background(&offset.interpolate_colors(&[0.0, 80.0], &[rgba(0xffffff00), rgba(0xffffffff)]))
                .child(
                    text("Inbox")
                        .text_size(px(22.0))
                        .font_weight(FontWeight::BOLD)
                        .origin_left()
                        .bind_scale(&offset.interpolate(&[0.0, 80.0], &[1.0, 0.8])),
                ),
        )
        .child(scroll().flex_1().scroll_value(&offset).child(view().p_4().gap_2()))
}
```

```tsx tabs
import { mount, Scroll, Text, View } from "nsh";
import { createAnimatedValue } from "nsh";

function App() {
  const offset = createAnimatedValue(0);
  return (
    <View style={{ flex: 1 }}>
      <View
        style={{
          height: 56,
          justifyContent: "center",
          paddingHorizontal: 16,
          // Transparent at the top, white after 80 points.
          backgroundColor: offset.interpolate({ inputRange: [0, 80], outputRange: ["rgba(255,255,255,0)", "#ffffff"] }),
        }}
      >
        <Text
          style={{
            fontSize: 22,
            fontWeight: "700",
            transformOrigin: "left center",
            scale: offset.interpolate({ inputRange: [0, 80], outputRange: [1, 0.8] }),
          }}
        >
          Inbox
        </Text>
      </View>
      <Scroll style={{ flex: 1 }} scrollValue={offset}>
        <View style={{ padding: 16, gap: 8 }}>…</View>
      </Scroll>
    </View>
  );
}

mount(App);
```

Un encabezado que se desliza fuera mientras el contenido sube y vuelve en cuanto se desplaza hacia abajo es `diffClamp` del offset:

```rust tabs
let offset = animated_value(0.0);
let header = offset.diff_clamp(0.0, 56.0);

view()
    .flex_1()
    .child(scroll().flex_1().scroll_value(&offset).child(view().pt(px(56.0))))
    .child(view().absolute().top_0().left_0().right_0().h(px(56.0)).bind_translate_y(&header.mul(-1.0)))
```

```tsx tabs
const offset = createAnimatedValue(0);
const header = offset.diffClamp(0, 56);

<View style={{ flex: 1 }}>
  <Scroll style={{ flex: 1 }} scrollValue={offset}>
    <View style={{ paddingTop: 56 }}>…</View>
  </Scroll>
  <View style={{ position: "absolute", top: 0, left: 0, right: 0, height: 56, translate: [0, header.mul(-1)] }}>…</View>
</View>
```

Por defecto, las interpolaciones se limitan (clamp) fuera de su rango de entrada, así que tirar más allá del borde superior (un offset negativo) mantiene el efecto en su extremo; pasa `extrapolate: "extend"` (`interpolate_with(.., Interpolation::extrapolate(Extrapolate::Extend))` en Rust) para un encabezado elástico que crece al tirar.

<a id="pull-to-refresh"></a>

## Tirar para actualizar (pull to refresh)

`refreshing` y `onRefresh` (`.refreshing(..)` y `.on_refresh(..)`) añaden el control de pull to refresh de la plataforma. El control se muestra mientras `refreshing` sea true; actívalo en `onRefresh` y desactívalo cuando termine el trabajo.

```rust tabs
let refreshing = signal(false);
let reload = move || {
    refreshing.set(true);
    spawn(async move {
        if let Ok(response) = fetch("https://api.example.com/items").await {
            items.set(parse_items(&response.text()));
        }
        refreshing.set(false);
    });
};

scroll().flex_1().refreshing(refreshing).on_refresh(reload).child(content)
```

```tsx tabs
const refreshing = signal(false);
const reload = async () => {
  refreshing.set(true);
  try {
    items.set(await (await fetch("https://api.example.com/items")).json());
  } finally {
    refreshing.set(false);
  }
};

<Scroll style={{ flex: 1 }} refreshing={refreshing()} onRefresh={reload}>…</Scroll>
```

En iOS el control es UIRefreshControl; en el idioma Mac de Mac Catalyst, NSH muestra su propio spinner con el mismo comportamiento. Las listas aceptan las mismas props. En escritorio y en el navegador el gesto de tirar es el de una pantalla táctil (o el de un trackpad de macOS, que tira más allá del borde superior), ya que el ratón se desplaza sin arrastrar; ofrece allí otra forma de actualizar, como un botón o un atajo de teclado.

<a id="an-indicator-of-your-own"></a>

### Un indicador propio

El aspecto del gesto de tirar lo elige la app. `refreshIndicator={{ height }}` indica que la app dibuja su propio indicador, `height` puntos de alto: el spinner de la plataforma se oculta, un tirón actualiza al alcanzar `height`, y mientras actualiza se mantiene `height` por encima del contenido para el indicador. `pullValue` alimenta un valor animado con cuánto se ha tirado del contenido más allá del borde superior: 0 en reposo, creciendo con el tirón, y `height` mientras se actualiza. Dibuja el indicador sobre la parte superior de la vista de scroll e interpola sus estilos a partir del valor: siguen al dedo en el hilo de UI, sin JS por fotograma.

```rust tabs
let pull = animated_value(0.0);

view()
    .flex_1()
    .child(
        scroll()
            .flex_1()
            .refreshing(refreshing)
            .on_refresh(reload)
            .pull_value(&pull)
            .refresh_indicator(Some(px(72.0)))
            .child(content),
    )
    .child(
        view()
            .pointer_events(PointerEvents::None)
            .absolute()
            .top_0()
            .left_0()
            .right_0()
            .h(px(72.0))
            .items_center()
            .justify_center()
            .bind_opacity(&pull.interpolate(&[0.0, 36.0], &[0.0, 1.0]))
            .bind_rotate(&pull.interpolate(&[36.0, 72.0], &[0.0, 180.0]))
            .child(arrow()),
    )
```

```tsx tabs
const pull = createAnimatedValue(0);

<View style={{ flex: 1 }}>
  <Scroll
    style={{ flex: 1 }}
    refreshing={refreshing()}
    onRefresh={reload}
    pullValue={pull}
    refreshIndicator={{ height: 72 }}
  >
    …
  </Scroll>
  <View
    style={{
      pointerEvents: "none",
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 72,
      alignItems: "center",
      justifyContent: "center",
      opacity: pull.interpolate({ inputRange: [0, 36], outputRange: [0, 1] }),
      transform: [{ rotate: pull.interpolate({ inputRange: [36, 72], outputRange: ["0deg", "180deg"] }) }],
    }}
  >
    <Arrow />
  </View>
</View>;
```

Mantén `height` dentro de la mitad del viewport: más allá del borde superior el contenido opone más resistencia al dedo cuanto más avanza, y una altura excesiva nunca se alcanza. En iOS, un indicador propio de la app sustituye a UIRefreshControl por el tirón que NSH detecta por sí mismo, como en el idioma Mac.

<a id="zooming"></a>

## Zoom

Una vista de scroll (las listas mantienen una escala de 1) hace zoom cuando su escala máxima de zoom es mayor que la mínima: pellizcar escala el contenido, y mientras está ampliado se desplaza en ambos sentidos.

| Prop | Rust | Tipo | Valor por defecto | Descripción |
|---|---|---|---|---|
| `minimumZoomScale` | `.zoom_range(min, max)` | `number` | `1` | El zoom más pequeño. |
| `maximumZoomScale` | `.zoom_range(min, max)` | `number` | `1` | El zoom más grande; si es mayor que el mínimo, pellizcar hace zoom. |
| `zoomScale` | `.zoom(scale)` | `number` | | Hace zoom a esta escala cuando cambia la prop; en caso contrario se conserva el zoom del usuario. |
| `bouncesZoom` | `.bounces_zoom(..)` | `boolean` | `true` | El pellizco puede superar los límites y rebota. |
| `zoomable` | `.zoomable(..)` | `boolean` | `true` | El usuario puede pellizcar para hacer zoom. |
| `centerContent` | `.center_content(..)` | `boolean` | `false` | El contenido más pequeño que el viewport (alejado) se centra. |

El evento de scroll informa de la escala de zoom y del tamaño del contenido con zoom. Desde código, `zoom_to(scale, center, animated)` / `zoomTo({ scale, x, y, animated })` hace zoom de modo que el punto del contenido (en puntos sin zoom) quede en el centro del viewport; el doble toque para hacer zoom es un manejador de press que lo llama:

```rust tabs
pub fn photo() -> impl IntoElement {
    let photo = element_ref();
    let scale = signal(1.0_f32);
    scroll()
        .flex_1()
        .bg(black())
        .zoom_range(1.0, 4.0)
        .center_content(true)
        .on_scroll(move |e: &ScrollEvent| scale.set(e.zoom_scale))
        .element_ref(&photo)
        .child(
            image("https://picsum.photos/id/1015/1200/800")
                .w(px(390.0))
                .h(px(260.0))
                .on_press(move || photo.zoom_to(if scale.get_untracked() > 1.5 { 1.0 } else { 3.0 }, None, true)),
        )
}
```

```tsx tabs
import { Image, mount, Scroll, type ScrollRef, signal } from "nsh";

function Photo() {
  let scroll!: ScrollRef;
  const scale = signal(1);
  return (
    <Scroll
      ref={scroll}
      style={{ flex: 1, backgroundColor: "#000000" }}
      minimumZoomScale={1}
      maximumZoomScale={4}
      centerContent
      onScroll={(e) => scale.set(e.zoomScale)}
    >
      <Image
        src="https://picsum.photos/id/1015/1200/800"
        style={{ width: 390, height: 260 }}
        onPress={() => scroll.zoomTo({ scale: scale() > 1.5 ? 1 : 3 })}
      />
    </Scroll>
  );
}

mount(Photo);
```

El texto y los canvas dentro de una vista de scroll con zoom se vuelven a dibujar con la nueva resolución cuando termina el zoom, así que se mantienen nítidos en iOS. En Android, NSH hace zoom con una vista de scroll propia, que escala alrededor del punto focal del pellizco, se desplaza con cualquier número de dedos, hace fling y rebota elásticamente en los bordes y en los límites de zoom. Android inicia un pellizco cuando los dedos están separados unos 27 mm, igual que el detector de gestos del sistema.

<a id="scrolling-from-code"></a>

## Scroll desde código

Dale una ref a la vista de scroll (`element_ref()` y `.element_ref(&scroller)` en Rust, un [`ref`](./jsx-and-components.md) en TSX) y llama a sus métodos. Los comandos se ejecutan después del resto de cambios de la misma actualización, por lo que desplazarse a contenido recién añadido funciona.

| Rust | TSX | Descripción |
|---|---|---|
| `scroll_to(point, animated)` | `scrollTo({ x?, y?, animated? })` | Se desplaza a un offset. Animado por defecto en TSX. |
| `zoom_to(scale, center, animated)` | `zoomTo({ scale, x?, y?, animated? })` | Vistas de scroll con zoom: hace zoom a `scale` (limitado a los límites), alrededor del punto del contenido o del centro. |

```rust tabs
let scroller = element_ref();

scroll().flex_1().element_ref(&scroller).child(content)
view().on_press(move || scroller.scroll_to(point(px(0.0), px(0.0)), true))
```

```tsx tabs
let scroll!: ScrollRef;

<Scroll ref={scroll} style={{ flex: 1 }}>…</Scroll>
<View onPress={() => scroll.scrollTo({ y: 0 })}>…</View>
```

Las listas añaden `scrollToIndex`, `scrollToOffset` y `scrollToEnd`; consulta [Listas](./lists.md#scrolling-from-code).

<a id="scroll-views-and-the-keyboard"></a>

## Vistas de scroll y el teclado

NSH mantiene visible por sí mismo un input con foco: cuando aparece el teclado, la vista de scroll que rodea al input recibe un inset inferior tan alto como el teclado y desplaza el input hasta hacerlo visible. Esto ocurre de forma nativa, sin código en tu app. Usa `env(keyboard-inset-height)` como padding inferior ([Contenido fuera de las vistas de scroll](./forms-and-keyboard.md#content-outside-scroll-views)) para el contenido que está fuera de las vistas de scroll, como una barra de mensajes fijada abajo.

Dos props deciden cómo interactúan el scroll y los toques con el teclado:

| Prop | Rust | Tipo | Valor por defecto | Descripción |
|---|---|---|---|---|
| `keyboardDismissMode` | `.keyboard_dismiss_mode(KeyboardDismissMode::OnDrag)` | `"none" \| "on-drag" \| "interactive"` | `"none"` | Si arrastrar el contenido oculta el teclado. `"interactive"` deja que el teclado siga al dedo hacia abajo en iOS; en Android se comporta como `"on-drag"`. |
| `keyboardShouldPersistTaps` | `.keyboard_taps(KeyboardTaps::Handled)` | `"never" \| "always" \| "handled"` | `"never"` | Qué hace un toque mientras el teclado está visible. |

`keyboardShouldPersistTaps`:

- `"never"`: un toque fuera del input con foco solo oculta el teclado, y los botones reciben el siguiente toque. El usuario toca una vez para cerrarlo y otra para pulsar.
- `"handled"`: un toque sobre algo que lo gestiona (un botón) pasa y el teclado se queda; un toque en un espacio vacío lo oculta. Normalmente es la mejor opción para formularios.
- `"always"`: el teclado permanece abierto con cualquier toque.

Ambos se deciden de forma nativa cuando ocurre el toque o el arrastre, sin esperar a tu código. Para ocultar el teclado desde código, llama a `dismiss_keyboard()` en Rust o a `Keyboard.dismiss()` de [`nsh`](../modules/nsh.md#keyboard-and-keyboardframe) en TSX.

<a id="nested-scroll-views"></a>

## Vistas de scroll anidadas

Una vista de scroll horizontal dentro de una vertical funciona como se espera: cada una toma los arrastres de su propio eje. Dos vistas de scroll en el mismo eje también se anidan (la interior se desplaza primero). Los responders que necesitan el dedo, como un canvas de dibujo dentro de una vista de scroll, se lo quitan a las vistas de scroll que los rodean: `.keep_touches(true)` en Rust, `true` devuelto desde `onResponderGrant` en TSX; consulta [Tacto y gestos](./touch-and-gestures.md#the-responder-system).

<a id="related"></a>

## Relacionado

- [Scroll](../elements/scroll.md): la referencia del elemento, con todas sus props y eventos.
- [Listas](./lists.md): listas virtualizadas con las mismas props de scroll.
- [Animación](./animation.md): valores animados, `interpolate` y `diffClamp` para efectos vinculados al scroll.
- [Formularios y teclado](./forms-and-keyboard.md): inputs, foco y teclado.
