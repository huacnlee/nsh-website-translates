---
title: "Select"
description: "Die Select-Komponente: ein Wert, der aus einer Liste von Elementen ausgewählt wird, mit einem Popup am Auslöser auf dem Desktop und einem Sheet auf Smartphones, mit Tastaturbedienung, Typeahead, Suche und Abschnitten, gestaltet von der App."
group: base
demo: el-select
source_hash: 2fc7845fec15f74b
---


# Select

Ein Select wählt einen Wert aus einer Liste von Elementen: eine Einstellung, einen Filter, ein Land, eine Zeitzone. Der Trigger der App öffnet die Liste, dargestellt so, wie es jedes Gerät erwartet:

- Auf Desktops und in Desktop-Browsern ein Popup über dem Trigger, wobei die gewählte Zeile über dem Trigger liegt, sodass der gewählte Titel an seiner Stelle bleibt (die Position `item-aligned` von shadcn/ui). Es ist so breit wie der Trigger (die Breite `popupStyle` / `popupClass` der App legt eine andere fest, wie bei `gpui-component` mit `menu_width`) und so hoch wie seine Zeilen, bis zum verfügbaren Platz auf dem Bildschirm. Ohne Auswahl öffnet es sich unterhalb des Triggers. Die Tastatur bewegt sich durch die Elemente und wählt eines aus.
- Auf Smartphones und Tablets ein Sheet am unteren Bildschirmrand über einem Backdrop.

Das Select besitzt das Verhalten: den Wert (den der App oder seinen eigenen), den Öffnungszustand, die Tastatur, Typeahead, Suche, Abschnitte, die hervorgehobene Zeile und das, was Screenreader ansagen. Das Aussehen ist Sache der App: Sie gestaltet den Trigger, das Popup, die Liste, die Zeilen, die Header der Abschnitte und das Suchfeld oder zeichnet die Zeilen selbst.

```rust tabs
use nsh_base::{SelectEntry, SelectItem, select, theme};
use nsh_core::prelude::*;

const FRUITS: [(&str, &str); 5] = [
    ("apple", "Apple"),
    ("banana", "Banana"),
    ("blueberry", "Blueberry"),
    ("grapes", "Grapes"),
    ("pineapple", "Pineapple"),
];

fn fruit_select() -> impl IntoElement {
    let fruit = signal(None::<SharedString>);
    let title = move || {
        let chosen = fruit.get();
        FRUITS
            .iter()
            .find(|(value, _)| Some(*value) == chosen.as_deref())
            .map_or("Pick a fruit", |(_, title)| *title)
            .to_string()
    };
    select()
        .items(
            FRUITS
                .iter()
                .map(|&(value, title)| SelectItem::new(value, title).disabled(value == "grapes"))
                .collect::<Vec<_>>(),
        )
        .value(move || fruit.get())
        .on_change(move |next: &Option<SharedString>| fruit.set(next.clone()))
        .accessibility_label("Fruit")
        .offset(px(4.0))
        .popup_style(|s| {
            s.p_1()
                .rounded_lg()
                .border_1()
                .border_color(move || theme().border)
                .bg(move || theme().popover)
                .text_color(move || theme().popover_foreground)
                .shadow_md()
        })
        .item_class("rounded-md focus:bg-accent selected:font-medium disabled:opacity-50")
        .trigger(
            view()
                .h_9()
                .w_48()
                .flex_row()
                .items_center()
                .justify_between()
                .px_3()
                .rounded_md()
                .border_1()
                .border_color(move || theme().input)
                .hover(|s| s.bg(move || theme().accent))
                .child(text(title))
                .child(text("▾").text_color(move || theme().muted_foreground)),
        )
        .render_item(|item: &SelectEntry| {
            view()
                .flex_row()
                .items_center()
                .px_2()
                .py_1p5()
                .child(text(item.title.clone()).text_sm())
        })
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { Select } from "nsh/base";

const FRUITS = [
  { value: "apple", title: "Apple" },
  { value: "banana", title: "Banana" },
  { value: "blueberry", title: "Blueberry" },
  { value: "grapes", title: "Grapes", disabled: true },
  { value: "pineapple", title: "Pineapple" },
];

function App() {
  const fruit = signal<string | null>(null);
  const title = () => FRUITS.find((f) => f.value === fruit())?.title;
  return (
    <Select
      items={FRUITS}
      value={fruit()}
      onChange={({ value }) => fruit.set(value)}
      accessibilityLabel="Fruit"
      offset={4}
      popupClass="rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-md"
      backdropClass="bg-black/40"
      itemClass="rounded-md px-2 py-1.5 text-sm focus:bg-accent focus:text-accent-foreground disabled:opacity-50"
      trigger={
        <View class="h-9 w-48 flex-row items-center justify-between rounded-md border border-input px-3 hover:bg-accent active:bg-accent focus-visible:ring-2 focus-visible:ring-ring">
          <Text class={fruit() ? "text-foreground" : "text-muted-foreground"}>{title() ?? "Pick a fruit"}</Text>
          <Text class="text-muted-foreground">▾</Text>
        </View>
      }
    />
  );
}

mount(App);
```

