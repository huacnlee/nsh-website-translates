---
title: "Teclado"
description: "La variable de entorno keyboard-inset-height, Keyboard.dismiss y la altura del teclado: contenido que se mantiene por encima del teclado virtual y se mueve con él."
order: 120
group: primitives
demo: el-keyboard
source_hash: d083e22be8d06de9
---


# Teclado

`env(keyboard-inset-height)` es la altura del teclado de software sobre la superficie, y vale 0 mientras está oculto. Usado como padding o margin inferior de una vista, mantiene el contenido por encima del teclado: cuando el teclado aparece o se oculta, la vista hace espacio según su altura, y el cambio se anima de forma nativa junto con el teclado. Úsalo para contenido fuera de los scroll views, como una barra de mensajes en la parte inferior de una pantalla de chat; los inputs dentro de un [scroll view](./scroll.md) o de un [List](./list.md) se desplazan de forma nativa hasta quedar a la vista. Junto con él vienen `Keyboard.dismiss()`, que oculta el teclado, y la altura del teclado, para tus propios layouts.

```rust tabs
use nsh_core::prelude::*;

fn chat() -> impl IntoElement {
    let draft = signal(String::new());
    view()
        .flex_1()
        .bg(white())
        .pb_keyboard()
        .child(scroll().flex_1().child(text("Messages…").p_4()))
        .child(
            view()
                .flex_row()
                .gap_2()
                .p_2()
                .border_t_1()
                .border_color(rgb(0xe5e5e5))
                .child(
                    input()
                        .value(draft)
                        .on_change(move |v: &str| draft.set(v.to_owned()))
                        .placeholder("Message")
                        .flex_1()
                        .p_2(),
                ),
        )
}
```

```tsx tabs
import { mount, Scroll, signal, Text, View } from "nsh";
import { Input } from "nsh/base";

function App() {
  const draft = signal("");
  return (
    <View style={{ flex: 1, backgroundColor: "#ffffff", paddingBottom: "env(keyboard-inset-height)" }}>
      <Scroll style={{ flex: 1 }} keyboardDismissMode="interactive">
        <Text style={{ padding: 16, paddingTop: 48 }}>Messages…</Text>
      </Scroll>
      <View style={{ flexDirection: "row", gap: 8, padding: 8, borderTopWidth: 1, borderTopColor: "#e5e5e5" }}>
        <Input
          value={draft()}
          onChange={({ value }) => draft.set(value)}
          placeholder="Message"
          style={{ flex: 1, fontSize: 16, padding: 8 }}
        />
      </View>
    </View>
  );
}

mount(App);
```

La altura completa del teclado es adecuada para una vista que llega hasta el borde inferior de la pantalla, como el contenido de una pantalla. Cuando hay algo por debajo, como una tab bar, réstalo con una longitud: `calc(env(keyboard-inset-height) + -49px)` mantiene una vista por encima de una tab bar de 49 pt, y `calc(env(keyboard-inset-height) + 12px)` añade espacio sobre el teclado. Un padding es como mínimo 0.

<a id="padding-or-margin"></a>

## Padding o margin

| Estilo | Cómo hace espacio |
|---|---|
| `paddingBottom: "env(keyboard-inset-height)"` (Tailwind `pb-[env(keyboard-inset-height)]`, Rust `.pb_keyboard()`) | El contenido de arriba se reduce; el fondo sigue llegando hasta el borde inferior de la pantalla. |
| `marginBottom: "env(keyboard-inset-height)"` (Tailwind `mb-[env(keyboard-inset-height)]`, Rust `.mb_keyboard()`) | La vista completa, incluido su fondo, termina en la parte superior del teclado. |

La altura del teclado se suma a la longitud solo dentro de la misma declaración, por lo que una vista la combina con su propio espaciado en `calc()`. En Rust, `.pb_keyboard_plus(px(..))` y `.mb_keyboard_plus(px(..))` añaden una longitud.

```rust tabs
use nsh_core::prelude::*;

fn sign_in() -> impl IntoElement {
    view()
        .mb_keyboard_plus(px(-49.0))
        .flex_1()
        .p_4()
        .gap_3()
        .child(input().placeholder("E-mail").keyboard_type(KeyboardType::Email))
}
```

