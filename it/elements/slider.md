---
title: "Slider"
description: "Il componente Slider: un valore, o un intervallo di due, selezionato lungo una traccia, con pressioni e trascinamenti sui touch screen e con il mouse, i tasti dello slider di WAI-ARIA e un valore per gli screen reader su ogni thumb, e una traccia, un indicatore, un intervallo e dei thumb che l'app può personalizzare nello stile."
group: base
demo: el-slider
source_hash: 5dfd7ea970e4cd98
---

# Slider

Uno slider sceglie un valore lungo una traccia (un volume, una luminosità), oppure un intervallo di due valori, con un thumb ciascuno (una fascia di prezzo). Gestisce da sé il proprio comportamento: una pressione sulla traccia sposta lì il thumb più vicino, un thumb segue il trascinamento, con un mouse o con un dito; i valori si agganciano a `step`; ogni thumb è una tappa del focus da tastiera e si muove con i tasti freccia, ed è un elemento regolabile per gli screen reader, con un proprio valore. L'aspetto è dell'app: un `Slider` non ha colori, dimensioni, raggi o animazioni propri. È composto da una traccia con un indicatore al suo interno, l'intervallo e i thumb sull'indicatore, poi i suoi figli (un'etichetta, il valore come testo), e l'app stilizza ogni parte.

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

`Slider` proviene da [`nsh/base`](../modules/nsh-base.md), il crate `nsh-base` in Rust. In Rust, `slider()` ne crea uno con un setter per ogni prop (`.value(..)`, `.thumb_style(..)`), un metodo listener per ogni evento (`.on_change(..)`), i metodi di stile tipizzati per lo slider stesso e `.child(..)` per la sua etichetta. Il suo valore è un `SliderValue`: `Single(f64)` oppure `Range(f64, f64)`.

<a id="value"></a>

## Valore

Il valore è un numero, oppure `[start, end]` per un intervallo con due thumb; la forma del valore decide quanti thumb ci sono. L'app lo possiede con `value` e imposta quello che `onChange` riporta, come per ogni controllo di `nsh/base`; oppure lascia il valore allo slider con `defaultValue`, e ascolta comunque le modifiche. Durante un trascinamento i thumb e l'intervallo seguono il puntatore nello stesso frame, in modo nativo; quando il puntatore si solleva, torna a mostrarsi il `value` dell'app, così come l'app lo ha impostato per l'ultima modifica del trascinamento; gli screen reader sentono i valori del trascinamento man mano che procede, mentre uno è in corso, e il suo valore finale in caso contrario.

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

- `onChange` riporta ogni nuovo valore richiesto dall'utente: a una pressione sulla traccia, a ogni passo di un trascinamento, per ogni tasto. Ogni segnalazione è un nuovo valore.
- `onChangeEnd` riporta il valore a cui la modifica è terminata, una sola volta: quando il puntatore si solleva dopo una pressione o un trascinamento che ha impostato un valore, e dopo ogni passo da tastiera o da screen reader (ognuno è una modifica completa). Salva o invia il valore qui.
- I valori si agganciano a `step`, contati a partire da `min` (`min={1} step={2}` dà 1, 3, 5, ...), e restano tra `min` e `max`; `max` è sempre raggiungibile, quindi l'ultimo passo è più corto quando l'intervallo non è un numero intero di passi. `step={0}` accetta qualsiasi valore.
- I thumb di un intervallo non si incrociano mai: un thumb trascinato si ferma contro l'altro. Un trascinamento che inizia su due thumb con lo stesso valore sposta quello che può andare nella direzione del puntatore.
- Il valore mostrato è quello dell'app, limitato da `min` e `max` (gli estremi di un intervallo in ordine), e un valore fuori dalla griglia del passo viene mostrato dov'è; la modifica successiva dell'utente lo aggancia.

## Props

| Prop | Rust | Tipo | Predefinito | Descrizione |
|---|---|---|---|---|
| `value` | `.value(..)` | `number \| [number, number]` | nessuno | Il valore (controllato): un numero, oppure un intervallo con due thumb. L'app imposta quello che `onChange` riporta. |
| `defaultValue` | `.default_value(..)` | `number \| [number, number]` | `0` | Il valore iniziale finché `value` non è impostato; lo slider mantiene poi il proprio. |
| `min` | `.min(..)` | `number` | `0` | Il valore minimo. |
| `max` | `.max(..)` | `number` | `100` | Il valore massimo; uno inferiore a `min` diventa `min`. |
| `step` | `.step(..)` | `number` | `1` | Il passo a cui i valori si agganciano, contato a partire da `min`; `0` accetta qualsiasi valore. |
| `scale` | `.scale(..)` | `"linear" \| "logarithmic"` | `"linear"` | Come i valori si distribuiscono lungo la traccia: in modo uniforme, oppure per ordini di grandezza (da 1 a 1000, un terzo del percorso corrisponde a 10). La scala logaritmica richiede `min` maggiore di 0; con un `min` inferiore è lineare. |
| `axis` | `.axis(..)` | `"horizontal" \| "vertical"` | `"horizontal"` | La direzione della traccia: `min` all'inizio (a sinistra, a destra in un layout da destra a sinistra), oppure in basso. Letta quando lo slider viene creato. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Nessuna modifica da puntatore, tastiera o screen reader; le classi `disabled:` si applicano allo slider e alle sue parti. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | nessuno | Ciò che gli screen reader dicono per il thumb (in un intervallo, quello finale). |
| `startAccessibilityLabel` | `.start_accessibility_label(..)` | `string` | `accessibilityLabel` | Ciò che gli screen reader dicono per il thumb iniziale di un intervallo. |
| `trackClass`, `trackStyle` | `.track_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | nessuno | La traccia: l'area che riceve pressioni e trascinamenti. |
| `indicatorClass`, `indicatorStyle` | `.indicator_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | nessuno | L'indicatore, la guida su cui si mappano i valori. |
| `rangeClass`, `rangeStyle` | `.range_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | nessuno | L'intervallo, da `min` fino al thumb (tra i thumb di un intervallo), posizionato dallo slider. |
| `thumbClass`, `thumbStyle` | `.thumb_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | nessuno | Ogni thumb, centrato sul proprio valore. |
| `children` | `.child(..)` | `JSX.Element` | nessuno | Il contenuto dopo la traccia: un'etichetta, il valore come testo. |
| `class`, `style` | metodi di stile | `string`, `StyleProp<ViewStyle>` | nessuno | Lo slider stesso: la colonna (o riga) attorno alla traccia e all'etichetta. |

<a id="events"></a>

## Eventi

| Evento | Rust | Payload | Quando |
|---|---|---|---|
| `onChange` | `.on_change(\|value: &SliderValue\| ..)` | `{ value: number \| [number, number] }` | L'utente ha richiesto un nuovo valore: una pressione sulla traccia, un passo di un trascinamento, un tasto, un incremento o decremento da screen reader. |
| `onChangeEnd` | `.on_change_end(\|value: &SliderValue\| ..)` | `{ value: number \| [number, number] }` | La modifica è terminata: il puntatore si è sollevato, un tasto o un passo da screen reader è stato completato. Una volta per modifica. |

<a id="parts"></a>

## Parti

| Parte | Dentro | Stilizzata con |
|---|---|---|
| Lo slider | | `class`, `style` |
| La traccia | lo slider, per prima | `trackClass`, `trackStyle` |
| L'indicatore | la traccia | `indicatorClass`, `indicatorStyle` |
| L'intervallo | l'indicatore, posizionato dai valori | `rangeClass`, `rangeStyle` |
| Un thumb (due in un intervallo) | l'indicatore, centrato sul proprio valore | `thumbClass`, `thumbStyle` |
| L'etichetta | lo slider, dopo la traccia | i propri elementi (`children`) |

La traccia riceve pressioni e trascinamenti. La lunghezza dell'indicatore è l'intervallo di valori, da `min` al suo bordo iniziale (in basso quando è verticale); lo slider vi posiziona l'intervallo e i thumb, con ogni thumb centrato sul proprio valore qualunque sia la sua dimensione. Due modi per disporli:

- La traccia è la guida (l'esempio sopra): `h-2 px-2 rounded-full bg-muted` con un indicatore `h-full`. Il padding mantiene i thumb dentro la guida a entrambe le estremità, e il `-ml-2` dell'intervallo fa partire il riempimento dal bordo della guida stessa.
- La traccia è una fascia attorno alla guida, più alta in modo che un dito la trovi su un touch screen: `h-8 justify-center` con un indicatore `h-2 rounded-full` (`w-8 items-center` e `w-2 h-full` su uno slider verticale).

Gli stati che le parti mostrano:

- Un thumb: `hover:` sotto il puntatore, `active:` mentre viene trascinato, `focus:` con il focus da tastiera, `disabled:`.
- La traccia: `active:` mentre una pressione su di essa trascina; è un `group`, quindi l'indicatore, l'intervallo e i thumb ereditano `group-hover:` e `group-active:` da essa.
- Ogni parte: `disabled:` finché lo è lo slider.

I thumb si muovono al variare del valore e seguono subito un trascinamento. L'animazione degli stati dei thumb è una scelta dell'app (`transition` per un thumb che si illumina su `hover:` e `active:`), e `motion-reduce:` la ferma per le persone che chiedono meno movimento. Il focus da tastiera appartiene a un thumb: `focus-within:` sulla traccia cerchia l'intera guida mentre un thumb ha il focus, e il `focus:outline-none` del thumb prende il posto del contorno di focus della piattaforma.

<a id="keyboard"></a>

## Tastiera

Su macOS e sul web ogni thumb è una tappa del focus da tastiera (Tab), e il thumb con il focus risponde ai tasti slider di WAI-ARIA:

| Tasto | Azione |
|---|---|
| Destra, Su | Un passo in su (anche su uno slider verticale). |
| Sinistra, Giù | Un passo in giù. |
| Page Up, Page Down | Un decimo dell'intervallo in su o in giù (lungo la scala), di almeno un passo. |
| Home, End | Fino al punto più basso o più alto che il thumb può raggiungere (l'inizio di un intervallo fino alla sua fine). |

In un layout da destra a sinistra uno slider orizzontale parte da destra, con il suo `min` all'estremità destra: Sinistra è un passo in su e Destra un passo in giù, e un trascinamento verso sinistra aumenta il valore. Uno slider verticale mantiene Destra e Su come passo in su.

Ogni tasto che cambia il valore riporta `onChange` e poi `onChangeEnd`. Le frecce e le pagine si ripetono finché sono tenute premute. I tasti raggiungono lo slider solo mentre nessun campo di testo è in modifica.

<a id="accessibility"></a>

## Accessibilità

- Ogni thumb è un elemento regolabile (`"adjustable"`, uno slider nel browser) con la propria etichetta, il proprio valore e i valori che può assumere: l'inizio di un intervallo da `min` fino alla fine, la fine dall'inizio fino a `max`, così gli screen reader leggono e impostano entrambi. Il valore viene pronunciato come il numero con i decimali del passo (`2.5`).
- Le azioni di incremento e decremento di uno screen reader (lo scorrimento in su e in giù di VoiceOver) spostano il thumb di un passo, come fanno i tasti freccia.
- I thumb sono gli elementi dello slider per gli screen reader, denominati da `accessibilityLabel` (e l'inizio di un intervallo da `startAccessibilityLabel`); un'etichetta visibile tra i suoi figli viene letta dove si trova.
- Mentre `disabled`, gli screen reader dicono che i thumb sono attenuati, e questi non accettano azioni.

Vedi [Accessibilità](../docs/accessibility.md) per etichette, ruoli e azioni in generale.

<a id="platform-notes"></a>

## Note sulle piattaforme

- Ogni piattaforma disegna ciò che l'app stilizza. Pressioni e trascinamenti vengono seguiti nel core, per un mouse, una penna o un dito, e una scroll view attorno allo slider non cattura un trascinamento iniziato su di esso.
- Tab sposta il focus da tastiera tra i thumb su macOS e sul web, dove il thumb con il focus risponde ai tasti dello slider.
- Screen reader: VoiceOver (iOS, macOS) e TalkBack regolano ogni thumb; UI Automation (Windows), l'accessibilità di GTK (Linux) e il browser (`role="slider"`, `aria-valuenow`, `aria-valuetext`) ne ricevono intervallo e valore.
