---
title: "Formulare und die Tastatur"
description: "Texteingabe mit dem input-Element – kontrollierte und unkontrollierte Werte, Tastaturtypen, die Return-Taste, Fokus, Auswahl, wachsende mehrzeilige Eingabefelder – und wie Inhalte vom Software-Keyboard freigehalten werden."
order: 42
group: ui
demo: guide-forms
source_hash: a7bed0645c77c155
---


# Formulare und die Tastatur

Texteingabe ist das Eingabeelement, `input()` in Rust und `<Input>` in TSX: ein UITextField oder UITextView auf iOS, ein EditText auf Android. Tippen, Caret, Auswahl, Autokorrektur und Autofill übernimmt die Plattform; deine App erhält den Text über Events und kann ihn steuern. NSH hält fokussierte Eingabefelder außerdem selbstständig oberhalb der Software-Tastatur und liefert dir die Höhe der Tastatur als reaktiven Wert für die Fälle, die es nicht allein bewältigen kann.

Ein Eingabefeld nimmt Styles wie jede View an (typisierte Style-Methoden in Rust, Styles und Tailwind-Klassen in TSX), sodass die Felder eines Formulars das Aussehen deiner App haben. Ein Feld mit Label ist eine kurze, eigene Komponente:

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

## Kontrollierte und unkontrollierte Eingabefelder

Ein Eingabefeld ist **kontrolliert (controlled)**, wenn du seinen Wert übergibst (`.value(..)`, TSX `value`): Es zeigt, was dein Signal enthält, und du aktualisierst das Signal im Change-Event (`.on_change(..)`, TSX `onChange`).

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

Weil du den Wert kontrollierst, kannst du das Getippte umwandeln: `.on_change(move |t: &str| tag.set(t.to_uppercase()))` wandelt in Großbuchstaben um, `onChange={({ value }) => code.set(value.replace(/[^0-9]/g, ""))}` behält nur Ziffern.

<a id="input-methods"></a>

### Eingabemethoden

Chinesische, japanische und koreanische Eingabemethoden setzen Text zusammen, bevor sie ihn übernehmen: Aus Pinyin wird 腾, sobald ein Zeichen gewählt ist. `onCompositionChange` (Rust `.on_composition_change(..)`) meldet die Komposition fortlaufend, `{ composing: true, text: "teng" }` während der Benutzer tippt und `{ composing: false, text: "" }`, wenn sie endet; der übernommene Text erreicht `onChange` vor dem Ende. Auf iOS, Android, macOS und im Web meldet `onChange` auch den Text, der gerade komponiert wird, da diese Systeme ihn im Eingabefeld halten; auf Windows, Linux und GPUI meldet es den übernommenen Text. Ein kontrolliertes Eingabefeld führt die Komposition fort, was auch immer die App mit dem Wert macht: Ein `value`, das während der Komposition gesetzt wird, erscheint erst nach ihrem Ende. Ein Eingabefeld, das seinen Text in Großbuchstaben umwandelt oder filtert, nimmt Pinyin daher so an, wie es getippt wird.

Ein Suchfeld, das nur den übernommenen Text durchsucht:

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

Ein Eingabefeld ist **unkontrolliert**, wenn es keinen Wert hat: Es hält seinen eigenen Text, beginnend mit seinem Standardwert (`.default_value(..)`, TSX `defaultValue`), und du liest ihn aus dem Change- oder Submit-Event, wenn du ihn brauchst. Verwende das für Felder, die du nur beim Absenden liest, etwa ein Passwort.

> [!NOTE]
> Ein kontrolliertes Eingabefeld verliert nie Tastenanschläge. Jede native Bearbeitung trägt einen Edit-Zähler, und ein aus JS zurückkommendes `value` wird nur angewendet, wenn es auf die neueste Bearbeitung antwortet. Ist JS langsam und hat der Benutzer inzwischen weiter getippt, wird der veraltete Wert verworfen, statt den neueren Text zu überschreiben.

## Props

