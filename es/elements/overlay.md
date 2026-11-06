---
title: "Overlay"
description: "El elemento Overlay: contenido que se muestra encima de la pantalla sin importar qué recorte a su elemento padre, dispuesto como un cuadro fijo o colocado respecto a un ancla a la que sigue, con notificación de las pulsaciones fuera de él y de la tecla Escape."
order: 100
group: primitives
demo: el-overlay
source_hash: 7e13ccf223d62c09
---


# Overlay

Un overlay muestra a sus hijos por encima de todo lo que hay en la vista raíz en la que está: la ventana, o el diálogo que lo rodea.
Ni el tamaño de su padre, ni `overflow: hidden`, ni las vistas de scroll lo recortan. En todo lo demás se queda donde lo escribiste: lee el contexto que lo rodea, sus manejadores son los de su componente y desaparece junto con su padre. Los popovers, menús, tooltips y sheets se construyen sobre él; [`nsh/base`](../modules/nsh-base.md) los trae listos ([Popover](./popover.md), [Menu](./menu.md), [Tooltip](./tooltip.md), [Sheet](./sheet.md)), y un overlay es lo que usas para construir los tuyos.

```rust tabs
use nsh_core::prelude::*;

fn more_button() -> impl IntoElement {
    let open = signal(false);
    let anchor = element_ref();
    view()
        .child(
            view()
                .element_ref(&anchor)
                .on_press(move || open.update(|o| *o = !*o))
                .px_3()
                .py_2()
                .child(text("More")),
        )
        .child(when(move || open.get(), move || {
            overlay()
                .anchor(&anchor)
                .placement(Placement::Bottom)
                .align(Align::Start)
                .offset(px(6.0))
                .margin(px(8.0))
                .on_press_outside(move |_: &Point<Points>| open.set(false))
                .on_cancel(move || open.set(false))
                .rounded_lg()
                .bg(white())
                .p_3()
                .shadow_lg()
                .child(text("Shown above everything"))
        }))
}
```

```tsx tabs
import { Overlay, signal, Text, View, type ViewRef } from "nsh";

function MoreButton() {
  const open = signal(false);
  let anchor: ViewRef | undefined;
  return (
    <View>
      <View ref={anchor} onPress={() => open.set(!open())} class="px-3 py-2">
        <Text>More</Text>
      </View>
      <If when={open()}>
        <Overlay
          anchor={anchor}
          placement="bottom"
          align="start"
          offset={6}
          margin={8}
          onPressOutside={() => open.set(false)}
          onCancel={() => open.set(false)}
          class="rounded-lg bg-white p-3 shadow-lg"
        >
          <Text>Shown above everything</Text>
        </Overlay>
      </If>
    </View>
  );
}
```

`Overlay` viene de `nsh` en TSX y `overlay()` de `nsh_core::prelude` en Rust. Se muestra mientras está en la vista: colócalo dentro de un `If` (Rust: `when(..)`) para abrirlo y cerrarlo. Los overlays mostrados después quedan encima de los anteriores, y un overlay dentro de otro queda encima de este.

<a id="placement"></a>

## Ubicación

Sin `anchor`, un overlay se dispone como una caja `position: fixed` de su vista raíz: sus `top`, `left`, `inset`, tamaño y márgenes se calculan respecto a toda la ventana (o diálogo). `class="inset-0"` la cubre, lo que sirve para un fondo o una capa de ventana completa; `class="bottom-0 left-0 right-0"` es una barra a lo largo del borde inferior.

Con `anchor`, NSH lo coloca junto al ancla:

- `anchor` es una vista (un `ref`), un `Point` (`{ x, y }`) en las coordenadas de la vista raíz, el `pageX` / `pageY` de un toque (un menú donde está el puntero), o un `Bounds` (`{ origin, size }`) en ellas: el cursor de un input (`pageBounds` de `onCaretMove`), donde se abren las sugerencias para lo que se está escribiendo.
- `placement` es el lado en el que se coloca: `"top"`, `"bottom"` (el valor por defecto), `"left"` o `"right"`. Cuando no cabe en ese lado y sí cabe en el opuesto, pasa al opuesto; cuando no cabe en ninguno, se coloca en el lado con más espacio.
- `align` lo alinea a lo largo de ese lado: `"start"`, `"center"` (el valor por defecto) o `"end"`. Por encima y por debajo del ancla, start y end siguen la dirección del layout: start es el borde izquierdo, o el derecho en un layout de derecha a izquierda.
- `offset` es el espacio entre el ancla y el overlay; `margin` es la distancia que mantiene respecto a los bordes del área segura, dentro de la cual permanece: se desliza a lo largo de su lado para encajar.

