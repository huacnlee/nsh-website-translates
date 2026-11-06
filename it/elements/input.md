---
title: "Input"
description: "Il campo di testo nativo: testo controllato e non controllato, tastiere, riempimento automatico, selezione, input multilinea e focus."
group: base
demo: el-input
source_hash: 1f03d974252777de
---


# Input

`Input` è un campo di testo nativo: una UITextField (singola riga) o una UITextView (multiriga) su iOS e Mac Catalyst, una EditText su Android. La digitazione, il cursore, la selezione, la correzione automatica e l'autofill sono quelli della piattaforma. In Rust se ne crea uno con `nsh_base::input()`, in TSX con `<Input>` da `nsh/base`.

```rust tabs
use nsh_base::input;
use nsh_core::prelude::*;

fn name_field() -> impl IntoElement {
    let name = signal(String::new());
    input()
        .value(name)
        .on_change(move |text: &str| name.set(text.to_string()))
        .placeholder("Your name")
        .auto_capitalize(AutoCapitalize::Words)
        .return_key_type(ReturnKeyType::Done)
        .text_base()
        .p_3()
        .border_1()
        .border_color(rgb(0xd0d7de))
        .rounded(px(8.0))
}
```

```tsx tabs
import { signal } from "nsh";
import { Input } from "nsh/base";

function NameField() {
  const name = signal("");
  return (
    <Input
      value={name()}
      onChange={({ value }) => name.set(value)}
      placeholder="Your name"
      autoCapitalize="words"
      returnKeyType="done"
      style={{ fontSize: 16, padding: 12, borderWidth: 1, borderColor: "#d0d7de", borderRadius: 8 }}
    />
  );
}
```

<a id="controlled-and-uncontrolled"></a>

## Controllato e non controllato

- **Controllato**: passa `value` e aggiornalo in `onChange`. L'app può riscrivere ciò che l'utente ha digitato (rimuovere gli spazi, formattarlo): il testo mostra subito la modifica e viene corretto quando arriva il nuovo `value`. Ogni modifica nativa porta con sé un contatore, e un `value` proveniente dall'app viene applicato quando si basa sull'ultima modifica, così la digitazione più recente prevale sempre su un aggiornamento lento.
- **Non controllato**: passa `defaultValue` (`.default_value(..)`, oppure niente) e leggi il testo da `onChange` o `onSubmit`.

Le regole che devono valere mentre l'utente digita sono prop, gestite in modo nativo: `maxLength` limita la lunghezza e `submitBehavior` decide cosa fa il tasto di invio. Vedi [moduli e tastiera](../docs/forms-and-keyboard.md).

<a id="props"></a>

## Prop

