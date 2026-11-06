---
title: "Slider"
description: "Die Slider-Komponente: ein Wert oder ein Bereich aus zwei Werten, der entlang einer Leiste (Track) ausgewählt wird, mit Tippen und Ziehen auf Touchscreens und mit der Maus, den Slider-Tasten von WAI-ARIA und einem Wert für Screenreader an jedem Thumb sowie einem Track, einem Indikator, einem Bereich und Thumbs, die die App gestaltet."
group: base
demo: el-slider
source_hash: 5dfd7ea970e4cd98
---


# Slider

Ein Slider wählt einen Wert entlang eines Tracks (eine Lautstärke, eine Helligkeit) oder einen Bereich aus zwei Werten mit je einem Thumb (eine Preisspanne). Er bringt sein Verhalten selbst mit: Ein Druck auf den Track bewegt den näheren Thumb dorthin, ein Thumb folgt einem Ziehen, mit Maus oder Finger; Werte rasten auf `step` ein; jeder Thumb ist ein Haltepunkt des Tastaturfokus, bewegt sich mit den Pfeiltasten und ist für Screenreader ein einstellbares Element mit eigenem Wert. Das Aussehen bestimmt die App: Ein `Slider` hat keine eigenen Farben, Größen, Radien oder Animationen. Er besteht aus einem Track mit einem Indikator darin, dem Bereich und den Thumbs auf dem Indikator, dann seinen Kindern (ein Label, der Wert als Text), und die App gestaltet jeden Teil.

```rust tabs
use nsh_base::{SliderValue, slider, theme};
use nsh_core::prelude::*;

fn strength(level: Signal<SliderValue>) -> impl IntoElement {
    let percent = move || format!("{}%", level.get().end());
    slider()
        .value(move || level.get())
        .accessibility_label("Option strength")
        .on_change(move |next: &SliderValue| level.set(*next))
        // The value in a column after the rail.
        .flex_row()
        .items_center()
        .gap_2()
        // An 8-point rail; the thumbs travel inside it.
        .track_style(|s| s.h(px(8.0)).flex_1().px(px(8.0)).rounded_full().bg(move || theme().muted))
        .indicator_style(|s| s.h_full())
        // The fill, from the rail's edge, fading into the thumb's tone.
        .range_style(|s| {
            s.ml(-px(8.0))
                .rounded_full()
                .bg_linear_to_r()
                .gradient_from(move || theme().primary)
                .gradient_to(move || theme().muted_foreground)
        })
        // A 16 x 8 pill sitting in the rail.
        .thumb_style(|s| {
            s.w(px(16.0))
                .h(px(8.0))
                .rounded_full()
                .bg(move || theme().muted_foreground)
                .hover(|s| s.brightness(1.1))
                .active(|s| s.brightness(1.25))
        })
        .child(
            text(percent)
                .w(px(42.0))
                .text_right()
                .text_xs()
                .tabular_nums()
                .text_color(move || theme().muted_foreground),
        )
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { Slider } from "nsh/base";

function App() {
  const strength = signal(64);
  return (
    <Slider
      value={strength()}
      onChange={({ value }) => strength.set(value as number)}
      accessibilityLabel="Option strength"
      class="flex-row items-center gap-2"
      trackClass="h-2 flex-1 px-2 rounded-full bg-muted focus-within:ring-2 focus-within:ring-primary/36 focus-within:ring-offset-2 focus-within:ring-offset-background disabled:opacity-35"
      indicatorClass="h-full"
      rangeClass="-ml-2 rounded-full bg-linear-to-r from-primary via-primary to-muted-foreground"
      thumbClass="h-2 w-4 rounded-full bg-muted-foreground transition hover:brightness-110 active:brightness-125 focus:outline-none disabled:brightness-100 motion-reduce:transition-none"
      thumbStyle={{ boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.18), 0 0 0 1px rgba(0, 0, 0, 0.42)" }}
    >
      <Text class="w-[42px] text-right font-mono text-[11px] text-muted-foreground">{`${strength()}%`}</Text>
    </Slider>
  );
}

mount(App);
```

