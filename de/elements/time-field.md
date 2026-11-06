---
title: "TimeField"
description: "Die TimeField-Komponente: eine Uhrzeit, die segmentweise bearbeitet wird, also Stunden, Minuten und Sekunden, entweder mit der Tastatur oder mit dem Ziffernblock eines Smartphones, und von der App gestaltet."
group: base
demo: el-date-picker
source_hash: 2c1c4d77c8f324de
---


# TimeField

Ein Zeitfeld bearbeitet eine Uhrzeit, Segment für Segment: die Stunde, die Minute, mit `precision="second"` die Sekunde und mit `hourCycle="h12"` AM oder PM. Die Zeit einer Erinnerung, der Beginn eines Meetings, die Öffnungszeiten eines Geschäfts. Es ist die Zeit unter dem Kalender von [DatePicker](./date-picker.md) mit `timePrecision`, allein auf der Seite.

Das Feld besitzt das Verhalten: die Zeit (die der App oder seine eigene), welches Segment die Tasten bearbeiten, das Eintippen und Hoch- bzw. Herunterzählen von Ziffern und was Screenreader vorlesen. Das Aussehen liegt bei der App: Sie gestaltet die Segmente und die `:` dazwischen oder zeichnet die Segmente selbst.

```rust tabs
use chrono::NaiveTime;
use nsh_base::{HourCycle, TimeFieldSegmentEntry, TimeOfDay, time_field};
use nsh_core::prelude::*;

fn reminder_time() -> impl IntoElement {
    let at = signal(TimeOfDay(NaiveTime::from_hms_opt(9, 30, 0).unwrap()));
    time_field()
        .value(move || Some(at.get()))
        .on_change(move |next: &TimeOfDay| at.set(*next))
        .hour_cycle(HourCycle::H12)
        .accessibility_label("Reminder time")
        .segment_class("rounded-sm focus:bg-accent disabled:opacity-50")
        .render_segment(|segment: &TimeFieldSegmentEntry| view().px_1().child(text(segment.label.clone())))
}
```

```tsx tabs
import { mount, signal } from "nsh";
import { TimeField } from "nsh/base";

function App() {
  const at = signal("09:30");
  return (
    <TimeField
      value={at()}
      onChange={({ value }) => at.set(value)}
      hourCycle="h12"
      accessibilityLabel="Reminder time"
      class="h-9 w-32 flex-row items-center rounded-md border border-input px-2"
      segmentClass="rounded-sm px-0.5 text-sm tabular-nums focus:bg-accent focus:text-accent-foreground"
      separatorClass="text-sm text-muted-foreground"
    />
  );
}

mount(App);
```

`TimeField` stammt aus [`nsh/base`](../modules/nsh-base.md), dem `nsh-base`-Crate in Rust. In Rust erzeugt `time_field()` eines mit einem Setter pro Prop (`.value(..)`, `.precision(..)`, `.hour_cycle(..)`) und einem Listener pro Event (`.on_change(..)`). Seine Zeit ist ein `TimeOfDay`, ein `chrono::NaiveTime`.

<a id="value"></a>

## Wert

Der Wert ist eine Uhrzeit im 24-Stunden-Format, wie bei einem HTML-`<input type="time">`: `"HH:MM"` oder `"HH:MM:SS"` mit `precision="second"`, je nachdem, welche `hourCycle` das Feld anzeigt. Mit `value` gehört der Wert der App: Das Feld zeigt ihn an und meldet jede Änderung mit `onChange({ value })`; die App setzt `value`, um ihr zu folgen. Ohne diese Angabe behält das Feld seine eigene Zeit, zunächst aus `defaultValue` (Standard `00:00`).

`precision` ist die kleinste Einheit, die das Feld bearbeitet: `"minute"` (Standard) oder `"second"`. `hourCycle` legt fest, wie die Stunden gezählt werden: `"h23"` (Standard) von 00 bis 23, `"h12"` von 12 bis 11 mit einem AM/PM-Segment nach den Zahlen.

<a id="editing"></a>

## Bearbeiten

Ein Segment ist ausgewählt; die Tasten bearbeiten es, wie beim Zeitfeld von `gpui-base`:

- Pfeil nach oben und Pfeil nach unten ändern das Segment um eins und springen am Ende wieder an den Anfang (59 zu 00), ohne in das nächste Segment zu übertragen.
- Ziffern werden in das Segment eingetippt, jeweils zwei: Eine Ziffer, die keinen längeren Wert beginnen kann (eine `7` bei der Stunde), schließt das Segment ab und springt zum nächsten.
- `a` und `p` setzen AM und PM.
- Rücktaste und Entf setzen das Segment zurück.

Ein Tippen auf ein Segment wählt es aus. Ein Tippen auf das ausgewählte AM/PM-Segment schaltet es um, da Smartphones keine `a`- und `p`-Tasten haben. Die Tasten gehen an ein natives, transparentes Textfeld hinter den Segmenten, wie bei einem [OtpInput](./otp-input.md): Auf Smartphones und Tablets öffnet es den Ziffernblock.

