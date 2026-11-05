---
title: "Checkbox"
description: "Il componente Checkbox: un controllo selezionato, non selezionato o indeterminato che gestisce le pressioni, l'attivazione da tastiera, lo stato disabilitato e il proprio ruolo e valore per gli screen reader, con un indicatore che l'app stila e contrassegna."
group: base
demo: el-checkbox
source_hash: c31b1f22eacafd92
---

# Checkbox

Un checkbox seleziona un'opzione, un elemento di una lista o tutti. È selezionato, deselezionato o indeterminato (né l'uno né l'altro: un "seleziona tutto" su una selezione parziale). Gestisce il comportamento: pressioni, attivazione da tastiera, stato disabilitato, il ruolo checkbox e il suo valore per gli screen reader. L'aspetto spetta all'app: un `Checkbox` non ha casella, segno, colori, dimensioni o etichetta propri. È composto da un indicatore (la casella) con il segno dell'app al suo interno, poi dai suoi figli (un'etichetta), e l'app stilizza ogni parte con le classi `checked:`, `indeterminate:` e `disabled:` che seguono il checkbox.

```rust tabs
use nsh_base::{checkbox, theme};
use nsh_core::prelude::*;

fn notify() -> impl IntoElement {
    let on = signal(false);
    checkbox()
        .checked(on)
        .on_change(move |next: &bool| on.set(*next))
        .flex_row()
        .items_center()
        .gap_2()
        .indicator_style(|s| {
            s.size(px(20.0))
                .items_center()
                .justify_center()
                .rounded_md()
                .border_2()
                .border_color(move || theme().border)
                .transition_colors()
                .checked(|s| s.bg(move || theme().primary).border_color(move || theme().primary))
        })
        .indicator(text(move || if on.get() { "✓" } else { "" }).text_color(move || theme().primary_foreground))
        .child(text("Notify me"))
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { Checkbox } from "nsh/base";

function App() {
  const on = signal(false);
  return (
    <Checkbox
      checked={on()}
      onChange={({ checked }) => on.set(checked)}
      class="flex-row items-center gap-2"
      indicatorClass="size-5 items-center justify-center rounded-md border-2 border-border transition-colors checked:border-primary checked:bg-primary"
      indicator={<Text class="text-primary-foreground">{on() ? "✓" : ""}</Text>}
    >
      <Text>Notify me</Text>
    </Checkbox>
  );
}

mount(App);
```

`Checkbox` proviene da [`nsh/base`](../modules/nsh-base.md), il crate `nsh-base` in Rust. Il valore spetta all'app: una pressione segnala il valore successivo con `onChange`, e il checkbox mostra i valori `checked` e `indeterminate` che l'app restituisce. In Rust, `checkbox()` ne crea uno con un setter per ogni prop (`.checked(..)`, `.indicator_style(..)`), un listener per ogni evento (`.on_change(..)`), i metodi di stile tipizzati per il checkbox stesso e `.child(..)` per la sua etichetta; lo stile dell'indicatore accetta i metodi di stato (`.checked(..)`, `.indeterminate(..)`, `.disabled_style(..)`) che seguono il checkbox.

## Props

| Prop | Rust | Tipo | Predefinito | Descrizione |
|---|---|---|---|---|
| `checked` | `.checked(..)` | `boolean` | `false` | Selezionato o no. Una pressione segnala il valore successivo con `onChange`; il checkbox mostra il valore che l'app restituisce. |
| `indeterminate` | `.indeterminate(..)` | `boolean` | `false` | Né selezionato né deselezionato, ha la precedenza su `checked` finché è attivo: gli screen reader lo annunciano come misto, e una pressione richiede selezionato. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Nessuna pressione e nessun feedback alla pressione; gli stili `disabled:` si applicano al checkbox e al suo indicatore, e gli screen reader lo annunciano come attenuato. |
| `checkedStyle` | `.checked_style(\|s\| ..)` | `StyleProp<ViewStyle>` | nessuno | Lo stile del checkbox quando è selezionato e non disabilitato, come classi `checked:`. |
| `indeterminateStyle` | `.indeterminate_style(\|s\| ..)` | `StyleProp<ViewStyle>` | nessuno | Lo stile del checkbox quando è indeterminato e non disabilitato, come classi `indeterminate:`. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | nessuno | Ciò che dicono gli screen reader: che cosa seleziona il checkbox, quando i suoi figli non hanno testo che lo dica. |
| `role` | `.role(..)` | `AccessibilityRole` | `"checkbox"` | Che cos'è per gli screen reader, quando è qualcosa di più specifico (una voce di menu selezionata: `"menuitem"`). |
| `indicatorClass`, `indicatorStyle` | `.indicator_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | nessuno | L'indicatore, la casella che mostra il valore. |
| `indicator` | `.indicator(..)` | `JSX.Element` | nessuno | Il contenuto dell'indicatore: il segno (una spunta, un trattino), che l'app mostra in base al suo valore. |
| `hitSlop` | `.hit_slop(..)` | `number \| Partial<Edges>` | nessuno | Quanto fuori dai suoi limiti le pressioni contano ancora, in punti: un numero per tutti i lati, oppure i lati indicati per nome. Come il `hitSlop` di una view. |
| `children` | `.child(..)` | `JSX.Element` | nessuno | Il contenuto dopo l'indicatore: un'etichetta, che gli screen reader leggono. |
| `class`, `style` | metodi di stile | `string`, `StyleProp<ViewStyle>` | nessuno | Il checkbox stesso: la riga attorno all'indicatore e all'etichetta. |
| `activeStyle`, `hoverStyle`, `focusStyle`, `disabledStyle` | `.active(\|s\| ..)`, `.hover(..)`, `.focus(..)`, `.disabled_style(..)` | `StyleProp<ViewStyle>` | nessuno | Lo stile del checkbox quando è premuto, in hover, con il focus o disabilitato, come classi `<state>:`. |

<a id="events"></a>

## Eventi

| Evento | Rust | Descrizione |
|---|---|---|
| `onChange` | `.on_change(\|checked: &bool\| ..)` | Il checkbox è stato premuto: un tap, un clic, Spazio o Invio mentre ha il focus della tastiera, oppure l'attivazione da parte di uno screen reader. Segnala il valore richiesto dal checkbox come `checked`: `true` da deselezionato e da indeterminato, `false` da selezionato. |

Un checkbox disabilitato non segnala nulla.

<a id="parts"></a>

## Parti

| Parte | Dentro | Stilizzata con | Stati |
|---|---|---|---|
| Il checkbox | | `class`, `style` | `checked:`, `indeterminate:`, `disabled:`, `active:`, `hover:`, `focus:` (oppure `checkedStyle`, `indeterminateStyle`, `disabledStyle`, ...) |
| L'indicatore | il checkbox, per primo | `indicatorClass`, `indicatorStyle` | `checked:`, `indeterminate:`, `disabled:` seguono il checkbox |
| Il segno | l'indicatore | elementi propri (`indicator`) | `group-checked:`, `group-indeterminate:` e le altre varianti `group-*:` con `group` su `indicatorClass` |
| L'etichetta | il checkbox, dopo l'indicatore | elementi propri (`children`) | varianti `group-*:` con `group` sul `class` del checkbox |

Il segno è contenuto dell'app, quindi mostra ciò che l'app decide: una spunta quando è selezionato e un trattino quando è indeterminato, scelti in base al valore che l'app detiene, oppure entrambi i segni, con le classi `group-checked:` / `group-indeterminate:` che scelgono quello mostrato.

<a id="indeterminate"></a>

## Indeterminato

Un checkbox "seleziona tutto" è indeterminato finché alcuni elementi sono selezionati. Una pressione richiede selezionato, e l'app seleziona ogni elemento:

```tsx
const selected = signal<string[]>([]);
const all = () => selected().length === items.length;
const some = () => selected().length > 0 && !all();

<Checkbox
  checked={all()}
  indeterminate={some()}
  onChange={({ checked }) => selected.set(checked ? items.map((i) => i.id) : [])}
  class="flex-row items-center gap-2"
  indicatorClass="group size-5 items-center justify-center rounded-md border-2 border-border checked:border-primary checked:bg-primary indeterminate:border-primary indeterminate:bg-primary"
  indicator={
    <>
      <Text class="hidden text-primary-foreground group-checked:flex">✓</Text>
      <View class="hidden h-0.5 w-2.5 bg-primary-foreground group-indeterminate:flex" />
    </>
  }
>
  <Text>Select all</Text>
</Checkbox>
```

<a id="disabled"></a>

## Disabilitato

Un checkbox disabilitato non accetta pressioni, e gli screen reader lo annunciano come attenuato. Le sue classi `disabled:` e quelle del suo indicatore si applicano, con precedenza su quelle `checked:` e `indeterminate:`:

```tsx
<Checkbox
  checked={on()}
  disabled={locked()}
  onChange={({ checked }) => on.set(checked)}
  class="flex-row items-center gap-2 disabled:opacity-50"
  indicatorClass="size-5 rounded-md border-2 border-border checked:border-primary checked:bg-primary disabled:border-border disabled:bg-muted"
>
  <Text>Share usage data</Text>
</Checkbox>
```

<a id="a-small-target-with-hitslop"></a>

## Un bersaglio piccolo con hitSlop

Un checkbox senza etichetta accanto (la casella di selezione di una riga) può essere più piccolo di un dito. `hitSlop` fa contare le pressioni che cadono vicino ad esso, in punti oltre ogni lato, senza cambiarne il layout o l'aspetto: un numero per tutti i lati, oppure i lati indicati per nome (`{ top: 8, bottom: 8 }`), come li accetta il [`hitSlop` di una view](./index.md#presses-and-feedback).

```tsx
<Checkbox
  checked={selected()}
  hitSlop={12}
  accessibilityLabel="Select row"
  onChange={({ checked }) => selected.set(checked)}
  indicatorClass="size-4 rounded border border-border checked:bg-primary"
/>
```

<a id="accessibility"></a>

## Accessibilità

- Un checkbox è un unico elemento per gli screen reader, con il ruolo `"checkbox"` (o il suo `role`) e il suo valore: selezionato, deselezionato o misto quando è indeterminato. L'indicatore e il segno ne sono parti. La sua etichetta è il testo dei suoi figli; indica `accessibilityLabel` quando non ne ha.
- `disabled` viene annunciato nel modo in cui lo annuncia la piattaforma (VoiceOver, TalkBack, UI Automation, l'albero di accessibilità del browser).
- Su macOS e sul web un checkbox è una tappa del focus da tastiera: Tab lo raggiunge, Spazio e Invio lo attivano, e gli stili `focus:` mostrano dove si trova il focus.

Vedi [Accessibilità](../docs/accessibility.md) per etichette, ruoli e annunci in generale.

<a id="platform-notes"></a>

## Note sulle piattaforme

- iOS, Android e Mac Catalyst: una pressione è un tap che termina sul checkbox, etichetta inclusa.
- Desktop (macOS, Windows, Linux, GPUI) e web: una pressione è un clic. Su macOS e sul web, Spazio e Invio attivano anche il checkbox che ha il focus da tastiera.
- Ogni piattaforma disegna ciò che l'app stilizza: l'indicatore, il segno e le loro transizioni.
