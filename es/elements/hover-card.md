---
title: "HoverCard"
description: "El componente HoverCard: una vista previa de aquello a lo que apunta su disparador, que se muestra mientras el puntero permanece sobre el disparador, con el estilo definido por la aplicación."
group: base
demo: el-hover-card
source_hash: 30e2d3b34842945d
---


# HoverCard

Una hover card muestra una vista previa de lo que señala su disparador sin salir de la página: el perfil detrás de una mención, la página detrás de un enlace, la cotización detrás de un símbolo bursátil. En escritorio y en los navegadores de escritorio se abre cuando el puntero ha permanecido sobre el disparador durante `openDelay` (600 ms), o cuando el foco del teclado llega al disparador. Permanece abierta mientras el puntero pasa del disparador a la tarjeta y viceversa, y mientras el foco del teclado está en el disparador o en un enlace o botón de la tarjeta, de modo que todo lo que contiene la tarjeta se puede usar tanto con el puntero como con el teclado. Se cierra `closeDelay` (300 ms) después de que el puntero haya salido de ambos y el foco no esté en ninguno de los dos. Escape y una pulsación fuera la cierran de inmediato. En teléfonos y tabletas, una pulsación sobre el disparador la abre y la cierra, y una pulsación fuera la cierra.

`HoverCard` de [`nsh/base`](../modules/nsh-base.md) no dibuja nada por sí mismo: el disparador es tu elemento, y el popup y su contenido también son tuyos.

```rust tabs
use nsh_base::hover_card;
use nsh_core::prelude::*;

fn mention() -> impl IntoElement {
    hover_card()
        .offset(px(8.0))
        .popup_class("w-72 gap-2 rounded-xl border border-border bg-popover p-4 shadow-lg")
        .trigger(text("@ada").text_color(rgb(0x2563eb)))
        .child(text("Ada Lovelace").font_weight(FontWeight::SEMIBOLD))
        .child(text("Writes the first programs for the Analytical Engine."))
}
```

```tsx tabs
import { Text } from "nsh";
import { HoverCard } from "nsh/base";

function Mention() {
  return (
    <HoverCard
      offset={8}
      popupClass="w-72 gap-2 rounded-xl border border-border bg-popover p-4 shadow-lg"
      trigger={<Text class="text-blue-600">@ada</Text>}
    >
      <Text class="font-semibold">Ada Lovelace</Text>
      <Text>Writes the first programs for the Analytical Engine.</Text>
    </HoverCard>
  );
}
```

El disparador conserva su propio rol, sus pulsaciones y su aspecto: una vista con `role="link"` y su propio `onPress` sigue yendo adonde iría al pulsarla, y la tarjeta le añade una vista previa. El contenido se crea cada vez que se abre la tarjeta, por lo que puede cargar en ese momento lo que muestra. En teléfonos y tabletas, donde una pulsación abre la tarjeta, el disparador indica a los lectores de pantalla si su tarjeta está abierta. En una [Toolbar](./toolbar.md) el disparador puede ser uno de sus elementos; lo que muestra la tarjeta no lo es: sus botones y enlaces conservan sus propias paradas de Tab y el `disabled` de la barra de herramientas no las modifica.

<a id="delays"></a>

## Retardos

`openDelay` evita que la tarjeta se abra de golpe cuando el puntero cruza el disparador de camino a otro sitio; `closeDelay` da tiempo al puntero para cruzar el espacio entre el disparador y la tarjeta. Ambos se expresan en milisegundos. El puntero y los retardos se gestionan de forma nativa, así que permanecer sobre un disparador y moverse entre él y la tarjeta no ejecutan nada de tu código hasta que la tarjeta se abre o se cierra. Un `openDelay` de `Infinity` deja la apertura en manos de la app (y de una pulsación en una pantalla táctil); un `closeDelay` de `Infinity` deja el cierre en manos de Escape, de una pulsación fuera y de la app.

```tsx
<HoverCard openDelay={300} closeDelay={150} trigger={<Text>AAPL</Text>}>
  <Quote symbol="AAPL" />
</HoverCard>
```

<a id="open-state"></a>

## Estado de apertura

Sin `open`, la tarjeta mantiene su propio estado, que empieza en `defaultOpen`. Con `open`, el estado pertenece a la app: cámbialo en `onOpenChange({ open, reason })`, que informa de cada solicitud de apertura o cierre junto con su motivo: `"hover"` (el puntero), `"focus"` (el foco del teclado), `"triggerPress"` (una pulsación en una pantalla táctil), `"pressOutside"` o `"cancel"` (Escape o atrás).

```tsx
const open = signal(false);

<HoverCard open={open()} onOpenChange={(e) => open.set(e.open)} trigger={<Text>@ada</Text>}>
  <Profile id="ada" />
</HoverCard>
```

<a id="entrance-and-exit"></a>

## Entrada y salida

