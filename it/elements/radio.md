---
title: "Radio"
description: "Radio e RadioGroup: un insieme di opzioni tra cui l'utente sceglie esattamente una. Ogni radio gestisce i tocchi, l'attivazione da tastiera, lo stato disabilitato, il proprio ruolo e lo stato di selezione per gli screen reader; il gruppo è l'insieme; l'aspetto e il valore sono responsabilità dell'app."
group: base
demo: el-radio
source_hash: 051314109ae3d0b2
---

# Radio

Le radio offrono un insieme di opzioni tra cui l'utente ne sceglie esattamente una: un piano, un ordinamento, un tema. Ogni `Radio` gestisce il comportamento di una opzione: pressioni, attivazione da tastiera, stato disabilitato, e il ruolo radio con il relativo stato checked per gli screen reader. Un `RadioGroup` attorno ad esse costituisce l'insieme, che gli screen reader annunciano come un unico gruppo. L'aspetto è dell'app: una radio non ha un proprio cerchio, punto, colori, dimensioni o etichetta. I suoi figli sono l'indicatore e l'etichetta dell'app, e le classi `checked:` sulla radio, o le classi `group-checked:` su ciò che contiene, ne seguono lo stato.

```rust tabs
use nsh_base::{radio, radio_group, theme};
use nsh_core::prelude::*;

fn plans() -> impl IntoElement {
    let plan = signal("basic");
    let option = move |value: &'static str, label: &'static str| {
        let checked = move || plan.get() == value;
        radio()
            .checked(checked)
            .on_change(move |_: &bool| plan.set(value))
            .flex_row()
            .items_center()
            .gap_2()
            .child(
                view()
                    .size(px(20.0))
                    .items_center()
                    .justify_center()
                    .rounded_full()
                    .border_2()
                    .border_color(move || theme().border)
                    .child(
                        view()
                            .size(px(10.0))
                            .rounded_full()
                            .bg(move || theme().primary)
                            .opacity(move || if checked() { 1.0_f32 } else { 0.0 }),
                    ),
            )
            .child(text(label))
    };
    radio_group()
        .gap_3()
        .child(option("basic", "Basic"))
        .child(option("pro", "Pro"))
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { Radio, RadioGroup } from "nsh/base";

function App() {
  const plan = signal("basic");
  const option = (value: string, label: string) => (
    <Radio
      checked={plan() === value}
      onChange={() => plan.set(value)}
      class="group flex-row items-center gap-2"
    >
      <View class="size-5 items-center justify-center rounded-full border-2 border-border group-checked:border-primary">
        <View class="size-2.5 rounded-full group-checked:bg-primary" />
      </View>
      <Text>{label}</Text>
    </Radio>
  );
  return (
    <RadioGroup class="gap-3">
      {option("basic", "Basic")}
      {option("pro", "Pro")}
    </RadioGroup>
  );
}

mount(App);
```

`Radio` e `RadioGroup` provengono da [`nsh/base`](../modules/nsh-base.md), il crate `nsh-base` in Rust. Il valore appartiene all'app: il gruppo non ne conserva alcuno. A ogni radio viene comunicato se è selezionata; una pressione su una radio non selezionata segnala `onChange({ checked: true })`, l'app imposta il proprio valore, e ogni radio mostra il `checked` che l'app restituisce. In Rust, `radio()` e `radio_group()` le creano, con un setter per ogni prop (`.checked(..)`), un listener per ogni evento (`.on_change(..)`), i metodi di stile tipizzati e `.child(..)` per il loro contenuto.

## Props

<a id="radio-1"></a>

### Radio

