---
title: "Combobox"
description: "El componente Combobox: uno o varios valores elegidos de una lista de elementos filtrados al escribir en su campo de entrada, con una ventana emergente bajo el campo en equipos de escritorio y una hoja en teléfonos, con el estilo definido por la aplicación."
group: base
demo: el-combobox
source_hash: 278180c11b9d894f
---


# Combobox

A combobox elige valores de una lista de elementos, uno o, con `multiple`, varios: las etiquetas de una publicación, los miembros de un canal, los idiomas de un documento. Su disparador es un campo de texto: al escribir se abre la lista y se filtra, como hace el combobox de shadcn/ui. Es hermano de [Select](./select.md) y comparte su lista, presentada como espera cada dispositivo:

- En escritorio y en navegadores de escritorio, un popup bajo el campo, tan ancho como el campo (el ancho `popupStyle` / `popupClass` de la app establece otro) y tan alto como sus filas, hasta el espacio disponible a su lado.
- En teléfonos y tabletas, una hoja en la parte inferior de la pantalla sobre un fondo (backdrop).

El combobox se encarga del comportamiento: el valor (el de la app o el suyo propio), el estado de apertura, el teclado, la búsqueda, las secciones, la fila resaltada y lo que oyen los lectores de pantalla. Con `multiple`, una elección activa o desactiva el elemento en el valor y la lista permanece abierta, de modo que se pueden elegir varios de una vez. El aspecto es de la app: da estilo al campo, al popup, a la lista, a las filas, a los encabezados de sección, al campo de texto y al pie, o dibuja ella misma las filas.

```rust tabs
use nsh_base::{SelectEntry, SelectItem, combobox, theme};
use nsh_core::prelude::*;

const TAGS: [(&str, &str); 5] = [
    ("bug", "Bug"),
    ("design", "Design"),
    ("docs", "Docs"),
    ("perf", "Performance"),
    ("security", "Security"),
];

fn tag_picker() -> impl IntoElement {
    let tags = signal(Vec::<SharedString>::new());
    let title = move || match tags.get().len() {
        0 => "Add tags".to_string(),
        n => format!("{n} tags"),
    };
    combobox()
        .items(
            TAGS.iter()
                .map(|&(value, title)| SelectItem::new(value, title))
                .collect::<Vec<_>>(),
        )
        .multiple(true)
        .placeholder(title)
        .value(move || Some(tags.get()))
        .on_change(move |next: &Vec<SharedString>| tags.set(next.clone()))
        .accessibility_label("Tags")
        .offset(px(4.0))
        .popup_style(|s| {
            s.p_1()
                .rounded_lg()
                .border_1()
                .border_color(move || theme().border)
                .bg(move || theme().popover)
                .shadow_md()
        })
        .h_9()
        .w_48()
        .px_3()
        .flex_row()
        .items_center()
        .rounded_md()
        .border_1()
        .border_color(move || theme().input)
        .input_style(|s| s.flex_1().text_sm())
        .trigger_button(text("⌄"))
        .item_class("rounded-md focus:bg-accent selected:font-medium disabled:opacity-50")
        .render_item(|item: &SelectEntry| view().px_2().py_1p5().child(text(item.title.clone()).text_sm()))
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { Combobox } from "nsh/base";

const TAGS = [
  { value: "bug", title: "Bug" },
  { value: "design", title: "Design" },
  { value: "docs", title: "Docs" },
  { value: "perf", title: "Performance" },
  { value: "security", title: "Security" },
];

function App() {
  const tags = signal<string[]>([]);
  return (
    <Combobox
      items={TAGS}
      multiple
      placeholder={tags().length ? `${tags().length} tags` : "Add tags"}
      value={tags()}
      onChange={({ value }) => tags.set(value)}
      accessibilityLabel="Tags"
      offset={4}
      popupClass="rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-md"
      backdropClass="bg-black/40"
      class="h-9 w-48 flex-row items-center rounded-md border border-input px-3"
      inputClass="flex-1 text-sm placeholder:text-muted-foreground"
      itemClass="group rounded-md px-2 py-1.5 text-sm focus:bg-accent focus:text-accent-foreground"
      triggerButton={<Text class="px-1 text-muted-foreground">⌄</Text>}
      renderItem={(item) => (
        <View class="flex-row justify-between">
          <Text>{item.title}</Text>
          <Text class="opacity-0 group-selected:opacity-100">✓</Text>
        </View>
      )}
    />
  );
}

mount(App);
```

