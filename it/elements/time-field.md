---
title: "TimeField"
description: "Il componente TimeField: un'ora del giorno modificata segmento per segmento, ore, minuti e secondi, con la tastiera o con il tastierino numerico di un telefono, stilizzato dall'app."
group: base
demo: el-date-picker
source_hash: 2c1c4d77c8f324de
---

# TimeField

Un campo orario modifica un'ora del giorno, un segmento alla volta: l'ora, il minuto, con `precision="second"` il secondo e con `hourCycle="h12"` AM o PM. L'ora di un promemoria, l'inizio di una riunione, gli orari di apertura di un negozio. È l'ora sotto il calendario di [DatePicker](./date-picker.md) con `timePrecision`, da sola nella pagina.

Il campo gestisce il comportamento: l'ora (quella dell'app, oppure la propria), quale segmento modificano i tasti, la digitazione e l'incremento delle cifre, e ciò che sentono gli screen reader. L'aspetto spetta all'app: applica lo stile ai segmenti e al `:` tra di essi, oppure disegna i segmenti da sé.

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

`TimeField` proviene da [`nsh/base`](../modules/nsh-base.md), il crate `nsh-base` in Rust. In Rust, `time_field()` ne crea uno con un setter per ogni prop (`.value(..)`, `.precision(..)`, `.hour_cycle(..)`) e un listener per ogni evento (`.on_change(..)`). La sua ora è un `TimeOfDay`, un `chrono::NaiveTime`.

<a id="value"></a>

## Valore

Il valore è un'ora del giorno su un orologio a 24 ore, come quella di un `<input type="time">` HTML: `"HH:MM"`, oppure `"HH:MM:SS"` con `precision="second"`, a seconda di quale `hourCycle` mostri il campo. Con `value`, il valore appartiene all'app: il campo lo mostra e segnala ogni modifica con `onChange({ value })`; l'app aggiorna `value` per seguirla. Se omesso, il campo conserva una propria ora, inizialmente da `defaultValue` (predefinito `00:00`).

`precision` è la più piccola unità che il campo modifica, `"minute"` (il valore predefinito) o `"second"`. `hourCycle` indica come vengono conteggiate le ore: `"h23"` (il valore predefinito) da 00 a 23, `"h12"` da 12 a 11 con un segmento AM/PM dopo i numeri.

<a id="editing"></a>

## Modifica

Un segmento è selezionato; i tasti lo modificano, come nel campo orario di `gpui-base`:

