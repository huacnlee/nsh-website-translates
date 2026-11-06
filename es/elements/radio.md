---
title: "Radio"
description: "Radio y RadioGroup: un conjunto de opciones entre las que el usuario elige exactamente una. Cada Radio se encarga de las pulsaciones, la activación con teclado, el estado deshabilitado y su rol y estado de selección para los lectores de pantalla; el grupo es el conjunto; la apariencia y el valor corresponden a la app."
group: base
demo: el-radio
source_hash: 051314109ae3d0b2
---


# Radio

Los radios ofrecen un conjunto de opciones de las que el usuario elige exactamente una: un plan, un orden, un tema. Cada `Radio` se encarga del comportamiento de una opción: pulsaciones, activación por teclado, el estado deshabilitado, y el rol de radio y su estado marcado para los lectores de pantalla. Un `RadioGroup` alrededor de ellos es el conjunto, que los lectores de pantalla anuncian como un solo grupo. El aspecto es de la app: un radio no tiene círculo, punto, colores, tamaños ni etiqueta propios. Sus hijos son el indicador y la etiqueta de la app, y las clases `checked:` del radio, o las clases `group-checked:` de lo que hay dentro, siguen su estado.

```rust tabs
use nsh_base::{radio, radio_group, theme};
use nsh_core::prelude::*;

fn plans() -> impl IntoElement {
    let plan = signal("basic");
    let option = move |value: &'static str, label: &'static str| {
        let checked = move || plan.get() == value;
        radio()
            .checked(checked)
            .on_change(move |_: &bool| plan.set(value))
            .flex_row()
            .items_center()
            .gap_2()
            .child(
                view()
                    .size(px(20.0))
                    .items_center()
                    .justify_center()
                    .rounded_full()
                    .border_2()
                    .border_color(move || theme().border)
                    .child(
                        view()
                            .size(px(10.0))
                            .rounded_full()
                            .bg(move || theme().primary)
                            .opacity(move || if checked() { 1.0_f32 } else { 0.0 }),
                    ),
            )
            .child(text(label))
    };
    radio_group()
        .gap_3()
        .child(option("basic", "Basic"))
        .child(option("pro", "Pro"))
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { Radio, RadioGroup } from "nsh/base";

function App() {
  const plan = signal("basic");
  const option = (value: string, label: string) => (
    <Radio
      checked={plan() === value}
      onChange={() => plan.set(value)}
      class="group flex-row items-center gap-2"
    >
      <View class="size-5 items-center justify-center rounded-full border-2 border-border group-checked:border-primary">
        <View class="size-2.5 rounded-full group-checked:bg-primary" />
      </View>
      <Text>{label}</Text>
    </Radio>
  );
  return (
    <RadioGroup class="gap-3">
      {option("basic", "Basic")}
      {option("pro", "Pro")}
    </RadioGroup>
  );
}

mount(App);
```

`Radio` y `RadioGroup` vienen de [`nsh/base`](../modules/nsh-base.md), el crate `nsh-base` en Rust. El valor es de la app: el grupo no guarda ninguno. A cada radio se le indica si está marcado; una pulsación sobre un radio sin marcar informa `onChange({ checked: true })`, la app establece su valor, y cada radio muestra el `checked` que la app devuelve. En Rust, `radio()` y `radio_group()` los crean, con un setter por prop (`.checked(..)`), un listener por evento (`.on_change(..)`), los métodos de estilo tipados y `.child(..)` para su contenido.

## Props

### Radio

| Prop | Rust | Tipo | Predeterminado | Descripción |
|---|---|---|---|---|
| `checked` | `.checked(..)` | `boolean` | `false` | Marcado o no. Una pulsación sobre un radio sin marcar informa `true` con `onChange`; el radio muestra el valor que la app devuelve. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Sin pulsaciones ni respuesta a la pulsación; se aplican los estilos `disabled:`, y los lectores de pantalla indican que está atenuado. |
| `checkedStyle` | `.checked_style(\|s\| ..)` | `StyleProp<ViewStyle>` | ninguno | El estilo del radio mientras está marcado y no deshabilitado, como clases `checked:`. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | ninguno | Lo que dicen los lectores de pantalla: la opción, cuando sus hijos no tienen texto que la diga. |
| `hitSlop` | `.hit_slop(..)` | `number \| Partial<Edges>` | ninguno | Cuánto fuera de sus límites cuentan aún las pulsaciones, en puntos: un número para todos los lados, o los lados por nombre. Como el `hitSlop` de una vista. |
| `children` | `.child(..)` | `JSX.Element` | ninguno | El indicador y la etiqueta de la app, que los lectores de pantalla leen. |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | ninguno | El radio en sí: la fila que rodea al indicador y a la etiqueta. |
| `activeStyle`, `hoverStyle`, `focusStyle`, `disabledStyle` | `.active(\|s\| ..)`, `.hover(..)`, `.focus(..)`, `.disabled_style(..)` | `StyleProp<ViewStyle>` | ninguno | El estilo del radio mientras está pulsado, con el cursor encima, con el foco o deshabilitado, como clases `<state>:`. |

### RadioGroup

| Prop | Rust | Tipo | Predeterminado | Descripción |
|---|---|---|---|---|
| `children` | `.child(..)` | `JSX.Element` | ninguno | Los radios del conjunto, y lo que la app disponga entre ellos. |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | ninguno | El diseño y el aspecto del grupo: una columna por defecto, `flex-row` para una fila. |

<a id="events"></a>

## Eventos

