---
title: "Command"
description: "Command: eine Befehlspalette, ein Suchfeld über die Befehle der App, das beim Tippen des Nutzers gefiltert wird: eine Cmd+K-Palette in einem Dialog, ein Inline-Befehlsmenü, eine Suche, die die App beantwortet. Virtualisiert, tastaturorientiert, mit einer Listbox für Screenreader. Das Erscheinungsbild jedes Teils bestimmt die App."
group: base
demo: el-command
source_hash: b1a002e27d282723
---


# Command

Eine Command Palette ist ein Suchfeld über einer Liste von Befehlen: Der Benutzer tippt ein paar Buchstaben, die Liste wird auf die passenden Befehle eingeengt, die Pfeiltasten bewegen die Hervorhebung, und die Eingabetaste führt den hervorgehobenen Befehl aus. `Command` übernimmt das Verhalten einer solchen Palette: Filtern, Abschnitte, die Hervorhebung, die Tastatur und das, was Screenreader vorlesen. Das Filtern läuft nativ, und die Zeilen sind virtualisiert: Nur die sichtbaren Zeilen werden erzeugt, sodass eine Palette mit Tausenden von Befehlen, Dateien oder Emojis bei jedem Tastendruck filtert. Das Aussehen bestimmt die App: Der Command zeichnet nichts selbst, die App gestaltet jeden Teil (`itemClass`, `groupClass`, `searchClass`, ...) und zeichnet den Inhalt der Zeilen (`renderItem`: ein Icon, das Label, die Tasten des Shortcuts).

```rust tabs
use nsh_base::{CommandEntry, CommandItem, command, theme};
use nsh_core::prelude::*;

fn palette() -> impl IntoElement {
    let items = vec![
        CommandItem::new("new", "New File").group("File").shortcut("mod+n"),
        CommandItem::new("open", "Open…").group("File").shortcut("mod+o"),
        CommandItem::new("theme", "Toggle Theme").group("View").keywords(["dark", "light"]),
        CommandItem::new("settings", "Settings").group("View").shortcut("mod+,"),
    ];
    let chosen = signal(SharedString::from("none"));
    command()
        .items(items)
        .placeholder("Type a command or search…")
        .accessibility_label("Commands")
        .auto_focus(true)
        .on_select(move |id: &SharedString| chosen.set(id.clone()))
        .empty(text("No results.").text_color(move || theme().muted_foreground))
        .h(px(360.0))
        .render_item(|entry: &CommandEntry| {
            view()
                .flex_row()
                .items_center()
                .h_8()
                .px_2()
                .child(text(entry.label.clone()).flex_1())
                .child(
                    text(entry.shortcut_label.clone().unwrap_or_default())
                        .text_color(move || theme().muted_foreground),
                )
        })
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { Command, type CommandItem } from "nsh/base";

const commands: CommandItem[] = [
  { id: "new", label: "New File", group: "File", shortcut: "mod+n" },
  { id: "open", label: "Open…", group: "File", shortcut: "mod+o" },
  { id: "theme", label: "Toggle Theme", group: "View", keywords: ["dark", "light"] },
  { id: "settings", label: "Settings", group: "View", shortcut: "mod+," },
];

function App() {
  const chosen = signal("none");
  return (
    <Command
      items={commands}
      placeholder="Type a command or search…"
      accessibilityLabel="Commands"
      searchAccessibilityLabel="Search commands"
      autoFocus
      onSelect={({ id }) => chosen.set(id)}
      class="w-96 overflow-hidden rounded-lg border border-border bg-popover"
      searchBarClass="flex-row items-center gap-2 border-b border-border px-3"
      searchClass="h-11 flex-1 text-sm text-foreground placeholder:text-muted-foreground"
      listClass="max-h-80 p-1"
      groupClass="px-2 py-1.5 text-xs font-medium text-muted-foreground"
      separatorClass="-mx-1 my-1 h-px bg-border"
      itemClass="group h-8 flex-row items-center rounded-md px-2 focus:bg-accent disabled:opacity-50"
      empty={<Text class="py-6 text-center text-sm text-muted-foreground">No results.</Text>}
      renderItem={(entry) => (
        <View class="flex-1 flex-row items-center gap-2">
          <Text class="flex-1 text-sm text-foreground group-focus:text-accent-foreground">{entry.label}</Text>
          <Text class="text-xs text-muted-foreground">{entry.shortcutLabel ?? ""}</Text>
        </View>
      )}
    />
  );
}

mount(App);
```