Un overlay anclado sigue a su ancla: cuando el ancla se desplaza, se mueve o cambia de tamaño, el overlay se mueve con ella en el mismo frame en que NSH lo dispone. `onPosition` indica dónde quedó, de modo que una flecha pueda apuntar al ancla o un menú largo pueda limitar su altura:

```tsx
<Overlay
  anchor={anchor}
  onPosition={(e) => {
    side.set(e.placement); // "top" when it flipped
    maxHeight.set(e.available.height);
  }}
/>
```

<a id="dismissing"></a>

## Cierre

Un overlay informa de lo que suele cerrar un popup y te deja la decisión a ti:

- `onPressOutside` se dispara cuando un dedo o un botón del ratón se presiona fuera del overlay, de su ancla y de los overlays que contiene. La pulsación continúa hacia lo que hay debajo.
- `onCancel` se dispara con Escape, el botón atrás de Android y el gesto de escape de VoiceOver en iOS, solo para el overlay superior que lo escucha. Los recibe antes que las páginas y `BackHandler`.

Para bloquear la pantalla detrás de un popup, coloca debajo un segundo overlay con `class="inset-0"` y un `onPress` que cierre ambos: así funcionan [Sheet](./sheet.md) y la presentación en teléfono de [Popover](./popover.md).

## Props

| Prop | Rust | Tipo | Valor por defecto | Descripción |
|---|---|---|---|---|
| `anchor` | `.anchor(&element_ref)`, `.anchor_point(point)`, `.anchor_bounds(bounds)` | `ViewRef \| Point \| Bounds \| null` | ninguno | La vista, el punto o la caja respecto a la que se coloca. Sin ella es una caja fija de su vista raíz. |
| `placement` | `.placement(..)` | `"top" \| "bottom" \| "left" \| "right"` | `"bottom"` | El lado del ancla en el que se coloca. |
| `align` | `.align(..)` | `"start" \| "center" \| "end"` | `"center"` | Cómo se alinea con el ancla a lo largo de ese lado. |
| `offset` | `.offset(px(..))` | `number` | `0` | El espacio entre el ancla y el overlay. |
| `margin` | `.margin(px(..))` | `number` | `0` | La distancia que mantiene respecto a los bordes del área segura. |
| `children` | `.child(..)` | `JSX.Element` | ninguno | Lo que muestra. |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | ninguno | Su aspecto y, sin ancla, su posición. |

También acepta las [props comunes](./index.md#common-props) de una vista.

<a id="events"></a>

## Eventos

| Evento | Rust | Descripción |
|---|---|---|
| `onPressOutside` | `.on_press_outside(\|point\| ..)` | Una pulsación se presionó fuera de él, de su ancla y de los overlays que contiene (`pagePosition`, un `Point`). |
| `onCancel` | `.on_cancel(\|\| ..)` | Escape, el botón atrás de Android o el gesto de escape de VoiceOver, mientras es el overlay superior que escucha. |
| `onPosition` | `.on_position(\|position\| ..)` | NSH lo colocó: `placement` (el lado en el que quedó), `bounds` en la vista raíz y `available` (un `Size`: el espacio disponible en ese lado). |

<a id="platform-notes"></a>

## Notas de plataforma

- Cada plataforma muestra un overlay como una vista nativa de la vista raíz de la ventana (o del diálogo), dibujada y sometida a hit-testing igual que las vistas que la rodean: UIKit, Android views, AppKit, GTK, Win32, GPUI y el DOM.
- Un overlay dentro de un [Dialog](./dialog.md) se muestra en ese diálogo, por encima de su contenido.
- Los overlays permanecen en su ventana: un menú que sobrepasaría el borde de la ventana se desliza hacia atrás para quedar dentro.
