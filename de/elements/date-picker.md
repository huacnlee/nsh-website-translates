---
title: "DatePicker"
description: "Die DatePicker-Komponente: ein Datum, ein Datumsbereich oder Datum und Uhrzeit, die aus einem Kalender ausgewählt werden, und zwar in einem Popup am Auslöser auf Desktops und in einem Sheet auf Smartphones, gestaltet von der App."
group: base
demo: el-date-picker
source_hash: ba9910b03fe753f3
---


# DatePicker

Ein Date Picker legt ein Datum über einen [Calendar](./calendar.md) fest, der sich vom Trigger der App aus öffnet: ein Fälligkeitsdatum, ein Geburtstag, mit `range` die Tage einer Reise, mit `timePrecision` ein Datum samt Uhrzeit. Wie [Select](./select.md) öffnet er sich so, wie es jedes Gerät erwartet:

- Auf Desktops und in Desktop-Browsern als Popup am Trigger; beim Öffnen liegt der Tastaturfokus auf den Tagen.
- Auf Smartphones und Tablets als Sheet am unteren Bildschirmrand über einem Backdrop.

Der Picker besitzt das Verhalten: den Wert (den der App oder seinen eigenen), den Öffnungszustand, den Kalender, die Uhrzeit, die Presets, die Tastatur und das, was Screenreader vorlesen. Das Aussehen liegt bei der App: Sie zeichnet den Trigger (mit dem Wert, einem Platzhalter, einem Icon) und gestaltet das Popup, die Teile des Kalenders, die Presets und das Zeitfeld.

```rust tabs
use chrono::NaiveDate;
use nsh_base::{DateRangePreset, DateTime, PickedDate, date_picker, theme};
use nsh_core::prelude::*;

fn trip_dates() -> impl IntoElement {
    let trip = signal(DateTime::Range(None, None));
    let title = move || {
        trip.get()
            .format("%b %-d")
            .map(|s| s.to_string())
            .unwrap_or_else(|| "Pick dates".to_string())
    };
    let day = |m, d| NaiveDate::from_ymd_opt(2026, m, d).unwrap();
    date_picker()
        .range(true)
        .number_of_months(2)
        .value(move || trip.get())
        .on_change(move |next: &PickedDate| trip.set(next.value))
        .presets(vec![
            DateRangePreset::range("This week", day(10, 25), day(10, 31)),
            DateRangePreset::range("Next week", day(11, 1), day(11, 7)),
        ])
        .accessibility_label("Trip")
        .offset(px(4.0))
        .popup_style(|s| {
            s.p_3()
                .rounded_lg()
                .border_1()
                .border_color(move || theme().border)
                .bg(move || theme().popover)
                .shadow_md()
        })
        .trigger(
            view()
                .h_9()
                .w_56()
                .px_3()
                .justify_center()
                .rounded_md()
                .border_1()
                .border_color(move || theme().input)
                .child(text(title)),
        )
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { DatePicker, type DatePickerValue } from "nsh/base";

function App() {
  const due = signal<DatePickerValue>(null);
  return (
    <DatePicker
      value={due()}
      onChange={({ value }) => due.set(value)}
      timePrecision="minute"
      cleanable
      clearButton={<Text>×</Text>}
      clearButtonAccessibilityLabel="Clear the due date"
      presets={[{ label: "Tomorrow 9:00", value: "2026-10-29T09:00" }]}
      accessibilityLabel="Due"
      offset={4}
      popupClass="rounded-lg border border-border bg-popover p-3 text-popover-foreground shadow-md"
      backdropClass="bg-black/40"
      contentClass="flex-row gap-3"
      presetClass="rounded-md px-2 py-1.5 text-sm hover:bg-accent"
      headerClass="flex-row items-center justify-between"
      rowClass="flex-row justify-between"
      itemClass="h-8 min-w-8 items-center justify-center rounded-md text-sm focus:ring-2 focus:ring-ring selected:bg-primary selected:text-primary-foreground disabled:opacity-50"
      timeClass="mt-2 gap-3"
      timeLabel={<Text class="text-sm">Time</Text>}
      timeAccessibilityLabel="Due time"
      timeFieldClass="flex-row rounded-md border border-input px-2 py-1"
      segmentClass="text-sm tabular-nums focus:bg-accent"
      trigger={
        <View class="h-9 w-56 justify-center rounded-md border border-input px-3 hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring">
          <Text>{typeof due() === "string" ? (due() as string).replace("T", " ") : "Pick a date"}</Text>
        </View>
      }
    />
  );
}

mount(App);
```

