---
title: "Command"
description: "Command: una paleta de comandos, un campo de búsqueda sobre los comandos de la app que se filtra a medida que el usuario escribe: una paleta Cmd+K en un diálogo, un menú de comandos en línea, una búsqueda que la app responde. Virtualizada, orientada primero al teclado, con un cuadro de lista para lectores de pantalla. El aspecto de cada parte es el de la app."
group: base
demo: el-command
source_hash: b1a002e27d282723
---


# Command

Una paleta de comandos es un campo de búsqueda sobre una lista de comandos: el usuario escribe unas letras, la lista se reduce a los comandos que coinciden, las teclas de flecha mueven el resaltado y Return ejecuta el comando resaltado. `Command` se encarga del comportamiento de una: el filtrado, las secciones, el resaltado, el teclado y lo que oyen los lectores de pantalla. El filtrado se ejecuta de forma nativa y las filas están virtualizadas: solo se crean las filas visibles, así que una paleta de miles de comandos, archivos o emojis filtra en cada pulsación. El aspecto es el de la app: el comando no dibuja nada por sí mismo, la app da estilo a cada parte (`itemClass`, `groupClass`, `searchClass`, ...) y dibuja el contenido de las filas (`renderItem`: un icono, la etiqueta, las teclas del atajo).

```rust tabs
use nsh_base::{CommandEntry, CommandItem, command, theme};
use nsh_core::prelude::*;

fn palette() -> impl IntoElement {
    let items = vec![
        CommandItem::new("new", "New File").group("File").shortcut("mod+n"),
        CommandItem::new("open", "Open…").group("File").shortcut("mod+o"),
        CommandItem::new("theme", "Toggle Theme").group("View").keywords(["dark", "light"]),
        CommandItem::new("settings", "Settings").group("View").shortcut("mod+,"),
    ];
    let chosen = signal(SharedString::from("none"));
    command()
        .items(items)
        .placeholder("Type a command or search…")
        .accessibility_label("Commands")
        .auto_focus(true)
        .on_select(move |id: &SharedString| chosen.set(id.clone()))
        .empty(text("No results.").text_color(move || theme().muted_foreground))
        .h(px(360.0))
        .render_item(|entry: &CommandEntry| {
            view()
                .flex_row()
                .items_center()
                .h_8()
                .px_2()
                .child(text(entry.label.clone()).flex_1())
                .child(
                    text(entry.shortcut_label.clone().unwrap_or_default())
                        .text_color(move || theme().muted_foreground),
                )
        })
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { Command, type CommandItem } from "nsh/base";

const commands: CommandItem[] = [
  { id: "new", label: "New File", group: "File", shortcut: "mod+n" },
  { id: "open", label: "Open…", group: "File", shortcut: "mod+o" },
  { id: "theme", label: "Toggle Theme", group: "View", keywords: ["dark", "light"] },
  { id: "settings", label: "Settings", group: "View", shortcut: "mod+," },
];

function App() {
  const chosen = signal("none");
  return (
    <Command
      items={commands}
      placeholder="Type a command or search…"
      accessibilityLabel="Commands"
      searchAccessibilityLabel="Search commands"
      autoFocus
      onSelect={({ id }) => chosen.set(id)}
      class="w-96 overflow-hidden rounded-lg border border-border bg-popover"
      searchBarClass="flex-row items-center gap-2 border-b border-border px-3"
      searchClass="h-11 flex-1 text-sm text-foreground placeholder:text-muted-foreground"
      listClass="max-h-80 p-1"
      groupClass="px-2 py-1.5 text-xs font-medium text-muted-foreground"
      separatorClass="-mx-1 my-1 h-px bg-border"
      itemClass="group h-8 flex-row items-center rounded-md px-2 focus:bg-accent disabled:opacity-50"
      empty={<Text class="py-6 text-center text-sm text-muted-foreground">No results.</Text>}
      renderItem={(entry) => (
        <View class="flex-1 flex-row items-center gap-2">
          <Text class="flex-1 text-sm text-foreground group-focus:text-accent-foreground">{entry.label}</Text>
          <Text class="text-xs text-muted-foreground">{entry.shortcutLabel ?? ""}</Text>
        </View>
      )}
    />
  );
}

mount(App);
```

