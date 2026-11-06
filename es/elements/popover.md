---
title: "Popover"
description: "El componente Popover: contenido anclado a un activador, por encima de todo lo demás, que se cierra con el activador, una pulsación fuera, Escape y atrás, y cuyo estilo define la app."
group: base
demo: el-popover
source_hash: 49f2e25232287792
---


# Popover

Un popover muestra contenido junto a su disparador, por encima de todo lo demás: detalles, un formulario pequeño, un selector de color.
Pulsar el disparador lo abre y lo cierra; una pulsación fuera, Escape, el botón Atrás de Android y el gesto de escape de VoiceOver lo cierran. Se coloca
en un lado del disparador, pasa al otro lado cuando no hay espacio, permanece dentro del área segura y sigue al
disparador cuando este se desplaza. No dibuja nada propio: el popup y su contenido pertenecen a la app.

```rust tabs
use nsh_base::{OpenChangeReason, PopoverEvent, popover};
use nsh_core::prelude::*;

fn details() -> impl IntoElement {
    popover()
        .offset(px(6.0))
        .margin(px(8.0))
        .trigger(view().px_3().py_2().rounded_md().bg(rgb(0xe5e7eb)).child(text("Details")))
        .on_open_change(|e: &PopoverEvent| {
            if let PopoverEvent::OpenChange(open, OpenChangeReason::PressOutside) = e {
                log::info!("closed by a press outside: {open}");
            }
        })
        .child(
            view()
                .w(px(240.0))
                .gap_1()
                .p_3()
                .rounded_lg()
                .bg(white())
                .shadow_lg()
                .child(text("Order #1024").font_weight(FontWeight::SEMIBOLD))
                .child(text("Shipped yesterday, arriving Friday.")),
        )
}
```

```tsx tabs
import { Text, View } from "nsh";
import { Popover } from "nsh/base";

function Details() {
  return (
    <Popover
      offset={6}
      margin={8}
      popupClass="w-60 gap-1 rounded-lg bg-white p-3 shadow-lg"
      trigger={
        <View class="rounded-md bg-gray-200 px-3 py-2">
          <Text>Details</Text>
        </View>
      }
    >
      <Text class="font-semibold">Order #1024</Text>
      <Text>Shipped yesterday, arriving Friday.</Text>
    </Popover>
  );
}
```

`Popover` proviene de [`nsh/base`](../modules/nsh-base.md). Su contenido se crea cada vez que se abre, por lo que el estado interno
empieza de cero.

<a id="open-state"></a>

## Estado de apertura

Sin `open`, el popover mantiene su propio estado, a partir de `defaultOpen`. Con `open`, el estado pertenece a la app: cámbialo
en `onOpenChange({ open, reason })`, que informa de cada solicitud de apertura o cierre junto con su motivo (`"triggerPress"`,
`"pressOutside"`, `"cancel"`).

```tsx
const open = signal(false);

<Popover open={open()} onOpenChange={(e) => open.set(e.open)} trigger={<Text>Filters</Text>}>
  <FilterForm onApply={() => open.set(false)} />
</Popover>
```

`closeOnEscape={false}` lo mantiene abierto con Escape y Atrás (`onCancel` sigue recibiéndolos, para preguntar antes);
`closeOnPressOutside={false}` lo mantiene abierto ante pulsaciones fuera.

<a id="phones-and-desktops"></a>

## Teléfonos y escritorios

Un popover está anclado a su disparador en todos los dispositivos: lo que muestra pertenece junto a lo que lo abrió.

- En los escritorios y en los navegadores de escritorio, una pulsación fuera lo cierra y continúa hacia lo que hay bajo el puntero, de modo que
  un solo clic cierra el popover y además pulsa el botón sobre el que cayó.
- En teléfonos y tabletas, una pulsación fuera solo lo cierra: un fondo transparente captura la pulsación, como hacen los
  popovers del sistema.

Para una lista de acciones usa un [Menu](./menu.md), que se convierte en una hoja en los teléfonos; para un panel usa un [Sheet](./sheet.md).

<a id="entrance-and-exit"></a>

## Entrada y salida

Un popover aparece y desaparece con tus transiciones. `popupStartingClass` es el aspecto del popup en su primer fotograma, y las
clases `transition-*` de `popupClass` lo llevan a su aspecto propio: su entrada. `popupEndingClass` es su aspecto una vez
cerrado: el popover permanece, sin recibir pulsaciones, mientras se ejecutan esas transiciones, y luego desaparece, y `onClose` lo sigue. Si se abre
de nuevo mientras sale, vuelve a su aspecto desde donde se encuentra. `popupStartingStyle` y `popupEndingStyle` hacen lo mismo
con estilos en línea. Cuando el usuario pide menos movimiento, aparece y desaparece de inmediato.

