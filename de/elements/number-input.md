---
title: "NumberInput"
description: "Die Komponente NumberInput: eine Zahl, die in ein Feld eingegeben oder über Schaltflächen, die Pfeiltasten und Screenreader schrittweise geändert wird, beschränkt auf die Dezimalstellen ihrer Schrittweite sowie auf min und max, mit einem Feld, Schaltflächen und einer Spalte mit Bedienelementen, die von der App gestaltet werden."
group: base
demo: el-number-input
source_hash: 4dd788dd07f8f04a
---


# NumberInput

Ein Zahlenfeld hält eine Zahl, die der Nutzer eintippt oder schrittweise ändert: eine Menge, einen Preis, eine Größe. Es bringt sein Verhalten selbst mit: Sein Feld nimmt eine Zahl an, oder den Text auf dem Weg zu einer Zahl (`-`, `1.`), und weist alles andere zurück, auch Ziffern und Vorzeichen anderer Tastaturen. Seine Buttons, Up und Down sowie das Erhöhen und Verringern eines Screenreaders ändern die Zahl um `step`, behalten dabei ihre Dezimalstellen bei und halten bei `min` und `max` an. Verlässt man das Feld, wird eine eingetippte Zahl auf diese Grenzen begrenzt. Das Aussehen bestimmt die App: Ein `NumberInput` hat keine eigenen Farben, Größen, Rahmen, Icons oder Texte. Es besteht aus dem Button zum Verringern, dem Feld zwischen dem `prefix` und dem `suffix` der App und dem Button zum Erhöhen (oder dem Feld zwischen diesen und einer Spalte mit beiden Buttons, `controlsRight`). Die App gestaltet jeden Teil und befüllt die Buttons.

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

`NumberInput` stammt aus [`nsh/base`](../modules/nsh-base.md), dem `nsh-base`-Crate in Rust. In Rust erzeugt `number_input()` ein Zahlenfeld mit einem Setter pro Prop (`.value(..)`, `.input_style(..)`), einer Listener-Methode pro Ereignis (`.on_change(..)`), den typisierten Style-Methoden für das Zahlenfeld selbst und `.prefix(..)` / `.suffix(..)` für das, was das Feld umgibt. Sein Wert ist ein `Option<f64>`.

<a id="value"></a>

## Wert

Der Wert ist eine Zahl oder `null` für ein leeres Feld. Die App besitzt ihn mit `value` und setzt den Wert, den `onChange` meldet, wie bei jedem Steuerelement von `nsh/base`. Oder sie überlässt den Wert dem Zahlenfeld mit `defaultValue` und erfährt dennoch von den Änderungen.

Der Text des Feldes und der Wert werden dort getrennt gehalten, wo es nötig ist, damit der Nutzer frei tippen kann:

- `onChange` meldet die Zahl, als die der Text gelesen wird, sobald sich diese Zahl ändert: `null`, solange der Text als keine Zahl gelesen wird (leer, `-`, `.`). Tippt man `1.` nach `1` oder `1.50` nach `1.5`, wird nichts gemeldet.
- Der Text bleibt so, wie der Nutzer ihn tippt, solange er als der Wert gelesen wird, den das Zahlenfeld hält. Ein kontrolliertes Zahlenfeld, das jeden gemeldeten Wert zurückgibt, behält also `1.` und `2.50`. Ein Wert, den die App setzt und den das Zahlenfeld nicht gemeldet hat, erscheint im Feld als der kürzeste Text, der als dieser Wert gelesen wird (`0.3`, `12`).
- Beim Tippen darf eine Zahl außerhalb von `min` und `max` liegen (1 auf dem Weg zu 15 mit `min={10}`) und wird wie getippt gemeldet. Wird das Feld verlassen oder Return / Enter gedrückt, wird sie auf den Bereich begrenzt und das wird gemeldet. Ein Text, der als keine Zahl gelesen wird, bleibt unverändert.
- Ein Schritt (ein Button, eine Taste, die Aktion eines Screenreaders) fragt mit `onChange` nach dem nächsten Wert. Bei einem kontrollierten Wert bewegt sich das Feld, sobald die App ihn zurückgibt, und behält dabei die Dezimalstellen des Schritts (`99.5` hoch bis `max={100}` zeigt `100.0`). Eine App, die einen Schritt ablehnt, belässt das Feld also, wo es ist. Eine Eingabe, die die App ablehnt, bleibt im Feld stehen, solange es bearbeitet wird, und verschwindet, wenn das Feld verlassen wird.

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

Das Feld nimmt an:

- Ziffern, einen Dezimalpunkt und ein Vorzeichen am Anfang (`+` oder `-`). Ein Buchstabe, ein zweiter Punkt oder ein zweites Vorzeichen oder ein Vorzeichen an anderer Stelle wird zurückgewiesen, und das Feld kehrt zu seinem Text zurück.
- Vollbreite Ziffern, Vorzeichen und Punkte, das Minuszeichen (U+2212) und den ideografischen Punkt (`。`), die als ihre ASCII-Formen gelesen werden, so wie chinesische und japanische Eingabemethoden sie tippen.
- Ein Komma als Dezimalpunkt, solange der Text keinen Punkt enthält (`3,25` ist 3.25), so wie es die Dezimaltaste der Tastaturen vieler Sprachen tippt.

## Props

| Prop | Rust | Typ | Standard | Beschreibung |
|---|---|---|---|---|
| `value` | `.value(..)` | `number \| null` | keiner | Der Wert (kontrolliert): eine Zahl oder `null` für ein leeres Feld. Die App setzt den Wert, den `onChange` meldet. |
| `defaultValue` | `.default_value(..)` | `number \| null` | keiner | Der Anfangswert, solange `value` nicht gesetzt ist. Das Zahlenfeld verwaltet den Wert dann selbst. |
| `min` | `.min(..)` | `number` | keiner | Der kleinste Wert: Schritte halten bei ihm an, ein eingetippter Wert darunter wird beim Verlassen des Feldes auf ihn begrenzt. |
| `max` | `.max(..)` | `number` | keiner | Der größte Wert, wie `min` von oben. Ein Wert unter `min` ist `min`. |
| `step` | `.step(..)` | `number` | `1` | Wie weit ein Schritt geht (Page Up / Page Down: zehn Schritte). Ein Wert, der keine positive Zahl ist, ist `1`. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Kein Tippen, keine Schritte, kein Fokus. `disabled:`-Klassen gelten für das Zahlenfeld und seine Teile. |
| `readonly` | `.readonly(..)` | `boolean` | `false` | Der Text kann markiert und kopiert, aber weder durch Tippen noch durch Schritte geändert werden. Die Buttons sind deaktiviert. |
| `placeholder` | `.placeholder(..)` | `string` | keiner | Wird angezeigt, solange das Feld leer ist. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | keiner | Was Screenreader für das Feld ansagen, wenn kein sichtbares Label es benennt. |
| `controlsRight` | `.controls_right(..)` | `boolean` | `false` | Beide Buttons in einer Spalte rechts vom Feld, der Button zum Erhöhen über dem zum Verringern. Wird beim Erzeugen des Zahlenfeldes gelesen. |
| `inputClass`, `inputStyle` | `.input_style(\|s\| ..)` | `string`, `StyleProp<InputStyle>` | keiner | Das Feld: seine Box und sein Text (`color`, `fontSize`, `textAlign`, `placeholderColor`, `caretColor`). |
| `decrementButtonClass`, `decrementButtonStyle` | `.decrement_button_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | keiner | Der Button zum Verringern. |
| `incrementButtonClass`, `incrementButtonStyle` | `.increment_button_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | keiner | Der Button zum Erhöhen. |
| `decrementButton`, `incrementButton` | `.decrement_button(..)`, `.increment_button(..)` | `JSX.Element` | keiner | Der Inhalt der Buttons: ein Zeichen, ein Icon. |
| `controlsClass`, `controlsStyle` | `.controls_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | keiner | Die Spalte, die beide Buttons mit `controlsRight` enthält. |
| `prefix` | `.prefix(..)` | `JSX.Element` | keiner | Was vor dem Feld steht, nach dem Button auf seiner linken Seite: ein Währungszeichen, ein Icon. |
| `suffix` | `.suffix(..)` | `JSX.Element` | keiner | Was auf das Feld folgt, vor den Buttons auf seiner rechten Seite: eine Einheit, eine Währung. |
| `class`, `style` | Style-Methoden | `string`, `StyleProp<ViewStyle>` | keiner | Das Zahlenfeld selbst: die Zeile um das Feld und die Buttons. |

<a id="events"></a>

## Ereignisse

| Ereignis | Rust | Payload | Wann |
|---|---|---|---|
| `onChange` | `.on_change(\|value: &Option<f64>\| ..)` | `{ value: number \| null }` | Die Zahl, als die das Feld gelesen wird, hat sich geändert (Tippen, ein Schritt, Erhöhen oder Verringern durch einen Screenreader, das Feld wurde mit einem Wert außerhalb des Bereichs verlassen). |
| `onSubmit` | `.on_submit(\|value: &Option<f64>\| ..)` | `{ value: number \| null }` | Return / Enter im Feld: der Wert, auf `min` und `max` begrenzt. |
| `onFocus` | `.on_focus(..)` | keiner | Das Feld hat den Tastaturfokus erhalten. |
| `onBlur` | `.on_blur(..)` | keiner | Das Feld hat den Tastaturfokus verloren (sein Wert wurde zuvor auf `min` und `max` begrenzt). |

<a id="parts"></a>

## Teile

| Teil | Enthalten in | Gestaltet mit |
|---|---|---|
| Das Zahlenfeld | | `class`, `style` |
| Der Button zum Verringern | dem Zahlenfeld, als Erstes (mit `controlsRight`: der Spalte mit den Buttons, als Zweites) | `decrementButtonClass`, `decrementButtonStyle`; sein Inhalt `decrementButton` |
| Das Feld | dem Zahlenfeld | `inputClass`, `inputStyle` |
| Das Präfix | dem Zahlenfeld, vor dem Feld | eigenen Elementen (`prefix`) |
| Das Suffix | dem Zahlenfeld, nach dem Feld | eigenen Elementen (`suffix`) |
| Der Button zum Erhöhen | dem Zahlenfeld, als Letztes (mit `controlsRight`: der Spalte mit den Buttons, als Erstes) | `incrementButtonClass`, `incrementButtonStyle`; sein Inhalt `incrementButton` |
| Die Spalte mit den Buttons | dem Zahlenfeld, als Letztes, mit `controlsRight` | `controlsClass`, `controlsStyle` |

Das Zahlenfeld ist eine Zeile, die die App anordnet: `flex-row` auf `class` und `flex-1` auf dem Feld, damit es den Platz erhält, den die Buttons übrig lassen. Zustände, die die Teile zeigen:

- Das Zahlenfeld: `focus-within:`, solange sein Feld bearbeitet wird (ein Ring um das gesamte Zahlenfeld), `disabled:`.
- Das Feld: `focus:`, solange es bearbeitet wird, `disabled:`.
- Ein Button: `hover:` unter dem Zeiger, `active:` während er gedrückt wird, `disabled:`, solange das Zahlenfeld deaktiviert oder schreibgeschützt ist und wo ein Schritt nichts bewirken würde (das Verringern bei `min`, das Erhöhen bei `max`). Setzen Sie das Hover hinter `enabled:` (`enabled:hover:bg-accent`), damit ein deaktivierter Button nicht aufleuchtet.

Die Bewegung der Zustände ist Sache der App (`transition-colors`), und `motion-reduce:` hält sie für Menschen still, die weniger Bewegung wünschen.

<a id="keyboard"></a>

## Tastatur

Solange das Feld bearbeitet wird, nimmt das Zahlenfeld die Tasten des WAI-ARIA-Spin-Buttons an, die sich bei gedrückter Taste wiederholen:

| Taste | Bewirkt |
|---|---|
| Up | Einen Schritt nach oben. |
| Down | Einen Schritt nach unten. |
| Page Up, Page Down | Zehn Schritte nach oben oder unten. |

Home und End bleiben die des Feldes: Sie bewegen den Cursor im Text. Die Buttons sind keine Haltepunkte des Tastaturfokus: Tab führt vom Feld zu dem, was auf das Zahlenfeld folgt, und ein Druck auf einen Button belässt den Fokus im Feld (auf Desktops verschiebt ein Druck den Fokus auf das Feld, wenn er woanders war; auf Touchscreens belässt er ihn, damit keine Tastatur erscheint).

<a id="accessibility"></a>

## Barrierefreiheit

- Das Feld ist ein Spin-Button (`"spinbutton"`) mit seinem Label, seinem Wert (die Zahl, als die es gelesen wird, zwischen `min` und `max`) und seinem Text.
- Die Aktionen eines Screenreaders zum Erhöhen und Verringern (bei VoiceOver das Wischen nach oben und unten) ändern den Wert schrittweise, so wie Up und Down.
- Die Buttons sind vor Screenreadern verborgen, wie die eines Zahlenfeldes im Browser: Das Erhöhen und Verringern des Feldes selbst ändert den Wert schrittweise.
- Solange `disabled` gilt, sagen Screenreader, dass das Feld abgeblendet ist.

Siehe [Barrierefreiheit](../docs/accessibility.md) für Labels, Rollen und Aktionen im Allgemeinen.

<a id="platform-notes"></a>

## Hinweise zu Plattformen

- Das Feld ist das Textfeld der Plattform ([Input](./input.md)): Tastatur, Cursor, Auswahl, Kopieren und Einfügen sowie Eingabemethoden sind die des Systems. Smartphones zeigen eine Dezimaltastatur, mit Vorzeichen, wenn `min` kleiner als 0 oder nicht gesetzt ist.
- Jede Plattform zeichnet, was die App gestaltet. Up / Down und Page Up / Page Down erreichen das Zahlenfeld auf jeder Plattform von einer Hardware-Tastatur.
