---
title: "DatePicker"
description: "El componente DatePicker: una fecha, un rango de fechas o una fecha y hora seleccionadas desde un calendario en una ventana emergente junto a su elemento de activación en escritorio y en una hoja inferior en teléfonos, con el estilo definido por la aplicación."
group: base
demo: el-date-picker
source_hash: ba9910b03fe753f3
---


# DatePicker

Un date picker establece una fecha desde un [Calendar](./calendar.md) que se abre desde el disparador de la app: una fecha de vencimiento, un cumpleaños,
con `range` los días de un viaje, con `timePrecision` una fecha y una hora del día. Como [Select](./select.md), se abre como
espera cada dispositivo:

- En los escritorios y en los navegadores de escritorio, un popup junto al disparador; al abrirlo, el teclado queda sobre los días.
- En teléfonos y tabletas, una hoja en la parte inferior de la pantalla sobre un fondo (backdrop).

El selector se encarga del comportamiento: el valor (el de la app o el suyo propio), el estado de apertura, el calendario, la hora, los preajustes,
el teclado y lo que oyen los lectores de pantalla. El aspecto es de la app: dibuja el disparador (con el valor, un
marcador de posición, un icono) y da estilo al popup, a las partes del calendario, a los preajustes y al campo de hora.

```rust tabs
use chrono::NaiveDate;
use nsh_base::{DateRangePreset, DateTime, PickedDate, date_picker, theme};
use nsh_core::prelude::*;

fn trip_dates() -> impl IntoElement {
    let trip = signal(DateTime::Range(None, None));
    let title = move || {
        trip.get()
            .format("%b %-d")
            .map(|s| s.to_string())
            .unwrap_or_else(|| "Pick dates".to_string())
    };
    let day = |m, d| NaiveDate::from_ymd_opt(2026, m, d).unwrap();
    date_picker()
        .range(true)
        .number_of_months(2)
        .value(move || trip.get())
        .on_change(move |next: &PickedDate| trip.set(next.value))
        .presets(vec![
            DateRangePreset::range("This week", day(10, 25), day(10, 31)),
            DateRangePreset::range("Next week", day(11, 1), day(11, 7)),
        ])
        .accessibility_label("Trip")
        .offset(px(4.0))
        .popup_style(|s| {
            s.p_3()
                .rounded_lg()
                .border_1()
                .border_color(move || theme().border)
                .bg(move || theme().popover)
                .shadow_md()
        })
        .trigger(
            view()
                .h_9()
                .w_56()
                .px_3()
                .justify_center()
                .rounded_md()
                .border_1()
                .border_color(move || theme().input)
                .child(text(title)),
        )
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { DatePicker, type DatePickerValue } from "nsh/base";

function App() {
  const due = signal<DatePickerValue>(null);
  return (
    <DatePicker
      value={due()}
      onChange={({ value }) => due.set(value)}
      timePrecision="minute"
      cleanable
      clearButton={<Text>×</Text>}
      clearButtonAccessibilityLabel="Clear the due date"
      presets={[{ label: "Tomorrow 9:00", value: "2026-10-29T09:00" }]}
      accessibilityLabel="Due"
      offset={4}
      popupClass="rounded-lg border border-border bg-popover p-3 text-popover-foreground shadow-md"
      backdropClass="bg-black/40"
      contentClass="flex-row gap-3"
      presetClass="rounded-md px-2 py-1.5 text-sm hover:bg-accent"
      headerClass="flex-row items-center justify-between"
      rowClass="flex-row justify-between"
      itemClass="h-8 min-w-8 items-center justify-center rounded-md text-sm focus:ring-2 focus:ring-ring selected:bg-primary selected:text-primary-foreground disabled:opacity-50"
      timeClass="mt-2 gap-3"
      timeLabel={<Text class="text-sm">Time</Text>}
      timeAccessibilityLabel="Due time"
      timeFieldClass="flex-row rounded-md border border-input px-2 py-1"
      segmentClass="text-sm tabular-nums focus:bg-accent"
      trigger={
        <View class="h-9 w-56 justify-center rounded-md border border-input px-3 hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring">
          <Text>{typeof due() === "string" ? (due() as string).replace("T", " ") : "Pick a date"}</Text>
        </View>
      }
    />
  );
}

mount(App);
```

