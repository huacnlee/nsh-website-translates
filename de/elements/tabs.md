---
title: "Tabs"
description: "Tab und Tabs: die Tabs einer Tab-Liste und die Liste selbst. Jeder Tab verwaltet Eingaben per Klick oder Tipp, die Aktivierung per Tastatur, den deaktivierten Zustand sowie seine Rolle und seinen Auswahlstatus für Screenreader; die Liste ist die Gesamtheit der Tabs, mit einem Indikator, der dem ausgewählten Tab nativ folgt; das Erscheinungsbild, der Wert und der Inhalt, den jeder Tab anzeigt, liegen bei der App."
group: base
demo: el-tabs
source_hash: 31cec668d8fcf6ae
---


# Tabs

Tabs wechseln zwischen den Abschnitten eines Ortes: der Übersicht und der Aktivität eines Projekts, den Ansichten eines Dokuments.
Jedes `Tab` steuert das Verhalten eines Tabs: Drücken, Tastaturaktivierung, den deaktivierten Zustand sowie die Tab-Rolle und ihren ausgewählten Zustand für Screenreader. Ein `Tabs` darum herum ist die Tab-Liste, die Screenreader als eine Gruppe ansagen. Das Aussehen bestimmt die App: Ein Tab hat keine eigenen Farben, Größen oder Beschriftungen. Seine Kinder sind die Beschriftung der App, und `selected:`-Klassen am Tab oder `group-selected:`-Klassen auf dem, was darin liegt, folgen seinem Zustand. Auch der Inhalt jedes Abschnitts gehört der App: Sie zeigt neben der Liste den Abschnitt, den ihr Wert benennt. Der Indikator der Liste, eine Unterstreichung oder eine Pille, die die App gestaltet, sitzt auf dem ausgewählten Tab und wandert nativ zum nächsten ([Indikator](#indicator)).

```rust tabs
use nsh_base::{tab, tabs, theme};
use nsh_core::prelude::*;

fn sections() -> impl IntoElement {
    let section = signal("overview");
    let item = move |value: &'static str, label: &'static str| {
        let selected = move || section.get() == value;
        tab()
            .selected(selected)
            .on_press(move |_: &()| section.set(value))
            .rounded(move || theme().radius)
            .px_3()
            .py_2()
            .child(text(label).text_sm().text_color(move || {
                if selected() { theme().foreground } else { theme().muted_foreground }
            }))
    };
    view()
        .gap_4()
        .child(
            tabs()
                .flex_row()
                .self_start()
                .gap_1()
                .p_1()
                .rounded(move || theme().radius)
                .bg(move || theme().muted)
                .indicator_style(|s| {
                    s.top_1()
                        .bottom_1()
                        .rounded(move || theme().radius)
                        .bg(move || theme().background)
                })
                .child(item("overview", "Overview"))
                .child(item("activity", "Activity")),
        )
        .child(text(move || {
            if section.get() == "overview" {
                "Visitors, sign-ups and conversion this week."
            } else {
                "Deploys, invoices and new members, newest first."
            }
        }).text_color(move || theme().foreground))
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { Tab, Tabs } from "nsh/base";

function App() {
  const section = signal("overview");
  const item = (value: string, label: string) => (
    <Tab
      selected={section() === value}
      onPress={() => section.set(value)}
      class="group rounded-(--radius) px-3 py-2"
    >
      <Text class="text-sm text-muted-foreground group-selected:text-foreground">{label}</Text>
    </Tab>
  );
  return (
    <View class="gap-4">
      <Tabs
        class="flex-row self-start gap-1 rounded-(--radius-lg) bg-muted p-1"
        indicatorClass="inset-y-1 rounded-(--radius) bg-background"
      >
        {item("overview", "Overview")}
        {item("activity", "Activity")}
      </Tabs>
      <Text class="text-foreground">
        {section() === "overview"
          ? "Visitors, sign-ups and conversion this week."
          : "Deploys, invoices and new members, newest first."}
      </Text>
    </View>
  );
}

mount(App);
```

`Tab` und `Tabs` stammen aus [`nsh/base`](../modules/nsh-base.md), dem `nsh-base`-Crate in Rust. Der Wert gehört der App: Die Liste hält keinen. Jedem Tab wird mitgeteilt, ob er ausgewählt ist; ein Druck meldet `onPress`, die App setzt ihren Wert und zeigt diesen Abschnitt, und jeder Tab zeigt den `selected`, den die App zurückgibt. Die Ecken der Liste und die der Tabs sind konzentrisch: Das Padding der Liste (`p-1`) ist die Differenz zwischen `radius.lg` und `radius`. Die Füllung des ausgewählten Tabs ist der Indikator der Liste (`indicatorClass`, innerhalb dieses Paddings: `inset-y-1`), der zu dem Tab springt, den die App auswählt. In Rust erzeugen `tab()` und `tabs()` sie, mit einem Setter pro Prop (`.selected(..)`), einem Listener pro Ereignis (`.on_press(..)`), den typisierten Stilmethoden und `.child(..)` für ihren Inhalt.

## Props

### Tab

| Prop | Rust | Typ | Standard | Beschreibung |
|---|---|---|---|---|
| `selected` | `.selected(..)` | `boolean` | `false` | Der aktuelle Tab seiner Liste: Screenreader sagen, dass er ausgewählt ist, und `selected:`-Stile gelten. Ein Druck meldet `onPress`; der Tab zeigt den Wert, den die App zurückgibt. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Keine Drücke und kein Druck-Feedback; `disabled:`-Stile gelten, und Screenreader sagen, dass er abgeblendet ist. |
| `selectedStyle` | `.selected_style(\|s\| ..)` | `StyleProp<ViewStyle>` | keiner | Der Stil des Tabs, solange er ausgewählt und nicht deaktiviert ist, als `selected:`-Klassen. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | keiner | Was Screenreader ansagen: der Name des Tabs, wenn seine Kinder keinen Text enthalten, der ihn nennt (ein Icon). |
| `children` | `.child(..)` | `JSX.Element` | keiner | Die Beschriftung, das Icon oder das Badge der App, das Screenreader ansagen. |
| `class`, `style` | Stilmethoden | `string`, `StyleProp<ViewStyle>` | keiner | Der Tab selbst: die Fläche um seine Beschriftung. |
| `activeStyle`, `hoverStyle`, `focusStyle`, `disabledStyle` | `.active(\|s\| ..)`, `.hover(..)`, `.focus(..)`, `.disabled_style(..)` | `StyleProp<ViewStyle>` | keiner | Der Stil des Tabs, solange er gedrückt, überfahren, fokussiert oder deaktiviert ist, als `<state>:`-Klassen. |

### Tabs

| Prop | Rust | Typ | Standard | Beschreibung |
|---|---|---|---|---|
| `indicatorClass` | `.indicator_class(..)` | `string` | keiner | Die Tailwind-Klassen des Indikators auf dem ausgewählten Tab: sein Aussehen und seine Position quer zur Liste (`bottom-0 h-0.5` für eine Unterstreichung in einer Zeile, `inset-y-1` für eine Pille). Entlang der Liste überspannt er den ausgewählten Tab, innerhalb seiner eigenen Ränder auf dieser Achse. Mit `indicatorClass` oder `indicatorStyle` hat die Liste einen Indikator. |
| `indicatorStyle` | `.indicator_style(\|s\| ..)` | `StyleProp<ViewStyle>` | keiner | Der Stil des Indikators, über `indicatorClass`. |
| `children` | `.child(..)` | `JSX.Element` | keiner | Die Tabs der Liste und alles, was die App dazwischen anordnet. |
| `class`, `style` | Stilmethoden | `string`, `StyleProp<ViewStyle>` | keiner | Layout und Aussehen der Liste: standardmäßig eine Spalte, `flex-row` für eine Zeile. |

<a id="events"></a>

## Ereignisse

| Ereignis | Rust | Beschreibung |
|---|---|---|
| `onPress` (`Tab`) | `.on_press(\|_: &()\| ..)` | Der Tab wurde gedrückt: ein Tippen, ein Klick, Leertaste oder Return, während er den Tastaturfokus hat, oder eine Aktivierung durch einen Screenreader; oder eine Pfeiltaste, Pos1 oder Ende seiner Liste hat den Tastaturfokus auf ihn bewegt. Es wird ausgeführt, bevor sich etwas ändert: Der Tab zeigt den `selected`, den die App zurückgibt. |

Der ausgewählte Tab meldet seine Drücke ebenfalls, sodass die App auf einen zweiten Druck reagieren kann (zum Beispiel ihren Abschnitt an den Anfang scrollen).
Ein deaktivierter Tab meldet nichts.

<a id="parts"></a>

## Teile

| Teil | Enthalten in | Gestaltet mit | Zustände |
|---|---|---|---|
| Die Liste | | `Tabs`: `class`, `style` | |
| Der Indikator | die Liste, hinter den Tabs | `indicatorClass`, `indicatorStyle` | auf dem ausgewählten Tab |
| Der Tab | die Liste | `Tab`: `class`, `style` | `selected:`, `disabled:`, `active:`, `hover:`, `focus:` (oder `selectedStyle`, `disabledStyle`, ...) |
| Die Beschriftung | der Tab | eigene Elemente (`children`) | `group-selected:`, `group-disabled:` und die anderen `group-*:`-Varianten mit `group` am `class` des Tabs |
| Der Inhalt des Abschnitts | neben der Liste | die Elemente der App | der Wert der App |

Zeigen Sie den ausgewählten Tab über seine eigene Fläche: eine Füllung, eine kräftigere Beschriftung, eine stärkere Schriftstärke (siehe
[Design-Leitfäden](../docs/design-guides.md#interaction-states)).

<a id="indicator"></a>

## Indikator

Eine Unterstreichung unter dem ausgewählten Tab, eine Pille dahinter oder das erhabene Segment eines segmentierten Controls ist der Indikator der Liste: eine View, die die App mit `indicatorClass` und `indicatorStyle` gestaltet, hinter den Tabs gezeichnet und in der Liste absolut positioniert. Native Shell platziert ihn nach jedem Layout auf dem ausgewählten Tab. Entlang der Liste (die Breite einer Zeile, die Höhe einer Spalte) überspannt er diesen Tab, innerhalb der eigenen Ränder des Indikators auf dieser Achse (`mx-3` für eine Unterstreichung, die kürzer als ihr Tab ist); quer zur Liste platzieren ihn seine Klassen:

```tsx
// An underline at the bottom of a row of tabs.
<Tabs class="flex-row gap-4 border-b border-border" indicatorClass="bottom-0 h-0.5 bg-foreground">
  {item("overview", "Overview")}
  {item("activity", "Activity")}
</Tabs>

// A pill behind the selected tab, inside the list's padding.
<Tabs class="flex-row self-start gap-1 rounded-(--radius-lg) bg-muted p-1" indicatorClass="inset-y-1 rounded-(--radius) bg-background shadow-sm">
  {item("overview", "Overview")}
  {item("activity", "Activity")}
</Tabs>
```

Wählt die App einen anderen Tab aus, springt der Indikator nativ dorthin, so wie der Indikator der Tab-Leiste von GPUI Kit; bei reduzierter Bewegung wechselt er sofort. Solange kein Tab ausgewählt ist, ist er ausgeblendet; sind mehrere ausgewählt, sitzt er auf dem ersten. Eine Größenänderung oder eine Änderung der Breite eines Tabs bewegt ihn im selben Frame wie die Tabs. Der Indikator braucht keine Layout-Ereignisse und keinen Code der App: Der ausgewählte Tab ist der, dessen `selected` wahr ist. In einer Liste, die scrollt, umschließt die Scroll-View das `Tabs`, und der Indikator scrollt mit den Tabs.

<a id="disabled"></a>

## Deaktiviert

Ein deaktivierter Tab nimmt keine Drücke an, und Screenreader sagen ihn als abgeblendet an. Seine `disabled:`-Klassen gelten über seinen `selected:`-Klassen, und `group-disabled:`-Klassen darin folgen:

```tsx
<Tab
  selected={section() === "billing"}
  disabled={!isOwner()}
  onPress={() => section.set("billing")}
  class="group rounded-(--radius) px-3 py-2 selected:bg-background disabled:opacity-50"
>
  <Text class="text-sm text-muted-foreground group-selected:text-foreground">Billing</Text>
</Tab>
```

<a id="accessibility"></a>

## Barrierefreiheit

- Ein Tab ist für Screenreader ein Element mit der Rolle `"tab"` und seinem ausgewählten Zustand. Seine Beschriftung ist der Text seiner Kinder oder `accessibilityLabel`.
- `Tabs` hat die Rolle `"tablist"`: Screenreader hören die Tabs darin als eine Gruppe, jeder davon bleibt ein eigenes Element.
- `disabled` wird so angesagt, wie die Plattform es ansagt (VoiceOver, TalkBack, UI Automation, der Accessibility-Tree des Browsers).
- Unter macOS und im Web ist die Liste ein Haltepunkt des Tastaturfokus, und die Pfeiltasten bewegen zwischen ihren Tabs (siehe unten).
- Der Indikator ist für Screenreader ausgeblendet und nimmt keinen Fokus an: Nur die Tabs sind die Elemente der Liste.

Allgemeines zu Beschriftungen, Rollen und Ansagen finden Sie unter [Barrierefreiheit](../docs/accessibility.md).

<a id="keyboard"></a>

## Tastatur

Unter macOS und im Web, wo Tab die Views erreicht, die Drücke annehmen, folgt eine `Tabs`-Liste dem
[WAI-ARIA-Tabs-Muster](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/):

| Taste | Wirkung |
|---|---|
| Tab, Umschalt+Tab | Betritt die Liste am ausgewählten Tab (am ersten Tab, der nicht deaktiviert ist, solange keiner ausgewählt ist) und verlässt sie in einem Schritt. |
| Rechts, Runter | Bewegt den Fokus zum nächsten Tab, vom letzten zum ersten. |
| Links, Hoch | Bewegt den Fokus zum vorherigen Tab, vom ersten zum letzten. |
| Pos1, Ende | Bewegt den Fokus zum ersten oder zum letzten Tab. |
| Leertaste, Return | Drückt den fokussierten Tab. |

Die Pfeiltasten überspringen deaktivierte Tabs, und der Tab, zu dem sie bewegen, meldet `onPress`, sodass die App ihn auswählt, während der Fokus wandert: Der Abschnitt folgt dem Fokus. Beide Pfeilpaare bewegen den Fokus, unabhängig vom Layout der Liste, das über die Klassen der App festgelegt wird. In einem Rechts-nach-links-Layout läuft die Zeile von rechts, sodass Links und Rechts die Plätze tauschen: Links bewegt zum nächsten Tab und Rechts zum vorherigen; Hoch, Runter, Pos1 und Ende behalten ihre Bedeutung. `focus:`-Stile zeigen, wo der Fokus ist. Ein `Tab` außerhalb eines `Tabs` ist ein eigener Haltepunkt.

<a id="platform-notes"></a>

## Hinweise zu Plattformen

- iOS, Android und Mac Catalyst: Ein Druck ist ein Tippen, das auf dem Tab endet, seine Beschriftung eingeschlossen.
- Desktops (macOS, Windows, Linux, GPUI) und das Web: Ein Druck ist ein Klick. Unter macOS und im Web drücken außerdem Leertaste und Return den Tab, der den Tastaturfokus hat, und die Pfeiltasten, Pos1 und Ende bewegen ihn ([Tastatur](#keyboard)).
- Jede Plattform zeichnet, was die App gestaltet: die Tabs, die Fläche des ausgewählten Tabs, den Indikator und den Inhalt der Abschnitte. Die Bewegung des Indikators ist auf jeder Plattform eine native Layout-Animation.
