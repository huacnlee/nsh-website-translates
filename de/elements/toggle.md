---
title: "Toggle"
description: "Toggle und ToggleGroup: eine Schaltfläche, die ein- oder ausgeschaltet ist, und eine Symbolleiste aus solchen Schaltflächen. Jeder Toggle übernimmt Klicks, die Aktivierung per Tastatur, den deaktivierten Zustand sowie seine Rolle und seinen gedrückten Zustand für Screenreader; die Gruppe ist eine Symbolleiste mit nur einem Haltepunkt für den Tastaturfokus; das Aussehen und die Frage, welche Toggles gedrückt sind, liegen bei der App."
group: base
demo: el-toggle
source_hash: d8d3727dd9d04426
---


# Toggle

Ein Toggle ist eine Schaltfläche, die an oder aus bleibt: Fett in einer Text-Toolbar, ein Favoriten-Stern, eine Ansichtsoption. `Toggle` übernimmt das Verhalten eines Toggles: Drücken, Aktivierung per Tastatur, den deaktivierten Zustand und die Button-Rolle mit ihrem gedrückten Zustand für Screenreader, die ihn als Umschaltfläche ansagen. Eine `ToggleGroup` um mehrere Toggles ist eine Toolbar: Screenreader sagen sie als solche an, die Tastatur erreicht sie in einem Halt und wechselt mit den Pfeiltasten zwischen ihren Toggles. Das Aussehen liegt bei der App: Ein Toggle hat keine eigenen Farben, Größen, Icons oder Labels. Seine Kinder sind das Icon oder Label der App, und `aria-pressed:`-Klassen am Toggle oder `group-aria-pressed:`-Klassen auf seinem Inhalt folgen seinem Zustand.

```rust tabs
use nsh_base::{theme, toggle, toggle_group};
use nsh_core::prelude::*;

fn formatting() -> impl IntoElement {
    let bold = signal(true);
    let italic = signal(false);
    let item = move |label: &'static str, on: Signal<bool>| {
        toggle()
            .pressed(on)
            .accessibility_label(label)
            .on_change(move |pressed: &bool| on.set(*pressed))
            .size_8()
            .items_center()
            .justify_center()
            .rounded(move || theme().radius)
            .pressed_style(|s| s.bg(move || theme().accent))
            .child(text(&label[..1]).text_sm().text_color(move || {
                if on.get() { theme().accent_foreground } else { theme().muted_foreground }
            }))
    };
    toggle_group()
        .flex_row()
        .self_start()
        .gap_1()
        .child(item("Bold", bold))
        .child(item("Italic", italic))
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { Toggle, ToggleGroup } from "nsh/base";

function App() {
  const marks = signal<string[]>(["bold"]);
  const item = (value: string, label: string) => (
    <Toggle
      pressed={marks().includes(value)}
      accessibilityLabel={label}
      onChange={({ pressed }) =>
        marks.set(pressed ? [...marks(), value] : marks().filter((m) => m !== value))
      }
      class="group size-8 items-center justify-center rounded-(--radius) aria-pressed:bg-accent"
    >
      <Text class="text-sm text-muted-foreground group-aria-pressed:text-accent-foreground">{label[0]}</Text>
    </Toggle>
  );
  return (
    <ToggleGroup class="flex-row self-start gap-1">
      {item("bold", "Bold")}
      {item("italic", "Italic")}
    </ToggleGroup>
  );
}

mount(App);
```

`Toggle` und `ToggleGroup` stammen aus [`nsh/base`](../modules/nsh-base.md), dem `nsh-base`-Crate in Rust. Der Wert gehört der App: Jedem Toggle wird mitgeteilt, ob er gedrückt ist, ein Druck meldet den gewünschten Wert mit `onChange`, und der Toggle zeigt, was die App als `pressed` zurückgibt. Auch die Gruppe hält keinen Wert, daher entscheidet ebenfalls die App, wie viele Toggles gedrückt sein dürfen: beliebig viele (Fett, Kursiv und Unterstrichen) oder genau einer (eine Ausrichtung, ein View-Umschalter). Dann drückt die App den angeforderten Toggle, lässt die anderen los und hält den gedrückten gedrückt. In Rust erzeugen `toggle()` und `toggle_group()` sie, mit einem Setter pro Prop (`.pressed(..)`), einem Listener pro Ereignis (`.on_change(..)`), den typisierten Style-Methoden und `.child(..)` für ihren Inhalt.

## Props

### Toggle