`DatePicker` stammt aus [`nsh/base`](../modules/nsh-base.md), dem `nsh-base`-Crate in Rust. In Rust erzeugt `date_picker()` einen Picker mit einem Setter pro Prop (`.value(..)`, `.range(..)`, `.time_precision(..)`) und einem Listener pro Event (`.on_change(..)`). Sein Wert ist ein `DateTime` (`DateTime::Single`, `DateTime::Range`, aus `chrono` Datumsangaben oder Datums- und Zeitangaben); `onChange` liefert einen `PickedDate`, also den Wert mit der Zeitgenauigkeit des Pickers.

<a id="value"></a>

## Wert

Der Wert hat die Formen der HTML-Inputs: ein ISO-Datum, `"2026-10-28"`, wie das von `<input type="date">`; mit `range` `[start, end]`; mit `timePrecision` Datum und Uhrzeit, `"2026-10-28T09:30"` (`"2026-10-28T09:30:15"` bei Sekunden), wie das von `<input type="datetime-local">`; `null` bedeutet keinen Wert. Mit `value` gehört der Wert der App: Der Picker zeigt ihn an und meldet jede Änderung mit `onChange({ value })`; die App setzt `value`, um ihr zu folgen. Wird er weggelassen, behält der Picker seinen eigenen Wert, zunächst aus `defaultValue`.

