---
title: "Calendar"
description: "El componente Calendar: una fecha o un rango de fechas elegido entre meses de días, con vistas de mes y de año y compatibilidad con el teclado, con el estilo definido por la app."
group: base
demo: el-date-picker
source_hash: 48766bd0cb573ae0
---


# Calendar

Un calendario elige una fecha, o con `range` un rango de fechas, entre meses de días dispuestos en semanas: una fecha límite en un formulario, las noches de una estancia, los días de un informe. Muestra un mes o varios lado a lado, pasa los meses con Previous y Next, y cambia a una vista de los meses del año o a una página de años para ir lejos. Es el calendario del popup de [DatePicker](./date-picker.md), solo en la página.

El calendario es dueño del comportamiento: el valor (el de la app, o el suyo propio), el mes mostrado, las vistas, los días que no se pueden elegir, el teclado y lo que oyen los lectores de pantalla. El aspecto es de la app: da estilo al encabezado, al cuerpo, a cada mes, a cada fila y a cada elemento, y dibuja el contenido de los elementos (los nombres de los meses y de los días de la semana, la marca de hoy, la banda del rango). La cuadrícula ocupa el ancho que se le da, como las columnas de una tabla: los meses se lo reparten y los elementos de una fila se reparten la fila por igual, de modo que un calendario en la hoja de un teléfono ocupa toda la pantalla y uno en un popup dimensionado a su contenido conserva los anchos de sus elementos (`flex-none` en `itemClass` o `monthClass` mantiene un elemento o un mes en su propio ancho).

```rust tabs
use nsh_base::{CalendarEntry, CalendarItemKind, Date, Matcher, calendar};
use nsh_core::prelude::*;

const MONTHS: [&str; 12] = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];
const WEEKDAYS: [&str; 7] = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

fn due_date() -> impl IntoElement {
    let due = signal(Date::default());
    calendar()
        .value(move || due.get())
        .on_change(move |next: &Date| due.set(*next))
        .disabled_matcher(Matcher::DayOfWeek(vec![0, 6]))
        .previous_accessibility_label("Previous month")
        .next_accessibility_label("Next month")
        .item_class("rounded-md selected:bg-primary selected:text-primary-foreground disabled:opacity-50")
        .render_item(|item: &CalendarEntry| {
            let label = match item.kind {
                CalendarItemKind::Previous => "‹".to_string(),
                CalendarItemKind::Next => "›".to_string(),
                CalendarItemKind::Weekday => WEEKDAYS[item.value as usize].to_string(),
                CalendarItemKind::MonthToggle | CalendarItemKind::Month => {
                    MONTHS[item.value as usize - 1].to_string()
                }
                _ => item.value.to_string(),
            };
            view()
                .w_8()
                .h_8()
                .items_center()
                .justify_center()
                .child(text(label).text_sm())
        })
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { Calendar, type CalendarValue } from "nsh/base";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function App() {
  const due = signal<CalendarValue>(null);
  return (
    <Calendar
      value={due()}
      onChange={({ value }) => due.set(value)}
      disabledMatcher={[0, 6]}
      previousAccessibilityLabel="Previous month"
      nextAccessibilityLabel="Next month"
      class="w-72 gap-2 rounded-lg border border-border p-3"
      headerClass="flex-row items-center justify-between"
      rowClass="flex-row justify-between"
      itemClass="group h-8 min-w-8 items-center justify-center rounded-md text-sm focus:ring-2 focus:ring-ring selected:bg-primary selected:text-primary-foreground data-range-middle:rounded-none data-range-middle:bg-accent data-range-middle:text-accent-foreground data-outside:text-muted-foreground disabled:opacity-50"
      renderItem={(item) => (
        <Text class={item.today ? "font-semibold" : ""}>
          {item.kind === "weekday"
            ? WEEKDAYS[item.value]
            : item.kind === "month" || item.kind === "monthToggle"
              ? MONTHS[item.value - 1]
              : item.kind === "previous"
                ? "‹"
                : item.kind === "next"
                  ? "›"
                  : String(item.value)}
        </Text>
      )}
    />
  );
}

mount(App);
```

