---
title: "Pagination"
description: "Die Pagination-Komponente: die Seiten einer Menge, zwischen denen man wechseln kann, mit den Seiten rund um die aktuelle, Auslassungspunkten, Zurück und Weiter, einem kompakten Pager, der Tastaturbedienung und der aktuellen Seite für Screenreader, gestaltet von der App."
group: base
demo: el-pagination
source_hash: e6e2ee064fd489be
---


# Pagination

Eine Pagination wechselt zwischen den Seiten einer Menge: Suchergebnisse, die Zeilen einer Tabelle, ein Archiv. Sie zeigt Zurück, die Seiten um die aktuelle herum (die erste und die letzte immer, für jede ausgelassene Folge eine Ellipse), die Kinder der App und Weiter. Sie besitzt das Verhalten: welche Seiten angezeigt werden, Pressen, die Tastatur, an den Enden deaktiviertes Zurück und Weiter, die Navigationsmarke (Landmark) und die aktuelle Seite für Screenreader. Das Aussehen gehört der App: Die Elemente haben keine eigene Farbe, Größe oder Beschriftung, die App gestaltet sie oder zeichnet sie selbst.

```rust tabs
use nsh_base::{pagination, theme};
use nsh_core::prelude::*;

fn results() -> impl IntoElement {
    let page = signal(1u32);
    pagination()
        .page(move || page.get())
        .total_pages(24)
        .accessibility_label("Search results")
        .previous_accessibility_label("Previous")
        .next_accessibility_label("Next")
        .item_class("min-w-9 h-9 px-2 items-center justify-center rounded-md hover:bg-accent selected:bg-primary selected:text-primary-foreground disabled:opacity-50")
        .gap_1()
        .on_change(move |p: &u32| page.set(*p))
}
```

```tsx tabs
import { mount, signal } from "nsh";
import { Pagination } from "nsh/base";

function App() {
  const page = signal(1);
  return (
    <Pagination
      page={page()}
      totalPages={24}
      accessibilityLabel="Search results"
      previousAccessibilityLabel="Previous"
      nextAccessibilityLabel="Next"
      class="gap-1"
      itemClass="min-w-9 h-9 px-2 items-center justify-center rounded-md hover:bg-accent selected:bg-primary selected:text-primary-foreground disabled:opacity-50"
      onChange={({ page: next }) => page.set(next)}
    />
  );
}

mount(App);
```

`Pagination` stammt aus [`nsh/base`](../modules/nsh-base.md), dem `nsh-base`-Crate in Rust. In Rust erzeugt `pagination()` eine Pagination mit einem Setter pro Prop (`.page(..)`, `.total_pages(..)`), `.on_change(..)` für die Seite, die der Nutzer auswählt, den typisierten Stilmethoden für die Zeile und `.child(..)` für den Inhalt der App.

<a id="the-page"></a>

## Die Seite

Die Seite gehört der App: `page` ist die aktuelle Seite, ab 1, und `onChange({ page })` meldet die Seite, die der Nutzer mit einem Druck auf eine Seite, auf Zurück oder auf Weiter ausgewählt hat. Die App setzt sie, lädt diese Seite und zeigt ihre Zeilen. `totalPages` gibt an, wie viele Seiten es gibt; ein `page` hinter der letzten Seite zeigt die letzte. Die aktuelle Seite meldet beim Drücken nichts, ebenso wenig Zurück auf der ersten und Weiter auf der letzten Seite.

<a id="the-pages-shown"></a>

## Die angezeigten Seiten

Mit `visiblePages` (mindestens 5, der Standard) zeigt die Zeile alle Seiten, solange sie passen. Darüber hinaus zeigt sie die erste und die letzte Seite, die aktuelle mit so vielen Seiten auf jeder Seite, wie passen, `(visiblePages - 3) / 2`, und eine Ellipse für jede Folge ausgelassener Seiten:

| `page` von 20, `visiblePages={7}` | Angezeigt |
|---|---|
| 1 | `1 2 3 4 5 … 20` |
| 6 | `1 … 4 5 6 7 8 … 20` |
| 20 | `1 … 16 17 18 19 20` |

Zehntausend Seiten zeigen dieselben sieben Elemente. Ein ungerader Wert für `visiblePages` zentriert die aktuelle Seite.

<a id="items"></a>

## Elemente

Jedes Element übernimmt die `itemClass` und `itemStyle` der App: Die aktuelle Seite ist `selected:`, ein Element, das keinen Druck annimmt, `disabled:`, das Element mit dem Tastaturfokus `focus:`. Die Zeile wird von der App mit `class` angeordnet (standardmäßig eine Zeile; `gap-*`, `justify-*`).

Ohne `renderItem` zeigt eine Seite ihre Nummer, eine Ellipse `…`, und Zurück und Weiter zeigen ihre Accessibility-Beschriftungen (`‹` und `›`, wenn es keine gibt). `renderItem` zeichnet den Inhalt jedes Elements aus einem `PaginationItemState`:

| Feld | Typ | Beschreibung |
|---|---|---|
| `kind` | `"previous" \| "page" \| "ellipsis" \| "next"` | Was das Element ist. |
| `page` | `number` | Die Nummer einer Seite; die Seite, zu der Zurück oder Weiter führt (an den Enden die aktuelle); die erste verborgene Seite einer Ellipse. |
| `start`, `end` | `number` | Die verborgenen Seiten einer Ellipse: `start` eingeschlossen, `end` (die nächste angezeigte Seite) nicht. |
| `current` | `boolean` | Die aktuelle Seite. |
| `disabled` | `boolean` | Es nimmt keinen Druck an: Zurück auf der ersten Seite, Weiter auf der letzten, alles bei einer deaktivierten Pagination. |

```tsx
<Pagination
  page={page()}
  totalPages={pages()}
  previousAccessibilityLabel="Previous page"
  nextAccessibilityLabel="Next page"
  itemClass="size-9 items-center justify-center rounded-md selected:bg-primary"
  renderItem={(item) =>
    item.kind === "previous" ? <Icon name="chevron-left" /> :
    item.kind === "next" ? <Icon name="chevron-right" /> :
    item.kind === "ellipsis" ? <JumpMenu from={item.start!} to={item.end!} onPick={(p) => page.set(p)} /> :
    <Text class={item.current ? "font-semibold text-primary-foreground" : "text-foreground"}>{item.page}</Text>
  }
  onChange={({ page: next }) => page.set(next)}
/>
```

Eine Ellipse nimmt von sich aus keinen Druck an: Was sie tut, bestimmt die App. Ein darin gezeichnetes `Menu` listet die Seiten auf, die sie verbirgt, so wie `JumpMenu` oben.

<a id="compact"></a>

## Kompakt

`compact` zeigt nur Zurück, die Kinder und Weiter: ein Pager für einen schmalen Bildschirm, wobei die Seite in den Kindern angegeben wird.

```tsx
<Pagination compact page={page()} totalPages={12} onChange={({ page: next }) => page.set(next)} class="items-center gap-3">
  <Text class="text-sm text-muted-foreground">{`${page()} of 12`}</Text>
</Pagination>
```

Die Kinder stehen in beiden Formen nach den Seiten und vor Weiter: eine Seitenzahl, ein Feld, um zu einer Seite zu springen.

## Props

