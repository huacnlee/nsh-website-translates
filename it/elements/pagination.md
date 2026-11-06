---
title: "Paginazione"
description: "Il componente Pagination: le pagine di un insieme tra cui spostarsi, con le pagine intorno a quella corrente, i puntini di sospensione, Precedente e Successivo, un pager compatto, la tastiera e la pagina corrente per gli screen reader, con lo stile definito dall'app."
group: base
demo: el-pagination
source_hash: e6e2ee064fd489be
---

# Pagination

Pagination permette di spostarsi tra le pagine di un insieme: risultati di ricerca, righe di una tabella, un archivio. Mostra Precedente, le pagine intorno a quella corrente (sempre la prima e l'ultima, con i puntini di sospensione per ogni serie omessa), i figli dell'app e Successivo. Gestisce il comportamento: quali pagine mostrare, le pressioni, la tastiera, Precedente e Successivo disabilitati agli estremi, il landmark di navigazione e la pagina corrente per gli screen reader. L'aspetto spetta all'app: gli elementi non hanno colore, dimensione o etichetta propri, e l'app li stilizza o li disegna.

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

`Pagination` deriva da [`nsh/base`](../modules/nsh-base.md), il crate `nsh-base` in Rust. In Rust, `pagination()` ne crea uno con un setter per ogni prop (`.page(..)`, `.total_pages(..)`), `.on_change(..)` per la pagina scelta dall'utente, i metodi di stile tipizzati per la riga e `.child(..)` per il contenuto dell'app.

<a id="the-page"></a>

## La pagina

La pagina è dell'app: `page` è quella corrente, a partire da 1, e `onChange({ page })` riporta la pagina scelta dall'utente con una pressione su una pagina, su Precedente o su Successivo. L'app la imposta, carica quella pagina e mostra le sue righe. `totalPages` indica quante sono; un `page` oltre l'ultima mostra l'ultima. La pagina corrente non segnala nulla quando viene premuta, e lo stesso vale per Precedente sulla prima pagina e Successivo sull'ultima.

<a id="the-pages-shown"></a>

## Le pagine mostrate

Con `visiblePages` (almeno 5, il valore predefinito) la riga mostra tutte le pagine finché ci stanno. Oltre quel limite mostra la prima e l'ultima pagina, quella corrente con tante pagine per lato quante ne entrano, `(visiblePages - 3) / 2`, e dei puntini di sospensione per ogni serie di pagine omessa:

| `page` di 20, `visiblePages={7}` | Mostrate |
|---|---|
| 1 | `1 2 3 4 5 … 20` |
| 6 | `1 … 4 5 6 7 8 … 20` |
| 20 | `1 … 16 17 18 19 20` |

Diecimila pagine mostrano gli stessi sette elementi. Un `visiblePages` dispari centra la pagina corrente.

<a id="items"></a>

## Elementi

Ogni elemento riceve gli `itemClass` e `itemStyle` dell'app: la pagina corrente è `selected:`, un elemento che non accetta pressioni è `disabled:`, l'elemento con il focus della tastiera è `focus:`. La disposizione della riga spetta all'app tramite `class` (una riga per impostazione predefinita; `gap-*`, `justify-*`).

Senza `renderItem` una pagina mostra il proprio numero, i puntini di sospensione `…`, e Precedente e Successivo le loro etichette di accessibilità (`‹` e `›` in assenza di queste). `renderItem` disegna il contenuto di ogni elemento a partire da un `PaginationItemState`:

| Campo | Tipo | Descrizione |
|---|---|---|
| `kind` | `"previous" \| "page" \| "ellipsis" \| "next"` | Che cos'è l'elemento. |
| `page` | `number` | Il numero di una pagina; la pagina a cui porta Precedente o Successivo (quella corrente agli estremi); la prima pagina nascosta dai puntini di sospensione. |
| `start`, `end` | `number` | Le pagine nascoste dai puntini di sospensione: `start` inclusa, `end` (la pagina successiva mostrata) esclusa. |
| `current` | `boolean` | La pagina corrente. |
| `disabled` | `boolean` | Non accetta pressioni: Precedente sulla prima pagina, Successivo sull'ultima, tutto in una paginazione disabilitata. |

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

I puntini di sospensione non accettano pressioni proprie: ciò che fanno spetta all'app. Un `Menu` disegnato al loro interno elenca le pagine che nascondono, come fa `JumpMenu` qui sopra.

<a id="compact"></a>

## Compatto

`compact` mostra solo Precedente, i figli e Successivo: un paginatore per schermi stretti, con la pagina indicata nei figli.

```tsx
<Pagination compact page={page()} totalPages={12} onChange={({ page: next }) => page.set(next)} class="items-center gap-3">
  <Text class="text-sm text-muted-foreground">{`${page()} of 12`}</Text>
</Pagination>
```

I figli si collocano dopo le pagine e prima di Successivo in entrambe le forme: un conteggio delle pagine, un campo per andare a una pagina.

## Props

| Prop | Rust | Tipo | Predefinito | Descrizione |
|---|---|---|---|---|
| `page` | `.page(..)` | `number` | obbligatorio | La pagina corrente, a partire da 1; l'app la imposta in `onChange`. |
| `totalPages` | `.total_pages(..)` | `number` | obbligatorio | Quante pagine ci sono, almeno 1. |
| `visiblePages` | `.visible_pages(..)` | `number` | `5` | Il massimo di pagine mostrate contemporaneamente, incluse la prima e l'ultima; almeno 5. |
| `compact` | `.compact(..)` | `boolean` | `false` | Solo Precedente, i figli e Successivo. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Nessun elemento accetta pressioni o il focus della tastiera; gli stili `disabled:` si applicano, e gli screen reader indicano che sono attenuati. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | nessuno | Come gli screen reader chiamano la navigazione: ciò che essa scorre. |
| `previousAccessibilityLabel`, `nextAccessibilityLabel` | `.previous_accessibility_label(..)`, `.next_accessibility_label(..)` | `string` | nessuno | Ciò che gli screen reader dicono per Precedente e Successivo, e il loro contenuto in assenza di `renderItem`. |
| `itemClass`, `itemStyle` | `.item_class(..)`, `.item_style(\|s\| ..)` | `string`, `StyleProp<TextStyle>` | nessuno | L'aspetto di ogni elemento: `selected:` sulla pagina corrente, `disabled:`, `focus:`; gli stili di testo passano al suo contenuto. |
| `renderItem` | `.render_item(\|s: &PaginationItemState\| ..)` | `(item: PaginationItemState) => JSX.Element` | nessuno | Disegna il contenuto di ogni elemento a partire dal suo stato. |
| `children` | `.child(..)` | `JSX.Element` | nessuno | Il contenuto dell'app dopo le pagine, prima di Successivo. |
| `class`, `style` | metodi di stile | `string`, `StyleProp<ViewStyle>` | nessuno | L'aspetto e la disposizione della riga. |

<a id="events"></a>

## Eventi

| Evento | Rust | Descrizione |
|---|---|---|
| `onChange` | `.on_change(\|page: &u32\| ..)` | `{ page }`: la pagina scelta dall'utente con una pagina, Precedente o Successivo. La pagina corrente non viene mai segnalata. |

<a id="motion"></a>

## Movimento

La pagina corrente si sposta da un elemento all'altro secondo le classi `selected:` dell'app: `transition-colors` su `itemClass` dissolve l'evidenziazione dalla pagina lasciata a quella raggiunta. Un cambio di pagina mantiene ogni elemento al suo posto e cambia ciò che gli elementi mostrano, così la riga non sfarfalla mai; le transizioni dell'app restano ferme con il movimento ridotto (`motion-reduce:transition-none`).

<a id="accessibility"></a>

## Accessibilità

- La riga è un landmark di navigazione denominato da `accessibilityLabel`.
- Ogni pagina, Precedente e Successivo è un pulsante. La pagina corrente viene indicata come pagina corrente (`aria-current="page"` di ARIA) ed è selezionata; Precedente sulla prima pagina e Successivo sull'ultima sono attenuati.
- Su macOS e sul web ogni pagina, Precedente e Successivo è una tappa del focus della tastiera, e Invio e Spazio la premono. Una pagina premuta da tastiera mantiene il focus una volta che l'app la mostra, ovunque si trovi nella riga, e lo stesso vale per la prima o l'ultima pagina quando Precedente o Successivo la raggiunge.

Consulta [Accessibility](../docs/accessibility.md) per etichette, ruoli e annunci in generale.

<a id="platform-notes"></a>

## Note sulle piattaforme

- iOS, Android e Mac Catalyst: una pressione è un tocco che termina su un elemento.
- Desktop (macOS, Windows, Linux, GPUI) e web: una pressione è un clic; su macOS e sul web, Tab raggiunge gli elementi.
- Ogni piattaforma disegna ciò che l'app stilizza.