`Select` kommt aus [`nsh/base`](../modules/nsh-base.md), dem `nsh-base`-Crate in Rust. In Rust erzeugt `select()` eines mit einem Setter pro Prop (`.items(..)`, `.value(..)`, `.item_style(..)`) und einem Listener pro Event (`.on_change(..)`); `SelectItem::new(value, title)` erzeugt ein Element, mit `.disabled(..)` und `.group(..)`.

<a id="items"></a>

## Elemente

`items` ist die Liste als Daten: Jedes Element hat einen `value` (eindeutig unter den Elementen: das, was seine Auswahl setzt), einen `title` (was seine Zeile zeigt, worauf Suche und Typeahead passen und was Screenreader sagen) und optional `disabled` und einen `group`. Benachbarte Elemente mit demselben `group` bilden einen Abschnitt unter einem Header mit diesem Titel:

```tsx
<Select
  items={[
    { value: "lisbon", title: "Lisbon", group: "Europe" },
    { value: "london", title: "London", group: "Europe" },
    { value: "tokyo", title: "Tokyo", group: "Asia" },
    { value: "seoul", title: "Seoul", group: "Asia", disabled: true },
  ]}
  groupClass="px-2 pb-1 pt-2 text-xs text-muted-foreground"
  trigger={trigger}
/>
```

Die Zeilen sind eine virtualisierte Liste in der Scroll-View des Popups: Eine Liste mit Tausenden Elementen erzeugt nur die Zeilen im sichtbaren Bereich, und das Popup scrollt, wenn seine Zeilen höher sind als der verfügbare Platz.

<a id="value"></a>

## Wert

Mit `value` gehört das gewählte Element der App: Das Select zeigt das Element dieses Werts und meldet eine Auswahl mit `onChange({ value })`; die App setzt `value`, um ihr zu folgen, oder behält ihren eigenen Wert. `value={null}` bedeutet, dass nichts gewählt ist. Wird es weggelassen, behält das Select seinen eigenen Wert, zunächst aus `defaultValue`. `onChange` meldet Änderungen: Das erneute Wählen des gewählten Elements schließt die Liste.

`cleanable` fügt einen Clear-Button hinzu, solange ein Element gewählt ist: Ein Druck löscht den Wert, gemeldet als `onChange({ value: null })`, und die Liste bleibt geschlossen. Der Button steht in der View des Selects nach dem Trigger, nicht in ihm, sodass ein Druck darauf die Liste nie öffnet. Die App platziert ihn (mit `absolute` über dem Ende des Triggers, wo sonst ein Chevron wäre) und füllt ihn:

```tsx
<Select
  items={fonts}
  value={font()}
  onChange={({ value }) => font.set(value)}
  cleanable
  clearButtonAccessibilityLabel="Clear the font"
  clearButtonClass="absolute right-2 top-2 size-5 items-center justify-center rounded-full hover:bg-accent"
  clearButton={<Text class="text-xs text-muted-foreground">✕</Text>}
  trigger={trigger}
/>
```

Der Trigger ist das Element der App, er zeigt also, was auch immer die App für das gewählte Element möchte: seinen Titel, ein Icon, einen Platzhalter, solange nichts gewählt ist. In TSX ist es das Element, das du übergibst: Es ist die Combobox und übernimmt die Drücke, den Tastaturfokus, den Expanded-Zustand und `disabled` selbst, sodass seine eigenen Klassen `active:`, `focus:` und `disabled:` dem Select folgen, sein eigenes `onPress` ebenfalls ausgeführt wird und die Liste an ihm ausgerichtet und genauso breit ist.

