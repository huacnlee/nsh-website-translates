---
title: "List"
description: "List, eine virtualisierte und recycelnde Liste auf einer nativen Scroll View, mit allen Props, Events und Ref-Methoden."
order: 2.1
source_hash: 6aa08fac2fd24e8c
---


# List

`nsh` exportiert `List`: eine virtualisierte Liste auf einer nativen Scroll-View. Nur die Zeilen in der Nähe des Viewports existieren, und ihre Zellen werden beim Scrollen wiederverwendet. Welche Zeilen existieren, wo sie liegen, Spalten, Sticky Header und Viewability werden vollständig nativ berechnet. Das Scrollen einer Liste mit zehntausend Einträgen führt daher kein JS aus, außer den Row-Bindings, die sich ändern, wenn eine Zelle wiederverwendet wird.

```ts
import { List, type ListProps, type ViewToken, type ViewabilityConfig } from "nsh";
```

Siehe [Lists](../docs/lists.md) für die Anleitung und [`<List>`](../elements/list.md) für die Props des Elements.

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

### Zeilen werden recycelt

`children` ist eine Funktion, die **eine Zelle** rendert. Sie läuft einmal pro Zelle, nicht einmal pro Item: Wenn eine Zelle aus dem sichtbaren Bereich scrollt, wird sie für ein anderes Item wiederverwendet, und `item()` und `index()` (beides Accessors) ändern sich. Lies sie innerhalb von JSX-Ausdrücken (`{item().name}`), damit die Zelle bei der Wiederverwendung aktualisiert wird.

> [!WARNING]
> Halte keinen Zustand pro Item in Signals, die innerhalb der Row-Funktion erstellt werden: Die Zelle wird für andere Items wiederverwendet, und das Signal würde der Zelle folgen, nicht dem Item. Halte ihn stattdessen in deinen Daten, nach ID geschlüsselt (zum Beispiel ein Signal, das ein `Set` der ausgewählten IDs enthält).

## Props

`ListProps<T>` kombiniert die eigenen Props der Liste mit den Scrolling-Props, die sie mit `<Scroll>` teilt, und den Props, die jedes Element akzeptiert und die an die Scroll-View der Liste gehen.

<a id="data-and-rendering"></a>

### Daten und Rendering

