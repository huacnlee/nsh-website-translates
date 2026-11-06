---
title: "List"
description: "List, una lista virtualizada y con reciclaje de vistas sobre un scroll view nativo, con todas sus props, eventos y métodos de ref."
order: 2.1
source_hash: 6aa08fac2fd24e8c
---


# List

`nsh` exporta `List`: una lista virtualizada sobre una scroll view nativa. Solo existen las filas cercanas al viewport, y sus celdas se reutilizan a medida que se desplaza. Qué filas existen, dónde están, las columnas, los encabezados fijos y la visibilidad se calculan de forma nativa, así que desplazar una lista de diez mil elementos no ejecuta nada de JS, salvo los bindings de fila que cambian cuando se reutiliza una celda.

```ts
import { List, type ListProps, type ViewToken, type ViewabilityConfig } from "nsh";
```

Consulta [Lists](../docs/lists.md) para la guía y [`<List>`](../elements/list.md) para las props del elemento.

## List

```ts
function List<T>(props: ListProps<T>): JSX.Element;
```

```tsx
import { List, mount, Text, View } from "nsh";

const contacts = Array.from({ length: 1000 }, (_, i) => ({ id: String(i), name: `Contact ${i}` }));

function App() {
  return (
    <List each={contacts} estimatedItemSize={48} style={{ flex: 1 }}>
      {(item, index) => (
        <View style={{ height: 48, paddingHorizontal: 16, justifyContent: "center", backgroundColor: index() % 2 ? "#f8fafc" : "#fff" }}>
          <Text>{item().name}</Text>
        </View>
      )}
    </List>
  );
}

mount(App);
```

<a id="rows-are-recycled"></a>

### Las filas se reciclan

`children` es una función que renderiza **una celda**. Se ejecuta una vez por celda, no una vez por elemento: cuando una celda sale de la vista se reutiliza para otro elemento, y `item()` y `index()` (ambos accessors) cambian. Léelos dentro de expresiones JSX (`{item().name}`) para que la celda se actualice cuando se reutilice.

> [!WARNING]
> No guardes estado por elemento en signals creados dentro de la función de fila: la celda se reutiliza para otros elementos y la signal seguiría a la celda, no al elemento. Guárdalo en tus datos, indexado por id (por ejemplo, una signal que contenga un `Set` de ids seleccionados).

## Props

`ListProps<T>` combina las props propias de la lista con las props de desplazamiento que comparte con `<Scroll>` y las props que acepta todo elemento, que van a la scroll view de la lista.

<a id="data-and-rendering"></a>

### Datos y renderizado

