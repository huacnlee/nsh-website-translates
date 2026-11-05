---
title: "NumberInput"
description: "Il componente NumberInput: un numero digitato in un campo o incrementato con i pulsanti, i tasti freccia e gli screen reader, mantenuto entro i decimali del suo step e i valori min e max, con un campo, dei pulsanti e una colonna di controlli che l'app può stilizzare."
group: base
demo: el-number-input
source_hash: 4dd788dd07f8f04a
---

# NumberInput

Un campo numerico contiene un numero che l'utente digita o modifica a passi: una quantità, un prezzo, una dimensione. Gestisce da sé il proprio comportamento: il suo campo accetta un numero, o il testo che sta per diventarlo (`-`, `1.`), e rifiuta tutto il resto, comprese le cifre e i segni di altre tastiere; i suoi pulsanti, i tasti Su e Giù e le azioni di incremento e decremento di uno screen reader fanno avanzare il numero di `step`, mantenendone i decimali, e si fermano a `min` e `max`; uscendo dal campo, un numero digitato viene riportato entro tali limiti. L'aspetto spetta all'app: un `NumberInput` non ha colori, dimensioni, bordi, icone o stringhe proprie. È composto dal pulsante di decremento, dal campo tra `prefix` e `suffix` dell'app, e dal pulsante di incremento (oppure dal campo tra questi e una colonna con entrambi i pulsanti, `controlsRight`); l'app applica lo stile a ogni parte e riempie i pulsanti.

```rust tabs
use nsh_base::{number_input, theme};
use nsh_core::prelude::*;

fn tickets(count: Signal<Option<f64>>) -> impl IntoElement {
    number_input()
        .value(move || count.get())
        .min(1.0)
        .max(10.0)
        .accessibility_label("Tickets")
        .on_change(move |next: &Option<f64>| count.set(*next))
        .h(px(32.0))
        .flex_row()
        .rounded(px(8.0))
        .border_1()
        .border_color(move || theme().input)
        .input_style(|s| s.flex_1().text_center().text_color(move || theme().foreground))
        .decrement_button_style(|s| s.w(px(32.0)).items_center().justify_center())
        .increment_button_style(|s| s.w(px(32.0)).items_center().justify_center())
        .decrement_button(text("−"))
        .increment_button(text("+"))
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { NumberInput } from "nsh/base";

function App() {
  const tickets = signal<number | null>(2);
  return (
    <NumberInput
      value={tickets()}
      onChange={({ value }) => tickets.set(value)}
      min={1}
      max={10}
      accessibilityLabel="Tickets"
      class="h-8 flex-row overflow-hidden rounded-lg border border-input bg-field focus-within:outline-2 focus-within:outline-ring"
      inputClass="flex-1 text-center text-foreground"
      decrementButtonClass="w-8 items-center justify-center enabled:hover:bg-accent active:bg-muted disabled:opacity-40"
      incrementButtonClass="w-8 items-center justify-center enabled:hover:bg-accent active:bg-muted disabled:opacity-40"
      decrementButton={<Text>−</Text>}
      incrementButton={<Text>+</Text>}
    />
  );
}

mount(App);
```

`NumberInput` proviene da [`nsh/base`](../modules/nsh-base.md), il crate `nsh-base` in Rust. In Rust, `number_input()` ne crea uno con un setter per ogni prop (`.value(..)`, `.input_style(..)`), un metodo listener per ogni evento (`.on_change(..)`), i metodi di stile tipizzati per il campo numerico stesso, e `.prefix(..)` / `.suffix(..)` per ciò che sta attorno al campo. Il suo valore è un `Option<f64>`.

<a id="value"></a>

## Valore

Il valore è un numero, oppure `null` per un campo vuoto. L'app lo gestisce con `value` e imposta quello riportato da `onChange`, come per ogni controllo di `nsh/base`; oppure lascia il valore al campo numerico con `defaultValue`, e riceve comunque le modifiche.

Il testo del campo e il valore sono tenuti separati dove serve, in modo che l'utente possa digitare liberamente:

