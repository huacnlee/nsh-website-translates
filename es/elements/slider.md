---
title: "Slider"
description: "El componente Slider: un valor, o un rango de dos, elegido a lo largo de una pista, con pulsaciones y arrastres en pantallas táctiles y con el ratón, las teclas de slider de WAI-ARIA y un valor para lectores de pantalla en cada thumb, y una pista, un indicador, un rango y thumbs que la app puede personalizar."
group: base
demo: el-slider
source_hash: 5dfd7ea970e4cd98
---


# Slider

Un slider elige un valor a lo largo de una pista (un volumen, un brillo), o un rango de dos valores con un thumb cada uno (un rango de precios). Es dueño de su comportamiento: una pulsación en la pista mueve hasta allí el thumb más cercano, un thumb sigue un arrastre, con un ratón o con un dedo; los valores se ajustan al `step`; cada thumb es una parada del foco de teclado y se mueve con las teclas de flecha, y es un elemento ajustable para los lectores de pantalla, con su propio valor. El aspecto es el de la app: un `Slider` no tiene colores, tamaños, radios ni movimiento propios. Se compone de una pista con un indicador en su interior, el rango y los thumbs sobre el indicador, y después sus hijos (una etiqueta, el valor como texto), y la app da estilo a cada parte.

```rust tabs
use nsh_base::{SliderValue, slider, theme};
use nsh_core::prelude::*;

fn strength(level: Signal<SliderValue>) -> impl IntoElement {
    let percent = move || format!("{}%", level.get().end());
    slider()
        .value(move || level.get())
        .accessibility_label("Option strength")
        .on_change(move |next: &SliderValue| level.set(*next))
        // The value in a column after the rail.
        .flex_row()
        .items_center()
        .gap_2()
        // An 8-point rail; the thumbs travel inside it.
        .track_style(|s| s.h(px(8.0)).flex_1().px(px(8.0)).rounded_full().bg(move || theme().muted))
        .indicator_style(|s| s.h_full())
        // The fill, from the rail's edge, fading into the thumb's tone.
        .range_style(|s| {
            s.ml(-px(8.0))
                .rounded_full()
                .bg_linear_to_r()
                .gradient_from(move || theme().primary)
                .gradient_to(move || theme().muted_foreground)
        })
        // A 16 x 8 pill sitting in the rail.
        .thumb_style(|s| {
            s.w(px(16.0))
                .h(px(8.0))
                .rounded_full()
                .bg(move || theme().muted_foreground)
                .hover(|s| s.brightness(1.1))
                .active(|s| s.brightness(1.25))
        })
        .child(
            text(percent)
                .w(px(42.0))
                .text_right()
                .text_xs()
                .tabular_nums()
                .text_color(move || theme().muted_foreground),
        )
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { Slider } from "nsh/base";

function App() {
  const strength = signal(64);
  return (
    <Slider
      value={strength()}
      onChange={({ value }) => strength.set(value as number)}
      accessibilityLabel="Option strength"
      class="flex-row items-center gap-2"
      trackClass="h-2 flex-1 px-2 rounded-full bg-muted focus-within:ring-2 focus-within:ring-primary/36 focus-within:ring-offset-2 focus-within:ring-offset-background disabled:opacity-35"
      indicatorClass="h-full"
      rangeClass="-ml-2 rounded-full bg-linear-to-r from-primary via-primary to-muted-foreground"
      thumbClass="h-2 w-4 rounded-full bg-muted-foreground transition hover:brightness-110 active:brightness-125 focus:outline-none disabled:brightness-100 motion-reduce:transition-none"
      thumbStyle={{ boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.18), 0 0 0 1px rgba(0, 0, 0, 0.42)" }}
    >
      <Text class="w-[42px] text-right font-mono text-[11px] text-muted-foreground">{`${strength()}%`}</Text>
    </Slider>
  );
}

mount(App);
```

`Slider` proviene de [`nsh/base`](../modules/nsh-base.md), el crate `nsh-base` de Rust. En Rust, `slider()` crea uno con un setter por prop (`.value(..)`, `.thumb_style(..)`), un método de escucha por evento (`.on_change(..)`), los métodos de estilo tipados para el propio slider y `.child(..)` para su etiqueta. Su valor es un `SliderValue`: `Single(f64)` o `Range(f64, f64)`.

<a id="value"></a>

## Valor

El valor es un número, o `[start, end]` para un rango con dos thumbs; la forma del valor decide cuántos thumbs hay. La app lo controla con `value` y establece el que informa `onChange`, como en todos los controles de `nsh/base`; o deja el valor en manos del slider con `defaultValue`, y aun así se entera de los cambios. Durante un arrastre, los thumbs y el rango siguen al puntero en el mismo fotograma, de forma nativa; cuando el puntero se levanta, vuelve a mostrarse el `value` de la app, tal como la app lo estableció para el último cambio del arrastre; los lectores de pantalla oyen los valores del arrastre a medida que avanza mientras hay uno en curso, y su valor final en caso contrario.