Oltre alle [prop comuni](./index.md#common-props) (con `style` di tipo `TextStyle`: si applicano font, colore, allineamento e gli stili della vista):

<a id="text"></a>

### Testo

| Prop | Rust | Tipo | Predefinito | Descrizione |
|---|---|---|---|---|
| `value` | `.value(..)` | `string` | | Il testo, controllato dall'app. |
| `defaultValue` | `.default_value(..)` | `string` | | Il testo iniziale. |
| `placeholder` | `.placeholder(..)` | `string` | | Mostrato mentre il campo è vuoto. |
| `multiline` | `.multiline(..)` | `boolean` | `false` | Più righe; l'invio inserisce un a capo, a meno che `submitBehavior` non indichi diversamente. |
| `scrollbar` | `.scrollbar(..)` | `boolean \| ScrollbarTheme` | `true` | La barra di scorrimento di un campo multiriga: l'indicatore della piattaforma, oppure la barra integrata dell'app una volta che ne ha impostata una ([Scrollbar](./scrollbar.md#built-in-bars)); un oggetto è un tema a sé, `false` nessuna. |
| `maxLength` | `.max_length(..)` | `number` | | Il massimo numero di caratteri che l'utente può inserire. |
| `readonly` | `.readonly(..)` | `boolean` | `false` | L'utente può selezionare e copiare il testo ma non modificarlo. |
| `masked` | `.masked(..)` | `boolean` | `false` | Il testo è nascosto (password). |
| `allowFontScaling` | | `boolean` | `true` | Segue la dimensione del testo di sistema. |
| `maxFontSizeMultiplier` | | `number` | `0` | Il limite superiore della scala di sistema (0 significa nessun limite). |

<a id="keyboard"></a>

### Tastiera

| Prop | Rust | Tipo | Predefinito | Descrizione |
|---|---|---|---|---|
| `keyboardType` | `.keyboard_type(KeyboardType::Email)` | `"default" \| "number-pad" \| "decimal-pad" \| "numeric" \| "numbers-and-punctuation" \| "email-address" \| "phone-pad" \| "url"` | `"default"` | Il layout della tastiera ([i valori](../docs/forms-and-keyboard.md#keyboards-and-autofill); `numbers-and-punctuation` ha il segno meno su iOS). |
| `returnKeyType` | `.return_key_type(ReturnKeyType::Next)` | `"default" \| "done" \| "go" \| "next" \| "search" \| "send"` | `"default"` | L'etichetta del tasto di invio. |
| `autoCapitalize` | `.auto_capitalize(AutoCapitalize::None)` | `"none" \| "sentences" \| "words" \| "characters"` | `"sentences"` | Maiuscole automatiche. |
| `autoCorrect` | `.auto_correct(..)` | `boolean` | `true` | Le correzioni del sistema. |
| `autoComplete` | `.auto_fill(AutoFill::OneTimeCode)` | `AutoComplete \| TextContentType` | | Cosa contiene il campo, per l'autofill su iOS, Android e web: `"username"`, `"current-password"`, `"new-password"`, `"one-time-code"`, `"email"`, `"tel"`, `"postal-code"`, `"cc-number"`, `"off"`, … |
| `pasteBehavior` | `.paste_behavior(PasteBehavior::Report)` | `"insert" \| "report"` | `"insert"` | Cosa fa un incolla: `"insert"` inserisce il testo incollato, `"report"` non inserisce nulla, lasciando all'app la gestione di ciò che `onPaste` riporta. Immagini e file non vengono mai inseriti. |
| `submitBehavior` | `.submit_behavior(SubmitBehavior::Submit)` | `"submit" \| "blurAndSubmit" \| "newline"` | `"blurAndSubmit"` (singola riga), `"newline"` (multiriga) | Cosa fa l'invio: `"submit"` riporta `onSubmit` e mantiene il focus, `"blurAndSubmit"` toglie anche il focus, `"newline"` inserisce un a capo (multiriga; una singola riga invia). Un campo multiriga che invia accetta comunque gli a capo con Maiusc+Invio oppure Option / Alt+Invio sulle tastiere hardware. `"submit"` mantiene la tastiera visibile (ad esempio per inviare più messaggi). |
| `autoFocus` | `.auto_focus(..)` | `boolean` | `false` | Riceve il focus quando appare. |

<a id="caret-and-selection"></a>

### Cursore e selezione

| Prop | Rust | Tipo | Descrizione |
|---|---|---|---|
| `caret` | `.caret(..)` | `boolean` | Il cursore viene disegnato (predefinito `true`; `false` lo nasconde). |
| `selectedRange` | `.selected_range((start, end))` | `{ start: number; end?: number }` | La selezione controllata, in unità UTF-16; `end` ha come valore predefinito `start` (un cursore). |

Il cursore lampeggia finché la sua finestra è visibile e attiva. Nelle finestre GPUI su Linux resta visibile dopo dieci secondi senza digitare né spostarlo, come nelle app GTK, così un campo con focus lasciato a sé non consuma frame.

<a id="colors"></a>

### Colori

I colori del placeholder, del cursore e dell'evidenziazione della selezione sono chiavi di stile, con le relative classi Tailwind, e metodi in Rust (UIKit colora il cursore e la selezione con un unico colore, quello del cursore se impostato):

| Chiave di stile | Rust | Classe | Descrizione |
|---|---|---|---|
| `placeholderColor` | `.placeholder_color(..)` | `placeholder:text-*` | Il colore del placeholder. |
| `caretColor` | `.caret_color(..)` | `caret-*` | Il colore del cursore. |
| `selectionColor` | `.selection_color(..)` | `selection:text-*` | Il colore dell'evidenziazione della selezione. |

```rust tabs
input()
    .placeholder("Search")
    .text_color(rgb(0x18181b))
    .placeholder_color(rgb(0x9ca3af))
    .caret_color(rgb(0x2563eb))
    .selection_color(rgb(0x93c5fd))
```

```tsx tabs
<Input placeholder="Search" class="text-zinc-900 placeholder:text-zinc-400 selection:text-blue-600" />
<Input placeholder="Search" style={{ placeholderColor: "#9ca3af", caretColor: "#2563eb", selectionColor: "#93c5fd" }} />
```

### iOS

| Chiave `ios` | Rust | Tipo | Descrizione |
|---|---|---|---|
| `textContentType` | `.auto_fill(..)` | `AutoComplete \| TextContentType` | I nomi di iOS per `autoComplete` (`"oneTimeCode"`, `"newPassword"`, …). |
| `inputAccessoryViewID` | `.input_accessory(id)` | `string` | Il `nativeID` di un `InputAccessoryView` ([`InputAccessoryView`](../modules/nsh-mobile.md#inputaccessoryview)) mostrato sopra la tastiera mentre il campo ha il focus. |
| `keyboardAppearance` | `.keyboard_appearance(KeyboardAppearance::Dark)` | `"default" \| "light" \| "dark"` | L'aspetto della tastiera; `"default"` segue l'aspetto del sistema. Le tastiere di Android seguono il tema del sistema. |

```rust tabs
use nsh_core::element::AutoFill;

input().auto_fill(AutoFill::OneTimeCode).keyboard_type(KeyboardType::Number)
```

```tsx tabs
<Input autoComplete="one-time-code" keyboardType="number-pad" ios={{ textContentType: "oneTimeCode" }} />
```

<a id="events"></a>

## Eventi

| Evento | Rust | Payload | Quando |
|---|---|---|---|
| `onChange` | `.on_change(\|text: &str\| ..)` | `{ value }` | L'utente ha modificato il testo: `value` è il testo attuale. |
| `onSubmit` | `.on_submit(\|text: &str\| ..)` | `{ text }` | È stato premuto il tasto di invio in un campo che invia (singola riga, oppure `submitBehavior` `"submit"` / `"blurAndSubmit"`). |
| `onFocus` / `onBlur` | `.on_focus` / `.on_blur` | nessuno | Il campo ha ottenuto / perso il focus. |
| `onSelectionChange` | `.on_selection_change(\|s: &Selection\| ..)` | `{ start, end }` | Il cursore o la selezione si sono spostati (unità UTF-16). |
| `onPaste` | `.on_paste(\|e: &PasteEvent\| ..)` | `{ text, html, files, uris }` | L'utente ha incollato: il testo, la sua formattazione come HTML (Linux, web), le immagini (uno screenshot) come `File`, gli URL `file:` dei file locali. Prima del `onChange` del testo che inserisce ([moduli e tastiera](../docs/forms-and-keyboard.md#pasting-images-and-files)). |
| `onCaretMove` | `.on_caret_move(\|e: &CaretEvent\| ..)` | `{ bounds, pageBounds }` | Il cursore si è spostato, con la selezione oppure mentre il testo scorreva o andava a capo: `bounds` è la sua posizione nel campo, `pageBounds` nella finestra, il `anchor` di un `Overlay` ([moduli e tastiera](../docs/forms-and-keyboard.md#the-caret)). |
| `onKeyPress` | `.on_key_press(\|key: &str\| ..)` | `{ key }` | Prima che il testo cambi: `key` è il testo digitato, `"Backspace"` o `"Enter"`. |
| `onContentSizeChange` | `.on_content_size_change(\|size: &Size<Points>\| ..)` | `{ size }` | La dimensione del testo è cambiata (alla larghezza del campo se multiriga), mentre viene digitato; un campo vuoto riporta una riga vuota, indipendentemente dal suo placeholder. |
| `onCompositionChange` | `.on_composition_change(\|e: &Composition\| ..)` | `{ composing, text }` | La composizione di un input method è iniziata, cambiata o terminata: `text` è ciò che si sta componendo (pinyin prima che un carattere sia scelto, kana prima della conversione), `""` quando termina. Il testo confermato raggiunge `onChange` prima della fine. |

Un campo multiriga che cresce con il suo testo:

```rust tabs
let height = signal(px(40.0));

input()
    .multiline(true)
    .on_content_size_change(move |size: &Size<Points>| {
        height.set(px((size.height.0 + 16.0).clamp(40.0, 120.0)));
    })
    .h(move || height.get())
    .px_3()
    .py_2()
```

```tsx tabs
const height = signal(40);
<Input
  multiline
  onContentSizeChange={({ size }) => height.set(Math.min(120, Math.max(40, size.height + 16)))}
  style={{ height: height(), paddingHorizontal: 12, paddingVertical: 8 }}
/>;
```

<a id="ref-methods"></a>

## Metodi del ref

| Metodo | Rust | Descrizione |
|---|---|---|
| `focus()` | `focus()` | Dà il focus al campo e mostra la tastiera. |
| `blur()` | `blur()` | Gli toglie il focus. |
| `setSelection(start, end?)` | `set_selection(start, end)` | Seleziona `start..end` (unità UTF-16); un cursore quando coincidono. |

Spostare il focus al campo successivo all'invio:

```rust tabs
use nsh_core::element::AutoFill;

let password = element_ref();

view()
    .child(input().return_key_type(ReturnKeyType::Next).on_submit(move |_: &str| password.focus()))
    .child(input().element_ref(&password).masked(true).auto_fill(AutoFill::Password))
```

```tsx tabs
let password!: InputRef;
<>
  <Input returnKeyType="next" onSubmit={() => password.focus()} />
  <Input ref={password} masked autoComplete="current-password" />
</>;
```

`Keyboard.dismiss()` da `nsh` (`dismiss_keyboard()` in Rust) nasconde la tastiera, qualunque sia il campo che la sta usando.

<a id="platform-notes"></a>

## Note sulle piattaforme

- Su macOS, il testo a riga singola, i placeholder e i cursori condividono le metriche del font del campo nativo e sono centrati insieme all'interno del riquadro del contenuto. `lineHeight` partecipa al layout; gli editor multiriga lo usano anche per la spaziatura tra paragrafi.
- Gli input all'interno di una [scroll view](./scroll.md#keyboard) vengono tenuti liberi dalla tastiera in modo nativo. Altrove usa un padding o un margin inferiore pari a [`env(keyboard-inset-height)`](./keyboard.md).
- `disabled` disabilita il campo (senza focus) oltre ad applicare gli stili di disabilitazione; un campo `readonly` mantiene il focus e la selezione.
- `inputAccessoryViewID` si applica su iOS, dove la tastiera ha una barra accessoria.
