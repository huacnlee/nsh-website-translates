---
title: "Moduli e tastiera"
description: "Input di testo con l'elemento input: valori controllati e non controllati, tipi di tastiera, tasto invio, focus, selezione, input multilinea con crescita automatica e come mantenere il contenuto libero dalla tastiera software."
order: 42
group: ui
demo: guide-forms
source_hash: a7bed0645c77c155
---

# Form e tastiera

L'inserimento di testo avviene tramite l'elemento input, `input()` in Rust e `<Input>` in TSX: una UITextField o una UITextView su iOS, una EditText su Android. Digitazione, caret, selezione, correzione automatica e autofill sono quelli nativi della piattaforma; la tua app riceve il testo tramite eventi e può controllarlo. NSH mantiene inoltre da solo gli input con il focus sopra la tastiera software e ti fornisce l'altezza della tastiera come valore reattivo per i casi che non riesce a gestire da sé.

Un input accetta stili come qualsiasi vista (metodi di stile tipizzati in Rust, stili e classi Tailwind in TSX), quindi i campi di un form possono avere l'aspetto della tua app. Un campo con etichetta è un breve componente tuo:

```rust tabs
use nsh_core::prelude::*;

fn field(label: &'static str, value: Signal<String>, masked: bool) -> impl IntoElement {
    let focused = signal(false);
    view()
        .gap_1()
        .child(text(label).text_sm().text_color(rgb(0x737373)))
        .child(
            input()
                .value(move || value.get())
                .on_change(move |text: &str| value.set(text.to_owned()))
                .masked(masked)
                .on_focus(move || focused.set(true))
                .on_blur(move || focused.set(false))
                .rounded_lg()
                .border_1()
                .px_3()
                .py_2()
                .text_base()
                .border_color(move || if focused.get() { rgb(0x0969da) } else { rgb(0xd0d7de) }),
        )
}
```

```tsx tabs
import { signal, Text, View } from "nsh";
import { Input } from "nsh/base";

function Field(props: { label: string; value: string; onChange: (e: { value: string }) => void; masked?: boolean }) {
  const focused = signal(false);
  return (
    <View class="gap-1">
      <Text class="text-sm text-neutral-500">{props.label}</Text>
      <Input
        value={props.value}
        onChange={props.onChange}
        masked={props.masked}
        onFocus={() => focused.set(true)}
        onBlur={() => focused.set(false)}
        class="rounded-lg border px-3 py-2 text-base"
        style={{ borderColor: focused() ? "#0969da" : "#d0d7de" }}
      />
    </View>
  );
}
```

<a id="controlled-and-uncontrolled-inputs"></a>

## Input controllati e non controllati

Un input è **controllato** quando gli passi il suo valore (`.value(..)`, TSX `value`): mostra ciò che contiene il tuo signal e tu aggiorni il signal a partire dall'evento di modifica (`.on_change(..)`, TSX `onChange`).

```rust tabs
use nsh_core::prelude::*;

#[component]
pub fn App() -> impl IntoElement {
    let name = signal(String::new());
    view()
        .flex_1()
        .p(px(16.0))
        .pt(px(60.0))
        .gap(px(8.0))
        .child(
            input()
                .value(move || name.get())
                .on_change(move |text: &str| name.set(text.to_owned()))
                .placeholder("Your name")
                .text_size(px(17.0))
                .border_1()
                .border_color(rgb(0xd0d7de))
                .rounded(px(10.0))
                .p(px(12.0)),
        )
        .child(text(move || {
            let name = name.get();
            format!("Hello, {}", if name.is_empty() { "stranger" } else { &name })
        }))
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { Input } from "nsh/base";

function App() {
  const name = signal("");
  return (
    <View style={{ flex: 1, padding: 16, paddingTop: 60, gap: 8 }}>
      <Input
        value={name()}
        onChange={({ value }) => name.set(value)}
        placeholder="Your name"
        style={{ fontSize: 17, borderWidth: 1, borderColor: "#d0d7de", borderRadius: 10, padding: 12 }}
      />
      <Text>Hello, {name() || "stranger"}</Text>
    </View>
  );
}

mount(App);
```

Poiché controlli il valore, puoi trasformare ciò che l'utente digita: `.on_change(move |t: &str| tag.set(t.to_uppercase()))` converte in maiuscolo, `onChange={({ value }) => code.set(value.replace(/[^0-9]/g, ""))}` mantiene solo le cifre.

<a id="input-methods"></a>

### Metodi di input

I metodi di input cinesi, giapponesi e coreani compongono il testo prima di confermarlo: il pinyin diventa 腾 una volta scelto un carattere. `onCompositionChange` (Rust `.on_composition_change(..)`) riporta la composizione man mano che procede, `{ composing: true, text: "teng" }` mentre l'utente digita e `{ composing: false, text: "" }` quando termina; il testo confermato arriva a `onChange` prima della fine. Su iOS, Android, macOS e sul web, `onChange` riporta anche il testo in composizione, poiché quei sistemi lo mantengono nell'input; su Windows, Linux e GPUI riporta il testo confermato. Un input controllato mantiene attiva la composizione qualunque cosa faccia l'app con il valore: un `value` impostato mentre l'utente compone viene mostrato al termine della composizione, quindi un input che converte in maiuscolo o filtra il proprio testo accetta il pinyin così com'è digitato.

