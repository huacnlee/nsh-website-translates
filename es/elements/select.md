---
title: "Select"
description: "El componente Select: un valor elegido de una lista de elementos, con un popup junto a su disparador en escritorio y una hoja (sheet) en teléfonos, con teclado, búsqueda por escritura (typeahead), búsqueda y secciones, y con el estilo definido por la aplicación."
group: base
demo: el-select
source_hash: 2fc7845fec15f74b
---


# Select

Un select elige un valor de una lista de elementos: un ajuste, un filtro, un país, una zona horaria. El disparador de la app abre la lista, presentada como cada dispositivo espera:

- En escritorio y en navegadores de escritorio, un popup sobre el disparador con la fila seleccionada colocada encima de él, de modo que el título elegido se queda donde estaba (la posición `item-aligned` de shadcn/ui), tan ancho como el disparador (un ancho de la app con `popupStyle` / `popupClass` fija otro, como `menu_width` de `gpui-component`) y tan alto como sus filas hasta el espacio disponible en pantalla; sin nada seleccionado se abre debajo del disparador. El teclado se mueve por los elementos y elige uno.
- En teléfonos y tabletas, una hoja en la parte inferior de la pantalla sobre un fondo.

El select es dueño del comportamiento: el valor (el de la app o el suyo propio), el estado abierto, el teclado, la búsqueda por tecleo, la búsqueda, las secciones, la fila resaltada y lo que oyen los lectores de pantalla. El aspecto es de la app: da estilo al disparador, al popup, a la lista, a las filas, a los encabezados de las secciones y al campo de búsqueda, o dibuja ella misma las filas.

```rust tabs
use nsh_base::{SelectEntry, SelectItem, select, theme};
use nsh_core::prelude::*;

const FRUITS: [(&str, &str); 5] = [
    ("apple", "Apple"),
    ("banana", "Banana"),
    ("blueberry", "Blueberry"),
    ("grapes", "Grapes"),
    ("pineapple", "Pineapple"),
];

fn fruit_select() -> impl IntoElement {
    let fruit = signal(None::<SharedString>);
    let title = move || {
        let chosen = fruit.get();
        FRUITS
            .iter()
            .find(|(value, _)| Some(*value) == chosen.as_deref())
            .map_or("Pick a fruit", |(_, title)| *title)
            .to_string()
    };
    select()
        .items(
            FRUITS
                .iter()
                .map(|&(value, title)| SelectItem::new(value, title).disabled(value == "grapes"))
                .collect::<Vec<_>>(),
        )
        .value(move || fruit.get())
        .on_change(move |next: &Option<SharedString>| fruit.set(next.clone()))
        .accessibility_label("Fruit")
        .offset(px(4.0))
        .popup_style(|s| {
            s.p_1()
                .rounded_lg()
                .border_1()
                .border_color(move || theme().border)
                .bg(move || theme().popover)
                .text_color(move || theme().popover_foreground)
                .shadow_md()
        })
        .item_class("rounded-md focus:bg-accent selected:font-medium disabled:opacity-50")
        .trigger(
            view()
                .h_9()
                .w_48()
                .flex_row()
                .items_center()
                .justify_between()
                .px_3()
                .rounded_md()
                .border_1()
                .border_color(move || theme().input)
                .hover(|s| s.bg(move || theme().accent))
                .child(text(title))
                .child(text("▾").text_color(move || theme().muted_foreground)),
        )
        .render_item(|item: &SelectEntry| {
            view()
                .flex_row()
                .items_center()
                .px_2()
                .py_1p5()
                .child(text(item.title.clone()).text_sm())
        })
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { Select } from "nsh/base";

const FRUITS = [
  { value: "apple", title: "Apple" },
  { value: "banana", title: "Banana" },
  { value: "blueberry", title: "Blueberry" },
  { value: "grapes", title: "Grapes", disabled: true },
  { value: "pineapple", title: "Pineapple" },
];

function App() {
  const fruit = signal<string | null>(null);
  const title = () => FRUITS.find((f) => f.value === fruit())?.title;
  return (
    <Select
      items={FRUITS}
      value={fruit()}
      onChange={({ value }) => fruit.set(value)}
      accessibilityLabel="Fruit"
      offset={4}
      popupClass="rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-md"
      backdropClass="bg-black/40"
      itemClass="rounded-md px-2 py-1.5 text-sm focus:bg-accent focus:text-accent-foreground disabled:opacity-50"
      trigger={
        <View class="h-9 w-48 flex-row items-center justify-between rounded-md border border-input px-3 hover:bg-accent active:bg-accent focus-visible:ring-2 focus-visible:ring-ring">
          <Text class={fruit() ? "text-foreground" : "text-muted-foreground"}>{title() ?? "Pick a fruit"}</Text>
          <Text class="text-muted-foreground">▾</Text>
        </View>
      }
    />
  );
}

mount(App);
```

