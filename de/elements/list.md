---
title: "List"
description: "Die virtualisierte, recycelnde Liste: Zeilen, Spalten, fixierte Header, invertierte Chat-Listen, Sichtbarkeit und Scrollen zu Elementen."
order: 50
group: primitives
demo: el-list
source_hash: 6e5480c9dd9e1df4
---


# List

`List` zeigt lange oder unbegrenzte Daten an. Nur die Zeilen in der Nähe des Viewports existieren: Beim Scrollen werden Zeilen, die den Bereich verlassen, für die neu hinzukommenden Zeilen wiederverwendet. Welche Zeilen existieren, ihre Positionen, Spalten, Sticky Headers und die Viewability werden alle nativ berechnet, sodass das Scrollen einer Liste mit Tausenden Items nicht mehr kostet als das einer Liste mit zwanzig. Rust erzeugt eine Liste mit `virtual_list(count, |at| row)`, TSX mit `<List>` aus `nsh`.

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

In TSX ist `List` generisch: `List<T>` prüft, ob `each` und die Zeilenfunktion beim Item-Typ übereinstimmen, den TypeScript aus `each` ableitet (siehe die [List API](../modules/nsh-list.md)). In Rust nimmt `virtual_list` die Anzahl der Zeilen (einen Wert, ein Signal oder eine Closure: Die Liste wächst und schrumpft an Ort und Stelle) und die Funktion, die die Zeile an einem `Position` aufbaut; die Zeilen lesen die Daten der Komponente über `at.index()`.