<a id="open-state"></a>

## Öffnungszustand

Ohne `open` behält das Select seinen eigenen Öffnungszustand (aus `defaultOpen`). Mit `open` gehört er der App, die ihn in `onOpenChange({ open, reason })` ändert: `"triggerPress"` (ein Druck auf den Trigger oder eine seiner Tasten), `"select"` (eine Auswahl), `"pressOutside"`, `"backdropPress"` oder `"cancel"` (Escape oder Zurück). `onOpen` und `onClose` melden, wann die Liste angezeigt wird und wann sie verschwunden ist (bei einem Sheet, sobald es eingeblendet bzw. ausgeblendet wurde), `onCancel`, dass der Nutzer sie ohne Auswahl geschlossen hat.

<a id="search"></a>

## Suche

`searchable` setzt ein Suchfeld über die Elemente: Die Eingabe filtert sie nach Titel, ohne Beachtung der Groß- und Kleinschreibung, und ein Abschnitt ohne Treffer verschwindet samt Header. Die Hervorhebung springt zum ersten Treffer, die Tasten bewegen sie weiter, solange das Suchfeld die Tastatur hat, und die Eingabetaste wählt sie. `empty` ist das, was die Liste zeigt, solange nichts passt:

```tsx
<Select
  items={zones}
  searchable
  searchPlaceholder="Search time zones"
  searchAccessibilityLabel="Search time zones"
  searchClass="mx-1 mb-1 rounded-md border border-input px-2 py-1.5 text-sm"
  empty={<Text class="px-2 py-6 text-center text-sm text-muted-foreground">No time zone found</Text>}
  trigger={trigger}
/>
```

Auf Desktops übernimmt das Suchfeld die Tastatur, sobald sich die Liste öffnet; auf Touchscreens erscheint die Tastatur, wenn das Feld gedrückt wird. Jedes Öffnen beginnt mit einer leeren Suche.

<a id="rows-the-app-draws"></a>

## Zeilen, die die App zeichnet