In Rust ist jede Prop eine Methode von `input()` mit einem Namen in Snake Case (`.placeholder(..)`, `.masked(true)`, `.max_length(6)`, `.return_key_type(ReturnKeyType::Next)`, `.selected_range((0, 4))`), mit diesen eigenen Namen: `.keyboard_type(KeyboardType::Email)` und die übrigen `KeyboardType`-Varianten, `.auto_fill(AutoFill::Email)` für `autoComplete`, `.keyboard_appearance(..)` und `.input_accessory(..)` für die `ios={{ … }}`-Props. Jedes Event ist eine `on_`-Methode: `.on_change(|text: &str| ..)`, `.on_submit(|text: &str| ..)`, `.on_focus(..)`, `.on_blur(..)`, `.on_selection_change(|s: &Selection| ..)`, `.on_key_press(|key: &str| ..)`, `.on_content_size_change(|size: &Size<Points>| ..)`.

| Prop | Typ | Standard | Beschreibung |
|---|---|---|---|
| `value` | `string` | | Der Text, von JS kontrolliert. |
| `defaultValue` | `string` | | Der Anfangstext eines unkontrollierten Eingabefelds. |
| `placeholder` | `string` | | Wird angezeigt, solange das Eingabefeld leer ist. |
| `masked` | `boolean` | `false` | Verbirgt den Text (Passwörter). |
| `keyboardType` | `KeyboardType` | `"default"` | Das Tastaturlayout. |
| `returnKeyType` | `ReturnKeyType` | `"default"` | Die Beschriftung der Return-Taste. |
| `autoCapitalize` | `"none" \| "sentences" \| "words" \| "characters"` | `"sentences"` | Automatische Großschreibung. |
| `autoCorrect` | `boolean` | `true` | Die Korrekturen des Systems. |
| `autoComplete` | `AutoComplete` | | Was das Eingabefeld enthält, für Autofill. |
| `multiline` | `boolean` | `false` | Mehrere Zeilen; Return fügt einen Zeilenumbruch ein, sofern `submitBehavior` nichts anderes festlegt. |
| `maxLength` | `number` | | Die maximale Anzahl an Zeichen, die der Benutzer eingeben kann. |
| `readonly` | `boolean` | `false` | Der Benutzer kann den Text auswählen und kopieren, aber nicht ändern. |
| `autoFocus` | `boolean` | `false` | Erhält den Fokus, sobald es erscheint. |
| `submitBehavior` | `"submit" \| "blurAndSubmit" \| "newline"` | einzeilig `"blurAndSubmit"`, mehrzeilig `"newline"` | Was Return bewirkt: absenden und den Fokus behalten, absenden und den Fokus abgeben oder einen Zeilenumbruch einfügen (nur mehrzeilig). |
| `pasteBehavior` | `"insert" \| "report"` | `"insert"` | Was Einfügen bewirkt: seinen Text einfügen oder nichts ([Einfügen](#pasting-images-and-files)). |
| `caret` | `boolean` | `true` | Der Caret wird gezeichnet; `false` blendet ihn aus. |
| `ios={{ keyboardAppearance }}` | `"default" \| "light" \| "dark"` | `"default"` | Das Aussehen der Tastatur (iOS). |
| `selectedRange` | `{ start: number; end?: number }` | | Die kontrollierte Auswahl, in UTF-16-Einheiten. |
| `allowFontScaling` | `boolean` | `true` | Der Systemschriftgröße folgen. |
| `maxFontSizeMultiplier` | `number` | | Die Obergrenze der Systemskalierung (0: keine). |
| `ios={{ inputAccessoryViewID }}` | `string` | | iOS: die Leiste über der Tastatur (siehe unten). |
| `ios={{ textContentType }}` | `TextContentType` | | iOS-Namen für `autoComplete`-Werte. |

Events:

| Event | Payload | Wann |
|---|---|---|
| `onChange` | `{ value }` | Der Text hat sich geändert: `value` ist der aktuelle Text. |
| `onSubmit` | `{ text }` | Die Return-Taste wurde in einem Eingabefeld gedrückt, das absendet (einzeilig, oder `submitBehavior` `"submit"` / `"blurAndSubmit"`). |
| `onFocus` / `onBlur` | | Das Eingabefeld hat den Fokus erhalten / verloren. |
| `onSelectionChange` | `{ start, end }` | Der Caret oder die Auswahl hat sich bewegt (UTF-16-Einheiten). |
| `onPaste` | `{ text, html, files, uris }` | Der Benutzer hat eingefügt: Text, dessen HTML (Linux, Web), Bilder als `File`s, URLs lokaler Dateien ([Einfügen](#pasting-images-and-files)). |
| `onCaretMove` | `{ bounds, pageBounds }` | Der Caret hat sich bewegt: wo er im Eingabefeld und im Fenster steht ([Der Caret](#the-caret)). |
| `onKeyPress` | `{ key }` | Bevor sich der Text ändert: `key` ist der getippte Text, `"Backspace"` oder `"Enter"`. |
| `onContentSizeChange` | `{ size }` | Die Größe des Textes (`size`) hat sich geändert (bei mehrzeiligen Feldern in der Breite des Eingabefelds), während getippt wird; ein leeres Eingabefeld meldet eine leere Zeile, unabhängig von seinem Placeholder. |
| `onCompositionChange` | `{ composing, text }` | Die Komposition einer Eingabemethode hat begonnen, sich geändert oder geendet (siehe [Eingabemethoden](#input-methods)). |

Ein Eingabefeld wird wie Text gestylt: `fontSize`, `color`, `fontFamily`, `textAlign`, `letterSpacing` und die übrigen [Textstile](./text.md), dazu Rahmen, Padding und Hintergründe. Der Fokus-Style (`.focus(|s| ..)` in Rust, die Tailwind-Variante `focus:` oder `focusStyle` in TSX) gilt, solange das Eingabefeld den Fokus hat. Die Farbe des Placeholders ist `.placeholder_color(..)` (der
`placeholderColor`-Style-Schlüssel, `placeholder:text-*`), die des Carets `.caret_color(..)` (`caretColor`, `caret-*`) und die der Auswahlhervorhebung `.selection_color(..)`
(`selectionColor`, `selection:text-*`); UIKit färbt Caret und Auswahl mit einer einzigen Farbe, mit der des Carets, wenn sie gesetzt ist:

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

## Tastaturen und Autofill

Der Tastaturtyp (`.keyboard_type(..)`, TSX `keyboardType`) wählt das Layout:

| Rust | TSX | Tastatur |
|---|---|---|
| `KeyboardType::Default` | `"default"` | Text. |
| `KeyboardType::Email` | `"email-address"` | Text mit `@` und `.` griffbereit. |
| `KeyboardType::Url` | `"url"` | Text mit `/` und `.com`. |
| `KeyboardType::Number` | `"number-pad"` | Nur Ziffern: kein Vorzeichen, kein Dezimaltrennzeichen (Codes, PINs). |
| `KeyboardType::Decimal` | `"decimal-pad"` | Ziffern und ein Dezimaltrennzeichen. |
| `KeyboardType::Numeric` | `"numeric"` | Wie in React Native: auf iOS das Dezimal-Pad; auf Android Ziffern mit Vorzeichen und Dezimaltrennzeichen. |
| `KeyboardType::NumbersAndPunctuation` | `"numbers-and-punctuation"` | Ziffern, ein Minuszeichen und Satzzeichen (die Tastatur für Zahlen und Satzzeichen auf iOS; auf Android Ziffern mit Vorzeichen und Dezimaltrennzeichen). Verwende sie auf iOS für negative Zahlen. |
| `KeyboardType::Phone` | `"phone-pad"` | Ein Telefon-Wählfeld. |

Auf iOS gibt `.keyboard_appearance(KeyboardAppearance::Dark)` (TSX `ios={{ keyboardAppearance: "dark" }}`; oder light, der Standard) der Tastatur unabhängig vom Erscheinungsbild des Systems ein helles oder dunkles Aussehen, etwa für eine dunkle App im Light Mode. Die Tastaturen von Android folgen immer dem Theme des Systems.

Autofill (`.auto_fill(AutoFill::Email)`, TSX `autoComplete`) teilt dem System mit, was das Feld enthält, damit es gespeicherte Namen, Adressen, Passwörter und Einmalcodes aus Nachrichten anbieten kann. Das `AutoFill` von Rust hat eine Variante pro Art (`Name`, `GivenName`, `FamilyName`, `Email`, `Tel`, `Username`, `Password`, `NewPassword`, `OneTimeCode`, `StreetAddress`, `PostalCode`, `Country`, `CreditCardNumber`, `Url`, `Birthdate`, ... und `Off`). TSX akzeptiert diese Werte: `"name"`, `"given-name"`, `"family-name"`, `"email"`, `"tel"`, `"username"`, `"current-password"`, `"new-password"`, `"one-time-code"`, `"street-address"`, `"postal-code"`, `"country"`, `"cc-number"`, `"cc-exp"`, `"cc-csc"`, `"url"`, `"birthdate-full"` und weitere, oder `"off"`; auch die eigenen Namen von iOS (`"emailAddress"`, `"oneTimeCode"`, ...) werden akzeptiert, in `autoComplete` oder `ios={{ textContentType }}`.

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

## Die Return-Taste und der Wechsel zwischen Feldern

Der Typ der Return-Taste (`.return_key_type(ReturnKeyType::Next)`, TSX `returnKeyType`) beschriftet die Return-Taste: default, done, go, next, search oder send. Das Submit-Verhalten (`.submit_behavior(..)`, TSX `submitBehavior`) legt fest, was das Drücken bewirkt:

| Rust | TSX | Return | Standard für |
|---|---|---|---|
| `SubmitBehavior::BlurAndSubmit` | `"blurAndSubmit"` | löst das Submit-Event aus, danach verliert das Eingabefeld den Fokus | einzeilige Eingabefelder |
| `SubmitBehavior::Submit` | `"submit"` | löst das Submit-Event aus; das Eingabefeld behält den Fokus | |
| `SubmitBehavior::Newline` | `"newline"` | fügt einen Zeilenumbruch ein (nur mehrzeilige Eingabefelder) | mehrzeilige Eingabefelder |

Ein mehrzeiliges Eingabefeld mit `"submit"` oder `"blurAndSubmit"` sendet bei Return ab, wie es Chat-Eingaben tun, und bricht seine Zeilen trotzdem um; auf einer Hardware-Tastatur (Desktops, ein Mac, die Tastatur eines Tablets) fügt Shift+Return oder Option / Alt+Return einen Zeilenumbruch ein. Ein Return, das die Komposition einer Eingabemethode übernimmt (etwa bei chinesischer oder japanischer Eingabe), übernimmt sie nur und sendet nie ab.

Um zum nächsten Feld zu wechseln, halte Refs auf die Eingabefelder (`element_ref()` und `.element_ref(&r)` in Rust, `ref` in TSX) und rufe `focus()` auf:

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

Das Absenden ohne Blur (`SubmitBehavior::Submit`, `submitBehavior="submit"`) im ersten Feld hält die Tastatur oben, während der Fokus wechselt, sodass sie nicht erst verschwindet und wieder erscheint. Ein Chat-Eingabefeld, das bei Return absendet und fokussiert bleibt, sendet auf dieselbe Weise ab (siehe den Composer [unten](#content-outside-scroll-views)).

Sowohl die maximale Länge als auch das Submit-Verhalten werden nativ durchgesetzt: Die Plattform fragt beim Tippen „Darf dieses Zeichen hinzugefügt werden?“ und „Soll Return das Bearbeiten beenden?“, und NSH antwortet anhand der Props, ohne auf JS zu warten.

<a id="focus-from-code"></a>

## Fokus aus dem Code

Die Ref eines Eingabefelds bietet:

| Rust | TSX | Beschreibung |
|---|---|---|
| `focus()` | `focus()` | Fokussiert das Eingabefeld und zeigt die Tastatur. |
| `blur()` | `blur()` | Entzieht ihm den Fokus. |
| `set_selection(start, end)` | `setSelection(start, end?)` | Wählt `start..end` aus (UTF-16-Einheiten); ein Caret, wenn beide gleich sind (TSX: ohne `end`). |

Auf macOS und im Web bewegen `focus()` und `blur()` an der Ref einer View, die Presses annimmt, den Tastaturfokus wie die Tab-Taste ([Tastaturfokus](../elements/index.md#keyboard-focus)).

`dismiss_keyboard()` in Rust und `Keyboard.dismiss()` aus `nsh` in TSX entziehen jedem Eingabefeld den Fokus, das ihn gerade hat:

```rust tabs
view().on_press(|| dismiss_keyboard())
```

```tsx tabs
import { View, Keyboard } from "nsh";

<View onPress={() => Keyboard.dismiss()}>…</View>
```

<a id="selection"></a>

## Auswahl

Das Selection-Event (`.on_selection_change(..)`, TSX `onSelectionChange`) meldet den Caret und die Auswahl; das `set_selection` der Ref oder der ausgewählte Bereich (`.selected_range(..)`, TSX `selectedRange`) setzen sie. Positionen sind UTF-16-Codeeinheiten, wie die String-Indizes von JavaScript, sodass in TSX `text.slice(start, end)` der ausgewählte Text ist; in Rust schneidest du die UTF-16-Einheiten des Textes aus.

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

## Der Caret

Das Caret-Event (`.on_caret_move(..)`, TSX `onCaretMove`) sagt, wo der Caret steht, damit sich dort öffnen kann, was zum Caret gehört: Vorschläge für eine `@`-Erwähnung, das Menü eines Slash-Befehls, ein Emoji-Picker. `bounds` ist eine `Bounds`
im Eingabefeld (`origin` und `size`, mit angewendetem Padding und Scrolling des Eingabefelds), so breit, wie die Plattform den
Caret zeichnet, und so hoch wie seine Zeile; `pageBounds` ist dieselbe Box im Fenster (oder im Dialog, in dem das Eingabefeld liegt), die ein
Overlay als sein `anchor` übernimmt. Das Event kommt, solange das Eingabefeld den Fokus hat, immer wenn sich der Caret bewegt: mit der
Auswahl und wenn der Text des Eingabefelds scrollt oder auf andere Zeilen umbricht. In Rust wird ein Overlay mit
`.anchor_bounds(..)` an einer Box platziert.

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

`pageBounds` ist die Stelle, an der der Caret war, als das Event kam: Eine Seite, die unter dem Eingabefeld scrollt, bewegt das Eingabefeld,
sendet aber kein Event. Schließe die Vorschläge daher beim Scrollen oder verankere sie am Eingabefeld selbst.

<a id="pasting-images-and-files"></a>

## Bilder und Dateien einfügen

Das Paste-Event (`.on_paste(..)`, TSX `onPaste`) meldet, was der Benutzer eingefügt hat, per Tastaturkürzel, über das Einfügen-Menü
oder über die Bildeingabe einer Tastatur: `text`, `html`, `files` und `uris`. `html` ist derselbe Inhalt mit seiner Formatierung, so wie ihn ein
Browser, eine Office-Suite oder ein Rich-Text-Editor kopiert hat (auf Linux und im Web). `files` ist das, was die Zwischenablage als Daten enthielt, etwa ein
Screenshot oder ein von einer Seite oder aus einer anderen App kopiertes Bild: `File`s, deren Bytes die App hochladen oder anzeigen kann, mit dem Namen
`image.png` (oder dem Typ, der sie ist). `uris` sind die `file:`-URLs von Dateien, die in einem Dateimanager kopiert wurden, wie bei einem Datei-Drop.
Die Plattform liest die Zwischenablage, wenn der Benutzer einfügt, und nur dann.

Das Eingabefeld fügt den eingefügten Text wie gewohnt selbst ein: Das Event kommt vor dem `onChange` dieses Textes.
Bilder und Dateien werden nie eingefügt, da ein Eingabefeld Text enthält. Mit `pasteBehavior` `"report"` fügt das Eingabefeld
nichts ein, und die App entscheidet, was ein Einfügen bewirkt: einen langen Text als Anhang senden oder eine bereinigte Version einfügen.
Das Eingabefeld entscheidet sofort anhand der Prop, weil das System es auf der Stelle fragt.

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

Lade eine eingefügte Datei wie jede andere `File` hoch, mit `fetch` und `FormData` (`form.append("image", file)`); ihre Bytes bleiben
nativ, bis sie gesendet werden. Auf Android melden Tastaturen, die Bilder einfügen (GIFs, Sticker), diese auf dieselbe Weise. Auf
Linux wird die Zwischenablage asynchron gelesen, sodass das Event nach dem `onChange` des eingefügten Textes kommen kann.
Maskierte Eingabefelder auf macOS behalten das Einfügen von AppKit und melden nichts.

<a id="multiline-inputs-that-grow"></a>

## Mehrzeilige Eingabefelder, die wachsen

Ein mehrzeiliges Eingabefeld (`.multiline(true)`, TSX `multiline`) scrollt seinen Text innerhalb seiner eigenen Höhe. Damit es mit seinem Inhalt wächst, speise die Höhe aus dem Content-Size-Event (`.on_content_size_change(..)`, TSX `onContentSizeChange`) mit einer Obergrenze zurück in seinen Style:

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

Die gemeldete Höhe ist die des Textes (in der Breite des Eingabefelds), addiere also das vertikale Padding selbst, wie oben.
<a id="keeping-inputs-above-the-keyboard"></a>

## Eingaben oberhalb der Tastatur halten

<a id="inside-scroll-views-automatic"></a>

### In Scroll-Views: automatisch

Wenn die Tastatur über einer fokussierten Eingabe erscheint, die sich in einer Scroll-View oder einer Liste befindet, gibt NSH der Scroll-View einen unteren Inset in Höhe der Tastatur und scrollt die Eingabe in den sichtbaren Bereich. Das geschieht nativ und erfordert keinen Code. Ein langes Formular ist einfach eine Scroll-View aus Eingaben:

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

Der Dismiss-Modus (`.keyboard_dismiss_mode(..)`, TSX `keyboardDismissMode`: none, on drag, interactive) ermöglicht es, die Tastatur durch Ziehen am Formular auszublenden; Handled Taps (`.keyboard_taps(KeyboardTaps::Handled)`, TSX `keyboardShouldPersistTaps="handled"`) lassen einen Tipp auf eine Schaltfläche durch, während die Tastatur sichtbar ist, anstatt ihn nur zum Schließen der Tastatur zu verwenden. Siehe [Scrolling](./scrolling.md#scroll-views-and-the-keyboard).

<a id="content-outside-scroll-views"></a>

### Inhalte außerhalb von Scroll-Views

Wenn die Tastatur unter iOS eine fokussierte Eingabe verdecken würde, die sich in keiner Scroll-View befindet, verschiebt NSH den Inhalt des zugehörigen Bildschirms (oder Dialogs) nach oben, bis die Eingabe knapp oberhalb der Tastatur liegt, entlang der Animationskurve der Tastatur, und wieder nach unten, wenn die Tastatur verschwindet oder die Eingabe den Fokus verliert, wie es SwiftUI tut (unter Android wird ein Fenster im Modus `adjustPan` vom System verschoben). Das geschieht nur für das, was das eigene Layout der App verdeckt lässt: Eine App, die selbst Platz schafft, wie unten gezeigt, wird nicht ein weiteres Mal verschoben.

Dabei wird die gesamte Seite verschoben. Eine am unteren Bildschirmrand verankerte Nachrichtenleiste soll mit der Tastatur nach oben fahren, während der Inhalt darüber stattdessen schrumpft: Versehen Sie den unteren Rand des Bildschirms mit einem Padding über das CSS-Element `env(keyboard-inset-height)` (`paddingBottom: "env(keyboard-inset-height)"`, Tailwind `pb-[env(keyboard-inset-height)]`, Rust `.pb_keyboard()`): Es schafft unten Platz in Höhe der Tastatur, nativ mit der Tastatur animiert.

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

Padding (`.pb_keyboard()`) lässt den Inhalt darüber schrumpfen, während der Hintergrund bis zum unteren Bildschirmrand reicht; ein unterer Margin (`marginBottom: "env(keyboard-inset-height)"`, `.mb_keyboard()`) beendet die gesamte View an der Oberkante der Tastatur. `calc(env(keyboard-inset-height) + <length>)` (Rust `.pb_keyboard_plus(..)`, `.mb_keyboard_plus(..)`) addiert eine Länge, etwa minus die Höhe einer darunterliegenden Tab-Leiste.

Die volle Höhe eignet sich für eine View, die bis an den unteren Rand der Oberfläche reicht, wie es der Inhalt eines Bildschirms tut. Bei einem Android-Host, dessen Fenster sich für die Tastatur in der Größe anpasst, schrumpft das Fenster selbst und die Variable ist 0. Siehe [Keyboard](../elements/keyboard.md).

<a id="the-keyboard-accessor"></a>

### Der Keyboard-Accessor

`keyboard_height()` und `keyboard_duration()` in Rust sowie `keyboardFrame()` aus `nsh` in TSX (ein `{ height, duration }`) sind reaktiv: Sie liefern, wie weit die Tastatur in die Oberfläche hineinragt (0, wenn sie ausgeblendet ist; der darunterliegende untere Safe-Area-Bereich ist eingeschlossen), und die Dauer ihrer Animation in Millisekunden. Verwenden Sie sie für alles Individuelle: einen schwebenden Button beim Tippen ausblenden oder ein Panel dimensionieren. Was sich mit ihnen in dem Update ändert, in dem die Bewegung der Tastatur beginnt, bewegt sich mit der Tastatur, auf deren Kurve und zeitlich ab dem Beginn ihrer Bewegung (`LayoutCurve::Keyboard`), wie es `env(keyboard-inset-height)` tut; eine Animation, die die App für dieses Update konfiguriert (`LayoutAnimation.configureNext`), hat Vorrang.

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

## Eine Leiste über der Tastatur (iOS): InputAccessoryView

`input_accessory_view(id)` in Rust und `InputAccessoryView` aus `nsh/mobile` in TSX zeigen eine an der Oberkante der Tastatur angebrachte Leiste, solange eine Eingabe den Fokus hat, die auf sie verweist: iOS' `inputAccessoryView`. Sie bewegt sich nativ mit der Tastatur, auch beim interaktiven Schließen. Sie beansprucht an der Stelle, an der sie im Baum platziert ist, keinen Platz; Eingaben verweisen über ihre ID auf sie (`.input_accessory(id)`, TSX `ios={{ inputAccessoryViewID }}` und `nativeID`):

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

Die Leiste ist so breit wie das Fenster und so hoch wie ihr Inhalt. Input Accessories gibt es nur unter iOS: Unter Android ist die Leiste eine leere, ausgeblendete View, platzieren Sie diese Bedienelemente dort daher an anderer Stelle, zum Beispiel oberhalb der Eingabe (`os() == Os::Android` in Rust, `platform.os === "android"` in TSX).

<a id="related"></a>

## Siehe auch

- [`Input`](../elements/input.md): die Elementreferenz.
- [Keyboard](../elements/keyboard.md) und [`Keyboard`](../modules/nsh.md#keyboard-and-keyboardframe).
- [`InputAccessoryView`](../modules/nsh-mobile.md#inputaccessoryview): `InputAccessoryView`.
- [Scrolling](./scrolling.md#scroll-views-and-the-keyboard): Schließen der Tastatur und Taps in Scroll-Views.
