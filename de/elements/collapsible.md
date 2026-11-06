---
title: "Collapsible"
description: "Die Collapsible-Komponente: ein Bereich, dessen Inhalt sich ein- und ausklappen lässt, nach seinen untergeordneten Elementen angezeigt wird, solange die App ihn geöffnet hat, auf Anforderung über eine federnde Höhenanimation eingeblendet wird und dessen Trigger sowie jedes Erscheinungsbild von der App bestimmt werden."
group: base
demo: el-collapsible
source_hash: cf0c6bafa8f80920
---


# Collapsible

Ein Collapsible ist ein Bereich, dessen Inhalt sich auf- und zuklappt: Details unter einer Zusammenfassung, ein „Mehr anzeigen“, ein Abschnitt mit erweiterten Einstellungen. Es rendert seine Children immer und danach sein `content`, solange `open`. Die App besitzt `open` und den Auslöser, der ihn umschaltet (eines der Children), und das Aussehen liegt bei der App: Ein `Collapsible` hat keinen eigenen Auslöser, kein Chevron und kein Label. Mit `reveal` öffnet und schließt sich der Inhalt mit Bewegung: Die Höhe seines Bereichs federt von null auf die Eigenhöhe des Inhalts und zurück, und was auf das Collapsible folgt, bewegt sich mit.

```rust tabs
use nsh_base::{collapsible, theme};
use nsh_core::{AccessibilityState, prelude::*};

fn storage() -> impl IntoElement {
    let open = signal(false);
    collapsible()
        .open(open)
        .reveal(true)
        .gap_2()
        .child(
            view()
                .role(AccessibilityRole::Button)
                .accessibility_state(move || AccessibilityState {
                    expanded: Some(open.get()),
                    ..AccessibilityState::default()
                })
                .on_press(move || open.update(|o| *o = !*o))
                .flex_row()
                .items_center()
                .justify_between()
                .child(text("Storage"))
                .child(text("›").transition_transform().rotate(move || {
                    if open.get() { deg(90.0) } else { deg(0.0) }
                })),
        )
        .content(text("Photos 120 GB · Apps 54 GB · System 38 GB").text_color(move || theme().muted_foreground))
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { Collapsible } from "nsh/base";

function App() {
  const open = signal(false);
  return (
    <Collapsible
      open={open()}
      reveal
      class="gap-2"
      content={<Text class="text-muted-foreground">Photos 120 GB · Apps 54 GB · System 38 GB</Text>}
    >
      <View
        role="button"
        accessibilityState={{ expanded: open() }}
        onPress={() => open.set(!open())}
        class="flex-row items-center justify-between active:opacity-70"
      >
        <Text class="font-medium">Storage</Text>
        <Text class={`transition-transform ${open() ? "rotate-90" : ""}`}>›</Text>
      </View>
    </Collapsible>
  );
}

mount(App);
```

`Collapsible` stammt aus [`nsh/base`](../modules/nsh-base.md), dem `nsh-base`-Crate in Rust. Der Wert gehört der App: Ihr Auslöser schaltet `open` um, und das Collapsible zeigt den Wert, den die App übergibt. In Rust erzeugt `collapsible()` eines mit je einem Setter pro Prop (`.open(..)`, `.reveal(..)`, `.content(..)`), den typisierten Style-Methoden für den Bereich und `.child(..)` für das, was immer sichtbar ist.

## Props

