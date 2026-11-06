---
title: "Menü"
description: "Menu und ContextMenu mit MenuItem, MenuSeparator und Submenu: ein Popup mit kaskadierenden Untermenüs auf Desktops, ein Sheet mit Untermenüs an Ort und Stelle auf Smartphones, gestaltet von der App."
group: base
demo: el-menu
source_hash: 31bd57113d599fac
---


# Menü

Ein Menü ist eine Liste von Aktionen, die sein Auslöser öffnet. Eine Struktur dient jedem Gerät, dargestellt so, wie es jedes erwartet:

- Auf Desktops und in Desktop-Browsern erscheint ein Popup am Auslöser; ein `Submenu` öffnet sich kaskadierend neben seinem Eintrag, sobald der Zeiger darüber fährt oder darauf drückt.
- Auf Smartphones und Tablets erscheint ein Sheet am unteren Bildschirmrand über einem Backdrop; ein `Submenu` zeigt seine Einträge im Sheet anstelle derjenigen des Menüs, mit einer Zeile von dir an erster Stelle, die zurückführt.

Das Auswählen eines Eintrags, ein Druck außerhalb, Escape, die Zurück-Taste von Android und die Escape-Geste von VoiceOver schließen es. `ContextMenu` ist dasselbe Menü, geöffnet durch die sekundäre Taste (einen Rechtsklick) am Zeiger oder auf Touchscreens durch einen gehaltenen Finger auf seinem Auslöser.

```rust tabs
use nsh_base::{menu, menu_item, menu_separator, submenu};
use nsh_core::prelude::*;

fn item(label: &'static str, on_select: impl Fn() + 'static) -> impl IntoElement {
    menu_item()
        .on_select(on_select)
        .px_3()
        .py_2()
        .rounded_md()
        .child(text(label))
}

fn file_menu() -> impl IntoElement {
    menu()
        .offset(px(4.0))
        .trigger(view().px_3().py_2().child(text("File")))
        .child(item("New", || log::info!("new")))
        .child(item("Open…", || log::info!("open")))
        .child(menu_separator().h(px(1.0)).my_1().bg(rgb(0xe5e7eb)))
        .child(
            submenu()
                .trigger(view().px_3().py_2().child(text("Share ›")))
                .back(view().px_3().py_2().child(text("‹ Back")))
                .child(item("Mail", || log::info!("mail")))
                .child(item("Copy link", || log::info!("link"))),
        )
}
```

```tsx tabs
import { Text, View } from "nsh";
import { Menu, MenuItem, MenuSeparator, Submenu } from "nsh/base";

function Item(props: { label: string; onSelect: () => void }) {
  return (
    <MenuItem onSelect={props.onSelect} class="rounded-md px-3 py-2 hover:bg-gray-100 active:bg-gray-200">
      <Text>{props.label}</Text>
    </MenuItem>
  );
}

function FileMenu() {
  return (
    <Menu
      offset={4}
      popupClass="min-w-48 rounded-lg bg-white p-1 shadow-lg"
      backdropClass="bg-black/40"
      trigger={<View class="px-3 py-2"><Text>File</Text></View>}
    >
      <Item label="New" onSelect={newFile} />
      <Item label="Open…" onSelect={openFile} />
      <MenuSeparator class="my-1 h-px bg-gray-200" />
      <Submenu
        trigger={<View class="px-3 py-2"><Text>Share ›</Text></View>}
        back={<View class="px-3 py-2"><Text>‹ Back</Text></View>}
      >
        <Item label="Mail" onSelect={mail} />
        <Item label="Copy link" onSelect={copyLink} />
      </Submenu>
    </Menu>
  );
}
```

Alle fünf stammen aus [`nsh/base`](../modules/nsh-base.md). Die Einträge finden ihr Menü von selbst, sodass du sie frei anordnen kannst: Gruppen in Views, Beschriftungen, Einträge, die mit `If` erscheinen und verschwinden. `popupClass` gestaltet das Popup auf Desktops und das Sheet auf Smartphones; ein Stil, der sich zwischen beiden unterscheidet, kann `platform.idiom` (`nsh`) mit `"desktop"` vergleichen.

<a id="menu-bars"></a>

## Menüleisten

Menüs, deren Auslöser Einträge derselben `Toolbar` sind, bilden eine Menüleiste: Ist eines ihrer Menüs geöffnet, öffnet der Zeiger über dem Auslöser eines anderen Menüs dieses an seiner Stelle, und die Pfeiltasten wechseln zwischen den Auslösern.

```tsx
<Toolbar accessibilityLabel="Menu bar">
  <Menu trigger={<View><Text>File</Text></View>}>{/* … */}</Menu>
  <Menu trigger={<View><Text>Edit</Text></View>}>{/* … */}</Menu>
</Toolbar>
```

