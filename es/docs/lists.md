---
title: "Listas"
description: "Listas largas e infinitas en Rust y TSX: reciclaje, identidad de filas, columnas, encabezados fijos, listas de chat invertidas, listas horizontales, listas dentro de una página, carga de más elementos, visibilidad y desplazamiento hasta un elemento."
order: 40
group: ui
demo: guide-lists
source_hash: fb4ffb925cc99200
---


# Listas

Una lista (`virtual_list(..)` en Rust, `List` de `nsh` en TSX) renderiza datos largos en una scroll view nativa y solo crea las filas cercanas a la pantalla. Qué filas existen, dónde van, las columnas, los encabezados fijos y qué elementos son visibles se calcula todo de forma nativa; tu código solo rellena las celdas con contenido cuando el lado nativo pide una. Una lista de un millón de elementos cuesta aproximadamente lo mismo que una de treinta.

```rust tabs
use std::rc::Rc;

use nsh_core::prelude::*;

#[component]
pub fn App() -> impl IntoElement {
    let titles: Rc<Vec<String>> = Rc::new((1..=10_000).map(|i| format!("Item {i}")).collect());
    virtual_list(titles.len(), move |at| {
        let titles = titles.clone();
        view()
            .p_4()
            .border_b_1()
            .border_b_color(rgb(0xeaeef2))
            .child(text(move || titles[at.index()].clone()).text_size(px(16.0)))
    })
    .estimated_item_size(px(52.0))
    .flex_1()
    .bg(white())
}
```

```tsx tabs
import { List, mount, Text, View } from "nsh";

const items = Array.from({ length: 10_000 }, (_, i) => ({ id: i, title: `Item ${i + 1}` }));

function App() {
  return (
    <List each={items} estimatedItemSize={52} style={{ flex: 1, backgroundColor: "#ffffff" }}>
      {(item) => (
        <View style={{ paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: "#eaeef2" }}>
          <Text style={{ fontSize: 16 }}>{item().title}</Text>
        </View>
      )}
    </List>
  );
}

mount(App);
```

En Rust, `virtual_list(count, row)` recibe el número de filas (un valor, un signal o una closure) y una función que construye una fila a partir de su posición (`at.index()`); las filas leen tus datos por ese índice. En TSX, `each` recibe los elementos y la función de fila recibe el elemento. Como una [scroll view](./scrolling.md), la lista es el viewport y necesita un tamaño de su padre (`.flex_1()`, `flex: 1` o una altura).

<a id="how-recycling-works"></a>

## Cómo funciona el reciclaje

La función de fila no se llama una vez por elemento. Se llama **una vez por celda**, y las celdas se reutilizan: cuando una fila se desplaza muy lejos de la pantalla, su celda se asigna a otra fila y su posición (`at.index()` en Rust, `item()` y `index()` en TSX) cambia. Todo lo que en la fila lee esa posición se actualiza en el lugar, como cualquier otro [signal](./reactivity.md).

De esto se derivan dos reglas:

**Lee la posición donde la uses.** Un valor copiado al principio de la función de fila pertenece a la fila que la celda mostró primero.

```rust tabs
// Wrong: `title` stays the first row's title when the cell is reused.
virtual_list(count, move |at| {
    let title = titles[at.index()].clone();
    text(title)
})

// Right: the text follows the cell's current row.
virtual_list(count, move |at| {
    let titles = titles.clone();
    text(move || titles[at.index()].clone())
})
```

```tsx tabs
// Wrong: `title` stays the first item's title when the cell is reused.
{(item) => {
  const title = item().title;
  return <Text>{title}</Text>;
}}

// Right: the text follows the cell's current item.
{(item) => <Text>{item().title}</Text>}
```

**Guarda el estado de cada elemento en tus datos, no en la fila.** Un signal creado dentro de la fila pertenece a la celda y viaja con ella al siguiente elemento. Guarda "esta fila está expandida / seleccionada / marcada con me gusta" en los elementos o en un conjunto indexado por id:

```rust tabs
let liked = signal(HashSet::<u32>::new());
let toggle = move |id: u32| {
    liked.update(|s| {
        if !s.remove(&id) {
            s.insert(id);
        }
    })
};

virtual_list(move || posts.with(Vec::len), move |at| {
    let post = computed(move || posts.with(|p| p[at.index()].clone()));
    view()
        .flex_row()
        .p_4()
        .child(text(move || post.with(|p| p.title.clone())).flex_1())
        .child(
            text(move || if liked.with(|s| s.contains(&post.with(|p| p.id))) { "♥" } else { "♡" })
                .on_press(move || toggle(post.with(|p| p.id))),
        )
})
.estimated_item_size(px(64.0))
.flex_1()
```

```tsx tabs
const liked = signal<Set<number>>(new Set());
const toggle = (id: number) =>
  liked.update((s) => {
    const next = new Set(s);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

<List each={posts()} estimatedItemSize={64} style={{ flex: 1 }}>
  {(post) => (
    <View style={{ flexDirection: "row", padding: 16 }}>
      <Text style={{ flex: 1 }}>{post().title}</Text>
      <Text onPress={() => toggle(post().id)}>{liked().has(post().id) ? "♥" : "♡"}</Text>
    </View>
  )}
</List>
```

