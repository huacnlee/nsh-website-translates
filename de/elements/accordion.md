---
title: "Accordion"
description: "Accordion und seine Teile: gestapelte Abschnitte, die sich unter ihren Überschriften auf- und zuklappen lassen, einzeln oder mehrere gleichzeitig, geöffnet über den Wert der App, auf Wunsch mit federnder Höhenanimation eingeblendet, wobei jedes Erscheinungsbild von der App bestimmt wird."
group: base
demo: el-accordion
source_hash: fb5b5e196c111b08
---


# Accordion

Ein Accordion stapelt Abschnitte, die sich unter ihren Überschriften auf- und zuklappen: die Fragen einer FAQ, die Gruppen einer Einstellungsseite, die Schritte eines Checkouts. Es besteht aus fünf Teilen, von denen jedes ein Stück Verhalten verantwortet und nichts vom Aussehen:

- `Accordion`, der Stapel: Er hält den `value` der App, also die Werte der geöffneten Items, und meldet den nächsten mit
  `onChange`. Ein Item ist jeweils offen, oder mehrere mit `multiple`.
- `AccordionItem`, ein Abschnitt, identifiziert durch seinen `value`. Er ist offen, solange der `value` des Accordions ihn enthält.
- `AccordionHeader`, die Überschrift des Items, mit einer `level`, die Screenreader ansagen.
- `AccordionTrigger`, die Schaltfläche in der Überschrift, die ihr Item auf- und zuklappt und angibt, ob es aufgeklappt ist.
- `AccordionPanel`, der Inhalt des Items, sichtbar, solange es offen ist; mit `reveal` federt seine Höhe auf und zu.

```rust tabs
use nsh_base::{accordion, accordion_header, accordion_item, accordion_panel, accordion_trigger, theme};
use nsh_core::prelude::*;

const FAQ: [(&str, &str, &str); 2] = [
    ("shipping", "When will my order ship?", "Orders placed before 2 pm leave the same day."),
    ("returns", "How do I return an item?", "Print the label from your order within 30 days."),
];

fn faq() -> impl IntoElement {
    let open = signal(vec![SharedString::from("shipping")]);
    let mut list = accordion()
        .value(open)
        .on_change(move |value: &Vec<SharedString>| open.set(value.clone()));
    for (value, question, answer) in FAQ {
        list = list.child(
            accordion_item()
                .value(value)
                .border_b_1()
                .border_color(move || theme().border)
                .child(
                    accordion_header().child(
                        accordion_trigger()
                            .flex_row()
                            .items_center()
                            .justify_between()
                            .py_3()
                            .child(text(question).font_weight(FontWeight::MEDIUM))
                            .child(text("⌄").transition_transform().rotate(move || {
                                let open = open.get().iter().any(|v| &**v == value);
                                if open { deg(180.0) } else { deg(0.0) }
                            })),
                    ),
                )
                .child(
                    accordion_panel()
                        .reveal(true)
                        .accessibility_label(question)
                        .child(view().pb_3().child(text(answer).text_color(move || theme().muted_foreground))),
                ),
        );
    }
    list
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { Accordion, AccordionHeader, AccordionItem, AccordionPanel, AccordionTrigger } from "nsh/base";

const FAQ = [
  { value: "shipping", question: "When will my order ship?", answer: "Orders placed before 2 pm leave the same day." },
  { value: "returns", question: "How do I return an item?", answer: "Print the label from your order within 30 days." },
];

function App() {
  const open = signal(["shipping"]);
  return (
    <Accordion value={open()} onChange={({ value }) => open.set(value)}>
      {FAQ.map((item) => (
        <AccordionItem value={item.value} class="border-b border-border">
          <AccordionHeader>
            <AccordionTrigger class="group flex-row items-center justify-between py-3 active:opacity-70">
              <Text class="font-medium">{item.question}</Text>
              <Text class="transition-transform group-aria-expanded:rotate-180">⌄</Text>
            </AccordionTrigger>
          </AccordionHeader>
          <AccordionPanel reveal accessibilityLabel={item.question}>
            <View class="pb-3">
              <Text class="text-muted-foreground">{item.answer}</Text>
            </View>
          </AccordionPanel>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

mount(App);
```

Die Teile stammen aus [`nsh/base`](../modules/nsh-base.md), dem `nsh-base`-Crate in Rust. Der Wert gehört der App: Das Drücken eines
Triggers meldet den nächsten `value` mit `onChange`, und das Accordion öffnet die Items, deren Werte die App zurückgibt. Jedes Teil findet das jeweils umgebende selbst, sodass die App sie frei anordnen kann: Trennlinien zwischen den Items, ein Badge
in einer Überschrift, ein Icon vor einem Titel. In Rust erzeugen `accordion()`, `accordion_item()`, `accordion_header()`,
`accordion_trigger()` und `accordion_panel()` sie, mit einem Setter pro Prop und `.child(..)` für den Inhalt.

## Props

### Accordion