```tsx
<Popover
  popupClass="rounded-lg bg-white p-3 shadow-lg transition-all duration-150 ease-out"
  popupStartingClass="opacity-0 scale-95"
  popupEndingClass="opacity-0 scale-95"
  onPosition={({ placement }) => side.set(placement)}
  trigger={<Text>Details</Text>}
>
  <OrderSummary />
</Popover>
```

`onPosition({ placement, bounds, available })` indica dónde quedó el popup: el lado del disparador (el otro cuando
`placement` no tenía espacio), su marco y el espacio disponible en ese lado, de modo que una flecha o una entrada puedan apuntar al disparador.

## Props

| Prop | Rust | Tipo | Valor por defecto | Descripción |
|---|---|---|---|---|
| `open` | `.open(..)` | `boolean` | ninguno | Abierto, controlado por la app. |
| `defaultOpen` | `.default_open(..)` | `boolean` | `false` | Abierto al inicio, sin `open`. |
| `placement` | `.placement(..)` | `"top" \| "bottom" \| "left" \| "right"` | `"bottom"` | El lado del disparador en el que se coloca. |
| `align` | `.align(..)` | `"start" \| "center" \| "end"` | `"center"` | Cómo se alinea con el disparador a lo largo de ese lado. |
| `offset` | `.offset(..)` | `number` | `0` | El espacio entre el disparador y el popup. |
| `margin` | `.margin(..)` | `number` | `0` | La distancia que mantiene respecto a los bordes del área segura. |
| `closeOnEscape` | `.close_on_escape(..)` | `boolean` | `true` | Escape y el botón Atrás de Android lo cierran. |
| `closeOnPressOutside` | `.close_on_press_outside(..)` | `boolean` | `true` | Una pulsación fuera lo cierra. |
| `popupClass`, `popupStyle` | `.popup_class(..)`, `.popup_style(..)` | `string`, `StyleProp<ViewStyle>` | ninguno | El aspecto del popup, la caja en la que está el contenido. |
| `popupStartingClass`, `popupStartingStyle` | `.popup_starting_class(..)`, `.popup_starting_style(..)` | `string`, `StyleProp<ViewStyle>` | ninguno | El aspecto del popup en su primer fotograma, sobre el propio: sus transiciones parten de él. |
| `popupEndingClass`, `popupEndingStyle` | `.popup_ending_class(..)`, `.popup_ending_style(..)` | `string`, `StyleProp<ViewStyle>` | ninguno | El aspecto del popup una vez cerrado, sobre el propio: permanece mientras se ejecutan sus transiciones. |
| `trigger` | `.trigger(..)` | `JSX.Element` | ninguno | Lo que lo abre; el popup se coloca respecto a él. Mientras el popover está abierto se aplican sus clases `aria-expanded:` y `expandedStyle`. |
| `children` | `.child(..)` | `JSX.Element` | ninguno | El contenido. |

<a id="events"></a>

## Eventos

| Evento | Rust | Descripción |
|---|---|---|
| `onOpenChange` | `.on_open_change(\|e\| ..)` | Se abrió o se cerró, con el motivo: `"triggerPress"`, `"pressOutside"` o `"cancel"`. |
| `onOpen` | `.on_open(\|\| ..)` | Se muestra. |
| `onClose` | `.on_close(\|\| ..)` | Ya no está, tras su salida; también cuando la app lo cerró. |
| `onCancel` | `.on_cancel(\|\| ..)` | El usuario intentó cerrarlo (Escape o Atrás, una pulsación fuera), se haya cerrado o no. |
| `onPosition` | `.on_position(\|e\| ..)` | El popup fue colocado: `placement` (el lado en el que quedó), `bounds` (su marco), `available` (el espacio disponible en ese lado). |

<a id="accessibility"></a>

## Accesibilidad

El disparador indica a los lectores de pantalla si el popover está expandido. Escape y el botón Atrás lo cierran, como los usuarios esperan
de un popup. En TSX el disparador es el elemento que pasas, un `Button` o una vista propia: recibe las pulsaciones y el
estado expandido por sí mismo, por lo que sus propias clases `active:` y `activeStyle` se muestran mientras está pulsado, y su propio `onPress`
también se ejecuta.