| Evento | Rust | Descripción |
|---|---|---|
| `onChange` (`Radio`) | `.on_change(\|checked: &bool\| ..)` | Se pulsó un radio sin marcar: un toque, un clic, Espacio o Retorno mientras tiene el foco del teclado, o la activación de un lector de pantalla; o una tecla de flecha de su grupo movió el foco del teclado hasta él. Pide ser marcado, así que `checked` es `true`. Se ejecuta antes de que cambie nada: el radio muestra el `checked` que la app devuelve. |

Un radio marcado sigue marcado y no informa nada, ya que un radio no puede desmarcarse a sí mismo; un radio deshabilitado tampoco informa nada.

<a id="parts"></a>

## Partes

| Parte | Dentro de | Estilizado con | Estados |
|---|---|---|---|
| El grupo | | `class`, `style` de `RadioGroup` | |
| El radio | el grupo | `class`, `style` de `Radio` | `checked:`, `disabled:`, `active:`, `hover:`, `focus:` (o `checkedStyle`, `disabledStyle`, ...) |
| El indicador y la etiqueta | el radio | sus propios elementos (`children`) | `group-checked:`, `group-disabled:` y las demás variantes `group-*:` con `group` en el `class` del radio |

El indicador es contenido de la app: un anillo con un punto, una marca de verificación, una tarjeta resaltada. Con `group` en el `class` del radio, sus clases `group-checked:` muestran el punto mientras el radio está marcado.

<a id="disabled"></a>

## Deshabilitado

Un radio deshabilitado no admite pulsaciones, y los lectores de pantalla lo anuncian como atenuado. Sus clases `disabled:` se aplican sobre las `checked:`, y las clases `group-disabled:` dentro de él las siguen:

```tsx
<Radio
  checked={plan() === "team"}
  disabled={!eligible()}
  onChange={() => plan.set("team")}
  class="group flex-row items-center gap-2 disabled:opacity-50"
>
  <View class="size-5 items-center justify-center rounded-full border-2 border-border group-checked:border-primary">
    <View class="size-2.5 rounded-full group-checked:bg-primary" />
  </View>
  <Text>Team</Text>
</Radio>
```

<a id="a-small-target-with-hitslop"></a>

## Un objetivo pequeño con hitSlop

Un radio sin etiqueta a su lado (un punto en la fila de una tabla) puede ser más pequeño que un dedo. `hitSlop` hace que cuenten las pulsaciones que caen cerca de él, en puntos más allá de cada lado, sin cambiar su diseño ni su aspecto: un número para todos los lados, o los lados por nombre (`{ top: 8, bottom: 8 }`), tal como los acepta el [`hitSlop` de una vista](./index.md#presses-and-feedback).

```tsx
<Radio
  checked={plan() === "team"}
  hitSlop={12}
  accessibilityLabel="Team"
  onChange={() => plan.set("team")}
  class="group size-5 items-center justify-center rounded-full border-2 border-border group-checked:border-primary"
>
  <View class="size-2.5 rounded-full group-checked:bg-primary" />
</Radio>
```

<a id="accessibility"></a>

## Accesibilidad

- Un radio es un solo elemento para los lectores de pantalla, con el rol `"radio"` y su estado: marcado o no, y seleccionado mientras está marcado, ya que algunos lectores de pantalla leen uno y otros el otro (los radios de UI Automation son elementos de selección). Su indicador y su etiqueta son partes de él; su etiqueta es el texto de sus hijos, o `accessibilityLabel`.
- Un `RadioGroup` tiene el rol `"radiogroup"`: los lectores de pantalla oyen los radios que contiene como un solo conjunto, cada uno aún como un elemento propio.
- `disabled` se anuncia como lo anuncia la plataforma (VoiceOver, TalkBack, UI Automation, el árbol de accesibilidad del navegador).
- En macOS y la web, un `RadioGroup` es una sola parada del foco del teclado, y las teclas de flecha se mueven entre sus radios y los marcan (más abajo).

Consulta [Accesibilidad](../docs/accessibility.md) para ver etiquetas, roles y anuncios en general.

<a id="keyboard"></a>

## Teclado

En macOS y la web, donde Tab llega a las vistas que admiten pulsaciones, un `RadioGroup` sigue el [patrón de grupo de radios de WAI-ARIA](https://www.w3.org/WAI/ARIA/apg/patterns/radio/):

| Tecla | Qué hace |
|---|---|
| Tab, Shift+Tab | Entra en el grupo por el radio marcado (el primer radio no deshabilitado si no hay ninguno), y sale de él en un solo paso. |
| Abajo, Derecha | Mueve el foco al siguiente radio, del último al primero, y lo marca. |
| Arriba, Izquierda | Mueve el foco al radio anterior, del primero al último, y lo marca. |
| Espacio | Marca el radio con foco. |

Las teclas de flecha omiten los radios deshabilitados; el radio al que se mueven pide ser marcado con `onChange`, y la app lo marca. En un diseño de derecha a izquierda, Izquierda y Derecha intercambian sus papeles: Izquierda pasa al siguiente radio y Derecha al anterior; Arriba y Abajo mantienen los suyos. Los estilos `focus:` muestran dónde está el foco. Un `Radio` fuera de un `RadioGroup` es una parada propia, a la que llega Tab y que Espacio y Retorno marcan.

<a id="platform-notes"></a>

## Notas de plataforma

- iOS, Android y Mac Catalyst: una pulsación es un toque que termina sobre el radio, etiqueta incluida.
- Escritorio (macOS, Windows, Linux, GPUI) y la web: una pulsación es un clic. En macOS y la web, Espacio y Retorno también marcan el radio que tiene el foco del teclado, y las teclas de flecha lo mueven ([Teclado](#keyboard)).
- Todas las plataformas dibujan lo que la app estiliza: el indicador, la etiqueta y sus transiciones.