`itemClass` gestaltet die Zeile jedes Elements, die den Titel des Elements zeigt, bis `renderItem` sie zeichnet: `focus:` gilt für die hervorgehobene Zeile (dort, wo die Tasten oder der Zeiger sind), `selected:` für die gewählte und `disabled:` für eine deaktivierte. Um eine Zeile zu zeichnen, gib `renderItem` an: Es erhält, was das Element ist ([`SelectEntry`](#types)), und liefert den Inhalt der Zeile zurück, für die sichtbaren Zeilen. Es erhält nie den Zustand der Zeile: Mit `group` in `itemClass` folgt der Inhalt den Zuständen der Zeile über die Klassen `group-focus:`, `group-selected:` und `group-disabled:`, sodass die Darstellung einmal pro Element erstellt wird und eine Bewegung der Hervorhebung oder eine Auswahl nichts neu zeichnet. `renderGroup` zeichnet den Header eines Abschnitts auf dieselbe Weise:

```tsx
<Select
  items={fonts}
  itemClass="group rounded-md focus:bg-accent disabled:opacity-50"
  renderItem={(item) => (
    <View class="flex-row items-center gap-2 px-2 py-1.5">
      <Text class="flex-1 text-sm" style={{ fontFamily: item.value }}>{item.title}</Text>
      <Text class="w-4 text-right text-sm opacity-0 group-selected:opacity-100">✓</Text>
    </View>
  )}
  renderGroup={(group) => <Text class="px-2 pt-2 text-xs font-medium text-muted-foreground">{group.title}</Text>}
  trigger={trigger}
/>
```

## Props

| Prop | Rust | Typ | Standard | Beschreibung |
|---|---|---|---|---|
| `items` | `.items(..)` | `SelectItem[]` | `[]` | Die Elemente, in Reihenfolge. |
| `value` | `.value(..)` | `string \| null` | keine | Der `value` des gewählten Elements, gehört der App; `null` für keines. Wird es weggelassen, behält das Select seinen eigenen. |
| `defaultValue` | `.default_value(..)` | `string` | keine | Der Anfangswert, ohne `value`. |
| `open` | `.open(..)` | `boolean` | keine | Geöffnet, gehört der App. |
| `defaultOpen` | `.default_open(..)` | `boolean` | `false` | Anfangs geöffnet, ohne `open`. |
| `searchable` | `.searchable(..)` | `boolean` | `false` | Ein Suchfeld über den Elementen filtert sie nach Titel. |
| `searchPlaceholder` | `.search_placeholder(..)` | `string` | keine | Der Platzhalter des Suchfelds. |
| `searchAccessibilityLabel` | `.search_accessibility_label(..)` | `string` | keine | Wie Screenreader das Suchfeld nennen: was es durchsucht. |
| `cleanable` | `.cleanable(..)` | `boolean` | `false` | Ein Clear-Button, solange ein Element gewählt ist; ein Druck löscht den Wert (`onChange({ value: null })`). |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Es bleibt geschlossen: Der Trigger nimmt keine Drücke und keinen Tastaturfokus an, und `disabled:`-Stile gelten für ihn. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | keine | Wie Screenreader es nennen: worum es bei der Auswahl geht. |
| `placement` | `.placement(..)` | `"top" \| "bottom" \| "left" \| "right"` | `"bottom"` | Desktops: die Seite des Triggers, auf der die Liste erscheint, die andere Seite, wenn nur dort Platz ist. |
| `align` | `.align(..)` | `"start" \| "center" \| "end"` | `"start"` | Desktops: wie sie am Trigger ausgerichtet wird. |
| `offset` | `.offset(..)` | `number` | `0` | Desktops: der Abstand zwischen Trigger und Liste. |
| `margin` | `.margin(..)` | `number` | `0` | Desktops: der Abstand, den sie zu den Rändern der Safe Area einhält. |
| `popupClass`, `popupStyle` | `.popup_class(..)`, `.popup_style(..)` | `string`, `StyleProp<ViewStyle>` | keine | Das Popup (Desktops) oder das Sheet (Touchscreens), in dem die Liste liegt. |
| `backdropClass`, `backdropStyle` | `.backdrop_class(..)`, `.backdrop_style(..)` | `string`, `StyleProp<ViewStyle>` | keine | Touchscreens: der Backdrop hinter dem Sheet. |
| `listClass`, `listStyle` | `.list_class(..)`, `.list_style(..)` | `string`, `StyleProp<ViewStyle>` | keine | Die Liste, die Scroll-View der Zeilen. |
| `itemClass`, `itemStyle` | `.item_class(..)`, `.item_style(..)` | `string`, `StyleProp<TextStyle>` | keine | Die Zeile jedes Elements, ihre Textstile werden von ihrem Titel geerbt: `focus:` solange hervorgehoben, `selected:` solange gewählt, `disabled:` solange sie nicht wählbar ist. |
| `groupClass`, `groupStyle` | `.group_class(..)`, `.group_style(..)` | `string`, `StyleProp<ViewStyle>` | keine | Der Header jedes Abschnitts. |
| `searchClass`, `searchStyle` | `.search_class(..)`, `.search_style(..)` | `string`, `StyleProp<InputStyle>` | keine | Das Suchfeld: seine Box und sein Text (`color`, `fontSize`, `placeholderColor`). |
| `clearButtonClass`, `clearButtonStyle` | `.clear_button_class(..)`, `.clear_button_style(..)` | `string`, `StyleProp<ViewStyle>` | keine | Der Clear-Button (`cleanable`); `disabled:` zusammen mit dem Select. |
| `clearButton` | `.clear_button(..)` | `JSX.Element` | keine | Der Inhalt des Clear-Buttons: ein Kreuz, ein Icon. |
| `clearButtonAccessibilityLabel` | `.clear_button_accessibility_label(..)` | `string` | keine | Wie Screenreader den Clear-Button nennen. |
| `trigger` | `.trigger(..)` | `JSX.Element` | keine | Was die Liste öffnet, wenn es gedrückt wird; die Liste wird daran ausgerichtet. |
| `empty` | `.empty(..)` | `JSX.Element` | keine | Was die Liste zeigt, solange kein Element angezeigt wird (eine Suche ohne Treffer). |
| `renderItem` | `.render_item(..)` | `(item: SelectEntry) => JSX.Element` | keine | Die Zeile eines Elements, von der App aus dem gezeichnet, was das Element ist (seine Zustände sind die Klassen der Zeile); sonst der Titel des Elements. |
| `renderGroup` | `.render_group(..)` | `(group: SelectGroup) => JSX.Element` | keine | Der Header eines Abschnitts, von der App gezeichnet; sonst sein Titel. |
| `class`, `style` | Stilmethoden | `string`, `StyleProp<ViewStyle>` | keine | Die View um den Trigger. |

## Events

| Event | Rust | Beschreibung |
|---|---|---|
| `onChange` | `.on_change(\|value\| ..)` | Der Nutzer hat ein anderes Element gewählt (ein Druck, Eingabetaste oder Leertaste, Typeahead am Trigger): sein `value`; `null`, wenn der Clear-Button es gelöscht hat. Setze `value`, um ihm zu folgen. |
| `onOpenChange` | `.on_open_change(\|e\| ..)` | Die Liste wurde geöffnet oder geschlossen, mit dem Grund. Setze `open`, um dem zu folgen. |
| `onOpen` | `.on_open(\|\| ..)` | Die Liste wird angezeigt; bei einem Sheet, sobald es eingeblendet wurde. |
| `onClose` | `.on_close(\|\| ..)` | Die Liste ist verschwunden; bei einem Sheet, sobald es ausgeblendet wurde. Auch, wenn die App sie geschlossen hat. |
| `onCancel` | `.on_cancel(\|\| ..)` | Der Nutzer hat die Liste ohne Auswahl geschlossen (Escape oder Zurück, ein Druck außerhalb oder auf den Backdrop). |

Sie treten in dieser Reihenfolge auf: `onChange` bei einer Auswahl oder `onCancel` bei einem Schließen ohne Auswahl, dann `onOpenChange`, dann `onOpen` oder `onClose`, sobald die Liste angezeigt wird bzw. verschwunden ist.

<a id="types"></a>

<a id="types"></a>

## Typen

| Typ | Mitglieder | Beschreibung |
|---|---|---|
| `SelectItem` | `value: string`, `title: string`, `disabled?: boolean`, `group?: string` | Ein Element von `items`. |
| `SelectEntry` | `value`, `title`, `disabled`, `group?` (die des Elements), `index: number` | Was `renderItem` erhält: das Element und sein Index unter den `items`, nie sein Zustand (`focus:`, `selected:` und `disabled:` der Zeile). |
| `SelectGroup` | `title: string` | Was `renderGroup` erhält: der `group` des Abschnitts. |

In Rust sind sie `nsh_base::SelectItem`, `SelectEntry` und `SelectGroup`; `value` ist ein `SelectValue` (`Controlled(Some(..))` für einen Wert, `Controlled(None)` für `null`), das `.value(..)` aus einem `Option<SharedString>` oder einem String erzeugt.

<a id="parts"></a>

## Teile

| Teil | Ort | Gestaltet mit |
|---|---|---|
| Der Trigger | die View des Selects | dem eigenen Element der App (`trigger`) |
| Der Clear-Button | die View des Selects, nach dem Trigger (`cleanable`, solange ein Element gewählt ist) | `clearButtonClass`, `clearButtonStyle`; sein Inhalt `clearButton` |
| Das Popup oder Sheet | über allem, am Trigger (Desktops) oder am unteren Rand (Touchscreens) | `popupClass`, `popupStyle` |
| Der Backdrop | hinter dem Sheet (Touchscreens) | `backdropClass`, `backdropStyle` |
| Das Suchfeld | das Popup, zuerst (`searchable`) | `searchClass`, `searchStyle`, `searchPlaceholder`, `searchAccessibilityLabel` |
| Die Liste | das Popup, nach dem Suchfeld | `listClass`, `listStyle` |
| Der Header eines Abschnitts | die Liste, vor seinen Elementen | `groupClass`, `groupStyle`, `renderGroup` |
| Die Zeile eines Elements | die Liste | `itemClass`, `itemStyle`, `renderItem` (`group-focus:`, `group-selected:`, `group-disabled:` im Inneren, unter `group` in `itemClass`) |
| Der Leerzustand | das Popup, solange kein Element angezeigt wird | seinem eigenen Element (`empty`) |

Das Popup ist eine Spalte: Seine Höhe folgt dem Suchfeld und den Zeilen, sodass ein `max-h-*` auf `popupClass` sie begrenzt und die Liste darin scrollt.

<a id="keyboard"></a>

## Tastatur

Auf Desktops erreicht Tab den Trigger eines Selects, das nicht `disabled` ist. Bei geschlossener Liste öffnen Pfeil nach unten, Pfeil nach oben, Eingabetaste und Leertaste sie auf dem gewählten Element (ohne Auswahl: Pfeil nach oben auf dem letzten aktivierten Element, die anderen auf dem ersten), und Buchstaben und Ziffern wählen das Element, dessen Titel mit dem Eingegebenen beginnt, wie bei einem nativen Select. Bei geöffneter Liste:

| Taste | Aktion |
|---|---|
| Pfeil nach unten, Pfeil nach oben | Das nächste bzw. vorherige aktivierte Element, an den Enden umlaufend. |
| Pos1, Ende | Das erste bzw. letzte aktivierte Element (die eigenen des Suchfelds, solange es die Tastatur hat). |
| Bild ab, Bild auf | Eine Seite Zeilen vor oder zurück. |
| Eingabetaste | Wählt das hervorgehobene Element und schließt die Liste. |
| Leertaste | Wählt das hervorgehobene Element (ohne Suchfeld). |
| Buchstaben, Ziffern | Das nächste Element, dessen Titel mit dem beginnt, was in der letzten Sekunde eingegeben wurde (ohne Suchfeld). |
| Escape | Schließt die Liste ohne Auswahl. |

Sobald die Liste schließt, kehrt der Tastaturfokus zum Trigger zurück, es sei denn, ein Druck außerhalb hat ihn woandershin gelenkt. Der Zeiger hebt die Zeile hervor, über die er fährt; die hervorgehobene Zeile wird in den sichtbaren Bereich gescrollt, wenn die Tasten sie erreichen.

<a id="on-each-device"></a>

## Auf jedem Gerät

| | Desktops und Desktop-Browser | Smartphones und Tablets |
| --- | --- | --- |
| Die Liste | ein Popup über dem Trigger, die gewählte Zeile darauf (darunter, solange keine gewählt ist), so breit wie der Trigger, sofern `popupStyle` keine Breite festlegt, so hoch wie seine Zeilen, bis zum verfügbaren Platz auf dem Bildschirm | ein Sheet am unteren Rand über einem Backdrop, so hoch wie seine Zeilen, bis zur Statusleiste |
| Schließen | eine Auswahl, Escape, ein Druck außerhalb (der an das weitergeht, was unter dem Zeiger liegt) | eine Auswahl, der Backdrop, die Zurück-Taste von Android |
| Suche | das Feld übernimmt die Tastatur, sobald sich die Liste öffnet | die Tastatur erscheint, wenn das Feld gedrückt wird |
| Eine Auswahl | der Druck beim Herunterdrücken wählt aus, damit das Suchfeld die Tastatur behält | ein Tipp |

`popupClass` gestaltet das Popup auf Desktops und das Sheet auf Smartphones; ein Stil, der sich zwischen beiden unterscheidet, kann `platform.idiom` (`nsh/device`) mit `"desktop"` vergleichen.
<a id="accessibility"></a>

## Barrierefreiheit

- Der Trigger ist für Screenreader eine Combobox: Ihr Label ist `accessibilityLabel`, ihr Wert der Titel des ausgewählten Eintrags, und sie gibt an, ob die Liste aufgeklappt ist. `disabled` blendet sie abgedunkelt dar.
- Die Schaltfläche zum Löschen ist ein Button, der durch `clearButtonAccessibilityLabel` benannt wird; sie ist kein Tab-Stopp.
- Das Suchfeld ist ein Textfeld, das durch `searchAccessibilityLabel` benannt wird; sein Platzhalter ist ein Hinweis, der angezeigt wird, solange es leer ist.
- Die Liste ist eine Listbox und jede Zeile eine Option, die durch ihren Titel benannt wird; die ausgewählte Option ist selektiert und eine deaktivierte wird abgedunkelt dargestellt. Die Kopfzeilen von Abschnitten sind Überschriften.
- Während die Tasten die Hervorhebung verschieben, wandert der Fokus des Screenreaders zur hervorgehobenen Zeile; solange das Suchfeld die Tastatureingaben erhält, wird stattdessen der Titel des hervorgehobenen Eintrags angesagt, sodass die Eingabe weiterlaufen kann.

Siehe [Barrierefreiheit](../docs/accessibility.md) für Labels, Rollen und Ansagen im Allgemeinen.
