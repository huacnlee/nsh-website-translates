---
title: "Toolbar"
description: "Toolbar, ToolbarGroup und ToolbarSeparator: eine Leiste aus Buttons, Toggles und Links, die einen einzelnen Haltepunkt des Tastaturfokus bildet und deren Pfeiltasten sich entlang der Leiste bewegen, mit benannten Gruppen und Trennlinien. Das Aussehen und der Zustand der einzelnen Steuerelemente liegen bei der App."
group: base
demo: el-toolbar
source_hash: 4c5547977ec8d003
---


# Toolbar

Eine Toolbar ist eine Leiste mit Steuerelementen: die Formatierung eines Texteditors, die Transportsteuerung eines Mediaplayers, eine vertikale Palette von Werkzeugen.
`Toolbar` verwaltet die Tastatur und die Semantik einer solchen Leiste: Screenreader kündigen eine Toolbar an (benannt durch ihr
`accessibilityLabel`), und die Tastatur erreicht sie in einem einzigen Stopp und bewegt sich zwischen ihren Elementen mit den Pfeiltasten ihres
`axis`. Ihre Elemente sind die `Button`, `Toggle` und `Link` darin, in beliebiger Tiefe. Eine `ToolbarGroup` ist eine benannte Folge
zusammengehöriger Elemente (Rückgängig und Wiederholen, die Ausrichtung), und ein `ToolbarSeparator` eine Linie, die die App zwischen den Folgen zeichnet. Das Aussehen
bestimmt die App: Die Toolbar hat keine eigenen Farben, Innenabstände oder Lücken, und jedes Steuerelement behält seinen eigenen Zustand.

```rust tabs
use nsh_base::{button, theme, toggle, toolbar, toolbar_group, toolbar_separator};
use nsh_core::prelude::*;

fn formatting() -> impl IntoElement {
    let bold = signal(false);
    toolbar()
        .accessibility_label("Formatting")
        .items_center()
        .gap_1()
        .child(
            toolbar_group()
                .accessibility_label("History")
                .child(button().accessibility_label("Undo").size_8().child(text("↶")))
                .child(button().accessibility_label("Redo").size_8().child(text("↷"))),
        )
        .child(toolbar_separator().w(px(1.0)).h_5().bg(move || theme().border))
        .child(
            toggle()
                .pressed(bold)
                .accessibility_label("Bold")
                .on_change(move |pressed: &bool| bold.set(*pressed))
                .size_8()
                .items_center()
                .justify_center()
                .pressed_style(|s| s.bg(move || theme().accent))
                .child(text("B")),
        )
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { Button, Toggle, Toolbar, ToolbarGroup, ToolbarSeparator } from "nsh/base";

function App() {
  const bold = signal(false);
  return (
    <Toolbar accessibilityLabel="Formatting" class="items-center gap-1 self-start rounded-lg bg-muted p-1">
      <ToolbarGroup accessibilityLabel="History">
        <Button accessibilityLabel="Undo" class="size-8 items-center justify-center rounded-md hover:bg-accent">
          <Text>↶</Text>
        </Button>
        <Button accessibilityLabel="Redo" class="size-8 items-center justify-center rounded-md hover:bg-accent">
          <Text>↷</Text>
        </Button>
      </ToolbarGroup>
      <ToolbarSeparator class="h-5 w-px bg-border" />
      <Toggle
        pressed={bold()}
        accessibilityLabel="Bold"
        onChange={({ pressed }) => bold.set(pressed)}
        class="size-8 items-center justify-center rounded-md aria-pressed:bg-accent"
      >
        <Text>B</Text>
      </Toggle>
    </Toolbar>
  );
}

mount(App);
```

`Toolbar`, `ToolbarGroup` und `ToolbarSeparator` stammen aus [`nsh/base`](../modules/nsh-base.md), dem `nsh-base`-Crate
in Rust. Die Toolbar hält keinen Wert: Ein Toggle darin erfährt, ob er gedrückt ist, und meldet `onChange`, ein
Button meldet `onPress`, und die App hält den Zustand. In Rust erzeugen `toolbar()`, `toolbar_group()` und
`toolbar_separator()` sie, mit einem Setter pro Prop (`.axis(..)`, `.disabled(..)`), den typisierten Style-Methoden und
`.child(..)` für ihren Inhalt.

## Props

### Toolbar

