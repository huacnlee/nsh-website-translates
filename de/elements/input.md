---
title: "Input"
description: "Das native Textfeld: kontrollierter und unkontrollierter Text, Tastaturen, Autofill, Auswahl, mehrzeilige Eingaben und Fokus."
group: base
demo: el-input
source_hash: 1f03d974252777de
---


# Input

`Input` ist ein natives Textfeld: ein UITextField (einzeilig) oder UITextView (mehrzeilig) auf iOS und Mac Catalyst, ein
EditText auf Android. Eingabe, Caret, Auswahl, Autokorrektur und Autofill stammen von der Plattform selbst. In Rust erzeugst du
eines mit `nsh_base::input()`, in TSX mit `<Input>` aus `nsh/base`.

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

## Kontrolliert und unkontrolliert

- **Kontrolliert**: Übergib `value` und aktualisiere es in `onChange`. Die App kann umschreiben, was der Benutzer getippt hat (kürzen,
  formatieren): Der Text zeigt die Änderung sofort an und wird korrigiert, sobald das neue `value` eintrifft. Jede native Änderung trägt einen Zähler,
  und ein `value` der App wird angewendet, wenn es auf der letzten Änderung basiert, sodass neuere Eingaben immer Vorrang vor einer langsamen
  Aktualisierung haben.
- **Unkontrolliert**: Übergib `defaultValue` (`.default_value(..)` oder nichts) und lies den Text aus `onChange` oder
  `onSubmit`.

Regeln, die während der Eingabe des Benutzers gelten müssen, sind Props und werden nativ umgesetzt: `maxLength` begrenzt die Länge und
`submitBehavior` legt fest, was die Eingabetaste bewirkt. Siehe [Formulare und Tastatur](../docs/forms-and-keyboard.md).

## Props

Zusätzlich zu den [gemeinsamen Props](./index.md#common-props) (mit `style` als `TextStyle` typisiert: Schriftart, Farbe, Ausrichtung und die
View-Styles werden angewendet):

### Text

