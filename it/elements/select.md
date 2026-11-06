---
title: "Select"
description: "Il componente Select: un valore scelto da un elenco di elementi, un popup in corrispondenza del trigger su desktop e un sheet su smartphone, con tastiera, typeahead, ricerca e sezioni, con stile definito dall'app."
group: base
demo: el-select
source_hash: 2fc7845fec15f74b
---

# Select

Un select permette di scegliere un valore da un elenco di elementi: un'impostazione, un filtro, un paese, un fuso orario. Il trigger dell'app apre l'elenco, presentato come ogni dispositivo si aspetta:

- Sui desktop e nei browser desktop, un popup sopra il trigger con la riga selezionata sovrapposta al trigger, così il titolo scelto resta dov'era (la posizione `item-aligned` di shadcn/ui), largo quanto il trigger (la larghezza `popupStyle` / `popupClass` dell'app ne imposta un'altra, come `menu_width` di `gpui-component`) e alto quanto le sue righe, fino allo spazio disponibile sullo schermo; senza alcuna selezione si apre sotto il trigger. La tastiera scorre gli elementi e ne sceglie uno.
- Su telefoni e tablet, uno sheet in fondo allo schermo sopra un backdrop.

Il select gestisce il comportamento: il valore (quello dell'app, oppure il proprio), lo stato di apertura, la tastiera, il typeahead, la ricerca, le sezioni, la riga evidenziata e ciò che sentono gli screen reader. L'aspetto è dell'app: ne stila il trigger, il popup, l'elenco, le righe, le intestazioni delle sezioni e il campo di ricerca, oppure disegna lei stessa le righe.

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

`Select` proviene da [`nsh/base`](../modules/nsh-base.md), il crate `nsh-base` in Rust. In Rust, `select()` ne crea uno con un setter per ogni prop (`.items(..)`, `.value(..)`, `.item_style(..)`) e un listener per ogni evento (`.on_change(..)`); `SelectItem::new(value, title)` crea un elemento, con `.disabled(..)` e `.group(..)`.

<a id="items"></a>

## Elementi

`items` è l'elenco sotto forma di dati: ogni elemento ha un `value` (univoco tra gli elementi: ciò che viene impostato scegliendolo), un `title` (ciò che mostra la sua riga, ciò con cui corrispondono ricerca e typeahead e ciò che dicono gli screen reader) e, facoltativamente, `disabled` e un `group`. Gli elementi adiacenti con lo stesso `group` formano una sezione sotto un'intestazione con quel titolo:

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

Le righe sono un elenco virtualizzato nella scroll view del popup: un elenco di migliaia di elementi genera solo le righe in vista, e il popup scorre quando le sue righe sono più alte dello spazio disponibile.

<a id="value"></a>

## Valore

Con `value`, l'app possiede l'elemento scelto: il select mostra l'elemento con quel valore e segnala una scelta con `onChange({ value })`; l'app imposta `value` per seguirla, oppure mantiene il proprio valore. `value={null}` significa nessuna scelta. Se omesso, il select mantiene un proprio valore, inizialmente preso da `defaultValue`. `onChange` segnala i cambiamenti: scegliere di nuovo l'elemento già scelto chiude l'elenco.

`cleanable` aggiunge un pulsante di cancellazione finché un elemento è scelto: una pressione azzera il valore, segnalato come `onChange({ value: null })`, e l'elenco resta chiuso. Il pulsante viene dopo il trigger nella view del select, non al suo interno, quindi una pressione su di esso non apre mai l'elenco; è l'app a posizionarlo (sopra l'estremità del trigger con `absolute`, dove ci sarebbe un chevron) e a riempirlo:

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

Il trigger è un elemento dell'app, quindi mostra ciò che l'app vuole per l'elemento scelto: il titolo, un'icona, un placeholder finché non è scelto nulla. In TSX è l'elemento che passi: è il combobox e gestisce da sé le pressioni, il focus da tastiera, lo stato espanso e `disabled`, quindi le sue classi `active:`, `focus:` e `disabled:` seguono il select, anche il suo `onPress` viene eseguito, e l'elenco è posizionato rispetto a esso ed è largo quanto lui.

<a id="open-state"></a>

## Stato di apertura

Senza `open`, il select mantiene un proprio stato di apertura (a partire da `defaultOpen`). Con `open`, lo possiede l'app e lo cambia in `onOpenChange({ open, reason })`: `"triggerPress"` (una pressione sul trigger, o uno dei suoi tasti), `"select"` (una scelta), `"pressOutside"`, `"backdropPress"` o `"cancel"` (Escape o indietro). `onOpen` e `onClose` indicano quando l'elenco è mostrato e quando è scomparso (per uno sheet, una volta entrato e una volta uscito), `onCancel` che l'utente lo ha chiuso senza scegliere.

