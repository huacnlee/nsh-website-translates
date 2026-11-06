---
title: "Toggle"
description: "Toggle e ToggleGroup: un pulsante che può essere attivo o inattivo, e una barra degli strumenti composta da più toggle. Ogni Toggle gestisce autonomamente le pressioni, l'attivazione da tastiera, lo stato disabilitato, il proprio ruolo e lo stato di pressione per gli screen reader; il gruppo è una barra degli strumenti con un unico punto di sosta per il focus da tastiera; l'aspetto e quali toggle risultano premuti sono a carico dell'app."
group: base
demo: el-toggle
source_hash: d8d3727dd9d04426
---

# Toggle

Un toggle è un pulsante che resta attivo o disattivo: il grassetto in una barra degli strumenti di testo, una stella dei preferiti, un'opzione di visualizzazione. `Toggle` gestisce il comportamento di un toggle: pressioni, attivazione da tastiera, stato disabilitato, e il ruolo di pulsante con il suo stato di pressione per gli screen reader, che lo annunciano come pulsante toggle. Un `ToggleGroup` attorno a più toggle è una barra degli strumenti: gli screen reader la annunciano come tale, e la tastiera la raggiunge in un'unica sosta e si sposta tra i suoi toggle con i tasti freccia. L'aspetto è dell'app: un toggle non ha colori, dimensioni, icona o etichetta propri. I suoi figli sono l'icona o l'etichetta dell'app, e le classi `aria-pressed:` sul toggle, o le classi `group-aria-pressed:` su ciò che contiene, ne seguono lo stato.

```rust tabs
use nsh_base::{theme, toggle, toggle_group};
use nsh_core::prelude::*;

fn formatting() -> impl IntoElement {
    let bold = signal(true);
    let italic = signal(false);
    let item = move |label: &'static str, on: Signal<bool>| {
        toggle()
            .pressed(on)
            .accessibility_label(label)
            .on_change(move |pressed: &bool| on.set(*pressed))
            .size_8()
            .items_center()
            .justify_center()
            .rounded(move || theme().radius)
            .pressed_style(|s| s.bg(move || theme().accent))
            .child(text(&label[..1]).text_sm().text_color(move || {
                if on.get() { theme().accent_foreground } else { theme().muted_foreground }
            }))
    };
    toggle_group()
        .flex_row()
        .self_start()
        .gap_1()
        .child(item("Bold", bold))
        .child(item("Italic", italic))
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { Toggle, ToggleGroup } from "nsh/base";

function App() {
  const marks = signal<string[]>(["bold"]);
  const item = (value: string, label: string) => (
    <Toggle
      pressed={marks().includes(value)}
      accessibilityLabel={label}
      onChange={({ pressed }) =>
        marks.set(pressed ? [...marks(), value] : marks().filter((m) => m !== value))
      }
      class="group size-8 items-center justify-center rounded-(--radius) aria-pressed:bg-accent"
    >
      <Text class="text-sm text-muted-foreground group-aria-pressed:text-accent-foreground">{label[0]}</Text>
    </Toggle>
  );
  return (
    <ToggleGroup class="flex-row self-start gap-1">
      {item("bold", "Bold")}
      {item("italic", "Italic")}
    </ToggleGroup>
  );
}

mount(App);
```

`Toggle` e `ToggleGroup` provengono da [`nsh/base`](../modules/nsh-base.md), il crate `nsh-base` in Rust. Il valore è dell'app: a ogni toggle viene comunicato se è premuto, una pressione riporta il valore che richiede con `onChange`, e il toggle mostra il `pressed` che l'app restituisce. Nemmeno il gruppo conserva un valore, quindi anche quanti toggle possano essere premuti è deciso dall'app: un numero qualsiasi (grassetto, corsivo e sottolineato), oppure esattamente uno (un allineamento, un selettore di vista), dove l'app preme il toggle richiesto, rilascia gli altri e mantiene premuto quello già premuto. In Rust, `toggle()` e `toggle_group()` li creano, con un setter per ogni prop (`.pressed(..)`), un listener per ogni evento (`.on_change(..)`), i metodi di stile tipizzati e `.child(..)` per il loro contenuto.

## Props

<a id="toggle-1"></a>

### Toggle

