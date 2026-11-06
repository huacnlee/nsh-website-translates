---
title: "Tree"
description: "Tree: Elemente, die Elemente enthalten, auf- und zugeklappt, eines davon ausgewählt: die Dateien eines Projekts, eine Seitenleiste mit Einstellungen, eine Gliederung. Virtualisiert, ein Haltepunkt des Tastaturfokus, ein Baum für Screenreader. Das Aussehen jeder Zeile bestimmt die App."
group: base
demo: el-tree
source_hash: db7f601c01cf83b3
---


# Tree

Eine Baumansicht zeigt Einträge, die Einträge enthalten: die Dateien und Ordner eines Projekts, die Abschnitte einer Seitenleiste mit Einstellungen, die Gliederung eines Dokuments. `Tree` verwaltet das Verhalten einer solchen Ansicht: welche Einträge aufgeklappt sind, welcher ausgewählt ist, die Tastatur und was Screenreader vorlesen. Ihre Zeilen sind virtualisiert: Nur die sichtbaren Zeilen werden erzeugt, und die Kinder eines eingeklappten Eintrags werden gar nicht erst erzeugt, sodass sich eine Baumansicht mit Tausenden von Einträgen sofort öffnet und scrollt. Das Aussehen bestimmt die App: Die Baumansicht zeichnet nichts selbst, die App gestaltet jede Zeile (`itemClass`) und zeichnet ihren Inhalt (`renderItem`: ein Icon, das Label, eingerückt nach der Tiefe des Eintrags, ein Chevron, ein Badge).

```rust tabs
use nsh_base::{TreeEntry, TreeItem, theme, tree};
use nsh_core::prelude::*;

fn files() -> impl IntoElement {
    let items = vec![
        TreeItem::new("src", "src")
            .child(TreeItem::new("src/main.rs", "main.rs"))
            .child(TreeItem::new("src/ui", "ui").child(TreeItem::new("src/ui/tree.rs", "tree.rs"))),
        TreeItem::new("Cargo.toml", "Cargo.toml"),
    ];
    let selected = signal(None::<SharedString>);
    tree()
        .items(items)
        .default_expanded(vec!["src".into()])
        .selected(move || selected.get())
        .on_selected_change(move |id: &SharedString| selected.set(Some(id.clone())))
        .accessibility_label("Files")
        .h(px(320.0))
        .list_class("p-1")
        .item_class(
            "group rounded-md hover:bg-accent selected:bg-primary/10 \
             focus:outline-2 focus:-outline-offset-2 focus:outline-ring disabled:opacity-50",
        )
        .render_item(|entry: &TreeEntry| {
            view()
                .flex_row()
                .gap_2()
                .h_8()
                .items_center()
                .rounded_md()
                .pl(px(8.0 + 16.0 * entry.depth as f32))
                .child(text(if entry.folder { "▸" } else { " " }).text_color(move || theme().muted_foreground))
                .child(text(entry.label.clone()))
        })
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { Tree, type TreeItem } from "nsh/base";

const files: TreeItem[] = [
  {
    id: "src",
    label: "src",
    children: [
      { id: "src/main.rs", label: "main.rs" },
      { id: "src/ui", label: "ui", children: [{ id: "src/ui/tree.rs", label: "tree.rs" }] },
    ],
  },
  { id: "Cargo.toml", label: "Cargo.toml" },
];

function App() {
  const expanded = signal(["src"]);
  const selected = signal<string | null>(null);
  return (
    <Tree
      items={files}
      expanded={expanded()}
      selected={selected()}
      onExpandedChange={({ expanded: next }) => expanded.set(next)}
      onSelectedChange={({ selected: next }) => selected.set(next)}
      accessibilityLabel="Files"
      class="h-80 w-64 rounded-lg border border-border"
      listClass="p-1"
      itemClass="group h-8 rounded-md hover:bg-accent selected:bg-primary/10 focus:outline-2 focus:-outline-offset-2 focus:outline-ring disabled:opacity-50"
      renderItem={(entry) => (
        <View class="h-8 flex-row items-center gap-2" style={{ paddingLeft: 8 + entry.depth * 16 }}>
          <Text class="w-3 text-muted-foreground transition-transform group-aria-expanded:rotate-90">
            {entry.folder ? "›" : ""}
          </Text>
          <Text class="text-sm text-foreground">{entry.label}</Text>
        </View>
      )}
    />
  );
}

mount(App);
```

