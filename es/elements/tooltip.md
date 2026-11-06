---
title: "Tooltip"
description: "El componente Tooltip: una indicación sobre el elemento en el que se encuentra, que se muestra en los escritorios cuando el puntero se detiene sobre él, con el estilo definido por la aplicación."
group: base
demo: el-tooltip
source_hash: bc1733626637e39f
---


# Tooltip

Un tooltip es una pista breve junto a aquello a lo que se refiere: lo que hace un botón de icono, el texto completo de una etiqueta truncada.
En escritorio y en navegadores de escritorio aparece cuando el puntero ha permanecido sobre su disparador durante `delay` (500 ms), y
se oculta cuando el puntero sale o pulsa el disparador. Los teléfonos y las tabletas solo muestran un tooltip cuando la app lo abre
(`open`). Nunca captura el puntero ni las pulsaciones, por lo que el disparador funciona exactamente igual que sin él.

`Tooltip` de [`nsh/base`](../modules/nsh-base.md) se pasa como la prop `tooltip` que tiene todo elemento
([Props comunes](index.md#tooltips)), como el `.tooltip(..)` de GPUI: el elemento es sobre el que descansa el puntero y aquel respecto al cual
se coloca. El tooltip en sí es la burbuja: se estiliza con `class` / `style`, y sus hijos son lo que dice.

```rust tabs
use nsh_base::tooltip;
use nsh_core::prelude::*;

fn save_button(on_save: impl Fn() + 'static) -> impl IntoElement {
    view()
        .on_press(on_save)
        .accessibility_label("Save")
        .p_2()
        .child(text("💾"))
        .tooltip(
            tooltip()
                .placement(Placement::Bottom)
                .rounded_md()
                .bg(rgb(0x111827))
                .px_2()
                .py_1()
                .child(text("Save the document").text_color(white())),
        )
}
```

```tsx tabs
import { Text, View } from "nsh";
import { Tooltip } from "nsh/base";

function SaveButton(props: { onSave: () => void }) {
  return (
    <View
      onPress={props.onSave}
      accessibilityLabel="Save"
      class="p-2"
      tooltip={
        <Tooltip placement="bottom" class="rounded-md bg-gray-900 px-2 py-1">
          <Text class="text-white">Save the document</Text>
        </Tooltip>
      }
    >
      <Text>💾</Text>
    </View>
  );
}
```

Por defecto se coloca encima de su disparador (`placement`), en el lado opuesto cuando no hay espacio, y permanece dentro del área
segura. Con `open` la app decide cuándo se muestra: sigue a `onOpenChange`, que informa de que el puntero descansa sobre el
disparador o lo abandona, y puede mostrarse en cualquier dispositivo.

Aparece y desaparece con tus transiciones: `startingClass` es su aspecto en el primer fotograma y `endingClass` su aspecto
una vez oculto, que conserva mientras se ejecutan las clases `transition-*` de su `class`; a continuación viene `onClose`.

```tsx
<Tooltip
  class="rounded-md bg-gray-900 px-2 py-1 transition-opacity duration-100"
  startingClass="opacity-0"
  endingClass="opacity-0"
>
  <Text class="text-white">Save the document</Text>
</Tooltip>
```

## Props

| Prop | Rust | Tipo | Valor por defecto | Descripción |
|---|---|---|---|---|
| `children` | `.child(..)` | `JSX.Element` | ninguno | Lo que dice. |
| `class`, `style` | métodos `.app_class(..)`, `Styled` | `string`, `StyleProp<ViewStyle>` | ninguno | El aspecto de la burbuja: el propio tooltip. |
| `startingClass`, `startingStyle` | `.starting_class(..)`, `.starting_style(..)` | `string`, `StyleProp<ViewStyle>` | ninguno | Su aspecto en el primer fotograma: sus transiciones parten de él. |
| `endingClass`, `endingStyle` | `.ending_class(..)`, `.ending_style(..)` | `string`, `StyleProp<ViewStyle>` | ninguno | Su aspecto una vez oculto: se mantiene mientras se ejecutan sus transiciones. |
| `open` | `.open(..)` | `boolean` | ninguno | Mostrado, controlado por la app. |
| `defaultOpen` | `.default_open(..)` | `boolean` | `false` | Mostrado al principio, sin `open`. |
| `delay` | `.delay(..)` | `number` | `500` | Milisegundos que el puntero descansa sobre el disparador antes de que se muestre; `Infinity`: nunca por sí mismo, solo cuando la app lo abre. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Nunca se muestra. |
| `placement` | `.placement(..)` | `"top" \| "bottom" \| "left" \| "right"` | `"top"` | El lado del disparador en el que se coloca. |
| `align` | `.align(..)` | `"start" \| "center" \| "end"` | `"center"` | Cómo se alinea con el disparador a lo largo de ese lado. |
| `offset` | `.offset(..)` | `number` | `4` | El espacio entre el disparador y el tooltip. |
| `margin` | `.margin(..)` | `number` | `4` | La distancia que mantiene respecto a los bordes del área segura. |

<a id="events"></a>

## Eventos

| Evento | Rust | Descripción |
|---|---|---|
| `onOpenChange` | `.on_open_change(\|e\| ..)` | El puntero descansó sobre el disparador, o lo abandonó o lo pulsó (`reason` `"hover"`). |
| `onOpen` | `.on_open(\|\| ..)` | Se muestra. |
| `onClose` | `.on_close(\|\| ..)` | Ha desaparecido, tras su salida; también cuando la app lo ocultó. |

<a id="accessibility"></a>

## Accesibilidad

Un tooltip repite para los lectores de pantalla lo que dice su disparador: dale también un `accessibilityLabel` al disparador, de modo que la
pista esté disponible para todos.