| Prop | Rust | Tipo | Default | Descrizione |
|---|---|---|---|---|
| `pressed` | `.pressed(..)` | `boolean` | `false` | Attivo o disattivo: gli screen reader dicono che è premuto, e si applicano gli stili `aria-pressed:`. Una pressione riporta l'altro valore con `onChange`; il toggle mostra il valore che l'app restituisce. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Nessuna pressione e nessun feedback di pressione; si applicano gli stili `disabled:`, e gli screen reader dicono che è disattivato. Anche un toggle in un `ToggleGroup` disabilitato è disabilitato. |
| `pressedStyle` | `.pressed_style(\|s\| ..)` | `StyleProp<ViewStyle>` | nessuno | Lo stile del toggle mentre è premuto e non disabilitato, come classi `aria-pressed:`. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | nessuno | Ciò che dicono gli screen reader: che cosa attiva il toggle, quando i suoi figli non hanno un testo che lo dica (un'icona). |
| `hitSlop` | `.hit_slop(..)` | `number \| Partial<Edges>` | nessuno | Quanto all'esterno dei suoi limiti le pressioni vengono ancora conteggiate, in punti: un numero per tutti i lati, oppure i lati indicati per nome. Come `hitSlop` di una vista. |
| `children` | `.child(..)` | `JSX.Element` | nessuno | L'icona o l'etichetta dell'app, che gli screen reader leggono. |
| `class`, `style` | metodi di stile | `string`, `StyleProp<ViewStyle>` | nessuno | Il toggle stesso: la superficie attorno al suo contenuto. |
| `activeStyle`, `hoverStyle`, `focusStyle`, `disabledStyle` | `.active(\|s\| ..)`, `.hover(..)`, `.focus(..)`, `.disabled_style(..)` | `StyleProp<ViewStyle>` | nessuno | Lo stile del toggle mentre una pressione è in corso, con il mouse sopra, con il focus o disabilitato, come le classi `<state>:`. |

### ToggleGroup

| Prop | Rust | Tipo | Default | Descrizione |
|---|---|---|---|---|
| `disabled` | `.disabled(..)` | `boolean` | `false` | Ogni toggle del gruppo è disabilitato, indipendentemente dal proprio `disabled`. |
| `children` | `.child(..)` | `JSX.Element` | nessuno | I toggle del gruppo, e qualsiasi cosa l'app disponga tra di essi (un separatore). |
| `class`, `style` | metodi di stile | `string`, `StyleProp<ViewStyle>` | nessuno | Il layout e l'aspetto del gruppo: una colonna per impostazione predefinita, `flex-row` per una riga. |

<a id="events"></a>

## Eventi

| Evento | Rust | Descrizione |
|---|---|---|
| `onChange` (`Toggle`) | `.on_change(\|pressed: &bool\| ..)` | Il toggle è stato premuto: un tocco, un clic, Spazio o Invio mentre ha il focus della tastiera, o l'attivazione da parte di uno screen reader. `{ pressed }` è il valore che richiede, l'opposto di `pressed`. Viene eseguito prima che cambi qualsiasi cosa: il toggle mostra il `pressed` che l'app restituisce. |

Un tasto freccia di un `ToggleGroup` sposta soltanto il focus della tastiera: non preme nulla. Un toggle disabilitato non riporta nulla.

<a id="parts"></a>

## Parti

| Parte | Dentro | Stile tramite | Stati |
|---|---|---|---|
| Il gruppo | | `ToggleGroup`: `class`, `style` | |
| Il toggle | il gruppo, o ovunque | `Toggle`: `class`, `style` | `aria-pressed:`, `disabled:`, `active:`, `hover:`, `focus:` (o `pressedStyle`, `disabledStyle`, ...) |
| L'icona o l'etichetta | il toggle | i propri elementi (`children`) | `group-aria-pressed:`, `group-disabled:` e le altre varianti `group-*:` con `group` sul `class` del toggle |

`aria-pressed:` indica che il toggle è attivo; `active:` indica una pressione in corso, da attivo o da disattivo. Mostra un toggle premuto attraverso la sua superficie: un riempimento, una pillola in rilievo, un'icona più marcata (vedi [Linee guida di design](../docs/design-guides.md#interaction-states)).

## Segmented

Un gruppo i cui toggle sono uniti, con uno solo premuto alla volta, è un controllo segmentato (un selettore di vista): l'app conserva un solo valore e preme il toggle che lo nomina. L'aspetto unito è dato dalle classi dell'app:

```tsx
<ToggleGroup class="flex-row self-start">
  <Each of={["grid", "list"]}>
    {(value) => (
      <Toggle
        pressed={view() === value()}
        accessibilityLabel={`${value()} view`}
        onChange={({ pressed }) => pressed && view.set(value())}
        class="-ml-px h-8 px-3 border border-border first:ml-0 first:rounded-l-(--radius) last:rounded-r-(--radius) aria-pressed:bg-accent"
      >
        <Text class="text-sm">{value()}</Text>
      </Toggle>
    )}
  </Each>
</ToggleGroup>
```

<a id="disabled"></a>

## Disabilitato

Un toggle disabilitato non accetta pressioni, e gli screen reader lo annunciano come disattivato. Le sue classi `disabled:` si applicano sopra quelle `aria-pressed:`, e le classi `group-disabled:` al suo interno le seguono. `disabled` su un `ToggleGroup` disabilita ogni toggle al suo interno, una barra degli strumenti bloccata dall'app:

```tsx
<ToggleGroup disabled={readonly()} class="flex-row gap-1">
  <Toggle pressed={bold()} onChange={({ pressed }) => bold.set(pressed)} class="size-8 disabled:opacity-50">
    <Text>B</Text>
  </Toggle>
</ToggleGroup>
```

<a id="a-small-target-with-hitslop"></a>

## Un bersaglio piccolo con hitSlop

Un toggle con icona può essere più piccolo di un dito. `hitSlop` fa sì che le pressioni che cadono vicino a esso vengano conteggiate, in punti oltre ciascun lato, senza cambiarne il layout o l'aspetto: un numero per tutti i lati, oppure i lati indicati per nome (`{ top: 8, bottom: 8 }`), come li accetta il [`hitSlop` di una vista](./index.md#presses-and-feedback).

```tsx
<Toggle
  pressed={favorite()}
  hitSlop={12}
  accessibilityLabel="Favorite"
  onChange={({ pressed }) => favorite.set(pressed)}
  class="size-5 items-center justify-center"
>
  <Text>★</Text>
</Toggle>
```

<a id="accessibility"></a>

## Accessibilità

- Un toggle è un unico elemento per gli screen reader, con il ruolo `"button"` e il suo stato di pressione: un pulsante toggle. La sua etichetta è il testo dei suoi figli, oppure `accessibilityLabel`.
- `ToggleGroup` ha il ruolo `"toolbar"`: gli screen reader sentono i toggle al suo interno come un'unica barra degli strumenti, ciascuno comunque un elemento a sé.
- `disabled` viene annunciato come lo annuncia la piattaforma (VoiceOver, TalkBack, UI Automation, l'albero di accessibilità del browser).
- Su macOS e sul web il gruppo è una sola sosta del focus della tastiera, e i tasti freccia si spostano tra i suoi toggle (vedi sotto).

Vedi [Accessibilità](../docs/accessibility.md) per etichette, ruoli e annunci in generale.

<a id="keyboard"></a>

## Tastiera

Su macOS e sul web, dove Tab raggiunge le viste che accettano pressioni, un `ToggleGroup` segue il [pattern toolbar di WAI-ARIA](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/):

| Tasto | Cosa fa |
|---|---|
| Tab, Shift+Tab | Entra nel gruppo sul primo toggle premuto (il primo toggle non disabilitato se nessuno è premuto), e lo lascia in un solo passaggio. |
| Freccia destra, Freccia giù | Sposta il focus sul toggle successivo, dall'ultimo al primo. |
| Freccia sinistra, Freccia su | Sposta il focus sul toggle precedente, dal primo all'ultimo. |
| Home, End | Sposta il focus sul primo o sull'ultimo toggle. |
| Spazio, Invio | Preme il toggle con il focus. |

I tasti freccia saltano i toggle disabilitati e non premono nulla: un toggle cambia solo quando viene premuto. Entrambe le coppie di frecce spostano il focus, qualunque sia il layout del gruppo, che è una classe dell'app. In un layout da destra a sinistra, Freccia sinistra e Freccia destra si scambiano: Freccia sinistra passa al toggle successivo e Freccia destra al precedente; Freccia su, Freccia giù, Home ed End restano invariati. Gli stili `focus:` mostrano dove si trova il focus. Un `Toggle` fuori da un `ToggleGroup` è una sosta a sé.

<a id="platform-notes"></a>

## Note sulle piattaforme

- iOS, Android e Mac Catalyst: una pressione è un tocco che termina sul toggle, contenuto incluso.
- Desktop (macOS, Windows, Linux, GPUI) e web: una pressione è un clic. Su macOS e sul web, anche Spazio e Invio premono il toggle che ha il focus della tastiera, e i tasti freccia, Home ed End lo spostano ([Tastiera](#keyboard)).
- Ogni piattaforma disegna ciò che l'app stila: i toggle, la superficie di quelli premuti e la traccia del gruppo.