```tsx
const price = signal<[number, number]>([200, 800]);

<Slider
  value={price()}
  onChange={({ value }) => price.set(value as [number, number])}
  onChangeEnd={({ value }) => save(value)}
  min={0}
  max={1000}
  step={10}
  accessibilityLabel="Maximum price"
  startAccessibilityLabel="Minimum price"
/>;
```

- `onChange` informa de cada nuevo valor que pide el usuario: en una pulsación en la pista, en cada paso de un arrastre, en cada tecla. Cada informe es un valor nuevo.
- `onChangeEnd` informa una sola vez del valor en el que terminó el cambio: cuando el puntero se levanta tras una pulsación o un arrastre que estableció un valor, y después de cada paso de tecla o de lector de pantalla (cada uno es un cambio completo). Guarda o envía el valor ahí.
- Los valores se ajustan a `step`, contados desde `min` (`min={1} step={2}` da 1, 3, 5, ...), y permanecen entre `min` y `max`; `max` siempre es alcanzable, de modo que el último paso es más corto cuando el rango no es un número entero de pasos. `step={0}` admite cualquier valor.
- Los thumbs de un rango nunca se cruzan: un thumb arrastrado se detiene en el otro. Un arrastre que empieza sobre dos thumbs con el mismo valor mueve el que puede avanzar en el sentido del puntero.
- El valor mostrado es el de la app, limitado por `min` y `max` (los extremos de un rango, en orden), y un valor fuera de la cuadrícula del paso se muestra donde está; el siguiente cambio del usuario se ajusta.

## Props

| Prop | Rust | Tipo | Predeterminado | Descripción |
|---|---|---|---|---|
| `value` | `.value(..)` | `number \| [number, number]` | ninguno | El valor (controlado): un número, o un rango con dos thumbs. La app establece el que informa `onChange`. |
| `defaultValue` | `.default_value(..)` | `number \| [number, number]` | `0` | El valor inicial mientras `value` no está establecido; el slider mantiene entonces el suyo propio. |
| `min` | `.min(..)` | `number` | `0` | El valor más pequeño. |
| `max` | `.max(..)` | `number` | `100` | El valor más grande; uno por debajo de `min` es `min`. |
| `step` | `.step(..)` | `number` | `1` | El paso al que se ajustan los valores, contado desde `min`; `0` admite cualquier valor. |
| `scale` | `.scale(..)` | `"linear" \| "logarithmic"` | `"linear"` | Cómo se reparten los valores a lo largo de la pista: de manera uniforme, o por órdenes de magnitud (de 1 a 1000, a un tercio del camino está 10). La escala logarítmica necesita `min` mayor que 0; con un `min` menor es lineal. |
| `axis` | `.axis(..)` | `"horizontal" \| "vertical"` | `"horizontal"` | La dirección de la pista: `min` al inicio (la izquierda, o la derecha en un diseño de derecha a izquierda), o abajo. Se lee cuando se crea el slider. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Ningún cambio por puntero, teclado o lector de pantalla; las clases `disabled:` se aplican al slider y a sus partes. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | ninguno | Lo que dicen los lectores de pantalla para el thumb (en un rango, el del final). |
| `startAccessibilityLabel` | `.start_accessibility_label(..)` | `string` | `accessibilityLabel` | Lo que dicen los lectores de pantalla para el thumb de inicio de un rango. |
| `trackClass`, `trackStyle` | `.track_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | ninguno | La pista: el área que recibe las pulsaciones y los arrastres. |
| `indicatorClass`, `indicatorStyle` | `.indicator_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | ninguno | El indicador, el carril sobre el que se proyectan los valores. |
| `rangeClass`, `rangeStyle` | `.range_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | ninguno | El rango, desde `min` hasta el thumb (entre los thumbs de un rango), colocado por el slider. |
| `thumbClass`, `thumbStyle` | `.thumb_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | ninguno | Cada thumb, centrado en su valor. |
| `children` | `.child(..)` | `JSX.Element` | ninguno | El contenido después de la pista: una etiqueta, el valor como texto. |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | ninguno | El propio slider: la columna (o fila) que rodea la pista y la etiqueta. |

<a id="events"></a>

## Eventos

| Evento | Rust | Carga | Cuándo |
|---|---|---|---|
| `onChange` | `.on_change(\|value: &SliderValue\| ..)` | `{ value: number \| [number, number] }` | El usuario pidió un nuevo valor: una pulsación en la pista, un paso de un arrastre, una tecla, un incremento o decremento de un lector de pantalla. |
| `onChangeEnd` | `.on_change_end(\|value: &SliderValue\| ..)` | `{ value: number \| [number, number] }` | El cambio terminó: el puntero se levantó, se completó una tecla o un paso de un lector de pantalla. Una vez por cambio. |

<a id="parts"></a>

## Partes

| Parte | Dentro de | Se estiliza con |
|---|---|---|
| El slider | | `class`, `style` |
| La pista | el slider, la primera | `trackClass`, `trackStyle` |
| El indicador | la pista | `indicatorClass`, `indicatorStyle` |
| El rango | el indicador, colocado según los valores | `rangeClass`, `rangeStyle` |
| Un thumb (dos en un rango) | el indicador, centrado en su valor | `thumbClass`, `thumbStyle` |
| La etiqueta | el slider, después de la pista | sus propios elementos (`children`) |

