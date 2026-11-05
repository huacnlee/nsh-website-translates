---
title: "Command"
description: "Command: una palette di comandi, un campo di ricerca sui comandi dell'app filtrati man mano che l'utente digita: una palette Cmd+K in una finestra di dialogo, un menu di comandi inline, una ricerca a cui risponde l'app. Virtualizzata, orientata alla tastiera, con una list box per gli screen reader. L'aspetto di ogni parte è deciso dall'app."
group: base
demo: el-command
source_hash: b1a002e27d282723
---

# Command

Una command palette è un campo di ricerca su un elenco di comandi: l'utente digita qualche lettera, l'elenco si restringe ai comandi che corrispondono, i tasti freccia spostano l'evidenziazione e Invio esegue il comando evidenziato. `Command` gestisce il comportamento di una palette: filtro, sezioni, evidenziazione, tastiera e ciò che sentono gli screen reader. Il filtro viene eseguito in modo nativo e le righe sono virtualizzate: vengono create solo le righe visibili, quindi una palette di migliaia di comandi, file o emoji filtra a ogni tasto premuto. L'aspetto è dell'app: il comando non disegna nulla di suo, l'app stila ogni parte (`itemClass`, `groupClass`, `searchClass`, ...) e disegna il contenuto delle righe (`renderItem`: un'icona, l'etichetta, i tasti della scorciatoia).

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

`Command` deriva da [`nsh/base`](../modules/nsh-base.md), il crate `nsh-base` di Rust. La query è dell'app quando questa imposta `query`, che aggiorna in `onQueryChange`; senza, il campo di ricerca mantiene una query propria, a partire da `defaultQuery`. Gli elementi sono identificati dal loro `id`, proprio dell'app, mai dalla loro etichetta: `onSelect({ id })` dice quale ha scelto l'utente. In Rust lo crea `command()`, con un setter per ogni prop (`.items(..)`, `.query(..)`, `.render_item(..)`), un metodo listener per ogni evento e i metodi di stile tipizzati.

## Items

`items` sono i comandi, in ordine, ciascuno un `CommandItem`:

