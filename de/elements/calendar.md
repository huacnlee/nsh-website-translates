---
title: "Calendar"
description: "Die Calendar-Komponente: ein Datum oder ein Datumsbereich, ausgewählt aus Monaten mit Tagen, mit Monats- und Jahresansicht sowie Tastaturbedienung, gestaltet durch die App."
group: base
demo: el-date-picker
source_hash: 48766bd0cb573ae0
---


# Calendar

Ein Kalender wählt ein Datum aus, oder mit `range` einen Datumsbereich, aus Monaten mit in Wochen angeordneten Tagen: ein Fälligkeitsdatum in einem Formular, die Nächte eines Aufenthalts, die Tage eines Berichts. Er zeigt einen Monat oder mehrere nebeneinander, blättert die Monate mit Zurück und Weiter und wechselt zu einer Ansicht der Monate des Jahres oder zu einer Seite mit Jahren, um weit zu springen. Es ist der Kalender im Popup von [DatePicker](./date-picker.md), hier für sich allein auf der Seite.

Der Kalender besitzt das Verhalten: den Wert (den der App oder seinen eigenen), den angezeigten Monat, die Ansichten, die nicht wählbaren Tage, die Tastatur und das, was Screenreader vorlesen. Das Aussehen gehört der App: Sie gestaltet Header, Body, jeden Monat, jede Zeile und jedes Element und zeichnet den Inhalt der Elemente (die Namen der Monate und Wochentage, die Markierung für heute, das Band des Bereichs). Das Raster füllt die ihm zugewiesene Breite, wie die Spalten einer Tabelle: Die Monate teilen sie sich, und die Elemente einer Zeile teilen sich die Zeile zu gleichen Teilen. So überspannt ein Kalender im Sheet eines Smartphones den Bildschirm, und einer in einem am Inhalt ausgerichteten Popup behält die Breiten seiner Elemente (`flex-none` in `itemClass` oder `monthClass` lässt ein Element oder einen Monat bei seiner eigenen Breite).

```rust tabs
use nsh_base::{CalendarEntry, CalendarItemKind, Date, Matcher, calendar};
use nsh_core::prelude::*;

const MONTHS: [&str; 12] = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];
const WEEKDAYS: [&str; 7] = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

fn due_date() -> impl IntoElement {
    let due = signal(Date::default());
    calendar()
        .value(move || due.get())
        .on_change(move |next: &Date| due.set(*next))
        .disabled_matcher(Matcher::DayOfWeek(vec![0, 6]))
        .previous_accessibility_label("Previous month")
        .next_accessibility_label("Next month")
        .item_class("rounded-md selected:bg-primary selected:text-primary-foreground disabled:opacity-50")
        .render_item(|item: &CalendarEntry| {
            let label = match item.kind {
                CalendarItemKind::Previous => "‹".to_string(),
                CalendarItemKind::Next => "›".to_string(),
                CalendarItemKind::Weekday => WEEKDAYS[item.value as usize].to_string(),
                CalendarItemKind::MonthToggle | CalendarItemKind::Month => {
                    MONTHS[item.value as usize - 1].to_string()
                }
                _ => item.value.to_string(),
            };
            view()
                .w_8()
                .h_8()
                .items_center()
                .justify_center()
                .child(text(label).text_sm())
        })
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { Calendar, type CalendarValue } from "nsh/base";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function App() {
  const due = signal<CalendarValue>(null);
  return (
    <Calendar
      value={due()}
      onChange={({ value }) => due.set(value)}
      disabledMatcher={[0, 6]}
      previousAccessibilityLabel="Previous month"
      nextAccessibilityLabel="Next month"
      class="w-72 gap-2 rounded-lg border border-border p-3"
      headerClass="flex-row items-center justify-between"
      rowClass="flex-row justify-between"
      itemClass="group h-8 min-w-8 items-center justify-center rounded-md text-sm focus:ring-2 focus:ring-ring selected:bg-primary selected:text-primary-foreground data-range-middle:rounded-none data-range-middle:bg-accent data-range-middle:text-accent-foreground data-outside:text-muted-foreground disabled:opacity-50"
      renderItem={(item) => (
        <Text class={item.today ? "font-semibold" : ""}>
          {item.kind === "weekday"
            ? WEEKDAYS[item.value]
            : item.kind === "month" || item.kind === "monthToggle"
              ? MONTHS[item.value - 1]
              : item.kind === "previous"
                ? "‹"
                : item.kind === "next"
                  ? "›"
                  : String(item.value)}
        </Text>
      )}
    />
  );
}

mount(App);
```

