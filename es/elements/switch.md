---
title: "Switch"
description: "El componente Switch: un control de activado / desactivado que gestiona las pulsaciones, la activación con el teclado, el estado deshabilitado y su rol y valor para los lectores de pantalla, con una pista y un control deslizante que la aplicación puede personalizar."
group: base
demo: el-switch
source_hash: d203427a791f5543
---


# Switch

Un switch activa o desactiva un ajuste, y el cambio surte efecto al instante. Se encarga del comportamiento: pulsaciones, activación con teclado, el estado deshabilitado, y el rol de switch y su valor para los lectores de pantalla. El aspecto es de la app: un `Switch` no tiene colores, tamaños, movimiento ni etiqueta propios. Se compone de un track con un thumb dentro, y después sus hijos (una etiqueta); la app da estilo a cada parte, con clases `checked:` y `disabled:` que siguen al switch.

```rust tabs
use nsh_base::{switch, theme};
use nsh_core::prelude::*;

fn wifi() -> impl IntoElement {
    let on = signal(false);
    switch()
        .checked(on)
        .on_change(move |next: &bool| on.set(*next))
        .flex_row()
        .items_center()
        .gap_3()
        .track_style(|s| {
            s.w(px(44.0))
                .p(px(2.0))
                .rounded_full()
                .bg(move || theme().muted)
                .transition_colors()
                .checked(|s| s.bg(move || theme().primary))
        })
        .thumb_style(|s| {
            s.size(px(20.0))
                .rounded_full()
                .bg(move || theme().background)
                .shadow_sm()
                .transition_transform()
                .checked(|s| s.translate_x(px(20.0)))
        })
        .child(text("Wi-Fi"))
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { Switch } from "nsh/base";

function App() {
  const on = signal(false);
  return (
    <Switch
      checked={on()}
      onChange={({ checked }) => on.set(checked)}
      class="flex-row items-center gap-3"
      trackClass="w-11 rounded-full bg-muted p-0.5 transition-colors checked:bg-primary"
      thumbClass="size-5 rounded-full bg-background shadow-sm transition-transform checked:translate-x-5"
    >
      <Text>Wi-Fi</Text>
    </Switch>
  );
}

mount(App);
```

`Switch` proviene de [`nsh/base`](../modules/nsh-base.md), el crate `nsh-base` de Rust. El valor es de la app: una pulsación informa del siguiente valor con `onChange`, y el switch muestra el `checked` que la app le devuelve. En Rust, `switch()` crea uno con un setter por prop (`.checked(..)`, `.track_style(..)`), un listener por evento (`.on_change(..)`), los métodos de estilo tipados para el propio switch y `.child(..)` para su etiqueta; el estilo de una parte admite los métodos de estado (`.checked(..)`, `.disabled_style(..)`) que siguen al switch.

## Props

| Prop | Rust | Tipo | Valor por defecto | Descripción |
|---|---|---|---|---|
| `checked` | `.checked(..)` | `boolean` | `false` | Activado o desactivado. Una pulsación informa del siguiente valor con `onChange`; el switch muestra el valor que la app le devuelve. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Sin pulsaciones ni respuesta visual a ellas; los estilos `disabled:` se aplican al switch y a sus partes, y los lectores de pantalla indican que está atenuado. |
| `checkedStyle` | `.checked_style(\|s\| ..)` | `StyleProp<ViewStyle>` | ninguno | El estilo del switch mientras está `checked` y no deshabilitado, como clases `checked:`. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | ninguno | Lo que dicen los lectores de pantalla: qué activa el switch, cuando sus hijos no tienen texto que lo indique. |
| `trackClass`, `trackStyle` | `.track_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | ninguno | El track, la parte por la que se mueve el thumb. |
| `thumbClass`, `thumbStyle` | `.thumb_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | ninguno | El thumb, dentro del track. |
| `hitSlop` | `.hit_slop(..)` | `number \| Partial<Edges>` | ninguno | Hasta qué distancia fuera de sus límites siguen contando las pulsaciones, en puntos: un número para todos los lados, o los lados indicados por nombre. Como el `hitSlop` de una vista. |
| `children` | `.child(..)` | `JSX.Element` | ninguno | El contenido tras el track: una etiqueta, que los lectores de pantalla leen. |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | ninguno | El propio switch: la fila que rodea al track y la etiqueta. |
| `activeStyle`, `hoverStyle`, `focusStyle`, `disabledStyle` | `.active(\|s\| ..)`, `.hover(..)`, `.focus(..)`, `.disabled_style(..)` | `StyleProp<ViewStyle>` | ninguno | El estilo del switch mientras está pulsado, con el cursor encima, con el foco o deshabilitado, como las clases `<state>:`. |

