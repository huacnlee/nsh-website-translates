---
title: "Sheet"
description: "El componente Sheet: un panel en el borde de la pantalla sobre un fondo, que se cierra con el fondo, con Escape y con el gesto de retroceso, y cuyo estilo define la aplicación."
group: base
demo: el-sheet
source_hash: 9ebaacaa0bebfe35
---


# Sheet

A sheet (hoja) es un panel en un borde de la pantalla, sobre un fondo que cubre el resto: filtros, un panel para compartir, un cajón lateral. Una pulsación en el fondo, Escape, el botón atrás de Android y el gesto de escape de VoiceOver la cierran. Se muestra por encima de todo en su
ventana, igual en todos los dispositivos, y no dibuja nada por sí misma: el panel y el fondo son de la app.

```rust tabs
use nsh_base::{SheetEvent, sheet};
use nsh_core::prelude::*;

fn filters(open: Signal<bool>) -> impl IntoElement {
    sheet()
        .open(move || Some(open.get()))
        .on_open_change(move |e: &SheetEvent| {
            if let SheetEvent::OpenChange(next, _) = e {
                open.set(*next);
            }
        })
        .child(
            view()
                .gap_3()
                .p_6()
                .rounded_t(px(16.0))
                .bg(white())
                .child(text("Filters").font_weight(FontWeight::SEMIBOLD))
                .child(view().on_press(move || open.set(false)).child(text("Done"))),
        )
}
```

```tsx tabs
import { signal, Text, View } from "nsh";
import { Sheet } from "nsh/base";

function Filters() {
  const open = signal(false);
  return (
    <>
      <View onPress={() => open.set(true)}><Text>Filters</Text></View>
      <Sheet
        open={open()}
        onOpenChange={(e) => open.set(e.open)}
        popupClass="gap-3 rounded-t-2xl bg-white p-6"
        backdropClass="bg-black/40"
      >
        <Text class="font-semibold">Filters</Text>
        <View onPress={() => open.set(false)}><Text>Done</Text></View>
      </Sheet>
    </>
  );
}
```

`Sheet` proviene de [`nsh/base`](../modules/nsh-base.md). Su contenido se crea cada vez que se abre. `side` la coloca en
`"bottom"` (el valor predeterminado) o en `"top"` de la pantalla, con el ancho de la pantalla, o en `"left"` o `"right"`, con el alto
de la pantalla; su tamaño transversal es el del panel, según su contenido o `popupClass`.

Su deslizamiento sigue el tamaño medido del panel a medida que el contenido se crea o crece durante la entrada. El contenido diferido y
las actualizaciones de tamaño asíncronas comparten el mismo progreso de animación; el panel se asienta en su tamaño actual.

<a id="open-state"></a>

## Estado de apertura

Sin `open`, la hoja mantiene su propio estado, a partir de `defaultOpen`. Con `open`, el estado pertenece a la app: cámbialo en
`onOpenChange({ open, reason })`, que informa de cada solicitud de cierre con su motivo (`"backdropPress"`, `"cancel"`, `"swipe"`).
`onOpen` y `onClose` lo siguen al entrar y al salir, sin importar quién la abrió o la cerró.

`closeOnEscape={false}` la mantiene abierta con Escape y atrás, `closeOnBackdropPress={false}` con las pulsaciones en el fondo;
`onCancel` aun así las recibe, para preguntar antes.

<a id="dragging-a-bottom-sheet"></a>

## Arrastrar una hoja inferior

Establece `closeOnSwipe` para que un panel inferior siga el arrastre hacia abajo. Su fondo se desvanece con la distancia; al soltar
más allá del 30 % de la altura del panel, o hacia abajo a 800 puntos por segundo, se solicita el cierre con el motivo `"swipe"`.
Un arrastre más corto vuelve suavemente. Un propietario controlado puede mantener `open` en true para devolver el panel tras una solicitud de cierre.
Con movimiento reducido, soltar y abrir o cerrar mediante código se asientan de inmediato; el arrastre directo sigue al dedo.

El panel se ajusta a su contenido, incluidos los menús cortos; usa `popupStyle` o la altura de un hijo para limitar contenido más alto.
La app dibuja su propio tirador, que puede ser cualquier vista dentro del panel. En iOS, un `Scroll` o `List` vertical interno
consume el arrastre hasta llegar arriba y pasa el movimiento descendente restante al panel dentro del mismo gesto.
En Android, en escritorio y en la web, arrastrar el tirador o el contenido fuera de un scroll usa su compatibilidad nativa de desplazamiento;
los scrolls internos conservan el arbitraje de gestos normal de su plataforma. Establecer `closeOnSwipe` en false mantiene el panel
inmóvil y conserva el contenido montado y la posición de scroll. Los demás lados conservan su comportamiento actual.

<a id="native-sheets"></a>

## Hojas nativas

Una hoja la dibuja NSH en la ventana de la app, con el estilo de la app. Para la hoja presentada por la propia plataforma (una page sheet
en iOS), usa un [Dialog](./dialog.md) con `presentation="pageSheet"`.

## Props

| Prop | Rust | Tipo | Predeterminado | Descripción |
|---|---|---|---|---|
| `open` | `.open(..)` | `boolean` | ninguno | Abierta, controlada por la app. |
| `defaultOpen` | `.default_open(..)` | `boolean` | `false` | Abierta al inicio, sin `open`. |
| `side` | `.side(..)` | `"top" \| "bottom" \| "left" \| "right"` | `"bottom"` | El borde en el que está. |
| `closeOnEscape` | `.close_on_escape(..)` | `boolean` | `true` | Escape y el botón atrás de Android la cierran. |
| `closeOnBackdropPress` | `.close_on_backdrop_press(..)` | `boolean` | `true` | Una pulsación en el fondo la cierra. |
| `closeOnSwipe` | `.close_on_swipe(..)` | `boolean` | `false` | Un panel inferior sigue el arrastre hacia abajo y se cierra al soltar lo suficiente. |
| `popupClass`, `popupStyle` | `.popup_class(..)`, `.popup_style(..)` | `string`, `StyleProp<ViewStyle>` | ninguno | El aspecto del panel. |
| `backdropClass`, `backdropStyle` | `.backdrop_class(..)`, `.backdrop_style(..)` | `string`, `StyleProp<ViewStyle>` | ninguno | El aspecto del fondo, como un color translúcido. |
| `children` | `.child(..)` | `JSX.Element` | ninguno | El contenido. |

<a id="events"></a>

## Eventos

| Evento | Rust | Descripción |
|---|---|---|
| `onOpenChange` | `.on_open_change(\|e\| ..)` | Una solicitud de cierre, con el motivo: `"backdropPress"`, `"cancel"` o `"swipe"`. |
| `onOpen` | `.on_open(\|\| ..)` | Entró: todo está presente. |
| `onClose` | `.on_close(\|\| ..)` | Salió: todo ha desaparecido. También cuando la app la cerró. |
| `onCancel` | `.on_cancel(\|\| ..)` | El usuario intentó cerrarla (Escape o atrás, una pulsación en el fondo, un deslizamiento habilitado), se cerrara o no. |

En la web, incrustar con `dialogs: "viewport"` presenta la hoja y su fondo sobre la página anfitriona,
incluido un iframe del mismo origen. Los marcos de origen cruzado usan [`hostPlayerFrame`](../docs/web.md#embed-it-in-a-page).
