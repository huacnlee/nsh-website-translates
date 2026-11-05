---
title: "DatePicker"
description: "Il componente DatePicker: una data, un intervallo di date oppure una data e un'ora scelti da un calendario in un popup associato al suo trigger sui desktop e in un foglio (sheet) sui telefoni, con stile definito dall'app."
group: base
demo: el-date-picker
source_hash: ba9910b03fe753f3
---

# DatePicker

Un date picker imposta una data da un [Calendar](./calendar.md) che si apre dal trigger dell'app: una scadenza, un compleanno, con `range` i giorni di un viaggio, con `timePrecision` una data e un orario. Come [Select](./select.md), si apre come si aspetta ciascun dispositivo:

- Sui desktop e nei browser desktop, un popup in corrispondenza del trigger; aprendolo, la tastiera passa ai giorni.
- Su telefoni e tablet, uno sheet nella parte inferiore dello schermo sopra un backdrop.

Il picker gestisce il comportamento: il valore (quello dell'app, o il proprio), lo stato di apertura, il calendario, l'ora, i preset, la tastiera e ciò che sentono gli screen reader. L'aspetto è dell'app: disegna il trigger (con il valore, un placeholder, un'icona) e applica lo stile al popup, alle parti del calendario, ai preset e al campo dell'ora.

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

`DatePicker` proviene da [`nsh/base`](../modules/nsh-base.md), il crate `nsh-base` in Rust. In Rust, `date_picker()` ne crea uno con un setter per ogni prop (`.value(..)`, `.range(..)`, `.time_precision(..)`) e un listener per ogni evento (`.on_change(..)`). Il suo valore è un `DateTime` (`DateTime::Single`, `DateTime::Range`, da date `chrono` o da date e orari); `onChange` restituisce un `PickedDate`, il valore con la precisione dell'ora del picker.

<a id="value"></a>

## Valore

Il valore ha le forme degli input HTML: una data ISO, `"2026-10-28"`, come quella di `<input type="date">`; con `range` `[start, end]`; con `timePrecision` una data e un'ora, `"2026-10-28T09:30"` (`"2026-10-28T09:30:15"` ai secondi), come quella di `<input type="datetime-local">`; `null` indica nessun valore. Con `value`, il valore è dell'app: il picker lo mostra e segnala ogni modifica con `onChange({ value })`; l'app imposta `value` per seguirla. Se omesso, il picker mantiene un proprio valore, partendo da `defaultValue`.

- Una data singola: la pressione su un giorno imposta il valore e chiude il popup.
- Con `range`, la prima pressione avvia l'intervallo e la seconda lo termina, come in un [calendario](./calendar.md#value); l'intervallo completo imposta il valore e chiude il popup.
- Con `timePrecision` (solo per una data singola), sotto il calendario compare un campo dell'ora e ogni modifica dell'ora viene segnalata. Sui desktop, scegliere un giorno mantiene aperto il popup per l'ora e segnala la data con la sua ora; una nuova pressione sul giorno selezionato chiude il popup. Su telefoni e tablet, un tocco su un giorno lo sceglie con la sua ora e chiude lo sheet, come per una data singola; lo sheet si riapre per l'ora. Un giorno scelto prima di qualsiasi ora riceve `defaultTime` (predefinito `00:00`). `hourCycle` è il modo in cui il campo conta le ore.

`cleanable` aggiunge un pulsante di cancellazione finché c'è un valore: premerlo lo cancella (`onChange({ value: null })`). Viene dopo il trigger, non al suo interno, quindi premerlo non apre mai il popup; l'app lo posiziona e lo riempie (`clearButton`), come il [pulsante di cancellazione di Select](./select.md#value).

<a id="presets"></a>

## Preset

`presets` sono pulsanti accanto al calendario che impostano il valore: "Oggi", "Ultimi 7 giorni", "Domani alle 9". Ognuno è `{ label, value }`, `value` una data, un intervallo o date e orari, mantenuto così com'è; premerlo lo imposta e chiude il popup. `contentClass` dispone la colonna dei preset e il calendario con l'ora (una riga, `flex-row`); `presetsClass` applica lo stile alla colonna, `presetClass` a ciascun pulsante.

<a id="the-calendar"></a>

## Il calendario

Ogni prop di [Calendar](./calendar.md) tranne il valore viene passata a quelle del picker: `numberOfMonths`, `firstDayOfWeek`, `disabledMatcher`, `yearRange`, `previousAccessibilityLabel`, `nextAccessibilityLabel`, le parti (da `headerClass` a `itemStyle`) e `renderItem`. `calendarClass` e `calendarStyle` applicano lo stile al calendario stesso. Le sue viste e i suoi tasti sono quelli di un calendario.

La riga dell'ora (`timeClass`, `timeStyle`) contiene `timeLabel`, le parole dell'app per indicarla ("Ora"), all'inizio e il campo dell'ora (`timeFieldClass`, `timeFieldStyle`, `timeAccessibilityLabel`) alla fine: una riga con gli elementi centrati e distanziati (`flex-row items-center justify-between`, come quella di `gpui-component`). I segmenti del campo sono quelli di un [TimeField](./time-field.md) (`segmentClass`, `separatorClass`, `renderSegment`).

<a id="props"></a>

## Prop

| Prop | Rust | Tipo | Predefinito | Descrizione |
|---|---|---|---|---|
| `value` | `.value(..)` | `DatePickerValue` | nessuno | Il valore, gestito dall'app. |
| `defaultValue` | `.default_value(..)` | `DatePickerValue` | `null` | Il valore iniziale, senza `value`. |
| `range` | `.range(..)` | `boolean` | `false` | Sceglie un intervallo di date. |
| `open`, `defaultOpen` | `.open(..)`, `.default_open(..)` | `boolean` | `false` | Lo stato di apertura, dell'app o del picker stesso. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Resta chiuso e non accetta pressioni né il focus da tastiera. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | nessuno | Come lo chiamano gli screen reader. |
| `dateFormat` | `.date_format(..)` | `string` | `"%Y/%m/%d"` e l'ora | Come gli screen reader leggono il valore, nel formato di `chrono`. |
| `timePrecision` | `.time_precision(..)` | `"minute" \| "second"` | nessuno | Modifica anche l'ora del giorno, fino a questo livello. |
| `hourCycle` | `.hour_cycle(..)` | `"h23" \| "h12"` | `"h23"` | Come il campo dell'ora conta le ore. |
| `defaultTime` | `.default_time(..)` | `string` | `"00:00"` | L'ora che riceve una data prima che l'utente ne imposti una. |
| `cleanable` | `.cleanable(..)` | `boolean` | `false` | Un pulsante di cancellazione finché c'è un valore. |
| `presets` | `.presets(..)` | `DateRangePreset[]` | `[]` | Pulsanti nel popup che impostano il valore. |
| `numberOfMonths`, `firstDayOfWeek`, `disabledMatcher`, `yearRange` | come in `Calendar` | come in `Calendar` | come in `Calendar` | Mesi, settimane, date disabilitate e anni del calendario. |
| `previousAccessibilityLabel`, `nextAccessibilityLabel` | come in `Calendar` | `string` | nessuno | Ciò che gli screen reader dicono per Precedente e Successivo del calendario. |
| `placement`, `align`, `offset`, `margin` | `.placement(..)`, ... | come in `Select` | `"bottom"`, `"start"`, 0, 0 | Desktop: dove si colloca il popup rispetto al trigger. |
| `popupClass`, `popupStyle` | `.popup_class(..)`, `.popup_style(..)` | `string`, `StyleProp<ViewStyle>` | nessuno | Il popup (desktop) o lo sheet (touch screen). |
| `backdropClass`, `backdropStyle` | `.backdrop_class(..)`, `.backdrop_style(..)` | `string`, `StyleProp<ViewStyle>` | nessuno | Il backdrop dietro lo sheet. |
| `contentClass`, `contentStyle` | `.content_class(..)`, `.content_style(..)` | `string`, `StyleProp<ViewStyle>` | nessuno | Il contenuto del popup: i preset accanto al calendario e l'ora. |
| `presetsClass`, `presetsStyle` | `.presets_class(..)`, `.presets_style(..)` | `string`, `StyleProp<ViewStyle>` | nessuno | La colonna dei preset. |
| `presetClass`, `presetStyle` | `.preset_class(..)`, `.preset_style(..)` | `string`, `StyleProp<TextStyle>` | nessuno | Il pulsante di ciascun preset. |
| `calendarClass`, `calendarStyle` | `.calendar_class(..)`, `.calendar_style(..)` | `string`, `StyleProp<ViewStyle>` | nessuno | Il calendario. |
| `headerClass` … `itemStyle` | come in `Calendar` | come in `Calendar` | nessuno | L'intestazione, il corpo, i mesi, le righe e gli elementi del calendario. |
| `renderItem` | `.render_item(..)` | `(item: CalendarEntry) => JSX.Element` | nessuno | Ogni elemento del calendario, disegnato dall'app in base a ciò che è; i suoi stati sono le classi degli elementi, come in `Calendar`. |
| `timeClass`, `timeStyle` | `.time_class(..)`, `.time_style(..)` | `string`, `StyleProp<ViewStyle>` | nessuno | La riga dell'ora: l'etichetta all'inizio, il campo alla fine. |
| `timeLabel` | `.time_label(..)` | `JSX.Element` | nessuno | Ciò che la riga dell'ora mostra prima del campo. |
| `timeFieldClass`, `timeFieldStyle` | `.time_field_class(..)`, `.time_field_style(..)` | `string`, `StyleProp<ViewStyle>` | nessuno | Il campo dell'ora. |
| `timeAccessibilityLabel` | `.time_accessibility_label(..)` | `string` | nessuno | Come gli screen reader chiamano il campo dell'ora. |
| `segmentClass`, `segmentStyle`, `separatorClass`, `separatorStyle`, `renderSegment` | come in `TimeField` | come in `TimeField` | nessuno | I segmenti del campo dell'ora e `:`. |
| `clearButtonClass`, `clearButtonStyle` | `.clear_button_class(..)`, `.clear_button_style(..)` | `string`, `StyleProp<ViewStyle>` | nessuno | Il pulsante di cancellazione (`cleanable`). |
| `clearButton` | `.clear_button(..)` | `JSX.Element` | nessuno | Il contenuto del pulsante di cancellazione. |
| `clearButtonAccessibilityLabel` | `.clear_button_accessibility_label(..)` | `string` | nessuno | Come gli screen reader chiamano il pulsante di cancellazione. |
| `trigger` | `.trigger(..)` | `JSX.Element` | nessuno | Ciò che apre il popup quando viene premuto; il popup è posizionato rispetto a esso. |
| `class`, `style` | metodi di stile | `string`, `StyleProp<ViewStyle>` | nessuno | La vista attorno al trigger. |

<a id="events"></a>

## Eventi

| Evento | Rust | Descrizione |
|---|---|---|
| `onChange` | `.on_change(\|value\| ..)` | Il valore è cambiato (un giorno, la fine di un intervallo, un preset, l'ora, il pulsante di cancellazione): `{ value }`. Imposta `value` per seguirlo. |
| `onOpenChange` | `.on_open_change(\|e\| ..)` | Il popup si è aperto o chiuso, con il motivo (`{ open, reason }`). Imposta `open` per seguirlo. |
| `onOpen`, `onClose` | `.on_open(..)`, `.on_close(..)` | Il popup è mostrato, o scomparso. |
| `onCancel` | `.on_cancel(..)` | L'utente ha chiuso il popup senza una scelta (Escape o indietro, una pressione all'esterno o sul backdrop). |

<a id="parts"></a>

## Parti

| Parte | Dove | Stile |
|---|---|---|
| Il trigger | la vista del picker | l'elemento dell'app (`trigger`) |
| Il pulsante di cancellazione | la vista del picker, dopo il trigger (`cleanable`, finché c'è un valore) | `clearButtonClass`, `clearButtonStyle`; il suo contenuto `clearButton` |
| Il popup o lo sheet | sopra a tutto, in corrispondenza del trigger (desktop) o in basso (touch screen) | `popupClass`, `popupStyle` |
| Il backdrop | dietro lo sheet (touch screen) | `backdropClass`, `backdropStyle` |
| Il contenuto | il popup | `contentClass`, `contentStyle` |
| I preset | il contenuto, per primi (`presets`) | `presetsClass`, `presetsStyle`; ciascuno `presetClass`, `presetStyle` |
| Il calendario | il contenuto | `calendarClass`, `calendarStyle`, e le parti di [Calendar](./calendar.md#parts) |
| La riga dell'ora | sotto il calendario (`timePrecision`) | `timeClass`, `timeStyle`; la sua etichetta `timeLabel` |
| Il campo dell'ora | la riga dell'ora | `timeFieldClass`, `timeFieldStyle`, e le parti di [TimeField](./time-field.md#parts) |

<a id="keyboard"></a>

## Tastiera

| Tasto | Azione |
|---|---|
| Return (sul trigger) | Apre il popup, o lo chiude. |
| Delete, Backspace (sul trigger) | Cancella il valore mentre il popup è chiuso. |
| Escape | Chiude il popup senza una scelta. |

Nel popup, i tasti del calendario si spostano tra i giorni e ne scelgono uno (vedi [Keyboard](./calendar.md#keyboard)) e quelli del campo dell'ora modificano l'ora (vedi [Keyboard](./time-field.md#keyboard)).

<a id="accessibility"></a>

## Accessibilità

- Il trigger è un combobox per gli screen reader: la sua etichetta è `accessibilityLabel`, il suo valore è la data come la scrive `dateFormat` (per impostazione predefinita `2026/10/28`, con l'ora in `timePrecision`), e indica se il popup è espanso. `disabled` lo attenua.
- I giorni del calendario sono pulsanti denominati dalle loro date ISO (vedi [Accessibility](./calendar.md#accessibility)); i preset sono pulsanti denominati dalle loro etichette; il campo dell'ora è denominato da `timeAccessibilityLabel`.
- Il pulsante di cancellazione è un pulsante denominato da `clearButtonAccessibilityLabel`.

Vedi [Accessibility](../docs/accessibility.md) per etichette, ruoli e annunci in generale.