`Select` proviene de [`nsh/base`](../modules/nsh-base.md), el crate `nsh-base` de Rust. En Rust, `select()` crea uno con un setter por prop (`.items(..)`, `.value(..)`, `.item_style(..)`) y un listener por evento (`.on_change(..)`); `SelectItem::new(value, title)` crea un elemento, con `.disabled(..)` y `.group(..)`.

## Items

`items` es la lista como datos: cada elemento tiene un `value` (único entre los elementos: lo que se establece al elegirlo), un `title` (lo que muestra su fila, lo que buscan la búsqueda y la búsqueda por tecleo, y lo que dicen los lectores de pantalla), y opcionalmente `disabled` y un `group`. Los elementos adyacentes de un mismo `group` forman una sección bajo un encabezado con ese título:

```tsx
<Select
  items={[
    { value: "lisbon", title: "Lisbon", group: "Europe" },
    { value: "london", title: "London", group: "Europe" },
    { value: "tokyo", title: "Tokyo", group: "Asia" },
    { value: "seoul", title: "Seoul", group: "Asia", disabled: true },
  ]}
  groupClass="px-2 pb-1 pt-2 text-xs text-muted-foreground"
  trigger={trigger}
/>
```

Las filas son una lista virtualizada dentro de la vista de desplazamiento del popup: una lista de miles de elementos solo crea las filas visibles, y el popup se desplaza cuando sus filas son más altas que el espacio disponible.

<a id="value"></a>

## Valor

Con `value`, la app es dueña del elemento elegido: el select muestra el elemento de ese valor e informa de una elección con `onChange({ value })`; la app establece `value` para seguirla, o mantiene el suyo. `value={null}` significa que no hay nada elegido. Si se omite, el select mantiene su propio valor, a partir de `defaultValue` al principio. `onChange` informa de los cambios: elegir de nuevo el elemento ya elegido cierra la lista.

`cleanable` añade un botón de borrado mientras hay un elemento elegido: al pulsarlo se borra el valor, lo que se notifica como `onChange({ value: null })`, y la lista permanece cerrada. El botón va después del disparador en la vista del select, no dentro de él, de modo que pulsarlo nunca abre la lista; la app lo coloca (sobre el extremo del disparador con `absolute`, donde iría un chevron) y lo rellena:

```tsx
<Select
  items={fonts}
  value={font()}
  onChange={({ value }) => font.set(value)}
  cleanable
  clearButtonAccessibilityLabel="Clear the font"
  clearButtonClass="absolute right-2 top-2 size-5 items-center justify-center rounded-full hover:bg-accent"
  clearButton={<Text class="text-xs text-muted-foreground">✕</Text>}
  trigger={trigger}
/>
```