`Command` proviene de [`nsh/base`](../modules/nsh-base.md), el crate `nsh-base` de Rust. La consulta es de la app cuando esta define `query`, que actualiza en `onQueryChange`; sin ello, el campo de búsqueda conserva la suya, a partir de `defaultQuery`. Los elementos se identifican por su `id`, propio de la app, nunca por su etiqueta: `onSelect({ id })` indica cuál eligió el usuario. En Rust, `command()` lo crea, con un setter por prop (`.items(..)`, `.query(..)`, `.render_item(..)`), un método de escucha por evento y los métodos de estilo tipados.

<a id="items"></a>

## Elementos

`items` son los comandos, en orden, cada uno un `CommandItem`:

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `string` | Lo que lo identifica en `onSelect` y `onHighlightChange`: único entre los elementos. |
| `label` | `string` | Lo que muestra su fila a menos que `renderItem` la dibuje, lo que dicen los lectores de pantalla y lo que coincide con la consulta. |
| `keywords` | `string[]` | Más palabras con las que coincide la consulta: sinónimos, un nombre en inglés junto a una etiqueta traducida. |
| `group` | `string` | Su sección: los elementos adyacentes de un mismo grupo se muestran bajo un encabezado con este título. |
| `shortcut` | `string` | La combinación de teclas del mismo comando, tal como la nombra [`keymap`](../modules/nsh.md#keymap) (`"mod+shift+p"`), para que la muestre su fila. La app la enlaza con `keymap.bind`. |
| `disabled` | `boolean` | No se puede elegir: las teclas lo saltan, las pulsaciones no hacen nada, se aplican los estilos de `disabled:`. |
| `checked` | `boolean` | Es el que está en vigor (un tema, un idioma): se aplican los estilos de `checked:` y los lectores de pantalla indican que está marcado. |

La consulta coincide con un elemento cuando su etiqueta o una de sus palabras clave la contiene, sin distinguir mayúsculas de minúsculas e ignorando los espacios alrededor. Los elementos conservan su orden, y una sección sin coincidencias desaparece junto con su encabezado. `renderItem` recibe un `CommandEntry` por cada fila visible: los campos del elemento y `shortcutLabel`, su `shortcut` tal como las sugerencias lo muestran aquí (`⇧⌘P` en las plataformas de Apple, `Ctrl+Shift+P` en el resto). Es lo que el elemento es, y el resaltado es el `focus:` de la fila: el dibujo se hace una vez por elemento y conserva sus vistas mientras el resaltado se mueve.

## Props

| Prop | Rust | Tipo | Valor por defecto | Descripción |
|---|---|---|---|---|
| `items` | `.items(..)` | `CommandItem[]` | `[]` | Los comandos, en orden. |
| `query` | `.query(..)` | `string` | ninguno | La consulta (controlada), que la app define en `onQueryChange`. |
| `defaultQuery` | `.default_query(..)` | `string` | ninguno | La consulta inicial, mientras `query` no esté definida. |
| `searchable` | `.searchable(..)` | `boolean` | `true` | Un campo de búsqueda sobre las filas. Sin él se muestran todos los elementos, y el comando es una sola parada del foco de teclado, con escritura predictiva (typeahead). |
| `filterable` | `.filterable(..)` | `boolean` | `true` | La consulta filtra los elementos. Si se desactiva, se muestran todos: para una búsqueda que la app resuelve por sí misma (los resultados de un servidor definidos como `items`). Una nueva consulta sigue resaltando el primer elemento. |
| `loading` | `.loading(..)` | `boolean` | `false` | Hay una búsqueda en curso: `empty` espera, y la lista está ocupada para los lectores de pantalla. Muestra tu indicador en `searchSuffix`. |
| `placeholder` | `.placeholder(..)` | `string` | ninguno | El texto de marcador de posición del campo de búsqueda. |
| `autoFocus` | `.auto_focus(..)` | `boolean` | `false` | El campo de búsqueda recibe el foco de teclado al mostrarse: una paleta que se abre para escribir en ella. |
| `separator` | `.separator(..)` | `boolean` | `true` | Una fila separadora entre dos secciones visibles, con el estilo de `separatorClass`; nunca la primera, la última ni duplicada. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | ninguno | Cómo llaman los lectores de pantalla a la lista ("Comandos"), y al campo de búsqueda mientras `searchAccessibilityLabel` no esté definida. |
| `searchAccessibilityLabel` | `.search_accessibility_label(..)` | `string` | `accessibilityLabel` | Cómo llaman los lectores de pantalla al campo de búsqueda: lo que busca ("Buscar comandos"). |
| `header`, `footer` | `.header(..)`, `.footer(..)` | `JSX.Element` | ninguno | Lo que se muestra sobre el campo de búsqueda (un título) y bajo las filas (las sugerencias de teclas, un recuento). |
| `empty` | `.empty(..)` | `JSX.Element` | ninguno | Lo que se muestra mientras no hay ningún elemento: una consulta sin coincidencias, o sin elementos. |
| `searchPrefix`, `searchSuffix` | `.search_prefix(..)`, `.search_suffix(..)` | `JSX.Element` | ninguno | Lo que se muestra antes y después del campo de búsqueda en su barra: un icono de búsqueda, un indicador de carga mientras `loading`. |
| `renderItem` | `.render_item(..)` | `(entry: CommandEntry) => JSX.Element` | ninguno | El contenido de una fila, para las filas visibles; sin él, una fila muestra la etiqueta del elemento. |
| `renderGroup` | `.render_group(..)` | `(group: CommandGroup) => JSX.Element` | ninguno | El encabezado de una sección (`{ heading }`); sin él, un encabezado muestra su título. |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | ninguno | El propio comando: su tamaño, marco y superficie. |
| `searchBarClass`, `searchBarStyle` | `.search_bar_class(..)`, `.search_bar_style(..)` | `string`, `StyleProp<ViewStyle>` | ninguno | La fila de `searchPrefix`, el campo de búsqueda y `searchSuffix`. |
| `searchClass`, `searchStyle` | `.search_class(..)`, `.search_style(..)` | `string`, `StyleProp<TextStyle>` | ninguno | El campo de búsqueda. |
| `listClass`, `listStyle` | `.list_class(..)`, `.list_style(..)` | `string`, `StyleProp<ViewStyle>` | ninguno | La vista de desplazamiento de las filas. Dale una altura (`max-h-80`, o un comando con tamaño): las filas se desplazan dentro de ella, y solo se crean las visibles. |
| `itemClass`, `itemStyle` | `.item_class(..)`, `.item_style(..)` | `string`, `StyleProp<TextStyle>` | ninguno | La fila de cada elemento y sus estados (abajo); sus estilos de texto alcanzan a la etiqueta. |
| `groupClass`, `groupStyle` | `.group_class(..)`, `.group_style(..)` | `string`, `StyleProp<TextStyle>` | ninguno | El encabezado de cada sección. |
| `separatorClass`, `separatorStyle` | `.separator_class(..)`, `.separator_style(..)` | `string`, `StyleProp<ViewStyle>` | ninguno | Cada separador: la altura y el color de una línea. |

<a id="events"></a>

## Eventos

| Evento | Rust | Carga útil | Cuándo |
|---|---|---|---|
| `onSelect` | `.on_select(..)` | `{ id: string }` | El usuario eligió un elemento: Return, o una pulsación sobre su fila. |
| `onHighlightChange` | `.on_highlight_change(..)` | `{ highlighted: string \| null }` | El resaltado se movió (las teclas, el puntero, una nueva consulta o nuevos elementos, `highlight`): para previsualizar lo que ejecutaría Return. |
| `onQueryChange` | `.on_query_change(..)` | `{ query: string }` | El usuario escribió en el campo de búsqueda, o Escape lo vació. |
| `onCancel` | `.on_cancel(..)` | ninguna | Escape con la consulta vacía: cierra lo que contiene el comando (el `open` de un diálogo). |

<a id="parts"></a>

## Partes

| Parte | Dentro de | Se estiliza con | Estados |
|---|---|---|---|
| El comando | | `class`, `style` | |
| `header` | el comando | el elemento de la app | |
| La barra de búsqueda | el comando | `searchBarClass`, `searchBarStyle` | |
| `searchPrefix`, el campo de búsqueda, `searchSuffix` | la barra de búsqueda | los elementos de la app; `searchClass`, `searchStyle` | el `focus:` del campo |
| La lista | el comando | `listClass`, `listStyle` | |
| El encabezado de una sección | la lista | `groupClass`, `groupStyle`, `renderGroup` | |
| Un separador | la lista | `separatorClass`, `separatorStyle` | |
| Una fila | la lista | `itemClass`, `itemStyle` | `focus:` (resaltada), `checked:`, `disabled:`, `hover:`, `active:` |
| El contenido de una fila | una fila | `renderItem` | `group-focus:`, `group-checked:`, `group-disabled:` bajo `group` en `itemClass` |
| `empty` | el comando | el elemento de la app | |
| `footer` | el comando | el elemento de la app | |

Muestra la fila resaltada con `focus:` (consulta las [guías de diseño](../docs/design-guides.md#interaction-states)).

## Ref

| Método | Descripción |
|---|---|
| `focus()` | Da el foco de teclado al campo de búsqueda (sin él, al comando). |
| `highlight(id)` | Resalta el elemento de `id` y desplaza su fila hasta dejarla visible; un elemento no visible o deshabilitado queda como está. |
| `matchedCount()` | `Promise<number>`: cuántos elementos muestra la consulta, incluidos los deshabilitados. |

```tsx
let palette: CommandRef | undefined;

<Command ref={(r) => (palette = r)} items={items} />;
palette?.focus();
```

<a id="a-palette-in-a-dialog"></a>

## Una paleta en un diálogo

Coloca el comando en un [`Dialog`](./dialog.md) y ábrelo con el atajo de la app. Escape vacía primero la consulta; con la consulta vacía es `onCancel`, donde la app cierra el diálogo.

```tsx
import { keymap } from "nsh";

const open = signal(false);
keymap.bind("mod+k", () => open.set(!open()));

<Dialog open={open()} onOpenChange={({ open: next }) => open.set(next)}>
  <Command
    items={commands}
    autoFocus
    onCancel={() => open.set(false)}
    onSelect={({ id }) => {
      open.set(false);
      run(id);
    }}
  />
</Dialog>;
```

<a id="a-search-the-app-answers"></a>

## Una búsqueda que resuelve la app

Con `filterable={false}` se muestran todos los elementos que da la app: la app busca en `onQueryChange` (un servidor, una base de datos) y define `items` con los resultados, `loading` mientras espera.

```tsx
<Command
  items={results()}
  filterable={false}
  loading={searching()}
  onQueryChange={({ query }) => search(query)}
  searchSuffix={searching() ? <Spinner /> : undefined}
  empty={<Text>No matches</Text>}
/>
```

<a id="accessibility"></a>

## Accesibilidad

- La lista tiene el rol `"listbox"`, nombrada por `accessibilityLabel`; cada fila es un `"option"` nombrado por la etiqueta de su elemento, marcado y deshabilitado según lo esté su elemento; el encabezado de una sección es un `"header"`, y un separador está oculto.
- El campo de búsqueda es un campo de texto nombrado por `searchAccessibilityLabel` (si no, por `accessibilityLabel`); su marcador de posición es una pista que se muestra mientras está vacío.
- El campo de búsqueda conserva el foco de teclado mientras las teclas de flecha mueven el resaltado, y los lectores de pantalla leen la etiqueta resaltada. Sin campo de búsqueda, la fila resaltada recibe el foco del lector de pantalla.
- Mientras `loading`, la lista está ocupada.

Consulta [Accesibilidad](../docs/accessibility.md) para etiquetas, roles y anuncios en general.

<a id="keyboard"></a>

## Teclado

| Tecla | Qué hace |
|---|---|
| Escribir | Filtra los elementos; se resalta la primera coincidencia habilitada. |
| Flecha abajo, Flecha arriba | Resalta el elemento siguiente o el anterior, saltando los deshabilitados, del último al primero y viceversa. |
| Page Down, Page Up | Mueve el resaltado según las filas visibles. |
| Return | Elige el elemento resaltado (`onSelect`). |
| Escape | Vacía la consulta; con la consulta vacía, notifica `onCancel`. |
| Home, End | Sin campo de búsqueda: el primer o el último elemento (en el campo mueven su cursor). |
| Espacio, letras, dígitos | Sin campo de búsqueda: Espacio elige, y las letras y los dígitos resaltan por escritura predictiva (typeahead). |

<a id="platform-notes"></a>

## Notas por plataforma

- Escritorio (macOS, Windows, Linux, GPUI) y web: el puntero resalta la fila sobre la que se mueve, y un clic elige al presionar el botón, de modo que el campo de búsqueda conserva el foco de teclado.
- iOS, Android y Mac Catalyst: un toque elige una fila, y la tecla de retorno del teclado elige el elemento resaltado y mantiene el campo para la siguiente consulta.
- Todas las plataformas dibujan lo que la app estiliza: el comando, su barra de búsqueda, sus filas y su contenido.
