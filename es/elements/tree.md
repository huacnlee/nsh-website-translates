---
title: "Tree"
description: "Tree: elementos que contienen otros elementos, expandidos y contraídos, con uno de ellos seleccionado: los archivos de un proyecto, una barra lateral de ajustes, un esquema. Virtualizado, una sola parada del foco del teclado, un árbol para lectores de pantalla. El aspecto de cada fila lo define la app."
group: base
demo: el-tree
source_hash: db7f601c01cf83b3
---


# Tree

Un árbol muestra elementos que contienen elementos: los archivos y carpetas de un proyecto, las secciones de la barra lateral de ajustes, el esquema de un documento. `Tree` se encarga del comportamiento de uno: qué elementos están expandidos, cuál está seleccionado, el teclado y lo que oyen los lectores de pantalla. Sus filas están virtualizadas: solo se crean las filas visibles, y los hijos de un elemento contraído no se crean en absoluto, de modo que un árbol con miles de elementos se abre y se desplaza al instante. El aspecto es el de la app: el árbol no dibuja nada por sí mismo, la app da estilo a cada fila (`itemClass`) y dibuja su contenido (`renderItem`: un icono, la etiqueta con sangría según la profundidad del elemento, un chevron, una insignia).

```rust tabs
use nsh_base::{TreeEntry, TreeItem, theme, tree};
use nsh_core::prelude::*;

fn files() -> impl IntoElement {
    let items = vec![
        TreeItem::new("src", "src")
            .child(TreeItem::new("src/main.rs", "main.rs"))
            .child(TreeItem::new("src/ui", "ui").child(TreeItem::new("src/ui/tree.rs", "tree.rs"))),
        TreeItem::new("Cargo.toml", "Cargo.toml"),
    ];
    let selected = signal(None::<SharedString>);
    tree()
        .items(items)
        .default_expanded(vec!["src".into()])
        .selected(move || selected.get())
        .on_selected_change(move |id: &SharedString| selected.set(Some(id.clone())))
        .accessibility_label("Files")
        .h(px(320.0))
        .list_class("p-1")
        .item_class(
            "group rounded-md hover:bg-accent selected:bg-primary/10 \
             focus:outline-2 focus:-outline-offset-2 focus:outline-ring disabled:opacity-50",
        )
        .render_item(|entry: &TreeEntry| {
            view()
                .flex_row()
                .gap_2()
                .h_8()
                .items_center()
                .rounded_md()
                .pl(px(8.0 + 16.0 * entry.depth as f32))
                .child(text(if entry.folder { "▸" } else { " " }).text_color(move || theme().muted_foreground))
                .child(text(entry.label.clone()))
        })
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { Tree, type TreeItem } from "nsh/base";

const files: TreeItem[] = [
  {
    id: "src",
    label: "src",
    children: [
      { id: "src/main.rs", label: "main.rs" },
      { id: "src/ui", label: "ui", children: [{ id: "src/ui/tree.rs", label: "tree.rs" }] },
    ],
  },
  { id: "Cargo.toml", label: "Cargo.toml" },
];

function App() {
  const expanded = signal(["src"]);
  const selected = signal<string | null>(null);
  return (
    <Tree
      items={files}
      expanded={expanded()}
      selected={selected()}
      onExpandedChange={({ expanded: next }) => expanded.set(next)}
      onSelectedChange={({ selected: next }) => selected.set(next)}
      accessibilityLabel="Files"
      class="h-80 w-64 rounded-lg border border-border"
      listClass="p-1"
      itemClass="group h-8 rounded-md hover:bg-accent selected:bg-primary/10 focus:outline-2 focus:-outline-offset-2 focus:outline-ring disabled:opacity-50"
      renderItem={(entry) => (
        <View class="h-8 flex-row items-center gap-2" style={{ paddingLeft: 8 + entry.depth * 16 }}>
          <Text class="w-3 text-muted-foreground transition-transform group-aria-expanded:rotate-90">
            {entry.folder ? "›" : ""}
          </Text>
          <Text class="text-sm text-foreground">{entry.label}</Text>
        </View>
      )}
    />
  );
}

mount(App);
```

`Tree` proviene de [`nsh/base`](../modules/nsh-base.md), el crate `nsh-base` de Rust. Los elementos expandidos y el seleccionado pertenecen a la app cuando esta define `expanded` y `selected`, que actualiza en `onExpandedChange` y `onSelectedChange`; sin ellos, el árbol mantiene su propio estado, a partir de `defaultExpanded` y `defaultSelected`. Los elementos se identifican por su `id`, propio de la app (una ruta, la clave de un registro), nunca por su etiqueta. En Rust, `tree()` lo crea, con un setter por cada prop (`.items(..)`, `.expanded(..)`, `.render_item(..)`), un método de listener por cada evento y los métodos de estilo tipados.

<a id="items"></a>

## Elementos

