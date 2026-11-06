---
title: "Toque y gestos"
description: "Pulsaciones y respuesta visual al pulsar, áreas de impacto, eventos de puntero, toques sin procesar, el sistema de respuesta (responder system), PanResponder y gestos nativos de desplazamiento, pellizco y rotación."
order: 38
group: ui
demo: guide-gestures
source_hash: 00e684506892cb71
---


# Toque y gestos

NSH tiene tres niveles de manejo táctil. Las **pulsaciones** (`.on_press` en Rust, `onPress` en TSX y sus variantes) cubren botones, filas y enlaces, con la respuesta visual dibujada de forma nativa. Los **gestos nativos** (pan, pinch y rotation) mueven [valores animados](./animation.md#animated-values) en el hilo de la UI, de modo que una tarjeta arrastrada sigue al dedo incluso cuando tu código está ocupado. Los **toques sin procesar y el sistema de responders** (`.on_touch` y `.claim_touches` con los manejadores `.on_responder_*` en Rust; `onTouchStart`, `onResponderMove` y `PanResponder` en TSX) dan a tu código la posición de cada dedo para todo lo que los otros dos niveles no pueden expresar, como dibujar.

Elige el nivel más alto que resuelva el problema: cuanto más alto el nivel, menos trabajo pasa del hilo de la UI a tu código.

<a id="presses"></a>

## Pulsaciones

Todos los elementos aceptan los manejadores de pulsación; no hay un componente "touchable" aparte. Pon `.on_press` / `onPress` en una vista, un texto, una imagen o cualquier otro elemento.

```rust tabs
use nsh_core::prelude::*;

#[component]
fn App() -> impl IntoElement {
    let count = signal(0_u32);
    view().flex_1().items_center().justify_center().child(
        view()
            .on_press(move || count.update(|n| *n += 1))
            .on_long_press(move || count.set(0))
            .active(|s| s.opacity(0.6))
            .role(AccessibilityRole::Button)
            .px(px(20.0))
            .py(px(12.0))
            .rounded(px(10.0))
            .bg(rgb(0x0969da))
            .child(
                text(move || format!("Pressed {} times", count.get()))
                    .text_color(white())
                    .font_weight(FontWeight::SEMIBOLD),
            ),
    )
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";

function App() {
  const count = signal(0);
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <View
        onPress={() => count.update((n) => n + 1)}
        onLongPress={() => count.set(0)}
        activeStyle={{ opacity: 0.6 }}
        role="button"
        style={{ paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, backgroundColor: "#0969da" }}
      >
        <Text style={{ color: "#ffffff", fontWeight: "600" }}>Pressed {count()} times</Text>
      </View>
    </View>
  );
}

mount(App);
```

| Rust | TSX | Predeterminado | Descripción |
|---|---|---|---|
| `.on_press(..)` | `onPress` | | El dedo se levantó dentro de la vista (tras una pulsación, no una pulsación larga). |
| `.on_long_press(..)` | `onLongPress` | | El dedo permaneció apoyado durante el retardo de la pulsación larga. El manejador de pulsación no se ejecuta después. |
| `.on_press_down(..)` | `onPressDown` | | La pulsación comenzó. |
| `.on_press_up(..)` | `onPressUp` | | La pulsación terminó: el dedo se levantó, se deslizó fuera o una vista de desplazamiento tomó el control. |
| `.long_press_delay(ms)` | `delayLongPress` | `500` | Milisegundos antes de que una pulsación pase a ser una pulsación larga. |
| `.disabled(..)` | `disabled` | `false` | No admite pulsaciones y no muestra respuesta visual; aplica el estilo de deshabilitado; los lectores de pantalla indican que está deshabilitado. |

Cómo se comportan las pulsaciones:

- **Solo responde la vista pulsable más interna.** Una fila pulsable que contiene un botón pulsable no recibe la pulsación cuando se pulsa el botón.
- **Dentro de una vista de desplazamiento, la pulsación espera unos 130 ms** antes de comenzar (y de mostrar la respuesta visual), de modo que un arrastre que empieza sobre un botón desplaza el contenido en lugar de pulsar el botón.
- **Deslizar hacia fuera cancela.** Mover el dedo fuera de la vista termina la pulsación con el manejador de fin de pulsación y sin pulsación.
- **Deshabilitar elimina los listeners de pulsación** de lo que está montado, de modo que la vista no muestra ninguna respuesta visual y se aplica el estilo de deshabilitado (`.disabled_style(..)`, `class="disabled:opacity-40"`).
- **Los spans de texto anidados con un manejador de pulsación son enlaces.** El párrafo es una sola vista nativa; la pulsación va al span que está bajo el dedo. Consulta [Text](./text.md).

<a id="press-feedback"></a>

## Respuesta visual a la pulsación

La respuesta visual es responsabilidad de la app: son los estilos que la vista adopta mientras está pulsada, con el puntero encima, con foco o deshabilitada. Se aplican de forma nativa en el momento en que cambia el estado, sin ida y vuelta a tu código. Cada estado tiene un método de Rust, una prop de estilo en TSX y una [variante de Tailwind](./tailwind.md):

| Rust | Prop de TSX | Clase | Descripción |
|---|---|---|---|
| `.active(\|s\| ..)` | `activeStyle` | `active:` | Mientras está pulsada. |
| `.hover(\|s\| ..)` | `hoverStyle` | `hover:` | Mientras un puntero está encima (escritorio, punteros de iPad, navegadores). |
| `.focus(\|s\| ..)` | `focusStyle` | `focus:` | Mientras tiene el foco. |
| `.focus_within(\|s\| ..)` | `focusWithinStyle` | `focus-within:` | Mientras ella o una vista dentro de ella tiene el foco: el marco de un campo alrededor del input que se edita. |
| `.disabled_style(\|s\| ..)` | `disabledStyle` | `disabled:` | Mientras está deshabilitada. |
| `.ripple(Ripple { .. })` | `android={{ ripple }}` | | El ripple de Material en Android (`color`, `borderless`, `radius`, `foreground`), además de los estilos. |

Los estilos de estado se aplican sobre los estilos propios de la vista. Los estados posteriores prevalecen (hover, focus, active), el estilo de deshabilitado prevalece sobre todos y los demás no se aplican mientras la vista está deshabilitada.

```rust tabs
use nsh_core::{Ripple, prelude::*};

view().on_press(open).active(|s| s.opacity(0.5))

view().on_press(open).active(|s| s.bg(rgb(0xddf4ff))).p(px(16.0))

view()
    .on_press(open)
    .active(|s| s.opacity(0.6))
    .ripple(Ripple {
        color: Some(rgba(0x0969da4d).into()),
        ..Ripple::default()
    })
```

```tsx tabs
<View onPress={open} activeStyle={{ opacity: 0.5 }}>…</View>

<View onPress={open} activeStyle={{ backgroundColor: "#ddf4ff" }} style={{ padding: 16 }}>…</View>

<View
  onPress={open}
  activeStyle={{ opacity: 0.6 }}
  android={{ ripple: { color: "rgba(9,105,218,0.3)" } }}
>
  …
</View>
```

Un ripple sin borde se extiende fuera de la vista, lo que resulta adecuado para botones de icono: `Ripple { borderless: true, radius: Some(px(24.0)), .. }`, `android={{ ripple: { borderless: true, radius: 24 } }}`. Consulta [Platform-specific code](./platform-specific.md).

Con una transición (`.transition()`, la clase `transition`) el cambio de estado se anima. `.group()` (la clase `group`) convierte una vista en un grupo, y `.group_active(..)` (`group-active:`) da estilo a sus hijos mientras está pulsada:

```rust tabs
view()
    .on_press(save)
    .group()
    .rounded_xl()
    .bg(rgb(0x059669))
    .p_4()
    .transition()
    .active(|s| s.scale(0.95).bg(rgb(0x065f46)))
    .child(
        text("Save")
            .font_weight(FontWeight::SEMIBOLD)
            .text_color(white())
            .group_active(|s| s.opacity(0.85)),
    )
```

```tsx tabs
<View
  onPress={save}
  class="group rounded-xl bg-emerald-600 p-4 transition active:scale-95 active:bg-emerald-800"
>
  <Text class="font-semibold text-white group-active:opacity-85">Save</Text>
</View>
```

<a id="hit-areas-hitslop"></a>

## Áreas táctiles: hitSlop

El hit slop (`.hit_slop(..)`, `hitSlop`) amplía el área que recibe toques más allá de los límites de la vista, sin cambiar su layout. Úsalo en objetivos pequeños como botones de cierre e interruptores.

```rust tabs
view().hit_slop(EdgeInsets::all(px(12.0))).on_press(close).size(px(20.0))

view()
    .hit_slop(EdgeInsets { top: px(10.0), bottom: px(10.0), left: px(4.0), right: px(4.0) })
    .on_press(next)
```

```tsx tabs
<View hitSlop={12} onPress={close} style={{ width: 20, height: 20 }}>…</View>
<View hitSlop={{ top: 10, bottom: 10, left: 4, right: 4 }} onPress={next}>…</View>
```

| Rust | TSX | Descripción |
|---|---|---|
| `.hit_slop(EdgeInsets)` | `hitSlop: number \| { top?, right?, bottom?, left? }` | Puntos añadidos alrededor de los límites. `EdgeInsets::all(..)` y un número en TSX se aplican a los cuatro lados. |

Mantén el área ampliada dentro de los límites del padre (da a la vista pequeña algo de margen o padding a su alrededor): el hit testing llega a un hijo a través de su padre, así que un toque fuera del padre nunca alcanza el slop del hijo.

<a id="children-outside-their-parent"></a>

## Hijos fuera de su padre

Un hijo situado fuera de los límites de su padre (posicionado de forma absoluta con `overflow` y visible, como un desplegable bajo su campo) recibe los toques donde se dibuja, como cualquier otra vista: NSH hace hit testing de forma nativa sobre los descendientes que sobresalen de una vista. Un padre que recorta su desbordamiento los recorta, y entonces ni se ven ni reciben toques en esa zona. El área se calcula a partir del layout, así que un hijo sacado de su padre mediante una transformación solo recibe toques dentro de los límites del padre.

Ten en cuenta el orden de dibujo: un desplegable se dibuja sobre los hermanos de su campo solo si el campo va después de ellos o tiene un `z-index` mayor, y los toques van a lo que se dibuja encima.

## pointerEvents

La clave de estilo `pointerEvents` (`.pointer_events(..)` en Rust) decide qué vistas de un subárbol pueden ser el objetivo de un toque. Se evalúa de forma nativa durante el hit testing, por lo que no cuesta nada por cada toque.

| Rust | TSX | La vista | Sus hijos |
|---|---|---|---|
| `PointerEvents::Auto` (predeterminado) | `"auto"` | Recibe toques | Reciben toques |
| `PointerEvents::None` | `"none"` | Nunca es el objetivo | Nunca son el objetivo salvo que alguno establezca `"auto"`: los toques pasan a lo que hay detrás |
| `PointerEvents::BoxNone` | `"box-none"` | Nunca es el objetivo | Reciben toques |
| `PointerEvents::BoxOnly` | `"box-only"` | Recibe toques | Nunca son el objetivo |

Los usos típicos: una superposición que no debe bloquear lo que hay debajo (none), un contenedor a pantalla completa cuyo espacio vacío debe dejar pasar los toques al contenido de detrás mientras sus botones siguen funcionando (box-none), y una fila que debe recibir la pulsación incluso cuando el dedo cae sobre un hijo (box-only).

```rust tabs
view().flex_1().child(map()).child(
    // A floating toolbar: the empty area passes touches to the map.
    view()
        .pointer_events(PointerEvents::BoxNone)
        .absolute()
        .inset_0()
        .justify_end()
        .p(px(16.0))
        .child(
            view()
                .on_press(locate)
                .self_end()
                .p(px(12.0))
                .rounded(px(24.0))
                .bg(white())
                .child(text("Locate")),
        ),
)
```

```tsx tabs
<View style={{ flex: 1 }}>
  <Map />
  {/* A floating toolbar: the empty area passes touches to the map. */}
  <View style={{ pointerEvents: "box-none", position: "absolute", top: 0, left: 0, right: 0, bottom: 0, justifyContent: "flex-end", padding: 16 }}>
    <View onPress={locate} style={{ alignSelf: "flex-end", padding: 12, borderRadius: 24, backgroundColor: "#ffffff" }}>
      <Text>Locate</Text>
    </View>
  </View>
</View>
```

`"none"` se hereda como el `pointer-events` de CSS: una vista dentro de ella que establece `"auto"` vuelve a recibir toques. `"box-none"` y `"box-only"` se aplican a la vista que las establece. Las clases de Tailwind `pointer-events-none` y `pointer-events-auto` establecen `"none"` y `"auto"`, y como clave de estilo `pointerEvents` también admite estilos de estado (`activeStyle`, ...) y variantes.

<a id="native-gestures-pan-pinch-and-rotation"></a>

## Gestos nativos: pan, pinch y rotation

Para arrastres, pellizcos y rotaciones que mueven algo en pantalla, enlaza [valores animados](./animation.md#animated-values) al gesto. El reconocedor de gestos de la plataforma escribe los valores en el hilo de la UI y las vistas enlazadas a ellos se mueven en el mismo fotograma; tu código recibe aviso cuando el gesto empieza y termina.

```rust tabs
use nsh_core::prelude::*;

#[component]
fn App() -> impl IntoElement {
    let x = animated_value(0.0);
    let y = animated_value(0.0);
    view().flex_1().items_center().justify_center().child(
        view()
            .pan_values(Some(&x), Some(&y))
            .on_pan_end(move |e: &PanEvent| {
                // Spring back, starting at the speed the finger let go with.
                let spring = |velocity| Spring { velocity: Some(velocity), ..Spring::default() };
                x.spring(0.0, spring(e.velocity_x));
                y.spring(0.0, spring(e.velocity_y));
            })
            .size(px(120.0))
            .rounded(px(24.0))
            .bg(rgb(0x8250df))
            .bind_translate_x(&x)
            .bind_translate_y(&y),
    )
}
```

```tsx tabs
import { mount, View } from "nsh";
import { createAnimatedValue } from "nsh";

function App() {
  const x = createAnimatedValue(0);
  const y = createAnimatedValue(0);
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <View
        pan={{ x, y }}
        onPanEnd={(e) => {
          // Spring back, starting at the speed the finger let go with.
          x.spring(0, { velocity: e.velocity.x });
          y.spring(0, { velocity: e.velocity.y });
        }}
        style={{ width: 120, height: 120, borderRadius: 24, backgroundColor: "#8250df", translate: [x, y] }}
      />
    </View>
  );
}

mount(App);
```

| Rust | TSX | Descripción |
|---|---|---|
| `.pan_values(Some(&x), Some(&y))` | `pan={{ x?, y? }}` | Los arrastres con un dedo mueven estos valores, en puntos. |
| `.pinch_value(&scale)` | `pinch={{ scale? }}` | Los pellizcos con dos dedos controlan `scale` (un factor). |
| `.rotation_value(&angle)` | `rotation={{ angle? }}` | Las rotaciones con dos dedos controlan `angle`, en grados. |
| `.on_pan_start` / `.on_pan_end` | `onPanStart` / `onPanEnd` | El arrastre comenzó / terminó, con un `PanEvent`. |
| `.on_pinch_start` / `.on_pinch_end` | `onPinchStart` / `onPinchEnd` | El pellizco comenzó / terminó: su escala y velocidad (`GestureEvent`). |
| `.on_rotation_start` / `.on_rotation_end` | `onRotationStart` / `onRotationEnd` | La rotación comenzó / terminó: su ángulo (Rust: `GestureEvent<Radians>`) y velocidad. |

Un evento de pan incluye la traslación (`translation`, un `Point`: puntos desde el inicio), la velocidad (`velocity_x` / `velocity_y`; TSX: `velocity`, un `Point`: puntos por **segundo**) y los valores enlazados en ese momento (`value_x` / `value_y`; TSX: `value`, `{ x?, y? }` con los ejes que `pan` enlaza).

Lo que hace el lado nativo por ti:

- **Un arrastre continúa desde donde está el valor.** Al comenzar se leen los valores y se les suma la traslación; si agarras un valor que aún se está animando (un spring de camino a su posición de origen), la animación se detiene donde está.
- **Con un solo eje, el otro puede desplazarse.** Si solo hay un valor horizontal enlazado, el arrastre comienza únicamente cuando el dedo se mueve más en horizontal que en vertical, de modo que una fila deslizable horizontalmente dentro de una vista de desplazamiento vertical sigue desplazándose en vertical. Esta decisión se toma de forma nativa cuando el sistema pregunta si el gesto puede comenzar.
- **Pan, pinch y rotation funcionan a la vez** en la misma vista: una tarjeta puede arrastrarse, pellizcarse y rotarse al mismo tiempo.
- **Velocidad de liberación para la física.** La velocidad del final del pan alimenta directamente la velocidad de un spring o de un decay; los valores te permiten elegir un punto de anclaje.

```rust tabs
// A card that snaps to the left or right edge.
view()
    .pan_values(Some(&x), None)
    .on_pan_end(move |e: &PanEvent| {
        let projected = e.value_x.unwrap_or(0.0) + e.velocity_x * 0.2;
        let to = if projected > 0.0 { 140.0 } else { -140.0 };
        x.spring(to, Spring { velocity: Some(e.velocity_x), ..Spring::default() });
    })
    .bind_translate_x(&x)
```

```tsx tabs
// A card that snaps to the left or right edge.
<View
  pan={{ x }}
  onPanEnd={(e) => {
    const projected = (e.value?.x ?? 0) + e.velocity.x * 0.2;
    x.spring(projected > 0 ? 140 : -140, { velocity: e.velocity.x });
  }}
  style={{ translate: [x, 0] }}
/>
```

> [!TIP]
> Enlaza valores animados al gesto en lugar de seguirlo mediante el responder siempre que el arrastre solo mueva elementos. Con valores enlazados, el código ocupado de la app no puede hacer que el arrastre vaya a tirones; con el responder, cada movimiento es un evento para tu código y una actualización de lo que muestra la vista.

<a id="raw-touches"></a>

## Toques sin procesar

Los manejadores de toques informan de cada dedo cuando baja, se mueve y se levanta. Son útiles para registro, hit testing personalizado y reaccionar al multitáctil; no reclaman el toque (las pulsaciones y las vistas de desplazamiento siguen funcionando).

En Rust, `.on_touch(..)` recibe cada fase como un `TouchEvent`: su `phase` (`TouchPhase::Start`, `Move`, `End`, `Cancel`), su `timestamp` y su `points`, cada dedo que está apoyado, cada uno con su `id`, su `location` en la vista sobre la que bajó, su posición `page` en la superficie, y `changed` para los dedos a los que se refiere el evento. En TSX, cada fase tiene su propio manejador:

| TSX | Descripción |
|---|---|
| `onTouchStart` | Un dedo bajó sobre la vista o dentro de ella. |
| `onTouchMove` | Un dedo se movió. Los movimientos se combinan por turno del motor. |
| `onTouchEnd` | Un dedo se levantó. |
| `onTouchCancel` | El sistema tomó el toque (una vista de desplazamiento empezó a desplazarse, entró una llamada). |
| `onTouchStartCapture`, `onTouchMoveCapture`, `onTouchEndCapture`, `onTouchCancelCapture` | Lo mismo, pero invocado de fuera hacia dentro, antes de los manejadores de propagación (bubbling). |

Cada manejador de TSX recibe un `GestureResponderEvent`:

| Campo | Descripción |
|---|---|
| `identifier` | Identifica el dedo mientras está apoyado. |
| `locationX`, `locationY` | Posición en la vista sobre la que bajó el dedo (`target`). |
| `pageX`, `pageY` | Posición en la superficie. |
| `target` | El id de la vista sobre la que bajó el dedo. |
| `timestamp` | Milisegundos. |
| `touches` | Todos los dedos que están apoyados. |
| `changedTouches` | Los dedos a los que se refiere este evento. |
| `nativeEvent` | El propio evento, de modo que `e.nativeEvent.locationX` también funciona. |
| `stopPropagation()` | Las vistas más externas no ven este evento táctil. |

```rust tabs
use nsh_core::{TouchPhase, element::{TouchEvent}, prelude::*};

view().on_touch(|e: &TouchEvent| {
    let Some(p) = e.points.iter().find(|p| p.changed) else { return };
    match e.phase {
        TouchPhase::Start => log::info!("down {:?} {}", p.location, e.points.len()),
        TouchPhase::Move => log::info!("move {:?}", p.page),
        TouchPhase::End | TouchPhase::Cancel => log::info!("up"),
    }
})
```

```tsx tabs
<View
  onTouchStart={(e) => console.log("down", e.locationX, e.locationY, e.touches.length)}
  onTouchMove={(e) => console.log("move", e.pageX, e.pageY)}
  onTouchEnd={() => console.log("up")}
/>
```

<a id="where-a-view-is-measure"></a>

### Dónde está una vista: measure

La ubicación de un toque es relativa a la vista sobre la que bajó el dedo, que puede ser un hijo de la vista que te interesa (el control deslizante de un slider). Medir una vista te dice dónde está, de modo que puedas usar en su lugar la posición en la página. En Rust, pon un `element_ref()` en la vista y haz await de su `measure()`; en TSX, llama a `measure()` en su ref:

```rust tabs
let track = element_ref();
let origin = stored(px(0.0));
view()
    .element_ref(&track)
    .claim_touches(TouchClaim::on_start())
    .on_responder_grant(move |e: &ResponderEvent| {
        let x = e.page.x;
        spawn(async move {
            let page = track.measure().await.map_or(px(0.0), |m| m.page.x);
            origin.replace(page);
            seek(x - page);
        });
    })
    .on_responder_move(move |e: &ResponderEvent| seek(e.page.x - origin.get()))
```

```tsx tabs
let track!: ViewRef;
let origin = 0;
<View
  ref={track}
  onStartShouldSetResponder={() => true}
  onResponderGrant={async (e) => {
    const x = e.pageX;
    origin = (await track.measure())?.pagePosition.x ?? 0;
    seek(x - origin);
  }}
  onResponderMove={(e) => seek(e.pageX - origin)}
/>;
```

Se resuelve una vez que los cambios realizados hasta el momento se han maquetado: en Rust a un `Measurement` (`frame`, el frame en el padre tal como lo informa el manejador de layout, y `page`, la esquina superior izquierda), en TSX a `{ bounds, pagePosition }`. La esquina está en la superficie, o en el diálogo en el que se encuentra la vista, con las mismas coordenadas que las posiciones de página de los toques. Se tienen en cuenta los desplazamientos de las vistas de desplazamiento y las listas que la rodean; las transformaciones (incluidas las animaciones) no. Se resuelve a `None` / `null` para una vista que no está en pantalla.
<a id="the-responder-system"></a>

## El sistema responder

Cuando tu código tiene que ser dueño de una secuencia táctil (dibujar con el dedo, un slider personalizado, un gesto que los reconocedores nativos no ofrecen), usa el sistema de gestos responder. Una vista a la vez es el **responder** y recibe los movimientos; las vistas negocian cuál es.

Convertirse en responder:

| Rust | TSX | Descripción |
|---|---|---|
| `.claim_touches(TouchClaim::on_start())` | `onStartShouldSetResponder` que devuelve `true` | Se consulta cuando un dedo toca la pantalla, desde el objetivo hacia afuera. |
| `.claim_touches(TouchClaim::on_move())` | `onMoveShouldSetResponder` que devuelve `true` | Se consulta en cada movimiento mientras no hay responder (o para tomar el control). |
| `TouchClaim::on_start().capture()` | `onStartShouldSetResponderCapture` | Como el anterior, pero se consulta de afuera hacia adentro, antes que los de burbujeo. Un padre lo usa para quitarles un toque a sus hijos. |
| `TouchClaim::on_move().capture()` | `onMoveShouldSetResponderCapture` | La versión para movimientos. |

Una reclamación se decide solo a partir de la vista, sin que se ejecute código tuyo, salvo que lo pida: `TouchClaim::on_move().ask(|r: &ClaimRequest| ..)` reclama cuando el listener llama a `r.claim()`, decidiendo con el gesto hasta el momento (`r.event.gesture`). Los handlers de TSX reciben el gesto como segundo argumento, `gestureState`, con los mismos campos que los de [PanResponder](#panresponder) (`dx`, `dy`, `vx`, `vy`, `moveX`, `moveY`, `x0`, `y0`, `numberActiveTouches`). Un swipe que solo reclama los movimientos horizontales: `onMoveShouldSetResponder={(e, g) => Math.abs(g.dx) > 10 && Math.abs(g.dx) > Math.abs(g.dy)}`. Esa decisión llega igualmente con un movimiento de retraso, por lo que un scroll view que lo rodee puede empezar a desplazarse primero; para arrastres dentro de scroll views usa la [activación del pan](#pans-inside-scroll-views-panactivation).

Mientras se responde:

| Rust | TSX | Descripción |
|---|---|---|
| `.on_responder_grant(..)` | `onResponderGrant` | Esta vista es ahora el responder. Rust evita por defecto que los scroll views nativos tomen los toques (`TouchClaim::block_native(false)` se lo permite); en TSX, devuelve `true` para eso. |
| `.on_responder_reject(..)` | `onResponderReject` | Otra vista es el responder y no quiso cederlo. |
| `.on_responder_start(..)` | `onResponderStart` | Otro dedo tocó la pantalla. |
| `.on_responder_move(..)` | `onResponderMove` | Un dedo se movió. |
| `.on_responder_end(..)` | `onResponderEnd` | Un dedo se levantó. |
| `.on_responder_release(..)` | `onResponderRelease` | Se levantó el último dedo: el gesto terminó. |
| `.keep_touches(true)` | `onResponderTerminationRequest` que devuelve `false` | Otra vista quiere los toques: conserva los tuyos (por defecto se ceden). |
| `.on_responder_terminate(..)` | `onResponderTerminate` | Otra vista, o un gesto nativo, tomó los toques. |

El responder de un componente Rust permanece presionado desde su concesión hasta que terminan sus toques, vaya donde vaya el dedo o el puntero, igual que el `:active` de CSS se mantiene hasta que se suelta el botón: sus estilos `.active(..)` y las clases `group-active:` que contiene conservan su aspecto durante todo el arrastre (un tirador de redimensionado arrastrado fuera de su banda).

Los handlers de Rust reciben un `ResponderEvent`: el `location` del dedo en la vista donde se apoyó, su posición `page`, y el `timestamp` y el `gesture` desde la concesión.

```rust tabs
use nsh_core::prelude::*;

fn sketch() -> impl IntoElement {
    let strokes = signal(Vec::<Vec<Point<Points>>>::new());
    canvas(move || {
        strokes.with(|all| {
            all.iter().fold(Painter::new().line_width(3.0), |p, s| {
                let mut p = p.begin_path();
                for (i, pt) in s.iter().enumerate() {
                    p = if i == 0 { p.move_to(pt.x, pt.y) } else { p.line_to(pt.x, pt.y) };
                }
                p.stroke()
            })
        })
    })
    .flex_1()
    // The responder: the scroll view around does not take the touches.
    .claim_touches(TouchClaim::on_start())
    .keep_touches(true)
    .on_responder_grant(move |e: &ResponderEvent| strokes.update(|all| all.push(vec![e.location])))
    .on_responder_move(move |e: &ResponderEvent| {
        strokes.update(|all| {
            if let Some(last) = all.last_mut() {
                last.push(e.location);
            }
        })
    })
}
```

```tsx tabs
import { Canvas, type GestureResponderEvent, mount, signal } from "nsh";

function Sketch() {
  const strokes = signal<[number, number][][]>([]);
  const point = (e: GestureResponderEvent): [number, number] => [e.locationX, e.locationY];
  return (
    <Canvas
      style={{ flex: 1 }}
      onStartShouldSetResponder={() => true}
      onResponderGrant={(e) => {
        strokes.set([...strokes(), [point(e)]]);
        return true; // the scroll view around must not take the touches
      }}
      onResponderTerminationRequest={() => false}
      onResponderMove={(e) => {
        const all = strokes();
        strokes.set([...all.slice(0, -1), [...all[all.length - 1], point(e)]]);
      }}
      draw={(cx) => {
        cx.lineWidth = 3;
        for (const s of strokes()) {
          cx.beginPath();
          s.forEach(([x, y], i) => (i === 0 ? cx.moveTo(x, y) : cx.lineTo(x, y)));
          cx.stroke();
        }
      }}
    />
  );
}

mount(Sketch);
```

Cómo funciona: una vista con cualquier handler táctil o de responder escucha los toques de forma nativa; la plataforma informa de los toques sobre ella (y dentro de ella) junto con la ruta de las vistas que escuchan, y la negociación se ejecuta en el núcleo Rust de NSH, que consulta las reclamaciones y llama a tus handlers en orden: primero las capturas desde la vista más externa hacia adentro, y luego las demás desde el objetivo hacia afuera. Dos consecuencias:

- **Los scroll views nativos y los responders compiten.** Mientras un responder los bloquea, los scroll views a su alrededor dejan de tomar los toques hasta que este termina. Si un scroll view nativo empieza a arrastrar primero, gana: el responder recibe el handler de terminación y los handlers táctiles reciben una cancelación.
- **Cada movimiento es un evento para tu código.** Los arrastres dirigidos por un responder son tan fluidos como rápido sea tu código; para arrastres que solo mueven vistas, prefiere los [valores enlazados](#native-gestures-pan-pinch-and-rotation).

## PanResponder

En Rust, los eventos del responder ya incluyen el gesto: `ResponderEvent::gesture` es un `PanGesture` con la distancia desde el inicio, la velocidad y el número de dedos. En TSX, `PanResponder` de `nsh` envuelve el sistema responder y añade el mismo estado del gesto; aplica su `panHandlers` con spread sobre una vista.

```rust tabs
use nsh_core::prelude::*;

fn ball() -> impl IntoElement {
    let pos = signal((0.0_f32, 0.0_f32));
    let start = stored((0.0_f32, 0.0_f32));
    view()
        .size(px(60.0))
        .rounded(px(30.0))
        .bg(rgb(0x0969da))
        .style_with(move |s| {
            let (x, y) = pos.get();
            s.translate_x(px(x)).translate_y(px(y))
        })
        .claim_touches(TouchClaim::on_start())
        .on_responder_grant(move |_: &ResponderEvent| {
            start.replace(pos.get_untracked());
        })
        .on_responder_move(move |e: &ResponderEvent| {
            let (x, y) = start.get();
            let d = e.gesture.delta;
            pos.set((x + d.x.0, y + d.y.0));
        })
        .on_responder_release(move |e: &ResponderEvent| {
            log::info!("released at {} {} pt/s", e.gesture.vx, e.gesture.vy)
        })
}
```

```tsx tabs
import { mount, signal, View } from "nsh";
import { PanResponder } from "nsh";

function Ball() {
  const pos = signal({ x: 0, y: 0 });
  let start = { x: 0, y: 0 };
  const responder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      start = pos();
    },
    onPanResponderMove: (_, g) => pos.set({ x: start.x + g.dx, y: start.y + g.dy }),
    onPanResponderRelease: (_, g) => console.log("released at", g.vx, g.vy, "pt/s"),
  });
  return (
    <View
      {...responder.panHandlers}
      style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: "#0969da", translate: [pos().x, pos().y] }}
    />
  );
}

mount(Ball);
```

El estado del gesto:

| Rust (`PanGesture`) | TSX (`gestureState`) | Descripción |
|---|---|---|
| | `stateID` | Identifica el gesto. |
| `position` | `moveX`, `moveY` | La última posición del centroide de los toques, en puntos de la superficie. |
| `origin` | `x0`, `y0` | Dónde estaba el centroide cuando se concedió el responder. |
| `delta` | `dx`, `dy` | Distancia recorrida desde la concesión. |
| `vx`, `vy` | `vx`, `vy` | Velocidad, en puntos por segundo. |
| `active_touches` | `numberActiveTouches` | Dedos apoyados. |

`PanGesture::begin` y `PanGesture::update` siguen un gesto a partir de toques sin procesar (`.on_touch`) en Rust. Los callbacks de TSX reciben `(event, gestureState)`: `onStartShouldSetPanResponder(Capture)`, `onMoveShouldSetPanResponder(Capture)`, `onPanResponderGrant`, `onPanResponderReject`, `onPanResponderStart`, `onPanResponderMove`, `onPanResponderEnd`, `onPanResponderRelease`, `onPanResponderTerminate`, `onPanResponderTerminationRequest` y `onShouldBlockNativeResponder`. El último vale por defecto `true`: un PanResponder concedido evita que los scroll views nativos tomen sus toques.

<a id="pans-inside-scroll-views-panactivation"></a>

## Pans dentro de scroll views: panActivation

Un gráfico que se explora lateralmente dentro de un scroll view vertical tiene que tomar los arrastres horizontales y dejar los verticales al scroll view. Reclamar el toque al inicio bloquea el desplazamiento desde el primer píxel, y decidir con los movimientos en tu código llega tarde: para cuando responde, el scroll view puede haber tomado el toque. La activación del pan (`TouchClaim::on_pan(..)`, `panActivation`) permite que la plataforma decida en el hilo principal, a medida que el dedo se mueve:

```rust tabs
view()
    .claim_touches(TouchClaim::on_pan(PanActivation::horizontal(px(10.0), px(10.0))))
    .on_responder_grant(|e: &ResponderEvent| scrub(Some(e.location.x)))
    .on_responder_move(|e: &ResponderEvent| scrub(Some(e.location.x)))
    .on_responder_release(|_: &ResponderEvent| scrub(None))
    .child(chart())
```

```tsx tabs
<View
  panActivation={{ activeOffsetX: 10, failOffsetY: 10 }}
  onResponderGrant={(e) => scrub(e.locationX)}
  onResponderMove={(e) => scrub(e.locationX)}
  onResponderRelease={() => scrub(null)}
>
  <Chart />
</View>
```

| Rust (`PanActivation`) | TSX | Descripción |
|---|---|---|
| `active_offset_x`, `active_offset_y` | `activeOffsetX`, `activeOffsetY` | El pan se activa cuando el dedo se ha movido más que este valor desde donde se apoyó, a lo largo de ese eje (en cualquier dirección, en puntos). |
| `fail_offset_x`, `fail_offset_y` | `failOffsetX`, `failOffsetY` | El pan falla cuando el dedo se ha movido más que este valor primero: los scroll views conservan los toques. |

`PanActivation::horizontal(active, fail)` y `PanActivation::vertical(active, fail)` establecen los pares habituales. Sin offsets activos, el pan se activa tras 10 puntos en cualquier dirección. Hasta que se activa, los scroll views a su alrededor lo esperan (iOS) y no se consultan las demás reclamaciones de la vista. Cuando se activa, los scroll views ya no pueden tomar esos toques y la vista se convierte en el responder (la concesión, luego los movimientos); cuando falla, el scroll view se desplaza como de costumbre. En TSX, los `panHandlers` de `PanResponder` también funcionan con ella: aplícalos con spread junto a la prop, y `onPanResponderGrant` se ejecuta en la activación.

> [!NOTE]
> Toda velocidad está en puntos por segundo: el `vx` / `vy` del gesto del responder, la velocidad de un pan y la de un spring o un decay, de modo que `vx` pasa a un spring o a un decay tal cual.

<a id="why-some-answers-are-props"></a>

## Por qué algunas respuestas son props

El hilo principal nunca espera a tu código. Cuando el sistema necesita una respuesta al instante (si este gesto de pan puede comenzar, si este punto golpea la vista, si este toque debe cerrar el teclado), NSH responde de forma nativa a partir de lo que se montó de antemano: los valores de pan enlazados (sus ejes), el valor de pinch, el hit slop, los pointer events, el ajuste de toques sobre el teclado de los scroll views, la activación del pan. Tus handlers se enteran de lo ocurrido después. Por eso son ajustes declarativos y no callbacks, y por eso la negociación del responder, que sí ejecuta tu código, solo decide entre responders y nunca bloquea un gesto nativo.

<a id="related"></a>

## Relacionado

- [`View`](../elements/view.md): todas las props táctiles del elemento básico.
- [Animation](./animation.md): valores animados, springs y decay para movimiento dirigido por gestos.
- [Scrolling](./scrolling.md): el ajuste de toques sobre el teclado, los scroll views y los gestos anidados.
- [`PanResponder`](../modules/nsh.md#panresponder): la referencia de `PanResponder`.
- [Accessibility](./accessibility.md): las vistas presionables son elementos de accesibilidad; dales un rol y una etiqueta.
