---
title: "OtpInput"
description: "Die Komponente OtpInput: ein numerischer Einmalcode mit fester Länge, der in ein einziges natives Feld getippt, eingefügt oder automatisch ausgefüllt wird und in Zellen, Gruppen und mit einem Cursor dargestellt wird, die die App gestaltet."
group: base
demo: el-otp-input
source_hash: 80ea5e26b79a21ac
---


# OtpInput

Ein One-Time-Code-Input nimmt eine feste Anzahl von Ziffern entgegen (einen Bestätigungscode aus einer SMS oder den Code einer Authenticator-App) und zeigt sie in Zellen an. Er übernimmt das Verhalten: Ein natives Textfeld, transparent und über den Zellen liegend, erhält die Tastatur. Eingabe, Eingabemethoden, Einfügen, der Ziffernblock und das Code-Autofill des Systems (iOS' „Von Nachrichten", Androids SMS-Vorschläge) stammen daher von der Plattform selbst, und Screenreader finden ein einziges Textfeld. Es werden nur Ziffern angenommen, bis zu `length`. Die Rücktaste entfernt die jeweils letzte Ziffer, und `onComplete` meldet, wenn der Code vollständig ist. Das Aussehen liegt bei der App: Ein `OtpInput` hat keine eigenen Farben, Größen, Rahmen oder Beschriftungen. Seine Bestandteile sind die Zellen, die Gruppen, in die sie aufgeteilt sind, und ein Caret. Die App gestaltet jeden davon.

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

`OtpInput` stammt aus [`nsh/base`](../modules/nsh-base.md), dem `nsh-base`-Crate in Rust. In Rust erzeugt `otp_input()` eine Instanz mit einem Setter pro Prop (`.length(..)`, `.cell_style(..)`), einer Listener-Methode pro Event (`.on_complete(..)`) und den typisierten Style-Methoden für den Input selbst.

<a id="the-code"></a>

## Der Code

- **Kontrolliert**: `value` übergeben und in `onChange` setzen. Die Zellen zeigen den `value`, den die App übergibt, unverändert an. Ein von der App gesetzter Wert (etwa das Leeren des Codes nach einem falschen) wird nie gemeldet.
- **Unkontrolliert**: `defaultValue` übergeben (oder nichts) und den Code aus `onChange` und `onComplete` lesen.

Was der Nutzer tut, wird aus dem Feld gelesen, wobei der Caret immer am Ende steht:

| Der Nutzer | Der Code |
|---|---|
| Tippt eine Ziffer | Sie wird am Ende angehängt, solange der Code kürzer als `length` ist. Ist er voll, ändert sich nichts. |
| Tippt eine Ziffer in Vollbreite (`０`–`９`, etwa von der Eingabemethode für ostasiatische Sprachen) | Die ASCII-Ziffer wird angehängt. |
| Tippt etwas anderes | Nichts ändert sich; das Feld verwirft die Eingabe. |
| Drückt die Rücktaste | Die letzte Ziffer wird entfernt. |
| Fügt ein, oder das System füllt einen Code automatisch aus | Dessen Ziffern werden auf dieselbe Weise angehängt. Text mit `length` oder mehr Ziffern (`123-456`, der Code einer Nachricht) ersetzt den Code durch seine ersten `length` Ziffern. |

`onChange` meldet jede Änderung mit dem neuen Code, und `onComplete` folgt darauf, wenn die Änderung die letzte Zelle gefüllt hat. Dort prüft die App den Code.

## Props

| Prop | Rust | Typ | Standard | Beschreibung |
|---|---|---|---|---|
| `length` | `.length(..)` | `number` | erforderlich | Wie viele Ziffern der Code hat: eine Zelle pro Ziffer. |
| `value` | `.value(..)` | `string` | keiner | Der von der App kontrollierte Code (wird unverändert angezeigt). Ohne ihn verwaltet der Input seinen eigenen. |
| `defaultValue` | `.default_value(..)` | `string` | keiner | Der anfängliche Code, solange `value` nicht gesetzt ist. |
| `masked` | `.masked(..)` | `boolean` | `false` | Gefüllte Zellen zeigen einen Punkt statt ihrer Ziffer, und das Feld ist ein sicheres Feld: Screenreader lesen den Code nicht vor, und das System hält ihn aus seinen Vorschlägen heraus. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Kein Fokus und keine Bearbeitung. `disabled:`-Styles gelten für den Input und seine Bestandteile, und Screenreader melden ihn als abgeblendet. |
| `groups` | `.groups(..)` | `number` | `1` | In wie viele Gruppen die Zellen aufgeteilt werden, so gleichmäßig wie möglich (3 + 3 bei sechs Ziffern in zwei Gruppen). Mindestens eine, höchstens eine pro Zelle. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | keiner | Was Screenreader für das Feld ansagen: wofür der Code dient und wie viele Ziffern er hat. |
| `cellClass`, `cellStyle` | `.cell_class(..)`, `.cell_style(\|s\| ..)` | `string`, `StyleProp<TextStyle>` | keiner | Jede Zelle: ihre Größe, ihr Rahmen und ihr Text (`color`, `fontSize`, die ihre Ziffer erbt). `focus:` und `data-filled:` gestalten ihre Zustände (siehe Bestandteile). |
| `groupClass`, `groupStyle` | `.group_class(..)`, `.group_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | keiner | Jede Gruppe von Zellen (`flex-row gap-2`). |
| `caretClass`, `caretStyle` | `.caret_class(..)`, `.caret_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | keiner | Der Caret: seine Breite, Höhe und Farbe. |
| `class`, `style` | Style-Methoden | `string`, `StyleProp<ViewStyle>` | keiner | Der Input selbst: die Zeile (oder Spalte) um seine Gruppen. |

## Events

| Event | Rust | Payload | Wann |
|---|---|---|---|
| `onChange` | `.on_change(\|value: &SharedString\| ..)` | `(e: { value: string })` | Der Nutzer hat den Code geändert: getippt, gelöscht, eingefügt oder automatisch ausgefüllt. |
| `onComplete` | `.on_complete(\|e: &OtpInputCompleteEvent\| ..)` | `{ value }` | Die Änderung des Nutzers hat die letzte Zelle gefüllt, nach dem zugehörigen `onChange`. |
| `onFocus` / `onBlur` | `.on_focus` / `.on_blur` | keine | Der Input hat den Tastaturfokus erhalten / verloren. |

<a id="ref-methods"></a>

## Ref-Methoden

| Methode | Rust | Beschreibung |
|---|---|---|
| `focus()` | `focus()` (`OtpInputApi`) | Erhält den Tastaturfokus und zeigt die Software-Tastatur an, wie bei einem Tippen auf den Input. |

<a id="parts"></a>

## Bestandteile

| Bestandteil | Enthalten in | Gestaltet mit |
|---|---|---|
| Der Input | | `class`, `style` |
| Eine Gruppe | dem Input, eine pro Gruppe | `groupClass`, `groupStyle`; `disabled:` folgt dem Input |
| Eine Zelle | ihrer Gruppe, eine pro Ziffer | `cellClass`, `cellStyle`; `focus:` auf der Zelle, die die nächste Ziffer aufnimmt, solange der Input den Fokus hat, `data-filled:` auf jeder Zelle, die eine Ziffer enthält, `disabled:` folgt dem Input |
| Die Ziffer | einer gefüllten Zelle | den Textstyles der Zelle (`text-xl`, `font-semibold`); `•` solange `masked` |
| Der Caret | der leeren Zelle, die die nächste Ziffer aufnimmt, solange der Input den Fokus hat | `caretClass`, `caretStyle` |

Die Zelle, die die nächste Ziffer aufnimmt, ist die nach der letzten Ziffer, oder die letzte Zelle, sobald der Code vollständig ist. Der Caret blinkt wie bei einem Textfeld (eine halbe Sekunde an, eine halbe Sekunde aus, und nach jeder Bearbeitung kurz dauerhaft sichtbar), und zwar über seine Opacity, nativ, während er seinen Platz im Layout behält. Bei reduzierter Bewegung bleibt er ruhig. Ein Tippen irgendwo auf den Input fokussiert ihn: Das Feld liegt über den Zellen.

Eine Zelle, die eine Ziffer enthält, ob maskiert oder nicht, hat das Attribut `data-filled`. So gestalten `data-filled:`-Klassen die Zellen, die der Nutzer gefüllt hat (ein stärkerer Rahmen, eine Füllung: `data-filled:border-foreground data-filled:bg-muted`), wie es shadcn/ui bei seinen Zuständen schreibt. Mit `group` in `cellClass` gestalten `group-data-filled:`-Klassen, was sich innerhalb einer gefüllten Zelle befindet, nämlich ihre Ziffer. Die Zellen ändern ihre Klassen, nie ihren Inhalt, sodass ein Tastendruck eine einzelne Zelle neu gestaltet und nichts neu zeichnet.

<a id="accessibility"></a>

## Barrierefreiheit

- Screenreader finden ein einziges Textfeld, benannt durch `accessibilityLabel` (sagen Sie, wofür der Code dient und wie lang er ist: „Bestätigungscode, 6 Ziffern"), mit dem Code als Wert. Die Zellen sind für sie verborgen. Solange `masked`, ist das Feld ein sicheres Feld, sodass der Code nicht vorgelesen wird.
- Die Tastatur ist die der Plattform: der Ziffernblock auf Smartphones, auf Desktops jede Tastatur (es werden nur Ziffern angenommen) und die Rücktaste. Mit Tab erreicht man den Input wie jedes Textfeld.
- Solange `disabled`, erhält er keinen Fokus, und Screenreader melden ihn als abgeblendet.

Siehe [Barrierefreiheit](../docs/accessibility.md) für Labels, Rollen und Ansagen im Allgemeinen.

<a id="platform-notes"></a>

## Hinweise zu Plattformen

- iOS: Das Feld ist ein Code-Feld (`textContentType` `oneTimeCode`), sodass die QuickType-Leiste einen Code aus Nachrichten oder Mail anbietet. Der Ziffernblock erscheint. Ein `masked`-Feld beginnt von vorn, wenn erneut hineingetippt wird, nachdem es den Fokus verloren hat, wie es bei den sicheren Feldern von iOS der Fall ist.
- Android: `autofillHints` `smsOTPCode` lässt die Tastatur und den Autofill-Dienst den Code einer SMS anbieten. Die Zifferntastatur erscheint.
- macOS, Windows, Linux und das Web: Tippen und Einfügen gehen an das Feld (im Browser mit `inputmode="numeric"` für die Zifferntastatur eines Smartphones), und über den Zellen wird der I-Beam-Zeiger angezeigt.