Las filas pueden tener alturas diferentes. Hasta que una fila se ha medido, la lista asume el tamaño estimado de elemento (50 puntos por defecto); pasa un valor cercano a tu fila típica para que el indicador de desplazamiento y los saltos a elementos lejanos sean precisos desde el principio.

<a id="changing-the-data"></a>

## Cambiar los datos

En Rust, da el número de filas como un signal o una closure (`move || posts.with(Vec::len)`): la lista crece y se encoge en el lugar. Las filas añadidas o eliminadas al final no necesitan nada más; cuando las filas aparecen y desaparecen en otras posiciones, indica sus identidades con `.keys(move || posts.with(|p| p.iter().map(|p| p.id).collect::<Vec<_>>()))`, y la lista conserva el inicio y el final comunes y trata lo que hay entre ellos como eliminado e insertado.

En TSX, pasa un nuevo array para cambiar los elementos: `posts.set([...posts(), ...more])`. La lista compara el array antiguo y el nuevo **por identidad de elemento** (`===`), conserva el inicio y el final comunes y trata lo que hay entre ellos como eliminado e insertado.

En ambos casos, las mediciones permanecen con sus filas, y cuando se insertan filas por encima de las que están en pantalla, las filas visibles se quedan donde están en lugar de saltar.

- En TSX, actualiza de forma inmutable: un nuevo array, reutilizando los objetos de elemento que no han cambiado. Mutar el array en el lugar (`push`) no se detecta.
- Un elemento modificado debe ser un objeto nuevo (`{ ...post, title }`), para que su fila muestre el cambio.
- Anteponer elementos (mensajes nuevos, un feed actualizado) conserva la posición del usuario.

`keyExtractor` nombra los elementos en los tokens de visibilidad (más abajo); por defecto la clave es `item.key`, luego `item.id` y después el índice. No afecta a cómo se emparejan los cambios en TSX, que es siempre por identidad.

## Props

Una lista admite todas las props de desplazamiento de la scroll view que tienen sentido para una lista (`pagingEnabled`, `snapToInterval`, `snapToOffsets`, `snapToAlignment`, `decelerationRate`, `disableIntervalMomentum`, `bounces`, `scrollable`, `contentInset`, `contentOffset`, `keyboardShouldPersistTaps`, `keyboardDismissMode`, `scrollEventThrottle`, `onScroll`, `onScrollDragStart`, `onScrollDragEnd`, `onMomentumStart`, `onMomentumEnd`, `onScrollEnd`, `scrollValue`, `pullValue`; en Rust, los mismos métodos que los de una scroll view), descritas en [Desplazamiento](./scrolling.md). Las listas mantienen una escala de 1. Sus props propias:

