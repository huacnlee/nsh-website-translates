---
title: "Toggle"
description: "Toggle y ToggleGroup: un botón que está activado o desactivado, y una barra de herramientas con varios de ellos. Cada Toggle se encarga de las pulsaciones, la activación con el teclado, el estado deshabilitado, y de su rol y su estado de pulsado para los lectores de pantalla; el grupo es una barra de herramientas con una sola parada del foco del teclado; el aspecto y cuáles Toggle están pulsados dependen de la aplicación."
group: base
demo: el-toggle
source_hash: d8d3727dd9d04426
---


# Toggle

Un toggle es un botón que permanece activado o desactivado: la negrita en una barra de herramientas de texto, una estrella de favoritos, una opción de vista. `Toggle` se encarga del comportamiento de uno: pulsaciones, activación con el teclado, el estado deshabilitado y el rol de botón con su estado de pulsado para los lectores de pantalla, que lo anuncian como un botón de alternancia. Un `ToggleGroup` alrededor de varios es una barra de herramientas: los lectores de pantalla la anuncian como tal, y el teclado llega a ella en una sola parada y se mueve entre sus toggles con las teclas de flecha. El aspecto es el de la app: un toggle no tiene colores, tamaños, icono ni etiqueta propios. Sus hijos son el icono o la etiqueta de la app, y las clases `aria-pressed:` en el toggle, o las clases `group-aria-pressed:` en lo que contiene, siguen su estado.

```rust tabs
use nsh_base::{theme, toggle, toggle_group};
use nsh_core::prelude::*;

fn formatting() -> impl IntoElement {
    let bold = signal(true);
    let italic = signal(false);
    let item = move |label: &'static str, on: Signal<bool>| {
        toggle()
            .pressed(on)
            .accessibility_label(label)
            .on_change(move |pressed: &bool| on.set(*pressed))
            .size_8()
            .items_center()
            .justify_center()
            .rounded(move || theme().radius)
            .pressed_style(|s| s.bg(move || theme().accent))
            .child(text(&label[..1]).text_sm().text_color(move || {
                if on.get() { theme().accent_foreground } else { theme().muted_foreground }
            }))
    };
    toggle_group()
        .flex_row()
        .self_start()
        .gap_1()
        .child(item("Bold", bold))
        .child(item("Italic", italic))
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { Toggle, ToggleGroup } from "nsh/base";

function App() {
  const marks = signal<string[]>(["bold"]);
  const item = (value: string, label: string) => (
    <Toggle
      pressed={marks().includes(value)}
      accessibilityLabel={label}
      onChange={({ pressed }) =>
        marks.set(pressed ? [...marks(), value] : marks().filter((m) => m !== value))
      }
      class="group size-8 items-center justify-center rounded-(--radius) aria-pressed:bg-accent"
    >
      <Text class="text-sm text-muted-foreground group-aria-pressed:text-accent-foreground">{label[0]}</Text>
    </Toggle>
  );
  return (
    <ToggleGroup class="flex-row self-start gap-1">
      {item("bold", "Bold")}
      {item("italic", "Italic")}
    </ToggleGroup>
  );
}

mount(App);
```

`Toggle` y `ToggleGroup` provienen de [`nsh/base`](../modules/nsh-base.md), el crate `nsh-base` en Rust. El valor pertenece a la app: a cada toggle se le dice si está pulsado, una pulsación informa del valor que solicita con `onChange`, y el toggle muestra el `pressed` que la app le devuelve. El grupo tampoco guarda ningún valor, así que cuántos toggles pueden estar pulsados también depende de la app: cualquier cantidad (negrita, cursiva y subrayado), o exactamente uno (una alineación, un selector de vistas), donde la app pulsa el toggle solicitado, suelta los demás y mantiene pulsado el que ya lo estaba. En Rust, `toggle()` y `toggle_group()` los crean, con un setter por prop (`.pressed(..)`), un listener por evento (`.on_change(..)`), los métodos de estilo tipados y `.child(..)` para su contenido.

## Props

### Toggle

