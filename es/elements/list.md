---
title: "List"
description: "La lista virtualizada con reciclaje: filas, columnas, encabezados fijos, listas invertidas para chat, visibilidad y desplazamiento a elementos."
order: 50
group: primitives
demo: el-list
source_hash: 6e5480c9dd9e1df4
---


# List

`List` muestra datos largos o sin límite. Existen las filas cercanas al viewport: a medida que el usuario se desplaza, las filas que salen se reciclan para las filas que entran. Qué filas existen, sus posiciones, columnas, cabeceras fijas y visibilidad se calculan de forma nativa, de modo que desplazar una lista de miles de elementos cuesta lo mismo que una de veinte. Rust crea una con `virtual_list(count, |at| row)`, TSX con `<List>` desde `nsh`.

```rust tabs
use nsh_core::prelude::*;

#[derive(Clone, PartialEq)]
struct Contact {
    id: usize,
    name: String,
}

fn app() -> impl IntoElement {
    let contacts = signal(
        (0..1000).map(|i| Contact { id: i, name: format!("Contact {}", i + 1) }).collect::<Vec<_>>(),
    );
    virtual_list(move || contacts.with(|c| c.len()), move |at| {
        view().h(px(56.0)).px_4().justify_center().child(
            text(move || contacts.with(|c| format!("{}. {}", at.index() + 1, c[at.index()].name)))
                .text_base(),
        )
    })
    .estimated_item_size(px(56.0))
    .flex_1()
}
```

```tsx tabs
import { List, mount, Text, View } from "nsh";

const contacts = Array.from({ length: 1000 }, (_, i) => ({ id: i, name: `Contact ${i + 1}` }));

function App() {
  return (
    <List each={contacts} estimatedItemSize={56} style={{ flex: 1 }}>
      {(contact, index) => (
        <View style={{ height: 56, paddingHorizontal: 16, justifyContent: "center" }}>
          <Text style={{ fontSize: 16 }}>
            {index() + 1}. {contact().name}
          </Text>
        </View>
      )}
    </List>
  );
}

mount(App);
```

En TSX, `List` es genérico: `List<T>` comprueba que `each` y la función de fila coinciden en el tipo de elemento, que TypeScript infiere a partir de `each` (consulta la [List API](../modules/nsh-list.md)). En Rust, `virtual_list` recibe el número de filas (un valor, una señal o una closure: la lista crece y se encoge in situ) y la función que construye la fila en un `Position`; las filas leen los datos del componente mediante `at.index()`.

