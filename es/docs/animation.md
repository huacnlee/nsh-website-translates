---
title: "Animación"
description: "Motions (entradas, salidas, llamadas de atención y bucles ya preparados, o tus propios keyframes), transiciones de estilo y animaciones con keyframes, valores animados con timing, spring, decay y keyframes, interpolación, animaciones compuestas, easing, animaciones de layout y qué se ejecuta en el hilo de la interfaz, en Rust y TSX."
order: 43
group: ui
demo: guide-animation
source_hash: 87a276d211b53553
---


# Animación

Todas las animaciones de NSH se ejecutan en el hilo de UI. La describes una sola vez, desde Rust o TSX, y la plataforma la reproduce fotograma a fotograma (Core Animation y un display link en iOS, el animador del hilo de UI en Android) sin volver a llamar a tu código. Un hilo del motor saturado no puede hacer que una animación se entrecorte, y una animación no consume nada de tu código mientras se ejecuta.

Hay seis herramientas, de la más lista para usar a la más flexible:

| Herramienta | Úsala para |
|---|---|
| [Motion](#motion) | Una vista que entra, sale, llama la atención o se repite en bucle: motions predefinidos (`fadeInUp`, `shake`, `pulse`, ...) o keyframes propios, sobre su opacidad y su transformación. |
| [Transiciones](#transitions) | Un cambio de estilo que debe animarse en lugar de saltar: un color, una opacidad, una transformación. |
| [Animaciones de keyframes](#keyframe-animations) | Un spinner, un marcador de posición que pulsa, una pista que rebota. |
| [Keyframes](#keyframes) | Cualquier valor animado mediante keyframes, tal como los reproduce CSS: offsets, una curva de easing por segmento, iteraciones y una dirección. |
| [Valores animados](#animated-values) | Cualquier cosa dirigida por un valor a lo largo del tiempo: resortes, gestos, posición de scroll, secuencias. |
| [Animaciones de layout](#layoutanimation) | Cambios de tamaño y posición tras una actualización: elementos insertados, eliminados, reordenados, un panel que se expande. |

## Motion

Un motion mueve la opacidad y la transformación de una vista mediante keyframes, de forma nativa. Crea uno en el componente que posee la vista (`motion()` en Rust, `createMotion()` de `nsh` en TSX), vincúlalo a la vista y reproduce en él un motion predefinido o uno propio. `enter` coloca la vista donde empieza un motion y lo reproduce de inmediato, de modo que la vista entra desde su primer fotograma.

```rust tabs
#[component]
pub fn App() -> impl IntoElement {
    let card = motion().entering(MotionPreset::FadeInUp);
    view().flex_1().items_center().justify_center().child(
        view()
            .size(px(120.0))
            .rounded(px(16.0))
            .bg(rgb(0x0969da))
            .bind_motion(&card)
            .on_press(move || {
                card.play(MotionPreset::Shake);
            }),
    )
}
```

```tsx tabs
import { mount, View } from "nsh";
import { createMotion } from "nsh";

function App() {
  const card = createMotion({ enter: "fadeInUp" });
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <View
        onPress={() => card.play("shake")}
        style={{ width: 120, height: 120, borderRadius: 16, backgroundColor: "#0969da", ...card.style }}
      />
    </View>
  );
}

mount(App);
```

Un motion tiene un valor animado por canal: `opacity` (0..1), `translateX` y `translateY` (puntos), `rotate`, `rotateX` y `rotateY` (grados), `scale`, `scaleX` y `scaleY`. Empiezan en reposo (opacidad y escalas en 1, el resto en 0) y se aplican en este orden: traslaciones, luego rotaciones, luego escalas, respecto al origen de transformación de la vista. Un motion no tiene aspecto propio: mueve lo que tú has estilizado.

Un motion mueve solo la opacidad y la transformación. Al expandir `m.style` se establecen los `opacity` y `transform` de la vista; para conservar una opacidad propia, vincula solo los pasos (`transform: m.transform`). Los colores se mueven con un valor animado y [`interpolate`](#interpolation).

| TSX | Rust | Descripción |
|---|---|---|
| `createMotion(options?)` | `motion()` | Un motion con todos los canales en reposo. |
| `createMotion({ initial: { opacity: 0 } })` | `m.value(MotionChannel::Opacity).set(0.0)` | Dónde empiezan los canales; los demás empiezan en reposo. |
| `createMotion({ enter, delay, duration, ... })` | `motion().entering(spec)` | Empieza donde empieza `enter` y lo reproduce de inmediato; las demás opciones cambian su temporización. `enter` establece los canales que mueve, sobre `initial`. |
| `style={m.style}`, `m.transform` | `.bind_motion(&m)` | Vincula los canales: `m.style` es `{ opacity, transform }`, y su `transform` una lista de siete pasos (`scale` se integra en `scaleX` y `scaleY`). Se aplican después de los `translate`, `rotate` y `scale` de la vista; una perspectiva antes de ellos da profundidad a un giro 3D: `transform: [{ perspective: 800 }, ...m.transform]`. En Rust, la transformación del motion se aplica después de la propia de la vista. |
| `m.opacity`, `m.translateX`, ... | `m.value(MotionChannel::Opacity)`, ... | El valor animado de un canal, para interpolarlo o dirigirlo a mano. |
| `m.play(motion, options?)` | `m.play(spec)` | Reproduce un preset o un motion propio; uno nuevo interrumpe al que se está reproduciendo. Se resuelve con `{ finished }`, `true` cuando termina (`AnimationEnd` en Rust). |
| `m.animation(motion, options?)` | `m.animation(spec)` | El mismo motion como [animación compuesta](#composite-animations), sin iniciar, para secuenciarlo, escalonarlo o repetirlo en bucle con otros. |
| `play(motion, { ignoreReduceMotion: true })` | `m.play_ignoring_reduce_motion(spec)` | Lo reproduce incluso cuando el usuario pide menos movimiento. |
| `m.stop()` | `m.stop()` | Lo detiene donde está. |
| `m.reset()` | `m.reset()` | Lo detiene y devuelve cada canal al reposo. |

### Presets

Los motions predefinidos son datos: `motions` de `nsh` (`motions.fadeInUp` es lo que reproduce `play("fadeInUp")`) y `MotionPreset` en Rust (`MotionPreset::FadeInUp.spec()`). Las distancias están en puntos, dimensionadas para controles y tarjetas; para vistas más grandes, escala los valores de un motion o escribe tus propios keyframes. `swing` y las demás rotaciones giran respecto al origen de transformación de la vista: dale a un cartel que se balancea `transformOrigin: "top"` (`.origin_top()`).

**Entrada**: empiezan ocultos o desplazados y terminan en reposo.

| TSX | Rust | Duración | Descripción |
|---|---|---|---|
| `fadeIn` | `MotionPreset::FadeIn` | 300 ms | Aparece con fundido. |
| `fadeInUp` | `MotionPreset::FadeInUp` | 450 ms | Aparece con fundido, subiendo hasta su sitio. |
| `fadeInDown` | `MotionPreset::FadeInDown` | 450 ms | Aparece con fundido, bajando hasta su sitio. |
| `fadeInLeft` | `MotionPreset::FadeInLeft` | 450 ms | Aparece con fundido, viniendo desde la izquierda. |
| `fadeInRight` | `MotionPreset::FadeInRight` | 450 ms | Aparece con fundido, viniendo desde la derecha. |
| `zoomIn` | `MotionPreset::ZoomIn` | 350 ms | Aparece con fundido, creciendo desde el 90 %. |
| `popIn` | `MotionPreset::PopIn` | 450 ms | Aparece de golpe: crece desde la mitad de su tamaño, supera el propio y se asienta. |
| `bounceIn` | `MotionPreset::BounceIn` | 650 ms | Entra rebotando, con dos sobreimpulsos. |
| `slideInUp` | `MotionPreset::SlideInUp` | 400 ms | Se desliza hacia arriba desde abajo, sin fundido (hojas modales, toasts). |
| `slideInDown` | `MotionPreset::SlideInDown` | 400 ms | Se desliza hacia abajo desde arriba, sin fundido. |
| `flipInX` | `MotionPreset::FlipInX` | 600 ms | Entra girando sobre su eje horizontal. |
| `flipInY` | `MotionPreset::FlipInY` | 600 ms | Entra girando sobre su eje vertical. |

**Salida**: empiezan en reposo y terminan ocultos o desplazados.

| TSX | Rust | Duración | Descripción |
|---|---|---|---|
| `fadeOut` | `MotionPreset::FadeOut` | 250 ms | Desaparece con fundido. |
| `fadeOutUp` | `MotionPreset::FadeOutUp` | 300 ms | Desaparece con fundido, alejándose hacia arriba. |
| `fadeOutDown` | `MotionPreset::FadeOutDown` | 300 ms | Desaparece con fundido, alejándose hacia abajo. |
| `fadeOutLeft` | `MotionPreset::FadeOutLeft` | 300 ms | Desaparece con fundido hacia la izquierda. |
| `fadeOutRight` | `MotionPreset::FadeOutRight` | 300 ms | Desaparece con fundido hacia la derecha. |
| `zoomOut` | `MotionPreset::ZoomOut` | 250 ms | Desaparece con fundido, encogiéndose hasta el 90 %. |
| `popOut` | `MotionPreset::PopOut` | 300 ms | Sale de golpe: se hincha un poco y luego se encoge hasta desaparecer. |
| `slideOutDown` | `MotionPreset::SlideOutDown` | 300 ms | Se desliza hacia abajo hasta salir de la vista, sin fundido. |
| `slideOutUp` | `MotionPreset::SlideOutUp` | 300 ms | Se desliza hacia arriba hasta salir de la vista, sin fundido. |

**Atención**: empiezan y terminan en reposo.

| TSX | Rust | Duración | Descripción |
|---|---|---|---|
| `shake` | `MotionPreset::Shake` | 500 ms | Se sacude de lado a lado: una contraseña incorrecta, un campo no válido. |
| `headShake` | `MotionPreset::HeadShake` | 800 ms | Niega con la cabeza: un no más suave. |
| `wiggle` | `MotionPreset::Wiggle` | 600 ms | Se menea alrededor de su centro: algo que conviene notar. |
| `swing` | `MotionPreset::Swing` | 900 ms | Se balancea desde su borde superior, como un cartel. |
| `pulse` | `MotionPreset::Pulse` | 500 ms | Crece un poco y vuelve: un énfasis suave. |
| `heartbeat` | `MotionPreset::Heartbeat` | 900 ms | Late dos veces, como un corazón: un me gusta, un favorito. |
| `rubberBand` | `MotionPreset::RubberBand` | 800 ms | Se comprime y se estira como goma. |
| `jello` | `MotionPreset::Jello` | 800 ms | Tiembla como gelatina. |
| `tada` | `MotionPreset::Tada` | 900 ms | Se encoge y luego crece con un meneo: una recompensa. |
| `jump` | `MotionPreset::Jump` | 700 ms | Salta y aterriza aplastándose. |
| `flash` | `MotionPreset::Flash` | 800 ms | Parpadea, apagándose y encendiéndose dos veces. |

**Bucle**: se repiten hasta que se detienen.

| TSX | Rust | Duración | Descripción |
|---|---|---|---|
| `spin` | `MotionPreset::Spin` | 1000 ms | Da una vuelta, para siempre. |
| `float` | `MotionPreset::Float` | 1500 ms | Flota arriba y abajo, para siempre. |
| `breathe` | `MotionPreset::Breathe` | 1800 ms | Respira: crece y se desvanece un poco, para siempre. |
| `sway` | `MotionPreset::Sway` | 1600 ms | Se mece alrededor de su centro, para siempre. |
| `bob` | `MotionPreset::Bob` | 1000 ms | Cabecea como una pelota que rebota, para siempre. |
| `glow` | `MotionPreset::Glow` | 2000 ms | Brilla y se apaga, para siempre. |

`play` aplica sobre un preset sus opciones de temporización (`m.play("shake", { duration: 300 })`), y un preset se expande dentro de un motion propio (`m.play({ ...motions.fadeInUp, duration: 600 })`). En Rust, cambia el spec de un preset: `MotionPreset::FadeInUp.spec().timing(|t| t.delay(100.0))`.

<a id="motions-of-your-own"></a>

### Motions propios

Un motion propio consiste en keyframes por canal y una única temporización (las opciones de los [keyframes](#keyframes)). En TSX, escribe los keyframes de cada canal (`{ opacity: [0, 1] }`), o una lista de fotogramas como los escribe la Web Animations API (`[{ opacity: 0, translateY: 24 }, { opacity: 1, translateY: 0 }]`), cada fotograma con su `offset` y su `easing`. En una lista de fotogramas, un fotograma sin offset se sitúa donde lo coloca su posición en la lista, y un canal sigue los fotogramas que lo nombran. Los ángulos pueden ser cadenas (`"45deg"`, `"0.5turn"`). En Rust, construye un `MotionSpec`.

```rust tabs
let rise = MotionSpec::new(KeyframeTiming::new(400.0))
    .values(MotionChannel::Opacity, [0.0, 1.0])
    .track(
        MotionChannel::TranslateY,
        [Keyframe::at(0.0, 24.0).ease(Easing::EaseOut), Keyframe::at(1.0, 0.0)],
    );
card.play(rise);

let flip = MotionSpec::new(KeyframeTiming::new(600.0).infinite())
    .values(MotionChannel::RotateY, [0.0, 180.0, 360.0]);
card.play(flip);
```

```tsx tabs
// Channels' keyframes.
card.play({
  duration: 400,
  keyframes: { opacity: [0, 1], translateY: [{ value: 24, easing: "easeOut" }, 0] },
});

// A list of frames.
card.play({
  duration: 400,
  keyframes: [
    { opacity: 0, translateY: 24, easing: "easeOut" },
    { opacity: 1, translateY: 0 },
  ],
});

card.play({ duration: 600, iterations: "infinite", keyframes: { rotateY: ["0deg", "180deg", "360deg"] } });
```

<a id="entrances-and-staggered-lists"></a>

### Entradas y listas escalonadas

Dale a cada fila un motion de entrada, con un retraso que crece con su índice: las filas que aparecen a la vez entran una tras otra. Limita el retraso para que una fila añadida al final de la lista no tenga que esperar.

```rust tabs
each(items, |item: &Item| item.id, |item, index| {
    let delay = index.get_untracked().min(10) as f32 * 60.0;
    let row = motion().entering(MotionPreset::FadeInUp.spec().timing(|t| t.delay(delay)));
    view()
        .rounded_xl()
        .bg(ZINC.shade(100))
        .p_4()
        .bind_motion(&row)
        .child(text(move || item.get().title))
})
```

```tsx tabs
function Row(props: { title: string; index: number }) {
  const row = createMotion({ enter: "fadeInUp", delay: Math.min(props.index, 10) * 60 });
  return (
    <View class="rounded-xl bg-zinc-100 p-4" style={row.style}>
      <Text>{props.title}</Text>
    </View>
  );
}

<Each of={items()} key={(item) => item.id}>
  {(item, index) => <Row title={item().title} index={index()} />}
</Each>
```

Los motions también se componen: `m.animation(..)` es un motion como [animación compuesta](#composite-animations), sin iniciar, así que `Animated.stagger` ejecuta de forma nativa un grupo de ellos, contando desde el primer elemento, el último, el centro o cualquier índice. Dales un `initial` oculto (o haz que empiecen donde empieza el motion) para que no se vea nada antes de su turno.

```rust tabs
let cards: Vec<Motion> = (0..5)
    .map(|_| {
        let m = motion();
        m.value(MotionChannel::Opacity).set(0.0);
        m
    })
    .collect();
Animation::stagger_from(60.0, StaggerFrom::Center, cards.iter().map(|m| m.animation(MotionPreset::FadeInUp))).start();
```

```tsx tabs
const cards = [0, 1, 2, 3, 4].map(() => createMotion({ initial: { opacity: 0 } }));
Animated.stagger(60, cards.map((m) => m.animation("fadeInUp")), { from: "center" }).start();
```

<a id="exits"></a>

### Salidas

Reproduce la salida, espera a que termine y después elimina la vista. Una [animación de layout](#layoutanimation) permite que las vistas de alrededor cierren el hueco.

```rust tabs
let remove = move || {
    spawn(async move {
        row.play(MotionPreset::FadeOutLeft).await;
        animate_layout(LayoutAnimation::EASE_IN_EASE_OUT);
        items.update(|items| items.retain(|i| i.id != id));
    });
};
```

```tsx tabs
const remove = async () => {
  await row.play("fadeOutLeft");
  LayoutAnimation.easeInEaseOut();
  items.set(items().filter((i) => i.id !== id));
};
```

Los motions respetan por sí solos el ajuste de [movimiento reducido](#reduced-motion) del usuario: cuando el usuario pide menos movimiento, un motion llega de inmediato a donde termina, sin moverse.

<a id="transitions"></a>

## Transiciones

Indica qué animar y durante cuánto tiempo (`.transition_all().duration(400.0)` en Rust, `transitionProperty` y `transitionDuration` en TSX), y los cambios posteriores en esas propiedades se animan de forma nativa desde lo que hay en pantalla hasta el nuevo valor.

```rust tabs
#[component]
pub fn App() -> impl IntoElement {
    let on = signal(false);
    view().flex_1().items_center().justify_center().child(
        view()
            .on_press(move || on.update(|on| *on = !*on))
            .size(px(100.0))
            .rounded(move || px(if on.get() { 50.0 } else { 16.0 }))
            .bg(move || if on.get() { rgb(0x8250df) } else { rgb(0x0969da) })
            .rotate(move || deg(if on.get() { 45.0 } else { 0.0 }))
            .scale(move || if on.get() { 1.2_f32 } else { 1.0 })
            .transition_all()
            .duration(400.0)
            .ease_in_out(),
    )
}
```

```tsx tabs
import { mount, signal, View } from "nsh";

function App() {
  const on = signal(false);
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <View
        onPress={() => on.set(!on())}
        style={{
          width: 100,
          height: 100,
          borderRadius: on() ? 50 : 16,
          backgroundColor: on() ? "#8250df" : "#0969da",
          rotate: on() ? "45deg" : "0deg",
          scale: on() ? 1.2 : 1,
          transitionProperty: "all",
          transitionDuration: 400,
          transitionTimingFunction: "ease-in-out",
        }}
      />
    </View>
  );
}

mount(App);
```

| Estilo | Rust | Tipo | Descripción |
|---|---|---|---|
| `transitionProperty` | `.transition()`, `.transition_all()`, `.transition_colors()`, `.transition_opacity()`, `.transition_transform()`, `.transition_shadow()` | `string` | Qué se anima, separado por comas: `"all"`, `"colors"`, `"opacity"`, `"transform"`, `"box-shadow"`, `"border-radius"`, ... |
| `transitionDuration` | `.duration(ms)` | `number \| "150ms" \| "0.2s"` | Milisegundos como número, o un tiempo CSS. |
| `transitionDelay` | `.delay(ms)` | `number \| "150ms" \| "0.2s"` | Antes de empezar. |
| `transitionTimingFunction` | `.ease_linear()`, `.ease_in()`, `.ease_out()`, `.ease_in_out()`, `.ease_bezier(..)` | `"linear" \| "ease" \| "ease-in" \| "ease-out" \| "ease-in-out" \| "cubic-bezier(…)"` | La curva. |

Propiedades que admiten transición, por grupos: **colores** (colores de fondo, borde, contorno, sombra y texto, y paradas de degradado), **opacidad**, **transformación**, **sombras** (`box-shadow`) y **forma** (radio y ancho del borde). Funcionan tanto los nombres CSS como sus formas en camel case (`background-color`, `backgroundColor`, `transform`, `scale`, ...). Los cambios de layout se animan con [animaciones de layout](#layoutanimation).

Con Tailwind, lo mismo es `transition` (colores, opacidad, sombras y transformaciones), `transition-all`, `transition-colors`, `transition-opacity`, `transition-transform`, `transition-shadow`, con `duration-*`, `delay-*` y `ease-*`. Combinado con el estado pulsado (`.active(..)`, `active:`) da estados pulsados animados:

```rust tabs
view()
    .on_press(save)
    .rounded_xl()
    .bg(BLUE.shade(600))
    .px_5()
    .py_3()
    .transition()
    .duration(150.0)
    .active(|s| s.scale(0.95).bg(BLUE.shade(800)))
    .child(text("Save").font_weight(FontWeight::SEMIBOLD).text_color(white()))
```

```tsx tabs
<View onPress={save} class="rounded-xl bg-blue-600 px-5 py-3 transition duration-150 active:scale-95 active:bg-blue-800">
  <Text class="font-semibold text-white">Save</Text>
</View>
```

Una transición parte del valor que hay actualmente en pantalla, de modo que si se cambia de nuevo el destino a mitad de camino, el giro es suave.

<a id="keyframe-animations"></a>

## Animaciones de keyframes

Cuatro animaciones de keyframes integradas se ejecutan de forma nativa, para siempre por defecto: `spin` (una vuelta en sentido horario), `ping` (se escala hasta 2× y se desvanece), `pulse` (se atenúa hasta la mitad de su opacidad y vuelve) y `bounce` (salta hacia arriba un cuarto de su altura y aterriza).

```rust tabs
view()
    .size_8()
    .rounded_full()
    .border(px(4.0))
    .border_color(ZINC.shade(300))
    .border_t_color(BLUE.shade(600))
    .animate_spin()
view().h_4().w_40().rounded(px(4.0)).bg(ZINC.shade(200)).animate_pulse()
```

```tsx tabs
<View class="size-8 rounded-full border-4 border-zinc-300 border-t-blue-600 animate-spin" />
<View class="h-4 w-40 rounded bg-zinc-200 animate-pulse" />
```

| Estilo | Rust | Tipo | Descripción |
|---|---|---|---|
| `animationName` | `.animate_spin()`, `.animate_ping()`, `.animate_pulse()`, `.animate_bounce()`, `.animate_none()` o `.animation(KeyframeAnimation::new(Keyframes::Spin))` | `"none" \| "spin" \| "ping" \| "pulse" \| "bounce"` | La animación. |
| `animationDuration` | `KeyframeAnimation::duration(ms)` | `number \| "1s" \| …` | Una iteración. |
| `animationDelay` | `KeyframeAnimation::delay(ms)` | `number \| "200ms" \| …` | Antes de empezar. |
| `animationTimingFunction` | `KeyframeAnimation::easing([x1, y1, x2, y2])` | como `transitionTimingFunction` | La curva. |
| `animationIterationCount` | `KeyframeAnimation::iterations(n)` | `number \| "infinite"` | Por defecto `"infinite"`. |

Tailwind: `animate-spin`, `animate-ping`, `animate-pulse`, `animate-bounce`, `animate-none`.

<a id="animated-values"></a>

## Valores animados

Un valor animado es un número que vive en el hilo de UI. Crea uno (`animated_value(..)` en Rust, `createAnimatedValue` de `nsh` en TSX), vincúlalo a estilos y anímalo; las vistas vinculadas lo siguen en cada fotograma sin necesidad de una actualización.

```rust tabs
#[component]
pub fn App() -> impl IntoElement {
    let x = animated_value(0.0);
    let opacity = animated_value(1.0);
    let play = move || {
        spawn(async move {
            x.timing(240.0, 600.0, Easing::Curve(Curve::Cubic, EaseMode::Out)).await;
            opacity.timing(0.3, 200.0, Easing::EaseInOut).await;
            x.spring(0.0, Spring::default());
            opacity.timing_with(1.0, Timing::default());
        });
    };
    view()
        .flex_1()
        .justify_center()
        .p_6()
        .gap_6()
        .child(
            view()
                .size(px(60.0))
                .rounded(px(12.0))
                .bg(rgb(0x0969da))
                .bind_opacity(&opacity)
                .bind_translate_x(&x),
        )
        .child(view().on_press(play).child(text("Play").text_color(rgb(0x0969da))))
}
```

```tsx tabs
import { mount, Text, View } from "nsh";
import { createAnimatedValue, Easing } from "nsh";

function App() {
  const x = createAnimatedValue(0);
  const opacity = createAnimatedValue(1);
  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 24, gap: 24 }}>
      <View style={{ width: 60, height: 60, borderRadius: 12, backgroundColor: "#0969da", opacity, translate: [x, 0] }} />
      <View
        onPress={async () => {
          await x.timing(240, { duration: 600, easing: Easing.out(Easing.cubic) });
          await opacity.timing(0.3, { duration: 200 });
          x.spring(0);
          opacity.timing(1);
        }}
      >
        <Text style={{ color: "#0969da" }}>Play</Text>
      </View>
    </View>
  );
}

mount(App);
```

**Qué se puede vincular:** `opacity` (`.bind_opacity(..)`); `backgroundColor`, `borderColor` (todos los lados) y el `color` de un texto (el texto completo), mediante una interpolación a colores (`.bind_background(..)`, `.bind_border_color(..)`, `.bind_color(..)`); `translate` (`[x, y]`, un valor por eje), `rotate` (grados) y `scale` (`[x, y]` por eje, o un valor para ambos); y los pasos de una lista `transform`: `translateX`, `translateY`, `scale`, `scaleX`, `scaleY`, `rotate`, `rotateX`, `rotateY` y `rotateZ` (`.bind_translate_x(..)`, `.bind_translate_y(..)`, `.bind_scale(..)`, `.bind_rotate(..)` en grados, `.bind_transform(kind, ..)` en Rust). Las sombras cambian con [transiciones](#transitions). Un anillo de foco o un precio que parpadea en verde es una interpolación de color vinculada al color del borde o del texto:

```rust tabs
let flash = animated_value(0.0);
let color = flash.interpolate_colors(&[0.0, 1.0], &[rgb(0x1f2328), rgb(0x1a7f37)]);

text(move || price.get().to_string()).bind_color(&color)
// On a new price: flash.set(1.0); flash.timing(0.0, 600.0, Easing::EaseInOut);
```

```tsx tabs
const flash = createAnimatedValue(0);
const color = flash.interpolate({ inputRange: [0, 1], outputRange: ["#1f2328", "#1a7f37"] });

<Text style={{ color }}>{price()}</Text>
// On a new price: flash.set(1); flash.timing(0, { duration: 600 });
```

Los valores animados también dirigen [dibujos en canvas](./canvas.md#driving-drawings-with-animated-values), reciben desplazamientos de scroll ([`scrollValue`](./scrolling.md#scroll-linked-effects-scrollvalue)) y gestos ([`pan`, `pinch`, `rotation`](./touch-and-gestures.md#native-gestures-pan-pinch-and-rotation)).

El valor se mantiene vivo gracias a las vistas vinculadas a él y al componente que lo creó, de modo que un vínculo permanece conectado aunque tus variables vayan y vengan. Crea los valores animados en el componente que los posee (no a nivel de módulo cuando cada instancia necesita el suyo).
<a id="animatedvalue-methods"></a>

### Métodos de AnimatedValue

| TSX | Rust | Descripción |
|---|---|---|
| `set(value)` | `set(value)` | Salta a `value` y detiene cualquier animación. |
| `stop()` | `stop()` | Detiene la animación en curso donde está; en TSX, se resuelve con `{ value }`, el valor en ese punto. |
| `getValue()` | `value()` | El valor actual, leído en el hilo de UI donde se mueve (se asienta en un frame): una promesa en TSX, una respuesta que se puede esperar con await en Rust. |
| `setOffset(offset)` | `set_offset(offset)` | Suma `offset` a lo que muestra el valor: los bindings ven valor + offset, mientras que `set`, las animaciones y los arrastres mueven el valor. |
| `flattenOffset()` | `flatten_offset()` | Suma el offset al valor y deja el offset en 0. |
| `extractOffset()` | `extract_offset()` | Mueve el valor al offset y deja el valor en 0: un arrastre empieza entonces desde 0, encima de donde terminó el anterior. |
| `timing(to, { duration?, easing?, delay? })` | `timing(to, ms, easing)`, `timing_with(to, Timing { .. })` | Anima hasta `to` durante `duration` ms (300 por defecto, easing `"easeInOut"`). |
| `spring(to, { stiffness?, damping?, mass?, velocity? })` | `spring(to, Spring { .. })` | Anima con un resorte hasta `to` (valores por defecto: stiffness 170, damping 26, mass 1). |
| `decay({ velocity?, deceleration?, clamp?, bounce? })` | `decay(velocity, deceleration)`, `decay_within(velocity, deceleration, (min, max), bounce)` | Avanza por inercia desde `velocity` (unidades por segundo) y va frenando (deceleration 0.998 por ms por defecto). Con un clamp de `[min, max]` se detiene en un límite, o rebota desde él conservando `bounce` (0..1) de su velocidad. |

Cada animación da una respuesta que puedes esperar con await, la de si terminó: `true` cuando se reprodujo hasta el final, `false` cuando algo la detuvo (`stop()`, `set()` o una nueva animación sobre el mismo valor). Es un `Promise<{ finished: boolean }>` en TSX y un `AnimationEnd` en Rust, que una tarea espera con `bool`. Iniciar una nueva animación sobre un valor en movimiento interrumpe la anterior con suavidad: un resorte o un decay sin velocidad continúa con la velocidad actual del valor.

```rust tabs
// Spring settings: lower damping overshoots more, higher stiffness is faster.
x.spring(200.0, Spring { stiffness: 180.0, damping: 8.0, ..Spring::default() });   // wobbly
x.spring(200.0, Spring { stiffness: 400.0, damping: 30.0, ..Spring::default() });  // stiff, no overshoot

// A fling that coasts to a stop, from a pan's release velocity.
view().pan_values(Some(&x), None).on_pan_end(move |e: &PanEvent| {
    x.decay(Some(e.velocity_x), 0.998);
})

// A fling that stays on its track and bounces softly off its ends.
x.decay_within(Some(e.velocity_x), 0.998, (0.0, 300.0), 0.3);

// Where a value is now (it moves on the UI thread, so the answer is async).
let at = x.value().await;
```

```tsx tabs
// Spring settings: lower damping overshoots more, higher stiffness is faster.
x.spring(200, { stiffness: 180, damping: 8 });   // wobbly
x.spring(200, { stiffness: 400, damping: 30 });  // stiff, no overshoot

// A fling that coasts to a stop, from a pan's release velocity.
<View pan={{ x }} onPanEnd={(e) => x.decay({ velocity: e.velocity.x })} />

// A fling that stays on its track and bounces softly off its ends.
x.decay({ velocity: e.velocity.x, clamp: [0, 300], bounce: 0.3 });

// Where a value is now (it moves on the UI thread, so the answer is async).
const where = await x.getValue();
```

### Keyframes

`keyframes` reproduce un valor a través de keyframes como lo hacen los keyframes de CSS: `value.keyframes(frames, options)` en TSX, `value.keyframes(frames, KeyframeTiming)` en Rust (`Animated.keyframes(value, { keyframes, ... })` y `Animation::keyframes(..)` como un paso de una [animación compuesta](#composite-animations)). Un keyframe es un número (o una cadena de ángulo como `"90deg"`), repartido de forma uniforme con los demás, o `{ offset, value, easing }` (`Keyframe::new(value)`, `Keyframe::at(offset, value)`, `.ease(easing)` en Rust).

```rust tabs
let y = animated_value(0.0);
y.keyframes(
    [Keyframe::new(0.0), Keyframe::at(0.3, -20.0).ease(Easing::EaseIn), Keyframe::new(0.0)],
    KeyframeTiming::new(600.0).easing(Easing::EaseOut).iterations(Some(3)),
);

// A clock hand that ticks once a second.
let hand = animated_value(0.0);
hand.keyframes(
    [Keyframe::new(0.0), Keyframe::new(360.0)],
    KeyframeTiming::new(60_000.0).easing(Easing::Steps(60, StepPosition::JumpEnd)).infinite(),
);
```

```tsx tabs
const y = createAnimatedValue(0);
y.keyframes([0, { offset: 0.3, value: -20, easing: "easeIn" }, 0], { duration: 600, easing: "easeOut", iterations: 3 });

// A clock hand that ticks once a second.
const hand = createAnimatedValue(0);
hand.keyframes([0, 360], { duration: 60_000, easing: Easing.steps(60), iterations: "infinite" });
```

| Opción | Rust (`KeyframeTiming`) | Por defecto | Descripción |
|---|---|---|---|
| `duration` | `KeyframeTiming::new(ms)` | 300 | Una iteración, en milisegundos. |
| `delay` | `.delay(ms)` | 0 | Antes de la primera iteración. |
| `easing` | `.easing(easing)` | CSS `ease` | La curva de cada segmento que no tiene un easing propio. |
| `iterations` | `.iterations(Some(n))`, `.infinite()` | 1 | Cuántas iteraciones, o `"infinite"`. |
| `direction` | `.direction(PlaybackDirection::Alternate)` | `"normal"` | `"normal"`, `"reverse"`, `"alternate"` o `"alternate-reverse"`. |

Se reproducen como en CSS y la Web Animations API:

- Un easing da forma a cada segmento, no al conjunto: el `easing` de un keyframe da forma al segmento que empieza en él, y el `easing` del timing a todos los demás segmentos.
- Los keyframes sin offset se reparten de forma uniforme entre sus vecinos; el primero toma 0 por defecto y el último 1.
- Cada iteración empieza con un salto a su primer keyframe. Sin un keyframe en el offset 0, el valor parte de donde está.
- Durante un `delay`, el valor ya tiene el primer keyframe (CSS `animation-fill-mode: backwards`), de modo que una entrada retrasada muestra su primer frame en lugar de la vista en reposo. Esto también vale para los motions.
- `reverse` y las iteraciones hacia atrás de `alternate` recorren los segmentos al revés, cada uno con su curva invertida.
- El valor se queda donde lo deja la última iteración. La respuesta indica si terminaron: `true` cuando lo hicieron, `false` cuando algo las detuvo.

<a id="interpolation"></a>

### Interpolación

`interpolate` asigna un valor, mediante segmentos lineales por tramos, a números, colores o ángulos, y devuelve un nuevo nodo que puedes enlazar. Un mismo valor puede controlar muchas propiedades. En Rust, `interpolate(&input, &output)` asigna a números, `interpolate_colors(&input, &colors)` a colores, y `interpolate_with(&input, output, Interpolation { .. })` recibe la extrapolación y el easing; en TSX, `value.interpolate({ inputRange, outputRange })` los recibe todos.

```rust tabs
let t = animated_value(0.0);

view()
    .bind_background(&t.interpolate_colors(&[0.0, 1.0, 2.0], &[rgb(0x54aeff), rgb(0x8250df), rgb(0xcf222e)]))
    .bind_opacity(&t.interpolate(&[0.0, 1.0], &[0.4, 1.0]))
    .bind_rotate(&t.interpolate(&[0.0, 1.0], &[0.0, 180.0]))
    .bind_scale(&t.interpolate_with(
        &[0.0, 1.0],
        AnimationOutput::Numbers(vec![0.6, 1.2]),
        Interpolation {
            easing: Easing::Curve(Curve::Back(1.70158), EaseMode::Out),
            ..Interpolation::default()
        },
    ))
```

```tsx tabs
const t = createAnimatedValue(0);

<View
  style={{
    backgroundColor: t.interpolate({ inputRange: [0, 1, 2], outputRange: ["#54aeff", "#8250df", "#cf222e"] }),
    opacity: t.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }),
    rotate: t.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "180deg"] }),
    scale: t.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.2], easing: Easing.out(Easing.back()) }),
  }}
/>
```

| Opción | Rust | Descripción |
|---|---|---|
| `inputRange` | el slice de entrada | Puntos de entrada crecientes. |
| `outputRange` | el slice de salida, o `AnimationOutput` | Una salida por punto: números, colores (`"#rrggbb"`, `"rgba(…)"`, con nombre) o ángulos (`"45deg"`, `"1rad"`). |
| `extrapolate` | `Interpolation::extrapolate(Extrapolate::Extend)` | Fuera del rango de entrada: `"clamp"` (por defecto), `"extend"` (continúa los segmentos de los extremos) o `"identity"` (pasa la entrada tal cual). |
| `extrapolateLeft`, `extrapolateRight` | `extrapolate_left`, `extrapolate_right` | Lo mismo, para un solo lado. |
| `easing` | `easing` | Da forma a cada segmento. |

> [!IMPORTANT]
> Las interpolaciones hacen **clamp** por defecto: fuera del rango de entrada, la salida se queda en el extremo más cercano. Por tanto, tirar de una scroll view más allá de su parte superior mantiene un encabezado vinculado al scroll en su estado final. Pasa `extrapolate: "extend"` (`Extrapolate::Extend`) cuando quieras que la línea continúe.

<a id="arithmetic-and-diffclamp"></a>

### Aritmética y diffClamp

Los nodos se combinan con aritmética, también de forma nativa: `a.add(b)`, `a.sub(b)`, `a.mul(b)`, `a.div(b)`, `a.mod(b)` (`a.modulo(b)` en Rust; nunca negativo para un `b` positivo, p. ej. ángulos en 0..360), donde `b` es un nodo o un número. En TSX, `Animated.add`, `subtract`, `multiply`, `divide` y `modulo` son lo mismo en forma de funciones.

`diffClamp(min, max)` (`diff_clamp`) sigue los *cambios* del nodo mientras permanece dentro de `min..max`. Aplicado a un offset de scroll, produce un encabezado que se oculta cuando el contenido se desplaza hacia arriba y vuelve en cuanto se desplaza hacia abajo:

```rust tabs
let offset = animated_value(0.0);
let header = offset.diff_clamp(0.0, 56.0);

scroll().flex_1().scroll_value(&offset)
view().absolute().top_0().left_0().right_0().h(px(56.0)).bind_translate_y(&header.mul(-1.0))
```

```tsx tabs
const scroll = createAnimatedValue(0);
const header = scroll.diffClamp(0, 56);

<Scroll style={{ flex: 1 }} scrollValue={scroll}>…</Scroll>
<View style={{ position: "absolute", top: 0, left: 0, right: 0, height: 56, translate: [0, header.mul(-1)] }}>…</View>
```

Con `{ snap: true }` (`diff_clamp_with(min, max, DiffClamp::snapping())`), un encabezado que queda parcialmente visible cuando el scroll se detiene completa el movimiento: se asienta totalmente visible o totalmente oculto, lo que quede más cerca, en 200 ms en el hilo de UI. Solo se oculta una vez que la página se ha desplazado al menos su altura, así que una página desplazada menos que eso muestra el encabezado completo. Si se vuelve a hacer scroll durante el movimiento, este continúa desde donde está el encabezado.

```rust tabs
let header = offset.diff_clamp_with(0.0, 56.0, DiffClamp::snapping());
```

```tsx tabs
const header = scroll.diffClamp(0, 56, { snap: true });
```

<a id="composite-animations"></a>

## Animaciones compuestas

Las animaciones se construyen a partir de pasos (`Animation` en Rust, `Animated` de `nsh` en TSX) y todo el árbol se ejecuta de forma nativa: cada paso empieza en el hilo de UI en el instante en que termina el anterior, sin pausa y sin nada de tu código entre ambos.

```rust tabs
let ys: Vec<AnimatedValue> = (0..5).map(|_| animated_value(0.0)).collect();
let fade = animated_value(1.0);

let hop = Animation::stagger(
    80.0,
    ys.iter().map(|y| {
        Animation::sequence([
            Animation::timing(y, -30.0, Timing::new(200.0, Easing::Curve(Curve::Quad, EaseMode::Out))),
            Animation::spring(y, 0.0, Spring { stiffness: 300.0, damping: 12.0, ..Spring::default() }),
        ])
    }),
);

let breathe = Animation::sequence([
    Animation::timing(&fade, 0.3, Timing::new(400.0, Easing::EaseInOut)),
    Animation::timing(&fade, 1.0, Timing::new(400.0, Easing::EaseInOut)),
])
.looped(None);

let landed = hop.start();
spawn(async move {
    status.set(if landed.await { "landed" } else { "stopped" });
});
```

```tsx tabs
import { Animated, createAnimatedValue, Easing } from "nsh";

const ys = [0, 1, 2, 3, 4].map(() => createAnimatedValue(0));
const fade = createAnimatedValue(1);

const hop = Animated.stagger(
  80,
  ys.map((y) =>
    Animated.sequence([
      Animated.timing(y, { toValue: -30, duration: 200, easing: Easing.out(Easing.quad) }),
      Animated.spring(y, { toValue: 0, stiffness: 300, damping: 12 }),
    ]),
  ),
);

const breathe = Animated.loop(
  Animated.sequence([
    Animated.timing(fade, { toValue: 0.3, duration: 400 }),
    Animated.timing(fade, { toValue: 1, duration: 400 }),
  ]),
);

hop.start(({ finished }) => console.log(finished ? "landed" : "stopped"));
```

| TSX | Rust | Descripción |
|---|---|---|
| `Animated.timing(value, { toValue, duration?, easing?, delay? })` | `Animation::timing(&value, to, Timing { .. })` | Un paso de timing. |
| `Animated.spring(value, { toValue, stiffness?, damping?, mass?, velocity? })` | `Animation::spring(&value, to, Spring { .. })` | Un paso de resorte. |
| `Animated.decay(value, { velocity?, deceleration?, clamp?, bounce? })` | `Animation::decay(&value, velocity, deceleration)`, `Animation::decay_within(..)` | Un paso de decay. |
| `Animated.sequence(list)` | `Animation::sequence(list)` | Uno tras otro. |
| `Animated.parallel(list, { stopTogether? })` | `Animation::parallel(list)`, `.stop_together(..)` | Todos a la vez. |
| `Animated.stagger(ms, list, { from? })` | `Animation::stagger(ms, list)`, `Animation::stagger_from(ms, StaggerFrom::Center, list)` | Todos a la vez, cada uno empezando `ms` después del anterior, contando desde `from`: `"first"` (por defecto), `"last"`, `"center"` (una onda que se expande desde el centro) o un índice (`StaggerFrom::First`, `Last`, `Center`, `Index(i)`). |
| `Animated.keyframes(value, { keyframes, ...timing })` | `Animation::keyframes(&value, frames, KeyframeTiming)` | Un paso de [keyframes](#keyframes). |
| `Animated.delay(ms)` | `Animation::delay(ms)` | Espera. |
| `Animated.loop(animation, { iterations?, resetBeforeIteration? })` | `.looped(iterations)`, `.reset_before_iteration(..)` | Repite (indefinidamente por defecto; `None` en Rust). |

Una animación compuesta tiene `start()` (en TSX también con un callback y una promesa, ambos reciben `{ finished }`; en Rust un `bool` que se puede esperar; volver a llamarla la ejecuta de nuevo), `stop()` (se detiene donde está) y `reset()` (se detiene y devuelve sus valores a donde estaban cuando empezó). El callback se ejecuta una vez para todo el árbol.

Una animación en curso no mantiene vivos sus valores: cuando desaparece el componente que los posee (sus vistas y variables), un bucle infinito se detiene con él, y su respuesta es que no terminó (`false`).

## Easing

Las curvas de easing son datos, evaluados de forma nativa: `Easing` de `nsh` en TSX, el enum `Easing` en Rust.

| TSX | Rust | Descripción |
|---|---|---|
| `Easing.linear`, `Easing.ease` | `Easing::Linear`, `Easing::Bezier(0.25, 0.1, 0.25, 1.0)` | Velocidad constante; el `ease` de CSS. |
| `Easing.quad`, `Easing.cubic`, `Easing.poly(n)` | `Curve::Quad`, `Curve::Cubic`, `Curve::Poly(n)` | `t²`, `t³`, `tⁿ`. |
| `Easing.sin`, `Easing.circle`, `Easing.exp` | `Curve::Sin`, `Curve::Circle`, `Curve::Exp` | Sinusoidal, circular, exponencial. |
| `Easing.back(s?)` | `Curve::Back(s)` | Retrocede antes de avanzar (overshoot `s`, 1.70158 por defecto). |
| `Easing.elastic(bounciness?)` | `Curve::Elastic(bounciness)` | Rebase elástico. |
| `Easing.bounce` | `Curve::Bounce` | Rebota al final. |
| `Easing.bezier(x1, y1, x2, y2)` | `Easing::Bezier(x1, y1, x2, y2)` | Una curva Bézier cúbica, como en CSS. |
| `Easing.steps(count, position?)` | `Easing::Steps(count, StepPosition::JumpEnd)` | Salta entre `count` niveles en lugar de moverse, como `steps()` de CSS: un sprite fotograma a fotograma, una manecilla que hace tic. `position` es `"jump-end"` (por defecto, también `"end"`), `"jump-start"` (`"start"`), `"jump-none"` o `"jump-both"`. |
| `Easing.in(e)`, `Easing.out(e)`, `Easing.inOut(e)` | `Easing::Curve(curve, EaseMode::In)`, `EaseMode::Out`, `EaseMode::InOut` | Las curvas son curvas "in"; `out` y `inOut` les dan la vuelta. |

En TSX, en cualquier lugar donde se acepte un easing también puedes pasar un nombre (`"linear"`, `"ease"`, `"easeIn"`, `"easeOut"`, `"easeInOut"`) o un array Bézier `[x1, y1, x2, y2]`; en Rust, `Easing::EaseIn`, `Easing::EaseOut` y `Easing::EaseInOut` son las curvas de CSS.

```rust tabs
x.timing(1.0, 300.0, Easing::Curve(Curve::Back(1.70158), EaseMode::Out));
x.timing(1.0, 300.0, Easing::EaseOut);
x.timing(1.0, 300.0, Easing::Bezier(0.2, 0.8, 0.2, 1.0));
```

```tsx tabs
x.timing(1, { easing: Easing.out(Easing.back()) });
x.timing(1, { easing: "easeOut" });
x.timing(1, { easing: [0.2, 0.8, 0.2, 1] });
```

`Easing.sample(easing, count)` (`sample_easing` en Rust) devuelve la curva en `count` puntos equidistantes de 0 a 1, y `Animated.sampleSpring(config, fps?)` / `Animated.sampleDecay(config, fps?)` (`sample_spring`, `sample_decay`) los valores por los que pasa un resorte o un decay, uno por frame (60 por segundo por defecto) desde `config.from` (0) hasta que termina. Los calcula el mismo código nativo con el que se ejecutan las animaciones, así que un gráfico de una curva muestra exactamente lo que hace la animación:

```rust tabs
use nsh_core::element::{sample_easing, sample_spring};

let curve = sample_easing(Easing::Curve(Curve::Back(1.70158), EaseMode::Out), 50); // 50 progress values
let spring = sample_spring(0.0, 1.0, Spring { stiffness: 180.0, damping: 8.0, ..Spring::default() }, 60.0);
```

```ts tabs
const curve = Easing.sample(Easing.out(Easing.back()), 50); // 50 progress values
const spring = Animated.sampleSpring({ toValue: 1, stiffness: 180, damping: 8 });
```

## LayoutAnimation

Una layout animation anima de forma nativa los cambios de frame de la **siguiente** actualización: las vistas que se mueven o cambian de tamaño se deslizan a sus nuevos frames, las vistas nuevas aparecen con un fundido (o con escala) y las vistas eliminadas se desvanecen. Llámala justo antes del cambio de estado: `animate_layout(..)` en Rust, `LayoutAnimation.configureNext(config)` en TSX.

```rust tabs
use nsh_core::element::LayoutAnimation;

let items = signal(vec![1, 2, 3]);
let next = stored(4);

let add = move || {
    animate_layout(LayoutAnimation::SPRING);
    let n = next.with(|n| {
        *n += 1;
        *n - 1
    });
    items.update(|i| i.insert(0, n));
};
let remove = move || {
    animate_layout(LayoutAnimation::EASE_IN_EASE_OUT);
    items.update(|i| {
        i.remove(0);
    });
};
```

```tsx tabs
import { signal } from "nsh";
import { LayoutAnimation } from "nsh";

const items = signal([1, 2, 3]);
let next = 4;

const add = () => {
  LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
  items.set([next++, ...items()]);
};
const remove = () => {
  LayoutAnimation.easeInEaseOut();
  items.set(items().slice(1));
};
```

| TSX | Rust | Descripción |
|---|---|---|
| `configureNext(config, onEnd?)` | `animate_layout(config)` | Anima los cambios del siguiente commit; en TSX, `onEnd` se ejecuta al terminar. |
| `create(duration, type?, property?)` | `LayoutAnimation::all(LayoutTransition::new(curve, ms))` | Una configuración con una sola curva para las tres fases. |
| `Presets.easeInEaseOut`, `Presets.linear`, `Presets.spring` | `LayoutAnimation::EASE_IN_EASE_OUT`, `LINEAR`, `SPRING` | Configuraciones predefinidas. |
| `easeInEaseOut(onEnd?)`, `linear(onEnd?)`, `spring(onEnd?)` | `animate_layout` con un preset | `configureNext` con un preset. |
| `Types`, `Properties` | `LayoutCurve`, `LayoutProperty` | Los nombres, para construir configuraciones. |

Una configuración es `{ duration, create?, update?, delete? }` (`LayoutAnimation { create, update, delete }` en Rust): `create` para las vistas insertadas, `update` para las movidas o redimensionadas, `delete` para las eliminadas. Cada fase es `{ type?, property?, duration?, delay?, springDamping? }` (`LayoutTransition { curve, property, duration_ms, delay_ms }`), donde `type` es `"easeInEaseOut"`, `"spring"`, `"linear"`, `"easeIn"`, `"easeOut"` o `"keyboard"` (la curva propia del teclado de software, medida desde que el teclado empezó a moverse, de modo que lo que le hace sitio se mueve con él; `LayoutCurve::Keyboard`), `property` es lo que animan las vistas al aparecer y desaparecer (`"opacity"`, `"scaleXY"`, `"scale"`), y `springDamping` (0..1, 0.7 por defecto; `LayoutCurve::Spring { damping }`) fija el overshoot del resorte.

```rust tabs
use nsh_core::element::{LayoutAnimation, LayoutCurve, LayoutProperty, LayoutTransition};

animate_layout(LayoutAnimation {
    create: Some(LayoutTransition::new(LayoutCurve::EaseOut, 300.0)),
    update: Some(LayoutTransition::new(LayoutCurve::Spring { damping: 0.8 }, 300.0)),
    delete: Some(LayoutTransition {
        property: LayoutProperty::Scale,
        ..LayoutTransition::new(LayoutCurve::EaseIn, 300.0)
    }),
});
```

```tsx tabs
LayoutAnimation.configureNext({
  duration: 300,
  create: { type: "easeOut", property: "opacity" },
  update: { type: "spring", springDamping: 0.8 },
  delete: { type: "easeIn", property: "scaleXY" },
});
```

Una layout animation cubre todos los frames que cambia la actualización, en cualquier parte de la pantalla: una lista que se refresca o datos en vivo que llegan en la misma actualización se mueven con ella. En un componente de Rust, anima solo aquello con lo que se mueve el cambio de un elemento mediante `ElementRef::animate_layout(transition)`: el propio frame del elemento y el de su contenido, y los de las vistas que su tamaño empuja (sus hermanos y los de estos, hasta la pantalla). Los demás frames de la actualización cambian de golpe. Así es como `nsh/base` revela su contenido con `Collapsible` y `AccordionPanel`.

```rust
use nsh_core::element::{LayoutCurve, LayoutTransition};

let region = element_ref();
let open = signal(false);
let toggle = move || {
    region.animate_layout(LayoutTransition::new(LayoutCurve::Spring { damping: 1.0 }, 265.0));
    open.update(|o| *o = !*o);
};
view()
    .element_ref(&region)
    .overflow_hidden()
    .style_with(move |s| if open.get() { s } else { s.h(px(0.0)) })
```

<a id="what-runs-where"></a>

## Qué se ejecuta dónde

| | Se ejecuta en | Tu código por frame |
|---|---|---|
| Transiciones, animaciones de keyframes | Hilo de UI | ninguno |
| Motions, keyframes, `timing` / `spring` / `decay`, composiciones | Hilo de UI | ninguno; tu código se entera cuando terminan |
| `interpolate`, aritmética, `diffClamp` | Hilo de UI | ninguno |
| `scrollValue`, `pan` / `pinch` / `rotation` | Hilo de UI | ninguno; tu código se entera del inicio y del final |
| Layout animations | Hilo de UI | ninguno |
| Bucles de `requestAnimationFrame` (`request_animation_frame` en Rust), manejadores de `onScroll`, `PanResponder` | tu código, y luego una actualización | en cada frame |

Recurre a `requestAnimationFrame` (un global en TSX, que sigue la pantalla) solo para lo que no se puede describir de antemano, como una simulación física en tu código. Todo lo que pueda ser un valor animado debería serlo.

<a id="reduced-motion"></a>

## Movimiento reducido

Cuando el usuario pide menos movimiento (iOS "Reduce Motion", Android "Remove animations"), `reduce_motion()` en Rust y `reduceMotion()` de `nsh` en TSX son `true`, y se aplican las variantes de Tailwind `motion-reduce:` / `motion-safe:`.

Los [motions](#motion) siguen el ajuste por sí solos: `play` y `enter` llegan de inmediato a donde termina el motion, sin moverse, y la respuesta es que terminó (`true`), igual que para un motion que se reprodujo. Una salida sigue terminando oculta, una entrada sigue terminando en reposo. Pasa `ignoreReduceMotion: true` (`play_ignoring_reduce_motion` en Rust) para un motion que transmite un significado que el usuario necesita, como un indicador de progreso giratorio.

Las transiciones, las animaciones de keyframes, los valores animados, los keyframes y las composiciones se reproducen tal como están escritos; úsalos para elegir una alternativa más calmada:

```rust tabs
let open = move || {
    if reduce_motion() {
        panel.set(0.0);
    } else {
        panel.spring(0.0, Spring::default());
    }
};

view().style_when(|| !reduce_motion(), |s| s.animate_bounce())
```

```tsx tabs
import { View } from "nsh";
import { reduceMotion } from "nsh";

const open = () => (reduceMotion() ? panel.set(0) : panel.spring(0));

<View class="motion-safe:animate-bounce" />
```

Consulta [Accesibilidad](./accessibility.md#reduced-motion).

<a id="related"></a>

## Relacionado

- [La API de animación de `nsh`](../modules/nsh.md#animation): la referencia de TSX.
- [Toques y gestos](./touch-and-gestures.md): controlar valores animados con el dedo.
- [Scroll](./scrolling.md#scroll-linked-effects-scrollvalue): `scrollValue`.
- [Canvas](./canvas.md#driving-drawings-with-animated-values): valores animados en dibujos.
- [Referencia de estilos](../modules/style-reference.md): las claves `transition*` y `animation*`.