| Prop | Rust | Tipo | Predefinito | Descrizione |
|---|---|---|---|---|
| `checked` | `.checked(..)` | `boolean` | `false` | Selezionata o no. Una pressione su una radio non selezionata segnala `true` con `onChange`; la radio mostra il valore che l'app restituisce. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Nessuna pressione e nessun feedback alla pressione; si applicano gli stili `disabled:`, e gli screen reader dicono che è attenuata. |
| `checkedStyle` | `.checked_style(\|s\| ..)` | `StyleProp<ViewStyle>` | nessuno | Lo stile della radio mentre è selezionata e non disabilitata, come classi `checked:`. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | nessuno | Ciò che dicono gli screen reader: l'opzione, quando i figli non hanno un testo che la esprima. |
| `hitSlop` | `.hit_slop(..)` | `number \| Partial<Edges>` | nessuno | Di quanto fuori dai suoi limiti le pressioni contano ancora, in punti: un numero per tutti i lati, oppure i lati indicati per nome. Come `hitSlop` di una view. |
| `children` | `.child(..)` | `JSX.Element` | nessuno | L'indicatore e l'etichetta dell'app, che gli screen reader leggono. |
| `class`, `style` | metodi di stile | `string`, `StyleProp<ViewStyle>` | nessuno | La radio stessa: la riga attorno all'indicatore e all'etichetta. |
| `activeStyle`, `hoverStyle`, `focusStyle`, `disabledStyle` | `.active(\|s\| ..)`, `.hover(..)`, `.focus(..)`, `.disabled_style(..)` | `StyleProp<ViewStyle>` | nessuno | Lo stile della radio mentre è premuta, in hover, con il focus o disabilitata, come classi `<state>:`. |

### RadioGroup

| Prop | Rust | Tipo | Predefinito | Descrizione |
|---|---|---|---|---|
| `children` | `.child(..)` | `JSX.Element` | nessuno | Le radio dell'insieme, e qualsiasi cosa l'app disponga tra di esse. |
| `class`, `style` | metodi di stile | `string`, `StyleProp<ViewStyle>` | nessuno | Il layout e l'aspetto del gruppo: una colonna per impostazione predefinita, `flex-row` per una riga. |

<a id="events"></a>

## Eventi

| Evento | Rust | Descrizione |
|---|---|---|
| `onChange` (`Radio`) | `.on_change(\|checked: &bool\| ..)` | Una radio non selezionata è stata premuta: un tap, un clic, Space o Return mentre ha il focus da tastiera, oppure l'attivazione da parte di uno screen reader; oppure un tasto freccia del suo gruppo ha spostato il focus da tastiera su di essa. Chiede di essere selezionata, quindi `checked` è `true`. Viene eseguito prima che cambi qualsiasi cosa: la radio mostra il `checked` che l'app restituisce. |

Una radio selezionata resta selezionata e non segnala nulla, poiché una radio non può deselezionarsi da sola; nemmeno una radio disabilitata segnala nulla.

<a id="parts"></a>

## Parti

| Parte | Dentro | Stilizzata con | Stati |
|---|---|---|---|
| Il gruppo | | `RadioGroup`: `class`, `style` | |
| La radio | il gruppo | `Radio`: `class`, `style` | `checked:`, `disabled:`, `active:`, `hover:`, `focus:` (o `checkedStyle`, `disabledStyle`, ...) |
| L'indicatore e l'etichetta | la radio | propri elementi (`children`) | `group-checked:`, `group-disabled:` e le altre varianti `group-*:` con `group` su `class` della radio |

L'indicatore è contenuto dell'app: un anello con un punto, un segno di spunta, una card evidenziata. Con `group` su `class` della radio, le sue classi `group-checked:` mostrano il punto mentre la radio è selezionata.

<a id="disabled"></a>

## Disabilitato

Una radio disabilitata non accetta pressioni, e gli screen reader la annunciano come attenuata. Le sue classi `disabled:` si applicano sopra quelle `checked:`, e le classi `group-disabled:` al suo interno le seguono:

```tsx
<Radio
  checked={plan() === "team"}
  disabled={!eligible()}
  onChange={() => plan.set("team")}
  class="group flex-row items-center gap-2 disabled:opacity-50"
>
  <View class="size-5 items-center justify-center rounded-full border-2 border-border group-checked:border-primary">
    <View class="size-2.5 rounded-full group-checked:bg-primary" />
  </View>
  <Text>Team</Text>
</Radio>
```