Una casella di ricerca che cerca solo il testo confermato:

```rust tabs
let query = signal(String::new());
let composing = signal(false);
input()
    .value(move || query.get())
    .on_change(move |text: &str| {
        query.set(text.to_owned());
        if !composing.get() {
            search(text);
        }
    })
    .on_composition_change(move |e: &Composition| {
        composing.set(e.composing);
        if !e.composing {
            search(&query.get());
        }
    })
```

```tsx tabs
const query = signal("");
let composing = false;
<Input
  value={query()}
  onChange={({ value }) => {
    query.set(value);
    if (!composing) search(value);
  }}
  onCompositionChange={(e) => {
    composing = e.composing;
    if (!e.composing) search(query());
  }}
/>
```

Un input è **non controllato** quando non ha un valore: mantiene il proprio testo, a partire dal valore predefinito (`.default_value(..)`, TSX `defaultValue`), e lo leggi dall'evento di modifica o di invio quando ti serve. Usalo per i campi che leggi solo all'invio, come una password.

> [!NOTE]
> Un input controllato non perde mai la pressione di un tasto. Ogni modifica nativa porta con sé un contatore di modifiche, e un `value` che torna da JS viene applicato solo se risponde all'ultima modifica. Se JS è lento e nel frattempo l'utente ha digitato altro, il valore obsoleto viene scartato invece di sovrascrivere il testo più recente.

## Props

In Rust, ogni prop è un metodo di `input()` con nome in snake case (`.placeholder(..)`, `.masked(true)`, `.max_length(6)`, `.return_key_type(ReturnKeyType::Next)`, `.selected_range((0, 4))`), con questi nomi particolari: `.keyboard_type(KeyboardType::Email)` e le altre varianti di `KeyboardType`, `.auto_fill(AutoFill::Email)` per `autoComplete`, `.keyboard_appearance(..)` e `.input_accessory(..)` per le props `ios={{ … }}`. Ogni evento è un metodo di `on_`: `.on_change(|text: &str| ..)`, `.on_submit(|text: &str| ..)`, `.on_focus(..)`, `.on_blur(..)`, `.on_selection_change(|s: &Selection| ..)`, `.on_key_press(|key: &str| ..)`, `.on_content_size_change(|size: &Size<Points>| ..)`.

