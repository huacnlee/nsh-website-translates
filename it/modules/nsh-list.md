---
title: "List"
description: "List, una lista virtualizzata e con riciclo degli elementi basata su una scroll view nativa, con tutte le sue prop, i suoi eventi e i suoi metodi ref."
order: 2.1
source_hash: 6aa08fac2fd24e8c
---

# List

`nsh` esporta `List`: una lista virtualizzata basata su una scroll view nativa. Esistono solo le righe vicine alla viewport e le loro celle vengono riutilizzate durante lo scorrimento. Quali righe esistono, dove si trovano, le colonne, gli header sticky e la visibilità sono tutti calcolati in modo nativo, quindi lo scorrimento di una lista di diecimila elementi non esegue alcun JS, tranne i binding delle righe che cambiano quando una cella viene riutilizzata.

```ts
import { List, type ListProps, type ViewToken, type ViewabilityConfig } from "nsh";
```

Consulta [Liste](../docs/lists.md) per la guida e [`<List>`](../elements/list.md) per le props dell'elemento.

<a id="list-1"></a>

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

### Le righe vengono riciclate

`children` è una funzione che renderizza **una cella**. Viene eseguita una volta per cella, non una volta per elemento: quando una cella esce dalla vista viene riutilizzata per un altro elemento, e `item()` e `index()` (entrambi accessor) cambiano. Leggili all'interno di espressioni JSX (`{item().name}`) in modo che la cella si aggiorni quando viene riutilizzata.

> [!WARNING]
> Non mantenere lo stato per elemento in signal creati all'interno della funzione di riga: la cella viene riutilizzata per altri elementi e il signal seguirebbe la cella, non l'elemento. Conservalo nei tuoi dati, indicizzato per id (ad esempio un signal che contiene un `Set` di id selezionati).

## Props

`ListProps<T>` combina le props proprie della lista con le props di scorrimento condivise con `<Scroll>` e le props accettate da ogni
elemento, che vengono passate alla scroll view della lista.

<a id="data-and-rendering"></a>

### Dati e rendering

