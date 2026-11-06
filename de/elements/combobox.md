---
title: "Combobox"
description: "Die Combobox-Komponente: ein oder mehrere Werte, die aus einer Liste von Einträgen ausgewählt werden, die sich durch Eingabe in das Eingabefeld filtern lässt – auf Desktops als Popup unter dem Feld, auf Smartphones als Sheet, gestaltet durch die App."
group: base
demo: el-combobox
source_hash: 278180c11b9d894f
---


# Combobox

Eine Combobox wählt Werte aus einer Liste von Items aus, einen oder, mit `multiple`, mehrere: die Tags eines Beitrags, die Mitglieder eines Kanals, die Sprachen eines Dokuments. Ihr Trigger ist ein Input: Tippen öffnet die Liste und filtert sie, wie bei der Combobox von shadcn/ui. Sie ist das Schwesterelement von [Select](./select.md) und teilt sich dessen Liste, dargestellt so, wie jedes Gerät es erwartet:

- Auf Desktops und in Desktop-Browsern ein Popup unter dem Feld, so breit wie das Feld (eine andere Breite legt `popupStyle` / `popupClass` der App fest) und so hoch wie seine Zeilen, bis zum verfügbaren Platz daneben.
- Auf Smartphones und Tablets ein Sheet am unteren Bildschirmrand über einem Backdrop.

Die Combobox besitzt das Verhalten: den Wert (den der App oder ihren eigenen), den Open-Zustand, die Tastatur, die Suche, die Sections, die hervorgehobene Zeile und das, was Screenreader ansagen. Mit `multiple` schaltet eine Auswahl das Item im Wert um, und die Liste bleibt offen, sodass sich mehrere Items in einem Zug auswählen lassen. Das Aussehen bestimmt die App: Sie gestaltet das Feld, das Popup, die Liste, die Zeilen, die Header der Sections, das Input und den Footer oder zeichnet die Zeilen selbst.

```rust tabs
use nsh_base::{SelectEntry, SelectItem, combobox, theme};
use nsh_core::prelude::*;

const TAGS: [(&str, &str); 5] = [
    ("bug", "Bug"),
    ("design", "Design"),
    ("docs", "Docs"),
    ("perf", "Performance"),
    ("security", "Security"),
];

fn tag_picker() -> impl IntoElement {
    let tags = signal(Vec::<SharedString>::new());
    let title = move || match tags.get().len() {
        0 => "Add tags".to_string(),
        n => format!("{n} tags"),
    };
    combobox()
        .items(
            TAGS.iter()
                .map(|&(value, title)| SelectItem::new(value, title))
                .collect::<Vec<_>>(),
        )
        .multiple(true)
        .placeholder(title)
        .value(move || Some(tags.get()))
        .on_change(move |next: &Vec<SharedString>| tags.set(next.clone()))
        .accessibility_label("Tags")
        .offset(px(4.0))
        .popup_style(|s| {
            s.p_1()
                .rounded_lg()
                .border_1()
                .border_color(move || theme().border)
                .bg(move || theme().popover)
                .shadow_md()
        })
        .h_9()
        .w_48()
        .px_3()
        .flex_row()
        .items_center()
        .rounded_md()
        .border_1()
        .border_color(move || theme().input)
        .input_style(|s| s.flex_1().text_sm())
        .trigger_button(text("⌄"))
        .item_class("rounded-md focus:bg-accent selected:font-medium disabled:opacity-50")
        .render_item(|item: &SelectEntry| view().px_2().py_1p5().child(text(item.title.clone()).text_sm()))
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { Combobox } from "nsh/base";

const TAGS = [
  { value: "bug", title: "Bug" },
  { value: "design", title: "Design" },
  { value: "docs", title: "Docs" },
  { value: "perf", title: "Performance" },
  { value: "security", title: "Security" },
];

function App() {
  const tags = signal<string[]>([]);
  return (
    <Combobox
      items={TAGS}
      multiple
      placeholder={tags().length ? `${tags().length} tags` : "Add tags"}
      value={tags()}
      onChange={({ value }) => tags.set(value)}
      accessibilityLabel="Tags"
      offset={4}
      popupClass="rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-md"
      backdropClass="bg-black/40"
      class="h-9 w-48 flex-row items-center rounded-md border border-input px-3"
      inputClass="flex-1 text-sm placeholder:text-muted-foreground"
      itemClass="group rounded-md px-2 py-1.5 text-sm focus:bg-accent focus:text-accent-foreground"
      triggerButton={<Text class="px-1 text-muted-foreground">⌄</Text>}
      renderItem={(item) => (
        <View class="flex-row justify-between">
          <Text>{item.title}</Text>
          <Text class="opacity-0 group-selected:opacity-100">✓</Text>
        </View>
      )}
    />
  );
}

mount(App);
```

