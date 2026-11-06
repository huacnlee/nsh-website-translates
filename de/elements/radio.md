---
title: "Radio"
description: "Radio und RadioGroup: eine Gruppe von Optionen, aus denen der Nutzer genau eine auswählt. Jedes Radio verwaltet Eingaben per Tippen oder Klick, die Tastaturaktivierung, den deaktivierten Zustand sowie seine Rolle und seinen Checked-Status für Screenreader; die Gruppe ist die Menge der Optionen; das Erscheinungsbild und der Wert liegen bei der App."
group: base
demo: el-radio
source_hash: 051314109ae3d0b2
---


# Radio

Radios bieten eine Menge von Optionen, von denen der Nutzer genau eine wählt: einen Tarif, eine Sortierreihenfolge, ein Theme. Jedes `Radio` übernimmt das Verhalten einer Option: Drücken, Tastaturaktivierung, den deaktivierten Zustand sowie die Radio-Rolle und ihren Checked-Zustand für Screenreader. Eine `RadioGroup` um die Radios herum bildet die Menge, die Screenreader als eine Gruppe ansagen. Das Aussehen gehört der App: Ein Radio hat selbst keinen Kreis, keinen Punkt, keine Farben, Größen oder Beschriftung. Seine Kinder sind der Indikator und das Label der App, und `checked:`-Klassen am Radio oder `group-checked:`-Klassen auf dem, was darin liegt, folgen seinem Zustand.

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

`Radio` und `RadioGroup` stammen aus [`nsh/base`](../modules/nsh-base.md), dem `nsh-base`-Crate in Rust. Der Wert gehört der App: Die Gruppe hält keinen. Jedes Radio erfährt, ob es ausgewählt ist; ein Druck auf ein nicht ausgewähltes Radio meldet `onChange({ checked: true })`, die App setzt ihren Wert, und jedes Radio zeigt das `checked`, das die App zurückgibt. In Rust erzeugen `radio()` und `radio_group()` sie, mit einem Setter pro Prop (`.checked(..)`), einem Listener pro Event (`.on_change(..)`), den typisierten Style-Methoden und `.child(..)` für ihren Inhalt.

## Props

### Radio

| Prop | Rust | Typ | Standard | Beschreibung |
|---|---|---|---|---|
| `checked` | `.checked(..)` | `boolean` | `false` | Ausgewählt oder nicht. Ein Druck auf ein nicht ausgewähltes Radio meldet `true` mit `onChange`; das Radio zeigt den Wert, den die App zurückgibt. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Keine Drücke und kein Druck-Feedback; `disabled:`-Styles greifen, und Screenreader sagen, dass es abgeblendet ist. |
| `checkedStyle` | `.checked_style(\|s\| ..)` | `StyleProp<ViewStyle>` | keine | Der Style des Radios, solange es ausgewählt und nicht deaktiviert ist, als `checked:`-Klassen. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | keine | Was Screenreader sagen: die Option, wenn die Kinder keinen Text enthalten, der sie benennt. |
| `hitSlop` | `.hit_slop(..)` | `number \| Partial<Edges>` | keine | Wie weit außerhalb seiner Grenzen Drücke noch zählen, in Punkten: eine Zahl für alle Seiten oder die Seiten einzeln benannt. Wie bei `hitSlop` einer View. |
| `children` | `.child(..)` | `JSX.Element` | keine | Der Indikator und das Label der App, die Screenreader vorlesen. |
| `class`, `style` | Style-Methoden | `string`, `StyleProp<ViewStyle>` | keine | Das Radio selbst: die Zeile um den Indikator und das Label. |
| `activeStyle`, `hoverStyle`, `focusStyle`, `disabledStyle` | `.active(\|s\| ..)`, `.hover(..)`, `.focus(..)`, `.disabled_style(..)` | `StyleProp<ViewStyle>` | keine | Der Style des Radios, solange es gedrückt, überfahren, fokussiert oder deaktiviert ist, als die `<state>:`-Klassen. |

### RadioGroup

| Prop | Rust | Typ | Standard | Beschreibung |
|---|---|---|---|---|
| `children` | `.child(..)` | `JSX.Element` | keine | Die Radios der Menge und alles, was die App dazwischen anordnet. |
| `class`, `style` | Style-Methoden | `string`, `StyleProp<ViewStyle>` | keine | Layout und Aussehen der Gruppe: standardmäßig eine Spalte, `flex-row` für eine Zeile. |

## Events

| Event | Rust | Beschreibung |
|---|---|---|
| `onChange` (`Radio`) | `.on_change(\|checked: &bool\| ..)` | Ein nicht ausgewähltes Radio wurde gedrückt: durch Tippen, Klicken, Leertaste oder Return, während es den Tastaturfokus hat, oder durch die Aktivierung eines Screenreaders; oder eine Pfeiltaste seiner Gruppe hat den Tastaturfokus auf es bewegt. Es bittet darum, ausgewählt zu werden, daher ist `checked` gleich `true`. Das Event läuft, bevor sich etwas ändert: Das Radio zeigt das `checked`, das die App zurückgibt. |