El disparador es un elemento de la app, así que muestra lo que la app quiera para el elemento elegido: su título, un icono, un marcador de posición mientras no hay nada elegido. En TSX es el elemento que se pasa: es el combobox y recibe por sí mismo las pulsaciones, el foco de teclado, el estado expandido y `disabled`, de modo que sus propias clases `active:`, `focus:` y `disabled:` siguen al select, su propio `onPress` también se ejecuta, y la lista se coloca contra él y tiene su mismo ancho.

<a id="open-state"></a>

## Estado abierto

Sin `open`, el select mantiene su propio estado abierto (a partir de `defaultOpen`). Con `open`, la app es dueña de él y lo cambia en `onOpenChange({ open, reason })`: `"triggerPress"` (una pulsación del disparador, o una de sus teclas), `"select"` (una elección), `"pressOutside"`, `"backdropPress"` o `"cancel"` (Escape o atrás). `onOpen` y `onClose` indican cuándo la lista se muestra y cuándo ha desaparecido (una hoja, una vez que entró y una vez que salió), y `onCancel` que el usuario la cerró sin elegir.

<a id="search"></a>

## Búsqueda

`searchable` coloca un campo de búsqueda sobre los elementos: al escribir se filtran por título, sin distinguir mayúsculas de minúsculas, y una sección sin coincidencias desaparece junto con su encabezado. El resaltado pasa a la primera coincidencia, las teclas siguen moviéndolo mientras el campo tiene el teclado, y Return la elige. `empty` es lo que muestra la lista mientras nada coincide:

```tsx
<Select
  items={zones}
  searchable
  searchPlaceholder="Search time zones"
  searchAccessibilityLabel="Search time zones"
  searchClass="mx-1 mb-1 rounded-md border border-input px-2 py-1.5 text-sm"
  empty={<Text class="px-2 py-6 text-center text-sm text-muted-foreground">No time zone found</Text>}
  trigger={trigger}
/>
```

En escritorio, el campo de búsqueda toma el teclado al abrirse la lista; en pantallas táctiles, el teclado aparece al pulsar el campo. Cada apertura empieza con una búsqueda vacía.

<a id="rows-the-app-draws"></a>

## Filas que dibuja la app

