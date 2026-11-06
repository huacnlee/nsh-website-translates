---
title: "NumberInput"
description: "El componente NumberInput: un número escrito en un campo o ajustado con botones, las teclas de flecha y lectores de pantalla, limitado a los decimales de su paso y a min y max, con un campo, botones y una columna de controles que la aplicación puede personalizar."
group: base
demo: el-number-input
source_hash: 4dd788dd07f8f04a
---


# NumberInput

Un number input contiene un número que el usuario escribe o incrementa: una cantidad, un precio, un tamaño. Es dueño de su comportamiento: su campo admite un número, o el texto en camino a serlo (`-`, `1.`), y rechaza cualquier otra cosa, incluidos los dígitos y signos de otros teclados; sus botones, las teclas Flecha arriba y Flecha abajo y el incremento y decremento de un lector de pantalla cambian el número en `step`, conservando sus decimales, y se detienen en `min` y `max`; al salir del campo, un número escrito se ajusta a ellos. El aspecto es el de la app: un `NumberInput` no tiene colores, tamaños, bordes, iconos ni cadenas propios. Se compone del botón de decremento, el campo entre el `prefix` y el `suffix` de la app, y el botón de incremento (o el campo entre ellos y una columna con ambos botones, `controlsRight`), y la app da estilo a cada parte y rellena los botones.

```rust tabs
use nsh_base::{number_input, theme};
use nsh_core::prelude::*;

fn tickets(count: Signal<Option<f64>>) -> impl IntoElement {
    number_input()
        .value(move || count.get())
        .min(1.0)
        .max(10.0)
        .accessibility_label("Tickets")
        .on_change(move |next: &Option<f64>| count.set(*next))
        .h(px(32.0))
        .flex_row()
        .rounded(px(8.0))
        .border_1()
        .border_color(move || theme().input)
        .input_style(|s| s.flex_1().text_center().text_color(move || theme().foreground))
        .decrement_button_style(|s| s.w(px(32.0)).items_center().justify_center())
        .increment_button_style(|s| s.w(px(32.0)).items_center().justify_center())
        .decrement_button(text("−"))
        .increment_button(text("+"))
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { NumberInput } from "nsh/base";

function App() {
  const tickets = signal<number | null>(2);
  return (
    <NumberInput
      value={tickets()}
      onChange={({ value }) => tickets.set(value)}
      min={1}
      max={10}
      accessibilityLabel="Tickets"
      class="h-8 flex-row overflow-hidden rounded-lg border border-input bg-field focus-within:outline-2 focus-within:outline-ring"
      inputClass="flex-1 text-center text-foreground"
      decrementButtonClass="w-8 items-center justify-center enabled:hover:bg-accent active:bg-muted disabled:opacity-40"
      incrementButtonClass="w-8 items-center justify-center enabled:hover:bg-accent active:bg-muted disabled:opacity-40"
      decrementButton={<Text>−</Text>}
      incrementButton={<Text>+</Text>}
    />
  );
}

mount(App);
```

`NumberInput` proviene de [`nsh/base`](../modules/nsh-base.md), el crate `nsh-base` de Rust. En Rust, `number_input()` crea uno con un setter por prop (`.value(..)`, `.input_style(..)`), un método de escucha por evento (`.on_change(..)`), los métodos de estilo tipados para el propio input, y `.prefix(..)` / `.suffix(..)` para lo que va alrededor del campo. Su valor es un `Option<f64>`.

<a id="value"></a>

## Valor

El valor es un número, o `null` si el campo está vacío. La app lo controla con `value` y establece el que informa `onChange`, como en cualquier control de `nsh/base`; o deja el valor al input con `defaultValue`, y aun así se entera de los cambios.

El texto del campo y el valor se mantienen separados donde es necesario, para que el usuario pueda escribir libremente:

- `onChange` informa del número que el texto representa cada vez que ese número cambia: `null` mientras el texto no representa ninguno (vacío, `-`, `.`); escribir `1.` después de `1`, o `1.50` después de `1.5`, no informa de nada.
- El texto se queda como el usuario lo escribe mientras represente el valor que tiene el input, de modo que un input controlado que devuelve cada valor informado conserva `1.` y `2.50`. Un valor que establece la app y que el input no informó se muestra en el campo como el texto más corto que lo representa (`0.3`, `12`).
- Al escribir, un número puede quedar fuera de `min` y `max` (1 de camino a 15 con `min={10}`), y se informa tal como se escribió. Al salir del campo, o con Return / Enter, se ajusta al rango y se informa de ello; un texto que no representa ningún número se queda como está.
- Un paso (un botón, una tecla, una acción de un lector de pantalla) pide el siguiente valor con `onChange`; con un valor controlado, el campo se mueve cuando la app lo devuelve, conservando los decimales del paso (`99.5` subiendo hasta `max={100}` muestra `100.0`), de modo que una app que rechaza un paso mantiene el campo donde está. Una edición que la app rechaza permanece en el campo mientras este se edita, y desaparece al salir del campo.