| Prop | Tipo | Predefinito | Descrizione |
|---|---|---|---|
| `value` | `string` | | Il testo, controllato da JS. |
| `defaultValue` | `string` | | Il testo iniziale di un input non controllato. |
| `placeholder` | `string` | | Mostrato finché l'input è vuoto. |
| `masked` | `boolean` | `false` | Nasconde il testo (password). |
| `keyboardType` | `KeyboardType` | `"default"` | Il layout della tastiera. |
| `returnKeyType` | `ReturnKeyType` | `"default"` | L'etichetta del tasto di invio. |
| `autoCapitalize` | `"none" \| "sentences" \| "words" \| "characters"` | `"sentences"` | Maiuscole automatiche. |
| `autoCorrect` | `boolean` | `true` | Le correzioni del sistema. |
| `autoComplete` | `AutoComplete` | | Cosa contiene l'input, per l'autofill. |
| `multiline` | `boolean` | `false` | Più righe; il tasto di invio inserisce un'interruzione di riga a meno che `submitBehavior` non indichi altro. |
| `maxLength` | `number` | | Il massimo numero di caratteri che l'utente può inserire. |
| `readonly` | `boolean` | `false` | L'utente può selezionare e copiare il testo ma non modificarlo. |
| `autoFocus` | `boolean` | `false` | Riceve il focus quando appare. |
| `submitBehavior` | `"submit" \| "blurAndSubmit" \| "newline"` | riga singola `"blurAndSubmit"`, multilinea `"newline"` | Cosa fa il tasto di invio: invia e mantiene il focus, invia e toglie il focus, oppure inserisce un'interruzione di riga (solo multilinea). |
| `pasteBehavior` | `"insert" \| "report"` | `"insert"` | Cosa fa un incolla: inserisce il suo testo, oppure nulla ([incolla](#pasting-images-and-files)). |
| `caret` | `boolean` | `true` | Il caret viene disegnato; `false` lo nasconde. |
| `ios={{ keyboardAppearance }}` | `"default" \| "light" \| "dark"` | `"default"` | L'aspetto della tastiera (iOS). |
| `selectedRange` | `{ start: number; end?: number }` | | La selezione controllata, in unità UTF-16. |
| `allowFontScaling` | `boolean` | `true` | Segue la dimensione del testo di sistema. |
| `maxFontSizeMultiplier` | `number` | | Il limite superiore della scala di sistema (0: nessuno). |
| `ios={{ inputAccessoryViewID }}` | `string` | | iOS: la barra mostrata sopra la tastiera (vedi sotto). |
| `ios={{ textContentType }}` | `TextContentType` | | I nomi di iOS per i valori di `autoComplete`. |

Eventi:

| Evento | Payload | Quando |
|---|---|---|
| `onChange` | `{ value }` | Il testo è cambiato: `value` è il testo attuale. |
| `onSubmit` | `{ text }` | Il tasto di invio è stato premuto in un input che invia (riga singola, oppure `submitBehavior` `"submit"` / `"blurAndSubmit"`). |
| `onFocus` / `onBlur` | | L'input ha ottenuto / perso il focus. |
| `onSelectionChange` | `{ start, end }` | Il caret o la selezione si sono spostati (unità UTF-16). |
| `onPaste` | `{ text, html, files, uris }` | L'utente ha incollato: testo, il suo HTML (Linux, web), immagini come `File`, URL di file locali ([incolla](#pasting-images-and-files)). |
| `onCaretMove` | `{ bounds, pageBounds }` | Il caret si è spostato: dove si trova nell'input e nella finestra ([il caret](#the-caret)). |
| `onKeyPress` | `{ key }` | Prima che il testo cambi: `key` è il testo digitato, `"Backspace"` o `"Enter"`. |
| `onContentSizeChange` | `{ size }` | La dimensione del testo (`size`) è cambiata (alla larghezza dell'input se multilinea), mentre viene digitato; un input vuoto riporta una riga vuota, qualunque sia il suo placeholder. |
| `onCompositionChange` | `{ composing, text }` | La composizione di un metodo di input è iniziata, cambiata o terminata (vedi [Metodi di input](#input-methods)). |

Un input si stila come il testo: `fontSize`, `color`, `fontFamily`, `textAlign`, `letterSpacing` e il resto degli [stili del testo](./text.md), oltre a bordi, padding e sfondi. Lo stile di focus (`.focus(|s| ..)` in Rust, la variante Tailwind `focus:` o `focusStyle` in TSX) si applica mentre l'input ha il focus. Il colore del placeholder è `.placeholder_color(..)` (la chiave di stile `placeholderColor`, `placeholder:text-*`), quello del caret è `.caret_color(..)` (`caretColor`, `caret-*`) e quello dell'evidenziazione della selezione è `.selection_color(..)` (`selectionColor`, `selection:text-*`); UIKit colora il caret e la selezione con un unico colore, quello del caret se impostato:

```rust tabs
input()
    .placeholder("Search")
    .rounded_lg()
    .border_1()
    .border_color(rgb(0xd4d4d8))
    .px_3()
    .py_2()
    .text_base()
    .focus(|s| s.border_color(rgb(0x3b82f6)))
    .placeholder_color(rgb(0xa1a1aa))
    .selection_color(rgb(0x2563eb))
```

```tsx tabs
<Input
  class="rounded-lg border border-zinc-300 px-3 py-2 text-base focus:border-blue-500 placeholder:text-zinc-400 selection:text-blue-600"
  placeholder="Search"
/>
```

<a id="keyboards-and-autofill"></a>

## Tastiere e autofill

Il tipo di tastiera (`.keyboard_type(..)`, TSX `keyboardType`) sceglie il layout:

| Rust | TSX | Tastiera |
|---|---|---|
| `KeyboardType::Default` | `"default"` | Testo. |
| `KeyboardType::Email` | `"email-address"` | Testo con `@` e `.` a portata di mano. |
| `KeyboardType::Url` | `"url"` | Testo con `/` e `.com`. |
| `KeyboardType::Number` | `"number-pad"` | Solo cifre: nessun segno, nessun separatore decimale (codici, PIN). |
| `KeyboardType::Decimal` | `"decimal-pad"` | Cifre e un separatore decimale. |
| `KeyboardType::Numeric` | `"numeric"` | Come in React Native: il tastierino decimale di iOS; su Android cifre con un segno e un separatore decimale. |
| `KeyboardType::NumbersAndPunctuation` | `"numbers-and-punctuation"` | Cifre, un segno meno e punteggiatura (la tastiera di numeri e punteggiatura di iOS; su Android cifre con un segno e un separatore decimale). Usala per i numeri negativi su iOS. |
| `KeyboardType::Phone` | `"phone-pad"` | Un tastierino telefonico. |

Su iOS, `.keyboard_appearance(KeyboardAppearance::Dark)` (TSX `ios={{ keyboardAppearance: "dark" }}`; oppure light, predefinito) dà alla tastiera un aspetto chiaro o scuro indipendentemente dall'aspetto del sistema, utile per un'app scura in modalità chiara. Le tastiere di Android seguono sempre il tema del sistema.

L'autofill (`.auto_fill(AutoFill::Email)`, TSX `autoComplete`) dice al sistema cosa contiene il campo, in modo che possa proporre nomi, indirizzi, password e codici monouso salvati provenienti dai messaggi. `AutoFill` di Rust ha una variante per ogni tipo (`Name`, `GivenName`, `FamilyName`, `Email`, `Tel`, `Username`, `Password`, `NewPassword`, `OneTimeCode`, `StreetAddress`, `PostalCode`, `Country`, `CreditCardNumber`, `Url`, `Birthdate`, ..., e `Off`). TSX accetta questi valori: `"name"`, `"given-name"`, `"family-name"`, `"email"`, `"tel"`, `"username"`, `"current-password"`, `"new-password"`, `"one-time-code"`, `"street-address"`, `"postal-code"`, `"country"`, `"cc-number"`, `"cc-exp"`, `"cc-csc"`, `"url"`, `"birthdate-full"` e altri, oppure `"off"`; sono accettati anche i nomi propri di iOS (`"emailAddress"`, `"oneTimeCode"`, ...), in `autoComplete` o `ios={{ textContentType }}`.

```rust tabs
use nsh_core::element::AutoFill;

input()
    .keyboard_type(KeyboardType::Email)
    .auto_capitalize(AutoCapitalize::None)
    .auto_correct(false)
    .auto_fill(AutoFill::Email)
    .placeholder("E-mail")
input().masked(true).auto_fill(AutoFill::NewPassword).placeholder("Password")
input()
    .keyboard_type(KeyboardType::Number)
    .auto_fill(AutoFill::OneTimeCode)
    .max_length(6)
    .placeholder("Code")
```

```tsx tabs
<Input keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" placeholder="E-mail" />
<Input masked autoComplete="new-password" placeholder="Password" />
<Input keyboardType="number-pad" autoComplete="one-time-code" maxLength={6} placeholder="Code" />
```

<a id="the-return-key-and-moving-between-fields"></a>

## Il tasto di invio e lo spostamento tra i campi

Il tipo di tasto di invio (`.return_key_type(ReturnKeyType::Next)`, TSX `returnKeyType`) ne definisce l'etichetta: default, done, go, next, search o send. Il comportamento di invio (`.submit_behavior(..)`, TSX `submitBehavior`) stabilisce cosa succede quando lo si preme:

| Rust | TSX | Invio | Predefinito per |
|---|---|---|---|
| `SubmitBehavior::BlurAndSubmit` | `"blurAndSubmit"` | genera l'evento di invio, poi l'input perde il focus | input a riga singola |
| `SubmitBehavior::Submit` | `"submit"` | genera l'evento di invio; l'input mantiene il focus | |
| `SubmitBehavior::Newline` | `"newline"` | inserisce un'interruzione di riga (solo input multilinea) | input multilinea |

Un input multilinea con `"submit"` o `"blurAndSubmit"` invia alla pressione del tasto, come fanno i composer delle chat, e continua ad andare a capo; con una tastiera fisica (desktop, un Mac, la tastiera di un tablet) Shift+Invio oppure Option / Alt+Invio inserisce un'interruzione di riga. Un invio che conferma la composizione di un metodo di input (per esempio input cinese o giapponese) si limita a confermarla e non invia mai.

Per passare al campo successivo, conserva i ref degli input (`element_ref()` e `.element_ref(&r)` in Rust, `ref` in TSX) e chiama `focus()`:

```rust tabs
use nsh_core::prelude::*;

pub fn sign_in() -> impl IntoElement {
    let email = signal(String::new());
    let password = element_ref();
    let submit = move || log::info!("sign in {}", email.get());
    view()
        .flex_1()
        .p(px(16.0))
        .pt(px(60.0))
        .gap(px(12.0))
        .child(
            input()
                .value(move || email.get())
                .on_change(move |t: &str| email.set(t.to_owned()))
                .keyboard_type(KeyboardType::Email)
                .auto_capitalize(AutoCapitalize::None)
                .return_key_type(ReturnKeyType::Next)
                .submit_behavior(SubmitBehavior::Submit)
                .on_submit(move |_: &str| password.focus())
                .placeholder("E-mail"),
        )
        .child(
            input()
                .element_ref(&password)
                .masked(true)
                .return_key_type(ReturnKeyType::Go)
                .on_submit(move |_: &str| submit())
                .placeholder("Password"),
        )
}
```

```tsx tabs
import { type InputRef, mount, signal, View } from "nsh";
import { Input } from "nsh/base";

function SignIn() {
  const email = signal("");
  let password!: InputRef;
  const submit = () => console.log("sign in", email());
  return (
    <View style={{ flex: 1, padding: 16, paddingTop: 60, gap: 12 }}>
      <Input
        value={email()}
        onChange={({ value }) => email.set(value)}
        keyboardType="email-address"
        autoCapitalize="none"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmit={() => password.focus()}
        placeholder="E-mail"
      />
      <Input ref={password} masked returnKeyType="go" onSubmit={submit} placeholder="Password" />
    </View>
  );
}

mount(SignIn);
```

Inviare senza togliere il focus (`SubmitBehavior::Submit`, `submitBehavior="submit"`) sul primo campo mantiene la tastiera visibile mentre il focus si sposta, così non si abbassa e non risale. Un input di chat che invia con il tasto di invio e resta con il focus invia allo stesso modo (vedi il composer [più sotto](#content-outside-scroll-views)).

Sia la lunghezza massima sia il comportamento di invio sono applicati in modo nativo: la piattaforma chiede «questo carattere può essere aggiunto?» e «l'invio deve terminare la modifica?» mentre l'utente digita, e NSH risponde in base alle props senza attendere JS.

<a id="focus-from-code"></a>

## Il focus da codice

Il ref di un input offre:

| Rust | TSX | Descrizione |
|---|---|---|
| `focus()` | `focus()` | Dà il focus all'input e mostra la tastiera. |
| `blur()` | `blur()` | Gli toglie il focus. |
| `set_selection(start, end)` | `setSelection(start, end?)` | Seleziona `start..end` (unità UTF-16); un caret quando sono uguali (TSX: senza `end`). |

Su macOS e sul web, `focus()` e `blur()` sul ref di una vista che accetta le pressioni spostano il focus da tastiera come fa Tab ([focus da tastiera](../elements/index.md#keyboard-focus)).

`dismiss_keyboard()` in Rust e `Keyboard.dismiss()` da `nsh` in TSX tolgono il focus a qualunque input lo abbia:

```rust tabs
view().on_press(|| dismiss_keyboard())
```

```tsx tabs
import { View, Keyboard } from "nsh";

<View onPress={() => Keyboard.dismiss()}>…</View>
```

<a id="selection"></a>

## Selezione

L'evento di selezione (`.on_selection_change(..)`, TSX `onSelectionChange`) riporta il caret e la selezione; il `set_selection` del ref o l'intervallo selezionato (`.selected_range(..)`, TSX `selectedRange`) li impostano. Le posizioni sono unità di codice UTF-16, come gli indici delle stringhe JavaScript, quindi in TSX `text.slice(start, end)` è il testo selezionato; in Rust, ritaglia le unità UTF-16 del testo.

```rust tabs
/// `start..end` of `text` in UTF-16 units, as inputs count.
fn utf16_slice(text: &str, start: u32, end: u32) -> String {
    let units: Vec<u16> = text.encode_utf16().collect();
    let end = (end as usize).min(units.len());
    String::from_utf16_lossy(&units[(start as usize).min(end)..end])
}

let content = signal("Select part of this text".to_owned());
let range = signal(Selection::default());
let field = element_ref();

view()
    .child(
        input()
            .element_ref(&field)
            .value(move || content.get())
            .on_change(move |t: &str| content.set(t.to_owned()))
            .on_selection_change(move |r: &Selection| range.set(*r)),
    )
    .child(text(move || {
        let r = range.get();
        format!("Selected: \"{}\"", content.with(|t| utf16_slice(t, r.start, r.end)))
    }))
    .child(
        view()
            .on_press(move || {
                let len = content.with(|t| t.encode_utf16().count()) as u32;
                field.set_selection(0, len);
            })
            .child(text("Select all")),
    )
```

```tsx tabs
const text = signal("Select part of this text");
const range = signal({ start: 0, end: 0 });
const selection = signal<{ start: number; end?: number } | undefined>(undefined);

<Input
  value={text()}
  onChange={({ value }) => text.set(value)}
  selectedRange={selection()}
  onSelectionChange={(r) => range.set(r)}
/>
<Text>Selected: "{text().slice(range().start, range().end)}"</Text>
<View onPress={() => selection.set({ start: 0, end: text().length })}><Text>Select all</Text></View>
```

<a id="the-caret"></a>

## Il caret

L'evento caret (`.on_caret_move(..)`, TSX `onCaretMove`) indica dove si trova il caret, in modo che ciò che appartiene al caret possa aprirsi lì: i suggerimenti per una menzione con `@`, il menu di un comando slash, un selettore di emoji. `bounds` è un `Bounds` nell'input (`origin` e `size`, con padding e scorrimento dell'input applicati), largo quanto la piattaforma disegna il caret e alto quanto la sua riga; `pageBounds` è lo stesso riquadro nella finestra (o nel dialogo in cui si trova l'input), che un overlay prende come proprio `anchor`. L'evento arriva mentre l'input ha il focus, ogni volta che il caret si sposta: con la selezione e quando il testo dell'input scorre o va a capo su altre righe. In Rust un overlay viene posizionato rispetto a un riquadro con `.anchor_bounds(..)`.

```rust tabs
let draft = signal(String::new());
let end = signal(0u32);
let caret = signal(None::<Bounds<Points>>);

view()
    .child(
        input()
            .multiline(true)
            .value(move || draft.get())
            .on_change(move |t: &str| draft.set(t.to_owned()))
            .on_selection_change(move |s: &Selection| end.set(s.end))
            .on_caret_move(move |e: &CaretEvent| {
                // Suggestions while the word before the caret starts with "@".
                let typed = draft.with(|t| utf16_slice(t, 0, end.get()));
                let word = typed.rsplit(char::is_whitespace).next().unwrap_or("");
                caret.set(word.starts_with('@').then_some(e.page_bounds));
            })
            .p_2(),
    )
    .child(when(
        move || caret.get().is_some(),
        move || {
            overlay()
                .anchor_bounds(move || caret.get().unwrap_or_default())
                .placement(Placement::Bottom)
                .align(Align::Start)
                .offset(px(4.0))
                .child(text("@ada"))
                .child(text("@grace"))
        },
    ))
```

```tsx tabs
import { type Bounds, Overlay, Text, View, signal } from "nsh";
import { Input } from "nsh/base";

const draft = signal("");
const end = signal(0);
const caret = signal<Bounds | null>(null);

<View>
  <Input
    multiline
    value={draft()}
    onChange={({ value }) => draft.set(value)}
    onSelectionChange={(e) => end.set(e.end)}
    onCaretMove={(e) => {
      // Suggestions while the word before the caret starts with "@".
      const word = draft().slice(0, end()).split(/\s/).pop() ?? "";
      caret.set(word.startsWith("@") ? e.pageBounds : null);
    }}
    class="p-2"
  />
  <If when={caret()}>
    <Overlay anchor={caret()} placement="bottom" align="start" offset={4}>
      <Text>@ada</Text>
      <Text>@grace</Text>
    </Overlay>
  </If>
</View>;
```

`pageBounds` è dove si trovava il caret quando è arrivato l'evento: una pagina che scorre sotto l'input sposta l'input ma non invia alcun evento, quindi chiudi i suggerimenti quando scorre, oppure ancorali all'input stesso.

<a id="pasting-images-and-files"></a>

## Incollare immagini e file

L'evento di incolla (`.on_paste(..)`, TSX `onPaste`) indica cosa ha incollato l'utente, tramite la scorciatoia da tastiera, un comando Incolla di un menu o l'immagine di una tastiera: `text`, `html`, `files` e `uris`. `html` è lo stesso contenuto con la sua formattazione, come l'ha copiato un browser, una suite per ufficio o un editor di rich text (su Linux e sul web). `files` è ciò che gli appunti contenevano come dati, come uno screenshot o un'immagine copiata da una pagina o da un'altra app: `File` i cui byte l'app può caricare o mostrare, con nome `image.png` (o il tipo che è). `uris` sono gli URL `file:` dei file copiati in un file manager, come quelli di un file drop. La piattaforma legge gli appunti nel momento in cui l'utente incolla, e solo allora.

L'input inserisce da sé il testo incollato, come fa sempre: l'evento arriva prima di `onChange` per quel testo. Immagini e file non vengono mai inseriti, poiché un input contiene testo. Con `pasteBehavior` `"report"` l'input non inserisce nulla e l'app decide cosa fa un incolla: inviare un testo lungo come allegato, oppure inserirne una versione ripulita. L'input decide subito, in base alla prop, perché il sistema glielo chiede sul momento.

```rust tabs
let attachments = signal(Vec::<PastedFile>::new());

input()
    .multiline(true)
    .placeholder("Message")
    .on_paste(move |e: &PasteEvent| {
        // A screenshot pasted into the message goes along as an image.
        attachments.update(|a| a.extend(e.files.iter().cloned()));
    })
    .p_2()
```

```tsx tabs
import { signal } from "nsh";
import { Input } from "nsh/base";

const attachments = signal<File[]>([]);

<Input
  multiline
  placeholder="Message"
  onPaste={(e) => {
    // A screenshot pasted into the message goes along as an image.
    attachments.update((a) => [...a, ...e.files]);
  }}
  class="p-2"
/>;
```

Carica un file incollato come qualsiasi `File`, con `fetch` e `FormData` (`form.append("image", file)`); i suoi byte restano nativi finché non vengono inviati. Su Android, le tastiere che inseriscono immagini (GIF, sticker) le riportano allo stesso modo. Su Linux gli appunti vengono letti in modo asincrono, quindi l'evento può arrivare dopo `onChange` del testo che inserisce. Gli input mascherati su macOS mantengono l'incolla di AppKit e non riportano nulla.

<a id="multiline-inputs-that-grow"></a>

## Input multilinea che crescono

Un input multilinea (`.multiline(true)`, TSX `multiline`) fa scorrere il proprio testo all'interno della propria altezza. Per farlo crescere insieme al contenuto, riporta l'altezza dell'evento di dimensione del contenuto (`.on_content_size_change(..)`, TSX `onContentSizeChange`) nel suo stile, con un limite:

```rust tabs
let height = signal(px(0.0));

input()
    .multiline(true)
    .placeholder("Write a comment")
    .on_content_size_change(move |e: &Size<Points>| height.set(e.height.min(px(120.0))))
    .text_size(px(16.0))
    .p(px(10.0))
    .border_1()
    .border_color(rgb(0xd0d7de))
    .rounded(px(10.0))
    .h(move || height.get().max(px(20.0)) + px(20.0))
```

```tsx tabs
const height = signal(0);

<Input
  multiline
  placeholder="Write a comment"
  onContentSizeChange={({ size }) => height.set(Math.min(size.height, 120))}
  style={{ fontSize: 16, padding: 10, borderWidth: 1, borderColor: "#d0d7de", borderRadius: 10, height: Math.max(height(), 20) + 20 }}
/>
```

L'altezza riportata è quella del testo (alla larghezza dell'input), quindi aggiungi tu il padding verticale, come sopra.
<a id="keeping-inputs-above-the-keyboard"></a>

## Mantenere gli input sopra la tastiera

<a id="inside-scroll-views-automatic"></a>

### Dentro le scroll view: automatico

Quando la tastiera compare sopra un input con focus che si trova dentro una scroll view o una lista, NSH applica alla scroll view un inset inferiore alto quanto la tastiera e fa scorrere l'input fino a renderlo visibile. Questo avviene in modo nativo e non richiede codice. Un form lungo è semplicemente una scroll view di input:

```rust tabs
scroll()
    .flex_1()
    .keyboard_dismiss_mode(KeyboardDismissMode::OnDrag)
    .keyboard_taps(KeyboardTaps::Handled)
    .child(view().p(px(16.0)).gap(px(12.0)) /* inputs */)
```

```tsx tabs
<Scroll style={{ flex: 1 }} keyboardDismissMode="on-drag" keyboardShouldPersistTaps="handled">
  <View style={{ padding: 16, gap: 12 }}>
    {/* inputs */}
  </View>
</Scroll>
```

La modalità di chiusura (`.keyboard_dismiss_mode(..)`, TSX `keyboardDismissMode`: none, on drag, interactive) permette di nascondere la tastiera trascinando il form; i tap gestiti (`.keyboard_taps(KeyboardTaps::Handled)`, TSX `keyboardShouldPersistTaps="handled"`) permettono a un tap su un pulsante di andare a buon fine mentre la tastiera è visibile, invece di limitarsi a chiuderla. Vedi [Scrolling](./scrolling.md#scroll-views-and-the-keyboard).

<a id="content-outside-scroll-views"></a>

### Contenuto fuori dalle scroll view

Su iOS, quando la tastiera coprirebbe un input con focus che non si trova in nessuna scroll view, NSH sposta verso l'alto il contenuto della sua schermata (o del suo dialogo) finché l'input non è appena sopra la tastiera, seguendo la curva della tastiera, e lo riporta giù quando la tastiera si nasconde o l'input perde il focus, come fa SwiftUI (su Android, una finestra in modalità `adjustPan` viene spostata dal sistema). Lo fa solo per ciò che il layout dell'app lascia coperto: un'app che crea lo spazio da sé, come mostrato sotto, non viene spostata di nuovo.

Questo sposta l'intera pagina. Una barra dei messaggi fissata in fondo a una schermata dovrebbe invece seguire la tastiera mentre il contenuto sopra di essa si restringe: aggiungi un padding inferiore alla schermata con il `env(keyboard-inset-height)` di CSS (`paddingBottom: "env(keyboard-inset-height)"`, Tailwind `pb-[env(keyboard-inset-height)]`, Rust `.pb_keyboard()`): crea in basso uno spazio alto quanto la tastiera, animato in modo nativo insieme alla tastiera.

```rust tabs
use nsh_core::prelude::*;

pub fn chat_screen() -> impl IntoElement {
    let draft = signal(String::new());
    let send = move || {
        let text = draft.get();
        if !text.trim().is_empty() {
            log::info!("send {text}");
        }
        draft.set(String::new());
    };
    view()
        .flex_1()
        .pb_keyboard()
        .child(scroll().flex_1().keyboard_dismiss_mode(KeyboardDismissMode::Interactive) /* messages */)
        .child(
            view()
                .flex_row()
                .p(px(8.0))
                // Above the home indicator, unless the keyboard covers it.
                .pb(move || {
                    px(8.0) + if keyboard_height() > px(0.0) { px(0.0) } else { safe_area().bottom }
                })
                .child(
                    input()
                        .value(move || draft.get())
                        .on_change(move |t: &str| draft.set(t.to_owned()))
                        .multiline(true)
                        .submit_behavior(SubmitBehavior::Submit)
                        .return_key_type(ReturnKeyType::Send)
                        .on_submit(move |_: &str| send())
                        .placeholder("Message")
                        .flex_1()
                        .max_h(px(120.0)),
                ),
        )
}
```

```tsx tabs
import { Scroll, signal, View, keyboardFrame, safeAreaInsets } from "nsh";
import { Input } from "nsh/base";

function ChatScreen() {
  const insets = safeAreaInsets();
  const draft = signal("");
  const send = () => {
    if (draft().trim()) console.log("send", draft());
    draft.set("");
  };
  return (
    <View style={{ flex: 1, paddingBottom: "env(keyboard-inset-height)" }}>
      <Scroll style={{ flex: 1 }} keyboardDismissMode="interactive">
        {/* messages */}
      </Scroll>
      <View
        style={{
          flexDirection: "row",
          padding: 8,
          // Above the home indicator, unless the keyboard covers it.
          paddingBottom: 8 + (keyboardFrame().height > 0 ? 0 : insets().bottom),
        }}
      >
        <Input
          value={draft()}
          onChange={({ value }) => draft.set(value)}
          multiline
          submitBehavior="submit"
          returnKeyType="send"
          onSubmit={send}
          placeholder="Message"
          style={{ flex: 1, maxHeight: 120 }}
        />
      </View>
    </View>
  );
}
```

Il padding (`.pb_keyboard()`) restringe il contenuto sopra, mentre lo sfondo raggiunge il fondo della schermata; un margine inferiore (`marginBottom: "env(keyboard-inset-height)"`, `.mb_keyboard()`) fa terminare l'intera vista in corrispondenza del bordo superiore della tastiera. `calc(env(keyboard-inset-height) + <length>)` (Rust `.pb_keyboard_plus(..)`, `.mb_keyboard_plus(..)`) aggiunge una lunghezza, per esempio meno l'altezza di una tab bar sotto la vista.

L'altezza piena è adatta a una vista che raggiunge il fondo della superficie, come fa il contenuto di una schermata. In un host Android la cui finestra si ridimensiona per la tastiera, è la finestra stessa a restringersi e la variabile vale 0. Vedi [Keyboard](../elements/keyboard.md).

<a id="the-keyboard-accessor"></a>

### L'accessor della tastiera

`keyboard_height()` e `keyboard_duration()` in Rust, e `keyboardFrame()` da `nsh` in TSX (un `{ height, duration }`), sono reattivi: indicano quanto la tastiera si estende nella superficie (0 quando è nascosta; l'area sicura inferiore sotto di essa è inclusa) e la durata della sua animazione in millisecondi. Usali per qualsiasi caso personalizzato: nascondere un pulsante flottante durante la digitazione o dimensionare un pannello. Ciò che cambia con essi nell'aggiornamento in cui inizia il movimento della tastiera si muove insieme alla tastiera, secondo la sua curva e con i tempi calcolati dall'inizio del suo movimento (`LayoutCurve::Keyboard`), come fa `env(keyboard-inset-height)`; un'animazione configurata dall'app per quell'aggiornamento (`LayoutAnimation.configureNext`) ha la precedenza.

```rust tabs
view().child(when(
    || keyboard_height() == px(0.0),
    || view().absolute().right(px(16.0)).bottom(px(16.0)), /* … */
))
```

```tsx tabs
import { View, keyboardFrame } from "nsh";

<If when={keyboardFrame().height === 0}>
  <View style={{ position: "absolute", right: 16, bottom: 16 }}>…</View>
</If>
```

<a id="a-bar-over-the-keyboard-ios-inputaccessoryview"></a>

## Una barra sopra la tastiera (iOS): InputAccessoryView

`input_accessory_view(id)` in Rust e `InputAccessoryView` da `nsh/mobile` in TSX mostrano una barra agganciata alla parte superiore della tastiera mentre ha il focus un input che la indica: il `inputAccessoryView` di iOS. Si muove in modo nativo con la tastiera, anche durante la chiusura interattiva. Non occupa spazio nel punto in cui è collocata nell'albero; gli input vi fanno riferimento tramite il suo id (`.input_accessory(id)`, TSX `ios={{ inputAccessoryViewID }}` e `nativeID`):

```rust tabs
use nsh_core::prelude::*;

pub fn note() -> impl IntoElement {
    let content = signal(String::new());
    let field = element_ref();
    view()
        .p(px(16.0))
        .child(
            input()
                .element_ref(&field)
                .value(move || content.get())
                .on_change(move |t: &str| content.set(t.to_owned()))
                .input_accessory("note-bar")
                .placeholder("A note"),
        )
        .child(
            input_accessory_view("note-bar").bg(rgb(0xf6f8fa)).child(
                view()
                    .flex_row()
                    .items_center()
                    .p(px(8.0))
                    .child(
                        text(move || format!("{} characters", content.with(|t| t.chars().count())))
                            .flex_1()
                            .text_color(rgb(0x57606a)),
                    )
                    .child(
                        text("Done")
                            .on_press(move || field.blur())
                            .text_color(rgb(0x0969da))
                            .font_weight(FontWeight::SEMIBOLD),
                    ),
            ),
        )
}
```

```tsx tabs
import { type InputRef, signal, Text, View } from "nsh";
import { Input } from "nsh/base";
import { InputAccessoryView } from "nsh/mobile";

function Note() {
  const text = signal("");
  let input!: InputRef;
  return (
    <View style={{ padding: 16 }}>
      <Input
        ref={input}
        value={text()}
        onChange={({ value }) => text.set(value)}
        ios={{ inputAccessoryViewID: "note-bar" }}
        placeholder="A note"
      />
      <InputAccessoryView nativeID="note-bar" style={{ backgroundColor: "#f6f8fa" }}>
        <View style={{ flexDirection: "row", alignItems: "center", padding: 8 }}>
          <Text style={{ flex: 1, color: "#57606a" }}>{text().length} characters</Text>
          <Text onPress={() => input.blur()} style={{ color: "#0969da", fontWeight: "600" }}>Done</Text>
        </View>
      </InputAccessoryView>
    </View>
  );
}
```

La barra è larga quanto la finestra e alta quanto il suo contenuto. Gli input accessory sono una funzionalità di iOS: su Android la barra è una vista vuota e nascosta, quindi in quel caso colloca altrove questi controlli, per esempio sopra l'input (`os() == Os::Android` in Rust, `platform.os === "android"` in TSX).

<a id="related"></a>

## Correlati

- [`Input`](../elements/input.md): il riferimento dell'elemento.
- [Keyboard](../elements/keyboard.md) e [`Keyboard`](../modules/nsh.md#keyboard-and-keyboardframe).
- [`InputAccessoryView`](../modules/nsh-mobile.md#inputaccessoryview): `InputAccessoryView`.
- [Scrolling](./scrolling.md#scroll-views-and-the-keyboard): chiusura della tastiera e tap nelle scroll view.