```tsx tabs
<View class="flex-1 gap-3 p-4 mb-[calc(env(keyboard-inset-height)+-49px)]">
  <Input placeholder="E-mail" keyboardType="email-address" class="rounded-lg border border-neutral-300 px-3 py-2" />
</View>
```

Aquí, una tab bar de 49 pt debajo de la vista ya cubre parte de la altura del teclado. Para desactivar el espacio, deja la variable fuera del estilo, por ejemplo con una condición sobre un signal.

<a id="hiding-the-keyboard"></a>

## Ocultar el teclado

`Keyboard.dismiss()`, de `nsh`, quita el foco del input enfocado, lo que oculta el teclado. Si no hay ningún input enfocado, lo deja todo como está. Los componentes de Rust llaman a `dismiss_keyboard()`.

```rust tabs
use nsh_base::button;
use nsh_core::prelude::*;

fn done() -> impl IntoElement {
    button()
        .on_press(|| dismiss_keyboard())
        .rounded_lg()
        .bg(rgb(0x2563eb))
        .px_4()
        .py_3()
        .child(text("Done").text_color(white()))
}
```

```tsx tabs
import { Text, Keyboard } from "nsh";
import { Button } from "nsh/base";

function Done() {
  return (
    <Button onPress={() => Keyboard.dismiss()} class="rounded-lg bg-blue-600 px-4 py-3 active:bg-blue-700">
      <Text class="text-center font-semibold text-white">Done</Text>
    </Button>
  );
}
```

> [!TIP]
> Para ocultar el teclado cuando el usuario arrastra un scroll view, establece `keyboardDismissMode="on-drag"` o `"interactive"` en el [scroll view](./scroll.md) o en el [List](./list.md).

<a id="the-keyboards-height"></a>

## La altura del teclado

| TSX | Rust | Devuelve |
|---|---|---|
| `keyboardFrame()` | `keyboard_height()`, `keyboard_duration()` | La altura del teclado de software sobre la superficie de NSH, en puntos (0 mientras está oculto), y la duración de su animación de aparición u ocultación, en milisegundos. |

Ambos son reactivos: un effect, una expresión JSX o un closure de estilo que los lea se vuelve a ejecutar cuando el teclado aparece, se oculta o cambia de altura.

```rust tabs
use nsh_core::prelude::*;

fn message_bar() -> impl IntoElement {
    view()
        .flex_row()
        .p_2()
        .pb(move || {
            // The home indicator's inset only matters while the keyboard is hidden.
            let home = if keyboard_height() > Points::ZERO {
                Points::ZERO
            } else {
                safe_area().bottom
            };
            px(8.0) + home
        })
        .child(input().placeholder("Message").flex_1())
}
```

```tsx tabs
import { View, keyboardFrame, safeArea } from "nsh";
import { Input } from "nsh/base";

function MessageBar() {
  const insets = safeArea();
  return (
    <View
      style={{
        flexDirection: "row",
        padding: 8,
        // The home indicator's inset only matters while the keyboard is hidden.
        paddingBottom: 8 + (keyboardFrame().height > 0 ? 0 : insets().bottom),
      }}
    >
      <Input placeholder="Message" style={{ flex: 1 }} />
    </View>
  );
}
```

La altura es la parte del teclado que se superpone a la superficie de NSH. Cuando la propia ventana se reduce por el teclado (una activity de Android que se redimensiona), o cuando NSH está incrustado en una vista que termina por encima del teclado, la altura es 0.

> [!NOTE]
> Para mantener el contenido por encima del teclado, `env(keyboard-inset-height)` es la forma más sencilla: se anima con el teclado de forma nativa, sin ejecutar código.

<a id="platform-notes"></a>

## Notas por plataforma

- **iOS**: el espacio se anima con la duración propia del teclado y una curva ease-in-ease-out.
- **Android**: cuando la ventana se reduce por el teclado (una activity que se redimensiona), el contenido ya termina por encima del teclado y la variable vale 0. Cuando el teclado se superpone a la vista, hace espacio igual que en iOS.
- **Escritorio y Mac Catalyst**: se escribe con un teclado físico; la variable vale 0 y la vista mantiene su layout.
- **Web**: la variable es la propia del navegador (la de la VirtualKeyboard API).

Consulta [Forms and keyboard](../docs/forms-and-keyboard.md) para el orden de foco, las teclas de retorno y los accesorios de input, y [Safe area](./safe-area.md) para las demás variables de entorno.