- `onChange` riporta il numero che il testo rappresenta ogni volta che tale numero cambia: `null` quando il testo non rappresenta alcun numero (vuoto, `-`, `.`); digitare `1.` dopo `1`, o `1.50` dopo `1.5`, non riporta nulla.
- Il testo resta come l'utente lo digita finché rappresenta il valore che il campo numerico contiene, quindi un campo controllato che restituisce ogni valore riportato mantiene `1.` e `2.50`. Un valore impostato dall'app che il campo non ha riportato compare nel campo come il testo più breve che lo rappresenta (`0.3`, `12`).
- Durante la digitazione un numero può essere fuori da `min` e `max` (1 sulla strada verso 15 con `min={10}`) e viene riportato così com'è digitato. Quando si esce dal campo, o con Invio, il valore viene riportato entro l'intervallo e ciò viene segnalato; un testo che non rappresenta alcun numero resta invariato.
- Un passo (un pulsante, un tasto, un'azione di uno screen reader) richiede il valore successivo con `onChange`; con un valore controllato il campo si aggiorna quando l'app lo restituisce, mantenendo i decimali del passo (`99.5` incrementato di `max={100}` mostra `100.0`), quindi un'app che rifiuta un passo lascia il campo dov'è. Una modifica rifiutata dall'app resta nel campo finché lo si modifica, e scompare quando si esce dal campo.

```tsx
const price = signal<number | null>(19.95);

<NumberInput
  value={price()}
  onChange={({ value }) => price.set(value)}
  onSubmit={({ value }) => save(value)}
  min={0}
  step={0.05}
  placeholder="Price"
  accessibilityLabel="Price"
/>;
```

Il campo accetta:

- Cifre, un solo punto decimale e un segno all'inizio (`+` o `-`); una lettera, un secondo punto o segno, o un segno in altra posizione vengono rifiutati e il campo torna al proprio testo.
- Cifre, segni e punto a larghezza piena, il segno meno (U+2212) e il punto fermo ideografico (`。`), letti come le rispettive forme ASCII, come li digitano i metodi di input cinesi e giapponesi.
- Una virgola come punto decimale finché il testo non contiene un punto (`3,25` è 3.25), come la digita il tasto decimale delle tastiere di molte lingue.

## Props

| Prop | Rust | Tipo | Predefinito | Descrizione |
|---|---|---|---|---|
| `value` | `.value(..)` | `number \| null` | nessuno | Il valore (controllato): un numero, oppure `null` per un campo vuoto. L'app imposta quello riportato da `onChange`. |
| `defaultValue` | `.default_value(..)` | `number \| null` | nessuno | Il valore iniziale finché `value` non è impostato; il campo numerico conserva poi un valore proprio. |
| `min` | `.min(..)` | `number` | nessuno | Il valore minimo: i passi si fermano qui, un valore digitato inferiore viene riportato a questo limite quando si esce dal campo. |
| `max` | `.max(..)` | `number` | nessuno | Il valore massimo, come `min` ma dall'alto; uno inferiore a `min` equivale a `min`. |
| `step` | `.step(..)` | `number` | `1` | Di quanto avanza un passo (Pag Su / Pag Giù: dieci passi); uno che non sia un numero positivo equivale a `1`. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Nessuna digitazione, passo o focus; le classi `disabled:` si applicano al campo numerico e alle sue parti. |
| `readonly` | `.readonly(..)` | `boolean` | `false` | Il testo può essere selezionato e copiato ma non modificato, né digitando né con i passi; i pulsanti sono disabilitati. |
| `placeholder` | `.placeholder(..)` | `string` | nessuno | Mostrato quando il campo è vuoto. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | nessuno | Ciò che gli screen reader leggono per il campo, quando nessuna etichetta visibile lo nomina. |
| `controlsRight` | `.controls_right(..)` | `boolean` | `false` | Entrambi i pulsanti in colonna a destra del campo, l'incremento sopra il decremento. Letto quando il campo numerico viene creato. |
| `inputClass`, `inputStyle` | `.input_style(\|s\| ..)` | `string`, `StyleProp<InputStyle>` | nessuno | Il campo: il suo riquadro e il suo testo (`color`, `fontSize`, `textAlign`, `placeholderColor`, `caretColor`). |
| `decrementButtonClass`, `decrementButtonStyle` | `.decrement_button_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | nessuno | Il pulsante di decremento. |
| `incrementButtonClass`, `incrementButtonStyle` | `.increment_button_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | nessuno | Il pulsante di incremento. |
| `decrementButton`, `incrementButton` | `.decrement_button(..)`, `.increment_button(..)` | `JSX.Element` | nessuno | Il contenuto dei pulsanti: un segno, un'icona. |
| `controlsClass`, `controlsStyle` | `.controls_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | nessuno | La colonna che contiene entrambi i pulsanti con `controlsRight`. |
| `prefix` | `.prefix(..)` | `JSX.Element` | nessuno | Ciò che precede il campo, dopo il pulsante alla sua sinistra: un simbolo di valuta, un'icona. |
| `suffix` | `.suffix(..)` | `JSX.Element` | nessuno | Ciò che segue il campo, prima dei pulsanti alla sua destra: un'unità, una valuta. |
| `class`, `style` | metodi di stile | `string`, `StyleProp<ViewStyle>` | nessuno | Il campo numerico stesso: la riga attorno al campo e ai pulsanti. |

<a id="events"></a>

## Eventi

| Evento | Rust | Payload | Quando |
|---|---|---|---|
| `onChange` | `.on_change(\|value: &Option<f64>\| ..)` | `{ value: number \| null }` | Il numero che il campo rappresenta è cambiato (digitazione, un passo, un incremento o decremento di uno screen reader, uscita dal campo con un valore fuori intervallo). |
| `onSubmit` | `.on_submit(\|value: &Option<f64>\| ..)` | `{ value: number \| null }` | Invio nel campo: il valore, riportato entro `min` e `max`. |
| `onFocus` | `.on_focus(..)` | nessuno | Il campo ha ricevuto il focus della tastiera. |
| `onBlur` | `.on_blur(..)` | nessuno | Il campo ha perso il focus della tastiera (prima il suo valore viene riportato entro `min` e `max`). |

<a id="parts"></a>

## Parti

| Parte | Posizione | Stile applicato con |
|---|---|---|
| Il campo numerico | | `class`, `style` |
| Il pulsante di decremento | nel campo numerico, per primo (con `controlsRight`: la colonna dei controlli, secondo) | `decrementButtonClass`, `decrementButtonStyle`; il suo contenuto `decrementButton` |
| Il campo | nel campo numerico | `inputClass`, `inputStyle` |
| Il prefisso | nel campo numerico, prima del campo | propri elementi (`prefix`) |
| Il suffisso | nel campo numerico, dopo il campo | propri elementi (`suffix`) |
| Il pulsante di incremento | nel campo numerico, per ultimo (con `controlsRight`: la colonna dei controlli, primo) | `incrementButtonClass`, `incrementButtonStyle`; il suo contenuto `incrementButton` |
| La colonna dei controlli | nel campo numerico, per ultima, con `controlsRight` | `controlsClass`, `controlsStyle` |

Il campo numerico è una riga che l'app dispone: `flex-row` su `class`, e `flex-1` sul campo per dargli lo spazio che i pulsanti lasciano. Gli stati che le parti mostrano:

- Il campo numerico: `focus-within:` mentre il suo campo è in modifica (un anello attorno all'intero campo numerico), `disabled:`.
- Il campo: `focus:` mentre è in modifica, `disabled:`.
- Un pulsante: `hover:` sotto il puntatore, `active:` mentre è premuto, `disabled:` quando il campo numerico è disabilitato o di sola lettura e dove un passo non avrebbe effetto (il decremento a `min`, l'incremento a `max`). Metti l'hover dietro `enabled:` (`enabled:hover:bg-accent`) così che un pulsante disabilitato non si illumini.

Il movimento degli stati è una scelta dell'app (`transition-colors`), e `motion-reduce:` lo mantiene fermo per chi chiede meno movimento.

<a id="keyboard"></a>

## Tastiera

Mentre il campo è in modifica, il campo numerico accetta i tasti dello spin button di WAI-ARIA, che si ripetono se tenuti premuti:

| Tasto | Azione |
|---|---|
| Su | Un passo in su. |
| Giù | Un passo in giù. |
| Pag Su, Pag Giù | Dieci passi in su o in giù. |

Home e Fine restano del campo: spostano il cursore nel testo. I pulsanti non sono tappe del focus della tastiera: Tab porta dal campo a ciò che segue il campo numerico, e la pressione di un pulsante lascia il focus nel campo (sui desktop la pressione sposta il focus sul campo se era altrove; sui touch screen lo lascia dov'è, così non compare alcuna tastiera).

<a id="accessibility"></a>

## Accessibilità

- Il campo è uno spin button (`"spinbutton"`) con la sua etichetta, il suo valore (il numero che rappresenta, tra `min` e `max`) e il suo testo.
- Le azioni di incremento e decremento di uno screen reader (lo scorrimento verso l'alto e verso il basso di VoiceOver) lo fanno avanzare a passi, come Su e Giù.
- I pulsanti sono nascosti agli screen reader, come quelli del campo numerico di un browser: l'incremento e il decremento propri del campo lo fanno avanzare a passi.
- Quando `disabled`, gli screen reader indicano che il campo è disattivato.

Vedi [Accessibilità](../docs/accessibility.md) per etichette, ruoli e azioni in generale.

<a id="platform-notes"></a>

## Note sulle piattaforme

- Il campo è il campo di testo della piattaforma ([Input](./input.md)): la tastiera, il cursore, la selezione, copia e incolla e i metodi di input sono quelli del sistema. I telefoni mostrano una tastiera decimale, con un segno quando `min` è inferiore a 0 o non è impostato.
- Ogni piattaforma disegna ciò a cui l'app applica lo stile. Su / Giù e Pag Su / Pag Giù raggiungono il campo numerico da una tastiera fisica su ogni piattaforma.
