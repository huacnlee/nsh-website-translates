---
title: "Button"
description: "Die Button-Komponente: ein Pressziel, das Pressvorgänge, die Zustände „disabled“ und „selected“ sowie seine Rolle für Screenreader verwaltet und von der App gestaltet wird."
group: base
demo: el-button
source_hash: ae28f575931a4fe9
---


# Button

Ein Button ist ein Ziel für Eingaben per Druck. Er besitzt das Verhalten: Drücken, Druck-Feedback über die Zustandsstile der App, die Zustände „disabled“ und „selected“, den Tastaturfokus und seine Rolle für Screenreader. Das Aussehen gehört der App: Ein `Button` hat keine eigenen Farben, Größen, Abstände oder Beschriftung. So wird dieselbe Komponente je nach Stilen und Kindern, die du ihr gibst, zu einem primären Button, einem Icon-Button, einem Tab, einem Umschalter in einer Toolbar oder der Zeile einer Liste.

```rust tabs
use nsh_base::button;
use nsh_core::prelude::*;

fn counter() -> impl IntoElement {
    let count = signal(0_u32);
    button()
        .on_press(move || count.update(|n| *n += 1))
        .self_center()
        .px_5()
        .py_3()
        .rounded_xl()
        .bg(rgb(0x2563eb))
        .active(|s| s.bg(rgb(0x1d4ed8)))
        .child(
            text(move || format!("Pressed {}", count.get()))
                .text_color(white())
                .font_weight(FontWeight::SEMIBOLD),
        )
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { Button } from "nsh/base";

function App() {
  const count = signal(0);
  return (
    <Button
      onPress={() => count.update((n) => n + 1)}
      class="self-center rounded-xl bg-blue-600 px-5 py-3 active:bg-blue-700"
    >
      <Text class="text-base font-semibold text-white">{`Pressed ${count()}`}</Text>
    </Button>
  );
}

mount(App);
```

`Button` stammt aus [`nsh/base`](../modules/nsh-base.md), dem `nsh-base`-Crate in Rust. In TSX bestimmen `class` und `style` das Aussehen, mit den Zustandsvarianten `active:`, `hover:`, `focus:`, `selected:` und `disabled:` (oder den entsprechenden `activeStyle`, `hoverStyle`, `focusStyle`, `selectedStyle` und `disabledStyle`). In Rust erzeugt `button()` einen Button, so wie `view()` eine View erzeugt: ein Setter pro Prop (`.disabled(..)`, `.selected(..)`), ein Listener pro Event (`.on_press(..)`), die typisierten Stilmethoden (`.px_4()`, `.bg(..)`) für das Aussehen, die Zustandsmethoden (`.active(..)`, `.hover(..)`, `.focus(..)`, `.selected_style(..)`, `.disabled_style(..)`) für die Zustände und `.child(..)` für den Inhalt.

## Props

| Prop | Rust | Typ | Standard | Beschreibung |
|---|---|---|---|---|
| `disabled` | `.disabled(..)` | `boolean` | `false` | Keine Drücke und kein Druck-Feedback; `disabled:`-Stile greifen, und Screenreader melden den Button als abgeblendet. |
| `selected` | `.selected(..)` | `boolean` | `false` | Ausgewählt: ein eingeschalteter Umschalter, der aktuelle Tab. Screenreader melden das. Den Wert besitzt und gestaltet die App. |
| `selectedStyle` | `.selected_style(\|s\| ..)` | `StyleProp<ViewStyle>` | keiner | Der Stil, solange `selected` gilt und der Button nicht deaktiviert ist, als `selected:`-Klassen. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | keiner | Was Screenreader sagen, wenn der Inhalt nicht genügt, etwa bei einem Icon. |
| `role` | `.role(..)` | `AccessibilityRole` | `"button"` | Was der Button für Screenreader ist, wenn keine `nsh/base`-Komponente dieses Steuerelement ist: `"link"` (öffnet eine URL), ... |
| `hitSlop` | `.hit_slop(..)` | `number \| Partial<Edges>` | keiner | Wie weit außerhalb seiner Grenzen Drücke noch zählen, in Punkten: eine Zahl für alle Seiten oder die benannten Seiten. Wie bei `hitSlop` einer View. |
| `children` | `.child(..)` | `JSX.Element` | keiner | Der Inhalt: Text, ein Icon, ein beliebiges Layout. |
| `class`, `style` | Stilmethoden | `string`, `StyleProp<ViewStyle>` | keiner | Sein gesamtes Aussehen. |
| `activeStyle`, `hoverStyle`, `focusStyle`, `disabledStyle` | `.active(\|s\| ..)`, `.hover(..)`, `.focus(..)`, `.disabled_style(..)` | `StyleProp<ViewStyle>` | keiner | Der Stil im gedrückten, überfahrenen, fokussierten oder deaktivierten Zustand, als `<state>:`-Klassen. Spätere Zustände haben Vorrang; `disabled` schlägt alle anderen. |