| Prop | Rust | Typ | Standard | Beschreibung |
|---|---|---|---|---|
| `page` | `.page(..)` | `number` | erforderlich | Die aktuelle Seite, ab 1; die App setzt sie in `onChange`. |
| `totalPages` | `.total_pages(..)` | `number` | erforderlich | Wie viele Seiten es gibt, mindestens 1. |
| `visiblePages` | `.visible_pages(..)` | `number` | `5` | Die höchste Anzahl gleichzeitig angezeigter Seiten, die erste und die letzte eingeschlossen; mindestens 5. |
| `compact` | `.compact(..)` | `boolean` | `false` | Nur Zurück, die Kinder und Weiter. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Kein Element nimmt einen Druck oder den Tastaturfokus an; die `disabled:`-Stile gelten, und Screenreader geben an, dass sie abgeblendet sind. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | keiner | Wie Screenreader die Navigation nennen: was sie durchblättert. |
| `previousAccessibilityLabel`, `nextAccessibilityLabel` | `.previous_accessibility_label(..)`, `.next_accessibility_label(..)` | `string` | keiner | Was Screenreader für Zurück und Weiter sagen, sowie deren Inhalt ohne `renderItem`. |
| `itemClass`, `itemStyle` | `.item_class(..)`, `.item_style(\|s\| ..)` | `string`, `StyleProp<TextStyle>` | keiner | Das Aussehen jedes Elements: `selected:` auf der aktuellen Seite, `disabled:`, `focus:`; Textstile werden an den Inhalt weitergegeben. |
| `renderItem` | `.render_item(\|s: &PaginationItemState\| ..)` | `(item: PaginationItemState) => JSX.Element` | keiner | Zeichnet den Inhalt jedes Elements aus seinem Zustand. |
| `children` | `.child(..)` | `JSX.Element` | keiner | Der Inhalt der App nach den Seiten, vor Weiter. |
| `class`, `style` | Stilmethoden | `string`, `StyleProp<ViewStyle>` | keiner | Aussehen und Layout der Zeile. |

<a id="events"></a>

## Ereignisse

| Ereignis | Rust | Beschreibung |
|---|---|---|
| `onChange` | `.on_change(\|page: &u32\| ..)` | `{ page }`: die Seite, die der Nutzer mit einer Seite, Zurück oder Weiter ausgewählt hat. Die aktuelle Seite wird nie gemeldet. |

<a id="motion"></a>

## Bewegung

Die aktuelle Seite bewegt sich von Element zu Element, wie es die `selected:`-Klassen der App vorgeben: `transition-colors` auf `itemClass` blendet die Hervorhebung von der verlassenen Seite zur erreichten Seite über. Ein Seitenwechsel lässt jedes Element an seinem Platz und ändert nur, was die Elemente anzeigen, sodass die Zeile nie flackert; die Übergänge der App stehen bei reduzierter Bewegung still (`motion-reduce:transition-none`).

<a id="accessibility"></a>

## Barrierefreiheit

- Die Zeile ist eine Navigationsmarke (Landmark), benannt durch `accessibilityLabel`.
- Jede Seite, Zurück und Weiter ist eine Schaltfläche. Die aktuelle Seite wird als aktuelle Seite angesagt (ARIAs `aria-current="page"`) und ist ausgewählt; Zurück auf der ersten Seite und Weiter auf der letzten sind abgeblendet.
- Unter macOS und im Web ist jede Seite, Zurück und Weiter ein Halt des Tastaturfokus, und Return und Leertaste drücken es. Eine per Tastatur gedrückte Seite behält den Fokus, sobald die App sie anzeigt, wo auch immer sie in der Zeile landet, ebenso die erste oder die letzte Seite, wenn Zurück oder Weiter sie erreicht.

Siehe [Accessibility](../docs/accessibility.md) für Beschriftungen, Rollen und Ansagen im Allgemeinen.

<a id="platform-notes"></a>

## Hinweise zu den Plattformen

- iOS, Android und Mac Catalyst: Ein Druck ist ein Tippen, das auf einem Element endet.
- Desktops (macOS, Windows, Linux, GPUI) und das Web: Ein Druck ist ein Klick; unter macOS und im Web erreicht die Tabulatortaste die Elemente.
- Jede Plattform zeichnet das, was die App gestaltet.