| Prop | Tipo | Predefinito | Descrizione |
|---|---|---|---|
| `each` | `readonly T[]` | (obbligatorio) | Gli elementi. Passa il valore di un signal (`each={items()}`) per seguirne i cambiamenti; l'inserimento di elementi sopra le righe visibili mantiene quelle righe al loro posto. |
| `children` | `(item: () => T, index: () => number) => JSX.Element` | (obbligatorio) | Renderizza una riga (vedi sopra). |
| `estimatedItemSize` | `number` | `50` | La dimensione delle righe non ancora misurate, in punti, lungo l'asse della lista. Stime vicine al valore reale rendono più accurati l'indicatore di scorrimento e `scrollToIndex`. |
| `numColumns` | `number` | `1` | Elementi per riga (liste verticali): una griglia. |
| `horizontal` | `boolean` | `false` | Scorre in orizzontale. |
| `inverted` | `boolean` | `false` | Dispone gli elementi a partire dalla fine, con l'elemento 0 per ultimo (stile chat); parte scorsa fino alla fine e mantiene la distanza dalla fine quando il contenuto cambia. |
| `stickyHeaderIndices` | `number[]` | | Elementi che restano fissati all'inizio dopo essere stati superati con lo scorrimento (una colonna, non invertita). |
| `header` | `ListSlot` | | Renderizzato prima degli elementi. |
| `footer` | `ListSlot` | | Renderizzato dopo gli elementi. |
| `empty` | `ListSlot` | | Mostrato al posto degli elementi quando `each` è vuoto. |
| `separator` | `ListSlot` | | Renderizzato tra gli elementi (una colonna). |
| `keyExtractor` | `(item: T, index: number) => string` | `item.key`, `item.id` o l'indice | La chiave di un elemento nei token di visibilità. |
| `initialScrollIndex` | `number` | | Scorre fino a questo elemento prima del primo frame. |
| `contentStyle` | `ListContentStyle` | | Padding e spaziature del contenuto: `padding`, `paddingHorizontal`, `paddingVertical`, `paddingTop`, `paddingRight`, `paddingBottom`, `paddingLeft`, `gap`, `rowGap`, `columnGap` (numeri). |
| `contentClass` | `string` | | Padding e spaziature del contenuto come classi (`p-*`, `gap-*`); `contentStyle` ha la precedenza su di esse. |
| `style` | `StyleProp<ViewStyle>` | | Lo stile della lista stessa (assegnale una dimensione: `flex: 1` o un'altezza). |
| `testID` | `string` | | L'id con cui i test UI trovano la scroll view della lista (`nsh test` di `id:`, XCUITest, UI Automator). |
| `ref` | `ListRef \| ((node: ListRef) => void)` | | Vedi [metodi del ref](#ref-methods). |

`ListSlot` è un componente (`Header`) oppure un elemento (`<Header />`).

<a id="loading-refreshing-and-viewability"></a>

### Caricamento, aggiornamento e visibilità

| Prop | Tipo | Predefinito | Descrizione |
|---|---|---|---|
| `onLoadMore` | `() => void` | | Chiamata quando la fine si trova entro `loadMoreThreshold` viewport: carica altri elementi. |
| `loadMoreThreshold` | `number` | `1` | Quanto vicino alla fine (in lunghezze di viewport) scatta `onLoadMore`. |
| `onLoadMoreAtStart` | `() => void` | | Chiamata quando l'inizio si trova entro `loadMoreAtStartThreshold` viewport dopo che l'utente o un comando di scorrimento ha spostato la lista: carica ciò che viene prima del primo elemento. |
| `loadMoreAtStartThreshold` | `number` | `1` | Quanto vicino all'inizio (in lunghezze di viewport) scatta `onLoadMoreAtStart`. |
| `refreshing` | `boolean` | | Lo spinner del pull-to-refresh è visibile. |
| `onRefresh` | `() => void` | | Abilita il pull to refresh; imposta `refreshing` mentre carichi. |
| `refreshIndicator` | `{ height: number }` | | L'app disegna un proprio indicatore di pull-to-refresh, alto `height`, al posto dello spinner. |
| `pullValue` | `AnimatedValue` | | Riceve di quanto la lista viene trascinata oltre il suo bordo superiore, per quell'indicatore. |
| `onViewableItemsChange` | `(info: { viewableItems: ViewToken<T>[]; changed: ViewToken<T>[] }) => void` | | Elementi che sono diventati visibili o hanno smesso di esserlo. |
| `viewabilityConfig` | `ViewabilityConfig` | | Quando un elemento viene considerato visibile. |

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

### Scorrimento

| Prop | Tipo | Predefinito | Descrizione |
|---|---|---|---|
| `scrollbar` | `boolean \| ScrollbarTheme` | `true` | L'indicatore di scorrimento è visibile: quello della piattaforma o la [barra integrata](../elements/scrollbar.md#built-in-bars) dell'app; un oggetto è un tema della view stessa. |
| `scrollable` | `boolean` | `true` | L'utente può scorrerla. |
| `bounces` | `boolean` | `true` | Overscroll oltre i bordi. |
| `pagingEnabled` | `boolean` | `false` | Si ferma a multipli della viewport. |
| `snapToInterval` | `number` | `0` | Si ferma a multipli di questa lunghezza (0: disattivato). |
| `snapToOffsets` | `number[]` | | Si ferma a questi offset. |
| `snapToAlignment` | `"start" \| "center" \| "end"` | `"start"` | Quale punto di un elemento si allinea alla viewport con `snapToInterval`. |
| `disableIntervalMomentum` | `boolean` | `false` | Un fling si sposta al massimo di un punto di snap. |
| `decelerationRate` | `"normal" \| "fast" \| number` | piattaforma | Quanto velocemente rallenta un fling (`0.998` / `0.99`, oppure la velocità mantenuta per millisecondo). |
| `contentInset` | `Partial<Edges>` | | Spazio attorno al contenuto. |
| `contentOffset` | `{ x?, y? }` | | Dove inizia. |
| `keyboardShouldPersistTaps` | `"never" \| "always" \| "handled" \| boolean` | `"never"` | Indica se un tap chiude la tastiera (`"never"`: il tap la chiude soltanto). |
| `keyboardDismissMode` | `"none" \| "on-drag" \| "interactive"` | `"none"` | Indica se il trascinamento chiude la tastiera. |
| `scrollEventThrottle` | `number` | | Millisecondi minimi tra gli eventi `onScroll` (comunque al massimo uno per frame). |
| `scrollValue` | `AnimatedValue` | | Un [valore animato](./nsh.md#animation) alimentato con l'offset di scorrimento (asse principale) sul thread UI, per effetti legati allo scorrimento. |

<a id="scroll-events"></a>

### Eventi di scorrimento

| Evento | Payload | Quando |
|---|---|---|
| `onScroll` | `ScrollEvent`: `{ offset, contentSize, size, zoomScale }` | Durante lo scorrimento. |
| `onScrollDragStart` | `{ offset }` | Inizia un trascinamento. |
| `onScrollDragEnd` | `{ offset }` | Il dito si solleva. |
| `onMomentumStart` | `{ offset }` | Inizia uno scorrimento inerziale dopo il trascinamento. |
| `onMomentumEnd` | `{ offset }` | Lo scorrimento inerziale termina (anche quando un nuovo trascinamento lo interrompe). |
| `onScrollEnd` | `{ offset }` | Lo scorrimento si è fermato. |

Le liste accettano anche le props accettate da ogni elemento ([props comuni](../elements/index.md)).

<a id="ref-methods"></a>

## Metodi del ref

Il `ref` di una lista riceve un `ListRef`, con questi metodi oltre a quelli di `ViewRef`:

| Metodo | Descrizione |
|---|---|
| `scrollToIndex({ index, animated?, viewPosition?, viewOffset? })` | Porta in vista l'elemento `index`. `viewPosition` lo posiziona: `0` all'inizio della viewport (predefinito), `0.5` al centro, `1` alla fine; `viewOffset` lo sposta ulteriormente. Risolto in modo nativo con le dimensioni delle righe misurate (o stimate). |
| `scrollToOffset({ offset, animated? })` | Scorre fino a un offset del contenuto lungo l'asse della lista. |
| `scrollToEnd({ animated? })` | Scorre fino alla fine del contenuto (l'inizio di una lista invertita). |
| `scrollTo({ x?, y?, animated? })` | Scorre fino a un offset. |

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

## Esempi

Una chat: il messaggio più recente in basso, i messaggi più vecchi caricati mentre scorri verso l'alto.

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

La metà di `ListProps` relativa a dati e righe: ciò che passi a un componente tuo che dispone da sé una lista, ad esempio una lista di impostazioni che incapsula `List` con il proprio padding e i propri divisori.