## Props

| Prop | Rust | Typ | Standard | Beschreibung |
|---|---|---|---|---|
| `value` | `.value(..)` | `string` | keiner | Die Zeit, von der App verwaltet. |
| `defaultValue` | `.default_value(..)` | `string` | `"00:00"` | Die Anfangszeit, ohne `value`. |
| `precision` | `.precision(..)` | `"minute" \| "second"` | `"minute"` | Die kleinste Einheit, die bearbeitet wird. |
| `hourCycle` | `.hour_cycle(..)` | `"h23" \| "h12"` | `"h23"` | Wie die Stunden gezählt werden; `"h12"` fügt ein AM/PM-Segment hinzu. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Kein Fokus und keine Bearbeitung; `disabled:`-Stile gelten für das Feld und seine Segmente. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | keiner | Wie Screenreader das Feld benennen. |
| `segmentClass`, `segmentStyle` | `.segment_class(..)`, `.segment_style(..)` | `string`, `StyleProp<TextStyle>` | keiner | Jedes Segment: `focus:` beim ausgewählten, solange das Feld den Fokus hat, `disabled:` mit dem Feld; mit `group` folgt sein Inhalt ihnen (`group-focus:`, `group-disabled:`). |
| `separatorClass`, `separatorStyle` | `.separator_class(..)`, `.separator_style(..)` | `string`, `StyleProp<TextStyle>` | keiner | Jedes `:` zwischen den Zahlen. |
| `renderSegment` | `.render_segment(..)` | `(segment: TimeFieldSegmentEntry) => JSX.Element` | keiner | Der Inhalt eines Segments, von der App aus dem gezeichnet, was es anzeigt; sonst sein Label. |
| `class`, `style` | Style-Methoden | `string`, `StyleProp<ViewStyle>` | keiner | Das Feld, um seine Segmente herum (eine Zeile). |

`renderSegment` erhält ein `TimeFieldSegmentEntry`: `segment` (`"hour"`, `"minute"`, `"second"` oder `"period"`), `value` (die Stunde auf der Uhr des Felds, die Minute oder die Sekunde; `0` für AM und `1` für PM) und `label` (zwei Ziffern oder `AM` / `PM`). Den Zustand des Segments erhält es nie: Das Segment ist `focus:`, solange die Tasten es bearbeiten, und `disabled:` mit dem Feld, und mit `group` in `segmentClass` folgt sein Inhalt mit `group-focus:` und `group-disabled:`. Ein Segment wird also nur neu gezeichnet, wenn sich sein Wert ändert; der Wechsel zwischen den Segmenten und das Kommen und Gehen des Fokus zeichnen nichts neu:

```tsx
<TimeField
  segmentClass="group rounded-sm px-0.5 focus:bg-primary"
  renderSegment={(segment) => <Text class="text-sm tabular-nums text-foreground group-focus:text-primary-foreground">{segment.label}</Text>}
/>
```

## Events

| Event | Rust | Beschreibung |
|---|---|---|
| `onChange` | `.on_change(\|value\| ..)` | Der Nutzer hat die Zeit geändert: `{ value }`. Setze `value`, um ihr zu folgen. Ein `value`, das die App übergibt, wird nie gemeldet. |

<a id="parts"></a>

## Teile

| Teil | Wo | Gestaltet mit |
|---|---|---|
| Das Feld | die Wurzel, eine Zeile | `class`, `style` |
| Ein Segment | das Feld: Stunde, Minute, Sekunde, AM/PM | `segmentClass`, `segmentStyle`, `renderSegment` (`group-focus:`, `group-disabled:` darin, unter `group` in `segmentClass`) |
| Ein Trennzeichen | das Feld, zwischen zwei Zahlen | `separatorClass`, `separatorStyle` |

<a id="keyboard"></a>

## Tastatur

Mit Tab erreicht man das Feld mit seinem ausgewählten Segment. Dann gilt:

| Taste | Aktion |
|---|---|
| Links / Rechts | Das vorherige bzw. nächste Segment. |
| Tab / Shift+Tab | Das nächste bzw. vorherige Segment; Tab vom letzten und Shift+Tab vom ersten Segment verlassen das Feld. |
| Hoch / Runter | Ändert das Segment um eins und springt am Ende wieder an den Anfang. |
| 0 bis 9 | Tippt in das Segment. |
| A / P | AM oder PM. |
| Rücktaste, Entf | Setzt das Segment zurück. |

<a id="accessibility"></a>

## Barrierefreiheit

- Das Feld ist ein Textfeld, das durch `accessibilityLabel` benannt wird; Screenreader lesen die angezeigte Zeit vor. `disabled` blendet es ab.
- Smartphones und Tablets zeigen den Ziffernblock.

Allgemeines zu Labels, Rollen und Ansagen findest du unter [Accessibility](../docs/accessibility.md).