`Slider` kommt aus [`nsh/base`](../modules/nsh-base.md), dem `nsh-base`-Crate in Rust. In Rust erzeugt `slider()` einen Slider mit einem Setter pro Prop (`.value(..)`, `.thumb_style(..)`), einer Listener-Methode pro Event (`.on_change(..)`), den typisierten Style-Methoden für den Slider selbst und `.child(..)` für sein Label. Sein Wert ist ein `SliderValue`: `Single(f64)` oder `Range(f64, f64)`.

<a id="value"></a>

## Wert

Der Wert ist eine Zahl oder `[start, end]` für einen Bereich mit zwei Thumbs; die Form des Werts entscheidet, wie viele Thumbs es gibt. Die App besitzt ihn mit `value` und setzt den Wert, den `onChange` meldet, wie bei jedem Steuerelement von `nsh/base`; oder sie überlässt den Wert dem Slider mit `defaultValue` und bekommt die Änderungen trotzdem mit. Während eines Ziehens folgen Thumbs und Bereich dem Zeiger im selben Frame, nativ; wenn der Zeiger losgelassen wird, zeigt der Slider wieder den App-Wert `value`, so wie die App ihn für die letzte Änderung des Ziehens gesetzt hat; Screenreader bekommen die Werte eines Ziehens laufend zu hören, solange es läuft, sonst nur den Endwert.

```tsx
const price = signal<[number, number]>([200, 800]);

<Slider
  value={price()}
  onChange={({ value }) => price.set(value as [number, number])}
  onChangeEnd={({ value }) => save(value)}
  min={0}
  max={1000}
  step={10}
  accessibilityLabel="Maximum price"
  startAccessibilityLabel="Minimum price"
/>;
```

- `onChange` meldet jeden neuen Wert, den der Nutzer anfordert: bei einem Druck auf den Track, bei jedem Schritt eines Ziehens, bei jeder Taste. Jede Meldung ist ein neuer Wert.
- `onChangeEnd` meldet den Wert, bei dem die Änderung endete, einmal: wenn der Zeiger nach einem Druck oder Ziehen, das einen Wert gesetzt hat, losgelassen wird, sowie nach jedem Tasten- oder Screenreader-Schritt (jeder ist eine ganze Änderung). Speichere oder sende den Wert dort.
- Werte rasten auf `step` ein, gezählt ab `min` (`min={1} step={2}` ergibt 1, 3, 5, ...), und bleiben zwischen `min` und `max`; `max` ist immer erreichbar, daher ist der letzte Schritt kürzer, wenn der Bereich keine ganze Zahl von Schritten umfasst. `step={0}` akzeptiert jeden Wert.
- Die Thumbs eines Bereichs kreuzen sich nie: Ein gezogener Thumb stoppt am anderen. Ein Ziehen, das bei zwei Thumbs mit demselben Wert beginnt, bewegt den, der in Richtung des Zeigers gehen kann.
- Der angezeigte Wert ist der der App, begrenzt auf `min` und `max` (bei einem Bereich die Enden in Reihenfolge); ein Wert abseits des Schrittrasters wird dort angezeigt, wo er liegt, und die nächste Änderung des Nutzers rastet ein.

## Props