<a id="a-small-target-with-hitslop"></a>

## Un'area piccola con hitSlop

Una radio senza etichetta accanto (un punto nella riga di una tabella) può essere più piccola di un dito. `hitSlop` fa contare le pressioni che cadono vicino ad essa, in punti oltre ciascun lato, senza cambiarne il layout o l'aspetto: un numero per tutti i lati, oppure i lati indicati per nome (`{ top: 8, bottom: 8 }`), come li accetta `hitSlop` di una [view](./index.md#presses-and-feedback).

```tsx
<Radio
  checked={plan() === "team"}
  hitSlop={12}
  accessibilityLabel="Team"
  onChange={() => plan.set("team")}
  class="group size-5 items-center justify-center rounded-full border-2 border-border group-checked:border-primary"
>
  <View class="size-2.5 rounded-full group-checked:bg-primary" />
</Radio>
```

<a id="accessibility"></a>

## Accessibilità

- Una radio è un unico elemento per gli screen reader, con il ruolo `"radio"` e il suo stato: selezionata o no, e selected mentre è selezionata, poiché alcuni screen reader leggono l'uno e altri l'altro (le radio di UI Automation sono elementi di selezione). Il suo indicatore e la sua etichetta ne sono parti; la sua etichetta è il testo dei suoi figli, oppure `accessibilityLabel`.
- Un `RadioGroup` ha il ruolo `"radiogroup"`: gli screen reader sentono le radio al suo interno come un unico insieme, ciascuna comunque un elemento a sé.
- `disabled` viene annunciato come lo annuncia la piattaforma (VoiceOver, TalkBack, UI Automation, l'albero di accessibilità del browser).
- Su macOS e sul web un `RadioGroup` è una sola tappa del focus da tastiera, e i tasti freccia si spostano tra le sue radio e le selezionano (vedi sotto).

Vedi [Accessibilità](../docs/accessibility.md) per etichette, ruoli e annunci in generale.

<a id="keyboard"></a>

## Tastiera

Su macOS e sul web, dove Tab raggiunge le view che accettano pressioni, un `RadioGroup` segue il [pattern WAI-ARIA per i radio group](https://www.w3.org/WAI/ARIA/apg/patterns/radio/):

| Tasto | Cosa fa |
|---|---|
| Tab, Shift+Tab | Entra nel gruppo sulla radio selezionata (la prima radio non disabilitata se nessuna lo è), e lo lascia in un solo passaggio. |
| Giù, Destra | Sposta il focus sulla radio successiva, dall'ultima alla prima, e la seleziona. |
| Su, Sinistra | Sposta il focus sulla radio precedente, dalla prima all'ultima, e la seleziona. |
| Space | Seleziona la radio con il focus. |

I tasti freccia saltano le radio disabilitate; la radio su cui si spostano chiede di essere selezionata con `onChange`, e l'app la seleziona. In un layout da destra a sinistra Sinistra e Destra si scambiano: Sinistra passa alla radio successiva e Destra alla precedente; Su e Giù mantengono le proprie. Gli stili `focus:` mostrano dove si trova il focus. Un `Radio` fuori da un `RadioGroup` è una tappa a sé, che Tab raggiunge e che Space e Return selezionano.

<a id="platform-notes"></a>

## Note sulle piattaforme

- iOS, Android e Mac Catalyst: una pressione è un tap che termina sulla radio, etichetta inclusa.
- Desktop (macOS, Windows, Linux, GPUI) e web: una pressione è un clic. Su macOS e sul web, Space e Return selezionano anche la radio che ha il focus da tastiera, e i tasti freccia lo spostano ([Tastiera](#keyboard)).
- Ogni piattaforma disegna ciò che l'app stilizza: l'indicatore, l'etichetta e le loro transizioni.