<a id="context-menus"></a>

## Kontextmenüs

```tsx
import { ContextMenu, MenuItem } from "nsh/base";

<ContextMenu
  popupClass="min-w-40 rounded-lg bg-white p-1 shadow-lg"
  backdropClass="bg-black/40"
  trigger={<PhotoTile photo={photo} />}
>
  <MenuItem onSelect={() => share(photo)}><Text>Share</Text></MenuItem>
  <MenuItem onSelect={() => remove(photo)}><Text>Delete</Text></MenuItem>
</ContextMenu>
```

Auf Desktops öffnet die sekundäre Taste es dort, wo sich der Zeiger befindet. Auf Touchscreens öffnet es ein auf dem Auslöser gehaltener Finger als Sheet; die eigenen Drücke des Auslösers und die umgebenden Scroll-Views funktionieren weiter, und eine Bewegung des Fingers bricht das Halten ab.

<a id="checkable-items"></a>

## Auswählbare Einträge

`checked` macht einen Eintrag auswählbar: eine Einstellung, die das Menü anzeigt („Seitenleiste anzeigen“), oder, mit `role="menuitemradio"`, eine Wahl aus einer Gruppe („Sortieren nach“). Der Wert gehört dir: Das Auswählen des Eintrags ruft `onSelect` auf, du setzt den nächsten Wert, und der Eintrag zeigt ihn an. Solange er ausgewählt ist, gelten seine `checked:`-Klassen und `checkedStyle` sowie die seines Indikators: des Teils vor seinem Inhalt (`indicatorClass`, `indicatorStyle`) um die Markierung, die du ihm gibst (`indicator`). Die Markierung wird einmal erzeugt und beibehalten; die `checked:`-Klassen des Indikators blenden sie ein und aus, oder die eigenen `group-checked:`-Klassen der Markierung mit `group` in `indicatorClass`. `closeOnSelect={false}` hält das Menü offen, sodass eine Einstellung ihren neuen Wert sofort zeigt.

```rust tabs
use nsh_base::{menu, menu_item};
use nsh_core::{element::StyleRefinement, prelude::*};

fn view_menu(sidebar: Signal<bool>, sort: Signal<&'static str>) -> impl IntoElement {
    // The indicator part shows the mark while the item is checked.
    let part = |s: StyleRefinement| s.w(px(16.0)).opacity(0.0).checked(|s| s.opacity(1.0));
    let by = move |label: &'static str| {
        menu_item()
            .role(AccessibilityRole::MenuItemRadio)
            .checked(move || Some(sort.get() == label))
            .indicator_style(part)
            .indicator(text("✓"))
            .on_select(move || sort.set(label))
            .flex_row()
            .gap_2()
            .px_3()
            .py_2()
            .child(text(label))
    };
    menu()
        .trigger(view().px_3().py_2().child(text("View")))
        .child(
            menu_item()
                .checked(move || Some(sidebar.get()))
                .close_on_select(false)
                .indicator_style(part)
                .indicator(text("✓"))
                .on_select(move || sidebar.set(!sidebar.get_untracked()))
                .flex_row()
                .gap_2()
                .px_3()
                .py_2()
                .child(text("Show sidebar")),
        )
        .child(by("Name"))
        .child(by("Date modified"))
}
```

```tsx tabs
import { Text, View, signal } from "nsh";
import { Menu, MenuItem } from "nsh/base";

// The indicator part shows the mark while the item is checked.
const part = "w-4 opacity-0 transition-opacity checked:opacity-100";

function ViewMenu() {
  const sidebar = signal(true);
  const sort = signal("Name");
  return (
    <Menu popupClass="min-w-48 rounded-lg bg-white p-1 shadow-lg" trigger={<View class="px-3 py-2"><Text>View</Text></View>}>
      <MenuItem
        checked={sidebar()}
        closeOnSelect={false}
        indicatorClass={part}
        indicator={<Text>✓</Text>}
        onSelect={() => sidebar.set(!sidebar())}
        class="flex-row gap-2 rounded-md px-3 py-2 hover:bg-gray-100"
      >
        <Text>Show sidebar</Text>
      </MenuItem>
      <Each of={["Name", "Date modified", "Size"]}>
        {(by) => (
          <MenuItem
            role="menuitemradio"
            checked={sort() === by()}
            indicatorClass={part}
            indicator={<Text>✓</Text>}
            onSelect={() => sort.set(by())}
            class="flex-row gap-2 rounded-md px-3 py-2 hover:bg-gray-100 checked:font-semibold"
          >
            <Text>{by()}</Text>
          </MenuItem>
        )}
      </Each>
    </Menu>
  );
}
```