Für eine kurze Liste, deren Zeilen alle existieren sollen (eine Einstellungsseite, ein Formular), ist ein [`Each`](./control-flow.md) in einer [Scroll View](./scroll.md) einfacher. Für eine Liste, die als gruppierte Tabelle gestaltet ist, siehe [eine Liste im Einstellungsstil](../docs/lists.md#a-settings-style-list). Der [Listen-Leitfaden](../docs/lists.md) behandelt Muster: unendliches Laden, Chat, Sections.

<a id="rows-are-recycled"></a>

## Zeilen werden wiederverwendet

Die Zeilenfunktion läuft einmal pro Zelle, nicht einmal pro Item. Wird eine Zelle für ein anderes Item wiederverwendet, ändert sich ihre Position (TSX: die Accessors `item()` und `index()`; Rust: `at.index()`), und alles, was sie liest, wird aktualisiert:

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

Halte deshalb den Zustand pro Item in deinen Daten (nach ID indiziert) und nicht in Signals, die innerhalb der Zeilenfunktion erzeugt werden: Ein solches Signal bleibt bei der Zelle und taucht bei einem anderen Item wieder auf.

Zellen, die auf ihr nächstes Item warten, werden ausgeblendet, sobald ihre Zeile verschwunden ist oder von einer anderen Zelle angezeigt wird, sodass Screenreader, Touch-Eingaben und UI-Tests jeder Zeile nur einmal begegnen.

## Props

| Prop | Rust | Typ | Standard | Beschreibung |
|---|---|---|---|---|
| `each` | `virtual_list(count, ..)` | `readonly T[]` | | Die Items. |
| `children` | `virtual_list(.., \|at\| row)` | `(item: () => T, index: () => number) => JSX.Element` | | Rendert eine Zeile. |
| `estimatedItemSize` | `.estimated_item_size(px(..))` | `number` | `50` | Die Größe noch nicht gemessener Items in Punkten. Gute Schätzungen halten die Scroll-Leiste ruhig. |
| `horizontal` | `.horizontal()` | `boolean` | `false` | Scrollt seitwärts. |
| `viewport` | `.viewport(ListViewport::..)` | `"own" \| "parent"` | `"own"` | `"own"`: Die Liste scrollt in einer eigenen Scroll View. `"parent"`: Sie liegt in voller Länge im Layout ihres Parents und rendert die Zeilen nahe dem Viewport der umgebenden Scroll View, die sie zusammen mit der übrigen Seite scrollt (siehe [Listen in einer Seite](../docs/lists.md#lists-in-a-page-viewportparent)). Wird beim Erstellen der Liste festgelegt. |
| `numColumns` | `.columns(n)` | `number` | `1` | Items pro Zeile (vertikale Listen). |
| `inverted` | `.inverted()` | `boolean` | `false` | Vom Ende her angeordnet, Item 0 zuletzt (Chat-Stil): Die Liste startet ans Ende gescrollt und behält ihren Abstand zum Ende, wenn sich der Inhalt ändert. |
| `maintainVisibleContentPosition` | `.follow_end(px(threshold))` | `{ autoscrollToBottomThreshold?: number }` | | Bei nicht invertierten Listen: Befindet sich die Liste am Ende des Inhalts oder innerhalb dieser Anzahl von Punkten davon, bleibt sie am Ende, wenn der Inhalt wächst oder der Viewport schrumpft; ist weiter nach oben gescrollt, bleibt der sichtbare Inhalt stehen. |
| `stickyHeaderIndices` | `.sticky_header_indices([..])` | `number[]` | | Items, die am Anfang haften bleiben, wenn sie weggescrollt werden (eine Spalte, nicht invertiert). |
| `contentStyle` | `.content_padding(..)`, `.content_padding_x(..)`, `.row_gap(..)`, `.column_gap(..)`, … | `ListContentStyle` | | Padding und Abstände des Inhalts in Punkten: `padding`, `paddingHorizontal`, `paddingVertical`, `paddingTop`, `paddingRight`, `paddingBottom`, `paddingLeft`, `gap`, `rowGap`, `columnGap`. |
| `contentClass` | | `string` | | Padding und Abstände des Inhalts als Klassen (`p-*`, `gap-*`); `contentStyle` hat Vorrang. |
| `header` | `.header(el)` | `ListSlot` | | Vor den Items: eine Komponente (`Header`) oder ein Element (`<Header />`). |
| `footer` | `.footer(el)` | `ListSlot` | | Nach den Items. |
| `empty` | `.empty(el)` | `ListSlot` | | Wird anstelle der Items angezeigt, solange `each` leer ist. |
| `separator` | `.separator(\|\| el)` | `ListSlot` | | Zwischen den Items (eine Spalte). |
| `initialScrollIndex` | `.initial_scroll_index(i)` | `number` | | Scrollt vor dem ersten Frame zu diesem Item. |
| `keyExtractor` | `.keys(\|\| ids)` | `(item: T, index: number) => string` | `item.key`, `item.id` oder der Index | Der Schlüssel eines Items in Viewability-Tokens. In Rust die Identitäten der Zeilen, sodass Zeilen ihre Zellen und Größen behalten, wenn davor Zeilen hinzukommen oder wegfallen. |
| `onLoadMore` | `.on_load_more(..)` | `() => void` | | Das Ende ist nah: weitere Items laden. |
| `loadMoreThreshold` | `.load_more_threshold(viewports)` | `number` | `1` | Wie nah am Ende (in Viewports) `onLoadMore` ausgelöst wird. |
| `onLoadMoreAtStart` | `.on_load_more_at_start(..)` | `() => void` | | Der Anfang ist nah, nachdem der Nutzer oder ein Scroll-Befehl die Liste bewegt hat: lädt, was vor dem ersten Item kommt. |
| `loadMoreAtStartThreshold` | `.load_more_at_start_threshold(viewports)` | `number` | `1` | Wie nah am Anfang (in Viewports) `onLoadMoreAtStart` ausgelöst wird. |
| `onViewableItemsChange` | `.on_viewable_items_change(..)` | `(info: { viewableItems: ViewToken<T>[]; changed: ViewToken<T>[] }) => void` | | Items sind viewable geworden oder nicht mehr viewable. |
| `viewabilityConfig` | `.viewability(..)`, `.minimum_view_time(..)` | `ViewabilityConfig` | | Wann Items als viewable gelten (siehe unten). |
| `refreshing` | `.refreshing(..)` | `boolean` | | Der Pull-to-refresh-Spinner wird angezeigt. |
| `onRefresh` | `.on_refresh(..)` | `() => void` | | Der Nutzer hat zum Aktualisieren gezogen. |
| `refreshIndicator` | `.refresh_indicator(Some(height))` | `{ height: number }` | | Die App zeichnet ihren eigenen Indikator mit einer Höhe von `height` Punkten: Der Spinner der Plattform wird ausgeblendet, ein Zug löst die Aktualisierung aus, sobald er `height` erreicht, und während der Aktualisierung bleibt `height` über dem Inhalt frei. Eine Höhe von 0 oder weniger bedeutet keinen Indikator. |
| `pullValue` | `.pull_value(&value)` | `AnimatedValue` | | Ein animierter Wert, der mit dem Betrag gespeist wird, um den die Liste über ihren Anfang hinaus gezogen wird (0 in Ruhe, wächst mit dem Zug; der Platz, der während der Aktualisierung über dem Inhalt freigehalten wird: `height` mit `refreshIndicator`), für den Indikator der App. |
| `scrollbar` | `.scrollbar(..)` | `boolean \| ScrollbarTheme` | `true` | Der Scroll-Indikator wird angezeigt: der der Plattform oder, sobald die App ein Theme gesetzt hat, die [integrierte Leiste](./scrollbar.md#built-in-bars) der App; ein Objekt ist ein eigenes Theme der View. Auf dem Desktop und in Desktop-Browsern behält eine horizontale View ihn: Er ist die Scroll-Leiste der Maus. |
| `scrollValue` | `.scroll_value(&value)` | `AnimatedValue` | | Ein animierter Wert, der mit dem Scroll-Offset gespeist wird, für scrollgekoppelte Animationen. |
| `keyboardDismissMode` | `.keyboard_dismiss_mode(..)` | `"none" \| "on-drag" \| "interactive"` | `"none"` | Ob Ziehen die Tastatur schließt. |
| `style` | `Styled`-Methoden | `StyleProp<ViewStyle>` | | Der eigene Stil der Liste (sie braucht eine begrenzte Größe: `flex: 1` oder eine Höhe). |
| `testID` | `.test_id(id)` | `string` | | Die ID, über die UI-Tests die Scroll View der Liste finden (`id:` von `nsh test`, XCUITest, UI Automator). |
| `ref` | `.element_ref(&handle)` | `ListRef \| (node: ListRef) => void` | | Die Ref der Liste (siehe [Ref-Methoden](#ref-methods)). |

Listen akzeptieren außerdem die Scroll-Props von [`Scroll`](./scroll.md#scrolling) (in Rust die `Scrollable`-Methoden):
`pagingEnabled`, `snapToInterval`, `snapToOffsets`, `snapToAlignment`, `disableIntervalMomentum`, `decelerationRate`,
`bounces`, `contentInset`, `contentOffset`, `keyboardShouldPersistTaps`, `scrollEventThrottle` und `scrollable`.
Listen behalten ihre Skalierung.

Die Props, die jedes Element akzeptiert ([gemeinsame Props](./index.md#common-props)), gehen unverändert an die Scroll View der Liste:
`testID`, `accessibilityLabel` und die übrigen Accessibility-Props, die Stile, `onLayout`, Touch- und Responder-Props.
UI-Tests finden eine Liste über ihre `testID` wie jede andere View.

`ViewabilityConfig` (Rust: `Viewability { item_visible_threshold, view_area_coverage_threshold }` und `.minimum_view_time(..)`):

| Feld | Typ | Beschreibung |
|---|---|---|
| `itemVisibleThreshold` | `number` | Wie viel eines Items sichtbar sein muss, von 0 bis 1. |
| `viewAreaCoverageThreshold` | `number` | Wie viel des Viewports ein Item abdecken muss, von 0 bis 1. Ohne einen der beiden Schwellenwerte zählt jeder sichtbare Pixel. |
| `minimumViewTime` | `number` | Millisekunden, die Items viewable bleiben müssen, bevor sie gemeldet werden. |

`ViewToken<T>` ist `{ item, key, index, isViewable }`. Der Listener in Rust erhält `ViewableItems`: `indices()` ist der Bereich der viewable Zeilen, `changed()` die Zeilen, die hinzugekommen oder weggefallen sind.

## Events

| Event | Rust | Payload | Wann |
|---|---|---|---|
| `onScroll` | `.on_scroll` | `ScrollEvent` | Der Offset hat sich geändert. |
| `onScrollDragStart` / `onScrollDragEnd` | `.on_scroll_drag_start` / `.on_scroll_drag_end` | `{ offset }` | Das Ziehen hat begonnen / aufgehört. |
| `onMomentumStart` / `onMomentumEnd` | `.on_momentum_start` / `.on_momentum_end` | `{ offset }` | Ein Gleiten hat begonnen / aufgehört. |
| `onScrollEnd` | `.on_scroll_end` | `{ offset }` | Das Scrollen ist zur Ruhe gekommen. |
| `onLoadMore` | `.on_load_more` | keine | Innerhalb von `loadMoreThreshold` Viewports vor dem Ende. |
| `onLoadMoreAtStart` | `.on_load_more_at_start` | keine | Innerhalb von `loadMoreAtStartThreshold` Viewports vom Anfang, einmal pro Annäherung nach einem Scrollvorgang. |
| `onViewableItemsChange` | `.on_viewable_items_change` | `{ viewableItems, changed }` (`ViewableItems`) | Die Viewability hat sich geändert. |
| `onRefresh` | `.on_refresh` | keine | Zum Aktualisieren gezogen. |

<a id="ref-methods"></a>

## Ref-Methoden

| Methode | Rust | Beschreibung |
|---|---|---|
| `scrollToIndex({ index, animated?, viewPosition?, viewOffset? })` | `scroll_to_index(index, percentage(0.5), px(0.0), animated)` | Scrollt Item `index` in den sichtbaren Bereich. `viewPosition` positioniert es: 0 am Anfang des Viewports (Standard), 0.5 in der Mitte, 1 am Ende; `viewOffset` verschiebt es weiter. Wird nativ mit den aktuellen (gemessenen oder geschätzten) Item-Größen aufgelöst. |
| `scrollToOffset({ offset, animated? })` | `scroll_to_offset(px(..), animated)` | Scrollt zu einem Offset entlang der Achse der Liste. |
| `scrollToEnd({ animated? })` | `scroll_to_end(animated)` | Scrollt zum Ende des Inhalts (bei einer invertierten Liste zum Anfang). |
| `scrollTo({ x?, y?, animated? })` | `scroll_to(point(..), animated)` | Scrollt zu einem Offset. |

<a id="examples"></a>

## Beispiele

Ein Grid mit Header und Viewability:

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

Ein Chat:

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

Item 0 ist die neueste Nachricht und wird unten gezeichnet; Nachrichten, die den Items vorangestellt werden, erscheinen, ohne zu verschieben, was der Nutzer gerade liest.

<a id="platform-notes"></a>

## Hinweise zu Plattformen

- Werden Items oberhalb der sichtbaren Zeilen eingefügt, bleiben die sichtbaren Zeilen auf beiden Plattformen an ihrer Stelle.
- Horizontale Listen in Right-to-left-Layouts werden nativ gespiegelt.
- Sticky Headers werden nativ in jedem Scroll-Frame fixiert.