| Prop | Rust | Typ | Standard | Beschreibung |
|---|---|---|---|---|
| `pressed` | `.pressed(..)` | `boolean` | `false` | An oder aus: Screenreader sagen, dass er gedrückt ist, und `aria-pressed:`-Stile greifen. Ein Druck meldet den anderen Wert mit `onChange`; der Toggle zeigt den Wert, den die App zurückgibt. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Keine Drücke und kein Feedback beim Drücken; `disabled:`-Stile greifen, und Screenreader sagen, dass er abgeblendet ist. Ein Toggle in einer deaktivierten `ToggleGroup` ist ebenfalls deaktiviert. |
| `pressedStyle` | `.pressed_style(\|s\| ..)` | `StyleProp<ViewStyle>` | keine | Der Stil des Toggles im gedrückten, nicht deaktivierten Zustand, als `aria-pressed:`-Klassen. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | keine | Was Screenreader ansagen: was der Toggle einschaltet, wenn seine Kinder keinen Text enthalten, der das sagt (ein Icon). |
| `hitSlop` | `.hit_slop(..)` | `number \| Partial<Edges>` | keine | Wie weit außerhalb seiner Grenzen Drücke noch zählen, in Punkten: eine Zahl für alle Seiten oder die benannten Seiten. Wie `hitSlop` einer View. |
| `children` | `.child(..)` | `JSX.Element` | keine | Das Icon oder Label der App, das Screenreader ansagen. |
| `class`, `style` | Style-Methoden | `string`, `StyleProp<ViewStyle>` | keine | Der Toggle selbst: die Fläche um seinen Inhalt. |
| `activeStyle`, `hoverStyle`, `focusStyle`, `disabledStyle` | `.active(\|s\| ..)`, `.hover(..)`, `.focus(..)`, `.disabled_style(..)` | `StyleProp<ViewStyle>` | keine | Der Stil des Toggles, während ein Druck läuft, bei Hover, bei Fokus oder wenn er deaktiviert ist, als `<state>:`-Klassen. |

### ToggleGroup

| Prop | Rust | Typ | Standard | Beschreibung |
|---|---|---|---|---|
| `disabled` | `.disabled(..)` | `boolean` | `false` | Jeder Toggle der Gruppe ist deaktiviert, unabhängig von seinem eigenen `disabled`. |
| `children` | `.child(..)` | `JSX.Element` | keine | Die Toggles der Gruppe und alles, was die App dazwischen anordnet (ein Trenner). |
| `class`, `style` | Style-Methoden | `string`, `StyleProp<ViewStyle>` | keine | Layout und Aussehen der Gruppe: standardmäßig eine Spalte, `flex-row` für eine Zeile. |

<a id="events"></a>

## Ereignisse

| Ereignis | Rust | Beschreibung |
|---|---|---|
| `onChange` (`Toggle`) | `.on_change(\|pressed: &bool\| ..)` | Der Toggle wurde gedrückt: ein Tippen, ein Klick, Leertaste oder Return bei Tastaturfokus oder die Aktivierung durch einen Screenreader. `{ pressed }` ist der gewünschte Wert, das Gegenteil von `pressed`. Das Ereignis wird ausgelöst, bevor sich etwas ändert: Der Toggle zeigt, was die App als `pressed` zurückgibt. |

Eine Pfeiltaste in einer `ToggleGroup` bewegt nur den Tastaturfokus: Sie drückt nichts. Ein deaktivierter Toggle meldet nichts.

<a id="parts"></a>

## Bestandteile

| Bestandteil | Enthalten in | Gestaltet mit | Zustände |
|---|---|---|---|
| Die Gruppe | | `class`, `style` von `ToggleGroup` | |
| Der Toggle | der Gruppe oder überall | `class`, `style` von `Toggle` | `aria-pressed:`, `disabled:`, `active:`, `hover:`, `focus:` (oder `pressedStyle`, `disabledStyle`, ...) |
| Das Icon oder Label | der Toggle | eigene Elemente (`children`) | `group-aria-pressed:`, `group-disabled:` und die anderen `group-*:`-Varianten mit `group` auf dem `class` des Toggles |