- Freccia su e Freccia giù incrementano o decrementano il segmento di uno e ricominciano da capo (da 59 a 00) senza riporto sul segmento successivo.
- Le cifre vi vengono digitate due alla volta: una cifra che non può iniziare un valore più lungo (un `7` nell'ora) completa il segmento e passa al successivo.
- `a` e `p` impostano AM e PM.
- Backspace e Delete reimpostano il segmento.

Un tocco su un segmento lo seleziona. Un tocco sul segmento AM/PM già selezionato lo commuta, dato che i telefoni non hanno i tasti `a` e `p`. I tasti arrivano a un unico campo di testo nativo dietro i segmenti, trasparente, come in [OtpInput](./otp-input.md): su telefoni e tablet mostra il tastierino numerico.

<a id="props"></a>

## Prop

| Prop | Rust | Tipo | Predefinito | Descrizione |
|---|---|---|---|---|
| `value` | `.value(..)` | `string` | nessuno | L'ora, gestita dall'app. |
| `defaultValue` | `.default_value(..)` | `string` | `"00:00"` | L'ora iniziale, in assenza di `value`. |
| `precision` | `.precision(..)` | `"minute" \| "second"` | `"minute"` | La più piccola unità che modifica. |
| `hourCycle` | `.hour_cycle(..)` | `"h23" \| "h12"` | `"h23"` | Come conteggia le ore; `"h12"` aggiunge un segmento AM/PM. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Nessun focus e nessuna modifica; gli stili `disabled:` si applicano al campo e ai suoi segmenti. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | nessuno | Il nome con cui gli screen reader chiamano il campo. |
| `segmentClass`, `segmentStyle` | `.segment_class(..)`, `.segment_style(..)` | `string`, `StyleProp<TextStyle>` | nessuno | Ogni segmento: `focus:` su quello selezionato mentre il campo ha il focus, `disabled:` con il campo; con `group`, il suo contenuto li segue (`group-focus:`, `group-disabled:`). |
| `separatorClass`, `separatorStyle` | `.separator_class(..)`, `.separator_style(..)` | `string`, `StyleProp<TextStyle>` | nessuno | Ogni `:` tra i numeri. |
| `renderSegment` | `.render_segment(..)` | `(segment: TimeFieldSegmentEntry) => JSX.Element` | nessuno | Il contenuto di un segmento, disegnato dall'app a partire da ciò che mostra; altrimenti la sua etichetta. |
| `class`, `style` | metodi di stile | `string`, `StyleProp<ViewStyle>` | nessuno | Il campo, attorno ai suoi segmenti (una riga). |

`renderSegment` riceve un `TimeFieldSegmentEntry`: `segment` (`"hour"`, `"minute"`, `"second"` o `"period"`), `value` (l'ora sull'orologio del campo, il minuto o il secondo; `0` per AM e `1` per PM) e `label` (due cifre, oppure `AM` / `PM`). Non riceve mai lo stato del segmento: il segmento è `focus:` mentre i tasti lo modificano e `disabled:` con il campo, e con `group` in `segmentClass` il suo contenuto li segue con `group-focus:` e `group-disabled:`. Quindi un segmento viene ridisegnato solo quando il suo valore cambia; lo spostamento tra i segmenti e il focus che va e viene non ridisegnano nulla:

```tsx
<TimeField
  segmentClass="group rounded-sm px-0.5 focus:bg-primary"
  renderSegment={(segment) => <Text class="text-sm tabular-nums text-foreground group-focus:text-primary-foreground">{segment.label}</Text>}
/>
```

<a id="events"></a>

## Eventi

| Evento | Rust | Descrizione |
|---|---|---|
| `onChange` | `.on_change(\|value\| ..)` | L'utente ha cambiato l'ora: `{ value }`. Imposta `value` per seguirla. Un `value` passato dall'app non viene mai segnalato. |

<a id="parts"></a>

## Parti

| Parte | Dove | Stilizzata con |
|---|---|---|
| Il campo | la radice, una riga | `class`, `style` |
| Un segmento | il campo: ora, minuto, secondo, AM/PM | `segmentClass`, `segmentStyle`, `renderSegment` (`group-focus:`, `group-disabled:` all'interno, sotto `group` in `segmentClass`) |
| Un separatore | il campo, tra due numeri | `separatorClass`, `separatorStyle` |

<a id="keyboard"></a>

## Tastiera

Tab raggiunge il campo con il segmento selezionato. Poi:

| Tasto | Azione |
|---|---|
| Freccia sinistra / Freccia destra | Il segmento precedente o successivo. |
| Tab / Shift+Tab | Il segmento successivo o precedente; Tab dall'ultimo e Shift+Tab dal primo escono dal campo. |
| Freccia su / Freccia giù | Incrementa o decrementa il segmento di uno, ricominciando da capo. |
| Da 0 a 9 | Digita nel segmento. |
| A / P | AM o PM. |
| Backspace, Delete | Reimposta il segmento. |

<a id="accessibility"></a>

## Accessibilità

- Il campo è un campo di testo identificato da `accessibilityLabel`; gli screen reader leggono l'ora che mostra. `disabled` lo attenua.
- Telefoni e tablet mostrano il tastierino numerico.

Consulta [Accessibility](../docs/accessibility.md) per etichette, ruoli e annunci in generale.