`Combobox` stammt aus [`nsh/base`](../modules/nsh-base.md), dem `nsh-base`-Crate in Rust. In Rust erzeugt `combobox()` eine Combobox mit einem Setter pro Prop (`.items(..)`, `.value(..)`, `.multiple(..)`) und einem Listener pro Event (`.on_change(..)`). Ihre Items sind die von `Select`: `SelectItem::new(value, title)` mit `.disabled(..)` und `.group(..)`, in Sections wie bei einem Select (siehe [Items](./select.md#items)).

## Value

Der Wert ist ein Array der Werte der ausgewählten Items. Mit `value` gehört er der App: Die Combobox zeigt diese Items als ausgewählt an und meldet jede Änderung mit `onChange({ value })`; die App setzt `value`, um ihr zu folgen, oder behält ihren eigenen Wert. Wird er weggelassen, verwaltet die Combobox ihren eigenen Wert, zunächst aus `defaultValue`.

- Mit `multiple` schaltet ein Klick, Return oder Space das hervorgehobene Item um: in den Wert hinein, wenn es draußen war, heraus, wenn es drin war. Die Liste bleibt offen.
- Ohne dies ersetzt eine Auswahl den Wert durch den des Items und schließt die Liste; wird das ausgewählte Item erneut gewählt, schließt sie sich nur.

`onConfirm({ value })` meldet den Wert, wenn die Liste sich schließt: einmal pro Öffnung, egal wie sie sich schließt (Auswahl, Escape, Klick außerhalb, Trigger-Button), mit dem Wert, wie der Nutzer ihn hinterlassen hat. Cmd+Return auf einem Mac (anderswo Ctrl+Return) schließt die Liste und bestätigt.

`cleanable` fügt einen Clear-Button hinzu, solange ein Item ausgewählt ist: Ein Klick leert den Wert (`onChange({ value: [] })`). Der Button steht nach dem Input und vor dem Trigger-Button; ein Klick darauf öffnet die Liste nie. Die App füllt ihn, wie bei [dem Clear-Button eines Select](./select.md#value).

## Input

Der Trigger ist ein Texteingabefeld in der Zeile der Combobox (mit `class` und `style`: Rahmen und Füllung des Felds), mit dem `prefix` der App davor (die gewählten Items als Chips, ein Icon) und danach dem Clear-Button, dem `triggerButton` der App (ein Chevron) und `suffix`.

- Tippen öffnet die Liste und filtert die Items nach Titel, ohne Beachtung der Groß- und Kleinschreibung; `empty` erscheint, solange nichts passt. Pfeil nach unten und Pfeil nach oben öffnen sie ebenfalls, ein Klick auf den Trigger-Button öffnet und schließt sie, und auf Touchscreens öffnet ein Tipp auf das Input die Liste.
- Bei einem einzelnen Wert zeigt das Input den Titel des gewählten Items (`placeholder`, solange keines gewählt ist). Er wird markiert, wenn das Input den Fokus erhält, sodass getippter Text ihn ersetzt.
- Mit `multiple` zeigt das Input die Query; die App zeigt die gewählten Items, in `prefix` oder neben der Combobox.

Die Query gehört der Combobox selbst und beginnt jede Öffnung mit `defaultQuery` (sonst leer), oder sie gehört der App mit `query`: `onQueryChange({ query })` meldet, was getippt wird, und die App setzt `query`, um dem zu folgen, auf ihre eigene Weise zu filtern oder einen Startpunkt vorzuschlagen.

## Footer

`footer` ist Inhalt unterhalb der Zeilen, in einem eigenen Part (`footerClass`, `footerStyle`): eine Aktion („Manage tags“), eine Anzahl, ein Hinweis. Er bleibt an Ort und Stelle, während die Zeilen scrollen.

## Props

| Prop | Rust | Typ | Standard | Beschreibung |
|---|---|---|---|---|
| `items` | `.items(..)` | `SelectItem[]` | `[]` | Die Items, in Reihenfolge. |
| `multiple` | `.multiple(..)` | `boolean` | `false` | Eine Auswahl schaltet das Item im Wert um, und die Liste bleibt offen. |
| `value` | `.value(..)` | `string[]` | keiner | Die Werte der ausgewählten Items, im Besitz der App. |
| `defaultValue` | `.default_value(..)` | `string[]` | `[]` | Der anfängliche Wert, ohne `value`. |
| `open`, `defaultOpen` | `.open(..)`, `.default_open(..)` | `boolean` | `false` | Der Open-Zustand, der der App oder der eigene der Combobox. |
| `placeholder` | `.placeholder(..)` | `string` | keiner | Der Platzhalter des Inputs, solange es leer ist. |
| `query` | `.query(..)` | `string` | keine | Die Query, im Besitz der App. |
| `defaultQuery` | `.default_query(..)` | `string` | keine | Die Query, mit der jede Öffnung beginnt, ohne `query`. |
| `cleanable` | `.cleanable(..)` | `boolean` | `false` | Ein Clear-Button, solange ein Item ausgewählt ist; ein Klick leert den Wert. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Sie bleibt geschlossen und nimmt weder Klicks noch Tastaturfokus an. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | keiner | Worum es bei der Auswahl geht, für Screenreader. |
| `placement`, `align`, `offset`, `margin` | `.placement(..)`, ... | wie bei `Select` | `"bottom"`, `"start"`, 0, 0 | Desktops: wo das Popup relativ zum Feld platziert wird. |
| `popupClass`, `popupStyle` | `.popup_class(..)`, `.popup_style(..)` | `string`, `StyleProp<ViewStyle>` | keine | Das Popup (Desktops) oder das Sheet (Touchscreens). |
| `backdropClass`, `backdropStyle` | `.backdrop_class(..)`, `.backdrop_style(..)` | `string`, `StyleProp<ViewStyle>` | keine | Der Backdrop hinter dem Sheet. |
| `listClass`, `listStyle` | `.list_class(..)`, `.list_style(..)` | `string`, `StyleProp<ViewStyle>` | keine | Die Liste, die Scroll-View der Zeilen. |
| `itemClass`, `itemStyle` | `.item_class(..)`, `.item_style(..)` | `string`, `StyleProp<TextStyle>` | keine | Die Zeile jedes Items: `focus:`, solange sie hervorgehoben ist, `selected:`, solange sie ausgewählt ist, `disabled:`, solange sie es nicht sein kann. |
| `groupClass`, `groupStyle` | `.group_class(..)`, `.group_style(..)` | `string`, `StyleProp<ViewStyle>` | keine | Der Header jeder Section. |
| `inputClass`, `inputStyle` | `.input_class(..)`, `.input_style(..)` | `string`, `StyleProp<InputStyle>` | keine | Das Input: `focus:`, solange es bearbeitet wird, `disabled:` mit der Combobox. |
| `footerClass`, `footerStyle` | `.footer_class(..)`, `.footer_style(..)` | `string`, `StyleProp<ViewStyle>` | keine | Der Footer, unterhalb der Zeilen. |
| `clearButtonClass`, `clearButtonStyle` | `.clear_button_class(..)`, `.clear_button_style(..)` | `string`, `StyleProp<ViewStyle>` | keine | Der Clear-Button (`cleanable`). |
| `clearButton` | `.clear_button(..)` | `JSX.Element` | keiner | Der Inhalt des Clear-Buttons. |
| `clearButtonAccessibilityLabel` | `.clear_button_accessibility_label(..)` | `string` | keiner | Wie Screenreader den Clear-Button benennen. |
| `triggerButton` | `.trigger_button(..)` | `JSX.Element` | keiner | Ein Button nach dem Input (ein Chevron): Ein Klick öffnet und schließt die Liste. |
| `prefix` | `.prefix(..)` | `JSX.Element` | keiner | Inhalt vor dem Input: Chips, ein Icon. |
| `suffix` | `.suffix(..)` | `JSX.Element` | keiner | Inhalt nach dem Trigger-Button. |
| `empty` | `.empty(..)` | `JSX.Element` | keiner | Was die Liste zeigt, solange kein Item sichtbar ist. |
| `footer` | `.footer(..)` | `JSX.Element` | keiner | Was unterhalb der Zeilen erscheint. |
| `renderItem` | `.render_item(..)` | `(item: SelectEntry) => JSX.Element` | keiner | Die Zeile eines Items, von der App aus dem gezeichnet, was das Item ist, nie aus seinem Zustand: Der Inhalt folgt `group-focus:`, `group-selected:` und `group-disabled:` der Zeile (`group` in `itemClass`), sodass das Verschieben der Hervorhebung oder ein Umschalten nichts neu zeichnet; sonst der Titel des Items. |
| `renderGroup` | `.render_group(..)` | `(group: SelectGroup) => JSX.Element` | keiner | Der Header einer Section, von der App gezeichnet; sonst ihr Titel. |
| `class`, `style` | Style-Methoden | `string`, `StyleProp<ViewStyle>` | keine | Das Feld: die Zeile aus Prefix, Input, Buttons und Suffix; die Liste ist so breit wie sie. |

## Events

| Event | Rust | Beschreibung |
|---|---|---|
| `onChange` | `.on_change(\|value\| ..)` | Der Wert hat sich geändert (eine Auswahl, ein Umschalten, der Clear-Button): `{ value }`, die Werte der ausgewählten Items. Setze `value`, um dem zu folgen. |
| `onConfirm` | `.on_confirm(\|value\| ..)` | Die Liste wurde geschlossen: `{ value }` so, wie er dann ist, einmal pro Öffnung. |
| `onQueryChange` | `.on_query_change(\|query\| ..)` | Der Nutzer hat im Input getippt: `{ query }`. Setze `query`, um dem zu folgen. |
| `onOpenChange` | `.on_open_change(\|e\| ..)` | Die Liste wurde geöffnet oder geschlossen, mit dem Grund (`{ open, reason }`). Setze `open`, um dem zu folgen. |
| `onOpen`, `onClose` | `.on_open(..)`, `.on_close(..)` | Die Liste wird angezeigt oder ist verschwunden. |
| `onCancel` | `.on_cancel(..)` | Der Nutzer hat die Liste ohne eine Auswahl geschlossen, die sie schließt (Escape oder Zurück, ein Klick außerhalb oder auf den Backdrop). |

Sie treten in dieser Reihenfolge auf: `onChange` bei einer Auswahl oder `onCancel` bei einem Schließen ohne Auswahl, dann `onOpenChange`, dann `onConfirm`, wenn die Liste sich schließt, dann `onOpen` oder `onClose`, sobald die Liste angezeigt wird oder verschwunden ist.

## Parts

| Part | Wo | Gestaltet mit |
|---|---|---|
| Das Feld | die View der Combobox, eine Zeile | `class`, `style` |
| Das Prefix | im Feld, als Erstes | das eigene Element der App (`prefix`) |
| Das Input | im Feld, nach dem Prefix | `inputClass`, `inputStyle`, `placeholder` |
| Der Clear-Button | im Feld, nach dem Input (`cleanable`, solange ein Item ausgewählt ist) | `clearButtonClass`, `clearButtonStyle`; sein Inhalt `clearButton` |
| Der Trigger-Button | im Feld, nach dem Clear-Button | das eigene Element der App (`triggerButton`) |
| Das Suffix | im Feld, als Letztes | das eigene Element der App (`suffix`) |
| Das Popup oder Sheet | über allem, unter dem Feld (Desktops) oder am unteren Rand (Touchscreens) | `popupClass`, `popupStyle` |
| Der Backdrop | hinter dem Sheet (Touchscreens) | `backdropClass`, `backdropStyle` |
| Die Liste | das Popup | `listClass`, `listStyle` |
| Der Header einer Section | die Liste, vor ihren Items | `groupClass`, `groupStyle`, `renderGroup` |
| Die Zeile eines Items | die Liste | `itemClass`, `itemStyle`, `renderItem` (`group-focus:`, `group-selected:`, `group-disabled:` darin, unter `group` in `itemClass`) |
| Der Empty-Zustand | das Popup, solange kein Item sichtbar ist | sein eigenes Element (`empty`) |
| Der Footer | das Popup, als Letztes | `footerClass`, `footerStyle`; sein Inhalt `footer` |

<a id="keyboard"></a>

## Tastatur

Die Tasten sind die eines Select (siehe [Tastatur](./select.md#keyboard)), solange das Input den Fokus behält, mit diesen Unterschieden: Buchstaben und Ziffern werden ins Input getippt und filtern die Liste, statt Typeahead auszulösen; Pfeil nach unten und Pfeil nach oben öffnen die geschlossene Liste; Return schaltet mit `multiple` das hervorgehobene Item um und lässt die Liste offen; Cmd+Return auf einem Mac (anderswo Ctrl+Return) schließt sie und bestätigt. Wenn sich die Liste auf Desktops schließt, behält das Input den Fokus.

<a id="accessibility"></a>

## Barrierefreiheit

- Das Input ist für Screenreader eine Combobox: Ihr Label ist `accessibilityLabel`, ihr Wert sind die Titel der ausgewählten Items, durch Kommas getrennt, und sie gibt an, ob die Liste aufgeklappt ist. `disabled` dimmt sie.
- Die Liste ist eine Listbox und jede Zeile eine Option, benannt nach ihrem Titel; die ausgewählten Optionen sind als ausgewählt markiert und eine deaktivierte als gedimmt. Die Header der Sections sind Header.
- Der Clear-Button ist ein Button, benannt durch `clearButtonAccessibilityLabel`; er ist kein Tab-Stopp. Der Trigger-Button ist vor Screenreadern verborgen, da das Input angibt, ob die Liste offen ist, und ist ebenfalls kein Tab-Stopp.

Siehe [Barrierefreiheit](../docs/accessibility.md) für Labels, Rollen und Ansagen im Allgemeinen.