| Prop | Rust | Typ | Standard | Beschreibung |
|---|---|---|---|---|
| `open` | `.open(..)` | `boolean` | `false` | Aufgeklappt: Das `content` ist im Baum, nach den Children. Die App besitzt den Wert. |
| `reveal` | `.reveal(..)` | `boolean` | `false` | Öffnet und schließt mit einem Reveal: Der Inhalt sitzt in einem Bereich, der ihn beschneidet. Dessen Höhe federt von null auf die Eigenhöhe des Inhalts, sobald `open` eingeschaltet wird, und beim Ausschalten wieder zurück, kritisch gedämpft (etwa 265 ms, ohne Überschwingen). Was auf das Collapsible folgt, bewegt sich mit, und der Inhalt bleibt im Baum, bis der Bereich geschlossen ist. Bei reduzierter Bewegung öffnet und schließt es sofort. Der Bereich liegt auch im geschlossenen Zustand im Layout, mit der Höhe null, sodass auch ein `gap` des Collapsible davor liegt. |
| `content` | `.content(..)` | `JSX.Element` | keiner | Was sich aufklappt. Es wird einmal erzeugt und im zugeklappten Zustand beibehalten, sodass der Inhalt seinen Zustand (den Text einer Eingabe, eine Scrollposition, einen Switch) von einem Öffnen zum nächsten behält. |
| `children` | `.child(..)` | `JSX.Element` | keiner | Was in beiden Zuständen sichtbar ist: eine Zusammenfassung, der Auslöser, der `open` umschaltet. |
| `class`, `style` | Style-Methoden | `string`, `StyleProp<ViewStyle>` | keiner | Der Bereich um die Children und den Inhalt (`gap-2` sorgt für Abstände zwischen ihnen). |

## Events

Ein Collapsible meldet selbst nichts: Der Auslöser gehört der App, und sein Press (`onPress` des `View` mit `role="button"`) ist die Stelle, an der die App `open` umschaltet.

## Parts

| Part | Enthalten in | Gestaltet mit |
|---|---|---|
| Der Bereich | | `class`, `style` |
| Die Children | dem Bereich, zuerst | ihren eigenen Elementen |
| Der Bereich des Reveals | dem Bereich, nach den Children, mit `reveal` | keiner: Er beschneidet den Inhalt und übernimmt dessen Höhe |
| Der Inhalt | dem Bereich, nach den Children (mit `reveal` im Bereich des Reveals), solange `open` | seinen eigenen Elementen (`content`) |

Ohne `reveal` erscheint und verschwindet der Inhalt sofort, und jede Plattform legt den Bereich neu aus, wenn er hinzukommt oder entfällt. Mit `reveal` ist die Änderung eine Layout-Animation des Commits, der `open` ändert (als `LayoutAnimation.configureNext`, nativ ausgeführt, sodass während der Bewegung kein JavaScript läuft): Der Bereich des Reveals wächst von null auf die Höhe des Inhalts und schrumpft wieder zurück, und die Frames von allem, was dieselbe Änderung verschiebt, darunter die Views nach dem Collapsible, bewegen sich mit. Eine Transition der App läuft mit: Das Chevron des Auslösers dreht sich (`transition-transform`), und der Inhalt kann mit eigenen Klassen eingeblendet werden.

<a id="accessibility"></a>

## Barrierefreiheit

- Der Bereich ist für Screenreader kein eigenes Element: Seine Children und sein Inhalt werden so vorgelesen, wie sie sind.
- Der Auslöser gibt an, ob der Bereich aufgeklappt ist: Gib ihm `accessibilityState={{ expanded: open }}` und eine Button-Rolle (`role="button"` auf einem `View`), dann kündigen Screenreader zusammen mit seinem Label „aufgeklappt“ oder „zugeklappt“ an.
- Unter macOS und im Web ist der Auslöser ein Tastaturfokus-Stopp, wenn er Presses annimmt: Mit Tab erreicht man ihn, mit der Leertaste und der Eingabetaste schaltet man den Bereich um.

Siehe [Barrierefreiheit](../docs/accessibility.md) für Labels, Rollen und Ansagen im Allgemeinen.

<a id="platform-notes"></a>

## Hinweise zu den Plattformen

- Jede Plattform zeigt den Inhalt nach den Children, solange `open`, und lässt ihn andernfalls aus dem Layout heraus.
- Mit `reveal` lässt jede Plattform die Höhe des Bereichs auf ihrem eigenen Animator federn (iOS, Android, macOS, Windows, Linux, GPUI und das Web) und öffnet und schließt ihn sofort, solange das System reduzierte Bewegung verlangt.
- iOS, Android und Mac Catalyst: Der Press des Auslösers ist ein Tap. Desktops (macOS, Windows, Linux, GPUI) und das Web: ein Klick sowie die Leertaste oder die Eingabetaste auf dem fokussierten Auslöser unter macOS und im Web.
