---
title: "List"
description: "La lista virtualizzata con riciclo delle celle: righe, colonne, intestazioni fisse, liste invertite per le chat, visibilità degli elementi e scorrimento fino a un elemento."
order: 50
group: primitives
demo: el-list
source_hash: 6e5480c9dd9e1df4
---

# Lista

`List` mostra dati lunghi o illimitati. Esistono solo le righe vicine al viewport: man mano che l'utente scorre, le righe che escono vengono riciclate per quelle che entrano. Quali righe esistono, le loro posizioni, le colonne, gli header sticky e la viewability sono tutti calcolati nativamente, quindi scorrere una lista di migliaia di elementi costa quanto una di venti. In Rust se ne crea una con `virtual_list(count, |at| row)`, in TSX con `<List>` da `nsh`.

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

In TSX, `List` è generico: `List<T>` verifica che `each` e la funzione di riga concordino sul tipo di elemento, che TypeScript deduce da `each` (vedi la [List API](../modules/nsh-list.md)). In Rust, `virtual_list` riceve il numero di righe (un valore, un signal o una closure: la lista cresce e si riduce sul posto) e la funzione che costruisce la riga in un dato `Position`; le righe leggono i dati del componente tramite `at.index()`.

Per una lista breve in cui tutte le righe devono esistere (una pagina di impostazioni, un form), un [`Each`](./control-flow.md) dentro una [scroll view](./scroll.md) è più semplice. Per una lista con lo stile di una tabella raggruppata, vedi [una lista in stile impostazioni](../docs/lists.md#a-settings-style-list). La [guida alle liste](../docs/lists.md) tratta i pattern: caricamento infinito, chat, sezioni.

<a id="rows-are-recycled"></a>

## Le righe vengono riciclate

La funzione di riga viene eseguita una volta per cella, non una volta per elemento. Quando una cella viene riutilizzata per un altro elemento, la sua posizione cambia (TSX: gli accessor `item()` e `index()`; Rust: `at.index()`) e tutto ciò che la legge si aggiorna:

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

Quindi mantieni lo stato di ogni elemento nei tuoi dati (indicizzato per id), non in signal creati dentro la funzione di riga: un signal di questo tipo resta legato alla cella e compare su un altro elemento.

Le celle in attesa del loro prossimo elemento vengono nascoste quando la loro riga non esiste più o è mostrata da un'altra cella, così screen reader, tocchi e test UI incontrano ogni riga una sola volta.

## Props

| Prop | Rust | Tipo | Predefinito | Descrizione |
|---|---|---|---|---|
| `each` | `virtual_list(count, ..)` | `readonly T[]` | | Gli elementi. |
| `children` | `virtual_list(.., \|at\| row)` | `(item: () => T, index: () => number) => JSX.Element` | | Renderizza una riga. |
| `estimatedItemSize` | `.estimated_item_size(px(..))` | `number` | `50` | La dimensione degli elementi non ancora misurati, in punti. Stime vicine al valore reale mantengono stabile la barra di scorrimento. |
| `horizontal` | `.horizontal()` | `boolean` | `false` | Scorre in orizzontale. |
| `viewport` | `.viewport(ListViewport::..)` | `"own" \| "parent"` | `"own"` | `"own"`: la lista scorre in una scroll view propria. `"parent"`: si estende per tutta la sua lunghezza nel layout del genitore e renderizza le righe vicine al viewport della scroll view circostante, che la fa scorrere insieme al resto della pagina (vedi [liste in una pagina](../docs/lists.md#lists-in-a-page-viewportparent)). Viene scelto quando la lista è creata. |
| `numColumns` | `.columns(n)` | `number` | `1` | Elementi per riga (liste verticali). |
| `inverted` | `.inverted()` | `boolean` | `false` | Disposta a partire dalla fine, con l'elemento 0 per ultimo (stile chat): parte scorsa fino alla fine e mantiene la distanza dalla fine al variare del contenuto. |
| `maintainVisibleContentPosition` | `.follow_end(px(threshold))` | `{ autoscrollToBottomThreshold?: number }` | | Per le liste non invertite: alla fine del contenuto, o entro quel numero di punti da essa, la lista resta alla fine quando il contenuto cresce o il viewport si restringe; se è scorsa più in alto, il contenuto visibile resta fermo. |
| `stickyHeaderIndices` | `.sticky_header_indices([..])` | `number[]` | | Elementi che restano agganciati all'inizio quando vengono superati dallo scorrimento (una colonna, non invertita). |
| `contentStyle` | `.content_padding(..)`, `.content_padding_x(..)`, `.row_gap(..)`, `.column_gap(..)`, … | `ListContentStyle` | | Padding e gap del contenuto, in punti: `padding`, `paddingHorizontal`, `paddingVertical`, `paddingTop`, `paddingRight`, `paddingBottom`, `paddingLeft`, `gap`, `rowGap`, `columnGap`. |
| `contentClass` | | `string` | | Padding e gap del contenuto come classi (`p-*`, `gap-*`); `contentStyle` ha la precedenza su di esse. |
| `header` | `.header(el)` | `ListSlot` | | Prima degli elementi: un componente (`Header`) o un elemento (`<Header />`). |
| `footer` | `.footer(el)` | `ListSlot` | | Dopo gli elementi. |
| `empty` | `.empty(el)` | `ListSlot` | | Mostrato al posto degli elementi mentre `each` è vuoto. |
| `separator` | `.separator(\|\| el)` | `ListSlot` | | Tra gli elementi (una colonna). |
| `initialScrollIndex` | `.initial_scroll_index(i)` | `number` | | Scorre fino a questo elemento prima del primo frame. |
| `keyExtractor` | `.keys(\|\| ids)` | `(item: T, index: number) => string` | `item.key`, `item.id` o l'indice | La chiave di un elemento nei token di viewability. In Rust, le identità delle righe, così le righe mantengono le loro celle e dimensioni quando altre righe compaiono o scompaiono prima di esse. |
| `onLoadMore` | `.on_load_more(..)` | `() => void` | | La fine è vicina: carica altri elementi. |
| `loadMoreThreshold` | `.load_more_threshold(viewports)` | `number` | `1` | Quanto vicino alla fine (in viewport) scatta `onLoadMore`. |
| `onLoadMoreAtStart` | `.on_load_more_at_start(..)` | `() => void` | | L'inizio è vicino, dopo che l'utente o un comando di scorrimento ha mosso la lista: carica ciò che viene prima del primo elemento. |
| `loadMoreAtStartThreshold` | `.load_more_at_start_threshold(viewports)` | `number` | `1` | Quanto vicino all'inizio (in viewport) scatta `onLoadMoreAtStart`. |
| `onViewableItemsChange` | `.on_viewable_items_change(..)` | `(info: { viewableItems: ViewToken<T>[]; changed: ViewToken<T>[] }) => void` | | Alcuni elementi sono diventati visibili (viewable) o hanno smesso di esserlo. |
| `viewabilityConfig` | `.viewability(..)`, `.minimum_view_time(..)` | `ViewabilityConfig` | | Quando gli elementi contano come visibili (vedi sotto). |
| `refreshing` | `.refreshing(..)` | `boolean` | | Lo spinner del pull-to-refresh è mostrato. |
| `onRefresh` | `.on_refresh(..)` | `() => void` | | L'utente ha trascinato per aggiornare. |
| `refreshIndicator` | `.refresh_indicator(Some(height))` | `{ height: number }` | | L'app disegna un proprio indicatore, alto `height` punti: lo spinner della piattaforma è nascosto, un trascinamento avvia l'aggiornamento una volta raggiunto `height`, e durante l'aggiornamento `height` restano liberi sopra il contenuto. Un'altezza pari o inferiore a 0 equivale a nessun indicatore. |
| `pullValue` | `.pull_value(&value)` | `AnimatedValue` | | Un valore animato alimentato con quanto la lista è trascinata oltre il suo bordo superiore (0 a riposo, in crescita con il trascinamento; lo spazio mantenuto sopra il contenuto durante l'aggiornamento: `height` con `refreshIndicator`), per l'indicatore dell'app. |
| `scrollbar` | `.scrollbar(..)` | `boolean \| ScrollbarTheme` | `true` | L'indicatore di scorrimento è mostrato: quello della piattaforma, oppure la [barra integrata](./scrollbar.md#built-in-bars) dell'app una volta che questa ha impostato un tema; un oggetto è un tema proprio della vista. Su desktop e nei browser desktop una vista orizzontale lo mantiene: è la barra di scorrimento del mouse. |
| `scrollValue` | `.scroll_value(&value)` | `AnimatedValue` | | Un valore animato alimentato con l'offset di scorrimento, per animazioni legate allo scorrimento. |
| `keyboardDismissMode` | `.keyboard_dismiss_mode(..)` | `"none" \| "on-drag" \| "interactive"` | `"none"` | Indica se il trascinamento chiude la tastiera. |
| `style` | metodi `Styled` | `StyleProp<ViewStyle>` | | Lo stile proprio della lista (richiede una dimensione definita: `flex: 1` o un'altezza). |
| `testID` | `.test_id(id)` | `string` | | L'id con cui i test UI trovano la scroll view della lista (`nsh test` di `id:`, XCUITest, UI Automator). |
| `ref` | `.element_ref(&handle)` | `ListRef \| (node: ListRef) => void` | | Il ref della lista (vedi [metodi del ref](#ref-methods)). |

Le liste accettano anche le prop di scorrimento di [`Scroll`](./scroll.md#scrolling) (i metodi `Scrollable` in Rust):
`pagingEnabled`, `snapToInterval`, `snapToOffsets`, `snapToAlignment`, `disableIntervalMomentum`, `decelerationRate`,
`bounces`, `contentInset`, `contentOffset`, `keyboardShouldPersistTaps`, `scrollEventThrottle` e `scrollable`.
Le liste mantengono la propria scala.

Le prop accettate da ogni elemento ([prop comuni](./index.md#common-props)) vengono passate così come sono alla scroll view della lista:
`testID`, `accessibilityLabel` e le altre prop di accessibilità, gli stili, `onLayout`, le prop di tocco e di responder.
I test UI trovano una lista tramite il suo `testID` come trovano qualsiasi vista.

`ViewabilityConfig` (Rust: `Viewability { item_visible_threshold, view_area_coverage_threshold }` e `.minimum_view_time(..)`):

| Campo | Tipo | Descrizione |
|---|---|---|
| `itemVisibleThreshold` | `number` | Quanta parte di un elemento deve essere visibile, da 0 a 1. |
| `viewAreaCoverageThreshold` | `number` | Quanta parte del viewport un elemento deve coprire, da 0 a 1. Senza nessuna delle due soglie, conta qualsiasi pixel visibile. |
| `minimumViewTime` | `number` | Millisecondi per cui gli elementi devono restare visibili prima di essere segnalati. |

`ViewToken<T>` è `{ item, key, index, isViewable }`. Il listener di Rust riceve `ViewableItems`: `indices()` è l'intervallo di righe visibili, `changed()` le righe comparse o scomparse.

<a id="events"></a>

## Eventi

| Evento | Rust | Payload | Quando |
|---|---|---|---|
| `onScroll` | `.on_scroll` | `ScrollEvent` | L'offset è cambiato. |
| `onScrollDragStart` / `onScrollDragEnd` | `.on_scroll_drag_start` / `.on_scroll_drag_end` | `{ offset }` | Il trascinamento è iniziato / terminato. |
| `onMomentumStart` / `onMomentumEnd` | `.on_momentum_start` / `.on_momentum_end` | `{ offset }` | Uno scivolamento (glide) è iniziato / terminato. |
| `onScrollEnd` | `.on_scroll_end` | `{ offset }` | Lo scorrimento si è fermato. |
| `onLoadMore` | `.on_load_more` | nessuno | Entro `loadMoreThreshold` viewport dalla fine. |
| `onLoadMoreAtStart` | `.on_load_more_at_start` | nessuno | Entro `loadMoreAtStartThreshold` viewport dall'inizio, una volta per avvicinamento dopo uno scorrimento. |
| `onViewableItemsChange` | `.on_viewable_items_change` | `{ viewableItems, changed }` (`ViewableItems`) | La viewability è cambiata. |
| `onRefresh` | `.on_refresh` | nessuno | Trascinato per aggiornare. |

<a id="ref-methods"></a>

## Metodi del ref

| Metodo | Rust | Descrizione |
|---|---|---|
| `scrollToIndex({ index, animated?, viewPosition?, viewOffset? })` | `scroll_to_index(index, percentage(0.5), px(0.0), animated)` | Scorre fino a rendere visibile l'elemento `index`. `viewPosition` lo posiziona: 0 all'inizio del viewport (predefinito), 0.5 al centro, 1 alla fine; `viewOffset` lo sposta ulteriormente. Risolto nativamente con le dimensioni correnti degli elementi (misurate o stimate). |
| `scrollToOffset({ offset, animated? })` | `scroll_to_offset(px(..), animated)` | Scorre fino a un offset lungo l'asse della lista. |
| `scrollToEnd({ animated? })` | `scroll_to_end(animated)` | Scorre fino alla fine del contenuto (l'inizio, per una lista invertita). |
| `scrollTo({ x?, y?, animated? })` | `scroll_to(point(..), animated)` | Scorre fino a un offset. |

<a id="examples"></a>

## Esempi

Una griglia con header e viewability:

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

Una chat:

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

L'elemento 0 è il messaggio più recente, disegnato in basso; i nuovi messaggi anteposti agli elementi compaiono senza spostare ciò che l'utente sta leggendo.

<a id="platform-notes"></a>

## Note sulle piattaforme

- L'inserimento di elementi sopra le righe visibili mantiene le righe visibili al loro posto su entrambe le piattaforme.
- Le liste orizzontali nei layout da destra a sinistra sono specchiate nativamente.
- Gli header sticky vengono fissati nativamente a ogni frame di scorrimento.