- Einzelnes Datum: Ein Druck auf einen Tag setzt den Wert und schließt das Popup.
- Mit `range` beginnt der erste Druck den Bereich und der zweite beendet ihn, wie bei einem [Calendar](./calendar.md#value); der vollständige Bereich setzt den Wert und schließt das Popup.
- Mit `timePrecision` (nur bei einem einzelnen Datum) erscheint unter dem Kalender ein Zeitfeld, und jede Änderung der Uhrzeit wird gemeldet. Auf Desktops lässt die Auswahl eines Tages das Popup für die Uhrzeit geöffnet und meldet das Datum mit seiner Uhrzeit; ein erneuter Druck auf den ausgewählten Tag schließt das Popup. Auf Smartphones und Tablets wählt ein Tipp auf einen Tag diesen mit seiner Uhrzeit aus und schließt das Sheet, wie bei einem einzelnen Datum; für die Uhrzeit öffnet sich das Sheet erneut. Ein Tag, der vor jeder Uhrzeit gewählt wird, erhält `defaultTime` (Standard `00:00`). `hourCycle` legt fest, wie das Feld die Stunden zählt.

`cleanable` fügt eine Clear-Schaltfläche hinzu, solange ein Wert vorhanden ist: Ein Druck darauf löscht ihn (`onChange({ value: null })`). Sie steht nach dem Trigger, nicht darin, sodass ein Druck darauf nie das Popup öffnet; die App platziert und befüllt sie (`clearButton`), wie bei der [Clear-Schaltfläche eines Select](./select.md#value).

## Presets

`presets` sind Schaltflächen neben dem Kalender, die den Wert setzen: „Heute“, „Letzte 7 Tage“, „Morgen um 9“. Jedes ist `{ label, value }`, `value` ein Datum, einen Bereich oder Datums- und Zeitangaben, unverändert übernommen; ein Druck setzt es und schließt das Popup. `contentClass` ordnet die Spalte der Presets und den Kalender mit der Uhrzeit an (eine Zeile, `flex-row`); `presetsClass` gestaltet die Spalte, `presetClass` jede Schaltfläche.

<a id="the-calendar"></a>

## Der Kalender

Jede Prop von [Calendar](./calendar.md) außer dem Wert wird an die des Pickers weitergereicht: `numberOfMonths`, `firstDayOfWeek`, `disabledMatcher`, `yearRange`, `previousAccessibilityLabel`, `nextAccessibilityLabel`, die Parts (`headerClass` bis `itemStyle`) und `renderItem`. `calendarClass` und `calendarStyle` gestalten den Kalender selbst. Seine Ansichten und Tasten sind die eines Calendar.

Die Zeitzeile (`timeClass`, `timeStyle`) enthält an ihrem Anfang `timeLabel`, die Beschriftung der App dafür („Uhrzeit“), und an ihrem Ende das Zeitfeld (`timeFieldClass`, `timeFieldStyle`, `timeAccessibilityLabel`): eine Zeile, deren Elemente zentriert und auseinandergezogen sind (`flex-row items-center justify-between`, wie bei `gpui-component`). Die Segmente des Feldes entsprechen denen eines [TimeField](./time-field.md) (`segmentClass`, `separatorClass`, `renderSegment`).

## Props

| Prop | Rust | Typ | Standard | Beschreibung |
|---|---|---|---|---|
| `value` | `.value(..)` | `DatePickerValue` | keiner | Der Wert, der der App gehört. |
| `defaultValue` | `.default_value(..)` | `DatePickerValue` | `null` | Der Anfangswert, ohne `value`. |
| `range` | `.range(..)` | `boolean` | `false` | Einen Datumsbereich auswählen. |
| `open`, `defaultOpen` | `.open(..)`, `.default_open(..)` | `boolean` | `false` | Der Öffnungszustand, von der App oder vom Picker selbst verwaltet. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Er bleibt geschlossen und nimmt weder Drücke noch Tastaturfokus an. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | keiner | Wie Screenreader ihn nennen. |
| `dateFormat` | `.date_format(..)` | `string` | `"%Y/%m/%d"` und die Uhrzeit | Wie Screenreader den Wert vorlesen, im Format von `chrono`. |
| `timePrecision` | `.time_precision(..)` | `"minute" \| "second"` | keiner | Auch die Uhrzeit bearbeiten, bis hinunter zu dieser Genauigkeit. |
| `hourCycle` | `.hour_cycle(..)` | `"h23" \| "h12"` | `"h23"` | Wie das Zeitfeld die Stunden zählt. |
| `defaultTime` | `.default_time(..)` | `string` | `"00:00"` | Die Uhrzeit, die ein Datum erhält, bevor der Benutzer eine festlegt. |
| `cleanable` | `.cleanable(..)` | `boolean` | `false` | Eine Clear-Schaltfläche, solange ein Wert vorhanden ist. |
| `presets` | `.presets(..)` | `DateRangePreset[]` | `[]` | Schaltflächen im Popup, die den Wert setzen. |
| `numberOfMonths`, `firstDayOfWeek`, `disabledMatcher`, `yearRange` | wie bei `Calendar` | wie bei `Calendar` | wie bei `Calendar` | Die Monate, Wochen, deaktivierten Daten und Jahre des Kalenders. |
| `previousAccessibilityLabel`, `nextAccessibilityLabel` | wie bei `Calendar` | `string` | keiner | Was Screenreader für „Zurück“ und „Weiter“ des Kalenders ansagen. |
| `placement`, `align`, `offset`, `margin` | `.placement(..)`, ... | wie bei `Select` | `"bottom"`, `"start"`, 0, 0 | Desktops: Wo das Popup relativ zum Trigger erscheint. |
| `popupClass`, `popupStyle` | `.popup_class(..)`, `.popup_style(..)` | `string`, `StyleProp<ViewStyle>` | keiner | Das Popup (Desktops) oder das Sheet (Touchscreens). |
| `backdropClass`, `backdropStyle` | `.backdrop_class(..)`, `.backdrop_style(..)` | `string`, `StyleProp<ViewStyle>` | keiner | Das Backdrop hinter dem Sheet. |
| `contentClass`, `contentStyle` | `.content_class(..)`, `.content_style(..)` | `string`, `StyleProp<ViewStyle>` | keiner | Der Inhalt des Popups: die Presets neben dem Kalender und die Uhrzeit. |
| `presetsClass`, `presetsStyle` | `.presets_class(..)`, `.presets_style(..)` | `string`, `StyleProp<ViewStyle>` | keiner | Die Spalte der Presets. |
| `presetClass`, `presetStyle` | `.preset_class(..)`, `.preset_style(..)` | `string`, `StyleProp<TextStyle>` | keiner | Die Schaltfläche jedes Presets. |
| `calendarClass`, `calendarStyle` | `.calendar_class(..)`, `.calendar_style(..)` | `string`, `StyleProp<ViewStyle>` | keiner | Der Kalender. |
| `headerClass` … `itemStyle` | wie bei `Calendar` | wie bei `Calendar` | keiner | Header, Body, Monate, Zeilen und Elemente des Kalenders. |
| `renderItem` | `.render_item(..)` | `(item: CalendarEntry) => JSX.Element` | keiner | Jedes Element des Kalenders, von der App anhand dessen gezeichnet, was es ist; seine Zustände sind die Klassen der Elemente, wie bei `Calendar`. |
| `timeClass`, `timeStyle` | `.time_class(..)`, `.time_style(..)` | `string`, `StyleProp<ViewStyle>` | keiner | Die Zeile der Uhrzeit: ihre Beschriftung am Anfang, das Feld am Ende. |
| `timeLabel` | `.time_label(..)` | `JSX.Element` | keiner | Was die Zeile der Uhrzeit vor dem Feld zeigt. |
| `timeFieldClass`, `timeFieldStyle` | `.time_field_class(..)`, `.time_field_style(..)` | `string`, `StyleProp<ViewStyle>` | keiner | Das Zeitfeld. |
| `timeAccessibilityLabel` | `.time_accessibility_label(..)` | `string` | keiner | Wie Screenreader das Zeitfeld nennen. |
| `segmentClass`, `segmentStyle`, `separatorClass`, `separatorStyle`, `renderSegment` | wie bei `TimeField` | wie bei `TimeField` | keiner | Die Segmente des Zeitfeldes und `:`. |
| `clearButtonClass`, `clearButtonStyle` | `.clear_button_class(..)`, `.clear_button_style(..)` | `string`, `StyleProp<ViewStyle>` | keiner | Die Clear-Schaltfläche (`cleanable`). |
| `clearButton` | `.clear_button(..)` | `JSX.Element` | keiner | Der Inhalt der Clear-Schaltfläche. |
| `clearButtonAccessibilityLabel` | `.clear_button_accessibility_label(..)` | `string` | keiner | Wie Screenreader die Clear-Schaltfläche nennen. |
| `trigger` | `.trigger(..)` | `JSX.Element` | keiner | Was beim Drücken das Popup öffnet; das Popup wird relativ dazu platziert. |
| `class`, `style` | Style-Methoden | `string`, `StyleProp<ViewStyle>` | keiner | Die View um den Trigger. |

## Events

| Event | Rust | Beschreibung |
|---|---|---|
| `onChange` | `.on_change(\|value\| ..)` | Der Wert hat sich geändert (ein Tag, das Ende eines Bereichs, ein Preset, die Uhrzeit, die Clear-Schaltfläche): `{ value }`. Setze `value`, um ihm zu folgen. |
| `onOpenChange` | `.on_open_change(\|e\| ..)` | Das Popup wurde geöffnet oder geschlossen, mit dem Grund (`{ open, reason }`). Setze `open`, um ihm zu folgen. |
| `onOpen`, `onClose` | `.on_open(..)`, `.on_close(..)` | Das Popup wird angezeigt bzw. ist verschwunden. |
| `onCancel` | `.on_cancel(..)` | Der Benutzer hat das Popup ohne Auswahl geschlossen (Escape oder Zurück, ein Druck außerhalb oder auf das Backdrop). |

## Parts

| Part | Wo | Gestaltet mit |
|---|---|---|
| Der Trigger | die View des Pickers | dem eigenen Element der App (`trigger`) |
| Die Clear-Schaltfläche | die View des Pickers, nach dem Trigger (`cleanable`, solange ein Wert vorhanden ist) | `clearButtonClass`, `clearButtonStyle`; ihr Inhalt `clearButton` |
| Das Popup oder Sheet | über allem, am Trigger (Desktops) oder am unteren Rand (Touchscreens) | `popupClass`, `popupStyle` |
| Das Backdrop | hinter dem Sheet (Touchscreens) | `backdropClass`, `backdropStyle` |
| Der Inhalt | das Popup | `contentClass`, `contentStyle` |
| Die Presets | der Inhalt, zuerst (`presets`) | `presetsClass`, `presetsStyle`; jedes `presetClass`, `presetStyle` |
| Der Kalender | der Inhalt | `calendarClass`, `calendarStyle` und den Parts von [Calendar](./calendar.md#parts) |
| Die Zeile der Uhrzeit | unter dem Kalender (`timePrecision`) | `timeClass`, `timeStyle`; ihre Beschriftung `timeLabel` |
| Das Zeitfeld | die Zeile der Uhrzeit | `timeFieldClass`, `timeFieldStyle` und den Parts von [TimeField](./time-field.md#parts) |

<a id="keyboard"></a>

## Tastatur

| Taste | Aktion |
|---|---|
| Return (auf dem Trigger) | Öffnet das Popup oder schließt es. |
| Delete, Backspace (auf dem Trigger) | Löscht den Wert, solange das Popup geschlossen ist. |
| Escape | Schließt das Popup ohne Auswahl. |

Im Popup bewegen die Tasten des Kalenders zwischen den Tagen und wählen einen aus (siehe [Tastatur](./calendar.md#keyboard)), und die Tasten des Zeitfeldes bearbeiten die Uhrzeit (siehe [Tastatur](./time-field.md#keyboard)).

<a id="accessibility"></a>

## Barrierefreiheit

- Der Trigger ist für Screenreader eine Combobox: Ihr Label ist `accessibilityLabel`, ihr Wert das Datum, wie `dateFormat` es schreibt (standardmäßig `2026/10/28`, mit der Uhrzeit bei `timePrecision`), und sie gibt an, ob das Popup erweitert ist. `disabled` blendet sie ab.
- Die Tage des Kalenders sind Schaltflächen, die nach ihren ISO-Daten benannt sind (siehe [Barrierefreiheit](./calendar.md#accessibility)); die Presets sind Schaltflächen, die nach ihren Beschriftungen benannt sind; das Zeitfeld wird durch `timeAccessibilityLabel` benannt.
- Die Clear-Schaltfläche ist eine Schaltfläche, die durch `clearButtonAccessibilityLabel` benannt wird.

Siehe [Barrierefreiheit](../docs/accessibility.md) für Labels, Rollen und Ansagen im Allgemeinen.