In Rust ist jede Prop ein Setter, der einen Wert, ein Signal oder eine Closure annimmt; nicht gesetzte Props behalten ihre Standardwerte:

```rust
button()
    .disabled(move || saving.get())
    .accessibility_label("Save")
```

## Events

| Event | Rust | Beschreibung |
|---|---|---|
| `onPress` | `.on_press(\|\| ..)` | Der Button wurde gedrückt: ein Tap, ein Klick, Return oder Leertaste bei Tastaturfokus oder die Aktivierung durch einen Screenreader. |
| `onPressDown` | `.on_press_down(\|\| ..)` | Ein Druck hat auf ihm begonnen. |
| `onPressUp` | `.on_press_up(\|\| ..)` | Der Druck ist beendet: losgelassen, weggezogen oder abgebrochen. |

`onPressDown` und `onPressUp` dienen eigenem Druck-Feedback, etwa einer Federung oder einer Hervorhebung, die die Zustandsstile nicht ausdrücken. Ein deaktivierter Button meldet keines davon.

## Styling

Das Aussehen eines Buttons ist Sache deiner App: Die App entscheidet, was ein primärer oder ein sekundärer Button ist. Ein Paar kleiner Komponenten hält diese Entscheidung an einer Stelle:

```rust tabs
use nsh_base::button;
use nsh_core::prelude::*;

/// A filled button, darker while pressed.
fn primary(label: &'static str, on_press: impl Fn() + 'static) -> impl IntoElement {
    button()
        .on_press(on_press)
        .items_center()
        .rounded_lg()
        .px_4()
        .py_3()
        .bg(rgb(0x2563eb))
        .active(|s| s.bg(rgb(0x1d4ed8)))
        .disabled_style(|s| s.opacity(0.4))
        .child(text(label).text_color(white()).font_weight(FontWeight::SEMIBOLD))
}

/// An outlined button.
fn secondary(label: &'static str, on_press: impl Fn() + 'static) -> impl IntoElement {
    button()
        .on_press(on_press)
        .items_center()
        .rounded_lg()
        .px_4()
        .py_3()
        .border_1()
        .border_color(rgb(0xd4d4d4))
        .hover(|s| s.bg(rgb(0xfafafa)))
        .active(|s| s.bg(rgb(0xf5f5f5)))
        .child(text(label).text_color(rgb(0x171717)))
}
```

```tsx tabs
import { Text } from "nsh";
import { Button } from "nsh/base";

function Primary(props: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Button
      onPress={props.onPress}
      disabled={props.disabled}
      class="items-center rounded-lg bg-blue-600 px-4 py-3 active:bg-blue-700 disabled:opacity-40"
    >
      <Text class="font-semibold text-white">{props.label}</Text>
    </Button>
  );
}

function Secondary(props: { label: string; onPress: () => void }) {
  return (
    <Button
      onPress={props.onPress}
      class="items-center rounded-lg border border-neutral-300 px-4 py-3 active:bg-neutral-100 hover:bg-neutral-50"
    >
      <Text class="text-neutral-900">{props.label}</Text>
    </Button>
  );
}
```