| Prop | Rust | Typ | Standard | Beschreibung |
|---|---|---|---|---|
| `value` | `.value(..)` | `string` | | Der Text, von der App kontrolliert. |
| `defaultValue` | `.default_value(..)` | `string` | | Der Anfangstext. |
| `placeholder` | `.placeholder(..)` | `string` | | Wird angezeigt, solange das Eingabefeld leer ist. |
| `multiline` | `.multiline(..)` | `boolean` | `false` | Mehrere Zeilen; die Eingabetaste fügt einen Zeilenumbruch ein, sofern `submitBehavior` nichts anderes festlegt. |
| `scrollbar` | `.scrollbar(..)` | `boolean \| ScrollbarTheme` | `true` | Die Bildlaufleiste eines mehrzeiligen Eingabefelds: der Indikator der Plattform oder die integrierte Leiste der App, sobald diese eine festgelegt hat ([Scrollbar](./scrollbar.md#built-in-bars)); ein Objekt ist ein eigenes Theme, `false` bedeutet keine. |
| `maxLength` | `.max_length(..)` | `number` | | Die maximale Anzahl an Zeichen, die der Benutzer eingeben kann. |
| `readonly` | `.readonly(..)` | `boolean` | `false` | Der Benutzer kann den Text auswählen und kopieren, aber nicht ändern. |
| `masked` | `.masked(..)` | `boolean` | `false` | Der Text wird verborgen (Passwörter). |
| `allowFontScaling` | | `boolean` | `true` | Folgt der System-Textgröße. |
| `maxFontSizeMultiplier` | | `number` | `0` | Die Obergrenze der Systemskalierung (0 bedeutet keine). |

<a id="keyboard"></a>

### Tastatur

| Prop | Rust | Typ | Standard | Beschreibung |
|---|---|---|---|---|
| `keyboardType` | `.keyboard_type(KeyboardType::Email)` | `"default" \| "number-pad" \| "decimal-pad" \| "numeric" \| "numbers-and-punctuation" \| "email-address" \| "phone-pad" \| "url"` | `"default"` | Das Tastaturlayout ([die Werte](../docs/forms-and-keyboard.md#keyboards-and-autofill); `numbers-and-punctuation` hat auf iOS ein Minuszeichen). |
| `returnKeyType` | `.return_key_type(ReturnKeyType::Next)` | `"default" \| "done" \| "go" \| "next" \| "search" \| "send"` | `"default"` | Die Beschriftung der Eingabetaste. |
| `autoCapitalize` | `.auto_capitalize(AutoCapitalize::None)` | `"none" \| "sentences" \| "words" \| "characters"` | `"sentences"` | Automatische Großschreibung. |
| `autoCorrect` | `.auto_correct(..)` | `boolean` | `true` | Die Korrekturen des Systems. |
| `autoComplete` | `.auto_fill(AutoFill::OneTimeCode)` | `AutoComplete \| TextContentType` | | Was das Eingabefeld enthält, für Autofill auf iOS, Android und im Web: `"username"`, `"current-password"`, `"new-password"`, `"one-time-code"`, `"email"`, `"tel"`, `"postal-code"`, `"cc-number"`, `"off"`, … |
| `pasteBehavior` | `.paste_behavior(PasteBehavior::Report)` | `"insert" \| "report"` | `"insert"` | Was beim Einfügen geschieht: `"insert"` fügt den eingefügten Text ein, `"report"` fügt nichts ein, damit die App das behandeln kann, was `onPaste` meldet. Bilder und Dateien werden nie eingefügt. |
| `submitBehavior` | `.submit_behavior(SubmitBehavior::Submit)` | `"submit" \| "blurAndSubmit" \| "newline"` | `"blurAndSubmit"` (einzeilig), `"newline"` (mehrzeilig) | Was die Eingabetaste bewirkt: `"submit"` meldet `onSubmit` und behält den Fokus, `"blurAndSubmit"` entzieht zusätzlich den Fokus, `"newline"` fügt einen Zeilenumbruch ein (mehrzeilig; ein einzeiliges Feld sendet ab). Ein mehrzeiliges Eingabefeld, das absendet, nimmt auf Hardware-Tastaturen weiterhin Zeilenumbrüche über Shift+Return oder Option / Alt+Return entgegen. `"submit"` lässt die Tastatur eingeblendet (z. B. um mehrere Nachrichten zu senden). |
| `autoFocus` | `.auto_focus(..)` | `boolean` | `false` | Erhält den Fokus, sobald es erscheint. |

<a id="caret-and-selection"></a>

### Caret und Auswahl

| Prop | Rust | Typ | Beschreibung |
|---|---|---|---|
| `caret` | `.caret(..)` | `boolean` | Das Caret wird gezeichnet (Standard `true`; `false` blendet es aus). |
| `selectedRange` | `.selected_range((start, end))` | `{ start: number; end?: number }` | Die kontrollierte Auswahl, in UTF-16-Einheiten; `end` ist standardmäßig `start` (ein Caret). |

Das Caret blinkt, solange sein Fenster angezeigt und aktiv ist. In GPUI-Fenstern unter Linux bleibt es nach zehn Sekunden
ohne Eingabe oder Bewegung sichtbar, wie in GTK-Apps, sodass ein fokussiertes Feld, das sich selbst überlassen bleibt, keine Frames kostet.

<a id="colors"></a>

### Farben

Die Farben von Platzhalter, Caret und Auswahlhervorhebung sind Style-Keys mit ihren Tailwind-Klassen und
Methoden in Rust (UIKit färbt Caret und Auswahl mit einer Farbe ein, und zwar mit der des Carets, wenn sie gesetzt ist):

| Style-Key | Rust | Klasse | Beschreibung |
|---|---|---|---|
| `placeholderColor` | `.placeholder_color(..)` | `placeholder:text-*` | Die Farbe des Platzhalters. |
| `caretColor` | `.caret_color(..)` | `caret-*` | Die Farbe des Carets. |
| `selectionColor` | `.selection_color(..)` | `selection:text-*` | Die Farbe der Auswahlhervorhebung. |

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

| `ios`-Key | Rust | Typ | Beschreibung |
|---|---|---|---|
| `textContentType` | `.auto_fill(..)` | `AutoComplete \| TextContentType` | Die Namen von iOS für `autoComplete` (`"oneTimeCode"`, `"newPassword"`, …). |
| `inputAccessoryViewID` | `.input_accessory(id)` | `string` | Das `nativeID` einer `InputAccessoryView` ([`InputAccessoryView`](../modules/nsh-mobile.md#inputaccessoryview)), die über der Tastatur angezeigt wird, solange das Eingabefeld den Fokus hat. |
| `keyboardAppearance` | `.keyboard_appearance(KeyboardAppearance::Dark)` | `"default" \| "light" \| "dark"` | Das Erscheinungsbild der Tastatur; `"default"` folgt dem Erscheinungsbild des Systems. Die Tastaturen von Android folgen dem Theme des Systems. |

```rust tabs
use nsh_core::element::AutoFill;

input().auto_fill(AutoFill::OneTimeCode).keyboard_type(KeyboardType::Number)
```

```tsx tabs
<Input autoComplete="one-time-code" keyboardType="number-pad" ios={{ textContentType: "oneTimeCode" }} />
```

## Events

| Event | Rust | Payload | Wann |
|---|---|---|---|
| `onChange` | `.on_change(\|text: &str\| ..)` | `{ value }` | Der Benutzer hat den Text geändert: `value` ist der aktuelle Text. |
| `onSubmit` | `.on_submit(\|text: &str\| ..)` | `{ text }` | Die Eingabetaste wurde in einem Eingabefeld gedrückt, das absendet (einzeilig oder `submitBehavior` `"submit"` / `"blurAndSubmit"`). |
| `onFocus` / `onBlur` | `.on_focus` / `.on_blur` | keiner | Das Eingabefeld hat den Fokus erhalten / verloren. |
| `onSelectionChange` | `.on_selection_change(\|s: &Selection\| ..)` | `{ start, end }` | Das Caret oder die Auswahl hat sich bewegt (UTF-16-Einheiten). |
| `onPaste` | `.on_paste(\|e: &PasteEvent\| ..)` | `{ text, html, files, uris }` | Der Benutzer hat etwas eingefügt: den Text, seine Formatierung als HTML (Linux, Web), Bilder (ein Screenshot) als `File`s, `file:`-URLs lokaler Dateien. Vor dem `onChange` des Textes, den es einfügt ([Formulare und Tastatur](../docs/forms-and-keyboard.md#pasting-images-and-files)). |
| `onCaretMove` | `.on_caret_move(\|e: &CaretEvent\| ..)` | `{ bounds, pageBounds }` | Das Caret hat sich bewegt, mit der Auswahl oder weil der Text gescrollt oder umgebrochen wurde: `bounds` ist seine Position im Eingabefeld, `pageBounds` im Fenster, das `anchor` eines `Overlay` ([Formulare und Tastatur](../docs/forms-and-keyboard.md#the-caret)). |
| `onKeyPress` | `.on_key_press(\|key: &str\| ..)` | `{ key }` | Bevor sich der Text ändert: `key` ist der getippte Text, `"Backspace"` oder `"Enter"`. |
| `onContentSizeChange` | `.on_content_size_change(\|size: &Size<Points>\| ..)` | `{ size }` | Die Größe des Textes hat sich geändert (bei mehrzeiligen Feldern in der Breite des Eingabefelds), während er getippt wird; ein leeres Eingabefeld meldet eine leere Zeile, unabhängig von seinem Platzhalter. |
| `onCompositionChange` | `.on_composition_change(\|e: &Composition\| ..)` | `{ composing, text }` | Die Komposition einer Eingabemethode hat begonnen, sich geändert oder geendet: `text` ist das, was gerade komponiert wird (Pinyin, bevor ein Zeichen gewählt ist, Kana vor der Konvertierung), `""`, sobald sie endet. Der übernommene Text erreicht `onChange` vor dem Ende. |

Ein mehrzeiliges Eingabefeld, das mit seinem Text wächst:

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

## Ref-Methoden

| Methode | Rust | Beschreibung |
|---|---|---|
| `focus()` | `focus()` | Setzt den Fokus auf das Eingabefeld und zeigt die Tastatur an. |
| `blur()` | `blur()` | Entzieht ihm den Fokus. |
| `setSelection(start, end?)` | `set_selection(start, end)` | Wählt `start..end` aus (UTF-16-Einheiten); ein Caret, wenn beide gleich sind. |

Den Fokus bei Return auf das nächste Feld verschieben:

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

`Keyboard.dismiss()` aus `nsh` (`dismiss_keyboard()` in Rust) blendet die Tastatur aus, unabhängig davon, welches Eingabefeld sie hat.

<a id="platform-notes"></a>

## Hinweise zu Plattformen

- Auf macOS teilen sich einzeiliger Text, Platzhalter und Carets die Schriftmetriken des nativen Felds und werden gemeinsam
  innerhalb der Content-Box zentriert. `lineHeight` fließt in das Layout ein; mehrzeilige Editoren verwenden es zusätzlich für den Absatzabstand.
- Eingabefelder in einer [Scroll View](./scroll.md#keyboard) werden nativ von der Tastatur freigehalten. Verwende andernorts
  ein unteres Padding oder Margin von [`env(keyboard-inset-height)`](./keyboard.md).
- `disabled` deaktiviert das Eingabefeld (kein Fokus) und wendet zusätzlich die Disabled-Styles an; ein `readonly`-Eingabefeld behält seinen
  Fokus und seine Auswahl.
- `inputAccessoryViewID` gilt auf iOS, wo die Tastatur eine Zubehörleiste hat.