`items` son los elementos del nivel superior, cada uno un `TreeItem`:

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `string` | Lo que lo identifica en `expanded`, `selected` y los eventos: único en el árbol (un id repetido se registra en el log, y solo su primer elemento se expande o se selecciona). |
| `label` | `string` | Lo que muestra su fila a menos que `renderItem` la dibuje, lo que dicen los lectores de pantalla y lo que coincide con la búsqueda por escritura. |
| `children` | `TreeItem[]` | Los elementos que tiene debajo, en orden. Si tiene alguno, es una carpeta: se expande y se contrae. |
| `disabled` | `boolean` | El usuario no puede seleccionarlo, expandirlo ni contraerlo: las pulsaciones y las teclas lo saltan, se aplican los estilos de `disabled:`. Sus hijos quedan como indique `expanded`. |

`renderItem` recibe un `TreeEntry` por cada fila visible: los `id`, `label` y `disabled` del elemento, su `depth` (0 en el nivel superior, 1 bajo un elemento superior, …) y si es un `folder`. Es lo que el elemento es, y los estados de la fila son sus clases: el dibujo se hace una sola vez por elemento y conserva sus vistas mientras la fila está seleccionada, expandida o contraída, de modo que un chevron gira con una transición.

## Props

| Prop | Rust | Tipo | Valor por defecto | Descripción |
|---|---|---|---|---|
| `items` | `.items(..)` | `TreeItem[]` | `[]` | Los elementos del nivel superior, cada uno con los elementos que tiene debajo. |
| `expanded` | `.expanded(..)` | `string[]` | ninguno | Los ids de los elementos expandidos (controlado). Un elemento se muestra mientras todos los elementos por encima de él estén expandidos. |
| `defaultExpanded` | `.default_expanded(..)` | `string[]` | `[]` | Los elementos expandidos al principio, mientras `expanded` no esté definido. |
| `selected` | `.selected(..)` | `string \| null` | ninguno | El id del elemento seleccionado (controlado), `null` si no hay ninguno. |
| `defaultSelected` | `.default_selected(..)` | `string` | ninguno | El elemento seleccionado al principio, mientras `selected` no esté definido. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Un árbol de solo lectura: sin pulsaciones ni teclas, sin parada del foco del teclado, `disabled:` en cada fila; muestra lo que dicen `expanded` y `selected`. |
| `reveal` | `.reveal(..)` | `boolean` | `false` | Al expandir y contraer, las filas posteriores al elemento se mueven a su nueva posición con un resorte, ejecutado de forma nativa. Desactivado con movimiento reducido. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | ninguno | Cómo llaman los lectores de pantalla al árbol ("Archivos"). |
| `renderItem` | `.render_item(..)` | `(entry: TreeEntry) => JSX.Element` | ninguno | El contenido de una fila, para las filas visibles; sin él, una fila muestra la etiqueta del elemento. |
| `itemClass`, `itemStyle` | `.item_class(..)`, `.item_style(..)` | `string`, `StyleProp<TextStyle>` | ninguno | Cada fila: su altura, relleno, superficie y estados (más abajo); sus estilos de texto llegan a la etiqueta. |
| `listClass`, `listStyle` | `.list_class(..)`, `.list_style(..)` | `string`, `StyleProp<ViewStyle>` | ninguno | La vista de desplazamiento de las filas dentro del árbol: su relleno y sus espacios. |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | ninguno | El propio árbol. Dale una altura (o `flex-1` en un padre que la tenga): las filas se desplazan dentro de él, y solo se crean las visibles. |

<a id="events"></a>

## Eventos

| Evento | Rust | Carga | Cuándo |
|---|---|---|---|
| `onExpandedChange` | `.on_expanded_change(..)` | `{ expanded: string[] }` | El usuario expandió o contrajo un elemento (una pulsación, Intro, Espacio, Derecha o Izquierda, `revealItem`): los ids expandidos tal como quedarían. |
| `onSelectedChange` | `.on_selected_change(..)` | `{ selected: string }` | El usuario seleccionó otro elemento (una pulsación, las teclas de flecha, Inicio, Fin, búsqueda por escritura). |
| `onExpand` | `.on_expand(..)` | `{ id: string }` | El usuario expandió el elemento de `id`, después de `onExpandedChange`. |
| `onCollapse` | `.on_collapse(..)` | `{ id: string }` | El usuario contrajo el elemento de `id`, después de `onExpandedChange`. |
| `onAction` | `.on_action(..)` | `{ id: string }` | El usuario actuó sobre el elemento de `id`: Intro sobre el elemento seleccionado cuando no tiene hijos, o un doble clic o doble toque sobre cualquier elemento, después de los eventos propios de la pulsación. Los elementos deshabilitados y un árbol deshabilitado nunca lo notifican. |

La selección sigue a las teclas de flecha, así que un explorador de archivos abre un archivo en `onAction`, no en `onSelectedChange`: al recorrer los archivos se previsualizan uno a uno, e Intro o un doble clic abre el que el usuario quiere.

```tsx
<Tree
  items={files}
  onSelectedChange={({ selected }) => preview.set(selected)}
  onAction={({ id }) => openFile(id)}
/>
```