Die Zustandsvarianten werden nativ angewendet: Ein Druck dunkelt den Button im Main-Thread ab, ohne dass JS oder Rust läuft. In Rust sind die Zustandsmethoden dieselben Varianten: `.active(..)`, `.hover(..)`, `.focus(..)`, `.selected_style(..)` und `.disabled_style(..)` folgen den eigenen Zuständen des Buttons. Die Farben deines Themes funktionieren genauso: `bg-primary` in TSX, `theme().primary` in Rust (siehe [Theme tokens](../docs/tailwind.md#theme-tokens)).

## Disabled

Ein deaktivierter Button nimmt keine Drücke an und gibt kein Feedback, und Screenreader melden ihn als abgeblendet. Sein Aussehen im deaktivierten Zustand bestimmst du, mit `disabled:`-Klassen oder `disabledStyle`:

```rust tabs
fn save(saving: Signal<bool>) -> impl IntoElement {
    button()
        .disabled(saving)
        .on_press(move || saving.set(true))
        .rounded_lg()
        .px_4()
        .py_3()
        .bg(rgb(0x2563eb))
        .disabled_style(|s| s.opacity(0.4))
        .child(text("Save").text_color(white()))
}
```

```tsx tabs
<Button disabled={saving()} onPress={save} class="rounded-lg bg-blue-600 px-4 py-3 disabled:opacity-40">
  <Text class="text-white">Save</Text>
</Button>
```

<a id="a-toggle-with-selected"></a>

## Ein Umschalter mit selected

`selected` macht einen Button zum Umschalter: der Fett-Button einer Toolbar, ein Filter-Chip, der aktuelle Tab. Die App hält den Wert, ändert ihn in `onPress` und gestaltet den ausgewählten Zustand; Screenreader melden den Button als ausgewählt.

```rust tabs
fn bold(on: Signal<bool>) -> impl IntoElement {
    button()
        .selected(on)
        .accessibility_label("Bold")
        .on_press(move || on.update(|on| *on = !*on))
        .size(px(40.0))
        .items_center()
        .justify_center()
        .rounded_md()
        .selected_style(|s| s.bg(rgb(0xdbeafe)))
        .child(text("B").font_weight(FontWeight::BOLD))
}
```

```tsx tabs
<Button
  selected={bold()}
  onPress={() => bold.set(!bold())}
  accessibilityLabel="Bold"
  class="size-10 items-center justify-center rounded-md selected:bg-blue-100"
>
  <Text class="font-bold">B</Text>
</Button>
```

Eine Reihe von Tabs ist [`Tabs`](./tabs.md) und ein Ein-/Aus-Steuerelement ist [`Switch`](./switch.md), aus `nsh/base`: Sie besitzen die Rolle, den Auswahlzustand und die Tastaturbedienung ihrer Art, was ein `Button` mit `role="tab"` oder `role="switch"` nicht leistet.

<a id="a-small-target-with-hitslop"></a>

## Ein kleines Ziel mit hitSlop

Ein Icon-Button kann kleiner sein als ein Finger. `hitSlop` lässt Drücke in seiner Nähe zählen, in Punkten über jede Seite hinaus, ohne sein Layout oder sein Aussehen zu ändern: eine Zahl für alle Seiten oder die benannten Seiten (`{ top: 8, bottom: 8 }`), so wie [`hitSlop` einer View](./index.md#presses-and-feedback) sie annimmt.

```rust tabs
fn close(open: Signal<bool>) -> impl IntoElement {
    button()
        .hit_slop(EdgeInsets::all(px(12.0)))
        .accessibility_label("Close")
        .on_press(move || open.set(false))
        .size(px(20.0))
        .items_center()
        .justify_center()
        .child(text("×"))
}
```

```tsx tabs
<Button hitSlop={12} accessibilityLabel="Close" onPress={() => open.set(false)} class="size-5 items-center justify-center">
  <Text>×</Text>
</Button>
```

<a id="accessibility"></a>

## Barrierefreiheit

- Ein Button ist für Screenreader ein einziges Element mit der Rolle `"button"`, sofern `role` nichts anderes sagt. Seine Beschriftung ist sein Textinhalt; gib `accessibilityLabel` an, wenn der Inhalt ein Icon ist oder zu wenig sagt.
- `disabled` und `selected` werden so angesagt, wie die Plattform sie ansagt (VoiceOver, TalkBack, UI Automation, der Accessibility-Tree des Browsers).
- Unter macOS und im Web ist ein Button ein Haltepunkt des Tastaturfokus: Mit Tab erreichst du ihn, Return und Leertaste drücken ihn, und `focus:`-Stile zeigen, wo der Fokus liegt.

Allgemeines zu Beschriftungen, Rollen und Ansagen findest du unter [Accessibility](../docs/accessibility.md).

<a id="platform-notes"></a>

## Hinweise zu Plattformen

- iOS, Android und Mac Catalyst: Ein Druck ist ein Tap, der auf dem Button endet; Wegziehen bricht ihn ab, wie bei den Buttons des Systems.
- Desktops (macOS, Windows, Linux, GPUI) und Web: Ein Druck ist ein Klick. Unter macOS und im Web drücken auch Return und Leertaste den Button, der den Tastaturfokus hat. `hover:`-Stile greifen bei einer Maus oder dem Zeiger eines Trackpads.
- Jede Plattform zeichnet, was die App gestaltet: Druck-Feedback sind `active:` / `activeStyle` oder eine eigene Animation.