Para una lista corta cuyas filas deben existir todas (una página de ajustes, un formulario), un [`Each`](./control-flow.md) dentro de una [vista de desplazamiento](./scroll.md) es más sencillo. Para una lista con estilo de tabla agrupada, consulta [una lista al estilo de ajustes](../docs/lists.md#a-settings-style-list). La [guía de listas](../docs/lists.md) cubre patrones: carga infinita, chat, secciones.

<a id="rows-are-recycled"></a>

## Las filas se reciclan

La función de fila se ejecuta una vez por celda, no una vez por elemento. Cuando una celda se reutiliza para otro elemento, su posición cambia (TSX: los accesores `item()` y `index()`; Rust: `at.index()`) y todo lo que la lee se actualiza:

```rust tabs
virtual_list(move || messages.with(|m| m.len()), move |at| {
    text(move || messages.with(|m| m[at.index()].body.clone()))
})
```

```tsx tabs
<List each={messages()}>
  {(message) => <Text>{message().body}</Text>}
</List>
```

Por ello, mantén el estado de cada elemento en tus datos (con clave por id), no en señales creadas dentro de la función de fila: una señal así permanece con la celda y aparece en otro elemento.

Las celdas que esperan su siguiente elemento se ocultan cuando su fila ya no está o la muestra otra celda, de modo que los lectores de pantalla, los toques y las pruebas de UI encuentran cada fila una sola vez.

## Props

| Prop | Rust | Tipo | Valor por defecto | Descripción |
|---|---|---|---|---|
| `each` | `virtual_list(count, ..)` | `readonly T[]` | | Los elementos. |
| `children` | `virtual_list(.., \|at\| row)` | `(item: () => T, index: () => number) => JSX.Element` | | Renderiza una fila. |
| `estimatedItemSize` | `.estimated_item_size(px(..))` | `number` | `50` | El tamaño de los elementos aún no medidos, en puntos. Las estimaciones cercanas mantienen estable la barra de desplazamiento. |
| `horizontal` | `.horizontal()` | `boolean` | `false` | Se desplaza lateralmente. |
| `viewport` | `.viewport(ListViewport::..)` | `"own" \| "parent"` | `"own"` | `"own"`: la lista se desplaza en una vista de desplazamiento propia. `"parent"`: se extiende a su longitud completa en el layout de su padre y renderiza las filas cercanas al viewport de la vista de desplazamiento que la rodea, que la desplaza junto con el resto de la página (consulta [listas en una página](../docs/lists.md#lists-in-a-page-viewportparent)). Se elige al crear la lista. |
| `numColumns` | `.columns(n)` | `number` | `1` | Elementos por fila (listas verticales). |
| `inverted` | `.inverted()` | `boolean` | `false` | Se dispone desde el final, con el elemento 0 en último lugar (estilo chat): empieza desplazada al final y mantiene su distancia al final cuando el contenido cambia. |
| `maintainVisibleContentPosition` | `.follow_end(px(threshold))` | `{ autoscrollToBottomThreshold?: number }` | | Para listas no invertidas: al final del contenido, o a esa cantidad de puntos o menos de él, la lista permanece al final cuando el contenido crece o el viewport se reduce; si está desplazada más arriba, el contenido visible se mantiene. |
| `stickyHeaderIndices` | `.sticky_header_indices([..])` | `number[]` | | Elementos que se quedan fijos al inicio mientras se desplaza más allá de ellos (una columna, no invertida). |
| `contentStyle` | `.content_padding(..)`, `.content_padding_x(..)`, `.row_gap(..)`, `.column_gap(..)`, … | `ListContentStyle` | | Relleno y espacios del contenido, en puntos: `padding`, `paddingHorizontal`, `paddingVertical`, `paddingTop`, `paddingRight`, `paddingBottom`, `paddingLeft`, `gap`, `rowGap`, `columnGap`. |
| `contentClass` | | `string` | | Relleno y espacios del contenido como clases (`p-*`, `gap-*`); `contentStyle` prevalece sobre ellas. |
| `header` | `.header(el)` | `ListSlot` | | Antes de los elementos: un componente (`Header`) o un elemento (`<Header />`). |
| `footer` | `.footer(el)` | `ListSlot` | | Después de los elementos. |
| `empty` | `.empty(el)` | `ListSlot` | | Se muestra en lugar de los elementos mientras `each` está vacío. |
| `separator` | `.separator(\|\| el)` | `ListSlot` | | Entre elementos (una columna). |
| `initialScrollIndex` | `.initial_scroll_index(i)` | `number` | | Se desplaza a este elemento antes del primer fotograma. |
| `keyExtractor` | `.keys(\|\| ids)` | `(item: T, index: number) => string` | `item.key`, `item.id` o el índice | La clave de un elemento en los tokens de visibilidad. En Rust, las identidades de las filas, de modo que las filas conservan sus celdas y tamaños cuando se añaden o quitan filas antes que ellas. |
| `onLoadMore` | `.on_load_more(..)` | `() => void` | | El final está cerca: carga más. |
| `loadMoreThreshold` | `.load_more_threshold(viewports)` | `number` | `1` | A qué distancia del final (en viewports) se dispara `onLoadMore`. |
| `onLoadMoreAtStart` | `.on_load_more_at_start(..)` | `() => void` | | El inicio está cerca, después de que el usuario o un comando de desplazamiento moviera la lista: carga lo que viene antes del primer elemento. |
| `loadMoreAtStartThreshold` | `.load_more_at_start_threshold(viewports)` | `number` | `1` | A qué distancia del inicio (en viewports) se dispara `onLoadMoreAtStart`. |
| `onViewableItemsChange` | `.on_viewable_items_change(..)` | `(info: { viewableItems: ViewToken<T>[]; changed: ViewToken<T>[] }) => void` | | Los elementos pasaron a ser visibles o dejaron de serlo. |
| `viewabilityConfig` | `.viewability(..)`, `.minimum_view_time(..)` | `ViewabilityConfig` | | Cuándo se considera que los elementos son visibles (abajo). |
| `refreshing` | `.refreshing(..)` | `boolean` | | Se muestra el indicador de pull-to-refresh. |
| `onRefresh` | `.on_refresh(..)` | `() => void` | | El usuario tiró para refrescar. |
| `refreshIndicator` | `.refresh_indicator(Some(height))` | `{ height: number }` | | La app dibuja su propio indicador, de `height` puntos de alto: el indicador de la plataforma se oculta, un tirón refresca al alcanzar `height`, y mientras refresca se mantiene `height` por encima del contenido. Una altura de 0 o menos equivale a ninguno. |
| `pullValue` | `.pull_value(&value)` | `AnimatedValue` | | Un valor animado alimentado con cuánto se ha tirado de la lista más allá de su parte superior (0 en reposo, creciendo con el tirón; el espacio que se mantiene sobre el contenido mientras refresca: `height` con `refreshIndicator`), para el indicador de la app. |
| `scrollbar` | `.scrollbar(..)` | `boolean \| ScrollbarTheme` | `true` | Se muestra el indicador de desplazamiento: el de la plataforma, o la [barra integrada](./scrollbar.md#built-in-bars) de la app una vez que esta define un tema; un objeto es un tema propio de la vista. En el escritorio y en los navegadores de escritorio una vista horizontal lo conserva: es la barra de desplazamiento del ratón. |
| `scrollValue` | `.scroll_value(&value)` | `AnimatedValue` | | Un valor animado alimentado con el offset de desplazamiento, para animaciones vinculadas al scroll. |
| `keyboardDismissMode` | `.keyboard_dismiss_mode(..)` | `"none" \| "on-drag" \| "interactive"` | `"none"` | Si arrastrar descarta el teclado. |
| `style` | métodos de `Styled` | `StyleProp<ViewStyle>` | | El estilo propio de la lista (necesita un tamaño acotado: `flex: 1` o una altura). |
| `testID` | `.test_id(id)` | `string` | | El id con el que las pruebas de UI encuentran la vista de desplazamiento de la lista (`nsh test` de `id:`, XCUITest, UI Automator). |
| `ref` | `.element_ref(&handle)` | `ListRef \| (node: ListRef) => void` | | La ref de la lista (consulta [métodos de ref](#ref-methods)). |

Las listas también aceptan las props de desplazamiento de [`Scroll`](./scroll.md#scrolling) (los métodos de `Scrollable` en Rust):
`pagingEnabled`, `snapToInterval`, `snapToOffsets`, `snapToAlignment`, `disableIntervalMomentum`, `decelerationRate`,
`bounces`, `contentInset`, `contentOffset`, `keyboardShouldPersistTaps`, `scrollEventThrottle` y `scrollable`.
Las listas conservan su escala.

Las props que acepta todo elemento ([props comunes](./index.md#common-props)) pasan tal cual a la vista de desplazamiento de la lista:
`testID`, `accessibilityLabel` y las demás props de accesibilidad, los estilos, `onLayout`, y las props de toque y de responder.
Las pruebas de UI encuentran una lista por su `testID` igual que cualquier vista.

`ViewabilityConfig` (Rust: `Viewability { item_visible_threshold, view_area_coverage_threshold }` y `.minimum_view_time(..)`):

| Campo | Tipo | Descripción |
|---|---|---|
| `itemVisibleThreshold` | `number` | Cuánto de un elemento debe ser visible, de 0 a 1. |
| `viewAreaCoverageThreshold` | `number` | Cuánto del viewport debe cubrir un elemento, de 0 a 1. Sin ninguno de los dos umbrales, cuenta cualquier píxel visible. |
| `minimumViewTime` | `number` | Milisegundos que los elementos deben permanecer visibles antes de ser notificados. |

`ViewToken<T>` es `{ item, key, index, isViewable }`. El listener de Rust recibe `ViewableItems`: `indices()` es el rango de filas visibles, `changed()` las filas que entraron o salieron.

<a id="events"></a>

## Eventos

| Evento | Rust | Payload | Cuándo |
|---|---|---|---|
| `onScroll` | `.on_scroll` | `ScrollEvent` | El offset cambió. |
| `onScrollDragStart` / `onScrollDragEnd` | `.on_scroll_drag_start` / `.on_scroll_drag_end` | `{ offset }` | El arrastre empezó / terminó. |
| `onMomentumStart` / `onMomentumEnd` | `.on_momentum_start` / `.on_momentum_end` | `{ offset }` | Un deslizamiento por inercia empezó / terminó. |
| `onScrollEnd` | `.on_scroll_end` | `{ offset }` | El desplazamiento se detuvo. |
| `onLoadMore` | `.on_load_more` | ninguno | A `loadMoreThreshold` viewports o menos del final. |
| `onLoadMoreAtStart` | `.on_load_more_at_start` | ninguno | A `loadMoreAtStartThreshold` viewports o menos del inicio, una vez por aproximación tras un desplazamiento. |
| `onViewableItemsChange` | `.on_viewable_items_change` | `{ viewableItems, changed }` (`ViewableItems`) | La visibilidad cambió. |
| `onRefresh` | `.on_refresh` | ninguno | Se tiró para refrescar. |

<a id="ref-methods"></a>

## Métodos de ref

| Método | Rust | Descripción |
|---|---|---|
| `scrollToIndex({ index, animated?, viewPosition?, viewOffset? })` | `scroll_to_index(index, percentage(0.5), px(0.0), animated)` | Desplaza el elemento `index` hasta hacerlo visible. `viewPosition` lo coloca: 0 al inicio del viewport (por defecto), 0.5 en el medio, 1 al final; `viewOffset` lo desplaza aún más. Se resuelve de forma nativa con los tamaños de elemento actuales (medidos o estimados). |
| `scrollToOffset({ offset, animated? })` | `scroll_to_offset(px(..), animated)` | Desplaza a un offset a lo largo del eje de la lista. |
| `scrollToEnd({ animated? })` | `scroll_to_end(animated)` | Desplaza al final del contenido (al inicio en una lista invertida). |
| `scrollTo({ x?, y?, animated? })` | `scroll_to(point(..), animated)` | Desplaza a un offset. |

<a id="examples"></a>

## Ejemplos

Una cuadrícula con cabecera y visibilidad:

```rust tabs
let visible = signal(SharedString::default());
let list = element_ref();

virtual_list(move || photos.with(|p| p.len()), move |at| {
    image(move || photos.with(|p| p[at.index()].url.clone())).h(px(120.0)).rounded(px(8.0))
})
.element_ref(&list)
.columns(3)
.estimated_item_size(px(120.0))
.content_padding(px(12.0))
.row_gap(px(8.0))
.column_gap(px(8.0))
.viewability(Viewability { item_visible_threshold: Some(Percentage(0.5)), ..Viewability::default() })
.on_viewable_items_change(move |items: &ViewableItems| {
    visible.set(format!("{} visible", items.indices().count()).into())
})
.header(
    text("Jump to 60")
        .on_press(move || list.scroll_to_index(60, percentage(0.5), px(0.0), true)),
)
.flex_1()
```

```tsx tabs
const visible = signal("");
let list!: ListRef;

<List
  ref={list}
  each={photos}
  numColumns={3}
  estimatedItemSize={120}
  contentStyle={{ padding: 12, gap: 8 }}
  viewabilityConfig={{ itemVisibleThreshold: 0.5 }}
  onViewableItemsChange={({ viewableItems }) => visible.set(`${viewableItems.length} visible`)}
  header={<Text onPress={() => list.scrollToIndex({ index: 60, viewPosition: 0.5 })}>Jump to 60</Text>}
  style={{ flex: 1 }}
>
  {(photo) => <Image src={photo().url} style={{ height: 120, borderRadius: 8 }} />}
</List>;
```

Un chat:

```rust tabs
virtual_list(move || messages.with(|m| m.len()), move |at| bubble(messages, at))
    .keys(move || messages.with(|m| m.iter().map(|m| m.id).collect::<Vec<_>>()))
    .inverted()
    .estimated_item_size(px(64.0))
    .keyboard_dismiss_mode(KeyboardDismissMode::Interactive)
    .flex_1()
```

```tsx tabs
<List each={messages()} inverted estimatedItemSize={64} keyboardDismissMode="interactive" style={{ flex: 1 }}>
  {(m) => <Bubble message={m()} />}
</List>
```

El elemento 0 es el mensaje más reciente, dibujado en la parte inferior; los mensajes nuevos añadidos al principio de los elementos aparecen sin mover lo que el usuario está leyendo.

<a id="platform-notes"></a>

## Notas de plataforma

- Insertar elementos por encima de las filas visibles mantiene las filas visibles en su sitio en ambas plataformas.
- Las listas horizontales en layouts de derecha a izquierda se reflejan de forma nativa.
- Las cabeceras fijas se anclan de forma nativa en cada fotograma de desplazamiento.