Ein ausgewähltes Radio bleibt ausgewählt und meldet nichts, da ein Radio sich nicht selbst abwählen kann; ein deaktiviertes Radio meldet ebenfalls nichts.

<a id="parts"></a>

## Teile

| Teil | Enthalten in | Gestaltet mit | Zustände |
|---|---|---|---|
| Die Gruppe | | `RadioGroup`: `class`, `style` | |
| Das Radio | der Gruppe | `Radio`: `class`, `style` | `checked:`, `disabled:`, `active:`, `hover:`, `focus:` (oder `checkedStyle`, `disabledStyle`, ...) |
| Der Indikator und das Label | dem Radio | ihren eigenen Elementen (`children`) | `group-checked:`, `group-disabled:` und die anderen `group-*:`-Varianten mit `group` auf dem `class` des Radios |

Der Indikator ist der Inhalt der App: ein Ring mit Punkt, ein Häkchen, eine hervorgehobene Karte. Mit `group` auf dem `class` des Radios zeigen seine `group-checked:`-Klassen den Punkt, solange das Radio ausgewählt ist.

<a id="disabled"></a>

## Deaktiviert

Ein deaktiviertes Radio nimmt keine Drücke an, und Screenreader sagen es als abgeblendet an. Seine `disabled:`-Klassen gelten vor seinen `checked:`-Klassen, und `group-disabled:`-Klassen darin folgen:

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

## Ein kleines Ziel mit hitSlop

Ein Radio ohne Label daneben (ein Punkt in der Zeile einer Tabelle) kann kleiner sein als ein Finger. `hitSlop` lässt Drücke zählen, die in seiner Nähe landen, in Punkten über jede Seite hinaus, ohne sein Layout oder sein Aussehen zu ändern: eine Zahl für alle Seiten oder die Seiten einzeln benannt (`{ top: 8, bottom: 8 }`), so wie `hitSlop` einer [View](./index.md#presses-and-feedback) sie annimmt.

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

## Barrierefreiheit

- Ein Radio ist für Screenreader ein einzelnes Element mit der Rolle `"radio"` und seinem Zustand: ausgewählt oder nicht, und selected, solange es ausgewählt ist, da manche Screenreader das eine und manche das andere vorlesen (die Radios von UI Automation sind Auswahlelemente). Indikator und Label sind Teile davon; sein Label ist der Text seiner Kinder oder `accessibilityLabel`.
- Eine `RadioGroup` hat die Rolle `"radiogroup"`: Screenreader hören die Radios darin als eine Menge, jedes weiterhin als eigenes Element.
- `disabled` wird so angesagt, wie die Plattform es ansagt (VoiceOver, TalkBack, UI Automation, der Accessibility-Tree des Browsers).
- Unter macOS und im Web ist eine `RadioGroup` ein einziger Halt des Tastaturfokus, und die Pfeiltasten bewegen sich zwischen ihren Radios und wählen sie aus (siehe unten).

Siehe [Barrierefreiheit](../docs/accessibility.md) für Labels, Rollen und Ansagen im Allgemeinen.

<a id="keyboard"></a>

## Tastatur

Unter macOS und im Web, wo Tab die Views erreicht, die Drücke annehmen, folgt eine `RadioGroup` dem [WAI-ARIA-Radiogruppen-Muster](https://www.w3.org/WAI/ARIA/apg/patterns/radio/):

| Taste | Wirkung |
|---|---|
| Tab, Umschalt+Tab | Betritt die Gruppe beim ausgewählten Radio (beim ersten nicht deaktivierten Radio, solange keines ausgewählt ist) und verlässt sie in einem Schritt. |
| Runter, Rechts | Bewegt den Fokus zum nächsten Radio, vom letzten zum ersten, und wählt es aus. |
| Hoch, Links | Bewegt den Fokus zum vorherigen Radio, vom ersten zum letzten, und wählt es aus. |
| Leertaste | Wählt das fokussierte Radio aus. |

Die Pfeiltasten überspringen deaktivierte Radios; das Radio, zu dem sie wechseln, bittet mit `onChange` darum, ausgewählt zu werden, und die App wählt es aus. In einem Rechts-nach-links-Layout tauschen Links und Rechts die Plätze: Links wechselt zum nächsten Radio und Rechts zum vorherigen; Hoch und Runter behalten ihre. `focus:`-Styles zeigen, wo der Fokus liegt. Ein `Radio` außerhalb einer `RadioGroup` ist ein eigener Halt, den Tab erreicht und den Leertaste und Return auswählen.

<a id="platform-notes"></a>

## Plattformhinweise

- iOS, Android und Mac Catalyst: Ein Druck ist ein Tippen, das auf dem Radio endet, sein Label eingeschlossen.
- Desktops (macOS, Windows, Linux, GPUI) und das Web: Ein Druck ist ein Klick. Unter macOS und im Web wählen auch Leertaste und Return das Radio aus, das den Tastaturfokus hat, und die Pfeiltasten bewegen ihn ([Tastatur](#keyboard)).
- Jede Plattform zeichnet, was die App gestaltet: den Indikator, das Label und ihre Übergänge.