`Calendar` stammt aus [`nsh/base`](../modules/nsh-base.md), dem `nsh-base`-Crate in Rust. In Rust erzeugt `calendar()` einen Kalender mit einem Setter pro Prop (`.value(..)`, `.range(..)`, `.number_of_months(..)`) und einem Listener pro Event (`.on_change(..)`). Sein Wert ist ein `Date` (`Date::Single`, `Date::Range`, aus einem `chrono::NaiveDate` oder einem Paar davon), die Tage, die er deaktiviert, ein `Matcher`.

<a id="value"></a>

## Wert

Der Wert ist ein ISO-Datum, `"2026-10-28"`, wie bei einem HTML-`<input type="date">`; mit `range` ist er `[start, end]`, und `null` bedeutet kein Datum. Mit `value` gehört er der App: Der Kalender zeigt ihn als ausgewählt an und meldet eine Auswahl mit `onChange({ value })`; die App setzt `value`, um ihr zu folgen. Wird er weggelassen, behält der Kalender seinen eigenen Wert, zunächst aus `defaultValue`.

`onChange` meldet nur vollständige Werte, wie `gpui-base` mit seinem `Selected`: ein angetippter Tag oder das Ende eines Bereichs.

- Ohne `range` wählt ein Tipp auf einen Tag diesen aus.
- Mit `range` beginnt der erste Tipp den Bereich und der zweite beendet ihn; die Tage dazwischen gehören zum Bereich (jeweils `selected`, die Enden eingeschlossen, siehe [Elemente](#items)). Ein zweiter Tipp auf einen früheren Tag beginnt den Bereich bei diesem Tag neu, ebenso ein Tipp, nachdem der Bereich vollständig ist. Ein halber Bereich wird angezeigt, bis er vollständig ist, und erst dann gemeldet.

Der Kalender öffnet sich auf dem Monat des Werts (bei einem Bereich dem Monat des Starts), sonst auf dem heutigen.

<a id="months-and-views"></a>

## Monate und Ansichten

`numberOfMonths` zeigt so viele Monate nebeneinander an, ab dem angezeigten; Zurück und Weiter blättern sie jeweils um einen Monat. `firstDayOfWeek` ist der Tag, an dem die Wochen beginnen, `0` Sonntag (der Standard) bis `6` Samstag.

Der Header enthält Zurück, zwei Umschalter und Weiter:

- Die Tagesansicht zeigt die Tage der Monate, jeder Monat als Spalte aus der Zeile seiner Wochentage und seinen Wochen; die Tage der Monate davor und danach füllen die Wochen (`outside`, `data-outside`).
- Der Monats-Umschalter (`monthToggle`) öffnet die Monatsansicht: die zwölf Monate in Zeilen zu je drei. Die Auswahl eines Monats zeigt ihn in der Tagesansicht.
- Der Jahres-Umschalter (`yearToggle`) öffnet die Jahresansicht: eine Seite mit 20 Jahren in Zeilen zu je fünf, wobei Zurück und Weiter die Seite blättern. Die Auswahl eines Jahres zeigt dieses Jahr in der Tagesansicht. `yearRange` sind die Jahre, durch die die Seiten laufen, `[start, end)` (Standard: 50 Jahre vor diesem bis 50 danach).

Bei mehreren Monaten zeigt der Header statt der Umschalter den Titel jedes Monats (ein `monthToggle`-Element, das keinen Tipp annimmt), wie bei `gpui-base`.

<a id="disabled-dates"></a>

## Deaktivierte Daten

`disabledMatcher` sind die Tage, die der Nutzer nicht auswählen kann, `gpui-base` mit seinem `Matcher`, in einer von vier Formen:

| Form | Deaktiviert |
|---|---|
| `[0, 6]` | Diese Wochentage, `0` Sonntag bis `6` Samstag. |
| `{ before, after }` | Die Tage vor `before` und nach `after` (jeweils optional). |
| `{ from, to }` | Die Tage von `from` bis `to` einschließlich (ein weggelassener Wert ist offen). |
| `(date) => boolean` | Die Tage, für die die Funktion `true` zurückgibt, wobei ihr das ISO-Datum jedes angezeigten Tages übergeben wird. |

Die Funktion wird einmal pro angezeigtem Tag im nächsten JS-Turn aufgerufen und nicht erneut für einen Tag, den sie bereits beantwortet hat: Das Blättern der Monate fragt nur nach den Tagen, die sie neu hinzubringen, daher muss ihre Antwort eine reine Funktion des Datums sein. Die Übergabe einer anderen Funktion fragt erneut. Ein deaktivierter Tag ist `disabled:`: Er nimmt keinen Tipp an, und Return und Leertaste wählen ihn nicht aus.

<a id="items"></a>

## Elemente

Jedes Tipp-Ziel und jedes Label des Kalenders ist ein Element: Zurück, die Umschalter, Weiter, die Wochentage, die Tage, die Monate und die Jahre. Jedes wird in einem Part gezeichnet, der mit `itemClass` und `itemStyle` gestaltet wird und dessen Varianten seinem Zustand folgen:

| Variante | Das Element |
|---|---|
| `selected:` | Ist ausgewählt: das Datum, jeder Tag eines vollständigen Bereichs (die Enden eingeschlossen, wie beim Range Calendar von React Aria), der Start eines halben Bereichs, der angezeigte Monat oder das angezeigte Jahr, der Umschalter der geöffneten Ansicht. Screenreader lesen es als ausgewählt vor. |
| `disabled:` | Nimmt keinen Tipp an: ein deaktiviertes Datum, ein Wochentag, der Titel eines Monats, Zurück und Weiter in der Monatsansicht oder an den Enden der Jahre. |
| `focus:` | Hat die Tastatur. |
| `data-range-start:`, `data-range-end:` | Ist der erste bzw. letzte Tag eines vollständigen Bereichs (ein Bereich aus einem Tag ist beides). |
| `data-range-middle:` | Ist ein Tag innerhalb eines vollständigen Bereichs, aber kein Ende. |
| `data-today:` | Ist heute. |
| `data-outside:` | Ist ein Tag des Monats davor oder danach, der die Wochen füllt. |

Die `data-*`-Varianten stammen von Tailwind (`data-range-start:` entspricht `[data-range-start]`), so wie der Kalender von shadcn seine Tage gestaltet; mit `group` in `itemClass` folgt der Inhalt ihnen mit `group-selected:`, `group-data-range-middle:` und so weiter. `selected:` steht für jeden Tag eines Bereichs, sodass die Enden eines Bereichs ihr Aussehen darüber erhalten (spätere Varianten gewinnen: `data-*` kommt nach `selected:`), und seine mittleren Tage ihres:

```tsx
<Calendar
  range
  itemClass="group rounded-md selected:bg-primary selected:text-primary-foreground data-range-middle:rounded-none data-range-middle:bg-accent data-range-middle:text-accent-foreground data-range-start:rounded-r-none data-range-end:rounded-l-none data-range-start:data-range-end:rounded-md"
/>
```

`renderItem` zeichnet den Inhalt eines Elements aus dem, was es ist, einem `CalendarEntry`, niemals aus seinem Zustand: Das Zeichnen geschieht einmal und bleibt erhalten, während das Element ausgewählt, fokussiert oder in einen Bereich aufgenommen wird. Die Tasten, eine Auswahl und der Fokus zeichnen also nichts neu, und ein Blättern der Monate zeichnet die Tage, die es bringt, je einmal (ein Tag behält seine Zeichnung anhand seines Monats und Datums: Bei mehreren Monaten behalten die weiterhin angezeigten Monate ihre).

| Feld | Bedeutung |
|---|---|
| `kind` | `"previous"`, `"monthToggle"`, `"yearToggle"`, `"next"`, `"weekday"`, `"day"`, `"month"` oder `"year"`. |
| `value` | Seine Nummer: der Tag des Monats, der Monat (1 bis 12), das Jahr, der Wochentag (`0` Sonntag bis `6`); `0` für Zurück und Weiter. |
| `date` | Das ISO-Datum eines Tages. |
| `year`, `month` | Das Jahr und der Monat, zu denen es gehört: bei einem Tag der Monat, dessen Wochen ihn zeigen; bei einem Monats-Umschalter oder -Titel sein Monat; bei einem Monat der Monatsansicht sein eigener; bei einem Jahres-Umschalter und einem Jahr das eigene Jahr. `0` für Zurück, Weiter und die Wochentage (und `month` für den Jahres-Umschalter und die Jahre). |
| `today` | Der Tag ist heute. |
| `outside` | Der Tag gehört zum Monat davor oder danach. |

Ohne `renderItem` zeigt ein Element seine Nummer, und Zurück und Weiter zeigen `‹` und `›`, wie bei `gpui-base`; auch ein Wochentag zeigt seine Nummer, `0` bis `6`, da die Namen der Monate und Wochentage die Wörter der App in der Sprache der App sind.

## Props

| Prop | Rust | Typ | Standard | Beschreibung |
|---|---|---|---|---|
| `value` | `.value(..)` | `CalendarValue` | keiner | Der Wert, der der App gehört. |
| `defaultValue` | `.default_value(..)` | `CalendarValue` | `null` | Der Anfangswert, ohne `value`. |
| `range` | `.range(..)` | `boolean` | `false` | Einen Bereich wählen: Der erste Tipp beginnt ihn, der zweite beendet ihn. |
| `numberOfMonths` | `.number_of_months(..)` | `number` | `1` | Wie viele Monate nebeneinander angezeigt werden. |
| `firstDayOfWeek` | `.first_day_of_week(..)` | `number` | `0` | Der Tag, an dem die Wochen beginnen, `0` Sonntag bis `6` Samstag. |
| `disabledMatcher` | `.disabled_matcher(..)` | `DateMatcher` | keiner | Die Daten, die nicht gewählt werden können. |
| `yearRange` | `.year_range(..)` | `[number, number]` | je 50 Jahre in beide Richtungen | Die Jahre, durch die die Jahresansicht blättert, `[start, end)`. |
| `previousAccessibilityLabel` | `.previous_accessibility_label(..)` | `string` | keiner | Was Screenreader für Zurück vorlesen. |
| `nextAccessibilityLabel` | `.next_accessibility_label(..)` | `string` | keiner | Was Screenreader für Weiter vorlesen. |
| `headerClass`, `headerStyle` | `.header_class(..)`, `.header_style(..)` | `string`, `StyleProp<ViewStyle>` | keiner | Der Header: Zurück, die Umschalter (oder die Titel der Monate), Weiter. |
| `bodyClass`, `bodyStyle` | `.body_class(..)`, `.body_style(..)` | `string`, `StyleProp<ViewStyle>` | keiner | Der Body: die Monate nebeneinander oder die Zeilen der Monats- bzw. Jahresansicht. |
| `monthClass`, `monthStyle` | `.month_class(..)`, `.month_style(..)` | `string`, `StyleProp<ViewStyle>` | keiner | Jeder Monat der Tagesansicht. |
| `rowClass`, `rowStyle` | `.row_class(..)`, `.row_style(..)` | `string`, `StyleProp<ViewStyle>` | keiner | Jede Zeile: die Wochentage, eine Woche, eine Zeile mit Monaten oder Jahren. |
| `itemClass`, `itemStyle` | `.item_class(..)`, `.item_style(..)` | `string`, `StyleProp<TextStyle>` | keiner | Jedes Element: `selected:`, `disabled:`, `focus:`; bei einem Tag `data-range-start:`, `data-range-end:`, `data-range-middle:`, `data-today:`, `data-outside:` ([Elemente](#items)). |
| `renderItem` | `.render_item(..)` | `(item: CalendarEntry) => JSX.Element` | keiner | Der Inhalt eines Elements, von der App aus dem gezeichnet, was das Element ist; andernfalls seine Nummer. |
| `class`, `style` | Style-Methoden | `string`, `StyleProp<ViewStyle>` | keiner | Der Kalender: der Header über dem Body. |

## Events

| Event | Rust | Beschreibung |
|---|---|---|
| `onChange` | `.on_change(\|value\| ..)` | Der Nutzer hat einen vollständigen Wert gewählt: `{ value }`, einen Tag oder einen Bereich. Setze `value`, um ihm zu folgen. Ein von der App übergebenes `value` wird nie gemeldet. |

## Parts

| Part | Wo | Gestaltet mit |
|---|---|---|
| Der Kalender | die Wurzel | `class`, `style` |
| Der Header | der Kalender, zuerst | `headerClass`, `headerStyle` |
| Der Body | der Kalender, nach dem Header | `bodyClass`, `bodyStyle` |
| Ein Monat | der Body (Tagesansicht) | `monthClass`, `monthStyle` |
| Eine Zeile | ein Monat oder der Body (Monats- und Jahresansicht) | `rowClass`, `rowStyle` |
| Ein Element | der Header und die Zeilen | `itemClass`, `itemStyle`, `renderItem` (`group-selected:`, `group-data-range-middle:`, ... darin, unter `group` in `itemClass`) |

<a id="keyboard"></a>

## Tastatur

Die Tage sind ein Tab-Stopp: Er landet auf dem ausgewählten Tag, sonst auf heute, sonst auf dem ersten angezeigten Tag. Danach gilt:

| Taste | Aktion |
|---|---|
| Links / Rechts | Der Tag davor oder danach. |
| Hoch / Runter | Derselbe Tag eine Woche davor oder danach. |
| Pos1 / Ende | Der erste oder letzte Tag der Woche. |
| Bild auf / Bild ab | Derselbe Tag einen Monat davor oder danach. |
| Umschalt+Bild auf / Umschalt+Bild ab | Derselbe Tag ein Jahr davor oder danach. |
| Return, Leertaste | Wählt den Tag aus. |

In einem Rechts-nach-links-Layout laufen die Wochen von rechts, sodass Links der Tag danach und Rechts der Tag davor ist; Hoch und Runter behalten die Wochen bei. Wer über die angezeigten Monate hinaus navigiert, blättert sie weiter. Zurück, die Umschalter, Weiter, die Monate und die Jahre nehmen Tipps an.
Die Tage von `gpui-base` nehmen nur Tipps an; die Tasten sind die von NSH, nach dem WAI-ARIA-Date-Picker-Dialog.

<a id="accessibility"></a>

## Barrierefreiheit

- Jeder Tag ist ein Button, benannt nach seinem ISO-Datum, ausgewählt, solange er das Datum oder ein Tag des Bereichs ist (die Enden eingeschlossen, wie beim Range Calendar von React Aria), und abgeblendet, solange er deaktiviert ist.
- Zurück und Weiter sind Buttons, benannt nach `previousAccessibilityLabel` und `nextAccessibilityLabel`; die Umschalter, Monate und Jahre sind Buttons, benannt nach dem, was sie anzeigen.

Siehe [Barrierefreiheit](../docs/accessibility.md) für Labels, Rollen und Ansagen im Allgemeinen.
