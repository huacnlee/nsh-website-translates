---
title: "Tree"
description: "Tree: elementi che contengono altri elementi, espansi e compressi, uno dei quali selezionato: i file di un progetto, una barra laterale delle impostazioni, una struttura a indice. Virtualizzato, un unico punto di sosta per il focus da tastiera, un albero per gli screen reader. L'aspetto di ogni riga è deciso dall'app."
group: base
demo: el-tree
source_hash: db7f601c01cf83b3
---

# Tree

Un tree mostra elementi che contengono altri elementi: i file e le cartelle di un progetto, le sezioni della barra laterale delle impostazioni, la struttura di un documento. `Tree` gestisce il comportamento di uno di essi: quali elementi sono espansi, quale è selezionato, la tastiera e ciò che sentono gli screen reader. Le sue righe sono virtualizzate: vengono create solo le righe in vista, e i figli di un elemento compresso non vengono mai creati, quindi un tree di migliaia di elementi si apre e scorre all'istante. L'aspetto è quello dell'app: il tree non disegna nulla di suo, l'app stila ogni riga (`itemClass`) e ne disegna il contenuto (`renderItem`: un'icona, l'etichetta rientrata in base alla profondità dell'elemento, un chevron, un badge).

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

`Tree` proviene da [`nsh/base`](../modules/nsh-base.md), il crate `nsh-base` in Rust. Gli elementi espansi e quello selezionato appartengono all'app quando questa imposta `expanded` e `selected`, che aggiorna in `onExpandedChange` e `onSelectedChange`; senza di essi il tree mantiene un proprio stato, a partire da `defaultExpanded` e `defaultSelected`. Gli elementi sono identificati dal loro `id`, scelto dall'app (un percorso, la chiave di un record), mai dalla loro etichetta. In Rust, `tree()` lo crea, con un setter per ogni prop (`.items(..)`, `.expanded(..)`, `.render_item(..)`), un metodo listener per ogni evento e i metodi di stile tipizzati.

<a id="items"></a>

## Elementi

`items` sono gli elementi al livello superiore, ciascuno un `TreeItem`:

| Campo | Tipo | Descrizione |
|---|---|---|
| `id` | `string` | Ciò che lo identifica in `expanded`, `selected` e negli eventi: univoco nel tree (un id dato due volte viene registrato nel log, e solo il suo primo elemento si espande o viene selezionato). |
| `label` | `string` | Ciò che la sua riga mostra a meno che `renderItem` non la disegni, ciò che dicono gli screen reader e ciò che la ricerca digitata confronta. |
| `children` | `TreeItem[]` | Gli elementi al suo interno, in ordine. Se ne ha, è una cartella: si espande e si comprime. |
| `disabled` | `boolean` | L'utente non può selezionarlo, espanderlo o comprimerlo: i press e i tasti lo saltano, si applicano gli stili `disabled:`. I suoi figli restano come stabilito da `expanded`. |

`renderItem` riceve un `TreeEntry` per ogni riga in vista: `id`, `label` e `disabled` dell'elemento, la sua `depth` (0 al livello superiore, 1 sotto un elemento di primo livello, …) e se è un `folder`. È ciò che l'elemento è, mentre gli stati della riga sono le sue classi: il disegno viene realizzato una sola volta per elemento e conserva le sue view mentre la riga è selezionata, espansa o compressa, quindi un chevron ruota con una transizione.

## Props

| Prop | Rust | Tipo | Predefinito | Descrizione |
|---|---|---|---|---|
| `items` | `.items(..)` | `TreeItem[]` | `[]` | Gli elementi al livello superiore, ciascuno con gli elementi al suo interno. |
| `expanded` | `.expanded(..)` | `string[]` | nessuno | Gli id degli elementi espansi (controllato). Un elemento è visibile finché ogni elemento sopra di esso è espanso. |
| `defaultExpanded` | `.default_expanded(..)` | `string[]` | `[]` | Gli elementi inizialmente espansi, finché `expanded` non è impostato. |
| `selected` | `.selected(..)` | `string \| null` | nessuno | L'id dell'elemento selezionato (controllato), `null` per nessuno. |
| `defaultSelected` | `.default_selected(..)` | `string` | nessuno | L'elemento inizialmente selezionato, finché `selected` non è impostato. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Un tree di sola lettura: nessun press né tasto, nessuna sosta del focus della tastiera, `disabled:` su ogni riga; mostra ciò che dicono `expanded` e `selected`. |
| `reveal` | `.reveal(..)` | `boolean` | `false` | Espandere e comprimere spostano le righe successive all'elemento nelle nuove posizioni con una spring, eseguita in modo nativo. Disattivato con movimento ridotto. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | nessuno | Come gli screen reader chiamano il tree ("Files"). |
| `renderItem` | `.render_item(..)` | `(entry: TreeEntry) => JSX.Element` | nessuno | Il contenuto di una riga, per le righe in vista; senza di esso una riga mostra l'etichetta dell'elemento. |
| `itemClass`, `itemStyle` | `.item_class(..)`, `.item_style(..)` | `string`, `StyleProp<TextStyle>` | nessuno | Ogni riga: altezza, padding, superficie e stati (vedi sotto); i suoi stili di testo raggiungono l'etichetta. |
| `listClass`, `listStyle` | `.list_class(..)`, `.list_style(..)` | `string`, `StyleProp<ViewStyle>` | nessuno | La scroll view delle righe all'interno del tree: il suo padding e gli spazi. |
| `class`, `style` | metodi di stile | `string`, `StyleProp<ViewStyle>` | nessuno | Il tree stesso. Dagli un'altezza (oppure `flex-1` in un genitore che ne ha una): le righe scorrono al suo interno, e vengono create solo quelle in vista. |

<a id="events"></a>

## Eventi

| Evento | Rust | Payload | Quando |
|---|---|---|---|
| `onExpandedChange` | `.on_expanded_change(..)` | `{ expanded: string[] }` | L'utente ha espanso o compresso un elemento (un press, Return, Space, Right o Left, `revealItem`): gli id espansi così come sarebbero. |
| `onSelectedChange` | `.on_selected_change(..)` | `{ selected: string }` | L'utente ha selezionato un altro elemento (un press, i tasti freccia, Home, End, la ricerca digitata). |
| `onExpand` | `.on_expand(..)` | `{ id: string }` | L'utente ha espanso l'elemento di `id`, dopo `onExpandedChange`. |
| `onCollapse` | `.on_collapse(..)` | `{ id: string }` | L'utente ha compresso l'elemento di `id`, dopo `onExpandedChange`. |
| `onAction` | `.on_action(..)` | `{ id: string }` | L'utente ha agito sull'elemento di `id`: Return sull'elemento selezionato quando non ha figli, oppure un doppio clic o doppio tap su qualsiasi elemento, dopo gli eventi propri del press. Gli elementi disabilitati e un tree disabilitato non lo segnalano mai. |

La selezione segue i tasti freccia, quindi un file explorer apre un file in `onAction`, non in `onSelectedChange`: scorrere i file ne mostra l'anteprima uno a uno, Return o un doppio clic aprono quello che l'utente vuole.

```tsx
<Tree
  items={files}
  onSelectedChange={({ selected }) => preview.set(selected)}
  onAction={({ id }) => openFile(id)}
/>
```

<a id="parts"></a>

## Parti

| Parte | Dentro | Stilizzata con | Stati |
|---|---|---|---|
| Il tree | | `class`, `style` | |
| La lista | il tree | `listClass`, `listStyle` | |
| Una riga | la lista | `itemClass`, `itemStyle` | `selected:`, `aria-expanded:` (una cartella aperta), `focus:` (mentre il tree ha il focus della tastiera, la riga su cui agiscono i tasti: la riga selezionata, l'elemento compresso sotto cui si trova una selezione nascosta, oppure la prima riga se nulla è selezionato), `disabled:`, `hover:`, `active:` |
| Il contenuto di una riga | una riga | `renderItem` | `group-selected:`, `group-aria-expanded:`, `group-focus:`, `group-disabled:` sotto `group` in `itemClass` |

Mostra la riga selezionata con `selected:` e la posizione della tastiera con `focus:` (vedi [Linee guida di design](../docs/design-guides.md#interaction-states)). Disegna il focus all'interno della riga (`focus:outline-2 focus:-outline-offset-2`): la lista ritaglia ciò che sporge oltre i suoi lati.

## Ref

| Metodo | Descrizione |
|---|---|
| `focus()` | Prende il focus della tastiera, come quando Tab raggiunge il tree. |
| `revealItem(id)` | Espande gli elementi sopra l'elemento di `id` (segnalati con `onExpandedChange` e `onExpand`, dal più esterno) e porta la sua riga in vista non appena è visibile: se l'app segue la modifica, subito; se non la segue, la richiesta termina lì. |

```tsx
let files: TreeRef | undefined;

<Tree ref={(r) => (files = r)} items={items} />;
files?.revealItem("src/ui/tree.rs");
```

<a id="disabled"></a>

## Disabilitato

Un elemento disabilitato non accetta press, i tasti freccia lo saltano e gli screen reader lo annunciano come attenuato. `disabled` sul tree lo rende di sola lettura: mostra ciò che dice lo stato dell'app e non accetta input.

```tsx
<Tree items={items} disabled={locked()} itemClass="h-8 px-2 disabled:opacity-50" />
```

<a id="accessibility"></a>

## Accessibilità

- Il tree ha il ruolo `"tree"`, con nome dato da `accessibilityLabel`; ogni riga è un `"treeitem"` con il nome dell'etichetta del suo elemento, con il suo livello (la sua profondità + 1), se è espansa (cartelle), selezionata e disabilitata.
- Quando il tree prende il focus della tastiera e quando i tasti spostano la selezione, la riga su cui agiscono i tasti prende il focus dello screen reader.

Vedi [Accessibilità](../docs/accessibility.md) per etichette, ruoli e annunci in generale.

<a id="keyboard"></a>

## Tastiera

Sui desktop e sul web, dove Tab raggiunge le view che accettano press, un `Tree` segue il [pattern WAI-ARIA tree view](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/):

| Tasto | Cosa fa |
|---|---|
| Tab, Shift+Tab | Entra nel tree in un solo passaggio e ne esce in un solo passaggio; al ritorno, i tasti proseguono dalla riga selezionata. Se nulla è selezionato, il focus appare sulla prima riga, che Down seleziona. |
| Down, Up | Seleziona la riga successiva o precedente, saltando gli elementi disabilitati, dall'ultima alla prima e viceversa. |
| Right | Espande una cartella compressa; su una già espansa, seleziona il suo primo figlio abilitato. |
| Left | Comprime una cartella espansa; su qualsiasi altro elemento, seleziona il suo genitore. |
| Home, End | Seleziona la prima o l'ultima riga. |
| Return | Espande o comprime la cartella selezionata; su un elemento senza figli, agisce su di esso (`onAction`). |
| Space | Espande o comprime la cartella selezionata. |
| Lettere, cifre | Seleziona la riga successiva la cui etichetta inizia con quanto digitato. |

Mentre la selezione è nascosta sotto un elemento compresso (l'app lo ha compresso), i tasti agiscono sulla riga di quell'elemento: Right o Return lo espande, Down seleziona la riga che lo segue.

In un layout da destra a sinistra le righe partono da destra, quindi Left e Right si scambiano i ruoli, come dice il pattern: Left espande una cartella ed entra in essa, Right la comprime e seleziona il genitore. Up, Down, Home e End restano invariati.

<a id="platform-notes"></a>

## Note sulle piattaforme

- iOS, Android e Mac Catalyst: un tap seleziona una riga ed espande o comprime una cartella; un doppio tap agisce sull'elemento (`onAction`).
- Desktop (macOS, Windows, Linux, GPUI) e web: un clic fa lo stesso e dà al tree il focus della tastiera, e i tasti sopra descritti si muovono al suo interno; un doppio clic agisce sull'elemento.
- Ogni piattaforma disegna ciò che l'app stila: il tree, le sue righe e il loro contenuto.