| Campo | Tipo | Descrizione |
|---|---|---|
| `id` | `string` | Ciò che lo identifica in `onSelect` e `onHighlightChange`: univoco tra gli elementi. |
| `label` | `string` | Ciò che mostra la sua riga a meno che `renderItem` non la disegni, ciò che dicono gli screen reader e ciò con cui corrisponde la query. |
| `keywords` | `string[]` | Altre parole con cui corrisponde la query: sinonimi, un nome inglese accanto a un'etichetta tradotta. |
| `group` | `string` | La sua sezione: gli elementi adiacenti di uno stesso gruppo compaiono sotto un'intestazione con questo titolo. |
| `shortcut` | `string` | La combinazione di tasti dello stesso comando, come la chiama [`keymap`](../modules/nsh.md#keymap) (`"mod+shift+p"`), da mostrare nella sua riga. L'app la associa con `keymap.bind`. |
| `disabled` | `boolean` | Non può essere scelto: i tasti lo saltano, le pressioni non fanno nulla, si applicano gli stili `disabled:`. |
| `checked` | `boolean` | È quello attualmente in uso (un tema, una lingua): si applicano gli stili `checked:` e gli screen reader dicono che è selezionato. |

La query corrisponde a un elemento quando la sua etichetta o una delle sue parole chiave la contiene, senza distinguere maiuscole e minuscole e ignorando gli spazi attorno. Gli elementi mantengono il loro ordine, e una sezione senza corrispondenze scompare insieme alla sua intestazione. `renderItem` riceve un `CommandEntry` per ogni riga visibile: i campi dell'elemento e `shortcutLabel`, il suo `shortcut` come lo mostrano i suggerimenti in questo contesto (`⇧⌘P` sulle piattaforme Apple, `Ctrl+Shift+P` altrove). È ciò che l'elemento è, mentre l'evidenziazione è il `focus:` della riga: il disegno viene realizzato una sola volta per elemento e mantiene le sue view mentre l'evidenziazione si sposta.

## Props

| Prop | Rust | Tipo | Predefinito | Descrizione |
|---|---|---|---|---|
| `items` | `.items(..)` | `CommandItem[]` | `[]` | I comandi, in ordine. |
| `query` | `.query(..)` | `string` | nessuno | La query (controllata), che l'app imposta in `onQueryChange`. |
| `defaultQuery` | `.default_query(..)` | `string` | nessuno | La query iniziale, finché `query` non è impostato. |
| `searchable` | `.searchable(..)` | `boolean` | `true` | Un campo di ricerca sopra le righe. Senza di esso compaiono tutti gli elementi e il comando è una sola tappa del focus da tastiera, con typeahead. |
| `filterable` | `.filterable(..)` | `boolean` | `true` | La query filtra gli elementi. Se disattivato, compaiono tutti gli elementi: per una ricerca a cui risponde l'app stessa (i risultati di un server impostati come `items`). Una nuova query evidenzia comunque il primo elemento. |
| `loading` | `.loading(..)` | `boolean` | `false` | Una ricerca è in corso: `empty` è in attesa e l'elenco risulta occupato per gli screen reader. Mostra il tuo indicatore in `searchSuffix`. |
| `placeholder` | `.placeholder(..)` | `string` | nessuno | Il placeholder del campo di ricerca. |
| `autoFocus` | `.auto_focus(..)` | `boolean` | `false` | Il campo di ricerca prende il focus da tastiera appena mostrato: una palette che si apre per essere digitata. |
| `separator` | `.separator(..)` | `boolean` | `true` | Una riga separatore tra due sezioni visibili, stilizzata da `separatorClass`; mai per prima, per ultima o doppia. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | nessuno | Come gli screen reader chiamano l'elenco ("Commands") e il campo di ricerca finché `searchAccessibilityLabel` non è impostato. |
| `searchAccessibilityLabel` | `.search_accessibility_label(..)` | `string` | `accessibilityLabel` | Come gli screen reader chiamano il campo di ricerca: ciò che cerca ("Search commands"). |
| `header`, `footer` | `.header(..)`, `.footer(..)` | `JSX.Element` | nessuno | Ciò che compare sopra il campo di ricerca (un titolo) e sotto le righe (i suggerimenti dei tasti, un conteggio). |
| `empty` | `.empty(..)` | `JSX.Element` | nessuno | Ciò che compare quando non c'è alcun elemento da mostrare: una query senza corrispondenze, nessun elemento. |
| `searchPrefix`, `searchSuffix` | `.search_prefix(..)`, `.search_suffix(..)` | `JSX.Element` | nessuno | Ciò che compare prima e dopo il campo di ricerca nella sua barra: un'icona di ricerca, uno spinner mentre `loading`. |
| `renderItem` | `.render_item(..)` | `(entry: CommandEntry) => JSX.Element` | nessuno | Il contenuto di una riga, per le righe visibili; senza di esso una riga mostra l'etichetta dell'elemento. |
| `renderGroup` | `.render_group(..)` | `(group: CommandGroup) => JSX.Element` | nessuno | L'intestazione di una sezione (`{ heading }`); senza di esso un'intestazione mostra il proprio titolo. |
| `class`, `style` | metodi di stile | `string`, `StyleProp<ViewStyle>` | nessuno | Il comando stesso: dimensione, riquadro e superficie. |
| `searchBarClass`, `searchBarStyle` | `.search_bar_class(..)`, `.search_bar_style(..)` | `string`, `StyleProp<ViewStyle>` | nessuno | La riga di `searchPrefix`, il campo di ricerca e `searchSuffix`. |
| `searchClass`, `searchStyle` | `.search_class(..)`, `.search_style(..)` | `string`, `StyleProp<TextStyle>` | nessuno | Il campo di ricerca. |
| `listClass`, `listStyle` | `.list_class(..)`, `.list_style(..)` | `string`, `StyleProp<ViewStyle>` | nessuno | La scroll view delle righe. Dalle un'altezza (`max-h-80`, o un comando con dimensione): le righe scorrono al suo interno e vengono create solo quelle visibili. |
| `itemClass`, `itemStyle` | `.item_class(..)`, `.item_style(..)` | `string`, `StyleProp<TextStyle>` | nessuno | La riga di ogni elemento e i suoi stati (sotto); i suoi stili di testo raggiungono l'etichetta. |
| `groupClass`, `groupStyle` | `.group_class(..)`, `.group_style(..)` | `string`, `StyleProp<TextStyle>` | nessuno | L'intestazione di ogni sezione. |
| `separatorClass`, `separatorStyle` | `.separator_class(..)`, `.separator_style(..)` | `string`, `StyleProp<ViewStyle>` | nessuno | Ogni separatore: l'altezza e il colore di una linea. |

## Events

| Evento | Rust | Payload | Quando |
|---|---|---|---|
| `onSelect` | `.on_select(..)` | `{ id: string }` | L'utente ha scelto un elemento: Invio, o una pressione sulla sua riga. |
| `onHighlightChange` | `.on_highlight_change(..)` | `{ highlighted: string \| null }` | L'evidenziazione si è spostata (i tasti, il puntatore, una nuova query o nuovi elementi, `highlight`): per anticipare ciò che eseguirebbe Invio. |
| `onQueryChange` | `.on_query_change(..)` | `{ query: string }` | L'utente ha digitato nel campo di ricerca, oppure Escape lo ha svuotato. |
| `onCancel` | `.on_cancel(..)` | nessuno | Escape con una query vuota: chiude ciò che contiene il comando (il `open` di una finestra di dialogo). |

## Parts

| Parte | Dentro | Stilizzata con | Stati |
|---|---|---|---|
| Il comando | | `class`, `style` | |
| `header` | il comando | l'elemento dell'app | |
| La barra di ricerca | il comando | `searchBarClass`, `searchBarStyle` | |
| `searchPrefix`, il campo di ricerca, `searchSuffix` | la barra di ricerca | gli elementi dell'app; `searchClass`, `searchStyle` | il `focus:` del campo |
| L'elenco | il comando | `listClass`, `listStyle` | |
| L'intestazione di una sezione | l'elenco | `groupClass`, `groupStyle`, `renderGroup` | |
| Un separatore | l'elenco | `separatorClass`, `separatorStyle` | |
| Una riga | l'elenco | `itemClass`, `itemStyle` | `focus:` (evidenziata), `checked:`, `disabled:`, `hover:`, `active:` |
| Il contenuto di una riga | una riga | `renderItem` | `group-focus:`, `group-checked:`, `group-disabled:` sotto `group` in `itemClass` |
| `empty` | il comando | l'elemento dell'app | |
| `footer` | il comando | l'elemento dell'app | |

Mostra la riga evidenziata con `focus:` (vedi [Design guides](../docs/design-guides.md#interaction-states)).

## Ref

| Metodo | Descrizione |
|---|---|
| `focus()` | Dà il focus da tastiera al campo di ricerca (senza di esso, al comando). |
| `highlight(id)` | Evidenzia l'elemento di `id` e porta la sua riga in vista scorrendo; un elemento non visibile o disabilitato resta com'è. |
| `matchedCount()` | `Promise<number>`: quanti elementi mostra la query, inclusi quelli disabilitati. |

```tsx
let palette: CommandRef | undefined;

<Command ref={(r) => (palette = r)} items={items} />;
palette?.focus();
```

## A palette in a dialog

Metti il comando in un [`Dialog`](./dialog.md) e aprilo con la scorciatoia dell'app. Escape svuota prima la query; con una query vuota è `onCancel`, dove l'app chiude la finestra di dialogo.

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

## A search the app answers

Con `filterable={false}` compaiono tutti gli elementi che l'app fornisce: l'app cerca in `onQueryChange` (un server, un database) e imposta `items` con i risultati, `loading` mentre attende.

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

## Accessibility

- L'elenco ha il ruolo `"listbox"`, nominato da `accessibilityLabel`; ogni riga è un `"option"` nominato dall'etichetta del suo elemento, selezionato e disabilitato come lo è il suo elemento; l'intestazione di una sezione è un `"header"`, un separatore è nascosto.
- Il campo di ricerca è un campo di testo nominato da `searchAccessibilityLabel` (altrimenti `accessibilityLabel`); il suo placeholder è un suggerimento mostrato finché è vuoto.
- Il campo di ricerca mantiene il focus da tastiera mentre i tasti freccia spostano l'evidenziazione, e gli screen reader leggono l'etichetta evidenziata. Senza un campo di ricerca, la riga evidenziata prende il focus dello screen reader.
- Mentre `loading`, l'elenco è occupato.

Vedi [Accessibility](../docs/accessibility.md) per etichette, ruoli e annunci in generale.

## Keyboard

| Tasto | Cosa fa |
|---|---|
| Digitazione | Filtra gli elementi; la prima corrispondenza abilitata viene evidenziata. |
| Giù, Su | Evidenzia l'elemento successivo o precedente, saltando quelli disabilitati, dall'ultimo al primo e viceversa. |
| Pag. Giù, Pag. Su | Sposta l'evidenziazione del numero di righe visibili. |
| Invio | Sceglie l'elemento evidenziato (`onSelect`). |
| Escape | Svuota la query; con una query vuota, segnala `onCancel`. |
| Home, Fine | Senza un campo di ricerca: il primo o l'ultimo elemento (nel campo spostano il cursore). |
| Spazio, lettere, cifre | Senza un campo di ricerca: Spazio sceglie, lettere e cifre evidenziano tramite typeahead. |

## Platform notes

- Desktop (macOS, Windows, Linux, GPUI) e web: il puntatore evidenzia la riga su cui passa e un clic sceglie nel momento in cui il pulsante viene premuto, così il campo di ricerca mantiene il focus da tastiera.
- iOS, Android e Mac Catalyst: un tocco sceglie una riga e il tasto di invio della tastiera sceglie l'elemento evidenziato e mantiene il campo per la query successiva.
- Ogni piattaforma disegna ciò che l'app stila: il comando, la sua barra di ricerca, le sue righe e il loro contenuto.
