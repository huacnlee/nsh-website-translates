---
title: "Collapsible"
description: "El componente Collapsible: una región cuyo contenido se expande y se contrae, se muestra después de sus hijos mientras la app lo mantiene abierto, se revela con una altura elástica cuando se solicita, y deja el disparador y todo el aspecto visual en manos de la app."
group: base
demo: el-collapsible
source_hash: cf0c6bafa8f80920
---


# Collapsible

Un collapsible es una región cuyo contenido se expande y se contrae: detalles bajo un resumen, un "mostrar más", una sección de ajustes avanzados. Renderiza siempre a sus hijos y, después de ellos, su `content` mientras `open`. La app es dueña de `open` y del disparador que lo cambia (uno de los hijos), y el aspecto es de la app: un `Collapsible` no tiene disparador, chevron ni etiqueta propios. Con `reveal`, el contenido se abre y se cierra con movimiento: la altura de su región pasa con un efecto de resorte de cero a la altura del propio contenido y viceversa, y lo que sigue al collapsible se mueve con él.

```rust tabs
use nsh_base::{collapsible, theme};
use nsh_core::{AccessibilityState, prelude::*};

fn storage() -> impl IntoElement {
    let open = signal(false);
    collapsible()
        .open(open)
        .reveal(true)
        .gap_2()
        .child(
            view()
                .role(AccessibilityRole::Button)
                .accessibility_state(move || AccessibilityState {
                    expanded: Some(open.get()),
                    ..AccessibilityState::default()
                })
                .on_press(move || open.update(|o| *o = !*o))
                .flex_row()
                .items_center()
                .justify_between()
                .child(text("Storage"))
                .child(text("›").transition_transform().rotate(move || {
                    if open.get() { deg(90.0) } else { deg(0.0) }
                })),
        )
        .content(text("Photos 120 GB · Apps 54 GB · System 38 GB").text_color(move || theme().muted_foreground))
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { Collapsible } from "nsh/base";

function App() {
  const open = signal(false);
  return (
    <Collapsible
      open={open()}
      reveal
      class="gap-2"
      content={<Text class="text-muted-foreground">Photos 120 GB · Apps 54 GB · System 38 GB</Text>}
    >
      <View
        role="button"
        accessibilityState={{ expanded: open() }}
        onPress={() => open.set(!open())}
        class="flex-row items-center justify-between active:opacity-70"
      >
        <Text class="font-medium">Storage</Text>
        <Text class={`transition-transform ${open() ? "rotate-90" : ""}`}>›</Text>
      </View>
    </Collapsible>
  );
}

mount(App);
```

`Collapsible` proviene de [`nsh/base`](../modules/nsh-base.md), el crate `nsh-base` de Rust. El valor es de la app: su disparador cambia `open`, y el collapsible muestra el valor que la app le pasa. En Rust, `collapsible()` crea uno con un setter por cada prop (`.open(..)`, `.reveal(..)`, `.content(..)`), los métodos de estilo tipados para la región y `.child(..)` para lo que se muestra siempre.

## Props

| Prop | Rust | Tipo | Valor por defecto | Descripción |
|---|---|---|---|---|
| `open` | `.open(..)` | `boolean` | `false` | Expandido: el `content` está en el árbol, después de los hijos. El valor es de la app. |
| `reveal` | `.reveal(..)` | `boolean` | `false` | Se abre y se cierra con una revelación: el contenido está en una región que lo recorta, cuya altura pasa con efecto de resorte de cero a la del propio contenido cuando `open` se activa, y vuelve cuando se desactiva, con amortiguamiento crítico (unos 265 ms, sin rebote). Lo que sigue al collapsible se mueve con él, y el contenido permanece en el árbol hasta que la región se ha cerrado. Con movimiento reducido se abre y se cierra de inmediato. La región también está en el layout cuando está cerrada, con altura cero, así que un `gap` del collapsible va también antes de ella. |
| `content` | `.content(..)` | `JSX.Element` | ninguno | Lo que se expande. Se crea una sola vez y se conserva mientras está contraído, de modo que lo que hay dentro mantiene su estado (el texto de un input, una posición de scroll, un switch) de una apertura a la siguiente. |
| `children` | `.child(..)` | `JSX.Element` | ninguno | Lo que se muestra en cualquier caso: un resumen, el disparador que cambia `open`. |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | ninguno | La región alrededor de los hijos y del contenido (`gap-2` los separa). |

<a id="events"></a>

## Eventos

Un collapsible no informa de nada por sí mismo: el disparador es de la app, y su pulsación (`onPress` del `View` con `role="button"`) es donde la app cambia `open`.

<a id="parts"></a>

## Partes

| Parte | Dentro de | Estilo con |
|---|---|---|
| La región | | `class`, `style` |
| Los hijos | la región, primero | sus propios elementos |
| La región de la revelación | la región, después de los hijos, con `reveal` | ninguno: recorta el contenido y toma su altura |
| El contenido | la región, después de los hijos (en la región de la revelación con `reveal`), mientras `open` | sus propios elementos (`content`) |

Sin `reveal`, el contenido aparece y desaparece de inmediato, y cada plataforma vuelve a calcular el layout de la región cuando llega o se va. Con `reveal`, el cambio es una animación de layout del commit que cambia `open` (como `LayoutAnimation.configureNext`, ejecutada de forma nativa, por lo que no se ejecuta JavaScript mientras se mueve): la región de la revelación crece de cero a la altura del contenido y se encoge de nuevo, y los frames de todo lo que mueve el mismo cambio, entre ellos las vistas posteriores al collapsible, se mueven con ella. Una transición de la app la acompaña: el chevron del disparador gira (`transition-transform`), y el contenido puede aparecer con un fundido mediante sus propias clases.

<a id="accessibility"></a>

## Accesibilidad

- La región no es un elemento propio para los lectores de pantalla: sus hijos y su contenido se leen tal como son.
- El disparador indica si la región está expandida: asígnale `accessibilityState={{ expanded: open }}` y un rol de botón (`role="button"` en un `View`), y los lectores de pantalla anuncian "expandido" o "contraído" junto con su etiqueta.
- En macOS y en la web, el disparador es una parada del foco de teclado cuando recibe pulsaciones: Tab llega hasta él, y Espacio y Retorno cambian la región.

Consulta [Accesibilidad](../docs/accessibility.md) para etiquetas, roles y anuncios en general.

<a id="platform-notes"></a>

## Notas por plataforma

- Todas las plataformas muestran el contenido después de los hijos mientras `open`, y lo dejan fuera del layout en caso contrario.
- Con `reveal`, todas las plataformas aplican el efecto de resorte a la altura de la región con su propio animador (iOS, Android, macOS, Windows, Linux, GPUI y la web), y la abren y la cierran de inmediato mientras el sistema solicita movimiento reducido.
- iOS, Android y Mac Catalyst: la pulsación del disparador es un tap. Escritorio (macOS, Windows, Linux, GPUI) y la web: un clic, y Espacio o Retorno sobre el disparador con foco en macOS y la web.
