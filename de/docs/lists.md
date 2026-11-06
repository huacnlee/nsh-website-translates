---
title: "Listen"
description: "Lange und endlose Listen in Rust und TSX – Recycling, Zeilenidentität, Spalten, Sticky-Header, invertierte Chat-Listen, horizontale Listen, Listen in einer Seite, Nachladen weiterer Einträge, Sichtbarkeit und Scrollen zu einem Eintrag."
order: 40
group: ui
demo: guide-lists
source_hash: fb4ffb925cc99200
---


# Listen

Eine Liste (`virtual_list(..)` in Rust, `List` aus `nsh` in TSX) rendert lange Daten in einer nativen Scroll View und erzeugt dabei nur die Zeilen in der Nähe des Bildschirms. Welche Zeilen existieren, wo sie liegen, die Spalten, Sticky Header und welche Elemente sichtbar sind, wird alles nativ berechnet. Dein Code füllt Zellen nur dann mit Inhalt, wenn die native Seite danach fragt. Eine Liste mit einer Million Elementen kostet ungefähr so viel wie eine Liste mit dreißig.

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

In Rust nimmt `virtual_list(count, row)` die Anzahl der Zeilen (einen Wert, ein Signal oder eine Closure) und eine Funktion, die eine Zeile aus ihrer Position (`at.index()`) aufbaut. Die Zeilen lesen deine Daten über diesen Index. In TSX nimmt `each` die Elemente, und die Zeilenfunktion erhält das Element. Wie eine [Scroll View](./scrolling.md) ist die Liste der Viewport und braucht von ihrem Parent eine Größe (`.flex_1()`, `flex: 1` oder eine Höhe).

<a id="how-recycling-works"></a>

## Wie Recycling funktioniert

Die Zeilenfunktion wird nicht einmal pro Element aufgerufen. Sie wird **einmal pro Zelle** aufgerufen, und Zellen werden wiederverwendet: Wenn eine Zeile weit aus dem Bildschirm scrollt, bekommt ihre Zelle eine andere Zeile, und ihre Position (`at.index()` in Rust, `item()` und `index()` in TSX) ändert sich. Alles in der Zeile, das sie liest, wird an Ort und Stelle aktualisiert, wie bei jedem anderen [Signal](./reactivity.md).

Daraus folgen zwei Regeln:

**Lies die Position dort, wo du sie verwendest.** Ein Wert, der am Anfang der Zeilenfunktion herauskopiert wird, gehört zu der Zeile, die die Zelle zuerst angezeigt hat.

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

**Halte den Zustand pro Element in deinen Daten, nicht in der Zeile.** Ein Signal, das innerhalb der Zeile erzeugt wird, gehört zur Zelle und wandert mit ihr zum nächsten Element. Speichere „Zeile ist aufgeklappt / ausgewählt / mit „Gefällt mir“ markiert“ in den Elementen oder in einer Menge, die nach ID indiziert ist:

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

Zeilen können unterschiedliche Höhen haben. Solange eine Zeile nicht gemessen wurde, nimmt die Liste die geschätzte Elementgröße an (Standard: 50 Punkte). Übergib einen Wert nahe an deiner typischen Zeile, damit der Scroll-Indikator und Sprünge zu weit entfernten Elementen von Anfang an genau sind.

<a id="changing-the-data"></a>

## Daten ändern

In Rust übergibst du die Anzahl als Signal oder Closure (`move || posts.with(Vec::len)`): Die Liste wächst und schrumpft an Ort und Stelle. Zeilen, die am Ende hinzukommen oder entfernt werden, brauchen nichts weiter. Kommen und gehen Zeilen an anderer Stelle, gib ihre Identitäten mit `.keys(move || posts.with(|p| p.iter().map(|p| p.id).collect::<Vec<_>>()))` an. Die Liste behält dann den gemeinsamen Anfang und das gemeinsame Ende und behandelt das, was dazwischen liegt, als entfernt und eingefügt.

In TSX übergibst du ein neues Array, um die Elemente zu ändern: `posts.set([...posts(), ...more])`. Die Liste vergleicht das alte und das neue Array **nach Element-Identität** (`===`), behält den gemeinsamen Anfang und das gemeinsame Ende und behandelt das, was dazwischen liegt, als entfernt und eingefügt.