`Tree` stammt aus [`nsh/base`](../modules/nsh-base.md), dem `nsh-base`-Crate in Rust. Die aufgeklappten Einträge und der ausgewählte Eintrag gehören der App, wenn sie `expanded` und `selected` setzt und in `onExpandedChange` und `onSelectedChange` aktualisiert; ohne diese Props verwaltet die Baumansicht ihren Zustand selbst, ausgehend von `defaultExpanded` und `defaultSelected`. Einträge werden über ihre `id` identifiziert, die der App gehört (ein Pfad, der Schlüssel eines Datensatzes), niemals über ihr Label. In Rust erzeugt `tree()` sie, mit einem Setter pro Prop (`.items(..)`, `.expanded(..)`, `.render_item(..)`), einer Listener-Methode pro Ereignis und den typisierten Style-Methoden.

<a id="items"></a>

## Einträge

`items` sind die Einträge der obersten Ebene, jeweils ein `TreeItem`:

| Feld | Typ | Beschreibung |
|---|---|---|
| `id` | `string` | Was den Eintrag in `expanded`, `selected` und den Ereignissen identifiziert: eindeutig in der Baumansicht (eine doppelt vergebene ID wird protokolliert, und nur der erste Eintrag mit dieser ID wird aufgeklappt oder ausgewählt). |
| `label` | `string` | Was seine Zeile zeigt, sofern `renderItem` sie nicht zeichnet, was Screenreader vorlesen und womit die Typeahead-Suche abgleicht. |
| `children` | `TreeItem[]` | Die Einträge darunter, in Reihenfolge. Hat er welche, ist er ein Ordner: Er lässt sich auf- und zuklappen. |
| `disabled` | `boolean` | Der Nutzer kann ihn weder auswählen noch auf- oder zuklappen: Klicks und Tasten überspringen ihn, die `disabled:`-Styles greifen. Seine Kinder bleiben, wie `expanded` es festlegt. |

`renderItem` erhält für jede sichtbare Zeile ein `TreeEntry`: die `id`, das `label` und die `disabled` des Eintrags, seine `depth` (0 auf der obersten Ebene, 1 unter einem obersten Eintrag, …) und ob er ein `folder` ist. Das beschreibt, was der Eintrag ist, und die Zustände der Zeile sind ihre Klassen: Die Zeichnung wird einmal pro Eintrag erzeugt und behält ihre Views, während die Zeile ausgewählt, aufgeklappt oder zugeklappt wird, sodass sich ein Chevron mit einer Transition drehen kann.

## Props

| Prop | Rust | Typ | Standard | Beschreibung |
|---|---|---|---|---|
| `items` | `.items(..)` | `TreeItem[]` | `[]` | Die Einträge der obersten Ebene, jeweils mit den Einträgen darunter. |
| `expanded` | `.expanded(..)` | `string[]` | keiner | Die IDs der aufgeklappten Einträge (controlled). Ein Eintrag wird angezeigt, solange alle Einträge über ihm aufgeklappt sind. |
| `defaultExpanded` | `.default_expanded(..)` | `string[]` | `[]` | Die anfangs aufgeklappten Einträge, solange `expanded` nicht gesetzt ist. |
| `selected` | `.selected(..)` | `string \| null` | keiner | Die ID des ausgewählten Eintrags (controlled), `null` für keinen. |
| `defaultSelected` | `.default_selected(..)` | `string` | keiner | Der anfangs ausgewählte Eintrag, solange `selected` nicht gesetzt ist. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Eine schreibgeschützte Baumansicht: keine Klicks oder Tasten, kein Halt des Tastaturfokus, `disabled:` auf jeder Zeile; sie zeigt, was `expanded` und `selected` vorgeben. |
| `reveal` | `.reveal(..)` | `boolean` | `false` | Beim Auf- und Zuklappen rücken die Zeilen nach dem Eintrag mit einer Feder-Animation (Spring) an ihre neuen Plätze, nativ ausgeführt. Bei reduzierter Bewegung deaktiviert. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | keiner | Wie Screenreader die Baumansicht nennen („Dateien“). |
| `renderItem` | `.render_item(..)` | `(entry: TreeEntry) => JSX.Element` | keiner | Der Inhalt einer Zeile, für die sichtbaren Zeilen; ohne ihn zeigt eine Zeile das Label des Eintrags. |
| `itemClass`, `itemStyle` | `.item_class(..)`, `.item_style(..)` | `string`, `StyleProp<TextStyle>` | keiner | Jede Zeile: ihre Höhe, ihr Padding, ihre Fläche und ihre Zustände (siehe unten); ihre Textstile wirken auf das Label. |
| `listClass`, `listStyle` | `.list_class(..)`, `.list_style(..)` | `string`, `StyleProp<ViewStyle>` | keiner | Die Scroll-View der Zeilen innerhalb der Baumansicht: ihr Padding und ihre Abstände. |
| `class`, `style` | Style-Methoden | `string`, `StyleProp<ViewStyle>` | keiner | Die Baumansicht selbst. Geben Sie ihr eine Höhe (oder `flex-1` in einem Parent, der eine hat): Die Zeilen scrollen darin, und nur die sichtbaren werden erzeugt. |

