---
title: "Checkbox"
description: "Die Checkbox-Komponente: ein Steuerelement mit den Zuständen aktiviert, deaktiviert oder unbestimmt, das Eingaben per Tippen oder Klicken, die Tastaturaktivierung, den deaktivierten Zustand sowie seine Rolle und seinen Wert für Screenreader verwaltet, mit einem Indikator, den die App gestaltet und kennzeichnet."
group: base
demo: el-checkbox
source_hash: c31b1f22eacafd92
---


# Checkbox

Eine Checkbox wählt eine Option, ein Element einer Liste oder alle aus. Sie ist angehakt, nicht angehakt oder unbestimmt (weder noch: ein „Alle auswählen" bei einer teilweisen Auswahl). Sie übernimmt das Verhalten: Presses, Tastaturaktivierung, den deaktivierten Zustand sowie die Checkbox-Rolle und ihren Wert für Screenreader. Das Aussehen liegt bei der App: `Checkbox` hat selbst keine Box, kein Häkchen, keine Farben, Größen oder Beschriftung. Sie besteht aus einem Indikator (der Box) mit dem Zeichen der App darin, danach ihren Children (einem Label), und die App gestaltet jeden Teil mit `checked:`-, `indeterminate:`- und `disabled:`-Klassen, die der Checkbox folgen.

```rust tabs
use nsh_base::{checkbox, theme};
use nsh_core::prelude::*;

fn notify() -> impl IntoElement {
    let on = signal(false);
    checkbox()
        .checked(on)
        .on_change(move |next: &bool| on.set(*next))
        .flex_row()
        .items_center()
        .gap_2()
        .indicator_style(|s| {
            s.size(px(20.0))
                .items_center()
                .justify_center()
                .rounded_md()
                .border_2()
                .border_color(move || theme().border)
                .transition_colors()
                .checked(|s| s.bg(move || theme().primary).border_color(move || theme().primary))
        })
        .indicator(text(move || if on.get() { "✓" } else { "" }).text_color(move || theme().primary_foreground))
        .child(text("Notify me"))
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { Checkbox } from "nsh/base";

function App() {
  const on = signal(false);
  return (
    <Checkbox
      checked={on()}
      onChange={({ checked }) => on.set(checked)}
      class="flex-row items-center gap-2"
      indicatorClass="size-5 items-center justify-center rounded-md border-2 border-border transition-colors checked:border-primary checked:bg-primary"
      indicator={<Text class="text-primary-foreground">{on() ? "✓" : ""}</Text>}
    >
      <Text>Notify me</Text>
    </Checkbox>
  );
}

mount(App);
```

`Checkbox` stammt aus [`nsh/base`](../modules/nsh-base.md), dem `nsh-base`-Crate in Rust. Der Wert gehört der App: Ein Press meldet den nächsten Wert mit `onChange`, und die Checkbox zeigt die Werte `checked` und `indeterminate`, die die App zurückgibt. In Rust erzeugt `checkbox()` eine Checkbox mit einem Setter pro Prop (`.checked(..)`, `.indicator_style(..)`), einem Listener pro Event (`.on_change(..)`), den typisierten Style-Methoden für die Checkbox selbst und `.child(..)` für ihr Label; der Style des Indikators nimmt die Zustandsmethoden (`.checked(..)`, `.indeterminate(..)`, `.disabled_style(..)`) entgegen, die der Checkbox folgen.

## Props

| Prop | Rust | Typ | Standard | Beschreibung |
|---|---|---|---|---|
| `checked` | `.checked(..)` | `boolean` | `false` | Angehakt oder nicht. Ein Press meldet den nächsten Wert mit `onChange`; die Checkbox zeigt den Wert, den die App zurückgibt. |
| `indeterminate` | `.indeterminate(..)` | `boolean` | `false` | Weder angehakt noch nicht angehakt, und zwar vor `checked`, solange er gilt: Screenreader sagen, dass sie gemischt ist, und ein Press fordert „angehakt" an. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Keine Presses und kein Press-Feedback; `disabled:`-Styles gelten für die Checkbox und ihren Indikator, und Screenreader sagen, dass sie abgeblendet ist. |
| `checkedStyle` | `.checked_style(\|s\| ..)` | `StyleProp<ViewStyle>` | keiner | Der Style der Checkbox, solange sie angehakt und nicht deaktiviert ist, als `checked:`-Klassen. |
| `indeterminateStyle` | `.indeterminate_style(\|s\| ..)` | `StyleProp<ViewStyle>` | keiner | Der Style der Checkbox, solange sie unbestimmt und nicht deaktiviert ist, als `indeterminate:`-Klassen. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | keiner | Was Screenreader sagen: was die Checkbox auswählt, wenn ihre Children keinen Text enthalten, der es sagt. |
| `role` | `.role(..)` | `AccessibilityRole` | `"checkbox"` | Was sie für Screenreader ist, wenn es etwas Spezifischeres ist (ein angehakter Menüeintrag: `"menuitem"`). |
| `indicatorClass`, `indicatorStyle` | `.indicator_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | keiner | Der Indikator, die Box, die den Wert zeigt. |
| `indicator` | `.indicator(..)` | `JSX.Element` | keiner | Der Inhalt des Indikators: das Zeichen (ein Häkchen, ein Strich), das die App abhängig von ihrem Wert zeigt. |
| `hitSlop` | `.hit_slop(..)` | `number \| Partial<Edges>` | keiner | Wie weit außerhalb ihrer Grenzen Presses noch zählen, in Punkten: eine Zahl für alle Seiten oder die benannten Seiten. Wie `hitSlop` einer View. |
| `children` | `.child(..)` | `JSX.Element` | keiner | Der Inhalt nach dem Indikator: ein Label, das Screenreader vorlesen. |
| `class`, `style` | Style-Methoden | `string`, `StyleProp<ViewStyle>` | keiner | Die Checkbox selbst: die Zeile um den Indikator und das Label. |
| `activeStyle`, `hoverStyle`, `focusStyle`, `disabledStyle` | `.active(\|s\| ..)`, `.hover(..)`, `.focus(..)`, `.disabled_style(..)` | `StyleProp<ViewStyle>` | keiner | Der Style der Checkbox, solange sie gedrückt, gehovert, fokussiert oder deaktiviert ist, als `<state>:`-Klassen. |

## Events

| Event | Rust | Beschreibung |
|---|---|---|
| `onChange` | `.on_change(\|checked: &bool\| ..)` | Die Checkbox wurde gedrückt: ein Tap, ein Klick, Space oder Return, während sie den Tastaturfokus hat, oder die Aktivierung durch einen Screenreader. Sie meldet den Wert, den die Checkbox anfordert, als `checked`: `true` von „nicht angehakt" und von „unbestimmt" aus, `false` von „angehakt" aus. |

Eine deaktivierte Checkbox meldet nichts.

<a id="parts"></a>

## Teile

| Teil | Enthalten in | Gestaltet mit | Zustände |
|---|---|---|---|
| Die Checkbox | | `class`, `style` | `checked:`, `indeterminate:`, `disabled:`, `active:`, `hover:`, `focus:` (oder `checkedStyle`, `indeterminateStyle`, `disabledStyle`, ...) |
| Der Indikator | der Checkbox, als Erstes | `indicatorClass`, `indicatorStyle` | `checked:`, `indeterminate:`, `disabled:` folgen der Checkbox |
| Das Zeichen | dem Indikator | eigenen Elementen (`indicator`) | `group-checked:`, `group-indeterminate:` und die anderen `group-*:`-Varianten mit `group` auf `indicatorClass` |
| Das Label | der Checkbox, nach dem Indikator | eigenen Elementen (`children`) | `group-*:`-Varianten mit `group` auf dem `class` der Checkbox |

Das Zeichen ist Inhalt der App, es zeigt also, was die App festlegt: ein Häkchen, solange sie angehakt ist, und einen Strich, solange sie unbestimmt ist, gewählt anhand des Werts, den die App hält, oder beide Zeichen, wobei `group-checked:`- / `group-indeterminate:`-Klassen das angezeigte auswählen.

<a id="indeterminate"></a>

## Unbestimmt

Eine „Alle auswählen"-Checkbox ist unbestimmt, solange einige Elemente ausgewählt sind. Ein Press fordert „angehakt" an, und die App wählt jedes Element aus:

```tsx
const selected = signal<string[]>([]);
const all = () => selected().length === items.length;
const some = () => selected().length > 0 && !all();

<Checkbox
  checked={all()}
  indeterminate={some()}
  onChange={({ checked }) => selected.set(checked ? items.map((i) => i.id) : [])}
  class="flex-row items-center gap-2"
  indicatorClass="group size-5 items-center justify-center rounded-md border-2 border-border checked:border-primary checked:bg-primary indeterminate:border-primary indeterminate:bg-primary"
  indicator={
    <>
      <Text class="hidden text-primary-foreground group-checked:flex">✓</Text>
      <View class="hidden h-0.5 w-2.5 bg-primary-foreground group-indeterminate:flex" />
    </>
  }
>
  <Text>Select all</Text>
</Checkbox>
```

<a id="disabled"></a>

## Deaktiviert

Eine deaktivierte Checkbox nimmt keine Presses entgegen, und Screenreader kündigen sie als abgeblendet an. Ihre `disabled:`-Klassen und die ihres Indikators gelten und überschreiben deren `checked:`- und `indeterminate:`-Klassen:

```tsx
<Checkbox
  checked={on()}
  disabled={locked()}
  onChange={({ checked }) => on.set(checked)}
  class="flex-row items-center gap-2 disabled:opacity-50"
  indicatorClass="size-5 rounded-md border-2 border-border checked:border-primary checked:bg-primary disabled:border-border disabled:bg-muted"
>
  <Text>Share usage data</Text>
</Checkbox>
```

<a id="a-small-target-with-hitslop"></a>

## Ein kleines Ziel mit hitSlop

Eine Checkbox ohne Label daneben (das Auswahlkästchen einer Zeile) kann kleiner als ein Finger sein. `hitSlop` lässt Presses zählen, die in ihrer Nähe landen, in Punkten über jede Seite hinaus, ohne ihr Layout oder ihr Aussehen zu ändern: eine Zahl für alle Seiten oder die benannten Seiten (`{ top: 8, bottom: 8 }`), so wie `hitSlop` einer [View](./index.md#presses-and-feedback) sie entgegennimmt.

```tsx
<Checkbox
  checked={selected()}
  hitSlop={12}
  accessibilityLabel="Select row"
  onChange={({ checked }) => selected.set(checked)}
  indicatorClass="size-4 rounded border border-border checked:bg-primary"
/>
```

<a id="accessibility"></a>

## Barrierefreiheit

- Eine Checkbox ist für Screenreader ein einzelnes Element mit der Rolle `"checkbox"` (oder ihrem `role`) und ihrem Wert: angehakt, nicht angehakt oder gemischt, solange sie unbestimmt ist. Der Indikator und das Zeichen sind Teile davon. Ihr Label ist der Text ihrer Children; gib `accessibilityLabel` an, wenn sie keinen hat.
- `disabled` wird so angekündigt, wie die Plattform es ankündigt (VoiceOver, TalkBack, UI Automation, der Accessibility Tree des Browsers).
- Unter macOS und im Web ist eine Checkbox ein Haltepunkt des Tastaturfokus: Tab erreicht sie, Space und Return schalten sie um, und `focus:`-Styles zeigen, wo der Fokus liegt.

Siehe [Barrierefreiheit](../docs/accessibility.md) für Labels, Rollen und Ankündigungen im Allgemeinen.

<a id="platform-notes"></a>

## Plattformhinweise

- iOS, Android und Mac Catalyst: Ein Press ist ein Tap, der auf der Checkbox endet, ihr Label eingeschlossen.
- Desktops (macOS, Windows, Linux, GPUI) und das Web: Ein Press ist ein Klick. Unter macOS und im Web schalten Space und Return außerdem die Checkbox um, die den Tastaturfokus hat.
- Jede Plattform zeichnet, was die App gestaltet: den Indikator, das Zeichen und ihre Übergänge.