<a id="search"></a>

## Ricerca

`searchable` inserisce un campo di ricerca sopra gli elementi: digitando li filtra per titolo, ignorando maiuscole e minuscole, e una sezione senza corrispondenze sparisce insieme alla sua intestazione. L'evidenziazione si sposta sulla prima corrispondenza, i tasti continuano a spostarla mentre il campo ha la tastiera, e Invio la sceglie. `empty` è ciò che l'elenco mostra finché nulla corrisponde:

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

Sui desktop il campo di ricerca prende la tastiera quando l'elenco si apre; sui touch screen la tastiera compare quando si preme il campo. Ogni apertura parte con una ricerca vuota.

<a id="rows-the-app-draws"></a>

## Righe disegnate dall'app

`itemClass` stila la riga di ogni elemento, che mostra il titolo dell'elemento finché `renderItem` non la disegna: `focus:` si applica alla riga evidenziata (dove si trovano i tasti o il puntatore), `selected:` a quella scelta e `disabled:` a una disabilitata. Per disegnare una riga, fornisci `renderItem`: riceve ciò che è l'elemento ([`SelectEntry`](#types)) e restituisce il contenuto della riga, per le righe in vista. Non riceve mai lo stato della riga: con `group` in `itemClass`, il contenuto segue gli stati della riga con le classi `group-focus:`, `group-selected:` e `group-disabled:`, quindi il disegno avviene una sola volta per elemento e uno spostamento dell'evidenziazione o una scelta non ridisegnano nulla. `renderGroup` disegna allo stesso modo l'intestazione di una sezione:

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

| Prop | Rust | Tipo | Predefinito | Descrizione |
|---|---|---|---|---|
| `items` | `.items(..)` | `SelectItem[]` | `[]` | Gli elementi, in ordine. |
| `value` | `.value(..)` | `string \| null` | nessuno | Il `value` dell'elemento scelto, gestito dall'app; `null` per nessuno. Se omesso, il select mantiene il proprio. |
| `defaultValue` | `.default_value(..)` | `string` | nessuno | Il valore iniziale, senza `value`. |
| `open` | `.open(..)` | `boolean` | nessuno | Aperto, gestito dall'app. |
| `defaultOpen` | `.default_open(..)` | `boolean` | `false` | Aperto inizialmente, senza `open`. |
| `searchable` | `.searchable(..)` | `boolean` | `false` | Un campo di ricerca sopra gli elementi li filtra per titolo. |
| `searchPlaceholder` | `.search_placeholder(..)` | `string` | nessuno | Il placeholder del campo di ricerca. |
| `searchAccessibilityLabel` | `.search_accessibility_label(..)` | `string` | nessuno | Come gli screen reader chiamano il campo di ricerca: ciò che cerca. |
| `cleanable` | `.cleanable(..)` | `boolean` | `false` | Un pulsante di cancellazione finché un elemento è scelto; una pressione azzera il valore (`onChange({ value: null })`). |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Resta chiuso: il trigger non accetta pressioni né focus da tastiera, e si applicano gli stili `disabled:`. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | nessuno | Come lo chiamano gli screen reader: l'oggetto della scelta. |
| `placement` | `.placement(..)` | `"top" \| "bottom" \| "left" \| "right"` | `"bottom"` | Desktop: il lato del trigger su cui va l'elenco, o l'altro lato se solo quello ha spazio. |
| `align` | `.align(..)` | `"start" \| "center" \| "end"` | `"start"` | Desktop: come si allinea al trigger. |
| `offset` | `.offset(..)` | `number` | `0` | Desktop: la distanza tra il trigger e l'elenco. |
| `margin` | `.margin(..)` | `number` | `0` | Desktop: la distanza che mantiene dai bordi della safe area. |
| `popupClass`, `popupStyle` | `.popup_class(..)`, `.popup_style(..)` | `string`, `StyleProp<ViewStyle>` | nessuno | Il popup (desktop) o lo sheet (touch screen) in cui si trova l'elenco. |
| `backdropClass`, `backdropStyle` | `.backdrop_class(..)`, `.backdrop_style(..)` | `string`, `StyleProp<ViewStyle>` | nessuno | Touch screen: il backdrop dietro lo sheet. |
| `listClass`, `listStyle` | `.list_class(..)`, `.list_style(..)` | `string`, `StyleProp<ViewStyle>` | nessuno | L'elenco, la scroll view delle righe. |
| `itemClass`, `itemStyle` | `.item_class(..)`, `.item_style(..)` | `string`, `StyleProp<TextStyle>` | nessuno | La riga di ogni elemento, con gli stili di testo ereditati dal suo titolo: `focus:` quando è evidenziata, `selected:` quando è scelta, `disabled:` quando non può esserlo. |
| `groupClass`, `groupStyle` | `.group_class(..)`, `.group_style(..)` | `string`, `StyleProp<ViewStyle>` | nessuno | L'intestazione di ogni sezione. |
| `searchClass`, `searchStyle` | `.search_class(..)`, `.search_style(..)` | `string`, `StyleProp<InputStyle>` | nessuno | Il campo di ricerca: il suo box e il suo testo (`color`, `fontSize`, `placeholderColor`). |
| `clearButtonClass`, `clearButtonStyle` | `.clear_button_class(..)`, `.clear_button_style(..)` | `string`, `StyleProp<ViewStyle>` | nessuno | Il pulsante di cancellazione (`cleanable`); `disabled:` con il select. |
| `clearButton` | `.clear_button(..)` | `JSX.Element` | nessuno | Il contenuto del pulsante di cancellazione: una croce, un'icona. |
| `clearButtonAccessibilityLabel` | `.clear_button_accessibility_label(..)` | `string` | nessuno | Come gli screen reader chiamano il pulsante di cancellazione. |
| `trigger` | `.trigger(..)` | `JSX.Element` | nessuno | Ciò che apre l'elenco quando viene premuto; l'elenco è posizionato rispetto a esso. |
| `empty` | `.empty(..)` | `JSX.Element` | nessuno | Ciò che l'elenco mostra quando nessun elemento è visibile (una ricerca senza corrispondenze). |
| `renderItem` | `.render_item(..)` | `(item: SelectEntry) => JSX.Element` | nessuno | La riga di un elemento, disegnata dall'app a partire da ciò che l'elemento è (i suoi stati sono le classi della riga); altrimenti il titolo dell'elemento. |
| `renderGroup` | `.render_group(..)` | `(group: SelectGroup) => JSX.Element` | nessuno | L'intestazione di una sezione, disegnata dall'app; altrimenti il suo titolo. |
| `class`, `style` | metodi di stile | `string`, `StyleProp<ViewStyle>` | nessuno | La view attorno al trigger. |

<a id="events"></a>

## Eventi

| Evento | Rust | Descrizione |
|---|---|---|
| `onChange` | `.on_change(\|value\| ..)` | L'utente ha scelto un altro elemento (una pressione, Invio o Spazio, il typeahead sul trigger): il suo `value`; `null` quando il pulsante di cancellazione lo ha azzerato. Imposta `value` per seguirlo. |
| `onOpenChange` | `.on_open_change(\|e\| ..)` | L'elenco si è aperto o chiuso, con il motivo. Imposta `open` per seguirlo. |
| `onOpen` | `.on_open(\|\| ..)` | L'elenco è mostrato; come sheet, una volta entrato. |
| `onClose` | `.on_close(\|\| ..)` | L'elenco è scomparso; come sheet, una volta uscito. Anche quando l'app lo ha chiuso. |
| `onCancel` | `.on_cancel(\|\| ..)` | L'utente ha chiuso l'elenco senza scegliere (Escape o indietro, una pressione all'esterno o sul backdrop). |

Arrivano in quest'ordine: `onChange` per una scelta, oppure `onCancel` per una chiusura senza scelta, poi `onOpenChange`, quindi `onOpen` o `onClose` quando l'elenco è mostrato o scomparso.

<a id="types"></a>

<a id="types"></a>

## Tipi

| Tipo | Membri | Descrizione |
|---|---|---|
| `SelectItem` | `value: string`, `title: string`, `disabled?: boolean`, `group?: string` | Un elemento di `items`. |
| `SelectEntry` | `value`, `title`, `disabled`, `group?` (dell'elemento), `index: number` | Ciò che riceve `renderItem`: l'elemento e il suo indice tra gli `items`, mai il suo stato (`focus:`, `selected:` e `disabled:` della riga). |
| `SelectGroup` | `title: string` | Ciò che riceve `renderGroup`: il `group` della sezione. |

In Rust sono `nsh_base::SelectItem`, `SelectEntry` e `SelectGroup`; `value` è un `SelectValue` (`Controlled(Some(..))` per un valore, `Controlled(None)` per `null`), che `.value(..)` crea da un `Option<SharedString>` o da una stringa.

<a id="parts"></a>

## Parti

| Parte | Dove | Stilizzata con |
|---|---|---|
| Il trigger | la view del select | l'elemento dell'app (`trigger`) |
| Il pulsante di cancellazione | la view del select, dopo il trigger (`cleanable`, finché un elemento è scelto) | `clearButtonClass`, `clearButtonStyle`; il suo contenuto `clearButton` |
| Il popup o lo sheet | sopra tutto, sul trigger (desktop) o in basso (touch screen) | `popupClass`, `popupStyle` |
| Il backdrop | dietro lo sheet (touch screen) | `backdropClass`, `backdropStyle` |
| Il campo di ricerca | il popup, per primo (`searchable`) | `searchClass`, `searchStyle`, `searchPlaceholder`, `searchAccessibilityLabel` |
| L'elenco | il popup, dopo il campo di ricerca | `listClass`, `listStyle` |
| L'intestazione di una sezione | l'elenco, prima dei suoi elementi | `groupClass`, `groupStyle`, `renderGroup` |
| La riga di un elemento | l'elenco | `itemClass`, `itemStyle`, `renderItem` (`group-focus:`, `group-selected:`, `group-disabled:` all'interno, sotto `group` in `itemClass`) |
| Lo stato vuoto | il popup, finché nessun elemento è visibile | un elemento proprio (`empty`) |

Il popup è una colonna: la sua altezza segue il campo di ricerca e le righe, quindi un `max-h-*` su `popupClass` la limita e l'elenco scorre al suo interno.

<a id="keyboard"></a>

## Tastiera

Sui desktop, Tab raggiunge il trigger di un select che non è `disabled`. Con l'elenco chiuso, Freccia giù, Freccia su, Invio e Spazio lo aprono sull'elemento scelto (senza alcuna scelta, Freccia su apre sull'ultimo elemento abilitato e gli altri tasti sul primo), e lettere e cifre scelgono l'elemento il cui titolo inizia con quanto digitato, come fa un select nativo. Con l'elenco aperto:

| Tasto | Azione |
|---|---|
| Freccia giù, Freccia su | L'elemento abilitato successivo o precedente, con ritorno circolare agli estremi. |
| Home, End | Il primo o l'ultimo elemento abilitato (quelli propri del campo di ricerca mentre questo ha la tastiera). |
| Pagina giù, Pagina su | Una pagina di righe avanti o indietro. |
| Invio | Sceglie l'elemento evidenziato e chiude l'elenco. |
| Spazio | Sceglie l'elemento evidenziato (senza campo di ricerca). |
| Lettere, cifre | Il successivo elemento il cui titolo inizia con quanto digitato nell'ultimo secondo (senza campo di ricerca). |
| Escape | Chiude l'elenco senza scegliere. |

Quando l'elenco si chiude, il focus da tastiera torna al trigger, a meno che una pressione all'esterno non lo abbia portato altrove. Il puntatore evidenzia la riga su cui si muove; la riga evidenziata viene resa visibile quando i tasti si spostano su di essa.

<a id="on-each-device"></a>

## Su ogni dispositivo

| | Desktop e browser desktop | Telefoni e tablet |
| --- | --- | --- |
| L'elenco | un popup sopra il trigger, con la riga selezionata sovrapposta (sotto di esso se non ce n'è nessuna), largo quanto il trigger a meno che `popupStyle` non imposti una larghezza, alto quanto le sue righe fino allo spazio disponibile sullo schermo | uno sheet in basso sopra un backdrop, alto quanto le sue righe fino alla barra di stato |
| Chiusura | una scelta, Escape, una pressione all'esterno (che prosegue verso ciò che si trova sotto il puntatore) | una scelta, il backdrop, il pulsante indietro di Android |
| Ricerca | il campo prende la tastiera quando l'elenco si apre | la tastiera compare quando si preme il campo |
| Una scelta | la pressione in discesa sceglie, così il campo di ricerca mantiene la tastiera | un tap |

`popupClass` stila il popup sui desktop e lo sheet su telefoni e tablet; uno stile che differisce tra i due può confrontare `platform.idiom` (`nsh/device`) con `"desktop"`.
<a id="accessibility"></a>

## Accessibilità

- Il trigger è un combobox per gli screen reader: la sua etichetta è `accessibilityLabel`, il suo valore è il titolo dell'elemento scelto,
  e indica se l'elenco è espanso. `disabled` lo attenua.
- Il pulsante di cancellazione è un pulsante denominato da `clearButtonAccessibilityLabel`; non è una tappa del tasto Tab.
- Il campo di ricerca è un campo di testo denominato da `searchAccessibilityLabel`; il suo segnaposto è un suggerimento mostrato finché è
  vuoto.
- L'elenco è una listbox e ogni riga è un'opzione, denominata dal suo titolo; l'opzione scelta è selezionata e quella disabilitata è
  attenuata. Le intestazioni delle sezioni sono intestazioni.
- Mentre i tasti spostano l'evidenziazione, il focus dello screen reader si sposta sulla riga evidenziata; mentre il campo di ricerca ha
  la tastiera, viene invece annunciato il titolo dell'elemento evidenziato, così la digitazione può continuare.

Vedi [Accessibilità](../docs/accessibility.md) per etichette, ruoli e annunci in generale.