`Combobox` viene de [`nsh/base`](../modules/nsh-base.md), el crate `nsh-base` de Rust. En Rust, `combobox()` crea uno con un setter por prop (`.items(..)`, `.value(..)`, `.multiple(..)`) y un listener por evento (`.on_change(..)`). Sus elementos son los de `Select`: `SelectItem::new(value, title)`, con `.disabled(..)` y `.group(..)`, en secciones como los de un select (véase [Elementos](./select.md#items)).

<a id="value"></a>

## Valor

El valor es un array con los valores de los elementos seleccionados. Con `value`, la app es su propietaria: el combobox muestra esos elementos como seleccionados e informa de cada cambio con `onChange({ value })`; la app establece `value` para seguirlo, o mantiene el suyo. Si se omite, el combobox mantiene su propio valor, a partir de `defaultValue` al principio.

- Con `multiple`, una pulsación, Return o Espacio alterna el elemento resaltado: dentro del valor si estaba fuera, fuera si estaba dentro. La lista permanece abierta.
- Sin ello, una elección sustituye el valor por el de ese elemento y cierra la lista; elegir de nuevo el elemento seleccionado solo la cierra.

`onConfirm({ value })` informa del valor cuando la lista se cierra: una vez por apertura, se cierre como se cierre (una elección, Escape, una pulsación fuera, el botón disparador), con el valor tal como lo dejó el usuario. Cmd+Return en Mac (Ctrl+Return en otras plataformas) cierra la lista y confirma.

`cleanable` añade un botón de borrado mientras haya un elemento seleccionado: una pulsación vacía el valor (`onChange({ value: [] })`). El botón va después del campo de texto y antes del botón disparador; pulsarlo nunca abre la lista. La app lo rellena, como el [botón de borrado de un select](./select.md#value).

<a id="input"></a>

## Campo de texto

El disparador es un campo de texto en la fila del combobox (sus `class` y `style`: el borde y el relleno del campo), con el `prefix` de la app antes (los elementos elegidos como chips, un icono) y, después, el botón de borrado, el `triggerButton` de la app (una flecha) y `suffix`.

- Escribir abre la lista y filtra los elementos por título, sin distinguir mayúsculas de minúsculas; `empty` se muestra mientras nada coincide. Abajo y Arriba también la abren, una pulsación en el botón disparador la abre y la cierra, y en pantallas táctiles un toque en el campo de texto la abre.
- Con un valor, el campo de texto muestra el título del elemento elegido (`placeholder` mientras no hay ninguno). Se selecciona cuando el campo recibe el foco, de modo que lo que se escribe lo sustituye.
- Con `multiple`, el campo de texto muestra la consulta; la app muestra los elementos elegidos, en `prefix` o junto al combobox.

La consulta es del propio combobox, y cada apertura empieza desde `defaultQuery` (o vacía), o es de la app con `query`: `onQueryChange({ query })` informa de lo que se escribe, y la app establece `query` para seguirlo, para filtrar a su manera o para sugerir un punto de partida.

<a id="footer"></a>

## Pie

`footer` es contenido bajo las filas, en una parte propia (`footerClass`, `footerStyle`): una acción ("Gestionar etiquetas"), un recuento, una pista. Permanece en su sitio mientras las filas se desplazan.

## Props

| Prop | Rust | Tipo | Valor por defecto | Descripción |
|---|---|---|---|---|
| `items` | `.items(..)` | `SelectItem[]` | `[]` | Los elementos, en orden. |
| `multiple` | `.multiple(..)` | `boolean` | `false` | Una elección activa o desactiva el elemento en el valor y la lista permanece abierta. |
| `value` | `.value(..)` | `string[]` | ninguno | Los valores de los elementos seleccionados, propiedad de la app. |
| `defaultValue` | `.default_value(..)` | `string[]` | `[]` | El valor inicial, sin `value`. |
| `open`, `defaultOpen` | `.open(..)`, `.default_open(..)` | `boolean` | `false` | El estado de apertura, el de la app o el propio del combobox. |
| `placeholder` | `.placeholder(..)` | `string` | ninguno | El placeholder del campo de texto, mientras está vacío. |
| `query` | `.query(..)` | `string` | ninguno | La consulta, propiedad de la app. |
| `defaultQuery` | `.default_query(..)` | `string` | ninguno | La consulta con la que empieza cada apertura, sin `query`. |
| `cleanable` | `.cleanable(..)` | `boolean` | `false` | Un botón de borrado mientras haya un elemento seleccionado; una pulsación vacía el valor. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Permanece cerrado y no admite pulsaciones ni foco de teclado. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | ninguno | Sobre qué es la elección, para los lectores de pantalla. |
| `placement`, `align`, `offset`, `margin` | `.placement(..)`, ... | como los de `Select` | `"bottom"`, `"start"`, 0, 0 | Escritorio: dónde se coloca el popup respecto al campo. |
| `popupClass`, `popupStyle` | `.popup_class(..)`, `.popup_style(..)` | `string`, `StyleProp<ViewStyle>` | ninguno | El popup (escritorio) o la hoja (pantallas táctiles). |
| `backdropClass`, `backdropStyle` | `.backdrop_class(..)`, `.backdrop_style(..)` | `string`, `StyleProp<ViewStyle>` | ninguno | El fondo (backdrop) tras la hoja. |
| `listClass`, `listStyle` | `.list_class(..)`, `.list_style(..)` | `string`, `StyleProp<ViewStyle>` | ninguno | La lista, la vista con scroll de las filas. |
| `itemClass`, `itemStyle` | `.item_class(..)`, `.item_style(..)` | `string`, `StyleProp<TextStyle>` | ninguno | La fila de cada elemento: `focus:` mientras está resaltada, `selected:` mientras está seleccionada, `disabled:` mientras no puede estarlo. |
| `groupClass`, `groupStyle` | `.group_class(..)`, `.group_style(..)` | `string`, `StyleProp<ViewStyle>` | ninguno | El encabezado de cada sección. |
| `inputClass`, `inputStyle` | `.input_class(..)`, `.input_style(..)` | `string`, `StyleProp<InputStyle>` | ninguno | El campo de texto: `focus:` mientras edita, `disabled:` con el combobox. |
| `footerClass`, `footerStyle` | `.footer_class(..)`, `.footer_style(..)` | `string`, `StyleProp<ViewStyle>` | ninguno | El pie, bajo las filas. |
| `clearButtonClass`, `clearButtonStyle` | `.clear_button_class(..)`, `.clear_button_style(..)` | `string`, `StyleProp<ViewStyle>` | ninguno | El botón de borrado (`cleanable`). |
| `clearButton` | `.clear_button(..)` | `JSX.Element` | ninguno | El contenido del botón de borrado. |
| `clearButtonAccessibilityLabel` | `.clear_button_accessibility_label(..)` | `string` | ninguno | Cómo llaman los lectores de pantalla al botón de borrado. |
| `triggerButton` | `.trigger_button(..)` | `JSX.Element` | ninguno | Un botón tras el campo de texto (una flecha): una pulsación abre y cierra la lista. |
| `prefix` | `.prefix(..)` | `JSX.Element` | ninguno | Contenido antes del campo de texto: chips, un icono. |
| `suffix` | `.suffix(..)` | `JSX.Element` | ninguno | Contenido tras el botón disparador. |
| `empty` | `.empty(..)` | `JSX.Element` | ninguno | Lo que muestra la lista mientras no hay ningún elemento que mostrar. |
| `footer` | `.footer(..)` | `JSX.Element` | ninguno | Lo que se muestra bajo las filas. |
| `renderItem` | `.render_item(..)` | `(item: SelectEntry) => JSX.Element` | ninguno | La fila de un elemento, dibujada por la app a partir de lo que es el elemento, nunca de su estado: el contenido sigue a `group-focus:`, `group-selected:` y `group-disabled:` de la fila (`group` en `itemClass`), de modo que mover el resaltado o alternar un elemento no vuelve a dibujar nada; en caso contrario, el título del elemento. |
| `renderGroup` | `.render_group(..)` | `(group: SelectGroup) => JSX.Element` | ninguno | El encabezado de una sección, dibujado por la app; en caso contrario, su título. |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | ninguno | El campo: la fila del prefijo, el campo de texto, los botones y el sufijo; la lista es tan ancha como él. |

<a id="events"></a>

## Eventos

| Evento | Rust | Descripción |
|---|---|---|
| `onChange` | `.on_change(\|value\| ..)` | El valor cambió (una elección, una alternancia, el botón de borrado): `{ value }`, los valores de los elementos seleccionados. Establece `value` para seguirlo. |
| `onConfirm` | `.on_confirm(\|value\| ..)` | La lista se cerró: `{ value }` tal como está entonces, una vez por apertura. |
| `onQueryChange` | `.on_query_change(\|query\| ..)` | El usuario escribió en el campo de texto: `{ query }`. Establece `query` para seguirlo. |
| `onOpenChange` | `.on_open_change(\|e\| ..)` | La lista se abrió o se cerró, con el motivo (`{ open, reason }`). Establece `open` para seguirlo. |
| `onOpen`, `onClose` | `.on_open(..)`, `.on_close(..)` | La lista se muestra, o ha desaparecido. |
| `onCancel` | `.on_cancel(..)` | El usuario cerró la lista sin una elección que la cierre (Escape o atrás, una pulsación fuera o en el backdrop). |

Llegan en este orden: `onChange` para una elección, o `onCancel` para un cierre sin ella, luego `onOpenChange`, luego `onConfirm` al cerrarse la lista, y después `onOpen` o `onClose` una vez que la lista se muestra o ha desaparecido.

<a id="parts"></a>

## Partes

| Parte | Dónde | Estilo con |
|---|---|---|
| El campo | la vista del combobox, una fila | `class`, `style` |
| El prefijo | el campo, el primero | el propio elemento de la app (`prefix`) |
| El campo de texto | el campo, tras el prefijo | `inputClass`, `inputStyle`, `placeholder` |
| El botón de borrado | el campo, tras el campo de texto (`cleanable`, mientras haya un elemento seleccionado) | `clearButtonClass`, `clearButtonStyle`; su contenido `clearButton` |
| El botón disparador | el campo, tras el botón de borrado | el propio elemento de la app (`triggerButton`) |
| El sufijo | el campo, el último | el propio elemento de la app (`suffix`) |
| El popup o la hoja | sobre todo lo demás, bajo el campo (escritorio) o en la parte inferior (pantallas táctiles) | `popupClass`, `popupStyle` |
| El backdrop | tras la hoja (pantallas táctiles) | `backdropClass`, `backdropStyle` |
| La lista | el popup | `listClass`, `listStyle` |
| El encabezado de una sección | la lista, antes de sus elementos | `groupClass`, `groupStyle`, `renderGroup` |
| La fila de un elemento | la lista | `itemClass`, `itemStyle`, `renderItem` (`group-focus:`, `group-selected:`, `group-disabled:` dentro, bajo `group` en `itemClass`) |
| El estado vacío | el popup, mientras no se muestra ningún elemento | su propio elemento (`empty`) |
| El pie | el popup, el último | `footerClass`, `footerStyle`; su contenido `footer` |

<a id="keyboard"></a>

## Teclado

Las teclas son las de un select (véase [Teclado](./select.md#keyboard)) mientras el campo de texto conserva el foco, con estas diferencias: las letras y los dígitos se escriben en el campo de texto, que filtra la lista, en lugar de la búsqueda por tecleo (typeahead); Abajo y Arriba abren la lista cerrada; Return alterna el elemento resaltado con `multiple` y mantiene la lista abierta; Cmd+Return en Mac (Ctrl+Return en otras plataformas) la cierra y confirma. Cuando la lista se cierra en escritorio, el campo de texto conserva el foco.

<a id="accessibility"></a>

## Accesibilidad

- El campo de texto es un combobox para los lectores de pantalla: su etiqueta es `accessibilityLabel`, su valor los títulos de los elementos seleccionados, unidos con comas, e indica si la lista está expandida. `disabled` lo atenúa.
- La lista es un listbox y cada fila una opción, nombrada por su título; las opciones seleccionadas figuran como seleccionadas y una deshabilitada aparece atenuada. Los encabezados de sección son encabezados.
- El botón de borrado es un botón nombrado por `clearButtonAccessibilityLabel`; no es una parada del tabulador. El botón disparador está oculto para los lectores de pantalla, ya que el campo de texto indica si la lista está abierta, y tampoco es una parada del tabulador.

Consulta [Accesibilidad](../docs/accessibility.md) para etiquetas, roles y anuncios en general.