Eine Markierung am hinteren Rand gehört stattdessen in den Inhalt und wird mit `group-checked:`-Klassen unter `group` am Eintrag gestaltet.

<a id="entrance-and-exit"></a>

## Ein- und Ausblenden

Auf Desktops erscheint und verschwindet das Popup mit deinen Übergängen, wie bei einem [Popover](./popover.md#entrance-and-exit): `popupStartingClass` ist sein Aussehen im ersten Frame, `popupEndingClass` sein Aussehen im geschlossenen Zustand, das es beibehält, solange die `transition-*`-Klassen von `popupClass` laufen, und `onClose` folgt. Untermenüs übernehmen dieselben Aussehen und schließen mit ihrem Menü. Das Sheet auf Smartphones gleitet von selbst ein und aus.

```tsx
<Menu
  popupClass="min-w-40 rounded-lg bg-white p-1 shadow-lg transition-all duration-100"
  popupStartingClass="opacity-0 -translate-y-1"
  popupEndingClass="opacity-0"
  trigger={<Text>File</Text>}
>
  <MenuItem onSelect={newFile}><Text>New</Text></MenuItem>
</Menu>
```

<a id="open-state"></a>

## Offener Zustand

Ohne `open` verwaltet ein Menü seinen Zustand selbst (ab `defaultOpen` für `Menu`). Mit `open` gehört der Zustand der App, und sie ändert ihn in `onOpenChange({ open, reason })`: `"triggerPress"`, `"select"`, `"pressOutside"`, `"backdropPress"`, `"cancel"`, `"contextMenu"` oder `"longPress"`.

## Props

### Menu

| Prop | Rust | Typ | Standard | Beschreibung |
|---|---|---|---|---|
| `open` | `.open(..)` | `boolean` | keiner | Geöffnet, von der App gesteuert. |
| `defaultOpen` | `.default_open(..)` | `boolean` | `false` | Anfangs geöffnet, ohne `open`. |
| `placement` | `.placement(..)` | `"top" \| "bottom" \| "left" \| "right"` | `"bottom"` | Desktops: die Seite des Auslösers, auf der es erscheint. |
| `align` | `.align(..)` | `"start" \| "center" \| "end"` | `"start"` | Desktops: wie es sich am Auslöser ausrichtet. |
| `offset` | `.offset(..)` | `number` | `0` | Desktops: der Abstand zwischen Auslöser und Popup. |
| `margin` | `.margin(..)` | `number` | `0` | Desktops: der Abstand, den es zu den Rändern des sicheren Bereichs einhält. |
| `popupClass`, `popupStyle` | `.popup_class(..)`, `.popup_style(..)` | `string`, `StyleProp<ViewStyle>` | keiner | Das Popup (Desktops) oder das Sheet (Smartphones) sowie die Popups der Untermenüs. |
| `popupStartingClass`, `popupStartingStyle` | `.popup_starting_class(..)`, `.popup_starting_style(..)` | `string`, `StyleProp<ViewStyle>` | keiner | Desktops: das Aussehen der Popups im ersten Frame, über ihrem eigenen. |
| `popupEndingClass`, `popupEndingStyle` | `.popup_ending_class(..)`, `.popup_ending_style(..)` | `string`, `StyleProp<ViewStyle>` | keiner | Desktops: das Aussehen der Popups im geschlossenen Zustand, beibehalten, solange ihre Übergänge laufen. |
| `backdropClass`, `backdropStyle` | `.backdrop_class(..)`, `.backdrop_style(..)` | `string`, `StyleProp<ViewStyle>` | keiner | Smartphones: der Backdrop hinter dem Sheet. |
| `trigger` | `.trigger(..)` | `JSX.Element` | keiner | Was es beim Drücken öffnet. Solange das Menü geöffnet ist, gelten seine `aria-expanded:`-Klassen und `expandedStyle`. |
| `children` | `.child(..)` | `JSX.Element` | keiner | Die Einträge, bei jedem Öffnen neu erzeugt. |

### ContextMenu

`open`, `popupClass` / `popupStyle`, die Anfangs- und Endaussehen, `backdropClass` / `backdropStyle`, `trigger` und `children` wie bei `Menu`, und:

| Prop | Rust | Typ | Standard | Beschreibung |
|---|---|---|---|---|
| `disabled` | `.disabled(..)` | `boolean` | `false` | Die sekundäre Taste und gehaltene Finger bewirken nichts. |
| `offset` | `.offset(..)` | `number` | `0` | Desktops: der Abstand zwischen Zeiger und Popup. |
| `margin` | `.margin(..)` | `number` | `0` | Desktops: der Abstand, den es zu den Rändern des sicheren Bereichs einhält. |

### MenuItem

| Prop | Rust | Typ | Standard | Beschreibung |
|---|---|---|---|---|
| `disabled` | `.disabled(..)` | `boolean` | `false` | Nicht auswählbar; `disabled:`-Stile gelten. |
| `checked` | `.checked(..)` | `boolean` | keiner | Ausgewählt oder nicht, was ihn zu einem auswählbaren Eintrag macht; gehört der App. |
| `checkedStyle` | `.checked_style(..)` | `StyleProp<ViewStyle>` | keiner | Sein Stil im ausgewählten Zustand, als `checked:`-Klassen. |
| `role` | `.role(..)` | `AccessibilityRole` | `"menuitemcheckbox"` mit `checked`, sonst `"menuitem"` | Was er für Screenreader ist; `"menuitemradio"` für eine Wahl aus einer Gruppe. |
| `indicatorClass`, `indicatorStyle` | `.indicator_class(..)`, `.indicator_style(..)` | `string`, `StyleProp<ViewStyle>` | keiner | Der Indikator, der Teil vor seinem Inhalt; seine `checked:`- und `disabled:`-Klassen folgen dem Eintrag. |
| `indicator` | `.indicator(..)` | `JSX.Element` | keiner | Die Markierung im Indikator. |
| `closeOnSelect` | `.close_on_select(..)` | `boolean` | `true` | Das Auswählen schließt das Menü. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | keiner | Was Screenreader sagen, wenn der Inhalt nicht ausreicht. |
| `children`, `class`, `style` | `.child(..)`, Stilmethoden | | keiner | Sein Inhalt und Aussehen, mit den Zuständen `hover:`, `active:` und `checked:`. |

### Submenu

| Prop | Rust | Typ | Standard | Beschreibung |
|---|---|---|---|---|
| `trigger` | `.trigger(..)` | `JSX.Element` | keiner | Der Eintrag, der es öffnet. |
| `back` | `.back(..)` | `JSX.Element` | keiner | Smartphones: die Zeile über seinen Einträgen, die zu den umgebenden Einträgen zurückführt. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Es öffnet sich nicht. |
| `offset` | `.offset(..)` | `number` | `0` | Desktops: der Abstand zwischen dem umgebenden Menü und seinem Popup. |
| `children` | `.child(..)` | `JSX.Element` | keiner | Seine Einträge. |

`MenuSeparator` ist eine View, die du gestaltest (`class`, `style`) und die mit den Einträgen ihrer Ebene angezeigt wird.

## Events

| Event | Rust | Beschreibung |
|---|---|---|
| `onOpenChange` (`Menu`, `ContextMenu`) | `.on_open_change(\|e\| ..)` | Es wurde geöffnet oder geschlossen, mit dem Grund. |
| `onOpen` (`Menu`, `ContextMenu`) | `.on_open(\|\| ..)` | Es wird angezeigt; als Sheet, sobald es eingeglitten ist. |
| `onClose` (`Menu`, `ContextMenu`) | `.on_close(\|\| ..)` | Es ist verschwunden: als Sheet, sobald es hinausgeglitten ist, als Popup nach seinem Ausblenden. Auch dann, wenn die App es geschlossen hat. |
| `onPosition` (`Menu`, `ContextMenu`) | `.on_position(\|e\| ..)` | Desktops: das Popup wurde platziert: `placement` (die Seite, auf der es erschien), `bounds`, `available`. |
| `onCancel` (`Menu`, `ContextMenu`) | `.on_cancel(\|\| ..)` | Der Nutzer hat versucht, es zu schließen, ohne etwas auszuwählen (Escape oder Zurück, ein Druck außerhalb oder auf den Backdrop). |
| `onSelect` (`MenuItem`) | `.on_select(\|\| ..)` | Der Eintrag wurde ausgewählt; ein auswählbarer Eintrag fragt nach seinem anderen Wert. |

<a id="accessibility"></a>

## Barrierefreiheit

Für Screenreader sind das Popup oder Sheet ein Menü und seine Einträge Menüeinträge; der Auslöser gibt an, ob das Menü aufgeklappt ist. Ein auswählbarer Eintrag ist ein Checkbox- oder Radio-Menüeintrag und wird als ausgewählt oder nicht ausgewählt vorgelesen; sein Indikator gehört zum Eintrag. In TSX ist der Auslöser das Element, das du übergibst, ein `Button` oder eine eigene View: Es übernimmt die Drücke und den Aufklappzustand selbst, sodass seine eigenen `active:`-Klassen und `activeStyle` während des Drückens gelten und sein eigenes `onPress` ebenfalls läuft. Nur die Einträge der gerade angezeigten Ebene sind auf dem Bildschirm, sodass Screenreader vorlesen, was dort vorhanden ist.