| Prop | Typ | Standard | Beschreibung |
|---|---|---|---|
| `each` | `readonly T[]` | (erforderlich) | Die Items. Übergib den Wert eines Signals (`each={items()}`), um Änderungen zu folgen; werden Items oberhalb der sichtbaren Zeilen eingefügt, bleiben diese Zeilen an ihrer Position. |
| `children` | `(item: () => T, index: () => number) => JSX.Element` | (erforderlich) | Rendert eine Zeile (siehe oben). |
| `estimatedItemSize` | `number` | `50` | Die Größe noch nicht gemessener Zeilen in Punkten entlang der Achse der Liste. Gute Schätzwerte machen den Scroll-Indikator und `scrollToIndex` genauer. |
| `numColumns` | `number` | `1` | Items pro Zeile (vertikale Listen): ein Raster. |
| `horizontal` | `boolean` | `false` | Scrollt seitwärts. |
| `inverted` | `boolean` | `false` | Layoutet vom Ende aus, Item 0 zuletzt (Chat-Stil); startet zum Ende gescrollt und behält seinen Abstand zum Ende bei, wenn sich der Inhalt ändert. |
| `stickyHeaderIndices` | `number[]` | | Items, die am Anfang haften bleiben, wenn man an ihnen vorbeigescrollt ist (eine Spalte, nicht invertiert). |
| `header` | `ListSlot` | | Wird vor den Items gerendert. |
| `footer` | `ListSlot` | | Wird nach den Items gerendert. |
| `empty` | `ListSlot` | | Wird anstelle der Items angezeigt, solange `each` leer ist. |
| `separator` | `ListSlot` | | Wird zwischen den Items gerendert (eine Spalte). |
| `keyExtractor` | `(item: T, index: number) => string` | `item.key`, `item.id` oder der Index | Der Schlüssel eines Items in Viewability-Tokens. |
| `initialScrollIndex` | `number` | | Scrollt vor dem ersten Frame zu diesem Item. |
| `contentStyle` | `ListContentStyle` | | Padding und Abstände des Inhalts: `padding`, `paddingHorizontal`, `paddingVertical`, `paddingTop`, `paddingRight`, `paddingBottom`, `paddingLeft`, `gap`, `rowGap`, `columnGap` (Zahlen). |
| `contentClass` | `string` | | Padding und Abstände des Inhalts als Klassen (`p-*`, `gap-*`); `contentStyle` hat Vorrang vor ihnen. |
| `style` | `StyleProp<ViewStyle>` | | Der eigene Style der Liste (gib ihr eine Größe: `flex: 1` oder eine Höhe). |
| `testID` | `string` | | Die ID, über die UI-Tests die Scroll-View der Liste finden (`nsh test` `id:`, XCUITest, UI Automator). |
| `ref` | `ListRef \| ((node: ListRef) => void)` | | Siehe [Ref-Methoden](#ref-methods). |

`ListSlot` ist eine Komponente (`Header`) oder ein Element (`<Header />`).

<a id="loading-refreshing-and-viewability"></a>

### Laden, Aktualisieren und Viewability

| Prop | Typ | Standard | Beschreibung |
|---|---|---|---|
| `onLoadMore` | `() => void` | | Wird aufgerufen, wenn das Ende innerhalb von `loadMoreThreshold` Viewports kommt: mehr laden. |
| `loadMoreThreshold` | `number` | `1` | Wie nah am Ende (in Viewport-Längen) `onLoadMore` ausgelöst wird. |
| `onLoadMoreAtStart` | `() => void` | | Wird aufgerufen, wenn der Anfang innerhalb von `loadMoreAtStartThreshold` Viewports kommt, nachdem der Nutzer oder ein Scroll-Befehl die Liste bewegt hat: lädt, was vor dem ersten Item kommt. |
| `loadMoreAtStartThreshold` | `number` | `1` | Wie nah am Anfang (in Viewport-Längen) `onLoadMoreAtStart` ausgelöst wird. |
| `refreshing` | `boolean` | | Der Pull-to-Refresh-Spinner wird angezeigt. |
| `onRefresh` | `() => void` | | Aktiviert Pull-to-Refresh; setze `refreshing`, während du lädst. |
| `refreshIndicator` | `{ height: number }` | | Die App zeichnet anstelle des Spinners einen eigenen Pull-to-Refresh-Indikator der Höhe `height`. |
| `pullValue` | `AnimatedValue` | | Erhält für diesen Indikator, wie weit die Liste über ihren oberen Rand hinaus gezogen wird. |
| `onViewableItemsChange` | `(info: { viewableItems: ViewToken<T>[]; changed: ViewToken<T>[] }) => void` | | Items, die sichtbar wurden oder nicht mehr sichtbar sind. |
| `viewabilityConfig` | `ViewabilityConfig` | | Wann ein Item als sichtbar gilt. |

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

### Scrolling

| Prop | Typ | Standard | Beschreibung |
|---|---|---|---|
| `scrollbar` | `boolean \| ScrollbarTheme` | `true` | Der Scroll-Indikator wird angezeigt: der der Plattform oder die [integrierte Leiste](../elements/scrollbar.md#built-in-bars) der App; ein Objekt ist ein Theme für die eigene Leiste der View. |
| `scrollable` | `boolean` | `true` | Der Nutzer kann scrollen. |
| `bounces` | `boolean` | `true` | Overscroll über die Ränder hinaus. |
| `pagingEnabled` | `boolean` | `false` | Hält bei Vielfachen des Viewports an. |
| `snapToInterval` | `number` | `0` | Hält bei Vielfachen dieser Länge an (0: aus). |
| `snapToOffsets` | `number[]` | | Hält an diesen Offsets an. |
| `snapToAlignment` | `"start" \| "center" \| "end"` | `"start"` | Welcher Punkt eines Items mit dem Viewport ausgerichtet wird, bei `snapToInterval`. |
| `disableIntervalMomentum` | `boolean` | `false` | Ein Fling bewegt höchstens um einen Snap-Punkt. |
| `decelerationRate` | `"normal" \| "fast" \| number` | Plattform | Wie schnell ein Fling langsamer wird (`0.998` / `0.99` oder die pro Millisekunde beibehaltene Geschwindigkeit). |
| `contentInset` | `Partial<Edges>` | | Platz rund um den Inhalt. |
| `contentOffset` | `{ x?, y? }` | | Wo sie startet. |
| `keyboardShouldPersistTaps` | `"never" \| "always" \| "handled" \| boolean` | `"never"` | Ob ein Tippen die Tastatur schließt (`"never"`: Das Tippen schließt sie nur). |
| `keyboardDismissMode` | `"none" \| "on-drag" \| "interactive"` | `"none"` | Ob Ziehen die Tastatur schließt. |
| `scrollEventThrottle` | `number` | | Minimale Millisekunden zwischen `onScroll`-Events (ohnehin höchstens eines pro Frame). |
| `scrollValue` | `AnimatedValue` | | Ein [animierter Wert](./nsh.md#animation), der auf dem UI-Thread mit dem Scroll-Offset (Hauptachse) gespeist wird, für scrollgekoppelte Effekte. |

### Scroll-Events

| Event | Payload | Wann |
|---|---|---|
| `onScroll` | `ScrollEvent`: `{ offset, contentSize, size, zoomScale }` | Während des Scrollens. |
| `onScrollDragStart` | `{ offset }` | Ein Drag beginnt. |
| `onScrollDragEnd` | `{ offset }` | Der Finger wird gehoben. |
| `onMomentumStart` | `{ offset }` | Ein Gleiten beginnt nach dem Drag. |
| `onMomentumEnd` | `{ offset }` | Das Gleiten endet (auch wenn ein neuer Drag es abfängt). |
| `onScrollEnd` | `{ offset }` | Das Scrollen ist zur Ruhe gekommen. |

Listen akzeptieren außerdem die Props, die jedes Element akzeptiert ([allgemeine Props](../elements/index.md)).

<a id="ref-methods"></a>

## Ref-Methoden

Das `ref` einer Liste erhält ein `ListRef` mit diesen Methoden zusätzlich zu denen von `ViewRef`:

| Methode | Beschreibung |
|---|---|
| `scrollToIndex({ index, animated?, viewPosition?, viewOffset? })` | Scrollt Item `index` in den sichtbaren Bereich. `viewPosition` platziert es: `0` am Anfang des Viewports (Standard), `0.5` in der Mitte, `1` am Ende; `viewOffset` verschiebt es weiter. Wird nativ mit den gemessenen (oder geschätzten) Zeilengrößen aufgelöst. |
| `scrollToOffset({ offset, animated? })` | Scrollt zu einem Inhalts-Offset entlang der Achse der Liste. |
| `scrollToEnd({ animated? })` | Scrollt zum Ende des Inhalts (zum Anfang einer invertierten Liste). |
| `scrollTo({ x?, y?, animated? })` | Scrollt zu einem Offset. |

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

## Beispiele

Ein Chat: neueste Nachricht unten, ältere Nachrichten werden beim Hochscrollen nachgeladen.

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

Pull-to-Refresh:

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

Die Daten-und-Zeilen-Hälfte von `ListProps`: das, was du an eine eigene Komponente übergibst, die eine Liste selbst layoutet, etwa eine Einstellungsliste, die `List` mit eigenem Padding und eigenen Trennlinien umschließt.