| Prop | Rust | Typ | Standard | Beschreibung |
|---|---|---|---|---|
| `value` | `.value(..)` | `string[]` | `[]` | Die `value`s der geöffneten Items. Die App besitzt sie: Das Drücken eines Triggers meldet die nächsten mit `onChange`, und das Accordion zeigt die, die die App zurückgibt. |
| `multiple` | `.multiple(..)` | `boolean` | `false` | Mehrere Items gleichzeitig offen: Das Öffnen eines Items lässt die anderen offen. Ohne dies schließt das Öffnen eines Items das bisher offene. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Jedes Item ist deaktiviert: Kein Trigger nimmt Drücke an, und Screenreader geben jedes als abgeblendet an. |
| `children` | `.child(..)` | `JSX.Element` | keiner | Die Items und alles, was die App dazwischen anordnet (Trennlinien). |
| `class`, `style` | Style-Methoden | `string`, `StyleProp<ViewStyle>` | keiner | Layout und Aussehen des Stapels: eine Karte um die Items, der Abstand zwischen ihnen. |

### AccordionItem

| Prop | Rust | Typ | Standard | Beschreibung |
|---|---|---|---|---|
| `value` | `.value(..)` | `string` | erforderlich | Was das Item im `value` des Accordions identifiziert: die eigene ID der App, nie ihr Titel, der sich mit der Sprache ändert. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Sein Trigger nimmt keine Drücke an, und Screenreader geben ihn als abgeblendet an. Es bleibt offen oder geschlossen, wie der `value` des Accordions es vorgibt. |
| `children` | `.child(..)` | `JSX.Element` | keiner | Header und Panel des Items und alles, was die App sonst darin anordnet. |
| `class`, `style` | Style-Methoden | `string`, `StyleProp<ViewStyle>` | keiner | Der Abschnitt: eine Trennlinie darunter, eine Karte darum. |

### AccordionHeader

| Prop | Rust | Typ | Standard | Beschreibung |
|---|---|---|---|---|
| `level` | `.level(..)` | `number` | `3` | Die Ebene der Überschrift unter den Überschriften der Seite, für Screenreader (1 ist die oberste). |
| `children` | `.child(..)` | `JSX.Element` | keiner | Der Trigger des Items und alles, was der Header sonst enthält (ein Badge, eine eigene Aktion). |
| `class`, `style` | Style-Methoden | `string`, `StyleProp<ViewStyle>` | keiner | Das Layout der Überschrift. |

### AccordionTrigger

| Prop | Rust | Typ | Standard | Beschreibung |
|---|---|---|---|---|
| `expandedStyle` | `.expanded_style(\|s\| ..)` | `StyleProp<ViewStyle>` | keiner | Der Stil des Triggers, solange sein Item offen ist, als `aria-expanded:`-Klassen. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | keiner | Was Screenreader sagen, wenn die Kinder keinen Text enthalten, der es sagt. |
| `children` | `.child(..)` | `JSX.Element` | keiner | Der Titel und der Chevron; `group-aria-expanded:`-Klassen darin folgen dem Trigger mit `group` auf seinem `class`. |
| `class`, `style` | Style-Methoden | `string`, `StyleProp<ViewStyle>` | keiner | Der Trigger selbst: die Zeile, die der Nutzer drückt. |
| `activeStyle`, `hoverStyle`, `focusStyle`, `disabledStyle` | `.active(\|s\| ..)`, `.hover(..)`, `.focus(..)`, `.disabled_style(..)` | `StyleProp<ViewStyle>` | keiner | Der Stil des Triggers, solange er gedrückt, überfahren, fokussiert oder deaktiviert ist, als `<state>:`-Klassen. |

### AccordionPanel

| Prop | Rust | Typ | Standard | Beschreibung |
|---|---|---|---|---|
| `reveal` | `.reveal(..)` | `boolean` | `false` | Öffnet und schließt mit einem Reveal wie bei `Collapsible`: Das Panel beschneidet seinen Inhalt, und seine Höhe federt von null auf die des Inhalts und zurück, kritisch gedämpft (etwa 265 ms, ohne Überschwingen); die nachfolgenden Items bewegen sich mit. Bei reduzierter Bewegung öffnet und schließt es sofort. |
| `keepMounted` | `.keep_mounted(..)` | `boolean` | `false` | Der Inhalt bleibt im Baum, solange das Item geschlossen ist, unsichtbar, außerhalb des Tastaturfokus und für Screenreader nicht wahrnehmbar: Ein Video behält seine Position, eine Web View ihre Seite. Ohne dies verlässt der Inhalt den Baum, wenn das Panel schließt (sobald der Reveal es geschlossen hat), und kommt so zurück, wie er war. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | keiner | Wie Screenreader die Region nennen: meist der Titel des Items, wie seine Überschrift ihn angibt. |
| `children` | `.child(..)` | `JSX.Element` | keiner | Der Inhalt. |
| `class`, `style` | Style-Methoden | `string`, `StyleProp<ViewStyle>` | keiner | Layout und Aussehen der Region. Mit `reveal` liegt das Panel im geschlossenen Zustand im Layout, null hoch; Padding und Rahmen gehören daher auf eine View seines Inhalts. |