La pista recibe las pulsaciones y los arrastres. La longitud del indicador es el rango de valores, desde `min` en su borde inicial (en su parte inferior cuando es vertical); el slider coloca el rango y los thumbs sobre él, con cada thumb centrado en su valor sea cual sea su tamaño. Hay dos maneras de disponerlos:

- La pista es el carril (el ejemplo de arriba): `h-2 px-2 rounded-full bg-muted` con un indicador `h-full`. El padding mantiene los thumbs dentro del carril en ambos extremos, y el `-ml-2` del rango hace que el relleno empiece en el borde del propio carril.
- La pista es una banda alrededor del carril, más alta para que un dedo la encuentre en una pantalla táctil: `h-8 justify-center` con un indicador `h-2 rounded-full` (`w-8 items-center` y `w-2 h-full` en un slider vertical).

Estados que muestran las partes:

- Un thumb: `hover:` bajo el puntero, `active:` mientras se arrastra, `focus:` con el foco de teclado, `disabled:`.
- La pista: `active:` mientras una pulsación sobre ella arrastra; es un `group`, de modo que el indicador, el rango y los thumbs toman `group-hover:` y `group-active:` de ella.
- Todas las partes: `disabled:` mientras lo está el slider.

Los thumbs se mueven a medida que cambia el valor, y siguen un arrastre al instante. El movimiento de los estados de los thumbs es decisión de la app (`transition` para un thumb que se ilumina en `hover:` y `active:`), y `motion-reduce:` lo mantiene quieto para las personas que piden menos movimiento. El foco de teclado es el de un thumb: `focus-within:` en la pista rodea todo el carril con un anillo mientras un thumb lo tiene, y el `focus:outline-none` del thumb ocupa el lugar del contorno de foco propio de la plataforma.

<a id="keyboard"></a>

## Teclado

En macOS y en la web, cada thumb es una parada del foco de teclado (Tab), y el thumb enfocado admite las teclas de slider de WAI-ARIA:

| Tecla | Acción |
|---|---|
| Flecha derecha, Flecha arriba | Un paso hacia arriba (también en un slider vertical). |
| Flecha izquierda, Flecha abajo | Un paso hacia abajo. |
| Page Up, Page Down | Una décima parte del rango hacia arriba o hacia abajo (a lo largo de la escala), con un mínimo de un paso. |
| Home, End | Hasta donde llegue el thumb hacia abajo o hacia arriba (el inicio de un rango, hasta su final). |

En un diseño de derecha a izquierda, un slider horizontal avanza desde la derecha, con su `min` en el extremo derecho: Flecha izquierda es un paso hacia arriba y Flecha derecha un paso hacia abajo, y un arrastre hacia la izquierda aumenta el valor. Un slider vertical mantiene Flecha derecha y Flecha arriba como un paso hacia arriba.

Cada tecla que cambia el valor informa de `onChange` y después de `onChangeEnd`. Las flechas y las páginas se repiten mientras se mantienen pulsadas. Las teclas solo llegan al slider mientras ninguna entrada de texto se está editando.

<a id="accessibility"></a>

## Accesibilidad

- Cada thumb es un elemento ajustable (`"adjustable"`, un slider en el navegador) con su etiqueta, su valor y los valores que puede tomar: el inicio de un rango desde `min` hasta el final, su final desde el inicio hasta `max`, de modo que los lectores de pantalla leen y establecen ambos. El valor se pronuncia como el número con los decimales del paso (`2.5`).
- Las acciones de incremento y decremento de un lector de pantalla (el deslizamiento hacia arriba y hacia abajo de VoiceOver) mueven el thumb un paso, igual que las teclas de flecha.
- Los thumbs son los elementos del slider para los lectores de pantalla, nombrados por `accessibilityLabel` (y el inicio de un rango por `startAccessibilityLabel`); una etiqueta visible entre sus hijos se lee donde está.
- Mientras `disabled`, los lectores de pantalla indican que los thumbs están atenuados, y no admiten acciones.

Consulta [Accesibilidad](../docs/accessibility.md) para ver las etiquetas, los roles y las acciones en general.

<a id="platform-notes"></a>

## Notas de plataforma

- Cada plataforma dibuja lo que la app estiliza. Las pulsaciones y los arrastres se siguen en el núcleo, para un ratón, un lápiz o un dedo, y una vista con scroll alrededor del slider no se queda con un arrastre que empezó sobre este.
- Tab mueve el foco de teclado entre los thumbs en macOS y en la web, donde el thumb enfocado admite las teclas del slider.
- Lectores de pantalla: VoiceOver (iOS, macOS) y TalkBack ajustan cada thumb; UI Automation (Windows), la accesibilidad de GTK (Linux) y el navegador (`role="slider"`, `aria-valuenow`, `aria-valuetext`) obtienen su rango y su valor.
