---
title: "OtpInput"
description: "Il componente OtpInput: un codice monouso numerico di lunghezza fissa, digitato, incollato o compilato automaticamente in un unico campo nativo, mostrato in celle, gruppi e un cursore che l'app può personalizzare."
group: base
demo: el-otp-input
source_hash: 80ea5e26b79a21ac
---

# OtpInput

Un input per codici monouso accetta un numero fisso di cifre (un codice di verifica ricevuto via SMS, il codice di un'app di autenticazione) e le mostra in celle. Gestisce da sé il comportamento: un solo campo di testo nativo, trasparente e posto sopra le celle, riceve la tastiera, quindi digitazione, metodi di input, incolla, tastierino numerico e compilazione automatica dei codici del sistema ("Da Messaggi" di iOS, suggerimenti SMS di Android) sono quelli nativi della piattaforma, e gli screen reader trovano un solo campo di testo. Entrano solo cifre, fino a `length`; Backspace rimuove l'ultima, e `onComplete` segnala quando il codice è completo. L'aspetto è dell'app: un `OtpInput` non ha colori, dimensioni, bordi né etichetta propri. Le sue parti sono le celle, i gruppi in cui sono suddivise e un cursore, e l'app stilizza ciascuna.

```rust tabs
use nsh_base::{OtpInputCompleteEvent, otp_input, theme};
use nsh_core::prelude::*;

fn verification(verify: impl Fn(&str) + 'static) -> impl IntoElement {
    let code = signal(SharedString::default());
    otp_input()
        .length(6)
        .groups(2)
        .value(move || Some(code.get()))
        .on_change(move |next: &SharedString| code.set(next.clone()))
        .on_complete(move |e: &OtpInputCompleteEvent| verify(&e.value))
        .accessibility_label("Verification code, 6 digits")
        .flex_row()
        .gap_3()
        .group_style(|s| s.flex_row().gap_2())
        .cell_style(|s| {
            s.w(px(40.0))
                .h(px(48.0))
                .items_center()
                .justify_center()
                .rounded(px(8.0))
                .border_1()
                .border_color(move || theme().input)
                .text_xl()
        })
        // The cell that takes the next digit, while the code has the focus,
        // and the cells that hold a digit.
        .cell_class("focus:border-ring data-filled:bg-muted")
        .caret_style(|s| s.w(px(2.0)).h(px(24.0)).bg(move || theme().foreground))
}
```

```tsx tabs
import { mount, signal } from "nsh";
import { OtpInput } from "nsh/base";

function App() {
  const code = signal("");
  const verify = (value: string) => console.log(`checking ${value}`);
  return (
    <OtpInput
      length={6}
      groups={2}
      value={code()}
      onChange={({ value }) => code.set(value)}
      onComplete={({ value }) => verify(value)}
      accessibilityLabel="Verification code, 6 digits"
      class="flex-row gap-3"
      groupClass="flex-row gap-2"
      cellClass="w-10 h-12 items-center justify-center rounded-lg border border-input text-xl focus:border-ring data-filled:bg-muted"
      caretClass="w-0.5 h-6 bg-foreground"
    />
  );
}

mount(App);
```

`OtpInput` proviene da [`nsh/base`](../modules/nsh-base.md), il crate `nsh-base` in Rust. In Rust, `otp_input()` ne crea uno con un setter per ogni prop (`.length(..)`, `.cell_style(..)`), un metodo listener per ogni evento (`.on_complete(..)`) e i metodi di stile tipizzati per l'input stesso.

<a id="the-code"></a>

## Il codice

- **Controllato**: passa `value` e aggiornalo in `onChange`. Le celle mostrano il `value` passato dall'app, così com'è; un valore impostato dall'app (per esempio azzerare il codice dopo un errore) non viene mai notificato.
- **Non controllato**: passa `defaultValue` (o niente) e leggi il codice da `onChange` e `onComplete`.

Ciò che fa l'utente viene letto dal campo, con il cursore sempre alla fine:

| L'utente | Il codice |
|---|---|
| Digita una cifra | Viene aggiunta in fondo finché il codice è più corto di `length`; una volta completo, non cambia nulla. |
| Digita una cifra a larghezza piena (`０`–`９`, di un metodo di input dell'Asia orientale) | Viene aggiunta la cifra ASCII. |
| Digita qualsiasi altro carattere | Non cambia nulla; il campo lo scarta. |
| Preme Backspace | L'ultima cifra viene rimossa. |
| Incolla, o il sistema compila automaticamente un codice | Le sue cifre vengono aggiunte allo stesso modo; un testo con `length` cifre o più (`123-456`, il codice di un messaggio) sostituisce il codice con le sue prime `length` cifre. |

`onChange` notifica ogni modifica con il nuovo codice, e `onComplete` la segue quando la modifica ha riempito l'ultima cella, così l'app verifica il codice in quel punto.

## Props

| Prop | Rust | Tipo | Predefinito | Descrizione |
|---|---|---|---|---|
| `length` | `.length(..)` | `number` | obbligatorio | Quante cifre ha il codice: una cella ciascuna. |
| `value` | `.value(..)` | `string` | nessuno | Il codice, controllato dall'app (mostrato così com'è). Senza di esso l'input mantiene un proprio codice. |
| `defaultValue` | `.default_value(..)` | `string` | nessuno | Il codice iniziale, finché `value` non è impostato. |
| `masked` | `.masked(..)` | `boolean` | `false` | Le celle riempite mostrano un pallino al posto della cifra, e il campo è sicuro: gli screen reader non leggono il codice e il sistema lo tiene fuori dai suoi suggerimenti. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Nessun focus e nessuna modifica; gli stili `disabled:` si applicano all'input e alle sue parti, e gli screen reader lo annunciano come disattivato. |
| `groups` | `.groups(..)` | `number` | `1` | In quanti gruppi sono suddivise le celle, nel modo più uniforme possibile (3 + 3 per sei cifre in due gruppi); almeno uno, al massimo uno per cella. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | nessuno | Ciò che gli screen reader dicono per il campo: a cosa serve il codice e quante cifre ha. |
| `cellClass`, `cellStyle` | `.cell_class(..)`, `.cell_style(\|s\| ..)` | `string`, `StyleProp<TextStyle>` | nessuno | Ogni cella: dimensione, bordo e testo (`color`, `fontSize`, che la sua cifra eredita); `focus:` e `data-filled:` stilizzano i suoi stati (vedi Parti). |
| `groupClass`, `groupStyle` | `.group_class(..)`, `.group_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | nessuno | Ogni gruppo di celle (`flex-row gap-2`). |
| `caretClass`, `caretStyle` | `.caret_class(..)`, `.caret_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | nessuno | Il cursore: larghezza, altezza e colore. |
| `class`, `style` | metodi di stile | `string`, `StyleProp<ViewStyle>` | nessuno | L'input stesso: la riga (o colonna) attorno ai suoi gruppi. |

<a id="events"></a>

## Eventi

| Evento | Rust | Payload | Quando |
|---|---|---|---|
| `onChange` | `.on_change(\|value: &SharedString\| ..)` | `(e: { value: string })` | L'utente ha cambiato il codice: digitando, cancellando, incollando o con la compilazione automatica. |
| `onComplete` | `.on_complete(\|e: &OtpInputCompleteEvent\| ..)` | `{ value }` | La modifica dell'utente ha riempito l'ultima cella, dopo il relativo `onChange`. |
| `onFocus` / `onBlur` | `.on_focus` / `.on_blur` | nessuno | L'input ha ricevuto / perso il focus della tastiera. |

<a id="ref-methods"></a>

## Metodi del ref

| Metodo | Rust | Descrizione |
|---|---|---|
| `focus()` | `focus()` (`OtpInputApi`) | Riceve il focus della tastiera e mostra la tastiera virtuale, come fa una pressione sull'input. |

<a id="parts"></a>

## Parti

| Parte | Dentro | Stilizzata con |
|---|---|---|
| L'input | | `class`, `style` |
| Un gruppo | l'input, uno per gruppo | `groupClass`, `groupStyle`; `disabled:` segue l'input |
| Una cella | il suo gruppo, una per cifra | `cellClass`, `cellStyle`; `focus:` sulla cella che riceve la cifra successiva mentre l'input ha il focus, `data-filled:` su ogni cella che contiene una cifra, `disabled:` segue l'input |
| La cifra | una cella riempita | gli stili di testo della cella (`text-xl`, `font-semibold`); `•` mentre `masked` |
| Il cursore | la cella vuota che riceve la cifra successiva, mentre l'input ha il focus | `caretClass`, `caretStyle` |

La cella che riceve la cifra successiva è quella dopo l'ultima cifra, oppure l'ultima cella quando il codice è completo. Il cursore lampeggia come quello di un campo di testo (mezzo secondo acceso, mezzo spento, e fisso per un istante dopo ogni modifica), tramite la sua opacità, in modo nativo, mantenendo il proprio posto nel layout; con il movimento ridotto resta fermo. Una pressione in qualsiasi punto dell'input gli dà il focus: il campo si trova sopra le celle.

Una cella che contiene una cifra, mascherata o no, ha l'attributo `data-filled`, quindi le classi `data-filled:` stilizzano le celle che l'utente ha riempito (un bordo più marcato, uno sfondo: `data-filled:border-foreground data-filled:bg-muted`), come shadcn/ui scrive i suoi stati. Con `group` in `cellClass`, le classi `group-data-filled:` stilizzano ciò che si trova dentro una cella riempita, cioè la sua cifra. Le celle cambiano le loro classi, mai il loro contenuto, quindi un tasto ristilizza una cella e non ridisegna nient'altro.

<a id="accessibility"></a>

## Accessibilità

- Gli screen reader trovano un solo campo di testo, identificato da `accessibilityLabel` (indica a cosa serve il codice e la sua lunghezza: "Codice di verifica, 6 cifre") con il codice come valore; le celle sono nascoste agli screen reader. Mentre `masked` il campo è sicuro, quindi il codice non viene letto ad alta voce.
- La tastiera è quella della piattaforma: il tastierino numerico sui telefoni, qualsiasi tastiera sui desktop (entrano solo cifre), e Backspace. Con Tab si raggiunge l'input come qualsiasi campo di testo.
- Mentre `disabled` non riceve il focus, e gli screen reader lo annunciano come disattivato.

Vedi [Accessibilità](../docs/accessibility.md) per etichette, ruoli e annunci in generale.

<a id="platform-notes"></a>

## Note sulle piattaforme

- iOS: il campo è un campo per codici (`textContentType` `oneTimeCode`), quindi la barra QuickType propone un codice da Messaggi o Mail; compare il tastierino numerico. Un campo `masked` ricomincia da capo quando si digita di nuovo dopo aver perso il focus, come fanno i campi sicuri di iOS.
- Android: `autofillHints` `smsOTPCode` permette alla tastiera e al servizio di compilazione automatica di proporre il codice di un SMS; compare la tastiera numerica.
- macOS, Windows, Linux e web: digitazione e incolla vanno al campo (nel browser, con `inputmode="numeric"` per la tastiera numerica del telefono), e il puntatore a I appare sopra le celle.