| Prop | Rust | Tipo | Por defecto | Descripción |
|---|---|---|---|---|
| `each` | `virtual_list(count, ..)` | `readonly T[]` | | Los elementos; en Rust, el número de filas. |
| `children` | `virtual_list(.., row)` | `(item: () => T, index: () => number) => JSX.Element` | | Renderiza una celda; se llama una vez por celda, véase [reciclaje](#how-recycling-works). |
| `estimatedItemSize` | `.estimated_item_size(px(..))` | `number` | `50` | El tamaño de las filas aún no medidas, en puntos. |
| `horizontal` | `.horizontal()` | `boolean` | `false` | Desplaza en horizontal. |
| `viewport` | `.viewport(ListViewport::..)` | `"own" \| "parent"` | `"own"` | `"own"`: la lista se desplaza en una scroll view propia. `"parent"`: se extiende a toda su longitud dentro de la scroll view que la rodea, que la desplaza junto con el resto de la página (véase [listas en una página](#lists-in-a-page-viewportparent)). Se elige al crear la lista. |
| `numColumns` | `.columns(n)` | `number` | `1` | Elementos por fila (listas verticales). |
| `inverted` | `.inverted()` | `boolean` | `false` | El elemento 0 abajo (chat); empieza en el final y mantiene su distancia al final. |
| `maintainVisibleContentPosition` | `.follow_end(px(..))` | `{ autoscrollToBottomThreshold?: number }` | | Una lista no invertida se queda en el final mientras esté a esa cantidad de puntos o menos de él, a medida que el contenido crece (véase más abajo). |
| `stickyHeaderIndices` | `.sticky_header_indices(..)` | `number[]` | | Elementos que se fijan arriba al desplazarse más allá de ellos (una columna, no invertida). |
| `stickyHeaderOffset` | `.sticky_header_offset(px(..))`, `.bind_sticky_header_offset(&node)` | `number \| AnimatedNode` | `0` | A qué distancia por debajo del borde superior se fijan los elementos sticky, como el `top` de `position: sticky` en CSS; el contenido sigue desplazándose bajo el espacio que queda encima de ellos. Un valor animado los mueve en cada fotograma. |
| `contentStyle` | `.content_padding(..)`, `.content_padding_x(..)`, ..., `.row_gap(..)`, `.column_gap(..)` | `{ padding*, gap, rowGap, columnGap }` | | Padding y gaps del contenido, solo números. |
| `contentClass` | | `string` | | Lo mismo que las clases (`p-*`, `gap-*`); `contentStyle` prevalece sobre ellas. |
| `header` | `.header(..)` | componente o elemento | | Antes de los elementos. |
| `footer` | `.footer(..)` | componente o elemento | | Después de los elementos. |
| `empty` | `.empty(..)` | componente o elemento | | Se muestra en lugar de los elementos mientras no hay ninguno. |
| `separator` | `.separator(\|\| ..)` | componente o elemento | | Entre elementos (una columna). |
| `initialScrollIndex` | `.initial_scroll_index(i)` | `number` | | Se desplaza a este elemento antes del primer fotograma. |
| `onLoadMore` | `.on_load_more(..)` | `() => void` | | El final está cerca (véase más abajo). |
| `loadMoreThreshold` | `.load_more_threshold(..)` | `number` | `1` | A qué distancia del final, en viewports, se dispara `onLoadMore`. |
| `onLoadMoreAtStart` | `.on_load_more_at_start(..)` | `() => void` | | El inicio está cerca, después de un desplazamiento (véase más abajo). |
| `loadMoreAtStartThreshold` | `.load_more_at_start_threshold(..)` | `number` | `1` | A qué distancia del inicio, en viewports, se dispara `onLoadMoreAtStart`. |
| `onViewableItemsChange` | `.on_viewable_items_change(..)` | `(info) => void` | | Elementos que pasaron a ser visibles o dejaron de serlo. |
| `viewabilityConfig` | `.viewability(..)`, `.minimum_view_time(..)` | `ViewabilityConfig` | | Cuándo se considera que los elementos son visibles. |
| `keyExtractor` | `.keys(..)` | `(item, index) => string` | | La clave en los tokens de visibilidad; en Rust, las identidades de las filas. |
| `refreshing` / `onRefresh` | `.refreshing(..)` / `.on_refresh(..)` | `boolean` / `() => void` | | Pull to refresh. |
| `refreshIndicator` | `.refresh_indicator(..)` | `{ height: number }` | | El indicador de pull-to-refresh propio de la app, en lugar del spinner de la plataforma (véase [Desplazamiento](./scrolling.md#an-indicator-of-your-own)). |
| `scrollbar` | `.scrollbar(..)` | `boolean \| ScrollbarTheme` | `true` | El indicador de desplazamiento se muestra: el de la plataforma, o la [barra integrada](../elements/scrollbar.md#built-in-bars) de la app una vez que esta define un tema; un objeto es un tema propio de la vista. En el escritorio y en los navegadores de escritorio, una vista horizontal lo mantiene: es la barra de desplazamiento del ratón. |
| `ref` | `.element_ref(&list)` | `ListRef` | | `scrollToIndex`, `scrollToOffset`, `scrollToEnd`, `scrollTo`. |

Los slots de encabezado, pie y vacío reciben un elemento (en TSX también un componente: `header={Header}`). Son celdas propias, nunca se reciclan, y son reactivos como cualquier otro elemento.

<a id="columns-and-grids"></a>

## Columnas y cuadrículas

`numColumns` (`.columns(n)`) distribuye los elementos en filas con ese número de columnas; el padding del contenido rodea al contenido, con gaps entre filas y columnas. Las filas de una cuadrícula pueden tener alturas diferentes: cada fila es tan alta como su elemento más alto.

```rust tabs
let count = photos.len();
virtual_list(count, move |at| {
    let photos = photos.clone();
    image(move || photos[at.index()].thumb.clone()).aspect_square().rounded(px(8.0))
})
.columns(3)
.estimated_item_size(px(120.0))
.content_padding(px(12.0))
.row_gap(px(8.0))
.column_gap(px(8.0))
.flex_1()
```

```tsx tabs
<List
  each={photos}
  numColumns={3}
  estimatedItemSize={120}
  style={{ flex: 1 }}
  contentStyle={{ padding: 12, gap: 8 }}
>
  {(photo) => <Image src={photo().thumb} style={{ aspectRatio: 1, borderRadius: 8 }} />}
</List>
```

<a id="sticky-headers"></a>

## Encabezados fijos

`stickyHeaderIndices` enumera los elementos que se fijan en la parte superior del viewport mientras el contenido se desplaza bajo ellos, hasta que el siguiente elemento sticky los empuja fuera. Las secciones son una sola lista de elementos de encabezado y de fila; se fijan los índices de los encabezados. El anclaje se realiza de forma nativa en cada fotograma de desplazamiento.

```rust tabs
#[derive(Clone, PartialEq)]
enum Row {
    Header(String),
    Name(String),
}

let mut rows = Vec::new();
let mut headers = Vec::new();
for (letter, names) in groups {
    headers.push(rows.len());
    rows.push(Row::Header(letter));
    rows.extend(names.into_iter().map(Row::Name));
}
let count = rows.len();
let rows = Rc::new(rows);

virtual_list(count, move |at| {
    let rows = rows.clone();
    let row = computed(move || rows[at.index()].clone());
    let is_header = computed(move || matches!(row.get(), Row::Header(_)));
    let label = move || match row.get() {
        Row::Header(s) | Row::Name(s) => s,
    };
    when(is_header, move || {
        text(label).p(px(6.0)).bg(rgb(0xeaeef2)).font_weight(FontWeight::BOLD)
    })
    .otherwise(move || text(label).p_3())
})
.sticky_header_indices(headers)
.estimated_item_size(px(44.0))
.flex_1()
```

```tsx tabs
type Row = { header: string } | { name: string };

const rows: Row[] = [];
const headers: number[] = [];
for (const [letter, names] of groups) {
  headers.push(rows.length);
  rows.push({ header: letter });
  for (const name of names) rows.push({ name });
}

<List each={rows} stickyHeaderIndices={headers} estimatedItemSize={44} style={{ flex: 1 }}>
  {(row) => (
    <If
      when={"header" in row()}
      else={<Text style={{ padding: 12 }}>{(row() as { name: string }).name}</Text>}
    >
      <Text style={{ padding: 6, backgroundColor: "#eaeef2", fontWeight: "700" }}>{(row() as { header: string }).header}</Text>
    </If>
  )}
</List>
```

Como una celda puede mostrar un encabezado ahora y un nombre después, la fila decide qué renderizar con [`when` / `<If>`](../elements/control-flow.md), que cambia cuando la fila cambia. Los encabezados fijos necesitan una columna y una lista no invertida.

`stickyHeaderOffset` (`.sticky_header_offset(..)` en Rust) hace que los encabezados se fijen a esa cantidad de puntos por debajo del borde superior, como hace el `top` de `position: sticky` en CSS: bajo una barra translúcida de 56 puntos de alto, `stickyHeaderOffset={56}` (`.sticky_header_offset(px(56.0))`) mantiene cada encabezado debajo de la barra mientras las filas siguen desplazándose bajo ella, y el siguiente encabezado lo empuja fuera desde ahí. Un offset negativo deja parte de un encabezado fuera de la vista.

El offset puede ser un [valor animado](./animation.md#animated-values) (`.bind_sticky_header_offset(&node)` en Rust): los encabezados lo siguen en cada fotograma en el hilo de UI, de modo que permanecen debajo de una barra que se mueve. Con una barra que se oculta al desplazar el contenido hacia abajo y vuelve al desplazarlo hacia arriba ([`diffClamp`](./animation.md#arithmetic-and-diffclamp)), los encabezados se fijan al borde inferior de la barra esté donde esté:

```rust tabs
let offset = animated_value(0.0);
let hidden = offset.diff_clamp(0.0, 56.0);
let shown = hidden.mul(-1.0).add(56.0);

view().flex_1().overflow_hidden().child(
    virtual_list(rows.len(), row)
        .scroll_value(&offset)
        .sticky_header_indices(headers)
        .bind_sticky_header_offset(&shown),
).child(view().absolute().top_0().left_0().right_0().h(px(56.0)).bind_translate_y(&hidden.mul(-1.0)))
```

```tsx tabs
const scroll = createAnimatedValue(0);
const hidden = scroll.diffClamp(0, 56);
const shown = hidden.mul(-1).add(56);

<View style={{ flex: 1, overflow: "hidden" }}>
  <List each={rows} scrollValue={scroll} stickyHeaderIndices={headers} stickyHeaderOffset={shown}>…</List>
  <View style={{ position: "absolute", top: 0, left: 0, right: 0, height: 56, translate: [0, hidden.mul(-1)] }}>…</View>
</View>
```

<a id="chat-inverted-lists"></a>

## Chat: listas invertidas

`inverted` distribuye la lista desde el final: el elemento 0 está abajo, la lista empieza desplazada hasta el final y mantiene su distancia al final a medida que los elementos cambian. Mantén el mensaje más reciente primero; antepón para añadir uno y añade al final para cargar los más antiguos con `onLoadMore` (el "final" de una lista invertida es la parte superior). Un chat abierto en un mensaje antiguo carga los más nuevos con [`onLoadMoreAtStart`](#loading-at-the-start-onloadmoreatstart); con ello, la lista mantiene su distancia al fondo mientras está allí y mantiene en su sitio los mensajes en pantalla cuando se desplaza hacia arriba.

```rust tabs
#[derive(Clone, PartialEq)]
struct Message {
    id: u32,
    text: String,
    mine: bool,
}

pub fn chat() -> impl IntoElement {
    let next = stored(0_u32);
    let message = move |text: String, mine: bool| Message {
        id: next.with(|n| {
            *n += 1;
            *n
        }),
        text,
        mine,
    };
    // Newest first.
    let messages = signal(
        (0..30)
            .map(|i| message(format!("Message {}", 30 - i), i % 3 == 0))
            .collect::<Vec<_>>(),
    );
    let draft = signal(String::new());
    let send = move || {
        let text = draft.get_untracked();
        if text.trim().is_empty() {
            return;
        }
        let sent = message(text, true);
        messages.update(|m| m.insert(0, sent));
        draft.set(String::new());
    };
    let load_older = move || {
        let older: Vec<_> = (0..20).map(|i| message(format!("Older {i}"), false)).collect();
        messages.update(|m| m.extend(older));
    };
    let list = virtual_list(
        move || messages.with(Vec::len),
        move |at| {
            let mine = computed(move || messages.with(|m| m[at.index()].mine));
            view()
                .style_when(mine, |s| s.self_end().bg(rgb(0x0969da)))
                .style_when(move || !mine.get(), |s| s.self_start().bg(rgb(0xeaeef2)))
                .max_w(relative(0.75))
                .px_3()
                .py_2()
                .rounded(px(14.0))
                .child(
                    text(move || messages.with(|m| m[at.index()].text.clone()))
                        .text_color(move || if mine.get() { rgb(0xffffff) } else { rgb(0x1f2328) }),
                )
        },
    )
    .keys(move || messages.with(|m| m.iter().map(|m| m.id).collect::<Vec<_>>()))
    .inverted()
    .estimated_item_size(px(44.0))
    .content_padding(px(12.0))
    .row_gap(px(6.0))
    .keyboard_dismiss_mode(KeyboardDismissMode::Interactive)
    .on_load_more(load_older)
    .load_more_threshold(0.5)
    .flex_1();
    view()
        .flex_1()
        .pb_keyboard()
        .child(list)
        .child(
            view().flex_row().gap_2().p_2().child(
                input()
                    .value(move || draft.get())
                    .on_change(move |text: &str| draft.set(text.to_owned()))
                    .on_submit(move |_: &str| send())
                    .multiline(true)
                    .submit_behavior(SubmitBehavior::Submit)
                    .return_key_type(ReturnKeyType::Send)
                    .placeholder("Message")
                    .flex_1()
                    .max_h(px(120.0))
                    .border_1()
                    .border_color(rgb(0xd0d7de))
                    .rounded(px(18.0))
                    .px_3()
                    .py_2(),
            ),
        )
}
```

```tsx tabs
import { List, mount, signal, Text, View } from "nsh";
import { Input } from "nsh/base";

type Message = { id: number; text: string; mine: boolean };

function Chat() {
  let next = 0;
  const message = (text: string, mine: boolean): Message => ({ id: next++, text, mine });
  const messages = signal(Array.from({ length: 30 }, (_, i) => message(`Message ${30 - i}`, i % 3 === 0)));
  const draft = signal("");
  const send = () => {
    if (!draft().trim()) return;
    messages.update((m) => [message(draft(), true), ...m]); // newest first
    draft.set("");
  };
  const loadOlder = () => messages.update((m) => [...m, ...Array.from({ length: 20 }, (_, i) => message(`Older ${i}`, false))]);
  return (
    <View style={{ flex: 1, paddingBottom: "env(keyboard-inset-height)" }}>
      <List
        each={messages()}
        inverted
        estimatedItemSize={44}
        style={{ flex: 1 }}
        contentStyle={{ padding: 12, gap: 6 }}
        keyboardDismissMode="interactive"
        onLoadMore={loadOlder}
        loadMoreThreshold={0.5}
      >
        {(m) => (
          <View
            style={{
              alignSelf: m().mine ? "flex-end" : "flex-start",
              maxWidth: "75%",
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 14,
              backgroundColor: m().mine ? "#0969da" : "#eaeef2",
            }}
          >
            <Text style={{ color: m().mine ? "#ffffff" : "#1f2328" }}>{m().text}</Text>
          </View>
        )}
      </List>
      <View style={{ flexDirection: "row", gap: 8, padding: 8 }}>
        <Input
          value={draft()}
          onChange={({ value }) => draft.set(value)}
          onSubmit={send}
          multiline
          submitBehavior="submit"
          returnKeyType="send"
          placeholder="Message"
          style={{ flex: 1, maxHeight: 120, borderWidth: 1, borderColor: "#d0d7de", borderRadius: 18, paddingHorizontal: 12, paddingVertical: 8 }}
        />
      </View>
    </View>
  );
}

mount(Chat);
```

`scroll_to_end(..)` / `scrollToEnd()` en una lista invertida se desplaza a su inicio: el mensaje más reciente.

<a id="following-the-end-of-a-list-that-is-not-inverted"></a>

### Seguir el final de una lista no invertida

Una lista en orden de lectura (el más antiguo primero) también puede seguir su final: con `.follow_end(px(40.0))` en Rust o `maintainVisibleContentPosition={{ autoscrollToBottomThreshold: 40 }}` en TSX, mientras el usuario está en el final (o a 40 puntos de él), la lista se queda en el final a medida que el contenido crece: una respuesta que llega en streaming al último elemento, un mensaje nuevo añadido, el teclado que reduce la lista. Si se ha desplazado más arriba, el contenido visible se queda donde está y el contenido nuevo crece por debajo. Los elementos insertados por encima de los visibles nunca los mueven, con o sin la opción.

```rust tabs
virtual_list(move || messages.with(Vec::len), move |at| bubble(messages, at))
    .keys(move || messages.with(|m| m.iter().map(|m| m.id).collect::<Vec<_>>()))
    .follow_end(px(40.0))
    .flex_1()
```

```tsx tabs
<List each={messages()} keyExtractor={(m) => m.id} maintainVisibleContentPosition={{ autoscrollToBottomThreshold: 40 }} style={{ flex: 1 }}>
  {(m) => <Bubble message={m()} />}
</List>
```

<a id="horizontal-lists"></a>

## Listas horizontales

`horizontal` gira la lista de lado; las celdas se distribuyen a la altura de la lista. Combinada con snapping, produce un carrusel de cualquier longitud:

```rust tabs
let count = cards.len();
virtual_list(count, move |at| {
    let cards = cards.clone();
    view()
        .w(px(220.0))
        .h(px(140.0))
        .rounded(px(14.0))
        .bg(move || cards[at.index()].color)
})
.horizontal()
.estimated_item_size(px(232.0))
.snap_interval(px(232.0))
.deceleration(0.99)
.scrollbar(false)
.content_padding_x(px(16.0))
.column_gap(px(12.0))
.h(px(140.0))
```

```tsx tabs
<List
  each={cards}
  horizontal
  estimatedItemSize={232}
  snapToInterval={232}
  decelerationRate="fast"
  scrollbar={false}
  style={{ height: 140 }}
  contentStyle={{ paddingHorizontal: 16, gap: 12 }}
>
  {(card) => <View style={{ width: 220, height: 140, borderRadius: 14, backgroundColor: card().color }} />}
</List>
```

De derecha a izquierda, las listas horizontales empiezan por la derecha y avanzan hacia la izquierda.

<a id="lists-in-a-page-viewportparent"></a>

## Listas en una página: viewport="parent"

Una página suele desplazarse como una sola: un encabezado, unas cuantas tarjetas, luego una lista larga y quizá otra lista debajo. Dale a la lista `viewport="parent"` (`.viewport(ListViewport::Parent)` en Rust) y colócala en un `Scroll` con el resto de la página: la lista se extiende en la página a toda su longitud, y la scroll view de la página la desplaza junto con todo lo demás. Sigue creando solo las filas cercanas al viewport de la página y reciclando sus celdas, de modo que una página puede contener varias listas largas.

```rust tabs
scroll()
    .flex_1()
    .child(header())
    .child(
        virtual_list(count, row)
            .viewport(ListViewport::Parent)
            .estimated_item_size(px(56.0))
            .row_gap(px(6.0)),
    )
    .child(footer())
```

```tsx tabs
<Scroll style={{ flex: 1 }}>
  <Header />
  <List viewport="parent" each={items} estimatedItemSize={56} contentStyle={{ gap: 6 }}>
    {(item) => <Row item={item()} />}
  </List>
  <Footer />
</Scroll>
```

- La lista es tan larga como sus filas: su altura (su anchura, en horizontal) procede de su contenido, como la de una vista, y su padding, borde y márgenes funcionan como en una vista.
- Sus filas siguen a la scroll view más cercana que la rodea a lo largo de su eje, o a la pantalla en la que está.
- La página mantiene en su sitio lo que estás leyendo, como hace un navegador: las filas que cambian de tamaño totalmente por encima del borde superior del viewport mueven la página en la misma medida; mientras el inicio de la lista está a la vista, las filas que crecen empujan hacia abajo lo que tienen debajo.
- `scrollToIndex`, `scrollToEnd` y `initialScrollIndex` desplazan la página a las filas de la lista, dentro del contenido de la página; `onLoadMore` se dispara cuando el final de la lista se acerca al viewport, y `onViewableItemsChange` informa de las filas que están en el viewport de la página.
- `stickyHeaderIndices` y `stickyHeaderOffset` fijan filas en la parte superior de la página: un encabezado de sección se queda arriba mientras sus filas se desplazan bajo él, hasta que el siguiente lo empuja fuera, y el último se va con el final de su lista.
- Cómo se desplaza la página depende de su scroll view: define `onScroll` y los demás eventos de desplazamiento, `scrollValue`, `refreshing` / `onRefresh`, paginación y snapping, `contentInset`, `scrollbar`, `scrollable` y `keyboardDismissMode` en el `Scroll`. Las listas invertidas y `maintainVisibleContentPosition` son características de una lista con un viewport propio (`viewport="own"`, el valor por defecto).
- El viewport se elige al crear la lista: para cambiarlo, renderiza una nueva lista.

<a id="loading-more-onloadmore"></a>

## Cargar más: onLoadMore

`onLoadMore` (`.on_load_more(..)`) se dispara cuando el viewport llega a estar a `loadMoreThreshold` viewports del final (1 por defecto: una pantalla por delante). Añade la siguiente página; la lista se dispara de nuevo cuando el nuevo final se acerca.

```rust tabs
let posts = signal(Vec::<Post>::new());
let page = stored(0_u32);
let loading = stored(false);

let load_more = move || {
    if loading.replace(true) {
        return;
    }
    let next = page.with(|p| {
        *p += 1;
        *p
    });
    spawn(async move {
        if let Ok(response) = fetch(format!("https://api.example.com/posts?page={next}")).await {
            let more = parse_posts(&response.text());
            posts.update(|p| p.extend(more));
        }
        loading.replace(false);
    });
};
load_more();

virtual_list(move || posts.with(Vec::len), move |at| post_row(posts, at))
    .estimated_item_size(px(72.0))
    .on_load_more(load_more)
    .load_more_threshold(0.5)
    .footer(text("Loading…").p_4().text_center().text_color(rgb(0x8c959f)))
    .flex_1()
```

```tsx tabs
const posts = signal<Post[]>([]);
let loading = false;
let page = 0;

const loadMore = async () => {
  if (loading) return;
  loading = true;
  try {
    const next: Post[] = await (await fetch(`https://api.example.com/posts?page=${++page}`)).json();
    posts.set([...posts(), ...next]);
  } finally {
    loading = false;
  }
};
loadMore();

<List
  each={posts()}
  estimatedItemSize={72}
  style={{ flex: 1 }}
  onLoadMore={loadMore}
  loadMoreThreshold={0.5}
  footer={<Text style={{ padding: 16, textAlign: "center", color: "#8c959f" }}>Loading…</Text>}
>
  {(post) => <PostRow post={post()} />}
</List>
```

Protégete contra cargas superpuestas como se muestra arriba: el final puede notificarse de nuevo mientras una página está en camino.
<a id="loading-at-the-start-onloadmoreatstart"></a>

## Carga al inicio: onLoadMoreAtStart

Una lista también puede abrirse en medio de sus datos: un chat abierto en un mensaje antiguo (un resultado de búsqueda, la cita de una respuesta) muestra una página alrededor de ese mensaje, con mensajes más recientes aún por cargar. `onLoadMoreAtStart` (`.on_load_more_at_start(..)`) se dispara cuando el viewport llega a `loadMoreAtStartThreshold` viewports del inicio (1 por defecto), el lado del elemento 0: la parte superior de una lista, la inferior de una lista invertida. Antepón la página: las filas en pantalla conservan su posición mientras la página llega antes que ellas (también en una lista invertida, una vez que se ha alejado de su parte inferior), y la lista se dispara de nuevo en la siguiente aproximación, o de inmediato cuando la página la dejó todavía cerca del inicio.

Se dispara cuando el usuario se desplaza hasta allí o cuando un comando de desplazamiento lleva la lista hasta allí (`initialScrollIndex` incluido), de modo que una lista que se abre en su elemento más nuevo no pide nada, y una abierta con `initialScrollIndex` cerca de su inicio pide la página anterior de inmediato.

```rust tabs
let messages = signal(page_around(target)); // newest first, ending at an old message
let loading = stored(false);

let load_newer = move |_: &()| {
    if loading.replace(true) {
        return;
    }
    let newest = messages.with(|m| m[0].id);
    spawn(async move {
        if let Ok(response) = fetch(format!("https://api.example.com/messages?after={newest}")).await {
            let newer = parse_messages(&response.text());
            messages.update(|m| {
                m.splice(0..0, newer);
            });
        }
        loading.replace(false);
    });
};

virtual_list(move || messages.with(Vec::len), move |at| message_row(messages, at))
    .inverted(true)
    .on_load_more(load_older)
    .on_load_more_at_start(load_newer)
    .load_more_at_start_threshold(0.5)
    .flex_1()
```

```tsx tabs
const messages = signal<Message[]>(pageAround(target)); // newest first, ending at an old message
let loading = false;

const loadNewer = async () => {
  if (loading) return;
  loading = true;
  try {
    const newest = messages()[0].id;
    const newer: Message[] = await (await fetch(`https://api.example.com/messages?after=${newest}`)).json();
    messages.set([...newer, ...messages()]);
  } finally {
    loading = false;
  }
};

<List
  each={messages()}
  inverted
  style={{ flex: 1 }}
  onLoadMore={loadOlder}
  onLoadMoreAtStart={loadNewer}
  loadMoreAtStartThreshold={0.5}
>
  {(message) => <Bubble message={message()} />}
</List>
```

Una vez que el mensaje más reciente está cargado, deja de cargar: los mensajes nuevos llegan entonces al inicio, como en cualquier chat.

## Viewability

`onViewableItemsChange` (`.on_viewable_items_change(..)`) informa de qué elementos están en pantalla, para analítica, para reproducir automáticamente el vídeo visible o para marcar mensajes como leídos. En TSX recibe `{ viewableItems, changed }`, arreglos de tokens `{ item, key, index, isViewable }`; en Rust, `ViewableItems` con la primera y la última fila visibles (`viewable`) y las filas cuyo estado cambió (`changed()`). La visibilidad se calcula de forma nativa; tu código solo se entera de los cambios.

| `viewabilityConfig` | Rust | Descripción |
|---|---|---|
| `itemVisibleThreshold` | `Viewability { item_visible_threshold, .. }` | Cuánto de un elemento debe ser visible, de 0 a 1. |
| `viewAreaCoverageThreshold` | `Viewability { view_area_coverage_threshold, .. }` | Cuánto del viewport debe cubrir un elemento, de 0 a 1. |
| `minimumViewTime` | `.minimum_view_time(Duration)` | Milisegundos que un elemento debe permanecer visible antes de ser reportado. |

Sin umbral, cuenta cualquier píxel visible.

```rust tabs
let playing = signal(None::<usize>);

virtual_list(count, move |at| video_card(videos.clone(), at))
    .estimated_item_size(px(300.0))
    .viewability(Viewability {
        item_visible_threshold: Some(Percentage(0.6)),
        ..Viewability::default()
    })
    .minimum_view_time(Duration::from_millis(250))
    .on_viewable_items_change(move |rows: &ViewableItems| {
        playing.set(rows.viewable.map(|(first, _)| first))
    })
    .flex_1()
```

```tsx tabs
<List
  each={videos}
  estimatedItemSize={300}
  style={{ flex: 1 }}
  keyExtractor={(v) => v.slug}
  viewabilityConfig={{ itemVisibleThreshold: 0.6, minimumViewTime: 250 }}
  onViewableItemsChange={({ viewableItems }) => playing.set(viewableItems[0]?.key ?? null)}
>
  {(v) => <VideoCard video={v()} />}
</List>
```

<a id="scrolling-from-code"></a>

## Desplazamiento desde el código

Dale a la lista una ref (`element_ref()` y `.element_ref(&list)` en Rust, `ref` en TSX):

| Rust | TSX | Descripción |
|---|---|---|
| `scroll_to_index(index, view_position, view_offset, animated)` | `scrollToIndex({ index, animated?, viewPosition?, viewOffset? })` | Desplaza el elemento `index` hasta hacerlo visible. La posición de vista lo ubica: 0 al inicio del viewport (por defecto), 0.5 en el medio, 1 al final; el desplazamiento de vista lo mueve aún más. |
| `scroll_to_offset(offset, animated)` | `scrollToOffset({ offset, animated? })` | Se desplaza a un offset de contenido a lo largo del eje de la lista. |
| `scroll_to_end(animated)` | `scrollToEnd({ animated? })` | Se desplaza al final del contenido (el inicio de una lista invertida). |
| `scroll_to(point, animated)` | `scrollTo({ x?, y?, animated? })` | Se desplaza a un offset, como en un scroll view. |

```rust tabs
let list = element_ref();

virtual_list(count, row).estimated_item_size(px(48.0)).flex_1().element_ref(&list)

list.scroll_to_index(120, percentage(0.5), px(0.0), true);
```

```tsx tabs
import { List, type ListRef } from "nsh";

let list!: ListRef;

<List ref={list} each={items} estimatedItemSize={48} style={{ flex: 1 }}>…</List>

list.scrollToIndex({ index: 120, viewPosition: 0.5 });
```

El desplazamiento a un índice (y al final) se resuelve de forma nativa con los tamaños conocidos en ese momento: filas medidas donde se han medido, el tamaño estimado en el resto. Después la lista sigue su objetivo mientras se miden las filas a su alrededor, de modo que aterriza con exactitud, hasta que el usuario se desplaza o los elementos cambian. Para abrir una lista en un elemento, usa `initialScrollIndex` (`.initial_scroll_index(..)`) en lugar de desplazarte después del primer fotograma.

<a id="a-settings-style-list"></a>

## Una lista de estilo ajustes

El aspecto de una lista es propio de la app: la lista coloca y recicla las filas, y las filas, los separadores y las superficies son tus vistas. Una lista agrupada de estilo ajustes es una lista con padding, un separador y la primera y la última fila redondeadas. Conviértela en un componente propio y úsala dondequiera que la app muestre ajustes:

```rust tabs
use std::rc::Rc;

use nsh_core::{element::palette::NEUTRAL, prelude::*};

pub struct Setting {
    pub id: &'static str,
    pub label: &'static str,
}

pub fn settings_list(settings: Rc<Vec<Setting>>, on_select: impl Fn(&Setting) + 'static) -> impl IntoElement {
    let surface = AdaptiveColor::new(white(), NEUTRAL.shade(900));
    let on_select = Rc::new(on_select);
    let count = settings.len();
    view().flex_1().bg(AdaptiveColor::new(NEUTRAL.shade(100), NEUTRAL.shade(950))).child(
        virtual_list(count, move |at| {
            let (pressed, shown, on_select) = (settings.clone(), settings.clone(), on_select.clone());
            view()
                .on_press(move || on_select(&pressed[at.index()]))
                .role(AccessibilityRole::Button)
                .h_12()
                .justify_center()
                .bg(surface)
                .px_4()
                .active(|s| s.bg(NEUTRAL.shade(200)))
                .rounded_t(move || px(if at.is_first() { 12.0 } else { 0.0 }))
                .rounded_b(move || px(if at.is_last() { 12.0 } else { 0.0 }))
                .child(text(move || shown[at.index()].label))
        })
        .estimated_item_size(px(48.0))
        .content_padding(px(16.0))
        .separator(move || {
            view()
                .bg(surface)
                .child(view().ml_4().h(px(1.0)).bg(AdaptiveColor::new(NEUTRAL.shade(200), NEUTRAL.shade(800))))
        })
        .flex_1(),
    )
}
```

```tsx tabs
import { List, Text, View } from "nsh";

type Setting = { id: string; label: string };

function SettingsList(props: { each: Setting[]; onSelect: (s: Setting) => void }) {
  return (
    <View class="flex-1 bg-neutral-100 dark:bg-neutral-950">
      <List
        each={props.each}
        estimatedItemSize={48}
        style={{ flex: 1 }}
        contentStyle={{ padding: 16 }}
        separator={() => (
          <View class="bg-white dark:bg-neutral-900">
            <View class="ml-4 h-px bg-neutral-200 dark:bg-neutral-800" />
          </View>
        )}
      >
        {(s, i) => (
          <View
            onPress={() => props.onSelect(s())}
            role="button"
            class="h-12 justify-center bg-white px-4 active:bg-neutral-200 dark:bg-neutral-900"
            classList={{ "rounded-t-xl": i() === 0, "rounded-b-xl": i() === props.each.length - 1 }}
          >
            <Text>{s().label}</Text>
          </View>
        )}
      </List>
    </View>
  );
}
```

<a id="performance-notes"></a>

## Notas de rendimiento

- Cada celda se maqueta por separado, así que al desplazarse solo se maquetan las celdas que cambiaron. Mantén las filas poco profundas y evita leer signals en filas que cambian en cada fotograma.
- El lado nativo pide celdas por lotes, hasta varias rondas por fotograma, fusionadas en una sola actualización; un fling rápido enlaza muchas celdas en un fotograma sin una llamada a tu código por celda. Las filas de Rust se enlazan en el propio núcleo, dentro del commit que las necesita.
- Usa [`nsh test --trace` con un paso `scroll`](./testing-and-trace.md#scrolling) para medir el coste por fotograma de tus filas.

<a id="related"></a>

## Relacionado

- [Elemento `List`](../elements/list.md): la referencia.
- [Desplazamiento](./scrolling.md): las props de desplazamiento que las listas comparten con los scroll views.
- [Reactividad](./reactivity.md): por qué las filas leen su posición en los bindings.
- [Rendimiento](./performance.md): medición de listas.
