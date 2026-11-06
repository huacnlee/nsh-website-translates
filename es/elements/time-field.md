---
title: "TimeField"
description: "El componente TimeField: una hora del día que se edita segmento por segmento, horas, minutos y segundos, con el teclado o con el teclado numérico del teléfono, y con el estilo definido por la aplicación."
group: base
demo: el-date-picker
source_hash: 2c1c4d77c8f324de
---


# TimeField

Un campo de hora edita una hora del día, un segmento a la vez: la hora, el minuto, con `precision="second"` el segundo, y con `hourCycle="h12"` AM o PM. La hora de un recordatorio, el inicio de una reunión, el horario de apertura de una tienda. Es la hora que aparece bajo el calendario de [DatePicker](./date-picker.md) con `timePrecision`, pero sola en la página.

El campo se encarga del comportamiento: la hora (la de la app o la suya propia), qué segmento editan las teclas, la escritura y el incremento de dígitos, y lo que oyen los lectores de pantalla. El aspecto es de la app: da estilo a los segmentos y al `:` entre ellos, o dibuja los segmentos ella misma.

```rust tabs
use chrono::NaiveTime;
use nsh_base::{HourCycle, TimeFieldSegmentEntry, TimeOfDay, time_field};
use nsh_core::prelude::*;

fn reminder_time() -> impl IntoElement {
    let at = signal(TimeOfDay(NaiveTime::from_hms_opt(9, 30, 0).unwrap()));
    time_field()
        .value(move || Some(at.get()))
        .on_change(move |next: &TimeOfDay| at.set(*next))
        .hour_cycle(HourCycle::H12)
        .accessibility_label("Reminder time")
        .segment_class("rounded-sm focus:bg-accent disabled:opacity-50")
        .render_segment(|segment: &TimeFieldSegmentEntry| view().px_1().child(text(segment.label.clone())))
}
```

```tsx tabs
import { mount, signal } from "nsh";
import { TimeField } from "nsh/base";

function App() {
  const at = signal("09:30");
  return (
    <TimeField
      value={at()}
      onChange={({ value }) => at.set(value)}
      hourCycle="h12"
      accessibilityLabel="Reminder time"
      class="h-9 w-32 flex-row items-center rounded-md border border-input px-2"
      segmentClass="rounded-sm px-0.5 text-sm tabular-nums focus:bg-accent focus:text-accent-foreground"
      separatorClass="text-sm text-muted-foreground"
    />
  );
}

mount(App);
```

`TimeField` proviene de [`nsh/base`](../modules/nsh-base.md), el crate `nsh-base` en Rust. En Rust, `time_field()` crea uno con un setter por prop (`.value(..)`, `.precision(..)`, `.hour_cycle(..)`) y un listener por evento (`.on_change(..)`). Su hora es un `TimeOfDay`, un `chrono::NaiveTime`.

<a id="value"></a>

## Valor

El valor es una hora del día en reloj de 24 horas, como la de un `<input type="time">` de HTML: `"HH:MM"`, o `"HH:MM:SS"` con `precision="second"`, sea cual sea el `hourCycle` que muestre el campo. Con `value`, la app es la dueña: el campo la muestra e informa de cada edición con `onChange({ value })`; la app actualiza `value` para seguirla. Si se omite, el campo mantiene su propia hora, a partir de `defaultValue` al principio (por defecto `00:00`).

`precision` es la unidad más pequeña que edita el campo, `"minute"` (el valor por defecto) o `"second"`. `hourCycle` es cómo cuenta las horas: `"h23"` (el valor por defecto) de 00 a 23, `"h12"` de 12 a 11 con un segmento AM/PM después de los números.

<a id="editing"></a>

## Edición

Hay un segmento seleccionado; las teclas lo editan, como en el campo de hora de `gpui-base`:

- Arriba y Abajo incrementan o decrementan el segmento de uno en uno y dan la vuelta (de 59 a 00) sin arrastrar al segmento siguiente.
- Los dígitos se escriben en él, de dos en dos: un dígito que no puede iniciar un valor más largo (un `7` en la hora) completa el
  segmento y pasa al siguiente.
- `a` y `p` establecen AM y PM.
- Backspace y Delete restablecen el segmento.

Una pulsación sobre un segmento lo selecciona. Una pulsación sobre el segmento AM/PM seleccionado lo alterna, ya que los teléfonos no tienen las teclas `a` y `p`. Las teclas van a un único campo de texto nativo situado detrás de los segmentos, transparente, como el de [OtpInput](./otp-input.md): en teléfonos y tablets muestra el teclado numérico.