`itemClass` da estilo a la fila de cada elemento, que muestra el título del elemento hasta que `renderItem` la dibuja: `focus:` se aplica a la fila resaltada (donde están las teclas o el puntero), `selected:` a la elegida y `disabled:` a una deshabilitada. Para dibujar una fila, indica `renderItem`: recibe lo que es el elemento ([`SelectEntry`](#types)) y devuelve el contenido de la fila, para las filas visibles. Nunca recibe el estado de la fila: con `group` en `itemClass`, el contenido sigue los estados de la fila con las clases `group-focus:`, `group-selected:` y `group-disabled:`, de modo que el dibujo se hace una vez por elemento y un movimiento del resaltado o una elección no vuelve a dibujar nada. `renderGroup` dibuja el encabezado de una sección de la misma manera:

```tsx
<Select
  items={fonts}
  itemClass="group rounded-md focus:bg-accent disabled:opacity-50"
  renderItem={(item) => (
    <View class="flex-row items-center gap-2 px-2 py-1.5">
      <Text class="flex-1 text-sm" style={{ fontFamily: item.value }}>{item.title}</Text>
      <Text class="w-4 text-right text-sm opacity-0 group-selected:opacity-100">✓</Text>
    </View>
  )}
  renderGroup={(group) => <Text class="px-2 pt-2 text-xs font-medium text-muted-foreground">{group.title}</Text>}
  trigger={trigger}
/>
```

## Props

| Prop | Rust | Tipo | Predeterminado | Descripción |
|---|---|---|---|---|
| `items` | `.items(..)` | `SelectItem[]` | `[]` | Los elementos, en orden. |
| `value` | `.value(..)` | `string \| null` | ninguno | El `value` del elemento elegido, del que es dueña la app; `null` para ninguno. Si se omite, el select mantiene el suyo. |
| `defaultValue` | `.default_value(..)` | `string` | ninguno | El valor inicial, sin `value`. |
| `open` | `.open(..)` | `boolean` | ninguno | Abierto, del que es dueña la app. |
| `defaultOpen` | `.default_open(..)` | `boolean` | `false` | Abierto al principio, sin `open`. |
| `searchable` | `.searchable(..)` | `boolean` | `false` | Un campo de búsqueda sobre los elementos los filtra por título. |
| `searchPlaceholder` | `.search_placeholder(..)` | `string` | ninguno | El marcador de posición del campo de búsqueda. |
| `searchAccessibilityLabel` | `.search_accessibility_label(..)` | `string` | ninguno | Cómo llaman los lectores de pantalla al campo de búsqueda: qué busca. |
| `cleanable` | `.cleanable(..)` | `boolean` | `false` | Un botón de borrado mientras hay un elemento elegido; al pulsarlo se borra el valor (`onChange({ value: null })`). |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Permanece cerrado: el disparador no recibe pulsaciones ni foco de teclado, y se le aplican los estilos `disabled:`. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | ninguno | Cómo lo llaman los lectores de pantalla: sobre qué trata la elección. |
| `placement` | `.placement(..)` | `"top" \| "bottom" \| "left" \| "right"` | `"bottom"` | Escritorio: el lado del disparador en el que va la lista, el otro lado cuando solo en ese hay espacio. |
| `align` | `.align(..)` | `"start" \| "center" \| "end"` | `"start"` | Escritorio: cómo se alinea con el disparador. |
| `offset` | `.offset(..)` | `number` | `0` | Escritorio: la separación entre el disparador y la lista. |
| `margin` | `.margin(..)` | `number` | `0` | Escritorio: la distancia que mantiene respecto a los bordes del área segura. |
| `popupClass`, `popupStyle` | `.popup_class(..)`, `.popup_style(..)` | `string`, `StyleProp<ViewStyle>` | ninguno | El popup (escritorio) o la hoja (pantallas táctiles) en que está la lista. |
| `backdropClass`, `backdropStyle` | `.backdrop_class(..)`, `.backdrop_style(..)` | `string`, `StyleProp<ViewStyle>` | ninguno | Pantallas táctiles: el fondo detrás de la hoja. |
| `listClass`, `listStyle` | `.list_class(..)`, `.list_style(..)` | `string`, `StyleProp<ViewStyle>` | ninguno | La lista, la vista de desplazamiento de las filas. |
| `itemClass`, `itemStyle` | `.item_class(..)`, `.item_style(..)` | `string`, `StyleProp<TextStyle>` | ninguno | La fila de cada elemento, cuyo título hereda sus estilos de texto: `focus:` mientras está resaltada, `selected:` mientras está elegida, `disabled:` mientras no puede estarlo. |
| `groupClass`, `groupStyle` | `.group_class(..)`, `.group_style(..)` | `string`, `StyleProp<ViewStyle>` | ninguno | El encabezado de cada sección. |
| `searchClass`, `searchStyle` | `.search_class(..)`, `.search_style(..)` | `string`, `StyleProp<InputStyle>` | ninguno | El campo de búsqueda: su caja y su texto (`color`, `fontSize`, `placeholderColor`). |
| `clearButtonClass`, `clearButtonStyle` | `.clear_button_class(..)`, `.clear_button_style(..)` | `string`, `StyleProp<ViewStyle>` | ninguno | El botón de borrado (`cleanable`); `disabled:` con el select. |
| `clearButton` | `.clear_button(..)` | `JSX.Element` | ninguno | El contenido del botón de borrado: una cruz, un icono. |
| `clearButtonAccessibilityLabel` | `.clear_button_accessibility_label(..)` | `string` | ninguno | Cómo llaman los lectores de pantalla al botón de borrado. |
| `trigger` | `.trigger(..)` | `JSX.Element` | ninguno | Lo que abre la lista al pulsarlo; la lista se coloca contra él. |
| `empty` | `.empty(..)` | `JSX.Element` | ninguno | Lo que muestra la lista mientras no se muestra ningún elemento (una búsqueda sin coincidencias). |
| `renderItem` | `.render_item(..)` | `(item: SelectEntry) => JSX.Element` | ninguno | La fila de un elemento, dibujada por la app a partir de lo que es el elemento (sus estados son las clases de la fila); en caso contrario, el título del elemento. |
| `renderGroup` | `.render_group(..)` | `(group: SelectGroup) => JSX.Element` | ninguno | El encabezado de una sección, dibujado por la app; en caso contrario, su título. |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | ninguno | La vista que rodea al disparador. |

<a id="events"></a>

## Eventos

| Evento | Rust | Descripción |
|---|---|---|
| `onChange` | `.on_change(\|value\| ..)` | El usuario eligió otro elemento (una pulsación, Return o Space, búsqueda por tecleo en el disparador): su `value`; `null` cuando el botón de borrado lo borró. Establece `value` para seguirlo. |
| `onOpenChange` | `.on_open_change(\|e\| ..)` | La lista se abrió o se cerró, con el motivo. Establece `open` para seguirlo. |
| `onOpen` | `.on_open(\|\| ..)` | La lista se muestra; como hoja, una vez que entró. |
| `onClose` | `.on_close(\|\| ..)` | La lista ha desaparecido; como hoja, una vez que salió. También cuando la app la cerró. |
| `onCancel` | `.on_cancel(\|\| ..)` | El usuario cerró la lista sin elegir (Escape o atrás, una pulsación fuera o sobre el fondo). |

Se producen en este orden: `onChange` para una elección, o `onCancel` para un cierre sin ella, después `onOpenChange`, y por último `onOpen` o `onClose` una vez que la lista se muestra o desaparece.

<a id="types"></a>

<a id="types"></a>

## Tipos

| Tipo | Miembros | Descripción |
|---|---|---|
| `SelectItem` | `value: string`, `title: string`, `disabled?: boolean`, `group?: string` | Un elemento de `items`. |
| `SelectEntry` | `value`, `title`, `disabled`, `group?` (los del elemento), `index: number` | Lo que recibe `renderItem`: el elemento y su índice entre los `items`, nunca su estado (los `focus:`, `selected:` y `disabled:` de la fila). |
| `SelectGroup` | `title: string` | Lo que recibe `renderGroup`: el `group` de la sección. |

En Rust son `nsh_base::SelectItem`, `SelectEntry` y `SelectGroup`; `value` es un `SelectValue` (`Controlled(Some(..))` para un valor, `Controlled(None)` para `null`), que `.value(..)` crea a partir de un `Option<SharedString>` o una cadena.

<a id="parts"></a>

## Partes

| Parte | Dónde | Estilo con |
|---|---|---|
| El disparador | la vista del select | el elemento propio de la app (`trigger`) |
| El botón de borrado | la vista del select, después del disparador (`cleanable`, mientras hay un elemento elegido) | `clearButtonClass`, `clearButtonStyle`; su contenido `clearButton` |
| El popup o la hoja | sobre todo lo demás, junto al disparador (escritorio) o en la parte inferior (pantallas táctiles) | `popupClass`, `popupStyle` |
| El fondo | detrás de la hoja (pantallas táctiles) | `backdropClass`, `backdropStyle` |
| El campo de búsqueda | el popup, primero (`searchable`) | `searchClass`, `searchStyle`, `searchPlaceholder`, `searchAccessibilityLabel` |
| La lista | el popup, después del campo de búsqueda | `listClass`, `listStyle` |
| El encabezado de una sección | la lista, antes de sus elementos | `groupClass`, `groupStyle`, `renderGroup` |
| La fila de un elemento | la lista | `itemClass`, `itemStyle`, `renderItem` (`group-focus:`, `group-selected:`, `group-disabled:` en su interior, bajo `group` en `itemClass`) |
| El estado vacío | el popup, mientras no se muestra ningún elemento | su propio elemento (`empty`) |

El popup es una columna: su altura sigue la del campo de búsqueda y las filas, así que un `max-h-*` en `popupClass` la limita y la lista se desplaza dentro de ella.

<a id="keyboard"></a>

## Teclado

En escritorio, Tab llega al disparador de un select que no está `disabled`. Con la lista cerrada, Down, Up, Return y Space la abren sobre el elemento elegido (sin ninguno elegido, Up sobre el último elemento habilitado y las demás sobre el primero), y las letras y los dígitos eligen el elemento cuyo título empieza por lo que se ha escrito, como hace un select nativo. Con la lista abierta:

| Tecla | Acción |
|---|---|
| Down, Up | El elemento habilitado siguiente o anterior, dando la vuelta en los extremos. |
| Home, End | El primer o el último elemento habilitado (los propios del campo de búsqueda mientras tiene el teclado). |
| Page Down, Page Up | Avanza o retrocede una página de filas. |
| Return | Elige el elemento resaltado y cierra la lista. |
| Space | Elige el elemento resaltado (sin campo de búsqueda). |
| Letras, dígitos | El siguiente elemento cuyo título empieza por lo escrito en el último segundo (sin campo de búsqueda). |
| Escape | Cierra la lista sin elegir. |

Cuando la lista se cierra, el foco de teclado vuelve al disparador, salvo que una pulsación fuera lo haya llevado a otro sitio. El puntero resalta la fila sobre la que se mueve; la fila resaltada se hace visible a medida que las teclas se mueven hacia ella.

<a id="on-each-device"></a>

## En cada dispositivo

| | Escritorio y navegadores de escritorio | Teléfonos y tabletas |
| --- | --- | --- |
| La lista | un popup sobre el disparador, con la fila seleccionada sobre él (debajo de él mientras no hay ninguna), tan ancho como el disparador salvo que `popupStyle` fije un ancho, y tan alto como sus filas hasta el espacio disponible en pantalla | una hoja en la parte inferior sobre un fondo, tan alta como sus filas hasta la barra de estado |
| Cerrarla | una elección, Escape, una pulsación fuera (que continúa hacia lo que hay bajo el puntero) | una elección, el fondo, el botón de retroceso de Android |
| Búsqueda | el campo toma el teclado al abrirse la lista | el teclado aparece al pulsar el campo |
| Una elección | la pulsación al bajar elige, de modo que el campo de búsqueda conserva el teclado | un toque |

`popupClass` da estilo al popup en escritorio y a la hoja en teléfonos; un estilo que difiere entre ellos puede comparar `platform.idiom` (`nsh/device`) con `"desktop"`.
<a id="accessibility"></a>

## Accesibilidad

- El activador es un combobox para lectores de pantalla: su etiqueta es `accessibilityLabel`, su valor es el título del elemento elegido
  e indica si la lista está expandida. `disabled` lo atenúa.
- El botón de borrar es un botón cuyo nombre proviene de `clearButtonAccessibilityLabel`; no es una parada del tabulador.
- El campo de búsqueda es un campo de texto cuyo nombre proviene de `searchAccessibilityLabel`; su marcador de posición es una pista que se muestra mientras
  el campo está vacío.
- La lista es un listbox y cada fila una opción, con su título como nombre; la opción elegida aparece seleccionada y la deshabilitada
  atenuada. Los encabezados de las secciones son encabezados.
- Cuando las teclas mueven el resaltado, el foco del lector de pantalla pasa a la fila resaltada; mientras el campo de búsqueda
  tiene el teclado, se anuncia en su lugar el título del elemento resaltado, de modo que se pueda seguir escribiendo.

Consulta [Accesibilidad](../docs/accessibility.md) para ver etiquetas, roles y anuncios en general.
