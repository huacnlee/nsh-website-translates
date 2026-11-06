---
title: "Switch"
description: "Die Switch-Komponente: ein Ein-/Aus-Steuerelement, das Eingaben per Berührung oder Klick, Tastaturaktivierung, den deaktivierten Zustand sowie seine Rolle und seinen Wert für Screenreader verwaltet, mit einem Track und einem Thumb, die von der App gestaltet werden."
group: base
demo: el-switch
source_hash: d203427a791f5543
---


# Switch

Ein Switch schaltet eine Einstellung ein oder aus, und die Änderung wirkt sofort. Er übernimmt das Verhalten: Drücken, Tastaturaktivierung, den deaktivierten Zustand sowie die Switch-Rolle und ihren Wert für Screenreader. Das Aussehen bestimmt die App: Ein `Switch` hat keine eigenen Farben, Größen, Animationen oder Beschriftung. Er besteht aus einer Spur (Track) mit einem Daumen (Thumb) darin und danach seinen Kindern (einem Label), und die App gestaltet jeden Teil mit `checked:`- und `disabled:`-Klassen, die dem Switch folgen.

```rust tabs
use nsh_base::{switch, theme};
use nsh_core::prelude::*;

fn wifi() -> impl IntoElement {
    let on = signal(false);
    switch()
        .checked(on)
        .on_change(move |next: &bool| on.set(*next))
        .flex_row()
        .items_center()
        .gap_3()
        .track_style(|s| {
            s.w(px(44.0))
                .p(px(2.0))
                .rounded_full()
                .bg(move || theme().muted)
                .transition_colors()
                .checked(|s| s.bg(move || theme().primary))
        })
        .thumb_style(|s| {
            s.size(px(20.0))
                .rounded_full()
                .bg(move || theme().background)
                .shadow_sm()
                .transition_transform()
                .checked(|s| s.translate_x(px(20.0)))
        })
        .child(text("Wi-Fi"))
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { Switch } from "nsh/base";

function App() {
  const on = signal(false);
  return (
    <Switch
      checked={on()}
      onChange={({ checked }) => on.set(checked)}
      class="flex-row items-center gap-3"
      trackClass="w-11 rounded-full bg-muted p-0.5 transition-colors checked:bg-primary"
      thumbClass="size-5 rounded-full bg-background shadow-sm transition-transform checked:translate-x-5"
    >
      <Text>Wi-Fi</Text>
    </Switch>
  );
}

mount(App);
```

`Switch` stammt aus [`nsh/base`](../modules/nsh-base.md), dem `nsh-base`-Crate in Rust. Der Wert gehört der App: Ein Druck meldet den nächsten Wert mit `onChange`, und der Switch zeigt den `checked`, den die App zurückgibt. In Rust erzeugt `switch()` einen Switch mit einem Setter pro Prop (`.checked(..)`, `.track_style(..)`), einem Listener pro Ereignis (`.on_change(..)`), den typisierten Stilmethoden für den Switch selbst und `.child(..)` für sein Label; der Stil eines Teils akzeptiert die Zustandsmethoden (`.checked(..)`, `.disabled_style(..)`), die dem Switch folgen.

## Props

| Prop | Rust | Typ | Standard | Beschreibung |
|---|---|---|---|---|
| `checked` | `.checked(..)` | `boolean` | `false` | Ein oder aus. Ein Druck meldet den nächsten Wert mit `onChange`; der Switch zeigt den Wert, den die App zurückgibt. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Keine Drücke und kein Feedback beim Drücken; `disabled:`-Stile gelten für den Switch und seine Teile, und Screenreader geben an, dass er abgeblendet ist. |
| `checkedStyle` | `.checked_style(\|s\| ..)` | `StyleProp<ViewStyle>` | keiner | Der Stil des Switch, solange er `checked` und nicht deaktiviert ist, als `checked:`-Klassen. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | keiner | Was Screenreader sagen: was der Switch einschaltet, wenn seine Kinder keinen Text enthalten, der es sagt. |
| `trackClass`, `trackStyle` | `.track_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | keiner | Die Spur, der Teil, entlang dem sich der Daumen bewegt. |
| `thumbClass`, `thumbStyle` | `.thumb_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | keiner | Der Daumen innerhalb der Spur. |
| `hitSlop` | `.hit_slop(..)` | `number \| Partial<Edges>` | keiner | Wie weit außerhalb seiner Grenzen Drücke noch zählen, in Punkten: eine Zahl für alle Seiten oder die benannten Seiten. Wie `hitSlop` bei einer View. |
| `children` | `.child(..)` | `JSX.Element` | keiner | Der Inhalt nach der Spur: ein Label, das Screenreader vorlesen. |
| `class`, `style` | Stilmethoden | `string`, `StyleProp<ViewStyle>` | keiner | Der Switch selbst: die Zeile um die Spur und das Label. |
| `activeStyle`, `hoverStyle`, `focusStyle`, `disabledStyle` | `.active(\|s\| ..)`, `.hover(..)`, `.focus(..)`, `.disabled_style(..)` | `StyleProp<ViewStyle>` | keiner | Der Stil des Switch, während er gedrückt, überfahren, fokussiert oder deaktiviert ist, als `<state>:`-Klassen. |