## Events

| Event | Rust | Beschreibung |
|---|---|---|
| `onChange({ value })` (`Accordion`) | `.on_change(\|value: &Vec<SharedString>\| ..)` | Ein Trigger wurde gedrückt: ein Tap, ein Klick, Space oder Return, während er den Tastaturfokus hat, oder die Aktivierung durch einen Screenreader. `value` sind die Werte der geöffneten Items, wie sie sein würden: Der Wert eines offenen Items verlässt sie, der eines geschlossenen wird am Ende angefügt oder ersetzt, ohne `multiple`, den bisherigen. Es läuft, bevor sich etwas ändert: Setze `value`, um ihm zu folgen. |

<a id="parts"></a>

## Teile

| Teil | Enthalten in | Gestaltet mit | Zustände |
|---|---|---|---|
| Der Stapel | | `Accordion` mit `class`, `style` | |
| Ein Item | dem Stapel | `AccordionItem` mit `class`, `style` | der Wert der App |
| Die Überschrift | dem Item | `AccordionHeader` mit `class`, `style` | |
| Der Trigger | der Überschrift | `AccordionTrigger` mit `class`, `style` | `aria-expanded:`, `disabled:`, `active:`, `hover:`, `focus:` (oder `expandedStyle`, `disabledStyle`, ...) |
| Titel und Chevron | dem Trigger | eigene Elemente (`children`) | `group-aria-expanded:`, `group-disabled:` mit `group` auf dem `class` des Triggers |
| Das Panel | dem Item, nach der Überschrift | `AccordionPanel` mit `class`, `style` | |
| Der Inhalt | dem Panel | eigene Elemente (`children`) | |

Ohne `reveal` liegt ein geschlossenes Panel außerhalb des Layouts und sein Inhalt außerhalb des Baums. Mit `reveal` ist die Änderung
eine Layout-Animation des Commits, der `value` ändert (wie `LayoutAnimation.configureNext`, nativ ausgeführt, sodass
beim Bewegen kein JavaScript läuft): Das sich öffnende Panel wächst von null auf die Höhe seines Inhalts, das sich schließende schrumpft
zurück, beide mit derselben Feder, und die nachfolgenden Items bewegen sich mit. Eine Transition der App läuft mit: Der
Chevron dreht sich (`transition-transform group-aria-expanded:rotate-180`).

<a id="disabled"></a>

## Deaktiviert

Der Trigger eines deaktivierten Items nimmt keine Drücke an, und Screenreader geben ihn als abgeblendet an; `disabled:`-Klassen am
Trigger und `group-disabled:` darin folgen. Das `disabled` des Accordions deaktiviert jedes Item. Ein deaktiviertes Item zeigt weiterhin,
was der `value` der App vorgibt: Die App kann es öffnen.

<a id="accessibility"></a>

## Barrierefreiheit

- Der Stapel ist eine Gruppe, jeder Header eine Überschrift seiner `level` und jeder Trigger eine Schaltfläche darin, die angibt, ob
  ihr Item aufgeklappt ist. Screenreader können von Überschrift zu Überschrift springen.
- Ein offenes Panel ist eine Region, benannt durch ihr `accessibilityLabel`; ein geschlossenes ist für Screenreader verborgen, auch
  erhalten gebliebener Inhalt.
- Das Aussehen des offenen Items liegt bei der App und sollte sich nicht allein auf Farbe stützen: Drehe den Chevron, wie es die Beispiele tun.

Siehe [Barrierefreiheit](../docs/accessibility.md) für Labels, Rollen und Ansagen im Allgemeinen.

<a id="keyboard"></a>

## Tastatur

Wo Views, die Drücke annehmen, Stationen des Tastaturfokus sind (macOS und das Web), ist jeder Trigger eine Station, in der
Reihenfolge der Seite, und Space und Return drücken ihn. Deaktivierte Trigger werden übersprungen, ebenso der Inhalt eines geschlossenen
Panels. Tab springt von einem Trigger zu den Steuerelementen seines offenen Panels und weiter zum nächsten Trigger.

<a id="platform-notes"></a>

## Hinweise zu den Plattformen

- Jede Plattform zeigt das Panel eines offenen Items unter seiner Überschrift und lässt ein geschlossenes außerhalb des Layouts (null hoch
  mit `reveal`).
- Mit `reveal` federt jede Plattform die Höhen der Panels mit ihrem eigenen Animator (iOS, Android, macOS, Windows, Linux,
  GPUI und das Web) und öffnet und schließt sie sofort, solange das System reduzierte Bewegung verlangt.
- Der Screenreader jeder Plattform hört die Überschrift und ihre Ebene beim Lesen von Überschriften und den Trigger darin als
  Schaltfläche mit ihrem Aufklappzustand; unter iOS liest VoiceOver den Trigger selbst.
- iOS, Android und Mac Catalyst: Das Drücken eines Triggers ist ein Tap. Desktops (macOS, Windows, Linux, GPUI) und das Web: ein
  Klick, und unter macOS und im Web Space oder Return auf dem fokussierten Trigger.