| Prop | Rust | Tipo | Valor por defecto | Descripción |
|---|---|---|---|---|
| `pressed` | `.pressed(..)` | `boolean` | `false` | Activado o desactivado: los lectores de pantalla indican que está pulsado, y se aplican los estilos `aria-pressed:`. Una pulsación informa del otro valor con `onChange`; el toggle muestra el valor que la app le devuelve. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Sin pulsaciones ni respuesta visual al pulsar; se aplican los estilos `disabled:`, y los lectores de pantalla indican que está atenuado. Un toggle dentro de un `ToggleGroup` deshabilitado también queda deshabilitado. |
| `pressedStyle` | `.pressed_style(\|s\| ..)` | `StyleProp<ViewStyle>` | ninguno | El estilo del toggle mientras está pulsado y no deshabilitado, como clases `aria-pressed:`. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | ninguno | Lo que dicen los lectores de pantalla: lo que activa el toggle, cuando sus hijos no tienen texto que lo diga (un icono). |
| `hitSlop` | `.hit_slop(..)` | `number \| Partial<Edges>` | ninguno | Hasta qué distancia fuera de sus límites siguen contando las pulsaciones, en puntos: un número para todos los lados, o los lados por nombre. Como el `hitSlop` de una vista. |
| `children` | `.child(..)` | `JSX.Element` | ninguno | El icono o la etiqueta de la app, que los lectores de pantalla leen. |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | ninguno | El propio toggle: la superficie que rodea su contenido. |
| `activeStyle`, `hoverStyle`, `focusStyle`, `disabledStyle` | `.active(\|s\| ..)`, `.hover(..)`, `.focus(..)`, `.disabled_style(..)` | `StyleProp<ViewStyle>` | ninguno | El estilo del toggle mientras hay una pulsación en curso, con el cursor encima, con el foco o deshabilitado, como las clases `<state>:`. |

### ToggleGroup

| Prop | Rust | Tipo | Valor por defecto | Descripción |
|---|---|---|---|---|
| `disabled` | `.disabled(..)` | `boolean` | `false` | Todos los toggles del grupo quedan deshabilitados, sea cual sea su propio `disabled`. |
| `children` | `.child(..)` | `JSX.Element` | ninguno | Los toggles del grupo, y lo que la app disponga entre ellos (un separador). |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | ninguno | El diseño y el aspecto del grupo: una columna por defecto, `flex-row` para una fila. |

<a id="events"></a>

## Eventos

| Evento | Rust | Descripción |
|---|---|---|
| `onChange` (`Toggle`) | `.on_change(\|pressed: &bool\| ..)` | Se pulsó el toggle: un toque, un clic, Espacio o Return mientras tiene el foco del teclado, o la activación de un lector de pantalla. `{ pressed }` es el valor que solicita, el opuesto de `pressed`. Se ejecuta antes de que cambie nada: el toggle muestra el `pressed` que la app le devuelve. |

Una tecla de flecha de un `ToggleGroup` solo mueve el foco del teclado: no pulsa nada. Un toggle deshabilitado no informa de nada.

<a id="parts"></a>

## Partes

| Parte | Dentro de | Estilizado con | Estados |
|---|---|---|---|
| El grupo | | `ToggleGroup`: `class`, `style` | |
| El toggle | el grupo, o cualquier lugar | `Toggle`: `class`, `style` | `aria-pressed:`, `disabled:`, `active:`, `hover:`, `focus:` (o `pressedStyle`, `disabledStyle`, ...) |
| El icono o la etiqueta | el toggle | sus propios elementos (`children`) | `group-aria-pressed:`, `group-disabled:` y las demás variantes `group-*:` con `group` en el `class` del toggle |