`Command` stammt von [`nsh/base`](../modules/nsh-base.md), dem `nsh-base`-Crate in Rust. Die Abfrage gehört der App, wenn sie `query` setzt und in `onQueryChange` aktualisiert; ohne dieses Prop behält das Suchfeld seine eigene Abfrage, beginnend mit `defaultQuery`. Items werden anhand ihrer `id` identifiziert, der eigenen der App, nie anhand ihres Labels: `onSelect({ id })` gibt an, welches der Benutzer gewählt hat. In Rust erzeugt `command()` den Command, mit einem Setter pro Prop (`.items(..)`, `.query(..)`, `.render_item(..)`), einer Listener-Methode pro Event und den typisierten Style-Methoden.

<a id="items"></a>

## Einträge

`items` sind die Befehle in ihrer Reihenfolge, jeweils ein `CommandItem`:

| Feld | Typ | Beschreibung |
|---|---|---|
| `id` | `string` | Was ihn in `onSelect` und `onHighlightChange` identifiziert: eindeutig unter den Items. |
| `label` | `string` | Was seine Zeile zeigt, sofern `renderItem` sie nicht zeichnet, was Screenreader vorlesen und was die Abfrage abgleicht. |
| `keywords` | `string[]` | Weitere Wörter, die die Abfrage abgleicht: Synonyme, ein englischer Name neben einem übersetzten Label. |
| `group` | `string` | Sein Abschnitt: Benachbarte Items einer Gruppe erscheinen unter einem Header mit dieser Überschrift. |
| `shortcut` | `string` | Der Tastenschlag desselben Befehls, wie [`keymap`](../modules/nsh.md#keymap) ihn benennt (`"mod+shift+p"`), damit seine Zeile ihn anzeigt. Die App bindet ihn mit `keymap.bind`. |
| `disabled` | `boolean` | Er kann nicht gewählt werden: Die Tasten überspringen ihn, Klicks bewirken nichts, `disabled:`-Styles greifen. |
| `checked` | `boolean` | Er ist der gerade wirksame (ein Theme, eine Sprache): `checked:`-Styles greifen, und Screenreader melden ihn als aktiviert. |

Die Abfrage passt auf ein Item, wenn sein Label oder eines seiner Keywords sie enthält, ohne Beachtung der Groß- und Kleinschreibung und der umgebenden Leerzeichen. Die Items behalten ihre Reihenfolge, und ein Abschnitt ohne Treffer verschwindet samt Header. `renderItem` erhält für jede sichtbare Zeile ein `CommandEntry`: die Felder des Items und `shortcutLabel`, sein `shortcut`, wie Hinweise es hier anzeigen (`⇧⌘P` auf Apple-Plattformen, `Ctrl+Shift+P` sonst). Es beschreibt, was das Item ist, und die Hervorhebung ist der `focus:` der Zeile: Die Darstellung wird einmal pro Item erzeugt und behält ihre Views, während die Hervorhebung wandert.

## Props

| Prop | Rust | Typ | Standard | Beschreibung |
|---|---|---|---|---|
| `items` | `.items(..)` | `CommandItem[]` | `[]` | Die Befehle in ihrer Reihenfolge. |
| `query` | `.query(..)` | `string` | keiner | Die Abfrage (kontrolliert), die die App in `onQueryChange` setzt. |
| `defaultQuery` | `.default_query(..)` | `string` | keiner | Die Abfrage zu Beginn, solange `query` nicht gesetzt ist. |
| `searchable` | `.searchable(..)` | `boolean` | `true` | Ein Suchfeld über den Zeilen. Ohne es erscheint jedes Item, und der Command ist ein Halt des Tastaturfokus mit Typeahead. |
| `filterable` | `.filterable(..)` | `boolean` | `true` | Die Abfrage filtert die Items. Ist es ausgeschaltet, erscheint jedes Item: für eine Suche, die die App selbst beantwortet (die Ergebnisse eines Servers, gesetzt als `items`). Eine neue Abfrage hebt weiterhin das erste Item hervor. |
| `loading` | `.loading(..)` | `boolean` | `false` | Eine Suche läuft: `empty` wartet, und die Liste ist für Screenreader als beschäftigt markiert. Zeige deinen Indikator in `searchSuffix`. |
| `placeholder` | `.placeholder(..)` | `string` | keiner | Der Platzhalter des Suchfelds. |
| `autoFocus` | `.auto_focus(..)` | `boolean` | `false` | Das Suchfeld erhält den Tastaturfokus, sobald es angezeigt wird: eine Palette, die sich zum Tippen öffnet. |
| `separator` | `.separator(..)` | `boolean` | `true` | Eine Trennzeile zwischen zwei angezeigten Abschnitten, gestaltet über `separatorClass`; nie als erste, letzte oder doppelt. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | keiner | Wie Screenreader die Liste nennen („Befehle“), und das Suchfeld, solange `searchAccessibilityLabel` nicht gesetzt ist. |
| `searchAccessibilityLabel` | `.search_accessibility_label(..)` | `string` | `accessibilityLabel` | Wie Screenreader das Suchfeld nennen: was es durchsucht („Befehle durchsuchen“). |
| `header`, `footer` | `.header(..)`, `.footer(..)` | `JSX.Element` | keiner | Was über dem Suchfeld (ein Titel) und unter den Zeilen (die Tastenhinweise, eine Anzahl) erscheint. |
| `empty` | `.empty(..)` | `JSX.Element` | keiner | Was erscheint, solange kein Item angezeigt wird: eine Abfrage ohne Treffer, keine Items. |
| `searchPrefix`, `searchSuffix` | `.search_prefix(..)`, `.search_suffix(..)` | `JSX.Element` | keiner | Was vor und nach dem Suchfeld in seiner Leiste erscheint: ein Such-Icon, ein Spinner, solange `loading`. |
| `renderItem` | `.render_item(..)` | `(entry: CommandEntry) => JSX.Element` | keiner | Der Inhalt einer Zeile, für die sichtbaren Zeilen; ohne ihn zeigt eine Zeile das Label des Items. |
| `renderGroup` | `.render_group(..)` | `(group: CommandGroup) => JSX.Element` | keiner | Der Header eines Abschnitts (`{ heading }`); ohne ihn zeigt ein Header seine Überschrift. |
| `class`, `style` | Style-Methoden | `string`, `StyleProp<ViewStyle>` | keiner | Der Command selbst: seine Größe, sein Rahmen und seine Oberfläche. |
| `searchBarClass`, `searchBarStyle` | `.search_bar_class(..)`, `.search_bar_style(..)` | `string`, `StyleProp<ViewStyle>` | keiner | Die Zeile von `searchPrefix`, dem Suchfeld und `searchSuffix`. |
| `searchClass`, `searchStyle` | `.search_class(..)`, `.search_style(..)` | `string`, `StyleProp<TextStyle>` | keiner | Das Suchfeld. |
| `listClass`, `listStyle` | `.list_class(..)`, `.list_style(..)` | `string`, `StyleProp<ViewStyle>` | keiner | Die Scroll-View der Zeilen. Gib ihr eine Höhe (`max-h-80` oder einen Command mit fester Größe): Die Zeilen scrollen darin, und nur die sichtbaren werden erzeugt. |
| `itemClass`, `itemStyle` | `.item_class(..)`, `.item_style(..)` | `string`, `StyleProp<TextStyle>` | keiner | Die Zeile jedes Items und ihre Zustände (siehe unten); ihre Textstile erreichen das Label. |
| `groupClass`, `groupStyle` | `.group_class(..)`, `.group_style(..)` | `string`, `StyleProp<TextStyle>` | keiner | Der Header jedes Abschnitts. |
| `separatorClass`, `separatorStyle` | `.separator_class(..)`, `.separator_style(..)` | `string`, `StyleProp<ViewStyle>` | keiner | Jede Trennzeile: Höhe und Farbe einer Linie. |

## Events

| Event | Rust | Payload | Wann |
|---|---|---|---|
| `onSelect` | `.on_select(..)` | `{ id: string }` | Der Benutzer hat ein Item gewählt: Eingabetaste oder ein Klick auf seine Zeile. |
| `onHighlightChange` | `.on_highlight_change(..)` | `{ highlighted: string \| null }` | Die Hervorhebung hat sich bewegt (die Tasten, der Zeiger, eine neue Abfrage oder neue Items, `highlight`): um vorab zu zeigen, was die Eingabetaste ausführen würde. |
| `onQueryChange` | `.on_query_change(..)` | `{ query: string }` | Der Benutzer hat im Suchfeld getippt, oder Escape hat es geleert. |
| `onCancel` | `.on_cancel(..)` | keiner | Escape bei leerer Abfrage: schließt, was den Command enthält (`open` eines Dialogs). |

<a id="parts"></a>

## Teile

| Part | Enthalten in | Gestaltet mit | Zustände |
|---|---|---|---|
| Der Command | | `class`, `style` | |
| `header` | dem Command | dem Element der App | |
| Die Suchleiste | dem Command | `searchBarClass`, `searchBarStyle` | |
| `searchPrefix`, das Suchfeld, `searchSuffix` | der Suchleiste | den Elementen der App; `searchClass`, `searchStyle` | der `focus:` des Felds |
| Die Liste | dem Command | `listClass`, `listStyle` | |
| Der Header eines Abschnitts | der Liste | `groupClass`, `groupStyle`, `renderGroup` | |
| Eine Trennzeile | der Liste | `separatorClass`, `separatorStyle` | |
| Eine Zeile | der Liste | `itemClass`, `itemStyle` | `focus:` (hervorgehoben), `checked:`, `disabled:`, `hover:`, `active:` |
| Der Inhalt einer Zeile | einer Zeile | `renderItem` | `group-focus:`, `group-checked:`, `group-disabled:` unter `group` in `itemClass` |
| `empty` | dem Command | dem Element der App | |
| `footer` | dem Command | dem Element der App | |

Zeige die hervorgehobene Zeile mit `focus:` (siehe [Design-Leitfäden](../docs/design-guides.md#interaction-states)).

## Ref

| Methode | Beschreibung |
|---|---|
| `focus()` | Gibt dem Suchfeld den Tastaturfokus (ohne Suchfeld dem Command). |
| `highlight(id)` | Hebt das Item von `id` hervor und scrollt seine Zeile in den sichtbaren Bereich; ein nicht angezeigtes oder deaktiviertes Item bleibt unverändert. |
| `matchedCount()` | `Promise<number>`: wie viele Items die Abfrage anzeigt, deaktivierte eingeschlossen. |

```tsx
let palette: CommandRef | undefined;

<Command ref={(r) => (palette = r)} items={items} />;
palette?.focus();
```

<a id="a-palette-in-a-dialog"></a>

## Eine Palette in einem Dialog

Setze den Command in einen [`Dialog`](./dialog.md) und öffne ihn mit dem Shortcut der App. Escape leert zuerst die Abfrage; bei leerer Abfrage löst es `onCancel` aus, wo die App den Dialog schließt.

```tsx
import { keymap } from "nsh";

const open = signal(false);
keymap.bind("mod+k", () => open.set(!open()));

<Dialog open={open()} onOpenChange={({ open: next }) => open.set(next)}>
  <Command
    items={commands}
    autoFocus
    onCancel={() => open.set(false)}
    onSelect={({ id }) => {
      open.set(false);
      run(id);
    }}
  />
</Dialog>;
```

<a id="a-search-the-app-answers"></a>

## Eine Suche, die die App beantwortet

Mit `filterable={false}` erscheint jedes Item, das die App liefert: Die App sucht in `onQueryChange` (ein Server, eine Datenbank) und setzt `items` mit den Ergebnissen, `loading`, solange sie wartet.

```tsx
<Command
  items={results()}
  filterable={false}
  loading={searching()}
  onQueryChange={({ query }) => search(query)}
  searchSuffix={searching() ? <Spinner /> : undefined}
  empty={<Text>No matches</Text>}
/>
```

<a id="accessibility"></a>

## Barrierefreiheit

- Die Liste hat die Rolle `"listbox"`, benannt durch `accessibilityLabel`; jede Zeile ist ein `"option"`, benannt durch das Label ihres Items, aktiviert und deaktiviert wie ihr Item; der Header eines Abschnitts ist ein `"header"`, eine Trennzeile ist ausgeblendet.
- Das Suchfeld ist ein Textfeld, benannt durch `searchAccessibilityLabel` (sonst `accessibilityLabel`); sein Platzhalter ist ein Hinweis, der angezeigt wird, solange es leer ist.
- Das Suchfeld behält den Tastaturfokus, während die Pfeiltasten die Hervorhebung bewegen, und Screenreader lesen das Label der hervorgehobenen Zeile vor. Ohne Suchfeld erhält die hervorgehobene Zeile den Fokus des Screenreaders.
- Während `loading`, ist die Liste als beschäftigt markiert.

Allgemeines zu Labels, Rollen und Ansagen findest du unter [Barrierefreiheit](../docs/accessibility.md).

<a id="keyboard"></a>

## Tastatur

| Taste | Was sie bewirkt |
|---|---|
| Tippen | Filtert die Items; der erste aktivierte Treffer wird hervorgehoben. |
| Pfeil nach unten, Pfeil nach oben | Hebt das nächste oder das vorherige Item hervor, an deaktivierten vorbei, vom letzten zum ersten und zurück. |
| Bild runter, Bild hoch | Bewegt die Hervorhebung um die sichtbaren Zeilen. |
| Eingabetaste | Wählt das hervorgehobene Item (`onSelect`). |
| Escape | Leert die Abfrage; bei leerer Abfrage meldet es `onCancel`. |
| Pos1, Ende | Ohne Suchfeld: das erste oder das letzte Item (im Feld bewegen sie dessen Textcursor). |
| Leertaste, Buchstaben, Ziffern | Ohne Suchfeld: Die Leertaste wählt, Buchstaben und Ziffern heben per Typeahead hervor. |

<a id="platform-notes"></a>

## Hinweise zu den Plattformen

- Desktops (macOS, Windows, Linux, GPUI) und das Web: Der Zeiger hebt die Zeile hervor, über die er fährt, und ein Klick wählt, sobald die Taste gedrückt wird, sodass das Suchfeld den Tastaturfokus behält.
- iOS, Android und Mac Catalyst: Ein Tipp wählt eine Zeile, und die Return-Taste der Tastatur wählt das hervorgehobene Item und behält das Feld für die nächste Abfrage.
- Jede Plattform zeichnet, was die App gestaltet: den Command, seine Suchleiste, seine Zeilen und deren Inhalt.
