---
title: "Calendar"
description: "Il componente Calendar: una data o un intervallo di date selezionato tra i mesi del calendario, con viste per mese e anno e supporto da tastiera, con stile definito dall'app."
group: base
demo: el-date-picker
source_hash: 48766bd0cb573ae0
---

# Calendar

Un calendario permette di scegliere una data, o con `range` un intervallo di date, tra mesi di giorni disposti in settimane: una scadenza in un modulo, le notti di un soggiorno, i giorni di un report. Mostra un mese o più mesi affiancati, scorre i mesi con Previous e Next e passa a una vista dei mesi dell'anno o a una pagina di anni per spostarsi lontano. È il calendario nel popup di [DatePicker](./date-picker.md), usato da solo nella pagina.

Il calendario gestisce il comportamento: il valore (dell'app o proprio), il mese mostrato, le viste, i giorni che non possono essere scelti, la tastiera e ciò che sentono gli screen reader. L'aspetto spetta all'app: questa stila l'intestazione, il corpo, ogni mese, ogni riga e ogni elemento, e disegna il contenuto degli elementi (i nomi dei mesi e dei giorni della settimana, il segno di oggi, la fascia dell'intervallo). La griglia riempie la larghezza che le viene data, come fanno le colonne di una tabella: i mesi se la dividono e gli elementi di una riga si dividono la riga in parti uguali, quindi un calendario nel foglio di un telefono occupa tutto lo schermo, mentre uno in un popup dimensionato sul contenuto mantiene la larghezza dei propri elementi (`flex-none` in `itemClass` o `monthClass` mantiene un elemento o un mese alla propria larghezza).

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

`Calendar` proviene da [`nsh/base`](../modules/nsh-base.md), il crate `nsh-base` in Rust. In Rust, `calendar()` ne crea uno con un setter per ogni prop (`.value(..)`, `.range(..)`, `.number_of_months(..)`) e un listener per ogni evento (`.on_change(..)`). Il suo valore è un `Date` (`Date::Single`, `Date::Range`, da un `chrono::NaiveDate` o da una coppia di essi), mentre i giorni che disabilita sono un `Matcher`.

## Value

Il valore è una data ISO, `"2026-10-28"`, come quella di un `<input type="date">` HTML; con `range` è `[start, end]`, e `null` indica nessuna data. Con `value` il valore appartiene all'app: il calendario lo mostra come selezionato e segnala una scelta con `onChange({ value })`; l'app imposta `value` per seguirla. Se omesso, il calendario mantiene un valore proprio, inizialmente da `defaultValue`.

`onChange` segnala solo valori completi, come il `Selected` di `gpui-base`: un giorno premuto, o la fine di un intervallo.

- Senza `range`, la pressione di un giorno lo sceglie.
- Con `range`, la prima pressione avvia l'intervallo e la seconda lo termina, con i giorni compresi nell'intervallo (ciascuno `selected`, estremi inclusi, vedi [Items](#items)). Una seconda pressione su un giorno precedente fa ripartire l'intervallo da quel giorno, così come una pressione a intervallo completo. Un intervallo parziale viene mostrato finché non è completo e solo allora viene segnalato.

Il calendario si apre sul mese del valore (l'inizio di un intervallo), altrimenti su quello di oggi.

## Months and views

`numberOfMonths` mostra quel numero di mesi affiancati, a partire da quello mostrato; Previous e Next li scorrono un mese alla volta. `firstDayOfWeek` è il giorno da cui iniziano le settimane, da `0` domenica (il valore predefinito) a `6` sabato.

L'intestazione contiene Previous, due toggle e Next:

- La vista dei giorni mostra i giorni dei mesi, ogni mese come una colonna con la riga dei giorni della settimana e le sue settimane; i giorni dei mesi precedente e successivo completano le settimane (`outside`, `data-outside`).
- Il toggle del mese (`monthToggle`) apre la vista dei mesi: i dodici mesi, in righe di tre. Sceglierne uno lo mostra nella vista dei giorni.
- Il toggle dell'anno (`yearToggle`) apre la vista degli anni: una pagina di 20 anni, in righe di cinque, con Previous e Next che scorrono le pagine. Sceglierne uno mostra quell'anno nella vista dei giorni. `yearRange` indica gli anni che le pagine attraversano, `[start, end)` (predefinito: da 50 anni prima di quello corrente a 50 dopo).

Con più mesi, l'intestazione mostra il titolo di ciascun mese al posto dei toggle (un elemento `monthToggle` che non accetta pressioni), come quello di `gpui-base`.

## Disabled dates

`disabledMatcher` indica i giorni che l'utente non può scegliere, il `Matcher` di `gpui-base`, in una di quattro forme:

| Forma | Disabilita |
|---|---|
| `[0, 6]` | Quei giorni della settimana, `0` domenica fino a `6` sabato. |
| `{ before, after }` | I giorni prima di `before` e dopo `after` (uno dei due può essere omesso). |
| `{ from, to }` | I giorni da `from` a `to`, inclusi (un estremo omesso è aperto). |
| `(date) => boolean` | I giorni per i quali la funzione restituisce `true`, data la data ISO di ogni giorno mostrato. |

La funzione viene interrogata una volta per ogni giorno mostrato, nel turno JS successivo, e non di nuovo per un giorno a cui ha già risposto: scorrere i mesi interroga solo sui giorni che portano con sé, quindi la sua risposta deve essere una funzione pura della data. Passare un'altra funzione interroga di nuovo. Un giorno disabilitato è `disabled:`: non accetta pressioni, e Return e Space non lo scelgono.

## Items

Ogni destinazione di pressione e ogni etichetta del calendario è un elemento: Previous, i toggle, Next, i giorni della settimana, i giorni, i mesi e gli anni. Ciascuno è disegnato in una parte stilata da `itemClass` e `itemStyle`, le cui varianti seguono il suo stato:

| Variante | L'elemento |
|---|---|
| `selected:` | È selezionato: la data, ogni giorno di un intervallo completo (estremi inclusi, come il range calendar di React Aria), l'inizio di un intervallo parziale, il mese o l'anno mostrato, il toggle della vista aperta. Gli screen reader lo annunciano come selezionato. |
| `disabled:` | Non accetta pressioni: una data disabilitata, un giorno della settimana, il titolo di un mese, Previous e Next nella vista dei mesi o agli estremi degli anni. |
| `focus:` | Ha la tastiera. |
| `data-range-start:`, `data-range-end:` | È il primo o l'ultimo giorno di un intervallo completo (un intervallo di un giorno è entrambi). |
| `data-range-middle:` | È un giorno interno a un intervallo completo, non un estremo. |
| `data-today:` | È oggi. |
| `data-outside:` | È un giorno del mese precedente o successivo, che completa le sue settimane. |

Le varianti `data-*` sono quelle di Tailwind (`data-range-start:` corrisponde a `[data-range-start]`), come quelle con cui il calendario di shadcn stila i suoi giorni; con `group` in `itemClass`, il contenuto le segue con `group-selected:`, `group-data-range-middle:`, e così via. `selected:` indica ogni giorno di un intervallo, quindi gli estremi di un intervallo prendono il proprio aspetto sopra di esso (le varianti successive prevalgono: `data-*` viene dopo `selected:`), e i suoi giorni centrali il proprio:

```tsx
<Calendar
  range
  itemClass="group rounded-md selected:bg-primary selected:text-primary-foreground data-range-middle:rounded-none data-range-middle:bg-accent data-range-middle:text-accent-foreground data-range-start:rounded-r-none data-range-end:rounded-l-none data-range-start:data-range-end:rounded-md"
/>
```

`renderItem` disegna il contenuto di un elemento a partire da ciò che è, un `CalendarEntry`, mai dal suo stato: il disegno viene fatto una sola volta e mantenuto mentre l'elemento è selezionato, ha il focus o fa parte di un intervallo, quindi i tasti, una scelta e il focus non ridisegnano nulla, e uno scorrimento dei mesi disegna una sola volta i giorni che porta con sé (un giorno mantiene il proprio disegno in base al mese e alla data: con più mesi, i mesi ancora mostrati mantengono il loro).

| Campo | Significato |
|---|---|
| `kind` | `"previous"`, `"monthToggle"`, `"yearToggle"`, `"next"`, `"weekday"`, `"day"`, `"month"` o `"year"`. |
| `value` | Il suo numero: il giorno del mese, il mese (da 1 a 12), l'anno, il giorno della settimana (`0` domenica fino a `6`); `0` per Previous e Next. |
| `date` | La data ISO di un giorno. |
| `year`, `month` | L'anno e il mese a cui appartiene: quelli di un giorno (il mese le cui settimane lo mostrano), quelli del toggle o del titolo di un mese, quelli di un mese della vista dei mesi; l'anno proprio di un toggle dell'anno e di un anno. `0` per Previous, Next e i giorni della settimana (e `month` per il toggle dell'anno e per gli anni). |
| `today` | Il giorno è oggi. |
| `outside` | Il giorno appartiene al mese precedente o successivo. |

Senza `renderItem`, un elemento mostra il proprio numero, e Previous e Next mostrano `‹` e `›`, come quelli di `gpui-base`; anche un giorno della settimana mostra il proprio numero, da `0` a `6`, poiché i nomi dei mesi e dei giorni della settimana sono parole dell'app, nella lingua dell'app.

## Props

| Prop | Rust | Tipo | Predefinito | Descrizione |
|---|---|---|---|---|
| `value` | `.value(..)` | `CalendarValue` | nessuno | Il valore, di proprietà dell'app. |
| `defaultValue` | `.default_value(..)` | `CalendarValue` | `null` | Il valore iniziale, senza `value`. |
| `range` | `.range(..)` | `boolean` | `false` | Sceglie un intervallo: la prima pressione lo avvia, la seconda lo termina. |
| `numberOfMonths` | `.number_of_months(..)` | `number` | `1` | Quanti mesi vengono mostrati affiancati. |
| `firstDayOfWeek` | `.first_day_of_week(..)` | `number` | `0` | Il giorno da cui iniziano le settimane, da `0` domenica a `6` sabato. |
| `disabledMatcher` | `.disabled_matcher(..)` | `DateMatcher` | nessuno | Le date che non possono essere scelte. |
| `yearRange` | `.year_range(..)` | `[number, number]` | 50 anni in più o in meno | Gli anni che la vista degli anni attraversa, `[start, end)`. |
| `previousAccessibilityLabel` | `.previous_accessibility_label(..)` | `string` | nessuno | Ciò che gli screen reader dicono per Previous. |
| `nextAccessibilityLabel` | `.next_accessibility_label(..)` | `string` | nessuno | Ciò che gli screen reader dicono per Next. |
| `headerClass`, `headerStyle` | `.header_class(..)`, `.header_style(..)` | `string`, `StyleProp<ViewStyle>` | nessuno | L'intestazione: Previous, i toggle (o i titoli dei mesi), Next. |
| `bodyClass`, `bodyStyle` | `.body_class(..)`, `.body_style(..)` | `string`, `StyleProp<ViewStyle>` | nessuno | Il corpo: i mesi affiancati, o le righe della vista dei mesi o degli anni. |
| `monthClass`, `monthStyle` | `.month_class(..)`, `.month_style(..)` | `string`, `StyleProp<ViewStyle>` | nessuno | Ogni mese della vista dei giorni. |
| `rowClass`, `rowStyle` | `.row_class(..)`, `.row_style(..)` | `string`, `StyleProp<ViewStyle>` | nessuno | Ogni riga: i giorni della settimana, una settimana, una riga di mesi o di anni. |
| `itemClass`, `itemStyle` | `.item_class(..)`, `.item_style(..)` | `string`, `StyleProp<TextStyle>` | nessuno | Ogni elemento: `selected:`, `disabled:`, `focus:`; di un giorno `data-range-start:`, `data-range-end:`, `data-range-middle:`, `data-today:`, `data-outside:` ([Items](#items)). |
| `renderItem` | `.render_item(..)` | `(item: CalendarEntry) => JSX.Element` | nessuno | Il contenuto di un elemento, disegnato dall'app a partire da ciò che l'elemento è; altrimenti il suo numero. |
| `class`, `style` | metodi di stile | `string`, `StyleProp<ViewStyle>` | nessuno | Il calendario: l'intestazione sopra il corpo. |

## Events

| Evento | Rust | Descrizione |
|---|---|---|
| `onChange` | `.on_change(\|value\| ..)` | L'utente ha scelto un valore completo: `{ value }`, un giorno o un intervallo. Imposta `value` per seguirlo. Un `value` passato dall'app non viene mai segnalato. |

## Parts

| Parte | Dove | Stilata con |
|---|---|---|
| Il calendario | la radice | `class`, `style` |
| L'intestazione | il calendario, per prima | `headerClass`, `headerStyle` |
| Il corpo | il calendario, dopo l'intestazione | `bodyClass`, `bodyStyle` |
| Un mese | il corpo (vista dei giorni) | `monthClass`, `monthStyle` |
| Una riga | un mese, o il corpo (viste dei mesi e degli anni) | `rowClass`, `rowStyle` |
| Un elemento | l'intestazione e le righe | `itemClass`, `itemStyle`, `renderItem` (`group-selected:`, `group-data-range-middle:`, ... all'interno, sotto `group` in `itemClass`) |

## Keyboard

I giorni sono una sola tappa di Tab: questo si posiziona sul giorno selezionato, altrimenti su oggi, altrimenti sul primo giorno mostrato. Poi:

| Tasto | Azione |
|---|---|
| Sinistra / Destra | Il giorno prima o dopo. |
| Su / Giù | Lo stesso giorno una settimana prima o dopo. |
| Home / End | Il primo o l'ultimo giorno della settimana. |
| Page Up / Page Down | Lo stesso giorno un mese prima o dopo. |
| Shift+Page Up / Shift+Page Down | Lo stesso giorno un anno prima o dopo. |
| Return, Space | Sceglie il giorno. |

In un layout da destra a sinistra le settimane scorrono da destra, quindi Sinistra è il giorno dopo e Destra il giorno prima; Su e Giù mantengono le settimane. Superare i mesi mostrati li fa scorrere. Previous, i toggle, Next, i mesi e gli anni accettano pressioni.
I giorni di `gpui-base` accettano solo pressioni; i tasti sono quelli di NSH, secondo il date picker dialog di WAI-ARIA.

## Accessibility

- Ogni giorno è un pulsante identificato dalla sua data ISO, selezionato quando è la data o un giorno dell'intervallo (estremi inclusi, come il range calendar di React Aria), attenuato quando è disabilitato.
- Previous e Next sono pulsanti identificati da `previousAccessibilityLabel` e `nextAccessibilityLabel`; i toggle, i mesi e gli anni sono pulsanti identificati da ciò che mostrano.

Vedi [Accessibility](../docs/accessibility.md) per etichette, ruoli e annunci in generale.