`aria-pressed:` bedeutet, dass der Toggle an ist; `active:` ist ein laufender Druck, an oder aus. Zeige einen gedrückten Toggle über seine eigene Fläche: eine Füllung, eine erhabene Pille, ein kräftigeres Icon (siehe [Design-Leitfäden](../docs/design-guides.md#interaction-states)).

<a id="segmented"></a>

## Segmentiert

Eine Gruppe, deren Toggles verbunden sind und von denen jeweils einer gedrückt ist, ist ein segmentiertes Steuerelement (ein View-Umschalter): Die App hält einen Wert und drückt den Toggle, der ihn benennt. Das verbundene Aussehen sind die Klassen der App:

```tsx
<ToggleGroup class="flex-row self-start">
  <Each of={["grid", "list"]}>
    {(value) => (
      <Toggle
        pressed={view() === value()}
        accessibilityLabel={`${value()} view`}
        onChange={({ pressed }) => pressed && view.set(value())}
        class="-ml-px h-8 px-3 border border-border first:ml-0 first:rounded-l-(--radius) last:rounded-r-(--radius) aria-pressed:bg-accent"
      >
        <Text class="text-sm">{value()}</Text>
      </Toggle>
    )}
  </Each>
</ToggleGroup>
```

<a id="disabled"></a>

## Deaktiviert

Ein deaktivierter Toggle nimmt keine Drücke an, und Screenreader sagen ihn als abgeblendet an. Seine `disabled:`-Klassen haben Vorrang vor seinen `aria-pressed:`-Klassen, und `group-disabled:`-Klassen darin folgen ihm. `disabled` an einer `ToggleGroup` deaktiviert jeden Toggle darin, eine von der App gesperrte Toolbar:

```tsx
<ToggleGroup disabled={readonly()} class="flex-row gap-1">
  <Toggle pressed={bold()} onChange={({ pressed }) => bold.set(pressed)} class="size-8 disabled:opacity-50">
    <Text>B</Text>
  </Toggle>
</ToggleGroup>
```

<a id="a-small-target-with-hitslop"></a>

## Ein kleines Ziel mit hitSlop

Ein Icon-Toggle kann kleiner sein als ein Finger. `hitSlop` lässt Drücke in seiner Nähe zählen, in Punkten über jede Seite hinaus, ohne sein Layout oder sein Aussehen zu ändern: eine Zahl für alle Seiten oder die benannten Seiten (`{ top: 8, bottom: 8 }`), so wie [`hitSlop` einer View](./index.md#presses-and-feedback) sie annimmt.

```tsx
<Toggle
  pressed={favorite()}
  hitSlop={12}
  accessibilityLabel="Favorite"
  onChange={({ pressed }) => favorite.set(pressed)}
  class="size-5 items-center justify-center"
>
  <Text>★</Text>
</Toggle>
```

<a id="accessibility"></a>

## Barrierefreiheit

- Ein Toggle ist für Screenreader ein einzelnes Element mit der Rolle `"button"` und seinem gedrückten Zustand: eine Umschaltfläche. Sein Label ist der Text seiner Kinder oder `accessibilityLabel`.
- `ToggleGroup` hat die Rolle `"toolbar"`: Screenreader hören die Toggles darin als eine Toolbar, jeder weiterhin ein eigenes Element.
- `disabled` wird so angesagt, wie die Plattform es ansagt (VoiceOver, TalkBack, UI Automation, der Accessibility-Baum des Browsers).
- Unter macOS und im Web ist die Gruppe ein Halt des Tastaturfokus, und die Pfeiltasten wechseln zwischen ihren Toggles (siehe unten).

Siehe [Barrierefreiheit](../docs/accessibility.md) für Labels, Rollen und Ansagen im Allgemeinen.

<a id="keyboard"></a>

## Tastatur

Unter macOS und im Web, wo Tab die Views erreicht, die Drücke annehmen, folgt eine `ToggleGroup` dem [WAI-ARIA-Toolbar-Muster](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/):

| Taste | Wirkung |
|---|---|
| Tab, Shift+Tab | Betritt die Gruppe beim ersten gedrückten Toggle (beim ersten nicht deaktivierten Toggle, falls keiner gedrückt ist) und verlässt sie in einem Schritt. |
| Pfeil rechts, Pfeil unten | Bewegt den Fokus zum nächsten Toggle, vom letzten zum ersten. |
| Pfeil links, Pfeil oben | Bewegt den Fokus zum vorherigen Toggle, vom ersten zum letzten. |
| Pos1, Ende | Bewegt den Fokus zum ersten oder zum letzten Toggle. |
| Leertaste, Return | Drückt den fokussierten Toggle. |

Die Pfeiltasten überspringen deaktivierte Toggles und drücken nichts: Ein Toggle ändert sich nur, wenn er gedrückt wird. Beide Pfeilpaare bewegen den Fokus, unabhängig vom Layout der Gruppe, das Sache der Klassen der App ist. In einem Rechts-nach-links-Layout tauschen Pfeil links und Pfeil rechts die Plätze: Pfeil links bewegt zum nächsten Toggle und Pfeil rechts zum vorherigen; Pfeil oben, Pfeil unten, Pos1 und Ende behalten ihre Bedeutung. `focus:`-Stile zeigen, wo der Fokus liegt. Ein `Toggle`
außerhalb einer `ToggleGroup` ist ein eigener Halt.

<a id="platform-notes"></a>

## Hinweise zu Plattformen

- iOS, Android und Mac Catalyst: Ein Druck ist ein Tippen, das auf dem Toggle endet, einschließlich seines Inhalts.
- Desktops (macOS, Windows, Linux, GPUI) und das Web: Ein Druck ist ein Klick. Unter macOS und im Web drücken außerdem Leertaste und Return den Toggle mit Tastaturfokus, und die Pfeiltasten, Pos1 und Ende bewegen den Fokus ([Tastatur](#keyboard)).
- Jede Plattform zeichnet, was die App gestaltet: die Toggles, die Fläche der gedrückten Toggles und die Spur der Gruppe.