| Prop | Tipo | Valor por defecto | Descripción |
|---|---|---|---|
| `each` | `readonly T[]` | (obligatorio) | Los elementos. Pasa el valor de una signal (`each={items()}`) para seguir los cambios; insertar elementos por encima de las filas visibles mantiene esas filas en su sitio. |
| `children` | `(item: () => T, index: () => number) => JSX.Element` | (obligatorio) | Renderiza una fila (véase arriba). |
| `estimatedItemSize` | `number` | `50` | El tamaño de las filas aún no medidas, en puntos, a lo largo del eje de la lista. Unas estimaciones cercanas hacen más precisos el indicador de desplazamiento y `scrollToIndex`. |
| `numColumns` | `number` | `1` | Elementos por fila (listas verticales): una cuadrícula. |
| `horizontal` | `boolean` | `false` | Se desplaza horizontalmente. |
| `inverted` | `boolean` | `false` | Se dispone desde el final, con el elemento 0 en último lugar (estilo chat); empieza desplazada al final y mantiene su distancia al final cuando cambia el contenido. |
| `stickyHeaderIndices` | `number[]` | | Elementos que se quedan fijos al inicio mientras se desplaza más allá (una columna, sin invertir). |
| `header` | `ListSlot` | | Se renderiza antes de los elementos. |
| `footer` | `ListSlot` | | Se renderiza después de los elementos. |
| `empty` | `ListSlot` | | Se muestra en lugar de los elementos mientras `each` está vacío. |
| `separator` | `ListSlot` | | Se renderiza entre elementos (una columna). |
| `keyExtractor` | `(item: T, index: number) => string` | `item.key`, `item.id` o el índice | La clave de un elemento en los tokens de visibilidad. |
| `initialScrollIndex` | `number` | | Se desplaza a este elemento antes del primer frame. |
| `contentStyle` | `ListContentStyle` | | Padding y espacios del contenido: `padding`, `paddingHorizontal`, `paddingVertical`, `paddingTop`, `paddingRight`, `paddingBottom`, `paddingLeft`, `gap`, `rowGap`, `columnGap` (números). |
| `contentClass` | `string` | | Padding y espacios del contenido como clases (`p-*`, `gap-*`); `contentStyle` tiene prioridad sobre ellas. |
| `style` | `StyleProp<ViewStyle>` | | El estilo propio de la lista (dale un tamaño: `flex: 1` o una altura). |
| `testID` | `string` | | El id con el que las pruebas de UI encuentran la scroll view de la lista (el `id:` de `nsh test`, XCUITest, UI Automator). |
| `ref` | `ListRef \| ((node: ListRef) => void)` | | Consulta los [métodos de ref](#ref-methods). |

`ListSlot` es un componente (`Header`) o un elemento (`<Header />`).

<a id="loading-refreshing-and-viewability"></a>

### Carga, actualización y visibilidad

| Prop | Tipo | Valor por defecto | Descripción |
|---|---|---|---|
| `onLoadMore` | `() => void` | | Se llama cuando el final queda a menos de `loadMoreThreshold` viewports: cargar más. |
| `loadMoreThreshold` | `number` | `1` | Qué tan cerca del final (en longitudes de viewport) se dispara `onLoadMore`. |
| `onLoadMoreAtStart` | `() => void` | | Se llama cuando el inicio queda a menos de `loadMoreAtStartThreshold` viewports después de que el usuario o un comando de desplazamiento moviera la lista: carga lo que viene antes del primer elemento. |
| `loadMoreAtStartThreshold` | `number` | `1` | Qué tan cerca del inicio (en longitudes de viewport) se dispara `onLoadMoreAtStart`. |
| `refreshing` | `boolean` | | Se muestra el spinner de pull-to-refresh. |
| `onRefresh` | `() => void` | | Activa pull to refresh; establece `refreshing` mientras cargas. |
| `refreshIndicator` | `{ height: number }` | | La app dibuja su propio indicador de pull-to-refresh, de `height` de alto, en lugar del spinner. |
| `pullValue` | `AnimatedValue` | | Recibe cuánto se ha tirado de la lista más allá de su parte superior, para ese indicador. |
| `onViewableItemsChange` | `(info: { viewableItems: ViewToken<T>[]; changed: ViewToken<T>[] }) => void` | | Elementos que pasaron a ser visibles o dejaron de serlo. |
| `viewabilityConfig` | `ViewabilityConfig` | | Cuándo se considera visible un elemento. |

```ts
interface ViewToken<T> {
  item: T;
  key: string;
  index: number;
  isViewable: boolean;
}

interface ViewabilityConfig {
  /** How much of the viewport an item must cover to count as viewable, from 0 to 1. */
  viewAreaCoverageThreshold?: number;
  /** How much of an item must be visible, from 0 to 1. Without either threshold, any visible pixel counts. */
  itemVisibleThreshold?: number;
  /** Milliseconds items must stay viewable before they are reported. */
  minimumViewTime?: number;
}
```

<a id="scrolling"></a>

### Desplazamiento

| Prop | Tipo | Valor por defecto | Descripción |
|---|---|---|---|
| `scrollbar` | `boolean \| ScrollbarTheme` | `true` | Se muestra el indicador de desplazamiento: el de la plataforma o la [barra integrada](../elements/scrollbar.md#built-in-bars) de la app; un objeto es un tema de la propia vista. |
| `scrollable` | `boolean` | `true` | El usuario puede desplazarla. |
| `bounces` | `boolean` | `true` | Overscroll más allá de los bordes. |
| `pagingEnabled` | `boolean` | `false` | Se detiene en múltiplos del viewport. |
| `snapToInterval` | `number` | `0` | Se detiene en múltiplos de esta longitud (0: desactivado). |
| `snapToOffsets` | `number[]` | | Se detiene en estos offsets. |
| `snapToAlignment` | `"start" \| "center" \| "end"` | `"start"` | Qué punto de un elemento se alinea con el viewport con `snapToInterval`. |
| `disableIntervalMomentum` | `boolean` | `false` | Un fling avanza como máximo un punto de anclaje. |
| `decelerationRate` | `"normal" \| "fast" \| number` | plataforma | Qué tan rápido se frena un fling (`0.998` / `0.99`, o la velocidad que se conserva por milisegundo). |
| `contentInset` | `Partial<Edges>` | | Espacio alrededor del contenido. |
| `contentOffset` | `{ x?, y? }` | | Dónde empieza. |
| `keyboardShouldPersistTaps` | `"never" \| "always" \| "handled" \| boolean` | `"never"` | Si un toque cierra el teclado (`"never"`: el toque solo lo cierra). |
| `keyboardDismissMode` | `"none" \| "on-drag" \| "interactive"` | `"none"` | Si arrastrar cierra el teclado. |
| `scrollEventThrottle` | `number` | | Milisegundos mínimos entre eventos `onScroll` (como máximo uno por frame de todos modos). |
| `scrollValue` | `AnimatedValue` | | Un [valor animado](./nsh.md#animation) que recibe el offset de desplazamiento (eje principal) en el hilo de UI, para efectos vinculados al desplazamiento. |

<a id="scroll-events"></a>

### Eventos de desplazamiento

| Evento | Payload | Cuándo |
|---|---|---|
| `onScroll` | `ScrollEvent`: `{ offset, contentSize, size, zoomScale }` | Mientras se desplaza. |
| `onScrollDragStart` | `{ offset }` | Empieza un arrastre. |
| `onScrollDragEnd` | `{ offset }` | El dedo se levanta. |
| `onMomentumStart` | `{ offset }` | Empieza un deslizamiento tras el arrastre. |
| `onMomentumEnd` | `{ offset }` | El deslizamiento termina (también cuando un nuevo arrastre lo detiene). |
| `onScrollEnd` | `{ offset }` | El desplazamiento se detuvo. |

Las listas también aceptan las props que acepta todo elemento ([props comunes](../elements/index.md)).

<a id="ref-methods"></a>

## Métodos de ref

El `ref` de una lista recibe un `ListRef`, con estos métodos además de los de `ViewRef`:

| Método | Descripción |
|---|---|
| `scrollToIndex({ index, animated?, viewPosition?, viewOffset? })` | Desplaza el elemento `index` hasta que quede a la vista. `viewPosition` lo coloca: `0` al inicio del viewport (por defecto), `0.5` en el centro, `1` al final; `viewOffset` lo desplaza aún más. Se resuelve de forma nativa con los tamaños de fila medidos (o estimados). |
| `scrollToOffset({ offset, animated? })` | Se desplaza a un offset del contenido a lo largo del eje de la lista. |
| `scrollToEnd({ animated? })` | Se desplaza al final del contenido (el inicio de una lista invertida). |
| `scrollTo({ x?, y?, animated? })` | Se desplaza a un offset. |

```tsx
import { List, type ListRef, Text, View } from "nsh";

let list!: ListRef;

<View style={{ flex: 1 }}>
  <Text onPress={() => list.scrollToIndex({ index: 60, viewPosition: 0.5 })}>Jump to 60</Text>
  <List ref={list} each={items} numColumns={3} estimatedItemSize={90} style={{ flex: 1 }}
        contentStyle={{ padding: 12, gap: 8 }}>
    {(item) => <View style={{ height: 90, backgroundColor: "#e0e7ff" }}><Text>{item().title}</Text></View>}
  </List>
</View>
```

<a id="examples"></a>

## Ejemplos

Un chat: el mensaje más reciente abajo, los mensajes más antiguos se cargan al desplazarte hacia arriba.

```tsx
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
    <View style={{ alignSelf: m().mine ? "flex-end" : "flex-start", maxWidth: "75%", padding: 10, borderRadius: 14, backgroundColor: m().mine ? "#6366f1" : "#e2e8f0" }}>
      <Text style={{ color: m().mine ? "#fff" : "#0f172a" }}>{m().text}</Text>
    </View>
  )}
</List>
```

Pull to refresh:

```tsx
const refreshing = signal(false);
const refresh = async () => {
  refreshing.set(true);
  items.set(await load());
  refreshing.set(false);
};

<List each={items()} refreshing={refreshing()} onRefresh={refresh} style={{ flex: 1 }}>
  {(item) => <Text style={{ padding: 16 }}>{item().title}</Text>}
</List>
```

## ListItemsProps

```ts
type ListItemsProps<T> = Pick<ListProps<T>,
  "each" | "children" | "keyExtractor" | "stickyHeaderIndices" | "initialScrollIndex"
  | "onViewableItemsChange" | "viewabilityConfig" | "refreshing" | "onRefresh"
  | "onLoadMore" | "loadMoreThreshold"
  | "header" | "footer" | "empty">;
```

La mitad de datos y filas de `ListProps`: lo que pasas a un componente propio que dispone una lista por sí mismo, como una lista de ajustes que envuelve `List` con su propio padding y divisores.