<a id="events"></a>

## Ereignisse

| Ereignis | Rust | Payload | Wann |
|---|---|---|---|
| `onExpandedChange` | `.on_expanded_change(..)` | `{ expanded: string[] }` | Der Nutzer hat einen Eintrag auf- oder zugeklappt (ein Klick, Return, Leertaste, Pfeil nach rechts oder links, `revealItem`): die aufgeklappten IDs, wie sie dann wären. |
| `onSelectedChange` | `.on_selected_change(..)` | `{ selected: string }` | Der Nutzer hat einen anderen Eintrag ausgewählt (ein Klick, die Pfeiltasten, Pos1, Ende, Typeahead). |
| `onExpand` | `.on_expand(..)` | `{ id: string }` | Der Nutzer hat den Eintrag von `id` aufgeklappt, nach `onExpandedChange`. |
| `onCollapse` | `.on_collapse(..)` | `{ id: string }` | Der Nutzer hat den Eintrag von `id` zugeklappt, nach `onExpandedChange`. |
| `onAction` | `.on_action(..)` | `{ id: string }` | Der Nutzer hat den Eintrag von `id` aktiviert: Return auf dem ausgewählten Eintrag, wenn er keine Kinder hat, oder ein Doppelklick oder Doppeltipp auf einen beliebigen Eintrag, nach den eigenen Ereignissen des Klicks. Deaktivierte Einträge und eine deaktivierte Baumansicht melden es nie. |

Die Auswahl folgt den Pfeiltasten, daher öffnet ein Datei-Explorer eine Datei in `onAction`, nicht in `onSelectedChange`: Wer sich durch die Dateien bewegt, sieht sie nacheinander in der Vorschau; Return oder ein Doppelklick öffnet die gewünschte.

```tsx
<Tree
  items={files}
  onSelectedChange={({ selected }) => preview.set(selected)}
  onAction={({ id }) => openFile(id)}
/>
```

<a id="parts"></a>

## Bestandteile

| Bestandteil | Enthalten in | Gestaltet mit | Zustände |
|---|---|---|---|
| Die Baumansicht | | `class`, `style` | |
| Die Liste | der Baumansicht | `listClass`, `listStyle` | |
| Eine Zeile | der Liste | `itemClass`, `itemStyle` | `selected:`, `aria-expanded:` (ein Ordner, der offen ist), `focus:` (solange die Baumansicht den Tastaturfokus hat, die Zeile, auf die die Tasten wirken: die ausgewählte Zeile, der zugeklappte Eintrag, unter dem eine verborgene Auswahl liegt, oder die erste Zeile, solange nichts ausgewählt ist), `disabled:`, `hover:`, `active:` |
| Der Inhalt einer Zeile | einer Zeile | `renderItem` | `group-selected:`, `group-aria-expanded:`, `group-focus:`, `group-disabled:` unter `group` in `itemClass` |