```tsx
const price = signal<number | null>(19.95);

<NumberInput
  value={price()}
  onChange={({ value }) => price.set(value)}
  onSubmit={({ value }) => save(value)}
  min={0}
  step={0.05}
  placeholder="Price"
  accessibilityLabel="Price"
/>;
```

El campo admite:

- Dígitos, un punto decimal y un signo al principio (`+` o `-`); una letra, un segundo punto o signo, o un signo en cualquier otro lugar se rechaza, y el campo vuelve a su texto.
- Dígitos, signos y punto de ancho completo, el signo menos (U+2212) y el punto ideográfico (`。`), que se leen como sus formas ASCII, tal como los escriben los métodos de entrada chinos y japoneses.
- Una coma como punto decimal mientras el texto no tenga punto (`3,25` es 3.25), como la escribe la tecla decimal de los teclados de muchos idiomas.

## Props

| Prop | Rust | Tipo | Por defecto | Descripción |
|---|---|---|---|---|
| `value` | `.value(..)` | `number \| null` | ninguno | El valor (controlado): un número, o `null` si el campo está vacío. La app establece el que informa `onChange`. |
| `defaultValue` | `.default_value(..)` | `number \| null` | ninguno | El valor inicial mientras `value` no esté establecido; entonces el input conserva el suyo. |
| `min` | `.min(..)` | `number` | ninguno | El valor más pequeño: los pasos se detienen en él, y un valor escrito por debajo se ajusta a él al salir del campo. |
| `max` | `.max(..)` | `number` | ninguno | El valor más grande, como `min` pero desde arriba; uno por debajo de `min` es `min`. |
| `step` | `.step(..)` | `number` | `1` | Hasta dónde llega un paso (Page Up / Page Down: diez pasos); uno que no sea un número positivo es `1`. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Sin escritura, pasos ni foco; las clases `disabled:` se aplican al input y a sus partes. |
| `readonly` | `.readonly(..)` | `boolean` | `false` | El texto se puede seleccionar y copiar pero no cambiar, ni escribiendo ni con pasos; los botones están deshabilitados. |
| `placeholder` | `.placeholder(..)` | `string` | ninguno | Se muestra mientras el campo está vacío. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | ninguno | Lo que dicen los lectores de pantalla para el campo, cuando ninguna etiqueta visible lo nombra. |
| `controlsRight` | `.controls_right(..)` | `boolean` | `false` | Ambos botones en una columna a la derecha del campo, el de incremento sobre el de decremento. Se lee cuando se crea el input. |
| `inputClass`, `inputStyle` | `.input_style(\|s\| ..)` | `string`, `StyleProp<InputStyle>` | ninguno | El campo: su caja y su texto (`color`, `fontSize`, `textAlign`, `placeholderColor`, `caretColor`). |
| `decrementButtonClass`, `decrementButtonStyle` | `.decrement_button_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | ninguno | El botón de decremento. |
| `incrementButtonClass`, `incrementButtonStyle` | `.increment_button_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | ninguno | El botón de incremento. |
| `decrementButton`, `incrementButton` | `.decrement_button(..)`, `.increment_button(..)` | `JSX.Element` | ninguno | El contenido de los botones: un signo, un icono. |
| `controlsClass`, `controlsStyle` | `.controls_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | ninguno | La columna que contiene ambos botones con `controlsRight`. |
| `prefix` | `.prefix(..)` | `JSX.Element` | ninguno | Lo que va antes del campo, después del botón de su izquierda: un signo de moneda, un icono. |
| `suffix` | `.suffix(..)` | `JSX.Element` | ninguno | Lo que sigue al campo, antes de los botones de su derecha: una unidad, una moneda. |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | ninguno | El propio input: la fila que rodea al campo y a los botones. |

<a id="events"></a>

## Eventos

| Evento | Rust | Payload | Cuándo |
|---|---|---|---|
| `onChange` | `.on_change(\|value: &Option<f64>\| ..)` | `{ value: number \| null }` | Cambió el número que representa el campo (escritura, un paso, un incremento o decremento de un lector de pantalla, o salida del campo con un valor fuera de rango). |
| `onSubmit` | `.on_submit(\|value: &Option<f64>\| ..)` | `{ value: number \| null }` | Return / Enter en el campo: el valor, ajustado a `min` y `max`. |
| `onFocus` | `.on_focus(..)` | ninguno | El campo recibió el foco del teclado. |
| `onBlur` | `.on_blur(..)` | ninguno | El campo perdió el foco del teclado (antes se ajusta su valor a `min` y `max`). |

<a id="parts"></a>

## Partes

| Parte | Dentro de | Se estiliza con |
|---|---|---|
| El input | | `class`, `style` |
| El botón de decremento | el input, primero (con `controlsRight`: la columna de controles, segundo) | `decrementButtonClass`, `decrementButtonStyle`; su contenido `decrementButton` |
| El campo | el input | `inputClass`, `inputStyle` |
| El prefijo | el input, antes del campo | sus propios elementos (`prefix`) |
| El sufijo | el input, después del campo | sus propios elementos (`suffix`) |
| El botón de incremento | el input, último (con `controlsRight`: la columna de controles, primero) | `incrementButtonClass`, `incrementButtonStyle`; su contenido `incrementButton` |
| La columna de controles | el input, último, con `controlsRight` | `controlsClass`, `controlsStyle` |

El input es una fila que dispone la app: `flex-row` en `class`, y `flex-1` en el campo para darle el espacio que dejan los botones. Estados que muestran las partes:

- El input: `focus-within:` mientras su campo se edita (un anillo alrededor de todo el input), `disabled:`.
- El campo: `focus:` mientras se edita, `disabled:`.
- Un botón: `hover:` bajo el puntero, `active:` mientras se presiona, `disabled:` mientras el input está deshabilitado o es de solo lectura y donde un paso no haría nada (el decremento en `min`, el incremento en `max`). Pon el hover detrás de `enabled:` (`enabled:hover:bg-accent`) para que un botón deshabilitado no se ilumine.

El movimiento de los estados lo decide la app (`transition-colors`), y `motion-reduce:` lo detiene para las personas que piden menos movimiento.

<a id="keyboard"></a>

## Teclado

Mientras el campo se edita, el input admite las teclas del spin button de WAI-ARIA, que se repiten al mantenerlas pulsadas:

| Tecla | Acción |
|---|---|
| Flecha arriba | Un paso hacia arriba. |
| Flecha abajo | Un paso hacia abajo. |
| Page Up, Page Down | Diez pasos hacia arriba o hacia abajo. |

Home y End siguen siendo del campo: mueven el cursor en el texto. Los botones no son paradas del foco del teclado: Tab pasa del campo a lo que sigue al input, y pulsar un botón deja el foco en el campo (en los equipos de escritorio, pulsar mueve el foco al campo si estaba en otro lugar; en las pantallas táctiles lo deja donde está, para que no aparezca el teclado).

<a id="accessibility"></a>

## Accesibilidad

- El campo es un spin button (`"spinbutton"`) con su etiqueta, su valor (el número que representa, entre `min` y `max`) y su texto.
- Las acciones de incremento y decremento de un lector de pantalla (el deslizamiento hacia arriba y hacia abajo de VoiceOver) lo cambian por pasos, igual que Flecha arriba y Flecha abajo.
- Los botones están ocultos para los lectores de pantalla, como los de un campo numérico de un navegador: el incremento y el decremento del propio campo lo cambian por pasos.
- Mientras `disabled`, los lectores de pantalla dicen que el campo está atenuado.

Consulta [Accesibilidad](../docs/accessibility.md) para etiquetas, roles y acciones en general.

<a id="platform-notes"></a>

## Notas de plataforma

- El campo es el campo de texto de la plataforma ([Input](./input.md)): el teclado, el cursor, la selección, copiar y pegar y los métodos de entrada son los del sistema. Los teléfonos muestran un teclado decimal, con un signo cuando `min` es menor que 0 o no está establecido.
- Cada plataforma dibuja lo que la app estiliza. Flecha arriba / Flecha abajo y Page Up / Page Down llegan al input desde un teclado físico en todas las plataformas.
