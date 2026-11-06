---
title: "Selección de texto"
description: "Vistas seleccionables: una única selección a través de los textos dentro de una vista, entre vistas, elementos Text y TextViews, del mismo modo que se seleccionan los textos de una página web."
order: 130
group: primitives
demo: el-text-selection
source_hash: d63cc3aa84e5eab5
---


# Selección de texto

A [`View`](./view.md) con `selectable` hace que los textos que contiene se seleccionen juntos, como los de una página web: una selección va desde un punto de un texto hasta un punto de otro, a través de vistas, elementos [`Text`](./text.md) y [`TextView`](./text-view.md), en orden de lectura. Si haces seleccionable la transcripción de un chat, una selección puede empezar en un mensaje y terminar en el siguiente; Copiar coloca el texto seleccionado en el portapapeles, con los textos situados uno al lado del otro unidos por un tabulador y los demás por un salto de línea. En Rust se activa con `view().selectable(true)`, en TSX con `<View selectable>`; que un texto individual pueda seleccionarse depende de su estilo `userSelect`.

```rust tabs
use nsh_base::text_view;
use nsh_core::prelude::*;

fn release_notes(notes: &'static str) -> impl IntoElement {
    view()
        .selectable(true)
        .gap_3()
        .p_4()
        .child(text("Release notes").font_weight(FontWeight::SEMIBOLD))
        .child(text_view().markdown(notes))
        .child(
            view()
                .flex_row()
                .gap_2()
                .child(text("Updated").select_none().text_color(rgb(0x737373)))
                .child(text("October 21")),
        )
}
```

```tsx tabs
import { Text, View } from "nsh";
import { TextView } from "nsh/base";

function ReleaseNotes(props: { notes: string }) {
  return (
    <View selectable class="gap-3 p-4">
      <Text class="font-semibold">Release notes</Text>
      <TextView markdown={props.notes} />
      <View class="flex-row gap-2">
        <Text style={{ userSelect: "none" }} class="text-neutral-500">Updated</Text>
        <Text>October 21</Text>
      </View>
    </View>
  );
}
```

El diseño y el aspecto de la vista son los estilos de la app, y su contenido son sus hijos. La selección en sí es de la plataforma: la vista no dibuja nada propio para ella.

<a id="a-chat-transcript"></a>

## Una transcripción de chat

Una transcripción dentro de una sola vista seleccionable se selecciona como una única página: un arrastre empieza en una respuesta y termina en otra, y Copiar toma el texto de todos los mensajes intermedios.

```rust tabs
use nsh_base::text_view;
use nsh_core::prelude::*;

fn transcript(replies: Signal<Vec<SharedString>>) -> impl IntoElement {
    scroll().flex_1().child(
        view().selectable(true).p_4().gap_4().child(each(
            replies,
            |reply: &SharedString| reply.clone(),
            |reply, _index| text_view().markdown(move || reply.get()),
        )),
    )
}
```

```tsx tabs
import { Scroll, View } from "nsh";
import { TextView } from "nsh/base";

<Scroll class="flex-1">
  <View selectable class="gap-4 p-4">
    <Each of={replies}>{(reply) => <TextView markdown={reply()} />}</Each>
  </View>
</Scroll>
```

<a id="how-a-selection-is-made"></a>

## Cómo se hace una selección

| Plataforma | Cómo se hace una selección |
|---|---|
| macOS, Windows, Linux, GPUI | Arrastra a través de los textos; un doble clic selecciona una palabra, un triple clic un párrafo, y un arrastre después de ellos continúa por palabras o párrafos. Shift+clic amplía la selección. Ctrl / Cmd+A selecciona todo en la vista, Ctrl / Cmd+C copia, Escape o una pulsación fuera la borra. |
| iOS, Android | Una pulsación larga selecciona una palabra; los controles de la plataforma la amplían, y su menú de edición tiene Copiar y Seleccionar todo. |
| Web | La selección propia del navegador, con sus gestos, su menú y sus atajos. |

<a id="what-it-selects"></a>

## Qué selecciona

- **Textos que quedan fuera**: un texto con `userSelect: "none"` (`.select_none()` en Rust, la clase `select-none`; una etiqueta, el título de un botón) queda excluido de la selección y de sus gestos.
- **Vistas anidadas**: una vista seleccionable dentro de otra forma parte de la exterior, de modo que una sola selección abarca ambas.
- **TextView**: un [`TextView`](./text-view.md) con `selectable` se selecciona por su cuenta: sus párrafos, elementos de lista, celdas y bloques de código se seleccionan juntos. Dentro de una vista seleccionable se une a la selección exterior.
- **Textos individuales**: un texto con `userSelect: "text"` que no está en ninguna vista seleccionable se selecciona por sí solo, como describe [Text](./text.md#props).
- **El aspecto** es el resaltado de la plataforma en el `selectionColor` de cada texto (`selection:text-*`).
- **Listas**: en un [List](./list.md) virtualizado, una selección abarca las filas que están montadas; las filas recicladas fuera de la vista salen de ella.

<a id="related"></a>

## Relacionado

- [View](./view.md): la prop `selectable`.
- [Text](./text.md): `userSelect`, `selectionColor` y la selección de un texto individual.
- [TextView](./text-view.md): documentos cuyos bloques se seleccionan como uno solo.