Zeigen Sie die ausgewählte Zeile mit `selected:` und die Stelle der Tastatur mit `focus:` (siehe [Design-Richtlinien](../docs/design-guides.md#interaction-states)). Zeichnen Sie den Fokus innerhalb der Zeile (`focus:outline-2 focus:-outline-offset-2`): Die Liste beschneidet, was über ihre Seiten hinausragt.

## Ref

| Methode | Beschreibung |
|---|---|
| `focus()` | Übernimmt den Tastaturfokus, so wie wenn Tab die Baumansicht erreicht. |
| `revealItem(id)` | Klappt die Einträge über dem Eintrag von `id` auf (gemeldet mit `onExpandedChange` und `onExpand`, der äußerste zuerst) und scrollt seine Zeile in den sichtbaren Bereich, sobald sie angezeigt wird: wenn die App der Änderung folgt, sofort; wenn nicht, endet die Anfrage dort. |

```tsx
let files: TreeRef | undefined;

<Tree ref={(r) => (files = r)} items={items} />;
files?.revealItem("src/ui/tree.rs");
```

<a id="disabled"></a>

## Deaktiviert

Ein deaktivierter Eintrag nimmt keine Klicks an, die Pfeiltasten überspringen ihn, und Screenreader kündigen ihn als abgeblendet an. `disabled` an der Baumansicht macht sie schreibgeschützt: Sie zeigt, was der Zustand der App vorgibt, und nimmt keine Eingaben an.

```tsx
<Tree items={items} disabled={locked()} itemClass="h-8 px-2 disabled:opacity-50" />
```

<a id="accessibility"></a>

## Barrierefreiheit

- Die Baumansicht hat die Rolle `"tree"`, benannt durch `accessibilityLabel`; jede Zeile ist ein `"treeitem"`, benannt durch das Label ihres Eintrags, mit ihrer Ebene (ihre Tiefe + 1), ob sie aufgeklappt ist (Ordner), ausgewählt und deaktiviert.
- Sobald die Baumansicht den Tastaturfokus erhält und sobald die Tasten die Auswahl bewegen, erhält die Zeile, auf die die Tasten wirken, den Fokus des Screenreaders.

Siehe [Barrierefreiheit](../docs/accessibility.md) für Labels, Rollen und Ansagen im Allgemeinen.

<a id="keyboard"></a>

## Tastatur

Auf den Desktops und im Web, wo Tab die Views erreicht, die Klicks annehmen, folgt ein `Tree` dem [WAI-ARIA tree view pattern](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/):

| Taste | Wirkung |
|---|---|
| Tab, Shift+Tab | Betritt die Baumansicht in einem Schritt und verlässt sie in einem Schritt; bei der Rückkehr setzen die Tasten an der ausgewählten Zeile an. Ist nichts ausgewählt, zeigt sich der Fokus auf der ersten Zeile, die mit Pfeil nach unten ausgewählt wird. |
| Pfeil nach unten, Pfeil nach oben | Wählt die nächste oder die vorherige Zeile aus, an deaktivierten Einträgen vorbei, von der letzten zur ersten und zurück. |
| Pfeil nach rechts | Klappt einen zugeklappten Ordner auf; bei einem aufgeklappten wählt sie sein erstes aktiviertes Kind aus. |
| Pfeil nach links | Klappt einen aufgeklappten Ordner zu; bei allem anderen wählt sie den Parent aus. |
| Pos1, Ende | Wählt die erste oder die letzte Zeile aus. |
| Return | Klappt den ausgewählten Ordner auf oder zu; bei einem Eintrag ohne Kinder wird er aktiviert (`onAction`). |
| Leertaste | Klappt den ausgewählten Ordner auf oder zu. |
| Buchstaben, Ziffern | Wählt die nächste Zeile aus, deren Label mit dem Eingegebenen beginnt. |

Solange die Auswahl unter einem zugeklappten Eintrag verborgen ist (die App hat ihn zugeklappt), wirken die Tasten auf die Zeile dieses Eintrags: Pfeil nach rechts oder Return klappt ihn auf, Pfeil nach unten wählt die Zeile danach aus.

In einem Right-to-left-Layout laufen die Zeilen von rechts, sodass Pfeil nach links und Pfeil nach rechts ihre Rollen tauschen, wie es das Pattern vorsieht: Pfeil nach links klappt einen Ordner auf und betritt ihn, Pfeil nach rechts klappt ihn zu und wählt den Parent aus. Pfeil nach oben, Pfeil nach unten, Pos1 und Ende behalten ihre Wirkung.

<a id="platform-notes"></a>

## Hinweise zu Plattformen

- iOS, Android und Mac Catalyst: Ein Tipp wählt eine Zeile aus und klappt einen Ordner auf oder zu; ein Doppeltipp aktiviert den Eintrag (`onAction`).
- Desktops (macOS, Windows, Linux, GPUI) und das Web: Ein Klick bewirkt dasselbe und gibt der Baumansicht den Tastaturfokus, und die oben genannten Tasten bewegen sich darin; ein Doppelklick aktiviert den Eintrag.
- Jede Plattform zeichnet, was die App gestaltet: die Baumansicht, ihre Zeilen und deren Inhalt.
