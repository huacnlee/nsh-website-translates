---
title: "Combobox"
description: "Il componente Combobox: uno o più valori scelti da un elenco di elementi filtrati digitando nel relativo campo di input, con un popup sotto il campo sui desktop e una sheet sui telefoni, con stile definito dall'app."
group: base
demo: el-combobox
source_hash: 278180c11b9d894f
---

# Combobox

Un combobox permette di scegliere valori da un elenco di elementi, uno solo o, con `multiple`, più di uno: i tag di un post, i membri di un canale, le lingue di un documento. Il suo trigger è un input: digitare apre l'elenco e lo filtra, come fa il combobox di shadcn/ui. È il gemello di [Select](./select.md) e ne condivide l'elenco, presentato come ciascun dispositivo se lo aspetta:

- Su desktop e nei browser desktop, un popup sotto il campo, largo quanto il campo (`popupStyle` / `popupClass` dell'app ne impostano un'altra) e alto quanto le sue righe, fino allo spazio disponibile accanto.
- Su telefoni e tablet, un foglio in fondo allo schermo sopra un backdrop.

Il combobox gestisce il comportamento: il valore (quello dell'app o il proprio), lo stato di apertura, la tastiera, la ricerca, le sezioni, la riga evidenziata e ciò che sentono gli screen reader. Con `multiple`, una scelta attiva o disattiva l'elemento nel valore e l'elenco resta aperto, così se ne possono scegliere diversi in un colpo solo. L'aspetto è dell'app: ne definisce lo stile del campo, del popup, dell'elenco, delle righe, delle intestazioni delle sezioni, dell'input e del footer, oppure disegna le righe da sé.

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

`Combobox` proviene da [`nsh/base`](../modules/nsh-base.md), il crate `nsh-base` in Rust. In Rust, `combobox()` ne crea uno con un setter per ogni prop (`.items(..)`, `.value(..)`, `.multiple(..)`) e un listener per ogni evento (`.on_change(..)`). I suoi elementi sono quelli di `Select`: `SelectItem::new(value, title)`, con `.disabled(..)` e `.group(..)`, in sezioni come quelli di una select (vedi [Elementi](./select.md#items)).

<a id="value"></a>

## Valore

Il valore è un array dei valori degli elementi selezionati. Con `value`, il valore appartiene all'app: il combobox mostra quegli elementi come selezionati e segnala ogni modifica con `onChange({ value })`; l'app imposta `value` per seguirla, oppure tiene il proprio valore. Se omesso, il combobox tiene un valore proprio, inizialmente preso da `defaultValue`.

- Con `multiple`, una pressione, Invio o Spazio attiva o disattiva l'elemento evidenziato: nel valore se era fuori, fuori se era dentro. L'elenco resta aperto.
- Senza, una scelta sostituisce il valore con quello dell'elemento e chiude l'elenco; scegliere di nuovo l'elemento selezionato si limita a chiuderlo.

`onConfirm({ value })` comunica il valore alla chiusura dell'elenco: una volta per apertura, comunque si chiuda (una scelta, Escape, una pressione all'esterno, il pulsante trigger), con il valore così come l'utente lo ha lasciato. Cmd+Invio su Mac (Ctrl+Invio altrove) chiude l'elenco e conferma.

`cleanable` aggiunge un pulsante di cancellazione finché un elemento è selezionato: una pressione svuota il valore (`onChange({ value: [] })`). Il pulsante viene dopo l'input e prima del pulsante trigger; una pressione su di esso non apre mai l'elenco. Il contenuto lo fornisce l'app, come per il [pulsante di cancellazione di una select](./select.md#value).

## Input

Il trigger è un input di testo nella riga del combobox (`class` e `style`: il bordo e lo sfondo del campo), con il `prefix` dell'app prima di esso (gli elementi scelti come chip, un'icona) e, dopo, il pulsante di cancellazione, il `triggerButton` dell'app (un chevron) e `suffix`.

- Digitare apre l'elenco e filtra gli elementi per titolo, senza distinguere maiuscole e minuscole; `empty` compare finché nulla corrisponde. Anche Giù e Su lo aprono, una pressione sul pulsante trigger lo apre e lo chiude, e sui touch screen un tap sull'input lo apre.
- Con un solo valore, l'input mostra il titolo dell'elemento scelto (`placeholder` finché non ce n'è uno). Viene selezionato quando l'input riceve il focus, così ciò che si digita lo sostituisce.
- Con `multiple`, l'input mostra la query; l'app mostra gli elementi scelti, in `prefix` o accanto al combobox.

La query è del combobox, e a ogni apertura parte da `defaultQuery` (altrimenti vuota), oppure dell'app con `query`: `onQueryChange({ query })` segnala ciò che viene digitato e l'app imposta `query` per seguirlo, per filtrare a modo suo o per suggerire un punto di partenza.

## Footer

`footer` è il contenuto sotto le righe, in una parte a sé (`footerClass`, `footerStyle`): un'azione ("Gestisci tag"), un conteggio, un suggerimento. Resta fermo mentre le righe scorrono.

## Props

| Prop | Rust | Tipo | Predefinito | Descrizione |
|---|---|---|---|---|
| `items` | `.items(..)` | `SelectItem[]` | `[]` | Gli elementi, in ordine. |
| `multiple` | `.multiple(..)` | `boolean` | `false` | Una scelta attiva o disattiva l'elemento nel valore e l'elenco resta aperto. |
| `value` | `.value(..)` | `string[]` | nessuno | I valori degli elementi selezionati, gestiti dall'app. |
| `defaultValue` | `.default_value(..)` | `string[]` | `[]` | Il valore iniziale, senza `value`. |
| `open`, `defaultOpen` | `.open(..)`, `.default_open(..)` | `boolean` | `false` | Lo stato di apertura, dell'app o del combobox stesso. |
| `placeholder` | `.placeholder(..)` | `string` | nessuno | Il placeholder dell'input, finché è vuoto. |
| `query` | `.query(..)` | `string` | nessuno | La query, gestita dall'app. |
| `defaultQuery` | `.default_query(..)` | `string` | nessuno | La query con cui parte ogni apertura, senza `query`. |
| `cleanable` | `.cleanable(..)` | `boolean` | `false` | Un pulsante di cancellazione finché un elemento è selezionato; una pressione svuota il valore. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Resta chiuso e non accetta pressioni né focus da tastiera. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | nessuno | Di cosa tratta la scelta, per gli screen reader. |
| `placement`, `align`, `offset`, `margin` | `.placement(..)`, ... | come quelli di `Select` | `"bottom"`, `"start"`, 0, 0 | Desktop: dove va il popup rispetto al campo. |
| `popupClass`, `popupStyle` | `.popup_class(..)`, `.popup_style(..)` | `string`, `StyleProp<ViewStyle>` | nessuno | Il popup (desktop) o il foglio (touch screen). |
| `backdropClass`, `backdropStyle` | `.backdrop_class(..)`, `.backdrop_style(..)` | `string`, `StyleProp<ViewStyle>` | nessuno | Il backdrop dietro il foglio. |
| `listClass`, `listStyle` | `.list_class(..)`, `.list_style(..)` | `string`, `StyleProp<ViewStyle>` | nessuno | L'elenco, la scroll view delle righe. |
| `itemClass`, `itemStyle` | `.item_class(..)`, `.item_style(..)` | `string`, `StyleProp<TextStyle>` | nessuno | La riga di ogni elemento: `focus:` mentre è evidenziata, `selected:` mentre è selezionato, `disabled:` mentre non può esserlo. |
| `groupClass`, `groupStyle` | `.group_class(..)`, `.group_style(..)` | `string`, `StyleProp<ViewStyle>` | nessuno | L'intestazione di ogni sezione. |
| `inputClass`, `inputStyle` | `.input_class(..)`, `.input_style(..)` | `string`, `StyleProp<InputStyle>` | nessuno | L'input: `focus:` mentre è in modifica, `disabled:` con il combobox. |
| `footerClass`, `footerStyle` | `.footer_class(..)`, `.footer_style(..)` | `string`, `StyleProp<ViewStyle>` | nessuno | Il footer, sotto le righe. |
| `clearButtonClass`, `clearButtonStyle` | `.clear_button_class(..)`, `.clear_button_style(..)` | `string`, `StyleProp<ViewStyle>` | nessuno | Il pulsante di cancellazione (`cleanable`). |
| `clearButton` | `.clear_button(..)` | `JSX.Element` | nessuno | Il contenuto del pulsante di cancellazione. |
| `clearButtonAccessibilityLabel` | `.clear_button_accessibility_label(..)` | `string` | nessuno | Come gli screen reader chiamano il pulsante di cancellazione. |
| `triggerButton` | `.trigger_button(..)` | `JSX.Element` | nessuno | Un pulsante dopo l'input (un chevron): una pressione apre e chiude l'elenco. |
| `prefix` | `.prefix(..)` | `JSX.Element` | nessuno | Contenuto prima dell'input: chip, un'icona. |
| `suffix` | `.suffix(..)` | `JSX.Element` | nessuno | Contenuto dopo il pulsante trigger. |
| `empty` | `.empty(..)` | `JSX.Element` | nessuno | Ciò che l'elenco mostra finché nessun elemento è visibile. |
| `footer` | `.footer(..)` | `JSX.Element` | nessuno | Ciò che compare sotto le righe. |
| `renderItem` | `.render_item(..)` | `(item: SelectEntry) => JSX.Element` | nessuno | La riga di un elemento, disegnata dall'app a partire da ciò che l'elemento è, mai dal suo stato: il contenuto segue `group-focus:`, `group-selected:` e `group-disabled:` della riga (`group` in `itemClass`), quindi uno spostamento dell'evidenziazione o un'attivazione/disattivazione non ridisegna nulla; altrimenti, il titolo dell'elemento. |
| `renderGroup` | `.render_group(..)` | `(group: SelectGroup) => JSX.Element` | nessuno | L'intestazione di una sezione, disegnata dall'app; altrimenti, il suo titolo. |
| `class`, `style` | metodi di stile | `string`, `StyleProp<ViewStyle>` | nessuno | Il campo: la riga del prefisso, dell'input, dei pulsanti e del suffisso; l'elenco è largo quanto esso. |

<a id="events"></a>

## Eventi

| Evento | Rust | Descrizione |
|---|---|---|
| `onChange` | `.on_change(\|value\| ..)` | Il valore è cambiato (una scelta, un'attivazione/disattivazione, il pulsante di cancellazione): `{ value }`, i valori degli elementi selezionati. Imposta `value` per seguirlo. |
| `onConfirm` | `.on_confirm(\|value\| ..)` | L'elenco si è chiuso: `{ value }` così com'è in quel momento, una volta per apertura. |
| `onQueryChange` | `.on_query_change(\|query\| ..)` | L'utente ha digitato nell'input: `{ query }`. Imposta `query` per seguirlo. |
| `onOpenChange` | `.on_open_change(\|e\| ..)` | L'elenco si è aperto o chiuso, con il motivo (`{ open, reason }`). Imposta `open` per seguirlo. |
| `onOpen`, `onClose` | `.on_open(..)`, `.on_close(..)` | L'elenco è mostrato, o è scomparso. |
| `onCancel` | `.on_cancel(..)` | L'utente ha chiuso l'elenco senza una scelta che lo chiuda (Escape o indietro, una pressione all'esterno o sul backdrop). |

Arrivano in quest'ordine: `onChange` per una scelta, o `onCancel` per una chiusura senza scelta, poi `onOpenChange`, poi `onConfirm` alla chiusura dell'elenco, poi `onOpen` o `onClose` quando l'elenco è mostrato o scomparso.

<a id="parts"></a>

## Parti

| Parte | Dove | Stile |
|---|---|---|
| Il campo | la view del combobox, una riga | `class`, `style` |
| Il prefisso | il campo, per primo | l'elemento proprio dell'app (`prefix`) |
| L'input | il campo, dopo il prefisso | `inputClass`, `inputStyle`, `placeholder` |
| Il pulsante di cancellazione | il campo, dopo l'input (`cleanable`, finché un elemento è selezionato) | `clearButtonClass`, `clearButtonStyle`; il suo contenuto `clearButton` |
| Il pulsante trigger | il campo, dopo il pulsante di cancellazione | l'elemento proprio dell'app (`triggerButton`) |
| Il suffisso | il campo, per ultimo | l'elemento proprio dell'app (`suffix`) |
| Il popup o il foglio | sopra tutto, sotto il campo (desktop) o in fondo (touch screen) | `popupClass`, `popupStyle` |
| Il backdrop | dietro il foglio (touch screen) | `backdropClass`, `backdropStyle` |
| L'elenco | il popup | `listClass`, `listStyle` |
| L'intestazione di una sezione | l'elenco, prima dei suoi elementi | `groupClass`, `groupStyle`, `renderGroup` |
| La riga di un elemento | l'elenco | `itemClass`, `itemStyle`, `renderItem` (`group-focus:`, `group-selected:`, `group-disabled:` all'interno, sotto `group` in `itemClass`) |
| Lo stato vuoto | il popup, finché nessun elemento è visibile | un elemento proprio (`empty`) |
| Il footer | il popup, per ultimo | `footerClass`, `footerStyle`; il suo contenuto `footer` |

<a id="keyboard"></a>

## Tastiera

I tasti sono quelli di una select (vedi [Tastiera](./select.md#keyboard)) finché l'input mantiene il focus, con queste differenze: lettere e cifre vengono digitate nell'input, che filtra l'elenco, anziché fare typeahead; Giù e Su aprono l'elenco chiuso; Invio attiva o disattiva l'elemento evidenziato con `multiple` e mantiene l'elenco aperto; Cmd+Invio su Mac (Ctrl+Invio altrove) lo chiude e conferma. Quando l'elenco si chiude su desktop, l'input mantiene il focus.

<a id="accessibility"></a>

## Accessibilità

- Per gli screen reader l'input è un combobox: la sua etichetta è `accessibilityLabel`, il suo valore i titoli degli elementi selezionati, separati da virgole, e indica se l'elenco è espanso. `disabled` lo attenua.
- L'elenco è un listbox e ogni riga un'opzione, chiamata con il suo titolo; le opzioni selezionate risultano selezionate e quelle disabilitate attenuate. Le intestazioni delle sezioni sono intestazioni.
- Il pulsante di cancellazione è un pulsante chiamato con `clearButtonAccessibilityLabel`; non è una tappa del Tab. Il pulsante trigger è nascosto agli screen reader, poiché l'input indica se l'elenco è aperto, e non è nemmeno una tappa del Tab.

Vedi [Accessibilità](../docs/accessibility.md) per etichette, ruoli e annunci in generale.