## Props

| Prop | Rust | Tipo | Valor por defecto | Descripción |
|---|---|---|---|---|
| `value` | `.value(..)` | `string` | ninguno | La hora, controlada por la app. |
| `defaultValue` | `.default_value(..)` | `string` | `"00:00"` | La hora inicial, sin `value`. |
| `precision` | `.precision(..)` | `"minute" \| "second"` | `"minute"` | La unidad más pequeña que edita. |
| `hourCycle` | `.hour_cycle(..)` | `"h23" \| "h12"` | `"h23"` | Cómo cuenta las horas; `"h12"` añade un segmento AM/PM. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Sin foco ni edición; los estilos `disabled:` se aplican al campo y a sus segmentos. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | ninguno | Cómo llaman los lectores de pantalla al campo. |
| `segmentClass`, `segmentStyle` | `.segment_class(..)`, `.segment_style(..)` | `string`, `StyleProp<TextStyle>` | ninguno | Cada segmento: `focus:` en el seleccionado mientras el campo tiene el foco, `disabled:` con el campo; con `group`, su contenido los sigue (`group-focus:`, `group-disabled:`). |
| `separatorClass`, `separatorStyle` | `.separator_class(..)`, `.separator_style(..)` | `string`, `StyleProp<TextStyle>` | ninguno | Cada `:` entre los números. |
| `renderSegment` | `.render_segment(..)` | `(segment: TimeFieldSegmentEntry) => JSX.Element` | ninguno | El contenido de un segmento, dibujado por la app a partir de lo que muestra; si no, su etiqueta. |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | ninguno | El campo, alrededor de sus segmentos (una fila). |

`renderSegment` recibe un `TimeFieldSegmentEntry`: `segment` (`"hour"`, `"minute"`, `"second"` o `"period"`), `value`
(la hora en el reloj del campo, el minuto o el segundo; `0` para AM y `1` para PM) y `label` (dos dígitos, o `AM` /
`PM`). Nunca recibe el estado del segmento: el segmento está `focus:` mientras las teclas lo editan y `disabled:` con el
campo, y con `group` en `segmentClass` su contenido lo sigue con `group-focus:` y `group-disabled:`. Así, un segmento
se vuelve a dibujar solo cuando cambia su valor; moverse entre los segmentos y que el foco entre y salga no dibujan nada:

```tsx
<TimeField
  segmentClass="group rounded-sm px-0.5 focus:bg-primary"
  renderSegment={(segment) => <Text class="text-sm tabular-nums text-foreground group-focus:text-primary-foreground">{segment.label}</Text>}
/>
```

<a id="events"></a>

## Eventos

| Evento | Rust | Descripción |
|---|---|---|
| `onChange` | `.on_change(\|value\| ..)` | El usuario cambió la hora: `{ value }`. Asigna `value` para seguirla. Un `value` que pasa la app nunca se notifica. |

<a id="parts"></a>

## Partes

| Parte | Dónde | Estilo con |
|---|---|---|
| El campo | la raíz, una fila | `class`, `style` |
| Un segmento | el campo: hora, minuto, segundo, AM/PM | `segmentClass`, `segmentStyle`, `renderSegment` (`group-focus:`, `group-disabled:` dentro, bajo `group` en `segmentClass`) |
| Un separador | el campo, entre dos números | `separatorClass`, `separatorStyle` |

<a id="keyboard"></a>

## Teclado

Tab llega al campo con su segmento seleccionado. Después:

| Tecla | Acción |
|---|---|
| Izquierda / Derecha | El segmento anterior o siguiente. |
| Tab / Shift+Tab | El segmento siguiente o anterior; Tab desde el último y Shift+Tab desde el primero salen del campo. |
| Arriba / Abajo | Incrementa o decrementa el segmento de uno en uno, dando la vuelta. |
| 0 a 9 | Escribe en el segmento. |
| A / P | AM o PM. |
| Backspace, Delete | Restablece el segmento. |

<a id="accessibility"></a>

## Accesibilidad

- El campo es un campo de texto con el nombre dado por `accessibilityLabel`; los lectores de pantalla leen la hora que muestra. `disabled` lo atenúa.
- Los teléfonos y las tablets muestran el teclado numérico.

Consulta [Accesibilidad](../docs/accessibility.md) para etiquetas, roles y anuncios en general.