<a id="events"></a>

## Eventos

| Evento | Rust | Descripción |
|---|---|---|
| `onChange` | `.on_change(\|checked: &bool\| ..)` | Se pulsó el switch: un toque, un clic, Espacio o Intro mientras tiene el foco del teclado, o la activación de un lector de pantalla. Informa del valor que el switch solicita como `checked`, el opuesto del `checked` que tiene. |

Un switch deshabilitado no informa de nada.

<a id="parts"></a>

## Partes

| Parte | Dentro de | Se estiliza con | Estados |
|---|---|---|---|
| El switch | | `class`, `style` | `checked:`, `disabled:`, `active:`, `hover:`, `focus:` (o `checkedStyle`, `disabledStyle`, ...) |
| El track | el switch, primero | `trackClass`, `trackStyle` | `checked:`, `disabled:` siguen al switch |
| El thumb | el track | `thumbClass`, `thumbStyle` | `checked:`, `disabled:` siguen al switch |
| La etiqueta | el switch, después del track | sus propios elementos (`children`) | `group-checked:` y las demás variantes `group-*:` con `group` en el `class` del switch |

El thumb se mueve mediante sus propios estilos `checked:`: una traslación (`checked:translate-x-5`), o un margen o la alineación del track (`checked:justify-end` en el track). Una clase `transition-*` anima el cambio de forma nativa. Para colocar la etiqueta antes del track, invierte la fila: `class="flex-row-reverse justify-between"`.

<a id="disabled"></a>

## Deshabilitado

Un switch deshabilitado no admite pulsaciones, y los lectores de pantalla lo anuncian como atenuado. Sus clases `disabled:` y las de su track y su thumb se aplican por encima de las `checked:`:

```tsx
<Switch
  checked={on()}
  disabled={!online()}
  onChange={({ checked }) => on.set(checked)}
  class="flex-row items-center gap-3 disabled:opacity-50"
  trackClass="w-11 rounded-full bg-muted p-0.5 checked:bg-primary disabled:bg-muted"
  thumbClass="size-5 rounded-full bg-background checked:translate-x-5"
>
  <Text>Sync over cellular</Text>
</Switch>
```

<a id="a-small-target-with-hitslop"></a>

## Un área pequeña con hitSlop

Un switch sin etiqueta a su lado puede ser más pequeño que un dedo. `hitSlop` hace que cuenten las pulsaciones que caen cerca de él, en puntos más allá de cada lado, sin cambiar su diseño ni su aspecto: un número para todos los lados, o los lados indicados por nombre (`{ top: 8, bottom: 8 }`), igual que los admite el [`hitSlop` de una vista](./index.md#presses-and-feedback).

```tsx
<Switch
  checked={on()}
  hitSlop={{ top: 8, bottom: 8 }}
  accessibilityLabel="Notifications"
  onChange={({ checked }) => on.set(checked)}
  trackClass="w-9 rounded-full bg-muted p-0.5 checked:bg-primary"
  thumbClass="size-4 rounded-full bg-background checked:translate-x-4"
/>
```

<a id="accessibility"></a>

## Accesibilidad

- Un switch es un único elemento para los lectores de pantalla, con el rol `"switch"` y su valor (activado o desactivado); el track y el thumb forman parte de él. Su etiqueta es el texto de sus hijos; indica `accessibilityLabel` cuando no tiene ninguno.
- `disabled` se anuncia como lo anuncia la plataforma (VoiceOver, TalkBack, UI Automation, el árbol de accesibilidad del navegador).
- En macOS y la web, un switch es una parada del foco del teclado: Tab llega hasta él, Espacio e Intro lo alternan, y los estilos `focus:` muestran dónde está el foco.

Consulta [Accesibilidad](../docs/accessibility.md) para ver etiquetas, roles y anuncios en general.

<a id="platform-notes"></a>

## Notas por plataforma

- iOS, Android y Mac Catalyst: una pulsación es un toque que termina sobre el switch, incluida su etiqueta.
- Escritorio (macOS, Windows, Linux, GPUI) y la web: una pulsación es un clic. En macOS y la web, Espacio e Intro también alternan el switch que tiene el foco del teclado.
- Cada plataforma dibuja lo que la app estiliza; el thumb se mueve según indican los estilos y las transiciones de la app.