In beiden Fällen bleiben Messungen bei ihren Zeilen, und wenn Zeilen oberhalb der sichtbaren Zeilen eingefügt werden, bleiben die sichtbaren Zeilen an ihrer Stelle, statt zu springen.

- Aktualisiere in TSX unveränderlich: ein neues Array, wobei die unveränderten Element-Objekte wiederverwendet werden. Ein direktes Ändern des Arrays (`push`) wird nicht erkannt.
- Ein geändertes Element sollte ein neues Objekt sein (`{ ...post, title }`), damit seine Zeile die Änderung zeigt.
- Voranstellen (neue Nachrichten, ein aktualisierter Feed) erhält die Position des Nutzers.

`keyExtractor` benennt Elemente in Viewability-Tokens (siehe unten). Standardmäßig ist der Schlüssel `item.key`, dann `item.id`, dann der Index. Er beeinflusst nicht, wie Änderungen in TSX zugeordnet werden, das geschieht immer nach Identität.

## Props

Eine Liste akzeptiert jedes Scroll-Prop der Scroll View, das für eine Liste sinnvoll ist (`pagingEnabled`, `snapToInterval`, `snapToOffsets`, `snapToAlignment`, `decelerationRate`, `disableIntervalMomentum`, `bounces`, `scrollable`, `contentInset`, `contentOffset`, `keyboardShouldPersistTaps`, `keyboardDismissMode`, `scrollEventThrottle`, `onScroll`, `onScrollDragStart`, `onScrollDragEnd`, `onMomentumStart`, `onMomentumEnd`, `onScrollEnd`, `scrollValue`, `pullValue`; in Rust dieselben Methoden wie die einer Scroll View), beschrieben unter [Scrolling](./scrolling.md). Listen behalten einen Maßstab von 1. Ihre eigenen Props:

| Prop | Rust | Typ | Standard | Beschreibung |
|---|---|---|---|---|
| `each` | `virtual_list(count, ..)` | `readonly T[]` | | Die Elemente; in Rust die Anzahl der Zeilen. |
| `children` | `virtual_list(.., row)` | `(item: () => T, index: () => number) => JSX.Element` | | Rendert eine Zelle; wird einmal pro Zelle aufgerufen, siehe [Recycling](#how-recycling-works). |
| `estimatedItemSize` | `.estimated_item_size(px(..))` | `number` | `50` | Die Größe noch nicht gemessener Zeilen, in Punkten. |
| `horizontal` | `.horizontal()` | `boolean` | `false` | Scrollt seitwärts. |
| `viewport` | `.viewport(ListViewport::..)` | `"own" \| "parent"` | `"own"` | `"own"`: Die Liste scrollt in einer eigenen Scroll View. `"parent"`: Sie liegt in voller Länge in der Scroll View um sie herum, die sie zusammen mit dem Rest der Seite scrollt (siehe [Listen in einer Seite](#lists-in-a-page-viewportparent)). Wird beim Erstellen der Liste festgelegt. |
| `numColumns` | `.columns(n)` | `number` | `1` | Elemente pro Zeile (vertikale Listen). |
| `inverted` | `.inverted()` | `boolean` | `false` | Element 0 unten (Chat); beginnt am Ende und behält seinen Abstand zum Ende. |
| `maintainVisibleContentPosition` | `.follow_end(px(..))` | `{ autoscrollToBottomThreshold?: number }` | | Eine nicht invertierte Liste bleibt am Ende, solange sie sich innerhalb dieser Anzahl von Punkten davon befindet, wenn der Inhalt wächst (siehe unten). |
| `stickyHeaderIndices` | `.sticky_header_indices(..)` | `number[]` | | Elemente, die oben haften bleiben, wenn sie weggescrollt werden (eine Spalte, nicht invertiert). |
| `stickyHeaderOffset` | `.sticky_header_offset(px(..))`, `.bind_sticky_header_offset(&node)` | `number \| AnimatedNode` | `0` | Wie weit unterhalb des oberen Rands die Sticky-Elemente haften, wie `top` in CSS `position: sticky`; der Inhalt scrollt unter dem Platz oberhalb von ihnen weiter. Ein animierter Wert bewegt sie in jedem Frame. |
| `contentStyle` | `.content_padding(..)`, `.content_padding_x(..)`, ..., `.row_gap(..)`, `.column_gap(..)` | `{ padding*, gap, rowGap, columnGap }` | | Padding und Abstände des Inhalts, nur Zahlen. |
| `contentClass` | | `string` | | Dasselbe wie Klassen (`p-*`, `gap-*`); `contentStyle` hat Vorrang. |
| `header` | `.header(..)` | Komponente oder Element | | Vor den Elementen. |
| `footer` | `.footer(..)` | Komponente oder Element | | Nach den Elementen. |
| `empty` | `.empty(..)` | Komponente oder Element | | Wird anstelle der Elemente angezeigt, solange keine vorhanden sind. |
| `separator` | `.separator(\|\| ..)` | Komponente oder Element | | Zwischen den Elementen (eine Spalte). |
| `initialScrollIndex` | `.initial_scroll_index(i)` | `number` | | Scrollt vor dem ersten Frame zu diesem Element. |
| `onLoadMore` | `.on_load_more(..)` | `() => void` | | Das Ende ist nah (siehe unten). |
| `loadMoreThreshold` | `.load_more_threshold(..)` | `number` | `1` | Wie nah am Ende, in Viewports, `onLoadMore` ausgelöst wird. |
| `onLoadMoreAtStart` | `.on_load_more_at_start(..)` | `() => void` | | Der Anfang ist nah, nach einem Scrollen (siehe unten). |
| `loadMoreAtStartThreshold` | `.load_more_at_start_threshold(..)` | `number` | `1` | Wie nah am Anfang, in Viewports, `onLoadMoreAtStart` ausgelöst wird. |
| `onViewableItemsChange` | `.on_viewable_items_change(..)` | `(info) => void` | | Elemente sind sichtbar geworden oder nicht mehr sichtbar. |
| `viewabilityConfig` | `.viewability(..)`, `.minimum_view_time(..)` | `ViewabilityConfig` | | Wann Elemente als sichtbar gelten. |
| `keyExtractor` | `.keys(..)` | `(item, index) => string` | | Der Schlüssel in Viewability-Tokens; in Rust die Identitäten der Zeilen. |
| `refreshing` / `onRefresh` | `.refreshing(..)` / `.on_refresh(..)` | `boolean` / `() => void` | | Pull to Refresh. |
| `refreshIndicator` | `.refresh_indicator(..)` | `{ height: number }` | | Der eigene Pull-to-Refresh-Indikator der App anstelle des Spinners der Plattform (siehe [Scrolling](./scrolling.md#an-indicator-of-your-own)). |
| `scrollbar` | `.scrollbar(..)` | `boolean \| ScrollbarTheme` | `true` | Der Scroll-Indikator wird angezeigt: der der Plattform oder die [integrierte Leiste](../elements/scrollbar.md#built-in-bars) der App, sobald sie ein Theme gesetzt hat; ein Objekt ist ein Theme für die View selbst. Auf dem Desktop und in Desktop-Browsern behält eine horizontale View ihn: Er ist die Scrollleiste der Maus. |
| `ref` | `.element_ref(&list)` | `ListRef` | | `scrollToIndex`, `scrollToOffset`, `scrollToEnd`, `scrollTo`. |

Die Slots Header, Footer und Empty nehmen ein Element an (in TSX auch eine Komponente: `header={Header}`). Sie sind eigene Zellen, werden nie recycelt und sind wie jedes andere Element reaktiv.

<a id="columns-and-grids"></a>

## Spalten und Raster

`numColumns` (`.columns(n)`) ordnet Elemente in Zeilen mit dieser Anzahl von Spalten an. Das Content-Padding liegt um den Inhalt, mit Abständen zwischen Zeilen und Spalten. Zeilen eines Rasters können unterschiedliche Höhen haben: Jede Zeile ist so hoch wie ihr höchstes Element.

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

## Sticky Header

`stickyHeaderIndices` listet Elemente auf, die am oberen Rand des Viewports haften bleiben, während der Inhalt an ihnen vorbeiscrollt, bis das nächste Sticky-Element sie hinausschiebt. Abschnitte sind eine Liste aus Header- und Zeilenelementen; die Indizes der Header haften. Das Anheften erfolgt nativ in jedem Scroll-Frame.

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

Da eine Zelle jetzt einen Header und später einen Namen zeigen kann, entscheidet die Zeile mit [`when` / `<If>`](../elements/control-flow.md), was gerendert wird; das schaltet um, wenn sich die Zeile ändert. Sticky Header brauchen eine Spalte und eine nicht invertierte Liste.

`stickyHeaderOffset` (`.sticky_header_offset(..)` in Rust) lässt die Header stattdessen so viele Punkte unterhalb des oberen Rands haften, wie `top` in CSS `position: sticky` es tut: Unter einer durchscheinenden Leiste von 56 Punkten Höhe hält `stickyHeaderOffset={56}` (`.sticky_header_offset(px(56.0))`) jeden Header unterhalb der Leiste, während die Zeilen darunter weiterscrollen, und der nächste Header schiebt ihn von dort hinaus. Ein negativer Offset lässt einen Teil eines Headers außerhalb des sichtbaren Bereichs.

Der Offset kann ein [animierter Wert](./animation.md#animated-values) sein (`.bind_sticky_header_offset(&node)` in Rust): Die Header folgen ihm in jedem Frame auf dem UI-Thread und bleiben so unterhalb einer Leiste, die sich bewegt. Bei einer Leiste, die sich beim Herunterscrollen des Inhalts ausblendet und beim Hochscrollen zurückkommt ([`diffClamp`](./animation.md#arithmetic-and-diffclamp)), haften die Header an ihrer Unterkante, wo auch immer sie sich befindet:

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

## Chat: invertierte Listen

`inverted` ordnet die Liste vom Ende her an: Element 0 ist unten, die Liste beginnt zum Ende gescrollt und behält ihren Abstand zum Ende, wenn sich Elemente ändern. Halte die neueste Nachricht zuerst: Stelle voran, um eine hinzuzufügen, und hänge an, um ältere mit `onLoadMore` zu laden (das „Ende“ einer invertierten Liste ist oben). Ein Chat, der bei einer alten Nachricht geöffnet wird, lädt die neueren mit [`onLoadMoreAtStart`](#loading-at-the-start-onloadmoreatstart). Damit behält die Liste ihren Abstand zum unteren Rand, solange sie dort ist, und hält die Nachrichten auf dem Bildschirm an Ort und Stelle, wenn nach oben gescrollt wird.

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

`scroll_to_end(..)` / `scrollToEnd()` scrollt bei einer invertierten Liste zu ihrem Anfang: der neuesten Nachricht.

<a id="following-the-end-of-a-list-that-is-not-inverted"></a>

### Dem Ende einer nicht invertierten Liste folgen

Eine Liste in Leserichtung (älteste zuerst) kann ihrem Ende ebenfalls folgen: Mit `.follow_end(px(40.0))` in Rust oder `maintainVisibleContentPosition={{ autoscrollToBottomThreshold: 40 }}` in TSX bleibt die Liste am Ende, solange der Nutzer am Ende ist (oder höchstens 40 Punkte davon entfernt), wenn der Inhalt wächst: eine Antwort, die in das letzte Element gestreamt wird, eine neu angehängte Nachricht oder die Tastatur, die die Liste verkleinert. Wurde weiter nach oben gescrollt, bleibt der sichtbare Inhalt an seiner Stelle, und der neue Inhalt wächst darunter. Elemente, die oberhalb der sichtbaren eingefügt werden, verschieben diese nie, mit oder ohne die Option.

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

## Horizontale Listen

`horizontal` dreht die Liste zur Seite; Zellen werden in der Höhe der Liste angeordnet. In Kombination mit Snapping ergibt das ein Karussell beliebiger Länge:

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

Bei Rechts-nach-links-Schrift beginnen horizontale Listen rechts und laufen nach links.

<a id="lists-in-a-page-viewportparent"></a>

## Listen in einer Seite: viewport="parent"

Eine Seite scrollt oft als Ganzes: ein Header, ein paar Karten, dann eine lange Liste und vielleicht darunter eine weitere Liste. Gib der Liste `viewport="parent"` (`.viewport(ListViewport::Parent)` in Rust) und platziere sie zusammen mit dem Rest der Seite in einer `Scroll`: Die Liste liegt in voller Länge in der Seite, und die Scroll View der Seite scrollt sie zusammen mit allem anderen. Sie erzeugt weiterhin nur die Zeilen in der Nähe des Viewports der Seite und recycelt deren Zellen, sodass eine Seite mehrere lange Listen enthalten kann.

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

- Die Liste ist so lang wie ihre Zeilen: Ihre Höhe (bei seitlichem Scrollen ihre Breite) ergibt sich aus ihrem Inhalt, wie bei einer View, und Padding, Rahmen und Ränder funktionieren wie bei einer View.
- Ihre Zeilen folgen entlang ihrer Achse der nächsten Scroll View um sie herum oder dem Bildschirm, auf dem sie sich befindet.
- Die Seite hält das, was du liest, an Ort und Stelle, wie ein Browser: Zeilen, die ihre Größe vollständig oberhalb des oberen Rands des Viewports ändern, verschieben die Seite um denselben Betrag; solange der Anfang der Liste sichtbar ist, schieben wachsende Zeilen das, was unter ihnen liegt, nach unten.
- `scrollToIndex`, `scrollToEnd` und `initialScrollIndex` scrollen die Seite zu den Zeilen der Liste, innerhalb des Inhalts der Seite. `onLoadMore` wird ausgelöst, wenn das Ende der Liste in die Nähe des Viewports kommt, und `onViewableItemsChange` meldet die Zeilen im Viewport der Seite.
- `stickyHeaderIndices` und `stickyHeaderOffset` lassen Zeilen am oberen Rand der Seite haften: Ein Abschnitts-Header bleibt oben, während seine Zeilen darunter scrollen, bis der nächste ihn hinausschiebt, und der letzte verschwindet mit dem Ende seiner Liste.
- Wie die Seite scrollt, bestimmt ihre Scroll View: Setze `onScroll` und die anderen Scroll-Events, `scrollValue`, `refreshing` / `onRefresh`, Paging und Snapping, `contentInset`, `scrollbar`, `scrollable` und `keyboardDismissMode` auf der `Scroll`. Invertierte Listen und `maintainVisibleContentPosition` sind Funktionen einer Liste mit eigenem Viewport (`viewport="own"`, der Standard).
- Der Viewport wird beim Erstellen der Liste gewählt: Um zu wechseln, rendere eine neue Liste.

<a id="loading-more-onloadmore"></a>

## Mehr laden: onLoadMore

`onLoadMore` (`.on_load_more(..)`) wird ausgelöst, wenn der Viewport innerhalb von `loadMoreThreshold` Viewports an das Ende herankommt (standardmäßig 1: eine Bildschirmhöhe voraus). Hänge die nächste Seite an; die Liste löst erneut aus, wenn das neue Ende in die Nähe kommt.

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

Schütze dich wie oben vor überlappenden Ladevorgängen: Das Ende kann erneut gemeldet werden, während eine Seite noch unterwegs ist.
<a id="loading-at-the-start-onloadmoreatstart"></a>

## Laden am Anfang: onLoadMoreAtStart

Eine Liste kann auch in der Mitte ihrer Daten geöffnet werden: Ein Chat, der bei einer älteren Nachricht geöffnet wird (ein Suchtreffer, das Zitat einer Antwort), zeigt eine Seite um diese Nachricht herum, während neuere Nachrichten noch nachgeladen werden müssen. `onLoadMoreAtStart` (`.on_load_more_at_start(..)`) wird ausgelöst, wenn der Viewport bis auf `loadMoreAtStartThreshold` Viewports an den Anfang herankommt (standardmäßig 1), also an die Seite von Item 0: das obere Ende einer Liste, das untere Ende einer invertierten Liste. Stelle die Seite voran: Die Zeilen auf dem Bildschirm behalten ihren Platz, während die Seite davor eintrifft (bei einer invertierten Liste ebenfalls, sobald sie vom unteren Ende weggescrollt wurde), und die Liste löst beim nächsten Annähern erneut aus, oder sofort, wenn sie nach der Seite noch nahe am Anfang liegt.

Das Ereignis wird ausgelöst, sobald der Benutzer dorthin scrollt oder ein Scroll-Befehl die Liste dorthin bringt (`initialScrollIndex` eingeschlossen). Eine Liste, die beim neuesten Item geöffnet wird, fordert also nichts an, und eine Liste, die mit `initialScrollIndex` nahe an ihrem Anfang geöffnet wird, fordert sofort die Seite davor an.

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

Sobald die neueste Nachricht geladen ist, beende das Laden: Neue Nachrichten kommen dann wie in jedem Chat am Anfang an.

## Viewability

`onViewableItemsChange` (`.on_viewable_items_change(..)`) meldet, welche Items auf dem Bildschirm sind, etwa für Analytics, zum automatischen Abspielen des sichtbaren Videos oder zum Markieren von Nachrichten als gelesen. In TSX erhält es `{ viewableItems, changed }`, Arrays aus Tokens `{ item, key, index, isViewable }`; in Rust `ViewableItems` mit der ersten und letzten sichtbaren Zeile (`viewable`) und den Zeilen, deren Zustand sich geändert hat (`changed()`). Die Viewability wird nativ berechnet; Ihr Code erfährt nur von den Änderungen.

| `viewabilityConfig` | Rust | Beschreibung |
|---|---|---|
| `itemVisibleThreshold` | `Viewability { item_visible_threshold, .. }` | Wie viel eines Items sichtbar sein muss, von 0 bis 1. |
| `viewAreaCoverageThreshold` | `Viewability { view_area_coverage_threshold, .. }` | Wie viel des Viewports ein Item abdecken muss, von 0 bis 1. |
| `minimumViewTime` | `.minimum_view_time(Duration)` | Millisekunden, die ein Item sichtbar bleiben muss, bevor es gemeldet wird. |

Ohne Schwellenwert zählt jedes sichtbare Pixel.

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

## Scrollen aus dem Code

Gib der Liste eine Ref (`element_ref()` und `.element_ref(&list)` in Rust, `ref` in TSX):

| Rust | TSX | Beschreibung |
|---|---|---|
| `scroll_to_index(index, view_position, view_offset, animated)` | `scrollToIndex({ index, animated?, viewPosition?, viewOffset? })` | Scrollt Item `index` in den sichtbaren Bereich. Die View-Position bestimmt, wo es platziert wird: 0 am Anfang des Viewports (Standard), 0.5 in der Mitte, 1 am Ende; der View-Offset verschiebt es weiter. |
| `scroll_to_offset(offset, animated)` | `scrollToOffset({ offset, animated? })` | Scrollt zu einem Content-Offset entlang der Achse der Liste. |
| `scroll_to_end(animated)` | `scrollToEnd({ animated? })` | Scrollt zum Ende des Inhalts (zum Anfang einer invertierten Liste). |
| `scroll_to(point, animated)` | `scrollTo({ x?, y?, animated? })` | Scrollt zu einem Offset, wie bei einer Scroll View. |

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

Das Scrollen zu einem Index (und zum Ende) wird nativ mit den zu diesem Zeitpunkt bekannten Größen aufgelöst: gemessene Zeilen dort, wo sie gemessen wurden, sonst die geschätzte Größe. Die Liste folgt dann ihrem Ziel, während die umliegenden Zeilen gemessen werden, und landet so exakt, bis der Benutzer scrollt oder sich die Items ändern. Um eine Liste bei einem Item zu öffnen, verwende `initialScrollIndex` (`.initial_scroll_index(..)`), statt nach dem ersten Frame zu scrollen.

<a id="a-settings-style-list"></a>

## Eine Liste im Stil der Einstellungen

Das Aussehen einer Liste ist Sache der App: Die Liste platziert und recycelt die Zeilen, und die Zeilen, Trennlinien und Flächen sind Ihre Views. Eine gruppierte Liste im Stil der Einstellungen ist eine Liste mit Padding, einem Separator und abgerundeten ersten und letzten Zeilen. Machen Sie daraus eine eigene Komponente und verwenden Sie sie überall dort, wo die App Einstellungen auflistet:

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

## Hinweise zur Performance

- Jede Zelle wird einzeln gelayoutet, sodass beim Scrollen nur die Zellen neu gelayoutet werden, die sich geändert haben. Halte Zeilen flach und vermeide es, Signals in Zeilen zu lesen, die sich in jedem Frame ändern.
- Die native Seite fordert Zellen in Batches an, bis zu mehreren Runden pro Frame, die zu einem Update zusammengeführt werden; ein schneller Fling bindet viele Zellen in einem Frame, ohne dass pro Zelle ein Aufruf in Ihren Code erfolgt. Rust-Zeilen werden im Core selbst gebunden, innerhalb des Commits, der sie benötigt.
- Verwenden Sie [`nsh test --trace` mit einem `scroll`-Schritt](./testing-and-trace.md#scrolling), um die Kosten Ihrer Zeilen pro Frame zu messen.

<a id="related"></a>

## Siehe auch

- [`List`-Element](../elements/list.md): die Referenz.
- [Scrolling](./scrolling.md): die Scroll-Props, die Listen mit Scroll Views gemeinsam haben.
- [Reactivity](./reactivity.md): warum Zeilen ihre Position in Bindings lesen.
- [Performance](./performance.md): Listen messen.