Una hover card aparece y desaparece con tus transiciones, como lo hace un [Popover](./popover.md). `popupStartingClass` es el aspecto del popup en su primer fotograma, y las clases `transition-*` de `popupClass` lo llevan hasta su propio aspecto. `popupEndingClass` es su aspecto una vez cerrado: la tarjeta permanece, sin recibir el puntero, mientras se ejecutan esas transiciones, y luego desaparece, y a continuación llega `onClose`. Si el puntero vuelve a posarse sobre el disparador mientras desaparece, la tarjeta se recupera. Cuando el usuario pide menos movimiento, aparece y desaparece de inmediato.

```tsx
<HoverCard
  popupClass="rounded-xl bg-popover p-4 shadow-lg transition-all duration-150 ease-out"
  popupStartingClass="opacity-0 scale-95"
  popupEndingClass="opacity-0 scale-95"
  trigger={<Text>@ada</Text>}
>
  <Profile id="ada" />
</HoverCard>
```

Por defecto se coloca debajo del disparador (`placement`, `align`), en el lado contrario cuando no hay espacio, y se mantiene dentro del área segura. `onPosition({ placement, bounds, available })` indica dónde se colocó.

## Props

| Prop | Rust | Tipo | Valor por defecto | Descripción |
|---|---|---|---|---|
| `open` | `.open(..)` | `boolean` | ninguno | Abierta, controlada por la app. |
| `defaultOpen` | `.default_open(..)` | `boolean` | `false` | Abierta al inicio, sin `open`. |
| `openDelay` | `.open_delay(..)` | `number` | `600` | Milisegundos que el puntero permanece sobre el disparador, o que el foco permanece en él, antes de que se abra; `Infinity`: nunca por sí sola. |
| `closeDelay` | `.close_delay(..)` | `number` | `300` | Milisegundos que el puntero está lejos del disparador y de la tarjeta, con el foco en ninguno de los dos, antes de que se cierre; `Infinity`: nunca por sí sola. |
| `placement` | `.placement(..)` | `"top" \| "bottom" \| "left" \| "right"` | `"bottom"` | El lado del disparador en el que se coloca. |
| `align` | `.align(..)` | `"start" \| "center" \| "end"` | `"center"` | Cómo se alinea con el disparador a lo largo de ese lado. |
| `offset` | `.offset(..)` | `number` | `0` | El espacio entre el disparador y la tarjeta. |
| `margin` | `.margin(..)` | `number` | `0` | La distancia que mantiene respecto a los bordes del área segura. |
| `popupClass`, `popupStyle` | `.popup_class(..)`, `.popup_style(..)` | `string`, `StyleProp<ViewStyle>` | ninguno | El aspecto del popup, la tarjeta en la que está el contenido. |
| `popupStartingClass`, `popupStartingStyle` | `.popup_starting_class(..)`, `.popup_starting_style(..)` | `string`, `StyleProp<ViewStyle>` | ninguno | El aspecto del popup en su primer fotograma, sobre el propio: sus transiciones parten de él. |
| `popupEndingClass`, `popupEndingStyle` | `.popup_ending_class(..)`, `.popup_ending_style(..)` | `string`, `StyleProp<ViewStyle>` | ninguno | El aspecto del popup una vez cerrado, sobre el propio: permanece mientras se ejecutan sus transiciones. |
| `trigger` | `.trigger(..)` | `JSX.Element` | ninguno | Lo que previsualiza; la tarjeta se coloca con respecto a él. |
| `children` | `.child(..)` | `JSX.Element` | ninguno | El contenido, creado cada vez que se abre. |

<a id="events"></a>

## Eventos

| Evento | Rust | Descripción |
|---|---|---|
| `onOpenChange` | `.on_open_change(\|e\| ..)` | Solicita abrirse o cerrarse, indicando el motivo: `"hover"`, `"focus"`, `"triggerPress"`, `"pressOutside"` o `"cancel"`. |
| `onOpen` | `.on_open(\|\| ..)` | Se muestra. |
| `onClose` | `.on_close(\|\| ..)` | Ha desaparecido, tras su salida; también cuando la app la cerró. |
| `onPosition` | `.on_position(\|e\| ..)` | El popup se ha colocado: `placement` (el lado en el que se colocó), `bounds` (su marco), `available` (el espacio disponible en ese lado). |

<a id="accessibility"></a>

## Accesibilidad

Una hover card añade comportamiento a su disparador: el disparador conserva su rol y su etiqueta, y lo que abre o hace al pulsarlo sigue igual. Los usuarios de teclado obtienen la tarjeta cuando el foco permanece en el disparador, y Escape la cierra. La tarjeta no toma el foco por sí misma, así que Tab sigue avanzando desde el disparador como antes. Los enlaces y botones de la tarjeta reciben el foco como en cualquier otro lugar, y la tarjeta permanece abierta mientras uno de ellos lo tiene; lo que importa en la tarjeta también debería poder alcanzarse desde la página a la que lleva el disparador.