<a id="parts"></a>

## Partes

| Parte | Dentro de | Estilizada con | Estados |
|---|---|---|---|
| El árbol | | `class`, `style` | |
| La lista | el árbol | `listClass`, `listStyle` | |
| Una fila | la lista | `itemClass`, `itemStyle` | `selected:`, `aria-expanded:` (una carpeta abierta), `focus:` (mientras el árbol tiene el foco del teclado, la fila sobre la que actúan las teclas: la fila seleccionada, el elemento contraído bajo el cual está una selección oculta, o la primera fila mientras no haya nada seleccionado), `disabled:`, `hover:`, `active:` |
| El contenido de una fila | una fila | `renderItem` | `group-selected:`, `group-aria-expanded:`, `group-focus:`, `group-disabled:` bajo `group` en `itemClass` |

Muestra la fila seleccionada con `selected:` y la posición del teclado con `focus:` (consulta las [Guías de diseño](../docs/design-guides.md#interaction-states)). Dibuja el foco dentro de la fila (`focus:outline-2 focus:-outline-offset-2`): la lista recorta lo que sobresale por sus lados.

## Ref

| Método | Descripción |
|---|---|
| `focus()` | Toma el foco del teclado, igual que cuando Tab llega al árbol. |
| `revealItem(id)` | Expande los elementos por encima del elemento de `id` (notificados con `onExpandedChange` y `onExpand`, el más externo primero) y desplaza su fila hasta dejarla visible una vez que se muestra: si la app sigue el cambio, de inmediato; si no lo sigue, la solicitud termina ahí. |

```tsx
let files: TreeRef | undefined;

<Tree ref={(r) => (files = r)} items={items} />;
files?.revealItem("src/ui/tree.rs");
```

<a id="disabled"></a>

## Deshabilitado

Un elemento deshabilitado no recibe pulsaciones, las teclas de flecha lo saltan y los lectores de pantalla lo anuncian como atenuado. `disabled` en el árbol lo convierte en solo lectura: muestra lo que dice el estado de la app y no admite entrada.

```tsx
<Tree items={items} disabled={locked()} itemClass="h-8 px-2 disabled:opacity-50" />
```

<a id="accessibility"></a>

## Accesibilidad

- El árbol tiene el rol `"tree"`, con el nombre de `accessibilityLabel`; cada fila es un `"treeitem"` con el nombre de la etiqueta de su elemento, con su nivel (su profundidad + 1), si está expandida (carpetas), seleccionada y deshabilitada.
- Cuando el árbol toma el foco del teclado y cuando las teclas mueven la selección, la fila sobre la que actúan las teclas toma el foco del lector de pantalla.

Consulta [Accesibilidad](../docs/accessibility.md) para etiquetas, roles y anuncios en general.

<a id="keyboard"></a>

## Teclado

En escritorio y en la web, donde Tab llega a las vistas que reciben pulsaciones, un `Tree` sigue el [patrón de vista de árbol de WAI-ARIA](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/):

| Tecla | Qué hace |
|---|---|
| Tab, Shift+Tab | Entra en el árbol en un solo paso y sale de él en un solo paso; al volver, las teclas continúan desde la fila seleccionada. Sin nada seleccionado, el foco se muestra en la primera fila, que Abajo selecciona. |
| Abajo, Arriba | Selecciona la fila siguiente o la anterior, saltando los elementos deshabilitados, de la última a la primera y viceversa. |
| Derecha | Expande una carpeta contraída; en una expandida, selecciona su primer hijo habilitado. |
| Izquierda | Contrae una carpeta expandida; en cualquier otro caso, selecciona su padre. |
| Inicio, Fin | Selecciona la primera o la última fila. |
| Intro | Expande o contrae la carpeta seleccionada; en un elemento sin hijos, actúa sobre él (`onAction`). |
| Espacio | Expande o contrae la carpeta seleccionada. |
| Letras, dígitos | Selecciona la siguiente fila cuya etiqueta empieza por lo que se escribió. |

Mientras la selección está oculta bajo un elemento contraído (la app lo contrajo), las teclas actúan sobre la fila de ese elemento: Derecha o Intro lo expande, Abajo selecciona la fila posterior.

En un diseño de derecha a izquierda las filas parten desde la derecha, así que Izquierda y Derecha intercambian sus funciones, como indica el patrón: Izquierda expande una carpeta y entra en ella, Derecha la contrae y selecciona el padre. Arriba, Abajo, Inicio y Fin mantienen las suyas.

<a id="platform-notes"></a>

## Notas por plataforma

- iOS, Android y Mac Catalyst: un toque selecciona una fila y expande o contrae una carpeta; un doble toque actúa sobre el elemento (`onAction`).
- Escritorio (macOS, Windows, Linux, GPUI) y la web: un clic hace lo mismo y da al árbol el foco del teclado, y las teclas anteriores se mueven en él; un doble clic actúa sobre el elemento.
- Cada plataforma dibuja lo que la app estiliza: el árbol, sus filas y su contenido.