<a id="events"></a>

## Ereignisse

| Ereignis | Rust | Beschreibung |
|---|---|---|
| `onChange` | `.on_change(\|checked: &bool\| ..)` | Der Switch wurde gedrückt: per Tippen, Klick, Leertaste oder Return, während er den Tastaturfokus hat, oder durch die Aktivierung eines Screenreaders. Er meldet den Wert, den der Switch anfordert, als `checked`, das Gegenteil des `checked`, den er hat. |

Ein deaktivierter Switch meldet nichts.

<a id="parts"></a>

## Teile

| Teil | Enthalten in | Gestaltet mit | Zustände |
|---|---|---|---|
| Der Switch | | `class`, `style` | `checked:`, `disabled:`, `active:`, `hover:`, `focus:` (oder `checkedStyle`, `disabledStyle`, ...) |
| Die Spur | dem Switch, als Erstes | `trackClass`, `trackStyle` | `checked:`, `disabled:` folgen dem Switch |
| Der Daumen | der Spur | `thumbClass`, `thumbStyle` | `checked:`, `disabled:` folgen dem Switch |
| Das Label | dem Switch, nach der Spur | eigenen Elementen (`children`) | `group-checked:` und die anderen `group-*:`-Varianten mit `group` auf dem `class` des Switch |

Der Daumen bewegt sich durch seine eigenen `checked:`-Stile: eine Verschiebung (`checked:translate-x-5`) oder einen Außenabstand beziehungsweise die Ausrichtung der Spur (`checked:justify-end` auf der Spur). Eine `transition-*`-Klasse animiert die Änderung nativ. Um das Label vor die Spur zu setzen, kehre die Zeile um: `class="flex-row-reverse justify-between"`.

<a id="disabled"></a>

## Deaktiviert

Ein deaktivierter Switch nimmt keine Drücke an, und Screenreader geben ihn als abgeblendet an. Seine `disabled:`-Klassen sowie die seiner Spur und seines Daumens gelten und überschreiben deren `checked:`-Klassen:

```tsx
<Switch
  checked={on()}
  disabled={!online()}
  onChange={({ checked }) => on.set(checked)}
  class="flex-row items-center gap-3 disabled:opacity-50"
  trackClass="w-11 rounded-full bg-muted p-0.5 checked:bg-primary disabled:bg-muted"
  thumbClass="size-5 rounded-full bg-background checked:translate-x-5"
>
  <Text>Sync over cellular</Text>
</Switch>
```

<a id="a-small-target-with-hitslop"></a>

## Ein kleines Ziel mit hitSlop

Ein Switch ohne Label daneben kann kleiner als ein Finger sein. `hitSlop` lässt Drücke zählen, die in seiner Nähe landen, in Punkten über jede Seite hinaus, ohne sein Layout oder sein Aussehen zu ändern: eine Zahl für alle Seiten oder die benannten Seiten (`{ top: 8, bottom: 8 }`), so wie [`hitSlop` einer View](./index.md#presses-and-feedback) sie akzeptiert.

```tsx
<Switch
  checked={on()}
  hitSlop={{ top: 8, bottom: 8 }}
  accessibilityLabel="Notifications"
  onChange={({ checked }) => on.set(checked)}
  trackClass="w-9 rounded-full bg-muted p-0.5 checked:bg-primary"
  thumbClass="size-4 rounded-full bg-background checked:translate-x-4"
/>
```

<a id="accessibility"></a>

## Barrierefreiheit

- Ein Switch ist für Screenreader ein einzelnes Element mit der Rolle `"switch"` und seinem Wert (ein oder aus); die Spur und der Daumen sind Teile davon. Sein Label ist der Text seiner Kinder; gib `accessibilityLabel` an, wenn er keinen hat.
- `disabled` wird so angesagt, wie die Plattform es ansagt (VoiceOver, TalkBack, UI Automation, der Accessibility-Tree des Browsers).
- Unter macOS und im Web ist ein Switch ein Haltepunkt des Tastaturfokus: Tab erreicht ihn, Leertaste und Return schalten ihn um, und `focus:`-Stile zeigen, wo der Fokus liegt.

Siehe [Barrierefreiheit](../docs/accessibility.md) für Labels, Rollen und Ansagen im Allgemeinen.

<a id="platform-notes"></a>

## Hinweise zu den Plattformen

- iOS, Android und Mac Catalyst: Ein Druck ist ein Tippen, das auf dem Switch endet, einschließlich seines Labels.
- Desktops (macOS, Windows, Linux, GPUI) und das Web: Ein Druck ist ein Klick. Unter macOS und im Web schalten außerdem Leertaste und Return den Switch um, der den Tastaturfokus hat.
- Jede Plattform zeichnet, was die App gestaltet; der Daumen bewegt sich so, wie es die Stile und Übergänge der App vorgeben.
