---
title: "Liste"
description: "Liste lunghe e infinite in Rust e TSX - riciclo, identità delle righe, colonne, intestazioni fisse, liste invertite per chat, liste orizzontali, liste in una pagina, caricamento di altri elementi, visibilità e scorrimento fino a un elemento."
order: 40
group: ui
demo: guide-lists
source_hash: fb4ffb925cc99200
---

# Liste

Una lista (`virtual_list(..)` in Rust, `List` da `nsh` in TSX) renderizza dati molto lunghi su una scroll view nativa, creando solo le righe vicine allo schermo. Quali righe esistono, dove vanno, le colonne, gli header sticky e quali elementi sono visibili vengono calcolati nativamente; il tuo codice riempie le celle con il contenuto solo quando il lato nativo ne richiede una. Una lista di un milione di elementi costa circa quanto una di trenta.

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

In Rust, `virtual_list(count, row)` riceve il numero di righe (un valore, un signal o una closure) e una funzione che costruisce una riga a partire dalla sua posizione (`at.index()`); le righe leggono i tuoi dati tramite quell'indice. In TSX, `each` riceve gli elementi e la funzione di riga riceve l'elemento. Come una [scroll view](./scrolling.md), la lista è il viewport e ha bisogno di una dimensione dal suo genitore (`.flex_1()`, `flex: 1` oppure un'altezza).

<a id="how-recycling-works"></a>

## Come funziona il riciclo

La funzione di riga non viene chiamata una volta per elemento. Viene chiamata **una volta per cella**, e le celle vengono riutilizzate: quando una riga scorre molto lontano dallo schermo, la sua cella viene assegnata a un'altra riga e la sua posizione (`at.index()` in Rust, `item()` e `index()` in TSX) cambia. Tutto ciò che nella riga la legge si aggiorna sul posto, come con qualsiasi altro [signal](./reactivity.md).

Ne derivano due regole:

**Leggi la posizione nel punto in cui la usi.** Un valore copiato all'inizio della funzione di riga appartiene alla riga che la cella ha mostrato per prima.

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

**Mantieni lo stato per elemento nei tuoi dati, non nella riga.** Un signal creato dentro la riga appartiene alla cella e viaggia con essa verso l'elemento successivo. Memorizza "questa riga è espansa / selezionata / piace" negli elementi stessi o in un insieme indicizzato per id:

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

Le righe possono avere altezze diverse. Finché una riga non è stata misurata, la lista assume la dimensione stimata dell'elemento (50 punti per impostazione predefinita); passa un valore vicino alla tua riga tipica, in modo che l'indicatore di scorrimento e i salti verso elementi lontani siano accurati fin dall'inizio.

<a id="changing-the-data"></a>

## Modificare i dati

In Rust, fornisci il conteggio come signal o come closure (`move || posts.with(Vec::len)`): la lista cresce e si restringe sul posto. Le righe aggiunte o rimosse alla fine non richiedono altro; quando le righe compaiono e scompaiono altrove, fornisci le loro identità con `.keys(move || posts.with(|p| p.iter().map(|p| p.id).collect::<Vec<_>>()))`, e la lista mantiene l'inizio e la fine in comune e tratta ciò che sta nel mezzo come rimosso e inserito.

In TSX, passa un nuovo array per cambiare gli elementi: `posts.set([...posts(), ...more])`. La lista confronta il vecchio e il nuovo array **per identità degli elementi** (`===`), mantiene l'inizio e la fine in comune e tratta ciò che sta nel mezzo come rimosso e inserito.

In entrambi i casi, le misurazioni restano associate alle rispettive righe e, quando vengono inserite righe sopra quelle sullo schermo, le righe visibili restano dove sono invece di saltare.

- In TSX, aggiorna in modo immutabile: un nuovo array, riutilizzando gli oggetti elemento invariati. Modificare l'array sul posto (`push`) non viene rilevato.
- Un elemento modificato dovrebbe essere un nuovo oggetto (`{ ...post, title }`), così la sua riga mostra il cambiamento.
- Aggiungere in testa (nuovi messaggi, un feed aggiornato) mantiene la posizione dell'utente.

`keyExtractor` assegna un nome agli elementi nei token di visibilità (vedi sotto); per impostazione predefinita la chiave è `item.key`, poi `item.id`, poi l'indice. Non influisce su come le modifiche vengono abbinate in TSX, che avviene sempre per identità.

## Props

Una lista accetta tutte le prop di scorrimento della scroll view che hanno senso per una lista (`pagingEnabled`, `snapToInterval`, `snapToOffsets`, `snapToAlignment`, `decelerationRate`, `disableIntervalMomentum`, `bounces`, `scrollable`, `contentInset`, `contentOffset`, `keyboardShouldPersistTaps`, `keyboardDismissMode`, `scrollEventThrottle`, `onScroll`, `onScrollDragStart`, `onScrollDragEnd`, `onMomentumStart`, `onMomentumEnd`, `onScrollEnd`, `scrollValue`, `pullValue`; in Rust gli stessi metodi di una scroll view), descritte in [Scrolling](./scrolling.md). Le liste mantengono una scala di 1. Le sue prop specifiche:

| Prop | Rust | Tipo | Default | Descrizione |
|---|---|---|---|---|
| `each` | `virtual_list(count, ..)` | `readonly T[]` | | Gli elementi; in Rust, il numero di righe. |
| `children` | `virtual_list(.., row)` | `(item: () => T, index: () => number) => JSX.Element` | | Renderizza una cella; chiamata una volta per cella, vedi [riciclo](#how-recycling-works). |
| `estimatedItemSize` | `.estimated_item_size(px(..))` | `number` | `50` | La dimensione delle righe non ancora misurate, in punti. |
| `horizontal` | `.horizontal()` | `boolean` | `false` | Scorre lateralmente. |
| `viewport` | `.viewport(ListViewport::..)` | `"own" \| "parent"` | `"own"` | `"own"`: la lista scorre in una scroll view propria. `"parent"`: si estende per tutta la sua lunghezza nella scroll view che la circonda, che la fa scorrere insieme al resto della pagina (vedi [liste in una pagina](#lists-in-a-page-viewportparent)). Viene scelto quando la lista viene creata. |
| `numColumns` | `.columns(n)` | `number` | `1` | Elementi per riga (liste verticali). |
| `inverted` | `.inverted()` | `boolean` | `false` | Elemento 0 in basso (chat); parte dalla fine e mantiene la distanza dalla fine. |
| `maintainVisibleContentPosition` | `.follow_end(px(..))` | `{ autoscrollToBottomThreshold?: number }` | | Una lista non invertita resta alla fine finché si trova entro quel numero di punti da essa, mentre il contenuto cresce (vedi sotto). |
| `stickyHeaderIndices` | `.sticky_header_indices(..)` | `number[]` | | Elementi che restano fissati in alto una volta scorsi oltre (una colonna, non invertita). |
| `stickyHeaderOffset` | `.sticky_header_offset(px(..))`, `.bind_sticky_header_offset(&node)` | `number \| AnimatedNode` | `0` | A che distanza sotto il bordo superiore restano fissati gli elementi sticky, come `top` in CSS `position: sticky`; il contenuto continua a scorrere sotto lo spazio sopra di essi. Un valore animato li sposta a ogni frame. |
| `contentStyle` | `.content_padding(..)`, `.content_padding_x(..)`, ..., `.row_gap(..)`, `.column_gap(..)` | `{ padding*, gap, rowGap, columnGap }` | | Padding e gap del contenuto, solo numeri. |
| `contentClass` | | `string` | | Lo stesso delle classi (`p-*`, `gap-*`); `contentStyle` ha la precedenza su di esse. |
| `header` | `.header(..)` | componente o elemento | | Prima degli elementi. |
| `footer` | `.footer(..)` | componente o elemento | | Dopo gli elementi. |
| `empty` | `.empty(..)` | componente o elemento | | Mostrato al posto degli elementi quando non ce ne sono. |
| `separator` | `.separator(\|\| ..)` | componente o elemento | | Tra gli elementi (una colonna). |
| `initialScrollIndex` | `.initial_scroll_index(i)` | `number` | | Scorre fino a questo elemento prima del primo frame. |
| `onLoadMore` | `.on_load_more(..)` | `() => void` | | La fine è vicina (vedi sotto). |
| `loadMoreThreshold` | `.load_more_threshold(..)` | `number` | `1` | Quanto vicino alla fine, in viewport, scatta `onLoadMore`. |
| `onLoadMoreAtStart` | `.on_load_more_at_start(..)` | `() => void` | | L'inizio è vicino, dopo uno scorrimento (vedi sotto). |
| `loadMoreAtStartThreshold` | `.load_more_at_start_threshold(..)` | `number` | `1` | Quanto vicino all'inizio, in viewport, scatta `onLoadMoreAtStart`. |
| `onViewableItemsChange` | `.on_viewable_items_change(..)` | `(info) => void` | | Alcuni elementi sono diventati visibili o hanno smesso di esserlo. |
| `viewabilityConfig` | `.viewability(..)`, `.minimum_view_time(..)` | `ViewabilityConfig` | | Quando gli elementi sono considerati visibili. |
| `keyExtractor` | `.keys(..)` | `(item, index) => string` | | La chiave nei token di visibilità; in Rust, le identità delle righe. |
| `refreshing` / `onRefresh` | `.refreshing(..)` / `.on_refresh(..)` | `boolean` / `() => void` | | Pull to refresh. |
| `refreshIndicator` | `.refresh_indicator(..)` | `{ height: number }` | | L'indicatore di pull-to-refresh dell'app, al posto dello spinner della piattaforma (vedi [Scrolling](./scrolling.md#an-indicator-of-your-own)). |
| `scrollbar` | `.scrollbar(..)` | `boolean \| ScrollbarTheme` | `true` | L'indicatore di scorrimento mostra: quello della piattaforma, oppure la [barra integrata](../elements/scrollbar.md#built-in-bars) dell'app una volta impostato un tema; un oggetto è un tema proprio della vista. Su desktop e nei browser desktop una vista orizzontale lo mantiene: è la barra di scorrimento del mouse. |
| `ref` | `.element_ref(&list)` | `ListRef` | | `scrollToIndex`, `scrollToOffset`, `scrollToEnd`, `scrollTo`. |

Gli slot header, footer ed empty accettano un elemento (in TSX anche un componente: `header={Header}`). Sono celle a sé stanti, mai riciclate, e sono reattivi come qualsiasi altro elemento.

<a id="columns-and-grids"></a>

## Colonne e griglie

`numColumns` (`.columns(n)`) dispone gli elementi in righe con quel numero di colonne; il padding del contenuto circonda il contenuto, con gap tra righe e colonne. Le righe di una griglia possono avere altezze diverse: ogni riga è alta quanto il suo elemento più alto.

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

## Header sticky

`stickyHeaderIndices` elenca gli elementi che restano fissati in alto nel viewport mentre il contenuto scorre oltre, finché il successivo elemento sticky non li spinge fuori. Le sezioni sono un'unica lista di elementi header e riga; gli indici degli header restano fissati. Il fissaggio avviene nativamente a ogni frame di scorrimento.

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

Poiché una cella può mostrare un header adesso e un nome più tardi, la riga decide cosa renderizzare con [`when` / `<If>`](../elements/control-flow.md), che cambia quando cambia la riga. Gli header sticky richiedono una sola colonna e una lista non invertita.

`stickyHeaderOffset` (`.sticky_header_offset(..)` in Rust) fa fermare gli header a quel numero di punti sotto il bordo superiore, come fa `top` in CSS `position: sticky`: sotto una barra traslucida alta 56 punti, `stickyHeaderOffset={56}` (`.sticky_header_offset(px(56.0))`) mantiene ogni header sotto la barra mentre le righe continuano a scorrere sotto di essa, e l'header successivo lo spinge fuori da lì. Un offset negativo lascia parte di un header fuori dalla vista.

L'offset può essere un [valore animato](./animation.md#animated-values) (`.bind_sticky_header_offset(&node)` in Rust): gli header lo seguono a ogni frame sul thread della UI, quindi restano sotto una barra che si muove. Con una barra che si nasconde quando il contenuto scorre verso il basso e ricompare quando scorre verso l'alto ([`diffClamp`](./animation.md#arithmetic-and-diffclamp)), gli header si fissano al suo bordo inferiore ovunque si trovi:

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

## Chat: liste invertite

`inverted` dispone la lista a partire dalla fine: l'elemento 0 è in basso, la lista parte scorsa fino alla fine e mantiene la distanza dalla fine mentre gli elementi cambiano. Tieni il messaggio più recente per primo; aggiungi in testa per aggiungerne uno, aggiungi in coda per caricare i più vecchi con `onLoadMore` (la "fine" di una lista invertita è la cima). Una chat aperta su un messaggio vecchio carica quelli più recenti con [`onLoadMoreAtStart`](#loading-at-the-start-onloadmoreatstart); con essa, la lista mantiene la distanza dal fondo mentre ci si trova e mantiene in posizione i messaggi sullo schermo quando si scorre verso l'alto.

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

`scroll_to_end(..)` / `scrollToEnd()` su una lista invertita scorre fino al suo inizio: il messaggio più recente.

<a id="following-the-end-of-a-list-that-is-not-inverted"></a>

### Seguire la fine di una lista non invertita

Anche una lista in ordine di lettura (dal più vecchio) può seguire la propria fine: con `.follow_end(px(40.0))` in Rust o `maintainVisibleContentPosition={{ autoscrollToBottomThreshold: 40 }}` in TSX, finché l'utente è alla fine (o entro 40 punti da essa), la lista resta alla fine mentre il contenuto cresce: una risposta in streaming nell'ultimo elemento, un nuovo messaggio aggiunto, la tastiera che riduce la lista. Se si è scorso più in alto, il contenuto visibile resta dov'è e il nuovo contenuto cresce sotto di esso. Gli elementi inseriti sopra quelli visibili non li spostano mai, con o senza l'opzione.

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

## Liste orizzontali

`horizontal` mette la lista di lato; le celle sono disposte all'altezza della lista. In combinazione con lo snapping crea un carosello di qualsiasi lunghezza:

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

Nelle lingue da destra a sinistra, le liste orizzontali partono da destra e procedono verso sinistra.

<a id="lists-in-a-page-viewportparent"></a>

## Liste in una pagina: viewport="parent"

Spesso una pagina scorre come un tutt'uno: un header, alcune card, poi una lista lunga e magari un'altra lista sotto di essa. Assegna alla lista `viewport="parent"` (`.viewport(ListViewport::Parent)` in Rust) e inseriscila in un `Scroll` insieme al resto della pagina: la lista si estende nella pagina per tutta la sua lunghezza e la scroll view della pagina la fa scorrere insieme a tutto il resto. Crea comunque solo le righe vicine al viewport della pagina e ricicla le loro celle, quindi una sola pagina può contenere più liste lunghe.

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

- La lista è lunga quanto le sue righe: la sua altezza (la sua larghezza, se laterale) deriva dal suo contenuto, come per una vista, e il suo padding, il bordo e i margini funzionano come su una vista.
- Le sue righe seguono la scroll view più vicina che la circonda lungo il suo asse, oppure lo schermo in cui si trova.
- La pagina mantiene in posizione ciò che stai leggendo, come fa un browser: le righe che cambiano dimensione interamente sopra il bordo superiore del viewport spostano la pagina della stessa quantità; finché l'inizio della lista è in vista, le righe che crescono spingono verso il basso ciò che sta sotto di loro.
- `scrollToIndex`, `scrollToEnd` e `initialScrollIndex` fanno scorrere la pagina fino alle righe della lista, all'interno del contenuto della pagina; `onLoadMore` scatta quando la fine della lista si avvicina al viewport, e `onViewableItemsChange` riporta le righe presenti nel viewport della pagina.
- `stickyHeaderIndices` e `stickyHeaderOffset` fissano le righe in cima alla pagina: un header di sezione resta in alto mentre le sue righe scorrono sotto di esso, finché il successivo non lo spinge fuori, e l'ultimo se ne va con la fine della sua lista.
- Il modo in cui la pagina scorre dipende dalla sua scroll view: imposta `onScroll` e gli altri eventi di scorrimento, `scrollValue`, `refreshing` / `onRefresh`, paging e snapping, `contentInset`, `scrollbar`, `scrollable` e `keyboardDismissMode` sul `Scroll`. Le liste invertite e `maintainVisibleContentPosition` sono funzionalità di una lista con un viewport proprio (`viewport="own"`, il valore predefinito).
- Il viewport viene scelto quando la lista viene creata: per cambiarlo, renderizza una nuova lista.

<a id="loading-more-onloadmore"></a>

## Caricare altro: onLoadMore

`onLoadMore` (`.on_load_more(..)`) scatta quando il viewport arriva entro `loadMoreThreshold` viewport dalla fine (1 per impostazione predefinita: una schermata di anticipo). Aggiungi la pagina successiva; la lista scatta di nuovo quando la nuova fine si avvicina.

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

Proteggiti dai caricamenti sovrapposti come sopra: la fine può essere segnalata di nuovo mentre una pagina è in arrivo.
<a id="loading-at-the-start-onloadmoreatstart"></a>

## Caricamento all'inizio: onLoadMoreAtStart

Una lista può anche aprirsi nel mezzo dei suoi dati: una chat aperta su un vecchio messaggio (un risultato di ricerca, la citazione di una risposta) mostra una pagina attorno a esso, con i messaggi più recenti ancora da caricare. `onLoadMoreAtStart` (`.on_load_more_at_start(..)`) viene attivato quando il viewport arriva entro `loadMoreAtStartThreshold` viewport dall'inizio (1 per impostazione predefinita), ovvero il lato dell'elemento 0: la parte superiore di una lista, la parte inferiore di una lista invertita. Anteponi la pagina: le righe visibili sullo schermo mantengono la loro posizione mentre la pagina arriva prima di esse (anche in una lista invertita, una volta che ci si è allontanati dal suo fondo), e la lista si attiva di nuovo al successivo avvicinamento, o subito se la pagina l'ha lasciata ancora vicino all'inizio.

Si attiva quando l'utente scorre fin lì o quando un comando di scorrimento porta la lista in quel punto (`initialScrollIndex` incluso), quindi una lista che si apre sul suo elemento più recente non richiede nulla, mentre una aperta con `initialScrollIndex` vicino al suo inizio richiede subito la pagina precedente.

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

Una volta caricato il messaggio più recente, interrompi il caricamento: i nuovi messaggi arrivano allora all'inizio, come in qualsiasi chat.

## Viewability

`onViewableItemsChange` (`.on_viewable_items_change(..)`) segnala quali elementi sono sullo schermo, per analytics, per la riproduzione automatica del video visibile o per contrassegnare i messaggi come letti. In TSX riceve `{ viewableItems, changed }`, array di token `{ item, key, index, isViewable }`; in Rust, `ViewableItems` con la prima e l'ultima riga visibile (`viewable`) e le righe il cui stato è cambiato (`changed()`). La viewability viene calcolata in modo nativo; il tuo codice viene informato solo dei cambiamenti.

| `viewabilityConfig` | Rust | Descrizione |
|---|---|---|
| `itemVisibleThreshold` | `Viewability { item_visible_threshold, .. }` | Quanta parte di un elemento deve essere visibile, da 0 a 1. |
| `viewAreaCoverageThreshold` | `Viewability { view_area_coverage_threshold, .. }` | Quanta parte del viewport deve coprire un elemento, da 0 a 1. |
| `minimumViewTime` | `.minimum_view_time(Duration)` | Millisecondi per cui un elemento deve restare visibile prima di essere segnalato. |

Senza una soglia, conta qualsiasi pixel visibile.

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

## Scorrimento da codice

Assegna un ref alla lista (`element_ref()` e `.element_ref(&list)` in Rust, `ref` in TSX):

| Rust | TSX | Descrizione |
|---|---|---|
| `scroll_to_index(index, view_position, view_offset, animated)` | `scrollToIndex({ index, animated?, viewPosition?, viewOffset? })` | Scorre fino a portare l'elemento `index` in vista. La posizione nella vista lo colloca: 0 all'inizio del viewport (predefinito), 0.5 al centro, 1 alla fine; l'offset della vista lo sposta ulteriormente. |
| `scroll_to_offset(offset, animated)` | `scrollToOffset({ offset, animated? })` | Scorre fino a un offset del contenuto lungo l'asse della lista. |
| `scroll_to_end(animated)` | `scrollToEnd({ animated? })` | Scorre fino alla fine del contenuto (l'inizio di una lista invertita). |
| `scroll_to(point, animated)` | `scrollTo({ x?, y?, animated? })` | Scorre fino a un offset, come in una scroll view. |

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

Lo scorrimento verso un indice (e verso la fine) viene risolto in modo nativo con le dimensioni note in quel momento: le righe misurate dove sono state misurate, la dimensione stimata altrove. La lista segue poi il proprio obiettivo mentre le righe attorno vengono misurate, così arriva esattamente a destinazione, finché l'utente non scorre o gli elementi non cambiano. Per aprire una lista su un elemento, usa `initialScrollIndex` (`.initial_scroll_index(..)`) anziché scorrere dopo il primo frame.

<a id="a-settings-style-list"></a>

## Una lista in stile impostazioni

L'aspetto di una lista è quello della tua app: la lista posiziona e ricicla le righe, mentre righe, divisori e superfici sono le tue view. Una lista raggruppata in stile impostazioni è una lista con padding, un separatore e la prima e l'ultima riga arrotondate. Crea un tuo componente e usalo ovunque l'app elenchi impostazioni:

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

## Note sulle prestazioni

- Ogni cella viene calcolata nel layout in modo indipendente, quindi lo scorrimento esegue il layout solo delle celle cambiate. Mantieni le righe poco profonde ed evita di leggere signal nelle righe che cambiano a ogni frame.
- Il lato nativo richiede le celle in batch, fino a diversi round per frame, uniti in un unico aggiornamento; un fling veloce associa molte celle in un solo frame senza una chiamata al tuo codice per ogni cella. Le righe Rust vengono associate nel core stesso, all'interno del commit che ne ha bisogno.
- Usa [`nsh test --trace` con uno step `scroll`](./testing-and-trace.md#scrolling) per misurare il costo per frame delle tue righe.

<a id="related"></a>

## Correlati

- [Elemento `List`](../elements/list.md): il riferimento.
- [Scrolling](./scrolling.md): le prop di scorrimento condivise da liste e scroll view.
- [Reactivity](./reactivity.md): perché le righe leggono la loro posizione nei binding.
- [Performance](./performance.md): misurare le liste.