`Calendar` viene de [`nsh/base`](../modules/nsh-base.md), el crate `nsh-base` de Rust. En Rust, `calendar()` crea uno con un setter por prop (`.value(..)`, `.range(..)`, `.number_of_months(..)`) y un listener por evento (`.on_change(..)`). Su valor es un `Date` (`Date::Single`, `Date::Range`, a partir de un `chrono::NaiveDate` o de un par de ellos), y los días que deshabilita son un `Matcher`.

<a id="value"></a>

## Valor

El valor es una fecha ISO, `"2026-10-28"`, como la de un `<input type="date">` de HTML; con `range` es `[start, end]`, y `null` significa sin fecha. Con `value`, la app es la dueña del valor: el calendario lo muestra como seleccionado e informa de una elección con `onChange({ value })`; la app asigna `value` para seguirla. Si se omite, el calendario conserva su propio valor, que al principio viene de `defaultValue`.

`onChange` informa solo de valores completos, como el `Selected` de `gpui-base`: un día pulsado, o el final de un rango.

- Sin `range`, pulsar un día lo elige.
- Con `range`, la primera pulsación inicia el rango y la segunda lo termina, y los días entre ambas quedan en el rango (cada uno `selected`, con los extremos incluidos, véase [Elementos](#items)). Una segunda pulsación en un día anterior reinicia el rango desde él, igual que una pulsación cuando el rango ya está completo. Un rango a medias se muestra hasta que se completa y solo entonces se informa.

El calendario se abre en el mes del valor (el inicio de un rango) y, si no hay valor, en el de hoy.

<a id="months-and-views"></a>

## Meses y vistas

`numberOfMonths` muestra ese número de meses lado a lado, a partir del mes mostrado; Previous y Next los pasan de uno en uno. `firstDayOfWeek` es el día en que empiezan las semanas, de `0` domingo (el valor por defecto) a `6` sábado.

El encabezado contiene Previous, dos interruptores y Next:

- La vista de días muestra los días de los meses, cada mes como una columna con su fila de días de la semana y sus semanas; los días de los meses anterior y posterior completan las semanas (`outside`, `data-outside`).
- El interruptor de mes (`monthToggle`) abre la vista de meses: los doce meses, en filas de tres. Al elegir uno, se muestra en la vista de días.
- El interruptor de año (`yearToggle`) abre la vista de años: una página de 20 años, en filas de cinco, con Previous y Next para pasar de página. Al elegir uno, se muestra ese año en la vista de días. `yearRange` son los años que recorren las páginas, `[start, end)` (por defecto: de 50 años antes de este a 50 después).

Con varios meses, el encabezado muestra el título de cada mes en lugar de los interruptores (un elemento `monthToggle` que no admite pulsación), como el de `gpui-base`.

<a id="disabled-dates"></a>

## Fechas deshabilitadas

`disabledMatcher` son los días que el usuario no puede elegir, el `Matcher` de `gpui-base`, en una de cuatro formas:

| Forma | Deshabilita |
|---|---|
| `[0, 6]` | Esos días de la semana, `0` domingo a `6` sábado. |
| `{ before, after }` | Los días anteriores a `before` y posteriores a `after` (se puede omitir cualquiera de los dos). |
| `{ from, to }` | Los días desde `from` hasta `to`, ambos incluidos (si se omite uno, queda abierto). |
| `(date) => boolean` | Los días para los que la función devuelve `true`, dada la fecha ISO de cada día mostrado. |

La función se consulta una vez por día mostrado, en el siguiente turno de JS, y no se vuelve a consultar por un día que ya respondió: al pasar los meses solo se pregunta por los días que traen, por lo que su respuesta debe ser una función pura de la fecha. Pasar otra función vuelve a consultar. Un día deshabilitado es `disabled:`: no admite pulsación, y Return y Space no lo eligen.

<a id="items"></a>

## Elementos

Cada objetivo de pulsación y cada etiqueta del calendario es un elemento: Previous, los interruptores, Next, los días de la semana, los días, los meses y los años. Cada uno se dibuja en una parte con estilo de `itemClass` y `itemStyle`, cuyas variantes siguen su estado:

| Variante | El elemento |
|---|---|
| `selected:` | Está seleccionado: la fecha, cada día de un rango completo (con los extremos incluidos, como el range calendar de React Aria), el inicio de un rango a medias, el mes o año mostrado, el interruptor de la vista abierta. Los lectores de pantalla lo oyen como seleccionado. |
| `disabled:` | No admite pulsación: una fecha deshabilitada, un día de la semana, el título de un mes, Previous y Next en la vista de meses o en los extremos de los años. |
| `focus:` | Tiene el teclado. |
| `data-range-start:`, `data-range-end:` | Es el primer o el último día de un rango completo (un rango de un solo día es ambos). |
| `data-range-middle:` | Es un día dentro de un rango completo, sin ser un extremo. |
| `data-today:` | Es hoy. |
| `data-outside:` | Es un día del mes anterior o posterior, que completa sus semanas. |

Las variantes de `data-*` son las de Tailwind (`data-range-start:` coincide con `[data-range-start]`), como en los días del calendario de shadcn; con `group` en `itemClass`, el contenido las sigue con `group-selected:`, `group-data-range-middle:`, y así sucesivamente. `selected:` significa cada día de un rango, de modo que los extremos de un rango toman su aspecto por encima de él (las variantes posteriores ganan: `data-*` va después de `selected:`), y sus días intermedios el suyo:

```tsx
<Calendar
  range
  itemClass="group rounded-md selected:bg-primary selected:text-primary-foreground data-range-middle:rounded-none data-range-middle:bg-accent data-range-middle:text-accent-foreground data-range-start:rounded-r-none data-range-end:rounded-l-none data-range-start:data-range-end:rounded-md"
/>
```

`renderItem` dibuja el contenido de un elemento a partir de lo que es, un `CalendarEntry`, nunca a partir de su estado: el dibujo se hace una vez y se conserva mientras el elemento está seleccionado, enfocado o incluido en un rango, de modo que las teclas, una elección y el foco no dibujan nada de nuevo, y al pasar los meses se dibujan una sola vez los días que traen (un día conserva su dibujo según su mes y su fecha: con varios meses, los meses que siguen mostrándose conservan los suyos).

| Campo | Significado |
|---|---|
| `kind` | `"previous"`, `"monthToggle"`, `"yearToggle"`, `"next"`, `"weekday"`, `"day"`, `"month"` o `"year"`. |
| `value` | Su número: el día del mes, el mes (1 a 12), el año, el día de la semana (`0` domingo a `6`); `0` para Previous y Next. |
| `date` | La fecha ISO de un día. |
| `year`, `month` | El año y el mes a los que pertenece: los de un día (el mes cuyas semanas lo muestran), los del interruptor o título de un mes, los de un mes de la vista de meses; el año propio de un interruptor de año y de un año. `0` para Previous, Next y los días de la semana (y `month` para el interruptor de año y los años). |
| `today` | El día es hoy. |
| `outside` | El día es del mes anterior o posterior. |

Sin `renderItem`, un elemento muestra su número, y Previous y Next muestran `‹` y `›`, como los de `gpui-base`; un día de la semana también muestra su número, de `0` a `6`, ya que los nombres de los meses y de los días de la semana son palabras de la app, en el idioma de la app.

## Props

| Prop | Rust | Tipo | Por defecto | Descripción |
|---|---|---|---|---|
| `value` | `.value(..)` | `CalendarValue` | ninguno | El valor, del que es dueña la app. |
| `defaultValue` | `.default_value(..)` | `CalendarValue` | `null` | El valor inicial, sin `value`. |
| `range` | `.range(..)` | `boolean` | `false` | Elegir un rango: la primera pulsación lo inicia, la segunda lo termina. |
| `numberOfMonths` | `.number_of_months(..)` | `number` | `1` | Cuántos meses se muestran lado a lado. |
| `firstDayOfWeek` | `.first_day_of_week(..)` | `number` | `0` | El día en que empiezan las semanas, de `0` domingo a `6` sábado. |
| `disabledMatcher` | `.disabled_matcher(..)` | `DateMatcher` | ninguno | Las fechas que no se pueden elegir. |
| `yearRange` | `.year_range(..)` | `[number, number]` | 50 años a cada lado | Los años que recorre la vista de años, `[start, end)`. |
| `previousAccessibilityLabel` | `.previous_accessibility_label(..)` | `string` | ninguno | Lo que dicen los lectores de pantalla para Previous. |
| `nextAccessibilityLabel` | `.next_accessibility_label(..)` | `string` | ninguno | Lo que dicen los lectores de pantalla para Next. |
| `headerClass`, `headerStyle` | `.header_class(..)`, `.header_style(..)` | `string`, `StyleProp<ViewStyle>` | ninguno | El encabezado: Previous, los interruptores (o los títulos de los meses), Next. |
| `bodyClass`, `bodyStyle` | `.body_class(..)`, `.body_style(..)` | `string`, `StyleProp<ViewStyle>` | ninguno | El cuerpo: los meses lado a lado, o las filas de la vista de meses o de años. |
| `monthClass`, `monthStyle` | `.month_class(..)`, `.month_style(..)` | `string`, `StyleProp<ViewStyle>` | ninguno | Cada mes de la vista de días. |
| `rowClass`, `rowStyle` | `.row_class(..)`, `.row_style(..)` | `string`, `StyleProp<ViewStyle>` | ninguno | Cada fila: los días de la semana, una semana, una fila de meses o de años. |
| `itemClass`, `itemStyle` | `.item_class(..)`, `.item_style(..)` | `string`, `StyleProp<TextStyle>` | ninguno | Cada elemento: `selected:`, `disabled:`, `focus:`; los `data-range-start:`, `data-range-end:`, `data-range-middle:`, `data-today:`, `data-outside:` de un día ([Elementos](#items)). |
| `renderItem` | `.render_item(..)` | `(item: CalendarEntry) => JSX.Element` | ninguno | El contenido de un elemento, dibujado por la app a partir de lo que es el elemento; su número en caso contrario. |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | ninguno | El calendario: el encabezado sobre el cuerpo. |

<a id="events"></a>

## Eventos

| Evento | Rust | Descripción |
|---|---|---|
| `onChange` | `.on_change(\|value\| ..)` | El usuario eligió un valor completo: `{ value }`, un día o un rango. Asigna `value` para seguirlo. Nunca se informa de un `value` que pasa la app. |

<a id="parts"></a>

## Partes

| Parte | Dónde | Estilo con |
|---|---|---|
| El calendario | la raíz | `class`, `style` |
| El encabezado | el calendario, primero | `headerClass`, `headerStyle` |
| El cuerpo | el calendario, después del encabezado | `bodyClass`, `bodyStyle` |
| Un mes | el cuerpo (vista de días) | `monthClass`, `monthStyle` |
| Una fila | un mes, o el cuerpo (vistas de meses y de años) | `rowClass`, `rowStyle` |
| Un elemento | el encabezado y las filas | `itemClass`, `itemStyle`, `renderItem` (`group-selected:`, `group-data-range-middle:`, ... dentro, bajo `group` en `itemClass`) |

<a id="keyboard"></a>

## Teclado

Los días son una única parada de Tab: aterriza en el día seleccionado, si no en hoy, si no en el primer día mostrado. Después:

| Tecla | Acción |
|---|---|
| Izquierda / Derecha | El día anterior o posterior. |
| Arriba / Abajo | El mismo día una semana antes o después. |
| Home / End | El primer o el último día de la semana. |
| Page Up / Page Down | El mismo día un mes antes o después. |
| Shift+Page Up / Shift+Page Down | El mismo día un año antes o después. |
| Return, Space | Elige el día. |

En un diseño de derecha a izquierda las semanas corren desde la derecha, así que Izquierda es el día posterior y Derecha el anterior; Arriba y Abajo mantienen las semanas. Al pasar de los meses mostrados, estos se desplazan. Previous, los interruptores, Next, los meses y los años admiten pulsaciones.
Los días de `gpui-base` solo admiten pulsaciones; las teclas son las de NSH, según el diálogo de selector de fecha de WAI-ARIA.

<a id="accessibility"></a>

## Accesibilidad

- Cada día es un botón nombrado por su fecha ISO, seleccionado mientras es la fecha o un día del rango (con los extremos incluidos, como el range calendar de React Aria), y atenuado mientras está deshabilitado.
- Previous y Next son botones nombrados por `previousAccessibilityLabel` y `nextAccessibilityLabel`; los interruptores, los meses y los años son botones nombrados por lo que muestran.

Consulta [Accesibilidad](../docs/accessibility.md) para ver las etiquetas, los roles y los anuncios en general.
