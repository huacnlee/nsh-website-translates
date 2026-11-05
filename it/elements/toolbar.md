---
title: "Toolbar"
description: "Toolbar, ToolbarGroup e ToolbarSeparator: una barra di pulsanti, toggle e link che costituisce un'unica tappa del focus da tastiera, lungo la quale ci si muove con i tasti freccia, con gruppi nominati e separatori. L'aspetto e lo stato di ciascun controllo sono a carico dell'app."
group: base
demo: el-toolbar
source_hash: 4c5547977ec8d003
---

# Toolbar

Una toolbar è una barra di controlli: la formattazione di un editor di testo, i comandi di riproduzione di un lettore multimediale, una tavolozza verticale di strumenti.
`Toolbar` gestisce la tastiera e la semantica di una toolbar: gli screen reader la annunciano (con il nome dato dal suo
`accessibilityLabel`), e la tastiera la raggiunge con un'unica tappa e si sposta tra i suoi elementi con i tasti freccia del suo
`axis`. I suoi elementi sono i componenti `Button`, `Toggle` e `Link` al suo interno, a qualsiasi profondità. Un `ToolbarGroup` è una serie con nome di
elementi correlati (annulla e ripeti, l'allineamento), e un `ToolbarSeparator` è una linea che l'app disegna tra le serie. L'aspetto
è dell'app: la toolbar non ha colori, padding o spaziature propri, e ogni controllo mantiene il proprio stato.

```rust tabs
use nsh_base::{button, theme, toggle, toolbar, toolbar_group, toolbar_separator};
use nsh_core::prelude::*;

fn formatting() -> impl IntoElement {
    let bold = signal(false);
    toolbar()
        .accessibility_label("Formatting")
        .items_center()
        .gap_1()
        .child(
            toolbar_group()
                .accessibility_label("History")
                .child(button().accessibility_label("Undo").size_8().child(text("↶")))
                .child(button().accessibility_label("Redo").size_8().child(text("↷"))),
        )
        .child(toolbar_separator().w(px(1.0)).h_5().bg(move || theme().border))
        .child(
            toggle()
                .pressed(bold)
                .accessibility_label("Bold")
                .on_change(move |pressed: &bool| bold.set(*pressed))
                .size_8()
                .items_center()
                .justify_center()
                .pressed_style(|s| s.bg(move || theme().accent))
                .child(text("B")),
        )
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { Button, Toggle, Toolbar, ToolbarGroup, ToolbarSeparator } from "nsh/base";

function App() {
  const bold = signal(false);
  return (
    <Toolbar accessibilityLabel="Formatting" class="items-center gap-1 self-start rounded-lg bg-muted p-1">
      <ToolbarGroup accessibilityLabel="History">
        <Button accessibilityLabel="Undo" class="size-8 items-center justify-center rounded-md hover:bg-accent">
          <Text>↶</Text>
        </Button>
        <Button accessibilityLabel="Redo" class="size-8 items-center justify-center rounded-md hover:bg-accent">
          <Text>↷</Text>
        </Button>
      </ToolbarGroup>
      <ToolbarSeparator class="h-5 w-px bg-border" />
      <Toggle
        pressed={bold()}
        accessibilityLabel="Bold"
        onChange={({ pressed }) => bold.set(pressed)}
        class="size-8 items-center justify-center rounded-md aria-pressed:bg-accent"
      >
        <Text>B</Text>
      </Toggle>
    </Toolbar>
  );
}

mount(App);
```

`Toolbar`, `ToolbarGroup` e `ToolbarSeparator` provengono da [`nsh/base`](../modules/nsh-base.md), il crate `nsh-base`
in Rust. La toolbar non contiene alcun valore: a un toggle al suo interno viene comunicato se è premuto e notifica `onChange`, un
button notifica `onPress`, e l'app mantiene lo stato. In Rust, `toolbar()`, `toolbar_group()` e
`toolbar_separator()` li creano, con un setter per ogni prop (`.axis(..)`, `.disabled(..)`), i metodi di stile tipizzati e
`.child(..)` per il loro contenuto.

<a id="props"></a>

## Prop

<a id="toolbar-1"></a>

### Toolbar

| Prop | Rust | Tipo | Predefinito | Descrizione |
|---|---|---|---|---|
| `axis` | `.axis(..)` | `"horizontal" \| "vertical"` | `"horizontal"` | La direzione in cui scorrono i suoi elementi: i tasti freccia che si muovono lungo di essa (Sinistra e Destra, oppure Su e Giù) e la direzione in cui dispone i figli (una riga o una colonna). Letta quando la toolbar viene creata. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Ogni elemento della toolbar è disabilitato, qualunque sia il suo `disabled`: nessuna pressione, nessuna tappa del focus da tastiera, attenuato per gli screen reader. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | nessuno | Il nome con cui gli screen reader chiamano la toolbar ("Formattazione"), per una pagina che ne contiene più di una. |
| `children` | `.child(..)` | `JSX.Element` | nessuno | Gli elementi, i loro gruppi e separatori, e tutto il resto che l'app dispone tra di essi (un titolo, uno spaziatore, un input). |
| `class`, `style` | metodi di stile | `string`, `StyleProp<ViewStyle>` | nessuno | Il layout e l'aspetto della barra: allineamento, spaziature, padding, la sua superficie. |

### ToolbarGroup

| Prop | Rust | Tipo | Predefinito | Descrizione |
|---|---|---|---|---|
| `disabled` | `.disabled(..)` | `boolean` | `false` | Ogni elemento del gruppo è disabilitato, qualunque sia il suo `disabled`. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | nessuno | Il nome con cui gli screen reader chiamano il gruppo ("Cronologia", "Allineamento"). |
| `children` | `.child(..)` | `JSX.Element` | nessuno | Gli elementi del gruppo e tutto il resto che l'app dispone tra di essi. |
| `class`, `style` | metodi di stile | `string`, `StyleProp<ViewStyle>` | nessuno | Il layout e l'aspetto del gruppo. Si sviluppa lungo l'asse della toolbar. |

### ToolbarSeparator

| Prop | Rust | Tipo | Predefinito | Descrizione |
|---|---|---|---|---|
| `class`, `style` | metodi di stile | `string`, `StyleProp<ViewStyle>` | nessuno | La linea: un filetto sottile attraverso una riga (`h-5 w-px bg-border`) o una colonna (`h-px self-stretch bg-border`). |

<a id="items"></a>

## Elementi

Gli elementi di una toolbar sono i componenti `Button`, `Toggle` e `Link` al suo interno, nei suoi gruppi e anche in un
[`ToggleGroup`](./toggle.md) al suo interno. Anche il trigger di un [`Menu`](./menu.md) o di un [`Popover`](./popover.md) è un
elemento: la vista nel suo slot `trigger`, alla quale il popup assegna le pressioni, il focus e lo stato `expanded`. Uno
strumento che l'app disegna da sé è un `Button` con le classi dell'app: un `Button` non ha un aspetto proprio, quindi appare come
lo stila l'app ed è un elemento (un `View` con `onPress` resta una tappa a sé, fuori dai tasti freccia). Un
`ToggleGroup` dentro una toolbar è uno dei suoi gruppi: i suoi toggle sono elementi della toolbar, gli screen reader annunciano un gruppo,
e il suo `disabled` disabilita comunque i propri toggle. Gli altri controlli (un `Input`, un `Select`, un `Slider`) restano tappe a sé
e mantengono i propri tasti freccia; posizionali alla fine della barra. Ciò che mostra un popup aperto da un elemento (i
campi e i pulsanti di un popover, le voci di un menu, i link di una hover card) non fa parte della toolbar. I tasti freccia attraversano gli elementi nell'ordine in cui la
barra li dispone, a qualsiasi profondità si trovino, e un elemento che l'app mostra in seguito prende posto tra gli altri.

<a id="parts"></a>

## Parti

| Parte | Dentro | Stilizzata con | Stati |
|---|---|---|---|
| La barra | | `class`, `style` di `Toolbar` | |
| Un gruppo | la barra | `class`, `style` di `ToolbarGroup` | |
| Un separatore | la barra, un gruppo | `class`, `style` di `ToolbarSeparator` | |
| Un elemento | la barra, un gruppo | `class`, `style` propri dell'elemento | propri: `aria-pressed:`, `disabled:`, `hover:`, `focus:`, `active:` |

Mostra l'elemento su cui si trova la tastiera con gli stili `focus:`, e un toggle premuto attraverso la sua superficie (vedi
[Guide di design](../docs/design-guides.md#interaction-states)).

<a id="vertical"></a>

## Verticale

Una tavolozza di strumenti è una colonna: `axis="vertical"` dispone gli elementi dall'alto verso il basso, e Su e Giù si muovono lungo di essi.

```tsx
<Toolbar axis="vertical" accessibilityLabel="Tools" class="gap-1 self-start rounded-lg bg-muted p-1">
  <Each of={["select", "pen", "shape", "text"]}>
    {(t) => (
      <Toggle
        pressed={tool() === t()}
        accessibilityLabel={t()}
        onChange={({ pressed }) => pressed && tool.set(t())}
        class="size-8 items-center justify-center rounded-md aria-pressed:bg-accent"
      >
        <Text>{t()[0].toUpperCase()}</Text>
      </Toggle>
    )}
  </Each>
</Toolbar>
```

<a id="disabled"></a>

## Disabilitato

`disabled` su una toolbar disabilita ogni suo elemento, una barra che l'app blocca; su un gruppo, gli elementi del gruppo. Un elemento disabilitato
non riceve pressioni, i tasti freccia lo saltano, e gli screen reader lo annunciano come attenuato:

```tsx
<Toolbar disabled={readonly()} accessibilityLabel="Review" class="flex-row gap-1">
  <Button onPress={approve} class="h-8 px-3 disabled:opacity-50">
    <Text>Approve</Text>
  </Button>
</Toolbar>
```

<a id="accessibility"></a>

## Accessibilità

- `Toolbar` ha il ruolo `"toolbar"`, con il nome dato da `accessibilityLabel`; i suoi elementi restano elementi a sé. Su iOS la
  toolbar è un gruppo semantico in cui entra VoiceOver.
- `ToolbarGroup` ha il ruolo `"group"`, con il nome dato dal suo `accessibilityLabel`, così una serie di elementi viene letta come un'unica unità. Un
  `ToggleGroup` dentro una toolbar è anch'esso un gruppo.
- `ToolbarSeparator` non è un elemento per gli screen reader.
- `disabled` viene annunciato come lo annuncia la piattaforma (VoiceOver, TalkBack, UI Automation, l'albero di accessibilità
  del browser).

Vedi [Accessibilità](../docs/accessibility.md) per etichette, ruoli e annunci in generale.

<a id="keyboard"></a>

## Tastiera

Su macOS e sul web, dove Tab raggiunge le viste che ricevono pressioni, un `Toolbar` segue il
[pattern toolbar di WAI-ARIA](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/):

| Tasto | Cosa fa |
|---|---|
| Tab, Shift+Tab | Entra nella toolbar sull'elemento da cui il focus è uscito per ultimo (all'inizio, il primo elemento non disabilitato), e ne esce in un solo passaggio. |
| Destra, Sinistra (`axis="horizontal"`) | Sposta il focus sull'elemento successivo o precedente, dall'ultimo al primo e viceversa. |
| Giù, Su (`axis="vertical"`) | Sposta il focus sull'elemento successivo o precedente, dall'ultimo al primo e viceversa. |
| Home, End | Sposta il focus sul primo o sull'ultimo elemento. |
| Space, Return | Preme l'elemento con il focus. |

I tasti freccia saltano gli elementi disabilitati e non premono nulla: un toggle cambia solo quando viene premuto. L'altra coppia di
frecce è lasciata agli elementi (il trigger di un menu apre il proprio menu con Giù). In un layout da destra a sinistra una
toolbar orizzontale procede da destra, quindi Sinistra passa all'elemento successivo e Destra a quello precedente; una toolbar verticale mantiene Giù e
Su.

<a id="platform-notes"></a>

## Note sulle piattaforme

- iOS, Android e Mac Catalyst: ogni elemento viene premuto con un tocco; la toolbar è un gruppo che gli screen reader annunciano.
- Desktop (macOS, Windows, Linux, GPUI) e web: una pressione è un clic. Su macOS e sul web la toolbar è un'unica tappa
  di Tab, e i tasti freccia, Home e End si spostano tra i suoi elementi ([Tastiera](#keyboard)).
- Ogni piattaforma disegna ciò che l'app stila: la barra, i suoi gruppi, i suoi separatori e i suoi elementi.