| Prop | Rust | Typ | Standard | Beschreibung |
|---|---|---|---|---|
| `value` | `.value(..)` | `number \| [number, number]` | keiner | Der Wert (kontrolliert): eine Zahl oder ein Bereich mit zwei Thumbs. Die App setzt den Wert, den `onChange` meldet. |
| `defaultValue` | `.default_value(..)` | `number \| [number, number]` | `0` | Der Anfangswert, solange `value` nicht gesetzt ist; der Slider behält dann seinen eigenen. |
| `min` | `.min(..)` | `number` | `0` | Der kleinste Wert. |
| `max` | `.max(..)` | `number` | `100` | Der größte Wert; ein Wert unterhalb von `min` wird zu `min`. |
| `step` | `.step(..)` | `number` | `1` | Die Schrittweite, auf die Werte einrasten, gezählt ab `min`; `0` akzeptiert jeden Wert. |
| `scale` | `.scale(..)` | `"linear" \| "logarithmic"` | `"linear"` | Wie sich die Werte entlang des Tracks verteilen: gleichmäßig oder nach Größenordnungen (von 1 bis 1000 liegt bei einem Drittel der Strecke die 10). Logarithmisch braucht `min` über 0; bei einem niedrigeren `min` ist sie linear. |
| `axis` | `.axis(..)` | `"horizontal" \| "vertical"` | `"horizontal"` | Die Richtung des Tracks: `min` am Anfang (links, in einem Rechts-nach-links-Layout rechts) oder unten. Wird gelesen, wenn der Slider erstellt wird. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Keine Änderungen durch Zeiger, Tastatur oder Screenreader; `disabled:`-Klassen gelten für den Slider und seine Teile. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | keiner | Was Screenreader für den Thumb sagen (bei einem Bereich für den Thumb am Ende). |
| `startAccessibilityLabel` | `.start_accessibility_label(..)` | `string` | `accessibilityLabel` | Was Screenreader für den Start-Thumb eines Bereichs sagen. |
| `trackClass`, `trackStyle` | `.track_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | keiner | Der Track: die Fläche, die Drücken und Ziehen annimmt. |
| `indicatorClass`, `indicatorStyle` | `.indicator_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | keiner | Der Indikator, die Schiene, auf die die Werte abgebildet werden. |
| `rangeClass`, `rangeStyle` | `.range_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | keiner | Der Bereich, von `min` bis zum Thumb (bei einem Bereich zwischen dessen Thumbs), vom Slider platziert. |
| `thumbClass`, `thumbStyle` | `.thumb_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | keiner | Jeder Thumb, auf seinem Wert zentriert. |
| `children` | `.child(..)` | `JSX.Element` | keiner | Der Inhalt nach dem Track: ein Label, der Wert als Text. |
| `class`, `style` | Style-Methoden | `string`, `StyleProp<ViewStyle>` | keiner | Der Slider selbst: die Spalte (oder Zeile) um Track und Label. |

## Events

| Event | Rust | Payload | Wann |
|---|---|---|---|
| `onChange` | `.on_change(\|value: &SliderValue\| ..)` | `{ value: number \| [number, number] }` | Der Nutzer hat einen neuen Wert angefordert: ein Druck auf den Track, ein Schritt eines Ziehens, eine Taste, ein Erhöhen oder Verringern per Screenreader. |
| `onChangeEnd` | `.on_change_end(\|value: &SliderValue\| ..)` | `{ value: number \| [number, number] }` | Die Änderung ist beendet: Der Zeiger wurde losgelassen, eine Taste oder ein Screenreader-Schritt wurde ausgeführt. Einmal pro Änderung. |

<a id="parts"></a>

## Teile

| Teil | Darin | Gestaltet mit |
|---|---|---|
| Der Slider | | `class`, `style` |
| Der Track | der Slider, als Erstes | `trackClass`, `trackStyle` |
| Der Indikator | der Track | `indicatorClass`, `indicatorStyle` |
| Der Bereich | der Indikator, von den Werten platziert | `rangeClass`, `rangeStyle` |
| Ein Thumb (zwei bei einem Bereich) | der Indikator, auf seinem Wert zentriert | `thumbClass`, `thumbStyle` |
| Das Label | der Slider, nach dem Track | eigene Elemente (`children`) |

Der Track nimmt Drücken und Ziehen an. Die Länge des Indikators ist der Wertebereich, mit `min` an seiner vorderen Kante (bei vertikaler Ausrichtung an seiner Unterseite); der Slider platziert Bereich und Thumbs darauf, einen Thumb auf seinem Wert zentriert, gleich wie groß er ist. Zwei Möglichkeiten für das Layout:

- Der Track ist die Schiene (das Beispiel oben): `h-2 px-2 rounded-full bg-muted` mit einem `h-full`-Indikator. Das Padding hält die Thumbs an beiden Enden innerhalb der Schiene, und `-ml-2` am Bereich lässt die Füllung am eigenen Rand der Schiene beginnen.
- Der Track ist ein Band um die Schiene, höher, damit ein Finger ihn auf einem Touchscreen findet: `h-8 justify-center` mit einem `h-2 rounded-full`-Indikator (`w-8 items-center` und `w-2 h-full` bei einem vertikalen Slider).

Zustände, die die Teile zeigen:

- Ein Thumb: `hover:` unter dem Zeiger, `active:` während er gezogen wird, `focus:` mit dem Tastaturfokus, `disabled:`.
- Der Track: `active:`, solange ein Druck auf ihn zieht; er fungiert als `group`, daher übernehmen Indikator, Bereich und Thumbs `group-hover:` und `group-active:` von ihm.
- Jeder Teil: `disabled:`, solange dies auch für den Slider gilt.

Die Thumbs bewegen sich, wenn sich der Wert ändert, und folgen einem Ziehen sofort. Animationen der Thumb-Zustände sind Sache der App (`transition` für einen Thumb, der bei `hover:` und `active:` heller wird), und `motion-reduce:` hält sie still für Menschen, die weniger Bewegung wünschen. Der Tastaturfokus gehört einem Thumb: `focus-within:` am Track umrandet die ganze Schiene, während ein Thumb ihn hat, und das `focus:outline-none` des Thumbs ersetzt den eigenen Fokusrahmen der Plattform.

<a id="keyboard"></a>

## Tastatur

Unter macOS und im Web ist jeder Thumb ein Haltepunkt des Tastaturfokus (Tab), und der fokussierte Thumb nimmt die Slider-Tasten von WAI-ARIA an:

| Taste | Aktion |
|---|---|
| Pfeil rechts, Pfeil hoch | Ein Schritt aufwärts (auch bei einem vertikalen Slider). |
| Pfeil links, Pfeil runter | Ein Schritt abwärts. |
| Bild auf, Bild ab | Ein Zehntel des Bereichs aufwärts oder abwärts (entlang der Skala), mindestens ein Schritt. |
| Pos1, Ende | So weit nach unten oder oben, wie der Thumb kommt (der Start eines Bereichs bis zu dessen Ende). |

In einem Rechts-nach-links-Layout läuft ein horizontaler Slider von rechts, sein `min` am rechten Ende: Pfeil links ist ein Schritt aufwärts und Pfeil rechts ein Schritt abwärts, und ein Ziehen nach links erhöht den Wert. Ein vertikaler Slider behält Pfeil rechts und Pfeil hoch als Schritt aufwärts.

Jede Taste, die den Wert ändert, meldet `onChange` und dann `onChangeEnd`. Pfeile und Bild-Tasten wiederholen sich, solange sie gehalten werden. Die Tasten erreichen den Slider nur, solange keine Texteingabe bearbeitet wird.

<a id="accessibility"></a>

## Barrierefreiheit

- Jeder Thumb ist ein einstellbares Element (`"adjustable"`, im Browser ein slider) mit seinem Label, seinem Wert und den Werten, die er annehmen kann: der Start eines Bereichs von `min` bis zum Ende, das Ende vom Start bis `max`, sodass Screenreader beide lesen und setzen können. Der Wert wird als Zahl mit den Dezimalstellen des Schritts gesprochen (`2.5`).
- Die Aktionen Erhöhen und Verringern eines Screenreaders (bei VoiceOver das Wischen nach oben und unten) schalten den Thumb schrittweise weiter, wie die Pfeiltasten.
- Die Thumbs sind die Elemente des Sliders für Screenreader, benannt durch `accessibilityLabel` (und der Start eines Bereichs durch `startAccessibilityLabel`); ein sichtbares Label unter seinen Kindern wird dort gelesen, wo es steht.
- Bei `disabled` sagen Screenreader, dass die Thumbs abgeblendet sind, und sie nehmen keine Aktionen an.

Siehe [Barrierefreiheit](../docs/accessibility.md) für Labels, Rollen und Aktionen im Allgemeinen.

<a id="platform-notes"></a>

## Hinweise zu Plattformen

- Jede Plattform zeichnet, was die App gestaltet. Drücken und Ziehen werden im Core verfolgt, für Maus, Stift oder Finger, und eine Scroll-View um den Slider nimmt ein Ziehen, das auf ihm begann, nicht an.
- Tab bewegt den Tastaturfokus zwischen den Thumbs unter macOS und im Web, wo der fokussierte Thumb die Slider-Tasten annimmt.
- Screenreader: VoiceOver (iOS, macOS) und TalkBack stellen jeden Thumb ein; UI Automation (Windows), die Barrierefreiheit von GTK (Linux) und der Browser (`role="slider"`, `aria-valuenow`, `aria-valuetext`) erhalten Bereich und Wert.