| Prop | Rust | Typ | Standard | Beschreibung |
|---|---|---|---|---|
| `axis` | `.axis(..)` | `"horizontal" \| "vertical"` | `"horizontal"` | Die Richtung, in der ihre Elemente verlaufen: die Pfeiltasten, die entlang dieser Richtung bewegen (Links und Rechts oder Oben und Unten), und die Richtung, in der sie ihre Kinder anordnet (eine Zeile oder eine Spalte). Wird gelesen, wenn die Toolbar erzeugt wird. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Jedes Element der Toolbar ist deaktiviert, unabhängig von seinem eigenen `disabled`: keine Betätigungen, kein Stopp des Tastaturfokus, für Screenreader abgedunkelt. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | keine | Wie Screenreader die Toolbar nennen („Formatierung"), für eine Seite mit mehr als einer. |
| `children` | `.child(..)` | `JSX.Element` | keine | Die Elemente, ihre Gruppen und Trenner sowie alles, was die App sonst dazwischen anordnet (ein Titel, ein Platzhalter, ein Eingabefeld). |
| `class`, `style` | Style-Methoden | `string`, `StyleProp<ViewStyle>` | keine | Layout und Aussehen der Leiste: Ausrichtung, Lücken, Innenabstand, ihre Oberfläche. |

### ToolbarGroup

| Prop | Rust | Typ | Standard | Beschreibung |
|---|---|---|---|---|
| `disabled` | `.disabled(..)` | `boolean` | `false` | Jedes Element der Gruppe ist deaktiviert, unabhängig von seinem eigenen `disabled`. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | keine | Wie Screenreader die Gruppe nennen („Verlauf", „Ausrichtung"). |
| `children` | `.child(..)` | `JSX.Element` | keine | Die Elemente der Gruppe und alles, was die App sonst dazwischen anordnet. |
| `class`, `style` | Style-Methoden | `string`, `StyleProp<ViewStyle>` | keine | Layout und Aussehen der Gruppe. Sie verläuft entlang der Achse der Toolbar. |

### ToolbarSeparator

| Prop | Rust | Typ | Standard | Beschreibung |
|---|---|---|---|---|
| `class`, `style` | Style-Methoden | `string`, `StyleProp<ViewStyle>` | keine | Die Linie: eine Haarlinie quer zu einer Zeile (`h-5 w-px bg-border`) oder einer Spalte (`h-px self-stretch bg-border`). |

<a id="items"></a>

## Elemente

Die Elemente einer Toolbar sind die `Button`, `Toggle` und `Link` darin, in ihren Gruppen und ebenso in einem
[`ToggleGroup`](./toggle.md) darin. Auch der Trigger eines [`Menu`](./menu.md) oder eines [`Popover`](./popover.md) ist ein
Element: die View in seinem `trigger`-Slot, der das Popup seine Betätigungen, seinen Fokus und seinen `expanded`-Zustand gibt. Ein
Werkzeug, das die App selbst zeichnet, ist ein `Button` mit den Klassen der App: Ein `Button` hat kein eigenes Aussehen, es sieht also so aus,
wie die App es gestaltet, und ist ein Element (ein `View` mit `onPress` bleibt ein eigener Stopp, außerhalb der Pfeiltasten). Ein
`ToggleGroup` in einer Toolbar ist eine ihrer Gruppen: Seine Toggles sind die Elemente der Toolbar, Screenreader lesen eine Gruppe vor,
und sein `disabled` deaktiviert weiterhin seine eigenen Toggles. Andere Steuerelemente (ein `Input`, ein `Select`, ein `Slider`) bleiben eigene Stopps und
behalten ihre Pfeiltasten; platziere sie am Ende der Leiste. Was ein Popup zeigt, das ein Element öffnet (die Felder und Buttons eines Popovers, die Elemente eines Menüs, die Links einer Hover-Card), gehört nicht zur Toolbar. Die Pfeiltasten durchlaufen die Elemente in der Reihenfolge, in der die
Leiste sie anordnet, egal wie tief jedes liegt, und ein Element, das die App später einblendet, nimmt seinen Platz unter ihnen ein.

<a id="parts"></a>

## Teile

| Teil | Enthalten in | Gestaltet mit | Zustände |
|---|---|---|---|
| Die Leiste | | `Toolbar`: `class`, `style` | |
| Eine Gruppe | die Leiste | `ToolbarGroup`: `class`, `style` | |
| Ein Trenner | die Leiste, eine Gruppe | `ToolbarSeparator`: `class`, `style` | |
| Ein Element | die Leiste, eine Gruppe | `class`, `style` des Elements selbst | seine eigenen: `aria-pressed:`, `disabled:`, `hover:`, `focus:`, `active:` |

Zeige das Element, auf dem die Tastatur steht, mit `focus:`-Styles, und einen gedrückten Toggle über seine eigene Oberfläche (siehe
[Design-Leitfäden](../docs/design-guides.md#interaction-states)).

<a id="vertical"></a>

## Vertikal

Eine Palette von Werkzeugen ist eine Spalte: `axis="vertical"` ordnet die Elemente von oben nach unten an, und Oben und Unten bewegen entlang ihnen.

```tsx
<Toolbar axis="vertical" accessibilityLabel="Tools" class="gap-1 self-start rounded-lg bg-muted p-1">
  <Each of={["select", "pen", "shape", "text"]}>
    {(t) => (
      <Toggle
        pressed={tool() === t()}
        accessibilityLabel={t()}
        onChange={({ pressed }) => pressed && tool.set(t())}
        class="size-8 items-center justify-center rounded-md aria-pressed:bg-accent"
      >
        <Text>{t()[0].toUpperCase()}</Text>
      </Toggle>
    )}
  </Each>
</Toolbar>
```

<a id="disabled"></a>

## Deaktiviert

`disabled` an einer Toolbar deaktiviert jedes Element darin, eine von der App gesperrte Leiste; an einer Gruppe deaktiviert es deren Elemente. Ein deaktiviertes Element
nimmt keine Betätigungen entgegen, die Pfeiltasten überspringen es, und Screenreader kündigen es als abgedunkelt an:

```tsx
<Toolbar disabled={readonly()} accessibilityLabel="Review" class="flex-row gap-1">
  <Button onPress={approve} class="h-8 px-3 disabled:opacity-50">
    <Text>Approve</Text>
  </Button>
</Toolbar>
```

<a id="accessibility"></a>

## Barrierefreiheit

- `Toolbar` hat die Rolle `"toolbar"`, benannt durch `accessibilityLabel`; seine Elemente bleiben eigene Elemente. Unter iOS ist die
  Toolbar eine semantische Gruppe, in die VoiceOver hineingeht.
- `ToolbarGroup` hat die Rolle `"group"`, benannt durch ihr `accessibilityLabel`, sodass eine Folge von Elementen als eine Einheit vorgelesen wird. Eine
  `ToggleGroup` in einer Toolbar ist ebenfalls eine Gruppe.
- `ToolbarSeparator` ist für Screenreader kein Element.
- `disabled` wird so angekündigt, wie die Plattform es ankündigt (VoiceOver, TalkBack, UI Automation, der Accessibility-Tree
  des Browsers).

Siehe [Barrierefreiheit](../docs/accessibility.md) für Labels, Rollen und Ankündigungen im Allgemeinen.

<a id="keyboard"></a>

## Tastatur

Unter macOS und im Web, wo Tab die Views erreicht, die Betätigungen entgegennehmen, folgt eine `Toolbar` dem
[WAI-ARIA-Toolbar-Muster](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/):

| Taste | Wirkung |
|---|---|
| Tab, Shift+Tab | Betritt die Toolbar bei dem Element, das der Fokus zuletzt verlassen hat (zunächst das erste Element, das nicht deaktiviert ist), und verlässt sie in einem Schritt. |
| Rechts, Links (`axis="horizontal"`) | Bewegt den Fokus zum nächsten oder zum vorherigen Element, vom letzten zum ersten und zurück. |
| Unten, Oben (`axis="vertical"`) | Bewegt den Fokus zum nächsten oder zum vorherigen Element, vom letzten zum ersten und zurück. |
| Pos1, Ende | Bewegt den Fokus zum ersten oder zum letzten Element. |
| Leertaste, Return | Betätigt das fokussierte Element. |

Die Pfeiltasten überspringen deaktivierte Elemente und betätigen nichts: Ein Toggle ändert sich nur, wenn er betätigt wird. Das andere Paar
Pfeiltasten bleibt den Elementen überlassen (der Trigger eines Menüs öffnet sein Menü mit Unten). In einem Rechts-nach-links-Layout verläuft eine horizontale
Toolbar von rechts, sodass Links zum nächsten Element und Rechts zum vorherigen bewegt; eine vertikale behält Unten und
Oben bei.

<a id="platform-notes"></a>

## Hinweise zu Plattformen

- iOS, Android und Mac Catalyst: Jedes Element wird mit einem Tippen betätigt; die Toolbar ist eine Gruppe, die Screenreader ankündigen.
- Desktops (macOS, Windows, Linux, GPUI) und das Web: Eine Betätigung ist ein Klick. Unter macOS und im Web ist die Toolbar ein einziger Stopp
  von Tab, und die Pfeiltasten, Pos1 und Ende bewegen zwischen ihren Elementen ([Tastatur](#keyboard)).
- Jede Plattform zeichnet, was die App gestaltet: die Leiste, ihre Gruppen, ihre Trenner und ihre Elemente.