`DatePicker` viene de [`nsh/base`](../modules/nsh-base.md), el crate `nsh-base` de Rust. En Rust, `date_picker()`
crea uno con un setter por prop (`.value(..)`, `.range(..)`, `.time_precision(..)`) y un listener por evento
(`.on_change(..)`). Su valor es un `DateTime` (`DateTime::Single`, `DateTime::Range`, a partir de fechas `chrono` o de fechas y
horas); `onChange` devuelve un `PickedDate`, el valor con la precisión de hora del selector.

<a id="value"></a>

## Valor

El valor tiene las formas de los inputs de HTML: una fecha ISO, `"2026-10-28"`, como la de `<input type="date">`; con `range`
`[start, end]`; con `timePrecision` una fecha y hora, `"2026-10-28T09:30"` (`"2026-10-28T09:30:15"` con segundos), como la de
`<input type="datetime-local">`; `null` es ninguno. Con `value`, el valor es de la app: el selector lo muestra e informa de cada
cambio con `onChange({ value })`; la app establece `value` para seguirlo. Si se omite, el selector conserva su propio valor, que al principio viene de
`defaultValue`.

- Una sola fecha: pulsar un día establece el valor y cierra el popup.
- Con `range`, la primera pulsación inicia el rango y la segunda lo termina, como en [un calendario](./calendar.md#value); el
  rango completo establece el valor y cierra el popup.
- Con `timePrecision` (solo para una fecha), debajo del calendario se muestra un campo de hora y se informa de cada edición de la hora. En los escritorios, elegir un día mantiene el popup abierto para la hora e informa de la fecha con su hora; volver a
  pulsar el día seleccionado cierra el popup. En teléfonos y tabletas, tocar un día lo elige con su hora y
  cierra la hoja, como hace una sola fecha; la hoja se vuelve a abrir para la hora. Un día elegido antes de fijar una hora recibe
  `defaultTime` (por defecto `00:00`). `hourCycle` es cómo cuenta las horas el campo.

`cleanable` añade un botón de borrado mientras haya un valor: al pulsarlo se borra (`onChange({ value: null })`). Va
después del disparador, no dentro de él, de modo que pulsarlo nunca abre el popup; la app lo coloca y lo rellena
(`clearButton`), como [el botón de borrado de Select](./select.md#value).

<a id="presets"></a>

## Preajustes

Los `presets` son botones junto al calendario que establecen el valor: "Hoy", "Últimos 7 días", "Mañana a las 9". Cada uno es
`{ label, value }`, `value` una fecha, un rango o fechas y horas, conservado tal como se da; al pulsarlo se establece y se cierra el popup.
`contentClass` organiza la columna de preajustes y el calendario con la hora (una fila, `flex-row`); `presetsClass` da estilo a
la columna y `presetClass` a cada botón.

<a id="the-calendar"></a>

## El calendario

Todas las props de [Calendar](./calendar.md) salvo su valor se pasan a las del selector: `numberOfMonths`, `firstDayOfWeek`,
`disabledMatcher`, `yearRange`, `previousAccessibilityLabel`, `nextAccessibilityLabel`, las partes (de `headerClass` a
`itemStyle`) y `renderItem`. `calendarClass` y `calendarStyle` dan estilo al propio calendario. Sus vistas y teclas son las de un
calendario.

La fila de la hora (`timeClass`, `timeStyle`) contiene `timeLabel`, las palabras de la app para ella ("Hora"), al principio, y el campo
de hora (`timeFieldClass`, `timeFieldStyle`, `timeAccessibilityLabel`) al final: una fila con sus elementos centrados y
separados (`flex-row items-center justify-between`, como el de `gpui-component`). Los segmentos del campo son los de un
[TimeField](./time-field.md) (`segmentClass`, `separatorClass`, `renderSegment`).

## Props

| Prop | Rust | Tipo | Por defecto | Descripción |
|---|---|---|---|---|
| `value` | `.value(..)` | `DatePickerValue` | ninguno | El valor, que pertenece a la app. |
| `defaultValue` | `.default_value(..)` | `DatePickerValue` | `null` | El valor inicial, sin `value`. |
| `range` | `.range(..)` | `boolean` | `false` | Elegir un rango de fechas. |
| `open`, `defaultOpen` | `.open(..)`, `.default_open(..)` | `boolean` | `false` | El estado de apertura, el de la app o el propio del selector. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Permanece cerrado y no admite pulsaciones ni foco de teclado. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | ninguno | Cómo lo llaman los lectores de pantalla. |
| `dateFormat` | `.date_format(..)` | `string` | `"%Y/%m/%d"` y la hora | Cómo oyen el valor los lectores de pantalla, en el formato de `chrono`. |
| `timePrecision` | `.time_precision(..)` | `"minute" \| "second"` | ninguno | Edita también la hora del día, hasta esta precisión. |
| `hourCycle` | `.hour_cycle(..)` | `"h23" \| "h12"` | `"h23"` | Cómo cuenta las horas el campo de hora. |
| `defaultTime` | `.default_time(..)` | `string` | `"00:00"` | La hora que recibe una fecha antes de que el usuario fije una. |
| `cleanable` | `.cleanable(..)` | `boolean` | `false` | Un botón de borrado mientras haya un valor. |
| `presets` | `.presets(..)` | `DateRangePreset[]` | `[]` | Botones del popup que establecen el valor. |
| `numberOfMonths`, `firstDayOfWeek`, `disabledMatcher`, `yearRange` | como en `Calendar` | como en `Calendar` | como en `Calendar` | Los meses, semanas, fechas deshabilitadas y años del calendario. |
| `previousAccessibilityLabel`, `nextAccessibilityLabel` | como en `Calendar` | `string` | ninguno | Lo que dicen los lectores de pantalla para Anterior y Siguiente del calendario. |
| `placement`, `align`, `offset`, `margin` | `.placement(..)`, ... | como en `Select` | `"bottom"`, `"start"`, 0, 0 | Escritorios: dónde se coloca el popup respecto al disparador. |
| `popupClass`, `popupStyle` | `.popup_class(..)`, `.popup_style(..)` | `string`, `StyleProp<ViewStyle>` | ninguno | El popup (escritorios) o la hoja (pantallas táctiles). |
| `backdropClass`, `backdropStyle` | `.backdrop_class(..)`, `.backdrop_style(..)` | `string`, `StyleProp<ViewStyle>` | ninguno | El fondo (backdrop) detrás de la hoja. |
| `contentClass`, `contentStyle` | `.content_class(..)`, `.content_style(..)` | `string`, `StyleProp<ViewStyle>` | ninguno | El contenido del popup: los preajustes junto al calendario y la hora. |
| `presetsClass`, `presetsStyle` | `.presets_class(..)`, `.presets_style(..)` | `string`, `StyleProp<ViewStyle>` | ninguno | La columna de preajustes. |
| `presetClass`, `presetStyle` | `.preset_class(..)`, `.preset_style(..)` | `string`, `StyleProp<TextStyle>` | ninguno | El botón de cada preajuste. |
| `calendarClass`, `calendarStyle` | `.calendar_class(..)`, `.calendar_style(..)` | `string`, `StyleProp<ViewStyle>` | ninguno | El calendario. |
| `headerClass` … `itemStyle` | como en `Calendar` | como en `Calendar` | ninguno | El encabezado, el cuerpo, los meses, las filas y los elementos del calendario. |
| `renderItem` | `.render_item(..)` | `(item: CalendarEntry) => JSX.Element` | ninguno | Cada elemento del calendario, dibujado por la app según lo que es; sus estados son las clases de los elementos, como en `Calendar`. |
| `timeClass`, `timeStyle` | `.time_class(..)`, `.time_style(..)` | `string`, `StyleProp<ViewStyle>` | ninguno | La fila de la hora: su etiqueta al principio, el campo al final. |
| `timeLabel` | `.time_label(..)` | `JSX.Element` | ninguno | Lo que muestra la fila de la hora antes del campo. |
| `timeFieldClass`, `timeFieldStyle` | `.time_field_class(..)`, `.time_field_style(..)` | `string`, `StyleProp<ViewStyle>` | ninguno | El campo de hora. |
| `timeAccessibilityLabel` | `.time_accessibility_label(..)` | `string` | ninguno | Cómo llaman los lectores de pantalla al campo de hora. |
| `segmentClass`, `segmentStyle`, `separatorClass`, `separatorStyle`, `renderSegment` | como en `TimeField` | como en `TimeField` | ninguno | Los segmentos del campo de hora y `:`. |
| `clearButtonClass`, `clearButtonStyle` | `.clear_button_class(..)`, `.clear_button_style(..)` | `string`, `StyleProp<ViewStyle>` | ninguno | El botón de borrado (`cleanable`). |
| `clearButton` | `.clear_button(..)` | `JSX.Element` | ninguno | El contenido del botón de borrado. |
| `clearButtonAccessibilityLabel` | `.clear_button_accessibility_label(..)` | `string` | ninguno | Cómo llaman los lectores de pantalla al botón de borrado. |
| `trigger` | `.trigger(..)` | `JSX.Element` | ninguno | Lo que abre el popup al pulsarlo; el popup se coloca respecto a él. |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | ninguno | La vista que rodea al disparador. |

<a id="events"></a>

## Eventos

| Evento | Rust | Descripción |
|---|---|---|
| `onChange` | `.on_change(\|value\| ..)` | El valor cambió (un día, el final de un rango, un preajuste, la hora, el botón de borrado): `{ value }`. Establece `value` para seguirlo. |
| `onOpenChange` | `.on_open_change(\|e\| ..)` | El popup se abrió o se cerró, con el motivo (`{ open, reason }`). Establece `open` para seguirlo. |
| `onOpen`, `onClose` | `.on_open(..)`, `.on_close(..)` | El popup se muestra, o ya no está. |
| `onCancel` | `.on_cancel(..)` | El usuario cerró el popup sin elegir (Escape o atrás, una pulsación fuera o en el fondo). |

<a id="parts"></a>

## Partes

| Parte | Dónde | Estilizado con |
|---|---|---|
| El disparador | la vista del selector | el elemento propio de la app (`trigger`) |
| El botón de borrado | la vista del selector, después del disparador (`cleanable`, mientras haya un valor) | `clearButtonClass`, `clearButtonStyle`; su contenido `clearButton` |
| El popup o la hoja | sobre todo lo demás, junto al disparador (escritorios) o en la parte inferior (pantallas táctiles) | `popupClass`, `popupStyle` |
| El fondo (backdrop) | detrás de la hoja (pantallas táctiles) | `backdropClass`, `backdropStyle` |
| El contenido | el popup | `contentClass`, `contentStyle` |
| Los preajustes | el contenido, primero (`presets`) | `presetsClass`, `presetsStyle`; cada uno `presetClass`, `presetStyle` |
| El calendario | el contenido | `calendarClass`, `calendarStyle`, y las partes de [Calendar](./calendar.md#parts) |
| La fila de la hora | debajo del calendario (`timePrecision`) | `timeClass`, `timeStyle`; su etiqueta `timeLabel` |
| El campo de hora | la fila de la hora | `timeFieldClass`, `timeFieldStyle`, y las partes de [TimeField](./time-field.md#parts) |

<a id="keyboard"></a>

## Teclado

| Tecla | Acción |
|---|---|
| Return (en el disparador) | Abre el popup, o lo cierra. |
| Delete, Backspace (en el disparador) | Borra el valor mientras el popup está cerrado. |
| Escape | Cierra el popup sin elegir. |

En el popup, las teclas del calendario se mueven entre los días y eligen uno (véase [Teclado](./calendar.md#keyboard)) y las
del campo de hora editan la hora (véase [Teclado](./time-field.md#keyboard)).

<a id="accessibility"></a>

## Accesibilidad

- Para los lectores de pantalla, el disparador es un combobox: su etiqueta es `accessibilityLabel`, su valor es la fecha tal como la escribe
  `dateFormat` (por defecto `2026/10/28`, con la hora en `timePrecision`), e indica si el popup está expandido.
  `disabled` lo atenúa.
- Los días del calendario son botones nombrados por sus fechas ISO (véase [Accesibilidad](./calendar.md#accessibility)); los
  preajustes son botones nombrados por sus etiquetas; el campo de hora se nombra con `timeAccessibilityLabel`.
- El botón de borrado es un botón nombrado con `clearButtonAccessibilityLabel`.

Consulta [Accesibilidad](../docs/accessibility.md) para ver etiquetas, roles y anuncios en general.