`aria-pressed:` es el toggle activado; `active:` es una pulsación en curso, esté activado o desactivado. Muestra un toggle pulsado mediante su propia superficie: un relleno, una píldora elevada, un icono más marcado (consulta [Guías de diseño](../docs/design-guides.md#interaction-states)).

<a id="segmented"></a>

## Segmentado

Un grupo cuyos toggles están unidos, con uno pulsado a la vez, es un control segmentado (un selector de vistas): la app mantiene un valor y pulsa el toggle que lo nombra. El aspecto unido son las clases de la app:

```tsx
<ToggleGroup class="flex-row self-start">
  <Each of={["grid", "list"]}>
    {(value) => (
      <Toggle
        pressed={view() === value()}
        accessibilityLabel={`${value()} view`}
        onChange={({ pressed }) => pressed && view.set(value())}
        class="-ml-px h-8 px-3 border border-border first:ml-0 first:rounded-l-(--radius) last:rounded-r-(--radius) aria-pressed:bg-accent"
      >
        <Text class="text-sm">{value()}</Text>
      </Toggle>
    )}
  </Each>
</ToggleGroup>
```

<a id="disabled"></a>

## Deshabilitado

Un toggle deshabilitado no admite pulsaciones, y los lectores de pantalla lo anuncian como atenuado. Sus clases `disabled:` se aplican sobre las `aria-pressed:`, y las clases `group-disabled:` de su interior las siguen. `disabled` en un `ToggleGroup` deshabilita todos los toggles que contiene, una barra de herramientas que la app bloquea:

```tsx
<ToggleGroup disabled={readonly()} class="flex-row gap-1">
  <Toggle pressed={bold()} onChange={({ pressed }) => bold.set(pressed)} class="size-8 disabled:opacity-50">
    <Text>B</Text>
  </Toggle>
</ToggleGroup>
```

<a id="a-small-target-with-hitslop"></a>

## Un objetivo pequeño con hitSlop

Un toggle de icono puede ser más pequeño que un dedo. `hitSlop` hace que cuenten las pulsaciones que caen cerca de él, en puntos más allá de cada lado, sin cambiar su diseño ni su aspecto: un número para todos los lados, o los lados por nombre (`{ top: 8, bottom: 8 }`), tal como los acepta el [`hitSlop` de una vista](./index.md#presses-and-feedback).

```tsx
<Toggle
  pressed={favorite()}
  hitSlop={12}
  accessibilityLabel="Favorite"
  onChange={({ pressed }) => favorite.set(pressed)}
  class="size-5 items-center justify-center"
>
  <Text>★</Text>
</Toggle>
```

<a id="accessibility"></a>

## Accesibilidad

- Un toggle es un único elemento para los lectores de pantalla, con el rol `"button"` y su estado de pulsado: un botón de alternancia. Su etiqueta es el texto de sus hijos, o `accessibilityLabel`.
- `ToggleGroup` tiene el rol `"toolbar"`: los lectores de pantalla oyen los toggles que contiene como una sola barra de herramientas, cada uno aún como un elemento propio.
- `disabled` se anuncia como lo anuncia la plataforma (VoiceOver, TalkBack, UI Automation, el árbol de accesibilidad del navegador).
- En macOS y la web el grupo es una sola parada del foco del teclado, y las teclas de flecha se mueven entre sus toggles (más abajo).

Consulta [Accesibilidad](../docs/accessibility.md) para etiquetas, roles y anuncios en general.

<a id="keyboard"></a>

## Teclado

En macOS y la web, donde Tab llega a las vistas que admiten pulsaciones, un `ToggleGroup` sigue el [patrón de barra de herramientas de WAI-ARIA](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/):

| Tecla | Qué hace |
|---|---|
| Tab, Shift+Tab | Entra en el grupo por el primer toggle pulsado (el primer toggle no deshabilitado si no hay ninguno pulsado), y sale de él en un solo paso. |
| Derecha, Abajo | Mueve el foco al siguiente toggle, del último al primero. |
| Izquierda, Arriba | Mueve el foco al toggle anterior, del primero al último. |
| Inicio, Fin | Mueve el foco al primer o al último toggle. |
| Espacio, Return | Pulsa el toggle con el foco. |

Las teclas de flecha omiten los toggles deshabilitados y no pulsan nada: un toggle solo cambia cuando se pulsa. Los dos pares de flechas mueven el foco, sea cual sea el diseño del grupo, que es una clase de la app. En un diseño de derecha a izquierda, Izquierda y Derecha se intercambian: Izquierda pasa al siguiente toggle y Derecha al anterior; Arriba, Abajo, Inicio y Fin mantienen las suyas. Los estilos `focus:` muestran dónde está el foco. Un `Toggle` fuera de un `ToggleGroup` es una parada propia.

<a id="platform-notes"></a>

## Notas de plataforma

- iOS, Android y Mac Catalyst: una pulsación es un toque que termina en el toggle, incluido su contenido.
- Escritorio (macOS, Windows, Linux, GPUI) y la web: una pulsación es un clic. En macOS y la web, Espacio y Return también pulsan el toggle que tiene el foco del teclado, y las flechas, Inicio y Fin lo mueven ([Teclado](#keyboard)).
- Cada plataforma dibuja lo que la app estiliza: los toggles, la superficie de los pulsados y la pista del grupo.
