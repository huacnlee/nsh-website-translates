---
title: "Scrollbar"
description: "El componente Scrollbar: una barra de desplazamiento con el aspecto propio de la app para todas las vistas de desplazamiento y listas (un tema definido una sola vez) o para una sola, colocada donde la app quiera, cuyo thumb sigue el contenido y cuyos arrastres y pulsaciones lo desplazan, mostrada mientras se desplaza, al pasar el cursor o siempre, con fundido de entrada y salida según los tiempos de la app."
group: base
demo: el-scrollbar
source_hash: 961c62cdc9b903d2
---


# Scrollbar

Una scrollbar da a una vista de scroll o a una lista una barra con el aspecto propio de la app: una píldora delgada que se ensancha bajo el puntero, un carril en el tono de la marca, una barra junto a una cabecera fija o a lo largo de dos paneles. Definida una vez como el tema de la app, cada vista de scroll y cada lista dibuja una en lugar del indicador de la plataforma ([Barras integradas](#built-in-bars)); colocada por la app, nombra la vista de scroll que mueve y se sitúa donde la app la ponga. La barra gestiona su propio comportamiento: la longitud y la posición del thumb siguen al contenido, al viewport y al desplazamiento (también mientras una lista crece o la ventana cambia de tamaño); arrastrar el thumb desplaza el contenido, y pulsar sobre el carril lleva allí el centro del thumb; se muestra mientras el contenido se desplaza, mientras el puntero está sobre ella, o siempre, y aparece y desaparece con fundidos nativos. El aspecto y los tiempos son de la app: una `Scrollbar` no tiene colores, tamaños ni radios propios, y sus fundidos no tardan nada hasta que la app les da una duración.

```rust tabs
use nsh_base::{ScrollbarEntrance, ScrollbarMode, ScrollbarMotion, scrollbar, theme};
use nsh_core::prelude::*;

fn inbox(rows: impl IntoElement) -> impl IntoElement {
    let list = element_ref();
    // In over 300 ms and out over 500 ms, 2 s after the last scroll; pointing
    // at the hidden thumb slides it in from the edge.
    let mut motion = ScrollbarMotion::default();
    motion.enter = 300.0;
    motion.exit = 500.0;
    motion.thumb_hover_entrance = ScrollbarEntrance::SlideAndFade;
    view()
        .relative()
        .flex_1()
        // The scroll view's own indicator gives way to the app's bar.
        .child(scroll().element_ref(&list).flex_1().scrollbar(false).child(rows))
        .child(
            scrollbar()
                .scroll(list)
                .mode(ScrollbarMode::Hover)
                .motion(motion)
                .accessibility_label("Messages")
                // The track over the right edge; the thumb right-aligned in it.
                .absolute()
                .top_0()
                .bottom_0()
                .right_0()
                .w(px(16.0))
                .items_end()
                .p(px(4.0))
                .thumb_style(|s| {
                    s.w(px(6.0))
                        .rounded_full()
                        .bg(move || theme().muted_foreground)
                        .opacity(0.6)
                        .group_hover(|s| s.w(px(8.0)).opacity(0.9))
                }),
        )
}
```

```tsx tabs
import { mount, Scroll, Text, View, type YNode } from "nsh";
import { Scrollbar } from "nsh/base";

function App() {
  let list: YNode | undefined;
  return (
    <View class="relative flex-1">
      <Scroll ref={list} scrollbar={false} class="flex-1">
        {Array.from({ length: 60 }, (_, i) => (
          <Text class="px-4 py-3">{`Message ${i + 1}`}</Text>
        ))}
      </Scroll>
      <Scrollbar
        scroll={list}
        mode="hover"
        motion={{ enter: 300, exit: 500, thumbHoverEntrance: "slideAndFade" }}
        accessibilityLabel="Messages"
        class="absolute inset-y-0 right-0 w-4 items-end p-1"
        thumbClass="w-1.5 rounded-full bg-muted-foreground opacity-60 transition-all duration-300 hover:w-2 hover:opacity-90 active:w-2 active:opacity-100"
      />
    </View>
  );
}

mount(App);
```

`Scrollbar` proviene de [`nsh/base`](../modules/nsh-base.md), el crate `nsh-base` de Rust. En Rust, `scrollbar()` crea una con un setter por cada prop (`.scroll(..)`, `.thumb_style(..)`) y los métodos de estilo tipados para la propia barra; su `scroll` acepta un `ElementRef` (o un `ScrollbarTarget`).

<a id="built-in-bars"></a>

## Barras integradas

Cada vista de scroll y cada lista pueden dibujar una `Scrollbar` en lugar del indicador de la plataforma, sin necesidad de colocar ninguna barra: `Scrollbar.setTheme` da el aspecto de la app a la barra de cada vista cuyo `scrollbar` sea `true`, una sola vez, allí donde la app arranca. Cada vista recibe su propia barra sobre su viewport, que permanece allí mientras el contenido se desplaza (en el hilo principal, como las vistas sticky) y se dibuja por encima del contenido; sigue, se desplaza y se desvanece como lo hace una `Scrollbar` colocada.

```rust tabs
use nsh_base::{ScrollbarLook, ScrollbarMode, ScrollbarTheme, set_scrollbar_theme};

fn use_app_scrollbars() {
    let mut vertical = ScrollbarLook::default();
    vertical.class = Some("absolute inset-y-0 right-0 w-4 items-end p-1".into());
    vertical.thumb_class = Some("w-1.5 rounded-full bg-muted-foreground opacity-60 hover:w-2".into());
    let mut horizontal = ScrollbarLook::default();
    horizontal.class = Some("absolute inset-x-0 bottom-0 h-4 items-end p-1".into());
    horizontal.thumb_class = Some("h-1.5 rounded-full bg-muted-foreground opacity-60 hover:h-2".into());
    let mut theme = ScrollbarTheme::default();
    theme.mode = ScrollbarMode::Hover;
    theme.motion.enter = 300.0;
    theme.motion.exit = 500.0;
    theme.vertical = Some(vertical);
    theme.horizontal = Some(horizontal);
    set_scrollbar_theme(Some(theme));
}
```

```tsx tabs
import { Scrollbar } from "nsh/base";

Scrollbar.setTheme({
  mode: "hover",
  motion: { enter: 300, exit: 500 },
  vertical: {
    class: "absolute inset-y-0 right-0 w-4 items-end p-1",
    thumbClass: "w-1.5 rounded-full bg-muted-foreground opacity-60 transition-all duration-300 hover:w-2",
  },
  horizontal: {
    class: "absolute inset-x-0 bottom-0 h-4 items-end p-1",
    thumbClass: "h-1.5 rounded-full bg-muted-foreground opacity-60 transition-all duration-300 hover:h-2",
  },
});
```

Una `ScrollbarTheme` tiene las props de una barra que son iguales para todas las vistas, y el aspecto de cada eje:

| Campo | Tipo | Valor por defecto | Descripción |
|---|---|---|---|
| `mode` | `"scrolling" \| "hover" \| "always"` | `"scrolling"` | Cuándo se muestran las barras: [Cuándo se muestra](#when-it-shows). |
| `motion` | `ScrollbarMotion` | salta, `idle` `2000` | Cómo se muestran y se ocultan: [Movimiento](#motion). |
| `minThumbLength` | `number` | `48` | La longitud mínima que alcanza un thumb. |
| `vertical`, `horizontal` | `ScrollbarLook` | ninguno | El aspecto de las barras de las vistas verticales y de las horizontales: `class` y `style` para el carril, colocado en el viewport de la vista; `thumbClass` y `thumbStyle`; `accessibilityLabel`. Una vista cuyo eje no tiene aspecto conserva el indicador de la plataforma. |

Un `setTheme` posterior vuelve a estilizar las barras, y `Scrollbar.setTheme(null)` devuelve a las vistas el indicador de la plataforma. Una vista puede recibir un tema propio como su prop `scrollbar` (`<Scroll scrollbar={{ mode: "always", vertical: { … } }}>`), haya definido o no la app uno; `scrollbar={false}` deja a una vista sin barra. Una lista maquetada en el viewport de su padre (`viewport="parent"`) se desplaza con esa vista y con su barra. Un `Input` multilínea también recibe la barra de su aspecto vertical, sobre su texto, que desplaza igual que lo hace el indicador propio de la vista de texto.

<a id="the-scroll-view-it-moves"></a>

## La vista de scroll que mueve

`scroll` nombra la vista de scroll o la lista que la barra sigue: su `ref`. La barra la encuentra una vez que está en pantalla, por lo que el `ref` puede ser asignado por un elemento posterior del mismo render; escribe la barra después de su vista de scroll (o guarda el `ref` en un signal). Desactiva el indicador propio de la vista de scroll con `scrollbar={false}`, y coloca la barra con `class`: sobre el borde de la vista de scroll dentro de una caja `relative` que rodee a ambas, o en cualquier otro lugar de la pantalla.

- El thumb tiene la longitud de la proporción del contenido que muestra el viewport, a lo largo de la caja de contenido del carril (dentro de su padding), y no es más corto que `minThumbLength`. Su posición es cuánto se ha desplazado el contenido; mientras el contenido rebota más allá de un extremo, el thumb permanece en ese extremo.
- Arrastrar el thumb desplaza el contenido tanto como se mueve el thumb. Pulsar sobre el carril lleva el centro del thumb bajo el puntero, y el arrastre continúa desde ahí.
- Una barra vertical sigue a una vista de scroll vertical; `axis="horizontal"` crea una barra para una horizontal (colócala a lo largo del borde inferior). Una barra por eje.
- Las listas funcionan igual: el thumb sigue la longitud total de la lista a medida que se miden y añaden filas.

<a id="when-it-shows"></a>

## Cuándo se muestra

| `mode` | Se muestra |
|---|---|
| `"scrolling"` (por defecto) | Mientras el contenido se desplaza, y hasta `motion.idle` después de que se detenga; el puntero sobre la barra mientras se muestra la mantiene visible. |
| `"hover"` | Mientras el puntero está sobre la barra (donde se muestra, incluso estando oculta), y como lo hace `"scrolling"`. |
| `"always"` | Siempre. |

En todos los modos se muestra mientras se arrastra su thumb, y permanece `motion.idle` tras el último scroll, arrastre o hover. Mientras el contenido cabe en el viewport, permanece oculta. Cuando está oculta, la barra está en `opacity: 0` y deja pasar las pulsaciones a lo que hay debajo.

<a id="motion"></a>

## Movimiento

`motion` define los tiempos de los fundidos de la barra, que se ejecutan de forma nativa, como lo hace `ScrollbarMotion` de `gpui-base`:

| Campo | Valor por defecto | Descripción |
|---|---|---|
| `idle` | `2000` | Cuánto tiempo permanece la barra tras el último scroll, arrastre o hover, en milisegundos. |
| `enter` | `0` | Cuánto tarda en aparecer: su opacidad sube de forma lineal, un deslizamiento usa ease-out. |
| `exit` | `0` | Cuánto tarda en desvanecerse una vez terminado `idle`, con ease-in; se desliza fuera de su carril mientras se desvanece. |
| `entrance` | `"fade"` | Cómo entra: `"fade"` en su sitio, o `"slideAndFade"` desde el borde en el que está (la derecha, la parte inferior). |
| `thumbHoverEntrance` | `"fade"` | Cómo entra cuando el puntero sobre su thumb oculto la muestra (`"hover"`). |

Sin duraciones, la barra aparece y desaparece de golpe. Un fundido invertido a mitad de camino conserva su velocidad: se ejecuta durante la parte de su duración que aún queda por recorrer. Una barra `"always"` nunca se anima, ni tampoco ninguna mientras el usuario pida menos movimiento. El carril recorta lo que se desliza. El movimiento propio del thumb, como un ancho que crece en `hover:`, corresponde a su estilo (`transition-all` en `thumbClass`).

## Props

| Prop | Rust | Tipo | Valor por defecto | Descripción |
|---|---|---|---|---|
| `scroll` | `.scroll(..)` | `YNode` | ninguno | La vista de scroll o lista que la barra sigue y mueve (su `ref`). |
| `axis` | `.axis(..)` | `"horizontal" \| "vertical"` | `"vertical"` | El eje de la vista de scroll: el carril discurre a lo largo de él. Se lee cuando se crea la barra. |
| `mode` | `.mode(..)` | `"scrolling" \| "hover" \| "always"` | `"scrolling"` | Cuándo se muestra la barra. |
| `motion` | `.motion(..)` | `ScrollbarMotion` | salta, `idle` `2000` | Cómo se muestra y se oculta: [Movimiento](#motion). |
| `minThumbLength` | `.min_thumb_length(..)` | `number` | `48` | La longitud mínima del thumb en un contenido largo, para que siga siendo fácil de agarrar. |
| `thumbClass`, `thumbStyle` | `.thumb_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | ninguno | El thumb. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | ninguno | Lo que dicen los lectores de pantalla sobre la barra. |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | ninguno | La barra: su carril, donde la app la coloca. |

<a id="parts"></a>

## Partes

| Parte | Dentro de | Se estiliza con |
|---|---|---|
| El carril | donde la app lo coloca | `class`, `style` |
| El thumb | la caja de contenido del carril | `thumbClass`, `thumbStyle` |

La barra dimensiona el thumb a lo largo del eje y lo mueve; su grosor y su posición a lo ancho del carril son cosa de la app (`w-1.5` y `items-end` en el carril colocan un thumb de 6 puntos a la derecha). El padding del carril mantiene el thumb alejado de sus extremos y lados.

Estados que muestran las partes:

- El carril: `hover:` bajo el puntero; es un `group`, por lo que el thumb toma `group-hover:` de él (un thumb que se ensancha cuando el puntero se acerca).
- El thumb: `hover:` bajo el puntero, `active:` mientras se arrastra.

La visibilidad de la barra es su opacidad: aplica la transparencia a los colores del fondo del carril o del thumb. Un thumb que se ensancha usa `transition-all` (que nunca retrasa la posición del thumb, que la barra establece al margen de los estilos del thumb), y `motion-reduce:` lo mantiene quieto para las personas que piden menos movimiento.

<a id="accessibility"></a>

## Accesibilidad

- La vista de scroll sigue siendo lo que desplazan los lectores de pantalla: la mueven con sus propios gestos y leen su contenido.
- La barra se etiqueta mediante `accessibilityLabel` para los lectores de pantalla que llegan a ella.

Consulta [Accesibilidad](../docs/accessibility.md) para etiquetas, roles y acciones en general.

<a id="platform-notes"></a>

## Notas sobre plataformas

- Cada plataforma dibuja lo que la app estiliza, y el thumb sigue el desplazamiento que cada plataforma informa para la vista de scroll. Los arrastres del thumb y las pulsaciones sobre el carril funcionan con ratón, lápiz o dedo.
- `"hover"` sigue a un puntero de ratón o de touchpad (los escritorios y la web); en una pantalla táctil, la barra se muestra mientras el contenido se desplaza, y su carril oculto deja pasar los toques.
